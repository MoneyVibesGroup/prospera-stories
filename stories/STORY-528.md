# STORY-528 : Les dotations rejoignent la balance, et la Note 3 cesse d'être restituée sans source

Status: review

**Épic :** EPIC-135 — Immobilisations et amortissements
**Service :** module `immobilisations` de `balance-service` + `bilan-service` (Note 3, consommateur) —
⚠️ **contrat d'événement neuf = 2 dépôts** + l'artefact `syscohada-revise@2.1` copié à l'octet (M7)
**Points :** 8 *(mesuré au cadrage : trois dépôts de code, un contrat Kafka et deux artefacts — voir M7)* · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-527** (le plan d'amortissement)
**Origine :** §6.2 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

C'est la story qui **referme** le constat du cadrage du 16/08 : aujourd'hui `STORY-059` restitue les
colonnes **Brut / Amort / Net** et `STORY-062` les notes d'immobilisations, **à partir de soldes que
personne ne produit**. Une fois STORY-527 livrée, ces soldes ont enfin une source.

⚠️ **Et c'est le moment dangereux** : deux endroits porteront des amortissements — la balance
importée (Sage, cahiers, saisie) et le registre. **Il faut dire lequel fait foi**, sinon le produit
en aura deux qui divergeront en silence.

## Critères d'acceptation

- [ ] AC-1 — Les dotations calculées entrent en balance par le **même mécanisme que les provisions
      fiscales** : **dry-run par défaut**, écriture sur acte explicite, **nouvelle version** de
      balance — on n'écrase jamais, on empile.
- [ ] AC-2 — ⚡ **La dotation portée est un COMPLÉMENT, jamais un brut.** Une balance importée peut
      déjà porter des amortissements ; les écrire en brut les **doublerait**, et aucun contrôle
      d'équilibre ne s'en apercevrait. C'est exactement l'erreur évitée sur le compte 891 (« écrire
      1 402 650 en brut aurait doublé la charge »).
- [ ] AC-3 — ⛔ **Une confrontation registre ↔ balance est publiée** : compte par compte,
      l'amortissement du registre et celui de la balance, avec l'écart. Un écart n'est pas
      corrigé d'office — il est **montré**.
- [ ] AC-4 — La **Note 3** (tableau des immobilisations) est alimentée par le registre : valeurs
      brutes, entrées, sorties, amortissements cumulés, dotations, reprises. Elle cesse d'être une
      restitution sans source.
- [ ] AC-5 — Un dossier **sans registre** continue de fonctionner exactement comme aujourd'hui : les
      colonnes viennent de la balance importée, et l'écran dit d'où elles viennent. ⚠️ Non-régression
      obligatoire — la majorité des dossiers actuels sont dans ce cas.
- [ ] AC-6 — L'invariant `amortissements ≤ valeur brute` est vérifié **à la publication**, pas
      seulement au calcul.

---

# Cadrage — fait AVANT toute ligne de code

Sources lues : le code de `balance-service` (`dev` @ `9ca7d41` — registre 526, moteur 527, provisions
fiscales 094/095, balance canonique) et de `bilan-service` (`dev` @ `bbf27d7` — moteur d'états 059,
notes 062/114/436/438, jeu d'états 381, lecteur de `balance.created`), les quatre référentiels
comptables packagés et leurs sources, les fiches STORY-059, 434, 436, 438 et leurs constats de revue.

## Les constats mesurés

### M1 — ⛔ La prémisse ne tient qu'à moitié : la colonne Amort est STRUCTURELLEMENT nulle

La fiche pose que 059 « restitue Brut / Amort / Net à partir de soldes que personne ne produit ».
Mesuré sur les artefacts : sur `syscohada-revise@2.1`, `smt-togo@1.0` et `zone-franche-togo@1.0`,
**aucun compte `28x` n'est rattaché à un poste** de la table de passage (0 entrée). Le moteur le dit
lui-même (`bilan-production.service.ts`) : *« la convention miroir SYSCOHADA (rattacher les comptes
`28xx` non mappés) exigerait d'étendre le référentiel → hors périmètre, jamais deviné ici »* — et
STORY-438 l'a mesuré : `amortN` y vaut **0**, `brutN === netN`. Un solde `284400` créditeur y est un
**compte non affecté** (seul `cima-assurances` rattache `28`).

⇒ Écrire les dotations en balance (AC-1) rend la **balance** juste ; cela **ne fera pas** apparaître
l'amortissement dans la colonne Amort du Bilan SYSCOHADA tant que la convention miroir n'est pas
déclarée au référentiel. **Hors périmètre, fiché** (la modifier change chaque liasse SYSCOHADA
existante, c'est une story de `bilan-service` à part entière). La Note 3, elle, n'en dépend pas : le
registre sait à quelle immobilisation appartient chaque amortissement (M7).

⚠️ Et STORY-434 a mesuré le second maillon : les postes qui renvoient à la note 3 (`AD`, `AI`, `AP`)
sont des **totaux** que la résolution au préfixe le plus long vide au profit des postes de détail
(`231000 → AK`). La note 3 d'aujourd'hui ne restitue donc presque rien : sa matière est la **trame
saisie à la main** (STORY-436).

### M2 — Les dotations passent AVANT les provisions fiscales, jamais après

Une dotation est une charge : elle abaisse le résultat avant impôt, donc l'impôt. La balance des
dotations est donc une **base fiscale** (elle n'entre pas dans `ORIGINES_HORS_BASE_FISCALE`) : les
provisions appliquées ensuite partent d'elle. Une balance provisionnée **antérieure** à une
publication de dotations a été calculée sans elles ⇒ elle est périmée, et la réponse le **dit**
(avertissement), sans rien réécrire.

### M3 — ⛔ Aucun référentiel ne dit « ce compte s'amortit par celui-là, et se dote sur celui-ci »

Constat M4 de STORY-526, re-mesuré : les quatre plans packagés ne déclarent **aucune** correspondance
immobilisation → amortissement → dotation, et le plan SYSCOHADA condensé (174 comptes) ne descend pas
sous `28` et `681`. La coder (« insérer un 8 après le 2 ») serait fausse sur deux plans sur quatre
(`sfd-bceao` porte ses immobilisations en `41`-`44`, `cima-assurances` mêle placements et
immobilisations en `20`-`28`) et **ambiguë** sur un plan à six chiffres (`244100` → `2844100` dépasse
la longueur de détail). Surtout : le complément (AC-2) doit se mesurer **sur les comptes que la balance
du client porte réellement** — ceux que le cabinet connaît, pas une racine que le produit supposerait.

⇒ Comme le compte d'immobilisation depuis 526 (AD-8), les deux contreparties sont **déclarées par le
cabinet** à l'acquisition et validées contre le plan **du dossier**. Ce que le référentiel déclare
permet deux gardes réelles : le compte de dotation est sous une **racine de gestion**
(`racinesDeGestion`, déclarée par les huit artefacts), le compte d'amortissement ne l'est pas. Qu'un
compte de gestion soit une **charge** plutôt qu'un produit, aucun référentiel ne le déclare : c'est la
déclaration du cabinet, et la limite est nommée.

### M4 — « Déjà porté » se mesure PAR PRÉFIXE, et chaque ligne n'est comptée qu'une fois

Convention du service (`calculerChargeImpotComptabilisee`, D-094-1) : *« rapprochement par préfixe,
comme partout ailleurs dans ce service — une balance réelle subdivise »*. Deux comptes déclarés
peuvent se recouvrir (`6813` et `681300`) : une ligne de balance est donc attribuée au compte déclaré
**le plus long** qui la préfixe — la règle même de la table de passage — et jamais à deux.

### M5 — Un complément à plusieurs contreparties ne se ventile pas sans deviner

Le précédent `891` (D-094-7) amène **un** compte de charge au montant dû, contre **une** contrepartie
(`441`). Ici un même compte de dotation (`681300`) sert souvent plusieurs comptes d'amortissement
(`284410`, `284500`). Si la balance porte déjà une **partie** de la dotation, rien ne dit à quelle
immobilisation elle appartient : répartir le reste serait inventer une ventilation. D'où D-528-4.

### M6 — ⛔ Un défaut LATENT du mécanisme copié : la version d'une balance dérivée

`BalanceService.nextVersion` ne compte que les balances **sans** origine (`filtreOrigine(undefined)`),
alors que l'index unique porte `origine`. Un provisionnement dont le **contenu change sur la même
base** (un acompte ou un retraitement déclaré après coup) recalcule donc la **même** version que la
provision en place : `submit` rend l'existante, les empreintes diffèrent, et la route répond
`409 VERSION_BALANCE_CONCURRENTE` — « relancer » n'y change rien. Pour les dotations c'est le cas
**nominal** (le registre bouge indépendamment de la balance). ⇒ La publication des dotations numérote
au-delà de **toute** la lignée ; le défaut des provisions est **hors périmètre, fiché** (il se
démontre par un test avant d'être affirmé ailleurs).

### M7 — La Note 3 est produite par `bilan-service`, qui ne lit aucune balance

Le jeu d'états reçoit les **soldes du client** et ne connaît sa balance que par son identifiant
(STORY-381) ; les trames de notes y sont des **compléments saisis** (STORY-436), rangés sur le jeu.
Pour qu'une note soit « alimentée par le registre » (AC-4) — et non recopiée par l'écran —, la matière
doit **traverser la frontière** : invariant n° 2, un **événement** et un **read-model**. ⇒ Contrat neuf,
deux dépôts. Et « la note que le registre alimente » ne se code pas (`'3'` est un numéro SYSCOHADA,
invariant P7) : c'est **le référentiel qui la déclare**. Les deux paquets qui portent des notes
(`syscohada-revise@2.1`, `zone-franche-togo@1.0`) partagent `notes-syscohada.json` ; le premier est
copié à l'octet dans `balance-service` (patron STORY-428/434).

### M8 — « Reprises » : la colonne de la note 3C, pas le compte 798

L'AC-4 cite « reprises ». Dans le tableau des amortissements, c'est la colonne *« diminutions :
amortissements relatifs aux éléments sortis de l'actif »* — pas une **reprise d'amortissement** (798,
un produit) que le registre ne produit jamais (D-527-8 : aucun champ « reprise »). Le champ s'appelle
donc `sorties`, sous `amortissements`.

### M9 — Les bornes de lecture sont un sujet de sécurité, pas de confort

La publication lit **tout** le registre du dossier et calcule chaque plan. 527 a borné les exercices
(1 000) après une mesure de 27 s de boucle bloquée ; le nombre d'immobilisations et de mouvements
n'est borné nulle part. ⇒ Bornes posées sur **mesure du pire mutant**, jamais une liste tronquée.

## Les décisions

**D-528-1 — Deux contreparties déclarées à l'acquisition** : `compteAmortissement` et
`compteDotation`, comptes de **détail** du plan du dossier à la date d'acquisition ; dotation sous une
racine de gestion, amortissement hors ; les trois comptes distincts. Figés sur l'`ACQUISITION`
(append-only). Une immobilisation inscrite **avant** cette story n'en porte pas : la publication la
**nomme** et refuse (`409 CONTREPARTIES_NON_DECLAREES`) — jamais une contrepartie supposée.

**D-528-2 — Le tableau de l'exercice, pur** (`dotations.regles.ts`) : pour chaque immobilisation, le
plan 527 donne sa part de l'exercice — **brut** (ouverture, entrées, sorties, clôture) et
**amortissements** (ouverture, dotations, sorties, clôture), clôture = ouverture ± mouvements
**vérifié**. Refus, jamais une ligne omise : plan incalculable ou interrompu avant la fin de
l'exercice (`409 DOTATIONS_INCALCULABLES`, immobilisations nommées), devise d'une immobilisation ≠
devise de la balance.

**D-528-3 — Le mécanisme des provisions (AC-1)** : `POST /dossiers/:dossierId/immobilisations/
dotations/publier`, **aperçu par défaut** (`dryRun` en chaîne, 200), `dryRun=false` ⇒ 201 (version
créée) ou 200 (NOP). Base = dernière **base fiscale** de l'exercice ; exercice clos ou balance validée
⇒ 409 ; origine **`AMORTISSEMENTS`**, source héritée de la base ; version = 1 + la plus haute de toute
la lignée (M6) ; NOP reconnue à l'empreinte ; aucune écriture ⇒ **aucune version** ; une balance
provisionnée existante ⇒ avertissement `PROVISIONS_FISCALES_A_REAPPLIQUER` (M2). L'écriture passe
par `submitInSession` — un seul chemin de soumission, les mêmes contrôles.

**D-528-4 — Le complément (AC-2)**, par compte de dotation (M4) : amener le compte au montant du
registre. Contreparties créditées compte d'amortissement par compte d'amortissement **quand cela se
fait sans deviner** — rien de porté, ou une seule contrepartie. Sinon, rien n'est écrit et l'issue est
publiée : `ECRITE` · `COMPLETEE` · `DEJA_PORTEE` · `EXCEDENT_EN_BALANCE` (un complément négatif serait
une reprise : jamais écrit) · `NON_VENTILABLE` (M5).

**D-528-5 — La confrontation (AC-3)**, publiée dans l'aperçu comme dans la réponse persistée : par
compte d'amortissement, le cumul du registre à la clôture, celui de la balance de base, le complément
écrit et l'**écart résiduel** ; par compte de dotation, les mêmes colonnes et l'issue. Jamais corrigé.

**D-528-6 — L'invariant à la publication (AC-6)** : sur la balance **qui serait écrite**, pour chaque
groupe de comptes liés (immobilisation ↔ amortissement), cumul des amortissements ≤ brut porté ; et
pour chaque immobilisation, cumul du registre ≤ valeur amortissable (re-vérifié, pas supposé du moteur).
Violation ⇒ `409 AMORTISSEMENTS_SUPERIEURS_AU_BRUT`, rien d'écrit — en aperçu comme en écriture.

**D-528-7 — La Note 3 alimentée (AC-4)** : événement **`immobilisations.tableau.publie` v1**
(outbox ; dans la **même transaction** que la balance quand une version est créée, seul sinon), le
tableau **par compte d'immobilisation** ; consommé par `bilan-service` dans un read-model (le plus
récent par dossier et exercice, filigrane `occurredAt`) ; **figé sur le jeu d'états** à sa création ;
la note que le référentiel déclare `alimentation: "REGISTRE_IMMOBILISATIONS"` publie un bloc **typé**
`registre` — une ligne par **poste** (compte → poste par la table de passage **et** les surcharges du
cabinet ; un compte non rattaché est **listé**, jamais perdu), ses totaux, sa publication (date,
balance, empreinte) —, et l'export l'imprime. `PUT …/complements` sur cette note est alors refusé :
deux sources pour une même note, c'est le défaut que la story referme. `MOTEUR_VERSION` monte.

**D-528-8 — Sans registre, rien ne change (AC-5)** : aucun appel, aucune publication, aucune
différence de chiffre. Chaque note dit d'où vient son détail — `provenance` : `BALANCE` (ventilation),
`REGISTRE`, `SAISIE`, `A_COMPLETER`. Un tableau publié **vide** vaut « pas de registre » : la note
retombe sur sa trame — publier sur un registre vide ne remplace donc jamais une saisie.

**D-528-9 — Bornes de lecture** (M9) : nombre d'immobilisations et de mouvements lus par une
publication, fixés par mesure ; au-delà, `409` explicite.

## Hors périmètre — hooks inertes documentés

- **La convention miroir** (rattacher les `28x` aux postes d'actif de SYSCOHADA, SMT, zone franche) :
  sans elle la colonne Amort du Bilan reste nulle sur ces paquets (M1). Story `bilan-service` à ficher.
- **Les écritures de sortie** en balance (`81`/`82`, solde du brut et des amortissements du bien
  sorti) : le registre les connaît, l'AC-1 ne publie que les dotations.
- **Le défaut de version des provisions fiscales** (M6).
- **La nature « charge » d'un compte de dotation** : aucun référentiel ne la déclare (M3).
- **Dépréciations** (`29x`), **effets d'une réévaluation**, **amortissement dérogatoire**, **reprise
  d'un registre existant** : inchangés depuis 526/527.
- **Les notes du SMT** : non packagées (`NON_APPLICABLE`), le registre n'a rien à y alimenter.

## Notes

- Voir [[STORY-526]], [[STORY-527]], [[STORY-059]], [[STORY-062]], [[STORY-434]], [[STORY-436]],
  [[STORY-438]], `cadrage-immobilisations-2026-08-16.md`.

## Progress Tracking

- 2026-09-23 — branche `MNV-528` ouverte sur `docs/` ; statut `ready-for-dev` → `in_progress`.
- 2026-09-23 — **cadrage fait avant tout code** : 9 constats M1-M9, 9 décisions. La colonne Amort du
  Bilan SYSCOHADA est structurellement nulle (M1, convention miroir hors périmètre) ; aucun référentiel
  ne déclare les contreparties d'une immobilisation (M3) ; la Note 3 exige un contrat d'événement neuf
  vers `bilan-service` (M7) ; et le mécanisme copié porte un défaut de version latent (M6).

- 2026-09-23 — branches `MNV-528` ouvertes **avant tout code** : `balance-service` (depuis `origin/dev`
  @ `9ca7d41`) et `bilan-service` (depuis `origin/dev` @ `bbf27d7`). Développée — la moitié
  `balance-service` dans la session, la moitié `bilan-service` par un sous-agent sur un cahier autonome
  (contrat d'événement fixé en amont), relue ici.

### Ce qui est livré

| Dépôt · fichier | Rôle |
|---|---|
| `balance-service` `…/immobilisations/dotations.regles.ts` | le **pur** : part de chaque bien dans l'exercice (brut 3A, amortissements 3C), tableau par compte, attribution au préfixe le plus long, complément, confrontation, invariant |
| `…/immobilisations/dotations.service.ts` · `dotations.controller.ts` | `POST …/immobilisations/dotations/publier` — le mécanisme des provisions ; bornes de lecture et de calcul |
| `…/immobilisations` schéma, DTO, service | les deux contreparties déclarées à l'acquisition (D-528-1), gardées contre le plan du dossier |
| `…/balance/balance.repository.ts` · `balance-canonique.ts` | origine `AMORTISSEMENTS` ; dernière balance d'une origine ; plus haute version de TOUTE la lignée (M6) |
| `…/kafka/events/immobilisations-events.ts` + outbox | `immobilisations.tableau.publie` v1, écrit dans la transaction de la balance |
| `…/referentiel/assets/syscohada-revise-2.1.json` | recopie à l'octet (sha256 `484c6a80…`) |
| `bilan-service` `scripts/referentiels/sources/notes-syscohada.json` + `build.mjs` | la note 3 déclare `alimentation: REGISTRE_IMMOBILISATIONS` ; deux artefacts régénérés |
| `…/read-models/immobilisations-*` · `tableaux_immobilisations` | consommateur isolé, validation stricte, projection idempotente à filigrane |
| `…/jeu-etats/capture-registre.ts` + service | le tableau FIGÉ sur le jeu à la création et au recalcul ; écarté (et dit) si devise ou échelle diffèrent ; saisie de la note refusée (`409 NOTE_ALIMENTEE_PAR_LE_REGISTRE`) |
| `…/etats/notes-annexes-production.service.ts` | bloc `registre` par poste (table de passage + surcharges), comptes non rattachés listés, `provenance` sur chaque note ; `MOTEUR_VERSION` 1.18.0 |
| `…/export/modele-liasse.ts` | le bloc imprimé (deux sections, brut puis amortissements) ; export sans registre inchangé à l'empreinte près |

### Écarts au cadrage, décidés en développement

- **D-528-4** : une sixième issue, `SOLDE_CREDITEUR_EN_BALANCE` — un compte de charge créditeur
  amené au registre créditerait l'amortissement de PLUS que la dotation calculée ; montré, jamais écrit.
- **D-528-9, mesurée** : deux bornes, pas une. 20 000 **mouvements** lus, et 20 000 **lignes de plan**
  estimées avant tout calcul par la règle d'arrêt du moteur (mise en service → fin de vie) — un bien
  amorti ne coûte que sa durée de vie. Mesuré : 100 biens sur 1 000 exercices d'un jour bloquaient la
  boucle **8,7 s** ; le moteur ré-indexait les exercices POUR CHAQUE bien (600 biens : 3,6 s). Plans
  tronqués à la clôture publiée, relâchés aussitôt lus, exercices indexés une fois : à la borne,
  **133 ms** ; un bien de plus est refusé en 2 ms. La borne se juge au coût d'un appel RÉPÉTÉ : le
  throttler en admet 100 par minute et par IP.

- 2026-09-23 — **poussée, PR ouvertes** : `balance-service#116` et `bilan-service#133` (contrat d'événement
  neuf : les deux s'intègrent ensemble) ; statut `in_progress` → `review`. Revue de code (⑥), revue de
  sécurité (⑦) et vérification docker sur l'état final suivent.
