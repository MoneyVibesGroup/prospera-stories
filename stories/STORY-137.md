# STORY-137 : Versions d'hypothèses append-only (reproductibilité du prévisionnel) — FR-018 AC-2

**Epic :** EPIC-013 — Prévisionnel (mensuel 12 mois + annuel 3 ans) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** done ✅
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-24
**Clôturée le :** 2026-07-24
**Sprint :** 15
**Cadrage :** décision **D1** de [`architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md) · **FR-018 AC-2** du [PRD bilan](../prd-bilan-service-2026-07-10.md)
**Réf. code livré :** **STORY-068** (`src/modules/bilan/hypotheses/` — `JeuHypothesesService.editer`, le point à corriger) · **STORY-065** (`.../jeu-etats/snapshot/` — `SnapshotLiasseRepository`, patron du dépôt **append-only** insert-only + base traçable) · **STORY-069/070** (`.../projection/` — expose déjà `hypothesesVersion` + `MODELE_PROJECTION_VERSION`) · **STORY-067** (`.../audit/` — hook `AuditType.export` réservé, consommé par 073, pas ici)

> **Note de numérotation :** cette story était planifiée **STORY-132** dans `sprint-status.yaml` ; renumérotée **137** le 2026-07-24 car le n°132 était déjà pris par une story `auth-service` (`SessionResponseDto`/OpenAPI) orpheline du gate FE-021. Les mentions « **STORY-132 / D1** » dans les commentaires *done* de 069/071/072 et dans l'archi désignent **cette** story.

> **Le trou, en une phrase :** STORY-068 a livré un **compteur d'éditions**, pas un versionnement.
> `JeuHypothesesService.editer` fait `updateOne(id, { hypotheses, version: doc.version + 1 })` : les
> paramètres de la version précédente **n'existent plus**. La projection (069) expose pourtant
> `hypothesesVersion` comme gage de traçabilité — or **cette version n'est pas résolvable**, et un
> prévisionnel exporté (073) ne serait donc **pas reconstructible**.

---

## Constat — vérifié, pas supposé

`bilan-service/src/modules/bilan/hypotheses/hypotheses.service.ts` (sur `origin/dev`, livré par 068) écrase les
paramètres en place :

```ts
// editer(...)
await this.repo.updateOne(id, { hypotheses, version: doc.version + 1 });
```

Une projection (069/070) est fonction de **trois** entrées. Une seule est immuable aujourd'hui :

| Entrée | État actuel | Conséquence |
|---|---|---|
| Snapshot de liasse (065) | **immuable** ✅ (dépôt append-only, ni `updateOne` ni `deleteOne`) | rejouable |
| Paramètres d'hypothèses (068) | **écrasés en place** ❌ | **non rejouable** |
| Modèle de projection (069) | `MODELE_PROJECTION_VERSION = '1.0.0'` exposée, garde par test (D4/070) | traçable |

**Fondement — dette de conformité de 068, pas un élargissement de scope :**

> **FR-018 AC-2** — « Hypothèses éditables **et versionnées** ; base = snapshot validé (traçable). »

`version` s'incrémente, mais aucune version antérieure n'est conservée : c'est un compteur, pas un
versionnement. **Prérequis de 073** (l'export doit être reconstructible), jamais après.

---

## Décision de cadrage (D1) — figer les *entrées*, pas la sortie

**Historiser les versions de paramètres d'hypothèses en append-only ; ne PAS persister les projections.**
La projection **reste** une dérivation : un correctif de formule améliore rétroactivement toutes les lectures,
et l'archive dit **quelle** version a produit un export donné. (Voir D1 pour l'écart avec l'option « figer la
sortie », écartée.)

Tout couple **`(snapshotId, versionHypothesesId, modeleVersion)`** devient rejouable — c'est le **triplet de
reproductibilité**.

> **Nuance assumée (D1, à ne pas masquer) :** rejouer une formule **ancienne** reste impossible —
> `MODELE_PROJECTION_VERSION` *identifie* le modèle, elle ne l'*archive* pas (versionner du code exécutable en
> base est un coût sans commune mesure avec le besoin). L'engagement tenu est : « cet export a été produit par
> le modèle 1.0.0 à partir de **ces entrées exactes** ». La garde de version (D4, livrée par 070) et l'audit
> d'export (D5, livré par 073) sont ce qui rend cette nuance honnête.

---

## Scope

**Dans le périmètre :**

1. **Collection `versions_hypotheses`** (nommage explicite `@Schema({ collection: 'versions_hypotheses' })`),
   **append-only**, tenant-scoped : `{ tenantId, jeuHypothesesId, version, hypotheses, base, createdAt }`.
   **Index unique `(tenantId, jeuHypothesesId, version)`** = le vrai filet de concurrence.
   Dépôt insert-only sur le patron `SnapshotLiasseRepository` (065) : **n'expose ni `updateOne` ni `deleteOne`**.
2. **`JeuHypothesesService.editer` réécrit** : **insère la version SORTANTE** (l'état *avant* mutation :
   `{ version: V, hypotheses: P_V }`) **puis** mute le document courant vers `V+1`, **dans une transaction**
   (2 documents écrits ⇒ `transactions-mongo.md` s'applique — contrairement à 068, mono-document).
3. **Résolution d'une version** : `GET /bilan/hypotheses/:id/versions` (liste des versions historisées + la
   courante) et `GET /bilan/hypotheses/:id/versions/:version` (paramètres exacts d'une version). La **courante**
   se lit du document `jeux_hypotheses`, les **antérieures** de `versions_hypotheses`.
4. **Rejeu de la projection** (069/070) : paramètre de requête **optionnel** `?versionHypotheses=N`
   (défaut : version courante — **additif**, aucun appelant existant cassé, comme `perms` en 103) ; la réponse
   expose le **triplet** `{ snapshotId, versionHypothesesId, modeleVersion }`.

**Hors périmètre (hooks / stories dédiées) :**

- **Audit de l'export** du triplet dans `audit_events` (D5) → **STORY-073** (consomme `AuditType.export`, déjà réservé par 067).
- **Figer l'artefact remis** (PDF/XLSX haché, patron MinIO 129, D1 (c)) → **STORY-073**.
- **Rebasage** d'un jeu vers un snapshot plus récent (D2) → hook, non livré ici.
- **Archiver le code du modèle** de projection → volontairement non fait (nuance assumée D1).
- **Comparaison inter-versions d'un même jeu** (laissée hors périmètre par 071) → dérive naturellement de (3), non exposée ici.

---

## Sémantique de versionnement (invariant)

| Action | `jeux_hypotheses` (courant) | `versions_hypotheses` (historique) |
|---|---|---|
| Créer (068) | `version=1`, `P1` | ∅ |
| Éditer → `P2` | `version=2`, `P2` | `{v:1, P1}` |
| Éditer → `P3` | `version=3`, `P3` | `{v:1,P1}`, `{v:2,P2}` |

**Invariant :** pour tout jeu, les versions `1..(courant.version − 1)` sont dans l'historique, `courant.version`
est le document. Donc `count(versions_hypotheses[jeu]) == courant.version − 1`, et **toute** version `≤ courant`
est résolvable. `getVersion(N)` : `N == courant.version` → document ; sinon → historique ; inexistante → 404.

---

## Acceptance Criteria

- **AC-01** — Éditer un jeu à la version `V` **insère** dans `versions_hypotheses` la version **sortante**
  (`{ version: V, hypotheses: P_V }`) **puis** passe le document courant à `V+1` avec les nouveaux paramètres.
- **AC-02 (atomicité)** — Si l'écriture de l'historique échoue, le document courant **n'est pas** muté
  (transaction, abort gardé) : ni version orpheline, ni doc à `V+1` sans historique `V`. Prouvé en docker.
- **AC-03 (résolution)** — `GET …/:id/versions` liste `1..V` (antérieures + courante marquée) ;
  `GET …/:id/versions/:n` renvoie les paramètres **exacts** de la version `n` (courante lue du doc, antérieures
  de l'historique) ; version inexistante → **404** ; jeu d'une autre org → **404** (jamais 403).
- **AC-04 (rejeu / reproductibilité)** — Après `P1→P2→P3`, la projection avec `?versionHypotheses=1` recalcule
  **exactement** la sortie initiale (déterminisme), **différente** de la version courante ; la réponse porte le
  triplet `{ snapshotId, versionHypothesesId, modeleVersion }`. `versionHypotheses` inconnue → **404/422**, jamais un calcul silencieux sur la courante.
- **AC-05 (concurrence)** — L'index unique `(tenantId, jeuHypothesesId, version)` empêche deux éditions
  concurrentes d'insérer la même version : la seconde `E11000` → **409 générique** ; **aucun doublon** en base.
- **AC-06 (non-régression + garde D4)** — STORY-068 (création, unicité `nom`, base validée, isolation) et
  069/070/071 restent verts ; **`MODELE_PROJECTION_VERSION` inchangé** (137 ne touche **aucune** formule → reste
  `1.0.0`) ; le paramètre `?versionHypotheses` est **additif** (défaut = courante) : appelants existants intacts.
- **AC-07 (isolation)** — gate `@RequiresBilanAccess` (403) ; sans jeton (401) ; toute ressource d'une autre org → **404**.

---

## Notes techniques

- **Nouveau** : `hypotheses/versions/` — `version-hypotheses.schema.ts` (collection `versions_hypotheses`,
  index unique `(tenantId, jeuHypothesesId, version)`), `version-hypotheses.repository.ts` (**insert-only**,
  propage `ClientSession`), extension du `JeuHypothesesService` + `JeuHypothesesController`, DTOs de réponse.
- **Transaction (`transactions-mongo.md`)** : `editer` écrit 2 docs → `ObjectId` **pré-généré** pour la ligne
  d'historique, `session.startTransaction()` / `commit` / **abort gardé** dans le `catch`, hooks post-commit
  **isolés** (hors transaction). `TenantScopedRepository` : `{ tenantId }` fusionné, fail-closed.
- **Concurrence** : `editer` lit le doc courant (version `V`), insère `V`, bump `V+1`. Deux éditions parallèles
  → même `V` inséré deux fois → `E11000` sur l'index unique → **409** (mapper vers message générique, patron 066).
- **Rejeu** : le service de projection (069/070) résout les paramètres via `getVersion(jeuId, versionHypotheses ?? courant)` **avant** de dériver ; aucune formule modifiée.
- **`versionHypothesesId`** = identifiant opposable de la version résolue (`_id` de la ligne `versions_hypotheses`, ou du doc courant si version courante) — c'est lui qui sera journalisé par 073 (D5).
- **Ordre des routes** : déclarer `:id/versions` et `:id/versions/:version` sans collision avec `:id` (profondeurs de chemin distinctes) — rester vigilant sur la règle littéral-avant-paramétré.

---

## Dependencies

**Prérequis (bloquants, tous ✅) :**
- **STORY-068** — `JeuHypotheses` + `editer` : l'agrégat et la méthode à transformer (compteur → versionnement).
- **STORY-065** — `SnapshotLiasse` : patron du **dépôt append-only insert-only** + base traçable (`snapshotId`).

**Cadrage / source de conception :**
- **D1** de [`architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md) · **FR-018 AC-2** (PRD bilan).

