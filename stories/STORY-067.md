# STORY-067 : Piste d'audit (import, mapping, validation, ré-ouverture, export ; append-only) — FR-017

**Epic :** EPIC-012 — Validation, clôture & immutabilité — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-017 (journal horodaté + attribué des actions structurantes ; append-only) ; **NFR-004** (traçabilité, journal non modifiable)
**Réf. code livré :** **STORY-064** (jeu : creer/recalculer/valider) · **STORY-065** (rouvrir) · **STORY-066** (exercice : creer/clore/rouvrir) · **STORY-065** (patron collection append-only + repository sans mutation)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + auto-revue + intégrée dans `dev` le 2026-07-21 — PR #23 bilan-service, MNV-067 « Rebase and merge », HEAD `11fec11`, branche supprimée)
**Assigné à :** vivian
**Créée :** 2026-07-21
**Sprint :** 14

---

## User Story

**En tant que** cabinet comptable (et auditeur),
**je veux** un **journal horodaté et attribué** des actions structurantes (création/recalcul/validation/ré-ouverture d'un jeu, création/clôture/ré-ouverture d'un exercice), **non modifiable** (append-only),
**afin que** chaque acte engageant sur ma comptabilité soit **traçable** (qui, quoi, quand, sur quelle cible) — invariant de traçabilité NFR-004.

---

## Description

### Contexte & cadrage

Le cycle de validation (064/065) et les exercices (066) sont livrés. STORY-067 ajoute la **piste d'audit** : chaque action structurante **journalise** un événement `AuditEvent` (append-only) — `userId`, `orgId`, `type`, `cible`, horodatage — consultable en lecture seule.

### Ce que 067 livre

