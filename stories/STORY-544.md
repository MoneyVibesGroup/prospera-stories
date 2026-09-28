# STORY-544 : Intérêts minoritaires — ce qui appartient au groupe et ce qui ne lui appartient pas

Status: in_progress

**Épic :** EPIC-138 — Écarts d'acquisition et intérêts minoritaires
**Service :** `bilan-service` — module `consolidation` (aucun contrat d'événement : **un seul dépôt**)
**Points :** 8 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-542** (éliminations) · **STORY-543** (écarts)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

L'intégration globale reprend **100 %** des actifs et des dettes d'une filiale détenue à 60 %. Il
faut donc **isoler les 40 % qui n'appartiennent pas au groupe** : les **intérêts minoritaires** (ou
« participations ne donnant pas le contrôle »).

Ils apparaissent à **deux endroits, et l'un des deux est celui qu'on oublie** :

| Où | Quoi |
|---|---|
| Au **passif** | quote-part minoritaire des **capitaux propres** consolidés |
| Au **compte de résultat** | quote-part minoritaire du **résultat** — ⚠️ le « résultat net part du groupe » se lit **après** cette déduction |

⛔ **Le nombre que lit un banquier, un actionnaire ou un analyste est le résultat PART DU GROUPE.**
Publier le résultat consolidé total sous le libellé « résultat net » sur un groupe à minoritaires
significatifs est un contresens — et rien, dans l'équilibre du bilan, ne le signale.

## Critères d'acceptation

- [ ] AC-1 — Les intérêts minoritaires sont calculés sur le **pourcentage d'intérêt** (STORY-530
      AC-1), **pas** sur le pourcentage de contrôle. ⚠️ Les deux diffèrent en cascade, et c'est
      exactement là que l'erreur se produit.
- [ ] AC-2 — Ils portent sur les capitaux propres **retraités et après éliminations** — donc **après**
      STORY-541, 542 et 543, jamais sur les comptes individuels.
- [ ] AC-3 — ⚡ **La part minoritaire des RÉSULTATS INTERNES éliminés leur revient aussi.** Éliminer
      100 % d'une marge interne réalisée par une filiale à 60 % et n'en imputer aucune part aux
      minoritaires fausse les deux lignes à la fois.
- [ ] AC-4 — Le compte de résultat publie **trois lignes distinctes** : résultat consolidé total,
      **part des minoritaires**, **part du groupe**. Et leur somme se vérifie.
- [ ] AC-5 — Un groupe **sans minoritaires** (filiales à 100 %) publie une part minoritaire **nulle
      et visible**, pas absente. ⚡ Doctrine constante du produit : *un état qui disparaît fait
      chercher ce qu'on a cassé*.
- [ ] AC-6 — Une quote-part minoritaire **négative** (filiale déficitaire) est traitée selon la règle
      déclarée par le référentiel, **jamais bornée à zéro en silence**.

## Notes

- Voir [[STORY-530]], [[STORY-542]], [[STORY-543]], [[STORY-548]].

---

# Cadrage — fait AVANT toute ligne de code

Sources : **AUDCIF 2017**, art. 79, 81, 85, 89 et 90 ; le **SYSCOHADA révisé**, deuxième partie « Dispositif
comptable relatif aux comptes consolidés et combinés » (D4C) — relevé en cours sur l'édition officielle
(biblio.ohada.org, `explnum_id=2063`), citations consignées en M7 ; le code de `bilan-service` (`dev` @ `5d2531e`)
et de `dossier-service` (périmètre, STORY-530) ; les fiches STORY-530, 531, 541, 542, 543, 545 à 548.

## Les constats mesurés

### M1 — Aujourd'hui, RIEN n'isole les minoritaires : tout est compté au groupe

Après STORY-543, les comptes de capitaux propres d'une filiale détenue à `p` gardent `(1 − p)` de ses capitaux
propres d'entrée et **100 %** de leur variation depuis l'entrée ; ses comptes de gestion portent **100 %** de son
résultat. La balance consolidée les additionne à ceux de la mère : le capital d'une filiale à 60 % y garde 40 %
de son montant, et le résultat publié est le résultat de l'ensemble. `INTERETS_MINORITAIRES` est publié
`NON_TRAITE`, requis (« AUDCIF, art. 89 et 90 »). STORY-543 crédite déjà aux réserves de la société la part des
minoritaires d'une réévaluation totale (`partMinoritairesEcartsEvaluation`), en attente de cette story. Et
l'agrégat ne publie **aucun résultat** : c'est une balance.

