# STORY-123 : Profil self-service du membre — `PATCH /users/me` (identité + téléphone) + changement de mot de passe + événement `identity.user.updated`

**Epic :** EPIC-005 — Identité & comptes (auth-service) — *epic CLOS au sprint 4 ; story **additive** de surface self-service, hors décompte d'epic (précédent : STORY-108)*
**Service :** `auth-service` (IdP, :3001, base `auth_service`)
**Réf. architecture :** `docs/architecture-auth-service-2026-07-04.md` §Contrat d'événements (`identity.*`, état absolu + outbox transactionnel), §NFR-001 (bcrypt cost 12)
**Réf. code livré :** **STORY-023** (modèle `Organization` + `OrganizationsService.updateProfileAndEmit`, **patron exact à rejouer côté `User`**) · **STORY-026** (`UsersController` : `GET /users/me`, `PATCH /users/:id`, `MeResponseDto`) · **STORY-027** (outbox `identity.*`) · **STORY-024/025** (login/refresh/logout, `refreshTokenHash`, vérification d'e-mail) · `common/security/password.service.ts` (bcrypt cost 12)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-22
**Terminée :** 2026-07-22
**Sprint :** 16

---

## User Story

**En tant que** collaborateur ou administrateur d'un cabinet (`TENANT_USER` / `TENANT_ADMIN`),
**je veux** corriger **mes propres** informations personnelles — prénom, nom, numéro de téléphone — et **changer mon mot de passe** sans passer par un administrateur,
**afin de** ne pas rester prisonnier d'une faute de frappe faite à l'inscription ou par celui qui m'a invité, et de pouvoir renouveler un secret que je crois compromis.

---

## Description

### Contexte — un écart trouvé par le frontend, pas par le backend

L'écart a été **remonté par FE-015** (« Mon profil ») le 2026-07-22 : la maquette de l'écran personnel est
**en lecture seule**, avec ce commentaire dans le prototype —
> *« L'IdP n'expose que `GET /users/me` — aucun `PATCH` : cet écran est en lecture seule tant que le backend
> ne fournit pas de route d'édition de son propre profil. »*

Vérification faite **dans le code** (`auth-service/src/modules/users/users.controller.ts`, `origin/dev`) :

| Route existante | Rôle exigé | Ce qu'elle permet |
|---|---|---|
| `GET /users/me` | authentifié | **lire** son profil (+ son org) |
| `PATCH /users/:id` | `TENANT_ADMIN` | modifier le **rôle** et le **statut** d'un *autre* membre |
| `GET /organizations/me` · `PATCH /organizations/me` | authentifié · `TENANT_ADMIN` | le cabinet, **déjà couvert** |

⇒ **Aucune route ne permet à un membre d'agir sur son propre compte.** Un `TENANT_USER` dont le prénom a été
mal saisi dans l'invitation ne peut rien faire ; un `TENANT_ADMIN` non plus (`PATCH /users/:id` ne touche que
`role`/`status`, jamais l'identité). Et **personne**, aucun rôle, ne peut changer un mot de passe : il n'existe
ni `POST /auth/forgot-password`, ni `POST /auth/reset-password`, ni route de changement authentifié
(`auth.controller.ts` = `register|login|refresh|logout|verify-email|resend-verification|accept-invitation`).

Ce n'est pas un oubli d'implémentation : c'est un **report explicite**, tracé deux fois —
- **STORY-009** § *Hors périmètre* : « Modification de profil par l'utilisateur lui-même (self-service `PATCH /users/me`) — non planifié ; STORY-009 couvre l'**administration** par le `TENANT_ADMIN`. »
- **STORY-026** § *Hors périmètre* : « Changement de mot de passe / profil self-service (`PATCH /users/me`, changement d'e-mail) : hors périmètre EPIC-005 (n'existe pas dans EC à ce stade). **Différé.** »

**STORY-123 lève ce différé.** Elle ne réinvente rien : elle **rejoue sur `User` le patron déjà livré sur
`Organization` par STORY-023** — un `PATCH /me` gardé, une DTO de mise à jour whitelistée, une écriture, un
événement `identity.*` en outbox transactionnel.

### La symétrie qui manquait

Après cette story, la surface d'auto-administration est **complète et symétrique** :

```
Le cabinet     → PATCH /organizations/me   (TENANT_ADMIN)   ✅ livré (STORY-023)
Mon identité   → PATCH /users/me           (tout membre)     ← STORY-123
Mon secret     → POST  /users/me/password  (tout membre)     ← STORY-123
Mon e-mail     → POST  /users/me/email     (tout membre)     ← STORY-124 (vérification requise)
```

L'e-mail est **délibérément sorti** de cette story : il est l'**identifiant de connexion** (index unique,
`emailVerifiedAt`, anti-énumération, invalidation de sessions) et exige un aller-retour de vérification sur la
**nouvelle** adresse. Le mélanger ici produirait une story de 8+ points dont la moitié du risque est ailleurs.
→ **STORY-124**.

### Le champ `phone` n'existe pas sur `User`

`Organization` porte `phone?` (schéma STORY-023) ; **`User` ne le porte pas** (`user.schema.ts` : `email`,
`passwordHash`, `firstName`, `lastName`, `status`, tokens, `platformRole`, `deletedAt`). Le numéro demandé par
le PO est donc un **ajout de champ**, pas l'exposition d'un champ caché. Additif, optionnel, sans migration
(les documents existants restent valides).

---

## Scope

**Dans le périmètre :**

- **Schéma** : `User.phone?: string` (`@Prop()` optionnel, trim) — additif, aucune migration.
- **`PATCH /api/v1/users/me`** (authentifié, **tout membre**, aucun `@Roles`) : `UpdateMyProfileDto`
  { `firstName?`, `lastName?`, `phone?` } — whitelist `class-validator` active ⇒ tout autre champ ⇒ **400**.
  Renvoie le `MeResponseDto` **à jour** (même forme que `GET /users/me`, pour que le front réutilise le type généré).
- **`POST /api/v1/users/me/password`** (authentifié, tout membre) : `ChangePasswordDto`
  { `currentPassword`, `newPassword` } → vérification bcrypt de l'actuel, re-hash du nouveau (cost 12,
  `PasswordService`), **révocation du `refreshTokenHash`** (les sessions ouvertes ne peuvent plus se rafraîchir),
  **204**. Actuel faux ⇒ **401** ; nouveau identique à l'actuel ⇒ **400**.
