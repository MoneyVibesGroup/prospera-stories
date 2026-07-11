# STORY-010 : Isolation multi-tenant (TenantScopedRepository) + tests

**Epic :** EPIC-002 — Utilisateurs du tenant
**Réf. architecture :** S2.3
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian
**Créée le :** 2026-07-03
**Terminée le :** 2026-07-03
**Sprint :** 2
**Couvre :** NFR-002

---

## User Story

En tant que **responsable de la plateforme (et cabinet client)**,
je veux **que les données d'un cabinet soient strictement inaccessibles aux autres cabinets**,
afin de **garantir la confidentialité contractuelle du SaaS multi-tenant**.

---

## Description

### Contexte

L'architecture retient une **isolation logique** : collections MongoDB **partagées**, discriminateur **`tenantId` indexé** sur chaque document tenant (`User`, et à venir `KycDocument`, `Subscription`, `Transaction`…). Le `TenantContext` (AsyncLocalStorage via `nestjs-cls`, STORY-003) est **déjà peuplé** : la `JwtStrategy` (STORY-005) appelle `setTenant(payload.tenantId)` / `setUser(payload.sub)` à chaque requête authentifiée.

**Ce qui manque, et que livre cette story :** rien n'**impose** encore le filtre `{ tenantId }`. Aujourd'hui, un service qui oublierait de l'ajouter exposerait les données d'autrui — l'isolation dépend de la **discipline du développeur**. Or **NFR-002** exige que le filtre soit **imposé par l'infrastructure, jamais laissé au développeur** :

