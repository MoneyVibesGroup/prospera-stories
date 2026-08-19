# STORY-303 : Les 2 axes appartiennent au dossier et sont datés par exercice — un changement vaut à partir de l'exercice ouvert, jamais rétroactivement

**Epic :** EPIC-043 — Le dossier client, entité de premier rang
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **M** · question **Q9** *(tranchée)* · constat de code ligne 77
**Priorité :** Must Have
**Story Points :** 8 *(⬆️ 5 → 8, voir §Story Points Breakdown — le titre sous-évaluait le périmètre)*
**Statut :** 🔎 En revue
**Complexité :** medium-high
**Créée le :** 2026-08-09 *(slottée)* · **Rédigée le :** 2026-08-19
**Sprint :** 20 (backend)
**Service :** `prospera-dossier-service` (`:3009`) **+ `prospera-balance-service` (`:3007`)` — deux dépôts**

---

## Le constat

**Cette story était slottée depuis dix jours sans avoir jamais été écrite** — seule des 27 stories
`STORY-3xx` du tracker à ne porter ni fichier ni `story_path`. Elle a été rédigée le 2026-08-19 après
que **FE-060** *(l'assistant de création de dossier)* soit tombée dessus : son étape 3 devait poser
les 2 axes, et il n'y avait aucun endroit sûr où les écrire.

Le titre d'origine — « les 2 axes sont **datés par exercice** » — décrit la **moitié** du travail, et
pas la plus urgente. Voici l'autre moitié, vérifiée dans le code le 2026-08-19.

### ① Le profil société est **unique par organisation**, et c'est lui qui porte les axes

```
balance-service/src/modules/profil-societe/schemas/profil-societe.schema.ts:142
  ProfilSocieteSchema.index({ orgId: 1 }, { unique: true });
  // commentaire du schéma : « Une organisation = une société : l'unicité orgId est assumée »
```

C'est **exactement le modèle que l'EPIC-043 abandonne**, et il est toujours vivant.

### ② Quatre sites de lecture appliquent les axes du CABINET aux dossiers CLIENTS

STORY-236 a re-scopé les **données** au dossier ; la lecture du **profil**, elle, est restée keyée par
organisation. Le contraste est visible **dans un seul et même appel** :

```
balance-service/src/modules/cahiers/agregation/agregation.service.ts:118-124
  this.recettes.lister(orgId, dossierId, exercice),        ← re-scopé (236)
  this.depenses.lister(orgId, dossierId, exercice),        ← re-scopé (236)
  this.comptesVentilation.effectifs(orgId, dossierId),     ← re-scopé (236)
  this.profils.trouverParOrg(orgId),                       ← ⛔ PAS re-scopé
```

| Site | Ce qui se passe pour un dossier CLIENT |
|---|---|
| `fiscal/contexte-fiscal.service.ts:105-107` | `regime: profil?.regimeFiscal ?? REEL` → le **régime du cabinet** est appliqué au client, ou `REEL` par défaut si le cabinet n'a pas de profil |
| `cahiers/cahiers-recettes.service.ts:706-717` | `assujetti: profil?.regimeFiscal === REEL` → la **TVA du client** est décidée par l'axe du cabinet |
| `cahiers/cahiers-depenses.service.ts:1009-1016` | idem, côté dépenses |
| `cahiers/agregation/agregation.service.ts:123-131` | la balance du client est **taguée** avec le `systemeComptable` du cabinet, ou refusée (`SystemeComptableIndetermineException`) |

⚡ **CE N'EST PAS UN PLANTAGE, ET C'EST CE QUI LE REND GRAVE** : le calcul aboutit, le chiffre est
**plausible**, et il est **opposable**. Une microfinance au SMT calculée sur les axes d'un cabinet au
SN produit une liasse qu'on ne découvre fausse qu'au contrôle. C'est le **risque nº 2** du ticket,
appliqué au montant plutôt qu'à l'affichage.

### ③ Une route promet une portée que son écriture ne tient pas

`POST /api/v1/dossiers/{dossierId}/profil-societe/regime` **existe** et **paraît** scopée au dossier.
Sa propre description OpenAPI dit l'inverse :

> ⚠️ « L'écriture porte sur l'**ORGANISATION ENTIÈRE**, pas sur le seul dossier du chemin : le profil
> société est unique par organisation. »

Et le service le journalise noir sur blanc *(`regime.service.ts:235`)* :

> `Régime confirmé pour TOUTE l'organisation ${orgId}, depuis le dossier ${dossierId}`

