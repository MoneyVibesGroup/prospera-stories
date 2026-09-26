# STORY-542 : Éliminations — les opérations réciproques ne touchent pas le résultat, les résultats internes si

Status: review

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation` (aucun contrat d'événement : **un seul dépôt**)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-541** (les comptes sont homogènes avant d'être éliminés)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait, et la distinction qui commande toute la story

Il y a **deux familles d'éliminations**, elles n'ont rien à voir, et les confondre est l'erreur
classique :

| Famille | Exemples | Effet sur le résultat consolidé |
|---|---|---|
| **Opérations réciproques** | créance de A sur B ↔ dette de B envers A · vente de A à B ↔ achat de B à A | ⚪ **aucun** — on gonfle le bilan et le CR, pas le résultat |
| **Résultats internes** | marge de A sur un **stock encore détenu** par B · plus-value de cession interne d'une immobilisation | 🔴 **le résultat baisse** — le groupe ne peut pas faire de bénéfice avec lui-même |

⇒ **La première famille est un nettoyage de présentation. La seconde est un retraitement de
résultat.** Un module qui n'élimine que la première produit des états consolidés qui paraissent
propres et dont le **résultat est surévalué** — et rien ne le signale.

⚡ **Et le cas le plus fréquent est le plus subtil :** la marge interne ne s'élimine que sur la part
**encore en stock** à la clôture. Ce qui a été revendu hors groupe est un vrai bénéfice.

## Critères d'acceptation

- [ ] AC-1 — Les **opérations réciproques** sont appariées entre entités du périmètre, et éliminées
      **symétriquement** (créance ↔ dette, charge ↔ produit). Un appariement **déséquilibré** est
      **signalé, jamais forcé** : c'est presque toujours un décalage de date ou un litige réel.
- [ ] AC-2 — ⛔ **Les éliminations sont DÉCLARÉES puis PROPOSÉES** (Q2 de STORY-531). Le produit ne
      peut pas deviner que le compte client de A est le compte fournisseur de B ; il le **propose**
      quand les montants concordent, et **un proposé n'a aucun effet tant qu'il n'est pas confirmé**.
      Même doctrine que le rapprochement bancaire.
- [ ] AC-3 — Les **marges internes sur stocks** sont éliminées **sur la part encore détenue** à la
      clôture, en pourcentage de marge déclaré ou calculé — et la part revendue hors groupe est
      **conservée en résultat**.
- [ ] AC-4 — Les **plus-values de cession interne d'immobilisations** sont éliminées, et
      **l'amortissement excédentaire qu'elles ont généré est repris chaque exercice** jusqu'à la
      sortie du bien. ⚠️ C'est le retraitement qui **court sur plusieurs exercices** : l'oublier la
      2ᵉ année est plus fréquent que l'oublier la 1ʳᵉ.
- [ ] AC-5 — ⚠️ **Une élimination de résultat interne a un effet d'impôt différé** ⇒ elle alimente
      [[STORY-545]]. Une élimination réciproque n'en a **aucun**.
- [ ] AC-6 — Une élimination sur une entité en **intégration proportionnelle** se fait **à hauteur du
      pourcentage d'intégration**, pas à 100 %.
- [ ] AC-7 — Chaque élimination est **tracée, justifiée et réversible**, dans le journal de
      consolidation (STORY-541 AC-3).

## Notes

- Voir [[STORY-541]], [[STORY-544]] (la part des minoritaires dans les résultats internes),
  [[STORY-545]], [[STORY-531]].
- ✅ **Ce que STORY-531 a posé (2026-09-24)** — la moitié DÉCLARÉE de la Q2 : `POST …/consolidation/
  exercices/:exerciceId/eliminations` écrit une élimination équilibrée, justifiée, numérotée, entre la
  mère et des sociétés intégrées GLOBALEMENT, annulable avec motif (journal `ecritures_consolidation`).
  Restent à cette story : l'origine `PROPOSEE` (`ORIGINES_ECRITURE` ne connaît que `DECLAREE` — un
  proposé ne doit avoir AUCUN effet tant qu'il n'est pas confirmé), les résultats internes, l'effet
  d'impôt, la reprise pluriannuelle, et l'**AC-6** : une société intégrée proportionnellement est
  aujourd'hui REFUSÉE à la déclaration (`409 SOCIETE_NON_ELIMINABLE`, raison
  `INTEGRATION_PROPORTIONNELLE`) plutôt qu'éliminée à 100 % — c'est ce refus que le prorata lèvera. Les
  traitements `ELIMINATIONS_PROPOSEES` et `RESULTATS_INTERNES` sont publiés `NON_TRAITE`.

---

# Cadrage — fait AVANT toute ligne de code

Sources : **AUDCIF 2017, art. 81 et 86** (fondements déjà publiés par `traitements.ts` : 86 4° résultats
internes, 86 6° réciproques) ; la doctrine détaillée que le SYSCOHADA révisé reprend du CRC 99-02 — relue
verbatim dans le **règlement ANC n° 2020-01** (art. 251-1, 251-2, 261-3 à 261-5) ; le code de `bilan-service`
(`dev` @ `8d6791a`) et de `balance-service` (rapprochement bancaire STORY-090, registre des immobilisations
STORY-526/527) ; les plans comptables embarqués ; les fiches STORY-531, 541, 543 à 545.

## Les constats mesurés

### M1 — ⚡⚡ Une balance n'a pas de tiers : rien ne dit quel compte d'une société porte ses opérations avec quelle autre

`LigneSolde { compte, soldeDebiteur, soldeCrediteur }` — aucune contrepartie. Les plans embarqués s'arrêtent au
compte principal (`plan-comptable-syscohada-2.2.json` : 179 comptes, huit à quatre chiffres) : ni `4012`/`4112`
« groupe », ni `6013`/`7013` ; seuls `181` (dettes liées à des participations, groupe) et `46` (associés et
groupe) nomment le groupe. ⇒ Proposer « par concordance de montants » sur toute la balance apparierait au
hasard deux montants égaux — et, pire, **les titres de la mère contre le capital de la filiale**, qui ne sont
pas une opération réciproque mais l'élimination des titres de STORY-543. Le produit ne peut pas deviner ; il
peut **rapprocher** ce qu'on lui a dit être réciproque.

### M2 — Le rapprochement bancaire du programme est le modèle de la doctrine — à une exception près

`balance-service/rapprochement` (STORY-090) : `PROPOSE` **n'a aucun effet**, seul `CONFIRME` engage ; les
propositions sont volatiles ; « le système propose, il ne qualifie pas » ; ce qui ne s'apparie pas (les écarts)
est la vraie valeur. ⚠️ Il applique d'office les appariements de confiance `HAUTE` : l'AC-2 l'interdit ici —
**rien** n'a d'effet sans confirmation.

### M3 — Le texte tranche le prorata et le porteur du résultat interne

- **ANC 2020-01, art. 251-1** : créances, dettes, produits et charges réciproques éliminés **en totalité** ;
  **art. 251-2** : résultats internes éliminés **à 100 %, puis répartis** entre groupe et minoritaires **dans
  l'entité qui a réalisé le résultat** (le vendeur) ; les actifs reviennent à leur valeur **préalable** à
  l'opération interne (coût historique consolidé) ; l'impôt est corrigé ; ⚠️ *« les dividendes intra-groupes
  sont également éliminés en totalité »*.
- **Art. 261-3 / 261-4** : entre une société intégrée globalement et une société intégrée
  proportionnellement, réciproques et résultats internes s'éliminent **dans la limite du pourcentage
  d'intégration de la société contrôlée conjointement** — le reste est une créance ou une dette envers les
  tiers. **Art. 261-5** : entre deux sociétés intégrées proportionnellement, **le plus faible des deux**.
  ⇒ une seule règle : le **plus faible pourcentage d'intégration** des sociétés que l'écriture mouvemente.

### M4 — Chaque consolidation repart des liasses : un résultat interne éliminé en N revient en N+1

Les liasses ne sont jamais touchées (541 AC-3). En N+1, les réserves individuelles du vendeur contiennent la
marge de N ; le stock de N a été revendu — la marge est **réalisée** en N+1 ; la plus-value interne continue de
gonfler les dotations de l'acquéreur. Sans report, le résultat de N+1 est faux dans les deux sens (stock :
sous-évalué de la marge réalisée ; plus-value : surévalué de l'amortissement excédentaire) — et l'AC-3 ne tient
plus (« la part revendue hors groupe est **conservée en résultat** » : en N+1, c'est toute la marge de N).

### M5 — Aucune donnée ne dit quel stock vient d'où, à quelle marge, ni quel bien a été cédé en interne

`stock-service` n'existe pas ; l'inventaire de STORY-534 ne connaît que SI/SF par compte ; le registre des
immobilisations (`balance-service`) ignore vendeur et acquéreur. Comme en STORY-541 (M1), le montant est un
**calcul du cabinet** que le produit héberge, reporte et contrôle.

### M6 — L'intégration proportionnelle est refusée, et les éliminations s'appliquent à 100 %

`refuserSocietesNonEliminables` rend `409 SOCIETE_NON_ELIMINABLE` (`INTEGRATION_PROPORTIONNELLE`) et
`refuserSiEcrituresHorsPerimetre` refuse l'agrégat pour une élimination active hors IG ; `agreger` impute les
éliminations **telles quelles** (aucune mise à l'échelle).

### M7 — Deux statuts `requis`, et « appliqué » serait vide de sens sans décision

`ELIMINATIONS_PROPOSEES` et `RESULTATS_INTERNES` sont requis, `NON_TRAITE`. Le produit ne peut pas savoir
qu'un groupe n'a **aucune** marge interne en stock : les passer `APPLIQUE` faute de déclaration serait
exactement l'erreur que la story dénonce (« des états qui paraissent propres, un résultat surévalué, et rien ne
le signale »). ⚠️ Et le libellé de `RESULTATS_INTERNES` promet les **dividendes**, qu'aucun AC ne couvre — et
dont l'effet d'impôt **contredit l'AC-5** (différence permanente ; l'impôt de distribution est l'art. 86 5°,
STORY-686) et dont le prorata diffère (le pourcentage du **bénéficiaire**, pas le plus faible).

### M8 — Le journal ne connaît que `DECLAREE`, et lit tout `E11000` comme une course au numéro

`ORIGINES_ECRITURE = ['DECLAREE']` ; l'immuabilité n'admet que `ACTIVE → ANNULEE` ; `ecrire` réessaie sur
**tout** `E11000` — un second index unique y serait pris pour une course et rendu `CONFLIT_CONCURRENT`.

### M9 — Les bornes (leçon de STORY-530 et de la revue de sécurité de STORY-541)

Le report des résultats internes relit le journal des exercices passés de la mère, dont le nombre n'est borné
nulle part : son volume se juge **avant** de charger. Le rapprochement ne coûte que les soldes déjà bornés
(`LIGNES_AGREGEES_MAX`) et quelques comptes par appariement.

## Les décisions

**D-542-1 — Les appariements se DÉCLARENT, les éliminations se PROPOSENT (AC-1, AC-2, M1, M2).** Collection
`appariements_consolidation`, au **dossier de la mère**, valable pour toutes ses consolidations : numéro (1, 2,
…), `sens` (`CREANCE_DETTE` | `PRODUIT_CHARGE`), **deux sociétés distinctes** — la mère ou un dossier du cabinet,
sinon `404 SOCIETE_INTROUVABLE` (anti-énumération) ; leur intégration se juge par exercice — chacune avec **1 à
10 comptes exacts** de sa liasse ; justification, auteur, date ; **annulable avec motif**, jamais réécrit
(garde de schéma). ⛔ **Un compte d'une société n'appartient qu'à un appariement actif** (sinon il serait
éliminé deux fois) : index unique partiel sur les clés `société|compte` → `409 COMPTE_DEJA_APPARIE`. Un compte
qui mêle plusieurs partenaires ne s'apparie pas (hook).

**D-542-2 — Le rapprochement (AC-1).** Calculé à la lecture, pour l'exercice, sur les liasses **figées** :
pour chaque appariement actif, le net de chaque côté (Σ débits − crédits des comptes déclarés).
**Concordant** ⇔ les deux nets sont opposés et non nuls, **à l'unité** ⇒ `PROPOSEE`, avec les lignes qui
soldent chaque compte (100 %) et le pourcentage qui s'appliquera. Sinon : `DESEQUILIBREE` (les deux nets et
l'écart — **signalé, jamais forcé**), `SANS_SOLDE` (rien à éliminer), `NON_APPLICABLE` (une société n'est pas
intégrée cette année — sa raison). Déjà traité : `CONFIRMEE` (élimination confirmée active), `TRAITEE`
(élimination déclarée qui le cite), et ⚡ `PERIMEE` — confirmée sur des soldes qui ont changé depuis (liasse
rouverte puis refigée) : l'élimination reste appliquée, mais **nommée**. Publié par `GET
…/eliminations/propositions` et dans l'agrégat.

**D-542-3 — La confirmation (AC-2, AC-7).** `POST …/eliminations/propositions/:appariementId/confirmation` :
la proposition est **recalculée** sur les liasses figées du moment — jamais reçue du client —, puis écrite au
journal : nature `ELIMINATION`, **origine `PROPOSEE`**, l'appariement cité (identifiant, numéro), les
**sources** (jeu, version, empreinte des deux liasses), justification = celle de l'appariement, auteur = qui
confirme. Refus : appariement inconnu (`404 APPARIEMENT_INTROUVABLE`) ou annulé (`409
APPARIEMENT_DEJA_ANNULE`), société non éliminable, liasse non figée, **non proposable** (`409
APPARIEMENT_NON_PROPOSE`, l'état et les nets), déjà éliminé dans l'exercice (`409 APPARIEMENT_DEJA_ELIMINE` —
index unique partiel `(exercice, appariement)` sur les écritures actives : le vrai filet). Un proposé n'est
**jamais écrit** : il ne peut avoir aucun effet.

**D-542-4 — Déclarer une élimination (AC-6, AC-1).** `POST …/eliminations` accepte désormais les sociétés
intégrées **proportionnellement** (restent refusées : mise en équivalence, hors périmètre, méthodes
divergentes, hors groupe), et un `appariementId` facultatif : l'élimination déclarée **traite** cet appariement
pour l'exercice — c'est ainsi qu'un déséquilibre analysé (marchandise en transit, facture non reçue) se résout,
à la main, jamais forcé. Ses lignes visent exactement les deux sociétés de l'appariement (`409
ELIMINATION_HORS_APPARIEMENT`). ⛔ Une élimination de **trois sociétés ou plus** dont les pourcentages
diffèrent n'a pas de prorata défini : `409 ELIMINATION_A_REPARTIR` à la déclaration comme à l'agrégat (un
périmètre ré-arrêté peut la rendre telle) — elle se déclare par paires.

**D-542-5 — Le prorata (AC-6, M3).** À l'agrégat, chaque écriture d'élimination — déclarée ou confirmée — et
chaque résultat interne s'applique au **plus faible pourcentage d'intégration** des sociétés qu'il
mouvemente : IG ↔ IG 100 % (l'identité — STORY-531 inchangée), IG ↔ IP p, IP ↔ IP min(p₁, p₂). Montants
déclarés à 100 %, mis à l'échelle au plus fort reste, colonne par colonne, écriture par écriture (elle reste
équilibrée — D-541-11). Le pourcentage appliqué est publié.

**D-542-6 — Les résultats internes se DÉCLARENT (AC-3, AC-4, M5).** Nature **`RESULTAT_INTERNE`** au journal,
vendeur et détenteur **distincts**, chacun la mère ou une société intégrée (IG ou IP), montants à 100 % :
- **`MARGE_STOCK`** (AC-3) — `compteStock` (du détenteur), `compteResultat` (du vendeur), `stockDetenu` (le
  stock intragroupe **encore détenu à la clôture**, au prix de cession interne) et la marge : **déclarée**
  (`tauxPointsDeBase`, sur le prix de vente) ou **calculée** depuis le coût chez le vendeur (`coutVendeur`,
  marge = stock − coût). Marge = arrondi au plus proche, demi vers le haut ; nulle ⇒ c'est une omission.
- **`PLUS_VALUE_CESSION`** (AC-4) — `dateCession` (dans l'exercice), plus-value **déclarée** ou **calculée**
  (`prixCession` − `valeurNetteComptable`), `compteResultat` (du cédant), `compteImmobilisation` (de
  l'acquéreur) et, si le bien s'amortit, `compteAmortissements`, `compteDotations` et la **durée résiduelle en
  mois** chez l'acquéreur (linéaire ; décompte **30/360** du registre, D-527-2).
- Rien n'est écrit en lignes : les lignes de chaque exercice se **calculent** depuis ces paramètres figés
  (une sortie déclarée plus tard change l'exercice de la cession). Moins-values internes : hook (l'art.
  251-2 exige d'abord un jugement de dépréciation).

**D-542-7 — Les mouvements de chaque exercice et le report (AC-3, AC-4, M4).** Pour la consolidation de
l'exercice k, chaque résultat interne actif d'un exercice E ≤ k de la mère donne :
- `MARGE_STOCK` — en E : débit `compteResultat` (vendeur) / crédit `compteStock` (détenteur), la marge ; en
  **E+1** (l'exercice suivant de la mère) : **réalisation** — débit réserves (vendeur) / crédit
  `compteResultat` (vendeur) : le stock détenu en E est réputé revendu en E+1, ce qui en reste est **redéclaré**
  à la clôture de E+1. Au-delà : rien.
- `PLUS_VALUE_CESSION` — en E : débit `compteResultat` (cédant) / crédit `compteImmobilisation` (acquéreur), la
  plus-value ; **chaque exercice à partir de E**, automatiquement : débit `compteAmortissements` / crédit
  `compteDotations` (acquéreur), l'amortissement excédentaire de l'exercice (cumul C(t) = PV × jours 30/360
  depuis la cession / (30 × durée), borné à PV, arrondi sur le cumul — la somme des annuités vaut le cumul) ;
  **ouverture** (k > E) : crédit `compteImmobilisation` PV, débit `compteAmortissements` C(fin k−1), débit
  réserves (cédant) PV − C(fin k−1).
- Les réserves sont le **compte de réserves du groupe** (méthodes en vigueur, D-541-8) ; l'effet sur le résultat
  est imputé **au vendeur** (art. 251-2). Absent alors qu'un report en dépend : `409
  COMPTE_RESERVES_NON_DECLARE` ; compte de gestion : `409 COMPTE_RESERVES_INVALIDE` (STORY-541).
- Société qui n'est plus intégrée en k : écriture de l'exercice ⇒ `409 ECRITURE_HORS_PERIMETRE` ; report ⇒
  **non appliqué, nommé** (manque).

**D-542-8 — La sortie du bien (AC-4 « jusqu'à la sortie »).** `type SORTIE_IMMOBILISATION`, déclarée dans
l'exercice de sortie : la plus-value interne qu'elle termine (active, de la mère), `dateSortie` (dans l'exercice,
pas avant la cession), `compteResultatSortie` (de l'acquéreur). Dans l'exercice de sortie : amortissement
excédentaire jusqu'à la date, puis **libération** — débit `compteImmobilisation` PV, crédit
`compteAmortissements` C(sortie), crédit `compteResultatSortie` PV − C(sortie) : le groupe réalise ce qui
restait. Après : rien. Une sortie active par bien (index unique partiel) ; une plus-value qui a une sortie
active ne s'annule pas (`409 BIEN_DEJA_SORTI` — annuler d'abord la sortie).

**D-542-9 — Chaque famille se décide, jamais par silence (M7).**
- `RESULTATS_INTERNES` est `APPLIQUE` si et seulement si, dans l'exercice, **chaque famille** (`MARGE_STOCK`,
  `PLUS_VALUE_CESSION`) a au moins une déclaration active **ou** une **omission motivée** active
  (`INCIDENCE_NEGLIGEABLE` | `SANS_INCIDENCE`, le vocabulaire de D-541-6), et qu'aucun report n'est nommé non
  appliqué (société sortie du périmètre, sortie orpheline).
- `ELIMINATIONS_PROPOSEES` est `APPLIQUE` si et seulement si le rapprochement n'a **rien en attente**
  (`PROPOSEE`, `DESEQUILIBREE`, `PERIMEE`) et que l'exercice a une décision sur les réciproques : une
  élimination active, un appariement examiné (tout état sauf `NON_APPLICABLE`), ou une **omission motivée**.
- Omission et déclaration de la même famille dans un exercice : `409 OMISSION_CONTRADICTOIRE`.

**D-542-10 — L'effet d'impôt (AC-5).** Il se **déduit de la nature**, il ne se déclare pas : élimination
réciproque ⇒ `AUCUN` (« le résultat consolidé ne bouge pas ») ; résultat interne ⇒ `DIFFERENCE_TEMPORELLE`.
Publié sur chaque écriture et, par résultat interne, avec ce que STORY-545 lira : l'effet sur le résultat de
l'exercice et le **résultat interne non réalisé à la clôture** (la base de la différence temporelle).

**D-542-11 — Dividendes internes (M7).** Le libellé de `RESULTATS_INTERNES` est ramené à ce que cette story
livre (marges sur stocks, plus-values de cession interne) ; **`DIVIDENDES_INTERNES`** entre dans la liste
fermée, `NON_TRAITE`, requis (AUDCIF art. 86 4° ; ANC 251-2), **STORY-687** fichée (numéro réservé par balayage
de TOUTES les branches distantes de `docs/` : maximum 686).

**D-542-12 — Routes et rôles.** `TENANT_ADMIN` et `TENANT_USER` (travail préparatoire, D-531-10), sous
`@RequiresDossierScope()` (la mère) et `@RequiresBilanAccess()` :
- `GET|POST /dossiers/:dossierId/consolidation/appariements`, `POST …/appariements/:appariementId/annulation` ;
- `GET …/exercices/:exerciceId/eliminations/propositions`, `POST
  …/eliminations/propositions/:appariementId/confirmation`, `POST …/eliminations/omissions` ;
- `GET …/exercices/:exerciceId/resultats-internes`, `POST …/resultats-internes/marges-sur-stocks`, `POST
  …/resultats-internes/plus-values-de-cession`, `POST …/resultats-internes/sorties`, `POST
  …/resultats-internes/omissions`, `POST …/resultats-internes/:ecritureId/annulation` ;
- `GET …/agregat` publie `rapprochement` et `resultatsInternes`, et par compte la colonne `resultatsInternes`.

**D-542-13 — Bornes.** Appariements par mère ≤ 200 (annulés compris) ; résultats internes des exercices passés
comptés **avant** d'être chargés, borne mesurée → `409 RESULTATS_INTERNES_TROP_VOLUMINEUX` ; le plafond de 200
écritures par consolidation est partagé entre natures.

**D-542-14 — Les contrôles.** `RECOMPOSITION` et `EQUILIBRE` couvrent la colonne `resultatsInternes`. ⛔ Tests
obligatoires : des réciproques éliminées laissent le **résultat consolidé identique** (IG et IP) ; une marge
interne ne retire que la part **encore détenue** ; l'amortissement excédentaire est repris **la 2ᵉ année** sans
rien redéclarer.

## Hors périmètre — hooks inertes documentés

- **Dividendes internes** : STORY-687 (D-542-11).
- **Proposer des appariements** par balayage des montants, sans déclaration (M1 : titres contre capitaux
  propres) ; **appariement multi-partenaires** (un compte qui mêle plusieurs sociétés).
- **Moins-values internes** et **amortissement dégressif** d'une plus-value interne ; marge calculée depuis les
  comptes du vendeur (taux de marge commerciale).
- **Dépréciations de créances ou de titres intragroupe** (ANC 251-2) : déclarables comme éliminations, non
  détectées.
- **Minoritaires** : STORY-544 lit le **vendeur** de chaque résultat interne (art. 251-2). **Impôts différés** :
  STORY-545 lit l'effet d'impôt, l'effet sur le résultat et le non-réalisé à la clôture.
- **Sortie du périmètre** d'une société qui détient un bien ou un stock interne : nommée, non calculée.

## Progress Tracking

- 2026-09-26 — branches `MNV-542` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`)
  **avant toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-26 — **cadrage fait avant tout code** : 9 constats, 14 décisions. Une balance n'a pas de tiers — les
  appariements se déclarent, le produit rapproche et propose, rien n'a d'effet sans confirmation (M1, M2,
  D-542-1 à 3) ; prorata au plus faible pourcentage d'intégration (M3, D-542-5) ; les résultats internes se
  déclarent et se REPORTENT — la marge de N se réalise en N+1, l'amortissement excédentaire est repris chaque
  exercice jusqu'à la sortie (M4, D-542-6 à 8) ; aucune famille n'est « appliquée » par silence (M7, D-542-9) ;
  les dividendes internes, promis par le libellé mais hors des AC, deviennent STORY-687 (D-542-11).
