# STORY-125 : Mot de passe oublié — réinitialisation par e-mail, **tous personas** (cabinet `TENANT_*` **et** plateforme `PLATFORM_*` / admin-panel)

**Epic :** EPIC-005 — Identité & comptes (auth-service) — *epic CLOS au sprint 4 ; story **additive** de récupération de compte, hors décompte d'epic (précédent : STORY-108)*
**Service :** `auth-service` (IdP, :3001, base `auth_service`) — **unique** émetteur d'identité pour les DEUX frontends
**Réf. architecture :** `docs/architecture-auth-service-2026-07-04.md` §Vérification d'e-mail, §NFR-001 (bcrypt cost 12) · `docs/tech-spec-admin-panel-*.md` (le panel est un **BFF sans base** : il ne possède aucune identité, il proxifie l'IdP)
**Réf. code livré :** **STORY-025** (`emailVerificationTokenHash` + TTL + `MAIL_QUEUE`/BullMQ + `MailerService`/Handlebars + Mailhog — **la mécanique à réemployer**) · **STORY-024** (`refreshTokenHash`, `issueSession`) · **STORY-103/104** (`platformRole` = **donnée**, comptes plateforme **org-less**) · **STORY-109** (patron d'allowlist d'origines pilotée par env) · **STORY-123** (validateur de robustesse partagé, révocation de session) · **STORY-124** (`pendingEmail*`)
**Priorité :** **Must Have** ⚠️
**Story Points :** 5
**Statut :** done ✅
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-22
**Terminée :** 2026-07-22
**Sprint :** 16

---

## User Story

**En tant qu'** utilisateur de PROSPERA — collaborateur ou administrateur d'un cabinet (`TENANT_USER` /
`TENANT_ADMIN`) **aussi bien qu'**opérateur de la console interne Money Vibes (`PLATFORM_ADMIN`,
`PLATFORM_KYC_OFFICER`, `PLATFORM_SUPPORT`, `PLATFORM_AUDITOR`) —
**je veux** pouvoir **retrouver l'accès à mon compte quand j'ai oublié mon mot de passe**, en prouvant que je
possède la boîte e-mail associée,
**afin de** ne pas être **définitivement** exclu de l'outil sur un simple trou de mémoire.

---

## Description

### Le constat : aujourd'hui, oublier son mot de passe = perdre son compte

Vérification faite **dans le code** (`origin/dev`, 2026-07-22) :

| Surface | Ce qui existe | Réinitialisation possible ? |
|---|---|---|
| `auth.controller.ts` | `register`, `login`, `refresh`, `logout`, `verify-email`, `resend-verification`, `accept-invitation` | ❌ ni `forgot-password` ni `reset-password` |
| `users.controller.ts` | invite, list, `me`, `PATCH :id` (rôle+statut), delete, resend-invitation | ❌ aucune route ne touche au mot de passe |
| `platform-users.controller.ts` (admin) | `POST` (invitation org-less), `GET`, `PATCH :id` (rôle) | ❌ idem |
| `user-management.service.ts` | — | ❌ le mot au sens large n'y apparaît **pas une seule fois** |

⇒ **Il n'existe, dans tout l'IdP, aucun chemin — ni self-service, ni assisté par un administrateur — pour
redonner un mot de passe à qui l'a perdu.** `POST /users/me/password` (STORY-123) exige d'être **connecté** :
c'est du renouvellement, pas de la récupération. Le compte est **définitivement perdu**.

C'est une **falaise opérationnelle**, pas une gêne :

- côté **cabinet**, chaque collaborateur perdu est une réinscription complète (nouvelle adresse, nouvelle
  invitation, ancien compte fantôme dans les read-models) ;
- côté **admin-panel**, c'est pire : les comptes plateforme sont **seedés** (`seed-platform-admin.ts`) ou créés
  par **invitation org-less** (STORY-104). Un `PLATFORM_KYC_OFFICER` qui oublie son mot de passe **ne peut être
  débloqué par personne** — aucun `PLATFORM_ADMIN` n'a de route pour le faire. Le seul recours serait de
  rejouer un seed en base, à la main, en production.

### Ce que livre cette story

Un parcours de récupération **standard, en deux temps**, **partagé par les deux frontends** — parce qu'il n'y a
**qu'un seul IdP** :

