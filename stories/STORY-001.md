# STORY-001 : Scaffolding NestJS + configuration + Swagger + health

**Epic :** EPIC-000 — Fondations techniques
**Réf. architecture :** S0.1
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian (+ IA)
**Créée le :** 2026-07-02
**Sprint :** 1

---

## User Story

En tant que **développeur**,
je veux **un squelette NestJS configuré** (configuration typée et validée, versioning d'API, Swagger, health check, et une image Docker minimale),
afin de **démarrer chaque module suivant sur une base saine, documentée et immédiatement exécutable en conteneur**.

---

## Description

### Contexte
Première story du projet : rien n'existe encore. Elle pose le squelette du micro-service ExpertComptable sur lequel tous les autres modules (auth, tenants, users, kyc, billing, admin) seront greffés. La qualité de ce socle (config validée au démarrage, format d'API homogène, documentation auto-générée) conditionne la vélocité et la fiabilité de tout le reste.

Le projet démarre **exclusivement via Docker** (directive projet). Cette story fournit donc un `Dockerfile` minimal pour que l'app boote en conteneur dès maintenant et que le health check soit vérifiable ; STORY-002 étendra cela à la stack complète (MongoDB, Redis, MinIO, Mailhog) via `docker-compose`.

### Périmètre

**Inclus :**
- Projet NestJS 11 / Node 20 LTS, TypeScript strict, ESLint + Prettier
- Mécanisme de configuration typée (`@nestjs/config`) avec **validation du `.env` au démarrage** (l'app refuse de booter si une variable requise manque/est invalide)
- Préfixe global `/api/v1` + versioning d'API par URI
- `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`)
- Documentation Swagger sur `/api/docs`
- Health check `GET /api/v1/health` (`@nestjs/terminus`) — à ce stade : liveness applicative uniquement (les indicateurs Mongo/Redis seront ajoutés en STORY-002 quand les connexions existeront)
- Helmet + squelette de la structure de dossiers (`common/`, `config/`, `modules/`, `health/`)
- `Dockerfile` multi-stage minimal + `.dockerignore` : l'app démarre par `docker build` / `docker run`

**Hors périmètre (repris par d'autres stories) :**
- `docker-compose` complet + services Mongo/Redis/MinIO/Mailhog + connexions Mongoose/Bull → **STORY-002**
- Logging pino structuré, filtre d'exceptions global, `TenantContext`, CI GitHub Actions → **STORY-003**
- Toute logique métier (auth, tenants, etc.) → epics suivants
- Variables d'environnement des briques non encore branchées (`MONGODB_URI`, `REDIS_HOST`, `FEDAPAY_*`) : ajoutées au schéma de validation par les stories qui les consomment, pour ne pas bloquer le boot prématurément

### Flux (côté développeur)
1. Le développeur clone le repo et copie `.env.example` → `.env`
2. `docker build` produit l'image de l'app
3. `docker run` (avec le `.env`) démarre le service
4. Si une variable requise manque, le démarrage échoue avec un message explicite
5. `GET /api/v1/health` renvoie 200
6. `/api/docs` affiche l'UI Swagger (vide de endpoints métier, mais fonctionnelle)

---

## Acceptance Criteria

- [ ] Projet NestJS 11 initialisé, Node 20, `tsconfig` en mode strict, ESLint + Prettier configurés et passants
- [ ] `@nestjs/config` chargé globalement ; un schéma valide le `.env` au démarrage (ex. via `class-validator`/`class-transformer` ou Joi)
- [ ] Le démarrage **échoue avec un message clair** si une variable obligatoire est absente ou invalide (au moins `NODE_ENV`, `PORT`)
- [ ] Préfixe global `/api/v1` appliqué ; versioning d'API par URI activé
- [ ] `ValidationPipe` global actif avec `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- [ ] `GET /api/v1/health` renvoie 200 (liveness applicative)
- [ ] Swagger accessible sur `/api/docs` (titre, version, tag health)
- [ ] Helmet activé
- [ ] `Dockerfile` multi-stage (build → runtime Node 20 slim) + `.dockerignore` ; `docker build` réussit et `docker run` démarre un service qui répond sur `/api/v1/health`
- [ ] `.env.example` présent, aligné sur le schéma de config et le document d'environnement
- [ ] `README` documente le démarrage **via Docker** (build + run)

---

## Technical Notes

### Composants / structure créée
```
src/
├── main.ts                 # bootstrap : helmet, ValidationPipe global, versioning, préfixe /api/v1, Swagger
├── app.module.ts           # importe ConfigModule (global) + HealthModule
├── config/
│   ├── env.validation.ts   # schéma de validation du .env (échec au boot si invalide)
│   └── configuration.ts    # config typée exposée par ConfigService
├── common/                 # (dossiers vides prêts : guards/, decorators/, filters/, database/)
├── modules/                # (vide — rempli par les epics suivants)
└── health/
    ├── health.module.ts
    └── health.controller.ts   # GET /health via @nestjs/terminus
Dockerfile
.dockerignore
.env.example
README.md
```

### Dépendances npm principales
- `@nestjs/config`, `@nestjs/swagger`, `@nestjs/terminus`
- `class-validator`, `class-transformer` (validation .env + DTOs futurs)
- `helmet`
- (Mongoose, Bull, throttler, passport… : ajoutés par les stories qui les utilisent)

### `main.ts` — points clés
- `app.setGlobalPrefix('api')`
- `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`
- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`
- `app.use(helmet())`
- Setup Swagger (`DocumentBuilder`, `SwaggerModule.setup('api/docs', ...)`)
- Port lu depuis `ConfigService` (validé)

### Validation du `.env`
- Schéma minimal à cette story : `NODE_ENV` (enum: development|staging|production), `PORT` (number, défaut 3000)
- **Extensible** : chaque story ultérieure ajoute ses variables au schéma (MongoDB en STORY-002, JWT en STORY-005, FedaPay en STORY-016…). Objectif : le boot ne casse jamais faute d'une variable dont le module n'est pas encore branché.

### Dockerfile (multi-stage minimal)
- Stage `build` : `node:20-slim`, `npm ci`, `npm run build`
- Stage `runtime` : `node:20-slim`, copie `dist/` + `node_modules` de prod, `CMD ["node", "dist/main.js"]`
- `.dockerignore` : `node_modules`, `dist`, `.git`, `.env`
- Le compose complet et le mode hot-reload arrivent en STORY-002 (`docker-compose.override.yml`)

### Health check
- `@nestjs/terminus` ; à cette story, l'indicateur est purement applicatif (l'app répond). Les indicateurs `MongooseHealthIndicator` et Redis seront ajoutés en STORY-002.

