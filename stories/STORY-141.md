# STORY-141 : `platform-catalog-service` — objet **Projet** (modèle, CRUD, org propriétaire, association de modules, événement `project.changed`)

**Epic :** EPIC-026 — Projets (nouveau)
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` (C3 = le catalogue ne détient que des entrées de registre ; C8 = octroi service-à-service) · **STORY-032** (catalogue Module/Version/Référentiel) · **STORY-033** (entitlements + réconciliation) · **STORY-034** (`entitlement.changed`) · **STORY-140** (permissions `project:*`)
**Priorité :** Must Have
**Story Points :** 8
**Statut :** draft
**Assigné à :** Unassigned
**Créée le :** 2026-07-28
**Sprint :** à planifier
**Service :** `platform-catalog-service` (:3003) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-141`

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
| `GET /projects?organizationId=` | `project:read` | Liste filtrée, paginée |
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

### Événement
- `project.changed` sur le même bus que `entitlement.changed` (STORY-034), même enveloppe :
  `{ projectId, organizationId, action: created|updated|archived|modules_changed, at }`.
- **À trancher au lancement :** si aucun consommateur n'est identifié, **ne pas publier** — un
  événement sans abonné est la version messagerie de la promesse creuse. Le publier seulement si
  l'app cliente ou le dashboard s'y abonne dans la même release.

### Permissions
- Consomme `project:read` / `project:manage`. Si **STORY-140 option (b)** est retenue, **cette story
  les ajoute elle-même** au catalogue (+ les 3 copies K4 + le libellé) — c'est ce qui satisfait la
  règle d'or : la permission naît avec son guard.

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
- [ ] Vérification docker bout-en-bout tracée.

---

## Notes techniques

| Élément | Fichier (proposé) | Nature |
|---|---|---|
| Schéma | `src/modules/projects/schemas/project.schema.ts` | Nouveau |
| Service | `src/modules/projects/services/projects.service.ts` | Nouveau |
| Contrôleur | `src/modules/projects/controllers/projects.controller.ts` | Nouveau |
| Module Nest | `src/modules/projects/projects.module.ts` | Nouveau |

**Vigilance :**
- **Ne pas dupliquer la logique d'entitlement** : la validation lit `EntitlementsService`, elle ne
  réimplémente pas la règle.
- **Migration** : collection neuve, aucune donnée existante — pas de script de migration, mais
  l'index unique `{organizationId, name}` doit être créé explicitement.
- `organizationId` reste **opaque** : ne jamais joindre vers `auth-service`.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [ ] `lint` / `typecheck` / `test` / `build` verts.
- [ ] OpenAPI à jour (`/api/docs-json`) — le front génère ses types depuis lui.
- [ ] Vérification docker bout-en-bout tracée.
- [ ] Branche `MNV-141`, PR vers `dev`.
