# Story FE-B12 : Projection 3 ans + plan de trésorerie 12 mois + scénarios comparés

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 8 · **Sprint :** 7 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/previsionnel/projection`, `/tresorerie`, `/scenarios`) via gateway · **Backend d'appui :** STORY-069 (projection 3 ans), STORY-070 (trésorerie 12 mois), STORY-071 (scénarios)
**Réf. plan :** `docs/frontend-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-019/020/021)
**Backend prêt :** S14
**Dépendances :** FE-B11 (hypothèses)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b12`. Commits préfixés `FE-B12`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (projection annuelle + plan de trésorerie mensuel + comparaison de scénarios, avec visualisations), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **dirigeant**,
je veux **projeter mon résultat sur 3 ans, ma trésorerie sur 12 mois, et comparer plusieurs scénarios**,
afin de **piloter l'activité et arbitrer entre hypothèses**.

---

## Contexte

Cœur restituable du prévisionnel (différenciateur produit). À partir des hypothèses (FE-B11) et de la base validée : projection annuelle N+1..N+3 (CR + trésorerie + bilan simplifié, FR-019), plan de trésorerie mensuel 12 mois (encaissements/décaissements, échéancier BFR, FR-020), et **scénarios comparés** (prudent/central/optimiste, FR-021). Restitution structurée + visualisations. Recalcul réactif (NFR-006, < ~2 s).

---

## Périmètre

**Inclus :**
- **Projection annuelle 3 ans** : CR prévisionnel + trésorerie annuelle + bilan simplifié N+1..N+3 (tableaux).
- **Plan de trésorerie mensuel 12 mois** : encaissements/décaissements, solde cumulé par mois ; visualisation (courbe de trésorerie).
- **Scénarios comparés** : ≥ 2 jeux d'hypothèses (FE-B11) côte à côte sur les indicateurs clés (résultat, trésorerie de fin de période) ; tableau + graphe comparatif.
- Recalcul à l'édition des hypothèses ; états chargement/erreur.

**Hors périmètre :**
- Export (FE-B14) ; consultation/versions des états validés (FE-B13).

---

## Critères d'acceptation

- [ ] Projection annuelle N+1..N+3 (CR + trésorerie + bilan simplifié) restituée depuis les hypothèses.
- [ ] Plan de trésorerie mensuel 12 mois (solde cumulé) + visualisation ; cohérence somme annualisée ↔ projection N+1.
- [ ] Comparaison de ≥ 2 scénarios sur indicateurs clés (tableau + graphe).
- [ ] Recalcul réactif à l'édition des hypothèses ; états de chargement.
- [ ] i18n FR ; tests : projection, trésorerie 12 mois, comparaison scénarios, recalcul.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Queries | `src/features/bilan/previsionnel/api/{projection,tresorerie,scenarios}.ts` | Nouveau |
| Écrans | `src/features/bilan/previsionnel/components/{ProjectionTable,TresorerieChart,ScenariosCompare}.tsx` | Nouveau |

**Décisions & vigilance :**
- **DataViz** : courbe de trésorerie + comparatif scénarios → suivre la skill `dataviz` (lisibilité, light/dark, tokens DS, accessibilité) avant d'écrire le code des graphes.
- **Reflet, pas calcul** : les projections viennent du backend ; le front présente et déclenche le recalcul (édition d'hypothèses → invalidation).
- **Réactivité** : viser un recalcul fluide (NFR-006) ; états de chargement discrets.

---

## Tasks / Subtasks

- [ ] `ProjectionTable` (3 ans) (AC 1)
- [ ] `TresorerieChart` (12 mois, viz) (AC 2)
- [ ] `ScenariosCompare` (tableau + graphe) (AC 3)
- [ ] Recalcul réactif (invalidation sur hypothèses) (AC 4)
- [ ] i18n + tests (AC 5)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] Visualisations conformes à la skill `dataviz` (light/dark, a11y).
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b12`, préfixés `FE-B12`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
