# Story FE-B02 : Import de balance Excel/CSV (upload, détection format, aperçu)

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 5 · **Sprint :** 5 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/balances`) via gateway · **Backend d'appui :** STORY-050 (import balance)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-001)
**Backend prêt :** S10
**Dépendances :** FE-B00 (shell), FE-B01 (exercice courant)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b02`. Commits préfixés `FE-B02`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (import : dropzone, aperçu tabulaire, confirmation), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **comptable interne**,
je veux **téléverser ma balance (Excel/CSV) et en voir un aperçu avant de confirmer**,
afin de **partir de données fiables rattachées au bon exercice**.

---

## Contexte

Porte d'entrée du module (FR-001). L'utilisateur téléverse un `.xlsx`/`.csv` (compte, libellé, débit/crédit et/ou solde). Le backend détecte le format, renvoie un **aperçu** des N premières lignes, et stocke la balance keyée `orgId` + `exerciceId`. La validation fine du format/type reste serveur (magic-bytes) ; le client fait un pré-contrôle (taille/extension) et pilote l'UX d'upload.

---

## Périmètre

**Inclus :**
- **Dropzone** (clic + glisser-déposer) `.xlsx`/`.csv` ; pré-contrôle client (taille, extension) non autoritatif.
- **Upload** avec progression (multipart) rattaché à l'**exercice courant** (FE-B01).
- **Aperçu** des N premières lignes renvoyées par le backend (tableau) avant **confirmation**.
- **Confirmation** → la balance est enregistrée (retour d'état) ; gestion des erreurs (format non reconnu → renvoi vers le mapping FE-B03).

**Hors périmètre :**
- Contrôle d'intégrité/équilibre (FE-B04).
- Mapping de colonnes assisté (FE-B03).
- Comparatif N-1 (FE-B05).

---

## Critères d'acceptation

- [ ] Dropzone `.xlsx`/`.csv` (clic + drag&drop) + pré-contrôle client (taille/extension) avec message si non conforme.
- [ ] Upload multipart avec progression, rattaché à l'exercice courant ; erreurs backend affichées.
- [ ] **Aperçu** des N premières lignes (tableau) avant confirmation.
- [ ] Confirmation → balance stockée (retour d'état) ; format non reconnu → orientation vers le mapping (FE-B03).
- [ ] i18n FR ; tests : pré-contrôle, upload (mock progression), aperçu, confirmation, erreur format.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Upload | `src/features/bilan/import/api/upload-balance.ts` (XHR progression) | Nouveau |
| Écrans | `src/features/bilan/import/components/{BalanceDropzone,BalancePreview}.tsx` | Nouveau |
| Validation | `src/features/bilan/import/lib/file-validation.ts` | Nouveau (réutilise patron FE-009) |

**Décisions & vigilance :**
- **Progression d'upload** : utiliser `XMLHttpRequest` (`upload.onprogress`) comme en FE-009 (fetch ne gère pas la progression d'upload).
- **Aperçu piloté backend** : ne pas parser le fichier côté client (le backend détecte format/encodage) ; se contenter d'afficher l'aperçu renvoyé.
- **Rattachement exercice** : refuser l'import si aucun exercice courant sélectionné (FE-B01).

---

## Tasks / Subtasks

- [ ] Dropzone + pré-contrôle client (AC 1)
- [ ] Upload multipart + progression + rattachement exercice (AC 2)
- [ ] Aperçu tabulaire + confirmation (AC 3, 4)
- [ ] Orientation « format non reconnu » → FE-B03 (AC 4)
- [ ] i18n + tests (AC 5)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b02`, préfixés `FE-B02`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
