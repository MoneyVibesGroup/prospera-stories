# Story FE-B08 : Compte de résultat N/N-1

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 3 · **Sprint :** 6 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/etats/resultat`) via gateway · **Backend d'appui :** STORY-060 (Compte de résultat)
**Réf. plan :** `docs/frontend-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-010)
**Backend prêt :** S12
**Dépendances :** FE-B07 (Bilan + `FinancialTable`)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b08`. Commits préfixés `FE-B08`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (état Compte de résultat N/N-1), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **gestionnaire**,
je veux **consulter le Compte de résultat (charges/produits, résultat net) avec colonnes N et N-1**,
afin de **connaître la performance de l'exercice et sa cohérence avec le Bilan**.

---

## Contexte

Deuxième état de la liasse (FR-010). Produits/charges/soldes intermédiaires/résultat net calculés selon le référentiel ; **cohérence** attendue : résultat net du CR = résultat repris au passif du Bilan. Réutilise le `FinancialTable` de FE-B07.

---

## Périmètre

**Inclus :**
- **Restitution du CR** : produits, charges, soldes intermédiaires, résultat net, colonnes **N / N-1**.
- **Indicateur de cohérence** : résultat net CR = résultat au passif du Bilan (signalé si écart).
- Statut brouillon/validé ; états chargement/erreur/empty.

**Hors périmètre :**
- TFT/annexes (FE-B09), contrôles globaux d'articulation (FE-B09).
- Export (FE-B14).

---

## Critères d'acceptation

- [ ] CR restitué (produits/charges/résultat) avec colonnes N/N-1 (réutilise `FinancialTable`).
- [ ] Cohérence résultat CR ↔ passif Bilan signalée (ok/écart).
- [ ] N-1 absent → colonne vide ; statut brouillon/validé visible.
- [ ] i18n FR ; tests : rendu, N/N-1, cohérence résultat.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query état | `src/features/bilan/etats/api/get-resultat.ts` + `hooks/*` | Nouveau |
| Écran | `src/features/bilan/etats/components/ResultatStatement.tsx` (réutilise `FinancialTable`) | Nouveau |

**Décisions & vigilance :**
- **Réutilisation** : ne pas re-créer un tableau financier ; étendre `FinancialTable` (FE-B07) si besoin.
- **Cohérence** : l'indicateur CR↔Bilan prépare les contrôles d'articulation (FE-B09) — mutualiser la logique d'affichage d'anomalie.

---

## Tasks / Subtasks

- [ ] Query CR + `ResultatStatement` (AC 1)
- [ ] Indicateur de cohérence résultat (AC 2)
- [ ] N-1 absent + statut (AC 3)
- [ ] i18n + tests (AC 4)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b08`, préfixés `FE-B08`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
