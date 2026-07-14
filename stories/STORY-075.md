---
baseline_commit: NO_VCS
---

# STORY-075 : Assemblage + preuve bout-en-bout du stack d'intégration dev (rs256, 4 services)

**Epic :** EPIC-006 — `expert-comptable` *relying party* de l'IdP (clôture opérationnelle / release)
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` (topologie IdP ↔ relying parties, un seul propriétaire d'identité) · `architecture-auth-service-2026-07-04.md` · `architecture-kyc-service-2026-07-03.md`
**Priorité :** Must Have
**Story Points :** 3 *(révisé depuis 5 — la réconciliation des branches, qui était l'essentiel, est déjà faite ; voir « Déjà réalisé »)*
**Statut :** done *(preuve docker e2e AC#2→#7 + AC#1 merge PR auth ; reliquat 1 ligne `.env.example` en suivi)*
**Assigné à :** Unassigned
**Créée le :** 2026-07-12 · **Recadrée le :** 2026-07-14
**Sprint :** 7
**Service :** transverse — `auth-service` (:3001), `expert-comptable` (:3000), `kyc-service` (:3002), *(+`platform-catalog-service` :3003 présent dans le compose)*, `docker-compose` racine
**Couvre :** driver « environnement d'intégration bout-en-bout » — condition nécessaire pour que l'app cliente frontend s'intègre au vrai backend (retrofit FE-EPIC-002, stories `FE-INT-0..3`).
**Dépendances :** STORY-028/029/030 (cutover EC relying party), STORY-020/021 (extraction `kyc-service` + events), STORY-014 (`GET /tenant/state` + `TenantStateGuard`) — **toutes done ET désormais mergées dans `dev`** (voir preuves ci-dessous).

> **⚠️ RECADRAGE 2026-07-14 — la story a été rédigée le 2026-07-12 sur une prémisse qui n'est plus vraie.** À l'époque, le travail « done » (cutover, extraction KYC, `/tenant/state`) vivait dans des branches `origin/STORY-*` **non mergées et divergentes**. **Ce n'est plus le cas :** l'assemblage a atterri sur `dev` (EC via le merge `MNV-015`, kyc via `MNV-014`+`MNV-040`) et le `docker-compose.yml` racine lance déjà les 4 services en `rs256`/JWKS par défaut. **La story ne réconcilie donc plus des branches — elle ASSEMBLE, LANCE et PROUVE le stack, puis FIGE le contrat d'intégration pour le front.**

---

## User Story

En tant qu'**équipe PROSPERA**,
je veux **un `dev` intégré et un stack docker dev (auth-service :3001 + expert-comptable relying-party `rs256` :3000 + kyc-service :3002) qui démarre et fonctionne prouvablement de bout en bout**,
afin que **l'app cliente frontend s'intègre contre le vrai backend cible (fin du mode « miroir »), et que les contrats supposés côté front soient confrontés aux endpoints réels.**

---

## Déjà réalisé (constaté le 2026-07-14 — NE PAS refaire)

Ces éléments constituaient le gros du périmètre initial et sont **déjà en place**. Cette section est la *reconnaissance* de l'état, pas du travail à produire.

| Sous-périmètre initial | État réel (preuve) |
|---|---|
| Réconciliation des branches EC → `dev` | ✅ EC `dev` = `4e534c7 merge(expert-comptable): MNV-015 → dev — billing plans + KYC/identity RS256 cutover (STORY-014/015/020/021/029/030)`. Commits atteignables : `d60c66b` (STORY-030 cutover), `d80f31b` (029 read-models identité), `ccc2470` (020 extraction KYC), `6bb3a4e` (021 consumer), `832dd5d` (014 TenantStateGuard). |
| Divergence `modules/kyc/` tranchée | ✅ EC `src/modules/` = `admin, auth, billing, identity, kyc-events, mail`. **Aucun `kyc.controller`** (seul `kyc-events` = consumer read-model), **aucun `users.controller`**. `auth.controller.ts` subsiste mais réduit (relying party). |
| Réconciliation kyc-service → `dev` | ✅ kyc `dev` = `MNV-014` (import initial) + `MNV-040` (`kyc.document.uploaded`) mergés (`5c04638` HEAD). |
| Compose multi-services + infra | ✅ `docker-compose.yml` racine lance **4 services** (EC:3000, auth:3001, kyc:3002, **+platform-catalog-service:3003**) + `mongo` (rs0), `kafka`, `redis`, `minio`, `mailhog`. Override hot-reload pour les 4. |
| rs256/JWKS par défaut en dev | ✅ EC/kyc/catalog : `AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json`, `AUTH_ISSUER=prospera-auth`, `AUTH_AUDIENCE` par service. IdP `AUTH_AUDIENCE=expert-comptable,kyc-service,platform-catalog-service`. Aucun secret d'émission côté relying parties. |
| Contrat de préfixe (résolu) | ✅ Les 3 services : `setGlobalPrefix('api')` **+ URI versioning `defaultVersion:'1'`** ⇒ préfixe effectif **`/api/v1`** (health à `/api/v1/health`, cf. healthchecks compose). JWKS exclu du préfixe : `/.well-known/jwks.json`. Swagger monté à `/api/docs`. **Le contrat réel est `/api/v1`, PAS `/api`** comme l'écrivait la version initiale de cette story. |

---

## Contexte

Le frontend (FE-001→010) a été bâti contre des **contrats supposés** ; l'audit d'intégration (2026-07-12) a montré que ces hypothèses visaient l'**architecture cible** (kyc-service :3002, `/auth/users` sur auth-service, onboarding via `/tenant/state`). Depuis, le backend a rattrapé cette cible sur `dev` et le compose lance le stack en `rs256`. **Ce qui manque n'est plus du code d'assemblage, mais la PREUVE opérationnelle** (le stack a-t-il déjà démarré ensemble et prouvé le round-trip cross-service ?) **et le FIGEAGE documenté du contrat** (ports + préfixe `/api/v1` + specs OpenAPI) que le retrofit front `FE-INT-0..3` doit consommer. Reste aussi une PR de revue auth-service (`fix/review-outbox-signing-key`) à intégrer pour un `dev` propre.

---

## Périmètre

**Inclus :**

1. **Intégrer la dernière branche en attente sur `dev` (auth-service)** : merger la PR ouverte `fix/review-outbox-signing-key` (`af57875` — corrections de revue outbox + reconnexion producteur + clé ACTIVE unique + algo refresh) dans `dev` en « Rebase and merge » (convention projet). Après quoi les 3 repos ont un `dev` propre et sans branche de correctif en attente.
2. **Démarrer le stack docker dev complet** : `docker compose up` (compose racine + override) lance les 4 services + infra ; tous les `/api/v1/health` verts.
3. **Prouver le round-trip cross-service RS256** : `register`/`verify`(Mailhog)/`login` sur auth-service `:3001` → JWT **RS256** (aud incluant `expert-comptable` **et** `kyc-service`) → même token accepté par EC `:3000` (`GET /api/v1/tenant/state` → 200) **et** par kyc-service `:3002` (`GET /api/v1/kyc/status` → 200) ; token HS256 forgé / altéré → **401** sur les deux relying parties.
4. **Prouver la propagation KYC** : `POST /api/v1/kyc/documents` (RCCM+CFE) sur `:3002` → `kyc.status.changed` (outbox) → consumer `kyc-events` EC → `GET /api/v1/tenant/state` reflète `UNDER_REVIEW`.
5. **Prouver la coupure de suspension** : suspension org (admin IdP) → `identity.*` → read-model EC → `GET /api/v1/tenant/state` renvoie **403** (`TenantStateGuard`).
6. **Figer & documenter le contrat d'intégration front** (entrée de `FE-INT-0`, direct-par-service, sans gateway) : ports auth `:3001` / EC `:3000` / kyc `:3002` ; **préfixe uniforme `/api/v1`** (URI versioning v1) ; JWKS **non préfixé** `/.well-known/jwks.json` ; Swagger UI `/api/docs`, JSON `/api/docs-json`. **Corriger l'ancienne mention `/api`.**
7. **Récupérer les specs OpenAPI** des 3 (voire 4) services (`/api/docs-json` joignable) — matière de génération des types front (`FE-INT-0`).
8. **Hygiène documentaire** : corriger la prémisse obsolète de cette story (fait ci-dessus), corriger la note `sprint-status.yaml` de STORY-075 (« done mais NON mergées dans dev » → faux), et vérifier que les `.env.example` des 3 services documentent le triplet ports/préfixe/`AUTH_JWKS_URI` cible.

**Hors périmètre :**
- **Réconciliation des branches → `dev`** : **DÉJÀ FAIT** (voir « Déjà réalisé »).
- Gateway Traefik (décision : **pas de gateway maintenant**, direct-par-service via env — réintroduction transparente plus tard car le contrat de préfixes est stable).
- Toute nouvelle fonctionnalité métier.
- Bascule `rs256` elle-même (capacité livrée en STORY-028 ; ici on ne fait que la **prouver** en dev).
- `platform-catalog-service` en tant que story (EPIC-007, déjà done) — il est simplement co-présent dans le stack ; sa preuve e2e n'est pas requise ici (optionnelle si triviale).

---

## Critères d'acceptation

1. **`dev` propre (3 repos)** : la PR auth-service `fix/review-outbox-signing-key` est mergée dans `dev` (« Rebase and merge ») ; `git log origin/dev` de chaque repo ne laisse **aucune** branche de correctif de revue en attente. *(EC/kyc : déjà propres — cf. « Déjà réalisé ».)*
2. **Stack qui démarre** : `docker compose up` démarre **auth+EC+kyc (+catalog)** + infra ; `GET /api/v1/health` répond vert sur `:3000/:3001/:3002` (dépendances mongo/kafka/redis/minio selon le service).
3. **Round-trip cross-service prouvé (docker)** : parcours `register→verify(Mailhog)→login` sur `:3001` produit un JWT **RS256** accepté par `GET /api/v1/tenant/state` (`:3000`, 200) **et** `GET /api/v1/kyc/status` (`:3002`, 200) avec le **même** token ; un token HS256 forgé **ou** altéré → **401** sur les deux relying parties.
4. **Propagation KYC prouvée** : `POST /api/v1/kyc/documents` (RCCM+CFE) → `kyc.status.changed` → read-model EC → `GET /api/v1/tenant/state` = `UNDER_REVIEW`.
5. **Coupure de suspension prouvée** : suspension org via l'admin IdP → événement `identity.*` → read-model EC → `GET /api/v1/tenant/state` = **403** (`TenantStateGuard`).
6. **Contrat figé & correct** : le préfixe documenté partout est **`/api/v1`** (plus aucune mention de `/api` seul comme contrat front) ; le triplet ports + préfixe + JWKS non préfixé est écrit dans un endroit unique consommable par `FE-INT-0` (cette story et/ou `.env.example`/README stack).
7. **OpenAPI joignable** : `GET /api/docs-json` répond sur `:3001/:3000/:3002` ; les 3 specs sont récupérables pour `FE-INT-0`.
8. **Hygiène** : prémisse de STORY-075 corrigée (fait) ; note STORY-075 dans `sprint-status.yaml` corrigée (plus de « non mergées dans dev ») ; `.env.example` des 3 services cohérents avec le compose (`AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE`, préfixe/version).

---

## Notes techniques

### Ce sur quoi s'appuie la story (déjà en place)
- **Compose racine** : `docker-compose.yml` + `docker-compose.override.yml` (hot-reload). Rappel projet : **démarrage exclusif via docker compose** depuis la racine.
- **rs256/JWKS** (défaut compose) : `AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json`, `AUTH_ISSUER=prospera-auth`, audiences par service ; IdP émet un `aud` multi-valué (`expert-comptable,kyc-service,platform-catalog-service`).
- **Préfixe** : `setGlobalPrefix('api')` + `enableVersioning({ type: URI, defaultVersion: '1' })` ⇒ routes sous **`/api/v1/...`** ; `health` = `@Controller({ path: 'health', version: '1' })`. JWKS exclu du préfixe.

### Commandes de preuve (indicatives)
```bash
# 1. lancer le stack
docker compose up -d && docker compose ps        # 4 services + infra "healthy"
for p in 3000 3001 3002; do curl -fsS localhost:$p/api/v1/health; done

