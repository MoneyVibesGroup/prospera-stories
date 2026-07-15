# STORY-046 : Scaffold `admin-panel` (BFF :3010, relying party JWKS, RolesGuard PLATFORM_ADMIN, health, sans base, clients HTTP amont)

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. architecture :** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-1 (Scaffold BFF) ; `architecture-prospera-ecosystem-2026-07-04.md` § P8 (admin-panel BFF résout FR-012 ; l'IdP stampe l'`aud`) ; `sprint-plan-phase1-2026-07-10.md` § Module 0 (EPIC-016) ; `synthese-services-prospera-2026-07-10.md` (décision AD-2)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-15
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-15
**Sprint :** 9 (2026-10-22 → 2026-11-05)
**Service :** `admin-panel` (:3010, **aucune base de données**)
**Couvre :** — (story d'infrastructure ; débloque la vue agrégée STORY-047 puis les actions proxifiées STORY-048, et le socle front AP-01)

> **Fondation du BFF d'administration (flux A, AD-2).** C'est la **première story du service `admin-panel`** — elle pose le **squelette du BFF**, les **conventions de code** (calquées sur `document-service`/`kyc-service`), le **démarrage via docker-compose racine** et surtout **deux briques inédites dans l'écosystème** : (1) un service **sans base de données** (aucun Mongoose, aucun Kafka en v1 — il ne possède rien, il compose et relaie), et (2) le **premier client HTTP amont** de la plateforme (`@nestjs/axios` vers `auth`/`kyc`/`catalog`, avec **relais du JWT admin**). Aucune agrégation métier : juste une **base vérifiable en isolation** (le service démarre, `/health` répond, un `PLATFORM_ADMIN` passe la garde, un non-admin est refusé 403). La **vue agrégée des orgs** (STORY-047) et les **actions proxifiées** (STORY-048) se greffent sur ce socle.

---

## User Story

En tant qu'**administrateur plateforme Money Vibes (`PLATFORM_ADMIN`)**,
je veux un micro-service **`admin-panel` (BFF) démarrable via le compose racine**, doté du **socle transverse relying party**, d'une **garde `PLATFORM_ADMIN` sur toutes les routes** et de **clients HTTP configurés vers les services amont**,
afin de disposer d'un **point d'entrée d'administration unifié et de confiance** sur lequel se grefferont la vue agrégée des organisations (identité + KYC + entitlements) puis les actions de revue/octroi.

---

## Description

### Contexte

La décision **AD-2** (Module 0, chaîne KYC) crée `admin-panel` : un **Backend-For-Frontend d'administration** qui offre à un `PLATFORM_ADMIN` une **vue agrégée des organisations** (identité `auth` + KYC `kyc` + entitlements `catalog`) et les **actions de revue KYC / octroi d'entitlement**, en **proxifiant** vers les services propriétaires. Point clé d'architecture (P8, `tech-spec-admin-panel-2026-07-10.md`) : **il ne possède aucune donnée** — pas de base, pas de read-model persistant en v1. Il **valide le jeton**, **applique le rôle**, **compose à la volée** et **relaie le bearer de l'admin** aux services amont (qui appliquent déjà `PLATFORM_ADMIN` sur leurs endpoints).

Ce BFF résout le point ouvert **FR-012** (dashboard admin agrégé) sans nouvelle source de vérité : identité reste à `auth`, KYC à `kyc`, entitlements à `catalog`. Le front (app `prospera-admin-panel`, story **AP-01**) est le **consommateur** de ce backend via la gateway (préfixe `/admin`).

**STORY-046 est l'os** : le projet NestJS, ses conventions, son infrastructure de démarrage, la validation RS256/JWKS, la garde `PLATFORM_ADMIN` et le **câblage des clients HTTP amont** (URLs + timeouts + relais de jeton). Aucune logique d'agrégation n'y est portée — cela garantit une base **vérifiable en isolation** avant d'y déposer la composition (STORY-047) et les actions (STORY-048).

Deux différences structurantes avec les scaffolds précédents (`document-service` STORY-041, `balance-service` STORY-076) :
- **Aucune persistance** : pas de `DatabaseModule`/Mongoose, pas de `KafkaModule` (kafkajs non requis en v1). Le `/health` est une **sonde de vivacité** (le process répond) — **il ne dépend d'aucun amont** (pas de cascade de panne).
- **Premier client HTTP amont de l'écosystème** : `admin-panel` introduit `@nestjs/axios`/`HttpModule` (aucun service ne l'utilisait jusqu'ici). Le scaffold pose les **clients typés** (`auth`/`kyc`/`catalog`) construits sur des **URLs d'env**, avec **timeouts courts** et un **relais du bearer** (jamais journalisé) — mais **sans appel métier** (les méthodes d'agrégation arrivent en 047).

### Périmètre

**Inclus :**

- **Projet `admin-panel/`** : projet NestJS 11 / Node 20 (TS strict) **calqué sur `document-service`/`kyc-service`** (mêmes conventions : Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` avec Helmet + préfixe/versionnement `/api/v1` + `ValidationPipe` stricte + Swagger, logger pino, `HealthModule`, `ThrottlerModule`, seuils Jest **65/90/90/90**, ESLint **0 warning**). **Première apparition du service dans le code** (jusqu'ici il n'existe que comme entrée du tracker `sprint-status.yaml` et comme tech-spec).
- **Bootstrap `main.ts`** : Helmet, `setGlobalPrefix('api')` + versionnement URI `v1`, `ValidationPipe` stricte (`whitelist`/`forbidNonWhitelisted`/`transform`), logger pino, **Swagger titré « PROSPERA — Admin Panel »** sur `/api/docs` (tags `health`, `admin`).
- **`AuthModule` — validation RS256/JWKS (relying party PUR)** : `JwtStrategy` **validate-only** (jwks-rsa : cache/rotation du `kid`, **`algorithms: ['RS256']`** imposé anti algorithm-confusion, `iss`/`aud` vérifiés — **`aud=[admin-panel]`**), mapping `org`→`tenantId` (`null` pour un `PLATFORM_ADMIN`) et `roles[]`→`role`. Modèle repris **tel quel** de `kyc-service` (STORY-020) / `document-service` (STORY-041). **Aucune émission de jeton, aucun mot de passe** (pas de `PasswordService`/bcrypt) : les endpoints d'émission (`/auth/login`, `/auth/register`) **n'existent pas** (→ 404).
- **Socle transverse `common/` dupliqué** : `context/tenant-context.service`, guards (`jwt-auth.guard`, `roles.guard`), décorateurs (`current-user`, `public`, `roles`, `allow-unverified`), `filters/all-exceptions.filter`, `interceptors/logging.interceptor`, `enums/` (`Role` — dont `PLATFORM_ADMIN`), `utils/` (+ leurs specs). Duplication **à l'identique** (K4, pas de package partagé en phase 1). **Pas de `database/tenant-scoped.repository`** (aucune base) ni de `security/password.service` (relying party pur).
- **Garde globale + `PLATFORM_ADMIN` par défaut** : `JwtAuthGuard` **global** (`APP_GUARD`) — seules les routes `@Public()` (health) sont ouvertes ; `RolesGuard` global. Les routes d'administration portent `@Roles(Role.PLATFORM_ADMIN)` (patron `kyc-admin.controller.ts` STORY-013). Un non-`PLATFORM_ADMIN` authentifié → **403** ; sans token / HS256 forgé / RS256 altéré → **401**.
- **`UpstreamModule` — clients HTTP amont (NOUVEAU dans l'écosystème)** : basé sur `@nestjs/axios`/`HttpModule` **configuré** (timeout court par défaut, `maxRedirects: 0`). Trois **clients typés** — `AuthServiceClient`, `KycServiceClient`, `CatalogServiceClient` — construits sur des **URLs d'env** (`AUTH_SERVICE_URL`, `KYC_SERVICE_URL`, `CATALOG_SERVICE_URL`). Au scaffold ils **n'exposent aucune méthode d'agrégation** (celles-ci arrivent en 047) : ils portent seulement la **résolution de l'URL de base**, la **config des timeouts** et l'**injection de l'en-tête `Authorization`** via un `JwtRelayService` (extrait le bearer de la requête entrante, **ne le journalise jamais**). Ces briques sont **unitairement testées** (résolution d'URL, construction d'en-tête de relais, config timeout) pour éviter du code orphelin non couvert.
- **`HealthModule`** : `GET /api/v1/health` **public**, **sonde de vivacité pure** (le process répond) — **sans dépendance amont** (pas de fan-out ; évite qu'une panne d'un service amont fasse tomber la santé du BFF). Pas de Mongo, pas de Kafka.
- **Endpoint diagnostic gardé** `GET /api/v1/admin/whoami` (`JwtAuthGuard` + `@Roles(PLATFORM_ADMIN)`) renvoyant `{ sub, org, roles, emailVerified }` extrait du JWT validé — **sonde de câblage** prouvant *à la fois* la validation JWKS **et** la garde `PLATFORM_ADMIN` (200 pour un admin, **403** pour un non-admin). Explicitement **provisoire** : remplacé par les vrais contrôleurs dès STORY-047.
- **`ConfigModule` + `env.validation`** : `AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE` **requis** ; `AUTH_SERVICE_URL`/`KYC_SERVICE_URL`/`CATALOG_SERVICE_URL` **requis** ; `UPSTREAM_HTTP_TIMEOUT_MS` (défaut court, ex. 3000) ; port `PORT` (défaut 3010). `.env.example` documenté.
- **`docker-compose.yml` racine** : STORY-046 **ajoute** le bloc `admin-panel` (build, `:3010`, env_file, `depends_on` `auth-service` *healthy* — pour disposer du JWKS —, healthcheck `/api/v1/health`) au compose racine, **et ajoute `admin-panel` à l'`AUTH_AUDIENCE` de l'IdP** (bloc `auth-service`) pour que l'IdP **stampe `admin-panel` dans l'`aud`**. `docker-compose.override.yml` : `admin-panel` en `target: base` + `npm run start:dev` + montage `./admin-panel/src` (hot-reload). Sans modifier le code applicatif des autres services.
- **CI en matrice** : ajout de `admin-panel` à `strategy.matrix.service` du workflow `ci.yml` (lint + build + test(+cov)). `admin-panel` **n'a pas besoin de Mongo** (le `MONGODB_URI` de matrice reste inutilisé) ; l'`AUTH_AUDIENCE` de CI inclut désormais `admin-panel`.
- **Tests** : unitaires du socle dupliqué (specs reprises vertes) + unitaires `UpstreamModule` (résolution URL, en-tête de relais, timeout) ; **e2e** : `GET /api/v1/health` → 200 (public) ; `GET /api/v1/admin/whoami` avec RS256 `aud=admin-panel` **rôle PLATFORM_ADMIN** → 200 ; **rôle non-admin → 403** ; sans token / HS256 forgé → **401** (JWT RS256 mintés en test).

**Hors périmètre :**

- **Vue agrégée des orgs** — `GET /admin/orgs` + `GET /admin/orgs/:orgId` (composition fan-out identité+KYC+entitlements, dégradation partielle) → **STORY-047**. Aucune méthode d'agrégation dans les clients ici.
- **Actions proxifiées** — approve/reject KYC (→ kyc), grant/revoke entitlement (→ catalog), relais du JWT admin en écriture → **STORY-048**.
- **e2e chaîne KYC complète** (inscription → upload → OCR → revue admin → approbation) → **STORY-049**.
- **Base de données / read-model persistant / Kafka** — **jamais** en v1 (le BFF ne possède aucune donnée ; composition à la volée).
- **Front (UI)** — app `prospera-admin-panel` → story **AP-01** (consommateur de ce backend).
- **Auth service-à-service M2M** (décision C8) — non requis en v1 : le BFF relaie le bearer de l'admin.
- **Package partagé `common/`** (extraction) → deferred (K4).

### Flux (mise en route)

1. Un développeur lance **`docker compose up` à la racine `PROSPERA/`**.
2. L'infra et les services démarrent, dont `auth-service` (`:3001`) — l'IdP qui expose le JWKS et **stampe désormais `admin-panel` dans l'`aud`**.
3. **`admin-panel` (`:3010`)** démarre (aucune base, aucun Kafka).
4. `GET http://localhost:3010/api/v1/health` → **200** (vivacité ; aucun appel amont). `http://localhost:3010/api/docs` affiche « PROSPERA — Admin Panel ».
5. Un `PLATFORM_ADMIN` se connecte sur l'IdP (`:3001`) → JWT RS256 dont l'`aud` **contient `admin-panel`** → `GET :3010/api/v1/admin/whoami` avec ce bearer → **200** (`{ sub, org, roles, emailVerified }`). Un utilisateur **non-admin** avec un JWT valide → **403**. Sans token / HS256 forgé → **401**.
6. *(STORY-047+)* On dépose la composition (`GET /admin/orgs…`) et les actions sur ce socle.

---

## Acceptance Criteria

- [ ] **Projet `admin-panel/`** existe (NestJS 11 / Node 20, TypeScript strict) avec les **mêmes conventions** que `document-service`/`kyc-service` : Dockerfile multi-stage, scripts `package.json`, ESLint `--max-warnings 0`, seuils Jest **65/90/90/90**. `npm run lint`, `nest build` et `npm test` **verts**.
- [ ] `main.ts` monte Helmet, préfixe `api` + versionnement URI `v1`, `ValidationPipe` stricte, logger **pino**, `ThrottlerModule`, et **Swagger « PROSPERA — Admin Panel »** sur **`/api/docs`** (tags `health`, `admin`).
- [ ] **Validation RS256/JWKS opérationnelle** (relying party pur) : `JwtStrategy` validate-only (jwks-rsa, `algorithms:['RS256']`, `iss`/`aud=[admin-panel]` vérifiés) ; un JWT RS256 émis par `auth-service` est accepté, un HS256 forgé / un token altéré → **401**. **Aucun endpoint d'émission** (`/auth/login`, `/auth/register` → 404). **Pas de `PasswordService`/bcrypt.**
- [ ] **Garde `PLATFORM_ADMIN`** : `JwtAuthGuard` global (seul `@Public()` sur health) + `RolesGuard` ; `GET /api/v1/admin/whoami` sous `@Roles(PLATFORM_ADMIN)` renvoie **200** (`{ sub, org, roles, emailVerified }`) pour un `PLATFORM_ADMIN` et **403** pour un utilisateur authentifié non-admin ; **401** sans token.
- [ ] Le service **ne possède AUCUNE base de données** : pas de `DatabaseModule`/Mongoose, pas de `KafkaModule`. Le `/health` est **public** et **sans dépendance amont** (sonde de vivacité pure).
- [ ] **`UpstreamModule` câblé** : `HttpModule` (`@nestjs/axios`) configuré (timeout court, `maxRedirects:0`) ; trois clients typés (`AuthServiceClient`/`KycServiceClient`/`CatalogServiceClient`) construits sur `AUTH_SERVICE_URL`/`KYC_SERVICE_URL`/`CATALOG_SERVICE_URL` ; `JwtRelayService` construit l'en-tête `Authorization` à partir du bearer entrant **sans jamais le journaliser**. **Aucune méthode d'agrégation** (déférée à 047) ; les briques (URL, en-tête de relais, timeout) sont **unitairement testées**.
- [ ] Le **socle transverse `common/`** est présent et **testé** : `TenantContext`, guards (`jwt-auth`, `roles`), décorateurs, filtres, intercepteurs, `enums` (`Role`). Les specs **passent**. *(Pas de `TenantScopedRepository` ni de `PasswordService` — aucune base, relying party pur.)*
- [ ] **`docker-compose.yml` racine** orchestre `admin-panel` (`:3010`, `depends_on` `auth-service` *healthy*), **et l'IdP `auth-service` ajoute `admin-panel` à son `AUTH_AUDIENCE`** (l'`aud` du JWT contient `admin-panel`) ; `docker-compose.override.yml` fournit le **hot-reload** (`./admin-panel/src` monté).
- [ ] `docker compose up` **à la racine** démarre l'ensemble ; `GET :3010/api/v1/health` → **200** ; login IdP `PLATFORM_ADMIN` → JWT `aud` incl. `admin-panel` → `GET :3010/api/v1/admin/whoami` → **200** ; non-admin → **403** ; négatifs → **401**.
- [ ] **CI en matrice** : `admin-panel` ajouté à `service:[…]` (lint + build + test(+cov)) ; l'`AUTH_AUDIENCE` de CI inclut `admin-panel` ; le job `admin-panel` est **vert** (sans dépendance Mongo).
- [ ] Les **autres services** (`auth-service`, `kyc-service`, `document-service`, `platform-catalog-service`, `bilan-service`, `expert-comptable`) **n'ont subi aucune modification de code applicatif** (seul le bloc IdP `AUTH_AUDIENCE` du compose est étendu) — non-régression.
- [ ] **Aucune** logique d'agrégation, **aucune** action proxifiée, **aucune** base/read-model n'est introduite (respect du découpage EPIC-016 : 047 compose, 048 agit).

---

## Technical Notes

### Composants / arborescence

```
PROSPERA/
├── docker-compose.yml                 # racine — MODIFIÉ : +bloc admin-panel ; IdP AUTH_AUDIENCE += admin-panel
├── docker-compose.override.yml        # MODIFIÉ : +hot-reload admin-panel (mount ./admin-panel/src)
├── .github/workflows/ci.yml           # MODIFIÉ : matrice service[] += admin-panel ; AUTH_AUDIENCE += admin-panel
├── admin-panel/                       # NOUVEAU projet (BFF, SANS base)
│   ├── Dockerfile                     # base / build / runtime (pattern identique)
│   ├── .dockerignore  .env.example
│   ├── package.json  tsconfig*.json  nest-cli.json  eslint.config.*
│   ├── test/jest-e2e.json             # e2e : health public, whoami 200/403/401 (JWT RS256 mintés en test)
│   └── src/
│       ├── main.ts                    # Helmet, /api/v1, ValidationPipe, pino, Throttler, Swagger « PROSPERA — Admin Panel »
│       ├── app.module.ts              # Config, Auth(JWKS), Throttler, Health, Upstream, Common — PAS de Database, PAS de Kafka
│       ├── config/                    # configuration.ts, env.validation (AUTH_JWKS_URI/ISSUER/AUDIENCE + *_SERVICE_URL requis)
│       ├── auth/                      # AuthModule : JwtStrategy RS256/JWKS validate-only (jwks-rsa) — PAS d'émission
│       ├── common/                    # DUPLIQUÉ : context, guards(jwt-auth,roles), decorators, filters, interceptors, enums(Role), utils
│       │                              #   (PAS de database/tenant-scoped.repository, PAS de security/password)
│       ├── upstream/                  # NOUVEAU : HttpModule configuré + AuthServiceClient/KycServiceClient/CatalogServiceClient + JwtRelayService
│       ├── health/                    # GET /health PUBLIC : vivacité pure (aucun amont)
│       └── admin/                     # diagnostics : whoami.controller.ts (@Roles(PLATFORM_ADMIN), provisoire)
```

### `docker-compose.yml` racine — points clés

- **Ajout de `admin-panel`** :
  ```yaml
  admin-panel:
    build: { context: ./admin-panel, target: runtime }
    container_name: admin-panel
    ports:
      - "3010:3010"
    env_file: ./admin-panel/.env
    environment:
      - AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json
      - AUTH_ISSUER=${AUTH_ISSUER:-...}
      - AUTH_AUDIENCE=${ADMIN_AUTH_AUDIENCE:-admin-panel}
      - AUTH_SERVICE_URL=http://auth-service:3001/api/v1
      - KYC_SERVICE_URL=http://kyc-service:3002/api/v1
      - CATALOG_SERVICE_URL=http://platform-catalog-service:3003/api/v1
      - UPSTREAM_HTTP_TIMEOUT_MS=3000
    depends_on:
      auth-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e",
        "fetch('http://localhost:3010/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 10s
      timeout: 5s
      retries: 3
  ```
- **IdP `auth-service` — `AUTH_AUDIENCE` étendu** : ajouter `admin-panel` à la liste `IDP_AUTH_AUDIENCE` (aujourd'hui `expert-comptable,kyc-service,platform-catalog-service,bilan-service,document-service`) → l'IdP **stampe `admin-panel` dans l'`aud`** des jetons. Vérifier l'URL réelle de `platform-catalog-service` (port) au câblage du client catalog.
- **Override** : `admin-panel` en `target: base` + `npm run start:dev` + montage `./admin-panel/src`.
- **Pas de `depends_on` Mongo/Kafka** (le BFF n'en a pas) ; seul `auth-service` (JWKS) est requis *healthy* au démarrage.

### Clients HTTP amont (première brique de ce type)

- **`@nestjs/axios`** (`HttpModule`) configuré via `HttpModule.registerAsync` : `timeout: UPSTREAM_HTTP_TIMEOUT_MS`, `maxRedirects: 0`.
- **Clients typés isolés** (couplage amont contenu) : chacun reçoit son URL de base par injection de config. **Aucune méthode d'agrégation au scaffold** — seulement le socle réutilisable (base URL, en-tête de relais, timeout).
- **`JwtRelayService`** : extrait le bearer de la requête entrante (`CurrentUser`/en-tête `Authorization`) et produit l'en-tête à réémettre vers l'amont. **Ne journalise jamais le bearer** (exigence NFR sécurité). Les amont appliquent déjà `PLATFORM_ADMIN` → pas de M2M en v1.
- **Dégradation** (préparée, appliquée en 047) : timeouts courts par amont ; une indisponibilité amont donnera une **section « indisponible »** plutôt qu'un échec global.

### Health & diagnostic

- `GET /api/v1/health` : **public** (`@Public()`), **vivacité pure** (le process répond). **Aucun fan-out amont** — éviter qu'une panne d'`auth`/`kyc`/`catalog` fasse tomber la santé du BFF (anti-cascade).
- `GET /api/v1/admin/whoami` : **gardé** (`JwtAuthGuard` + `@Roles(PLATFORM_ADMIN)`), échoue `{ sub, org, roles, emailVerified }`. **Sonde de câblage** prouvant JWKS **+** garde de rôle. **Provisoire** — retiré/remplacé dès STORY-047 (patron STORY-041→044 : la sonde `whoami` a été remplacée par les vrais contrôleurs).

### Sécurité (NFR)

- RS256/JWKS ; `algorithms:['RS256']` (anti algorithm-confusion) ; `aud=[admin-panel]` + `iss` vérifiés.
- `PLATFORM_ADMIN` obligatoire sur les routes d'admin ; anti-énumération inter-org (à porter avec la composition en 047).
- **Relais de jeton sécurisé** : jamais de log du bearer ; portée minimale.
- `ThrottlerModule` (patron `kyc-service`/`document-service`).

---

## Dependencies

**Stories prérequises :**
- **auth-service (IdP)** — doit **stamper `admin-panel` dans l'`aud`** (STORY-046 étend `AUTH_AUDIENCE`). L'endpoint JWKS existe déjà.
- Aucune dépendance bloquante pour le **scaffold** lui-même (les endpoints amont réels ne sont consommés qu'en 047/048).

**Stories débloquées :**
- **STORY-047** — vue agrégée `GET /admin/orgs` + `/admin/orgs/:id` (composition fan-out).
- **STORY-048** — actions proxifiées (revue KYC → kyc ; grant/revoke entitlement → catalog).
- **STORY-049** — e2e chaîne KYC complète (docker) 🏁.
- **AP-01** (front) — socle console `prospera-admin-panel` consommant ce BFF.

**Dépendances externes :**
- URLs/ports des amont (`auth-service:3001`, `kyc-service:3002`, `platform-catalog-service`) — à confirmer au câblage (le port du catalog est à vérifier dans le compose).
- `@nestjs/axios` (+ `axios`) — nouvelle dépendance de projet (première dans l'écosystème).

---

## Definition of Done

- [ ] ESLint : 0 warning, `npm run lint` vert
- [ ] Build : `nest build` vert
- [ ] Tests : `npm test` ≥ **65% branches** / 90% functions / 90% lines / 90% statements ; nouveaux fichiers couverts (socle `common/`, `UpstreamModule`, `whoami`)
- [ ] Coverage : `npm run test:cov` générée, rapportée
- [ ] **Vérification docker bout-en-bout** : `docker compose up` → `GET :3010/api/v1/health` **200** ; login IdP `PLATFORM_ADMIN` → JWT `aud` incl. `admin-panel` → `GET :3010/api/v1/admin/whoami` **200** ; **non-admin → 403** ; HS256 forgé / sans token → **401** ; consignée dans §Revue & validation
- [ ] Swagger : `/api/docs` affiche « PROSPERA — Admin Panel », tags `health`, `admin`
- [ ] **Aucune base / aucun Kafka** introduits ; `/health` sans dépendance amont
- [ ] Non-régression : les autres services `/health` verts (seul le bloc IdP `AUTH_AUDIENCE` du compose est étendu)
- [ ] CI matrice : le workflow passe pour tous les services **+ `admin-panel`**
- [ ] `.env.example` : variables d'env documentées (`AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE`, `AUTH_SERVICE_URL`/`KYC_SERVICE_URL`/`CATALOG_SERVICE_URL`, `UPSTREAM_HTTP_TIMEOUT_MS`, `PORT`)
- [ ] `/code-review` réalisé ; constats correctness corrigés
- [ ] Statut mis à jour dans `sprint-status.yaml`
- [ ] Commit uniquement sur demande explicite / flux git projet (branche `MNV-046`, PR « Rebase and merge » sur `dev` — **si le repo du module existe**)

---

## Story Points Breakdown

- **Scaffold NestJS + `common/` dupliqué + Auth JWKS + Throttler :** 1 pt (copie/adaptation d'un patron rodé)
- **`UpstreamModule` (HttpModule + 3 clients + JwtRelay) — brique inédite + tests :** 1 pt
- **Health public + diagnostic `whoami` gardé PLATFORM_ADMIN + e2e :** 0,5 pt
- **Compose (`:3010`, IdP `aud`), override, CI matrice, `.env.example` :** 0,5 pt
- **Total :** **3 points**

**Rationale :** patron de scaffold **déjà rodé** (STORY-041/076) → l'essentiel est mécanique. Le surcoût réel tient à **deux nouveautés d'écosystème** (service **sans base** et **premier client HTTP amont** avec relais de jeton), compensé par l'**absence de base, de Kafka et de logique métier**. Cohérent avec l'estimation du sprint-plan (3 pts).

---

## Additional Notes

- **Différence assumée avec les scaffolds précédents** : `admin-panel` est le **premier service sans persistance** (pas de `DatabaseModule`, pas de `KafkaModule`) et le **premier consommateur HTTP amont**. Ces deux points sont les seuls écarts au moule ; tout le reste (relying party, guards, Swagger, Dockerfile, CI, seuils) est **identique**.
- **Le `whoami` est provisoire** : comme pour `document-service` (retiré en STORY-044), il disparaîtra au profit des vrais contrôleurs de composition (STORY-047).
- **Repo GitHub** : `admin-panel` est un **nouveau service sans dépôt** à ce jour (comme `document-service` avant la création de `prospera-ocr-service` par l'user). Au moment du push (après validation), **si le repo du module n'existe pas**, le signaler à l'user sans le créer en silence.

---

## Revue & validation

**Implémenté le 2026-07-15 (BMAD dev-story).** Service `admin-panel/` créé (NestJS 11 / Node 20, TS strict) sur le moule `document-service`/`kyc-service`, adapté pour un **BFF sans persistance** :

- **Relying party pur RS256/JWKS** : `AuthModule` + `JwtStrategy` validate-only (jwks-rsa, `algorithms:['RS256']`, `iss` + `aud=[admin-panel]`), aucune émission de jeton, pas de `PasswordService`.
- **Socle `common/` dupliqué** : `TenantContext`, guards (`jwt-auth`/`email-verified`/`roles`), décorateurs, filtre d'exceptions, intercepteur de logging, enum `Role`. **Sans** `TenantScopedRepository` (aucune base) ni `security/password`.
- **Garde globale** : `Throttler → Jwt → EmailVerified → Roles` (APP_GUARD). `@Roles(Role.PLATFORM_ADMIN)` sur le contrôleur d'admin.
- **`UpstreamModule` (brique inédite)** : `HttpModule` (`@nestjs/axios`, `timeout` court, `maxRedirects:0`), `JwtRelayService` (extraction/relais du bearer, jamais journalisé — `redact` pino confirmé), base `UpstreamClient` (jointure URL + en-tête de relais + timeout, helper `get` générique testé), clients typés `Auth`/`Kyc`/`Catalog` résolvant leur base URL depuis la config. **Aucune méthode d'agrégation** (→ 047).
- **`HealthModule`** : `GET /health` **public**, **vivacité pure** (aucune dépendance amont — anti-cascade).
- **Diagnostic provisoire** : `GET /admin/whoami` (`@Roles(PLATFORM_ADMIN)`) échoant `{ sub, org, roles, emailVerified }` — sonde de câblage JWKS + garde de rôle (retiré en 047).
- **Compose racine** : bloc `admin-panel` (`:3010`, `depends_on auth-service healthy`, healthcheck), **IdP `AUTH_AUDIENCE += admin-panel`**, override hot-reload, **CI matrice à 7 services** (+ URLs amont factices en CI).

**Qualité :** `npm run lint` **0 warning** ; `nest build` **OK** ; **62 unit (15 suites)** + **9 e2e (2 suites)** verts ; **couverture 99.61 / 84.05 / 100 / 99.56** (seuils 65/90/90/90 tenus, nouveaux fichiers couverts).

**Vérification docker bout-en-bout** (`mongo` rs0 + `redis` + `kafka` + `mailhog` + `auth-service:3001` + `admin-panel:3010`) :
- `GET :3010/api/v1/health` → **200** `{status:ok, liveness:up}` ; Swagger `/api/docs` → **200** (« PROSPERA — Admin Panel », paths `/health` + `/admin/whoami`).
- Login IdP du `PLATFORM_ADMIN` seedé → JWT RS256 dont l'**`aud` contient `admin-panel`** (`[…, document-service, admin-panel]`) → `GET :3010/api/v1/admin/whoami` → **200** `{sub, org:null, roles:[PLATFORM_ADMIN], emailVerified:true}`.
- **Sans jeton** → **401** ; **bearer invalide** → **401**.
- Non-admin **vérifié** (TENANT_ADMIN, e-mail vérifié via mongo) → **403** « Accès refusé : rôle insuffisant. » (prouve le `RolesGuard`, indépendamment de l'`EmailVerifiedGuard`).
- Non-régression : `auth-service` resté *healthy* (seul l'`AUTH_AUDIENCE` de l'IdP a été étendu, aucun code applicatif tiers modifié).

**Repo** : `https://github.com/MoneyVibesGroup/prospera-admin-panel-service.git` (nouveau, fourni par l'user). Branche `MNV-046`, PR « Rebase and merge » sur `dev`.

**Reste :** — (débloque STORY-047 vue agrégée, STORY-048 actions proxifiées, AP-01 front).

---

## Progress Tracking

**Status History:**
- 2026-07-15 : Créée par vivian (Scrum Master, BMAD create-story)
- 2026-07-15 : Implémentée + vérifiée docker + `/code-review` (BMAD dev-story)

**Actual Effort:** 3 points (conforme à l'estimation)

---

**Status:** ✅ Done (vérifiée docker 2026-07-15)
**Created:** 2026-07-15
**Reference:** `tech-spec-admin-panel-2026-07-10.md` § ST-ADMIN-1 ; `architecture-prospera-ecosystem-2026-07-04.md` § P8/FR-012 ; `sprint-plan-phase1-2026-07-10.md` § EPIC-016

**Cette story a été créée avec BMAD Method v6 — Phase 4 (Implementation Planning).**
