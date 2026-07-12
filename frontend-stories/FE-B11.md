# Story FE-B11 : Hypothèses de prévisionnel paramétrables

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 5 · **Sprint :** 7 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/previsionnel/hypotheses`) via gateway · **Backend d'appui :** STORY-068 (hypothèses de prévisionnel)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-018)
**Backend prêt :** S13
**Dépendances :** FE-B10 (liasse validée = base du prévisionnel)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b11`. Commits préfixés `FE-B11`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (saisie des hypothèses de projection), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **dirigeant / comptable**,
je veux **saisir des hypothèses de projection à partir d'une liasse validée**,
afin de **construire un prévisionnel fondé sur des données figées**.

---

## Contexte

Point de départ du prévisionnel (FR-018). À partir d'une liasse **validée** (base, FE-B10), l'utilisateur saisit des hypothèses : croissance du CA, taux de marge/charges, délais BFR (clients/fournisseurs/stocks), investissements, financement/remboursements. Le jeu d'hypothèses est **nommé**, rattaché à l'exercice de base validé, éditable et **versionné**.

---

## Périmètre

**Inclus :**
- **Sélection de la base** : liasse validée servant de socle (FE-B10) ; refus si aucune base validée.
- **Formulaire d'hypothèses** : croissance CA, marges/charges, délais BFR, investissements, financement — validations (Zod, plages cohérentes).
- **Jeux d'hypothèses nommés** : créer/nommer, lister, éditer, dupliquer ; versionnés et tracés (base = snapshot validé).
- Retour d'état ; préparation du recalcul (FE-B12).

**Hors périmètre :**
- Génération des projections/plan de trésorerie (FE-B12).
- Comparaison de scénarios (FE-B12).

---

## Critères d'acceptation

- [ ] Base = liasse validée (FE-B10) ; sans base validée, saisie bloquée + message.
- [ ] Formulaire d'hypothèses complet (CA, marges, BFR, invest., financement) avec validations.
- [ ] Jeux d'hypothèses nommés : créer/lister/éditer/dupliquer ; rattachés à l'exercice de base ; versionnés.
- [ ] i18n FR ; tests : blocage sans base, validations, CRUD jeux d'hypothèses.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query/mutations | `src/features/bilan/previsionnel/api/hypotheses.ts` + `hooks/*` | Nouveau |
| Écrans | `src/features/bilan/previsionnel/components/{HypothesesForm,HypothesesSets}.tsx` | Nouveau |
| Schémas | `src/features/bilan/previsionnel/schemas/hypotheses.ts` (Zod) | Nouveau |

**Décisions & vigilance :**
- **Base figée** : le prévisionnel s'appuie sur un snapshot validé (traçable) ; afficher clairement quelle base est utilisée.
- **Versionnement** : éditer des hypothèses crée/mets à jour une version identifiable (pour comparer les scénarios en FE-B12).

---

## Tasks / Subtasks

- [ ] Sélection base validée + garde (AC 1)
- [ ] `HypothesesForm` + schémas Zod (AC 2)
- [ ] `HypothesesSets` (CRUD + versionnement) (AC 3)
- [ ] i18n + tests (AC 4)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b11`, préfixés `FE-B11`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
