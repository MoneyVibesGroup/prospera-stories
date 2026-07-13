# STORY-031 : Scaffold `platform-catalog-service` (base `catalog_service` + relying party JWKS + health)

**Epic :** EPIC-007 — platform-catalog-service (catalogue modules/versions/référentiels + entitlements + topic `entitlement.changed`)
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` (v1.0, §Périmètre / §Stack / §Composants / §Authentification inter-services / §Orchestration & déploiement) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Modèle de jetons RS256-JWKS · décisions programme **P7/P8** + **NC-1** (renommage `catalog-service` → `platform-catalog-service`, PLAN FINAL 2026-07-10)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-13. `platform-catalog-service` créé (`:3003`, base `catalog_service`), *relying party* RS256/JWKS pur (socle `common/` dupliqué + `JwtStrategy` JWKS-only), `/health` (mongo+kafka), `KafkaModule` squelette, endpoint diagnostic gardé `GET /whoami`. Compose racine + override + CI en matrice 4 services ; l'IdP stampe `platform-catalog-service` dans l'`aud`. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-13
**Sprint :** 7
**Service :** platform-catalog-service (`:3003`) — **nouveau**, base Mongo dédiée `catalog_service`
**Couvre :** aucun FR du PRD `expert-comptable` (capacité **plateforme** nouvelle) — concrétise **P8** (infra du futur propriétaire d'entitlements)

> **Story de scaffold — tête de la chaîne EPIC-007.** `platform-catalog-service` est la **4ᵉ brique** de l'écosystème PROSPERA après `auth-service` (IdP), `expert-comptable` (vertical) et `kyc-service` (capacité partagée). Cette story crée le **squelette vérifiable en isolation** : le service démarre via le **compose racine existant** (créé STORY-022), valide un JWT réel de l'IdP par **JWKS** (RS256, *validate-only*), expose `/health` (mongo + kafka) et un `KafkaModule` squelette — **sans aucun domaine métier**. Le **catalogue** (`Module`/`ModuleVersion`/`ReferentielVersion`), les **entitlements** et la **publication de `entitlement.changed`** sont **hors périmètre** → STORY-032 / STORY-033 / STORY-034. On **calque** intégralement les conventions de `kyc-service` (STORY-020), le *relying party* le plus proche (même patron RS256/JWKS, pas d'e-mail, pas de mot de passe).

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux un **micro-service `platform-catalog-service` autonome et démarrable**, *relying party* pur d'`auth-service` (validation **RS256/JWKS**), avec base dédiée `catalog_service`, `/health` et un `KafkaModule` squelette,
afin de disposer d'un **socle vérifiable en isolation** sur lequel brancher le **catalogue** (STORY-032), les **entitlements** (STORY-033) et le **topic `entitlement.changed`** (STORY-034) — la source de vérité des droits d'usage (P8), prérequis d'`admin-panel` et de la gate Bilan.

---

## Description

### Contexte

Le re-cadrage écosystème du 2026-07-04 a fait de PROSPERA un **écosystème de micro-services** : un IdP racine (`auth-service`), des verticaux *relying parties* (EC) et des **capacités partagées** (`kyc-service`, puis `bilan-service`). Les décisions **P7/P8** créent une nouvelle capacité **plateforme** : dès qu'un module est partagé entre plusieurs verticaux, plus personne côté vertical (ni l'IdP, décision **A3**) ne peut être la source de vérité de « quelle version + quel référentiel servir à l'org X ». Cette responsabilité est élevée au rang de service dédié : `platform-catalog-service` (renommé de `catalog-service` par **NC-1**), qui possède le **catalogue des modules** et les **entitlements `(org × module)`**, et **publie** `entitlement.changed`.

L'EPIC-007 se découpe en 4 stories (§Allocation du sprint-plan, sprint 7) : **STORY-031** (scaffold + JWKS + health — *cette story*), **STORY-032** (catalogue `Module`/`ModuleVersion`/`ReferentielVersion` + admin CRUD + garde-fou N/N-1), **STORY-033** (entitlements + grant/revoke + réconciliation), **STORY-034** (événements `entitlement.changed` + auth service-à-service, décision C8). STORY-031 est **structurante mais volontairement sans fonctionnalité métier** : elle garantit une base **démarrable, sécurisée et testée** (le service boote, valide un JWT réel via JWKS, refuse un jeton forgé) avant qu'y soient branchés le catalogue puis le bus.

Comme pour STORY-020 (`kyc-service`), **il n'y a rien à ré-implémenter** : on **duplique** disciplinément le socle transverse `common/` et la `jwt.strategy` RS256/JWKS d'un *relying party* existant (décision **C6** : « même patron que kyc-service » ; **K4** de duplication assumée, factorisation en lib au prochain usage). Deux différences avec `kyc-service` : **pas de MinIO/StorageModule** (le catalogue ne stocke que des **pointeurs + checksum** d'artefacts — décision **C3** — et ces schémas arrivent en STORY-032 ; les artefacts sont téléchargés par `bilan-service`) et **pas de Redis** (aucun job interne en phase 1 ; le cache JWKS est celui de `jwks-rsa`, en mémoire).

### Périmètre

**Dans le périmètre**
- Scaffold `platform-catalog-service/` (projet NestJS 11 / Node 20, conventions, Dockerfile multi-stage, `main.ts`, `HealthModule`, base `catalog_service`).
- Socle `common/` **dupliqué** (context, database, guards, decorators, filters, interceptors, enums `Role`, type `AccessTokenPayload`).
- `auth/jwt.strategy.ts` **RS256/JWKS *validate-only*** (calquée sur `kyc-service` STORY-020), `AUTH_AUDIENCE=platform-catalog-service`.
- **Endpoint diagnostic gardé** `GET /api/v1/whoami` (JwtAuthGuard) échoant `{ sub, org, roles, emailVerified }` — **sonde de câblage du relying party**, remplacée par les vrais contrôleurs en STORY-032.
- `KafkaModule` **squelette** (client `kafkajs`, `kafka: up` en `/health`) — le **producteur `entitlement.changed` + outbox est déféré à STORY-034**.
- Bloc `platform-catalog-service` **ajouté** au `docker-compose.yml` **racine existant** (`:3003`, base `catalog_service`) + override hot-reload + `.env.example`.
- **Ajout de `platform-catalog-service` à l'`aud` émis par l'IdP** en dev (via env `AUTH_AUDIENCE` du bloc `auth-service` du compose — **aucun changement de code `auth-service`**, cf. §Cas limites).
- CI en matrice `service: [expert-comptable, auth-service, kyc-service, platform-catalog-service]`.

**Hors périmètre (stories suivantes)**
- **Catalogue** : schémas `Module` / `ModuleVersion` / `ReferentielVersion`, admin CRUD `@Roles(PLATFORM_ADMIN)`, cycle de vie `ACTIVE → DEPRECATED → RETIRED`, garde-fou **N/N-1** → **STORY-032**.
- **Entitlements** : schéma `Entitlement (org × module)`, `PUT`/`DELETE`, upsert idempotent, `GET /entitlements/:orgId` (réconciliation) → **STORY-033**.
- **Événements `entitlement.changed`** (contrat v1, producteur Kafka + transactional outbox) + **auth service-à-service** de l'octroi (décision **C8**) + suspension en cascade `identity.org.suspended` (**C9**) → **STORY-034**.
- **Registre d'artefacts (MinIO/OCI)** : hors périmètre du service (le catalog ne stocke que pointeur + checksum ; le chargement/vérif est chez `bilan-service`, **C3**). Aucun `StorageModule`.
- **Redis** : omis en phase 1 (aucun job interne ; cache JWKS en mémoire via `jwks-rsa`).

### Flux (mise en route)

1. `docker compose up` (racine) démarre `mongo` (rs0), `kafka`, `expert-comptable:3000`, `auth-service:3001`, `kyc-service:3002` **et `platform-catalog-service:3003`**.
2. `GET :3003/api/v1/health` → **200** avec `mongodb: up` **et** `kafka: up` (pas de redis, pas de minio).
3. Un opérateur `PLATFORM_ADMIN` (ou un cabinet `TENANT_ADMIN`) se connecte sur l'IdP (`:3001`) → obtient un **access token RS256** dont l'`aud` contient désormais `platform-catalog-service`.
4. `GET :3003/api/v1/whoami` avec ce token → le service **valide le JWT via JWKS** (clé publique de l'IdP, aucun secret partagé) → **200** échoant `{ sub, org, roles, emailVerified }`.
5. Négatifs : sans token → **401** ; JWT **HS256 forgé** (mêmes claims) → **401** (*algorithm-confusion* écartée) ; RS256 altéré → **401** ; `aud` incorrect → **401**.

---

## Acceptance Criteria

- [ ] **Nouveau projet `platform-catalog-service/`** (NestJS 11 / Node 20), conventions **calquées sur `kyc-service`/`auth-service`** : Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` (Helmet, préfixe `/api/v1`, `ValidationPipe` stricte `whitelist`+`forbidNonWhitelisted`, Swagger « **PROSPERA — Platform Catalog Service** » sur `/api/docs`), logger **pino** (`requestId`), seuils Jest **65/90/90/90**, ESLint **0 warning**. L'app **écoute sur `:3003`**, base Mongo dédiée **`catalog_service`** (`mongodb://mongo:27017/catalog_service?replicaSet=rs0`).
- [ ] **`HealthModule`** : `GET /api/v1/health` = 200 avec `mongodb: up` **et** `kafka: up` (aligné sur `kyc-service` — **pas de redis, pas de minio**).
- [ ] **Socle transverse dupliqué (`common/`)** : `TenantContext` (nestjs-cls), `TenantScopedRepository`, guards `JwtAuthGuard`/`RolesGuard` (+ `EmailVerifiedGuard` disponible), décorateurs `@Public`/`@Roles`/`@CurrentUser`/`@AllowUnverified`, filtres (`all-exceptions`) / intercepteurs (`logging`), enum `Role`, type `AccessTokenPayload`. **Exclus** (inutiles ici) : `KycStatus`, `file-signature.util`, tout `StorageModule`.
- [ ] **`auth/jwt.strategy.ts` — `validate-only`, RS256/JWKS uniquement** (calquée sur `kyc-service` STORY-020) : résolution de clé via `jwks-rsa` (cache + rotation par `kid`), **`algorithms: ['RS256']` imposé** (anti *algorithm-confusion*), `issuer`/`audience` vérifiés. `AUTH_JWKS_URI` / `AUTH_ISSUER` / `AUTH_AUDIENCE` **requis** (le boot échoue s'ils manquent, via `env.validation.ts`) ; **`AUTH_AUDIENCE=platform-catalog-service`**. La stratégie peuple `TenantContext` (`org → tenantId`, `org: null` PLATFORM_ADMIN → `tenantId: null`) et `request.user` (`sub`, `roles`, `emailVerified`). **Aucun endpoint d'authentification, aucun secret de signature, aucune émission de token.**
- [ ] **Endpoint diagnostic gardé** `GET /api/v1/whoami` (protégé par `JwtAuthGuard` global) : renvoie `{ sub, org, roles, emailVerified }` extrait du JWT validé. Sert de **sonde de câblage** du relying party pour la vérification docker ; explicitement **provisoire** (remplacé par les contrôleurs catalogue/entitlements en STORY-032/033). *(Alternative acceptable : réutiliser un endpoint gardé équivalent ; l'essentiel est de pouvoir prouver la validation JWKS de bout en bout sans domaine métier.)*
- [ ] **`KafkaModule` squelette** présent (client `kafkajs`, indicateur `kafka: up` en `/health`), calqué sur `kyc-service`/`auth-service` — **le producteur `entitlement.changed` + le transactional outbox sont explicitement déférés à STORY-034**.
- [ ] **Bloc `platform-catalog-service` ajouté au `docker-compose.yml` racine existant** : `build ./platform-catalog-service` (target `runtime`), `ports '3003:3003'`, env (`AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json`, `AUTH_ISSUER=prospera-auth`, `AUTH_AUDIENCE=platform-catalog-service`, `MONGODB_URI` base `catalog_service`, `KAFKA_BROKERS=kafka:9092`), `depends_on` `mongo`/`kafka` **healthy**, `healthcheck` sur `/api/v1/health`. **Le compose racine n'est pas recréé** (il existe depuis STORY-022). Override hot-reload + `.env.example` fournis.
- [ ] **`platform-catalog-service` ajouté à l'`aud` de l'IdP en dev** : le bloc `auth-service` du compose reçoit `AUTH_AUDIENCE` incluant `platform-catalog-service` (ex. `expert-comptable,kyc-service,platform-catalog-service`) — l'audience est **pilotée par env** (`configuration.ts:124`), **aucun changement de code `auth-service`**. *(Sans cela, un jeton réel de l'IdP n'a pas la bonne `aud` et le service le refuse — cf. §Cas limites.)*
- [ ] **CI** (`.github/workflows/ci.yml`) : matrice `service: [expert-comptable, auth-service, kyc-service, platform-catalog-service]` (lint → tests+couverture → e2e → build image, par service) + base de test `catalog_service_test` + env JWKS de test.
- [ ] **Vérification docker bout-en-bout** : `/health` des **4** apps → 200 (catalog : `mongodb` + `kafka` up, **pas de redis**) ; login IdP (`:3001`) → JWT RS256 dont **`aud` contient `platform-catalog-service`** → `GET :3003/api/v1/whoami` → **200** (`sub`/`org`/`roles`/`emailVerified` échoués) ; **HS256 forgé** ou RS256 altéré → **401** ; sans token → **401**.

---

## Technical Notes

### Arborescence (calquée sur `kyc-service`, sans storage)

```
platform-catalog-service/
├── Dockerfile                     # multi-stage base/build/runtime (copié de kyc-service)
├── .env.example                   # AUTH_JWKS_URI/ISSUER/AUDIENCE, MONGODB_URI (catalog_service), KAFKA_BROKERS, PORT=3003
├── nest-cli.json / tsconfig*.json / eslint.config.mjs / package.json
├── src/
│   ├── main.ts                    # Helmet + /api/v1 + ValidationPipe + Swagger « PROSPERA — Platform Catalog Service »
│   ├── app.module.ts
│   ├── config/                    # env.validation.ts (AUTH_* requis), configuration.ts, logger.config.ts
│   ├── database/                  # database.module.ts (Mongoose → catalog_service)
│   ├── common/                    # socle DUPLIQUÉ : context, database, guards, decorators, filters, interceptors, enums/role
│   ├── auth/jwt.strategy.ts       # RS256/JWKS validate-only (aucun endpoint d'auth)
│   ├── health/                    # /health (mongo + kafka)
│   ├── kafka/                     # client kafkajs — SQUELETTE (santé) ; producteur entitlement.changed = STORY-034
│   └── diagnostics/               # whoami.controller.ts (sonde JWKS gardée, provisoire → STORY-032)
└── test/                          # e2e scaffold (health public, whoami 200/401, HS256 forgé → 401) — JWT RS256 mintés en test
```

> **Pas de `storage/` ni de `redis`** : le catalogue ne détient que des pointeurs d'artefacts (schémas en STORY-032) et n'a aucun job interne en phase 1. **Pas de `modules/`** encore : le domaine (catalogue, entitlements) arrive en STORY-032/033.

### `auth/jwt.strategy.ts` — relying party (copie du patron `kyc-service`)

- `passport-jwt` + `jwks-rsa` (`secretOrKeyProvider`), `algorithms: ['RS256']`, `issuer`, `audience: 'platform-catalog-service'`. `validate(payload)` mappe `org → tenantId` (peuple `TenantContext`) et expose `{ userId: sub, roles, emailVerified }`. **`org: null`** (PLATFORM_ADMIN) → `tenantId: null` (l'admin plateforme n'appartient à aucune org ; nécessaire pour le futur admin catalogue STORY-032).
- Env requis (`env.validation.ts`) : `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE`. **Pas** de `JWT_ACCESS_SECRET`, **pas** d'`AUTH_MODE` (RS256/JWKS-only dès l'origine — le service naît après le cutover, aucune dette HS256, comme `kyc-service`).
- **Rôles** attendus dans le JWT : le socle `Role` existe déjà (`PLATFORM_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`). Aucun endpoint n'applique encore `@Roles` en STORY-031 (l'admin catalogue arrive en STORY-032) ; le décorateur et `RolesGuard` sont néanmoins câblés.

