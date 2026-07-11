# Architecture Système : Micro-service AuthService (IdP)

**Date :** 2026-07-04
**Architecte :** vivian
**Version :** 1.1
**Type de projet :** API (micro-service NestJS)
**Statut :** Draft
**Écosystème :** PROSPERA

> **Révision 1.1 (2026-07-07) — alignement sur l'architecture programme v1.1 (P7/P8).** L'**entitlement** (quels produits/versions une org consomme) passe de « chaque vertical » à **`catalog-service`** ; le **dashboard admin agrégé (FR-012)**, laissé « point ouvert » en v1.0, est **tranché** → **`admin-panel` (BFF)**. `auth-service` reste inchangé sur le fond (identité only, A3 préservé) : ces annotations ne font que refléter la source de vérité `docs/architecture-prospera-ecosystem-2026-07-04.md`.

---

## Vue d'ensemble du document

`auth-service` est le **fournisseur d'identité** (Identity Provider) de l'écosystème PROSPERA : l'autorité unique des **utilisateurs**, des **organisations** clientes, de leur **appartenance** (memberships/rôles), et l'**émetteur des jetons** consommés par tous les autres services. C'est la **racine** du graphe de dépendances : `expert-comptable`, `kyc-service` et les futurs verticaux en sont des *relying parties*.

Ce document est **subordonné à l'architecture programme** (`docs/architecture-prospera-ecosystem-2026-07-04.md`, source de vérité de la topologie, du modèle de jetons et du transport d'événements) et en est la **déclinaison détaillée** pour le service d'identité. Il est la **source de vérité des schémas d'identité et du contrat d'événements `identity.*`**.

**Documents liés :**
- **Architecture programme (parent) : `docs/architecture-prospera-ecosystem-2026-07-04.md`**
- Relying parties : `docs/architecture-expert-comptable-2026-07-02.md`, `docs/architecture-kyc-service-2026-07-03.md`
- Origine du code : l'essentiel de l'implémentation provient d'`expert-comptable` (EPIC-001 + gestion users d'EPIC-002), à re-héberger — voir § Migration.

---

## Résumé exécutif

`auth-service` est un micro-service **NestJS + MongoDB (base dédiée `auth_service`)** qui possède l'identité de bout en bout : inscription d'une organisation et de son administrateur, authentification (login / refresh rotatif / logout), vérification d'e-mail, invitations de collaborateurs, gestion des utilisateurs et des rôles, et **émission de JWT signés en RS256** avec exposition d'un **JWKS** public. Il **n'émet aucun jugement métier** (KYC, abonnement, accès aux modules) : ces états appartiennent aux services consommateurs.

Les autres services ne l'interrogent **jamais sur le chemin chaud** : ils valident les JWT localement via la clé publique JWKS (cachée) et répliquent l'identité dont ils ont besoin via les **événements `identity.*`** (Kafka). `auth-service` envoie les e-mails d'identité (vérification, invitation) via sa **file interne** BullMQ/Redis.

---

## Périmètre

### Dans le périmètre (possédé par auth-service)

- **Utilisateurs** : identité, credentials (bcrypt), statut, e-mail vérifié, refresh token (hash), dernière connexion.
- **Organisations** (ex-`Tenant`) : identité de l'entité cliente — raison sociale, slug, pays, statut. Partagée entre verticaux.
- **Memberships** : relation `user ↔ organization ↔ rôle ↔ statut`.
- **Authentification** : register, login, refresh rotatif (détection de réutilisation), logout.
- **Vérification e-mail** et **invitations** (tokens à usage unique).
- **Émission de jetons** : access token **RS256**, refresh token, **JWKS** public, rotation de clés (`kid`).
- **RBAC** : rôles plateforme et org-scopés ; seed du `PLATFORM_ADMIN`.
- **Événements `identity.*`** (producteur).

### Hors périmètre (chez les consommateurs)

