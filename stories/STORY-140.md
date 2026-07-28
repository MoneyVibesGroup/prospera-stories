# STORY-140 : Extension du catalogue de permissions (`catalog:*`, `project:*`) + migration de `catalog/admin` vers `@RequirePermissions` + seed des rôles métier Comptable / Marketing / DG

**Epic :** EPIC-025 — RBAC plateforme (D15)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Données / §Modèle de jetons · `architecture-catalog-service-2026-07-07.md` · **STORY-103** (catalogue figé + règle d'or + `assertCanGrant`) · **STORY-104** (CRUD rôles + libellés) · **STORY-105** (migration des amont, précédent multi-repo)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** draft
**Assigné à :** Unassigned
**Créée le :** 2026-07-28
**Sprint :** 18
**Services :** `auth-service` (:3001) · `platform-catalog-service` (:3003) — ⚠️ story **multi-repo** (exception assumée à « 1 story = 1 service », précédent : STORY-105) → **2 branches + 2 PR**
**Branches :** `MNV-140` × 2 dépôts

---

## Contexte

Le PO demande trois rôles internes Money Vibes — **Comptable**, **Marketing**, **DG** — dans la
console admin, à côté des `PLATFORM_*` existants.

**Le constat qui cadre cette story.** La mécanique est déjà là : EPIC-025 est clos, les rôles sont
des **données** composables à chaud (STORY-103/104), le panel sait les composer (STORY-106 livrée,
vérifiée sur `origin/dev` de `prospera-admin-panel-service` au commit `0521258`). Créer
`PLATFORM_ACCOUNTANT`, `PLATFORM_MARKETING` et `PLATFORM_EXECUTIVE` **ne demande aucun code** : ce
sont trois lignes de seed.

Le vrai manque est ailleurs, et il est double :

1. **Le catalogue de 8 permissions ne décrit aucun de ces métiers.** Vérifié sur `origin/dev` de
   `prospera-auth-service` (`4f452a9`) : `org:read`, `org:suspend`, `kyc:approve`, `kyc:reject`,
   `entitlement:grant`, `entitlement:revoke`, `user:invite`, `role:manage`.
2. **Une surface entière échappe encore au RBAC.** `catalog/admin` — tout le CRUD modules /
   versions / référentiels consommé par AP-04 — est toujours gardé par
   `@Roles(Role.PLATFORM_ADMIN)` (`cat/src/modules/catalog/controllers/catalog-admin.controller.ts`,
   ligne 37). STORY-105 a migré `auth-service`, `kyc-service` et les **entitlements** du catalogue,
   mais a laissé cette surface derrière. Conséquence : on ne peut **pas** déléguer la tenue du
   catalogue sans donner les pleins pouvoirs.

**La règle d'or borne le périmètre, et c'est voulu.** « Une permission n'existe que si un guard la
vérifie. » Un Comptable, un Marketing ou un DG *feraient* des choses dans une console qui n'existe
pas encore : il n'y a aujourd'hui **aucune surface** de comptabilité, de campagne ou de reporting
dans l'admin-panel. Inventer `finance:read`, `campaign:manage` ou `reporting:read` produirait des
promesses creuses — des cases à cocher qui ne protègent rien. **Cette story n'ajoute donc que les
permissions qui ont un consommateur au moment de la livraison**, et compose les trois rôles métier
à partir du catalogue réel.

---

## Périmètre

**Inclus :**

### `auth-service`
- **4 permissions ajoutées** à `common/rbac/permission.enum.ts` :
  | Code | Consommateur (guard) |
  |---|---|
  | `catalog:read` | `catalog-read.controller.ts` (migration, ce ticket) |
  | `catalog:manage` | `catalog-admin.controller.ts` (migration, ce ticket) |
  | `project:read` | `projects.controller.ts` — **STORY-141** |
  | `project:manage` | `projects.controller.ts` — **STORY-141** |
- **Libellés** dans `modules/rbac/permission-catalog.ts` (`PERMISSION_DESCRIPTIONS`). ⚠️ Le type est
  `Record<Permission, string>` : oublier un libellé **casse la compilation**, c'est le garde-fou.
- **3 rôles système seedés** (`isSystem: true`, non supprimables) dans `modules/rbac/system-roles.ts` :
  | Rôle | Permissions | Justification |
  |---|---|---|
  | `PLATFORM_ACCOUNTANT` | `org:read`, `catalog:read`, `project:read` | Le comptable **lit** le parc et l'offre ; il ne modifie ni l'un ni l'autre. |
  | `PLATFORM_MARKETING` | `org:read`, `catalog:read`, `project:read` | Même lecture. Se distingue par ce qu'on lui ouvrira ensuite, pas aujourd'hui. |
  | `PLATFORM_EXECUTIVE` | `org:read`, `catalog:read`, `project:read`, `entitlement:grant`, `entitlement:revoke` | Le DG arbitre l'activation commerciale d'un module chez un client. |
- **Duplication K4** : `permission.enum.ts` est recopié **à l'octet près** dans `kyc-service` et
  `platform-catalog-service`. Les 3 copies doivent rester identiques — `diff -q` est le détecteur de
  divergence, il ne vaut que si elles ne divergent pas. Les **libellés restent hors** du fichier
  dupliqué (ils n'appartiennent qu'à l'IdP).

### `platform-catalog-service`
- Recopier `permission.enum.ts` (les 12 codes).
- **Migrer `catalog-admin.controller.ts`** : `@Roles(Role.PLATFORM_ADMIN)` → `@RequirePermissions(Permission.CATALOG_MANAGE)`.
- **Migrer `catalog-read.controller.ts`** : `@Roles(PLATFORM_ADMIN, TENANT_ADMIN)` → `@RequirePermissions(Permission.CATALOG_READ)` **pour la voie plateforme**, en **conservant** l'accès `TENANT_ADMIN` par `@Roles` (les rôles tenant ne portent aucune permission — borne D15). Voie mixte : documenter le choix dans le contrôleur.

**Hors périmètre :**
- Toute permission sans consommateur : `finance:*`, `campaign:*`, `reporting:*` → **refusées**, elles
  reviendront avec l'écran qui les justifie.
- L'UI de gestion des rôles → **AP-08** (déjà couverte, ne pas redonder).
- Les rôles TENANT (`TENANT_ADMIN`, `TENANT_USER`) : ils restent gouvernés par l'enum `Role`.

---

## Critères d'acceptation

- [ ] Le catalogue expose **12** permissions ; `GET /admin/permissions` renvoie 12 entrées `{value, description}` **toutes** avec un libellé français.
- [ ] Les 3 copies de `permission.enum.ts` (auth, kyc, platform-catalog) sont **identiques** — vérifié par `diff -q` en CI ou à la main, tracé dans la PR.
- [ ] `catalog/admin` (POST/PATCH modules, versions, référentiels) refuse un acteur sans `catalog:manage` → **403**, et l'accepte avec.
- [ ] `catalog` (lecture) reste accessible à un `TENANT_ADMIN` **et** à un porteur de `catalog:read`.
- [ ] Les 3 rôles métier sont seedés `isSystem: true`, apparaissent dans `GET /admin/roles`, et leur suppression est refusée.
- [ ] **Invariant « on n'accorde que ce qu'on détient »** (`assertCanGrant`) : un acteur `{role:manage, org:read}` ne peut pas composer un rôle contenant `catalog:manage` → refus.
- [ ] **Aucune permission orpheline** : pour chacune des 4 ajoutées, un test nomme le guard qui la vérifie. `project:read`/`project:manage` **ne rentrent au catalogue que si STORY-141 est livrée dans la même release** — sinon les retirer de ce ticket (cf. §Risque).
- [ ] Le seed est **idempotent** (rejouable sans écraser les rôles non-système existants).
- [ ] Vérification docker bout-en-bout : jeton `PLATFORM_ACCOUNTANT` → `GET /catalog/modules` **200**, `POST /catalog/admin/modules` **403**.

---

## Risque à arbitrer avant de commencer

**`project:read` / `project:manage` n'ont de consommateur que si STORY-141 sort avec.** Deux options,
à trancher au lancement :

- **(a) Livrer 140 et 141 dans la même release** — les 4 permissions entrent ensemble, la règle d'or
  est tenue.
- **(b) Livrer 140 seule** — alors elle ne porte que `catalog:read` / `catalog:manage` (2 permissions,
  3 points), et `project:*` part dans STORY-141.

**Recommandation : (b).** Elle découple les deux livraisons, garde 140 petite et vérifiable, et
laisse chaque permission naître avec son guard dans le même commit. Le seed des 3 rôles métier se
fait alors sans `project:read` et sera complété par 141.

---

## Notes techniques

| Élément | Fichier | Nature |
|---|---|---|
| Enum | `auth/src/common/rbac/permission.enum.ts` (+ 2 copies K4) | Modifié |
| Libellés | `auth/src/modules/rbac/permission-catalog.ts` | Modifié |
| Seed | `auth/src/modules/rbac/system-roles.ts` + `platform-roles-seed.service.ts` | Modifié |
| Gardes catalogue | `catalog/src/modules/catalog/controllers/catalog-{admin,read}.controller.ts` | Modifié |

**Vigilance :**
- **Ne pas créer de paquet partagé `@prospera/rbac`** : ce serait la première dépendance partagée de
  l'écosystème et cela romprait K4 (décision STORY-103, documentée dans le fichier lui-même).
- **TTL access = 15 min** : un rôle modifié met jusqu'à 15 min à se propager aux sessions ouvertes.
- **Anti-lockout** : `assertNotLastPlatformAdmin` reste actif ; les nouveaux rôles n'y touchent pas.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [ ] `lint` / `typecheck` / `test` / `build` verts sur les **2** dépôts.
- [ ] `diff -q` des 3 copies de l'enum : identiques.
- [ ] Vérification docker bout-en-bout tracée dans la story.
- [ ] 2 branches `MNV-140`, 2 PR vers `dev`.
