# STORY-003 : Socle transverse (logging, exceptions, TenantContext) + CI

**Epic :** EPIC-000 — Fondations techniques
**Réf. architecture :** S0.3
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian (+ IA)
**Créée le :** 2026-07-02
**Sprint :** 1

---

## User Story

En tant que **développeur**,
je veux **un socle transverse** (logs structurés, filtre d'exceptions uniforme, contexte de tenant propagé par requête) **et une CI**,
afin que **tous les modules métier à venir partagent les mêmes conventions d'observabilité et d'erreurs, et soient testés/construits automatiquement à chaque changement**.

---

## Description

### Contexte
STORY-001 et STORY-002 ont livré le squelette de l'app, la config validée, l'infrastructure `docker compose` (Mongo replica set, Redis/Bull, MinIO, Mailhog) et un health check enrichi. Il manque la **couche transverse** que tout module (EPIC-001 → EPIC-004) va consommer :

- **Observabilité (NFR-005)** : aujourd'hui les logs sont le `Logger` NestJS par défaut (texte). On veut des **logs structurés JSON (pino)** corrélés par `requestId` (et `tenantId` dès que l'auth existera), exploitables par un agrégateur.
- **Contrat d'erreur uniforme** : chaque module renverra ses erreurs de la même façon `{ statusCode, error, message, requestId }` (cf. architecture §Erreurs), pour un front et un support prévisibles.
- **Propagation de contexte** : un porteur request-scoped (`requestId`, futur `tenantId`, futur `userId`) accessible partout sans passer `req` de main en main — socle du futur `TenantScopedRepository` (STORY-010) qui garantira l'isolation multi-tenant.
- **CI (NFR-006)** : automatiser lint → tests → build image Docker à chaque push, avec un **seuil de couverture** configuré, pour éviter les régressions dès maintenant.

