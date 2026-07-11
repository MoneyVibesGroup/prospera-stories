---
baseline_commit: NO_VCS
---

# STORY-030 : Retrait des modules d'identité + cutover *relying party* + e2e cross-service

**Epic :** EPIC-006 — `expert-comptable` devient *relying party* de l'IdP
**Réf. architecture :** `architecture-expert-comptable-2026-07-02.md` (rév. 1.2, §Bascule *relying party* / cutover) · `architecture-auth-service-2026-07-04.md` (l'IdP, unique émetteur ; contrat `identity.*` v1) · `architecture-prospera-ecosystem-2026-07-04.md` (topologie IdP ↔ *relying party*, « un seul propriétaire d'identité »)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Implémenté + VÉRIFIÉ DOCKER BOUT-EN-BOUT (2026-07-09) — reste : `/code-review` formel + commit sur demande
**Assigné à :** Unassigned
**Créée le :** 2026-07-09
**Sprint :** 5
**Service :** expert-comptable (`:3000`)
**Couvre :** driver « un seul propriétaire d'identité » (l'IdP) — **3ᵉ et dernier pas** de l'extraction d'identité côté vertical (après la validation JWKS de STORY-028 et les read-models de STORY-029). Clôt EPIC-006.
**Dépendances :** STORY-028 (validation JWKS RS256), STORY-029 (read-models `identity.*` + `IdentityReadModelService`), STORY-024/026/027 (l'IdP émet et gère déjà l'identité)

> **Troisième et dernière story d'EPIC-006 : `expert-comptable` cesse de *posséder* l'identité.** STORY-028 a fait basculer la **vérification** des jetons vers l'IdP (RS256/JWKS) ; STORY-029 a branché les **read-models** locaux (`Organization`/`IdentityUser`/`Membership`/`OrgProfile`) alimentés par les événements `identity.*`, **sans rien retirer** — les modules possédés (`AuthModule`/`UsersModule`/`TenantsModule`) et l'émission locale HS256 **coexistaient** encore, le runtime restant en `AUTH_MODE=hs256` (défaut legacy). STORY-030 réalise le **cutover pur** : elle **retire** la surface d'émission de jetons (`register`/`login`/`refresh`/`logout`/`verify-email`/`accept-invitation`) et de gestion d'utilisateurs (`/users`, invitations) — désormais **servies exclusivement par `auth-service`** — bascule le runtime en `AUTH_MODE=rs256` par **défaut**, réduit `AuthModule` à la **seule stratégie de validation JWKS**, et **repointe** les derniers consommateurs des collections possédées (`Tenant`/`User`) vers les **read-models** de STORY-029. À l'issue, `expert-comptable` **ne signe plus aucun jeton**, ne gère plus aucun compte, et l'IdP est **l'unique source de vérité** de l'identité. L'e2e **cross-service** (docker racine) prouve le parcours complet : `register`/`login` sur `auth-service` `:3001` → JWT RS256 → endpoint métier d'`expert-comptable` `:3000` validé via JWKS → `identity.*` → read-model à jour.

---

## User Story

En tant qu'**équipe PROSPERA** (opérant l'écosystème),
je veux qu'**`expert-comptable` cesse de posséder et d'émettre l'identité (comptes, jetons, invitations) et fonctionne en *relying party* pur : validation JWKS des JWT RS256 de l'IdP et identité lue exclusivement dans les read-models**,
afin que **l'IdP (`auth-service`) soit l'unique source de vérité de l'identité**, qu'il n'existe plus de source dédoublée ni de chemin d'émission résiduel côté vertical, et que le parcours d'authentification de bout en bout traverse réellement les deux services.

---

## Description

### Contexte

À l'issue de STORY-029, `expert-comptable` porte **deux mondes en parallèle** :

- Le **monde cible** (*relying party*) : `JwtStrategy` sait valider un JWT RS256 via JWKS (STORY-028) ; les read-models `Organization`/`IdentityUser`/`Membership`/`OrgProfile` sont alimentés par `identity.*` et `IdentityReadModelService` sait résoudre admins, destinataires et suspensions **depuis le read-model** (STORY-029).
- Le **monde legacy** (émetteur) : `AuthController` sert encore `register`/`login`/`refresh`/`logout`/`verify-email`/`accept-invitation`/`resend-verification` ([auth.controller.ts](../../expert-comptable/src/modules/auth/auth.controller.ts)) ; `AuthService`/`TokenService` signent des jetons **HS256** ([auth.service.ts](../../expert-comptable/src/modules/auth/auth.service.ts)) ; `UsersModule` expose le **CRUD `/users`** et les **invitations** ([users.controller.ts](../../expert-comptable/src/modules/users/users.controller.ts), [invitation.service.ts](../../expert-comptable/src/modules/users/invitation.service.ts)) ; `TenantsModule` **possède** la collection `Tenant`. Le runtime tourne en `AUTH_MODE=hs256` ([docker-compose.yml](../../docker-compose.yml) : `AUTH_MODE: ${AUTH_MODE:-hs256}`).

