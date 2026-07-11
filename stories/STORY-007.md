# STORY-007 : Seed du super-admin plateforme + squelette AdminModule

**Epic :** EPIC-001 — Comptes & authentification
**Réf. architecture :** S1.4
**Priorité :** Must Have
**Story Points :** 2
**Statut :** ✅ Completed
**Assigné à :** vivian
**Créée le :** 2026-07-03
**Terminée le :** 2026-07-03
**Sprint :** 1
**Couvre :** FR-012 (amorce)

---

## User Story

En tant qu'**opérateur de la plateforme**,
je veux **qu'un compte super-admin global (`PLATFORM_ADMIN`) existe, créé par script (hors API publique)**,
afin de **pouvoir administrer les tenants depuis un espace réservé, inaccessible aux comptes cabinet**.

---

## Description

### Contexte

Les stories précédentes ont livré l'inscription (STORY-004, rôle `TENANT_ADMIN` **codé en dur**), l'authentification + la chaîne de guards `Throttler → Jwt → EmailVerified → Roles` (STORY-005/006) et le `RolesGuard` lisant `@Roles(...)`. Le rôle `PLATFORM_ADMIN` (utilisateur **sans `tenantId`**) existe déjà dans l'enum `Role` et le payload JWT, mais **aucun compte de ce type ne peut être créé** : par conception, l'API publique ne fabrique que des `TENANT_ADMIN`.

STORY-007 **amorce l'administration plateforme** :

> un **script de seed idempotent** crée (ou met à jour) le `PLATFORM_ADMIN` à partir de variables d'environnement, **jamais via une route HTTP** ; un **`AdminModule`** expose un premier endpoint protégé `@Roles(PLATFORM_ADMIN)` prouvant que seul ce rôle y accède.

