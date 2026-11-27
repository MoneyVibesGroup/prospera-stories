# STORY-1137 : Les modules s'ouvrent dans l'essai — le jeu du métier dans l'image du catalogue, l'ouverture installe par le moteur, la garde du dossier sans KYC dans l'essai

Status: in-progress — fiche écrite le 2026-11-27 par la sous-session du groupe B juste avant de coder (lot 7, « 12 bis » de B,
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
