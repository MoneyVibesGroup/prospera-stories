# STORY-048 : `admin-panel` — actions proxifiées (écriture) : revue KYC approve/reject (→ `kyc`) + grant/revoke entitlement (→ `catalog`), relais du JWT admin

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. architecture :** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-3 (Actions proxifiées) ; `architecture-prospera-ecosystem-2026-07-04.md` § P8 (source de vérité chez les propriétaires) / FR-003/FR-004 (revue KYC) / C8 (M2M différé) ; `sprint-plan-phase1-2026-07-10.md` § Module 0 / EPIC-016 (AD-2, jalon chaîne KYC 🏁) ; `frontend-sprint-plan-admin-panel-2026-07-12.md` § AP-03 (revue KYC) / AP-04 (entitlements) — consommateurs front
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-16
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-15
**Sprint :** 10 (2026-11-05 → 2026-11-19)
**Service :** `admin-panel` (:3010, **aucune base de données**)
**Couvre :** FR-003/FR-004 (revue KYC, volet action) + octroi/révocation d'entitlement, **proxifiés** par le BFF — débloque le jalon **chaîne KYC complète 🏁** (STORY-049) et les fronts AP-03/AP-04

> **La face « écriture » du BFF.** STORY-046 a posé l'os (relying party JWKS, garde `PLATFORM_ADMIN`, `UpstreamModule`, `JwtRelayService`), STORY-047 a livré la **composition en lecture** (vue agrégée, dégradation partielle). STORY-048 ajoute les **actions** — mais **le BFF ne décide toujours rien** : il **proxifie**. Approuver/rejeter un KYC part vers `kyc-service` (STORY-013), qui **seul** déclenche la transition d'état et émet `kyc.status.changed` ; octroyer/révoquer un entitlement part vers `platform-catalog-service` (STORY-033), qui **seul** valide contre le catalogue et persiste l'état absolu. `admin-panel` **relaie le bearer de l'admin** et **traverse fidèlement** l'issue de l'amont. La règle d'or bascule : là où la **lecture** dégrade en silence (une source down ⇒ section omise), l'**écriture** **ne dégrade jamais** — une action qui échoue doit **remonter** son échec exact (on n'« avale » jamais une approbation KYC ou un octroi). Cette story **ferme la boucle AD-2** et débloque l'e2e chaîne KYC complète (STORY-049) 🏁.

---

## User Story

En tant qu'**administrateur plateforme Money Vibes (`PLATFORM_ADMIN`)**,
je veux **approuver ou rejeter (avec motif) un dossier KYC** et **octroyer, mettre à jour ou révoquer un entitlement** d'une organisation **depuis le point d'entrée unique `admin-panel`**,
afin de **piloter la validation KYC et l'activation des modules** sans appeler chaque service à la main, avec la **certitude que l'issue affichée est la vraie issue** (approbation appliquée / rejet motivé / octroi validé contre le catalogue) — les décisions restant tracées et diffusées par leurs services propriétaires.

---

## Description

### Contexte

Le BFF `admin-panel` (AD-2, Module 0) résout la partie **action** de **FR-012** : donner au `PLATFORM_ADMIN` les **opérations d'administration** (revue KYC, entitlements) depuis une console unique, **sans créer de nouvelle source de vérité ni de logique métier**. Les décisions et leur persistance restent chez les propriétaires : le **statut KYC** et ses transitions à `kyc-service` (STORY-013), les **entitlements** et leur validation de cohérence à `platform-catalog-service` (STORY-033). `admin-panel` **proxifie** : il expose des routes admin cohérentes (sous la ressource `org`), **réémet le jeton de l'admin** à l'amont propriétaire, et **traverse fidèlement** la réponse (succès **ou** erreur).

Quatre actions, **toutes en écriture proxifiée** :

1. **`POST /admin/orgs/:orgId/kyc/approve`** → `kyc POST /admin/kyc/:orgId/approve` — transition `UNDER_REVIEW → APPROVED` (côté `kyc`).
2. **`POST /admin/orgs/:orgId/kyc/reject`** `{ reason }` → `kyc POST /admin/kyc/:orgId/reject { reason }` — transition `UNDER_REVIEW → REJECTED` (motivée).
3. **`PUT /admin/orgs/:orgId/entitlements/:moduleCode`** `{ versionCode, referentiel?, config?, status? }` → `catalog PUT /catalog/entitlements/:orgId/:moduleCode` — octroi / mise à jour (upsert idempotent, validé contre le catalogue).
4. **`DELETE /admin/orgs/:orgId/entitlements/:moduleCode`** → `catalog DELETE /catalog/entitlements/:orgId/:moduleCode` — révocation **soft** (`status → REVOKED`).

La proxification applique **trois principes d'architecture BFF**, dont **deux repris** de STORY-047 et **un inversé** :

- **Relais du bearer de l'admin (repris)** : `admin-panel` n'a pas d'identité machine (M2M/C8 différé). Il **réémet le jeton entrant** à l'amont ; celui-ci **réapplique `PLATFORM_ADMIN`** sur son endpoint d'écriture **et dérive l'identité de l'acteur** (`reviewedBy` côté `kyc`, `grantedBy` côté `catalog`) du **`sub` du jeton relayé** — le BFF ne fabrique ni ne transmet jamais l'identité du reviewer. Le bearer **n'est jamais journalisé** (`JwtRelayService`, redaction pino — STORY-046).
- **`@Roles(PLATFORM_ADMIN)` + défense en profondeur (repris)** : garde locale sur le contrôleur d'actions, **redoublée** par l'amont propriétaire.
- **Pas de dégradation à l'écriture (inversé — le cœur de la story)** : contrairement à la lecture (STORY-047, une source down ⇒ section omise, agrégat servi), une **action** qui échoue **ne dégrade jamais** : le BFF **remonte l'issue exacte** de l'amont (`404`/`409`/`400`/`422`/`503`). On ne renvoie **jamais** `200` sur une action non appliquée (ce serait affirmer au front qu'un KYC est approuvé alors qu'il ne l'est pas). L'écriture est **idempotente là où l'amont l'est** (voir §Idempotence) mais **jamais silencieusement absorbée**.

