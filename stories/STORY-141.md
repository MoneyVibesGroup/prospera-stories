# STORY-141 : `platform-catalog-service` — objet **Projet** (modèle, CRUD, org propriétaire, association de modules)

**Epic :** EPIC-026 — Projets (nouveau)
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` (C3 = le catalogue ne détient que des entrées de registre ; C8 = octroi service-à-service) · **STORY-032** (catalogue Module/Version/Référentiel) · **STORY-033** (entitlements + réconciliation) · **STORY-034** (`entitlement.changed`) · **STORY-140** (permissions `project:*`)
**Priorité :** Must Have
**Story Points :** 6 *(8 → 6 : `project.changed` n'est pas publié, cf. arbitrage 1)*
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-28
**Sprint :** 18
**Services :** `platform-catalog-service` (:3003, **le domaine**) · `auth-service` (:3001, catalogue + libellés + seed) · `kyc-service` (:3002) · `admin-panel` (:3010) — ⚠️ story **multi-repo** par l'effet K4 (cf. arbitrage 2) → **4 branches + 4 PR**
**Branches :** `MNV-141` × 4 dépôts

---

> ## Arbitrages pris au lancement (2026-07-29), avant toute ligne de code
>
> ### 1. `project.changed` — **NON publié**. Hook inerte, contrat figé ici.
>
> Le périmètre le conditionnait explicitement à l'existence d'un abonné : *« si aucun consommateur
> n'est identifié, ne pas publier »*. Recherche exhaustive sur les 8 dépôts (`grep -rn
> "project.changed"`) : **zéro occurrence** hors ce document et `sprint-status.yaml`. Les deux
> consommateurs candidats n'en sont pas :
> - **STORY-143 incrément 3** est un **BFF REST synchrone** — il proxifie `GET /projects/:id`, il ne
>   maintient aucun read-model ;
> - **AP-11** est de l'UI, servie par ce même BFF.
>
> Publier maintenant coûterait un topic à maintenir, un contrat à versionner et un relais d'outbox à
> surveiller, **pour personne**. Le contrat reste écrit ci-dessous et le point d'appel est **nommé en
> commentaire** dans `projects.service.ts` : le jour où un read-model apparaît, la story qui le crée
> branche les deux côtés ensemble (règle « un contrat d'événement touche 2 dépôts »).
>
> **Conséquence technique heureuse** : sans événement, chaque mutation n'écrit **qu'un seul
> document** — aucune transaction Mongo n'est requise (`transactions-mongo.md` ne s'applique qu'au
> delà d'un document). En introduire une « au cas où » simulerait une atomicité qui n'a rien à
> protéger.
>
> ### 2. **4 dépôts**, et non 1 — l'effet K4 sur `permission.enum.ts`
>
> La story annonçait « 1 dépôt, 1 branche, 1 PR ». C'est faux dès lors qu'elle fait naître
> `project:read` / `project:manage` : le catalogue de permissions est **dupliqué à l'octet près dans
> 4 services** (K4, STORY-103/105/106) et le `diff -q` entre copies est le seul détecteur de
> divergence. Laisser une copie à 10 codes le rendrait rouge en permanence.
>
> | Dépôt | Ce que la branche porte | Pourquoi il est **obligatoire** |
> |---|---|---|
> | `platform-catalog-service` | enum + **le module `projects` entier** | C'est le guard qui justifie les 2 permissions (règle d'or) |
> | `auth-service` | enum + libellés `PERMISSION_DESCRIPTIONS` + `project:read` aux 3 rôles métier | `Record<Permission, string>` ⇒ **la compilation casse** sans libellé ; l'ajout aux 3 rôles était déjà planifié par STORY-140 §Périmètre |
> | `kyc-service` | recopie de l'enum + verrou de non-divergence | Aucun guard, aucun comportement modifié — contrat dupliqué seul |
> | `admin-panel` | recopie de l'enum + verrou | `CreatePlatformRoleDto` valide `permissions[]` par `@IsEnum(Permission)` **sur sa copie locale** : restée à 10 codes, elle rejetterait en **400 au bord** la composition d'un rôle portant `project:manage` — exactement le bloquant trouvé en revue de STORY-140 |
>
> Le catalogue passe donc de **10 à 12** permissions.
>
> ### 3. Autorisation : `@RequirePermissions` **pur**, avec plancher de classe
>
> Pas de voie mixte `@RequireAnyOf`, pas de décision contextuelle : les 6 routes servent la
> **seule population plateforme** (leur unique appelant est le BFF admin de STORY-143). Contrairement
> à `EntitlementsController` — qui ne *peut pas* poser de plancher parce que ses lectures servent
> aussi des tenants aux `perms` vides — ce contrôleur porte un `@RequirePermissions` **de classe**
> `{project:read, project:manage}` : une route qu'on y ajouterait demain **sans** décorateur reste
> fermée au lieu d'être ouverte à tout porteur de jeton. Le décorateur de handler **surcharge** ce
> plancher (`getAllAndOverride`), il ne s'y ajoute pas : aucun ET n'est fabriqué.
>
> ### 4. `organizationId` **obligatoire** sur `GET /projects`
>
> Le filtre est la route, pas une option. Le rendre facultatif ouvrirait, sans que personne l'ait
> demandé, une énumération paginée du parc projets **toutes organisations confondues** au premier
> porteur de `project:read`. Absent ⇒ **400**.
>
> ### 5. Un module attaché **sans aucun entitlement** ⇒ `entitlementStatus: null`
>
> La révocation étant *soft* (STORY-033), le cas normal après révocation est `REVOKED`. Mais rien ne
> garantit qu'un entitlement existe encore (purge, reprise de données) : la vue de détail renvoie
> alors `versionCode: null` **et** `entitlementStatus: null` plutôt que d'omettre la ligne. Masquer un
> module attaché parce qu'on ne sait rien de son droit ferait disparaître de l'écran la donnée
> exactement au moment où elle devient problématique.

---

## Contexte

Le PO introduit un objet **Projet** : *un projet appartient à une organisation et regroupe des
modules*. Aucune story backend ne le couvre — vérifié sur `origin/dev` de
`prospera-platform-catalog-service` (`89d6eb9`) : les modules du service sont `auth`, `catalog`,
`entitlements` ; les schémas sont `module`, `module-version`, `referentiel-version`. **Rien sur les
projets.**

**Quel service porte l'objet ?** `platform-catalog-service`, pour trois raisons :
1. Un projet **référence des modules** — le catalogue en est la source de vérité (STORY-032).
2. Un projet est **rattaché à une organisation** et devra être validé contre ses entitlements, qui
   vivent déjà ici (STORY-033) : la validation reste **intra-service**, sans appel réseau ni
   cohérence éventuelle à gérer.
3. `auth-service` détient l'organisation mais ignore tout de l'offre ; y placer le projet forcerait
   un couplage inverse.

---

## La décision structurante : Projet ↔ Entitlements

**Un projet ne peut référencer QUE des modules déjà entitlés `ACTIVE` pour son organisation.**

Justification — c'est la même logique que la validation d'AP-05 (« pas d'octroi d'un couple
inexistant »), poussée d'un cran :

- L'entitlement est **l'autorité** sur ce qu'une organisation a le droit d'utiliser. Un projet qui
  listerait un module non entitlé promettrait un accès que le gate `@RequiresXAccess` refuserait
  ensuite côté client — on afficherait un projet dont la moitié des modules renvoient 403.
- L'alternative (projet = intention commerciale, modules non entitlés autorisés) transformerait le
  projet en **second système de vérité** sur le périmètre client, en concurrence avec l'entitlement.
  L'écosystème en a déjà un, et il est événementiel.

**Conséquence à assumer, et à traiter :** révoquer un entitlement laisse un projet qui pointe un
module désormais interdit. On **ne cascade pas** la suppression (perte de données silencieuse) : le
module reste attaché mais le projet devient **partiellement dégradé**, et l'API l'expose
(`modules[].entitlementStatus`). C'est l'admin qui tranche, pas le système.

---

## Périmètre

**Inclus :**

### Modèle
```typescript
@Schema({ timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, required: true }) organizationId!: Types.ObjectId; // opaque (JWT)
  @Prop({ required: true }) name!: string;
  @Prop() description?: string;
  @Prop({ type: [String], default: [] }) moduleCodes!: string[];   // ref Module.code
  @Prop({ type: String, enum: ProjectStatus, default: ProjectStatus.ACTIVE }) status!: ProjectStatus; // ACTIVE | ARCHIVED
  @Prop({ type: Types.ObjectId }) createdBy?: Types.ObjectId;      // userId opaque
}
// index : { organizationId: 1 } ; { organizationId: 1, name: 1 } unique
```
- `moduleCodes` en tableau de codes (pas de `ObjectId`) : cohérent avec `Entitlement.moduleCode` et
  avec la clé fonctionnelle du catalogue.
- **Unicité du nom par organisation** : deux projets homonymes chez le même client sont une erreur de
  saisie, pas un cas d'usage.

### Endpoints (`/projects`, préfixe global `/api/v1`)
| Route | Permission | Notes |
|---|---|---|
| `POST /projects` | `project:manage` | `{organizationId, name, description?, moduleCodes?}` |
| `GET /projects?organizationId=` | `project:read` | Liste paginée — `organizationId` **obligatoire** (arbitrage 4) |
| `GET /projects/:id` | `project:read` | Détail + `modules[]` enrichis (nom, version entitlée, `entitlementStatus`) |
| `PATCH /projects/:id` | `project:manage` | `name`, `description`, `status` |
| `POST /projects/:id/modules` | `project:manage` | Associe un ou plusieurs `moduleCodes` |
| `DELETE /projects/:id/modules/:moduleCode` | `project:manage` | Dissocie |

### Validations
- `organizationId` : ObjectId valide. Le service **ne vérifie pas** l'existence de l'org (opacité
  assumée, comme `Entitlement` — STORY-033).
- Chaque `moduleCode` : **existe au catalogue** ET **entitlement `ACTIVE`** pour cette org → sinon
  **409** avec le code fautif nommé.
- Nom : 2-80 caractères, unique par org → **409** en doublon.
- Suppression d'un projet : **pas de `DELETE`** en v1 → `status: ARCHIVED` (les projets sont référencés
  par l'historique client).

### Événement — **hook inerte** (arbitrage 1 : aucun consommateur ⇒ pas de publication)
Contrat figé, à câbler par la story qui créera le premier read-model — **des deux côtés à la fois** :
- topic `project.changed`, même bus et même enveloppe que `entitlement.changed` (STORY-034),
  clé de partition `organizationId` ;
- charge utile `{ projectId, organizationId, action: created|updated|archived|modules_changed, at }`.

Ce que cette story livre pour cela : **rien d'exécutable**, un commentaire nommant le point d'appel
dans `projects.service.ts`. Aucun topic déclaré, aucune entrée d'outbox, aucun test — un hook inerte
est une note, pas du code mort.

### Permissions — **naissance de `project:read` / `project:manage`** (arbitrage 2)
STORY-140 a tranché en (b) : les deux codes ont été **retirés** de son ticket pour naître ici, dans le
commit qui livre leur guard. Cette story les ajoute donc :
- aux **4** copies K4 de `common/rbac/permission.enum.ts` (+ les 4 verrous de non-divergence) ;
- aux libellés `PERMISSION_DESCRIPTIONS` d'`auth-service` (compilation cassée sinon) ;
- à `PLATFORM_ACCOUNTANT`, `PLATFORM_MARKETING` et `PLATFORM_EXECUTIVE` — **`project:read`
  seulement**. Les trois personas *consultent* le parc (`org:read`, `catalog:read`) ; leur donner
  `project:manage` en même temps que la surface naît serait une élévation que personne n'a demandée.
  `PLATFORM_ADMIN` reçoit les deux **par construction** (il porte `PERMISSION_CATALOG` entier).

**Hors périmètre :**
- UI → **AP-11**.
- Proxy BFF → **STORY-143**.
- Facturation d'un projet, jalons, affectation de collaborateurs.

---

## Critères d'acceptation

- [ ] Créer un projet rattaché à une organisation → **201**, `status: ACTIVE`.
- [ ] Créer un projet avec un `moduleCode` inexistant au catalogue → **409**, code nommé.
- [ ] Créer un projet avec un module **non entitlé** pour l'org → **409**, code nommé.
- [ ] Deux projets de même nom dans la même org → **409** ; même nom dans deux orgs → **201**.
- [ ] `GET /projects/:id` renvoie chaque module avec son nom, sa **version entitlée** et son `entitlementStatus`.
- [ ] Révoquer l'entitlement d'un module attaché → le projet reste, le module passe `entitlementStatus: REVOKED`, **rien n'est supprimé**.
- [ ] Associer / dissocier un module → reflété ; associer deux fois le même code est **idempotent**.
- [ ] Archiver un projet → `ARCHIVED` ; aucun `DELETE` n'est exposé.
- [ ] Un acteur sans `project:manage` → **403** sur toute écriture ; sans `project:read` → **403** en lecture.
- [ ] Le catalogue expose **12** permissions, **identiques dans les 4 copies K4** (`diff -q`), chacune avec son libellé français côté IdP.
- [ ] Un rôle plateforme portant `project:manage` se compose **sans 400 au bord** dans `admin-panel` (le défaut de STORY-140, rejoué).
- [ ] **Aucune permission orpheline** : un test nomme, pour `project:read` et `project:manage`, le guard qui les vérifie.
- [ ] `GET /projects` **sans** `organizationId` → **400** (pas d'énumération inter-org).
- [ ] Un module attaché dont l'entitlement a disparu → `versionCode: null`, `entitlementStatus: null` — la ligne reste visible.
- [ ] **Mutation-tests** : retirer le plancher de classe, dégrader `project:manage` en `project:read` sur une écriture, et rendre l'association non-idempotente doivent chacun faire **virer un test au rouge**.
- [ ] Vérification docker bout-en-bout tracée.

---

## Notes techniques

| Élément | Fichier | Nature |
|---|---|---|
| Schéma | `cat/src/modules/projects/schemas/project.schema.ts` | Nouveau |
| Service | `cat/src/modules/projects/services/projects.service.ts` | Nouveau |
| Contrôleur | `cat/src/modules/projects/controllers/projects.controller.ts` | Nouveau |
| Module Nest | `cat/src/modules/projects/projects.module.ts` | Nouveau |
| Enum K4 | `{auth,kyc,cat,panel}/src/common/rbac/permission.enum.ts` (+ 4 specs) | Modifié |
| Libellés | `auth/src/modules/rbac/permission-catalog.ts` | Modifié |
| Seed | `auth/src/modules/rbac/system-roles.ts` | Modifié |

**Vigilance :**
- **Ne pas dupliquer la logique d'entitlement** : la validation lit `EntitlementsService`, elle ne
  réimplémente pas la règle.
- **Migration** : collection neuve, aucune donnée existante — pas de script de migration, mais
  l'index unique `{organizationId, name}` doit être créé explicitement.
- `organizationId` reste **opaque** : ne jamais joindre vers `auth-service`.
- **Pas de N+1 sur l'enrichissement** : un projet de 12 modules ne doit pas produire 24 requêtes.
  Deux lectures groupées (`$in` sur les codes) — une au catalogue, une aux entitlements.
- **Collection nommée explicitement** `projects` (`@Schema({ collection: 'projects' })`) : même nom
  que le défaut Mongoose, donc aucun risque de divergence, mais la convention `CLAUDE.md` cesse
  d'être implicite.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [ ] `lint` / `typecheck` / `test` / `build` verts **sur les 4 dépôts**.
- [ ] `diff -q` des 4 copies de `permission.enum.ts` : identiques.
- [ ] OpenAPI à jour (`/api/docs-json`) — le front génère ses types depuis lui.
- [ ] Vérification docker bout-en-bout tracée.
- [ ] 4 branches `MNV-141`, 4 PR vers `dev`.

---

## Progress Tracking

| Phase | État |
|---|---|
| ① Story ajustée (5 arbitrages, 4 dépôts) | ✅ |
| ③ Développement (4 dépôts) | ✅ |
| ④ Portes DoD + 7 mutation-tests + vérif docker | ✅ **1 bug trouvé par la vérif docker, corrigé** |
| ⑥ Revue de code | ⏳ |
| ⑦ Revue de sécurité | ⏳ |
| ⑧ Rebase-merge | ⏳ |

### ④ Portes DoD (2026-07-29)

| Dépôt | Lint | Build | Couverture (L/F/B) | Unit | e2e |
|---|---|---|---|---|---|
| `platform-catalog-service` | 0 warning | ✅ | 99,88 / 100 / 93,96 | 315 ✅ | 110 ✅ |
| `auth-service` | 0 warning | ✅ | 96,93 / 97,80 / 89,72 | 612 ✅ | 153 ✅ |
| `kyc-service` | 0 warning | ✅ | 95,38 / 94,08 / 89,89 | 222 ✅ | 70 ✅ |
| `admin-panel` | 0 warning | ✅ | 99,83 / 100 / 93,00 | 243 ✅ | 109 ✅ |

Module `projects` : **100 %** lignes / fonctions sur le contrôleur et le schéma, 98,83 / 94,28 sur le
service. `diff -q` des **4** copies de `permission.enum.ts` : **identiques**.

### 🔴 ④ Le bug que seule la vérification docker pouvait voir

`GET /projects?organizationId=` renvoyait **`total: 0` sur 3 documents réellement présents**, sans la
moindre erreur — et lint, build, 315 unitaires et 110 e2e étaient **tous verts**.

**Cause.** Dans ce service, `@Prop({ type: Types.ObjectId })` ne produit pas un chemin `ObjectId`
mais un chemin **`Mixed`** — vérifié, pas supposé :
`EntitlementSchema.path('organizationId').instance === 'Mixed'`. Un chemin `Mixed` ne caste **rien** :
ni la valeur écrite, ni le filtre d'une requête. Le schéma déclarait donc un type que Mongoose
n'appliquait jamais.

L'asymétrie était de mon fait : `create` écrivait `new Types.ObjectId(orgId)` — un vrai `ObjectId` en
base — tandis que `findAll` filtrait avec la **chaîne** du DTO. Deux représentations du même
identifiant, aucune conversion entre les deux, zéro résultat.

**Pourquoi aucun test ne le voyait.** Les faux `Model` (unitaires *et* e2e) comparent par `String()`,
donc les deux formes s'y équivalent. C'est exactement le trou que `CLAUDE.md` décrit : les e2e mockent
la couche données et ne prouvent **ni** la persistance **ni** le comportement réel des requêtes.

**Correctif.** `organizationId` passe en `@Prop({ type: String })` et le service écrit la chaîne brute
— comme `Entitlement.organizationId`, qui stocke déjà des chaînes. Bénéfice second : les deux
collections restent **joignables en `mongosh` sans cast** (vérifié :
`projects.organizationId === entitlements.organizationId` → `true`). Un `ObjectId` d'un côté et une
chaîne de l'autre aurait fait échouer en silence toute vérification croisée future.

**Verrous ajoutés** (les deux virent au rouge si le bug revient — mutation M7) :
`project.schema.spec.ts` asserte `path('organizationId').instance === 'String'`, et
`projects.service.spec.ts` asserte que l'écriture et le filtre de lecture emploient la **même chaîne**.

### ④ Mutation-tests — la preuve que les tests filtrent

| # | Mutation appliquée | Résultat |
|---|---|---|
| M1 | `POST /projects` gardé par `project:read` au lieu de `project:manage` | 🔴 2 e2e |
| M2 | `$addToSet` → `$push` (association non idempotente) | 🔴 1 unitaire |
| M3 | statut exigé `ACTIVE` → `SUSPENDED` | 🔴 5 unitaires + 8 e2e |
| M4 | `PermissionsGuard` neutralisé dans la chaîne `APP_GUARD` de l'e2e | 🔴 4 e2e — sans ce maillon les 6 routes ne sont gardées par **personne** |
| M5 | plancher deny-by-default de **classe** retiré | 🔴 1 unitaire |
| M6 | `PLATFORM_ACCOUNTANT` reçoit `project:manage` au lieu de `project:read` | 🔴 2 unitaires (`auth-service`) |
| M7 | **le bug docker réintroduit** (chemin `ObjectId` + écriture `new Types.ObjectId`) | 🔴 2 unitaires |

### ④ Vérification docker — stack neuve (`down -v`), `auth-service` + `platform-catalog-service`

**Preuve 1 — le seed a réellement écrit (`mongosh auth_service`, collection `roles`)** : 7 rôles, tous
`isSystem: true`. `project:read` est bien entré dans les 3 rôles métier, **et `project:manage` dans
aucun d'eux** :

```
PLATFORM_ACCOUNTANT  ["org:read","catalog:read","project:read"]
PLATFORM_MARKETING   ["org:read","catalog:read","project:read"]
PLATFORM_EXECUTIVE   ["org:read","catalog:read","project:read","entitlement:grant","entitlement:revoke"]
PLATFORM_ADMIN       les 12 permissions (catalogue entier, par construction)
```

**Preuve 2 — le catalogue sort de l'IdP** : `GET /admin/permissions` → **12** entrées, chacune avec son
libellé français, `project:read` et `project:manage` incluses, **aucune sans libellé**.

**Preuve 3 — le JWT RS256 réel porte les nouveaux claims.** Jeton `PLATFORM_ADMIN` obtenu par login :
`perms` contient les 12 codes, `project:read` et `project:manage` compris.

**Preuve 4 — la décision structurante, contre Mongo réel** (org `a…a`, `bilan` + `stock` entitlés `ACTIVE`) :

| Requête | Attendu | Obtenu |
|---|---|---|
| `POST /projects` avec `["bilan"]` | 201 | **201** |
| `POST /projects` avec `["fantome"]` | 409, code nommé | **409** « Le module « fantome » n'existe pas au catalogue. » |
| `POST /projects` homonyme, **même** org | 409 | **409** |
| `POST /projects` même nom, **autre** org | 201 | **201** |
| `GET /projects` **sans** `organizationId` | 400 | **400** |
| `DELETE /projects/:id` | 404 (verbe inexistant) | **404** |

**Preuve 5 — persistance et invariants (`mongosh catalog_service`)** : collection **`projects`**
(nommée explicitement), **3 documents**, index `{organizationId, name}` **unique** réellement créé en
base, `createdBy` renseigné. **Aucun orphelin** : les tentatives refusées en 409 n'ont laissé aucun
document.

**Preuve 6 — LE critère de la story : la dégradation.** `DELETE /catalog/entitlements/:org/stock`
(révocation *soft*), puis `GET /projects/:id` :

```
moduleCodes = ['bilan', 'stock']      ← rien n'a été supprimé
  bilan → Module bilan | 2.0 | ACTIVE
  stock → Module stock | 2.0 | REVOKED   ← la dégradation est EXPOSÉE, pas cascadée
