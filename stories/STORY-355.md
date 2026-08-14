# STORY-355 : L'exercice appartient au dossier — un seul ouvert, un cycle de vie qui fait foi

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **J** · questions **Q6**, **Q7**, **Q8** *(tranchées)* · **STORY-066** *(le cycle de vie livré côté Bilan)* · **STORY-087** *(`ExerciceAtelier`)*
**Priorité :** Must Have
**Story Points :** 8
**Statut :** ✅ Terminée *(2026-08-14)*
**Complexité :** high
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service` *(+ read-model dans `balance-service` et `bilan-service`)*

---

## Le constat

Il existe **deux modèles d'exercice**, livrés, qui ne racontent pas la même chose :

| | `ExerciceAtelier` (`balance-service`, STORY-087) | `Exercice` (`bilan-service`, STORY-066 ✅) |
|---|---|---|
| Statuts | `OUVERT` \| `CLOS` — **`CLOS` est terminal** | ouvert / clos **+ `POST :id/rouvrir`** |
| Clôture | **effet de bord** de la reprise d'à-nouveaux, aucune route dédiée | route explicite |
| Lecture | ⚡ **aucune** — le contrôleur n'expose que `POST :exercice/ouvrir` | `GET` liste + `GET :id` |

« L'exercice 2023 est-il clos ? » a donc **deux réponses** selon le service interrogé. Rouvrir une
liasse côté Bilan laisserait la balance verrouillée côté Atelier — panne silencieuse, découverte au
pire moment.

**Q6 tranche : le dossier porte le cycle de vie de l'exercice.** Les deux modèles existants deviennent
des **projections**. **Q8 tranche : un seul exercice ouvert à la fois** — il faut clore pour ouvrir.
**Q7 tranche : les exercices antérieurs à l'entrée en portefeuille sont listables**, en consultation,
avec leur contenu.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **voir tous les exercices d'un dossier et savoir lequel est ouvert**,
afin de **travailler sur le bon, et de consulter les anciens sans risquer de les modifier**.

---

## Ce que la story livre

- **`Exercice` porté par le dossier** : `dossierId`, `libelle`, `bornes { debut, fin }`,
  `statut ∈ OUVERT | CLOS`, `origine ∈ ATELIER | MIGRATION`, `ouvertPar/Le`, `closPar/Le`.
  Les bornes restent **libres** — un premier exercice de 9,5 mois est normal (société créée en cours
  d'année) : `ExerciceAtelier.bornes` le permettait déjà, on ne régresse pas.
- **`GET /dossiers/:id/exercices`** — la lecture qui **n'existe nulle part aujourd'hui**. Rend chaque
  exercice avec ses bornes, son statut, son origine et ses horodatages d'ouverture/clôture.
- **`POST /dossiers/:id/exercices`** — ouverture. ⚡ **`409 EXERCICE_DEJA_OUVERT` si un exercice
  `OUVERT` existe déjà** (Q8). L'invariant est porté par un **index unique partiel**, pas par un
  pré-contrôle : deux ouvertures concurrentes ne doivent pas passer toutes les deux.
- **`POST /dossiers/:id/exercices/:exId/clore`** — clôture **explicite**, avec auteur et horodatage.
  Elle cesse d'être un effet de bord de la reprise d'à-nouveaux.
- **`POST /dossiers/:id/exercices/:exId/rouvrir`** — réservé à `TENANT_ADMIN`, motif obligatoire,
  journalisé. C'est la route qui **réconcilie** les deux modèles : rouvrir devient un acte unique,
  visible des deux côtés.
- **Q7 — exercices repris** : un exercice `origine: MIGRATION` peut être ajouté **rétroactivement**
  (antérieur à l'entrée en portefeuille), en consultation seule, sans liasse Prospera. Il est listé
  comme les autres et alimente les comparatifs N-1.
- **Événements `dossier.exercice.ouvert` / `.clos` / `.rouvert`** (outbox transactionnelle) :
  `balance-service` et `bilan-service` en tiennent chacun un **read-model** et cessent d'être la
  source de vérité sur le statut.

## Hors périmètre

- La **reprise des à-nouveaux** elle-même (calcul, affectation du résultat) → reste dans
  `balance-service` (STORY-087/088), qui **consomme** désormais le statut au lieu de le produire.
- Le **contenu** de l'exercice (balance, liasse, déclarations) → STORY-236, 357, et le module Fiscalité.
- La **ligne consolidée** de la maquette (balance validée + liasse figée + impôt dû par exercice) →
  **STORY-359**, qui agrège les read-models.

---

## Acceptance Criteria

- [x] `GET /dossiers/:id/exercices` rend la liste, du plus récent au plus ancien, avec bornes, statut,
      origine, `ouvertPar/Le` et `closPar/Le`. Dossier d'une autre organisation → **404**.
- [x] **Q8** : ouvrir un exercice alors qu'un autre est `OUVERT` → **409 `EXERCICE_DEJA_OUVERT`**,
      corps nommant l'exercice ouvert. Clore puis ouvrir → **201**.
- [x] L'invariant « un seul ouvert » tient sous **concurrence** : deux `POST` simultanés rendent un
      **201** et un **409** — vérifié par un test, l'unicité venant de l'**index**.
- [x] La clôture est une **route explicite** : après `POST .../clore`, `closPar` et `closLe` sont
      peuplés, et aucune reprise d'à-nouveaux n'a été nécessaire pour l'obtenir.
- [x] `POST .../rouvrir` — `TENANT_ADMIN` → **200** avec motif obligatoire (`400` sans motif) ;
      `TENANT_USER` → **403**. Une entrée de journal porte l'acte, son auteur et son motif.
- [x] **Q7** : un exercice `origine: MIGRATION` daté avant l'entrée en portefeuille est créable,
      listable, et **refuse toute écriture comptable** (`409`) — il est là pour être lu.
- [x] Un exercice à **bornes irrégulières** (9,5 mois) est accepté ; la durée calculée est exposée.
- [x] Les événements `dossier.exercice.*` sont émis **dans la transaction** (outbox), avec
      `partitionKey = dossierId` — deux exercices d'un même dossier ne peuvent pas être traités dans
      le désordre par un consommateur.
- [x] Ouvrir ou clore un exercice sur un dossier **archivé** → **409 `DOSSIER_ARCHIVE`** (STORY-353).

---

## Notes techniques

```ts
ExerciceSchema.index({ orgId: 1, dossierId: 1, 'bornes.debut': 1, 'bornes.fin': 1 }, { unique: true });
// Q8 — au plus UN exercice ouvert par dossier : c'est l'index qui l'impose.
ExerciceSchema.index(
  { dossierId: 1 },
  { unique: true, partialFilterExpression: { statut: 'OUVERT' } },
);
```

- **Migration des deux modèles existants** : `ExerciceAtelier` et `Exercice` (bilan) deviennent des
  read-models alimentés par les événements. Leur schéma n'est **pas** supprimé par cette story —
  STORY-356 (migration) les remplit, STORY-357 et STORY-236 les rebranchent. Supprimer d'abord
  laisserait les deux services aveugles entre deux stories.
- ⚠️ **Le sens de `CLOS` diverge entre les deux services** : terminal côté Atelier, réouvrable côté
  Bilan. La story tranche pour **réouvrable, sous autorisation admin et motif** — le comportement le
  plus permissif des deux, encadré. Le verrouillage de saisie de l'Atelier devient une conséquence du
  statut lu, pas une règle locale.
- Le `libelle` (« 2024 ») est **dérivé des bornes** et non saisi : deux exercices nommés « 2024 » avec
  des bornes différentes rendraient la comparaison N/N-1 ininterprétable.

---

## Dépendances

**Prérequises :** **STORY-301** *(dossier)* · **STORY-353** *(portée, archivage)*.
**Réancre :** **STORY-066** ✅ *(cycle de vie livré côté Bilan)* · **STORY-087** ✅ *(`ExerciceAtelier`)*.
**Débloque :** **STORY-236** *(la balance se scope sur dossier + exercice)* · **STORY-357**
*(bilan-service)* · **STORY-359** *(ligne consolidée du portefeuille)*.

---

## Definition of Done

- [x] Lint 0 · build OK · couverture ≥ seuils.
- [x] e2e : lecture, un seul ouvert (dont concurrence), clôture explicite, réouverture motivée et
      réservée, exercice repris en consultation, bornes irrégulières, refus sur dossier archivé.
- [x] Vérification docker : les **deux index** sont en base ; les événements `dossier.exercice.*`
      sont dans l'outbox en `SENT` avec la bonne clé de partition ; le read-model de `balance-service`
      converge après consommation.
- [x] `/code-review` + `/security-review`.

---

## Story Points Breakdown

- Modèle `Exercice` + les deux index (dont le partiel « un seul ouvert ») : 1,5 pt
- Routes lecture / ouverture / clôture / réouverture + gardes de rôle et de motif : 2 pts
- Exercices repris (Q7) : création rétroactive, lecture seule : 1 pt
- Événements + outbox transactionnelle + read-models amont : 2 pts
- Tests (concurrence, irrégularité, archivage) + vérification docker : 1,5 pt
- **Total : 8 points**

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Rédaction | ✅ | story préexistante (2026-08-09), reprise telle quelle — périmètre inchangé |
| Branchement | ✅ | `MNV-355` sur **4 dépôts**, ouvertes **avant** la première ligne de code (preuve ci-dessous) |
| Développement | ✅ | branche `MNV-355` sur les 3 services |
| Validation (DoD) | ✅ | lint 0 · build OK · `dossier` **568 unit + 116 e2e** (cov **99,52/94,85/97,48/99,48**) · `bilan` **882** (cov **98,54/92,91/98,56/98,49**) · `balance` cov **99/91,94/98,23/99,08** |
| Mutation-tests | ✅ | **12 mutations, 12 rouges**, aucune par erreur de compilation |
| Vérification docker | ✅ | 12 contrôles sur stack neuve (`down -v`) — voir ci-dessous |
| Revue de code | ✅ | **4 constats, 1 BLOQUANT** — tous corrigés, voir ci-dessous |
| Revue de sécurité | ✅ | **1 constat** (BASSE) — le **même** bug bloquant, trouvé INDÉPENDAMMENT. 7 axes examinés, 0 vulnérabilité d'autorisation, d'isolation, d'énumération ni d'injection |
| Clôture | ✅ | 3 PR rebase-mergées sur `dev` : `dossier-service#6`, `balance-service#36`, `bilan-service#40` |