```
POST /auth/forgot-password { email }        → 202 TOUJOURS (anti-énumération)  ┐
        ↓ e-mail avec lien à usage unique, TTL court                           │ non authentifié
POST /auth/reset-password  { token, newPassword } → 204 + sessions révoquées   ┘
```

Le panel d'administration **n'a rien à implémenter côté identité** : c'est un **BFF sans base**, il proxifie ces
deux routes exactement comme il proxifie le login (AP-01). Ce qui **change** entre les deux publics n'est pas la
logique — c'est **l'adresse du formulaire vers lequel pointe le lien du mail**.

---

## Le point dur n°1 — vers QUELLE application le lien doit-il pointer ?

**C'est la vraie difficulté de cette story, et elle est structurelle.**

Aujourd'hui, `MailerService` construit ses liens depuis **une seule** valeur de configuration, `mail.publicUrl`,
qui pointe vers **l'API elle-même** (`http://localhost:3001/api/v1` dans les tests) : `verify-email` et
`accept-invitation` sont des **`GET` que le backend traite lui-même**, un lien vers l'API suffit donc.

**Une réinitialisation ne peut pas fonctionner ainsi** : l'utilisateur doit **saisir un nouveau mot de passe**,
donc atterrir sur un **formulaire d'application front**. Or il y a **deux** applications :

- l'app cliente cabinet — **:3100** ;
- la console admin-panel — **:3110** (port distinct, cf. AP-01).

**Décision retenue : la cible est DÉDUITE DU COMPTE, jamais fournie par l'appelant.**

```
compte avec `platformRole` renseigné  → PASSWORD_RESET_URL_PLATFORM  (admin-panel)
compte sans `platformRole`            → PASSWORD_RESET_URL_TENANT    (app cliente)
```

C'est possible **parce que** les comptes plateforme sont **org-less** et identifiés par `platformRole`
(STORY-103/104) : la distinction existe déjà en base, il n'y a rien à inventer.

**Pourquoi surtout PAS laisser le client déclarer sa cible** (`{ email, redirectUrl }` ou un en-tête `Origin`) :
ce serait une **injection de lien / redirection ouverte** — n'importe qui pourrait déclencher l'envoi, à
l'adresse d'une **vraie** victime, d'un e-mail **authentiquement émis par PROSPERA** dont le lien pointe vers un
site contrôlé par l'attaquant, qui récolterait le token. Le token de réinitialisation ne doit **jamais** voyager
vers une origine que le serveur n'a pas choisie.

Les deux URL sont donc des **valeurs de configuration serveur** (patron `CORS_ALLOWED_ORIGINS` de STORY-109 :
allowlist explicite, jamais `*`), validées au démarrage (`env.validation`). Si un jour un vertical a son propre
déploiement, on ajoutera une entrée à la table — **pas** un champ dans la requête.

---

## Le point dur n°2 — l'anti-énumération

`POST /auth/forgot-password` est une route **publique** : c'est l'oracle d'annuaire idéal.

- **202 systématique**, corps identique, **quel que soit** le sort de l'adresse (inconnue, connue, suspendue,
  invitée). Jamais 404, jamais « aucun compte pour cette adresse ».
- **Temps de réponse aligné** : faire le travail « à vide » plutôt que sortir tôt (`login` utilise déjà un
  **hash bcrypt leurre** pour cela — `auth.constants.ts`, `prospera-dummy-bcrypt-placeholder` : c'est
  exactement le précédent maison à suivre).
- **Throttle sur deux axes** : par **IP** et par **adresse ciblée** — sans le second, un attaquant noie une
  boîte sous les e-mails de réinitialisation depuis des IP tournantes.

⚠️ **Cohérence avec l'existant** : `register` **révèle** l'existence d'une adresse (conflit sur
`existsByEmail`) — c'est un compromis assumé de STORY-004. Ne **pas** s'en autoriser ici : `register` est un
acte volontaire d'inscription, `forgot-password` est un formulaire anonyme à un champ qu'on peut boucler.

---

## Scope

**Dans le périmètre :**

- **Schéma `User`** (additif, patron exact des champs de vérification/invitation) :
  `passwordResetTokenHash?`, `passwordResetExpiresAt?` + index **`sparse`** sur le hash.
  **Aucune** migration ; **jamais** réutiliser `emailVerificationTokenHash` (un compte non vérifié écraserait
  son token d'activation — même règle qu'en STORY-124).
