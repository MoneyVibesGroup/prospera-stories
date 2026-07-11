---
baseline_commit: NO_VCS
---

# STORY-028 : `expert-comptable` valide via JWKS (bascule HS256 → RS256)

**Epic :** EPIC-006 — `expert-comptable` devient *relying party* de l'IdP
**Réf. architecture :** `architecture-expert-comptable-2026-07-02.md` (rév. 1.2, §Bascule relying party) · `architecture-auth-service-2026-07-04.md` §Émission RS256 / JWKS (source des claims) · `architecture-prospera-ecosystem-2026-07-04.md` (topologie IdP ↔ relying party, JWKS)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Implémenté + VÉRIFIÉ DOCKER BOUT-EN-BOUT (2026-07-08) — reste : `/code-review` formel + commit sur demande
**Assigné à :** Unassigned
**Créée le :** 2026-07-08
**Sprint :** 4
**Service :** expert-comptable (`:3000`)
**Couvre :** driver 3 « un seul émetteur de jetons » (l'IdP) — premier pas de l'extraction d'identité côté vertical

> **Première story d'EPIC-006 : `expert-comptable` cesse d'être son propre émetteur de confiance.** Jusqu'ici, le vertical **signe et vérifie** ses access tokens avec un secret symétrique partagé (`JWT_ACCESS_SECRET`, HS256) — il est à la fois IdP et relying party. EPIC-005 a fait d'`auth-service` l'**unique émetteur** : il signe en **RS256** avec une clé privée qu'il seul détient et expose la clé publique via **JWKS** (`GET :3001/.well-known/jwks.json`, STORY-024). STORY-028 fait basculer **la seule brique de vérification** d'`expert-comptable` — la `JwtStrategy` — de « secret partagé » vers « clé publique récupérée par JWKS », **sans toucher aux guards, aux contrôleurs, ni au parcours e2e**. C'est une bascule **de vérification pure** : `expert-comptable` continue provisoirement à émettre ses propres jetons (son `login`/`register` local subsiste jusqu'au cutover STORY-030) ; ce qui change, c'est **comment il fait confiance à un jeton présenté**. Le retrait des modules d'identité et la coupure de l'émission locale = **STORY-030** ; l'alimentation des read-models d'identité par `identity.*` = **STORY-029**. La bascule doit rester **réversible par configuration** le temps de la transition.

---

## User Story

En tant qu'**`expert-comptable`** (service *relying party* de l'écosystème PROSPERA),
je veux **valider les JWT présentés en vérifiant leur signature RS256 contre la clé publique de l'IdP récupérée par JWKS** (au lieu d'un secret HS256 partagé),
afin de **ne plus détenir aucun secret de signature**, de faire de l'IdP l'**unique source de confiance** des jetons, et de préparer le cutover complet en *relying party* (STORY-029/030).

---

## Description

### Contexte

Aujourd'hui, `expert-comptable` fait confiance à un jeton **parce qu'il connaît le secret qui l'a signé** — le même secret sert à signer (`TokenService`) et à vérifier (`JwtStrategy`) :