### Bloc compose (à ajouter, calqué sur `kyc-service`)

```yaml
  platform-catalog-service:
    build: { context: ./platform-catalog-service, target: runtime }
    env_file: ./platform-catalog-service/.env
    environment:
      AUTH_JWKS_URI: ${AUTH_JWKS_URI:-http://auth-service:3001/.well-known/jwks.json}
      AUTH_ISSUER:   ${AUTH_ISSUER:-prospera-auth}
      AUTH_AUDIENCE: ${CATALOG_AUTH_AUDIENCE:-platform-catalog-service}
      MONGODB_URI:   ${CATALOG_MONGODB_URI:-mongodb://mongo:27017/catalog_service?replicaSet=rs0}
      KAFKA_BROKERS: ${CATALOG_KAFKA_BROKERS:-kafka:9092}
    ports: ['3003:3003']
    depends_on:
      mongo: { condition: service_healthy }
      kafka: { condition: service_healthy }
    healthcheck: { test: [...'http://localhost:3003/api/v1/health'...], interval: 10s, retries: 5, start_period: 20s }
    restart: unless-stopped
```

Et sur le bloc **`auth-service`** existant (env, pas de code) :

```yaml
    environment:
      AUTH_AUDIENCE: ${AUTH_AUDIENCE:-expert-comptable,kyc-service,platform-catalog-service}
```