### Preuve de branchement (phase ② — avant tout code)

```
docs                   MNV-355
dossier-service        MNV-355
balance-service        MNV-355
bilan-service          MNV-355
```

⚠️ Le contrat d'événement `dossier.exercice.*` touche **3 dépôts** (1 producteur + 2 consommateurs) :
les trois PR s'ouvrent et s'intègrent **ensemble**, sinon les read-models divergent en silence.

### Ce qui a été livré

**`dossier-service` (producteur, source de vérité)**

- modèle `Exercice` (collection `exercices`) + **deux index uniques nommés** — les nommer n'est pas
  décoratif : le service doit savoir *lequel* a été violé pour rendre le bon `409`, et « clôturez
  l'exercice courant » n'appelle pas le même geste que « corrigez vos dates » ;
- **`unicite_exercice_ouvert`** : `{ dossierId }` **partiel** sur `{ statut: 'OUVERT' }` — Q8 tenue par
  la **BASE**. Un index *plein* aurait interdit le deuxième exercice tout court, c'est-à-dire
  l'historique que `GET` existe pour rendre ;
- **bornes ramenées à minuit UTC avant écriture** : sans cela l'index compare des instants **à la
  milliseconde**, et deux ouvertures de « 2024 » saisies à deux heures différentes sont deux clés
  distinctes — l'index n'interdit alors plus rien ;