# 2. round-trip RS256 (auth → EC + kyc)
#   register/verify(mailhog:8025)/login sur :3001 → récupérer accessToken (RS256)
curl -fsS -H "Authorization: Bearer $TOKEN" localhost:3000/api/v1/tenant/state   # 200
curl -fsS -H "Authorization: Bearer $TOKEN" localhost:3002/api/v1/kyc/status     # 200
curl -si  -H "Authorization: Bearer $FORGED_HS256" localhost:3000/api/v1/tenant/state | head -1  # 401

# 3. propagation KYC
curl -fsS -H "Authorization: Bearer $TOKEN" -F 'type=RCCM' -F 'file=@rccm.pdf' localhost:3002/api/v1/kyc/documents
#   → attendre le relais outbox → GET /tenant/state == UNDER_REVIEW

# 4. specs OpenAPI (FE-INT-0)
for p in 3000 3001 3002; do curl -fsS localhost:$p/api/docs-json -o openapi-$p.json; done
```

### Points d'attention
- **Ordre de démarrage** : les relying parties ont besoin du JWKS de l'IdP ; s'appuyer sur `depends_on`/healthchecks déjà présents. En cas de course kafka (auto-création de topic), transitoire connu (non bloquant).
- **`GET /api/v1/kyc/status`** : vérifier le chemin exact exposé par kyc-service (adapter la commande si le endpoint de statut diffère).
- **Suspension** : passe par l'admin IdP (auth-service) → `identity.*` ; vérifier le canal Kafka et le consumer `identity` côté EC.
- **`platform-catalog-service`** co-présent : ne pas casser son démarrage ; sa preuve e2e est optionnelle ici.

---

## Dépendances

**Stories prérequises (toutes done ET mergées dans `dev`) :**
- STORY-028 (JWKS/RS256 EC), STORY-029 (read-models identité EC), STORY-030 (cutover relying party pur).
- STORY-020 (extraction `kyc-service`), STORY-021 (`kyc.status.changed` outbox + read-model EC).
- STORY-014 (`GET /tenant/state` + `TenantStateGuard`).

**Prérequis résiduel :**
- PR auth-service `fix/review-outbox-signing-key` (`af57875`) ouverte — à merger dans `dev` (périmètre inclus, point 1).

**Débloque :**
- Retrofit frontend `FE-INT-0..3` (client API multi-base + génération OpenAPI) — voir `frontend-stories/FE-INT-0.md`.

**Dépendances externes :** aucune (infra tout-en-docker : mongo, kafka, redis, minio, mailhog).

---

## Definition of Done

- [x] PR auth-service `fix/review-outbox-signing-key` mergée dans `dev` (« Rebase and merge », `106b977`) ; `dev` des 3 repos sans branche de revue en attente.
- [x] `docker compose up` démarre les 4 services + infra ; les `/api/v1/health` verts (:3000/:3001/:3002/:3003 = 200).
- [x] Round-trip RS256 cross-service prouvé (AC #3) — trace docker (curl + statuts).
- [x] Propagation KYC prouvée (AC #4) — `UNDER_REVIEW` visible via `/tenant/state`.
- [x] Coupure de suspension prouvée (AC #5) — `403` via `/tenant/state`.
- [x] Contrat d'intégration `/api/v1` + ports + JWKS figé et documenté (AC #6) — sans mention résiduelle de `/api` seul.
- [x] 3 (voire 4) specs OpenAPI récupérées via `/api/docs-json` (AC #7).
- [x] Prémisse STORY-075 corrigée + note `sprint-status.yaml` STORY-075 corrigée + `.env.example` EC & kyc cohérents (AC #8). ⚠️ `auth-service/.env.example` : 1 ligne d'alignement `AUTH_AUDIENCE` en suivi (sandbox bloque l'édition des `.env*`).
- [x] Statut STORY-075 → `done` dans `sprint-status.yaml` avec note de preuve docker.

---

## Story Points Breakdown

- **Intégration/CI (merge PR auth + `dev` propre) :** 0.5 pt
- **Assemblage & preuve docker e2e (démarrage + 3 parcours prouvés) :** 2 pts
- **Contrat/doc (préfixe `/api/v1`, OpenAPI, `.env.example`, hygiène status) :** 0.5 pt
- **Total :** 3 pts

**Rationale :** l'essentiel du périmètre initial (réconciliation de branches + compose + rs256) est **déjà livré** ; ne subsistent que l'intégration d'une PR, la **preuve opérationnelle** du stack et le **figeage documenté** du contrat pour le front. D'où 5 → 3.

---

## Additional Notes

- **⚠️ Timing :** prérequis du retrofit frontend `FE-INT-0..3` (« avant Sprint 3 front »). À tirer **en tête de Sprint 7** pour ne pas bloquer le front.
- **Décision « pas de gateway »** maintenue : intégration front en **direct-par-service** via bases d'URL configurables ; le contrat de préfixe `/api/v1` étant stable, une gateway pourra être réintroduite plus tard sans casser le front.
- Réf. front : `frontend-stories/FE-INT-0.md` (client API multi-base + génération OpenAPI).

---

## Implementation Notes — Preuve docker bout-en-bout (2026-07-14)

Stack lancé depuis la racine (`docker compose up -d --build expert-comptable`, les 3 autres services + infra déjà `up`). EC rebâti depuis `dev` (post-cutover). **9 conteneurs**, les 4 services applicatifs `healthy`.

- **AC#2 — health** ✅ : `GET /api/v1/health` = **200** sur `:3000` (EC), `:3001` (auth), `:3002` (kyc), `:3003` (catalog).
- **AC#3 — round-trip RS256** ✅ : `register`(201) → `verify-email` via Mailhog (200) → `login`(200). JWT : `alg=RS256`, `kid=0630784e-…`, `iss=prospera-auth`, **`aud=[expert-comptable, kyc-service, platform-catalog-service]`**. Le **même** token → EC `GET /api/v1/tenant/state` **200** ET kyc `GET /api/v1/kyc/status` **200**. Token **HS256 forgé** → **401** sur les deux ; token **RS256 à signature altérée** → **401** sur les deux. *(Note observée : sans e-mail vérifié, kyc renvoie 403 — le jeton est authentifié mais le garde refuse ; après vérif → 200. Confortе la validation JWKS + le palier `emailVerified`.)*
- **AC#4 — propagation KYC** ✅ : `POST /api/v1/kyc/documents` RCCM (201) + CFE (201) → kyc `kycStatus=UNDER_REVIEW` (immédiat, local, 2 docs `SUBMITTED`) → **~1 s** plus tard EC `/tenant/state.kycStatus = UNDER_REVIEW` (chaîne `kyc.status.changed` → outbox → Kafka → consumer `kyc-events` EC → read-model).
- **AC#5 — coupure suspension** ✅ : `POST /api/v1/admin/organizations/{orgId}/suspend` (PLATFORM_ADMIN seedé `admin@prospera.local`) → org `ACTIVE`→`SUSPENDED` → **~2 s** plus tard EC `/tenant/state` du user passe **200 → 403** (`identity.org.updated` → read-model EC → `TenantStateGuard`).
- **AC#6 — contrat figé** ✅ : préfixe uniforme **`/api/v1`** confirmé (`setGlobalPrefix('api')` + URI versioning `defaultVersion:'1'`, health `@Controller({path:'health',version:'1'})`) ; JWKS **non préfixé** `/.well-known/jwks.json` (exclu du prefix, servi par l'IdP) ; Swagger UI `/api/docs`, JSON `/api/docs-json`.
- **AC#7 — OpenAPI** ✅ : `GET /api/docs-json` = **200** et récupéré pour les 4 services (auth 18,9 ko / EC 9,9 ko / kyc 9,7 ko / catalog 16,5 ko).
- **AC#8 — hygiène** : prémisse STORY-075 corrigée (recadrage) ; note `sprint-status.yaml` corrigée ; `.env.example` EC & kyc **cohérents** (JWKS/issuer/audience, aucun `AUTH_MODE`/`JWT_ACCESS_SECRET` résiduel). **Reliquat mineur** : `auth-service/.env.example` a `AUTH_AUDIENCE=expert-comptable,kyc-service` alors que le compose stampe déjà **3** audiences (manque `platform-catalog-service`) — à aligner (le compose fournit la bonne valeur, donc non bloquant en dev).

**AC#1 — intégration `dev` propre** ✅ (2026-07-14) : PR auth-service `fix/review-outbox-signing-key` (#1) mergée en « Rebase and merge » → `dev` HEAD **`106b977`** (correctif de revue rebasé sur `cdb8d08`), branche supprimée. Les 3 repos ont désormais un `dev` sans branche de correctif en attente (EC/kyc déjà propres).

**Reliquat (suivi, non bloquant) :**
- `auth-service/.env.example` : `AUTH_AUDIENCE` = `expert-comptable,kyc-service` → devrait devenir `…,platform-catalog-service` (alignement avec le compose qui stampe déjà 3 audiences). **Non appliqué ici** : le sandbox bloque l'accès en lecture/écriture au contenu des fichiers `.env*` (recherche autorisée, dump/édition refusés), donc pas d'édition « à l'aveugle » non vérifiable poussée dans une PR. À corriger en 1 ligne. **Impact nul en dev** (le compose fournit la bonne valeur).

**Pas de `/code-review` formel** : la story ne produit pas de code applicatif (preuve e2e + doc) ; le code sous-jacent (cutover, kyc events, TenantStateGuard, outbox auth) a déjà été revu dans ses stories/PR respectives.

---

## Progress Tracking

**Status History :**
- 2026-07-12 : Créée (Scrum Master) — périmètre « réconciliation de branches + assemblage ».
- 2026-07-14 : **Recadrée** (Scrum Master) — réconciliation constatée déjà faite (`dev` intégré, compose 4 services rs256) ; périmètre réduit à intégration PR auth + preuve e2e docker + figeage du contrat `/api/v1`. Points 5 → 3.
- 2026-07-14 : **Preuve docker bout-en-bout réalisée** (Developer) — AC#2/#3/#4/#5/#6/#7 verts (voir Implementation Notes). Reste AC#1 (merge PR auth, outward).

**Actual Effort :** ~2 pts consommés (preuve e2e + doc) ; reste ~0.5 pt (merge PR + push).

---

**This story was created (and recadrée) using BMAD Method v6 - Phase 4 (Implementation Planning)**
