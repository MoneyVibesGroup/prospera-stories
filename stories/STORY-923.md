# STORY-923 : le BFF relaie `PATCH /dossiers/{id}`

Status: in-progress

**Complexité :** faible (un client, un proxy, une route)

**Dette :** n° 4 de STORY-918 (« le BFF ne relaie pas `PATCH /dossiers/{id}` pour le collaborateur ; le 409 de version doit rester muet côté écran »)
**Service :** `admin-panel` (BFF de la console, `prospera-admin-panel-service`) — cible relayée : `dossier-service` (STORY-916, rien n'y change)
**Plage :** groupe A, lot 3, n° 4 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2). Fiche écrite avant de coder.

---

## Constat avant de coder

- Le BFF ne relaie **aucune** route de `dossier-service` aujourd'hui : il n'y a pas de client, pas d'URL de configuration.
  Le « motif des routes de dossier déjà relayées » n'existe pas ; le motif suivi est celui des proxys d'écriture du BFF
  (`UpstreamClient.patch`, `rethrowUpstreamError`, STORY-048/106/378/917).
- Les jetons de l'IdP portent déjà `admin-panel` et `dossier-service` dans `aud` (compose racine) : le bearer du
  collaborateur est valide des deux côtés, il est relayé tel quel.
- `dossier-service` valide tout (`ModifierIdentiteDto`) et porte le verrou optimiste **dans le corps** (`version`) :
  il n'y a **pas d'`If-Match`**. Le BFF relaie donc le corps, il ne le valide pas une seconde fois.

## Ce que la story livre

`PATCH /api/v1/dossiers/:id` sur le BFF → `PATCH /api/v1/dossiers/:id` de `dossier-service`.

- Garde : `@Roles(TENANT_ADMIN)` (miroir de D-916-1) ; un opérateur plateforme sans rôle tenant, ou un `TENANT_USER`, est refusé `403` par le BFF
  avant tout appel amont.
- Corps : `version` (entier ≥ 1, exigé) + les seize champs d'identité, relayés **sans transformation** (`@Allow`, le BFF ne les type pas :
  une conversion implicite changerait un `null` ou un nombre). Un champ inconnu est refusé `400` par la liste blanche globale.
- Identifiant du dossier : validé en forme (anti-injection de chemin) puis encodé dans l'URL amont.
- Succès : code et corps amont traversent (`200`).
- Refus amont : le **code HTTP est conservé** (`400`, `403`, `404`, `409`, `422`, `429`) et le **code applicatif** traverse s'il est dans une
  liste fermée (`CONFLIT_CONCURRENT`, `DOSSIER_ARCHIVE`, `DOSSIER_INTROUVABLE`, `DOSSIER_NIF_DEJA_UTILISE`, `IDENTITE_VIDE`, `DIRIGEANT_REQUIS`,
  `ABONNEMENT_EXPIRE`, `EMAIL_NOT_VERIFIED`, `KYC_NOT_APPROVED`, `ORGANISATION_REQUISE`, `PORTEUR_NON_IDENTIFIABLE`). **Aucun message n'est ajouté** :
  `{ statusCode, error, code }` — c'est l'écran qui écrit sa phrase. Le corps amont brut, ses `message` et `details` ne traversent pas (règle du BFF, STORY-378).
- Un échec de transport (timeout, 5xx amont) devient `503`, comme toute écriture proxifiée : jamais présenté comme un succès.
- OpenAPI du BFF (`/api/docs-json`) : la route et son DTO y figurent (les types du front se génèrent depuis elle).
- Configuration : `DOSSIER_SERVICE_URL` (**facultative**, défaut `http://dossier-service:3009/api/v1`) — aucune variable requise de plus, donc aucun
  compose ne casse.

## Décisions (retenues par défaut, contestables)

- **D-923-1 — Garde `TENANT_ADMIN`, pas « tout collaborateur ».** Le service réserve la route à `TENANT_ADMIN` (D-916-1) : ouvrir le BFF à
  `TENANT_USER` ne produirait qu'un `403` amont. L'ouverture aux collaborateurs (D12) demande d'abord un `409` muet côté service (le
  `DOSSIER_NIF_DEJA_UTILISE` nomme un dossier) ; elle reste une suite à tracer.
- **D-923-2 — Projection par liste fermée, pas relais brut.** La consigne disait « corps de la cible tel quel » ; la règle du BFF (anti-fuite,
  STORY-378) interdit de relayer un corps amont. On garde donc code HTTP + `code` applicatif (tout ce dont l'écran a besoin) et on **n'ajoute et ne
  relaie aucun texte**. Contestable : élargir la liste est une ligne.
- **D-923-3 — Pas de validation des champs dans le BFF** (le service reste l'unique source des règles) ; le BFF ne contrôle que `version`.
- **D-923-4 — Les 400 de validation du service ne traversent qu'avec leur code** (`IDENTITE_VIDE`, `DIRIGEANT_REQUIS`) ; un 400 de
  `class-validator` sans code rend `400` sans détail de champ (l'écran valide avant d'envoyer).

## Critères d'acceptation

- **AC-1** : succès — corps et code amont relayés ; `Authorization` propagé ; corps transmis tel quel (dont `null`).
- **AC-2** : `409 CONFLIT_CONCURRENT` amont ⇒ `409` avec `code: CONFLIT_CONCURRENT`, sans `message`.
- **AC-3** : `403` et `404` amont relayés avec leur code ; `403` du BFF (rôle) sans appel amont.
- **AC-4** : un code hors liste n'est pas relayé ; un 5xx amont ⇒ `503`.
- **AC-5** : la route figure dans l'OpenAPI du BFF.
- **AC-6** : mutation (409 → 500, ou `version` non propagée) ⇒ test rouge sur l'assertion.

## Definition of Done

- [ ] `tsc`/build, unitaires et e2e concernés (par chemin), lint des fichiers touchés.
- [ ] `docker compose up` du BFF (un provider et un contrôleur de plus) : le service démarre ; pile `grp-a` descendue, verrou rendu.
- [ ] PR code et docs fusionnées ; tracker, journal, dette 4 barrée, ligne pour D.