### Cas limites / points d'attention

- **⚠️ `aud` de l'IdP.** Par défaut `auth-service` émet `aud: ['expert-comptable', 'kyc-service']` (`configuration.ts:124`). Un jeton réel n'a donc **pas** `platform-catalog-service` dans son `aud` → le service le **refuserait** (401) tant que l'IdP n'est pas configuré. Correctif : **piloter `AUTH_AUDIENCE` par env** sur le bloc `auth-service` du compose pour y **ajouter** `platform-catalog-service` (aucun changement de code). Les e2e du service, eux, **mintent leurs propres tokens RS256** (paire de clés de test) avec la bonne `aud`, donc restent indépendants de l'IdP.
- **Sécurité** : le service ne peut pas vérifier l'existence réelle de l'org — l'`org`/`sub` **signés** font foi (relying party pur). La cohérence catalogue/entitlement et l'anti-énumération (404) arrivent avec le domaine (STORY-032/033).
- **Duplication du socle** (K4/C6) : `common/` et `jwt.strategy` sont copiés de `kyc-service` ; on factorisera en lib partagée au prochain usage. L'architecture et les enums communs limitent la dérive.
- **Endpoint `whoami` provisoire** : présent uniquement pour rendre la validation JWKS **vérifiable en isolation** sans domaine. STORY-032 le remplace par `CatalogAdminController`/`CatalogReadController` ; il peut être retiré ou passé `@Public` off à ce moment.
- **`KafkaModule` squelette seulement** : le client se connecte et alimente `kafka: up`, mais **ne produit rien**. Le contrat `entitlement.changed` v1 (source de vérité = `architecture-catalog-service-2026-07-07.md` §Contrat d'événements) est **implémenté en STORY-034**, avec transactional outbox (patron STORY-021/027).
- **Pas de perte de données** : ajout d'une base logique `catalog_service` sur l'instance `mongo` existante (database-per-service) — transparent pour les autres services.

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-022** — compose racine + Kafka (KRaft) : on **ajoute** le service, on ne recrée pas l'infra.
- **STORY-024** — RS256/JWKS émis par l'IdP (endpoint `/.well-known/jwks.json`) que le catalog consomme.
- **STORY-020 / STORY-028 / STORY-030** — patron `JwtStrategy` RS256/JWKS-*only* + socle `common/` d'un *relying party* = **source à cloner** (`kyc-service` est le plus proche : pas d'e-mail, pas de mot de passe).