### M2 — Le pourcentage d'intérêt est connu EXACTEMENT

Chaque société du périmètre arrêté porte `interetExact` — une fraction irréductible en `bigint`, somme sur les
chaînes du produit des parts (D-530-4) — et `pctInteret`, qui n'en est que l'arrondi au point de base.
`fraction.util.ts` (`dossier-service`) le dit : *« Le périmètre chiffrera un jour les minoritaires (STORY-544) — il
se calcule donc en fraction exacte, et n'est arrondi qu'à la publication. »* Exemple de référence (530, M3) : mère
→ fille 80 %, fille → petite-fille 60 % : contrôle **60 %**, intérêt **48 %**.

Une société intégrée **proportionnellement** l'est à `π` = la somme des parts de ses détenteurs (STORY-531, AUDCIF
art. 81 al. 2 : *« la fraction représentative des intérêts de l'entité consolidante — ou des entités détentrices
— »*). Un détenteur est la mère ou une société contrôlée : si celle-ci est détenue à moins de 100 %, ses propres
minoritaires ont une part de la société intégrée proportionnellement — l'intérêt du groupe y vaut moins que `π`.

### M3 — ⛔ L'erreur n'est pas seulement « le contrôle au lieu de l'intérêt » : chaque montant a un propriétaire

Appliquer `(1 − intérêt)` à ce qui RESTE des capitaux propres d'une filiale après STORY-543 donne `(1 − p)²` pour
une filiale directe : 543 a déjà retiré la part du détenteur. La bonne lecture attribue chaque montant de la balance
consolidée à la société dont les associés le possèdent, au taux des minoritaires de CELLE-CI :

| Montant (capitaux propres ou résultat) | Propriétaire | Taux des minoritaires |
|---|---|---|
| Liasse de la société, retraitements d'homogénéisation (541) et leurs reports | la société | `r = 1 − intérêt / π` |
| Résultats internes (542) — **toutes** leurs lignes, même portées par l'acquéreur (amortissement excédentaire repris, sortie) | le **VENDEUR** | le sien |
| Éliminations réciproques (531, 542) | personne | — : elles ne changent le résultat de personne |
| 543 — élimination des capitaux propres d'entrée | le **DÉTENTEUR** | le sien (**0** si c'est la mère) |
| 543 — part des minoritaires d'une réévaluation totale | la société | **100 %** : c'est déjà la leur |
| 543 — amortissement, sortie d'un écart d'évaluation | la société en réévaluation **totale** ; le détenteur en **partielle** | le sien |
| 543 — écart d'acquisition : amortissement, reprise, cumul passé | le détenteur | le sien |

⚡ **Vérifié à la main** sur la cascade mère → F 80 % → PF 60 % (réévaluation d'un bien de PF, écart d'acquisition
chez F, marge interne de PF vers la mère) contre la méthode par paliers — les minoritaires directs de PF, puis ceux
de F sur le sous-ensemble consolidé de F : **égalité exacte** en réévaluation totale (574) et partielle (544).
L'erreur « (1 − intérêt) sur le résidu » donne 298,8. Le vendeur pour les résultats internes est le hook posé par
STORY-542 (*« STORY-544 lira le VENDEUR de chaque mouvement »*) ; le détenteur pour l'élimination des titres est ce
qui fait porter aux minoritaires d'une fille leur part de l'écart d'acquisition de ses propres filiales.

### M4 — La balance ne dit pas quels comptes sont des capitaux propres

Les trois paquets de liasse pontés vers les règles de consolidation (`syscohada-revise@2.1`, `@2.2`,
`zone-franche-togo@1.0`) rangent tous `101-104, 105, 106, 109, 111-113, 118, 12, 13, 14, 15` dans les postes CA à CM
du passif — « CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES » —, soit exactement les comptes des racines `10` à `15`
de leur plan. Aucun ne le MARQUE : le marquer ferait bouger l'empreinte des liasses et leur copie à l'octet dans
`balance-service` pour une raison qui n'est pas la liasse (543, M7). ⛔ Jamais le premier chiffre (en SFD, la
classe 1 est la trésorerie). ⇒ Les racines des capitaux propres partagés se **publient** dans le paquet des
règles de consolidation, avec leur fondement.

