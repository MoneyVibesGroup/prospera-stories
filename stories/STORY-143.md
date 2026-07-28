# STORY-143 : `admin-panel` BFF — proxy des lectures d'entitlements (par org, par module) + surface Projets, avec résolution des noms d'organisation

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `tech-spec-admin-panel-2026-07-10.md` · **STORY-047** (patron de lecture agrégée + `SourceStatus`) · **STORY-048** (écritures proxifiées) · **STORY-106** (guards par permission au BFF) · **STORY-141** (Projets) · **STORY-142** (index inverse)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** draft
**Assigné à :** Unassigned
**Créée le :** 2026-07-28
**Sprint :** 18
**Service :** `admin-panel` (:3010) — 1 dépôt (`prospera-admin-panel-service`), 1 branche, 1 PR
**Branche :** `MNV-143`

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

## Critères d'acceptation

- [ ] `GET /admin/orgs/:orgId/entitlements` renvoie les entitlements de l'org — **AP-05 débloquée**.
- [ ] `GET /admin/modules/:moduleCode/organizations` renvoie les organisations **avec leur nom**, paginé, filtre `status` relayé.
- [ ] La résolution des noms se fait en **un appel groupé** ; un test prouve l'absence de N+1.
- [ ] `auth-service` indisponible → **200** avec `organizationSource: "degraded"` et les identifiants, jamais 500.
- [ ] Les 6 routes Projets proxifient correctement ; un **409** amont (module non entitlé) est relayé avec son message.
- [ ] Chaque route porte son `@RequirePermissions` ; un acteur sans la permission → **403** au BFF, avant l'amont.
- [ ] Aucun champ interne Mongo (`_id`, `__v`) ne fuit — le piège trouvé par STORY-104, à re-tester ici.
- [ ] Pagination : plafond appliqué, arrêt de pagination fiable (correctif MNV-107 à ne pas régresser).
- [ ] Vérification docker bout-en-bout : un `PLATFORM_ACCOUNTANT` lit `/admin/modules/bilan/organizations` → **200** ; tente `POST /admin/projects` → **403**.

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
- **`SourceStatus`** : réutiliser le type de STORY-047 (`ok` / `degraded` / `forbidden`), ne pas en
  inventer un second.
- Le BFF est **same-origin** avec le front admin : pas de CORS à activer (noté dans le tracker).

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [ ] `lint` / `typecheck` / `test` / `build` verts.
- [ ] OpenAPI à jour — le front génère ses types depuis lui (règle Integration Gate).
- [ ] Vérification docker bout-en-bout tracée.
- [ ] Branche `MNV-143`, PR vers `dev`.