- **`MeResponseDto` + `UserResponseDto`** : exposition de `phone` (additive, `phone?: string`).
- **Événement `identity.user.updated`** (v1, **état absolu**, via l'**outbox transactionnel** existant) :
  nouveau membre `IdentityTopic.USER_UPDATED` + interface `IdentityUserUpdatedV1`
  { `userId`, `email`, `firstName`, `lastName`, `status` } — même payload que `identity.user.registered`,
  **sans aucun secret** (jamais `passwordHash`, jamais `phone` tant qu'aucun read-model n'en a besoin).
- **Consommation côté relying party** : `expert-comptable` projette déjà `identity.user.registered` dans
  `IdentityUserReadModel` (`identity-projection.service.ts`) ⇒ **abonner et projeter `identity.user.updated`**
  (même handler, écriture absolue idempotente par `eventId`), sinon les read-models affichent éternellement le
  nom de l'inscription.
- **Throttling** : `@Throttle` serré sur le changement de mot de passe (patron `auth.controller.ts` : `5/60s`).

**Hors périmètre (NE PAS déborder) :**

- **Changement d'e-mail** → **STORY-124** (vérification de la nouvelle adresse, unicité, sessions).
- **Mot de passe oublié** (`forgot-password` / `reset-password`, non authentifié) : surface **différente**
  (anti-énumération, token public, e-mail, routage du lien vers la bonne app) → **STORY-125**, créée le
  2026-07-22 sur demande du PO, **Must Have**, même sprint.
- **MFA / historique de mots de passe / politique d'expiration** : rien de tel n'existe dans l'IdP aujourd'hui,
  ne pas l'introduire ici.
- **Édition par l'admin de l'identité d'un autre membre** (`PATCH /users/:id` reste `role`+`status` seuls) :
  le PO n'a demandé que le self-service ; l'élargir ouvrirait la question de l'usurpation.
- **Photo de profil / avatar** : aucun stockage d'objet côté IdP (MinIO est au KYC).
- **Frontend** → **FE-019**.

---

## User Flow

1. Kossi (`TENANT_USER`, invité par son admin qui a tapé « Kosi ») ouvre **Mon profil** dans l'app cliente.
2. Il corrige son prénom et saisit son numéro → `PATCH /api/v1/users/me { firstName, phone }` → **200** avec le
   profil à jour ; la sidebar et le menu utilisateur (retrofités par FE-015) affichent immédiatement la bonne valeur.
3. En base : `users` mis à jour **et** `outbox_events` reçoit `identity.user.updated` **dans la même transaction**.
   Le relais publie ; `expert-comptable` met son read-model à jour → l'admin voit « Kossi » partout, sans intervention.
4. Kossi soupçonne son mot de passe compromis : il saisit l'actuel + le nouveau →
   `POST /api/v1/users/me/password` → **204**. Son `refreshTokenHash` est effacé : la session ouverte sur le poste
   partagé du cabinet ne pourra plus se rafraîchir et retombera sur `/login`.
5. Il se trompe de mot de passe actuel → **401**, message générique, compteur de throttle décrémenté.
6. Le front envoie `{ role: 'TENANT_ADMIN' }` dans le `PATCH` (tentative d'escalade) → **400** (whitelist) —
   le rôle n'est **jamais** une donnée de profil.

---

## Acceptance Criteria

- [ ] **AC-01 — `PATCH /users/me` existe et est ouvert à tout membre authentifié** : un `TENANT_USER` modifie son
      `firstName`/`lastName`/`phone` → **200**, corps = `MeResponseDto` à jour, persisté en base.
- [ ] **AC-02 — ⚠️ Ordre de déclaration des routes** : `@Patch('me')` est déclaré **AVANT** `@Patch(':id')` dans
      `UsersController`. Sans cela Nest apparie `/users/me` sur `:id` (id = `"me"`) et le `@Roles(TENANT_ADMIN)`
      de `updateMember` **403-erait un `TENANT_USER`** — bug silencieux à l'exécution, invisible à la compilation.
      **Test dédié** : un `TENANT_USER` appelle `PATCH /users/me` → **200** (jamais 403, jamais 404).
- [ ] **AC-03 — Whitelist** : `PATCH /users/me { role }`, `{ status }`, `{ email }` ou `{ id }` → **400**
      (`forbidNonWhitelisted`). Aucune escalade de privilège possible par le corps de la requête.
- [ ] **AC-04 — Isolation** : l'utilisateur modifié est **toujours** celui du JWT (`@CurrentUser().userId`) ;
      aucun identifiant du corps ni de l'URL n'est lu. Aucun moyen d'écrire sur le profil d'autrui.
- [ ] **AC-05 — `phone` bout en bout** : le champ est persisté, renvoyé par `GET /users/me` **et** par
      `PATCH /users/me` ; absent (`undefined`) sur les comptes créés avant la story (aucune régression).
- [ ] **AC-06 — Changement de mot de passe nominal** : `POST /users/me/password` avec l'actuel correct →
      **204** ; le nouveau hash est bien un bcrypt cost 12 ; **login avec l'ancien → 401**, **login avec le nouveau → 200**.
- [ ] **AC-07 — Mot de passe actuel faux → 401** (message générique, jamais « mot de passe actuel incorrect »
      versus autre chose qui distinguerait les cas) ; **aucune** écriture en base.
- [ ] **AC-08 — Nouveau == actuel → 400** ; nouveau ne respectant pas la politique d'inscription (même
      contrainte que `RegisterDto`, **relue dans le code**, jamais réinventée) → **400**.
- [ ] **AC-09 — Révocation des sessions** : après un changement réussi, `refreshTokenHash` est effacé ⇒
      `POST /auth/refresh` avec le refresh token émis **avant** le changement → **401**.
- [ ] **AC-10 — Événement `identity.user.updated`** : chaque `PATCH /users/me` qui modifie effectivement quelque
      chose écrit **une** ligne d'outbox **dans la même transaction Mongo** que la mise à jour (rollback ⇒ ni l'un
      ni l'autre) ; payload = **état absolu** { schemaVersion:1, eventId, occurredAt, userId, email, firstName,
      lastName, status } ; **aucun secret, aucun token**. Un changement de mot de passe **n'émet pas** cet
      événement (rien d'observable n'a changé pour les read-models).