Cette story **n'introduit aucune persistance, aucun read-model, aucun Kafka, aucune règle métier de transition** côté BFF : le graphe d'états KYC, la validation de cohérence entitlement/catalogue et l'émission des événements (`kyc.status.changed`, `entitlement.changed`) restent **intégralement** chez les propriétaires.

### Périmètre

**Inclus :**

- **`POST /api/v1/admin/orgs/:orgId/kyc/approve`** (`@Roles(PLATFORM_ADMIN)`) — proxy vers `kyc POST /admin/kyc/:orgId/approve`. Relaie le bearer ; **traverse** l'issue : `200` (transition appliquée), `404` (org inconnue / `orgId` mal formé — anti-énumération), `409` (org **non** `UNDER_REVIEW`). Corps de réponse : issue normalisée `{ orgId, status }` (dérivée de la réponse amont, DO-1 : le BFF n'invente pas de statut).
- **`POST /api/v1/admin/orgs/:orgId/kyc/reject`** (`@Roles(PLATFORM_ADMIN)`) `{ reason }` — proxy vers `kyc POST /admin/kyc/:orgId/reject { reason }`. `RejectKycDto` (`reason` `@IsNotEmpty` + `@MaxLength`) **valide au bord** (défense en profondeur : `reason` vide/absent → **400** *avant* même l'appel amont) ; l'amont revalide et applique la transition. Issues : `200` / `400` (reason vide) / `404` / `409`.
- **`PUT /api/v1/admin/orgs/:orgId/entitlements/:moduleCode`** (`@Roles(PLATFORM_ADMIN)`) `{ versionCode, referentiel?, config?, status? }` — proxy vers `catalog PUT /catalog/entitlements/:orgId/:moduleCode`. `GrantEntitlementDto` **miroir** de `UpsertEntitlementDto` amont (`versionCode` semver, `referentiel?` `{ code, version }`, `config?` objet, `status?` ∈ `ACTIVE|SUSPENDED` — **`REVOKED` réservé au DELETE**), `whitelist`+`forbidNonWhitelisted`. Issues **traversées telles quelles** : `201` (création) / `200` (mise à jour idempotente) / `400` (DTO invalide) / `404` (org inconnue) / `422` (**cohérence catalogue** : version/référentiel inexistant ou `RETIRED`).
- **`DELETE /api/v1/admin/orgs/:orgId/entitlements/:moduleCode`** (`@Roles(PLATFORM_ADMIN)`) — proxy vers `catalog DELETE /catalog/entitlements/:orgId/:moduleCode`. Révocation **soft** (`status → REVOKED`). Issues : `200` / `404` (aucun entitlement `(org, module)`).
- **Helpers d'écriture ajoutés à `UpstreamClient`** (STORY-046 n'avait que `get()`) : `post<T>(path, body, bearer)`, `put<T>(path, body, bearer)`, `delete<T>(path, bearer)` — même socle que `get()` (jointure URL, relais bearer via `JwtRelayService`, **timeout court**), mais **jamais de `body` journalisé au-delà du strict nécessaire** (pas de PII ; `reason` non journalisé en clair).
- **Traduction fidèle des erreurs amont** (`upstream-error.ts`, complété) : une fonction `rethrowUpstreamError(error)` qui, sur échec axios porteur de réponse, **relève l'`HttpException` Nest équivalente** en **préservant le code amont** — `400 → BadRequestException`, `404 → NotFoundException` (anti-énumération conservée), `409 → ConflictException`, `422 → UnprocessableEntityException`, tout `5xx`/timeout/réseau → `ServiceUnavailableException` (503) / `BadGatewayException` (502). Message **générique et sûr** (jamais l'URL amont, l'état interne ni le body amont). **Aucune** action n'est jamais convertie en `200`. Symétrique inverse de `classifyUpstreamError` (STORY-047, réservé à la **lecture** dégradable).
- **Méthodes d'écriture typées ajoutées aux clients `upstream/`** :
  - `KycServiceClient.approveKyc(orgId, bearer)` → `POST /admin/kyc/:orgId/approve` ;
  - `KycServiceClient.rejectKyc(orgId, reason, bearer)` → `POST /admin/kyc/:orgId/reject { reason }` ;
  - `CatalogServiceClient.grantEntitlement(orgId, moduleCode, body, bearer)` → `PUT /catalog/entitlements/:orgId/:moduleCode` ;
  - `CatalogServiceClient.revokeEntitlement(orgId, moduleCode, bearer)` → `DELETE /catalog/entitlements/:orgId/:moduleCode`.
  - Chaque méthode s'appuie sur les nouveaux helpers `post/put/delete` et **type localement** la réponse amont (contrats **dupliqués** — K4 ; ré-emploi de `Entitlement` de STORY-047, ajout d'un `KycDecisionResult` minimal).