Cette coexistence était **volontaire** (bascule sans big-bang), mais elle est **intenable en cible** : deux émetteurs, deux sources de comptes, un `AUTH_MODE=hs256` qui laisse dormante une surface d'émission et un chemin de vérification symétrique (foothold *algorithm-confusion*). STORY-030 **coupe** le monde legacy.

Le monde cible est **déjà prêt à recevoir la charge** : l'IdP émet, gère les comptes et publie `identity.*` depuis STORY-024/026/027 ; les read-models et résolutions existent depuis STORY-029. Il ne reste qu'à **retirer** le legacy, **basculer le défaut** en `rs256`, **repointer** les rares consommateurs restants des collections possédées, et **prouver** le round-trip cross-service.

**Points de couplage à trancher au cutover (relevés dans le code) :**

- `AuthModule` importe `TenantsModule`, `UsersModule`, `MailModule` **et** fournit `JwtStrategy` ([auth.module.ts](../../expert-comptable/src/modules/auth/auth.module.ts)). Or `JwtStrategy` **doit survivre** (validation JWKS) : il faut **découpler** la stratégie de la surface d'émission.
- L'enum `Role` vit sous `modules/users/enums/role.enum.ts` et est importé par **~20 fichiers** (dont [jwt.strategy.ts](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts), [admin.controller.ts](../../expert-comptable/src/modules/admin/admin.controller.ts)) : supprimer `UsersModule` **ne doit pas** emporter `Role`.
- Consommateurs **vivants** des services possédés à repointer : `KycModule`/`kyc-status.service.ts` (statut KYC porté par `Tenant` → doit lire `OrgProfile`), `mail/*` (destinataires → read-model, déjà outillé par `IdentityReadModelService`), `seed-platform-admin.ts` (seed local → obsolète : le seed `PLATFORM_ADMIN` vit dans l'IdP, STORY-026).

### Périmètre

**Inclus :**

- **Retrait de la surface d'émission de jetons (`AuthController`)** :
  - Suppression des routes `register`, `login`, `refresh`, `accept-invitation`, `verify-email`, `resend-verification`, `logout` — **servies exclusivement par `auth-service` `:3001`**. Suppression d'`AuthService`, `TokenService`, de leurs DTOs d'émission et de leurs tests unitaires.
  - **Conservation d'un unique endpoint *relying party*** : `GET /auth/me` réduit à un **écho du JWT validé** (payload projeté par `JwtStrategy`, aucun accès DB) — sert de cible de *smoke* JWKS pour l'e2e cross-service. *(Décision ci-dessous : conserver vs. déplacer.)*
- **Retrait de la gestion d'utilisateurs possédée** :
  - Suppression du CRUD `/users` ([users.controller.ts](../../expert-comptable/src/modules/users/users.controller.ts)), des invitations ([invitation.service.ts](../../expert-comptable/src/modules/users/invitation.service.ts)), de `UsersService`/`UsersRepository` et des schémas possédés `User` **de l'émission** — ces capacités appartiennent à l'IdP (STORY-026).
  - **Réduction, pas simple suppression** : là où le code doit encore connaître un user/rôle/destinataire, il lit le **read-model** (`IdentityUser`/`Membership` via `IdentityReadModelService`, STORY-029), jamais `UsersService`.
- **Retrait de la propriété `Tenant`** :
  - `TenantsModule`/`TenantsService` et la collection possédée `Tenant` sont retirés en tant que **source d'identité d'org**. La connaissance d'org vient du read-model `Organization` (STORY-029) ; l'**extension métier** d'une org (abonnement, placeholder KYC) est portée par `OrgProfile` (provisionné en STORY-029, clé `orgId`).
- **Bascule `AUTH_MODE=rs256` par défaut (cutover runtime)** :
  - Le défaut du compose passe de `hs256` à `rs256` ([docker-compose.yml](../../docker-compose.yml) : `AUTH_MODE: ${AUTH_MODE:-rs256}`).
  - Le **chemin HS256 est retiré** de `JwtStrategy` ([jwt.strategy.ts](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts)) : plus aucun secret symétrique de vérification, RS256 **imposé** (aucune surface *algorithm-confusion*). `AUTH_MODE` peut disparaître (mono-mode) ou rester verrouillé à `rs256`. Les env `AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE` deviennent **requises** ([env.validation.ts](../../expert-comptable/src/config/env.validation.ts)) ; `JWT_ACCESS_SECRET` et les TTL d'émission sont supprimés de la config.
- **Découplage de `JwtStrategy`** :
  - `JwtStrategy` (validation JWKS, la **seule** brique auth conservée) est relocalisée dans un **module mince** (`AuthModule` réduit à `PassportModule` + `JwtStrategy`, ou fusion dans `CommonModule`) — **sans** import de `TenantsModule`/`UsersModule`/`MailModule`. Les guards globaux (`JwtAuthGuard`/`RolesGuard`/`EmailVerifiedGuard`, `AppModule` `APP_GUARD`) restent **inchangés** ; `emailVerified` provient du claim JWT.
- **Relocalisation des enums neutres** :
  - `Role` (et `kyc-status.enum` s'il conditionne la suppression de `TenantsModule`) déplacé de `modules/users/enums/` / `modules/tenants/enums/` vers un emplacement neutre (`common/enums/`), imports mis à jour (~20 fichiers) — sans changement de valeur.
- **Repointage des derniers consommateurs** :
  - `kyc-status.service.ts` : le statut KYC ne s'écrit/lit plus sur `Tenant` mais sur `OrgProfile` (clé `orgId`) — placeholder provisionné en STORY-029.
  - `mail/*` (`mail.processor.ts`, résolutions de destinataires) : depuis `IdentityReadModelService`, plus `UsersService`.
  - `seed-platform-admin.ts` : retiré (le seed `PLATFORM_ADMIN` est celui de l'IdP, STORY-026) ou neutralisé/no-op documenté.
- **Nettoyage des suites e2e legacy** :
  - Retrait/réécriture des e2e qui testaient l'**émission possédée** : `auth-register`, `auth-login`, `auth-throttle`, `auth-verify-email`, `invitation`, `users-crud`, `tenant-isolation` ([test/](../../expert-comptable/test/)). Ce qui reste valable en *relying party* (isolation par `orgId`, RBAC, guards) est **rejoué avec des JWT RS256 mintés** (patron d'`auth-jwks.e2e-spec.ts`, STORY-028).
- **e2e cross-service (docker racine, `AUTH_MODE=rs256`)** :
  - `register` puis `login` sur `auth-service` `:3001` → JWT **RS256** → appel de `GET /auth/me` **et** d'au moins un endpoint métier d'`expert-comptable` `:3000` → validation **via JWKS** (200) ; token absent/altéré/HS256 forgé → 401.
  - L'`identity.*` émis par le `register` → read-models d'`expert-comptable` **à jour** (org/user/membership + `OrgProfile` provisionné) — round-trip complet **cross-service** (celui que STORY-029 avait laissé hors périmètre).
  - **Suspension bout-en-bout** : suspension d'org/user via l'IdP → `identity.*` → read-model `SUSPENDED` → l'endpoint métier d'`expert-comptable` **refuse** l'accès (coupure de STORY-029 vérifiée cross-service).

**Explicitement hors périmètre :**

- **Toute modification d'`auth-service`** : il émet, gère les comptes et publie `identity.*` **depuis STORY-024/026/027**. STORY-030 est **100 % côté `expert-comptable`**.
- **Extraction du module KYC vers `kyc-service`** → **STORY-020**. Ici, KYC **reste dans `expert-comptable`** ; seul son **ancrage** bascule de `Tenant` vers `OrgProfile`.
- **Read-model KYC `kycStatus` alimenté par `kyc.status.changed` + consumer** → **STORY-021**. STORY-030 utilise le **placeholder** `OrgProfile.kycStatus` (provisionné STORY-029) tel quel.
- **`TenantStateGuard` complet (matrice KYC + abonnement)** → **STORY-014**. Ici, seule la **coupure sur suspension d'identité** (livrée STORY-029) est vérifiée cross-service.
- **Migration de données des `Tenant`/`User` historiques (ère HS256)** vers les read-models : le peuplement se fait par **rejeu des `identity.*`** (`fromBeginning`, déjà en place STORY-029) une fois l'IdP source de vérité. Aucune reprise de données legacy n'est promise (environnements de dev/démo repartent d'un IdP peuplé).
- **Suppression du champ / collection `Tenant` de la base physiquement** au-delà du retrait du code : les collections orphelines sont laissées (aucun drop destructif), le code n'y accède simplement plus.

### Flux (technique)

**A. Cutover de configuration**
1. Le compose racine passe `AUTH_MODE` par défaut à `rs256` ; `JwtStrategy` perd sa branche HS256 ; `AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE` deviennent requises ; `JWT_ACCESS_SECRET` disparaît.

**B. Round-trip cross-service (nominal)**
2. `POST /auth/register` sur `auth-service` `:3001` → l'IdP crée org+user+membership, signe le premier login RS256, **écrit `identity.org.created`/`user.registered`/`membership.changed`** (outbox → Kafka).
3. `IdentityEventsConsumer` (`expert-comptable`, STORY-029) applique les événements → read-models peuplés + `OrgProfile` provisionné (`kycStatus: PENDING_DOCUMENTS`).
4. `POST /auth/login` (IdP) → JWT **RS256** (claims `sub`, `org`, `roles[]`, `emailVerified`).
5. `GET /auth/me` puis un endpoint métier sur `expert-comptable` `:3000`, `Authorization: Bearer <RS256>` → `JwtStrategy` valide via **JWKS** → `TenantContext(org→tenantId)` → réponse 200 ; les résolutions métier lisent le **read-model**.

**C. Coupure sur suspension (cross-service)**
6. Suspension d'org/user via l'IdP → `identity.org.updated(SUSPENDED)` / `identity.user.suspended` → read-model `SUSPENDED` → l'endpoint métier d'`expert-comptable` **refuse** (résolveur d'accès STORY-029), en complément de l'expiration naturelle du JWT.

**D. Rejet des jetons non conformes**
7. Sans token → 401 ; token altéré → 401 ; token **HS256 forgé** → 401 (RS256 imposé, algorithm-confusion neutralisé — la surface HS256 n'existe plus).

---

## Critères d'acceptation

- [ ] **Aucune émission de jeton côté `expert-comptable`** : les routes `register`/`login`/`refresh`/`logout`/`accept-invitation`/`verify-email`/`resend-verification` **n'existent plus** (404) ; `AuthService`/`TokenService` supprimés ; aucune signature de JWT (HS256 ou autre) dans le service.
- [ ] **Aucune gestion de compte possédée** : le CRUD `/users` et les invitations **n'existent plus** ; `UsersService`/`UsersRepository`/`InvitationService` et les schémas possédés `User`/`Tenant` d'émission sont retirés (ou réduits à des read-models). Aucun code vivant n'appelle `UsersService`/`TenantsService`.
- [ ] **Relying party pur (rs256)** : le runtime démarre en `AUTH_MODE=rs256` **par défaut** ([docker-compose.yml](../../docker-compose.yml)) ; `JwtStrategy` ne contient **plus de branche HS256** ; `JWT_ACCESS_SECRET` supprimé de la config ; `AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE` **requises** (le boot échoue clairement si absentes).
- [ ] **`JwtStrategy` découplée** : la validation JWKS survit dans un module **mince** sans dépendance à `TenantsModule`/`UsersModule`/`MailModule` ; les guards globaux et `/auth/me` (écho JWT, sans DB) fonctionnent inchangés.
- [ ] **Enums préservés** : `Role` (et enums neutres associés) relocalisés hors des modules supprimés ; les ~20 imports compilent ; aucune régression de valeur.
- [ ] **Repointage KYC** : le statut KYC s'ancre sur `OrgProfile` (clé `orgId`), plus sur `Tenant` — **test** couvrant un chemin KYC lisant/écrivant `OrgProfile`.
- [ ] **Repointage résolutions** : destinataires d'e-mails métier et règle « dernier / liste d'admins » lisent le **read-model** (`IdentityReadModelService`) — aucun résidu `UsersService`/`TenantsService` sur les chemins vivants.
- [ ] **Seed legacy retiré** : `seed-platform-admin.ts` supprimé ou neutralisé (le seed `PLATFORM_ADMIN` est celui de l'IdP, STORY-026) ; documenté.
- [ ] **e2e cross-service (docker racine, `rs256`)** : `register`+`login` sur `auth-service` `:3001` → JWT RS256 → `GET /auth/me` **et** un endpoint métier d'`expert-comptable` `:3000` validés via **JWKS** (200) ; `identity.*` → read-models à jour (org/user/membership + `OrgProfile`) ; token absent/altéré/**HS256 forgé** → 401.
- [ ] **Suspension cross-service** : suspension d'org/user via l'IdP → read-model `SUSPENDED` → endpoint métier d'`expert-comptable` **refuse** l'accès — vérifié bout-en-bout.
- [ ] **Non-régression** : les suites e2e **restantes/pertinentes** d'`expert-comptable` (isolation par `orgId`, RBAC, guards, KYC) passent, **rejouées avec des JWT RS256 mintés** ; les e2e d'émission legacy sont retirés (pas simplement ignorés).
- [ ] `lint` 0, build OK, couverture conforme au seuil du projet ; aucun import mort, aucune dépendance orpheline (`@nestjs/jwt` d'émission, secret d'accès…).

---

## Notes techniques

### Composants (retirés / réduits / touchés)

| Composant | Fichier | Nature |
|---|---|---|
| Contrôleur d'auth | [auth.controller.ts](../../expert-comptable/src/modules/auth/auth.controller.ts) | **Réduit** — ne conserve que `GET /auth/me` (écho JWT) ; toutes les routes d'émission supprimées |
| Service d'auth / tokens | [auth.service.ts](../../expert-comptable/src/modules/auth/auth.service.ts), [token.service.ts](../../expert-comptable/src/modules/auth/token.service.ts) | **Supprimés** (+ specs, DTOs d'émission) |
| Module d'auth | [auth.module.ts](../../expert-comptable/src/modules/auth/auth.module.ts) | **Réduit** — `PassportModule` + `JwtStrategy` seuls ; imports `Tenants`/`Users`/`Mail` retirés |
| Stratégie JWKS | [jwt.strategy.ts](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts) | **Réduit** — branche HS256 retirée, RS256/JWKS uniquement |
| Module utilisateurs | [users.module.ts](../../expert-comptable/src/modules/users/users.module.ts), `users.controller.ts`, `users.service.ts`, `users.repository.ts`, `invitation.service.ts`, `schemas/*` | **Supprimés** (capacité déplacée à l'IdP, STORY-026) |
| Module tenants | [tenants.module.ts](../../expert-comptable/src/modules/tenants/tenants.module.ts), `tenants.service.ts`, `schemas/*` | **Supprimés** — org connue via read-model `Organization` |
| Enum `Role` | `modules/users/enums/role.enum.ts` → `common/enums/role.enum.ts` | **Relocalisé** — ~20 imports mis à jour |
| Enum KYC status | `modules/tenants/enums/kyc-status.enum.ts` → `common/enums/` | **Relocalisé** si `TenantsModule` supprimé |
| KYC status | [kyc-status.service.ts](../../expert-comptable/src/modules/kyc/kyc-status.service.ts), [kyc.module.ts](../../expert-comptable/src/modules/kyc/kyc.module.ts) | **Repointé** — ancre sur `OrgProfile` (`orgId`), import `TenantsModule` retiré |
| Mail (destinataires) | [mail.processor.ts](../../expert-comptable/src/modules/mail/mail.processor.ts), `mail/*` | **Repointé** — `IdentityReadModelService`, plus `UsersService` |
| Vérif e-mail (legacy) | [email-verification.service.ts](../../expert-comptable/src/modules/mail/email-verification.service.ts) | **Supprimé/réduit** — la vérif e-mail est à l'IdP (STORY-025) |
| Seed | [seed-platform-admin.ts](../../expert-comptable/src/seeds/seed-platform-admin.ts) | **Supprimé/neutralisé** — seed à l'IdP (STORY-026) |
| Config auth | [configuration.ts](../../expert-comptable/src/config/configuration.ts), [env.validation.ts](../../expert-comptable/src/config/env.validation.ts) | `mode`/`accessSecret` retirés ou verrouillés ; `jwksUri`/`issuer`/`audience` **requis** |
| Compose racine | [docker-compose.yml](../../expert-comptable/../docker-compose.yml) | `AUTH_MODE` par défaut → `rs256` |
| Read-models & résolutions | `modules/identity/*` (STORY-029) | **Inchangés** — deviennent l'**unique** source d'identité |
| e2e | [test/](../../expert-comptable/test/) | `auth-register`/`auth-login`/`auth-throttle`/`auth-verify-email`/`invitation`/`users-crud`/`tenant-isolation` retirés/réécrits ; nouveau e2e cross-service |

### Décisions & points de vigilance

- **Découpler `JwtStrategy` de la surface d'émission.** C'est le piège central : `AuthModule` fournit à la fois `JwtStrategy` (à garder) et importe `Tenants`/`Users`/`Mail` (à retirer). Séquence sûre : (1) extraire `JwtStrategy` dans un module mince, (2) retirer les routes/services d'émission, (3) retirer les modules `Users`/`Tenants`, (4) relocaliser `Role`, (5) recompiler. Faire l'inverse casse la compilation par cascade d'imports morts.
- **`GET /auth/me` : conserver.** Recommandé de **garder** `/auth/me` comme écho du JWT validé (aucune DB) : cible de *smoke* JWKS idéale pour l'e2e et endpoint utile au front. Alternative (déplacer sous `/identity/me` lisant le read-model) : hors périmètre, évite de recoupler.
- **`AUTH_MODE` : mono-mode `rs256`.** Après cutover, HS256 n'a plus de sens (aucune émission locale). Retirer la branche HS256 **élimine** la surface *algorithm-confusion* de façon structurelle plutôt que par flag. Garder `AUTH_MODE` comme constante verrouillée est acceptable, mais préférer la suppression du code mort.
- **Ne rien casser côté guards.** `JwtAuthGuard`/`RolesGuard`/`EmailVerifiedGuard` (globaux via `APP_GUARD` dans [app.module.ts](../../expert-comptable/src/app.module.ts)) lisent `AuthenticatedUser` projeté par la stratégie ; en `rs256` `emailVerified` vient du claim → aucun changement de guard nécessaire.
- **KYC : ancrage sans extraction.** Le module KYC reste dans `expert-comptable` (extraction = STORY-020). Seul son **ancrage d'org** bascule de `Tenant` (ObjectId possédé) vers `OrgProfile` (`orgId` string, read-model). Le champ `kycStatus` reste le **placeholder** de STORY-029 (alimentation par `kyc.status.changed` = STORY-021).
- **Pas de reprise de données legacy.** Les collections `Tenant`/`User` possédées ne sont **pas migrées** : en `rs256`, l'identité vient du rejeu `identity.*`. Les environnements repartent d'un IdP peuplé ; aucun `drop` destructif n'est exécuté (collections orphelines laissées inertes).
- **`emailVerified` et parcours de vérification.** La vérification d'e-mail est **entièrement** à l'IdP (STORY-025) : `email-verification.service.ts` et la file mail correspondante côté EC deviennent obsolètes. Vérifier qu'aucun guard EC n'attend un flag positionné localement (il vient du JWT).
- **Dépendances npm.** Après retrait de l'émission, auditer `package.json` : `@nestjs/jwt` (signature) et le secret d'accès ne sont plus requis ; `jwks-rsa`/`passport-jwt` restent (validation).

### Vérification docker (cutover réel)

Le cutover **n'est validé que docker bout-en-bout** (le mode `rs256` n'a de sens qu'avec l'IdP réel émettant des RS256 et publiant `identity.*`). Scénario minimal :

1. `docker compose up` (racine, `AUTH_MODE` par défaut = `rs256`) → `expert-comptable` boot, `/health` : mongo + redis + **kafka** up ; consumer group `expert-comptable-identity` assigné.
2. `register` (IdP `:3001`) → read-models EC peuplés + `OrgProfile` provisionné.
3. `login` (IdP) → RS256 → `GET /auth/me` + endpoint métier EC (`:3000`) → 200 via JWKS.
4. Token HS256 forgé / altéré / absent → 401.
5. Suspension (IdP) → read-model `SUSPENDED` → endpoint métier EC → refus.
6. Routes legacy (`POST /auth/login`, `/users`) → **404** (surface retirée).

---

## Dependencies

**Stories prérequises :**
- **STORY-028** — validation JWKS (mode `rs256`) : la seule brique auth conservée. *(done)*
- **STORY-029** — read-models `identity.*` + `IdentityReadModelService` (résolutions, coupure, provisioning `OrgProfile`) : cible du repointage. *(done)*
- **STORY-024 / 026 / 027** — l'IdP émet (RS256/JWKS), gère les comptes/rôles/invitations/seed, et publie `identity.*` : sans eux, retirer le legacy laisserait le vertical sans identité. *(done)*

**Infrastructure :**
- Compose **racine** (STORY-022) : `auth-service` `:3001` + `expert-comptable` `:3000` + Kafka + MongoDB `rs0` + Mailhog — nécessaire à l'e2e cross-service.

**Stories débloquées / suivantes :**
- **STORY-020** — scaffold `kyc-service` + migration upload/statut : le cutover (030) précède l'extraction KYC (ordre critique du sprint plan).
- **STORY-021 / 014** — read-model KYC + `TenantStateGuard` : s'appuient sur un `expert-comptable` déjà *relying party* pur.

---

## Definition of Done

- [ ] Code implémenté (retrait émission/comptes, `JwtStrategy` découplée + RS256-only, repointages KYC/mail, relocalisation enums, seed retiré) et committé sur branche `STORY-030` (sur demande).
- [ ] Tests unitaires (≥ seuil projet) :
  - [ ] `/auth/me` échoue proprement sans token, renvoie l'écho JWT avec token valide (mocké).
  - [ ] KYC ancré sur `OrgProfile` (lecture/écriture par `orgId`).
  - [ ] Résolutions (destinataires / dernier admin) depuis read-model — aucun appel `UsersService`/`TenantsService`.
  - [ ] Boot échoue si `AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE` manquants.
- [ ] Suites e2e legacy d'émission **retirées** ; e2e restantes réécrites en RS256 minté ; **e2e cross-service** ajouté.
- [ ] **Vérification docker bout-en-bout** (`AUTH_MODE=rs256`, compose racine) : register/login IdP → JWT RS256 → endpoints EC via JWKS (200) → `identity.*` → read-models à jour ; suspension → refus ; routes legacy → 404 ; HS256 forgé → 401.
- [ ] `lint` 0, build OK, couverture conforme ; aucun import mort ni dépendance orpheline.
- [ ] `/code-review` formel + revue story ↔ code.
- [ ] Documentation : README/architecture du service notés « *relying party* pur, IdP source de vérité » ; `.env.example` d'`expert-comptable` mis à jour (JWKS requis, secret d'émission retiré).
- [ ] Statut mis à jour dans `docs/sprint-status.yaml` (STORY-030 + EPIC-006 clos ; sprint 5 : +5 pts).

---

## Story Points Breakdown

- **Retrait émission (routes/AuthService/TokenService) + découplage & réduction `JwtStrategy`** : **2 pts**
- **Retrait `Users`/`Tenants` + relocalisation enums + repointages (KYC→`OrgProfile`, mail→read-model, seed)** : **2 pts**
- **Bascule config `rs256` + réécriture e2e (retrait legacy, RS256 minté) + e2e cross-service + vérif docker** : **1 pt**
- **Total : 5 points**

**Rationale :** essentiellement du **retrait et du repointage** (peu de logique neuve — la cible existe depuis STORY-028/029), mais avec un **couplage à démêler proprement** (`JwtStrategy` piégée dans `AuthModule`, `Role` sous `UsersModule`, KYC sur `Tenant`) et une **preuve cross-service** docker. Le risque est la **régression par cascade d'imports morts** et la **non-régression e2e**, plus que le volume — d'où 5 (et non 3).

---

## Additional Notes

- **Clôture d'EPIC-006.** Après STORY-030, `expert-comptable` est un *relying party* **pur** : il ne signe aucun jeton, ne possède aucun compte, valide localement (JWKS) et réplique l'identité par événement (read-models STORY-029). L'IdP est l'unique propriétaire — driver « un seul propriétaire d'identité » **atteint**.
- **Ordre critique respecté.** Le sprint plan impose « le cutover (030) précède l'extraction kyc (020) » : c'est pourquoi KYC est ici **repointé** (Tenant→`OrgProfile`) mais **non extrait**.
- **Symétrie des read-models.** À terme, `expert-comptable` porte les read-models identité (STORY-029) puis KYC (STORY-021) ; `bilan-service` portera entitlement (EPIC-008) — tous alimentés par Kafka, tous locaux au chemin chaud, aucun appel synchrone à un propriétaire.
- **Sécurité renforcée par soustraction.** Retirer la branche HS256 supprime **structurellement** la surface *algorithm-confusion* (plus de secret symétrique de vérification, plus de flag réversible) : la robustesse ne dépend plus d'une valeur d'`AUTH_MODE` correcte en production.

---

## Implementation Notes (2026-07-09)

**Livré (service `expert-comptable`, 100 % côté vertical — l'IdP est inchangé) :**

- **Retrait de l'émission de jetons** : `AuthController` réduit au seul `GET /auth/me` (écho du JWT validé, `@AllowUnverified`, sans accès base) ; `AuthService`, `TokenService`, `auth.constants`, tous les DTOs d'émission (register/login/refresh/verify-email/accept-invitation/tokens/message) **supprimés**. `AuthModule` réduit à `PassportModule` + `JwtStrategy`.
- **RS256/JWKS uniquement** : `JwtStrategy` a perdu sa branche HS256 ([jwt.strategy.ts](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts)) — RS256 imposé, `iss`/`aud`/JWKS vérifiés, plus aucun secret de signature. `AuthConfig` réduit à `{ jwksUri, issuer, audience }` ; `env.validation` rend **`AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE` requis** et retire `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`AUTH_MODE`. Compose racine : bloc `expert-comptable` nettoyé (plus de secrets ni d'`AUTH_MODE`). `AccessTokenPayload` réduit à la forme IdP (`sub`/`org`/`roles[]`/`emailVerified`/`iss`/`aud`).
- **Retrait de la propriété d'identité** : modules `UsersModule` (CRUD `/users`, invitations, `UsersService`/`UsersRepository`, schéma `User`) et `TenantsModule` (schéma `Tenant`, `TenantsService`) **supprimés** ; `seed-platform-admin` (+ script `seed:admin`) retiré ; `PasswordService` + `bcrypt` retirés (plus d'authentification de mot de passe ici). Dépendances orphelines retirées de `package.json` (`@nestjs/jwt` → devDependency pour les tests, `bcrypt`, `slugify`).
- **Enums neutres relocalisés** : `Role` et `KycStatus` déplacés vers [`common/enums/`](../../expert-comptable/src/common/enums/) ; ~20 imports mis à jour ; `slug.util` (mort) supprimé.
- **KYC ancré sur `OrgProfile`** : nouveau [`OrgProfileService`](../../expert-comptable/src/modules/identity/org-profile.service.ts) (exporté par `IdentityModule`) ; `OrgProfile` étendu de `kycRejectionReason`/`kycReviewedAt` ; `KycStatusService` lit/écrit le statut KYC sur `OrgProfile` (clé `orgId` = `tenantId` du contexte `rs256`), plus sur `Tenant` ; `KycModule` importe `IdentityModule`.
- **Mail rebasculé sur le read-model** : `MailProcessor` réduit au seul e-mail de **confirmation KYC** (vérif e-mail/invitations = IdP) ; destinataire résolu via `IdentityReadModelService.resolveUserContact` (read-model), plus via `UsersService` ; `EmailVerificationService`, templates verification/invitation, méthodes `MailerService` correspondantes **supprimés** ; `MailModule` importe `IdentityModule`.
- **Coupure d'accès câblée (nouveau)** : [`IdentitySuspensionGuard`](../../expert-comptable/src/common/guards/identity-suspension.guard.ts) ajouté à la chaîne globale **après** `RolesGuard` — refuse (**403**) si l'org (ou l'user) est **explicitement `SUSPENDED`** dans le read-model d'identité (nouvelle lecture `isOrganizationSuspended`). **Fail-open sur absence** (entité pas encore répliquée → non refusée), pour ne jamais faire de faux 403 pendant la latence événementielle. La matrice complète KYC/abonnement reste `TenantStateGuard` (STORY-014).

**Décisions notables :**
- **`/auth/me` conservé** comme écho JWT (cible de *smoke* JWKS + identité courante), sans accès base.
- **Mode mono `rs256`** : la branche HS256 est retirée (pas seulement désactivée par flag) → surface *algorithm-confusion* éliminée structurellement.
- **`IdentitySuspensionGuard`** : STORY-029 avait livré le read-model + les résolveurs de coupure mais **aucun guard** ne les enforçait sur le chemin chaud ; STORY-030 câble l'enforcement de la **suspension d'identité** (fail-open sur absence), honorant l'AC « endpoint refuse ». La coupure KYC/abonnement complète reste STORY-014.
- **Pas de reprise de données legacy** : les read-models se peuplent par rejeu `identity.*` (`fromBeginning`, STORY-029) ; aucune migration `Tenant`/`User` ni `drop` destructif.

**Qualité :** `lint` 0, `build` OK. **149 tests unitaires** (28 suites) verts ; **37 e2e** verts (5 suites, dont `auth-jwks`, `admin`, `kyc-*` **rejoués en RS256 minté** via [`test/utils/rs256.ts`](../../expert-comptable/test/utils/rs256.ts)). Couverture globale **99.58 / 88.80 / 99.20 / 99.54** (seuils 90/65/90/90) ; `jwt.strategy`, `org-profile.service`, `identity-suspension.guard`, `auth.controller` à 100 %.

**VÉRIF DOCKER BOUT-EN-BOUT (2026-07-09) — stack racine, `auth-service` `:3001` + `expert-comptable` `:3000`, mode RS256 par défaut :**
1. Boot : `expert-comptable` **healthy** avec la config JWKS requise et **sans** secret d'émission (cutover runtime effectif).
2. **Round-trip** : `register` (IdP) → 201 ; `login` → JWT **RS256** (kid + claims `sub`/`org`/`roles`/`aud=[expert-comptable,kyc-service]`/`iss=prospera-auth`) ; `GET /auth/me` (EC via **JWKS**) → **200**, `org → tenantId`, `roles[] → role=TENANT_ADMIN`.
3. **Provisioning cross-service** : `identity.*` consommés → read-models `identity_organizations` (ACTIVE), `identity_users` (ACTIVE), `identity_memberships` (TENANT_ADMIN/ACTIVE) peuplés + `org_profiles` provisionné (`kycStatus: PENDING_DOCUMENTS`).
4. **KYC ancré sur `OrgProfile`** : `GET /kyc/status` (EC via JWKS, user vérifié) → **200** `{kycStatus: PENDING_DOCUMENTS}`.
5. **Algorithm-confusion** : jeton **HS256 forgé** → **401** (sur le service réel).
6. **Legacy retiré** : `POST /auth/login`, `POST /auth/register`, `GET /users` (EC) → **404** ; sans token / token altéré → **401**.
7. **Coupure cross-service** : `POST /admin/organizations/:id/suspend` (IdP, PLATFORM_ADMIN) → `identity.org.updated(SUSPENDED)` → read-model EC `SUSPENDED` (nom préservé) → le **même jeton encore valide** est **refusé (403)** sur `/kyc/status` **et** `/auth/me` (`IdentitySuspensionGuard`) ; l'IdP bloque par ailleurs toute nouvelle connexion de l'org suspendue.

**Reste :** `/code-review` formel + commit sur demande.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-09 : Créée par vivian (Scrum Master / BMAD)
- 2026-07-09 : Implémentée + vérifiée docker bout-en-bout (Developer / BMAD)

**Effort réel :** 5 points (conforme à l'estimation)

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implémentation).**
