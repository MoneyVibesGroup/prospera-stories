# STORY-020 : Scaffold `kyc-service` (compose racine) + migration upload/statut + validation JWKS

**Epic :** EPIC-003 — Capacité partagée KYC (extraite en micro-service, rebasée sur `auth-service`)
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` (v1.1, §Périmètre / §Composants / §Données / §Authentification / §Orchestration) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Modèle de jetons RS256-JWKS
**Priorité :** Must Have
**Story Points :** 8
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-10. `kyc-service` créé (`:3002`, base `kyc_service`), *relying party* RS256/JWKS pur ; `StorageModule` + module KYC migrés depuis EC et ré-ancrés sur `TenantKycProfile` (source de vérité) ; e-mails/événements déférés STORY-021 ; retraits EC effectués ; CI en matrice 3 services. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-09
**Sprint :** 5
**Service :** kyc-service (`:3002`) — nouveau · (+ retraits dans expert-comptable)
**Couvre :** FR-005 (re-livraison de S3.1 + S3.2 au sein de `kyc-service`)

> **Story de migration + amorçage du 3ᵉ service.** La capacité KYC vit aujourd'hui **dans `expert-comptable`** (`modules/kyc/` + `storage/`, ancrée sur le read-model `OrgProfile` depuis le cutover STORY-030). Cette story l'**extrait** dans un micro-service autonome `kyc-service`, *relying party* pur d'`auth-service` (validation **RS256/JWKS**, comme EC après STORY-028/030), démarrable via le **compose racine existant** (créé en STORY-022). Elle **ne** ré-implémente **pas** la fonctionnalité : elle **déplace** et **ré-ancre** le code déjà livré (STORY-011/012), en remplaçant la source de vérité du statut (`OrgProfile.kycStatus`, propriété d'EC) par une collection **possédée** `TenantKycProfile` (clé `orgId`). La **publication d'événements `kyc.status.changed`**, le **read-model côté EC** et les **e-mails** sont **hors périmètre** → **STORY-021**, à livrer immédiatement derrière pour lever la régression temporaire (cf. §Cas limites).

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux que la capacité **KYC vive dans un micro-service autonome `kyc-service`**, démarrable via le compose racine et validant les jetons de l'IdP par **JWKS**,
afin qu'elle soit **réutilisable** par les futurs verticaux (Bilan, etc.) **sans dépendre du code d'`expert-comptable`**.

---

## Description

### Contexte

Le re-cadrage écosystème du 2026-07-04 (`architecture-prospera-ecosystem-2026-07-04.md`) a fait de PROSPERA un **écosystème de micro-services** : un IdP racine (`auth-service`, livré STORY-022→027), des verticaux *relying parties* (EC, cutover STORY-028→030) et des **capacités partagées**. Le **KYC** est la première capacité partagée : la vérification d'identité d'un cabinet n'est pas propre à `expert-comptable`, elle doit servir tout vertical (décision **K1**). L'EPIC-003 est donc **extrait** dans `kyc-service`, **rebasé après l'auth** : *relying party* d'`auth-service` (RS256/JWKS, non plus un secret HS256), source de vérité du statut KYC, futur producteur du topic Kafka `kyc.status.changed`.

Cette extraction se découpe en 4 stories (§Allocation du sprint-plan) : **STORY-020** (scaffold + migration du code + JWKS — *cette story*), **STORY-021** (événements `kyc.status.changed` + read-model + e-mails côté EC), **STORY-013** (revue admin globale), **STORY-014** (`TenantStateGuard` côté EC). STORY-020 est **structurante mais volontairement sans nouvelle fonctionnalité** : elle garantit une base **vérifiable en isolation** (le service démarre, valide un JWT réel via JWKS, rejoue le parcours upload→`UNDER_REVIEW` d'EC) avant que STORY-021 n'y branche le bus.

Trois livrables structurent la story :

- **Le nouveau projet `kyc-service/`** : NestJS 11 / Node 20, **calqué sur `auth-service` et `expert-comptable`** (Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` = Helmet + préfixe/versionnement `/api/v1` + `ValidationPipe` stricte + Swagger « PROSPERA — KYC Service », logger pino, `HealthModule`, seuils Jest **65/90/90/90**, ESLint **0 warning**), écoutant sur **`:3002`**, branché sur une **base Mongo dédiée `kyc_service`** (database-per-service, décision **K3**). Le **socle transverse `common/`** est **dupliqué** (choix assumé, décision **K4**), et la **stratégie JWT est `validate-only` en RS256/JWKS** (aucun endpoint d'auth, aucun secret de signature — la clé publique de l'IdP suffit).

