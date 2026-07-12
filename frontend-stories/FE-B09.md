# Story FE-B09 : TFT/TAFIRE + notes annexes + contrôles de cohérence de la liasse

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 5 · **Sprint :** 6 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/etats/tft`, `/bilan/etats/annexes`, `/bilan/etats/controls`) via gateway · **Backend d'appui :** STORY-061 (TFT/TAFIRE), STORY-062 (notes annexes), STORY-063 (contrôles de cohérence)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-011/012/013)
**Backend prêt :** S12
**Dépendances :** FE-B07 (Bilan), FE-B08 (CR)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b09`. Commits préfixés `FE-B09`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (TFT + annexes + panneau de contrôles de cohérence), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **gestionnaire**,
je veux **consulter le tableau des flux de trésorerie, les notes annexes calculables, et la liste des contrôles de cohérence**,
afin de **compléter ma liasse et repérer les anomalies avant validation**.

---

## Contexte

Complète la liasse OHADA. TFT/TAFIRE (FR-011) construit à partir du Bilan N/N-1 et du CR ; **contrôle** : variation de trésorerie du TFT = variation de trésorerie du Bilan. Notes annexes (FR-012) : tableaux calculables depuis la balance/liasse, avec zones « à compléter ». Contrôles de cohérence (FR-013) : batterie d'articulation Bilan↔CR↔TFT restituée comme liste d'anomalies avant validation.

---

## Périmètre

**Inclus :**
- **TFT/TAFIRE** : flux exploitation/investissement/financement (réutilise `FinancialTable`) ; contrôle variation trésorerie TFT = Bilan.
- **Notes annexes** : tableaux annexes calculables ; zones non déductibles marquées « à compléter » (non éditables en v1).
- **Panneau contrôles de cohérence** : liste d'anomalies d'articulation (poste/compte concerné, sévérité, bloquant/non) — centralise les indicateurs de FE-B07/B08 + TFT.
- Statut brouillon/validé.

**Hors périmètre :**
- Validation/figement (FE-B10).
- Export (FE-B14).

---

## Critères d'acceptation

- [ ] TFT/TAFIRE restitué (flux exploitation/invest./financement) ; contrôle variation trésorerie TFT = Bilan signalé.
- [ ] Notes annexes calculables affichées ; zones « à compléter » identifiées.
- [ ] Panneau de contrôles de cohérence : anomalies d'articulation listées (cible, sévérité, bloquant) ; validation possible seulement si les bloquants passent (message).
- [ ] i18n FR ; tests : TFT, contrôle trésorerie, annexes « à compléter », liste d'anomalies.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Queries | `src/features/bilan/etats/api/{get-tft,get-annexes,get-controls}.ts` | Nouveau |
| Écrans | `src/features/bilan/etats/components/{TftStatement,AnnexesView,CoherencePanel}.tsx` | Nouveau |

**Décisions & vigilance :**
- **CoherencePanel = point unique** des anomalies d'articulation (mutualise les indicateurs de B07/B08/TFT) — c'est ce panneau que FE-B10 consulte pour autoriser la validation.
- **Annexes « à compléter »** : bien distinguer le calculable de l'à-saisir (non éditable en v1).
- **Reflet, pas calcul** (NFR-003).

---

## Tasks / Subtasks

- [ ] `TftStatement` + contrôle trésorerie (AC 1)
- [ ] `AnnexesView` (calculable + « à compléter ») (AC 2)
- [ ] `CoherencePanel` (anomalies articulation) (AC 3)
- [ ] i18n + tests (AC 4)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b09`, préfixés `FE-B09`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
