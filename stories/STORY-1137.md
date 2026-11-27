# STORY-1137 : Les modules s'ouvrent dans l'essai — le jeu du métier dans l'image du catalogue, l'ouverture installe par le moteur, la garde du dossier sans KYC dans l'essai

Status: done — **livrée le 2026-11-27** : prospera-dossier-service **#61** (`2f6e058` sur `dev`), platform-catalog-service
**#90** (`be072bc`, `3454f13`, `12c4c84`), prospera-admin-panel-service **#47** (`7ac4db4`), prospera-recette **#38** (`e83c737`,
`7999caf`) ; voir « Livraison ». Fiche écrite le 2026-11-27 par la sous-session du groupe B juste avant de coder (lot 7, « 12 bis » de B,
D-L7B-4 ; identifiant réservé D-L7B-1). Source : `tickets/TICKET-BACKEND-modules-ouverts-dans-l-essai.md` (part de B), né de
STORY-1116 (D-1116-1). **Bloque la démo du 15/01** (« chaque client testable par le prospect », avec des données).

**Dépôts :** `platform-catalog-service` (la partie A du moteur), `admin-panel` (le BFF, `prospera-admin-panel-service`),
`dossier-service` (`prospera-dossier-service`), `prospera-recette` · **Points :** 5 · **Dépend de :** STORY-953 (jeux,
import C13), STORY-944 (offre, plan), STORY-1112 (ouverture par la console), STORY-1115 et 1116 (le second espace de la
pile, cinq essais), STORY-1129 (installer par le moteur), STORY-1130 (`SOCLE_SERVICES`), **STORY-1019 de C et STORY-1079 de
D** (les gardes de balance et de bilan sans KYC dans l'essai, livrées) · **Suite :** STORY-1131 (n° 13 : l'export pendant
`ESSAI_TERMINE`, l'effacement jusqu'au certificat)