- [ ] **AC-11 — Projection côté relying party** : `expert-comptable` consomme `identity.user.updated` et met son
      `IdentityUserReadModel` à jour (écriture absolue, idempotente par `eventId` — rejeu = même état).
- [ ] **AC-12 — Throttle** : `POST /users/me/password` est limité (patron `auth.controller.ts`) ; au-delà → **429**.
- [ ] **AC-13 — Sans jeton → 401** sur les deux routes ; jeton d'une autre org → agit sur **son** compte à lui,
      jamais sur celui d'un tiers.
- [ ] **AC-14 — Non-régression** : `GET /users/me`, `GET /users`, `PATCH /users/:id`, `DELETE /users/:id`,
      `POST /users/:id/resend-invitation`, `GET|PATCH /organizations/me` **inchangés** (contrats et statuts).

---

## Technical Notes

### Composants

- **Étendu** : `src/modules/users/schemas/user.schema.ts` (`phone?`) · `src/modules/users/users.controller.ts`
  (`@Patch('me')` **placé avant** `@Patch(':id')` + `@Post('me/password')`) · `src/modules/users/users.service.ts`
  (ou nouveau `MyProfileService` si `UsersService` grossit) · `src/modules/organizations/dto/me-response.dto.ts`
  et `src/modules/users/dto/user-response.dto.ts` (`phone?`) · `src/kafka/outbox/identity-events.ts`
  (`USER_UPDATED` + `IdentityUserUpdatedV1` + union `IdentityEventPayload`).
