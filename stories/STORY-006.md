# STORY-006 : Vérification de l'adresse e-mail

**Epic :** EPIC-001 — Comptes & authentification
**Réf. architecture :** S1.3
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian
**Créée le :** 2026-07-02
**Terminée le :** 2026-07-03
**Sprint :** 1
**Couvre :** FR-002

---

## User Story

En tant qu'**utilisateur inscrit (super-admin de compte ou collaborateur)**,
je veux **valider mon adresse e-mail via un lien reçu par courriel**,
afin de **prouver que je contrôle cette adresse et débloquer l'accès à la plateforme**.

---

## Description

### Contexte

STORY-004 a posé le **seam e-mail** : à l'inscription, un job Bull `send-verification-email { userId }` est mis en file `mail`, consommé par un `MailProcessor` **no-op** qui se contente de journaliser. STORY-005 a livré l'authentification et transporte déjà `emailVerified` dans le payload de l'access token, ainsi que la **chaîne de guards globale** `Jwt → Roles` (avec l'emplacement réservé pour `EmailVerified` entre les deux). STORY-006 **rend l'envoi réel** et **ferme la boucle de vérification** :

> `POST /auth/register` → job Bull → **génération d'un token aléatoire (TTL 24 h, hashé sha256 en base) + envoi de l'e-mail (Mailhog)** → l'utilisateur clique le lien → `GET /auth/verify-email?token=` renseigne `emailVerifiedAt` → l'utilisateur rafraîchit sa session et accède aux endpoints protégés.

Trois propriétés sont critiques :

- **Token à usage unique, non rejouable** : token **aléatoire** (haute entropie), **stocké hashé** (`emailVerificationTokenHash`, sha256 — cohérent avec la convention du schéma), TTL **24 h** (`emailVerificationExpiresAt`), **invalidé** dès consommation. Le token en clair ne vit que dans l'e-mail.
- **Fiabilité de l'envoi** : l'envoi passe par le **worker Bull** `mail` (retry ×5, backoff exponentiel — déjà configuré au producteur en STORY-004), de sorte qu'une panne SMTP transitoire ne perd pas l'e-mail.
- **Verrou d'accès déclaratif** : un nouveau maillon global `EmailVerifiedGuard` **bloque les endpoints authentifiés** tant que `emailVerified` est faux, sauf ceux marqués `@AllowUnverified()` (resend, logout, me). Le futur module Bilan hérite du verrou sans code supplémentaire.

Cette story **étoffe le `MailModule`** (producteur de token + `MailerService` nodemailer + templates Handlebars, consumer réel) et **complète `AuthModule`** (endpoints `verify-email` / `resend-verification`, `EmailVerifiedGuard`, décorateur `@AllowUnverified`).

### Périmètre

