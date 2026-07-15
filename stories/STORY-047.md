# STORY-047 : `admin-panel` — vue agrégée des organisations (identité `auth` + KYC `kyc` + entitlements `catalog`), liste + détail, dégradation partielle

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. architecture :** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-2 (Vue agrégée) ; `architecture-prospera-ecosystem-2026-07-04.md` § P8/FR-012 (dashboard admin agrégé sans nouvelle source de vérité) ; `sprint-plan-phase1-2026-07-10.md` § Module 0 (EPIC-016) ; `frontend-sprint-plan-admin-panel-2026-07-12.md` § AP-02 (consommateur front)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-15
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-15
**Sprint :** 9 (2026-10-22 → 2026-11-05)
**Service :** `admin-panel` (:3010, **aucune base de données**)
**Couvre :** FR-012 (vue agrégée admin, volet lecture) — débloque les actions proxifiées (STORY-048) et le front AP-02

> **La première logique métier du BFF.** STORY-046 a posé l'os (relying party JWKS, garde `PLATFORM_ADMIN`, `UpstreamModule` avec 3 clients HTTP typés **sans méthode d'agrégation**). STORY-047 dépose la **composition à la volée** : deux endpoints en lecture — `GET /admin/orgs` (liste paginée) et `GET /admin/orgs/:orgId` (détail) — qui **fan-out** vers `auth` (identité), `kyc` (statut/dossier) et `catalog` (entitlements), **fusionnent** les réponses et appliquent la règle d'or du BFF : **dégradation partielle** (une source amont indisponible → sa section est marquée « indisponible », l'agrégat reste servi). **Aucune écriture, aucune action, aucune persistance** : le BFF ne possède rien, il compose et relaie le bearer de l'admin. Les actions (approve/reject KYC, grant/revoke entitlement) restent en STORY-048.

---

## User Story

En tant qu'**administrateur plateforme Money Vibes (`PLATFORM_ADMIN`)**,
je veux **lister et consulter le détail des organisations** avec, en un seul appel, leur **identité** (raison sociale, pays, statut), leur **statut KYC** (et le dossier : pièces présignées, résumé OCR) et leurs **entitlements** (modules actifs) — **agrégés depuis `auth`, `kyc` et `catalog`**,
afin de **piloter la plateforme depuis un point d'entrée unifié** sans naviguer service par service, et **même si l'une des sources est momentanément indisponible** (je vois ce qui est disponible, clairement signalé).

---

## Description

### Contexte

Le BFF `admin-panel` (AD-2, Module 0) résout **FR-012** : offrir au `PLATFORM_ADMIN` une **vue agrégée des organisations** sans créer de nouvelle source de vérité. L'identité reste à `auth-service`, le KYC à `kyc-service`, les entitlements à `platform-catalog-service`. STORY-046 a livré le socle (validation RS256/JWKS, `RolesGuard PLATFORM_ADMIN` global, `UpstreamModule` = `HttpModule` configuré + `JwtRelayService` + 3 clients typés `Auth`/`Kyc`/`Catalog` construits sur leurs URLs d'env, **mais sans aucune méthode métier**). STORY-047 y greffe la **couche de composition**.

Deux endpoints, **tous deux en lecture seule** :

1. **`GET /admin/orgs`** — liste **paginée** des organisations enrichie du **statut KYC** et d'un **compteur d'entitlements actifs** par org.
2. **`GET /admin/orgs/:orgId`** — **détail** d'une org : identité + membres (`auth`), dossier KYC complet (statut, pièces **présignées**, résumé OCR STORY-045) (`kyc`), et **entitlements** (`catalog`).

La composition applique deux principes d'architecture BFF :

- **Relais du bearer de l'admin** : `admin-panel` n'a pas d'identité machine (M2M/C8 différé). Il **réémet le jeton entrant** de l'admin à chaque amont ; ceux-ci **réappliquent `PLATFORM_ADMIN`** sur leurs endpoints. Le bearer **n'est jamais journalisé** (`JwtRelayService`, redaction pino — STORY-046).
- **Dégradation partielle (règle d'or)** : les appels amont sont **parallèles**, à **timeout court**, et **isolés** (`Promise.allSettled`). Un amont **non primaire** en échec (timeout / 5xx / réseau) ne fait **jamais** échouer l'agrégat : sa section est **omise et marquée `unavailable`**. On distingue explicitement **« absent »** (un `404` amont porteur de sens — ex. org sans dossier KYC → `kyc: null`, statut `absent`) de **« indisponible »** (panne de transport → section `unavailable`).

`auth-service` est la **seule dépendance dure** : sans lui, on ne peut ni **énumérer** les organisations (liste) ni **prouver l'existence** d'une org (détail). Une panne d'`auth` renvoie donc **502/503** ; une org inconnue renvoie **404** (anti-énumération, on reflète le `404` d'`auth`).

