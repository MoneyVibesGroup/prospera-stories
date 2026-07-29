# STORY-143 : `admin-panel` BFF — proxy des lectures d'entitlements (par org, par module) + surface Projets, avec résolution des noms d'organisation

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `tech-spec-admin-panel-2026-07-10.md` · **STORY-047** (patron de lecture agrégée + `SourceStatus`) · **STORY-048** (écritures proxifiées) · **STORY-106** (guards par permission au BFF) · **STORY-141** (Projets) · **STORY-142** (index inverse)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-28
**Sprint :** 18
**Service :** `admin-panel` (:3010) — 1 dépôt (`prospera-admin-panel-service`), 1 branche, 1 PR
**Branche :** `MNV-143`

> **⚠️ SCINDÉE EN 3 INCRÉMENTS le 2026-07-29** — l'amont de 8 des 9 routes n'existe pas
> (STORY-141 et STORY-142 sont `not_started`, vérifié sur `origin/dev` de
> `platform-catalog-service` à `2df9cc8` : pas de route `by-module`, pas de module `projects`).
> C'est exactement le cas prévu par la section *Dépendances et ordre* ci-dessous.
> **Incrément 1 ✅ LIVRÉ le 2026-07-29** (PR #7 rebase-mergée sur `dev`) :
> `GET /admin/orgs/:orgId/entitlements` — **AP-05 débloquée**.
> La story **reste ouverte** pour les incréments 2 et 3. Voir *Incréments de livraison*.

---

## Contexte

**Un trou de contrat trouvé en vérifiant `origin/dev`** (`prospera-admin-panel-service`, `0521258`).
Le BFF proxifie les **écritures** d'entitlements mais **aucune lecture** :

| Route BFF existante | |
|---|---|
| `PUT /admin/orgs/:orgId/entitlements/:moduleCode` | octroi ✅ |
| `DELETE /admin/orgs/:orgId/entitlements/:moduleCode` | révocation ✅ |
| *(aucune)* | **lecture ❌** |

Conséquence directe : **AP-05 est marquée `ready-for-dev` alors que son tout premier critère
d'acceptation — « liste des entitlements d'une org » — n'a aucune route à appeler.** Le front admin
ne parle qu'au BFF. C'est le même schéma que le blocage d'AP-08 sur STORY-106, et il n'a pas été vu.

S'y ajoutent les deux besoins nouveaux : la lecture inverse (STORY-142) et la surface Projets
(STORY-141), qui n'ont eux non plus aucun chemin vers le front.

---

## Périmètre

**Inclus :**

### Lectures d'entitlements
| Route BFF | Amont | Permission |
|---|---|---|
| `GET /admin/orgs/:orgId/entitlements` | `GET /entitlements/:orgId` | `org:read` |
| `GET /admin/modules/:moduleCode/organizations` | `GET /entitlements/by-module/:moduleCode` (139) | `catalog:read` |
| `GET /admin/modules/:moduleCode/summary` | `.../summary` (139) | `catalog:read` |

### Résolution des noms d'organisation — la valeur ajoutée du BFF
`platform-catalog` ne renvoie que des `organizationId` opaques (décision assumée, STORY-142 §b).
Le BFF **compose** : il enrichit chaque ligne avec `{ name, country, status }` lus depuis
`auth-service`, en **un seul appel groupé** (pas N+1).
- Si `auth-service` ne répond pas : appliquer le patron **`SourceStatus`** de STORY-047 — la liste
  est renvoyée avec les identifiants et `organizationSource: "degraded"`, **jamais une erreur 500**.
  L'écran AP-10 sait afficher une source dégradée (patron AP-02).

### Surface Projets
| Route BFF | Amont | Permission |
|---|---|---|
| `POST /admin/projects` | `POST /projects` | `project:manage` |
| `GET /admin/projects?organizationId=` | `GET /projects` | `project:read` |
| `GET /admin/projects/:id` | `GET /projects/:id` | `project:read` |
| `PATCH /admin/projects/:id` | `PATCH /projects/:id` | `project:manage` |
| `POST /admin/projects/:id/modules` | idem | `project:manage` |
| `DELETE /admin/projects/:id/modules/:moduleCode` | idem | `project:manage` |

**Hors périmètre :**
- L'UI → **AP-10** / **AP-11**.
- Toute logique métier : le BFF proxifie et compose, il n'arbitre pas. Les 409 de validation
  viennent de l'amont et sont **relayés tels quels** (message compris).

---

## Incréments de livraison *(scission du 2026-07-29)*

Le périmètre ci-dessus reste la cible. Il se livre en **trois fois**, parce que l'amont de 8 routes
sur 9 n'est pas écrit. État constaté sur `origin/dev` de `platform-catalog-service` (`2df9cc8`) :

| Amont attendu | Existe ? |
|---|---|
| `GET /catalog/entitlements/:orgId` | ✅ (STORY-032/033) |
| `GET /catalog/entitlements/by-module/:moduleCode` + `/summary` | ❌ — **STORY-142 `not_started`** |
| `POST/GET/PATCH /catalog/projects…` | ❌ — **STORY-141 `not_started`** |

### Incrément 1 — ✅ livré (MNV-143)
`GET /admin/orgs/:orgId/entitlements`, permission `org:read`, filtre `status` relayé.
**Aucune dépendance** : l'amont existe. **Débloque AP-05**, dont le 1ᵉʳ critère d'acceptation
n'avait aucune route à appeler.

### Incrément 2 — ⛔ bloqué par STORY-142
`GET /admin/modules/:moduleCode/organizations` + `/summary`, permission `catalog:read`,
**et** la résolution des noms d'organisation (`organization-resolver.service.ts`, appel groupé,
dégradation de source). Sans l'index inverse amont, il n'y a rien à proxifier ni à enrichir.
⚠️ `catalog:read` n'entre au `PERMISSION_CATALOG` **qu'avec** cet incrément (règle d'or : une
permission n'existe que si un guard la vérifie).

### Incrément 3 — ⛔ bloqué par STORY-141
Les 6 routes Projets, permissions `project:read` / `project:manage` — mêmes réserves sur
l'entrée des deux permissions au catalogue.

> **Ordre recommandé** : 142 → incrément 2, 141 → incrément 3. Les deux incréments restants
> se rouvrent sur **cette même story** (pas de nouvelle story) : le périmètre, les critères et
> les notes techniques ci-dessous restent valables tels quels.

---

## Critères d'acceptation

*Chaque critère porte son incrément (cf. §Incréments de livraison).*

- [x] **[inc. 1]** `GET /admin/orgs/:orgId/entitlements` renvoie les entitlements de l'org — **AP-05 débloquée**.
- [x] **[inc. 1]** Filtre `status` **validé au BFF** (`ACTIVE|SUSPENDED|REVOKED`) puis relayé ; une valeur hors énumération → **400** au BFF, sans toucher l'amont.
- [x] **[inc. 1]** `catalog` est ici la source **primaire** : son `403` reste un **403**, sa panne un **503** — jamais une liste vide présentée comme un succès.
- [ ] **[inc. 2]** `GET /admin/modules/:moduleCode/organizations` renvoie les organisations **avec leur nom**, paginé, filtre `status` relayé.
- [ ] **[inc. 2]** La résolution des noms se fait en **un appel groupé** ; un test prouve l'absence de N+1.
- [ ] **[inc. 2]** `auth-service` indisponible → **200** avec la source d'identité dégradée et les identifiants, jamais 500.
- [ ] **[inc. 3]** Les 6 routes Projets proxifient correctement ; un **409** amont (module non entitlé) est relayé avec son message.
- [x] **[inc. 1]** *(les incréments 2/3 le rejoueront pour leurs routes)* Chaque route porte son `@RequirePermissions` ; un acteur sans la permission → **403** au BFF, avant l'amont.
- [x] **[inc. 1]** Aucun champ interne Mongo (`_id`, `__v`) ne fuit — le piège trouvé par STORY-104, à re-tester ici. **Renforcé** : le BFF re-projette champ par champ (liste blanche) au lieu de traverser le corps amont, donc une fuite amont ne traverse pas.
- [x] **[inc. 1]** Non-régression de routage : `/admin/orgs/:orgId/entitlements` n'est **pas** capté par le `@Get(':orgId')` d'`AdminOrgsController` — **prouvé par un test**, pas supposé.
- [ ] **[inc. 2]** Pagination : plafond appliqué, arrêt de pagination fiable (correctif MNV-107 à ne pas régresser).
- [x] **[inc. 1]** Vérification docker bout-en-bout : un opérateur porteur d'`org:read` lit `/admin/orgs/:orgId/entitlements` → **200** ; un `TENANT_ADMIN` → **403** au BFF.
- [ ] **[inc. 2/3]** Vérification docker : un `PLATFORM_ACCOUNTANT` lit `/admin/modules/bilan/organizations` → **200** ; tente `POST /admin/projects` → **403**.

---

## Dépendances et ordre

- **STORY-142 requise** pour les deux routes `by-module` (sinon aucun amont à appeler).
- **STORY-141 requise** pour les 6 routes Projets.
- La route `GET /admin/orgs/:orgId/entitlements` **ne dépend de rien** : l'amont existe déjà.
  → **Elle peut être livrée seule et immédiatement**, ce qui débloque AP-05 sans attendre 138/139.
  **Recommandation : la sortir en premier**, quitte à scinder cette story en deux livraisons.

---

## Notes techniques

| Élément | Fichier (proposé) | Nature |
|---|---|---|
| Lectures entitlements | `src/admin/catalog/admin-entitlements.controller.ts` | Nouveau |
| Projets | `src/admin/projects/admin-projects.controller.ts` | Nouveau |
| Composition des noms | `src/admin/shared/organization-resolver.service.ts` | Nouveau |

**Vigilance :**
- **`SourceStatus`** : réutiliser le type de STORY-047, ne pas en inventer un second.
  ⚠️ **Correction du 2026-07-29** — ses valeurs réelles sont
  **`ok` / `absent` / `forbidden` / `unavailable`** (`src/upstream/upstream-error.ts`), **pas**
  `degraded` comme écrit plus haut dans cette story. `absent` (404 amont, « rien à afficher »)
  et `unavailable` (panne de transport) sont **délibérément distincts** : les confondre a déjà
  produit un mensonge d'affichage en STORY-106. L'incrément 2 doit donc renvoyer
  `unavailable`, jamais un `degraded` inexistant.
- **Route de COLLECTION amont** : `GET /catalog/entitlements/:orgId` renvoie `200 []` pour une org
  inconnue — il n'a **pas** de 404 métier. Un 404 y signifie donc **route cassée / URL amont mal
  configurée** et doit devenir un **503**, jamais un 404 relayé (même raisonnement que
  `mapKycPrimaryError`, STORY-107).
- Le BFF est **same-origin** avec le front admin : pas de CORS à activer (noté dans le tracker).

---

## Definition of Done

*Portée sur l'**incrément 1** ; les incréments 2/3 la rejoueront à leur livraison.*

- [ ] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [ ] `lint` / `typecheck` / `test` / `build` verts.
- [ ] OpenAPI à jour — le front génère ses types depuis lui (règle Integration Gate).
- [ ] Vérification docker bout-en-bout tracée.
- [ ] Branche `MNV-143`, PR vers `dev`.

---

## Progress Tracking

**2026-07-29 — cadrage révisé, scission en 3 incréments.**
Constat d'amont sur `origin/dev` de `platform-catalog-service` (`2df9cc8`) : seule
`GET /catalog/entitlements/:orgId` existe. `by-module`/`summary` (STORY-142) et le module
`projects` (STORY-141) sont absents, les deux stories étant `not_started`. La story est donc
livrée par incréments, comme sa propre section *Dépendances et ordre* le recommandait.

**2026-07-29 — incrément 1 développé et validé.**

*Portes de qualité (`admin-panel`)* : lint 0 warning · `nest build` OK · **240 tests unitaires**
verts, couverture globale **99,84 / 92,9 / 100 / 99,83** (seuils 65/90/90/90) dont **100 % sur les
deux fichiers neufs** · **108 e2e** verts (6 suites), dont 19 pour cette route.

*Mutation-test — 5 mutations, 5 fois rouge* (un test qu'un code bugué franchit ne prouve rien) :

| Mutation | Effet attendu | Résultat |
|---|---|---|
| Projection rendue passante (`...entitlement` dans le retour) | la fuite `_id`/`__v` doit être vue | 🔴 1 test |
| Garde `Array.isArray` retirée | réponse amont non conforme → 500 au lieu de 503 | 🔴 3 tests |
| Branche `403` inversée dans `mapPrimaryError` | 403 amont ne serait plus distingué d'une panne | 🔴 5 tests |
| Liste blanche `orgId` élargie à `.*` | `..%2F..` traverserait | 🔴 3 tests |
| **Les deux** `@RequirePermissions` retirés | route béante | 🔴 2 tests |

⚠️ La 5ᵉ est celle qui compte : retirer **seulement** le décorateur du handler laisse le plancher de
classe s'appliquer et le test reste **vert** — c'est le faux positif de mutation relevé en STORY-139.
La mutation probante retire **les deux**.

### Vérification docker — stack réelle, pas de mock

`mongo` + `kafka` + `redis` + `auth-service` + `platform-catalog-service` + `admin-panel`.
Route confirmée montée dans les logs : `Mapped {/api/admin/orgs/:orgId/entitlements, GET}`.
Amorçage réel : `seed:admin` → opérateur `PLATFORM_ADMIN` (8 perms, `org: null`) ; `register` →
org `6a69ce9d805b26d83a06357b` + `TENANT_ADMIN` ; module `bilan` v`1.0.0` créé au catalogue ;
entitlement octroyé **par le BFF** (`PUT`, `201`).

| # | Cas | Attendu | Obtenu |
|---|---|---|---|
| A | `GET /admin/orgs/:orgId/entitlements` (PLATFORM_ADMIN) | 200 + l'entitlement | **200**, `bilan` v1.0.0 `ACTIVE` |
| B | `?status=REVOKED` | filtre appliqué **par l'amont** | **200 `[]`** (l'entitlement est `ACTIVE`) |
| C | `?status=PENDING` | 400 au bord | **400**, amont non appelé |
| D | sans jeton | 401 | **401** |
| E | `TENANT_ADMIN` sur **sa propre** org | 403 **au BFF** | **403** |
| E-bis | le **même** jeton en direct sur l'amont | 200 (`assertCanReadOrg` l'autorise) | **200** → le 403 vient bien du **BFF**, pas de l'amont |
| F | `orgId` = `..%2F..` | 400, sans appel amont | **400** `orgId invalide.` |
| G | `orgId` inconnu bien formé | 200 `[]` (miroir de l'amont, pas un 404 inventé) | **200 `[]`** |
| H | document réel en base (`catalog_service.entitlements`) | porte `_id` et `__v` | confirmé — **et ni l'un ni l'autre n'apparaît dans la réponse A** |
| I | `platform-catalog-service` **arrêté** | 503, jamais `200 []` | **503** |
| I-bis | **contre-épreuve** — `GET /admin/orgs/:orgId` pendant la même coupure | l'agrégat **dégrade** | **200** + `sources.entitlements: "unavailable"` |

**I / I-bis est le cœur de la vérification** : une seule et même panne, deux comportements
**délibérément opposés** selon le rôle de la source. Sans la contre-épreuve, le 503 aurait pu venir
d'une dégradation cassée plutôt que d'un choix de conception.

**H** est la preuve de l'étanchéité côté **stack réelle** : le document Mongo porte bien
`_id: ObjectId(...)` et `__v: 0`, et la réponse HTTP n'en contient aucun (elle expose `grantedBy`
en chaîne, là où la base stocke un `ObjectId`).

