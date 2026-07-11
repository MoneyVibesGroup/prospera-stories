---
baseline_commit: NO_VCS
---

# STORY-026 : Gestion utilisateurs + rôles + memberships + seed PLATFORM_ADMIN

**Epic :** EPIC-005 — Extraction `auth-service` (fournisseur d'identité / IdP)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Conception de l'API (users / organizations / RBAC) · §Données (Membership, garde-fou dernier admin) · `architecture-prospera-ecosystem-2026-07-04.md` (l'IdP est source de vérité de l'identité ; les `identity.*` inter-services restent STORY-027)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Validé (revue + correctifs + vérification docker bout-en-bout, 2026-07-08) — reste : `/code-review` formel + commit sur demande
**Assigné à :** Unassigned
**Créée le :** 2026-07-07
**Sprint :** 4
**Service :** auth-service (`:3001`)
**Couvre :** FR-004 (gestion des utilisateurs du tenant) — volet gouvernance des membres/rôles de l'IdP

> **La gestion des membres complète le socle d'identité de l'IdP.** STORY-023 a posé le modèle normalisé (`Organizations` / `Users` / `Memberships` + `register` atomique), STORY-024 la chaîne de guards (`JwtAuthGuard` → `EmailVerifiedGuard` → `RolesGuard`) et l'émission RS256, STORY-025 l'**invitation** (`POST /users`, `POST /users/:id/resend-invitation`) et l'acceptation. STORY-026 **rend administrable** l'organisation : lister ses membres, changer leur rôle, les suspendre/réactiver/supprimer (soft), consulter et modifier le profil d'organisation, le tout **org-scopé** et protégé par le **garde-fou du dernier `TENANT_ADMIN`**. Elle **seede** enfin le `PLATFORM_ADMIN` (script hors API) et **branche sa résolution de rôle** dans l'émission de jetons (un opérateur sans organisation obtient `roles: ['PLATFORM_ADMIN']`). Ré-hébergement de `expert-comptable` STORY-009 (CRUD users) + STORY-007 (seed super-admin), transposé au modèle `Membership`. **Aucun événement Kafka ici** : les `identity.*` (dont l'admin plateforme des organisations) restent STORY-027.

---

## User Story

En tant que **super-admin d'un cabinet** (`TENANT_ADMIN`), je veux **gérer les membres de mon organisation et leurs rôles** (lister, changer de rôle, suspendre/réactiver, supprimer, éditer le profil d'organisation),
et en tant qu'**opérateur de la plateforme**, je veux un **`PLATFORM_ADMIN` seedé hors API**,
afin de **gouverner les accès de mon organisation en toute sécurité** et de **disposer d'un super-admin plateforme sans jamais l'exposer à une route publique**.

---

## Description

### Contexte

À l'ouverture de la story, l'IdP sait **créer** de l'identité (`register` en STORY-023, invitation en STORY-025) et **émettre** des jetons (STORY-024), mais il ne sait pas encore l'**administrer** :

- le `UsersController` n'expose que l'**invitation** (`POST /users`) et le **renvoi d'invitation** (`POST /users/:id/resend-invitation`) — pas de **liste**, pas de **changement de rôle**, pas de **suspension**, pas de **suppression** ;
- il n'existe **aucun** endpoint de profil courant (`GET /users/me`) ni de profil d'organisation (`GET/PATCH /organizations/me`) ;
- le **garde-fou du dernier admin** n'est appliqué nulle part (bien que `MembershipsService.countActiveAdmins()` existe déjà, posé en STORY-023) ;
- le **`PLATFORM_ADMIN` n'est pas seedé** dans `auth-service`, et surtout **sa résolution de rôle n'est pas branchée** : `issueSession()` dérive les rôles **exclusivement** du membership actif (`const roles = membership ? [membership.role] : []`), donc un opérateur **sans organisation** obtiendrait `roles: []` → `role: null` → **`RolesGuard` lui refuserait tout** ([auth.service.ts:231-232](../../auth-service/src/modules/auth/auth.service.ts#L231-L232), [jwt.strategy.ts:88-91](../../auth-service/src/modules/auth/strategies/jwt.strategy.ts#L88-L91)).

STORY-026 comble ces manques en **ré-hébergeant** deux briques déjà éprouvées dans `expert-comptable` :

- **CRUD utilisateurs + garde-fous** (repris d'EC STORY-009 — `UsersController`/`UsersService`), **transposé au modèle `Membership`** : le rôle et le statut d'appartenance vivent désormais sur `Membership` (org-scopé), plus sur `User.tenantId+role`. Un `TENANT_ADMIN` liste **les membres de son organisation** (jointure `Membership` → `User`), change le **rôle** (`Membership.role`), **suspend/réactive** (`Membership.status` + `User.status`) et **supprime en soft** (`User.deletedAt`) — toujours borné à **son** `orgId`.
- **Seed `PLATFORM_ADMIN`** (repris d'EC STORY-007 — `seeds/seed-platform-admin.ts`) : script **standalone** (contexte applicatif Nest, pas de serveur HTTP), idempotent (upsert par e-mail), lit `PLATFORM_ADMIN_EMAIL`/`PASSWORD` en environnement, ne journalise **jamais** le mot de passe. Transposé au modèle normalisé : le `PLATFORM_ADMIN` est un `User` `ACTIVE` (e-mail vérifié) **sans organisation ni membership** ; son rôle plateforme est porté par un champ **`platformRole`** sur `User`, lu par `issueSession()` pour émettre `roles: ['PLATFORM_ADMIN']`, `org: null`.

**Reprise, pas réécriture** : le diff conceptuel = normalisation `Membership` (le rôle/statut ne sont plus des colonnes de `User`) + branchement de la résolution de rôle plateforme dans `issueSession`. La chaîne de guards (`RolesGuard` global) et le `@Roles(...)` sont déjà en place (STORY-022/024) — on les **consomme**, on ne les recrée pas.

### Périmètre

**Inclus :**

- **Gestion des membres (org-scopée, `[TENANT_ADMIN]`)** — extension du `UsersController` (existant, STORY-025) :
  - `GET /api/v1/users` — **liste paginée** des membres de l'organisation de l'appelant (jointure `Membership(orgId)` → `User`), avec `role`, `status`, `email`, nom, `lastLoginAt` ; filtres simples (`status`), pagination (`page`/`limit`). Exclut les `User` `deletedAt`.
  - `GET /api/v1/users/me` — **authentifié (tout rôle)** : profil de l'utilisateur courant + son membership (organisation, rôle). Un `PLATFORM_ADMIN` (sans org) reçoit `organization: null`, `role: PLATFORM_ADMIN`.
  - `PATCH /api/v1/users/:id` — **rôle / suspension / réactivation** : DTO `UpdateUserDto` `{ role?, status? }` borné à `{TENANT_USER, TENANT_ADMIN}` / `{ACTIVE, SUSPENDED}`. Change `Membership.role` et/ou synchronise `Membership.status` + `User.status`. **Garde-fou dernier admin** appliqué (voir ci-dessous). La **suspension révoque la session** (efface `User.refreshTokenHash`).
  - `DELETE /api/v1/users/:id` — **suppression douce** : `User.deletedAt` renseigné, `User.status = SUSPENDED`, `Membership.status = SUSPENDED`, `refreshTokenHash` effacé. **Garde-fou dernier admin** appliqué. Idempotent (re-DELETE d'un membre déjà supprimé → 404/no-op).
  - *(déjà livrés en STORY-025, inchangés)* `POST /api/v1/users` (invite), `POST /api/v1/users/:id/resend-invitation`.
- **Profil d'organisation** — nouveau `OrganizationsController` :
  - `GET /api/v1/organizations/me` — **authentifié** : profil de l'organisation courante (`name`, `slug`, `phone`, `country`, `address`, `status`).
  - `PATCH /api/v1/organizations/me` — **`[TENANT_ADMIN]`** : DTO `UpdateOrganizationDto` `{ name?, phone?, country?, address? }` (jamais `slug` ni `status` — le `slug` est stable, le `status` relève de l'admin plateforme, STORY-027).
- **Garde-fou « dernier admin »** (invariant métier) : **impossible** de rétrograder (`TENANT_ADMIN` → `TENANT_USER`), suspendre ou supprimer le **dernier `TENANT_ADMIN` actif** d'une organisation → **409** (`LAST_ADMIN_MESSAGE`). Implémenté via `MembershipsService.countActiveAdmins(orgId)` (existant) évalué **dans la transaction** de mutation.
- **Seed `PLATFORM_ADMIN`** :
  - `src/seeds/seed-platform-admin.ts` (repris d'EC, transposé) : cœur testable `seedPlatformAdmin(deps)` + bootstrap standalone (`NestFactory.createApplicationContext`, pas de HTTP) ; idempotent (upsert par e-mail) ; **jamais** de mot de passe en clair dans les logs ; code de sortie non nul si `PLATFORM_ADMIN_EMAIL`/`PASSWORD` manquent.
  - **Champ `platformRole?: Role` sur `User`** (nullable ; seul `PLATFORM_ADMIN` autorisé) + `UsersService.upsertPlatformAdmin(...)` (crée/maj un `User` `ACTIVE`, `emailVerifiedAt` renseigné, `passwordHash`, `platformRole = PLATFORM_ADMIN`, **sans** organisation ni membership).
  - **Branchement de la résolution de rôle** : `issueSession()`/login lisent `user.platformRole` → si présent (et pas de membership), émettent `roles: [platformRole]`, `org: null`. Le `PLATFORM_ADMIN` peut alors `login` et franchir un `@Roles(PLATFORM_ADMIN)` (utilisé dès STORY-027 pour l'admin des organisations).
  - `npm run seed:admin` (script package.json, `ts-node` en dev ; `node dist/seeds/seed-platform-admin.js` en prod).
- **RBAC** : la chaîne `RolesGuard` (global `APP_GUARD`, STORY-024) est **consommée** via `@Roles(TENANT_ADMIN)` sur les mutations et `@Roles(PLATFORM_ADMIN)` réservé à STORY-027 ; `GET /users/me` et `GET /organizations/me` sont **authentifiés sans rôle requis**.
- **DTO / réponses** : enrichir `UserResponseDto` (ajouter `firstName`, `lastName`, `role`, `lastLoginAt`) ; `UpdateUserDto`, `UpdateOrganizationDto`, `OrganizationResponseDto`, `PaginatedUsersDto` (ou enveloppe `{ items, total, page, limit }`) ; `ListUsersQueryDto` (`page`, `limit`, `status?`).
- **Swagger** : tag `users` (list/me/patch/delete) + nouveau tag `organizations` (me/patch) — codes 200/400/403/404/409, messages génériques.
- **Tests** : unitaires (résolution org-scopée ; garde-fou dernier admin sur PATCH **et** DELETE ; suspension → révocation de session ; soft-delete ; `upsertPlatformAdmin` + `seedPlatformAdmin` OK/variables manquantes ; `issueSession` émet `PLATFORM_ADMIN` sans org) + **e2e** (parcours admin complet) + **vérification docker** (login PLATFORM_ADMIN seedé ; garde-fou live — cf. DoD).

**Hors périmètre :**

- **Événements `identity.*`** (`identity.membership.changed`, `identity.user.suspended`, `identity.org.updated`) + **transactional outbox** Kafka → **STORY-027**. Les mutations de 026 modifient l'**état local** de l'IdP ; les hooks de publication **restent inertes** (les relying parties ne verront la suspension/le changement de rôle qu'à partir de STORY-027/029). C'est un **seam** documenté, pas un oubli.
- **Admin plateforme des organisations** (`GET /admin/organizations`, `GET /admin/organizations/:id`, `POST /admin/organizations/:id/suspend`, `[PLATFORM_ADMIN]`) → **STORY-027**. STORY-026 se limite à **seeder** le `PLATFORM_ADMIN` et à **rendre son rôle opérant** dans les jetons ; aucun endpoint `/admin/*` n'est ajouté ici.
- **Multi-organisation / multi-membership** (un `User` membre de plusieurs orgs) : phase 1 = **un** membership actif ; `GET /users/me` et `issueSession` prennent le membership actif unique. Différé.
- **Changement de mot de passe / profil self-service** (`PATCH /users/me`, changement d'e-mail) : hors périmètre EPIC-005 (n'existe pas dans EC à ce stade). Différé.
- **Transfert de propriété d'organisation**, **hard delete**, **purge RGPD** : hors périmètre MVP.
- **Réinitialisation de mot de passe (« mot de passe oublié »)** : non planifié dans EPIC-005 (cohérent avec STORY-025).

### Flux (utilisateur)

**A. Gestion des membres (TENANT_ADMIN)**
1. Un `TENANT_ADMIN` fait `GET /users` → **liste paginée** des membres de **son** organisation (avec rôle + statut). Les membres d'autres organisations sont **invisibles**.
2. Il fait `PATCH /users/:id { role: 'TENANT_ADMIN' }` pour promouvoir un collaborateur → `Membership.role` mis à jour → **200**.
3. Il fait `PATCH /users/:id { status: 'SUSPENDED' }` pour suspendre un membre → `Membership.status` + `User.status = SUSPENDED`, **session révoquée** (le refresh du suspendu → 401) → **200**. Réactivation via `{ status: 'ACTIVE' }`.
4. Il fait `DELETE /users/:id` → suppression **douce** (le membre disparaît de la liste, ne peut plus se connecter) → **204**.
5. *(garde-fou)* S'il tente de rétrograder / suspendre / supprimer le **dernier `TENANT_ADMIN` actif** → **409** « Impossible de retirer le dernier administrateur actif. ».

**B. Profil d'organisation**
1. Un membre fait `GET /organizations/me` → profil de son organisation.
2. Un `TENANT_ADMIN` fait `PATCH /organizations/me { name, phone, address }` → profil mis à jour (`slug` et `status` **non modifiables**) → **200**.

**C. Seed PLATFORM_ADMIN (opérateur, hors API)**
1. L'opérateur définit `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` (+ noms optionnels) en environnement.
2. Il lance `npm run seed:admin` (dev, dans le conteneur) → un `User` `PLATFORM_ADMIN` `ACTIVE` (sans org) est **créé ou mis à jour** ; le mot de passe **n'est jamais** affiché.
3. Le `PLATFORM_ADMIN` fait `POST /auth/login` → access token portant `roles: ['PLATFORM_ADMIN']`, `org: null` → il pourra franchir les endpoints `[PLATFORM_ADMIN]` (livrés en STORY-027).
4. *(idempotence)* Re-lancer le seed avec le même e-mail → **met à jour** (pas de doublon) ; variables manquantes → **échec explicite** (code de sortie non nul), aucune écriture.

---

## Acceptance Criteria

- [ ] **Liste org-scopée** : `GET /api/v1/users` (`[TENANT_ADMIN]`) renvoie **uniquement** les membres de l'organisation de l'appelant (jointure `Membership(orgId)` → `User`), **paginée** (`page`/`limit`) et filtrable (`status`), avec `role` (du membership) et `status`. Les `User` `deletedAt` sont **exclus**. Un admin d'une autre org ne voit **jamais** ces membres.
- [ ] `GET /api/v1/users/me` (**authentifié, tout rôle**) : renvoie le profil courant + membership (organisation, rôle) ; un `PLATFORM_ADMIN` reçoit `organization: null`, `role: 'PLATFORM_ADMIN'`.
- [ ] **Changement de rôle** : `PATCH /api/v1/users/:id { role }` (`[TENANT_ADMIN]`) met à jour `Membership.role` (borné `{TENANT_USER, TENANT_ADMIN}`) pour un membre **de son org** → **200** ; cible hors org → **404 générique** (pas d'oracle inter-org).
- [ ] **Suspension / réactivation** : `PATCH /api/v1/users/:id { status }` synchronise `Membership.status` **et** `User.status` (`ACTIVE`/`SUSPENDED`) ; la **suspension révoque la session** (efface `refreshTokenHash`) et un `login`/`refresh` du suspendu → **401 générique**.
- [ ] **Suppression douce** : `DELETE /api/v1/users/:id` (`[TENANT_ADMIN]`) renseigne `User.deletedAt`, passe `User.status`/`Membership.status` à `SUSPENDED`, efface `refreshTokenHash` → **204** ; le membre disparaît de `GET /users` et ne peut plus se connecter. Re-DELETE → **404**/no-op idempotent.
- [ ] **Garde-fou dernier admin** : rétrograder, suspendre **ou** supprimer le **dernier `TENANT_ADMIN` actif** d'une organisation est **refusé** → **409** (`LAST_ADMIN_MESSAGE`). Vérifié **dans la transaction** via `countActiveAdmins(orgId)` (pas de fenêtre de course). S'il reste ≥ 2 admins actifs, l'opération passe.
- [ ] **Profil d'organisation** : `GET /api/v1/organizations/me` (authentifié) renvoie le profil de l'org courante ; `PATCH /api/v1/organizations/me` (`[TENANT_ADMIN]`) met à jour `{ name?, phone?, country?, address? }` uniquement — **`slug` et `status` ne sont jamais modifiables** par cet endpoint.
- [ ] **Seed `PLATFORM_ADMIN`** : `npm run seed:admin` crée/maj (idempotent, upsert par e-mail) un `User` `PLATFORM_ADMIN` `ACTIVE`, `emailVerifiedAt` renseigné, **sans organisation ni membership**, `platformRole = PLATFORM_ADMIN` ; le mot de passe n'est **jamais** journalisé ; `PLATFORM_ADMIN_EMAIL`/`PASSWORD` manquants → **échec explicite** (exit ≠ 0), aucune écriture. **Aucune route HTTP** ne permet de créer un `PLATFORM_ADMIN`.
- [ ] **Rôle plateforme opérant** : après seed, `POST /auth/login` du `PLATFORM_ADMIN` renvoie un access token portant `roles: ['PLATFORM_ADMIN']`, `org: null` ; `issueSession()` lit `platformRole` quand il n'y a pas de membership actif (login/refresh cohérents). Un `@Roles(PLATFORM_ADMIN)` (test) est franchi.
- [ ] **RBAC & isolation** : toutes les mutations `[TENANT_ADMIN]` sont refusées (**403**) à un `TENANT_USER` ; toutes les opérations sont **bornées à `orgId`** (membership de l'appelant) ; anti-énumération (cibles hors org → **404 générique**, pas de fuite d'existence).
- [ ] **Qualité** : `lint` 0 warning ; **couverture** ≥ seuils (statements/branches/functions/lines conformes au gate du repo, cf. STORY-025) ; `nest build` OK ; suites STORY-022/023/024/025 **toujours vertes**.
- [ ] **`docker compose up` (racine)** : parcours vérifiés bout-en-bout — (1) admin liste ses membres ; promotion/rétrogradation ; suspension → refresh du suspendu **401** ; soft-delete → membre absent de la liste ; (2) tentative sur le **dernier admin** → **409** ; (3) `seed:admin` dans le conteneur → `login` PLATFORM_ADMIN **200** avec `roles: ['PLATFORM_ADMIN']`. Résultats consignés en *Progress Tracking*.

---

## Technical Notes

### Composants / fichiers (auth-service)

```
src/modules/users/users.controller.ts            # + GET / (liste), GET /me, PATCH /:id, DELETE /:id  (étend STORY-025)
src/modules/users/users.service.ts               # + listByOrganization(paginé), findMemberOfOrg, softDelete, upsertPlatformAdmin
src/modules/users/user-management.service.ts     # (option) orchestration transactionnelle PATCH/DELETE + garde-fou  (NOUVEAU, optionnel)
src/modules/users/dto/update-user.dto.ts         # { role?, status? } bornés  (NOUVEAU)
src/modules/users/dto/list-users-query.dto.ts    # { page?, limit?, status? }  (NOUVEAU)
src/modules/users/dto/user-response.dto.ts       # + firstName, lastName, role, lastLoginAt
src/modules/users/dto/paginated-users.dto.ts     # { items, total, page, limit }  (NOUVEAU)
src/modules/users/schemas/user.schema.ts         # + platformRole?: Role (nullable ; index sparse)
src/modules/users/users.module.ts                # exporte/injecte MembershipsService, OrganizationsService au besoin

src/modules/memberships/memberships.service.ts   # + updateRole, updateStatus, findByUserAndOrg, listByOrganization ; countActiveAdmins (existant, réutilisé)

src/modules/organizations/organizations.controller.ts  # GET /me, PATCH /me  (NOUVEAU)
src/modules/organizations/organizations.service.ts     # + updateProfile(orgId, dto)
src/modules/organizations/organizations.module.ts      # + controller
src/modules/organizations/dto/update-organization.dto.ts   # { name?, phone?, country?, address? }  (NOUVEAU)
src/modules/organizations/dto/organization-response.dto.ts # (NOUVEAU)

src/modules/auth/auth.service.ts                 # issueSession lit platformRole quand pas de membership → roles:[PLATFORM_ADMIN], org:null
src/modules/auth/token.service.ts                # inchangé (accepte déjà orgId:null, roles:string[])

src/seeds/seed-platform-admin.ts                 # seedPlatformAdmin(deps) + bootstrap standalone  (repris EC STORY-007, transposé) (NOUVEAU)
package.json                                      # + "seed:admin": "ts-node src/seeds/seed-platform-admin.ts"
docker-compose.yml (racine)                       # défauts PLATFORM_ADMIN_EMAIL/PASSWORD/NAMES pour auth-service (dev)
```

*Changement de schéma minimal* : un seul champ ajouté — `User.platformRole?` (index `sparse`). Le reste du modèle (`Membership.role`/`status`, index `{organizationId, role}` du garde-fou, `User.deletedAt`) existe déjà (STORY-023).

### Résolution des rôles (le point-clé)

Aujourd'hui `issueSession()` fait `const roles = membership ? [membership.role] : []` ([auth.service.ts:231-232](../../auth-service/src/modules/auth/auth.service.ts#L231-L232)). Un `PLATFORM_ADMIN` **n'a pas** de membership (il n'appartient à aucune org, et `Membership.organizationId` est `required`). On introduit donc :

- **`User.platformRole?: Role`** (nullable, seul `PLATFORM_ADMIN` autorisé), renseigné **uniquement** par le seed ;
- dans `issueSession()`/login : `const roles = membership ? [membership.role] : (user.platformRole ? [user.platformRole] : [])` et `org = membership?.organizationId ?? null`.

Ainsi le claim `roles` et `org: null` sont cohérents pour l'opérateur, sans casser le chemin nominal (membership prioritaire). `jwt.strategy.ts` projette déjà `role: payload.roles[0] ?? null` — un PLATFORM_ADMIN aura donc `role = PLATFORM_ADMIN`, `tenantId = null`, ce qui satisfait `@Roles(PLATFORM_ADMIN)` en STORY-027. *(Alternative écartée : membership « virtuel » `organizationId: null` → casse l'index unique et le `required` du schéma.)*

### Garde-fou « dernier admin » (invariant transactionnel)

- Toute opération qui **retire un `TENANT_ADMIN` actif** (rétrogradation via `PATCH role`, suspension via `PATCH status`, `DELETE`) doit, **dans la même transaction** que la mutation, vérifier `countActiveAdmins(orgId) >= 2` **avant** d'appliquer — sinon **409** `LAST_ADMIN_MESSAGE`, rollback.
- L'index `{ organizationId: 1, role: 1 }` (STORY-023) rend `countActiveAdmins` efficace. Le contrôle **dans la transaction** (replica set `rs0`, même patron que `register`/`invite`) évite la course « deux admins se rétrogradent simultanément ».
- Ne s'applique **que** si la cible **est** un `TENANT_ADMIN` actif et que l'opération la retire (promouvoir un `TENANT_USER`, ou muter un membre non-admin, ne déclenche pas le garde-fou).

### Isolation & anti-énumération

- **Org-scope systématique** : chaque `:id` est résolu via `findByUserAndOrg(userId, callerOrgId)` (le membership doit exister **dans l'org de l'appelant**) ; une cible hors org → **404 générique** (même réponse que « inexistant ») → aucun oracle d'existence inter-org.
- `GET /users` filtre par `organizationId` du membership de l'appelant ; jamais de liste globale (celle-là relève de `[PLATFORM_ADMIN]`, STORY-027).
- Un `TENANT_ADMIN` **peut** se cibler lui-même (auto-rétrogradation, auto-suspension) — mais le **garde-fou dernier admin** l'empêche s'il est le dernier.

### Suspension = révocation de session

- Suspendre (ou supprimer) un membre **efface son `refreshTokenHash`** (`UsersService.clearRefreshTokenHash`, existant) → le refresh en cours → **401** (détection de réutilisation STORY-024). L'access token courant reste valide jusqu'à expiration (nature stateless du JWT) — dégradation acceptée, documentée ; le durcissement (deny-list) est hors périmètre.
- Le login d'un `User` `SUSPENDED` doit échouer **401 générique** : ajouter le contrôle `status !== SUSPENDED` (ou `!deletedAt`) au chemin login, aligné sur le contrôle « org suspendue » existant ([auth.service.ts:316-322](../../auth-service/src/modules/auth/auth.service.ts#L316-L322)).

### Seed `PLATFORM_ADMIN` (repris d'EC STORY-007)

- **Standalone** : `NestFactory.createApplicationContext(AppModule)` (pas de serveur HTTP), `import` différé d'`AppModule` (évite de déclencher la validation d'env au simple import par les tests du cœur `seedPlatformAdmin`).
- **Cœur testable** `seedPlatformAdmin(deps)` : lit `PLATFORM_ADMIN_EMAIL`/`PASSWORD` (+ `_FIRST_NAME`/`_LAST_NAME` optionnels), hache via `PasswordService.hash`, `usersService.upsertPlatformAdmin(...)`, log « créé/mis à jour » **sans** mot de passe ; renvoie `false` (sans lever) si une variable requise manque → l'appelant fixe `process.exitCode = 1`.
- **`upsertPlatformAdmin`** (nouveau, `UsersService`) : upsert par e-mail d'un `User` `ACTIVE`, `emailVerifiedAt = now`, `passwordHash`, `platformRole = PLATFORM_ADMIN`, **sans** `organizationId`/membership.
- **Exécution** : dev `npm run seed:admin` (ts-node dans le conteneur `auth-service`) ; prod `node dist/seeds/seed-platform-admin.js`. Défauts dev fournis via compose (`${PLATFORM_ADMIN_EMAIL:-…}`), **jamais** de secret réel commité.

### Cas limites

- **Dernier admin se rétrograde/suspend/supprime lui-même** → **409** (garde-fou). Il doit d'abord promouvoir un autre membre.
- **PATCH sans changement réel** (même rôle/statut) → **200** idempotent (no-op), garde-fou non déclenché.
- **DELETE puis GET /users** → membre absent (filtré `deletedAt`) ; **re-DELETE** → 404/no-op.
- **Cible `INVITED`** (jamais acceptée) : suppression/suspension autorisées (nettoyage d'invitation en attente) ; changement de rôle possible (met à jour le membership créé à l'invitation).
- **Seed relancé** (même e-mail) → **update** idempotent ; **e-mail déjà pris par un `User` d'org** → refus/erreur claire (un `PLATFORM_ADMIN` ne réutilise pas l'e-mail d'un membre) — décision à confirmer (cf. Décisions ouvertes).
- **PLATFORM_ADMIN qui appelle `GET /users`** : `[TENANT_ADMIN]` requis + `org: null` → **403** (il n'administre pas une org ; l'admin plateforme = STORY-027). Cohérent.

---

## Dependencies

**Stories prérequises :**
- **STORY-023** ✅ (modèle `Organizations`/`Users`/`Memberships`, `MembershipsService.countActiveAdmins`, index `{organizationId, role}`, `User.deletedAt`, patron de transaction).
- **STORY-024** ✅ (chaîne de guards `JwtAuthGuard`→`EmailVerifiedGuard`→`RolesGuard` en `APP_GUARD`, `@Roles`, `issueSession`, `clearRefreshTokenHash`, contrôle « org suspendue » au login).
- **STORY-025** ✅ (`UsersController` existant avec `POST /users`/`resend-invitation`, `InvitationService`, `UserResponseDto`, `MembershipsService.findActiveByUser`).

**Stories débloquées par celle-ci :**
- **STORY-027** (événements `identity.*` + outbox Kafka + admin plateforme des organisations) : consomme les mutations de 026 (rôle/suspension/soft-delete → `identity.membership.changed`/`identity.user.suspended`) et **utilise le `PLATFORM_ADMIN` seedé** ici pour `@Roles(PLATFORM_ADMIN)` sur `/admin/organizations`.
- **STORY-029** (read-models identité côté `expert-comptable`) : les consommateurs répliqueront les rôles/suspensions dès que 027 les publiera.

**Dépendances externes :** aucune (pas de service tiers). `ts-node` déjà présent (devDependencies) pour `seed:admin`.

---

## Definition of Done

- [ ] `UsersController` étendu : `GET /users` (liste paginée org-scopée), `GET /users/me`, `PATCH /users/:id` (rôle/statut), `DELETE /users/:id` (soft) — tous `[TENANT_ADMIN]` sauf `/me` (authentifié).
- [ ] `OrganizationsController` : `GET /organizations/me` (authentifié), `PATCH /organizations/me` (`[TENANT_ADMIN]`, `name/phone/country/address` uniquement).
- [ ] **Garde-fou dernier admin** appliqué **dans la transaction** sur PATCH (rétrogradation/suspension) **et** DELETE → 409 ; `countActiveAdmins` réutilisé.
- [ ] **Suspension/suppression révoquent la session** (`refreshTokenHash` effacé) ; login d'un `SUSPENDED` → 401 générique.
- [ ] **Isolation org** systématique (résolution via membership de l'appelant ; cible hors org → 404 générique) ; RBAC (`TENANT_USER` → 403 sur les mutations).
- [ ] **Seed `PLATFORM_ADMIN`** : `src/seeds/seed-platform-admin.ts` (cœur testable + bootstrap standalone) + `User.platformRole` + `UsersService.upsertPlatformAdmin` + `npm run seed:admin` ; idempotent ; mot de passe jamais loggé ; variables manquantes → exit ≠ 0 ; **aucune** création via API.
- [ ] **Rôle plateforme opérant** : `issueSession`/login lisent `platformRole` (sans membership) → `roles:['PLATFORM_ADMIN']`, `org:null` ; login PLATFORM_ADMIN OK.
- [ ] DTO/réponses (`UpdateUserDto`, `ListUsersQueryDto`, `PaginatedUsersDto`, `UpdateOrganizationDto`, `OrganizationResponseDto`, `UserResponseDto` enrichi) + validation stricte (whitelist, bornes de rôle/statut).
- [ ] Swagger : tags `users`/`organizations` documentés (200/204/400/403/404/409, messages génériques).
- [ ] Tests :
  - [ ] Unitaires : liste org-scopée + pagination ; `PATCH role`/`status` (dont sync `User.status`) ; garde-fou dernier admin (PATCH **et** DELETE) ; soft-delete + révocation session ; isolation (cible hors org → 404) ; `upsertPlatformAdmin` ; `seedPlatformAdmin` (OK / variables manquantes) ; `issueSession` émet `PLATFORM_ADMIN` sans org ; login `SUSPENDED` → 401.
  - [ ] e2e : parcours admin (list → promote → suspend → refresh suspendu 401 → delete → absent de la liste) ; garde-fou dernier admin 409 ; `GET/PATCH organizations/me` ; RBAC 403 pour `TENANT_USER`.
- [ ] `npm run test:cov` ≥ seuils ; `npm run test:e2e` vert ; suites STORY-022/023/024/025 vertes ; `eslint --max-warnings 0` ; `nest build` OK.
- [ ] **CRITICAL — vérification docker** (`.agents/rules/qualite-verification.md`) : `docker compose up` → parcours admin complet + garde-fou 409 + `seed:admin` (conteneur) puis `login` PLATFORM_ADMIN **200** (`roles:['PLATFORM_ADMIN']`). Résultats consignés en *Progress Tracking*.
- [ ] Revue de code (`/code-review`) — **à déclencher par l'utilisateur**. Points d'attention : **garde-fou dernier admin** (course/transaction), **isolation d'org** (anti-énumération inter-org), **résolution du rôle plateforme** (pas de régression du chemin membership), **seed hors API** (aucun secret loggé), **révocation de session** à la suspension.
- [ ] Statut synchronisé (en-tête story + `sprint-status.yaml` + Progress Tracking).
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **CRUD membres org-scopé** (`GET /users` paginé, `GET /users/me`, `PATCH /:id`, `DELETE /:id` + isolation) : **2 pts**
- **Garde-fou dernier admin + révocation de session + login SUSPENDED** : **1 pt**
- **Profil organisation** (`GET/PATCH /organizations/me`) : **0.5 pt**
- **Seed `PLATFORM_ADMIN`** (`platformRole` + `upsertPlatformAdmin` + script + branchement `issueSession`) : **1 pt**
- **Tests (unit + e2e) + vérification docker** : **0.5 pt**
- **Total : 5 points**

**Rationale :** largement **repris** d'`expert-comptable` (STORY-009 CRUD + garde-fou, STORY-007 seed) — risque réduit. Le neuf se concentre sur la **normalisation `Membership`** (rôle/statut org-scopés) et le **branchement de la résolution de rôle plateforme** dans `issueSession` (petit mais central pour STORY-027). Cohérent avec le sprint-plan (Sprint 4, 5 pts).

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Représentation du rôle `PLATFORM_ADMIN`** — **Recommandé :** champ **`User.platformRole?: Role`** (nullable, index sparse) lu par `issueSession` quand il n'y a pas de membership. *Alternative :* membership « virtuel » `organizationId: null` — **écartée** (casse `required` + index unique `{userId, organizationId}`).
2. **`DELETE` : soft vs hard** — **Recommandé :** **soft** (`deletedAt` + `SUSPENDED`, cohérent EC STORY-009, réversible, préserve l'historique). *Alternative :* hard delete — écartée (perte d'audit ; RGPD = purge dédiée, hors périmètre).
3. **Suspension : `User.status` seul, `Membership.status` seul, ou les deux** — **Recommandé :** **les deux** synchronisés (le membership porte l'accès org-scopé ; `User.status` porte l'état global et bloque le login). *Alternative :* membership seul — insuffisant pour bloquer le login d'un `PLATFORM_ADMIN`/edge multi-org futur.
4. **Endpoint de suspension : `PATCH /users/:id { status }` vs routes dédiées** (`POST /:id/suspend`) — **Recommandé :** **`PATCH { role?, status? }`** (une seule route de mutation, miroir EC, DTO validé). *Alternative :* routes verbales dédiées — plus de surface pour peu de gain ; à retenir seulement si l'audit exige des actions nommées.
5. **`GET /users` : pagination offset vs cursor** — **Recommandé :** **offset** (`page`/`limit`, simple, suffisant pour des cabinets de taille modeste). *Alternative :* cursor — différé (volumétrie faible en phase 1).
6. **Seed : e-mail déjà utilisé par un `User` d'org** — **Recommandé :** **refus explicite** (un `PLATFORM_ADMIN` ne réutilise pas l'e-mail d'un membre ; message clair, exit ≠ 0). *Alternative :* upsert « fusion » — écartée (ambiguïté de rôle).

### Notes diverses

- **Reprise, pas réécriture** : CRUD + garde-fou = EC STORY-009 ; seed = EC STORY-007. Diff = normalisation `Membership` + résolution du rôle plateforme.
- **Aucun Kafka ici** : les mutations changent l'état **local** de l'IdP ; leur **publication** `identity.*` (et l'admin plateforme des organisations) est **STORY-027**. Tant que 027 n'est pas livrée, les relying parties ne voient pas les changements de rôle/suspension — **attendu**, pas un bug.
- **`RolesGuard` déjà global** (STORY-024) : on l'**alimente** avec `@Roles(...)` ; le seul ajout côté auth est la **source du rôle plateforme** (`platformRole` → `issueSession`).
- **Pas de commit sans demande** : implémentation → vérification docker → commit uniquement sur demande explicite (cf. STORY-025).

---

## Progress Tracking

**Historique de statut :**
- 2026-07-07 : Implémentation initiale (31 fichiers). lint 0, build OK, 167 unit verts, coverage annoncée 91.19/72.83/93.37/91.38. En `review`.
- 2026-07-08 : **Revue + tests + vérification docker (Scrum Master/QA)** — l'implémentation initiale était **fonctionnellement cassée** (jamais vérifiée sur docker). Découvertes et **corrigées** :
  - **P0 — mutations & `/users/me` cassés** : `MembershipsService.findByUserAndOrg`/`findActiveByUser` recevaient des **strings** (path `:id`, claim `org`) et interrogeaient des champs `Membership.userId/organizationId` de type `ObjectId` **sans coercition** → `findOne` renvoyait toujours `null` → **toutes** les mutations (`PATCH`/`DELETE`) en **404** et `GET /users/me` avec `organization: null`. Invisible aux unitaires (services **mockés**) et aux e2e (couche données **mockée**). **Corrigé** par coercition `toObjectId` (renvoie `null` → 404 propre si id invalide) + `listMembersWithUsers`.
  - **Garde-fou dernier admin non transactionnel** (AC violé) → extrait dans un **`UserManagementService`** transactionnel (`countActiveAdmins` **sous session**, écritures atomiques rôle/statut/user/révocation). Patron `register` (rs0).
  - **Login SUSPENDED → 403 message distinct** (oracle) → **401 générique** (`LOGIN_FAILED_MESSAGE`), user **et** org suspendus (anti-énumération).
  - **Soft-delete réversible** : `PATCH {status:ACTIVE}` ressuscitait un compte supprimé → contrôle `deletedAt` → **404**.
  - **Couverture maquillée** : `collectCoverageFrom` **excluait** `users.controller.ts`/`organizations.controller.ts`/`invitation.service.ts`/`seed-platform-admin.ts` (les fichiers à risque). **Exclusions retirées** + tests ajoutés (`user-management.service.spec` 100%, controllers, `memberships`/`users`/`organizations` services, `seed`). Seed : import différé d'`AppModule` + `istanbul ignore` sur le bootstrap d'intégration.
  - **Seed : log créé/mis à jour** calculé après l'upsert (toujours « mis à jour ») → détection **avant** upsert.
  - **Résultat** : lint 0, build OK, **207 unit verts** (32 suites), **couverture 95.22 / 80.89 / 96.62 / 95.25** (gates 90/65/90/90) **sans exclusion des fichiers de la story**.
- 2026-07-08 : **VÉRIFICATION DOCKER BOUT-EN-BOUT (`docker compose up`, image auth-service reconstruite) — TOUT VERT ✅** :
  - `register`→verify(Mailhog)→`login` ; `GET /users/me` → **organization renseignée** (P0 prouvé corrigé) ;
  - garde-fou : `DELETE` du **dernier admin** → **409** ; après promotion d'un 2ᵉ admin → `DELETE` → **204** ;
  - `PATCH` rôle → **200** ; `PATCH` suspend → **200** puis `login` du suspendu → **401** ;
  - soft-delete → **204**, membre **absent** de la liste, `re-DELETE` → **404**, `PATCH {ACTIVE}` sur supprimé → **404** (pas de résurrection) ;
  - isolation : `PATCH` d'un membre d'une autre org → **404** ; RBAC : `TENANT_USER` sur `GET /users` → **403** ;
  - `seed:admin` (conteneur) → `login` PLATFORM_ADMIN → claims `roles:['PLATFORM_ADMIN']`, `org:null` ; `GET /users/me` → **200** ; `GET /users` → **403** (sans org).
  - **Reste** : `/code-review` formel (à déclencher par l'utilisateur) ; **commit sur demande** (non commité).

**Effort réel :** implémentation initiale + 1 cycle de revue/correctifs/vérification docker.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
