# STORY-105 : Migration des amont vers `@RequirePermissions` (auth-service + kyc-service + platform-catalog-service), compat `roles[]` conservée

**Epic :** EPIC-025 — RBAC plateforme (D15)
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` (K4 = contrats dupliqués, jetons RS256/JWKS auto-porteurs) · `architecture-auth-service-2026-07-04.md` §Modèle de jetons · `sprint-status.yaml` §D15 (2026-07-16) · **STORY-103** (socle livré)
**Priorité :** Must Have
**Story Points :** 8 *(révisé de 5 — cf. §Écart de périmètre)*
**Statut :** done ✅ (implémentée + vérifiée docker + revue + intégrée dans `dev` le 2026-07-16)
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-16
**Sprint :** 10
**Services :** `auth-service` (:3001) · `kyc-service` (:3002) · `platform-catalog-service` (:3003)
**Branches :** `MNV-105` **× 3 dépôts** — ⚠️ story **multi-repo** (exception assumée à « 1 story = 1 service ») → **3 branches + 3 PR**

> **⚡ NON-OPTIONNELLE — c'est ICI qu'est le vrai coût, pas dans le panel.** STORY-103 a livré `perms[]` dans le jeton et 4 rôles système en base. La vérif docker §6b de 103 l'a démontré noir sur blanc : **un `PLATFORM_KYC_OFFICER` porte `kyc:approve` dans son jeton ET se prend quand même un 403** de `kyc-service` et de `platform-catalog-service`, qui vérifient `@Roles(PLATFORM_ADMIN)` **en dur**. `admin-panel` ne fait que **relayer le bearer** de l'utilisateur : les amont **revérifient**. **Sans cette story, les rôles créés en 103/104 ne servent À RIEN** et la granularité de 106 est **cosmétique**.

---

## User Story

En tant qu'**opérateur plateforme PROSPERA** (agent KYC, support, auditeur),
je veux que les services amont **honorent les permissions de mon jeton** au lieu d'exiger `PLATFORM_ADMIN` en dur,
afin de **faire mon travail** (approuver un KYC, consulter une organisation) **sans détenir les pleins pouvoirs**.

---

## Description

### Contexte

STORY-103 a posé la ligne de partage (**permission = code figé** / **rôle = donnée en base**) et rendu le jeton **auto-porteur** : `roles[]` **et** `perms[]`, strictement additif. Aucun service n'a été cassé — parce qu'**aucun service n'a changé**. C'est précisément le problème : les amont continuent de lire `roles[]` et d'exiger `PLATFORM_ADMIN`.

**L'état actuel, précisément** (relevé dans le code le 2026-07-16) :

| Service | Vérification en dur | Effet pour un `PLATFORM_KYC_OFFICER` |
|---|---|---|
| `auth-service` | [admin-organizations.controller.ts:35](auth-service/src/modules/admin/admin-organizations.controller.ts#L35) — `@Roles(PLATFORM_ADMIN)` (classe) | **403** sur list / detail / suspend |
| `kyc-service` | [kyc-admin.controller.ts:41](kyc-service/src/modules/kyc/kyc-admin.controller.ts#L41) — `@Roles(PLATFORM_ADMIN)` (classe) | **403** sur la file, le détail, approve, reject |
| `platform-catalog-service` | [entitlements.controller.ts:52/88](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L52) — `@Roles(PLATFORM_ADMIN)` | **403** sur grant / revoke *(attendu — il n'a pas la permission)* |

### 🔴 Deux découvertes de la rédaction (2026-07-16) — elles changent le périmètre

#### 1. `org:read` est **inerte** et `org:suspend` n'a **aucun consommateur** — l'epic avait un trou

`admin-panel` agrège l'org detail par **fan-out avec le bearer de l'appelant** ([org-aggregation.service.ts:103-113](admin-panel/src/admin/orgs/org-aggregation.service.ts#L103-L113)) — et **`auth-service` est la source PRIMAIRE, non dégradable** :

```typescript
// admin-panel/src/admin/orgs/org-aggregation.service.ts:110-119
const [identityResult, kycResult, entitlementsResult] = await Promise.allSettled([
  this.auth.getOrganization(orgId, bearer),      // ← PRIMAIRE
  this.kyc.getKycDetail(orgId, bearer),
  this.catalog.listEntitlements(orgId, bearer),
]);
// Identité = dépendance dure : 404 → 404 (anti-énumération), sinon 503.
if (identityResult.status === 'rejected') throw this.mapPrimaryError(identityResult.reason, orgId);
```

Un `PLATFORM_SUPPORT` (`org:read`) passerait le guard du panel (106) → le panel appellerait `auth-service` avec **son** bearer → `@Roles(PLATFORM_ADMIN)` → **403** → `mapPrimaryError` (403 ≠ 404) → **`503` sur une stack parfaitement saine**. **`org:read` ne vaut rien** tant que `auth-service` n'est pas migré.

Pire : **`POST /admin/organizations/:id/suspend`** ([admin-organizations.controller.ts:79](auth-service/src/modules/admin/admin-organizations.controller.ts#L79)) est le **seul consommateur possible** de `org:suspend` dans tout l'écosystème (`admin-panel` n'expose **aucune** route de suspension — ses actions 048 = kyc approve/reject + entitlement grant/revoke). Cadrée à 2 dépôts, la 105 laissait **`org:suspend` décorative** — ce qui **rompt la règle d'or de 103** (« *une permission n'entre au catalogue que si un guard la vérifie* ») et contredit son affirmation « *les 8 permissions sont toutes consommées par 105/106* ».

> **→ Décision (2026-07-16, arbitrée) : `auth-service/admin-organizations.controller.ts` est INCLUS dans 105.** La story devient **3 dépôts, 8 points**. C'est la lecture honnête de « **les amont** » : `auth-service` **est** un amont d'`admin-panel`. Le mettre en 104 (qui vient **après** dans l'ordre imposé) clôturerait 105 en laissant `org:read` en 503. Coût marginal réel : `auth-service` **possède déjà** le catalogue (103) → **aucune duplication à y faire**, seulement le guard + le décorateur + 3 routes.

#### 2. Un 403 amont est présenté comme une **panne** — piège pour 106

[upstream-error.ts:42-46](admin-panel/src/upstream/upstream-error.ts#L42-L46) : `classifyUpstreamError` mappe **404 → `absent`, TOUT le reste → `unavailable`**. Un 403 (refus d'autorisation) devient donc `sources.kyc = 'unavailable'` — **« le KYC est momentanément indisponible »**, un mensonge sur une stack saine.

**Conséquence directe sur le mapping de 105** : toute règle plus stricte qu'`org:read` sur la **lecture** KYC condamnerait un `PLATFORM_SUPPORT` à une **fausse panne permanente** sur son org detail. C'est l'argument décisif du mapping ci-dessous.

> **Hook inerte pour STORY-106** (⚠️ **hors périmètre 105** — `admin-panel` n'est pas touché ici) : `SourceStatus` doit gagner un état **`forbidden`** distinct d'`unavailable`, sinon le moindre privilège est **indiscernable d'une panne**. À traiter en 106, où le panel est ouvert.

### Périmètre

**Inclus — les 3 dépôts :**

- **Catalogue de permissions DUPLIQUÉ** (K4) dans `kyc-service` et `platform-catalog-service` : copie **conforme** de [permission.enum.ts](auth-service/src/common/rbac/permission.enum.ts) (les 8, `PERMISSION_CATALOG`). **`auth-service` l'a déjà** (103).
- **`PermissionsGuard` + `@RequirePermissions(...)`** dans **les 3** services, enregistré **après** `RolesGuard` dans la chaîne globale.
- **`JwtStrategy` : `role` (singulier) → `roles[]` + `perms[]`** dans `kyc-service` et `platform-catalog-service` — **le même fix qu'en 103**, avec sa suite : `RolesGuard` **multi-rôles**.
- **Shim de compatibilité pré-103**, **dans la `JwtStrategy` uniquement** (un seul endroit, cf. §Shim) — **y compris dans `auth-service`**, dont le [jwt.strategy.ts:96](auth-service/src/modules/auth/strategies/jwt.strategy.ts#L96) fait `payload.perms ?? []` et **efface la distinction absent/vide** dont dépend la compat.
- **Migration des 3 contrôleurs** selon la table de mapping (§Mapping).
- **`assertCanReadOrg`** ([entitlements.controller.ts:142-151](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L142-L151)) : `user.role === PLATFORM_ADMIN` → **`perms.includes(org:read)`** — sinon le guard passe et **le corps refuse** (cf. §Piège 2).

**Hors périmètre :**

- **`admin-panel`** → **STORY-106** (guards par permission + proxy + `SourceStatus: 'forbidden'`). **Aucun fichier d'`admin-panel` n'est touché ici.**
- **CRUD des rôles + invitation plateforme** → **STORY-104**.
- **`catalog-admin.controller`** ([:37](platform-catalog-service/src/modules/catalog/controllers/catalog-admin.controller.ts#L37)) → **RESTE `@Roles(PLATFORM_ADMIN)`** (cf. §Ce qui ne migre PAS).
- **`catalog-read.controller`** ([:27](platform-catalog-service/src/modules/catalog/controllers/catalog-read.controller.ts#L27)) → **RESTE `@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`** (cf. §Ce qui ne migre PAS). ⚠️ **Correction explicite** : `sprint-status.yaml` listait ces deux contrôleurs comme cibles de migration — **la rédaction les en retire**, avec justification.
- **Rôles TENANT** (`TENANT_ADMIN` / `TENANT_USER`) : **PAS TOUCHÉS** — `perms: []` par construction (103). `kyc.controller` ([:46/:55](kyc-service/src/modules/kyc/kyc.controller.ts#L46)) **inchangé**. Périmètre **strictement plateforme**, pour **borner le rayon d'explosion**.
- **Paquet partagé `@prospera/rbac`** : **refusé** (103 §K4) — le catalogue est **recopié**.
- **`document-service` / `expert-comptable` / `bilan-service`** : aucune route plateforme → rien à migrer.

### Flux

1. Un opérateur (`platformRole: 'PLATFORM_KYC_OFFICER'`) **se connecte** → l'IdP résout ses permissions via la collection `roles` → jeton RS256 portant `roles: ['PLATFORM_KYC_OFFICER']` **et** `perms: ['kyc:approve','kyc:reject','org:read']` (103).
2. Il appelle `admin-panel`, qui **relaie son bearer** vers les amont (106 — pas ici).
3. Chaque amont **valide le jeton localement** (RS256/JWKS, aucun appel à l'IdP sur le chemin chaud — K4) et **projette** `roles[]` + `perms[]` sur `request.user`.
4. `PermissionsGuard` lit `@RequirePermissions(...)` et **autorise si le porteur détient l'une** des permissions requises → sinon **403**.
5. `GET /admin/kyc/:orgId` → `org:read` → **200**. `POST /admin/kyc/:orgId/approve` → `kyc:approve` → **200**. `PUT /catalog/entitlements/...` → `entitlement:grant` → **403** : *il ne l'a pas*. **C'est la délégation qui fonctionne.**

---

## Acceptance Criteria

- [ ] **Catalogue dupliqué à l'identique** dans `kyc-service` et `platform-catalog-service` (`src/common/rbac/permission.enum.ts`) : **les 8 permissions, ni plus ni moins**, `PERMISSION_CATALOG` figé. Un **test par service** verrouille la liste exacte (une divergence future **échoue au test**, elle ne dérive pas en silence).
- [ ] **`@RequirePermissions(...)` + `PermissionsGuard`** livrés dans **les 3** services, guard **global**, enregistré **après** `RolesGuard` ([app.module.ts:94](kyc-service/src/app.module.ts#L94) et équivalents).
- [ ] **Sémantique = OU** (l'**une quelconque** des permissions requises suffit) — **cohérente avec `@Roles`**, testée explicitement.
- [ ] **Sans `@RequirePermissions`, le guard laisse passer** (l'authentification suffit) — comportement identique à `RolesGuard`, testé.
- [ ] **`JwtStrategy` projette `roles[]` + `perms[]`** dans `kyc-service` et `platform-catalog-service` ; **`ROLE_PRECEDENCE` et le repli `TENANT_USER` sont SUPPRIMÉS** (cf. §Piège 1). `AuthenticatedUser` = `{ userId, tenantId, roles: string[], perms: string[], emailVerified }` — **même forme que 103**.
- [ ] **`RolesGuard` multi-rôles** dans les 2 services : autorise si **l'un quelconque** des rôles du porteur figure dans `@Roles(...)` ([roles.guard.ts:33](kyc-service/src/common/guards/roles.guard.ts#L33)).
- [ ] **Shim de compat pré-103, dans la `JwtStrategy` SEULE** : claim `perms` **absent** + `roles` contient `PLATFORM_ADMIN` → `perms` = **le catalogue entier** ; claim **absent** sans `PLATFORM_ADMIN` → `perms: []` ; claim **présent** (même `[]`) → **respecté tel quel, aucun repli**. Testé sur les 3 cas.
- [ ] **⚠️ `auth-service` : `payload.perms ?? []` CORRIGÉ** ([jwt.strategy.ts:96](auth-service/src/modules/auth/strategies/jwt.strategy.ts#L96)) — en l'état il écrase `undefined` en `[]` et **rendrait le shim inopérant** : un `PLATFORM_ADMIN` pré-103 prendrait **403** sur `/admin/organizations` pendant la fenêtre de déploiement.
- [ ] **Mapping route → permission appliqué exactement** comme la table §Mapping (11 routes migrées, 3 services).
- [ ] **`assertCanReadOrg` migré** : `perms.includes(org:read)` → accès inter-org ; sinon **`roles` doit contenir `TENANT_ADMIN`** (⚠️ **exclut `TENANT_USER` comme aujourd'hui**) **et** `tenantId === :orgId`. **Aucun élargissement** vs le comportement actuel.
- [ ] **`catalog-admin` et `catalog-read` INCHANGÉS** — un test de non-régression le prouve (`PLATFORM_ADMIN` → 200 ; `TENANT_ADMIN` → catalog-read 200 / catalog-admin 403).
- [ ] **Non-régression `PLATFORM_ADMIN`** : détenant les 8 permissions, il conserve **exactement** ses accès actuels sur **toutes** les routes des 3 services. *(C'est l'AC le plus important : `PLATFORM_ADMIN` est le seul rôle plateforme réellement utilisé aujourd'hui.)*
- [ ] **Non-régression TENANT** : `perms: []` → `kyc.controller` (submit/status), `catalog-read`, `entitlements GET` sur **sa propre** org → **inchangés** ; org d'autrui → **403** ; routes plateforme → **403**.
- [ ] **`PLATFORM_KYC_OFFICER`** : file KYC **200**, détail **200**, approve **200**, reject **200**, `auth` orgs list/detail **200** — **et** `PUT/DELETE` entitlement **403**, `suspend` **403**.
- [ ] **`PLATFORM_SUPPORT` / `PLATFORM_AUDITOR`** (`org:read`) : `auth` orgs list/detail **200**, file/détail KYC **200** — **et** approve **403**, reject **403**, grant/revoke **403**, suspend **403**.
- [ ] **e2e mintant des jetons AVEC `perms[]`** dans les 3 services. ⚠️ Les e2e existants mintent leurs RS256 **localement** et n'assertent que `roles[PLATFORM_ADMIN]` (cf. STORY-049) → **ils passeraient par le shim** et **le chemin neuf resterait non testé** au niveau HTTP. Au moins **un e2e par service** doit porter un jeton **`PLATFORM_KYC_OFFICER` avec `perms[]`**.
- [ ] **Couverture ≥ seuils** (65 branches / 90 fonctions / 90 lignes / 90 statements) **sur les 3 services**, **jamais baissés** · **lint 0 warning** (`--max-warnings 0`, binaire **local**) · **build OK** · **CI verte ×3**.
- [ ] **VÉRIF DOCKER** §1-8 (cf. §Vérification docker attendue) — **obligatoire avant clôture**, `mongosh` + `curl` réels.

---

## Technical Notes

### Mapping route → permission (la table qui fait foi)

| Service | Route | Aujourd'hui | **Après 105** |
|---|---|---|---|
| `auth-service` | `GET /admin/organizations` ([:42](auth-service/src/modules/admin/admin-organizations.controller.ts#L42)) | `@Roles(PLATFORM_ADMIN)` (classe) | **`@RequirePermissions(ORG_READ)`** |
| `auth-service` | `GET /admin/organizations/:id` ([:64](auth-service/src/modules/admin/admin-organizations.controller.ts#L64)) | idem | **`@RequirePermissions(ORG_READ)`** |
| `auth-service` | `POST /admin/organizations/:id/suspend` ([:79](auth-service/src/modules/admin/admin-organizations.controller.ts#L79)) | idem | **`@RequirePermissions(ORG_SUSPEND)`** ⚡ *seul consommateur de `org:suspend`* |
| `kyc-service` | `GET /admin/kyc` ([:48](kyc-service/src/modules/kyc/kyc-admin.controller.ts#L48)) | `@Roles(PLATFORM_ADMIN)` (classe) | **`@RequirePermissions(ORG_READ)`** |
| `kyc-service` | `GET /admin/kyc/:orgId` ([:57](kyc-service/src/modules/kyc/kyc-admin.controller.ts#L57)) | idem | **`@RequirePermissions(ORG_READ)`** |
| `kyc-service` | `POST /admin/kyc/:orgId/approve` ([:67](kyc-service/src/modules/kyc/kyc-admin.controller.ts#L67)) | idem | **`@RequirePermissions(KYC_APPROVE)`** |
| `kyc-service` | `POST /admin/kyc/:orgId/reject` ([:80](kyc-service/src/modules/kyc/kyc-admin.controller.ts#L80)) | idem | **`@RequirePermissions(KYC_REJECT)`** |
| `catalog` | `PUT /catalog/entitlements/:orgId/:moduleCode` ([:51](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L51)) | `@Roles(PLATFORM_ADMIN)` | **`@RequirePermissions(ENTITLEMENT_GRANT)`** |
| `catalog` | `DELETE /catalog/entitlements/:orgId/:moduleCode` ([:87](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L87)) | `@Roles(PLATFORM_ADMIN)` | **`@RequirePermissions(ENTITLEMENT_REVOKE)`** |
| `catalog` | `GET /catalog/entitlements/:orgId` ([:101](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L101)) | `@Roles(PA, TA)` | **contextuel** → `assertCanReadOrg` (§Routes mixtes) |
| `catalog` | `GET /catalog/entitlements/:orgId/:moduleCode` ([:120](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L120)) | `@Roles(PA, TA)` | **contextuel** → `assertCanReadOrg` (§Routes mixtes) |
| `catalog` | `catalog-admin.controller` ([:37](platform-catalog-service/src/modules/catalog/controllers/catalog-admin.controller.ts#L37)) | `@Roles(PLATFORM_ADMIN)` | **INCHANGÉ** |
| `catalog` | `catalog-read.controller` ([:27](platform-catalog-service/src/modules/catalog/controllers/catalog-read.controller.ts#L27)) | `@Roles(PA, TA)` | **INCHANGÉ** |
| `kyc-service` | `kyc.controller` ([:46](kyc-service/src/modules/kyc/kyc.controller.ts#L46)/[:55](kyc-service/src/modules/kyc/kyc.controller.ts#L55)) | `@Roles(TENANT_*)` | **INCHANGÉ** |

**Permissions consommées par 105 : 5 / 8** — `org:read`, `org:suspend`, `kyc:approve`, `kyc:reject`, `entitlement:grant`, `entitlement:revoke` *(6 en réalité)*. Les **2 restantes** (`user:invite`, `role:manage`) sont consommées par **STORY-104**. **Aucune permission décorative** → la règle d'or de 103 est **tenue**.

#### Pourquoi la lecture KYC = `org:read` (et pas `kyc:approve|kyc:reject`)

**Arbitré le 2026-07-16.** Le catalogue est **figé** : il n'existe **pas** de `kyc:read`, et en ajouter une **romprait le gel de 103**.

- ✅ **Retenu — `org:read`** : l'org detail du panel est gaté `org:read` (106) et **fan-out vers le détail KYC avec le bearer de l'appelant**. Toute règle plus stricte → `sources.kyc = 'unavailable'` **en permanence** pour support/auditeur (cf. §Découverte 2) = **fausse panne**. De plus, le `PLATFORM_KYC_OFFICER` **détient `org:read`** précisément pour naviguer jusqu'au dossier.
- ❌ **Rejeté — `kyc:approve | kyc:reject`** : moindre privilège réel, mais sémantiquement bancal (une permission de **décision** qui autorise une **lecture**) et **fausse panne** garantie pour support/auditeur.
- ❌ **Rejeté — découpage file/détail** : le panel appelle **le détail** → la fausse panne revient par la fenêtre.

> **🔓 COÛT ASSUMÉ, À TRACER : `PLATFORM_SUPPORT` et `PLATFORM_AUDITOR` verront les URLs présignées des pièces d'identité** (le détail KYC les expose). Leurs `perms` sont **identiques** (`{org:read}`) : **impossible de les distinguer sans une nouvelle permission**. → **Suite proposée (hors 105, = modification du catalogue donc nouvelle story)** : introduire `kyc:read` **et** sortir les URLs présignées du détail vers une route dédiée `kyc:approve|kyc:reject`. **À arbitrer avant tout usage réel de `PLATFORM_SUPPORT` en production.**

### Le shim de compat — **un seul endroit**, la `JwtStrategy`

`sprint-status.yaml` impose : « *un jeton sans `perms[]` retombe sur `roles[]`* ». **La règle exacte est plus fine que « sans `perms[]` »** :

| Jeton | `payload.perms` | Interprétation | `perms` projetées |
|---|---|---|---|
| **pré-103** (≤ 15 min après déploiement) | **`undefined`** | l'IdP ne savait pas encore émettre le claim | `PLATFORM_ADMIN` ∈ `roles` → **catalogue entier** ; sinon **`[]`** |
| **post-103, opérateur** | `['kyc:approve', …]` | source de vérité | **tel quel** |
| **post-103, tenant** | **`[]`** | **il n'a réellement aucune permission** (103 : les rôles tenant → `perms: []`) | **`[]`** — ⚠️ **PAS un repli** |

> **⚠️ Le piège : `perms: []` n'est PAS `perms: undefined`.** Les rôles **tenant** ont `perms: []` **par construction et pour toujours** (103). Un repli déclenché sur « `perms` **vide** » serait donc **permanent**, pas transitoire : **105 ne migrerait jamais vraiment**. Le repli se déclenche **uniquement sur claim ABSENT**.

```typescript
// {kyc-service,platform-catalog-service,auth-service}/src/.../jwt.strategy.ts
/**
 * Permissions effectives du porteur.
 *
 * COMPAT (STORY-105, RETIRABLE) : un jeton émis AVANT STORY-103 ne porte pas le
 * claim `perms`. Sa durée de vie est bornée par le TTL access (15 min) → ce repli
 * ne couvre que la fenêtre d'un déploiement progressif. À SUPPRIMER quand plus
 * aucun jeton pré-103 ne circule (soit 15 min après le déploiement de 103).
 *
 * Équivalence EXACTE : avant 103, seul un PLATFORM_ADMIN passait `@Roles(PLATFORM_ADMIN)`
 * — on lui accorde donc le catalogue entier, qui est très exactement sa ligne
 * `roles` en base (103 : PLATFORM_ADMIN = PERMISSION_CATALOG par construction).
 * Tout autre rôle → `[]` (aucune élévation possible).
 *
 * NON EXPLOITABLE : le claim ne peut pas être « retiré » par un attaquant — le
 * jeton est signé RS256 par l'IdP et vérifié via JWKS (`algorithms: ['RS256']`).
 * Seul l'IdP émet.
 */
