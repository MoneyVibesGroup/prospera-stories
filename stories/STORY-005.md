# STORY-005 : Authentification — login / refresh rotatif / logout + guards

**Epic :** EPIC-001 — Comptes & authentification
**Réf. architecture :** S1.2
**Priorité :** Must Have
**Story Points :** 8
**Statut :** ✅ Completed
**Assigné à :** vivian (+ IA)
**Créée le :** 2026-07-02
**Sprint :** 1
**Couvre :** FR-003, NFR-001 (partiel : JWT rotatif, rate limiting login)

---

## User Story

En tant qu'**utilisateur d'un cabinet (super-admin ou collaborateur)**,
je veux **me connecter et rester authentifié de façon sécurisée**,
afin d'**accéder à mon espace sans me reconnecter en permanence, tout en gardant mes données financières protégées**.

---

## Description

### Contexte

STORY-004 a livré l'**inscription** : un `Tenant` et son `User` `TENANT_ADMIN` (`status: ACTIVE`, `passwordHash` bcrypt cost 12) sont créés atomiquement, mais **aucune session n'est émise** — l'utilisateur ne peut pas encore se connecter. STORY-005 branche l'**authentification stateless** décrite par l'architecture (§S1.2 / §Sécurité) :

> JWT access **15 min** + refresh **7 j rotatif** (hash stocké en base, révocable) ; `passport-jwt` ; `@nestjs/throttler` (global 100 req/min/IP, strict login 5/min) ; détection de réutilisation du refresh (réutilisation d'un refresh consommé ⇒ invalidation de la session).

C'est la story qui **rend le socle d'auth opérationnel** pour tout le reste du produit : elle pose les deux premiers maillons de la **chaîne de guards globale** (`JwtAuthGuard` puis `RolesGuard`) que les modules métier (Users, KYC, Billing, futur Bilan) consommeront par simple décorateur. Les squelettes déjà posés en STORY-003 sont ici **activés** :

- `@Public()` (métadonnée `IS_PUBLIC_KEY`) — le `JwtAuthGuard` la lit désormais pour exempter `register`/`login`/`refresh`.
- `@CurrentUser()` / interface `AuthenticatedUser` — `request.user` est désormais **réellement peuplé** par la stratégie JWT.

Trois propriétés sont critiques :

- **Rotation + détection de réutilisation** : chaque `POST /auth/refresh` **consomme** le refresh présenté et en émet un nouveau (le hash stocké tourne). Présenter un refresh **déjà consommé** (donc légitimement signé mais qui ne correspond plus au hash courant) est le signe d'un **vol de token** → on **invalide la session** (`refreshTokenHash` effacé), forçant une reconnexion. C'est la parade OWASP au *refresh token replay*.
- **Rate limiting du login** : `POST /auth/login` est plafonné à **5 tentatives/min/IP** (NFR-001) pour freiner le *credential stuffing* / *brute force*, en plus du throttler global 100 req/min/IP.
- **Réponses non divulgatrices** : identifiants invalides → **401 générique** (ne distingue jamais « e-mail inconnu » de « mot de passe faux »), cohérent avec l'anti-énumération de STORY-004.

### Périmètre

**Inclus :**
- **`POST /api/v1/auth/login`** (`@Public()`) : DTO `{ email, password }` validé → vérifie l'utilisateur (`PasswordService.compare`), refuse un `User`/`Tenant` `SUSPENDED`, émet **`{ accessToken, refreshToken }`**, met à jour `lastLoginAt` et stocke le hash du refresh.
- **`POST /api/v1/auth/refresh`** (`@Public()`) : DTO `{ refreshToken }` → vérifie la signature, **fait tourner** le refresh (nouveau couple access+refresh), avec **détection de réutilisation** (invalidation de session sur token consommé).
- **`POST /api/v1/auth/logout`** (**authentifié**) : révoque le refresh courant (`refreshTokenHash = null`) → le refresh ne pourra plus être échangé.
- **`JwtAuthGuard` global** (via `APP_GUARD`) lisant `@Public()` pour exempter les routes publiques et peuplant `request.user` depuis le payload JWT.
- **`RolesGuard` global** (via `APP_GUARD`) + décorateur **`@Roles(...)`** appliquant le RBAC (`PLATFORM_ADMIN | TENANT_ADMIN | TENANT_USER`).
- **`JwtStrategy`** (`passport-jwt`) validant l'access token et projetant le payload `{ sub, tenantId, role, emailVerified }` vers `AuthenticatedUser`.
- **`@nestjs/throttler`** : throttler **global** (100 req/min/IP) + limite **stricte login 5/min/IP** (`@Throttle`).
- **Config JWT** validée au boot (`JWT_SECRET`, TTL access/refresh) ajoutée à `env.validation.ts` + `.env.example` + `docker-compose`.
- **Documentation Swagger** des trois endpoints (+ `@ApiBearerAuth()` déjà déclaré dans `main.ts`).
- **Tests** unitaires (login, refresh/rotation, réutilisation, logout, guards, stratégie) + e2e (parcours complet : register → login → accès protégé → refresh → logout ; 401 sur token révoqué/réutilisé).

**Hors périmètre :**
- **`EmailVerifiedGuard`** (3ᵉ maillon de la chaîne) et **génération/validation du token e-mail** → **STORY-006** (le payload transporte déjà `emailVerified`, mais aucun endpoint n'est encore bloqué dessus ici).
- **`TenantStateGuard`** (matrice d'accès KYC/abonnement) → **STORY-014**.
- **`@AllowUnverified()` / `@RequiresTenantState()`** → posés par STORY-006 / STORY-014.
- **Seed `PLATFORM_ADMIN`** et endpoint admin de test → **STORY-007** (mais `RolesGuard` livré ici est ce que STORY-007 réutilisera).
- **Isolation multi-tenant par repository** (`TenantScopedRepository`) et tests d'isolation → **STORY-010** (STORY-005 se contente d'exposer `tenantId` dans `request.user` / `TenantContext`).
- **Mot de passe oublié / réinitialisation** : non prévu en phase 1.
- **Multi-appareils / multi-sessions** simultanées : hors périmètre — voir Décisions ouvertes (session unique par utilisateur retenue).

### Flux (utilisateur)

**Login**
1. `POST /api/v1/auth/login { email, password }`. Throttler : au-delà de 5/min/IP → **429**.
2. Le service normalise l'e-mail, charge le `User`, `PasswordService.compare(password, passwordHash)`. Échec (utilisateur inconnu **ou** mot de passe faux) → **401 générique** en temps constant autant que possible.
3. Si `User.status = SUSPENDED` **ou** `Tenant.status = SUSPENDED` → **403** (ou 401 générique — cf. Décisions ouvertes).
4. Sinon : émet `accessToken` (15 min, payload `{ sub, tenantId, role, emailVerified }`) + `refreshToken` (7 j) ; stocke `refreshTokenHash` ; met `lastLoginAt`. Réponse **200** `{ accessToken, refreshToken, expiresIn }`.

**Accès à une route protégée**
5. `Authorization: Bearer <accessToken>` → `JwtAuthGuard` valide la signature/expiration et peuple `request.user`. Absent/expiré/invalide → **401**. `RolesGuard` compare `request.user.role` aux `@Roles(...)` du handler → **403** si insuffisant.

**Refresh**
6. `POST /api/v1/auth/refresh { refreshToken }` → vérifie la signature, extrait `sub`, charge le `User`, compare le refresh au `refreshTokenHash` stocké.
   - **Match** → rotation : nouveau couple `{ accessToken, refreshToken }`, `refreshTokenHash` mis à jour. Réponse **200**.
   - **Signature valide mais hash ≠ courant** (token déjà consommé/rotationné) → **réutilisation détectée** : `refreshTokenHash = null` (session invalidée) → **401**.
   - **Signature invalide / expiré / user sans refresh** → **401**.

**Logout**
7. `POST /api/v1/auth/logout` (authentifié) → `refreshTokenHash = null`. Réponse **204/200**. L'access token restant expire naturellement (≤ 15 min).

---

## Acceptance Criteria

- [ ] `POST /api/v1/auth/login` est **public** (`@Public()`), documenté Swagger, accepte `{ email, password }` validé ; succès → **200** `{ accessToken, refreshToken, expiresIn }` avec **accessToken TTL 15 min** et **refreshToken TTL 7 j**.
- [ ] **Identifiants invalides** (e-mail inconnu **ou** mot de passe erroné) → **401 générique identique** dans les deux cas (aucune divulgation permettant l'énumération) ; aucun token émis.
- [ ] Le **payload de l'access token** contient exactement `{ sub, tenantId, role, emailVerified }` (+ claims standard `iat`/`exp`) ; il **ne contient ni** l'état KYC **ni** l'état d'abonnement (relus en base par les guards ultérieurs).
- [ ] `POST /api/v1/auth/refresh` **fait tourner** le refresh : un nouveau couple `{ accessToken, refreshToken }` est émis et l'**ancien refresh devient inutilisable** (le `refreshTokenHash` stocké est remplacé).
- [ ] **Détection de réutilisation** : présenter un refresh **déjà consommé** (signé mais ne correspondant plus au hash courant) **invalide la session** (`refreshTokenHash` effacé) et renvoie **401** — **vérifié par un test** (rotate → réutiliser l'ancien → 401 + refresh suivant du bon token aussi refusé).
- [ ] Le **refresh token est stocké hashé** (`refreshTokenHash`), jamais en clair ; il n'apparaît ni en base ni dans les logs (redaction).
- [ ] `POST /api/v1/auth/logout` (route **authentifiée**) **révoque** le refresh (`refreshTokenHash = null`) : un `refresh` ultérieur avec l'ancien token → **401**.
- [ ] **`JwtAuthGuard` global** : toute route non `@Public()` exige un `Bearer` valide → **401** si absent/expiré/altéré ; les routes `@Public()` (`register`, `login`, `refresh`, `health`) restent accessibles sans token.
- [ ] **`RolesGuard` + `@Roles(...)`** : un handler annoté d'un rôle refuse (**403**) un utilisateur au rôle insuffisant et accepte le rôle requis ; sans `@Roles`, l'authentification seule suffit.
- [ ] **Rate limit login** : au-delà de **5 requêtes/min/IP** sur `login` → **429** ; le throttler **global 100 req/min/IP** est actif sur le reste de l'API.
- [ ] Un utilisateur `User.status = SUSPENDED` **ou** appartenant à un `Tenant.status = SUSPENDED` **ne peut pas se connecter** (login refusé) — vérifié par test.
- [ ] `request.user` (`AuthenticatedUser`) est peuplé et exploitable via `@CurrentUser()` ; `TenantContext` reflète le `tenantId` de l'utilisateur authentifié.
- [ ] Config JWT (`JWT_SECRET`, TTLs) **validée au boot** (échec de démarrage si `JWT_SECRET` absent) ; `.env.example` et `docker-compose` mis à jour ; `docker compose up` fonctionne ; tests STORY-001→004 restent **verts** ; **lint 0 warning** ; **seuils de couverture** respectés.

---

## Technical Notes

### Composants / fichiers
```
src/modules/auth/auth.controller.ts            # + login / refresh / logout (Swagger)
src/modules/auth/auth.service.ts               # + login(), refresh(), logout()
src/modules/auth/dto/login.dto.ts              # { email, password }
src/modules/auth/dto/refresh.dto.ts            # { refreshToken }
src/modules/auth/dto/auth-tokens.dto.ts        # réponse { accessToken, refreshToken, expiresIn }
src/modules/auth/token.service.ts              # émission/vérif access+refresh, hash refresh (nouveau)
src/modules/auth/strategies/jwt.strategy.ts    # passport-jwt : valide access, projette le payload
src/modules/auth/auth.module.ts                # + JwtModule, PassportModule, JwtStrategy, TokenService

src/common/guards/jwt-auth.guard.ts            # global (APP_GUARD), lit @Public()
src/common/guards/roles.guard.ts               # global (APP_GUARD), lit @Roles()
src/common/decorators/roles.decorator.ts       # @Roles(...Role[]) + ROLES_KEY
src/common/decorators/current-user.decorator.ts# (existant) — shape AuthenticatedUser finalisée
src/common/security/jwt.types.ts               # type JwtPayload { sub, tenantId, role, emailVerified }

src/modules/users/users.service.ts             # + findByEmailWithSecret, setRefreshTokenHash, clearRefreshTokenHash, touchLastLogin
src/app.module.ts                              # + ThrottlerModule.forRoot, APP_GUARD (Throttler, Jwt, Roles)
src/config/env.validation.ts                   # + JWT_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_TTL
src/config/configuration.ts                    # + namespace `auth` (secret, ttls)
```

> **Ordre de wiring des `APP_GUARD`** (l'ordre de déclaration dans `providers` compte) : `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard`. `EmailVerifiedGuard` (STORY-006) puis `TenantStateGuard` (STORY-014) s'inséreront **après** `RolesGuard`. La chaîne cible complète (archi §Guards) est : `Jwt → EmailVerified → Roles → TenantState` ; STORY-005 pose **Jwt + Roles**.

### Dépendances npm à ajouter
- `@nestjs/jwt` — émission/vérification des JWT.
- `@nestjs/passport` + `passport` + `passport-jwt` + `@types/passport-jwt` (dev) — stratégie Bearer.
- `@nestjs/throttler` — rate limiting global + login.
- (Réutilise `bcrypt` de STORY-004 via `PasswordService.compare` ; pas de nouvelle dépendance de hash.)

### Modèle de tokens (décision structurante)
- **Access token = JWT signé HS256**, TTL **15 min**, payload `{ sub, tenantId, role, emailVerified }`. `tenantId` est `null` pour un futur `PLATFORM_ADMIN` (STORY-007).
- **Refresh token = JWT signé** (secret/TTL distincts recommandés : `JWT_REFRESH_SECRET` ou même secret + `typ: 'refresh'`), TTL **7 j**, payload minimal `{ sub, typ: 'refresh' }`. Le format **JWT** (plutôt qu'opaque) permet la **détection de réutilisation** : une signature valide prouve que *nous* avons émis ce token, donc un token « valide mais non courant » = token consommé volé.
- **Stockage** : on ne stocke que `refreshTokenHash = sha256(refreshToken)` sur le `User` (cohérent avec la convention `emailVerificationTokenHash` sha256 du schéma ; sha256 suffit car le refresh est déjà à haute entropie — bcrypt réservé aux mots de passe choisis par l'humain).
- **`expiresIn`** exposé dans la réponse = durée de vie de l'access (secondes), pour informer le client.

### Détection de réutilisation (algorithme `refresh`)
1. `jwtService.verify(refreshToken)` (signature + exp). Échec → **401**.
2. Charger `User` par `sub`. Si `refreshTokenHash` absent (déjà déconnecté) → **401**.
3. `sha256(refreshToken) === user.refreshTokenHash` ?
   - **Oui** → rotation : générer nouveau couple, `user.refreshTokenHash = sha256(nouveauRefresh)`, renvoyer **200**.
   - **Non** (signé par nous mais plus courant) → **réutilisation** : `user.refreshTokenHash = null` (invalide la session active), logguer un `warn` de sécurité (sans le token), renvoyer **401**.
- **Session unique** assumée (un seul `refreshTokenHash` par user) : une nouvelle connexion écrase le refresh précédent → l'appareil précédent devra se reconnecter. Cf. Décisions ouvertes (multi-appareils reporté).

### Guards & décorateurs
- **`JwtAuthGuard extends AuthGuard('jwt')`** : surcharge `canActivate` pour court-circuiter si `@Public()` (lecture `IS_PUBLIC_KEY` via `Reflector`, en tenant compte du handler **et** de la classe). Enregistré en **`APP_GUARD`** (global).
- **`RolesGuard`** : lit `@Roles(...Role[])` (métadonnée `ROLES_KEY`) sur handler/classe ; sans métadonnée → laisse passer (auth seule). Compare à `request.user.role`. Enregistré en **`APP_GUARD`**.
- **`@Roles(...roles: Role[])`** : `SetMetadata(ROLES_KEY, roles)`.
- **`AuthenticatedUser`** : finaliser la forme injectée dans `request.user` pour coller au payload → `{ userId, tenantId, role, emailVerified }`. ⚠️ L'interface actuelle (STORY-003) expose `roles: string[]` ; **la réconcilier** vers `role: Role` (singulier) + ajout `emailVerified: boolean`, et mettre à jour `@CurrentUser()` en conséquence (cf. Décisions ouvertes).

### Rate limiting (`@nestjs/throttler`)
- `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` (global 100/min/IP) + `ThrottlerGuard` en `APP_GUARD`.
- `@Throttle({ default: { ttl: 60_000, limit: 5 } })` sur `login` (5/min/IP). `resend-verification` (3/h) relève de STORY-006.
- Dépassement → **429** au **format d'erreur uniforme** (le `AllExceptionsFilter` de STORY-003 doit couvrir `ThrottlerException` — vérifier/étendre le mapping).

### Config & sécurité
- **`env.validation.ts`** : ajouter `JWT_SECRET` (`@IsString @IsNotEmpty`, **requis** → pas de défaut, le boot échoue s'il manque), `JWT_ACCESS_TTL` (défaut `'15m'`), `JWT_REFRESH_TTL` (défaut `'7d'`). Exposer via un namespace `auth` dans `configuration.ts`. Mettre à jour `.env.example` (valeur factice) et le service `app` de `docker-compose.yml`.
- `passwordHash` / `refreshTokenHash` / `authorization` **déjà rédigés** par pino (STORY-003) ; ajouter `req.body.refreshToken` et `res` token fields à la redaction si besoin. Ne **jamais** logguer un token en clair.
- Comparaison de mot de passe : viser un **temps constant** perçu (charger l'utilisateur puis toujours appeler `compare`, y compris sur un hash factice si l'utilisateur n'existe pas, pour limiter l'*oracle temporel*).
- `SUSPENDED` : le contrôle se fait **au login** ; un access token déjà émis reste valide jusqu'à ≤ 15 min (compromis stateless assumé et borné par le TTL court — documenté).

### Points d'extension (seams)
- **STORY-006** : insère `EmailVerifiedGuard` (lit `emailVerified` / `@AllowUnverified()`) **après** `JwtAuthGuard`, et un endpoint `verify-email` public.
- **STORY-007** : réutilise `RolesGuard` + `@Roles(Role.PLATFORM_ADMIN)` pour l'endpoint admin de test ; le seed produit un `User` connectable via `login`.
- **STORY-008** : `accept-invitation` réutilise `TokenService`/`PasswordService` et émet un couple de tokens à l'acceptation.
- **STORY-010** : consomme `request.user.tenantId` / `TenantContext` pour le scoping repository.

---

## Dependencies

**Stories prérequises :**
- **STORY-004** ✅ (schémas `User`/`Tenant`, `passwordHash`, `refreshTokenHash`/`lastLoginAt` déjà déclarés, `PasswordService.compare`).
- **STORY-003** ✅ (`@Public()`/`@CurrentUser()`/`AuthenticatedUser` posés, `AllExceptionsFilter` uniforme, logging + redaction, `TenantContext`).
- **STORY-001/002** ✅ (`ValidationPipe` global, préfixe `/api/v1`, Swagger `addBearerAuth`, config validée au boot).

**Stories débloquées par celle-ci :**
- **STORY-006** (vérification e-mail : s'appuie sur `emailVerified` du payload et la chaîne de guards).
- **STORY-007** (seed `PLATFORM_ADMIN` : login + `RolesGuard`).
- **STORY-008/009** (invitation/CRUD : routes protégées par `@Roles`).
- **Tout module métier ultérieur** (KYC, Billing, Bilan) via `JwtAuthGuard`/`RolesGuard`.

**Dépendances externes :** aucune (pas de service tiers). Ajout paquets `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` (+ `@types/passport-jwt`), `@nestjs/throttler`. Nouvelle variable secrète `JWT_SECRET` (générée localement / injectée en CI et prod).

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité (`feature/STORY-005-auth-login-refresh`).
- [ ] Tests :
  - [ ] Unitaire `AuthService.login` : succès (tokens émis, `refreshTokenHash` stocké, `lastLoginAt` mis) ; mot de passe faux → 401 générique ; e-mail inconnu → **même** 401 ; `User`/`Tenant` `SUSPENDED` → refus.
  - [ ] Unitaire `AuthService.refresh` : rotation (nouveau couple, ancien hash remplacé) ; **réutilisation** d'un token consommé → session invalidée + 401 ; signature invalide/expiré → 401.
  - [ ] Unitaire `AuthService.logout` : `refreshTokenHash` effacé ; refresh ultérieur → 401.
  - [ ] Unitaire `TokenService` (payload correct, TTLs, hash sha256) et `JwtStrategy` (projection payload → `AuthenticatedUser`).
  - [ ] Unitaire `JwtAuthGuard` (exemption `@Public()`, rejet sans/avec token invalide) et `RolesGuard` (autorise/refuse selon `@Roles`).
  - [ ] e2e parcours complet : `register` → `login` (200 + tokens) → accès route protégée de test (200) → sans token (401) → rôle insuffisant (403) → `refresh` (rotation) → réutilisation ancien refresh (401) → `logout` → refresh révoqué (401) ; **429** au 6ᵉ login/min.
- [ ] `npm run test:cov` passe et respecte les seuils (branches 65 / functions 90 / lines 90 / statements 90).
- [ ] Lint (0 warning) et build OK ; tests STORY-001→004 toujours verts.
- [ ] Endpoints `login`/`refresh`/`logout` documentés dans **Swagger** ; `@ApiBearerAuth()` opérationnel sur une route protégée de démonstration.
- [ ] `env.validation` échoue au boot si `JWT_SECRET` manque ; `.env.example` + `docker-compose.yml` mis à jour.
- [ ] `docker compose up` : parcours vérifiable de bout en bout (login → Bearer → route protégée → refresh → logout).
- [ ] Revue de code (`/code-review`) — attention particulière à la **détection de réutilisation** et à la **non-divulgation** du 401.
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **Infra JWT/passport** (`JwtModule`, `PassportModule`, `JwtStrategy`, `TokenService` émission+vérif+hash, config `JWT_*` validée) : **2 pts**
- **`login`** (compare temps-constant, contrôles `SUSPENDED`, émission couple, `lastLoginAt`, 401 générique) : **2 pts**
- **`refresh` rotatif + détection de réutilisation + `logout`** (le cœur délicat/sécurité) : **2 pts**
- **`JwtAuthGuard` + `RolesGuard` + `@Roles` globaux** (APP_GUARD, exemption `@Public`, mapping 401/403) : **1 pt**
- **`@nestjs/throttler`** (global + login 5/min, mapping 429 uniforme) + **tests unitaires & e2e** (dont rotation/réutilisation/throttle) + Swagger : **1 pt**
- **Total : 8 points**

**Rationale :** endpoints peu nombreux mais **fort en sécurité** : la **rotation avec détection de réutilisation** (invalidation de session, cas d'erreur multiples) est le point subtil, doublé de la première **chaîne de guards globale** du projet (ordre, exemptions, RBAC) et du **rate limiting**. Le volume de code standard (DTO, stratégie, Swagger) est accéléré par l'IA, mais la surface de tests (rotation, réutilisation, 401 non divulgateur, 429) justifie les 8 pts.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Session unique vs multi-appareils** — le schéma n'a qu'un `refreshTokenHash` (singulier).
   - **Recommandé (phase 1) :** **session unique** par utilisateur — une nouvelle connexion écrase le refresh précédent. Simple, aligné sur le schéma existant, et la détection de réutilisation reste triviale (un seul hash de référence). Suffisant pour ~50 cabinets.
   - *Évolution possible :* collection `sessions` (ou tableau de hashes par appareil) pour plusieurs sessions concurrentes + révocation ciblée. À reconsidérer si un besoin « rester connecté sur mobile **et** web » émerge ; non retenu par défaut.

2. **Code de statut sur compte `SUSPENDED`** — refuser la connexion, mais avec quel code ?
   - **Recommandé :** **403** avec message neutre (« Compte suspendu, contactez l'administration »), le compte étant authentifié mais désactivé.
   - *Alternative (anti-énumération maximale) :* renvoyer le **même 401 générique** que des identifiants invalides, pour ne pas révéler l'existence/état du compte. À arbitrer selon le besoin support vs. confidentialité.

3. **Réconciliation de `AuthenticatedUser`** — l'interface STORY-003 expose `roles: string[]` ; le payload JWT porte un `role` unique + `emailVerified`.
   - **Recommandé :** migrer vers `{ userId, tenantId, role: Role, emailVerified: boolean }` et adapter `@CurrentUser()` + `RolesGuard`. Un seul rôle par utilisateur (modèle actuel) rend le tableau inutile.
   - *Alternative :* conserver `roles: string[]` (souplesse future multi-rôles) et projeter `[role]`. Retenir la forme la plus simple sauf besoin explicite.

4. **Secret refresh distinct** — même `JWT_SECRET` (avec claim `typ`) **ou** `JWT_REFRESH_SECRET` séparé ?
   - **Recommandé :** **secret séparé** (`JWT_REFRESH_SECRET`) — isole les surfaces (un access token ne peut jamais servir de refresh et inversement) au prix d'une variable d'env de plus.

### Notes diverses
- **Réutilisation des seams STORY-003 :** `@Public()` et `@CurrentUser()` étaient des squelettes « en attente du guard » — STORY-005 est précisément la story qui les **active**. Vérifier que `health`/`register`/`login`/`refresh` portent bien `@Public()` une fois le guard global posé (sinon 401 sur des routes qui doivent rester ouvertes).
- **Ordre des `APP_GUARD` :** l'ordre dans le tableau `providers` détermine l'exécution — `Throttler` (avant tout, pour plafonner même les requêtes non authentifiées) → `Jwt` → `Roles`. Documenter ce contrat pour STORY-006/014 qui insèreront des maillons.
- **Pas d'état volatil dans le JWT :** `emailVerified` est un **instantané** au moment de l'émission ; l'état KYC/abonnement n'y figure **jamais** (change par revue admin/webhook) — il sera relu en base par `TenantStateGuard` (STORY-014).

---

## Progress Tracking

**Historique de statut :**
- 2026-07-02 : Créée (Scrum Master, BMAD)
- 2026-07-02 : Implémentée et terminée (Developer, BMAD)

**Effort réel :** 8 points (conforme à l'estimation).

**Décisions ouvertes — tranchées à l'implémentation :**
1. **Session unique** retenue (un seul `refreshTokenHash` par `User`) : une nouvelle connexion écrase le refresh précédent ; la détection de réutilisation reste triviale. Multi-appareils reporté.
2. **Compte `SUSPENDED`** → **`403`** (`ForbiddenException`, message neutre) au login **et** au refresh, distinct du `401` d'identifiants invalides.
3. **`AuthenticatedUser`** migré de `roles: string[]` (squelette STORY-003) vers `{ userId, tenantId: string | null, role: Role, emailVerified: boolean }` ; `@CurrentUser()` et `RolesGuard` alignés.
4. **Secrets distincts** retenus : `JWT_ACCESS_SECRET` **et** `JWT_REFRESH_SECRET` (isolation access/refresh), + claim défensif `typ: 'refresh'`.
5. **`jti` (uuid) ajouté au refresh** : garantit qu'une rotation produit toujours un token distinct (donc une empreinte distincte), même émis dans la même seconde — fiabilise la détection de réutilisation.

**Notes d'implémentation :**
- **Modèle de tokens** : `TokenService` émet un **access** JWT (payload `{ sub, tenantId, role, emailVerified }`, TTL 15 min, `JWT_ACCESS_SECRET`) et un **refresh** JWT (`{ sub, typ, jti }`, TTL 7 j, `JWT_REFRESH_SECRET`). Seul `refreshTokenHash = sha256(refresh)` est stocké sur le `User` (haute entropie ⇒ sha256 ; bcrypt réservé aux mots de passe). `expiresIn` est relu depuis les claims du token signé.
- **Login** (`AuthService.login`) : e-mail normalisé, `findByEmail`, **compare systématique** (hash bidon `DUMMY_PASSWORD_HASH` si compte absent ⇒ temps ~constant, anti-oracle), rejet `401` **générique** (même message e-mail inconnu / mot de passe faux / `passwordHash` absent), contrôle `SUSPENDED` (user **et** tenant), puis `issueSession` (émission + `setRefreshTokenHash` + `touchLastLogin`).
- **Refresh** (`AuthService.refresh`) : `verifyRefreshToken` (signature+exp) → `401` sinon ; charge le `User` ; **comparaison en temps constant** (`timingSafeEqual` sur double-sha256) du hash présenté vs stocké ; **match** ⇒ rotation ; **non-match** (token signé mais consommé) ⇒ **réutilisation** ⇒ `clearRefreshTokenHash` (session invalidée) + `warn` de sécurité + `401` ; re-contrôle `SUSPENDED`.
- **Logout** : `clearRefreshTokenHash` ⇒ le refresh révoqué ne peut plus être échangé. `GET /auth/me` (authentifié) renvoie l'identité issue du token.
- **Guards** : `JwtAuthGuard` (global `APP_GUARD`, exempte `@Public()` via `Reflector`) + `RolesGuard` (global, `@Roles(...Role[])`) + `JwtStrategy` (`passport-jwt`, peuple `request.user` et le `TenantContext`). **Ordre `APP_GUARD`** : `ThrottlerGuard → JwtAuthGuard → RolesGuard` (les maillons `EmailVerified`/`TenantState` s'inséreront après `RolesGuard`). `@Public()` posé sur `health` + `register`/`login`/`refresh`.
- **Rate limiting** : `ThrottlerModule` global (100 req/min/IP, configurable `THROTTLE_*`) + `@Throttle` login **5/min/IP** ; `429` uniformisé par l'`AllExceptionsFilter` (STORY-003).
- **Config** : `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` **requis** (échec au boot si absents), TTL/throttle optionnels avec défauts ; namespaces `auth`/`throttle` dans `configuration.ts` ; `.env.example` + `docker-compose.yml` (défauts dev via `${VAR:-…}`) mis à jour. `TenantContext.setTenant/setUser` rendus sans effet hors contexte cls (robustesse).
- **Dépendances ajoutées** : `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` (+ `@types/passport-jwt`), `@nestjs/throttler`.

**Résultats de vérification :**
- Lint : **0 erreur / 0 warning** · Typecheck (`tsc --noEmit`) : **0 erreur** · Build (`nest build`) : OK (`dist/main.js`).
- Tests : **105 unitaires (21 suites) + 15 e2e (4 suites)** passants ; couverture globale **99.37 % statements / 82.82 % branches / 100 % functions / 99.32 % lines** (seuils 90/65/90/90). Couverts : login (nominal, mauvais mdp, e-mail inconnu, sans `passwordHash`, user/tenant `SUSPENDED`), refresh (rotation, signature invalide, user absent, sans session, **réutilisation ⇒ invalidation**, suspendu), logout, `TokenService` (payloads, secrets distincts, jti unique, sha256), `JwtStrategy`, `JwtAuthGuard` (exemption `@Public`/délégation), `RolesGuard` (matrice), throttle **429**.
- **`docker compose up` (stack réelle Mongo replica set + Redis)** — parcours de bout en bout (**18 assertions OK / 0 KO**) :
  - `health` **200** (route `@Public` traversant le guard global) ; 6 routes auth mappées.
  - `login` → **200** `{ accessToken, refreshToken, tokenType:"Bearer", expiresIn:900 }` ; mauvais mot de passe → **401**.
  - `GET /me` sans Bearer → **401** ; avec access → **200** `{ userId, tenantId, role:"TENANT_ADMIN", emailVerified:false }`.
  - `refresh` → **200** rotation (nouveau refresh ≠ ancien) ; **réutilisation** de l'ancien → **401** + log `WARN` « Réutilisation de refresh token détectée … session invalidée » ; refresh courant post-réutilisation → **401** (session coupée).
  - `logout` → **204** puis refresh révoqué → **401**. Injection `role` au login → **400**. Login répété → **429** (limite 5/min/IP).
  - Mongo : `refreshTokenHash` == **`sha256(refresh brut)`** (64 hex, aucun point), `passwordHash` **`$2b$12$…`**, `lastLoginAt` renseigné ; **0 fuite** de token en clair sur toute la collection.

**Reste (hors story) :** `EmailVerifiedGuard` + vérification e-mail réelle → **STORY-006** ; seed `PLATFORM_ADMIN` + endpoint admin protégé → **STORY-007** ; `TenantStateGuard` (matrice KYC/abonnement) → **STORY-014** ; multi-appareils/révocation ciblée si le besoin émerge.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
