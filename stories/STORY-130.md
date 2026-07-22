# STORY-130 : Dette de contrat OpenAPI — l'IdP décrit mal ce qu'il renvoie (`/users/me`, `/auth/verify-email`)

**Epic :** transverse / qualité de contrat (auth-service)
**Réf. process :** règle **Integration Gate** (`.claude/rules/integration-gate.md`) — « les types TS sont générés depuis l'OpenAPI, aucun type écrit à la main »
**Priorité :** Should Have
**Story Points :** 1
**Statut :** defined 📝
**Sprint :** 16 (proposé — à glisser avec n'importe quelle story auth du sprint)
**Créée le :** 2026-07-22
**Services :** `auth-service` (:3001)
**Couvre :** dette de contrat relevée pendant l'Integration Gate et FE-015

> Petite story, effet réel : **le frontend génère ses types depuis cet OpenAPI**. Chaque champ mal décrit
> oblige à écrire un contournement à la main — c'est-à-dire exactement ce que l'Integration Gate interdit.

---

## User Story

En tant que **frontend qui génère ses types depuis l'OpenAPI de l'IdP**,
je veux **que le schéma décrive ce que les routes renvoient réellement**,
afin de **ne pas réintroduire des types écrits à la main pour compenser une documentation fausse.**

---

## Description

Deux écarts constatés en confrontant les réponses réelles (stack docker `origin/dev`) aux schémas générés :

### 1. `GET /users/me` renvoie une organisation non déclarée

La réponse réelle contient un objet `organization` imbriqué (`id`, `name`, `slug`, `country`, `status`) —
la description de la route le dit d'ailleurs (« ses infos, son rôle, **son organisation** »). Mais
`UserResponseDto` ne porte pas ce champ. Le frontend qui voudrait l'utiliser doit soit le redéclarer à la
main, soit faire un second appel à `/organizations/me` — ce que fait FE-015 aujourd'hui.

### 2. `GET /auth/verify-email` déclare `content: never` mais renvoie un corps

Le schéma annonce une **200 sans contenu**. La route renvoie `{ "message": "Adresse e-mail vérifiée avec
succès." }`. Cet écart a un antécédent coûteux : le front typait l'appel en `Promise<void>`, la `queryFn`
résolvait `undefined`, et **TanStack Query mettait la requête en erreur** — l'écran affichait « Lien invalide
ou expiré » alors que le serveur répondait 200. Corrigé côté frontend (FE-INT-4), mais la cause est ici.

---

## Scope

**Inclus**

- Déclarer `organization` dans le DTO de `GET /users/me` (ou introduire un `MeResponseDto` distinct de
  `UserResponseDto` si les deux surfaces divergent — c'est le cas).
- Déclarer le corps de réponse de `GET /auth/verify-email` (`{ message: string }`), et faire de même pour
  toute route `/auth/*` qui renvoie un message non documenté (`resend-verification`, `logout` : à vérifier
  au passage).
- Re-générer et **relire** `/api/docs-json` après correction.

**Hors périmètre**

- Toute modification de comportement : la story ne change **que la description**. Si un écart révèle un vrai
  bug de comportement, il fait l'objet d'une story séparée.

---

## Acceptance Criteria

- **AC-01** — Le schéma de `GET /users/me` contient `organization` avec ses champs réels ; un `npm run
  gen:api` côté frontend produit un type exploitable sans ajout manuel.
- **AC-02** — `GET /auth/verify-email` déclare une réponse **200 avec** `{ message: string }`.
- **AC-03** — Les autres routes `/auth/*` renvoyant un message sont vérifiées et corrigées si besoin
  (liste explicite dans la PR, même si elle est vide).
- **AC-04** — Aucun changement de comportement : les réponses HTTP réelles sont identiques avant/après
  (diff de contrat only).

---

## Technical Notes

- Décorateurs `@ApiOkResponse({ type: … })` manquants ou pointant vers le mauvais DTO — c'est le motif
  habituel de ce genre d'écart avec `@nestjs/swagger`.
- Bon réflexe pour la suite : quand une route renvoie un corps, le DTO de ce corps doit exister ; `content:
  never` ne devrait apparaître que sur de vraies 204.

---

## Dependencies

- **Aucune.** Peut être livrée avec n'importe quelle story `auth-service`.
- **Sert** : toutes les stories frontend qui génèrent leurs types (FE-015, FE-019, FE-021…).

---

## Definition of Done

- 4 AC passent ; `npm run gen:api` rejoué côté frontend sans type manuel ajouté.
- La PR liste les routes vérifiées, y compris celles qui n'avaient rien à corriger.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — les deux écarts ont été rencontrés en conditions réelles :
  `verify-email` a produit un faux message d'erreur en navigateur (corrigé côté front en FE-INT-4),
  `organization` a été découvert en lisant la réponse réelle pendant FE-015.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