Cette story ne pose que les **fondations** : les décorateurs et le `TenantContext` sont livrés en **squelette** (structure + points d'extension). Ils seront réellement peuplés par le guard JWT en **STORY-005** (auth) et exploités par l'isolation en **STORY-010**.

### Périmètre

**Inclus :**
- **Logging pino** structuré (JSON) via `nestjs-pino` + `pino-http` : chaque log porte un `requestId` ; champ `tenantId` prévu (peuplé plus tard). `pino-pretty` en dev uniquement.
- **Propagation de contexte** via `nestjs-cls` (AsyncLocalStorage) : `requestId` initialisé par requête ; `TenantContext` (service/facade typé) exposant `requestId`, `tenantId?`, `userId?` avec setters réservés au futur guard.
- **Filtre d'exceptions global** `AllExceptionsFilter` : mappe `HttpException` et erreurs inattendues vers le format uniforme `{ statusCode, error, message, requestId }` ; loggue les 5xx en `error`, les 4xx en `warn` ; ne fuit jamais de stacktrace au client.
- **Intercepteur de logging des requêtes** `LoggingInterceptor` : une ligne structurée par requête (méthode, route, statut, durée ms, `requestId`).
- **`CommonModule`** (`src/common/`) regroupant : `TenantContext`, décorateurs squelette `@Public()`, `@CurrentUser()`, provider global du filtre et de l'intercepteur (`APP_FILTER`, `APP_INTERCEPTOR`).
- **CI GitHub Actions** (`.github/workflows/ci.yml`) : job `lint` → `test` (unitaires + couverture) → `build` image Docker. Mongo + Redis montés en **services conteneurisés** pour les tests qui en ont besoin.
- **Seuil de couverture** configuré dans Jest (`coverageThreshold`) et vérifié en CI.

**Hors périmètre :**
- Le **peuplement réel** de `tenantId`/`userId` dans le contexte (fait par le guard JWT) → **STORY-005**.
- Les décorateurs d'autorisation `@Roles()` / `@AllowUnverifiedTenant()` et les guards → **STORY-005 / STORY-014** (ici seulement `@Public`, `@CurrentUser` en squelette).
- `TenantScopedRepository` et la suite de tests d'isolation → **STORY-010**.
- Déploiement/CD (rolling deploy) → phase d'exploitation (la CI s'arrête au build d'image).
- `mongodb-memory-server` pour les tests d'intégration Mongo → introduit quand un premier schéma existera (EPIC-001).

### Flux (côté développeur)
1. Une requête HTTP arrive → `nestjs-cls` ouvre un contexte et génère (ou reprend l'en-tête `x-request-id`) un `requestId`.
2. `pino-http` loggue l'entrée ; le `LoggingInterceptor` loggue la sortie avec la durée.
3. Le code métier lit/écrit le contexte via `TenantContext` (ex. `ctx.requestId`) sans manipuler `req`.
4. En cas d'exception, `AllExceptionsFilter` produit une réponse `{ statusCode, error, message, requestId }` et loggue au bon niveau.
5. À chaque push/PR, la CI exécute lint → tests (avec seuil de couverture) → build de l'image Docker.

---

## Acceptance Criteria

- [ ] Les logs applicatifs sont **structurés JSON (pino)** et chaque ligne liée à une requête porte un `requestId` ; le champ `tenantId` est prévu dans le contexte de log (peuplé ultérieurement) — NFR-005.
- [ ] En dev, les logs sont lisibles (`pino-pretty`) ; en prod/CI, ils restent en JSON.
- [ ] Un **`requestId`** est généré par requête (ou repris de l'en-tête `x-request-id` s'il est fourni) et est présent **à la fois** dans les logs et dans le corps des réponses d'erreur.
- [ ] Le **filtre d'exceptions global** renvoie un format uniforme `{ statusCode, error, message, requestId }` pour les `HttpException` **et** les erreurs non prévues (500 générique, sans stacktrace exposée).
- [ ] Les erreurs 5xx sont loggées en niveau `error` (avec stack côté serveur), les 4xx en `warn`.
- [ ] `CommonModule` expose un **`TenantContext`** propagé par requête (via `nestjs-cls`), avec au minimum `requestId` accessible ; `tenantId`/`userId` présents dans le type mais optionnels.
- [ ] Les décorateurs squelette **`@Public()`** et **`@CurrentUser()`** existent, sont typés et documentés (métadonnée posée / extraction depuis le contexte), prêts à être branchés par l'auth (STORY-005).
- [ ] Un **`LoggingInterceptor`** émet une ligne structurée par requête incluant méthode, route, statut HTTP, durée (ms) et `requestId`.
- [ ] **CI GitHub Actions** verte : `lint` → `test` (unitaires) → `build` de l'image Docker, déclenchée sur push et pull request ; Mongo/Redis disponibles en **services conteneurisés** pour les jobs qui en dépendent — NFR-006.
- [ ] Un **seuil de couverture** est configuré (Jest `coverageThreshold`) et **échoue la CI** s'il n'est pas atteint.
- [ ] La configuration `.env`/validation est étendue **uniquement si nécessaire** (ex. `LOG_LEVEL`) et `.env.example` reste à jour.
- [ ] Lint 0 warning, build OK, tous les tests existants (STORY-001/002) restent verts.

---

## Technical Notes

### Composants / fichiers
```
src/common/common.module.ts               # @Global : ClsModule, filtre + interceptor (APP_FILTER/APP_INTERCEPTOR), TenantContext
src/common/context/tenant-context.service.ts   # facade typée au-dessus de ClsService (requestId, tenantId?, userId?)
src/common/filters/all-exceptions.filter.ts     # format { statusCode, error, message, requestId }
src/common/interceptors/logging.interceptor.ts  # log structuré méthode/route/statut/durée/requestId
src/common/decorators/public.decorator.ts       # @Public() (SetMetadata IS_PUBLIC_KEY) — squelette
src/common/decorators/current-user.decorator.ts # @CurrentUser() (createParamDecorator lisant le contexte) — squelette
src/config/logger.config.ts                # options nestjs-pino (transport pretty en dev, genReqId, redaction)
src/app.module.ts                          # importe LoggerModule.forRootAsync + CommonModule (en tête)
src/main.ts                                # app.useLogger(app.get(Logger)) ; bufferLogs: true
.github/workflows/ci.yml                   # lint → test (services mongo/redis) → build image Docker
package.json                               # coverageThreshold + éventuel script test:cov
```

### Dépendances npm à ajouter
- `nestjs-pino`, `pino-http`, `pino` (runtime) ; `pino-pretty` (dev).
- `nestjs-cls` (propagation AsyncLocalStorage).
- Versions compatibles NestJS 11 (nestjs-pino ^4, nestjs-cls ^4/5).

### Logging (pino)
- `LoggerModule.forRootAsync` (depuis `ConfigService`) : niveau via `LOG_LEVEL` (défaut `info`, `debug` en dev) ; `transport: pino-pretty` **seulement** hors production ; `genReqId` réutilise `x-request-id` s'il est présent, sinon en génère un (uuid/`crypto.randomUUID`).
- `main.ts` : `NestFactory.create(AppModule, { bufferLogs: true })` puis `app.useLogger(app.get(Logger))` pour que **tous** les logs (y compris bootstrap) passent par pino.
- Redaction des champs sensibles (`authorization`, `password`, `token`) dans les options pino.
- Le `requestId` (et plus tard `tenantId`) est ajouté au contexte de log via l'intégration `nestjs-cls` ↔ pino (customProps / hook CLS) pour apparaître sur chaque ligne.

### Contexte (nestjs-cls)
- `ClsModule.forRoot({ global: true, middleware: { mount: true, generateId: true, idGenerator } })` : ouvre un store par requête et y pose `requestId`.
- `TenantContext` = fine facade **typée** au-dessus de `ClsService` : getters `requestId`, `tenantId?`, `userId?` + setters `setTenant()/setUser()` qui seront appelés par le guard JWT en STORY-005. On préfère CLS aux providers Nest `Scope.REQUEST` (évite la recréation en cascade de tout le graphe de dépendances et son coût).

### Filtre d'exceptions
- `@Catch()` global (`APP_FILTER`). Mapping :
  - `HttpException` → `statusCode = exception.getStatus()`, `message` = message(s) du body (agrège les erreurs de `ValidationPipe`), `error` = nom réglementaire (ex. `Bad Request`).
  - Autre → `500`, `error: 'Internal Server Error'`, message générique ; log `error` avec la stack (jamais renvoyée au client).
- `requestId` lu depuis le `TenantContext`/CLS et inclus dans la réponse **et** dans le log.

### CI (GitHub Actions)
- Fichier `.github/workflows/ci.yml`, déclencheurs `push` + `pull_request`, working-directory `expert-comptable/`.
- Jobs :
  1. **lint** : `npm ci` → `npm run lint`.
  2. **test** : `npm ci` → `npm run test:cov` (couverture + seuil). `services:` `mongo:7` (avec `--replSet` si un test e2e « conteneurs » le requiert) et `redis:7-alpine`, avec `options: --health-cmd` pour attendre le `service_healthy`. Variables `MONGODB_URI`/`REDIS_HOST` pointant vers les services.
  3. **build** : `docker build --target runtime` de l'image (valide le multi-stage), après succès des jobs précédents.
- Node 20 LTS (aligné sur l'image Docker) via `actions/setup-node`.

### Couverture
- `package.json` → `jest.coverageThreshold` (démarrer pragmatique, p.ex. global `branches/functions/lines/statements` à un seuil tenable vu le peu de code métier actuel, puis relever vers 80 % — cible NFR-006). Script `test:cov` = `jest --coverage`.

### Sécurité / hygiène
- Ne jamais logger de secrets (redaction pino) ni de PII inutile.
- Le filtre n'expose ni stacktrace ni détail interne au client en 5xx.
- Aucun secret dans le workflow CI (valeurs de dev uniquement pour Mongo/Redis de test).

---

## Dependencies

**Stories prérequises :**
- **STORY-001** ✅ (squelette, config, Dockerfile, `main.ts`, health de base)
- **STORY-002** ✅ (infra compose, connexions Mongo/Redis — utile pour les services CI)

**Stories bloquées / facilitées par celle-ci :**
- STORY-004+ (bénéficient du logging, du format d'erreur et de la CI dès le départ)
- STORY-005 (peuple `tenantId`/`userId` dans `TenantContext` ; branche `@Public`/`@CurrentUser`)
- STORY-010 (`TenantScopedRepository` s'appuie sur `TenantContext`)

**Dépendances externes :** compte GitHub + dépôt distant pour exécuter la CI (le projet n'est pas encore sous git — cf. Notes). Images `mongo:7`, `redis:7-alpine` disponibles pour les services CI.

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité (`feature/STORY-003-socle-transverse`)
- [ ] Tests :
  - [ ] Unitaire du `AllExceptionsFilter` (HttpException → format uniforme ; erreur inconnue → 500 générique + `requestId`)
  - [ ] Unitaire/e2e vérifiant qu'une réponse d'erreur contient `requestId` et que le même `requestId` est loggé
  - [ ] Unitaire du `TenantContext` (lecture `requestId`, setters `tenantId`/`userId`)
  - [ ] (option) test du `LoggingInterceptor` (une ligne émise avec statut + durée)
- [ ] `npm run test:cov` passe **et** respecte le seuil configuré
- [ ] Lint (0 warning) et build OK ; tests STORY-001/002 toujours verts
- [ ] `docker compose up` fonctionne toujours ; logs applicatifs en JSON (ou pretty en dev) avec `requestId`
- [ ] Workflow CI présent et **vert** (lint + test + build image)
- [ ] `.env.example` à jour si une variable a été ajoutée (`LOG_LEVEL`)
- [ ] Revue de code (`/code-review`)
- [ ] Tous les critères d'acceptation validés

---

## Story Points Breakdown

- **Logging pino + intégration CLS (requestId, redaction, useLogger) :** 1,5 pt
- **Filtre d'exceptions global + intercepteur de logging + tests :** 1,5 pt
- **`CommonModule` + `TenantContext` + décorateurs squelette :** 1 pt
- **CI GitHub Actions (lint/test/build, services Mongo/Redis) + seuil de couverture :** 1 pt
- **Total : 5 points**

**Rationale :** peu de logique métier mais plusieurs briques transverses à câbler proprement et à ordonnancer (ordre des providers globaux, `bufferLogs`, intégration CLS↔pino), plus une CI à faire passer au vert. Fortement accéléré par l'IA sur le boilerplate, mais l'intégration fine (contexte de log corrélé, format d'erreur, services CI) demande de la rigueur.

---

## Additional Notes

- **Choix CLS vs REQUEST-scope :** on retient `nestjs-cls` (AsyncLocalStorage) plutôt que des providers `Scope.REQUEST` pour ne pas dégrader les performances (pas de reconstruction du graphe DI par requête) tout en satisfaisant l'exigence « request-scoped » de l'architecture (§CommonModule).
- **Décorateurs en squelette :** `@Public`/`@CurrentUser` sont posés ici mais ne prennent tout leur sens qu'avec le guard JWT (STORY-005). On évite d'ajouter `@Roles`/`@AllowUnverifiedTenant` prématurément.
- **Pré-requis git/CI :** la CI GitHub Actions suppose un dépôt distant ; le projet n'est **pas encore sous git**. À l'implémentation : proposer `git init` + premier commit + création du dépôt distant avant de valider le job CI de bout en bout (sinon le workflow est livré et vérifiable localement via `act`/relecture, et validé au premier push).
- **Seuil de couverture :** démarrer à un seuil réaliste et le relever au fil des epics vers la cible NFR-006 (≈ 80 %) ; documenter la valeur choisie dans `package.json`.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-02 : Créée (Scrum Master, BMAD)
- 2026-07-02 : Implémentée et terminée (Developer, BMAD)

**Effort réel :** 5 points (conforme à l'estimation).

**Notes d'implémentation :**
- **Logging** : `nestjs-pino` (^4.6) + `pino` (^10) + `pino-http` (^11) ; options centralisées dans [logger.config.ts](../../expert-comptable/src/config/logger.config.ts). `autoLogging: false` (une seule ligne de fin de requête, produite par le `LoggingInterceptor`). `pino-pretty` (dev-dep) actif hors production ; JSON brut en prod/CI. Redaction de `authorization`/`cookie`/`password`/`token`. `main.ts` : `bufferLogs: true` + `app.useLogger(app.get(Logger))` pour router **tout** le bootstrap à travers pino.
- **Contexte** : `nestjs-cls` (^6.2, AsyncLocalStorage) plutôt que `Scope.REQUEST` (perf). Le middleware cls génère/propage le `requestId` (réutilise l'en-tête `x-request-id` s'il est fourni). Le `mixin` pino lit cls au moment de l'écriture → **chaque** ligne porte `requestId` (+ `tenantId` dès qu'il sera peuplé par l'auth). `TenantContext` = facade typée au-dessus de `ClsService` (`requestId` + setters `setTenant`/`setUser` pour STORY-005).
- **Erreurs** : `AllExceptionsFilter` global (`APP_FILTER`) → `{ statusCode, error, message, requestId }` ; 4xx en `warn`, 5xx en `error` (stack côté serveur uniquement, jamais exposée). Erreur inconnue → 500 générique.
- **`CommonModule`** (`@Global`) : `TenantContext` + `APP_FILTER` + `APP_INTERCEPTOR`. `ClsModule`/`LoggerModule` importés dans `AppModule`.
- **Décorateurs squelette** : `@Public()` (métadonnée `IS_PUBLIC_KEY`) et `@CurrentUser()` (lit `request.user`, peuplé par le guard JWT en STORY-005).
- **Couverture** : `coverageThreshold` global (branches 65 / functions 90 / lines 90 / statements 90) + `collectCoverageFrom` recentré sur la logique (exclut modules de câblage, `main.ts`, constants, bootstraps, décorateurs squelette).
- **CI** : [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — jobs `lint` → `test` (unitaires+couverture+e2e, services `mongo:7`/`redis:7-alpine`) → `build` (image Docker cible `runtime`). Placé à la racine PROSPERA avec `working-directory: expert-comptable`.
- **`.env.example`** : inchangé — `LOG_LEVEL` est **optionnel** (défaut dérivé de `NODE_ENV` : `debug` en dev, `info` en prod) et validé par `@IsIn(LOG_LEVELS)` s'il est fourni.

**Résultats de vérification :**
- Lint : 0 erreur/warning · Build : OK · Typecheck (`tsc --noEmit`) : OK
- Tests : **32 unitaires + 2 e2e** passants ; couverture **98.6 % statements / 72.7 % branches / 100 % functions / 98.4 % lines** (au-dessus du seuil)
- `docker compose up --build` : stack complète OK ; logs applicatifs **pino JSON** avec `requestId` sur chaque ligne
- Corrélation vérifiée : `curl -H "x-request-id: demo-req-001"` → logs `"requestId":"demo-req-001"` (en-tête réutilisé)
- Format d'erreur vérifié sur HTTP : `GET /api/v1/inexistant` → 404 `{"statusCode":404,"error":"Not Found","message":"Cannot GET /api/v1/inexistant","requestId":"…"}` ; `requestId` du corps == `requestId` du log (`AllExceptionsFilter`, niveau WARN)
- `LoggingInterceptor` vérifié : `GET /api/v1/health 200 2ms`

**Reste (hors story) :** init git + dépôt distant pour exécuter réellement la CI (le workflow est livré et validé localement : lint/test/build reproduits à la main). Le peuplement `tenantId`/`userId` du contexte et le branchement des décorateurs viennent en STORY-005.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
