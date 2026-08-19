# STORY-303 : Les 2 axes appartiennent au dossier et sont datés par exercice — un changement vaut à partir de l'exercice ouvert, jamais rétroactivement

**Epic :** EPIC-043 — Le dossier client, entité de premier rang
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **M** · question **Q9** *(tranchée)* · constat de code ligne 77
**Priorité :** Must Have
**Story Points :** 8 *(⬆️ 5 → 8, voir §Story Points Breakdown — le titre sous-évaluait le périmètre)*
**Statut :** 📋 À faire
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
