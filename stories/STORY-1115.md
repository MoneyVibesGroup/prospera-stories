# STORY-1115 : la recette « essayer, puis mettre en service » — un cabinet prospect ouvre un essai, en sort, naît dans le réel avec ses invitations

Status: done

**Complexité :** moyenne (le second espace dans le profil de recette ; une recette croisée neuve, de bout en bout ;
aucun service ne change)

**Épic :** EPIC-146 (deux espaces : essayer, puis mettre en service ; FR-8, FR-21, FR-42, NFR-3)
**Dépôt :** `MoneyVibesGroup/prospera-recette` (B la modifie au lot 6). D'autres dépôts de B seulement si la recette
révèle un défaut (PR à part, écrite ici).
**Lot 6 :** ligne n° 6 de B au §5 de `PLAN-LOT-6-2026-11-23.md` (« Docker : recette complète ; Fini quand : parcours
vert de bout en bout sur pile neuve »). Identifiant réservé par le plan (§8).
**Suite de :** STORY-1080 (le cabinet installé par le moteur, par la console), STORY-1112 (les essais par le BFF),
STORY-1113 (la mise en service par le BFF, prouvée hors de la recette sur une pile à deux espaces), STORY-974 (les
invitations au réel), STORY-972 (les comptes du jeu, la connexion « en tant que »).
**Suivante :** STORY-1116 (cinq essais simultanés sur la même pile).

**Sources lues :** plan du lot 6 (§0 → §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état, pièges, ⚠ Contrats de 1080,
1112, 1113, 1103 ; questions D-1113-2 et D-1103-1) ; journaux de A, C, D (aucune demande ouverte à B avant cette story) ;
fiches STORY-1080, 1112, 1113 (D-1113-1 → 10, « Ce qui reste »), 1114, 1103, 974 (D-974-1 → 11), 972 (D-972-5 → 9), 948
(D-948-8). Code relu sur `origin/dev` : recette `a6da2ea` (profil, garde, `compose.ts`, `pile.ts`, `accueil.ts`,
`cabinet-moteur.recette.ts`) ; auth `b49d8ab` (naissance, comptes du jeu, `InvitationService`, `acceptInvitation`,
`SigningKeyService`, `POST /users`, `resend-invitation`, `NotificationClient`) ; catalogue `45971cf`
(`deciderMiseEnService`, `calculerEtat`, essais, naissance) ; BFF `c451b17` (`EssaisProxyService`, mise en service,
naissances, installations, KYC) ; kyc `9cef9cb` (`scripts/schemas/registre.mjs`). La preuve de 1113 (surcouche et
script de la session, non versionnés) donne la forme de la pile à deux espaces.

**Ce qui existait déjà (relu avant la fiche) :** la recette n'a **qu'un espace par pile** (`RECETTE_ESPACE`, STORY-929) :
un seul auth, un seul catalogue, un Kafka. Le BFF n'y reçoit aucun réglage (il prend ses amonts du compose racine). La
pile à deux espaces de 1113 vivait hors de la recette, avec une clé de signature écrite dans le scratchpad. Aucune route
ne fait entrer le **premier membre** d'une organisation née par le moteur dans l'essai (D-948-8 renvoie à « la route
d'auth existante », `POST /users`, qui exige un `TENANT_ADMIN` de l'organisation ; `PUT
/interne/organisations/{id}/invitations` est réel seulement, D-974-2) : 1113 posait les membres de l'essai en base.

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | Le profil de recette porte le **second espace** : `auth-essai`, `catalogue-essai` (`INSTANCE_ESPACE=ESSAI`), leur Kafka et leur Redis, bases distinctes dans le MongoDB de la pile, secret du moteur distinct ; le BFF reçoit ses deux amonts de l'essai ; levés à la demande seulement (la pile de base reste à cinq services) | garde du profil étendue ; pile |
| AC-2 | L'opérateur de la console a la même identité dans les deux espaces (D-1113-2, choix par défaut gardé) : les deux auth signent avec la même clé de recette, tirée par le paquet hors du dépôt ; aucune clé ni secret dans le dépôt | garde ; unitaires ; pile (le jeton du réel accepté par l'essai) |
| AC-3 | Aucun service de l'essai ne nomme une adresse du réel (AD-15 : auth, catalogue, Kafka, Redis, notification du réel) | garde (mutations) |
| AC-4 | **Le parcours, par le BFF** : un cabinet prospect ouvre son essai ; son administratrice y entre, invite un collègue par la vraie route, essaie sous un compte du jeu ; l'essai est signé ; le prospect **sort de l'essai et naît dans le réel** sous le même identifiant ; le moteur y installe `balance` et `bilan` (six vérifications `VERT`) ; la mise en service de `balance` et `bilan` invite les membres de l'essai (sans les comptes du jeu) ; chacun entre dans le réel par le lien reçu, sous son identifiant d'essai ; le cabinet y travaille (KYC approuvé, dossier client créé, `balance` ouvert) | recette `essai-mise-en-service` |
| AC-5 | Le réel ne voit pas l'essai avant la naissance (NFR-3) ; le rejeu de la mise en service ne double rien | recette |
| AC-6 | Recette complète sur **pile neuve**, images reconstruites depuis `origin/dev` après la fusion, volumes neufs : toutes les suites vertes, la neuve comprise | « Preuves » |
| AC-7 | Le manque du premier membre est nommé dans un ticket au groupe qui tient les dépôts, et la recette n'écrit en base que ce membre-là | ticket ; recette |

