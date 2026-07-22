# STORY-124 : Changement d'adresse e-mail self-service **vérifié** (`POST /users/me/email` + confirmation sur la nouvelle adresse)

**Epic :** EPIC-005 — Identité & comptes (auth-service) — *epic CLOS au sprint 4 ; story **additive** de surface self-service, hors décompte d'epic (précédent : STORY-108)*
**Service :** `auth-service` (IdP, :3001, base `auth_service`)
**Réf. architecture :** `docs/architecture-auth-service-2026-07-04.md` §Contrat d'événements (`identity.*`, état absolu + outbox), §Vérification d'e-mail
**Réf. code livré :** **STORY-025** (vérification d'e-mail : `emailVerificationTokenHash` + `emailVerificationExpiresAt` + `GET /auth/verify-email` + file `MAIL_QUEUE`/BullMQ + Mailhog — **la mécanique à réemployer**) · **STORY-024** (`refreshTokenHash`, sessions) · **STORY-026** (`UsersController`, `existsByEmail`, index unique `email`) · **STORY-123** (`PATCH /users/me`, service de profil self-service, `identity.user.updated`)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** defined 📝
**Assigné à :** null
**Créée :** 2026-07-22
**Sprint :** 16

---

## User Story

**En tant que** membre d'un cabinet (`TENANT_USER` / `TENANT_ADMIN`),
**je veux** changer l'adresse e-mail de mon compte en **prouvant que la nouvelle est bien la mienne**,
**afin de** rester joignable et de continuer à me connecter quand je change d'adresse — sans qu'une faute de
frappe ou un tiers malveillant puisse me verrouiller **hors** de mon propre compte.

---

## Description

### Pourquoi une story à part

**STORY-123** livre le self-service « inoffensif » (prénom, nom, téléphone, mot de passe). L'e-mail est d'une
**autre nature** : c'est l'**identifiant de connexion**. Le modifier touche, d'un coup :

- l'**index unique** `email` du schéma `User` (collision ⇒ E11000) ;
- `emailVerifiedAt`, donc la **garde d'accès** (`emailVerified` est dans le JWT et conditionne les gates
  `@RequiresBilanAccess`/`@RequiresBalanceAccess`) ;
- l'**anti-énumération** : accepter naïvement une nouvelle adresse transforme la route en oracle
  « cette adresse est-elle déjà connue de PROSPERA ? » ;
- la **réversibilité** : une faute de frappe validée immédiatement (`kossi@cabinet.tg` → `kosi@cabient.tg`)
  **enferme définitivement** l'utilisateur dehors ;
- les **read-models** des relying parties, qui portent l'e-mail (`IdentityUserReadModel`, `expert-comptable`).

D'où la règle de cette story, qui en est le cœur :

> **L'adresse actuelle reste l'identifiant de connexion tant que la nouvelle n'a pas été confirmée par un clic
> dans un e-mail envoyé à la nouvelle adresse.** Rien n'est jamais écrit sur `email` avant cette preuve.

### La bonne nouvelle : la mécanique existe déjà

STORY-025 a livré **exactement** le rouage nécessaire : un token aléatoire, **stocké haché** (`createHash` sur
`randomBytes`), une expiration (`emailVerificationExpiresAt`, TTL configuré), un envoi via la file BullMQ
`MAIL_QUEUE` (Mailhog en dev), et une route de consommation `GET /auth/verify-email?token=`.
STORY-124 **duplique ce rouage sur une paire de champs dédiée** — sans jamais réutiliser les champs de la
vérification initiale, qui servent encore aux comptes non vérifiés.

---

## Scope

**Dans le périmètre :**

- **Schéma `User`** (additif) : `pendingEmail?: string`, `pendingEmailTokenHash?: string`,
  `pendingEmailExpiresAt?: Date` + index `sparse` sur `pendingEmailTokenHash` (patron exact des champs de
  vérification/invitation existants). **Aucune** migration.
- **`POST /api/v1/users/me/email`** (authentifié, tout membre) : `ChangeEmailDto`
  { `newEmail`, `currentPassword` } →
  - vérification du **mot de passe actuel** (bcrypt) — un e-mail ne se change pas avec une session volée seule ;
  - normalisation (`toLowerCase().trim()`, comme `register`) ;
  - **202** systématique (voir anti-énumération) ; envoi d'un e-mail de confirmation à la **nouvelle** adresse ;
  - `email` et `emailVerifiedAt` **inchangés** ; seuls les champs `pendingEmail*` sont écrits.