- Statut **KYC** → `kyc-service`. Abonnement/**billing** + `TenantStateGuard` → chaque vertical. Données métier d'une **capacité partagée** (ex. Bilan) → **`bilan-service`** (P7).
- **Entitlement** (quels produits/versions une org consomme) → **`catalog-service`** — *tranché par **P8*** (remplace l'ancien « chaque vertical via sa souscription » ; l'abonnement/**paiement** reste, lui, au vertical).
- **Dashboard admin agrégé** (FR-012 : croise identité + KYC + abonnement/entitlement) → *tranché : **`admin-panel` (BFF)** l'agrège* (**P8**). `auth-service` n'en fournit que la **tranche identité** (liste/détail/suspension d'organisations et d'utilisateurs).

---

## Drivers architecturaux

1. **Racine de confiance de l'écosystème** → clés de signature, credentials et identité centralisés et fortement protégés.
2. **Validation sans couplage** → jetons **RS256/JWKS** : les relying parties valident hors-ligne, sans secret partagé ni appel réseau.
3. **Identité partagée entre verticaux** → modèle `Organization` + `Membership` réutilisable par plusieurs produits.
4. **Autonomie des consommateurs** → propagation par événements `identity.*` (read-models), cohérence éventuelle assumée.
5. **Sécurité (NFR-001)** → bcrypt cost 12, refresh rotatif révocable, anti-énumération, rate limiting, secrets/clefs validés au boot.

---

## Architecture des données (base `auth_service`)

### `Organization` (ex-`Tenant`)

```typescript
@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true }) name: string;            // raison sociale
  @Prop({ required: true, unique: true, lowercase: true }) slug: string;
  @Prop() phone?: string;
  @Prop({ required: true, default: 'TG' }) country: string;      // ISO 3166-1
  @Prop() address?: string;
  @Prop({ type: String, enum: OrganizationStatus, default: OrganizationStatus.ACTIVE })
  status: OrganizationStatus;                                    // ACTIVE | SUSPENDED
  @Prop({ type: Types.ObjectId, ref: 'User' }) createdBy: Types.ObjectId;
}
// index : { slug: 1 } unique
```

> **Note :** l'identifiant d'organisation est l'**`orgId`** transporté par le JWT (claim `org`) et utilisé comme **clé d'isolation `tenantId`** dans les verticaux et comme **clé de partition Kafka**. On conserve le mot `tenantId` dans la mécanique d'isolation ; `Organization`/`orgId` est le concept d'identité.

### `User`

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string; // unique global
  @Prop() passwordHash?: string;                                 // absent tant que l'invitation n'est pas acceptée
  @Prop({ required: true }) firstName: string;
  @Prop({ required: true }) lastName: string;
  @Prop({ type: String, enum: UserStatus, default: UserStatus.INVITED })
  status: UserStatus;                                            // INVITED | ACTIVE | SUSPENDED
  @Prop() emailVerifiedAt?: Date;
  @Prop() emailVerificationTokenHash?: string;                   // sha256
  @Prop() emailVerificationExpiresAt?: Date;
  @Prop() refreshTokenHash?: string;                             // rotation à chaque refresh
  @Prop() lastLoginAt?: Date;
}
// index : { email: 1 } unique
```

L'utilisateur n'embarque plus `tenantId`/`role` : le rattachement à une organisation passe par `Membership` (normalisation, cf. § Migration).

### `Membership` (nouveau — user ↔ org ↔ rôle)

```typescript
@Schema({ timestamps: true })
export class Membership {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true }) organizationId: Types.ObjectId;
  @Prop({ type: String, enum: Role, required: true }) role: Role; // TENANT_ADMIN | TENANT_USER
  @Prop({ type: String, enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;                                       // ACTIVE | SUSPENDED
}
// index : { userId: 1, organizationId: 1 } unique ; { organizationId: 1, role: 1 } (garde-fou dernier admin)
```

**Rôles (`Role`) :** `PLATFORM_ADMIN` (opérateur plateforme, **sans organisation**, seedé — jamais via l'API), `TENANT_ADMIN` (administrateur d'une organisation), `TENANT_USER` (collaborateur). *Noms conservés depuis l'implémentation actuelle pour éviter un rename ; `TENANT_*` = rôle org-scopé.*

**Phase 1 :** un utilisateur a **exactement un** membership actif (hypothèse « un e-mail = un utilisateur = une organisation » du PRD). Le modèle `Membership` (n:m) est retenu dès maintenant pour ne pas fermer la porte au multi-organisation, mais aucun parcours multi-org n'est exposé en phase 1 (pas de sélecteur d'org au login).

### `SigningKey` (clés RS256)

```typescript
@Schema({ timestamps: true })
export class SigningKey {
  @Prop({ required: true, unique: true }) kid: string;           // identifiant de clé (header JWT + JWKS)
  @Prop({ required: true }) publicJwk: Record<string, unknown>;  // clé publique (exposée via JWKS)
  @Prop({ required: true }) privatePem: string;                  // clé privée (chiffrée au repos / secret manager en prod)
  @Prop({ type: String, enum: KeyStatus, default: KeyStatus.ACTIVE })
  status: KeyStatus;                                             // ACTIVE (signe) | RETIRING (valide encore) | REVOKED
}
// index : { kid: 1 } unique ; { status: 1 }
```

> En développement, la clé peut être fournie par variable d'environnement (paire PEM) et amorcée au boot. En production, la clé privée vit dans un **secret manager** ; la rotation ajoute une nouvelle clé `ACTIVE` et fait passer l'ancienne en `RETIRING` (encore publiée dans le JWKS le temps que les jetons émis expirent).

Les tokens d'**invitation** réutilisent le mécanisme existant (`InvitationService`, token à usage unique, hash + TTL) — stockés sur le `User` invité ou une petite collection dédiée selon l'implémentation actuelle migrée.

---

## Conception de l'API

### Endpoints

```
### Auth (public)
POST   /api/v1/auth/register              Créer Organization + User TENANT_ADMIN (atomique) → e-mail de vérification
POST   /api/v1/auth/login                 → { accessToken (RS256, 15 min), refreshToken (7 j) }
POST   /api/v1/auth/refresh               Rotation du refresh (détection de réutilisation)
POST   /api/v1/auth/logout                Révoque le refresh courant
GET    /api/v1/auth/verify-email?token=   Valide l'adresse e-mail (usage unique, TTL 24 h)
POST   /api/v1/auth/resend-verification   Renvoi (rate-limité 3/h/utilisateur)
POST   /api/v1/auth/accept-invitation     L'invité définit son mot de passe → session ouverte

### Découverte des clés (public)
GET    /.well-known/jwks.json             Clés publiques de vérification (rotation par kid)

### Utilisateurs & organisation (auth ; e-mail vérifié)
GET    /api/v1/users/me                   Profil de l'utilisateur courant + membership (org, rôle)
GET    /api/v1/organizations/me           Profil de l'organisation courante
PATCH  /api/v1/organizations/me           MAJ profil                              [TENANT_ADMIN]
GET    /api/v1/users                      Liste paginée des membres de l'org      [TENANT_ADMIN]
POST   /api/v1/users                      Inviter un utilisateur                  [TENANT_ADMIN]
PATCH  /api/v1/users/:id                  Rôle / suspension / réactivation        [TENANT_ADMIN]
DELETE /api/v1/users/:id                  Suppression (soft)                      [TENANT_ADMIN]
POST   /api/v1/users/:id/resend-invitation                                        [TENANT_ADMIN]

### Admin plateforme (auth ; PLATFORM_ADMIN)
GET    /api/v1/admin/organizations        Liste/recherche des organisations (identité + statut)
GET    /api/v1/admin/organizations/:id    Détail identité d'une organisation + ses membres
POST   /api/v1/admin/organizations/:id/suspend   Suspend l'org (coupe l'accès partout via événement)

GET    /api/v1/health                     Health check (public)
```

> Garde-fous conservés de l'implémentation actuelle : e-mail unique global, anti-énumération (messages génériques, 401 générique au login), impossible de supprimer/rétrograder le **dernier `TENANT_ADMIN` actif** d'une organisation, `PLATFORM_ADMIN` non créable via l'API.

### Chaîne de guards

`auth-service` **émet** les jetons ; il valide aussi les siens pour les endpoints authentifiés (users/org/admin) — via la **clé publique locale** (pas d'appel externe). Chaîne identique à l'écosystème : Throttler → JwtAuth (RS256) → EmailVerified → Roles. Les endpoints `/auth/*` et `/.well-known/jwks.json` sont `@Public`.

---

## Modèle de jetons (RS256 / JWKS) — détail

- **Signature :** RS256, clé privée `ACTIVE` ; header JWT porte le `kid`.
- **JWKS :** `GET /.well-known/jwks.json` publie les clés `ACTIVE` + `RETIRING` (les relying parties cachent le JWKS et le rafraîchissent périodiquement / sur `kid` inconnu).
- **Claims access token :**
  ```json
  {
    "iss": "prospera-auth",
    "aud": ["expert-comptable", "kyc-service", "..."],
    "sub": "<userId>",
    "org": "<orgId>",
    "roles": ["TENANT_ADMIN"],
    "emailVerified": true,
    "iat": 0, "exp": 0
  }
  ```
  `roles` est un tableau (une seule valeur en phase 1). `org` = `null` pour un `PLATFORM_ADMIN`.
- **Refresh token :** opaque signé, rotation à chaque usage, **hash** stocké sur le `User`, détection de réutilisation (réutilisation d'un refresh consommé ⇒ invalidation de session). **Ne quitte jamais l'IdP.** Mécanique reprise telle quelle de `TokenService`/`AuthService` actuels.
- **Ce que le token ne porte jamais :** statut KYC, abonnement, entitlement (relus dans les read-models locaux des verticaux).

---

## Contrat d'événements `identity.*` (v1) — source de vérité

> Transport : **Apache Kafka** (voir architecture programme). Patron commun : état absolu, `eventId` (idempotence), `schemaVersion`, publication après persistance (cible : transactional outbox), consommateur idempotent. Clé de partition = `orgId` quand pertinent.

| Topic | Déclencheur | Payload (clés) |
|---|---|---|
| `identity.org.created` | création d'organisation (register) | `orgId, name, slug, country, status, createdByUserId, occurredAt` |
| `identity.org.updated` | MAJ profil / suspension d'org | `orgId, name?, status, occurredAt` |
| `identity.user.registered` | création d'un utilisateur (register/invite accepté) | `userId, email, firstName, lastName, status, occurredAt` |
| `identity.membership.changed` | ajout/rôle/suspension d'un membre | `userId, orgId, role, status, occurredAt` |
| `identity.user.suspended` | suspension d'un utilisateur | `userId, status, occurredAt` |

**Usage côté relying parties :** bâtir/mettre à jour le **read-model d'identité** (org, user, rôles) et **provisionner** la part métier d'une organisation quand elle commence à consommer le vertical. La suspension d'org/user coupe l'accès dans chaque vertical (via le read-model), en complément de l'expiration naturelle des JWT.

```typescript
export interface IdentityOrgCreatedV1 {
  schemaVersion: 1; eventId: string; occurredAt: string;
  orgId: string; name: string; slug: string; country: string;
  status: 'ACTIVE' | 'SUSPENDED'; createdByUserId: string;
}
export interface IdentityMembershipChangedV1 {
  schemaVersion: 1; eventId: string; occurredAt: string;
  userId: string; orgId: string; role: Role; status: 'ACTIVE' | 'SUSPENDED';
}
// … idem pour user.registered / org.updated / user.suspended
```

---

## Migration depuis `expert-comptable`

L'essentiel du code existe déjà dans `expert-comptable` et sera **re-hébergé** (pas réécrit) :

| Source (`expert-comptable`) | Devient (`auth-service`) |
|---|---|
| `modules/auth/*` (AuthService, TokenService, stratégies, DTO) | cœur d'`auth-service` ; **TokenService passe HS256 → RS256** + JWKS |
| `modules/users/*` (CRUD, InvitationService) | gestion users + memberships |
| `modules/tenants/*` (schéma `Tenant`, slug unique) | schéma `Organization` (rename conceptuel, clé `orgId`) |
| `common/security/password.service` | inchangé |
| seed `PLATFORM_ADMIN` | inchangé |
| templates e-mail vérification/invitation | déplacés (les e-mails **d'identité** vivent ici) |

**Normalisation :** `User.tenantId + User.role` (dénormalisés aujourd'hui) → collection `Membership`. Migration des données : pour chaque user existant, créer un membership `{ userId, organizationId: ancien tenantId, role, status }`.

**Refactor des relying parties :** `expert-comptable` (et `kyc-service`) **cessent d'émettre** des jetons ; ils valident via JWKS et consomment `identity.*` pour leur read-model d'identité. `expert-comptable` **conserve** un read-model d'organisation/utilisateur/rôles (nécessaire à ses écrans et à la résolution des destinataires d'e-mails métier). Voir `architecture-expert-comptable` révision 1.2.

**Transition :** tant qu'`auth-service` n'est pas déployé, `expert-comptable` reste l'émetteur HS256 (le socle de validation bascule HS256 → RS256/JWKS par configuration, sans réécriture).

---

## Couverture des exigences

| FR | Exigence | Composant auth-service |
|----|----------|------------------------|
| FR-001 | Création organisation + admin | AuthService.register, Organization, Membership |
| FR-002 | Vérification e-mail | EmailVerification + file interne mail |
| FR-003 | Auth login/refresh/logout | AuthService, TokenService (RS256) |
| FR-004 | Gestion des utilisateurs du compte | Users + Membership + invitations |
| FR-012 (partiel) | Volet identité du dashboard admin | Admin organizations (identité, suspension) |

| NFR | Solution |
|-----|----------|
| NFR-001 Sécurité | bcrypt 12 ; RS256 + rotation `kid` ; refresh rotatif révocable ; throttler (login 5/min, resend 3/h) ; anti-énumération ; clés/secret validés au boot |
| NFR-002 Isolation | endpoints org-scopés filtrés par `orgId` du membership ; anti-énumération (404) |
| NFR-005 Observabilité | logs pino (`requestId`) ; événements `identity.*` traçables (`eventId`) |
| NFR-006 Docs + tests | Swagger `/api/docs` ; seuils Jest 65/90/90/90 ; e2e par service + e2e cross-service |

---

## Journal de décisions

**A1 — `Membership` normalisé (vs `tenantId`+`role` sur `User`)**
✓ Modèle IdP correct ; supporte plusieurs membres par org (invitations, déjà le cas) et l'évolution multi-org. ✗ Une jointure/lecture de plus. *Phase 1 : un membership actif par user ; aucun parcours multi-org exposé.*

**A2 — Clés RS256 en base (`SigningKey`) + JWKS (vs secret HS256 en env)**
✓ Rotation par `kid` ; clé publique distribuable ; aucun secret de signature chez les consommateurs. ✗ Gestion du cycle de vie des clés. *Clé privée en secret manager en prod ; PEM d'env en dev.*

**A3 — `auth-service` n'émet aucun état métier**
✓ Frontière nette : identité ≠ KYC ≠ abonnement ≠ entitlement. ✗ Le dashboard admin agrégé doit croiser plusieurs services. *FR-012 agrégé = **tranché** : `admin-panel` (BFF) le compose (P8) ; auth-service ne fournit que la tranche identité.*

**A4 — Re-héberger (vs réécrire) le code d'auth existant**
✓ Réutilise du code éprouvé et testé ; risque minimal. ✗ Migration de données (memberships) + bascule des relying parties. *L'essentiel = déplacement + passage RS256 + événements.*

---

## Risques & points ouverts

1. **Migration de données** (Users/Tenants → Users/Organizations/Memberships) : script idempotent, à valider sur copie avant bascule.
2. **Bascule des relying parties** HS256 → RS256/JWKS : fenêtre de transition à orchestrer (déployer auth-service, publier JWKS, basculer la config des verticaux). *Jetons existants HS256 expirent en ≤ 15 min → bascule courte.*
3. **Gestion des clés RS256** (stockage privé, rotation, `kid`) : nouveau pour l'équipe ; secret manager requis en prod.
4. **FR-012 dashboard agrégé** : **tranché (2026-07-07)** → `admin-panel` (BFF) agrège identité + KYC + entitlements ; l'entitlement appartient à `catalog-service` (P8).
5. **Multi-organisation** (un user dans plusieurs orgs) : hors phase 1 ; le modèle `Membership` le permet, mais login/sélecteur d'org à concevoir le moment venu.
6. Contraintes conservées : tout en français, démarrage `docker compose` racine, anti-énumération, lint 0 warning, couverture 65/90/90/90, commits uniquement sur demande.

---

## Historique des révisions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2026-07-04 | vivian | Architecture initiale d'`auth-service` (IdP) : modèle User/Organization/Membership, endpoints, jetons RS256/JWKS, contrat `identity.*`, plan de migration depuis expert-comptable |
| 1.1 | 2026-07-07 | vivian | Alignement architecture programme v1.1 (P7/P8) : entitlement → `catalog-service` (et non « chaque vertical ») ; FR-012 dashboard agrégé **tranché** → `admin-panel` (BFF). Périmètre d'`auth-service` inchangé (identité only, A3 préservé). |

---

**Document créé avec BMAD Method v6 — Phase 3 (Solutioning)**
*Prochaine étape : `/bmad:sprint-planning` — créer l'EPIC `auth-service` (extraction racine), ré-estimer et ré-ordonner les sprints (auth-service → kyc-service rebasé → FedaPay).*
