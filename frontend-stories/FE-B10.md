# Story FE-B10 : Cycle brouillon→validé + snapshot immuable/versions + piste d'audit

Status: ready-for-dev

**Epic :** FE-EPIC-005 — Bilan & Prévisionnel
**Points :** 5 · **Sprint :** 7 (programme) · **App :** `prospera-frontend-expert-comptable`
**API :** bilan-service (`/bilan/liasse/{id}/validate`, `/bilan/versions`, `/bilan/audit`) via gateway · **Backend d'appui :** STORY-064 (cycle brouillon→validé), STORY-065 (snapshot immuable), STORY-067 (piste d'audit)
**Réf. plan :** `docs/frontend-program-sprint-status.yaml` · PRD `docs/prd-bilan-service-2026-07-10.md` (FR-014/015/017)
**Backend prêt :** S13
**Dépendances :** FE-B09 (contrôles de cohérence), FE-B06 (comptes mappés)
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-b10`. Commits préfixés `FE-B10`.

---

## Convention Maquette (préalable UI)

- **Maquette validée AVANT implémentation** (action de validation + historique des versions + journal d'audit), conforme au Design System Prospera, publiée en Artifact.

---

## User Story

En tant que **responsable**,
je veux **valider et figer un exercice, avec un historique des versions et un journal d'audit**,
afin que **les états ne puissent plus être modifiés en douce et que chaque action soit traçable**.

---

## Contexte

Applique l'invariant d'immutabilité (l'automatisation propose, **l'humain valide**). Un jeu d'états est d'abord **BROUILLON** (recalculable) ; la **validation** est un acte humain explicite qui requiert que les contrôles bloquants (FE-B04 intégrité, FE-B06 mapping, FE-B07 actif=passif, FE-B09 cohérence) passent. La validation crée un **snapshot immuable** (append-only) ; toute correction rouvre un brouillon → **nouvelle version**, l'ancienne conservée. Le **journal d'audit** trace import/mapping/validation/export.

---

## Périmètre

**Inclus :**
- **Action de validation** : gate UI qui n'autorise la validation que si les contrôles bloquants (agrégés depuis FE-B09) passent ; sinon liste des blocages + orientation.
- **Confirmation explicite** (acte humain) → snapshot figé ; retour d'état (statut VALIDÉ, horodatage/validateur).
- **Historique des versions** : liste des snapshots validés d'un exercice ; consultation d'une version ; indication de la version « courante ».
- **Journal d'audit** : liste horodatée/attribuée des actions structurantes (append-only, lecture seule).
- **Ré-ouverture** pour correction → nouveau brouillon (nouvelle version à venir).

**Hors périmètre :**
- Génération des états (FE-B07-B09) ; export (FE-B14).
- Prévisionnel (FE-B11/B12).

---

## Critères d'acceptation

- [ ] Validation impossible tant que des contrôles bloquants échouent ; blocages listés + orientation.
- [ ] Validation = acte humain confirmé → snapshot figé ; statut VALIDÉ + horodatage/validateur affichés ; l'état validé n'est plus recalculable (lecture seule).
- [ ] Historique des versions consultable ; version courante identifiée ; ré-ouverture → nouveau brouillon.
- [ ] Journal d'audit affiché (append-only, lecture seule) : action, auteur, horodatage, cible.
- [ ] i18n FR ; tests : gate de validation (bloqué/ok), figement (lecture seule), versions, audit.

---

## Notes techniques

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Query/mutations | `src/features/bilan/validation/api/*` + `hooks/*` | Nouveau |
| Écrans | `src/features/bilan/validation/components/{ValidateAction,VersionsHistory,AuditLog}.tsx` | Nouveau |

**Décisions & vigilance :**
- **Immutabilité côté UI** : un état VALIDÉ est strictement en lecture seule (aucune action de recalcul/édition offerte) — l'invariant NFR-004 est backend, mais l'UI ne doit pas suggérer l'inverse.
- **Gate = agrégat FE-B09** : réutiliser le `CoherencePanel` comme source des blocages.
- **Ré-ouverture** : bien signaler qu'elle crée une **nouvelle version** (l'ancienne reste consultable).

---

## Tasks / Subtasks

- [ ] Gate de validation (contrôles bloquants) + action confirmée (AC 1, 2)
- [ ] Figement/lecture seule de l'état validé (AC 2)
- [ ] `VersionsHistory` + ré-ouverture (AC 3)
- [ ] `AuditLog` (AC 4)
- [ ] i18n + tests (AC 5)

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] Aucune action d'édition offerte sur un état validé (immutabilité respectée côté UI).
- [ ] `lint` / `typecheck` / `test` / `build` verts (local + CI).
- [ ] Statut mis à jour dans les trackers.
- [ ] Commits sur `fe-b10`, préfixés `FE-B10`.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