```

Puis `DELETE /projects/:id/modules/stock` → **200**, `moduleCodes = ['bilan']` : on peut nettoyer un
projet dégradé **sans** entitlement actif — c'est ce qui rend l'arbitrage possible côté admin.

**Preuve 7 — idempotence et archivage.** Association rejouée → `['bilan','stock']` inchangé (pas de
doublon). Dissociation rejouée → **200**, jamais 404. `PATCH status: ARCHIVED` → **ARCHIVED**, puis
association sur le projet archivé → **409** « réactivez-le avant d'en modifier le périmètre ».

**Preuve 8 — RBAC sur des jetons réels.** Deux rôles **non-système** composés via l'API
(`LECTEUR_PROJETS` = `["project:read"]`, `GESTION_PROJETS` = `["project:manage"]`), deux utilisateurs
plateforme invités, deux logins réels (claims vérifiés : **une seule** permission chacun) :

| Requête | lecteur | gestion | admin | sans jeton |
|---|---|---|---|---|
| `GET /projects?organizationId=` | **200** | **403** | 200 | **401** |
| `GET /projects/:id` | **200** | **403** | 200 | **401** |
| `POST /projects` | **403** | **201** | 201 | **401** |
| `PATCH /projects/:id` | **403** | **200** | 200 | **401** |

La colonne `gestion` est celle qui compte : **201 en écriture sans détenir `project:read`** — le
plancher de classe est bien un plancher surchargé, pas un ET. Message de refus **générique** :
« Accès refusé : permission insuffisante. », il n'énumère jamais la permission manquante.

**Preuve 9 — le bug corrigé, sur base neuve** : `GET /projects?organizationId=` → `total = 2` (org
`a…a`) et `total = 1` (org `b…b`) — isolation inter-organisations vérifiée, filtre `status` et
plafond `pageSize=100` conformes.
