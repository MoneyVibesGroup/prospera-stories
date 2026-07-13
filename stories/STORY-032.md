# STORY-032 : Catalogue — `Module` / `ModuleVersion` / `ReferentielVersion` + admin CRUD (`PLATFORM_ADMIN`) + garde-fou N/N-1

**Epic :** EPIC-007 — platform-catalog-service (catalogue modules/versions/référentiels + entitlements + topic `entitlement.changed`)
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` (v1.0, §Composants → CatalogModule / §Architecture des données → schémas `Module`/`ModuleVersion`/`ReferentielVersion` / §Drivers 2 & 6 / §Risques #1 & #6) · `architecture-prospera-ecosystem-2026-07-04.md` §Modèle de jetons RS256-JWKS + décisions programme **P7** (2 axes orthogonaux) / **P8** (source de vérité) — décisions catalog **C1/C2/C3/C6**
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-13. `CatalogModule` livré (3 schémas orthogonaux, admin CRUD `PLATFORM_ADMIN`, lecture publiée `TENANT_ADMIN`, garde-fou **N/N-1**, machine d'états `ACTIVE→DEPRECATED→RETIRED`) ; sonde `whoami` retirée. lint 0, 137 unit + 24 e2e verts, couverture **100 %** sur `modules/catalog/`. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-13
**Sprint :** 7
**Service :** platform-catalog-service (`:3003`) — base Mongo dédiée `catalog_service`
**Couvre :** aucun FR du PRD `expert-comptable` (capacité **plateforme** nouvelle) — concrétise **P7** (2 axes code ⊥ référentiel) et amorce **P8** (registre = préalable aux entitlements)

> **2ᵉ story de l'EPIC-007, sur le squelette livré par STORY-031.** STORY-031 a rendu `platform-catalog-service` **démarrable et sécurisé** (relying party RS256/JWKS, `/health`, `KafkaModule` squelette, endpoint diagnostic `whoami`) **sans aucun domaine métier**. STORY-032 pose le **premier domaine** : le **catalogue** — le registre des **`Module`** (ex. `bilan`), de leurs **`ModuleVersion`** (versions de **code**, semver) et des **`ReferentielVersion`** (paquets de données comptables versionnés indépendamment : `syscohada-revise@2.1`, `sfd-bceao@1.3`). Ces **deux axes sont orthogonaux** (P7/C2) et ne se mélangent **jamais**. Le catalogue est administré par le **`PLATFORM_ADMIN`** (CRUD + cycle de vie `ACTIVE → DEPRECATED → RETIRED` daté) sous le **garde-fou N/N-1** (au plus 2 versions majeures `ACTIVE` par module — risque programme #7). Il expose une **lecture du catalogue publié** aux `TENANT_ADMIN`. Il **ne contient encore ni entitlement ni événement** : STORY-033 branche les droits `(org × module)` **sur ce registre** (validation de cohérence), STORY-034 publie `entitlement.changed`. Le catalog **ne stocke pas les données du référentiel**, seulement son **entrée de registre** (pointeur `artifactUri` + `checksum`, décision **C3**).

---

## User Story

En tant qu'**opérateur plateforme PROSPERA (`PLATFORM_ADMIN`)**,
je veux **administrer le catalogue des modules produit** — déclarer un `Module`, publier ses `ModuleVersion` (code, semver) et les `ReferentielVersion` (paquets comptables), et piloter leur **cycle de vie** (`ACTIVE → DEPRECATED → RETIRED`) sous un garde-fou **N/N-1**,
afin de disposer d'un **registre de vérité versionné** (P7/P8) sur lequel les **entitlements `(org × module)`** (STORY-033) pourront être octroyés de façon cohérente, et que les verticaux (`TENANT_ADMIN`) puissent **lire le catalogue publié**.

---

## Description

### Contexte

Le re-cadrage écosystème (P7/P8) a fait du `platform-catalog-service` le **propriétaire unique** de « quelle version de code + quel référentiel servir à l'organisation X ». Cette vérité repose sur **deux axes de variabilité strictement séparés** (décision **C2**, driver #2) :

1. **L'axe « code »** — `ModuleVersion` : la version **routable** d'un module (semver, ex. `bilan@2.0`). C'est elle qui pilote le routage multi-version à l'edge (gateway) et le choix du binaire côté `bilan-service`.
2. **L'axe « données »** — `ReferentielVersion` : un **paquet comptable** versionné **indépendamment** (`syscohada-revise@2.1`, `sfd-bceao@1.3`). Une IMF et un cabinet peuvent partager **la même version de code** avec **des référentiels différents**, sans fork. Le référentiel n'est **jamais** encodé dans la version de code.

STORY-032 crée le `CatalogModule` : les **trois schémas**, leurs **services de validation** et **deux contrôleurs** — un **admin** (`@Roles(PLATFORM_ADMIN)`, CRUD + transitions de cycle de vie) et un **read** (`@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`, lecture du **publié**). Deux garde-fous structurent le domaine : l'**unicité** (`Module.code` ; `(moduleCode, version)` ; `(referentiel.code, version)`) et la **discipline de versions N/N-1** (risque #1, driver #6) : refuser une **3ᵉ version majeure `ACTIVE`** d'un même module tant qu'une ancienne n'est pas **dépréciée** — au plus **N et N-1** simultanément, avec **dépréciation datée**.

Le catalog **ne détient pas** les données du référentiel : conformément à **C3**, il stocke le **pointeur d'artefact** (`artifactUri`) et son **`checksum` (sha256)** ; le **paquet** vit dans un registre d'artefacts (MinIO/OCI), **téléchargé et vérifié par `bilan-service`** (hors de ce service). Aucun `StorageModule`, aucun Redis (hérité de STORY-031).

Cette story **remplace la sonde provisoire `whoami`** (posée en STORY-031 pour prouver le câblage JWKS en isolation) par les **premiers vrais contrôleurs gardés** du domaine — la validation RS256/JWKS + RBAC est désormais démontrée par le catalogue lui-même.

### Périmètre

**Dans le périmètre**
- **`CatalogModule`** (`src/modules/catalog/`) avec les **3 schémas Mongoose** (base `catalog_service`) : `Module`, `ModuleVersion`, `ReferentielVersion` — **index d'unicité** conformes à l'architecture.
- **`ModulesService`** : create / get / list / update (name, description) + **transition de statut** `ACTIVE ↔ DEPRECATED` ; unicité `code`.
- **`ModuleVersionsService`** : create (semver validé) / list par module / get + **transitions** `ACTIVE → DEPRECATED (deprecationDate) → RETIRED` ; unicité `(moduleCode, version)` ; **garde-fou N/N-1** à la création/activation ; refus d'ajouter une version à un module inexistant.
- **`ReferentielVersionsService`** : create (`code`, `version`, `artifactUri`, `checksum` requis) / list / get + transitions de statut ; unicité `(code, version)`. **Pas de téléchargement ni de vérif d'artefact** (C3) — seulement le pointeur + checksum stockés.
- **`CatalogAdminController`** (`@Roles(PLATFORM_ADMIN)`, préfixe `/api/v1/catalog/admin`) : endpoints d'écriture + transitions de cycle de vie, DTO validés (`class-validator`), documentés Swagger.
- **`CatalogReadController`** (`@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`, préfixe `/api/v1/catalog`) : lecture du **catalogue publié** — modules non `DEPRECATED` masqués ? *(non : voir Cas limites)* — **versions/référentiels non `RETIRED`**, avec filtre `?status=ACTIVE` par défaut.
- **Retrait de l'endpoint diagnostic `whoami`** (`DiagnosticsModule`) devenu inutile (les contrôleurs catalogue prouvent désormais le câblage) — ou passage `@Public` retiré ; les e2e de câblage JWKS basculent sur `CatalogReadController`.
- Tests **unitaires** (services : unicité, N/N-1, transitions ; guards RBAC) + **e2e** (CRUD complet, 401/403, garde-fou N/N-1, lecture filtrée) ; Swagger `/api/docs` à jour.

**Hors périmètre (stories suivantes)**
- **Entitlements** `(org × module)` — schéma `Entitlement`, `PUT`/`DELETE`/`GET` réconciliation, upsert idempotent, **validation de cohérence contre ce catalogue** → **STORY-033**.
- **Événements `entitlement.changed`** (producteur Kafka + transactional outbox) + **auth service-à-service** (C8) → **STORY-034**.
- **Registre d'artefacts (MinIO/OCI)** : hébergement/téléchargement/vérification du paquet référentiel → **`bilan-service`** (C3). Le catalog ne stocke que `artifactUri` + `checksum`.
- **Routage multi-version à l'edge** (`orgId → version`) → gateway (doc ops), alimenté plus tard par `entitlement.changed`.
- **Suspension en cascade `identity.org.suspended`** (C9) → optionnel, côté entitlements (STORY-033/034).

### Flux (administration du catalogue)

1. Le `PLATFORM_ADMIN` se connecte à l'IdP (`:3001`) → **JWT RS256** (`roles:[PLATFORM_ADMIN]`, `org:null`, `aud` contient `platform-catalog-service`).
2. `POST :3003/api/v1/catalog/admin/modules { code:"bilan", name:"Bilan & liasse", description }` → **201** (`Module` `ACTIVE`).
3. `POST .../modules/bilan/versions { version:"1.2" }` → **201** (`ModuleVersion` `ACTIVE`) ; idem `{ version:"2.0" }` → **201** (N et N-1 co-actifs, **OK**).
4. `POST .../modules/bilan/versions { version:"3.0" }` → **409 Conflict** (garde-fou N/N-1 : 3ᵉ majeure `ACTIVE`) tant que `1.x` n'est pas déprécié.
5. `PATCH .../modules/bilan/versions/1.2 { status:"DEPRECATED", deprecationDate:"2026-12-31" }` → **200** ; **re-tenter** `3.0` → **201** (2 majeures actives : `2.x`, `3.x`).
6. `POST .../referentiels { code:"syscohada-revise", version:"2.1", artifactUri:"oci://…/syscohada-revise:2.1", checksum:"sha256:…" }` → **201**.
7. Un `TENANT_ADMIN` (org d'un cabinet) : `GET :3003/api/v1/catalog/modules` → **200** (catalogue **publié** : versions `ACTIVE`/`DEPRECATED`, **jamais** `RETIRED`).
8. Négatifs : `TENANT_ADMIN` sur un endpoint admin → **403** ; sans token → **401** ; `code`/`version` en double → **409** ; version sur module inexistant → **404**.

---

## Acceptance Criteria

- [ ] **Schéma `Module`** (`src/modules/catalog/schemas/module.schema.ts`) : `code` (unique, requis), `name` (requis), `description?`, `status` enum `ModuleStatus` (`ACTIVE | DEPRECATED`, défaut `ACTIVE`), `timestamps`. **Index unique `{ code: 1 }`**.
- [ ] **Schéma `ModuleVersion`** : `moduleCode` (requis, réf `Module.code`), `version` (semver requis), `status` enum `VersionStatus` (`ACTIVE | DEPRECATED | RETIRED`, défaut `ACTIVE`), `deprecationDate?`, `releasedAt?`, `timestamps`. **Index unique `{ moduleCode:1, version:1 }`** + index `{ moduleCode:1, status:1 }`.
- [ ] **Schéma `ReferentielVersion`** : `code` (requis), `version` (requis), `status` enum `VersionStatus`, `artifactUri` (requis), `checksum` (requis, sha256), `timestamps`. **Index unique `{ code:1, version:1 }`**. **Aucun téléchargement/vérif de l'artefact** (C3) — pointeur + checksum uniquement.
- [ ] **CRUD `Module` (admin)** : `POST` (201, `code` unique sinon **409**), `GET` liste, `GET /:code` (**404** si absent), `PATCH /:code` (name/description) ; **transition** `ACTIVE ↔ DEPRECATED` via `PATCH /:code { status }`.
- [ ] **CRUD `ModuleVersion` (admin)** : `POST /modules/:moduleCode/versions` (201 ; **404** si module inexistant ; **409** si `(moduleCode,version)` en double ; **400** si `version` non-semver) ; `GET /modules/:moduleCode/versions` (liste) ; `PATCH /modules/:moduleCode/versions/:version { status, deprecationDate? }` — transitions valides **uniquement** `ACTIVE → DEPRECATED → RETIRED` (toute transition illégale → **409/400**) ; `DEPRECATED` **exige** `deprecationDate`.
- [ ] **Garde-fou N/N-1** : la **création** (ou l'activation) d'une `ModuleVersion` dont la **majeure** porte le total de **majeures `ACTIVE` distinctes du module à ≥ 3** est **refusée (409 Conflict)** avec un message explicite (« déprécier une majeure existante d'abord »). Deux majeures actives (N, N-1) = **autorisé**. Le comptage est **par majeure semver** (ex. `2.0` et `2.3` comptent pour **une** majeure `2`).
- [ ] **CRUD `ReferentielVersion` (admin)** : `POST /referentiels` (201 ; **409** si `(code,version)` en double ; **400** si `artifactUri`/`checksum` manquants) ; `GET /referentiels` ; `PATCH /referentiels/:code/:version { status, deprecationDate? }` (mêmes transitions de cycle de vie).
- [ ] **Lecture publiée (`CatalogReadController`, `@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`)** : `GET /api/v1/catalog/modules` (+ versions), `GET /api/v1/catalog/referentiels` — renvoient les entrées **non `RETIRED`** (défaut) ; support `?status=ACTIVE`. Un `TENANT_ADMIN` **ne voit jamais** de version `RETIRED`.
- [ ] **RBAC vérifié** : tout endpoint `admin/*` exige `PLATFORM_ADMIN` (`TENANT_ADMIN`/`TENANT_USER` → **403**) ; les endpoints de lecture exigent `PLATFORM_ADMIN` **ou** `TENANT_ADMIN` ; sans token → **401** (`JwtAuthGuard` global hérité de STORY-031). L'IdP émet toujours `platform-catalog-service` dans l'`aud`.
- [ ] **DTO validés** (`class-validator`, `whitelist`+`forbidNonWhitelisted` déjà actifs) : `CreateModuleDto`, `UpdateModuleDto`, `CreateModuleVersionDto`, `UpdateVersionStatusDto`, `CreateReferentielVersionDto` — `code` (regex kebab), `version` (regex semver), `checksum` (regex sha256), `status` (enum), `deprecationDate` (ISO). Champs inconnus → **400**.
- [ ] **`whoami` retiré** (ou dégardé) : les e2e de câblage JWKS RS256/JWKS s'appuient désormais sur `CatalogReadController` ; `DiagnosticsModule` supprimé du graphe d'app (ou vidé).
- [ ] **Swagger `/api/docs`** documente le domaine catalogue (tags `Catalog Admin`, `Catalog`) ; **seuils Jest 65/90/90/90** tenus, **ESLint 0 warning**.
- [ ] **Vérification docker bout-en-bout** : via la stack racine, un JWT `PLATFORM_ADMIN` réel de l'IdP crée un module + 2 versions, se voit **refuser** la 3ᵉ (N/N-1), déprécie puis réussit ; un JWT `TENANT_ADMIN` **lit** le catalogue (200) mais est **refusé** en écriture (403).

---

## Technical Notes

### Arborescence (nouvelle — `src/modules/catalog/`)

```
platform-catalog-service/src/modules/catalog/
├── catalog.module.ts                 # importe les 3 schémas, déclare services + 2 contrôleurs
├── schemas/
│   ├── module.schema.ts              # Module (code unique)
│   ├── module-version.schema.ts      # ModuleVersion (moduleCode+version unique, index status)
│   └── referentiel-version.schema.ts # ReferentielVersion (code+version unique, artifactUri+checksum)
├── enums/
│   ├── module-status.enum.ts         # ACTIVE | DEPRECATED
│   └── version-status.enum.ts        # ACTIVE | DEPRECATED | RETIRED
├── dto/
│   ├── create-module.dto.ts / update-module.dto.ts
│   ├── create-module-version.dto.ts / update-version-status.dto.ts
│   └── create-referentiel-version.dto.ts
├── services/
│   ├── modules.service.ts
│   ├── module-versions.service.ts    # porte le garde-fou N/N-1 + machine d'états
│   └── referentiel-versions.service.ts
└── controllers/
    ├── catalog-admin.controller.ts   # @Roles(PLATFORM_ADMIN) — /api/v1/catalog/admin/*
    └── catalog-read.controller.ts    # @Roles(PLATFORM_ADMIN, TENANT_ADMIN) — /api/v1/catalog/*
```

> `app.module.ts` : ajouter `CatalogModule`. `DiagnosticsModule` retiré (whoami remplacé). Aucun nouveau module d'infra (Mongo/Kafka déjà câblés en STORY-031).

### Schémas (source de vérité : architecture §Architecture des données)

Reprendre **littéralement** les définitions `@Schema({ timestamps: true })` de l'architecture pour `Module`, `ModuleVersion`, `ReferentielVersion` (props, enums, index). Points de vigilance :
- `ModuleStatus` = `{ ACTIVE, DEPRECATED }` ; `VersionStatus` = `{ ACTIVE, DEPRECATED, RETIRED }` (partagé par `ModuleVersion` et `ReferentielVersion`).
- Index d'unicité **déclarés au niveau schéma** (`schema.index(..., { unique: true })`) — vérifier qu'ils sont **créés** (autoIndex activé en dev/test) pour que le **409** provienne bien de l'unicité Mongo *et* d'un pré-check applicatif (message propre).
- `ReferentielVersion` **n'a pas** de `moduleCode` : les référentiels sont **orthogonaux** aux modules (C2) — un même référentiel sert plusieurs modules. Le lien `(module × version × référentiel)` se fera **dans l'`Entitlement`** (STORY-033), pas ici.

### Garde-fou N/N-1 (`module-versions.service.ts`)

```
Sur create (ou passage à ACTIVE) d'une version v du module m :
  majeuresActives = distinct( semverMajor(x.version) )
                    pour x in ModuleVersion where moduleCode=m and status=ACTIVE
  siNouvelleMajeure = semverMajor(v) ∉ majeuresActives
  si siNouvelleMajeure et |majeuresActives| >= 2 :
      throw ConflictException(
        "Garde-fou N/N-1 : le module {m} a déjà {N,N-1} versions majeures actives ; " +
        "dépréciez-en une (PATCH status=DEPRECATED) avant d'en publier une nouvelle.")
```
- **Comptage par majeure** (pas par version) : `2.0` + `2.3` = une majeure. Extraire la majeure via un util semver simple (`Number(version.split('.')[0])`) — pas besoin de la lib `semver` complète, mais valider le **format** en DTO (`@Matches(/^\d+\.\d+(\.\d+)?$/)`).
- Le garde-fou s'applique **aussi** à une réactivation `DEPRECATED → ACTIVE` si on la supporte (sinon, ne pas l'exposer : cycle **strictement descendant** `ACTIVE → DEPRECATED → RETIRED`, plus simple et aligné §Composants).

### Machine d'états de cycle de vie (versions & référentiels)

```
ACTIVE ──(deprecationDate requise)──▶ DEPRECATED ──▶ RETIRED
   │                                                    ▲
   └──────────────── (interdit de sauter) ──────────────┘
```
- Transitions **descendantes uniquement** ; toute autre (`RETIRED → *`, `ACTIVE → RETIRED` directe) → **409** (ou 400 selon convention repo — s'aligner sur `kyc-admin.controller` pour le code d'erreur des transitions illégales).
- `DEPRECATED` **exige** `deprecationDate` (validation service, pas seulement DTO).
- `RETIRED` = **sort du catalogue publié** (invisible aux `TENANT_ADMIN`) et **interdit à l'octroi** d'entitlement (contrôle porté par STORY-033, mais le statut est fixé ici — risque #6).

### Endpoints (récapitulatif)

| Méthode | Chemin | Rôle | Effet |
|---|---|---|---|
| POST | `/api/v1/catalog/admin/modules` | PLATFORM_ADMIN | crée un `Module` (409 si `code` dup) |
| GET | `/api/v1/catalog/admin/modules` | PLATFORM_ADMIN | liste (tous statuts) |
| PATCH | `/api/v1/catalog/admin/modules/:code` | PLATFORM_ADMIN | name/description + `ACTIVE↔DEPRECATED` |
| POST | `/api/v1/catalog/admin/modules/:code/versions` | PLATFORM_ADMIN | crée `ModuleVersion` (**N/N-1**, 404/409/400) |
| PATCH | `/api/v1/catalog/admin/modules/:code/versions/:version` | PLATFORM_ADMIN | transition de cycle de vie |
| POST | `/api/v1/catalog/admin/referentiels` | PLATFORM_ADMIN | crée `ReferentielVersion` (409/400) |
| PATCH | `/api/v1/catalog/admin/referentiels/:code/:version` | PLATFORM_ADMIN | transition de cycle de vie |
| GET | `/api/v1/catalog/modules` | PLATFORM_ADMIN, TENANT_ADMIN | catalogue **publié** (non `RETIRED`) + versions |
| GET | `/api/v1/catalog/referentiels` | PLATFORM_ADMIN, TENANT_ADMIN | référentiels publiés |

> Convention `@Roles` + `RolesGuard` déjà câblés (STORY-031). `JwtAuthGuard` global : les endpoints de lecture **ne sont pas** `@Public` (catalogue réservé aux admins plateforme/tenant, pas anonyme).

### Cas limites / points d'attention

- **`Module.status = DEPRECATED`** : un module déprécié **reste visible** en lecture publiée (ses tenants doivent continuer à le voir jusqu'au retrait de leurs versions) — seul le statut **`RETIRED` des versions** masque. Ne pas confondre dépréciation *module* et *version*.
- **Cohérence future avec les entitlements** : STORY-033 refusera un octroi vers une `ModuleVersion`/`ReferentielVersion` **inexistante ou `RETIRED`** (risque #6). STORY-032 doit donc garantir que le **statut** est fiable et que `RETIRED` est **terminal**.
- **Unicité applicative + Mongo** : faire un **pré-check** (findOne) pour un message d'erreur clair **et** conserver l'index unique comme filet (course concurrente) → mapper l'erreur `E11000` en **409** dans le filtre d'exceptions ou le service.
- **Pas de suppression physique** (`DELETE`) des entrées de catalogue en phase 1 : le cycle de vie (`RETIRED`) tient lieu de retrait ; une entrée référencée par un entitlement ne doit jamais disparaître silencieusement.
- **`whoami`** : sa suppression ne doit pas casser la vérif de câblage — **transférer** l'assertion « JWKS valide → 200, HS256 forgé → 401 » sur `GET /api/v1/catalog/modules` (déjà gardé). Garder la couverture des tests négatifs de STORY-031.
- **Duplication assumée (K4/C6)** : réutiliser les guards/décorateurs `common/` de STORY-031 ; ne **pas** réintroduire de logique d'auth. Le domaine catalogue est **pur métier**.

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-031** — scaffold `platform-catalog-service` (relying party RS256/JWKS, `common/`, `RolesGuard`/`@Roles`, base `catalog_service`, `/health`, compose racine + `aud` IdP). **✅ Done + vérifié docker 2026-07-13.** On **branche le domaine dessus**, rien à ré-échafauder.
- **STORY-024** — RS256/JWKS de l'IdP consommé (inchangé).

**Patron à cloner (conventions CRUD + admin + transitions de statut) :**
- **`kyc-service/src/modules/kyc/kyc-admin.controller.ts`** + services associés — contrôleur admin gardé `@Roles`, DTO, codes d'erreur de transition. `auth-service/src/modules/admin/admin-organizations.controller.ts` = 2ᵉ référence RBAC `PLATFORM_ADMIN`.

**Stories débloquées (EPIC-007, sprint 7) :**
- **STORY-033** — entitlements `(org × module)` : **valident leur cohérence contre ce catalogue** (module/version/référentiel existants **et** non `RETIRED`).
- **STORY-034** — `entitlement.changed` (Kafka + outbox) + auth service-à-service (C8).

**Dépendances externes :** Mongo (base `catalog_service`) déjà présente. **Aucun** MinIO/Redis (C3). Le registre d'artefacts (paquets référentiels) est **hors service** — seul le pointeur + checksum est stocké.

---

## Definition of Done

- [ ] Code implémenté sur une branche **`MNV-032`** (convention : une branche par story, préfixe `MNV-0XX`), **branchée depuis `dev` + rebasée sur `origin/dev`** avant de coder.
- [ ] Tests **unitaires** verts, couverture ≥ **65/90/90/90** :
  - [ ] `modules.service` (unicité `code`, transition `ACTIVE↔DEPRECATED`).
  - [ ] `module-versions.service` (**N/N-1** : 2 majeures OK, 3ᵉ refusée, déprécier → OK ; semver invalide ; version sur module inexistant ; transitions de cycle de vie légales/illégales ; `deprecationDate` exigée).
  - [ ] `referentiel-versions.service` (unicité `(code,version)`, `artifactUri`/`checksum` requis, transitions).
  - [ ] RBAC (`RolesGuard` : admin réservé `PLATFORM_ADMIN`).
- [ ] Tests **e2e** verts (`platform-catalog-service/test/`) : parcours admin complet (module → 2 versions → refus 3ᵉ → dépréciation → succès → référentiel) ; lecture `TENANT_ADMIN` 200 (sans `RETIRED`) ; **403** tenant sur admin ; **401** sans token ; **409** doublons ; **404** module inexistant. JWT RS256 mintés en test (paire de clés de test).
- [ ] **ESLint 0 warning**, build image Docker OK (**4 services** en CI verte).
- [ ] **Vérification docker bout-en-bout** (dernier AC) réalisée et journalisée dans « Revue & validation ».
- [ ] Swagger `/api/docs` à jour (tags `Catalog Admin`, `Catalog`).
- [ ] `/code-review` (niveau ≥ high) passée ; constats traités ou tracés.
- [ ] Story mise à jour (statut) dans `docs/sprint-status.yaml` ; **push sur `prospera-platform-catalog-service`** (repo existant depuis STORY-031) : branche `MNV-032`, puis **PR vers `dev`** (flux PR modules). Commit/push **après test + validation**.

---

## Story Points Breakdown

- **3 schémas + enums + index d'unicité + `CatalogModule` :** 1 point
- **3 services (validations, machine d'états, garde-fou N/N-1) :** 2 points
- **2 contrôleurs (admin CRUD + read filtré) + DTO validés + Swagger + retrait `whoami` :** 1 point
- **Tests unit + e2e (parcours N/N-1, RBAC, cycle de vie) + vérif docker :** 1 point
- **Total : 5 points**

**Rationale :** premier domaine métier du service, mais **sans bus ni intégration externe** (Kafka reste squelette, artefacts hors service). Le poids réel est la **discipline de versions N/N-1** + la **machine d'états de cycle de vie** (les deux garde-fous du driver #6 / risque #1) et la couverture de leurs cas. Conforme à l'estimation sprint-plan (5 pts). Plus lourd que STORY-031 (3 pts, scaffold sans domaine), plus léger que STORY-034 (bus + outbox + C8).

---

## Additional Notes

- **Orthogonalité stricte (C2)** : ne **jamais** ajouter `moduleCode` à `ReferentielVersion` ni encoder un référentiel dans `ModuleVersion`. Le croisement `(module, version, référentiel)` appartient à l'`Entitlement` (STORY-033).
- **Léger par conception (C3)** : le catalog reste un **registre** — pointeur + checksum, pas d'octets d'artefact. Toute tentation de télécharger/valider le paquet ici est **hors périmètre** (c'est `bilan-service`).
- **Nommage** : service/dossier = `platform-catalog-service` ; base = `catalog_service` ; préfixes REST `/api/v1/catalog` (lecture) et `/api/v1/catalog/admin` (écriture).
- **Ordre EPIC-007** : STORY-031 (scaffold ✅) → **032 (catalogue — cette story)** → 033 (entitlements) → 034 (événements). STORY-033 **dépend** du registre livré ici.

---

## Progress Tracking

**Historique des statuts :**
- 2026-07-13 : Créée par vivian (BMAD Scrum Master — `/bmad:create-story`).
- 2026-07-13 : Implémentée + vérifiée docker bout-en-bout par Claude (BMAD dev-story). ✅ Done.

**Effort réel :** 5 points (conforme à l'estimation).

---

## Revue & validation (2026-07-13)

**Livré** (`platform-catalog-service/src/modules/catalog/`)
- **3 schémas orthogonaux (C2)** : `Module` (code unique), `ModuleVersion` (axe code, index unique `(moduleCode,version)` + `(moduleCode,status)`), `ReferentielVersion` (axe données, index unique `(code,version)`, **sans `moduleCode`**, pointeur `artifactUri` + `checksum` — C3). Enums `ModuleStatus` (ACTIVE|DEPRECATED) / `VersionStatus` (ACTIVE|DEPRECATED|RETIRED).
- **3 services** : `ModulesService` (CRUD + `ACTIVE↔DEPRECATED`), `ModuleVersionsService` (publication + **garde-fou N/N-1** par majeure semver + machine d'états), `ReferentielVersionsService` (idem, orthogonal). Machine d'états factorisée dans `version-lifecycle.ts` (`resolveVersionTransition` : transitions descendantes only, `deprecationDate` exigée au passage DEPRECATED). Unicité en **pré-check applicatif** + index Mongo (filet anti-course).
- **2 contrôleurs** : `CatalogAdminController` (`@Roles(PLATFORM_ADMIN)`, `/catalog/admin/*`) et `CatalogReadController` (`@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`, `/catalog/*` — lecture publiée **hors RETIRED**). DTO `class-validator` (semver, sha256, kebab-case, enums). Swagger tags `Catalog Admin` / `Catalog`.
- **`DiagnosticsModule`/`whoami` retirés** (remplacés par les contrôleurs catalogue) ; `app.module` recâblé (`CatalogModule`). Aucun Redis/MinIO ajouté.

**Tests**
- **lint 0**, build OK. **137 unit (21 suites) + 24 e2e (2 suites)** verts. Couverture **100 % / 100 / 100 / 100** sur `src/modules/catalog/**` (seuils 65/90/90/90 largement tenus).
- e2e `catalog.e2e-spec.ts` (remplace `whoami.e2e-spec.ts`) : parcours admin complet (module → 2 majeures → **refus 3ᵉ (N/N-1)** → dépréciation → succès), doublon 409, semver 400, module inexistant 404, transition illégale 409, DEPRECATED sans date 400, référentiel create/dup/checksum, **exclusion RETIRED** en lecture publiée (modules + référentiels), **RBAC** (TENANT_ADMIN→403 admin, TENANT_USER→403 lecture), et câblage JWKS (sans jeton/HS256 forgé/aud incorrecte → 401).

**Vérification docker bout-en-bout** (stack racine dev : `auth-service:3001`, `platform-catalog-service:3003`, `mongo` rs0, `kafka`) :
- `/health` catalog → 200 (`mongodb` + `kafka` up, **pas de redis**).
- login `PLATFORM_ADMIN` (IdP) → **JWT RS256** `aud:[expert-comptable, kyc-service, platform-catalog-service]`, `org:null`, `roles:[PLATFORM_ADMIN]`.
- Sur le **service réel + Mongo réel** : create module **201**, versions `1.2`/`2.0` **201**, `3.0` **409 (N/N-1)**, doublon `2.0` **409**, semver invalide **400**, module fantôme **404**, dépréciation `1.2` **200**, `3.0` re-publiée **201**, transition illégale `ACTIVE→RETIRED` **409**, référentiel **201**. `GET /catalog/modules` **200** (bilan : `3.0`/`2.0` ACTIVE, `1.2` DEPRECATED+date, tri version desc). Négatifs : sans jeton **401**, **HS256 forgé 401** (algorithm-confusion écartée).

**Reste**
- `/code-review` formel (niveau ≥ high).
- Push `MNV-032` + PR vers `dev` sur `prospera-platform-catalog-service`.
- **STORY-033** (entitlements `(org × module)` : valident leur cohérence contre ce catalogue — module/version/référentiel existants **et** non `RETIRED`).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
*Prochaine étape : STORY-033 (entitlements `(org × module)` + validation de cohérence contre ce catalogue).*