### M5 — Isoler exige deux comptes que le plan n'a pas

Au bilan, les intérêts minoritaires ; au compte de résultat, la part des minoritaires — une ligne d'état consolidé,
pas un compte du plan SYSCOHADA. Pour que la balance consolidée les porte **et reste équilibrée**, le partage
débite les capitaux propres de la société et un compte de gestion « part des minoritaires », et crédite un compte
« intérêts minoritaires ». Le produit ne choisit pas un numéro de compte : ils se **déclarent**, au référentiel de
méthodes du groupe, comme le compte de réserves (D-541-2).

### M6 — Le résultat se lit sur la balance, par les racines de gestion

`racinesDeGestion` (`6`, `7`, `8` dans les trois paquets pontés, STORY-369) : le résultat consolidé total est la
somme de ces comptes AVANT le partage, la part du groupe la même somme APRÈS — deux lectures de la balance, et la
part des minoritaires une troisième grandeur, calculée par le partage : leur égalité est un contrôle qui peut
échouer.

### M7 — AC-6 : ce que dit le texte d'une quote-part négative

*En cours de relevé sur l'édition officielle du D4C* (sous-agent de recherche, pages rendues en image). Pour
comparaison seulement : le règlement CRC 99-02 (France) impute l'excédent aux majoritaires sauf obligation formelle
des minoritaires de combler les pertes ; IFRS 10 attribue aux minoritaires même un solde débiteur. La décision
D-544-6 fixe le MÉCANISME ; la règle elle-même est celle que le texte écrit, transcrite verbatim.

### M8 — Les bornes

Aucune lecture nouvelle : le périmètre, les méthodes du groupe et le paquet des liasses sont déjà lus par
l'agrégat ; le paquet de règles est en cache. Le partage est linéaire dans les lignes de l'agrégat (≤ 30 000). Les
fractions d'intérêt ont un dénominateur jusqu'à 10 000³⁰ (profondeur ≤ 30, leçon de STORY-530) : le coût
se **mesure** au pire cas.

## Les décisions

**D-544-1 — Le partage se CALCULE à chaque agrégat ; rien ne se déclare ni ne se fige.** Les minoritaires sont une
conséquence du pourcentage d'intérêt et des capitaux propres consolidés : aucune écriture au journal. Chaque
consolidation repart de la balance consolidée de l'exercice, qui porte déjà en réserves l'effet des exercices
passés (541, 542, 543).

**D-544-2 — Le taux des minoritaires, exact (AC-1).** Pour chaque société intégrée : `r = 1 − interetExact / π`
(`π` = 100 % en intégration globale, la somme des parts de ses détenteurs en proportionnelle), en fraction
`bigint` ; la mère : 0. ⛔ Jamais `pctControle`, jamais l'arrondi `pctInteret` (publié pour la lecture seulement).
Un intérêt supérieur à `π` viole un invariant du producteur (erreur de programmation).

**D-544-3 — Chaque montant a un propriétaire (AC-2, AC-3, M3).** La table de M3, appliquée :
- liasse, retraitements et reports : par la société qui porte la ligne ;
- résultats internes : par le **vendeur** de chaque mouvement, quelle que soit la société de la ligne ;
- éliminations réciproques : exclues du partage ;
- écarts de première consolidation : STORY-543 publie ses lignes BRUTES, avant nettage, chacune étiquetée
  (`DETENTEUR`, `SOCIETE`, `MINORITAIRES`, `AUCUNE`) — l'amortissement d'un écart d'évaluation `SOCIETE` en
  réévaluation totale, `DETENTEUR` en partielle. Les lignes nettées de l'agrégat n'en sont que la somme : un
  seul calcul, deux lectures.

