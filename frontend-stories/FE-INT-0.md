# Story FE-INT-0 : Client API multi-base (direct-par-service) + préfixe `/api` + génération OpenAPI

Status: backlog

**Epic :** FE-EPIC-002 — Intégration backend (retrofit / Integration Gate)
**Points :** 5 · **Sprint :** Integration Gate (avant Sprint 3) · **App :** `prospera-frontend-expert-comptable`
**API :** transverse — auth-service (:3001), expert-comptable (:3000), kyc-service (:3002), préfixe `/api`
**Backend d'appui :** **STORY-075** (stack d'intégration dev 3 services `rs256` + OpenAPI joignable) — *bloquant*
**Réf. plan :** amende **FE-002** (client API + BFF) · audit d'intégration 2026-07-12
**Dépendances :** STORY-075 (backend). Prérequis de FE-INT-1/2/3.

---

## Convention Git

- **Une story = une branche.** Branche : `fe-int-0`. Commits préfixés `FE-INT-0 …`.
- Branche depuis `dev` + rebase sur `origin/dev` **avant** de coder ; push HTTPS ; PR vers `dev`.

---

## User Story

En tant que **développeur frontend**,
je veux **un client API qui route chaque appel vers le bon service par son préfixe et inclut le préfixe global `/api`, avec des types générés depuis les OpenAPI réels**,
afin que **l'app cliente parle au vrai backend (3 services, sans gateway) au lieu de contrats supposés écrits à la main.**

---

## Contexte

Décision **direct-par-service via env** (pas de gateway pour l'instant), en gardant le **contrat de préfixes `/auth` `/ec` `/kyc` stable** pour une réintroduction transparente de la gateway plus tard. Deux défauts hérités à corriger :

1. **Base URL unique** (`NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`) → impossible de servir à la fois auth (:3001), EC (:3000) et kyc (:3002). Le client doit **router par préfixe** vers une base par service.
2. **Préfixe global `/api` omis** partout (les 3 services montent `setGlobalPrefix('api')`).
3. **`api.d.ts` est un stub écrit à la main** — la décision « types générés OpenAPI » (FE-002) n'a jamais pu s'appliquer faute de spec joignable ; STORY-075 rend les 3 Swagger disponibles.

---

## Périmètre

**Inclus :**
- **Refactor `src/lib/api/api-client.ts`** : résolution de la base par **préfixe logique** → `NEXT_PUBLIC_AUTH_URL` (:3001) pour `/auth` & `/users`, `NEXT_PUBLIC_EC_URL` (:3000) pour `/ec` (→ `/tenant*`), `NEXT_PUBLIC_KYC_URL` (:3002) pour `/kyc`. Concaténer le **préfixe global `/api`**. Bearer + refresh silencieux inchangés (cross-service : 1 seul token RS256).
- **BFF (`src/lib/auth/bff.ts`, `idpUrl`)** : cible auth-service (`NEXT_PUBLIC_AUTH_URL`) + `/api`.
- **Upload KYC (`src/features/kyc/api/upload-document.ts`)** : cible `NEXT_PUBLIC_KYC_URL` + `/api/kyc/documents` (XHR progress conservé).
- **`.env.example` / `.env.local`** : remplacer la base unique par les 3 vars + documenter ports/préfixe. Garder un fallback si une seule gateway est fournie plus tard (base unique → toutes les prefixes) pour la transition.
- **Génération des types** : récupérer les 3 OpenAPI (`/api/docs-json` de chaque service), script `gen:api` adapté (3 sources → `src/types/api.d.ts` agrégé, ou 1 fichier par service). Remplacer le **stub manuel**.
- Mettre à jour les tests de `api-client` (résolution de base par préfixe).

**Hors périmètre :**
- Le remodelage des features Users / KYC / Onboarding → FE-INT-1 / 2 / 3 (cette story livre la **plomberie** qu'elles consomment).
- Gateway Traefik (différée).

---

## Critères d'acceptation

1. Un appel `/auth/...` part vers `NEXT_PUBLIC_AUTH_URL` + `/api`, `/kyc/...` vers `NEXT_PUBLIC_KYC_URL` + `/api`, `/ec/...` vers `NEXT_PUBLIC_EC_URL` + `/api` — vérifié par tests unitaires du client.
2. Le même access token RS256 est envoyé (Bearer) aux 3 services ; le refresh silencieux (via BFF) fonctionne toujours.
3. `npm run gen:api` produit `src/types/api.d.ts` **généré** depuis les OpenAPI réels des 3 services ; le stub manuel est supprimé.
4. Aucune URL/port codé en dur hors env ; build (`next build --webpack`) + lint + tests verts.
5. Contre le stack STORY-075 (`docker compose up`) : un `GET /api/tenant/state` (EC) et un `GET /api/kyc/status` (kyc) partent bien sur des bases distinctes avec le même token.

---

## Integration Gate (rappel)

FE-INT-0 est **la porte d'entrée** de l'Integration Gate de FE-EPIC-002 : sans client multi-base + types générés, les stories suivantes ne peuvent pas taper le vrai backend. Aucune story de l'epic n'est « done » tant que les contrats supposés ne sont pas confrontés au réel et que les mocks miroir ne sont pas retirés.