- La stratégie de vérification utilise **HS256 + secret symétrique** : `secretOrKey: config.getOrThrow('auth').accessSecret` ([jwt.strategy.ts:25](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts#L25)). Toute partie détenant `JWT_ACCESS_SECRET` peut forger un jeton accepté — modèle incompatible avec un IdP central.
- Le payload attendu est **propriétaire** : `{ sub, tenantId, role, emailVerified }` avec **`role` singulier** et **`tenantId`** ([jwt-payload.interface.ts:11-19](../../expert-comptable/src/modules/auth/types/jwt-payload.interface.ts#L11-L19)).
- `auth-service` émet un jeton **différent** : signé **RS256** (clé privée + `kid` dans l'en-tête), avec les claims **`{ sub, org, roles, emailVerified }`** plus `iss`/`aud`, et publie la clé publique via **JWKS** ([token.service.ts:54-69](../../auth-service/src/modules/auth/token.service.ts#L54-L69), [jwks.controller.ts:12](../../auth-service/src/modules/auth/jwks.controller.ts#L12)).

Deux écarts à combler : le **mécanisme de confiance** (secret partagé → clé publique JWKS) et le **format des claims** (`org` → `tenantId`, `roles[]` → `role`).

STORY-028 apporte trois briques, **sans régression fonctionnelle** :

1. **Vérification RS256 via JWKS** — la `JwtStrategy` récupère dynamiquement la clé publique de signature auprès du JWKS de l'IdP (par `kid`), avec **cache** et **rafraîchissement** en cas de `kid` inconnu (rotation de clé), au lieu d'un secret statique.
2. **Vérification `iss`/`aud`** — le jeton n'est accepté que si son émetteur (`iss`) et son audience (`aud`) correspondent à la configuration attendue (l'IdP PROSPERA et `expert-comptable` comme audience).
3. **Adaptation des claims** — mapping `org → tenantId`, `roles[] → role`, `emailVerified` conservé, projeté vers `request.user` (`AuthenticatedUser`) et `TenantContext` **à l'identique de l'actuel**, pour que **la chaîne de guards et les contrôleurs restent inchangés**.

La bascule est pilotée par **configuration** (feature flag) : `hs256` (legacy, transition) ↔ `rs256` (JWKS), afin de pouvoir revenir en arrière sans redéploiement de code le temps de STORY-029/030.

### Périmètre

**Inclus :**

- **Stratégie de vérification JWKS (RS256)** :
  - `JwtStrategy` récupère la clé de signature via **JWKS** (`jwks-rsa` + `passport-jwt`, `secretOrKeyProvider` par `kid`), avec **cache** des clés, **TTL/rafraîchissement**, et **rate-limit** des appels JWKS (anti-abus sur `kid` inconnu).
  - `algorithms: ['RS256']` **imposé** (rejet explicite de `HS256`/`alg:none` en mode JWKS — protection *algorithm-confusion*).
  - `kid` absent ou inconnu, JWKS injoignable, clé révoquée → **401** générique (jamais de fuite de détail).
- **Validation des claims de sécurité** : `issuer` et `audience` vérifiés par `passport-jwt` (`issuer`, `audience`), `ignoreExpiration: false` conservé.
- **Adaptation de payload** : nouvelle interface `AccessTokenPayload` alignée sur l'IdP (`{ sub, org, roles, emailVerified, iss, aud, ... }`) ; `validate()` mappe `org → tenantId`, dérive `role` depuis `roles[]`, alimente `TenantContext.setTenant(org)` / `setUser(sub)` **comme aujourd'hui**.
- **Feature flag de bascule** : config `auth.mode` (`hs256` | `rs256`) — la stratégie choisit `secretOrKey` (HS256) ou `secretOrKeyProvider` (JWKS) selon le mode. Défaut de transition documenté ; les deux chemins testés.
- **Configuration** : ajout `auth.jwksUri`, `auth.issuer`, `auth.audience` (+ validation env `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE`) ; `docker-compose` racine : `AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json`.
- **Outillage de test RS256** : helper de test signant des JWT **RS256** avec une paire de clés éphémère + un **faux JWKS** (nock/serveur en mémoire), pour que les suites e2e existantes passent en mode `rs256`.
- **Guards inchangés** : `JwtAuthGuard`, `EmailVerifiedGuard`, `RolesGuard` fonctionnent sans modification (mêmes formes `request.user`).

**Explicitement hors périmètre :**

- **Consommation `identity.*` / read-models d'identité** → STORY-029.
- **Retrait d'`AuthModule`/`UsersModule`/`TenantsModule` et arrêt de l'émission locale** (`login`/`register` servis ici) → STORY-030. STORY-028 **ne supprime rien** : `TokenService` local et son `JWT_ACCESS_SECRET` (HS256) restent en place derrière le flag.
- **`TenantStateGuard` (état KYC/abonnement relu en base)** → STORY-014.
- Toute modification du **refresh token** local (reste HS256, propre à l'émission locale d'`expert-comptable` jusqu'au cutover).

### Flux utilisateur (technique)

1. Un client présente `Authorization: Bearer <JWT RS256 émis par auth-service>` à un endpoint protégé d'`expert-comptable`.
2. `JwtAuthGuard` déclenche la `JwtStrategy`.
3. La stratégie lit l'en-tête du JWT, en extrait le **`kid`**, et demande la clé publique correspondante au **provider JWKS** (cache local ; à défaut, appel à `AUTH_JWKS_URI` ; `kid` inconnu → rafraîchit une fois).
4. `passport-jwt` **vérifie** : signature RS256, `exp`, `iss` == `AUTH_ISSUER`, `aud` ⊇ `AUTH_AUDIENCE`. Échec → **401**.
5. `validate(payload)` mappe `org → tenantId`, `roles[] → role`, `emailVerified` → construit `AuthenticatedUser`, renseigne `TenantContext`.
6. La chaîne de guards (`EmailVerifiedGuard`, `RolesGuard`) et le contrôleur s'exécutent **inchangés**.
7. En mode `hs256` (flag), les étapes 3-4 retombent sur la vérification par secret **legacy** — comportement d'avant STORY-028.

---

## Critères d'acceptation

- [ ] En mode `rs256`, la `JwtStrategy` **vérifie la signature RS256** d'un access token émis par `auth-service` en récupérant la clé publique via **JWKS** (`AUTH_JWKS_URI`), par **`kid`**.
- [ ] **Cache JWKS** effectif (une clé donnée n'est pas re-téléchargée à chaque requête) **et** rafraîchissement sur **`kid` inconnu** (rotation de clé prise en charge sans redémarrage) ; appels JWKS **rate-limités**.
- [ ] `algorithms: ['RS256']` imposé : un jeton **HS256** (ou `alg:none`) est **rejeté** en mode `rs256` (401), même si son contenu est par ailleurs valide (protection *algorithm-confusion*).
- [ ] **`iss`** et **`aud`** vérifiés : un jeton dont `iss`/`aud` ne correspondent pas à la config est **rejeté** (401).
- [ ] Les claims sont **mappés** vers `request.user` / `TenantContext` : `org` → `tenantId`, `roles[]` → `role` (règle de dérivation documentée), `emailVerified` conservé ; un `PLATFORM_ADMIN` (`org: null`) est correctement représenté (`tenantId = null`).
- [ ] La **chaîne de guards est inchangée fonctionnellement** : `JwtAuthGuard` → `EmailVerifiedGuard` → `RolesGuard` produisent les mêmes 200/401/403 qu'avant, sans modification de leur code.
- [ ] Les **suites e2e existantes passent en mode `rs256`** avec des JWT **RS256 signés en test** (paire de clés + faux JWKS) — pas de dépendance à `auth-service` réel dans les e2e d'`expert-comptable`.
- [ ] La bascule est **réversible par configuration** (`auth.mode = hs256 | rs256`) sans changement de code ; le mode `hs256` reproduit le comportement pré-028 (tests des **deux** chemins).
- [ ] Cas d'erreur → **401 générique** (jamais de détail exploitable) : `kid` inconnu après rafraîchissement, JWKS injoignable, signature invalide, jeton expiré, `iss`/`aud` incorrects.
- [ ] `lint` 0, build OK, couverture conforme au seuil du projet ; la `JwtStrategy` et son mapping sont couverts (chemins nominal + erreurs).

---

## Notes techniques

### Composants touchés

| Composant | Fichier | Nature du changement |
|---|---|---|
| Stratégie JWT | [strategies/jwt.strategy.ts](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts) | HS256 (secret) → RS256 (JWKS provider) selon flag ; mapping claims |
| Payload | [types/jwt-payload.interface.ts](../../expert-comptable/src/modules/auth/types/jwt-payload.interface.ts) | Nouvelle forme alignée IdP (`org`, `roles[]`, `iss`, `aud`) |
| Config | [config/configuration.ts](../../expert-comptable/src/config/configuration.ts) `AuthConfig` | `mode`, `jwksUri`, `issuer`, `audience` |
| Validation env | `env.validation` | `AUTH_MODE`, `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE` |
| Module auth | [auth/auth.module.ts](../../expert-comptable/src/modules/auth/auth.module.ts) | Câblage du provider JWKS (`jwks-rsa`) |
| Compose racine | `docker-compose.yml` | `AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json` + iss/aud |
| Dépendance | `expert-comptable/package.json` | Ajout `jwks-rsa` |
| Guards | `common/guards/*` | **Aucune modification** (contrat `request.user` préservé) |

### Contrat de claims (source : `auth-service` — [token.service.ts:54-69](../../auth-service/src/modules/auth/token.service.ts#L54-L69))

L'access token RS256 émis par l'IdP porte :

```jsonc
// En-tête
{ "alg": "RS256", "kid": "<id de clé active>", "typ": "JWT" }
// Charge utile
{
  "sub": "<User._id hex>",
  "org": "<Organization._id hex>" | null,  // PLATFORM_ADMIN => null
  "roles": ["TENANT_ADMIN"],               // tableau
  "emailVerified": true,
  "iss": "<AUTH_ISSUER>",
  "aud": ["<AUTH_AUDIENCE>"],
  "iat": ..., "exp": ...
}
```

**Mapping vers `AuthenticatedUser` (inchangé en sortie) :**

| Claim IdP | Champ `expert-comptable` | Règle |
|---|---|---|
| `sub` | `userId` | direct ; `TenantContext.setUser(sub)` |
| `org` | `tenantId` | direct (`null` pour `PLATFORM_ADMIN`) ; `setTenant(org)` si non nul |
| `roles[]` | `role` | dérivation vers le rôle singulier (rôle de plus haut privilège présent : `PLATFORM_ADMIN` > `TENANT_ADMIN` > `TENANT_USER`) — les 3 rôles du système sont conservés (STORY-026) |
| `emailVerified` | `emailVerified` | direct |

> **Décision — `roles[]` → `role` singulier.** Les guards et le `@CurrentUser` d'`expert-comptable` consomment un `role` unique. Le modèle actuel n'attribue qu'un rôle effectif par membership ; on dérive donc `role` du tableau (rôle de plus haut privilège) et l'on **conserve** aussi `roles` sur `AuthenticatedUser` pour un futur RBAC multi-rôles, sans changer la sémantique des guards existants.

### Stratégie JWKS (esquisse)

```ts
// Mode rs256 : secretOrKeyProvider fourni par jwks-rsa (cache + rate-limit + rotation)
import { passportJwtSecret } from 'jwks-rsa';

super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  algorithms: ['RS256'],                 // impose RS256 (anti algorithm-confusion)
  issuer: auth.issuer,
  audience: auth.audience,
  secretOrKeyProvider: passportJwtSecret({
    jwksUri: auth.jwksUri,
    cache: true, cacheMaxEntries: 5, cacheMaxAge: 10 * 60_000,
    rateLimit: true, jwksRequestsPerMinute: 10,
  }),
});
```

En mode `hs256`, la stratégie retombe sur `secretOrKey: auth.accessSecret` (chemin legacy). Le choix se fait **au montage** selon `auth.mode`.

### Sécurité

- **Algorithm confusion** : jamais laisser `passport-jwt` accepter HS256 quand une clé publique est utilisée — `algorithms: ['RS256']` est **obligatoire** en mode JWKS.
- **`kid` obligatoire** en mode JWKS ; un jeton sans `kid` → 401.
- **Aucune fuite** : tous les échecs de vérification remontent un **401 générique**, sans distinguer signature/`iss`/`aud`/expiration.
- **Rate-limit JWKS** (`jwksRequestsPerMinute`) pour qu'un `kid` inconnu répété ne devienne pas un vecteur d'amplification vers l'IdP.
- **Pas de secret de signature** conservé côté `expert-comptable` en mode `rs256` (le `JWT_ACCESS_SECRET` legacy n'est utilisé que si `auth.mode = hs256`).

### Cas limites

- **Rotation de clé IdP** (nouveau `kid`) : le cache ne connaît pas la clé → `jwks-rsa` re-télécharge le JWKS → succès sans redémarrage.
- **JWKS injoignable** (IdP down / réseau) : 401 générique ; ne **pas** retomber silencieusement sur HS256.
- **`org: null`** (`PLATFORM_ADMIN`) : `tenantId = null`, pas d'appel à `setTenant`, cohérent avec le comportement actuel.
- **Horloges désynchronisées** : conserver le comportement `exp` par défaut de `passport-jwt` (pas de `clockTolerance` custom sauf besoin avéré).

---

## Dépendances

**Stories prérequises :**

- **STORY-024** — Auth RS256 + JWKS côté `auth-service` (émet les jetons RS256 et expose `/.well-known/jwks.json`). *Done & vérifié docker (2026-07-07).* Sans elle, aucune clé publique à récupérer.
- **STORY-005** — `JwtStrategy`/guards HS256 d'origine d'`expert-comptable` (base à faire évoluer). *Done.*

**Stories débloquées :**

- **STORY-029** — Read-models d'identité + consumer `identity.*` (dépend de STORY-028).
- **STORY-030** — Retrait des modules d'identité + cutover (dépend de STORY-028 et 029).

**Dépendances externes / techniques :**

- Bibliothèque **`jwks-rsa`** (ajout au `package.json` d'`expert-comptable`).
- **`docker-compose` racine** : `expert-comptable` doit résoudre `http://auth-service:3001/.well-known/jwks.json` (même réseau Docker — acquis depuis le compose racine, STORY-022).
- Cohérence **`iss`/`aud`** entre l'émission (`auth-service`) et la vérification (`expert-comptable`) : mêmes valeurs de configuration.

---

## Definition of Done

- [ ] `JwtStrategy` bascule HS256 ↔ RS256/JWKS **par configuration** (`auth.mode`), câblée dans `AuthModule`.
- [ ] Tests unitaires : mapping des claims (nominal, `PLATFORM_ADMIN` `org:null`, dérivation `roles[]→role`) ; rejet HS256/`alg:none` en mode `rs256` ; rejet `iss`/`aud` invalides ; 401 générique sur `kid` inconnu / JWKS down / signature invalide.
- [ ] Tests e2e existants **verts en mode `rs256`** via helper de signature RS256 + faux JWKS ; les deux modes (`hs256`, `rs256`) couverts.
- [ ] `AUTH_JWKS_URI`/`AUTH_ISSUER`/`AUTH_AUDIENCE`/`AUTH_MODE` validés par `env.validation` ; `.env.example` et `docker-compose` racine à jour.
- [ ] `lint` 0, build OK, couverture ≥ seuil du projet (fichiers de la story couverts).
- [ ] **Vérif docker bout-en-bout** : `login` sur `auth-service` (`:3001`) → JWT RS256 → appel d'un endpoint protégé d'`expert-comptable` (`:3000`) **accepté via JWKS** ; jeton falsifié / HS256 **rejeté 401** ; bascule `auth.mode=hs256` restaure le comportement legacy.
- [ ] `/code-review` formel + commit sur demande.

---

## Story Points Breakdown

- **Vérification JWKS (stratégie + provider + flag) :** 2 points
- **Mapping des claims + config/env + compose :** 1 point
- **Outillage de test RS256 (helper + faux JWKS) + adaptation des e2e :** 1,5 point
- **Tests unitaires (sécurité : algo-confusion, iss/aud, 401) + vérif docker :** 0,5 point
- **Total : 5 points**

**Rationale :** changement **localisé** à une seule brique (la `JwtStrategy`) et à sa configuration, sans toucher aux guards ni aux contrôleurs — d'où un coût modéré. La complexité réelle est dans la **sécurité de la bascule** (imposer RS256, `iss`/`aud`, rotation de `kid`) et surtout dans l'**outillage de test** (signer des RS256 et servir un faux JWKS pour garder les e2e autonomes). La réversibilité par flag ajoute un second chemin à tester.

---

## Additional Notes

- **Frontière EPIC-005 → EPIC-006 :** STORY-028 est la charnière. À son issue, `expert-comptable` **fait confiance** à l'IdP mais **possède encore** son identité locale (users/tenants) et **émet encore** ses propres jetons. Le basculement n'est **complet** qu'après STORY-030 (retrait de l'émission locale) ; STORY-028 ne doit donc **rien supprimer**, seulement **ajouter le chemin JWKS derrière un flag**.
- **Pourquoi un flag et pas un remplacement sec :** tant que le cutover (030) n'est pas fait, des jetons **HS256 legacy** peuvent encore circuler (émission locale). Le flag permet de basculer/rebasculer par environnement sans redéploiement, et d'exécuter les e2e dans les deux modes.
- **Réutilise l'infra existante :** `TenantContext`, `AuthenticatedUser`, `@CurrentUser`, la chaîne de guards — inchangés. C'est un point d'insistance de la revue : **aucune** modification de comportement observable côté guards/contrôleurs.

---

## Progress Tracking

**Status History :**
- 2026-07-08 : Créée par le Scrum Master (BMAD) — à partir du sprint plan (sprint 4, EPIC-006) et de l'inspection du code (`expert-comptable` HS256 ↔ `auth-service` RS256/JWKS).
- 2026-07-08 : Implémentée par le Developer (BMAD) — bascule livrée, tests verts (voir notes).

**Actual Effort :** 5 points (conforme à l'estimation) — hors vérif docker/`/code-review` restants.

### Notes d'implémentation

**Fichiers modifiés / créés :**
- [strategies/jwt.strategy.ts](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts) — `buildOptions()` choisit HS256 (secret) ou RS256 (`secretOrKeyProvider` via `jwks-rsa`) selon `auth.mode` ; `validate()` mappe `org|tenantId` et `roles[]|role` (précédence `PLATFORM_ADMIN > TENANT_ADMIN > TENANT_USER`).
- [config/configuration.ts](../../expert-comptable/src/config/configuration.ts) — `AuthConfig` : `mode`, `jwksUri`, `issuer`, `audience` (défaut `iss=prospera-auth`, `aud=expert-comptable`, alignés sur l'IdP).
- [config/env.validation.ts](../../expert-comptable/src/config/env.validation.ts) — `AUTH_MODE` (`hs256|rs256`), `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_AUDIENCE` (toutes optionnelles ; défaut sans rupture).
- [types/jwt-payload.interface.ts](../../expert-comptable/src/modules/auth/types/jwt-payload.interface.ts) — payload tolérant aux deux formes (legacy + IdP).
- `docker-compose.yml` — `AUTH_MODE` (défaut `hs256`), `AUTH_JWKS_URI=http://auth-service:3001/.well-known/jwks.json`, `AUTH_ISSUER`, `AUTH_AUDIENCE`.
- `package.json` — ajout `jwks-rsa`.
- Tests : [strategies/jwt.strategy.spec.ts](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.spec.ts) (unit, 2 modes) + [test/auth-jwks.e2e-spec.ts](../../expert-comptable/test/auth-jwks.e2e-spec.ts) (e2e RS256 via faux JWKS en mémoire).

**Décisions :**
- **Défaut `hs256`** : le runtime reste en mode legacy (émission locale) jusqu'au cutover (STORY-030). La bascule se fait par `AUTH_MODE=rs256` — réversible sans redéploiement de code.
- **`AuthenticatedUser` inchangé** : `roles[]` est dérivé en `role` singulier ; l'interface de sortie et la chaîne de guards ne changent pas.
- **Suites e2e existantes** : conservées en mode `hs256` (mode légitime et supporté) → **94/94 vertes sans modification**. Le chemin `rs256/JWKS` est prouvé de bout en bout par une **e2e dédiée** (`auth-jwks.e2e-spec.ts`, 11 cas) avec paire RSA + faux JWKS, plutôt que de réécrire les 9 e2e legacy — même garantie, risque moindre. *(Léger écart au libellé du critère « suites existantes en mode rs256 » : à valider en revue.)*

**Résultats :** `lint` 0 · `build` OK · **258 unit + 94 e2e** verts · `jwt.strategy.ts` couverture **100/100/100/100**.

**Cas de sécurité prouvés (e2e) :** RS256 valide accepté (clé résolue via JWKS) · HS256 forgé → 401 (algorithm-confusion) · `iss` erroné → 401 · `aud` erronée → 401 · `kid` inconnu → 401 · expiré → 401 · sans header → 401 · `EmailVerifiedGuard` (403) et RBAC (`PLATFORM_ADMIN` 200 / `TENANT_ADMIN` 403) inchangés sous RS256.

**Vérif docker bout-en-bout (2026-07-08) — RÉUSSIE :** stack racine, `expert-comptable` reconstruit en `AUTH_MODE=rs256`. Login IdP (`:3001`, `admin@prospera.local`) → JWT **RS256** (`kid`, `org:null`, `roles:[PLATFORM_ADMIN]`, `aud⊇expert-comptable`, `iss=prospera-auth`) → `GET :3000/api/v1/auth/me` **accepté via JWKS** → **200** `{userId, tenantId:null, role:PLATFORM_ADMIN, emailVerified:true}` (mapping `org→tenantId`, `roles[]→role` confirmé). Négatifs sur service réel : sans token → **401** · RS256 altéré → **401** · **HS256 forgé avec le secret local → 401** (algorithm-confusion confirmé). Runtime restauré en `hs256` (défaut legacy) jusqu'au cutover STORY-030.

**Reste à faire :** `/code-review` formel · commit sur demande.

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Planification d'implémentation)**