### Sécurité (amorces NFR-001)
- Helmet dès le bootstrap
- `forbidNonWhitelisted` empêche les propriétés inattendues dans les futurs DTOs
- Aucun secret en dur ; tout passe par le `.env` validé

---

## Dependencies

**Stories prérequises :** aucune (première story du projet).

**Stories bloquées par celle-ci :** toutes — STORY-001 est le socle commun. En particulier STORY-002 (compose + connexions), STORY-003 (socle transverse + CI).

**Dépendances externes :** Docker installé sur le poste de dev. Aucune autre.

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité
- [ ] Tests unitaires écrits et passants :
  - [ ] La validation du `.env` rejette une config invalide (variable manquante → échec au boot)
  - [ ] `HealthController` renvoie le statut attendu
- [ ] Test e2e minimal : `GET /api/v1/health` → 200 (via `supertest`)
- [ ] `docker build` réussit ; `docker run` démarre l'app et `/api/v1/health` répond 200
- [ ] Swagger accessible sur `/api/docs`
- [ ] Lint (ESLint) et format (Prettier) passants
- [ ] `README` de démarrage Docker rédigé ; `.env.example` à jour
- [ ] Revue de code effectuée (`/code-review`)
- [ ] CI verte (mise en place complète en STORY-003 ; a minima lint + build + tests localement ici)
- [ ] Tous les critères d'acceptation validés

---

## Story Points Breakdown

- **Setup projet (NestJS, TS strict, lint/format) :** 1 pt
- **Config typée + validation .env :** 1 pt
- **main.ts (préfixe, versioning, ValidationPipe, helmet, Swagger) :** 1 pt
- **Health check (Terminus) :** 0,5 pt
- **Dockerfile minimal + .dockerignore + README :** 1 pt
- **Tests (validation config, health, e2e) :** 0,5 pt
- **Total : 5 points**

**Rationale :** aucune logique métier, mais beaucoup de petites pièces de fondation à câbler correctement (config, bootstrap, Docker, doc). L'assistance IA accélère le boilerplate ; le soin porte sur la validation du `.env` (extensible) et la propreté du bootstrap, réutilisés partout ensuite.

---

## Notes complémentaires

- Garder le schéma de validation du `.env` **modulaire/extensible** : c'est le point le plus structurant pour les stories suivantes. Ne pas y mettre dès maintenant les variables des briques non branchées (sinon le boot échoue sans raison).
- Ne pas anticiper le logging pino ni le filtre d'exceptions (STORY-003) — garder cette story focalisée sur le bootstrap exécutable.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-02 : Créée (Scrum Master, BMAD)
- 2026-07-02 : Implémentée et terminée (Developer, BMAD)

**Effort réel :** 5 points (conforme à l'estimation).

**Notes d'implémentation :**
- Code dans `expert-comptable/` (racine du micro-service), à côté de `docs/`.
- **Versioning d'API URI** en place : `enableVersioning({ type: URI, defaultVersion: '1' })` + préfixe global `api` → toutes les routes sous `/api/v1`. Vérifié en conteneur : `GET /api/v1/health` → 200. Chaque contrôleur déclare sa version (`@Controller({ path: '...', version: '1' })`).
- Validation du `.env` : `class-validator` + `class-transformer` via `ConfigModule.forRoot({ validate })` ; échoue au boot si invalide. Enum `Environment` inclut `test` (requis par le runner Jest).
- `reflect-metadata` ajouté aux `setupFiles` Jest (unit + e2e) pour les décorateurs class-validator hors contexte Nest.
- Dockerfile multi-stage `node:20-slim`, utilisateur non-root `node`, `npm prune --omit=dev`.

**Résultats de vérification :**
- Build : `nest build` OK
- Lint : ESLint 0 erreur / 0 warning (`--max-warnings 0`)
- Tests : 7 unitaires + 2 e2e passants ; couverture 100 % sur `env.validation.ts` et `health.controller.ts`
- Docker : image construite ; conteneur démarre, `GET /api/v1/health` → 200 `{"status":"ok"}`, `/api/docs` → 200

**Reste (hors périmètre story, décision utilisateur) :** initialisation du dépôt git + commit sur branche `feature/STORY-001-scaffolding` — non effectué (le projet n'est pas encore un dépôt git ; à faire quand vous le souhaitez).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
