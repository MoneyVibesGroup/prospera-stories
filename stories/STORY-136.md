# STORY-136 : `kyc-service` — Action **groupée** « ouvrir la revue KYC » (batch mise en revue) avec **succès partiel (HTTP 207)**

**Epic :** EPIC-015 — `kyc-service` (revue humaine du dossier KYC) — *extension admin plateforme*
**Réf. architecture :** `architecture-kyc-service` §Revue humaine (`GET /admin/kyc/:orgId`, transitions de statut) · §Producteur `kyc.status.changed` (outbox)
**Réf. code livré :** STORY-013 (revue humaine `approve`/`reject`) · STORY-021 (producteur `kyc.status.changed` + outbox) · STORY-040 (bascule `UNDER_REVIEW`, hook `onDocumentSubmitted`) · STORY-045 (`GET /admin/kyc/:orgId` enrichi OCR) · **STORY-135** (convention de succès partiel **207** — à réutiliser à l'identique)
**Consommateur frontend :** admin-panel **AP-03** (file KYC → sélection multiple → « Ouvrir la revue »)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** Unassigned
**Créée le :** 2026-07-24
**Sprint :** à planifier
**Service :** `kyc-service` (:3002, base `kyc_service`)

> **Comble un manque identifié à la revue AP-02/AP-03.** La console veut **mettre en revue plusieurs dossiers KYC sélectionnés** en une action, mais côté `kyc-service` les transitions sont **unitaires** (STORY-013) et la bascule `UNDER_REVIEW` n'est déclenchée qu'**automatiquement** par le dépôt de pièces (STORY-040) — **aucun endpoint admin de mise en revue explicite, encore moins en lot**. Cette story ajoute l'endpoint batch en **réutilisant la convention 207 figée par STORY-135**.

---

## User Story

En tant qu'**opérateur de la plateforme** (`PLATFORM_ADMIN` / rôle KYC délégué),
je veux **ouvrir la revue KYC de plusieurs organisations sélectionnées** en un seul geste,
afin de **prendre en charge une file** de dossiers éligibles sans ouvrir chaque dossier un par un, avec un **rapport clair** de ce qui a basculé et de ce qui a été ignoré.

---

## Description

### Contexte

- La revue humaine existe **unitaire** : `approve`/`reject` (STORY-013), dossier consulté via `GET /admin/kyc/:orgId` (STORY-045).
- La transition **vers `UNDER_REVIEW`** n'est aujourd'hui que le **produit d'un hook** (`onDocumentSubmitted`, STORY-040) quand les pièces requises sont `SUBMITTED` — **pas** une action admin explicite.
- Le besoin console (AP-03) : sélectionner N dossiers **éligibles** et les **mettre en revue** (assignation/prise en charge) en lot, avec le **même contrat de succès partiel** que les actions groupées orgs (STORY-135) pour une UX cohérente.

### Réutilisation de la convention 207 (STORY-135)

Même enveloppe **exacte** que STORY-135 : entrée `{ "ids": string[] }` (2..100, dédup), traitement **par élément dans sa propre transaction**, réponse **HTTP 207** `{ summary:{requested,succeeded,failed}, results:[{ id, status: ok|skipped|error, reason? }] }`. Codes `reason` stables propres au domaine : `NOT_FOUND`, `NOT_ELIGIBLE` (dossier incomplet / pièces manquantes), `ALREADY_UNDER_REVIEW`, `TERMINAL_STATE` (déjà `APPROVED`/`REJECTED`), `FORBIDDEN_TARGET`.

### Périmètre

**Inclus :**

- **`POST /api/v1/admin/kyc/batch/open-review`** (`[PLATFORM_ADMIN]` / `kyc:review`) : pour chaque `orgId` de `ids`, si le dossier est **éligible** (`PENDING`/`PENDING_DOCUMENTS` avec pièces requises présentes, règle **identique** au hook STORY-040), transition **→ `UNDER_REVIEW`** dans sa transaction, **émet `kyc.status.changed`** (outbox, clé `orgId`, at-least-once). Sinon `skipped` avec le `reason` adéquat.
- **Rapport 207** par élément (jamais de bascule silencieuse ni d'échec masqué).
- **Idempotence** : dossier déjà `UNDER_REVIEW` → `skipped/ALREADY_UNDER_REVIEW` (pas de doublon d'événement) ; dossier `APPROVED`/`REJECTED` → `skipped/TERMINAL_STATE`.
- **Bornes** : `ids` 2..100 → sinon **400**.

**Hors périmètre :**

- `approve`/`reject` en lot (décision humaine par dossier — **reste unitaire**, STORY-013 ; volontairement non batché).
- Assignation à un reviewer nommé (file d'attribution) — hors v1.
- Toute logique frontend (AP-03).

### Contrat d'API

| Méthode & route | Auth | Corps | Succès | Erreurs |
|---|---|---|---|---|
| `POST /admin/kyc/batch/open-review` | `[PLATFORM_ADMIN]` / `kyc:review` | `{ "ids": string[] }` (2..100) | **207** (rapport par élément) | 400 (bornes/corps) · 401 · 403 (aucun droit) |

---

## Acceptance Criteria

- [ ] **AC-1 — Succès partiel.** `ids` = [dossier éligible, dossier déjà `UNDER_REVIEW`, dossier `APPROVED`, orgId inconnu] → **207** ; `results` = `[ok, skipped/ALREADY_UNDER_REVIEW, skipped/TERMINAL_STATE, error/NOT_FOUND]` ; `summary.succeeded=1`.
- [ ] **AC-2 — Éligibilité = règle STORY-040.** Un dossier aux pièces requises **incomplètes** → `skipped/NOT_ELIGIBLE`, **aucune** transition, **aucun** événement.
- [ ] **AC-3 — Événement par bascule.** Chaque transition **effective** vers `UNDER_REVIEW` (statut `ok`) émet **un** `kyc.status.changed` (outbox, `orgId`) ; `skipped`/`error` n'en émettent aucun.
- [ ] **AC-4 — Isolation transactionnelle.** L'échec d'un élément n'annule pas les bascules réussies.
- [ ] **AC-5 — Bornes & RBAC.** `ids` hors 2..100 → **400** ; non-habilité KYC → **403 global** ; cible interdite → `error/FORBIDDEN_TARGET`.
- [ ] **AC-6 — Contrat identique STORY-135.** Forme de l'enveloppe `summary`/`results` **strictement alignée** (une même lib front peut consommer les deux).

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils du service (**65/90/90/90**) · unit (succès partiel, éligibilité = hook STORY-040, idempotence, émission par élément, isolation tx) + e2e docker (batch mixte → 207 + `outbox_events` correct) verts.
- [ ] AC-1 → AC-6 validés ; non-régression sur `approve`/`reject` (STORY-013) et le hook `onDocumentSubmitted` (STORY-040).
- [ ] `/code-review` + PR `MNV-136` → `dev`.

---

## Dépendances

- **Requiert :** STORY-013 (revue), STORY-021/040 (transitions + producteur), STORY-045 (dossier admin). **Réutilise la convention 207 de STORY-135** (à livrer/figer avant ou en parallèle).
- **Débloque :** AP-03 (action groupée « Ouvrir la revue » dans la file KYC).

---

**Story créée avec la méthode BMAD — extension EPIC-015 (manque relevé à la revue frontend AP-02/AP-03).**
