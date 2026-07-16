# STORY-104 : `auth-service` — CRUD des rôles plateforme + catalogue de permissions + invitation d'un membre plateforme (`POST /admin/users`, org-less)

**Epic :** EPIC-025 — RBAC plateforme (D15)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Données / §Modèle de jetons · `architecture-prospera-ecosystem-2026-07-04.md` (K4 = contrats dupliqués, jetons auto-porteurs) · `sprint-status.yaml` §D15 (2026-07-16)
**Priorité :** Must Have
**Story Points :** 8 ⬆️ *(révisé 5→8 à la rédaction — cf. §Story Points Breakdown)*
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout le 2026-07-16)
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-16
**Sprint :** 10
**Service :** `auth-service` (:3001) — l'IdP, **seule source de vérité** des rôles et permissions
**Branche :** `MNV-104`

> **⚡ CE QUI REND LE RBAC UTILISABLE PAR UN HUMAIN.** STORY-103 a posé la ligne de partage (permission = code figé / rôle = donnée en base) ; STORY-105 a branché les guards qui les vérifient enfin. Mais **aucune voie d'API n'existe** pour *créer* un rôle ni *nommer* quelqu'un dessus : les 4 rôles système sortent du seed, et `PLATFORM_KYC_OFFICER` ne peut être attribué qu'à la main en base (`mongosh`). Cette story ouvre les deux portes manquantes.
>
> **Les 2 dernières permissions sans consommateur.** Le catalogue figé compte 8 permissions ; 6 sont vérifiées par un guard depuis 105. Restent `user:invite` et `role:manage` ([permission.enum.ts:38-41](auth-service/src/common/rbac/permission.enum.ts#L38-L41)) — **décoratives** tant que cette story n'existe pas. La **règle d'or de 103** (« une permission n'existe que si un guard la vérifie ») n'est donc **pas encore vraie** pour l'epic : c'est ici qu'elle se referme.
>
> **Le paradoxe à corriger** : aujourd'hui un `PLATFORM_ADMIN` (`tenantId = null`) **ne peut inviter personne**, alors qu'un simple `TENANT_ADMIN` le peut. Le super-admin est littéralement **plus démuni** que ses propres clients.

---

## User Story

En tant qu'**administrateur de la plateforme PROSPERA**,
je veux **composer des rôles plateforme depuis le catalogue de permissions** et **inviter un opérateur en lui attribuant un de ces rôles**, sans passer par `mongosh` ni par un redémarrage,
afin de **déléguer réellement** la revue KYC, le support ou l'audit — à chaud, et sans donner les pleins pouvoirs.

---

## Description

### Contexte

L'ordre imposé de l'epic est **103 ✅ → 105 ✅ → 104 → 106**. Les deux socles sont livrés et vérifiés docker (2026-07-16) :

| Acquis | Où | Ce que ça donne |
|---|---|---|
| Catalogue figé de 8 permissions | [permission.enum.ts](auth-service/src/common/rbac/permission.enum.ts) | la référence unique, validée à l'écriture |
| Collection `roles` + 4 rôles système seedés | [platform-role.schema.ts](auth-service/src/modules/rbac/schemas/platform-role.schema.ts) · [system-roles.ts](auth-service/src/modules/rbac/system-roles.ts) | le rôle est une **donnée**, composable à chaud |
| `perms[]` dans le JWT + union des rôles | [auth.service.ts:252-300](auth-service/src/modules/auth/auth.service.ts#L252-L300) | jeton auto-porteur, aucun appel à l'IdP sur le chemin chaud |
| `PermissionsGuard` + `@RequirePermissions` | [permissions.guard.ts](auth-service/src/common/guards/permissions.guard.ts) | quelqu'un **écoute** enfin `perms[]` (3 dépôts) |
| **2 invariants de sécurité écrits, non câblés** | [platform-roles.service.ts:70-118](auth-service/src/modules/rbac/platform-roles.service.ts#L70-L118) | `assertCanGrant` + `assertNotLastPlatformAdmin` — leur commentaire dit *« Câblée sur les routes en STORY-104 »* |

**Ce qui manque, précisément :**

| Constat | Preuve dans le code |
|---|---|
| Aucune route ne crée/édite/supprime un rôle | `RbacModule` n'a **aucun contrôleur** — [rbac.module.ts:22-30](auth-service/src/modules/rbac/rbac.module.ts#L22-L30) (son en-tête annonce déjà : *« STORY-104 y ajoutera les contrôleurs de gestion »*) |
| Aucune route n'expose le catalogue | `PERMISSION_CATALOG` n'est lu que par le seed → le panel (106) n'a **rien** pour ses cases à cocher |
| L'invitation est **org-scopée en dur** | [users.controller.ts:54-77](auth-service/src/modules/users/users.controller.ts#L54-L77) — `@Roles(TENANT_ADMIN)` + `new Types.ObjectId(user.tenantId!)` |
| `platformRole` s'écrit **sans validation** | [user.schema.ts:58-59](auth-service/src/modules/users/schemas/user.schema.ts#L58-L59) — `@Prop({ type: String })`, enum volontairement levé en 103 (dette **explicitement renvoyée ici** par la revue de 103) |
| Les 2 invariants ne protègent **rien** | aucun appelant : `grep -r assertCanGrant src/` → la définition seule |

### 🔴 La découverte de la rédaction (2026-07-16) — l'invitation org-less n'est pas un copier-coller

Le `sprint-status` prévenait (*« ⚠️ le flux accept-invitation actuel crée une Membership → à rendre org-less (vrai travail) »*). La lecture du code **confirme et précise** : il y a **trois** points de blocage en cascade, pas un.

#### 1. `consume()` **exige** une membership active — le blocage dur

[invitation.service.ts:196-199](auth-service/src/modules/users/invitation.service.ts#L196-L199) :

```typescript
const membership = await this.membershipsService.findActiveByUser(user._id);
if (!membership) {
  throw new BadRequestException(INVALID_INVITATION_TOKEN_MESSAGE);
}
return { user, organizationId: membership.organizationId };
```

Un invité **plateforme** n'a **par construction aucune membership**. Sans toucher à ces 4 lignes, l'opérateur reçoit son e-mail, clique, et se prend **« Lien d'invitation invalide ou expiré »** — sur un jeton parfaitement valide. Le compte serait créé et **définitivement inactivable** : `INVITED` pour toujours.

**Aggravant** : `organizationId` est dans la valeur de retour, mais [auth.service.ts:336](auth-service/src/modules/auth/auth.service.ts#L336) **la jette** et refait `findActiveByUser` lui-même. Le contrat de `consume` peut donc s'assouplir en `organizationId: Types.ObjectId | null` **sans casser son seul appelant** — le coût réel est faible, mais il fallait le vérifier avant de l'affirmer.

#### 2. `invite()` crée **toujours** une membership + émet **toujours** `membership.changed`

[invitation.service.ts:99-124](auth-service/src/modules/users/invitation.service.ts#L99-L124) : la création de `Membership` et l'événement `identity.membership.changed` sont **inconditionnels**, dans la transaction. Or `membershipChanged` porte un `orgId` **obligatoire** — un invité plateforme n'en a pas.

⚠️ **Conséquence Kafka à ne pas rater** : émettre `membership.changed` avec un `orgId` bidon (`null`, `''`) **provisionnerait un `OrgProfile` fantôme** chez `expert-comptable` ([STORY-029](docs/stories/STORY-029.md), consumer `identity.*`). Un invité plateforme doit émettre **`user.registered` SEUL**. C'est un choix de **contrat d'événement**, pas un détail d'implémentation.

#### 3. `acceptInvitation` — **déjà prêt**, et c'est voulu

[auth.service.ts:356-366](auth-service/src/modules/auth/auth.service.ts#L356-L366) passe **déjà** `user.platformRole` à `issueSession`, avec ce commentaire de 103 :

> *« Latent aujourd'hui (les comptes plateforme sont seedés), mais **STORY-104 fait de l'invitation org-less LA voie d'entrée d'un opérateur** : ce serait un piège à retardement. »*

103 a désamorcé le piège d'avance. `membership` y vaudra simplement `null` → `issueSession` produit `roles: [platformRole]`, `orgId: null`, `perms: [...]`. **Rien à faire ici** — à condition de le **vérifier** (AC-14), pas de le supposer.

### Périmètre

**Dans le périmètre :**

- `GET /admin/permissions` — le catalogue figé (alimente les cases à cocher de 106).
- `GET|POST|PATCH|DELETE /admin/roles` — CRUD des rôles **non-système**, composés depuis le catalogue.
- `POST /admin/users` — invitation **org-less** d'un membre plateforme, avec rôle plateforme obligatoire.
- `GET /admin/users` — liste des membres plateforme (nécessaire pour que 106 ait quoi afficher).
- `PATCH /admin/users/:id` — changer le rôle plateforme d'un opérateur (**le geste de délégation**).
- **Câblage des 2 invariants de 103** : `assertCanGrant` (anti god-mode) + `assertNotLastPlatformAdmin` **sous session** (anti-lockout).
- **Whitelist DTO de `platformRole`** — la dette que la revue de 103 a explicitement renvoyée ici.
- Rendre `InvitationService` org-less (membership optionnelle) **sans régression du flux tenant**.

**Hors périmètre (et pourquoi) :**

- ❌ **Aucune nouvelle permission.** Le catalogue reste à **8**. Règle d'or : on n'ajoute une permission que si un guard la vérifie — pas « au cas où » (cf. arbitrage `user:invite` §Technical Notes).
- ❌ **Les rôles TENANT ne bougent pas.** `POST /users` (invitation tenant) garde `@Roles(TENANT_ADMIN)`, `UpdateUserDto` garde ses rôles tenant. Borne du rayon d'explosion (D15) — cette story **ajoute** une surface plateforme, elle ne **migre** pas la surface tenant.
- ❌ **Le panel `admin-panel`** : c'est STORY-106 (proxy + cases à cocher). Ici, **l'API seule**.
- ❌ **Événement Kafka `role.changed`** : aucun consommateur (les perms se relisent au login via le jeton). En créer un violerait le pendant de la règle d'or côté événements.
- ❌ **Suppression/désactivation d'un opérateur plateforme** (`DELETE /admin/users/:id`) : non demandé par 106, et la rétrogradation via `PATCH` suffit à retirer les droits. À ouvrir si le besoin se présente.

### Flux

**Composer un rôle puis déléguer :**

1. L'admin lit `GET /admin/permissions` → les 8 permissions du catalogue.
2. Il compose : `POST /admin/roles { name: "PLATFORM_KYC_LEAD", permissions: ["kyc:approve", "kyc:reject", "org:read", "entitlement:grant"] }` → `assertCanGrant` vérifie qu'il **détient** chacune → 201, `isSystem: false`.
3. Il invite : `POST /admin/users { email, firstName, lastName, platformRole: "PLATFORM_KYC_LEAD" }` → `User(INVITED, platformRole)` **sans membership**, `user.registered` seul, e-mail en file.
4. L'opérateur clique le lien → `POST /auth/accept-invitation { token, password }` → compte `ACTIVE` → **jeton `roles: ["PLATFORM_KYC_LEAD"]`, `orgId: null`, `perms: [4 permissions]`**.
5. Il approuve un KYC (200, `kyc:approve`) **mais** se prend un **403** sur `POST /admin/organizations/:id/suspend` (`org:suspend` non détenue) — la délégation est **bornée**.

---

## Acceptance Criteria

**Catalogue & CRUD des rôles**

- [x] **AC-1** — `GET /admin/permissions` renvoie les **8** permissions du catalogue (valeur + description), gouverné par `role:manage`.
- [x] **AC-2** — `GET /admin/roles` liste les rôles de la collection `roles`, `isSystem` inclus (le panel doit pouvoir griser les rôles système).
- [x] **AC-3** — `POST /admin/roles` crée un rôle avec `isSystem: false` **forcé côté serveur** (jamais depuis le corps de la requête) → 201.
- [x] **AC-4** — Une permission **hors catalogue** dans `permissions[]` → **400** (validation DTO), et le schéma reste le filet de sécurité.
- [x] **AC-5** — Un `name` déjà pris → **409 générique** (`E11000` mappé, jamais remonté brut — anti-énumération).
- [x] **AC-6** — `PATCH /admin/roles/:name` sur un rôle **système** → **403** `SYSTEM_ROLE_IMMUTABLE_MESSAGE` ; idem `DELETE`.
- [x] **AC-7** — `DELETE /admin/roles/:name` d'un rôle **encore porté** par au moins un utilisateur actif → **409** (jamais de rôle orphelin en silence).
- [x] **AC-8** — Toutes les routes `/admin/roles` et `/admin/permissions` exigent `role:manage` → un `PLATFORM_KYC_OFFICER` reçoit **403**.

**Les 2 invariants de 103, enfin câblés**

- [x] **AC-9** — **Anti god-mode** : composer/éditer un rôle portant une permission que l'acteur **ne détient pas** → **403** `GRANT_ESCALATION_MESSAGE` (`assertCanGrant` appelé avec `user.perms`).
- [x] **AC-10** — **Anti-lockout** : rétrograder le **dernier** `PLATFORM_ADMIN` actif → **409** `LAST_PLATFORM_ADMIN_MESSAGE`.
- [x] **AC-11** — L'anti-lockout est évalué **DANS la transaction** de la mutation : `assertNotLastPlatformAdmin(counter, role, session)` reçoit **la `session` de l'écriture** (la fenêtre TOCTOU « deux rétrogradations parallèles → 0 admin » est fermée — ce lockout est **irréversible**).

**Invitation plateforme (org-less)**

- [x] **AC-12** — `POST /admin/users` (`user:invite`) crée `User(INVITED)` avec `platformRole` et **AUCUNE membership** ; 201 + e-mail en file.
- [x] **AC-13** — L'invitation org-less émet **`identity.user.registered` SEUL** — **jamais** `membership.changed` (sinon `OrgProfile` fantôme chez `expert-comptable`).
- [x] **AC-14** — Le lien d'invitation est **consommable** : `POST /auth/accept-invitation` sur un invité **sans membership** → **200** (⚠️ **c'est le test qui casse aujourd'hui** : `consume()` renvoie 400).
- [x] **AC-15** — Le jeton issu de cette acceptation porte `roles: [platformRole]`, **`orgId: null`**, et `perms[]` = les permissions du rôle.
- [x] **AC-16** — `platformRole` est **whitelisté contre la collection `roles`** : un rôle inexistant → **400** (dette de 103 refermée ; le `@Prop` sans enum reste volontaire).
- [x] **AC-17** — `PATCH /admin/users/:id` change le `platformRole` d'un opérateur ; `assertCanGrant` **et** `assertNotLastPlatformAdmin` s'appliquent.
- [x] **AC-18** — `GET /admin/users` liste les porteurs d'un `platformRole` (paginé), org-less.

**Non-régression (le vrai risque de cette story)**

- [x] **AC-19** — Le flux **tenant** est **strictement inchangé** : `POST /users` crée toujours `User + Membership` **et** émet **`user.registered` + `membership.changed`** ; `accept-invitation` d'un invité tenant renvoie toujours un jeton avec `orgId` renseigné. *(`InvitationService` est partagé — c'est là que ça peut casser.)*
- [x] **AC-20** — Les e2e existants d'invitation tenant passent **sans modification**.

---

## Technical Notes

### Mapping route → permission (la table qui fait foi)

| Route | Permission | Note |
|---|---|---|
| `GET /admin/permissions` | `role:manage` | on lit le catalogue **pour composer** un rôle |
| `GET /admin/roles` | `role:manage` | |
| `POST /admin/roles` | `role:manage` | + `assertCanGrant` |
| `PATCH /admin/roles/:name` | `role:manage` | + `assertCanGrant` · refus si système |
| `DELETE /admin/roles/:name` | `role:manage` | refus si système · refus si porté (409) |
| `POST /admin/users` | `user:invite` | + whitelist `platformRole` + `assertCanGrant` |
| `GET /admin/users` | `user:invite` | *(voir arbitrage ci-dessous)* |
| `PATCH /admin/users/:id` | `user:invite` | + `assertCanGrant` + `assertNotLastPlatformAdmin` **sous session** |

**🛡️ Plancher deny-by-default — reprendre le patron de 105.** Poser `@RequirePermissions(...)` **sur la classe** en plus des routes : `getAllAndOverride([handler, classe])` fait gagner le handler, mais une route future dont l'auteur oublierait le décorateur reste protégée. Sans ce plancher, elle serait ouverte à **tout utilisateur authentifié — un `TENANT_USER` compris**. Voir [admin-organizations.controller.ts:47-56](auth-service/src/modules/admin/admin-organizations.controller.ts#L47-L56).

#### Arbitrage — pourquoi `user:invite` gouverne aussi `GET`/`PATCH /admin/users` (et pas un nouveau `user:manage`)

Le geste « inviter un opérateur avec un rôle » et le geste « changer le rôle d'un opérateur » sont **le même acte de délégation**, à un instant différent. Trois raisons de ne **pas** ajouter `user:manage` au catalogue :

1. **La règle d'or de 103** interdit d'ajouter une permission « au cas où ». Il faudrait un besoin réel de séparer *inviter* de *rétrograder* — **aucun persona ne le demande** (`user:invite` n'est détenue que par `PLATFORM_ADMIN`, cf. [system-roles.ts:31-60](auth-service/src/modules/rbac/system-roles.ts#L31-L60)).
2. **Le catalogue est dupliqué dans 3 dépôts** (K4, STORY-105). Toute permission ajoutée est une modification × 3. Le coût est réel, le bénéfice hypothétique.
3. **Le risque d'escalade est déjà couvert** par `assertCanGrant` : détenir `user:invite` ne permet d'accorder que ce qu'on détient **déjà**.

> 🔓 **Dette tracée** : si un jour un persona doit *lister* les opérateurs sans pouvoir les *nommer* (auditeur RH, conformité), il faudra scinder → `user:read` + `user:invite`. **À arbitrer à ce moment-là, pas maintenant.**

### Câblage des modules — le cycle NestJS à éviter

`RbacModule` est **volontairement un module feuille** ([rbac.module.ts:15-18](auth-service/src/modules/rbac/rbac.module.ts#L15-L18)) : *« `AuthModule` et `UsersModule` importeront `RbacModule`, jamais l'inverse. Un cycle NestJS échoue au démarrage — c'est une contrainte de conception, pas un détail. »* C'est **exactement pourquoi** `assertNotLastPlatformAdmin` reçoit un `PlatformRoleHolderCounter` **en paramètre** au lieu d'injecter `UsersService`.

**Le piège** : mettre les nouveaux contrôleurs dans `RbacModule` l'obligerait à injecter `UsersService` (compter les porteurs, écrire `platformRole`) → `RbacModule → UsersModule → RbacModule` → **le conteneur ne démarre pas**.

**La solution — `AdminModule`** ([admin.module.ts](auth-service/src/modules/admin/admin.module.ts)), qui est **déjà** la maison de la surface admin plateforme et n'est importé par personne :

```typescript
@Module({
  imports: [OrganizationsModule, MembershipsModule, UsersModule, RbacModule],
  controllers: [
    AdminOrganizationsController,
    PlatformRolesController,   // /admin/roles + /admin/permissions
    PlatformUsersController,   // /admin/users
  ],
  providers: [AdminOrganizationsService, PlatformUsersService],
})
export class AdminModule {}
```

`RbacModule` reste feuille · `UsersModule` **n'a pas besoin** d'importer `RbacModule` (la validation du rôle se fait en amont, dans `AdminModule`) · `UsersService` est passé comme `counter` par `PlatformUsersService`. **Aucun cycle.**

### `InvitationService` org-less — les 3 retouches, et rien de plus

C'est le **seul code partagé** entre le flux tenant (vivant, testé) et le flux plateforme (nouveau). Chaque retouche doit être **additive**.

**1. `invite()` — membership conditionnelle** ([invitation.service.ts:66-147](auth-service/src/modules/users/invitation.service.ts#L66-L147)) :

```typescript
async invite(
  dto: InviteUserDto,
  organizationId: Types.ObjectId | null,   // ← null = invitation PLATEFORME
  inviterName: string,
  platformRole?: string,                    // ← posé sur le User, pas sur une membership
): Promise<UserResponseDto>
```

- `usersService.create({ ..., platformRole })` — le rôle plateforme vit **sur le `User`**.
- `if (organizationId)` → membership + `membershipChanged` ; **sinon ni l'un ni l'autre** (AC-13).
- `userRegistered` reste **inconditionnel** dans les deux cas.
- ⚠️ `orgName: 'votre cabinet'` est **codé en dur** dans l'e-mail ([:212](auth-service/src/modules/users/invitation.service.ts#L212)) → pour une invitation plateforme, écrire **« la plateforme PROSPERA »** (un opérateur PROSPERA qu'on accueille dans « votre cabinet » est un bug d'accueil visible par un humain).

**2. `consume()` — membership optionnelle** ([:183-201](auth-service/src/modules/users/invitation.service.ts#L183-L201)) : retirer le `if (!membership) throw`, renvoyer `organizationId: Types.ObjectId | null`. **Le jeton reste la seule preuve** (hash + expiration) — c'est déjà lui qui authentifie ; la membership n'a **jamais été** un contrôle de sécurité ici, seulement une hypothèse implicite du modèle tenant. Le seul appelant ignore déjà ce champ ([auth.service.ts:333](auth-service/src/modules/auth/auth.service.ts#L333)).

**3. `resend()` — variante plateforme** ([:149-174](auth-service/src/modules/users/invitation.service.ts#L149-L174)) : l'isolation d'org (`!membership.organizationId.equals(organizationId)` → 409 générique) **n'a aucun sens** pour un invité plateforme. Si `POST /admin/users/:id/resend-invitation` est exposé, passer `organizationId: null` → sauter le contrôle d'org, **garder** le contrôle `status === INVITED`. *(Route optionnelle : à n'ouvrir que si 106 en a besoin — sinon, ne pas la créer.)*

### 🪤 Piège — `roles[0]` et la réponse de `/users/me`

[users.controller.ts:178](auth-service/src/modules/users/users.controller.ts#L178) fait `role: user.roles[0] ?? null` avec ce commentaire de 103 : l'union est **ordonnée** (membership **puis** plateforme), donc `roles[0]` reproduit exactement l'ancien contrat. **Un opérateur plateforme pur** (org-less, la cible de cette story) a `roles = [platformRole]` → `roles[0]` = son rôle plateforme. ✅ **Correct par construction** — mais le vérifier explicitement (un `PLATFORM_KYC_OFFICER` doit voir `role: "PLATFORM_KYC_OFFICER"`, `organization: null` sur `/users/me`), pas le supposer.

### Propagation d'un changement de rôle — dire la vérité dans Swagger

Les perms sont **figées dans le jeton** à l'émission ([permissions.guard.ts:19-24](auth-service/src/common/guards/permissions.guard.ts#L19-L24)). Éditer un rôle **ne révoque rien immédiatement** : le porteur garde ses anciennes perms jusqu'à l'expiration de son access token (**≤ 15 min**). C'est la contrepartie **assumée** du jeton auto-porteur (K4 : aucun appel à l'IdP sur le chemin chaud). **Le documenter dans Swagger** sur `PATCH /admin/roles/:name` : un admin qui retire une permission en urgence doit savoir qu'elle ne tombe pas à la seconde.

### Swagger

Chaque route : `@ApiOperation` explicite, `@ApiForbiddenResponse` (permission insuffisante **et** rôle système), `@ApiConflictResponse` (nom pris, rôle porté, dernier admin), `@ApiBadRequestResponse` (permission hors catalogue, rôle inexistant). Le catalogue de `GET /admin/permissions` doit être **typé** (DTO), pas un `string[]` nu : 106 en fait des cases à cocher **avec libellés**.

### Vérification docker attendue (obligatoire — la story écrit en base)

> Les e2e **mockent la couche données** : ils ne prouvent **ni la persistance ni l'atomicité**. Recette `mongosh` réelle, consignée dans *Progress Tracking*.

1. **Seed + login `PLATFORM_ADMIN`** (`npm run seed:admin` → login) → jeton avec les **8** perms.
2. **Catalogue** : `GET /admin/permissions` → 8 entrées.
3. **Composition** : `POST /admin/roles {PLATFORM_KYC_LEAD, [kyc:approve, kyc:reject, org:read]}` → 201 → `db.roles.countDocuments()` = **5** (4 système + 1), `isSystem: false` **en base**.
4. **Anti god-mode** : login d'un `PLATFORM_KYC_OFFICER` (perms = `{kyc:approve, kyc:reject, org:read}`) → il **n'a pas** `role:manage` → `POST /admin/roles` → **403**. Puis, jeton admin, composer un rôle avec une permission non détenue → **403** `GRANT_ESCALATION_MESSAGE`.
5. **Invitation org-less** : `POST /admin/users {platformRole: "PLATFORM_KYC_LEAD"}` → 201 → en base : `db.users.findOne({email})` a `platformRole: "PLATFORM_KYC_LEAD"`, `status: "INVITED"` **ET** `db.memberships.countDocuments({userId})` = **0**.
6. **Contrat Kafka** : `db.outbox_events.find({...})` → **`identity.user.registered` présent**, **`identity.membership.changed` ABSENT** (AC-13). Puis, côté `expert-comptable` : `db.org_profiles.countDocuments()` **inchangé** — aucun profil fantôme.
7. **Acceptation (LE test qui casse aujourd'hui)** : récupérer le lien dans **Mailhog** (:8025) → `POST /auth/accept-invitation` → **200** → décoder le JWT : `roles: ["PLATFORM_KYC_LEAD"]`, **`org: null`**, `perms: [3]`.
8. **Délégation bornée bout-en-bout** : avec CE jeton → `kyc-service` approuve un dossier → **200** ; `POST /admin/organizations/:id/suspend` → **403** (`org:suspend` non détenue). *(C'est la démonstration que 103+105+104 composent.)*
9. **Anti-lockout** : rétrograder le **seul** `PLATFORM_ADMIN` → **409** ; en base, son `platformRole` est **intact**.
10. **Rôle système** : `DELETE /admin/roles/PLATFORM_ADMIN` → **403** ; `db.roles.countDocuments({name: 'PLATFORM_ADMIN'})` = **1**.
11. **Suppression d'un rôle porté** : `DELETE /admin/roles/PLATFORM_KYC_LEAD` (l'invité le porte) → **409**.
12. **Non-régression tenant** : `POST /users` (jeton `TENANT_ADMIN`) → membership créée **ET** `membership.changed` en outbox ; accept-invitation → jeton avec `org` renseigné.

---

## Risques & Mitigation

| Risque | Impact | Mitigation |
|---|---|---|
| **Régression du flux d'invitation tenant** (`InvitationService` partagé) | 🔴 Élevé — casse un flux client vivant | Retouches **additives** (paramètre `null`able, jamais de branche retirée) ; AC-19/AC-20 : les e2e tenant passent **sans modification** ; vérif docker §12 |
| **`membership.changed` émis avec un `orgId` vide** | 🔴 Élevé — `OrgProfile` fantôme chez `expert-comptable`, corruption silencieuse d'un read-model | AC-13 + vérif docker §6 (assertion **négative** sur l'outbox **et** sur `org_profiles`) |
| **Cycle NestJS `RbacModule ↔ UsersModule`** | 🟠 Moyen — le conteneur ne démarre pas | Contrôleurs dans `AdminModule` (§Câblage) ; `RbacModule` reste feuille |
| **TOCTOU anti-lockout** (2 rétrogradations parallèles → 0 admin) | 🔴 Élevé — **lockout irréversible**, aucune route de secours | AC-11 : `session` de la mutation transmise ; c'est **précisément** ce que la revue de 103 a préparé en ajoutant `ClientSession` à la signature |
| **`isSystem: true` accepté depuis le corps de la requête** | 🟠 Moyen — un rôle utilisateur devient indestructible | AC-3 : forcé côté serveur ; `isSystem` **absent** du DTO de création (pas seulement ignoré) |
| **`role:manage` = god-mode** | 🔴 Élevé — composer un rôle avec `entitlement:grant` et se l'attribuer | `assertCanGrant` sur **les 3 routes d'écriture de rôle + les 2 d'écriture d'utilisateur** (AC-9) — l'oubli sur **une seule** route rouvre la faille entière |

---

## Dependencies

**Stories prérequises :**

- ✅ **STORY-103** — catalogue, collection `roles`, seed, `perms[]` dans le JWT, `assertCanGrant`/`assertNotLastPlatformAdmin` (définis, à câbler **ici**). *Done 2026-07-16.*
- ✅ **STORY-105** — `PermissionsGuard` + `@RequirePermissions` + shim de compat `roles[]`. Sans elle, les routes de cette story n'auraient **aucun guard** à décorer. *Done 2026-07-16.*
- ✅ **STORY-026** — seed `PLATFORM_ADMIN` (le premier admin, hors API — le point d'entrée du système reste le seed).
- ✅ **STORY-029** — consumer `identity.*` d'`expert-comptable` : **c'est lui** qui rend AC-13 non négociable.

**Stories débloquées :**

- 🔓 **STORY-106** — `admin-panel` : proxy des routes de gestion + cases à cocher alimentées par `GET /admin/permissions`. **Ne peut pas commencer sans cette story** (rien à proxifier).

**Dépendances externes :** aucune. Mongo en replica set `rs0` (transactions) et Mailhog sont déjà dans le compose racine.

---

## Definition of Done

- [x] Lint **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0` — binaire **local**)
- [x] `npm run build` OK
- [x] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (**seuils jamais abaissés**)
- [x] Unitaires + e2e verts, **y compris les e2e d'invitation tenant préexistants, non modifiés** (AC-20)
- [x] Tests unitaires : `assertCanGrant` sur les 5 routes d'écriture · anti-lockout **avec transmission de `session`** (le test qui aurait attrapé le TOCTOU de 103) · refus des rôles système · whitelist `platformRole` · `E11000` → 409 générique
- [x] Tests e2e : CRUD rôles · catalogue · invitation org-less · accept-invitation **sans membership** · 403 permission insuffisante
- [x] **Vérification docker réelle** (12 points ci-dessus) **consignée dans *Progress Tracking*** — jamais « atomicité vérifiée » sur la foi d'un mock
- [x] Swagger à jour (`/api/docs`), y compris la **fenêtre de propagation ≤ 15 min**
- [x] Non-régression : `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`, accept-invitation tenant **inchangés**
- [x] Statut synchronisé **aux 3 endroits** (en-tête · `sprint-status.yaml` + commentaire daté · *Progress Tracking*) + `completed_date`
- [x] `/code-review` passée, constats traités
- [x] Branche `MNV-104` **partie de `dev`**, rebasée sur `origin/dev`, PR `MNV-104(auth-service): …` en **« Rebase and merge »**, branche supprimée

---

## Story Points Breakdown

- **CRUD rôles + catalogue** (2 contrôleurs, DTOs, service, mapping `E11000`) : **2**
- **Invitation org-less** (`InvitationService` : `invite`/`consume`/`resend` + contrat d'événement + e-mail) : **3**
- **`PATCH /admin/users/:id` + câblage des 2 invariants sous session** : **1**
- **Tests** (unit + e2e + **non-régression tenant**) + **vérification docker 12 points** : **2**
- **Total : 8**

**Rationale — ⬆️ révisé 5→8 à la rédaction (2026-07-16).** Le plan cadrait 5 en supposant l'invitation org-less proche d'un copier-coller de l'invitation tenant. La lecture du code dit l'inverse : **3 points de blocage en cascade** (`consume()` rejette tout invité sans membership · membership + `membership.changed` inconditionnels · e-mail codé en dur sur « votre cabinet »), et surtout **`InvitationService` est partagé avec un flux client vivant** — le vrai coût est la **non-régression**, pas les nouvelles routes. S'y ajoute le câblage des 2 invariants de sécurité **sous session** (que 103 a préparés mais dont la revue a montré qu'ils se trompent facilement : le TOCTOU y était un constat 🔴). Même mouvement que STORY-105, révisée 5→8 pour la même raison : le périmètre réel se lit dans le code, pas dans le plan. Sprint 10 : **31 → 34 points** = **exactement la capacité**, sans marge.

---

## Additional Notes

**Ce que cette story referme.** À sa clôture, les **8 permissions du catalogue** ont un guard qui les vérifie : la **règle d'or de 103** devient vraie pour l'epic entier — plus une seule permission décorative.

**Le seed reste le point d'entrée.** Cette story n'ouvre **aucune** voie pour créer le *premier* `PLATFORM_ADMIN` : il faut déjà en être un pour inviter. `npm run seed:admin` reste le bootstrap, et l'anti-lockout garantit qu'on ne peut pas fermer la porte de l'intérieur. C'est **volontaire** : une route de création de super-admin serait la cible la plus attaquable de l'écosystème.

**Hook inerte pour 106.** `GET /admin/permissions` renvoie `{ value, description }` **et pas un `string[]`** : le panel a besoin des libellés pour ses cases à cocher. Le typer maintenant évite un aller-retour de contrat.

**Dette 105 toujours ouverte, hors périmètre ici** 🔓 : `PLATFORM_SUPPORT`/`PLATFORM_AUDITOR` voient les URLs présignées des pièces d'identité (lecture KYC mappée sur `org:read`, faute de `kyc:read` au catalogue). Story dédiée **à arbitrer AVANT tout usage réel de `PLATFORM_SUPPORT` en prod**. Cette story ne l'aggrave pas — mais elle rend ces personas **réellement attribuables**, ce qui **rapproche l'échéance**.

---

## Progress Tracking

**Status History:**
- 2026-07-16 : Créée (Scrum Master, BMAD create-story) — points révisés **5 → 8** à la rédaction après lecture du code (`InvitationService` partagé + 3 blocages en cascade)
- 2026-07-16 : Implémentée + **vérifiée docker bout-en-bout** + `done` (Developer, BMAD dev-story)

**Actual Effort:** 8 points (conforme à l'estimation révisée)

---

## Implementation Notes (2026-07-16)

### Livré

| Fichier | Rôle |
|---|---|
| `modules/rbac/permission-catalog.ts` **(nouveau)** | libellés humains des 8 permissions — **hors** du contrat dupliqué (cf. §K4) |
| `modules/rbac/dto/{create,update}-platform-role.dto.ts` · `platform-role.dto.ts` **(nouveaux)** | validation `@IsEnum(Permission)` contre le catalogue + projection de sortie |
| `modules/rbac/platform-roles.service.ts` | `+findByName` · `+list` · `+create` · `+update` · `+remove` |
| `modules/admin/platform-roles.controller.ts` **(nouveau)** | `/admin/permissions` + CRUD `/admin/roles` (`role:manage`) |
| `modules/admin/platform-users.{controller,service}.ts` **(nouveaux)** | `/admin/users` org-less (`user:invite`) + **câblage des 2 invariants** |
| `modules/admin/dto/{invite-platform-user,update-platform-user,list-platform-users-query}.dto.ts` **(nouveaux)** | contrats d'entrée |
| `modules/users/invitation.service.ts` | `invite`/`consume`/`resend` rendus **org-less-compatibles** (additif) |
| `modules/users/users.service.ts` | `+countAssignedByPlatformRole` · `+listPlatformUsers` |
| `modules/admin/admin.module.ts` | `+UsersModule` `+RbacModule` — `RbacModule` reste **feuille** |

**Tests** : **379 unit** (47 suites) + **56 e2e** verts · lint **0** · build OK · couverture **96.72 / 87.25 / 98.13 / 96.75** (seuils 65/90/90/90) — **100 %** sur les 5 fichiers neufs.

### 🔍 3 écarts trouvés à l'implémentation (le code ne disait pas tout)

1. **🐞 `countActiveByPlatformRole` ne pouvait PAS servir l'anti-suppression** *(trouvé à l'écriture, confirmé en docker)*. Le compteur de 103 filtre `status: ACTIVE` — correct pour l'anti-lockout (« reste-t-il un admin **opérationnel** ? »), **faux** pour « ce rôle est-il **référencé** ? » : un porteur `INVITED` n'est pas compté ⇒ on aurait supprimé le rôle **sous les pieds d'un invité**, qui aurait accepté son invitation pour atterrir sur `perms: []`, **en silence**. D'où un **second** compteur, `countAssignedByPlatformRole` (sans filtre de statut) + une interface distincte `PlatformRoleAssignmentCounter`. La vérif docker §11 le prouve : le rôle est refusé à la suppression alors que son **seul** porteur est `INVITED` — l'ancien compteur aurait renvoyé 0 et autorisé la suppression.
2. **🐞 Fuite des champs internes de Mongo dans la réponse HTTP** *(invisible en unitaire, **trouvée en docker**)*. `PlatformRoleDto` faisait `Object.assign(this, partial)` sur un document `.lean()`/`.toObject()` → `_id`, `__v`, `createdAt`, `updatedAt` partaient dans le corps de `GET/POST /admin/roles` : des champs absents de Swagger que `admin-panel` (106) aurait vus apparaître dans son contrat. **Projection explicite** + test de non-régression sur les clés exactes.
3. **`name` volontairement NON éditable** : le nom est la clé fonctionnelle recopiée dans `User.platformRole`. Le renommer laisserait ses porteurs pointer vers un rôle disparu, et `permissionsFor()` dégrade un rôle inconnu en `[]` **sans erreur** — perte totale des droits, en silence, pour tous les porteurs. Renommer = créer + réattribuer + supprimer (ce que le garde-fou §11 rend sûr).

### Décisions

- **K4 préservé** : `common/rbac/permission.enum.ts` est resté **identique à l'octet près** dans les 3 dépôts (`diff -q` vérifié) — les libellés vivent dans `modules/rbac/permission-catalog.ts`, propre à l'IdP. Un test le fige (`permission.enum.ts` ne doit contenir aucun libellé).
- **Aucune nouvelle permission** : catalogue à **8**. `GET`/`PATCH /admin/users` gouvernés par `user:invite` (cf. arbitrage §Technical Notes). 🔓 dette tracée : scinder `user:read`/`user:invite` **si** un persona doit un jour lister sans nommer.
- **Contrôleurs dans `AdminModule`** : `RbacModule` reste feuille. Le démarrage réel du conteneur (vérif docker) est la preuve qu'aucun cycle n'a été introduit.
- **`PATCH /admin/users/:id` → 404 sur un compte sans `platformRole`** : cette route **redistribue** un rôle plateforme entre opérateurs, elle ne **promeut** pas un tenant (et ne révèle pas l'existence d'un compte tenant — anti-énumération).

### ✅ Vérification docker RÉELLE (stack : mongo `rs0` + kafka + redis + mailhog + auth `:3001` + EC `:3000` + kyc `:3002`)

> Les e2e mockent la couche données. Tout ci-dessous est joué sur les **services réels**, assertions par `mongosh` direct.

| # | Vérification | Résultat |
|---|---|---|
| 1 | seed + login `PLATFORM_ADMIN` | `roles:[PLATFORM_ADMIN]`, `org:null`, **perms:8** ✅ |
| 2 | `GET /admin/permissions` | **8** entrées `{value, description}` ✅ |
| 3 | `POST /admin/roles` → base | `db.roles` = **5** (4 système + 1), `isSystem:false` **en base** ✅ |
| 3b | `isSystem:true` dans le corps | **400** (`forbidNonWhitelisted`) · `FAUX_SYSTEME` en base = **0** ✅ |
| 4 | **ANTI GOD-MODE** — acteur réel `{role:manage, org:read}` | compose `org:read` → **201** ; compose `entitlement:grant` → **403** *« Vous ne pouvez accorder que des permissions que vous détenez. »* · `ROLE_ESCALADE` en base = **0** · message **ne divulgue pas** la perm manquante ✅ |
| 5 | **INVITATION ORG-LESS** | `User(INVITED, platformRole=PLATFORM_KYC_LEAD)` **et `memberships = 0`** ✅ |
| 6 | **CONTRAT KAFKA** | outbox : `identity.user.registered` = **1** (`SENT`) · `identity.membership.changed` = **0** ✅ |
| 6b | **Assertion NÉGATIVE downstream** (EC live, **lag 0**) | les 2 opérateurs répliqués dans `identity_users` (`INVITED`), `identity_memberships` = **0**, `org_profiles` portant leur id = **0** ⇒ **aucun OrgProfile fantôme** ✅ |
| 7 | **`accept-invitation` SANS membership** (Mailhog) | **200** → JWT `roles:[PLATFORM_KYC_LEAD]`, **`org:null`**, `perms:[kyc:approve, kyc:reject, org:read]` — *c'est le test qui renvoyait 400 avant cette story* ✅ |
| 8 | **DÉLÉGATION BORNÉE** (même jeton) | `GET /admin/organizations` (org:read) → **200** · `POST …/suspend` (org:suspend) → **403** · `/admin/permissions` (role:manage) → **403** · `POST /admin/users` (user:invite) → **403** ✅ |
| 8b | **CROSS-SERVICE** | ce même jeton sur `kyc-service :3002` `GET /admin/kyc` → **200** (validé **localement** via JWKS, aucun appel REST à l'IdP) · sans jeton → **401** ✅ |
| 9 | **ANTI-LOCKOUT** (mise en scène : 1 seul admin actif) | rétrogradation du dernier → **409** *« il doit rester au moins un administrateur plateforme »* · `platformRole` **INTACT** en base ✅ |
| 10 | **RÔLE SYSTÈME** | `DELETE /admin/roles/PLATFORM_ADMIN` → **403** · toujours **1** en base · `PATCH` d'un persona → **403** ✅ |
| 11 | **RÔLE ENCORE PORTÉ** | `DELETE` → **409** · rôle toujours en base — *son seul porteur est `INVITED`, ce que l'ancien compteur aurait manqué* ✅ |
| 12 | **NON-RÉGRESSION TENANT** | `POST /users` → **201** · membership = **1** · `membership.changed` = **1** · `user.registered` = **1** · `platformRole` **ABSENT** · e-mail = « votre cabinet » ✅ |
| 12b | **accept-invitation TENANT** | **200** → `roles:[TENANT_USER]`, **`org` RENSEIGNÉ**, `perms:[]` (D15) ✅ |

**État final de l'opérateur en base** : `status: ACTIVE`, `emailVerifiedAt` posé, `platformRole: PLATFORM_KYC_LEAD`, **`memberships: 0`**.

### 🔎 `/code-review` (high) — 5 constats, 3 corrigés

**Le constat 🔴 que la revue a rattrapé** *(angle « comportement retiré »)* : en retirant l'exigence de membership de `consume()`, **un garde-fou est tombé avec elle** — sans que personne l'ait décidé. `findActiveByUser` renvoyait `null` pour un invité **supprimé** (soft-delete → membership `SUSPENDED`), ce qui le refusait **par effet de bord**. Sans cette exigence, `consume()` ne vérifiait plus que le hash et l'expiration : **un collaborateur viré pouvait cliquer son ancien lien et ressusciter son compte en `ACTIVE`**, `deletedAt` toujours posé — un compte à moitié supprimé qui s'authentifie et obtient un JWT valide. **Reproduit sur le service réel en docker**, puis corrigé et re-vérifié.

Le correctif dit enfin l'**invariant réel** au lieu de le laisser dépendre d'un effet de bord : *seul un invité **en attente** consomme une invitation* — indépendant de la membership (il vaut donc pour les deux populations), et c'est déjà exactement ce que `resend()` vérifie. Message générique (anti-énumération).

| # | Constat | Suite |
|---|---|---|
| 1 | 🔴 **Résurrection d'un invité supprimé** (ci-dessus) | **CORRIGÉ** + 2 tests (`soft-delete`, `jeton rejoué`) + re-vérif docker : viré → **400** état inchangé · invité sain → **200** · org-less → **200** |
| 2 | 🔴 Fuite `_id`/`__v`/`createdAt`/`updatedAt` dans `/admin/roles` | **CORRIGÉ** (projection explicite + test figeant les clés) — trouvé en docker |
| 3 | 🔴 `countActive…` inapte à l'anti-suppression (invité non compté) | **CORRIGÉ** (2ᵉ compteur + interface distincte) — prouvé en docker §11 |
| 4 | 🟡 **TOCTOU étroit** : `resolveGrantableRole` valide hors transaction, `invite()` ouvre la sienne → un `DELETE` du rôle concurrent laisse un porteur orphelin (`perms:[]`) | **NON CORRIGÉ, tracé.** Fenêtre très étroite (2 admins concurrents), **aucune élévation** possible (le résultat est une *perte* de droits). Refermer exigerait de faire traverser une `ClientSession` à `InvitationService` — **code partagé avec le flux tenant vivant**, au-delà du principe « retouches strictement additives » de cette story. 🔓 **à arbitrer en story dédiée** |
| 5 | 🟡 `isDuplicateKeyError` dupliqué dans **4** fichiers | **NON CORRIGÉ, tracé.** Le mapping `E11000` → 409 générique est un invariant de sécurité (anti-énumération) : le durcir devra se faire 4 fois. Extraction vers `common/utils/` = 3 fichiers hors périmètre |

### ⚠️ Points à connaître

- **Hot-reload trompeur** : `tsc --watch` recompile mais **le process node ne redémarre pas toujours** — une vérif docker menée juste après une édition a testé du **code périmé** (c'est ainsi que la fuite de champs Mongo a d'abord semblé « non corrigée »). ⇒ **`docker compose restart <service>` avant toute vérification.**
- **🔶 Flake de test sous charge** : sur ~12 exécutions de `npm test`, **2 échecs** (1 test, suite non identifiée) survenus **pendant des builds/redémarrages docker concurrents** ; **8 exécutions consécutives vertes** à froid, et le test fautif n'a pas pu être capturé. Plusieurs suites durent 25-30 s ⇒ **sensibilité au timeout sous contention CPU**, vraisemblablement **préexistante** (aucune des suites lentes n'est neuve). **Non corrigé, tracé ici.**
- **Données de dev** : la base porte **7 `PLATFORM_ADMIN` actifs** hérités des stories précédentes — l'anti-lockout ne se déclenche donc pas spontanément. Le test §9 a nécessité de ramener temporairement le compte à 1 (restauré ensuite). `admin@prospera.local` a été re-seedé après un test de rétrogradation.
- **`org_profiles` 54 → 55 pendant la vérif** : tracé à un `membership.changed` **en attente dans le backlog Kafka** (lag 1) appartenant à `Cabinet Verif105 …` — une organisation **tenant** issue de la vérif de STORY-105, **sans rapport** avec les invitations org-less (assertion §6b explicite).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation)**