- **`OrgActionsService`** (nouveau) — orchestration des 4 proxys : relais bearer, appel du client amont, **traduction fidèle** de l'issue (via `rethrowUpstreamError`), normalisation minimale de la réponse. **Aucune décision, aucune transition, aucune validation métier** (celles-ci vivent chez l'amont).
- **`AdminOrgActionsController`** (nouveau, `admin/orgs/`) sous `@Roles(PLATFORM_ADMIN)` : monte les 4 routes (sous la ressource `:orgId`, cohérent avec le détail STORY-047), documentées Swagger (tag `admin`, réponses `200/201/400/401/403/404/409/422/502/503`).
- **DTOs d'entrée** : `RejectKycDto { reason }`, `GrantEntitlementDto { versionCode, referentiel?, config?, status? }` (miroirs de contrat, `ValidationPipe` stricte) ; **DTO de sortie** léger `KycDecisionResultDto { orgId, status }`. Paramètres de route validés (`orgId` ObjectId hex, `moduleCode` kebab).
- **Tests** : unitaires de `OrgActionsService` + `rethrowUpstreamError` couvrant **toute la matrice d'issues** (approve OK / non-`UNDER_REVIEW` `409` / org inconnue `404` ; reject OK / reason vide `400` / `409` ; grant `201`/`200` / `422` cohérence / `404` ; revoke `200`/`404` ; **amont down → `503`, jamais `200`**) + méthodes clients (post/put/delete relaient le bearer). **e2e** : amont **mockés** (fixture RS256/JWKS + serveur factice, comme STORY-047) — chaque action heureuse + chaque négatif ; **non-admin → `403`, sans token → `401`** ; **une action jamais transformée en succès sur échec amont**. Seuils Jest **65/90/90/90**, ESLint **0 warning**.

**Hors périmètre :**

- **Logique métier de transition KYC** (graphe d'états, `reviewedBy`, outbox `kyc.status.changed`) → **STORY-013** (`kyc-service`). Le BFF ne fait que déclencher.
- **Validation de cohérence entitlement / catalogue**, upsert idempotent, `entitlement.changed` → **STORY-033/034** (`platform-catalog-service`). Le BFF ne valide pas contre le catalogue (il **relaie** le `422`).
- **Vue agrégée / lecture** (liste, détail, dégradation partielle) → **STORY-047** (inchangée ; cette story ne modifie pas les routes `GET`).
- **e2e chaîne KYC complète** (inscription → upload → OCR `document.extrait` → revue admin → **approbation**) sur docker réel → **STORY-049** (jalon 🏁, consomme l'action `approve` livrée ici).
- **Base de données / read-model / cache / Kafka** côté BFF — **jamais** en v1.
- **Auth M2M service-à-service (C8)** — différée ; le BFF relaie le bearer de l'admin (l'amont dérive `reviewedBy`/`grantedBy` du `sub`).
- **Séquence « activer un vertical »** (grant multi-modules + pré-requis KYC) — **AP-05** (front) / orchestration ultérieure ; ici, grant **unitaire** `(org × module)`.
- **Journal d'audit propre au BFF** — la trace d'autorité est amont (outbox `kyc.status.changed` avec `reviewedBy` ; `grantedBy`/`source=admin` côté catalog). Le BFF **log l'intention** (org, action, `sub` de l'admin — **jamais** le bearer) sans créer de store.
- **Front (UI)** — app `prospera-admin-panel`, stories **AP-03** (revue KYC) / **AP-04** (entitlements), consommatrices de ces endpoints.

### Flux utilisateur

**Approbation KYC — `POST /admin/orgs/:orgId/kyc/approve`**
1. Le `PLATFORM_ADMIN` (bearer RS256, `aud` incl. `admin-panel`) appelle l'endpoint. `JwtAuthGuard` + `RolesGuard` passent.
2. `admin-panel` relaie le bearer à `kyc POST /admin/kyc/:orgId/approve` (timeout court).
3. `kyc` applique `UNDER_REVIEW → APPROVED` (transactionnel : transition + outbox `kyc.status.changed { APPROVED, reviewedBy=<sub relayé> }`) → **200**. Le BFF renvoie **200** `{ orgId, status: APPROVED }`.
4. Cas d'erreur **traversés** : org inconnue → **404** (anti-énumération) ; org **déjà** décidée / non `UNDER_REVIEW` → **409** (aucun événement émis) ; `kyc` en panne → **503** (l'action **n'est pas** appliquée, et le BFF le dit).

**Rejet motivé — `POST /admin/orgs/:orgId/kyc/reject { reason }`**
1. Garde `PLATFORM_ADMIN`. `RejectKycDto` valide `reason` (non vide) → sinon **400** au bord.
2. Relais vers `kyc POST /admin/kyc/:orgId/reject { reason }` → `UNDER_REVIEW → REJECTED` + outbox `{ REJECTED, rejectionReason, reviewedBy }` → **200** `{ orgId, status: REJECTED }`.
3. `expert-comptable` (STORY-021) consomme l'événement → e-mail de rejet (déjà prêt). Le BFF **ne touche à rien** de tout cela.

