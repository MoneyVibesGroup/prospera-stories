# Story FE-INT-1 : Brancher la gestion des utilisateurs sur auth-service (contrat réel)

Status: review  <!-- 2026-07-19 : livrée en dev continu avec FE-INT-2 sur `fe-int-1-2` → PR #9 fe-int-1-2→dev (rebasée sur dev) ; gates verts -->


**Epic :** FE-EPIC-002 — Intégration backend (retrofit de FE-008)
**Points :** 2 · **Sprint :** Integration Gate (avant Sprint 3) · **App :** `prospera-frontend-expert-comptable`
**API :** **auth-service (:3001)** `GET/POST /api/users`, `PATCH/DELETE /api/users/:id`
**Backend d'appui :** STORY-026 (users/rôles IdP), STORY-075 (stack dev)
**Réf. plan :** retrofit de **FE-008** · audit d'intégration 2026-07-12
**Dépendances :** FE-INT-0 (client multi-base + types générés)

---

## Convention Git

- ⚡ **DÉROGATION (décision user 2026-07-19)** : FE-INT-1 est développée **en continu avec FE-INT-2** sur **une seule branche `fe-int-1-2`** et **une seule PR → `dev`** (au lieu d'une branche par story). Branche depuis `dev` + rebase avant de coder.
- Commits préfixés par story : `FE-INT-1 …` pour la partie Users, `FE-INT-2 …` pour la partie KYC, afin de garder la traçabilité par story dans une PR partagée.
- Les critères d'acceptation des deux stories restent **distincts** et doivent être verts **séparément** avant merge.

---

## User Story

En tant que **super-admin de cabinet**,
je veux **gérer les membres de mon organisation contre le vrai IdP**,
afin que **la liste, l'invitation, le changement de rôle et la suspension reflètent l'état réel des comptes (fin du miroir).**

---

## Contexte

FE-008 a supposé `GET /auth/users` → `{ items, total, page, pageSize }`. Le contrat **réel** d'auth-service (autorité identité, org-scopée) est :
- `GET /api/users?page=&limit=&status=` → `PaginatedUsersDto { items: UserResponseDto[], total, page, **limit** }` (⚠️ `limit`, pas `pageSize`).
- `POST /api/users` (invitation), `PATCH /api/users/:id` (rôle / statut), `DELETE /api/users/:id` (soft-delete), `POST /api/users/:id/resend-invitation`.
- **Rappel cutover** : EC ne sert plus `/users` (→ 404) ; l'autorité est **exclusivement** auth-service.

---

## Périmètre

**Inclus :**
- Aligner `src/features/users/api/*` sur le contrat réel : préfixe logique `/auth` → auth-service ; **`pageSize` → `limit`** (query + type `UsersPage`) ; remplacer les types feature-local par les types **générés** (FE-INT-0).
- Vérifier le mapping des champs `UserResponseDto` (`id, email, firstName, lastName, status, role, lastLoginAt`) avec l'UI existante (`UsersTable`, badges, `user-display`).
- Confirmer les codes d'erreur réels (401/refresh, 403 RBAC, 409 garde dernier admin) et l'invalidation TanStack (`usersKeys.all`).

**Hors périmètre :**
- Nouvelle UI (la table/dialogues de FE-008 restent) ; seuls les contrats/branchements changent.

---

## Critères d'acceptation

1. La liste pagine via `page`+`limit` et lit `{items,total,page,limit}` du vrai auth-service ; le tableau et la pagination fonctionnent contre le stack STORY-075.
2. Invitation / changement de rôle / suspension / soft-delete opèrent réellement (201/200) et rafraîchissent la liste ; garde dernier admin → 409 géré.
3. Types issus d'`api.d.ts` généré (plus de type `UsersPage` écrit à la main divergent).
4. 401 → refresh silencieux puis retry ; 403 → message RBAC. Tests verts.

---

## Integration Gate

Contrat supposé `GET /auth/users {pageSize}` **confronté et corrigé** en `GET /api/users {limit}`. Zéro mock résiduel : la feature Users tape auth-service réel. Tout écart restant → ticket backend.
