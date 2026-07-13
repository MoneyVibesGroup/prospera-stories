# STORY-076 : Scaffold `balance-service` (:3007, relying party JWKS, health, Kafka)

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique  
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § Épics AB-01→AB-08 ; `sprint-plan-atelier-balance-2026-07-12.md` § Coordination balance/bilan ; `architecture-prospera-ecosystem-2026-07-04.md` § Orchestration / Modèle de jetons (P6 Kafka)  
**Priorité :** Must Have  
**Story Points :** 3  
**Statut :** ready-for-dev  
**Assigné à :** null  
**Créée le :** 2026-07-12  
**Sprint :** 10 (2026-11-05 → 2026-11-19)  
**Service :** `balance-service` (:3007, base `balance_service`)  
**Couvre :** — (story d'infrastructure ; débloque le socle EPIC-017 via STORY-077/101, puis les adaptateurs 086/102/082-085)

> **Fondation du module AMONT Atelier Balance.** C'est la **première story du module balance-service** — elle pose le **squelette du service**, les **conventions de code** (calquées sur `expert-comptable` et `auth-service`), le **démarrage via docker-compose racine** et la **connexion Kafka** (prête pour les événements aval). Aucune logique métier : juste une **base vérifiable en isolation** (service démarre, `/health` répond, Kafka opérationnel). Le **contrat de balance canonique** (STORY-101), les **read-models** (STORY-077) et les **adaptateurs** (086, 102, 082-085) se greffent sur ce socle.

---

## User Story

En tant qu'**équipe plate-forme Atelier Balance**,  
je veux un micro-service **`balance-service` démarrable via le compose racine**, doté du **socle transverse** et d'un **client Kafka opérationnel**,  
afin d'**accueillir la logique du hub multi-source** et de disposer du **bus d'événements** sur lequel le `bilan-service` écoutera `balance.created`.

---

## Description

### Contexte

Le re-cadrage du 2026-07-12 (D13/D14, voir `sprint-plan-atelier-balance-2026-07-12.md`) a acté que l'**Atelier Balance** est un **nouveau service `balance-service`**, module **AMONT** du `bilan-service`. Il reçoit les balances des **3 adaptateurs** (Sage, IMF direct, cahiers/OCR), les normalise vers un **contrat canonique unique**, les **stocke**, les **contrôle**, et en émet **`balance.created`** sur Kafka que le `bilan-service` consomme pour rendre la liasse.

Extraire ce module d'une logique monolithe inexistante en tant que tel est une **nouvelle pièce du puzzle** (~20 pts). On la découpe donc en **5 stories CORE** (STORY-076→101, 086, 099) qui démarrent le sprint 10 **en parallèle du Bilan** (qui continue sprints 11-14, inchangé).

**STORY-076 est l'os** : le projet NestJS, ses conventions, son infrastructure de démarrage et le bus. Aucune logique métier n'y est portée — cela garantit une base **vérifiable en isolation** (le service démarre, `/health` répond, Kafka opérationnel) avant d'y déposer le **contrat canonique** (STORY-101) et les **contrôles** (STORY-077).

### Périmètre

**Inclus :**

- **Projet `balance-service/`** : un projet NestJS 11 / Node 20 **calqué sur `expert-comptable` et `auth-service`** (mêmes conventions : Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` avec Helmet + préfixe/versionnement `/api/v1` + `ValidationPipe` stricte + Swagger, logger pino, `HealthModule`, seuils Jest **65/90/90/90**, ESLint **0 warning**), branché sur une **base Mongo dédiée `balance_service`** (database-per-service).
- **Bootstrap `main.ts`** identique dans l'esprit : Helmet, `setGlobalPrefix('api')` + versionnement URI `v1`, `ValidationPipe` stricte (`whitelist`/`forbidNonWhitelisted`/`transform`), logger pino, **Swagger titré « PROSPERA — Atelier Balance »** sur `/api/docs` (tags `health`, `balance`, `admin` de base ; les endpoints métier arrivent avec leurs stories).
- **Base Mongo dédiée `balance_service`** : `DatabaseModule` (connexion Mongoose au replica set `rs0`, URI `mongodb://mongo:27017/balance_service?replicaSet=rs0`). Aucun schéma de domaine ici (les schémas arrivent en STORY-101/077).
- **`AuthModule` — validation RS256/JWKS (relying party PUR)** : `JwtStrategy` **validate-only** (jwks-rsa : cache/rotation du `kid`, **`algorithms: ['RS256']`** imposé anti algorithm-confusion, `iss`/`aud` vérifiés — `aud=[balance-service]`), mapping `org`→`tenantId` et `roles[]`→`role`. Modèle repris **tel quel** de `kyc-service` (STORY-020) / `expert-comptable` (STORY-030). **Aucune émission de jeton, aucun mot de passe** : `balance-service` ne possède pas l'identité (pas de `PasswordService`/bcrypt).
- **Socle transverse `common/` dupliqué** : `context/tenant-context.service`, `database/tenant-scoped.repository`, `guards/` (`jwt-auth.guard`, `roles.guard` — le gate métier `@RequiresBalanceAccess` lisant les read-models arrive en **STORY-077**), `decorators/` (`current-user`, `public`, `roles`, `allow-unverified`), `filters/all-exceptions.filter`, `interceptors/logging.interceptor`, `enums/` (`Role`, `KycStatus` relocalisés comme en STORY-030), `utils/` (+ leurs specs). Duplication **à l'identique** (pas de package partagé en phase 1). **Pas de `security/password.service`** (relying party pur).
- **`HealthModule`** : `GET /api/v1/health` (readiness Mongo) **+ indicateur Kafka** (connectivité du bus), exactement comme `auth-service`.
- **`docker-compose.yml` racine** : STORY-076 **ajoute** le bloc `balance-service` (build, `:3007`, env_file, `depends_on` Mongo/Kafka *healthy*, healthcheck) au compose racine existant — **première apparition du service dans le code** (jusqu'ici il n'existe que comme entrée du tracker `sprint-status.yaml`). Sans modifier `expert-comptable` ni `auth-service`.
- **Module client Kafka** (`KafkaModule` : producteur + consommateur) : configuration (brokers depuis l'env), `KafkaProducerService`, et un **`KafkaBootstrapService`** qui, à l'événement applicatif « prêt », **produit et consomme** un message sur un topic de santé (`prospera.health.balance-service`) — preuve que le bus fonctionne, avant que STORY-101/102 n'y publient `balance.submitted`/`balance.created`.
- **CI en matrice** : le workflow d'intégration s'exécute en `strategy.matrix.service: [expert-comptable, auth-service, balance-service]` (lint + build + test(+cov) par service).
- **Tests** : unitaires du socle dupliqué (les specs reprises passent) ; unitaire de l'indicateur Kafka / `KafkaBootstrapService` (aller-retour simulé) ; **e2e minimal** (`GET /api/v1/health` → 200 ; Swagger `/api/docs` accessible).

**Hors périmètre :**

- **Contrat de balance canonique** — schéma `BalanceCanonique`, stockage, versioning → **STORY-101**. Aucune collection de domaine n'est créée ici.
- **Read-models + gate `@RequiresBalanceAccess`** (consomme `entitlement.changed` + `kyc.status.changed`) → **STORY-077**.
- **Import/adaptateurs** (Sage, IMF direct, cahiers) → **STORY-086, 102, 082-085**.
- **Contrôles d'intégrité, calculs fiscaux, conseil** → **STORY-098 & suivantes**.
- **Émission `balance.created` réelle** → dépend de STORY-101 + contrôles.
- **Package partagé `common/`** (extraction) → deferred.

### Flux (mise en route)

1. Un développeur clone le dépôt et lance **`docker compose up` à la racine `PROSPERA/`**.
2. L'infra partagée démarre : `mongo` (rs0), `kafka` (KRaft), `redis`, etc.
3. `expert-comptable` (`:3000`), `auth-service` (`:3001`), **`balance-service` (`:3007`)** démarrent.
4. Au démarrage de `balance-service`, le `KafkaBootstrapService` **produit** un message sur `prospera.health.balance-service`, le **consomme**, et **journalise** « Kafka round-trip OK ».
5. `GET http://localhost:3007/api/v1/health` → **200** (Mongo *up*, Kafka *up*). `http://localhost:3007/api/docs` affiche « PROSPERA — Atelier Balance ».
6. *(STORY-101+)* On dépose le contrat et la logique sur ce socle.

---

## Acceptance Criteria

- [ ] **Projet `balance-service/`** existe (NestJS 11 / Node 20, TypeScript strict) avec les **mêmes conventions** que `expert-comptable`/`auth-service` : Dockerfile multi-stage, scripts `package.json`, ESLint `--max-warnings 0`, seuils Jest **65/90/90/90**. `npm run lint`, `nest build` et `npm test` **verts**.
- [ ] `main.ts` monte Helmet, préfixe `api` + versionnement URI `v1`, `ValidationPipe` stricte, logger **pino**, et **Swagger « PROSPERA — Atelier Balance »** sur **`/api/docs`**.
- [ ] `balance-service` se connecte à une **base Mongo dédiée `balance_service`** (replica set `rs0`) ; **aucun schéma de domaine** n'est défini.
- [ ] **Validation RS256/JWKS opérationnelle** (relying party pur) : `JwtStrategy` validate-only (jwks-rsa, `algorithms:['RS256']`, `iss`/`aud=[balance-service]` vérifiés) ; un JWT RS256 émis par `auth-service` est accepté, un HS256 forgé / un token altéré → **401** (algorithm-confusion écartée). **Aucun endpoint d'émission** (`/auth/login`, `/auth/register` → 404). **Pas de `PasswordService`/bcrypt.**
- [ ] Le **socle transverse `common/`** est présent et **testé** : `TenantContext`, `TenantScopedRepository`, guards (`jwt-auth`, `roles`), décorateurs, filtres, intercepteurs, `enums`. Les specs **passent**. *(Pas de `PasswordService` — relying party pur.)*
- [ ] **`docker-compose.yml` racine** orchestre `balance-service` (`:3007`), plus tous les services et l'infra partagée (Mongo, Kafka, Redis, etc.) ; `docker-compose.override.yml` fournit le **hot-reload par service**.
- [ ] `docker compose up` **à la racine** démarre l'ensemble ; `GET :3007/api/v1/health` → **200** (Mongo + Kafka *up*).
- [ ] **Client Kafka opérationnel** : au démarrage de `balance-service`, un message est **produit puis consommé** sur un topic de santé ; l'aller-retour est **journalisé** et **reflété dans `/health`** (indicateur Kafka).
- [ ] **CI en matrice** `service: [expert-comptable, auth-service, balance-service]` : lint + build + test(+cov) s'exécutent **pour chaque service** ; les trois jobs sont **verts**.
- [ ] `expert-comptable` et `auth-service` **n'ont subi aucune modification** de code applicatif (non-régression).
- [ ] **Aucune** logique de balance, **aucun** schéma de domaine n'est introduit (respect du découpage EPIC-017).

---

## Technical Notes

### Composants / arborescence

```
PROSPERA/
├── docker-compose.yml                 # racine — apps + infra (MODIFIÉ : +balance-service)
├── docker-compose.override.yml        # hot-reload par service
├── balance-service/                   # NOUVEAU projet
│   ├── Dockerfile                     # base / build / runtime (identique pattern)
│   ├── .dockerignore
│   ├── package.json  tsconfig*.json  nest-cli.json  eslint.config.*
│   ├── test/jest-e2e.json
│   └── src/
│       ├── main.ts                    # Helmet, /api/v1, ValidationPipe, Swagger
│       ├── app.module.ts              # Config, Database(balance_service), Auth(JWKS), Redis, Queue, Health, Kafka, Common
│       ├── config/                    # configuration.ts, env.validation (AUTH_JWKS_URI/ISSUER/AUDIENCE requis)
│       ├── auth/                       # AuthModule : JwtStrategy RS256/JWKS validate-only (jwks-rsa) — PAS d'émission
│       ├── common/                    # DUPLIQUÉ : context, database, guards(jwt-auth,roles), decorators, filters, interceptors, enums, utils (PAS de security/password)
│       ├── database/                  # DatabaseModule → mongodb://mongo:27017/balance_service
│       ├── redis/                     # RedisModule (futur cache + jobs)
│       ├── queue/                     # QueueModule (BullMQ) — infra prête
│       ├── health/                    # GET /health : Mongo + Kafka
│       └── kafka/                     # KafkaModule : producteur + consommateur + bootstrap
```

### `docker-compose.yml` racine — points clés

- **Ajout de `balance-service`** :
  ```yaml
  balance-service:
    build: { context: ./balance-service, target: runtime }
    container_name: balance-service
    ports:
      - "3007:3007"
    env_file: ./balance-service/.env
    environment:
      - DATABASE_URL=mongodb://mongo:27017/balance_service?replicaSet=rs0
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      mongo:
        condition: service_healthy
      kafka:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3007/api/v1/health"]
      interval: 10s
      timeout: 5s
      retries: 3
  ```

- **`depends_on` avec conditions** : Mongo, Kafka doivent être *healthy* avant `balance-service`.
- **Override** : `balance-service` en `target: base` + `npm run start:dev` + montage `./balance-service/src`.

### Kafka setup (identique `auth-service`)

- **Service `kafka`** (KRaft mono-nœud) : `KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'`.
- **Module client** : `kafkajs`, configuration `brokers: process.env.KAFKA_BROKERS.split(',')`.
- **`KafkaBootstrapService`** : au démarrage, produit + consomme sur `prospera.health.balance-service`, journalise succès, alimente `/health`.

### Database

Aucun schéma de domaine (arrive STORY-101+). Schema simple pour health seulement.

```javascript
db.createCollection("_health", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      properties: {
        service: { bsonType: "string" },
        status: { enum: ["up", "down"] }
      }
    }
  }
});
```

---

## Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| Divergence de conventions avec `expert-comptable`/`auth-service` | Copier-coller exact des fichiers config, `common/`, Dockerfile, scripts ; vérifier lint/build/test avant merge |
| Kafka ne démarre pas (timeout CDN) | Utiliser le miroir de registry (cf. STORY-022 notes) |
| Hot-reload ne fonctionne pas (mount volume) | Vérifier `./balance-service/src` est monté en override |
| Mongo replica set pas initialisé | Utiliser le healthcheck idempotent de la config racine |

---

## Definition of Done

- [ ] ESLint : 0 warning, `npm run lint` vert
- [ ] Build : `nest build` vert (taille binaire < 200 MB)
- [ ] Tests : `npm test` ≥ **65% branches** / 90% functions / 90% lines / 90% statements
- [ ] Coverage : `npm run test:cov` générée, rapportée
- [ ] e2e Docker : `docker compose up` → `GET :3007/api/v1/health` 200 + Kafka round-trip OK journalisé
- [ ] Swagger : `/api/docs` affiche « PROSPERA — Atelier Balance », tags `health`
- [ ] Non-régression : `expert-comptable` et `auth-service` e2e verts
- [ ] CI matrice : workflow passe pour les 3 services
- [ ] `.env.example` : variables d'env documentées

---

## Prochaines étapes

**Immédiatement après :** STORY-077 (read-models + gate `@RequiresBalanceAccess`) et STORY-101 (contrat canonique) — les 3 forment le socle.

**Dependencies aval** : STORY-086 (import Sage), STORY-102 (ingestion IMF), STORY-082-085 (cahiers/OCR) tous dépendent de ce socle.

---

**Status:** ready-for-dev  
**Created:** 2026-07-12  
**Reference:** See `prd-atelier-balance-2026-07-12.md` § EPIC-017 and `sprint-plan-atelier-balance-2026-07-12.md` § Coordination