**D-544-4 — La base (M4, M6).** Capitaux propres : les comptes sous les **racines des capitaux propres** publiées par
le paquet de règles de consolidation, le **compte de réserves** du groupe (D-541-8) et les comptes de capitaux
propres d'entrée déclarés par les écarts (543) ; résultat : les comptes sous les **racines de gestion** du paquet
des liasses. Tout autre compte (actif, dette) n'appartient à personne en propre : il n'entre pas au partage.

**D-544-5 — L'arrondi.** Par propriétaire, sur ses comptes de capitaux propres et son résultat : la part au taux
exact, **au plus fort reste**, créditeurs et débiteurs en deux colonnes (`plus-fort-reste.ts`, généralisé à une
fraction) — la somme vaut l'arrondi de la somme exacte. La part des minoritaires d'une réévaluation totale est
reprise à l'unité près, telle que 543 l'a publiée.

**D-544-6 — La quote-part négative (AC-6, M7).** Par société propriétaire, sur le **stock** : `A` = part des
minoritaires dans ses capitaux propres hors résultat, `B` = dans son résultat, `T = A + B`. Si `T < 0`, la règle
**publiée par le paquet de règles de consolidation** s'applique — son traitement et ses fondements verbatim —, et
**une alerte `QUOTE_PART_MINORITAIRE_NEGATIVE` la nomme toujours** : la société, la part calculée, la part
comptabilisée, ce qui en est porté par le groupe. ⛔ Jamais un zéro sans alerte. *Règle du texte : M7, à
transcrire.*

**D-544-7 — Les comptes et la colonne (M5).** Le référentiel de méthodes du groupe (D-541-2) accepte deux comptes
facultatifs, **ensemble ou pas du tout** : `compteInteretsMinoritaires` (bilan) et `compteResultatMinoritaires`
(gestion) — distincts entre eux et du compte de réserves (`400 METHODES_INCOHERENTES`, motifs
`COMPTES_MINORITAIRES_INCOMPLETS` | `COMPTES_CONSOLIDATION_CONFONDUS`). À l'agrégat, une colonne
`interetsMinoritaires` par compte, **à l'identité** (déjà à la part des minoritaires), chaque ligne rattachée aux
minoritaires qu'elle concerne (`minoritairesDe`) : par propriétaire, le débit de chacun de ses comptes de capitaux
propres pour leur part, le débit du compte de résultat des minoritaires pour la part du résultat, le crédit du
compte des intérêts minoritaires pour le tout. Couverte par `RECOMPOSITION` et `EQUILIBRE`.

**D-544-8 — Le compte de résultat en trois lignes (AC-4, M6).** `resultat` publie le **résultat consolidé** (racines
de gestion, balance AVANT la colonne), la **part des minoritaires** (le partage) et la **part du groupe** (leur
différence) ; le contrôle **`PARTAGE_DU_RESULTAT`** confronte cette part du groupe au résultat que porte la balance
APRÈS la colonne — deux chemins : il échoue si la colonne manque ou se trompe.

**D-544-9 — Le traitement se décide, jamais par silence.** `INTERETS_MINORITAIRES` est `APPLIQUE` si et seulement si
le partage est établi et comptabilisé, sans manque ; ⚡ **AC-5** : un groupe dont aucune société n'a de minoritaires
(toutes les parts nulles) est établi SANS compte déclaré — part nulle, publiée, trois lignes présentes, contrôle
satisfait. Manques nommés, **non bloquants** (l'agrégat reste calculé, la colonne vide, l'état `AGREGE` : il ne
prétend rien de faux) :
- `COMPTES_MINORITAIRES_NON_DECLARES` — une part non nulle à comptabiliser, aucun compte en vigueur ;
- `COMPTES_MINORITAIRES_INVALIDES` — le compte des intérêts minoritaires est de gestion, ou celui du résultat ne
  l'est pas ;
- `COMPTE_MINORITAIRES_DEJA_MOUVEMENTE` — une ligne de la balance porte déjà l'un des deux comptes (la société
  nommée) : la ligne des minoritaires doit n'être QUE celle-là ;
- `REGLES_MINORITAIRES_INDISPONIBLES` — le paquet de règles ne publie pas les racines ou la règle pour le référentiel
  de la mère à cette clôture (raison nommée) ;
