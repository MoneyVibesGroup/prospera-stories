# STORY-025 : Vérification e-mail + invitations + file mail interne (BullMQ)

**Epic :** EPIC-005 — Extraction `auth-service` (fournisseur d'identité / IdP)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Conception de l'API (vérif e-mail / invitations) · §File mail interne · `architecture-prospera-ecosystem-2026-07-04.md` (Redis/BullMQ = **jobs internes uniquement** ; le bus inter-services reste Kafka)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Implémenté & vérifié (docker/Mailhog e2e OK, 2026-07-07) — reste : `/code-review` formel + `.env.example` à confirmer, puis commit sur demande
**Assigné à :** Unassigned
**Créée le :** 2026-07-07
**Sprint :** 4
**Service :** auth-service (`:3001`)
**Couvre :** FR-002 (vérification e-mail), FR-005/FR-006 (invitation + acceptation) — périmètre identité de l'IdP

> **Les parcours e-mail de l'IdP se branchent sur le socle des sprints précédents.** STORY-023 a posé l'identité (Organizations/Users/Memberships + register) **avec les champs de vérification/invitation déjà présents sur `User`** ; STORY-024 a livré l'émission de jetons (`issueSession`), la chaîne de guards et `@AllowUnverified`. STORY-025 **rend vivants** les deux parcours pilotés par e-mail — **vérification d'adresse** (le hook `enqueueVerificationEmail` posé inerte en STORY-023 devient réel) et **invitation de collaborateurs** (créer un `User` `INVITED` + `Membership`, l'inviter par mail, lui faire définir son mot de passe) — sur une **file mail interne BullMQ** (Redis), livrée en SMTP dev via **Mailhog**. Aucun schéma nouveau (tout est déjà sur `User`), aucun événement Kafka (les `identity.*` restent STORY-027).

---

## User Story

En tant qu'**utilisateur d'un cabinet** (administrateur qui invite, ou collaborateur invité),
je veux **vérifier mon adresse e-mail et rejoindre l'organisation via une invitation par e-mail**,
afin de **prouver mon identité et accéder à l'écosystème avec un compte activé**.

---

## Description

### Contexte

L'IdP possède l'identité (STORY-023) et émet des jetons portant le claim `emailVerified` (STORY-024) — mais, à l'ouverture de la story, **aucun e-mail n'était encore envoyé** et **aucun collaborateur ne pouvait être invité** : le hook `enqueueVerificationEmail(userId)` était **inerte** (posé en STORY-023) et il n'existait pas de module mail dans `auth-service`. STORY-025 comble ce manque en **ré-hébergeant** deux parcours déjà éprouvés dans `expert-comptable` :

- **Vérification e-mail** (repris de `expert-comptable` STORY-006 — `mail/email-verification.service.ts`, `templates/verification.hbs`) : à l'inscription, un jeton de vérification (haché + expiration) est déposé sur le `User` et un e-mail est **mis en file** ; l'utilisateur clique le lien, l'adresse est marquée vérifiée (`emailVerifiedAt`). Le claim `emailVerified` (STORY-024) devient alors **significatif** et l'`EmailVerifiedGuard` (déjà câblé) protège réellement les endpoints sensibles.
- **Invitations** (repris de `expert-comptable` STORY-008 — `users/invitation.service.ts`, `templates/invitation.hbs`) : un `TENANT_ADMIN` invite une adresse ; l'IdP crée **atomiquement** un `User` `INVITED` (sans mot de passe) + un `Membership` `TENANT_USER` dans l'organisation de l'invitant, et met en file un e-mail d'invitation ; l'invité clique le lien, **définit son mot de passe**, son compte passe `ACTIVE` (e-mail implicitement vérifié) et une **session est ouverte** (`issueSession`, réutilisé de STORY-024).

Les deux parcours partagent une **file mail interne** : `MailerService` **met en file** un job sur une file BullMQ (Redis), un `MailProcessor` **rend le template** (`.hbs`) et **envoie** via SMTP (Mailhog en dev). C'est un **job interne** — conforme à la règle programme « Redis/BullMQ = jobs internes uniquement ; le bus inter-services est Kafka ». Aucun `identity.*` n'est produit ici (STORY-027).

**Reprise, pas réécriture** : le diff conceptuel est faible — on transpose la mécanique EC au modèle normalisé (l'invitation crée un `Membership` au lieu de renseigner `User.tenantId+role`), et l'acceptation **ouvre une session** via `issueSession` (RS256) au lieu de l'ancien HS256.

### Périmètre

**Inclus :**

- **`MailModule`** (nouveau, `modules/mail/`, repris d'EC en retirant le template KYC) :
  - `MailerService` : met en file les e-mails (produit des jobs BullMQ) — API `sendVerification(user, token)`, `sendInvitation(user, org, inviter, token)` ;
  - `MailProcessor` (`@Processor`) : consomme la file mail, **rend le template Handlebars** et envoie via `nodemailer` (transport SMTP Mailhog en dev) ; **retries** BullMQ + backoff ; idempotent (renvoi sûr) ;
  - `templates/verification.hbs`, `templates/invitation.hbs` (repris ; **pas** de `kyc-submitted.hbs` — hors périmètre IdP) ;
  - `mail.constants.ts` (nom de file `MAIL_QUEUE`, types de jobs `send-verification` / `send-invitation`).
- **File BullMQ `mail`** : déclarée via le `QueueModule` existant (STORY-022) ; connectée au `redis` du compose racine. **Job interne** (aucun contrat inter-services).
- **Vérification e-mail** :
  - `enqueueVerificationEmail(userId)` **implémenté** dans `AuthService` (remplace le no-op) : génère un jeton aléatoire (haute entropie), stocke `emailVerificationTokenHash` (sha256) + `emailVerificationExpiresAt` sur le `User`, met en file l'e-mail (lien `APP_PUBLIC_URL` + jeton **en clair** dans l'URL seulement) ;
  - `GET /api/v1/auth/verify-email?token=…` (`@Public`) : résout le `User` par hash du jeton, vérifie la **non-expiration**, marque `emailVerifiedAt`, **efface** le jeton (usage unique), renvoie **200** ; jeton invalide/expiré → **message générique** (400/410) ;
  - `POST /api/v1/auth/resend-verification` (**authentifié**, `@AllowUnverified`, **throttlé**) : ré-génère + re-met en file pour l'utilisateur courant (`sub` du JWT) ; **200 générique** (l'authentification élimine l'énumération). Idempotent : invalide le jeton précédent.
- **Invitations** :
  - `InvitationService` + `POST /api/v1/users` (**authentifié `[TENANT_ADMIN]`**) : DTO `InviteUserDto` `{ email, firstName, lastName, role? }` (défaut `TENANT_USER`) → crée **atomiquement** (transaction) un `User` `INVITED` (sans `passwordHash`, `invitationTokenHash`+`invitationExpiresAt`) et un `Membership` `TENANT_USER` **dans l'organisation de l'invitant** (`org` du JWT / `TenantContext`), met en file l'e-mail d'invitation → **201** ; e-mail déjà pris → **409 générique** ;
  - `POST /api/v1/users/:id/resend-invitation` (`[TENANT_ADMIN]`) : re-met en file pour un utilisateur **encore `INVITED`** de son org ; 409 si l'utilisateur n'est pas/plus en attente ;
  - `POST /api/v1/auth/accept-invitation` (`@Public`) : DTO `AcceptInvitationDto` `{ token, password, firstName?, lastName? }` → résout par hash du jeton, vérifie non-expiration, **définit `passwordHash`** (bcrypt 12), passe `status ACTIVE`, marque `emailVerifiedAt` (l'invitation vaut vérification), **efface** le jeton, puis **`issueSession`** (RS256) → **200** `{ accessToken, refreshToken, … }` ; jeton invalide/expiré → **message générique**.
- **Config + env** (`configuration.ts` + `env.validation.ts`) : `MAIL_HOST` (défaut `mailhog`), `MAIL_PORT` (défaut `1025`), `MAIL_FROM`, `APP_PUBLIC_URL` (base des liens), `EMAIL_VERIFICATION_TTL` (défaut `24h`), `INVITATION_TTL` (défaut `72h`). **Secrets `.env` non lus** ; défauts dev via compose `${VAR:-…}`.
- **Compose racine** : ajouter `mailhog` aux `depends_on` d'`auth-service` (`condition: service_started`) + défauts `MAIL_*`/`APP_PUBLIC_URL` (mêmes conventions qu'`expert-comptable`).
- **Swagger** : tag `auth` (verify-email/resend/accept-invitation) et `users` (invite/resend-invitation) documentés (codes 200/201/400/409, messages génériques).
- **Tests** : unitaires (`MailerService` met en file le bon job ; `MailProcessor` rend le bon template ; `AuthService.verifyEmail` OK/expiré/invalide ; `resendVerification` ; `InvitationService.invite` atomique + e-mail pris→409 ; `acceptInvitation` OK/expiré + session émise) + **e2e** (register→mail en file ; verify-email 200 ; invite 201 ; accept-invitation 200 + login invité) + **vérification docker** (Mailhog : cf. DoD).

**Hors périmètre :**

- **Gestion des utilisateurs** — liste/détail/mise à jour/suspension/suppression `[/users GET/PATCH/DELETE]`, **changement de rôle**, **garde-fou « dernier admin »** (appliqué), **seed `PLATFORM_ADMIN`** → **STORY-026**. STORY-025 n'ajoute au contrôleur `/users` que **l'invitation** (`POST /users`, `POST /users/:id/resend-invitation`).
- **Événements `identity.*`** (`identity.user.registered`/`org.created`, outbox Kafka) → **STORY-027**. Le hook `publishIdentityCreated` **reste inerte** ; les e-mails ne produisent **aucun** événement inter-services.
- **Réinitialisation de mot de passe (« mot de passe oublié »)** → non planifié dans EPIC-005 (n'existe pas dans EC). Hors périmètre.
- **Multi-organisation** (inviter une adresse **déjà** utilisateur d'une autre org → 2ᵉ membership) : phase 1 = un membership actif → l'e-mail déjà pris est un **conflit** (pas d'ajout de membership). Différé.
- **Templates riches / i18n / anti-spam avancé** : templates simples repris d'EC (FR), suffisants pour le MVP.

### Flux (utilisateur)

**A. Vérification d'e-mail**
1. Un gérant fait `POST /auth/register` (STORY-023). Après commit, `enqueueVerificationEmail` **met en file** un e-mail de vérification (lien `APP_PUBLIC_URL/verify-email?token=…`).
2. Le `MailProcessor` rend `verification.hbs` et l'envoie (Mailhog en dev).
3. L'utilisateur ouvre le lien → `GET /auth/verify-email?token=…` → **200**, `emailVerifiedAt` renseigné, jeton effacé.
4. Au prochain `login`, l'access token porte `emailVerified: true` ; les endpoints protégés par `EmailVerifiedGuard` deviennent accessibles.
5. *(lien perdu/expiré)* L'utilisateur (connecté, non vérifié) fait `POST /auth/resend-verification` → nouvel e-mail (throttlé).

**B. Invitation**
1. Un `TENANT_ADMIN` fait `POST /users` `{ email, firstName, lastName }`. L'IdP crée **atomiquement** `User(INVITED)` + `Membership(TENANT_USER, ACTIVE)` dans son org, puis **met en file** l'e-mail d'invitation (lien `…/accept-invitation?token=…`).
2. L'invité ouvre le lien et fait `POST /auth/accept-invitation` `{ token, password }` → `passwordHash` défini, `status ACTIVE`, `emailVerifiedAt` renseigné, jeton effacé, **session ouverte** (`issueSession`) → **200** `{ accessToken, refreshToken }`.
3. L'invité est authentifié, e-mail vérifié, membre `TENANT_USER` de l'organisation.
4. *(échec)* Jeton invalide/expiré → **message générique** ; e-mail déjà pris à l'invitation → **409 générique**.

---

## Acceptance Criteria

- [x] **File mail interne (BullMQ)** : `MailerService.send*` **met en file** un job sur la file `mail` (Redis) ; un `MailProcessor` le consomme, **rend le template Handlebars** et envoie via SMTP (Mailhog en dev), avec **retries/backoff**. Aucun envoi synchrone dans le chemin HTTP ; aucun contrat Kafka (job **interne**).
- [x] **Vérification à l'inscription** : après `POST /auth/register`, un e-mail de vérification est **mis en file** (hook `enqueueVerificationEmail` **réellement implémenté**) ; `emailVerificationTokenHash` (sha256) + `emailVerificationExpiresAt` sont stockés sur le `User` (jeton **jamais** stocké en clair).
- [x] `GET /api/v1/auth/verify-email?token=…` (`@Public`) : jeton valide → **200**, `emailVerifiedAt` renseigné, jeton **effacé** (usage unique) ; jeton invalide **ou** expiré → **message générique** (pas d'oracle). Après vérification, un nouveau `login` porte `emailVerified: true`.
- [x] `POST /api/v1/auth/resend-verification` (**authentifié**, `@AllowUnverified`, **throttlé**) : ré-émet un jeton et re-met en file l'e-mail pour l'utilisateur courant ; **200 générique** ; invalide le jeton précédent.
- [x] **Invitation atomique** : `POST /api/v1/users` (`[TENANT_ADMIN]`) crée **dans une transaction** `User(INVITED, sans passwordHash)` + `Membership(TENANT_USER, ACTIVE)` dans l'org de l'invitant, stocke `invitationTokenHash`+`invitationExpiresAt`, met en file l'e-mail → **201**. Échec en cours de transaction → **aucun** document créé.
- [x] **Anti-énumération à l'invitation** : e-mail déjà utilisateur → **409 générique** (ne révèle pas l'existence du compte).
- [x] `POST /api/v1/users/:id/resend-invitation` (`[TENANT_ADMIN]`) : re-met en file pour un utilisateur **encore `INVITED`** de son org ; utilisateur non/plus en attente → **409**.
- [x] `POST /api/v1/auth/accept-invitation` (`@Public`) : jeton valide → définit `passwordHash` (bcrypt 12), `status ACTIVE`, `emailVerifiedAt` renseigné, jeton **effacé**, **`issueSession`** → **200** `{ accessToken, refreshToken, tokenType, expiresIn }` ; jeton invalide/expiré → **message générique**. L'invité peut ensuite `login`.
- [x] **Isolation d'org à l'invitation** : le `Membership` créé pointe l'organisation **de l'invitant** (`org` du JWT / `TenantContext`) ; un `TENANT_ADMIN` ne peut pas inviter dans une autre organisation.
- [x] **Sécurité** : jetons aléatoires haute entropie, **hachés** (sha256) avant stockage, **à usage unique** et **expirants** ; jamais journalisés ; liens via `APP_PUBLIC_URL` ; **aucun secret** en clair (`.env` protégé, défauts dev via compose).
- [x] **lint 0 warning** ; **couverture** ≥ seuils (65/90/90/90) ; `nest build` OK ; suites STORY-022/023/024 **toujours vertes**.
- [x] **`docker compose up` (racine)** : parcours de bout en bout vérifiés via **Mailhog** — register → e-mail de vérification **présent dans Mailhog** (`GET http://localhost:8025/api/v2/messages`) → extraire le jeton → verify-email **200** → login `emailVerified: true` ; invite → e-mail d'invitation dans Mailhog → accept-invitation **200** → login de l'invité OK. Consigner les résultats en *Progress Tracking*.

---

## Technical Notes

### Composants / fichiers (auth-service)

```
src/modules/mail/mail.module.ts                      # MailModule (BullMQ 'mail' + Mailer + Processor) (NOUVEAU)
src/modules/mail/mailer.service.ts                   # met en file les e-mails (repris EC) (NOUVEAU)
src/modules/mail/mail.processor.ts                   # @Processor : rend le .hbs + envoie SMTP (repris EC) (NOUVEAU)
src/modules/mail/mail.constants.ts                   # MAIL_QUEUE, jobs send-verification/send-invitation (NOUVEAU)
src/modules/mail/templates/verification.hbs          # (repris EC) (NOUVEAU)
src/modules/mail/templates/invitation.hbs            # (repris EC) (NOUVEAU)

src/modules/auth/auth.service.ts                     # enqueueVerificationEmail (impl.), verifyEmail, resendVerification, acceptInvitation
src/modules/auth/auth.controller.ts                  # + GET verify-email, POST resend-verification (@AllowUnverified), POST accept-invitation (@Public)
src/modules/auth/dto/verify-email.dto.ts             # { token } (query) (NOUVEAU)
src/modules/auth/dto/accept-invitation.dto.ts        # { token, password, firstName?, lastName? } (NOUVEAU)

src/modules/users/invitation.service.ts              # invite(dto) atomique + resend(id) (repris EC, normalisé Membership) (NOUVEAU)
src/modules/users/users.controller.ts                # POST / (invite), POST /:id/resend-invitation ([TENANT_ADMIN]) (NOUVEAU — étendu par STORY-026)
src/modules/users/users.module.ts                    # + InvitationService, MailModule
src/modules/users/dto/invite-user.dto.ts             # { email, firstName, lastName, role? } (NOUVEAU)

src/config/configuration.ts                          # + mail {host,port,from}, appPublicUrl, tokens {emailVerificationTtl, invitationTtl}
src/config/env.validation.ts                         # + MAIL_HOST/PORT/FROM, APP_PUBLIC_URL, *_TTL (optionnels avec défauts)
src/app.module.ts                                    # + MailModule
docker-compose.yml (racine)                          # auth-service depends_on mailhog + défauts MAIL_*/APP_PUBLIC_URL
```

*Aucun changement de schéma* : `User` porte déjà `emailVerificationTokenHash/ExpiresAt`, `invitationTokenHash/ExpiresAt`, `emailVerifiedAt`, `passwordHash?`, `status` + index sparse (STORY-023, [user.schema.ts](../../auth-service/src/modules/users/schemas/user.schema.ts)).

### File mail interne (BullMQ)

- **Producteur** (`MailerService`) : `queue.add('send-verification', { to, firstName, link })` / `queue.add('send-invitation', { to, firstName, orgName, inviterName, link })`. Jamais d'envoi SMTP dans le thread HTTP.
- **Consommateur** (`MailProcessor`) : charge le template Handlebars, interpole, envoie via `nodemailer` (SMTP `MAIL_HOST:MAIL_PORT`). `attempts` + `backoff` BullMQ ; échec d'envoi → retry, puis job en échec (loggé, sans casser le parcours HTTP déjà répondu).
- **Isolation** : file dédiée `mail`, distincte des futures files métier. **Interne** — pas de contrat inter-services (les `identity.*` inter-services passent par **Kafka**, STORY-027).

### Jetons (vérification & invitation)

- **Génération** : `crypto.randomBytes` (haute entropie) → jeton **en clair** uniquement dans l'URL de l'e-mail ; **hash sha256** stocké (`*_TokenHash`) + expiration (`*_ExpiresAt`). Haute entropie ⇒ sha256 suffit (bcrypt réservé aux mots de passe humains — cohérent avec le refresh de STORY-024).
- **Résolution** : hash du jeton présenté → lookup index `sparse` → vérifier expiration → **usage unique** (effacer le hash après succès).
- **TTL** : vérification `24h`, invitation `72h` (défauts, configurables).

### Sécurité / cohérence (`.agents/rules/securite.md`)

- **Anti-énumération** : `verify-email`/`accept-invitation` → messages **génériques** sur jeton invalide/expiré ; `resend-verification` **authentifié** (pas d'e-mail en entrée → pas d'oracle) ; invitation d'un e-mail déjà pris → **409 générique**.
- **Throttle** : `resend-verification` et `accept-invitation` **débit-limités** (endpoints publics/sensibles) — en plus du throttler global (STORY-023).
- **Atomicité invitation** : `User(INVITED)` + `Membership` créés dans **une transaction** (replica set `rs0`), même patron que `register` (STORY-023) ; rollback complet sur échec.
- **`emailVerified` à l'acceptation** : l'invité a reçu le lien sur son adresse → `emailVerifiedAt` renseigné à l'acceptation (pas de double vérification).
- **Aucun secret** en clair ; jetons **jamais** journalisés ; liens via `APP_PUBLIC_URL`.

### Cas limites

- **Jeton déjà consommé** (double clic) : second appel → jeton absent → **message générique** (pas de 500).
- **Jeton expiré** : message générique ; l'utilisateur peut `resend-verification` (vérif) ; l'invitation expirée exige un nouveau `resend-invitation` par l'admin.
- **Invité qui n'accepte jamais** : reste `INVITED` (aucun `passwordHash`) ; ne peut pas `login` (pas de hash → 401 générique via le chemin temps-constant de STORY-024). Nettoyage/relance = STORY-026.
- **Register puis re-register même e-mail** : bloqué en amont (unicité e-mail, STORY-023) — pas de double e-mail de vérification.
- **Mail indisponible** (Mailhog/SMTP down) : le job **retry** en tâche de fond ; le parcours HTTP a déjà répondu (register/invite réussissent, l'e-mail suivra) — dégradation propre.
- **`resend` sur un utilisateur déjà vérifié / déjà actif** : no-op idempotent (vérif) / **409** (invitation d'un non-`INVITED`).

---

## Dependencies

**Stories prérequises :**
- **STORY-022** ✅ (infra : `QueueModule`/BullMQ, `redis`, `mailhog` dans le compose racine, socle `common/`).
- **STORY-023** ✅ (champs `User` de vérif/invitation + index, `Membership`, `UsersService`, patron de transaction, hook `enqueueVerificationEmail` posé inerte).
- **STORY-024** ✅ (`issueSession` réutilisé par `accept-invitation`, `EmailVerifiedGuard`/`@AllowUnverified`, chaîne de guards `[TENANT_ADMIN]` pour l'invitation, throttle, `PasswordService`).

**Stories débloquées par celle-ci :**
- **STORY-026** (gestion users : étend `/users` en CRUD, applique le garde-fou dernier admin, changements de rôle, seed `PLATFORM_ADMIN` ; s'appuie sur les `Membership` créés par l'invitation).
- Rend le claim `emailVerified` **opérant** → l'`EmailVerifiedGuard` protège réellement les endpoints métier des verticaux (à partir de STORY-028).

**Dépendances externes :**
- `nodemailer` (transport SMTP) + `handlebars` (templates) — repris d'`expert-comptable`. `@nestjs/bullmq`/`bullmq` déjà présents (STORY-022). **Mailhog** (déjà dans le compose racine) = SMTP dev. Aucune clé/compte tiers (SMTP prod = ops différées).

---

## Definition of Done

- [x] `MailModule` (Mailer + Processor + templates `verification.hbs`/`invitation.hbs` + file `mail`) créé ; envoi **asynchrone** via BullMQ, rendu Handlebars, SMTP Mailhog en dev, retries/backoff.
- [x] Vérification e-mail : `enqueueVerificationEmail` **implémenté** ; `GET /auth/verify-email` (@Public) ; `POST /auth/resend-verification` (@AllowUnverified, throttlé). Jetons hachés/expirants/usage unique.
- [x] Invitations : `InvitationService.invite` **atomique** (`User INVITED` + `Membership TENANT_USER`) + `POST /users` `[TENANT_ADMIN]` + `POST /users/:id/resend-invitation` ; `POST /auth/accept-invitation` (@Public) → mot de passe + activation + `emailVerifiedAt` + `issueSession`.
- [x] Anti-énumération (messages génériques) sur verify/accept/invite ; isolation d'org à l'invitation ; throttle sur resend/accept.
- [ ] Config + env : `MAIL_HOST/PORT/FROM`, `APP_PUBLIC_URL`, TTLs **OK** (désormais réellement lus par les services depuis `tokenTtl`) ; compose racine `auth-service` `depends_on mailhog` + défauts **OK**. ⚠️ `.env.example` **non vérifié** (accès refusé) — à confirmer : `MAIL_HOST/PORT/FROM`, `APP_PUBLIC_URL`, `EMAIL_VERIFICATION_TTL`, `INVITATION_TTL`, sans secret réel.
- [x] Swagger : tags `auth`/`users` — verify-email/resend/accept-invitation/invite/resend-invitation documentés (200/201/400/409, messages génériques).
- [x] Tests :
  - [x] Unitaires : `MailerService` (met en file le bon job) ; `MailProcessor` (rend le bon template) ; `AuthService.verifyEmail` (OK / expiré / invalide) ; `resendVerification` ; `InvitationService.invite` (atomique ; e-mail pris→409 ; rollback) + `resend` ; `AuthService.acceptInvitation` (OK / expiré ; session émise).
  - [x] e2e : register→job mail en file ; verify-email 200 (+ login `emailVerified:true`) ; invite 201 ; accept-invitation 200 (+ login invité) ; jetons invalides→génériques ; DTO invalides→400.
- [x] `npm run test:cov` ≥ seuils (65/90/90/90) ; `npm run test:e2e` vert ; suites STORY-022/023/024 vertes ; `eslint --max-warnings 0` ; `nest build` OK.
- [x] **CRITICAL — vérification docker** (`.agents/rules/qualite-verification.md`) : `docker compose up` → register → **e-mail de vérification présent dans Mailhog** (`http://localhost:8025/api/v2/messages`) → extraire le jeton → verify-email **200** → login `emailVerified:true` ; invite (JWT `TENANT_ADMIN`) → **e-mail d'invitation dans Mailhog** → accept-invitation **200** → login de l'invité OK. Résultats consignés en *Progress Tracking*.
- [ ] Revue de code (`/code-review`) — **à déclencher par l'utilisateur** (une revue story↔code informelle a été menée le 2026-07-07, cf. Progress Tracking ; 3 correctifs appliqués). Points d'attention : **anti-énumération**, **atomicité de l'invitation**, **hachage/usage-unique/expiration des jetons**, **isolation d'org**, **file mail interne** (pas de Kafka), **aucun secret en clair**.
- [x] Statut synchronisé (en-tête story + `sprint-status.yaml` + Progress Tracking).
- [x] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **`MailModule`** (Mailer + Processor BullMQ + templates + config SMTP) : **1.5 pt**
- **Vérification e-mail** (`enqueueVerificationEmail` réel, `verify-email`, `resend-verification`, jetons) : **1.5 pt**
- **Invitations** (`InvitationService.invite` atomique + `resend` + `accept-invitation` + `issueSession`) : **1.5 pt**
- **Tests (unit + e2e) + vérification docker Mailhog** : **0.5 pt**
- **Total : 5 points**

**Rationale :** presque intégralement **repris** d'`expert-comptable` (STORY-006 vérif e-mail + STORY-008 invitations + module mail) — risque réduit ; le neuf se limite à la **normalisation** (invitation → `Membership` au lieu de `tenantId/role`) et au branchement sur `issueSession` (RS256) et la file BullMQ déjà posée. 5 pts cohérents avec le sprint-plan (Sprint 4).

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **`verify-email` : `GET` (lien) vs `POST`** — **Recommandé :** **`GET /auth/verify-email?token=`** (reprise EC, cliquable directement depuis l'e-mail/lien frontend). *Alternative :* `POST` `{ token }` — plus « REST » pour une mutation, mais s'écarte d'EC ; à retenir si le frontend intercepte systématiquement le lien.
2. **Emplacement de l'invitation** — **Recommandé :** `POST /users` + `POST /users/:id/resend-invitation` dans un `UsersController` que **STORY-026 étendra** (CRUD), miroir d'EC. *Alternative :* un `InvitationsController` dédié — plus de surface pour peu de gain.
3. **Rôle à l'invitation** — **Recommandé :** `InviteUserDto.role?` **défaut `TENANT_USER`**, borné à `{TENANT_USER, TENANT_ADMIN}` ; la **gouvernance des rôles** (dont garde-fou dernier admin) reste **STORY-026**. *Alternative :* forcer `TENANT_USER` en 025 — plus simple, mais rouvrirait le DTO en 026.
4. **`resend-verification` : authentifié vs public** — **Recommandé :** **authentifié `@AllowUnverified`** (utilise `sub` → zéro énumération). *Alternative :* public `{ email }` + 200 générique — acceptable mais ouvre une surface d'énumération temporelle ; écartée.
5. **Session à l'acceptation** — **Recommandé :** `accept-invitation` **ouvre une session** (`issueSession`) et renvoie les jetons (l'invité est immédiatement connecté). *Alternative :* renvoyer 200 sans session (l'invité doit `login`) — friction inutile ; écartée.
6. **Templates** — **Recommandé :** reprendre `verification.hbs`/`invitation.hbs` d'EC (FR, simples) ; **ne pas** reprendre `kyc-submitted.hbs` (propriété du vertical / `kyc-service`).

### Notes diverses

- **Reprise, pas réécriture** : vérif e-mail = EC STORY-006 ; invitation = EC STORY-008 ; module mail = EC `modules/mail`. Le diff = normalisation `Membership` + `issueSession` RS256 + file BullMQ déjà câblée.
- **File mail = job interne** : conforme à la règle programme « Redis/BullMQ = jobs internes uniquement » ; les contrats inter-services restent **Kafka** (`identity.*`, STORY-027).
- **`emailVerified` devient opérant** : après cette story, l'`EmailVerifiedGuard` (câblé en STORY-024) protège réellement — à garder en tête pour les endpoints des verticaux (STORY-028+).
- **Pas de commit sans demande** : implémentation puis vérification (docker/Mailhog) ; commit uniquement sur demande explicite.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-07 : Créée (Scrum Master, BMAD) — statut `defined`.
- 2026-07-07 : Implémentée (dev) — `MailModule` (Mailer + Processor BullMQ + templates), vérification e-mail (`enqueueVerificationEmail` réel, `verify-email`, `resend-verification`), invitations (`InvitationService.invite`/`resend` + `accept-invitation` + `issueSession`), config/env `MAIL_*`/`APP_PUBLIC_URL`/TTLs, compose racine (`mailhog`). Statut → `in_progress`.
- 2026-07-07 : Revue story↔code — **2 correctifs appliqués** :
  1. **Isolation d'org sur `POST /users/:id/resend-invitation`** : le paramètre organisation était **ignoré** (`_organizationId`), permettant à un `TENANT_ADMIN` de relancer/ré-émettre le jeton d'un invité d'une **autre** organisation. Désormais l'invité doit appartenir à l'org de l'appelant (contrôle via le membership actif) ; sinon **409 générique** (`NOT_INVITED_MESSAGE`, pas d'oracle inter-org). Conforme AC « Isolation d'org à l'invitation ».
  2. **TTL de jetons réellement configurables** : `EMAIL_VERIFICATION_TTL` / `INVITATION_TTL` étaient validés + chargés dans `configuration.ts` mais **jamais lus** (les services codaient `24h`/`72h` en dur). Ajout de `common/utils/duration.util.ts` (`parseDurationMs`) ; `AuthService` et `InvitationService` lisent maintenant `tokenTtl`.
  - Tests ajoutés : `InvitationService.resend` (nominal ; non-INVITED→409 ; **autre org→409**), `parseDurationMs`. **Suite unitaire : 167/167 verte** ; `eslint --max-warnings 0` OK ; `tsc --noEmit` OK.
- 2026-07-07 : **Vérification docker/Mailhog e2e — TOUT VERT ✅** (`docker compose up`, image `auth-service` reconstruite). Deux **bugs supplémentaires** découverts et corrigés pendant la vérification :
  3. **Templates non packagés (bloquant)** : `nest-cli.json` avait `assets: [{ include: "**/*.hbs", outDir: "../dist" }]` → les `.hbs` étaient copiés **hors** de `dist/`, d'où `ENOENT .../dist/modules/mail/templates/verification.hbs` et **échec silencieux** de tous les envois (0 e-mail dans Mailhog). Corrigé en alignant sur `expert-comptable` (`assets: [{ include: "**/*.hbs", watchAssets: true }]`) — les templates atterrissent bien dans `dist/modules/mail/templates/`.
  4. **Échecs d'envoi silencieux** : `MailProcessor` ne journalisait que les succès. Ajout d'un handler `@OnWorkerEvent('failed')` (conforme §File mail interne « job en échec loggé ») pour tracer les échecs SMTP/template.
  - **Parcours validé de bout en bout** (image finale, emails réels dans Mailhog) : register → e-mail de vérification dans Mailhog → `verify-email` **200** → `login` `emailVerified:true` (role `TENANT_ADMIN`) ; invite (JWT admin) **201** → e-mail d'invitation dans Mailhog → `accept-invitation` **200** (session, `emailVerified:true`, role `TENANT_USER`, bonne org) → `login` invité **200**. **Fix A validé en live** : admin org A → `resend-invitation` d'un invité org B = **409** ; admin org B (même org) = **200**.
  - Récap qualité : `test:cov` 167/167, seuils OK (stmts 95.0 / branches 79.5 / funcs 97.2 / lines 95.1 ; gates 90/65/90/90) ; `test:e2e` 13/13 ; `eslint --max-warnings 0` OK ; `nest build` OK.
  - **Reste :** `/code-review` formel (à déclencher par l'utilisateur) ; `.env.example` à confirmer (accès refusé en session) ; **commit sur demande** (non commité).

**Effort réel :** TBD (rempli pendant/après l'implémentation).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