⛔ **Conséquence : confirmer les axes du client B écrase ceux du client A et du cabinet, en `200`.**
Le `dossierId` du chemin ne sert qu'à deux choses — calculer la **proposition** sur le CA du dossier,
et **estampiller** le journal d'audit.

### ④ La documentation du service annonce déjà l'état cible comme atteint

`regime.controller.ts:43-46`, en tête de classe :

> « **STORY-236** : […] les 2 axes `systemeComptable`/`regimeFiscal` sont **désormais portés par le
> dossier** (STORY-302/303) »

**C'est faux**, et ça contredit la description de son propre `POST` quinze lignes plus bas. ⚡ Un
commentaire d'écart périmé garde l'ancienne vérité **active** *(défaut déjà payé en FE-017)* : ici,
quelqu'un qui lit la doc de classe conclut que le travail est fait.

### ⑤ Et seulement ensuite : la datation

Les axes sont des champs **courants**, non datés *(`profil-societe.schema.ts:114-118`)*. La maquette
promet « un changement d'axe ne rejoue pas les exercices déjà clos » : c'est vrai d'une **liasse
figée** *(snapshot)*, **faux de tout recalcul** — le moteur fiscal lit la valeur du jour. Changer un
axe en 2026 et recalculer 2023 ne rend pas le même impôt *(Q9, tranchée : à partir de l'exercice
ouvert, jamais globalement)*.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux que **le système comptable et le régime fiscal appartiennent au dossier et vaillent pour un
exercice donné**,
afin que **le calcul d'un client n'emprunte jamais les axes d'un autre, et qu'un changement de régime
ne réécrive pas un exercice déjà arrêté**.

---

## Ce que la story livre

### A. Les axes migrent sur le dossier, datés par exercice