- **Le déplacement du domaine KYC** : `StorageModule` (MinIO) et `modules/kyc/` (upload RCCM/CFE, magic-bytes, supersede, `GET /kyc/status`) sont **déplacés** depuis `expert-comptable` et **ré-ancrés** : le statut n'est plus lu sur `OrgProfile.kycStatus` (read-model propriété d'EC) mais sur une **collection possédée `TenantKycProfile`** (clé unique `orgId`, création *lazy* par upsert). La machine à états (`assertTransition`) pilote ce profil local. **Aucun e-mail** n'est envoyé par `kyc-service` (il ne connaît que des identifiants opaques) et **aucun événement** n'est publié ici (STORY-021).

- **L'intégration au compose racine existant** : un bloc `kyc-service` est **ajouté** au `docker-compose.yml` **racine déjà en place** (créé STORY-022) — on ne le recrée pas. Le service tire les défauts de dev (JWKS de l'IdP, MinIO), démarre après `mongo`/`kafka`, expose `:3002`, et la **CI** passe en matrice à **3 services**.

### Périmètre

**Dans le périmètre**
- Scaffold `kyc-service/` (projet, conventions, Dockerfile, `main.ts`, `HealthModule`, base `kyc_service`).
- Socle `common/` dupliqué + `auth/jwt.strategy.ts` **RS256/JWKS validate-only** (calquée sur EC STORY-028/030).
- `StorageModule` (MinIO) déplacé depuis EC.
- `modules/kyc/` déplacé et **ré-ancré** sur `TenantKycProfile` (nouvelle source de vérité, clé `orgId`).
- `KafkaModule` **squelette** (santé uniquement), pour dé-risquer STORY-021.
- Bloc `kyc-service` ajouté au compose racine + `.env.example`.
- **Retraits** correspondants dans `expert-comptable` (module KYC, storage, util, config MinIO).
- CI en matrice `[expert-comptable, auth-service, kyc-service]`.

**Hors périmètre (stories suivantes)**
- Contrat + **publication** `kyc.status.changed` (Kafka), **read-model** côté EC, **e-mails** → **STORY-021**.
- Revue admin globale (file, URLs présignées, approve/reject) → **STORY-013**.
- `TenantStateGuard` + matrice d'accès + re-soumission → **STORY-014**.
- Migration de **données** de dev (les volumes ont déjà été recréés en STORY-022 ; dev repart de zéro).

### Flux (mise en route)

1. `docker compose up` (racine) démarre `mongo` (rs0), `kafka`, `redis`, `minio`, `mailhog`, `expert-comptable:3000`, `auth-service:3001`, **`kyc-service:3002`**.
2. Un cabinet se connecte sur l'IdP (`auth-service:3001`) → obtient un **access token RS256** (`aud` contient déjà `kyc-service`, cf. §Dépendances).
3. Avec ce **même** token, il téléverse RCCM puis CFE sur `kyc-service` (`:3002` `POST /kyc/documents`). Le service **valide le JWT via JWKS** (pas de secret partagé), crée/complète le `TenantKycProfile` (*lazy*), stocke les fichiers dans le bucket privé.
4. Quand RCCM **et** CFE sont présents, le profil transitionne `PENDING_DOCUMENTS → UNDER_REVIEW`.
5. `GET /kyc/status` (`:3002`) renvoie `UNDER_REVIEW` + les documents `SUBMITTED` — **parité** avec le comportement STORY-011/012 au sein d'EC. *(Aucun e-mail ni événement à ce stade : STORY-021.)*

---

## Acceptance Criteria