### Revue de code — 3 constats, tous corrigés avant merge

Aucun bloquant. Trois constats de robustesse du **contrat exposé**, dans un commit dédié
(`cc85095`), chacun mutation-testé rouge pour ne pas ajouter de test de complaisance :

1. **`referentiel: null` amont traversait en `null`.** L'OpenAPI l'annonce *optionnel*, pas
   *nullable* : le front génère `referentiel?: {...}` et ne teste donc jamais `null`. Ternaire
   explicite → le champ est **absent**, comme annoncé.
2. **`config` absent amont produisait une réponse sans un champ déclaré REQUIS** — une réponse qui
   contredit le schéma dont le front dérive ses types. `?? {}`.
3. **La garde `Array.isArray` *paraissait* morte.** `raw` étant typé `Entitlement[]`, TypeScript
   réduisait la branche à `never` : le prochain lecteur l'aurait supprimée comme inutile. Elle ne
   l'est pas — un type décrit un **contrat amont**, il ne contraint rien à l'exécution. `raw` est
   désormais `unknown`, ce qui dit la vérité.

Le correctif touchant la projection déjà vérifiée en docker, les cas **A** et **H** ont été
**rejoués sur l'état final** (réponse identique, toujours aucun `_id`/`__v`) — aucun résultat
mesuré avant correctif n'est reporté ici.