1. **`AuditEvent`** (collection **append-only** `audit_events`, tenant-scoped) : `userId`, `type` (`JEU_CREE` | `JEU_RECALCULE` | `JEU_VALIDE` | `JEU_ROUVERT` | `EXERCICE_CREE` | `EXERCICE_CLOS` | `EXERCICE_ROUVERT`), `cible` (`{ collection, id, libelle? }`), `createdAt` (horodatage). Repository **append-only** (aucune mutation).
2. **`AuditService.journaliser`** — **sûr** (n'échoue jamais : journalise l'erreur sans la propager, un échec d'audit ne casse pas l'action métier). Appelé **au niveau contrôleur** (qui détient l'utilisateur + le résultat), après le succès de l'action.
3. **Hooks** dans `JeuEtatsController` (creer/recalculer/valider/rouvrir) et `ExerciceController` (creer/clore/rouvrir).
4. **Consultation** : `GET /bilan/audit` (journal de l'org, plus récent d'abord ; filtre `type` optionnel), **lecture seule** (aucun endpoint de mutation).

### Frontières nettes

- **Import balance / export PDF-Excel** : hooks documentés (les actions n'existent pas encore — interop aval / EPIC-014) ; le type d'événement leur est réservé.
- **Mapping (surcharges 058)** : hook documenté (audit des `MAPPING_VALIDE`) — 067 cadre le socle sur jeu+exercice ; l'extension mapping est triviale (même `journaliser`).

---

## Scope

**Dans le périmètre :**
- `AuditEvent` schema (append-only `audit_events`) + `AuditType` enum + `AuditRepository` (journaliser + lectures, **aucune** mutation) + `AuditService` (journaliser **sûr** + lister).
- Hooks contrôleur : jeu (creer/recalculer/valider/rouvrir) + exercice (creer/clore/rouvrir).
- `AuditController` `GET /bilan/audit` (lecture seule, gate + tenant-scoped).
- Tests unit + e2e + **vérif docker réelle** (chaque action → 1 événement horodaté+attribué ; journal append-only ; isolation).

**Hors périmètre :** import/export (hooks), audit mapping (hook), pagination avancée, purge/rétention.

---

## Critères d'acceptation

- [ ] Chaque action structurante (jeu creer/recalculer/valider/rouvrir ; exercice creer/clore/rouvrir) **journalise** un `AuditEvent` avec `userId`, `tenantId`, `type`, `cible`, horodatage.
- [ ] Le journal est **append-only** (aucune mutation/suppression exposée).
- [ ] Un **échec d'audit** ne casse **jamais** l'action métier (journalisé, non propagé).
- [ ] `GET /bilan/audit` restitue le journal de l'org (plus récent d'abord ; filtre `type`), **lecture seule**.
- [ ] **Isolation** : journal d'une autre org invisible ; gate `@RequiresBilanAccess` (403) ; sans jeton (401).

---

## Notes techniques

- **Nouveau dossier** `src/modules/bilan/audit/` : `audit.enums.ts`, `audit-event.schema.ts`, `audit.repository.ts`, `audit.service.ts`, `audit.controller.ts`, `dto/audit-response.dto.ts`.
- **Audit au niveau contrôleur** (détient `user` + résultat) → aucune modification des signatures des services 064/065/066. `AuditService.journaliser(orgId, userId, type, cible)` : `try/catch` interne, `logger.warn` sur échec, **ne throw jamais**.
- **Append-only** : `AuditRepository` n'expose ni `updateOne` ni `deleteOne`. Écriture mono-document (pas de transaction).
- Anti-énumération : le journal est intrinsèquement scoping (aucune lecture d'un id précis inter-org).

---

## Dépendances

**Prérequis :** STORY-064/065/066 (actions à auditer) ✅ · patron append-only (065) ✅.
**Débloque :** hooks import (interop balance) + export (EPIC-014).

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ 65/90/90/90 · unit + e2e · non-régression 064/065/066.
- [ ] **Vérif docker réelle** (actions → événements d'audit horodatés/attribués en base ; append-only ; isolation) consignée dans *Progress Tracking*.
- [ ] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [ ] Flux git : `MNV-067` sur `dev` + docs sur `main`, PR « Rebase and merge ».

---

## Story Points Breakdown

- `AuditEvent` + repo append-only + service sûr : 1,5 pt · hooks contrôleur + endpoint lecture : 1 pt · tests + docker : 0,5 pt · **Total : 3 pts**.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (Scrum Master).
- 2026-07-21 : Développée (Developer) — piste d'audit append-only + hooks + endpoint lecture. Intégrée dans `dev` (PR #23, MNV-067, rebase-merge, HEAD `11fec11`).

**Réalisé :**
- **`AuditEvent`** (collection append-only `audit_events`, tenant-scoped) : `userId`, `type` (`AuditType`), `cible` (`{collection,id,libelle}`), `createdAt`. Index `(tenantId, createdAt:-1)`.
- **`AuditRepository`** : `create` (tenantId forcé) + `lister` — **aucune** mutation exposée.
- **`AuditService.journaliser` SÛR** : `try/catch` interne + `logger.warn`, **ne throw jamais** (un échec d'audit ne casse pas l'action métier) ; `lister`.
- **Hooks contrôleur** : `JeuEtatsController` (creer→`JEU_CREE`, recalculer→`JEU_RECALCULE`, valider→`JEU_VALIDE`, rouvrir→`JEU_ROUVERT`) + `ExerciceController` (creer→`EXERCICE_CREE`, clore→`EXERCICE_CLOS`, rouvrir→`EXERCICE_ROUVERT`). Signatures des services 064/065/066 **inchangées**.
- **`AuditController`** `GET /bilan/audit` (filtre `type`), lecture seule. `import`/`export` = types réservés (hooks).

**Qualité (DoD) :** lint 0 · build OK · **438 unit + 95 e2e** verts · `audit` **100/100/100/100**, global 98.4/92.4/98.8/98.3 · non-régression 064/065/066 + dry-run 059→063.

**Vérification docker réelle :** bilan-service redémarré, org `6a5ec161…`, JWT RS256 réel.
- **7 actions structurantes → 7 événements** en base `audit_events` (dans l'ordre : `EXERCICE_CREE`, `JEU_CREE`, `JEU_RECALCULE`, `JEU_VALIDE`, `JEU_ROUVERT`, `EXERCICE_CLOS`, `EXERCICE_ROUVERT`), chacun avec `userId` + `type` + `cible` (collection/libellé) + horodatage.
- **`GET /bilan/audit`** : journal restitué **plus récent d'abord** ; chaque événement porte **qui/quoi/cible/quand**.
- **Filtre** `?type=JEU_VALIDE` → 1 événement, tous `JEU_VALIDE`.
- **Isolation** : événement inséré pour une **autre org** → **invisible** (7 visibles, pas 8).
- **Append-only** : aucun endpoint de mutation (`DELETE`/`PUT /bilan/audit` → **404**).

**Actual Effort :** ~3 pts (conforme).