private static resolvePerms(payload: AccessTokenPayload): string[] {
  if (payload.perms !== undefined) {
    return payload.perms;            // ⚠️ y compris [] : un tenant n'a AUCUNE permission
  }
  return (payload.roles ?? []).includes(Role.PLATFORM_ADMIN)
    ? [...PERMISSION_CATALOG]
    : [];
}
```

**Pourquoi dans la stratégie et nulle part ailleurs :** le repli est une **règle de traduction du jeton**, pas une règle d'autorisation. Placé ici, `PermissionsGuard` **et** `assertCanReadOrg` lisent `user.perms` **uniformément, sans aucune logique de repli** — et le jour où on le retire, **on retire 4 lignes dans 3 fichiers**, pas une condition disséminée dans chaque guard et chaque corps de contrôleur.

### 🪤 Piège 1 — `resolveRole` replie **tout rôle inconnu** sur `TENANT_USER`

[kyc-service/jwt.strategy.ts:96-100](kyc-service/src/modules/auth/strategies/jwt.strategy.ts#L96) *(idem catalog)* :

```typescript
private static resolveRole(payload: AccessTokenPayload): Role {
  const roles = payload.roles ?? [];
  const effective = ROLE_PRECEDENCE.find((r) => roles.includes(r));
  return effective ?? Role.TENANT_USER;      // 🪤 PLATFORM_KYC_OFFICER → TENANT_USER !
}
```

Un `PLATFORM_KYC_OFFICER` (`roles: ['PLATFORM_KYC_OFFICER']`, **absent** de `ROLE_PRECEDENCE`) est aujourd'hui projeté en **`TENANT_USER` avec `tenantId: null`**. Inoffensif tant que rien ne dépend de `perms` — **mortel dès `assertCanReadOrg`** (cf. Piège 2). **`ROLE_PRECEDENCE` et son repli disparaissent** : la stratégie projette **le tableau complet**, exactement comme 103 l'a fait dans l'IdP.

**Blast radius vérifié** (`grep` du 2026-07-16) — `AuthenticatedUser.role` n'a que **3 lecteurs** au total :

| Fichier | Nature | Suite |
|---|---|---|
| [kyc roles.guard.ts:33](kyc-service/src/common/guards/roles.guard.ts#L33) | autorisation | → multi-rôles |
| [catalog roles.guard.ts:33](platform-catalog-service/src/common/guards/roles.guard.ts#L33) | autorisation | → multi-rôles |
| [catalog entitlements.controller.ts:143](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L143) | autorisation **dans le corps** | → **Piège 2** |

Aucun `@CurrentUser('role')`, aucun DTO exposant `role` dans ces 2 services *(≠ `auth-service`, où 103 a dû préserver `GET /users/me`)*.

### 🪤 Piège 2 — l'autorisation **dans le corps** de `entitlements.controller`

```typescript
// platform-catalog-service/.../entitlements.controller.ts:142-151 — AVANT
private assertCanReadOrg(user: AuthenticatedUser, orgId: string): void {
  if (user.role === Role.PLATFORM_ADMIN) return;          // 🪤 second point de décision
  if (user.tenantId !== orgId) throw new ForbiddenException(...);
}
```

**Migrer le guard sans migrer ceci = un 403 imprenable** : un `PLATFORM_SUPPORT` passerait `PermissionsGuard`… puis serait **projeté en `TENANT_USER` avec `tenantId: null`** (Piège 1) → `null !== orgId` → **403 dans le corps**. Deux pièges qui se composent — **c'est le point le plus subtil de la story**.

```typescript
// APRÈS — un seul modèle de décision : les permissions
/**
 * Autorisation CONTEXTUELLE (dépend de `:orgId`) — d'où l'absence de `@Roles` /
 * `@RequirePermissions` sur ces routes : la décision ne peut pas être prise par un
 * guard, qui ne connaît pas la cible. Un opérateur plateforme porteur de `org:read`
 * lit TOUTE org ; un `TENANT_ADMIN` UNIQUEMENT la sienne (anti-énumération) ; un
 * `TENANT_USER` n'y accède pas (inchangé vs STORY-033).
 */