- **`POST /api/v1/auth/forgot-password`** (public) : `ForgotPasswordDto { email }` → normalisation
  (`toLowerCase().trim()`, comme `register`/`login`), **202 systématique**, throttle IP + adresse,
  e-mail de réinitialisation envoyé **uniquement** aux comptes **éligibles** (voir ci-dessous).
- **`POST /api/v1/auth/reset-password`** (public) : `ResetPasswordDto { token, newPassword }` →
  token haché/à usage unique/expiré → nouveau `passwordHash` (bcrypt cost 12, `PasswordService`) +
  **révocation du `refreshTokenHash`** + **purge des champs `passwordReset*`** + **purge d'un éventuel
  `pendingEmail*`** (STORY-124) → **204**.
- **Éligibilité** (déterminée **côté serveur**, invisible de l'appelant qui reçoit 202 dans tous les cas) :
  - compte **`ACTIVE` avec un `passwordHash`** → e-mail de réinitialisation ✅ ;
  - compte **`INVITED`** (jamais activé, pas de `passwordHash`) → **e-mail d'invitation renvoyé** à la place
    (c'est le bon parcours pour lui : `accept-invitation` définit son premier mot de passe) ;
  - compte **`SUSPENDED`** ou **supprimé** (`deletedAt`) → **aucun e-mail** (il ne peut pas se connecter de
    toute façon ; lui rendre un mot de passe n'aurait aucun sens) ;
  - adresse **inconnue** → aucun e-mail.
- **Deux personas, une seule logique** : aucune branche `TENANT_*` / `PLATFORM_*` dans le service **hormis** le
  choix de l'URL du formulaire (point dur n°1). Un `PLATFORM_KYC_OFFICER` se récupère par le **même** code.
- **E-mails** (gabarits Handlebars, patron `verification.hbs`/`invitation.hbs`) :
  1. **réinitialisation** (lien + durée de validité explicite) ;
  2. **confirmation de changement** envoyée **après** un reset réussi (filet : la victime d'un détournement
     l'apprend).
- **Configuration** : `PASSWORD_RESET_URL_TENANT`, `PASSWORD_RESET_URL_PLATFORM`, TTL du token
  (`tokens.passwordReset`, court — **1 h** recommandé, à trancher au dev), validées au démarrage.
- **Politique de robustesse du nouveau mot de passe** : **exactement** celle de `RegisterDto` — réutiliser le
  validateur partagé **déjà livré** par STORY-123 (`src/common/validators/password-policy.decorator.ts`,
  consommé par `register.dto.ts`), **jamais** en réécrire une seconde qui divergerait.

**Hors périmètre (NE PAS déborder) :**

- **Réinitialisation assistée par un administrateur** (« l'admin du cabinet remet le mot de passe d'un
  collaborateur ») : parcours **différent** et plus risqué (l'admin connaîtrait le secret, ou pourrait
  détourner un compte). Le self-service par e-mail couvre le besoin exprimé. **À rouvrir seulement** si le
  support constate des utilisateurs sans accès à leur boîte.
- **MFA / questions secrètes / historique de mots de passe** : rien de tel n'existe, ne pas l'introduire.
- **Déverrouillage d'un compte `SUSPENDED`** : c'est une décision d'**administration** (`PATCH /users/:id`),
  pas une récupération de secret.
- **Changement d'e-mail** → STORY-124. **Renouvellement authentifié** → STORY-123.
- **Frontends** → **FE-020** (app cliente) et **AP-09** (admin-panel).

---

## User Flow

### A — Collaborateur de cabinet (`TENANT_USER`)

1. Kossi ne se souvient plus de son mot de passe → « Mot de passe oublié ? » sur l'écran de connexion
   de l'app cliente (**:3100**) → il saisit son adresse → `POST /auth/forgot-password` → **202**
   « Si un compte existe pour cette adresse, un lien vient d'y être envoyé. »
2. Il reçoit l'e-mail ; le lien pointe vers **`PASSWORD_RESET_URL_TENANT`** (l'app **cliente**), token en
   paramètre.
3. Il saisit un nouveau mot de passe → `POST /auth/reset-password` → **204**. Ses sessions ouvertes sont
   révoquées, un e-mail de confirmation lui parvient.
4. Il se connecte avec le nouveau mot de passe. Le lien rejoué → **400** (usage unique).

### B — Opérateur plateforme (`PLATFORM_KYC_OFFICER`) — admin-panel

1. Même parcours, depuis l'écran de connexion de la **console admin** (**:3110**), via le **BFF** qui proxifie
   la route (le panel ne possède aucune identité).
2. L'IdP voit un compte porteur d'un `platformRole` ⇒ le lien pointe vers **`PASSWORD_RESET_URL_PLATFORM`**,
   c'est-à-dire **l'admin-panel** — jamais l'app cabinet. **L'opérateur n'a jamais eu à préciser où il était.**
3. Reset → 204 → reconnexion à la console. **C'est le scénario qui était, avant cette story, purement et
   simplement sans issue.**

### C — Parcours hostiles

4. Un attaquant saisit l'adresse d'un tiers → **202**, indistinguable ; la cible reçoit **au plus** un e-mail
   (throttlé par adresse), et n'importe quel spam de ce type reste sans effet sans accès à sa boîte.
5. Un attaquant boucle sur des adresses pour cartographier les clients de PROSPERA → **202 partout**, aucun
   signal, throttle IP.
6. Un compte `INVITED` fait « mot de passe oublié » → il reçoit son **invitation**, pas un reset — et retombe
   sur le bon parcours sans le savoir.

---

## Acceptance Criteria

- [ ] **AC-01 — Le parcours existe et fonctionne pour un `TENANT_USER`** : `forgot-password` → e-mail →
      `reset-password` → **204** → **login avec le nouveau mot de passe → 200**, **avec l'ancien → 401**.
- [ ] **AC-02 — ⚡ Le parcours fonctionne à l'identique pour un compte PLATEFORME** (`platformRole` renseigné,
      **sans `tenantId`**) : reset réussi → login → le JWT porte de nouveau ses `perms[]`/`roles[]`
      (STORY-103) → accès à la console. **Test dédié, distinct d'AC-01** : c'est le cas qui n'avait
      **aucune** issue avant cette story.
- [ ] **AC-03 — ⚡ Le lien pointe vers la BONNE application** : e-mail d'un compte cabinet → URL bâtie sur
      `PASSWORD_RESET_URL_TENANT` ; e-mail d'un compte plateforme → `PASSWORD_RESET_URL_PLATFORM`.
      **Vérifié dans Mailhog**, sur les deux personas.
- [ ] **AC-04 — ⚡ Aucune cible fournie par l'appelant n'est honorée** : un corps enrichi
      (`redirectUrl`, `returnTo`, `callback`…) → **400** (whitelist `class-validator`) ; un en-tête `Origin`
      hostile n'a **aucun** effet sur l'URL du lien. **Test dédié** — c'est la garde anti-redirection ouverte.
- [ ] **AC-05 — Anti-énumération** : adresse **inconnue**, **connue**, **suspendue** et **invitée** produisent
      la **même** réponse (statut **202** + corps **identique**, comparés **octet à octet**) et des temps de
      réponse **comparables**.
- [ ] **AC-06 — Éligibilité** (vérifiée dans Mailhog, jamais dans la réponse HTTP) : `ACTIVE` → e-mail de
      **reset** ; `INVITED` → e-mail d'**invitation** ; `SUSPENDED`/`deletedAt` → **aucun e-mail** ; inconnue →
      **aucun e-mail**.
- [ ] **AC-07 — Token** : aléatoire cryptographique, **stocké haché** (`createHash` sur `randomBytes`, patron
      `AuthService.hash`), **à usage unique** (rejeu → **400**), **expirant** (TTL configuré ; expiré → **400**).
      Token inconnu/malformé → **400** générique, **jamais 500**, **jamais** en clair en base ni dans les logs.
- [ ] **AC-08 — Révocation des sessions** : après reset, un `POST /auth/refresh` avec un refresh token émis
      **avant** → **401**. Une session volée ne survit pas à la récupération du compte.
- [ ] **AC-09 — Purge d'un changement d'e-mail en cours** : si `pendingEmail*` (STORY-124) était renseigné, le
      reset le **purge** — un attaquant qui aurait amorcé un détournement d'adresse le perd quand le
      propriétaire légitime récupère son compte.
- [ ] **AC-10 — Robustesse du nouveau mot de passe** : mot de passe faible → **400**, **avec la même règle**
      que `RegisterDto` (validateur **partagé**, pas dupliqué).
- [ ] **AC-11 — Throttle à deux axes** : par IP **et** par adresse ciblée ; au-delà → **429**. Une même adresse
      ne peut pas être noyée d'e-mails depuis des IP tournantes.
- [ ] **AC-12 — E-mail de confirmation** après reset réussi (visible dans Mailhog).
- [ ] **AC-13 — Configuration validée au démarrage** : `PASSWORD_RESET_URL_TENANT` et
      `PASSWORD_RESET_URL_PLATFORM` absentes/malformées ⇒ **le service refuse de démarrer** (patron
      `env.validation`) — jamais un lien construit sur `undefined` envoyé à un utilisateur.
- [ ] **AC-14 — Non-régression** : `register`, `login`, `refresh`, `logout`, `verify-email`,
      `resend-verification`, `accept-invitation` **inchangés** ; les champs
      `emailVerificationTokenHash`/`invitationTokenHash` **jamais** touchés ; `POST /users/me/password`
      (STORY-123) toujours opérationnel.

---

## Technical Notes

### Composants

- **Étendu** : `users/schemas/user.schema.ts` (2 champs + index `sparse`) · `auth/auth.controller.ts`
  (`@Post('forgot-password')`, `@Post('reset-password')`, **publiques**, `@Throttle` serré — patron du `@Post('login')`)
  · `auth/auth.service.ts` (`forgotPassword`, `resetPassword`) · `users/users.service.ts`
  (`findByPasswordResetTokenHash`) · `mail/mail.constants.ts` + `mail/mail.processor.ts` +
  `mail/mailer.service.ts` (2 gabarits, 2 types de job) · `config/configuration.ts` + `env.validation`.
- **Réutilisés inchangés** : `PasswordService` (bcrypt cost 12), `MAIL_QUEUE` (BullMQ) + Mailhog,
  `ThrottlerGuard`, `AuthService.hash`, le hash **leurre** d'`auth.constants.ts` (alignement des temps).
- **Aucune modification** de `admin-panel` côté **backend** : le BFF proxifie, il ne possède pas d'identité.

### Choix de l'URL — implémentation

```ts
// Déduit du COMPTE, jamais de la requête. Les comptes plateforme sont org-less
// et porteurs d'un `platformRole` (STORY-103/104) : la distinction existe déjà.
const baseUrl = user.platformRole
  ? this.passwordResetUrls.platform   // PASSWORD_RESET_URL_PLATFORM → admin-panel (:3110)
  : this.passwordResetUrls.tenant;    // PASSWORD_RESET_URL_TENANT   → app cliente (:3100)
```

> ⚠️ **Ne pas confondre avec `mail.publicUrl`.** Cette valeur existante pointe vers **l'API** et convient à
> `verify-email`/`accept-invitation`, qui sont des `GET` traités **par le backend**. Un reset exige un
> **formulaire front** : c'est une **nouvelle** paire de configuration, pas un réemploi de `publicUrl`.

### Alignement des temps de réponse

Le service **doit** effectuer un travail comparable dans les quatre cas (inconnue / active / invitée /
suspendue). `login` le fait déjà avec un `compare` bcrypt contre un hash leurre (`auth.constants.ts`) —
**reprendre ce précédent**, et le **tester** (un test qui mesure grossièrement l'écart, tolérant mais présent :
un écart d'un ordre de grandeur doit échouer).

### Sécurité — check-list

- Token **haché** en base ; **usage unique** ; **TTL court** (1 h) ; jamais journalisé.
- Réponse **202** invariable ; aucun message distinctif ; aucune donnée de compte dans la réponse.
- URL cible **serveur uniquement** (anti-redirection ouverte) — AC-04.
- Révocation du refresh + purge de `pendingEmail*` (le reset est un acte de **reprise de contrôle**).
- Throttle IP **et** adresse (AC-11).
- Le corps des requêtes n'est **jamais** journalisé.

### Edge cases

- Deux demandes successives : la **dernière** gagne, le token précédent devient inutilisable (écrasement).
- Reset d'un compte **non vérifié** (`emailVerifiedAt == null`, mais `ACTIVE` avec `passwordHash` — cas rare) :
  cliquer le lien **prouve** la possession de la boîte ⇒ **trancher explicitement au dev** si l'on en profite
  pour marquer l'e-mail vérifié. **Recommandation : oui**, et le **tester** — la preuve est strictement la même
  que celle de `verify-email`. Documenter la décision dans le service.
- Compte **plateforme sans `tenantId`** : aucun code du parcours ne doit exiger un `tenantId` (le piège
  classique de ce service — `GET /users/me` le gère déjà correctement).
- Course reset ⇄ changement d'e-mail (STORY-124) : le reset purge la demande en cours (AC-09).
- Mailhog indisponible en dev : la file BullMQ retente ; la réponse **202** ne dépend **jamais** de l'envoi.

---

## Dependencies

**Prérequis (✅ done) :** STORY-024 (sessions/`refreshTokenHash`), STORY-025 (token haché + TTL + file d'e-mails
+ `MailerService` + Mailhog), STORY-103/104 (`platformRole`, comptes plateforme org-less), STORY-109 (patron
d'allowlist par env).

**STORY-123** ✅ **livrée** (`done`, 2026-07-22) — a extrait le **validateur de robustesse partagé**
(`common/validators/password-policy.decorator.ts`) et le hash **leurre** d'`auth.constants.ts`
(`DUMMY_PASSWORD_HASH`, utilisé par `login`) : les deux briques d'anti-énumération/robustesse sont **prêtes**,
à consommer telles quelles (ne rien réécrire).

**Adhérence :** **STORY-124** (`defined`, même sprint 16) — AC-09 (purge de `pendingEmail*`) n'a de sens
qu'une fois 124 livrée ; si 124 glisse, l'AC devient sans objet (aucun champ `pendingEmail*` à purger),
**le reste de la story est intact**.

**Débloque :** **FE-020** (app cliente) et **AP-09** (admin-panel) — les deux écrans du parcours.

**Externes :** Mailhog (dev) — déjà dans le `docker-compose.yml` racine.
**Nouvelle configuration à injecter dans le compose racine** (⚠️ **non versionné** — même point ouvert que
STORY-109) : `PASSWORD_RESET_URL_TENANT`, `PASSWORD_RESET_URL_PLATFORM`.

---

## Definition of Done

- [ ] Code implémenté (français) ; token haché/usage unique/expirant ; URL cible **serveur uniquement** ;
      aucun secret ni corps de requête journalisé.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ seuils du service (90/65/90/90), jamais baissés ; nouveau code visé ~100 %.
- [ ] Tests **unitaires** : génération/hachage/expiration/usage unique, éligibilité par statut, choix de l'URL
      selon `platformRole`, purge `pendingEmail*`, révocation du refresh, validateur partagé.
- [ ] Tests **e2e** : AC-01→AC-14, dont **AC-02 (persona plateforme)**, **AC-03 (bonne app)**,
      **AC-04 (aucune cible fournie par l'appelant)** et **AC-05 (202 indistinguable)** — les quatre critères
      qui font la valeur *et* la sûreté de la story.
- [ ] **Vérification docker réelle** (stack complète, Mailhog, JWT RS256 réel), **sur les DEUX personas** :
      (1) cabinet — login KO → `forgot-password` **202** → lien lu **dans Mailhog** et pointant sur l'URL
      **tenant** → `reset-password` **204** → nouveau login **200**, ancien **401**, refresh d'avant **401**,
      rejeu du lien **400** ; (2) **plateforme** (compte seedé/invité org-less) — même séquence, lien pointant
      sur l'URL **admin-panel**, reconnexion à la console avec `perms[]` intacts ; (3) adresse **inconnue** →
      **202 sans e-mail** ; (4) compte **INVITED** → e-mail d'**invitation** ; (5) compte **SUSPENDED** →
      **aucun e-mail** ; (6) corps avec `redirectUrl` → **400** ; (7) throttle → **429** ;
      (8) `/health` **200** partout + non-régression `register`/`login`/`verify-email`.
      Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé — ⚠️ demander une attention explicite sur **l'anti-énumération**, **l'alignement des
      temps** et **la redirection ouverte**.
- [ ] Statut synchronisé aux **3 endroits** (en-tête, `sprint-status.yaml`, *Progress Tracking*) ;
      `completed_date` à la clôture.

---

## Story Points Breakdown

- **Champs `passwordReset*` + `POST /auth/forgot-password` (éligibilité, 202 invariable, alignement des temps, throttle 2 axes) :** 1,5 pt
- **`POST /auth/reset-password` (token usage unique, re-hash, révocation refresh, purge `pendingEmail*`, validateur partagé) :** 1,5 pt
- **Routage du lien par persona (2 URL de config + validation au démarrage + garde anti-redirection ouverte) + 2 gabarits d'e-mail :** 1 pt
- **Tests (unit + e2e sur les DEUX personas, dont anti-énumération et anti-redirection) + vérif docker double parcours :** 1 pt
- **Total :** 5 points

**Rationale :** la mécanique token/e-mail est **livrée** (STORY-025) et le patron d'allowlist par env aussi
(STORY-109). L'effort net tient dans **la rigueur du protocole** (202 invariable, temps alignés, cible
serveur-only) et dans le **double parcours** à prouver — cabinet *et* plateforme —, qui double le coût de
vérification sans doubler celui du code.

---

## Additional Notes

- **Pourquoi Must Have alors que 123/124 sont Should :** 123 (mot de passe/profil) et 124 (e-mail) améliorent
  le confort ; **125 est le seul filet entre un utilisateur et la perte définitive de son compte**. Pour la
  plateforme, c'est même une
  **impasse d'exploitation** : aucun `PLATFORM_ADMIN` ne peut aujourd'hui débloquer un opérateur, et le seul
  recours serait de rejouer un seed en base, en production, à la main.
- **Un seul IdP, deux consoles.** C'est ce qui rend la story économique (une implémentation) **et** délicate
  (le lien doit connaître sa destination). La déduction par `platformRole` marche **parce que** D15/STORY-104
  a fait des comptes plateforme des comptes **org-less** — une décision d'architecture prise pour d'autres
  raisons qui paie ici.
- **Ce qui reste ouvert après cette story :** l'utilisateur qui a perdu **l'accès à sa boîte e-mail**. Aucun
  parcours ne le couvre (et la réinitialisation par un administrateur a été écartée du périmètre). À rouvrir
  **si et seulement si** le support le constate — pas avant.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — **demandée explicitement par le PO** (« un utilisateur qui oublie son mot
  de passe doit être débloqué, qu'il soit admin ou user pour le cabinet, mais aussi au niveau de l'admin-panel »),
  après que STORY-123 eut signalé le trou. Écart **vérifié dans le code** : ni `forgot-password`, ni
  `reset-password`, ni réinitialisation assistée — le mot « password » n'apparaît **pas une fois** dans
  `user-management.service.ts` ni dans `platform-users.controller.ts`. Cadrée autour des **deux points durs**
  identifiés à la rédaction : (1) le lien doit atterrir sur **le bon frontend** parmi deux, sans jamais laisser
  l'appelant choisir la cible (redirection ouverte) ; (2) **202 invariable** avec temps alignés
  (anti-énumération), en s'appuyant sur le hash leurre déjà utilisé par `login`.
- 2026-07-22 : Révisée (Scrum Master) après clôture de STORY-123 (`done`). Corrigé les **numéros de story
  périmés** (ancien triptyque 115/116/117 → **123/124/125** ; 115→119 sont réservés au socle Assistant IA
  EPIC-026). STORY-123 requalifiée **recommandée → livrée** : le validateur de robustesse partagé
  (`common/validators/password-policy.decorator.ts`) et le hash leurre `DUMMY_PASSWORD_HASH`
  (`auth.constants.ts`, consommé par `login` à `auth.service.ts:182`) sont **prêts à consommer**. Périmètre,
  points (5) et AC inchangés. Statut inchangé : `defined`.
- 2026-07-22 : **Implémentée + VÉRIFIÉE DOCKER sur les DEUX personas**, `/code-review` + `/security-review`
  passés, **PR MNV-125 (auth-service) mergée « Rebase and merge » sur `dev`** (branche supprimée) → `done`,
  `completed_date: 2026-07-22`. Détail ci-dessous.

---

## Implementation Notes (2026-07-22)

**Fichiers.** `user.schema.ts` (+ `passwordResetTokenHash` / `passwordResetExpiresAt`, index `sparse`) ·
`users.service.ts` (`setPasswordResetToken` / `findByPasswordResetTokenHash` / **`applyPasswordReset`** —
une seule écriture atomique : `$set` du hash + `$unset` de `passwordReset*`, `refreshTokenHash` **et**
`pendingEmail*` de STORY-124) · `auth.service.ts` (`forgotPassword` / `resetPassword` + helpers
`resetUrlFor` / `throttleResetByEmail` / `enqueueMailBestEffort` ; injecte `REDIS_CLIENT`) ·
`auth.controller.ts` (2 routes `@Public` + `@Throttle 5/60s`) · `forgot-password.dto.ts` /
`reset-password.dto.ts` (le second réutilise le **validateur partagé** de STORY-123) ·
`invitation.service.ts` (`resendForRecovery`) · 2 gabarits hbs + `MailerService` + `MailProcessor` ·
`configuration.ts` / `env.validation.ts` (2 URL **requises** + `PASSWORD_RESET_TTL`, défaut 1 h).

**Décisions de dev tracées dans le code :**
1. **Le throttle par adresse est compté AVANT la recherche du compte** — c'est ce qui rend le `429`
   **indépendant de l'existence** du compte (donc non-oracle). Prouvé en docker sur une adresse **inexistante** :
   202, 202, 202, **429**.
2. **Fail-open si Redis est indisponible** : on journalise et on continue (le throttle **par IP** reste la
   garde de base). Transformer une panne Redis en déni de service du reset serait pire que le risque couvert.
3. **`resetPassword` n'exige pas un compte `ACTIVE`** : un jeton n'est émis qu'aux comptes actifs, et `login`
   bloque déjà les suspendus. Seul `deletedAt` est refusé explicitement (400 générique).
4. **`resendForRecovery` déduit tenant/plateforme du `platformRole`** (et non d'un `organizationId` absent en
   contexte public) : sans cela, un invité **tenant** aurait reçu l'e-mail d'accueil « la plateforme PROSPERA ».

**Qualité.** Lint **0** · build OK · **449 unit** (50 suites) + **108 e2e** (9 suites, dont un spec dédié
STORY-125) · couverture **96.81 / 88.67 / 98.02 / 96.83** (seuils 90/65/90/90 tenus). Specs e2e montant
`AuthController` mises à jour (`REDIS_CLIENT` + config `passwordReset`).

## Vérification docker (stack neuve `down -v`, Mailhog, JWT RS256) — **les DEUX personas**

- **AC-01 (cabinet)** — `forgot` **202** → lien lu **dans Mailhog** → `reset` **204** → login **nouveau 200** /
  **ancien 401** ; en base `passwordReset*` **purgés** et `refreshTokenHash` **absent**.
- **⚡ AC-02 (plateforme — le scénario jadis SANS ISSUE)** — `PLATFORM_ADMIN` seedé : `forgot` **202** →
  `reset` **204** → **login console 200**, le JWT reporte **`PLATFORM_ADMIN`**.
- **⚡ AC-03** — lien **cabinet → `localhost:3100`**, lien **plateforme → `localhost:3110`** (vérifié sur les
  liens réels extraits de Mailhog). La cible n'est jamais fournie par l'appelant.
- **AC-04** — corps avec `redirectUrl` → **400** (whitelist, anti-redirection ouverte).
- **AC-05** — adresse **inconnue** → **202 sans aucun e-mail** ; corps 202 **constant**.
- **AC-06 (éligibilité)** — `INVITED` → **nouvelle invitation renvoyée** (invitations 1→2), **0** e-mail de
  reset, **aucun** `passwordResetTokenHash` posé ; `SUSPENDED` → **202 sans e-mail**, aucun token.
- **AC-07** — **rejeu** du jeton de reset → **400** (usage unique). **AC-08** — refresh émis **avant** le
  reset → **401** (sessions révoquées).
- **AC-11** — throttle **par adresse** : 4ᵉ demande → **429** (sur une adresse **inexistante**, donc
  enumeration-safe). Throttle **par IP** actif sur la route (5/60 s).
- **AC-12** — e-mail de **confirmation post-reset** reçu.
- **AC-13** — le service **refuse de démarrer** sans/avec URL malformée : 3 cas unitaires dédiés
  (`env.validation.spec`) ; démarrage docker **OK** une fois les 2 URL fournies.
- `/health` **200** sur auth-service et expert-comptable.

⚠️ **Nouvelle configuration à injecter** : `PASSWORD_RESET_URL_TENANT` / `PASSWORD_RESET_URL_PLATFORM` ont été
ajoutées au `docker-compose.yml` **racine**, qui n'est **versionné nulle part** — même point ouvert que
STORY-109 (cf. mémoire « racine PROSPERA non versionnée »). À rejouer sur tout autre environnement.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
