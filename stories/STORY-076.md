# STORY-076 : Scaffold `balance-service` (:3007, relying party JWKS, health, Kafka)

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique  
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § Épics AB-01→AB-08 ; `sprint-plan-atelier-balance-2026-07-12.md` § Coordination balance/bilan ; `architecture-prospera-ecosystem-2026-07-04.md` § Orchestration / Modèle de jetons (P6 Kafka)  
**Priorité :** Must Have  
**Story Points :** 3  
**Statut :** done  
**Assigné à :** null  
**Créée le :** 2026-07-12  
**Mise à jour :** 2026-07-17 (D15 : sprint 10 → 11 ; alignement sur les 7 services réellement présents au compose/CI)  
**Sprint :** 11 (2026-11-19 → 2026-12-03)  
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

Extraire ce module d'une logique monolithe inexistante en tant que tel est une **nouvelle pièce du puzzle** (~20 pts). On la découpe donc en **5 stories CORE** (STORY-076, 077, 101, 086, 099).

> ⚠️ **Ordonnancement (D15, 2026-07-16)** : le balance CORE a été **décalé du sprint 10 au sprint 11** pour laisser passer le RBAC plateforme (EPIC-025). Le sprint 11 porte donc balance CORE (21 pts) **+** Bilan EPIC-010 (23 pts) = **44 pts pour 34 de capacité** — surchargé, **à arbitrer au prochain `/bmad:sprint-planning`** (arbitrage probable : pousser EPIC-010 au sprint 12). L'**invariant D14 reste intact** quoi qu'il arrive : STORY-076 ouvre la chaîne, et la balance est produite/stockée **avant** que le `bilan-service` la consomme.

**STORY-076 est l'os** : le projet NestJS, ses conventions, son infrastructure de démarrage et le bus. Aucune logique métier n'y est portée — cela garantit une base **vérifiable en isolation** (le service démarre, `/health` répond, Kafka opérationnel) avant d'y déposer le **contrat canonique** (STORY-101) et les **contrôles** (STORY-077).

### Périmètre

**Inclus :**

