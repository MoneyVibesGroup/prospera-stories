# STORY-140 : Extension du catalogue de permissions (`catalog:*`) + migration de `catalog/admin` vers `@RequirePermissions` + seed des rôles métier Comptable / Marketing / DG

**Epic :** EPIC-025 — RBAC plateforme (D15)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Données / §Modèle de jetons · `architecture-catalog-service-2026-07-07.md` · **STORY-103** (catalogue figé + règle d'or + `assertCanGrant`) · **STORY-104** (CRUD rôles + libellés) · **STORY-105** (migration des amont, précédent multi-repo)
**Priorité :** Must Have
**Story Points :** 3 *(5 → 3 : arbitrage (b) retenu au lancement, cf. §Risque — `project:*` part dans STORY-141)*
**Complexité :** medium
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-28
**Sprint :** 18
**Services :** `auth-service` (:3001) · `platform-catalog-service` (:3003) · `kyc-service` (:3002, **recopie K4 seule**) — ⚠️ story **multi-repo** (exception assumée à « 1 story = 1 service », précédent : STORY-105) → **3 branches + 3 PR**
**Branches :** `MNV-140` × 3 dépôts

> **Arbitrages pris au lancement (2026-07-29), avant toute ligne de code :**
>
> 1. **§Risque tranché en (b).** STORY-141 est `not_started` : `project:read` / `project:manage`
>    n'auraient aucun guard à la livraison. Ils sont **retirés de ce ticket** et naîtront dans
>    STORY-141 avec `projects.controller.ts`, dans le même commit. Le catalogue passe donc de **8 à
>    10** permissions (et non 12), et les 3 rôles métier sont seedés **sans** `project:read`.
> 2. **3 dépôts, pas 2.** Le critère « les 3 copies de `permission.enum.ts` sont identiques » **impose**
>    de toucher `kyc-service` : laisser sa copie à 8 codes ferait diverger le contrat dupliqué dès le
>    merge, et le `diff -q` — seul détecteur K4 — deviendrait rouge en permanence. La branche
>    `kyc-service` ne porte **que** la recopie de l'enum et de son verrou de non-divergence : aucun
>    guard, aucun comportement modifié dans ce service.

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
- **2 permissions ajoutées** à `common/rbac/permission.enum.ts` :
  | Code | Consommateur (guard) |
  |---|---|
  | `catalog:read` | `catalog-read.controller.ts` (migration, ce ticket) |
  | `catalog:manage` | `catalog-admin.controller.ts` (migration, ce ticket) |
- **Libellés** dans `modules/rbac/permission-catalog.ts` (`PERMISSION_DESCRIPTIONS`). ⚠️ Le type est
  `Record<Permission, string>` : oublier un libellé **casse la compilation**, c'est le garde-fou.
- **3 rôles système seedés** (`isSystem: true`, non supprimables) dans `modules/rbac/system-roles.ts` :
  | Rôle | Permissions | Justification |
  |---|---|---|
  | `PLATFORM_ACCOUNTANT` | `org:read`, `catalog:read` | Le comptable **lit** le parc et l'offre ; il ne modifie ni l'un ni l'autre. |
  | `PLATFORM_MARKETING` | `org:read`, `catalog:read` | Même lecture. Se distingue par ce qu'on lui ouvrira ensuite, pas aujourd'hui. |
  | `PLATFORM_EXECUTIVE` | `org:read`, `catalog:read`, `entitlement:grant`, `entitlement:revoke` | Le DG arbitre l'activation commerciale d'un module chez un client. |
  *(`project:read` sera ajouté aux 3 par STORY-141, dans le commit qui livre son guard.)*
- **Duplication K4** : `permission.enum.ts` est recopié **à l'octet près** dans `kyc-service` et
  `platform-catalog-service`. Les 3 copies doivent rester identiques — `diff -q` est le détecteur de
  divergence, il ne vaut que si elles ne divergent pas. Les **libellés restent hors** du fichier
  dupliqué (ils n'appartiennent qu'à l'IdP).

### `kyc-service`
- **Recopie seule** de `permission.enum.ts` (les 10 codes) + mise à jour de son verrou de
  non-divergence `permission.enum.spec.ts`. Aucun guard, aucun comportement modifié.

### `platform-catalog-service`
- Recopier `permission.enum.ts` (les 10 codes) + verrou de non-divergence.
- **Migrer `catalog-admin.controller.ts`** : `@Roles(Role.PLATFORM_ADMIN)` → `@RequirePermissions(Permission.CATALOG_MANAGE)`.
- **Migrer `catalog-read.controller.ts`** — **voie mixte**, à concevoir : `TENANT_ADMIN` (par rôle,
  car les rôles tenant ne portent aucune permission — borne D15) **OU** porteur de `catalog:read`
  (voie plateforme).
  ⚠️ **Empiler `@Roles(TENANT_ADMIN)` et `@RequirePermissions(CATALOG_READ)` produirait un ET, pas un
  OU** : les `APP_GUARD` sont chaînés, `RolesGuard` rejetterait le porteur plateforme avant même que
  `PermissionsGuard` ne s'exécute. `permissions.decorator.ts` interdit d'ailleurs explicitement les
  « deux guards qui négocient » (l'autorisation dépendrait de l'ordre d'enregistrement).
  → **Un décorateur unique `@RequireAnyOf({ roles, permissions })`** portant sa propre clé de
  métadonnée et son guard `AnyOfAccessGuard`, qui exprime le OU **en un seul point de décision**.
  `RolesGuard` et `PermissionsGuard` ne voient pas cette clé et laissent passer : aucune sémantique
  existante n'est modifiée.

**Hors périmètre :**
- Toute permission sans consommateur : `project:*` (→ STORY-141), `finance:*`, `campaign:*`,
  `reporting:*` → **refusées**, elles reviendront avec l'écran qui les justifie.
- L'UI de gestion des rôles → **AP-08** (déjà couverte, ne pas redonder).
- Les rôles TENANT (`TENANT_ADMIN`, `TENANT_USER`) : ils restent gouvernés par l'enum `Role`.
- Aucun guard nouveau dans `kyc-service` : sa branche est une recopie de contrat.

---

## Critères d'acceptation

- [ ] Le catalogue expose **10** permissions ; `GET /admin/permissions` renvoie 10 entrées `{value, description}` **toutes** avec un libellé français.
- [ ] Les 3 copies de `permission.enum.ts` (auth, kyc, platform-catalog) sont **identiques** — vérifié par `diff -q` en CI ou à la main, tracé dans la PR.
- [ ] `catalog/admin` (POST/PATCH modules, versions, référentiels) refuse un acteur sans `catalog:manage` → **403**, et l'accepte avec.
- [ ] `catalog` (lecture) reste accessible à un `TENANT_ADMIN` **et** à un porteur de `catalog:read` ; un acteur qui n'a **ni l'un ni l'autre** → **403**.
- [ ] Les 3 rôles métier sont seedés `isSystem: true`, apparaissent dans `GET /admin/roles`, et leur suppression est refusée.
- [ ] **Invariant « on n'accorde que ce qu'on détient »** (`assertCanGrant`) : un acteur `{role:manage, org:read}` ne peut pas composer un rôle contenant `catalog:manage` → refus.
- [ ] **Aucune permission orpheline** : pour chacune des 2 ajoutées, un test nomme le guard qui la vérifie. `project:read`/`project:manage` sont **exclues** de ce ticket (arbitrage (b), cf. §Risque).
- [ ] Le seed est **idempotent** (rejouable sans écraser les rôles non-système existants).
- [ ] **Mutation-test** de la voie mixte : retirer le `AnyOfAccessGuard` de la chaîne `APP_GUARD` doit faire **virer au rouge** le test qui refuse l'acteur sans rôle ni permission — sinon le test ne filtre rien.
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

✅ **Tranché le 2026-07-29 : (b).** STORY-141 est `not_started` — la livrer « dans la même release »
n'était pas une option réelle. La story passe à **3 points** et à **2 permissions**.

---

## Notes techniques

| Élément | Fichier | Nature |
|---|---|---|
| Enum | `auth/src/common/rbac/permission.enum.ts` (+ 2 copies K4) | Modifié |
| Libellés | `auth/src/modules/rbac/permission-catalog.ts` | Modifié |
| Seed | `auth/src/modules/rbac/system-roles.ts` (`platform-roles-seed.service.ts` inchangé : il itère `SYSTEM_ROLES`) | Modifié |
| Voie mixte | `catalog/src/common/decorators/require-any-of.decorator.ts` + `catalog/src/common/guards/any-of-access.guard.ts` | **Créé** |
| Gardes catalogue | `catalog/src/modules/catalog/controllers/catalog-{admin,read}.controller.ts` | Modifié |

**Vigilance :**
- **Ne pas créer de paquet partagé `@prospera/rbac`** : ce serait la première dépendance partagée de
  l'écosystème et cela romprait K4 (décision STORY-103, documentée dans le fichier lui-même).
- **TTL access = 15 min** : un rôle modifié met jusqu'à 15 min à se propager aux sessions ouvertes.
- **Anti-lockout** : `assertNotLastPlatformAdmin` reste actif ; les nouveaux rôles n'y touchent pas.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [ ] `lint` / `typecheck` / `test` / `build` verts sur les **3** dépôts.
- [ ] `diff -q` des 3 copies de l'enum : identiques.
- [ ] Vérification docker bout-en-bout tracée dans la story.
- [ ] 3 branches `MNV-140`, 3 PR vers `dev`.

---

## Progress Tracking

| Phase | État |
|---|---|
| ① Story ajustée (arbitrage (b), 3 dépôts, conception voie mixte) | ✅ |
| ③ Développement (3 dépôts) | ✅ |
| ④ Portes DoD + mutation-tests + vérif docker | ✅ |
| ⑥ Revue de code | ⏳ |
| ⑦ Revue de sécurité | ⏳ |
| ⑧ Rebase-merge | ⏳ |

### ④ Portes DoD (2026-07-29)

| Dépôt | Lint | Build | Couverture (L/F/B) | Unit | e2e |
|---|---|---|---|---|---|
| `auth-service` | 0 warning | ✅ | 96,93 / 97,80 / 89,72 | 611 ✅ | 153 ✅ |
| `platform-catalog-service` | 0 warning | ✅ | 99,86 / 100 / 93,47 | 232 ✅ | 59 ✅ |
| `kyc-service` | 0 warning | ✅ | 95,37 / 94,08 / 89,89 | 70 ✅ | ✅ |

`AnyOfAccessGuard` : **100 % lignes / branches / fonctions**.
`diff -q` des 3 copies de `permission.enum.ts` : **identiques** (vérifié après recopie).

### ④ Mutation-tests — la preuve que les tests filtrent

| # | Mutation appliquée | Résultat | Ce que ça prouve |
|---|---|---|---|
| M0 | `AnyOfAccessGuard` **absent** de la chaîne `APP_GUARD` des e2e | 🔴 « TENANT_USER sur la lecture du catalogue → 403 » reçoit **200** | Sans ce maillon la lecture n'est gardée par **personne** — constaté pour de vrai avant correction, pas simulé |
| M1 | `catalog/admin` gardé par la **mauvaise** permission (`org:read`) | 🔴 3 e2e | Le contrôleur exige bien `catalog:manage`, pas « une permission quelconque » |
| M2 | Guard **fail-open** sur une règle `@RequireAnyOf` vide | 🔴 2 unitaires | Une faute de frappe dans le décorateur ne peut pas ouvrir la route en silence |
| M3 | `PLATFORM_ACCOUNTANT` reçoit `catalog:manage` au lieu de `catalog:read` | 🔴 1 unitaire | Le sur-privilège d'un rôle métier est détecté |

### ④ Vérification docker — stack neuve (`down -v`), auth-service + platform-catalog-service

**Preuve 1 — le seed a réellement écrit (`mongosh auth_service`, collection `roles`) :** 7 rôles,
tous `isSystem: true`.

```
PLATFORM_ACCOUNTANT  ["org:read","catalog:read"]
PLATFORM_MARKETING   ["org:read","catalog:read"]
PLATFORM_EXECUTIVE   ["org:read","catalog:read","entitlement:grant","entitlement:revoke"]
PLATFORM_ADMIN       les 10 permissions (catalogue entier, par construction)
```

**Preuve 2 — le catalogue sort de l'IdP.** `GET /admin/permissions` → **10** entrées, chacune avec son
libellé français, `catalog:read` et `catalog:manage` incluses, **aucune** `project:*`.

**Preuve 3 — immuabilité.** `DELETE /admin/roles/PLATFORM_EXECUTIVE` → **403**
« Ce rôle système ne peut être ni modifié ni supprimé. » · `PATCH /admin/roles/PLATFORM_ACCOUNTANT`
(tentative d'ajout de `catalog:manage`) → **403**.

**Preuve 4 — idempotence non destructive.** Rôle non-système `RESPONSABLE_CATALOGUE` créé via l'API,
puis **2 redémarrages** du conteneur : total `8` rôles dont `1` non-système, à l'identique. Le seed
réaligne les rôles système sans jamais toucher aux rôles composés par les administrateurs.

**Preuve 5 — le critère d'acceptation, sur un jeton `PLATFORM_ACCOUNTANT` réel** (obtenu par login ;
claims vérifiés : `roles: ["PLATFORM_ACCOUNTANT"]`, `perms: ["org:read","catalog:read"]`, `org: null`) :

| Requête | Attendu | Obtenu |
|---|---|---|
| `GET /api/v1/catalog/modules` | 200 | **200** |
| `GET /api/v1/catalog/referentiels` | 200 | **200** |
| `POST /api/v1/catalog/admin/modules` | 403 | **403** — « Accès refusé : permission insuffisante. » |
| `GET /api/v1/catalog/admin/modules` | 403 | **403** |

**Preuve 6 — la délégation, qui est LE point de la story.** Un porteur du rôle **non-système**
`RESPONSABLE_CATALOGUE` (`perms: ["catalog:read","catalog:manage"]`, **pas** `PLATFORM_ADMIN`) crée un
module : `POST /catalog/admin/modules` → **201**. C'était impossible avant.

**Preuve 7 — les deux branches du OU, contre le service réel :**

| Porteur | `roles` / `perms` du jeton | `GET /catalog/modules` | `POST /catalog/admin/modules` |
|---|---|---|---|
| `TENANT_ADMIN` | `["TENANT_ADMIN"]` / `[]` | **200** (voie *rôle*) | **403** |
| `PLATFORM_ACCOUNTANT` | `["PLATFORM_ACCOUNTANT"]` / `["org:read","catalog:read"]` | **200** (voie *permission*) | **403** |
| `TENANT_USER` | `["TENANT_USER"]` / `[]` | **403** — « Accès refusé. » | — |
| aucun jeton | — | **401** | — |

La 3ᵉ ligne est celle qui compte : le OU refuse bien qui n'a **ni** l'un **ni** l'autre, et le message
n'énumère ni le rôle ni la permission manquante (anti-énumération).

**Preuve 8 — non-régression `PLATFORM_ADMIN`** : `GET /catalog/modules` → **200**,
`POST /catalog/admin/modules` → **201**. Il passe désormais par `catalog:read`/`catalog:manage`, que
son rôle système détient — aucune surface perdue.