**Octroi / mise à jour — `PUT /admin/orgs/:orgId/entitlements/:moduleCode { versionCode, referentiel?, config?, status? }`**
1. Garde `PLATFORM_ADMIN`. `GrantEntitlementDto` valide au bord (semver, `status` ∈ `ACTIVE|SUSPENDED`).
2. Relais vers `catalog PUT /catalog/entitlements/:orgId/:moduleCode` → upsert idempotent `$set` absolu, validé contre le catalogue, `grantedBy=<sub>`, `source=admin`.
3. **201** (création) ou **200** (mise à jour) **traversés** ; version/référentiel inexistant ou `RETIRED` → **422** ; org inconnue → **404**.

**Révocation — `DELETE /admin/orgs/:orgId/entitlements/:moduleCode`**
1. Garde `PLATFORM_ADMIN`. Relais vers `catalog DELETE /catalog/entitlements/:orgId/:moduleCode` → `status → REVOKED` **soft** → **200**.
2. Aucun entitlement `(org, module)` → **404**. (À terme, `entitlement.changed { REVOKED }` — STORY-034 — « éteint » le module côté app cliente ; hors BFF.)

---

## Acceptance Criteria

- [ ] **Approbation KYC** : `POST /api/v1/admin/orgs/:orgId/kyc/approve` (`@Roles(PLATFORM_ADMIN)`) proxifie `kyc POST /admin/kyc/:orgId/approve` en **relayant le bearer** ; **200** `{ orgId, status: APPROVED }` quand l'amont applique la transition. Le BFF **ne fabrique jamais** ce statut — il le dérive de la réponse amont.
- [ ] **Rejet motivé** : `POST /api/v1/admin/orgs/:orgId/kyc/reject { reason }` valide `reason` **au bord** (`@IsNotEmpty` + `@MaxLength`) → `reason` vide/absent → **400** ; sinon proxifie `kyc POST /admin/kyc/:orgId/reject { reason }` → **200** `{ orgId, status: REJECTED }`.
- [ ] **Octroi / mise à jour entitlement** : `PUT /api/v1/admin/orgs/:orgId/entitlements/:moduleCode { versionCode, referentiel?, config?, status? }` proxifie `catalog PUT /catalog/entitlements/:orgId/:moduleCode` ; `status` limité à `ACTIVE|SUSPENDED` au bord (**`REVOKED` interdit ici**) ; **201** (création) / **200** (mise à jour idempotente) traversés fidèlement.
- [ ] **Révocation entitlement** : `DELETE /api/v1/admin/orgs/:orgId/entitlements/:moduleCode` proxifie `catalog DELETE …` → **200** (`status → REVOKED` soft côté catalog) ; **404** si aucun entitlement `(org, module)`.
- [ ] **Traduction fidèle des erreurs amont (cœur)** : les codes amont sont **préservés** — `400→400`, `404→404`, `409→409`, `422→422`, `5xx`/timeout/réseau → **502/503**. **Aucune action n'est jamais convertie en `200` sur échec amont** (couvert par des tests explicites). Aucune dégradation « partielle » à l'écriture.
- [ ] **Anti-énumération & non-fuite** : un `404` amont est reflété **tel quel** (`orgId` inconnu / mal formé) ; les corps d'erreur **ne divulguent jamais** l'URL amont, son état interne ni son body brut — message générique + code.
- [ ] **Relais du bearer, jamais journalisé** : chaque appel d'écriture porte `Authorization: Bearer <token de l'admin>` (via `JwtRelayService`) ; le bearer **et** le `reason` **ne sont jamais journalisés en clair**. L'amont dérive `reviewedBy`/`grantedBy` du `sub` — le BFF **ne transmet pas** d'identité d'acteur.
- [ ] **RBAC / défense en profondeur** : les 4 routes sous `@Roles(PLATFORM_ADMIN)` → **401** sans token, **403** pour `TENANT_ADMIN`/`TENANT_USER` ; l'amont **réapplique** `PLATFORM_ADMIN`.
- [ ] **Idempotence traversée** : replay `PUT` à l'identique → **200** (aucun doublon, garanti par l'upsert catalog) ; double `approve`/`reject` concurrent → la seconde requête reçoit **409** (aucun second événement) — comportements **hérités de l'amont**, non recréés par le BFF.
- [ ] **Aucune persistance / read-model / Kafka / logique de transition** introduits côté BFF ; les routes `GET` de STORY-047 restent **inchangées** ; `/health` reste **public et sans fan-out** (anti-cascade).
- [ ] **Swagger** `/api/docs` documente les 4 routes (tag `admin`) avec réponses `200/201/400/401/403/404/409/422/502/503` et les schémas d'entrée/sortie.
- [ ] **Qualité** : `npm run lint` **0 warning** ; `nest build` vert ; `npm test` vert avec **couverture ≥ 65/90/90/90** ; `OrgActionsService`, `rethrowUpstreamError`, clients étendus (post/put/delete) et contrôleur couverts — dont la **matrice d'issues** (succès + tous les négatifs + amont down).
- [ ] **Vérification docker bout-en-bout** (voir DoD) consignée dans §Revue & validation.
- [ ] **Non-régression** : `kyc-service` et `platform-catalog-service` **inchangés** (aucune modification de leur code applicatif) ; les autres services intacts.

---

## Technical Notes

### Composants / arborescence (ajouts STORY-048)

```
admin-panel/src/
├── admin/
│   ├── admin.module.ts                    # MODIFIÉ : déclare AdminOrgActionsController + OrgActionsService
│   └── orgs/
│       ├── admin-orgs.controller.ts        # INCHANGÉ (GET liste/détail, STORY-047)
│       ├── org-aggregation.service.ts      # INCHANGÉ (lecture, STORY-047)
│       ├── admin-org-actions.controller.ts # NOUVEAU : POST kyc/approve|reject, PUT|DELETE entitlements/:moduleCode (@Roles PLATFORM_ADMIN)
│       ├── org-actions.service.ts          # NOUVEAU : orchestration des 4 proxys + traduction fidèle des issues
│       └── dto/
│           ├── reject-kyc.dto.ts           # NOUVEAU : { reason } (@IsNotEmpty, @MaxLength)
│           ├── grant-entitlement.dto.ts    # NOUVEAU : miroir UpsertEntitlementDto (versionCode semver, referentiel?, config?, status ACTIVE|SUSPENDED)
│           └── kyc-decision-result.dto.ts  # NOUVEAU : { orgId, status } (sortie normalisée)
└── upstream/                               # MODIFIÉ
    ├── upstream-client.ts                  # + helpers protected post()/put()/delete() (relais bearer + timeout court)
    ├── upstream-error.ts                   # + rethrowUpstreamError() : mappe l'erreur amont → HttpException Nest (code préservé, message sûr)
    ├── kyc-service.client.ts               # + approveKyc(orgId,bearer), rejectKyc(orgId,reason,bearer)
    ├── catalog-service.client.ts           # + grantEntitlement(orgId,moduleCode,body,bearer), revokeEntitlement(orgId,moduleCode,bearer)
    └── contracts/
        ├── kyc.contract.ts                 # + KycDecisionResult { orgId, status } (retypage local de la réponse approve/reject)
        └── entitlement.contract.ts         # RÉUTILISÉ (Entitlement, STORY-047) pour la réponse grant