> Toute requête MongoDB sur une collection tenant est **automatiquement filtrée par `tenantId`** issu du contexte de requête ; un client ne peut **jamais** fournir son `tenantId` ; l'accès à une ressource d'un autre tenant renvoie **404** (indistinguable d'une ressource inexistante — pas de 403 révélateur) ; cette propriété est **prouvée par une suite e2e bloquante en CI**.

STORY-010 est **infrastructurelle** et **tirée en tête du Sprint 2** : STORY-008 (invitation), STORY-009 (CRUD utilisateurs) et tout EPIC-003/004 (KYC, Billing) construisent dessus. Elle livre un **`TenantScopedRepository<T>` de base** réutilisable, le branche sur la collection `User` (`UsersRepository`), expose une **surface scoping minimale** (`GET /users/:id`) et **prouve l'étanchéité** par une suite d'isolation exécutée en CI.

### Périmètre

**Inclus :**
- **`TenantScopedRepository<T>`** (`common/database/tenant-scoped.repository.ts`) : classe **abstraite générique** enveloppant un `Model<T>` + le `TenantContext`. Chaque opération de lecture/écriture **fusionne `{ tenantId }`** issu du contexte ; la **création force** `tenantId` du contexte (toute valeur entrante est écrasée).
- **Garde-fou fail-closed** : si le contexte ne porte **pas** de `tenantId`, le repository **refuse** l'opération (`throw`) plutôt que d'exécuter une requête non filtrée. L'accès cross-tenant **délibéré** (admin global / système) passe par une méthode **explicite** `forTenant(tenantId)` — jamais implicite.
- **`UsersRepository extends TenantScopedRepository<User>`** ; **refactor** des accès *au sein d'un tenant* de `UsersService` pour passer par lui. Les chemins **hors tenant légitimes** restent explicitement non scoping (login, seed, inscription — voir Notes techniques).
- **Endpoint scoping minimal `GET /api/v1/users/:id`** (`@Roles(TENANT_ADMIN, TENANT_USER)`) renvoyant l'utilisateur **du tenant courant** (404 sinon) : surface concrète d'isolation, **étendue** par STORY-009. Projection sûre (jamais `passwordHash` / hash de tokens).
- **Interdiction du `tenantId` client** : aucun DTO n'expose `tenantId` ; le `ValidationPipe` global (`whitelist + forbidNonWhitelisted`) **rejette (400)** toute propriété inconnue ; à la création, le contexte **prime** de toute façon.
- **Suite e2e d'isolation** `test/tenant-isolation.e2e-spec.ts` : 2 tenants A/B (+ 1 user chacun) ; user A → ressource de B (par id) → **404** ; user A → sa ressource → **200** ; sans token → 401 ; tentative d'injection de `tenantId` (query/body) → ignorée / 400. Exécutée par `npm run test:e2e` → **bloquante en CI** (job `test`, dont dépend `build`).
- **Tests unitaires** du repository : fusion du filtre, création forçant `tenantId`, `throw` hors contexte, `forTenant()` explicite.

**Hors périmètre :**
- **CRUD utilisateurs complet** — `GET /users` paginé, `PATCH /users/:id` (rôle/suspension), `DELETE /users/:id` (soft delete), garde-fou « dernier `TENANT_ADMIN` actif » → **STORY-009** (construit sur `UsersRepository`).
- **Invitation / acceptation** → **STORY-008** (la création d'un invité utilisera `UsersRepository.create`).
- **Requêtes admin cross-tenant** (revue KYC, liste des tenants) → **EPIC-003** ; ici on pose **seulement** l'échappatoire `forTenant()`.
- **Refactor des collections KYC / Billing** → elles **hériteront** de `TenantScopedRepository` à leur création (EPIC-003/004).
- **Migration vers DB-par-tenant** (isolation *physique*) → hors phase 1 (décision archi : isolation logique, mitigée par NFR-002 ; migration ultérieure possible pour gros clients).

### Flux (preuve d'isolation)

1. Un user du **tenant A** s'authentifie → `JwtStrategy` peuple `TenantContext.tenantId = A`.
2. Il appelle `GET /users/:idB` (ressource du **tenant B**) → `UsersRepository.findById` fusionne `{ _id: idB, tenantId: A }` → **aucun document** → `NotFoundException` → **404** (indistinguable d'un id inexistant : **aucune divulgation**).
3. Il appelle `GET /users/:idA` (la sienne) → le filtre matche → **200**.
4. Toute tentative de fournir `tenantId` (query/body) est soit **rejetée (400**, `forbidNonWhitelisted`), soit **sans effet** (le contexte prime à la création).
5. L'admin global (sans `tenantId` dans le contexte) qui aurait besoin d'un accès cross-tenant **doit** appeler `forTenant(tenantId)` : sans cet opt-in explicite, toute opération scoping **lève** (fail-closed).

---

## Acceptance Criteria

- [x] `TenantScopedRepository<T>` (base, `common/database/`) **fusionne automatiquement `{ tenantId }`** issu du `TenantContext` dans **chaque** opération de lecture/écriture (`findById`, `findOne`, `find`, `count`, `exists`, `updateOne`, `deleteOne`) ; la **création force** `tenantId` du contexte (valeur entrante écrasée — testé unitairement). *(Fusion en dernier : le tenant du contexte prime sur tout `tenantId` fourni par l'appelant.)*
- [x] **Fail-closed** : si aucun `tenantId` n'est présent dans le contexte, le repository **refuse** l'opération (`throw MISSING_TENANT_CONTEXT_MESSAGE`) plutôt que d'exécuter une requête non filtrée ; l'accès cross-tenant délibéré passe par la méthode **explicite** `forTenant(tenantId)` (réservée admin/système, testée).
- [x] Un client ne peut **jamais** imposer `tenantId` : **aucun DTO** ne l'expose ; `forbidNonWhitelisted` → **400** s'il est fourni (mécanisme déjà éprouvé sur `role` en STORY-004) ; sur `GET /users/:id`, un `?tenantId=` en query est **sans effet** (le contexte prime). *(Vérifié e2e + docker : injection query → 404 côté cross-tenant.)*
- [x] **Suite e2e d'isolation** (`test/tenant-isolation.e2e-spec.ts`) : user du tenant **A** → ressource du tenant **B** (par id) → **404** (**jamais 403**) ; sa propre ressource → **200** ; sans token → **401**. Chaîne réelle `cls → JwtStrategy → guards → controller → service → repository` sur `GET /users/:id`.
- [x] La suite d'isolation s'exécute via `npm run test:e2e` et est **bloquante en CI** : le job `test` de `.github/workflows/ci.yml` l'exécute et le job `build` a `needs: [lint, test]` → toute fuite **échoue la pipeline** (aucune modification du workflow nécessaire).
- [x] `UsersRepository` (sur la base) est **branché** sur `UsersService.getByIdOrFail` ; les chemins **hors tenant légitimes** (`findByEmail` du login, `upsertPlatformAdmin` du seed, `create` de l'inscription) restent **explicitement** non scoping et **commentés**.
- [x] **Tests unitaires** du repository (fusion du filtre, création forçant `tenantId`, `throw` hors contexte, `forTenant`, id malformé → null) ; **couverture** ≥ seuils (90/65/90/90) ; **lint 0 warning** ; **build** OK ; tests STORY-001→007 précédents restent verts.
- [x] `docker compose up` : parcours d'isolation vérifiable de bout en bout (2 tenants, **404** cross-tenant, **200** same-tenant, id malformé → 404, injection `tenantId` neutralisée) — **11/0**.

---

## Technical Notes

### Composants / fichiers
```
src/common/database/tenant-scoped.repository.ts        # classe abstraite générique (nouveau)
src/common/database/tenant-scoped.repository.spec.ts   # tests unitaires du contrat (nouveau)

src/modules/users/users.repository.ts                  # UsersRepository extends TenantScopedRepository<User> (nouveau)
src/modules/users/users.service.ts                     # refactor : accès tenant via le repository
src/modules/users/users.controller.ts                  # GET /users/:id scoping (nouveau, minimal)
src/modules/users/users.module.ts                      # provider UsersRepository + controller
src/modules/users/dto/user-response.dto.ts             # projection sûre, sans hash (nouveau)

test/tenant-isolation.e2e-spec.ts                      # suite d'isolation, bloquante CI (nouveau)
```

### Conception `TenantScopedRepository<T>`
- **Constructeur** : `protected constructor(protected readonly model: Model<T>, protected readonly tenantContext: TenantContext)`. Reste **singleton** — le tenant vient du `TenantContext` (cls), **pas** de `Scope.REQUEST` (cohérent avec la décision STORY-003 : ne pas reconstruire le graphe de dépendances par requête).
- **Accès au tenant** : `protected get tenantId(): Types.ObjectId` lit `tenantContext.tenantId` ; **absent → `throw`** (`« contexte tenant absent »`, erreur interne → 500 non exploitable, jamais une requête globale silencieuse).
- **Méthodes scoping** (chacune fusionne `{ tenantId }` **en dernier**, de sorte que le contexte prime sur tout filtre fourni par l'appelant) :
  - lecture : `findById(id)`, `findOne(filter?)`, `find(filter?, options?)`, `count(filter?)`, `exists(filter?)` ;
  - écriture : `create(doc)` (injecte `tenantId`, ignore toute valeur entrante), `updateOne(id, patch)`, `deleteOne(id)`.
- **Échappatoire admin** : `forTenant(tenantId: Types.ObjectId)` renvoie une vue liée à un tenant **explicite** (opt-in délibéré) pour le code cross-tenant (EPIC-003 : revue KYC admin). Jamais appelée par un module tenant.
- **Anti-énumération (404 vs 403)** : une ressource d'un autre tenant est **invisible** — `{ _id, tenantId }` ne matche pas → `null` → le service lève `NotFoundException` (**404**). On ne renvoie **jamais 403**, qui révélerait l'existence de la ressource. Propriété testée en **priorité** par la suite d'isolation.

### Pourquoi un repository de base (et pas un plugin Mongoose)
- **Explicite et infranchissable** : les services tenant n'ont accès **qu'au repository** (le `Model` brut n'est pas injecté), donc impossible d'exécuter une requête non scoping « par oubli ». C'est la solution **retenue par l'architecture** (S2.3, § « Conception base & flux »).
- *Alternative (non retenue)* : plugin Mongoose lisant le CLS dans les hooks (`pre(/^find/)`, `pre(/^update/)`…). Plus transparent mais (a) **fragile** sur `aggregate()` et opérations exotiques, (b) **invisible** → surprises au débogage, (c) difficile à **désactiver proprement** pour l'admin. Documenté comme repli si le nombre de collections explose.

### Interdiction du `tenantId` client
- **Aucun DTO** n'expose `tenantId`. Le `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted: true, transform: true`) **rejette (400)** toute propriété non déclarée → un `tenantId` glissé dans un body est refusé.
- À la création, `TenantScopedRepository.create` **écrase** systématiquement `tenantId` avec la valeur du contexte : même un code interne négligent ne peut pas créer hors de son tenant.

### Refactor `UsersService` — chemins scoping vs. non scoping
- **Via `UsersRepository`** (au sein d'un tenant) : les futurs accès de STORY-009 (lister/lire/modifier/suspendre) et le `GET /users/:id` introduit ici.
- **Restent hors repository (non scoping, légitimes et documentés)** :
  - `findByEmail(email)` — **login** : l'e-mail est unique **global** (décision D3) et **aucun contexte tenant** n'existe encore au moment du login ;
  - `upsertPlatformAdmin(...)` — **seed** : le `PLATFORM_ADMIN` a `tenantId = null` (hors périmètre tenant) ;
  - `create(...)` dans l'**inscription** (STORY-004) : le tenant vient d'être créé dans la **même transaction**, `tenantId` est fourni explicitement.
- Ces exceptions sont **commentées** dans le code pour éviter qu'un futur contributeur les prenne pour un oubli de scoping.

### Suite e2e d'isolation + CI
- `test/tenant-isolation.e2e-spec.ts` : construit un `TestingModule` (pattern des e2e existants — cf. `test/admin.e2e-spec.ts`), seed **2 tenants A/B** + **1 user chacun**, génère un access token par user (secret e2e), puis assertions : `A → GET /users/:idB` → **404** ; `A → GET /users/:idA` → **200** ; sans token → **401** ; `?tenantId=B` ou body `{ tenantId: B }` → **ignoré / 400**.
- **CI déjà bloquante sans modification du workflow** : `.github/workflows/ci.yml` → job `test` exécute `npm run test:cov` **puis** `npm run test:e2e` ; le job `build` a `needs: [lint, test]`. Un fichier `*.e2e-spec.ts` est capté par `testRegex` de `test/jest-e2e.json` → la suite d'isolation **échoue la pipeline** en cas de fuite. *(À vérifier à l'implémentation : le nouveau spec est bien exécuté par le job `test`.)*

### Points d'extension (seams)
- **STORY-009** (CRUD users) : `GET /users` paginé, `PATCH/DELETE /users/:id`, garde-fou « dernier `TENANT_ADMIN` » — **tous** sur `UsersRepository`.
- **STORY-008** (invitation) : création d'un invité via `UsersRepository.create` (`tenantId` forcé).
- **EPIC-003 / EPIC-004** : `KycDocumentRepository`, `SubscriptionRepository`, `TransactionRepository`… héritent de `TenantScopedRepository` ; l'admin global utilise `forTenant()` pour la revue KYC cross-tenant.

---

## Dependencies

**Stories prérequises :**
- **STORY-003** ✅ (`TenantContext` via `nestjs-cls`, filtre d'exceptions au format uniforme, pipeline CI `lint → test → build`).
- **STORY-004** ✅ (schéma `User` avec `tenantId` indexé, schéma `Tenant`, inscription transactionnelle).
- **STORY-005** ✅ (`JwtStrategy` peuple `TenantContext.setTenant/setUser`, `@CurrentUser`, chaîne de guards `Jwt → Roles`).

**Stories débloquées par celle-ci :**
- **STORY-008** (invitation) et **STORY-009** (CRUD utilisateurs) — construisent sur `UsersRepository`.
- **EPIC-003 (KYC)** et **EPIC-004 (Billing)** — chaque collection tenant hérite du repository scoping ; l'admin global s'appuie sur `forTenant()`.

**Dépendances externes :** **aucune** — pas de nouveau paquet (`mongoose`, `nestjs-cls` déjà présents). Aucune nouvelle variable d'environnement.

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité (`feature/STORY-010-tenant-isolation`).
- [ ] Tests :
  - [ ] Unitaire `TenantScopedRepository` : fusion `{ tenantId }` dans les lectures ; `create` force `tenantId` (valeur entrante ignorée) ; `updateOne`/`deleteOne` scoping ; **`throw` hors contexte** ; `forTenant()` cible un tenant explicite.
  - [ ] Unitaire `UsersRepository` / `UsersService` : `GET /users/:id` renvoie l'utilisateur du tenant, `null`/404 sinon ; projection sans `passwordHash` ; chemins non scoping (login/seed/inscription) inchangés.
  - [ ] e2e `tenant-isolation` : `A → ressource B` → **404** ; `A → ressource A` → **200** ; sans token → **401** ; injection `tenantId` (query/body) → **ignorée/400**.
- [ ] `npm run test:cov` passe et respecte les seuils (90/65/90/90) ; `npm run test:e2e` **vert**.
- [ ] Lint (**0 warning**) et `nest build` OK ; tests STORY-001→009 toujours verts.
- [ ] `GET /users/:id` documenté dans **Swagger** (tag `users`, réponses 200/401/403/404).
- [ ] `.github/workflows/ci.yml` : la suite d'isolation est **exécutée par le job `test`** et **bloque `build`** (vérifié).
- [ ] `docker compose up` : parcours d'isolation vérifiable (2 tenants, 404 cross-tenant, 200 same-tenant).
- [ ] Revue de code (`/code-review`) — attention au caractère **infranchissable** du scoping (aucun chemin ne contourne le filtre) et au **404 anti-énumération**.
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **`TenantScopedRepository<T>`** (base générique + garde-fou fail-closed + `forTenant`) : **2 pt**
- **`UsersRepository`** + refactor accès tenant `UsersService` + `GET /users/:id` scoping + DTO de projection : **1.5 pt**
- **Suite e2e d'isolation** (2 tenants, 404 cross-tenant, injection `tenantId`) + intégration CI bloquante : **1 pt**
- **Tests unitaires** du repository + non-régression : **0.5 pt**
- **Total : 5 points**

**Rationale :** peu de logique métier, mais **brique de sécurité transverse et infranchissable** dont dépendent **tous** les modules suivants (EPIC-002/003/004). La difficulté est dans les **invariants** — jamais de requête non scoping (fail-closed), **404** anti-énumération, échappatoire admin **explicite** — et dans la **preuve e2e bloquante**. Story tirée **tôt** (S2.3) car KYC et Billing en dépendent. Cohérent avec l'estimation initiale de 5 pts.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Mécanisme de scoping** — **Recommandé :** `TenantScopedRepository` de base (explicite, infranchissable, retenu par l'architecture). *Alternative :* plugin Mongoose lisant le CLS dans les hooks de requête — écarté (fragile sur `aggregate`, invisible, dur à désactiver pour l'admin).
2. **Comportement hors contexte tenant** — **Recommandé :** **`throw`** (fail-closed) : aucune requête non filtrée silencieuse. *Alternative :* renvoyer un résultat vide — écarté (masque les bugs).
3. **Échappatoire admin cross-tenant** — **Recommandé :** méthode explicite `forTenant(tenantId)` (opt-in délibéré). *Alternative :* repository admin séparé — envisageable si l'API admin grossit (EPIC-003).
4. **Surface d'isolation e2e** — **Recommandé :** `GET /users/:id` scoping (réutilisé et étendu par STORY-009). *Alternative :* endpoint-sonde temporaire — écarté (code jetable).
5. **Chemins non scoping légitimes** (login `findByEmail`, seed `upsertPlatformAdmin`, `create` d'inscription) — laissés **hors** du repository de base, **explicitement commentés**. À confirmer qu'aucun autre chemin ne contourne le scoping.
6. **Soft vs hard delete** — la **suppression** relève de STORY-009 ; ici le repository n'expose que la **primitive** `deleteOne` scoping ; STORY-009 tranchera le soft delete (champ `deletedAt` + filtre par défaut).

### Notes diverses
- **Index** : `User` porte déjà `{ tenantId: 1, role: 1 }` (STORY-004) — les requêtes scoping sont couvertes. Les futures collections devront indexer `tenantId` en tête (convention archi).
- **Projection** : `GET /users/:id` renvoie un `UserResponseDto` **sans** `passwordHash`, `refreshTokenHash`, `emailVerification*` (jamais de secret en réponse).
- **Réutilisabilité** : `TenantScopedRepository` est la **fondation** de tous les repositories tenant à venir (KYC, Billing) ; son contrat (fail-closed + `forTenant`) est figé ici.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-03 : Créée (Scrum Master, BMAD)
- 2026-07-03 : Implémentée, testée et vérifiée sur docker — ✅ Completed (Developer, BMAD)

**Effort réel :** 5 points (conforme à l'estimation).

---

## Notes d'implémentation

### Décisions ouvertes — tranchées
1. **Mécanisme de scoping** : **`TenantScopedRepository` de base** (explicite, infranchissable). Les modules tenant n'ont accès qu'au repository ; jamais au `Model` brut.
2. **Hors contexte tenant** : **`throw`** (fail-closed) — constante `MISSING_TENANT_CONTEXT_MESSAGE`, remontée en 500 générique via le filtre global (bug de câblage, jamais une entrée client).
3. **Échappatoire admin** : `forTenant(tenantId)` renvoie une **vue en lecture** (`TenantScopedReader<T>`) liée à un tenant explicite ; n'utilise pas le contexte (fonctionne même sans tenant courant — opt-in délibéré pour EPIC-003).
4. **Surface e2e** : `GET /users/:id` **scoping** (réutilisé/étendu par STORY-009), pas d'endpoint jetable.
5. **404 anti-énumération** : ressource d'un autre tenant / id inexistant / **id malformé** → tous **404** génériques (`USER_NOT_FOUND_MESSAGE`), jamais 403 ni 500.

### Écarts notables vs. plan initial
- **`getByIdOrFail` porté par `UsersService`** (et non le contrôleur) : le contrôleur reste fin, la logique scoping + projection vit dans le service. `UsersService` injecte désormais `UsersRepository` en plus du `Model` (transition ; STORY-009 y migrera le CRUD).
- **`create` du repository force `tenantId` en dernier** (`{ ...doc, tenantId }`) : même un code interne négligent ne peut pas écrire hors de son tenant. Non encore consommé (l'inscription STORY-004 garde son `create` transactionnel explicite) mais prêt pour STORY-008.
- **`findById` garde l'`ObjectId` malformé** : `Types.ObjectId.isValid(id)` faux → `null` (donc 404), évite un `CastError`/500 sur un `:id` d'URL arbitraire — propriété anti-énumération renforcée.
- **`GET /users/:id` : injection `tenantId` par query** — pas de DTO de query, donc `forbidNonWhitelisted` ne s'applique pas ; la neutralisation vient du **repository** (le contexte prime). Le rejet 400 des body `tenantId` reste couvert par le mécanisme global (éprouvé sur `role`).

### Fichiers clés
- **Common** : `common/database/tenant-scoped.repository.ts` (base abstraite : scoping, fail-closed, `forTenant`, `MISSING_TENANT_CONTEXT_MESSAGE`, interface `TenantScopedReader`).
- **Users** : `users.repository.ts` (`UsersRepository extends TenantScopedRepository<User>`), `users.service.ts` (`getByIdOrFail` + `USER_NOT_FOUND_MESSAGE`, injection du repository), `users.controller.ts` (`GET /users/:id`, `@Roles(TENANT_ADMIN, TENANT_USER)`), `dto/user-response.dto.ts` (projection sûre `fromDocument`), `users.module.ts` (provider + controller + exports).
- **Tests** : `tenant-scoped.repository.spec.ts` (contrat exhaustif), `users.repository.spec.ts` (câblage), `users.controller.spec.ts`, `users.service.spec.ts` (+`getByIdOrFail`), `test/tenant-isolation.e2e-spec.ts` (isolation bout-en-bout, bloquante CI).

### Résultats de vérification
- **Unitaires** : `30 suites / 166 tests` — verts. Couverture globale **99.56 % stmts / 86.82 % branches / 100 % fn / 99.53 % lignes** (seuils 90/65/90/90). `tenant-scoped.repository.ts` : **100 %** sur les 4 axes.
- **e2e** : `7 suites / 38 tests` — verts (dont `tenant-isolation` : 9 cas — 401, 200 own, 404 cross A↔B, injection query, id malformé, PLATFORM_ADMIN → 403, e-mail non vérifié → 403).
- **Lint** : `0 warning`. **Build** `nest build` OK.
- **Docker (`docker compose up`) — 11/0** : 2 cabinets réels (tenants distincts), 200 sur sa ressource (projection sans secret), **404** cross-tenant (A↔B), 401 sans token, 404 id inexistant/malformé, `?tenantId=` injecté sans effet.
- **Invariants Mongo** : les 2 utilisateurs ont des `tenantId` **distincts**, rôle `TENANT_ADMIN`, `passwordHash` bcrypt `$2b$` **présent en base mais jamais exposé** par l'API (réponse limitée à `id,email,firstName,lastName,role,status,emailVerified`).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
