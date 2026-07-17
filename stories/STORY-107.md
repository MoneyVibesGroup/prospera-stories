# STORY-107 : admin-panel — route de file de revue KYC (proxy `GET /admin/kyc?status=`) enrichie du nom d'organisation

**Epic :** EPIC-016 — Chaîne KYC complète (admin-panel)
**Service :** `admin-panel` (BFF, :3010)
**Points :** 3
**Sprint :** 10 (à tirer **avec STORY-106** — même dépôt, même famille de contrôleurs)
**Statut :** done — 2026-07-17
**Demandeur :** frontend — **prérequis de AP-03** (revue KYC), frontend sprint 4
**Origine :** audit des 7 dépôts backend du 2026-07-17

---

## Pourquoi cette story existe

Le frontend **AP-03** doit afficher **la file de revue KYC** : « les dossiers en attente d'instruction ».
Aujourd'hui, le BFF ne peut pas la servir, et **la contourner côté front serait faux**.

### Ce qui existe déjà (vérifié dans le code, ne pas re-livrer)

- `kyc-service` **sait déjà filtrer sa file** : `GET /admin/kyc?status=UNDER_REVIEW`
  (`AdminKycQueryDto.status`, validé par enum ; « absent → tous les dossiers »).
- Le BFF **consomme déjà** cette file : `KycServiceClient.listReviewQueue()` → `GET /admin/kyc`…
  **mais sans le paramètre `status`**, car il s'en sert pour construire un *index* d'enrichissement
  (`buildKycStatusIndex` → `Map<orgId, status>`), pas pour servir une file.
- La liste d'orgs enrichit bien chaque ligne d'un `kycStatus` (`AdminOrgListItemDto.kycStatus`).

### Pourquoi la liste d'orgs ne peut PAS servir de file de revue

`OrgAggregationService.listOrgs` est explicite : **la page est pilotée par `auth`**
(`fetchOrganizationsPage` → `auth.listOrganizations(query)`), puis enrichie du KYC *après coup*. Et
`ListOrgsQueryDto.status` porte sur l'**identité** (`IDENTITY_STATUSES = ACTIVE | SUSPENDED`), pas sur le KYC.

Conséquence : le `kycStatus` est un enrichissement **post-pagination**. Deux contournements, tous deux mauvais :

1. **Filtrer côté front à travers la pagination** — faux par construction : une page de 20 orgs peut ne
   contenir aucun dossier `UNDER_REVIEW` alors que la file n'est pas vide. L'agent croirait avoir tout traité.
2. **Ajouter `kycStatus` à `ListOrgsQueryDto`** — ⚠️ **c'était ma demande initiale, et c'est la mauvaise
   forme** : filtrer sur un champ enrichi *après* une pagination déléguée à `auth` obligerait le BFF à
   rapatrier **toutes** les orgs, fusionner, filtrer, puis re-paginer lui-même — ce qui **inverse la source
   de vérité de la pagination** et casse l'invariant « `auth` pilote la page ». Un correctif d'architecture
   pour un besoin de lecture : disproportionné.

**La bonne forme est l'inverse** : pour une file de revue, c'est le **KYC qui pilote la liste** — et
`kyc-service` sait déjà le faire. Il ne reste qu'à l'exposer.

---

## Portée

- **Nouvelle route de lecture** dans le BFF (nom à arbitrer à la rédaction, p. ex.
  `GET /api/v1/admin/kyc-reviews?status=`) qui **relaie** `GET /admin/kyc?status=` de `kyc-service`.
- **Permission** : `@RequirePermissions(Permission.ORG_READ)` — cohérent avec `KycAdminController`
  amont (STORY-105) et avec la lecture d'orgs. ⚠️ Dépend de **STORY-106** pour les guards par permission
  du BFF ; à tirer ensemble.