- **Créé** : `dto/update-my-profile.dto.ts`, `dto/change-password.dto.ts`.
- **Réutilisés inchangés** : `PasswordService` (bcrypt cost 12), `OutboxService` (transactionnel),
  `CurrentUser`/`AuthenticatedUser`, `ThrottlerGuard`.
- **Côté `expert-comptable`** : `modules/identity/events/identity-events.ts` (miroir de l'enum) +
  `identity-consumer.bootstrap.ts` (abonnement au topic) + `identity-projection.service.ts` (handler).

### Le piège n°1 : l'ordre des routes

```ts
// ✅ CORRECT — 'me' doit gagner avant que ':id' ne l'attrape
@Patch('me')   @HttpCode(HttpStatus.OK)  async updateMe(...)      // ← pas de @Roles : tout membre
@Post('me/password') @HttpCode(HttpStatus.NO_CONTENT) async changePassword(...)
@Patch(':id')  @Roles(Role.TENANT_ADMIN) async updateMember(...)  // ← DOIT rester APRÈS
```
`GET 'me'` est déjà correctement placé (avant tout `:id` en GET) — c'est le précédent à suivre. En `PATCH`,
`:id` est **aujourd'hui la seule** route déclarée : y ajouter `me` **après** produirait un 403 pour tout
`TENANT_USER`, et un `updateMember` appelé avec `id='me'` pour un admin (→ `CastError`/404). Test AC-02 = filet.

### Le piège n°2 : ne pas casser le contrat de `GET /users/me`

`MeResponseDto` est **le** type que le shell frontend consomme depuis FE-015 (menu utilisateur : nom + e-mail
+ rôle). L'ajout de `phone` doit être **strictement additif** (`@ApiPropertyOptional`) et `PATCH /users/me`
doit renvoyer **exactement la même forme** que `GET /users/me` — sinon le front doit maintenir deux types là où
un seul suffit. Le `role` renvoyé conserve sa sémantique de **champ d'affichage** (`user.roles[0]`, cf. le
commentaire posé par STORY-103 dans `users.controller.ts`) — ne pas y toucher.

