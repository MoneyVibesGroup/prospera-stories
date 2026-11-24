# STORY-1116 : cinq essais simultanés tiennent sur la même pile, chacun dans son espace (démo du 15/01)

Status: in-progress

**Complexité :** moyenne (une recette croisée neuve, cinq prospects en parallèle ; des fonctions pures du paquet ; aucun
service ne change si rien ne casse)

**Épic :** EPIC-146 (deux espaces : essayer, puis mettre en service ; FR-8, FR-9, FR-21, NFR-3) ; EPIC-147 (l'essai d'un
prospect)
**Dépôts :** `MoneyVibesGroup/prospera-recette` (B) ; `platform-catalog-service` (B) **seulement si la recette y révèle
un défaut** (PR à part, écrite ici).
**Lot 6 :** ligne n° 7 de B au §5 de `PLAN-LOT-6-2026-11-23.md` (« Docker : recette complète ; Fini quand : cinq essais
ouverts en parallèle, aucun ne voit les données d'un autre »). Identifiant réservé par le plan (§8) ; la marque haute du
tracker est déjà `STORY-1117` (C) : elle ne bouge pas, son commentaire le dit.
**Suite de :** STORY-1115 (la recette « essayer, puis mettre en service », le second espace de la pile), suite de
STORY-1112 du 24/11 (le premier administrateur d'un essai entre par de vraies routes ; garde `recettes-sans-base`),
STORY-1113 (sorties de l'essai, liste blanche), STORY-972 (comptes du jeu, connexion « en tant que »).
**Suivante :** fin du lot 6 de B. Après lui : le consommateur de `facturation.avoir.emis@1` dans `paiement` (D-979-14),
au retour de `paiement` (prêté à D pour STORY-1073).

**Sources lues :** plan du lot 6 (§0 → §9) ; `REGLES-DES-GROUPES.md` ; journal de B (état, items 1 → 12, pièges,
« ⚠ Contrats », passations : `dossier-service` et `paiement` prêtés à D) ; journaux de A, C, D (aucune demande ouverte à
B avant cette story ; l'information de D sur `ESPACE_KYC_URL`, lue, sans effet ici) ; fiches STORY-1115 (D-1115-1 → 12,
« Ce qui reste » : « STORY-1116 dira s'il faut y lever `balance` et `bilan` de l'essai »), STORY-1112 (suite, D-1112-10 →
18). Code relu sur `origin/dev` : recette `c99257a` (`essai-mise-en-service.recette.ts`, `espaces.ts`,
`sortie-de-l-essai.ts`, profil `docker-compose.recette.yml` et sa garde) ; catalogue `1aa17ae` (`EssaiProspectService.
ouvrir`, `premier-administrateur.ts`, `calculerEtat`, émetteur de l'état publié, registre des jeux, Dockerfile) ; auth
`d69e34c` (invitations du moteur, comptes du jeu et « en tant que », `GET /users`, `PATCH /users/:id`) ; BFF `911c450`
(`EssaiDto`, limiteur par adresse) ; balance `0ff2402` (garde d'accès) et dossier `2bf9dbd` (dossier de démonstration),
lus seulement.

**Ce qui existait déjà (relu avant la fiche) :** la pile porte deux espaces (1115) ; un essai s'ouvre par la console et
son premier administrateur entre par le lien reçu à la sortie de l'essai (suite de 1112) ; les comptes du jeu portent
l'organisation dans leur adresse et leur identifiant (`<objet>.<cle>.<organisation>@jeu-demonstration.invalid`), et
« en tant que » un compte d'un autre essai rend 404 `COMPTE_DU_JEU_INCONNU` (972) ; l'effacement n'a aucun verrou global
(« cinq essais simultanés », 953). **Personne n'a encore ouvert deux essais à la fois** : toutes les recettes et preuves
n'en tiennent qu'un.

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | **Cinq essais de cabinets prospects s'ouvrent EN PARALLÈLE par la console** (`POST /admin/essais`, cinq ordres au même instant) : cinq `201`, cinq essais `OUVERT`, cinq administrateurs distincts, chacun sous l'identifiant tiré de son organisation | recette `cinq-essais` |
| AC-2 | **Chacun dans son espace** : l'interception de chaque administrateur (hors liste blanche) est au journal de SON essai seul ; après la liste blanche de son domaine, les cinq reprises parallèles envoient **une** invitation à chacun, à la sortie de l'essai, au nom de SON organisation, avec SON lien ; rien au réel (NFR-3), le réel ne connaît aucune des cinq organisations | recette |
| AC-3 | Les cinq administrateurs entrent **en parallèle** par leur lien (aucune pose en base), invitent chacun un collègue, reçoivent chacun leurs comptes du jeu et se connectent « en tant que » l'un d'eux | recette |
| AC-4 | **Aucun ne voit les données d'un autre** : chaque administrateur ne lit que les membres et les comptes du jeu de son essai ; « en tant que » le compte du jeu d'un autre essai, modifier ou relancer le membre d'un autre essai : refusés, et rien ne change chez l'autre ; la console lit, pour chaque essai, ses destinataires et ses invités seuls ; aucun message de la sortie ne va à l'organisation d'un autre | recette (chaque couple d'essais) ; unitaires (règles pures) |
| AC-5 | Contre-épreuve : une adresse déjà administratrice d'un essai ne devient pas celle d'un sixième ; l'issue est nommée, le premier essai n'en est pas touché | recette |
| AC-6 | **La pile tient** : mémoire mesurée (avant l'essai, cinq essais ouverts, après), temps d'ouverture de chaque essai ; écrits ici. Si elle ne tient pas : ce qui casse, et le correctif dans le périmètre de B | « Preuves » |
| AC-7 | Recette complète sur **pile neuve**, images reconstruites depuis `origin/dev` après la fusion, volumes neufs ; une suite rouge est nommée avec sa cause prouvée (journaux des services) et rejouée seule sur pile neuve | « Preuves » |

## Décisions (recommandations appliquées, contestables)

- **D-1116-1 — Les cinq essais sont à blanc (`avecJeu: false`), comme en 1115 (D-1115-7) ; aucun module dans l'espace
  d'essai de la pile.** Réponse à la question laissée par 1115 (« faut-il y lever `balance` et `bilan` de l'essai ? ») :
  **non, pas dans cette story**, parce qu'un prospect ne pourrait pas les ouvrir, constaté au code de `origin/dev` :
  (1) le catalogue de l'essai de la pile ne charge que le jeu témoin (l'image ne porte que `contrat/copies/
  jeux-demonstration/temoin` ; les jeux des verticales se montent à côté, et le profil n'admet aucun volume) : l'ordre
  du cabinet avec jeu rend 422 `JEU_DEMONSTRATION_ABSENT` ; (2) **rien n'installe un module dans l'essai** : l'ouverture
  n'installe rien, l'état publié d'un module y reste `NON_INSTALLE` tant que le moteur ne l'a pas installé dans
  l'espace d'essai (`calculerEtat`), et le BFF ne relaie les installations qu'au réel (D-1113-1) ; (3) la garde de
  `balance-service` exige un KYC `APPROVED` quel que soit l'espace, et l'essai n'a pas de KYC. Trois manques hors de
  cette ligne du plan, qui touchent C (balance) et la session de groupe : **ticket
  `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`**, à placer par la session de groupe avant la démo du 15/01 (ce n'est
  pas une condition de cette story : sa ligne dit « cinq essais ouverts en parallèle », pas « avec leurs modules »).
- **D-1116-2 — Cinq cabinets, cinq domaines.** Chaque prospect a son identifiant (tiré par la recette, le même au réel
  plus tard), son nom, son domaine (`p<k>-<suffixe>.prospect-1116.recette.tg`, suffixe de la passe) et son
  administrateur ; la console met chaque domaine en liste blanche (une entrée par prospect : la liste est celle de
  l'espace, pas d'un essai). Le métier est le même pour les cinq (le cabinet, chemin critique de février) : l'isolement
  ne dépend pas du métier.
- **D-1116-3 — « Aucun ne voit » se prouve par les routes que tient un prospect, pour chaque couple d'essais** (20
  couples ordonnés) : `GET /users` (les membres de mon organisation), `GET /essai/comptes-du-jeu`, `POST
  /essai/connexion-en-tant-que` avec le compte d'un autre (404 `COMPTE_DU_JEU_INCONNU`), `PATCH /users/{id}` sur le
  membre d'un autre (404, « membre introuvable dans votre organisation ») et `POST /users/{id}/resend-invitation` sur
  le collègue encore invité d'un autre (409, le message générique qui ne dit pas qu'il existe) — puis l'autre est relu :
  rien n'a changé, et aucun lien neuf n'est parti pour son collègue. Côté console :
  `GET /admin/essais/{id}` (destinataires), `…/sorties-essai/{id}/interceptions`, `…/mises-en-service/{id}/invites`.
  Côté sortie : une règle pure (`fuitesDeLaSortie`) rend tout message adressé à un membre d'un essai mais porteur d'une
  autre organisation, d'un autre nom ou d'un lien d'un autre ; la recette exige une liste vide.
- **D-1116-4 — Contre-épreuve d'une adresse partagée** : un sixième prospect nomme l'administratrice du premier. L'auth
  refuse (une adresse = un utilisateur, `MEMBRE_EN_CONFLIT`, STORY-974) ; l'essai s'ouvre et garde l'issue `REFUSEE`,
  le premier essai garde ses membres. C'est la règle à dire aux commerciaux pour la démo : **une adresse par essai**.
- **D-1116-5 — Mesures** : le temps de chaque ouverture et de chaque reprise est mesuré par la recette (journal de la
  suite) ; la mémoire par un relevé `docker stats` toutes les 5 s pendant la recette (script hors du dépôt), avant
  l'espace d'essai, cinq essais ouverts, et à la fin.
- **D-1116-6 — Le catalogue ne change que si la recette y révèle un défaut.** Relu : chaque essai a son document, ses
  tâches et son bail (aucun verrou global), l'ordre simultané d'un même essai se relit (`11000`) ; rien à corriger
  avant preuve.
- **D-1116-7 — La recette neuve lève ce dont elle a besoin, rien de plus** : le BFF et l'espace d'essai (les quatre
  services de 1115), pas `dossier`, `balance`, `bilan`. Elle est sautée en `RECETTE_ESPACE=ESSAI`, comme
  `essai-mise-en-service` (la console y ouvre l'essai dans le second espace, que le profil ne lève qu'à côté du réel).
- **D-1116-8 — Le limiteur du BFF** (100 requêtes par minute et par adresse, `THROTTLE_LIMIT`) borne ce qu'une seule
  console peut faire : la recette passe sous lui (≈ 40 appels au BFF) ; s'il mordait, c'est un réglage du déploiement,
  pas un défaut.

## Contrats touchés

Aucun prévu (une recette ; aucun service, aucune route, aucun événement). Si la recette révèle un défaut du catalogue,
son correctif est annoncé dans « ⚠ Contrats » avant la fusion.

## Livré

*(à remplir)*

## Preuves

*(à remplir)*

## Ce qui reste

*(à remplir)*
