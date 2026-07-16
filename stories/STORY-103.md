# STORY-103 : Fondation RBAC — catalogue de permissions (code) + collection `roles` + seed des rôles système + `perms[]` dans le JWT + fix `issueSession`

**Epic :** EPIC-025 — RBAC plateforme (D15)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Données / §Modèle de jetons · `architecture-prospera-ecosystem-2026-07-04.md` (jetons RS256/JWKS, K4 = contrats dupliqués) · `sprint-status.yaml` §D15 (2026-07-16)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout le 2026-07-16)
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-16
**Sprint :** 10
**Service :** `auth-service` (:3001) — l'IdP, **seule source de vérité** des rôles et permissions
**Branche :** `MNV-103`

> **⚡ SOCLE — rien ne tient sans.** Aujourd'hui `admin-panel` n'a **qu'un seul rôle plateforme** : `PLATFORM_ADMIN`, **tout-ou-rien**, **créé par seed uniquement** (`npm run seed:admin`) — **aucune voie d'API**. Déléguer la revue KYC à un opérateur oblige à lui donner **aussi** les entitlements et la suspension d'organisation. Cette story pose la **ligne de partage** qui rend la délégation possible :
>
> | | Nature | Vit dans | Évolue |
> |---|---|---|---|
> | **PERMISSION** | **CODE** | un enum figé | à la livraison — *une permission n'existe que si un guard la vérifie* |
> | **RÔLE** | **DONNÉE** | collection `roles` | **à chaud** — *un rôle n'est qu'un nom donné à un paquet de permissions* |
>
> **UN SEUL système, pas deux.** Les personas (`PLATFORM_KYC_OFFICER`, `PLATFORM_SUPPORT`, `PLATFORM_AUDITOR`) ne sont **PAS des valeurs d'enum** : ce sont des **lignes en base**, seedées et non supprimables. Sinon → **deux systèmes RBAC en parallèle = divergence garantie**.

---

## User Story

En tant qu'**administrateur de la plateforme PROSPERA**,
je veux que les droits soient exprimés en **permissions composables** portées par des **rôles modifiables en base**, et que mon jeton porte **ce que j'ai le droit de faire** (`perms[]`),
afin de pouvoir **déléguer une partie de l'administration** (agent KYC, support, auditeur) **sans donner les pleins pouvoirs**.

---

## Description

### Contexte

**D15 (2026-07-16)** insère le RBAC plateforme **avant** `balance-service`. La raison est un coût qui croît : l'enum `Role` est **déjà dupliqué dans 4 services** — chaque service ajouté à l'écosystème enchérit la migration. **Le RBAC coûte moins cher maintenant qu'après `balance-service`.**

**L'état actuel, précisément :**