C'est une story **d'amorçage** (squelette + point d'entrée). Les endpoints métier d'administration (liste des tenants, revue KYC, suspension, dashboard) sont **hors périmètre** ; ils viendront garnir l'`AdminModule` en STORY-013 (revue KYC) et STORY-019 (dashboard).

Trois propriétés sont critiques :

- **Création hors API** : le `PLATFORM_ADMIN` n'est **jamais** créable via `POST /auth/register` (ni aucune autre route) — uniquement par le script de seed exécuté par un opérateur.
- **Idempotence** : rejouer le seed ne crée pas de doublon (upsert par e-mail) et ne casse pas un compte existant ; il peut réinitialiser le mot de passe depuis l'environnement.
- **Verrou d'accès** : l'espace `/admin/*` est **inaccessible** aux rôles cabinet (`TENANT_ADMIN`, `TENANT_USER`) → **403**, et accessible au seul `PLATFORM_ADMIN`.

### Périmètre

**Inclus :**
- **Script de seed** (`src/seeds/seed-platform-admin.ts`) : bootstrap d'un **contexte applicatif** (`NestFactory.createApplicationContext`) pour réutiliser la DI (`UsersService`, `PasswordService`, `ConfigService`), lecture des identifiants depuis l'environnement, **upsert** d'un `User` `PLATFORM_ADMIN` (`tenantId` absent/null, `status: ACTIVE`, `emailVerifiedAt` renseigné), log clair, fermeture propre du contexte. Échoue avec un message explicite si les variables requises manquent.
- **`UsersService.upsertPlatformAdmin(...)`** : méthode **idempotente, hors transaction** (le seed n'ouvre pas de session), qui crée ou met à jour le compte admin (par e-mail normalisé) avec `role: PLATFORM_ADMIN`, `emailVerifiedAt`, sans `tenantId`.
- **Script npm** `seed:admin` (exécutable en dev via `ts-node`, en image via `node dist/seeds/seed-platform-admin.js`).
- **`AdminModule`** (squelette) + **`AdminController`** avec **un endpoint protégé de test** `GET /api/v1/admin/ping` annoté `@Roles(Role.PLATFORM_ADMIN)` (documenté Swagger, `@ApiBearerAuth`), renvoyant l'identité de l'admin courant. Enregistré dans `AppModule`.
- **Vérification** que la chaîne de guards refuse (**403**) l'accès `/admin/*` à un `TENANT_ADMIN` (même vérifié) et l'autorise au `PLATFORM_ADMIN`.
- **Config/env** : `PLATFORM_ADMIN_EMAIL` + `PLATFORM_ADMIN_PASSWORD` (+ `PLATFORM_ADMIN_FIRST_NAME`/`LAST_NAME` optionnels), **documentées** (`.env.example`) mais **validées uniquement dans le seed** (pas au boot de l'app, pour ne pas exiger ces secrets à chaque démarrage).
- **Tests** unitaires (`upsertPlatformAdmin`, `AdminController`, logique de seed extraite si utile) + e2e (`/admin/ping` : 401 sans token, 403 pour `TENANT_ADMIN`, 200 pour `PLATFORM_ADMIN`) + confirmation que `register` refuse un champ `role` injecté.

**Hors périmètre :**
- **Endpoints d'administration métier** (liste/détail tenants, suspension, statistiques) → **STORY-013 / STORY-019**.
- **Revue KYC** (file, approbation/rejet, URLs présignées) → **EPIC-003**.
- **Gestion multi-admins / rotation / MFA de l'admin** → exploitation (hors phase 1).
- **UI d'administration** (pas de frontend en phase 1).
- **`TenantStateGuard`** (matrice d'état) → **STORY-014** ; les routes `/admin/*` ne dépendent pas de l'état d'un tenant.

### Flux (opérateur)

1. L'opérateur renseigne `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` dans l'environnement.
2. Il lance le seed : `docker compose exec app npm run seed:admin` (ou `docker compose run --rm app npm run seed:admin`).
3. Le script **upsert** le `PLATFORM_ADMIN` (idempotent) et journalise le résultat (créé / mis à jour), sans jamais afficher le mot de passe.
4. L'admin se **connecte** via `POST /auth/login` → access token portant `role: PLATFORM_ADMIN`, `tenantId: null`, `emailVerified: true`.
5. Il atteint `GET /admin/ping` → **200**. Un `TENANT_ADMIN` sur la même route → **403**.

---

## Acceptance Criteria

- [x] Un **script de seed** crée un `User` `PLATFORM_ADMIN` (`tenantId` **null/absent**, `status: ACTIVE`, `emailVerifiedAt` renseigné) à partir des **variables d'environnement** ; il est **idempotent** (rejeu ⇒ pas de doublon, mise à jour du compte existant) et **échoue clairement** si `PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD` manquent. Le mot de passe est **haché** (bcrypt, cf. `PasswordService`) et **jamais** journalisé. *(Vérifié docker : seed #1 « créé », #2 « mis à jour » ; base : role/`tenantId` absent/`emailVerifiedAt` SET/hash `$2b$`.)*
- [x] **Impossible de créer un `PLATFORM_ADMIN` via une route publique** : `POST /auth/register` fixe toujours `TENANT_ADMIN` et **rejette (400)** tout champ `role` injecté (e2e existant) ; aucune autre route ne permet d'élever un compte en `PLATFORM_ADMIN`.
- [x] **`AdminModule` amorcé** avec un endpoint de test `GET /api/v1/admin/ping` annoté `@Roles(Role.PLATFORM_ADMIN)` (au niveau du contrôleur), documenté dans Swagger, renvoyant l'identité de l'admin courant.
- [x] Le **`RolesGuard`** refuse l'accès aux routes `/admin/*` à tout rôle ≠ `PLATFORM_ADMIN` → **403** ; **401** si aucun access token n'est présenté. *(Vérifié e2e + docker.)*
- [x] Le **`PLATFORM_ADMIN` seedé peut se connecter** (`POST /auth/login`) et **atteindre `GET /admin/ping` → 200** de bout en bout (JWT `role: PLATFORM_ADMIN`, `emailVerified: true` ⇒ franchit `EmailVerifiedGuard` puis `RolesGuard`).
- [x] `docker compose up` fonctionne ; le seed s'exécute dans le conteneur `app` ; les tests STORY-001→006 restent **verts** ; **lint 0 warning** ; **seuils de couverture** (90/65/90/90) respectés ; nouvelles variables d'env **documentées** (`.env.example`).

---

## Technical Notes

### Composants / fichiers
```
src/seeds/seed-platform-admin.ts        # script standalone (createApplicationContext) (nouveau)
src/modules/admin/admin.module.ts        # squelette AdminModule (nouveau)
src/modules/admin/admin.controller.ts    # GET /admin/ping @Roles(PLATFORM_ADMIN) (nouveau)
src/modules/users/users.service.ts       # + upsertPlatformAdmin() (idempotent, hors session)
src/app.module.ts                        # importe AdminModule
.env.example                             # + PLATFORM_ADMIN_EMAIL / _PASSWORD (+ noms)
package.json                             # + script "seed:admin"
```

### Script de seed (`seed-platform-admin.ts`)
- **Bootstrap léger** : `const app = await NestFactory.createApplicationContext(AppModule, { logger: ... })` — pas de serveur HTTP, juste la DI (Mongo, `UsersService`, `PasswordService`, `ConfigService`).
- **Lecture env** (dans le script, pas dans `env.validation`) : `PLATFORM_ADMIN_EMAIL`, `PLATFORM_ADMIN_PASSWORD` (requis) ; `PLATFORM_ADMIN_FIRST_NAME`/`_LAST_NAME` (optionnels, défauts « Platform »/« Admin »). Si un requis manque → log d'erreur + `process.exitCode = 1` + fermeture.
- **Upsert** : `passwordHash = await passwordService.hash(password)` ; `await usersService.upsertPlatformAdmin({ email, passwordHash, firstName, lastName })`.
- **Sortie** : journalise « PLATFORM_ADMIN créé » ou « mis à jour » (jamais le mot de passe), puis `await app.close()`.
- **Exécution** : dev `ts-node -r tsconfig-paths/register src/seeds/seed-platform-admin.ts` ; image de prod `node dist/seeds/seed-platform-admin.js` (le fichier est compilé par `nest build`). Le script npm `seed:admin` cible le mode dev (conteneur `base`).

### `UsersService.upsertPlatformAdmin(...)`
- **Idempotent, sans transaction** (le seed n'a pas besoin d'atomicité multi-documents) — distinct de `create(params, session)` (réservé à l'inscription transactionnelle).
- Implémentation : `findOneAndUpdate({ email }, { $set: { passwordHash, firstName, lastName, role: PLATFORM_ADMIN, status: ACTIVE, emailVerifiedAt: new Date() }, $unset: { tenantId: '' } }, { upsert: true, new: true, setDefaultsOnInsert: true })`.
- `emailVerifiedAt` est **renseigné** : l'admin franchit l'`EmailVerifiedGuard` sans passer par la boucle de vérification e-mail (il n'y a pas d'e-mail réel à vérifier pour un compte d'exploitation).

### `AdminModule` + endpoint de test
- `@Controller('admin')` ; `GET ping` : `@Roles(Role.PLATFORM_ADMIN)` + `@ApiBearerAuth()` ; renvoie `@CurrentUser()` (ou un DTO `{ userId, role }`). Route **non** `@Public`, **non** `@AllowUnverified` → traverse toute la chaîne.
- Enregistrer `AdminModule` dans `AppModule.imports`. Les guards étant globaux (APP_GUARD), aucun guard local n'est requis.
- **Ordre de chaîne** confirmé : `Throttler → Jwt → EmailVerified → Roles`. Un `TENANT_ADMIN` vérifié atteint `RolesGuard` puis **403** ; un non-authentifié est stoppé par `JwtAuthGuard` (**401**).

### Config & sécurité
- Les identifiants admin **ne sont pas** ajoutés à `env.validation` (sinon chaque démarrage de l'app les exigerait). Ils sont validés **dans le seed**. `.env.example` les documente (avec un mot de passe de dev à changer).
- **Aucune élévation via l'API** : `RegisterDto` liste blanche ses champs (`whitelist` + `forbidNonWhitelisted`) ⇒ un `role` injecté donne **400** (déjà couvert par les e2e STORY-004/005 ; on réaffirme le test).
- Mot de passe admin **haché** (bcrypt cost 12) ; jamais loggué ni renvoyé.

### Points d'extension (seams)
- **STORY-013** (revue KYC) et **STORY-019** (dashboard) garnissent l'`AdminController` (liste/détail tenants, file KYC, approbation/rejet, stats) — le squelette + le verrou `@Roles(PLATFORM_ADMIN)` sont posés ici.
- **STORY-014** : `TenantStateGuard` s'insère après `RolesGuard` ; il ne s'applique pas aux routes `/admin/*` (pas de tenant courant).

---

## Dependencies

**Stories prérequises :**
- **STORY-004** ✅ (schéma `User` avec `tenantId` optionnel + `role`, `UsersService`, `PasswordService`, `PLATFORM_ADMIN` dans l'enum).
- **STORY-005** ✅ (`login`, `RolesGuard`, `@Roles`, `@CurrentUser`, chaîne de guards globale, JWT portant `role`/`tenantId`).
- **STORY-006** ✅ (`EmailVerifiedGuard` dans la chaîne — l'admin seedé porte `emailVerifiedAt` pour le franchir).
- **STORY-002** ✅ (MongoDB via `docker compose` pour exécuter le seed).

**Stories débloquées par celle-ci :**
- **STORY-013** (revue KYC admin global).
- **STORY-019** (dashboard admin + e2e parcours complet).
- Tout endpoint réservé `PLATFORM_ADMIN`.

**Dépendances externes :** aucune. Nouvelles variables `PLATFORM_ADMIN_*` (consommées par le seed uniquement).

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité (`feature/STORY-007-seed-admin`).
- [ ] Tests :
  - [ ] Unitaire `UsersService.upsertPlatformAdmin` : upsert (filtre par e-mail normalisé, `$set` rôle/statut/`emailVerifiedAt`, `$unset tenantId`, `upsert:true`).
  - [ ] Unitaire `AdminController` : renvoie l'identité de l'admin courant.
  - [ ] Unitaire logique de seed (si extraite) : échec si variable requise absente ; hachage + délégation à l'upsert ; pas de fuite du mot de passe.
  - [ ] e2e `/admin/ping` : **401** sans token, **403** pour `TENANT_ADMIN` (vérifié), **200** pour `PLATFORM_ADMIN` ; `register` avec `role` injecté → **400**.
- [ ] `npm run test:cov` respecte les seuils (90/65/90/90) ; lint 0 warning ; build OK ; tests STORY-001→006 verts.
- [ ] Endpoint `/admin/ping` documenté dans **Swagger** ; variables `PLATFORM_ADMIN_*` dans `.env.example`.
- [ ] `docker compose up` + `docker compose exec app npm run seed:admin` : admin créé/mis à jour (idempotent), login OK, `/admin/ping` 200 ; `TENANT_ADMIN` sur `/admin/ping` 403.
- [ ] Revue de code (`/code-review`) — attention à la **non-création d'admin via l'API** et à l'**ordre de la chaîne de guards**.
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **Script de seed (`createApplicationContext`, lecture env, exécution/scripts npm) + `UsersService.upsertPlatformAdmin` :** 1 pt
- **`AdminModule` + endpoint protégé de test + insertion `AppModule` + tests unitaires & e2e (401/403/200) :** 1 pt
- **Total : 2 points**

**Rationale :** peu de logique et surface réduite (un script + un squelette de module + une méthode d'upsert), mais deux points de vigilance : **exécution hors serveur HTTP** (contexte applicatif standalone) et **verrou d'accès** correctement câblé dans la chaîne de guards globale. Cohérent avec l'estimation initiale de 2 pts.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)
1. **`emailVerifiedAt` du seed** — **Recommandé :** le renseigner (l'admin franchit l'`EmailVerifiedGuard` ; pas d'e-mail réel à vérifier). *Alternative :* marquer les routes `/admin/*` `@AllowUnverified` — écarté (affaiblit le verrou, incohérent).
2. **Validation des identifiants admin** — **Recommandé :** dans le **seed** uniquement. *Alternative :* dans `env.validation` — écarté (forcerait ces secrets à chaque boot de l'app).
3. **Exécution du seed** — **Recommandé :** `npm run seed:admin` via `ts-node` dans le conteneur `app` (dev) ; `node dist/seeds/…` en image de prod. À confirmer selon la cible d'exploitation.
4. **Endpoint de test** — **Recommandé :** `GET /admin/ping` minimal (identité de l'admin). Les endpoints métier arrivent en STORY-013/019.

### Notes diverses
- **Réutilisabilité** : `AdminModule` est le point d'ancrage de toute l'administration plateforme (KYC, dashboard).
- **Sécurité** : un seul chemin de création d'un `PLATFORM_ADMIN` (le seed) ; aucune surface d'élévation de privilège via l'API.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-03 : Créée (Scrum Master, BMAD)
- 2026-07-03 : Implémentée, testée et vérifiée sur docker — ✅ Completed (Developer, BMAD)

**Effort réel :** 2 points (conforme à l'estimation).

---

## Notes d'implémentation

### Décisions ouvertes — tranchées
1. **`emailVerifiedAt` du seed** : renseigné → l'admin franchit l'`EmailVerifiedGuard` sans e-mail réel à vérifier.
2. **Validation des identifiants admin** : dans le **seed uniquement** (pas dans `env.validation`) → n'impose pas ces secrets à chaque démarrage de l'app.
3. **Exécution** : `npm run seed:admin` (ts-node) ; en vérif docker, lancé via `ts-node` dans le conteneur `app` (le fichier est aussi compilé vers `dist/seeds/` pour l'exécution en image de prod).
4. **Endpoint de test** : `GET /admin/ping` renvoyant l'identité de l'admin ; `@Roles(PLATFORM_ADMIN)` posé au **niveau du contrôleur** (toutes les futures routes `/admin/*` héritent du verrou).

### Écart notable vs. plan initial
- **Import différé d'`AppModule`** dans `seed-platform-admin.ts` (`await import('../app.module')` à l'intérieur de `bootstrap()`) : évite de déclencher la validation d'environnement (`ConfigModule.forRoot`) au simple import du module par les tests unitaires de `seedPlatformAdmin`. Le cœur (`seedPlatformAdmin(deps)`) est ainsi **testable sans booter l'app**.
- **Couverture** : le dossier `src/seeds/**` est exclu de `collectCoverageFrom` (script opérationnel, validé de bout en bout via docker) ; la logique `seedPlatformAdmin` reste testée unitairement.

### Fichiers clés
- **Seed** : `src/seeds/seed-platform-admin.ts` (`seedPlatformAdmin(deps)` testable + `bootstrap()` `createApplicationContext`, auto-exécution gardée par `require.main === module`).
- **Admin** : `src/modules/admin/admin.module.ts`, `admin.controller.ts` (`GET /admin/ping`, `@Roles(PLATFORM_ADMIN)`), `dto/admin-ping.dto.ts` ; import dans `app.module.ts`.
- **Data** : `users.service.ts` (+ `upsertPlatformAdmin`, idempotent, hors session).
- **Config** : `package.json` (script `seed:admin`, exclusion coverage `seeds/**`), `.env.example` (`PLATFORM_ADMIN_*`).

### Résultats de vérification
- **Unitaires + e2e** : `27 suites / 144 tests` (unit) et `6 suites / 29 tests` (e2e) — **verts**. Couverture globale **99.51 % stmts / 85.34 % branches / 100 % fn / 99.47 % lignes** (seuils 90/65/90/90 respectés).
- **Lint** : `0 warning`. **Build** `nest build` OK ; seed compilé dans `dist/seeds/`.
- **Docker (`docker compose`) — 6/0** : seed idempotent (créé → mis à jour) ; login admin → **200** ; `/admin/ping` admin → **200** (`role: PLATFORM_ADMIN`) ; sans token → **401** ; tenant → **403**.
- **Invariants (Mongo)** : admin `role: PLATFORM_ADMIN`, `tenantId` **absent**, `emailVerifiedAt` renseigné, mot de passe **bcrypt** (`$2b$…`) — jamais en clair.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