- 2026-09-26 — **dev `bilan-service`** (branche `MNV-542`, commits `90ba08a` → `b72bacc`) : collection
  `appariements_consolidation` (immuable hors annulation, index unique partiel des clés `société|compte`) et
  ses trois routes ; rapprochement PUR (concordance à l'unité, sept états dont `PERIMEE`) ; `GET
  …/eliminations/propositions` en lecture seule — rien n'est écrit ; confirmation RECALCULÉE (origine
  `PROPOSEE`, sources citées, index unique partiel exercice × appariement) ; intégration proportionnelle
  éliminable au plus faible pourcentage (ANC 2020-01 art. 261-3 à 261-5), `ELIMINATION_A_REPARTIR`,
  `ELIMINATION_HORS_APPARIEMENT` ; nature `RESULTAT_INTERNE` — marge sur stock (taux ou coût), plus-value
  (déclarée ou calculée, amortissable ou non), sortie du bien, omissions — dont les lignes se CALCULENT
  chaque exercice (élimination, réalisation en N+1, reprise 30/360, ouverture en réserves au vendeur,
  libération à la sortie) ; statuts `ELIMINATIONS_PROPOSEES` et `RESULTATS_INTERNES` conditionnels ;
  `DIVIDENDES_INTERNES` nommé (STORY-687). Douze routes, treize codes de refus. *Amendé en cours de dev :*
  une plus-value sur un bien non amortissable est publiée en phase `REPORT` les exercices suivants (aucune
  reprise n'a lieu) — relevé par les e2e.
- 2026-09-26 — ⚡ **tests écrits en parallèle par quatre sous-agents `opus`** (règles pures, service,
  unitaires, e2e + contrat OpenAPI), chacun propriétaire de ses fichiers, code de production jamais touché —
  **trois défauts trouvés, tous corrigés** :
  - l'agrégat ne protégeait pas le rapprochement contre un net hors des entiers sûrs : `500` brut au lieu du
    `422 AGREGAT_HORS_BORNES` que le GET des propositions rendait déjà ;
  - `cles` d'un appariement est un tableau Mongoose (`[]` par défaut, `required` n'exige que la présence) :
    un appariement sans clés passait la validation et l'index n'en protégeait aucun compte — validateur
    « au moins deux clés » (même famille que [[mongoose-strict-unset-et-defaut-tableau]]) ;
  - une plus-value sur un terrain publiée en `AMORTISSEMENT` alors qu'aucune reprise n'a lieu → `REPORT`.
  Remarques retenues : `appariementId` jugé avant toute lecture ; `isDuplicateKeyOn` par `Object.hasOwn`
  (un nom hérité du prototype n'est pas un champ d'index) ; énumération de détail nommée ; un JSDoc détaché.
- 2026-09-26 — ⚡ **mesuré avant de borner** (au pire cas des bornes, meilleur de trois passes) : le
  rapprochement relisait la liasse d'une société pour CHAQUE appariement — **108 ms** de boucle bloquée à
  200 appariements sur deux sociétés de 15 000 lignes ; nets des comptes déclarés indexés une fois :
  **4,3 ms**, gardé par un test STRUCTUREL (une lecture par liasse) dont le mutant rougit — un test
  chronométré aurait été fragile sous la couverture. Diagnostic de 2 000 résultats internes reportés :
  5,7 ms ; agrégat 30 000 lignes + 2 000 résultats internes : 82 ms.
- 2026-09-26 — **mutations** : 293 mutants passés par les trois batteries unitaires sur des copies hors
  dépôt (78 service, 103 règles, 112 unitaires), tous tués ; 5 mutants e2e par espions, tués ; puis une
  **table finale décision par décision** sur l'état final (`tmp/mutation-542-final/`) : 31 mutants, dont 3
  qui ne compilaient pas et 1 au motif double — réécrits et rejoués (« 0 test » n'est jamais un rouge) —
  **30/30 tués** ; le seul survivant était ÉQUIVALENT (la garde `ELIMINATION_HORS_APPARIEMENT` comparait
  aussi des tailles que `ELIMINATION_MONO_SOCIETE` rendait redondantes) : code mort retiré.
- 2026-09-26 — **portes** (`bilan-service` @ `4623624`, avant le retrait du code mort, rejouées ensuite sur
  le module) : lint 0 (`{src,test}`), `tsc`, `test:cov` **5 995 unitaires** (250 suites ; couverture **99,25 /
  96,17 / 99,52 / 99,34** ; fichiers neufs à 100 % des lignes, ≥ 98 % des branches), `test:e2e` **29 suites /
  1 514** (1 093 avant la story). Deux invariants transverses mis au contrat : 18 contrôleurs dont 15 nichés,
  tous sous `@RequiresDossierScope()` ; index uniques des appariements et du journal, `(tenantId, dossierId)`
  en tête.
- 2026-09-26 — **vérification docker sur stack NEUVE** (`down -v`), tout par les API réelles, 2 cabinets —
  scripts, scénario (attentes écrites AVANT) et journal : `PROSPERA/tmp/verif-docker-542/` : **208 OK, 0 KO**.
  Phase 0 (30 OK) : le conteneur exécute `MNV-542` @ `b72bacc` (empreintes des sources montées, marqueurs
  dans le `dist`, « Found 0 errors » après restart). Mise en place (81 OK) : le groupe de 541 (FILLE IG, JV IP
  50 %, ASSO MEE), mais trois balances DISTINCTES portant des comptes réciproques (dont un couple déséquilibré
  de 25 000). Le scénario (97 OK) : R0 calculé par un chemin INDÉPENDANT (soldes injectés × pourcentages) =
  résultat de l'agrégat ; **une proposition n'est jamais écrite** (journal vide après le GET, agrégat
  identique à la base) ; confirmation recalculée, sources = empreintes relevées ; **course** : deux
  confirmations simultanées ⇒ un 201, un 409, une seule élimination active en base ; réciproques soldés,
  **résultat inchangé** ; **prorata** 50 % (411300 = 512 500) ; appariement déséquilibré traité à la main,
  `ELIMINATION_A_REPARTIR`, `ELIMINATION_HORS_APPARIEMENT` ; plus-value de 2024 : `COMPTE_RESERVES_NON_DECLARE`
  puis, les méthodes du groupe déclarées, **la reprise de 2025 sans rien redéclarer** (+300 000, lignes
  exactes) ; marges (IG, IP au prorata) ; résultat = R0 − 950 000 ; sortie : libération de 825 000,
  `BIEN_DEJA_SORTI` à l'annulation et à la seconde sortie, retour en reprise après l'annulation de la sortie ;
  liasses intactes à l'empreinte ; cloisonnement (B : 404 partout, rien chez B) ; journal écriture par
  écriture ; index uniques partiels présents et **éprouvés par insertion directe** (E11000, rien inséré).
  `docker compose stop` ensuite.
- 2026-09-26 — ⑤ branche `MNV-542` poussée, **PR `prospera-bilan-service#141`** ouverte sur `dev` ; statut
  `in_progress` → `review`.