| Constat | Preuve dans le code |
|---|---|
| Un seul rôle plateforme, tout-ou-rien | [role.enum.ts:15-19](auth-service/src/common/enums/role.enum.ts#L15-L19) — `PLATFORM_ADMIN`, `TENANT_ADMIN`, `TENANT_USER` |
| Créé **par seed uniquement**, aucune API | [seed-platform-admin.ts](auth-service/src/seeds/seed-platform-admin.ts) + `npm run seed:admin` |
| Le JWT ne porte **que** `roles[]` | [jwt-payload.interface.ts:1-10](auth-service/src/modules/auth/types/jwt-payload.interface.ts#L1-L10) |
| Le guard ne lit **qu'un** rôle | [jwt.strategy.ts:91](auth-service/src/modules/auth/strategies/jwt.strategy.ts#L91) — `payload.roles[0]` |
| **La membership écrase le rôle plateforme** | [auth.service.ts:260-264](auth-service/src/modules/auth/auth.service.ts#L260-L264) |

### 🐞 Le bug `issueSession` — corrigé ICI, obligatoirement

[auth.service.ts:260-264](auth-service/src/modules/auth/auth.service.ts#L260-L264) :

```typescript
const roles = membership
  ? [membership.role!]     // ⚠️ la membership GAGNE…
  : platformRole
    ? [platformRole]       // …et le rôle plateforme est PERDU EN SILENCE
    : [];
```

Un opérateur plateforme qui possède **aussi** une membership (cas parfaitement normal : un employé PROSPERA membre d'une org de test) **perd ses droits plateforme sans aucun message**. Ce n'est pas une hypothèse : **c'est déjà pourquoi la recette docker supprime la membership à la main** (`docker-platform-admin-token`). On ne peut pas construire un RBAC de délégation sur une fonction qui **jette** le rôle qui nous intéresse.

> **Le fix ne tient pas dans `issueSession` seul.** Même en émettant `roles: [TENANT_ADMIN, PLATFORM_ADMIN]`, [jwt.strategy.ts:91](auth-service/src/modules/auth/strategies/jwt.strategy.ts#L91) ne lit que `roles[0]` → `RolesGuard` refuserait encore `@Roles(PLATFORM_ADMIN)`. **Le rayon réel est de 3 fichiers** (`issueSession` → `JwtStrategy.validate` → `RolesGuard`). Bonne nouvelle : `AuthenticatedUser.role` n'est lu **que par [roles.guard.ts:36](auth-service/src/common/guards/roles.guard.ts#L36)** (vérifié : les autres `.role` du code sont des rôles de *membership* dans des DTO, pas `request.user.role`). **Blast radius = 1 lecteur.**

### Périmètre

**Inclus :**

- **Catalogue de permissions (CODE, figé)** — `src/common/rbac/permission.enum.ts` :
  `org:read`, `org:suspend`, `kyc:approve`, `kyc:reject`, `entitlement:grant`, `entitlement:revoke`, `user:invite`, `role:manage`.
  **Règle d'or : une permission n'entre au catalogue que si un guard la vérifie** (sinon = promesse creuse).
- **Collection `roles`** (DONNÉE) : `name` (unique) + `permissions[]` + `isSystem` + `description?`.
- **Seed des 4 rôles système NON SUPPRIMABLES** (`isSystem: true`), **idempotent** :

  | Rôle système | Permissions |
  |---|---|
  | `PLATFORM_ADMIN` | **toutes** (le catalogue entier) |
  | `PLATFORM_KYC_OFFICER` | `kyc:approve`, `kyc:reject`, `org:read` |
  | `PLATFORM_SUPPORT` | `org:read` |
  | `PLATFORM_AUDITOR` | `org:read` |

- **`perms[]` dans le JWT** — **AJOUTÉ** à `AccessTokenPayload`, **`roles[]` CONSERVÉ** : additif, **aucun big-bang, aucun service cassé**, migration progressive (STORY-105).
- **Fix `issueSession`** : `roles[]` = **union** (membership ⊎ platformRole), plus jamais d'écrasement ; `JwtStrategy.validate` + `RolesGuard` lisent **le tableau complet**.
- **`User.platformRole` : contrainte d'enum Mongoose levée** (cf. Technical Notes — sinon 104 est bloquée net).
- **Invariants de sécurité, en service testé** (consommés par STORY-104) :
  - **« on n'accorde que ce qu'on détient »** — sinon `role:manage` = **god-mode** (se composer un rôle avec `entitlement:grant` et se l'attribuer) ;
  - **le DERNIER `PLATFORM_ADMIN` est verrouillé** (anti-lockout : sans route de secours, il ne resterait que le seed en base).

**Hors périmètre :**

- **CRUD des rôles + invitation plateforme (`POST /admin/users`)** → **STORY-104** (cette story expose les *invariants*, pas les *routes*).
- **`PermissionsGuard` + `@RequirePermissions` dans les amont** (`kyc-service`, `platform-catalog-service`) → **STORY-105** (⚠️ **non-optionnelle** : sans elle, `perms[]` ne sert à rien en amont).
- **Guards par permission + proxy dans `admin-panel`** → **STORY-106**.
- **Rôles TENANT** (`TENANT_ADMIN`/`TENANT_USER`) : **PAS TOUCHÉS** — périmètre **strictement plateforme**, pour **borner le rayon d'explosion**. Un rôle tenant n'obtient **aucune** `perms[]`.
- **Paquet partagé `@prospera/rbac`** : **explicitement refusé** (cf. Technical Notes §K4).
- **Révocation immédiate d'un rôle** : **hors périmètre assumé** — le **TTL access de 15 min** est la **borne naturelle de propagation** d'un changement de rôle.

### Flux

1. Au **démarrage**, `auth-service` **upsert** les 4 rôles système dans `roles` (idempotent — redémarrer ne duplique ni n'écrase rien de non-système).
2. `npm run seed:admin` crée/met à jour l'utilisateur `PLATFORM_ADMIN` (inchangé) — son `platformRole` **résout désormais vers une ligne de `roles`**.
3. Un opérateur **se connecte** (`POST /auth/login`).
4. `issueSession` résout **la membership** (rôle tenant) **ET** le `platformRole` → `roles[]` = **union**.
5. Le `platformRole` est **résolu en permissions** via la collection `roles` → `perms[]`.
6. `TokenService.issueTokens` signe (RS256, `kid`) un access token portant **`roles[]` + `perms[]`**, TTL **15 min**.
7. Les services aval (STORY-105) liront `perms[]` ; **ceux qui n'ont pas migré continuent de lire `roles[]`** — **aucune régression**.

---

## Acceptance Criteria

- [ ] **Catalogue de permissions figé en code** (`Permission` enum + `PERMISSION_CATALOG`) : les **8** permissions listées, **et rien d'autre**. Toute permission du catalogue est **destinée à un guard** (103 la définit, 105/106 la vérifient).
- [ ] **Collection `roles`** : `name` **unique** (index), `permissions[]`, `isSystem` (défaut `false`), `description?`. Une `permissions[]` **contenant une valeur hors catalogue est REFUSÉE** (validation au bord — un rôle ne peut pas porter une permission qui n'existe pas).
- [ ] **Seed des 4 rôles système** (`PLATFORM_ADMIN` = catalogue entier, `PLATFORM_KYC_OFFICER` = `{kyc:approve, kyc:reject, org:read}`, `PLATFORM_SUPPORT` = `{org:read}`, `PLATFORM_AUDITOR` = `{org:read}`), tous `isSystem: true`.
- [ ] **Seed IDEMPOTENT** : exécuté 3× → **4 rôles, pas 12** ; il **réaligne** les permissions des rôles système (le code est la référence) et **ne touche à AUCUN rôle non-système** créé via 104.
- [ ] **Seed au démarrage** : un `auth-service` qui boote sur une base vierge a **toujours** ses rôles système (impossible de l'oublier — cf. Technical Notes §Seed).
- [ ] **`perms[]` AJOUTÉ à `AccessTokenPayload`**, **`roles[]` CONSERVÉ** : un jeton émis contient **les deux**. **Test explicite de non-régression** : la forme actuelle du payload (`sub`, `org`, `roles`, `emailVerified`, `iss`, `aud`, `iat`, `exp`) est **intacte**.
- [ ] **`perms[]` dérive du `platformRole`** via la collection `roles`. `platformRole` absent → **`perms: []`** (jamais `undefined`).
- [ ] **Rôles TENANT non touchés** : un `TENANT_ADMIN` sans `platformRole` obtient `roles: ['TENANT_ADMIN']` et **`perms: []`** — comportement **identique à aujourd'hui** côté `roles[]`.
- [ ] **🐞 FIX `issueSession`** : un utilisateur ayant **membership ET `platformRole`** obtient **les DEUX** dans `roles[]` (union) — le rôle plateforme **n'est plus jamais écrasé** ([auth.service.ts:260-264](auth-service/src/modules/auth/auth.service.ts#L260-L264)).
- [ ] **Le fix va jusqu'au guard** : `JwtStrategy.validate` projette **`roles[]` complet + `perms[]`** (fini `roles[0]` — [jwt.strategy.ts:91](auth-service/src/modules/auth/strategies/jwt.strategy.ts#L91)) et `RolesGuard` autorise si **l'un quelconque** des rôles du porteur figure dans `@Roles(...)` ([roles.guard.ts:36](auth-service/src/common/guards/roles.guard.ts#L36)).
- [ ] **PREUVE DU FIX (le test qui compte)** : un utilisateur `PLATFORM_ADMIN` **possédant une membership `TENANT_ADMIN` active** accède à une route `@Roles(PLATFORM_ADMIN)` → **200**. *(Aujourd'hui : **403**.)* → **la recette docker n'a plus besoin de supprimer la membership à la main.**
- [ ] **`User.platformRole` accepte un rôle système hors enum `Role`** : assigner `PLATFORM_KYC_OFFICER` à un utilisateur **persiste sans erreur de validation Mongoose** (cf. Technical Notes §Enum).
- [ ] **Invariant « on n'accorde que ce qu'on détient »** : service testé — un acteur ne portant pas `entitlement:grant` **ne peut pas** composer/attribuer un rôle qui la contient → **refus**. *(Anti god-mode via `role:manage`.)*
- [ ] **Invariant anti-lockout** : retirer/rétrograder le **dernier** `PLATFORM_ADMIN` actif → **refus explicite**. L'avant-dernier reste retirable.
- [ ] **TTL access = 15 min** inchangé (borne de propagation documentée dans la story et en commentaire).
- [ ] **Tests** : catalogue, validation hors-catalogue, seed ×3 (idempotence + non-écrasement des rôles 104), `perms[]` présent/vide, tenant → `perms: []`, **union membership⊎platformRole**, `RolesGuard` multi-rôles, les 2 invariants, non-régression forme du payload. **Coverage ≥ seuils du service** (branches 65 / functions 90 / lines 90 / statements 90).
- [ ] **Lint 0 warning** (`--max-warnings 0`) · **CI verte**.
- [ ] **VÉRIF DOCKER** (cf. §Vérification docker attendue) — obligatoire avant clôture.

---

## Technical Notes

### Le catalogue — CODE, figé

```typescript
// src/common/rbac/permission.enum.ts
/**
 * Catalogue FIGÉ des permissions plateforme (D15, EPIC-025).
 *
 * RÈGLE D'OR : une permission n'entre ici QUE si un guard la vérifie quelque
 * part. Une permission que personne ne contrôle est une promesse creuse.
 *
 * PERMISSION = CODE (ce fichier) · RÔLE = DONNÉE (collection `roles`).
 * Dupliqué par service (K4) — comme l'enum `Role` l'est déjà dans 4 services.
 */
export enum Permission {
  ORG_READ = 'org:read',
  ORG_SUSPEND = 'org:suspend',
  KYC_APPROVE = 'kyc:approve',
  KYC_REJECT = 'kyc:reject',
  ENTITLEMENT_GRANT = 'entitlement:grant',
  ENTITLEMENT_REVOKE = 'entitlement:revoke',
  USER_INVITE = 'user:invite',
  ROLE_MANAGE = 'role:manage',
}

export const PERMISSION_CATALOG: readonly Permission[] = Object.values(Permission);
```

### Les rôles — DONNÉE

```typescript
// src/modules/rbac/schemas/platform-role.schema.ts
@Schema({ timestamps: true, collection: 'roles' })
export class PlatformRole {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  /** Validées CONTRE le catalogue à l'écriture : un rôle ne peut pas porter
   *  une permission qui n'existe pas en code. */
  @Prop({ type: [String], required: true, default: [] })
  permissions!: string[];

  /** `true` → rôle système SEEDÉ, NON SUPPRIMABLE (STORY-104 le refusera). */
  @Prop({ required: true, default: false })
  isSystem!: boolean;

  @Prop()
  description?: string;
}
```

### 🔴 `User.platformRole` — la contrainte d'enum DOIT sauter

**Sans ça, STORY-104 est bloquée net.** [user.schema.ts:46-47](auth-service/src/modules/users/schemas/user.schema.ts#L46-L47) :

```typescript
@Prop({ type: String, enum: Role })   // ⚠️ enum Role = {PLATFORM_ADMIN, TENANT_ADMIN, TENANT_USER}
platformRole?: Role;
```

`PLATFORM_KYC_OFFICER` **n'est pas** une valeur de `Role` (c'est **le principe** : les personas sont des **lignes en base**). Mongoose **rejetterait le `save()`**. → passer à :

```typescript
/** Nom d'un rôle PLATEFORME (collection `roles`). PAS une valeur de l'enum
 *  `Role` : les personas sont des DONNÉES (D15). L'intégrité référentielle est
 *  assurée à l'écriture (STORY-104 : on n'assigne qu'un rôle existant), pas par
 *  une contrainte d'enum qui figerait le modèle. */
@Prop({ type: String })
platformRole?: string;
```

L'index sparse existant ([user.schema.ts:57](auth-service/src/modules/users/schemas/user.schema.ts#L57)) reste valable.

### Le fix `issueSession` — les 3 maillons

```typescript
// 1) auth.service.ts — UNION, plus d'écrasement
const orgId = membership?.organizationId?.toHexString?.() ?? null;
const roles = [
  ...(membership?.role ? [membership.role] : []),
  ...(platformRole ? [platformRole] : []),   // ⚡ ne disparaît PLUS derrière la membership
];
// Les perms ne viennent QUE du rôle plateforme (les rôles TENANT ne sont pas touchés — D15).
const perms = platformRole
  ? await this.platformRolesService.permissionsFor(platformRole)
  : [];

const tokens = await this.tokenService.issueTokens({ userId, orgId, roles, perms, emailVerified });
```

```typescript
// 2) jwt.strategy.ts — projeter le TABLEAU (fini roles[0])
validate(payload: AccessTokenPayload): AuthenticatedUser {
  return {
    userId: payload.sub,
    tenantId: payload.org ?? null,
    roles: payload.roles ?? [],
    perms: payload.perms ?? [],          // ⚠️ jeton pré-103 → [] (tolérance de migration)
    emailVerified: payload.emailVerified,
  };
}
```

```typescript
// 3) roles.guard.ts — l'UN QUELCONQUE des rôles suffit
const granted = user?.roles?.some((r) => requiredRoles.includes(r as Role));
if (!granted) throw new ForbiddenException('Accès refusé : rôle insuffisant.');
```

> **`AuthenticatedUser.role` (singulier) → `roles[]`.** Vérifié : **`roles.guard.ts:36` est le SEUL lecteur** de `request.user.role`. Les autres `.role` du code (`admin-organizations.service.ts:113`, `users.controller.ts:113/173/210`, `user-management.service.ts:73`) sont des rôles de **membership** dans des DTO — **non concernés**. Le dev peut retirer `role` proprement ; si un appelant résiduel apparaît, conserver `role` en accesseur **déprécié** (= premier rôle **tenant**), **jamais** `roles[0]` (qui réintroduirait le bug).

### `TokenSubject` / `AccessTokenPayload` — additif

```typescript
// token.service.ts
export interface TokenSubject {
  userId: string; orgId: string | null;
  roles: string[];
  perms: string[];           // ← AJOUT
  emailVerified: boolean;
}

// types/jwt-payload.interface.ts
export interface AccessTokenPayload {
  iss: string; aud: string | string[]; sub: string; org: string | null;
  roles: string[];           // ← CONSERVÉ (compat : services non migrés, STORY-105)
  perms: string[];           // ← AJOUT
  emailVerified: boolean; iat: number; exp: number;
}
```

**Additif = aucun service cassé.** Un service pré-105 ignore `perms[]` et lit `roles[]` : il fonctionne exactement comme avant. **TTL access 15 min** ([token.service.ts:48-83](auth-service/src/modules/auth/token.service.ts#L48-L83)) = **borne de propagation** d'un changement de rôle.

### Seed — au **démarrage**, pas en script manuel

**Recommandation : `OnApplicationBootstrap`** (précédent : [kafka-bootstrap.service.ts:30](auth-service/src/kafka/kafka-bootstrap.service.ts#L30)), **pas** un `npm run seed:roles`.

> **Pourquoi :** `seed:admin` est un script **délibéré** (il crée un compte avec un mot de passe). Le catalogue de rôles, lui, est une **précondition d'intégrité** : sans lui, **tout login résout `perms: []`** → un `PLATFORM_ADMIN` **silencieusement démuni**. Un seed qu'on peut **oublier** est un seed qui **sera** oublié — et le symptôme (403 partout, aucune erreur au boot) est **coûteux à diagnostiquer**. Un upsert idempotent au boot **ne peut pas** être oublié.

```typescript
// src/modules/rbac/platform-roles-bootstrap.service.ts
async onApplicationBootstrap(): Promise<void> {
  for (const role of SYSTEM_ROLES) {
    await this.roleModel.updateOne(
      { name: role.name },
      { $set: { permissions: role.permissions, isSystem: true, description: role.description } },
      { upsert: true },
    );
  }
  // ⚠️ AUCUN deleteMany : les rôles NON-système (créés en 104) sont intouchables.
}
```

Le seed **réaligne** les rôles système (le code est la référence : ajouter une permission à `PLATFORM_KYC_OFFICER` = une ligne de code + un redémarrage) et **ne supprime jamais rien**.

### §K4 — pourquoi le catalogue est DUPLIQUÉ et non partagé

**Tranché le 2026-07-16 : PAS de paquet `@prospera/rbac`.** Le catalogue sera **recopié** dans `kyc-service` et `platform-catalog-service` (STORY-105).

| | Paquet partagé | **Duplication (retenu)** |
|---|---|---|
| K4 (contrats dupliqués, zéro dépendance inter-services) | **rompu** | **respecté** |
| Précédent | aucun | **l'enum `Role` est déjà dupliqué dans 4 services** |
| Coût | **1ʳᵉ dépendance partagée de l'écosystème** (versioning, publication, couplage de déploiement) | **divergence possible — assumée** |

Une chaîne de permission ne diverge pas silencieusement : elle diverge **en 403**, sur un test. Le coût d'introduire la **première** dépendance partagée de l'écosystème est **très supérieur**.

### Les 2 invariants — service testé, routes en 104

STORY-103 livre les **règles**, STORY-104 livre les **routes qui les appellent**. Les écrire ici (avec leurs tests) garantit qu'elles **existent avant** la surface qui les rend exploitables.

```typescript
// src/modules/rbac/platform-roles.service.ts

/** « On n'accorde QUE ce qu'on détient » — sans ça, `role:manage` = GOD-MODE :
 *  se composer un rôle avec `entitlement:grant` et se l'attribuer. */
assertCanGrant(actorPerms: string[], targetPerms: string[]): void {
  const escalation = targetPerms.filter((p) => !actorPerms.includes(p));
  if (escalation.length > 0) {
    throw new ForbiddenException(
      "Vous ne pouvez accorder que des permissions que vous détenez.",  // sans détailler l'escalade
    );
  }
}

/** ANTI-LOCKOUT : sans route de secours, perdre le dernier PLATFORM_ADMIN ne
 *  laisse que le seed en base pour rentrer. Le dernier est VERROUILLÉ. */
async assertNotLastPlatformAdmin(userId: string): Promise<void> {
  const count = await this.usersService.countActiveByPlatformRole('PLATFORM_ADMIN');
  if (count <= 1) {
    throw new ConflictException(
      "Impossible : il doit rester au moins un administrateur plateforme.",
    );
  }
}
```

### Vérification docker attendue

Recette `docker-platform-admin-token` — **c'est le test qui prouve le fix** :

1. `docker compose up` (compose **RACINE**) → au boot, `db.roles.find()` → **4 rôles système**, `isSystem: true`.
2. `npm run seed:admin` → login `PLATFORM_ADMIN` → décoder le JWT → **`perms[]` = les 8 permissions** + `roles: ['PLATFORM_ADMIN']`.
3. **🐞 LE TEST DU FIX** : ajouter à la main une membership `TENANT_ADMIN` active à ce même utilisateur → **re-login** → `roles: ['TENANT_ADMIN', 'PLATFORM_ADMIN']`, `perms[]` **toujours complet** → `GET /admin/organizations` → **200**.
   *(Avant 103 : `roles: ['TENANT_ADMIN']`, **403** → d'où la suppression manuelle de la membership dans la recette. **Cette étape manuelle disparaît.**)*
4. Assigner `platformRole: 'PLATFORM_KYC_OFFICER'` en base → **le `save()` passe** (enum levé) → re-login → `perms: ['kyc:approve','kyc:reject','org:read']`, **pas** `entitlement:grant`.
5. **Non-régression tenant** : login d'un `TENANT_ADMIN` ordinaire → `roles: ['TENANT_ADMIN']`, **`perms: []`**, parcours org **inchangé**.
6. **Non-régression amont** (les services **non encore migrés** lisent `roles[]`) : `admin-panel` STORY-047/048 → reads + approve/reject + grant/revoke **toujours 200**.
7. Redémarrer `auth-service` ×2 → **toujours 4 rôles** (idempotence), aucun doublon.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Big-bang du JWT** : ajouter `perms[]` casse les services qui lisent `roles[]` | **Strictement additif** — `roles[]` **conservé** ; test de non-régression sur la forme du payload ; vérif docker §6 (amont non migrés OK) |
| **`role:manage` = god-mode** (se composer `entitlement:grant`) | **`assertCanGrant`** (« on n'accorde que ce qu'on détient »), **testée ici**, câblée en 104 |
| **Lockout total** : plus aucun `PLATFORM_ADMIN` | **`assertNotLastPlatformAdmin`** — le dernier est **verrouillé** |
| **Deux systèmes RBAC en parallèle** (personas en enum **et** en base) | Les personas sont **UNIQUEMENT** des lignes en base ; l'enum `Role` **n'accueille aucun** nouveau persona ; contrainte d'enum **levée** sur `platformRole` |
| **Rôle système supprimé/altéré** | `isSystem: true` + seed de **réalignement** au boot ; suppression refusée en 104 |
| **Seed oublié** → `perms: []` → admin démuni, **sans erreur au boot** | Seed **au démarrage** (`OnApplicationBootstrap`), **pas** un script manuel |
| Seed écrase les rôles créés via 104 | Upsert **par `name`**, **aucun `deleteMany`** ; test « seed ×3 ne touche pas un rôle non-système » |
| **Divergence du catalogue** entre services (K4) | Assumée (cf. §K4) ; se manifeste en **403 sur un test**, pas en silence ; catalogue **figé** = dérive lente |
| Permission au catalogue que personne ne vérifie | **Règle d'or** : une permission n'existe que si un guard la vérifie (105/106 les consomment **toutes**) |
| Changement de rôle non propagé immédiatement | **TTL access 15 min** = borne **assumée et documentée** (révocation immédiate hors périmètre) |
| Le fix `roles[]` régresse un appelant de `user.role` | **Blast radius vérifié = 1** (`roles.guard.ts:36`) ; accesseur déprécié en repli — **jamais** `roles[0]` |

---

## Dependencies

**Prérequis :** aucun — **STORY-103 EST le socle** (`auth-service` STORY-022→026 déjà livrées : JWT RS256/JWKS, `RolesGuard`, seed `PLATFORM_ADMIN`).

**Débloque :**

| Story | Dépend de 103 pour |
|---|---|
| **STORY-105** (⚡ **non-optionnelle**, à faire **juste après**) | Le catalogue à dupliquer + `perms[]` dans le jeton. **Sans 105, les amont renvoient 403** et les rôles de 103/104 **ne servent à rien**. |
| **STORY-104** | La collection `roles` + le catalogue + les 2 invariants |
| **STORY-106** | `perms[]` (+ 105, sinon la granularité du panel est **cosmétique**) |

**ORDRE IMPOSÉ (D15) : 103 → 105 → 104/106.**

---

## Definition of Done

- [ ] Catalogue `Permission` (8) figé en code + `PERMISSION_CATALOG`
- [ ] Collection `roles` (`name` unique, `permissions[]` validées contre le catalogue, `isSystem`)
- [ ] 4 rôles système seedés **au démarrage**, **idempotent ×3**, **sans toucher aux rôles non-système**
- [ ] `perms[]` **ajouté** au JWT, `roles[]` **conservé** (non-régression du payload testée)
- [ ] 🐞 **`issueSession` corrigé** — union membership ⊎ platformRole, **jusqu'au guard** (`JwtStrategy` + `RolesGuard` lisent le tableau)
- [ ] **Preuve du fix** : `PLATFORM_ADMIN` **+ membership** → route `@Roles(PLATFORM_ADMIN)` → **200**
- [ ] Contrainte d'enum **levée** sur `User.platformRole` (`PLATFORM_KYC_OFFICER` persiste)
- [ ] Invariants **`assertCanGrant`** + **`assertNotLastPlatformAdmin`** implémentés **et testés**
- [ ] Rôles TENANT **non touchés** (`perms: []`, parcours org inchangé)
- [ ] Coverage ≥ seuils (65/90/90/90) · lint **0 warning** · CI verte
- [ ] **Vérif docker** §1-7 **passée** (dont : la recette n'a **plus** besoin de supprimer la membership)
- [ ] `/code-review` passée, constats traités
- [ ] Branche `MNV-103` (depuis `dev`, rebasée `origin/dev`) → PR `MNV-103(auth): …` → **Rebase and merge** → branche supprimée
- [ ] `sprint-status.yaml` : `status: done` + `completed_date` + `story_path`
- [ ] **Mémoire à mettre à jour** : `docker-platform-admin-token` (l'étape « delete membership » devient **caduque**)

---

## Story Points Breakdown

| Poste | Points |
|---|---|
| Catalogue + schéma `roles` + validation hors-catalogue | 1 |
| Seed système idempotent (`OnApplicationBootstrap`) | 1 |
| `perms[]` dans le JWT (`TokenSubject`, payload, `TokenService`) | 1 |
| 🐞 Fix `issueSession` + `JwtStrategy` + `RolesGuard` (3 maillons) | 1 |
| Invariants (`assertCanGrant`, anti-lockout) + tests + vérif docker | 1 |
| **Total** | **5** |

**Rationale :** aucun poste n'est difficile **isolément** ; le coût est dans la **rigueur de non-régression** — le JWT est la **surface la plus partagée de l'écosystème** (4 services), et `RolesGuard` protège **toutes** les routes admin. Le fix `issueSession` traverse **3 fichiers** et non 1. **5 points**, pas 3.

---

## Additional Notes

- **Ce qui rend cette story difficile n'est pas le RBAC — c'est de ne rien casser.** `roles[]` conservé + `perms[]` additif = **aucun service à modifier** pour que 103 passe en prod. Les amont migrent **quand ils veulent** (105).
- **`perms[]` dans le jeton, pas un appel réseau.** Le jeton est **auto-porteur** (K4) : aucun aval n'appelle `auth-service` pour autoriser. Contrepartie **assumée** : TTL 15 min de propagation.
- **La règle d'or (« une permission n'existe que si un guard la vérifie ») est ce qui empêche le catalogue de pourrir.** Les 8 permissions de 103 sont **toutes** consommées par 105/106 — aucune n'est décorative.
- **Le fix `issueSession` a une valeur immédiate**, indépendante du RBAC : il **supprime une étape manuelle** de la recette docker (`docker-platform-admin-token`) — un contournement qui documentait un bug depuis des sprints.

---

## Progress Tracking

**Status History:**
- 2026-07-16 : Créée (`/bmad:create-story`) — Scrum Master
- 2026-07-16 : Implémentée + vérifiée docker (`/bmad:dev-story`) — **done**

**Actual Effort:** 5 points (conforme à l'estimation)

---

## Implementation Notes (2026-07-16)

### Livré

| Fichier | Rôle |
|---|---|
| `common/rbac/permission.enum.ts` | Catalogue **figé** : `Permission` (8) + `PERMISSION_CATALOG` (gelé) + `isPermission()` |
| `modules/rbac/schemas/platform-role.schema.ts` | Collection `roles` — `name` unique, `permissions[]` **validées contre le catalogue**, `isSystem` |
| `modules/rbac/system-roles.ts` | Les 4 rôles système (`PLATFORM_ADMIN` = `PERMISSION_CATALOG` **par construction**) |
| `modules/rbac/platform-roles-seed.service.ts` | Seed idempotent `OnApplicationBootstrap` — upsert par `name`, **aucun `deleteMany`** |
| `modules/rbac/platform-roles.service.ts` | `permissionsFor` + `isSystemRole` + **`assertCanGrant`** + **`assertNotLastPlatformAdmin`** |
| `modules/rbac/rbac.module.ts` | Module **sans dépendance vers `users`** (anti-cycle) |

**Modifiés :** `jwt-payload.interface.ts` (+`perms`), `token.service.ts` (+`perms` dans `TokenSubject` et le jeton signé), `auth.service.ts` (**union** + résolution des perms), `jwt.strategy.ts` (tableau complet + tolérance pré-103), `roles.guard.ts` (multi-rôles), `current-user.decorator.ts` (`role` → `roles[]` + `perms[]`), `user.schema.ts` (**enum levé**), `users.service.ts` (+`countActiveByPlatformRole`), `users.controller.ts` (`/me` préservé).

### 3 écarts par rapport à la story rédigée

1. **`acceptInvitation` portait la MÊME famille de bug** (non identifiée à la rédaction) : [auth.service.ts:340](auth-service/src/modules/auth/auth.service.ts#L340) appelait `issueSession` **sans `platformRole`** alors que `user` était disponible → un opérateur plateforme acceptant une invitation aurait obtenu un jeton **sans ses permissions**. Latent aujourd'hui (comptes plateforme seedés), mais **STORY-104 fait de l'invitation org-less LA voie d'entrée d'un opérateur** : piège à retardement. **Corrigé ici** (`user.platformRole` transmis).

2. **`users.controller.ts:173` lisait bien `request.user.role`** — la story affirmait que `roles.guard.ts:36` en était le seul lecteur. C'est le champ **d'affichage** du contrat public `GET /users/me` (`role: string | null`), pas une autorisation. **Contrat préservé** via `user.roles[0] ?? null`, qui reproduit **exactement** la valeur d'avant 103 (l'union étant ordonnée membership→plateforme, `roles[0]` = l'ancien `membership ? membership.role : platformRole`). Le guard **reste** le seul lecteur *d'autorisation*.

3. **Fichier nommé `-seed` et non `-bootstrap`** : `collectCoverageFrom` (package.json) exclut tout fichier contenant `bootstrap` — écrit pour les amorçages de connectivité Kafka/queue, non testables unitairement. Le seed, lui, **est** de la logique métier testée (idempotence, non-destruction des rôles de 104) : sous le nom `bootstrap`, il sortait **silencieusement** de la couverture. Renommé plutôt que d'ajouter une exception au config.

### `/code-review` (high) — 4 constats, 2 CORRIGÉS

| # | Constat | Suite |
|---|---|---|
| 1 | **🔴 Anti-lockout TOCTOU** : `assertNotLastPlatformAdmin` / `countActiveByPlatformRole` n'acceptaient **pas de `ClientSession`** → STORY-104 n'aurait **pas pu** évaluer l'invariant dans la transaction de sa mutation. Deux rétrogradations parallèles lisent chacune « 2 », passent toutes les deux → **0 admin, lockout irréversible**. Le dépôt avait **déjà résolu exactement ce cas** un cran plus bas : `MembershipsService.countActiveAdmins(orgId, session)` évalué **sous session** ([user-management.service.ts:85](auth-service/src/modules/users/user-management.service.ts#L85)), avec le commentaire « pas de fenêtre de course (deux admins rétrogradés en parallèle → 0 admin) ». | **CORRIGÉ** — `session` propagée sur les deux méthodes + test qui vérifie la transmission |
| 2 | **🔴 Seed non tolérant à la concurrence** : deux instances qui bootent en parallèle (scale-up, rolling deploy) → `updateOne(upsert)` concurrents sur l'index unique `name` → **E11000** remonté depuis `onApplicationBootstrap` → **le conteneur ne démarre pas**. Invisible en dev (1 réplique), se déclenche au 1ᵉʳ scale-up. | **CORRIGÉ** — rejeu sur duplicate key (sûr : le seed est idempotent) ; toute autre erreur **propage** (un service sans rôles ne doit pas démarrer en silence) |
| 3 | `platformRole` sans validation d'intégrité depuis la levée de l'enum | **ACCEPTÉ** — levée délibérée (sinon 104 bloquée) ; dégradation sûre (rôle inconnu → `perms: []`, jamais d'élévation) ; whitelist DTO en 104 |
| 4 | `findByName` : aucun appelant, hors ACs | **CORRIGÉ** — supprimé (spéculatif ; `permissionsFor` couvre 103) |

### Qualité

- **298 tests / 42 suites verts** (unitaires + e2e) · **lint 0 warning** (`--max-warnings 0`)
- Coverage global **96.18 / 84.71 / 97.44 / 96.20** (seuils 65/90/90/90) — **tout le code RBAC neuf à 100 %** (`common/rbac`, `modules/rbac`, `modules/rbac/schemas`), `roles.guard.ts` à **100 %**
- Non-régression de la **forme du payload** verrouillée par un `toEqual` **exact** (`token.service.spec`) : échoue si un claim disparaît **ou** si un claim inattendu apparaît

### Vérification docker (compose RACINE, mongo rs0 + kafka + redis + minio + mailhog + auth:3001 + kyc:3002 + catalog:3003 + admin-panel:3010)

| § | Vérification | Résultat |
|---|---|---|
| 1 | `db.roles` au boot | **4 rôles système**, `isSystem: true`, permissions exactes ✔ |
| 2 | Login `PLATFORM_ADMIN` | `roles: ['PLATFORM_ADMIN']`, **`perms` = les 8** ✔ |
| 3 | **⚡ LA PREUVE** — admin **+ membership `TENANT_ADMIN` active** | `roles: ['TENANT_ADMIN','PLATFORM_ADMIN']`, perms intactes, `GET /admin/organizations` → **200** *(avant 103 : **403**)* ✔ |
| 4 | `platformRole = 'PLATFORM_KYC_OFFICER'` (hors enum) | `save()` **accepté**, perms = `kyc:approve, kyc:reject, org:read`, **`entitlement:grant` absent** ✔ |
| 5 | Non-régression tenant | `roles: ['TENANT_ADMIN']`, **`perms: []`**, `/me` → 200 (`role: 'TENANT_ADMIN'`, org intacte), route plateforme → 403 ✔ |
| 6 | Non-régression **amont non migrés** (lisent `roles[]`) | admin-panel `/admin/orgs` **200**, kyc `/admin/kyc` **200**, catalog `/catalog/admin/modules` **200**, sans jeton **401** ✔ |
| 6b | **Frontière STORY-105** | `PLATFORM_KYC_OFFICER` → kyc **403**, catalog **403** — **la démonstration que 105 est NON-OPTIONNELLE** ✔ |
| 7 | Idempotence (3 boots) + rôle non-système préexistant | **4 rôles système** (pas 12), **aucun doublon**, rôle `RESPONSABLE_CONFORMITE` (simulation 104) **INTACT** ✔ |

> **L'étape manuelle « supprimer la membership » de la recette `docker-platform-admin-token` est désormais CADUQUE** — §3 le prouve.

### Intégration

**INTÉGRÉ DANS `dev` le 2026-07-16** : dépôt `prospera-auth-service`, branche `MNV-103` (créée depuis `dev`, rebasée sur `origin/dev` **avant** de coder), **PR #2** intégrée en **« Rebase and merge »** (aucun merge commit, `dev` = `f4eed67`), branche **supprimée** (locale + distante).

### Reste / suites

- **STORY-105 (⚡ non-optionnelle, à enchaîner)** : §6b montre noir sur blanc qu'un `PLATFORM_KYC_OFFICER` porte `kyc:approve` dans son jeton **et se prend quand même un 403** en amont.
- **STORY-104** : les invariants `assertCanGrant` / `assertNotLastPlatformAdmin` sont livrés **et testés**, prêts à être câblés sur les routes ; la contrainte d'enum est levée.

---

**Status:** done ✅
**Dependencies:** aucune (socle) · **Débloque** STORY-104 / **STORY-105** (non-optionnelle) / STORY-106
**Reference:** `sprint-status.yaml` §D15 (2026-07-16) · `architecture-auth-service-2026-07-04.md` · `architecture-prospera-ecosystem-2026-07-04.md` (K4)

**This story was created using BMAD Method v6 - Phase 4 (Implementation Planning)**
