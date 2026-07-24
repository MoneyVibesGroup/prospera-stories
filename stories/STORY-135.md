# STORY-135 : `auth-service` — Actions **groupées** sur organisations (batch **suspend** + batch **resend-invitation**) avec **sémantique de succès partiel (HTTP 207)**

**Epic :** EPIC-005 — Extraction `auth-service` (fournisseur d'identité / IdP) — *extension admin plateforme*
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Conception de l'API (Admin plateforme) · `architecture-prospera-ecosystem-2026-07-04.md` (patron outbox, cohérence éventuelle, at-least-once)
**Réf. code livré :** STORY-027 (`POST /admin/organizations/:id/suspend`, `suspendAndEmit`, `identity.org.updated`, outbox) · STORY-134 (`resend-invitation` unitaire admin)
**Consommateur frontend :** admin-panel **AP-02** (sélection multi-lignes → « Actions groupées »)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** Unassigned
**Créée le :** 2026-07-24
**Sprint :** à planifier
**Service :** `auth-service` (:3001)

> **Comble un manque identifié à la revue AP-02.** La console veut appliquer une action à **plusieurs organisations sélectionnées** (suspendre en lot, renvoyer les invitations en lot), mais **il n'existe que des variantes unitaires** (STORY-027 suspend une org, STORY-134 renvoie une invitation). Cette story ajoute les **endpoints batch** et **fige la convention de succès partiel (207)** réutilisée par les autres services (cf. STORY-136 pour la revue KYC).

---

## User Story

En tant qu'**opérateur de la plateforme** (`PLATFORM_ADMIN`),
je veux **appliquer une action à un ensemble d'organisations sélectionnées** (suspendre, renvoyer l'invitation) en **un seul appel**,
afin de **traiter un volume** sans répéter le geste, tout en **sachant précisément ce qui a réussi et ce qui a échoué** (jamais de « tout ou rien » silencieux).

---

## Description

### Contexte

Les mutations admin existantes sont **strictement unitaires** :
- `POST /admin/organizations/:id/suspend` (STORY-027) — une org, émet `identity.org.updated`.
- `POST /admin/organizations/:orgId/users/:userId/resend-invitation` (STORY-134) — un user.

Un batch naïf (« si une échoue, tout échoue » ou « on ignore les échecs ») est **inacceptable** pour une console de gouvernance : l'opérateur doit voir **par élément** le résultat. On adopte donc une **sémantique de succès partiel** normalisée.

### Convention **succès partiel** (figée ici, réutilisable — STORY-136)

- **Entrée** : `{ "ids": string[] }` (2..100 identifiants, dédupliqués ; hors bornes → **400**).
- **Traitement** : chaque élément est traité **indépendamment**, dans sa **propre transaction** (une org suspendue **émet son** `identity.org.updated` ; un échec sur une autre n'annule rien). Ordre non garanti ; idempotent par élément.
- **Réponse** : **HTTP 207 Multi-Status** avec un **rapport par élément** (jamais de rejet silencieux) :
  ```json
  {
    "summary": { "requested": 5, "succeeded": 3, "failed": 2 },
    "results": [
      { "id": "ORG-10041", "status": "ok" },
      { "id": "ORG-10057", "status": "skipped", "reason": "ALREADY_SUSPENDED" },
      { "id": "ORG-99999", "status": "error", "reason": "NOT_FOUND" }
    ]
  }
  ```
  `status ∈ {ok, skipped, error}`. `reason` est un **code stable** (ex. `NOT_FOUND`, `ALREADY_SUSPENDED`, `NOT_INVITED`, `RATE_LIMITED`, `FORBIDDEN_TARGET`). **207 même si tout réussit ou tout échoue** (le corps porte le détail) — le front lit `summary`/`results`, jamais le seul code HTTP.

### Périmètre

**Inclus :**

- **`POST /api/v1/admin/organizations/batch/suspend`** (`[PLATFORM_ADMIN]`) : suspend chaque org de `ids` (réutilise `suspendAndEmit`, STORY-027). `skipped` si déjà `SUSPENDED` ; `error/NOT_FOUND` si inconnue. Chaque suspension **effective** émet **son** `identity.org.updated` (outbox, at-least-once).
- **`POST /api/v1/admin/organizations/batch/resend-invitation`** (`[PLATFORM_ADMIN]`) : pour chaque `userId` fourni (variante : `{ items: [{ orgId, userId }] }`), ré-émet l'invitation (réutilise STORY-134). `skipped/NOT_INVITED` si déjà `ACTIVE` ; `error/RATE_LIMITED` si la borne 3/h/userId est atteinte.
- **Garde d'autorisation** : `[PLATFORM_ADMIN]` (permissions `org:suspend` / `user:invite` si STORY-106 livrée). Une cible interdite → `error/FORBIDDEN_TARGET` **dans le rapport** (pas un 403 global, sauf si l'appelant n'a **aucun** droit → 403 global).
- **Bornes** : `ids` **2..100** ; au-delà → **400** (pas de pagination de batch en v1).

**Hors périmètre :**

- Action groupée **« ouvrir la revue KYC »** → **STORY-136** (kyc-service), qui **réutilise cette convention 207**.
- Annulation/rollback global (chaque élément est indépendant — c'est le principe).
- Traitement asynchrone/job (v1 synchrone borné à 100).

---

## Acceptance Criteria

- [ ] **AC-1 — Batch suspend, succès partiel.** `ids` = [org active, org déjà suspendue, org inconnue] → **207** ; `results` = `[ok, skipped/ALREADY_SUSPENDED, error/NOT_FOUND]` ; `summary.succeeded=1`.
- [ ] **AC-2 — Événements par élément.** Chaque suspension **effective** (statut `ok`) produit **un** `identity.org.updated` dans l'outbox (clé `orgId`) ; les `skipped`/`error` n'en produisent **aucun**.
- [ ] **AC-3 — Batch resend, succès partiel.** Mélange `INVITED` / `ACTIVE` / rate-limité → **207** avec `ok` / `skipped(NOT_INVITED)` / `error(RATE_LIMITED)` respectifs.
- [ ] **AC-4 — Isolation transactionnelle.** Une erreur sur un élément **n'annule pas** les éléments réussis (vérifié : l'org valide reste `SUSPENDED` malgré l'échec d'une autre).
- [ ] **AC-5 — Bornes & validation.** `ids` vide / 1 seul / > 100 / doublons → **400** (ou dédup + 207 selon règle documentée) ; corps mal formé → **400**.
- [ ] **AC-6 — RBAC.** Non-`PLATFORM_ADMIN` → **403 global** ; cible individuellement interdite → `error/FORBIDDEN_TARGET` dans le rapport.
- [ ] **AC-7 — Convention réutilisable.** Le type d'enveloppe (`summary`+`results`, codes `reason`) est **exporté/documenté** pour réemploi par STORY-136.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils · unit (succès partiel, isolation tx, bornes, RBAC, émission par élément) + e2e docker (batch mixte → 207 + outbox correct) verts.
- [ ] AC-1 → AC-7 validés ; non-régression sur les endpoints unitaires (STORY-027/123).
- [ ] `/code-review` + PR `MNV-135` → `dev`.

---

## Dépendances

- **Requiert :** STORY-027 (`suspendAndEmit`), STORY-134 (resend unitaire). RBAC fin optionnel via STORY-106.
- **Débloque :** AP-02 (barre « Actions groupées »). **Modèle** de la convention 207 pour **STORY-136** (kyc-service).

---

**Story créée avec la méthode BMAD — extension EPIC-005 (manque relevé à la revue frontend AP-02).**
