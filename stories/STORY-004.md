# STORY-004 : Inscription tenant + super-admin de compte

**Epic :** EPIC-001 — Comptes & authentification
**Réf. architecture :** S1.1
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian (+ IA)
**Créée le :** 2026-07-02
**Sprint :** 1
**Couvre :** FR-001

---

## User Story

En tant que **gérant de cabinet comptable**,
je veux **créer le compte de mon cabinet et en devenir automatiquement l'administrateur (super-admin de compte)**,
afin de **démarrer sur la plateforme et pouvoir ensuite inviter mes collaborateurs, soumettre mon KYC et souscrire un abonnement**.

---

## Description

### Contexte

EPIC-000 (STORY-001/002/003) a livré le socle : squelette NestJS + config validée, infrastructure `docker compose` (MongoDB **replica set single-node** → transactions disponibles, Redis/Bull, MinIO, Mailhog), logging pino corrélé par `requestId`, filtre d'exceptions uniforme et `TenantContext`. STORY-004 ouvre **EPIC-001** avec le tout premier flux métier : l'**inscription d'un cabinet**.

C'est le point d'entrée du parcours d'activation décrit dans l'architecture (§Flux) :

> `POST /auth/register` → création `Tenant` + `User` (rôle `TENANT_ADMIN`) → job Bull « e-mail de vérification » → l'utilisateur clique le lien → `emailVerifiedAt` renseigné.

Deux propriétés sont critiques ici :

