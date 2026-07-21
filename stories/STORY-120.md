# STORY-120 : **SFD-BCEAO complet** `@2.0` — totaux du Bilan + SIG DIMF 2080 (compléter l'amorce allégée `@1.0`) — FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service) — **extension** (EPIC-010 clos ; réouverture ciblée pour compléter le SFD)
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-007 (multi-référentiel SYSCOHADA + SFD-BCEAO)
**Réf. analyse :** `docs/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §1 · `docs/referentiels/README-sfd-bceao.md`
**Réf. code livré :** STORY-057 (`sfd-bceao@1.0` allégé) · STORY-110/111/112 (modèle d'opérandes + évaluateur `FORMULE` + sous-totaux/SIG) · STORY-038 (loader/registre)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** in_progress ⏳ (incrément 1 — paquet `@2.0` + cohérence — livré 2026-07-21 ; production moteur + vérif docker + validation experte restants)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 15 (ajout hors engagement initial — extension EPIC-010/FR-007)

---

## User Story

**En tant qu'**organisation de type SFD/microfinance (et l'opérateur du référentiel PROSPERA),
**je veux** un référentiel SFD-BCEAO **complet** — avec les **totaux du Bilan** et les **Soldes Intermédiaires de Gestion** (SIG) du **DIMF 2080** —,
**afin de** produire un Compte de résultat SFD avec une **ligne de résultat** (excédent/déficit) et un Bilan avec ses grands totaux, sans fork de code (P7).

---

## Description

### Contexte
`sfd-bceao@1.0` (STORY-057) est une **amorce allégée** : classes 1-7 en **détail** seulement — le Bilan n'a **aucun total calculé** et le Compte de résultat s'arrête aux charges/produits, **sans SIG ni bottom line**. Depuis, le moteur B8 sait évaluer des postes `regle='FORMULE'` via des **opérandes signées** (STORY-110/111/112). On peut donc **compléter** le SFD **en données pures**, sans toucher au moteur.

### Ce que `@2.0` ajoute (cf. analyse §1.2/§1.3, sourcé RCSFD, à valider par expert SFD)
- **Totaux Bilan** : postes `FORMULE` **BAT = ΣBAi** / **BPT = ΣBPi** (marqueurs `role` TOTAL_ACTIF/TOTAL_PASSIF) ; le résultat (compte 59) étant déjà logé dans BP4 → équilibre `BAT = BPT`.
- **SIG DIMF 2080** : cascade `FORMULE` **RSA** (résultat financier) → **RSB** (autres activités) → **RSC** (résultat brut d'exploitation) → **RSD** (résultat d'exploitation, cpte 595) → **RSE** (résultat exceptionnel, 596) → **RSF** (avant impôt) → **RSG** (excédent/déficit net, 592).
- **Toujours pas de TFT** : le RCSFD **n'en prévoit pas** → aucun marqueur `tresorerie` (agnosticisme P7 conservé).

### Additif — `@1.0` intact
`@2.0` est une **nouvelle version packagée** ; `@1.0` (et ses 4 specs) reste embarqué. Les versions coexistent (loader keyé `code@version`). **Même** plan de comptes réutilisé.

---

## Scope

**Dans le périmètre :**
- Sources `postes-sfd-v2.json` (+ SIG + totaux) et `table-de-passage-sfd-v2.json` (+ règle `FORMULE`, opérandes) ; **plan réutilisé** (`plan-comptable-sfd.json`).
- Entrée `sfd-bceao@2.0` dans `build.mjs` + `ReferentielRegistry` (checksum réel).
- Spec de cohérence (CC1..CC4) + preuve « `@2.0` apporte les `FORMULE` que `@1.0` n'avait pas ».

**Hors périmètre :**
- **Production réelle de la liasse SFD** (calcul des SIG sur une balance SFD importée → `BilanProductionService`) et sa **vérification docker** : increment 2.
- **Validation experte** de l'ordonnancement des SIG (cascade proposée, ancrée sur les comptes 592-596).
- Attribution d'un entitlement `sfd-bceao@2.0` à une org (catalog/read-model).

---

## Acceptance Criteria
- [ ] **AC-1 — Packagé & chargeable.** `resolve('sfd-bceao','2.0')` ≠ null ; `load` renvoie un paquet plan/postes/mapping non vides ; checksum falsifié → `ReferentielIntegrityError`.
- [ ] **AC-2 — Plan bien formé (CC1) & plan ⊇ table (CC2).** Classes 1-7, 0 orphelin.
- [ ] **AC-3 — Déterminisme (CC3).** `build.mjs` reproductible ; checksum registre = sha256 artefact = `meta.checksum`.
- [ ] **AC-4 — Cascades FORMULE intègres (CC4).** Chaque opérande des postes `FORMULE` (BAT/BPT/RSA..RSG) référence un poste **déclaré** du même état.
- [ ] **AC-5 — Complétude vs `@1.0`.** `@2.0` déclare ≥ 1 poste `FORMULE` (totaux + SIG) là où `@1.0` n'en a **aucun** ; **même** plan de comptes.
- [ ] **AC-6 — Non-régression.** `sfd-bceao@1.0` et `syscohada-revise@2.1` **inchangés** (artefacts, checksums, specs).
- [ ] **AC-7 (increment 2) — Production réelle.** Sur une balance SFD importée, le moteur calcule BAT/BPT et la cascade SIG jusqu'à RSG ; **vérifié docker**.

---

## Definition of Done
- [ ] Lint 0 warning · build OK · couverture ≥ seuils · unit + e2e verts.
- [ ] AC-1 → AC-6 validés (**faits**, increment 1) ; **AC-7 + vérif docker réelle** (increment 2, en attente).
- [ ] Non-régression SYSCOHADA/SFD@1.0 (checksums intacts).
- [ ] `/code-review` + PR `MNV-120` → `dev` (Rebase and merge) — **en attente**.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée à partir de la re-analyse de complétude du SFD (analyse §1) par vivian.
- 2026-07-21 : **Incrément 1 livré** (paquet `@2.0` + registry + spec de cohérence, verts) — `defined → in_progress`.

**Incrément 1 (fait) :** `sfd-bceao@2.0` packagé (plan **156** comptes réutilisés, **31** postes dont 9 `FORMULE`, **31** règles). Artefact `sfd-bceao-2.0.json` sha256 `ee9bf014…`. `referentiels-additionnels-coherence.spec.ts` CC1..CC4 + AC-5 **verts**. **Non-régression prouvée** : SYSCOHADA `01b892c0…` et SFD@1.0 `0509a034…` **inchangés** (regénération `build.mjs`). Lint 0 sur `referentiel/**`.

**Reste (increment 2) :** production de la liasse SFD complète (`BilanProductionService` évaluant BAT/BPT + SIG sur une balance SFD), **vérification docker réelle** (chargement + calcul dans `prospera-bilan-service-1`), **validation experte** de la cascade SIG, `/code-review` + PR.

---

**Story créée avec la méthode BMAD v6 — extension EPIC-010 (FR-007).**