- **Enrichissement du nom d'org** : `KycReviewItem` ne porte que `{ orgId, status, submittedAt,
  reviewedAt, updatedAt }` — un agent ne peut pas travailler sur des `orgId` opaques. Joindre la raison
  sociale depuis `auth`. **Dégradation** : si `auth` est indisponible, servir la file **sans** les noms
  (`sources` le signale) plutôt que de tomber — patron de dégradation partielle déjà posé par STORY-047.
- **Le BFF ne décide/valide/persiste RIEN** (invariant AD-2) : il relaie et joint.

### Questions tranchées à la rédaction

1. **Pagination** → **non, pas en v1**. Le BFF est le **miroir fidèle** du contrat amont (file non
   paginée). Paginer *ici* la ferait porter sur une liste **déjà entièrement rapatriée** : le coût serait
   payé sans le bénéfice, et le `total` serait celui du BFF, pas celui de la source. **Dette assumée et
   tracée** (dans le code et ci-dessous), à lever **avec** l'amont, pas contre lui.
2. **Enrichissement du nom** → **index en une passe** (pagination de la liste `auth` + jointure en
   mémoire), **pas** de N+1 sur `getOrganization`. Le précédent de `buildEntitlementCounts` **ne
   s'applique pas** : son fan-out est **borné à la page** (≤ 100), alors qu'ici la file **n'est pas
   paginée** — le N+1 croîtrait sans plafond. Et `getOrganization` renvoie le **détail complet, membres
   compris**, pour en extraire **un seul champ**. L'index est le miroir exact de `buildKycStatusIndex`
   dans l'autre sens.
   > ⚖️ **Point de croisement** (documenté dans le code) : l'index est en `O(toutes les orgs)` et
   > **séquentiel** ; le N+1 en `O(taille de la file)` et **parallèle**. L'index gagne tant que
   > `orgs / 100 < taille de la file` — vrai aujourd'hui (**91 orgs = 1 appel** pour 9 à 31 dossiers),
   > faux à 2 000 orgs pour 5 dossiers. C'est le **même seuil** que la dette de pagination : les deux
   > tombent ensemble, et la réponse est **amont** (file paginée + lookup de noms en lot).
3. **Nom de la route** → **`GET /api/v1/admin/kyc-reviews`**, route **distincte** (préférence retenue),
   parce que la **source de pagination diffère** (kyc vs auth). Non-collision avec `admin/orgs/:orgId`
   **prouvée par un test de routage**, pas supposée.

---

## Critères d'acceptation

1. `GET …?status=UNDER_REVIEW` renvoie **exactement** les dossiers en attente de revue (aucun dossier
   d'un autre statut), quel que soit le volume — **sans** filtrage côté client.
2. Sans `status`, la file complète est renvoyée (miroir du contrat amont).
3. Un `status` hors enum → **400** (validation au bord, miroir de `AdminKycQueryDto`).
4. Chaque item porte la **raison sociale** de l'org en plus de l'`orgId`.
5. **Dégradation** : `auth` down → la file est servie sans les noms, `sources` le signale ; **jamais** un 5xx
   pour un enrichissement manquant. `kyc-service` down → **503** (source primaire de cette vue).
6. **Permissions** : un porteur de `org:read` accède ; sans la permission → **403** ; sans token → **401**.
7. Aucune donnée persistée, aucune décision KYC prise par le BFF (invariant DO-1/AD-2).
8. **VÉRIF DOCKER** : org en `UNDER_REVIEW` → présente dans la file ; après `approve` (STORY-048) → **elle
   en sort** et apparaît sous `?status=APPROVED`.

---

## Impact frontend

Débloque **AP-03** (frontend sprint 4) pour de bon. Sans cette story, AP-03 reste livrable — le **détail**
d'un dossier est déjà entièrement servi par `GET /admin/orgs/:orgId` (pièces + URLs présignées + OCR
`extraction`/`ocrSummary`) — mais **la file serait fausse dès que le volume dépasse une page**, ce qui est
précisément le moment où un agent KYC en a besoin.

### Contrat livré au frontend

```http
GET /api/v1/admin/kyc-reviews?status=UNDER_REVIEW      # Bearer requis, permission org:read
200 → { items: [ { orgId, name?, status, submittedAt?, reviewedAt?, updatedAt } ],
        total,                    # = items.length (file NON paginée, miroir de l'amont)
        sources: { identity } }   # ok | absent | forbidden | unavailable