- **Projet `balance-service/`** : un projet NestJS 11 / Node 20 **calqué sur `expert-comptable` et `auth-service`** (mêmes conventions : Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` avec Helmet + préfixe/versionnement `/api/v1` + `ValidationPipe` stricte + Swagger, logger pino, `HealthModule`, seuils Jest **65/90/90/90**, ESLint **0 warning**), branché sur une **base Mongo dédiée `balance_service`** (database-per-service).
- **Bootstrap `main.ts`** identique dans l'esprit : Helmet, `setGlobalPrefix('api')` + versionnement URI `v1`, `ValidationPipe` stricte (`whitelist`/`forbidNonWhitelisted`/`transform`), logger pino, **Swagger titré « PROSPERA — Atelier Balance »** sur `/api/docs` (tags `health`, `balance`, `admin` de base ; les endpoints métier arrivent avec leurs stories).
- **Base Mongo dédiée `balance_service`** : `DatabaseModule` (connexion Mongoose au replica set `rs0`, URI `mongodb://mongo:27017/balance_service?replicaSet=rs0`). Aucun schéma de domaine ici (les schémas arrivent en STORY-101/077).
- **`AuthModule` — validation RS256/JWKS (relying party PUR)** : `JwtStrategy` **validate-only** (jwks-rsa : cache/rotation du `kid`, **`algorithms: ['RS256']`** imposé anti algorithm-confusion, `iss`/`aud` vérifiés — `aud=[balance-service]`), mapping `org`→`tenantId` et `roles[]`→`role`. Modèle repris **tel quel** de `kyc-service` (STORY-020) / `expert-comptable` (STORY-030). **Aucune émission de jeton, aucun mot de passe** : `balance-service` ne possède pas l'identité (pas de `PasswordService`/bcrypt).
- **Socle transverse `common/` dupliqué** : `context/tenant-context.service`, `database/tenant-scoped.repository`, `guards/` (`jwt-auth.guard`, `roles.guard` — le gate métier `@RequiresBalanceAccess` lisant les read-models arrive en **STORY-077**), `decorators/` (`current-user`, `public`, `roles`, `allow-unverified`), `filters/all-exceptions.filter`, `interceptors/logging.interceptor`, `enums/` (`Role`, `KycStatus` relocalisés comme en STORY-030), `utils/` (+ leurs specs). Duplication **à l'identique** (pas de package partagé en phase 1). **Pas de `security/password.service`** (relying party pur).
- **`HealthModule`** : `GET /api/v1/health` (readiness Mongo) **+ indicateur Kafka** (connectivité du bus), exactement comme `auth-service`.
- **`docker-compose.yml` racine** : STORY-076 **ajoute** le bloc `balance-service` (build, `:3007`, env_file, `depends_on` Mongo/Kafka *healthy*, healthcheck) au compose racine existant — **première apparition du service dans le code** (jusqu'ici il n'existe que comme entrée du tracker `sprint-status.yaml`). **Ajout pur** : aucun des **7 services déjà au compose** n'est modifié. Le port **`:3007` est libre** (3000→3004, 3006 et 3010 sont pris ; 3007 est bien le port réservé au service).
- **Module client Kafka** (`KafkaModule` : producteur + consommateur) : configuration (brokers depuis l'env), `KafkaProducerService`, et un **`KafkaBootstrapService`** qui, à l'événement applicatif « prêt », **produit et consomme** un message sur un topic de santé (`prospera.health.balance-service`) — preuve que le bus fonctionne, avant que STORY-101/102 n'y publient `balance.submitted`/`balance.created`.
- **CI en matrice** : `balance-service` est **ajouté à la matrice existante** du workflow d'intégration — qui compte déjà **7 services** (`expert-comptable`, `auth-service`, `kyc-service`, `platform-catalog-service`, `bilan-service`, `document-service`, `admin-panel`) et passe donc à **8** (lint + test(+cov) + build image docker par service).
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
2. L'infra partagée démarre : `mongo` (rs0), `kafka` (KRaft), `redis`, `minio`, `mailhog`.
3. Les **7 services existants** démarrent (`expert-comptable` `:3000`, `auth-service` `:3001`, `kyc-service` `:3002`, `platform-catalog-service` `:3003`, `bilan-service` `:3004`, `document-service` `:3006`, `admin-panel` `:3010`) — **plus le nouveau `balance-service` (`:3007`)**, soit 8 au total.
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
- [ ] **`docker-compose.yml` racine** orchestre `balance-service` (`:3007`) **aux côtés des 7 services existants** et de l'infra partagée (Mongo, Kafka, Redis, MinIO, Mailhog) ; `docker-compose.override.yml` fournit le **hot-reload** du nouveau service (`target: base`, `nest start --watch`, `./balance-service/src` monté).
- [ ] `docker compose up` **à la racine** démarre l'ensemble ; `GET :3007/api/v1/health` → **200** (Mongo + Kafka *up*).
- [ ] **Client Kafka opérationnel** : au démarrage de `balance-service`, un message est **produit puis consommé** sur un topic de santé ; l'aller-retour est **journalisé** et **reflété dans `/health`** (indicateur Kafka).
- [ ] **CI en matrice** : `balance-service` est ajouté aux **7 services déjà en matrice** (lint → test+couverture → build image docker) ; les **8 jobs** sont **verts**.
- [ ] **Aucun des 7 services existants** n'a subi de modification de code applicatif (non-régression) — les seuls fichiers partagés touchés sont `docker-compose.yml`, `docker-compose.override.yml` et `.github/workflows/ci.yml`, en **ajout pur**.
- [ ] **Aucune** logique de balance, **aucun** schéma de domaine n'est introduit (respect du découpage EPIC-017).

---

## Technical Notes

### Composants / arborescence

```
PROSPERA/
├── docker-compose.yml                 # racine — 7 services + infra (MODIFIÉ : +balance-service ⇒ 8)
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

### Dépôt & flux git (première story du module)

- **Dépôt** : `https://github.com/MoneyVibesGroup/prospera-balance-service.git` (créé le 2026-07-12).
- **État au 2026-07-17** : le dépôt ne contient qu'un **`README.md` sur `main`** — **la branche `dev` n'existe pas encore**.
- **Conséquence pour le dev** : STORY-076 étant la **story d'amorçage** du module, elle doit **créer `dev` depuis `main`** *avant* de brancher (le flux normal « brancher + rebaser sur `dev` avant de coder » suppose une base `dev` qui, ici, reste à poser — même amorçage que `kyc-service` en STORY-014).
- **Ensuite, flux standard** : branche **`MNV-076`** depuis `dev` → commits préfixés `MNV-076(scope): …` → push → PR titrée `MNV-076(scope): …` → **« Rebase and merge »** sur `dev` + suppression de la branche. **Rebase, jamais merge.**
- ⚠️ **Point ouvert hérité (non bloquant, à ne pas re-découvrir en cours de dev)** : le service vit dans **son propre dépôt**, mais `docker-compose.yml`, `docker-compose.override.yml` et `.github/workflows/ci.yml` sont **à la racine `PROSPERA/`** — **qui n'est pas un dépôt git**. Les modifications racine de cette story (bloc compose `:3007`, override, matrice CI 7 → 8) resteront donc **sur disque, non versionnées**, exactement comme celles de STORY-046 (admin-panel). Ce n'est **pas** à STORY-076 de trancher où versionner la racine : le constater, le tracer, et **le remonter à l'user** — pas l'improviser.

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
- [ ] Non-régression : e2e verts sur les 7 services existants (aucun code applicatif touché)
- [ ] CI matrice : workflow vert pour les **8** services
- [ ] `.env.example` : variables d'env documentées

---

## Prochaines étapes

**Immédiatement après :** STORY-077 (read-models + gate `@RequiresBalanceAccess`) et STORY-101 (contrat canonique) — les 3 forment le socle.

**Dependencies aval** : STORY-086 (import Sage), STORY-102 (ingestion IMF), STORY-082-085 (cahiers/OCR) tous dépendent de ce socle.

---

## Progress Tracking

**Statut : `done`** (clôturée le 2026-07-17 ; synchronisé : en-tête de cette story · `docs/sprint-status.yaml` · cette section).

**Historique :**

- **2026-07-12** — Story rédigée (Scrum Master). Statut `ready-for-dev`. Sprint 10.
- **2026-07-16** — **D15** : décalée sprint 10 → **sprint 11** (le RBAC plateforme EPIC-025 passe avant). Sprint 11 surchargé (44/34), à arbitrer.
- **2026-07-17** — **Rafraîchie** (`/bmad:create-story`) : la story décrivait un compose à 3 services alors que **7 tournent** désormais. Réalignés : matrice CI (7 → **8**), périmètre non-régression (les 7, plus « expert-comptable + auth-service »), flux de démarrage, port `:3007` **confirmé libre**. **Dépôt confirmé** `MoneyVibesGroup/prospera-balance-service` — ⚠️ **branche `dev` absente**, à créer depuis `main` avant de brancher `MNV-076`.
- **2026-07-17** — **Implémentée** (`/bmad:dev-story`, branche `MNV-076`). Statut → `review`.
- **2026-07-17** — **Revue** (`/code-review high`) : 3 constats, tous corrigés (dont 1 **critique**). Re-vérifiée en docker.
- **2026-07-17** — **Intégrée** : PR #1 → `dev` en « Rebase and merge » (`8bd81a8`), branche `MNV-076` supprimée. Statut → **`done`**. **Clôturée.**

### Décisions d'implémentation

1. **Ni Redis/BullMQ ni MinIO** — l'arborescence de la story listait `redis/` et `queue/`, mais ses *bullets* de périmètre ne les mentionnaient pas. Écarté au profit du **précédent `bilan-service`** (STORY-035, écrit *après* cette story : « Pas de Redis/BullMQ ni de MinIO »). Motif : `balance-service` n'a **aucun job interne** (aucun e-mail) et **n'ingère aucun fichier** avant STORY-086 — l'infra viendra **avec** la story qui en a besoin. Poser une file inerte aurait été de la dette (dépendance + var d'env + code non couvert) sans usage. **Réversible en une story.**
2. **Service de référence = `bilan-service`**, pas `expert-comptable`/`auth-service` : c'est le scaffold *relying party* le plus récent (2026-07-14), avec exactement la forme voulue (`/health` Mongo+Kafka, pas de `PasswordService`, pas de Redis).
3. **Sonde `GET /whoami` ajoutée** (`diagnostics/`, patron `bilan-service`) : sans **aucune** route authentifiée, le critère « un JWT RS256 est accepté / un HS256 forgé → 401 » ne serait vérifiable qu'en unitaire, jamais de bout en bout. **Provisoire**, retirée à l'arrivée du domaine.
4. **Healthcheck compose en `node -e fetch(...)`** et non `curl` (le snippet de la story) : `node:20-slim` n'embarque pas `curl` — c'est la convention réelle des 7 blocs existants.
5. **Pas d'`env_file`** (patron `document-service`) : tout est injecté par le compose racine → un clone neuf démarre **sans** créer de `.env`.

### ⚠️ Écart assumé : le round-trip Kafka ne bloque plus le démarrage

La story demandait un round-trip « identique à `auth-service` ». **Copié tel quel, il échouait** — deux bugs révélés par la vérification docker sur stack **neuve**, tous deux **latents dans le patron d'origine** :

| # | Symptôme (stack neuve) | Cause | Correctif |
|---|---|---|---|
| 1 | `Échec du round-trip : This server does not host this topic-partition` | Le topic n'existe pas ; l'auto-création se déclenche à la volée et le 1ᵉʳ `send()` part sur des métadonnées obsolètes (aucun leader élu) | `admin.createTopics({ waitForLeaders: true })` **avant** de produire — idempotent |
| 2 | `Échec du round-trip : délai dépassé` | Sur un cluster froid l'adhésion au consumer group prend **~18 s** (mesuré : `"duration":18076`) ; le délai était de 10 s | Délai porté à **45 s** **et** round-trip lancé **en tâche de fond** |

Le round-trip n'est **plus attendu** par `onApplicationBootstrap`. Motif : Nest attend la promesse du hook — la retourner ferait dépendre le démarrage HTTP de Kafka, ce qui **contredit l'invariant « démarrage dégradé »** (un broker absent bloquerait le boot jusqu'au délai, dépassant le `start_period` de 20 s du healthcheck → conteneur *unhealthy* redémarré en boucle, alors qu'il doit démarrer et signaler `kafka: down`). Le round-trip reste un **diagnostic** qui journalise son issue ; la santé Kafka de `/health` est mesurée **indépendamment** par `KafkaHealthIndicator`. Les 3 comportements sont **épinglés par des tests** (création avant production, non-blocage, corrélation par `nonce`).

> **`auth-service` porte les deux mêmes bugs** — vérifié sur stack neuve : il journalise exactement la même erreur (`This server does not host this topic-partition`) et son round-trip n'aboutit qu'au 2ᵉ boot. **Non corrigé ici** : le périmètre interdit de toucher au code des 7 services existants (critère de non-régression). **À traiter par une story dédiée** — sans quoi `auth-service` et `expert-comptable` restent *unhealthy* ~1 min au premier démarrage.

### Vérification docker réelle — 2026-07-17

Aucune vérification `mongosh` d'écriture n'est applicable (le socle **ne persiste rien**) ; la preuve est le **démarrage réel**. Faite sur **stack repartie de zéro** (`docker compose down -v` → `up --build`), condition la plus exigeante :

| Critère | Résultat |
|---|---|
| Les **8 services** sains **simultanément** | ✅ `docker compose ps` : 8/8 `healthy` |
| `GET :3007/api/v1/health` | ✅ **200** `{"status":"ok","mongodb":"up","kafka":"up"}` |
| Round-trip Kafka sur **Kafka vierge, 1ᵉʳ boot** | ✅ `Kafka round-trip OK (topic « prospera.health.balance-service »)` — **échouait avant correctif** |
| Topic de santé réellement créé | ✅ `prospera.health.balance-service` listé par `kafka-topics.sh` |
| Swagger `/api/docs` | ✅ **200**, titre `PROSPERA — Atelier Balance`, tags `health`/`diagnostics` |
| **Jeton RS256 de l'IdP RÉEL accepté** (JWKS cross-service) | ✅ **200** `{"sub":…,"org":…,"role":"TENANT_ADMIN"}` — `aud` du jeton contient bien `balance-service` |
| Jeton **HS256 forgé** (algorithm-confusion) | ✅ **401** |
| Jeton RS256 **altéré** | ✅ **401** |
| Sans jeton | ✅ **401** |
| **Aucun endpoint d'émission** | ✅ `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout` → **404** |
| **Aucun schéma de domaine** | ✅ base `balance_service` **sans aucune collection** (Mongo la crée paresseusement : rien n'est écrit → elle ne se matérialise même pas) |
| Hot-reload (override) | ✅ `nest start --watch` — « Found 0 errors. Watching for file changes. » |
| **Non-régression** des 7 services | ✅ `/health` → **200 `ok`** sur les 7 (aucun code applicatif touché) |

### `/code-review high` — 3 constats, tous corrigés

1. **🔴 Arrêt du process (critique).** Un `send()` en échec **après** l'abonnement laissait la promesse du round-trip **orpheline** : son minuteur (45 s) rejetait sans gestionnaire → `unhandledRejection` → **arrêt du process** (Node ≥ 15). Le service se serait **tué ~45 s après un démarrage réputé « dégradé mais vivant »** — l'inverse exact de l'invariant que ce code défend. *Constaté par sonde : 1 minuteur restait armé après la fin du hook.* → `waitForRoundTrip` renvoie `{ promise, cancel }`, `cancel()` est appelé dans le `finally` (**toutes** les sorties) et un gestionnaire de rejet est attaché d'office. **Test de non-régression** : 0 minuteur armé, 0 rejet non géré après le délai.
2. **Test vacant.** L'e2e « `/auth/*` → 404 » ne montait **pas** `AuthModule` : il passait **quoi qu'il arrive**, y compris si un contrôleur de login existait — fausse confiance. → remplacé par `auth.module.spec.ts` (métadonnées du module : aucun contrôleur, seulement `JwtStrategy`), **mutation-testé** : le garde-fou **tombe** bien quand on ajoute un contrôleur d'émission.
3. **Fuite de test.** Le test « rend la main immédiatement » n'attendait pas les round-trips de fond : leur minuteur réel retenait le worker jest (*worker process has failed to exit gracefully*) — de quoi masquer de vraies fuites plus tard. → round-trips drainés ; avertissement disparu.

*(+ le harnais e2e `/health` portait un `mongoReady` jamais varié → ajout du cas « Mongo déconnecté → 503 ».)*

**Re-vérifié en docker après correctifs**, sur Kafka **vierge** : round-trip **OK au 1ᵉʳ boot**, `/health` **200**.

**Qualité (finale) :** lint **0 warning** · `nest build` OK · **92 unitaires** + **14 e2e** verts · couverture **97,99 stmts / 80,95 branches / 98,63 fonctions / 97,78 lignes** — au-dessus des seuils 65/90/90/90.

**Effort réel :** 3 points (conforme à l'estimation).

---

**Status:** done  
**Created:** 2026-07-12  
**Updated:** 2026-07-17  
**Reference:** See `prd-atelier-balance-2026-07-12.md` § EPIC-017 and `sprint-plan-atelier-balance-2026-07-12.md` § Coordination
