# STORY-109 : Activer CORS sur les relying-parties (auth/EC/kyc/catalog/document) — rendre l'app cliente « direct-par-service » réellement joignable depuis le navigateur

**Epic :** transverse / **enablement topologie Option B** (rattachée informativement à EPIC-006 — topologie relying-party ; story cross-cutting hors décompte d'epic, cf. précédent STORY-108)
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` § topologie ; décision transverse frontend **« Gateway = Option B : direct-par-service »** (2026-07-12) ; `frontend-sprint-status.yaml` § décisions transverses
**Priorité :** Must Have (**bloqueur** du démo navigateur de tout le gate d'intégration client)
**Story Points :** 3
**Statut :** defined
**Sprint :** 12 (2026-12-03 → 2026-12-17) — slottée par décision user 2026-07-19 (hors thème Bilan du S12, insérée comme enablement urgent ; S12 → 26/34)
**Créée le :** 2026-07-19
**Services :** `auth-service` (:3001), `expert-comptable` (:3000), `kyc-service` (:3002), `platform-catalog-service` (:3003), `document-service` (:3006)
**Couvre :** dette d'intégration — aucune FR (story d'**enablement**, origine : vérif LIVE Playwright de FE-INT-3, 2026-07-19)

> **Story d'intégration, pas de fonctionnalité.** La vérification navigateur réelle de FE-INT-3 (Playwright contre le stack docker STORY-075) a prouvé que **l'app cliente ne peut PAS parler aux services depuis le navigateur** : aucun service n'active CORS. Le login passe (il transite par le BFF Next same-origin), mais le premier appel client-side direct (`GET /api/v1/tenant/state`) est **bloqué par la politique CORS du navigateur** (« No 'Access-Control-Allow-Origin' header »). Les contrats HTTP sont bons (prouvés au curl) ; c'est la **topologie navigateur** qui est cassée.

---

## User Story

En tant qu'**app cliente `prospera-frontend-expert-comptable` (relying party navigateur, topologie Option B direct-par-service)**,
je veux que **les services que j'appelle en direct depuis le navigateur (auth, EC, kyc, catalog, document) renvoient les en-têtes CORS autorisant mon origine**,
afin que **les `fetch` cross-origin du navigateur (avec `Authorization: Bearer`) aboutissent au lieu d'être bloqués au préflight — et que FE-INT-1/2/3 et FE-014 soient réellement démontrables en navigateur, pas seulement au curl.**

---

## Contexte

### Le trou, mesuré (2026-07-19)

Vérif LIVE de FE-INT-3 : app cliente servie sur `http://localhost:3100` (car `:3000` est occupé par le backend EC), stack docker STORY-075 healthy.

- `POST /api/auth/login` (route BFF Next **same-origin** :3100) → **200**, session établie, shell rendu.
- `GET http://localhost:3000/api/v1/tenant/state` (fetch **cross-origin** navigateur) → **bloqué** :
  ```
  Access to fetch at 'http://localhost:3000/api/v1/tenant/state' from origin
  'http://localhost:3100' has been blocked by CORS policy: Response to preflight
  request doesn't pass access control check: No 'Access-Control-Allow-Origin'
  header is present on the requested resource.
  ```
- Conséquence UI : le stepper d'onboarding **ne s'affiche pas** (la query échoue → `OnboardingSection` renvoie `null`), la page `/users` tombe en « accès réservé » (le `GET /users` est bloqué pareil).

### Cause racine

`grep -rl "enableCors"` sur les 6 dépôts backend (auth, EC, kyc, catalog, document, admin) → **0 occurrence**. Préflight `OPTIONS` sur n'importe quelle route → **404**, aucun en-tête `Access-Control-*`, pour **toute** origine (testé `:3000` et `:3100`).

C'est **structurel à la décision Option B** : « gateway = pas de gateway, direct-par-service via env » (2026-07-12). Dans cette topologie, le navigateur charge l'app depuis **une** origine et appelle **N** services sur **N** ports = **N** origines distinctes → chaque appel est cross-origin → **CORS est obligatoire**. Il n'a jamais été activé parce que les « AC5 live » de FE-INT-0 étaient vérifiés au **curl** (server-to-server, pas de politique CORS) — angle mort classique.

### Ce que le BFF masque (et ne couvre pas)

Seuls `POST /auth/login` et `POST /auth/refresh` transitent par le BFF Next (`app/api/auth/*`, same-origin) → **pas** concernés par CORS. **Tout le reste est un appel client-side direct** et nécessite CORS :
- `auth-service` : `POST /auth/register`, `GET /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/accept-invitation`, `GET /users`, `POST /users/:id/resend-invitation`, `GET|PATCH /organizations/me` → **CORS requis** (⚠️ l'IdP est donc dans le périmètre, pas seulement les relying-parties « pures »).
- `expert-comptable` : `GET /tenant/state`, `GET /auth/me`, `GET /billing/plans`.
- `kyc-service` : `GET /kyc/status`, `POST /kyc/documents`.
- `platform-catalog-service` : `GET /catalog/*` (FE-014).
- `document-service` : `GET /documents/:id/extraction` (FE-018).

### Hors périmètre — `admin-panel`

`admin-panel` (:3010) est un **BFF full same-origin** (Route Handlers Next côté app admin) : son frontend appelle ses propres routes same-origin, le BFF relaie en server-to-server. **Aucun besoin de CORS.** Ne pas l'activer là (surface inutile).

---

## Décision de conception

**Activer CORS via `app.enableCors()` dans le `main.ts` de chaque service du périmètre, piloté par une variable d'env `CORS_ALLOWED_ORIGINS` (liste d'origines séparées par des virgules).** Miroir de la discipline env existante (validation Zod/`configuration.ts`, fail-fast).

- **Origines** : allowlist **explicite** (jamais `*` — on porte un `Authorization` header et on veut pouvoir passer `credentials` plus tard sans réécrire). En dev : l'origine du serveur de dev de l'app cliente. En prod : la/les origine(s) publiques du front. `CORS_ALLOWED_ORIGINS` vide → CORS **désactivé** (comportement actuel préservé, pas de régression pour les services purement server-to-server).
- **Méthodes** : `GET, POST, PATCH, PUT, DELETE, OPTIONS`.
- **En-têtes autorisés** : `Authorization, Content-Type` (au minimum ; ajouter `X-Request-Id` si un service le lit en entrée).
- **`credentials`** : `false` en v1 (l'app cliente porte le token dans `Authorization`, pas en cookie cross-site ; le refresh cookie httpOnly reste **same-origin** sur le BFF). Documenté : si un besoin de cookie cross-site apparaît, repasser `credentials: true` **et** interdire `*` (déjà le cas).
- **Préflight** : `enableCors()` gère `OPTIONS` automatiquement — vérifier qu'il répond **204/200 avec les en-têtes** et **avant** les guards (NestJS le fait au niveau plateforme, en amont du pipeline Nest).

> ⚠️ **Interaction avec le préfixe global `/api/v1` et le versioning URI** : `enableCors()` est **app-level**, il s'applique à toutes les routes préfixées. Le vérifier explicitement (le préflight sur `/api/v1/tenant/state` doit répondre, pas seulement `/`).

> ⚠️ **Note de config dev (port)** : `:3000` est occupé par le backend `expert-comptable`. Le serveur de dev de l'app cliente **doit donc tourner sur un autre port** (ex. `:3100`, comme la vérif LIVE) ; c'est **cette** origine qui doit figurer dans `CORS_ALLOWED_ORIGINS` en dev. À acter dans `.env.example` des services **et** dans le README frontend (script `dev -p 3100`).

---

## Périmètre

**Inclus :**
- `main.ts` des **5** services (auth, EC, kyc, catalog, document) : `app.enableCors({ origin: <allowlist depuis env>, methods, allowedHeaders, credentials: false })`.
- `configuration.ts` (ou équivalent) de chaque service : lecture + validation de `CORS_ALLOWED_ORIGINS` (liste ; vide = désactivé).
- `.env` / `.env.example` de chaque service : documenter `CORS_ALLOWED_ORIGINS` (défaut dev = origine du front, ex. `http://localhost:3100`).
- `docker-compose.yml` (racine) : injecter `CORS_ALLOWED_ORIGINS` (avec défaut dev) dans les 5 services, à la façon des autres env (`${...:-http://localhost:3100}`).
- Test unitaire/e2e léger par service : le préflight `OPTIONS` d'une route réelle renvoie `Access-Control-Allow-Origin` = origine autorisée, et **rien** pour une origine non listée.

**Hors périmètre :**
- `admin-panel` (BFF same-origin — cf. ci-dessus). Ne pas y toucher.
- Introduction d'une gateway (resterait Option B ; décision transverse inchangée). CORS est le corollaire assumé d'Option B, pas son remplacement.
- `credentials: true` / cookies cross-site (non requis tant que l'auth navigateur est Bearer + BFF same-origin pour le refresh).
- Le gap FE-004 (`organizationName` → `cabinetName`) → traité côté **frontend** par **FE-INT-4** (story sœur), pas ici.

---

## Critères d'acceptation

**Code / config**
- [ ] **AC-01** — Chaque service du périmètre appelle `app.enableCors()` piloté par `CORS_ALLOWED_ORIGINS` ; liste vide ⇒ CORS off (non-régression server-to-server).
- [ ] **AC-02** — `CORS_ALLOWED_ORIGINS` est validé au boot (fail-fast si format invalide) et documenté dans les `.env.example` des 5 services + injecté par `docker-compose.yml`.
- [ ] **AC-03** — L'allowlist est **explicite** : origine non listée ⇒ **pas** d'en-tête `Access-Control-Allow-Origin` (jamais `*`).

**Vérification HTTP (curl) — stack docker**
- [ ] **AC-04** — Préflight `OPTIONS /api/v1/tenant/state` avec `Origin: http://localhost:3100` + `Access-Control-Request-Method: GET` + `Access-Control-Request-Headers: authorization` → **204/200** avec `Access-Control-Allow-Origin: http://localhost:3100` et `Access-Control-Allow-Headers` incluant `authorization`. Idem sur une route de chaque service (`/api/v1/kyc/status`, `/api/v1/users`, `/api/v1/catalog/modules`, `/api/v1/documents/health` ou route réelle).
- [ ] **AC-05** — Même préflight depuis `Origin: http://evil.example` → **aucun** `Access-Control-Allow-Origin`.
- [ ] **AC-06** — La réponse **réelle** (GET avec token valide + Origin autorisée) porte aussi `Access-Control-Allow-Origin`.

**Vérification NAVIGATEUR (le cœur de la story — c'est ce qui manquait)**
- [ ] **AC-07** — Rejeu du scénario Playwright de FE-INT-3 (app cliente sur :3100, stack réel, **zéro mock**) : après login réel, `GET /tenant/state` **aboutit (200, pas d'erreur CORS console)** et le **stepper d'onboarding s'affiche** reflétant `{emailVerified, kycStatus, subscriptionActive}` réels. C'est le critère qui **discrimine** l'état avant/après (avant : bloqué CORS, stepper absent).
- [ ] **AC-08** — Toujours en navigateur : la page `/users` charge la liste réelle (GET /users :3001) sans erreur CORS.

**Non-régression**
- [ ] **AC-09** — Le login/refresh via BFF (server-to-server) reste inchangé ; les flux server-to-server internes (admin-panel → upstream, consumers Kafka) ne sont pas affectés.
- [ ] **AC-10** — Lint 0 warning · build OK · unit + e2e verts · seuils de couverture tenus sur les 5 services.

---

## Notes techniques

### Méthode
`app.enableCors()` **avant** `app.listen()`, après `setGlobalPrefix('api')` + versioning (l'ordre n'affecte pas CORS mais garde les `main.ts` cohérents). Lire l'allowlist depuis le service de config validé, pas directement `process.env` (discipline projet).

### Sécurité
- **Jamais `*`** avec un `Authorization` header : l'allowlist explicite est la surface de contrôle. Une origine non prévue ne doit rien recevoir.
- CORS **n'est pas** de l'autorisation : il ne remplace ni les guards JWT/RS256 ni la coupure `IdentitySuspensionGuard`. Un préflight autorisé sur une origine ne donne aucun accès sans token valide (AC-06 le vérifie avec token ; l'accès métier reste gardé côté service).
- Le `document-service` sert des extractions par tenant (isolation orgId) : CORS ne change pas l'isolation, il autorise seulement le navigateur à faire l'appel — la garde `@Roles`/orgId reste souveraine.

### Cas limites
- **`CORS_ALLOWED_ORIGINS` avec espaces / entrées vides** : trim + filtrage (une virgule finale ne doit pas autoriser l'origine vide).
- **Plusieurs origines** (dev + preview + prod) : la liste doit toutes les honorer, en renvoyant **l'origine de la requête** si elle est dans la liste (echo), pas la première.
- **Requête sans `Origin`** (curl, server-to-server) : comportement inchangé (pas de CORS appliqué) — c'est le cas non-régression AC-09.

---

## Dépendances

**Prérequises :** STORY-075 ✅ (stack dev 4 services RS256) — fournit l'environnement de vérif.
**Débloque :** le **démo navigateur** de FE-INT-1 (users), FE-INT-2 (kyc), FE-INT-3 (onboarding) et FE-014 (catalog/entitlements) — aujourd'hui tous cassés en navigateur. Sans cette story, le gate d'intégration client est vérifié au **contrat HTTP** mais **pas démontrable dans un navigateur**.
**Story sœur :** **FE-INT-4** (frontend) — corrige `organizationName` → `cabinetName` sur l'inscription (gap FE-004 découvert au même moment). Indépendante (l'une peut passer sans l'autre) mais les deux sont nécessaires pour un parcours navigateur complet register→onboarding.

---

## Definition of Done

- [ ] Lint 0 warning · build OK · unit + e2e verts · couverture tenue sur les **5** services
- [ ] `.env.example` (×5) + `docker-compose.yml` documentent/injectent `CORS_ALLOWED_ORIGINS`
- [ ] **Vérif curl** (AC-04→06) consignée : préflight OK par service, origine non listée refusée
- [ ] **Vérif navigateur** (AC-07/08) consignée : rejeu Playwright FE-INT-3, stepper affiché, 0 erreur CORS console — capture d'écran jointe
- [ ] Non-régression BFF login/refresh + flux server-to-server
- [ ] Statut synchronisé (en-tête + `sprint-status.yaml` + Progress Tracking)
- [ ] `/code-review` passé, constats traités
- [ ] Branches `MNV-109(<service>)` par dépôt, PR par service, Rebase and merge sur `dev`

---

## Découpage des points

- **enableCors + config + env (5 services, patron répété) :** 1,5 pt
- **Tests préflight (5 services) :** 0,5 pt
- **Vérif curl + navigateur (rejeu Playwright réel) :** 1 pt
- **Total : 3 points** — travail répétitif à faible risque unitaire ; le coût réel est la **vérif navigateur multi-service** (le seul instrument qui prouve que le trou est bouché).

---

## Progress Tracking

- 2026-07-19 : **créée** — statut `defined`. Origine : vérif LIVE Playwright de FE-INT-3 (le login BFF passe, `GET /tenant/state` bloqué CORS ; 0 `enableCors` sur les 6 dépôts). Bloqueur du démo navigateur du gate d'intégration client. Mémoire projet : `frontend-cors-blocker`.
- 2026-07-19 : **slottée au sprint 12** (décision user) — S12 passe à 26/34. Insérée hors thème Bilan (EPIC-011) comme enablement urgent ; à faire tôt dans le sprint car elle débloque le frontend déjà en attente.
