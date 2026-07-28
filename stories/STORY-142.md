# STORY-142 : `platform-catalog-service` — index inverse des entitlements : quelles organisations utilisent un module, et dans quelle version

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` · **STORY-032** (catalogue) · **STORY-033** (entitlements + index `{organizationId, moduleCode}`) · **STORY-140** (`catalog:read`)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** draft
**Assigné à :** Unassigned
**Créée le :** 2026-07-28
**Sprint :** à planifier
**Service :** `platform-catalog-service` (:3003) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-142`

---

## Contexte

Le PO veut, **depuis un module du catalogue**, ouvrir la liste des organisations qui l'utilisent et
voir **quelle version** chacune utilise.

**Ce qui manque, vérifié sur `origin/dev` (`89d6eb9`).** Les entitlements ne se lisent aujourd'hui
que **par organisation** :

| Route existante | Sens |
|---|---|
| `GET /entitlements/:orgId` | tous les modules d'**une org** |
| `GET /entitlements/:orgId/:moduleCode` | un couple précis |

Et les index confirment que c'est délibéré :
```
EntitlementSchema.index({ organizationId: 1, moduleCode: 1 }, { unique: true });
EntitlementSchema.index({ organizationId: 1 });
```
**Aucun index sur `moduleCode` seul.** Interroger « toutes les orgs qui ont le module `bilan` »
provoquerait aujourd'hui un **collection scan**. La lecture inverse n'a jamais été un cas d'usage —
elle le devient avec AP-10.

---

## Périmètre

**Inclus :**
- **Index** `EntitlementSchema.index({ moduleCode: 1 })`.
- **Endpoint** `GET /entitlements/by-module/:moduleCode`, permission `catalog:read` (STORY-140) :
  - **paginé** (`page`, `pageSize`, défaut 25, plafond 100) — un module populaire concernera des
    milliers d'organisations ;
  - filtre optionnel `?status=ACTIVE|SUSPENDED|REVOKED`, défaut **toutes** (l'admin veut voir les
    révocations, c'est le signal intéressant) ;
  - réponse : `{ items: [{ organizationId, versionCode, referentiel?, status, updatedAt }], total, page, pageSize }`.
- **Agrégat de répartition** `GET /entitlements/by-module/:moduleCode/summary` : `{ total, byVersion: [{version, count}], byStatus: [{status, count}] }` — c'est ce qui alimente la colonne « versions utilisées » d'AP-04 sans charger la liste entière.

**Hors périmètre :**
- Le **nom** des organisations. `organizationId` est **opaque** ici (décision STORY-033, jamais de
  jointure vers `auth-service`). La résolution des noms est le travail du BFF → **STORY-143**.
- L'UI → **AP-10**.

---

## Le point à trancher : la place de la résolution des noms

Renvoyer `organizationId` nu oblige le front à N appels pour afficher N noms. Trois options :

- **(a) `platform-catalog` appelle `auth-service`** — rompt l'opacité posée par STORY-033 et crée un
  couplage synchrone entre deux services qui n'en avaient pas. **Refusé.**
- **(b) Le BFF compose** — il parle déjà aux deux amont, c'est sa raison d'être (patron STORY-047).
  **Retenu**, porté par STORY-143.
- **(c) Dénormaliser le nom dans `Entitlement`** — crée une copie à réconcilier à chaque renommage
  d'organisation. **Refusé** pour un besoin d'affichage.

---

## Critères d'acceptation

- [ ] `GET /entitlements/by-module/bilan` renvoie les organisations concernées avec `versionCode` et `status`.
- [ ] La réponse est paginée ; `pageSize > 100` est plafonné à 100.
- [ ] `?status=ACTIVE` filtre correctement ; sans filtre, les `REVOKED` sont **inclus**.
- [ ] Un `moduleCode` inexistant au catalogue → **404** (et non une liste vide, qui masquerait une faute de frappe).
- [ ] `/summary` renvoie la répartition par version et par statut, cohérente avec la liste.
- [ ] L'index `{ moduleCode: 1 }` existe ; un `explain()` sur la requête montre un **IXSCAN**, pas un COLLSCAN — tracé dans la PR.
- [ ] Un acteur sans `catalog:read` → **403**.
- [ ] Aucune donnée d'organisation autre que l'`organizationId` n'est renvoyée.

---

## Notes techniques

| Élément | Fichier | Nature |
|---|---|---|
| Index | `src/modules/entitlements/schemas/entitlement.schema.ts` | Modifié |
| Service | `src/modules/entitlements/services/entitlements.service.ts` | Modifié |
| Contrôleur | `src/modules/entitlements/controllers/entitlements.controller.ts` | Modifié |

**Vigilance :**
- **Ordre des routes Nest** : `by-module/:moduleCode` doit être déclaré **avant** `:orgId`, sinon
  `by-module` sera capté comme un `orgId`. Piège classique, à couvrir par un test.
- L'index supplémentaire coûte en écriture sur une collection à fort volume d'upsert
  (`PUT /:orgId/:moduleCode` est idempotent et rejoué) — acceptable, mais à noter.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts.
- [ ] OpenAPI à jour.
- [ ] Preuve `explain()` (IXSCAN) tracée.
- [ ] Branche `MNV-142`, PR vers `dev`.