- **Atomicité (D4 / réplica set)** : un `Tenant` et son `User` administrateur naissent **ensemble ou pas du tout**. Un échec partiel (ex. échec d'écriture du User après création du Tenant) ne doit laisser **aucun orphelin** en base. On utilise une **transaction Mongo** (session), rendue possible par le replica set fourni en STORY-002.
- **Unicité globale de l'e-mail (D3)** : un e-mail = un utilisateur = un tenant. L'index unique `{ email: 1 }` garantit qu'un même e-mail ne peut pas créer deux comptes ; une tentative de doublon échoue **sans divulguer** d'information exploitable (pas d'énumération de comptes, pas de stacktrace).

Cette story **crée les schémas `Tenant` et `User`** (partagés par tout EPIC-001/002/003) ainsi que les modules `AuthModule`, `TenantsModule`, `UsersModule`. Elle **ne délivre pas** de session (login/JWT → STORY-005) et **ne génère pas** le token de vérification ni l'e-mail réel (→ STORY-006) : elle ne pose que le **point d'accroche** (mise en file d'un job) que STORY-006 viendra consommer.

### Périmètre

**Inclus :**
- **Schéma `Tenant`** (`src/modules/tenants/schemas/tenant.schema.ts`) conforme à l'architecture : `name`, `slug` (unique, dérivé du nom), `phone?`, `country` (défaut `TG`), `address?`, `status` (défaut `ACTIVE`), `kycStatus` (défaut `PENDING_DOCUMENTS`), `createdBy`. Index `{ slug: 1 }` unique, `{ kycStatus: 1 }`.
- **Schéma `User`** (`src/modules/users/schemas/user.schema.ts`) conforme à l'architecture : `tenantId?`, `email` (unique global), `passwordHash?`, `firstName`, `lastName`, `role`, `status`, champs `emailVerified*`, `refreshTokenHash?`, `lastLoginAt?`. Index `{ email: 1 }` unique, `{ tenantId: 1, role: 1 }`. Enums `Role`, `UserStatus`, `TenantStatus`, `KycStatus`.
- **Endpoint public `POST /api/v1/auth/register`** (`@Public()`) : DTO validé (`class-validator`), crée en **une transaction** un `Tenant` (`kycStatus: PENDING_DOCUMENTS`, `status: ACTIVE`, sans abonnement) et son `User` `TENANT_ADMIN` (`status: ACTIVE`, `emailVerifiedAt` non renseigné).
- **Hash du mot de passe** bcrypt **cost 12** ; mot de passe ≥ 8 caractères imposé côté serveur (DTO).
- **Dérivation du `slug`** à partir de `name` (normalisation des accents/espaces) avec **stratégie de collision** (voir Décisions ouvertes).
- **Point d'accroche « vérification e-mail »** : mise en file d'un job Bull (file `mail`) portant l'`userId`, sans générer le token ni envoyer l'e-mail (seam pour STORY-006).
- **Réponse 201** minimale (identifiants tenant/user + message invitant à vérifier l'e-mail), **sans JWT**.
- **Documentation Swagger** de l'endpoint (schéma de requête/réponse, codes 201/400/409).
- **Tests** unitaires (service) + e2e (parcours d'inscription, doublon, mot de passe faible, atomicité).

**Hors périmètre :**
- **Login / refresh / logout / guards JWT** → **STORY-005** (aucun token émis ici).
- **Génération du token de vérification, template, envoi réel et `EmailVerifiedGuard`** → **STORY-006** (STORY-004 ne fait qu'**enfiler** le job).
- **Seed du `PLATFORM_ADMIN`** (`tenantId: null`) → **STORY-007**.
- **`TenantScopedRepository` et tests d'isolation** → **STORY-010** (le register est public, hors périmètre tenant scoping).
- **Rate limiting** (`@nestjs/throttler`) → introduit en **STORY-005** (chaîne de guards / throttler global).
- Mise à jour du profil tenant (`PATCH /tenant`), invitation d'utilisateurs (`POST /users`) → EPIC-002.

### Flux (utilisateur)
1. Le gérant appelle `POST /api/v1/auth/register` avec `{ cabinetName, email, password, firstName, lastName, phone?, country?, address? }`.
2. Le `ValidationPipe` global valide le DTO (e-mail bien formé, mot de passe ≥ 8, champs requis présents) ; sinon 400 au format uniforme (`requestId`).
3. Le service **ouvre une transaction** : il génère les identifiants, hash le mot de passe (bcrypt 12), dérive un `slug` unique depuis `cabinetName`, insère le `Tenant` puis le `User` `TENANT_ADMIN` (références croisées `User.tenantId` / `Tenant.createdBy`), puis **commit**.
4. En cas d'e-mail déjà pris (conflit d'index unique) ou de toute erreur, la transaction est **abortée** → aucun orphelin ; réponse d'erreur générique **sans divulgation**.
5. Après commit, un **job « e-mail de vérification »** est mis en file (`mail`) avec l'`userId`.
6. Réponse **201** : `{ tenantId, slug, userId, email, message: "Compte créé. Vérifiez votre e-mail." }` — l'utilisateur devra vérifier son e-mail (STORY-006) puis se connecter (STORY-005).

---

## Acceptance Criteria

- [ ] `POST /api/v1/auth/register` est **public** (`@Public()`), documenté dans Swagger, et accepte un DTO validé `{ cabinetName, email, password, firstName, lastName, phone?, country?, address? }` (`whitelist`/`forbidNonWhitelisted` déjà actifs) ; un champ manquant/invalide → **400** au format uniforme `{ statusCode, error, message, requestId }`.
- [ ] Le mot de passe est **≥ 8 caractères** (validation serveur, DTO) ; en dessous → 400 explicite.
- [ ] L'inscription crée un `Tenant` **et** son `User` `TENANT_ADMIN` de façon **atomique** (transaction Mongo) : en cas d'échec partiel, **aucun orphelin** ne subsiste (Tenant sans User ni l'inverse) — **vérifié par un test** simulant une erreur après la première insertion.
- [ ] L'**e-mail est unique globalement** (index `{ email: 1 }` unique) ; un doublon → **erreur sans divulgation** (message générique ne confirmant pas l'existence d'un compte, aucune stacktrace, code de statut cohérent — cf. Décisions ouvertes).
- [ ] Le mot de passe est **hashé bcrypt (cost 12)** ; il n'est **jamais** renvoyé dans une réponse ni écrit en clair dans les logs (redaction déjà en place).
- [ ] Le `Tenant` est créé avec `kycStatus = PENDING_DOCUMENTS`, `status = ACTIVE`, **sans abonnement**, `createdBy` = id du User créé, et un **`slug` unique** dérivé de `cabinetName` (accents/espaces normalisés).
- [ ] Le `User` est créé avec `role = TENANT_ADMIN`, `status = ACTIVE`, `emailVerifiedAt` **non renseigné**, `passwordHash` défini, `tenantId` = id du Tenant créé.
- [ ] La réponse de succès est **201** avec une charge minimale (`tenantId`, `slug`, `userId`, `email`, message) et **aucun JWT** (l'authentification est livrée en STORY-005).
- [ ] Un **job « e-mail de vérification »** est **mis en file** (file `mail`) après le commit, portant l'`userId` — la **génération du token et l'envoi réel** relèvent de STORY-006 ; un échec d'enfilement ne corrompt pas le compte créé (comportement documenté/loggué).
- [ ] `docker compose up` fonctionne toujours ; les tests STORY-001/002/003 restent **verts** ; **lint 0 warning** ; le **seuil de couverture** (STORY-003) est respecté.

---

## Technical Notes

### Composants / fichiers
```
src/modules/auth/auth.module.ts
src/modules/auth/auth.controller.ts            # POST /auth/register (@Public), Swagger
src/modules/auth/auth.service.ts               # orchestration inscription (transaction)
src/modules/auth/dto/register.dto.ts           # class-validator (email, password >= 8, noms…)
src/modules/auth/dto/register-response.dto.ts  # payload 201 (sans secret)

src/modules/tenants/tenants.module.ts
src/modules/tenants/tenants.service.ts         # création Tenant (dans la session), slug unique
src/modules/tenants/schemas/tenant.schema.ts   # + enums TenantStatus, KycStatus
src/modules/tenants/tenants.constants.ts       # noms d'enums / valeurs par défaut

src/modules/users/users.module.ts
src/modules/users/users.service.ts             # création User (dans la session), findByEmail
src/modules/users/schemas/user.schema.ts       # + enums Role, UserStatus

src/common/security/password.service.ts        # bcrypt hash/compare (cost 12) — réutilisé en STORY-005/008
src/common/utils/slug.util.ts                  # normalisation + dérivation de slug

src/app.module.ts                              # importe AuthModule (Tenants/Users importés par Auth)
```

> Les modules vont dans `src/modules/` (déjà présent, `.gitkeep`). `AuthModule` importe `TenantsModule` et `UsersModule` (cf. architecture §AuthModule : dépendances UsersModule, TenantsModule, MailModule).

### Dépendances npm à ajouter
- `bcrypt` (runtime) + `@types/bcrypt` (dev) — hash cost 12.
- `slugify` (^1.6) pour un `slug` robuste sur les raisons sociales accentuées (**ou** un utilitaire maison minimal `slug.util.ts` sans dépendance — au choix de l'implémenteur ; `slugify` recommandé pour la correction Unicode).
- Aucune dépendance JWT ici (`@nestjs/jwt`/passport arrivent en STORY-005).

### Schémas Mongoose (conformes à l'architecture)
- **`Tenant`** : `name` (required, trim), `slug` (required, unique, lowercase), `phone?`, `country` (défaut `'TG'`), `address?`, `status: TenantStatus` (défaut `ACTIVE`), `kycStatus: KycStatus` (défaut `PENDING_DOCUMENTS`), `kycReviewedAt?/kycReviewedBy?/kycRejectionReason?` (posés mais non utilisés ici), `createdBy: ObjectId(ref User)`. Index : `{ slug: 1 }` unique, `{ kycStatus: 1 }`.
- **`User`** : `tenantId?: ObjectId(ref Tenant)` (index ; `null` réservé au `PLATFORM_ADMIN` de STORY-007), `email` (required, unique, lowercase, trim), `passwordHash?`, `firstName`/`lastName` (required), `role: Role`, `status: UserStatus` (défaut schéma `INVITED` mais **fixé à `ACTIVE` ici** — un auto-inscrit définit lui-même son mot de passe), champs `emailVerification*` (renseignés en STORY-006), `refreshTokenHash?`/`lastLoginAt?` (STORY-005). Index : `{ email: 1 }` unique, `{ tenantId: 1, role: 1 }`.
- **Enums** : `Role` (`PLATFORM_ADMIN | TENANT_ADMIN | TENANT_USER`), `UserStatus` (`INVITED | ACTIVE | SUSPENDED`), `TenantStatus` (`ACTIVE | SUSPENDED`), `KycStatus` (`PENDING_DOCUMENTS | UNDER_REVIEW | APPROVED | REJECTED`). Placés dans des fichiers d'enum réutilisables (KYC les réutilisera en EPIC-003).
- Enregistrement via `MongooseModule.forFeature([...])` dans chaque module.

### Inscription atomique (transaction)
- Récupérer la `Connection` Mongoose (`@InjectConnection()`), `session = await connection.startSession()`, `session.startTransaction()`.
- **Pré-générer les ObjectId** (`new Types.ObjectId()`) du tenant et de l'utilisateur pour poser les références croisées **avant** insertion : `user.tenantId = tenantId`, `tenant.createdBy = userId`.
- Insérer `Tenant` puis `User` **avec `{ session }`**, puis `commitTransaction()`. `try/catch/finally` : `abortTransaction()` sur erreur, `endSession()` systématique.
- **Conflit d'unicité e-mail** : la duplicate-key (code Mongo **11000**) est interceptée → transaction abortée → mappée vers une erreur **générique sans divulgation** (voir Décisions ouvertes). Vérifier d'abord `usersService.findByEmail` **puis** s'appuyer sur l'index unique comme filet anti-course concurrente (double sécurité).
- Le hash bcrypt (coûteux) est calculé **avant** d'ouvrir la transaction pour ne pas la maintenir ouverte pendant le hashing.

### Point d'accroche « e-mail de vérification »
- Réutiliser le module de file existant (`src/queue/`, `queue.constants.ts`). Enfiler un job sur la file **`mail`** (ou émettre un event applicatif) avec `{ userId }`, **après** le commit de la transaction (ne jamais enfiler avant d'être certain que le compte existe).
- **STORY-004 n'implémente pas le consommateur** : la génération du token (aléatoire, TTL 24 h, hash sha256), le template et l'envoi Mailhog sont la matière de STORY-006. Ici, un producteur (et éventuellement un consumer **no-op** loggant « verification email pending ») suffit à matérialiser le seam.
- L'échec d'enfilement ne doit **pas** annuler l'inscription (le compte est déjà commité) : logguer en `warn` ; le renvoi de lien (STORY-006) couvrira le cas.

### Sécurité / hygiène
- `passwordHash` et tout secret **exclus** des réponses (DTO de réponse dédié, pas de renvoi de l'entité brute) et déjà rédigés dans les logs pino (`password`/`token` redaction — STORY-003).
- **Anti-énumération** : ne pas confirmer l'existence d'un e-mail (message d'erreur générique) — cf. Décisions ouvertes pour le niveau retenu.
- Validation stricte du DTO (`whitelist` + `forbidNonWhitelisted` déjà globaux) : impossible d'injecter `role`, `status`, `kycStatus`, `tenantId` via le corps de requête.
- `email` normalisé (lowercase/trim) avant unicité/hash de recherche.

### Points d'extension (seams pour les stories suivantes)
- **STORY-005** consommera `User.passwordHash`/`refreshTokenHash`, `PasswordService.compare`, et posera `JwtAuthGuard` + `@Roles`.
- **STORY-006** implémentera le consumer `mail` (token + envoi) et `EmailVerifiedGuard`.
- **STORY-007** créera le `PLATFORM_ADMIN` (`tenantId: null`) via seed en réutilisant `PasswordService` et le schéma `User`.
- **STORY-010** appliquera le tenant scoping aux modules Users/KYC/Billing (register reste public).

---

## Dependencies

**Stories prérequises :**
- **STORY-003** ✅ (socle transverse : filtre d'erreurs uniforme, `TenantContext`, logging, CI).
- **STORY-002** ✅ (replica set Mongo → transactions ; file Bull `mail` disponible).
- **STORY-001** ✅ (config validée, `ValidationPipe` global, préfixe `/api/v1`, Swagger).

**Stories débloquées / facilitées par celle-ci :**
- **STORY-005** (login/refresh/logout : a besoin d'un `User` avec `passwordHash`).
- **STORY-006** (vérification e-mail : consomme le job enfilé et les champs `emailVerification*`).
- **STORY-007** (seed `PLATFORM_ADMIN` : réutilise schéma `User` + `PasswordService`).
- **STORY-010** (`TenantScopedRepository` : s'appuie sur les schémas `Tenant`/`User`).

**Dépendances externes :** aucune (Mongo/Redis/Mailhog déjà fournis par `docker compose`). Ajout des paquets `bcrypt`/`@types/bcrypt` (+ `slugify` optionnel).

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité (`feature/STORY-004-inscription-tenant`).
- [ ] Tests :
  - [ ] Unitaire `AuthService.register` : chemin nominal (Tenant + User créés, rôles/statuts/kycStatus corrects, mot de passe hashé, job enfilé).
  - [ ] Unitaire **atomicité** : erreur simulée après l'insertion du Tenant → `abortTransaction` appelé, aucun document persistant (aucun orphelin).
  - [ ] Unitaire **doublon e-mail** : `findByEmail` existant **et** duplicate-key 11000 → erreur **générique** (aucune divulgation, pas de renvoi de l'entité).
  - [ ] Unitaire `PasswordService` (hash bcrypt cost 12, `compare` OK/KO) et `slug.util` (accents, espaces, collision).
  - [ ] e2e `POST /auth/register` : 201 (payload sans secret, `Tenant.kycStatus = PENDING_DOCUMENTS`, `User.role = TENANT_ADMIN`), doublon → erreur sans divulgation, mot de passe < 8 → 400.
- [ ] `npm run test:cov` passe **et** respecte le seuil configuré (STORY-003).
- [ ] Lint (0 warning) et build OK ; tests STORY-001/002/003 toujours verts.
- [ ] Endpoint documenté dans **Swagger** (`/api/docs`).
- [ ] `docker compose up` : inscription vérifiable de bout en bout (compte en base, job visible dans la file `mail`).
- [ ] `.env.example` mis à jour **si** une variable est ajoutée (a priori aucune ; le cost bcrypt est constant à 12).
- [ ] Revue de code (`/code-review`).
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **Schémas `Tenant` + `User` (+ enums, index) et câblage `MongooseModule.forFeature` :** 1 pt
- **`AuthService.register` transactionnel (session, références croisées, mapping d'erreurs) + `PasswordService` (bcrypt) :** 2 pts
- **DTOs + contrôleur + Swagger + dérivation `slug` :** 1 pt
- **Point d'accroche file `mail` + tests unitaires & e2e (dont atomicité et doublon) :** 1 pt
- **Total : 5 points**

**Rationale :** peu d'endpoints (un seul) mais deux points délicats justifient les 5 pts : la **transaction Mongo** avec références croisées et abort propre (le premier flux transactionnel du projet, à câbler correctement sur le replica set), et la gestion **anti-énumération** du doublon. Le reste (schémas, DTO, bcrypt, Swagger) est du code standard fortement accéléré par l'IA.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Stratégie de collision de `slug`** — deux cabinets de même raison sociale produisent le même `slug`, que l'index unique rejetterait, bloquant une inscription pourtant légitime.
   - **Recommandé :** en cas de collision, **suffixer** le slug (`-2`, `-3`, … ou un court suffixe base36) pour ne pas bloquer l'inscription. Le `slug` est un identifiant interne/URL, pas une contrainte métier d'unicité de nom.
   - *Alternative :* rejeter comme doublon (plus strict, mais crée une friction non justifiée pour des cabinets homonymes distincts).

2. **Niveau anti-énumération sur e-mail déjà pris** — le PRD impose « erreur sans divulgation ».
   - **Recommandé (phase 1) :** répondre par un **message générique** ne confirmant pas quel champ est en cause (ex. `409` « Impossible de créer le compte avec ces informations »), sans stacktrace ni détail d'index.
   - *Renforcement possible (dépend de STORY-006, e-mail) :* répondre **202** générique et, si l'e-mail existe déjà, envoyer un e-mail de notification au titulaire (« une inscription a été tentée avec votre adresse ») — masque totalement l'existence du compte. À reconsidérer une fois le `MailModule` livré ; noté ici, non retenu par défaut en phase 1.

### Notes diverses
- **`UserStatus` à l'inscription :** le schéma a `INVITED` par défaut (adapté aux invités de STORY-008 qui n'ont pas encore de mot de passe). L'auto-inscrit définit son mot de passe **immédiatement** : on force donc `status = ACTIVE`. L'accès aux modules restera néanmoins verrouillé par la vérification e-mail (STORY-006) puis le KYC/abonnement (STORY-014), pas par `UserStatus`.
- **Pas de JWT ici :** après inscription, l'utilisateur devra **se connecter** (STORY-005). Ne pas être tenté d'émettre un token « pour aller plus vite » — cela court-circuiterait la chaîne de guards à venir.
- **Réutilisabilité :** `PasswordService` et `slug.util` sont posés dans `common/` car réutilisés par STORY-005 (compare), STORY-007 (seed) et STORY-008 (acceptation d'invitation).

---

## Progress Tracking

**Historique de statut :**
- 2026-07-02 : Créée (Scrum Master, BMAD)
- 2026-07-02 : Implémentée et terminée (Developer, BMAD)

**Effort réel :** 5 points (conforme à l'estimation).

**Décisions ouvertes — tranchées à l'implémentation :**
- **Collision de slug** → option recommandée retenue : **suffixe** (`base`, `base-2`, `base-3`, …) dérivé dans une boucle bornée (`TenantsService.deriveUniqueSlug`), l'index unique `{ slug: 1 }` restant le filet ultime. Vérifié en réel : deux « Cabinet Excellence » → `cabinet-excellence` puis `cabinet-excellence-2`.
- **Anti-énumération** → option phase 1 retenue : **`409` générique** « Impossible de créer le compte avec ces informations. » (ne cite jamais l'e-mail ni le champ en cause). Le renforcement `202` + e-mail de notification est reporté à STORY-006 (MailModule).

**Notes d'implémentation :**
- **Modules** : `AuthModule` (`src/modules/auth/`) importe `TenantsModule`, `UsersModule`, `MailModule`. `PasswordService` (bcrypt cost 12) est fourni **globalement** par `CommonModule` (réutilisable en STORY-005/007/008). Enums, schémas `Tenant`/`User` conformes à l'architecture (`{ slug:1 }`/`{ email:1 }` uniques ; `{ kycStatus:1 }` ; `{ tenantId:1, role:1 }`).
- **Inscription atomique** : `AuthService.register` ouvre une **transaction Mongo** (`connection.startSession()`), pré-génère les `ObjectId` pour poser les références croisées (`User.tenantId` ↔ `Tenant._id`, `Tenant.createdBy` ↔ `User._id`), insère Tenant puis User dans la session, `commit`/`abort`/`endSession`. Le hash bcrypt est calculé **hors** transaction. Doublon d'unicité (code 11000) → conflit générique.
- **Seam e-mail** : `MailModule` enregistre la file Bull `mail` + un `MailProcessor` no-op qui journalise la réception ; `AuthService` enfile `send-verification-email` **après commit** (échec d'enfilement non bloquant, loggé en `warn`). STORY-006 remplacera le corps du processor (token + template + envoi).
- **Sécurité** : `@Public()` sur `POST /auth/register` ; `passwordHash` jamais renvoyé (DTO de réponse dédié) ; `whitelist`/`forbidNonWhitelisted` bloquent l'injection de `role`/`status`/`tenantId` (vérifié : `property role should not exist`). Aucune nouvelle variable d'env (cost bcrypt constant) → `.env.example` inchangé.
- **Dépendances ajoutées** : `bcrypt` (^5.1.1) + `@types/bcrypt` (dev), `slugify` (^1.6). `package-lock.json` mis à jour.
- **Couverture** : exclusion générique `!**/*.processor.ts` (ex-`system.processor.ts`) ajoutée à `collectCoverageFrom` (le `MailProcessor` est du câblage no-op).

**Résultats de vérification :**
- Lint : **0 erreur / 0 warning** · Typecheck (`tsc --noEmit`) : **0 erreur** · Build (`nest build`) : OK (`dist/main.js`).
- Tests : **65 unitaires + 7 e2e** passants ; couverture globale **99.4 % statements / 76.8 % branches / 100 % functions / 99.3 % lines** (au-dessus des seuils 90/65/90/90). Suite `auth.service.spec` couvrant : chemin nominal (rôles/statuts/références croisées/enfilement), doublon sans divulgation, **atomicité (abort, aucun orphelin)**, mapping 11000, non-blocage sur échec d'enfilement.
- **`docker compose up` (stack réelle Mongo replica set + Redis)** :
  - `POST /auth/register` → **201** `{tenantId, slug:"cabinet-excellence", userId, email, message}` ; e-mail normalisé en minuscules.
  - Même e-mail → **409** générique `{statusCode:409, error:"Conflict", message:"Impossible de créer le compte…", requestId}` — aucune divulgation.
  - Même nom, autre e-mail → **201** slug **`cabinet-excellence-2`** (collision résolue dans la transaction).
  - Mot de passe < 8 → **400** format uniforme ; injection `role` → **400** `property role should not exist`.
  - Mongo : 2 tenants (`kycStatus=PENDING_DOCUMENTS`, `status=ACTIVE`, `country=TG`, `createdBy` cohérent) + 2 users (`role=TENANT_ADMIN`, `status=ACTIVE`, `passwordHash` **`$2b$12$…`**, `emailVerifiedAt` absent) ; **0 fuite de mot de passe en clair** ; aucun orphelin.
  - Redis : file `bull:mail:*` créée ; `MailProcessor` a bien reçu `send-verification-email` pour les deux `userId`.

**Reste (hors story) :** l'envoi effectif de l'e-mail de vérification (consumer `mail`, token, template, Mailhog) → **STORY-006** ; login/JWT → **STORY-005**. Le renforcement anti-énumération (`202` + notification) sera reconsidéré une fois le `MailModule` complet.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