**Inclus :**
- **Génération de token de vérification** : `EmailVerificationService` (dans `AuthModule`) produit un token aléatoire (`crypto.randomBytes`), stocke `emailVerificationTokenHash = sha256(token)` + `emailVerificationExpiresAt = now + 24 h` sur le `User`, et renvoie le **token en clair** (jamais persisté en clair).
- **`MailProcessor` réel** (consumer `mail`) : sur `send-verification-email { userId }`, charge le `User`, **délègue** la génération du token à `EmailVerificationService`, construit le lien, et **envoie** l'e-mail via `MailerService` (nodemailer → Mailhog). Idempotent/robuste (user introuvable ou déjà vérifié → no-op loggué, pas d'échec).
- **`MailerService`** : transport nodemailer configuré par l'environnement (SMTP Mailhog en dev), rendu d'un **template Handlebars** de vérification, expéditeur `MAIL_FROM`.
- **`GET /api/v1/auth/verify-email?token=`** (`@Public`) : hash le token, retrouve le `User` par `emailVerificationTokenHash`, vérifie **non expiré**, renseigne `emailVerifiedAt`, **efface** les champs `emailVerification*` (usage unique). Token invalide/expiré/déjà consommé → **erreur claire** invitant au renvoi ; déjà vérifié → message idempotent.
- **`POST /api/v1/auth/resend-verification`** (authentifié, `@AllowUnverified()`, **limité 3/h/utilisateur**) : ré-enfile le job de vérification pour l'utilisateur courant s'il n'est pas déjà vérifié ; réponse générique.
- **`EmailVerifiedGuard`** global inséré dans la chaîne **entre `JwtAuthGuard` et `RolesGuard`** : bloque (**403**) toute route authentifiée si `emailVerified` est faux, sauf `@Public()` et `@AllowUnverified()`.
- **Décorateur `@AllowUnverified()`** posé sur `resend-verification`, `logout`, `me`.
- **Config** : `MAIL_HOST`/`MAIL_PORT`/`MAIL_FROM` + base d'URL du lien (`APP_PUBLIC_URL` / `FRONTEND_URL`), validées au boot ; `.env.example` + `docker-compose` mis à jour.
- **Tests** unitaires (token, verify, resend + rate limit, guard, mailer/rendu) + e2e (parcours complet, expiration/invalidité, resend, **présence de l'e-mail dans Mailhog** via son API HTTP `:8025`).

**Hors périmètre :**
- **Login/refresh/logout, `JwtAuthGuard`, `RolesGuard`** → **STORY-005** (livrés ; ré-utilisés ici).
- **`TenantStateGuard`** (matrice KYC/abonnement) → **STORY-014** (l'`EmailVerifiedGuard` n'est que le 2ᵉ maillon).
- **Invitation d'utilisateur / acceptation** (l'invité est vérifié à l'acceptation) → **STORY-008** (réutilisera `MailModule`).
- **Templates KYC / paiement** → EPIC-003 / EPIC-004 (ici, uniquement le template de vérification).
- **SMTP de production** (fournisseur réel) → exploitation ; Mailhog suffit en dev/CI.
- **Page frontend de confirmation** : pas de frontend en phase 1 — le lien cible directement l'API (voir Décisions ouvertes).

### Flux (utilisateur)

1. À l'inscription (STORY-004), le job `send-verification-email { userId }` est mis en file `mail`.
2. Le **`MailProcessor`** consomme le job : génère un token (24 h), stocke son hash sur le `User`, rend le template et **envoie l'e-mail** (visible dans Mailhog) contenant le lien `…/auth/verify-email?token=<raw>`.
3. L'utilisateur ouvre le lien → `GET /auth/verify-email?token=` : le service hash le token, retrouve le `User`, vérifie l'expiration, renseigne `emailVerifiedAt`, efface le token. Réponse **200** « E-mail vérifié ».
4. L'utilisateur (déjà connecté depuis STORY-005 avec `emailVerified:false`) **rafraîchit sa session** (`POST /auth/refresh`) → le nouvel access token porte `emailVerified:true` → les endpoints protégés deviennent accessibles.
5. Si le lien a expiré / est invalide : message clair + l'utilisateur appelle `POST /auth/resend-verification` (≤ 3/h) pour recevoir un nouveau lien.

---

## Acceptance Criteria

- [x] Le token de vérification est **aléatoire** (haute entropie, `crypto.randomBytes(32)`), **à usage unique**, **TTL 24 h**, et **stocké hashé** (`emailVerificationTokenHash = sha256(token)`, `emailVerificationExpiresAt`) — le token en clair n'est **jamais** persisté ni loggué. *(Vérifié en base : B non vérifié → hash 64-hex, aucun clair ; A vérifié → champs effacés.)*
- [x] `GET /api/v1/auth/verify-email?token=` est **public** (`@Public`), renseigne `emailVerifiedAt`, **efface** les champs `emailVerification*` (le lien ne peut pas être rejoué), et documente Swagger. Succès → **200** message clair.
- [x] Un token **expiré**, **inconnu** ou **déjà consommé** → **erreur claire** (`400`, format uniforme) invitant au renvoi, **sans divulgation** exploitable ; un compte **déjà vérifié** → réponse **idempotente** (pas d'erreur serveur).
- [x] `POST /api/v1/auth/resend-verification` est **authentifié** mais `@AllowUnverified()`, **limité à 3/h/utilisateur** (compteur Redis `resend:{userId}`), ré-enfile le job pour l'utilisateur courant **seulement s'il n'est pas déjà vérifié**, et renvoie une réponse **générique** ; au-delà de 3/h → **429**. *(Vérifié docker : `[200,200,200,429]`.)*
- [x] `EmailVerifiedGuard` **global** bloque (**403**, message clair) tout endpoint **authentifié** tant que `emailVerified` est faux ; les routes `@Public()` et `@AllowUnverified()` (resend, logout, me) restent accessibles. Ordre de chaîne respecté : `Throttler → Jwt → EmailVerified → Roles`.
- [x] L'e-mail est **réellement envoyé via le worker Bull `mail`** (retry ×5, backoff exponentiel) par `MailerService` (nodemailer + Handlebars) et **apparaît dans Mailhog** (destinataire, sujet « Vérifiez votre adresse e-mail », lien de vérification présents) — vérifié via l'API Mailhog `:8025`.
- [x] Après vérification, un **`refresh`** (ou re-login) fournit un access token `emailVerified:true` donnant accès aux endpoints protégés — **vérifié de bout en bout** (route protégée factice 403→200 en e2e ; `me` false→true en docker).
- [x] Le `MailProcessor` est **robuste** : `userId` introuvable ou utilisateur déjà vérifié → job traité sans erreur (loggué), pas d'e-mail inutile.
- [x] `docker compose up` fonctionne ; les tests STORY-001→005 restent **verts** ; **lint 0 warning** ; **seuils de couverture** (90/65/90/90) respectés ; nouvelles variables d'env validées au boot et documentées.

---

## Technical Notes

### Composants / fichiers
```
src/modules/mail/mail.module.ts                # + MailerService, EmailVerificationService, config
src/modules/mail/mail.processor.ts             # consumer réel : token + rendu + envoi
src/modules/mail/mailer.service.ts             # nodemailer transport + rendu Handlebars (nouveau)
src/modules/mail/templates/verification.hbs    # template e-mail de vérification (nouveau)
src/modules/mail/mail.constants.ts             # (existant) MAIL_QUEUE, job, payload

src/modules/auth/email-verification.service.ts # génération/validation du token (nouveau)
src/modules/auth/auth.controller.ts            # + GET verify-email, POST resend-verification
src/modules/auth/auth.service.ts               # + verifyEmail(), resendVerification()
src/modules/auth/dto/verify-email.dto.ts       # { token } (query) (nouveau)

src/common/guards/email-verified.guard.ts      # 2e maillon de la chaîne (nouveau)
src/common/decorators/allow-unverified.decorator.ts  # @AllowUnverified() (nouveau)

src/app.module.ts                              # insère EmailVerifiedGuard entre Jwt et Roles
src/config/env.validation.ts                   # + MAIL_HOST/PORT/FROM, APP_PUBLIC_URL
src/config/configuration.ts                    # + namespace `mail`
```

### Dépendances npm à ajouter
- `nodemailer` (+ `@types/nodemailer` en dev) — transport SMTP.
- `handlebars` — rendu de template e-mail (l'architecture impose Handlebars).
- (Réutilise `@nestjs/bullmq`, `ioredis`, `@nestjs/throttler` déjà présents.)

### Génération & validation du token (`EmailVerificationService`, AuthModule)
- **Émission** : `token = randomBytes(32).toString('hex')` ; `user.emailVerificationTokenHash = sha256(token)` ; `user.emailVerificationExpiresAt = now + 24h` ; **renvoie le token en clair** (pour le lien). Réutilise la convention sha256 (cf. `refreshTokenHash` de STORY-005 ; bcrypt réservé aux mots de passe).
- **Validation** (`verifyEmail(token)`) : `findOne({ emailVerificationTokenHash: sha256(token) })` ; si absent → erreur générique ; si `emailVerificationExpiresAt < now` → expiré ; sinon `emailVerifiedAt = now`, `$unset` des champs `emailVerification*` (usage unique). Comparaison du hash en base par **égalité indexable** (sha256 déterministe) — un index sur `emailVerificationTokenHash` accélère la recherche (à ajouter au schéma, sparse).
- **Idempotence** : si `emailVerifiedAt` déjà renseigné (token déjà effacé), renvoyer un message « déjà vérifié » sans 500.

### Envoi (`MailProcessor` + `MailerService`)
- Le producteur existe déjà (STORY-004 : `mailQueue.add(SEND_VERIFICATION_EMAIL_JOB, { userId }, { attempts: 5, backoff: exponential })`). **Ne pas** mettre le token dans le payload du job (secret hors file) : le **consumer** génère le token au moment de l'envoi.
- `MailProcessor.process` : charge `User` ; si introuvable ou déjà vérifié → log + return ; sinon `token = emailVerificationService.issueToken(user)` → `link = ${APP_PUBLIC_URL}/auth/verify-email?token=${token}` → `mailerService.sendVerificationEmail(user.email, { firstName, link })`.
- `MailerService` : `nodemailer.createTransport({ host: MAIL_HOST, port: MAIL_PORT, secure: false })` (Mailhog, sans auth) ; rend `verification.hbs` (compilé/caché) ; `from: MAIL_FROM`. Erreur d'envoi → **propagée** pour déclencher le retry Bull.

### `EmailVerifiedGuard` + `@AllowUnverified`
- `@AllowUnverified()` = `SetMetadata(ALLOW_UNVERIFIED_KEY, true)`.
- `EmailVerifiedGuard` (global) : si `@Public()` → laisse passer (pas d'utilisateur) ; si `@AllowUnverified()` → laisse passer ; sinon lit `request.user.emailVerified` → **403** (`ForbiddenException`, « Adresse e-mail non vérifiée ») si faux.
- **Ordre `APP_GUARD`** dans `app.module.ts` : `ThrottlerGuard → JwtAuthGuard → EmailVerifiedGuard → RolesGuard` (insertion du nouveau maillon après Jwt, avant Roles — conforme archi « Jwt → EmailVerified → Roles → TenantState »).
- **Instantané du token** : `emailVerified` provient du payload JWT (STORY-005). Après vérification, l'utilisateur doit **`refresh`** pour obtenir un token à `emailVerified:true` (le `issueSession` relit `emailVerifiedAt` en base). Comportement documenté (pas de relecture DB dans le guard — cohérent avec la décision STORY-005 de garder `emailVerified` dans le token).

### Rate limit du renvoi (3/h/utilisateur)
- Le throttler global est **par IP** ; le renvoi doit être **par utilisateur**. Deux options (cf. Décisions ouvertes) : (a) compteur **Redis** `resend:{userId}` `INCR`+`EXPIRE 3600` (max 3) ; (b) `ResendThrottlerGuard extends ThrottlerGuard` surchargeant `getTracker` pour renvoyer `req.user.userId` avec un throttler nommé `{ ttl: 3600000, limit: 3 }`. **Recommandé : (a)** explicite et lisible, s'appuyant sur `ioredis` déjà présent.

### Config & sécurité
- **`env.validation.ts`** : `MAIL_HOST` (défaut `mailhog`), `MAIL_PORT` (défaut `1025`), `MAIL_FROM` (requis ou défaut dev), `APP_PUBLIC_URL` (base du lien, défaut `http://localhost:3000/api/v1`). Namespace `mail` dans `configuration.ts`. `.env.example` + service `app` du `docker-compose` mis à jour.
- Le token en clair est **exclu** des logs (rédaction pino déjà en place ; ajouter `token` de la query si nécessaire). `emailVerificationTokenHash` n'est jamais renvoyé au client.
- **Anti-énumération** : `verify-email` renvoie un message générique sur token invalide (ne révèle pas si l'e-mail existe). `resend` étant authentifié, l'énumération n'est pas un vecteur.

### Points d'extension (seams)
- **STORY-008** (invitation) : réutilise `MailModule`/`MailerService` (template d'invitation) ; l'acceptation d'invitation vaut vérification e-mail.
- **STORY-012/013** (KYC) et **STORY-018** (paiement) : ajoutent leurs templates au `MailModule`.
- **STORY-014** : insère `TenantStateGuard` **après** `RolesGuard` (l'`EmailVerifiedGuard` reste le 2ᵉ maillon).

---

## Dependencies

**Stories prérequises :**
- **STORY-004** ✅ (seam `mail` : file Bull, job `send-verification-email`, champs `emailVerification*` du schéma `User`, producteur avec retry).
- **STORY-005** ✅ (`emailVerified` dans le payload JWT, chaîne de guards `Jwt → Roles` avec emplacement réservé, `refresh` relisant `emailVerifiedAt`, `@Public`/`@CurrentUser`, throttler).
- **STORY-002** ✅ (Redis/Bull, Mailhog fournis par `docker compose`).

**Stories débloquées par celle-ci :**
- **STORY-008** (invitation : réutilise `MailerService` + templates).
- **STORY-014** (matrice d'accès : l'`EmailVerifiedGuard` est un prérequis de la machine à états).
- Tout endpoint métier exigeant un e-mail vérifié (Tenant, KYC, Billing).

**Dépendances externes :** aucune en dev (Mailhog fourni). Ajout des paquets `nodemailer` (+ types) et `handlebars`. Nouvelles variables `MAIL_*` / `APP_PUBLIC_URL`. Un **SMTP de production** sera requis à l'exploitation (hors story).

---

## Definition of Done

- [ ] Code implémenté et commité sur une branche de fonctionnalité (`feature/STORY-006-verification-email`).
- [ ] Tests :
  - [ ] Unitaire `EmailVerificationService` : émission (hash sha256, expiry 24 h, token en clair non persisté) ; validation OK ; expiré → erreur ; inconnu → erreur ; usage unique (champs effacés) ; idempotence (déjà vérifié).
  - [ ] Unitaire `MailProcessor` : envoi nominal (token + lien + envoi) ; user introuvable / déjà vérifié → no-op ; échec d'envoi → propagé (retry Bull).
  - [ ] Unitaire `MailerService` : rendu du template (destinataire, lien présents), `from` correct (transport mocké).
  - [ ] Unitaire `EmailVerifiedGuard` : `@Public`/`@AllowUnverified` passent ; `emailVerified:false` → 403 ; `true` → passe.
  - [ ] Unitaire `resend` : ré-enfile si non vérifié ; no-op si déjà vérifié ; **rate limit 3/h** (4ᵉ → 429).
  - [ ] e2e : parcours complet `register → (job) → token en base → GET verify-email 200 → emailVerifiedAt renseigné → refresh → endpoint protégé accessible` ; token expiré/invalide → erreur ; resend limité ; **e-mail présent dans Mailhog** (API `:8025`).
- [ ] `npm run test:cov` passe et respecte les seuils (90/65/90/90).
- [ ] Lint (0 warning) et build OK ; tests STORY-001→005 toujours verts.
- [ ] Endpoints `verify-email` / `resend-verification` documentés dans **Swagger**.
- [ ] `env.validation` échoue au boot si une variable `MAIL_*` requise manque ; `.env.example` + `docker-compose.yml` mis à jour.
- [ ] `docker compose up` : parcours vérifiable de bout en bout (e-mail dans Mailhog, lien fonctionnel, accès débloqué après refresh).
- [ ] Revue de code (`/code-review`) — attention au **caractère usage-unique** du token et à l'**ordre de la chaîne de guards**.
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **`MailerService` (nodemailer + template Handlebars) + `MailProcessor` réel + config `MAIL_*` :** 1.5 pt
- **`EmailVerificationService` (émission/validation token) + endpoints `verify-email` / `resend-verification` :** 1.5 pt
- **`EmailVerifiedGuard` + `@AllowUnverified` + insertion dans la chaîne (ordre) :** 1 pt
- **Rate limit renvoi 3/h/utilisateur + tests unitaires & e2e (dont vérification Mailhog) :** 1 pt
- **Total : 5 points**

**Rationale :** peu de logique métier délicate, mais **plusieurs briques transverses** à assembler correctement : premier **envoi réel** (transport SMTP + template + worker fiable), nouveau **maillon de guard global** (ordre critique dans la chaîne), et **rate limit par utilisateur** (au-delà du throttler IP). Le token à usage unique et l'e2e « bout en bout jusqu'à Mailhog » ajoutent de la surface de test. Cohérent avec l'estimation initiale de 5 pts.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Cible du lien de vérification** — pas de frontend en phase 1.
   - **Recommandé :** le lien pointe **directement sur l'API** (`APP_PUBLIC_URL/auth/verify-email?token=`), qui renvoie une réponse **200 JSON** (ou une page HTML minimale de confirmation). `FRONTEND_URL` restera surchargeable quand un front existera.
   - *Alternative :* pointer vers une page front (inexistante en phase 1) — écarté pour l'instant.

2. **Locus de génération du token** — producteur vs consommateur.
   - **Recommandé :** **le consommateur** (`MailProcessor`) génère et stocke le token au moment de l'envoi ; le job ne transporte que `userId` (pas de secret dans Redis). Le renvoi passe par le même chemin (ré-enfilement).
   - *Alternative :* génération dans `AuthService` avec token dans le payload du job — écarté (secret en file).

3. **Rate limit du renvoi (3/h/utilisateur)** — par utilisateur, pas par IP.
   - **Recommandé :** compteur **Redis** `resend:{userId}` (`INCR` + `EXPIRE 3600`, max 3), explicite et testable.
   - *Alternative :* `ResendThrottlerGuard` surchargeant `getTracker` → `req.user.userId`.

4. **Rafraîchissement post-vérification** — `emailVerified` est un instantané du token.
   - **Recommandé (retenu STORY-005) :** après `verify-email`, l'utilisateur **`refresh`** pour obtenir `emailVerified:true`. Documenté dans la réponse de `verify-email`.
   - *Alternative :* relecture DB dans le guard — écarté (l'archi garde `emailVerified` dans le token).

5. **Endpoints `@AllowUnverified()`** — `resend-verification`, `logout`, `me` (et `verify-email` est `@Public`). À confirmer si d'autres routes « pré-vérification » sont nécessaires.

6. **Réponse de `verify-email`** — **200 JSON** générique (recommandé phase 1) vs page HTML de confirmation. La divulgation reste minimale sur token invalide (message générique).

### Notes diverses
- **Index schéma** : ajouter `UserSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true })` pour la recherche par hash (les champs existent déjà depuis STORY-004).
- **Réutilisabilité** : `MailerService` et le rendu Handlebars sont posés génériquement pour STORY-008 (invitation), EPIC-003 (KYC) et EPIC-004 (paiement).
- **Sécurité** : token en clair uniquement dans l'e-mail ; jamais en base, ni en réponse, ni en log. Usage unique strict (effacement des champs à la consommation).

---

## Progress Tracking

**Historique de statut :**
- 2026-07-02 : Créée (Scrum Master, BMAD)
- 2026-07-03 : Implémentée, testée et vérifiée sur docker — ✅ Completed (Developer, BMAD)

**Effort réel :** 5 points (conforme à l'estimation).

---

## Notes d'implémentation

### Décisions ouvertes — tranchées
1. **Cible du lien** : l'API directement (`APP_PUBLIC_URL/auth/verify-email?token=`), réponse **200 JSON**. `APP_PUBLIC_URL` par défaut `http://localhost:3000/api/v1` (surchargeable pour un futur front).
2. **Locus de génération du token** : **le consommateur** (`MailProcessor`) — le job ne transporte que `userId`, aucun secret dans Redis.
3. **Rate limit renvoi** : **compteur Redis** `resend:{userId}` (`INCR` + `EXPIRE 3600`), plafond `MAIL_RESEND_MAX_PER_HOUR` (défaut 3) → `429` au-delà.
4. **Rafraîchissement post-vérification** : conforme STORY-005 — l'utilisateur `refresh` pour obtenir `emailVerified:true` (pas de relecture DB dans le guard).
5. **`@AllowUnverified()`** posé sur `resend-verification`, `logout`, `me` ; `verify-email` est `@Public`.
6. **Réponse `verify-email`** : **200 JSON** générique ; message générique sur token invalide.

### Écart notable vs. plan initial
- **`EmailVerificationService` placé dans `MailModule`** (et non `AuthModule`) et **exporté** : il est partagé par le worker (`MailProcessor`) **et** par `AuthService.verifyEmail`. Cela évite une **dépendance circulaire `Auth ↔ Mail`** (AuthModule importe déjà MailModule). `MailModule` importe désormais `UsersModule`.
- **Template Handlebars** : le lien est rendu en `{{{verificationUrl}}}` (non échappé) car l'URL est **générée/fiable** ; `{{firstName}}` reste échappé (entrée utilisateur). Asset `**/*.hbs` copié vers `dist` via `nest-cli.json` (`watchAssets`) → présent au runtime (`__dirname/templates`).

### Fichiers clés
- **Mail** : `mail.module.ts` (imports UsersModule ; exporte EmailVerificationService), `mail.processor.ts` (consumer réel), `mailer.service.ts` (nodemailer + Handlebars), `email-verification.service.ts` (émission/consommation token), `templates/verification.hbs`.
- **Auth** : `auth.service.ts` (`verifyEmail`, `resendVerification` + quota Redis), `auth.controller.ts` (`GET verify-email`, `POST resend-verification`, `@AllowUnverified` sur logout/me), `dto/verify-email.dto.ts`, `dto/message-response.dto.ts`.
- **Common** : `guards/email-verified.guard.ts`, `decorators/allow-unverified.decorator.ts`, insertion dans la chaîne `app.module.ts`.
- **Data/config** : `users.service.ts` (+ `setEmailVerificationToken`/`findByEmailVerificationTokenHash`/`markEmailVerified`), `user.schema.ts` (index sparse `emailVerificationTokenHash`), `env.validation.ts` + `configuration.ts` (namespace `mail`), `docker-compose.yml`, `.env.example`.
- **Deps** : `nodemailer` + `@types/nodemailer` + `handlebars`.

### Résultats de vérification
- **Unitaires + e2e** : `25 suites / 137 tests` (unit) et `5 suites / 24 tests` (e2e) — **verts**. Couverture globale **99.49 % stmts / 85.34 % branches / 100 % fn / 99.45 % lignes** (seuils 90/65/90/90 respectés).
- **Lint** : `0 warning`. **Build** `nest build` OK ; asset `verification.hbs` copié dans `dist/modules/mail/templates/`.
- **Docker (`docker compose up`) — 17/0** : e-mail livré dans Mailhog (sujet + lien 64-hex) ; `verify-email` 200 puis **400** (usage unique) ; `refresh` → `emailVerified:true` de bout en bout ; token bidon → 400 ; renvoi `[200,200,200,429]` ; B reçoit ≥ 4 e-mails.
- **Invariants sécurité (Mongo)** : utilisateur vérifié → `emailVerifiedAt` renseigné, champs `emailVerification*` **effacés** ; utilisateur en attente → `emailVerificationTokenHash` = **sha256 (64 hex)**, aucun token en clair persisté.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