## Décisions (recommandations appliquées, contestables)

- **D-1115-1 — Le second espace vit dans le profil, pas dans une surcouche.** `docker-compose.recette.yml` déclare
  `kafka-essai`, `redis-essai`, `auth-essai` et `catalogue-essai` sous `profiles: ['recette']`, comme la comptabilité
  (1093) : la recette complète les lève sans `RECETTE_SURCOUCHES`, et la pile de base reste à cinq services (ils ne sont
  levés que par la recette qui les joue). Ce sont des **réglages** (images construites des dépôts d'auth et du
  catalogue, `env_file` de leur dépôt comme au compose racine, environnement, ports, sondes, ordre de démarrage) :
  aucun volume, aucun script. Kafka et Redis de l'essai sont sans volume (un état éphémère, effacé à `down`) ; les bases
  `auth_essai` et `catalog_essai` logent dans le MongoDB de la pile (`rs0`), à côté de celles du réel, comme en 1113.
- **D-1115-2 — Ports.** `auth-essai` sur `127.0.0.1:3021`, `catalogue-essai` sur `127.0.0.1:3023` (boucle locale
  seulement, comme la comptabilité), ceux de la preuve de 1113 ; Kafka et Redis de l'essai sans port publié : aucune
  collision avec 3001 → 3010, 6379, 9092 de la pile ni avec les piles de D (3411 → 3419).
- **D-1115-3 — Une identité d'opérateur commune aux deux espaces (D-1113-2 : le choix par défaut est gardé, la
  question reste ouverte).** Les deux auth reçoivent la même clé de signature (`JWT_SIGNING_KEY_PEM`,
  `JWT_SIGNING_KID`, interpolées de `RECETTE_CLE_COMMUNE_PEM` et `RECETTE_CLE_COMMUNE_KID`). Le paquet la tire **une
  fois** (RSA 2048) dans `prospera-recette/.recette/` (non versionné) et la passe à chaque `docker compose` qu'il lance ;
  aucune clé dans le dépôt. Absentes (compose lancé à la main sans elles), chaque auth tire la sienne : la pile de base
  ne change pas, et la recette des deux espaces le dit (le catalogue de l'essai refuse le jeton du réel). Les secrets du
  moteur restent propres à chaque espace (AD-15).
- **D-1115-4 — Le BFF reçoit les deux amonts de l'essai dans le profil** (`CATALOG_ESSAI_SERVICE_URL`,
  `AUTH_ESSAI_SERVICE_URL`, D-1113-1). Aucune autre recette n'appelle les routes de l'essai du BFF ; celles du réel ne
  changent pas.
- **D-1115-5 — L'essai de la pile n'a aucune sortie de messages** : `auth-essai` ne reçoit pas de
  `NOTIFICATION_BASE_URL` (NFR-3 : un espace n'écrit pas dans l'autre ; il n'y a pas de notification d'essai dans la
  pile). Ses invitations restent `INVITED`, l'envoi est journalisé comme manqué ; la liste blanche est prouvée par 1113.