**Point à traiter dans cette story (pas un blocage externe) :**
- **`aud` de l'IdP** : par défaut `expert-comptable,kyc-service` (`auth-service/src/config/configuration.ts:124`) → **ajouter** `platform-catalog-service` via `AUTH_AUDIENCE` (env, compose). Aucun changement de code `auth-service`.

**Stories débloquées / à suivre (EPIC-007, sprint 7) :**
- **STORY-032** — catalogue `Module`/`ModuleVersion`/`ReferentielVersion` + admin CRUD (`PLATFORM_ADMIN`) + garde-fou N/N-1.
- **STORY-033** — entitlements `(org × module)` + grant/update/revoke + `GET` réconciliation.
- **STORY-034** — événements `entitlement.changed` (producteur Kafka + outbox) + auth service-à-service (décision C8).

**Dépendances externes :** Mongo + Kafka (déjà présents dans le compose racine). **Aucun** MinIO, **aucun** Redis pour ce service.

---

## Definition of Done

- [ ] Code implémenté sur une branche **`MNV-031`** (convention 2026-07-10 : une branche par story, préfixe `MNV-0XX`).
- [ ] Tests unitaires écrits et **verts**, couverture ≥ seuils **65/90/90/90** :
  - [ ] `jwt.strategy` (mapping `org→tenantId`, `org:null→null`, `roles`, `emailVerified` ; rejet `alg` ≠ RS256).
  - [ ] `env.validation` (boot échoue si `AUTH_JWKS_URI`/`ISSUER`/`AUDIENCE` manquants).
  - [ ] `health` (mongo + kafka indicateurs).
