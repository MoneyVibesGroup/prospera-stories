# STORY-009 : CRUD utilisateurs — rôles, suspension, garde-fous

**Epic :** EPIC-002 — Utilisateurs du tenant
**Réf. architecture :** S2.2
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian
**Créée le :** 2026-07-03
**Terminée le :** 2026-07-03
**Sprint :** 2
**Couvre :** FR-004

---

## User Story

En tant que **super-admin de compte (`TENANT_ADMIN`)**,
je veux **lister mes utilisateurs, modifier leur rôle, les suspendre/réactiver et les supprimer**,
afin de **contrôler les accès de mon cabinet en toute autonomie, sans jamais me verrouiller dehors**.

---

## Description

### Contexte

L'EPIC-002 construit la **gestion des utilisateurs d'un cabinet**. Les briques sont déjà en place :

- **STORY-010** a posé le `UsersRepository` **scoping par tenant** (`TenantScopedRepository` : `find`/`findById`/`count`/`updateOne`/`deleteOne` fusionnent `{ tenantId }` du contexte **en dernier**, fail-closed hors contexte, id malformé/cross-tenant → `null`/`false` → **404 générique**). Toute la CRUD de cette story passe **exclusivement** par ce repository : l'isolation est garantie par construction.
- **STORY-008** a livré l'**invitation** (`POST /users` crée un `INVITED`, `POST /auth/accept-invitation` active) et la surcharge `@Roles(TENANT_ADMIN)` au niveau méthode sur le contrôleur `users` (dont la classe est `@Roles(TENANT_ADMIN, TENANT_USER)`).
- **STORY-005** a posé l'enforcement d'accès : `login`/`refresh` appellent `ensureNotSuspended(user)` → un `SUSPENDED` est **déjà** rejeté (403 générique) et ne peut plus tourner ses jetons. STORY-009 n'a donc **pas** à réimplémenter le blocage : il lui suffit de **poser** `status = SUSPENDED` et de **révoquer le refresh** courant.

STORY-009 complète le module avec les **opérations de gestion** réservées au `TENANT_ADMIN` :

> Le `TENANT_ADMIN` liste ses utilisateurs (`GET /users`, paginé, **de son tenant uniquement**), change un rôle ou suspend/réactive un compte (`PATCH /users/:id`), et supprime un utilisateur (`DELETE /users/:id`, **soft delete**). Un **garde-fou** empêche de **retirer le dernier `TENANT_ADMIN` actif** (rétrogradation, suspension ou suppression) : le cabinet garde toujours au moins un administrateur capable de se connecter.

Trois propriétés sont critiques :

- **Réservé au `TENANT_ADMIN`** : les quatre endpoints (list + patch + delete) refusent un `TENANT_USER` (**403**, via `@Roles(TENANT_ADMIN)`) et un non-membre (**401**). La lecture unitaire `GET /users/:id` (STORY-010) **reste ouverte aux deux rôles** — inchangée.
- **Isolation totale** : lister, patcher, supprimer ne portent **jamais** sur un utilisateur d'un autre cabinet ni sur un `PLATFORM_ADMIN` (sans `tenantId`, donc hors scope) → **404 générique** (jamais de 403 révélateur — anti-énumération).
- **Anti-verrouillage** : impossible de faire tomber le tenant à **zéro `TENANT_ADMIN` actif**. La dernière rétrogradation/suspension/suppression d'un admin actif est refusée (**409 générique**).

### Périmètre

**Inclus :**
- **`GET /api/v1/users`** (`@Roles(TENANT_ADMIN)`) : **liste paginée** des utilisateurs **du tenant courant** (`?page`, `?limit`), triée (ex. `createdAt` décroissant). Renvoie `INVITED` / `ACTIVE` / `SUSPENDED` ; **exclut les soft-deleted**. Réponse **200** : enveloppe paginée `{ items: UserResponseDto[], total, page, limit }`.
- **`PATCH /api/v1/users/:id`** (`@Roles(TENANT_ADMIN)`) : `UpdateUserDto { role?, status? }` (au moins un champ) —
  - **rôle** ∈ {`TENANT_ADMIN`, `TENANT_USER`} (`PLATFORM_ADMIN` interdit) ;
  - **statut** ∈ {`ACTIVE`, `SUSPENDED`} : `SUSPENDED` = suspension (révoque le refresh courant), `ACTIVE` = réactivation. `INVITED` **non attribuable** par PATCH.
  - Réponse **200** (`UserResponseDto` à jour). Cible inexistante/autre tenant/`PLATFORM_ADMIN` → **404**.
