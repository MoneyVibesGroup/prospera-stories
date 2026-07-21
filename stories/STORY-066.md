# STORY-066 : Gestion des exercices comptables + chaînage N/N-1 + ré-ouverture contrôlée — FR-016

**Epic :** EPIC-012 — Validation, clôture & immutabilité — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-016 (CRUD exercice + un seul jeu validé courant par exercice + chaînage N/N-1) ; NFR-002 (isolation orgId)
**Réf. code livré :** **STORY-064** (`JeuEtats` — porte déjà un libellé `exercice`) · **STORY-065** (snapshots versionnés — « versions antérieures consultables ») · **STORY-058** (patron agrégat persisté + `E11000` → conflit générique)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + auto-revue + intégrée dans `dev` le 2026-07-21 — PR #22 bilan-service, MNV-066 « Rebase and merge », HEAD `7343548`, branche supprimée)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 14

---

## User Story

**En tant que** cabinet comptable,
**je veux** déclarer mes **exercices comptables** (dates début/fin, statut ouvert/clos), garantir qu'un exercice porte **au plus un jeu d'états validé courant**, et **chaîner** un exercice à son précédent (N/N-1),
**afin que** ma comptabilité soit organisée par période, qu'un exercice **clos** ne puisse plus être modifié sans ré-ouverture contrôlée, et que le comparatif N-1 s'appuie sur l'exercice précédent réel.

---

## Description

### Contexte & cadrage

STORY-064/065 portent un **libellé** d'exercice libre (`JeuEtats.exercice`, ex. `"2025"`). STORY-066 en fait une **entité de premier plan** : `Exercice` (dates, statut **OUVERT/CLOS**), avec CRUD, chaînage N/N-1, et deux invariants — **un seul jeu par exercice** et **validation interdite dans un exercice CLOS**.

### Ce que 066 livre

1. **Entité `Exercice`** (collection `exercices`, tenant-scoped) : `libelle`, `dateDebut`, `dateFin`, `statut` (`OUVERT` | `CLOS`), `exercicePrecedent` (libellé du N-1, optionnel). **Index unique** `(tenantId, libelle)`.
2. **CRUD** : `POST /bilan/exercices` (créer OUVERT), `GET /bilan/exercices` (lister), `GET /bilan/exercices/:id`, `POST /:id/clore` (OUVERT→CLOS), `POST /:id/rouvrir` (CLOS→OUVERT, **ré-ouverture contrôlée**).
3. **Un seul jeu par exercice** (FR-016 AC-2) : **index unique** `(tenantId, exercice)` sur `JeuEtats` — au plus **un** `JeuEtats` (donc un jeu validé courant, ses versions étant portées par les snapshots 065) par exercice. Un 2ᵉ jeu pour le même exercice → **409** `EXERCICE_A_DEJA_UN_JEU`.
4. **Validation gardée par le statut d'exercice** : `valider` (064/065) est **refusée** (**409** `EXERCICE_CLOS`) si un `Exercice` correspondant au libellé du jeu existe et est `CLOS`. Un exercice **non déclaré** n'empêche pas (compatibilité 064). La **ré-ouverture** de l'exercice ré-autorise la correction.
5. **Chaînage N/N-1** (FR-016 AC-3) : `Exercice.exercicePrecedent` relie deux exercices consécutifs ; exposé dans la lecture. Hook : la **dérivation** du comparatif N-1 depuis le dernier snapshot validé de l'exercice précédent (interop aval) — 066 pose le lien, la dérivation automatique est documentée.

### Frontières nettes

