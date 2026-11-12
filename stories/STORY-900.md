# STORY-900 : Inviter un utilisateur par SMS — un commercial sans e-mail reçoit son compte et se connecte avec son téléphone

Status: not_started

**Service :** `auth-service` (et `prospera-notification-service` pour l'envoi du SMS, voir Q2) · **Recette :** `prospera-recette`
**Points :** 13 (estimation ; à redécouper si le PO préfère livrer l'invitation avant la connexion par téléphone)
**Sprint :** non slottée ; à intégrer au planning avec STORY-365 (décision du PO, 2026-11-12)
**Prérequis :** aucun pour le cœur de la story. Consommateurs nommés : `reseau` (lie le commercial à son
compte), `pdv` (portefeuille du commercial connecté).
**Origine :** décision du PO du 2026-11-12, sur le manifeste de `reseau` (PR #414) : *« Ajoute la voie
invitation par SMS dans auth-service »*. Elle répond au cas `SANS_EMAIL` relevé en écrivant ce manifeste.
**Numéro :** pris dans la plage de Dev B (`STORY-900 → 1199`, `reserved_ranges` de `sprint-status.yaml`),
après un relevé du plus grand numéro sur toutes les branches, distantes et locales, le 2026-11-12 (plafond
réellement écrit : STORY-729 ; 730 → 899 est la plage de Dev A, inemployée).

---

## Le fait

La Reprise de février apporte les commerciaux du distributeur. `reseau` les reçoit sous la forme d'un
objet `reseau.commercial@1` : la personne à inviter et ses zones (manifeste de `reseau`, objet validé par le
PO le 2026-11-12). Le compte est créé **ensuite**, quand un administrateur l'invite depuis l'écran
« Commerciaux à inviter ».

Sur le terrain, beaucoup de commerciaux n'ont qu'un téléphone. Or **auth-service ne sait inviter que par
e-mail**, et ne sait connecter que par e-mail. Ce que le code montre le 2026-11-12 :

| Où | Ce qui bloque |
|---|---|
| `users/dto/invite-user.dto.ts` | `email` obligatoire (`@IsEmail() @IsNotEmpty()`) ; aucun champ téléphone |
| `users/schemas/user.schema.ts` | `email` : `required`, `unique` ; c'est l'identifiant de connexion. `phone` (STORY-123) est facultatif, libre, non unique, non vérifié : c'est une coordonnée d'affichage |
| `auth/dto/login.dto.ts` | `POST /auth/login` ne prend qu'un `email` |
| `users/invitation.service.ts` | le lien d'invitation part par la file `auth-notification` (e-mail SMTP) |
| `users/users.service.ts` | l'acceptation pose `emailVerifiedAt` : cliquer le lien prouve qu'on possède la boîte |
| `auth/token.service.ts` | le jeton porte `emailVerified` ; **huit services** le contrôlent, par douze gardes (`email-verified.guard.ts` dans auth, admin-panel, balance, bilan, document, dossier, expert-comptable, kyc ; plus les gardes d'accès de balance, bilan et dossier) |
| `kafka/outbox/identity-events.ts` | `identity.user.registered` ne transporte **pas** le téléphone (choix délibéré de STORY-123 : on ne diffuse pas une donnée personnelle « au cas où ») |

Conséquence aujourd'hui : un commercial sans e-mail reste `A_INVITER` dans `reseau`. Ses points de vente
restent rattachés, mais il ne se connecte jamais.

---

## Ce que la story livre

### 1. Un identifiant de connexion par téléphone

- Nouveau champ `telephoneConnexion` sur `User` : format E.164 (`+22870517794`), **unique** (index unique
  et `sparse`), normalisé à l'écriture. **Distinct de `phone`** (STORY-123), qui reste une coordonnée
  d'affichage libre et non vérifiée. On ne fait pas d'un champ libre un identifiant de connexion.
- Nouveau champ `telephoneVerifieLe` (date), pendant de `emailVerifiedAt`.
- `email` devient **facultatif** (index unique `sparse`). Règle d'écriture : **au moins un** des deux
  identifiants, `email` ou `telephoneConnexion`, sinon refus `IDENTIFIANT_DE_CONNEXION_ABSENT`.
- Les comptes existants ne bougent pas : ils ont tous un e-mail. Aucune migration de données.

### 2. L'invitation par SMS

- `POST /users` accepte `email` **ou** `telephone` (au moins un). Avec un e-mail, rien ne change.
- Avec un téléphone seul : même création atomique (`User` `INVITED` + `Membership`), même jeton à durée de
  vie, même événement dans la transaction. Le lien d'invitation part **par SMS** (Q2).
- Le texte du SMS est écrit en **GSM-7, sans accent** : un seul caractère hors de cette table fait passer
  le message en UCS-2, la capacité tombe de 160 à 70 caractères et la facture double, sans erreur
  (leçon de `notification-service`). Le lien tient dans un segment ; le test le vérifie.
- `POST /users/:id/resend-invitation` renvoie par le canal de l'invitation.
- Un téléphone déjà porté par un compte actif est refusé (`TELEPHONE_DEJA_UTILISE`), comme l'e-mail
  aujourd'hui.

### 3. L'acceptation vérifie le téléphone

- `POST /auth/accept-invitation` : pour une invitation par SMS, l'acceptation pose `telephoneVerifieLe`
  (recevoir le SMS prouve qu'on possède le téléphone), comme elle pose `emailVerifiedAt` pour un e-mail.
- Elle ouvre la session comme aujourd'hui.

### 4. La connexion et le mot de passe oublié par téléphone

- `POST /auth/login` accepte `email` **ou** `telephone` avec le mot de passe. Le champ `email` reste
  accepté tel quel : aucun client existant ne casse. Le plafond de tentatives (`@Throttle`) vaut par
  identifiant.
- `POST /auth/forgot-password` et `POST /auth/reset-password` : par SMS quand le compte n'a que le
  téléphone. La réponse reste identique, que le compte existe ou non (pas d'énumération des numéros).

### 5. Ce que porte le jeton : une identité vérifiée, pas seulement un e-mail vérifié

- Nouveau claim **`contactVerifie`** = `emailVerifiedAt != null` **ou** `telephoneVerifieLe != null`.
- `emailVerified` reste dans le jeton, inchangé : les onze gardes existantes continuent de fonctionner
  sans être touchées.
- ⚠️ Un oubli à éviter : `issueSession(…, emailVerified = true, …)` a pour défaut `true` (session ouverte
  à l'acceptation d'une invitation par e-mail). Pour une invitation par SMS, l'appel doit passer
  `emailVerified: false` explicitement, sinon le jeton ment.
- Les modules du programme v3 (`reseau`, `pdv`, `catalogue`, `stock`, et ceux de la coque
  `prospera-app`) contrôlent **`contactVerifie`** dès leur première gate. C'est là que travaillent les
  commerciaux. Recommandation à confirmer (Q1).
- Les huit services existants gardent `emailVerified` : un commercial n'y va pas. Un compte invité par SMS
  y est refusé, ce qui est voulu.

### 6. Ce que l'événement transporte

- `identity.user.registered` et `identity.user.updated` portent **`telephoneConnexion`** quand le compte en
  a un. C'est un identifiant de connexion, pas la coordonnée personnelle `phone` de STORY-123, qui reste
  non diffusée. Le consommateur est nommé : `reseau` lie le commercial au compte par
  (organisation, `telephoneConnexion`), comme il le fait par (organisation, e-mail).
- L'e-mail devient facultatif dans ces deux événements. **Contrat à amender** : chaque consommateur
  actuel d'`identity.*` doit tolérer un e-mail absent. À relever et à tester dans chacun avant la
  fusion (`expert-comptable`, `notification`, `paiement`, `balance`, `bilan`, `dossier`, `kyc`…). Un
  consommateur qui exige l'e-mail rejetterait le message.

---

## Questions au PO

| # | Question | Recommandation |
|---|---|---|
| **Q1** | Les modules v3 contrôlent `contactVerifie` au lieu d'`emailVerified` ? | **Oui.** L'autre voie (passer `emailVerified` à vrai pour un téléphone vérifié) ment dans le jeton et ouvrirait les services du cabinet à des comptes sans e-mail. |
| **Q2** | Par où part le SMS ? | **Par `notification-service`, en asynchrone** (outbox d'auth-service, puis un topic consommé par notification). Il sait déjà encoder, segmenter, facturer et gérer le « STOP », et Money Vibes détient le module `notification`. ⛔ Jamais un appel synchrone : l'IdP ne dépend d'aucune capacité métier (spine de `reseau`, AD-5). Si notification est arrêté, l'invitation attend dans la file ; la connexion n'en dépend jamais. |
| **Q3** | Qui paie le SMS d'invitation ? | Money Vibes, comme l'e-mail d'invitation aujourd'hui, sur le compte de la plateforme. À confirmer : le distributeur pourrait vouloir sa propre passerelle (STORY-649 a déjà tranché « SMS sous passerelle du client = zéro facturé »). |
| **Q4** | Un même téléphone pour deux distributeurs ? | **Non au v1**, comme l'e-mail : un identifiant = un compte. Un commercial qui travaille pour deux distributeurs a un compte et deux appartenances. |

---

## Critères d'acceptation

1. Inviter avec un téléphone seul crée `User` `INVITED` + `Membership` dans une transaction, publie
   `identity.user.registered` avec `telephoneConnexion`, et met un SMS en file. Aucun e-mail n'est envoyé.
2. Inviter sans e-mail ni téléphone rend `IDENTIFIANT_DE_CONNEXION_ABSENT` (400). Un téléphone déjà porté
   rend `TELEPHONE_DEJA_UTILISE` (409). Un numéro mal formé rend 400 avec le format attendu.
3. Le texte du SMS est en GSM-7 et tient dans un segment avec le lien : test sur le texte réellement émis.
4. Accepter l'invitation pose `telephoneVerifieLe` et ouvre une session dont le jeton porte
   `contactVerifie: true` et `emailVerified: false`.
5. Se connecter par téléphone et mot de passe ouvre une session ; par e-mail, rien ne change (tests
   existants verts, inchangés).
6. Le mot de passe oublié d'un compte sans e-mail part par SMS ; la réponse est la même pour un numéro
   inconnu.
7. Une gate `contactVerifie` laisse passer le compte invité par SMS ; une gate `emailVerified` le refuse.
8. Chaque consommateur actuel d'`identity.*` accepte un `identity.user.registered` sans e-mail : un test
   par consommateur, ou une liste écrite de ceux qui l'ignorent, avec la preuve.
9. Recette dans `prospera-recette`, pile levée depuis `origin/dev` : inviter un commercial par SMS (le SMS
   est capté par le faux agrégateur SMS de la recette, `paquets/recette-croisee/src/agregateur-sms.ts`),
   en extraire le lien, accepter, se connecter par téléphone. Le portefeuille dans `pdv` s'ajoute à la
   recette quand `pdv-service` existe.

---

## Hors périmètre

- L'écran « Commerciaux à inviter » de `reseau` (module d'écran `reseau`, Dev B, avec le manifeste).
- La vérification par SMS d'un téléphone ajouté plus tard à un compte qui a déjà un e-mail (aucun besoin
  nommé).
- La connexion sans mot de passe (code à usage unique à chaque connexion) : non demandée.
- La double authentification.

## Définition de « fini »

- Tests unitaires et e2e d'auth-service verts ; garde de câblage verte (STORY-643).
- `docker compose up` d'auth-service et de notification-service sans erreur d'injection (leçon de la gate
  Docker : des milliers de tests verts et un service qui ne démarre pas).
- Recette du critère 9 rejouée depuis `origin/dev` après fusion, images reconstruites.
- Le manifeste de `reseau` retire la mention « jusqu'à cette story, un commercial sans e-mail reste
  `A_INVITER` ».

## Convention Git

Une branche par dépôt touché, `MNV-900`, partie d'`origin/dev`. Commits préfixés `STORY-900`. PR en
« Rebase and merge ».