- **D-1115-6 — Le premier membre de l'essai : un manque, nommé, et la seule écriture en base.** Aucune route ne fait
  entrer le premier membre d'une organisation née par le moteur dans l'essai. La recette pose **ce seul membre** dans la
  base de l'auth d'essai (utilisateur `INVITED` avec un jeton d'invitation haché, appartenance `TENANT_ADMIN`, rôle
  métier `CAB_ASSOCIE`) — ce que ferait la route qui manque —, puis tout le reste passe par les vraies routes :
  acceptation de l'invitation, `POST /users` (le collègue), attribution du rôle métier, comptes du jeu (route du
  moteur), connexion « en tant que ». Ticket `TICKET-BACKEND-premier-membre-d-un-essai.md` (auth, catalogue, BFF :
  groupe B, à placer par la session de groupe ; l'écran : A).
- **D-1115-7 — L'essai de la recette est à blanc** (`avecJeu: false`) : aucun module ne tourne dans l'espace d'essai
  de la pile (trois services de plus sur une VM de 8 Go) ; les comptes du jeu sont posés par la route du moteur de
  l'essai (ce que fera le catalogue après l'import, D-972-9). Le jeu et son import sont prouvés par 1112 ; plusieurs
  essais à la fois, par 1116.
- **D-1115-8 — Le réel installe par le moteur, par la console, puis met en service un vrai sous-ensemble** : offre et
  `POST /admin/orgs/{id}/installations` (`balance`, `bilan`, six vérifications `VERT`, plan `TERMINE`), puis `POST
  /admin/mises-en-service/{id}` de `balance` et `bilan` (et plus seulement `instance`, la limite de 1113).