- **Audit** (journal clore/rouvrir/valider) → **STORY-067**.
- **Dérivation automatique des soldes N-1** depuis le snapshot précédent → hook (soldes toujours fournis pour l'instant).
- **Prévisionnel** → EPIC-013.

---

## Scope

**Dans le périmètre :**
- `Exercice` schema + `ExerciceRepository` (tenant-scoped) + `ExerciceService` (CRUD + clore/rouvrir) + `ExerciceController` + DTOs.
- Index unique `(tenantId, libelle)` sur `exercices` ; index unique `(tenantId, exercice)` sur `jeux_etats`.
- `JeuEtatsService.creerBrouillon` : `E11000` → 409 `EXERCICE_A_DEJA_UN_JEU`.
- `JeuEtatsService.valider` : garde `EXERCICE_CLOS` (lecture de l'`Exercice` par libellé).
- Tests unit + e2e + **vérif docker réelle** (CRUD, statut, un-seul-jeu, validation bloquée si CLOS, ré-ouverture, chaînage).

**Hors périmètre :** audit (067), dérivation N-1 auto, prévisionnel (EPIC-013).

---

## Critères d'acceptation

- [ ] **CRUD exercice** keyé `orgId` : créer (OUVERT), lister, consulter, clore, rouvrir. Libellé unique par org (**409** générique sur doublon).
- [ ] **Un seul jeu par exercice** : créer un 2ᵉ `JeuEtats` pour un exercice déjà pourvu → **409** `EXERCICE_A_DEJA_UN_JEU` ; les **versions** (snapshots 065) restent consultables.
- [ ] **Validation bloquée dans un exercice CLOS** : `valider` → **409** `EXERCICE_CLOS` ; après `rouvrir`, la validation repasse.
- [ ] **Chaînage N/N-1** : un exercice peut référencer son précédent ; le lien est exposé en lecture.
- [ ] **Isolation** : exercice d'une autre org → **404** ; gate `@RequiresBilanAccess` (403) ; sans jeton (401).

---

## Notes techniques

- **Nouveau dossier** `src/modules/bilan/exercice/` : `exercice.enums.ts` (`ExerciceStatut`), `exercice.schema.ts`, `exercice.repository.ts`, `exercice.service.ts`, `exercice.controller.ts`, `dto/`.
- **Index** : `exercices` unique `(tenantId, libelle)` ; `jeux_etats` unique `(tenantId, exercice)` (ajouté au schéma 064). `E11000` → 409 générique (`isDuplicateKeyError`).
- **Garde CLOS** dans `JeuEtatsService.valider` : injecter `ExerciceRepository` (lecture seule) — lit l'`Exercice` par `(tenant, libelle=jeu.exercice)` ; si `CLOS` → 409 avant toute transaction.
- **Écritures mono-document** (exercice CRUD, index sur jeu) → pas de transaction.
- Anti-énumération 404 inter-org (TenantScopedRepository).

---

## Dépendances

**Prérequis :** STORY-064 (`JeuEtats.exercice`) ✅ · STORY-065 (versions) ✅.
**Débloque :** STORY-067 (audit clore/rouvrir), EPIC-013 (base validée par exercice).

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts · non-régression 064/065.
- [ ] **Vérif docker réelle** (CRUD exercice, unicité jeu/exercice, validation bloquée si CLOS puis débloquée après rouvrir, chaînage N/N-1) consignée dans *Progress Tracking*.
- [ ] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [ ] Flux git : `MNV-066` sur `dev` + docs sur `main`, PR « Rebase and merge ».

---

## Story Points Breakdown

- Entité Exercice + CRUD + statut : 2 pts · index + gardes (un-seul-jeu, CLOS) : 1,5 pt · chaînage + DTOs : 1 pt · tests + docker : 0,5 pt · **Total : 5 pts**.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (Scrum Master).
- 2026-07-21 : Développée (Developer) — entité Exercice + CRUD + statut + chaînage + invariants (un jeu/exercice, validation CLOS). Intégrée dans `dev` (PR #22, MNV-066, rebase-merge, HEAD `7343548`).

**Réalisé :**
- **`Exercice`** (collection `exercices`, tenant-scoped) : `libelle`, `dateDebut`, `dateFin`, `statut` (`OUVERT`/`CLOS`), `exercicePrecedent` (chaînage N/N-1). **Index unique** `(tenantId, libelle)`.
- **`ExerciceService`** : `creer` (dates→422 `DATES_INVALIDES`, `E11000`→409 `EXERCICE_EXISTE`), `lister`, `consulter` (404 anti-énum), `clore`/`rouvrir` (transition gardée par statut, 409 `STATUT_INVALIDE`).
- **`ExerciceController`** `/bilan/exercices` (POST/GET/GET :id/POST :id/clore/POST :id/rouvrir) — `@RequiresBilanAccess` + `@Roles`.
- **Invariant « un seul jeu par exercice »** : index unique `(tenantId, exercice)` sur `jeux_etats` ; `creerBrouillon` mappe `E11000` → **409 `EXERCICE_A_DEJA_UN_JEU`**.
- **Garde `EXERCICE_CLOS`** dans `JeuEtatsService.valider` (lit l'`Exercice` par libellé ; 409 avant toute transaction ; exercice non déclaré = compatible 064).

**Qualité (DoD) :** lint 0 · build OK · **430 unit + 91 e2e** verts · `exercice` **98.9 / 92.9 / 100 / 98.8**, `jeu-etats` 98.4/95.6/100/98.3, global 98.3/92.5/98.8/98.3 · non-régression 064/065 + dry-run 059→063.

**Vérification docker réelle :** collections aggregate droppées + bilan-service redémarré (index unique construit sur base propre), org `6a5ec161…`, JWT RS256 réel.
- **Index unique** `jeux_etats (tenantId, exercice)` présent.
- **CRUD exercice** : `2025` créé `OUVERT` ; `2026` créé avec **`exercicePrecedent: "2025"`** (chaînage N/N-1).
- **Un seul jeu par exercice** : 1er jeu `exercice=2025` → BROUILLON ; **2ᵉ jeu `exercice=2025` → 409 `EXERCICE_A_DEJA_UN_JEU`**.
- **Validation gardée** : exercice `2025` `clore` → CLOS ; `valider` le jeu → **409 `EXERCICE_CLOS`** ; `rouvrir` l'exercice → OUVERT ; `valider` → **VALIDE version 1**.
- **Isolation** : exercice inexistant (hex valide) → **404 `EXERCICE_INTROUVABLE`** ; exercice d'une **autre org** → **404** (cloisonnement `TenantScopedRepository`).

**Actual Effort :** ~5 pts (conforme).
