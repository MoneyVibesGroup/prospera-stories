# STORY-068 : Prévisionnel — hypothèses paramétrables (croissance, marges, BFR, invest., financement) sur base validée — FR-018

**Epic :** EPIC-013 — Prévisionnel (mensuel 12 mois + annuel 3 ans) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-018 (jeu d'hypothèses nommé, rattaché à un exercice de base **validé** ; éditable et versionné ; base = snapshot validé traçable) ; **dépend FR-015**
**Réf. code livré :** **STORY-065** (`SnapshotLiasse` — la base validée traçable ; `dernier`) · **STORY-064** (`JeuEtats` VALIDÉ) · **STORY-058/066** (patron agrégat persisté tenant-scoped + `E11000`→409)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + auto-revue + intégrée dans `dev` le 2026-07-21 — PR #24 bilan-service, MNV-068 « Rebase and merge », HEAD `344d15e`, branche supprimée)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 14

---

## User Story

**En tant que** cabinet comptable ayant validé sa liasse,
**je veux** saisir un **jeu d'hypothèses de projection nommé** (croissance du CA, taux de marge/charges, délais BFR clients/fournisseurs/stocks, investissements, financement, remboursements), **rattaché à une base validée** et **éditable/versionné**,
**afin de** préparer un prévisionnel **ancré sur un snapshot validé traçable** (les projections elles-mêmes — CR/trésorerie/bilan simplifié — viennent ensuite, FR-019/020).

---

## Description

### Contexte & cadrage

EPIC-012 (064→067) a livré la liasse **validée, immuable, tracée**. STORY-068 **amorce le prévisionnel** (EPIC-013) : un agrégat `JeuHypotheses` — un **jeu d'hypothèses nommé**, **rattaché à un snapshot validé** (la base traçable), **éditable et versionné**. **068 ne calcule aucune projection** (FR-019 annuel / FR-020 mensuel = stories suivantes) : il **stocke et versionne les paramètres** sur une base validée.

### Ce que 068 livre

1. **`JeuHypotheses`** (collection `jeux_hypotheses`, tenant-scoped) : `nom` (unique par org), **`base`** (`{ jeuEtatsId, snapshotId, version, exercice }` — le snapshot validé traçable), **`hypotheses`** (paramètres, voir ci-dessous), `version` (compteur d'éditions), timestamps. **Index unique** `(tenantId, nom)`.
2. **Paramètres d'hypothèses** : `croissanceCaPct`, `tauxMargePct`, `tauxChargesPct`, `delaiBfrClientsJours`, `delaiBfrFournisseursJours`, `delaiBfrStocksJours`, `investissements`, `financement`, `remboursements` (nombres bornés, unités mineures XOF pour les montants).
3. **Rattachement à une base validée** : la création **exige** un `baseJeuEtatsId` dont le jeu est **VALIDÉ** (sinon 409 `BASE_NON_VALIDEE`) ; le service capture le **dernier snapshot** de ce jeu (065) comme base traçable.
4. **Éditable + versionné** : `PUT /:id` remplace les paramètres et **incrémente `version`** (l'historique complet des versions d'hypothèses = hook documenté ; 068 versionne par compteur + base figée).
5. **Consultation** : `GET /bilan/hypotheses` (liste), `GET /:id`.

### Frontières nettes

- **Projections** (CR prévisionnel FR-019, trésorerie mensuelle FR-020, scénarios FR-021) → stories suivantes. 068 = **paramètres seulement**.
- **Dérivation des projections depuis la base** → hook (la base `snapshotId` est capturée pour ça).

---

## Scope

**Dans le périmètre :**
- `JeuHypotheses` schema (index unique `(tenantId, nom)`) + `JeuHypothesesRepository` + `JeuHypothesesService` (creer avec garde base VALIDÉE, editer avec bump version, lister, consulter) + `JeuHypothesesController` + DTOs (créer/éditer/réponse).
- Réutilise `JeuEtatsRepository` (findById base) + `SnapshotLiasseRepository` (`dernier` → base traçable).
- Tests unit + e2e + **vérif docker réelle** (création sur base validée, refus si base non validée, édition→version++, unicité nom, isolation).

**Hors périmètre :** projections (FR-019/020/021), historique complet des versions d'hypothèses, dérivation.

---

## Critères d'acceptation

- [ ] `POST /bilan/hypotheses` crée un jeu **nommé** rattaché à un `baseJeuEtatsId` **VALIDÉ** ; base = **dernier snapshot** (traçable `snapshotId`+`version`). Base non validée → **409 `BASE_NON_VALIDEE`** ; base introuvable → **404**.
- [ ] Les paramètres d'hypothèses (croissance, marges, BFR, invest., financement) sont **stockés et validés** (bornes).
- [ ] `PUT /bilan/hypotheses/:id` **édite** les paramètres et **incrémente `version`** ; la base reste figée.
- [ ] `nom` **unique par org** (409 `HYPOTHESES_EXISTE` sur doublon) ; `GET` liste + `GET /:id`.
- [ ] **Isolation** : jeu d'hypothèses d'une autre org → **404** ; gate `@RequiresBilanAccess` (403) ; sans jeton (401).

---

## Notes techniques

- **Nouveau dossier** `src/modules/bilan/hypotheses/` : `hypotheses.schema.ts`, `hypotheses.repository.ts`, `hypotheses.service.ts`, `hypotheses.controller.ts`, `dto/`.
- **Garde base validée** : `JeuHypothesesService.creer` injecte `JeuEtatsRepository` + `SnapshotLiasseRepository` — charge le jeu base (404 anti-énum), vérifie `statut === VALIDE` (409 `BASE_NON_VALIDEE`), capture `snapshots.dernier(baseId)` (409 si aucun snapshot).
- **Édition** : `updateOne` (bump `version`, remplace `hypotheses`). Écritures mono-document (pas de transaction).
- **`E11000`** (nom dupliqué) → 409 générique. Anti-énum 404 inter-org.

---

## Dépendances

**Prérequis :** STORY-064/065 (base validée + snapshot) ✅.
**Débloque :** FR-019 (projection annuelle), FR-020 (trésorerie mensuelle), FR-021 (scénarios).

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ 65/90/90/90 · unit + e2e · non-régression EPIC-012 + dry-run 059→063.
- [ ] **Vérif docker réelle** (création sur base validée + refus base non validée + édition version++ + unicité nom + isolation) consignée dans *Progress Tracking*.
- [ ] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [ ] Flux git : `MNV-068` sur `dev` + docs sur `main`, PR « Rebase and merge ».

---

## Story Points Breakdown

- `JeuHypotheses` + repo + service (garde base validée) : 2,5 pts · éditer/version + endpoints + DTOs : 1,5 pt · tests + docker : 1 pt · **Total : 5 pts**.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (Scrum Master).
- 2026-07-21 : Développée (Developer) — agrégat JeuHypotheses + garde base validée + édition versionnée. Intégrée dans `dev` (PR #24, MNV-068, rebase-merge, HEAD `344d15e`).

**Réalisé :**
- **`JeuHypotheses`** (collection `jeux_hypotheses`, tenant-scoped) : `nom`, `base` (`{jeuEtatsId, snapshotId, version, exercice}` — snapshot 065 traçable), `hypotheses` (9 paramètres bornés), `version` (compteur d'éditions). **Index unique** `(tenantId, nom)`.
- **`JeuHypothesesService.creer`** : charge le jeu base (404 `BASE_INTROUVABLE`), **exige** `statut === VALIDE` **et** un snapshot (`SnapshotLiasseRepository.dernier`) sinon **409 `BASE_NON_VALIDEE`** ; capture la base ; `E11000` → **409 `HYPOTHESES_EXISTE`**.
- **`editer`** : remplace les paramètres + `version + 1` (base figée). `lister`/`consulter` (404 anti-énum).
- **`JeuHypothesesController`** `/bilan/hypotheses` (POST/GET/GET :id/PUT :id) — `@RequiresBilanAccess` + `@Roles`. DTOs bornés (pourcentages, jours, montants XOF).
- **Aucune projection** (FR-019 annuel / FR-020 mensuel / FR-021 scénarios = stories suivantes) ; la base `snapshotId` est le hook de dérivation.

**Qualité (DoD) :** lint 0 · build OK · **454 unit + 103 e2e** verts · `hypotheses` **98.9 / 100 / 100 / 98.8**, global 98.4/92.6/98.9/98.4 · non-régression EPIC-012 + dry-run 059→063.

**Vérification docker réelle :** bilan-service redémarré, org `6a5ec161…`, JWT RS256 réel.
- **Index unique** `jeux_hypotheses (tenantId, nom)` présent.
- Base préparée : jeu `PREV2025` **validé** (snapshot v1) + un jeu **BROUILLON**.
- **Créer sur base validée** → **201** ; `version=1`, **base traçable** (`base.exercice=PREV2025`, `base.version=1`, `snapshotId`) ; doc `jeux_hypotheses` persisté (`hypotheses.croissanceCaPct=10`).
- **Éditer** (`PUT`) → `version=2`, `croissanceCaPct=25`, **`base.version` figée à 1**.
- **Gardes** : base `BROUILLON` → **409 `BASE_NON_VALIDEE`** ; base inconnue → **404 `BASE_INTROUVABLE`** ; nom en doublon → **409 `HYPOTHESES_EXISTE`**.
- **Isolation** : jeu d'hypothèses d'une **autre org** → **404**.

**Actual Effort :** ~5 pts (conforme).