**Sources lues :** le ticket entier ; fiches STORY-1116 (D-1116-1 → 8, « Ce qui reste »), 1112, 1129 (D-1129-1 → 16), 1130
(D-1130-1 → 15), 1128 (contrat d'état publié figé, inventaire), 1019 et 1079 (gardes) ; plan du lot 7 de B ; journal de B
(D-L7B-4, pièges, « ⚠ Contrats », questions) ; journaux de C et D (Q-D-17 **confirmée** par l'utilisateur le 25/11, pour
balance, bilan et dossier ; demandes à B : aucune ouverte, celle de STORY-340 servie par 1130) ; code relu sur `origin/dev` :
catalogue `14c644d`, BFF `eb2fe4b`, dossier `653a70b`, recette `c0594e3`, balance `e68ae10` et bilan `7f96163` (lus
seulement), `prospera-plateforme` (jeux aux étiquettes `jeu-cabinet-v1`, `jeu-grossiste-golfe-v1.2`, `jeu-assurance-v1`).

---

## Ce qui existait (relu avant la fiche)

- **Point 1 du ticket (le jeu)** — inchangé : l'image du catalogue ne copie que `contrat/copies/jeux-demonstration/temoin`
  (`Dockerfile`) ; les jeux des verticales « se montent à côté » (`JEUX_DEMONSTRATION_DIR`) et le profil de recette n'admet
  aucun volume. Dans la pile, le BFF ne trouve aucun jeu du cabinet : `422 JEU_DEMONSTRATION_ABSENT`.
- **Point 2 (l'installation)** — inchangé : `EssaiProspectService.ouvrir` crée l'essai, propage son état, importe le jeu et
  invite l'administrateur ; il n'installe rien (« ⛔ Il n'installe aucun module »). Le BFF ne relaie l'offre et les plans
  qu'au catalogue du réel (`InstallationProxyService` → `CatalogServiceClient`, D-1113-1). Le catalogue de l'essai sait
  installer (offre, `PlansService.lancer`, exécuteur, axe 2 et état publié de l'espace).
- **Point 3 (les gardes)** — balance **fait** (STORY-1019, `ab4e468`) et bilan **fait** (STORY-1079, `7ed3335`) : sur une
  instance `INSTANCE_ESPACE=ESSAI`, le palier KYC est sauté, e-mail vérifié et état publié restent exigés. **Q-D-17 est
  confirmée par l'utilisateur** (journal de D, 25/11 : « la même règle vaudra pour balance-service (C) et dossier-service
  (B) »). `dossier-service` : `DossierAccessGuard` exige toujours `KYC APPROVED` quel que soit l'espace (constaté).
- **Point 4 (la recette)** — l'espace d'essai de la pile n'a que `kafka-essai`, `redis-essai`, `auth-essai`,
  `catalogue-essai` ; `cinq-essais` ouvre cinq essais à blanc (D-1116-1). Le catalogue de l'essai n'a ni
  `INSTALLATION_SERVICES` ni `SOCLE_SERVICES`.
- `.env.essai.example` nomme déjà `balance` et `bilan` (vérifications et routes C13) et `SOCLE_SERVICES=dossier=…`.
- **`ESPACE_KYC_URL`** (remplaçante du plan) : variable d'`expert-comptable` pour le lien de l'e-mail du renvoi KYC (STORY-1072,
  D) ; c'est le réel, pas l'essai : **elle n'entre pas ici** (D-1137-12).

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | **Les jeux des verticales sont dans l'image du catalogue** : les cinq jeux publiés (`cabinet-demo-togo`, `grossiste-golfe`, `-petit`, `-grand`, `assurance-compagnie-demo-reduite`) copiés à l'octet (LF) de leur étiquette, gardés par `ORIGINE.json` ; chacun se charge (registre) ; le témoin reste | unitaires (empreintes, chargement) ; pile : `GET …/jeux-demonstration` du catalogue de l'essai |
| AC-2 | **L'ouverture installe, en un geste, par le moteur** : l'ordre porte `installation: { modules, referentiels? }` (facultatif) ; l'offre de l'organisation devient ces modules (dépendances dures ajoutées), puis un plan (`POST /installations`, même point de décision, mêmes vérifications FR-6) est joué avant la réponse ; l'essai rend `installation` (`demandes`, `modules`, `statut`, `planId`, `code`) | unitaires ; e2e ; pile |
| AC-3 | **Rien d'écrit sur un ordre mal formé** : module sans manifeste 422 `MODULE_INCONNU` (`modules`), référentiels d'un module hors de la demande 400 `REFERENTIELS_HORS_DEMANDE` — avant l'essai, l'offre et le plan | unitaires ; e2e |
| AC-4 | **Un échec d'installation ne ferme pas l'essai** (comme un import) : `statut` `EN_ATTENTE` (vérification en échec) ou `REFUSEE` (`code` du moteur) ; l'**ordre rejoué** reprend le plan (ou le relance) ; un ordre rejoué avec d'autres modules ou référentiels : 409 `ESSAI_DIVERGENT` ; sans `installation`, l'ordre ne change rien à l'installation ; un essai ouvert avant la livraison gagne l'installation au rejeu | unitaires (règle pure, mutations) |
| AC-5 | **L'ordre d'ouverture** : installation, puis import du jeu, puis invitation de l'administrateur ; deux ordres simultanés : un seul plan (clef fixe) | unitaires |
| AC-6 | **Le BFF relaie** `installation` (validé, organisation de l'URL jamais dans le corps) et projette `installation` dans la réponse, la liste et la lecture ; `MODULE_INCONNU` et `REFERENTIELS_HORS_DEMANDE` traversent par leur code ; OpenAPI du BFF et `essai-prospect.openapi.json` (1.3.0) à jour | unitaires, e2e du BFF |
| AC-7 | **`dossier-service`, dans l'espace d'essai, ne lit pas le KYC** (Q-D-17 confirmée) : e-mail vérifié et organisation restent exigés ; au réel, rien ne change ; sans espace (double, module qui ne le fournit pas) : le KYC est exigé | unitaires ; e2e (deux espaces) |
| AC-8 | **La recette lève `dossier`, `balance` et `bilan` dans l'espace d'essai** (adresses de l'essai seulement, AD-15 ; gardes du profil) ; **cinq prospects** ouvrent leur essai **en parallèle** par la console avec le jeu du cabinet et `balance`, `bilan` ; chacun entre, lit **son** dossier de démonstration (`dossier`), **ses** deux balances (`balance`) et ouvre `bilan` ; **aucun ne lit ceux d'un autre** (20 couples) ; mémoire mesurée avec trois services de plus | recette `modules-dans-l-essai` sur pile neuve, images depuis `origin/dev` |
| AC-9 | Tests relancés par chemin, lint des fichiers touchés, build, mutations rouges sur une assertion ; Node 24 (étage `verification`) du catalogue et de `dossier-service` ; `docker compose up` sain | « Preuves » |

## Contrat annoncé avant le code (2026-11-27)

- **Catalogue — `contrat/essai-prospect.openapi.json` 1.2.0 → 1.3.0** (ajouts facultatifs seuls) :
  - `POST /api/v1/essais` (`OrdreDOuverture`) : champ **`installation`** facultatif, `{ modules: string[] (1 → 20, codes
    de module), referentiels?: { <module>: [{ code, version }] } }` ;
  - `EssaiProspect` (et `EssaiDeLaListe`) : champ **`installation`** facultatif, `{ demandes: string[], modules: string[]
    (l'offre résolue que le plan installe), statut: TERMINE | EN_ATTENTE | EN_COURS | REFUSEE, planId?: string, code?:
    string }` ; présent dès qu'une ouverture l'a demandé ;
  - refus neufs à l'ouverture : **422 `MODULE_INCONNU`** (`modules`), **400 `REFERENTIELS_HORS_DEMANDE`** ; 409
    `ESSAI_DIVERGENT` s'étend à une installation demandée différente ;
  - l'image porte les jeux des verticales (`/app/jeux-demonstration`) : `GET /api/v1/jeux-demonstration` en liste six au
    lieu d'un. Aucune autre route, aucun événement, le contrat d'état publié (1.1.0, figé) **inchangés**.
- **BFF — `POST /api/v1/admin/essais`** : champ **`installation`** facultatif (même forme) ; `EssaiDto` gagne
  `installation` (même forme que le catalogue) ; `MODULE_INCONNU` (422) et `REFERENTIELS_HORS_DEMANDE` (400) relayés par leur
  code. Les autres routes du BFF ne changent pas.
- **`dossier-service`** : aucune route ne change ; sur une instance `INSTANCE_ESPACE=ESSAI`, `403 KYC_NOT_APPROVED` n'est
  plus rendu (le palier est sauté) ; au réel, inchangé.
- **Recette** : profil (trois services de l'essai, réglages du catalogue de l'essai), recette neuve ; aucun contrat de
  service.
- **→ A** : (1) la console des essais (AP-57) peut envoyer `installation` avec l'ordre (« Installer balance et bilan »,
  référentiel `syscohada-revise@2.3`) et montrer `installation.statut` ; sans cela, rien ne change ; (2) types à régénérer
  depuis l'OpenAPI du BFF ; (3) le référentiel doit être déposé au catalogue de l'essai (geste d'exploitation, comme au réel).
  **→ C, D** : vos gardes (1019, 1079) sont prouvées sur la pile de l'essai par cette story ; rien à faire sauf défaut révélé.

## Décisions (recommandations appliquées, contestables)

- **D-1137-1 — Le KYC dans l'essai n'est plus un choix par défaut.** Q-D-17 est confirmée par l'utilisateur (25/11) pour
  balance, bilan **et dossier** : `dossier-service` applique la règle de 1019 et 1079 telle quelle (le palier KYC sauté sur
  une instance d'essai, fail-closed sans espace). La question écrite au journal de B porte sur le point 2 (D-1137-3).
- **D-1137-2 — Les jeux sont copiés dans l'image** (défaut du ticket) : les cinq jeux publiés, à l'étiquette la plus récente
  qui les porte (cabinet `jeu-cabinet-v1`, grossiste `jeu-grossiste-golfe-v1.2`, assurance `jeu-assurance-v1`), octets LF
  (`git -c core.autocrlf=false show`), `contrat/copies/**` déjà `-text`, empreintes dans
  `contrat/copies/jeux-demonstration/ORIGINE.json`. Sert la pile comme le déploiement ; `JEUX_DEMONSTRATION_DIR` peut
  toujours désigner un autre dossier. Le profil de recette reste sans volume (garde STORY-646).
- **D-1137-3 — L'ouverture installe, sur demande explicite** (défaut du ticket : « en un geste ») : la console met les modules
  dans l'ordre d'ouverture. **Rien n'est déduit du jeu** : `balance` et `bilan` sont normatifs (un référentiel est exigé à
  l'ouverture du droit) et le jeu du cabinet ne nomme que `balance` ; une installation implicite échouerait ou en ferait
  trop. Sans `installation`, l'ouverture est celle d'avant. **Question à l'utilisateur** (journal de B) : faut-il plutôt que
  le BFF relaie l'offre et les plans à l'essai (la console installe après l'ouverture) ? Défaut retenu : l'ordre.
- **D-1137-4 — Le geste du moteur, pas un raccourci** : l'offre de l'organisation devient les modules demandés (dépendances
  dures ajoutées par `resoudreOffre`, comme `PUT /offres`), puis `PlansService.lancer` avec l'offre résolue, les
  référentiels de l'ordre, l'auteur (l'opérateur), et `attendre` : point de décision, vérifications de chaque module à
  l'adresse d'`INSTALLATION_SERVICES` de l'espace, droit `moteur:<plan>`, axe 2, état publié. Aucun `ACTIVE` hors du moteur.
- **D-1137-5 — Ordre des étapes** : naissance exigée ; modules connus et référentiels dans la demande **avant toute
  écriture** ; essai créé et propagé ; **installation** ; **import du jeu** (le jeu arrive dans des modules installés) ;
  invitation de l'administrateur (il entre dans un essai prêt).
- **D-1137-6 — Un échec d'installation ne ferme pas l'essai** : comme une part du jeu `NON_IMPORTE`, il reste visible
  (`EN_ATTENTE` : une vérification en échec, le plan se reprend ; `REFUSEE` : le moteur a refusé, `code`) ; l'import et
  l'invitation suivent. L'ordre rejoué reprend (plan repris et attendu, ou relancé s'il n'y en a pas).
- **D-1137-7 — L'ordre rejoué, une règle pure** (`decisionDInstallation`) : sans `installation` dans l'ordre → rien ;
  l'essai n'en a pas → installer ; demandes ou référentiels différents → `ESSAI_DIVERGENT` ; mêmes et `TERMINE` → rien ;
  mêmes et pas `TERMINE` → reprendre. Un essai qui n'est plus `OUVERT` n'installe plus rien.
- **D-1137-8 — Une clef d'idempotence fixe** par organisation (`essai|<organisation>|installation`) : deux ordres simultanés
  rendent le même plan (index unique du plan).
- **D-1137-9 — Le BFF relaie, il ne choisit pas les modules** (il choisit déjà le jeu, D-1112-4) : un ordre sans
  `installation` reste un essai sans module. Le relais de l'offre et des plans vers l'essai (option 2 du ticket) n'est pas
  fait (D-1137-3).
- **D-1137-10 — La pile de l'essai** : `dossier-essai` (3029), `balance-essai` (3027), `bilan-essai` (3024), levés à la
  demande (profil `recette`), images du réel, bases `*_essai` dans le MongoDB de la pile, Kafka et auth de l'essai, toute
  adresse héritée reposée (garde AD-15 étendue) ; `INSTANCE_ESPACE: ESSAI` en dur sur eux (comme `auth-essai`,
  `catalogue-essai`). `catalogue-essai` gagne `INSTALLATION_SERVICES` (`balance`, `bilan`) et `SOCLE_SERVICES` (`dossier`).
- **D-1137-11 — La recette `modules-dans-l-essai`** (suite de `cinq-essais`, avec des données) : le référentiel
  `syscohada-revise@2.3` et les paquets fiscaux déposés au catalogue de l'essai (gestes d'exploitation), cinq ouvertures
  parallèles par la console avec le jeu et `balance`, `bilan` ; chaque administratrice entre par son lien, lit son dossier
  de démonstration, ses balances (2 exercices du jeu), ouvre `bilan` ; les 20 couples refusés ; temps et mémoire mesurés.
  `cinq-essais` reste à blanc (elle prouve l'isolement des comptes, pas des modules).
- **D-1137-12 — `ESPACE_KYC_URL` n'entre pas** : c'est le lien de l'e-mail du renvoi KYC au réel (STORY-1072, D), sans
  rapport avec l'essai ; reste une remplaçante du plan.
- **D-1137-13 — Les gardes de C et D** : servies (1019, 1079). La ligne « Demandes » du journal de B et le message à C et D
  disent qu'elles sont prouvées par la pile de l'essai ; un défaut révélé deviendrait un ticket et une demande.

## Hors de cette story

- Le relais de l'offre et des plans vers l'essai par le BFF (installer après l'ouverture) ; l'écran de la console (A).
- Les jeux des autres verticales sur la pile (D : `reseau`, `commande`, `terrain`, `assureur-fictif` dans l'essai).
- L'effacement d'un essai jusqu'au certificat avec ses modules (STORY-1131 ou le certificat d'essai), l'export pendant
  `ESSAI_TERMINE`.

## Livraison (2026-11-27)

### Ce qui a été livré

- **`dossier-service` #61** (`2f6e058`) : `kycExigeDansLEspace` (lu une fois de `kafka.espace`) ; sur une instance d'essai,
  `DossierAccessGuard` saute le seul palier KYC sans lire le read-model ; e-mail vérifié et organisation inchangés ; fail-closed
  sans configuration lisible. e2e `acces-kyc` montée pour les deux espaces.
- **Catalogue #90** : (1) les cinq jeux publiés copiés dans `contrat/copies/jeux-demonstration/` (LF, `-text`, `ORIGINE.json` :
  étiquette, commit, sha256 de chaque fichier ; le générateur n'est pas copié), l'image les porte (`Dockerfile` inchangé : il
  copiait déjà le dossier entier) ; (2) `src/essai/installation-a-l-ouverture.ts` (`InstallationALOuverture` : `valider`,
  `installer`, `reprendre` ; règles pures `demandeCanonique`, `memeDemande`, `decisionDInstallation`, `cleDuPlanDeLEssai`),
  `EssaiProspect.installation` (schéma déclaré, référentiels inscrits comme objet libre voulu), `OrdreDOuvertureDto.installation`,
  `essaiPublie` ; `PlansService.reprendre(planId, { attendre })` ; `validerLesReferentiels` exportée ;
  `InstallationModule` exporte la lecture du catalogue, l'offre et les plans ; `essai-prospect.openapi.json` **1.3.0**.
- **BFF #47** (`7ac4db4`) : `EssaiInstallationRequestDto`, `installationDeLOrdre` (recopie `{ code, version }`, 400
  `REFERENTIELS_INVALIDES` au bord), `EssaiInstallationDto` projetée, trois codes relayés (`MODULE_INCONNU`,
  `REFERENTIELS_HORS_DEMANDE`, `REFERENTIELS_INVALIDES`).
- **Recette #38** : `dossier-essai`, `balance-essai`, `bilan-essai` au profil, `INSTALLATION_SERVICES` et `SOCLE_SERVICES` du
  catalogue de l'essai, gardes étendues ; `src/modules-dans-l-essai.ts` (`installationDuCabinet`, `dossierDeDemonstration`,
  `fuitesCroisees`) ; `recette/modules-dans-l-essai.recette.ts` (4 tests) ; README.

### Preuves

- **dossier, Node 25** : `src/modules/acces` 53/53, e2e `acces-kyc` 14/14 ; lint, `tsc` ; **mutations 6/6**. **Node 24** (étage
  `verification`, archive de la branche) : **120/120 suites, 1 955/1 955**, lint 0, build 0.
- **Catalogue, Node 25** : complète **1 802/1 804** (3 suites rouges connues du poste : `app-cablage`, `kafka-producer`,
  `outbox-relay` ; la garde des chemins `Mixed` a rougi sur `installation.referentiels`, inscrit comme objet libre voulu) ; e2e
  `essais-console` 17/17 ; **mutations 23/23** (règles pures, offre résolue, clef, attente, panne non avalée, ordre
  installation → jeu → invitation, rejeu, essai signé, publication). **Node 24** (`a8058cb`) : 1 821/1 822, le seul rouge (le
  `Dockerfile` absent de l'étage `verification`) corrigé par `1010526` (la garde se joue dans le checkout seulement), lint 0, build 0.
- **BFF, Node 25** : unitaires **759/759**, e2e **309/309** (contrat OpenAPI compris), lint, build ; **mutations 15/15**.
- **Recette** : `npm test` **195/195** (19 suites), `npm run verifier` vert ; **mutations 9/9** (dont trois sur le profil : une
  adresse du réel posée sur un module de l'essai rougit la garde AD-15).
- **Pile `grp-b-recette` neuve**, volumes neufs, images depuis les archives :
  - passe 1 (04:25, branches) : rouge au `beforeAll` — le référentiel posté sous `/api/v1/admin/referentiels` au lieu de
    `/api/v1/catalog/admin/referentiels` (défaut de la recette, `99cea2d`) ; la passe s'est ensuite figée sur son relevé de
    mémoire (`Start-Job`, piège) jusqu'à 08:19 : verrou tenu à tort, coupée et rendue à 08:23 à la demande de la session de groupe ;
  - passe 2 (08:35 → 08:44, branches, une commande Docker = un `timeout`) : **`modules-dans-l-essai` 4/4** ; Node 24 de dossier ;
  - passe 3 (08:48 → 08:58, **après la fusion, tout depuis `origin/dev`** : auth `e9c32c1`, kyc `9cef9cb`, catalogue `12c4c84`,
    notification `749b3cd`, paiement `64b5838`, dossier `2f6e058`, balance `53e1595`, bilan `7f96163`, BFF `7ac4db4`, recette
    `7999caf`) : **`modules-dans-l-essai` 4/4** et **`cinq-essais` 6/6** (non-régression de l'ouverture à blanc).
  - **Ce que la pile a montré** : cinq ouvertures lancées au même instant par la console, avec le jeu et `balance`, `bilan` :
    chacune `201`, `installation.statut` `TERMINE`, six vérifications `VERT`, `OUVRIR` fait pour les deux modules, droits
    `moteur:<plan>` au catalogue de l'essai, jeu `IMPORTE`, invitation `ENVOYEE` ; le réel ne connaît aucune des cinq
    organisations ; l'ordre rejoué rend le même plan (200), une autre installation rend `409 ESSAI_DIVERGENT`. Chaque
    administratrice entre par son lien et lit **sans KYC** son dossier de démonstration (`DÉMO NÉGOCE TOGO SARL`), ses
    **deux balances** et le référentiel de son bilan ; **60 lectures croisées** (20 couples × dossier, balances, bilan) : toutes
    `403` ou `404`, aucun portefeuille ne porte le dossier d'un autre.
  - **Temps** (`MESURES-1137`, passe 3) : ouverture avec installation et import **5,6 → 6,5 s** (médiane 6,4 s ; passe 2 : médiane
    10,4 s, images froides) ; entrée par le lien **1,5 → 2,2 s** ; lecture des trois modules **0,39 → 0,46 s**.
  - **Mémoire** (relevé toutes les ~8 s ; VM 7,6 Gio) : la pile au plus **4,0 Gio** (passe 2) et **3,6 Gio** (passe 3), 21
    conteneurs ; l'espace d'essai ≈ **1,5 Gio**, dont les trois modules ≈ **0,7 Gio** (bilan 235, balance 250, dossier 130 Mio).
    **La pile tient**, ≈ 3,6 Gio de marge.
  - `down -v` à chaque fin, aucun conteneur `grp-b-*` restant, verrou rendu (passes 2 et 3 : 08:44, 08:58).

### Décisions prises au code

- **D-1137-14 — Une panne n'est pas un refus** : un refus du moteur (exception HTTP portant un code) devient `REFUSEE` et l'essai
  s'ouvre ; toute autre panne (base, réseau) remonte, l'ordre échoue après la création de l'essai, et l'ordre rejoué installe
  (l'essai n'a pas encore d'installation). `PLAN_TERMINE` à la reprise vaut `TERMINE`.
- **D-1137-15 — Les référentiels de l'ordre sont gardés** (objet libre voulu du schéma, garde `schemas-sans-chemin-mixed`) mais
  **jamais publiés** : la console les a envoyés ; `essaiPublie` et le BFF rendent `demandes`, `modules`, `statut`, `planId`, `code`.
- **D-1137-16 — Le statut des refus du BFF** : `REFERENTIELS_INVALIDES` est jugé au bord par le BFF lui-même (le même code que le
  catalogue), avant la naissance ; les deux codes 400 du catalogue traversent aussi.

### Ce qui reste (et à qui)

- **A** : la console des essais (AP-57) peut envoyer `installation` (« Installer balance et bilan », `syscohada-revise@2.3`) et
  montrer `installation.statut` ; types à régénérer depuis l'OpenAPI du BFF (`EssaiInstallationDto`, `EssaiInstallationRequestDto`).
- **Exploitation** : déposer le référentiel au catalogue de l'essai (comme au réel) ; poser `INSTALLATION_SERVICES` et
  `SOCLE_SERVICES` de l'essai (`.env.essai.example`).
- **B** : la question D-1137-3 (relayer l'offre et les plans à l'essai) ; l'effacement d'un essai avec ses modules jusqu'au
  certificat (STORY-1131 ou le certificat d'essai : la pile pose déjà `SOCLE_SERVICES`).
- **D, C** : les jeux de leurs verticales sur la pile (`reseau`, `commande`, `terrain`, `assureur-fictif` dans l'essai) — à placer
  si la démo les exige.
