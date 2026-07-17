# STORY-106 : `admin-panel` — guards par permission + proxy de la gestion des membres/rôles plateforme (+ `SourceStatus: forbidden`)

**Epic :** EPIC-025 — RBAC plateforme (D15)
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` (K4 = contrats dupliqués, jetons RS256/JWKS auto-porteurs) · `sprint-status.yaml` §D15 (2026-07-16) · **STORY-103** (socle) · **STORY-105** (amont migrés) · **STORY-104** (surface de gestion) · **STORY-047/048** (patrons lecture/écriture du BFF)
**Priorité :** Must Have
**Story Points :** 8 *(révisé de 5 — cf. §Story Points Breakdown)*
**Statut :** done ✅ (implémentée + vérifiée docker + revue + intégrée dans `dev` le 2026-07-17) — 🏁 **EPIC-025 CLOS**
**Assigné à :** Unassigned
**Créée le :** 2026-07-17
**Sprint :** 10
**Service :** `admin-panel` (:3010) — **1 dépôt** (`prospera-admin-panel-service`), 1 branche `MNV-106`, 1 PR

> **🏁 DERNIÈRE STORY D'EPIC-025 — c'est ici que la délégation devient VISIBLE.** 103 a mis `perms[]` dans le jeton, 105 a fait écouter les amont, 104 a livré la surface de gestion. **Mais la porte d'entrée de l'opérateur est le panel**, et le panel est resté à `@Roles(PLATFORM_ADMIN)` — 105 l'a explicitement mis hors périmètre. **Aujourd'hui, un `PLATFORM_KYC_OFFICER` se prend un 403 du BFF avant même d'atteindre `kyc-service`, qui l'accepterait pourtant.** Sans cette story, l'epic entier reste invisible à l'utilisateur.

---

## User Story

En tant qu'**administrateur plateforme PROSPERA**,
je veux **ajouter un opérateur, lui attribuer un rôle et composer un rôle depuis le catalogue — depuis le panel** — et que le panel **honore les permissions** au lieu d'exiger `PLATFORM_ADMIN`,
afin de **déléguer la revue KYC à un agent** sans lui donner les entitlements ni la suspension d'organisation.

---

## Description

### Contexte

L'epic est **fonctionnel de bout en bout côté amont** — et **inaccessible**. La vérif docker §8b de STORY-104 l'a prouvé : le jeton d'un `PLATFORM_KYC_LEAD` est accepté **directement** par `kyc-service` (:3002). Mais aucun opérateur n'appelle `kyc-service` à la main : il passe par `admin-panel`.

**L'état du panel, relevé dans le code le 2026-07-17** :

| Fichier | Constat | Effet pour un `PLATFORM_KYC_OFFICER` |
|---|---|---|
| [jwt.strategy.ts:91-95](admin-panel/src/modules/auth/strategies/jwt.strategy.ts#L91-L95) | `resolveRole` + `ROLE_PRECEDENCE` — **le piège que 105 a retiré des 3 amont est INTACT ici** | projeté **`role: TENANT_USER`**, `perms` **inexistant** |
| [admin-orgs.controller.ts:37](admin-panel/src/admin/orgs/admin-orgs.controller.ts#L37) | `@Roles(Role.PLATFORM_ADMIN)` (classe) | **403** sur la liste et le détail |
| [admin-org-actions.controller.ts:53](admin-panel/src/admin/orgs/admin-org-actions.controller.ts#L53) | `@Roles(Role.PLATFORM_ADMIN)` (classe) | **403** sur approve / reject / grant / revoke |
| `src/common/rbac/` | **n'existe pas** — pas de `permission.enum.ts`, pas de `PermissionsGuard` | le panel **ignore `perms[]`** |

**Le panel est le seul des 4 services à n'avoir aucune notion de permission.** `auth-service`, `kyc-service` et `platform-catalog-service` portent chacun la copie K4 du catalogue depuis 105 (`diff -q` vérifié à vide).

### 🔴 Trois découvertes de la rédaction (2026-07-17) — elles portent le périmètre de 5 à 8

#### 1. Ce n'est pas « remplacer `@Roles` par `@RequirePermissions` » — le socle RBAC est **absent**

Le `sprint-status` résume 106 en « guards granulaires + proxy ». Le code dit qu'il faut **d'abord construire le socle** : 4ᵉ copie K4 du catalogue, `PermissionsGuard`, `@RequirePermissions`, enregistrement dans la chaîne globale ([app.module.ts:82-87](admin-panel/src/app.module.ts#L82-L87)) — **et surtout la migration de la `JwtStrategy`**, qui traîne le repli `TENANT_USER` :

```typescript
// admin-panel/src/modules/auth/strategies/jwt.strategy.ts:91-95 — le piège, toujours là
private static resolveRole(payload: AccessTokenPayload): Role {
  const roles = payload.roles ?? [];
  const effective = ROLE_PRECEDENCE.find((r) => roles.includes(r));
  return effective ?? Role.TENANT_USER;   // ← PLATFORM_KYC_OFFICER ⇒ TENANT_USER
}
```

C'est **exactement** le piège n°1 de 105 (`AuthenticatedUser.role` singulier, tout rôle inconnu replié sur `TENANT_USER`), avec sa suite obligée : `AuthenticatedUser` `{ role }` → `{ roles[], perms[] }`, `RolesGuard` **multi-rôles**, claim `perms` dans `AccessTokenPayload`, **shim de compat pré-103**. 105 a payé ce coût **deux fois** (kyc + catalog) ; ici c'est la **troisième**, à l'identique. Le patron est connu, donc sûr — mais il n'est pas gratuit.

> ✅ **Ripple mesuré, et il est petit** : `user.role` n'a que **2 consommateurs** dans tout le dépôt — [current-user.decorator.ts:12](admin-panel/src/common/decorators/current-user.decorator.ts#L12) (la déclaration) et [roles.guard.ts:34](admin-panel/src/common/guards/roles.guard.ts#L34). ⚠️ **Ne PAS toucher** [auth-org.contract.ts:47](admin-panel/src/upstream/contracts/auth-org.contract.ts#L47) (`role: string`) : c'est le rôle de **membership** renvoyé par l'amont dans le détail d'org — un contrat K4, homonyme et **sans rapport**.

#### 2. Le proxy des routes de 104 est un **vrai lot** (8 routes, pas 3)

104 a livré **8 routes** de gestion. Le panel n'en proxifie **aucune** — et c'est précisément « la surface demandée » du `sprint-status` (*ajouter un utilisateur, lui attribuer un rôle, composer un rôle depuis le catalogue — DEPUIS le panel*). Relevé dans [platform-roles.controller.ts:64-147](auth-service/src/modules/admin/platform-roles.controller.ts#L64) et [platform-users.controller.ts:53-109](auth-service/src/modules/admin/platform-users.controller.ts#L53) :

`GET /admin/permissions` · `GET /admin/roles` · `POST /admin/roles` · `PATCH /admin/roles/:name` · `DELETE /admin/roles/:name` · `POST /admin/users` · `GET /admin/users` · `PATCH /admin/users/:id`

C'est **le double** des 4 routes de STORY-048 (5 pts à elle seule), avec le même appareillage : contrats K4, méthodes de client, service, contrôleurs, DTOs miroirs validés **au bord**, spécs, e2e.

#### 3. 🪤 `mapPrimaryError` transforme un **403 en 503** — le hook de 105 est plus large qu'annoncé

105 a légué un hook précis : [upstream-error.ts:42-46](admin-panel/src/upstream/upstream-error.ts#L42-L46), `classifyUpstreamError` mappe **404 → `absent`, tout le reste → `unavailable`** → un 403 devient *« le KYC est momentanément indisponible »*, un **mensonge sur une stack saine**.

La lecture du code en trouve **un second, plus grave**, sur la source **primaire** :

```typescript
// admin-panel/src/admin/orgs/org-aggregation.service.ts:157-164
private mapPrimaryError(error: unknown, orgId?: string): Error {
  if (orgId !== undefined && isUpstreamNotFound(error)) {
    return new NotFoundException(`Organisation introuvable: ${orgId}`);
  }
  return new ServiceUnavailableException("Service d'identité (auth-service) indisponible.");
}
```

Un **403** d'`auth-service` (refus d'autorisation, réponse parfaitement saine) devient un **`503`** : le panel **s'accuse d'une panne** au lieu de dire *« vous n'avez pas le droit »*. Et **4 sites** sont concernés au total, dont **2 `catch` nus** qui n'appellent même pas le classifieur ([:174-181](admin-panel/src/admin/orgs/org-aggregation.service.ts#L174-L181) file KYC, et le compteur d'entitlements de la liste).

---

### Périmètre

**Inclus :**

- **Socle RBAC (4ᵉ copie K4)** : `src/common/rbac/permission.enum.ts` — **copie conforme à l'octet près** des 3 existantes (`diff -q` à vide ×3) + **spec de verrou** figeant les 8 · `common/decorators/permissions.decorator.ts` · `common/guards/permissions.guard.ts` · enregistré **après** `RolesGuard` dans la chaîne globale.
- **`JwtStrategy`** : `roles[]` + `perms[]`, **`ROLE_PRECEDENCE` et le repli `TENANT_USER` SUPPRIMÉS**, **shim de compat pré-103** (règle absent ≠ vide) · `AuthenticatedUser` = `{ userId, tenantId, roles: string[], perms: string[], emailVerified }` · `RolesGuard` **multi-rôles** · `AccessTokenPayload.perms?`.
- **Migration des 6 routes existantes** selon la table §Mapping, **planchers deny-by-default au niveau classe** (leçon de la revue de 105).
- **`SourceStatus: 'forbidden'`** (le hook de 105) : `classifyUpstreamError` + les **2 `catch` nus** + **`mapPrimaryError` : 403 → 403** (et non 503) + `AggregateSourcesDto` + Swagger.
- **Proxy des 8 routes de gestion de 104** (patron STORY-048 : relais du bearer, traduction fidèle, **le BFF ne décide/valide/persiste RIEN**) : contrats K4, `AuthServiceClient` étendu, service, contrôleurs, DTOs miroirs validés au bord.
- **e2e mintant des jetons AVEC `perms[]`** (⚠️ cf. §Piège fixture).

**Hors périmètre :**

- **Toute UI** — `admin-panel` est un **BFF sans front** (fronts AP-03/AP-04, hors epic).
- **Toute base de données / read-model / Kafka** côté panel — il n'en a pas, et **n'en aura pas** (`package.json`, §architecture).
- **Route de suspension d'org** : le panel n'en expose **aucune** aujourd'hui ; `org:suspend` est consommée par `auth-service` **en direct** (105). **Ne PAS en ajouter une ici** — hors périmètre du `sprint-status`, et l'ajouter gonflerait une story déjà à 8. **🔓 Dette tracée.**
- **Rôles TENANT** (`TENANT_ADMIN` / `TENANT_USER`) : **PAS TOUCHÉS** — `perms: []` par construction (D15). Le panel n'expose **que** des routes plateforme.
- **Paquet partagé `@prospera/rbac`** : **refusé** (103 §K4) — le catalogue est **recopié**, pour la 4ᵉ et dernière fois.
- **Nouvelle permission** : le catalogue **reste à 8**. Le panel n'introduit **aucun** verbe nouveau — il **réutilise** ceux que les amont vérifient déjà.
- **`kyc:read`** (dette de 105 : `PLATFORM_SUPPORT` voit les URLs présignées des pièces d'identité via `org:read`) → **story dédiée**, elle traverse `kyc-service`.

### Flux

1. Un `PLATFORM_ADMIN` ouvre le panel → `GET /api/v1/admin/permissions` → **proxy** → catalogue des **8 permissions avec libellés** (104).
2. Il **compose** un rôle : `POST /api/v1/admin/roles` `{ name: 'PLATFORM_KYC_OFFICER_2', permissions: ['kyc:approve','kyc:reject','org:read'] }` → **proxy** → l'IdP **valide et persiste** (anti god-mode `assertCanGrant` **côté amont**).
3. Il **invite** un opérateur : `POST /api/v1/admin/users` `{ email, platformRole }` → **proxy** → l'IdP crée un `User(INVITED)` **org-less**, émet `user.registered` **seul** (104), envoie l'e-mail.
4. L'opérateur accepte, se connecte → jeton RS256 : `roles: ['PLATFORM_KYC_OFFICER_2']`, `perms: ['kyc:approve','kyc:reject','org:read']`, `org: null`.
5. Il appelle le panel : `GET /api/v1/admin/orgs/:id` → **`PermissionsGuard` : `org:read` → 200** *(hier : `TENANT_USER` → 403)*. Le panel **relaie son bearer** → les 3 amont **revérifient** (105) → **agrégat servi**.
6. `POST /api/v1/admin/orgs/:id/kyc/approve` → `kyc:approve` → **200**, décision **persistée** par `kyc-service` avec `reviewedBy` = **son** `sub`.
7. `PUT /api/v1/admin/orgs/:id/entitlements/bilan` → **403** : *il ne l'a pas*. **C'est la délégation, de bout en bout, vue par l'utilisateur.**

---

## Acceptance Criteria

- [ ] **Catalogue dupliqué à l'identique** (`src/common/rbac/permission.enum.ts`) : `diff -q` **à vide** contre les **3** copies existantes ; **spec de verrou** figeant les 8 valeurs exactes (une divergence future **échoue au test**, elle ne dérive pas en silence).
- [ ] **`PermissionsGuard` + `@RequirePermissions`** livrés, guard **global**, enregistré **après** `RolesGuard` ([app.module.ts:82-87](admin-panel/src/app.module.ts#L82-L87)).
- [ ] **Sémantique = OU**, testée · **sans `@RequirePermissions`, le guard laisse passer** (identique à `RolesGuard`), testé · message d'erreur **générique** (n'énumère **jamais** la permission manquante — `securite.md`).
- [ ] **`JwtStrategy` projette `roles[]` + `perms[]`** ; **`ROLE_PRECEDENCE` et le repli `TENANT_USER` SUPPRIMÉS** ; `AuthenticatedUser` = `{ userId, tenantId, roles, perms, emailVerified }` · `TenantContext` **inchangé** (`setTenant` si `org`, `setUser` toujours).
- [ ] **`RolesGuard` multi-rôles** : autorise si **l'un quelconque** des rôles du porteur figure dans `@Roles(...)`.
- [ ] **Shim de compat pré-103, dans la `JwtStrategy` SEULE** : `perms` **absent** + `roles` contient `PLATFORM_ADMIN` → **catalogue entier** ; **absent** sans `PLATFORM_ADMIN` → `[]` ; **présent (même `[]`)** → **respecté tel quel, aucun repli**. Les **3** cas testés.
- [ ] **Mapping route → permission appliqué exactement** comme la table §Mapping (**6 migrées + 8 neuves = 14 routes**).
- [ ] **Planchers deny-by-default** : `@RequirePermissions(ORG_READ)` au niveau **classe** sur les 2 contrôleurs d'org ; `ROLE_MANAGE` / `USER_INVITE` sur les 2 contrôleurs de gestion. **Précédence handler > classe testée explicitement** (une précédence inversée **élargirait** `grant` à tout porteur d'`org:read` — c'est le mode de défaillance que la revue de 105 a attrapé).
- [ ] **`SourceStatus` gagne `'forbidden'`** : `classifyUpstreamError` → `403 → 'forbidden'`, `404 → 'absent'`, reste → `'unavailable'` · les **2 `catch` nus** classifient au lieu de présumer `unavailable` · `AggregateSourcesDto` (enum Swagger) à jour.
- [ ] **`mapPrimaryError` : un 403 amont → `403`** (et **non** `503`) — message générique, aucune fuite. Le `404 → 404` (anti-énumération) et le `5xx/timeout → 503` sont **inchangés**.
- [ ] **8 routes de gestion proxifiées** (patron 048) : bearer relayé (**jamais journalisé**), **aucune** décision/validation métier/persistance côté BFF, `rethrowUpstreamError` préserve **400/404/409/422** avec message générique, `5xx`/timeout → **503**, **jamais de 2xx sur échec**.
- [ ] **`POST /admin/roles` traverse fidèlement `201`** (patron `@Res({ passthrough: true })` de [admin-org-actions.controller.ts:112-128](admin-panel/src/admin/orgs/admin-org-actions.controller.ts#L112)) — un code d'écriture **porte du sens**.
- [ ] **DTOs miroirs validés AU BORD** (défense en profondeur, `whitelist` + `forbidNonWhitelisted`) : `permissions[]` validé contre le catalogue **local** ; `name` de rôle ; e-mail d'invitation ; `platformRole`. ⚠️ **Aucun élargissement** : l'amont **reste** l'autorité (`assertCanGrant`, `assertNotLastPlatformAdmin`, rôles système) — le bord **rejette tôt**, il ne **décide** pas.
- [ ] **⚡ Non-régression `PLATFORM_ADMIN`** : détenant les 8 permissions, il conserve **exactement** ses accès actuels sur les 6 routes existantes. *(AC le plus important — c'est le seul rôle réellement en service.)*
- [ ] **Non-régression STORY-047/048** : dégradation partielle (`absent`/`unavailable`), traduction d'écriture, `404` org inconnue, `503` amont éteint → **inchangés**.
- [ ] **`npm run test:chain` (STORY-049) reste vert** — la chaîne KYC traverse ces guards. ⚠️ **Filet de non-régression de l'epic** : à rejouer **stack réelle** (cf. §Vérification docker).
- [ ] **e2e mintant des jetons AVEC `perms[]`** : au moins un e2e porte un jeton `PLATFORM_KYC_OFFICER` **avec `perms[]`** (sinon le chemin neuf **n'est pas testé** — cf. §Piège fixture).
- [ ] **Couverture ≥ seuils** (65 / 90 / 90 / 90, **jamais baissés** ; référence actuelle **99.76 / 89.81 / 100 / 99.73**) · **lint 0 warning** (binaire **local**) · **build OK** · **CI verte**.
- [ ] **Swagger** : les 14 routes documentées, `@ApiForbiddenResponse` **par permission** (plus « Réservé au rôle PLATFORM_ADMIN »).

---

## Technical Notes

### Mapping route → permission (la table qui fait foi)

**Routes existantes — migration** (`@Roles(PLATFORM_ADMIN)` → `@RequirePermissions`) :

| Route (`/api/v1`) | Permission | Contrôleur | Amont revérifie (105) |
|---|---|---|---|
| `GET /admin/orgs` | `org:read` | `AdminOrgsController` **(plancher classe)** | auth + kyc + catalog |
| `GET /admin/orgs/:orgId` | `org:read` | `AdminOrgsController` | auth + kyc + catalog |
| `POST /admin/orgs/:orgId/kyc/approve` | **`kyc:approve`** | `AdminOrgActionsController` | `kyc-admin.controller` |
| `POST /admin/orgs/:orgId/kyc/reject` | **`kyc:reject`** | `AdminOrgActionsController` | `kyc-admin.controller` |
| `PUT /admin/orgs/:orgId/entitlements/:moduleCode` | **`entitlement:grant`** | `AdminOrgActionsController` | `entitlements.controller` |
| `DELETE /admin/orgs/:orgId/entitlements/:moduleCode` | **`entitlement:revoke`** | `AdminOrgActionsController` | `entitlements.controller` |

**Routes neuves — proxy de 104** (mapping **identique à l'amont**, par construction) :

| Route (`/api/v1`) | Permission | → `auth-service` |
|---|---|---|
| `GET /admin/permissions` | `role:manage` | `GET /admin/permissions` |
| `GET /admin/roles` | `role:manage` | `GET /admin/roles` |
| `POST /admin/roles` | `role:manage` | `POST /admin/roles` *(201 traversé)* |
| `PATCH /admin/roles/:name` | `role:manage` | `PATCH /admin/roles/:name` |
| `DELETE /admin/roles/:name` | `role:manage` | `DELETE /admin/roles/:name` |
| `POST /admin/users` | `user:invite` | `POST /admin/users` *(201 traversé)* |
| `GET /admin/users` | `user:invite` | `GET /admin/users` |
| `PATCH /admin/users/:id` | `user:invite` | `PATCH /admin/users/:id` |

> **Le mapping du panel est une COPIE de celui de l'amont, et c'est délibéré.** Le BFF **n'invente aucune règle** : il refuse tôt ce que l'amont refuserait de toute façon (économie d'un aller-retour + message clair), et l'amont **reste l'autorité**. Toute règle *plus stricte* au panel serait une **règle d'autorisation cachée dans un proxy** — invisible pour qui lit l'amont. **Interdit.**

### 🪤 Piège 1 — le plancher `org:read` sur le contrôleur d'**actions** : un arbitrage, pas un oubli

La revue de 105 a imposé le **plancher deny-by-default** : `@Roles(PLATFORM_ADMIN)` était sur la **classe** et protégeait **toute route future dont l'auteur oublierait le décorateur**. Passer à des décorateurs par route **supprime ce filet**.

`getAllAndOverride([handler, classe])` fait **gagner le handler** → chaque route garde **sa** permission, et une route oubliée exige **au moins** le plancher.

⚠️ **À dire franchement** : sur `AdminOrgActionsController`, le plancher `org:read` est **plus faible** que l'actuel `@Roles(PLATFORM_ADMIN)` — une future route d'**écriture** non décorée serait ouverte à un `PLATFORM_SUPPORT` (porteur d'`org:read`) au lieu du seul admin. **C'est le même arbitrage que 105 a acté** sur `admin-organizations` (qui porte `suspend`, une écriture) : le plancher vise la menace **réelle et permanente** — la population **tenant**, qui n'a **aucune** permission (D15) — pas l'opérateur plateforme déjà habilité à lire. **Le mitigeant est le test de précédence**, obligatoire (§AC).

### 🪤 Piège 2 — la fixture `rs256` avale le claim `perms` (déjà vu en 105, **même code**)

[test/utils/rs256.ts:71](admin-panel/test/utils/rs256.ts#L71) construit le jeton par **liste blanche** (`sub` / `org` / `roles` / `emailVerified`) — **exactement** la fixture qui a fait échouer 105 (découverte n°2 de son implémentation). Tout `perms` passé serait **silencieusement supprimé** → les personas retomberaient dans le **shim** → 403 → *« la story ne marche pas »*, alors que **la fixture est incapable de minter un jeton post-103**.

> **Correction attendue** : propager `perms` **uniquement s'il est défini** — la distinction `undefined` ≠ `[]` est **le cœur du shim** (un repli déclenché sur « vide » serait **permanent**, jamais transitoire : les rôles TENANT ont `[]` **pour toujours**).

### 🪤 Piège 3 — les harnais e2e déclarent **leur propre** chaîne de guards

Toujours d'après 105 (découverte n°1) : les e2e enregistrent leurs `APP_GUARD` à la main. [admin-orgs.e2e-spec.ts:24](admin-panel/test/admin-orgs.e2e-spec.ts#L24) importe `RolesGuard`. **En retirant `@Roles` au profit de `@RequirePermissions` sans enregistrer `PermissionsGuard` dans les harnais, les routes migrées deviennent OUVERTES dans les tests** (le `RolesGuard` laisse passer une route sans `@Roles`). La production ne serait pas exposée (`app.module.ts` enregistre le guard) — **mais les e2e valideraient des routes béantes**. Les **3** harnais (`admin-orgs`, `admin-org-actions`, + le neuf) doivent enregistrer la chaîne **complète**.

### `SourceStatus: 'forbidden'` — pourquoi le livrer alors qu'aucun chemin ne l'atteint **aujourd'hui**

**Soyons exacts** (analyse des 3 amont, 2026-07-17) : après 105, **toutes** les lectures que le panel appelle sont gouvernées par **`org:read`** — `auth` (`admin-organizations`), `kyc` (`kyc-admin`), `catalog` (`assertCanReadOrg`). Le plancher du panel est **`org:read`**. Les deux mappings **coïncident** ⇒ un porteur qui passe le panel passe les amont : **`'forbidden'` est inatteignable de bout en bout**. *(Le panel n'appelle ni `catalog-read` ni `catalog-admin` — les 2 contrôleurs restés en `@Roles(PLATFORM_ADMIN)` — vérifié dans `catalog-service.client.ts` : uniquement `/catalog/entitlements/*`.)*

**Il faut le livrer quand même**, pour trois raisons :

1. **C'est un détecteur de divergence K4.** Le catalogue est **recopié dans 4 dépôts** ; leur accord est une **convention**, pas une garantie. Le jour où un mapping dérive, le symptôme doit être **« refusé »**, pas **« en panne »** — sinon on cherchera une panne réseau pendant des heures.
2. **La dette `kyc:read` de 105 le rendra atteignable** (`PLATFORM_SUPPORT` voit les URLs présignées des pièces d'identité via `org:read` — à refermer avant tout usage réel). Ce jour-là, `kyc` deviendra plus strict que le panel : le chemin s'ouvre.
3. **`mapPrimaryError` (403 → 503), lui, est un bug ATTEIGNABLE dès qu'un mapping diverge** — et il ment sur la **source primaire**, celle qui décide du code de réponse.

> **Conséquence honnête pour la vérif docker** : `'forbidden'` sera **prouvé en unitaire** (`classifyUpstreamError(403) === 'forbidden'`, `mapPrimaryError(403) → ForbiddenException`), **pas** par un parcours docker — **aucun n'existe**. À **dire**, pas à sous-entendre. *(Ne pas chercher à le forger : les `perms` sont gelées dans le jeton à l'émission et les deux côtés lisent le **même** jeton — modifier le rôle en base entre deux appels ne diverge rien.)*

### Le proxy — patron STORY-048, sans exception

- **Contrats K4** dans `src/upstream/contracts/` (miroirs des DTOs de 104 : catalogue de permissions **avec libellés**, rôle plateforme, utilisateur plateforme). ⚠️ **Ne PAS recopier `_id`/`__v`/timestamps** — 104 les a **explicitement purgés** de ses réponses (son écart n°2, trouvé en docker) : le contrat est la **projection explicite**, pas le document Mongo.
- **`AuthServiceClient` étendu** (8 méthodes) — il possède déjà `authServiceUrl` + le relais.
- **`PlatformAdminService`** (ou 2 services) : orchestration **pure**, `rethrowUpstreamError` sur **tous** les chemins.
- **2 contrôleurs neufs** — `AdminRolesController` (`role:manage`) et `AdminUsersController` (`user:invite`), **séparés** : c'est la ligne de 048 (lecture / actions dans 2 contrôleurs) **et** la ligne de permission. ⚠️ **Collision de routes à vérifier** : `@Controller({ path: 'admin', version: '1' })` + `@Get('roles')` cohabite avec `@Controller({ path: 'admin/orgs' })` + `@Get(':orgId')` — les préfixes diffèrent (`/admin/roles` ≠ `/admin/orgs/:orgId`), **mais l'ordre d'enregistrement des modules décide en cas de doute** : à **prouver par un test**, pas à supposer.
- **`requireBearer`** : le garde-fou défensif des 2 contrôleurs existants ([:83-89](admin-panel/src/admin/orgs/admin-orgs.controller.ts#L83)) est **dupliqué à l'identique**. 🔓 **Ne pas refactoriser ici** (4 copies après cette story) — hors périmètre, **dette tracée**.

### Swagger

`@ApiForbiddenResponse({ description: "Permission requise : kyc:approve." })` — **par route**. Le message d'**erreur runtime** reste **générique** (anti-énumération) ; **la doc, elle, doit dire la règle** : un intégrateur ne devine pas une permission, et Swagger est déjà derrière l'authentification.

### Vérification docker attendue (obligatoire — la story **change une décision d'autorisation**)

> ⚠️ **`docker compose restart admin-panel` AVANT toute vérif** — le hot-reload est **trompeur** (écart (a) de 104 : `tsc --watch` recompile sans que le process redémarre ⇒ on teste du **code périmé**).
> ⚠️ **Personas obtenus par VRAI login** (`platformRole` en base → re-login → jeton décodé), **jamais** par jeton forgé. Le **throttler de login (5/min)** se déclenchera : **attendre**, ne pas contourner.
> ⚠️ La base de dev porte **7 `PLATFORM_ADMIN` actifs** hérités (écart (c) de 104) — sans incidence ici, mais ne pas s'en étonner.

| § | Vérification | Attendu |
|---|---|---|
| **1** | **⚡ LA PREUVE — `PLATFORM_KYC_OFFICER` via le panel** | `GET /admin/orgs` **200** · `GET /admin/orgs/:id` **200** · `approve` **200** · **`PUT entitlements` 403** · **`DELETE entitlements` 403** — *hier : **403 partout** (replié `TENANT_USER`)* |
| **1b** | **Persistance réelle** de la décision déléguée (`mongosh`) | `tenantkycprofiles` → `APPROVED`, **`reviewedBy` = l'userId de l'agent** (relayé, dérivé **côté amont**), outbox `kyc.status.changed` **`SENT`** |
| **2** | **Non-régression `PLATFORM_ADMIN`** (jeton réel, `perms` = les 8) sur les 6 routes | **inchangé** : list/detail 200, approve/reject 200, grant **201** puis replay **200**, revoke 200 |
| **3** | **🔄 Boucle complète, DEPUIS LE PANEL** | `GET /admin/permissions` → **8 avec libellés** · `POST /admin/roles` → **201** + rôle **en base** (`isSystem:false`) · `POST /admin/users` → **201** + `User(INVITED)` **org-less** + **`memberships = 0`** + e-mail **Mailhog** · accept → login → **le jeton porte le rôle composé au panel** → `GET /admin/orgs` **200** |
| **3b** | **⚡ ASSERTION NÉGATIVE Kafka** (l'invariant de 104) | outbox : `user.registered` = **1**, **`membership.changed` = 0** · `expert_comptable.org_profiles` portant cet userId = **0** *(aucun `OrgProfile` fantôme)* |
| **4** | **L'amont reste l'autorité** (le BFF ne décide rien) | rôle **système** : `DELETE` → **403** · rôle **encore porté** → **409** · **anti-god-mode** : un acteur `{role:manage, org:read}` crée un rôle `{org:read}` → **201**, mais `{entitlement:grant}` → **403** *(refus **amont**, message générique)* · **anti-lockout** → **409** |
| **5** | **Non-régression TENANT** | `TENANT_ADMIN` → **403** sur les 14 routes · sans jeton → **401** |
| **6** | **Traduction fidèle** (patron 048) | `POST /admin/roles` corps invalide → **400** · rôle inconnu → **404** · doublon → **409** |
| **7** | **Dégradation** *(⚠️ à ne pas confondre avec `forbidden`)* | `docker compose stop auth-service` → routes de gestion **503** (**jamais** 2xx) · `stop kyc-service` → `GET /admin/orgs/:id` **200** avec **`sources.kyc = 'unavailable'`** · redémarrage → retour à `'ok'` |
| **8** | **🏁 Chaîne KYC de bout en bout** | `npm run test:chain` (STORY-049) **8/8 vert** **stack réelle** — le filet de non-régression de l'epic traverse ces guards |

> **`sources.kyc = 'forbidden'` n'est PAS dans cette table** : aucun parcours docker ne l'atteint (cf. §ci-dessus). Il est couvert **en unitaire**. Ne pas prétendre l'avoir vérifié en docker.

---

## Risques & Mitigation

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| **Régression `PLATFORM_ADMIN`** — le seul rôle en service ; le panel est la porte de **toute** l'administration | Moyenne | **Critique** | AC dédié · e2e existants **inchangés** · `npm run test:chain` **stack réelle** (§8) · le shim rend le changement **additif** |
| **Piège fixture** : `perms` avalé → personas en 403 → *« la story ne marche pas »* | **Haute** *(le code est identique à celui qui a échoué en 105)* | Moyen | §Piège 2 — corriger `rs256.ts` **d'abord**, vérifier par un test qui **décode** le jeton |
| **Harnais e2e sans `PermissionsGuard`** → routes béantes **validées vertes** | **Haute** *(idem 105)* | Élevé | §Piège 3 — chaîne **complète** dans les 3 harnais + commentaire d'avertissement |
| **Précédence classe/handler inversée** → `grant` élargi à tout porteur d'`org:read` | Faible | **Critique** | Test de précédence **explicite** (AC) + §1 docker (officier : detail 200 / grant **403**) |
| **Collision de routes** `/admin/roles` vs `/admin/orgs/:orgId` | Faible | Moyen | Test de routage explicite (§Le proxy) |
| **Divergence K4 du catalogue** (4ᵉ copie) | Faible | Moyen | `diff -q` ×3 + spec de verrou par service |
| **Sprint 10 à 37/34** après révision 5→8 | **Certaine** | Moyen | **Signalé au PO** (§Story Points Breakdown) — arbitrage : livrer l'epic ou reporter la surface de gestion |

---

## Dependencies

**Stories prérequises :**
- **STORY-103** ✅ *(socle : `perms[]` dans le jeton, 4 rôles système seedés)*
- **STORY-105** ✅ *(amont migrés — **sans elle la granularité du panel est cosmétique** : les amont refuseraient)*
- **STORY-104** ✅ *(les 8 routes de gestion à proxifier — **sans elle, rien à proxifier**)*
- **STORY-047** ✅ *(vue agrégée)* · **STORY-048** ✅ *(patron d'action proxifiée)* · **STORY-049** ✅ *(le filet `test:chain`)*

**Stories bloquées :** aucune. **🏁 Clôt EPIC-025.**
*(Fronts **AP-03/AP-04** : consommateurs naturels — hors epic.)*

**Dépendances externes :** aucune. Stack docker complète (mongo `rs0` + kafka + redis + minio + mailhog + auth `:3001` + EC `:3000` + kyc `:3002` + catalog `:3003` + document `:3006` + admin `:3010`).

---

## Definition of Done

- [ ] Lint **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0` — binaire **local**)
- [ ] `npm run build` **OK**
- [ ] `npm run test:cov` **vert**, seuils **≥ 65 / 90 / 90 / 90** *(référence : **99.76 / 89.81 / 100 / 99.73** — **ne jamais baisser**)* ; `permissions.guard.ts` **100 %**
- [ ] `npm run test:e2e` **vert**, dont **≥ 1 jeton `perms[]`** par harnais
- [ ] **`npm run test:chain` vert stack réelle** (non-régression 🏁 de l'epic)
- [ ] **Vérification docker réelle** consignée dans *Progress Tracking* (§1→§8), assertions `mongosh` **directes**
- [ ] `diff -q src/common/rbac/permission.enum.ts` **à vide** contre les **3** autres dépôts
- [ ] Swagger `/api/docs` : **14 routes**, `@ApiForbiddenResponse` **par permission**
- [ ] Non-régression **047/048/049** prouvée
- [ ] **Aucun secret / bearer journalisé** (redaction pino — cf. le constat corrigé de 048)
- [ ] `/code-review` passé, constats traités ou **tracés**
- [ ] **Statut synchronisé aux 3 endroits** (en-tête, `sprint-status.yaml` + commentaire daté, *Progress Tracking*) + `completed_date`
- [ ] Branche `MNV-106` **depuis `dev`, rebasée sur `origin/dev` AVANT de coder** → push → PR `MNV-106(admin-panel): …` → **« Rebase and merge »** → **branche supprimée**

---

## Story Points Breakdown

| Lot | Points |
|---|---|
| Socle RBAC — 4ᵉ copie K4 (`permission.enum` + spec de verrou) + `PermissionsGuard` + `@RequirePermissions` + chaîne globale | 1 |
| `JwtStrategy` `roles[]`/`perms[]` + **shim** + suppression `ROLE_PRECEDENCE`/repli `TENANT_USER` + `RolesGuard` multi-rôles + `AuthenticatedUser` | 2 |
| Migration des **6** routes + **planchers deny-by-default** + Swagger | 1 |
| **`SourceStatus: 'forbidden'`** (classifieur + 2 `catch` nus + **`mapPrimaryError` 403→403**) + DTO | 1 |
| **Proxy des 8 routes de gestion** (contrats K4 + client + service + 2 contrôleurs + DTOs validés au bord) | 2 |
| Tests unitaires + e2e **avec `perms[]`** (3 harnais) + **vérif docker** (délégation bout-en-bout + `test:chain`) | 1 |
| **Total** | **8** |

**Rationale :** **révisé de 5 → 8** — **le même mouvement que STORY-105 et STORY-104**, pour la même raison : *le plan supposait un remplacement de décorateur, la lecture du code dit autre chose*. Trois causes, toutes vérifiées dans le code (§Découvertes) : (1) **le socle RBAC est absent du panel** — 105 l'a explicitement exclu, donc tout ce que 105 a payé deux fois (`JwtStrategy`, `RolesGuard`, shim, `AuthenticatedUser`) est **à payer une troisième** ; (2) **le proxy est un lot de 8 routes**, le **double** de STORY-048 qui valait 5 points à elle seule ; (3) le hook `forbidden` de 105 en cachait **un second, plus grave** (`mapPrimaryError` : 403 → **503** sur la source **primaire**).

> ⚠️ **CONSÉQUENCE SPRINT — À ARBITRER PAR LE PO.** Le sprint 10 est **à capacité exacte** (34/34, 29 faits + 5 pour 106). À 8 points, il passe à **37/34**. Options : **(a)** l'assumer — c'est la **dernière** story de l'epic, et sans elle 103+104+105 (**26 points déjà investis**) restent **invisibles à l'utilisateur** ; **(b)** scinder — `106a` guards+migration (5) / `106b` proxy de la gestion (3), en sachant que `106a` seule livre la **délégation KYC** (le cas d'usage moteur de D15) et que `106b` ne livre que le **confort de composition** (déjà faisable par API directe sur l'IdP). **Recommandation : (a)** — l'epic est à 3 points de sa fin, et 106b sans 106a n'a aucun sens.

---

## Additional Notes

- **La question à se poser à chaque route : « et si le porteur est un `PLATFORM_SUPPORT` ? »** — pas « et si c'est un `PLATFORM_ADMIN` ? ». L'admin détient les 8 permissions : **il passe partout, il ne révèle aucun bug**. Le piège central de cette story (repli `TENANT_USER`) est **invisible** en testant avec un admin — c'est pourquoi il a survécu à 105.
- **Le BFF n'invente aucune règle d'autorisation.** Il **refuse tôt** ce que l'amont refuserait, et l'amont **reste l'autorité** (105 le lui redemande à chaque appel). Une règle *plus stricte* au panel serait une autorisation **cachée dans un proxy**.
- **Additif de bout en bout** : `roles[]` reste dans le jeton, le shim couvre la fenêtre pré-103 → **déployable seul**, sans coordination avec les 3 amont déjà migrés.
- **Après cette story, le shim de compat pré-103 est retirable dans les 4 dépôts** (~4 lignes chacun) dès qu'aucun jeton pré-103 ne circule (TTL access = **15 min**).
- **🔓 Dettes tracées ici** : (a) `requireBearer` en **4 copies** → extraction ; (b) **aucune route de suspension** au panel (`org:suspend` = API directe) ; (c) `kyc:read` (dette de 105, **prioritaire** : `PLATFORM_SUPPORT` voit les URLs présignées des pièces d'identité) ; (d) le **TOCTOU** `resolveGrantableRole` de 104 (🟡, non corrigé, **story dédiée**).
- **103 a rendu le jeton bavard, 105 a fait écouter les amont, 104 a donné de quoi composer. 106 est le moment où l'opérateur peut enfin s'en servir.** 🏁

---

## Progress Tracking

**Status History:**
- 2026-07-17 : Créée (`/bmad:create-story`) — Scrum Master. **Périmètre révisé 5 → 8 points** à la rédaction (lecture du code) : le **socle RBAC est absent du panel** (le repli `TENANT_USER` de 105 y est **intact**), le **proxy pèse 8 routes**, et le hook `forbidden` de 105 en cachait **un second** (`mapPrimaryError` : 403 → 503). **⚠️ Sprint 10 → 37/34 : à arbitrer par le PO** (recommandation : assumer — dernière story de l'epic).
- 2026-07-17 : Implémentée + **vérifiée docker bout-en-bout** (`/bmad:dev-story`) — review
- 2026-07-17 : `/code-review` (high) — 5 constats, **3 corrigés** (dont 🔴 un 404 de route collection classé `absent`) + 1 documenté + 1 tracé — **done** 🏁

**Actual Effort:** 8 points (conforme à l'estimation révisée)

**Intégration :** dépôt `prospera-admin-panel-service`, branche **`MNV-106`** (créée depuis `dev`, rebasée sur `origin/dev` **avant** de coder), **PR #5** intégrée en **« Rebase and merge »** → `dev` (HEAD **`d504387`**), branche **supprimée** (locale + distante). **0 merge commit** — l'historique reste linéaire.

---

## Implementation Notes (2026-07-17)

### Livré

| Catégorie | Fichiers |
|---|---|
| **Socle RBAC (4ᵉ copie K4)** | **Neuf** : `common/rbac/permission.enum.ts` (**copie conforme**, `diff -q` à vide ×3) + spec de **verrou**, `common/decorators/permissions.decorator.ts`, `common/guards/permissions.guard.ts` (+ spec). **Modifiés** : `jwt.strategy.ts` (`roles[]`/`perms[]` + shim, **`ROLE_PRECEDENCE` supprimé**), `roles.guard.ts` (multi-rôles), `current-user.decorator.ts`, `jwt-payload.interface.ts`, `app.module.ts` (guard). |
| **Migration des 6 routes** | `admin-orgs.controller.ts` (plancher `org:read` + 2 routes), `admin-org-actions.controller.ts` (plancher + 4 routes, une permission par action). |
| **`forbidden`** | `upstream-error.ts` (`isUpstreamForbidden`, classifieur, **`403` dans `WRITE_ERROR_MESSAGES`**), `org-aggregation.service.ts` (**`mapPrimaryError` 403→403**, 2 `catch` nus classifiés, règle de fan-out), `aggregate-sources.dto.ts`. |
| **Proxy (8 routes)** | **Neuf** : `upstream/contracts/platform-rbac.contract.ts`, `admin/rbac/platform-rbac.service.ts`, `admin/rbac/admin-roles.controller.ts`, `admin/rbac/admin-users.controller.ts`, 5 DTOs (+ specs). **Modifiés** : `auth-service.client.ts` (8 méthodes), `upstream-client.ts` (**`patch()`**), `admin.module.ts`. |
| **Tests** | **Neuf** : `test/admin-rbac.e2e-spec.ts` (626 l.). **Modifiés** : `test/utils/rs256.ts` (**claim `perms`**), les 2 harnais e2e (**`PermissionsGuard`**), specs d'agrégation / d'erreur / de clients. |

**39 fichiers, +3 573 / −93.** Catalogue **identique à l'octet près** dans les **4** dépôts (`diff -q` à vide ×3) ; un test de verrou fige les 8 → une divergence K4 **échoue au test**.

### 🔍 2 découvertes à l'implémentation (au-delà des 3 de la rédaction)

1. **🔴 `rethrowUpstreamError` : `403` ABSENT de `WRITE_ERROR_MESSAGES` → retombait en `503`.** La rédaction avait trouvé le 403→503 de `mapPrimaryError` (lecture) ; celui-ci frappe **l'écriture**. Inoffensif avant la délégation — le panel exigeait `PLATFORM_ADMIN` et les amont exigeaient la même chose, donc **un 403 amont était inatteignable**. **Réel dès STORY-106** : l'IdP refuse en 403 l'**anti-god-mode** (`assertCanGrant`) et la mutation d'un **rôle système**. Sans le correctif, le §4b de la vérif docker aurait affiché *« Service amont indisponible »* sur un refus **légitime**, envoyant l'opérateur chercher une panne inexistante. **Prouvé en docker** : `POST /admin/roles {entitlement:grant}` par un acteur réel → **403 « Action non autorisée. »**
2. **🐞 Un `/** … **/` dans un commentaire ferme le bloc.** `(`sub`/`org`/`roles[]`/**`perms[]`**/`emailVerified`)` : la séquence `**/` a **terminé le commentaire** de `rs256.ts` → 12 erreurs TS absurdes (`Cannot find name 'Aucune'`). Trouvé en 30 s par le compilateur, mais le genre de chose qu'on cherche ailleurs.

### 🪤 Les 2 pièges hérités de 105 — REPRODUITS VERBATIM, comme annoncé

| Piège | Constat **réel** |
|---|---|
| **Fixture `rs256` (liste blanche)** | `perms` **silencieusement supprimé** ⇒ fixture **incapable de minter un jeton post-103**. Corrigé : propagé **uniquement s'il est défini** (`undefined` ≠ `[]` — le cœur du shim). |
| **Harnais e2e sans `PermissionsGuard`** | ⚡ **Constaté en rouge, pas déduit** : `npm run test:e2e` → *« expected 403, got **200** »* — un `TENANT_ADMIN` récoltait **200 sur `/admin/orgs`**, et **503** sur les actions (il atteignait le **corps** du handler). Les routes migrées étaient **BÉANTES dans les tests** (le `RolesGuard` laisse passer une route sans `@Roles`). **La production n'a jamais été exposée** (`app.module.ts` enregistre le guard) — mais ces e2e auraient validé des routes ouvertes **en vert**. Corrigé dans les **3** harnais, avec avertissement. |

### ⚡ Honnêteté sur `SourceStatus: 'forbidden'`

**Livré, testé en unitaire, NON vérifié en docker — aucun parcours ne l'atteint.** Confirmé à l'implémentation : le plancher du panel (`org:read`) et les mappings amont (STORY-105) **coïncident** ⇒ qui passe le panel passe les amont. Il reste (a) le **détecteur de divergence K4** — 4 copies du catalogue = convention, pas garantie — et (b) le prérequis de la dette `kyc:read`. La table §Vérification docker l'**exclut explicitement** ; ne pas prétendre le contraire.

### 🔎 `/code-review` (high) — 5 constats : 3 corrigés, 1 documenté, 1 tracé

| # | Constat | Suite |
|---|---|---|
| 1 | **🔴 CORRECTNESS — un 404 sur une route de COLLECTION classé `absent`.** En remplaçant le `catch` **nu** de `buildKycStatusIndex` par `classifyUpstreamError`, la story avait fait entrer un **`absent`** — dont le contrat dit « **rien à afficher, PAS une panne** » — sur `/admin/kyc`, qui **n'a pas de « ressource inexistante »** (une file vide est un `200 []`). Un 404 y signifie **route cassée ou URL mal configurée**. La liste admin se serait affichée **sans aucun statut KYC en affirmant que tout va bien** : l'opérateur en aurait conclu qu'**aucun cabinet n'a soumis de dossier**. Régression **introduite par la story** — avant, le `catch` nu disait `unavailable`, ce qui était honnête. | **CORRIGÉ** — seul le **403** est distingué ; **tout le reste, 404 compris, reste `unavailable`** + **test qui fige la règle**. `buildEntitlementCounts` **non touché** : son `every()` ramenait déjà un 404 sur `unavailable`. |
| 2 | **STALE DOC — `role.enum.ts` documentait les DEUX comportements que la story supprime** : « projetés en **rôle singulier** » (= `ROLE_PRECEDENCE`) et « `@Roles(Role.PLATFORM_ADMIN)` **sur toutes les routes d'administration** » (= **zéro** route désormais). Un lecteur y aurait appris un RBAC qui n'existe plus — ou aurait posé un `@Roles` sur une nouvelle route admin, la rendant **inaccessible à tous les personas délégués**. | **CORRIGÉ** — doc réécrite + avertissement explicite. |
| 3 | **TEST — promesse flottante** (`void controller.inviteUser(...)` + assertions synchrones) : ne passait que parce que le mock est appelé **avant le premier `await`**, et le rejet éventuel n'était jamais capté. | **CORRIGÉ** — `async`/`await`. |
| 4 | **`RolesGuard` n'a plus AUCUN consommateur** (`@Roles` n'est porté par aucune route) mais reste enregistré : il s'exécute pour ne rien décider. | **DOCUMENTÉ** — commentaire d'intention dans `app.module.ts` : une route rôle-gatée **TENANT** reste possible, et le retirer ferait **diverger** la chaîne de celle des 3 amont et des harnais e2e, qui doivent en être le **miroir exact**. |
| 5 | 🟡 **`requireBearer` en 4 copies** (la story en ajoute 2). Garde-fou de **sécurité** : le durcir devra se faire 4 fois, et la copie oubliée sera la plus permissive. | **TRACÉ, NON CORRIGÉ** — extraction hors périmètre (dette déjà tracée). |

### Qualité

| Mesure | Valeur |
|---|---|
| **Lint** | **0 warning** (`--max-warnings 0`, binaire **local**) |
| **Build** | OK |
| **Unitaires** | **203** / 25 suites *(124 sur `dev` → 203)* |
| **e2e** | **78** / 4 suites *(28 → 78)* |
| **Couverture** | **99.82 / 92.12 / 100 / 99.8** — seuils 65/90/90/90 **jamais touchés** ; **branches 89.81 → 92.12** ; **100 %** sur `permission.enum`, `permissions.guard`, `jwt.strategy`, `upstream-error`, `platform-rbac.service`, `admin-roles.controller`, `admin-users.controller` |
| **Isolation `test:chain`** | préservée (`--listTests` : config unit = **0** occurrence de `chain-spec`, config e2e = les 4 `*.e2e-spec.ts` seuls) |

*(Après correctifs de revue : `test:chain` **8/8 vert** rejoué sur stack réelle · re-vérif docker : agent KYC lit **200** / `grant` **403**, `sources` inchangées.)*

### ✅ Vérification docker RÉELLE

Stack **complète** (mongo `rs0` + kafka + redis + minio + mailhog + auth `:3001` + EC `:3000` + kyc `:3002` + catalog `:3003` + document `:3006` + admin `:3010`), **12 conteneurs healthy**. `docker compose restart admin-panel` **avant** toute vérif (hot-reload trompeur — écart (a) de 104). Personas obtenus par **VRAI login**, jamais par jeton forgé.

| § | Vérification | Résultat |
|---|---|---|
| **1** | ⚡ **LA PREUVE — `PLATFORM_KYC_LEAD_106` via le PANEL** (`perms` = `kyc:approve, kyc:reject, org:read`, `org:null`) | `GET /admin/orgs` **200** · `GET /admin/orgs/:id` **200** · **`approve` 200** · **`PUT` entitlement 403** · **`DELETE` entitlement 403** ✔ — *hier : **403 partout** (replié `TENANT_USER`)* |
| **1b** | **Persistance réelle** de la décision déléguée (`mongosh`) | `tenantkycprofiles` → **`APPROVED`**, **`reviewedBy` = l'userId de l'agent** (dérivé du `sub` du jeton **relayé**, côté amont), `reviewedAt` ✔ · outbox `kyc.status.changed` **`SENT`** ✔ |
| **2** | **Non-régression `PLATFORM_ADMIN`** (jeton réel, `perms` = les 8) sur les 6 routes | list **200** · detail **200** · grant **201** puis replay **200** · revoke **200** · reject+motif **200** ✔ |
| **3** | 🔄 **Boucle complète, DEPUIS LE PANEL** | `GET /admin/permissions` → **8 avec libellés** ✔ · `POST /admin/roles` → **201 traversé**, rôle **en base** (`isSystem:false` forcé serveur), **aucune fuite `_id`/`__v`/timestamps** dans le corps ✔ · `POST /admin/users` → **201**, `User(INVITED)` **org-less**, e-mail **Mailhog** ✔ · accept → login → **le jeton porte le rôle COMPOSÉ AU PANEL** (`perms` = les 3) → `GET /admin/orgs` **200** ✔ |
| **3b** | ⚡ **ASSERTION NÉGATIVE Kafka** (invariant 104) | `identity.user.registered` = **1** (`SENT`) · **`identity.membership.changed` = 0** · `memberships` = **0** · downstream `expert_comptable` : `identity_users` = 1 (réplication normale), **`identity_memberships` = 0**, **`org_profiles` fantômes = 0** ✔ |
| **4** | **L'amont reste l'autorité** (refus **relayés**, jamais rejoués) | rôle **système** `DELETE` **403** / `PATCH` **403** (toujours en base) · rôle **encore porté** `DELETE` **409** · doublon **409** · user inconnu `PATCH` **404** (anti-énumération) · total rôles **8**, aucun doublon ✔ |
| **4b** | ⚡ **ANTI-GOD-MODE, acteur RÉEL** `{role:manage, org:read}` (obtenu par login) | `POST /admin/roles {org:read}` → **201** *(il le détient)* **MAIS** `{entitlement:grant}` → **403 « Action non autorisée. »** ✔ · **`ROLE_ESCALADE_106` en base = 0** — l'escalade n'a **pas** eu lieu. ⚡ *C'est ce test qui valide la découverte n°1 : sans le correctif, ce refus légitime aurait été un **503**.* |
| **4c** | **Délégation bornée**, même jeton | `orgs` **200** · `roles` **200** · **`POST /admin/users` 403** *(pas `user:invite`)* · **`approve` 403** *(pas `kyc:approve`)* ✔ |
| **5** | **Non-régression TENANT** (`TENANT_ADMIN` **réel** par inscription, `perms: []`) | **403 sur les 14 routes** · anonyme → **401** ✔ |
| **6** | **Traduction fidèle** | nom minuscules **400** · perm hors catalogue **400** *(catalogue K4 local)* · `isSystem:true` **400** *(whitelist)* · e-mail invalide **400** — **au bord, aucun appel amont** ✔ |
| **7** | **Dégradation ≠ refus** | sain : `sources {kyc:ok, entitlements:ok}` · `stop kyc-service` → **`sources.kyc = 'unavailable'`**, agrégat **toujours servi 200** · `approve` pendant la panne → **503** (**jamais 200**) · `start` → retour **`ok`** ✔ |
| **7b** | **Source PRIMAIRE éteinte** (`stop auth-service`) | detail **503** · `GET /admin/roles` **503** (*jamais une liste vide servie en douce*) · `POST /admin/users` **503** · **`POST /admin/roles` 503** — et **0 trace en base** (`users`=0, `roles`=0) : un échec n'est **pas** une écriture partielle ✔ |
| **8** | 🏁 **Chaîne KYC complète** (`npm run test:chain`, stack réelle) | **8/8 VERT** (24,8 s) — le filet de non-régression de l'epic **traverse** les guards migrés ✔ |

> **`sources.kyc = 'forbidden'` n'est PAS dans cette table** — et ne doit pas y être : aucun parcours ne l'atteint (cf. §Honnêteté). Couvert **en unitaire**.

### ⚠️ À connaître

- **Le throttler de login (5/min)** se déclenche pendant la recette (bascules de persona) — comportement **attendu** (`securite.md`), contourné par **attente**, jamais par contournement.
- **L'e-mail d'invitation met quelques secondes** (BullMQ) : lire Mailhog immédiatement après le `201` renvoie une liste vide — attendre, ce n'est pas un bug.
- **`cd` persiste entre les commandes du shell** : un `npm run build` lancé après un `cd auth-service` construit… `auth-service`. Vérifier le nom du paquet dans la sortie.
- **Résidus de recette en base de dev** (assumés — le dev repart de zéro) : rôles `PLATFORM_KYC_LEAD_106`, `PLATFORM_RBAC_DELEGATE_106`, `ROLE_LEGITIME_106` ; users `agent.kyc.106@`, `rbac.delegate.106@`, `tenant106@`. Les deux premiers rôles sont **non supprimables** tant qu'ils sont portés (c'est le §4 qui le prouve).

### 🔓 Dettes tracées

- **`requireBearer` en 4 copies** → extraction vers `common/` (hors périmètre).
- **Aucune route de suspension** au panel : `org:suspend` reste consommée par `auth-service` **en direct**.
- **`kyc:read`** (dette de **105**, **prioritaire**) : `PLATFORM_SUPPORT`/`PLATFORM_AUDITOR` voient les **URLs présignées des pièces d'identité** via `org:read`. La refermer rendra `forbidden` **atteignable**.
- **TOCTOU `resolveGrantableRole`** (🟡 de 104) — story dédiée.
- **Shim de compat pré-103 : RETIRABLE dans les 4 dépôts** (~4 lignes chacun) dès qu'aucun jeton pré-103 ne circule (TTL access = 15 min).

---

**This story was created using BMAD Method v6 - Phase 4 (Implementation Planning)**