- [ ] **Nouveau projet `kyc-service/`** (NestJS 11 / Node 20), conventions **calquées sur `auth-service`/`expert-comptable`** : Dockerfile multi-stage `base`/`build`/`runtime`, `main.ts` (Helmet, préfixe `/api/v1`, `ValidationPipe` stricte `whitelist`+`forbidNonWhitelisted`, Swagger « PROSPERA — KYC Service » sur `/api/docs`), logger pino, seuils Jest **65/90/90/90**, ESLint **0 warning**. L'app **écoute sur `:3002`**, base Mongo dédiée **`kyc_service`**.
- [ ] **`HealthModule`** : `GET /api/v1/health` = 200 avec `mongo: up` **et** `kafka: up` (aligné sur `auth-service`).
- [ ] **Socle transverse dupliqué (`common/`)** : `TenantContext` (nestjs-cls), `TenantScopedRepository`, guards `JwtAuthGuard`/`EmailVerifiedGuard`/`RolesGuard`, décorateurs `@Public`/`@Roles`/`@CurrentUser`/`@AllowUnverified`, filtres/intercepteurs, `file-signature.util`, enums `Role` **et** `KycStatus`, type `AccessTokenPayload`.
- [ ] **`auth/jwt.strategy.ts` — `validate-only`, RS256/JWKS uniquement** (calquée sur EC STORY-028/030) : résolution de clé via `jwks-rsa` (cache + rotation par `kid`), **`algorithms: ['RS256']` imposé** (anti *algorithm-confusion*), `issuer`/`audience` vérifiés. `AUTH_JWKS_URI` / `AUTH_ISSUER` / `AUTH_AUDIENCE` **requis** (boot échoue s'ils manquent) ; `AUTH_AUDIENCE=kyc-service`. La stratégie peuple `TenantContext` (`org → tenantId`) et `request.user` (`sub`, `roles`, `emailVerified`). **Aucun endpoint d'authentification, aucun secret de signature, aucune émission de token.**
- [ ] **`StorageModule` (MinIO) déplacé depuis EC** : `StorageService` abstrait (token DI) + `MinioStorageService` (`putObject`, `getPresignedUrl`) + `StorageBootstrapService` (création idempotente du **bucket privé**). Seul consommateur : `kyc-service`.
- [ ] **Module KYC déplacé et adapté** :
  - `KycController` : `POST /kyc/documents` (multipart, `@Roles(TENANT_ADMIN)`) et `GET /kyc/status` (`@Roles(TENANT_ADMIN, TENANT_USER)`) — comportement inchangé (magic-bytes, ≤ 10 Mo, `storageKey` = UUID, supersede du `SUBMITTED` précédent).
  - **Nouvelle collection `TenantKycProfile`** (source de vérité) : `tenantId` (= `orgId`) **unique**, `status` (`KycStatus`, défaut `PENDING_DOCUMENTS`), `rejectionReason?`, `reviewedAt?`, `reviewedBy?`, `submittedAt?` ; index `{ tenantId: 1 }` unique + `{ status: 1, submittedAt: 1 }`. **Création *lazy*** par `getOrCreate(orgId)` (upsert `$setOnInsert`, race-safe via l'index unique).
  - La machine à états (`assertTransition`, `PENDING_DOCUMENTS → UNDER_REVIEW → APPROVED | REJECTED`, re-soumission `REJECTED → UNDER_REVIEW`) pilote **`TenantKycProfile`** (plus `OrgProfile`). `onDocumentSubmitted` passe le profil en `UNDER_REVIEW` **une seule fois** (RCCM **et** CFE `SUBMITTED`) — **sans e-mail, sans événement**.
- [ ] **`KafkaModule` squelette** présent (client `kafkajs`, `kafka: up` en `/health`), calqué sur `auth-service` — **la publication de `kyc.status.changed` (contrat d'événements) est explicitement déférée à STORY-021**.
- [ ] **Bloc `kyc-service` ajouté au `docker-compose.yml` racine existant** : `build ./kyc-service` (target `runtime`), `ports '3002:3002'`, `env` (`AUTH_JWKS_URI` = `http://auth-service:3001/.well-known/jwks.json`, `AUTH_ISSUER=prospera-auth`, `AUTH_AUDIENCE=kyc-service`, `KAFKA_BROKERS=kafka:9092`, `MINIO_*`), `depends_on` `mongo`/`kafka` healthy (+ `minio`), `healthcheck` `/api/v1/health`. **Le compose racine n'est pas recréé** (il existe depuis STORY-022). `.env.example` de `kyc-service` fourni.
- [ ] **Retraits d'`expert-comptable`** : suppression de `modules/kyc/`, `storage/`, `common/utils/file-signature.util.*`, `MinioConfig`, et de leurs imports/enregistrements dans `app.module.ts`. Les **e2e KYC** sont **déplacés** dans `kyc-service/test/` (JWT RS256 mintés en test avec une paire de clés de test). **Non touchés** : les champs `kyc*` d'`OrgProfile` (deviennent read-model **pur**, figé jusqu'à STORY-021), l'enum `KycStatus` (`common/enums`, conservé côté EC), le template `kyc-submitted.hbs`, la branche KYC de `mail.processor` (réutilisés en STORY-021).
- [ ] **CI** (`.github/workflows/ci.yml`) : matrice `service: [expert-comptable, auth-service, kyc-service]` (lint → tests+couverture → e2e → build image, par service).
- [ ] **Parité fonctionnelle vérifiée docker bout-en-bout** : login IdP (`:3001`) → JWT RS256 → upload RCCM+CFE sur `:3002` → `GET /kyc/status` = **`UNDER_REVIEW`** ; JWT **HS256 forgé** ou **altéré** → **401** (algorithm-confusion écarté sur le service réel) ; accès sans token → 401 ; isolation : un document d'un cabinet n'est ni lu ni listé par un autre `orgId`.

---

## Technical Notes

### Arborescence (calquée sur `auth-service`/`expert-comptable`)

```
kyc-service/
├── Dockerfile                     # multi-stage base/build/runtime (copié)
├── .env.example                   # AUTH_JWKS_URI/ISSUER/AUDIENCE, MONGODB_URI, KAFKA_BROKERS, MINIO_*
├── nest-cli.json / tsconfig*.json / eslint.config.mjs / package.json
├── src/
│   ├── main.ts                    # Helmet + /api/v1 + ValidationPipe + Swagger « PROSPERA — KYC Service »
│   ├── app.module.ts
│   ├── config/                    # env.validation.ts (AUTH_* requis), configuration.ts
│   ├── common/                    # socle DUPLIQUÉ (context, database, guards, decorators, filters, interceptors, utils, enums)
│   ├── auth/jwt.strategy.ts       # RS256/JWKS validate-only (aucun endpoint)
│   ├── health/                    # /health (mongo + kafka)
│   ├── kafka/                     # client kafkajs — SQUELETTE (santé) ; publisher = STORY-021
│   ├── storage/                   # StorageModule MinIO (déplacé depuis EC)
│   └── modules/kyc/               # controller + services + repos + schemas (déplacés + ré-ancrés)
└── test/                          # e2e KYC (JWT RS256 mintés en test)
```

> **Redis/BullMQ volontairement omis** de `kyc-service` : aucun job interne en phase 1 (les e-mails sont l'affaire du **consommateur** EC, STORY-021). Le cache JWKS est celui de `jwks-rsa` (mémoire). À rajouter seulement si un besoin de file interne apparaît.

### `auth/jwt.strategy.ts` — relying party (copie du patron EC)

- `passport-jwt` + `jwks-rsa` (`secretOrKeyProvider`), `algorithms: ['RS256']`, `issuer`, `audience: 'kyc-service'`. `validate(payload)` mappe `org → tenantId` (peuple `TenantContext`) et expose `{ userId: sub, roles, emailVerified }`. **`org: null`** (PLATFORM_ADMIN) → `tenantId: null` (aucun accès cabinet, mais utile pour la future revue admin STORY-013).
- Env requis (`env.validation.ts`) : `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE`. **Pas** de `JWT_ACCESS_SECRET`, **pas** d'`AUTH_MODE` (RS256/JWKS-only dès l'origine — `kyc-service` naît après le cutover, il n'a jamais de dette HS256).

### `TenantKycProfile` (nouvelle source de vérité — remplace la dépendance `OrgProfile`)

```typescript
// modules/kyc/schemas/tenant-kyc-profile.schema.ts
@Schema({ timestamps: true })
export class TenantKycProfile {
  @Prop({ type: Types.ObjectId, required: true, unique: true }) tenantId: Types.ObjectId; // = orgId (claim JWT `org`)
  @Prop({ type: String, enum: KycStatus, default: KycStatus.PENDING_DOCUMENTS }) status: KycStatus;
  @Prop() rejectionReason?: string;
  @Prop() reviewedAt?: Date;
  @Prop({ type: Types.ObjectId }) reviewedBy?: Types.ObjectId; // userId PLATFORM_ADMIN (opaque)
  @Prop() submittedAt?: Date;                                   // dernier passage en UNDER_REVIEW
}
// index : { tenantId: 1 } unique ; { status: 1, submittedAt: 1 } (file de revue admin STORY-013)
```

- **Adaptation de `KycStatusService`** : injecter un `TenantKycProfileRepository` (`getOrCreate(orgId)`) à la place d'`OrgProfileService` ; **retirer** l'injection `MAIL_QUEUE` et `enqueueKycSubmittedEmail` (aucun e-mail). `getStatus()` lit `TenantKycProfile` (défaut `PENDING_DOCUMENTS` si absent) + documents `SUBMITTED`.
- **`KycDocument`** : schéma **inchangé** (`tenantId`, `type`, `storageKey`, `mimeType`, `size`, `version`, `status`, `uploadedBy`, `originalName`), simplement déplacé dans `kyc_service` ; les `ref: 'Tenant'`/`'User'` deviennent de simples `ObjectId` (pas de `populate` inter-bases).

### Bloc compose (à ajouter, calqué sur `auth-service`)

```yaml
  kyc-service:
    build: { context: ./kyc-service, target: runtime }
    env_file: ./kyc-service/.env
    environment:
      AUTH_JWKS_URI: ${AUTH_JWKS_URI:-http://auth-service:3001/.well-known/jwks.json}
      AUTH_ISSUER:   ${AUTH_ISSUER:-prospera-auth}
      AUTH_AUDIENCE: ${KYC_AUTH_AUDIENCE:-kyc-service}
      KAFKA_BROKERS: ${KYC_KAFKA_BROKERS:-kafka:9092}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT:-minio}   # + MINIO_ACCESS_KEY/SECRET/BUCKET/PORT
    ports: ['3002:3002']
    depends_on:
      mongo:   { condition: service_healthy }
      kafka:   { condition: service_healthy }
      minio:   { condition: service_started }
    healthcheck: { test: [...'http://localhost:3002/api/v1/health'...], interval: 10s, retries: 5, start_period: 20s }
    restart: unless-stopped
```

### Cas limites / points d'attention

- **⚠️ Régression temporaire (levée par STORY-021).** Tant que `kyc-service` ne **publie** pas `kyc.status.changed`, le read-model KYC d'EC (`OrgProfile.kycStatus`) **reste figé** et l'**e-mail de soumission est muet**. C'est **assumé** : STORY-021 est planifiée **immédiatement derrière** (même sprint 6). Aucune fonctionnalité EC ne dépend encore de ce statut en écriture (le `TenantStateGuard` arrive en STORY-014).
- **`aud` du jeton** : l'IdP émet **déjà** `aud: ['expert-comptable', 'kyc-service']` par défaut (`auth-service/src/config/configuration.ts` L124) → **aucune modification d'`auth-service`** requise ; `kyc-service` valide simplement que `aud` contient `kyc-service`.
- **Sécurité** : `kyc-service` ne peut pas vérifier l'existence réelle de l'organisation — l'`org` **signé** fait foi (K-sécurité). Bucket **privé** ; les URLs présignées (≤ 5 min) arrivent avec la revue admin (STORY-013).
- **Duplication du socle** (K4) : le `common/` et `jwt.strategy` sont copiés d'EC ; on factorisera en lib au 3ᵉ usage. `schemaVersion` (STORY-021) et l'architecture limitent la dérive.
- **Pas de perte de données ici** : les volumes ont déjà été recréés en STORY-022 ; l'ajout de la base `kyc_service` sur la même instance `mongo` est transparent (database-per-service logique).

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-011 / STORY-012** — code source KYC (upload/statut) à migrer.
- **STORY-022** — compose racine + Kafka (KRaft) : on **ajoute** le service, on ne recrée pas l'infra.
- **STORY-024** — RS256/JWKS émis par l'IdP (endpoint `/.well-known/jwks.json`) que `kyc-service` consomme.
- **STORY-028 / STORY-030** — patron `JwtStrategy` RS256/JWKS-only à répliquer + module KYC actuel (ancré `OrgProfile`) = **source de la migration**.
- *Déjà satisfait* : l'IdP inclut `kyc-service` dans l'`aud` du jeton (`configuration.ts` L124) — pas de changement `auth-service`.

**Stories débloquées / à suivre :**
- **STORY-021** — événements `kyc.status.changed` + read-model EC + e-mails (**à livrer immédiatement après** pour lever la régression).
- **STORY-013** — revue admin globale (file, URLs présignées, approve/reject).
- **STORY-014** — `TenantStateGuard` (read-model) + re-soumission.

**Dépendances externes :** MinIO et Kafka (déjà présents dans le compose racine).

---

## Definition of Done

- [ ] Code implémenté sur une branche `STORY-020` (convention : une branche par story).
- [ ] Tests unitaires écrits/migrés et **verts**, couverture ≥ seuils **65/90/90/90** :
  - [ ] `jwt.strategy` (mapping `org→tenantId`, `roles`, `emailVerified`).
  - [ ] `KycDocumentsService` (magic-bytes, taille, supersede, `storageKey` UUID).
  - [ ] `KycStatusService` (machine à états sur `TenantKycProfile`, transition unique RCCM+CFE, **sans** e-mail).
  - [ ] `TenantKycProfileRepository.getOrCreate` (idempotence/upsert).
- [ ] Tests e2e **migrés** dans `kyc-service/test/` et verts (upload → `UNDER_REVIEW`, isolation cross-org 404, 401 sans/mauvais token).
- [ ] **ESLint 0 warning**, build image Docker OK (3 services en CI verte).
- [ ] **Vérification docker bout-en-bout** (§ dernier AC) réalisée et journalisée dans « Revue & validation ».
- [ ] Retraits d'`expert-comptable` effectués ; EC compile/teste toujours vert (module KYC absent, `OrgProfile` intact).
- [ ] `/code-review` (niveau ≥ high) passée ; constats traités ou tracés.
- [ ] Story mise à jour (statut) dans `docs/sprint-status.yaml` ; commit **sur demande**.

---

## Story Points Breakdown

- **Scaffold + socle `common/` dupliqué + `jwt.strategy` RS256/JWKS + `HealthModule` + `KafkaModule` squelette :** 3 points
- **Migration `StorageModule` + `modules/kyc/` + ré-ancrage `TenantKycProfile` (nouvelle source de vérité) :** 3 points
- **Retraits EC + bloc compose + CI matrice 3 services + `.env.example` :** 1 point
- **Migration des tests/e2e + vérification docker de parité :** 1 point
- **Total : 8 points**

**Rationale :** pas de nouvelle logique métier (le domaine est déplacé, pas conçu), mais 3 chantiers transverses à coordonner (nouveau projet + JWKS + ré-ancrage de la source de vérité), la duplication disciplinée du socle, le retrait propre côté EC, et une vérification cross-service en environnement Docker. Cohérent avec les 8 pts de STORY-022 (scaffold auth-service).

---

## Additional Notes

- **Nommage `tenantId` vs `orgId`** : le socle dupliqué (`TenantContext.tenantId`) conserve `tenantId` ; sémantiquement `tenantId === orgId` (claim JWT `org`). On garde `tenantId` pour ne pas diverger du socle EC ; l'architecture v1.1 note l'équivalence.
- **Ordre de livraison** : STORY-020 puis **STORY-021 sans délai** (régression du read-model/e-mail). Ne pas clore le sprint sur STORY-020 seule si EC dépend déjà du statut en lecture ailleurs.
- **Réf. contrat d'événements** : la source de vérité du contrat `kyc.status.changed` (v1) est `architecture-kyc-service-2026-07-03.md` §Contrat d'événements — **implémenté en STORY-021**, pas ici.

---

## Progress Tracking

**Historique des statuts :**
- 2026-07-09 : Créée par vivian (BMAD Scrum Master — `/bmad:create-story`).
- 2026-07-10 : Implémentée + vérifiée docker bout-en-bout par Claude (BMAD dev-story). ✅ Done.

**Effort réel :** 8 points (conforme à l'estimation).

---

## Revue & validation (2026-07-10)

**Livré**
- **Nouveau service `kyc-service/`** calqué sur `auth-service`/`expert-comptable` : Dockerfile multi-stage, `main.ts` (Helmet + `/api/v1` + `ValidationPipe` + Swagger « PROSPERA — KYC Service »), pino, `HealthModule` (**mongo + kafka**, pas de Redis), seuils Jest 65/90/90/90, ESLint 0. Écoute `:3002`, base `kyc_service`.
- **Socle `common/` dupliqué** + `auth/jwt.strategy.ts` **RS256/JWKS validate-only** (`jwks-rsa`, `algorithms:['RS256']`, `iss`/`aud` requis, `AUTH_AUDIENCE=kyc-service`). `AuthModule` **sans contrôleur** (aucun endpoint d'auth). `KafkaModule` squelette (santé). `StorageModule` (MinIO) déplacé depuis EC.
- **Module KYC ré-ancré** : nouvelle collection possédée **`TenantKycProfile`** (clé `tenantId`=`orgId` unique, création *lazy* par upsert) + `TenantKycProfileRepository` ; `KycStatusService` pilote ce profil, **sans e-mail ni événement** (retrait de la dépendance `OrgProfileService`/`MAIL_QUEUE`). `KycDocument` déplacé, `ref` retirés (opaques inter-bases).
- **Compose racine** : bloc `kyc-service` **ajouté** (le compose existait depuis STORY-022) + override hot-reload + `.env`/`.env.example`. **CI** en matrice `[expert-comptable, auth-service, kyc-service]` (+ DB de test `kyc_service_test`, env JWKS).
- **Retraits EC** : `modules/kyc/`, `storage/`, `common/utils/file-signature.util`, `MinioConfig`, imports `app.module` ; e2e KYC déplacés dans `kyc-service/test/`. `OrgProfile.kycStatus` → **read-model pur** (figé jusqu'à STORY-021, commentaires mis à jour).

**Tests**
- `kyc-service` : **lint 0**, build OK, **102 unit + 21 e2e** verts, couverture **99.78 / 86.4 / 100 / 99.76** (≫ 65/90/90/90).
- `expert-comptable` (après retraits) : **lint 0**, build OK, **116 unit + 18 e2e** verts.

**Vérification docker bout-en-bout** (stack racine : `expert-comptable:3000`, `auth-service:3001`, `kyc-service:3002`, `mongo` rs0, `kafka` KRaft, `minio`, `mailhog`) :
- `/health` des 3 apps → 200 (kyc-service : `mongodb` + `kafka` up, **pas de redis** — conforme).
- `register` IdP `:3001` → e-mail Mailhog → `verify-email` → `login` → **JWT RS256** décodé : `alg RS256` + `kid`, `org`/`roles:[TENANT_ADMIN]`/`emailVerified:true`, `iss:prospera-auth`, **`aud:[expert-comptable, kyc-service]`** (l'IdP inclut déjà `kyc-service` — aucun changement auth-service).
- `:3002` `GET /kyc/status` (avant upload) → **`PENDING_DOCUMENTS`** ; `POST /kyc/documents` RCCM (pdf) + CFE (jpeg) → **201** (magic-bytes, MinIO) ; `GET /kyc/status` → **`UNDER_REVIEW`** (2 docs) — **parité STORY-011/012 préservée**.
- Négatifs : sans token → **401** ; **HS256 forgé** (mêmes claims) → **401** (*algorithm-confusion* écartée sur le service réel) ; RS256 altéré → **401** ; `GET /auth/me` → **404** (kyc-service n'expose aucun endpoint d'auth).

**Écarts / suites**
- **Régression temporaire assumée** (levée par STORY-021) : `kyc-service` ne publie pas encore `kyc.status.changed` → read-model KYC d'EC figé + e-mail de soumission muet.
- **Reste** : `/code-review` formel (niveau ≥ high) ; **STORY-021** (événements + read-model + e-mails) à enchaîner ; commit **sur demande** (branche `STORY-020`, `kyc-service` = nouveau dépôt git à initialiser).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
*Prochaine étape : `/bmad:dev-story STORY-020` pour démarrer le développement, puis STORY-021 (événements + read-model + e-mails).*