### Transaction + outbox (patron STORY-023, à recopier)

`OrganizationsService.updateProfileAndEmit` fait déjà exactement cela pour `identity.org.updated` :
`withTransaction(session => { update(...); outbox.enqueue(topic, payload, { session }); })`. Rejouer, ne pas
inventer. **Émettre uniquement si quelque chose a réellement changé** (un `PATCH` no-op ne doit pas polluer le bus).

### Changement de mot de passe — points durs

- Vérifier l'actuel avec `passwordService.compare` — **jamais** de comparaison de chaînes.
- `passwordHash` est `optional` sur le schéma (comptes `INVITED` sans mot de passe) : un compte sans
  `passwordHash` qui appelle la route ⇒ **401** (il doit passer par l'acceptation d'invitation), pas un 500.
- La contrainte de robustesse du nouveau mot de passe est **celle de `RegisterDto`** — la **lire** et la
  réutiliser (extraire le décorateur/regex dans un validateur partagé), jamais en écrire une seconde qui divergerait.
- Effacer `refreshTokenHash` **dans la même écriture** que le nouveau hash.
- Ne **jamais** journaliser le corps de la requête.

### Sécurité

- Surface **authentifiée** ⇒ pas d'anti-énumération à prévoir (contrairement au login/register).
- Aucune route ne prend d'identifiant d'utilisateur : l'unique source est le JWT ⇒ IDOR structurellement impossible.
- Whitelist `class-validator` = **la** défense contre l'escalade par le corps (`role`, `status`, `platformRole`).
- Réponses d'erreur génériques sur le mot de passe ; throttle serré.

### Edge cases

- `PATCH /users/me {}` (corps vide) → **200**, aucun changement, **aucun** événement.
- `phone` envoyé à `""` → à trancher au dev : normaliser en `undefined` (effacement) plutôt que stocker une
  chaîne vide. Documenter le choix dans la DTO.
- Utilisateur `SUSPENDED` : son jeton est déjà refusé en amont (garde de statut) ⇒ rien de spécifique.
- `PLATFORM_ADMIN` (sans `tenantId`) : `GET /users/me` le gère déjà (`organization: null`) ; le `PATCH` doit
  fonctionner de la même manière — **ne pas** exiger un `tenantId`.
- Course : deux `PATCH` concurrents → dernier écrivain gagne (état absolu, pas de delta) ; les deux événements
  portent l'état complet ⇒ le read-model converge.

---

## Dependencies

