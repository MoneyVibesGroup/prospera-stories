# STORY-041 : Scaffold `document-service` (`:3006`, base `document_service`, relying party JWKS + health + Kafka squelette) + abstraction `OcrProvider` (Tesseract) + accès MinIO **lecture**

**Epic :** EPIC-015 — Chaîne KYC / OCR (`document-service`) : OCR au service du KYC (assiste la revue, ne décide jamais — invariant **DO-1**)
**Réf. architecture :** `tech-spec-document-service-2026-07-10.md` (v1.0, §Approche technique / §Stack / §Plan d'implémentation — **ST-DOC-1**) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Modèle de jetons RS256-JWKS / §Outbox (moule relying party) · `architecture-kyc-service-2026-07-03.md` (propriétaire des pièces + bucket MinIO `kyc-documents` + contrat `kyc.document.uploaded` v1, STORY-040) · décisions programme **AD-2** (chaîne KYC en 2 flux) + **DO-1** (l'OCR propose, l'humain décide)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-14. `document-service` créé (`:3006`, base `document_service`), *relying party* RS256/JWKS pur (socle `common/` dupliqué depuis `bilan-service` STORY-035 + `JwtStrategy` JWKS-only, `AUTH_AUDIENCE=document-service`), `/health` (mongo + kafka + **minio**), `KafkaModule` squelette **client-seul** (consumer `kyc.document.uploaded` = STORY-042, producteur `document.extrait` = STORY-043), endpoint diagnostic gardé `GET /whoami`. **Deux briques spécifiques :** (1) `OcrModule` — abstraction `OcrProvider` pluggable (token DI) + `TesseractOcrProvider` (`tesseract.js` WASM **offline**, traineddata `fra`+`eng` embarqués) + `FakeOcrProvider` (pluggabilité DO-1) ; (2) `StorageModule` **lecture seule** — `DocumentStorageReader` (`getObject`/`statObject`) sur bucket `kyc-documents` (propriété kyc), **aucune écriture ni bootstrap**. Compose racine (+override, +CI matrice **6 services**) ; l'IdP stampe `document-service` dans l'`aud`. lint 0, **85 unit (18 suites) + 9 e2e (3 suites, dont smoke OCR réel)** verts, couverture **99.43/85.22/100/99.37**. `/code-review` (high) fait (2 constats de robustesse OCR corrigés). Intégré : repo **`prospera-ocr-service`** (créé par l'user), PR #1 `MNV-041(document-service): …` **mergée « Rebase and merge » sur `dev`**. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-14
**Sprint :** 8
**Service :** document-service (`:3006`) — **nouveau**, base Mongo dédiée `document_service`
**Couvre :** aucun FR fonctionnel (capacité **transverse d'OCR**, décisions **AD-2 / DO-1**) — pose l'infrastructure du futur pipeline d'extraction KYC (EPIC-015 : STORY-042…045)

> **Story de scaffold — tête de la chaîne EPIC-015 (flux B du Module 0).** `document-service` est la **capacité d'OCR au service du KYC** : à chaque pièce déposée (RCCM/CFE) il extrait les données, compare le déclaré au lu, détecte les pièces expirées/illisibles et publie `document.extrait` qui **enrichit le dossier de revue** — **sans jamais approuver** (invariant DO-1 ; le statut KYC reste piloté par `kyc-service` + l'humain). Cette story crée le **squelette vérifiable en isolation** : le service démarre via le **compose racine existant** (créé STORY-022), valide un JWT réel de l'IdP par **JWKS** (RS256, *validate-only*), expose `/health` (mongo + kafka + minio) et un `KafkaModule` squelette. Elle ajoute les **deux briques spécifiques** au service : l'**abstraction `OcrProvider`** (interface pluggable + implémentation **Tesseract**, prouvée par un smoke d'extraction de texte brut) et l'**accès MinIO en lecture seule** au bucket `kyc-documents` (propriété `kyc-service` — document-service **lit**, ne possède pas la pièce). Le **consumer `kyc.document.uploaded`**, l'**extraction RCCM/CFE**, la **comparaison déclaré/lu** et le **producteur `document.extrait`** sont **hors périmètre** → STORY-042 / STORY-043 / STORY-044. On **calque** intégralement les conventions du *relying party* pur le plus récent — `bilan-service` (STORY-035) et `platform-catalog-service` (STORY-031) : même patron RS256/JWKS, pas d'e-mail, pas de mot de passe, pas d'émission de jeton.

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux un **micro-service `document-service` autonome et démarrable** via le compose racine, *relying party* pur d'`auth-service` (validation **RS256/JWKS**), avec base dédiée `document_service`, `/health` (mongo + kafka + minio), un `KafkaModule` squelette, une **abstraction `OcrProvider` (impl Tesseract)** et un **accès MinIO en lecture seule** au bucket des pièces KYC,
afin de disposer d'un **socle vérifiable en isolation** sur lequel brancher le **consumer `kyc.document.uploaded` + l'extraction** (STORY-042), la **comparaison + le producteur `document.extrait`** (STORY-043) et la **persistance `DocumentExtraction`** (STORY-044) — prérequis de la **chaîne KYC assistée par OCR** (EPIC-015, décision DO-1).

---

## Description

### Contexte

Le re-cadrage écosystème du 2026-07-04 a fait de PROSPERA un **écosystème de micro-services** : un IdP racine (`auth-service`), des verticaux *relying parties* (`expert-comptable`) et des **capacités partagées** (`kyc-service`, `platform-catalog-service`, `bilan-service`, puis `document-service`). La décision **AD-2** structure la **chaîne KYC** en **deux flux** : le **flux A** (revue humaine via `admin-panel`, EPIC-016) et le **flux B** (assistance OCR via `document-service`, EPIC-015 — *cet épic*). L'invariant **DO-1** est strict : **l'OCR propose, l'humain décide** — `document-service` n'écrit jamais le statut KYC, il **enrichit** le dossier de revue et rien de plus.

`document-service` ne **possède** ni l'identité (`auth-service`), ni le KYC ni les **pièces** (`kyc-service`, propriétaire du bucket MinIO `kyc-documents`), ni l'**entitlement** (`platform-catalog-service`). Il ne connaît les organisations que par un `orgId` opaque issu du **JWT RS256** validé via **JWKS**. À terme il sera **consommateur** de `kyc.document.uploaded` (source de vérité = `kyc-service`, contrat v1 figé par STORY-040) et **producteur** de `document.extrait` (via outbox) — mais **ces contrats arrivent en STORY-042/043**. Au scaffold, le `KafkaModule` n'est qu'un **client de santé** (aucun consumer, aucun producer, aucun groupe de consommateurs orphelin).

L'EPIC-015 se découpe en 5 stories (§Allocation du sprint-plan, sprints 8-9) : **STORY-041** (scaffold + `OcrProvider`/Tesseract + MinIO lecture — *cette story*), **STORY-042** (consumer `kyc.document.uploaded` idempotent → extraction RCCM/CFE), **STORY-043** (comparaison déclaré/lu + expiré/illisible → producteur `document.extrait` outbox), **STORY-044** (persistance `DocumentExtraction` keyée `orgId` + GET consultation), **STORY-045** (côté `kyc-service` : consommer `document.extrait` → enrichir le dossier). STORY-041 est **structurante mais volontairement sans logique métier d'extraction** : elle garantit une base **démarrable, sécurisée, testée**, dotée d'un **provider OCR pluggable prouvé** et d'un **accès en lecture** aux pièces — avant qu'y soient branchés le consumer puis l'extraction.

Comme pour STORY-035 (`bilan-service`) et STORY-031 (`platform-catalog-service`), **il n'y a rien à ré-implémenter du socle** : on **duplique** disciplinément le socle transverse `common/` et la `jwt.strategy` RS256/JWKS d'un *relying party* existant (décision **C6** « même patron que kyc-service » ; **K4** de duplication assumée, factorisation en lib au prochain usage). Comme `bilan-service`, `document-service` naît **après le cutover** : **RS256/JWKS-only dès l'origine**, aucune dette HS256, aucun `AUTH_MODE`.

**Deux différences** avec le scaffold `bilan-service`, propres à ce service :
1. **Accès MinIO en lecture seule** au bucket `kyc-documents` (propriété `kyc-service`) — `document-service` **lit** la pièce désignée par `storageKey` pour l'OCR ; il **ne crée jamais le bucket**, **n'écrit jamais**, **ne génère aucune URL présignée**. Le `StorageModule` de `kyc-service` (upload + présigné) est **réduit à une lecture seule** (`getObject`/`statObject`).
2. **Abstraction `OcrProvider`** (interface pluggable) + **implémentation Tesseract** — la brique métier différée (extraction des champs RCCM/CFE) arrive en STORY-042 ; **ici on pose seulement l'abstraction et un provider fonctionnel**, prouvé par un **smoke d'extraction de texte brut** sur une image d'exemple (aucun *parsing* de champ, aucune règle KYC). Basculer `OcrProvider` (Tesseract → OCR managé) ne devra **jamais** toucher au futur code métier.

### Périmètre

**Dans le périmètre**
- Scaffold `document-service/` (projet NestJS 11 / Node 20, conventions, Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts`, `HealthModule`, base `document_service`).
- Socle `common/` **dupliqué** (context, database, guards, decorators, filters, interceptors, enum `Role`, type `AccessTokenPayload`).
- `auth/jwt.strategy.ts` **RS256/JWKS *validate-only*** (calquée sur `bilan-service` STORY-035), `AUTH_AUDIENCE=document-service`.
- **Endpoint diagnostic gardé** `GET /api/v1/whoami` (JwtAuthGuard) échoant `{ sub, org, roles, emailVerified }` — **sonde de câblage du relying party**, remplacée par les vrais contrôleurs dès l'arrivée du domaine (ou retirée si le service reste purement event-driven, cf. tech-spec §Design d'API).
- **`OcrModule`** : abstraction **`OcrProvider`** (classe abstraite `extract(input): Promise<OcrResult>` → `{ text, confidence, provider }`, **texte brut seulement**) + implémentation **`TesseractOcrProvider`** (fournie via token DI, langue `fra`) + **smoke test** prouvant l'extraction de texte sur une image d'exemple. **Aucun *parsing* de champ RCCM/CFE** (STORY-042).
- **`StorageModule` lecture seule (MinIO)** : client `minio` partagé + service **`DocumentStorageReader`** (`getObject(key): Promise<Buffer>`, `statObject(key)`) sur le bucket **`kyc-documents`** (propriété `kyc-service`). **Pas de `makeBucket`, pas de `putObject`, pas de présigné.**
- `KafkaModule` **squelette** (client `kafkajs`, `kafka: up` en `/health`) — le **consumer `kyc.document.uploaded` (+ idempotence `ProcessedEvent`) est déféré à STORY-042** ; le **producteur `document.extrait` + outbox** à STORY-043.
- **`HealthModule`** : `GET /api/v1/health` = 200 avec `mongodb`, `kafka` **et `minio`** up (minio est une dépendance runtime réelle du service).
- Bloc `document-service` **ajouté** au `docker-compose.yml` **racine existant** (`:3006`, base `document_service`, accès `minio`) + override hot-reload + `.env.example`.
- **Ajout de `document-service` à l'`aud` émis par l'IdP** en dev (via env `AUTH_AUDIENCE`/`IDP_AUTH_AUDIENCE` du bloc `auth-service` du compose — **aucun changement de code `auth-service`**, cf. §Cas limites).
- CI en matrice `service: [expert-comptable, auth-service, kyc-service, platform-catalog-service, bilan-service, document-service]` (+ base `document_service_test`).

**Hors périmètre (stories suivantes)**
- **Consumer `kyc.document.uploaded`** (contrat v1 STORY-040) + **idempotence** (`ProcessedEvent`, `eventId` unique) + **lecture effective de la pièce → OCR → extraction champs RCCM/CFE** → **STORY-042**.
- **Comparaison déclaré vs lu** + **détection expiré/illisible** (seuils de confiance) + **producteur `document.extrait`** (outbox transactionnel, patron STORY-034/021) → **STORY-043**.
- **Persistance `DocumentExtraction`** (base `document_service`, keyée `orgId`) + éventuel `GET /documents/:documentId/extraction` → **STORY-044**.
- **Côté `kyc-service`** : consommer `document.extrait` → enrichir le dossier de revue → **STORY-045**.
- **Résolution du `declared`** (valeurs d'inscription à comparer) : `kyc.document.uploaded` v1 **ne porte pas** `declared` (kyc ne possède plus l'identité déclarée depuis le cutover STORY-030) → sera résolu en aval par un **read-model `identity.*`** dans `document-service` — **point de coordination STORY-042/043**, hors scaffold.
- **Extensions** (factures fournisseurs, dossiers de Crédit, autres types) → différées (mêmes patrons, nouveaux types).
- **Redis** : omis en phase 1 (le traitement asynchrone passe par le consumer Kafka ; aucun job interne au scaffold ; cache JWKS en mémoire via `jwks-rsa`).

### Flux (mise en route)

1. `docker compose up` (racine) démarre `mongo` (rs0), `kafka`, `minio`, `expert-comptable:3000`, `auth-service:3001`, `kyc-service:3002`, `platform-catalog-service:3003`, `bilan-service:3004` **et `document-service:3006`**.
2. `GET :3006/api/v1/health` → **200** avec `mongodb: up`, `kafka: up` **et `minio: up`** (le bucket `kyc-documents` est joignable en lecture ; pas de redis).
3. Un opérateur `PLATFORM_ADMIN` (ou un cabinet `TENANT_ADMIN`) se connecte sur l'IdP (`:3001`) → obtient un **access token RS256** dont l'`aud` contient désormais `document-service`.
4. `GET :3006/api/v1/whoami` avec ce token → le service **valide le JWT via JWKS** (clé publique de l'IdP, aucun secret partagé) → **200** échoant `{ sub, org, roles, emailVerified }`.
5. **Smoke `OcrProvider`** (test) : `TesseractOcrProvider.extract(imageExemple)` renvoie un `OcrResult` avec du **texte brut** non vide et une `confidence` — prouvant que le binding Tesseract fonctionne et que l'abstraction est pluggable.
6. Négatifs : sans token → **401** ; JWT **HS256 forgé** (mêmes claims) → **401** (*algorithm-confusion* écartée) ; RS256 altéré → **401** ; `aud` incorrect → **401**.

---

## Acceptance Criteria

- [ ] **Nouveau projet `document-service/`** (NestJS 11 / Node 20), conventions **calquées sur `bilan-service`/`platform-catalog-service`** : Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` (Helmet, préfixe `/api/v1`, `ValidationPipe` stricte `whitelist`+`forbidNonWhitelisted`, Swagger « **PROSPERA — Document Service** » sur `/api/docs`), logger **pino** (`requestId`), seuils Jest standard (≈ **65/90/90/90**), ESLint **0 warning**. L'app **écoute sur `:3006`**, base Mongo dédiée **`document_service`** (`mongodb://mongo:27017/document_service?replicaSet=rs0`).
- [ ] **`HealthModule`** : `GET /api/v1/health` = 200 avec `mongodb: up`, `kafka: up` **et `minio: up`** (indicateur MinIO = connectivité + présence du bucket `kyc-documents`, ex. `bucketExists`). **Pas de redis.**
- [ ] **Socle transverse dupliqué (`common/`)** : `TenantContext` (nestjs-cls), `TenantScopedRepository`, guards `JwtAuthGuard`/`RolesGuard` (+ `EmailVerifiedGuard` disponible), décorateurs `@Public`/`@Roles`/`@CurrentUser`/`@AllowUnverified`, filtres (`all-exceptions`) / intercepteurs (`logging`), enum `Role`, type `AccessTokenPayload`. **Exclus** (inutiles au scaffold) : tout schéma de domaine, `OutboxEvent`/relay (STORY-043), `ProcessedEvent` (STORY-042), `DocumentExtraction` (STORY-044).
- [ ] **`auth/jwt.strategy.ts` — `validate-only`, RS256/JWKS uniquement** (calquée sur `bilan-service` STORY-035) : résolution de clé via `jwks-rsa` (cache + rotation par `kid`), **`algorithms: ['RS256']` imposé** (anti *algorithm-confusion*), `issuer`/`audience` vérifiés. `AUTH_JWKS_URI` / `AUTH_ISSUER` / `AUTH_AUDIENCE` **requis** (le boot échoue s'ils manquent, via `env.validation.ts`) ; **`AUTH_AUDIENCE=document-service`**. La stratégie peuple `TenantContext` (`org → tenantId`, `org: null` PLATFORM_ADMIN → `tenantId: null`) et `request.user` (`sub`, `roles`, `emailVerified`). **Aucun endpoint d'authentification, aucun secret de signature, aucune émission de token.** **Pas** de `JWT_ACCESS_SECRET`, **pas** d'`AUTH_MODE`.
- [ ] **Endpoint diagnostic gardé** `GET /api/v1/whoami` (protégé par `JwtAuthGuard` global) : renvoie `{ sub, org, roles, emailVerified }` extrait du JWT validé. Sert de **sonde de câblage** du relying party pour la vérification docker ; explicitement **provisoire**. *(Alternative acceptable : réutiliser un endpoint gardé équivalent ; l'essentiel est de prouver la validation JWKS de bout en bout sans domaine métier.)*
- [ ] **`OcrModule` — abstraction `OcrProvider` + implémentation Tesseract** : classe abstraite `OcrProvider` (token DI) exposant `extract(input: Buffer, opts?): Promise<OcrResult>` où `OcrResult = { text: string; confidence: number; provider: string }` — **texte brut uniquement**. Implémentation **`TesseractOcrProvider`** (langue `fra`), injectée via `{ provide: OcrProvider, useClass: TesseractOcrProvider }`. **Aucun *parsing* de champ RCCM/CFE, aucune règle métier** (STORY-042). Un **smoke test** prouve `extract()` sur une image d'exemple embarquée (texte non vide + `confidence` numérique). L'abstraction est **pluggable** : une implémentation *fake* injectable en test remplace Tesseract **sans toucher au consommateur**.
- [ ] **`StorageModule` MinIO — lecture seule** : client `minio` partagé (token DI, factory depuis `configuration.ts`) + service **`DocumentStorageReader`** (classe abstraite + impl MinIO) exposant `getObject(key): Promise<Buffer>` et `statObject(key)` sur le bucket **`kyc-documents`**. **Interdits (et absents) : `makeBucket`, `putObject`, `removeObject`, `presignedGetUrl`.** Le service **ne crée jamais** le bucket (propriété `kyc-service`) ; une indisponibilité MinIO au boot est loguée sans faire échouer le démarrage (l'usage réel = STORY-042). Ne **journalise jamais** le contenu binaire d'une pièce.
- [ ] **`KafkaModule` squelette** présent (client `kafkajs`, indicateur `kafka: up` en `/health`), calqué sur `bilan-service` — **le consumer `kyc.document.uploaded` + idempotence (`ProcessedEvent`) sont déférés à STORY-042 ; le producteur `document.extrait` + outbox à STORY-043**. Aucun topic n'est consommé ni produit, **aucun groupe de consommateurs créé** en STORY-041.
- [ ] **Bloc `document-service` ajouté au `docker-compose.yml` racine existant** : `build ./document-service` (target `runtime`), `ports '3006:3006'`, env (`AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json`, `AUTH_ISSUER=prospera-auth`, `AUTH_AUDIENCE=document-service`, `MONGODB_URI` base `document_service`, `KAFKA_BROKERS=kafka:9092`, `MINIO_*` + `MINIO_BUCKET=kyc-documents`), `depends_on` `mongo`/`kafka`/`minio` **healthy**, `healthcheck` sur `/api/v1/health`. **Le compose racine n'est pas recréé** (il existe depuis STORY-022). Override hot-reload + `.env.example` fournis.
- [ ] **`document-service` ajouté à l'`aud` de l'IdP en dev** : le bloc `auth-service` du compose reçoit `AUTH_AUDIENCE`/`IDP_AUTH_AUDIENCE` incluant `document-service` (ex. `expert-comptable,kyc-service,platform-catalog-service,bilan-service,document-service`) — l'audience est **pilotée par env** (`configuration.ts`), **aucun changement de code `auth-service`**. *(Sans cela, un jeton réel de l'IdP n'a pas la bonne `aud` et le service le refuse — cf. §Cas limites.)*
- [ ] **CI** (`.github/workflows/ci.yml`) : matrice `service: [expert-comptable, auth-service, kyc-service, platform-catalog-service, bilan-service, document-service]` (lint → tests+couverture → e2e → build image, par service) + base de test `document_service_test` + env JWKS de test. **La CI doit installer/fournir Tesseract** pour l'étape de test du provider (cf. §Cas limites).
- [ ] **Vérification docker bout-en-bout** : `/health` des **6** apps → 200 (document : `mongodb` + `kafka` + `minio` up, **pas de redis**) ; login IdP (`:3001`) → JWT RS256 dont **`aud` contient `document-service`** → `GET :3006/api/v1/whoami` → **200** (`sub`/`org`/`roles`/`emailVerified` échoués) ; **smoke `OcrProvider`** vert (texte brut extrait d'une image d'exemple) ; **HS256 forgé** ou RS256 altéré → **401** ; sans token → **401**.

---

## Technical Notes

### Composants

- **Backend :** `document-service` (nouveau micro-service NestJS, `:3006`, base `document_service`).
- **Frontend :** aucun (capacité backend ; l'UI de revue est portée par `admin-panel`, flux A / EPIC-016, qui lit l'extraction **via `kyc-service`**).
- **Base de données :** Mongo dédiée `document_service` (aucune collection domaine au scaffold — seul le socle infra ; `DocumentExtraction`/`ProcessedEvent`/`OutboxEvent` arrivent STORY-042/043/044).
- **Bus :** Kafka (client squelette seulement ; consumer/producer en STORY-042/043).
- **Stockage :** MinIO **en lecture seule** sur le bucket `kyc-documents` (propriété `kyc-service`).
- **OCR :** `OcrProvider` (abstraction) + `TesseractOcrProvider` (impl v1).

### Arborescence (calquée sur `bilan-service`, + `ocr/` et `storage/` lecture)

```
document-service/
├── Dockerfile                     # multi-stage base/build/runtime — runtime installe tesseract-ocr + tesseract-ocr-fra (cf. Cas limites)
├── .env.example                   # AUTH_JWKS_URI/ISSUER/AUDIENCE, MONGODB_URI (document_service), KAFKA_BROKERS, MINIO_*, PORT=3006
├── nest-cli.json / tsconfig*.json / eslint.config.mjs / package.json
├── src/
│   ├── main.ts                    # Helmet + /api/v1 + ValidationPipe + Swagger « PROSPERA — Document Service »
│   ├── app.module.ts
│   ├── config/                    # env.validation.ts (AUTH_* + MINIO_* requis), configuration.ts, logger.config.ts
│   ├── database/                  # database.module.ts (Mongoose → document_service)
│   ├── common/                    # socle DUPLIQUÉ : context, database, guards, decorators, filters, interceptors, enums/role
│   ├── auth/jwt.strategy.ts       # RS256/JWKS validate-only (aucun endpoint d'auth)
│   ├── health/                    # /health (mongo + kafka + minio)
│   ├── kafka/                     # client kafkajs — SQUELETTE (santé) ; consumer kyc.document.uploaded = STORY-042
│   ├── storage/                   # StorageModule LECTURE SEULE : DocumentStorageReader (getObject/statObject), bucket kyc-documents
│   ├── ocr/                       # OcrModule : OcrProvider (abstraction) + TesseractOcrProvider (impl) + assets/ (image d'exemple pour le smoke)
│   └── diagnostics/               # whoami.controller.ts (sonde JWKS gardée, provisoire)
└── test/                          # e2e scaffold (health public, whoami 200/401, HS256 forgé → 401) + smoke OcrProvider — JWT RS256 mintés en test
```

> **Pas de `read-models/` ni de `modules/` domaine encore**, **pas d'`outbox/`**, **pas de `redis`**. Le `storage/` est **volontairement amputé** de l'écriture et du présigné (par rapport au `StorageModule` de `kyc-service`) : `document-service` ne possède pas la pièce.

### `ocr/` — abstraction `OcrProvider` + Tesseract (cœur spécifique du scaffold)

- **Abstraction** (classe abstraite = token DI Nest) :
  ```ts
  export interface OcrResult { text: string; confidence: number; provider: string; }
  @Injectable()
  export abstract class OcrProvider {
    /** Extraction OCR BRUTE (texte + confiance). Aucun parsing métier ici. */
    abstract extract(input: Buffer, opts?: { lang?: string }): Promise<OcrResult>;
  }
  ```
- **Implémentation Tesseract** (`TesseractOcrProvider`, langue `fra` par défaut) fournie via `{ provide: OcrProvider, useClass: TesseractOcrProvider }`. Le **parsing** des champs RCCM/CFE (n° RCCM, raison sociale, dates, seuils de confiance) est **STORY-042** — ici on ne renvoie que `text`/`confidence` bruts.
- **Choix d'implémentation Tesseract** (recommandation, à figer à l'implémentation) :
  - **Recommandé — binaire `tesseract` conteneurisé** : installer `tesseract-ocr` + `tesseract-ocr-fra` dans le stage `runtime` du Dockerfile, invoqué via un wrapper mince (ex. `node-tesseract-ocr`). **Déterministe, pas de téléchargement de *traineddata* au runtime**, meilleure perf. Contrepartie : la CI et l'environnement de test doivent disposer du binaire (cf. §Cas limites).
  - **Alternative — `tesseract.js` (WASM)** : aucune dépendance système, mais télécharge les *traineddata* au premier appel → à **embarquer comme asset** (`ocr/assets/fra.traineddata`) pour rester offline/déterministe en docker.
- **Smoke** : `ocr/assets/sample-*.png` (image d'exemple avec un texte connu) ; le test vérifie que `extract()` renvoie un `text` non vide contenant un mot attendu et une `confidence` numérique — **prouve le binding**, pas la qualité d'extraction réelle.
- **Pluggabilité (DO-1)** : un `FakeOcrProvider` injectable en test remplace Tesseract sans toucher au futur consommateur → garantit que « basculer d'OCR ne modifie pas le code métier » (critère tech-spec).

### `storage/` — MinIO **lecture seule** (dérivé, amputé, du `StorageModule` kyc)

- Client `minio` partagé (même factory que `kyc-service` : `endPoint`/`port`/`useSSL`/`accessKey`/`secretKey` depuis `configuration.ts`).
- Service **`DocumentStorageReader`** (classe abstraite + impl MinIO) : `getObject(key): Promise<Buffer>` (stream MinIO → buffer) et `statObject(key)` (taille/`Content-Type` sans télécharger). Bucket = `MINIO_BUCKET` (`kyc-documents`).
- **Aucune écriture ni création de bucket** : le bucket est possédé et créé par `kyc-service` (`StorageBootstrapService` côté kyc). document-service suppose son existence (l'indicateur health `bucketExists` le confirme sans le créer).
- **Sécurité données** : lecture seule, `orgId` isolé (les clés MinIO sont préfixées par tenant côté kyc — `kyc/<tenantId>/<uuid>` — document-service ne lira que la `storageKey` fournie par l'événement en STORY-042) ; **le contenu binaire n'est jamais journalisé**.

### `auth/jwt.strategy.ts` — relying party (copie du patron `bilan-service`)

- `passport-jwt` + `jwks-rsa` (`secretOrKeyProvider`), `algorithms: ['RS256']`, `issuer`, `audience: 'document-service'`. `validate(payload)` mappe `org → tenantId` (peuple `TenantContext`) et expose `{ userId: sub, roles, emailVerified }`. **`org: null`** (PLATFORM_ADMIN) → `tenantId: null`.
- Env requis (`env.validation.ts`) : `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE`, `MINIO_*` (endpoint/port/keys/bucket). **Pas** de `JWT_ACCESS_SECRET`, **pas** d'`AUTH_MODE`.

### Bloc compose (à ajouter, calqué sur `bilan-service` + accès `minio`)

```yaml
  document-service:
    build: { context: ./document-service, target: runtime }
    env_file: ./document-service/.env
    environment:
      AUTH_JWKS_URI: ${AUTH_JWKS_URI:-http://auth-service:3001/.well-known/jwks.json}
      AUTH_ISSUER:   ${AUTH_ISSUER:-prospera-auth}
      AUTH_AUDIENCE: ${DOCUMENT_AUTH_AUDIENCE:-document-service}
      MONGODB_URI:   ${DOCUMENT_MONGODB_URI:-mongodb://mongo:27017/document_service?replicaSet=rs0}
      KAFKA_BROKERS: ${DOCUMENT_KAFKA_BROKERS:-kafka:9092}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT:-minio}
      MINIO_PORT:     ${MINIO_PORT:-9000}
      MINIO_USE_SSL:  ${MINIO_USE_SSL:-false}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin}
      MINIO_BUCKET:   ${MINIO_BUCKET:-kyc-documents}
    ports: ['3006:3006']
    depends_on:
      mongo: { condition: service_healthy }
      kafka: { condition: service_healthy }
      minio: { condition: service_healthy }
    healthcheck: { test: [...'http://localhost:3006/api/v1/health'...], interval: 10s, retries: 5, start_period: 20s }
    restart: unless-stopped
```

Et sur le bloc **`auth-service`** existant (env, pas de code) — **ajouter** `document-service` à la liste déjà posée par STORY-031/035 :

```yaml
    environment:
      # IDP_AUTH_AUDIENCE pilote l'aud émis par l'IdP
      AUTH_AUDIENCE: ${IDP_AUTH_AUDIENCE:-expert-comptable,kyc-service,platform-catalog-service,bilan-service,document-service}
```

### Sécurité

- Relying party **pur** : validation RS256/JWKS uniquement, aucun secret de signature partagé, aucune émission de jeton. `algorithms: ['RS256']` **imposé** (anti *algorithm-confusion*).
- `issuer` (`prospera-auth`) et `audience` (`document-service`) **vérifiés** ; un jeton d'`aud` incorrecte est refusé (401).
- **MinIO en lecture seule** : les identifiants fournis ne servent qu'à lire `kyc-documents` (idéalement une policy MinIO restreinte en lecture — durcissement possible, non bloquant au scaffold dev). **Le contenu des pièces n'est jamais journalisé** (NFR tech-spec §Sécurité).
- Isolation `orgId` : document-service ne lit que la `storageKey` signée fournie par l'événement (STORY-042) ; aucune énumération du bucket.

### Cas limites / points d'attention

- **⚠️ `aud` de l'IdP.** L'IdP émet l'`aud` piloté par env (`IDP_AUTH_AUDIENCE`/`configuration.ts`) ; STORY-031/035 y ont déjà ajouté `platform-catalog-service` et `bilan-service`. Un jeton réel n'aura `document-service` dans son `aud` **que** si on **ajoute** `document-service` à cette liste sur le bloc `auth-service` du compose. Sans cela le service refuse (401). **Aucun changement de code `auth-service`.** Les e2e **mintent leurs propres tokens RS256** (paire de clés de test) avec la bonne `aud`, indépendants de l'IdP.
- **⚠️ Tesseract dans la CI et l'image.** L'étape de test du provider a besoin du moteur OCR. **Option binaire** : ajouter `tesseract-ocr`/`tesseract-ocr-fra` au stage `runtime` du Dockerfile **et** installer le binaire dans le job CI (ou tester le provider derrière un `FakeOcrProvider` en unit + réserver le vrai Tesseract au smoke/e2e docker). **Option `tesseract.js`** : embarquer `fra.traineddata` en asset pour éviter tout téléchargement réseau en CI. Trancher à l'implémentation ; le **smoke réel** (vrai Tesseract) doit tourner **au moins** dans la vérif docker.
- **MinIO au scaffold** : aucune pièce n'est encore lue (le consumer arrive STORY-042). L'indicateur health `minio` (`bucketExists('kyc-documents')`) prouve la connectivité + la présence du bucket **sans le créer**. Si le bucket n'existe pas encore (kyc jamais démarré), l'indicateur peut être `down` sans bloquer le boot — la vérif docker suppose la stack complète (kyc a créé le bucket).
- **Kafka au scaffold** : le `KafkaModule` n'ouvre **aucun** consumer/producer ; il n'expose que la sonde de santé. **Aucun groupe de consommateurs** tant que STORY-042 n'est pas livrée (évite un consumer orphelin sans handler).
- **Quirk Docker Desktop** (observé STORY-031/032/035) : l'image `runtime` peut sortir sans `dist/` si des attestations sont activées — non bloquant, la stack tourne via l'override `target: base` en dev, la CI construit `runtime` sur Linux.
- **Port `:3006`** : port assigné par le plan/tech-spec/`sprint-status` (le `:3005` est réservé à l'amorce `admin-panel` BFF — EPIC-016 / STORY-046). Ne pas réattribuer.

---

## Dependencies

**Stories prérequises :**
- **STORY-024** (JWKS exposé par l'IdP — `GET /.well-known/jwks.json`) : **indispensable**, la stratégie relying party valide contre ce endpoint.
- **STORY-022** (compose racine existant + IdP `:3001`) : le nouveau bloc s'y ajoute, il n'est pas recréé.
- **STORY-035** (`bilan-service`) : **patron de scaffold direct** (relying party pur le plus récent, `KafkaModule` client-seul, matrice CI multi-services, `AUTH_AUDIENCE` IdP pilotable par env).
- **STORY-011/013** (`StorageModule` MinIO de `kyc-service`) : **source à dériver** pour le client MinIO (amputé en lecture seule).
- **STORY-040** (kyc émet `kyc.document.uploaded` v1, bucket `kyc-documents` peuplé) : **pas requis pour compiler/démarrer le scaffold**, mais c'est le contrat que STORY-042 consommera ; référencé ici (le bucket doit exister pour la vérif docker de l'indicateur MinIO).

**Stories bloquées (débloquées par celle-ci) :**
- **STORY-042** (consumer `kyc.document.uploaded` + extraction RCCM/CFE) — a besoin du scaffold + `OcrProvider` + `StorageModule` lecture + `KafkaModule`.
- **STORY-043** (comparaison + producteur `document.extrait` outbox) — via STORY-042.
- **STORY-044** (persistance `DocumentExtraction` + GET) — via STORY-042/043.
- **STORY-045** (`kyc-service` consomme `document.extrait`) — via STORY-043.
- Stories OCR d'**Atelier Balance** (EPIC-018/020, STORY-079/081/084…) qui **étendent `document-service`** — s'appuient sur ce scaffold + `OcrProvider`.

**Dépendances externes :** Mongo + Kafka + **MinIO** déjà dans le compose racine ; **Tesseract** (binaire conteneurisé ou `tesseract.js` + traineddata) — nouvelle dépendance introduite par cette story.

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche `MNV-041` (branchée depuis `dev`, rebasée sur `origin/dev`).
- [ ] Tests unitaires écrits et verts (seuils Jest respectés) :
  - [ ] `jwt.strategy` : mapping `org → tenantId`, `org: null → tenantId: null`, claims exposés.
  - [ ] Configuration/env : boot échoue si `AUTH_JWKS_URI`/`ISSUER`/`AUDIENCE` ou `MINIO_*` manquent.
  - [ ] `HealthModule` : indicateurs `mongodb` + `kafka` + `minio`.
  - [ ] `OcrProvider` : abstraction injectable, `FakeOcrProvider` substituable ; `TesseractOcrProvider` mappe la sortie moteur → `OcrResult`.
  - [ ] `DocumentStorageReader` : `getObject`/`statObject` appellent le client MinIO sur le bon bucket ; **aucune** méthode d'écriture exposée.
- [ ] Tests e2e / smoke verts :
  - [ ] `GET /health` public → 200 (`mongodb` + `kafka` + `minio` up).
  - [ ] `GET /whoami` avec RS256 valide (`aud=document-service`) → 200, claims échoués.
  - [ ] Sans token → 401 ; **HS256 forgé** → 401 ; RS256 altéré → 401 ; `aud` incorrecte → 401.
  - [ ] **Smoke `OcrProvider`** : `extract()` (vrai Tesseract) renvoie un texte brut attendu + `confidence` sur l'image d'exemple.
- [ ] ESLint **0 warning**, build image `runtime` OK (Tesseract installé dans le stage runtime le cas échéant).
- [ ] **Vérification docker bout-en-bout** réalisée (les 6 apps `/health` 200 ; login IdP → JWT `aud` incl. `document-service` → `whoami` 200 ; smoke OCR vert ; négatifs 401) et consignée dans §Revue & validation.
- [ ] CI verte (matrice 6 services + Tesseract disponible pour le test OCR).
- [ ] `/code-review` passé.
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR `MNV-041(document-service): …` ouverte puis intégrée sur `dev` en **Rebase and merge**.
- [ ] `sprint-status.yaml` mis à jour (STORY-041 → done, note de vérification).

---

## Story Points Breakdown

- **Backend :** 3 points (scaffold relying party pur + health mongo/kafka/minio + Kafka squelette + compose + CI)
- **OCR + Storage :** 2 points (abstraction `OcrProvider` + impl Tesseract + smoke + `StorageModule` lecture seule dérivé de kyc + Dockerfile/CI Tesseract)
- **Frontend :** 0 point
- **Testing :** inclus (unit + e2e scaffold + smoke OCR)
- **Total :** 5 points

**Rationale :** aucune logique métier d'extraction ni schéma de domaine — duplication disciplinée d'un patron *relying party* déjà éprouvé (STORY-035/031), **plus** deux briques spécifiques nouvelles (provider OCR pluggable + accès MinIO lecture) qui justifient les 2 points au-delà d'un scaffold nu. La complexité réelle (consumer idempotent, extraction RCCM/CFE, comparaison, outbox, persistance) est portée par STORY-042/043/044.

---

## Additional Notes

- **Invariant DO-1.** Le scaffold ne matérialise aucune décision d'approbation : `document-service` n'écrit jamais le statut KYC. L'`OcrProvider` renvoie du texte brut ; toute la logique « propose, ne décide pas » vit dans les stories suivantes + `kyc-service` + l'humain.
- **`declared` absent de l'événement.** `kyc.document.uploaded` v1 (STORY-040) **ne porte pas** les valeurs déclarées à l'inscription (kyc ne possède plus l'identité déclarée depuis le cutover STORY-030). La comparaison « déclaré vs lu » de STORY-043 devra résoudre le `declared` via un **read-model `identity.*`** local à `document-service` — **point de coordination STORY-042/043**, sans impact sur ce scaffold.
- **Nommage.** Le service se nomme `document-service` (plan/tech-spec/`sprint-status`, `:3006`, base `document_service`) — nom générique assumé car il **étendra** l'OCR au-delà du KYC (Atelier Balance EPIC-018/020 : Statuts, captures, factures).
- **Extensibilité.** L'`OcrProvider` posé ici est la **fondation OCR partagée** de tout PROSPERA ; les futurs types de documents réutilisent l'abstraction sans la modifier (nouveaux parseurs, mêmes patrons).

---

## Progress Tracking

**Status History :**
- 2026-07-14 : Créée par Scrum Master (BMAD create-story)
- 2026-07-14 : Implémentée + vérifiée docker par Claude (BMAD dev-story)

**Actual Effort :** ~5 points (conforme à l'estimation)

---

## Revue & validation

### Implémentation

Scaffold **calqué sur `bilan-service`** (STORY-035, le *relying party* pur le plus récent) : l'état de scaffold a été extrait (`git archive` du commit `f9fdf15` = « scaffold relying party RS256/JWKS + health ») puis re-marqué `document-service` et doté des **deux briques propres** au service.

- **Rebranding** : `bilan-service → document-service`, base `bilan_service → document_service`, port `3004 → 3006`, Swagger « PROSPERA — Document Service », `AUTH_AUDIENCE=document-service`, `KAFKA_CLIENT_ID=document-service`. Commentaires réorientés (consumer `kyc.document.uploaded`/producteur `document.extrait` au lieu de `entitlement.changed`/`kyc.status.changed`).
- **`OcrModule`** : `OcrProvider` (classe abstraite = token DI) → `extract(Buffer, {lang?}): Promise<OcrResult{text,confidence,provider}>`, **texte brut** uniquement. `TesseractOcrProvider` via **`tesseract.js`** (moteur **WASM**, `tesseract.js-core` local) — **offline** : traineddata `fra`+`eng` embarqués sous `src/ocr/assets/tessdata` (`.gz`), core résolu par `require.resolve('tesseract.js-core')`, cache éphémère par appel, worker créé/détruit à chaque `extract` (pooling = optimisation STORY-042). `FakeOcrProvider` (constructeur sans dépendance, résoluble par la DI) prouve la **pluggabilité** (DO-1) : substitution par `{ provide: OcrProvider, useClass }` sans toucher au consommateur. **Aucun *parsing* RCCM/CFE** (STORY-042). Dockerfile inchangé (pas d'apt : `tesseract.js` est pur JS/WASM) ; `nest-cli.json` copie `ocr/assets/**` dans `dist`.
- **`StorageModule` lecture seule** : client `minio` partagé (même factory que `kyc-service`) + `DocumentStorageReader` (abstraction + impl MinIO) = `getObject(key)→Buffer` (stream concaténé) et `statObject(key)`. **Amputé** de toute écriture (par rapport au `StorageModule` de kyc) : **pas** de `putObject`/`removeObject`/`makeBucket`/`presignedGetUrl`, **pas** de `StorageBootstrapService` (kyc possède/crée le bucket). Un test vérifie explicitement l'absence de toute primitive d'écriture.
- **Health** : ajout de `MinioHealthIndicator` (`bucketExists('kyc-documents')`) → `/health` = mongo + kafka + **minio**. Pas de Redis.
- **Intégration** : bloc `document-service` ajouté au `docker-compose.yml` racine (`:3006`, `depends_on` minio `service_started` comme kyc, creds MinIO racine mappées `MINIO_ACCESS_KEY/SECRET_KEY`) + override hot-reload + IdP `AUTH_AUDIENCE` étendu à `…,bilan-service,document-service` (env, aucun code `auth-service`) ; CI en matrice **6 services** (+ base `document_service_test`, env MinIO factice — le smoke OCR tourne offline, aucun broker/minio réel requis en CI).

### Qualité

- **ESLint** : 0 warning (`--max-warnings 0`).
- **Tests unitaires** : **85 tests / 18 suites** verts. **Couverture 99.43 % stmts / 85.22 % branches / 100 % funcs / 99.37 % lines** (seuils 65/90/90/90 tenus). Couverture ciblée : `TesseractOcrProvider` (mapping moteur→OcrResult, langue défaut/opts, sortie partielle, `terminate` même sur échec, **échec de terminate n'écrase pas le résultat**, **échec de createWorker propagé**) ; pluggabilité `OcrProvider`/`FakeOcrProvider` ; `DocumentStorageReader` (stream→Buffer, statObject, **absence d'écriture**) ; `MinioHealthIndicator` (up/absent/injoignable) ; env `MINIO_*` requis.
- **E2E** : **9 tests / 3 suites** verts — `/health` (mongo+kafka+**minio** simulés) ; `/whoami` RS256 mintés en test (valide, PLATFORM_ADMIN org null, non vérifié, **HS256 forgé → 401**, **aud incorrecte → 401**) ; **smoke OCR réel** (`test/ocr.e2e-spec.ts`) : vrai `TesseractOcrProvider` sur image d'exemple → texte brut + confiance.

### Vérification docker bout-en-bout (2026-07-14)

Stack `mongo` (rs0) + `kafka` + `minio` + `auth-service:3001` + `kyc-service:3002` (crée le bucket `kyc-documents`) + `document-service:3006` (override target `base`, hot-reload) — les 3 apps `healthy` :

- `GET :3006/api/v1/health` → **200** `{ mongodb: up, kafka: up, minio: { status: up, bucket: kyc-documents } }` (bucket créé par kyc, **lu** sans être créé ; pas de redis).
- Round-trip IdP : register → login (la vérif e-mail Mailhog non nécessaire ici, `/whoami` est `@AllowUnverified`) → **JWT RS256** dont `aud = [expert-comptable, kyc-service, platform-catalog-service, bilan-service, document-service]`.
- `GET :3006/api/v1/whoami` + ce jeton → **200** `{ sub, org, role: TENANT_ADMIN, emailVerified: false }` (validation **JWKS** de bout en bout prouvée contre le JWKS live de l'IdP).
- Négatifs : **sans jeton → 401** ; **HS256 forgé** (clé publique comme secret) **→ 401** (*algorithm-confusion* écartée) ; **payload altéré** (élévation de rôle, signature d'origine) **→ 401** ; **signature corrompue** (octet central) **→ 401**.
- **OCR réel dans le conteneur** : `TesseractOcrProvider.extract(sample.png, {lang:'eng'})` exécuté via `docker compose exec` sur le `dist` du conteneur → **provider=tesseract, confidence=94, texte extrait** — **offline** (traineddata embarqués, `tesseract.js-core` natif Linux de l'image), aucun accès réseau.
- Logs `document-service` : « Nest application successfully started », 0 erreur (les seuls WARN sont les 401 des tests négatifs).

### /code-review (high) & intégration

- **`/code-review` (high)** sur le diff `MNV-041` → **5 constats**, **2 corrigés** (robustesse OCR) : (1) `TesseractOcrProvider.extract()` — le dossier cache temp (`mkdtempSync`) **fuyait si `createWorker()` échouait** → déplacé sous un `finally` externe qui nettoie `cachePath` même en cas d'échec de création ; (2) `worker.terminate()` (finally interne) **pouvait masquer** le résultat/erreur d'OCR primaire → enveloppé d'un `.catch` loggé. +2 tests unitaires. **3 constats mineurs/différés notés pour STORY-042** : `FakeOcrProvider` compilé dans `dist` (test double en prod), worker créé par appel sans pooling (`cacheMethod:'none'` re-gunzip les traineddata), `getObject` bufferise l'objet entier en mémoire (sans garde de taille).
- **Intégration** : dépôt **`prospera-ocr-service`** (créé par l'user — nom `prospera-ocr-service` et non `prospera-document-service`, il décrit la fonction OCR). `git init`, identité vivianMoneyVibesGroupes, `dev` basé sur `origin/main` (README), scaffold + fix revue sur **`MNV-041`**, poussé `dev` + `MNV-041`. **PR #1 `MNV-041(document-service): …` → `dev` en « Rebase and merge »** (dev HEAD `415dc6e`), branche supprimée après merge.

### Points d'attention

- **`.env.example` — reliquat.** L'édition des fichiers `.env*` est **bloquée par la sandbox** (cf. STORY-075) : le `.env.example` copié référence encore les valeurs `bilan-service` (port 3004, base `bilan_service`, `AUTH_AUDIENCE=bilan-service`, sans `MINIO_*`/`OCR_LANG`). **Impact nul en dev** : le bloc compose de `document-service` **n'utilise pas** `env_file` — il fournit toutes les variables via `environment:` (defaults corrects). À corriger hors sandbox (documentation uniquement).
- **Moteur OCR — choix `tesseract.js` (WASM) plutôt que binaire** : retenu car le binaire `tesseract` **n'est pas présent** sur l'hôte de dev et l'image `runtime` a été flaky sur des stories antérieures (attestations Docker Desktop) ; `tesseract.js` tourne dans l'image `base` node-only **et** sur l'hôte **et** en CI, sans apt, offline (traineddata embarqués). L'abstraction `OcrProvider` reste neutre : basculer vers un binaire ou un OCR managé ne changera que la liaison `useClass`.
- **`declared` absent** de `kyc.document.uploaded` v1 (STORY-040) — sera résolu via un read-model `identity.*` en STORY-042/043 (rappelé dans `AccessTokenPayload` et le périmètre). Sans impact sur ce scaffold.
- **Vérif docker sur sous-ensemble** (auth+kyc+document, non les 6 apps) : cohérent avec la pratique STORY-035 ; les 3 apps non démarrées (EC/catalog/bilan) sont **inchangées** par cette story (ajout purement additif — seul l'`AUTH_AUDIENCE` de l'IdP a été **étendu**, jamais réduit). La CI construit et teste les **6** images.

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