### Revue de sécurité — 0 vulnérabilité

Publiée sur la PR. Quatre points examinés en priorité :

- **SSRF par relais du bearer** — `orgId` est concaténé dans l'URL amont et l'appel porte le jeton
  de l'appelant ; détourner l'hôte le livrerait à un tiers. Fermé **deux fois** (encodage
  d'`encodeURIComponent` **et** liste blanche au bord) ; `baseUrl` vient uniquement de la config.
- **IDOR / isolation multi-tenant** — ce n'en est pas un : `org:read` est une permission
  *plateforme*, qu'aucun rôle tenant ne détient (D15), et le BFF s'avère **plus strict** que
  l'`assertCanReadOrg` amont (cas E/E-bis).
- **Chaîne de gardes** — plancher deny-by-default classe + handler ; `ThrottlerGuard` reste en tête
  de la chaîne globale, la route neuve en hérite.
- **Fuite de données** — projection par liste blanche, messages d'erreur génériques, bearer jamais
  journalisé (`LoggingInterceptor` n'écrit que `method url status duration`).

*Vigilance transmise à AP-10/AP-11* : `config` est de forme libre et transmis tel quel (il ne peut
pas être mis en liste blanche sans casser chaque nouveau module) — l'écran devra le rendre en
**texte**, jamais en HTML. Sa source reste un porteur d'`entitlement:grant`, donc privilégiée.

### Intégration

PR **#7** `MNV-143(admin-panel)` → **rebase-mergée sur `dev`** le 2026-07-29, branche supprimée.
Commits `afb8cf2` (incrément) + `1698f28` (revue).

**Statut :** incrément 1 **livré**. La story reste **ouverte** pour les incréments 2 et 3, bloqués
par STORY-142 et STORY-141 respectivement.
