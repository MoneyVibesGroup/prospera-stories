# STORY-974 : l'invitation des utilisateurs à la mise en service

Status: done

**Complexité :** moyenne (deux dépôts ; une route interne et un module neufs dans auth ; un champ facultatif de l'ordre
de mise en service et du bilan dans le catalogue ; aucun topic, aucune collection)

**Épic :** EPIC-146 (deux espaces : essayer, puis mettre en service ; FR-8, FR-42)
**Dépôts :** `MoneyVibesGroup/prospera-auth-service`, `prospera-platform-catalog-service`
**Plage :** groupe B, 930 → 979 ; réservée par A le 2026-11-18 sur décision de l'utilisateur (journal de A, « → B :
réponses de l'utilisateur à tes questions au PO », D-951-8 : « la story doit exister avant février »).
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 1 (Docker : non, D-L4-3).
**Dépend de :** STORY-938 / 948 (identité de service du moteur dans auth, `MOTEUR_JETON_SERVICE`, naissance) ;
STORY-951 (la mise en service d'un sous-ensemble, D-951-8) ; STORY-972 (`INSTANCE_ESPACE` dans auth).
**Suivante :** STORY-973 (le plan SMT propre).

**Sources lues :** spine du moteur AD-15 (« Ordre : console, route interne, `identity.org.created`, module `instance`,
invitation. Il y a un compte par espace, avec les mêmes identifiants ; l'invitation au réel part à la mise en
service ») ; PRD du moteur FR-42 (« Les comptes de l'essai sont recréés dans le réel avec le même identifiant de
membre ; leurs invitations partent à la mise en service. Rejoué deux fois, le dossier ne crée rien de plus »), FR-8,
FR-9 (messages d'identité), NFR-3, addendum §A-7 (« rôles et comptes (`auth-service`) ») ; épic EPIC-146 ; fiches
948 (D-948-5 → 8), 951 (D-951-7, D-951-8), 972 (D-972-5 → 9) ; journal de B (questions au PO : D-951-8 ; ⚠ Contrats de
948 et 972) ; journal de A (réponse de l'utilisateur, 18/11). Code relu sur `origin/dev` : auth `8661bbf`
(`JetonDuMoteurGuard`, naissance, comptes du jeu, `InvitationService`), catalogue `2c3a933` (`MisesEnService`,
`deciderMiseEnService`, `RouteInterneDAuthParHttp`, `NaissanceConfig`, contrat `mise-en-service.openapi.json`).

**Ce qui existait déjà (relu avant la fiche) :** auth n'a aucune route d'invitation pour le moteur. L'invitation
d'auth (`InvitationService.invite`) tire un identifiant NEUF et n'est ouverte qu'à un administrateur (jeton
d'utilisateur). Le catalogue met en service (951) sans rien demander à auth. Le dossier d'installation rejoué de
l'essai vers le réel (FR-8, « rôles et comptes ») n'existe pas : rien ne recrée les comptes de l'essai dans le réel.

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | `PUT /api/v1/interne/organisations/{organisationId}/invitations` existe dans auth, réservée à l'identité de service du moteur : sans jeton, avec un autre jeton, ou avec le jeton d'un utilisateur (même administrateur de la plateforme), 401 `IDENTITE_DU_MOTEUR_REQUISE` | unitaires (garde, métadonnées de la route) |
| AC-2 | Dans un espace d'essai, 403 `ESPACE_D_ESSAI_REFUSE` avant la lecture du corps (l'essai invite par la route d'auth existante, D-948-8) | unitaires |
| AC-3 | Chaque membre demandé naît dans le réel **sous l'identifiant qu'il a dans l'essai** (FR-42), `INVITED`, membre de l'organisation avec son rôle (`TENANT_ADMIN` ou `TENANT_USER`) et son rôle métier facultatif (du socle, proposé au métier) ; `identity.user.registered` et `identity.membership.changed` partent dans la transaction ; l'e-mail d'invitation part après la transaction, au nom de l'organisation | unitaires |
| AC-4 | **Idempotente** : un membre déjà là (même identifiant, même adresse, membre de l'organisation) n'est ni réécrit ni réinvité ; 201 si au moins un membre est invité, 200 sinon ; rejouée, rien de plus | unitaires |
| AC-5 | Refus nommés, rien d'écrit : 404 `ORGANISATION_INCONNUE` ; 422 `MEMBRE_EN_DOUBLE`, `COMPTE_DU_JEU_HORS_DU_REEL`, `TENANT_ROLE_INCONNU`, `TENANT_ROLE_NON_PROPOSE` ; 409 `MEMBRE_EN_CONFLIT` | unitaires |
| AC-6 | La mise en service du catalogue (`POST /mises-en-service/{org}`) reçoit `invites` (facultatif) : les utilisateurs de l'essai. Acceptée (201, ou 200 au rejeu), elle les invite par la route d'AC-1, sous l'identité du moteur ; l'issue est écrite dans le bilan (`invitations`), sans aucune donnée personnelle | unitaires, contrat publié |
| AC-7 | Auth injoignable ou en refus : la mise en service reste faite (c'est un fait) ; le bilan dit `A_REPRENDRE` ou `REFUSEES` (avec le code) ; l'ordre rejoué avec la liste reprend l'invitation, sans rien doubler | unitaires |
| AC-8 | Une mise en service refusée (409, 503) n'invite personne | unitaires |
| AC-9 | Tests relancés par chemin, lint des fichiers touchés, build, mutations rouges sur une assertion ; câblage du module racine (`app-cablage.invariant.spec.ts`) vert dans les deux services | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-974-1 — Une route d'auth, pas un geste du catalogue sur la base d'auth.** `PUT /api/v1/interne/organisations/
  {organisationId}/invitations`, sous `JetonDuMoteurGuard` (le même secret que la naissance et les comptes du jeu,
  `MOTEUR_JETON_SERVICE`), `@Public()` pour les gardes d'utilisateur : aucun jeton d'utilisateur ne passe. `PUT` comme
  les comptes du jeu (972) : l'ensemble des membres demandés est rendu présent, 201 / 200.
- **D-974-2 — Réel seulement.** L'invitation au réel part à la mise en service ; dans l'essai, la console invite par la
  route d'auth existante (D-948-8). La garde `EspaceReelGuard` rend 403 `ESPACE_D_ESSAI_REFUSE` avant le corps,
  symétrique d'`EspaceDEssaiGuard` (972).
- **D-974-3 — Le même identifiant de membre (FR-42).** Le membre naît sous le `userId` qu'il a dans l'essai, que le
  moteur transmet. Aucune table de correspondance (FR-42 : « le rafraîchissement s'appuie sur la même identité »).
- **D-974-4 — Idempotente par membre, refus en bloc.** Un membre présent (même identifiant, même adresse, appartenance
  à cette organisation, quel que soit son statut) est compté `existants`, rien n'est réécrit, rien n'est renvoyé : un
  invité qui n'a pas reçu son e-mail se relance par la route existante de la console (`resend-invitation`). Un
  identifiant pris par un autre utilisateur, une adresse prise sous un autre identifiant, ou un utilisateur présent
  hors de cette organisation : 409 `MEMBRE_EN_CONFLIT`, **aucun membre écrit** (une transaction). Un même identifiant
  ou une même adresse deux fois dans la demande : 422 `MEMBRE_EN_DOUBLE`. 1 à 200 membres par appel.
- **D-974-5 — Un compte du jeu ne va jamais au réel.** Une adresse du domaine réservé des comptes du jeu
  (`@jeu-demonstration.invalid`, 972) rend 422 `COMPTE_DU_JEU_HORS_DU_REEL` : la console ne les transmet pas.
- **D-974-6 — Le rôle.** `role` facultatif (`TENANT_ADMIN` | `TENANT_USER`, défaut `TENANT_USER`) : le fondateur de
  l'essai reste administrateur dans le réel. `roleMetier` facultatif, mêmes règles qu'à l'attribution et qu'aux comptes
  du jeu : du socle (`TENANT_ROLE_INCONNU`), proposé au métier de l'organisation (`TENANT_ROLE_NON_PROPOSE`).
- **D-974-7 — L'e-mail.** Même file BullMQ et même gabarit que l'invitation d'un administrateur
  (`send-invitation-email`, 5 essais), mis en file APRÈS la transaction, avec un jeton neuf par membre (même durée
  que l'invitation existante). `orgName` = le nom de l'organisation (et non « votre cabinet »), `inviterName` =
  `Prospera`, `orgId` = l'organisation (son identité d'envoi, STORY-610). Comme l'invitation existante, la mise en
  file est au mieux : un échec est journalisé, l'invité reste `INVITED`, la console le relance.
- **D-974-8 — La liste vient de l'ordre de la console.** Le catalogue du réel ne connaît pas l'essai (NFR-3 : aucun
  service d'un espace ne connaît l'adresse de l'autre) et le dossier d'installation (FR-8, « rôles et comptes ») n'est
  pas encore rejoué. L'ordre de mise en service reçoit donc `invites` (facultatif) : `[{ userId, email, prenom, nom,
  role?, roleMetier? }]`, lus par la console dans l'essai. Quand le dossier d'installation existera, l'élément « rôles
  et comptes » pourra recréer les comptes sans les inviter, et cet ordre ne fera plus que les inviter : ajout
  facultatif, annoncé.
- **D-974-9 — L'invitation suit la mise en service, sans la conditionner.** Le catalogue décide et écrit la mise en
  service comme en 951 (une transaction, `reception-definitive.enregistree`), PUIS appelle auth. Un refus de mise en
  service (409, 503, 404) n'invite personne. Auth injoignable (non configurée, délai, 5xx, 401, 403) : `A_REPRENDRE` ;
  auth en refus (autre 4xx) : `REFUSEES` avec le `code`. La mise en service reste 201 (ou 200) : elle est faite.
- **D-974-10 — Le bilan garde l'issue, pas la liste.** `invitations` (facultatif) = `{ etat: ENVOYEES | A_REPRENDRE |
  REFUSEES, demandes, invites?, existants?, code?, motif?, le }`, écrit par `$set` à chaque tentative. Aucun nom ni
  adresse dans la base du catalogue. L'ordre rejoué (200) **avec** `invites` reprend l'appel (auth est idempotente) ;
  sans `invites`, il rend le bilan tel quel.
- **D-974-11 — Pas de Docker (D-L4-3).** Un module Nest neuf dans auth (`InvitationsAuReelModule`) et un fournisseur
  neuf dans le catalogue : le câblage est prouvé par `app-cablage.invariant.spec.ts` (Nest résout tout le graphe,
  `preview`), sans pile. Le démarrage se verra à la première pile du lot où auth et le catalogue tournent (STORY-1080,
  recette croisée complète). Aucune dépendance, aucun Dockerfile, aucune variable neuve : le catalogue réutilise
  l'adresse d'auth et le secret de la naissance (`NAISSANCE_AUTH_URL`, `MOTEUR_JETON_SERVICE`, `NAISSANCE_DELAI_MS`).

## Hors de cette story

- le **dossier d'installation** rejoué de l'essai vers le réel (FR-8) ;
- les **écrans** de la console (mise en service et liste des invités) : groupe A pour ce lot (D-L4-2), information dans
  « ⚠ Contrats » ;
- la vérification « comptes et rôles » de FR-6 (« chaque compte créé avec son rôle, et l'invitation envoyée »).

## Preuves

**Fusionné le 2026-11-18** (annonce : stories #682, avant le code) :
- **auth #45** : `c8cd619` poussé, rejoué sous **`e83568d`** sur `dev` (arbre identique) ;
- **catalogue #61** : `17ddb56` poussé, rejoué sous **`a672a44`** sur `dev` (arbre identique).

Node 25 local, tests relancés par chemin, puis suites complètes :
- **auth** : `invitations-au-reel.spec.ts` 30/30 (garde et validation réelles par HTTP : sans jeton, autre secret, jeton
  d'un utilisateur ⇒ 401 `IDENTITE_DU_MOTEUR_REQUISE` sans appel du service ; essai ⇒ 403 avant le corps, même un corps
  faux ; 201 puis 200 ; six corps refusés 400 ; service : même identifiant, `INVITED`, rôle et rôle métier, événements,
  e-mail APRÈS la transaction au nom de l'organisation, rejeu sans rien renvoyer, membre neuf invité seul, tous les
  refus nommés sans écriture, E11000 traduit) ; `invitation.service.spec.ts` 24/24 (+2 : jeton, e-mail).
  Suite complète : 102 suites, 1 423 tests verts.
- **catalogue** : `services.spec.ts` 27/27 (+9 : invités après la réception définitive, issue au bilan validée contre
  le contrat publié, aucune donnée personnelle en base ; cinq refus de mise en service n'invitent personne ;
  `A_REPRENDRE` puis reprise au rejeu sans second événement ; rejeu sans liste sans appel ; `REFUSEES` ; horloge muette
  au rejeu) ; `invitations-au-reel.spec.ts` 18/18 (route, verbe, en-tête et corps ; 201/200, 4xx, 401/403/5xx,
  injoignable, délai ; DTO de l'ordre). Suite complète : 102 suites, 1 548 tests verts.
- **Câblage sans pile (D-974-11)** : `app-cablage.invariant.spec.ts` vert dans les deux services ; il rougit
  (`Nest can't resolve dependencies of the InvitationsAuReelService … TenantRolesService`) quand on retire `RbacModule`
  du module neuf. Sous Node 25, le binding natif de Confluent manque : le câblage et les suites Kafka se jouent avec une
  configuration jest qui double `@confluentinc/kafka-javascript` (preview n'instancie rien) — voir « Pièges » du journal.
- **Mutations** : 21/21 rouges sur une assertion (13 auth, 8 catalogue) ; quatre mutations écrites d'abord rendaient
  du code qui ne compilait pas (`0 total`), réécrites pour compiler.
- Lint des fichiers touchés, `tsc --noEmit`, `nest build` verts dans les deux services ; `git diff --stat` identique avec
  et sans `--ignore-cr-at-eol`.
- **Docker** : aucun (D-L4-3). Le démarrage réel d'auth (module neuf) et du catalogue (fournisseur neuf) se verra à la
  première pile du lot où ils tournent (STORY-1080).