- [ ] Tests **e2e** verts dans `platform-catalog-service/test/` : `/health` public 200 ; `whoami` **200** (RS256 valide minté en test) / **401** sans token / **401** HS256 forgé / **401** RS256 altéré / **401** `aud` incorrect.
- [ ] **ESLint 0 warning**, build image Docker OK (**4 services** en CI verte).
- [ ] **Vérification docker bout-en-bout** (dernier AC) réalisée et journalisée dans « Revue & validation ».
- [ ] `auth-service` toujours vert (seule modification : `AUTH_AUDIENCE` par env dans le compose — pas de code).
- [ ] `/code-review` (niveau ≥ high) passée ; constats traités ou tracés.
- [ ] Story mise à jour (statut) dans `docs/sprint-status.yaml` ; **dépôt git `platform-catalog-service` à initialiser** (1ᵉʳ push) selon la convention repos MoneyVibesGroup ; commit/push/merge `dev` **sur demande / après validation**.

---

## Story Points Breakdown

- **Scaffold projet + conventions + Dockerfile + `main.ts` + `HealthModule` (mongo+kafka) + base `catalog_service` :** 1,5 point
- **Socle `common/` dupliqué + `jwt.strategy` RS256/JWKS + endpoint diagnostic `whoami` gardé :** 1 point
- **`KafkaModule` squelette + bloc compose + `aud` IdP + CI matrice 4 services + `.env.example` + vérif docker :** 0,5 point
- **Total : 3 points**

