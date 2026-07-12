# Story FE-B03 : Mapping de colonnes assisté + profil d'import réutilisable

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 3 · **Sprint :** 5 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/balances/mapping`, `/bilan/import-profiles`) via gateway · **Backend d'appui :** STORY-053 (mapping colonnes + profil)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-004)
**Backend prêt :** S10
**Dépendances :** FE-B02 (import + aperçu)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b03`. Commits préfixés `FE-B03`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (association colonnes → champs + gestion des profils), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **comptable interne**,
je veux **associer manuellement les colonnes de mon fichier aux champs attendus et mémoriser cette association**,
afin de **réimporter mes balances sans reconfigurer le format à chaque fois**.

---

## Contexte

Quand l'entête du fichier ne correspond pas au format attendu (FR-004), l'utilisateur mappe **colonne source → champ cible** (compte, libellé, débit, crédit, solde). L'association est enregistrée comme **profil d'import** nommé et réutilisable pour l'org.

---

## Périmètre

**Inclus :**
- **Écran de mapping** : pour chaque champ cible, choisir la colonne source (depuis l'aperçu FE-B02) ; détection/suggestion si l'entête est reconnu.
- **Validation** : champs obligatoires mappés (compte + au moins un montant) avant import.
- **Profils d'import** : enregistrer un mapping nommé ; lister/sélectionner/supprimer ; application automatique d'un profil à un nouvel import.
- Ré-application après un import « format non reconnu » (renvoi depuis FE-B02).

**Hors périmètre :**
- Contrôle d'intégrité (FE-B04).
- Table de passage comptes→postes (FE-B06, sujet différent).

---

## Critères d'acceptation

- [ ] Mapping colonne→champ éditable (compte, libellé, débit, crédit, solde) à partir de l'aperçu.
- [ ] Validation : champs obligatoires mappés avant de lancer l'import ; messages clairs.
- [ ] Profil d'import : créer/nommer, lister, sélectionner, supprimer ; application auto à un nouvel import.
- [ ] Un import « format non reconnu » (FE-B02) bascule proprement vers le mapping.
- [ ] i18n FR ; tests : mapping, validation, CRUD profil, application auto.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query/mutations | `src/features/bilan/import/api/{mapping,profiles}.ts` + `hooks/*` | Nouveau |
| Écrans | `src/features/bilan/import/components/{ColumnMapper,ImportProfiles}.tsx` | Nouveau |

**Décisions & vigilance :**
- **Suggestion vs décision** : proposer un mapping si l'entête est reconnu, mais l'utilisateur valide (invariant « l'automatisation propose, l'humain valide »).
- **Profil = confort** : ne pas bloquer l'import si aucun profil ; le profil accélère les imports récurrents.

---

## Tasks / Subtasks

- [ ] `ColumnMapper` (mapping + suggestion + validation) (AC 1, 2)
- [ ] `ImportProfiles` (CRUD + application auto) (AC 3)
- [ ] Intégration bascule depuis FE-B02 (AC 4)
- [ ] i18n + tests (AC 5)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b03`, préfixés `FE-B03`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
