# STORY-143 : `admin-panel` BFF — proxy des lectures d'entitlements (par org, par module) + surface Projets, avec résolution des noms d'organisation

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `tech-spec-admin-panel-2026-07-10.md` · **STORY-047** (patron de lecture agrégée + `SourceStatus`) · **STORY-048** (écritures proxifiées) · **STORY-106** (guards par permission au BFF) · **STORY-141** (Projets) · **STORY-142** (index inverse)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** medium
**Statut :** done
**Clôturée le :** 2026-07-29
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-28
**Sprint :** 18
**Services :** `admin-panel` (:3010) · `auth-service` (:3001, **filtre `?ids=` ajouté pour l'incrément 2**)
**Branches :** `MNV-143` (inc. 1, `admin-panel` seul) puis `MNV-143` × **2 dépôts** (inc. 2+3)

> ## Arbitrages des incréments 2 et 3 (2026-07-29)
>
> ### 1. `auth-service` gagne un filtre `?ids=` — la story passe à **2 dépôts**
>
> Le critère « la résolution des noms se fait en **un appel groupé** » était **inapplicable en
> l'état** : `GET /admin/organizations` n'accepte que `page`, `limit`, `status`, `q`. Aucun moyen,
> depuis le BFF seul, de demander « ces 100 organisations-là ».
>
> Les deux options à un dépôt étaient toutes deux mauvaises : un appel **par ligne** (le N+1 que le
> critère interdit), ou le **téléchargement du parc entier** à chaque requête — un « appel groupé »
> qui ramène toute la table n'en est pas un, c'est un fetch non borné qui se dégrade **précisément
> quand la plateforme grandit**, et dont le correctif ultérieur aurait été ce même filtre amont plus
> une réécriture du BFF.
>
> `?ids=` est donc ajouté à `auth-service` : tableau d'`ObjectId` validés, `$in`, **plafonné à 100 et
> rejeté au-delà** (jamais tronqué — une réponse partielle que l'appelant croirait exhaustive
> afficherait des lignes sans nom sans que rien ne le signale). Coût de la résolution : **borné par
> la page**, pas par le parc.
>
> ### 2. Les routes `by-module` sont gardées par **`org:read`**, pas `catalog:read`
>
> Le tableau du périmètre annonce `catalog:read`. Il a été écrit **avant** que STORY-142 ne livre
> l'amont, qui a tranché l'inverse : ces deux routes y sont gardées par **`org:read`**, au motif que
> « la donnée renvoyée EST de la donnée d'organisation » et que garder le sens inverse plus
> faiblement ouvrirait, sur la même donnée, **une seconde porte plus basse**.
>
> **Mesuré en vérification docker**, pas déduit : un jeton `catalog:read` **seul** franchissait le
> panel puis se faisait refuser en `403` par `catalog`. La garde du BFF était donc **décorative** —
> elle ratait sa seule raison d'être, refuser **tôt** — et elle rouvrait en façade la porte que 142
> avait fermée. Le panel s'aligne sur l'autorité. Les 3 rôles métier visés portent tous `org:read` :
> aucun persona ne perd l'accès visé.
>
> ### 3. Le `409` amont traverse **avec son message** — exception assumée
>
> Partout ailleurs, `rethrowUpstreamError` neutralise le texte amont. Ici le `409` **est**
> l'information utile : « Le module « stock » n'est pas accordé… » dit **quel** module corriger. Le
> message générique rendrait AP-11 inutilisable — on saurait que ça échoue, jamais pourquoi. Trois
> bornes gardent l'exception : **le 409 seulement**, **le champ `message` seulement et seulement s'il
> est une chaîne**, **tronqué** avec repli générique.

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
| `GET /admin/modules/:moduleCode/organizations` | `GET /entitlements/by-module/:moduleCode` (**142**) | ~~`catalog:read`~~ → **`org:read`** (arbitrage 2) |
| `GET /admin/modules/:moduleCode/summary` | `.../summary` (**142**) | ~~`catalog:read`~~ → **`org:read`** (arbitrage 2) |

### Résolution des noms d'organisation — la valeur ajoutée du BFF
`platform-catalog` ne renvoie que des `organizationId` opaques (décision assumée, STORY-142 §b).
Le BFF **compose** : il enrichit chaque ligne avec `{ name, country, status }` lus depuis
`auth-service`, en **un seul appel groupé** (pas N+1).
- Si `auth-service` ne répond pas : appliquer le patron **`SourceStatus`** de STORY-047 — la liste
  est renvoyée avec les identifiants et `organizationSource: "unavailable"` (⚠️ **pas** `degraded`,
  qui n'existe pas dans le type — cf. §Notes techniques), **jamais une erreur 500**.
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

### Incrément 2 — ✅ livré (2026-07-29), STORY-142 étant mergée
`GET /admin/modules/:moduleCode/organizations` + `/summary`, **et** la résolution des noms
d'organisation (`organization-resolver.service.ts`, appel groupé, dégradation de source).

⚠️ **Deux points du cadrage ci-dessus sont périmés, corrigés à la livraison :**
1. **Permission `org:read`, PAS `catalog:read`** (cf. §Arbitrages, point 2). Le cadrage a été écrit
   avant que STORY-142 ne livre l'amont, qui a tranché l'inverse.
2. **`catalog:read` était déjà entrée au `PERMISSION_CATALOG`** avec STORY-140 : la réserve sur la
   règle d'or est sans objet.

### Incrément 3 — ✅ livré (2026-07-29), STORY-141 étant mergée
Les 6 routes Projets, permissions `project:read` / `project:manage`. Ces deux codes sont entrés au
`PERMISSION_CATALOG` avec **STORY-141**, dans le commit qui livrait leur guard amont : la réserve
sur la règle d'or est également sans objet.

> **Ordre recommandé** : 142 → incrément 2, 141 → incrément 3. Les deux incréments restants
> se rouvrent sur **cette même story** (pas de nouvelle story) : le périmètre, les critères et
> les notes techniques ci-dessous restent valables tels quels.

---

## Critères d'acceptation

*Chaque critère porte son incrément (cf. §Incréments de livraison).*

- [x] **[inc. 1]** `GET /admin/orgs/:orgId/entitlements` renvoie les entitlements de l'org — **AP-05 débloquée**.
- [x] **[inc. 1]** Filtre `status` **validé au BFF** (`ACTIVE|SUSPENDED|REVOKED`) puis relayé ; une valeur hors énumération → **400** au BFF, sans toucher l'amont.
- [x] **[inc. 1]** `catalog` est ici la source **primaire** : son `403` reste un **403**, sa panne un **503** — jamais une liste vide présentée comme un succès.
- [x] **[inc. 2]** `GET /admin/modules/:moduleCode/organizations` renvoie les organisations **avec leur nom**, paginé, filtre `status` relayé.
- [x] **[inc. 2]** La résolution des noms se fait en **un appel groupé** ; un test prouve l'absence de N+1. *(a exigé le filtre `?ids=` amont — cf. arbitrage 1)*
- [x] **[inc. 2]** `auth-service` indisponible → **200** avec la source d'identité dégradée et les identifiants, jamais 500. *(`unavailable`, jamais le `degraded` inexistant)*
- [x] **[inc. 3]** Les 6 routes Projets proxifient correctement ; un **409** amont (module non entitlé) est relayé avec son message.
- [x] **[inc. 1]** *(les incréments 2/3 le rejoueront pour leurs routes)* Chaque route porte son `@RequirePermissions` ; un acteur sans la permission → **403** au BFF, avant l'amont.
- [x] **[inc. 1]** Aucun champ interne Mongo (`_id`, `__v`) ne fuit — le piège trouvé par STORY-104, à re-tester ici. **Renforcé** : le BFF re-projette champ par champ (liste blanche) au lieu de traverser le corps amont, donc une fuite amont ne traverse pas.
- [x] **[inc. 1]** Non-régression de routage : `/admin/orgs/:orgId/entitlements` n'est **pas** capté par le `@Get(':orgId')` d'`AdminOrgsController` — **prouvé par un test**, pas supposé.
- [x] **[inc. 2]** Pagination : plafond appliqué **au bord** (100), jamais rejeté — correctif MNV-107 non régressé.
- [x] **[inc. 1]** Vérification docker bout-en-bout : un opérateur porteur d'`org:read` lit `/admin/orgs/:orgId/entitlements` → **200** ; un `TENANT_ADMIN` → **403** au BFF.
- [x] **[inc. 2/3]** Vérification docker : un `PLATFORM_ACCOUNTANT` lit `/admin/modules/bilan/organizations` → **200** ; tente `POST /admin/projects` → **403**.

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

*Rejouée à la livraison des incréments 2 et 3.*

- [x] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [x] `lint` / `typecheck` / `test` / `build` verts **sur les 2 dépôts**.
- [x] OpenAPI à jour — le front génère ses types depuis lui (règle Integration Gate).
- [x] Vérification docker bout-en-bout tracée.
- [x] Branches `MNV-143` × 2 dépôts, 2 PR vers `dev`.

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

**Statut à la date du 2026-07-29 (matin)** : incrément 1 **livré**, story **ouverte** pour les
incréments 2 et 3, bloqués par STORY-142 et STORY-141 respectivement. *(Les deux ont été mergées le
jour même — voir la section suivante.)*

---

## 2026-07-29 — incréments 2 et 3 livrés, story CLÔTURÉE

STORY-142 et STORY-141 ayant été mergées sur `dev`, les deux amont manquants existent. Les deux
incréments restants sont livrés ensemble, sur **2 dépôts** (cf. arbitrage 1 : `auth-service` gagne le
filtre `?ids=` sans lequel « un appel groupé » était inapplicable).

### Portes DoD

| Dépôt | Lint | Build | Couverture (S/B/F/L) | Unit | e2e |
|---|---|---|---|---|---|
| `admin-panel` | 0 warning | ✅ | 99,64 / 91,05 / **100** / 99,61 | 315 ✅ | 151 ✅ |
| `auth-service` | 0 warning | ✅ | 96,90 / 89,60 / 97,81 / 96,94 | 615 ✅ | 160 ✅ |

**100 % lignes et fonctions** sur les 5 fichiers neufs du BFF.

### Mutation-tests — 7 mutations, 7 fois rouge

| # | Mutation appliquée | Résultat |
|---|---|---|
| M1 | `TAILLE_LOT = 1` (résolution redevenue **N+1**) | 🔴 3 unitaires |
| M2 | la dégradation d'identité annoncée **`ok`** (le mensonge d'affichage) | 🔴 3 unitaires |
| M3 | le `409` amont **perd son message** (générique) | 🔴 3 unitaires + 1 e2e |
| M4 | le message amont relayé **sans filtre de type ni troncature** | 🔴 3 unitaires |
| M5 | `PermissionsGuard` neutralisé dans la chaîne e2e des Projets | 🔴 4 e2e — les 6 routes deviennent béantes |
| M6 | `limit` non cadré sur `ids` (résolution **tronquée à 20**) | 🔴 1 e2e (`auth-service`) |
| M7 | le `$in` reçoit des **chaînes** au lieu d'`ObjectId` (filtre stérile, `200 []` muet) | 🔴 1 unitaire (`auth-service`) |

M7 rejoue délibérément le piège trouvé en STORY-141 : un filtre qui ne caste pas ne matche rien,
**sans erreur**.

### 🔴 Le défaut trouvé par la vérification docker

Un jeton `catalog:read` **seul** franchissait le panel puis se faisait refuser en **403 par
`catalog`** : la garde du BFF était **décorative**. Elle ratait sa seule raison d'être — refuser
**tôt**, sans payer l'aller-retour — et elle rouvrait en façade la « seconde porte plus basse » que
STORY-142 avait explicitement fermée : le panel annonçait une route à un persona incapable de s'en
servir. Corrigé (`org:read`), **vérification rejouée** : refus prononcé par le BFF, **0 appel amont**
déclenché.

### Vérification docker — stack neuve (`down -v`), `auth` + `catalog` + `admin-panel`

Les 8 routes confirmées montées dans les logs. Amorçage **réel** : 2 organisations créées par
`register` (vrais `ObjectId`, vraies raisons sociales), modules `bilan`/`stock` au catalogue,
entitlements octroyés — `bilan` chez les deux orgs, `stock` chez la première seulement.

| # | Cas | Attendu | Obtenu |
|---|---|---|---|
| 1 | `GET /admin/modules/bilan/organizations` | 200 + **raisons sociales** | **200**, « Cabinet Numéro 1 / 2 », `organizationSource: ok` |
| 2 | résolution groupée | **1** appel amont pour la page | **1** (tracé dans les logs `auth-service`) |
| 3 | 🟡 `auth-service` **arrêté** | 200 dégradé, identifiants conservés | **200**, `organizationSource: unavailable`, 2 lignes, `organizationName: null` |
| 4 | 🔀 **contre-épreuve** : `catalog` **arrêté** | **503**, jamais une page vide | **503** sur `by-module` **et** sur `/admin/projects` |
| 5 | `POST /admin/projects` (modules entitlés) | 201 | **201** |
| 6 | `POST /admin/projects` avec `stock` chez l'org **non entitlée** | 409 **nommant le module** | **409** « Le module « stock » n'est pas accordé (entitlement ACTIVE) à cette organisation. » |
| 7 | module inexistant au catalogue | 409 nommé | **409** « Le module « fantome » n'existe pas au catalogue. » |
| 8 | révocation puis `GET /admin/projects/:id` | module conservé, `REVOKED` exposé | **`moduleCodes: [bilan, stock]`**, `stock → REVOKED` |
| 9 | `POST /:id/modules` | **200** (pas le 201 par défaut de Nest) | **200** |
| 10 | dissociation d'un module **révoqué** | 200 | **200**, périmètre nettoyé |
| 11 | archivage puis modification du périmètre | 409 **message amont relayé** | **409** « … est archivé : réactivez-le avant… » |
| 12 | `catalog:read` seul (après correctif) | **403 au BFF**, 0 appel amont | **403**, **0** appel amont |
| 13 | `PLATFORM_ACCOUNTANT` réel | 200 sur `by-module`, 403 sur `POST /projects` | **200** / **403** — le critère d'acceptation |

**3/4 est le cœur de la vérification** : une seule et même panne, deux comportements **délibérément
opposés** selon le rôle de la source. Sans la contre-épreuve, le `503` aurait pu venir d'une
dégradation cassée plutôt que d'un choix de conception.

**Matrice RBAC sur jetons RS256 réels** (rôles non-système composés via l'API, une seule permission
chacun) :

| Requête (via le BFF) | `project:read` | `project:manage` | `catalog:read` | admin | sans jeton |
|---|---|---|---|---|---|
| `GET /admin/modules/bilan/organizations` | 403 | 403 | **403** | 200 | 401 |
| `GET /admin/projects?organizationId=` | **200** | 403 | 403 | 200 | 401 |
| `POST /admin/projects` | 403 | **201** | 403 | 201 | 401 |

La colonne `project:manage` est celle qui compte : **201 en écriture sans détenir `project:read`** —
le plancher de classe est bien un plancher surchargé, pas un ET.

### ⑥ Revue de code — aucun constat bloquant nouveau

Le seul défaut matériel de ces incréments a été trouvé **en phase ④, par la vérification docker**
(garde `catalog:read` décorative), et corrigé avant l'ouverture des PR — la vérification a été
**rejouée** sur l'état final. La relecture axe par axe du diff n'en a pas ajouté.

Points **activement contrôlés**, et ce qui les rend sûrs :

- **Le `@Transform` de `?ids=`** : `ids` absent ne produit pas `[undefined]` (sinon `@IsMongoId({each})`
  rejetterait toute liste non filtrée) — prouvé par le test de non-régression `limit: 20, ids: undefined`.
- **Le plafond dupliqué (100)** existe des deux côtés (`MAX_IDS` amont, `TAILLE_LOT` au BFF) : c'est
  une duplication K4 assumée, le découpage en lots n'étant qu'un **filet** — le chemin nominal tient
  toujours en un lot puisqu'une page vaut au plus 100 lignes.
- **`@Res({ passthrough: true })` sur `POST /admin/projects`** ne court-circuite ni le filtre
  d'exceptions ni les intercepteurs : le chemin d'erreur `409` traverse bien, prouvé en e2e.
- **Les trois gardes de forme** (`ModuleCodeParamsDto`, `ProjectParamsDto`, `ProjectModuleParamsDto`)
  reprennent le patron d'`OrgEntitlementsParamsDto` : liste blanche **au bord**, sans supposer que
  chaque intermédiaire du trajet traite `%2F` comme Express.

**Laissé de côté, assumé.** La dette tracée par l'incrément 1 — les routes préexistantes
(`admin/orgs/:orgId`, actions de STORY-048) concatènent leur `orgId` **sans** validation de forme —
reste ouverte : la traiter ici mélangerait un durcissement transverse à une story de contrat. Le
patron est désormais appliqué sur **5** fichiers de paramètres, ce qui rend la reprise mécanique.

### ⑦ Revue de sécurité — 0 vulnérabilité

Publiée sur les 2 PR. Points **mesurés contre les services en marche**, pas déduits :

- **SSRF par le chemin** — `moduleCode` et l'`id` de projet sont concaténés dans l'URL amont **et
  l'appel porte le bearer de l'appelant** : détourner l'hôte le livrerait à un tiers. Fermé **deux
  fois** (liste blanche au bord **et** `encodeURIComponent`). Six charges testées
  (`..%2F..`, `http:%2F%2Fevil.tld`, `bilan%2F..%2F..%2Fusers`, `%2E%2E%2F%2E%2E`…) → **400**, et
  **0 appel amont** déclenché. `baseUrl` ne vient que de la config.
- **Injection NoSQL par `?ids=`** — le paramètre finit dans un `$in`. Quatre charges testées
  (`ids[0][$ne]`, `ids[$ne]`, un objet JSON percent-encodé, un id non-ObjectId dans un lot valide)
  → **400** dans tous les cas. `@IsMongoId({ each: true })` rejette tout non-scalaire.
- **Pas d'élargissement d'accès par `?ids=`** — le filtre **restreint** une liste déjà servie ; la
  route reste gardée par `org:read`, qui donne déjà accès au parc entier. Aucune énumération nouvelle.
- **Isolation multi-tenant** — les 8 routes sont **plateforme**. Un `TENANT_ADMIN` (`perms: []` par
  construction, D15) reçoit **403** ; matrice RBAC vérifiée sur jetons RS256 réels ne portant qu'une
  seule permission chacun.
- **Le BFF n'affaiblit plus l'amont** — c'était le défaut trouvé en ④, et c'est l'axe sécurité de
  cette PR : `by-module` était gardé plus **faiblement** au panel (`catalog:read`) que chez l'autorité
  (`org:read`). Aligné, donc plus de « seconde porte plus basse » annoncée en façade.
- **DoS par paramètre** — `?ids=` plafonné à 100 **et rejeté au-delà** ; `pageSize` plafonné à 100
  **au bord** (et non seulement en amont), ce qui borne aussi le coût de la **résolution des noms**.
- **Fuite de données** — projection par liste blanche partout (aucun `_id`/`__v`, prouvé en e2e),
  refus **génériques** n'énumérant jamais la permission manquante, bearer jamais journalisé.
- **Relais du `409`** — la seule chaîne amont qui traverse. Bornée : `409` seulement, champ `message`
  seulement, **type chaîne exigé**, tronquée, repli générique. Les `409` de `catalog` sont des messages
  métier délibérés, sans état interne.

*Vigilance transmise à AP-11* — mesurée, pas supposée : un **nom de projet est saisi par
l'utilisateur** (2-80 caractères, sans restriction de jeu de caractères) et **réapparaît dans le
message `409` relayé** (`Un projet nommé « … » existe déjà`). Le BFF renvoie du **JSON**, où la
chaîne est échappée par le transport — il n'y a donc aucune injection à son niveau, et l'échapper en
HTML côté BFF corromprait les noms légitimes. **L'écran devra rendre ce message en texte, jamais en
HTML** — même consigne que pour `config` (incrément 1). L'auteur du nom est un porteur de
`project:manage`, donc un acteur privilégié.

### Intégration

PR **auth-service #16** et **admin-panel #10**, rebase-mergées sur `dev` le 2026-07-29, branches
supprimées. **Story CLÔTURÉE** : les 3 incréments sont livrés.