**Rationale :** aucune logique métier (le domaine arrive en STORY-032/033/034) ; l'essentiel est la **duplication disciplinée** d'un socle éprouvé (`kyc-service`) + le **câblage JWKS** vérifiable + l'**insertion propre** dans le compose/CI. Plus léger que STORY-020 (8 pts) qui portait en plus une migration de domaine (KYC) et MinIO. Cohérent avec l'estimation sprint-plan (3 pts, tête d'EPIC-007).

---

## Additional Notes

- **Nommage** : dossier et service compose = `platform-catalog-service` (renommage **NC-1**) ; base Mongo = `catalog_service` (l'architecture v1.0 précède le renommage et écrit encore « catalog-service » — le **nom de service** fait foi côté PLAN FINAL). `AUTH_AUDIENCE = platform-catalog-service`.
- **`tenantId` vs `orgId`** : le socle dupliqué conserve `tenantId` (= `orgId`, claim JWT `org`) pour ne pas diverger de `kyc-service`/EC.
- **Réf. contrat d'événements** : la source de vérité de `entitlement.changed` (v1) est `architecture-catalog-service-2026-07-07.md` §Contrat d'événements — **implémenté en STORY-034**, pas ici.
- **Ordre EPIC-007** : STORY-031 (scaffold) → 032 (catalogue) → 033 (entitlements) → 034 (événements). STORY-031 ne débloque le reste qu'une fois **vérifiée en isolation**.

---

## Progress Tracking

**Historique des statuts :**
- 2026-07-13 : Créée par vivian (BMAD Scrum Master — `/bmad:create-story`).
- 2026-07-13 : Implémentée + vérifiée docker bout-en-bout par Claude (BMAD dev-story). ✅ Done.

**Effort réel :** 3 points (conforme à l'estimation).

---

## Revue & validation (2026-07-13)

**Livré**
- **Nouveau service `platform-catalog-service/`** calqué sur `kyc-service` : Dockerfile multi-stage (`base`/`build`/`runtime`), `main.ts` (Helmet + `/api/v1` + `ValidationPipe` stricte + Swagger « PROSPERA — Platform Catalog Service »), logger pino, seuils Jest 65/90/90/90, ESLint 0. Écoute `:3003`, base dédiée `catalog_service`.
- **Socle `common/` dupliqué** (context cls, `TenantScopedRepository`, guards `Jwt`/`EmailVerified`/`Roles`, décorateurs `@Public`/`@Roles`/`@CurrentUser`/`@AllowUnverified`, filtre/intercepteur, enum `Role`, `AccessTokenPayload`) — **sans** `KycStatus`, `file-signature`, ni `StorageModule`. `auth/jwt.strategy.ts` **RS256/JWKS validate-only** (`jwks-rsa`, `algorithms:['RS256']`, `iss`/`aud` requis, `AUTH_AUDIENCE=platform-catalog-service`). `AuthModule` sans contrôleur.
- **`KafkaModule` squelette** (client kafkajs + producteur réutilisable + indicateur santé) — **aucune publication** ; le topic `entitlement.changed` + outbox = STORY-034. `HealthModule` = mongo + kafka (ni Redis, ni MinIO).
- **`DiagnosticsModule`** : `GET /api/v1/whoami` gardé (`@AllowUnverified`), écho `{ sub, org, role, emailVerified }` — sonde du câblage relying party, provisoire (→ STORY-032).
- **Compose racine** : bloc `platform-catalog-service` **ajouté** (`:3003`, base `catalog_service`, depends_on mongo+kafka healthy, healthcheck `/api/v1/health`) + override hot-reload + `.env`/`.env.example`. Bloc `auth-service` : `AUTH_AUDIENCE` piloté par env pour **stamper `platform-catalog-service`** dans l'`aud` émis (aucun changement de code auth-service). **CI** en matrice `[expert-comptable, auth-service, kyc-service, platform-catalog-service]` (+ base de test `catalog_service_test`).

**Tests**
- `platform-catalog-service` : **lint 0**, build OK, **74 unit (15 suites) + 8 e2e (2 suites)** verts, couverture **99.65 / 83.11 / 100 / 99.61** (≫ 65/90/90/90).
- e2e `whoami` : RS256 valide (TENANT_ADMIN / PLATFORM_ADMIN) → 200 + contexte ; e-mail non vérifié → 200 (`@AllowUnverified`) ; sans jeton → 401 ; **HS256 forgé → 401** ; **audience incorrecte → 401**. e2e `health` : mongo+kafka up.

**Vérification docker bout-en-bout** (stack racine dev : `auth-service:3001`, `platform-catalog-service:3003`, `mongo` rs0, `kafka` KRaft, `redis`, `mailhog`) :
- `/health` des apps → 200 (catalog : `mongodb` + `kafka` up, **pas de redis**).
- login PLATFORM_ADMIN (IdP `:3001`) → **JWT RS256** décodé : `alg RS256`+`kid`, `roles:[PLATFORM_ADMIN]`, `org:null`, `iss:prospera-auth`, **`aud:[expert-comptable, kyc-service, platform-catalog-service]`** (l'override d'`AUTH_AUDIENCE` de l'IdP prend effet).
- `GET :3003/api/v1/whoami` (même token) → **200** `{sub, org:null, role:PLATFORM_ADMIN, emailVerified:true}` (validation JWKS cross-service prouvée).
- Négatifs sur le service réel : sans token → **401** ; **HS256 forgé** (mêmes claims, kid valide, secret attaquant) → **401** (algorithm-confusion écartée).

**Écarts / suites**
- **Quirk d'environnement (non bloquant)** : sur Docker Desktop, l'image `runtime` construite avec attestations (provenance/SBOM par défaut) se résout sans `dist` au run local — le **stage `build` produit bien `dist`** et un build `--provenance=false` le confirme. Sans impact : le stack tourne via le **compose override** (target `base`, `start:dev`, source montée — `dist` inutile), et la CI construit l'image `runtime` sur Linux (hors quirk).
- **Poussé le 2026-07-13** sur `MoneyVibesGroup/prospera-platform-catalog-service` (Write accordé par l'user) : branches **`dev`** + **`MNV-031`** (commits ré-attribués à `vivianMoneyVibesGroupes`, credential helper gh). Garde-fou distant OK : `.env` → 404, `.env.example` présent (63 fichiers).
- **Reste** : `/code-review` formel (niveau ≥ high) ; **STORY-032** (catalogue) à enchaîner.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
*Prochaine étape : STORY-032 (catalogue `Module`/`ModuleVersion`/`ReferentielVersion` + admin CRUD).*