- 4 routes : `GET` (la lecture qui n'existait **nulle part**), `POST` (ouverture), `POST …/clore`
  (clôture **explicite**, plus un effet de bord de la reprise d'à-nouveaux), `POST …/rouvrir`
  (`TENANT_ADMIN`, motif obligatoire, journalisé) ;
- `libelle` **dérivé** des bornes, `dureeEnJours` **calculée** (bornes incluses) — aucun des deux
  n'est saisissable, la whitelist stricte rend `400` ;
- 3 événements via **outbox transactionnelle**, `partitionKey = dossierId` ;
- **reprise sur `WriteConflict`** (patron STORY-354) : sans elle, deux ouvertures simultanées
  rendaient `201` + `500` au lieu de `201` + `409` — sur le seul scénario qui motive Q8.

**`balance-service` et `bilan-service` (read-models, hooks inertes)**

- collection `exercices_dossier` (nommée en `snake_case`, contrairement aux read-models voisins qui
  retombent sur le pluriel Mongoose), consumer group **isolé**, projection idempotente ;
- **rien ne les lit encore** — c'est délibéré : la projection doit converger *avant* que STORY-236 et
  STORY-357 en dépendent, sinon elles démarreraient sur un read-model vide pour tous les dossiers
  antérieurs.

### Trois décisions de conception

1. **`ExerciceTopic` est un enum SÉPARÉ de `DossierTopic`.** Les consommateurs s'abonnent par
   `Object.values(<Enum>)` : les y ajouter aurait abonné **automatiquement** tout consommateur de
   `dossier.*` (STORY-236/357/358) à une charge utile qui n'a pas la forme de `DossierEtatV1` — un
   read-model de dossier écrit depuis un exercice, `statut` valant `OUVERT` au lieu d'`ACTIF`, et un
   portefeuille faux mais parfaitement plausible.
2. **Q7 se traduit par « un `MIGRATION` naît `CLOS` et ne se rouvre pas ».** `dossier-service` n'a pas
   à savoir ce qu'est une écriture comptable : toute saisie exige un exercice ouvert, donc refuser la
   réouverture suffit — et l'exercice repris ne consomme pas la place de l'exercice courant, sans quoi
   reprendre trois exercices antérieurs empêcherait d'ouvrir l'exercice en cours.
3. **Aucune garde de version dans les projections**, alors que le contrat porte `version`. Les deux
   voies par lesquelles un message ancien arriverait après un récent sont déjà fermées (ordre
   intra-partition, marqueur d'idempotence). Un filtre `version: { $lt: … }` sur un `upsert` créerait
   au contraire un piège réel : le filtre ne matcherait pas, l'upsert tenterait une **insertion**, et
   l'index unique sur `exerciceId` rendrait un `E11000` sur un message parfaitement normal.

### Mutation-tests — 12 mutations, 12 rouges

Aucune n'est rouge par **erreur de compilation** (leçon STORY-179 : `TS6138` ne prouve rien).

| Mutation | Test qui vire au rouge |
|---|---|
| bornes non normalisées à minuit UTC | e2e « bornes à minuit UTC » |
| garde `DOSSIER_ARCHIVE` retirée de l'ouverture | e2e dossier archivé |
| `partitionKey = orgId` au lieu de `dossierId` | spec « partitionne par dossierId, JAMAIS par orgId » |
| `$unset closPar/closLe` retiré de la réouverture | e2e + spec de réouverture |
| `@Roles(TENANT_ADMIN)` retiré de `rouvrir` | e2e 403 + spec de métadonnée |
| les deux index ne sont plus distingués | e2e `EXERCICE_BORNES_DEJA_UTILISEES` |
| reprise sur `WriteConflict` désactivée | 2 specs de concurrence |
| exercice `MIGRATION` naît `OUVERT` | e2e Q7 |
| refus de réouverture d'un `MIGRATION` retiré | e2e Q7 |
| `version` sortie du filtre du verrou optimiste | spec repository |
| `$unset` des horodatages retiré du read-model | spec projection (balance) |
| date illisible acceptée par le read-model | spec `versExerciceProjetable` |

### Vérification docker — stack neuve (`down -v`), 12 contrôles

Rejouée **après** un `docker compose restart` des 3 services : `nest --watch` peut annoncer
« Found 0 errors » en exécutant encore l'ancien module (leçon `hot-reload-ment-verif-docker`).
`ExercicesController {/api/dossiers/:dossierId/exercices}` confirmé dans les logs.

| # | Contrôle | Résultat |
|---|---|---|
| ③ | les **deux index** existent en base | ✅ `unicite_exercice_ouvert` UNIQUE **PARTIEL** `{statut:"OUVERT"}` · `unicite_bornes_exercice` UNIQUE |
| ④ | Q8 — 2ᵉ ouverture | ✅ `409 EXERCICE_DEJA_OUVERT`, `details` nommant l'exercice bloquant |
| ⑤ | bornes en base | ✅ `2024-01-01T00:00:00.000Z` / `2024-12-31T00:00:00.000Z` depuis une saisie à `08:30` et `22:00` · libellé `2024` |
| ⑥ | outbox | ✅ `status=SENT`, **`partitionKey = dossierId`** et **≠ `orgId`** |
| ⑦ | journal | ✅ `EXERCICE_OUVERT` attribué, avec bornes, durée et origine |
| ⑧ | clôture → réouverture | ✅ `CLOS` v2 (`closPar`/`closLe` peuplés) → `OUVERT` v3, **`closPar`/`closLe` RETIRÉS en base** |
| ⑨ | Q7 | ✅ `MIGRATION` naît `CLOS` (durée 365) · réouverture → `409 EXERCICE_MIGRATION_NON_REOUVRABLE` |
| ⑩ | **concurrence : 6 ouvertures simultanées** | ✅ **1×`201` + 5×`409`, AUCUN `500`** · **1 seul** exercice `OUVERT` en base |
| ⑪ | read-models | ✅ **3 documents projetés dans `balance_service` ET `bilan_service`**, statuts/versions concordants ; l'exercice rouvert y est `OUVERT` v3 **sans** `closPar`/`closLe` |
| ⑫ | atomicité | ✅ triplet `exercices` = `dossiers_journal` = `outbox_events` = 1 — aucun orphelin après les 5 refus |

⚠️ Le contrôle ⑩ est celui qui compte : `1×201 + 5×409` **sans aucun `500`** prouve à la fois que
l'invariant vient de l'**index** (pas d'un pré-contrôle) et que la reprise sur `WriteConflict` est
nécessaire — sans elle, STORY-354 avait mesuré 3 `500` sur 6.

### Revue de code — 4 constats, 1 BLOQUANT, tous corrigés

⚡⚡ **Le constat bloquant a été trouvé DEUX FOIS, indépendamment** — par la revue de code (axe
correctness) et par la revue de sécurité (axe validation d'entrée). Les deux ont remonté la même
chaîne, chacune l'ayant vérifiée par exécution plutôt que par lecture.

**① BLOQUANT — `500` au lieu de `400` sur une date ISO que `Date` ne parse pas.**
`@IsDateString()` délègue à `validator.isISO8601`, qui accepte les formats ISO **semaine** et
**ordinal** : `2024-W01-1`, `2024-060`, `2023-366` franchissent le DTO. V8 ne les parse pas ⇒
`Invalid Date`. Et le maillon qu'on n'attend pas : la garde d'ordre comparait alors `NaN < NaN`, qui
vaut **`false`** — elle *laissait passer*. Le premier `toISOString()` levait un `RangeError`, rendu
en `500` générique là où Swagger promet `400 BORNES_EXERCICE_INVALIDES`. Un contrôle de lisibilité
est désormais posé **avant** celui de l'ordre.
⚠️ Le cas de test doit utiliser une de ces trois formes : `2024-13-01` ne prouverait rien, `isDateString`
le refusant déjà en amont.

**② NON-BLOQUANT — la branche `keyPattern` de l'index « un seul ouvert » était MORTE.**
`keyPattern` ne contient que la **spécification de clé**, jamais le `partialFilterExpression`. Mesuré
en base :

```
unicite_exercice_ouvert  → { dossierId: 1 }          ← JAMAIS `statut`
unicite_bornes_exercice  → { orgId: 1, dossierId: 1, 'bornes.debut': 1, 'bornes.fin': 1 }
```

Le témoin `'statut'` rendait donc la branche **inatteignable**, et les fixtures des deux suites
fabriquaient un `keyPattern` que Mongo n'émet jamais : une branche morte qui passait pour vérifiée.
Le jour où le message d'erreur perd le nom de l'index, le `409 EXERCICE_DEJA_OUVERT` — l'AC central
de la story — retombait en `500`.
⚡ **Et les deux clés se chevauchent sur `dossierId`** : l'index des bornes est désormais testé **en
premier**, via `'bornes.debut'`, seul discriminant. L'ordre est *load-bearing* — l'inverser ferait
dire « clôturez votre exercice » à qui doit corriger ses dates.

**③ NON-BLOQUANT — aucun test du PRODUCTEUR ne figeait les littéraux de topic.**
`exercice-events.service.spec.ts` comparait `params.topic` à `ExerciceTopic.EXERCICE_OUVERT` : l'enum
comparé à lui-même, donc **tautologique vis-à-vis de la valeur sur le fil**. Les tests de contrat des
deux consommateurs figent des littéraux **locaux** — ils ne comparent rien au producteur, qui vit
dans un autre dépôt. Une faute de frappe (`…rouvertt`) laissait les **trois** suites vertes et
publiait sur un topic que personne ne consomme.

**④ NON-BLOQUANT — l'assertion d'ordre de la liste était vacante.**
Le double e2e **ignorait l'argument** de `sort()` et re-triait lui-même : retirer le `.sort()` du
repository laissait le test vert.

*Constat ponytail retenu* : type de retour de `resoudre()` simplifié en `DossierDocument`.

### Revue de sécurité — 0 vulnérabilité

7 axes examinés, chacun vérifié en lisant le code réel : chaîne de guards, isolation multi-tenant,
anti-énumération, injection/validation, données publiées sur Kafka, déni de service, fuite par les
logs. **Aucune faille d'autorisation, d'isolation, d'énumération ni d'injection.** Le seul constat
retenu est le bug ① ci-dessus (gravité BASSE : levé avant toute I/O, aucune écriture, aucune fuite).

Deux points signalés et **écartés après vérification du chemin d'appel complet** :

- `trouverOuvert(dossierId)` ne filtre pas sur `orgId` — mais son seul appelant lui passe l'`_id`
  d'un dossier **déjà résolu sous portée**, jamais la chaîne d'URL. Absence de défense en profondeur,
  pas de vecteur d'accès ;
- `updateOne({exerciceId}, { $set: reste })` dans les projections — `reste` n'est **pas** la charge
  réseau : c'est l'objet reconstruit champ par champ par `versExerciceProjetable`, 13 clés fixes après
  contrôle de type. Aucune clé contrôlée par l'attaquant, donc aucun opérateur `$` injectable.

### Mutation-tests des correctifs — 5 mutations, 5 rouges (17/17 sur la story)

| Mutation | Test qui vire au rouge |
|---|---|
| contrôle de lisibilité des bornes retiré | e2e `400` sur `2024-W01-1` |
| témoin de l'index ouvert remis sur `statut` | spec « reconnaît par le keyPattern SEUL » |
| ordre des deux contrôles d'index inversé | spec « ne confond PAS une collision de bornes » |
| faute de frappe dans un littéral de topic | spec de contrat du producteur |
| tri retiré du repository | e2e d'ordre de la liste |

### Vérification docker REJOUÉE sur l'état final

Les correctifs touchant `traduireDuplicata` — un chemin déjà vérifié —, les 12 contrôles ont été
rejoués après `docker compose restart` : **tous verts**. Plus une preuve ciblée de la discrimination,
en base réelle, que seul le code corrigé peut produire :

```
mêmes bornes (index BORNES)        → EXERCICE_BORNES_DEJA_UTILISEES
2e ouvert, bornes ≠ (index OUVERT) → EXERCICE_DEJA_OUVERT
borne ISO semaine (constat ①)      → HTTP 400 BORNES_EXERCICE_INVALIDES
```
