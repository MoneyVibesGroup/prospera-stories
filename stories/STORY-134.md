# STORY-134 : `auth-service` — Renvoi d'invitation **admin plateforme** (`POST /admin/organizations/:orgId/users/:userId/resend-invitation` + `POST /admin/users/:userId/resend-invitation`)

**Epic :** EPIC-005 — Extraction `auth-service` (fournisseur d'identité / IdP) — *extension admin plateforme*
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Conception de l'API (Admin plateforme) · §MailModule / invitation
**Réf. code livré :** STORY-008 (`InvitationService`, `POST /users/:id/resend-invitation` **tenant**, template `invitation.hbs`, job `SEND_INVITATION_EMAIL`) · STORY-027 (`AdminOrganizationsController`, `[PLATFORM_ADMIN]`, inter-org) · STORY-104 (`POST /admin/users` invitation membre plateforme org-less, `platformRole`) · STORY-106 (RBAC `perms[]`)
**Consommateur frontend :** admin-panel **AP-02** (fiche org → membres `INVITED`) et **AP-08** (membres plateforme)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** Unassigned
**Créée le :** 2026-07-24
**Sprint :** à planifier
**Service :** `auth-service` (:3001) — l'IdP, seule source de vérité de l'identité

> **Comble un manque identifié à la revue AP-02.** La console admin veut **renvoyer une invitation** à un membre resté `INVITED` (lien expiré/non reçu), mais **aucun endpoint admin** ne le permet : STORY-008 n'expose la ré-invitation que pour un `TENANT_ADMIN` **dans son propre tenant** (`POST /users/:id/resend-invitation`), et STORY-104 ne fait que **créer** l'invitation d'un membre plateforme. Cette story ajoute les endpoints **`PLATFORM_ADMIN`, inter-org**, en **réutilisant** `InvitationService` (aucune nouvelle mécanique de token/mail).

---

## User Story

En tant qu'**opérateur de la plateforme** (`PLATFORM_ADMIN`),
je veux **renvoyer l'invitation** à un utilisateur resté `INVITED` (membre d'une organisation **ou** membre plateforme),
afin de **débloquer un onboarding** (lien expiré, e-mail perdu) sans devoir supprimer/recréer le compte ni passer par le `TENANT_ADMIN`.

---

## Description

### Contexte

- STORY-008 a livré `InvitationService.resendInvitation(...)` + `POST /api/v1/users/:id/resend-invitation`, mais **gardé `@Roles(TENANT_ADMIN)`** et **scopé au tenant de l'inviteur** (un `:id` d'un autre tenant → 404). Inutilisable depuis la console (persona `PLATFORM_ADMIN`, org-less).
- STORY-104 a livré `POST /admin/users` (création d'un membre plateforme `INVITED`, `platformRole`, org-less) mais **pas** de renvoi ; sa section « Non-buts » notait que la gestion post-création serait ouverte « si le besoin se présente » — **il se présente** (AP-08).
- La ré-invitation ne **crée pas d'état métier nouveau** : elle **ré-émet** un token à usage unique (72 h) et **ré-enfile** l'e-mail. Elle n'émet donc **aucun** événement `identity.*` (aucun changement d'état absolu observable par les consommateurs).

### Périmètre

**Inclus :**