- `RACINES_DE_GESTION_INCONNUES` — le paquet des liasses ne dit pas quels comptes portent le résultat.
⚠️ À la différence du compte de réserves (`409`, D-541-8) : sans lui, un report manquerait et la balance serait
FAUSSE ; sans les comptes des minoritaires, elle est simplement AGRÉGÉE — et le dit.

**D-544-10 — La publication.** `GET …/agregat` publie `interetsMinoritaires` (les comptes en vigueur, la règle lue et
son paquet, par société — la mère exceptée — son intérêt exact, son taux, sa part dans les capitaux propres et dans
le résultat, son éventuelle quote-part négative ; les totaux ; alertes ; manques), `resultat` (AC-4),
`controles.partageDuResultat`, et par compte la colonne `interetsMinoritaires`. Les méthodes du groupe publient
les deux comptes (`GET …/methodes-groupe`, `homogeneisation.methodesGroupe`).

**D-544-11 — Routes et rôles.** Aucune route nouvelle : `POST …/methodes-groupe` accepte les deux comptes,
`GET …/agregat` publie le partage — rôles inchangés (`TENANT_ADMIN`, `TENANT_USER`).

**D-544-12 — Bornes.** Aucune lecture nouvelle ; le coût du partage (fractions au pire cas de profondeur) est
**mesuré** à la borne des lignes de l'agrégat, consigné à côté des bornes existantes.

**D-544-13 — Le paquet de règles `consolidation-audcif@1.1`.** Celui de 543, plus une clé `interetsMinoritaires` :
les racines des capitaux propres partagés et la règle de la quote-part négative, fondements **verbatim**.
Applicable depuis la même date que 1.0 (2019-01-01) : ⚡ à date égale, la **plus haute version** l'emporte (jamais le
premier trouvé). Un écart déjà déclaré garde la règle qu'il a figée (1.0) ; le pont liste les deux versions.

## Hors périmètre — hooks inertes documentés

- **Présentation** (STORY-548) : la ligne « Intérêts minoritaires » du bilan consolidé, les trois lignes du compte de
  résultat (art. 90), la colonne des minoritaires du tableau de variation des capitaux propres, la note « part des
  minoritaires par filiale », le résultat par action (art. 90) ; le reclassement des capitaux propres des filiales
  en « réserves consolidées ».
- **Variation du pourcentage en cours d'exercice** (acquisition complémentaire, cession partielle sans perte de
  contrôle) et **entrée en cours d'exercice** : le partage lit l'intérêt à la clôture — le prorata du résultat
  relève de la variation de périmètre (STORY-548 ; 543, `LIEN_NON_RETENU`).
- **Impôts différés** (STORY-545) : leurs lignes se partageront par le propriétaire du retraitement qu'elles
  taxent. **Mise en équivalence** (STORY-546) : aucune part minoritaire, la seule quote-part du groupe.
  **Conversion** (STORY-547) : l'écart de conversion d'une filiale se partage comme ses capitaux propres.
  **Dividendes internes** (STORY-687) : leur élimination ne porte que la part du groupe.
- **Réévaluation totale d'une société détenue par plusieurs liens** (543, `REEVALUATION_TOTALE_A_REVOIR`) : la part
  publiée par l'écart est reprise telle quelle — le manque de 543 la nomme déjà.

## Progress Tracking

- 2026-09-28 — branches `MNV-544` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`)
  **avant toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-28 — **cadrage** : 8 constats, 13 décisions. Le partage attribue chaque montant à son propriétaire (M3) —
  vérifié à la main contre la méthode par paliers sur une cascade à trois niveaux, en réévaluation totale et
  partielle (égalité exacte ; l'erreur « (1 − intérêt) sur le résidu » s'en écarte de moitié) ; taux exact en
  fraction `bigint` (M2) ; racines des capitaux propres publiées par le paquet de règles de consolidation (M4) ;
  deux comptes déclarés au référentiel de méthodes du groupe (M5) ; trois lignes de résultat et un contrôle à deux
  chemins (M6). ⚠️ Le texte de l'AC-6 (M7) est encore en relevé sur l'édition officielle : sur arbitrage de l'user
  (« ok continue »), le développement démarre sur le mécanisme de D-544-6 ; la règle sera transcrite, et D-544-6
  amendée, dès le relevé rendu.