**Débloque (137 est prérequis de) :**
- **STORY-073** (FR-023, export PDF/Excel) — le triplet de reproductibilité + l'audit `export` (D5) + le figeage
  d'artefact (D1 c) reposent sur l'historique livré ici. **Sans 137, un prévisionnel exporté n'est pas reconstructible.**

**Consommateurs / stories liées (non bloquées, mais impactées) :**
- **STORY-069** (FR-019, projection annuelle) — expose aujourd'hui `hypothesesVersion` **non résolvable** ; 137 la
  rend résolvable et ajoute `?versionHypotheses`.
- **STORY-070** (FR-020, trésorerie mensuelle) — même surface de projection ; garde `MODELE_PROJECTION_VERSION` (D4).
- **STORY-071** (FR-021, scénarios comparés, *done*) — a laissé « comparaison inter-versions d'un même jeu (dépend STORY-132/D1) » en hook : dérive de (3), non exposée ici.

**Patrons réutilisés :** `transactions-mongo.md` (écriture 2 docs) · `SnapshotLiasseRepository` (append-only) ·
mapping `E11000` → 409 (066) · additif type `perms` (103).

---

## Definition of Done

- Les 7 AC passent · lint 0 warning · build OK · couverture ≥ **65/90/90/90** (ne jamais baisser) · unit + e2e verts.
- **Non-régression** : STORY-068 + 069/070/071 verts ; `MODELE_PROJECTION_VERSION` = `1.0.0` (aucune formule touchée).
- **Mutation-test obligatoire** (un test qu'un code bugué franchit = fausse assurance) :
  - retirer l'insertion de l'historique dans `editer` → **AC-01 doit rougir** ;
  - remplacer la transaction par 2 écritures nues → le test d'atomicité **AC-02 doit rougir** (historique orphelin ou doc muté sans historique) ;
  - faire résoudre `?versionHypotheses` toujours sur la courante → **AC-04 doit rougir** ;
  - retirer l'index unique → **AC-05 doit rougir** (doublon accepté).
- **Vérif docker réelle** (`transactions-mongo.md` : les e2e mockent la couche données, ils ne prouvent **ni la
  persistance ni l'atomicité**) consignée dans *Progress Tracking* : éditer v1→v2→v3 → l'historique porte
  `{v:1},{v:2}` et le doc `v3` (invariant `count == version−1`) ; **échec injecté** entre les 2 écritures → **rien**
  n'est muté (aucun orphelin) ; rejeu `?versionHypotheses=1` → sortie identique à l'origine ; concurrence → `E11000`→409, aucun doublon ; isolation autre org → 404.
- **Statut synchronisé** aux 3 endroits (en-tête doc / `sprint-status.yaml` / *Progress Tracking*) + `completed_date` à la clôture.
- **Flux git** : branche `MNV-137` sur base `dev` (bilan-service) + `docs/` sur base `main`, PR « Rebase and merge », branche supprimée.

---

## Story Points Breakdown

- **Backend :** collection `versions_hypotheses` + dépôt insert-only (0,5) · `editer` transactionnel 2-docs (1) · endpoints de résolution + rejeu `?versionHypotheses` + triplet (1) = **2,5 pts**
- **Tests :** unit + e2e + mutation-test + vérif docker atomicité/rejeu = **0,5 pt**
- **Total : 3 pts**

**Rationale :** aucune brique nouvelle transverse — on réutilise des patrons livrés (append-only 065, transaction
`transactions-mongo.md`, `E11000`→409). La complexité est concentrée sur l'atomicité de `editer` et la preuve de
rejeu.

---

## Progress Tracking

**Status History :**
- 2026-07-24 : Créée (Scrum Master) — renumérotée depuis STORY-132 (collision n°132 avec une story auth orpheline).
- 2026-07-24 : Développée (dev externe DeepSeek v4 Flash) → **revue + corrections d'office** + vérif docker + sécurité.

**Réalisé :**
- **`versions_hypotheses`** (collection append-only, index unique `(tenantId, jeuHypothesesId, version)`) + `VersionHypothesesRepository` insert-only (`creer`/`trouver`/`lister`, propage `ClientSession`, tenant forcé).
- **`JeuHypothesesService.editer` transactionnel** : insère la version sortante puis bascule le doc courant à `V+1` dans **une transaction 2 docs** (abort gardé, `endSession` en `finally`).
- **Endpoints** : `GET /:id/versions` (liste 1..V, courante marquée), `GET /:id/versions/:version` (paramètres exacts ; 404 si >V, 400 si <1), `?versionHypotheses=N` sur les projections annuelle/mensuelle (défaut courante), **triplet** `{snapshotId, versionHypothesesId, modeleVersion}` exposé. `MODELE_PROJECTION_VERSION` inchangé (1.0.0).

**3 corrections appliquées en revue** (manquements du dev externe) :
1. **Atomicité — `updateOne` était HORS transaction.** `TenantScopedRepository.updateOne` ne prenait pas de `session` ⇒ la mise à jour du doc courant s'auto-committait hors de la transaction (fausse atomicité). Ajout d'un paramètre `session?` propagé à `findOneAndUpdate` + `editer` le passe. Test unit ajouté : les 2 écritures partagent la **même** session (mutation = rouge).
2. **Concurrence — conflit d'écriture rendait 500 au lieu de 409.** Sous transaction Mongo réelle, deux éditions simultanées produisent un `WriteConflict`/`TransientTransactionError` (code 112), pas un `E11000`. Ajout de `isWriteConflictError` ⇒ mappé en **409 `HYPOTHESES_CONFLIT_VERSION`** (constaté et corrigé en vérif docker). Tests unit (code 112 + label transitoire).
3. **Tests manquants du dev externe** : 3 modules e2e ne déclaraient pas `VersionHypothesesRepository` + `Connection` (33 tests morts, invisibles sans `test:e2e`) ; `version-hypotheses.repository.ts` livré à 0 % ; `VersionHypothesesQueryDto` sans validateurs (400 sous `forbidNonWhitelisted`) ; aucun e2e sur les nouveaux endpoints. Corrigés : providers e2e câblés, spec du repository (100 %), validateurs `@IsInt @Min(1)`, e2e reproductibilité + rejeu + edges. *(Ces 3 manquements structurels sont désormais consignés dans `.agents/rules/qualite-verification.md` § Porte de handoff.)*

**Qualité (DoD) :** lint 0 · build OK · **603 unit + 156 e2e** verts · couverture **98.2 / 92.47 / 98.04 / 98.16** (`versions/` à 100 %, `hypotheses.service` 98.5/100/100) · non-régression 068/069/070/071.

**Vérification docker réelle** (stack up, JWT RS256 réel minté sur la clé ACTIVE de l'IdP, org `6a6343f7…` gate semé + base validée `6a63442d…` exercice 2025 ; conteneur **redémarré** — le hot-reload ment) :
- **Historique append-only** : créer (v1, croissance 10) → éditer (v2, 99) → éditer (v3, 55). `versions_hypotheses` = `{v1:10, v2:99}`, doc courant v3:55. **Invariant `count == version−1`** vérifié ; v1 conserve l'origine (10).
- **Résolution** : `GET /:id/versions` = [v1,v2 non courantes ; v3 courante] ; `/versions/1` = 10 (origine) ; `/versions/9` → 404 ; `/versions/0` → 400.
- **Rejeu / reproductibilité** : projection `?versionHypotheses=1` → `hypothesesVersion=1`, produits **110 000 000** (croissance 10) ; défaut (v3) → produits **155 000 000** (croissance 55) ; **distinct + déterministe** ; triplet `versionHypothesesId`+`snapshotId`+`modeleVersion=1.0.0` exposé.
- **Atomicité + concurrence** : 5 rondes de 2 `PUT` **concurrents** → chaque perdant **409** (jamais 500 après correctif), 5 éditions nettes (v4→v9), historique **contigu `[1..8]`**, **aucun doublon**, **aucun orphelin**, invariant préservé.
- **Isolation** : mon jeton sur le jeu d'une **autre org** (`6a636011…`) → **404** sur `/versions`, `/versions/1`, `/:id` ; id inexistant → 404.

**Actual Effort :** ~3 pts (conforme ; +revue substantielle du code externe).

---

**Créée avec BMAD Method v6 — Phase 4 (Implementation, Story Definition).**
