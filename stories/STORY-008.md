# STORY-008 : Invitation d'utilisateur + acceptation

**Epic :** EPIC-002 — Utilisateurs du tenant
**Réf. architecture :** S2.1
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian
**Créée le :** 2026-07-03
**Terminée le :** 2026-07-03
**Sprint :** 2
**Couvre :** FR-004

---

## User Story

En tant que **super-admin de compte (`TENANT_ADMIN`)**,
je veux **inviter des collaborateurs par e-mail et leur attribuer un rôle**,
afin qu'**ils rejoignent l'espace de mon cabinet et travaillent sur nos dossiers**.

---

## Description

### Contexte

STORY-004 a créé le **premier utilisateur** d'un cabinet (le `TENANT_ADMIN` auto-inscrit). STORY-005/006 ont livré l'**authentification** + la **vérification e-mail** en posant le `MailModule` (transport `MailerService` nodemailer + Handlebars, `EmailVerificationService` pour le **cycle de vie d'un token à usage unique**, worker `MailProcessor` fiable avec retry ×5). STORY-010 a posé le `UsersRepository` **scoping par tenant** (`GET /users/:id`, isolation 404). STORY-008 ouvre l'**onboarding d'équipe** :

> Un `TENANT_ADMIN` appelle `POST /users` → un `User` **`INVITED`** (sans mot de passe) est créé **dans son tenant** + un **e-mail d'invitation** (lien avec token à usage unique, **72 h**) est envoyé via le worker Bull → l'invité ouvre le lien et appelle `POST /auth/accept-invitation { token, password }` → **mot de passe défini**, statut **`ACTIVE`**, **e-mail considéré vérifié** → accès à la plateforme avec son rôle.

Trois propriétés sont critiques :

- **Invitation réservée au `TENANT_ADMIN`** : un `TENANT_USER` (ou un non-membre) **ne peut pas inviter** (403, via `@Roles`). Le rôle de l'invité est **attribuable** à l'invitation (`TENANT_ADMIN` | `TENANT_USER`).
- **Token d'invitation à usage unique, non rejouable** : token **aléatoire** (haute entropie), **stocké hashé** (`invitationTokenHash`, sha256), **TTL 72 h** (`invitationExpiresAt`), **effacé à l'acceptation**. Cohérent avec la convention de STORY-006 (le token en clair ne vit que dans l'e-mail).
- **Rattachement au bon tenant, garanti par l'infra** : l'invité est créé via `UsersRepository.create`, qui **force** le `tenantId` du contexte (l'inviteur) — jamais un autre cabinet (réutilise l'isolation de STORY-010). À l'acceptation, `emailVerifiedAt` est renseigné : l'invité **ne repasse pas** par le flux de vérification classique.

Cette story **réutilise le `MailModule`** (nouveau template `invitation.hbs` + `sendInvitationEmail` + job `SEND_INVITATION_EMAIL`), **étend `UsersModule`** (`InvitationService`, `POST /users`, `POST /users/:id/resend-invitation`) et **complète `AuthModule`** (`POST /auth/accept-invitation`).

### Périmètre

**Inclus :**
- **`POST /api/v1/users`** (`@Roles(TENANT_ADMIN)`) : crée un `User` **`INVITED`** (sans `passwordHash`) dans le **tenant courant**, rôle ∈ {`TENANT_ADMIN`, `TENANT_USER`}, et **enfile l'e-mail d'invitation**. Réponse **201** (`UserResponseDto`, statut `INVITED`). E-mail déjà pris (global) → **409 générique**.
- **`InvitationService`** (dans `UsersModule`) : cycle de vie du token d'invitation — `issueToken(userId)` (aléatoire → `invitationTokenHash = sha256`, `invitationExpiresAt = now + 72 h`, renvoie le clair) et `consume(token)` (retrouve par empreinte, vérifie **non expiré / non consommé**).
- **`POST /api/v1/auth/accept-invitation`** (`@Public`) : `{ token, password }` → consomme le token, **hache et pose le `passwordHash`**, statut → **`ACTIVE`**, `emailVerifiedAt = now` (**e-mail considéré vérifié**), **efface** les champs `invitation*` (usage unique). Token invalide/expiré/consommé → **400 générique**.
- **`POST /api/v1/users/:id/resend-invitation`** (`@Roles(TENANT_ADMIN)`) : pour un utilisateur **`INVITED` du tenant**, **ré-émet** un token (72 h) et ré-enfile l'e-mail (architecture S2.1).
- **Schéma `User`** : champs `invitationTokenHash?` / `invitationExpiresAt?` + index **sparse**.
- **`MailModule`** : `sendInvitationEmail(to, { firstName, invitationUrl })`, template `invitation.hbs`, job `SEND_INVITATION_EMAIL { userId }`, handler dans `MailProcessor` (génère le token **au moment de l'envoi**).
- **Config** : base d'URL du lien d'acceptation (réutilise `APP_PUBLIC_URL`).
- **Tests** unitaires (`InvitationService`, invite service/controller + guard rôle, `acceptInvitation`, mailer invitation) + e2e (invite 201/403, accept 200 + login, token invalide/expiré, **isolation** cross-tenant).

**Hors périmètre :**
- **CRUD complet** — `GET /users` (liste paginée), `PATCH /users/:id` (rôle/suspension), `DELETE /users/:id`, garde-fou « dernier `TENANT_ADMIN` actif » → **STORY-009** (même `UsersRepository`).
- **`TenantStateGuard`** (matrice KYC/abonnement) → **STORY-014** : l'invité hérite de l'état d'accès du tenant, mais la restriction fine arrive plus tard.
- **Réinitialisation de mot de passe** (« mot de passe oublié ») → hors phase 1 (non planifié).
- **Page frontend d'acceptation** → pas de front en phase 1 (le lien cible l'API, comme la vérification e-mail).
- **Renvoi de vérification classique** (STORY-006) — sans objet : l'invité est vérifié **à l'acceptation**, pas via ce flux.

### Flux (utilisateur)

1. Un `TENANT_ADMIN` (actif, vérifié) → `POST /users { email, firstName, lastName, role }` → un `User` **`INVITED`** est créé dans son tenant ; le job `SEND_INVITATION_EMAIL { userId }` est enfilé.
2. Le **`MailProcessor`** consomme le job : **génère** le token (72 h, stocké hashé), construit le lien `…/auth/accept-invitation?token=<raw>` et **envoie** l'e-mail (visible dans Mailhog).
3. L'invité ouvre le lien → `POST /auth/accept-invitation { token, password }` : le service consomme le token, pose le `passwordHash`, passe le statut à **`ACTIVE`**, renseigne `emailVerifiedAt`, efface les champs `invitation*`. **(Recommandé)** une **session** est émise → l'invité est connecté immédiatement.
4. L'invité accède à la plateforme avec le **rôle attribué**, selon l'état d'accès du tenant.
5. Lien expiré/invalide → message générique ; le `TENANT_ADMIN` peut `POST /users/:id/resend-invitation` pour renvoyer un lien.

---

## Acceptance Criteria

- [x] `POST /api/v1/users` (**`TENANT_ADMIN` uniquement**) crée un `User` **`INVITED`**, **sans `passwordHash`**, dans le **tenant de l'inviteur** (jamais un autre), avec un rôle ∈ {`TENANT_ADMIN`, `TENANT_USER`} ; réponse **201** (projection sûre). Un `TENANT_USER` → **403** ; sans token → **401** ; rôle `PLATFORM_ADMIN` dans le corps → **400**. *(Vérifié e2e + docker.)*
- [x] Un **e-mail d'invitation** est envoyé via le worker Bull `mail` (retry ×5, backoff exponentiel) et **apparaît dans Mailhog**, contenant un lien avec **token à usage unique**, **TTL 72 h**, **stocké hashé** (`invitationTokenHash = sha256`) — jamais en clair en base ni en log. *(Token 64-hex extrait de Mailhog en docker.)*
- [x] `POST /api/v1/auth/accept-invitation` (**public**) `{ token, password }` : **définit le mot de passe** (bcrypt via `PasswordService`), passe le statut à **`ACTIVE`**, renseigne `emailVerifiedAt` (**e-mail considéré vérifié**), **efface** les champs `invitation*` (le lien ne peut pas être rejoué → 2ᵉ appel **400**). Token **invalide/expiré/consommé** → **400 générique**.
- [x] Après acceptation, l'invité **accède à la plateforme** avec son rôle : réponse **200 + session** (auto-login), le mot de passe défini **fonctionne au login**, et l'`EmailVerifiedGuard` le laisse passer (`emailVerified:true`). *(Vérifié de bout en bout en docker.)*
- [x] **E-mail déjà utilisé** (global) → **409 générique** (anti-énumération) ; la **ré-invitation** d'un `INVITED` via `POST /users/:id/resend-invitation` (`TENANT_ADMIN`) **ré-émet** un token + e-mail (**204**).
- [x] **Isolation** : un `TENANT_ADMIN` ne peut inviter/renvoyer que **dans son tenant** ; un `:id` d'un **autre tenant** → **404** (réutilise `UsersRepository` de STORY-010). Un utilisateur non `INVITED` (déjà `ACTIVE`) → **409** au renvoi.
- [x] `docker compose up` : parcours complet vérifiable (**invite → e-mail Mailhog → accept → login**) — **14/0** ; tests STORY-001→007/010 **verts** ; **lint 0 warning** ; **couverture** ≥ seuils (90/65/90/90).

---

## Technical Notes

### Composants / fichiers
```
src/modules/users/users.controller.ts             # + POST /users (invite), POST /users/:id/resend-invitation
src/modules/users/invitation.service.ts           # cycle token invitation + orchestration invite (nouveau)
src/modules/users/dto/invite-user.dto.ts          # { email, firstName, lastName, role } (nouveau)
src/modules/users/users.service.ts                # + setInvitationToken / findByInvitationTokenHash / activateInvited
src/modules/users/users.module.ts                 # + InvitationService ; BullModule.registerQueue(MAIL_QUEUE) (producteur)
src/modules/users/schemas/user.schema.ts          # + invitationTokenHash?/invitationExpiresAt? + index sparse

src/modules/auth/auth.controller.ts               # + POST /auth/accept-invitation (@Public)
src/modules/auth/auth.service.ts                  # + acceptInvitation(dto)
src/modules/auth/dto/accept-invitation.dto.ts     # { token, password } (nouveau)

src/modules/mail/mail.constants.ts                # + SEND_INVITATION_EMAIL_JOB, InvitationEmailJobData
src/modules/mail/mail.processor.ts                # + handler SEND_INVITATION_EMAIL (WorkerHost multi-job)
src/modules/mail/mailer.service.ts                # + sendInvitationEmail
src/modules/mail/templates/invitation.hbs         # template e-mail d'invitation (nouveau)
```

### Schéma & token d'invitation
- **Champs dédiés** sur `User` : `invitationTokenHash?` (sha256) + `invitationExpiresAt?` ; index `UserSchema.index({ invitationTokenHash: 1 }, { sparse: true })`. **Distincts** des champs `emailVerification*` : flux séparé, **TTL 72 h** (vs 24 h), et l'acceptation **vaut vérification** (pas d'e-mail de vérification en plus).
- `InvitationService.issueToken` / `consume` sont **calqués** sur `EmailVerificationService` : `randomBytes(32).toString('hex')`, empreinte `sha256`, effacement des champs à la consommation (usage unique), message générique sur token inconnu/expiré.

### Câblage anti-dépendance-circulaire (point d'attention)
- `UsersModule` doit **produire** le job d'invitation **sans importer `MailModule`** — car `MailModule` **importe déjà `UsersModule`** (pour `MailProcessor`/`UsersService`) : un import inverse créerait un cycle. **Solution** : `UsersModule` enregistre lui-même la file via **`BullModule.registerQueue({ name: MAIL_QUEUE })`** (producteur) ; le **consommateur** (`MailProcessor`) reste dans `MailModule`.
- Le **`MailProcessor`** gère le nouveau job en injectant `InvitationService` (**exporté** par `UsersModule`, déjà importé par `MailModule`) afin de **générer le token au moment de l'envoi** (le secret ne transite pas par Redis — cohérent STORY-006).
- L'**acceptation** vit dans `AuthService` (qui **émet une session**) ; `AuthModule` importe déjà `UsersModule` → il injecte `InvitationService` pour **consommer** le token, puis réutilise `PasswordService` (hash) et `issueSession` (STORY-005).

### Endpoints
- `POST /api/v1/users` → body `InviteUserDto { email, firstName, lastName, role }` (`role` validé par `@IsEnum(Role)` restreint à `TENANT_ADMIN`/`TENANT_USER` — refuser `PLATFORM_ADMIN`). Réponse **201** `UserResponseDto`.
- `POST /api/v1/auth/accept-invitation` → body `AcceptInvitationDto { token, password }` (`password` : mêmes règles que `register`, min 8 / max 128). Réponse **200** : **session** (`AuthTokensDto`) *(recommandé)* ou message générique.
- `POST /api/v1/users/:id/resend-invitation` → **204/200** ; no-op idempotent si l'utilisateur n'est pas/plus `INVITED`.

### Sécurité
- **Rôle** : `@Roles(TENANT_ADMIN)` sur `invite` + `resend` (le `RolesGuard` renvoie 403). `accept-invitation` est `@Public` (l'invité n'a pas de session) → **hors** `EmailVerifiedGuard`.
- **Anti-énumération** : e-mail déjà pris → **409 générique** (comme `register`) ; token invalide → **400 générique**.
- **Isolation** : la création passe par `UsersRepository.create` (**`tenantId` forcé** du contexte) ; `resend`/lookup par id passe par `UsersRepository` (**404 cross-tenant**).
- **Login impossible avant acceptation** : un `INVITED` n'a **pas** de `passwordHash` — `AuthService.login` échoue déjà proprement (`!user.passwordHash` → **401 générique**), aucune connexion possible tant que l'invitation n'est pas acceptée.
- Le **token en clair** ne vit que dans l'e-mail ; jamais persisté, renvoyé, ni loggué.

### Points d'extension (seams)
- **STORY-009** : `GET /users` (liste paginée), `PATCH/DELETE /users/:id`, garde-fou « dernier `TENANT_ADMIN` » — sur le **même `UsersRepository`**.
- **STORY-014** : `TenantStateGuard` — l'invité hérite de l'**état d'accès** du tenant (KYC/abonnement).

---

## Dependencies

**Stories prérequises :**
- **STORY-006** ✅ (`MailModule` : `MailerService`, `MailProcessor`, cycle de token à usage unique, Bull retry ×5 ; convention sha256).
- **STORY-004 / STORY-005** ✅ (schéma `User` avec `status`/`passwordHash` optionnel, `PasswordService`, `issueSession`, chaîne de guards, `@Public`/`@Roles`).
- **STORY-010** ✅ (`UsersRepository` scoping + isolation 404 ; `UserResponseDto`).

**Stories débloquées par celle-ci :**
- **STORY-009** (CRUD/administration des utilisateurs invités).
- Parcours **équipe** complet (super-admin + collaborateurs).

**Dépendances externes :** aucune en dev (Mailhog fourni). Nouveau template `invitation.hbs`. Réutilise `APP_PUBLIC_URL`.

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité (`feature/STORY-008-invitation`).
- [ ] Tests :
  - [ ] Unitaire `InvitationService` : émission (hash sha256, expiry 72 h, clair non persisté) ; consommation OK ; expiré → erreur ; inconnu → erreur ; usage unique (champs effacés).
  - [ ] Unitaire invite (service/controller) : crée `INVITED` sans `passwordHash`, rôle validé, `tenantId` forcé ; enfile le job ; `TENANT_USER` → 403.
  - [ ] Unitaire `AuthService.acceptInvitation` : pose le hash, statut `ACTIVE`, `emailVerifiedAt`, efface le token ; token invalide/expiré → 400 ; session émise.
  - [ ] Unitaire `MailerService.sendInvitationEmail` + `MailProcessor` (job invitation : token + lien + envoi ; user non `INVITED` → no-op).
  - [ ] e2e : `invite → (job) → token en base → accept → login` ; token expiré/invalide → 400 ; **isolation** (invite/resend cross-tenant → 404/403) ; **e-mail présent dans Mailhog**.
- [ ] `npm run test:cov` respecte les seuils (90/65/90/90) ; `npm run test:e2e` vert.
- [ ] Lint (0 warning) et `nest build` OK ; tests précédents toujours verts.
- [ ] Endpoints documentés dans **Swagger** (tags `users` / `auth`).
- [ ] `docker compose up` : parcours complet vérifiable (invite → Mailhog → accept → login), isolation cross-tenant confirmée.
- [ ] Revue de code (`/code-review`) — attention au **caractère usage-unique** du token, au **câblage producteur/consommateur** (anti-cycle) et à l'**isolation** de l'invitation.
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **`POST /users` (invite)** + `InvitationService` (token + orchestration) + guard rôle : **1.5 pt**
- **`POST /auth/accept-invitation`** (set password + `ACTIVE` + `emailVerifiedAt` + session) : **1.5 pt**
- **`MailModule`** (`sendInvitationEmail` + template + job + handler `MailProcessor`) + **câblage anti-cycle** : **1 pt**
- **`resend-invitation`** + schéma/index + tests unitaires & e2e (dont Mailhog + isolation) : **1 pt**
- **Total : 5 points**

**Rationale :** la story **réutilise fortement** les briques de STORY-006 (Mail, cycle de token) et STORY-010 (`UsersRepository`, isolation), mais assemble **deux endpoints** (dont un **public**), un **nouveau type de token** (72 h), le **câblage producteur/consommateur anti-cycle** et l'**attribution de rôle**. Surface de test notable (parcours e2e + isolation). Cohérent avec l'estimation initiale de 5 pts.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Champs de token** — **Recommandé :** champs **dédiés** `invitation*` (flux et TTL distincts, acceptation = vérification). *Alternative :* réutiliser `emailVerification*` — écarté (sémantique mêlée).
2. **Auto-login à l'acceptation** — **Recommandé :** **émettre une session** (`AuthTokensDto`) pour une UX fluide (l'invité vient de choisir son mot de passe). *Alternative :* message générique + login manuel (comme `verify-email`).
3. **Cible du lien d'invitation** — pas de front en phase 1. **Recommandé :** lien vers `APP_PUBLIC_URL/auth/accept-invitation?token=` ; en l'absence de page, l'invité `POST { token, password }`. `FRONTEND_URL` surchargera quand un front existera.
4. **Locus de génération du token** — **Recommandé :** le **consommateur** (`MailProcessor`), comme STORY-006 (aucun secret en file Redis ; le job ne porte que `userId`).
5. **E-mail déjà pris** — **Recommandé :** **409 générique** (anti-énumération). *À discuter :* message plus utile si l'e-mail est déjà membre **du même** tenant.
6. **`resend-invitation`** — **inclus** (architecture S2.1, coût faible). *Repli :* basculer en STORY-009 si le temps manque.

