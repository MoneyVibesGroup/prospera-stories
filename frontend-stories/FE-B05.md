# Story FE-B05 : Import/association comparatif N-1 (colonnes N/N-1)

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 3 · **Sprint :** 5 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/balances`, association N/N-1) via gateway · **Backend d'appui :** STORY-052 (comparatif N-1)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-003)
**Backend prêt :** S10
**Dépendances :** FE-B01 (exercices), FE-B02 (import)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b05`. Commits préfixés `FE-B05`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (association N ↔ N-1), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **comptable interne**,
je veux **fournir/associer la balance de l'exercice précédent (N-1)**,
afin de **produire les colonnes comparatives N/N-1 exigées par la présentation OHADA**.

---

## Contexte

La présentation OHADA exige des colonnes **N et N-1** (FR-003). L'utilisateur importe la balance N-1 **ou** reprend celle d'un exercice précédent déjà présent, et l'associe explicitement à la balance N du même `orgId`. Si N-1 est absent, la colonne comparative reste **vide** (jamais inventée).

---

## Périmètre

**Inclus :**
- **Association N ↔ N-1** : soit importer une balance N-1 (réutilise le flux FE-B02), soit **reprendre** une balance existante d'un exercice antérieur.
- Indicateur clair de l'état du comparatif (présent / absent).
- Cohérence avec le chaînage d'exercices (FE-B01).

**Hors périmètre :**
- Rendu des états N/N-1 (FE-B07+ pour Bilan/CR).
- Comparaison multi-exercices au-delà de N/N-1 (FE-B13).

---

## Critères d'acceptation

- [ ] Association explicite balance N ↔ balance N-1 d'un même `orgId` (import ou reprise d'un exercice antérieur).
- [ ] État du comparatif visible (présent/absent) ; si absent, indiqué comme tel (pas de valeur inventée).
- [ ] Cohérence avec le chaînage d'exercices (FE-B01).
- [ ] i18n FR ; tests : import N-1, reprise d'un exercice, absence de N-1.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query/mutations | `src/features/bilan/import/api/comparatif.ts` + `hooks/*` | Nouveau |
| Écran | `src/features/bilan/import/components/ComparatifN1.tsx` | Nouveau |

**Décisions & vigilance :**
- **Ne jamais inventer** un comparatif : si N-1 absent, colonnes vides (invariant FR-003).
- **Réutilisation** : l'import N-1 réutilise le flux FE-B02 (ne pas dupliquer le composant d'upload).

---

## Tasks / Subtasks

- [ ] Association N/N-1 (import ou reprise) (AC 1)
- [ ] Indicateur d'état comparatif (AC 2)
- [ ] Cohérence chaînage exercices (AC 3)
- [ ] i18n + tests (AC 4)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b05`, préfixés `FE-B05`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