**Prérequis (tous ✅ done) :** STORY-023 (patron `PATCH /me` + outbox org), STORY-024/025 (session,
`refreshTokenHash`), STORY-026 (`UsersController`, `MeResponseDto`), STORY-027 (outbox `identity.*`),
STORY-029 (read-models d'identité côté `expert-comptable`), STORY-108 (`KafkaBootstrapService` fiabilisé).

**Débloque :** **FE-019** (« Mon profil » en écriture) et lève la mention « écran en lecture seule / demande à
formuler côté auth-service » de **FE-015** et du prototype. **STORY-124** (changement d'e-mail) s'appuie sur la
DTO et le service créés ici.

**Externes :** aucune (Mailhog n'est pas sollicité — aucun e-mail dans cette story ; c'est STORY-124 qui en enverra).

---

## Definition of Done

- [ ] Code implémenté (français) ; routes ordonnées `me` **avant** `:id` ; DTO whitelistées ; aucun secret journalisé.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ seuils du service (90/65/90/90) — **jamais baissés** ; nouveau code visé ~100 %.
- [ ] Tests **unitaires** : DTO (whitelist, robustesse du mot de passe), service (mise à jour, no-op sans
      événement, compare bcrypt, révocation du refresh, compte sans `passwordHash`), mapping `phone`.
- [ ] Tests **e2e** : AC-01→AC-14, dont **AC-02 (`TENANT_USER` → 200 sur `PATCH /users/me`)** et
      **AC-09 (refresh d'avant → 401)**, qui sont les deux régressions réellement dangereuses.
- [ ] **Vérification docker réelle** (`docker compose up --build`, stack complète, JWT RS256 réel) :
      register → verify → login `TENANT_USER` → `PATCH /users/me` **200** → `GET /users/me` reflète le changement
      → `outbox_events` contient `identity.user.updated` **SENT** → le read-model `expert-comptable` porte le
      nouveau nom → `POST /users/me/password` **204** → ancien mot de passe **401**, nouveau **200**, refresh
      d'avant **401** → tentative `{role:'TENANT_ADMIN'}` **400** → sans jeton **401** → `/health` **200** sur
      tous les services. Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé ; constats traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête, `sprint-status.yaml`, *Progress Tracking*) ;
      `completed_date` à la clôture.
- [ ] **FE-015 + prototype mis à jour** : la mention « écran en lecture seule, demande à formuler » est remplacée
      par la référence à cette story livrée.

---

## Story Points Breakdown

- **`phone` + `PATCH /users/me` + DTO whitelistée + ordre des routes + `MeResponseDto`/`UserResponseDto` :** 1 pt
- **`POST /users/me/password` (compare, re-hash, révocation refresh, throttle, politique partagée) :** 2 pts
- **`identity.user.updated` (contrat + outbox transactionnel + abonnement/projection `expert-comptable`) :** 1 pt
- **Tests (unit + e2e, dont les 2 régressions dangereuses) + vérif docker bout-en-bout :** 1 pt
- **Total :** 5 points

**Rationale :** le patron est **déjà livré** par STORY-023 (org) et STORY-027 (outbox) — l'effort net est le
mot de passe (seule vraie surface de sécurité neuve) et la **traversée** vers le read-model de la relying party,
qui touche deux dépôts.

---

## Additional Notes

- **Pourquoi cette story n'existait pas :** elle a été **différée deux fois explicitement** (STORY-009 et
  STORY-026) parce que l'ancien `expert-comptable` ne l'avait pas. Le différé était cohérent au cutover ; il ne
  l'est plus dès qu'un frontend affiche « Mon profil ». C'est le frontend qui a rendu la dette visible — comme
  pour STORY-109 (CORS) et FE-INT-4 (`cabinetName`).
- **Le volet cabinet demandé par le PO est DÉJÀ livré** : `PATCH /organizations/me` (`@Roles(TENANT_ADMIN)`,
  champs `name`/`phone`/`country`/`address`, émission `identity.org.updated`) existe depuis STORY-023 et est
  couvert côté UI par **FE-015**. Rien à créer de ce côté — c'est **uniquement** le self-service du membre qui manquait.
- **Ce que cette story ne résout pas :** un utilisateur qui a **oublié** son mot de passe reste bloqué (il faut
  être connecté pour appeler `POST /users/me/password`). Signalé ici à la rédaction, **arbitré par le PO le
  2026-07-22** → **STORY-125** (récupération par e-mail, cabinet **et** plateforme/admin-panel), **Must Have**,
  même sprint. STORY-123 = *renouvellement* d'un secret connu ; STORY-125 = *récupération* d'un compte perdu.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — écart remonté par **FE-015** puis **vérifié dans les contrôleurs** :
  `PATCH /users/me` et le changement de mot de passe n'existent nulle part dans l'IdP, et le report est tracé
  noir sur blanc dans STORY-009 et STORY-026. Cadrée « rejouer le patron STORY-023 sur `User` », e-mail
  délibérément sorti vers **STORY-124**.
- 2026-07-22 : Implémentée par **vivianMoneyVibesGroupes** — branche `MNV-123` sur `auth-service`,
  `expert-comptable` et `docs`.
- 2026-07-22 : **Vérifiée docker bout-en-bout** puis passée en `done`.

**Effort réel :** 5 points (conforme à l'estimation).

---

### Ce qui a été livré

**`auth-service` (:3001)**

| Élément | Fichier |
|---|---|
| `User.phone?` (additif, `trim`, aucune migration) | `modules/users/schemas/user.schema.ts` |
| `PATCH /users/me` — **aucun `@Roles`**, déclaré **AVANT** `@Patch(':id')` | `modules/users/users.controller.ts` |
| `POST /users/me/password` — `@Throttle 5/60s`, `204` | `modules/users/users.controller.ts` |
| `MyProfileService` — `updateProfileAndEmit` (transaction + outbox) et `changePassword` | `modules/users/my-profile.service.ts` |
| `UpdateMyProfileDto` / `ChangePasswordDto` (whitelist) | `modules/users/dto/` |
| Politique de mot de passe **partagée** avec `RegisterDto` | `common/validators/password-policy.decorator.ts` |
| `identity.user.updated` v1 + `IdentityEventsService.userUpdated` | `kafka/outbox/identity-events{,.service}.ts` |
| `phone` dans `MeResponseDto`, `UserResponseDto` et l'agrégation des membres | `dto/` + `memberships.service.ts` |

**`expert-comptable` (:3000)** — `USER_UPDATED` ajouté à l'enum (donc à `IDENTITY_TOPICS`, l'abonnement est
dérivé) et **un seul handler `onUserState` pour `user.registered` + `user.updated`** : ils portent le même état
absolu, les faire diverger serait le vrai risque.

**Deux décisions prises au développement**, toutes deux documentées dans le code :

1. **`phone: ""` vaut effacement (`$unset`)**, jamais une chaîne vide stockée — sinon chaque consommateur devrait
   distinguer deux représentations de « pas de numéro ». C'est aussi le seul moyen offert au membre de retirer son numéro.
2. **`AcceptInvitationDto` n'a PAS été rattaché** au validateur partagé : il porte une borne historique différente
   (pas de `MaxLength`), l'aligner changerait le comportement d'une surface hors périmètre. Divergence connue,
   tracée dans le décorateur — à traiter par la story qui touchera cette surface.

---

### Qualité

| | `auth-service` | `expert-comptable` |
|---|---|---|
| Lint | **0 warning** | **0 warning** |
| Build | OK | OK |
| Unitaires | **408** (50 suites) | **163** (28 suites) |
| e2e | **79** (7 suites) | **38** (5 suites) |
| Couverture globale | 96,87 / 87,86 / 98,19 / 96,90 — seuils 90/65/90/90 tenus | seuils tenus |
| Nouveau code | `my-profile.service.ts` **100 %**, `identity-events*` **100 %** | projection couverte |

**🎯 Le test d'AC-02 a été prouvé comme un vrai filet, pas une assurance de façade.** L'ordre des routes a été
**muté volontairement** (`@Patch('me')` déplacé après `@Patch(':id')`) et la suite e2e est passée de
**23 verts à 13 rouges**, AC-02 en tête. L'ordre correct a ensuite été restauré (23/23 verts). Sans cette
mutation, rien ne garantissait que le test détectait quoi que ce soit.

---

### Vérification docker réelle — stack neuve (`down -v`), JWT RS256 réels

> Rappel : les e2e **mockent la couche données** — ils ne prouvent ni la persistance ni l'atomicité.
> Services : `mongo` (rs0), `kafka`, `redis`, `mailhog`, `auth-service`, `expert-comptable`.
> ⚠️ Le rebuild d'image a échoué (miroir de registre `mirror.gcr.io` injoignable, DNS) ; la stack a donc démarré
> sur les images locales **avec `src/` monté en volume et hot-reload** — le code exécuté est bien celui de la branche
> (`Found 0 errors. Watching for file changes.` dans les logs des deux services).

| # | Vérification | Résultat |
|---|---|---|
| A | `/health` des 2 services | **200**, `mongodb`/`redis`/`kafka` **up** |
| B | Abonnement Kafka réel du consommateur EC | `memberAssignment` contient **`identity.user.updated:[0]`** |
| C | Parcours réel : register → verify (Mailhog) → invite → accept-invitation → login | jeton **`roles:['TENANT_USER']`** |
| D | **AC-02** — `TENANT_USER` → `PATCH /users/me` | **200** (jamais 403) + corps `MeResponseDto` complet |
| E | Persistance (`mongosh auth_service`) | `firstName=Kossi`, `phone=+228 90 11 22 33` |
| F | **AC-10** — outbox dans la même transaction | `outbox_events` : `identity.user.updated` **SENT**, `partitionKey = userId` |
| G | Payload — **aucune fuite** | `passwordHash`/`refreshTokenHash`/`phone` **absents** ✅ |
| H | **AC-11** — traversée jusqu'au read-model EC | `identity_users` : `firstName` **« Kosi » → « Kossi »**, `lastEventAt` = `occurredAt` de l'événement ; **1 marqueur** d'idempotence. L'admin non modifié garde « Kosi » — contraste qui prouve que c'est bien l'événement qui a agi |
| I | **AC-10** — `PATCH {}` (no-op) | **200**, compteur d'outbox **inchangé** (aucun événement parasite) |
| J | **AC-03** — `role` / `status` / `platformRole` / `email` dans le corps | **400** ×4 |
| K | **AC-13** — sans jeton | **401** |
| L | **AC-07** — mot de passe actuel faux | **401** générique, `refreshTokenHash` **toujours présent** (aucune écriture) |
| M | **AC-08** — nouveau == actuel / trop court | **400** / **400** |
| N | **AC-06** — changement nominal | **204**, hash **`$2b$12$`** |
| O | **AC-06** — login ancien / nouveau | **401** / **200** |
| P | **AC-09** — refresh émis **avant** le changement | **401** (session révoquée) |
| Q | **AC-10** — un changement de mdp n'émet pas l'événement | compteur d'outbox **inchangé** |
| R | Effacement du téléphone (`phone:""`) | **200**, champ **absent** du document (pas de chaîne vide) |
| S | Cohérence : l'effacement **a bien** émis un 2ᵉ événement | outbox **2 SENT**, EC **2 marqueurs**, read-model convergé, **aucun orphelin** |
| T | **AC-12** — throttle | **429** au-delà de la limite |
| U | **AC-05** — `PLATFORM_ADMIN` (sans organisation) | **200**, `organization: null` — aucun `tenantId` exigé |
| V | **AC-14** — non-régression | `GET /users/me` **200** · `GET /users` **403** (user) / **200** (admin) · `PATCH /users/:id` **403** (user) · `GET /organizations/me` **200** · `phone` remonte dans la liste admin quand il est renseigné |

**Les 7 lignes `ERROR` des logs** sont toutes horodatées **au boot** (avant l'auto-création des topics) : c'est le
**démarrage dégradé documenté** (invariant n°4) — le consommateur a rejoint le groupe 8 s plus tard. Aucune erreur
pendant le scénario.

**AC-01 → AC-14 : tous vérifiés en réel.**

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