- **`DELETE /api/v1/users/:id`** (`@Roles(TENANT_ADMIN)`) : **soft delete** — pose `deletedAt = now`, **révoque le refresh** (`refreshTokenHash`). L'enregistrement est conservé (audit/intégrité), mais l'utilisateur **disparaît des listes/lectures** et **ne peut plus se connecter**. Réponse **204**. Cible introuvable → **404**.
- **Garde-fou « dernier `TENANT_ADMIN` actif »** : avant toute rétrogradation (`TENANT_ADMIN`→`TENANT_USER`), suspension ou suppression d'un `TENANT_ADMIN`, compter les `TENANT_ADMIN` **actifs** du tenant (`role: TENANT_ADMIN, status: ACTIVE, deletedAt: null`) ; si la cible est le **dernier**, refuser (**409 générique**). Un admin `INVITED` (mot de passe non défini) ne compte **pas** comme garde-fou.
- **Enforcement d'accès** :
  - `SUSPENDED` : déjà bloqué au `login`/`refresh` (STORY-005, `ensureNotSuspended`) — STORY-009 pose seulement le statut + révoque le refresh (coupe la session au plus tard au prochain refresh).
  - **Soft-deleted** : exclu de `findByEmail` (login) → traité comme inexistant (**401 générique**) et exclu des lectures scoping.
- **Schéma `User`** : champ `deletedAt?: Date` + index **sparse**.
- **DTOs** : `UpdateUserDto` (validation `role`/`status`), `ListUsersQueryDto` (`page`/`limit` bornés), enveloppe `PaginatedUsersDto` (réutilise `UserResponseDto`).
- **Tests** unitaires (service : liste paginée scoping, patch rôle/statut, delete, **garde-fou dernier admin** dans les trois cas, exclusion soft-deleted) + e2e (403 `TENANT_USER`, isolation 404 cross-tenant, 409 dernier admin, suspension → login 403, soft delete → login 401 + absent de la liste).