### Notes diverses
- **Producteur/consommateur** : `UsersModule` enregistre `MAIL_QUEUE` (producteur), `MailModule` conserve le consommateur — **évite le cycle `Users ↔ Mail`**.
- **Réutilisabilité** : `sendInvitationEmail` et le rendu Handlebars suivent le patron de `verification.hbs` (asset `**/*.hbs` déjà copié vers `dist` par `nest-cli.json`).
- **Index** : `invitationTokenHash` **sparse** (seuls les invités en attente sont indexés ; champ effacé à l'acceptation), comme `emailVerificationTokenHash`.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-03 : Créée (Scrum Master, BMAD)
- 2026-07-03 : Implémentée, testée et vérifiée sur docker — ✅ Completed (Developer, BMAD)

**Effort réel :** 5 points (conforme à l'estimation).

---

## Notes d'implémentation

### Décisions ouvertes — tranchées
1. **Champs de token** : champs **dédiés** `invitationTokenHash` / `invitationExpiresAt` (index **sparse**), distincts d'`emailVerification*`.
2. **Auto-login à l'acceptation** : **oui** — `POST /auth/accept-invitation` renvoie un `AuthTokensDto` (l'invité est connecté immédiatement) via `AuthService.issueSession`.
3. **Cible du lien** : `APP_PUBLIC_URL/auth/accept-invitation?token=` (généré par le worker) ; en phase 1 sans front, l'invité `POST { token, password }`.
4. **Locus de génération du token** : le **consommateur** (`MailProcessor`), comme STORY-006 — le job ne porte que `userId`, aucun secret en file.
5. **E-mail déjà pris** : **409 générique** (`INVITE_CONFLICT_MESSAGE`), pré-contrôle `existsByEmail` + filet `E11000`.
6. **`resend-invitation`** : **inclus** — `POST /users/:id/resend-invitation` (`TENANT_ADMIN`), 404 cross-tenant, 409 si non `INVITED`.

### Écarts / points notables vs. plan
- **Câblage anti-cycle** appliqué tel que prévu : `UsersModule` enregistre `BullModule.registerQueue({ name: MAIL_QUEUE })` (**producteur**) → `InvitationService` injecte la file sans importer `MailModule`. Le **consommateur** `MailProcessor` (MailModule) **aiguille désormais selon `job.name`** (`send-verification-email` vs `send-invitation-email`) et injecte `InvitationService` (exporté par UsersModule, déjà importé par MailModule).
- **`InviteUserDto.role`** restreint par `@IsIn([TENANT_ADMIN, TENANT_USER])` → un `PLATFORM_ADMIN` dans le corps donne **400** (en plus du rejet `forbidNonWhitelisted` des champs inconnus comme `tenantId`).
- **`@Roles(TENANT_ADMIN)` au niveau méthode** surcharge le `@Roles(TENANT_ADMIN, TENANT_USER)` du contrôleur pour `invite`/`resend` ; `GET /users/:id` conserve les deux rôles.
- **`activateInvitedUser`** renvoie le document mis à jour (`findOneAndUpdate {new:true}`) → `issueSession` lit `emailVerifiedAt` frais (token `emailVerified:true`).

### Fichiers clés
- **Users** : `invitation.service.ts` (invite/resend/issueToken/consume + garde-fous), `users.service.ts` (`setInvitationToken`/`findByInvitationTokenHash`/`activateInvitedUser`), `users.controller.ts` (`POST /users`, `POST /users/:id/resend-invitation`), `dto/invite-user.dto.ts`, `users.module.ts` (queue producteur + provider), `schemas/user.schema.ts` (champs `invitation*` + index sparse).
- **Auth** : `auth.service.ts` (`acceptInvitation` + injection `InvitationService`), `auth.controller.ts` (`POST /auth/accept-invitation`, `@Public`), `dto/accept-invitation.dto.ts`.
- **Mail** : `mail.constants.ts` (`SEND_INVITATION_EMAIL_JOB`, `InvitationEmailJobData`), `mailer.service.ts` (`sendInvitationEmail`), `templates/invitation.hbs`, `mail.processor.ts` (dispatch multi-job).

### Résultats de vérification
- **Unitaires** : `31 suites / 193 tests` — verts. Couverture globale **99.62 % stmts / 86.98 % branches / 100 % fn / 99.59 % lignes** (seuils 90/65/90/90). `invitation.service` / `users.service` / `users.controller` / `mailer.service` / `accept-invitation.dto` : **100 % lignes**.
- **e2e** : `8 suites / 49 tests` — verts (dont `invitation` : 401/403 rôle, 403 non-vérifié, 201, 400 rôle/mot de passe, accept public 200/400).
- **Lint** : `0 warning`. **Build** `nest build` OK (asset `invitation.hbs` copié dans `dist`).
- **Docker (`docker compose up`) — 14/0** : invite 201 `INVITED` (sans secret), 409 doublon, 401 sans token, resend 204 / cross-tenant 404, accept 400 (invalide)/200+session/400 (rejoué usage unique), login invité 200, `TENANT_USER` invite → 403, A voit l'invité 200 `ACTIVE` / B → 404.
- **Invariants Mongo** : invité accepté → `status ACTIVE`, `emailVerifiedAt` renseigné, `passwordHash` bcrypt `$2b$` présent, champs `invitation*` **effacés** (usage unique).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