- **D-1115-9 — Les invités entrent dans le réel par le lien reçu** (Mailhog), sous leur identifiant d'essai (FR-42).
  L'administratrice dépose les pièces KYC par sa session (l'acte du cabinet, chez kyc) ; la console approuve par le BFF
  (`If-Match` lu au détail de l'organisation par le BFF). Le parcours passe par le BFF partout où le BFF relaie la
  route ; il appelle l'auth et le catalogue de l'essai en direct là où le BFF ne relaie pas (acceptation, connexion,
  invitation du collègue, comptes du jeu), et l'auth du réel pour l'entrée des invités.
- **D-1115-10 — La recette complète se joue dans le réel** (`RECETTE_ESPACE` au défaut, `REEL`) : l'essai est le second
  espace. Les deux tests C13 de `cabinet-moteur` (pile entière en `ESSAI`) y sont sautés, comme hors de 1080 ; la
  recette neuve est sautée en `RECETTE_ESPACE=ESSAI` (une mise en service n'existe que dans le réel).
- **D-1115-12 — Une connexion par appel** (ajoutée le 24/11, trouvée par la recette complète) : le transport de la
  recette (`transportFetch`) et la lecture de Mailhog envoient `connection: close` (recette #29, PR à part, dépôt de B) :
  la réutilisation d'une connexion que Nest ferme après 5 s était la cause retenue des 17 `read ECONNRESET` du premier
  passage complet. ⚠️ **Cause non prouvée** : le passage suivant, avec l'en-tête, a encore eu des `ECONNRESET` (sur des
  connexions neuves), pendant la panne réseau du poste. L'en-tête reste (inoffensif) ; si les coupures reviennent hors
  panne, chercher du côté du relais de ports de Docker Desktop, et donner à `transportFetch` un nouvel essai borné sur
  `ECONNRESET` pour les lectures.
- **D-1115-11 — Karapace** : la recette lève le registre de `docker-compose.socle.yml` et joue
  `schemas:compatibilite` puis `schemas:enregistrer` de kyc contre lui (`kyc.correction.requested@1`, jamais éprouvé
  contre un vrai registre, STORY-1103) ; résultat au journal, hors de la condition de fin.

## Contrats touchés (annoncés avant la fusion, journal de B, « ⚠ Contrats »)

- **Profil de recette** (`docker-compose.recette.yml`, lu par les quatre groupes qui lancent la pile) : quatre services
  neufs à la demande (`kafka-essai`, `redis-essai`, `auth-essai` sur `127.0.0.1:3021`, `catalogue-essai` sur
  `127.0.0.1:3023`) ; réglages neufs sur `auth-service` (`JWT_SIGNING_KEY_PEM`, `JWT_SIGNING_KID`, vides par défaut :
  rien ne change sans le paquet) et sur `admin-panel` (`CATALOG_ESSAI_SERVICE_URL`, `AUTH_ESSAI_SERVICE_URL`).
- Paquet : variables `RECETTE_CLE_COMMUNE_PEM`, `RECETTE_CLE_COMMUNE_KID` (facultatives ; le paquet les tire) ; dossier
  non versionné `.recette/` ; recette neuve `essai-mise-en-service`.
- Aucun service, aucune route, aucun topic ne change.

## Livré

- **recette #28** (`af13aac` sur `dev`) : le second espace dans le profil (`kafka-essai`, `redis-essai`, `auth-essai`,
  `catalogue-essai`), la clé commune (`src/espaces.ts`, passée à chaque `docker compose` par `environnementDUnAppel`),
  le BFF à deux espaces, la recette `essai-mise-en-service`, la garde du profil étendue, `connexion` vers l'IdP d'un
  espace nommé, README.
- **recette #29** (`b38b268` sur `dev`) — **défaut révélé par la recette** (D-1115-12, ajoutée le 24/11) : une connexion
  par appel (`connection: close` dans `transportFetch` et la lecture de Mailhog), après 17 `read ECONNRESET` au premier
  passage complet. Cause non prouvée (voir D-1115-12).
- Annonce avant la fusion : prospera-stories #808 (fiche, tracker, « ⚠ Contrats »). Ticket
  `TICKET-BACKEND-premier-membre-d-un-essai.md`.

## Preuves

- **Unitaires** (Node 25, `npm test`) : 12 suites, **119/119** (98 avant la story) ; `npm run verifier` (tsc strict,
  Prettier) vert. Garde du profil : 8 tests neufs (services à la demande, espace en dur sur les deux seuls services de
  l'essai, aucune adresse du réel ni d'adresse héritée du `.env` laissée, secret du moteur propre, clé interpolée et
  aucune clé au dépôt, `.recette/` ignoré, ports en boucle locale, BFF) ; `espaces.spec.ts` (8), `compose.spec.ts`
  (+3), `accueil.spec.ts` (+1), `http.spec.ts` (1, contre un vrai serveur HTTP local).
- **Mutations : 24/24 rouges sur une assertion** (16 sur le profil : base, Kafka, Redis, JWKS, naissance, secret du
  moteur, clé retirée ou en dur, sortie de messages, port publié, profil retiré, espace `REEL`, port hors boucle locale,
  BFF vers le réel, dépendance au Kafka du réel, `.recette/` versionné ; 7 sur la clé et l'environnement ; 1 sur la
  connexion par appel). Quatre mutations écrites d'abord ne compilaient pas (`0 total`) : réécrites pour compiler.
- **Recette sur pile `grp-b` neuve** (volumes neufs, images reconstruites depuis `git -c core.autocrlf=false archive
  origin/dev` : auth `b49d8ab`, kyc `9cef9cb`, catalogue `45971cf`, notification `e0a50c0`, paiement `4684d22`,
  dossier `2bf9dbd`, document `1db0a8f`, balance `0ff2402`, bilan `7b53ff5`, BFF `c451b17`, fiscal `cb672c5`,
  comptabilité `979ed53`, plateforme `2c96703` ; recette `origin/dev` `b38b268`) :
  - **`essai-mise-en-service` 7/7** : la même clé publiée par les deux auth (`kid` `recette-console-…`), le jeton de
    l'opérateur du réel accepté par le catalogue et l'auth de l'essai ; l'essai ouvert par la console, au catalogue de
    l'essai seul (le réel : 404 au catalogue et à auth) ; l'administratrice entre dans l'essai (acceptation, connexion),
    invite son collègue par `POST /users`, lui donne `CAB_COLLABORATEUR`, se connecte « en tant que » un compte du jeu ;
    `…/invites` : les deux membres sous leur identifiant d'essai, 2 comptes du jeu écartés ; signé ; mise en service
    avant la naissance 404 `ORGANISATION_INCONNUE` ; **né au réel** (201, identité de l'essai, même identifiant, sans
    membre) ; `balance`+`bilan` non installés 409 (`details.modules`) ; **installés par le moteur par la console**
    (six vérifications `VERT`, plan `TERMINE`, `EN_SERVICE`) ; **mise en service de `balance` et `bilan` : 201,
    invitations `ENVOYEES` (2/2)**, au réel les deux membres sous leur identifiant d'essai (Ama `TENANT_ADMIN`
    `CAB_ASSOCIE`, Kofi `TENANT_USER` `CAB_COLLABORATEUR`), aucun compte du jeu ; rejouée 200 (2 existants, 0 invité) ;
    **chacun entre au réel par le lien reçu** (Mailhog, au nom du cabinet ; jeton `sub` = identifiant d'essai, `org` =
    le prospect) ; KYC déposé par l'administratrice, approuvé par la console (BFF, `If-Match`) ; dossier client créé ;
    `balance` et `bilan` ouverts au cabinet.
  - **Recette complète, dernier passage (recette `b38b268`) : 8 suites vertes sur 12, 135 tests verts, 12 rouges, 2
    sautés** (les deux C13 de `cabinet-moteur`, pile en `REEL`, D-1115-10), 1 693 s. Vertes : `essai-mise-en-service`,
    `cabinet-moteur`, `comptabilite`, `referentiel-par-dossier`, `facturation`, `delegation`, `abonnement`,
    `distributeur`. **Les 12 rouges sont toutes des appels du poste vers la pile coupés** (`read ECONNRESET` sur
    `atelier-balance`, `renvoi-du-lien` — dont la lecture de Mailhog —, `zone-franche` ; `auth-service … injoignable`
    sur `pile`), dans la dernière demi-heure, **pendant la panne réseau du poste** qui a aussi coupé la session (ENOTFOUND
    vers l'API) ; à 18:18 tous les services répondaient 200 sur leurs ports, aucun conteneur n'avait redémarré. Aucune
    ne touche le second espace ni le parcours. Pas relancée : D attendait le verrou, et le parcours de la story est vert.
  - Premier passage complet (avant #29) : 8 suites vertes, 4 rouges (dont la recette neuve, au premier appel au BFF),
    126 tests verts, 21 rouges, tous sur `read ECONNRESET` : D-1115-12.
- **Karapace** (D-1115-11, `docker-compose.socle.yml`, registre vide de la pile) : `schemas:compatibilite` de kyc —
  `kyc.correction.requested-value` nouveau sujet ; `schemas:enregistrer` — id 1, compatibilité `BACKWARD` posée ;
  `schemas:compatibilite` rejoué — compatible ; **témoin** : le même schéma avec un champ neuf obligatoire —
  `INCOMPATIBLE`, sortie 1.
- Verrou : pris à 15:47 (après D-1071), rendu à 16:36 entre deux passes, repris de 16:38 à 17:05 et de 17:07 à
  18:20 (la session coupée par la panne réseau de 17:40 à 18:17 l'a tenu) ; `down -v` à chaque fois ; aucun conteneur, volume ni réseau `grp-b` ne reste.

## Ce qui reste

- **Le premier membre d'un essai** (D-1115-6) : `TICKET-BACKEND-premier-membre-d-un-essai.md` (auth, catalogue, BFF :
  groupe B, à placer par la session de groupe, avant la démo du 15/01 ; l'écran : A). La recette n'écrit en base que ce
  membre.
- **Le jeu de démonstration dans l'essai de la pile** (D-1115-7) : aucun module ne tourne dans l'espace d'essai ;
  STORY-1116 (cinq essais) dira s'il faut y lever `balance` et `bilan` de l'essai.
- **D-1113-2** reste ouverte (identité d'opérateur commune : choix par défaut gardé, la recette le joue).
- **Pour A (AP-56, AP-57)** : la pile de recette porte désormais les deux espaces ; le gate réel de leurs écrans s'y
  joue (`npm run recette -- essai-mise-en-service` en montre le chemin).