- **`POST /api/v1/admin/organizations/:orgId/users/:userId/resend-invitation`** (`[PLATFORM_ADMIN]`, **inter-org**) : pour un `userId` **`INVITED`** membre de `:orgId`, ré-émet le token (72 h) + ré-enfile `SEND_INVITATION_EMAIL`. **204 No Content**. Réutilise `InvitationService.resendInvitation`.
- **`POST /api/v1/admin/users/:userId/resend-invitation`** (`[PLATFORM_ADMIN]`, **org-less**) : idem pour un **membre plateforme** `INVITED` (`platformRole`, sans membership), pendant admin de `POST /admin/users` (STORY-104).
- **Garde d'autorisation** : réservé au `PLATFORM_ADMIN` (permission `user:invite` si STORY-106 livrée, sinon rôle). Aucune restriction de tenant (la console est inter-org).
- **Idempotence & bornes** : chaque appel **remplace** le token précédent (l'ancien lien devient invalide). **Rate-limit** par cible : max **3 renvois / heure / userId** (compteur Redis `admin-resend:{userId}`, aligné sur le patron `resend:{userId}` de STORY-006) → au-delà **429**.

**Hors périmètre :**

- Création d'invitation (déjà STORY-008 / STORY-104).
- Renvoi **en lot** (→ STORY-135, réutilise ces endpoints unitaires).
- Suppression/désactivation d'un membre (non demandé).

### Contrat d'API

| Méthode & route | Auth | Corps | Succès | Erreurs |
|---|---|---|---|---|
| `POST /admin/organizations/:orgId/users/:userId/resend-invitation` | `[PLATFORM_ADMIN]` | — | **204** | 401 (anon) · 403 (non-admin) · 404 (org/user inconnu **ou** user hors de `:orgId`) · **409** (user non `INVITED`, ex. déjà `ACTIVE`) · **429** (>3/h) |
| `POST /admin/users/:userId/resend-invitation` | `[PLATFORM_ADMIN]` | — | **204** | 401 · 403 · 404 (user inconnu **ou** non membre plateforme) · **409** (non `INVITED`) · **429** |

Réponses d'erreur : enveloppe NestJS standard `{ statusCode, error, message }`, messages **génériques** (anti-énumération, cohérent STORY-008).

---

## Acceptance Criteria

- [ ] **AC-1 — Renvoi org (inter-org).** `PLATFORM_ADMIN` → `POST /admin/organizations/:orgId/users/:userId/resend-invitation` pour un `INVITED` de n'importe quelle org : **204**, nouveau token émis (l'ancien lien → **400** à l'acceptation), job `SEND_INVITATION_EMAIL` enfilé (**e-mail présent dans Mailhog**).
- [ ] **AC-2 — Renvoi membre plateforme.** `POST /admin/users/:userId/resend-invitation` pour un membre plateforme `INVITED` (STORY-104) : **204**, mêmes garanties.
- [ ] **AC-3 — États refusés.** User **`ACTIVE`** → **409** ; user/org **inconnu** ou user **hors** de `:orgId` → **404** (générique).
- [ ] **AC-4 — RBAC.** `TENANT_ADMIN`/`TENANT_USER` → **403** ; anonyme → **401**. (Si STORY-106 livrée : gate sur `user:invite`.)
- [ ] **AC-5 — Rate-limit.** 4ᵉ renvoi en < 1 h pour un même `userId` → **429** (compteur Redis, TTL 3600 s).
- [ ] **AC-6 — Pas d'événement.** Aucun `identity.*` produit (la ré-invitation ne change pas l'état absolu) — vérifié : `outbox_events` inchangé.
- [ ] **AC-7 — Réutilisation.** Aucune duplication de la logique token/mail : les endpoints délèguent à `InvitationService.resendInvitation` (STORY-008).

---

## Definition of Done

- [ ] Lint 0 · `nest build` OK · couverture ≥ seuils du service · unit (garde RBAC, 204, 409, 404, 429, idempotence token) + e2e docker (**Mailhog**) verts.
- [ ] AC-1 → AC-7 validés ; non-régression sur `POST /users/:id/resend-invitation` (tenant, STORY-008).
- [ ] `/code-review` + PR `MNV-134` → `dev`.

---

## Dépendances

- **Requiert :** STORY-008 (InvitationService), STORY-027 (contrôleur admin orgs), STORY-104 (membres plateforme). RBAC fin optionnel via STORY-106.
- **Débloque :** AP-02 (action « Renvoyer l'invitation » sur la fiche org), AP-08 (membres plateforme), et **STORY-135** (variante batch).

---

**Story créée avec la méthode BMAD — extension EPIC-005 (manque relevé à la revue frontend AP-02).**
