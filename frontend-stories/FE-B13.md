# Story FE-B13 : Consultation des états & prévisionnel (N/N-1, versions) + comparaison inter-exercices

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 3 · **Sprint :** 8 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/consultation`, `/bilan/comparaison`) via gateway · **Backend d'appui :** STORY-072 (consultation), STORY-074 (comparaison inter-exercices)
**Réf. plan :** `docs/frontend-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-022/024)
**Backend prêt :** S14
**Dépendances :** FE-B07/B08/B09 (états), FE-B10 (versions)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b13`. Commits préfixés `FE-B13`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (consultation par exercice/version + comparaison inter-exercices), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant qu'**utilisateur**,
je veux **consulter les états et le prévisionnel par exercice et version, et comparer l'évolution des postes sur plusieurs exercices**,
afin d'**exploiter et analyser mes données financières dans le temps**.

---

## Contexte

Restitution structurée (FR-022) : lecture d'un jeu d'états par exercice/version avec statut (brouillon/validé), N/N-1, sous le gate `@RequiresBilanAccess`. Comparaison inter-exercices (FR-024, Could) : évolution des postes sur ≥ 2 exercices validés (au-delà du simple N/N-1).

---

## Périmètre

**Inclus :**
- **Sélecteur exercice + version** (brouillon/validé) ; consultation des états (Bilan/CR/TFT/annexes) et du prévisionnel en lecture, N/N-1.
- **Comparaison inter-exercices** : sélection de ≥ 2 exercices validés → tableau d'évolution par poste.
- Cohérence avec le gate d'accès (FE-B00) ; isolation `orgId` (backend).

**Hors périmètre :**
- Export (FE-B14).
- Édition (les états sont en lecture ; l'immutabilité vient de FE-B10).

---

## Critères d'acceptation

- [ ] Consultation d'un jeu d'états par exercice/version avec statut (brouillon/validé), N/N-1.
- [ ] Comparaison de ≥ 2 exercices validés : tableau d'évolution par poste.
- [ ] Accès soumis au gate (FE-B00) ; aucune donnée d'une autre org (backend).
- [ ] i18n FR ; tests : sélection exercice/version, rendu consultation, comparaison inter-exercices.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Queries | `src/features/bilan/consultation/api/*` + `hooks/*` | Nouveau |
| Écrans | `src/features/bilan/consultation/components/{StatementViewer,InterExerciceCompare}.tsx` | Nouveau |

**Décisions & vigilance :**
- **Réutilisation** : `StatementViewer` réutilise `FinancialTable` (FE-B07) pour l'affichage.
- **FR-024 = Could** : la comparaison inter-exercices est la partie la moins prioritaire — livrable en dernier si la capacité manque.

---

## Tasks / Subtasks

- [ ] Sélecteur exercice/version + `StatementViewer` (AC 1)
- [ ] `InterExerciceCompare` (évolution par poste) (AC 2)
- [ ] Cohérence gate + i18n + tests (AC 3, 4)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b13`, préfixés `FE-B13`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