Cette story **retire le diagnostic provisoire `GET /admin/whoami`** (posé en STORY-046 comme sonde de câblage) au profit des vrais contrôleurs — comme la sonde `whoami` de `document-service` avait été remplacée par ses contrôleurs réels (STORY-044).

### Périmètre

**Inclus :**

- **`GET /api/v1/admin/orgs`** (`@Roles(PLATFORM_ADMIN)`) — **liste paginée** :
  - **Pagination & recherche** : query `page` / `limit` / `status` (identité `ACTIVE`|`SUSPENDED`) / `q` (raison sociale ou slug), **relayés tels quels** à `auth GET /admin/organizations` qui **pilote la page et le total** (source de vérité de l'énumération).
  - **Enrichissement KYC** : **un seul** appel `kyc GET /admin/kyc` (file complète, tous statuts — items **légers**, sans URL présignée) **indexé par `orgId`** → `kycStatus` par org (`absent` si l'org n'a pas encore de dossier).
  - **Enrichissement entitlements** : **compteur d'entitlements actifs** par org de la page via **fan-out parallèle borné** (`catalog GET /catalog/entitlements/:orgId?status=ACTIVE`, au plus `limit` appels — voir §Efficacité). Dégradable indépendamment.
  - **Réponse** `PaginatedAdminOrgsDto { items: AdminOrgListItemDto[], total, page, limit, sources }` où chaque item porte `{ orgId, name, slug, country, identityStatus, kycStatus?, activeEntitlementsCount? }` et `sources` résume l'état des amont d'enrichissement (`kyc`, `entitlements` : `ok` | `unavailable`).
- **`GET /api/v1/admin/orgs/:orgId`** (`@Roles(PLATFORM_ADMIN)`) — **détail agrégé** (3 appels **parallèles**) :
  - **Identité** (`auth GET /admin/organizations/:id`) — **primaire** : `OrganizationDetailDto` (identité + `members[]`). `404` → **404** de l'agrégat (anti-énumération) ; panne transport → **502/503**.
  - **KYC** (`kyc GET /admin/kyc/:orgId`) : `AdminKycDetailDto` (statut, `documents[]` **présignés**, `rejectionReason?`, `reviewedAt/By?`, `submittedAt?`, **`ocrSummary?`** STORY-045). `404` = **« pas de dossier »** → `kyc: null` (statut `absent`, **pas** une erreur) ; panne → section `unavailable`.
  - **Entitlements** (`catalog GET /catalog/entitlements/:orgId`) : `EntitlementResponseDto[]`. Panne → section `unavailable`.
  - **Réponse** `AdminOrgDetailDto { identity, kyc, entitlements, sources }` où `kyc`/`entitlements` sont `null` si absents et `sources.{kyc,entitlements}` ∈ `ok|absent|unavailable`.
- **Méthodes typées ajoutées aux clients `upstream/`** (STORY-046 les a laissés « vides ») :
  - `AuthServiceClient.listOrganizations(query, bearer)`, `.getOrganization(orgId, bearer)` ;
  - `KycServiceClient.getReviewQueue(bearer)`, `.getKycDetail(orgId, bearer)` ;
  - `CatalogServiceClient.listEntitlements(orgId, bearer, status?)`.
  - Chaque méthode s'appuie sur le helper `get()` de `UpstreamClient` (relais bearer + timeout court, STORY-046) et **type localement** la réponse amont (interfaces **dupliquées** côté BFF — K4, pas de package partagé).
- **`OrgAggregationService`** (nouveau) — orchestration : fan-out parallèle (`Promise.allSettled`), **mapping des échecs** (distinguer `404` amont ⇒ `absent` vs autre échec ⇒ `unavailable`), fusion en DTO d'agrégat, calcul du compteur d'entitlements actifs. **Aucune écriture, aucune décision KYC** (invariant DO-1 : le BFF ne déclenche aucune transition).
- **`AdminOrgsController`** (nouveau, `admin/orgs/`) sous `@Roles(PLATFORM_ADMIN)` : monte les 2 routes, documentées Swagger (tag `admin`, réponses `200/401/403/404/502`).
- **DTOs de sortie** : `AdminOrgListItemDto`, `PaginatedAdminOrgsDto`, `AdminOrgDetailDto` (+ sous-DTOs `identity`/`kyc`/`entitlements` et `AggregateSourcesDto`), `ListOrgsQueryDto` (page/limit/status/q, `ValidationPipe` stricte). Les shapes amont (org, kyc, entitlement) sont **typées localement** (contrats dupliqués, K4).
- **Retrait du diagnostic provisoire** `GET /admin/whoami` (`admin/diagnostics.controller.ts`, `whoami-response.dto.ts`) — remplacé par `AdminOrgsController`. Ajuster `admin.module.ts` (déclare `AdminOrgsController` + `OrgAggregationService`, importe `UpstreamModule`).
- **Tests** : unitaires de `OrgAggregationService` couvrant la **matrice de dégradation** (tout OK ; KYC down ; catalog down ; org sans dossier KYC → `absent` ; auth down → propage l'erreur ; org inconnue → 404) + méthodes clients (mapping `404`/timeout). **e2e** : amont **mockés** (`nock`/serveur factice) — liste OK + enrichie ; liste avec KYC/catalog down (agrégat servi, `sources` flaggé) ; détail complet (présignés + ocrSummary) ; détail org sans KYC (`kyc:null`) ; org inconnue → **404** ; non-admin → **403** ; sans token → **401**. Seuils Jest **65/90/90/90**, ESLint **0 warning**.

**Hors périmètre :**

- **Actions proxifiées** — approve/reject KYC (→ `kyc`), grant/revoke entitlement (→ `catalog`), relais du JWT admin **en écriture** → **STORY-048**. STORY-047 est **lecture seule**.
- **e2e chaîne KYC complète** (inscription → upload → OCR → revue admin → approbation) sur docker réel → **STORY-049**.
- **Base de données / read-model persistant / cache / Kafka** — **jamais** en v1 (composition à la volée à chaque requête ; pas de source de vérité côté BFF).
- **Endpoint catalog « bulk entitlements »** (multi-org en un appel) — non requis ici ; le compteur de la liste se fait par fan-out borné (voir §Efficacité). Optimisation future côté `catalog` si le volume l'exige.
- **Front (UI)** — app `prospera-admin-panel`, story **AP-02** (consommateur de ces endpoints).
- **Auth M2M service-à-service** (C8) — différé ; le BFF relaie le bearer de l'admin.
- **Pagination croisée / tri multi-source** — la pagination et le total viennent **exclusivement d'`auth`** ; on n'ordonne ni ne pagine par des champs KYC/catalog (ce serait une source de vérité implicite côté BFF).

### Flux utilisateur

**Liste — `GET /admin/orgs?page=1&limit=20&q=cabinet&status=ACTIVE`**
1. Le `PLATFORM_ADMIN` appelle l'endpoint (bearer RS256, `aud` incl. `admin-panel`). `JwtAuthGuard` + `RolesGuard` passent.
2. `admin-panel` relaie la query à `auth GET /admin/organizations` → page d'orgs + `total` (source de la pagination).
3. **En parallèle** : `kyc GET /admin/kyc` (file complète → index `orgId→status`) et, pour chaque org de la page, `catalog GET /catalog/entitlements/:orgId?status=ACTIVE` (compteur).
4. Fusion → chaque item = identité + `kycStatus?` + `activeEntitlementsCount?`. Si KYC ou catalog échoue, l'item garde ses champs disponibles et `sources` signale `unavailable`.
5. Réponse **200** paginée (echo `page`/`limit`/`total` d'`auth`).

**Détail — `GET /admin/orgs/:orgId`**
1. Garde `PLATFORM_ADMIN`. **3 appels parallèles** (auth détail, kyc détail, catalog entitlements), bearer relayé, timeout court.
2. `auth` **404** → **404** (org inconnue, anti-énumération). `auth` en panne → **502/503**.
3. `kyc` **404** → `kyc: null` (`absent`) ; `kyc`/`catalog` en panne → section `unavailable`.
4. Fusion → **200** `AdminOrgDetailDto { identity, kyc, entitlements, sources }` (le front affiche les pièces présignées, le résumé OCR, les entitlements, et grise les sections indisponibles).

---

## Acceptance Criteria

- [ ] **`GET /api/v1/admin/orgs`** (`@Roles(PLATFORM_ADMIN)`) renvoie **200** une liste **paginée** `{ items, total, page, limit, sources }`. `page`/`limit`/`status`/`q` sont **relayés tels quels** à `auth GET /admin/organizations`, qui **pilote `total`/`page`/`limit`** (aucune pagination recalculée côté BFF).
- [ ] Chaque item de liste porte `{ orgId, name, slug, country, identityStatus }` **+** `kycStatus?` (issu d'**un seul** `kyc GET /admin/kyc` indexé par `orgId`) **+** `activeEntitlementsCount?` (fan-out `catalog` borné à la page). Une org **sans dossier KYC** a `kycStatus` absent (**pas** d'erreur).
- [ ] **`GET /api/v1/admin/orgs/:orgId`** (`@Roles(PLATFORM_ADMIN)`) renvoie **200** `AdminOrgDetailDto { identity, kyc, entitlements, sources }` en composant **en parallèle** `auth` (identité+membres), `kyc` (statut, **documents présignés**, `ocrSummary` STORY-045) et `catalog` (entitlements).
- [ ] **Dégradation partielle vérifiée** : si `kyc` **ou** `catalog` est indisponible (timeout / 5xx / réseau), l'agrégat est **quand même** servi **200** avec la section absente et `sources.{kyc|entitlements} = "unavailable"`. Aucune panne d'un amont **non primaire** ne produit un 5xx global.
- [ ] **Distinction `absent` vs `unavailable`** : un **`404`** de `kyc` (org sans dossier) donne `kyc: null` + `sources.kyc = "absent"` ; un **échec de transport** donne `sources.kyc = "unavailable"`. Les deux cas sont couverts par des tests.
- [ ] **`auth` = dépendance dure** : une org **inconnue** (`404` d'`auth`) → **404** de l'agrégat (détail) et n'apparaît pas en liste ; une **panne d'`auth`** → **502/503** (l'énumération/identité n'a pas de repli).
- [ ] **Relais du bearer** : chaque appel amont porte l'`Authorization: Bearer <token de l'admin>` (via `JwtRelayService`) ; le bearer **n'est jamais journalisé**. Les amont réappliquent `PLATFORM_ADMIN` (défense en profondeur).
- [ ] **Lecture seule / DO-1** : aucun endpoint d'écriture, aucune action, **aucune transition KYC** déclenchée par `admin-panel` ; aucune base / read-model / Kafka introduits.
- [ ] **Fan-out parallèle & timeout** : les appels d'un même agrégat partent en parallèle (`Promise.allSettled`) avec le **timeout court** (`UPSTREAM_HTTP_TIMEOUT_MS`) ; la latence de l'agrégat est bornée par l'amont le plus lent, pas par leur somme.
- [ ] Le **diagnostic provisoire `GET /admin/whoami`** est **retiré** (contrôleur + DTO) et remplacé par `AdminOrgsController`.
- [ ] **Swagger** `/api/docs` documente les 2 routes (tag `admin`) avec réponses `200/401/403/404` (+ `502` pour panne `auth`) et les schémas d'agrégat.
- [ ] **Qualité** : `npm run lint` **0 warning** ; `nest build` vert ; `npm test` vert avec **couverture ≥ 65/90/90/90** ; nouveaux fichiers (`OrgAggregationService`, clients étendus, contrôleur, DTOs) couverts — dont la **matrice de dégradation**.
- [ ] **Vérification docker bout-en-bout** (voir DoD) consignée dans §Revue & validation.
- [ ] **Non-régression** : les autres services **inchangés** (aucune modification de leur code applicatif) ; `admin-panel /health` reste **public et sans fan-out amont** (anti-cascade — inchangé depuis STORY-046).

---

## Technical Notes

### Composants / arborescence (ajouts STORY-047)

```
admin-panel/src/
├── admin/
│   ├── admin.module.ts              # MODIFIÉ : déclare AdminOrgsController + OrgAggregationService, importe UpstreamModule ; retire whoami
│   ├── diagnostics.controller.ts    # SUPPRIMÉ (whoami provisoire)
│   ├── dto/whoami-response.dto.ts    # SUPPRIMÉ
│   └── orgs/                         # NOUVEAU
│       ├── admin-orgs.controller.ts # GET /admin/orgs, GET /admin/orgs/:orgId (@Roles PLATFORM_ADMIN)
│       ├── org-aggregation.service.ts # fan-out parallèle + merge + dégradation (allSettled)
│       └── dto/
│           ├── list-orgs-query.dto.ts        # page/limit/status/q (ValidationPipe stricte)
│           ├── admin-org-list-item.dto.ts     # item liste
│           ├── paginated-admin-orgs.dto.ts    # { items, total, page, limit, sources }
│           ├── admin-org-detail.dto.ts        # { identity, kyc, entitlements, sources }
│           └── aggregate-sources.dto.ts       # { kyc: 'ok'|'absent'|'unavailable', entitlements: ... }
└── upstream/                        # MODIFIÉ : méthodes typées ajoutées aux 3 clients (+ contrats amont locaux)
    ├── auth-service.client.ts       # + listOrganizations(query,bearer), getOrganization(id,bearer)
    ├── kyc-service.client.ts        # + getReviewQueue(bearer), getKycDetail(orgId,bearer)
    ├── catalog-service.client.ts    # + listEntitlements(orgId,bearer,status?)
    └── contracts/                   # NOUVEAU : interfaces dupliquées des réponses amont (K4)
        ├── auth-org.contract.ts     # OrganizationAdmin, PaginatedOrganizations, OrganizationDetail, Member
        ├── kyc.contract.ts          # KycReviewItem, KycDetail (+ document présigné, ocrSummary)
        └── entitlement.contract.ts  # Entitlement (organizationId, moduleCode, versionCode, status, …)
```

### Endpoints amont consommés (tous sous `/api/v1`, bases fournies par STORY-046)

| Amont | URL d'env | Endpoint | Réponse (contrat dupliqué) | Usage |
|-------|-----------|----------|----------------------------|-------|
| `auth-service` | `AUTH_SERVICE_URL` (`…:3001/api/v1`) | `GET /admin/organizations?page&limit&status&q` | `{ items: OrganizationAdmin[], total, page, limit }` | **Liste — primaire** (pagination/total) |
| `auth-service` | idem | `GET /admin/organizations/:id` | `OrganizationDetail { id,name,slug,phone?,country?,address?,status, members[] }` | **Détail — primaire** (404 → 404) |
| `kyc-service` | `KYC_SERVICE_URL` (`…:3002/api/v1`) | `GET /admin/kyc` | `KycReviewItem[] { orgId, status, submittedAt?, reviewedAt?, updatedAt }` | Liste : index `orgId→status` |
| `kyc-service` | idem | `GET /admin/kyc/:orgId` | `KycDetail { orgId, status, documents[] (présignés), rejectionReason?, reviewedAt?, reviewedBy?, submittedAt?, ocrSummary? }` | Détail (404 → `absent`) |
| `platform-catalog-service` | `CATALOG_SERVICE_URL` | `GET /catalog/entitlements/:orgId?status=ACTIVE` | `Entitlement[] { organizationId, moduleCode, versionCode, referentiel?, status, source?, grantedBy?, updatedAt? }` | Compteur (liste) + liste (détail) |

> **Contrats dupliqués (K4)** : `admin-panel` **retype localement** uniquement les champs qu'il lit ; pas d'import cross-service ni de package partagé en phase 1 (même règle que la duplication des contrats Kafka `kyc-service`/`document-service`).

### Composition & dégradation (règle d'or)

- **Détail** — `Promise.allSettled([auth.getOrganization, kyc.getKycDetail, catalog.listEntitlements])` :
  - `auth` rejeté **404** → lever `NotFoundException` (404 agrégat) ; `auth` rejeté autre → `BadGatewayException`/`ServiceUnavailableException` (502/503). **auth = dépendance dure.**
  - `kyc` rejeté **404** → `kyc: null`, `sources.kyc='absent'` ; `kyc` rejeté autre → `kyc: null`, `sources.kyc='unavailable'`.
  - `catalog` rejeté (quel que soit le code) → `entitlements: null`, `sources.entitlements='unavailable'`.
- **Liste** — `auth` d'abord (si échec → propager 502/503) ; puis **en parallèle** l'index KYC (1 appel) et le fan-out entitlements (≤ `limit` appels), chacun `allSettled` :
  - index KYC en échec → tous les `kycStatus` restent `undefined`, `sources.kyc='unavailable'` ;
  - un appel entitlements en échec → `activeEntitlementsCount` `undefined` pour cette org (dégradation par item), `sources.entitlements='unavailable'` si ≥ 1 échec.
- **Mapping d'erreur amont** : détecter le `404` via `error.response?.status === 404` (axios) ; tout le reste (timeout `ECONNABORTED`, `5xx`, réseau) ⇒ `unavailable`. Encapsuler ce mapping dans une petite fonction testée (`classifyUpstreamError`).

### Efficacité (N+1 assumé et borné)

- Le compteur d'entitlements de la **liste** fait **jusqu'à `limit` appels** `catalog` (un par org de la page) — `catalog` **n'expose pas** d'endpoint multi-org. C'est **borné par la taille de page** (défaut 20), exécuté **en parallèle**, avec **timeout court** et **dégradation par item**. Acceptable à l'échelle phase 1. *Optimisation future (hors périmètre)* : endpoint `catalog` « bulk entitlements » (`?orgIds=`) → un seul appel.
- Le statut KYC de la liste est obtenu en **un seul** appel (`GET /admin/kyc` = file complète, items légers), **pas** en N+1 — choix délibéré (l'item de file ne porte pas d'URL présignée, contrairement au détail). Limite connue : la file est `O(nb total de dossiers)` ; à grande échelle, un futur `GET /admin/kyc?orgIds=` la bornerait à la page.

### Sécurité (NFR)

- `@Roles(PLATFORM_ADMIN)` sur `AdminOrgsController` ; `JwtAuthGuard`/`RolesGuard` globaux (STORY-046). **Défense en profondeur** : les amont réappliquent `PLATFORM_ADMIN`.
- **Relais de bearer** : `JwtRelayService` (STORY-046) injecte l'`Authorization` sortant ; **jamais** journalisé (redaction pino).
- **Anti-énumération** : org inconnue → **404** (reflète `auth`), sans divulguer quelle source a répondu quoi ; les corps d'erreur ne fuient pas les URLs/états amont au-delà de `sources`.
- **Lecture seule / DO-1** : le BFF ne modifie aucun statut KYC, ne déclenche aucune transition, n'appelle aucun endpoint d'écriture (réservé à STORY-048).
- **Résilience** : timeouts courts + `allSettled` bornent la latence et empêchent qu'un amont lent bloque l'agrégat ; `/health` reste **sans fan-out** (anti-cascade).

### Points d'attention d'implémentation

- **Port du `platform-catalog-service`** : confirmer `CATALOG_SERVICE_URL` dans le compose racine (noté « à vérifier » en STORY-046).
- **Query passthrough** : `ListOrgsQueryDto` valide et **transmet** `page/limit/status/q` sans réinterpréter la pagination (le BFF ne recalcule ni `total` ni tri).
- **`ocrSummary`** (STORY-045) est déjà porté par `AdminKycDetailDto` amont : le détail agrégé le **traverse tel quel** (le front l'affiche ; DO-1 : informatif).
- **`admin.module.ts`** doit importer `UpstreamModule` (exporte les 3 clients) et déclarer `OrgAggregationService`.

---

## Dependencies

**Stories prérequises :**
- **STORY-046** (scaffold BFF, `UpstreamModule` + 3 clients + `JwtRelayService`) — **socle direct** ✅.
- **STORY-027** (auth : admin orgs `GET /admin/organizations` liste+détail) — source identité ✅.
- **STORY-013** (kyc : revue admin `GET /admin/kyc` + `GET /admin/kyc/:orgId`) — source KYC ✅.
- **STORY-045** (kyc : `ocrSummary`/`extraction` dans le détail admin) — enrichissement OCR ✅.
- **STORY-033** (catalog : entitlements `GET /catalog/entitlements/:orgId`) — source entitlements ✅.

**Stories débloquées :**
- **STORY-048** — actions proxifiées (approve/reject KYC → kyc ; grant/revoke entitlement → catalog) sur ce socle de composition.
- **STORY-049** — e2e chaîne KYC complète (docker) 🏁.
- **AP-02** (front) — vue agrégée des organisations (consommateur direct de ces endpoints).

**Dépendances externes :**
- URLs/ports amont dans le compose (`auth-service:3001`, `kyc-service:3002`, `platform-catalog-service` — **port à confirmer**).
- `nock` (ou serveur HTTP factice) en devDependency pour les e2e (mock des amont) — à ajouter si absent.

---

## Definition of Done

- [ ] ESLint : 0 warning, `npm run lint` vert
- [ ] Build : `nest build` vert
- [ ] Tests : `npm test` ≥ **65% branches / 90% functions / 90% lines / 90% statements** ; `OrgAggregationService` (matrice de dégradation : all-ok / kyc-down / catalog-down / kyc-404-absent / auth-down-502 / org-inconnue-404), méthodes clients (mapping 404/timeout) et contrôleur couverts
- [ ] Coverage : `npm run test:cov` générée et rapportée
- [ ] **Vérification docker bout-en-bout** (`mongo` rs0 + `kafka` + `minio` + `mailhog` + `auth:3001` + `kyc:3002` + `catalog` + `document:3006` + `admin:3010`), consignée en §Revue & validation :
  - login `PLATFORM_ADMIN` → JWT `aud` incl. `admin-panel` ;
  - **`GET :3010/api/v1/admin/orgs`** → **200** paginé, items enrichis `kycStatus` + `activeEntitlementsCount` ;
  - **`GET :3010/api/v1/admin/orgs/:orgId`** (org ayant un dossier KYC réel, via inscription→upload→OCR) → **200** avec identité+membres, **documents présignés**, **`ocrSummary`**, entitlements ;
  - **détail d'une org sans KYC** → `kyc: null` (`absent`) ;
  - **dégradation** : arrêt de `kyc` (ou `catalog`) → l'agrégat reste **200**, `sources` = `unavailable` ;
  - **org inconnue** → **404** ; **non-admin** → **403** ; **sans token** → **401**
- [ ] Swagger `/api/docs` : les 2 routes documentées (tag `admin`), schémas d'agrégat + réponses `200/401/403/404/502`
- [ ] Diagnostic `whoami` **retiré** (contrôleur + DTO) ; `admin.module.ts` mis à jour
- [ ] **Aucune** base / read-model / Kafka / action d'écriture introduits ; `/health` inchangé (public, sans fan-out)
- [ ] Non-régression : les autres services **inchangés** (leur `/health` reste vert) ; matrice CI verte pour `admin-panel`
- [ ] `.env.example` inchangé ou complété si nouvelle variable (a priori aucune : URLs amont déjà posées en STORY-046)
- [ ] `/code-review` réalisé ; constats correctness corrigés
- [ ] Statut mis à jour dans `sprint-status.yaml` (+ `completed_date` à la clôture)
- [ ] Flux git projet : branche `MNV-047`, commit `MNV-047(admin-panel): …`, PR « Rebase and merge » sur `dev`, branche supprimée après merge (repo `prospera-admin-panel-service` existe)

---

## Story Points Breakdown

- **Méthodes typées amont** (auth list/detail, kyc queue/detail, catalog entitlements) + **contrats dupliqués** + mapping `404`/timeout : **1,5 pt**
- **`OrgAggregationService`** (fan-out parallèle `allSettled`, fusion, dégradation partielle, compteur, distinction `absent`/`unavailable`) : **1,5 pt**
- **`AdminOrgsController` + DTOs** (liste paginée + détail + `sources`) + Swagger + retrait `whoami` : **1 pt**
- **Tests** (matrice de dégradation unit + e2e amont mockés) + vérif docker : **1 pt**
- **Total : 5 points**

**Rationale :** le socle HTTP (clients, relais, timeout) existe déjà (STORY-046) → l'effort porte sur la **logique de composition** et surtout la **dégradation partielle** (le vrai cœur de valeur et de risque : distinguer `absent` de `unavailable`, borner la latence, ne jamais tomber sur une panne non primaire). Cohérent avec l'estimation du sprint-plan (5 pts).

---

## Additional Notes

- **BFF sans vérité** : aucune donnée n'est stockée ni mise en cache ; chaque requête recompose l'état frais depuis les propriétaires. C'est un choix d'architecture (P8) — pas d'incohérence de read-model à gérer.
- **`whoami` provisoire** : son retrait suit le patron `document-service` (sonde retirée en STORY-044 au profit des vrais contrôleurs).
- **Symétrie avec STORY-048** : les mêmes clients amont porteront les **méthodes d'écriture** (approve/reject, grant/revoke) ; STORY-047 valide le **relais du bearer** et la **résolution des amont** en lecture avant d'y ajouter les actions.
- **Repo GitHub** : `prospera-admin-panel-service` (créé pour STORY-046, fourni par l'user) — push après validation (branche `MNV-047`).

---

## Revue & validation

**Implémenté le 2026-07-15 (BMAD dev-story).** Vue agrégée déposée sur le socle STORY-046 — **première logique métier du BFF**, en **lecture seule** :

- **Clients amont typés** : `AuthServiceClient.listOrganizations/getOrganization`, `KycServiceClient.getReviewQueue/getKycDetail`, `CatalogServiceClient.listEntitlements(status?)` — construits sur le helper `get()` (relais bearer + timeout court, STORY-046). **Contrats amont dupliqués** (`upstream/contracts/` : auth-org, kyc, entitlement — K4, retypage local de ce qui est lu).
- **`OrgAggregationService`** : `listOrgs` (auth paginé **primaire** → enrichi par 1 appel KYC indexé + fan-out entitlements borné à la page) et `getOrgDetail` (3 appels `Promise.allSettled` : identité/kyc/catalog). **Dégradation partielle** via `upstream-error.ts` (`classifyUpstreamError` : 404 → `absent`, timeout/5xx/réseau → `unavailable`). `auth` = dépendance dure (404 → `NotFoundException`, autre → `ServiceUnavailableException`). Invariant **DO-1** : aucune écriture, aucune transition KYC.
- **`AdminOrgsController`** (`@Roles(PLATFORM_ADMIN)`, `GET /admin/orgs` + `/:orgId`) : relais du bearer via `JwtRelayService` (jamais journalisé), garde-fou 401 si en-tête absent/mal formé. **Diagnostic `whoami` retiré** (contrôleur + DTO + e2e).
- **DTOs** : `AdminOrgListItemDto`/`PaginatedAdminOrgsDto`, `AdminOrgDetailDto`, `AggregateSourcesDto`, `ListOrgsQueryDto` (page/limit≤100/status/q, `ValidationPipe` stricte). Swagger (tag `admin`, réponses 200/401/403/404/502).

**Qualité :** `npm run lint` **0 warning** ; `nest build` **OK** ; **90 unit (18 suites)** + **12 e2e (2 suites)** verts ; **couverture 99.71 / 88.42 / 100 / 99.67** (seuils 65/90/90/90 ; `admin/orgs` et `upstream` à **100 %**, dont la matrice de dégradation).

**Vérification docker bout-en-bout** (`mongo` rs0 + `kafka` + `minio` + `mailhog` + `auth:3001` + `kyc:3002` + `catalog:3003` + `document:3006` + `admin:3010`) :
- Login `PLATFORM_ADMIN` (register → mongo `platformRole` + suppression membership + `emailVerifiedAt` → login) → JWT RS256 dont l'**`aud` contient `admin-panel`** (`[…, document-service, admin-panel]`), `roles:[PLATFORM_ADMIN]`, `org:null`.
- **`GET /admin/orgs?limit=50`** → **200** paginé (**73** orgs au total), items enrichis : `identityStatus` (ACTIVE/SUSPENDED réels), `kycStatus` réel (UNDER_REVIEW/APPROVED/REJECTED/PENDING_DOCUMENTS/absent), `activeEntitlementsCount` réel (ex. tenants bilan à 1) ; `sources:{kyc:ok,entitlements:ok}`.
- **`GET /admin/orgs/:orgId`** sur l'org OCR (STORY-045) → **200** : identité + 1 membre ; `kyc.status=UNDER_REVIEW`, **2 pièces présignées** (RCCM+CFE), **`ocrSummary`** `{hasDiscrepancies:true, anyUnreadable:true, anyExpired:false, extractedCount:2}` ; `sources:{kyc:ok,entitlements:ok}`. Stable **9/9** appels consécutifs.
- **Org sans dossier KYC** (org fraîche) → **200**, `kyc:null`, `sources.kyc="absent"` ; **org avec entitlement** → `entitlements:[{moduleCode:bilan,status:ACTIVE}]`.
- **Dégradation partielle** : `docker compose stop kyc-service` → `GET /admin/orgs` **200** `sources.kyc="unavailable"` (tous `kycStatus` absents), `entitlements` toujours `ok` ; détail **200** `kyc:null` `sources.kyc="unavailable"`. `start kyc-service` → retour `sources:{kyc:ok,entitlements:ok}`.
- **Négatifs** : org inconnue → **404** ; non-admin (TENANT_ADMIN) → **403** ; sans jeton → **401** ; `limit=500` → **400** (ValidationPipe).
- Non-régression : les autres services inchangés (aucune modification de code applicatif) ; `admin-panel /health` reste public sans fan-out.

**Note d'exploitation** : un blip transitoire « catalog unavailable » sur le détail a été observé sur un process en état de reload dégradé (EADDRINUSE du watch dev) ; disparu après redémarrage propre — **hors code** (les appels axios bruts renvoyaient 200 ; comportement stable 9/9 sur process sain).

**Repo** : `prospera-admin-panel-service`, branche `MNV-047`, PR « Rebase and merge » sur `dev`.

**Reste :** — (débloque STORY-048 actions proxifiées, STORY-049 e2e chaîne KYC, AP-02 front).

---

## Progress Tracking

**Status History:**
- 2026-07-15 : Créée par vivian (Scrum Master, BMAD create-story)
- 2026-07-15 : Implémentée + vérifiée docker + `/code-review` (BMAD dev-story)

**Actual Effort:** 5 points (conforme à l'estimation)

---

**Status:** ✅ Done (vérifiée docker 2026-07-15)
**Created:** 2026-07-15
**Reference:** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-2 ; `architecture-prospera-ecosystem-2026-07-04.md` § P8/FR-012 ; `sprint-plan-phase1-2026-07-10.md` § EPIC-016 ; `frontend-sprint-plan-admin-panel-2026-07-12.md` § AP-02

**Cette story a été créée avec BMAD Method v6 — Phase 4 (Implementation Planning).**
