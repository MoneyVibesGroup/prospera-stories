---
baseline_commit: NO_VCS
---

# STORY-075 : Assemblage du stack d'intégration dev (3 services) + merge des branches livrées vers `dev`

**Epic :** EPIC-006 — `expert-comptable` *relying party* de l'IdP (clôture opérationnelle / release)
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` (topologie IdP ↔ relying parties, un seul propriétaire d'identité) · `architecture-auth-service-2026-07-04.md` · `architecture-kyc-service-2026-07-03.md`
**Priorité :** Must Have
**Story Points :** 5
**Statut :** not_started
**Assigné à :** Unassigned
**Créée le :** 2026-07-12
**Sprint :** 7
**Service :** transverse — `auth-service` (:3001), `expert-comptable` (:3000), `kyc-service` (:3002), `docker-compose` racine
**Couvre :** driver « environnement d'intégration bout-en-bout » — condition nécessaire pour que l'app cliente frontend s'intègre au vrai backend (retrofit FE-EPIC-002, stories `FE-INT-0..3`).
**Dépendances :** STORY-028/029/030 (cutover EC relying party), STORY-020/021 (extraction `kyc-service` + events), STORY-014 (`GET /tenant/state` + `TenantStateGuard`) — **toutes “done” mais NON mergées dans `dev`**.

> **Cette story ne code pas une nouvelle fonctionnalité — elle RÉCONCILIE et ASSEMBLE ce qui est déjà livré.** Le travail “done” du tracker (cutover, extraction KYC, `/tenant/state`) vit dans des branches `origin/STORY-*` **non mergées et partiellement divergentes** : `expert-comptable` @ `dev` est resté à **STORY-028** (pré-cutover, `/auth` HS256 + `/users` + `/kyc` encore présents), et la branche `origin/STORY-030` (cutover, datée du 09) contient **encore** `modules/kyc/` alors que `origin/STORY-020` (datée du 10) l'a retiré au profit du micro-service `kyc-service`. **Aucune branche unique ne porte l'état cible intégré.** Tant que ce n'est pas assemblé sur `dev` et lancé ensemble, le frontend n'a rien de réel à intégrer.

---

## User Story

En tant qu'**équipe PROSPERA**,
je veux **un `dev` intégré et un stack docker dev à trois services (auth-service :3001 + expert-comptable relying-party `rs256` :3000 + kyc-service :3002) qui démarre et fonctionne de bout en bout**,
afin que **l'app cliente frontend s'intègre contre le vrai backend cible (fin du mode “miroir”), et que les contrats supposés côté front soient confrontés aux endpoints réels.**

---

## Contexte

Le frontend (FE-001→010) a été bâti contre des **contrats supposés** ; l'audit d'intégration (2026-07-12) a montré que ces hypothèses visaient l'**architecture cible** (kyc-service :3002, `/auth/users` sur auth-service, onboarding via `/tenant/state`), mais que **le backend sur `dev` est en retard** et que **le compose dev ne lance ni `kyc-service` ni EC en `rs256`** (défaut `AUTH_MODE=hs256`). Résultat : un token RS256 émis par l'IdP n'est aujourd'hui pas accepté par EC, et `/kyc` n'est pas servi. Cette story rend le stack cible **réellement opérable en dev**.

---

## Périmètre

**Inclus :**

1. **Réconciliation des branches → `dev`** (les 3 repos) : intégrer STORY-029, STORY-030 (cutover EC), STORY-020, STORY-021 (extraction + events `kyc-service`) et STORY-014 (`/tenant/state` + `TenantStateGuard`) sur `dev`. **Trancher la divergence** `modules/kyc/` (retenir l'état post-020 : KYC hors EC, servi par `kyc-service`). État `dev` cible : EC **sans** `/auth`-émission ni `/users` ni `/kyc` ; `kyc-service` autonome ; auth-service IdP.
2. **Compose dev à 3 services** : le `docker-compose.yml` racine (+ override hot-reload) démarre `auth-service`, `expert-comptable`, `kyc-service` **et** l'infra partagée (mongo rs0, kafka, redis, minio, mailhog).
3. **EC + kyc-service en `AUTH_MODE=rs256` par défaut en dev** : `AUTH_JWKS_URI=http://auth-service:3001/api/.well-known/jwks.json` (ou chemin réel), `AUTH_ISSUER`, `AUTH_AUDIENCE` (`expert-comptable`, `kyc-service`) renseignés dans le compose. Aucun secret d'émission côté relying parties.
4. **Contrat de ports/préfixes figé et documenté** pour le front (direct-par-service, sans gateway) : auth-service `:3001`, EC `:3000`, kyc-service `:3002`, **préfixe global `/api`** (uniforme). C'est l'entrée de `FE-INT-0`.
5. **Swagger/OpenAPI exposé par service** (`/api/docs` / `/api/docs-json`) et **joignable** — source de génération des types front (`FE-INT-0`).

**Hors périmètre :**
- Gateway Traefik (décision : **pas de gateway maintenant**, direct-par-service via env — réintroduction transparente plus tard car le contrat de préfixes est stable).
- Toute nouvelle fonctionnalité métier.
- `platform-catalog-service` (reste EPIC-007, même sprint).

---

## Critères d'acceptation

1. `git log dev` des 3 repos contient les stories 029/030/020/021/014 ; EC sur `dev` **ne sert plus** `/auth/register|login|refresh|logout|verify-email|accept-invitation`, ni `/users`, ni `/kyc` (→ 404) ; seuls restent `GET /auth/me` et `GET /tenant/state`.
2. `docker compose up` démarre les **3 services** + infra, tous `/health` verts (mongo + kafka + redis/minio selon le service).
3. **Round-trip cross-service prouvé** : `register`/`verify`/`login` sur auth-service `:3001` → JWT **RS256** → `GET /tenant/state` sur EC `:3000` (200) **et** `GET /api/kyc/status` sur kyc-service `:3002` (200) avec le **même** token ; token HS256 forgé / altéré → 401 sur les deux relying parties.
4. Parcours KYC : `POST /api/kyc/documents` (RCCM+CFE) sur `:3002` → `kyc.status.changed` (outbox) → read-model EC → `GET /tenant/state` reflète `UNDER_REVIEW`.
5. Suspension org (admin IdP) → `identity.*` → read-model → `/tenant/state` renvoie 403 (coupure `TenantStateGuard`).
6. Chaque service expose son OpenAPI joignable (`/api/docs-json`) ; les 3 specs sont récupérables pour `FE-INT-0`.
7. `.env.example` des 3 services et le compose documentent le triplet ports/préfixe/`AUTH_MODE=rs256`.

---

## Notes

- **⚠️ Timing (relevé à la création) :** cette story est un **prérequis du retrofit frontend `FE-INT-0..3`**, planifié « avant Sprint 3 front ». Placée en Sprint 7 backend par décision, elle doit être **tirée en tête de Sprint 7** (ou avancée) pour ne pas bloquer le front. À arbitrer en sprint planning.
- La capacité relying-party (`AUTH_MODE=rs256`, JWKS) **existe déjà** (STORY-028) — ici on ne code pas la bascule, on **câble le défaut dev** et on **assemble**.
- Réf. front : `frontend-stories/FE-INT-0.md` (client API multi-base + génération OpenAPI).
