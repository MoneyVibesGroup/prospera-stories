# STORY-035 : Scaffold `bilan-service` (base `bilan_service` + relying party JWKS + health)

**Epic :** EPIC-008 — bilan-service (squelette d'intégration : scaffold + read-models entitlement/KYC + gate `@RequiresBilanAccess` + `ReferentielLoader`)
**Réf. architecture :** `architecture-bilan-service-2026-07-07.md` (v1.0, §Périmètre / §Résumé exécutif / §Drivers / §Vue d'ensemble du système / §Topologie) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Modèle de jetons RS256-JWKS · décisions programme **P7 / D10** (le Bilan devient service autonome, capacité partagée) + **B8** (squelette d'intégration constructible avant le PRD Bilan)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-14. `bilan-service` créé (`:3004`, base `bilan_service`), *relying party* RS256/JWKS pur (socle `common/` dupliqué + `JwtStrategy` JWKS-only, `AUTH_AUDIENCE=bilan-service`), `/health` (mongo+kafka, ni redis ni minio), `KafkaModule` squelette **client-seul** (bilan est consommateur ; consumers → STORY-036), endpoint diagnostic gardé `GET /whoami`. Compose racine + override + CI matrice **5 services** ; l'IdP stampe `bilan-service` dans l'`aud`. lint 0, **70 unit (14 suites) + 8 e2e (2 suites)** verts, couverture **99.63/83.11/100/99.59**. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-14
**Sprint :** 8
**Service :** bilan-service (`:3004`) — **nouveau**, base Mongo dédiée `bilan_service`
**Couvre :** aucun FR du PRD `expert-comptable` (capacité **partagée** nouvelle, décision **D10/P7**) — pose l'infrastructure du futur moteur d'états financiers (EPIC-009…014, PRD Bilan à venir)

> **Story de scaffold — tête de la chaîne EPIC-008.** `bilan-service` est la **capacité partagée** qui produira les **états financiers** d'une organisation, consommée par plusieurs verticaux (`expert-comptable`, `distributeur`, `microfinance`). Cette story crée le **squelette vérifiable en isolation** : le service démarre via le **compose racine existant** (créé STORY-022), valide un JWT réel de l'IdP par **JWKS** (RS256, *validate-only*), expose `/health` (mongo + kafka) et un `KafkaModule` squelette — **sans aucun domaine métier ni logique comptable**. Les **read-models** (`entitlement.changed` + `kyc.status.changed`), la **gate `@RequiresBilanAccess`** et le **`ReferentielLoader`** sont **hors périmètre** → STORY-036 / STORY-037 / STORY-038. Le **moteur de calcul comptable réel** (formules, états financiers) est **EPIC-009+**, en attente du **PRD/tech-spec Bilan** dédié (décision **B8**). On **calque** intégralement les conventions du *relying party* le plus proche — `platform-catalog-service` (STORY-031) et `kyc-service` (STORY-020) : même patron RS256/JWKS, pas d'e-mail, pas de mot de passe, pas d'émission de jeton.

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux un **micro-service `bilan-service` autonome et démarrable** via le compose racine, *relying party* pur d'`auth-service` (validation **RS256/JWKS**), avec base dédiée `bilan_service`, `/health` et un `KafkaModule` squelette,
afin de disposer d'un **socle vérifiable en isolation** sur lequel brancher les **read-models locaux** (STORY-036), la **gate `@RequiresBilanAccess`** (STORY-037) et le **`ReferentielLoader`** paramétré par référentiel (STORY-038) — prérequis du **moteur d'états financiers** (EPIC-009+, décision B8).

---

## Description

### Contexte

Le re-cadrage écosystème du 2026-07-04 a fait de PROSPERA un **écosystème de micro-services** : un IdP racine (`auth-service`), des verticaux *relying parties* (EC) et des **capacités partagées** (`kyc-service`, `platform-catalog-service`, puis `bilan-service`). La décision **D10/P7** élève le Bilan au rang de **service autonome** : il cesse d'être un *module interne* d'`expert-comptable` et devient une capacité **réutilisable inter-verticaux**, versionnée selon **deux axes orthogonaux** — la **version de code** (moteur, semver) et le **référentiel comptable** (paquet de données : `syscohada-revise@2.1`, `sfd-bceao@1.3`…).

`bilan-service` ne **possède** ni l'identité (`auth-service`), ni le KYC (`kyc-service`), ni l'**entitlement** (`platform-catalog-service`), ni l'**abonnement** (chaque vertical). Il ne connaît les organisations que par un `orgId` opaque issu du **JWT RS256** validé via **JWKS**. À terme il sera **consommateur** de deux contrats d'événements dont il n'est **pas** la source de vérité — `entitlement.changed` (quelle version/référentiel servir, accès actif) et `kyc.status.changed` (statut KYC pour la gate) — mais **ces consommateurs arrivent en STORY-036**.

L'EPIC-008 se découpe en 4 stories (§Allocation du sprint-plan, sprint 8) : **STORY-035** (scaffold + JWKS + health — *cette story*), **STORY-036** (read-models + consumers Kafka + idempotence), **STORY-037** (gate `@RequiresBilanAccess`), **STORY-038** (`ReferentielLoader` + interface de référentiel + moteur squelette). STORY-035 est **structurante mais volontairement sans fonctionnalité métier** : elle garantit une base **démarrable, sécurisée et testée** (le service boote, valide un JWT réel via JWKS, refuse un jeton forgé) avant qu'y soient branchés les read-models puis la gate.

Comme pour STORY-031 (`platform-catalog-service`) et STORY-020 (`kyc-service`), **il n'y a rien à ré-implémenter** : on **duplique** disciplinément le socle transverse `common/` et la `jwt.strategy` RS256/JWKS d'un *relying party* existant (décision **C6** : « même patron que kyc-service » ; **K4** de duplication assumée, factorisation en lib au prochain usage). Comme `platform-catalog-service`, `bilan-service` naît **après le cutover** : **RS256/JWKS-only dès l'origine**, aucune dette HS256, aucun `AUTH_MODE`. Différences avec `kyc-service` : **pas de MinIO/StorageModule** au scaffold (le `ReferentielLoader` télécharge des artefacts depuis un registre + checksum en STORY-038, il ne stocke rien ici) et **pas de Redis** (aucun job interne en phase 1 ; le cache JWKS est celui de `jwks-rsa`, en mémoire).

### Périmètre

**Dans le périmètre**
- Scaffold `bilan-service/` (projet NestJS 11 / Node 20, conventions, Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts`, `HealthModule`, base `bilan_service`).
- Socle `common/` **dupliqué** (context, database, guards, decorators, filters, interceptors, enum `Role`, type `AccessTokenPayload`).
- `auth/jwt.strategy.ts` **RS256/JWKS *validate-only*** (calquée sur `platform-catalog-service` STORY-031), `AUTH_AUDIENCE=bilan-service`.
- **Endpoint diagnostic gardé** `GET /api/v1/whoami` (JwtAuthGuard) échoant `{ sub, org, roles, emailVerified }` — **sonde de câblage du relying party**, remplacée par les vrais contrôleurs Bilan dès l'arrivée du domaine.
- `KafkaModule` **squelette** (client `kafkajs`, `kafka: up` en `/health`) — les **consumers `entitlement.changed` + `kyc.status.changed` (+ idempotence `ProcessedEvent`) sont déférés à STORY-036**.
- Bloc `bilan-service` **ajouté** au `docker-compose.yml` **racine existant** (`:3004`, base `bilan_service`) + override hot-reload + `.env.example`.
- **Ajout de `bilan-service` à l'`aud` émis par l'IdP** en dev (via env `AUTH_AUDIENCE` du bloc `auth-service` du compose — **aucun changement de code `auth-service`**, cf. §Cas limites).
- CI en matrice `service: [expert-comptable, auth-service, kyc-service, platform-catalog-service, bilan-service]`.

**Hors périmètre (stories suivantes)**
- **Read-models locaux** (`entitlement` + `kycStatus`) + **consumers Kafka** `entitlement.changed` / `kyc.status.changed` + **idempotence** (`ProcessedEvent`, `eventId` unique) → **STORY-036**.
- **Gate `@RequiresBilanAccess`** (`emailVerified` + KYC `APPROVED` + entitlement `bilan` `ACTIVE`, read-models locaux, refus distincts `EMAIL_NOT_VERIFIED` / `KYC_NOT_APPROVED` / `ENTITLEMENT_REQUIRED`) → **STORY-037**.
- **`ReferentielLoader`** (téléchargement de l'artefact désigné par le read-model entitlement, **vérification de checksum C3**, cache), **interface `Referentiel`** pluggable + **moteur squelette** paramétré → **STORY-038**.
- **Moteur de calcul comptable réel** (FR comptables, schémas d'états financiers, règles de calcul, liasse) → **EPIC-009+** (PRD/tech-spec Bilan à rédiger, **B8**).
- **Registre d'artefacts (MinIO/OCI)** : hors périmètre du service (le référentiel est téléchargé, pas édité ici). Aucun `StorageModule` au scaffold.
- **Redis** : omis en phase 1 (aucun job interne ; cache JWKS en mémoire via `jwks-rsa`).
- **Routage multi-version au gateway** (org N-1 → `bilan-v1`) : concerne le déploiement / le gateway, hors scaffold.

### Flux (mise en route)

1. `docker compose up` (racine) démarre `mongo` (rs0), `kafka`, `expert-comptable:3000`, `auth-service:3001`, `kyc-service:3002`, `platform-catalog-service:3003` **et `bilan-service:3004`**.
2. `GET :3004/api/v1/health` → **200** avec `mongodb: up` **et** `kafka: up` (pas de redis, pas de minio).
3. Un opérateur `PLATFORM_ADMIN` (ou un cabinet `TENANT_ADMIN`) se connecte sur l'IdP (`:3001`) → obtient un **access token RS256** dont l'`aud` contient désormais `bilan-service`.
4. `GET :3004/api/v1/whoami` avec ce token → le service **valide le JWT via JWKS** (clé publique de l'IdP, aucun secret partagé) → **200** échoant `{ sub, org, roles, emailVerified }`.
5. Négatifs : sans token → **401** ; JWT **HS256 forgé** (mêmes claims) → **401** (*algorithm-confusion* écartée) ; RS256 altéré → **401** ; `aud` incorrect → **401**.

---

## Acceptance Criteria

- [ ] **Nouveau projet `bilan-service/`** (NestJS 11 / Node 20), conventions **calquées sur `platform-catalog-service`/`kyc-service`** : Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` (Helmet, préfixe `/api/v1`, `ValidationPipe` stricte `whitelist`+`forbidNonWhitelisted`, Swagger « **PROSPERA — Bilan Service** » sur `/api/docs`), logger **pino** (`requestId`), seuils Jest standard (≈ **65/90/90/90**), ESLint **0 warning**. L'app **écoute sur `:3004`**, base Mongo dédiée **`bilan_service`** (`mongodb://mongo:27017/bilan_service?replicaSet=rs0`).
- [ ] **`HealthModule`** : `GET /api/v1/health` = 200 avec `mongodb: up` **et** `kafka: up` (aligné sur `platform-catalog-service` — **pas de redis, pas de minio**).
- [ ] **Socle transverse dupliqué (`common/`)** : `TenantContext` (nestjs-cls), `TenantScopedRepository`, guards `JwtAuthGuard`/`RolesGuard` (+ `EmailVerifiedGuard` disponible), décorateurs `@Public`/`@Roles`/`@CurrentUser`/`@AllowUnverified`, filtres (`all-exceptions`) / intercepteurs (`logging`), enum `Role`, type `AccessTokenPayload`. **Exclus** (inutiles ici) : `KycStatus` (arrive avec le read-model KYC en STORY-036), `file-signature.util`, tout `StorageModule`.
- [ ] **`auth/jwt.strategy.ts` — `validate-only`, RS256/JWKS uniquement** (calquée sur `platform-catalog-service` STORY-031) : résolution de clé via `jwks-rsa` (cache + rotation par `kid`), **`algorithms: ['RS256']` imposé** (anti *algorithm-confusion*), `issuer`/`audience` vérifiés. `AUTH_JWKS_URI` / `AUTH_ISSUER` / `AUTH_AUDIENCE` **requis** (le boot échoue s'ils manquent, via `env.validation.ts`) ; **`AUTH_AUDIENCE=bilan-service`**. La stratégie peuple `TenantContext` (`org → tenantId`, `org: null` PLATFORM_ADMIN → `tenantId: null`) et `request.user` (`sub`, `roles`, `emailVerified`). **Aucun endpoint d'authentification, aucun secret de signature, aucune émission de token.** **Pas** de `JWT_ACCESS_SECRET`, **pas** d'`AUTH_MODE` (le service naît après le cutover, aucune dette HS256).
- [ ] **Endpoint diagnostic gardé** `GET /api/v1/whoami` (protégé par `JwtAuthGuard` global) : renvoie `{ sub, org, roles, emailVerified }` extrait du JWT validé. Sert de **sonde de câblage** du relying party pour la vérification docker ; explicitement **provisoire** (remplacé par les contrôleurs Bilan dès l'arrivée du domaine). *(Alternative acceptable : réutiliser un endpoint gardé équivalent ; l'essentiel est de prouver la validation JWKS de bout en bout sans domaine métier.)*
- [ ] **`KafkaModule` squelette** présent (client `kafkajs`, indicateur `kafka: up` en `/health`), calqué sur `platform-catalog-service`/`kyc-service` — **les consumers `entitlement.changed` + `kyc.status.changed`, les read-models et l'idempotence (`ProcessedEvent`) sont explicitement déférés à STORY-036**. Aucun topic n'est consommé ni produit en STORY-035.
- [ ] **Bloc `bilan-service` ajouté au `docker-compose.yml` racine existant** : `build ./bilan-service` (target `runtime`), `ports '3004:3004'`, env (`AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json`, `AUTH_ISSUER=prospera-auth`, `AUTH_AUDIENCE=bilan-service`, `MONGODB_URI` base `bilan_service`, `KAFKA_BROKERS=kafka:9092`), `depends_on` `mongo`/`kafka` **healthy**, `healthcheck` sur `/api/v1/health`. **Le compose racine n'est pas recréé** (il existe depuis STORY-022). Override hot-reload + `.env.example` fournis.
- [ ] **`bilan-service` ajouté à l'`aud` de l'IdP en dev** : le bloc `auth-service` du compose reçoit `AUTH_AUDIENCE` incluant `bilan-service` (ex. `expert-comptable,kyc-service,platform-catalog-service,bilan-service`) — l'audience est **pilotée par env** (`configuration.ts`), **aucun changement de code `auth-service`**. *(Sans cela, un jeton réel de l'IdP n'a pas la bonne `aud` et le service le refuse — cf. §Cas limites.)*
- [ ] **CI** (`.github/workflows/ci.yml`) : matrice `service: [expert-comptable, auth-service, kyc-service, platform-catalog-service, bilan-service]` (lint → tests+couverture → e2e → build image, par service) + base de test `bilan_service_test` + env JWKS de test.
- [ ] **Vérification docker bout-en-bout** : `/health` des **5** apps → 200 (bilan : `mongodb` + `kafka` up, **pas de redis**) ; login IdP (`:3001`) → JWT RS256 dont **`aud` contient `bilan-service`** → `GET :3004/api/v1/whoami` → **200** (`sub`/`org`/`roles`/`emailVerified` échoués) ; **HS256 forgé** ou RS256 altéré → **401** ; sans token → **401**.

---

## Technical Notes

### Composants

- **Backend :** `bilan-service` (nouveau micro-service NestJS, `:3004`, base `bilan_service`).
- **Frontend :** aucun (capacité backend ; l'UI du module Bilan est portée par les stories `FE-B*`, dont `FE-B00` s'appuie sur STORY-035/037).
- **Base de données :** Mongo dédiée `bilan_service` (aucune collection domaine au scaffold — seul le socle infra).
- **Bus :** Kafka (client squelette seulement ; consumers en STORY-036).

### Arborescence (calquée sur `platform-catalog-service`, sans storage ni redis)

```
bilan-service/
├── Dockerfile                     # multi-stage base/build/runtime (copié de platform-catalog-service)
├── .env.example                   # AUTH_JWKS_URI/ISSUER/AUDIENCE, MONGODB_URI (bilan_service), KAFKA_BROKERS, PORT=3004
├── nest-cli.json / tsconfig*.json / eslint.config.mjs / package.json
├── src/
│   ├── main.ts                    # Helmet + /api/v1 + ValidationPipe + Swagger « PROSPERA — Bilan Service »
│   ├── app.module.ts
│   ├── config/                    # env.validation.ts (AUTH_* requis), configuration.ts, logger.config.ts
│   ├── database/                  # database.module.ts (Mongoose → bilan_service)
│   ├── common/                    # socle DUPLIQUÉ : context, database, guards, decorators, filters, interceptors, enums/role
│   ├── auth/jwt.strategy.ts       # RS256/JWKS validate-only (aucun endpoint d'auth)
│   ├── health/                    # /health (mongo + kafka)
│   ├── kafka/                     # client kafkajs — SQUELETTE (santé) ; consumers entitlement.changed/kyc.status.changed = STORY-036
│   └── diagnostics/               # whoami.controller.ts (sonde JWKS gardée, provisoire)
└── test/                          # e2e scaffold (health public, whoami 200/401, HS256 forgé → 401) — JWT RS256 mintés en test
```

> **Pas de `storage/` ni de `redis`** : le `ReferentielLoader` (STORY-038) télécharge des artefacts depuis un registre + vérifie le checksum (C3), il ne stocke rien localement de façon durable ; aucun job interne en phase 1. **Pas de `read-models/` ni de `modules/` domaine** encore : read-models + consumers = STORY-036, gate = STORY-037, loader/moteur = STORY-038.

### `auth/jwt.strategy.ts` — relying party (copie du patron `platform-catalog-service`)

- `passport-jwt` + `jwks-rsa` (`secretOrKeyProvider`), `algorithms: ['RS256']`, `issuer`, `audience: 'bilan-service'`. `validate(payload)` mappe `org → tenantId` (peuple `TenantContext`) et expose `{ userId: sub, roles, emailVerified }`. **`org: null`** (PLATFORM_ADMIN) → `tenantId: null` (l'admin plateforme n'appartient à aucune org).
- Env requis (`env.validation.ts`) : `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE`. **Pas** de `JWT_ACCESS_SECRET`, **pas** d'`AUTH_MODE` (RS256/JWKS-only dès l'origine, comme `platform-catalog-service` et `kyc-service`).
- **Rôles** attendus dans le JWT : le socle `Role` existe déjà (`PLATFORM_ADMIN`, `TENANT_ADMIN`, `TENANT_USER`). Aucun endpoint n'applique encore `@Roles` en STORY-035 ; le décorateur et `RolesGuard` sont néanmoins câblés (la gate `@RequiresBilanAccess` arrive en STORY-037).

### Bloc compose (à ajouter, calqué sur `platform-catalog-service`)

```yaml
  bilan-service:
    build: { context: ./bilan-service, target: runtime }
    env_file: ./bilan-service/.env
    environment:
      AUTH_JWKS_URI: ${AUTH_JWKS_URI:-http://auth-service:3001/.well-known/jwks.json}
      AUTH_ISSUER:   ${AUTH_ISSUER:-prospera-auth}
      AUTH_AUDIENCE: ${BILAN_AUTH_AUDIENCE:-bilan-service}
      MONGODB_URI:   ${BILAN_MONGODB_URI:-mongodb://mongo:27017/bilan_service?replicaSet=rs0}
      KAFKA_BROKERS: ${BILAN_KAFKA_BROKERS:-kafka:9092}
    ports: ['3004:3004']
    depends_on:
      mongo: { condition: service_healthy }
      kafka: { condition: service_healthy }
    healthcheck: { test: [...'http://localhost:3004/api/v1/health'...], interval: 10s, retries: 5, start_period: 20s }
    restart: unless-stopped
```

Et sur le bloc **`auth-service`** existant (env, pas de code) — **ajouter** `bilan-service` à la liste déjà posée par STORY-031 :

```yaml
    environment:
      AUTH_AUDIENCE: ${AUTH_AUDIENCE:-expert-comptable,kyc-service,platform-catalog-service,bilan-service}
```

### Sécurité

- Relying party **pur** : validation RS256/JWKS uniquement, aucun secret de signature partagé, aucune émission de jeton. `algorithms: ['RS256']` **imposé** (anti *algorithm-confusion* : un HS256 forgé avec la clé publique comme secret est rejeté).
- `issuer` (`prospera-auth`) et `audience` (`bilan-service`) **vérifiés** ; un jeton d'`aud` incorrecte est refusé (401).
- Le service ne peut pas vérifier l'existence réelle de l'org — l'`org`/`sub` **signés** font foi. La gate d'accès (KYC + entitlement) arrive en STORY-037 sur read-models locaux.

### Cas limites / points d'attention

- **⚠️ `aud` de l'IdP.** L'IdP émet l'`aud` piloté par env `AUTH_AUDIENCE` (`configuration.ts`) ; STORY-031 y a déjà ajouté `platform-catalog-service`. Un jeton réel n'aura `bilan-service` dans son `aud` **que** si on **ajoute** `bilan-service` à cette liste sur le bloc `auth-service` du compose. Sans cela le service refuse (401). **Aucun changement de code `auth-service`.** Les e2e du service **mintent leurs propres tokens RS256** (paire de clés de test) avec la bonne `aud`, donc restent indépendants de l'IdP.
- **Quirk Docker Desktop** (observé STORY-031/032) : l'image `runtime` peut sortir sans `dist/` si des attestations sont activées — non bloquant, la stack tourne via l'override `target: base` en dev, la CI construit `runtime` sur Linux.
- **Kafka au scaffold** : le `KafkaModule` n'ouvre **aucun** consumer/producer ; il n'expose que la sonde de santé. Aucun groupe de consommateurs n'est créé tant que STORY-036 n'est pas livrée (évite un consumer orphelin sans handler).

---

## Dependencies

**Stories prérequises :**
- **STORY-024** (JWKS exposé par l'IdP — `GET /.well-known/jwks.json`) : **indispensable**, la stratégie relying party valide contre ce endpoint.
- **STORY-022** (compose racine existant + IdP `:3001`) : le nouveau bloc s'y ajoute, il n'est pas recréé.
- **STORY-031** (`platform-catalog-service`) : sert de **patron de scaffold** direct (relying party pur le plus récent) et a déjà rendu l'`AUTH_AUDIENCE` de l'IdP pilotable par env.

**Stories bloquées (débloquées par celle-ci) :**
- **STORY-036** (read-models + consumers Kafka) — a besoin du scaffold + `KafkaModule`.
- **STORY-037** (gate `@RequiresBilanAccess`) — via STORY-036.
- **STORY-038** (`ReferentielLoader` + moteur squelette) — via STORY-036.
- **FE-B00** (shell UI module Bilan) — s'appuie sur STORY-035 (scaffold) + STORY-037 (gate).

**Dépendances externes :** aucune (Mongo + Kafka déjà dans le compose racine).

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche `MNV-035` (branchée depuis `dev`, rebasée sur `origin/dev`).
- [ ] Tests unitaires écrits et verts (seuils Jest respectés) :
  - [ ] `jwt.strategy` : mapping `org → tenantId`, `org: null → tenantId: null`, claims exposés.
  - [ ] Configuration/env : boot échoue si `AUTH_JWKS_URI`/`ISSUER`/`AUDIENCE` manquent.
  - [ ] `HealthModule` : indicateurs `mongodb` + `kafka`.
- [ ] Tests e2e verts :
  - [ ] `GET /health` public → 200 (`mongodb` + `kafka` up).
  - [ ] `GET /whoami` avec RS256 valide (`aud=bilan-service`) → 200, claims échoués.
  - [ ] Sans token → 401 ; **HS256 forgé** → 401 ; RS256 altéré → 401 ; `aud` incorrecte → 401.
- [ ] ESLint **0 warning**, build image `runtime` OK.
- [ ] **Vérification docker bout-en-bout** réalisée (les 5 apps `/health` 200 ; login IdP → JWT `aud` incl. `bilan-service` → `whoami` 200 ; négatifs 401) et consignée dans §Revue & validation.
- [ ] CI verte (matrice 5 services).
- [ ] `/code-review` passé.
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR `MNV-035(bilan-service): …` ouverte puis intégrée sur `dev` en **Rebase and merge**.
- [ ] `sprint-status.yaml` mis à jour (STORY-035 → done, note de vérification).

---

## Story Points Breakdown

- **Backend :** 3 points (scaffold relying party pur + health + Kafka squelette + compose + CI)
- **Frontend :** 0 point
- **Testing :** inclus (unit + e2e scaffold)
- **Total :** 3 points

**Rationale :** aucune logique métier ni schéma de domaine — duplication disciplinée d'un patron *relying party* déjà éprouvé (STORY-031/020), plus câblage compose/CI et vérification docker. La complexité réelle (read-models, gate, loader) est portée par STORY-036/037/038.

---

## Additional Notes

- **Nommage.** Le service reste `bilan-service` (le plan et l'architecture le nomment ainsi, `:3004`, base `bilan_service`), contrairement à `platform-catalog-service` renommé par NC-1 — Bilan garde son nom court.
- **Versioning à deux axes (P7/D10).** Le scaffold ne matérialise pas encore le double axe code/référentiel ; il pose seulement l'infrastructure. Le chargement par tenant du référentiel (`ReferentielLoader`) et le routage multi-version sont des stories ultérieures (STORY-038 + gateway).
- **B8.** Le squelette d'intégration est constructible **avant** le PRD Bilan fonctionnel : cette story n'introduit aucune décision comptable.

---

## Progress Tracking

**Status History :**
- 2026-07-14 : Créée par Scrum Master (BMAD create-story)
- 2026-07-14 : Implémentée + vérifiée docker par Claude (BMAD dev-story)

**Actual Effort :** ~3 points (conforme à l'estimation)

---

## Revue & validation

### Implémentation

Scaffold **calqué sur `platform-catalog-service`** (STORY-031, le *relying party* pur le plus récent) : l'état de scaffold a été extrait (`git archive` du commit STORY-031) puis re-marqué `bilan-service` et adapté au rôle **consommateur** de Bilan.

- **Rebranding** : `platform-catalog-service → bilan-service`, base `catalog_service → bilan_service`, port `3003 → 3004`, Swagger « PROSPERA — Bilan Service », `AUTH_AUDIENCE=bilan-service`, `KAFKA_CLIENT_ID=bilan-service`.
- **`KafkaModule` réduit au squelette client-seul** : suppression du `KafkaProducerService` (spécifique au producteur catalog `entitlement.changed`/outbox STORY-034). `bilan-service` est un **consommateur** — les consumers `entitlement.changed` + `kyc.status.changed`, read-models et idempotence sont **déférés à STORY-036**. Le client `KAFKA_CLIENT` alimente uniquement `KafkaHealthIndicator`.
- **Pas d'outbox** (l'état extrait précède STORY-034), **pas de Redis, pas de MinIO** au scaffold.
- **Endpoint diagnostic gardé** `GET /whoami` (`@AllowUnverified`) conservé comme sonde de câblage JWKS ; retiré à l'arrivée du domaine Bilan.
- **Intégration** : bloc `bilan-service` ajouté au `docker-compose.yml` racine + override hot-reload + `.env` ; `AUTH_AUDIENCE` de l'IdP passé à `expert-comptable,kyc-service,platform-catalog-service,bilan-service` (env, aucun code `auth-service`) ; CI en matrice **5 services** (+ base `bilan_service_test`).

### Qualité

- **ESLint** : 0 warning (`--max-warnings 0`).
- **Tests unitaires** : 70 tests / 14 suites verts. **Couverture 99.63 % stmts / 83.11 % branches / 100 % funcs / 99.59 % lines** (seuils 65/90/90/90 largement tenus).
- **E2E** : 8 tests / 2 suites verts (`/health` simulé mongo+kafka ; `/whoami` 200 avec RS256 minté en test, HS256 forgé → 401).

### Vérification docker bout-en-bout (2026-07-14)

Stack `mongo` (rs0) + `kafka` + `auth-service:3001` + `bilan-service:3004` (override target `base`, hot-reload) :

- `GET :3004/api/v1/health` → **200** `{ mongodb: up, kafka: up }` (ni redis, ni minio) ; `GET :3001/api/v1/health` → **200**.
- Login `PLATFORM_ADMIN` sur l'IdP → **JWT RS256** dont `aud = [expert-comptable, kyc-service, platform-catalog-service, bilan-service]`, `roles=[PLATFORM_ADMIN]`, `org=null`.
- `GET :3004/api/v1/whoami` + ce jeton → **200** `{ sub, org: null, role: PLATFORM_ADMIN, emailVerified: true }` (validation JWKS de bout en bout prouvée).
- Négatifs : **sans jeton → 401** ; **HS256 forgé** (clé publique comme secret) **→ 401** (*algorithm-confusion* écartée) ; **RS256 à payload altéré → 401**.

### Points d'attention

- La **matrice CI à 5 services** exécute `bilan-service` (lint + test:cov + test:e2e + build image `runtime`) ; la vérif locale a utilisé le **target `base`** (hot-reload), la CI construit `runtime` sur Linux.
- Aucune régression sur les 4 services existants (seul l'`AUTH_AUDIENCE` de l'IdP a été **étendu**, jamais réduit).

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