**Hors périmètre :**
- **Suppression physique / purge RGPD** — soft delete uniquement en phase 1 (purge = tâche d'exploitation ultérieure).
- **Restauration d'un utilisateur supprimé** (« undelete ») — non planifié.
- **Révocation immédiate de l'access token** en cours de validité : les jetons d'accès sont **courts (15 min)** et stateless ; suspension/suppression coupent le **refresh**, la session s'éteint donc au plus tard au prochain rafraîchissement. Tradeoff assumé (cohérent avec `ensureNotSuspended`) — pas de dénylist de jetons en phase 1.
- **`TenantStateGuard`** (matrice KYC/abonnement) → **STORY-014**.
- **Modification de profil par l'utilisateur lui-même** (self-service `PATCH /users/me`) — non planifié ; STORY-009 couvre l'**administration** par le `TENANT_ADMIN`.
- **Réinitialisation de mot de passe** (« mot de passe oublié ») → hors phase 1.

### Flux (utilisateur)

**Lister**
1. Le `TENANT_ADMIN` appelle `GET /users?page=1&limit=20` (Bearer access token).
2. L'API renvoie **200** avec la page d'utilisateurs **de son cabinet** (soft-deleted exclus).

**Changer un rôle / suspendre / réactiver**
1. `PATCH /users/:id { role: "TENANT_USER" }` (ou `{ status: "SUSPENDED" }`, `{ status: "ACTIVE" }`).
2. Garde-fou vérifié si l'action retire un admin actif ; si dernier admin → **409**.
3. Sinon mise à jour scoping (404 si cible hors tenant) ; sur suspension, refresh révoqué → **200** (`UserResponseDto` à jour).
4. Un compte suspendu qui tente `login`/`refresh` → **403** (`ensureNotSuspended`).

**Supprimer**
1. `DELETE /users/:id`.
2. Garde-fou « dernier admin actif » ; si dernier → **409**.
3. Sinon `deletedAt = now` + refresh révoqué → **204**. L'utilisateur disparaît des listes et ne peut plus se connecter (**401**).

---

## Acceptance Criteria

- [x] `GET /api/v1/users` renvoie la **liste paginée** (`page`/`limit`) des utilisateurs **du tenant courant uniquement**, soft-deleted **exclus**, statut **200**.
- [x] La pagination expose `items`, `total`, `page`, `limit` ; `limit` est **borné** (ex. 1–100, défaut 20) et une page hors plage renvoie une liste vide (pas d'erreur).
- [x] `PATCH /api/v1/users/:id` change le **rôle** (`TENANT_ADMIN` ⇄ `TENANT_USER`) et/ou le **statut** (`ACTIVE` ⇄ `SUSPENDED`) ; `PLATFORM_ADMIN` et `INVITED` **refusés** en entrée (400).
- [x] `DELETE /api/v1/users/:id` réalise un **soft delete** (`deletedAt` posé) : l'utilisateur n'apparaît plus en liste/lecture et **ne peut plus se connecter** ; réponse **204**.
- [x] **Impossible de rétrograder, suspendre ou supprimer le dernier `TENANT_ADMIN` actif** du tenant → **409 générique** ; l'état de l'utilisateur reste inchangé.
- [x] Un utilisateur **suspendu** ne peut plus se connecter ni rafraîchir sa session (**403**) ; sa **réactivation** (`status: ACTIVE`) rétablit l'accès.
- [x] Les endpoints `GET /users` (liste), `PATCH` et `DELETE` sont **réservés au `TENANT_ADMIN`** : un `TENANT_USER` → **403**, un requêteur non authentifié → **401**.
- [x] **Isolation** : `PATCH`/`DELETE`/lecture visant un utilisateur d'un **autre tenant** (ou un `PLATFORM_ADMIN`) → **404 générique** (jamais 403) ; un id malformé → **404** (pas 500).
- [x] Aucune réponse n'expose de secret (`passwordHash`, `refreshTokenHash`, `*TokenHash`) — projection via `UserResponseDto`.
- [x] Suite de tests unitaires + e2e **verte**, couverture au-dessus des seuils (branches 65 / fonctions 90 / lignes 90 / statements 90), lint **0 warning**.

---

## Technical Notes

### Composants
- **`UsersController`** (`src/modules/users/users.controller.ts`) : ajouter `GET /` (liste), `PATCH /:id`, `DELETE /:id`, chacun `@Roles(Role.TENANT_ADMIN)` (surcharge méthode, comme `invite`/`resendInvitation`). `@HttpCode(204)` sur `DELETE`.
- **`UsersService`** (`src/modules/users/users.service.ts`) : nouvelles méthodes de gestion (liste paginée, patch, soft delete, garde-fou). Toutes passent par `UsersRepository` (scoping), **jamais** par le `Model` brut — sauf ajout du filtre soft-delete dans `findByEmail` (login).
- **`UsersRepository`** (`src/modules/users/users.repository.ts`) : hérite déjà de `find(filter, options)`, `count(filter)`, `updateOne(id, patch)`, `deleteOne(id)`. Utiliser `find({ deletedAt: null }, { skip, limit, sort })` + `count({ deletedAt: null })` pour la liste, et `updateOne` pour patch/soft-delete (renvoie le doc à jour ou `null` → 404).
- **Auth** (`src/modules/auth/auth.service.ts`) : **inchangé** côté suspension (`ensureNotSuspended` déjà en place). Adapter `UsersService.findByEmail` pour **exclure les soft-deleted** (`deletedAt: null`) afin qu'un compte supprimé échoue au login en **401 générique**.

### API Endpoints
- `GET /api/v1/users?page&limit` → `200 { items: UserResponseDto[], total, page, limit }`
- `PATCH /api/v1/users/:id` — body `{ role?: TENANT_ADMIN|TENANT_USER, status?: ACTIVE|SUSPENDED }` → `200 UserResponseDto` | `400` (corps vide/valeur interdite) | `404` | `409` (dernier admin)
- `DELETE /api/v1/users/:id` → `204` | `404` | `409` (dernier admin)

### Changements de schéma
```ts
// user.schema.ts
@Prop()
deletedAt?: Date;                       // soft delete (STORY-009)

UserSchema.index({ deletedAt: 1 }, { sparse: true });
```
> `{ deletedAt: null }` dans Mongo matche les documents où le champ est **null ou absent** : un simple filtre `deletedAt: null` exclut donc les supprimés sans migration des documents existants.

### DTOs
- `dto/update-user.dto.ts` — `UpdateUserDto { role?: @IsIn([TENANT_ADMIN, TENANT_USER]); status?: @IsIn([ACTIVE, SUSPENDED]) }`. Refuser un corps **vide** (au moins un champ) : `@ValidateIf`/validation custom ou vérification service → **400**. Réutiliser la constante `INVITABLE_ROLES` (invite-user.dto) pour la liste des rôles attribuables.
- `dto/list-users-query.dto.ts` — `page` (`@IsInt @Min(1)`, défaut 1), `limit` (`@IsInt @Min(1) @Max(100)`, défaut 20), avec `@Type(() => Number)` (transform activé globalement).
- `dto/paginated-users.dto.ts` — `{ items: UserResponseDto[]; total: number; page: number; limit: number }` (annoté `@ApiProperty` pour Swagger).

### Garde-fou « dernier TENANT_ADMIN actif »
- Centraliser dans un helper privé du service, appelé avant : rétrogradation (`role: TENANT_ADMIN → TENANT_USER`), suspension (`status → SUSPENDED`), suppression — **uniquement** quand la cible est un `TENANT_ADMIN` **actif** (`status: ACTIVE`).
- Comptage **scoping** : `usersRepository.count({ role: TENANT_ADMIN, status: ACTIVE, deletedAt: null })`. Si `count <= 1` **et** la cible correspond à ce dernier admin → `throw new ConflictException(LAST_ADMIN_MESSAGE)` (message **générique**).
- Charger la cible (scoping) **avant** de décider : une cible hors tenant renvoie `null` → **404** (le garde-fou ne s'applique qu'après avoir confirmé l'appartenance au tenant).
- Ordre : d'abord résoudre la cible (404 si absente), puis garde-fou (409), puis mutation.

### Sécurité & anti-énumération
- Toutes les erreurs d'accès ressource sont **404 génériques** (id inexistant, autre tenant, `PLATFORM_ADMIN`, id malformé) — **jamais 403** révélateur ; le 403 est réservé au **rôle insuffisant** (`TENANT_USER`), qui ne divulgue aucune ressource.
- Le garde-fou renvoie un **409 générique** (« opération refusée : le cabinet doit conserver au moins un administrateur actif ») sans divulguer d'identité.
- Aucune réponse ne sérialise de secret : passer systématiquement par `UserResponseDto.fromDocument`.
- Ne jamais logguer de token/mot de passe.

### Cas limites
- **Corps `PATCH` vide** → 400.
- **`PATCH` idempotent** (même rôle/statut que l'actuel) → 200 sans effet de bord ; le garde-fou ne se déclenche que si l'action **retire réellement** un admin actif.
- **Cible `INVITED`** : suppression possible ; suspension d'un `INVITED` sans objet (pas de session) — décision : autoriser le patch de statut uniquement `ACTIVE`⇄`SUSPENDED`, laisser `INVITED` géré par le flux d'invitation (resend/accept).
- **Auto-action de l'admin** : un `TENANT_ADMIN` seul qui tente de se rétrograder/suspendre/supprimer est **déjà** couvert par le garde-fou « dernier admin » (409). S'il reste ≥ 2 admins actifs, l'auto-action est permise.
- **Double delete** : soft delete d'un utilisateur déjà supprimé → 404 (exclu des lectures).
- **Access token encore valide** après suspension/suppression : accepté (TTL 15 min), la session meurt au prochain refresh.

---

## Dependencies

**Stories prérequises :**
- **STORY-010** (Isolation multi-tenant) — `UsersRepository`/`TenantScopedRepository` : socle scoping de toute la CRUD. **Complétée.**
- **STORY-008** (Invitation) — `UsersController` (surcharge `@Roles`), `UserResponseDto`, statut `INVITED`. **Complétée.**
- **STORY-005** (Auth + guards) — `ensureNotSuspended`, révocation refresh, `@Roles`/`RolesGuard`. **Complétée.**

**Stories bloquées :** aucune (dernière story de l'EPIC-002 ; débloque la clôture de l'epic).

**Dépendances externes :** aucune (Mongo/Redis déjà en place via `docker compose`).

---

## Definition of Done

- [ ] Code implémenté sur une branche `feature/STORY-009-crud-utilisateurs`.
- [ ] Tests unitaires écrits et **verts** (≥ seuils de couverture) :
  - [ ] liste paginée (scoping, exclusion soft-deleted, bornes `limit`)
  - [ ] `PATCH` rôle + statut (valeurs valides/refusées, 404 cross-tenant)
  - [ ] `DELETE` soft delete (deletedAt posé, refresh révoqué)
  - [ ] **garde-fou dernier admin** dans les 3 cas (rétrogradation, suspension, suppression) → 409
  - [ ] `findByEmail` exclut les soft-deleted (login 401)
- [ ] Tests **e2e** verts :
  - [ ] `TENANT_USER` sur list/patch/delete → 403
  - [ ] isolation cross-tenant → 404 (patch + delete + list ne fuit pas)
  - [ ] dernier admin → 409 (état inchangé)
  - [ ] suspension → login 403 ; réactivation → login 200
  - [ ] soft delete → login 401 + absent de `GET /users`
- [ ] Lint **0 warning** (`eslint --max-warnings 0`), `nest build` OK.
- [ ] Swagger à jour (nouveaux endpoints + réponses 200/204/400/403/404/409).
- [ ] **Vérification docker** (`docker compose up`) sur Mongo/Redis réels : parcours complet (list/patch/suspend/reactivate/delete) + garde-fou + isolation, invariants confirmés en base.
- [ ] Critères d'acceptation tous validés (✓).
- [ ] `docs/sprint-status.yaml` + `docs/stories/STORY-009.md` mis à jour (statut, actual_points, completion_date), clôturant l'EPIC-002.

---

## Story Points Breakdown

- **Backend (endpoints + service + garde-fou + soft delete + DTOs) :** 3 points
- **Schéma + intégration auth (exclusion soft-deleted) :** 1 point
- **Tests (unitaires + e2e + vérif docker) :** 1 point
- **Total :** **5 points**

**Rationale :** Périmètre bien cadré s'appuyant sur des briques existantes (`TenantScopedRepository`, `RolesGuard`, `ensureNotSuspended`, `UserResponseDto`). La complexité réelle tient au **garde-fou dernier admin** (comptage scoping + trois chemins) et à la **cohérence du soft delete** (liste, lecture, login) — d'où 5 plutôt que 3.

---

## Additional Notes

- **Réutilisation maximale** : pas de nouveau module ; on étend `UsersModule`. Le contrôleur applique le même patron de surcharge `@Roles(TENANT_ADMIN)` que `invite`/`resendInvitation` (STORY-008).
- **`INVITABLE_ROLES`** (déjà défini dans `invite-user.dto.ts`) est la liste de référence des rôles attribuables — la réutiliser pour `UpdateUserDto` évite la divergence.
- **Pas de purge** : le soft delete conserve l'unicité globale de l'e-mail (un e-mail supprimé reste « pris ») — comportement acceptable en phase 1 ; une éventuelle réinscription du même e-mail est hors périmètre.
- Clôture de l'**EPIC-002** : après STORY-009, la gestion des utilisateurs du tenant (invitation, CRUD, isolation) est complète ; le sprint enchaîne sur l'**EPIC-003 (KYC)**.

---

## Progress Tracking

**Status History:**
- 2026-07-03 : Créée par vivian (Scrum Master, BMAD)
- 2026-07-03 : Démarrée par vivian (Developer, BMAD)
- 2026-07-03 : Terminée — tous les critères validés, vérification docker 25/0

**Actual Effort:** 5 points (conforme à l'estimation)

**Notes d'implémentation :**

- **Schéma** : `User.deletedAt?: Date` + index `sparse` (soft delete). `findByEmail` exclut désormais `deletedAt: null` → un compte supprimé échoue au login en **401 générique** (indiscernable d'un compte inexistant).
- **DTOs** : `UpdateUserDto` (`role?`/`status?`, au moins un requis — vérifié en service, pas en validation déclarative), `ListUsersQueryDto` (`page`/`limit` avec `@Type(() => Number)`, bornes 1–100/défaut 20), `PaginatedUsersDto` (`items`/`total`/`page`/`limit`).
- **`UsersService`** : `list()` (scoping `find`+`count` avec `skip`/`limit`/`sort: createdAt desc`), `updateUser()` (corps vide → 400, cible via `findActiveOrFail`, garde-fou, `updateOne` avec `$unset refreshTokenHash` sur suspension), `deleteUser()` (soft delete + révocation refresh). Garde-fou centralisé dans `ensureNotLastActiveAdmin` : ne se déclenche que si la cible est un `TENANT_ADMIN` **actif** et que l'action (rétrogradation/suspension/suppression) le retirerait, en comptant les admins actifs scoping **avant** d'agir.
- **`UsersController`** : `GET /` , `PATCH /:id`, `DELETE /:id` ajoutés avec `@Roles(TENANT_ADMIN)` (surcharge méthode, même patron que `invite`/`resendInvitation` de STORY-008). `GET /:id` (STORY-010) inchangé.
- **Tests unitaires** : 215 tests verts (32 suites) — couverture globale **99.08 % stmts / 88.02 % branches / 98.68 % fonctions / 99.27 % lignes** (seuils 90/65/90/90 dépassés). Garde-fou testé dans les 3 chemins (rétrogradation/suspension/suppression), y compris le cas « admin suspendu non compté ».
- **E2E** (`test/users-crud.e2e-spec.ts`, nouveau, même patron que `tenant-isolation.e2e-spec.ts` — faux `Model` matchant sur les clés présentes du filtre) : 15 tests verts — 403 `TENANT_USER`, isolation cross-tenant 404, garde-fou 409 (les 3 cas), soft delete + absence de la liste, id malformé → 404. Suite e2e complète : **9 suites / 64 tests** verts.
- **Lint** : 0 warning (`eslint --max-warnings 0`), `nest build` OK.
- **Vérification docker** (Mongo/Redis/Mailhog réels, `docker compose up`) : **25/0** — 2 tenants, invitation+acceptation de 2 collaborateurs, liste paginée scoping (total=3 puis 2 après soft delete), promotion/rétrogradation de rôle, suspension → login 403 → réactivation → login 200, garde-fou dernier admin actif (409 sur rétrogradation/suspension/suppression), isolation cross-tenant PATCH/DELETE → 404, soft delete → GET 404 + login 401 + absent de la liste, double delete → 404, id malformé → 404. Invariant Mongo confirmé : `deletedAt` posé + `refreshTokenHash` effacé sur l'utilisateur supprimé ; comptage scoping des admins actifs du tenant cohérent avec l'API.
- **Clôture de l'EPIC-002** : avec STORY-009, la gestion des utilisateurs du tenant (invitation, isolation, CRUD + garde-fous) est complète. Le sprint enchaîne sur l'EPIC-003 (KYC).

---

**Cette story a été créée avec BMAD Method v6 — Phase 4 (Planification d'implémentation)**
