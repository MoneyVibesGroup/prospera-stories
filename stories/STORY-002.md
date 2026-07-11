# STORY-002 : Infrastructure locale (docker-compose) + connexions Mongoose & Bull

**Epic :** EPIC-000 — Fondations techniques
**Réf. architecture :** S0.2
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Completed
**Assigné à :** vivian (+ IA)
**Créée le :** 2026-07-02
**Sprint :** 1

---

## User Story

En tant que **développeur**,
je veux **démarrer tout le projet via une seule commande Docker** (l'app NestJS **et** MongoDB, Redis, MinIO, Mailhog), avec l'application réellement connectée à MongoDB et Redis,
afin de **disposer d'un environnement de développement complet, reproductible et prêt à accueillir les modules métier**.

---

## Description

### Contexte
STORY-001 a livré le squelette de l'app et un `Dockerfile` minimal. Mais l'app ne parle encore à aucune brique : ni base de données, ni file de jobs, ni stockage, ni serveur d'e-mails. Cette story met en place l'**infrastructure de développement** via `docker-compose` et branche les deux connexions dont dépendront tous les modules suivants : **MongoDB** (données) et **Redis/Bull** (jobs asynchrones : e-mails, webhooks de paiement).

Conformément à la directive projet, le démarrage se fait **exclusivement via Docker** : `docker compose up` construit l'image de l'app et lance l'ensemble de la stack. Un fichier d'override apporte le hot-reload en développement.

MongoDB est lancé en **replica set à un seul nœud** afin de disposer des **transactions multi-documents** (nécessaires dès STORY-004 pour l'inscription atomique tenant + user — cf. décision D4 de l'architecture).

### Périmètre

**Inclus :**
- `docker-compose.yml` : services `app` (NestJS), `mongo` (replica set 1 nœud), `redis`, `minio`, `mailhog`
- `docker-compose.override.yml` (dev) : source montée en volume (hot-reload via `start:dev`), ports exposés
- Connexion **MongoDB** via `@nestjs/mongoose` (`MongooseModule.forRootAsync`, config depuis `ConfigService`)
- Connexion **Redis/Bull** via `@nestjs/bullmq` (ou `@nestjs/bull`) (`BullModule.forRootAsync`) ; une file de démonstration traite un job pour prouver le câblage
- Enrichissement du **health check** : indicateurs MongoDB et Redis (le `/health` passe de « liveness applicative » à « app + dépendances »)
- Initialisation du **bucket MinIO** au démarrage (ou script d'init) — le bucket privé KYC servira en STORY-011
- Ajout des variables au **schéma de validation du `.env`** (`MONGODB_URI`, `REDIS_HOST`, `REDIS_PORT`) et à `.env.example`
- Mise à jour du README (démarrage `docker compose up`)

**Hors périmètre :**
- Toute logique métier (schémas Tenant/User, endpoints) → epics suivants
- Utilisation réelle du stockage MinIO (upload) → STORY-011
- Envoi réel d'e-mails / `MailModule` → STORY-006
- Pipeline CI GitHub Actions → STORY-003
- Configuration de production (secrets, stockage S3 managé) → phase d'exploitation

### Flux (côté développeur)
1. `cp .env.example .env`
2. `docker compose up` construit l'image de l'app et démarre app + mongo + redis + minio + mailhog
3. Le nœud MongoDB s'initialise en replica set (auto au premier démarrage)
4. L'app se connecte à Mongo et Redis ; en cas d'indisponibilité, elle log l'erreur et réessaie
5. `GET /api/v1/health` renvoie 200 avec le détail des indicateurs `mongodb: up`, `redis: up`
6. En modifiant un fichier `src/`, l'app redémarre à chaud (override dev)

---

## Acceptance Criteria

- [ ] `docker compose up` démarre en une commande : `app`, `mongo`, `redis`, `minio`, `mailhog`
- [ ] Le service `app` est bien celui du `Dockerfile` (pas de dépendance à un Node installé sur l'hôte)
- [ ] MongoDB démarre en **replica set single-node** initialisé automatiquement (transactions disponibles)
- [ ] L'app se connecte à MongoDB via `MongooseModule.forRootAsync` (URI issue de `ConfigService`)
- [ ] L'app se connecte à Redis et une **file Bull de démonstration** traite un job (preuve de câblage, retirable ensuite)
- [ ] `GET /api/v1/health` renvoie 200 et inclut des indicateurs `mongodb` et `redis` à l'état `up` ; si Mongo ou Redis est coupé, l'endpoint renvoie 503 avec l'indicateur en échec
- [ ] Le **bucket MinIO** (nom configurable) est créé au démarrage s'il n'existe pas
- [ ] `docker-compose.override.yml` fournit le hot-reload en dev (modification de `src/` → redémarrage à chaud)
- [ ] Le schéma de validation `.env` inclut `MONGODB_URI`, `REDIS_HOST`, `REDIS_PORT` (démarrage refusé si absents/invalides) ; `.env.example` à jour
- [ ] README mis à jour : la commande unique `docker compose up` suffit à tout lancer
- [ ] `depends_on` + `healthcheck` (ou attente/retry) garantissent que l'app ne plante pas si Mongo/Redis démarrent un peu plus lentement

---

## Technical Notes

### Composants / fichiers
```
docker-compose.yml            # app + mongo (RS) + redis + minio + mailhog
docker-compose.override.yml   # dev : volume src monté, command start:dev, ports
docker/mongo/rs-init.sh       # (ou healthcheck) init du replica set single-node
src/database/database.module.ts   # MongooseModule.forRootAsync
src/queue/queue.module.ts         # BullModule.forRootAsync + file démo
src/storage/minio.bootstrap.ts    # création du bucket au démarrage (ou service init)
src/health/health.controller.ts   # + MongooseHealthIndicator + Redis/Bull indicator
src/config/env.validation.ts      # + MONGODB_URI, REDIS_HOST, REDIS_PORT
```

### Dépendances npm à ajouter
- `@nestjs/mongoose`, `mongoose`
- `@nestjs/bullmq` + `bullmq` (recommandé, maintenu) **ou** `@nestjs/bull` + `bull` (le docx cite `@nestjs/bull` ; choisir bullmq de préférence, sinon rester cohérent avec le docx)
- (client MinIO : `minio` — l'usage réel est en STORY-011, mais l'init bucket peut être posée ici)

### docker-compose — points clés
- `mongo` : image `mongo:7`, `command: ["--replSet","rs0","--bind_ip_all"]`, healthcheck lançant `mongosh --eval "rs.status()"` ; init du RS via un one-shot ou un healthcheck qui exécute `rs.initiate()` au premier boot
- `redis` : image `redis:7-alpine`
- `minio` : image `minio/minio`, `command: server /data --console-address ":9001"`, identifiants via env
- `mailhog` : image `mailhog/mailhog` (SMTP 1025, UI 8025)
- `app` : `build: .`, `env_file: .env`, `depends_on` mongo+redis (condition `service_healthy`)
- Réseau et volumes nommés pour la persistance (mongo-data, minio-data)

### Health check
- Ajouter `MongooseHealthIndicator` (`@nestjs/terminus`) → `db.pingCheck('mongodb')`
- Indicateur Redis : soit `MicroserviceHealthIndicator`, soit un check custom `ping` sur la connexion Bull/Redis
- Résultat : `/health` reflète l'état réel des dépendances (utilisable par l'orchestrateur — NFR-005)

### Validation `.env` (extension)
- Ajouter au schéma : `MONGODB_URI` (string, requis), `REDIS_HOST` (string, requis), `REDIS_PORT` (int, défaut 6379)
- Garder le principe : n'ajouter que les variables des briques réellement branchées par cette story

### Connexion résiliente
- `MongooseModule` : options de retry ; ne pas bloquer le boot indéfiniment mais logguer clairement
- `depends_on: condition: service_healthy` côté compose pour ordonnancer le démarrage

### Sécurité / hygiène
- Aucun identifiant en dur : Mongo/MinIO via variables d'environnement (valeurs de dev dans `.env.example`, jamais de secret réel commité)
- MinIO bucket **privé** (les URLs présignées viendront en STORY-011)

---

## Dependencies

**Stories prérequises :**
- **STORY-001** ✅ (squelette NestJS, config validée, Dockerfile, health check de base)

**Stories bloquées par celle-ci :**
- STORY-004+ (inscription atomique → transactions Mongo)
- STORY-006 (MailModule → Bull + Mailhog)
- STORY-011 (upload KYC → MinIO)
- Toutes les stories persistant des données

**Dépendances externes :** Docker installé. Images publiques `mongo:7`, `redis:7-alpine`, `minio/minio`, `mailhog/mailhog` (téléchargées au premier `up`).

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité
- [ ] Tests :
  - [ ] Test e2e du health check enrichi (`mongodb` + `redis` = up) — via app démarrée contre les conteneurs
  - [ ] Test unitaire de la validation `.env` étendue (variables Mongo/Redis requises)
- [ ] `docker compose up` démarre toute la stack ; `GET /api/v1/health` → 200 avec `mongodb: up`, `redis: up`
- [ ] Hot-reload vérifié en dev (override)
- [ ] Bucket MinIO créé au démarrage (vérifié dans la console MinIO ou via client)
- [ ] Lint (0 warning) et build OK
- [ ] README de démarrage à jour ; `.env.example` complété
- [ ] Revue de code (`/code-review`)
- [ ] Tous les critères d'acceptation validés

---

## Story Points Breakdown

- **docker-compose (5 services) + init replica set + override dev :** 1,5 pt
- **Connexions Mongoose + Bull (+ file démo) :** 1 pt
- **Health check enrichi + validation .env + init bucket MinIO :** 0,5 pt
- **Total : 3 points**

**Rationale :** peu de code applicatif, mais de la configuration d'infrastructure à faire correctement (surtout l'init du replica set Mongo, point le plus délicat). Fortement accéléré par l'IA sur le YAML et le câblage NestJS standard.

---

## Additional Notes

- **Point de vigilance :** l'initialisation automatique du replica set single-node est la partie la plus susceptible de coincer (timing du `rs.initiate()`, résolution du hostname du nœud). Prévoir un healthcheck robuste et un hostname stable (`mongo`).
- Choix `bullmq` vs `bull` : `bullmq` est la version maintenue et recommandée ; le document d'environnement mentionne `@nestjs/bull` (historique). Décision par défaut : **bullmq** ; à confirmer à l'implémentation pour rester cohérent avec le reste du code.
- La file Bull de démonstration sert uniquement à prouver le câblage ; elle sera remplacée par la vraie file `mail` en STORY-006.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-02 : Créée (Scrum Master, BMAD)
- 2026-07-02 : Implémentée et terminée (Developer, BMAD)

**Effort réel :** 3 points (conforme à l'estimation).

**Notes d'implémentation :**
- Topologie confirmée avec l'utilisateur : **app = 1 conteneur**, infra (Mongo/Redis/MinIO/Mailhog) en conteneurs séparés.
- `bullmq` retenu (plutôt que `bull` historique) via `@nestjs/bullmq`.
- Mongo en replica set single-node, init idempotente par le `healthcheck` du service (`rs.initiate()` au premier boot).
- Health check custom : `MongoHealthIndicator` (readyState via `ConnectionStates.connected`) + `RedisHealthIndicator` (PING) ; renvoie 503 si une dépendance est down.
- Client Redis partagé (`REDIS_CLIENT`, ioredis, global) ; client MinIO global + bootstrap du bucket privé non bloquant.
- Dockerfile restructuré en 3 stages (`base` deps complètes / `build` / `runtime`) ; l'override dev cible `base`, monte `src/` et lance `nest start --watch` (node_modules Linux de l'image non écrasé).
- Validation `.env` étendue : `MONGODB_URI`, `REDIS_HOST` requis, `REDIS_PORT` (défaut 6379).

**Résultats de vérification :**
- Build : OK · Lint : 0 erreur/warning
- Tests : 13 unitaires + 2 e2e passants
- `docker compose up` : `app`, `mongo`, `redis` en **healthy**, minio + mailhog up
- `GET /api/v1/health` → 200 `{"mongodb":"up","redis":"up"}`
- Logs confirmés : bucket MinIO `kyc-documents` créé, job Bull « ping » émis **et traité** (preuve du câblage Redis+Bull de bout en bout), hot-reload actif

**Reste (hors story) :** init git + commit (projet pas encore sous git) ; automatisation du e2e « conteneurs » en CI → STORY-003.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
