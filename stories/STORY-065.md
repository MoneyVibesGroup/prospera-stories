# STORY-065 : Snapshot figé immuable à la validation (append-only, versions conservées) — FR-015

**Epic :** EPIC-012 — Validation, clôture & immutabilité (snapshot figé) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-015 (Snapshot figé immuable) ; **NFR-004** (Immutabilité & traçabilité — append-only, aucune mutation en place) ; NFR-003 (reproductibilité)
**Réf. règles :** `.agents/rules/transactions-mongo.md` (**≥ 2 documents → transaction obligatoire** : snapshot inséré **+** jeu basculé VALIDÉ) ; `.agents/rules/securite.md` (anti-énumération 404) ; CLAUDE.md §DoD (**vérif docker : atomicité réelle, jamais sur la foi d'un mock**)
**Réf. code livré :** **STORY-064** (`JeuEtats` + machine BROUILLON→VALIDÉ ; `valider` pose déjà `validePar`/`valideAt` et capture `referentiel`+`checksum` — **hooks explicites** pour le snapshot) · `BilanEngineService.produireLiasseComplete` (liasse produite) · **read-models projection services** (`InjectConnection` + `startSession` + abort gardé — patron transaction du repo)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout **avec preuve d'atomicité** + auto-revue + intégrée dans `dev` le 2026-07-21 — PR #21 bilan-service, MNV-065 « Rebase and merge », HEAD `cb8aa33`, branche supprimée)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 14

---

## User Story

**En tant que** cabinet comptable validant sa liasse OHADA,
**je veux** qu'à la **validation** un **snapshot immuable** soit figé (états produits, balance source, référentiel + version, version de code du moteur, validateur, horodatage) et que toute **correction** rouvre un nouveau brouillon produisant une **nouvelle version** — les versions antérieures restant **conservées et consultables**,
**afin que** mes états validés soient **infalsifiables** (append-only, aucune mutation en place — invariant NFR-004) et **reproductibles** : une liasse déposée est un fait daté et signé, pas un calcul qui pourrait changer.

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

STORY-064 a livré la machine `BROUILLON → VALIDÉ` en **verrouillant les soldes** du `JeuEtats` (l'état VALIDÉ n'est plus mutable via l'API). STORY-065 transforme ce verrou en **snapshot immuable versionné** : la validation **fige** la liasse produite dans une collection **append-only** (`snapshots_liasse`), et une **ré-ouverture pour correction** produit une **nouvelle version** (v2, v3…), l'historique étant conservé.

### Ce que 065 livre

1. **Snapshot immuable** `SnapshotLiasse` (collection **append-only** `snapshots_liasse`, tenant-scoped) : `jeuEtatsId`, `version` (entier ≥ 1), `exercice`, **`liasse`** (états produits complets : Bilan+CR+cohérence+TFT+notes+contrôles), **`soldesN`/`soldesN1`** (balance source), `referentiel {code,version}`, `checksum`, **`moteurVersion`** (version de code du moteur), `validePar`, `createdAt` (= horodatage de validation). **Index unique `(tenantId, jeuEtatsId, version)`** — le vrai filet contre une version dupliquée (course → `E11000` → 409 générique).
2. **Validation transactionnelle** (`transactions-mongo.md`) : `valider` (064) devient **atomique sur 2 documents** — insertion du snapshot **+** bascule du jeu en VALIDÉ, sous `session`/`startTransaction`, **abort gardé** (`inTransaction()`), `endSession` en `finally`. La version = `count(snapshots du jeu) + 1`, lue **dans la transaction**. Si les contrôles bloquants échouent (064) → **422 avant** toute transaction.
3. **Ré-ouverture pour correction** : `POST /bilan/etats/:id/rouvrir` bascule un jeu **VALIDÉ → BROUILLON** (efface `validePar`/`valideAt` du jeu vivant ; **les snapshots restent**). Le brouillon est recalculable (064) puis re-validable → **v+1**. Un jeu déjà BROUILLON → **409**.
4. **Historique consultable** : `GET /bilan/etats/:id/versions` (métadonnées des versions, plus récente d'abord) + `GET /bilan/etats/:id/versions/:version` (le **snapshot figé** complet — la liasse telle que validée, jamais recalculée).
5. **Immutabilité stricte** : le repository des snapshots **n'expose aucune mutation** (append-only : `creer` + lectures) ; aucun `updateOne`/`deleteOne` n'est appelé sur un snapshot.

### Reproductibilité (NFR-003)

Le snapshot fige la liasse **et** ses entrées (soldes + référentiel + checksum + `moteurVersion`). Reproduire à partir des mêmes entrées redonne la **même** liasse — vérifié en docker (checksum du snapshot == checksum de la re-production live).

### Frontières nettes

- **Exercices** (dates, ouvert/clos, un seul jeu validé courant par exercice, chaînage N/N-1) → **STORY-066** (FR-016). 065 versionne **par jeu**, pas encore par exercice.
- **Audit** (journal des actions valider/rouvrir/…) → **STORY-067** (FR-017).
- **Export** du snapshot (PDF/Excel) → **EPIC-014**.
- **Consumer balance réel** → interop aval (soldes toujours fournis).

---

## Scope

**Dans le périmètre :**
- Schéma `SnapshotLiasse` (`snapshots_liasse`) + `SnapshotLiasseRepository` (**append-only** : `creer(session?)`, `prochaineVersion(session?)`, `listerPourJeu`, `trouverVersion`, `dernier`).
- `MOTEUR_VERSION` (constante de version de code du moteur, figée, tracée dans chaque snapshot).
- `JeuEtatsService.valider` **transactionnel** (snapshot + bascule VALIDÉ) ; `rouvrir` (VALIDÉ→BROUILLON) ; `listerVersions` / `consulterVersion`.
- `JeuEtatsController` : `POST /:id/rouvrir`, `GET /:id/versions`, `GET /:id/versions/:version`. `valider` renvoie désormais le **numéro de version** créé.
- DTOs snapshot (sommaire + détail figé) ; câblage `BilanModule` (`InjectConnection` + `forFeature` snapshot).
- Tests unit + e2e (dont **preuve d'atomicité** : échec au milieu → aucun snapshot ni bascule) + **vérif docker réelle** (append-only, versions, reproductibilité, rollback).

**Hors périmètre :** exercices (066), audit (067), export (EPIC-014), balance réelle.

---

## Critères d'acceptation

- [ ] La validation (064) crée un **snapshot immuable** v1 (`liasse` + `soldes` + `referentiel` + `checksum` + `moteurVersion` + `validePar` + horodatage) **et** bascule le jeu VALIDÉ, **atomiquement** (transaction 2 docs) ; échec au milieu ⇒ **ni** snapshot **ni** bascule.
- [ ] Le snapshot est **append-only** : aucune mutation en place (aucun `updateOne`/`deleteOne` sur `snapshots_liasse`).
- [ ] `POST /:id/rouvrir` : VALIDÉ → BROUILLON (200) ; les snapshots antérieurs **restent** ; jeu déjà BROUILLON → **409**.
- [ ] Re-valider après correction crée **v2** ; `count(versions) == 2` ; v1 **inchangée**.
- [ ] `GET /:id/versions` liste les versions (récente d'abord) ; `GET /:id/versions/:version` renvoie le **snapshot figé** (liasse telle que validée) ; version inconnue → **404**.
- [ ] **Reproductibilité** : mêmes entrées ⇒ mêmes états (checksum snapshot == checksum re-production).
- [ ] Course sur la version (unique `(tenantId, jeuEtatsId, version)`) → **409** générique (`E11000` mappé).
- [ ] **Isolation** : snapshot/versions d'une autre org → **404** ; gate `@RequiresBilanAccess` (403) ; sans jeton (401).

---

## Notes techniques

- **Nouveau dossier** `src/modules/bilan/jeu-etats/snapshot/` (ou fichiers `snapshot-liasse.*` sous `jeu-etats/`) : `snapshot-liasse.schema.ts`, `snapshot-liasse.repository.ts`, `moteur-version.ts`, `dto/snapshot-response.dto.ts`.
- **Transaction** (`transactions-mongo.md`) : `@InjectConnection() connection` dans `JeuEtatsService` ; `session = connection.startSession()`, `startTransaction()`, `{ session }` sur **chaque** écriture, `commitTransaction()`, abort gardé (`inTransaction()`), `endSession()` en `finally`. `prochaineVersion` lue dans la session.
- **Repositories session-aware** : `SnapshotLiasseRepository.creer(doc, session?)` (force `tenantId`), `prochaineVersion(jeuEtatsId, session?)` (`count + 1`) ; `JeuEtatsRepository.majSiBrouillon(id, patch, session?)` (ajout du paramètre `session`) + `rouvrir(id)` (transition VALIDÉ→BROUILLON gardée).
- **`E11000`** (version dupliquée) → 409 générique via `isDuplicateKeyError` (util existant).
- **Immutabilité** : `SnapshotLiasseRepository` n'expose **pas** `updateOne`/`deleteOne` (append-only documenté).

---

## Dépendances

**Prérequis :** STORY-064 (machine + hooks referentiel/checksum) ✅ · patron transaction (read-models) ✅.
**Débloque :** STORY-066 (versionne par exercice), STORY-067 (audit journalise valider/rouvrir), EPIC-014 (export du snapshot).

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ 65/90/90/90 (jamais baissée) · unit + e2e verts · non-régression 064 + dry-run 059→063.
- [ ] **Vérif docker réelle** (atomicité prouvée par requêtes `mongosh` : snapshot inséré == 1 par validation, aucune orpheline après rollback ; v1/v2 après rouvrir ; reproductibilité checksum) consignée dans *Progress Tracking*.
- [ ] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [ ] Flux git : `MNV-065` sur `dev` (module) + docs sur `main`, PR « Rebase and merge ».

---

## Story Points Breakdown

- Schéma snapshot + repo append-only + index : 1,5 pt · validation transactionnelle (2 docs, abort gardé) : 2 pts · rouvrir + endpoints versions + DTOs : 1 pt · tests (dont atomicité) + vérif docker : 0,5 pt · **Total : 5 pts**.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (Scrum Master).
- 2026-07-21 : Développée (Developer) — snapshot append-only + validation transactionnelle + ré-ouverture + versions. Intégrée dans `dev` (PR #21, MNV-065, rebase-merge, HEAD `cb8aa33`).

**Réalisé :**
- **Snapshot** `SnapshotLiasse` (collection `snapshots_liasse`) : `jeuEtatsId`, `version`, `exercice`, `liasse` (états figés), `soldesN`/`soldesN1`, `referentiel`+`checksum`, `moteurVersion` (`MOTEUR_VERSION`), `validePar`, `valideAt`. **Index unique** `(tenantId, jeuEtatsId, version)`.
- **`SnapshotLiasseRepository`** append-only : `creer(session?)`, `prochaineVersion(session?)`, `listerPourJeu`, `trouverVersion`, `dernier` — **aucune** mutation exposée (immutabilité).
- **`JeuEtatsService.valider` transactionnel** : `startSession` → `prochaineVersion` (dans la session) → `snapshots.creer` (write 1) → `majSiBrouillon` (write 2) → `commit` ; **abort gardé** (`inTransaction()`), `endSession` en `finally` ; `E11000` → 409 `SNAPSHOT_VERSION_CONFLICT` ; course de bascule (`majSiBrouillon` null) → abort + 409. Coût de production **hors** transaction.
- **`rouvrir`** (VALIDÉ→BROUILLON, efface `validePar`/`valideAt`, snapshots conservés) ; `listerVersions` / `consulterVersion` (404 `VERSION_INTROUVABLE`). `JeuEtatsRepository` : `majSiStatut(session)` + `rouvrir`.
- **Endpoints** : `POST :id/rouvrir`, `GET :id/versions`, `GET :id/versions/:version` ; `valider` renvoie le n° de version ; `JeuEtatsResponseDto.version`.

**Qualité (DoD) :** lint 0 · build OK · **412 unit + 83 e2e** verts · `jeu-etats` **98.4 / 95.6 / 100 / 98.3**, `snapshot` **100 %**, `bilan-engine` **100 %**, global 98.3/92.4/98.7/98.3 · non-régression 064 + dry-run 059→063.

**Vérification docker réelle (atomicité — jamais sur la foi d'un mock) :** stack docker (bilan-service recompilé), org `6a5ec161…`, JWT RS256 réel.
- **Index unique** `tenantId_1_jeuEtatsId_1_version_1` présent (mécanisme d'intégrité réel).
- **Snapshot v1** figé en base : `version=1`, `moteurVersion=bilan-engine@1.0.0`, `checksum=01b892c0`, `validePar`, `liasse` non nulle, 7 soldes.
- **Reproductibilité** : re-production live == snapshot figé (`checksum 01b892c0`).
- **Ré-ouverture** : `rouvrir` → jeu `BROUILLON`, `validePar=null`, **snapshots conservés** (count=1).
- **Nouvelle version** : recalcul + re-valider → **v2** ; `snapshots_liasse` = 2 docs, versions `[1,2]` (v1 inchangée, append-only).
- **ATOMICITÉ prouvée** : snapshot `version=2` **planté** (count=1 → `prochaineVersion=2` → collision) → `valider` → **409 `SNAPSHOT_VERSION_CONFLICT`** ; **après l'échec** : jeu **toujours BROUILLON** (aucune bascule), `snapshots` count **inchangé = 1** (aucun orphelin ajouté) → la transaction a bien été **annulée en bloc**.
- **Isolation** : versions d'un jeu inexistant / autre org → **404**.

**Actual Effort :** ~5 pts (conforme).
