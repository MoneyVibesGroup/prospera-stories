# Story FE-B04 : Contrôle d'intégrité de la balance (équilibre, anomalies, blocage)

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 3 · **Sprint :** 5 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/balances/{id}/controls`) via gateway · **Backend d'appui :** STORY-051 (contrôle d'intégrité)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-002)
**Backend prêt :** S10
**Dépendances :** FE-B02 (import)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b04`. Commits préfixés `FE-B04`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (rapport de contrôle : équilibre + liste d'anomalies), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **comptable interne**,
je veux **être alerté si ma balance est déséquilibrée ou contient des anomalies**,
afin de **corriger avant de générer des états faux**.

---

## Contexte

À l'import, le backend contrôle la cohérence (FR-002) : équilibre Σdébits = Σcrédits **et** Σsoldes = 0 (tolérance d'arrondi), doublons, comptes vides, montants non numériques. Le frontend **restitue** ce rapport et matérialise le fait qu'une balance déséquilibrée est **bloquée à la validation** (l'import en brouillon reste possible avec alerte).

---

## Périmètre

**Inclus :**
- **Rapport de contrôle** : synthèse d'équilibre (totaux débits/crédits/soldes + écart), liste des **anomalies** (type, ligne/compte concerné, sévérité).
- **Distinction bloquant / non bloquant** : les anomalies bloquantes empêcheront la validation (FE-B10) ; l'affichage l'annonce clairement.
- **Alerte explicite** en cas de déséquilibre ; l'import reste consultable en brouillon.
- Rafraîchissement du rapport après re-import/mapping.

**Hors périmètre :**
- Correction en ligne des lignes (le fichier source est corrigé et ré-importé — pas d'édition ligne à ligne en v1).
- Génération des états (EPIC-011, FE-B07+).

---

## Critères d'acceptation

- [ ] Synthèse d'équilibre affichée (totaux + écart, tolérance) ; statut équilibré/déséquilibré clair.
- [ ] Liste des anomalies (type, cible, sévérité) ; distinction bloquant/non bloquant.
- [ ] Une balance déséquilibrée est signalée comme **bloquante pour la validation** (message explicite) tout en restant consultable.
- [ ] Rapport rafraîchi après re-import/mapping.
- [ ] i18n FR ; tests : équilibré/déséquilibré, rendu anomalies, distinction bloquant.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query contrôle | `src/features/bilan/import/api/get-controls.ts` + `hooks/*` | Nouveau |
| Écran | `src/features/bilan/import/components/IntegrityReport.tsx` | Nouveau |

**Décisions & vigilance :**
- **Reflet, pas calcul** : le contrôle est fait par le backend (déterminisme comptable, NFR-003) ; le front restitue, ne recalcule pas.
- **Sévérité** : bien distinguer bloquant (empêche la validation) d'informatif, pour ne pas paralyser inutilement.

---

## Tasks / Subtasks

- [ ] Query rapport de contrôle (AC 1, 2)
- [ ] `IntegrityReport` (équilibre + anomalies + sévérité) (AC 1, 2, 3)
- [ ] Rafraîchissement post re-import (AC 4)
- [ ] i18n + tests (AC 5)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b04`, préfixés `FE-B04`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