400 → statut hors énumération KYC · 401 → sans jeton · 403 → sans org:read
503 → kyc-service indisponible (source PRIMAIRE)
```

⚠️ `name` est **optionnel** : absent si `auth` est dégradé (`sources.identity ≠ ok`) **ou** si l'org n'est
plus connue d'`auth`. Le front doit retomber sur l'`orgId` — jamais supposer le nom présent.

---

## Progress Tracking

**Statut : `done` — 2026-07-17.** Livrée dans `admin-panel`, PR **#6** (`MNV-107` → `dev`), intégrée en
**Rebase and merge**, branche supprimée. Commits `6572f3e` (feat) + `0521258` (correctifs de revue).

### Ce qui a été livré

- `GET /api/v1/admin/kyc-reviews?status=` — `AdminKycReviewsController`, gouverné par
  `@RequirePermissions(ORG_READ)` + **plancher deny-by-default** au niveau classe (patron STORY-106).
- `OrgAggregationService.listKycReviews` — file **pilotée par `kyc`**, enrichie via `buildOrgNameIndex`.
- `KycServiceClient.getReviewQueue(bearer, status?)` — le paramètre `status` que le BFF **n'envoyait pas**
  (`buildKycStatusIndex` continue de l'appeler sans filtre : comportement **inchangé**).
- `ListKycReviewsQuery` (contrat dupliqué K4), `ListKycReviewsQueryDto`, `KycReviewListItemDto`,
  `KycReviewQueueDto`, `KycReviewSourcesDto`.

### La décision structurante : les rôles des sources sont INVERSÉS

|  | `GET /admin/orgs` (STORY-047) | `GET /admin/kyc-reviews` (cette story) |
|---|---|---|
| **pilote la liste** | `auth` — dure (panne → 503) | **`kyc`** — dure (panne → 503) |
| **enrichissement** | `kyc` — dégradable | **`auth`** — dégradable (→ file sans les noms) |

D'où un `KycReviewSourcesDto` **distinct** : `AggregateSourcesDto` porte `kyc` en *secondaire*, l'exact
contraire d'ici. C'est ce qui justifie une **route à part** plutôt qu'un paramètre de `/admin/orgs`.

**Invariant d'ordre retenu** : la file est **toujours exacte** ; seul l'enrichissement *cosmétique* peut
manquer. Jamais l'inverse — **un nom absent se voit, une file fausse ne se voit pas.** Le filtrage est
délégué à l'amont **par construction**, verrouillé par un test de garde dédié (« le BFF ne filtre JAMAIS
lui-même »).

**Pas de branche `404`** sur les routes de **collection** (`/admin/kyc`, `/admin/organizations`) : un 404 y
signifie *route cassée / URL mal configurée*, jamais « rien à afficher » (file vide = `200 []`). Même
raisonnement que `buildKycStatusIndex` (STORY-106), appliqué ici au **code de réponse**.

### ✅ VÉRIFICATION DOCKER (stack réelle — 31 dossiers KYC, 91 orgs)

> Les e2e **mockent la couche données** : ils ne prouvent ni la persistance ni la transition. Tout ce qui
> suit est mesuré sur `docker compose` avec un **vrai jeton** `PLATFORM_ADMIN` (login réel, 8 `perms`) et
> des requêtes `mongosh` **directes** contre `kyc_service`.

| Critère | Attendu | Constaté | |
|---|---|---|---|
| AC-1 · `?status=UNDER_REVIEW` exact | que les `UNDER_REVIEW` | **égalité ENSEMBLISTE** avec `kyc_service` (9/9 orgIds, aucun manquant, aucun intrus) | ✅ |
| AC-2 · sans `status` | file complète | **31** dossiers ; par statut **3/4/14/10** — conforme à Mongo | ✅ |
| AC-3 · statut hors enum | 400 | `?status=BANANE` → **400**, amont **non appelé** | ✅ |
| AC-4 · raison sociale jointe | chaque item | **9/9** puis **31/31** items nommés | ✅ |
| AC-5 · `auth` down | file sans noms, jamais 5xx | `docker compose stop auth-service` → **200**, file **complète et exacte** (9), **0** nom, `sources.identity: "unavailable"` | ✅ |
| AC-5 · `kyc` down | 503 | `stop kyc-service` → **503** « Service KYC (kyc-service) indisponible. » | ✅ |
| AC-6 · permissions | 401 / 403 | sans jeton → **401** (docker). **403** prouvé en e2e (chaîne de guards réelle + jeton RS256 réel) — non rejouable en docker sans provisionner un opérateur dédié | ✅ |
| AC-7 · aucune persistance BFF | — | `admin-panel` **n'a pas de base** ; route en lecture seule (`GET`) | ✅ |
| **AC-8 · transition** | sort de la file | `approve` (STORY-048) sur `Cabinet S021c` → **sort** de `UNDER_REVIEW` (10 → **9**) et **entre** dans `APPROVED` (14 → **15**) ; en base : `status: APPROVED` + `reviewedBy` = `sub` de l'admin | ✅ |

Vérification **rejouée après les correctifs de revue** (la condition d'arrêt de la pagination a changé) :
égalité ensembliste toujours exacte (9/9), file complète 31 dossiers, 31/31 noms joints.

> 🔎 Au passage : `kyc_service.tenantkycprofiles` stocke la clé sous **`tenantId` (ObjectId)**, pas
> `orgId` (mappé en `orgId` dans le DTO). À savoir pour toute future requête `mongosh` sur cette
> collection.

### Revue de code (`/code-review xhigh`) — 7 constats, 4 corrigés

**Corrigés** (commit `0521258`) :
1. **Arrêt de pagination non fiable** — `byOrgId.size >= total` comparait un ensemble **dédupliqué** à un
   compteur amont : un id vu deux fois (pagination sans tri stable, org créée entre deux pages) empêchait
   la convergence → 20 appels au lieu de 2, **à chaque requête**. Critère fiable ajouté : **une page plus
   courte que la limite est nécessairement la dernière**.
2. **Plafond de boucle non testé** — istanbul ne compte pas la condition d'un `for` comme branche : le
   100 % de couverture ne le couvrait pas. Test ajouté (pagination qui ne converge jamais → exactement 20
   appels).
3. **Type structurel inline** → `ListKycReviewsQuery` dans `kyc.contract.ts` (K4), pendant de
   `ListOrganizationsQuery`.
4. **Point de croisement index vs N+1** documenté dans le code (cf. question 2 ci-dessus).

**Assumés, non corrigés** :
- **Index en tâche de fond sur panne `kyc`** : le 503 part sans attendre l'index. Le parallélisme est
  **délibéré** (il économise un aller-retour en série dans le cas **passant**, qui est le cas dominant) ;
  sérialiser doublerait la latence du chemin nominal pour optimiser le chemin d'échec. Au volume actuel
  l'orphelin est **un** appel. `buildOrgNameIndex` **ne rejette jamais** → aucun rejet non capturé.
- **`total` = `items.length`** : redondant mais délibéré — miroir de l'enveloppe de la vue liste,
  documenté comme tel.
- **5ᵉ duplication de `requireBearer`** : conforme aux 4 autres contrôleurs ; factoriser serait un
  refactor **hors périmètre**.

### Definition of Done

Lint **0 warning** · build OK · **222 unit** (100 % lignes/branches/fonctions sur `org-aggregation.service.ts`
et `admin-kyc-reviews.controller.ts`) · **89 e2e** verts · non-régression (`buildKycStatusIndex` inchangé) ·
route documentée dans **Swagger** (`/api/docs`) · **vérification docker consignée ci-dessus**.

### Dette laissée (assumée, tracée — ne pas la redécouvrir)

- **File non paginée** (miroir de l'amont) **et** index des noms en `O(toutes les orgs)` : **même seuil**,
  ils tomberont ensemble. La réponse est **amont** — paginer la file côté `kyc-service` + exposer un
  **lookup de noms en lot** côté `auth`. Story dédiée le jour où le volume l'exige (repère chiffré :
  `orgs / 100 < taille de la file` ; aujourd'hui 91 orgs ⇒ 1 appel).
- **`auth` ne borne pas `limit`** sur `GET /admin/organizations` (pas de `@Max`, contrairement à
  `ListPlatformUsersQueryDto`) : `?limit=1000000` y chargerait toute la collection. **Hors périmètre**
  (défaut d'`auth-service`, pas du BFF) ; le BFF garde **sa** borne (`@Max(100)`) et n'a jamais compté sur
  celle de l'amont. À corriger dans `auth-service`.