- **Un couple d'axes daté**, porté par `dossier-service` : `{ dossierId, effetADater, systemeComptable,
  regimeFiscal, motif?, decidePar, decideLe }`, **append-only**. On n'écrase pas une décision, on en
  ajoute une — sinon l'historique du bloc M est irrécupérable.
- **Résolution `axesAuxDates(dossierId, date)`** : la décision **en vigueur à cette date**, jamais
  « la dernière ». C'est toute la story en une fonction.
- ⚠️ **`effetADater` est une DATE, pas un `exerciceId`.** Un exercice repris en `MIGRATION` (Q7) peut
  naître clos et postérieur ; indexer sur l'exercice rendrait la résolution dépendante de l'ordre de
  création. La date, elle, est totalement ordonnée.
- **Migration des valeurs existantes** : chaque `profil-societe.{systemeComptable, regimeFiscal}` est
  reversé sur le dossier « Mon cabinet » correspondant, avec `effetADater = createdAt` du profil —
  **jamais la date du jour**, qui daterait l'historique du cabinet du jour de la migration.

### B. `balance-service` lit les axes DU DOSSIER

- Les **4 sites** du tableau ci-dessus passent de `profils.trouverParOrg(orgId)` à la résolution
  datée, **scopée `dossierId` + date de l'exercice traité**.
- **Read-model local** alimenté par événement *(`dossier.axes.decides`)*, sur le patron déjà en place
  pour `dossiers_dossier` — **à copier, pas à concevoir**.
- ⚠️ **Le défaut `?? REEL` de `contexte-fiscal.service.ts` est CONSERVÉ** *(D-095-1)*, mais il change
  de sens : il couvre « ce dossier n'a pas encore décidé », plus « cette organisation n'a pas de
  profil ». Le supprimer rendrait la story régressive sur tous les dossiers antérieurs.

### C. La route de confirmation cesse de mentir

- `POST /dossiers/{dossierId}/profil-societe/regime` **écrit sur le dossier du chemin**, et sur lui
  seul. La proposition *(`GET`)*, sa motivation et l'exigence de motif en cas de divergence sont
  **reprises de STORY-080, livrée** — on date une décision existante, on ne la réinvente pas.
- Le corps accepte `effetADater` *(défaut : début de l'exercice OUVERT du dossier)*.
- ⚠️ **Le commentaire de tête de `regime.controller.ts` est corrigé dans la même PR.** Le laisser
  serait livrer une story dont la documentation dit qu'elle était déjà faite.

---

## Hors périmètre

- ⛔ **Le volet « par implantation »** — il reste au module Fiscalité (EPIC-028). Tant qu'on est
  mono-pays (D10), le couple d'axes appartient au dossier, pas à l'implantation.
- ⛔ **Le re-calcul rétroactif des liasses déjà figées.** Une liasse validée est un snapshot : elle ne
  se rejoue pas. Cette story empêche qu'un **recalcul** diverge, elle ne réécrit rien.
- ⛔ **`profil-societe` lui-même n'est pas démantelé.** STORY-236 le place explicitement hors
  périmètre *(« sujet séparé, à trancher avec le PO »)*. On lui retire les **2 axes**, pas son
  identité fiscale — laquelle reste org-keyée, avec sa propre dette.
- ⛔ **L'UI.** Côté frontend : **FE-065** *(les 2 axes datés)*. ⚠️ **FE-060 n'affiche volontairement
  aucun axe** — vérifié : ses tests interdisent par la négative tout sélecteur de système comptable
  ou de régime.

---

## Acceptance Criteria

**AC-1** — Deux dossiers d'un **même cabinet** portant des axes **différents** produisent des calculs
différents. ⚡ **Assertion par les CHIFFRES, jamais par l'écho de l'écriture** : un dossier au régime
`SYNTHETIQUE` et un dossier `REEL` rendent deux liquidations distinctes, sans **aucune** valeur en
commun *(patron d'AC-7 de STORY-357)*.

**AC-2** — **Le test de non-fuite** : aucun des 4 sites listés n'appelle plus
`profils.trouverParOrg(orgId)` pour lire un axe. **Un test de garde balaye l'arbre `src/`**, pas
seulement `src/modules` — une garde qui ne couvre pas tout l'arbre ment sur sa portée *(leçon
STORY-357)*.

**AC-3** — Un changement d'axe **à partir d'aujourd'hui** ne modifie **pas** le résultat d'un recalcul
sur un exercice antérieur. C'est la promesse Q9, et elle se prouve par un recalcul **avant/après**
sur le même exercice clos, pas par une lecture de champ.

**AC-4** — La confirmation depuis le dossier B **laisse le dossier A et « Mon cabinet » inchangés**.
⚡ C'est l'AC qui ferme le défaut ③ : il doit **échouer** sur le code actuel.

**AC-5** — Un dossier **sans décision d'axes** se comporte **exactement** comme avant la story
*(`?? REEL`, et `SystemeComptableIndetermineException` sur l'agrégation)*. Non-régression des
dossiers antérieurs.

**AC-6** — La migration est **idempotente** et **réversible** : rejouée, elle ne crée pas de seconde
décision ; sa marche arrière ne touche que ce qu'elle a écrit *(patron STORY-356 : `origine`
marquée)*.

**AC-7** — **Aucune route n'accepte d'`orgId`** : l'organisation vient du jeton, le dossier du chemin.

**AC-8** — Le commentaire de tête de `regime.controller.ts` décrit **ce que le code fait**, et la
description du `POST` ne le contredit plus.

---

## Écarts assumés avec la rédaction — décidés à l'implémentation

Quatre points de la rédaction ont été **ajustés en écrivant le code**, chacun pour une raison
vérifiée dans le dépôt. Ils sont listés ici plutôt que corrigés en silence : une story dont
l'implémentation diverge sans le dire est une story qui ment à la suivante.

1. **La route d'écriture est `POST /dossiers/{id}/axes` sur `dossier-service`**, et non le
   `POST …/profil-societe/regime` de `balance-service` que le §C demandait de « corriger ». Le §A pose
   `dossier-service` comme **propriétaire** du couple daté ; faire écrire cette donnée par son
   **consommateur** aurait violé l'invariant #2 (une base par service) et créé deux écritures possibles
   pour un même fait — exactement la contradiction que Q6 a fermée pour l'exercice. C'est aussi la route
   que **FE-065 déclare** *(`POST /api/v1/dossiers/:id/axes`)*. L'ancien `POST` est **retiré** : il
   n'avait aucun client *(FE-042 est `blocked`, FE-060 n'affiche aucun axe)*, et le laisser aurait laissé
   vivante la contamination org-wide du défaut ③.
2. **Le motif est exigé sur TOUT changement**, pas seulement sur une divergence de la proposition.
   STORY-080 vérifiait la divergence en **recalculant la proposition côté serveur** — précisément pour que
   le client ne puisse pas mentir dessus. `dossier-service` ne peut pas la recalculer *(elle exige le CA
   d'une balance et les seuils du paquet fiscal)*, et croire un drapeau `divergent` transmis dans le corps
   rouvrirait ce contournement. La règle appliquée est donc **strictement plus forte** et vérifiable
   localement. La **proposition** (`GET …/profil-societe/regime`) reste servie par `balance-service`.
3. **`effetADater` de la reprise = la plus ANCIENNE de trois candidates locales** *(date de création
   légale, début du plus ancien exercice, `createdAt`)*, et non le `createdAt` du profil : ce champ
   **n'existe pas** dans le contrat `profil.societe.consolide` *(vérifié — il porte `dateCreation` et
   `version`)*, et l'y ajouter aurait été un changement de contrat sur deux dépôts pour une donnée dont on
   n'a besoin que d'une **borne inférieure**.
4. ⛔ **Le garde-fou « index unique sur base non neuve » est INAPPLICABLE ici**, et le dire vaut mieux que
   le cocher : les deux collections (`decisions_axes`, `axes_dossier`) sont **neuves**, aucune clé
   existante n'est re-keyée, et `ProfilSocieteSchema.index({orgId:1})` n'est **pas** touché — le profil
   reste org-keyé (§Hors périmètre). Il n'y a donc aucun index obsolète à purger. La vérification a tout
   de même été rejouée sur une base **déjà peuplée** *(migration exécutée après le parcours HTTP)*.

---

## Notes techniques

⚠️ **DEUX DÉPÔTS, ET L'ORDRE COMPTE.** `dossier-service` produit, `balance-service` consomme. Livrer
le consommateur avant le producteur laisse les 4 sites sans donnée → tous les dossiers retombent sur
le défaut, en silence. **Producteur d'abord, dans la même PR ou dans la précédente.**

⚠️ **La propagation est ASYNCHRONE (outbox → Kafka).** Ne jamais supposer l'instantanéité dans un
e2e : attendre une **condition**, jamais un délai *(leçon FE-066/STORY-355)*.

⚠️ **Index uniques et bases NON NEUVES.** Mongoose en `autoIndex` **crée** l'index déclaré et ne
**supprime jamais** l'obsolète. Une clé qui passe de `{orgId}` à `{dossierId, effetADater}` laisse
l'ancienne en place, et le **deuxième** dossier d'un cabinet prend un `E11000` sur un index que
personne ne regarde — **invisible en CI**, parce que la vérification docker tourne sur `down -v`,
la seule condition où l'ancien index n'existe pas. ⇒ purge **ciblée par comparaison de CLÉ** (jamais
par nom, jamais `syncIndexes`), et **rejouer sur une base portant l'ancien index**. C'est le défaut
le plus coûteux de STORY-357 ; il est ici à l'identique.

⚠️ **`RegimeController` porte `@RequiresBalanceAccess()`** *(emailVerified + KYC + entitlement
`balance`)*. Le conserver : les axes servent au calcul, qui est le module Balance. Mais **noter** que
`dossier-service`, lui, n'a **aucun** gate KYC aujourd'hui *(STORY-363)* — les deux services n'ont
donc pas la même porte d'entrée sur la même donnée.

⚠️ **Ne pas dupliquer la datation dans `bilan-service`.** Il consomme le read-model, comme pour
`dossiers_dossier`. Une seconde source de vérité sur « quel régime en 2024 » rejouerait exactement la
contradiction que Q6 a fermée pour l'exercice.

---

## Dépendances

- **STORY-080** *(détermination des 2 axes)* — ✅ `done`. La proposition, la confirmation humaine et le
  motif de surcharge sont **réutilisés**, pas réécrits.
- **STORY-236** *(re-scopage `balance-service`)* — ✅ `done`. C'est elle qui a laissé les 4 sites
  derrière ; cette story les termine.
- **STORY-355** *(exercices du dossier)* — ✅ `done`. Fournit l'exercice ouvert, défaut d'`effetADater`.
- **STORY-356** *(migration profil → « Mon cabinet »)* — ✅ `done`. Fournit le lien profil ↔ dossier
  dont la migration A a besoin.
- **FE-065** *(frontend)* — **bloquée par cette story**, et ne peut pas partir avant.

---

## Definition of Done

- [ ] Modèle daté + résolution `axesAuxDates` dans `dossier-service`, **append-only**
- [ ] Migration idempotente et réversible des axes de `profil-societe` vers les dossiers
- [ ] Les **4 sites** de `balance-service` lisent les axes du dossier — **test de garde sur `src/`**
- [ ] `POST …/regime` écrit **sur le dossier du chemin** ; commentaire de classe corrigé
- [ ] AC-1 et AC-4 prouvés **par les chiffres**, sur deux dossiers d'un même cabinet
- [ ] Mutation-tests : chaque garde **rouge par assertion**, jamais par erreur de compilation
- [ ] Vérification docker sur stack neuve **ET rejouée sur une base portant l'ancien index**
- [ ] Revue de code + revue de sécurité
- [ ] PR **rebase-mergée** sur `dev` des deux dépôts, producteur en premier

---

## Story Points Breakdown

⬆️ **5 → 8.** L'estimation d'origine suivait le titre — « dater un champ ». Le périmètre réel est le
**déplacement d'une donnée hors d'un modèle org-unique**, sur **deux dépôts** :

| Poste | Pts |
|---|---|
| Modèle daté + résolution + événement *(`dossier-service`)* | 2 |
| Migration idempotente/réversible + purge d'index sur base non neuve | 2 |
| Read-model + bascule des 4 sites *(`balance-service`)* | 2 |
| Correction de la route `regime` + de sa documentation contradictoire | 1 |
| AC-1/AC-4 par les chiffres + mutations + docker rejoué | 1 |

⚠️ **Ce qui n'est PAS dans ces 8 points** : le démantèlement de `profil-societe`. Il reste org-keyé,
et sa dette reste ouverte *(STORY-236, « sujet séparé, à trancher avec le PO »)*.

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Rédaction | ✅ | branche `docs/MNV-303` — story écrite le 2026-08-19 par le dev externe, **ajustée** (§Écarts assumés) à l'implémentation |
| Branches (2 dépôts) | ✅ | `MNV-303` posée sur `prospera-dossier-service` **et** `prospera-balance-service` **avant** la première ligne |
| Développement | ✅ | producteur d'abord, consommateur ensuite |
| Validation (DoD) | ✅ | `dossier-service` : lint 0 · build OK · **688 unit + 148 e2e** · couverture **99,21 / 91,56 / 96,74 / 99,21**<br>`balance-service` : lint 0 · build OK · **2915 unit + 668 e2e** · couverture **99 / 91,86 / 98,22 / 99,09** |
| Mutation-tests | ✅ | **13 mutations, 13 rouges PAR ASSERTION** — dont une qui a SURVÉCU au premier tour (tableau ci-dessous) |
| Vérification docker | ✅ | stack neuve `down -v`, parcours réel sur 3 dossiers d'un même cabinet — **1 défaut trouvé, invisible aux 3 831 tests** |
| Revue de code | ⏳ | |
| Revue de sécurité | ⏳ | |
| Clôture | ⏳ | |

### ⚡⚡ Ce que la vérification docker a trouvé et que 3 831 tests ne pouvaient pas voir

**`AgregationModule` n'importait pas `ReadModelsModule`.** `AxesResolver` a été câblé dans
`CahiersModule` et `FiscalModule` — mais `AgregationService` vit dans **son propre module**. Au premier
démarrage réel :

```
Nest can't resolve dependencies of the AgregationService (…, ?, …).
Please make sure that the argument AxesResolver at index [5] is available
in the AgregationModule module.
```

⚠️ **Ni les 2 915 unitaires ni les 668 e2e ne pouvaient l'attraper** : les uns construisent le service
au constructeur, les autres montent un `TestingModule` où le provider est fourni **à la main**. Le
graphe de dépendances réel n'est assemblé qu'au boot. C'est le mode de défaut exact que la
vérification docker existe pour fermer — et il aurait rendu `balance-service` **entièrement mort au
démarrage**, pas seulement l'agrégation.

### Preuves docker — stack neuve (`down -v`), cabinet réel, 3 dossiers

| # | Ce qui est prouvé | Comment |
|---|---|---|
| 1 | **AC-4 — la décision ne touche QUE le dossier du chemin** | 2 dossiers clients du **même cabinet**, décidés l'un après l'autre : `decisions_axes` contient **2 lignes, une par `dossierId`**, couples différents. Avant la story, la seconde confirmation écrasait la première *(profil unique par organisation)* |
| 2 | **Les 3 refus n'écrivent RIEN** | `MOTIF_AXES_REQUIS` (400), `EFFET_A_DATER_RETROACTIF` (400, message nommant l'exercice ouvert), no-op sur couple identique (rend la décision existante) → `countDocuments` **inchangé**, aucun orphelin |
| 3 | **Le journal porte l'état REMPLACÉ** | `dossiers_journal` : `systemeComptableAvant`/`regimeFiscalAvant` + `exerciceOuvertId`, avec l'auteur réel |
| 4 | **Index réellement créés** | `unicite_decision_migration` = `{dossierId:1}` **unique + partialFilterExpression `{origine:'MIGRATION'}`** ; lecture `{orgId,dossierId,effetADater:-1,_id:-1}` |
| 5 | **Round-trip Kafka complet** | outbox `SENT` (partitionKey = `dossierId`) → `axes_dossier` de `balance_service` **convergé**, 4/4 décisions, index `decisionId` unique |
| 6 | ⚡ **Q9 — le même dossier, trois exercices, trois réponses** | `GET …/axes?exerciceId=` → **2027 : SMT/SYNTHETIQUE** · **2026 : SN/REEL** *(inchangé par la décision de 2027)* · **2023 : AUCUN**. Le changement de 2027 **n'a pas réécrit** 2026 |
| 7 | ⚡⚡ **Le MOTEUR FISCAL suit les axes datés — par dossier ET par exercice** | Dossier A : `/fiscal/tpu` **409 REGIME_INCOMPATIBLE en 2026** *(REEL)* mais **404 BALANCE_INTROUVABLE en 2027** *(SYNTHETIQUE — la garde laisse passer)* ; `/fiscal/liquidation` exactement l'inverse. Dossier B, **même cabinet, même exercice** : branches opposées à A. **C'est la promesse de la maquette, mesurée sur le calcul et non sur l'écho d'une écriture** |
| 8 | **AC-6 — migration idempotente** | 1ʳᵉ exécution : `1 créée` · 2ᵉ : `0 créée, 1 déjà migré` *(index partiel, jamais un pré-contrôle)*. Décision datée **2019-06-15** = la plus ancienne candidate, pas le jour de la migration |
| 9 | **AC-6 — marche arrière ciblée et HONNÊTE** | Supprime la seule décision `MIGRATION` + son entrée de journal ; les **3 décisions `CABINET` intactes**. Rapport : `outboxDejaPubliees: 1` avec un `warn` explicite — **une marche arrière ne dépublie pas**, et le compteur l'annonce au lieu de promettre une réversibilité fausse |
| 10 | **Le module ressuscité fonctionne** | Après correctif, `POST /dossiers/:id/balance/depuis-cahiers` traverse l'injection et atteint la règle métier (`EXERCICE_CLOS` / `REFERENTIEL_UNRESOLVED`) — plus aucune erreur d'assemblage |

### Mutations exécutées — 13 mutations, 13 rouges

| # | Mutation | Dépôt | Résultat |
|---|---|---|---|
| M1 | `decisionEnVigueur` : comparaison **large → stricte** | dossier | 🔴 la décision est exclue de son propre exercice |
| M2 | départage par `_id` retiré *(tri non total)* | dossier | 🔴 deux décisions de même date d'effet rendent un résultat dépendant de l'ordre de lecture |
| M3 | garde de **non-rétroactivité** retirée | dossier | 🔴 |
| M4 | `axesChangent` → `false` *(motif jamais exigé)* | dossier | 🔴 |
| M5 | reprise datée de la **plus récente** candidate | dossier | 🔴 |
| M6 | `partitionKey` = `orgId` au lieu de `dossierId` | dossier | 🔴 |
| M7 | `$lte` → `$lt` dans la résolution | balance | 🔴 |
| M8 | cascade **inversée** *(profil avant la décision datée)* | balance | 🔴 |
| M9 | résolution sur la **fin** de l'exercice | balance | 🔴 |
| M10 | retour d'une lecture d'axe sur le profil *(5ᵉ site)* | balance | 🔴 **la garde AC-2 le voit** |
| M11 | narrowing du référentiel rendu **permissif** | balance | ⚠️ **🟢 SURVIVANTE au 1ᵉʳ tour** — aucun test ne soumettait une valeur d'axe inconnue à l'agrégation. Test ajouté, mutation rejouée : 🔴 |
| M12 | régime daté inconnu **replié sur le profil du cabinet** | balance | 🔴 |
| M13 | garde du `RegimeFiscalGuard` sans dossier ni exercice | balance | 🔴 |

⚠️ **M11 est la plus instructive** : le narrowing fail-closed existait, il était **écrit et non
prouvé**. Sans la mutation, il aurait pu être affaibli par n'importe quelle story ultérieure sans qu'un
test ne bouge.

### Ce qui reste ouvert — dettes explicites

- ⛔ **`profil-societe` n'est pas démantelé** *(§Hors périmètre)* : `dateCreation` — dont dépend
  l'exonération de début d'activité — reste lue sur un profil **org-keyé**. La story déplace les 2 axes,
  pas l'identité fiscale.
- ⛔ **La marche `PROFIL_COURANT` de la cascade porte encore le défaut d'origine** : tant qu'un dossier
  n'a **aucune** décision datée, le régime du cabinet lui est appliqué. C'est le prix de la
  non-régression *(la reprise converge par Kafka)*, et la vérification docker montre qu'un dossier
  décidé n'y tombe plus. Elle est transitoire par nature.
- ⛔ **`dossier-service` n'a aucune gate KYC** *(STORY-363)* : les axes se lisent derrière
  `@RequiresBalanceAccess()` côté `balance-service` et derrière la seule chaîne JWT/portée côté
  `dossier-service`. Asymétrie **connue**, fermée pour tout le service par STORY-363.
- ⛔ **`docker-compose.yml` porte `KAFKA_AXES_GROUP_ID`** — la racine `/PROSPERA` n'étant dans **aucun
  dépôt**, cette ligne n'est couverte par aucune PR ni aucune CI *(leçon STORY-173)*. Le défaut du code
  (`balance-axes`) la rend cependant inoffensive si elle disparaît.