- **`GET /api/v1/auth/confirm-email-change?token=`** (**non authentifié** — on clique depuis une boîte mail,
  pas depuis l'app) : consomme le token → bascule `email = pendingEmail`, purge des trois champs `pendingEmail*`,
  `emailVerifiedAt` conservé/réarmé (l'adresse **est** prouvée), **révocation du `refreshTokenHash`**
  (l'identifiant a changé ⇒ on se reconnecte), émission d'`identity.user.updated`.
- **Notification de sécurité à l'ancienne adresse** : au moment de la **bascule**, un e-mail informe
  l'ancienne adresse que le compte a changé d'e-mail (filet anti-détournement : la victime d'une session volée
  l'apprend). Pas de lien d'annulation en v1 — juste l'alerte.
- **`DELETE /api/v1/users/me/email`** (ou champ `pendingEmail` remis à `null`) : **annuler** une demande en
  cours. Petit, mais c'est le seul recours en cas de faute de frappe avant expiration.
- **`GET /users/me`** : expose `pendingEmail` (lecture seule) pour que le front affiche
  « en attente de confirmation : … » — **additif** au `MeResponseDto`.
- **Événement** : réutilise `identity.user.updated` (STORY-123), **état absolu** portant le **nouvel** e-mail ;
  émis **à la bascule seulement**, dans la même transaction que l'écriture.
- **Throttle** serré sur `POST /users/me/email` (patron `auth.controller.ts` : 5/60 s).

**Hors périmètre (NE PAS déborder) :**

- **Mot de passe oublié** (non authentifié) : autre surface, à arbitrer par le PO (signalée par STORY-123).
- **Annulation *après* bascule** depuis l'e-mail d'alerte (lien « ce n'était pas moi » → rollback) : v2.
- **Changement de l'e-mail d'un autre membre par l'admin** : non demandé ; l'ouvrir permettrait à un admin de
  détourner le compte d'un collaborateur.
- **Unification avec la vérification initiale** (`emailVerificationTokenHash`) : **interdit** — les deux flux
  coexistent et leurs champs ne doivent pas se marcher dessus.
- **Frontend** → **FE-019**.

---

## User Flow

1. Kossi change de cabinet d'e-mail : il saisit `k.amegan@nouveau.tg` + son mot de passe →
   `POST /api/v1/users/me/email` → **202** « Un lien de confirmation a été envoyé à cette adresse ».
2. En base : `pendingEmail`, `pendingEmailTokenHash`, `pendingEmailExpiresAt` écrits. **`email` inchangé** —
   Kossi continue de se connecter avec son ancienne adresse, et l'écran affiche « en attente de confirmation ».
3. Il clique le lien reçu **sur la nouvelle boîte** → `GET /auth/confirm-email-change?token=…` → `email`
   bascule, les champs `pending*` sont purgés, son `refreshTokenHash` est effacé, `identity.user.updated` part
   en outbox → le read-model d'`expert-comptable` porte la nouvelle adresse.
4. Sa session ouverte ne se rafraîchit plus → `/login` → il se connecte avec **la nouvelle** adresse. L'**ancienne**
   ne fonctionne plus. Un e-mail d'alerte est arrivé sur l'ancienne boîte.
5. **Variante hostile** : il saisit l'adresse **d'un autre utilisateur PROSPERA**. Réponse : **202**, identique
   au cas nominal — mais **aucun** e-mail de confirmation n'est envoyé (à la place : un e-mail d'alerte
   « quelqu'un a tenté d'utiliser votre adresse » au propriétaire légitime). Kossi n'apprend **rien**.
6. **Variante faute de frappe** : le lien n'arrive jamais (adresse inexistante). Au bout du TTL la demande
   expire ; Kossi peut aussi l'annuler et recommencer. Il n'a **jamais** perdu l'accès à son compte.

---

## Acceptance Criteria

- [ ] **AC-01 — Rien ne change avant preuve** : après `POST /users/me/email` **202**, `GET /users/me` renvoie
      **l'ancien** `email` (+ `pendingEmail` renseigné) et le **login avec l'ancienne adresse fonctionne toujours**.
      C'est **le** critère central de la story.
- [ ] **AC-02 — Bascule effective** : après consommation du lien, `email` = nouvelle adresse, les trois champs
      `pendingEmail*` sont `undefined`, `emailVerifiedAt` est renseigné ; **login nouvelle adresse → 200**,
      **login ancienne adresse → 401**.
- [ ] **AC-03 — Mot de passe exigé** : `POST /users/me/email` sans `currentPassword` → **400** ; avec un mot de
      passe faux → **401**, **aucune** écriture, **aucun** e-mail envoyé.
- [ ] **AC-04 — Anti-énumération** : une adresse **déjà prise** par un autre compte renvoie **202** — le même
      statut, le même corps et un **temps de réponse comparable** au cas nominal. Aucun `409`, aucun message
      distinctif. Test dédié comparant les deux réponses **octet à octet**.
- [ ] **AC-05 — Aucun e-mail de confirmation vers une adresse déjà prise** : vérifié dans Mailhog (0 message de
      confirmation) ; à la place, un e-mail d'**alerte** au propriétaire légitime.
- [ ] **AC-06 — Token** : aléatoire cryptographique, **stocké haché** (jamais en clair), à usage **unique**
      (rejeu → **400/410**), expirant (TTL configuré). Token inconnu/expiré → erreur générique, **jamais** 500.
- [ ] **AC-07 — Course sur l'unicité** : si l'adresse est prise **entre** la demande et la confirmation, la
      bascule échoue proprement (E11000 intercepté → **409**), la demande est purgée, le compte reste **intact**
      sur son ancienne adresse. Jamais de 500, jamais de compte orphelin.
- [ ] **AC-08 — Révocation des sessions** : après bascule, un `POST /auth/refresh` avec un refresh token émis
      **avant** → **401**.
- [ ] **AC-09 — Alerte à l'ancienne adresse** : un e-mail est envoyé à l'ancienne adresse **au moment de la
      bascule** (visible dans Mailhog).
- [ ] **AC-10 — Annulation** : une demande en cours peut être annulée ; les trois champs `pendingEmail*` sont
      purgés et le token devient inutilisable.
- [ ] **AC-11 — Événement** : la bascule écrit `identity.user.updated` **dans la même transaction** que la mise
      à jour, avec le **nouvel** e-mail (état absolu, aucun secret) ; `expert-comptable` projette la nouvelle
      adresse dans `IdentityUserReadModel` (idempotent par `eventId`).
- [ ] **AC-12 — Isolation & throttle** : la route agit **toujours** sur l'utilisateur du JWT (aucun identifiant
      lu du corps/URL) ; au-delà du quota → **429** ; sans jeton → **401**.
- [ ] **AC-13 — Non-régression du flux de vérification initiale** : `POST /auth/register` →
      `GET /auth/verify-email` → `POST /auth/resend-verification` **inchangés** ; les champs
      `emailVerificationTokenHash`/`emailVerificationExpiresAt` ne sont **jamais** touchés par cette story.
- [ ] **AC-14 — Sa propre adresse** : `newEmail` == `email` actuel → **400** (pas de flux inutile).

---

## Technical Notes

### Composants

- **Étendu** : `users/schemas/user.schema.ts` (3 champs + index `sparse`) · `users/users.controller.ts`
  (`@Post('me/email')`, `@Delete('me/email')` — **après `@Patch('me')`, avant `@Patch(':id')`**, cf. AC-02 de
  STORY-123) · `auth/auth.controller.ts` (`@Get('confirm-email-change')`, publique comme `verify-email`) ·
  `users/users.service.ts` (recherche par `pendingEmailTokenHash`) · `organizations/dto/me-response.dto.ts`
  (`pendingEmail?`) · `mail/mail.constants.ts` (2 nouveaux types de job : confirmation, alerte).
- **Créé** : `dto/change-email.dto.ts`, gabarits d'e-mail (confirmation nouvelle adresse / alerte ancienne
  adresse / alerte adresse déjà prise).
- **Réutilisés inchangés** : `PasswordService`, `OutboxService`, `MAIL_QUEUE` (BullMQ), `ThrottlerGuard`,
  `IdentityTopic.USER_UPDATED` (créé par STORY-123).

### Anti-énumération — le point vraiment délicat

`register` **révèle déjà** l'existence d'une adresse (`existsByEmail` → conflit) : c'est un compromis assumé
ailleurs. **Ne pas le reproduire ici** : `register` est public et son message générique est un choix de
STORY-004 ; ici, la route est **authentifiée**, ce qui offrirait à n'importe quel compte cabinet un oracle
d'énumération de tout l'annuaire PROSPERA, une adresse à la fois. D'où **202 systématique**. Le coût est un
utilisateur qui attend un e-mail qui n'arrivera pas — acceptable, et c'est exactement le comportement des IdP
sérieux. **Aligner les temps de réponse** (faire le travail « à vide » plutôt que sortir tôt).

### Ce qu'il ne faut surtout pas faire

- ❌ Écrire `email` immédiatement puis « re-vérifier » : c'est le bug qui **enferme** l'utilisateur dehors.
- ❌ Réutiliser `emailVerificationTokenHash` : un compte non vérifié qui change d'e-mail écraserait son propre
  token d'activation.
- ❌ Renvoyer 409 sur adresse prise : oracle d'énumération.
- ❌ Oublier la révocation du refresh : l'identifiant a changé, la session doit être refaite.

### Edge cases

- Compte **non encore vérifié** qui demande un changement : autorisé (`pendingEmail` est indépendant), mais
  `emailVerifiedAt` reste `null` jusqu'à… la confirmation du **changement**, qui **prouve** l'adresse ⇒ à la
  bascule, le compte devient vérifié. Trancher explicitement au dev et **tester**.
- Demande **écrasée** par une seconde demande : la dernière gagne, l'ancien token devient inutilisable.
- Compte sans `passwordHash` (`INVITED`) → **401** (passer d'abord par l'acceptation d'invitation).
- `PLATFORM_ADMIN` (sans `tenantId`) : même comportement, aucune exigence d'org.

---

## Dependencies

**Prérequis :** **STORY-123** (⚠️ **bloquante** — fournit le service de profil self-service, le contrat
`identity.user.updated` et l'ordre de routes `me` avant `:id`), STORY-024 (sessions), STORY-025 (mécanique de
token + file d'e-mails + Mailhog), STORY-026 (index unique `email`), STORY-029 (read-models `expert-comptable`).

**Débloque :** **FE-019** (volet « changer mon e-mail » de l'écran « Mon profil »).

**Externes :** Mailhog (dev) — déjà dans le `docker-compose.yml` racine.

---

## Definition of Done

- [ ] Code implémenté (français) ; `email` **jamais** écrit avant preuve ; aucun token en clair en base ni en log.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ seuils du service (90/65/90/90), jamais baissés.
- [ ] Tests **unitaires** : DTO, génération/hachage/expiration du token, bascule, E11000 → 409, annulation,
      compte non vérifié, adresse identique → 400.
- [ ] Tests **e2e** : AC-01→AC-14, dont **AC-01 (l'ancienne adresse marche encore)** et **AC-04
      (202 indistinguable)** — les deux critères qui font la valeur de la story.
- [ ] **Vérification docker réelle** (stack complète, Mailhog) : demande **202** → ancien login **toujours OK** →
      clic du lien (token lu **dans Mailhog**) → nouveau login **200**, ancien **401**, refresh d'avant **401** →
      alerte reçue à l'ancienne adresse → adresse **déjà prise** → **202 sans e-mail de confirmation** →
      `outbox_events` `identity.user.updated` **SENT** → read-model `expert-comptable` porte la nouvelle adresse
      → rejeu du token **400** → sans jeton **401** → `/health` **200** partout. Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé (⚠️ demander une attention particulière sur l'anti-énumération et la course d'unicité).
- [ ] Statut synchronisé aux **3 endroits** ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Champs `pendingEmail*` + `POST /users/me/email` (mot de passe, normalisation, 202 systématique, throttle) :** 1 pt
- **`GET /auth/confirm-email-change` (bascule transactionnelle, E11000 → 409, révocation refresh, événement) + annulation :** 1 pt
- **E-mails (confirmation / alerte ancienne adresse / alerte adresse prise) + tests (dont anti-énumération et course) + vérif docker Mailhog :** 1 pt
- **Total :** 3 points

**Rationale :** aucune brique neuve — la mécanique token+e-mail est **livrée** par STORY-025 et le socle
self-service par STORY-123. L'effort réel est **la rigueur du protocole** (ne rien écrire avant preuve,
202 indistinguable, course d'unicité), pas le volume de code.

---

## Additional Notes

- **Un seul invariant à retenir** : *l'adresse de connexion ne change qu'après une preuve de possession de la
  nouvelle boîte.* Toutes les décisions ci-dessus en découlent mécaniquement.
- **Cette story ferme le triptyque demandé par le PO** — « un collaborateur peut modifier son e-mail, son mot
  de passe et son numéro de téléphone » : téléphone + mot de passe = **STORY-123**, e-mail = **STORY-124**.
  Le volet « l'administrateur met à jour les informations du cabinet » était **déjà livré** (STORY-023,
  `PATCH /organizations/me`, UI par FE-015).

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — extraite de STORY-123 parce que l'e-mail est l'**identifiant de
  connexion** : son changement exige un protocole de preuve (rien n'est écrit avant confirmation) et une
  réponse **indistinguable** sur adresse déjà prise. Mécanique de token/e-mail **réemployée** de STORY-025.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
