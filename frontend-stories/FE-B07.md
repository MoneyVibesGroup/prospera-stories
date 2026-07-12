# Story FE-B07 : Bilan (actif/passif) N/N-1 + contrôle actif=passif

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 5 · **Sprint :** 6 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/etats/bilan`) via gateway · **Backend d'appui :** STORY-059 (Bilan actif/passif)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-009)
**Backend prêt :** S12
**Dépendances :** FE-B06 (mapping), FE-B05 (N-1)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b07`. Commits préfixés `FE-B07`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (état Bilan actif/passif N/N-1), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **gestionnaire**,
je veux **consulter le Bilan (actif/passif) avec colonnes N et N-1**,
afin de **disposer de cet état financier et vérifier son équilibre**.

---

## Contexte

Premier état de la liasse OHADA (FR-009). Le backend calcule les postes d'actif/passif selon la table de passage (FE-B06) et les soldes mappés ; le frontend **restitue** la présentation N/N-1 et le **contrôle actif=passif** (anomalie bloquante à la validation si non respecté).

---

## Périmètre

**Inclus :**
- **Restitution du Bilan** : postes d'actif et de passif, hiérarchie/regroupements du référentiel, colonnes **N / N-1**.
- **Contrôle actif=passif** : indicateur visible ; écart signalé (relié aux contrôles de cohérence FE-B09 et au blocage de validation FE-B10).
- Navigation depuis le shell module ; états chargement/erreur/empty ; brouillon vs validé (badge de statut).

**Hors périmètre :**
- Compte de résultat (FE-B08), TFT/annexes (FE-B09).
- Export (FE-B14).

---

## Critères d'acceptation

- [ ] Bilan restitué (actif/passif, regroupements du référentiel) avec colonnes N/N-1.
- [ ] Contrôle actif=passif affiché ; écart signalé clairement.
- [ ] Statut (brouillon/validé) visible ; si N-1 absent, colonne vide (pas de valeur inventée).
- [ ] États chargement/erreur/empty ; i18n FR ; tests : rendu postes, N/N-1, contrôle équilibre.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query état | `src/features/bilan/etats/api/get-bilan.ts` + `hooks/*` | Nouveau |
| Écran | `src/features/bilan/etats/components/BilanStatement.tsx` | Nouveau |
| Rendu tableau | `src/features/bilan/etats/components/FinancialTable.tsx` (réutilisable CR/TFT) | Nouveau |

**Décisions & vigilance :**
- **Reflet, pas calcul** : les montants viennent du backend (déterminisme, NFR-003) ; le front présente.
- **Composant de tableau financier réutilisable** : concevoir `FinancialTable` pour resservir en CR (FE-B08) et TFT (FE-B09).
- **XOF** : formatage monétaire cohérent (séparateurs, pas de décimales superflues) — centraliser.

---

## Tasks / Subtasks

- [ ] Query Bilan + `FinancialTable` réutilisable (AC 1)
- [ ] `BilanStatement` (N/N-1 + contrôle actif=passif) (AC 1, 2)
- [ ] Badge statut + N-1 absent (AC 3)
- [ ] i18n + tests (AC 4)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b07`, préfixés `FE-B07`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