private assertCanReadOrg(user: AuthenticatedUser, orgId: string): void {
  if (user.perms.includes(Permission.ORG_READ)) return;              // opérateur plateforme
  if (!user.roles.includes(Role.TENANT_ADMIN)) throw new ForbiddenException(
    'Accès refusé : une organisation ne peut consulter que ses propres entitlements.',
  );
  if (user.tenantId !== orgId) throw new ForbiddenException(
    'Accès refusé : une organisation ne peut consulter que ses propres entitlements.',
  );
}
```

⚠️ **Le `@Roles(PLATFORM_ADMIN, TENANT_ADMIN)` retiré de ces 2 GET portait aussi l'exclusion de `TENANT_USER`** → **elle doit être reprise dans le corps** (`!roles.includes(TENANT_ADMIN)`), sinon **élargissement silencieux** : un `TENANT_USER` lirait les entitlements de sa propre org. **Message générique identique dans les deux branches** (anti-énumération : ne pas distinguer « mauvais rôle » de « mauvaise org »).

### §Routes mixtes — pourquoi **pas** de guard OU-logique

Les 2 GET entitlements servent **une population plateforme ET une population tenant**. Trois options :

| Option | Verdict |
|---|---|
| `@Roles(TENANT_ADMIN)` **+** `@RequirePermissions(ORG_READ)` avec **OU** entre les deux guards | ❌ **Rejeté** — `RolesGuard` **lève** avant que `PermissionsGuard` ne s'exécute. Les faire coopérer rend la décision de **chaque route de l'écosystème** dépendante de **l'ordre d'enregistrement des guards** : un mode de défaillance bien pire que le problème résolu. |
| Un guard unique `AuthorizationGuard` fusionnant `@Roles` et `@RequirePermissions` | ❌ **Rejeté** — réécrit `RolesGuard` dans **4 services** (K4) alors que 105 doit **borner** son rayon. |
| **Décision contextuelle dans le corps** (`assertCanReadOrg`), route sans métadonnée | ✅ **Retenu** — ces routes **avaient déjà** leur autorisation dans le corps (`assertCanReadOrg`, STORY-033, testée). On **étend l'existant**, on ne déplace rien. Chaque route reste **soit** rôle-gatée, **soit** perm-gatée, **soit** contextuelle : **jamais deux guards qui négocient**. |

### Ce qui **ne** migre **PAS** — et pourquoi *(correction du `sprint-status`)*

| Contrôleur | Raison de ne **pas** migrer |
|---|---|
| **`catalog-admin`** ([:37](platform-catalog-service/src/modules/catalog/controllers/catalog-admin.controller.ts#L37)) — CRUD modules/versions/référentiels | **Aucune permission du catalogue figé ne le couvre** (pas de `catalog:manage`). En créer une **romprait le gel de 103** — et **aucun persona n'en a besoin** : ni le KYC officer, ni le support, ni l'auditeur ne gèrent le catalogue produit. `@Roles(PLATFORM_ADMIN)` **reste correct** (le `PLATFORM_ADMIN` garde `PLATFORM_ADMIN` dans `roles[]` — 103). **Migrer = inventer une permission dont personne n'a l'usage**, exactement ce que la règle d'or interdit. |
| **`catalog-read`** ([:27](platform-catalog-service/src/modules/catalog/controllers/catalog-read.controller.ts#L27)) — catalogue publié, `PLATFORM_ADMIN` **+ `TENANT_ADMIN`** | Route **majoritairement tenant**. Les rôles tenant ont **`perms: []` pour toujours** (103) → la gater par permission **casserait tous les tenants**. Et aucun persona plateforme n'a besoin de lire le catalogue produit. **Hors périmètre par construction** (« les rôles TENANT ne sont pas touchés »). |

> **`sprint-status.yaml` listait ces deux contrôleurs comme cibles de 105.** La lecture du code montre qu'ils **ne peuvent pas** l'être sans rompre le catalogue figé **ou** casser les tenants. **Écart assumé et documenté** — à reporter dans le `sprint-status` à la clôture.

### `PermissionsGuard` — la forme attendue

```typescript
// src/common/guards/permissions.guard.ts  (× 3 services — K4, comme RolesGuard)
/**
 * Guard **global** de permissions (s'exécute APRÈS `RolesGuard`). Sans
 * `@RequirePermissions(...)`, laisse passer (l'authentification suffit) ; sinon
 * exige que le porteur détienne **l'UNE** des permissions requises (sémantique OU,
 * cohérente avec `@Roles`), `403` à défaut.
 *
 * Les permissions viennent du claim `perms[]` du jeton (STORY-103), projeté par
 * `JwtStrategy` — AUCUN appel réseau à l'IdP sur le chemin chaud (K4). Contrepartie
 * assumée : un changement de rôle se propage en **15 min** (TTL access).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      PERMISSIONS_KEY, [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const granted = user?.perms?.some((p) => required.includes(p as Permission));
    if (!granted) throw new ForbiddenException('Accès refusé : permission insuffisante.');
    return true;
  }
}
```

**Enregistrement** (les 3 `app.module.ts`, **après** `RolesGuard` — [kyc:91-94](kyc-service/src/app.module.ts#L91-L94)) :

```typescript
{ provide: APP_GUARD, useClass: ThrottlerGuard },
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: EmailVerifiedGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
{ provide: APP_GUARD, useClass: PermissionsGuard },   // ← AJOUT
```

**Message générique** (`'Accès refusé : permission insuffisante.'`) — **ne jamais** énumérer la permission manquante (anti-énumération, `securite.md`).

### Swagger

Chaque route migrée : `@ApiForbiddenResponse` **mis à jour** — `'Réservé au rôle PLATFORM_ADMIN.'` → **la permission requise** (ex. `'Requiert la permission kyc:approve.'`). Les descriptions de classe ([kyc-admin.controller.ts:32](kyc-service/src/modules/kyc/kyc-admin.controller.ts#L32), [entitlements.controller.ts:38-42](platform-catalog-service/src/modules/entitlements/controllers/entitlements.controller.ts#L38)) affirment « réservé au `PLATFORM_ADMIN` » → **à corriger**, sinon la doc **ment** dès le merge.

### Vérification docker attendue

Stack **compose RACINE** (`docker compose up --build`). Recette de jeton : [`docker-platform-admin-token`](.) (⚠️ l'étape « delete membership » est **caduque** depuis 103). Pour chaque persona : `mongosh` → `db.users.updateOne({email}, {$set:{platformRole:'<RÔLE>'}})` → **re-login** → décoder le JWT (vérifier `perms[]`) → `curl` les routes.

| § | Vérification | Attendu |
|---|---|---|
| **1** | `PLATFORM_ADMIN` (8 perms) sur **toutes** les routes des 3 services | **Tout 200** — *non-régression du seul rôle réellement utilisé* |
| **2** | ⚡ **LA PREUVE (démo 106)** — `PLATFORM_KYC_OFFICER` | `GET /admin/kyc` **200** · `GET /admin/kyc/:orgId` **200** · `approve` **200** · `reject` **200** · **`PUT /catalog/entitlements/…` 403** · **`POST /admin/organizations/:id/suspend` 403** |
| **3** | 🔴 **Le trou comblé** — `PLATFORM_KYC_OFFICER` / `PLATFORM_SUPPORT` sur `auth-service` | `GET /admin/organizations` **200** · `GET /admin/organizations/:id` **200** — *(avant 105 : **403** direct, et **503** via le panel)* |
| **4** | `PLATFORM_SUPPORT` **et** `PLATFORM_AUDITOR` (`org:read`) | orgs list/detail **200** · file KYC **200** · détail KYC **200** · **approve 403** · **reject 403** · **grant/revoke 403** · **suspend 403** |
| **5** | **Non-régression TENANT** (`perms: []`) | `kyc.controller` submit/status **200** · `catalog-read` **200** · `entitlements GET` **sa** org **200** · **org d'autrui 403** · `catalog-admin` **403** · routes plateforme **403** |
| **6** | **`TENANT_USER`** sur `GET /catalog/entitlements/:sonOrgId` | **403** — *l'exclusion retirée du `@Roles` est bien reprise dans le corps (Piège 2)* |
| **7** | **Non migré, non cassé** : `catalog-admin` + `catalog-read` | `PLATFORM_ADMIN` **200** · `TENANT_ADMIN` → read **200** / admin **403** |
| **8** | **Compat pré-103** *(e2e — cf. note)* | jeton RS256 **sans claim `perms`** + `roles:['PLATFORM_ADMIN']` → routes migrées **200** ; sans `PLATFORM_ADMIN` → **403** |

> **§8 en e2e, pas en docker** : forger un jeton **sans** `perms[]` exige la **clé privée de l'IdP**. Les e2e **mintent leurs RS256 localement** (cf. CI) → c'est **leur** terrain. Le noter explicitement dans *Progress Tracking* : **§8 = e2e**, §1-7 = docker réel.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **🔴 Régression du `PLATFORM_ADMIN`** — le seul rôle réellement en service | Il détient **les 8** permissions → passe **tout** `@RequirePermissions`. AC + vérif docker §1 dédiés. `catalog-admin` reste sur `@Roles` → **zéro changement** pour lui. |
| **🪤 `resolveRole` → `TENANT_USER`** : un opérateur projeté en tenant | `ROLE_PRECEDENCE` **supprimé**, tableau complet projeté (patron 103). Blast radius **vérifié = 3 lecteurs**. |
| **🪤 Le corps refuse là où le guard autorise** (`assertCanReadOrg`) | Migré **dans la même story** (`perms.includes(org:read)`) + vérif docker §4. |
| **Élargissement silencieux à `TENANT_USER`** en retirant `@Roles` des GET mixtes | L'exclusion est **reprise explicitement** dans le corps + **vérif docker §6** dédiée. |
| **Le shim devient un contournement permanent** | Déclenché **uniquement** sur claim **absent** (jamais sur `[]`) ; **un seul endroit** (la stratégie) ; condition de retrait **écrite dans le code** ; **non exploitable** (RS256/JWKS — seul l'IdP émet). |
| **Le shim masque le chemin neuf dans les e2e** (jetons sans `perms` → repli → tout passe) | AC : **≥ 1 e2e par service** avec un jeton **`PLATFORM_KYC_OFFICER` portant `perms[]`**. |
| **Divergence du catalogue entre 3 services** (K4) | **Test par service** verrouillant la liste exacte des 8 → une divergence **échoue au test**. Assumée par ailleurs (103 §K4). |
| **403 amont présenté en « panne »** par le panel | **Hors 105** (le panel n'est pas touché) → **hook documenté pour 106** : `SourceStatus: 'forbidden'`. Ici, mitigé **en amont** par le choix `org:read` sur la lecture KYC. |
| **🔓 Support/auditeur voient les pièces d'identité** | **Assumé et tracé** (§Pourquoi `org:read`) — catalogue figé, `perms` identiques pour les 2 personas. **Suite proposée** : `kyc:read` + sortie des URLs présignées = **nouvelle story**, à arbitrer **avant** tout usage réel de `PLATFORM_SUPPORT`. |
| **Story multi-repo** : 3 PR à intégrer, ordre de merge | Chaque dépôt est **indépendamment déployable** (additif : le shim + `roles[]` conservé). **Aucun ordre imposé** entre les 3 PR ; la stack docker n'est cohérente qu'une fois **les 3** mergées → **vérif docker après les 3**. |
| **Couverture des 3 services** sous les seuils | Seuils **jamais baissés** ; guards + stratégies sont du code **court et très testable** (103 les a portés à 100 %). |

---

## Dependencies

**Prérequis :** **STORY-103** ✅ *(done, intégrée dans `dev` le 2026-07-16)* — fournit le catalogue à dupliquer, `perms[]` dans le jeton, les rôles système seedés, et le fix `issueSession` (sans lequel un opérateur **avec membership** perdrait son rôle plateforme).

**Débloque :**

| Story | Dépend de 105 pour |
|---|---|
| **STORY-106** (`admin-panel`) | **Tout** : sans 105, la granularité du panel est **cosmétique** — les amont refusent. La démo de 106 (« KYC officer approuve **200** / grant **403** ») **est** la vérif docker §2 d'ici. |
| **STORY-104** (`auth-service`) | Indépendante en théorie (elle crée les rôles) — mais **sans 105 les rôles créés sont inutilisables**. |

**ORDRE IMPOSÉ (D15) : 103 ✅ → 105 → 104/106.**

---

## Definition of Done

- [ ] Catalogue **dupliqué à l'identique** dans `kyc-service` + `platform-catalog-service` (+ test de verrouillage des 8, par service)
- [ ] `PermissionsGuard` + `@RequirePermissions` (sémantique **OU**) livrés et **enregistrés après `RolesGuard`** dans **les 3** services
- [ ] `JwtStrategy` → `roles[]` + `perms[]` (kyc + catalog) · **`ROLE_PRECEDENCE` supprimé** · `RolesGuard` **multi-rôles**
- [ ] **Shim pré-103 dans la stratégie seule** (absent ≠ vide) + **`auth-service` `perms ?? []` corrigé**
- [ ] **11 routes migrées** conformément à la table §Mapping · `catalog-admin` / `catalog-read` / `kyc.controller` **inchangés** (testé)
- [ ] `assertCanReadOrg` migré — **`TENANT_USER` toujours exclu** (vérif docker §6)
- [ ] Swagger **à jour** sur chaque route migrée (`@ApiForbiddenResponse` + descriptions de classe)
- [ ] **≥ 1 e2e par service** avec un jeton `PLATFORM_KYC_OFFICER` **portant `perms[]`**
- [ ] Couverture ≥ **65/90/90/90** sur **les 3** services (**jamais baissés**) · lint **0 warning** ×3 · build ×3 · **CI verte ×3**
- [ ] **Vérif docker §1-7 passée** (réelle, `curl` + `mongosh`) · **§8 en e2e** — consignée dans *Progress Tracking*
- [ ] `/code-review` passée, constats traités
- [ ] **3 branches `MNV-105`** (depuis `dev`, **rebasées** sur `origin/dev` **avant** de coder) → **3 PR** `MNV-105(auth): …` / `MNV-105(kyc): …` / `MNV-105(catalog): …` → **« Rebase and merge »** → **branches supprimées**
- [ ] `sprint-status.yaml` : `status: done` + `completed_date` + `story_path` + **écarts documentés** (périmètre 3 repos, `catalog-admin`/`catalog-read` non migrés)
- [ ] **Mémoire à mettre à jour** : `prospera-rbac-plateforme` (105 faite ; `org:read` = lecture KYC ; dette `kyc:read`)

---

## Story Points Breakdown

| Poste | Points |
|---|---|
| Catalogue dupliqué ×2 + `PermissionsGuard` + `@RequirePermissions` ×3 (K4) | 2 |
| `JwtStrategy` `roles[]`/`perms[]` ×2 + shim ×3 (dont le fix `auth-service`) + `RolesGuard` multi-rôles ×2 | 2 |
| Migration des 3 contrôleurs (11 routes) + `assertCanReadOrg` + Swagger | 1 |
| Tests unitaires + e2e **avec `perms[]`** ×3 services | 2 |
| Vérif docker (5 personas × 3 services) + 3 branches / 3 PR | 1 |
| **Total** | **8** |

**Rationale :** **révisé de 5 → 8**. Deux causes, toutes deux issues de la lecture du code (§Découvertes) : (1) le périmètre passe de **2 à 3 dépôts** — `auth-service/admin-organizations` est le **seul consommateur possible de `org:suspend`** et le **blocage dur de `org:read`** ; (2) la migration n'est **pas** un remplacement de décorateur : elle traverse la `JwtStrategy` (2 services), le `RolesGuard` (2 services), **une autorisation cachée dans un corps de contrôleur**, et un **shim de compat dont la règle exacte (absent ≠ vide) est contre-intuitive**. Le coût est dans la **non-régression** : ces guards protègent **toutes** les routes d'administration de l'écosystème, et `PLATFORM_ADMIN` est le seul rôle réellement en service.

---

## Additional Notes

- **La question à se poser à chaque route : « et si le porteur est un `PLATFORM_SUPPORT` ? »** — pas « et si c'est un `PLATFORM_ADMIN` ? ». L'admin détient les 8 permissions : **il passe partout, il ne révèle aucun bug**. Les deux pièges de cette story (repli `TENANT_USER`, `assertCanReadOrg`) sont **invisibles** en testant avec un admin.
- **Additif de bout en bout, donc déployable dépôt par dépôt** : `roles[]` reste dans le jeton, le shim couvre la fenêtre pré-103, et un service non encore migré **continue de fonctionner**. Les 3 PR n'ont **aucun ordre imposé**.
- **`perms[]` dans le jeton, pas un appel réseau** (K4) : aucun amont n'interroge l'IdP pour autoriser. Contrepartie **assumée** : **15 min** de propagation (TTL access).
- **Cette story est ce qui rend 103 vraie.** 103 a livré un jeton qui **dit** ce que l'opérateur peut faire ; 105 est le moment où quelqu'un **l'écoute**.

---

## Progress Tracking

**Status History:**
- 2026-07-16 : Créée (`/bmad:create-story`) — Scrum Master. **Périmètre révisé à 3 dépôts / 8 points** (arbitré avec le PO) : `auth-service/admin-organizations` inclus — sans lui `org:read` est inerte (503 via le panel) et `org:suspend` est **décorative**. Lecture KYC mappée sur **`org:read`** (arbitré) — dette `kyc:read` tracée.
- 2026-07-16 : Implémentée + **vérifiée docker bout-en-bout** (`/bmad:dev-story`) — review
- 2026-07-16 : `/code-review` (high) — 3 constats, **3 traités** (dont le plancher deny-by-default) — **done**

**Actual Effort:** 8 points (conforme à l'estimation révisée)

---

## Implementation Notes (2026-07-16)

### Livré

| Dépôt | Fichiers |
|---|---|
| **`auth-service`** | **Neuf** : `common/decorators/permissions.decorator.ts`, `common/guards/permissions.guard.ts` (+ spec), `test/admin-organizations.e2e-spec.ts`. **Modifiés** : `jwt.strategy.ts` (**shim** + type « fil »), `admin-organizations.controller.ts` (3 routes), `app.module.ts` (guard), `jwt.strategy.spec.ts`. |
| **`kyc-service`** | **Neuf** : `common/rbac/permission.enum.ts` (**copie conforme**, K4) + spec de **verrou**, `permissions.decorator.ts`, `permissions.guard.ts` (+ spec). **Modifiés** : `jwt.strategy.ts` (`roles[]`/`perms[]` + shim, **`ROLE_PRECEDENCE` supprimé**), `roles.guard.ts` (multi-rôles), `current-user.decorator.ts`, `jwt-payload.interface.ts`, `kyc-admin.controller.ts` (4 routes), `app.module.ts`, `test/utils/rs256.ts`, `test/kyc-admin.e2e-spec.ts`. |
| **`platform-catalog-service`** | Idem `kyc-service` + `entitlements.controller.ts` (2 routes migrées + **`assertCanReadOrg`**), `test/catalog.e2e-spec.ts`, `test/entitlements.e2e-spec.ts`. |

**Catalogue vérifié identique** dans les 3 dépôts (`diff` à vide) ; un test par service **verrouille la liste exacte des 8** → une divergence K4 échoue au test.

### 3 découvertes à l'implémentation (aucune n'était dans la story rédigée)

1. **🔴 Les e2e n'enregistraient pas `PermissionsGuard` → routes migrées NON GARDÉES dans les tests.** Le premier `npm run test:e2e` de `kyc-service` a échoué sur `GET /admin/kyc en TENANT_ADMIN → 403 : expected 403, got 200`. Cause : les harnais e2e déclarent leur propre chaîne d'`APP_GUARD` (`JwtAuth → EmailVerified → Roles`) ; en retirant `@Roles` au profit de `@RequirePermissions`, la route devenait **ouverte** dans le test (le `RolesGuard` laisse passer une route sans `@Roles`). La production n'a jamais été exposée (`app.module.ts` enregistre le guard) — **mais le test aurait validé une route béante**. Corrigé dans les **3 harnais** (kyc + les 2 du catalog), avec commentaire d'avertissement. *Le test qui échoue est ce qui a permis de le voir : c'est l'argument le plus fort pour les e2e de cette story.*

2. **🔴 La fixture `rs256` avalait le claim `perms`.** `test/utils/rs256.ts` (kyc **et** catalog) construit le jeton par **liste blanche** (`sub`/`org`/`roles`/`emailVerified`) : tout `perms` passé était **silencieusement supprimé**. Les personas retombaient donc dans le **shim de compat** (`perms` absent → `[]` pour un non-`PLATFORM_ADMIN`) et récoltaient un 403 — **la fixture était incapable de minter un jeton post-103**. Exactement le risque anticipé (« les e2e testeraient le chemin *legacy* »), mais par une cause qui n'avait pas été identifiée. Corrigé en propageant `perms` **uniquement s'il est défini**, pour préserver la distinction `undefined` ≠ `[]`.

3. **`auth-service` n'avait AUCUN e2e sur `/admin/organizations`.** Seul l'unitaire les couvrait — guards contournés. Or c'est la chaîne de guards que 105 modifie. **Créé** `test/admin-organizations.e2e-spec.ts` (15 tests) : chaîne réelle + jetons RS256 mintés par persona.

### Écart vs la story rédigée

- **Aucun sur le périmètre** : les 11 routes de la table §Mapping sont migrées ; `catalog-admin`, `catalog-read` et `kyc.controller` sont **inchangés** (vérifié en docker : §7).
- **Type « fil » du payload dans `auth-service`** : `AccessTokenPayload.perms` reste **requis** (c'est le contrat d'**émission**, verrouillé par le `toEqual` exact de 103) ; la *lecture* utilise `IncomingAccessTokenPayload = Omit<…,'perms'> & { perms?: string[] }`. Modéliser l'absence côté lecture **sans** affaiblir le contrat d'émission.

### `/code-review` (high) — 3 constats, 3 traités

| # | Constat | Suite |
|---|---|---|
| 1 | **🔴 Le `@Roles(PLATFORM_ADMIN)` retiré était posé sur la CLASSE — un filet deny-by-default.** Il protégeait **toute** route de `kyc-admin` / `admin-organizations`, y compris une future route dont l'auteur oublierait le décorateur. Passer à des décorateurs **par route** supprimait ce filet : une route non décorée sur un contrôleur d'**administration** devient accessible à **tout utilisateur authentifié — un `TENANT_USER` compris**. Latent (les 7 routes sont décorées), mais l'échec e2e du premier jet a prouvé que ce mode de défaillance est **réel et facile à atteindre**. | **CORRIGÉ** — **plancher** `@RequirePermissions(ORG_READ)` au niveau **classe** sur les deux contrôleurs. `getAllAndOverride([handler, classe])` fait **gagner le handler** : chaque route garde SA permission (`suspend` reste `org:suspend`), et une route oubliée exige au moins `org:read`, qu'aucun rôle tenant ne détient. **Précédence vérifiée en e2e ET en docker réel** (officier : lecture 200 / suspend **403**) — une précédence inversée aurait **élargi `suspend` à tout porteur d'`org:read`**. |
| 2 | **`EntitlementsController` ne peut PAS recevoir ce plancher** : ses lectures servent aussi des tenants (`perms: []` par construction) — un plancher les refuserait **au guard**, avant le corps. Toute nouvelle route de lecture qui oublierait `assertCanReadOrg` serait donc ouverte. | **DOCUMENTÉ** — avertissement explicite dans la doc de classe, au point de danger. Les **écritures** restent couvertes par leur `@RequirePermissions`. |
| 3 | **`assertCanReadOrg` construisait l'exception de refus trop tôt** : `new ForbiddenException(...)` (capture de pile) était exécuté pour **tout** appelant sans `org:read` — donc à **chaque lecture légitime d'un tenant sur sa propre org**, puis jeté. | **CORRIGÉ** — fabrique (`() => new ForbiddenException(...)`) : plus rien n'est construit sur le chemin passant. |

### Qualité

| Service | Unitaires | e2e | Couverture (seuils 65/90/90/90) |
|---|---|---|---|
| `auth-service` | **311** / 43 suites | **31** / 5 suites | 96.24 / 85.04 / 97.48 / 96.26 |
| `kyc-service` | **196** / 32 suites | **46** / 4 suites | 95.81 / 88.95 / 94.96 / 95.69 |
| `platform-catalog-service` | **214** / 28 suites | **52** / 3 suites | 99.86 / 92.89 / 100 / 99.85 |

**850 tests verts** · **lint 0 warning ×3** (binaire local) · **build ×3** · `permissions.guard.ts` **100 %** dans les 3 services · seuils **jamais touchés**.

### Vérification docker (compose RACINE, mongo rs0 + kafka + redis + minio + mailhog ; `curl` + `mongosh` réels)

Personas obtenus **par vrai login** (`platformRole` basculé en base → re-login → jeton RS256 décodé), **pas** par jetons forgés.

| § | Vérification | Résultat |
|---|---|---|
| **1** | **Non-régression `PLATFORM_ADMIN`** (jeton réel : `perms` = les 8) sur les 11 routes | list/detail **200**, **suspend 200**, kyc file/détail **200**, **grant 201**, **revoke 200**, entitlements GET **200**, catalog-admin/read **200** ✔ |
| **2** | ⚡ **LA PREUVE — `PLATFORM_KYC_OFFICER`** (`perms` = `kyc:approve, kyc:reject, org:read`) | file **200** · détail **200** · **reject 200** · **grant 403** · **revoke 403** · **suspend 403** ✔ — *approuve un KYC, n'accorde aucun module* |
| **2b** | **Persistance réelle** de la décision déléguée (`mongosh`) | `tenantkycprofiles` → `status: REJECTED`, `rejectionReason: 'verif-105'`, **`reviewedBy` = l'userId de l'agent KYC**, `reviewedAt` ✔ · outbox `kyc.status.changed` **`SENT`** (relayé à Kafka) ✔ |
| **3** | 🔴 **Le trou comblé** — opérateur `org:read` sur `auth-service` | `GET /admin/organizations` **200** *(avant 105 : **403** direct → **503** via le panel, `mapPrimaryError` : tout non-404 → `ServiceUnavailableException`)* ✔ |
| **4** | **`PLATFORM_SUPPORT`** (`org:read` seul) | orgs list/detail **200**, kyc file/détail **200** — **reject 403**, **grant/revoke 403**, **suspend 403** ✔ *(moindre privilège réel)*. ⚠️ **`PLATFORM_AUDITOR` n'a PAS été testé séparément** : son rôle système seedé porte **exactement** `{org:read}` (vérifié en base, §0) — le même jeu de `perms` que `PLATFORM_SUPPORT`, et **seules les `perms` décident** (le nom du rôle n'est jamais lu par le guard). Le résultat est donc identique **par construction**, mais l'assertion directe manque : à dire, pas à sous-entendre. |
| **5** | **Non-régression TENANT** (tenant **réellement enregistré**, `perms: []`) | `catalog/modules` **200** · entitlements **sa** org **200** · **autre org 403** · `kyc/status` **200** · routes plateforme **403** · écritures **403** ✔ |
| **6** | ⚡ **`TENANT_USER` sur SA PROPRE org** (l'exclusion retirée du `@Roles`) | **403** + message générique ✔ — *l'élargissement silencieux n'a pas eu lieu* |
| **7** | **Non migré, non cassé** : `catalog-admin` + `catalog-read` | `PLATFORM_ADMIN` **200** ; `PLATFORM_KYC_OFFICER`/`SUPPORT` **403** (ils ne sont pas `PLATFORM_ADMIN`) ✔ |
| **1b** | **Persistance réelle** des écritures admin | `organizations` → **`status: SUSPENDED`** *(seul consommateur d'`org:suspend`)* · `entitlements` → **`REVOKED`** après `201` · outbox `identity.org.updated` **`SENT`** + `entitlement.changed` **`SENT`** ✔ |
| **8** | **Compat pré-103** (jeton **sans** claim `perms`) | **en e2e** (les jetons y sont mintés localement) : `PLATFORM_ADMIN` pré-103 → **200** sur les routes migrées ; `TENANT_ADMIN` pré-103 → **403** ✔ |

> **Le throttler de login (5/min) s'est déclenché** pendant la recette (bascules de persona répétées) — comportement **attendu** (`securite.md`), contourné par attente, pas par contournement.

---

**Status:** done ✅
**Dependencies:** STORY-103 ✅ · **Débloque** STORY-106 (et rend 104 utile)
**Reference:** `sprint-status.yaml` §D15 (2026-07-16) · `docs/stories/STORY-103.md` · `architecture-prospera-ecosystem-2026-07-04.md` (K4)

**This story was created using BMAD Method v6 - Phase 4 (Implementation Planning)**

### Intégration

**INTÉGRÉ DANS `dev` le 2026-07-16** — **3 dépôts, 3 PR, aucun merge commit** :

| Dépôt | Branche | PR | `dev` |
|---|---|---|---|
| `prospera-auth-service` | `MNV-105` | **#3** — *Rebase and merge* | `cfa3ad6` |
| `prospera-kyc-service` | `MNV-105` | **#4** — *Rebase and merge* | `b77316b` |
| `prospera-platform-catalog-service` | `MNV-105` | **#5** — *Rebase and merge* | `aa5e0f2` |

Chaque branche créée depuis `dev` et **rebasée sur `origin/dev` avant de coder**, puis **supprimée** (locale + distante) après intégration. Vérifié : **0 merge commit** introduit par les 3 PR (l'historique reste linéaire).

### Reste / suites

- **STORY-106** (`admin-panel`) — désormais **débloquée** : la granularité du panel ne sera plus cosmétique. ⚠️ **Hook à traiter là-bas** : `classifyUpstreamError` mappe tout échec non-404 en `unavailable` → un **403 y est présenté comme une panne**. `SourceStatus` doit gagner un état **`forbidden`**, sinon le moindre privilège est indiscernable d'une panne.
- **STORY-104** (`auth-service`) — les invariants `assertCanGrant` / `assertNotLastPlatformAdmin` (103) restent prêts à câbler ; `user:invite` et `role:manage` sont les **2 dernières** permissions du catalogue sans consommateur, et 104 les consomme → la règle d'or sera alors **complètement** tenue.
- **🔓 Dette tracée (nouvelle story à arbitrer)** : `PLATFORM_SUPPORT` / `PLATFORM_AUDITOR` voient les **URLs présignées des pièces d'identité** via `org:read`. Introduire `kyc:read` + sortir les URLs présignées vers une route réservée aux décideurs — **avant tout usage réel de ces personas en production**.
- **Shim de compat pré-103 : retirable** (3 fichiers, ~4 lignes) une fois qu'aucun jeton pré-103 ne circule.