```

### Endpoints amont consommés en écriture (tous sous `/api/v1`, bases fournies par STORY-046)

| Amont | Endpoint (proxifié) | Corps | Réponse | Issues traversées |
|-------|---------------------|-------|---------|-------------------|
| `kyc-service` | `POST /admin/kyc/:orgId/approve` | — | statut → `APPROVED` | `200` · `404` (org inconnue) · `409` (non `UNDER_REVIEW`) |
| `kyc-service` | `POST /admin/kyc/:orgId/reject` | `{ reason }` | statut → `REJECTED` | `200` · `400` (reason vide) · `404` · `409` |
| `platform-catalog-service` | `PUT /catalog/entitlements/:orgId/:moduleCode` | `{ versionCode, referentiel?, config?, status? }` | `Entitlement` (état absolu) | `201` (créé) · `200` (màj) · `400` · `404` · `422` (cohérence catalogue) |
| `platform-catalog-service` | `DELETE /catalog/entitlements/:orgId/:moduleCode` | — | `Entitlement` (`REVOKED`) | `200` · `404` (absent) |

> **Contrats dupliqués (K4)** : `admin-panel` retype localement uniquement ce qu'il lit ; pas d'import cross-service ni de package partagé (même règle que STORY-047 et que la duplication des contrats Kafka `kyc`/`document`). `reviewedBy`/`grantedBy` sont dérivés **côté amont** du `sub` du jeton relayé — le BFF ne les envoie pas.

### Écriture proxifiée : helpers + traduction fidèle des issues (le cœur)

- **Helpers d'écriture** sur `UpstreamClient` (symétriques de `get()`) :
  - `protected post<T>(path, body, bearer)`, `protected put<T>(path, body, bearer)`, `protected delete<T>(path, bearer)` — jointure URL, `headers: relay.buildAuthHeader(bearer)`, `timeout: timeoutMs`. `firstValueFrom(this.http.post/put/delete(...))`.
  - **Aucun body sensible journalisé** (le logger redige déjà `authorization` ; `reason` ne doit pas apparaître en clair).
- **`rethrowUpstreamError(error)`** (nouveau, `upstream-error.ts`) — appelé dans le `catch` de chaque proxy de `OrgActionsService` :
  - `upstreamHttpStatus(error)` (déjà présent, STORY-047) → si `400/404/409/422` : relever l'`HttpException` Nest **de même code** (`BadRequest`/`NotFound`/`Conflict`/`UnprocessableEntity`) avec un **message générique sûr** ;
  - sinon (`5xx`, timeout `ECONNABORTED`, réseau) : `ServiceUnavailableException` (503) [ou `BadGatewayException` 502 pour un 5xx amont porté] ;
  - **jamais** de conversion en `2xx` ; **jamais** l'URL/body amont dans le message.
  - **Contraste explicite avec STORY-047** : `classifyUpstreamError` (lecture) transforme l'échec en section `absent`/`unavailable` **servie en 200** ; `rethrowUpstreamError` (écriture) **propage** l'échec. Deux fonctions, deux régimes — documenter le pourquoi.
- **`OrgActionsService`** : 4 méthodes fines `approveKyc/rejectKyc/grantEntitlement/revokeEntitlement` = `try { return await client.xxx(...) } catch (e) { rethrowUpstreamError(e) }`, plus la normalisation `{ orgId, status }` pour les décisions KYC. Aucune branche métier.

### Sécurité (NFR)

- `@Roles(PLATFORM_ADMIN)` sur `AdminOrgActionsController` ; `JwtAuthGuard`/`RolesGuard` globaux (STORY-046). **Défense en profondeur** : l'amont réapplique `PLATFORM_ADMIN` sur ses endpoints d'écriture.
- **Relais de bearer** : `JwtRelayService` (STORY-046) ; **jamais** journalisé. **`reason`** (motif de rejet, potentiellement sensible) **jamais** journalisé en clair.
- **Identité de l'acteur** : `reviewedBy`/`grantedBy` **dérivés côté amont** du `sub` du jeton relayé — le BFF ne fabrique ni ne transmet d'identité, évitant toute usurpation depuis le BFF.
- **Anti-énumération** : `404` amont reflété tel quel ; aucun corps d'erreur ne révèle quelle source a répondu quoi, ni l'URL/état amont.
- **Écriture jamais avalée** : une action non appliquée **ne renvoie jamais `200`** — invariant de sûreté (afficher « KYC approuvé » à tort est pire qu'une erreur explicite).
- **Trace d'autorité amont** : l'audit fait foi côté propriétaire (outbox `kyc.status.changed { reviewedBy }` ; `grantedBy`/`source=admin` catalog). Le BFF log l'**intention** (org, action, `sub`), pas un store.
- **Résilience** : timeout court par appel ; `/health` reste **sans fan-out** (anti-cascade — inchangé).

### Points d'attention d'implémentation

- **Route sous la ressource org** : `POST /admin/orgs/:orgId/kyc/(approve|reject)` et `PUT|DELETE /admin/orgs/:orgId/entitlements/:moduleCode` — cohérent avec le détail `GET /admin/orgs/:orgId` (STORY-047) et avec le front (page détail org → actions). Un **contrôleur d'actions séparé** (`AdminOrgActionsController`) garde `AdminOrgsController` (lecture) intact.
- **Passthrough `201` vs `200`** du `PUT` entitlement : ne **pas** réécrire le code (le catalog distingue création/màj) — relayer le statut amont. Si le framework impose un code fixe côté BFF, mapper explicitement (préférer `HttpCode` dynamique ou renvoyer le statut amont).
- **Validation « miroir » au bord** (`GrantEntitlementDto`, `RejectKycDto`) = **défense en profondeur** (échouer vite, message clair), **pas** une source de vérité : l'amont **revalide** (le BFF ne connaît pas le catalogue → le `422` de cohérence vient **exclusivement** de `catalog`).
- **`status: 'REVOKED'` interdit** dans `GrantEntitlementDto` (réservé au `DELETE`) — aligné sur `UpsertEntitlementDto` amont (STORY-033).
- **Réutiliser** `upstreamHttpStatus`/`isAxiosError` de `upstream-error.ts` (STORY-047) pour `rethrowUpstreamError` — un seul module d'erreur amont, deux régimes (lecture dégradable / écriture propagée).
- **e2e** : réutiliser la fixture RS256/JWKS + serveur amont factice de STORY-047 ; ajouter les cas d'écriture (succès + `409`/`422`/`404`/`400` + amont down → `503`).

---

## Dependencies

**Stories prérequises :**
- **STORY-047** (admin-panel : composition lecture, clients amont + `JwtRelayService` + résolution des URLs) — **socle direct** ✅.
- **STORY-046** (scaffold BFF, `UpstreamClient.get()`, `UpstreamModule`) — base HTTP à étendre (post/put/delete) ✅.
- **STORY-013** (kyc : revue admin `POST /admin/kyc/:orgId/approve|reject`, transitions + outbox `kyc.status.changed`) — **cible KYC des proxys** ✅.
- **STORY-033** (catalog : entitlements `PUT`/`DELETE /catalog/entitlements/:orgId/:moduleCode`, upsert idempotent + validation cohérence + révocation soft) — **cible entitlement des proxys** ✅.

**Stories débloquées :**
- **STORY-049** — **e2e chaîne KYC complète** (docker) : inscription → upload → OCR (`document.extrait`) → revue `admin-panel` → **approbation** — **jalon Module 0 🏁** (consomme l'action `approve` livrée ici).
- **AP-03** (front) — Revue KYC : file, détail, documents présignés, **approve/reject + motif** (proxifiés).
- **AP-04** (front) — Catalogue & entitlements : **grant/update/revoke** proxifiés.

**Dépendances externes :**
- URLs/ports amont dans le compose racine (`kyc-service:3002`, `platform-catalog-service:3003` — confirmés STORY-047). Aucune nouvelle variable d'env attendue.
- Fixture RS256/JWKS + serveur amont factice (déjà en place pour les e2e STORY-047).

---

## Definition of Done

- [ ] ESLint : 0 warning, `npm run lint` vert
- [ ] Build : `nest build` vert
- [ ] Tests : `npm test` ≥ **65% branches / 90% functions / 90% lines / 90% statements** ; `OrgActionsService` (matrice d'issues : approve OK/409/404 ; reject OK/400/409/404 ; grant 201/200/422/404 ; revoke 200/404 ; **amont down → 503, jamais 200**), `rethrowUpstreamError` (mapping 400/404/409/422/5xx/timeout), clients étendus (post/put/delete relaient le bearer) et contrôleur couverts
- [ ] Coverage : `npm run test:cov` générée et rapportée
- [ ] **Vérification docker bout-en-bout** (`mongo` rs0 + `kafka` + `minio` + `mailhog` + `auth:3001` + `kyc:3002` + `catalog:3003` + `document:3006` + `admin:3010`), consignée en §Revue & validation :
  - login `PLATFORM_ADMIN` → JWT `aud` incl. `admin-panel` ;
  - org avec dossier KYC réel `UNDER_REVIEW` (via inscription→upload→OCR) → **`POST /admin/orgs/:orgId/kyc/approve`** → **200** `APPROVED` ; **re-`approve`** → **409** ; côté `kyc` : `kyc.status.changed { APPROVED, reviewedBy }` (outbox `SENT`) + e-mail `expert-comptable` (Mailhog) ;
  - autre org `UNDER_REVIEW` → **`.../kyc/reject { reason }`** → **200** `REJECTED` (e-mail de rejet) ; **`reason` vide** → **400** ;
  - **`PUT /admin/orgs/:orgId/entitlements/bilan { versionCode, referentiel }`** → **201** puis **200** (replay) ; version inexistante/`RETIRED` → **422** ; **`DELETE …/entitlements/bilan`** → **200** (`REVOKED`, visible en réconciliation) ; `DELETE` d'un module absent → **404** ;
  - **amont down** : `docker compose stop kyc-service` → `approve` → **503** (action **non** appliquée) ; `start` → retour **200** ;
  - **négatifs** : org inconnue → **404** ; non-admin (TENANT_ADMIN) → **403** ; sans token → **401**
- [ ] Swagger `/api/docs` : les 4 routes documentées (tag `admin`), schémas entrée/sortie + réponses `200/201/400/401/403/404/409/422/502/503`
- [ ] **Aucune** base / read-model / Kafka / logique de transition introduits ; routes `GET` (STORY-047) inchangées ; `/health` inchangé (public, sans fan-out)
- [ ] Non-régression : `kyc-service`/`catalog` **inchangés** (leur `/health` reste vert) ; matrice CI verte pour `admin-panel`
- [ ] `.env.example` inchangé (URLs amont déjà posées en STORY-046)
- [ ] `/code-review` réalisé ; constats correctness corrigés
- [ ] Statut mis à jour dans `sprint-status.yaml` (+ `completed_date` à la clôture)
- [ ] Flux git projet : branche `MNV-048`, commit `MNV-048(admin-panel): …`, PR « Rebase and merge » sur `dev`, branche supprimée après merge (repo `prospera-admin-panel-service` existe)

---

## Story Points Breakdown

- **Helpers d'écriture `UpstreamClient`** (post/put/delete) + **`rethrowUpstreamError`** (mapping fidèle 400/404/409/422/5xx, message sûr) : **1,5 pt** — *le cœur de valeur et de risque* (ne jamais avaler une action, ne jamais fuiter l'amont).
- **Méthodes d'écriture typées** (kyc approve/reject, catalog grant/revoke) + **DTOs** (RejectKyc, GrantEntitlement miroir, KycDecisionResult) + contrats : **1 pt**
- **`OrgActionsService` + `AdminOrgActionsController`** (4 routes proxy sous `:orgId`) + Swagger : **1 pt**
- **Tests** (matrice d'issues unit + e2e amont mockés, dont « jamais 200 sur échec ») + vérif docker bout-en-bout : **1,5 pt**
- **Total : 5 points**

**Rationale :** le socle HTTP, le relais de bearer et la résolution des amont existent déjà (STORY-046/047) ; l'effort porte sur la **sémantique d'écriture proxifiée** — l'exact miroir inversé de la dégradation en lecture. Le risque n'est pas la plomberie mais la **fidélité de l'issue** (préserver `409`/`422`/`404`, ne jamais convertir un échec en succès, ne rien fuiter) et la couverture exhaustive de la matrice. Cohérent avec l'estimation du sprint-plan (5 pts).

---

## Additional Notes

- **BFF sans vérité, même en écriture** : `admin-panel` ne persiste rien et ne décide rien — il **déclenche** chez le propriétaire et **traverse** l'issue. Le graphe d'états KYC, la validation catalogue et les événements restent intégralement amont (P8).
- **Symétrie inversée avec STORY-047** : mêmes clients, même relais de bearer, même module d'erreur amont — mais la **lecture dégrade** (`classifyUpstreamError` → `absent`/`unavailable`, servi 200) tandis que l'**écriture propage** (`rethrowUpstreamError` → HttpException, code préservé). C'est la distinction structurante de la story.
- **Ferme la boucle AD-2** : après cette story, `admin-panel` **lit** (047) **et agit** (048) → STORY-049 peut jouer l'e2e chaîne KYC complète 🏁 (inscription → upload → OCR → revue → **approbation**).
- **M2M différé (C8)** : tant que le BFF n'a pas d'identité machine, le relais du bearer de l'admin est **la** stratégie ; l'amont dérivant `reviewedBy`/`grantedBy` du `sub`, la trace d'acteur reste correcte sans usurpation possible depuis le BFF.
- **Repo GitHub** : `prospera-admin-panel-service` (existe depuis STORY-046) — push après validation (branche `MNV-048`).

---

## Revue & validation

**Implémenté le 2026-07-16 (BMAD dev-story).** Face **écriture** déposée sur le socle STORY-047 — même relais de bearer, même module d'erreur amont, **régime inversé** (la lecture dégrade, l'écriture propage) :

- **Helpers d'écriture** sur `UpstreamClient` : `post/put/delete` → `UpstreamWriteResult { status, data }` (le code d'écriture porte du sens — `201` création vs `200` mise à jour, traversé au contrôleur via `@Res({ passthrough:true })`). Symétriques de `get()` (relais bearer + timeout court).
- **`rethrowUpstreamError`** (`upstream-error.ts`) : traduction **fidèle** — `400/404/409/422` **préservés** (message générique sûr, aucune fuite de l'URL/état amont), `5xx`/timeout/réseau → `503`, une `HttpException` locale déjà levée n'est pas masquée. **Jamais** de `2xx` sur échec. Contraste explicite documenté avec `classifyUpstreamError` (lecture dégradable, STORY-047).
- **Clients amont** : `KycServiceClient.approveKyc/rejectKyc`, `CatalogServiceClient.grantEntitlement/revokeEntitlement` (contrats **dupliqués** K4 : `KycDecisionResult` = item de revue, `EntitlementUpsert`).
- **`OrgActionsService`** (4 proxys `try { … } catch { rethrowUpstreamError }`, aucune branche métier) + **`AdminOrgActionsController`** (`@Roles(PLATFORM_ADMIN)`, contrôleur d'actions **séparé** — `AdminOrgsController` lecture intact) ; **DTOs** `RejectKyc` + `GrantEntitlement` (**miroirs** amont validés au bord, défense en profondeur) + `KycDecisionResultDto`. `reviewedBy`/`grantedBy` dérivés du `sub` **côté amont** du jeton relayé — le BFF ne transmet aucune identité.
- **Invariant** : aucune base / read-model / Kafka / logique de transition côté BFF ; le graphe d'états KYC, la validation catalogue et les événements restent chez les propriétaires.

**Qualité :** `npm run lint` **0 warning** ; `nest build` **OK** ; **124 unit (20 suites)** + **28 e2e (3 suites**, amont mockés via fixture RS256/JWKS) verts ; **couverture 99.76 / 89.81 / 100 / 99.73** (seuils 65/90/90/90 ; `admin/orgs` et `upstream` à **100 %**, dont toute la matrice d'issues).

**`/code-review` (xhigh) :** 0 bug de correctness ; **2 constats LOW corrigés** — (1) le semver de `GrantEntitlementDto` était un **sur-ensemble** du pattern catalogue (acceptait `"2"` mono-part) → aligné **exactement** sur `SEMVER_PATTERN` (`≥ 2` parts, `"2"` désormais `400` au bord) ; (2) `req.body.reason` (motif de rejet) **ajouté** à la redaction pino (cohérence avec `password`/`token`, l'AC « reason jamais journalisé »).

**Vérification docker bout-en-bout** (`mongo` rs0 + `kafka` + `minio` + `mailhog` + `auth:3001` + `kyc:3002` + `catalog:3003` + `document:3006` + `admin:3010`) :
- Login `PLATFORM_ADMIN` (register → mongo `platformRole`+`emailVerifiedAt`+`ACTIVE`, suppression membership → login) → JWT RS256 dont l'**`aud` contient `admin-panel`**, `roles:[PLATFORM_ADMIN]`, `org:null`.
- **KYC** : `POST …/kyc/approve` sur une org `UNDER_REVIEW` → **200** `{status:APPROVED}` ; le statut est **persisté** (relu via `GET /admin/orgs/:orgId`) avec **`reviewedBy` = `sub` de l'admin relayé** et un `kyc.status.changed{APPROVED}` **SENT** à l'outbox `kyc-service` ; **re-approve → 409** ; **org inconnue → 404**. `POST …/kyc/reject {reason}` → **200** `{status:REJECTED}` (`rejectionReason` persisté, `reviewedBy`, outbox SENT) ; **motif vide → 400** ; **champ inconnu → 400** (whitelist stricte).
- **Entitlements** : `PUT …/entitlements/bilan {versionCode:"2.0", referentiel:{syscohada-revise,2.1}}` → **201** puis **replay → 200** ; **version inexistante → 422** (cohérence catalogue) ; **semver invalide → 400** et **mono-part `"2"` → 400** (au bord) ; **`status:REVOKED` → 400** (réservé au DELETE) ; `DELETE …/entitlements/bilan` → **200** (`REVOKED`) ; **module absent → 404**.
- **RBAC** : sans jeton → **401** ; `TENANT_ADMIN` (approve **et** grant) → **403**.
- **Dégradation (règle inversée)** : `docker compose stop kyc-service` → `approve` → **503** (l'action **n'est pas** appliquée, jamais `200`) ; `start kyc-service` → retour **200**.
- **Non-régression STORY-047** : `GET /admin/orgs?limit=100` → **200** (74 orgs, `sources:{kyc:ok,entitlements:ok}`) ; `/health` public sans fan-out inchangé.

**Repo** : `prospera-admin-panel-service`, branche `MNV-048` (depuis `dev`, rebasée `origin/dev`), **PR #3** MNV-048(admin-panel) « Rebase and merge » sur `dev` (HEAD `ea19a3b`), branche supprimée.

**Reste :** — (débloque **STORY-049** e2e chaîne KYC complète 🏁, fronts **AP-03**/**AP-04**).

---

## Progress Tracking

**Status History:**
- 2026-07-15 : Créée par vivian (Scrum Master, BMAD create-story)
- 2026-07-16 : Implémentée + vérifiée docker + `/code-review` (2 LOW corrigés) + intégrée dans `dev` (BMAD dev-story)

**Actual Effort:** 5 points (conforme à l'estimation)

---

**Status:** ✅ Done (vérifiée docker 2026-07-16)
**Created:** 2026-07-15
**Reference:** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-3 ; `architecture-prospera-ecosystem-2026-07-04.md` § P8/C8 ; `sprint-plan-phase1-2026-07-10.md` § EPIC-016 (AD-2) ; `frontend-sprint-plan-admin-panel-2026-07-12.md` § AP-03/AP-04

**Cette story a été créée avec BMAD Method v6 — Phase 4 (Implementation Planning).**
