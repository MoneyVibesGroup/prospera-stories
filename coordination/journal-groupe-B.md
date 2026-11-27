# Journal du groupe B

> Écrit par le groupe B seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §4 (le moteur). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3** (le socle partout, le kit des cibles, l'installation, l'essai).

## État

### Lot 7 (ouvert le 2026-11-25)

- **Plan** : `PLAN-LOT-7-GROUPE-B-2026-11-25.md` (validé par l'utilisateur le 25/11) — première partie : les archives,
  complètes (`document-service`, n° 1 → 8) ; deuxième partie : le backend prêt pour janvier, février et après (moteur,
  n° 9 → 18). Lancé par l'utilisateur le 25/11 à 10:00. Une sous-session neuve par story.
- **Poste** : B, **C** (arrivé du poste principal, `PLAN-LOT-7-2026-11-24.md` §2) et D partagent ce poste et son verrou
  `MoneyVibes_Apps\.verrou-docker` : une seule pile lourde à la fois (`grp-b`, `grp-c`, `grp-d`), `down -v` dès la
  preuve faite ; d'abord les tests du service, une pile seulement quand la story l'exige.
- **Dépôts de B au lot 7** : **`document-service`** (`prospera-ocr-service`, module `ged`, repris de C : dernier commit
  de C `0716a58`, passation lue, « Réponses »), `platform-catalog-service`, `auth-service`, `admin-panel` (le BFF),
  `prospera-recette`, `centrale-service`, `agent-instance`, la part « moteur » de `prospera-plateforme`, `kyc-service`,
  `dossier-service` et `prospera-paiement-service` (rendus par D le 25/11, #852). **Pas à B** : balance, comptabilité,
  fiscal (C ; fiscal partagé avec D par dossier, D-L7-1), bilan, notification, sinistres, assurance (D).
- **D-L7B-1 — identifiants réservés d'un coup : STORY-1119 → 1137** (tracker, `reserved_ranges`). Le plan dit « pris à
  l'écriture » ; trois groupes écrivent maintenant dans le même tracker depuis le même poste, et une réservation
  évite deux fiches au même numéro (même geste que D pour 1118). Un numéro non employé reste à B.
- **D-L7B-2 — les demandes reçues passent d'abord** (§1.1), sans identifiant neuf :
  1. la **troisième suite de STORY-979** : recopier `facturation` 1.2.0 et `paiement` 1.1.0 au catalogue (← D, 1073 ;
     sans Docker) ;
  2. le **correctif de STORY-1073** : `formeJuridique` sur les dossiers CLIENTS aussi (`dossier-service`, ← D,
     STORY-1077 ; un champ déjà déclaré facultatif, puis `npm run republier:dossiers`).
- **D-L7B-3 — le n° 18 est la première remplaçante** : STORY-1116 est finie au lot 6 (recette #31) ; le n° 18 devient
  **le consommateur de `facturation.avoir.emis@1` dans `paiement`** (← D, 1066, D-979-14 ; `paiement` est revenu ;
  tenir compte de `publier(resultat, entree)` de 1073).
- **D-L7B-4 — `TICKET-BACKEND-modules-ouverts-dans-l-essai.md` (part de B) = STORY-1137, placée après le n° 12** :
  même terrain (le catalogue de l'essai), et la démo du 15/01 l'exige. La décision d'architecture sur le KYC dans
  l'essai se prend par défaut dans sa fiche et s'écrit en question à l'utilisateur ; les gardes de balance (C) et de
  bilan (D) leur sont demandées dans leurs journaux.
- **D-L7B-5 — les dates passent avant l'ordre** (plan §3) : le n° 9 (`referentiels`, avant le gel du 11/12) est fusionné
  au plus tard le 09/12, le n° 10 le 11/12, le n° 11 le 18/12. Si le n° 9 n'est pas commencé le 05/12, les n° 9 → 11
  passent devant les archives restantes.
- **Ordre et identifiants** :

  | Ordre | Story | Ce que c'est |
  |:--:|---|---|
  | a | STORY-979 (3ᵉ suite) | recopies `facturation` 1.2.0, `paiement` 1.1.0 |
  | b | STORY-1073 (correctif) | `formeJuridique` sur les dossiers clients |
  | c′ | STORY-917 (correctif) | CORS du BFF : `Idempotency-Key` annoncé (← A, AP-55 ; D-L7B-7) |
  | c | STORY-1115 (correctif) | republier togo@2026 (`5c683d16…`) dans les deux buckets de la recette (← C) |
  | d | STORY-100 (correctif) | `atelier-balance` octroie `conseil` au cabinet (← C, STORY-1019 ; D-L7B-8 : demande de C placée avant 1119) |
  | 1 | STORY-1119 | les archives ont valeur de preuve |
  | 2 | STORY-1120 | fin de mission et réversibilité |
  | 3 | STORY-1121 | la destruction proposée, puis visée |
  | 4 | STORY-1122 | retrouver dans tous les fonds du cabinet |
  | 5 | STORY-1123 | les alertes de l'archiviste |
  | e | STORY-953 (suite) | le contrat de l'export C13 publié dans `contrats/instance/` (← D, STORY-1140 ; D-L7B-9) |
  | 6 | STORY-1124 | le circuit sans trou |
  | 7 | STORY-1125 | l'archivage se mesure et se vend |
  | f | STORY-1119 (suite) | la nature « validation du client » et la référence d'une version (← C, STORY-324 ; D-L7B-10) |
  | g | STORY-979 (5ᵉ suite) | recopies `paiement` 1.2.0 et `ged` 1.10.0 au catalogue (← D, STORY-1141 ; D-L7B-11) |
  | 8 | STORY-1126 | la recette des archives de bout en bout |
  | 9 | STORY-1127 | `referentiels` dans l'état publié |
  | 10 | STORY-1128 | le contrat d'état publié figé, inventaire d'EPIC-142 → 147 et 159 |
  | 11 | STORY-1129 | le cabinet sur le moteur |
  | h | STORY-1124 (suite) | les pièces du dépôt d'une déclaration au fonds du client (← D, STORY-335 ; D-L7B-12) |
  | i | STORY-979 (6ᵉ suite) | recopie `comptabilite` 0.6.0 au catalogue, avec « h » (← C, STORY-338 ; D-L7B-13) |
  | 12 | STORY-1130 | effacer le dossier de démonstration à la fin d'un essai |
  | 12 bis | STORY-1137 | les modules s'ouvrent dans l'essai (ticket de 1116) |
  | k | STORY-979 (7ᵉ suite) | le droit `fiscalite:declaration:regler` chez auth (← C, STORY-342 ; D-L7B-15) |
  | j | STORY-1124 (2ᵉ suite) | les faits proposés publiés, l'aller-retour GED ↔ fiscal joué (← D, après fiscal #89 ; D-L7B-14) |
  | 13 | STORY-1131 | les restes d'EPIC-145, 146, 147 |
  | 14 | STORY-1132 | la licence signée, premier incrément |
  | 15 | STORY-1133 | l'interface de l'agent publiée |
  | 16 | STORY-1134 | l'instance garde la confiance, coupée de Money Vibes |
  | 17 | STORY-1135 | mettre à jour sans peur, premier incrément |
  | 18 | STORY-1136 | le consommateur de `facturation.avoir.emis@1` dans `paiement` |

- **D-L7B-6 — deux demandes de C placées par la session de groupe (25/11)** (§1.1 : une demande adressée à B passe
  avant la story suivante ; aucun identifiant neuf) :
  1. **Ordre « c »** (après « b », avant STORY-1119) : « → B (25/11, STORY-326, puis 1101) » du journal de C —
     **republier le paquet `togo@2026` dans sa dernière version** (empreinte **`5c683d16…`**, balance-service #164,
     après 1101 et 316 ; elle porte `rapprochementAnnuel` et l'échéance des sociétés par la forme juridique) dans les
     **deux buckets de la recette** : `referentiel-packages` (le fiscal, `docker-compose.fiscal.yml:80`) et
     `referentiel-packages-essai` (l'essai, `docker-compose.recette.yml:369`) ; puis vérifier que le contrôle de
     cohérence ne rend plus `NON_EXECUTE` `TOLERANCE_ABSENTE`. **Correctif rattaché à STORY-1115** (recette #28,
     `af13aac` : la story de B qui a monté le second bucket, `referentiel-packages-essai`, dans le profil de recette) ;
     `referentiel-packages` est le bucket par défaut du catalogue (STORY-149), relié au fiscal de la recette par
     `docker-compose.fiscal.yml` (STORY-901, A) — la sous-session le confirme en relisant le code avant d'écrire, et
     cherche l'éditeur que C n'a pas trouvé (dans la recette, seul `zone-franche.recette.ts` publie un paquet fiscal,
     lu dans le checkout de `balance-service`). Commits `MNV-1115(recette): …`.
  2. **« → B (25/11, STORY-1020) »** — recopier `balance` **1.2.0** au catalogue : **dès que le code de C est fusionné
     sur `dev` de `balance-service`**, comme une **quatrième suite de STORY-979**, entre deux stories ; **pas avant**
     (D-979-24 : un manifeste ne précède pas son code au catalogue).

- **D-L7B-7 — ordre « c′ » : la demande de A placée avant c** (25/11, session de groupe ; §1.1) : « → B (25/11,
  AP-55) : autoriser `Idempotency-Key` dans le CORS du BFF `admin-panel` » (journal de A, « Pièges », AP-55). Demande
  de A placée avant c : petite, sans Docker, elle débloque AP-55 déjà livrée. **Correctif rattaché à STORY-917**
  (BFF #35, `f27d10a` : la story qui a ouvert le relais de `Idempotency-Key`, D-917-4) ; aucun identifiant neuf ;
  commits `MNV-917(admin-panel): …`.

- **D-L7B-8 — ordre « d » : la demande de C placée avant 1119** (25/11, session de groupe ; §1.1) : « → B
  (2026-11-25, STORY-1019) : la recette `atelier-balance` doit octroyer `conseil` au cabinet » (journal de C). Petite,
  dans la recette de B, et la suite de l'Atelier rougit sans elle. **Correctif rattaché à STORY-100** (la story qui a
  écrit l'octroi des droits du cabinet dans `atelier-balance`, `0874cff`) ; aucun identifiant neuf ; commits
  `MNV-100(recette): …`.

- **D-L7B-9 — ordre « e » : la demande de D placée après STORY-1123, avant STORY-1124** (26/11, session de groupe ;
  §1.1) : « → B (2026-11-26, STORY-1140) : publier le contrat de l'export C13 en CSV de `prospera-bilan-service` dans
  `prospera-plateforme/contrats/instance/` » (journal de D, « Demandes », docs #953, `main` `67efaf9`). Part « moteur » de
  B dans la plateforme, sans Docker ; deux services servent déjà la forme (balance, STORY-1021 ; bilan, STORY-1140), et
  chacun s'y rangera par une recopie à l'octet. **Suite de STORY-953** (plateforme #17, `5a50249` : la story qui a publié
  `contrats/instance/`, étiquette `contrats-instance-v1`) ; aucun identifiant neuf ; commits `MNV-953(plateforme): …` ;
  décisions D-953-10 → 15 dans sa fiche (« Suite du 2026-11-26 »).

- **D-L7B-10 — ordre « f » : la demande de C placée après STORY-1125, avant STORY-1126** (26/11, session de groupe ;
  §1.1) : « → B (2026-11-26, STORY-324) : la pièce de validation du client dans la GED (`document-service`) » (journal
  de C, « Demandes aux autres groupes », `main` `8f7fb2c` ; fiche `STORY-324.md`, D-324-2, D-324-3 ; fiscal #74, `dev`
  `060c85c`). Sans urgence (le défaut de C tient : rien n'est vérifié chez la GED), mais dans le dépôt que B tient, et
  STORY-1125 l'occupait : elle passe dès sa fin, avant la recette des archives (1126), qui la rejouera. Deux gestes : une
  nature `VALIDATION_CLIENT` au plan du cabinet (table `2026.2`) et la lecture des métadonnées d'une version par sa
  référence (`GET …/ged/cabinet/pieces/{pieceId}/versions/{version}`, manifeste `ged` 1.10.0). **Suite de STORY-1119**
  (document-service #33, `b7b3f91` : la story de B qui a donné aux archives leur valeur de preuve ; le plan de
  classement vient de STORY-1087, de C) ; aucun identifiant neuf ; commits `MNV-1119(ged): …` ; décisions D-1119-19 → 26
  dans sa fiche (« Suite du 2026-11-26 »). Recopie au catalogue avec « g » (D-1119-25).

- **D-L7B-11 — ordre « g » : la demande de D placée après « f », avant STORY-1126** (26/11, session de groupe ; §1.1) :
  « → B (2026-11-26, STORY-1141) : recopier le manifeste `paiement` 1.2.0 au catalogue » (journal de D, « Demandes » ;
  source `main` `6a5d3ab`, #967 ; code fusionné : paiement #126). Minuscule, sans Docker, dans le catalogue de B. Le même
  geste que « a » : **cinquième suite de STORY-979** (la story des recopies de manifestes au catalogue : #71, #74, #75, #76) ;
  aucun identifiant neuf ; commits `MNV-979(manifestes): …` ; décisions D-979-35 → 40 dans sa fiche
  (« Cinquième suite (2026-11-26) »). La copie est entière : elle porte aussi `ged` 1.10.0 de « f » (D-1119-25). Sa PR
  de docs finale ferme aussi la passation de `prospera-paiement-service` (prêtée à D pour STORY-1141, rendue le 26/11).

- **D-L7B-12 — ordre « h » : la demande de D placée après STORY-1129, avant STORY-1130** (26/11 au soir, session de
  groupe ; §1.1) : « → B (2026-11-26, STORY-335) : recevoir dans le fonds d'archives du client les pièces du dépôt d'une
  déclaration » (journal de D, « Demandes », stories #1009, `main` `af552d3` ; fiche `STORY-335.md`, D-335-9, Q-D-31).
  Non urgente, mais D ne code rien avant le choix de la forme, et elle est dans le dépôt que B tient (`document-service`).
  **Suite de STORY-1124** (document-service #38, `b18d3ad` : la story de B qui a fait entrer au fonds ce qu'un autre
  service annonce par un fait proposé par B) ; aucun identifiant neuf ; commits `MNV-1124(ged): …` ; décisions D-1124-13 →
  24 dans sa fiche (« Suite du 2026-11-27 »). Le fiscal (dépôt de C, D y écrit par dossier) n'est que lu.

- **D-L7B-13 — ordre « i » : la demande de C placée avec « h »** (27/11, session de groupe ; §1.1) : « → B : recopier au
  catalogue le manifeste `comptabilite` 0.6.0 » (journal de C, #1015, `main` `9149604` ; source `prospera-stories@0acfd14`,
  code fusionné : comptabilite #21, STORY-338). La recopie de `ged` 1.11.0 de « h » est entière (`manifestes:copier`) :
  elle emporte `comptabilite` 0.6.0, déjà sur `main`. **Suite de STORY-979** (la story des recopies au catalogue) ; aucun
  identifiant neuf ; même PR du catalogue que « h ». La route que la comptabilité lit dans la GED (`GET
  …/ged/cabinet/pieces/{pieceId}/versions/{version}` : empreinte, nature, dossierId, etat, version) n'est pas touchée par
  « h ».

- **D-L7B-14 — ordre « j » : la suite de « h » placée après STORY-1137 et « k », avant STORY-1131** (27/11, session de
  groupe ; §1.1) : D a fusionné le fait et la route dans le fiscal (`prospera-fiscal-service` #89, `dev` `dae6a10` ; docs
  #1023, #1028, `main` `5a07107`) et n'a pas joué l'aller-retour. Trois gestes dans `document-service` : vérifier que
  l'octet du fiscal et celui de C (`comptabilite.facture.desinscrite`, comptabilite #21, `58803f5`) sont ceux de la GED,
  passer les deux faits de « proposition » à « publié », et jouer l'aller-retour réel sur une pile `grp-b` neuve, avec
  le vrai fiscal (image depuis l'archive de `origin/dev` du dépôt de C, lecture seule) et un jeton de service né dans la
  pile. **Deuxième suite de STORY-1124** (la story de « h ») ; aucun identifiant neuf ; commits `MNV-1124(ged): …` ;
  décisions D-1124-27 → 33 dans sa fiche (« Suite du 2026-11-27 (bis) »). « k » (droit `regler`, `auth-service`) est servie
  à part, par une autre sous-session.

- **D-L7B-15 — ordre « k » : la demande de C placée en tête, après STORY-1137, avant la demande « j »** (27/11, session
  de groupe ; §1.1 ; D-L7B-14 est celui de « j ») : « → B (2026-11-27, STORY-342) : attribuer le
  droit `fiscalite:declaration:regler` chez auth-service » (journal de C, « Demandes aux autres groupes », `main`
  `dec9891` ; annonce #1031 ; code fusionné : fiscal #93, `dev` `6cd99ee`). **Elle bloque C** : tant qu'auth ne l'émet pas,
  `POST /api/v1/obligations/{id}/reglements` refuse `403 DROIT_FISCAL_REFUSE` à tout le monde. Petite, sans Docker, dans
  auth (dépôt de B). **Septième suite de STORY-979** (la story des droits du cabinet au catalogue de tenant : `ged:*`,
  puis le même geste que STORY-1121) ; aucun identifiant neuf ; commits `MNV-979(auth): …` ; décisions D-979-43 → 49 dans
  sa fiche (« Septième suite (2026-11-27) »). Le point (3) de C (le manifeste `declarations`) est noté, pas fait (choix
  par défaut de C).

- **Avancement** :
  - **a — troisième suite de STORY-979 (25/11) — faite** : `facturation` 1.2.0 et `paiement` 1.1.0 recopiés au
    catalogue depuis `prospera-stories@bd9340e` (← D, STORY-1073) ; `balance` 1.1.0 entraînée par la copie entière
    (← C, STORY-1117, servie ici ; la 1.2.0 de STORY-1020 attend la fusion de son code, D-979-24) ; **catalogue #75**
    (`0425fef` sur `dev`) ; contrat annoncé avant la fusion (stories #891, `78c2268`). `manifestes:garde` verte (48)
    contre `bd9340e` ; catalogue 1 621 passés (3 suites rouges connues) ; 3/3 mutations. Sans Docker, verrou non pris.
    Tracker refermé.
  - **b — correctif de STORY-1073 (25/11) — fait** : `formeJuridique` publiée sur tout dossier, client compris ; les
    huit autres champs de la fiche restent au seul dossier propre (← D, STORY-1077, servie) ; **dossier-service #59**
    (`645a699` sur `dev`) ; contrat annoncé avant la fusion (stories #895, `6587f56`). Node 25 : 3/3 suites par
    chemin (208), complète 109/116 (7 rouges connues), e2e 10/10 (395) ; lint, build ; 6/6 mutations. Rejeu : `npm run
    republier:dossiers`, aucune pile semée sur ce poste (D-1073-15). Sans Docker, verrou non pris. Fiche D-1073-13 → 17.
  - **c′ — correctif de STORY-917 (25/11) — fait** : le CORS du BFF annonce `Idempotency-Key` et `X-Request-Id`,
    expose `Retry-After` (← A, AP-55, servie) ; **BFF #44** (`0dfcf43` sur `dev`) ; contrat annoncé avant la fusion
    (stories #901, `000dddf`). `configurerCors` partagé par `main.ts` et les e2e, garde des en-têtes lus (D-917-5).
    Node 25 : unitaires 722/722, e2e 298/298 ; lint, `tsc`, build ; 4/4 mutations ; BFF construit démarré, préflight
    et `POST` d'installation relayé avec la clé (7/7), contre-épreuve sur `dev`. Sans Docker, verrou non pris (tenu par
    C). Fiche D-917-4 → 8.
  - **c — correctif de STORY-1115 (25/11) — fait** : la pile sème les paquets fiscaux de `balance-service` dans ses deux
    catalogues (← C, STORY-326 puis 1101 et 316, servie). Le seul déposant était `zone-franche`, qui acceptait un `409`
    en silence ; personne ne déposait à l'essai.
    - **recette #32** (`cd62296` sur `dev`) ; contrat annoncé avant la fusion (stories #907, `171dc33`).
    - Unitaires 159/159 ; 6/6 mutations.
    - Pile `grp-b-recette` neuve depuis `origin/dev` : `zone-franche` + `essai-mise-en-service` 14/14 ;
      `5c683d16…` aux deux registres (`referentiel-packages`, `referentiel-packages-essai`).
    - Le contrôle de cohérence d'une TVA s'exécute (`ECART`, tolérance 1 000 du paquet) ; contre-épreuve : le paquet
      de 907 refusé `PERIME`.
    - Verrou tenu à tort pendant une coupure réseau (14:14 → 20:00), puis repris et rendu à 20:29 après C. Fiche
      D-1115-13 → 18.
  - **Quatrième suite de STORY-979 (25/11, D-L7B-6, 2) — faite** : `balance` 1.2.0 recopié au catalogue depuis
    `prospera-stories@ac8e450` (← C, STORY-1020, servie ; code fusionné : balance-service #165, `58322c4`) ; la copie
    entière n'entraîne rien d'autre (seul `bdf7218` touche `manifestes/` depuis `bd9340e`) ; **catalogue #76**
    (`66a4f6c` sur `dev`) ; contrat annoncé avant la fusion (stories #913, `0ee7144`). `manifestes:garde` verte (48)
    contre `main` ; catalogue 61/61 par chemin, complète 1 622 passés (3 suites rouges connues) ; 3/3 mutations. Sans
    Docker, verrou non pris. Tracker refermé. Fiche D-979-29 → 34.
  - **d — correctif de STORY-100 (25/11, D-L7B-8) — fait** : `atelier-balance` octroie `conseil` au cabinet après
    `balance`, attend la porte du conseil (Kafka), et le voisin (`balance` sans `conseil`) éprouve `403
    CONSEIL_NOT_ENTITLED` (← C, STORY-1019, servie) ; **recette #33** (`9ca8abc` sur `dev`) ; aucun contrat touché.
    Pile `grp-b-recette` neuve depuis `origin/dev` (balance `ab4e468`) : rouge sur `dev` 10 échecs / 51, tous
    `CONSEIL_NOT_ENTITLED` ; vert `atelier-balance` 52/52 et `cabinet-moteur` 9 passés (2 sautés, essai seulement ; FR-6
    intact). `INSTALLATION_SERVICES` inchangé : `conseil` y entre avec STORY-1129 (D-100-4) ; `INSTANCE_ESPACE` du balance
    déjà réglé par `RECETTE_ESPACE` (D-100-5). Verrou 20:56 → 21:15, `down -v`. Fiche D-100-1 → 6.
  - **1 — STORY-1119 (25/11) — faite** : les archives du cabinet ont valeur de preuve. **document-service #33**
    (`b7b3f91` sur `dev`) ; **catalogue #77** (`f4fcee0`, `ged` 1.4.0 recopié) ; contrat annoncé avant le code (stories
    #918, `13e17a4`). Journal d'intégrité chaîné par cabinet (atomique avec l'acte ; consultation sensible sans trace =
    503), contrôle des empreintes par la file BullMQ du service (`GED_CONTROLE_INTEGRITE_MOTIF`, écarts nommés, deux
    neufs), attestation et certificat figés. Aucun droit neuf (auth inchangé), aucun fait Kafka neuf. Node 25 : unitaires
    1196, e2e 209/209 ; Node 24 : 1198, 209/209 ; mutations 15/15 (+2/2) ; pile `grp-b` neuve (doublure d'auth) : 20
    consultations simultanées sans fourche, octet changé dans MinIO nommé par la campagne périodique, entrée réécrite
    nommée au rang 5. Verrou 22:14 → 22:23. Fiche D-1119-1 → 18. Passation de `document-service` lue au rituel (C,
    `0716a58`) ; worktree prunable d'un autre poste retiré, branche locale `ocr-pdf` (équivalente à `dev`) supprimée.
  - **2 — STORY-1120 (25/11) — faite** : fin de mission et réversibilité. **document-service #34** (`b92ac18` sur
    `dev`) ; **catalogue #78** (`ea10b51`, `ged` 1.5.0 recopié) ; contrat annoncé avant le code (stories #926, `f3be71e`).
    Fermeture d'un fonds à la main ou **avec son dossier client archivé** (la GED consomme `dossier.updated`, déjà publié
    par `dossier-service`, groupe `ged.dossiers-clients` ; `dossier-service` inchangé), 409 `FONDS_FERME` sur tout
    versement neuf ; export complet en volumes ZIP par la file `ged-exports` (index, bordereaux, journal du fonds,
    contrôle, certificat neuf ou sa raison, originaux papier, `empreintes.sha256`) ; bordereau de restitution `BRN-` et
    exemplaire signé. Aucun droit neuf, aucun fait publié, aucune dépendance neuve. Node 25 : unitaires 1243, e2e
    213/213 ; Node 24 : 1250, 213/213 ; mutations 21/22 (+1 équivalente) ; pile `grp-b` neuve : fermeture par le dossier
    en 0,1 s, export en 0,6 s, `sha256sum -c` 12/12 OK. Verrou 23:37 → 23:44. Fiche D-1120-1 → 15. **La recopie du
    paquet fiscal de STORY-564 dans `dossier-service` (← C) n'est pas faite** : 1120 n'a pas touché ce dépôt (D-1120-9) ;
    elle reste ouverte pour la prochaine story de B sur `dossier-service` (n° 12, STORY-1130, au plus tard), sauf si la
    session de groupe la place avant.
  - **3 — STORY-1121 (26/11) — faite** : la destruction proposée, puis visée. **document-service #35** (`023446c` sur
    `dev`) ; **auth #51** (`e9c32c1` : `ged:destruction:proposer` à `CAB_ARCHIVISTE` et `CAB_ASSOCIE`,
    `ged:destruction:viser` à `CAB_ASSOCIE`, hors du jeton, 167 codes) ; **catalogue #79** (`08f08d6`, `ged` 1.6.0
    recopié) ; contrat annoncé avant le code (stories #933, `5031fc8`). « En litige ou en contrôle » n'existait nulle
    part : un **gel** posé dans la GED (fonds, exercices ou pièces ; levé par qui vise). Pièces échues lues par pages ;
    proposition `DES-` (une pièce dans une seule proposition en cours), visa jamais par le proposant (bordereau `BDE-`),
    accord du client = son bordereau signé déposé, exécution par la file `ged-destructions` sur un geste humain
    seulement ; pièces gelées, sorties ou augmentées d'une version entre-temps retirées et gardées ; fichiers, texte lu,
    tiers/NIF/montant et copies d'export détruits ; identité, empreintes, scellés, journal, `BDE-`, accord et `PVD-`
    gardés ; une version détruite n'est jamais `FICHIER_ABSENT`. Aucun fait publié (STORY-1123). Node 25 : unitaires
    1290, e2e 217/217 ; Node 24 : 112/112 suites, 217/217 ; mutations 18/18 ; pile `grp-b` neuve (course de 5
    propositions : 1 × 201, 4 × 409 ; exécution en 0,7 s ; MinIO vidé des pièces détruites). Verrou 02:24 → 02:39. Fiche
    D-1121-1 → 16. Rituel : la passation de `prospera-paiement-service` à D pour STORY-1141 (← D) est servie par la
    session de groupe (`6812a4a`), pas par cette story.
  - **4 — STORY-1122 (26/11) — faite** : retrouver dans tous les fonds du cabinet. **document-service #36** (`27f1e8d`
    sur `dev`) ; **catalogue #80** (`98d6b25`, `ged` 1.7.0 recopié) ; contrat annoncé avant le code (stories #943,
    `f7837c8`), amendé avant la fusion (#947). `GET …/ged/cabinet/recherche` dans la portée du dossier ; la recherche
    d'un fonds servie par le même **index aveugle** (`ged_index_recherche` : jetons HMAC sous une clé du cabinet dérivée
    de `GED_CLE_CABINET`, aucun mot en clair, aucun texte déchiffré à la recherche ; texte par mot entier, métadonnées par
    début de mot), tenu après chaque écriture, vidé dans la transaction d'une destruction, rattrapé par la file
    `ged-index` (`GED_INDEX_BALAYAGE_SECONDES`, tour quotidien) ; le versement d'un fonds de plus de 1 000 pièces. Aucun
    droit neuf, aucun fait publié. Node 25 : unitaires 1318, e2e 217/217 ; Node 24 : 114/114 suites, 217/217 ; mutations
    23/24 (+1 équivalente) ; pile `grp-b` neuve 39/39 (1 500 pièces d'avant la story indexées par le tour en 62 s,
    versement de 1 500 lignes, pièce détruite introuvable). Verrou en trois passages (03:23 → 03:28, 03:33 → 03:40,
    04:00 → 04:14). Fiche D-1122-1 → 16. La liste des pièces échues de tout le cabinet va à STORY-1123 (D-1122-11).
    Rituel : aucune demande neuve à B chez A, C et D.
  - **5 — STORY-1123 (26/11) — faite** : les alertes de l'archiviste. **document-service #37** (`7e65881` sur `dev`) ;
    **catalogue #81** (`85aee3a`, `ged` 1.8.0 recopié) ; contrat annoncé avant le code (stories #950, `becec97`). Cinq faits
    publiés par l'outbox dans la transaction de leur cause : `ged.original.retour-en-retard` (1, 7, 30 jours),
    `ged.conservation.echeance-proche` (par fonds et par passage), `ged.quota.depasse` (par franchissement),
    `ged.integrite.ecart`, `ged.destruction.changed` (six étapes) ; `destinataires` connus de la GED ; aucun contenu de pièce.
    Passage quotidien porté par le balayage `ged-index` (aucune minuterie neuve, D-1123-3) ; l'échéance dans l'index, tenue
    par le tour ; `GET …/ged/cabinet/pieces-echues` (tout le cabinet, par échéance : D-1122-11 servie). Quota : celui du service
    (D-1123-4, compteurs à STORY-1125). Aucun droit neuf. Node 25 : unitaires 1 336, e2e 217/217 ; Node 24 : 115/115 suites,
    217/217 ; mutations 13/14 (+1 équivalente) ; pile `grp-b` neuve : les cinq faits relayés et lus sur Kafka, valides, registre
    14 sujets BACKWARD. Verrou 05:11 → 07:04 (sous-session coupée par la limite de l'API, piège) puis 07:17 → 07:26. Fiche
    D-1123-1 → 14. **→ D** : la cloche et l'e-mail (« Demandes »). Rituel : aucune demande neuve à B chez A, C et D.
  - **e — suite de STORY-953 (26/11, D-L7B-9) — faite** : le contrat de l'export C13 publié dans `contrats/instance/` (← D,
    STORY-1140, servie) : `export-c13-reponse@1`, `export-c13-csv.cas.json` (huit règles, huit cas à l'octet),
    `instance-c13.openapi.json` 1.1.0 (route `GET …/export`, `Cache-Control: no-store`, refus dans leur ordre ; `Refus`
    gagne `error` et `details` facultatifs) ; **plateforme #41** (`d68a468` sur `dev`), étiquette
    **`contrats-instance-v1.1`** ; contrat annoncé avant la fusion (stories #957, `329b9d4`). Preuves : `test/contrats-instance.test.ts` 29/29 (17 avant), `npm test` 669/669, `typecheck` vert (Node 25) ; 7/7 mutations rouges sur l'assertion visée ; les huit cas du CSV rejoués à l'octet contre le code de balance (`dev` `44be0c1`) et de bilan (`MNV-1140` `e13d874`) : 8/8 chacun.
    Aucune recopie au catalogue (copie épinglée à v1, il n'appelle pas l'export ; D-953-15). Sans Docker, verrou non pris.
    Fiche D-953-10 → 15.
  - **6 — STORY-1124 (26/11) — faite** : le circuit sans trou. **document-service #38** (`b18d3ad` sur `dev`) ; **catalogue
    #82** (`9674aeb`, `ged` 1.9.0 recopié) ; contrat annoncé avant le code (stories #959, `95d4465`). Réception et boîtes dans
    une transaction ; **un verrou par boîte** (la boîte écrite d'abord dans la transaction, `ged_boites.mouvements`) pour la
    sortie d'une boîte ou d'une pièce, le retour, la restitution et l'original relié (409 `PIECE_SORTIE` neuf ; la sortie
    relit la boîte de l'original sous le verrou, 409 `PIECE_HORS_BOITE`) ; **`comptabilite.facture.desinscrite` v1 consommé**
    (proposé à C, **accepté par C pour STORY-338**, schéma repris tel quel) dans le groupe `ged.comptabilite` : copie jamais
    versée retirée du fonds (409 `PIECE_RETIREE`, hors liste, versement, export, échues et index, fichiers gardés), copie
    versée gardée, attente désinscrite jamais rangée, désinscription lue avant l'inscription notée. Aucune route ni droit
    neufs, aucun fait publié. Node 25 : unitaires 1 359, e2e 217/217 ; Node 24 : 116/116 suites, 217/217 ; mutations 24/24 ;
    pile `grp-b` neuve 41/41 (10 sorties simultanées d'une pièce : 1 × 201, 9 × 409 ; 10 retours : 1 ; restitution et
    sortie : une seule ; réception refusée par la base sans rien écrire ; RETIREE et GARDEE sur de vrais faits Kafka).
    Verrou 09:08 → 09:19, 09:22 → 09:25, gardé par le redémarrage du poste jusqu'à 09:39 (rendu à la reprise), puis
    10:04 → 10:07 (étage `verification`). Fiche D-1124-1 → 12. Rituel : aucune demande neuve à B chez A, C et D.
  - **7 — STORY-1125 (26/11) — faite** : l'archivage se mesure et se vend. **document-service #39** (`5c50ca6` sur `dev`) ;
    **BFF #45** (`959aeee`, `81817fe` sur `dev`) ; contrat annoncé avant le code (stories #969, `33ef00e`). Surface de la
    plateforme de la GED (`GET …/ged/plateforme/archivage`, `GET …/cabinets/{org}/archivage` : `org:read` ; `PUT
    …/cabinets/{org}/quota` : `entitlement:grant` ; `perms` du jeton projeté par la `JwtStrategy`) ; compteurs calculés à la
    lecture (fonds, pièces et pages versées, volume hors versions détruites, boîtes cotées non restituées ; total et mois
    UTC), aucune donnée de pièce ; quota de l'offre posé par Money Vibes (`ged_quotas_cabinet`), sinon celui du service ; le
    cabinet (`quotaSource`) et le passage des alertes le lisent (`ged.quota.depasse` inchangé) ; relais du BFF (AP-51). Aucun
    droit ni fait neufs, manifeste `ged` inchangé (aucune recopie). Node 25 : unitaires 1 379, e2e 220/220 ; BFF 740/740,
    307/307 ; Node 24 : 117/117 suites, 220/220 ; mutations 21/21 (+1 au compilateur) et 9/9 ; pile `grp-b` neuve avec le
    BFF construit appelé pour de vrai, 35/35. Verrou 11:22 → 11:30. Fiche D-1125-1 → 16. Q-SC-5 (valeur et prix de l'offre)
    reste à l'utilisateur. Rituel : aucune demande neuve à B chez A, C et D.
  - **f — suite de STORY-1119 (26/11, D-L7B-10) — faite** : la validation du client et la référence d'une version (← C,
    STORY-324, servie). **document-service #40** (`5d060aa` sur `dev`) ; contrat annoncé avant la fusion (stories #976,
    `10d9d6e`). Plan de classement du cabinet **2026.2** : `VALIDATION_CLIENT` (annuel, fiscal, non sensible, 10 ans après
    la fin de l'exercice), servie à tous les fonds, ouverts avant ou après (le plan est servi par cabinet, jamais figé par
    fonds) ; un code déjà pris par un cabinet reste le sien. **`GET …/ged/cabinet/pieces/{pieceId}/versions/{version}`** :
    empreinte au format de `ged.piece.recue`, taille, nature, dossier, état (`CONSERVEE` | `DETRUITE` | `RETIREE`) ; jamais
    le contenu, le nom du fichier ni l'index ; garde de la pièce. Manifeste `ged` 1.10.0, recopié au catalogue avec « g »
    (copie entière, D-1119-25). Node 25 : unitaires 1 390 (2 suites rouges connues du poste), e2e 222/222 ; mutations
    12/12. Sans Docker, verrou non pris ; recette de l'Atelier non rejouée (ni OCR, ni extractions, ni module commun :
    D-1119-26). Fiche D-1119-19 → 26.
  - **g — cinquième suite de STORY-979 (26/11, D-L7B-11) — faite** : `paiement` 1.2.0 recopié au catalogue depuis
    `prospera-stories@59ed625` (← D, STORY-1141, servie ; code fusionné : paiement #126, `64b5838`) ; `ged` 1.10.0 de
    « f » entraîné par la copie entière (D-1119-25, D-979-36) ; **catalogue #83** (`ce8cbc0` sur `dev`) ; contrat annoncé
    avant la fusion (stories #980, `59ed625`). `manifestes:garde` verte (48) contre `main` ; catalogue 69/69 par chemin,
    complète 1 630 passés (3 suites rouges connues) ; 3/3 mutations. Sans Docker, verrou non pris. Fiche D-979-35 → 40.
    Passation de `prospera-paiement-service` (STORY-1141) refermée : rendu le 26/11 (« Passations »).
  - **8 — STORY-1126 (26/11) — faite** : la recette des archives de bout en bout. **prospera-recette #34** (`585d8bd`,
    `9a7749a`, `3ca9907` sur `dev`) ; défaut révélé corrigé à part : **document-service #41** (`5261720`, `57f9581`) ; contrat
    annoncé avant la fusion (stories #982, `30a833b`). `recette/archives.recette.ts` (13 tests) : la console ouvre `ged` par le
    BFF ; l'archiviste reçoit 40 boîtes, les cote (étiquettes), les numérise dans leur lot (vrai PDF à couche texte lu par la
    GED, contrôlé, relié à son original), verse et scelle (attestation) ; **la facture de 2019 en deux gestes** (D-1126-8 :
    recherche du fournisseur dans l'exercice, avec la cote de l'original ; la copie) ; par le mois, par le texte lu (jamais
    celui d'une nature sensible) ; la référence d'une version (« f ») ; sortie et retour ; récolement ; la console compte par
    le BFF et pose le quota ; restitution des 40 boîtes, fermeture, export, `BRN-` ; journal intact. Le profil pose sur
    `document-service` l'espace, `AUTH_SERVICE_URL` et `GED_CLE_CABINET` (tirée par le paquet dans `.recette/`). **Défaut** :
    la GED relisait `GET /moi/droits` à chaque requête, auth limitait son adresse, 503 `DROITS_INDISPONIBLES` à la cinquième
    boîte → cache des droits 60 s par jeton (D-1126-11) ; et le recensement STORY-695 complété (la route de « f » y manquait,
    e2e rouge sur `dev`). Recette 175/175, mutations 10/10 ; GED Node 25 1 396, e2e 222/222, mutations 8/8, Node 24 117/117
    suites, 222/222 ; pile `grp-b-recette` neuve depuis `origin/dev` : **13/13** (numérisation des 40 boîtes 81 s, recherche et
    copie 126 ms). Verrou 12:48 → 13:02, 13:23 → 13:35, 13:44 → 13:49. Fiche D-1126-1 → 13. **La partie archives du lot 7 est
    finie.** Rituel : aucune demande neuve à B chez A, C et D.
  - **9 — STORY-1127 (26/11) — faite** : les référentiels habilités dans l'état publié. **catalogue #84** (`efedd3e` sur
    `dev`), étiquette **`contrat-etat-publie-v1.1`** ; contrat annoncé avant le code (stories #992, `650024d`).
    `module.referentiels` (la liste du droit, forme de `entitlement.changed` v2, `artifactUri` et `checksum` pour les modules
    fiscaux ; omise hors installation, jamais vide) à la route, à la console (1080) et dans `etat-publie.changed@1` ; l'émetteur
    republie sur un changement de liste (et une fois au premier démarrage, pour les droits qui en portent) ; OpenAPI 1.1.0 ;
    manifeste `instance` 1.1.0 recopié. BFF et plateforme inchangés (D-1127-8, 9). Node 25 : 1 657 passés (3 rouges
    connues) ; mutations 14/14 ; Node 24 : 104/104 suites, 1 676 ; pile `grp-b` neuve : Karapace v1 → neuf BACKWARD, test:schemas
    6/6, test:socle 19/19, catalogue construit (n° 5 republié, n° 1 fiscal avec intégrité, n° 6 sur changement, second
    démarrage muet ; route et console). Verrou 14:29 → 14:43, 14:51 → 14:52. Fiche D-1127-1 → 13. **→ C et D** prévenus
    (message ; D tient `assurance`). Date dure tenue (fusion le 26/11, D-L7B-5). Rituel : aucune demande neuve à B chez A, C et D.
  - **10 — STORY-1128 (26/11) — faite** : le contrat d'état publié figé. **catalogue #85** (`2a19265`, `e35d6a0` sur `dev`) ;
    **plateforme #42** (`758568e`, étiquette **`contrat-etat-publie-v1.1`**) ; contrat annoncé avant le code (stories #1000,
    `6742cfb`). Un octet = une version : `contrat/historique/etat-publie/` (versions, photos 1.0.0 et 1.1.0, empreinte
    canonique) et la garde du gel (changement non versionné, ajouts seuls dans une majeure, matrice figée dans la majeure 1) ;
    Karapace `BACKWARD_TRANSITIVE` sur `etat-publie.changed.*` ; la copie publiée dans `prospera-plateforme/contrats/etat-publie/`,
    la garde partagée rejouée contre elle sans se sauter ; l'émetteur republie sur `versionCode` (D-1127-10 refermée). Aucun
    octet du contrat ne change (1.1.0). Node 25 : 1 699 passés (3 rouges connues), plateforme 674/674 ; mutations 18/18 ; Node 24 :
    105/105 suites, 1 719 ; pile `grp-b` neuve : test:schemas 9/9, test:socle 20/20, compatibilité transitive verte. Verrou
    20:38 → 20:44. Fiche D-1128-1 → 15, et **l'inventaire d'EPIC-142 → 147 et 159** (livré, story, SHA, reste, à qui ; ce qui
    reste avant de retirer `entitlement.changed`) pour STORY-1131. Date dure tenue (fusion le 26/11, D-L7B-5). Deux coupures
    du réseau pendant la story (reprises par la session de groupe). Rituel : aucune demande neuve à B chez A, C et D.
  - **11 — STORY-1129 (26/11) — faite** : le cabinet sur le moteur. **catalogue #86, #87** (`18b03ae`, `7aa5623` sur `dev`),
    **BFF #46** (`eb2fe4b`), **recette #35, #36, #37** (`d06173f`, `6fc9467`, `c0594e3`) ; contrat annoncé avant le code
    (stories #1005, `c89a3f6`). Le `PUT` d'octroi n'installe plus un module que le moteur sait vérifier (aucune vérification
    au manifeste, ou une adresse dans `INSTALLATION_SERVICES`) : 409 `INSTALLATION_PAR_LE_MOTEUR` (`modules`), rien d'écrit ;
    sanction, levée, réécriture d'un module installé et passage transitoire des modules sans adresse inchangés ; le `PUT` du
    BFF relaie les codes du moteur ; `conseil=http://balance-service:3007` (D-100-4 refermée) ; six recettes par l'offre et
    `POST /installations` (`src/moteur.ts`). AP-55 livrée (A) : rien n'est gardé derrière un drapeau (D-1129-1). Node 25 :
    catalogue 1 716 passés (3 rouges connues), BFF 744/744 et e2e 308/308, recette 189/189 ; mutations 9/9, 2/2, 9/9 ; Node 24
    106/106 suites, 1 735 ; pile `grp-b-recette` neuve (trois passes) : `cabinet-moteur` 11, `atelier-balance`, `comptabilite`
    5/5, `referentiel-par-dossier` 9/9, `abonnement` 15/15, `zone-franche` 6/6. Verrou 21:57 → 22:20, 22:23 → 22:32,
    23:29 → 00:02. Fiche D-1129-1 → 16. Une coupure du réseau (22:31 → 23:27, reprise par la session de groupe). Date dure
    tenue (fusion le 26/11, D-L7B-5). Rituel : aucune demande neuve à B chez A, C et D.
  - **h — suite de STORY-1124 (27/11, D-L7B-12) — faite** : les pièces du dépôt d'une déclaration au fonds du client (← D,
    STORY-335, servie côté GED). Forme (1) : le fait `fiscal.depot.piece-archivee` v1 (proposé à D) et une route de
    service du fiscal d'où la GED tire les octets (D-1124-14). **document-service #42** (`8f9040d` sur `dev`) ; **catalogue
    #88** (`e528afc`, `ged` 1.11.0) ; contrat annoncé avant la fusion (stories #1014, `dc05d12`). Livrable → copie
    `DECLARATION_FISCALE`, accusé → `ACCUSE_DEPOT` (plan 2026.3), validation du client rattachée sans copie ;
    `ged_pieces_fiscales` (unique sur obligation + version + nature) ; attentes nommées ; formats du fiscal (XLSX, JSON,
    XML sans lecture ; le scellé ne l'attend pas) ; `GET …/ged/cabinet/dossiers/{dossierId}/pieces-fiscales`. Node 24 :
    121/121 suites (1 448), e2e 224/224 ; Node 25 : e2e 224/224 ; mutations 23/23 ; pile `grp-b` neuve 42/43 (le KO, une
    assertion du script : la reprise voulue du dossier, D-1124-26). Verrou 01:08 → 01:17, 01:25 → 01:27. Fiche D-1124-13 →
    26. Recette de l'Atelier non rejouée (D-1124-24). **→ D** : le fait et la route à écrire tels quels (« Réponses ») ;
    **→ C** : information (le fiscal portera la route et le fait de D).
  - **i — sixième suite de STORY-979 (27/11, D-L7B-13) — faite** : `comptabilite` 0.6.0 recopié au catalogue avec `ged`
    1.11.0 depuis `prospera-stories@c926f55` (← C, STORY-338, servie ; code fusionné : comptabilite #21) ; **catalogue
    #88** (`e528afc`) ; annonce stories #1018. `manifestes:garde` verte (48) ; 71/71 par chemin. Fiche D-979-41 → 42.
    **Information** : la demande de STORY-1124 à C est servie par C (comptabilite #21, `dev` `58803f5`, schéma
    `comptabilite.facture.desinscrite` copié à l'octet de `e51c4d5`) ; la recopie de l'octet de C dans la GED (le même
    texte) reste à la prochaine story de B sur `document-service`.
  - **12 — STORY-1130 (27/11) — faite** : effacer le dossier de démonstration à la fin d'un essai (D-1082-10 refermée).
    **dossier-service #60** (`a1bf7fa`, `653a70b` sur `dev`) ; **catalogue #89** (`14c644d`) ; contrat annoncé avant la fusion
    (stories #1021, `da2dc7f`). `POST /api/v1/instance/dossier/{organisationId}/effacement` (moteur seul, essai seul,
    `effacement-c13-*@1` copiés à l'octet et jugés par le schéma copié) efface TOUT ce que le service tient de
    l'organisation (plan gardé par un invariant sur tous les schémas, journal par le pilote, outbox par `payload.orgId`,
    personnes orphelines ; `DEJA_EFFACE` au rejeu) ; au catalogue, `dossier` est **propriétaire du socle** de chaque essai,
    en tête, à la route que le moteur fixe et à l'adresse de **`SOCLE_SERVICES`** (aucun certificat sans lui ; un plan ouvert
    avant la livraison le gagne). **← C (STORY-564 → 340) servie** : paquet fiscal `e68ae10` / `d620df8b…` en LF,
    `.gitattributes` `-text` (« Réponses »). Node 25 : dossier e2e 405/405 ; Node 24 : dossier 120/120 suites, catalogue
    106/107 (suite non touchée, verte seule) ; mutations 20/20 et 9/9 ; pile `grp-b` neuve 24/24 (certificat signé nommant
    `dossier`, 22 enregistrements, 671 ms). Verrou en quatre passes courtes (02:41 → 03:08). Fiche D-1130-1 → 15. Rituel :
    aucune demande neuve à B chez A, C et D (la mise à jour 340 de C transmise par la session de groupe, servie ici).
  - **12 bis — STORY-1137 (27/11) — faite** : les modules s'ouvrent dans l'essai (ticket de 1116, refermé). **dossier-service
    #61** (`2f6e058` sur `dev`), **catalogue #90** (`be072bc`, `3454f13`, `12c4c84`), **BFF #47** (`7ac4db4`), **recette #38**
    (`e83c737`, `7999caf`) ; contrat annoncé avant le code (stories #1027, `cf8e2c5`). L'image du catalogue porte les cinq jeux
    publiés ; `POST /essais` accepte `installation` (modules, référentiels) : l'offre, puis un plan du moteur avant l'import du
    jeu et l'invitation, l'issue gardée (`essai-prospect` 1.3.0) ; le BFF relaie ; la garde de dossier ne lit pas le KYC dans
    l'essai (Q-D-17) ; la pile lève `dossier-essai`, `balance-essai`, `bilan-essai`. Node 25 : catalogue 1 802/1 804 (3 rouges
    connues), BFF 759/759 et 309/309, recette 195/195, dossier acces 53/53 et e2e 14/14 ; mutations 23/23, 15/15, 9/9, 6/6 ;
    Node 24 : dossier 120/120 (1 955), catalogue 1 821/1 822 (le rouge corrigé) ; pile `grp-b-recette` neuve depuis `origin/dev` :
    `modules-dans-l-essai` 4/4, `cinq-essais` 6/6 (cinq prospects lisent chacun son jeu sans KYC, 60 lectures croisées refusées ;
    pile ≤ 4,0 Gio). Verrou 04:25 → 08:23 (passe figée sur son relevé de mémoire, piège ; coupée à la demande de la session de
    groupe), 08:35 → 08:44, 08:48 → 08:58. Fiche D-1137-1 → 16. Q de D-1137-3 (« Questions »). Rituel : aucune demande neuve à B
    chez A, C et D.
  - **Suivante : STORY-1131** (n° 13 : les restes d'EPIC-145, 146, 147).

### Lot 6 (ouvert le 2026-11-24)

- **Plan** : `PLAN-LOT-6-2026-11-23.md` §5 (validé le 23/11) : B tient le **BFF** (`admin-panel-service`), la
  **recette**, le **catalogue**, **auth**, **kyc** (neuf pour B) et la **plateforme** (hors dossiers de C et D) ;
  **balance (cahiers) et la comptabilité passent à C** (D-L6-1). ~~bilan~~ : **`prospera-bilan-service` passe à D**
  (amendement du 24/11 au soir, D-L6-5, stories #815 ; D prend STORY-1074 → 1078) — passation écrite (« Passations »). Ordre : **1080, 1112, 1113, 1114, 1103, 1115,
  1116** ; 1112 → 1116 réservés par le plan, fiches écrites juste avant de coder. Une sous-session neuve par story. Même
  poste que D (1065 → 1071), même verrou Docker.
- **Ouverture** : la session de B du 19/11 s'était arrêtée au milieu de 1080 (recette non committée, verrou « B
  STORY-1080 03:27 » orphelin) ; le verrou a été **rendu le 24/11 par la session de groupe** (aucune pile `grp-b` ne
  tournait). Checkouts constatés : `admin-panel` sur `MNV-1081`, catalogue sur `MNV-978`, auth sur `MNV-1083`, balance
  et bilan sur `MNV-1080` — **toutes fusionnées** ; `bilan-service` garde ses deux brouillons du 15/11.
- **Avancement** :
  1. ~~STORY-1080~~ : **catalogue #67** (`fddfa7d` sur `dev`), **admin-panel #38** (`7c85076`), **recette #27**
     (`a6da2ea`), après balance #159 et bilan #182 (19/11) ; contrats annoncés avant la fusion (stories #728, #764).
     Le cabinet installé par le moteur : six vérifications `VERT` par `POST /installations`, aucun jeton posé à la
     main ; **AP-55 débloquée** — la console lit l'état publié d'une organisation (route de la console au catalogue,
     `org:read`, D-1080-14 ; relais typé au BFF, D-1080-15) et installe par les relais du BFF (preuve : la recette).
     **Recette croisée complète sur pile neuve : 11/11 suites, 142/142 tests, 1 160 s**
     (`cabinet-moteur` 11/11). Verrou pris à 02:00, rendu à 03:26 ; aucun conteneur, volume ni réseau
     `grp-b` ne reste.
  - **Trois demandes reçues le 24/11, hors des lignes du plan** (**servies par STORY-979**, ci-dessous) (« Réponses ») : D (1065) `facturation:parametres:modifier`
    au `DAF` et la recopie du manifeste `facturation` ; C (1087) le rôle `CAB_ARCHIVISTE` et les droits `ged:*` des
    rôles du cabinet dans auth, puis la recopie du manifeste `ged` 1.1.0 après la fusion de C. Toutes dans auth et le
    catalogue, sans Docker : **une story neuve de la plage de B** (le dernier identifiant libre, **STORY-979**, vérifié
    libre sur `main` et dans les PR ouvertes le 24/11, non réservé ici), **à placer par la session de groupe**
    (recommandé : après 1112, avant 1113 ; la recopie de `ged` attend la fusion de 1087).
  2. ~~STORY-979~~ : **auth #48** (`c0f6243` sur `dev`), **catalogue #68** (`d7e67f1`) et **#69** (`b75e34b`) ;
     contrat annoncé avant la fusion (stories #777, amendé par #778). Placée **avant 1112** par la session de groupe
     (§1.1 : une demande adressée à B passe avant la story suivante ; D-979-1, contre la proposition de 1080).
     - Auth : `facturation:parametres:modifier` au `DIST_DAF` seul (`AJOUTS_A_L_ANNEXE_B`) ; les sept `ged:*` du
       cabinet selon la matrice §2.3 (associé : fonds, pièces, sensibles ; collaborateur : pièces) et le **rôle neuf
       `CAB_ARCHIVISTE`** (les sept, rien d'autre ; partiel ; attribué, jamais par défaut). Hors du jeton ; catalogue
       164 codes (24 + 140), borne inchangée.
     - Catalogue : `facturation` recopiée (`droits[6]`, version 1.0.0 gardée par la source : D-979-7), puis **`ged`
       1.1.0** après la fusion de C, dans la même story (D-979-8) ; `manifestes:garde` verte (48).
     Node 25 : auth 38 suites 677/677, complète 1 445 passés (4 suites rouges connues), câblage vert (binding doublé) ;
     catalogue 1 597 passés (3 connues) ; 12/12 mutations. **Sans Docker** (D-979-9) : verrou non pris.
  4. ~~STORY-1112~~ : **catalogue #70** (`706f1b8` sur `dev`), **admin-panel #39** (`3071886`) ; contrat annoncé
     avant la fusion (stories #786). **AP-57 débloquée** : la console ouvre, suit, prolonge, signe un essai, reprend
     l'import du jeu, efface et lit le certificat, par le BFF.
     - Catalogue (D-1112-1, même solution que D-1080-14) : `GET /essais` (liste, prospect lu dans sa naissance
       d'essai, par fin, 200 au plus) et `GET /jeux-demonstration` (`org:read`) ; contrat `essai-prospect` 1.1.0.
     - BFF : huit routes sous `/api/v1/admin/essais`, projetées champ par champ (ni `detail`, ni identifiant
       d'opérateur) ; `POST /admin/essais` enchaîne le jeu du métier (choisi par le BFF, D-1112-4), la naissance et
       l'ouverture ; refus par leur code (liste fermée par statut) ; `UPSTREAM_ESSAI_TIMEOUT_MS` (D-1112-7) ; **garde
       des noms de schéma uniques posé** (D-1112-8, piège de 1084).
     Node 25 : catalogue 1 607 passés (3 suites rouges connues), e2e 5 rouges à l'identique ; BFF 604/604, e2e 247/247 ;
     mutations 7/7 et 13/13. **Pile `grp-b`** (ESSAI, vrai auth, vrai catalogue) : **38/38 contrôles**, ouverture
     201 en 8,2 s. Verrou pris à 09:58 (après D-1066), rendu à 10:07 ; aucun conteneur, volume ni réseau `grp-b` ne
     reste.
  - **Reçue le 24/11, hors des lignes du plan : → B de D (STORY-1066)** — le droit `facturation:avoir:valider` au
    `DIST_DAF` (auth, hors du jeton), la recopie du manifeste `facturation` 1.1.0 depuis prospera-stories `24049e4`
    (catalogue), et le consommateur de `facturation.avoir.emis@1` dans `paiement`. Placée par la session de groupe :
    (1) et (2) en **suite de STORY-979** (ci-dessous), (3) en story neuve **après les sept stories du lot 6**
    (D-979-14).
  5. ~~Suite de STORY-979~~ (24/11, placée après 1112, avant 1113 ; aucun identifiant neuf : D-979-10) : **auth #49**
     (`b49d8ab` sur `dev`), **catalogue #71** (`de988b1`) ; contrat annoncé avant la fusion (stories #789). Entrée du
     tracker rouverte puis refermée.
     - Auth : `facturation:avoir:valider` (« Valider un avoir au-delà du seuil ») au `DIST_DAF` seul
       (`AJOUTS_A_L_ANNEXE_B`), hors du jeton ; catalogue 165 codes (24 + 141), borne inchangée, `dv` inchangé.
     - Catalogue : `facturation` 1.1.0 recopiée depuis `prospera-stories@24049e4` (sha256 vérifié) ; ses huit droits =
       la section `facturation` d'auth ; `manifestes:garde` verte (48).
     Node 25 : auth 36 suites 592/592, complète 1 448 passés (4 suites rouges connues) ; catalogue 1 607 passés (3
     connues) ; 5/5 mutations. **Sans Docker** (D-979-15) : verrou non pris.
  - **Demande ouverte, à servir par B après le lot 6 : le consommateur de `facturation.avoir.emis@1` dans `paiement`**
    (point (3) de D, STORY-1066 ; D-979-14) : une **story neuve**, placée par la session de groupe **après les sept
    stories du lot 6** (1080, 1112, 1113, 1114, 1103, 1115, 1116), sous un **identifiant neuf réservé à l'écriture de
    sa fiche** (au-delà de la marque haute ; la plage de B 930 → 979 est épuisée). Aucun identifiant n'est réservé ici.
    Charge : « ⚠ Contrats » de D (STORY-1066) ; topic `facturation.avoir.emis`, Créance `(FACTURE, factureId)`,
    `montantTtcMineur`, rejeu sur `avoirId`, crédit du tiers au-delà du reste dû ; preuve sur pile. **Seule, et après
    le retour de `paiement`** (prêté à D pour STORY-1073 le 24/11, voir « Passations ») : elle n'est plus groupée
    avec les comptes d'encaissement, que D publie lui-même dans 1073. **`paiement` est rendu le 25/11** : placée par la
    session de groupe après STORY-1116 et la troisième suite de STORY-979 (recopie de `facturation` 1.2.0 et `paiement`
    1.1.0, ci-dessous) ; tenir compte de la signature `publier(resultat, entree)` d'`EcritureDArgent` (1073).
  6. ~~STORY-1113~~ : **catalogue #72** (`45971cf` sur `dev`), **admin-panel #40** (`25aed19`, `dcd76df`) ; contrat
     annoncé avant la fusion (stories #791, amendé par #794). **AP-56 débloquée** : la console fait naître au réel,
     met en service avec les membres de l'essai, tient les sorties de l'essai, par le BFF.
     - **La console parle aux deux espaces** (D-1113-1) : `CATALOG_ESSAI_SERVICE_URL`, `AUTH_ESSAI_SERVICE_URL`
       (facultatives, défaut : le réel) ; les essais de 1112 et les sorties vont à l'essai, la naissance au réel et la
       mise en service au réel ; un coupe-circuit par catalogue. Le jeton de l'opérateur vaut dans les deux espaces :
       condition de déploiement (D-1113-2, question à l'architecte ci-dessous).
     - BFF : `/admin/naissances` (identité reprise de l'essai), `/admin/mises-en-service` (membres de l'essai invités,
       sans les comptes du jeu ; `…/invites` les montre avant le geste), `/admin/sorties-essai` (liste blanche,
       vérification, interceptions). Catalogue : la vérification pour la console, sans journal (contrat 1.2.0).
     - **D-1113-10, trouvé par la preuve** : l'enveloppe d'erreur du BFF ne garde que `code` et `details` ; les
       précisions des refus vont dans `details`, et le relais du moteur d'installation (917, 1080) est corrigé de même.
     Node 25 : catalogue 1 612 passés (3 suites rouges connues) ; BFF 670/670, e2e 257/257 ; mutations 3/3 et 25/25.
     **Pile `grp-b` à deux espaces** (deux auth, deux catalogues, BFF) : **47/47 contrôles**. Verrou pris à 11:04,
     rendu à 11:11 (correction de D-1113-10), repris à 11:19, rendu à 11:22 ; aucun conteneur, volume ni réseau `grp-b`
     ne reste.
  7. ~~STORY-1114~~ : **admin-panel #41** (`3a5f5ef` sur `dev`) ; contrat annoncé avant la fusion (stories #798).
     **AP-59 débloquée** : la console lit le métier dans l'annuaire et la fiche, filtre la liste par métier, lit les
     métiers et change celui d'une organisation, par le BFF.
     - **BFF seul** (D-1114-1) : auth sert tout depuis STORY-171 (`vertical` en liste et en détail, `?vertical=` validé
       contre le référentiel, `GET /admin/verticaux`, `PATCH …/vertical`) ; le catalogue et les naissances ne servent pas
       le métier de l'annuaire. L'annuaire est le réel : pas de second espace ici (D-1114-2 ; le métier d'un prospect en
       essai est dans `GET /admin/essais`, 1112).
     - BFF : `vertical` dans la ligne et l'identité, filtre relayé ; `GET /admin/verticaux` (`org:read`) et `PATCH
       /admin/orgs/{orgId}/vertical` (`entitlement:grant` ; chemin des actions d'une organisation au BFF, D-1114-3) ;
       refus `VERTICAL_INCONNU`, `VERTICAL_REQUIS` (400 ; la liste rendait 503), `VERTICAL_ROLES_INCOMPATIBLES` (409,
       `details.roles`). **Aucun contrôleur ni fournisseur neuf** (D-1114-4) : les routes vont à `AdminRolesController`
       (monté sur `admin/`) et `AdminOrgActionsController`.
     Node 25 : BFF 700/700, e2e 278/278 ; mutations 13/13. **Preuve sans Docker** : e2e avec le vrai client d'auth en
     HTTP contre une doublure qui rend les corps **produits par le code d'auth** `origin/dev` `b49d8ab` (filtre
     d'erreurs, services, DTO ; fixtures `test/fixtures/auth-metier/`) ; verrou non pris.
  9. ~~STORY-1103~~ : **kyc #29** (`9cef9cb` sur `dev`), **admin-panel #42** (`c451b17`) ; contrat annoncé **avant le
     code** (stories #805, AC-1). **`kyc.correction.requested@1` publié** (outbox, schéma
     `contrat/schemas/kyc.correction.requested.json`, BACKWARD) ; **AP-62 débloquée** (« Réponses » : → A).
     - **`kyc-service` constaté le 24/11** : `origin/dev` = **`d4932c6`** (STORY-910, A) ; le checkout du poste était
       sur `dev`, un commit derrière (`de5e6d1`), propre ; branche `MNV-1103` partie d'`origin/dev`, `npm ci
       --ignore-scripts` (Node 25). Aucun piège propre à kyc dans le journal de A ; ceux du socle valent.
     - kyc : motif facultatif sur la marque d'une pièce (`motifRenvoi`, rendu au cabinet et à la console) ; `POST
       /admin/kyc/:orgId/request-correction` (`UNDER_REVIEW → PENDING_DOCUMENTS`, journal `RENVOI_CORRECTION`,
       `kyc.status.changed` + `kyc.correction.requested` dans une transaction ; 409 `RENVOI_SANS_PIECE_A_CORRIGER`
       refusé avant toute écriture) ; retour en revue quand toutes les pièces renvoyées sont remplacées (D-1103-2) ;
       texte du cabinet composé par kyc (D-1103-5) ; script du registre par `fetch`, sans dépendance neuve (D-1103-6).
     - BFF : corps facultatif de la marque, route `…/kyc/request-correction`, champs neufs du détail publiés (dont
       `reviewStatus`/`reviewedAt` de la pièce, servis depuis 128 et jamais publiés).
     - **L'e-mail au cabinet n'est pas dans un dépôt de B** (D-1103-1) : `prospera-expert-comptable` (tenu par
       personne) consomme les événements KYC et demande les messages à `prospera-notification-service` (D). Demande
       à D ouverte, D prévenu par message le 24/11 ; **l'AC-5 (mailhog) reste ouvert** avec elle.
     Node 25 : kyc unitaires 521 passés (4 suites rouges connues : binding natif, identiques sur `dev`), e2e 121/121 ;
     BFF 711/711, e2e 294/294 (doublure HTTP de kyc aux corps produits par le code de kyc de la story) ; mutations
     16/16 (kyc) et 8/8 (BFF) ; schéma validé contre l'événement produit (ajv) ; script du registre éprouvé contre un
     faux registre. **Sans Docker** (aucun module, dépendance ni Dockerfile ne change) : verrou non pris.
  10. ~~STORY-1115~~ : **recette #28** (`af13aac` sur `dev`) et **#29** (`b38b268`, défaut révélé par la recette) ;
     contrat annoncé avant la fusion (stories #808). **Le parcours « essayer, puis mettre en service » vert de bout en
     bout sur pile neuve.**
     - **Le second espace dans le profil de recette** (D-1115-1 → 5) : `auth-essai` (`127.0.0.1:3021`), `catalogue-essai`
       (`127.0.0.1:3023`), `kafka-essai`, `redis-essai`, levés à la demande ; aucune adresse du réel (garde) ; secret du
       moteur propre ; aucune sortie de messages ; le BFF à deux espaces. **Identité d'opérateur commune** (D-1113-2, choix
       par défaut gardé, question toujours ouverte) : la clé de signature des deux auth, tirée par le paquet dans
       `.recette/` (non versionné).
     - **Recette `essai-mise-en-service` 7/7** : essai ouvert par la console ; l'administratrice entre (premier membre
       **posé en base** : aucune route, ticket ci-dessous), invite un collègue, essaie sous un compte du jeu ; signé ;
       né au réel sous le même identifiant ; `balance` et `bilan` installés par le moteur (six `VERT`) puis **mis en
       service** (un vrai sous-ensemble, la limite de 1113 levée) ; les deux membres invités au réel sous leur identifiant
       d'essai, entrent par le lien reçu ; KYC approuvé par la console ; dossier créé ; `balance` et `bilan` ouverts.
     - **D-1115-12, trouvé par la recette** : 17 `read ECONNRESET` rougissaient quatre suites ; une connexion par appel
       (`connection: close`), PR à part — **cause non prouvée** (des coupures sont revenues avec l'en-tête, pendant la
       panne réseau du poste).
     - Recette complète sur pile neuve (images depuis `origin/dev`) : **8/12 suites, 135 tests verts, 12 rouges** —
       toutes des connexions du poste vers la pile coupées (`ECONNRESET`, « injoignable ») pendant la panne réseau du
       poste, aucune sur le second espace ; non relancée (D attendait le verrou). Unitaires 119/119 ; mutations 24/24. **Karapace** : `kyc.correction.requested@1`
       enregistré (id 1, BACKWARD), compatible ; témoin (champ neuf obligatoire) `INCOMPATIBLE`. Verrou pris à 15:47,
       rendu à 16:36, repris 16:38 → 17:05 et 17:07 → 18:20 (session coupée par la panne réseau) ; aucun conteneur, volume ni réseau `grp-b` ne reste.
  11. ~~Suite de STORY-1112 — le premier membre d'un essai~~ (`TICKET-BACKEND-premier-membre-d-un-essai.md`, D-1115-6 ;
     **placée par la session de groupe le 24/11, avant STORY-1116** et avant la démo du 15/01 ; aucun identifiant neuf,
     D-1112-10) : **auth #50** (`d69e34c` sur `dev`), **catalogue #73** (`0894425`), **admin-panel #43** (`911c450`),
     **recette #30** (`c99257a`) ; contrat annoncé avant la fusion (stories #833). Entrée du tracker rouverte puis
     refermée ; **ticket fermé**.
     - auth : la route d'invitation du moteur servie dans l'essai pour **le premier administrateur seul** (un membre
       `TENANT_ADMIN`, aucun autre administrateur actif) ; tout le reste 403 `ESPACE_D_ESSAI_REFUSE` avant le corps ;
       réel inchangé ; garde des droits et `permission.enum.ts` intacts (D-1112-11).
     - catalogue : l'essai invite son administrateur à l'ouverture, sous l'identité du moteur, **après la liste blanche
       de l'essai** (`INTERCEPTEE` sinon, journalisée), sous un identifiant tiré de l'organisation ; l'ordre rejoué
       reprend ; `invitationAdministrateur`, `identiteAdministrateur` (contrat `essai-prospect` 1.2.0 ; D-1112-12 → 15).
     - BFF : aucune route neuve ; le nom relayé, l'issue projetée (D-1112-16).
     - recette : **plus rien en base** (garde `recettes-sans-base`) ; la sortie de messages de l'essai tenue par la
       recette (`auth-essai` → `host.docker.internal:18026`, D-1112-17, D-1115-5 amendée).
     Node 25 : auth 46/46, e2e 3/3 (complète 1 464 passés, 4 suites rouges connues) ; catalogue 1 618 passés (3 connues),
     e2e 11/11 ; BFF 718/718, e2e 295/295 ; recette 137/137 ; **mutations 32/32**. **Pile `grp-b` neuve** (images depuis
     `origin/dev`) : `docker compose up` sain (catalogue et auth des deux espaces, BFF) ; **`essai-mise-en-service` 8/8
     sans aucune pose en base** ; recette croisée complète sur pile neuve 10/12 suites, 144 tests verts, 4 rouges sur deux read ECONNRESET poste ↔ pile prouvés par les journaux des services (le BFF a répondu 200 en 28 ms ; notification a servi 21 accusés puis la connexion s'est coupée), les quatre rouges de 1115 verts (atelier-balance, renvoi-du-lien, zone-franche, pile), facturation 7/7 et cabinet-moteur 9/9 rejouées seules sur pile neuve. Verrou pris à 20:17, rendu à 21:30 (construction des images, essai-mise-en-service, recette complète, deux rejeux) ; `down -v` à chaque fois ; aucun conteneur, volume ni réseau `grp-b` ne reste
  12. ~~Seconde suite de STORY-979~~ (24/11 au soir) : la demande de C (« Réponses » : ← C, STORY-1088 puis 1100),
     **placée par la session de groupe maintenant, avant STORY-1116** (aucun identifiant neuf, D-979-17, même patron
     que la recopie de `facturation` 1.1.0, D-979-10) : **catalogue #74** (`1aa17ae` sur `dev`) ; contrat annoncé
     avant la fusion (stories #843). Entrée du tracker rouverte puis refermée.
     - Catalogue : `ged` 1.1.0 → **1.3.0** et `comptabilite` 0.4.0 → **0.5.0** recopiés depuis
       `prospera-stories@f703671` (`a525d76` en est un ancêtre ; sha256 vérifiés) ; seuls ces deux manifestes changent ;
       `manifestes:garde` verte (48) ; le test de semis suit la version de `comptabilite`.
     - Auth inchangé : ses droits `comptabilite:*` et `ged:*` du cabinet sont ceux des manifestes ; les treize `ged:*`
       de l'assurance (depuis la 1.0.0) restent hors d'auth (D-979-19, « → C »).
     Node 25 : catalogue 1 619 passés (3 suites rouges connues) ; lint, build ; 2/2 mutations. **Sans Docker**
     (D-979-21) : verrou non pris.
  13. ~~STORY-1116~~ : **recette #31** (`29256bb`, `8d4d88c` sur `dev`) ; aucun contrat ne bouge (aucune annonce). Le
     catalogue n'a pas changé : rien n'a cassé sous cinq ouvertures parallèles (D-1116-6).
     - **Recette `cinq-essais`** : cinq cabinets prospects ouverts au même instant par la console, chacun intercepté dans
       SON essai hors liste blanche, puis invité par la sortie de l'essai au nom de SON cabinet ; les cinq
       administratrices entrent en même temps par leur lien (collègue, rôle, comptes du jeu, « en tant que ») ; **20
       couples** : aucun ne voit les membres, les comptes du jeu, les messages ni les destinataires d'un autre, et aucun
       geste de l'un ne change rien chez l'autre (« en tant que » un compte d'un autre 404, suspendre 404, relancer 409) ;
       contre-épreuve : une adresse administratrice d'un essai n'en tient pas un sixième (`REFUSEE`,
       `MEMBRE_EN_CONFLIT`) — **une adresse par essai**, à dire aux commerciaux.
     - **Essais à blanc** (D-1116-1, réponse à la question de 1115) : un prospect n'ouvrirait aucun module dans l'essai
       (jeu non chargé par le catalogue de l'essai de la pile, rien n'installe dans l'essai, gardes de balance et bilan
       au KYC) ⇒ `TICKET-BACKEND-modules-ouverts-dans-l-essai.md`, **à placer par la session de groupe avant le 15/01**.
     - **Mesures** : ouverture de chacun des cinq en parallèle **1,27 → 1,31 s** ; reprise 0,41 → 0,60 s ; entrée d'une
       administratrice 2,0 → 2,5 s. Mémoire (VM 7,6 Gio) : pile de base ≈ 2,0 Gio, **2,9 Gio** avec l'espace d'essai et
       les cinq essais ; recette complète **4,5 Gio au plus** (24 conteneurs). **La pile tient.**
     Node 25 : paquet 148/148 ; mutations 14/14. **Pile `grp-b` neuve** (images depuis `origin/dev`) : `cinq-essais`
     **6/6** ; recette croisée complète sur pile neuve (après la fusion ; dossier `4352ac3` et paiement `e2be149`, fusionnés par D pendant la story, reconstruits) **10/13 suites, 139 tests verts, 15 rouges** sur trois `read ECONNRESET` poste ↔ pile prouvés par les journaux des services (auth a servi `GET /users/me` 200 en 10 ms ; un dépôt de pièce KYC et une des cinq ouvertures ne sont **jamais arrivés** au service), les trois suites rejouées seules sur pile neuve vertes (`renvoi-du-lien` 8/8, `essai-mise-en-service` 8/8, `cinq-essais` 6/6). Verrou attendu de 00:09 à 00:31 (D, STORY-1073), pris à 00:31,
     rendu à 01:41 ; `down -v` à chaque fois ; aucun conteneur, volume ni réseau `grp-b` ne reste.
- **Clôture du lot 6 de B (2026-11-25)** — les sept stories du plan (§5) sont livrées, fusionnées en rebase, et leurs
  fiches sont `done` :

  | # | Story | Ce qui est vrai | Dépôts (PR) | Écran débloqué |
  |:--:|---|---|---|---|
  | 1 | STORY-1080 | balance et bilan servent leurs six vérifications ; la recette installe le cabinet par le moteur | catalogue #67, BFF #38, recette #27 (balance #159, bilan #182) | AP-55 |
  | 2 | STORY-1112 | le BFF relaie les essais d'un prospect ; **suite** : le premier membre d'un essai entre par de vraies routes | catalogue #70, #73 ; BFF #39, #43 ; auth #50 ; recette #30 | AP-57 |
  | 3 | STORY-1113 | le BFF relaie la mise en service, les sorties de l'essai, les naissances (deux espaces) | catalogue #72, BFF #40 | AP-56 |
  | 4 | STORY-1114 | le BFF relaie le métier des organisations | BFF #41 | AP-59 |
  | 5 | STORY-1103 | renvoyer un dossier KYC pour correction ; `kyc.correction.requested@1` publié | kyc #29, BFF #42 | AP-62 |
  | 6 | STORY-1115 | « essayer, puis mettre en service » de bout en bout sur pile neuve ; le second espace dans le profil | recette #28, #29 | — |
  | 7 | STORY-1116 | cinq essais simultanés sur la même pile, aucun ne voit les données d'un autre | recette #31 | — |

  **Hors des lignes du plan, servies pendant le lot** (demandes reçues, placées par la session de groupe, aucun
  identifiant neuf sauf 979) : STORY-979 et ses deux suites (droits de facturation et `ged:*` dans auth, rôle
  `CAB_ARCHIVISTE` ; manifestes `facturation` 1.0.0 → 1.1.0, `ged` 1.1.0 → 1.3.0, `comptabilite` 0.5.0 au catalogue :
  auth #48, #49 ; catalogue #68, #69, #71, #74) ; correctif de STORY-1084 (bilan #183, garde des noms de schéma) ;
  correctifs de STORY-483 et STORY-065 (bilan #184, #185 : remboursements plafonnés, version de la liasse rouverte).
  `prospera-bilan-service` est passé à D (D-L6-5) ; dossier et paiement, prêtés à D pour 1073, sont revenus le 25/11.

  **Ce qui reste ouvert à la fin du lot 6 de B** (dans l'ordre placé par la session de groupe) :
  1. **Troisième suite de STORY-979** : recopier `facturation` 1.2.0 et `paiement` 1.1.0 au catalogue (← D, 1073 ;
     placée juste après 1116, sans Docker). Le catalogue n'a pas bougé dans 1116 : rien ne l'attend.
  2. **Le consommateur de `facturation.avoir.emis@1` dans `paiement`** (← D, 1066 ; D-979-14) : story neuve, identifiant
     neuf à réserver à l'écriture de sa fiche ; tenir compte de `publier(resultat, entree)` (1073).
  3. **← D (25/11, STORY-1077) : `formeJuridique` sur les dossiers CLIENTS aussi** (`dossier-service`) — **reçue,
     à placer** (aucune urgence de démo). Recommandé : un correctif rattaché à STORY-1073 (D-1073-2 a posé la condition
     « dossier propre »), un seul champ, déjà déclaré facultatif, puis `npm run republier:dossiers`.
  4. **`TICKET-BACKEND-modules-ouverts-dans-l-essai.md`** (STORY-1116) — à placer par la session de groupe avant le
     15/01 : B (jeux des verticales dans le catalogue de l'essai, installation dans l'essai), C (garde de balance), D
     (garde de bilan) ; décision d'architecture sur le KYC dans l'essai.
  5. **Lot 7 : `document-service` passe à B** (← C, 25/11, plan #848 ; dernier commit de C `0716a58`).
  6. Questions ouvertes : D-1113-2 (identité d'opérateur commune, choix par défaut joué par la recette) ; D-1103-1
     (servie de fait par D, STORY-1072 : l'e-mail du renvoi part, AC-5 de 1103 vu dans mailhog).
  7. Cosmétique (STORY-1116) : dans l'essai, l'invitation d'un collègue (`POST /users` d'auth) dit « votre cabinet » et
     non le nom du prospect.
  - **Suivante (lot 7 de B, placée par la session de groupe)** : la troisième suite de STORY-979 (recopie de
    `facturation` 1.2.0 et `paiement` 1.1.0 au catalogue), puis le consommateur de `facturation.avoir.emis@1` dans
    `paiement` ; voir « Ce qui reste ouvert » ci-dessus.
  - **Reçue le 24/11, hors des lignes du plan : → B de A** (journal de A, fin du « Lot 6 ») — deux résultats faux de
    `bilan-service` visibles à la démo du 15/01 : la projection qui rembourse plus que la dette
    (`TICKET-BACKEND-projection-remboursements-non-plafonnes.md`, accepté par l'utilisateur le 19/11) et la liasse
    rouverte lue avec `version: null` (`TICKET-BACKEND-liasse-rouverte-version-null.md`), « à placer après 1080 ».
    ~~Ouverte, à placer par la session de groupe~~ **Placée par la session de groupe avant STORY-1103** (24/11, §1.1 :
    une demande adressée à B passe avant la story suivante). Deux **correctifs**, aucun identifiant neuf : chacun se
    rattache à la story qui a introduit le défaut — la projection à **STORY-483** (`dettesFinancieres` = base +
    emprunts − remboursements, sans plafond ; `DETTES_FINANCIERES_NEGATIVES` y est né), la liasse à **STORY-065**
    (`consulter` ne lisait la version que d'un jeu `VALIDE`, `cb8aa33` ; recopié par STORY-449). Commits
    `MNV-483(bilan): …` et `MNV-065(bilan): …`, une PR de code par ticket, une PR de docs qui ferme les deux.
    Contrat annoncé avant la fusion (« ⚠ Contrats »). **Servie**, ci-dessous.
  8. ~~Correctifs de STORY-483 et de STORY-065~~ (tickets de A, placés **avant 1103** ; aucun identifiant neuf) :
     **bilan #184** (`d98b7c4` sur `dev`, branche `MNV-483-remboursements`) et **bilan #185** (`7b53ff5`, branche
     `MNV-065-rouverte`) ; annonce avant la fusion : stories #802. Deux PR de code, une par ticket : deux défauts
     indépendants, deux stories d'origine, et la seconde se relit sans la première. Tickets fermés.
     - **Projection (STORY-483, D-483-8 → 10)** : le remboursement retenu vaut `min(saisi, encours restant)` (base +
       emprunts nouveaux − déjà remboursé), et la réponse le dit (`avertissements`, `REMBOURSEMENT_PLAFONNE` avec
       l'exercice et l'excédent non remboursé) ; c'est le flux qui est plafonné (équilibre, identité de somme constante
       et articulation mensuelle intacts). Pas de plafond quand l'encours n'est pas connu (base non ancrée, ventilation
       indéterminée) ni sur le chemin du dossier de financement (échéanciers de 1084 ; leur échéancier ne change pas).
       Jeu du ticket : dette 100 000, 0, 0 ; `DETTES_FINANCIERES_NEGATIVES` ne sort plus. Comparaison
       (`REMBOURSEMENTS_PLAFONNES`), export (métadonnée), modèle 1.13.0 → **1.14.0**.
     - **Liasse (STORY-065, D-065-1 → 3)** : `version` = la dernière version figée sur `GET …/etats/{id}`,
       `recalculer` et `complements` (même source que `rouvrir`) ; la liste la porte aussi (une agrégation) ;
       l'analyse et la consultation gardent la version **servie** (lue sur `origine`). Test valider → rouvrir → lire.
     - Node 25 : projection, spec du ticket 14/14, e2e 717/717 et export 14/14, mutations 11/11 ; liasse, e2e
       valider → rouvrir → lire, mutations 8/8 ; suite unitaire complète : les 15 rouges connues (binding, chemins
       Windows) ; garde des noms de schéma vert ; OpenAPI 579 → 581 schémas, 98 chemins identiques.
     **Sans Docker** (aucun module, dépendance ni Dockerfile ne change) : verrou non pris.
  3. ~~Correctif de STORY-1084~~ (ticket de A pour FE-140, placé **avant 1112** par la session de groupe, §1.1 ; aucun
     identifiant neuf) : **bilan #183** (`2364abc` sur `dev`, branche `MNV-1084-schema`) ; annonce avant la fusion :
     stories #783. La classe de la dette devient `ValeurIndicateurDetteDto` (D-1084-16) ; **garde neuf** sur le
     document OpenAPI de tout `AppModule` (`src/openapi-schemas-uniques.invariant.spec.ts`, D-1084-17), qui a trouvé
     **trois autres doublons**, corrigés ici (D-1084-18 : `ExerciceCompareConsolideDto`, `ArticulationMensuelleDto`,
     `ReferentielRefDto` commun). Contrat servi inchangé ; document 576 → 579 schémas, 98 chemins identiques. Node 25 :
     garde 8/8, e2e 913/913 (7 suites), unitaire 15 suites rouges connues ; mutations 4/4. **Sans Docker** (aucun
     module, dépendance ni Dockerfile ne change) : verrou non pris. Ticket fermé.

### Lot 4 (ouvert le 2026-11-18)

- **Plan** : `PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3 : B tient le backend du cabinet (balance, bilan, dossier, BFF
  `admin-panel`, `prospera-recette`, venus de A, D-L4-1) en plus du sien ; **sans Docker d'abord** (D-L4-3). Ordre :
  974, 973, 1083, 1084, 1081 (sans Docker), puis 976, 975, 1082, 1093, 1080 (pile ; recette croisée complète jouée une
  fois, en dernier). Même poste que D, même verrou Docker.
- **Avancement** :
  1. ~~STORY-974~~ : **auth #45** (`e83568d` sur `dev`), **catalogue #61** (`a672a44`), contrat annoncé avant la fusion
     (stories #682). L'invitation au réel à la mise en service (AD-15, FR-42 ; D-951-8 tenue avant février).
     - Auth : `PUT /api/v1/interne/organisations/{org}/invitations`, identité du moteur seule, réel seul (403
       `ESPACE_D_ESSAI_REFUSE` avant le corps) ; chaque membre de l'essai naît sous **son identifiant de l'essai**,
       `INVITED`, avec son rôle et son rôle métier ; e-mail après la transaction, au nom de l'organisation ;
       idempotente par membre, refus en bloc.
     - Catalogue : l'ordre de mise en service reçoit `invites` (les utilisateurs de l'essai, transmis par la console :
       le réel ne connaît pas l'essai, D-974-8) ; acceptée ou rejouée, elle les invite après sa transaction ; issue dans
       le bilan (`invitations`), sans donnée personnelle ; contrat `mise-en-service` 1.1.0.
     Node 25 : auth 1 423/1 423, catalogue 1 548/1 548 ; câblage du module racine vert ; 21/21 mutations. **Sans
     Docker** : le démarrage se verra à STORY-1080 (D-974-11). Aucun dépôt de A touché : la passation de A
     (balance `98078b0`, bilan `1651d33`, dossier `768a4aa`, BFF `18a9893`, recette `f7944dc`) reste à constater par la
     première story de B sur ces dépôts (1083).
  2. ~~STORY-973~~ : **comptabilite #11** (`dd3dc52` sur `dev`), contrat annoncé avant la fusion (stories #687). Le
     plan SMT propre (D-961-1 renversée par l'utilisateur).
     - Plan SMT version 2 : le **journal de trésorerie** `TR` (recettes et dépenses, nature neuve `TRESORERIE`) et les
       à-nouveaux `AN` (lus par la clôture, le grand livre et la balance, D-973-2). Un exercice arrêté en `SMT@1` garde
       ses six journaux.
     - Deux formes de plan reconnues à leurs natures, sans nommer de référentiel (D-973-3) : partie double ou
       trésorerie, jamais mêlées ; démarrage refusé sinon.
     - Lettrage avec écart sans journal d'OD : 409 `JOURNAL_DES_OPERATIONS_DIVERSES_ABSENT` au lieu d'une 500
       (D-973-5).
     Node 25 : 741 passés (4 suites rouges à l'identique sur `origin/dev`) ; 10/10 mutations. **Sans Docker** :
     `test:socle` à jouer à STORY-975.
  3. ~~STORY-977~~ (story **neuve** de la plage de B, hors des lignes du plan : la demande de D du 18/11, placée avant
     1083 par la session de groupe, D-977-1, contestable) : **auth #46** (`682bba4` sur `dev`), contrat annoncé avant
     la fusion (stories #690). `terrain:parametres:modifier` au catalogue de tenant, **hors du jeton**, à `DIST_DG` et
     `DIST_ADMIN` seuls (`AJOUTS_A_L_ANNEXE_B`, comme `commande:parametres:modifier`) ; aucun rôle de l'IMF. Catalogue
     153 codes, DG 46 droits, `DIST_ADMIN` 25. Node 25 : 7 suites des droits 167/167, suite complète 1 425 passés (4
     suites rouges connues, binding de Confluent) ; 7/7 mutations. **Sans Docker** (D-977-7).
     - **Vu au rituel, pour 975 ou 1080** : la copie des manifestes du catalogue (`copies.json`) est en retard sur
       `prospera-stories/manifestes` : `npm run manifestes:garde` est **rouge** (`terrain : droits[11]`, le droit de
       D-1060 ; `comptabilite` : `avertissementDesinstallation`, `routesLectureSeule[17 → 21]`). Sans effet sur auth ;
       à recopier (`npm run manifestes:copier`) par la prochaine story de B qui touche le catalogue.
  4. ~~STORY-1083~~ : **bilan #180** (`36c22fa` sur `dev`), **auth #47** (`96f8ab3`), contrat annoncé avant la
     fusion (stories #692, amendement #693). Le module `financement` (M49) dans bilan : garde
     `FINANCEMENT_NOT_ENTITLED` par l'état publié du module, droits lus par `GET /moi/droits` (première lecture de
     `/moi/droits` dans bilan), table de FR-1 exacte, versions d'un dossier remis, piste d'audit ; trois droits hors
     du jeton dans auth (associé : les trois ; collaborateur : préparer et consulter). Première story de B sur un
     dépôt de A : **passation de bilan constatée** (voir « Passations »).
     Node 25 : e2e 82/82, unitaires neufs 130, suite complète 16 suites rouges à l'identique sur `origin/dev` ;
     câblage du module racine vert (binding doublé) ; mutations 14/15 + 1 équivalente (bilan), 5/5 (auth).
     **Sans Docker** (D-1083-1) : **le démarrage réel de bilan avec `FinancementModule` est à prouver par la première
     story qui lève bilan (1082, au plus tard 1080)**.
     - **Le catalogue ne connaît pas encore `financement`** (D-1083-5) : à recopier avec les autres manifestes par
       975 ; d'ici là, toutes les routes du module répondent 403 `FINANCEMENT_NOT_ENTITLED`.
  5. ~~STORY-1084~~ : **bilan #181** (`d236c56` sur `dev`), contrat annoncé avant la fusion (stories #695). Les emprunts
     du dossier de financement (prêt demandé, dettes existantes), leur échéancier exact au franc (25 000 000, 12 %,
     48 mois ⇒ 658 346 / 658 339 / 6 600 601, en dur dans les tests), le scénario retenu injecté dans le prévisionnel
     en mémoire (aucune copie), les indicateurs de dette (DSCR, capacité d'endettement résiduelle, autonomie
     financière) et le plan de financement, `INCALCULABLE` motivé. Aucun droit neuf ; manifeste `financement` 0.2.0.
     Node 25 : e2e 21/21 (+ 82/82 de 1083), 71 unitaires neufs, mutations 28/28, câblage du module racine vert (rouge
     sans l'export de `JeuHypothesesRepository`), suite complète 15 suites rouges préexistantes. **Sans Docker** :
     `BilanModule` exporte deux fournisseurs de plus ; le démarrage réel reste à prouver par 1082 ou 1080 (avec 1083).
     Rituel : aucune demande neuve à B ; **← D (18/11, information, STORY-1061)** lue : `numero` de
     `facturation.facture.emise@1` n'a plus de motif `FAC-` (c'est un libellé, la clé reste `factureId`) — à garder en
     tête pour STORY-976.
  6. ~~STORY-1081~~ : **dossier #56** (`82642d6` sur `dev`), **admin-panel #37** (`650ae23`), contrat annoncé avant la
     fusion (stories #706). D-923-1 renversée par l'utilisateur : le collaborateur modifie l'identité d'un dossier de
     son portefeuille, par le BFF comme en direct.
     - dossier : `PATCH /dossiers/{id}` sans `@Roles` ; **la portée décide, dans `dossier-service` seul** (D-1081-1 :
       le BFF n'a pas les affectations) ; hors portée ou « Mon cabinet » ⇒ 404. Le `409 DOSSIER_NIF_DEJA_UTILISE` ne
       nomme le dossier en conflit que s'il est dans la portée de l'appelant (relecture sous `filtrePortee`), sinon
       muet. `CONFLIT_CONCURRENT` était déjà muet ; des tests le figent pour le collaborateur.
     - BFF : `@Roles(TENANT_ADMIN, TENANT_USER)` ; D-923-2 (code seulement) tenue.
     Première story de B sur ces deux dépôts : **passations du BFF (`18a9893`) et de dossier (`768a4aa`) constatées**
     (« Passations »). Node 25 : dossier 177/177 unitaires ciblés, 164/164 e2e (380 au complet), 7 suites rouges
     préexistantes ; BFF 15/15 e2e (236 au complet), 533 unitaires ; mutations 7/7. **Sans Docker** (D-1081-7) : le
     round-trip réel du collaborateur est une ligne à ajouter à la recette de **STORY-1080** (`cabinet-moteur`, parcours
     923, aujourd'hui joué par l'administratrice).
  7. ~~STORY-976~~ : **paiement #124** (`4684d22` sur `dev`), contrat annoncé avant la fusion (stories #709). `paiement`
     consomme `facturation.facture.emise@1` (groupe `paiement-factures`, depuis le début) et ouvre la Créance par la
     **même `OuvrirLaCreance`** que la route de D-1059 ; D-965-9 levée, demande de D servie.
     - Lecture de la forme du fait seulement (`numero` sans `FAC-`) ; le domaine juge comme pour la route. Auteur
       `MODULE` `FAIT_DE_FACTURE`. Refus métier ignoré et journalisé ; `ECRITURE_CONCURRENTE` et pannes relivrées.
       Aucune garde d'accès au module sur ce chemin (D-976-3, contestable).
     - Recette versionnée `scripts/recette/976/` (pile `grp-b`, émetteur de jetons de `ventes`, pilote).
     Node 24 (étage `verification`, image depuis `git -c core.autocrlf=false archive`) : paquets 130/130, service 347
     suites, 4 702 passés, 2 sautés, 0 échec ; conformité `rs-paiement` 15/15 (dont `factures-emises` 5/5 : 10 faits + 10
     routes concurrents ⇒ 1 naissance) ; pile `grp-b` 26/26 ; mutations 20/20.
     Verrou pris à 21:43 (atomique, après D-1062), rendu à 21:54 ; aucun conteneur, volume ni réseau `grp-b` ne reste.
  8. ~~STORY-975~~ : **comptabilite #12** (`dc6809d`, `ddc9fa5` sur `dev`), **catalogue #62** (`a5a2676`), contrat
     annoncé avant la fusion (stories #713). La comptabilité installable par le moteur (D-972-2 levée).
     - Comptabilité : identité de service `MOTEUR` seule, limitée à l'organisation du chemin ; routes du moteur hors de
       l'état publié et des droits, la garde restant globale (D-975-1, D-975-2) ; `referentiel-resolu` au contrat
       `verification-installation@1` (référentiel arrêté des exercices au journal non clôturés, par dossier, D-975-3) ;
       import C13 sans objet ; effacement complet d'une organisation d'essai par un plan gardé par un test qui lit TOUS
       les schémas, seul chemin natif qui passe outre l'ajout seul (D-975-4 → 6).
     - Catalogue : 48 manifestes recopiés (`manifestes:garde` verte : `terrain`, `facturation`, `comptabilite` à jour,
       **`financement` 0.2.0 neuf** — le 403 `FINANCEMENT_NOT_ENTITLED` de 1083 venait de là) ; l'espace d'essai nomme
       `comptabilite`. Les points vus à 977 et 1083 sont soldés.
     Node 24 : comptabilité 815 passés (56/56), catalogue 1 568/1 568 ; **`test:socle` 11/11, 244/244 sur la pile (dette
     de 973)** ; mutations 20/20. Pile `grp-b` : **`POST /installations` de `comptabilite` TERMINE en 1,1 s** (VERIFIER
     VERT non différée, OUVRIR, `EN_SERVICE` projeté), routes du moteur 17/17 (réel) et 6/6 (essai).
     Verrou pris à 22:55 (atomique, après D-1063), rendu à 23:27 ; aucun conteneur, volume ni réseau `grp-b` ne reste.
     - **⚠ Pour 1080 (D-975-11)** : le catalogue présente un jeton de service STATIQUE (`INSTALLATION_JETON_SERVICE`),
       or ce jeton est limité à UNE organisation (C2) et vit 300 s : les routes du moteur (comptabilité, balance, bilan)
       refusent `ORGANISATION_HORS_JETON` toute autre organisation. Avant que `cabinet-moteur` installe par
       `POST /installations`, le catalogue doit demander un jeton par organisation à auth (`POST
       /api/v1/interne/jetons-de-service`, secret `MOTEUR_JETON_SERVICE`) et le garder jusqu'à son terme.
  9. ~~STORY-1082~~ : **dossier #57** (`2bf9dbd` sur `dev`), **balance #157** (`d43fbe4`), contrat annoncé avant la
     fusion (stories #721). Le dossier de démonstration créé par le moteur ; fin de D-928-3, ticket
     `dossier-de-demonstration-sans-creation-par-le-moteur` fermé.
     - dossier-service : identité de service (patron D-928-1/D-975-1 ; `IDENTITE_DE_SERVICE_REFUSEE` sur les routes
       métier) ; `PUT /api/v1/instance/dossier/{org}/dossiers-de-demonstration/{dossierRef}` (création idempotente,
       origine `JEU_DEMONSTRATION`, sans responsable ni mandat, hors palier) et `…/exercices` (exercices du jeu dans
       l'ordre, l'ouvert précédent clos par le moteur, axes du jeu au premier exercice) ; MOTEUR seul, espace d'essai
       seul, garde avant le corps. L'invariant de 363 exclut nommément ce contrôleur.
     - balance : l'import C13 relaie le jeton du moteur à dossier-service, écrit sous l'identifiant rendu, et
       pré-projette les états publiés rendus en `$setOnInsert` hors transaction ; chaque balance porte son
       `exerciceId` (sans lui, bilan refusait la liasse : `BALANCE_SANS_EXERCICE`).
     Node 25 : dossier 1 871 unitaires (7 rouges préexistantes), e2e 395/395 ; balance 14 rouges préexistantes, e2e
     19/19 ; mutations 13/13 et 9/9. **Pile `grp-b`** : 46 + 11 contrôles verts — la balance 2025 validée arrive à bilan
     (jeu d'états 201) ; **bilan démarre avec `FinancementModule`** (`GET …/financements` 200) et **dossier-service après
     1081** : les deux points ouverts de 1083/1084 et 1081 sont soldés. **Passation de balance constatée** (« Passations »).
     Verrou pris à 00:13 (atomique, D libre), rendu à 00:41 ; aucun conteneur, volume ni réseau `grp-b` ne reste.
     - **Dette D-1082-10** : `dossier-service` n'efface pas le dossier de démonstration en fin d'essai (`dossier`
       n'est pas un module du catalogue : le moteur n'y appelle aucun effacement). À servir quand le moteur effacera le
       socle.
     - **Pour 1080** : D-975-11 n'a pas servi ici (jeton de l'organisation obtenu à la main) ; la recette
       `cabinet-moteur` joue désormais l'import contre le vrai dossier-service et peut ajouter validation + jeu d'états.
  10. ~~STORY-1093~~ : **balance #158** (`695b6c7` sur `dev`), **recette #26** (`a1d68d7`), contrat annoncé avant la
     fusion (stories #723). La comptabilité branchée au hub et à la recette ; les deux demandes de B à A du 17/11
     (STORY-967) sont servies.
     - balance : `comptabilite-service` dans le **défaut** d'`INGESTION_SOURCE_SYSTEMS` (une variable posée le remplace
       toujours) ; JSON Schema non touché (copie à l'octet chez la comptabilité, D-1093-2).
     - recette : `comptabilite-service` **au profil** (profil `recette`, levé à la demande ; port 3420 en boucle locale ;
       base dans le MongoDB `rs0` de la pile, aucun MongoDB dédié ; `KAFKA_ESPACE` de la pile ; `AUTH_*`,
       `AUTH_SERVICE_URL`, `DOSSIER_SERVICE_URL`, `DOCUMENT_SERVICE_URL`) ; l'IdP émet l'audience (profil, et surcouche
       fiscale qui reprend la liste entière) ; **balance lit son défaut** (`INGESTION_SOURCE_SYSTEMS: !reset null` : le
       compose racine du poste posait une liste sans la comptabilité) ; garde du profil étendue ; suite
       `recette/comptabilite.recette.ts` (sans doublure : vraie pièce chez `document-service`).
     Pile `grp-b` neuve, images depuis `git archive` : **5/5** (publication `INGEREE`, même empreinte au hub, rejeu sans
     doublon) ; témoin balance d'`origin/dev` `d43fbe4` : `REJETEE SOURCE_SYSTEM_INCONNU` ; **rejouée 5/5 sur
     `origin/dev` après la fusion** (175 s). Mutations 1/1 (balance), 8/8 (garde). **Passation de la recette constatée**
     (« Passations ») : les cinq dépôts venus de A le sont.
     Verrou pris à 01:07 (atomique, libre), rendu à 01:51 ; coupure de l'API de 01:10 à 01:30 (tâches de fond perdues,
     aucune pile ne tournait) ; aucun conteneur, volume ni réseau `grp-b` ne reste.
  11. ~~STORY-978~~ (story **neuve** de la plage de B, hors des lignes du plan : le préalable D-975-11 sorti de 1080 par
     la session de groupe, D-978-1 ; 978 vérifié libre sur toutes les branches) : **catalogue #63** (`f9e9e26` sur
     `dev`), contrat annoncé avant la fusion (stories #725). Le moteur demande à auth un jeton de l'identité `MOTEUR`
     **par organisation** (`POST /api/v1/interne/jetons-de-service`, sous `NAISSANCE_AUTH_URL` et
     `MOTEUR_JETON_SERVICE`, comme 974) pour chacun de ses appels aux modules : vérifications d'installation, import et
     effacement C13, vérification `donnees-importees` de la Reprise. Gardé par organisation jusqu'à `vie −
     JETON_DU_MOTEUR_MARGE_S` (60 s), demandes simultanées partagées, jamais présenté pour une autre organisation
     (organisation du corps ET claim du jeton), oublié sur un 401 du module. Panne d'auth ⇒ `JETON_DU_MOTEUR_INDISPONIBLE`
     (cause en `detail`), un seul appel, le module n'est pas appelé, plan `EN_ATTENTE`. **`INSTALLATION_JETON_SERVICE`
     retirée : refusée au démarrage.** Auth non touché.
     Node 25 : unitaires 31 + 25 + config, e2e auth doublée 9/9, suite complète 1 592 passés (3 suites rouges connues,
     binding de Confluent, vertes avec le binding doublé) ; câblage du module racine vert (rouge sans l'import du module
     neuf) ; 26/26 mutations ; lint, tsc, build. **Sans Docker** (D-978-11) : démarrage réel et preuve de bout en bout
     dans la recette croisée complète de 1080.
  - **Suivante : STORY-1080** (le cabinet installé par le moteur, clôture : balance, bilan, recette ; **recette croisée
    complète, jouée une fois** ; D-975-11 servi par 978). **Le catalogue de `docker-compose.recette.yml` doit recevoir
    `NAISSANCE_AUTH_URL=http://auth-service:3001/api/v1`, `MOTEUR_JETON_SERVICE` (même valeur qu'auth) et
    `INSTALLATION_SERVICES`** (avec `comptabilite=http://comptabilite-service:3420`), **jamais
    `INSTALLATION_JETON_SERVICE`** (démarrage refusé) ; preuve de 978 : deux organisations installées par
    `POST /installations` sans jeton posé à la main (fiche 978, « Pour STORY-1080 ») ; la recette `cabinet-moteur` peut
    ajouter le round-trip du collaborateur de 1081 et la validation + jeu d'états de 1082.

### Lot 3 (ouvert le 2026-11-17, fini le 2026-11-18)

- **Plan** : `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, décidé par l'utilisateur : B passe à la **comptabilité**
  (`prospera-comptabilite-service`, EPIC-111 → 119), et sert d'abord ce qu'il doit à A (kit 1.0.1, supervision) et à
  D (rôles du distributeur, Créance). Même poste que le lot 2, même verrou Docker que D.
- **Ordre** : 956 `kit-cible` 1.0.1 (+ `encours/` de D au README) → 957 supervision Kafka (puis passation de
  `notification` à D) → 958 socle de la comptabilité (**dépôt à créer par l'utilisateur**) → 959 exercices → 960 rôles
  du distributeur (auth) → 961 journaux → 962 brouillard → 963 Créance (1) → 964 validation inaltérable → 965 Créance
  (2) → 966 grand livre → 967 balance dérivée (attend A-921) → 968 tiers → 969 lettrage → 970 clôture.
- **Avancement** :
  1. ~~STORY-956~~ : **plateforme #22** (`189183f`, étiquette **`kit-cible-v1.0.1`** : jalon du 04/12 tenu),
     contrat annoncé avant la fusion (stories #580). D1 `CLE_EN_DOUBLE`, D2 textes bornés, D3 montants requis et
     états appliqués par le kit ; suite publiée élargie à 22 cas (cloisonnement, atomicité avec `PanneDeConformite`,
     cas du témoin, `controles`) ; `encours/` au README et dans les scripts racines. Node 24 : 490/0/1 sauté, MongoDB
     8.0 23/23 ; 25 + 29 mutations. D4 → D8 restent ouverts (fiche, D-956-7).
  2. ~~STORY-957~~ : **notification #89** (`5e6c553`), **paiement #121** (`1e90517`), **catalogue #59** (`5004cc5`).
     La supervision Kafka est corrigée (défauts relevés par A, STORY-908) :
     - une relance prend un consommateur neuf ; le catalogue met ses quatre boucles en commun
       (`DemarrageAvecRelance`) ;
     - `/health` est borné à 5 s avec un seul client admin (D-957-6, trouvé sur la pile).
     Node 24 vert dans les trois services ; 30 mutations rouges. Pile `grp-b` : `/health` 200 21 à 22 s après le retour
     de Kafka, message consommé par les trois services. Témoin `dev` : notification et paiement restent hors de leur
     groupe. **`notification` est passé à D** (voir « Passations »).
  3. ~~STORY-958~~ : **prospera-comptabilite-service #1** (`8f36ef9` sur `dev` ; `main` et `dev` amorcées en
     `08c6c54`), contrat annoncé avant la fusion (stories #604). Le socle de la comptabilité : garde globale sur l'état
     publié (`garde-etat-publie-v1`), cloisonnement par dossier ET par exercice (résolus par dossier-service avec le
     jeton du membre), référentiel du dossier (`GET …/dossiers/{d}/exercices/{e}/referentiel`), piste d'audit
     append-only avec `provenance` (Q3), manifeste `comptabilite`, **port 3420** (D-958-1). Node 24 180/0/2, socle
     20/20 sur MongoDB 8.0 rs0 et Kafka, 20 mutations ; pile `grp-b` : `/health` 200.
  4. ~~STORY-959~~ : **prospera-comptabilite-service #2** (`a8784cb` sur `dev`), contrat annoncé avant la fusion
     (stories #609). Les exercices et la tenue.
     - `POST …/exercices/{e}/ouverture { tenue }` ouvre à la comptabilité un exercice OUVERT de dossier-service.
       L'exercice reste celui de dossier-service (D-959-1).
     - La tenue est exclusive (CAHIERS ou JOURNAL) : index unique et collection append-only. L'autre tenue rend 409
       `TENUE_EXCLUSIVE` ; la même, rejouée, rend 200 sans rien écrire.
     - La bascule se lit sur l'exercice précédent du dossier (`bascule`, `precedente`).
     - La piste reçoit `EXERCICE_OUVERT`, avec la provenance déduite de la proposition citée.
     - Un 4e maillon global, `GardeDesDroits`, lit `@DroitRequis` par `GET /moi/droits`.
     Node 24 : 248/0/2 ; `test:socle` 36/36 (MongoDB 8.0 rs0, Kafka) ; 25 mutations ; pile `grp-b` : `/health` 200.
     **Aucun rôle n'a encore `comptabilite:*`** : en réel, l'ouverture rend 403 (D-959-4, à lever avant B-967).
  5. ~~STORY-960~~ : **auth #42** (`cf8e001`, `8d48710` sur `dev`), contrat annoncé avant la fusion (stories #616).
     Les 15 rôles du distributeur reçoivent la table de l'annexe B.2 (131 droits), appliquée par la résolution unique
     du jeton et de `/moi/droits`.
     - Le jeton est gelé à ses 24 droits ; les 118 droits neufs sont **hors du jeton** (`droitsHorsJeton`, contrat
       1.1.0). La borne tient (17 + 24 = 41 ≤ 44) sans être relevée.
     - Claim `roleMetier` dans le jeton ; `roleMetierAttribue` sur `identity.droits.changed@1` (version 2 au registre,
       BACKWARD).
     - Données privées (rémunérations, commissions, prix d'achat, marge) : retirées à la résolution, refusées à la
       surcharge (422 `DONNEE_PRIVEE_HORS_DU_ROLE`).
     Node 24 : 99 suites, 1 364/1 364 ; 11 mutations rouges ; pile `grp-b` : 26/26, cinq jetons RS256 réels ;
     `test:schemas` 16/16. **D-1053 débloquée.** La même voie (hors du jeton) lève la borne pour `comptabilite:*`
     (D-959-4) : ils restent à attribuer, avant B-967.
  6. ~~STORY-961~~ : **prospera-comptabilite-service #3** (`acafd6f` sur `dev`), contrat annoncé avant la fusion
     (stories #621). Le plan de journaux.
     - Le plan est déclaré par référentiel (`plans-de-journaux@1`, donnée du service : SN, SMT, SFD-BCEAO, CIMA ;
       six natures, codes `AC VE BQ CA OD AN`).
     - Il est **arrêté** à l'ouverture au JOURNAL, dans la transaction de la tenue (`plans_de_journaux`,
       append-only). Les séries sont amorcées à ce moment, et la piste dit `referentiel` et `planDeJournaux`.
     - `GET …/exercices/{e}/journaux` (lecture seule). Un exercice aux CAHIERS n'a pas de journaux : 409
       `EXERCICE_TENU_AUX_CAHIERS` (D-961-3).
     - Numérotation : `series-v1` copiée à l'octet, une série par journal et par exercice. Le numéro est émis
       **dans la transaction de l'acte** : ni trou ni doublon (D-961-5).
     - La source des droits lit `droits ∪ droitsHorsJeton` (D-961-7).
     Node 24 : 289/0/3 ; `test:socle` 50/50 (50 actes concurrents, dont 10 abandonnés ⇒ 1 → 40) ; 23 mutations ;
     pile `grp-b` : `/health` 200. Avant la story : demande de A servie (plateforme #26, `jeu-cabinet-v1`).
  7. ~~STORY-962~~ : **prospera-comptabilite-service #4** (`ce22d81` sur `dev`), contrat annoncé avant la fusion
     (stories #623). L'écriture en brouillard.
     - `POST …/exercices/{e}/ecritures` (`comptabilite:ecriture:saisir`) : pièce équilibrée PAR PIÈCE, montants
       entiers en unité mineure (XOF, XAF), exercice OUVERT et tenu au journal, journal au plan, date dans les bornes.
     - Le `pieceId` est vérifié chez `document-service` (`GET /dossiers/{d}/pieces?pieceId=`, jeton du membre, 3 s,
       fermé) (D-962-4).
     - Le brouillard prend un numéro PROVISOIRE (`VE-BR-000001`, série à part) dans la transaction de la saisie ; le
       définitif s'émet à la validation (D-962-1). Piste `ECRITURE_SAISIE` avec provenance.
     - Cache des droits `(membre, organisation, dv)`, 60 s, borné ; `dv` projeté du jeton (D-962-5).
     Node 24 : 358/0/3 ; `test:socle` 69/69 ; 31 + 5 mutations ; pile `grp-b` : `/health` 200.
  8. ~~STORY-963~~ : **prospera-paiement-service #122** (`716059c` sur `dev`), contrat annoncé avant la fusion
     (stories #633). La Créance (1) : un registre unique ouvert par sa source.
     - Même collection `creances` et même upsert que STORY-251 ; la clé `(source, sourceId)` est portée par l'`_id`
       (`<org>|FACTURATION|FACTURE:<SOURCEID>`), module et référence **déduits** de la source (D-963-2).
     - `FACTURE` seule servie ; les trois autres sources rendent 422 `SOURCE_DE_CREANCE_NON_SERVIE` (D-963-3).
     - `tiersId` et `perimetre` (`SOCIETE` | `FREELANCE:<id>`) figés ; autre valeur : 409
       `CREANCE_SOURCE_EN_CONFLIT` ; autre montant : anomalie tracée (D-963-5).
     - `PUT /api/v1/creances/sources/{source}/{sourceId}` sous `paiement:demande:emettre` (dans le jeton, D-963-7) :
       201 née, 200 rejeu, rien d'écrit au rejeu ; reprise bornée à 3 sur `ECRITURE_CONCURRENTE` (D-963-6).
     Node 24 : 130 + 4 578/0/2 ; conformité `rs-paiement` : 20 ouvertures concurrentes ⇒ 1 Créance, 1 trace, 1 fait ;
     21 mutations ; pile `grp-b` : `/health` 200. « → D » : comment ouvrir une Créance (pour D-1059).
  9. ~~STORY-964~~ : **prospera-comptabilite-service #5** (`92f8c53` sur `dev`), contrat annoncé avant la fusion
     (stories #640). La validation inaltérable.
     - `POST …/ecritures/{id}/validation` (`comptabilite:ecriture:valider`) : numéro définitif `VE-000001` émis par
       `numeroter` dans la transaction de la validation ; 201, puis 200 au rejeu (D-964-1).
     - `POST …/ecritures/{id}/contre-passation` : l'inverse, née validée et numérotée, liée (`contrePasse`) ; une
       seule par écriture (index unique) ; une contre-passation ne se contre-passe pas (D-964-4).
     - `PUT` et `DELETE …/ecritures/{id}` corrigent et abandonnent le brouillard ; sur une écriture validée, 409
       `ECRITURE_VALIDEE_INALTERABLE` ; garde du programme sur la collection (D-964-2, D-964-3).
     - Piste chaînée PAR EXERCICE (`rang`, empreinte SHA-256 de la précédente et la sienne, tête dans
       `chaines_de_piste`) ; `GET …/piste/verification` (`comptabilite:piste:consulter`) dit la première rupture
       (D-964-5, D-964-6). Pas de séparation des pouvoirs au niveau de l'acteur (D-964-7).
     Node 24 : 436/0/3 ; `test:socle` 98/98 (20 validations concurrentes sans trou ; chaîne rompue à la main, cinq
     ruptures détectées) ; 45 + 7 mutations ; pile `grp-b` : `/health` 200.
  10. ~~STORY-965~~ : **prospera-paiement-service #123** (`96c385f` → `ad35786` sur `dev`), contrat annoncé avant la
     fusion (stories #648). La Créance (2).
     - `paiement.creance.changed@1` : état absolu d'une Créance à source (périmètre SOCIETE), publié par l'outbox
       dans la transaction des sept gestes qui la changent ; révision par `$inc` dans `etats_de_creance` ; clé
       `orgId` ; au registre Karapace en BACKWARD (D-965-1 → 4).
     - `GET /api/v1/creances/tiers/{tiersId}/compteurs` : le crédit du tiers (les trop-perçus) et ses compteurs,
       calculés par `encours-v1` copiée à l'octet ; aucun encours servi (D-965-5, D-965-6).
     - `paiement:creance:consulter` lu hors du jeton (`/moi/droits`, cache `(membre, organisation, dv)` 60 s) :
       premier droit de `paiement` hors du jeton (D-965-7). `HorlogeDeReference` entre dans `paiement`.
     - Reporté : le consommateur de `facturation.facture.emise@1` (D n'a pas fixé la charge) ;
       `paiement.credit-tiers.changed@1` (crédit du tiers (2)).
     Node 24 : 130 + 4 662/0/2 ; conformité `rs-paiement` 13/13 (20 déclarations concurrentes ⇒ révisions 1 → 21) ;
     Karapace id 1 BACKWARD, `test:schemas` 7/7 ; 31 faits lus sur le fil ; 32 mutations ; pile `grp-b` :
     `/health` 200. **D-1059 est débloquée** (« → D »).
  11. ~~STORY-966~~ : **prospera-comptabilite-service #6** (`7fed6ce` sur `dev`), contrat annoncé avant la fusion
     (stories #652). Le grand livre.
     - `GET …/grand-livre/comptes/{compte}` : solde d'ouverture de la période, mouvements (pièce, journal, numéro
       définitif, libellé, débit, crédit, solde progressif), totaux, clôture ; pages par curseur, `reporte`.
     - `GET …/grand-livre` : comptes mouvementés (ouverture, à-nouveaux, mouvements, clôture), totaux de tous les
       comptes, équilibre, brouillards de la période comptés à part. C'est le modèle de la balance de 967.
     - Calculé à la volée sur les seules écritures `VALIDEE`, toutes les lectures dans une session MongoDB `snapshot`,
       sans projection (D-966-1). Sommes en `Decimal128` puis `bigint` ; 422 `MONTANT_HORS_BORNE` plutôt qu'un nombre
       arrondi (D-966-6). Droit `comptabilite:dossier:consulter`, déjà déclaré (D-966-9).
     Node 24 : 498/0/3 ; `test:socle` 132/132 (dont 20 validations pendant 30 lectures, toutes cohérentes ; 30 000
     lignes lues en 317 et 567 ms) ; 30 + 9 mutations rouges, dont la lecture sans instantané ; pile `grp-b` :
     `/health` 200.
  12. ~~STORY-971~~ (story **neuve** de la plage de B, insérée avant 967 par la session de groupe : **décision
     contestable**, motifs ci-dessous) : **auth #43** (`913bd92` sur `dev`), contrat annoncé avant la fusion
     (stories #656). Les droits de la comptabilité et des paramètres de `commande`.
     - **Pourquoi ici** : (1) la demande de D (D-1053-7, Q-D-5) passe avant la story suivante ; (2) les neuf
       `comptabilite:*` n'étaient attribués à aucun rôle : en réel, toute la comptabilité rendait 403, alors que la
       balance de 967 doit être publiée en réel.
     - Dix droits neufs au catalogue de tenant, **hors du jeton** (`droitsHorsJeton` de `/moi/droits`) ; borne
       inchangée (41 ≤ 44) ; 152 codes (24 + 128).
     - `CAB_ASSOCIE` : les neuf `comptabilite:*` ; `CAB_COLLABORATEUR` : six (ni ouvrir l'exercice, ni le plan de
       journaux, ni clore ; il saisit ET valide, sans séparation, D-964-7, D-971-2). Rôles par défaut du cabinet :
       tout membre les reçoit sans geste.
     - `commande:parametres:modifier` : `DIST_DG` et `DIST_ADMIN`, par `AJOUTS_A_L_ANNEXE_B`, hors de la recopie de
       l'annexe B (D-971-3).
     - `identity.droits.changed@1` et `moi-droits` 1.1.0 inchangés ; pas d'avance de `dv` (D-971-5 → 7).
     Node 24 : 100 suites, 1 387/1 387 ; 18 mutations rouges (une par droit neuf, plus le
     mécanisme). Pile `grp-b` : **24/24** ; vrais jetons RS256 de l'associé (`/moi/droits` : les neuf
     `comptabilite:*`), du collaborateur (six) et d'un `DIST_DG` (`commande:parametres:modifier`, 45 droits) ;
     **ouverture 201 et grand livre 200** au jeton de l'associé, collaborateur 403 à l'ouverture ; témoin
     `origin/dev` : 403 `DROIT_INSUFFISANT`. Deux doublures sur le fil : l'état publié `EN_SERVICE` (le catalogue ne
     connaît pas encore le module) et le KYC approuvé (pour dossier-service). Verrou rendu.
  13. ~~STORY-967~~ : **prospera-comptabilite-service #7** (`328e727` sur `dev`), contrat annoncé avant la fusion
     (stories #660). La balance dérivée du grand livre, publiée au hub de balance.
     - `POST …/balance/publications { au? }` (`comptabilite:ecriture:valider`, aucun droit neuf) : balance de
       l'exercice jusqu'à la date d'arrêté, dérivée de `comptesMouvementes` (966) — mouvements HORS à-nouveaux,
       soldes de clôture, `niveauPreuve: fichier`, libellé « Compte <numéro> » ; équilibre exact (422
       `BALANCE_DESEQUILIBREE`) ; Q2 : 409 `BROUILLARDS_A_VALIDER` (refus, pas avertissement, D-967-4) ; 409
       `BALANCE_VIDE`, `EXERCICE_CLOS`.
     - Une transaction : la publication (`balances_publiees`), le fait `balance.submitted` (outbox `outbox_events`,
       relais au moins une fois) et l'entrée de piste `BALANCE_PUBLIEE`. Origine `comptabilite`, source `direct`,
       émetteur `comptabilite-service`, `checksum` v2 du hub (ses deux vecteurs publiés), payload validé contre le
       JSON Schema du hub copié à l'octet.
     - Idempotente : même contenu que la dernière publication non rejetée ⇒ 200, même version, même `checksum`,
       rien d'envoyé ; sinon version N+1 (D-967-6). Retours `balance.created` / `balance.rejected` lus : `PUBLIEE →
       INGEREE | REJETEE` (D-967-10). Manifeste : commentaire des droits corrigé (D-971-8).
     Node 24 : 564/0/3 ; `test:socle` 150/150 ; 44/44 mutations unitaires, 10/11 du socle (une survivante nommée) ;
     `docker compose up` sain. **Pile `grp-b` 27/27** : balance-service reconstruit depuis `origin/dev` de A
     (`98078b0`) **ingère** la balance (origine `comptabilite`, même `checksum`, `statutPreuve: justifiée`, verdict
     `INGEREE` en 2 à 3 s), refuse une balance déséquilibrée (`ECART_EQUILIBRE`) et un `checksum` faux
     (`CONTENU_INVALIDE`). Verrou rendu.
  14. ~~STORY-968~~ : **prospera-comptabilite-service #8** (`92a861a` sur `dev`), contrat annoncé avant la fusion
     (stories #665). Les comptes de tiers.
     - **Registre des tiers du dossier** (clients, fournisseurs, salariés) : la comptabilité les POSSÈDE (rien de
       tel chez dossier-service, reseau ou paiement pour le dossier d'un cabinet ; référence externe facultative,
       jamais lue) ; figés à la création, idempotents par code (409 `TIERS_EN_DOUBLE`) (D-968-1, D-968-4).
     - **Collectifs déclarés par référentiel** (`comptes-collectifs@1`) : SN, SMT 401, 409, 411, 416, 419, 421, 422 ;
       CIMA 411, 414, 420, 425 ; SFD-BCEAO aucun (D-968-2).
     - **Tiers OBLIGATOIRE sur une ligne de collectif** (champs facultatifs ajoutés `tiersId`, `echeance` ; 422
       `TIERS_REQUIS` à la saisie, à la correction et à la validation) ; interdit ailleurs ; la contre-passation garde
       tiers et échéance ; les lignes validées avant 968 forment l'auxiliaire `sansTiers` (D-968-3, D-968-6).
     - **Échéance** : celle de la ligne, ou date + délai du tiers dans le sens naturel du collectif, figée (D-968-7).
     - **Auxiliaires** : `…/comptes-collectifs/{racine}/auxiliaires` (somme par tiers et par compte, `concorde`) ;
       grand livre d'un tiers (D-968-5). **Balance âgée** : NON_ECHU, 0-30, 31-60, 61-90, 91+ (paramétrables par
       requête), date d'arrêté de l'horloge de référence, non-lettré par le port `SOURCE_DES_LETTRAGES` (vide en
       968) (D-968-8, D-968-9). Aucun droit neuf (D-968-11).
     Node 24 : 639/0/3 ; `test:socle` 177/177 (27 neufs ; la suite de 967 passe avec des tiers sur ses 411, même
     checksum) ; 46/46 mutations unitaires, 9/9 du socle ; `docker compose up` sain. **Pile `grp-b` 25/25** : le jeu
     de la preuve de 967, saisi avec ses tiers, publie **le même checksum `16a6e637…`** et le vrai hub l'ingère.
     Verrou pris à 22:12 (après D-1058), rendu à 22:26.
  15. ~~STORY-972~~ (story **neuve** de la plage de B, insérée avant 969 par la session de groupe : **décision
     contestable**, D-972-1) : **auth #44** (`8661bbf` sur `dev`), **catalogue #60** (`6e5f052`, `2c3a933`),
     **plateforme #31** (`a06d8c9`), contrat annoncé avant la fusion (stories #668). Les demandes de D et de C, et la
     comptabilité au catalogue.
     - **Pourquoi ici** : (1) la demande de D (STORY-1058) et celle de C (manifestes amendés) passent avant la story
       suivante (§1.1) ; (2) sans le module `comptabilite` au catalogue, son état publié restait `NON_INSTALLE` : les
       preuves de 967 et 971 le doublaient sur le fil.
     - **Plateforme** : la ligne des trois dossiers `jeux-demonstration/grossiste-golfe*/` (D, `jeu-grossiste-golfe-v1`).
     - **Catalogue** : `copies.json` regénéré depuis `prospera-stories@51f4803` (47 copies, `comptabilite` 0.1.0 ;
       manifestes amendés de C, de D et `paiement` recopiés à leur version, D-972-3). `.env.essai.example` : la partie
       A de l'essai, `INSTALLATION_SERVICES` nomme `commande` (`ventes-service:3412`) et `terrain`
       (`terrain-service:3413`), gardé par un test (D-972-4).
     - **Auth** : `INSTANCE_ESPACE` ; les comptes du jeu (`comptes_du_jeu`, `_id = identifiantDuJeu`, sans mot de passe,
       posés par le moteur) ; la connexion « en tant que » (FR-21) ; tout est 403 `ESPACE_REEL_REFUSE` en réel
       (D-972-5, 7, 8). **Pas encore appelée par le catalogue** à l'ouverture d'un essai (D-972-9).
     - **Point (4) de D** : le catalogue n'exclut pas ces modules par code, il note le risque (D-972-6).
     Node 24 : auth 1 415/1 415, catalogue 1 536/1 536 ; 14/15 mutations d'auth (une équivalente), 5/5 du catalogue.
     **Pile `grp-b`, branche puis images d'`origin/dev`, volumes neufs** : réel 13/13 — le vrai catalogue installe la
     comptabilité et émet `EN_SERVICE` sur `etat-publie.changed.reel` ; **ouverture 201 et grand livre 200 au vrai
     jeton de l'associé, sans doublure de l'état publié** ; essai 19/19 — Kodjo, Folly, Akossiwa, Ayité posés ;
     connexion « en tant que » Kodjo (jeton `DIST_COMMERCIAL`), puis Ayité (`DIST_DG`). Verrou attendu (D-1059), pris à
     23:29, rendu à 23:45.
  16. ~~STORY-969~~ : **prospera-comptabilite-service #9** (`3f8806b` sur `dev`, rejoué de `a0af53a`, arbre
     identique), contrat annoncé avant la fusion (stories #672). Le lettrage.
     - `POST …/lettrages` : lignes VALIDÉES d'un même compte de tiers (racine du collectif, tiers, devise), équilibrées ;
       `montant` par ligne = lettrage PARTIEL (la ligne garde son reste, jamais au-delà, même sous la concurrence :
       verrou `comptes_de_lettrage` avancé dans la transaction) ; code AA, AB… par compte de tiers et exercice, jamais
       réutilisé (D-969-1 → 4).
     - **Écart de règlement** (`solderLEcart`, seuil `LETTRAGE_SEUIL_ECART` = 1 000) : écriture née validée et
       numérotée au journal OD (`OD-000001`), piste `ECART_DE_REGLEMENT_PASSE` ; `comptes-d-ecart@1` : SN, SMT 658 /
       758 ; CIMA 844 / 849 ; SFD-BCEAO aucun (D-969-8, D-969-9).
     - **Automatique** : il PROPOSE (RÉFÉRENCE — champ ajouté `reference` de la ligne —, puis MONTANT_ET_DATE à 90
       jours), il n'applique jamais ; acceptée telle quelle ⇒ `PROPOSE_PAR_LA_MACHINE`, reprise modifiée ⇒
       `CHOISI_PAR_L_UTILISATEUR` (Q3, D-969-7).
     - **Délettrage** en ajout seul (`delettrages`), tracé, refusé sur un exercice clos ; une écriture lettrée ne se
       contre-passe pas (409 `ECRITURE_LETTREE`, D-969-10). Le lettrage ne touche aucune écriture (D-969-5).
     - Le port `SOURCE_DES_LETTRAGES` de 968 lit les lettrages actifs datés à la date d'arrêté : `balanceAgee`
       inchangé (D-969-6). Balance publiée inchangée (D-969-12). Aucun droit neuf (D-969-13).
     Node 24 : 47 suites, 714 passés, 3 sautés ; `test:socle` 203/203 (26 neufs : 10 lettrages concurrents sur une
     facture de 100 000 ⇒ 3 × 201, 7 × 409, 90 000 lettrés ; balance âgée avant / après au 30/04 et au 25/02 ; même
     checksum avant et après un lettrage ; exercice clos) ; mutations 32/32 unitaires, 5/6 du socle (survivante nommée :
     le `$inc` du verrou, redondant avec la tête de la piste chaînée) ; `docker compose up` sain, sept routes mappées.
     Verrou pris à 01:54, rendu à 02:29.
  17. ~~STORY-970~~ : **prospera-comptabilite-service #10** (`b27593c` sur `dev`, rejoué de `6c7a410`, arbre
     identique), contrat annoncé avant la fusion (stories #674). La clôture.
     - **L'état « clôturé à la comptabilité »** est le SCEAU de la chaîne de piste de l'exercice
       (`chaines_de_piste.scellee`), posé par `EXERCICE_CLOTURE`, levé par `EXERCICE_ROUVERT` ; dossier-service n'est ni
       appelé en écriture ni modifié : deux verrous, deux clés (D-970-1 ; « → A », information).
     - `POST …/cloture` (`comptabilite:exercice:cloturer`, associé seul) : préalables bloquants — aucun brouillard (Q2),
       balance équilibrée, chaînes de piste de N et N+1 intactes, aucun compte hors clôture, exercice suivant ouvert au
       journal, OUVERT chez dossier-service, contigu, même référentiel, journal AN ; le non-lettré ne bloque pas
       (D-970-3). Dans une transaction : balance définitive publiée (D-970-8), centralisation par journal et par mois
       figée (D-970-4), à-nouveaux dérivés du grand livre passés dans le journal AN de N+1, nés validés et numérotés —
       bilan reporté, collectifs PAR PIÈCE NON LETTRÉE et par tiers (échéance, référence), gestion soldée dans le
       résultat à affecter (`comptes-de-cloture@1` : SN, SMT 131 / 139 ; CIMA 88 ; SFD-BCEAO 59) (D-970-5 → 7).
     - **Inaltérable** : neuf routes d'écriture rendent 409 `EXERCICE_CLOS` (`details.statut: CLOTURE`), contrôlé avant
       l'acte et dans sa transaction (`consigner`) ; des à-nouveaux ne se contre-passent pas à la main
       (`A_NOUVEAUX_DE_CLOTURE`) (D-970-2, D-970-11).
     - **Réouverture** `{ motif }` : les à-nouveaux contre-passés dans N+1 (refus s'ils y sont lettrés), tracée ; la
       clôture suivante les régénère (D-970-9). Lectures `GET …/cloture`, `GET …/centralisation`. Aucun droit neuf.
     Node 24 : 50 suites, 752 passés, 3 sautés ; `test:socle` 232/232 (29 neufs : le cycle complet sur un jeu connu,
     chaîne intacte de bout en bout ; 5 clôtures simultanées ⇒ une ; une clôture au milieu de dix lettrages ⇒ 1 avant
     le sceau, 9 refusés) ; mutations 23/23 unitaires, 10/12 du socle (deux survivantes nommées) ; `docker compose up`
     sain, quatre routes mappées. Verrou pris à 03:07, rendu à 03:38.
  - ✅ **LOT 3 DE B TERMINÉ (2026-11-18) — en attente du lot 4.** Il n'y a pas de story suivante dans le plan du lot 3.
    **Livré : les quinze stories du plan, 956 → 970, plus deux insérées, 971 et 972** (décisions contestables, motifs
    aux points 12 et 15) :
    - **ce que B devait à A et à D** : 956 `kit-cible` 1.0.1 (et `encours/` de D) ; 957 la supervision Kafka (et la
      passation de `notification` à D) ; 960 les quinze rôles du distributeur ; 963 et 965 la Créance (1) et (2) ;
    - **la comptabilité** (`prospera-comptabilite-service`, neuf, EPIC-111 → 119) : 958 le socle ; 959 exercices et
      tenue ; 961 le plan de journaux ; 962 le brouillard ; 964 la validation inaltérable et la piste chaînée ; 966 le
      grand livre ; 967 la balance dérivée, publiée au hub ; 968 les tiers ; 969 le lettrage ; 970 la clôture ;
    - **insérées** : 971 les droits de la comptabilité et des paramètres de `commande` (auth) ; 972 le jeu « Grossiste
      du Golfe » chez B, les comptes du jeu et la comptabilité au catalogue.
  - **Ce qui reste ouvert à la fin du lot 3** :
    - **Demandes à A** (« Demandes aux autres groupes ») : `comptabilite-service` dans `INGESTION_SOURCE_SYSTEMS` de
      balance-service (967) ; la comptabilité dans la recette (`AUTH_AUDIENCE`, compose ; 958, 967) ; relire
      `kit-cible` 1.0.1 (D4 → D8 restent ouverts, 956) ; question sans urgence de 970 (rouvrir N quand N+1 est OUVERT,
      Q8). La norme MinIO (17/11) est servie par A-920 (journal de A).
    - **À valider par un expert** : l'écart CIMA 844 / 849 (D-969-8) et, de même nature, le résultat CIMA à 88 et les
      comptes de passage 80 / 87 / 89 (D-970-6).
    - **Le consommateur de `facturation.facture.emise@1` dans `paiement`** (D-965-9 ; demande de D, « sans urgence ») :
      D a depuis fixé et publié la charge (journal de D, `ventes` `1c1e944`, `montantTtcMineur`) ; le consommateur
      reste à écrire par B (même `OuvrirLaCreance`), au lot 4 ou en remplaçante. La route reste le chemin de D-1059.
    - **Les remplaçantes** (plan §3) : l'export du journal général et du fichier des écritures (EPIC-120) ;
      désinstaller et réinstaller (FR-39) ; les tickets `dates-cibles-de-module` et `repartition-par-version`
      (catalogue). Nées de 972 : la pose des comptes du jeu par le catalogue à l'ouverture d'un essai (D-972-9) ; la
      vérification `referentiel-resolu` et les routes C13 de la comptabilité (D-972-2) ; `referentiels` dans l'état
      publié (question de C, D-972-10).
    - **Questions au PO** (plus bas) : le plan de journaux du SMT (D-961-1), les droits d'`automatisations`
      (D-960-10), le rôle par défaut du distributeur (D-960-12), l'invitation au réel (D-951-8).
  - **Restent ouverts avant le réel** (demandes « → A » plus bas) : `comptabilite-service` dans
    `INGESTION_SOURCE_SYSTEMS` de balance-service (sinon toute publication est rejetée `SOURCE_SYSTEM_INCONNU`) ; la
    comptabilité dans la recette (`AUTH_AUDIENCE`, compose). **Le module `comptabilite` est au catalogue depuis 972**
    (installé par le PUT de la console : sa vérification `referentiel-resolu` n'est pas encore servie, elle est
    différée ; `POST /installations` attend cette route, D-972-2).
  - **Remplaçantes nées de 972** (à placer par la session de groupe) : la pose des comptes du jeu par le catalogue à
    l'ouverture d'un essai (`comptes` facultatif dans `jeu-demonstration@1`, fichier des comptes chez D, D-972-9) ; la
    vérification `referentiel-resolu` et les routes C13 de la comptabilité ; `referentiels` dans l'état publié
    (question de C, D-972-10).

### Lot 2 (ouvert le 2026-11-16)

- **Machine** : le lot 2 de B tourne sur **un autre poste Windows** que le poste principal (plan du lot 2, §9.3).
  D y tourne aussi (worktree `_wt-d-stories`) : piles Docker préfixées `grp-b`, jamais de `down` sans `-p`. Copie de
  travail de B pour `prospera-stories` : le worktree `_wt-b-stories`.
- **Fusion** : `gh pr merge --rebase` d'abord refusé par le mode automatique de la session, puis autorisé
  explicitement par l'utilisateur (« le rebase doit marcher »). B fusionne lui-même, comme au lot 1.
- **Ordre du lot 2** (941 → 955) :
  1. ~~STORY-941~~ : **plateforme #6** (`9f43fa9`) : verrou npm, scripts racines sur les dossiers de C et de D, README ;
  2. ~~STORY-942~~ : **auth #39** (`08fc1a0`) : auth-service sur le socle (Confluent, Node 24, BullMQ 6, six schémas
     `identity.*` au registre) ; le rôle métier effectif (`roleMetier`) dans `GET /users` et le détail console ;
  3. ~~STORY-943~~ : **plateforme #7** (`5883740`, étiquette `point-de-decision-v1`) : la logique du point de
     décision, tous les refus dans l'ordre d'AD-23, mode sur site, conformité et mutation ;
  4. ~~STORY-944~~ : **catalogue #52** (`c3c63c8`) : l'installation, un plan enregistré. Point de décision copié
     (`point-de-decision-v1`), offre (souscrits), plan idempotent aux étapes horodatées, reprise après coupure prouvée
     par `docker kill` ; l'axe 2 se lit dans le plan (fin de D-936-1 pour les modules installés par un plan) ;
  6. ~~STORY-946~~ : **plateforme #8** (`300779e`) : le kit des cibles (1), les contrats de la Reprise
     (`contrats/reprise/`) et `@prospera/kit-cible` 0.1.0 (point d'import `SIMULER`/`APPLIQUER`, valeurs de contrôle) ;
     suite : STORY-947 (conformité publiée, cible témoin, `kit-cible` 1.0.0 **avant le 04/12**, relu par A).
  7. ~~STORY-947~~ : **plateforme #11** (`789a11a`, étiquette **`kit-cible-v1.0.0`**) : le kit des cibles (2), la suite
     de conformité publiée, la cible témoin, l'adaptateur MongoDB, la distribution CommonJS ; **jalon du 04/12 tenu**,
     relecture de A demandée.
  8. ~~STORY-948~~ : **catalogue #53** (`102f7e2`), **auth #40** (`017b938`), contrats annoncés avant la fusion
     (stories #543) : la naissance d'une organisation
     (`POST /api/instance/v1/naissances`), le registre des organisations et le 404 `ORGANISATION_INCONNUE` (fin de
     D-936-2), le jeton de service limité à une organisation, lu par l'état publié (fin de D-936-3), `reprise:lot:valider`
     réservé au DG ;
  5. ~~STORY-945~~ : **catalogue #55** (`99ba2db`, `9798ff5`), fusionnée **avant A-917 sur décision de
     l'utilisateur** : aucun `ACTIVE` hors du moteur ; l'échéance soldée note « acquis, à installer » ; vertical et
     propagation des packages retirés ; le `PUT` de la console passe par un plan ; l'axe 2 ne se déduit plus du droit
     (`migrate:reamorcage-moteur`). **Recettes croisées rouges sur `dev`** : demande à A ci-dessous ;
  9. ~~STORY-949~~ : **auth #41** (`a30e78f`), **catalogue #54** (`abc5716`), contrats annoncés avant la fusion
     (stories #552) : droits hors du jeton, étapes 1 et 2. Côté auth : `GET /moi/droits`, `dv` dans le jeton,
     `identity.droits.changed@1`. Côté catalogue : `droitsEffectifs` en double lecture, avec un cache invalidé par
     l'événement. **A-919 peut démarrer** (voir « → A »).
  10. ~~STORY-950~~ : **notification #87** (`e895c79`), **catalogue #50** (`9713dff`), **paiement #120** (`aa985c8`) :
      notification sur le socle (Node 24, Confluent) et la garde en double lecture ; `metadataMaxAge` 10 s dans les
      trois services ; le producteur ne retient plus l'amorçage sans Kafka.
  11. ~~STORY-951~~ : **catalogue #56** (`8f3e321`) : essai ou réel. Dans l'essai, la liste blanche des sorties et
      le journal des interceptions (`ECRITURE_REELLE_DEPUIS_ESSAI`) ; dans le réel, la mise en service d'un
      sous-ensemble (la Reprise d'abord, la vérification `donnees-importees` relue, `MISE_EN_SERVICE_SANS_FEU_VERT`,
      `reception-definitive.enregistree`) ; projection de `reprise.feu-vert.changed`. Prouvé sur la pile grp-b-951
      (module cible `temoin`, doublure de la Reprise), 28/28.
  12. ~~STORY-952~~ : **catalogue #57** (`45c3b33`), **notification #88** (`9d6f3ae`), contrats annoncés avant la
      fusion (stories #548) : l'essai d'un prospect (J+30, une prolongation, 60 jours au plus, `ESSAI_TERMINE`, signer
      rouvre sans perte), avis J-7 par la route directe de notification, horloge de recette du catalogue. Pour 953 :
      l'effacement s'accroche à l'échéance `EFFACEMENT` et au statut de l'essai (fiche, « Pour STORY-953 »).
  13. ~~STORY-953~~ : **plateforme #17** (`5a50249`, étiquette **`contrats-instance-v1`** : jalon du 14/12 tenu),
      **catalogue #58** (`4dfde25`), contrats annoncés avant la fusion (stories #562) : le contrat du jeu de
      démonstration et les formes génériques des routes C13 d'import et d'effacement ; le jeu importé à l'ouverture de
      l'essai ; l'effacement à `effacementLe` (plan idempotent, accusé de chaque propriétaire, certificat signé avec la
      date de la dernière sauvegarde) ; cinq essais simultanés prouvés sur la pile (433 ms, sans mélange).
  14. ~~STORY-954~~ : **plateforme #9** (`b4c5c46` ; étiquettes `seuils-fraicheur-v1`, `contrats-echange-v1`,
      `point-ecriture-unique-v1`), **catalogue #51** (`60473e1`) : les contrats de Connecteurs publiés avant février
      (seuils de fraîcheur, enveloppe et réponse d'échange, `connecteurs.domaine.changed`, `domainesEchange` et ses
      cas) ; `@prospera/point-ecriture-unique` (marqueur, garde de balayage) ; le catalogue rejoue les règles.
  15. ~~STORY-955~~ : **centrale-service #1** (`5671fab`), **agent-instance #1** (`db1dd58`) : agent et centrale,
      premier incrément. La centrale émet l'état voulu signé (licence, heure de référence, liste de révocation, signées
      à part ; compteur par clé ; contacts idempotents). L'agent le vérifie hors ligne, l'applique tout ou rien et
      ouvre la licence au point de décision sur site ; horloge scellée (AD-5), journal chaîné. Test croisé : les 16
      vecteurs rejoués des deux côtés, et le jeu de la vraie centrale appliqué par l'agent. `main` et `dev` posées dans
      les deux dépôts neufs.

### Lot 1 (fini le 2026-11-15)

- **2026-11-14** : journal ouvert, lot pas encore commencé.
- **2026-11-15** : le lot de B est tenu par **la session qui a tenu le lot de A**, sur le poste principal (Windows), sur
  consigne de l'utilisateur : A, puis B, puis la story du seed du catalogue (`fiscal-tg-*` octroyables pour
  `declarations`). Les stories s'enchaînent sans arrêt. **Ce journal est la mémoire du lot.**
- **Lot de B, ordre** :
  1. ~~STORY-930~~ : **catalogue #43**, **recette #17** (client de Confluent, Node 24, Karapace, schéma de
     `entitlement.changed` enregistré) ;
  2. ~~STORY-931~~ : **plateforme #1** (contrats, vecteurs signés, `@prospera/signature`, point de décision amorcé ;
     dépôt créé par l'utilisateur) ;
  3. ~~STORY-932~~ : **catalogue #44** (contrat d'état publié, **figé**, étiquette `contrat-etat-publie-v1`) ;
  4. ~~STORY-933~~ : **catalogue #45**, **recette #18** (Redis, BullMQ, bail MongoDB du relais d'outbox) ;
  5. ~~STORY-934~~ : **catalogue #46** (manifeste dans `ModuleVersion`, refus nommés, résolution, garde) ;
  6. ~~STORY-935~~ : **catalogue #47** (46 manifestes au catalogue, `catalogue.manifeste.publie`, droits renommés) ;
  7. ~~STORY-936~~ : **catalogue #48** (matrice exécutée, vraie route, émetteur de `etat-publie.changed`) ;
  8. ~~STORY-937~~ : **plateforme #2** (garde partagée, `garde-etat-publie-v1`), **paiement #117** (Node 24, Confluent,
     double lecture) ;
  9. ~~STORY-938~~ : **auth #38**, **recette #19**, ADR « droits hors du jeton » ;
  10. ~~STORY-939~~ : **paiement #118** (read-model des manifestes, la vente résout comme la console), ticket des
      écrans pour D. **Le lot de B (930 → 939) est fini.**

- **Hors lot, consigne de l'utilisateur** : ~~STORY-940~~ (le seed du catalogue : `declarations` s'ouvre aux paquets
  `fiscal-tg-*`) : **catalogue #49**, **paiement #119**, **recette #20**. Puis la relecture finale de A rejouée (les recettes
  `atelier-balance` et `zone-franche`, jouées au gate de 940 : **56/56**).
- **Docker** : aucune pile de B ne tourne. ⚡ Règle de l'utilisateur (2026-11-15) : une pile se lève pour le gate de sa
  story et **se descend avec ses volumes à la fin de cette story**, même si la suivante en aura besoin ; elle se relève
  alors au gate suivant.

## Dépôts tenus

`prospera-platform-catalog-service`, `prospera-paiement-service`, `prospera-plateforme` (à créer, STORY-931),
`prospera-notification-service` et `prospera-auth-service` (reçus de A, voir Passations).

**Lot 3** : **`prospera-comptabilite-service`** (neuf, créé par l'utilisateur ; `main` et `dev` amorcées par STORY-958,
checkout du poste en `core.autocrlf=false`, pile propre au dépôt : `docker compose -p grp-b --profile comptabilite`).
**`prospera-notification-service` n'est plus à B** depuis la fusion de STORY-957 (17/11), il est à D
(D-L3-3). B n'y écrit plus ; une demande passe par le journal de D. Pendant ce lot, la même
session tient aussi `prospera-recette` (dépôt de A, lot de A terminé).

**Lot 2** : en plus, les dépôts neufs **`centrale-service`** et **`agent-instance`** (créés par l'utilisateur, `main` et
`dev` posées par STORY-955).

**Lot 6** (plan §2, amendé le 24/11, D-L6-5) : le BFF, `prospera-recette`, le catalogue, auth, `kyc-service`, la
plateforme (hors dossiers de C et D), et `prospera-dossier-service` par défaut (aucun plan ne l'attribue ailleurs).
**`prospera-bilan-service` n'est plus à B** depuis le 24/11 au soir : il est à D (passation ci-dessous) ; balance et
comptabilité sont à C (D-L6-1). `prospera-dossier-service` et `prospera-paiement-service`, prêtés à D pour
STORY-1073 le 24/11, **sont rendus à B le 25/11** (passation ci-dessous).

## Passations

- **Rendu le 2026-11-26 par D, fin de STORY-1141 : `prospera-paiement-service`** (journal de D, « ← B : passation de
  `prospera-paiement-service` (1141) — rendu à B », prospera-stories #973, `main` `9a37c3e`). Constaté le 26/11 (ordre
  « g ») : `origin/dev` = **`64b5838`** (MNV-1141, #126 : `f6a4800`, `64b5838`), le SHA nommé par D ; **aucune PR de D
  ouverte** (`gh pr list --state open` : vide) ; checkout du poste sur `dev`, à jour, propre. B le tient de nouveau ; le
  prêt ci-dessous est clos.
  - **Ce qui a changé** (D, information) : `numeroImprimable` facultatif à la déclaration d'un compte d'encaissement ;
    deux routes `PUT …/comptes-encaissement/{compteId}/numero-imprimable` (celle de l'organisation et celle de la
    surface déléguée) ; un acte neuf `COMPTE_ENCAISSEMENT_NUMERO_IMPRIMABLE_DECLARE` (avec sa phrase de signalement) ;
    `paiement.compte.changed@1` gagne `numeroImprimable` (facultatif, Karapace BACKWARD) ; manifeste 1.2.0 (recopié au
    catalogue : « g », #83).
  - **Deux suites e2e déjà rouges sur `e2be149`, à reprendre par STORY-1136** (n° 18, le consommateur de
    `facturation.avoir.emis@1`, la prochaine story de B dans ce dépôt) : `health` — `admin.listTopics` manque au double
    de Kafka (**MNV-957**) ; `notifications-webhook` — `EtatsDeCreance` manque au module de test (**MNV-965** ; la suite
    compile de nouveau depuis `publier` à deux arguments). À joindre au prompt de STORY-1136.

- **Prêté le 2026-11-26 à D, pour STORY-1141 seule : `prospera-paiement-service`** — **rendu le 26/11, clos** (entrée
  ci-dessus) — (demande de D, journal de D,
  « → B : passation de `prospera-paiement-service` limitée à STORY-1141 » ; lot 7 de D, plan §4 bis, #934 ; Q-D-15,
  le numéro de compte imprimable). Le prêt **commence quand D ouvre STORY-1141** (sa quatrième story, après 1138 →
  1140) et finit par une ligne de D dans son journal (« rendu »). Pendant ce temps, B n'écrit pas dans ce dépôt : la
  seule story de B qui y touche au lot 7 est STORY-1136 (n° 18, le consommateur de `facturation.avoir.emis@1`), en fin
  de lot ; si elle arrivait avant le retour, elle attendrait.
  - **Dernier commit sur `dev`** (constaté le 26/11 à 00:50) : **`e2be149`** (MNV-1073, #125, de D) — rien n'a bougé
    depuis le retour du 25/11. **Aucune PR ouverte**, **rien en cours** chez B. Checkout du poste sur `dev`, à jour,
    propre.
  - **Périmètre de 1141** (D) : le DAF déclare, avec le compte, un numéro non secret et tracé « à imprimer » ; paiement
    le publie avec le compte (`paiement.compte.changed@1` : **ajout facultatif seulement**, Karapace BACKWARD, §1.8) ;
    aucun déchiffrement du coffre (NFR-1, AD-14). Une nouvelle version de manifeste ou de schéma ⇒ recopie au
    catalogue : à demander à B dans le journal de D.
  - **Pièges** : ceux de la passation du 24/11 ci-dessous (« Pièges de paiement ») valent tels quels — client de
    Confluent testé sous Node 24 seulement (étage `verification`), `npm ci --ignore-scripts` sous Node 25,
    `.dockerignore` garde `test/`, `/health` 503 sans `PI_SPI_*` (`scripts/recette/976/`), invariants (codes d'acte
    réservés, inventaire fermé `ECRITURES_DARGENT`, aucune minuterie, garde sans configuration, aucun identifiant avec
    « change », seul le service des demandes écrit `$set: { etat }`), routes `@SurfacePlateforme()` en 404 avant la
    garde. Plus, depuis 1073 : **`EcritureDArgent.executer` passe l'entrée consignée à `publier(resultat, entree)`**,
    et la révision publiée est le rang de l'acte au journal chaîné du compte (D-1073-10 : un compte déclaré avant
    le 25/11 n'est republié qu'à sa prochaine vérification).
  - **Annoncé par D, à venir** : depuis STORY-1140 (export CSV du bilan, Q-D-19), une demande à B pour le contrat dans
    `prospera-plateforme/contrats/instance/` (D l'écrira dans son journal à ce moment ; part « moteur » de B).

- **Rendus le 2026-11-25 par D, fin de STORY-1073 : `prospera-dossier-service` et `prospera-paiement-service`**
  (journal de D, « → B (2026-11-25, fin de STORY-1073) », prospera-stories #850). Constaté par la session de groupe le
  25/11 : `origin/dev` de dossier = **`4352ac3`** (MNV-1073, #58), de paiement = **`e2be149`** (MNV-1073, #125), les SHA
  nommés par D ; checkouts dans l'état laissé par B (`dossier-service` sur `MNV-1082`, `prospera-paiement-service` sur
  `dev` à jour), propres. B les tient de nouveau.
  - **Ce qui a changé** (D, information) : `DossierEtatV1` porte neuf champs facultatifs de la fiche légale, publiés
    pour le seul dossier propre (rejeu : `npm run republier:dossiers` ; régime fiscal hors du message, D-1073-3) ;
    paiement publie `paiement.compte.changed@1` (schéma fermé, BACKWARD, aucun secret du coffre) dans la transaction de
    la déclaration et de chaque vérification ; **`EcritureDArgent.executer` passe l'entrée consignée à
    `publier(resultat, entree)`** (un double de test à un seul argument ne compile plus) ; les comptes déclarés avant
    le 25/11 ne sont republiés qu'à leur prochaine vérification (D-1073-10) ; Q-D-15 au PO (RIB complet imprimé ?).

- **Prêtés le 2026-11-24 (soir) à D, pour STORY-1073 seule : `prospera-dossier-service` et
  `prospera-paiement-service`** (consigne de l'utilisateur, relayée par D : « Gère tout cela dans la story 1073 sans
  attendre la livraison de B »). D fait dans 1073 les deux demandes de #812 (voir « Demandes », ← D du 24/11). B n'écrit
  plus dans ces deux dépôts **jusqu'à ce que D écrive dans son journal qu'il les rend** (fin de 1073). Les deux
  stories que B y avait placées après le lot 6 sont retirées ; seul le consommateur de `facturation.avoir.emis@1`
  reste à B, après le retour de `paiement`.
  - **Dernier commit de B sur `dev`** : dossier **`2bf9dbd`** (MNV-1082, le dossier de démonstration créé par le
    moteur) ; paiement **`4684d22`** (MNV-976, le consommateur de `facturation.facture.emise@1`). **Aucune PR ouverte**
    (`gh pr list --state open`, 24/11, deux dépôts).
  - **Checkouts du poste** : `dossier-service` sur `MNV-1082`, propre (fusionnée en rebase : pointe `640991c`, rejoué
    en `2bf9dbd`) — B le laisse tel quel, D part d'`origin/dev` ; `prospera-paiement-service` sur `dev`, à jour, propre.
  - **Pièges de dossier-service** (détail dans « Pièges ») : checkout en CRLF (`core.autocrlf=true` ; compter les fins
    de ligne par Python) ; sous Node 25, **7 suites rouges connues** sur `origin/dev` (6 binding de Confluent,
    `registre-pays.coherence`), **9** si le paquet fiscal embarqué sort en CRLF (`git -c core.autocrlf=false checkout
    -- src/modules/portefeuille/echeance/assets/`) ; l'invariant de STORY-363 lit le **texte** des contrôleurs (ne
    pas citer `@RequiresDossierAccess()` en commentaire) ; le double Mongo de `dossiers.e2e-spec.ts` porte l'index du
    NIF (création et `findOneAndUpdate`) ; le portefeuille range ses lignes dans `lignes` ; un seul exercice OUVERT
    par dossier ; `KYC_NOT_APPROVED` sans KYC approuvé de l'organisation ; identité de service du moteur
    (`IDENTITE_DE_SERVICE_REFUSEE` sur les routes métier, D-1082) ; dette **D-1082-10** (le dossier de démonstration
    n'est pas effacé en fin d'essai). `DossierEtatV1` : ajouts facultatifs seulement (Karapace BACKWARD, §1.8).
  - **Pièges de paiement** : client de Confluent testé sous **Node 24** seulement (étage `verification`) ;
    `npm ci --ignore-scripts` sous Node 25 ; `.dockerignore` garde `test/` ; `/health` rend 503 sans
    `PI_SPI_API_BASE_URL` et `PI_SPI_TOKEN_URL` (`scripts/recette/976/` pose le simulateur) ; invariants qui mordent
    à juste titre : codes d'acte réservés (`ENCAISSEMENT_*`), compte de dépendances d'`AffecterLEncaissement`,
    inventaire fermé `ECRITURES_DARGENT` (`piste-opposable.invariant.spec.ts`), aucune minuterie (AD-12), la garde ne
    lit aucune configuration, aucun identifiant ne contient « change », seul le service des demandes écrit
    `$set: { etat }` ; `@SurfacePlateforme()` rend 404 avant la garde ; clef de Créance insensible à la casse ; un
    rejeu par `EcritureDArgent` consigne une trace (sentinelle `RejeuSansEffet`) ; une mutation interrompue laisse le
    fichier muté. Patron d'un consommateur : celui de 976 (`SupervisionConsommateur`, groupe propre, depuis le début,
    même cas d'usage que la route, idempotent).
  - **Ce que B ne fait pas pendant le prêt** : le ticket « premier membre » (suite de 1112) et STORY-1116 ne touchent
    ni l'un ni l'autre ; un défaut trouvé chez eux devient un ticket pour D.

- **Donnée le 2026-11-24 (soir, D-L6-5, stories #815) : `prospera-bilan-service` à D** (STORY-1074 → 1078 de D). B n'y
  écrit plus ; une demande passe par le journal de D. **← D (24/11) : passation de bilan-service écrite.**
  - **Dernier commit de B sur `dev` : `7b53ff5`** (MNV-065, la liasse rouverte relue avec sa dernière version figée,
    correctif de STORY-065) ; avant : `d98b7c4` (MNV-483, remboursements plafonnés à l'encours, modèle de projection
    **1.14.0**), `2364abc` (MNV-1084, un nom de schéma OpenAPI = une classe), `0f17ec4` (MNV-1080, les trois
    vérifications d'installation de bilan). **Aucune PR ouverte** (`gh pr list --state open`, 24/11).
  - **Ce que D trouve** : le **garde des noms de schéma** `src/openapi-schemas-uniques.invariant.spec.ts` (D-1084-17 :
    une classe par nom de schéma, sur le document de tout `AppModule` ; nommer un DTO par son module) ; le modèle de
    projection 1.14.0 (`avertissements`, `REMBOURSEMENT_PLAFONNE`, D-483-8 → 10) ; la `version` de la liasse rouverte
    (D-065-1 → 3) ; les trois vérifications `verification-installation@1` (copie à l'octet du catalogue) que la recette
    `cabinet-moteur` et `essai-mise-en-service` jouent.
  - **Pièges propres à bilan** (détail dans « Pièges ») : le checkout du poste garde **deux brouillons non suivis du
    15/11, `cr-map.txt` et `cr-postes.txt`** — à laisser, jamais à committer ; sous Node 25, **15 suites unitaires
    rouges connues** (13 binding de Confluent, `dossier-scope.invariant` qui cherche `\n` dans un décorateur sorti en
    CRLF, `analyse.agnosticisme` qui compare des chemins `dto\…`) ; `export.service` et `homogeneisation.regles`
    rougissent sous la charge (les relancer seules) ; **CRLF et empreintes du paquet** : un worktree sort ses 75 JSON de
    référentiels en CRLF (`ReferentielIntegrityError`, 64 tests rouges) — `git -c core.autocrlf=false checkout --` ; les
    DTO du checkout sont en CRLF, les fichiers neufs en LF (un script de remplacement suit la fin de ligne du fichier) ;
    le fixture non typé de `test/bilan-export.e2e-spec.ts` (tout champ neuf lu par l'export s'y ajoute) ; l'invariant du
    plan d'effacement C13 (toute collection neuve à champ d'organisation va dans `plan-d-effacement.ts`) ; mutations
    longues (≈ 1,5 min chacune, en tâche de fond).
  - **Ce qui reste ouvert sur bilan** : rien de demandé à B ; les écrans de l'Atelier et des états sont chez A (D-L6-5) ;
    les stories 1074 → 1078 sont celles de D.

- **Reçues le 2026-11-18 (D-L4-1) : `prospera-admin-panel-service` (BFF de la console) et `prospera-dossier-service`**,
  de A, pour le lot 4. **Constatées par STORY-1081** :
  - BFF : `origin/dev` = **`18a9893`** (STORY-923), le commit nommé par A ; **rien n'a bougé depuis**. Le checkout du
    poste (`admin-panel`) était sur `dev` à `b10fedd`, 4 commits derrière (STORY-911 : Node 24, `package.json` et
    `Dockerfile` changés ; 917 ; 923) : branche partie d'`origin/dev`, `npm ci --ignore-scripts` (Node 25).
  - dossier : `origin/dev` = **`768a4aa`** (STORY-924), le commit nommé par A ; **rien n'a bougé depuis**. Le checkout
    (`dossier-service`) était sur `dev`, 8 commits derrière (`package.json` changé : client Kafka de Confluent) :
    avance rapide de `dev` (propre), branche partie d'`origin/dev`, `npm ci --ignore-scripts`.
  - balance : **constatée par STORY-1082** : `origin/dev` = **`98078b0`** (STORY-928), le commit nommé par A ; **rien
    n'a bougé depuis**. Le checkout (`balance-service`) était sur `dev`, 19 commits derrière, `node_modules` du 15/11 :
    branche partie d'`origin/dev`, `npm ci --ignore-scripts`.
  - recette : **constatée par STORY-1093** : `origin/dev` = **`f7944dc`** (STORY-929), le commit nommé par A ; **rien
    n'a bougé depuis**. Le checkout (`prospera-recette`) était sur `dev` à `2daea0e`, 8 commits derrière, propre :
    avance rapide, branche `MNV-1093` partie d'`origin/dev`. **Les cinq dépôts venus de A sont constatés.**

- **Reçue le 2026-11-18 (D-L4-1) : `prospera-bilan-service`**, de A, pour le lot 4. **Constatée par STORY-1083** :
  `origin/dev` = **`1651d33`** (STORY-928), le commit nommé par A ; **rien n'a bougé depuis**. Le checkout du poste
  (`bilan-service`) était sur `dev` à `3f8e235`, 13 commits derrière, avec des `node_modules` du 15/11 (`ajv` 6,
  `kafkajs`) : branche partie d'`origin/dev`, `npm ci --ignore-scripts` (Node 25 ; le client de Confluent n'a pas son
  binding, voir « Pièges »). Deux brouillons non suivis du 15/11 (`cr-map.txt`, `cr-postes.txt`) restent hors de tout
  commit. Balance (`98078b0`), dossier (`768a4aa`), BFF (`18a9893`) et recette (`f7944dc`) : à constater par la
  première story de B qui les touche (1081 pour le BFF et dossier).

- **→ D (2026-11-17) : `prospera-notification-service` est à D** (lot 3, D-L3-3), à la fusion de STORY-957.
  **Dernier commit de B sur `dev` : `5e6c553`** (notification #89, rejoué en rebase ; arbre identique à celui éprouvé).
  **D-1051 est débloquée.** Dès ce commit, B ne touche plus ce dépôt.
  - **État** : Node 24 (`docker build --target verification`, puis `npm test` dans un conteneur nommé) :
    276 suites, 3 846 passés, 1 sauté. Client Kafka de Confluent 1.11, sept consommateurs de read-models sous
    `SupervisionConsommateur` : relance sur un consommateur neuf, recul de 1 s à 30 s, blocage compté par
    partition. `/health` agrège MongoDB, la base de preuves (même jeu de répliques), Kafka (borné à 5 s, un seul
    client admin, état des consommateurs), Redis, le référentiel et les canaux. Sur la pile de 957, `/health`
    répond 200 avec `CANAUX_DEGRADES` : sms, whatsapp et push ne sont pas configurés, email et in-app le sont (le
    statut reste `up`). La garde est en double lecture sur l'état publié (STORY-950). Deux modèles système
    viennent de l'essai prospect (STORY-952).
  - **Pièges** :
    - les tests du client de Confluent se jouent sous Node 24 seulement. Sur le poste en Node 25,
      `npm ci --ignore-scripts` suffit pour `tsc`, le lint et les specs qui n'importent que des types ;
    - **une minuterie neuve fait rougir `src/adapters/bullmq/aucune-minuterie.spec.ts`** (AC-5) : l'inventorier avec
      son motif, ou passer par une file BullMQ ;
    - `liste-fermee-ad2.spec.ts` est à l'inventaire AD-12 (STORY-950) ;
    - la sonde du compose vise `/api/v1/health` ; `/api/v1/health/live` n'interroge rien ;
    - un message illisible est ignoré et l'offset avance ; une erreur de projection est propagée et le message
      rejoué ;
    - l'avis J-7 de l'essai demande `platform-catalog-service:<jeton>` dans `JETONS_DE_SERVICE`.
  - **Ce qui reste ouvert** :
    - l'appel à `POST /sorties-essai/{organisationId}/verifier` du catalogue avant chaque envoi dans l'espace
      d'essai (STORY-951, « ⚠ Contrats ») n'est pas branché ;
    - la bascule de la garde de la double lecture vers l'état publié seul (comme A l'a faite en 918) n'est pas faite ;
    - les canaux sms, whatsapp et push n'ont pas d'adaptateur configuré sur la pile ;
    - le résidu de 957 : juste après un redémarrage sans Kafka, la rafale de relances a porté un contrôle de
      `/health` à 7,5 s.
- **Reçue le 2026-11-14 : `prospera-notification-service`**, de A, dernier commit sur `dev` : `8916ee4`.
- **Reçue le 2026-11-15 : `prospera-auth-service`**, de A, dernier commit sur `dev` : `456035f` (STORY-902). À
  reprendre : STORY-938 (droits à tiret dans les trois segments) ; la console affiche « sans rôle métier » pour un
  membre qui reçoit le rôle par défaut (l'API d'administration rend le `tenantRole` stocké, pas le rôle effectif).

## Demandes aux autres groupes

- **→ A (2026-11-27, STORY-1137) : l'installation des modules d'un essai est débloquée par STORY-1137** — `POST
  /admin/essais` du BFF accepte `installation: { modules, referentiels }` (« Installer balance et bilan »,
  `syscohada-revise@2.3`) et rend `installation` (`statut` TERMINE | EN_ATTENTE | EN_COURS | REFUSEE, `planId`, `code`) ;
  route servie et relayée, prouvée par un appel réel au BFF (`modules-dans-l-essai`, pile neuve). L'écran (AP-57) est à A ;
  types à régénérer. — information.

- **→ C (2026-11-27, STORY-1137) : la garde de `balance-service` sans KYC dans l'essai** (ticket « modules ouverts dans
  l'essai », point 3 ; D-L7B-4) — **déjà servie par STORY-1019** (`ab4e468`) : rien à faire. STORY-1137 lève
  `balance-essai` (`INSTANCE_ESPACE=ESSAI`) dans la pile de la recette, installé par le moteur de l'essai à l'ouverture,
  et un prospect sans KYC y lit les balances du jeu du cabinet. Un défaut révélé deviendrait un ticket et une demande ici.
  — information (message envoyé).
- **→ D (2026-11-27, STORY-1137) : la garde de `bilan-service` sans KYC dans l'essai** (même ticket, point 3) — **déjà
  servie par STORY-1079** (`7ed3335`, Q-D-17 confirmée) : rien à faire. `bilan-essai` est levé de même et ouvert par le
  prospect. — information (message envoyé).

- **→ A (2026-11-26, STORY-1129) : le cabinet est sur le moteur ; ce qui reste à A** — (1) le panneau des droits d'AP-05
  (`features/entitlements`, qui appelle `PUT /catalog/entitlements/…` directement) reçoit désormais **409
  `INSTALLATION_PAR_LE_MOTEUR`** (`modules`) pour un module que le moteur sait vérifier (dans une pile comme celle de la
  recette : `balance`, `bilan`, `comptabilite`, `conseil`) : ajouter le code à `GRANT_REFUSAL_CODES` avec une phrase
  (« Ce module s'installe par l'offre : “Installer l'offre” ») ; sans cela la phrase générique, rien ne casse ; sa sanction,
  sa levée et sa révocation sont inchangées ; (2) le `PUT` du BFF (`/admin/orgs/{id}/entitlements/{m}`) relaie les codes du
  moteur dans `details` : types à régénérer si la console l'appelle un jour ; (3) **rappel AP-55** : `Idempotency-Key` dans
  `installation-client.ts` (et `mise-en-service-client.ts`), puis le gate réel rejoué : le CORS du BFF l'accepte depuis #44.
  — **information** (aucune route ne manque ; le jalon du 18/12 côté backend est livré).
- **→ C (2026-11-26, STORY-1129) : `conseil` est sur le moteur dans la recette** — `atelier-balance` l'installe par le plan
  (ses deux vérifications `VERT`) ; tout `PUT` de `balance`, `bilan`, `comptabilite`, `conseil` dans la pile rend 409
  `INSTALLATION_PAR_LE_MOTEUR`. Dans l'espace d'essai, `conseil` n'a pas d'adresse (D-1129-11) : balance-service ne sert pas
  `POST /api/v1/instance/conseil/{org}/import` ni `…/effacement` ; le jour où il les sert, dites-le à B, qui l'ajoutera à
  `.env.essai.example`. `zone-franche` compte désormais votre contrôle `CONTINUITE_CREDIT_TVA` sans rougir (D-1129-15). —
  information (message envoyé).
- **→ D (2026-11-26, STORY-1129)** : même règle pour vos modules qui ont une adresse dans un espace (`commande`, `terrain`,
  `assureur-fictif` dans `.env.essai.example`) : par l'offre et `POST /installations`, plus par le `PUT`. Vos services ne
  changent pas. — information (message envoyé).

- **→ A (2026-11-26, STORY-1128) : relire `contrat-etat-publie-v1.1`, et brancher la doublure de la coque sur la copie
  publiée** — **information, non bloquante.** Le seul écart à la v1 que A a relue est `module.referentiels` (facultatif,
  STORY-1127). Le contrat est figé (un octet = une version, règle dans le README du catalogue). La coque (AD-23) et l'app du
  cabinet (EPIC-159, types générés) peuvent épingler `prospera-plateforme/contrats/etat-publie/` à l'étiquette
  `contrat-etat-publie-v1.1`. Inventaire : `stories/STORY-1128.md`, « Inventaire ».
- **→ C et D (2026-11-26, STORY-1128) : ce qui reste avant de retirer `entitlement.changed`** — **information.** Relevé du
  26/11 (`stories/STORY-1128.md`, « Ce qui reste avant de retirer `entitlement.changed` ») : chez **C**, `balance-service` et le
  fiscal (avec D) lisent encore `config` et `referentiels` dans `entitlement.changed` ; chez **D**, `bilan`, `assurance`
  (`config`, `referentiels` : la liste est servie depuis STORY-1127), `notification`, et les six services du socle
  `etat-des-modules` (ventes, terrain, recouvrement, pilotage, croissance, assureur-fictif), qui ne lisent **pas encore**
  l'état publié. `config` n'existe pas dans l'état publié : `module.interrupteurs` (au contrat, toujours vide) doit d'abord
  être tenu par B (STORY-1131 ou 1135). Aucun retrait n'est demandé avant ; chacun bascule à sa semaine, double lecture d'abord.
  **→ D** aussi : `assurance`, `liaison-assureur` et `sinistres` gardent une copie de `garde-etat-publie` **sans test de
  copie** (les autres services en ont un : empreinte de `ORIGINE.json`, et le voisin `prospera-plateforme`).

- **→ C (2026-11-26, STORY-1124) : publier `comptabilite.facture.desinscrite` v1 à l'abandon d'un brouillard né d'une
  facture inscrite** (`prospera-comptabilite-service`) — **acceptée par C le 26/11, placée dans sa STORY-338, schéma repris
  tel quel** (la GED est prête sur `dev` depuis document-service #38, `b18d3ad` ; à la fusion de C, B recopie son octet).
  Relu le 26/11 sur `dev` `e4a53cc` : `BrouillardService.abandonner` supprime le brouillard, consigne
  `ECRITURE_ABANDONNEE` et rend la facture inscriptible (`MemoireDesChoixService.surAbandon`) dans une transaction, sans
  aucun fait ; la GED garde donc la copie rangée par `comptabilite.facture.inscrite`, et une réinscription entre une
  seconde fois au fonds (D-1100-3). **Demandé** :
  - **quand** : dans la transaction de l'abandon, par l'outbox, **seulement** si le brouillard est né d'une facture (la
    pièce du lot qui portait `inscription.ecritureId` ; `surAbandon` la trouve déjà) ; topic **`comptabilite.facture.desinscrite`**,
    clé `organisationId`, en-têtes `eventId` et `schemaVersion` posés par le relais (comme l'inscription) ;
  - **forme** (schéma JSON 2020-12, `additionalProperties: false`, à mettre dans `contrat/schemas/comptabilite.facture.desinscrite.v1.json`,
    sujet neuf au registre en BACKWARD, manifeste `comptabilite` en `publie`) : `{ eventId (uuid), schemaVersion: 1,
    organisationId, dossierId, exerciceId, ecritureId, lotId (24 hex chacun), numeroProvisoire, pieceId (64 hex, le
    SHA-256 du fichier), motif: "BROUILLARD_ABANDONNE", desinscriteLe (date-time), desinscritePar (non vide) }`, tous
    requis — **ni montant, ni tiers, ni ligne** ; le texte proposé à l'octet est
    `prospera-ocr-service/contrat/consommes/comptabilite.facture.desinscrite.v1.json` (sur `dev`, sha256 `86a50e6f…2ecf`) :
    le prendre tel quel épargne une recopie ; s'il change, B recopie le vôtre (la GED écarte un message hors de sa copie,
    sans rien retirer) ;
  - **ce que fait la GED** (déjà livré par STORY-1124, groupe `ged.comptabilite`) : la copie jamais versée sort du fonds,
    la copie versée est gardée et marquée, une attente ne se range plus ; elle n'a besoin que de `organisationId`,
    `dossierId`, `ecritureId`, `desinscriteLe`, `eventId`.
  **Choix par défaut de B** : tant que le fait n'est pas publié, rien ne change pour le cabinet (la copie reste, comme
  aujourd'hui). Prévenu par message (session `moneyvibes-apps-86`).

- **→ C (2026-11-26, suite de STORY-953, D-L7B-9) : information — le contrat de l'export C13 est publié dans
  `prospera-plateforme/contrats/instance/`** (`export-c13-reponse.schema.json`, `export-c13-csv.cas.json`,
  `instance-c13.openapi.json` 1.1.0 ; plateforme #41, `d68a468`, étiquette `contrats-instance-v1.1` ; « ⚠ Contrats » du 26/11). Il
  décrit ce que `balance-service` sert depuis STORY-1021, sans écart : les huit cas du CSV passent contre
  `instance-c13/export-csv.ts` (`dev` `44be0c1`), à l'octet. Rien n'est demandé de neuf ; quand C recopie, le garde de
  copie (`contrat/copie.invariant.spec.ts`) attend l'origine `prospera-plateforme@contrats-instance-v1 ` (espace
  compris) : à ajuster pour `contrats-instance-v1.1`. Pas d'urgence.

- **→ D (2026-11-26, STORY-1123) : la cloche et l'e-mail des alertes de l'archiviste (`prospera-notification-service`)**
  — **ouverte**, sans urgence (rien ne bloque B). La GED du cabinet publie cinq faits (document-service #37, schémas au
  dépôt `prospera-ocr-service/contrat/schemas/<topic>.json`, sujets `<topic>-value` au registre en BACKWARD ; clé
  `organisationId` ; enveloppe `eventId`, `schemaVersion: 1`, `occurredAt`, `organisationId`, `emisLe` dans la charge ;
  forme au « ⚠ Contrats » du 26/11 et dans `stories/STORY-1123.md`). Demandé : les ajouter à la liste fermée des
  déclencheurs (`EVENEMENTS_DECLENCHEURS`), avec un gabarit de cloche et d'e-mail chacun, envoyés aux **`destinataires`**
  du fait (identifiants d'utilisateur ; la GED remet la liste, FR-N28).
  | Topic | Cloche (objet) | E-mail (corps, en clair) | Destinataires |
  |---|---|---|---|
  | `ged.original.retour-en-retard` | « Original non rentré : {joursDeRetard} j de retard » | la boîte `{cote}` du fonds `{fondsNumero}`, retour prévu le `{retourPrevuLe}` ; palier 1, 7, 30 ; lien vers les sorties en retard | `destinataires` (qui a sorti, le responsable du dossier) |
  | `ged.conservation.echeance-proche` | « {pieces} pièce(s) arrivent à échéance de conservation » | fonds `{fondsNumero}`, dont `{dontEchues}` déjà échues, première échéance `{premiereEcheance}`, horizon `{jusquau}` ; lien vers `GET …/ged/cabinet/pieces-echues` | `destinataires` (le responsable du dossier) |
  | `ged.quota.depasse` | « Quota d'archivage dépassé » | `{volumeOctets}` stockés pour `{quotaOctets}` ; le dépôt n'est pas bloqué | **vide** : choix par défaut demandé, l'administrateur du cabinet (`TENANT_ADMIN`) |
  | `ged.integrite.ecart` | « Contrôle d'intégrité : {enEcart} fonds en écart » (ou « journal rompu » si `journalOk: false`) | campagne `{campagneId}` (`{origine}`), lien vers la campagne | `destinataires` (qui l'a demandée) ; **vide** pour une campagne périodique : l'administrateur du cabinet |
  | `ged.destruction.changed` | selon `etat` : « Destruction {destruction} à viser » (`PROPOSEE`), « visée » / « refusée » / « accordée par le client » / « abandonnée » / « exécutée, procès-verbal {procesVerbal} » | fonds `{fondsNumero}`, `{pieces}` pièce(s) ; lien vers la destruction | `destinataires` (les personnes de la destruction sauf `par`) ; **vide** pour `PROPOSEE` : les associés qui visent (si `notification` ne sait pas les trouver, l'administrateur du cabinet) |
  Aucun fait ne porte de contenu de pièce, de nom de client, de motif ni d'emprunteur : le gabarit nomme le fonds et
  la boîte par leurs numéros. **Choix par défaut de B** : les alertes se lisent dans l'application (`GET …/sorties?enRetard=true`,
  `GET …/pieces-echues`, `GET …/quota`, les campagnes, les destructions) ; aucun message ne part tant que `notification` ne
  consomme pas ces topics.
- **→ A (2026-11-26) : AP-51 — la console voit l'archivage de chaque cabinet, débloquée par STORY-1125** (BFF #45,
  `81817fe` sur `dev` ; document-service #39, `5c50ca6`) : `GET /api/v1/admin/archivage?mois=AAAA-MM` et `GET
  /api/v1/admin/orgs/{orgId}/archivage?du=&au=` (`org:read`), `PUT /api/v1/admin/orgs/{orgId}/archivage/quota` (corps `{
  quotaOctets: entier ≥ 1 | null, offre? }`, `entitlement:grant`). Des compteurs seulement (fonds, ouverts, fermés,
  pièces et pages versées, volume, boîtes cotées ; total et mois) et le bloc `quota` (`source` `OFFRE` | `SERVICE`,
  `depasse`, `utilisationPourcent`) ; refus `400 MOIS_INVALIDE`, `400 PERIODE_INVALIDE`, `403`, `503`. Prouvé par un appel
  réel au BFF construit contre la GED d'une pile (fiche, « Livraison »). Types depuis l'OpenAPI vivant ; l'écran est au lot 8.
- **→ A (2026-11-26) : FE-143 — les pièces échues de tout le cabinet sont servies par STORY-1123** (document-service
  #37, `7e65881` sur `dev`) : `GET /api/v1/ged/cabinet/pieces-echues?horizonJours=&curseur=&limite=`
  (`ged:fonds:gerer`) → `PiecesEchuesDuCabinetDestructionDto` (lignes de la liste d'un fonds plus `echue`, `fondsNumero`,
  `dossierId`, `raisonSociale` ; par échéance ; `400 CURSEUR_INVALIDE`). Rien n'est relayé par le BFF. — information,
  rien à faire avant le lot 8.
- **→ A (2026-11-26) : FE-143 — retrouver dans tous les fonds du cabinet est servi par STORY-1122** (document-service
  #36, `27f1e8d` sur `dev`) : `GET /api/v1/ged/cabinet/recherche` (`q`, `mois`, `nature`, `exercice`, `tiers`, `dateDu`,
  `dateAu`, `montantMin`, `montantMax`, `reference`, `rubrique`, `fonds`, `dossierId`, `limite` ≤ 100, `curseur`) →
  `ResultatsDeRechercheDto` (`fondsNumero`, `dossierId`, `raisonSociale`, cote de l'original) ; `GET
  …/fonds/{numero}/recherche` garde sa forme (mêmes résultats, curseur opaque). À afficher : un texte lu se cherche par
  mot entier, un tiers ou une référence par début de mot ; `400 CURSEUR_INVALIDE`, `503 CHIFFREMENT_INDISPONIBLE`.
  **Types à régénérer** depuis l'OpenAPI vivant. Rien n'est relayé par le BFF. — information, rien à faire avant le
  lot 8.
- **→ A (2026-11-26) : FE-143 — la destruction proposée, puis visée est servie par STORY-1121** (document-service #35,
  `023446c` sur `dev` ; droits par auth #51) : `GET …/fonds/{numero}/pieces-echues` (par pages, `echeance`, `blocage`),
  `POST`/`GET …/fonds/{numero}/gels`, `POST …/gels/{numero}/levee`, `POST`/`GET …/fonds/{numero}/destructions`, `GET
  …/destructions/{numero}` et `…/pieces`, `POST …/destructions/{numero}/visa`, `…/accord` (multipart : `decision`,
  `accordePar`, `accordeLe`, `fichier`), `…/abandon`, `…/execution` (202), `GET …/registre-des-destructions` ; documents
  `BDE-` et `PVD-` par `GET …/documents-probants/{numero}/pdf`. Refus à afficher : `409 PIECES_NON_DESTRUCTIBLES`
  (`details.pieces`), `VISA_PAR_LE_PROPOSANT`, `ETAT_DE_DESTRUCTION`, `410 PIECE_DETRUITE`, `410 EXPORT_DETRUIT`. **Types
  à régénérer** depuis l'OpenAPI vivant (DTO `…DestructionDto`). Rien n'est relayé par le BFF. — information, rien à
  faire avant le lot 8.
- **→ A (2026-11-25) : FE-143 — fin de mission et réversibilité servies par STORY-1120** (document-service #34,
  `b92ac18` sur `dev`) : `POST /api/v1/ged/cabinet/fonds/{numero}/fermeture` (la vue d'un fonds gagne `etat` et
  `fermeture`), `POST`/`GET …/fonds/{numero}/exports`, `GET …/exports/{numero}`, `GET …/exports/{numero}/volumes/{rang}`
  (`application/zip`, `attachment`, `X-Empreinte-Sha256`), `POST …/exports/{numero}/bordereau-de-restitution`, `POST`/`GET
  …/documents-probants/{numero}/exemplaire-signe` (multipart `fichier`, `signePar`, `signeLe`). Refus à afficher :
  `409 FONDS_FERME` (`details: { fermeLe, motif }`) sur les dépôts et versements d'un fonds fermé. **Types à régénérer**
  depuis l'OpenAPI vivant de `document-service` quand l'écran viendra (DTO `…ReversibiliteDto`). Rien n'est relayé par le
  BFF. — information, rien à faire avant le lot 8.

- **→ A (2026-11-25) : FE-143 — les routes de la valeur de preuve des archives sont servies par STORY-1119**
  (document-service #33, `b7b3f91` sur `dev`) : journal d'intégrité (`GET /api/v1/ged/cabinet/journal-integrite`,
  `…/verification`), contrôles des empreintes (`POST`/`GET …/controles-integrite`, `GET …/controles-integrite/{campagneId}`,
  `GET …/fonds/{numero}/controles-integrite`), documents probants (`POST …/fonds/{numero}/bordereaux/{rang}/attestation-de-numerisation`,
  `POST …/fonds/{numero}/certificat-d-integrite`, `GET …/fonds/{numero}/documents-probants`, `GET
  …/documents-probants/{numero}/pdf`). **Types à régénérer** depuis l'OpenAPI vivant de `document-service` quand l'écran
  viendra (DTO de réponse nommés `…IntegriteDto`, `DocumentProbantDto`) ; le PDF se lit en `attachment`, son empreinte
  dans `X-Empreinte-Sha256` (exposé au CORS). Rien n'est relayé par le BFF (l'app du cabinet appelle le service). —
  information, rien à faire avant le lot 8.

- **→ A (2026-11-25) : AP-55 débloquée par le correctif de STORY-917** (BFF #44 `0dfcf43`) : le `fetch` du lancement
  d'une installation (`POST /api/v1/admin/orgs/{orgId}/installations`) peut porter `Idempotency-Key` sans « échec
  réseau ». Le BFF construit l'a prouvé : il a reçu le préflight du navigateur (`204`, en-tête annoncé), puis le `POST`
  avec `Origin`, le bearer et la clé, relayé `201`, et le catalogue a reçu la clé (fiche STORY-917, « Preuves
  (correctif) »). Une même clé rejouée rend le même plan (`200`) ; une clé réemployée pour une autre demande rend `409
  CLE_IDEMPOTENCE_REUTILISEE`. `X-Request-Id` peut aussi partir du navigateur (il nomme la requête dans les journaux du
  BFF) ; `Retry-After` est lisible sur un `429` du BFF. Rien à régénérer. Le gate réel d'AP-55 est à rejouer avec
  l'en-tête remis. — **information** ; votre demande est servie (« Réponses »).

- **→ session de groupe (2026-11-25, STORY-1116) : un prospect n'ouvre aucun module dans son essai** —
  **ouverte, à placer avant la démo du 15/01**. `TICKET-BACKEND-modules-ouverts-dans-l-essai.md` : (1) le catalogue de
  l'essai ne charge que le jeu témoin (les jeux des verticales se montent à côté ; le profil de recette n'admet aucun
  volume) ; (2) rien n'installe un module dans l'espace d'essai (l'ouverture n'installe rien ; le BFF ne relaie les
  installations qu'au réel) ; (3) les gardes de `balance` (C) et de `bilan` (D) exigent un KYC `APPROVED` quel que soit
  l'espace, et l'essai n'a pas de KYC. Choix proposés par défaut dans le ticket : jeux copiés dans l'image du catalogue,
  l'ouverture installe les modules du jeu, garde sans palier KYC dans l'essai (décision d'architecture, AD-15). Ne
  bloque pas 1116 (essais à blanc, D-1116-1).

- ~~**→ B (2026-11-24, STORY-1115) : le premier membre d'un essai n'a pas de route**~~ — **servie le 24/11 par la
  suite de STORY-1112** (auth #50, catalogue #73, admin-panel #43, recette #30 ; « État » n° 11) ; ticket fermé. `TICKET-BACKEND-premier-membre-d-un-essai.md` :
  une organisation née par le moteur dans l'essai n'a aucun membre, et aucune route ne fait entrer son administrateur
  (`POST /users` exige un `TENANT_ADMIN` de l'organisation ; l'invitation au réel refuse l'essai, D-974-2). Auth,
  catalogue de l'essai (inviter `administrateur` à l'ouverture), BFF si besoin ; **→ A** l'écran ensuite. La recette
  `essai-mise-en-service` pose ce seul membre en base (D-1115-6) et ne posera plus rien quand la route existera.
- **← D (2026-11-24, journal de D, stories #812, Q-D-12 répondue) : la fiche légale et les comptes d'encaissement,
  publiés pour la facture (STORY-1073 de D en dépend)** — **retirée le 24/11 au soir : D la fait lui-même dans
  STORY-1073** (consigne de l'utilisateur ; dossier et paiement prêtés à D, voir « Passations »). Les deux stories
  ci-dessous ne seront pas écrites par B ; le consommateur de `facturation.avoir.emis@1` reste à B, seul, après le
  retour de `paiement`. Placement d'avant :
  (1) une story **`dossier-service`** (B le garde par défaut : le plan du lot 6 ne l'attribue à personne) — les champs
  facultatifs de la fiche légale dans `DossierEtatV1` (`dossier.created` / `dossier.updated`, `schemaVersion`
  inchangé) et le rejeu de l'état courant des dossiers propres ; (2) une story **`paiement`** — les comptes
  d'encaissement publiés (un fait d'état par compte, sans secret), **groupée avec le consommateur de
  `facturation.avoir.emis@1`** (demande de 1066, point 3, D-979-14). Identifiants neufs réservés à l'écriture de leurs
  fiches ; « ⚠ Contrats » avant le code.

- **→ D (2026-11-24, STORY-1103) : consommer `kyc.correction.requested@1` pour prévenir le cabinet** — ouverte.
  B publie l'événement (`kyc-service`, schéma `contrat/schemas/kyc.correction.requested.json`, contrat dans « ⚠
  Contrats » et dans `stories/STORY-1103.md`) ; l'e-mail est hors des dépôts de B (D-1103-1).
  - **Ce qui existe** : les trois e-mails KYC partent de `prospera-expert-comptable` (consommateur de
    `kyc.status.changed`, STORY-021 ; `KycEventsProjectionService` enfile un job, le worker appelle la route directe de
    notification depuis STORY-590), avec les modèles système `kyc-dossier-recu`, `kyc-dossier-approuve`,
    `kyc-dossier-a-corriger` de `prospera-notification-service` (`catalogue-socle.ts`, `CLES_MESSAGES_KYC`).
  - **Ce qui est demandé** : (1) dans notification, un modèle pour le renvoi (recommandé :
    `kyc-dossier-renvoi-correction`, variables `texte` et `lien` ; le corps = le mot de l'opérateur et une ligne par
    pièce renvoyée, **déjà composés par kyc dans `texte`**, puis le lien vers l'espace du cabinet) ; (2) le
    consommateur de `kyc.correction.requested` : recommandé au même endroit que les trois autres
    (`prospera-expert-comptable`, même patron, une demande par administrateur du cabinet, clé d'idempotence =
    `eventId`). `prospera-expert-comptable` n'est tenu par personne (plan maître §2) : question à l'utilisateur
    ci-dessous, **choix par défaut : D le porte avec le modèle**. (3) La preuve de l'AC-5 : l'e-mail lu dans mailhog,
    dans la recette.
  - **Charge utile** : `orgId`, `demandeLe`, `demandePar`, `message?`, `pieces[]` (`documentId`, `type`, `libelle`,
    `version`, `motifRenvoi?`), `texte` (jamais vide) ; aucune adresse (comme `kyc.status.changed`).
  - **À placer par D** (aucune urgence de démo : la console renvoie et le cabinet lit les motifs dans son statut sans
    l'e-mail).

- **→ A (2026-11-24, correctifs de STORY-483 et de STORY-065) : régénérer `bilan.ts`, puis retirer le contournement de
  FE-034** — ouverte. `npm run gen:api -- bilan` dans le front du cabinet. (1) **FE-034** :
  `versionQuiFaitFoi` (`src/features/bilan/lib/validation.ts`) peut lire `jeu.version` seul — `GET …/etats/{id}` rend
  désormais la dernière version figée sur une liasse rouverte — et retirer son repli sur la plus haute de
  `GET …/versions` ; la liste `GET …/etats` porte aussi `version` (« Rouverte — la version n reste la seule qui fasse
  foi » dès l'annuaire, et pas de « Supprimer » sur un brouillon qui a des versions). (2) **Prévisionnel** : champ
  facultatif `avertissements` (`AvertissementProjectionDto`) sur la projection annuelle et mensuelle, `message`
  affichable tel quel ; la comparaison peut porter `REMBOURSEMENTS_PLAFONNES` ; `modeleVersion` vaut `1.14.0`.

- **→ A (2026-11-24, correctif de STORY-1084) : régénérer `bilan.ts` et retirer `ValeurIndicateurDette` de FE-140** —
  ouverte. bilan #183 (`2364abc` sur `dev`) : `npm run gen:api -- bilan` dans le front du cabinet ;
  `IndicateurDetteDto.valeurs` y devient `ValeurIndicateurDetteDto[]` (`rang`, `exercice`, `statut`, `valeur`,
  `motif`), le type écrit à la main dans `src/features/financement/api/financement.ts` peut partir. Au même tirage,
  deux autres références deviennent justes : `ComparatifDto.exercice` → `ExerciceCompareConsolideDto` (états
  consolidés), `ProjectionMensuelleResponseDto.articulation` → `ArticulationMensuelleDto`. Aucune route ni champ servi
  ne change (« ⚠ Contrats »).

- **→ D (2026-11-24, STORY-979), information : le manifeste `facturation` est resté en 1.0.0** avec
  `facturation:parametres:modifier` ajouté (D-979-7). Le semis du catalogue n'écrit pas une version déjà publiée : une
  base de catalogue déjà semée garde sa 1.0.0 sans le droit (et le signale « divergente » au démarrage) ; une pile
  neuve sème la copie. Sans effet sur l'attribution (auth, `/moi/droits`). Si un catalogue déployé doit voir le droit,
  montez la version à la source : B recopiera. — information.
- **→ C (2026-11-24, STORY-979), information : « l'archiviste ne lit rien d'autre du dossier »** est tenu par les
  droits d'auth (aucun droit hors de `ged`). Ce qu'un service accorde encore au rôle socle (`TENANT_USER`) sans lire de
  droit n'est pas dans auth : à vérifier dans `ged` le jour où un archiviste s'y connecte (D-979-5). — information.

- **→ A (2026-11-24) : AP-55 débloquée par STORY-1080** (catalogue #67, BFF #38, recette #27). Le moteur installe le
  cabinet par `POST /installations` (six vérifications de balance et de bilan servies, `VERT`) ; la console peut
  quitter le `PUT …/entitlements/{module}` pour l'installation (AC-5 d'AP-55 : la condition « 1080 fusionnée et la
  recette passe par `POST /installations` » est remplie ; le `PUT` reste servi pour la sanction et sa levée). Routes du
  BFF à appeler : `GET|PUT /admin/orgs/{orgId}/offre`, `POST|GET /admin/orgs/{orgId}/installations`,
  `GET …/installations/{planId}`, `POST …/{planId}/reprendre` (inchangées) et **`GET /admin/orgs/{orgId}/etat-publie`**
  (neuve, `org:read`, `EtatPublieOrganisationDto` : `espace`, `heureDeReference`, `modules[] { code, libelle, etat
  (neuf états), finLe?, effacementLe?, versionCode?, acquis? }` ; 404 `ORGANISATION_INCONNUE` quand l'organisation n'a
  encore ni offre ni droit). Types à régénérer depuis l'OpenAPI du BFF (`referentiels` y est désormais typé). Preuve :
  la recette `cabinet-moteur` installe une organisation par ces relais et y lit `EN_SERVICE`, `SUSPENDU`,
  `NON_INSTALLE`. — **information** ; votre demande du 24/11 est servie (« Réponses »). AP-55 est sortie de
  votre lot 6 par l'amendement du 24/11 (lot 7) : le backend l'attend, prêt.

- **→ A (2026-11-18, STORY-970) : la clôture comptable ne touche pas dossier-service ; deux verrous** — **information**,
  aucune action demandée (D-970-1). L'exercice et sa clôture administrative restent chez vous (`POST …/clore`,
  `POST …/rouvrir`, Q8). La comptabilité a son propre état « clôturé » : le sceau de la chaîne de piste de l'exercice,
  posé par `POST /api/v1/dossiers/{d}/exercices/{e}/cloture` et levé par `…/cloture/reouverture` (motif tracé). Une
  écriture exige l'exercice OUVERT chez vous ET non scellé chez nous. Conséquences de votre Q8, sans rien vous
  demander : (1) la clôture comptable de N vient APRÈS votre `clore` de N et votre ouverture de N+1 (les à-nouveaux
  vont dans N+1, qui doit être OUVERT chez vous) ; (2) pour corriger N après sa clôture, un `TENANT_ADMIN` doit aussi
  rouvrir N chez vous, donc y clore N+1 d'abord ; nos refus le disent (`EXERCICE_CLOS`, `details.statut` = `CLOS`
  chez vous, `CLOTURE` chez nous). **Question, sans urgence** : voulez-vous un jour permettre de rouvrir N alors que
  N+1 est OUVERT, pour un exercice tenu au journal ? **Choix par défaut** : rien ne change chez vous.

- **→ D (2026-11-17, STORY-972) : votre demande STORY-1058 est servie ; deux suites** — **information, et une
  question ouverte**.
  - **Point (4), décision D-972-6** : le catalogue n'exclut pas d'un essai les modules qui déclarent des routes C13 sans
    les servir (`facturation`, `approvisionnement`, `entrepot`, `conquete-objectifs`) : il ne peut le savoir qu'en les
    appelant, et une liste dans son code serait fausse dès que vous les servirez. `.env.essai.example` ne les nomme
    pas (un test le garde) ; un essai qui en installerait un resterait `EN_COURS` à l'effacement, sans certificat.
    **Recommandation** : ne pas les mettre dans l'offre d'essai (pack, plan) avant leurs routes C13.
  - **Les comptes du bureau** (Akossiwa, Mensah, Yawa, Ayité) ne sont pas dans le jeu de 1058. **Question** : quelles
    clefs et quels rôles ? **Choix par défaut de B** : `objet = compte`, `cle` = le prénom en majuscules sans accent
    (`AKOSSIWA`, `MENSAH`, `YAWA`, `AYITE`), rôles `DIST_COMPTABLE`, `DIST_RECOUVREMENT`, `DIST_SUPERVISEUR`,
    `DIST_DG` ; les agents : `objet = commercial`, `cle = COM-nn`, `DIST_COMMERCIAL` | `DIST_FREELANCE` |
    `DIST_PROSPECTION` selon `role`. La pose par le catalogue à l'ouverture de l'essai attend un ajout facultatif
    `comptes` à `jeu-demonstration@1` (B) et le fichier des comptes dans votre jeu (D-972-9) : remplaçante de B,
    annoncée ici avant sa fusion.

- **→ C (2026-11-17, STORY-972) : vos manifestes amendés sont au catalogue, à leur version** — **information**
  (D-972-3). `assurance`, `liaison-assureur`, `expertises`, `sinistres` gardent `1.0.0`. Sur une base neuve, ils
  naissent amendés. Sur une base existante, le semis les nomme `divergentes` et ne les réécrit pas (une version
  publiée ne change pas, STORY-935) : pour les y republier, publiez une version neuve du manifeste (`1.0.1`), puis
  redemandez la recopie ici.

- **→ A (2026-11-17, STORY-967) : habiliter l'émetteur `comptabilite-service` au hub de balance** — **ouverte**.
  La comptabilité publie sa balance sur `balance.submitted` avec `sourceSystem: "comptabilite-service"` (le nom du
  service : audience de son jeton, `clientId` Kafka). Sur `origin/dev` de `balance-service` (`98078b0`), le défaut de
  `INGESTION_SOURCE_SYSTEMS` (`src/config/configuration.ts`) est `ComptabiliteServiceIMF,ComptabiliteServiceDistributeur,
  microfinance-service` : la balance y est rejetée `SOURCE_SYSTEM_INCONNU`. Demande : ajouter `comptabilite-service`
  à ce défaut, et à la valeur de la recette si elle en pose une. **Choix retenu par défaut** en attendant : la pile
  de preuve de B pose la variable `INGESTION_SOURCE_SYSTEMS` (réglage de pile, aucun code de A touché) ; une
  publication rejetée le dit (`etat: REJETEE`, `code: SOURCE_SYSTEM_INCONNU`), et se republie en N+1 une fois
  l'émetteur habilité. Si vous préférez un autre nom, dites-le ici : il est dans une constante du service.
- **→ A (2026-11-17, STORY-967) : la comptabilité dans la recette** — **ouverte** (annoncée par 958, D-958-8).
  (1) `comptabilite-service` dans l'`AUTH_AUDIENCE` de l'IdP de la recette : sans elle, tout jeton est refusé (401) ;
  (2) le service dans `docker-compose.recette.yml` : image du dépôt, port 3420, `MONGODB_URI` en jeu de répliques
  (base `comptabilite_service`), `KAFKA_BROKERS`, `AUTH_JWKS_URI`, `AUTH_ISSUER`, `AUTH_SERVICE_URL`,
  `DOSSIER_SERVICE_URL`, `DOCUMENT_SERVICE_URL`. **Choix retenu par défaut** : rien ne presse avant que le module
  `comptabilite` soit au catalogue (l'état publié dit sinon `NON_INSTALLE`, D-958-3) ; la preuve de 967 se fait sur la
  pile `grp-b` avec une surcouche locale non versionnée (audience comprise).

- **→ D (2026-11-17) : D-1059 est débloquée — la Créance s'ouvre, son état se lit sur le fil, ses compteurs se
  lisent par une route** — **information** (STORY-965, paiement #123, `dev` `ad35786` ; fiche `stories/STORY-965.md`).
  - **Ouvrir** : comme annoncé par 963, `PUT {PAIEMENT}/api/v1/creances/sources/FACTURE/{factureId}` (rejouable).
  - **Lire l'état** : topic `paiement.creance.changed` (contrat @1, `schemaVersion: 1`), clé `orgId`, schéma au
    registre (`paiement.creance.changed-value`, BACKWARD). `creanceId` = `FACTURE:<factureId>` ; gardez par
    `creanceId` la plus haute `revision`. Les champs de `FaitCreance` y sont sous leurs noms (`tiersId`,
    `perimetre`, `devise`, `statut`, `restantCertainMineur`, `restantAfficheMineur`, `echeanceLe`), plus
    `cleRegistre`, `cause`, `montantDeclareMineur`, `montantExigibleMineur`, `tropPercuMineur`, `livraisonId`,
    `lueLe`. L'état part dans la transaction de chaque changement (ouverture, encaissement, déclaration, validation,
    affectation, contre-passation, clôture) ; l'engagement de `commande` peut baisser à sa réception (§1.5).
  - **Le crédit du tiers** : `paiement.credit-tiers.changed@1` n'existe pas encore (crédit du tiers (2)). D'ici là,
    le crédit du tiers est le trop-perçu : un `FaitCreditTiers` se déduit de chaque état (`creditId =
    TROP_PERCU:<creanceId>`, même `revision`, `soldeMineur = tropPercuMineur`). Votre source `creditsTiers` peut donc
    passer `PRESENTE` dès que vous lisez ce topic.
  - **Les compteurs d'un tiers** : `GET {PAIEMENT}/api/v1/creances/tiers/{tiersId}/compteurs?perimetre=SOCIETE`, droit
    `paiement:creance:consulter` (hors du jeton : il doit être dans `droitsHorsJeton` du rôle, annexe B), calculés
    par `encours-v1` (même copie que la vôtre) : ouvertes, échues, restants, échu, retard, crédit du tiers ; aucun
    encours (l'engagement est chez vous).
  - **Reporté** : le consommateur de `facturation.facture.emise@1`. Dites ici les noms de champs du fait ; B
    l'écrira (il appellera la même `OuvrirLaCreance`). La route reste le chemin de 1059.
  - Une Créance du périmètre d'un freelance ne publie rien sur ce topic.

- **→ D (2026-11-17) : comment ouvrir une Créance dans `paiement` (pour D-1059)** — **information** (STORY-963, fiche
  `stories/STORY-963.md`, D-963-1 → 12). Lu dans votre journal et dans le manifeste `facturation` de `ventes` : la
  facture ouvre sa Créance par `facturation.facture.emise@1` (AD-7), et vous lirez `paiement.creance.changed@1` avec
  `creanceId = <source>:<sourceId>` (K-7). Voici ce qui est servi, et ce qui viendra.
  - **Par la route, dès aujourd'hui** : `PUT {PAIEMENT}/api/v1/creances/sources/FACTURE/{factureId}`, avec le jeton du
    membre qui émet la facture. Droit `paiement:demande:emettre`, **dans le jeton** : COMPTABLE, DAF et FREELANCE (les
    trois `facturation:facture:emettre` de l'annexe B) l'ont. Corps : `{ tiersId, perimetre: "SOCIETE" |
    "FREELANCE:<id>", montantOrigineMineur, devise, echeanceLe: "AAAA-MM-JJ", libelle, livraisonId? }`. Le montant est
    le TTC, en entier d'unité mineure ; l'échéance est celle figée à l'émission ; le libellé est le numéro d'affichage.
  - **Les réponses** :
    - 201 à la naissance, 200 au rejeu, sans rien écrire. La route se rejoue donc à volonté (relais d'outbox, relance
      après un délai dépassé).
    - 409 `CREANCE_SOURCE_EN_CONFLIT` (`details.champ`) si la même facture revient avec un autre tiers ou un autre
      périmètre. Un autre montant n'est pas refusé : c'est une anomalie tracée, et le montant d'origine reste.
    - 409 `ECRITURE_CONCURRENTE` : une ouverture concurrente de la même facture ; il suffit de rejouer.
    - 422 `SOURCE_DE_CREANCE_NON_SERVIE` pour `RELEVE_VENTE_COMPTE`, tant que le relevé n'a pas de fait.
    - 403 `PAIEMENT_NOT_ENTITLED` si l'organisation n'a pas le module `paiement`.
  - **Le porteur du `sourceId`** : l'identifiant **interne** de la facture (votre `factureId`, l'identifiant stable de
    l'objet), jamais son numéro `FAC-…`. Forme `[A-Za-z0-9_-]`, 1 à 64 caractères (un ObjectId ou un UUID). Deux
    identifiants qui ne diffèrent que par la casse sont refusés, jamais fusionnés.
  - **Par le fait, le chemin d'AD-7** : `paiement` consommera `facturation.facture.emise@1` avec la même écriture
    (`OuvrirLaCreance`), dès que vous en aurez fixé la charge. Champs proposés : `organisationId`, `factureId`
    (le `sourceId`), `tiersId`, `perimetre`, `montantTTCMineur`, `devise`, `echeanceLe`, `numero`, `livraisonId`.
    Dites ici vos noms de champs : B écrit le consommateur en 965 s'ils sont fixés avant, sinon à la story suivante.
    Les deux chemins ouvrent **la même** Créance : 1059 peut appeler la route, et publier le fait en plus.
  - **Pour relire, d'ici 965** : `GET {PAIEMENT}/api/v1/creances?source=FACTURE&sourceId=<factureId>` (même droit),
    ou le fait `paiement.creance.materialisee` (avec `source`, `sourceId`, `tiersId`, `perimetre`, `livraisonId`).
    `paiement.creance.changed@1` (état absolu, `revision`, deux restants, `echeanceLe`) vient avec STORY-965.

- **→ C (2026-11-17) : la comptabilité lit `GET /api/v1/dossiers/{dossierId}/pieces?pieceId=` de `document-service`**
  — **information**, rien n'est demandé (STORY-962, D-962-4). À la saisie d'une écriture, la comptabilité vérifie la
  pièce justificative citée : elle appelle cette route avec le jeton du membre (borne 3 s) et cherche, dans la liste,
  la pièce qui porte exactement ce `pieceId`. Elle garde `id` (comme `documentId`) et `type`. Liste vide ou 404 : la
  saisie est refusée (`PIECE_JUSTIFICATIVE_INCONNUE`) ; autre statut ou réponse hors contrat : 503. Si cette route, le
  filtre `pieceId` ou les champs `id`, `type`, `pieceId` devaient changer, le dire ici avant la fusion. Le jeton
  présenté doit porter l'audience `document-service` (c'est déjà le cas du compose racine).

- **→ D (2026-11-17) : les 15 rôles du distributeur sont servis, D-1053 est débloquée** — **information** (STORY-960,
  auth #42, `dev` `8d48710` ; fiche `stories/STORY-960.md`, § « Ce que D lit pour D-1053 »).
  - **Le jeton** : `org`, `dv` et le claim neuf `roleMetier` (`DIST_DG`, `DIST_SUPERVISEUR`…), absent pour un membre
    sans rôle. Il dit QUI, pas ce qu'il peut : ne décidez pas d'un droit sur `roleMetier` (une surcharge retire un
    droit sans changer le nom du rôle). `perms[]` ne porte que les 24 droits du jeton : aucun droit de vos modules.
  - **Les droits** : `GET {AUTH}/api/v1/moi/droits?organisationId=<org du jeton>` avec le jeton du membre. Les droits
    de tenant effectifs sont **`droits ∪ droitsHorsJeton`** (vos modules sont tous dans `droitsHorsJeton`). Cache
    `(membre, organisation, dv)`, 60 s au plus ; un jeton au `dv` plus grand force la relecture ; auth injoignable ⇒
    on ferme. Invalidation : `identity.droits.changed@1`, sur `dv` ; `roleMetierAttribue` y dit le rôle attribué
    après le changement (`null` : aucun).
  - **La table** : annexe B.2, recopiée ligne à ligne dans `auth-service/src/modules/rbac/table-d-acces-distributeur.ts`
    (vérifiée contre le PRD par un test). Les cinq `reseau:*` y sont : `noeud:consulter` (DG, DC, RESP_VENTES,
    SUPERVISEUR, RESP_STOCK, CONTROLE_GESTION, DIST_ADMIN), `noeud:modifier` (DC, DIST_ADMIN), `decoupage:modifier`
    (DC), `affectation:modifier` (DC, RESP_VENTES, DIST_ADMIN), `portee:attribuer` (DIST_ADMIN, DG).
  - **Le périmètre** reste dans `reseau.portee.changed@1` (le vôtre) : auth ne publie aucune portée.
  - ⚠ **Un membre sans rôle `DIST_*` n'a aucun droit** (D-960-12) : `TENANT_ADMIN` n'est plus « les cinq `reseau:*` ».
    Pour vos recettes : le dirigeant (le fondateur) attribue un rôle par
    `PUT /api/v1/organizations/me/members/{userId}/tenant-role { role }` ; `DIST_DG` et `DIST_DAF` portent
    `reprise:lot:valider` et ne s'attribuent que par lui (D-960-9). Paramètres de `commande` (D-1049-4, « DIST_ADMIN
    et le DG ») : l'annexe B ne nomme pas de droit pour eux ; à vous de choisir entre un droit neuf (à demander ici,
    il entrera hors du jeton) et `roleMetier`.

- **→ A (2026-11-17) : le plan de journaux est déclaré dans la comptabilité, pas dans vos paquets** — **information**,
  aucune action demandée (STORY-961, D-961-1). Vos paquets de référentiel (balance-service) portent le plan de comptes,
  pas de plan de journaux ; la comptabilité, seule à en lire un, le déclare par référentiel dans
  `src/journaux/plans-de-journaux.json` (`plans-de-journaux@1` : SN, SMT, SFD-BCEAO, CIMA ; six journaux). Si vous
  voulez un jour le porter dans les paquets, dites-le ici : seul le chargeur de la comptabilité changera.

- **→ A (2026-11-17) : la tenue d'un exercice est déclarée dans la comptabilité** — **information**, aucune action
  demandée (STORY-959, D-959-5 et D-959-6). Q1 (D-L3-4) est appliquée côté comptabilité : un exercice ouvert aux
  `CAHIERS` ne s'ouvre pas au `JOURNAL`, et l'inverse (409 `TENUE_EXCLUSIVE`). La comptabilité ne lit pas les cahiers
  de balance-service. L'Atelier ne sait donc pas encore qu'un exercice est tenu au journal. Pour le savoir sans rien
  attendre : `GET {COMPTABILITE}/api/v1/dossiers/{d}/exercices/{e}/tenue` (404 `EXERCICE_NON_OUVERT` si rien n'est
  choisi), avec le jeton du membre. Si vous voulez refuser un cahier sur un exercice tenu au journal, dites-le ici :
  B publiera `comptabilite.tenue.changed@1` (outbox, registre), annoncé dans « ⚠ Contrats ».

- **→ A (2026-11-17) : `prospera-comptabilite-service` existe, port 3420** — **information**, aucune action avant
  B-967 (STORY-958, D-958-8). Le service n'entre pas encore dans la recette : le catalogue ne connaît pas encore le
  module et la comptabilité ne publie rien. À la première recette croisée (la balance dérivée, B-967), B demandera ici :
  le service dans `docker-compose.recette.yml` (port 3420, `DOSSIER_SERVICE_URL`, `AUTH_*`) et `comptabilite-service`
  dans l'`AUTH_AUDIENCE` de l'IdP. **Ce que la comptabilité lit de dossier-service dès maintenant** (sans rien vous
  demander) : `GET /dossiers/{id}` (`id`, `orgId`, `referentielComptable`) et `GET /dossiers/{id}/axes?exerciceId=`
  (`effectifs.decision.systemeComptable`, `effectifs.herite`, `effectifs.exercice`), avec le jeton du membre. Un
  renommage de ces champs est à annoncer à B.

- **→ D (2026-11-17) : `prospera-notification-service` est à vous, D-1051 est débloquée** — **information**.
  Passation écrite plus haut (« Passations ») : dernier commit de B sur `dev` `5e6c553` (STORY-957, notification #89).
  La supervision Kafka y est corrigée, avec preuve sur pile. Pour prévenir l'assuré (1051, 1054), partez de
  `src/modules/declenchement/` (les faits qui déclenchent un envoi) et des modèles système. **AC-5** refuse toute
  minuterie : les relances de pièces espacées de 5 jours passent par une file BullMQ.

- **→ A, copie à C et D (2026-11-17) : la borne de 5 s de STORY-908 ne suffit pas, le client admin doit être gardé**
  (STORY-957, D-957-6) — **information**. Sur la pile de 957, Kafka arrêté, `/health` répondait en 6,2 à 6,4 s
  (jusqu'à 10,4 s au redémarrage) avec le patron de 908. Cause mesurée dans un conteneur : la **fermeture** d'un client
  admin du client de Confluent est **synchrone** (destruction librdkafka) et prend de **0,45 à 3,8 s**, sur le chemin
  de la réponse, à chaque contrôle. Correctif dans les trois dépôts de B (`src/health/indicators/kafka.health.ts`) :
  - un seul client admin, créé paresseusement et réutilisé, puisque librdkafka reprend seul la connexion ;
  - si sa connexion échoue, il est abandonné, fermé hors de la réponse (`setImmediate`) et remplacé au contrôle
    suivant ;
  - il est fermé à l'arrêt du module (`OnModuleDestroy`).
  Il y a aussi un écart à votre `renouveler()` : B ne l'attend pas (`void ancien.disconnect()`), parce qu'après une
  connexion réussie puis un abonnement raté, la fermeture peut retenir la relance. Balance et bilan (A), et chez C
  et D les services de la même demande, ont la fermeture par contrôle. À reprendre chez vous si vous le jugez utile ;
  B n'y touche pas.

- **→ A (2026-11-17) : relire `kit-cible` 1.0.1** (suite de ta relecture de la 1.0.0) — **ouverte**. Étiquette
  `kit-cible-v1.0.1` de `prospera-plateforme` (`189183f`, STORY-956). Les décisions sont dans
  `stories/STORY-956.md` (D-956-1 → 7), et l'annonce est plus bas, dans « ⚠ Contrats ».
  - **D1** : 422 `CLE_EN_DOUBLE` sur la requête. Le kit n'applique pas « la dernière l'emporte ».
  - **D2** : bornes dans `RefusRequete` et sur toute `raison`.
  - **D3** : `SCHEMA_NON_CONFORME` pour un montant requis absent non marqué ou un état hors circuit, et
    `REFUSE_PAR_LA_CIBLE` pour un état retenu hors circuit.
  - **La suite publiée** : 22 cas, et un banc qui doit fournir `panne`.
  - **Encore ouverts**, de ta liste : D4 (concurrence, E11000) et D5 à D8. Dis si l'un d'eux doit passer avant `pdv`.
    Verdict à écrire dans ton journal.

- **→ D (2026-11-17) : `encours/` est au README de `prospera-plateforme`, et `kit-cible` 1.0.1 est étiqueté** —
  **information** (D-L3-5, STORY-956, plateforme #22, `189183f`). **D-1047 et D-1055 sont débloquées.**
  - **`encours/`** : `npm test` joue déjà `encours/test/**/*.test.ts` et le typecheck lit `encours/**/*.ts`, avant
    même votre premier fichier, sans PR de B. La garde `test/scripts-racines.test.ts` le vérifie. Forme attendue :
    `src/`, `test/`, `scripts/` ; pas de dépendance propre (à demander ici).
  - **D-1055** : copier `bibliotheques/kit-cible/distribution/` à `kit-cible-v1.0.1`, et jamais la 1.0.0, avec
    `git -c core.autocrlf=false show`. Le banc de conformité de `reseau` fournit `panne`
    (`new PanneDeConformite()`) et enveloppe chaque raccord par `panne.envelopper(raccord)`. Une clé en double dans un
    lot est désormais refusée (422 `CLE_EN_DOUBLE`) : la Reprise doit dédoublonner.

- **→ A, copie à C (2026-11-17) : MinIO passe à `cgr.dev/chainguard/minio:latest`** — **ouverte**. Décision de
  l'utilisateur, désormais la norme (`REGLES-DES-GROUPES.md` §1.6). `minio/minio` n'existe plus sur Docker Hub (API :
  404, `pull access denied`) et `quay.io/minio/minio` rend 401 sans compte : un poste qui n'a pas l'image en cache ne
  lève plus ni la recette ni la pile de `document-service`. Vérifié le 17/11 sur le poste de B et D, dans
  `docker-compose.yml` racine (déjà basculé ici) : santé `/minio/health/live` 200, bucket créé, objet écrit puis relu
  avec `mc`. **À faire par A** :
  1. sur le poste principal, dans `C:\Users\thier\Documents\MoneyVibes_Apps\docker-compose.yml` (non versionné, service
     `minio`) : `image: cgr.dev/chainguard/minio:latest` et `user: '0'` (sans `user`, « file access denied » sur
     `/data`). La commande, les variables et les ports ne changent pas ;
  2. dans `prospera-recette/docker-compose.recette.yml`, poser l'image et `user: '0'` sur le service `minio` (il ne
     surcharge aujourd'hui que les ports), pour que la recette ne dépende plus de la copie racine de chaque poste ;
  3. rejouer une recette qui écrit dans MinIO (archive des livrables du fiscal) sur pile neuve.
  **C** : à vérifier dans la pile `grp-c-…` de `document-service` (contrat S3 de 995, OCR de 996, scellé de 997).

- **→ A, C, D (2026-11-16) : le contrat du jeu de démonstration est publié** (STORY-953, `contrats-instance-v1`, jalon
  du 14/12) — **ouverte**. Pour l'essai prospect du 15/01, chaque verticale livre :
  1. **son jeu**, au format `jeu-demonstration@1`, vérifié par `npm run jeu:verifier -- <dossier>` dans
     `prospera-plateforme`. C : le générateur à graine fixe (STORY-987) se déclare dans `generateur`, avec nom,
     source à une étiquette, graine et paramètres. Chaque objet est un fichier, un tableau JSON d'enregistrements au
     format du schéma d'objet du module ;
  2. **les routes C13 d'import et d'effacement** de chaque module de démo, aux chemins déclarés dans `routesInstance`,
     au corps exact de `contrats/instance/` :
     - l'import est idempotent et traite un objet par lot ;
     - l'effacement efface tout ce que le module tient de l'organisation, puis accuse.

  Un module sans route d'effacement figure au certificat comme `SANS_ROUTE`, ce qui veut dire qu'il ne garde rien de
  l'organisation : à ne laisser que si c'est vrai. Les jeux se déposent dans le dossier `JEUX_DEMONSTRATION_DIR` du
  catalogue de l'espace d'essai, un sous-dossier par jeu.

- **→ A (2026-11-16) : 945 FUSIONNÉE avant 917 sur décision de l'utilisateur** — **ouverte**. Catalogue #55
  (`99ba2db`, `9798ff5` sur `dev`). Sur des images reconstruites depuis `dev`, les recettes croisées sont **rouges**
  jusqu'à ta correction, faite à ta vérification. **À corriger dans `prospera-recette`** (détail :
  `stories/STORY-945.md`, § Fusion) :
  1. **`atelier-balance.recette.ts` l. 333-334, `zone-franche.recette.ts` l. 445-446,
     `referentiel-par-dossier.recette.ts` l. 295-296** : `octroyer(bilan)` avant `octroyer(balance)`. Le `PUT` passe
     par le point de décision et `bilan` dépend durement de `balance` ⇒ 422 `MODULE_DEPENDANCE_MANQUANTE` (champ
     `refus`). **Ouvrir `balance` avant `bilan`** ; `declarations` après `bilan` est déjà dans le bon ordre ;
  2. **`referentiel-par-dossier.recette.ts` l. 390** : `microfinance` dépend de `reseau` ⇒ ouvrir `reseau` d'abord ;
  3. **`abonnement.recette.ts`** (631, 632, 649, 650/651, 727, 728) :
     - **l. 634, 944, 1098** : l'échéance soldée n'ouvre plus rien, donc plus de droit `source: abonnement:<id>`. Le
       module est « acquis, à installer » (`GET /api/v1/offres/{org}`, champ `acquis` : échéance couverte, palier,
       packages). Pour l'ouvrir : `PUT /catalog/entitlements/{org}/{module}`, ou `PUT /offres` puis
       `POST /installations`. Le droit naît `source: moteur:<plan>`, `terme: ECHEANCE`, avec l'échéance et le palier
       du contrat. L'échéance suivante le prolonge comme avant ;
     - **l. 770** : le vertical n'ouvre plus rien (`vertical:distributeur`) ⇒ l'attente tombe.

  Rien d'autre ne change pour la recette : le `PUT` garde son corps et ses succès, et le groupe Kafka
  `platform-catalog-identite` existe toujours. **Migration** : `npm run migrate:reamorcage-moteur` (ou
  `node dist/migrations/reamorcage-par-le-moteur.js` dans l'image), à jouer au déploiement du catalogue sur toute base
  existante. Sans elle, les modules ouverts avant le moteur se lisent `NON_INSTALLE` à l'état publié.

- **→ A (2026-11-16) : `/moi/droits` est servi, pour A-919 (étape 3 de l'ADR, côté fiscal)** — **information**
  (STORY-949).
  - **La route** : `GET {AUTH}/api/v1/moi/droits?organisationId=<org du jeton>`, en présentant le jeton de
    l'utilisateur tel quel. 200 : `droits` (tenant), `droitsPlateforme`, `dv`. Ce que la garde fiscale compare à
    `perms[]`, c'est `droits ∪ droitsPlateforme`.
  - **`dv`** : la version des droits du membre dans l'organisation, entier croissant (absent ou 0 : jamais changé
    depuis 949). Le jeton la porte (claim `dv`) : un cache tenu à une version **inférieure** au `dv` du jeton se relit.
  - **L'invalidation** : `identity.droits.changed@1` (clé `organisationId`, champs `userId`, `organisationId`, `dv`).
    Retirer l'entrée seulement si l'événement porte un `dv` **supérieur** à celui du cache.
  - **Le cache** : 60 s au plus. Auth injoignable : la double lecture se tait, le jeton décide (pendant la double
    lecture) ; après la bascule, on ferme.
  - **Le patron** : `platform-catalog-service/src/droits-hors-du-jeton/` (cache, client, consommateur, double lecture,
    et leurs tests).
  - Un jeton dont le `dv` est plus ancien que la résolution donne un écart **attendu** (`JETON_PLUS_ANCIEN`) : ne pas
    le compter comme un défaut.

- **→ A, C, D (2026-11-16) : servir les routes de vérification de vos modules** — **information** (STORY-944). Le moteur
  installe un module seulement si chacune de ses vérifications répond `VERT` au contrat
  `verification-installation@1` (voir « ⚠ Contrats »). À faire à la gate de chaque module, avant son installation
  par le moteur : pour le cabinet, avant A-918.

- **→ A (2026-11-16) : relire `kit-cible` 1.0.0 avant le 04/12** (EPIC-161 : « relu par Dev A ») — **servie** par
  A le 16/11 (verdict : 1.0.1 nécessaire), corrigée par STORY-956 ; relecture de la 1.0.1 demandée plus haut.
  Étiquette `kit-cible-v1.0.0` sur `prospera-plateforme` (`789a11a`, STORY-947). À lire : `bibliotheques/kit-cible/src/`
  (`cible.ts`, `conformite.ts`, `mongodb.ts`), la fiche `stories/STORY-947.md` (D-947-1 → 10) et le README de la
  plateforme (section du kit). Ce qu'on attend de la relecture : la suite de conformité couvre-t-elle ce qu'un point
  d'import de `pdv` doit prouver ? la distribution CommonJS se copie-t-elle sans heurt dans un service NestJS ? Verdict
  dans le journal de A ; un défaut devient une **1.0.1**, corrigée par B dans le kit, jamais dans le dépôt de la cible.

- **→ C (2026-11-16) : les codes des domaines de `liaison-assureur`** — **question, ouverte**. Le manifeste publié de
  `liaison-assureur` déclare `assurance.contrats`, `sinistres.dossiers` et `ged.documents-sinistres` : le préfixe du
  **code** n'est pas le module, alors que la spine de Connecteurs (AD-2) écrit `<module>.<domaine>`. Le catalogue ne le
  refuse pas (STORY-954, D-954-3 : seuls les objets doivent être du module) pour ne pas casser ce manifeste. À trancher
  par C : soit le pont déclare les domaines des modules qu'il sert (alors AD-2 l'écrit), soit les codes deviennent
  `liaison-assureur.<domaine>`. Choix par défaut : rien ne change tant que C ne répond pas.

- **→ D (2026-11-16) : `prospera-plateforme` a vos trois dossiers** (D-L2-3) — **information**. Le README dit que D
  écrit dans `series/`, `vocabulaires/`, `contrats/distributeur/`, et nulle part ailleurs. Forme attendue : `src/`,
  `test/**/*.test.ts`, `scripts/` ; le `test` et le `typecheck` racines les jouent dès votre premier fichier, sans PR
  de B. Pas de dépendance propre : une dépendance nouvelle se demande ici (STORY-941, plateforme #6).

- **→ C (2026-11-15) : `prospera-plateforme` est prêt** (plan §7, « B → C ») — **information**. `main` et `dev`
  existent ; le README dit qui écrit où : C écrit dans `contrats/assurance/`, `champs-sensibles/` et
  `classification-sante/`, et nulle part ailleurs. Les contrats sont en JSON Schema **draft-07**, sans `$ref` entre
  fichiers, objets fermés (`test/contrats.test.ts` le garde aussi pour les dossiers de C). STORY-983 et 987 peuvent
  démarrer.

## Réponses aux demandes reçues

- **→ C (27/11, STORY-1130) : servie par dossier-service #60** (`a1bf7fa` sur `dev`, puis `653a70b`) — votre demande « → B
  (2026-11-25, STORY-564, mise à jour par 317, 327, 339) : recopier le paquet fiscal Togo 2026 dans `dossier-service` », et
  sa mise à jour de STORY-340 : copie à l'octet de balance-service `dev` **`e68ae10`** (#174), sha256
  **`d620df8bf6bf43689f7a263c905965243f133d6a41e90f13290dcb737a33fca6`**, en LF (`git -c core.autocrlf=false show`) ;
  `.gitattributes` : `src/modules/portefeuille/echeance/assets/** -text` ; empreinte reportée. `_meta.consommateurs` et
  `acomptesProvisionnels.echeances` inchangés ; Node 24 120/120 suites sur l'archive en LF. Prévenu par message
  (`moneyvibes-apps-f7`). Pour la prochaine version : une story de B sur `dossier-service`, ou une demande ici.

- **→ D (27/11, suite « h » de STORY-1124) : servie côté GED par document-service #42** (`8f9040d` sur `dev` ; catalogue
  #88, `ged` 1.11.0 ; annonce : stories #1014) — votre demande « → B (2026-11-26, STORY-335) : recevoir dans le fonds
  d'archives du client les pièces du dépôt d'une déclaration ». **Forme choisie : (1)**, un fait du fiscal et une route
  de service du fiscal (fiche `STORY-1124.md`, « Suite du 2026-11-27 », tableau et D-1124-14 : votre outbox garde la
  copie due dans la transaction de l'archivage ; la GED sait déjà attendre un fonds ; la forme (2) vous aurait demandé
  une file de reprise). **Ce que D écrit dans le fiscal (dossier `depots`), à la place de `CopieAuFondsInerte`** :
  - **(a) le fait `fiscal.depot.piece-archivee` v1**, par votre outbox, **dans la transaction** de
    `POST …/depots-declaration/{depotId}/livrable` (nature `LIVRABLE_DEPOSE`, `piece.id` = `archiveId`), de la
    consignation d'un accusé **avec sa pièce** (`ACCUSE_DEPOT`, `piece.id` = `accuseId` ; un accusé par référence seule
    n'émet rien) et, quand 336 la lira, d'une validation du client **dont la référence est une pièce de la GED**
    (`VALIDATION_CLIENT`, `pieceGed { pieceId, version, sha256 }`, un fait par obligation validée ; une référence libre
    n'émet rien). **Schéma, à recopier à l'octet** : `prospera-ocr-service` `dev`,
    `contrat/consommes/fiscal.depot.piece-archivee.v1.json` (sha256 LF `51838a86…3493`) ; à enregistrer au registre comme vos autres
    faits (BACKWARD). Clé de partition `orgId` ; en-têtes `eventId`, `schemaVersion`.
    Requis : `eventId` (uuid), `schemaVersion: 1`, `occurredAt`, `orgId`, `dossierId`, `obligationId`, `depotId` (24 hexa
    minuscules), `implantationId`, `redevableId` (`^[A-Za-z0-9_-]{1,64}$`), `taxe` (`^[A-Z][A-Z0-9_]{0,39}$`), `periode`
    (`AAAA`, `AAAA-MM`, `AAAA-Tn`, `AAAA-En`), `numero` (≥ 1), `nature`, `date` (`AAAA-MM-JJ` : jour du dépôt engagé, de
    l'accusé, de l'accord) ; `piece { id, sha256, taille, type, nom }` (sha256 = **64 hexa sans le préfixe `sha256:`** ;
    taille ≤ 15 728 640 ; type ∈ PDF, PNG, JPEG, XML, XLSX, JSON — celui lu dans les octets) **ou** `pieceGed`, jamais les
    deux, jamais rien d'autre (ni signataire, ni auteur, ni texte libre : `additionalProperties: false`).
  - **(b) la route de service** **`GET /api/v1/service/organisations/{orgId}/pieces-depot/{nature}/{pieceId}`**
    (`nature` : `LIVRABLE_DEPOSE` | `ACCUSE_DEPOT`) : `Authorization: Bearer <jeton>` reconnu dans
    **`JETONS_DE_SERVICE=document-service:<jeton>`** (32 caractères au moins, empreinte seule gardée : le patron de
    `prospera-notification-service`, STORY-589), aucun jeton d'utilisateur, aucun droit ; **200** = les octets exacts
    (`application/octet-stream`, `X-Empreinte-Sha256`), l'objet **relu et re-haché** avant (682) ; **404
    `PIECE_INTROUVABLE`** (inconnue, autre organisation, nature qui ne va pas, accusé sans pièce) ; **502
    `FICHIER_ARCHIVE_ALTERE`** ; **401 `JETON_DE_SERVICE_REQUIS`**. Côté GED : `FISCAL_SERVICE_URL`
    (`http://fiscal-service:3012`), `FISCAL_JETON_SERVICE` (le même jeton), `FISCAL_SERVICE_DELAI_MS` (15 000).
  - **Ce que la GED fait** (sans rien attendre de plus) : copie au fonds ouvert du dossier dont la période couvre le
    premier jour de la période fiscale (sinon le plus récent ouvert ; sans fonds, elle attend et se range à l'ouverture),
    `DECLARATION_FISCALE` ou `ACCUSE_DEPOT` (plan 2026.3), à contrôler ; la validation rattachée à la pièce de la GED ;
    idempotente sur `orgId` + `obligationId` + `numero` + `nature` ; une panne de votre route **relit le message** (le
    groupe `ged.fiscal` passe « bloqué » au troisième échec) ; un 404, un 502 altéré ou d'autres octets font attendre,
    avec la raison. La lecture : `GET /api/v1/ged/cabinet/dossiers/{dossierId}/pieces-fiscales?obligationId=…` (au jeton
    du membre, `ged:piece:consulter`), que 336 peut lire. Quand votre schéma est publié, B recopie votre octet (le même
    texte attendu). Votre ligne peut passer à « servie côté B ; à écrire côté fiscal ».
- **→ C (27/11, ordre « i », sixième suite de STORY-979) : servie par catalogue #88** (`e528afc` sur `dev` ; annonce :
  stories #1018) — votre demande « recopier au catalogue le manifeste `comptabilite` 0.6.0 » : `copies.json` depuis
  `prospera-stories@c926f55` (votre source `0acfd14`, inchangée depuis), avec `ged` 1.11.0 ; droits inchangés. **Et
  information (h)** : `prospera-fiscal-service`, votre dépôt, portera une route de service et un fait neufs, écrits par D
  dans son dossier `depots` (voir « → D » ci-dessus) ; la route de la GED que la comptabilité lit (`GET
  …/ged/cabinet/pieces/{pieceId}/versions/{version}`) n'a pas changé. Votre ligne peut passer à « servie ».
- **← C (27/11, STORY-338) : recopier `comptabilite` 0.6.0 au catalogue** — **reçue, placée par la session de groupe en
  ordre « i »** (D-L7B-13). **Servie le 27/11 par catalogue #88** ; voir « → C (27/11, ordre « i ») » ci-dessus.
- **← D (26/11, STORY-335) : recevoir dans le fonds d'archives du client les pièces du dépôt d'une déclaration** —
  **reçue, placée par la session de groupe en ordre « h »** (D-L7B-12, suite de STORY-1124). **Servie côté GED le 27/11
  par document-service #42** ; voir « → D (27/11, suite « h » de STORY-1124) » ci-dessus.

- **→ D (26/11, cinquième suite de STORY-979) : servie par catalogue #83** (`ce8cbc0` sur `dev` ; annonce : stories #980)
  — votre demande « → B (2026-11-26, STORY-1141) : recopier le manifeste `paiement` 1.2.0 au catalogue » : `copies.json`
  depuis `prospera-stories@59ed625` (votre source de `6a5d3ab`, sha256 `d247fcc9…bdca9`, inchangée), après la fusion de
  votre code (#126) ; `paiement` 1.1.0 → **1.2.0** ; `PUT …/numero-imprimable` hors `routesLectureSeule` ; faits, droits
  et routes de lecture inchangés, auth inchangé. La copie entière porte aussi `ged` 1.10.0 (« f », de B). Un catalogue
  déjà semé la reçoit à son prochain démarrage. La note « manifeste paiement 1.1.0 » de
  `prospera-plateforme/contrats/distributeur/catalogue-faits.json` reste à vous (votre dossier ; aucune garde ne la lit).
  Votre ligne peut passer à « servie ».
- **← D (26/11, STORY-1141) : recopier le manifeste `paiement` 1.2.0 au catalogue** — **reçue, placée par la session de
  groupe en ordre « g »** (D-L7B-11, cinquième suite de STORY-979). **Servie le 26/11 par catalogue #83** (`ce8cbc0` sur
  `dev`) ; voir « → D (26/11, cinquième suite de STORY-979) » ci-dessus.
- **→ C (26/11, suite de STORY-1119) : servie par document-service #40** (`5d060aa` sur `dev` ; annonce : stories #976)
  — votre demande « → B (2026-11-26, STORY-324) : la pièce de validation du client dans la GED ».
  - **(1) La nature** : `VALIDATION_CLIENT` « Validation du client » au plan du cabinet `2026.2` (`ANNUEL` / `FISCAL`,
    exercice exigé, non sensible, 10 ans après la fin de l'exercice), servie à **tous** les fonds, ceux déjà ouverts
    compris. Un cabinet qui l'avait créée lui-même par `POST …/natures` garde la sienne (sa rubrique, sa sensibilité, sa
    conservation) ; sous un autre code, sa nature reste aussi. Déposer : `POST /api/v1/ged/cabinet/pieces` avec `nature:
    VALIDATION_CLIENT` et `exercice`.
  - **(2) La lecture** : `GET /api/v1/ged/cabinet/pieces/{gedPieceId}/versions/{gedVersion}`, au jeton du membre
    (`ged:piece:consulter`, portée du dossier) → `{ pieceId, version, versionCourante, courante, empreinte, taille,
    typeContenu, nature, dossierId, fondsNumero, deposeLe, etatAntivirus, etat, destruction?, desinscription? }`.
    `empreinte` : 64 hexadécimaux minuscules, le format de `ged.piece.recue` (comparez à votre `sha256:<hex>` sans le
    préfixe). Jamais le contenu, le texte lu, le nom du fichier ni l'index. Une pièce **détruite** (destruction visée et
    accordée) ou **retirée** (écriture désinscrite) se lit encore : `200`, `etat: DETRUITE` avec `{ numero, le,
    procesVerbal }`, ou `RETIREE` avec `{ ecritureId, le }` ; l'empreinte reste. `404 PIECE_INCONNUE` pour une pièce
    inconnue, hors portée, d'un autre cabinet ou d'une nature sensible sans `ged:sensible:consulter` ; `404
    VERSION_INCONNUE`. Décisions : fiche `STORY-1119.md`, D-1119-19 → 26. Votre ligne peut passer à « servie ».
- **← C (26/11, STORY-324) : la nature « validation du client » et la lecture d'une version par sa référence** —
  **reçue, placée par la session de groupe en ordre « f »** (D-L7B-10, suite de STORY-1119). **Servie le 26/11 par
  document-service #40** (`5d060aa` sur `dev`) ; voir « → C (26/11, suite de STORY-1119) » ci-dessus.
- **→ D (26/11, suite de STORY-953) : servie par plateforme #41** (`d68a468` sur `dev`, étiquette
  **`contrats-instance-v1.1`**) — votre demande « → B (2026-11-26, STORY-1140) : publier le contrat de l'export C13 en CSV
  dans `prospera-plateforme/contrats/instance/` ». Chemins : `contrats/instance/export-c13-reponse.schema.json`
  (`export-c13-reponse@1`, le JSON : le nom que vous proposiez), `contrats/instance/export-c13-csv.cas.json` (les règles
  du CSV et huit cas, documents → texte exact du fichier), `contrats/instance/instance-c13.openapi.json` 1.1.0 (la route
  `GET /api/v1/instance/{code}/{organisationId}/export`, `format`, `objet`, `Cache-Control: no-store`, refus dans votre
  ordre). Votre forme, à un détail près : `organisationId` garde la forme générique des autres contrats (1 à 64
  caractères) plutôt que 24 hexadécimaux, que vos valeurs tiennent (D-953-11). Les huit cas passent à l'octet contre
  `export-csv.ts` de `MNV-1140` (`e13d874`) et de balance (`44be0c1`) : bilan s'y range déjà ; la recopie à l'octet
  (`git -c core.autocrlf=false show contrats-instance-v1.1:contrats/instance/<fichier>`) reste la vôtre. Votre ligne peut
  passer à « servie ».
- **← D (26/11, STORY-1140) : publier le contrat de l'export C13 dans `prospera-plateforme/contrats/instance/`** —
  **reçue, placée par la session de groupe en ordre « e »** (D-L7B-9, suite de STORY-953). **Servie le 26/11 par
  plateforme #41** (`d68a468` sur `dev`) ; voir « → D (26/11, suite de STORY-953) » ci-dessus.
- **→ C (25/11, correctif de STORY-100) : servie par recette #33** (`9ca8abc` sur `dev`) — votre demande « → B
  (2026-11-25, STORY-1019) : la recette `atelier-balance` doit octroyer `conseil` au cabinet » :
  `octroyer(cabinet, 'conseil', [SYSCOHADA])` après `balance` ; le premier test attend que la porte du conseil s'ouvre ;
  un test neuf exige `403 CONSEIL_NOT_ENTITLED` du voisin (`balance` sans `conseil`) sur `GET`/`POST …/fiscal/scenarios`
  et `GET …/fiscal/dossier-justification`. Sur une pile neuve depuis `origin/dev` (balance `ab4e468`) : 52/52 ;
  `cabinet-moteur` verte (FR-6 intact). Aucune autre suite n'appelle ces routes. Vos deux options : `conseil` dans
  `INSTALLATION_SERVICES` attend STORY-1129 (il change `cabinet-moteur` et `abonnement`, D-100-4) ; `INSTANCE_ESPACE`
  du balance de la recette suit déjà `RECETTE_ESPACE` (une pile en `ESSAI` a un balance d'essai, aucun KYC à semer ;
  D-100-5). Pour rejouer l'Atelier : `npm run recette -- atelier-balance`. Votre ligne peut passer à « servie ».
- **← C (25/11, STORY-1019) : `atelier-balance` doit octroyer `conseil` au cabinet** — **reçue, placée par la session
  de groupe en ordre « d »** (D-L7B-8, correctif de STORY-100). **Servie le 25/11 par recette #33** (`9ca8abc` sur
  `dev`) ; voir « → C (25/11, correctif de STORY-100) » ci-dessus.

- **→ C (25/11) : servie par catalogue #76** (`66a4f6c` sur `dev` ; quatrième suite de STORY-979 ; annonce : stories
  #913) — votre demande « → B (25/11, STORY-1020) : recopier au catalogue le manifeste `balance` 1.2.0 » : `copies.json`
  depuis `prospera-stories@ac8e450`, après la fusion de votre code (balance-service #165) ; `balance` 1.1.0 → **1.2.0**,
  `GET /api/v1/dossiers/{dossierId}/rapprochement/etat/export` en `routesLectureSeule` ; vos dix droits inchangés, auth
  inchangé ; aucun autre manifeste ne bouge. `manifestes:garde` contre `main` est de nouveau verte. Un catalogue déjà
  semé la reçoit à son prochain démarrage. Votre ligne peut passer à « servie ».

- **→ C (25/11, correctif de STORY-1115) : servie par recette #32** (`cd62296` sur `dev` ; annonce : stories #907) —
  votre demande « → B (25/11, STORY-326, puis 1101) : republier le paquet togo@2026 dans les deux buckets ».
  - **Qui publie** : le catalogue lui-même, par sa route de dépôt (STORY-149). Il écrit l'objet dans son bucket et
    joint `artifactUri` et `checksum` à `entitlement.changed` (c'est le pointeur que lit le fiscal).
  - **Qui dépose** : dans la pile, désormais `src/paquets-fiscaux.ts` de la recette, avec les octets de
    `balance-service` :
    - au réel : `npm run pile` quand `RECETTE_SURCOUCHES` porte `docker-compose.fiscal.yml` ;
    - à l'essai : les recettes qui le lèvent ;
    - à la main : `npm run paquets-fiscaux -- reel|essai`.
  - **Ce que vous pouvez vérifier** :
    - sur une pile neuve qui porte le fiscal, `GET /api/v1/catalog/admin/referentiels` (jeton de la console) rend
      `fiscal-tg-entreprise@2026.1` en `sha256:5c683d16…`, sous `s3://referentiel-packages/…` au réel (`:3003`) et
      sous `s3://referentiel-packages-essai/…` à l'essai (`:3023`) ;
    - `npm run recette -- zone-franche` joue votre contrôle : une TVA déclarée rend `statut: ECART`, `tolerance: 1000`,
      et plus `NON_EXECUTE` `TOLERANCE_ABSENTE` ;
    - un gate de C qui lève le fiscal par `docker compose` sans le paquet de recette joue
      `npm run paquets-fiscaux -- reel` après l'amorçage ;
    - un paquet changé sous la même version sur des volumes conservés est refusé `PERIME` : `down -v`.
  - **Pour vous, hors de la pile** : le paquet a changé trois fois sous `2026.1`. Un environnement où `2026.1` est déjà
    publiée demandera une `2026.2`, que le catalogue devra connaître (`PAQUETS_FISCAUX_PACKAGES`) : à décider avec vous
    à la mise en service.
  - Votre ligne peut passer à « servie ».

- **→ A (25/11, correctif de STORY-917) : servie par admin-panel #44** (`0dfcf43` sur `dev` ; annonce : stories #901)
  — votre demande « → B (25/11, AP-55) : autoriser `Idempotency-Key` dans le CORS du BFF `admin-panel` » : le
  préflight annonce désormais `Authorization,Content-Type,If-Match,Idempotency-Key,X-Request-Id` ; `Retry-After` (le
  `429` du BFF lui-même) est lisible par `response.headers.get` ; rien d'autre n'était refusé (inventaire, D-917-6). Rien
  à régénérer. La console peut remettre `Idempotency-Key` dans `installation-client.ts`. Votre ligne peut passer à
  « servie ».

- **→ D (25/11, correctif de STORY-1073) : servie par dossier-service #59** (`645a699` sur `dev` ; annonce :
  stories #895) — votre demande « → B (2026-11-25, STORY-1077) : publier `formeJuridique` sur les dossiers CLIENTS
  aussi » : `ficheLegalePubliee` la publie sur tout dossier, telle qu'elle est stockée (`AUTRE` compris, D-1073-14) ; les
  huit autres champs restent au dossier propre ; `DossierEtatV1` et `schemaVersion` inchangés. Un dossier client la
  porte dès son prochain `dossier.*` ; pour les dossiers déjà projetés, `npm run republier:dossiers` (aucune pile semée
  sur ce poste : rien n'a été rejoué ici, D-1073-15). Rien à changer côté bilan. Votre ligne peut passer à « servie ».

- **→ D (25/11) : servie par catalogue #75** (`0425fef` sur `dev` ; troisième suite de STORY-979 ; annonce : stories
  #891) — votre demande « → B (2026-11-25, STORY-1073) : recopier au catalogue deux manifestes » : `copies.json`
  depuis `prospera-stories@bd9340e` ; **`facturation` 1.2.0** (empreinte `b7b9e0c8…`, la vôtre) et **`paiement`
  1.1.0** ; aucun droit ne change, auth inchangé. Un catalogue déjà semé les reçoit à son prochain démarrage, à côté des
  versions publiées. Votre ligne peut passer à « servie ».
- **→ C (25/11) : servie par catalogue #75** (`0425fef` sur `dev`) — votre demande « → B (25/11, STORY-1117) : recopier
  au catalogue le manifeste `balance` 1.1.0 » : entrée avec la copie entière de `bd9340e` (`GET …/balances/reference`,
  `…/balances/resumes`). Votre ligne peut passer à « servie ». La **1.2.0** (STORY-1020) n'est pas copiée tant que son
  code n'est pas fusionné (D-979-24) : demandez-la ici après la fusion ; d'ici là, `manifestes:garde` contre `main`
  est rouge sur `balance` seul.

- **← A (25/11, AP-55) : autoriser `Idempotency-Key` dans le CORS du BFF `admin-panel`** — **reçue, placée par la
  session de groupe en ordre « c′ »**, avant c (D-L7B-7) : correctif rattaché à STORY-917. **Servie le 25/11 par BFF
  #44** (`0dfcf43` sur `dev`) ; voir « → A (25/11, correctif de STORY-917) » ci-dessus.
- **← D (25/11, STORY-1077) : `formeJuridique` sur les dossiers CLIENTS aussi** (`dossier-service`) — **reçue pendant
  STORY-1116**, placée par la session de groupe en **ordre « b » du lot 7** (D-L7B-2) : un correctif rattaché à
  STORY-1073 (D-1073-2 a posé la condition « dossier propre »), le seul champ sorti de la condition, puis
  `npm run republier:dossiers` ; aucun schéma ne change. **Servie le 25/11 par dossier-service #59** (`645a699`
  sur `dev`) ; voir « → D (25/11, correctif de STORY-1073) » ci-dessous.
- **← C (25/11, STORY-326, puis 1101) : republier `togo@2026` (`5c683d16…`) dans les deux buckets de la recette** —
  **reçue, placée par la session de groupe en ordre « c »** (D-L7B-6, correctif de STORY-1115). **Servie le 25/11 par
  recette #32** (`cd62296` sur `dev`) ; voir « → C (25/11, correctif de STORY-1115) » ci-dessus.
- **← C (25/11, STORY-1020) : recopier `balance` 1.2.0 au catalogue** — **reçue, placée par la session de groupe** en
  quatrième suite de STORY-979, servie dès la fusion du code de C (D-L7B-6). **Servie le 25/11 par catalogue #76**
  (`66a4f6c` sur `dev`) ; voir « → C (25/11) : servie par catalogue #76 » ci-dessus.
- **← C (25/11, plan de B #848) : `document-service` passe à B au lot 7** — **lue** (dernier commit de C `0716a58`,
  rien en cours).
- **← D (24/11, STORY-1072) : `ESPACE_KYC_URL` sur expert-comptable** — **lue** : la recette ne lève pas
  `expert-comptable` ; à poser par la recette qui jouera l'e-mail du renvoi.

- **→ C (24/11) : servie par catalogue #74** (`1aa17ae` sur `dev` ; seconde suite de STORY-979 ; annonce : stories
  #843) — vos demandes « → B (24/11, STORY-1087, 1088 puis 1100) » et « → B (24/11, STORY-1100) » : `copies.json`
  depuis `prospera-stories@f703671` ; **`ged` 1.3.0** (la 1.2.0 n'est jamais semée) et **`comptabilite` 0.5.0** ; seuls
  ces deux manifestes changent ; `manifestes:garde` verte (48). Vos deux lignes peuvent passer à « servie ». Deux
  informations : (1) les treize `ged:*` de la 1.0.0 qui désignent les rôles de l'assurance (`ged:piece:recevoir`,
  `…:controler`, `…:rattacher`, `ged:fonds:verser`, `…:sceller`, `…:verifier`, `ged:papier:sortir`,
  `ged:dossier:reconstituer`, `ged:destruction:proposer`, `…:viser`, `ged:sante:consulter`,
  `ged:parametre:administrer`, `ged:journal:consulter`) ne sont pas au catalogue de tenant d'auth : auth n'a pas de
  rôles de l'assurance et aucune garde de `document-service` ne les lit aujourd'hui ; ils entreront avec la table
  d'accès de ce métier (D-979-19). Dites-le ici si une route de `ged` doit les lire avant. (2) `comptabilite.facture.inscrite`
  est écrit sans `@1` dans les deux manifestes (le schéma le permet ; vos deux services le publient et le lisent sous
  ce nom) : sans effet au catalogue, à votre choix pour une prochaine version.

- **→ A (2026-11-24) : l'administrateur du prospect entre dans l'essai — servi par la suite de STORY-1112** (BFF #43
  `911c450`, catalogue #73 `0894425`, auth #50 `d69e34c`) : types à régénérer depuis l'OpenAPI du BFF. Pour AP-57
  (lot 7) : `POST /api/v1/admin/essais` accepte `identiteAdministrateur { prenom, nom, roleMetier? }` (facultatif ;
  absent : « Administrateur » et le nom du prospect) ; chaque `EssaiDto` porte `invitationAdministrateur { userId, etat,
  le?, code?, motif?, interceptionId? }`. `ENVOYEE` : son lien est parti ; `INTERCEPTEE` : son adresse n'est pas dans la
  liste blanche de l'essai — la mettre (adresse ou `*@domaine`) par `POST /admin/sorties-essai/liste-blanche`, puis
  rejouer `POST /admin/essais` (même ordre, 200) ; `A_REPRENDRE` : rejouer ; `REFUSEE` : `code` (ex.
  `TENANT_ROLE_NON_PROPOSE`). La maquette validée ne porte que le courriel : à amender avant le code. Preuve : la recette
  `essai-mise-en-service` (8/8), qui joue ce chemin par le BFF.
- **← D (24/11, information) : STORY-1072 livrée** (notification #92, expert-comptable #11 ; l'AC-5 de 1103 vu dans
  mailhog) — reçue ; la demande « → D : consommer `kyc.correction.requested@1` » reste écrite telle quelle, sa clôture
  revient à la session de groupe.

- **← D (25/11, STORY-1073) : recopier au catalogue `facturation` 1.2.0 et `paiement` 1.1.0** (journal de D, « → B
  (2026-11-25, STORY-1073) » ; source prospera-stories `main` **`bd9340e`**, #845 ; empreinte de `facturation`
  `b7b9e0c8…`). `facturation` consomme `dossier.created`, `dossier.updated`, `paiement.compte.changed@1` ; `paiement`
  publie `paiement.compte.changed@1` ; aucun droit, aucune route. — **reçue le 25/11 pendant STORY-1116, placée par la
  session de groupe juste après 1116** (troisième suite de STORY-979, sans Docker, même patron que catalogue #71 et
  #74) : 1116 modifie le catalogue en ce moment, la recopie attend sa fusion. Puis le consommateur de
  `facturation.avoir.emis@1` dans `paiement`. **Servie le 25/11 par catalogue #75** (`0425fef` sur `dev` ; lot 7 de
  B, ordre « a » ; annonce : stories #891) ; voir « → D (25/11) » ci-dessus.

- **← C (24/11, STORY-1088 puis STORY-1100) : recopier au catalogue `ged` (désormais 1.3.0, après 1.2.0) et
  `comptabilite` 0.5.0** (journal de C : « → B (24/11, STORY-1087 puis 1088) » et « ⚠ Contrats » de 1100 ; `main`
  `f703671`, `a525d766`) — **reçue le 24/11 pendant la suite de 1112, à placer par la session de groupe** (recommandé :
  une suite de STORY-979, copies de manifestes sans Docker, avant ou juste après 1116 ; la 1.2.0 n'a pas à être semée
  seule). Non servie ici : hors du ticket placé. **Placée par la session de groupe le 24/11 au soir : maintenant,
  avant STORY-1116, en seconde suite de STORY-979** (aucun identifiant neuf ; D-979-17). **Servie par catalogue #74**
  (`1aa17ae` sur `dev` ; annonce : stories #843) ; voir « → C (24/11) » ci-dessus.

- **← A (24/11) : servis par bilan #184 et #185** (`d98b7c4` et `7b53ff5` sur `dev` ; correctifs de STORY-483 et de
  STORY-065, annonce stories #802) — les deux résultats faux de `bilan-service` visibles à la démo du 15/01 :
  `TICKET-BACKEND-projection-remboursements-non-plafonnes.md` (remboursements plafonnés à l'encours, avertissement
  nommé) et `TICKET-BACKEND-liasse-rouverte-version-null.md` (version de la liasse rouverte), **fermés**. Voir « → A ».
- **← D (24/11) : (1) et (2) servis par auth #49, catalogue #71 ; (3) placé après le lot 6** (STORY-1066 de D ;
  suite de STORY-979, annonce : stories #789). (1) `facturation:avoir:valider` au catalogue de tenant d'auth, hors du
  jeton, au **`DIST_DAF` seul**, libellé « Valider un avoir au-delà du seuil » (`b49d8ab` sur `dev`) ; servi par
  `GET /moi/droits` dans `droitsHorsJeton`, pas d'avance de `dv` (60 s de cache au plus). (2) `copies.json` depuis
  `prospera-stories@24049e4`, `facturation` 1.1.0 (`de988b1` sur `dev`), `manifestes:garde` verte ; ses huit droits
  sont ceux d'auth. (3) Le consommateur de `facturation.avoir.emis@1` dans `paiement` : **ouverte**, story neuve de B
  **après les sept stories du lot 6**, identifiant réservé à l'écriture de sa fiche (D-979-14 ; « État », lot 6). D
  prévenue directement (session du groupe D).

- **← A (2026-11-24) : STORY-1114, `vertical` dans `GET /admin/orgs`, `GET /admin/orgs/{id}` et un filtre ; relais de
  `GET /admin/verticaux` et `PATCH /admin/organizations/{id}/vertical` ; refus par leur code** — **servie par
  STORY-1114** (BFF #41). Avec la demande du 19/11 (tri du bloc C d'AP-54 : « le champ `vertical` dans `/admin/orgs` »).
  Le changement est servi au BFF sous **`PATCH /admin/orgs/{orgId}/vertical`** (la famille des actions d'une
  organisation au BFF ; `admin/organizations` n'y existe pas, D-1114-3).
- **→ A (2026-11-24) : AP-59 débloquée par STORY-1114** (BFF #41 `3a5f5ef`) : types à régénérer depuis l'OpenAPI du
  BFF. Routes : `GET /api/v1/admin/orgs?vertical=<code>` (chaque ligne : `vertical?`, absent seulement avant migration ;
  inconnu : 400 `VERTICAL_INCONNU`, vide : 400 `VERTICAL_REQUIS`) ; `GET /api/v1/admin/orgs/{orgId}`
  (`identity.vertical`) ; `GET /api/v1/admin/verticaux` (`org:read`, `VerticauxDto { verticaux: [{ code, libelle, statut,
  inscriptionOuverte, description? }] }`, dans l'ordre d'auth ; **`statut` en minuscules, `actif` | `a_venir`**, pas
  `ACTIF` comme dans la maquette ; `plateforme` y figure, l'écran ne le propose pas) ; `PATCH
  /api/v1/admin/orgs/{orgId}/vertical` (`entitlement:grant`, `{ vertical, reason? }` ; rend l'identité de la fiche avec
  le métier changé ; 409 `VERTICAL_ROLES_INCOMPATIBLES` avec `details.roles`, les rôles à réattribuer d'abord ; 404
  organisation inconnue). Preuve : appel réel au BFF contre une doublure HTTP aux corps produits par le code d'auth
  (fiche STORY-1114, « Preuves ») ; le gate réel d'AP-59 sera le premier contre un vrai auth.
- **→ A (2026-11-24) : AP-62 débloquée par STORY-1103** (kyc #29 `9cef9cb`, BFF #42 `c451b17`) : types à régénérer
  depuis l'OpenAPI du BFF. Routes : `POST /api/v1/admin/orgs/{orgId}/kyc/documents/{documentId}/reject` avec le corps
  facultatif `{ motif? }` (500 au plus ; la réponse porte `motifRenvoi`) ; **`POST
  /api/v1/admin/orgs/{orgId}/kyc/request-correction`** (`kyc:reject`, `If-Match` = l'`etag` du détail, `{ message? }`
  1 000 au plus) → `{ orgId, status: PENDING_DOCUMENTS }` ; refus 409 `RENVOI_SANS_PIECE_A_CORRIGER` (aucune pièce
  marquée à corriger), 409 `KYC_DECISION_CONFLIT` avec `details` (comme `reject` ; la décision gagnante peut être un
  renvoi, `verdict: PENDING_DOCUMENTS`), 428, 400. Détail (`GET /api/v1/admin/orgs/{orgId}`, bloc `kyc`) : chaque
  pièce porte `reviewStatus`, `reviewedAt?`, `motifRenvoi?` ; le dossier `correctionDemandeeLe?` ; la chronologie
  l'entrée `RENVOI_CORRECTION` avec `message?`, `texte` (ce que le cabinet a lu) et `piecesRenvoyees`. Le texte composé
  suit la règle de la maquette (le mot, puis `— <libellé> : <motif>`), plus `— <libellé>` pour une pièce sans motif.
  Preuve : appel réel au BFF (vrai client de kyc en HTTP) contre une doublure aux corps produits par le code de kyc de
  la story (`test/fixtures/kyc-renvoi/`) ; le gate réel d'AP-62 sera le premier contre un vrai kyc.
- **← A (2026-11-19, tri du bloc C d'AP-54) : relayer `mises-en-service`, `sorties-essai`, `naissances` (AP-56)** —
  **servie par STORY-1113** (catalogue #72, BFF #40). La naissance est relayée seule, au réel, avec l'identité de
  l'essai ; la mise en service reprend les membres de l'essai ; `POST /sorties-essai/{org}/verifier` n'est pas relayée
  (route des modules, sous leur identité de service) : le catalogue sert à la place une vérification pour la console,
  sans journal (D-1113-5, D-1113-6).
- **→ A (2026-11-24) : AP-56 débloquée par STORY-1113** (catalogue #72 `45971cf`, BFF #40 `25aed19`/`dcd76df`) :
  types à régénérer depuis l'OpenAPI du BFF quand l'écran viendra (maquette d'abord, aucune encore). Routes :
  `GET /admin/naissances/{orgId}` (`NaissancesDto` : `essai?`, `reel?`), `POST /admin/naissances` (`{ organisationId }`
  seul après un essai : l'identité est reprise ; 422 `PROSPECT_SANS_NAISSANCE_D_ESSAI` ; 409 `NAISSANCE_DIVERGENTE`
  avec `details.champs`) ; `GET /admin/mises-en-service/{orgId}/invites` (« les invités repris », `ecartes`), `POST
  /admin/mises-en-service/{orgId}` (`{ modules, reprendreLesMembres? }` ; 404 `ORGANISATION_INCONNUE` avant la
  naissance au réel ; 409 `MISE_EN_SERVICE_*` avec `details.modules` pour « ceux qui ne le sont pas disent pourquoi » ;
  `invitations.etat` `ENVOYEES` | `A_REPRENDRE` | `REFUSEES`), `GET …/{orgId}` (bilans) ; `GET|POST
  /admin/sorties-essai/liste-blanche`, `DELETE …/{id}` (l'`id` encodé), `POST …/liste-blanche/verification`, `GET
  /admin/sorties-essai/{orgId}/interceptions` (`origine`). Ordre proposé à l'écran : signer (AP-57) → naître au réel →
  installer l'offre (AP-55) → mettre en service. **Pour AP-55** : les refus du moteur d'installation portent désormais
  `details.modules`, `details.refus`, `details.planId` (ils n'arrivaient pas : D-1113-10), là où `grant-errors.ts` les
  lit déjà. Preuve : appel réel au BFF sur une pile à deux espaces, 47/47 (fiche STORY-1113, « Preuves »).
- **← A (2026-11-24) : STORY-1112, relayer `/essais` et ajouter une liste ; recommandé `POST /admin/essais` qui
  enchaîne la naissance et l'ouverture avec le jeu du métier** — **servie par STORY-1112** (catalogue #70, BFF #39).
  Les deux lectures manquantes (liste, jeux chargés) sont servies par le catalogue (D-1112-1) ; le jeu du métier est
  choisi par le BFF (D-1112-4) ; `commercial` est exigé dans l'ordre (le jeton de l'opérateur ne porte pas son
  adresse, la console la connaît : « Suivi par vous »).
- **→ A (2026-11-24) : AP-57 débloquée par STORY-1112** (catalogue #70 `706f1b8`, BFF #39 `3071886`) : régénérer les
  types de la console depuis l'OpenAPI du BFF (`/api/v1/admin/essais`, `EssaiDto`, `EssaisDto`, `EffacementDto`,
  `OuvrirEssaiRequestDto`) ; l'organisation d'un prospect neuf est choisie UNE fois par la console (24 hexadécimaux,
  gardée pour le rejeu) ; la table des refus de la maquette se branche sur `code` (`JEU_DEMONSTRATION_ABSENT` en
  plus) ; la prochaine action d'une ligne se calcule depuis `finLe`, `effacementLe`, `prolongations`, `statut`. Preuve :
  appel réel au BFF contre le vrai catalogue sur une pile `grp-b`, 38/38 (fiche STORY-1112, « Preuves »).

- **← A (2026-11-24) : AP-55, relayer `GET /etat-publie/{org}` en lecture pour `org:read`** — **servie par STORY-1080**
  (catalogue #67, BFF #38). La route du contrat ne peut pas être relayée telle quelle : elle refuse tout appelant qui
  n'est pas membre de l'organisation (`ORGANISATION_HORS_JETON`, contrat figé). Le catalogue sert donc une route de la
  console (même calcul, sans `utilisateur`), et le BFF la relaie en `GET /admin/orgs/{orgId}/etat-publie` (« → A »).
- **← A (2026-11-21, STORY-1094) : recopier le manifeste `comptabilite` au catalogue** — **servie** par la session de C
  à la demande de l'utilisateur (catalogue `eb495b5` et `acfb751`, manifeste 0.4.0, `manifestes:garde` verte), constatée
  par STORY-1080 sur `origin/dev`. Rien à faire de plus.
- **← A (24/11) : servie par bilan #183** (`2364abc` sur `dev` ; correctif de STORY-1084, annonce stories #783) —
  deux `ValeurIndicateurDto` dans bilan, l'OpenAPI des indicateurs de dette faux
  (`tickets/TICKET-BACKEND-financement-schema-valeur-indicateur.md`, **fermé**). `IndicateurDetteDto.valeurs` publie
  `ValeurIndicateurDetteDto` `{ rang, exercice, statut, valeur, motif }` ; le garde demandé est écrit et a trouvé trois
  autres doublons, corrigés aussi (« ⚠ Contrats »). Voir « → A ».
- **← D (24/11) : `facturation:parametres:modifier` au catalogue de tenant d'auth (DAF) et recopie du manifeste
  `facturation`** (STORY-1065) — **servie par STORY-979** (auth #48, `c0f6243` sur `dev` ; catalogue #68, `d7e67f1` ;
  annonce : stories #777). Hors du jeton, servi par `GET /moi/droits` dans `droitsHorsJeton` ; au **`DIST_DAF` seul**
  (libellé « Modifier les paramètres de la facture ») ; pas d'avance de `dv` (60 s de cache au plus). `copies.json`
  depuis `prospera-stories@1561370`, `manifestes:garde` verte. D prévenue directement (session du groupe D). Information
  (D-979-7) : votre manifeste est resté en 1.0.0 ; voir « → D ».
- **← C (24/11) : le rôle `CAB_ARCHIVISTE` et les droits `ged:*` des rôles du cabinet dans auth** (STORY-1087) —
  **servie par STORY-979** (auth #48, `c0f6243` sur `dev` ; annonce : stories #777). La matrice §2.3 à la lettre :
  `CAB_ASSOCIE` ← `ged:fonds:gerer`, `ged:piece:consulter`, `ged:sensible:consulter` ; `CAB_COLLABORATEUR` ←
  `ged:piece:consulter` ; `CAB_ARCHIVISTE` (rôle neuf du socle, vertical `cabinet`, couverture `partiel`) ← les sept,
  aucun droit d'un autre module. Il n'est le rôle par défaut de personne : l'administrateur du cabinet l'attribue
  (`tenantRole`). Les codes sont ceux de votre `DROITS_GED` et de la 1.1.0, à l'octet.
- **← C (24/11) : recopier le manifeste `ged` 1.1.0 au catalogue après la fusion** (STORY-1087) — **servie par
  STORY-979** (catalogue #69, `b75e34b` sur `dev` ; amendement annoncé : stories #778) : `copies.json` depuis
  `prospera-stories@4fab396`, seul `ged` change (1.0.0 → 1.1.0), `manifestes:garde` verte (48).

- **← D (2026-11-18, STORY-1064) : `comptes` dans `jeu-demonstration@1` et la pose des comptes par le catalogue** —
  **lue, gardée pour la remplaçante de B** (D-972-9, plan §3) ; pas dans STORY-975. La forme proposée (un `comptes`
  facultatif à la racine du jeu, `{ fichier, enregistrements, sha256 }`, vérifié comme un objet, posé après l'import
  des parts) convient a priori ; elle sera confirmée ou amendée ici à l'ouverture de la story.
- **← D (2026-11-18, STORY-1063) : la part `reseau` du jeu 1.1.0** — **lue** : le jour où le catalogue monte
  `jeu-grossiste-golfe-v1.1`, `reseau=http://reseau-service:3419` entre dans `INSTALLATION_SERVICES` de l'essai.

- **← D (2026-11-17, STORY-1059) : consommer `facturation.facture.emise@1` dans `paiement`** — **servie par
  STORY-976** (paiement #124, `dev` `4684d22` ; annonce : stories #709). Groupe `paiement-factures`, depuis le début
  du topic : les factures déjà émises ouvrent leur Créance, celles que la route a ouvertes retombent sur leur clé sans
  rien écrire. Une facture `A_OUVRIR` chez vous (paiement arrêté, puis `ventes` redémarré) s'ouvre donc sans membre.
  Charge lue telle que vous l'avez fixée (`montantTtcMineur`, `numero` libellé sans `FAC-`, `livraisonId` `null` ⇒
  absent). Rien à faire chez vous ; la route reste servie. `paiement.creance.changed@1` inchangé. Information
  (D-976-7) : les motifs de votre schéma sont plus larges que ceux de la Créance (`tiersId` avec `:` ou `.`,
  `factureId` qui commence par `_` ou `-`, `livraisonId` avec `:`) : une telle facture serait refusée
  `CREANCE_INVALIDE` par la route comme par le fait.
- **← D (2026-11-18, STORY-1061) : `numero` sans motif `FAC-`** — **lue**, tenue par STORY-976 (le numéro n'est pas
  validé, c'est le libellé).
- **← A (2026-11-18) : réponses de l'utilisateur à nos questions au PO** — **lues**. D-951-8 servie par STORY-974 ;
  **D-961-1 renversée, servie par STORY-973** (comptabilite #11, `dev` `dd3dc52`) ; D-972-6 et D-972-9 acceptées
  (la pose des comptes par le catalogue reste une remplaçante du lot 4) ; 970 : rien ne change.
- **← D (2026-11-18, STORY-1060) : `terrain:parametres:modifier` au catalogue de tenant** — **servie par STORY-977**
  (auth #46, `dev` `682bba4` ; annonce : stories #690). Le code est au catalogue de tenant, **hors du jeton** : servi
  par `GET /moi/droits` dans `droitsHorsJeton`, jamais dans `perms[]`. Rôles par défaut : **`DIST_DG` et
  `DIST_ADMIN`**, eux seuls (`AJOUTS_A_L_ANNEXE_B`, comme `commande:parametres:modifier` ; si le PO répond autrement
  à Q-D-5, les deux lignes se retirent ensemble). Aucun rôle de l'IMF (D-1060-6 : avec la story qui emploie `terrain`
  en microfinance). Aucun `dv` n'avance à la livraison : vos caches `(membre, organisation, dv)` le voient à leur
  terme (60 s au plus). Pour votre recette : `PUT /api/v1/terrain/parametres` doit passer pour un DG ou un
  `DIST_ADMIN` sur une image d'auth reconstruite depuis `dev`. Preuve sans Docker (fiche `stories/STORY-977.md`,
  § Preuves) ; le mécanisme a sa preuve de bout en bout par vrai jeton RS256 à STORY-971.

- **← D (2026-11-17, STORY-1058) : le jeu « Grossiste du Golfe »** — **servie par STORY-972** (fiche
  `stories/STORY-972.md`).
  1. **README** : plateforme #31 (`dev` `a06d8c9`), la ligne des trois dossiers → groupe D, `jeu-grossiste-golfe-v1`.
  2. **`INSTALLATION_SERVICES` de l'essai** : catalogue #60 (`dev` `6e5f052`, `2c3a933`), `.env.essai.example` :
     `commande=http://ventes-service:3412`, `terrain=http://terrain-service:3413` (noms des services de vos compose),
     avec `INSTANCE_ESPACE=ESSAI`. Prouvé : le catalogue de l'essai appelle `terrain-service:3413` pour les
     vérifications de `terrain`. Vos services y tournent avec `INSTANCE_ESPACE=ESSAI` (chez vous).
  3. **Les comptes du jeu (FR-21)** : auth #44 (`dev` `8661bbf`). Le moteur les pose par
     `PUT /api/v1/interne/organisations/{org}/comptes-du-jeu` (`{ comptes: [{ objet, cle, prenom, nom, roleMetier }] }`),
     sous `identifiantDuJeu(org, objet, cle)` — le compte de Kodjo a l'identifiant de votre `commercial` `COM-01`. Le
     prospect passe d'un compte à l'autre par `POST /api/v1/essai/connexion-en-tant-que { compteId }`. Les jeux du
     cabinet et de l'assurance n'avaient rien chez auth (rien à faire « pareil »). **Ce qui reste** : la liste des
     comptes n'est pas dans le jeu ; le catalogue ne pose pas encore les comptes à l'ouverture (D-972-9, voir « → D »).
  4. **Point (4)** : décision D-972-6 (« → D » plus haut).

- **← D (2026-11-17, STORY-1053) : un droit neuf, `commande:parametres:modifier`, au catalogue de tenant** —
  **servie par STORY-971** (auth #43, `dev` `913bd92` ; annonce : stories #656). Le code est au catalogue de
  tenant, **hors du jeton** : servi par `GET /moi/droits` dans `droitsHorsJeton`, jamais dans `perms[]`. Rôles par
  défaut : **`DIST_DG` et `DIST_ADMIN`**, comme demandé, et eux seuls (`AJOUTS_A_L_ANNEXE_B`, à part de la recopie de
  l'annexe B : si le PO répond autrement à Q-D-5, la ligne se retire). Aucun `dv` n'avance à la livraison : vos caches
  `(membre, organisation, dv)` le voient à leur terme (60 s au plus). Preuve sur la pile `grp-b` : un vrai jeton
  RS256 `DIST_DG` obtient le droit par `/moi/droits` (fiche `stories/STORY-971.md`, § Preuves). Pour votre recette :
  `PUT /api/v1/commande/parametres` doit passer pour un DG ou un `DIST_ADMIN` sur une image d'auth reconstruite
  depuis `dev`.
- **← D (2026-11-17, STORY-1055) : `reseau` sur `kit-cible` 1.0.1, D6 et la chaîne** — **lue**. D6 (la version par
  `lotId`) reste ouvert avec D4 → D8 (fiche 956, D-956-7). L'option de profil `chaine.longueur` est notée pour la
  prochaine version du kit, sans urgence.
- **← C (2026-11-16 et 17) : recopier au catalogue les manifestes amendés** (`liaison-assureur`, `assurance`,
  `expertises`, `sinistres`) — **servie par STORY-972** (catalogue #60, `dev` `6e5f052`) : `copies.json` regénéré par
  `manifestes:copier` depuis `prospera-stories@51f4803`, `manifestes:garde` verte (47). Les quatre sont recopiés **à
  leur version 1.0.0** : voir « → C » (D-972-3).

- **← C (2026-11-17, STORY-1006) : les référentiels habilités dans l'état publié ?** — **servie par STORY-1127** (catalogue
  #84, `dev` `efedd3e`, étiquette `contrat-etat-publie-v1.1` ; annonce : stories #992) : `module.referentiels`, la liste de
  `entitlement.changed` v2, à la route et dans `etat-publie.changed@1`. C et D (qui tient `assurance` depuis le lot 6)
  prévenus par message le 26/11. Historique : **lue, prise en charge.** Le choix par défaut de C convient : garder `entitlement.changed` pour le seul champ `referentiels`
  (D-1006-5). Le contrat d'état publié est figé (`contrat-etat-publie-v1`, ajouts facultatifs seuls, BACKWARD) : un
  champ facultatif `referentiels` y entrera par une story de B au catalogue, à placer comme remplaçante du lot 3 ou au
  lot suivant. Elle sera annoncée ici avant sa fusion ; C basculera alors. **Toujours ouverte après STORY-972**
  (D-972-10 : pas « simple » à côté du reste : route, événement, deux schémas, registre, émetteur).

- **← A (2026-11-17, STORY-927) : le jeu du cabinet est dans `jeux-demonstration/cabinet-demo-togo/`** — **servie
  avant STORY-961** (plateforme #26, `dev` `3407408`). (1) La ligne `jeux-demonstration/cabinet-demo-togo/` → groupe
  A est au tableau « Qui écrit dans quel dossier » du README, avec celle du jeu de l'assurance → groupe D (lue plus
  bas). (2) L'étiquette **`jeu-cabinet-v1`** est posée par B sur `e958bd6` (le commit du jeu, comme `jeu-assurance-v1`
  sur celui de D) et poussée : `generateur.source` du `jeu.json` se résout. (3) Le catalogue copiera le dossier
  entier à `JEUX_DEMONSTRATION_DIR` (le vérificateur ignore `generateur/`), à la story qui branchera le jeu du
  cabinet sur l'essai.

- **← D (2026-11-17, STORY-1050) : attribuer les droits `reseau:*` par auth-service** — **servie par STORY-960**
  (auth #42, `dev` `8d48710`). Les cinq `reseau:*` sont dans la table des 15 rôles (détail dans « → D » plus haut),
  servis par `/moi/droits` dans `droitsHorsJeton`. **Écart à la demande** : la table rôle socle (`TENANT_ADMIN` les
  cinq, `TENANT_USER` la consultation) n'est pas reprise ; il faut un rôle `DIST_*` (D-960-12, contestable).

- **← A (2026-11-16, STORY-908) : deux défauts du patron de supervision de 950** — **servie par STORY-957**
  (notification #89 `5e6c553`, paiement #121 `1e90517`, catalogue #59 `5004cc5`). Les deux défauts étaient présents
  à l'octet dans notification et paiement. Le catalogue avait déjà un consommateur neuf par relance, mais il attendait
  la fermeture de l'ancien, et `/health` n'était pas borné. Preuve rejouée comme demandé : Kafka arrêté, service
  redémarré, Kafka relancé, `/health` 200, plus un message consommé. La borne de 5 s ne suffisait pas seule : voir
  « → A » (D-957-6).
- **← A (2026-11-17) : l'origine `comptabilite` est disponible pour B-967** — **lue**, gardée pour STORY-967 (forme
  de `balance.submitted` v1, `sourceSystem` à ajouter à `INGESTION_SOURCE_SYSTEMS`, mouvements de l'exercice
  seulement).
- **← D (2026-11-17) : ce que la bibliothèque d'encours lit de la Créance** — **lue**, gardée pour STORY-963 et 965 :
  état absolu par clé, révision croissante, `statut`, les deux restants, `echeanceLe`, `perimetre`, `devise`, et le
  `solde` du crédit du tiers. Tout écart de `paiement.creance.changed@1` sera dit ici avant la fusion de 965.
- **← D (2026-11-17) : le jeu de l'assurance est dans `jeux-demonstration/`** — **lue**. La ligne
  `jeux-demonstration/assurance-compagnie-demo-reduite/` → groupe D entrera au tableau du README de
  `prospera-plateforme` avec la prochaine story de B qui touche la plateforme.

- **← A (2026-11-16) : relecture de `kit-cible` 1.0.0, « 1.0.1 nécessaire »**
  (`coordination/relecture-kit-cible-1.0.0-groupe-A.md`) — **servie par STORY-956** (plateforme #22, `189183f`,
  étiquette `kit-cible-v1.0.1`).
  - Servis : D1, D2, D3 et les trous de la suite (cloisonnement, atomicité, `rattacherA`, `REFUSE_PAR_LA_CIBLE`,
    `REQUALIFIE`, régime non admis, majeure, `OBJET_INCONNU`, 1 Mio, `controles`, `saisirMontant`).
  - Ouverts : D4 à D8 (fiche 956, D-956-7) ; relecture de la 1.0.1 demandée ci-dessus.

- **← C (2026-11-15) : la recette d'`origin/dev` ne démarre pas sur une pile NEUVE** — **servie par STORY-940**
  (catalogue et paiement créent leurs topics abonnés absents avant `subscribe`, le correctif de C). Plus besoin de
  créer les trois topics `paiement.abonnement.*` à la main une fois les images reconstruites depuis `dev`.
- **← C (2026-11-15) : `prospera-plateforme`, verrou et scripts racines** — **servie par STORY-941** (plateforme #6,
  `9f43fa9`). `npm ci` passe ; `npm test` et `npm run typecheck` racines jouent `champs-sensibles/`,
  `classification-sante/`, `contrats/assurance/` (et `demo/`). Garde `test/scripts-racines.test.ts` : un fichier de C
  que la racine ne joue pas fait rougir la CI. Vos `package.json` restent, sans dépendance propre (D-941-2).
- **← C (2026-11-15) : les ports du compose racine pour la recette de l'Atelier** — **servie**. `grp-b` est descendue
  avec ses volumes après STORY-939, et B ne garde plus de pile levée entre deux stories. La recette de 940 a attendu
  que `grp-c-recette` libère les ports.

- **← A (2026-11-15) : le rôle métier effectif dans la liste des membres**
  (`TICKET-BACKEND-role-metier-absent-de-la-reponse-des-membres`) — **servie par STORY-942** (auth #39, `08fc1a0`).
  Les quatre critères du ticket sont prouvés en direct ; **FE-115 est débloquée**. C'est aussi le reste de la
  passation d'auth (« sans rôle métier » dans la console) : le détail d'organisation publie le même `roleMetier`.

- **← A (2026-11-15) : borne du jeton face aux verticales** — **prise en charge**, pas encore servie :
  1. regex des droits à tiret ⇒ **STORY-938** ;
  2. cinq codes de plus de 40 caractères ⇒ **STORY-935** ;
  3. décision d'architecture « droits hors du jeton » ⇒ à écrire avant février, au plus tard avec STORY-938.
  — **avancée par STORY-949** (2026-11-16) : l'ADR, écrite avec 938, a ses étapes 1 et 2 (`/moi/droits`, `dv`,
  `identity.droits.changed@1`, double lecture dans la partie A). La borne reste jusqu'au retrait de `perms[]` (étape 4) ;
  les droits `reprise:*` n'entrent au catalogue de tenant qu'à ce moment (D-949-1).

## ⚠ Contrats

- **2026-11-27, septième suite de STORY-979 (ordre « k », D-L7B-15) — le droit `fiscalite:declaration:regler`, annoncé
  AVANT la fusion** (`prospera-auth-service`, branche `MNV-979-regler` ; fiche `stories/STORY-979.md`, « Septième suite
  (2026-11-27) », D-979-43 → 49). Lu par **C** (fiscal : `POST /api/v1/obligations/{id}/reglements`, FR-F48), par la
  console (composition d'un rôle) et par **A** (types).
  - **Catalogue de tenant** : `fiscalite:declaration:regler`, libellé « Rapprocher le règlement d'une déclaration
    fiscale », **DANS le jeton** (`TenantPermission.FISCALITE_DECLARATION_REGLER`, 25ᵉ code de `perms[]`, seule exception à
    la règle de STORY-960 : la garde fiscale décide sur `perms[]`) ; ouvert par le module `declarations` (ou l'ancien
    `fiscalite`). Catalogue 168 codes (25 + 143) ; borne 17 + 25 = 42 ≤ 44.
  - **Table d'accès du cabinet** : à `CAB_ASSOCIE` et `CAB_COLLABORATEUR` (rôles par défaut du vertical : tout membre
    d'un cabinet le reçoit sans geste), jamais à `CAB_ARCHIVISTE` ; surchargeable par le cabinet (STORY-167). Le jeton du
    collaborateur porte `["fiscalite:declaration:preparer", "fiscalite:declaration:regler"]`, celui de l'associé les quatre
    droits fiscaux.
  - **Formes inchangées** : claims du jeton, `moi-droits` 1.1.0 (`droits` gagne la valeur), `identity.droits.changed@1`.
    Socle réaligné au démarrage d'auth, aucune migration ; le droit arrive avec le prochain jeton du membre.
  - **Pas fait (choix par défaut de C)** : le manifeste `declarations` garde ses codes `declarations:*` (écart antérieur,
    à la prochaine version de C) ; aucune recopie au catalogue.

- **2026-11-27, deuxième suite de STORY-1124 (ordre « j », D-L7B-14) — les deux faits proposés sont PUBLIÉS, annoncé
  AVANT la fusion** (`document-service`, GitHub `prospera-ocr-service`, branche `MNV-1124-j` ; fiche `stories/STORY-1124.md`,
  « Suite du 2026-11-27 (bis) », D-1124-27 → 33). **Aucun changement de forme** : ni schéma, ni route, ni droit, ni fait
  publié ; le manifeste `ged` reste **1.11.0** (deux commentaires, aucune valeur : D-1124-30), le catalogue n'est pas
  touché.
  - **`fiscal.depot.piece-archivee` v1 — publié par D** (`prospera-fiscal-service` #89, `dev` `dae6a10`,
    `src/kafka/events/fiscal.depot.piece-archivee.v1.json`) : sha256 LF `51838a86…3493`, **l'octet des deux copies de la
    GED** ; consommé dans le groupe `ged.fiscal`, octets tirés par `GET
    /api/v1/service/organisations/{orgId}/pieces-depot/{nature}/{pieceId}` (`FISCAL_SERVICE_URL`, `FISCAL_JETON_SERVICE`).
  - **`comptabilite.facture.desinscrite` v1 — publié par C** (`prospera-comptabilite-service` #21, `dev` `58803f5`,
    `contrat/schemas/`) : sha256 LF `86a50e6f…2ecf`, l'octet des deux copies de la GED (groupe `ged.comptabilite`).
  - `contrat/ORIGINE-DES-SCHEMAS.json` nomme ces deux sources ; manifeste `[proposition, à …]` → `[publié par …]`.
  - **→ D** : rien à faire avant le résultat de l'aller-retour (« Réponses » à la fin). **→ C** : rien à faire ; la route
    `GET …/ged/cabinet/pieces/{pieceId}/versions/{version}` que la comptabilité lit n'est pas touchée. **→ A** : rien.

- **2026-11-27, STORY-1137 — LIVRÉ** (dossier-service #61, `2f6e058` ; catalogue #90, `12c4c84` ; BFF #47, `7ac4db4` ; recette #38,
  `7999caf` sur `dev`) : conforme à l'annonce ci-dessous, **un ajout** : le BFF juge lui-même la forme des référentiels (400
  `REFERENTIELS_INVALIDES`, le code du catalogue) avant la naissance (D-1137-16) ; les référentiels de l'ordre ne sont jamais
  rendus (D-1137-15). **→ A** : `EssaiInstallationDto` et `EssaiInstallationRequestDto` dans l'OpenAPI du BFF.
  **→ C, D** : rien à faire.

- **2026-11-27, STORY-1137 — les modules s'ouvrent dans l'essai (ticket de 1116, D-L7B-4), annoncé AVANT le code**
  (`platform-catalog-service`, `admin-panel`, `dossier-service`, `prospera-recette`, branches `MNV-1137` ; fiche
  `stories/STORY-1137.md`, D-1137-1 → 13). Lu par **A** (console des essais, AP-57) et par qui déploie l'espace d'essai.
  - **Catalogue — `essai-prospect.openapi.json` 1.2.0 → 1.3.0** (ajouts facultatifs) : `POST /api/v1/essais` accepte
    **`installation: { modules: string[] (1 → 20), referentiels?: { <module>: [{ code, version }] } }`** ; l'essai (lecture,
    liste, réponse de l'ordre) rend **`installation: { demandes, modules, statut: TERMINE | EN_ATTENTE | EN_COURS | REFUSEE,
    planId?, code? }`**. L'ouverture choisit l'offre (dépendances dures ajoutées) et joue un plan du moteur avant de
    répondre (point de décision, vérifications FR-6, droit `moteur:<plan>`), puis importe le jeu, puis invite
    l'administrateur. Refus neufs, rien d'écrit : **422 `MODULE_INCONNU`** (`modules`), **400 `REFERENTIELS_HORS_DEMANDE`** ;
    `ESSAI_DIVERGENT` (409) s'étend à une installation demandée autrement. L'image porte les **jeux des verticales**
    (`cabinet-demo-togo`, `grossiste-golfe`, `-petit`, `-grand`, `assurance-compagnie-demo-reduite`, à leur étiquette de
    `prospera-plateforme`) : `GET /api/v1/jeux-demonstration` en rend six. Contrat d'état publié, événements, autres routes :
    **inchangés**.
  - **BFF — `POST /api/v1/admin/essais`** : `installation` facultatif (même forme), relayé tel quel ; `EssaiDto` gagne
    `installation` ; `MODULE_INCONNU` et `REFERENTIELS_HORS_DEMANDE` traversent par leur code.
  - **`dossier-service`** : aucune route ne change ; sur une instance `INSTANCE_ESPACE=ESSAI`, la garde ne lit plus le KYC
    (Q-D-17 confirmée) ; au réel, inchangé.
  - **→ A** : la console peut envoyer `installation` (« Installer balance et bilan », `syscohada-revise@2.3`) et montrer
    `installation.statut` ; types à régénérer depuis l'OpenAPI du BFF ; sans cela rien ne change. **→ C, D** : rien à faire
    (vos gardes de 1019 et 1079 sont rejouées sur la pile de l'essai).

- **2026-11-27, STORY-1130 — LIVRÉ** (dossier-service #60, `a1bf7fa`, `653a70b` ; catalogue #89, `14c644d` sur `dev`) :
  conforme à l'annonce ci-dessous, **un écart** : le paquet fiscal recopié est celui de **STORY-340 de C** (`e68ae10`,
  sha256 `d620df8b…3fca6`, bloc `reglement` en plus), signalé pendant la story, au lieu de `61997fd` / `62563b3c…` ; ce que
  `dossier-service` lit est inchangé. **→ A** : la console des essais montre `dossier` en tête des propriétaires. **→ C,
  D** : rien à faire.

- **2026-11-27, STORY-1130 — effacer le dossier de démonstration à la fin d'un essai (D-1082-10), annoncé AVANT la fusion**
  (`dossier-service`, `platform-catalog-service`, branches `MNV-1130` ; fiche `stories/STORY-1130.md`, D-1130-1 → 15). Lu
  par qui déploie l'espace d'essai et par qui lit le plan d'effacement (**A**, la console des essais par le BFF).
  - **`dossier-service`** : route neuve **`POST /api/v1/instance/dossier/{organisationId}/effacement`**, au moteur seul
    (`@AdmetIdentitesDeService('MOTEUR')`, organisation du chemin), **espace d'essai seulement** (403
    `ESPACE_REEL_REFUSE` avant le corps) : `effacement-c13-demande@1` → `effacement-c13-accuse@1` (`module: "dossier"`),
    copiés à l'octet de `prospera-plateforme@contrats-instance-v1.1` dans `src/vendor/contrats-instance/`. Efface **tout** ce
    que le service tient de l'organisation (dossiers, journal par le pilote, exercices, axes, périmètre, copies des voisins,
    messages sortants par `payload.orgId`, la personne dont c'était la dernière appartenance) ; rejouée : `DEJA_EFFACE`.
    Refus : 422 `SCHEMA_NON_CONFORME` (`details.erreurs`), 400 `ORGANISATION_INCOHERENTE`, 422 `MOTIF_NON_SERVI`
    (`FIN_CONTRAT`) ; 401, 403 `IDENTITE_DE_SERVICE_REQUISE`, `ORGANISATION_HORS_JETON`, `IDENTITE_DE_SERVICE_REFUSEE`.
    Aucun événement neuf ni changé. Le paquet fiscal Togo 2026 embarqué recopié (← C, STORY-564 : `61997fd`, `62563b3c…`).
  - **`platform-catalog-service`** : variable neuve, facultative, **`SOCLE_SERVICES`** (`dossier=http://dossier-service:3009`,
    même forme qu'`INSTALLATION_SERVICES`, jamais confondue avec elle) ; le plan d'effacement d'**un essai** compte
    **`dossier` en tête** de ses propriétaires, à la route que le moteur fixe (`PROPRIETAIRES_DU_SOCLE`) ; sans adresse ou
    injoignable, le plan reste `EN_COURS` et aucun certificat ne sort (D-953-4). Un plan ouvert avant la livraison gagne le
    socle. `essai-prospect.openapi.json` et `certificat-effacement@1` **inchangés** (la valeur `dossier` apparaît dans
    `proprietaires[].module`) ; le contrat d'état publié n'est pas touché ; le BFF ne change pas. `.env.essai.example`
    pose `SOCLE_SERVICES`.
  - **→ A** : la console des essais montre un propriétaire de plus (`dossier`, en tête) ; aucun type ne change. **→ C, D** :
    rien à faire ; une recette qui jouera l'effacement d'un essai jusqu'au certificat pose `SOCLE_SERVICES` sur le catalogue
    de l'essai.

- **2026-11-27, suite « h » de STORY-1124 et ordre « i » — LIVRÉ** (document-service #42, `8f9040d` ; catalogue #88,
  `e528afc` sur `dev`) : conforme aux deux annonces ci-dessous, sans écart de contrat. **→ D** : le fait et la route de
  service à écrire tels quels (« Réponses ») ; jusque-là, rien n'arrive à la GED. **→ A** : `PiecesFiscalesDto` et
  `PieceFiscaleDto` dans l'OpenAPI vivant de `document-service` (tag `ged-cabinet`) ; `GET …/natures` rend `version:
  "2026.3"`. **→ C** : la route de « f » que la comptabilité lit est inchangée.

- **2026-11-27, ordre « i » (D-L7B-13) et recopie de « h » — annoncé AVANT la fusion** (`platform-catalog-service`, branche
  `MNV-1124-fiscal`) : `copies.json` recopié depuis `prospera-stories@c926f55` ; seuls deux manifestes changent : **`ged`
  1.10.0 → 1.11.0** (`fiscal.depot.piece-archivee` en `consomme`, `GET …/ged/cabinet/dossiers/{dossierId}/pieces-fiscales`
  en lecture seule ; code fusionné : document-service #42, `8f9040d`) et **`comptabilite` 0.5.0 → 0.6.0** (← C : publie
  `comptabilite.facture.desinscrite`, trois routes de lecture neuves ; droits inchangés ; code fusionné : comptabilite
  #21). Aucune route ni topic du catalogue ne change de forme ; une base déjà semée reçoit les deux versions à son
  prochain démarrage. **→ A, C, D** : rien à faire.

- **2026-11-27, suite de STORY-1124 (ordre « h », D-L7B-12) — les pièces du dépôt d'une déclaration au fonds du client,
  annoncé AVANT la fusion** (`document-service`, GitHub `prospera-ocr-service`, branche `MNV-1124-fiscal` ; fiche
  `stories/STORY-1124.md`, « Suite du 2026-11-27 », D-1124-13 → 24). Demandé par D (STORY-335). **Ajouts seuls** ; aucun
  droit neuf (auth inchangé), aucun fait publié, aucune route d'écriture.
  - **Forme (1)** : **fait `fiscal.depot.piece-archivee` v1, proposé par B à D** (le fiscal le publie par son outbox,
    dans la transaction de l'archivage ; la GED le consomme, groupe `ged.fiscal`) et **route de service du fiscal,
    proposée à D**, par laquelle la GED tire les octets : `GET
    /api/v1/service/organisations/{orgId}/pieces-depot/{nature}/{pieceId}` (jeton de service `document-service`,
    `JETONS_DE_SERVICE` du patron de STORY-589 ; 200 octets + `X-Empreinte-Sha256` ; 404 `PIECE_INTROUVABLE`, 502
    `FICHIER_ARCHIVE_ALTERE`, 401 `JETON_DE_SERVICE_REQUIS`). Schéma : `prospera-ocr-service`
    `contrat/consommes/fiscal.depot.piece-archivee.v1.json` (requis : `eventId`, `schemaVersion: 1`, `occurredAt`, `orgId`,
    `dossierId`, `obligationId`, `implantationId`, `redevableId`, `taxe`, `periode`, `numero`, `depotId`, `nature`
    `LIVRABLE_DEPOSE | ACCUSE_DEPOT | VALIDATION_CLIENT`, `date` ; `piece { id, sha256, taille, type, nom }` pour le
    livrable et l'accusé, `pieceGed { pieceId, version, sha256 }` pour la validation, exclusifs).
  - **GED** : copie au fonds ouvert du dossier (période fiscale → exercice), à contrôler ; idempotente sur
    `(organisation, obligationId, numero, nature)` ; attentes nommées (`SANS_FONDS`, `PIECE_INTROUVABLE`,
    `ORIGINAL_ALTERE`, `EMPREINTE_DIVERGENTE`, `PIECE_GED_INTROUVABLE`, `SOURCE_INDISPONIBLE`, refus de fichier) ; la
    validation du client rattachée, jamais copiée ; formats du fiscal (PDF, PNG, JPEG, XML, XLSX, JSON, 15 Mo), seuls le
    PDF et les images lus. Variables neuves `FISCAL_SERVICE_URL`, `FISCAL_JETON_SERVICE`, `FISCAL_SERVICE_DELAI_MS`.
  - **Plan du cabinet `2026.3`** : 2026.2 et **`ACCUSE_DEPOT`** (`ANNUEL` / `FISCAL`, non sensible, 10 ans après la fin de
    l'exercice) ; `GET …/natures` rend `version: "2026.3"`.
  - **Route neuve `GET /api/v1/ged/cabinet/dossiers/{dossierId}/pieces-fiscales`** (`ged:piece:consulter`, portée du
    dossier ; filtres `obligationId`, `periode`, `implantationId`, `nature`) → `{ pieces: [{ obligationId, implantationId,
    redevableId, taxe, periode, numero, nature, depotId, date, statut: RANGEE | EN_ATTENTE, raison?, pieceId?, version?,
    fondsNumero?, empreinte, recueLe, rangeeLe? }] }` ; `404 DOSSIER_INCONNU`.
  - **Manifeste `ged` 1.11.0** (cette PR) : le fait en `consomme` [proposition, à D], la route en `routesLectureSeule` ;
    recopié dans le service par le code, puis au catalogue. **→ D** : écrire le fait et la route tels quels (« Réponses »
    à la fusion). **→ A** : types à régénérer depuis l'OpenAPI vivant de `document-service` (tag `ged-cabinet`) le jour
    où un écran lit la route. **→ C** : le fiscal portera la route et le fait, écrits par D dans son dossier `depots`.

- **2026-11-26, STORY-1129 — LIVRÉ** (catalogue #86, #87, `18b03ae`, `7aa5623` ; BFF #46, `eb2fe4b` ; recette #35 → #37,
  `c0594e3` sur `dev`) : conforme à l'annonce ci-dessous, **deux écarts** : (1) le corps du 409 nomme le module dans
  **`modules: [module]`** (le filtre global du catalogue ne laisse passer que sa liste blanche ; `module` n'est pas servi,
  D-1129-12) ; le BFF le relaie dans `details.modules` ; (2) **`.env.essai.example` inchangé** : `conseil` n'y est pas
  (balance-service ne sert pas ses routes C13 d'import et d'effacement, D-972-6, D-1129-11). **→ A** : ajouter le code à
  `GRANT_REFUSAL_CODES` ; régénérer les types du BFF si le 409 est lu. **→ C, D** : rien à faire hors de vos recettes.

- **2026-11-26, STORY-1129 — le cabinet sur le moteur : le `PUT` d'octroi n'installe plus ce que le moteur sait
  installer, annoncé AVANT le code** (`platform-catalog-service`, `admin-panel`, `prospera-recette`, branches `MNV-1129` ;
  fiche `stories/STORY-1129.md`, D-1129-1 → 10). Lu par la console (**A**, panneau des droits d'AP-05, qui appelle le
  catalogue directement) et par qui installe dans une recette (**C**, **D**). (1) **Catalogue**, `PUT
  /api/v1/catalog/entitlements/{orgId}/{moduleCode}` : refus neuf **409 `INSTALLATION_PAR_LE_MOTEUR`** (`{ statusCode, error,
  message, code, module }`) quand le corps demande `ACTIVE` (ou omet `status`) pour un module **pas installé** que le moteur
  sait vérifier (son manifeste ne déclare aucune vérification, ou `INSTALLATION_SERVICES` lui donne une adresse) ; rien
  n'est écrit. Sanction, levée, réécriture d'un module installé, et l'installation transitoire d'un module sans adresse
  (plan `CONSOLE_PUT`, vérifications différées) : **inchangées**. (2) **BFF**, `PUT
  /api/v1/admin/orgs/{orgId}/entitlements/{moduleCode}` (toujours `deprecated`) : ses 404, 409, 422 portant un code du
  moteur gardent ce code et `details` (`modules`, `refus`, `planId`), comme `…/installations` ; `CODES_DU_MOTEUR` gagne
  `INSTALLATION_PAR_LE_MOTEUR`. OpenAPI du catalogue et du BFF : descriptions et réponse 409. (3) **Réglage** :
  `INSTALLATION_SERVICES` de la pile de recette et de `.env.essai.example` gagne `conseil=http://balance-service:3007`.
  (4) **Recettes** : `balance`, `bilan`, `comptabilite`, `conseil` s'installent par l'offre et `POST /installations`
  (aide `installerParLeMoteur`, `src/moteur.ts`) ; FR-6 de `cabinet-moteur` sur `declarations`. **Inchangés** :
  `entitlement.changed`, l'état publié, `POST /installations`, l'offre, `DELETE`, auth, manifestes. **→ A** : ajouter
  `INSTALLATION_PAR_LE_MOTEUR` à `GRANT_REFUSAL_CODES` (sinon phrase générique, rien ne casse) ; types à régénérer si le
  409 du BFF est lu. **→ C, D** : une recette qui installe ces quatre modules par le `PUT` passe par l'aide ; vos services
  ne sont pas touchés.

- **2026-11-26, STORY-1128 — LIVRÉ** (catalogue #85, `2a19265`, `e35d6a0` sur `dev` ; plateforme #42, `758568e`, étiquette
  **`contrat-etat-publie-v1.1`** dans la plateforme) : conforme à l'annonce ci-dessous, sans écart. Karapace : les sujets de
  l'état publié en `BACKWARD_TRANSITIVE`. **→ A, C, D** : rien à faire ; une copie de l'état publié s'épingle désormais sur
  `prospera-plateforme/contrats/etat-publie/` (`ORIGINE.json`) ; tout ajout futur = une version neuve, annoncée ici.

- **2026-11-26, STORY-1128 — le contrat d'état publié figé, annoncé AVANT le code** (`platform-catalog-service` et
  `prospera-plateforme`, branches `MNV-1128` ; fiche `stories/STORY-1128.md`, D-1128-1 → 12). Lu par tous les consommateurs
  de l'état publié (coque et app du cabinet de **A**, gardes des modules de **C** et **D**). **Aucun octet du contrat ne
  change** : la version figée est **1.1.0** (`contrat-etat-publie-v1.1`, `efedd3e`). Ce qui change : (1) **un octet = une
  version** : `contrat/historique/etat-publie/versions.json` et la photo de chaque version ; la garde du gel rougit sur tout
  changement non versionné des trois fichiers (OpenAPI, matrice, schéma de l'événement), et sur une version qui n'est pas un
  ajout seul (rien ne disparaît ni ne change de type, de borne ou de motif ; `required` et `enum` identiques ; un champ neuf
  jamais exigé) ; **la matrice est figée pour la majeure 1** (une cellule changée = `versionMatrice` 2, contrat 2.0.0,
  événement `@2`) ; (2) Karapace : `etat-publie.changed.essai-value` et `.reel-value` en **`BACKWARD_TRANSITIVE`** ; (3)
  **`prospera-plateforme/contrats/etat-publie/`** : la copie à l'étiquette, `ORIGINE.json`, étiquette
  `contrat-etat-publie-v1.1` dans la plateforme ; la garde partagée (`garde-etat-publie-v1`) y est rejouée, **son fichier
  ne change pas** (les douze copies restent vraies) ; (4) **comportement** : l'émetteur republie sur une montée de
  `versionCode` seule (D-1127-10) ; au premier démarrage du catalogue livré, chaque module installé qui porte une version
  est republié **une fois** (`numero` + 1, même état). **Inchangés** : route, événement, topics, `entitlement.changed`, BFF,
  auth, manifestes. **→ A, C, D** : rien à faire ; tout ajout futur demande une version neuve annoncée ici.

- **2026-11-26, STORY-1127 — LIVRÉ** (catalogue #84, `efedd3e` sur `dev` ; étiquette **`contrat-etat-publie-v1.1`**) :
  conforme à l'annonce ci-dessous, sans écart. Karapace : la v1 → le neuf **compatible BACKWARD**, enregistré sur les deux
  sujets. **→ C et D** : `module.referentiels` est servi ; `assurance` peut retirer son consommateur de
  `entitlement.changed` (D-1006-5). **→ A** : rien à régénérer côté BFF.

- **2026-11-26, STORY-1127 — les référentiels habilités dans l'état publié, annoncé AVANT la fusion**
  (`platform-catalog-service`, branche `MNV-1127` ; fiche `stories/STORY-1127.md`, D-1127-1 → 11). Lu par tous les
  consommateurs de l'état publié (coque, app du cabinet, gardes des modules) et d'abord par **C et D** (`assurance`, D-1006-5 ;
  le fiscal et balance pour EPIC-159). **Un ajout facultatif seul**, au modèle fermé `module`, à la route
  (`GET /api/v1/etat-publie/{organisationId}`, `ModuleEtatPublie` ; la lecture de la console de 1080 aussi) et à
  l'événement (`etat-publie.changed.essai@1`, `.reel@1`), même définition des deux côtés : **`module.referentiels`** =
  `[{ code, version, artifactUri?, checksum? }]` (`minItems: 1` ; `checksum` = `sha256:<64 hexa>`), **la liste du droit,
  celle de `entitlement.changed` v2**, même ordre ; `artifactUri` et `checksum` pour `fiscalite` et `declarations`
  seulement. Présente quand le droit en porte et que le module est installé (comme `versionCode` : jamais en `NON_INSTALLE`
  ni `EN_INSTALLATION`) ; omise sinon, **jamais vide** ; elle **n'ouvre rien** (seul `etat` ouvre). Un changement de la liste
  seule publie un état neuf (`numero` suivant) ; au premier démarrage du catalogue livré, chaque module dont le droit porte
  des référentiels est republié une fois. `schemaVersion` 1, `schemaEtatPublie` 1, topics inchangés (BACKWARD, prouvé sur
  Karapace) ; `contrat/etat-publie.openapi.json` 1.0.0 → **1.1.0**, étiquette **`contrat-etat-publie-v1.1`** (la v1 reste) ;
  manifeste `instance` 1.0.0 → **1.1.0** (`publie` inchangé), recopié dans `copies.json`. **Inchangés** : `entitlement.changed`,
  la matrice, la garde partagée, le BFF (la console lit les référentiels par AP-10, D-1127-8), `prospera-plateforme`, auth.
  **→ A** : rien à régénérer côté BFF ; la coque peut lire le champ en lecteur tolérant.

- **2026-11-26, STORY-1126 — LIVRÉ** (prospera-recette #34, `585d8bd` sur `dev`) : conforme à l'annonce ci-dessous, sans écart.
  **En plus, un comportement de `document-service` (#41, `5261720`), sans contrat** : la GED garde les droits d'un membre
  **60 s par jeton** (`GET /moi/droits` lu une fois par minute au plus) ; un droit retiré chez auth se voit dans la GED en
  une minute au plus (comme dans la comptabilité). Aucune route, aucun fait, aucune variable. **→ A** : rien à régénérer.

- **2026-11-26, STORY-1126 — la GED du cabinet dans le profil de recette, annoncé AVANT la fusion** (`prospera-recette`,
  branche `MNV-1126` ; fiche `stories/STORY-1126.md`, D-1126-1 → 10). Lu par tous ceux qui lèvent la pile de recette (A, C,
  D). **Ajouts seuls**, des réglages : `document-service` reçoit `INSTANCE_ESPACE: ${RECETTE_ESPACE:-REEL}`,
  `AUTH_SERVICE_URL: http://auth-service:3001/api/v1` et `GED_CLE_CABINET: ${RECETTE_GED_CLE_CABINET:-}` ; le paquet tire la
  clé une fois dans `.recette/cle-ged-cabinet.b64` (non versionné) et la passe à chaque `docker compose` qu'il lance (comme
  la clé de signature commune, D-1115-3) ; un compose lancé à la main garde la GED du cabinet fermée (503). Recette neuve :
  `npm run recette -- archives` (lève `dossier-service`, `document-service`, `admin-panel` à la demande). Aucune autre
  recette ne change ; aucune route, aucun fait ni droit d'un service (un défaut révélé par la recette sera annoncé à part).

- **2026-11-26, cinquième suite de STORY-979 — LIVRÉ** (catalogue #83, `ce8cbc0` sur `dev`) : conforme à l'annonce
  ci-dessous, sans écart. `copies.json` depuis `prospera-stories@59ed625` : `paiement` 1.2.0 et `ged` 1.10.0 ; aucun
  autre manifeste. **→ A** : rien à régénérer (aucune OpenAPI du catalogue ni du BFF ne change).
- **2026-11-26, cinquième suite de STORY-979 (ordre « g », D-L7B-11) — deux manifestes recopiés au catalogue, annoncé
  AVANT la fusion** (`platform-catalog-service`, branche `MNV-979-manifestes-paiement-ged` ; fiche `stories/STORY-979.md`,
  « Cinquième suite (2026-11-26) », D-979-35 → 40). `copies.json` depuis `main` (copie entière) : **`paiement` 1.1.0 →
  1.2.0** (← D, STORY-1141 : `paiement.compte.changed@1` gagne `numeroImprimable` facultatif ; `PUT
  /api/v1/comptes-encaissement/{compteId}/numero-imprimable` hors lecture seule) et **`ged` 1.9.0 → 1.10.0** (« f » :
  `GET /api/v1/ged/cabinet/pieces/{pieceId}/versions/{version}` en `routesLectureSeule`). Aucun autre manifeste, aucun
  droit (auth inchangé), aucune route ni aucun topic du catalogue ne change ; une base déjà semée reçoit les deux versions
  à son prochain démarrage.

- **2026-11-26, suite de STORY-1119 — LIVRÉ** (document-service #40, `5d060aa` sur `dev`) : conforme à l'annonce
  ci-dessous, sans écart. Manifeste `ged` 1.10.0 dans le service (`prospera-stories@10d9d6e`, sha256 `0a0f6826…acbb0`) ;
  au catalogue avec « g ». **→ C** : la route est servie (voir « Réponses »). **→ A** : `MetadonneesDeVersionDto`,
  `DestructionDUneVersionDto`, `DesinscriptionDUneVersionDto` dans l'OpenAPI vivant de `document-service` (tag
  `ged-cabinet`) ; `GET …/natures` rend `version: "2026.2"`.
- **2026-11-26, suite de STORY-1119 (ordre « f », D-L7B-10) — la validation du client et la référence d'une version,
  annoncé AVANT la fusion** (`document-service`, GitHub `prospera-ocr-service`, branche `MNV-1119-reference` ; fiche
  `stories/STORY-1119.md`, « Suite du 2026-11-26 », D-1119-19 → 26). Demandé par C (STORY-324). **Ajouts seuls** ; aucun
  droit neuf (auth inchangé), aucun fait neuf ni changé, aucune collection ni variable.
  - **Plan de classement du cabinet `2026.2`** (`GET …/ged/cabinet/natures` : `version: "2026.2"`) : 2026.1 et une nature
    **`VALIDATION_CLIENT`** « Validation du client » — `ANNUEL` / `FISCAL` (exercice exigé), non sensible, 10 ans après la
    fin de l'exercice ; servie à tous les fonds, ouverts avant ou après. Un cabinet qui l'avait déjà créée garde la sienne.
  - **Route neuve `GET /api/v1/ged/cabinet/pieces/{pieceId}/versions/{version}`** (jeton du membre, `ged:piece:consulter`,
    portée du dossier) → `MetadonneesDeVersionDto` `{ pieceId, version, versionCourante, courante, empreinte, taille,
    typeContenu, nature, dossierId, fondsNumero, deposeLe, etatAntivirus, etat: CONSERVEE | DETRUITE | RETIREE,
    destruction?: { numero, le, procesVerbal }, desinscription?: { ecritureId, le } }` ; `empreinte` = SHA-256 du clair,
    64 hexadécimaux minuscules (format de `ged.piece.recue`). ⛔ Ni contenu, ni texte lu, ni nom de fichier, ni index.
    Refus : `403 DROIT_INSUFFISANT`, `403 GED_NOT_ENTITLED`, `404 PIECE_INCONNUE` (hors portée, autre cabinet, sensible
    sans son droit compris), `404 VERSION_INCONNUE`, `400`. Une pièce détruite (1121) ou retirée (1124) : `200`, l'état
    le dit.
  - **Manifeste `ged` 1.10.0** (`manifestes/ged.manifest.ts`, cette PR) : la route en `routesLectureSeule` ; recopié
    dans le service par le code, au catalogue avec « g » (copie entière, D-1119-25). **→ C** (STORY-336) : la route à
    appeler au jeton du membre. **→ A** : types à régénérer depuis l'OpenAPI vivant (`MetadonneesDeVersionDto`) quand
    un écran lira la référence (FE-081, FE-143).

- **2026-11-26, STORY-1125 — LIVRÉ** (document-service #39, `5c50ca6` sur `dev` ; BFF #45, `959aeee` et `81817fe`) :
  conforme à l'annonce ci-dessous ; écarts D-1125-14 → 16 (la liste du BFF garde l'ordre des champs de la GED ; `orgId` du
  BFF exigé en ObjectId ; refus de plateforme en `403` générique). Manifeste `ged` inchangé. **Types à régénérer** (A)
  depuis les deux OpenAPI vivants : BFF `ArchivageDesCabinetsDto`, `ArchivageDuCabinetDto`, `ArchivageDUnCabinetDto`,
  `TotalDArchivageDto`, `MoisDArchivageDto`, `QuotaDArchivageDto`, `PoserQuotaDArchivageRequestDto` ; `document-service`
  : les mêmes noms (tag `ged-plateforme`) et `quotaSource` sur `GET …/ged/cabinet/quota`.
- **2026-11-26, STORY-1125 — l'archivage se mesure et se vend, annoncé AVANT le code** (`document-service`, GitHub
  `prospera-ocr-service`, et le BFF `admin-panel`, branches `MNV-1125` ; fiche `stories/STORY-1125.md`, D-1125-1 → 13).
  **Ajouts seuls** ; aucun droit neuf (auth inchangé), aucun fait neuf, **`ged.quota.depasse` inchangé** (il lit désormais
  le quota du cabinet), manifeste `ged` inchangé (D-1125-12, aucune recopie au catalogue).
  - **`document-service`, surface de la plateforme** (permissions du jeton, `perms`, patron de STORY-105 ; sans elle
    `403`) : `GET /api/v1/ged/plateforme/archivage?mois=AAAA-MM` (`org:read`) → `{ mois, calculeLe, cabinets: [{
    organisationId, total, mois, quota }], tronque }` ; `GET /api/v1/ged/plateforme/cabinets/{organisationId}/archivage?du=&au=`
    (`org:read`) → `{ organisationId, calculeLe, total, mois: [...], quota }` (douze mois par défaut, 36 au plus) ;
    `PUT /api/v1/ged/plateforme/cabinets/{organisationId}/quota` (`entitlement:grant`), corps `{ quotaOctets: entier ≥ 1 |
    null, offre? }` → le bloc `quota`. Compteurs : `fonds`, `fondsOuverts`, `fondsFermes`, `piecesVersees`, `pagesVersees`,
    `volumeOctets`, `boitesCotees` (le total dit ce qui est là, le mois ce qui a été fait, D-1125-2) ; quota : `{
    quotaOctets, source: OFFRE | SERVICE, offre?, poseLe?, posePar?, volumeOctets, depasse, utilisationPourcent }`. Refus
    `400 MOIS_INVALIDE`, `400 PERIODE_INVALIDE`. ⛔ Aucun numéro de fonds, dossier, nom ni contenu de pièce (AC-3).
  - **`document-service`, côté cabinet** : `GET …/ged/cabinet/quota` et l'accusé d'un dépôt rendent le quota du cabinet
    (celui de son offre, sinon celui du service) et un champ facultatif neuf **`quotaSource`** (`OFFRE` | `SERVICE`).
  - **Collection neuve** `ged_quotas_cabinet` (le quota posé par Money Vibes, l'offre, qui, quand, les 50 derniers
    changements).
  - **BFF** (relais de la console, AP-51) : `GET /api/v1/admin/archivage?mois=` et `GET
    /api/v1/admin/orgs/{orgId}/archivage?du=&au=` (`org:read`), `PUT /api/v1/admin/orgs/{orgId}/archivage/quota`
    (`entitlement:grant`) ; projection champ par champ, `503` sur un corps hors forme ; variable facultative neuve
    `DOCUMENT_SERVICE_URL` (défaut `http://document-service:3006/api/v1`). **→ A** : les types se génèrent depuis les deux
    OpenAPI vivants après la fusion ; l'écran AP-51 est au lot 8.

- **2026-11-26, STORY-1124 — LIVRÉ** (document-service #38, `b18d3ad` sur `dev` ; catalogue #82, `9674aeb`) : conforme à
  l'annonce ci-dessous ; écarts D-1124-9 → 12 (la sortie d'une pièce rend aussi 409 `PIECE_HORS_BOITE`, code existant,
  quand son original vient de changer de boîte ; `desinscription` déclarée au schéma Mongo). **`comptabilite.facture.desinscrite`
  v1** : schéma `prospera-ocr-service/contrat/consommes/comptabilite.facture.desinscrite.v1.json` (`86a50e6f…2ecf`),
  **accepté par C** (STORY-338) tel quel. **→ A** : types à régénérer depuis l'OpenAPI vivant (champ `desinscription` de
  la vue d'une pièce, refus `PIECE_SORTIE` et `PIECE_RETIREE` ; aucun DTO de réponse neuf).
- **2026-11-26, STORY-1124 — le circuit sans trou, annoncé AVANT le code** (`document-service`, GitHub
  `prospera-ocr-service`, branche `MNV-1124` ; fiche `stories/STORY-1124.md`, D-1124-1 → 8). **Aucune route neuve, aucun
  droit neuf, aucun fait publié.** Ajouts seuls :
  - **Réception** (`POST …/ged/cabinet/fonds/{numero}/receptions`) : bordereau et boîtes dans une transaction MongoDB ;
    réponse inchangée.
  - **Mouvements d'une boîte verrouillés** (sortie d'une boîte ou d'une pièce, retour, restitution, original relié) : la
    boîte s'écrit d'abord dans la transaction (`ged_boites.mouvements`), l'état se rejuge dans la session. Refus
    inchangés (`DEJA_SORTIE`, `DEJA_RENTREE`, `BOITE_RESTITUEE`, `BOITE_SORTIE`) ; **refus neuf 409 `PIECE_SORTIE`** sur
    `PUT …/pieces/{pieceId}/original` quand l'original est dehors.
  - **Facture désinscrite** : la GED consomme **`comptabilite.facture.desinscrite` v1, proposé à C** (« Demandes »), dans
    le groupe `ged.comptabilite` ; une copie jamais versée est **retirée** du fonds (liste, versement, reprises, export,
    échues, index ; fichiers gardés ; **refus neuf 409 `PIECE_RETIREE`** sur contrôle, indexation, version, original),
    une copie versée est **gardée** ; une attente désinscrite ne se range plus.
  - **Vue d'une pièce** (`GET …/ged/cabinet/pieces/{pieceId}` et toute réponse qui la rend) : champ facultatif neuf
    **`desinscription?: { ecritureId, le, issue: RETIREE | GARDEE }`**.
  - **Manifeste `ged` 1.9.0** (`manifestes/ged.manifest.ts`, cette PR) : `comptabilite.facture.desinscrite` en
    `consomme` ; recopié dans le service par le code, puis au catalogue. **→ A** : types à régénérer depuis l'OpenAPI
    vivant (descriptions seules, aucun DTO de réponse neuf) ; rien à faire avant le lot 8.

- **2026-11-26, suite de STORY-953 — PUBLIÉ** (plateforme #41, `d68a468` sur `dev`, étiquette **`contrats-instance-v1.1`**) :
  conforme à l'annonce ci-dessous, sans écart. Empreintes (sha256) à l'étiquette : `export-c13-reponse.schema.json`
  `93074ea3…4dba`, `export-c13-csv.cas.json` `2a139ec9…b1c4`, `instance-c13.openapi.json` `c128e320…3052` ; les cinq
  autres fichiers inchangés depuis `contrats-instance-v1`.
- **2026-11-26, suite de STORY-953 (ordre « e », D-L7B-9) — le contrat de l'export C13, annoncé AVANT la fusion**
  (`prospera-plateforme`, branche `MNV-953-export`, PR #41 ; fiche `stories/STORY-953.md`, « Suite du 2026-11-26 », D-953-10 →
  15). **Ajouts seuls** à `contrats/instance/` : l'import, l'effacement, le certificat et le jeu ne changent pas d'un
  octet. Demandé par D (STORY-1140) ; la forme est celle que servent `balance-service` (STORY-1021, D-1021-6 → 8) et
  `prospera-bilan-service` (STORY-1140), relue dans leur code. Étiquette neuve **`contrats-instance-v1.1`** après la fusion.
  - **`export-c13-reponse@1`** (neuf, `export-c13-reponse.schema.json`) : la réponse 200 en JSON de `GET
    /api/v1/instance/<code>/{organisationId}/export` — `{ schemaVersion: 1, module, organisationId, espace: ESSAI | REEL,
    exporteLe, objets: [{ objet, collection, nombre ≥ 0, enregistrements: documents en Extended JSON relaxed }] }`, objets
    dans l'ordre du plan d'export du module (avec `objet`, ce seul objet).
  - **`export-c13-csv.cas.json`** (neuf, contrat `export-c13-csv@1`) : les huit règles du CSV d'un objet (BOM, `;`, CRLF,
    RFC 4180, en-tête par ordre d'apparition, `a.b`, feuilles `$…`, tableau en JSON, formules neutralisées puis échappées,
    nombres jamais neutralisés) et **huit cas** (documents → texte exact du fichier) : les six vecteurs de balance et
    deux de plus (tabulation, CR, `+`, guillemets, saut de ligne, booléen, `$numberLong` négatif ; feuille à valeur
    composée `$binary`, `$date` hors plage). Rejoués à l'octet contre le code de balance (`dev` `44be0c1`) et de bilan
    (`MNV-1140` `e13d874`) : 8/8 chacun.
  - **`instance-c13.openapi.json` 1.1.0** : la route `GET …/export` (paramètres `format` = `json` (défaut) | `csv`,
    `objet` exigé en CSV ; 200 `application/json` ou `text/csv` en pièce jointe `export-<code>-<objet>-<organisationId>.csv`
    ; en-tête `Cache-Control: no-store`) ; refus dans leur ordre : 401 ; 403 `IDENTITE_DE_SERVICE_REQUISE` |
    `IDENTITE_DE_SERVICE_REFUSEE` | `ORGANISATION_HORS_JETON` ; 400 `FORMAT_NON_SERVI` (`details.formatsServis`) ; 400
    `OBJET_REQUIS` (`details.objetsServis`) ; 422 `OBJET_INCONNU` (`details.objetsServis`) ; 403 `{MODULE}_NOT_ENTITLED`
    (`details.etatPublie`). Le corps `Refus` commun gagne `error` et `details` **facultatifs** (ce que les modules servent
    déjà) ; `RefusExport` nomme les `details` de l'export.
  - **Qui recopie** : balance (C) et bilan (D), à l'octet, à l'étiquette `contrats-instance-v1.1` (le garde de balance
    attend l'origine `contrats-instance-v1 ` : C l'ajuste en recopiant). Le catalogue garde sa copie épinglée à
    `contrats-instance-v1` (il n'appelle pas l'export, D-953-15). **→ A** : rien (aucune route d'écran, aucun type à
    régénérer).

- **2026-11-26, STORY-1123 — LIVRÉ** (document-service #37, `7e65881` sur `dev` ; catalogue #81, `85aee3a`) : conforme
  à l'annonce ci-dessous ; écarts D-1123-12 → 14 (curseur rendu dès qu'une page est pleine ; quota regardé au passage du
  jour). Sujets au registre : `<topic>-value`, schémas `prospera-ocr-service/contrat/schemas/`. **Types à régénérer**
  (A) depuis l'OpenAPI vivant : `PiecesEchuesDuCabinetDestructionDto`.
- **2026-11-26, STORY-1123 — les alertes de l'archiviste, annoncé AVANT le code** (`document-service`, GitHub
  `prospera-ocr-service`, branche `MNV-1123` ; fiche `stories/STORY-1123.md`, D-1123-1 → 11). **Ajouts seuls** ; le
  chemin de l'assurance ne change pas. Consommateur attendu : **`prospera-notification-service` (D)**, cloche et e-mail
  (demande au § « Demandes »).
  - **Cinq topics neufs** (outbox, dans la transaction de leur cause ; clé `organisationId` ; schémas JSON au dépôt,
    `contrat/schemas/`, sujets neufs au registre, BACKWARD) : **`ged.original.retour-en-retard`** (une sortie non rentrée
    à 1, 7, 30 jours de retard), **`ged.conservation.echeance-proche`** (un fait par fonds et par passage : les pièces qui
    entrent dans l'horizon, `GED_ALERTE_ECHEANCE_JOURS` = 90, ou déjà échues), **`ged.quota.depasse`** (une fois par
    franchissement), **`ged.integrite.ecart`** (une campagne en écart ou au journal rompu), **`ged.destruction.changed`**
    (`PROPOSEE`, `VISEE`, `REFUSEE`, `ACCORDEE`, `ABANDONNEE`, `EXECUTEE`). Chaque fait porte `destinataires` (identifiants
    d'utilisateur connus de la GED ; vide : à `notification` de choisir). ⛔ Aucun contenu de pièce (ni tiers, ni NIF, ni
    montant, ni texte lu), ni motif, ni emprunteur, ni raison sociale.
  - **Route neuve** : `GET /api/v1/ged/cabinet/pieces-echues?horizonJours=&curseur=&limite=` (`ged:fonds:gerer`) : les
    pièces échues (et, avec l'horizon, proches) de tout le cabinet, par échéance ; les lignes de la liste d'un fonds plus
    `echue`, `fondsNumero`, `dossierId`, `raisonSociale` ; `400 CURSEUR_INVALIDE`.
  - **Données** : `ged_index_recherche.echeance` et `.echeanceAnnoncee` ; `ged_sorties.retardAnnonce` ; collection
    `ged_alertes`. Variable `GED_ALERTE_ECHEANCE_JOURS`. Aucun droit neuf, aucune file ni minuterie neuve (le passage
    quotidien est porté par le balayage `ged-index` de STORY-1122).
  - **Manifeste `ged` 1.8.0** (cette annonce) : cinq faits publiés, une route de lecture ; recopié au catalogue par B
    après la fusion du code.

- **2026-11-26, STORY-1122 — retrouver dans tous les fonds du cabinet, annoncé AVANT le code** (`document-service`,
  GitHub `prospera-ocr-service`, branche `MNV-1122` ; fiche `stories/STORY-1122.md`, D-1122-1 → 12). **Ajouts seuls**,
  sous `/api/v1/ged/cabinet` ; le chemin de l'assurance ne change pas.
  - **Route neuve** : `GET …/recherche` (`ged:piece:consulter`) : les critères de `…/fonds/{numero}/recherche` (`q`,
    `mois`, `nature`, `exercice`, `tiers`, `dateDu`, `dateAu`, `montantMin`, `montantMax`, `reference`, `rubrique`,
    `limite` ≤ 100, `curseur`) plus `fonds` et `dossierId` → `{ total, resultats, curseurSuivant? }`. Portée : tout le
    cabinet pour `TENANT_ADMIN` et `ged:fonds:gerer`, ses dossiers pour un collaborateur. Nature sensible : absente sans
    `ged:sensible:consulter`, appariée par ses seules métadonnées avec ; pièce détruite : jamais.
  - **`GET …/fonds/{numero}/recherche`** : même forme ; chaque résultat **gagne** `fondsNumero`, `dossierId`,
    `raisonSociale?` ; le curseur reste opaque (sa valeur change de forme : ne pas le fabriquer). **L'appariement
    change** : texte lu par mot entier (sans accents ni casse), métadonnées par début de mot (trois caractères au
    moins) ; `tiers`/`reference` par début de mot (« `tiers=eet` » ne trouve plus « CEET »). Plus de borne de 500 textes.
  - **Index aveugle** : collection neuve `ged_index_recherche` (jetons `HMAC-SHA256` tronqués sous une clé du cabinet
    dérivée de `GED_CLE_CABINET` ; aucun mot en clair) ; file BullMQ neuve **`ged-index`** (planificateur répétable
    `ged-index-balayage`) ; variable neuve **`GED_INDEX_BALAYAGE_SECONDES`** (défaut 15, `0` coupe). Une recherche par
    mots sans `GED_CLE_CABINET` : 503 `CHIFFREMENT_INDISPONIBLE` (code existant).
  - **Versement, liste des pièces d'un fonds, reprises** : sans la borne de 1 000 ; aucune forme ne change.
  - DTO de réponse neufs à l'OpenAPI de `document-service` (`ResultatsDeRechercheDto`). Aucun droit neuf (auth
    inchangé), aucun fait Kafka, aucune dépendance neuve.
  - **Manifeste `ged` 1.7.0** (`manifestes/ged.manifest.ts`, cette PR) : `GET /api/v1/ged/cabinet/recherche` en
    `routesLectureSeule` ; recopié dans le service par le code, **puis au catalogue par B** après la fusion du code.
    **→ A (FE-143)** : types à régénérer quand l'écran viendra. **Pour C et D** : rien.
  - **Amendé au code, AVANT la fusion** (document-service #36) : refus neuf **`400 CURSEUR_INVALIDE`** (un curseur qui ne
    vient pas d'une page) ; `fonds` (80 caractères au plus) et `dossierId` (24 hexadécimaux) validés (400). Un texte lu
    attendu se revoit au balayage suivant tant que sa lecture est planifiée (40 balayages au plus), avec un délai
    croissant (jusqu'à 24 h) pour une lecture en échec ou absente. Aucune autre forme ne change.
  - **Livré le 26/11** : document-service #36 (`27f1e8d`), catalogue #80 (`98d6b25`, `ged` 1.7.0 au catalogue).

- **2026-11-26, STORY-1121 — la destruction proposée, puis visée, annoncé AVANT le code** (`document-service`, GitHub
  `prospera-ocr-service`, branche `MNV-1121` ; `auth-service`, branche `MNV-1121` ; fiche `stories/STORY-1121.md`,
  D-1121-1 → 10). **Ajouts seuls**, sous `/api/v1/ged/cabinet` ; le chemin de l'assurance ne change pas.
  - **Droits (auth)** : `ged:destruction:proposer` (`CAB_ARCHIVISTE`, `CAB_ASSOCIE`) et `ged:destruction:viser`
    (`CAB_ASSOCIE`) entrent au catalogue de tenant, **hors du jeton** (`droitsHorsJeton` de `GET /moi/droits`), dans la
    table d'accès du cabinet. Les deux codes sont **déjà au manifeste `ged`** : `droits` ne change pas. Catalogue 165 →
    167 codes (24 + 143), borne inchangée ; `moi-droits` 1.1.0 et `identity.droits.changed@1` inchangés.
  - **Gel** (« en litige ou en contrôle », qui n'existait nulle part) : `POST …/fonds/{numero}/gels` `{ motif: LITIGE |
    CONTROLE_FISCAL | CONTROLE_SOCIAL | AUTRE_CONTROLE, reference?, observation?, exercices?, pieces? }` → 201
    (`GEL-AAAA-NNNNN`, `ged:fonds:gerer`) ; `GET …/fonds/{numero}/gels` ; `POST …/gels/{numero}/levee` `{ observation }`
    (`ged:destruction:viser`). Refus neufs : `404 GEL_INCONNU`, `409 GEL_DEJA_LEVE`.
  - **Pièces échues** : `GET …/fonds/{numero}/pieces-echues?curseur=&limite=` (`ged:fonds:gerer`), lue par pages ; chaque
    ligne porte `echeance` et `blocage?` (`GEL`, `SORTIE`, `PROPOSEE`). Une pièce permanente n'est échue qu'après la
    fermeture du fonds.
  - **Destruction** : `POST …/fonds/{numero}/destructions` `{ pieces?, observation? }` → 201 (`DES-AAAA-NNNNN`,
    `ged:destruction:proposer`) ; `GET …/fonds/{numero}/destructions`, `GET …/destructions/{numero}`, `GET
    …/destructions/{numero}/pieces` (`ged:fonds:gerer`) ; `POST …/destructions/{numero}/visa` `{ decision: VISEE |
    REFUSEE, observation? }` (`ged:destruction:viser`, jamais le proposant) ; `POST …/destructions/{numero}/accord`
    (multipart : `decision`, `accordePar`, `accordeLe`, `fichier`) ; `POST …/destructions/{numero}/abandon` ; `POST
    …/destructions/{numero}/execution` → 202 (file BullMQ neuve **`ged-destructions`**) ; `GET
    …/registre-des-destructions`. Documents probants de types neufs **`BORDEREAU_DE_DESTRUCTION`** (`BDE-`, émis au
    visa, l'accord signé du client en `exemplaireSigne`) et **`PROCES_VERBAL_DE_DESTRUCTION`** (`PVD-`). Refus neufs :
    `404 DESTRUCTION_INCONNUE`, `409 PIECES_NON_DESTRUCTIBLES`, `AUCUNE_PIECE_DESTRUCTIBLE`, `ETAT_DE_DESTRUCTION`,
    `VISA_PAR_LE_PROPOSANT`, `PIECE_DETRUITE`, `400 OBSERVATION_REQUISE`, `410 PIECE_DETRUITE`, `410 EXPORT_DETRUIT`.
  - **Une pièce détruite** : la vue gagne `destruction?` (`{ numero, le, procesVerbal }`), ses versions `detruite` ;
    contenu et texte lu en 410 ; `ResultatDuControle` (vérification, campagnes) gagne `detruites` : une version détruite
    régulièrement **n'est jamais `FICHIER_ABSENT`** ; l'export la liste sans fichier ; l'export gagne `volumesDetruits`.
  - **Journal d'intégrité** : actes neufs `GEL`, `GEL_LEVE`, `DESTRUCTION_PROPOSEE`, `DESTRUCTION_VISEE`,
    `DESTRUCTION_ACCORDEE`, `DESTRUCTION_ABANDONNEE`, `DESTRUCTION` (l'énumération `acte` de l'OpenAPI s'élargit).
  - Collections neuves `ged_gels`, `ged_destructions`, `ged_destructions_lignes` ; champs neufs `destruction`
    (`ged_pieces`, `ged_versions`), `volumesDetruits` (`ged_exports_fonds`). **Aucun fait Kafka publié** (STORY-1123).
    Aucune dépendance neuve, aucune variable neuve.
  - **Manifeste `ged` 1.6.0** (`manifestes/ged.manifest.ts`, cette PR) : six routes `GET` neuves en
    `routesLectureSeule` ; `droits`, `publie`, `consomme` inchangés ; recopié dans le service par le code, **puis au
    catalogue par B** après la fusion du code. **→ A (FE-143)** : types à régénérer depuis l'OpenAPI de
    `document-service` quand l'écran viendra. **Pour C et D** : rien (D : l'alerte d'échéance viendra par STORY-1123).
  - **Livré le 26/11** : document-service #35 (`023446c`), auth #51 (`e9c32c1`), catalogue #79 (`08f08d6`, `ged` 1.6.0 au
    catalogue). Au code, ajouts seuls (D-1121-11 → 13) : raison de retrait `VERSION_AJOUTEE`, `procesVerbal` dans la
    marque d'une pièce, exécution redemandable sur `EN_EXECUTION`, `restantes`, `bordereauDocument`,
    `procesVerbalDocument`, `destructionNumero`, `volumesDetruits`, `detruites` (contrôle de campagne).

- **2026-11-25, STORY-1120 — fin de mission et réversibilité, annoncé AVANT le code** (`document-service`, GitHub
  `prospera-ocr-service`, branche `MNV-1120` ; fiche `stories/STORY-1120.md`, D-1120-1 → 9). **Ajouts seuls**, sous
  `/api/v1/ged/cabinet` ; le chemin de l'assurance ne change pas.
  - **Fermeture du fonds** : `POST …/fonds/{numero}/fermeture` `{ motif: FIN_DE_MISSION | DEPART_DU_CLIENT,
    observation? }` (`ged:fonds:gerer`) → le fonds ; **et avec le dossier client** : la GED consomme **`dossier.updated`**
    (topic existant de `dossier-service`, groupe neuf `ged.dossiers-clients`) et ferme les fonds ouverts d'un dossier
    `ARCHIVE` (motif `DOSSIER_ARCHIVE`). Irréversible. La vue d'un fonds gagne `etat` (`OUVERT` | `FERME`) et
    `fermeture?` `{ le, par, motif, origine, observation? }`. **Refus neufs** : `409 FONDS_FERME` (`details: { fermeLe,
    motif }`) sur `POST …/pieces`, `…/pieces/{id}/versions`, `…/fonds/{n}/versements`, `…/reprises`, `…/receptions` ;
    `409 FONDS_DEJA_FERME`. Une facture inscrite par la comptabilité attend un fonds ouvert (`SANS_FONDS`).
  - **Export complet** : `POST …/fonds/{numero}/exports` → 202 `{ numero: EXP-AAAA-NNNNN, etat, demandeLe }`, `GET
    …/fonds/{numero}/exports`, `GET …/exports/{numero}`, `GET …/exports/{numero}/volumes/{rang}` (`application/zip`,
    `attachment`, `X-Empreinte-Sha256`). Produire et télécharger : `ged:fonds:gerer` **et** `ged:sensible:consulter`.
    File BullMQ neuve `ged-exports` ; variable neuve **`GED_EXPORT_VOLUME_OCTETS`** (défaut 50 000 000). Volumes ZIP
    sans compression : les fichiers en clair, et un volume d'index (`index.json`, `index.csv`, `bordereaux.json`,
    `journal-integrite.json`, `controle-integrite.json`, `originaux-papier.json`, documents probants, `empreintes.sha256`
    pour `sha256sum -c`) ; un certificat d'intégrité neuf quand le fonds le permet. Refus neufs : `404 EXPORT_INCONNU`,
    `VOLUME_INCONNU`, `409 EXPORT_NON_TERMINE`, `409 INTEGRITE_EN_ECART`, `503 FILE_INDISPONIBLE`, `503
    JOURNAL_INDISPONIBLE`.
  - **Bordereau de restitution** : `POST …/exports/{numero}/bordereau-de-restitution` `{ remisA, remisLe, moyen:
    TELECHARGEMENT | SUPPORT_REMIS, observation? }` → 201, document probant de type neuf **`BORDEREAU_DE_RESTITUTION`**
    (`BRN-AAAA-NNNNN`, PDF par `GET …/documents-probants/{numero}/pdf`) ; `POST …/documents-probants/{numero}/exemplaire-signe`
    (multipart `fichier`, `signePar`, `signeLe`) → 201, `GET …/documents-probants/{numero}/exemplaire-signe`. Le document
    probant gagne `exemplaireSigne?`. Refus neufs : `409 EXPORT_AVANT_FERMETURE`, `BORDEREAU_DEJA_EMIS`,
    `EXEMPLAIRE_NON_ATTENDU`, `EXEMPLAIRE_DEJA_DEPOSE`, `404 EXEMPLAIRE_ABSENT`.
  - **Journal d'intégrité** : actes neufs `FERMETURE`, `EXPORT`, `EXPORT_TELECHARGE`, `EXEMPLAIRE_SIGNE` (l'énumération
    `acte` de l'OpenAPI s'élargit) ; `DOCUMENT_EMIS` porte aussi le bordereau de restitution.
  - Collection neuve `ged_exports_fonds` ; champs neufs `fermeture` (`ged_fonds_cabinet`), `exemplaireSigne`
    (`ged_documents_probants`). **Aucun droit neuf** : auth et la table d'accès du cabinet inchangés. **Aucun fait Kafka
    publié** ; un topic existant consommé en plus. Aucune dépendance neuve. **`dossier-service` inchangé** (il publie
    déjà `statut: ARCHIVE` sur `dossier.updated`).
  - **Manifeste `ged` 1.5.0** (`manifestes/ged.manifest.ts`, cette PR) : `consomme` gagne `dossier.updated` ; quatre
    routes `GET` neuves en `routesLectureSeule` ; recopié dans le service par le code, **puis au catalogue par B** après
    la fusion du code. **→ A (FE-143)** : types à régénérer depuis l'OpenAPI de `document-service` quand l'écran
    viendra. **Pour C et D** : rien.
  - **Livré le 25/11** : document-service #34 (`b92ac18`), catalogue #78 (`ea10b51`, `ged` 1.5.0 au catalogue). Au code,
    ajouts seuls (D-1120-10, 11) : `fermeture.journalRang`, `exportNumero` d'un document probant ; DTO de réponse
    `…ReversibiliteDto`, `ExemplaireSigneProbantDto`.

- **2026-11-25, STORY-1119 — les archives ont valeur de preuve, annoncé AVANT le code** (`document-service`, GitHub
  `prospera-ocr-service`, branche `MNV-1119` ; fiche `stories/STORY-1119.md`, D-1119-1 → 11). **Ajouts seuls**, sous
  `/api/v1/ged/cabinet` ; le chemin de l'assurance ne change pas.
  - **Journal d'intégrité chaîné, un par cabinet** : entrées `{ rang, le, acte, acteurId, fondsNumero?, pieceId?,
    version?, details, precedente, empreinte }` (SHA-256 de la forme canonique ; 64 zéros avant la première). Actes :
    `VERSEMENT`, `SCELLEMENT`, `VERIFICATION`, `CONTROLE_PERIODIQUE`, `CONSULTATION_SENSIBLE` (contenu ou texte lu d'une
    nature sensible), `DOCUMENT_EMIS`. `GET …/journal-integrite?depuisRang=&limite=&fondsNumero=`, `GET
    …/journal-integrite/verification` (`rupture: { rang, raison }`, raisons `EMPREINTE_FAUSSE`, `LIEN_ROMPU`,
    `RANG_MANQUANT`). **Refus neuf** : `503 JOURNAL_INDISPONIBLE` sur le contenu ou le texte d'une pièce sensible quand
    l'entrée ne peut pas s'écrire.
  - **Contrôle périodique des empreintes** : file BullMQ `ged-integrite`, planificateur `ged-controle-integrite`,
    variable neuve **`GED_CONTROLE_INTEGRITE_MOTIF`** (cron, défaut `0 3 * * *` UTC, `AUCUN` le coupe). `POST
    …/controles-integrite` (202), `GET …/controles-integrite`, `GET …/controles-integrite/{campagneId}`, `GET
    …/fonds/{numero}/controles-integrite`. Écarts nommés : `FICHIER_MODIFIE`, `FICHIER_ABSENT`, `VERSION_AJOUTEE`, et
    **deux neufs** `SCELLE_MODIFIE`, `LIEN_ROMPU` (aussi dans la réponse de `POST …/fonds/{numero}/verification`, sans
    `pieceId` ni `version`) ; `JOURNAL_ROMPU` au niveau d'une campagne.
  - **Documents probants figés** (NFR-4) : `POST …/fonds/{numero}/bordereaux/{rang}/attestation-de-numerisation`
    (`ATT-AAAA-NNNNN`), `POST …/fonds/{numero}/certificat-d-integrite` (`CERT-AAAA-NNNNN`), `GET
    …/fonds/{numero}/documents-probants`, `GET …/documents-probants/{numero}/pdf` (`attachment`, `X-Empreinte-Sha256`).
    Refus neufs : `409 BORDEREAU_NON_SCELLE`, `409 AUCUN_SCELLE`, `409 INTEGRITE_EN_ECART` (`details.ecarts`), `409
    JOURNAL_ROMPU`.
  - Collections neuves `ged_journal_integrite`, `ged_journal_integrite_tetes`, `ged_campagnes_integrite`,
    `ged_controles_integrite`, `ged_documents_probants`. **Aucun droit neuf** (`ged:fonds:gerer` lit et émet,
    `ged:versement:verser` lance un contrôle) : **auth et la table d'accès du cabinet inchangés**. **Aucun fait Kafka
    neuf.** Aucune dépendance neuve.
  - **Manifeste `ged` 1.4.0** (`manifestes/ged.manifest.ts`, cette PR) : sept routes `GET` neuves en
    `routesLectureSeule` ; recopié dans le service par le code, **puis au catalogue par B** après la fusion du code
    (suite de 1119). **→ A (FE-143)** : types à régénérer depuis l'OpenAPI de `document-service` quand l'écran viendra.
    **Pour C et D** : rien.
  - **Livré le 25/11** : document-service #33 (`b7b3f91`), catalogue #77 (`f4fcee0`, `ged` 1.4.0 au catalogue : un
    catalogue neuf le sème, un catalogue semé le reçoit à son prochain démarrage). Au code, deux ajouts au contrat
    (D-1119-12, 13) : le CORS du service **expose** `X-Empreinte-Sha256` et `Content-Disposition` ; les dix routes
    neuves ont leurs DTO de réponse à l'OpenAPI (`…IntegriteDto`, `DocumentProbantDto`).

- **2026-11-25, quatrième suite de STORY-979 — le manifeste `balance` 1.2.0 publié au catalogue, annoncé AVANT la
  fusion du code** (`prospera-platform-catalog-service`, branche `MNV-979-manifeste-balance`, PR #76 ; fiche
  `stories/STORY-979.md`, « Quatrième suite (2026-11-25) », D-979-29 → 34 ; demande de C, STORY-1020). Aucune route,
  aucun champ, aucun topic du catalogue ne change de forme ; aucun droit ne change.
  - **`copies.json`** recopié depuis `prospera-stories@ac8e450` (sha256 de `manifestes/balance.manifest.ts` :
    `44f89c99…d8fefe`) ; seul un manifeste change : **`balance` 1.1.0 → 1.2.0**, `GET
    /api/v1/dossiers/{dossierId}/rapprochement/etat/export` en `routesLectureSeule` (servie par balance-service #165,
    fusionné). Ses dix `droits` inchangés. La copie entière n'entraîne rien d'autre (seul `bdf7218` touche
    `manifestes/` depuis `bd9340e`, la copie de #75).
  - La garde contre `main` redevient verte (48) : la réserve de D-979-24 est levée.
  - **Auth inchangé.** **Pour C** : un catalogue neuf sème la 1.2.0 ; un catalogue déjà semé la reçoit à son prochain
    démarrage (D-979-13). **Pour A et D** : rien à régénérer.

- **2026-11-25, correctif de STORY-1115 — la pile de recette sème ses paquets fiscaux, annoncé AVANT la fusion du
  code** (`prospera-recette`, branche `MNV-1115-paquets-fiscaux`, PR #32 ; fiche `stories/STORY-1115.md`, « Correctif
  du 2026-11-25 », D-1115-13 → 18 ; demande de C, STORY-326). Le paquet de recette, que les quatre groupes lancent,
  change de comportement ; aucun compose, aucun service, aucune route ne change.
  - **`npm run pile`** : quand `RECETTE_SURCOUCHES` contient `docker-compose.fiscal.yml`, la pile dépose
    `fiscal-tg-entreprise@2026.1` et `fiscal-tg-entreprise-zone-franche@2026.1` au catalogue du réel
    (`referentiel-packages`), avec les octets de `balance-service` (`RECETTE_BALANCE_SERVICE`, sinon le dépôt à
    côté), en LF. Sans le fiscal, rien ne change.
  - **Recettes qui lèvent l'essai** (`essai-mise-en-service`, `cinq-essais`) : les mêmes paquets sont déposés au
    catalogue de l'essai (`referentiel-packages-essai`).
  - **Commande neuve** : `npm run paquets-fiscaux -- reel|essai` dépose les paquets sur une pile levée à la main (un
    gate de groupe). Elle sort en `1` si la pile en porte d'autres octets.
  - **Refus neuf** : un `409` sur d'autres octets (une pile dont les volumes ont survécu à un changement du paquet) est
    `PERIME`, et la pile ou la recette s'arrête avec la consigne `down -v`. Avant, `zone-franche` l'acceptait en silence.
  - **Pour C et D** : un gate qui lève le fiscal par `docker compose` sans le paquet de recette doit jouer
    `npm run paquets-fiscaux -- reel` après l'amorçage, sinon le fiscal n'a aucun pointeur. **Pour A** : rien.

- **2026-11-25, correctif de STORY-917 — le CORS du BFF `admin-panel`, annoncé AVANT la fusion du code**
  (`prospera-admin-panel-service`, branche `MNV-917-cors`, PR #44 ; fiche `stories/STORY-917.md`, « Correctif du
  2026-11-25 », D-917-4 → 8 ; demande de A, AP-55). Le CORS fait partie du contrat que la console consomme. **Ajouts
  seuls** : aucune route, aucun champ, aucun schéma OpenAPI ne change ; l'allowlist d'origines (`CORS_ALLOWED_ORIGINS`),
  la liste vide ⇒ CORS non activé, `credentials: false` et les méthodes ne bougent pas.
  - **`Access-Control-Allow-Headers`** : `Authorization,Content-Type,If-Match` ⇒
    **`Authorization,Content-Type,If-Match,Idempotency-Key,X-Request-Id`**. `Idempotency-Key` : le lancement d'une
    installation (`POST /api/v1/admin/orgs/{orgId}/installations`), relayé tel quel au catalogue (une clé déjà vue
    rejoue le même plan, `200` ; une clé réemployée pour une autre demande : `409 CLE_IDEMPOTENCE_REUTILISEE`).
    `X-Request-Id` : facultatif, il nomme la requête dans les journaux du BFF (sinon le BFF en tire un) ; il n'est pas
    relayé aux amont.
  - **`Access-Control-Expose-Headers: Retry-After`** (neuf) : posé par le garde de débit du BFF sur son propre `429`
    (secondes) ; la console peut le lire par `response.headers.get('Retry-After')`. Les `X-RateLimit-*` restent
    illisibles du navigateur (D-917-6). Un `429` d'un amont (le quota d'auth sur les relances) n'en porte toujours pas.
  - **Pour A** : `Idempotency-Key` peut partir du navigateur (`installation-client.ts` le retire aujourd'hui, à cause
    de ce refus) ; rien à régénérer (aucune OpenAPI ne change). **Pour C et D** : rien.

- **2026-11-25, correctif de STORY-1073 — `formeJuridique` publiée sur les dossiers CLIENTS aussi, annoncé AVANT la
  fusion du code** (`prospera-dossier-service`, branche `MNV-1073-clients`, PR #59 ; fiche `stories/STORY-1073.md`,
  « Correctif du 2026-11-25 », D-1073-13 → 17 ; demande de D, STORY-1077). **Ajout seul** : aucun champ, aucune route,
  aucun topic n'est renommé ni retiré.
  - **`DossierEtatV1`** (`dossier.created`, `dossier.updated` ; `schemaVersion` **1 inchangé** ; aucun schéma de
    registre) : **`formeJuridique`** (`SA`, `SARL`, `SAS`, `SUARL`, `EI`, `AUTRE`, telle qu'elle est stockée, `AUTRE`
    compris) est désormais **présente sur tout dossier**, client compris — elle n'était publiée que sur le dossier
    propre (`estLeCabinet: true`, D-1073-2). Clé absente, jamais `null` ni vide, si le dossier n'en porte pas (la base
    l'exige : en pratique toujours présente). **Les huit autres champs de la fiche légale** (`sigle`, `nifSociete`,
    `rccm`, `numeroCnss`, `capitalSocial`, `adresse`, `telephone`, `email`) **restent sur le seul dossier propre**.
  - **Mêmes charges servies par HTTP** : les réponses du moteur de démonstration (`PUT
    /api/v1/instance/dossier/{organisationId}/dossiers-de-demonstration/{dossierRef}` et `…/exercices`, STORY-1082)
    portent `etatPublie` et gagnent donc la clé (D-1073-17). Aucune route du cabinet ni de la console ne change.
  - **Rejeu** : `npm run republier:dossiers` (STORY-696) republie la forme des dossiers clients existants, à leur version
    courante ; à jouer une fois sur un environnement durable après le déploiement (aucune pile semée sur ce poste,
    D-1073-15).
  - **Pour D (bilan)** : rien à changer ; un dossier client rend `formeJuridique.statut: CONNUE` dès son prochain
    `dossier.*` (ou la republication). **Pour C (balance, comptabilité, fiscal, document)** et les autres consommateurs
    de `dossier.*` (ventes, microfinance) : rien à faire, ils lisent nommément ; `facturation` ignore toujours un dossier
    client. **Pour A** : rien à régénérer (aucune OpenAPI du BFF ni du cabinet ne change).

- **2026-11-25, troisième suite de STORY-979 — les manifestes `facturation` 1.2.0, `paiement` 1.1.0 et `balance`
  1.1.0 publiés au catalogue, annoncés AVANT la fusion du code** (`prospera-platform-catalog-service`, branche
  `MNV-979-manifestes-facturation-paiement`, PR #75 ; fiche `stories/STORY-979.md`, « Suite du 2026-11-25 »,
  D-979-23 → 28). Aucune route, aucun champ, aucun topic du catalogue ne change de forme ; aucun droit ne change.
  - **`copies.json`** recopié depuis `prospera-stories@bd9340e` (sha256 de `manifestes/facturation.manifest.ts` :
    `b7b9e0c8…1bd933`, celle que D nomme ; de `paiement.manifest.ts` : `11685333…58ab2f` ; de `balance.manifest.ts` :
    `097fa17e…cd6b0f`) ; seuls trois manifestes changent :
    - **`facturation` 1.1.0 → 1.2.0** : consomme `paiement.compte.changed@1`, `dossier.created`, `dossier.updated`.
      Ses huit `droits`, ses routes inchangés.
    - **`paiement` 1.0.0 → 1.1.0** : publie `paiement.compte.changed@1`. Ses droits, ses routes inchangés.
    - **`balance` 1.0.0 → 1.1.0** (← C, STORY-1117) : `GET /api/v1/dossiers/{dossierId}/balances/reference` et
      `…/balances/resumes`. La **1.2.0** de `main` (STORY-1020, code non fusionné) n'est pas copiée : la garde contre
      `main` reste rouge sur `balance` seul jusqu'à sa recopie (D-979-24).
  - **Auth inchangé.** **Pour D et C** : un catalogue neuf sème ces versions ; un catalogue déjà semé les reçoit à son
    prochain démarrage (D-979-13). **Pour A** : rien à régénérer.

- **2026-11-24 au soir, seconde suite de STORY-979 — les manifestes `ged` 1.3.0 et `comptabilite` 0.5.0 publiés au
  catalogue, annoncés AVANT la fusion du code** (`prospera-platform-catalog-service`, branche
  `MNV-979-manifestes-ged-comptabilite`, PR #74 ; fiche `stories/STORY-979.md`, « Suite du 2026-11-24 (soir) »,
  D-979-17 → 22). Aucune route, aucun champ, aucun topic du catalogue ne change de forme ; aucun droit ne change.
  - **`copies.json`** recopié depuis `prospera-stories@f703671` (sha256 de `manifestes/ged.manifest.ts` :
    `d40d604d…2f0626` ; de `manifestes/comptabilite.manifest.ts`, identique à `a525d76` : `b129d891…63538c`) ; seuls
    deux manifestes changent :
    - **`ged` 1.1.0 → 1.3.0** (semée à côté de la 1.1.0 sur une base déjà semée ; la 1.2.0 n'est jamais semée) :
      consomme `comptabilite.facture.inscrite` ; quatorze routes de lecture du cabinet de plus (réceptions et leur
      bordereau, boîtes et leur étiquette, sorties, récolements, restitutions et leur bordereau, recherche, suggestion,
      mémoire de classement d'un fonds et du cabinet). Ses vingt `droits` inchangés.
    - **`comptabilite` 0.4.0 → 0.5.0** : publie `comptabilite.facture.inscrite` (sans suffixe, comme le code des deux
      services). Ses neuf `droits`, ses routes inchangés.
  - **Auth inchangé** : les neuf `comptabilite:*` et les sept `ged:*` du cabinet y sont déjà ; les treize `ged:*` de
    l'assurance (depuis la 1.0.0) n'y sont pas et n'y entrent pas ici (D-979-19, « → C »).
  - **Pour C** : un catalogue neuf sème `ged` 1.3.0 et `comptabilite` 0.5.0 ; un catalogue déjà semé les reçoit à son
    prochain démarrage. **Pour A** : rien à régénérer (aucune forme du BFF ni du catalogue ne change).
  - **Fusionné le 24/11** : catalogue #74 (`1aa17ae` sur `dev`), sans écart au contrat annoncé.

- **2026-11-24, suite de STORY-1112 — le premier membre d'un essai, annoncé AVANT la fusion** (`prospera-auth-service`,
  `prospera-platform-catalog-service`, `prospera-admin-panel-service`, `prospera-recette`, branches
  `MNV-1112-premier-membre` ; fiche `stories/STORY-1112.md`, « Suite du 2026-11-24 », D-1112-10 → 18). **Ajouts et une
  ouverture bornée** : aucune route, aucun champ, aucun topic existant ne change de nom ni de type.
  - **auth** — `PUT /api/v1/interne/organisations/{id}/invitations` (identité du moteur) : dans l'espace d'**essai**,
    la demande du **premier administrateur** (un seul membre, `role: TENANT_ADMIN`, aucun autre administrateur actif dans
    l'organisation) est servie (201, ou 200 rejouée : `EXISTANT`) ; tout le reste y reste 403 `ESPACE_D_ESSAI_REFUSE`
    (avant la lecture du corps, sauf l'organisation déjà pourvue, refusée après lecture sans rien écrire). Le réel ne
    change pas. Son e-mail part par la notification de l'espace d'essai. Résumé et description OpenAPI de la route
    complétés.
  - **catalogue** — `contrat/essai-prospect.openapi.json` **1.1.0 → 1.2.0** (ajouts facultatifs) :
    `OrdreDOuverture.identiteAdministrateur { prenom, nom, roleMetier? }` ; `EssaiProspect.invitationAdministrateur {
    userId, etat: ENVOYEE | A_REPRENDRE | INTERCEPTEE | REFUSEE, le?, code?, motif?, interceptionId? }`. À l'ouverture
    (et à l'ordre rejoué tant que l'état n'est pas `ENVOYEE`), l'administrateur est invité chez l'auth de l'essai sous
    un identifiant tiré de l'organisation, **après la liste blanche de l'essai** (hors liste : `INTERCEPTEE`, rien ne
    part). Le journal des interceptions peut porter `module: essai`, `demandeePar: service:moteur`.
  - **BFF (OpenAPI : A génère ses types)** — `POST /api/v1/admin/essais` : `identiteAdministrateur` facultatif
    (`EssaiIdentiteAdministrateurDto`) ; `EssaiDto.invitationAdministrateur` facultatif
    (`EssaiInvitationAdministrateurDto`, énumération `EtatDInvitationDeLAdministrateurDEssai`), rendu par toutes les
    routes qui rendent un essai. Aucune route neuve.
  - **recette (profil, lu par qui lance la pile)** — `auth-essai` reçoit `NOTIFICATION_BASE_URL`
    (`http://host.docker.internal:${RECETTE_SORTIE_ESSAI_PORT:-18026}`), `NOTIFICATION_JETON_SERVICE` et `extra_hosts:
    host-gateway` : la sortie de messages de l'essai, tenue par la recette (`src/sortie-de-l-essai.ts`). **Le port 18026
    doit être libre** sur le poste qui joue `essai-mise-en-service`. Garde neuve `src/recettes-sans-base.spec.ts`.
  - **→ A (AP-57, lot 7)** : nommer l'administrateur du prospect à l'ouverture (prénom, nom, rôle métier) et montrer
    l'issue de son invitation (`INTERCEPTEE` ⇒ mettre son adresse ou son domaine en liste blanche, puis rejouer
    l'ouverture) ; écrit à la fin de la suite (« Réponses »).
  - **Fusionné le 24/11** : auth #50 (`d69e34c`), catalogue #73 (`0894425`), admin-panel #43 (`911c450`), recette #30
    (`c99257a`), **sans écart au contrat annoncé**.

- **2026-11-24, STORY-1115 (lot 6, n° 6) — le second espace dans le profil de recette, annoncé AVANT la fusion**
  (`prospera-recette`, branche `MNV-1115` ; fiche `stories/STORY-1115.md`, D-1115-1 → 11). Aucun service, aucune
  route, aucun topic ne change. Ce qui change pour qui **lance** la pile de recette :
  - `docker-compose.recette.yml` : quatre services **neufs, levés à la demande** (`profiles: ['recette']`, comme la
    comptabilité) : `kafka-essai`, `redis-essai` (sans port publié, sans volume), `auth-essai`
    (`127.0.0.1:3021`, base `auth_essai`, `INSTANCE_ESPACE=ESSAI`) et `catalogue-essai` (`127.0.0.1:3023`, base
    `catalog_essai`). La pile de base reste à cinq services.
  - `auth-service` : `JWT_SIGNING_KEY_PEM` et `JWT_SIGNING_KID`, interpolées de `RECETTE_CLE_COMMUNE_PEM` et
    `RECETTE_CLE_COMMUNE_KID`, **vides par défaut** (auth tire alors sa clé, comme aujourd'hui). Le paquet de
    recette les tire une fois dans `prospera-recette/.recette/` (non versionné) : l'identité de l'opérateur commune
    aux deux espaces (D-1113-2, choix par défaut gardé). ⚠️ Sur des volumes conservés, auth garde la clé de son
    premier démarrage.
  - `admin-panel` (BFF) : `CATALOG_ESSAI_SERVICE_URL` et `AUTH_ESSAI_SERVICE_URL` vers l'essai de la pile : les
    routes d'essai du BFF (`/admin/essais`, `/admin/sorties-essai`, la lecture des membres de l'essai) vont à
    `catalogue-essai` et `auth-essai` ; les autres ne changent pas.
  - Recette neuve `essai-mise-en-service` (dans `npm run recette`, sautée en `RECETTE_ESPACE=ESSAI`).
  - **Fusionné le 24/11** : recette #28 (`af13aac` sur `dev`), **sans écart au contrat annoncé** ; puis #29
    (`b38b268`) : le transport de la recette envoie `connection: close` (D-1115-12, rien de visible pour qui lance
    la pile, sinon des recettes qui ne meurent plus en `ECONNRESET`).

- **2026-11-24, STORY-1103 (lot 6, n° 5) — renvoyer un dossier KYC pour correction, annoncé AVANT le code (AC-1)**
  (`prospera-kyc-service` et `prospera-admin-panel-service`, branches `MNV-1103` ; fiche `stories/STORY-1103.md`,
  D-1103-1 → 10). **Ajouts seuls** : aucune route, aucun champ, aucun topic existant ne change de nom ni de type ; le
  rejet global ne change pas (`reason` obligatoire, 1 000 au plus).
  - **kyc** : corps **facultatif** `{ motif? }` (500 au plus, rogné, vide ⇒ absent) sur `POST
    /admin/kyc/:orgId/documents/:documentId/reject` ; **`POST /admin/kyc/:orgId/request-correction`** (`kyc:reject`,
    `If-Match` obligatoire, corps facultatif `{ message? }`, 1 000 au plus) → `AdminKycReviewItemDto` ; refus 404, 428
    `PRECONDITION_REQUISE`, 409 `KYC_DECISION_CONFLIT` (`details`), **409 `RENVOI_SANS_PIECE_A_CORRIGER`**, 400.
    Champs neufs facultatifs : `motifRenvoi` (pièce, cabinet et console), `correctionDemandeeLe` (détail admin et
    `GET /kyc/status`), chronologie : type **`RENVOI_CORRECTION`**, `message?`, `texte?`, `piecesRenvoyees?`.
  - **Machine à états** : arc neuf **`UNDER_REVIEW → PENDING_DOCUMENTS`**, publié sur **`kyc.status.changed`**
    (`reviewedBy` présent). Les consommateurs relus n'ouvrent leur garde que sur `APPROVED` : aucun ne change. Le
    dossier ne repasse en revue que lorsque toutes les pièces renvoyées sont remplacées (journal `RESOUMISSION`).
  - **Topic neuf `kyc.correction.requested` v1** (clé `orgId`, outbox, une fois par renvoi, même transaction) :
    `schemaVersion`, `eventId`, `occurredAt`, `orgId`, `demandeLe`, `demandePar`, `message?`, `pieces[]` (≥ 1 ;
    `documentId`, `type` `RCCM` | `CFE`, `libelle`, `version`, `motifRenvoi?`), `texte`. Modèle fermé ; schéma au
    dépôt (`contrat/schemas/`), sujet `kyc.correction.requested-value`, BACKWARD. Consommateur : demandé à D
    (« Demandes »).
  - **BFF, OpenAPI** (A génère ses types depuis lui) : corps facultatif `RejeterPieceKycRequestDto { motif? }` sur
    `POST /api/v1/admin/orgs/{orgId}/kyc/documents/{documentId}/reject` ; **`POST
    /api/v1/admin/orgs/{orgId}/kyc/request-correction`** (`kyc:reject`, `If-Match` relayé,
    `DemanderCorrectionKycRequestDto { message? }`) → `KycDecisionResultDto` ; refus par leur code (409
    `RENVOI_SANS_PIECE_A_CORRIGER`, 409 `KYC_DECISION_CONFLIT` avec `details`, 428, 400, 403, 404, 503). Détail du
    dossier : `KycDocumentDto` gagne `reviewStatus`, `reviewedAt?` (servis depuis STORY-128, jamais publiés) et
    `motifRenvoi?` ; `KycDetailDto` gagne `correctionDemandeeLe?` ; `KycEvenementDossierDto` gagne le type
    `RENVOI_CORRECTION`, `message?`, `texte?`, `piecesRenvoyees?` (`KycPieceRenvoyeeDto`) ; `KycDocumentReviewDto`
    gagne `motifRenvoi?`.
  - **Pour A (AP-62)** : types à régénérer depuis l'OpenAPI du BFF ; l'aperçu « Ce que lira le cabinet » est le
    `texte` que kyc compose (D-1103-5) ; un dossier renvoyé sort de la file `UNDER_REVIEW`.
  - **Fusionné le 24/11** : kyc #29 (`9cef9cb` sur `dev`), BFF #42 (`c451b17`), **sans écart au contrat annoncé**.
    Deux précisions de comportement : le refus `RENVOI_SANS_PIECE_A_CORRIGER` est rendu **avant toute écriture** ; un
    dossier déjà sorti de revue **et** sans pièce rejetée reçoit le refus commun (409 `KYC_DECISION_CONFLIT`, qui
    nomme la décision gagnante), pas `RENVOI_SANS_PIECE_A_CORRIGER`. Schémas neufs au document du BFF :
    `KycPieceRenvoyeeDto`, `RejeterPieceKycRequestDto`, `DemanderCorrectionKycRequestDto`.

- **2026-11-24, correctifs de STORY-483 et de STORY-065 (lot 6, tickets de A avant la démo du 15/01) — annoncés
  AVANT la fusion du code** — **fusionnés** : bilan #184 (`d98b7c4`) et #185 (`7b53ff5`) ; document OpenAPI 579 →
  581 schémas (deux ajoutés, aucun retiré), 98 chemins identiques, aucun champ requis ajouté (`prospera-bilan-service`, branches `MNV-483-remboursements` et `MNV-065-rouverte` ;
  tickets `TICKET-BACKEND-projection-remboursements-non-plafonnes.md` et `TICKET-BACKEND-liasse-rouverte-version-null.md` ;
  fiches `stories/STORY-483.md` et `stories/STORY-065.md`, « Correctif du 2026-11-24 »). **Ajouts facultatifs
  seulement** : aucune route, aucun champ existant ne change de nom ni de type, aucun appelant actuel n'est cassé.
  - **Projection (correctif de STORY-483)** : un remboursement saisi au-delà de l'**encours restant** (dette de la
    base + emprunts nouveaux − déjà remboursé) est **ramené à l'encours** ; la dette financière projetée ne devient
    plus négative par cette porte. Aucun plafond quand l'encours n'est pas connu (dette de la base non ancrée,
    ventilation indéterminée) ni sur le chemin du dossier de financement (les échéanciers de STORY-1084 font foi).
    - `GET …/bilan/hypotheses/{id}/projection` et `…/projection-mensuelle` : champ neuf **`avertissements`**
      (facultatif au contrat, toujours servi, vide quand rien n'est à dire) → schéma neuf
      **`AvertissementProjectionDto`** `{ code, message, rang, libelle, exercice, remboursementSaisi,
      encoursAvantRemboursement, remboursementRetenu, excedentNonRembourse }`, énumération nommée neuve
      **`CodeAvertissementProjection`** = `REMBOURSEMENT_PLAFONNE`. Le mensuel republie ceux de son exercice, et sa
      ligne `remboursements` répartit le remboursement **retenu** (l'articulation reste nulle).
    - Comparaison (`…/hypotheses/comparaison`) : **`CodeAvertissementComparaison` gagne `REMBOURSEMENTS_PLAFONNES`**
      (énuméré déclaré ouvert, D-476-5), `hypothesesIds` = les scénarios écrêtés.
    - **`modeleVersion` 1.13.0 → 1.14.0** (doctrine du modèle : la valeur produite change, le tampon aussi). Seuls
      les jeux qui remboursaient au-delà de l'encours changent de montants (trésorerie, financement net cumulé,
      dette, ratios) ; tous les autres rendent les chiffres de 1.13.0 au franc.
    - Export du prévisionnel : une métadonnée neuve « Remboursements » (« Tels que saisis », ou les écrêtements).
  - **Liasse (correctif de STORY-065)** : sur un jeu **rouvert**, `version` rend la **dernière version figée** (celle
    que `POST …/rouvrir` rend déjà), comme le DTO le documente depuis STORY-065 (« null si jamais validé »).
    - `GET …/bilan/etats/{id}`, `POST …/{id}/recalculer`, `PUT …/{id}/complements` : `version` passe de `null` à la
      dernière version figée sur un brouillon rouvert ; inchangé ailleurs (`origine` dit toujours d'où sort la liasse).
    - `GET …/bilan/etats` (liste) : champ neuf **`version`** (facultatif, nullable, même sens) dans
      `JeuEtatsSommaireDto`, lu en une agrégation.
    - **Inchangés en sens** : `source.version` de l'analyse et `vue.version` de la consultation restent la version
      **servie** (`null` pour un brouillon, même rouvert).
  - **→ A** : régénérer `bilan.ts` après la fusion ; l'écran de FE-034 peut retirer son contournement (« Demandes »).

- **2026-11-24, STORY-1114 (lot 6, n° 4) — le métier des organisations relayé à la console (AP-59), annoncé AVANT la
  fusion du code** (`prospera-admin-panel-service`, branche `MNV-1114` ; fiche `stories/STORY-1114.md`, D-1114-1 → 9).
  **Ajouts seuls** : aucune route, aucun champ, aucun code existant ne change de forme ; auth ne change pas (il sert
  déjà tout, STORY-171).
  - **BFF, OpenAPI** (A génère ses types depuis lui) : `vertical` (facultatif, code du service : `cabinet`,
    `distributeur`, `imf-sfd`, `assurance-cima`, `plateforme`…) dans `AdminOrgListItemDto` (`GET /api/v1/admin/orgs`)
    et dans `OrganizationDetailDto` (`identity` de `GET /api/v1/admin/orgs/{orgId}`, où il arrivait déjà sans être
    publié) ; paramètre facultatif **`vertical`** de `GET /api/v1/admin/orgs` (appliqué en base par auth, avec les
    autres filtres) ; **`GET /api/v1/admin/verticaux`** (`org:read`) → `VerticauxDto { verticaux: VerticalDto[] }`,
    `VerticalDto` = `code`, `libelle`, `statut` (`actif` | `a_venir`), `inscriptionOuverte`, `description?` ;
    **`PATCH /api/v1/admin/orgs/{orgId}/vertical`** (`entitlement:grant`, corps `ChangerDeMetierRequestDto { vertical,
    reason? }`) → `OrganizationDetailDto` (l'identité, métier changé). Le chemin est celui des actions d'une
    organisation au BFF (`admin/orgs/{orgId}/…`), pas `admin/organizations` d'auth (D-1114-3).
  - **Refus par leur code** (liste fermée, D-1114-6) : 400 `VERTICAL_INCONNU`, `VERTICAL_REQUIS` (liste filtrée et
    changement ; sur la liste, au lieu du 503 d'aujourd'hui) ; 409 `VERTICAL_ROLES_INCOMPATIBLES` avec
    **`details.roles`** (les rôles de tenant en cause). 403, 404 (sans code) et 503 comme toujours.
  - **Pour A (AP-59, lot 7)** : types à régénérer depuis l'OpenAPI du BFF ; les mots courts restent une table de
    l'écran indexée par `code` ; `statut` est en minuscules (`actif`, `a_venir`), pas `ACTIF` comme dans la maquette.
  - **Fusionné le 24/11** : BFF #41 (`3a5f5ef` sur `dev`), sans écart au contrat annoncé.

- **2026-11-24, STORY-1113 (lot 6, n° 3) — la mise en service relayée à la console, annoncée AVANT la fusion du
  code** (`prospera-platform-catalog-service` et `prospera-admin-panel-service`, branches `MNV-1113` ; fiche
  `stories/STORY-1113.md`, D-1113-1 → 9). **Ajouts seuls** : aucune route, aucun champ, aucun code existant ne change
  de forme.
  - **Catalogue, contrat `contrat/mise-en-service.openapi.json` 1.1.0 → 1.2.0** : `POST
    /api/v1/sorties-essai/liste-blanche/verification` (`org:read`, corps `Destination`) : la décision de la liste
    blanche de l'espace pour une destination, **sans journal** ; toujours 200, `{ autorisee: true, motif: REEL |
    LISTE_BLANCHE }` ou `{ autorisee: false, code: ECRITURE_REELLE_DEPUIS_ESSAI }` (D-1113-6).
  - **BFF, OpenAPI** (A génère ses types depuis lui) : `GET /api/v1/admin/naissances/{orgId}` (`org:read`, la
    naissance de chaque espace, `NaissancesDto`) et `POST /api/v1/admin/naissances` (`entitlement:grant`, naissance au
    réel, identité reprise de l'essai si l'ordre n'en donne pas ; 201 / 200 ; 422 `PROSPECT_SANS_NAISSANCE_D_ESSAI`) ;
    `GET /api/v1/admin/mises-en-service/{orgId}` (les bilans), `GET …/{orgId}/invites` (les membres de l'essai qui
    partiront), `POST …/{orgId}` (`{ modules, reprendreLesMembres? }`, 201 / 200 ; 422 `TROP_DE_MEMBRES_A_INVITER`) ;
    `GET`/`POST /api/v1/admin/sorties-essai/liste-blanche`, `DELETE …/liste-blanche/{id}` (204), `POST
    …/liste-blanche/verification`, `GET /api/v1/admin/sorties-essai/{orgId}/interceptions`. Schémas : `NaissanceDto`,
    `NaissancesDto`, `NaissanceEtapeDto`, `NaitreAuReelRequestDto`, `MiseEnServiceDto`, `MisesEnServiceDto`,
    `MiseEnServiceAttenduDto`, `MiseEnServiceInvitationsDto`, `MiseEnServiceInvitesDto`, `MiseEnServiceInviteDto`,
    `MettreEnServiceRequestDto`, `SortieDEssaiDto`, `SortiesDEssaiDto`, `AjouterSortieDEssaiRequestDto`,
    `DestinationDEssaiRequestDto`, `VerificationDeSortieDto`, `InterceptionDEssaiDto`, `InterceptionsDEssaiDto`.
    Refus par leur code (liste fermée, D-1113-7), avec `modules` (codes en cause) et `champs` quand l'amont les donne.
  - **BFF, déploiement** : deux variables **facultatives**, `CATALOG_ESSAI_SERVICE_URL` et `AUTH_ESSAI_SERVICE_URL`
    (défaut : celles du réel, `CATALOG_SERVICE_URL`, `AUTH_SERVICE_URL`). Posées, les routes `/admin/essais` (1112) et
    `/admin/sorties-essai` vont à l'essai, la mise en service et la naissance au réel au réel. Condition : le jeton de
    l'opérateur est accepté par les services des deux espaces (D-1113-2).
  - **Pour A (AP-56)** : types à régénérer depuis l'OpenAPI du BFF quand l'écran viendra (maquette d'abord).
  - **Amendement du 24/11, avant la fusion (D-1113-10, trouvé par la preuve sur pile)** : les précisions d'un refus
    relayé vont dans **`details`** (`details.modules`, `details.champs`), pas à côté du code : l'enveloppe d'erreur du
    BFF (`AllExceptionsFilter`) ne garde que `code` et `details`. **Même correction pour le relais du moteur
    d'installation** (917, 1080 : `POST /admin/orgs/{orgId}/installations`, `…/reprendre`, l'offre) : `modules`,
    `refus` et `planId` d'un refus passent désormais dans `details` — avant, ils étaient retirés sans bruit et
    n'atteignaient jamais la console, qui les lit déjà là (`frontend-admin-panel`, `grant-errors.ts`, `details.refus`,
    `details.modules`). Le `code` et le statut ne changent pas.
  - **Fusionné le 24/11** : catalogue #72 (`45971cf` sur `dev`), BFF #40 (`25aed19`, `dcd76df`), sans écart au contrat
    annoncé et amendé.

- **2026-11-24, suite de STORY-979 (lot 6) — `facturation:avoir:valider` au catalogue de tenant d'auth, hors du
  jeton, et le manifeste `facturation` 1.1.0 au catalogue, annoncés AVANT la fusion du code**
  (`prospera-auth-service` et `prospera-platform-catalog-service`, branches `MNV-979-avoir` ; fiche
  `stories/STORY-979.md`, « Suite du 2026-11-24 », D-979-10 → 16). Tout est AJOUT : aucune route, aucun champ, aucun
  topic ne change de forme.
  - **Catalogue de tenant** (`DROITS_HORS_JETON`) : `facturation:avoir:valider` (« Valider un avoir au-delà du
    seuil »), à la fin de la section `facturation`, après `facturation:parametres:modifier` (l'ordre des `droits` du
    manifeste 1.1.0). 165 codes en tout (24 du jeton, 141 hors du jeton). **Jamais dans `perms[]`** : la borne du jeton
    ne bouge pas (17 + 24 = 41 ≤ 44). Servi par `GET /api/v1/moi/droits`, dans `droitsHorsJeton` (`moi-droits` 1.1.0,
    inchangé).
  - **Attribution par défaut** : au **`DIST_DAF` seul** (`AJOUTS_A_L_ANNEXE_B`, D-1066-9) ; il détient déjà
    `facturation:avoir:emettre`. Ni le comptable, ni le DG, ni l'administrateur (une surcharge de l'organisation peut
    le leur donner).
  - **Pas d'avance de `dv`** à la livraison (D-949-3 : 60 s de cache au plus) ; `identity.droits.changed@1` inchangé.
  - **Catalogue** : `copies.json` recopié depuis `prospera-stories@24049e4` (sha256 de
    `manifestes/facturation.manifest.ts` : `80933b61…f273458`, vérifié) ; seul `facturation` change : version
    1.0.0 → **1.1.0** (semée à côté de la 1.0.0) et `droits[7]` = `facturation:avoir:valider`. Les huit `droits` de la
    1.1.0 sont, à l'octet et dans l'ordre, la section `facturation` du catalogue d'auth.
  - **Pour D** : un avoir au-delà du seuil passe pour un `DIST_DAF` dès le déploiement d'auth (cache de 60 s compris) ;
    il refuse toujours `VALIDATION_DU_DAF_REQUISE` aux autres. **Pour A** : un droit de plus dans le catalogue de
    composition d'un rôle (console) ; aucun type à régénérer.
  - **Fusionné le 24/11** : auth #49 (`b49d8ab` sur `dev`), catalogue #71 (`de988b1`), sans écart au contrat annoncé.

- **2026-11-24, STORY-1112 (lot 6, n° 2) — les essais d'un prospect relayés à la console, annoncés AVANT la fusion du
  code** (`prospera-platform-catalog-service` et `prospera-admin-panel-service`, branches `MNV-1112` ; fiche
  `stories/STORY-1112.md`). **Ajouts seuls** : aucune route, aucun champ, aucun code existant ne change.
  - **Catalogue, contrat `contrat/essai-prospect.openapi.json` 1.0.0 → 1.1.0** (deux lectures, `org:read`, aucune
    vérification d'espace ; même solution que D-1080-14) :
    - `GET /api/v1/essais?statut=OUVERT|SIGNE|EFFACE` → `{ essais: [...], tronquee }` : chaque essai à la forme de
      `GET /essais/{organisationId}` (`EssaiProspect`), plus **`prospect { nom, vertical, pays? }`** lu dans sa
      naissance de l'espace d'essai ; par `finLe` croissante, 200 au plus (`tronquee: true` au-delà) ;
    - `GET /api/v1/jeux-demonstration` → `{ jeux: [{ code, version, verticale, titre, parts: [{ module,
      enregistrements }] }] }` : les jeux chargés par le registre (`JEUX_DEMONSTRATION_DIR`), triés par code puis
      version.
  - **BFF, OpenAPI (A génère ses types de la console depuis lui)** — huit routes neuves sous **`/api/v1/admin/essais`**
    (lire : `org:read` ; écrire : `entitlement:grant`) :
    - `GET /admin/essais?statut=` → `EssaisDto { essais: EssaiDto[], tronquee }` ;
    - **`POST /admin/essais`** (`OuvrirEssaiRequestDto` : `organisationId` 24 hexadécimaux choisi une fois par la
      console, `nom`, `vertical`, `pays?`, `administrateur`, `commercial`, `langue?`, `avecJeu?` vrai par défaut) :
      le jeu du métier choisi par le BFF (D-1112-4), `POST /naissances` puis `POST /essais` ; 201 ouvert par cet ordre,
      200 rejoué → `EssaiDto` ;
    - `GET /admin/essais/{orgId}` → `EssaiDto` ; `POST …/prolongation` (`ProlongerEssaiRequestDto { jours? }` de 1 à
      30) → `EssaiDto` ; `POST …/signature` → `EssaiDto` ; `POST …/jeu-demonstration` → `EssaiDto` ;
      `POST …/effacement` et `GET …/effacement` → `EffacementDto` (`planId`, `organisationId`, `espace`, `motif`,
      `statut`, `demandeLe`, `declenchement` `AUTOMATIQUE`|`REPRISE`|`OPERATEUR` (sans l'identifiant de
      l'opérateur), `proprietaires[{ module, statut, effaceLe?, enregistrements?, raison?, tentatives }]`, `effaceLe?`,
      `derniereSauvegardeExpireLe?`, `enAttente?`, `certificat?{ jws, kid, numero, certificatDeCle? }`). Le `detail`
      libre du catalogue (une part, un propriétaire) ne traverse pas.
    - `EssaiDto` : `organisationId`, `statut` (`OUVERT`, `SIGNE`, `EFFACE`), `debutLe`, `finLe`, `effacementLe`,
      `prolongations`, `prolongeLe?`, `signeLe?`, `effaceLe?`, `langue`, `destinataires[{ role, email }]`,
      `avisEnvoyes[{ fin, echeanceLe, role }]` (la clé interne du catalogue décomposée), `jeu?{ code, version,
      parts[{ module, statut, enregistrements?, raison?, importeLe? }] }`, `prospect?{ nom, vertical, pays? }`.
    - **Refus traversant par leur code** (liste fermée, message du BFF) : 404 `ESSAI_INCONNU`,
      `ORGANISATION_INCONNUE`, `EFFACEMENT_INCONNU` ; 409 `ESSAI_DIVERGENT`, `NAISSANCE_EN_COURS`,
      `ESSAI_HORS_ESPACE_D_ESSAI`, `ESSAI_DEJA_PROLONGE`, `ESSAI_TERMINE`, `ESSAI_SIGNE`,
      `DELAI_DE_SIGNATURE_ECOULE`, `ESSAI_SANS_JEU`, `ESSAI_EFFACE`, `EFFACEMENT_PREMATURE`, `NAISSANCE_DIVERGENTE` ;
      422 `PROLONGATION_AU_DELA_DE_60_JOURS`, `JEU_DEMONSTRATION_INCONNU`, `NAISSANCE_REFUSEE`, et **le code neuf du
      BFF `JEU_DEMONSTRATION_ABSENT`** (aucun jeu chargé pour ce métier, rien n'est écrit) ; 503
      `HORLOGE_INDISPONIBLE`, `AUTH_INJOIGNABLE`. Tout autre échec : la traduction générique (503 si l'amont ne
      répond pas).
    - **Déploiement** : variable facultative `UPSTREAM_ESSAI_TIMEOUT_MS` (30 000 par défaut), le délai des écritures
      d'essai (l'ouverture importe le jeu, l'effacement appelle chaque module). Le BFF parle au catalogue de SON
      espace (`CATALOG_SERVICE_URL`) : face au réel, `ESSAI_HORS_ESPACE_D_ESSAI` (D-1112-6).
  - **Pour A (AP-57, lot 7)** : régénérer les types de la console depuis l'OpenAPI du BFF ; la liste, la prochaine
    action et le certificat se lisent dans ces DTO ; la table des refus de la maquette se branche sur `code`.

- **2026-11-24, correctif de STORY-1084 (lot 6, ticket de A pour FE-140) — quatre noms de schéma de l'OpenAPI de
  bilan, annoncés AVANT la fusion du code** (`prospera-bilan-service`, branche `MNV-1084-schema` ; ticket
  `tickets/TICKET-BACKEND-financement-schema-valeur-indicateur.md`). **Le contrat servi ne change pas** : aucune
  route, aucun champ, aucune valeur rendue ; ce n'est pas un `@2`. Ce qui change, c'est le **document OpenAPI**
  (`GET /api/docs-json`) : Swagger range les schémas par nom de classe et ne gardait qu'une classe par nom, si bien que
  trois références publiaient la forme d'une autre classe. Le garde neuf les a trouvées toutes (voir « Pièges »).
  - **`IndicateurDetteDto.valeurs`** (`GET /dossiers/{dossierId}/financements/{financementId}/indicateurs`) →
    schéma neuf **`ValeurIndicateurDetteDto`** `{ rang, exercice, statut, valeur, motif }` (tous requis ; `exercice`,
    `valeur` et `motif` nullables). Il pointait `ValeurIndicateurDto`, la forme de l'analyse (STORY-552), qui garde
    son nom et ses champs.
  - **`ComparatifDto.exercice`** (états consolidés, STORY-548) → schéma neuf **`ExerciceCompareConsolideDto`**
    `{ exerciceId, libelle, debut?, fin? }`. Il pointait `ExerciceCompareDto`, celui de la comparaison d'exercices
    (STORY-430), qui garde son nom et ses champs.
  - **`ProjectionMensuelleResponseDto.articulation`** (projection mensuelle) → schéma neuf
    **`ArticulationMensuelleDto`** `{ ecartArticulation, articule }`. Il pointait `ControleArticulationDto`, celui des
    contrôles de cohérence (STORY-401), qui garde son nom et ses champs.
  - `VersionCompareeDto.referentiel` (comparaison de versions figées) : la classe locale `ReferentielRefDto` (mêmes
    champs `code`, `version`) est remplacée par la commune ; **le document ne change pas** (Swagger gardait déjà la
    commune).
  - Document : 576 → 579 schémas, trois ajoutés, aucun retiré ; trois schémas modifiés (la seule référence
    ci-dessus) ; les 98 chemins identiques à l'octet.
  - **Pour A** : régénérer `bilan.ts` (`npm run gen:api -- bilan`) dans le front du cabinet ; les trois noms neufs
    apparaissent, les trois références deviennent justes. Aucun code du front ne nomme ces quatre schémas hors des
    types générés (vérifié en lecture le 24/11) ; retirer `ValeurIndicateurDette` écrit à la main dans FE-140.
  - **Fusionné le 24/11** : bilan #183 (`2364abc` sur `dev`), sans écart au contrat annoncé.

- **2026-11-24, STORY-979 (lot 6) — huit droits neufs au catalogue de tenant d'auth, hors du jeton, et le rôle
  `CAB_ARCHIVISTE`, annoncés AVANT la fusion du code** (`prospera-auth-service` et
  `prospera-platform-catalog-service`, branches `MNV-979` ; fiche `stories/STORY-979.md`, D-979-1 → 9). Tout est
  AJOUT : aucune route, aucun champ, aucun topic ne change de forme.
  - **Catalogue de tenant** (`DROITS_HORS_JETON`) : `facturation:parametres:modifier` (« Modifier les paramètres de
    la facture », fin de la section `facturation`) ; section `ged` neuve : `ged:fonds:gerer`, `ged:lot:numeriser`,
    `ged:piece:indexer`, `ged:versement:verser`, `ged:physique:gerer`, `ged:piece:consulter`,
    `ged:sensible:consulter`. 164 codes en tout (24 du jeton, 140 hors du jeton). **Jamais dans `perms[]`** : la
    borne du jeton ne bouge pas (17 + 24 = 41 ≤ 44). Servis par `GET /api/v1/moi/droits`, dans `droitsHorsJeton`
    (contrat `moi-droits` 1.1.0, inchangé).
  - **Attribution par défaut** : `facturation:parametres:modifier` au **`DIST_DAF` seul** (`AJOUTS_A_L_ANNEXE_B`,
    D-1065-13) ; `ged:*` selon la matrice §2.3 du PRD des services du cabinet : `CAB_ASSOCIE` ← `ged:fonds:gerer`,
    `ged:piece:consulter`, `ged:sensible:consulter` ; `CAB_COLLABORATEUR` ← `ged:piece:consulter` ;
    **`CAB_ARCHIVISTE`** ← les sept, et aucun droit d'un autre module.
  - **Rôle neuf du socle de tenant** : `CAB_ARCHIVISTE` (« Archiviste », vertical `cabinet`, couverture `partiel`),
    réaligné au démarrage d'auth ; rôle par défaut d'aucun rôle du socle (`TENANT_ADMIN` → associé, `TENANT_USER` →
    collaborateur, inchangés) : il s'attribue (`tenantRole`) comme tout rôle du socle du métier. Visible dans les
    listes de rôles de la console et du cabinet.
  - **Pas d'avance de `dv`** à la livraison (D-949-3) ; `identity.droits.changed@1` inchangé.
  - **Catalogue** : `copies.json` recopié depuis `prospera-stories@1561370` ; seul `facturation` change (`droits[6]`,
    version 1.0.0 gardée par la source, D-979-7). **`ged` 1.1.0 n'est pas recopié** : il attend la fusion du code de C
    (D-979-8).
  - **Amendement (24/11), annoncé AVANT la fusion** : le code de C est fusionné (document-service #30) et la 1.1.0 est
    sur `main` ; le catalogue la recopie dans la même story (branche `MNV-979-ged`, depuis
    `prospera-stories@4fab396`) : `ged` passe de 1.0.0 à **1.1.0** (version neuve semée à côté de l'ancienne), cinq
    droits du cabinet de plus, `routesLectureSeule` remises sur les routes réelles. Ses sept `ged:*` du cabinet sont
    ceux qu'auth attribue (D-979-3 vérifiée). Rien d'autre ne change.
  - **Fusionné le 24/11** : auth #48 (`c0f6243` sur `dev`), catalogue #68 (`d7e67f1`) et #69 (`b75e34b`), sans écart
    au contrat annoncé.
  - **Pour D** : `PUT /api/v1/facturation/parametres` passe pour un `DIST_DAF` dès le déploiement d'auth (cache de
    60 s compris). **Pour C** : les routes du cabinet de `ged` passent pour l'associé, le collaborateur et l'archiviste
    selon la matrice. **Pour A** : un rôle de plus dans la liste des rôles d'un cabinet (console, AP-38 et suivantes) ;
    aucun type à régénérer (aucune forme ne change).

- **2026-11-24, STORY-1080 (amendement, lot 6) — la console lit l'état publié d'une organisation (AP-55), annoncé
  AVANT la fusion du code** (`prospera-platform-catalog-service` et `prospera-admin-panel-service`, branches `MNV-1080` ;
  fiche `stories/STORY-1080.md`, D-1080-14 → 17). **Le contrat figé de l'état publié (`contrat-etat-publie-v1`), sa
  route et son événement ne changent pas.** Aucun topic, aucune collection, aucun droit neuf.
  - **Catalogue — route neuve** `GET /api/v1/console/etat-publie/{organisationId}` (surface plateforme, permission
    **`org:read`**, aucune identité de service) : le calcul de `GET /etat-publie/{organisationId}`, réponse du contrat
    **sans `utilisateur`** et sans les `droits` des modules. Refus : 401, 403 (sans `org:read` ; un membre de
    l'organisation compris), 400 `ORGANISATION_ID_INVALIDE`, 404 `ORGANISATION_INCONNUE`, 503 `HORLOGE_INDISPONIBLE`.
  - **BFF — route neuve** `GET /api/v1/admin/orgs/{orgId}/etat-publie` (**`org:read`**) → 200
    `EtatPublieOrganisationDto` : `schemaEtatPublie`, `versionMatrice`, `organisationId`, `espace` (`ESSAI`|`REEL`),
    `heureDeReference { instantUtc, statut }`, `modules[] { code, libelle, etat, finLe?, effacementLe?, versionCode?,
    acquis? }` ; `etat` est l'une des neuf valeurs (énumération `EtatPublieDuModule`), un état inconnu est rendu
    `NON_INSTALLE`. Refus : 404 `ORGANISATION_INCONNUE` (code gardé), les autres traduits comme les relais du moteur
    (503 si le catalogue est injoignable ou l'heure indisponible).
  - **BFF — OpenAPI amendée, sans changement de comportement** : `LancerInstallationRequestDto.referentiels`
    (`POST /admin/orgs/{orgId}/installations`) publie sa forme, `{ [module]: { code, version }[] }`.
  - **Pour A (AP-55)** : régénérer les types depuis l'OpenAPI du BFF ; la ligne « où en est l'organisation » lit
    `GET /admin/orgs/{orgId}/etat-publie` ; les relais de l'offre, des installations et de la reprise sont inchangés.
  - **Fusionné le 24/11** : catalogue #67 (`fddfa7d` sur `dev`), BFF #38 (`7c85076`), sans écart au contrat annoncé.

- **2026-11-19, STORY-1080 — balance et bilan servent leurs vérifications d'installation ; le catalogue de la recette
  installe par le moteur, annoncé AVANT la fusion du code** (`prospera-balance-service`, `prospera-bilan-service`,
  `prospera-recette`, branches `MNV-1080` ; fiche `stories/STORY-1080.md`, D-1080-1 → 13). Ticket
  `verifications-de-balance-et-de-bilan-non-servies`. **Aucune route existante, aucun topic, aucun schéma de fait ne
  change.**
  - **Routes neuves** (chemins déjà déclarés aux manifestes), sous l'**identité de service `MOTEUR` seule**, limitée à
    l'organisation du chemin, **dans les deux espaces** : `POST /api/v1/instance/balance/{organisationId}/verifications/
    {referentiel-resolu|paquet-fiscal-disponible|balances-equilibrees}` et `POST /api/v1/instance/bilan/{organisationId}/
    verifications/{referentiel-resolu|snapshots-intacts|consommateurs-actifs}` → 200 `verification-installation@1`
    (`VERT` à 0 ; `ROUGE`, ou `ORANGE` pour le paquet fiscal ; `mesure`, `detail`, `action`). Corps ignoré,
    `Idempotency-Key` acceptée et non exigée ; rien d'écrit.
  - **Refus** : ceux des routes C13 (401 `JETON_DE_SERVICE_INVALIDE`, 403 `IDENTITE_DE_SERVICE_REQUISE`,
    `ORGANISATION_HORS_JETON`, `IDENTITE_DE_SERVICE_REFUSEE`) ; **code neuf** 404 `VERIFICATION_INCONNUE`
    (`details.verificationsServies`).
  - **Ce que mesure chaque vérification** : fiche, D-1080-2 → 7 (l'habilitation n'est pas lue : le droit n'est pas encore
    `ACTIVE` pendant le plan, D-1080-1).
  - **`prospera-recette`** (pile partagée) : le catalogue reçoit `NAISSANCE_AUTH_URL`, `MOTEUR_JETON_SERVICE` (même
    valeur qu'auth) et `INSTALLATION_SERVICES=balance=…:3007,bilan=…:3004,comptabilite=…:3420`. **Pour A, C, D** : dans
    toute recette, le `PUT` de la console sur `balance`, `bilan` ou `comptabilite` (première installation) joue
    désormais les VRAIES vérifications ; un cabinet qui aurait, AVANT d'installer `balance`, un exercice ouvert sur une
    année sans paquet fiscal (2025, 2027 au Togo) recevrait 409 `INSTALLATION_INACHEVEE` (`paquet-fiscal-disponible`
    🟠). Aucune recette d'aujourd'hui ne le fait. Les autres modules (`conseil`, `declarations`, …) restent sans
    adresse : différés par le `PUT`, refusés par `POST /installations`. `cabinet-moteur` installe par
    `POST /installations` ; le `PUT` n'y sert plus qu'à la sanction et à sa levée.
  - **Pour A (relecture, console)** : rien à changer ; les bilans d'un plan d'installation de `balance` et `bilan`
    portent désormais des voyants mesurés.
  - **Fusionné** : balance #159 (`4edb4c8`) et bilan #182 (`0f17ec4`) le 19/11 ; recette #27 (`a6da2ea`) le 24/11,
    sans écart au contrat annoncé.

- **2026-11-19, STORY-978 — le catalogue demande un jeton du moteur par organisation, annoncé AVANT la fusion du
  code** (`prospera-platform-catalog-service`, branche `MNV-978` ; fiche `stories/STORY-978.md`, D-978-1 → 11).
  **Aucune route, aucun topic, aucune collection ne change ; auth-service n'est pas touché.**
  - **Ce que voient les modules** (comptabilité, balance, bilan, Reprise, ventes, terrain, assureur fictif…) : sur leurs
    routes du moteur (`…/{organisationId}/verifications/…`, import et effacement C13), le jeton présenté est désormais
    celui de l'identité `MOTEUR` **pour l'organisation du chemin**, émis par l'auth-service de l'espace
    (`POST /api/v1/interne/jetons-de-service`, STORY-948) et renouvelé avant son terme. Rien à changer chez eux : leur
    garde (`ORGANISATION_HORS_JETON`) est enfin satisfaite pour toute organisation.
  - **Configuration du catalogue** (pour qui lève une pile, dont `prospera-recette`) :
    - **`INSTALLATION_JETON_SERVICE` est RETIRÉE** : posée (non vide), **le catalogue refuse de démarrer** (message qui
      nomme la remplaçante). Aucun compose versionné ne la pose ;
    - le moteur lit l'adresse et le secret de la naissance : **`NAISSANCE_AUTH_URL`** (`http://auth-service:3001/api/v1`)
      et **`MOTEUR_JETON_SERVICE`** (la valeur d'auth-service) ; sans eux, chaque appel du moteur à un module rend
      `JETON_DU_MOTEUR_INDISPONIBLE` (cause `NON_CONFIGURE`) au lieu d'appeler le module ;
    - variable **neuve, facultative** : `JETON_DU_MOTEUR_MARGE_S` (60 par défaut, 1 → 3 600).
  - **Raison neuve, chaîne libre (ajout)** : `JETON_DU_MOTEUR_INDISPONIBLE`, cause dans `detail` (`NON_CONFIGURE`,
    `AUTH_INJOIGNABLE`, `DELAI_DEPASSE`, `ORGANISATION_INCONNUE`, `HTTP_<n>`, `REPONSE_HORS_CONTRAT`) : dans l'étape
    `VERIFIER` d'un plan d'installation (`resultat.voyant: NON_EXECUTEE`, plan `EN_ATTENTE`, jamais différée par le
    `PUT` de la console) et dans la part non importée d'un essai (`essai-prospect.openapi.json`, description de
    `raison` ; type et version inchangés). **Pour A (console)** : un libellé à prévoir si l'écran traduit les raisons.
  - **Pour la recette (STORY-1080, B)** : le catalogue de `docker-compose.recette.yml` doit recevoir
    `NAISSANCE_AUTH_URL`, `MOTEUR_JETON_SERVICE` (même valeur qu'auth) et `INSTALLATION_SERVICES`.
  - **Fusionné le 19/11** : catalogue #63 (`f9e9e26` sur `dev`), sans écart au contrat annoncé.

- **2026-11-19, STORY-1093 — la comptabilité branchée au hub et à la recette, annoncé AVANT le code**
  (`prospera-balance-service` et `prospera-recette`, branches `MNV-1093` ; fiche `stories/STORY-1093.md`, D-1093-1 →
  10). **Aucune route, aucun topic, aucun schéma ne change.**
  - **balance-service** : le **défaut** de l'allowlist d'ingestion directe (`INGESTION_SOURCE_SYSTEMS`) nomme
    `comptabilite-service` (en plus de `ComptabiliteServiceIMF`, `ComptabiliteServiceDistributeur`,
    `microfinance-service`) : une balance d'origine `comptabilite` publiée par la comptabilité est acceptée sur toute
    pile qui ne pose pas la variable. Une variable posée remplace toujours le défaut. Le JSON Schema
    `balance.submitted.v1` n'est pas touché (D-1093-2).
  - **prospera-recette** (pile partagée par les quatre groupes) : `comptabilite-service` au profil
    (`docker-compose.recette.yml`, profil `recette`, levé à la demande, port **3420 sur la boucle locale**, base
    `comptabilite_service` dans le MongoDB `rs0` de la pile, `KAFKA_ESPACE: ${RECETTE_ESPACE:-REEL}`, `AUTH_*`,
    `AUTH_SERVICE_URL`, `DOSSIER_SERVICE_URL`, `DOCUMENT_SERVICE_URL`) ; l'IdP émet l'audience `comptabilite-service`
    (le profil reprend la liste du compose racine et l'ajoute ; `docker-compose.fiscal.yml` la reprend avec
    `fiscal-service`) ; balance-service ne reçoit plus la liste d'émetteurs du compose racine du poste
    (`INGESTION_SOURCE_SYSTEMS: !reset null`, Compose 2.24 ou plus) : il lit son défaut. Une suite neuve,
    `recette/comptabilite.recette.ts`. **Pour A, C, D** : une pile de recette levée avant ce changement émet des jetons
    sans l'audience de la comptabilité ; la descendre et la relancer.
  - **Fusionné le 19/11** : balance #158 (`695b6c7` sur `dev`), recette #26 (`a1d68d7`), sans écart au contrat annoncé.

- **2026-11-19, STORY-1082 — le dossier de démonstration créé par le moteur dans `dossier-service`, résolu par
  l'import C13 de balance, annoncé AVANT le code** (`prospera-dossier-service` et `prospera-balance-service`, branches
  `MNV-1082` ; fiche `stories/STORY-1082.md`, D-1082-1 → 11). **Aucun événement, aucune route existante, aucun corps
  C13 ne change** ; fin de D-928-3 (ticket `dossier-de-demonstration-sans-creation-par-le-moteur`). **Fusionné le 19/11** :
  dossier #57 (`2bf9dbd` sur `dev`), balance #157 (`d43fbe4`), sans écart au contrat annoncé.
  - **dossier-service, routes neuves**, sous l'**identité de service `MOTEUR` seule**, limitée à l'organisation du
    chemin, **espace d'essai seulement** (`INSTANCE_ESPACE=ESSAI`, jugé avant le corps) :
    - `PUT /api/v1/instance/dossier/{organisationId}/dossiers-de-demonstration/{dossierRef}` (corps : l'identité de
      `POST /dossiers` sans `typeEntite` ni `attestationMandat`, plus `systemeComptable` et `regimeFiscal`) → 200
      `{ dossierId, cree, dossier: <état publié de dossier.created> }` ; crée une fois (publie `dossier.created`),
      rejouée rend le même ;
    - `PUT …/{dossierRef}/exercices` (`{ debut, fin }`) → 200 `{ dossierId, exerciceId, ouvert, dossier, exercices[],
      axes[] }` (états publiés) ; ouvre l'exercice (l'ouvert antérieur clos par le moteur), décide les axes du jeu au
      premier exercice ; publie `dossier.exercice.*` et `dossier.axes.decides` comme les routes du cabinet.
    - Refus : 401 `JETON_DE_SERVICE_INVALIDE` ; 403 `IDENTITE_DE_SERVICE_REQUISE`, `ORGANISATION_HORS_JETON`,
      `ESPACE_REEL_REFUSE` ; 400 `DOSSIER_REF_INVALIDE` (et ceux du DTO) ; 404 `DOSSIER_DE_DEMONSTRATION_INCONNU` ; 409
      `EXERCICE_DE_DEMONSTRATION_HORS_ORDRE` ; les refus de la création et de l'ouverture (`PAYS_NON_SERVI`,
      `DIRIGEANT_REQUIS`, `DOSSIER_NIF_DEJA_UTILISE`, `EXERCICE_BORNES_DEJA_UTILISEES`…).
    - **Routes existantes** : un jeton de service y est refusé 403 `IDENTITE_DE_SERVICE_REFUSEE` (code neuf des gardes,
      `RefusGardeDto`) ; il l'était déjà par `EMAIL_NOT_VERIFIED`. Rien ne change pour un utilisateur.
    - Le dossier de démonstration : `origine: JEU_DEMONSTRATION` et `demonstration` (clef du jeu, axes) **non
      publiés** ; sans responsable (l'administratrice le voit et l'affecte) ; sans mandat ; hors palier.
  - **balance-service** : l'import C13 (`import-c13-*@1`, corps inchangés) appelle `dossier-service` avec le jeton du
    moteur relayé ; l'identifiant du dossier de démonstration n'est **plus dérivé** (sha256) : c'est un `ObjectId` de
    `dossier-service` ; chaque balance du jeu porte son `exerciceId`. Refus neufs (ajouts) : 422
    `DOSSIER_DE_DEMONSTRATION_REFUSE` (statut et code de `dossier-service` dans `details`), 502
    `DOSSIER_SERVICE_INJOIGNABLE`. Réglages neufs : `DOSSIER_SERVICE_URL` (défaut `http://dossier-service:3009`, le nom
    et le port du compose et de la recette), `DOSSIER_SERVICE_TIMEOUT_MS`.
  - **Déploiement** : `INSTANCE_ESPACE=ESSAI` sur `dossier-service` dans un espace d'essai (la recette le pose déjà,
    D-929-2). **Effacement** : `dossier-service` n'efface rien en fin d'essai (D-1082-10, dette nommée).
  - **Pour A (relecture)** : la console verra le dossier de démonstration dans le portefeuille d'un essai. **Pour C,
    D** : rien.

- **2026-11-18, STORY-975 — la comptabilité sert ses routes C13 (vérification, import, effacement) et le catalogue
  recopie ses manifestes, annoncé AVANT le code** (`prospera-comptabilite-service` et `platform-catalog-service`,
  branches `MNV-975` ; fiche `stories/STORY-975.md`, D-975-1 → 10). **Aucune route, aucun champ, aucun topic existant
  ne change** ; le manifeste `comptabilite` ne change que dans ses commentaires (0.1.0, D-975-9). **Fusionné le 18/11** :
  comptabilite #12 (`dc6809d`, `ddc9fa5` sur `dev`), catalogue #62 (`a5a2676`), sans écart au contrat annoncé.
  - **comptabilité, routes neuves** (chemins déjà déclarés au manifeste), sous l'**identité de service `MOTEUR` seule**,
    limitée à l'organisation du chemin (jeton de `POST /api/v1/interne/jetons-de-service` d'auth-service) :
    - `POST /api/v1/instance/comptabilite/{organisationId}/verifications/referentiel-resolu` → 200
      `verification-installation@1` (`VERT` / `ROUGE`, `mesure` = dossiers dont un exercice au journal non clôturé n'a
      pas de référentiel arrêté ou tenu) ; servie dans les deux espaces ; un autre code : 404 `VERIFICATION_INCONNUE` ;
    - `POST …/import` (`import-c13-demande@1`) : **sans objet**, tout objet 422 `OBJET_INCONNU`
      (`objetsImportables: []`) ; espace d'essai seulement ;
    - `POST …/effacement` (`effacement-c13-demande@1` → `effacement-c13-accuse@1`) : espace d'essai, motif
      `FIN_ESSAI` seul ; efface tout ce que le service tient de l'organisation ; `EFFACE` puis `DEJA_EFFACE`.
  - **Refus neufs** (corps `{ statusCode, error, code, message, details? }`) : 401 `JETON_DE_SERVICE_INVALIDE` ; 403
    `IDENTITE_DE_SERVICE_REQUISE` (jeton d'utilisateur sur une route du moteur), `IDENTITE_DE_SERVICE_REFUSEE` (jeton de
    service sur une route métier, ou autre identité), `ORGANISATION_HORS_JETON`, `ESPACE_REEL_REFUSE` ; 400
    `ORGANISATION_INCOHERENTE` ; 422 `SCHEMA_NON_CONFORME`, `SOURCE_NON_SERVIE`, `MOTIF_NON_SERVI`, `OBJET_INCONNU`. Les
    routes métier ne changent pas pour un utilisateur ; un jeton de service y est désormais refusé 403 (il l'était
    déjà, par l'e-mail non vérifié : le code change, `IDENTITE_DE_SERVICE_REFUSEE` au lieu d'`EMAIL_NOT_VERIFIED`).
  - **Les routes du moteur ne lisent pas l'état publié** (D-975-2) : la matrice les ouvre déjà au `MOTEUR` ; seuls le
    délai de propagation et `NON_INSTALLE` diffèrent.
  - **Catalogue** : `copies.json` recopié depuis `prospera-stories@origin/main` (48 manifestes, `manifestes:garde`
    verte) : `terrain` (droit de D-1060), `facturation` (D-1061), `comptabilite` (avertissement, routes de 969 et
    970) et **`financement` 0.2.0, neuf au catalogue** (STORY-1083, 1084 : ses routes cessent de répondre 403
    `FINANCEMENT_NOT_ENTITLED` dès qu'il est installé). `.env.essai.example` : `INSTALLATION_SERVICES` nomme
    `comptabilite=http://comptabilite-service:3420`.
  - **Déploiement** : `comptabilite-service` dans l'`AUTH_AUDIENCE` de l'IdP (déjà requis par 958) ; le catalogue doit
    connaître l'adresse du service (`INSTALLATION_SERVICES`) et présenter le jeton du moteur
    (`INSTALLATION_JETON_SERVICE`) pour que `POST /installations` l'installe. La recette : STORY-1093.
  - **Pour A (relecture)** : la console et le cabinet ne voient rien de neuf ; `financement` apparaît au catalogue.
    **Pour D** : rien.

- **2026-11-18, STORY-976 — `paiement` consomme `facturation.facture.emise@1` et ouvre la Créance, annoncé AVANT le
  code** (`prospera-paiement-service`, branche `MNV-976` ; fiche `stories/STORY-976.md`, D-976-1 → 7). Demande de D
  (STORY-1059) ; D-965-9 levée. **Aucune route, aucun champ, aucun topic publié ne change.** **Fusionné le 18/11** :
  paiement #124, `4684d22` sur `dev`, sans écart au contrat annoncé.
  - **Consommation neuve** : topic `facturation.facture.emise` (producteur `ventes`, schéma
    `facturation.facture.emise-value` au registre), groupe **`paiement-factures`**, depuis le début du topic. Champs
    lus : `eventId` (l'en-tête prime), `schemaVersion` (1), `occurredAt`, `organisationId`, `factureId` (le
    `sourceId`), `numero` (le libellé, **sans motif `FAC-`**, STORY-1061), `tiersId`, `perimetre`, `devise`,
    `montantTtcMineur` (le montant d'origine), `echeanceLe`, `livraisonId` (`null` ⇒ absent). Non lus : `commandeId`,
    `montantHtMineur`, `montantTvaMineur`, `emiseLe`, `rang`.
  - **Effet** : la même `OuvrirLaCreance` que `PUT /creances/sources/FACTURE/{factureId}`, auteur `MODULE`
    `FAIT_DE_FACTURE`. Le premier chemin arrivé fait naître la Créance (trace, `paiement.creance.materialisee`,
    `paiement.creance.changed@1` révision 1) ; l'autre, et tout fait relivré, n'écrit rien. La route reste servie,
    inchangée. Une facture laissée `A_OUVRIR` par `ventes` (paiement arrêté) s'ouvre ainsi sans membre.
  - **Refus** : un fait mal formé, ou que la route refuserait (`CREANCE_INVALIDE`, `CREANCE_SOURCE_EN_CONFLIT`), est
    ignoré et journalisé avec son code (l'offset avance) ; une panne ou `ECRITURE_CONCURRENTE` le fait relivrer.
    **Aucune garde d'accès au module** sur ce chemin (D-976-3).
  - **Variable facultative neuve** : `KAFKA_FACTURES_GROUP_ID` (défaut `paiement-factures`).
  - **Pour D** : rien à faire ; `ventes` peut garder la route. Information (D-976-7) : les motifs du schéma de `ventes`
    sont plus larges que ceux de la Créance (`tiersId` avec `:` ou `.`, `factureId` qui commence par `_` ou `-`,
    `livraisonId` avec `:`) ; une telle facture est refusée `CREANCE_INVALIDE` par la route comme par le fait.

- **2026-11-18, STORY-1081 — `PATCH /api/v1/dossiers/{id}` ouvert au collaborateur, dans `dossier-service` et dans le
  BFF, annoncé AVANT le code** (`prospera-dossier-service` et `prospera-admin-panel-service`, branches `MNV-1081` ;
  fiche `stories/STORY-1081.md`, D-1081-1 → 7). D-923-1 renversée par l'utilisateur (18/11). **Aucune route, aucun
  champ, aucun code neuf** ; aucun topic touché. **Fusionné le 18/11** : dossier #56 (`82642d6` sur `dev`),
  admin-panel #37 (`650ae23`), sans écart au contrat annoncé.
  - **dossier-service** : la route n'exige plus `TENANT_ADMIN` ; tout membre du cabinet modifie l'identité **dans sa
    portée** (`TENANT_USER` : dossiers dont il est responsable ou contributeur ; hors portée ou « Mon cabinet » ⇒
    `404 DOSSIER_INTROUVABLE`, jamais `403`). Le `403` « réservé à TENANT_ADMIN » de cette route disparaît.
  - **dossier-service, `409 DOSSIER_NIF_DEJA_UTILISE`** (création et modification) : `details.dossierId` et
    `details.raisonSociale` ne sont rendus **que si le dossier en conflit est dans la portée de l'appelant** ; sinon le
    refus part **sans `details`** (même code, même statut). Pour `TENANT_ADMIN`, rien ne change. Un écran qui lit
    `details` doit déjà tolérer son absence (clé inexploitable, STORY-354).
  - **`409 CONFLIT_CONCURRENT`** : inchangé, sans `details` (D12 : muet) ; par le BFF, `{ statusCode, error,
    message: code, code }`.
  - **BFF** : `@Roles(TENANT_ADMIN, TENANT_USER)` au lieu de `TENANT_ADMIN` ; un opérateur plateforme sans rôle de
    cabinet reste refusé `403` avant l'amont. Liste fermée des codes relayés inchangée (D-923-2). OpenAPI du BFF : la
    description de la route change, son schéma non (`npm run gen:api` ne produit aucun type neuf).
  - **Pour A (écrans)** : l'onglet Identité de la fiche dossier peut s'ouvrir au collaborateur (FE-061, D12) ; sur
    `404`, « introuvable » ; sur `409 DOSSIER_NIF_DEJA_UTILISE` sans `details`, aucun lien vers le dossier existant.

- **2026-11-18, STORY-1084 — emprunts, échéancier, scénario retenu et indicateurs de dette du module `financement`,
  annoncés AVANT le code** (`prospera-bilan-service`, branche `MNV-1084` ; fiche `stories/STORY-1084.md`,
  D-1084-1 → 15 ; manifeste `manifestes/financement.manifest.ts` 0.2.0). Tout est AJOUT : aucune route, aucun champ,
  aucun topic existant ne change de forme ; **aucun droit neuf** (`preparer` pour saisir, `consulter` pour lire).
  **Fusionné le 18/11** : bilan #181, `d236c56` sur `dev`, sans écart au contrat annoncé.
  - **Routes neuves de bilan** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, mêmes gardes et
    même portée que 1083) : `GET /emprunts` (consulter : chaque emprunt avec son échéancier — numéro, date, échéance,
    intérêts, capital, restant dû — et ses totaux), `POST /emprunts` (préparer, 201), `PUT /emprunts/{empruntId}`
    (préparer, 200), `DELETE /emprunts/{empruntId}` (préparer, 204), `GET /indicateurs` (consulter : dette par
    exercice N+1 → N+3, indicateurs `COUVERTURE_SERVICE_DETTE`, `CAPACITE_ENDETTEMENT_RESIDUELLE`,
    `AUTONOMIE_FINANCIERE` avec formule et sources, plan de financement emplois / ressources par année ; chaque
    valeur `CALCULE` ou `INCALCULABLE` avec son motif, jamais 0). Saisie des emprunts en `BROUILLON` seulement.
  - **Champs ajoutés** : `PATCH /{financementId}` et `POST /{financementId}/versions` acceptent `scenarioRetenu`
    (`{ hypothesesId }` ou `null`) ; le dossier, sa liste et ses versions rendent `emprunts` (paramètres : `id`,
    `libelle`, `nature` `DEMANDE`|`EXISTANT`, `capital`, `tauxAnnuelPct`, `dureeMois`, `differeMois`, `periodicite`
    `MENSUELLE`|`TRIMESTRIELLE`|`SEMESTRIELLE`|`ANNUELLE`, `mode` `ECHEANCES_CONSTANTES`|`AMORTISSEMENT_CONSTANT`,
    `dateDebut`) et `scenarioRetenu` dans leur contenu.
  - **Refus neufs** : 404 `EMPRUNT_INTROUVABLE` ; 400 `DUREE_HORS_PERIODICITE` (durée ou différé qui n'est pas un
    multiple de la période) et `DIFFERE_INVALIDE` (déjà connu, pour un emprunt) ; 422 `EMPRUNTS_TROP_NOMBREUX` (20
    au plus) et `SCENARIO_INTROUVABLE` (jeu d'hypothèses absent de ce dossier client). 409
    `DOSSIER_FINANCEMENT_NON_MODIFIABLE` et `CONFLIT_CONCURRENT` gardent leur sens.
  - **Motifs d'`INCALCULABLE`** (fermés) : `SCENARIO_NON_RETENU`, `SCENARIO_INTROUVABLE`,
    `EXERCICE_DE_BASE_SANS_MILLESIME`, `VENTILATION_FINANCEMENT_INDETERMINEE`, `AUCUN_SERVICE_DE_LA_DETTE`,
    `RESSOURCES_STABLES_NON_POSITIVES`.
  - **Prévisionnel** : aucune route ne change ; le moteur reçoit, pour `financement` seulement, les séries des
    échéanciers en mémoire (sans elles, il rend la même projection qu'avant, au franc). Piste d'audit : aucun type
    neuf (`FINANCEMENT_MODIFIE` avec `emprunt` et `geste`).
  - **Manifeste `financement` 0.2.0** : `routesLectureSeule` + les deux lectures neuves ; copie à l'octet dans bilan.
    Toujours pas au catalogue (975).
  - **Pour A** (écrans, FE-140, FE-141) : types à générer depuis l'OpenAPI vivant de bilan. **Pour C, D** : rien.

- **2026-11-18, STORY-1083 — le module `financement` (M49) dans bilan-service, et ses trois droits dans auth,
  annoncés AVANT la fusion du code** (`prospera-bilan-service` et `prospera-auth-service`, branches `MNV-1083` ; fiche
  `stories/STORY-1083.md`, D-1083-1 → 17 ; manifeste `manifestes/financement.manifest.ts`). Tout est AJOUT : aucune
  route, aucun champ, aucun topic existant ne change de forme. **Fusionné le 18/11** : bilan #180 (`36c22fa` sur
  `dev`), auth #47 (`96f8ab3`), sans écart au contrat annoncé (amendement #693 compris).
  - **Manifeste neuf** `financement` 0.1.0 (verticale cabinet, `depends: bilan`, profil compose `bilan`), copié à
    l'octet dans bilan (`src/vendor/manifestes/`). **Pas encore au catalogue** (D-1083-5 : la copie des manifestes du
    catalogue est déjà en retard ; à recopier par 975) : tant que le moteur ne publie aucun état pour `financement`,
    toutes ses routes répondent 403 `FINANCEMENT_NOT_ENTITLED`.
  - **Routes neuves de bilan** (sous `/api/v1/dossiers/{dossierId}/financements`, portée du dossier, `TENANT_ADMIN`
    et `TENANT_USER`) : `POST /`, `GET /`, `GET /{financementId}`, `PATCH /{financementId}`,
    `POST /{financementId}/transitions`, `POST /{financementId}/versions`, `GET /{financementId}/versions`,
    `GET /{financementId}/versions/{version}`. États `BROUILLON`, `PRET`, `REMIS`, `ACCORDE`, `REFUSE`, `ABANDONNE`.
  - **Refus neufs** : 403 `FINANCEMENT_NOT_ENTITLED`, `DROIT_INSUFFISANT` (`details.droit`) ; 503
    `DROITS_INDISPONIBLES` ; 404 `DOSSIER_FINANCEMENT_INTROUVABLE`, `VERSION_INTROUVABLE` ; 409
    `TRANSITION_INTERDITE` (`details.depuis`, `details.vers`), `VERSION_FIGEE_ABSENTE`,
    `DOSSIER_FINANCEMENT_NON_MODIFIABLE`, `CONFLIT_CONCURRENT` ; 422 `TRANSITION_INCOMPLETE` (`details.champs`) ;
    **400 `DIFFERE_INVALIDE`** (un différé qui n'est pas strictement inférieur à la durée ; ajouté au code, annoncé
    le 18/11 avant la fusion par un amendement de cette annonce).
    `ABONNEMENT_EXPIRE`, `EMAIL_NOT_VERIFIED`, `KYC_NOT_APPROVED` gardent leur sens.
  - **Piste d'audit** (`GET /dossiers/{id}/bilan/audit`) : quatre valeurs AJOUTÉES à `type` — `FINANCEMENT_CREE`,
    `FINANCEMENT_MODIFIE`, `FINANCEMENT_ETAT_CHANGE`, `FINANCEMENT_VERSION_OUVERTE`.
  - **Bilan lit `GET /api/v1/moi/droits` d'auth** (jeton du membre relayé ; nouveau pour ce service). Variable
    `AUTH_SERVICE_URL` **facultative** (défaut : l'origine d'`AUTH_JWKS_URI` + `/api/v1`) : aucun compose à changer.
  - **Bilan projette l'état publié de `financement`** depuis le même `etat-publie.changed.<espace>` (collection
    `etats_publies_financement`). Collections neuves `dossiers_financement`, `versions_dossier_financement` (dans le
    plan d'effacement C13 de bilan).
  - **Auth** (`DROITS_HORS_JETON`, section `financement`) : `financement:dossier:preparer` (« Préparer un dossier de
    financement »), `financement:dossier:valider` (« Valider un dossier de financement »),
    `financement:dossier:consulter` (« Consulter les dossiers de financement »). **Jamais dans `perms[]`** (borne
    du jeton inchangée). Attribution par la table d'accès du cabinet : préparer et consulter à `CAB_ASSOCIE` et
    `CAB_COLLABORATEUR`, valider à `CAB_ASSOCIE` (PRD §2.3). Contrat `moi-droits` 1.1.0 et
    `identity.droits.changed@1` inchangés.
  - **Pour A** (écrans, FE-140) : types à générer depuis l'OpenAPI vivant de bilan quand l'écran viendra ; un
    collaborateur n'a pas `valider` (« Valider » caché). **Pour C, D** : rien chez vous.

- **2026-11-18, STORY-977 — `terrain:parametres:modifier` au catalogue de tenant d'auth, hors du jeton, annoncé AVANT
  la fusion du code** (`prospera-auth-service`, branche `MNV-977` ; fiche `stories/STORY-977.md`, D-977-1 → 7).
  **Fusionné le 18/11** : auth #46, `682bba4` sur `dev` (annonce : stories #690), sans écart au contrat annoncé. Tout
  est AJOUT : aucune route, aucun champ, aucun topic ne change de forme.
  - **Catalogue** (`DROITS_HORS_JETON`, section `terrain`) : `terrain:parametres:modifier` (« Modifier les paramètres
    du terrain »), déclaré au manifeste `terrain` par D-1060. 153 codes en tout (24 du jeton, 129 hors du jeton).
    **Jamais dans `perms[]`** : la borne du jeton ne bouge pas (17 + 24 = 41 ≤ 44).
  - **Servi par** `GET /api/v1/moi/droits`, dans `droitsHorsJeton` (contrat `moi-droits` 1.1.0, inchangé).
  - **Attribution par défaut** : `DIST_DG` et `DIST_ADMIN`, eux seuls (`AJOUTS_A_L_ANNEXE_B`, comme
    `commande:parametres:modifier`). Le DG passe à 46 droits de tenant, `DIST_ADMIN` à 25. Aucun rôle de l'IMF
    (D-977-4).
  - **Pas d'avance de `dv`** à la livraison (D-949-3) : les caches `(membre, organisation, dv)` voient le droit à leur
    terme (60 s au plus). `identity.droits.changed@1` ne change pas (il ne porte aucun droit).
  - **Pour D** : `PUT /api/v1/terrain/parametres` passe pour un DG ou un `DIST_ADMIN` dès le déploiement d'auth.
    **Pour A, C** : rien chez vous.

- **2026-11-18, STORY-973 — le plan SMT propre, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-112 ; fiche `stories/STORY-973.md`, D-973-1 → 7). **Fusionné le 18/11** : comptabilite #11, `dd3dc52` sur
  `dev` (annonce : stories #687), sans écart au contrat annoncé. D-961-1 renversée par l'utilisateur. Rien n'est
  renommé ; une valeur d'énumération et un refus AJOUTÉS.
  - **Plan SMT, version 2** (`plans-de-journaux@1`, donnée du service) : le **journal de trésorerie** `TR`
    (« Journal de trésorerie (recettes et dépenses) », nature neuve `TRESORERIE`) et le journal des à-nouveaux `AN`
    (D-973-2), au lieu de `AC VE BQ CA OD AN`. SN, SFD-BCEAO et CIMA ne changent pas (six journaux, version 1). Un
    exercice SMT déjà ouvert au journal garde son plan arrêté `SMT@1` (D-961-2) ; un exercice SMT ouvert après la
    fusion reçoit `SMT@2` : `GET …/exercices/{e}/journaux` rend `versionDuPlan: 2` et deux journaux, la piste
    `EXERCICE_OUVERT` porte `planDeJournaux: SMT@2`. La forme des réponses ne change pas.
  - **OpenAPI** : l'énumération `NatureDeJournal` reçoit `TRESORERIE`. Un lecteur qui fait un `switch` exhaustif sur
    la nature doit prévoir la valeur.
  - **Refus neuf** : `POST …/lettrages` et `POST …/lettrages/propositions/{id}/acceptation` rendent 409
    `JOURNAL_DES_OPERATIONS_DIVERSES_ABSENT` (`details.planDeJournaux`) quand un écart de règlement serait passé sur
    un exercice dont le plan n'a pas de journal d'OD (un plan de trésorerie) ; c'était une 500. L'écart s'y passe par
    une écriture saisie (D-973-5).
  - Aucun topic, aucun schéma au registre, aucune variable. **Pour A** (front du cabinet) : une saisie SMT propose
    `TR` et `AN` ; rien d'autre. **Pour C, D** : rien chez vous.

- **2026-11-18, STORY-974 — l'invitation au réel à la mise en service, annoncé AVANT la fusion du code**
  (`prospera-auth-service`, `prospera-platform-catalog-service` ; fiche `stories/STORY-974.md`, D-974-1 → 11).
  **Fusionné le 18/11** : auth #45 `e83568d`, catalogue #61 `a672a44` (annonce : stories #682), sans écart au contrat
  annoncé. Tout est AJOUT : aucune route, aucun champ, aucun topic existants ne changent de forme.
  - **Auth, route neuve (moteur)** : `PUT /api/v1/interne/organisations/{organisationId}/invitations`, sous l'identité
    de service du moteur seule (`MOTEUR_JETON_SERVICE`, comme la naissance et les comptes du jeu ; tout autre jeton,
    même d'un administrateur de la plateforme : 401 `IDENTITE_DU_MOTEUR_REQUISE`), **dans l'espace réel seulement**
    (`INSTANCE_ESPACE=ESSAI` : 403 `ESPACE_D_ESSAI_REFUSE` avant la lecture du corps). Corps `{ membres: [{ userId,
    email, prenom, nom, role?, roleMetier? }] }` (1 à 200 ; `role` = `TENANT_ADMIN` | `TENANT_USER`, défaut
    `TENANT_USER`). Chaque membre naît **sous le `userId` qu'il a dans l'essai** (FR-42), `INVITED`, membre de
    l'organisation avec son rôle et son rôle métier ; l'e-mail d'invitation part après la transaction (même file et
    même gabarit que l'invitation d'un administrateur ; `orgName` = le nom de l'organisation, `inviterName` =
    `Prospera`). Réponse `{ organisationId, invites, existants, membres: [{ userId, issue: INVITE | EXISTANT }] }` :
    **201** si un membre est invité, **200** sinon. Idempotente : un membre déjà là n'est ni réécrit ni réinvité. Refus
    (rien d'écrit) : 404 `ORGANISATION_INCONNUE` ; 422 `MEMBRE_EN_DOUBLE`, `COMPTE_DU_JEU_HORS_DU_REEL` (adresse
    `@jeu-demonstration.invalid`), `TENANT_ROLE_INCONNU`, `TENANT_ROLE_NON_PROPOSE` ; 409 `MEMBRE_EN_CONFLIT`.
    `identity.user.registered@1` (statut `INVITED`), `identity.membership.changed@1` et `identity.droits.changed@1`
    partent dans la transaction, **charges inchangées**, aucun schéma touché.
  - **Catalogue, contrat `mise-en-service.openapi.json` 1.0.0 → 1.1.0** (ajouts facultatifs) :
    `POST /api/instance/v1/mises-en-service/{organisationId}` reçoit `invites` (facultatif, 200 au plus, schéma
    `InviteDuReel` : la forme d'un membre ci-dessus) ; le bilan reçoit `invitations` (facultatif,
    `InvitationsDeLaMiseEnService` : `{ etat: ENVOYEES | A_REPRENDRE | REFUSEES, demandes, invites?, existants?, code?,
    motif?, le? }`, sans nom ni adresse). Une mise en service acceptée (201) ou rejouée (200) avec `invites` appelle la
    route d'auth APRÈS sa transaction ; elle ne la conditionne pas ; un refus (404, 409, 503) n'invite personne ;
    rejouer l'ordre avec la liste reprend une invitation `A_REPRENDRE`. Aucune variable neuve : l'adresse d'auth et le
    secret de la naissance (`NAISSANCE_AUTH_URL`, `MOTEUR_JETON_SERVICE`, `NAISSANCE_DELAI_MS`).
  - **Pour A** (console, D-L4-2) : l'écran de mise en service pourra transmettre les utilisateurs de l'essai
    (`invites`, lus dans l'auth de l'essai) et afficher `invitations` ; sans écran, rien ne change. **Pour C, D** :
    rien chez vous.

- **2026-11-18, STORY-970 — la clôture, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`, EPIC-119 ;
  fiche `stories/STORY-970.md`, D-970-1 → 14). **Fusionné le 18/11** : comptabilite #10, `b27593c` sur `dev` (annonce :
  stories #674), sans écart au contrat annoncé. Des routes, un champ et des collections AJOUTÉS, rien de renommé ;
  **deux comportements changent** : un exercice clôturé refuse toute écriture, et des à-nouveaux nés d'une clôture ne
  se contre-passent pas à la main.
  - **Routes neuves** sous `/api/v1/dossiers/{d}/exercices/{e}`, écriture sous **`comptabilite:exercice:cloturer`**
    (déclaré en 958, attribué à `CAB_ASSOCIE` seul en 971 : **aucun droit neuf**) :
    - `POST …/cloture` (sans corps) → **201** `Cloture`, **200** au rejeu (rien d'écrit) ;
    - `POST …/cloture/reouverture { motif }` (obligatoire, pas fait d'espaces, 500 au plus) → **201** `EtatDeCloture` ;
    - lecture (`comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule`) : `GET …/cloture`
      (`EtatDeCloture` : `etat` NON_CLOTURE | CLOTURE | ROUVERT, `derniere`, `historique`) et `GET …/centralisation`
      (`{ figee, clotureId, centralisation: { lignes: [{ journal, mois, devise, pieces, debit, credit, equilibree }],
      journaux, totaux } }`).
    - `Cloture` = `{ id, numero, referentiel, devise, debutExercice, finExercice, centralisation, resultat: { sens:
      BENEFICE | PERTE | NUL, montant, compte, totalCharges, totalProduits }, aNouveaux: { exerciceId, ecritureId,
      numero, journal, dateEcriture, nombreDeLignes, piecesOuvertes, totalDebit, totalCredit }, balance: { version,
      checksum, publieeParLaCloture } | null, nombreDeComptes, rangDansLaPiste, cloturePar, clotureLe, reouverture }`.
  - **Champ AJOUTÉ, facultatif** : `aNouveauDe: { clotureId, exerciceId }` sur toute écriture lue (les à-nouveaux nés
    d'une clôture et leur contre-passation par la réouverture).
  - **Comportements** : sur un exercice **clôturé**, saisie, correction, abandon, validation, contre-passation,
    lettrage, propositions, acceptation, délettrage et publication de la balance rendent 409 **`EXERCICE_CLOS`** avec
    `details: { statut: 'CLOTURE', clotureId }` — même si dossier-service l'a rouvert (dossier-service CLOS garde
    `details.statut = 'CLOS'`) ; la consultation reste ouverte. La contre-passation d'à-nouveaux nés d'une clôture : 409
    **`A_NOUVEAUX_DE_CLOTURE`** (seule la réouverture les annule).
  - **Ce que fait la clôture**, dans une transaction : la balance définitive au 31/12 publiée sur `balance.submitted`
    (le fait de 967, inchangé ; ou la même, déjà publiée, reprise) ; la centralisation figée ; l'écriture
    d'à-nouveaux passée dans le journal `AN` de l'exercice SUIVANT (née validée, numérotée, datée du premier jour) ; le
    sceau sur la chaîne de piste. `comptes-de-cloture@1` (donnée du service) : SN et SMT bilan 1-5, gestion 6-8,
    résultat 131 / 139 ; CIMA bilan 1-5 et 88, gestion 6, 7, 82-86, résultat 88 ; SFD-BCEAO bilan 1-5, gestion 6, 7,
    résultat 59.
  - **Refus nommés neufs** : 409 `PISTE_ROMPUE`, `COMPTES_HORS_CLOTURE`, `EXERCICE_SUIVANT_NON_OUVERT`,
    `EXERCICE_SUIVANT_TENU_AUX_CAHIERS`, `EXERCICE_SUIVANT_CLOS`, `EXERCICE_SUIVANT_CLOTURE`, `EXERCICES_NON_CONTIGUS`,
    `REFERENTIELS_DIFFERENTS`, `JOURNAL_DES_A_NOUVEAUX_ABSENT`, `EXERCICE_NON_CLOTURE`, `A_NOUVEAUX_LETTRES`,
    `A_NOUVEAUX_DE_CLOTURE` ; 422 `A_NOUVEAUX_TROP_VOLUMINEUX`. Piste : `EXERCICE_CLOTURE`, `EXERCICE_ROUVERT`,
    `A_NOUVEAUX_GENERES`, `A_NOUVEAUX_CONTREPASSES`.
  - **Base** : collections neuves `clotures`, `reouvertures` (en ajout seul) ; champ `scellee` sur `chaines_de_piste` ;
    champ `aNouveauDe` sur `ecritures`. Aucun topic, aucun schéma au registre, aucune variable.
  - **Manifeste** (`manifestes/comptabilite.manifest.ts`, amendé dans cette PR) : deux routes de lecture, commentaire
    de la clôture et des droits, « clôtures » dans l'avertissement de désinstallation.
  - **Pour A** (relecture) : rien à changer chez vous ; dossier-service n'est ni appelé en écriture ni modifié (voir
    « → A » : les deux verrous). **Pour D** : rien.

- **2026-11-18, STORY-969 — le lettrage, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`, EPIC-116 ;
  fiche `stories/STORY-969.md`, D-969-1 → 14). **Fusionné le 18/11** : comptabilite #9, `3f8806b` sur `dev` (annonce :
  stories #672), sans écart au contrat annoncé. Des routes, un champ et des collections AJOUTÉS, rien de renommé ; **un
  comportement change** : la contre-passation d'une écriture lettrée est refusée.
  - **Routes neuves** sous `/api/v1/dossiers/{d}/exercices/{e}`, écriture sous **`comptabilite:lettrage:realiser`**
    (déclaré en 958, attribué en 971 aux deux rôles du cabinet : **aucun droit neuf**) :
    - `POST …/lettrages` `{ lignes: [{ ecritureId, ligne, montant? }] (2 à 200), solderLEcart?, propositionId? }` →
      201 `Lettrage` (`code` AA, AB…, `type` COMPLET | PARTIEL, `etat` ACTIF | DEFAIT, `dateDuLettrage`, `lignes` avec
      `montant` et `resteApres`, `ecart` | null, `provenance`, `proposition` | null, `delettrage` | null) ;
    - `POST …/lettrages/propositions` `{ tiersId?, fenetreJours? }` → 201 `{ fenetreJours, seuilEcart, propositions:
      [{ id, critere: REFERENCE | MONTANT_ET_DATE, racine, tiers, lignes, totalDebit, totalCredit, ecart }] }` (rien
      n'est lettré) ; `POST …/lettrages/propositions/{id}/acceptation` → 201 `Lettrage` (`PROPOSE_PAR_LA_MACHINE`) ;
    - `POST …/lettrages/{id}/delettrage` `{ motif }` → 201 `Lettrage` (`etat: DEFAIT`) ;
    - lecture (`comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule`) : `GET …/lettrages`, `GET
      …/lettrages/{id}`, `GET …/tiers/{tiersId}/lignes-a-lettrer`.
  - **Champ AJOUTÉ, facultatif** : `reference` (1 à 40 caractères) sur les lignes de `POST …/ecritures` et `PUT
    …/ecritures/{id}`, sur les lignes de toute écriture lue et sur les mouvements du grand livre.
  - **Comportement** : `POST …/ecritures/{id}/contre-passation` d'une écriture dont une ligne est lettrée ⇒ 409
    **`ECRITURE_LETTREE`** (`details.codes`) : délettrer d'abord.
  - **Écart de règlement** : sous le seuil (variable facultative neuve **`LETTRAGE_SEUIL_ECART`**, 1 000 par défaut,
    0 à 100 000), une écriture née VALIDÉE et numérotée dans le journal des opérations diverses (`OD-000001`), comptes
    `comptes-d-ecart@1` (SN, SMT : 658 / 758 ; CIMA : 844 / 849 ; SFD-BCEAO : aucun). Elle entre au grand livre et à
    la balance comme toute écriture validée.
  - **Refus nommés neufs** : 422 `LIGNE_EN_DOUBLE`, `LIGNE_NON_LETTRABLE` (`details.motif` : NON_VALIDEE,
    HORS_COLLECTIF, SANS_TIERS), `COMPTES_DE_TIERS_DIFFERENTS`, `LETTRAGE_D_UN_SEUL_SENS`, `LETTRAGE_DESEQUILIBRE`,
    `ECART_SUR_LETTRAGE_PARTIEL`, `ECART_AU_DELA_DU_SEUIL`, `FENETRE_INVALIDE` ; 409 `LIGNE_DEJA_LETTREE`,
    `ECART_NON_DECLARE`, `LETTRAGE_DEJA_DEFAIT`, `ECRITURE_LETTREE` ; 404 `LIGNE_INTROUVABLE`, `LETTRAGE_INTROUVABLE`,
    `PROPOSITION_INTROUVABLE`. Piste : `LETTRAGE_REALISE`, `LETTRAGE_DEFAIT`, `ECART_DE_REGLEMENT_PASSE`.
  - **Base** : collections neuves `lettrages`, `delettrages`, `propositions_de_lettrage` (en ajout seul),
    `comptes_de_lettrage` (versionnée : verrou et compteur des codes). **Aucune écriture n'est modifiée.**
  - **Inchangé** : `balance.submitted` (le lettrage n'affecte aucun solde : même version, même `checksum`) ; aucun
    topic, aucun schéma au registre.
  - **Manifeste** (`manifestes/comptabilite.manifest.ts`, amendé dans cette PR) : trois routes de lecture, commentaire
    du lettrage et des droits, « lettrages » dans l'avertissement de désinstallation.
  - **Pour A** (relecture) : rien chez vous. **Pour D** : rien.

- **2026-11-17, STORY-972 — les comptes du jeu et la connexion « en tant que » dans auth, la comptabilité au
  catalogue, annoncé AVANT la fusion du code** (`prospera-auth-service`, `prospera-platform-catalog-service`,
  `prospera-plateforme` ; fiche `stories/STORY-972.md`, D-972-1 → 10). **Fusionné le 17/11** : auth #44 `8661bbf`,
  catalogue #60 `6e5f052` et `2c3a933`, plateforme #31 `a06d8c9` (annonce : stories #668), sans écart au contrat
  annoncé. Tout est AJOUT : aucune route, aucun champ, aucun topic existants ne changent de forme.
  - **Auth, variable neuve** `INSTANCE_ESPACE` (facultative, la même que chez A et D) : `ESSAI` seulement si dit,
    sinon `REEL`. En réel, les trois routes ci-dessous rendent **403 `ESPACE_REEL_REFUSE`** avant la lecture du corps.
  - **Auth, route neuve (moteur)** : `PUT /api/v1/interne/organisations/{organisationId}/comptes-du-jeu`, sous
    l'identité de service du moteur (`MOTEUR_JETON_SERVICE`, comme la naissance ; 401 `IDENTITE_DU_MOTEUR_REQUISE`).
    Corps `{ comptes: [{ objet, cle, prenom, nom, roleMetier }] }` (1 à 200). Chaque compte naît sous
    `identifiantDuJeu(organisationId, objet, cle)` (D-1058-4 ; `commercial`, `COM-nn` pour un agent) : utilisateur
    `ACTIVE`, sans mot de passe, adresse `<objet>.<cle>.<org>@jeu-demonstration.invalid`, membre `TENANT_USER` avec son
    rôle métier (du socle, proposé au métier de l'organisation). Réponse `{ organisationId, poses, existants, comptes:
    [{ userId, objet, cle, prenom, nom, roleMetier }] }` : **201** si un compte naît, **200** au rejeu (rien de
    réécrit). Refus : 404 `ORGANISATION_INCONNUE` ; 422 `COMPTE_EN_DOUBLE`, `TENANT_ROLE_INCONNU`,
    `TENANT_ROLE_NON_PROPOSE` ; 409 `COMPTE_DU_JEU_EN_CONFLIT` (un utilisateur qui n'est pas un compte du jeu sous cet
    identifiant).
  - **Auth, routes neuves (membre de l'essai)** : `GET /api/v1/essai/comptes-du-jeu` → `{ comptes: [...] }` (même
    forme) ; `POST /api/v1/essai/connexion-en-tant-que { compteId }` → **200**, la paire de jetons de la connexion
    (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`), émise pour le compte visé (son `roleMetier`, ses
    droits, son `dv`). Refus : 403 `APPELANT_HORS_ORGANISATION` (l'appelant n'est pas membre actif de l'organisation
    de son jeton) ; 404 `COMPTE_DU_JEU_INCONNU` (tout ce qui n'est pas un compte du jeu actif de cette organisation).
  - **Auth, base** : collection neuve `comptes_du_jeu` (en ajout seul, index unique `(organisationId, objet, cle)`).
    `identity.user.registered@1`, `identity.membership.changed@1` et `identity.droits.changed@1` partent à la pose,
    **charges inchangées**, aucun schéma touché.
  - **Catalogue** : le module `comptabilite` 0.1.0 entre au catalogue (copie de son manifeste, 47 copies) ; les
    manifestes amendés de C, de D et de `paiement` sont recopiés à leur version. Fichier neuf `.env.essai.example` (la
    partie A de l'essai : `INSTALLATION_SERVICES` nomme `commande` et `terrain`). Aucune route, aucun schéma, aucun
    topic du catalogue ne change.
  - **Plateforme** : une ligne du README, rien d'autre.
  - **Pour D** : vos services ne changent rien ; le compte de Kodjo a l'identifiant de son `commercial` `COM-01`.
    **Pour A** (relecture) : rien chez vous. **Pour C** : D-972-3 (vos manifestes recopiés à leur version).

- **2026-11-17, STORY-968 — les comptes de tiers, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-115 ; fiche `stories/STORY-968.md`, D-968-1 → 12). **Fusionné le 17/11** : comptabilite #8, `92a861a` sur
  `dev` (annonce : stories #665), sans écart au contrat annoncé. Des routes et des champs AJOUTÉS, rien de renommé ; **un
  comportement change** : une ligne sur un compte collectif sans tiers est refusée.
  - **Routes neuves** (droit de lecture `comptabilite:dossier:consulter`, au manifeste en `routesLectureSeule`) :
    - `POST /api/v1/dossiers/{d}/tiers` (**`comptabilite:tiers:administrer`**, déjà déclaré et attribué en 971 : aucun
      droit neuf) : `{ code, nom, categorie: CLIENT | FOURNISSEUR | SALARIE, delaiDePaiementJours?, referenceExterne?:
      { systeme, id } }` → 201, 200 au rejeu, 409 `TIERS_EN_DOUBLE` ; `GET /api/v1/dossiers/{d}/tiers` (pages par
      code) et `GET /api/v1/dossiers/{d}/tiers/{tiersId}` ;
    - sous `/api/v1/dossiers/{d}/exercices/{e}` : `GET …/comptes-collectifs` (`comptes-collectifs@1`), `GET
      …/comptes-collectifs/{racine}/auxiliaires` (par tiers, `sansTiers`, `collectifAuGrandLivre`, `concorde`), `GET
      …/tiers/balance-agee?au=&categorie=&tranches=&devise=` (tranches `NON_ECHU`, `0-30`, `31-60`, `61-90`, `91+` par
      défaut ; montants signés débit − crédit ; `au` absente = horloge du service), `GET …/tiers/{tiersId}/grand-livre`
      (la forme du grand livre d'un compte, avec `tiers` et le `compte` de chaque mouvement).
  - **Champs AJOUTÉS, facultatifs** : `tiersId` et `echeance` sur les lignes de `POST …/ecritures` et `PUT
    …/ecritures/{id}`, sur les lignes de toute écriture lue, et sur les mouvements de `GET …/grand-livre/comptes/{c}`.
  - **Comportement** : une ligne sur un collectif (SN, SMT : 401, 409, 411, 416, 419, 421, 422 ; CIMA : 411, 414, 420,
    425 ; SFD-BCEAO : aucun) sans tiers ⇒ 422 **`TIERS_REQUIS`**, à la saisie, à la correction ET à la validation (un
    brouillard d'avant 968 se corrige avant d'être validé). Un tiers ou une échéance hors collectif ⇒ 422
    `TIERS_HORS_COLLECTIF`. Les écritures déjà validées ne changent pas.
  - **Refus nommés neufs** : 422 `TIERS_REQUIS`, `TIERS_INCONNU`, `TIERS_HORS_COLLECTIF`, `ECHEANCE_INVALIDE`,
    `TRANCHES_INVALIDES` ; 409 `TIERS_EN_DOUBLE` ; 404 `TIERS_INTROUVABLE`, `COLLECTIF_INCONNU`.
  - **Base** : collection neuve `tiers` (en ajout seul), index neuf `grand_livre_par_tiers` sur `ecritures`.
  - **Inchangé** : `balance.submitted` (la balance publiée porte toujours le compte du plan, le collectif, jamais un
    compte auxiliaire : le hub n'a rien à changer). Aucun topic, aucun schéma, aucune variable.
  - **Manifeste** (`manifestes/comptabilite.manifest.ts`, amendé dans cette PR) : six routes de lecture, commentaire
    des tiers et des droits, « tiers » dans l'avertissement de désinstallation.
  - **Pour A** (relecture) : rien à changer chez vous. **Pour D** : un tiers de la comptabilité peut citer un point de
    vente (`referenceExterne: { systeme: 'paiement', id: 'pdv-0042' }`) ; il n'est jamais lu chez vous.

- **2026-11-17, STORY-967 — la balance dérivée du grand livre, publiée au hub, annoncé AVANT la fusion du code**
  (`prospera-comptabilite-service`, EPIC-114 ; fiche `stories/STORY-967.md`, D-967-1 → 12). **Fusionné le 17/11** :
  comptabilite #7, `328e727` sur `dev` (annonce : stories #660), sans écart au contrat annoncé. Le PREMIER fait produit
  par le service. Tout est AJOUT : rien d'existant ne change de forme.
  - **Fait produit** : `balance.submitted` v1, le contrat d'ENTRÉE de `balance-service` (A), **inchangé** (JSON
    Schema `docs/schemas/balance.submitted.v1.schema.json`, pas de registre). Clé `orgId`, en-têtes `eventId` et
    `schemaVersion: "1"`, par une outbox écrite dans la transaction de la publication. `sourceSystem:
    "comptabilite-service"` ; `balance.source: "direct"`, `balance.origine: "comptabilite"` (A-921) ; `referentiel`
    (tag du dossier pour l'exercice) et `devise` déclarés ; `exercice` = bornes de dossier-service en ISO ; lignes aux
    quatre colonnes en unités mineures entières : **mouvements hors à-nouveaux**, **soldes de clôture** à la date
    d'arrêté, `niveauPreuve: "fichier"`, libellé « Compte <numéro> » ; `checksum` = sceau v2 du hub (prouvé sur ses
    deux vecteurs) ; `metadata.periode` = date d'arrêté.
  - **Faits consommés** : `balance.created` et `balance.rejected` (groupe `comptabilite-retours-balance`), pour porter
    le verdict du hub sur la publication.
  - **Routes neuves** (sous `/api/v1/dossiers/{d}/exercices/{e}`) :
    - `POST …/balance/publications`, droit **`comptabilite:ecriture:valider`** (déjà déclaré et attribué : aucun droit
      neuf, rien à faire dans auth), corps `{ au? }` → 201 (version neuve) ou 200 (même contenu que la dernière
      publication non rejetée : même version, même `checksum`, rien d'envoyé) ;
    - `GET …/balance/publications` et `GET …/balance/publications/{version}`, droit `comptabilite:dossier:consulter`,
      au manifeste en `routesLectureSeule`.
    - Une publication : `{ publicationId, dossierId, exerciceId, version, origine, source, sourceSystem, periode: {
      du, au }, exercice: { debut, fin }, referentiel, devise, checksum, eventId, nombreDeComptes, totaux: {
      mouvementDebit, mouvementCredit, soldeDebiteur, soldeCrediteur }, lignes?, etat: PUBLIEE | INGEREE | REJETEE,
      hub: null | { balanceId?, code?, motif?, recuLe }, publieePar, publieeLe }`.
  - **Refus nommés neufs** : 409 `BROUILLARDS_A_VALIDER` (`details.brouillards`, `au` : Q2, refus et non
    avertissement, D-967-4), 409 `BALANCE_VIDE`, 422 `BALANCE_DESEQUILIBREE` (`details.ecartMouvements`,
    `ecartSoldes`), 404 `PUBLICATION_INTROUVABLE`.
  - **Base** : collections neuves `balances_publiees` et `outbox_events`. **Variables facultatives** :
    `OUTBOX_RELAIS_INTERVALLE_MS`, `KAFKA_RETOURS_BALANCE_GROUP_ID`. **Manifeste** (`manifestes/comptabilite.manifest.ts`,
    amendé dans cette PR) : commentaire des droits corrigé (D-971-8), `publie`, `consomme`, deux routes de lecture.
  - **Pour A** (relecture) : `balance-service` n'a rien à changer, sauf l'allowlist (« → A » ci-dessus).

- **2026-11-17, STORY-971 — dix droits neufs au catalogue de tenant d'auth, hors du jeton, annoncés AVANT la fusion
  du code** (`prospera-auth-service`, branche `MNV-971` ; fiche `stories/STORY-971.md`, D-971-1 → 8). **Fusionné le
  17/11** : auth #43, `913bd92` sur `dev` (annonce : stories #656). Tout est AJOUT : aucune route, aucun champ, aucun
  topic ne change de forme.
  - **Catalogue** (`DROITS_HORS_JETON`) : `commande:parametres:modifier` (demande de D, D-1053-7) et les neuf droits du
    manifeste `comptabilite` (`comptabilite:dossier:consulter`, `:exercice:ouvrir`, `:journal:administrer`,
    `:ecriture:saisir`, `:ecriture:valider`, `:tiers:administrer`, `:lettrage:realiser`, `:exercice:cloturer`,
    `:piste:consulter`). 152 codes en tout (24 du jeton, 128 hors du jeton). **Jamais dans `perms[]`** : la borne du
    jeton ne bouge pas (17 + 24 = 41 ≤ 44).
  - **Servis par** `GET /api/v1/moi/droits`, dans `droitsHorsJeton` (contrat `moi-droits` 1.1.0, inchangé). Les droits
    de tenant effectifs restent `droits ∪ droitsHorsJeton`.
  - **Attributions par défaut** :
    - `CAB_ASSOCIE` (rôle par défaut du `TENANT_ADMIN` d'un cabinet) : les neuf `comptabilite:*` ;
    - `CAB_COLLABORATEUR` (rôle par défaut du `TENANT_USER`) : `dossier:consulter`, `ecriture:saisir`,
      `ecriture:valider`, `tiers:administrer`, `lettrage:realiser`, `piste:consulter` (ni ouvrir, ni arrêter le plan
      de journaux, ni clore : D-971-2) ;
    - `DIST_DG` et `DIST_ADMIN` : `commande:parametres:modifier` (D-971-3). Aucun autre rôle.
  - **Pas d'avance de `dv`** à la livraison (D-949-3) : les caches `(membre, organisation, dv)` des services voient les
    droits neufs à leur terme (60 s au plus). Le jeton ne change pas.
  - **`identity.droits.changed@1` ne change pas** : il ne porte aucun droit (D-949-4) ; schéma non touché, rien à
    enregistrer au registre.
  - **Pour D** : `PUT /api/v1/commande/parametres` passe pour un DG ou un `DIST_ADMIN` dès le déploiement d'auth (cache
    compris). **Pour la comptabilité (B)** : sa garde lit déjà `droits ∪ droitsHorsJeton` (D-961-7) ; rien n'y change.
    Un rôle personnalisé ou une surcharge peuvent désormais composer ces dix droits (module souscrit exigé, STORY-167).

- **2026-11-17, STORY-966 — le grand livre, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-114 ; fiche `stories/STORY-966.md`, D-966-1 → 11). **Fusionné le 17/11** : comptabilite #6, `7fed6ce` sur
  `dev` (annonce : stories #652). Tout est AJOUT : rien d'existant ne change de forme.
  - **Routes neuves** (sous `/api/v1/dossiers/{d}/exercices/{e}`), droit **`comptabilite:dossier:consulter`** (déjà
    déclaré au manifeste depuis 958 : aucun droit neuf ; lu par `/moi/droits`, `droits ∪ droitsHorsJeton`), au
    manifeste en `routesLectureSeule` :
    - `GET …/grand-livre?du=&au=&devise=&apres=&limite=` → les comptes mouvementés de la période : `{ dossierId,
      exerciceId, exercice: { debut, fin }, periode: { du, au }, devise, brouillardsDansLaPeriode, comptes: [{ compte,
      soldeOuverture: { soldeDebiteur, soldeCrediteur }, aNouveaux: { debit, credit }, mouvements: { debit, credit },
      soldeCloture: { soldeDebiteur, soldeCrediteur }, nombreDeLignes }], totaux: { soldeOuverture, aNouveaux,
      mouvements, soldeCloture, equilibre }, nombreDeComptes, suivant }` (comptes en ordre de points de code, curseur =
      dernier compte rendu, `limite` 1 → 1 000, 500 par défaut) ;
    - `GET …/grand-livre/comptes/{compte}?du=&au=&devise=&apres=&limite=` → `{ dossierId, exerciceId, compte, exercice,
      periode, devise, soldeOuverture, totaux: { debit, credit }, soldeCloture, nombreDeMouvements, reporte, mouvements:
      [{ ecritureId, numero, journal, dateEcriture, ligne, libelle, libelleEcriture, pieceId, debit, credit,
      soldeDebiteur, soldeCrediteur, contrePasse? }], suivant }` (ordre : date, journal, numéro définitif, ligne ;
      curseur opaque ; `limite` 1 → 1 000, 200 par défaut).
  - **Sémantique** : seules les écritures `VALIDEE` (contre-passations comprises) ; `du` et `au` inclusifs, par défaut
    les bornes de l'exercice ; solde d'ouverture = cumul avant `du` dans l'exercice ; montants entiers en unité mineure
    (nombres JSON), sommés exactement ; soldes en deux colonnes (`soldeDebiteur`, `soldeCrediteur`) comme le contrat
    canonique de balance ; à-nouveaux = journaux de nature `A_NOUVEAUX` du plan arrêté.
  - **Refus nommés neufs** : 422 `PERIODE_HORS_EXERCICE` (`details.du`, `au`, `debut`, `fin`), `PERIODE_INVALIDE`
    (`details.du`, `au`), `MONTANT_HORS_BORNE` (`details.quoi`, `valeur` en chaîne) ; 409 `DEVISE_A_PRECISER`
    (`details.devises`) ; 400 `COMPTE_MALFORME`, `CURSEUR_INVALIDE`. Existants : 409 `EXERCICE_TENU_AUX_CAHIERS`, 404
    `EXERCICE_NON_OUVERT`, `EXERCICE_INTROUVABLE`, 403 `DROIT_INSUFFISANT`.
  - **Base** : index neuf `grand_livre_par_compte` sur `ecritures`. **Manifeste** (`manifestes/comptabilite.manifest.ts`,
    amendé dans cette PR) : les deux routes en `routesLectureSeule`, commentaire des droits et du grand livre.
  - Aucun topic, aucun schéma au registre, aucune variable. **Pour A** (relecture) : la forme de la liste des comptes
    est celle dont 967 dérivera `balance.submitted` (origine `comptabilite`) ; rien n'est publié par 966.

- **2026-11-17, STORY-965 — la Créance (2) : `paiement.creance.changed@1`, le crédit du tiers et ses compteurs,
  annoncé AVANT la fusion du code** (`prospera-paiement-service`, EPIC-231 ; fiche `stories/STORY-965.md`,
  D-965-1 → 12). **Fusionné le 17/11** : paiement #123, `96c385f` → `ad35786` sur `dev` (annonce : stories #648).
  Sujet `paiement.creance.changed-value` enregistré (id 1, BACKWARD) sur le Karapace de la pile de preuve. Tout est
  AJOUT : rien d'existant ne change de forme.
  - **Topic neuf `paiement.creance.changed`** (contrat `@1`, `schemaVersion: 1`), producteur unique
    `paiement-service`, par son outbox, **dans la transaction de chaque changement** d'une Créance à source du
    périmètre `SOCIETE` : ouverture (`OUVERTURE`), encaissement constaté (`ENCAISSEMENT`), déclaré (`DECLARATION`),
    validé (`VALIDATION`), affecté (`AFFECTATION`), contre-passé (`CONTRE_PASSATION`), clôture (`CLOTURE`).
    **Clé de partition : `orgId`.** Schéma au registre Karapace, sujet `paiement.creance.changed-value`,
    compatibilité **BACKWARD**, modèle fermé (`contrat/schemas/paiement.creance.changed.json`).
  - **Charge (état absolu, tout requis)** : enveloppe `schemaVersion`, `eventId`, `orgId`, `occurredAt` ; puis
    `organisationId`, `creanceId` (= `<source>:<sourceId>`, K-7), `cleRegistre` (l'`id` de `GET /creances/{id}`),
    `revision` (entier ≥ 1, strictement croissant par Créance, donné par la base), `cause`, `source`, `sourceId`,
    `tiersId`, `perimetre` (`SOCIETE`), `livraisonId` (ou `null`), `devise`, `statut` (`OUVERTE` | `CLOTUREE`),
    `montantOrigineMineur`, `confirmeMineur`, `montantDeclareMineur`, `annuleMineur`, `restantCertainMineur`,
    `restantAfficheMineur`, `montantExigibleMineur` (= le certain), `tropPercuMineur`, `echeanceLe` (`AAAA-MM-JJ`),
    `lueLe` (ISO). Montants entiers en unité mineure.
  - **Écarts à ce que D attendait** (« → B, ce que la bibliothèque d'encours lit ») : aucun pour `FaitCreance`
    (mêmes noms, révision, deux restants). **`paiement.credit-tiers.changed@1` n'est PAS publié par 965** : le crédit
    du tiers de cette version, ce sont les trop-perçus, portés par `tropPercuMineur` (D-965-6). Une Créance du
    périmètre d'un freelance ne publie rien sur ce topic (amendement §1.2).
  - **Route neuve** `GET /api/v1/creances/tiers/{tiersId}/compteurs?perimetre=SOCIETE|FREELANCE:<id>`, droit
    **`paiement:creance:consulter`, lu hors du jeton** (`GET /moi/droits`, `droits ∪ droitsHorsJeton`, cache
    `(membre, organisation, dv)` 60 s), garde du module → `{ tiersId, perimetre, le, parDevise: [{ devise,
    nombreDeCreancesOuvertes, nombreDeCreancesEchues, restantCertainMineur, restantAfficheMineur, echuCertainMineur,
    plusAncienneEcheance, retardMaxJours, creditDuTiersMineur, versionEncours }] }`, calculé par `encours@1` (copie à
    l'octet de `encours-v1`), sans encours (l'engagement est à `commande`). Refus : 400 `CREANCE_INVALIDE`
    (`tiersId`), 400 de validation (`perimetre`), 403 `PAIEMENT_NOT_ENTITLED`, 403 `PERMISSION_DENIED`
    (`details.droit`), 503 `DROITS_INDISPONIBLES`.
  - **Collection neuve** `etats_de_creance` (le dernier état publié, la révision). **Variables neuves, facultatives** :
    `AUTH_SERVICE_URL` (forme `http://auth-service:3001/api/v1` ; absente, la route ferme en 503),
    `AUTH_SERVICE_TIMEOUT_MS` (3 000). **Manifeste** (`manifestes/paiement.manifest.ts`, amendé dans cette PR) : la
    route en `routesLectureSeule`.
  - **Pour `catalogue-faits@1` (D)** : `paiement.creance.changed@1` y est déjà ; rien à demander.

- **2026-11-17, STORY-964 — la validation inaltérable, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-113 et 120 ; fiche `stories/STORY-964.md`, D-964-1 → 9). **Fusionné le 17/11** : comptabilite #5, `92f8c53` sur
  `dev` (annonce : stories #640). Tout est AJOUT, sauf un champ de la vue d'une écriture
  qui devient facultatif (`numeroProvisoire`, absent d'une contre-passation) ; aucun client ne lit encore ces routes.
  - **Routes neuves** (sous `/api/v1/dossiers/{d}/exercices/{e}`) :
    - `POST …/ecritures/{id}/validation`, droit `comptabilite:ecriture:valider`, corps vide : brouillard → définitif,
      numéro `VE-000001` continu par journal et par exercice, émis dans la transaction de la validation. 201, puis 200
      au rejeu (rien d'écrit) ;
    - `POST …/ecritures/{id}/contre-passation`, droit `comptabilite:ecriture:valider`, corps `{ dateEcriture, motif }`
      → 201, l'écriture inverse, née validée, numérotée, liée (`contrePasse`) ;
    - `PUT …/ecritures/{id}` (corps de la saisie sans `journal`) et `DELETE …/ecritures/{id}` (204), droit
      `comptabilite:ecriture:saisir` : corriger et abandonner un BROUILLARD ;
    - `GET …/piste/verification`, droit `comptabilite:piste:consulter` → `{ dossierId, exerciceId, intacte, entrees,
      tete: { rang, empreinte } | null, rupture?: { rang, motif, entreeId? }, verifieeLe }`. Motifs :
      `ENTREE_HORS_CHAINE`, `RANG_INATTENDU`, `EMPREINTE_ALTEREE`, `MAILLON_ROMPU`, `TETE_DISCORDANTE`. Au manifeste en
      `routesLectureSeule`.
  - **Vue d'une écriture** : `statut` admet `VALIDEE` ; champs facultatifs neufs `numero`, `valideePar`, `valideeLe`,
    `corrigeePar`, `corrigeeLe`, `contrePasse: { ecritureId, numero }`, `contrePasseePar: { ecritureId, numero }`.
    `numeroProvisoire` devient facultatif (absent d'une contre-passation). La liste trie par journal, puis brouillards,
    puis numéro définitif.
  - **Refus nommés neufs** : 409 `ECRITURE_VALIDEE_INALTERABLE` (`details.numero`), `ECRITURE_NON_VALIDEE`
    (`details.statut`), `ECRITURE_DEJA_CONTREPASSEE` (`details.contrePassation`, `numero`),
    `CONTREPASSATION_NON_CONTREPASSABLE` (`details.contrePasse`) ; 422 `DATE_ANTERIEURE_A_L_ORIGINALE`
    (`details.date`, `dateOriginale`).
  - **Piste** : actes neufs `ECRITURE_VALIDEE`, `ECRITURE_CONTREPASSEE`, `ECRITURE_CORRIGEE`, `ECRITURE_ABANDONNEE` ;
    champs neufs sur chaque entrée : `rang` (continu par exercice), `empreintePrecedente`, `empreinte` (SHA-256 hex de
    la forme canonique, version 1). Collection neuve `chaines_de_piste` (la tête de chaque exercice).
  - **Base** : l'index `un_numero_provisoire_par_journal` devient `un_numero_provisoire_par_journal_v2` (partiel) ;
    index neufs `un_numero_definitif_par_journal`, `une_contre_passation_par_ecriture`, `un_rang_par_exercice`.
  - **Manifeste** (`manifestes/comptabilite.manifest.ts`, amendé dans cette PR) : la route de vérification en
    `routesLectureSeule` ; commentaire des droits (pas de séparation des pouvoirs au niveau de l'acteur, D-964-7) et de
    l'inaltérabilité.
  - Aucun topic, aucun schéma au registre, aucune variable.

- **2026-11-17, STORY-963 — la Créance (1), annoncé AVANT la fusion du code** (`prospera-paiement-service`, EPIC-231 ;
  fiche `stories/STORY-963.md`, D-963-1 → 12). **Fusionné le 17/11** : paiement #122, `716059c` sur `dev` (annonce :
  stories #633). Tout est AJOUT : rien d'existant ne change de forme.
  - **Route neuve** `PUT /api/v1/creances/sources/{source}/{sourceId}`, droit `paiement:demande:emettre` (dans le
    jeton), garde du module (pas une surface plateforme). Corps : `{ tiersId, perimetre: SOCIETE | FREELANCE:<id>,
    montantOrigineMineur (entier > 0, unité mineure), devise, echeanceLe: AAAA-MM-JJ, libelle, livraisonId?, payeur? }`.
    201 (née) ou 200 (rejeu, rien d'écrit) → la vue d'une créance. Clé : `(source, sourceId)`, `sourceId` =
    identifiant interne `[A-Za-z0-9_-]{1,64}` ; l'`id` de la créance est `<orgId>|FACTURATION|FACTURE:<SOURCEID>`.
  - **Refus nommés neufs** : 422 `SOURCE_DE_CREANCE_NON_SERVIE` (`details.source` ; `RELEVE_VENTE_COMPTE`,
    `ECHEANCE_DE_PRET`, `PRIME`) ; 409 `CREANCE_SOURCE_EN_CONFLIT` (`details.champ` : `source`, `sourceId`, `tiersId`,
    `perimetre`). `CREANCE_INVALIDE` (400) couvre aussi `source`, `sourceId`, `tiersId`, `perimetre`, `livraisonId`,
    `echeanceLe`, `rattachement`.
  - **`GET /api/v1/creances`** : filtres facultatifs `source`, `sourceId`, `tiersId`, `perimetre` (égalités exactes).
  - **Vue d'une créance** (toutes les routes qui la rendent) : champs facultatifs `source`, `sourceId`, `tiersId`,
    `perimetre`, `livraisonId`, absents pour une créance sans source.
  - **`paiement.creance.materialisee`** (topic JSON, sans registre) : mêmes champs facultatifs, ajoutés quand la Créance
    a une source. La piste (`CREANCE_MATERIALISEE`) les reçoit aussi.
  - Aucun topic neuf, aucun schéma au registre, aucune variable, aucun amendement du manifeste (la route de lecture
    `GET /api/v1/creances` y est déjà). `paiement.creance.changed@1` : STORY-965.

- **2026-11-17, STORY-962 — l'écriture en brouillard, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-113 ; fiche `stories/STORY-962.md`, D-962-1 → 10). **Fusionné le 17/11** : comptabilite #4, `ce22d81` sur
  `dev` (annonce : stories #623). Tout est AJOUT : rien d'existant ne change de forme.
  - **Route neuve** `POST /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ecritures`, droit
    `comptabilite:ecriture:saisir` (lu par `/moi/droits`). Corps : `{ journal, dateEcriture: AAAA-MM-JJ, libelle,
    pieceId, devise: XOF|XAF, lignes: [{ compte, libelle?, debit, credit }] (2 à 500), proposition? }`. **Montants :
    entiers en unité mineure** (comme `balance.submitted` v1 et paiement), jamais un flottant.
    201 → `{ id, dossierId, exerciceId, journal, statut: BROUILLARD, numeroProvisoire: VE-BR-000001, dateEcriture,
    libelle, devise, lignes, totalDebit, totalCredit, pieceJustificative: { pieceId, documentId, type, verifieeLe },
    saisiePar, saisieLe, provenance }`.
  - **Routes neuves de lecture** : `GET …/ecritures?journal=` et `GET …/ecritures/{ecritureId}`, ouvertes à tout
    membre dont la portée couvre le dossier ; au manifeste en `routesLectureSeule`.
  - **Refus nommés neufs** : 422 `PIECE_DESEQUILIBREE` (`details.totalDebit`, `totalCredit`, `ecart`),
    `LIGNE_SANS_MONTANT`, `LIGNE_DEBIT_ET_CREDIT` (`details.ligne`, `compte`), `PIECE_HORS_BORNE`,
    `DATE_HORS_EXERCICE` (`details.date`, `debut`, `fin`), `PIECE_JUSTIFICATIVE_INCONNUE` (`details.pieceId`) ;
    404 `ECRITURE_INTROUVABLE` ; 503 `DOCUMENTS_INDISPONIBLES`. Un `details` peut porter des nombres.
  - **Numérotation** : un brouillard prend un numéro PROVISOIRE (`<code>-BR-000001`, série à part par journal et par
    exercice, dans la transaction de la saisie) ; le numéro définitif viendra à la validation (STORY-964, D-962-1).
  - **Piste** : acte neuf `ECRITURE_SAISIE`, avec sa provenance (Q3).
  - **Lu chez C** (`document-service`, **sans rien lui demander de changer**) : `GET /api/v1/dossiers/{dossierId}/pieces?pieceId=`,
    avec le jeton du membre, borné à 3 s (D-962-4).
  - **Lu chez B (auth)** : le claim `dv` du jeton, qui clé le cache des droits `(membre, organisation, dv)` (D-962-5).
  - Variable neuve, requise : `DOCUMENT_SERVICE_URL`. Aucun topic, aucun schéma au registre.

- **2026-11-17, STORY-961 — le plan de journaux, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-112 ; fiche `stories/STORY-961.md`, D-961-1 → 7). **Fusionné le 17/11** : comptabilite #3, `acafd6f` sur
  `dev` (annonce : stories #621). Tout est AJOUT : rien d'existant ne change de forme.
  - **Route neuve** : `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/journaux` → `{ dossierId, exerciceId,
    referentiel, versionDuPlan, arreteLe, journaux: [{ code, libelle, nature, dernierNumero }] }`. Ouverte à tout
    membre dont la portée couvre le dossier ; au manifeste en `routesLectureSeule`.
  - **Le plan** est déclaré par référentiel (`plans-de-journaux@1`, donnée du service : SN, SMT, SFD-BCEAO, CIMA ;
    six natures `ACHATS`, `VENTES`, `BANQUE`, `CAISSE`, `OPERATIONS_DIVERSES`, `A_NOUVEAUX` ; codes `AC`, `VE`, `BQ`,
    `CA`, `OD`, `AN`). Il est arrêté pour l'exercice à son ouverture au JOURNAL, dans la transaction de la tenue.
  - **Refus nommés neufs** : 409 `EXERCICE_TENU_AUX_CAHIERS` (`details.tenue`), 409 `PLAN_DE_JOURNAUX_ABSENT`,
    404 `JOURNAL_INCONNU` (numérotation, pour 962).
  - **Piste** : l'entrée `EXERCICE_OUVERT` d'une ouverture au journal reçoit `donnees.referentiel` et
    `donnees.planDeJournaux` (`<référentiel>@<version>`).
  - **Numérotation** : `series-v1` de `prospera-plateforme` (dossier de D), copiée à l'octet, une série par journal et
    par exercice, numéro émis dans la transaction de l'acte. Aucune route ne l'expose avant 962.
  - **Lu chez B (auth)** : `droitsHorsJeton` de `GET /moi/droits` (contrat 1.1.0) ; la garde lit désormais
    `droits ∪ droitsHorsJeton`.
  - Aucun topic, aucun schéma au registre.

- **2026-11-17, STORY-960 — les 15 rôles du distributeur dans auth, annoncé AVANT la fusion du code**
  (`prospera-auth-service`, EPIC-223 ; fiche `stories/STORY-960.md`, D-960-1 → 12). **Fusionné le 17/11** : auth #42,
  `cf8e001` et `8d48710` sur `dev` (annonce : stories #616) ; `identity.droits.changed-value` version 2 au registre.
  Tout est AJOUT ; deux rôles du socle perdent ou gagnent des droits (ci-dessous).
  - **Rôles** : les 15 rôles `DIST_*` reçoivent la table de l'annexe B.2 du PRD distributeur (131 droits). Aucun rôle
    n'est plus « en attente de module » (ils passent `partiel`). **Changements de droits existants** : `DIST_ADMIN`
    perd `paiement:journal:consulter` et `notification:modele:rediger` ; `DIST_COMPTABLE` déclare, valide et annule
    (cumul signalé ; paiement refuse toujours de valider sa propre déclaration) ; `DIST_SUPERVISEUR` valide les
    encaissements (remises d'espèces). Attribuer `DIST_DG` ou `DIST_DAF` est réservé au dirigeant (ils portent
    `reprise:lot:valider`, 403 `VALIDATION_DE_REPRISE_RESERVEE_AU_DG`).
  - **Catalogue de tenant : 24 → 142 codes.** Les 118 nouveaux sont **hors du jeton** : jamais dans `perms[]`. Le
    jeton reste borné à ses 24 droits (17 + 24 = 41 ≤ 44). `support-client:*` n'y est pas.
  - **`GET /api/v1/moi/droits`** (contrat `moi-droits.openapi.json` 1.1.0) : champ AJOUTÉ `droitsHorsJeton`
    (tableau trié). `droits ∪ droitsPlateforme` reste exactement le `perms[]` du jeton ; **les droits de tenant
    effectifs sont `droits ∪ droitsHorsJeton`**. Pour un lecteur, absent = `[]`.
  - **Jeton d'accès** : claim AJOUTÉ `roleMetier` (code du rôle métier effectif, absent sans rôle). `roles` ne change
    pas.
  - **`identity.droits.changed@1`** : propriété AJOUTÉE, facultative, `roleMetierAttribue` (chaîne ou `null`, 64
    caractères au plus), sujet `identity.droits.changed-value` en **BACKWARD** au registre.
  - **Refus NOUVEAU** : 422 `DONNEE_PRIVEE_HORS_DU_ROLE` (`permissions`) sur la surcharge d'un rôle du socle qui
    gagnerait une donnée privée interdite (rémunérations, commissions, prix d'achat, marge : D-960-4). La résolution
    les retire aussi du jeton et de `/moi/droits`.
  - **Écritures de rôle** : `permissions`, `ajouts`, `retraits` acceptent 256 codes au plus (au lieu de 44).

- **2026-11-17, STORY-959 — les exercices et la tenue, annoncé AVANT la fusion du code**
  (`prospera-comptabilite-service`). **Fusionné le 17/11** : comptabilite #2, `a8784cb` sur `dev` (annonce : stories
  #609). Tout est AJOUT : rien d'existant ne change de forme.
  - **Trois routes neuves** :
    - `POST /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ouverture`, corps `{ tenue: CAHIERS|JOURNAL,
      proposition? }`. 201 à l'ouverture ; 200 si la même tenue est déjà choisie (rien n'est écrit). Droit exigé :
      `comptabilite:exercice:ouvrir`, lu par `GET /moi/droits` d'auth-service avec le jeton du membre.
    - `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/tenue` : la tenue de l'exercice.
    - `GET /api/v1/dossiers/{dossierId}/tenues` : les tenues du dossier, du plus récent au plus ancien.
    - Réponse : `{ dossierId, exerciceId, tenue, debutExercice, precedente?: { exerciceId, tenue }, bascule,
      ouvertPar, ouvertLe }`.
  - **Refus nommés neufs** :
    - 409 `TENUE_EXCLUSIVE` (`details.tenueExistante`, `details.tenueDemandee`) ;
    - 409 `EXERCICE_CLOS` (`details.statut`) ;
    - 404 `EXERCICE_NON_OUVERT` ;
    - 403 `DROIT_INSUFFISANT` (`details.droit`) ;
    - 503 `DROITS_INDISPONIBLES`.
    Les refus portent désormais un `details` facultatif (ajout).
  - **Manifeste amendé** (`manifestes/comptabilite.manifest.ts`, copie à l'octet dans le service) :
    - les deux lectures entrent dans `routesLectureSeule` ;
    - le commentaire des droits dit qu'ils se lisent par `/moi/droits`.
  - **Ce que le service lit chez B (auth)** : `GET /api/v1/moi/droits?organisationId=` → `droits` (tableau de
    chaînes), avec le jeton du membre. Variable neuve, requise : `AUTH_SERVICE_URL`.
  - **Pas encore** : aucun topic produit, aucun schéma au registre (D-959-5). `comptabilite:*` n'est attribué à aucun
    rôle dans auth-service. En réel, l'ouverture répond donc 403 `DROIT_INSUFFISANT` jusqu'à ce qu'il le soit
    (D-959-4).

- **2026-11-17, STORY-958 — un module NEUF, `comptabilite`, annoncé AVANT la fusion du code**
  (`prospera-comptabilite-service`, dépôt neuf). **Fusionné le 17/11** : comptabilite #1, `8f36ef9` sur `dev`
  (annonce : stories #604). Tout est AJOUT : rien d'existant ne change.
  - **Manifeste neuf** : `manifestes/comptabilite.manifest.ts` (code `comptabilite`, sans numéro M ; copie à l'octet
    dans le service, `src/module.manifest.ts`). Neuf droits `comptabilite:*` **déclarés, pas encore attribuables**
    (borne du jeton, jusqu'à l'étape 4 de l'ADR « droits hors du jeton »). Le catalogue ne le connaît pas encore : tant
    qu'il ne l'a pas, le module se lit `NON_INSTALLE` et la garde refuse tout (fermé). Le porter au catalogue est une
    story de B (« Pour la suite » de la fiche 958).
  - **Topic consommé, existant** : `etat-publie.changed.reel` (ou `.essai`, selon `KAFKA_ESPACE`), groupe neuf
    `comptabilite-etat-publie`, au contrat figé `contrat-etat-publie-v1`. **Aucun topic produit, aucun schéma au
    registre** : le premier fait (exercice, STORY-959) sera annoncé ici avant sa fusion.
  - **Route neuve** : `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/referentiel` → `{ dossierId,
    exerciceId, referentiel: SN|SMT|SFD-BCEAO|CIMA, famille: SYSCOHADA|SFD-BCEAO|CIMA, systemeComptable?, herite,
    exercice }`. Refus nommés : 403 `EMAIL_NOT_VERIFIED`, `COMPTABILITE_NOT_ENTITLED`, `ABONNEMENT_EXPIRE`,
    `KYC_NOT_APPROVED` (relayé) ; 404 `DOSSIER_INTROUVABLE` (hors portée compris), `EXERCICE_INTROUVABLE` ; 400
    `IDENTIFIANT_MALFORME` ; 409 `REFERENTIEL_NON_DECIDE`, `REFERENTIEL_INCONNU` ; 503 `DOSSIER_SERVICE_INDISPONIBLE`.
  - **Ce que le service lit chez A** (dossier-service, sans rien lui demander de changer) : `GET /dossiers/{id}`
    (`id`, `orgId`, `referentielComptable`) et `GET /dossiers/{id}/axes?exerciceId=` (`effectifs.decision.
    systemeComptable`, `effectifs.herite`, `effectifs.exercice`), **avec le jeton du membre** : la portée de
    dossier-service s'applique. Un renommage de ces champs casserait la comptabilité : à annoncer à B.
  - **Port** : 3420 (3417 et 3418 sont à l'IA commune, 3419 à `reseau-service`).

- **2026-11-17, STORY-957 — aucun contrat ne change** (notification, paiement, catalogue). Mêmes topics, mêmes
  groupes, mêmes routes ; `/health` garde sa forme. Seul le texte du message `down` du contrôle Kafka est nouveau
  (« broker muet après 5000 ms (connexion ou métadonnées) »). Effet visible : Kafka arrêté, `/health` répond en
  5,3 s au plus en régime, au lieu de 7,8 s ou plus. Kafka revenu, notification et paiement retrouvent leurs groupes
  sans redémarrage.

- **2026-11-17, STORY-956 — `kit-cible` 1.0.1, annoncé AVANT la fusion** (`prospera-plateforme`, étiquette
  `kit-cible-v1.0.1`). **Fusionné le 17/11** : plateforme #22, `189183f` sur `dev`, étiquette posée et poussée. Il corrige D1, D2 et D3 de la relecture de A
  (`coordination/relecture-kit-cible-1.0.0-groupe-A.md`). **Pour A (Dev A, `pdv`), C, D-1055 et tout module cible :
  prendre la 1.0.1, jamais la 1.0.0** : la 1.0.0 perd une ligne en silence quand une clé figure deux fois dans un lot.
  - **Contrat `refus-reprise@1`** : un code de requête **ajouté**, `CLE_EN_DOUBLE` (422). Il refuse toute la requête
    quand une clé d'origine ou un alias est porté par deux lignes, avec le même corps en `SIMULER` et en `APPLIQUER`,
    et `erreurs` nomme les lignes fautives. `code` est un motif, pas une liste fermée : c'est un ajout. La description
    des 422 de `reprise-cible.openapi.json` est complétée. Rien n'est retiré ni renommé, et `reponse-reprise@1` ne
    change pas.
  - **Comportements qui se resserrent** (les contrats ne changent pas, les bornes y étaient déjà) :
    - un montant de `montantsRequis` absent et non marqué dans `montantsASaisir`, ou un état de `champEtat` hors de
      `etats`, donne 422 `SCHEMA_NON_CONFORME` sur toute la requête ;
    - un `etatRetenu` hors de `etats` rendu par le `juger` d'un module donne `REFUSE` / `REFUSE_PAR_LA_CIBLE` ;
    - `message` est borné à 1 024, `erreurs[].message` à 512, `chemin` à 256 et `raison` à 512 (texte coupé par « … ») ;
    - au démarrage, un montant requis déclaré `required` dans le schéma est refusé (`DeclarationInvalide`).
  - **La suite de conformité** (`casDeConformite`) gagne des cas : clé en double, textes bornés, cloisonnement,
    atomicité, `rattacherA`, `controles`, montant requis, saisie refusée, circuit, régime non admis.
    - **Le banc doit désormais fournir `panne`** (`new PanneDeConformite()`, exportée par `conformite.ts`) et en
      envelopper **chaque** raccord de sa cible (`panne.envelopper(raccord)`). Sans elle, le cas d'atomicité échoue.
    - Deux entrées facultatives du profil : `circuit` et `regimeNonAdmis`. `casSansObjet` les nomme quand elles
      manquent.
    - Aucun module n'a encore embarqué la 1.0.0.

- **2026-11-16, STORY-953 — les contrats de l'essai prospect (plateforme, étiquette `contrats-instance-v1`) et leur
  usage par le catalogue, annoncés AVANT la fusion.** Tout est AJOUT : rien d'existant ne change de forme. **Jalon du
  14/12 (EPIC-147) : contrat du jeu de démonstration publié.**
  - **Plateforme, `contrats/instance/`** (générés par `npm run contrats:instance`), pour **tout groupe qui écrit un
    module** (A, C, D) :
    - `jeu-demonstration@1` : un jeu est un dossier, `jeu.json` et ses fichiers de données. Le `jeu.json` porte le
      code, la version, la verticale et un générateur à graine fixe éventuel. Il a une part par module, dans l'ordre
      d'import, et, par objet, un fichier (un tableau JSON), son nombre d'enregistrements et son sha256.
      `npm run jeu:verifier -- <dossier>` le vérifie avant livraison. Jeu témoin de B : `jeux-demonstration/temoin/`.
    - `import-c13-demande@1` et `-reponse@1` : la forme GÉNÉRIQUE de `POST /api/v1/instance/<code>/{organisationId}/import`
      (la route `routesInstance.import` du manifeste). Un lot porte les enregistrements d'**un** objet. Il est
      idempotent sur `idempotence` : `IMPORTE`, puis `DEJA_IMPORTE` au rejeu. `source` vaut `JEU_DEMONSTRATION`
      (avec `jeu`) ou `DOSSIER_INSTALLATION`.
    - `effacement-c13-demande@1` et `-accuse@1` : la forme GÉNÉRIQUE de
      `POST /api/v1/instance/<code>/{organisationId}/effacement` (`routesInstance.effacement`). Le module efface tout
      ce qu'il tient de l'organisation dans l'espace servi, puis accuse : `EFFACE`, ou `DEJA_EFFACE` au rejeu. Tout
      autre statut ou un corps hors contrat n'est PAS un effacement.
    - `certificat-effacement@1` : la charge du JWS `prospera-certificat-effacement+jws`, signé par une clé d'usage
      `centrale`, audience `prospect`. Il donne chaque propriétaire et son accusé (`EFFACE`, `DEJA_EFFACE`, ou
      `SANS_ROUTE` s'il ne déclare aucune route), et la date d'expiration de la dernière sauvegarde.
      `@prospera/signature` reconnaît ce `typ` (ajout à `SIGNATAIRE_DE`).
    - `instance-c13.openapi.json` : les deux routes génériques.
  - **Catalogue (`contrat/essai-prospect.openapi.json`, ajouts facultatifs)** :
    - `POST /api/instance/v1/essais` accepte `jeuDemonstration: { code, version }`. Un jeu inconnu rend
      **422 `JEU_DEMONSTRATION_INCONNU`**.
    - L'essai porte `jeu` (code, version, état d'import par part : `A_IMPORTER`, `IMPORTE`, `NON_IMPORTE` et sa
      raison) et `effaceLe`. Son `statut` gagne **`EFFACE`** (lecteur tolérant : une valeur de plus).
    - Routes nouvelles :
      - `POST …/essais/{organisationId}/jeu-demonstration` : rejouer l'import ;
      - `POST` et `GET …/essais/{organisationId}/effacement` : le plan, les accusés et le certificat. Refus :
        **409 `EFFACEMENT_PREMATURE`** avant `effacementLe`, `ESSAI_SIGNE`, `ESSAI_SANS_JEU`, `ESSAI_EFFACE`, 404
        `EFFACEMENT_INCONNU`.
    - L'effacement part **seul** à `effacementLe` (file BullMQ `effacements-d-essai`). Une fois effacée,
      l'organisation voit ses modules `DESINSTALLE` dans l'espace d'essai.
    - Configuration nouvelle : `JEUX_DEMONSTRATION_DIR` (le jeu témoin est dans l'image), `JEUX_DEMONSTRATION_LOT`,
      `EFFACEMENT_KID`, `EFFACEMENT_CLE_PRIVEE_JWK`, `EFFACEMENT_CERTIFICAT_DE_CLE`,
      `EFFACEMENT_RETENTION_SAUVEGARDES_JOURS` (92 par défaut). Sans clé, ou avec une clé hors de sa validité,
      l'organisation est effacée mais le certificat attend (`CLE_DE_SIGNATURE_ABSENTE`,
      `CLE_DE_SIGNATURE_HORS_VALIDITE`).
  - **Pour A, C et D** : chaque module de démo (EPIC-160) sert ces deux routes C13 à ses chemins déclarés, et livre son
    jeu au format `jeu-demonstration@1`. Voir « Demandes aux autres groupes ».

- **2026-11-16, STORY-951 — essai ou réel (catalogue #56, `8f3e321`), annoncé AVANT la fusion.** Tout est AJOUT :
  rien d'existant ne change de forme. Contrat : `platform-catalog-service/contrat/mise-en-service.openapi.json`.
  - **Routes nouvelles** (service `/api/v1`, public `/api/instance/v1`) :
    - `POST /sorties-essai/{organisationId}/verifier` `{ module, destination: { type, adresse } }` : 200
      `{ autorisee: true, motif: REEL | LISTE_BLANCHE }`, ou **403 `ECRITURE_REELLE_DEPUIS_ESSAI`** (avec
      `interceptionId`), journalisé ; jeton du membre ou identité de service, limité à l'organisation ;
    - `GET|POST /sorties-essai/liste-blanche`, `DELETE /sorties-essai/liste-blanche/{id}`,
      `GET /sorties-essai/{organisationId}/interceptions` (console) ;
    - `POST|GET /mises-en-service/{organisationId}` (`entitlement:grant` / `org:read`) : 201, puis 200 au rejeu ;
      refus **409** `MISE_EN_SERVICE_HORS_DU_REEL`, `MISE_EN_SERVICE_MODULE_NON_INSTALLE` (`modules`),
      `MISE_EN_SERVICE_REPRISE_D_ABORD`, **`MISE_EN_SERVICE_SANS_FEU_VERT`** (`modules` :
      `{ module, etat, epoque, numero }`), **503** `VERIFICATION_DONNEES_IMPORTEES_NON_EXECUTEE` (`raison`).
  - **Topic nouveau, produit** : `reception-definitive.enregistree` (AD-17), clé `organisationId`, schéma
    `contrat/schemas/reception-definitive.enregistree.json` (fermé ; registre au prochain `schemas:enregistrer`).
    Consommateur prévu : reprise-service.
  - **Topic nouveau, consommé** (réel seulement) : `reprise.feu-vert.changed`, groupe `platform-catalog-feux-verts`,
    lu au contrat publié par la plateforme (`kit-cible-v1.0.0`).
  - **La partie A appelle la Reprise** : `POST /api/v1/instance/reprise/{org}/verifications/donnees-importees`, à
    l'adresse du module `reprise` (`INSTALLATION_SERVICES`), sous `INSTALLATION_JETON_SERVICE`.
  - **Pour tout module qui écrit vers l'extérieur** (notification : courriels et SMS ; paiement ; Connecteurs ;
    C : sinistres, liaison-assureur) : dans l'espace d'essai, appeler `verifier` avant chaque envoi, et ne pas envoyer
    sur un 403. Rien n'est imposé aujourd'hui (aucun module n'est encore déployé en essai) ; chaque groupe le branchera
    avec son espace d'essai. **Pour D** : les écrans de la liste blanche, du journal et de la mise en service viendront
    au lot frontend.

- **2026-11-16, STORY-945 — la bascule (catalogue #55, `99ba2db`, `9798ff5`), annoncée AVANT la fusion ; fusionnée
  avant A-917 sur décision de l'utilisateur.**
  - **`PUT /api/v1/catalog/entitlements/{org}/{module}`** : même chemin, même corps, mêmes succès (201, 200). Mais :
    - le droit est posé **par un plan** (`origine: CONSOLE_PUT`, joué avant la réponse) ;
    - `source` vaut `moteur:<plan>` et non plus `admin` (une sanction `SUSPENDED` reste `admin`) ;
    - **refus nouveaux** : 422 `MODULE_DEPENDANCE_MANQUANTE` (champ `refus` : ouvrir la dépendance d'abord),
      422 `MODULE_INCONNU` (module sans manifeste), 409 `INSTALLATION_EN_COURS`, 409 `INSTALLATION_INACHEVEE`
      (champ `planId`) ;
    - **pour D** (console, lot frontend) : ces codes entrent dans l'union des refus du `PUT`.
  - **L'échéance soldée n'ouvre plus aucun module** (PRD FR-4, chemin 2) : elle prolonge ceux qui sont installés et
    note les autres « acquis, à installer ». `entitlement.changed` n'est émis que pour une prolongation. **Pour A** (le
    cabinet) : un cabinet qui paie n'a son module qu'une fois installé par le moteur ; c'est l'objet d'A-917.
  - **Le vertical n'ouvre plus rien** : plus de droit `source: vertical:<v>`. Plus de propagation d'un package modifié
    aux titulaires : il ne vaut que pour les nouveaux contrats.
  - **`GET /api/v1/offres/{org}`** : champ nouveau `acquis` (`code`, `source`, `depuisLe`, et pour le contrat
    `echeanceLe`, `dossiersMax`, `packs`, `referentiels`) ; les souscrits du point de décision l'incluent. Plans :
    champ nouveau `origine` (`INSTALLATION` | `CONSOLE_PUT`).
  - **L'état publié** : un module **sans ligne d'installation est `NON_INSTALLE`**, droit ou pas (fin de D-936-1). Les
    droits d'avant le moteur se réamorcent par `npm run migrate:reamorcage-moteur`, à jouer au déploiement : sans
    elle, une base existante lit ses modules `NON_INSTALLE`. Les gardes du cabinet, qui lisent encore
    `entitlement.changed`, ne voient rien changer. Notification et paiement, en double lecture, voient un écart
    jusqu'au réamorçage.

- **2026-11-16, STORY-949 — les droits hors du jeton (ADR, étapes 1 et 2) : ajouts, annoncés AVANT la fusion du
  code** (auth, catalogue). Rien d'existant ne change : `perms[]` reste dans le jeton, avec sa borne.
  - **Route nouvelle (auth)** : `GET /api/v1/moi/droits?organisationId=<org du jeton>`, avec le jeton de l'utilisateur.
    Réponse `{ organisationId, userId, dv, roleMetier: { code, origine } | null, droits: string[], droitsPlateforme:
    string[] }` ; `droits ∪ droitsPlateforme` = le `perms[]` du jeton. Refus : 400 `ORGANISATION_REQUISE`, 403
    `ORGANISATION_HORS_JETON`, 403 `APPARTENANCE_INACTIVE` ; un jeton de service : 401. Contrat :
    `auth-service/contrat/moi-droits.openapi.json`.
  - **Claim nouveau (jeton d'accès)** : `dv`, entier, la version des droits du porteur dans `org` (absent sans
    organisation et sur un jeton antérieur). Les lecteurs l'ignorent tant qu'ils ne lisent pas `/moi/droits`.
  - **Topic nouveau** : `identity.droits.changed` (contrat `@1`, sujet `identity.droits.changed-value` en BACKWARD),
    clé `organisationId`, `{ schemaVersion: 1, eventId, occurredAt, userId, organisationId, dv, cause }`, **sans les
    droits**. Une version plus récente que celle d'un cache l'invalide. Producteur : auth-service seul.
  - **Champ nouveau en base** : `memberships.dv` (absent = 0).
  - **Catalogue** : un consommateur de plus (groupe `platform-catalog-droits`) ; les réglages `DROITS_*` sont
    facultatifs (adresse d'auth par défaut : `NAISSANCE_AUTH_URL`). La réponse de l'état publié ne change pas.

- **2026-11-16, STORY-952 — l'essai d'un prospect : ajouts, annoncés AVANT la fusion du code** (catalogue #57,
  notification #88 ; annonce fusionnée par stories #548, avant le code).
  - **Catalogue, contrat NOUVEAU `contrat/essai-prospect.openapi.json`**, servi par la partie A de l'**espace
    d'essai** seulement (409 `ESSAI_HORS_ESPACE_D_ESSAI` dans le réel) :
    - `POST /api/instance/v1/essais` (`entitlement:grant`) ouvre l'essai (J0 → J+30), idempotent sur
      l'organisation. Corps : `organisationId`, `administrateur`, `commercial` (e-mails), `langue?`. L'organisation
      doit être née dans l'espace d'essai (404 `ORGANISATION_INCONNUE`, 409 `NAISSANCE_EN_COURS`) ;
    - `GET …/essais/{organisationId}` (`org:read`) ;
    - `POST …/prolongation` (`jours?` de 1 à 30) : 409 `ESSAI_DEJA_PROLONGE`, `ESSAI_TERMINE` ou `ESSAI_SIGNE`, 422
      `PROLONGATION_AU_DELA_DE_60_JOURS` ;
    - `POST …/signature` : 409 `DELAI_DE_SIGNATURE_ECOULE` passé `effacementLe` ;
    - **pour D** : les écrans d'essai de la console (créer, prolonger, signer) se génèrent depuis ce fichier.
  - **État publié (contrat figé, forme inchangée)** : un module installé d'une organisation en essai se lit
    `ESSAI_PROSPECT` (`finLe`), puis `ESSAI_TERMINE` (`effacementLe`), comme la matrice figée le prévoyait. Une fois
    signé, il se lit `EN_SERVICE`. Les événements `etat-publie.changed.essai` suivent.
  - **Notification** : deux modèles système nouveaux, `essai-fin-proche` et `essai-effacement-proche` (e-mail,
    `fr`/`en`). `platform-catalog-service` entre au périmètre de la route directe, limité à ces deux avis.
    **Déploiement** : ajouter `platform-catalog-service:<jeton>` à `JETONS_DE_SERVICE` de notification, et
    `NOTIFICATION_URL` et `NOTIFICATION_JETON_SERVICE` au catalogue. Sans eux, l'essai court et l'avis ne part pas
    (journal : `AVIS_NON_CONFIGURE`).
  - **Recette (A)** : `RECETTE_HORLOGE_AVANCE_JOURS` existe désormais aussi au catalogue (heure de référence avancée
    d'un nombre entier de jours ; **refusée en production** au démarrage).

- **2026-11-16, STORY-948 — la naissance, le jeton de service, le 404 : ajouts, annoncés AVANT la fusion du code**
  (catalogue #53, auth #40 ; annonce fusionnée par stories #543, avant le code).
  - **Catalogue, contrat NOUVEAU `contrat/naissance.openapi.json`** :
    - `POST /api/instance/v1/naissances` (`entitlement:grant`) et `GET …/naissances/{organisationId}` (`org:read`) ;
    - refus : 409 `NAISSANCE_DIVERGENTE` (`champs`), 422 `NAISSANCE_REFUSEE` (`cause`), 503 `AUTH_INJOIGNABLE`
      (`cause`) et `HORLOGE_INDISPONIBLE`, 404 `NAISSANCE_INCONNUE` ;
    - **pour D** : l'écran de naissance de la console se génère depuis ce fichier ; la console choisit
      `organisationId` une fois et le donne aux deux espaces.
  - **État publié (contrat figé `contrat-etat-publie-v1`, forme inchangée)** :
    - la route rend désormais le **404 `ORGANISATION_INCONNUE`** déjà au contrat, après le 403 ;
    - elle **admet les identités de service** `MOTEUR`, `REPRISE`, `CONNECTEURS` (claim `organisationId`), comme le
      contrat le décrivait. `utilisateur.id` = `service:<identité>`, sans droit effectif.
  - **Auth, route NOUVELLE `POST /api/v1/interne/jetons-de-service`** :
    - le secret de l'identité (`MOTEUR_JETON_SERVICE`, **`REPRISE_JETON_SERVICE`**, **`CONNECTEURS_JETON_SERVICE`**,
      nouveaux) donne un jeton RS256 de 300 s : `sub: service:<identité>`, `identite`, `organisationId`, sans `org`,
      `roles: []`, `perms: []`, `emailVerified: false` ;
    - **pour C et D** (et la Reprise) : c'est le jeton qu'un service présente aux routes `…/{organisationId}/…`
      d'une cible (AD-27). Un service qui ne connaît pas la claim `identite` le refuse par sa garde d'e-mail (403) :
      il faut l'admettre expressément, comme le catalogue le fait (`@AdmetIdentitesDeService`) ;
    - auth-service refuse ce jeton sur ses propres routes (401 `IDENTITE_DE_SERVICE_REFUSEE`).
  - **Auth, refus NOUVEAU** : `VALIDATION_DE_REPRISE_RESERVEE_AU_DG` (403) quand un autre que le DG fait gagner
    `reprise:lot:valider`. Le code n'est pas encore au catalogue de tenant (STORY-949, borne du jeton).
  - **Catalogue, filtre d'erreurs** : `cause` et `champs` passent la liste blanche (chaîne, liste de chaînes).
  - **Recette (A)** : `NAISSANCE_AUTH_URL` (`http://auth-service:3001/api/v1`) et `MOTEUR_JETON_SERVICE` (la valeur
    d'auth) sont à poser sur le catalogue de `docker-compose.recette.yml` pour que la naissance y passe ; sans eux,
    elle répond 503 `AUTH_INJOIGNABLE`, `cause: NAISSANCE_NON_CONFIGUREE`, et rien d'autre ne change.

- **2026-11-16, STORY-944 — l'installation : routes et un contrat NOUVEAUX, rien d'existant ne change** (catalogue #52,
  annoncé avec la PR de docs, juste après la fusion du code : écart à la règle « avant la fusion », sans effet ici
  puisque tout est ajout).
  - **Routes neuves de la console** (surface plateforme, `entitlement:grant` pour écrire, `org:read` pour lire) :
    - `PUT|GET /api/v1/offres/{organisationId}` : l'offre, dépendances dures ajoutées avec leur raison ;
    - `POST /api/v1/installations` : `Idempotency-Key` ; 201 pour un plan créé, 200 pour un plan rejoué ;
    - `GET /api/v1/installations?organisationId=` et `GET /api/v1/installations/{planId}` : étapes horodatées, bilan,
      `interrompueA` ;
    - `POST /api/v1/installations/{planId}/reprendre`.
  - **Refus** :
    - 422 `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE` : tous rendus dans `refus`, dans
      l'ordre d'AD-23 ; `MODULE_INCONNU` ;
    - 409 `MODULE_DEJA_INSTALLE`, `INSTALLATION_EN_COURS`, `CLE_IDEMPOTENCE_REUTILISEE`.
  - **Corps d'erreur du catalogue** : trois champs facultatifs de plus, `refus`, `modules` et `planId`.
  - **Pour A, C et D, propriétaires de modules : le contrat des routes de vérification**
    (`platform-catalog-service/contrat/verification-installation.schema.json`, C13 points 2 et 8).
    - La route : `POST /api/v1/instance/<code>/{organisationId}/verifications/<code-de-verification>`, appelée sous
      l'identité du moteur avec `Idempotency-Key`. Elle répond 200 et `{ schemaVersion: 1, code, voyant:
      VERT|ORANGE|ROUGE, mesure?, detail?, action? }`.
    - Tant qu'un module ne la sert pas, chacune de ses vérifications est `NON_EXECUTEE` : il **ne s'installe pas**
      par le moteur.
    - L'adresse du service se déclare au catalogue : `INSTALLATION_SERVICES=code=url,…`.
  - **État publié** : l'axe 2 d'un module installé par un plan vient du plan. Pour un consommateur, un tel module passe
    `EN_INSTALLATION` avant `EN_SERVICE`. Les autres modules ne changent pas.
  - **Droits** : un droit posé par le moteur porte `source: moteur:<planId>`. `entitlement.changed` ne change pas.

- **2026-11-16, STORY-947 — `kit-cible` 1.0.0 est publié** (`prospera-plateforme`, étiquette `kit-cible-v1.0.0`).
  **Pour A (Dev A, `pdv` en S5), C et D-1041, et tout module cible** :
  - **Comment le prendre** : copier `bibliotheques/kit-cible/distribution/` à l'étiquette, à l'octet
    (`git -c core.autocrlf=false show kit-cible-v1.0.0:bibliotheques/kit-cible/distribution/<fichier>`), dans le
    service (par ex. `src/vendor/kit-cible/`), avec `EMPREINTES.json` et un test qui revérifie les sha256. Elle se
    compile en CommonJS ; le service déclare `ajv` ^8 (`mongodb` vient de Mongoose).
  - **Ce que chaque module cible joue** : `casDeConformite(profil)` (`conformite.ts`), dans sa CI, sous jest
    (`it(c.nom, c.jouer)`) : objet simple, objet chaîné, et s'il en a, montant requis et ouverture.
  - **Sur MongoDB** : `ouvrirMagasinMongo(client, { base })` exige un **jeu de répliques** (`JEU_DE_REPLIQUES_EXIGE`) ;
    le kit pose ses collections `reprise_*`.
  - **Contrat `refus-reprise@1`** : `OUVERTURE_CLOSE` (409) **ajouté** aux codes ; `reprise-cible.openapi.json` gagne
    une réponse 409. Rien de retiré ni de renommé.
  - **API ajoutée au kit** : `saisirMontant` (motif exigé, trace), `lireFiche`, `lireTraces`, `ouvertureClose` /
    `ouvertureCloseHorsInstallation`. `Session` gagne `tracer` et `lireTraces` (un raccord maison les implémente).

- **2026-11-16, STORY-954 — DES CONTRATS NOUVEAUX, rien d'existant ne change** (`prospera-plateforme`, EPIC-169).
  - **`seuils-fraicheur@1`** (`contrats/seuils-fraicheur.json`, étiquette `seuils-fraicheur-v1`) : immédiat 5 / 15 min,
    heure 1 h / 3 h, nuit rouge à 06:00 heure locale, `messageDes`. **Pour la coque (Dev A, 11/12)** : générer la
    table de fraîcheur depuis ce fichier, copie épinglée ; aucune autre table.
  - **`contrats/echange/`** (étiquette `contrats-echange-v1`) : `echange-enveloppe@1`, `echange-reponse@1`,
    `connecteurs.domaine.changed@1`, `domaines-echange@1` (corps identique au champ C1 du catalogue) et
    `domaines-echange.cas.json`. Consommateurs : le kit des cibles (EPIC-170), Connecteurs, le catalogue.
  - **`@prospera/point-ecriture-unique`** (étiquette `point-ecriture-unique-v1`). **Pour A, C et D, dans tout module
    qui déclare `domainesEchange`** : copier `paquets/point-ecriture-unique/src/index.ts` à l'étiquette (sha256 dans un
    `ORIGINE.json`, patron de la garde de 937), poser `@PointDEcriture('<module>.<domaine>')` sur **la** méthode de
    service qui écrit chaque domaine, et jouer `verifierPointsDEcriture` dans un test (gabarit dans l'en-tête du
    fichier). Les faits du domaine portent `objetId` (stable) et `rang`.
  - **Catalogue** : aucun changement de comportement. `domainesEchange` de C1 est désormais une **copie** du contrat de
    la plateforme (`contrat/copies/echange/`, empreintes gardées) : un changement du champ passe par une version
    étiquetée de la plateforme, puis la copie.

- **2026-11-16, STORY-942 — `auth-service` : un champ AJOUTÉ, rien de changé sur le fil.**
  - **`GET /api/v1/users`** et **`GET /api/v1/admin/organizations/{id}`** (membres) gagnent `roleMetier`, facultatif :
    `{ code, libelle | null, origine: ATTRIBUE | PAR_DEFAUT, droits: string[] }`, ou `null` pour un membre sans rôle
    métier. Mêmes règle et droits que le jeton (surcharge appliquée). `role` et `tenantRole` ne changent pas. **Pour D**
    (et A, FE-115) : régénérer les types depuis l'OpenAPI ; l'écran n'a plus à deviner le rôle par défaut.
  - **Les six événements `identity.*` ont un schéma** (`auth-service/contrat/schemas/`), enregistrés au registre en
    BACKWARD (sujets `<topic>-value`) : désormais, **ajouts facultatifs seulement**. Le format sur le fil est
    inchangé (JSON nu, mêmes clés, aucun en-tête de registre). `identity.org.created` garde `createdByUserId`
    facultatif (STORY-938).
  - Le client Kafka d'auth-service passe à Confluent : aucun effet pour les lecteurs.

- **2026-11-16, STORY-950 — aucun contrat ne change sur le fil.** notification lit désormais
  `etat-publie.changed.<espace>` (groupe nouveau `notification-etat-publie` ; variables facultatives
  `KAFKA_ETAT_PUBLIE_GROUP_ID` et `INSTANCE_ESPACE`, défaut `REEL`). Ce qu'il publie est inchangé. **Pour A**
  (recette) : aucune variable à ajouter au compose. **Pour tous** : sans Kafka, notification, le catalogue et paiement
  démarrent désormais leur HTTP tout de suite (le producteur n'est plus attendu à l'amorçage).

- **2026-11-16, STORY-946 — les CONTRATS DE LA REPRISE et le KIT DES CIBLES sont publiés** (`prospera-plateforme`,
  commit `300779e`). Contrats neufs, rien d'existant ne change. **Pour A, C et D, qui écriront des cibles :**
  - `contrats/reprise/` (draft-07, `@1`, ajouts facultatifs seulement, annoncés ici) : `enveloppe-reprise`,
    `reponse-reprise`, `refus-reprise`, `controles-demande`, `controles-reponse`, `declaration-objet` (`x-reprise`),
    `reprise.feu-vert.changed` (réel seulement), `reprise.historique.livre`, `verification-donnees-importees`, `sante`,
    et deux OpenAPI 3.1 (`reprise-cible`, `reprise-c13`). Générés par `npm run contrats:reprise` : n'éditez pas les
    fichiers.
  - **Un schéma d'objet** (votre module, `contrats/objets/<code>/<objet>@<n>.<m>.json`) : JSON Schema draft-07 FERMÉ des
    `champs`, `$id` terminé par `/objets/<code>/<objet>@<n>.<m>.json`, déclaration de reprise dans `x-reprise`
    (`references`, `regimes`, `etats`, `champEtat`, `montantsRequis`, `valeursDeControle`).
  - **`@prospera/kit-cible` 0.1.0** (`bibliotheques/kit-cible`) : `creerCible({ code, objets: [{ schema, raccord }],
    transactions, etatPublie })` puis `traiterRequete(cible, { methode, chemin, appelant, corps, octets })` dans votre
    contrôleur. Refus de requête : 404 `OBJET_INCONNU`, 403 `ORGANISATION_HORS_JETON` ou code de garde de la matrice,
    413 `LOT_TROP_GROS`, 422 `ENVELOPPE_NON_CONFORME` | `SCHEMA_NON_CONFORME` | `VALIDATION_ABSENTE`. Codes d'objet :
    `REFERENCE_INCONNUE`, `VERDICT_DIFFERENT`, `ALIAS_DEJA_UTILISE`, `VERSION_ANTERIEURE` (avec `INCHANGE`),
    `OBJET_HISTORIQUE`, `RATTACHE` (avec `INCHANGE`), `REFUSE_PAR_LA_CIBLE`. ⚠ Réglez votre analyseur de corps
    au-dessus de 1 Mio : c'est le kit qui répond 413. **0.x : la forme peut encore bouger jusqu'à la 1.0.0 de
    STORY-947** ; ne l'embarquez pas avant.

- **2026-11-16, STORY-943 — le POINT DE DÉCISION est publié** (`prospera-plateforme/paquets/point-de-decision`,
  étiquette `point-de-decision-v1`, commit `5883740`). Contrat neuf, rien d'existant ne change.
  - `decider({ lieu: 'PLATEFORME' | 'SITE', organisationId, module, souscrits, licence: string[] | null, dependances,
    installes, planifies? })` ⇒ `{ ouvert: true }` ou `{ ouvert: false, code, refus: [{ code, modules? }] }` :
    **tous** les refus, dans l'ordre `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE`
    (`modules` : dépendances manquantes) ; `code` est le premier. Sur site, `MODULE_HORS_LICENCE` seul, et pas de
    licence = fermé ; sur la plateforme, `licence: null` = hébergé.
  - **Copie** : `src/index.ts` (sha256 `de37c40e…d940`) et `conformite.json` (sha256 `6f3eb92c…af97b`), recopiés
    depuis le blob de l'étiquette, avec un `ORIGINE.json` ; le consommateur rejoue `conformite.json` contre sa copie.
    Consommateurs prévus : le catalogue (STORY-944), la centrale (STORY-955).
  - `@prospera/point-de-decision/licence` : `lireLicence` (sur site ; horloge scellée ; refus `HORLOGE_INDISPONIBLE`,
    `LICENCE_AUTRE_INSTANCE`, `LICENCE_ANTERIEURE`, `LICENCE_INVALIDE`).

- **2026-11-15, STORY-940 — catalogue : `declarations` consomme les paquets fiscaux.**
  - Le semis donne à `declarations` les familles `syscohada-revise`, `zone-franche-togo`, **`fiscal-tg-entreprise`**,
    **`fiscal-tg-entreprise-zone-franche`**. L'octroi d'un paquet `fiscal-tg-*` à `declarations` est accepté (il
    partait en 422 `REFERENTIEL_INCOMPATIBLE`) ; aucun refus nouveau.
  - **Une base déjà semée** se répare par `npm run migrate:familles-fiscales` (ajout seul, idempotent), à jouer au
    déploiement du catalogue. Le semis ne réécrit jamais un module présent.
  - **Pour A et la recette** : `zone-franche.recette.ts` ne patche plus `declarations` ; elle vérifie le semis.
  - **Pour D** : `GET /api/v1/catalog/admin/modules` rend deux familles de plus pour `declarations` ; l'écran
    d'octroi les propose.
  - **Régression de STORY-930/937 corrigée (catalogue et paiement)** : sous le client de Confluent, un consommateur
    abonné à un topic que personne n'a encore écrit ne crée pas son groupe, et ne voit le topic qu'au
    rafraîchissement des métadonnées (5 minutes) ; kafkajs le faisait créer. Sur une pile neuve,
    `platform-catalog-abonnements` n'existait donc pas, et **le `globalSetup` de la recette s'arrêtait**. Correctif de
    C (`document-service`, STORY-982) repris : les deux consommateurs du catalogue et la supervision de paiement
    **créent les topics abonnés absents avant `subscribe`**, aux réglages du broker ; un échec est journalisé et
    n'empêche pas l'abonnement. (`allow.auto.create.topics` ne suffit pas : la couche de compatibilité le pose déjà.)

- **2026-11-15, STORY-939 — `paiement` :**
  - **`POST /api/v1/abonnements` peut répondre 422 `MODULE_NON_VENDABLE`** (champ `modules`) pour un module à la
    carte sans manifeste vendable au catalogue, ou dont une dépendance n'en a pas. La casse ne compte pas
    (`MICROFINANCE` = `microfinance`). Tant que le catalogue n'a publié aucun manifeste, rien n'est refusé. Les
    modules vendus par la recette (`conseil`, `microfinance`, `assurance`, ceux des packages) ont tous un manifeste :
    rien ne change pour elle.
  - Route nouvelle : `GET /api/v1/offres/resolution?modules=a,b` (surface plateforme, droit
    `paiement:demande:emettre`), réponse `{ modules: [{ code, ajoutePar: { code, raison } | null }], inconnus }`.
  - Consommateur nouveau de `catalogue.manifeste.publie`, groupe `paiement-manifestes`.
  - **Pour D** : `tickets/TICKET-FRONTEND-console-manifestes.md` (les écrans de la console pour les manifestes).

- **2026-11-15, STORY-938 — `auth-service` :**
  - **`identity.org.created` : `createdByUserId` devient FACULTATIF** (absent pour une organisation née du moteur),
    plus un champ facultatif `origine` (`INSCRIPTION` | `MOTEUR`). Lecteurs :
    - `dossier-service` tolère (chaîne vide) ;
    - `expert-comptable` range la valeur telle quelle ;
    - **pour C** : le type de `document-service` (`src/kafka/events/identity-events.ts`) le déclare obligatoire, à
      relâcher (lecteur tolérant, C12).
  - **Catalogue de tenant : 16 → 24 codes** (8 droits `instance:*`, hors souscription). La regex des droits admet le
    tiret dans les trois segments. **Pour D** : l'écran des rôles reçoit les droits `instance:*`, toujours
    disponibles.
  - Route interne nouvelle : `POST /api/v1/interne/organisations` (jeton de service du moteur, `MOTEUR_JETON_SERVICE`).
  - Décision d'architecture : **les droits de tenant sortent du jeton**
    (`architecture/decisions/ADR-droits-hors-du-jeton-2026-11-15.md`) ; rien ne change avant ses stories.

- **2026-11-15, STORY-937 — la GARDE PARTAGÉE est publiée** (`prospera-plateforme/paquets/garde-etat-publie`, étiquette
  `garde-etat-publie-v1`). **Pour tout groupe qui garde un module** (C : sinistres, assurance ; A et les propriétaires de
  bilan, balance, microfinance, notification) : copier `src/index.ts` à cette étiquette dans le service, garder son
  sha256 (patron : `prospera-paiement-service/src/vendor/garde-etat-publie/`), projeter `etat-publie.changed.<espace>`
  (appliquer si `(epoque, numero)` est plus récent), puis jouer la double lecture. Aucun contrat existant ne change :
  paiement continue de lire `entitlement.changed` pour l'ancienne garde.

- **2026-11-15, STORY-936 — la vraie route est servie, rien ne change au contrat.**
  `GET /api/instance/v1/etat-publie/{organisationId}` (service `/api/v1/…`) répond au contrat figé
  `contrat-etat-publie-v1`, et `etat-publie.changed.reel` est émis (topic par espace, `numero` croissant). **Pour D** :
  la doublure de la coque peut être comparée à la vraie route dès maintenant. Écarts connus, sans changement de forme :
  l'axe 2 se déduit du droit jusqu'à EPIC-144 ; pas encore de 404 ni de jeton de service (STORY-938) ; `interrupteurs`
  vide, `estDG` faux (STORY-936, D-936-1 → 4).

- **2026-11-15, STORY-935 — un contrat NOUVEAU, cinq droits RENOMMÉS.**
  - `catalogue.manifeste.publie` (AD-17) : l'état absolu d'une `ModuleVersion` (module, version, statut, manifeste
    C1), clé `<module>@<version>`, topic **compacté**. Schéma :
    `platform-catalog-service/contrat/schemas/catalogue.manifeste.publie.json`, au registre. Consommateur prévu :
    paiement (STORY-939).
  - **Droits renommés** (borne de 40 caractères du jeton ; manifestes, PRD du distributeur et de la microfinance,
    épics du distributeur) : `approvisionnement:commande-fournisseur:{valider,suggerer,consulter}` →
    `approvisionnement:bon-commande:{valider,suggerer,consulter}` ; `finance-transactions:rapprochement:effectuer` →
    `finance-transactions:releve:rapprocher` ; `finance-transactions:tresorerie:consulter` →
    `finance-transactions:tresorerie:lire`. **Pour D et C** : aucun écran ni service ne les employait encore ; tout
    écran à venir prend les nouveaux noms.
  - Le catalogue sème les 46 manifestes au démarrage (dont `instance`). La garde source/copie se joue par
    `MANIFESTES_SOURCE=<prospera-stories>/manifestes npm run manifestes:garde` : **tout groupe qui modifie un manifeste
    de `prospera-stories/manifestes/` le dit ici**, B en tire une copie (une version nouvelle si la version publiée
    change).

- **2026-11-15, STORY-934 — deux contrats NOUVEAUX** (rien d'existant ne change) dans `platform-catalog-service/contrat/` :
  - `manifeste-module.schema.json` : le manifeste C1 (draft-07, fermé). Un droit tient en **40 caractères**, à tiret
    dans ses trois segments ; un topic existant garde sa graphie sans `@`. La source reste `src/module.manifest.ts` de
    chaque service ; le catalogue garde une copie, comparée par une garde (motif obligatoire pour toute divergence) ;
  - `resolution-dependances.json` : les cas de la résolution des dépendances dures. **paiement** (STORY-939) et la
    **console** (D) en gardent une copie et les rejouent : la même offre se résout à l'identique.
  - `POST /api/v1/catalog/admin/modules/:code/versions` accepte un champ facultatif `manifeste` ; refus 422 nommés
    (`MANIFESTE_INVALIDE`, `MANIFESTE_OBJET_HORS_MODULE`, `MANIFESTE_ARGENT_SANS_CONTROLE`,
    `AVEC_PERTE_INTERDIT_PLATEFORME`, `MANIFESTE_DEPENDANCE_MINEURE`, `MANIFESTE_CYCLE`).

- **2026-11-15, STORY-932 — LE CONTRAT D'ÉTAT PUBLIÉ EST FIGÉ** (catalogue #44, étiquette `contrat-etat-publie-v1`).
  À lire par **tous** (plan §7, « B → tous ») :
  - `platform-catalog-service/contrat/etat-publie.openapi.json` : `GET /api/instance/v1/etat-publie/{organisationId}`
    (service : `/api/v1/…`) ; 403 `ORGANISATION_HORS_JETON`, 404 `ORGANISATION_INCONNUE`, 503 `HORLOGE_INDISPONIBLE` ;
  - `contrat/matrice-etats.json` : neuf états ; menu, bandeau et destinataires ; garde par sorte de route (16) et par
    identité (`UTILISATEUR`, `MOTEUR`, `REPRISE`, `CONNECTEURS`) ; 33 cas de calcul ;
  - `contrat/schemas/etat-publie.changed.json` : l'événement sur `etat-publie.changed.essai` / `.reel` (même définition
    d'un module ; `numero` croissant : un consommateur n'applique que si `(epoque, numero)` dépasse le dernier appliqué).

  **Désormais : ajouts facultatifs seulement**, chacun annoncé ici avant sa fusion. Les consommateurs en gardent une copie
  testée, lisent en lecteur tolérant (champ inconnu ignoré, état inconnu = `NON_INSTALLE`) et ferment sur une
  `versionMatrice` inconnue. **Pour D** : la doublure de la coque (PRA-01) et l'app expert-comptable se génèrent depuis
  ces fichiers. La vraie route arrive avec STORY-936.

- **2026-11-15, STORY-930 — aucun changement sur le fil.** Le catalogue publie `entitlement.changed` avec le client
  de Confluent : même JSON, même clé (`orgId`), aucun en-tête de registre. Le **schéma** du payload v2 est désormais
  versionné (`platform-catalog-service/contrat/schemas/entitlement.changed.json`, modèle fermé) et enregistré sous
  le sujet `entitlement.changed-value`, en compatibilité BACKWARD : tout ajout doit être **facultatif**. Un champ
  requis ajouté, un type changé ou une propriété retirée sont refusés (`npm run schemas:compatibilite`, code 1).

## Questions à l'utilisateur ou au PO

- **STORY-1137, D-1137-3 — comment un module s'installe-t-il dans l'essai d'un prospect ?** (ouverte, architecture ; ticket
  « modules ouverts dans l'essai », point 2) Deux voies : (a) **l'ordre d'ouverture porte les modules** (et leurs
  référentiels) et le moteur de l'essai les installe avant de répondre, en un geste ; (b) le BFF relaie l'offre et les
  plans au catalogue de l'essai (`?espace=ESSAI`), et la console installe après l'ouverture avec les écrans d'AP-55.
  **Choix retenu par défaut : (a)**, appliqué par STORY-1137 (le geste unique de D-1112-3, la démo du 15/01 sans écran neuf
  pour l'installation ; rien n'est déduit du jeu : `balance` et `bilan` exigent un référentiel). (b) reste possible plus
  tard, à côté de (a), pour ajouter un module pendant l'essai. Le KYC dans l'essai n'est plus une question : **Q-D-17
  confirmée** (25/11) pour balance, bilan et dossier.

- **STORY-1128, D-1128-11 — la ligne « Contrat d'état publié » de `REGLES-DES-GROUPES.md` §3** (ouverte) : elle dit « figé
  (étiquette `contrat-etat-publie-v1`) : ajouts seulement, tout ajout facultatif (compatibilité BACKWARD vérifiée au
  registre) ». Toujours vraie, elle ne nomme ni la version figée (1.1.0, `contrat-etat-publie-v1.1`), ni « un octet = une
  version », ni le transitif ; le fichier ne change que par une PR demandée par l'utilisateur (§6). **Choix retenu par
  défaut : la ligne reste** ; la règle exacte est dans les README du catalogue et de la plateforme. À écrire si vous le
  demandez : « figé à la dernière version de `contrat/historique/etat-publie/versions.json` : un octet = une version,
  ajouts facultatifs seuls dans une majeure, matrice inchangée, registre en BACKWARD_TRANSITIVE ».

- **STORY-1103, D-1103-1 — qui touche `prospera-expert-comptable` pour l'e-mail du renvoi ?** (ouverte) Le dépôt
  n'est tenu par personne (plan maître §2) ; il porte le consommateur des trois e-mails KYC (STORY-021, STORY-590), et
  les textes sont chez D (notification). **Choix retenu par défaut : D**, qui reçoit la demande du modèle, porte aussi
  le consommateur dans `prospera-expert-comptable` (même patron que les trois autres e-mails).

- **STORY-1113, D-1113-2 — l'opérateur de la console dans les deux espaces** (question à l'architecte, ouverte) : la
  console relaie le jeton de l'opérateur vers l'essai ET le réel ; il faut donc que les services des deux espaces
  acceptent l'identité de l'opérateur de la console (même émetteur, même clé de vérification publiée). AD-15 interdit de
  partager entre espaces les **identités de service** (`MOTEUR_JETON_SERVICE` reste propre à chaque espace) et ne dit
  rien de l'opérateur. **Choix retenu par défaut** : une identité d'opérateur commune aux deux espaces (sur la pile de
  preuve, les deux auth signent avec la même clé). L'autre voie (une session par espace dans la console) est plus
  lourde pour l'écran et n'apporte rien à la démo du 15/01.

- ~~**STORY-961, le plan de journaux du SMT**~~ (D-961-1) : **renversée** par l'utilisateur (18/11) et **servie par
  STORY-973** : le plan SMT déclare le journal de trésorerie (recettes et dépenses) et les à-nouveaux. Restent
  contestables D-973-2 (le journal `AN` gardé), D-973-5 (l'écart de règlement refusé sans journal d'OD) et D-973-6
  (aucun compte de trésorerie imposé dans `TR`).
- **STORY-960, les droits d'`automatisations`** (D-960-10) : l'annexe B (et l'annexe A, C7) du PRD distributeur
  nomment `automatisations:regle:gerer`, `:regle:activer`, `:cible:valider`, `:journal:consulter` ; le manifeste
  `manifestes/automatisations.manifest.ts` déclare `:regle:ecrire`, `:regle:activer`, `:arbitrage:decider`,
  `:execution:annuler`. Auth suit l'annexe B. Choix par défaut : le manifeste se réaligne sur l'annexe avec la story
  du module. Contestable.
- **STORY-960, rôle par défaut du distributeur** (D-960-12) : aucun ; un membre sans rôle `DIST_*` n'a aucun droit.
  Choix par défaut : on garde (FR-4). Alternative : `DIST_ADMIN` par défaut au `TENANT_ADMIN`.

- ~~**STORY-951, l'invitation au réel**~~ (D-951-8) : **tranchée** par l'utilisateur (« avant février ») et
  **servie par STORY-974** (18/11). Reste contestable D-974-8 : la liste des invités vient de l'ordre de la console,
  tant que le dossier d'installation (FR-8) n'est pas rejoué.

- **Réglages de `centrale-service` et `agent-instance`** (STORY-955) : la fusion par commit, par squash et par rebase
  est permise dans les deux dépôts. « Rebase and merge » seul est **à poser par l'utilisateur** dans les réglages
  GitHub ; la session ne touche pas aux réglages.
- **D-955-2 : pas de NestJS au premier incrément de l'agent et de la centrale.** Ils tournent en TypeScript natif
  sous Node 24, comme `prospera-plateforme`, dont ils copient le code. L'exécuteur doit rester minimal (AD-36), et
  `jose` 6 est ESM seul. La centrale passera à NestJS, MongoDB et Kafka avec le parc et le contact mTLS (suite
  d'EPIC-148). **Contestable.**

- **ADR « droits hors du jeton » (STORY-938)** : adoptée par défaut, sur la recommandation de A. **Contestable** par le
  PO jusqu'à sa première story de mise en œuvre.
- **Passation d'auth, reste non traité** : la console affiche « sans rôle métier » pour un membre qui reçoit le rôle
  par défaut (l'API d'administration rend le `tenantRole` stocké, pas le rôle effectif). À nommer en story (B, lot
  suivant).

- **Réglages de `prospera-plateforme`** (plan §10, action 1) : « Rebase and merge » seul n'a pas pu être posé par la
  session (commande refusée par le mode automatique). Commits de fusion et squash y sont encore permis. À poser dans
  les réglages GitHub du dépôt.

## Pièges rencontrés

- **Un relevé de mémoire en `Start-Job` a figé la passe près de quatre heures, verrou tenu** (STORY-1137, 04:32 → 08:19) : le
  `finally` attendait l'arrêt du travail (`docker stats` en boucle) avant le `down -v`. Relever la mémoire par un processus
  séparé, BORNÉ en tours, tué par son PID ; et un `timeout` sur CHAQUE commande Docker de la passe (`passe.sh` de 1137).
- **Les routes d'administration du catalogue sont sous `/api/v1/catalog/…`** (`admin/referentiels`, `entitlements`), celles du
  moteur et de l'essai à la racine (`/api/v1/installations`, `/essais`, `/jeux-demonstration`) : une recette qui vise le catalogue
  de l'essai par `ESSAI.catalogue` (`…/api/v1`) ajoute `/catalog` aux premières (404 « Cannot POST »).
- **Un `Dockerfile` lu par un test n'existe pas dans l'étage `verification`** de l'image : une garde du checkout se saute quand
  le fichier manque, sinon Node 24 rougit en `ENOENT`.
- **Un fichier de schéma qui importe un service du moteur crée un cycle d'import** (`Cannot read properties of undefined
  (reading 'name')` au chargement d'un `@InjectModel`) : les énumérations partagées par un schéma vont dans un fichier sans
  import (`statuts-d-installation.ts`).
- **Un champ `type: Object` neuf d'un schéma du catalogue rougit `schemas-sans-chemin-mixed.spec`** : l'inscrire comme objet libre
  voulu, avec sa raison.

- **Un script de preuve qui lève avant `client.close()` garde Node en vie** (STORY-1130) : la passe a attendu le `timeout`
  du script, verrou tenu, après un `E11000` du semis (deux organisations dont les quatre derniers caractères étaient
  égaux). Finir le script par `process.exit` dans `catch` et `then`, et tirer les clefs de preuve de l'identifiant entier.
- **Une suite de minuteries rougit sous la charge de l'étage `verification` du catalogue** (`jetons-du-moteur.spec`, non
  touchée, 1 test sur 1 746) : verte seule trois fois sur trois dans la même image. La rejouer seule avant d'accuser le diff.
- **Une mutation du registre survit si le double ignore `upsert`** (STORY-1130) : un faux `updateOne` qui crée toujours la
  ligne rend `{ upsert: false }` invisible. Le double imite MongoDB : sans `upsert`, une ligne absente n'est pas créée.
- **Une version neuve d'un fichier recopié peut arriver pendant la story** (paquet fiscal, STORY-340 de C) : relire la
  source juste avant la fusion, pas seulement avant la copie ; remplacer la copie dans le même commit (une seule recopie).

- **Une suite rouge connue du poste masque une assertion neuve** (suite « h » de STORY-1124) : `ged.service.spec` rougit sur
  le poste (copies CRLF) avant d'atteindre la liste des schémas consommés ; un schéma consommé neuf ne s'y voit que sous
  Node 24 (étage `verification`). Ajouter un fait consommé = mettre à jour cette liste, et lire l'étage `verification`.
- **Un fait d'un dossier reprend les attentes de ce dossier** (D-1124-21) : une preuve qui compte les appels au fiscal
  après un fait doit soustraire ceux de la reprise.
- **Le filtre global du catalogue retire en silence un champ hors de sa liste blanche** (STORY-1129) : le 409 portait
  `module`, les unitaires le voyaient (ils lisent l'exception), la pile ne le servait pas. Un refus neuf du catalogue nomme
  ses précisions dans un champ de la liste (`code`, `refus`, `modules`, `planId`…) et une recette le lit sur la pile.
- **Installer par le plan, c'est appeler les vérifications** (STORY-1129) : une recette qui passait par le `PUT` d'un module
  à adresse sans lever son service rougit en `SERVICE_INJOIGNABLE` ; lever les services qui vérifient avant le plan.
- **Un seul plan pour deux modules resserre la course de l'état publié** : le service lecteur (dossier) ne voit `EN_SERVICE`
  que quelques secondes après `TERMINE` ; une création juste après rend `403 ABONNEMENT_EXPIRE`. Rejouer sur ce seul refus.
- **Une passe de plusieurs suites en un lancement** : un `read ECONNRESET` du poste dans l'une rougit les suivantes ; jouer
  une suite par `npm run recette` (`PASSE_UNE_A_UNE`), chaque journal la sienne.
- **Une attente au premier plan de plus de ~3 min passe en arrière-plan** (l'outil la déplace) et `TaskStop` ne la tue pas :
  boucles de 165 s au plus, puis `ps -ef | grep` et `kill`.

- **Karapace rend `50003` (« Error while forwarding the request to the master ») juste après sa santé** (STORY-1128) : un
  premier `POST /subjects/…` lancé dès `healthy` échoue ; l'enregistrement du script, quelques secondes plus tard, passe.
  Attendre un premier `GET /subjects` qui répond avant d'écrire, ou rejouer une fois.
- **Un contrat JSON se compare par empreinte CANONIQUE** (`sha256` de `JSON.stringify(JSON.parse(texte))`) : le checkout du
  catalogue est en CRLF (`matrice-etats.json` 51 285 octets), l'export et l'image en LF (49 572) ; une empreinte des octets
  rougirait selon le poste.
- **Ajouter un champ à la comparaison de l'émetteur casse les cas « inchangé » des tests** (`emis` sans le champ = un état
  d'avant la livraison, donc republié) : c'est voulu ; ajouter le champ aux états émis de ces cas, et garder un cas « sans le
  champ ⇒ republié une fois ».
- **Une sous-session coupée par le réseau (ENOTFOUND) pendant une story longue** (deux fois en 1128) : tout poussé tôt
  (fiche et annonce fusionnées, branches poussées), passe Docker dans un script `nohup` à trappe qui rend le verrou : la
  reprise n'a rien perdu.

- **`TaskStop` d'une tâche de fond Bash ne tue pas la boucle qu'elle a lancée** (STORY-1127) : une boucle « attendre le
  verrou puis passer » arrêtée par `TaskStop` a survécu, a attendu la fin de la vraie passe, puis a repris le verrou à la
  seconde où il a été rendu (14:43) pour rejouer toute la passe pendant que D attendait. Après tout `TaskStop` d'une boucle :
  `ps -ef | grep <script>`, puis `kill` du parent ET de l'enfant ; la trappe `EXIT` de la passe a bien rendu le verrou. Ne
  jamais lancer une boucle d'attente en tâche de fond : attendre par `timeout 175 … while [ -e verrou ]` au premier plan,
  puis lancer la passe seule (elle prend le verrou elle-même, atomiquement).
- **Les routes du catalogue exigent `emailVerified: true` dans le jeton** (`403 EMAIL_NOT_VERIFIED`) : une doublure JWKS de
  preuve doit le poser, comme `iss`, `aud`, `org`, `perms`.
- **L'émetteur de l'état publié ne compare que ce qu'il range** (`etats_emis`) : un champ neuf du fait qui doit republier
  se range et se compare ; `versionCode` ne l'est pas (D-1127-10). Un état émis avant la livraison est republié une fois.

- **Une pile de preuve à doublure d'auth cache la limite de débit d'auth** (STORY-1126) : sept stories de la GED prouvées
  contre une doublure sans limite ; la vraie pile a rendu 503 `DROITS_INDISPONIBLES` à la cinquième boîte (la GED relisait
  `GET /moi/droits` à chaque requête, et auth limite chaque ADRESSE, donc celle de la GED, à 100 par minute). Tout service qui
  lit les droits chez auth : un cache par jeton (ou membre, organisation, `dv`), et une recette sur la vraie pile.
- **Le recensement des routes de `document-service` (STORY-695) est une liste fermée** : une route neuve du cabinet non
  inscrite fait rougir `dossier-portee-collaborateur.e2e-spec` (la route de « f » y manquait, rouge sur `dev`). Relancer
  CETTE e2e après toute route neuve.
- **Le journal d'intégrité ne chaîne que les actes probants** (versement, scellé, documents émis, vérification, fermeture,
  export) : 10 entrées pour 40 boîtes ; une recette le prouve par ses actes, jamais par un nombre de gestes.
- **Un `Start-Process` détaché porte la passe, pas l'outil** : un `run_in_background` garde un délai ; une passe qui prend le
  verrou, lève la pile, `down -v` et rend le verrou dans un `finally` ne meurt pas avec la commande qui l'a lancée.
- **Un heredoc Bash avec des apostrophes typographiques a cassé, encore** (script de docs) : écrire ces scripts par l'outil.

- **Une preuve qui compare deux corps JSON par `JSON.stringify` rougit sur l'ordre des champs** (STORY-1125 : la liste du BFF
  rendait `cabinets` avant `tronque`, contenu identique) : comparer en JSON canonique (clés triées), et garder l'ordre de la
  source dans une projection qui se veut un relais.
- **Un tableau de promesses lancées d'un coup dans un test de refus** (`for (const p of [service().a(), service().b()])`)
  laisse une promesse rejetée sans attente quand une mutation fait passer une autre : jest meurt sans ligne `Tests:` et le
  script de mutations lit « SURVIT (?) ». Lancer chaque appel dans la boucle (`() => service().a()`).
- **Une mutation qui retire un rétrécissement (`pose.quotaOctets === null`) ne compile plus** : en écrire une variante typée
  (`as number`) pour la juger sur assertion.
- **La garde `sources-des-manifestes.spec` de `document-service` rougit sous Node 25 sur ce poste** (le manifeste du checkout
  est en CRLF, l'empreinte notée est celle du LF) : troisième rouge connue du poste, verte dans l'étage `verification`.
- **Le paramètre `OrgParamsDto` des installations du BFF accepte toute chaîne** (`/^[A-Za-z0-9_-]{1,64}$/`) : une route qui
  relaie vers un service qui exige un ObjectId doit poser le sien, sinon l'erreur revient de l'amont en `404`.

- **Un schéma Mongoose strict retire en silence un champ neuf d'un `$set`** (STORY-1124) : les doubles en mémoire étaient
  verts, la pile a rendu 6 KO (la copie désinscrite ni retirée ni gardée). Tout champ neuf d'une entité persistée ⇒
  le déclarer au schéma, et un test qui construit un document du modèle et relit le champ **sans le type inféré** (sinon
  la mutation ne rougit qu'au compilateur).
- **Une mutation sur un second jugement « sous le verrou » survit en mémoire** quand le premier jugement du service a déjà
  refusé (M6, M18) : tester le dépôt directement (`DepotPhysiqueMemoire.restituer` avec une sortie ouverte).
- **Un redémarrage du poste coupe la passe ET laisse le verrou** (STORY-1124, 09:25 → 09:39) : la pile était descendue
  (`down -v` fait), seul l'étage `verification` était en cours ; à la reprise, relire `passe.log` (ce qui est prouvé) et
  rendre le verrou d'abord ; un conteneur nommé reste `Exited (255)` : `docker rm` avant la passe suivante.
- **Prouver une réception « tout ou rien » sur la pile** : un validateur posé sur `ged_boites` (`collMod`, `libelle: { $ne:
  'REFUS-DE-LA-BASE' }`) fait échouer l'`insertMany` dans la transaction ; on compte réceptions et boîtes avant et après,
  puis on retire le validateur (`validationLevel: 'off'`).

- **Une sous-session coupée par la limite de l'API (429) garde le verrou ET sa pile** (STORY-1123 : 05:11 → 07:04, C attendait
  depuis 05:14). Jouer la passe de preuve en UN script qui finit par `down -v` (et le test Node 24 à la suite), lancé en
  arrière-plan ; ne rien laisser tourner entre deux appels.
- **`timeout` qui tue un script de mutations laisse le fichier MUTÉ et un jest orphelin** (STORY-1123, M14 : la mutation du
  curseur faisait boucler la spec) : `git checkout -- <fichier>`, puis `Stop-Process` des `node … jest` restés. Donner un
  `timeout` à chaque jest du script, pas au script entier.
- **Le contrôle d'intégrité ne lit pas `ged_versions.empreinte`** : il relit l'objet et le compare à la ligne du bordereau.
  Pour provoquer un écart sur une pile, remplacer l'objet dans MinIO (`mc pipe m/ged-pieces/<objetCle>`).
- **Un quota de 1 000 octets n'est pas dépassé par des PDF de 50 octets chiffrés** (82 octets pour quatre pièces) : la
  preuve d'un quota dépose une pièce plus grosse que le quota.
- **Un remplacement d'entrée qui doit garder un champ** (l'annonce d'une échéance) : `updateOne(filtre, [{ $replaceWith:
  { $mergeObjects: [{ $literal: doc }, { $cond: [...] }] } }], { upsert: true })` garde `_id`, fait l'upsert, et heurte
  l'index unique comme `replaceOne` (prouvé sur la pile, STORY-1123).
- **Un doublon d'`_id` DANS une transaction l'annule** (la suite échoue au commit) : un état « une fois par franchissement »
  se lit puis s'écrit dans la session (le conflit d'écriture est rejoué par la transaction), jamais par un upsert qui compte
  sur `E11000`.

- **Une pile de preuve trouve ce que les doubles en mémoire ne montrent pas : le rythme** (STORY-1122) : un délai
  croissant dès le dépôt retardait un texte lu de plusieurs minutes, et 1 500 pièces sans lecture revues à chaque
  balayage ralentissaient le tour (89 s au lieu de 16). Mesurer les temps sur la pile avant de figer une règle de file.
- **La limite de débit du service (100 requêtes par minute) coupe un script de preuve qui sonde** (STORY-1122 :
  `p.json` indéfini sur un `429`) : sonder toutes les 2 s et rejouer un `429` après `Retry-After`.
- **Un mot de quatre lettres se trouve par hasard dans des jetons base64 mis en minuscules** : pour prouver « aucun mot
  en clair » dans un index à jetons, chercher hors des tableaux de jetons et contrôler la forme de chaque jeton.
- **Deux contrôleurs qui s'importent l'un l'autre** (un DTO de réponse d'un côté, un DTO de requête de l'autre) chargent
  une classe avant sa définition (`extends undefined`) : sortir les DTO dans leur fichier (`recherche.dto.ts`).
- **Prettier du dépôt exige LF** et le checkout est en CRLF : linter avec `--rule '{"prettier/prettier": ["error",
  {"endOfLine": "auto"}]}'` et formater avec `prettier --end-of-line auto`.
- **Un script de mutation Python qui imprime « → » plante sous la console cp1252** : `PYTHONIOENCODING=utf-8`.

- **La garde de STORY-395 (`piece-conservation.spec`) lit TOUT `src/` pour `removeObject(`** (STORY-1121) : sous Node 25
  sur ce poste elle rougit déjà (chemins Windows), si bien que seul l'étage `verification` (Node 24) a vu l'adaptateur de
  `ged` la faire rougir. Toujours rejouer l'étage `verification` avant de pousser un retrait de stockage.
- **`GET …/ged/cabinet/pieces/{id}` est servie par `PhysiqueController`** (la vue enrichie de l'original), pas par
  `CabinetController` : une e2e qui ne monte pas `PhysiqueController` et `PhysiqueService` rend 404 (STORY-1121).
- **`jest -t "<un test>"` d'une e2e enchaînée saute les tests qui posent l'état** (le fonds, les pièces) : le test visé
  tombe sur des variables vides (404). Rejouer le fichier entier.
- **Une course de propositions consomme des numéros** (`DES-2026-00001 → 00005` pour une seule gagnante sur la pile) :
  la séquence a des trous, jamais de doublon ; un script de preuve ne présume pas du numéro.
- **`DepotIntegriteMongo.inscrire` rejoue la transaction sur `E11000`** (8 essais) : un acte qui doit refuser une course
  sur un index unique la juge d'abord dans la session (lecture des lignes en cours) et rend `false`, sinon il épuise les
  essais avant de lever (STORY-1121, `creerDestruction`).
- **Un heredoc Bash de ~80 lignes avec des apostrophes typographiques a encore cassé** (« unexpected EOF ») : écrire les
  scripts de docs avec l'outil d'écriture.

- **Une mutation sur une empreinte survit derrière AES-GCM, encore** (STORY-1120, M10 et M12, après M12 de 1119) : un
  test qui « altère » un objet en changeant un octet du chiffré prouve le refus du déchiffrement, jamais la comparaison
  d'empreinte. Remplacer l'objet par un **autre clair, bien chiffré** avec la clé du test (`chiffrer(autre, clé)`).
- **Un refus « avant » doublé d'un conditionnel « sous la transaction »** (STORY-1120, M15 → M17) : retirer l'un laisse
  l'autre refuser, la mutation survit. Prouver le premier par ce qu'il évite (aucun objet déposé, aucun numéro pris),
  le second en appelant le dépôt directement ; une garde vraiment redondante se dit équivalente (M18).
- **`/health` de la doublure ne suffit pas à ouvrir un fonds** : le read-model des dossiers clients arrive par
  `dossier.created` (quelques secondes après le dépôt du message) ; un script de preuve réessaie l'ouverture du fonds
  (`404 DOSSIER_INCONNU` d'abord). Messages de la preuve : `preuve1120/messages.sh` de la session (non versionné).
- **Un script de preuve qui compte « le premier EXPORT » du journal se trompe dès que deux exports tournent** (l'associé
  et l'archiviste en ont demandé un chacun) : chercher l'entrée par `details.export`.

- **Pile de preuve de `document-service` sans auth réel** (STORY-1119) : une doublure Node (JWKS RS256, `GET
  /api/v1/moi/droits` par `sub`, `/jeton` pour le script) suffit ; le dossier client se pose dans `dossiers_dossier`
  (mongosh) et l'état publié de `ged` (`EN_SERVICE`) part par `kafka-console-producer` sur `etat-publie.changed.reel` :
  la garde s'ouvre en quelques secondes. Compose et script : `preuve1119/` de la session (non versionnés).
- **Un `FormData` de Node sans type MIME** sur le fichier (`new Blob([octets])`) rend `400 FORMAT_NON_CONFORME` chez la
  GED : donner `{ type: 'application/pdf' }` ou `image/png`.
- **Une mutation sur une empreinte peut survivre derrière AES-GCM** (STORY-1119, M12) : un chiffré altéré ne se
  déchiffre plus, le refus vient du déchiffrement et le contrôle d'empreinte n'est jamais mordu. Le tester par un objet
  qui se déchiffre mais ne redonne pas l'empreinte gardée.
- **`eslint --fix` retire `as DepotCabinetMemoire` d'un `app.get(DepotCabinet)`**, puis TS2339 : écrire
  `app.get<DepotCabinet, DepotCabinetMemoire>(DepotCabinet)`.
- **`document-service` sous Node 25 sur ce poste : 2 suites rouges connues** (`ged.service.spec` « copies à l'octet de
  la plateforme », fichiers en CRLF ; `piece-conservation.spec`, chemins `\`) ; vertes dans l'étage `verification`
  (Node 24, archive en LF). Le lint du dépôt exige `--max-warnings 0` : un avertissement `no-unsafe-argument` rougit.

- **Une session coupée (ENOTFOUND) garde le verrou Docker** (correctif de STORY-1115) : le build tombé sur `npm ci`,
  le fichier du verrou est resté six heures sans aucune pile levée, alors que C et D attendaient. Prendre le verrou
  juste avant le `build`, jamais avant d'en avoir besoin. Une session qui reprend relit le verrou et `docker ps`, et rend
  le verrou sur-le-champ si rien ne tourne.
- **`409` d'un dépôt de référentiel = « ce couple est pris », pas « ce sont mes octets »** : comparer l'empreinte du
  registre avant d'accepter (la recette acceptait un paquet périmé depuis STORY-901).

- **Le garde des en-têtes du BFF lit aussi les commentaires** (correctif de STORY-917) : `cors.util.spec.ts` relève
  tout `@Headers('x')` et tout `headers['x']` des sources hors specs, commentaires compris. Un commentaire qui écrit
  `@Headers('…')` fait du « … » un en-tête lu, et le garde rougit. Dans un commentaire, écrire `@Headers(nom)`.
- **Un en-tête lu par un contrôleur du BFF s'annonce au CORS dans la même PR** (`If-Match` à AP-26, `Idempotency-Key`
  à AP-55) : les e2e et un `curl` restent verts, et seul le navigateur refuse. Le garde de `cors.util.spec.ts` le
  rappelle ; un en-tête de réponse que la console doit lire s'ajoute à `EN_TETES_DE_REPONSE_EXPOSES`.
- **`node script.js` qui finit par `process.exit` pendant la fermeture de serveurs HTTP plante sous Windows**
  (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`, sortie 127) après un résultat juste : lire le verdict
  imprimé, pas le code de sortie, ou attendre les `close()` avant de sortir.

- **Les e2e de `dossier-service` dépassent leurs délais sous charge** (correctif de STORY-1073) : jouées en parallèle
  avec un lint, 7 tests de 4 suites (axes, participations, démonstration, dossiers) ont rougi sans lien avec le code ;
  rejouées seules en `-i`, 271/271. Ne pas lancer les e2e à côté d'une autre suite lourde ; rejouer en `-i` avant
  d'accuser le diff.

- **Le relais de ports du poste coupe aussi des REQUÊTES, pas seulement des réponses** (STORY-1116, suite de
  D-1115-12) : une des cinq ouvertures parallèles n'a jamais atteint le BFF (quatre `POST` à son journal), un dépôt de
  pièce n'a jamais atteint kyc, une réponse 200 d'auth s'est perdue. Prouver par le journal du service visé (pino : la
  ligne `request completed` et sa durée) avant d'accuser un service ; rejouer la suite seule sur pile neuve.
- **Un heredoc NON quoté (`<<EOF`) exécute les accents graves** d'un texte Markdown : `npm run recette -- …` y est parti
  du dossier racine (sans effet, ENOENT). Écrire un corps de PR par l'outil d'écriture, ou `<<'EOF'`.
- **D fusionne `dossier` et `paiement` pendant une story de B** : relire `origin/dev` de chaque service juste avant la
  recette complète et reconstruire ce qui a bougé (1116 : `4352ac3`, `e2be149`). Un `npm ci` coupé (`ECONNRESET`) pendant
  `compose build` se relance : le cache garde ce qui est fait.
- **La limite de débit d'auth (accept-invitation 5/min, global 100/min par adresse) et du BFF (100/min)** borne une
  recette qui part d'une seule adresse : `avecPatience` (`src/cinq-essais.ts`) attend un `429` sans rien rejouer d'autre.

- **`read ECONNRESET` (« fetch failed ») entre le poste et la pile** (STORY-1115) : 17 au premier passage complet,
  attribués à la connexion réutilisée après le `keepAliveTimeout` de Nest (la recette envoie désormais
  `connection: close`, comme le script de preuve de 1113) ; d'autres au passage suivant, sur connexions neuves, pendant
  une panne réseau du poste. Un `POST` coupé n'est jamais rejoué : lire la `Cause` de jest avant de chercher un défaut
  dans le service.
- **La recette fait `up` sans `--build` pour ses services de suite** (dossier, balance, bilan, BFF…) : une image
  `grp-b-*` d'un autre jour sert sans un mot (STORY-1115 : le BFF de 14 h avant, sans `/admin/essais`, 404). Avant une
  recette, `docker compose … build` de **tous** les services depuis les archives.
- **PowerShell lit `-d` et `-v` comme `-Debug` et `-Verbose`** quand un script les reçoit par
  `ValueFromRemainingArguments` : `up -d` s'est attaché, `down -v` a laissé les volumes. Passer les arguments de compose
  en une chaîne. Et `down` n'enlève pas les services d'un profil non actif (`fiscal`) : nommer `--profile fiscal`.
- **Sur des volumes conservés, auth garde la clé de son premier démarrage** : la clé commune des deux espaces ne vaut
  que sur des volumes neufs (`down -v`).

- **Les doubles en mémoire des e2e de kyc n'annulent pas la transaction** (STORY-1103) : `withTransaction` y exécute
  la fonction, sans rollback. Un refus levé APRÈS une écriture y laisse l'écriture (la capture des corps l'a montré :
  le dossier sortait de revue sur un 409). En vrai MongoDB la transaction l'annule, mais un refus métier se vérifie
  **avant** d'écrire, comme la précondition d'ETag — c'est ce qu'a retenu le renvoi.
- **`process.exit()` juste après un `fetch` plante Node 25 sous Windows** (assertion libuv `UV_HANDLE_CLOSING`, code
  de sortie 127 au lieu de 0) : un script CLI qui parle HTTP pose `process.exitCode` et laisse la boucle se vider.
- **`git stash -u` puis `pop` ressort les fichiers neufs en CRLF** (`core.autocrlf=true`) : un script de
  remplacement qui cherche des `\n` ne trouve plus son ancre. Lire le fichier, ou détecter la fin de ligne.
- **Une mutation qui retire le seul usage d'un nom ne compile plus** (TS6133, variable ou import inutilisé ; `if
  (false)` : code inaccessible) : la suite « échoue » sans qu'aucune assertion ne morde. Muter en gardant l'usage
  (`… && Date.now() < 0`), et lire la ligne `Test suite failed to run` avant de compter une mutation tuée.
- **Le BFF publiait moins que ce qu'il relayait** : `reviewStatus` et `reviewedAt` d'une pièce traversaient depuis
  STORY-128 sans figurer dans l'OpenAPI, donc sans exister pour la console. Relire la classe projetée quand on ajoute un
  champ à côté.

- **Le fixture non typé de `test/bilan-export.e2e-spec.ts` a mordu une deuxième fois** (correctif de STORY-483) : son
  commentaire « angle mort connu » le dit depuis STORY-482 — `ProjectionService` y est mocké par un littéral, donc un
  champ que l'export lit en plus (`avertissements`) passe `tsc` et rend **500** à l'exécution. Tout champ neuf lu par
  l'export ⇒ l'ajouter à ce littéral, et lancer cette e2e (les e2e de projection ne la couvrent pas).
- **Un worktree de `bilan-service` sort ses 75 JSON en CRLF** : les référentiels refusent leur empreinte
  (`ReferentielIntegrityError`) et 64 tests rougissent sans rapport avec le code. Les supprimer puis
  `git -c core.autocrlf=false checkout -- <fichiers>` ; le `node_modules` se partage par une jonction
  (`New-Item -ItemType Junction`, depuis PowerShell : `mklink` par Git Bash refuse l'option).
- **Un test qui affirme « le snapshot n'est même pas lu »** (STORY-449, AC-3) gardait le défaut de STORY-065 en même
  temps que son intention (la liasse d'un brouillon est calculée) : il a été réécrit pour garder l'intention seule.
- **Changer le sens d'un champ du service, c'est relire tous ses lecteurs** : `consulter()` a trois appelants hors du
  contrôleur ; l'analyse et la consultation lisaient `version` comme « version servie » (correct par accident, tant
  que le défaut existait). Ils lisent désormais `origine` (D-065-3).

- **Une doublure « fidèle à l'octet » sans Docker** (STORY-1114) : les corps de l'amont se produisent par **son propre
  code** (ts-node sur le checkout d'auth à `origin/dev`, `transpileOnly`, son `tsconfig` : même émission des champs ;
  ses services avec des modèles Mongo doublés, son filtre d'erreurs sur les exceptions qu'ils lèvent), puis se
  versionnent en fixtures. Constaté ainsi, pas supposé : chez auth, un refus `{ message, code }` sort avec `error:
  "BAD_REQUEST"` / `"CONFLICT"` (nom de l'énumération, pas « Bad Request »), les précisions (`roles`) **à côté** du code,
  et un `requestId`. Script : `s1114/capturer-auth.js` de la session (non versionné).
- **Mutations sous Windows** (STORY-1114) : la marque d'un test rouge de jest (`×`) arrive mal décodée par un
  `subprocess` Python ; lire la ligne `Tests: N failed`, et « Test suite failed to run » pour une mutation qui ne
  compile pas. Une mutation qui élargit un garde (`!x && false`) peut casser le rétrécissement de type de TypeScript :
  l'écrire en `… || autre condition`.
- **`@typescript-eslint/unbound-method`** sur `Classe.prototype.methode` dans un test de métadonnées : lire la méthode
  par `Object.getOwnPropertyDescriptor(prototype, 'methode')?.value`.

- **L'enveloppe d'erreur du BFF (`AllExceptionsFilter`) ne garde que `code` et `details`** (STORY-1113) : tout autre
  champ d'une `HttpException` (`modules`, `refus`, `planId`, `champs`) est retiré sans bruit. Les e2e du BFF ne
  montent pas le filtre (il est posé par `CommonModule`, `APP_FILTER`) : ils voyaient les champs, la console jamais.
  Une précision de refus va dans `details` ; un e2e qui la vérifie monte `{ provide: APP_FILTER, useClass:
  AllExceptionsFilter }`. Le relais du moteur d'installation (917, 1080) en souffrait depuis le 17/11.
- **Deux espaces sur une pile** (STORY-1113) : un Kafka et un Redis par espace (un Kafka partagé ferait connaître au
  catalogue du réel l'organisation née dans l'essai, par `identity.org.created`), des bases distinctes, des secrets du
  moteur distincts, la même clé de signature pour que le jeton de l'opérateur vaille des deux côtés
  (`JWT_SIGNING_KEY_PEM`, `JWT_SIGNING_KID` : importée au premier démarrage sur base neuve). Surcouche de la preuve :
  `preuve1113/surcouche.yml` de la session (à reprendre pour STORY-1115). 12 conteneurs, tenus par la VM de 8 Go.
- ~~**Une organisation née par le moteur n'a aucun membre**~~ (servi par la suite de 1112 : le catalogue de l'essai
  invite le premier administrateur à l'ouverture, après la liste blanche). Une adresse hors liste blanche rend
  `INTERCEPTEE` (rien ne part) : la recette met d'abord le domaine du prospect en liste blanche.
- **PowerShell 5.1 écrit les journaux `*>` en UTF-16** (suite de 1112) : `grep` ne voit rien ; lire par
  `iconv -f UTF-16LE -t UTF-8`.
- **Un paramètre par défaut avale `undefined`** (suite de 1112, e2e d'auth) : `inviter(corps, jeton = JETON)` appelé
  avec `undefined` envoie le jeton ; un test « sans jeton » passe `null`.
- **Le script de mutations joue la commande dans le dossier du fichier muté** (suite de 1112) : une mutation du profil
  (`docker-compose.recette.yml`, à la racine du dépôt) jouée depuis la racine rend `0 total` ; jouer la garde depuis
  `paquets/recette-croisee`.
- **Mutation : retirer l'usage d'une constante ou d'un paramètre ne compile plus** (`noUnusedLocals`) : muter la
  condition (`… && Date.now() < 0`, `|| x.length > 0`), pas la ligne qui seule l'utilise ; et une mutation sur une
  étiquette (le nom d'un coupe-circuit) ne mesure rien : la choisir sur un comportement.

- **`enableImplicitConversion` du `ValidationPipe` du BFF fait d'une chaîne un booléen** (STORY-1112) : `"oui"` ou
  `"false"` deviennent `true` avant `@IsBoolean`. Un booléen d'un corps se garde tel quel par
  `@Transform(({ obj }) => obj.<champ>)` ; une mutation qui retire le `@Transform` laisse l'import inutile (TS6133) :
  muter la valeur (`Boolean(obj.<champ>)`), pas la ligne.
- **`eslint --fix` a retiré `statut as HttpStatus`** (STORY-1112), puis l'import est devenu inutile : relancer `tsc`
  après `--fix` (piège de 1084, une fois de plus).
- **L'ouverture d'un essai avec un jeu dure plusieurs secondes** (8,2 s sur la pile, naissance chez auth comprise,
  sans modules levés) : tout appelant de `POST /essais` doit avoir un délai long (le BFF : `UPSTREAM_ESSAI_TIMEOUT_MS`).
- **Garde des noms de schéma au BFF** : le document de l'`AppModule` du BFF a 34 chemins (au 24/11) ; le garde
  rougit sur une seconde classe de même nom (`EssaiDto ×2`). Reste à poser au catalogue et à auth s'ils publient des
  DTO par Swagger (le contrat de l'essai est écrit à la main, `contrat/*.json`).

- **Swagger ne garde qu'une classe par nom de schéma, sans rien dire** (correctif de STORY-1084) : deux DTO de même
  nom dans deux modules donnent un seul schéma, et toutes les références pointent la même forme ; `gen:api`, `tsc` et
  le build du front restent verts sur un type faux. L'avertissement « Duplicate DTO detected » ne se déclenche presque
  jamais. Bilan a désormais `src/openapi-schemas-uniques.invariant.spec.ts` (document de tout `AppModule`) ; le même
  garde manque sans doute ailleurs (BFF, catalogue, auth) : à poser par la prochaine story de B qui touche leur
  OpenAPI. Nommer un DTO par son module (`…DetteDto`, `…ConsolideDto`, `…MensuelleDto`).
- **`@nestjs/swagger` ferme ses `exports`** : `SchemaObjectFactory` se lit par son chemin
  (`join(dirname(require.resolve('@nestjs/swagger')), 'services', 'schema-object-factory')`).
- **Les DTO de bilan sont en CRLF dans le checkout, les fichiers écrits après le clonage en LF** : un script de
  remplacement doit convertir ses motifs à la fin de ligne du fichier, sinon il ne trouve rien (ou mélange les deux).

- **Une demande « après la fusion de X » peut être servable avant la fin de la story** (STORY-979) : le code de C a
  été fusionné entre le rituel et les docs. Relire le journal du demandeur et `origin/main` juste avant la PR de docs ;
  la copie se fait alors dans la même story, après un amendement du contrat annoncé avant sa fusion.
- **`npm run manifestes:copier` recopie TOUT `manifestes/`** et écrit dans `origine` le SHA du dossier source s'il est
  un dépôt git : la lancer depuis `_wt-b-stories` en HEAD sur `origin/main` (CRLF sans effet sur les valeurs : la
  copie faite depuis `git -c core.autocrlf=false archive` est identique hors `origine`), après `manifestes:garde` pour
  voir d'abord ce qui change.
- **Un manifeste amendé sans changer de version** (facturation 1.0.0, STORY-1065) n'atteint pas une base de catalogue
  déjà semée (le semis n'écrit pas une version publiée) : le dire au propriétaire du manifeste.
- **Recopier un manifeste « depuis un SHA donné »** (suite de 979) : mettre `_wt-b-stories` en HEAD détachée sur ce
  SHA avant `manifestes:copier` (la ligne `origine` le nomme), vérifier d'abord que `manifestes/` n'a pas bougé entre ce
  SHA et `origin/main` (`git diff --stat <sha> origin/main -- manifestes/`), puis rejouer la garde contre `main`.
  Remettre le worktree sur `origin/main` avant d'écrire les docs.
- **`main` peut porter un manifeste en avance sur son code** (troisième suite de 979 : `balance` 1.2.0 de STORY-1020,
  contrat annoncé, code en cours) : copier depuis le SHA nommé par la demande, pas depuis `main` ; la garde contre
  `main` rougit alors sur ce seul manifeste, à écrire dans la fiche. La copie entière entraîne aussi les manifestes
  montés entre la dernière copie et ce SHA (`balance` 1.1.0) : regarder « → B » des autres journaux avant de copier.

- **Une construction d'image peut tomber sur le téléchargement du binaire de Confluent** (19/11 : `npm ci` de
  `fiscal-service`, « Client network socket disconnected before secure TLS connection », `node-pre-gyp` puis
  compilation impossible) : c'est le réseau, pas le code ; relancer la construction (STORY-1080, le 24/11 : verte).
- **Le portefeuille de `dossier-service` (`GET /dossiers`) range ses lignes dans `lignes`** (`PortefeuilleResponseDto`),
  pas dans `items` : `liste(corps, 'lignes')` dans la recette (STORY-1080).
- **La route du contrat de l'état publié ne se relaie pas à la console** : elle est réservée aux membres de
  l'organisation et aux identités de service (`ORGANISATION_HORS_JETON`) ; la console lit
  `GET /api/v1/console/etat-publie/{org}` (`org:read`) par le BFF (STORY-1080).
- **Ajouter un contrôleur au document de `test/openapi-contract.e2e-spec.ts` du BFF fait voir ses DTO à l'invariant
  « aucun objet sans propriétés »** : `LancerInstallationRequestDto.referentiels` y tombait (corrigé par STORY-1080).
- **`delegation` (STORY-650/651) supposait que `DIST_ADMIN` lit le journal du paiement et rédige un modèle** : faux depuis
  STORY-960 (annexe B). Une recette qui lit une donnée métier du distributeur passe par un membre au rôle composé
  (STORY-1080). Une recette complète n'avait pas été rejouée depuis 929 (17/11) : chaque story qui touche auth ou les
  droits doit rejouer les suites qui s'en servent (`delegation`, `distributeur`, `abonnement`).
- **En fin de recette complète, la notification rend 429 (plafond par adresse) et Mailhog `ECONNRESET`** : la première
  s'attend (`retry-after`), le second se soigne par `docker desktop restart` avant la pile neuve (piège de 929).
- **`docker compose … down -v` de la recette a laissé les cinq volumes nommés `grp-b_*`** (24/11) : les lister après
  (`docker volume ls --filter name=grp-b`) et les retirer (`docker volume rm`) avant une pile « neuve ».

- **Le compose racine du poste pose `INGESTION_SOURCE_SYSTEMS` sur balance** (sans la comptabilité, ni
  `microfinance-service`) : il cache le défaut du service. Le profil de recette la retire par `KEY: !reset null`
  (Compose ≥ 2.24 ; vérifier par `docker compose … config`). Hors recette, une pile racine rejette encore une balance de
  la comptabilité `SOURCE_SYSTEM_INCONNU` (STORY-1093).
- **Une écriture de la comptabilité exige une vraie pièce chez `document-service`** : sans doublure, la déposer par
  `POST /api/v1/piece-extractions` (multipart : `type` `FACTURE`, `correlationId`, `pieceId`, `dossierId`, `file`), en
  réessayant le temps que `document-service` connaisse le dossier (STORY-1093).
- **Une surcouche fiscale chargée après le profil remplace l'`AUTH_AUDIENCE` de l'IdP** : toute audience ajoutée au
  profil doit l'être aussi dans `docker-compose.fiscal.yml` (une garde l'exige depuis 1093).
- **Coupure de l'API en pleine story** (19/11, 01:10 → 01:30) : les tâches de fond (construction d'images) sont
  perdues pour la session, mais la construction elle-même a fini (journal `code 0`) ; relire le journal avant de
  relancer.

- **Un `@Body()` typé est validé AVANT le handler** (STORY-1082) : un refus d'identité ou d'espace jugé dans le handler
  rend 400 sur un corps malformé au lieu de 403. Le juger dans une garde de classe (`@UseGuards`), qui passe avant les
  pipes.
- **L'invariant de STORY-363 (dossier-service) lit le TEXTE des contrôleurs** : un commentaire qui cite
  `@RequiresDossierAccess()` fait échouer l'exclusion d'un contrôleur du moteur. Le nommer sans `@…()`.
- **Pré-projeter dans la session d'un lot ne sert à rien** (STORY-1082) : `resoudreExerciceId` et la résolution du
  référentiel de balance lisent HORS session. Écrire la pré-projection hors transaction, en `$setOnInsert`
  (l'événement, en `$set`, reste maître).
- **`fetch` de Node 25 vers un port Docker publié : `ECONNRESET` sur une connexion keep-alive réutilisée** après une
  série de `/health` (curl passe). Rejouer l'appel une ou deux fois dans le script de preuve.
- **Une mutation `x && false` ne compile pas** (TS2367/TS2872, rétrécissement) : écrire `x && Date.now() < 0`.
- **`buildkit` « frontend grpc server closed unexpectedly »** pendant une construction lancée sous charge (jest en
  parallèle) : relancer la construction, elle passe.

- ~~**Le moteur présente un jeton STATIQUE limité à une organisation**~~ (STORY-975, D-975-11) — **soldé par
  STORY-978** : le catalogue demande lui-même un jeton par organisation. Sur une pile, lui donner
  `NAISSANCE_AUTH_URL` et `MOTEUR_JETON_SERVICE` (la valeur d'auth) ; **ne plus poser `INSTALLATION_JETON_SERVICE`** : le
  catalogue refuse de démarrer.
- **Catalogue sous Node 25 : la e2e complète a 5 suites rouges sur `origin/dev`** (STORY-978, témoin par `git stash`) :
  `health` (`RedisHealthIndicator` absent du module de test), `catalog`, `packs`, `projects`, `entitlements`
  (`PublicationDesManifestes` absent, et une base) — 172 tests rouges à l'identique. Compter avant de conclure.
- **Mutation d'un décorateur de class-validator** (STORY-978) : `@IsEmpty({ groups: [...] })` s'exécute quand même
  (aucun groupe demandé à la validation) : mutation équivalente. Muter en retirant le décorateur ET son import (sinon
  TS6133, « 0 total »).
- **Une mutation qui vide un corps de méthode laisse un paramètre inutilisé** (STORY-978) : ne compile pas. Écrire
  `if (Date.now() < 0) …` à la place.
- **Un témoin semé à la main dans une base partagée du socle heurte les index uniques** (STORY-975) :
  `balances_publiees.un_fait_par_publication` sur `eventId: null`. Lire `collection.indexes()` et donner une valeur
  propre à chaque clé d'un index unique.
- **`cloture.socle-spec` (course D-970-10, une clôture au milieu de dix lettrages) a rougi une fois (409) pendant une
  construction d'image** (STORY-975) : verte seule, et au second passage complet. À relancer seule avant de conclure.
- **Surcouche compose : un `context` relatif se lit depuis le dossier du PREMIER fichier** (le compose racine), pas
  depuis la surcouche : écrire des chemins absolus.
- **Une commande Bash au premier plan de plus de 180 s part en arrière-plan** : pour attendre (verrou, `docker wait`,
  mutations) sans rendre la main, des attentes bornées `timeout 170 …` répétées, ou un seul moniteur ré-armé.

- **Paiement sur une pile de preuve : `/health` rend 503 sans les deux URL du paiement instantané** (STORY-976) :
  `API_BUSINESS` est déclaré et `FOURNISSEUR_NON_CONFIGURE` tant que `PI_SPI_API_BASE_URL` et `PI_SPI_TOKEN_URL`
  manquent ; tout le reste est `up`. La pile de `scripts/recette/976/` pose le simulateur public : 200.
- **Attendre qu'un consommateur ait traité un fait** : lire l'offset commité du groupe
  (`kafka-consumer-groups --describe`, courant = fin du journal), pas une durée ; l'offset n'avance qu'après le
  traitement (STORY-976).
- **Mutation qui accepte un autre type** (`typeof x !== 'number' && typeof x !== 'string'`) : le rétrécissement de
  `x` est perdu plus bas, elle ne compile pas. Muter aussi l'usage (`x as number`) dans la même mutation (STORY-976).
- **La sous-session de story ne rend pas la main pour attendre le verrou** (STORY-976) : un rapport « inachevé » a été
  rendu pendant l'attente de D, et la session de groupe a dû relancer. Attendre par moniteur borné, re-armé, sans
  rapport intermédiaire.

- **`grep -c $'\r$'` sous Git Bash rend 0 sur un fichier en CRLF** (STORY-1081 : dossier-service et BFF sont bien en
  CRLF dans le checkout, `core.autocrlf=true`) : compter les fins de ligne par Python (`data.count(b'\r\n')`). L'outil
  d'édition garde le CRLF ; un script de remplacement doit lire en binaire, normaliser en LF, vérifier le compte
  attendu de chaque motif, puis réécrire dans la fin de ligne d'origine.
- **dossier-service sous Node 25 : 7 suites rouges sur `origin/dev`** (6 binding de Confluent, dont le câblage du
  module racine ; `registre-pays.coherence`, qui lit les dépôts voisins) ; **9 si le paquet fiscal embarqué
  (`src/modules/portefeuille/echeance/assets/paquet-fiscal-togo-2026.json`) est sorti en CRLF** (empreinte fausse) :
  le supprimer puis `git -c core.autocrlf=false checkout -- src/modules/portefeuille/echeance/assets/`.
- **Le double Mongo de `dossiers.e2e-spec.ts` ne connaissait l'index du NIF qu'à la création** : 1081 l'a étendu à
  `findOneAndUpdate` (le dossier modifié exclu). Tout test d'écriture du NIF par la modification passe par lui.
- **Le filtre d'exceptions du BFF ajoute `requestId` à chaque corps d'erreur** : un test « au champ près » l'extrait
  avant le `toEqual`.
- **Pousser en force une branche de story est refusé par le poste** (classifieur du mode automatique, 18/11), même
  avant toute PR : relire le message de commit (chiffres des preuves) **avant** le premier `git push`. Un écart se dit
  dans la PR et la fiche.

- **`eslint --fix` retire une assertion `as T` qu'il juge inutile, et le type se resserre** (STORY-1084) : un
  `{ ...partiel, x: 0 } as Hypotheses` est devenu `{ ...partiel, x: 0 }`, puis TS2345. Écrire la variable avec son
  type (`const sans: Hypotheses = { ...h }; delete sans.champFacultatif;`) plutôt qu'une assertion.
- **`analyse.agnosticisme.spec.ts` rougit sous Windows** (STORY-1084, préexistant, dossier non touché) : il compare
  des chemins relatifs à `/` et le poste rend `dto\…`. À compter parmi les rouges connues de la suite complète de bilan
  sous Node 25 (15 suites ce jour : 13 binding, `dossier-scope.invariant`, `analyse.agnosticisme`).
- **Mutations de bilan : 28 en ~45 min** (une suite ciblée `-i` par mutation, ts-jest à froid ≈ 1,5 min) : les lancer
  en tâche de fond, et rien d'autre dans le dépôt pendant ce temps (les fichiers sont mutés en place).
- **Une coupure réseau (ENOTFOUND) a interrompu la session** pendant les mutations (18/11) : le script de mutations
  restaure chaque fichier dans un `finally` ; vérifier après reprise que `git diff --stat` est celui d'avant.

- **bilan-service, checkout du poste en retard** (STORY-1083) : `dev` local à `3f8e235`, 13 commits derrière
  `origin/dev`, `node_modules` du 15/11 (`ajv` 6, `kafkajs`) : partir d'`origin/dev` et `npm ci --ignore-scripts`.
- **bilan sous Node 25 : 16 suites rouges sur `origin/dev`** (binding de Confluent ; `dossier-scope.invariant`
  « segment `:dossierId` » qui cherche `\n` dans un décorateur sorti en CRLF). Témoin : `git worktree add --detach`
  d'`origin/dev` + jonction `mklink /J` vers `node_modules` ; **retirer la jonction par `rmdir` AVANT
  `git worktree remove`** (sinon la suppression récursive peut traverser la jonction). `export.service` et
  `homogeneisation.regles` rougissent sous la charge (délais) : les relancer seules.
- **`eslint --fix` retire les assertions de type qu'il juge inutiles** (`x as unknown as T` sur un double) puis
  signale l'import de type devenu inutile : relancer le lint après `--fix`.
- **Une mutation qui rend un symbole inutilisé ou un type plus étroit ne compile pas** (TS6133, TS2367, TS2345) :
  la réécrire (`ligne ?? { … }`, `MODULE.replace(…)`, `&& x.length < 0`). Le script de mutations le dit (« NE COMPILE
  PAS ») au lieu de la compter.
- **Python sous Windows : `print` d'une flèche « → » plante en cp1252** : `PYTHONIOENCODING=utf-8`.
- **L'invariant du plan d'effacement C13 de bilan** (928) rougit pour toute collection neuve à champ d'organisation :
  l'ajouter au plan (`plan-d-effacement.ts`) avec le bon champ ; `dossier-scope.invariant` compte les contrôleurs
  (29 / 25 nichés depuis 1083).

- **Auth : une mutation qui retire un code du catalogue ne compile plus dans les tests qui le nomment** (STORY-977) :
  `DroitDeTenant` et `TENANT_PERMISSION_LIBELLES` sont typés par le catalogue (TS2367 sur `d !== '<code>'`, TS7053
  sur l'index du libellé). Elle rougit aussi sur des assertions (résolution, catalogue de composition), mais par deux
  suites en « failed to run » : lire la ligne `Test Suites`, et compter la mutation pour ses assertions seulement.

- **Une donnée validée au chargement fait d'une mutation un échec de chargement** (STORY-973) : changer la règle des
  plans de journaux (`FORMES_DE_PLAN`) rend le plan livré invalide, et toute la suite tombe en « Test suite failed to
  run » au lieu de rougir sur une assertion. Muter la règle par ses refus (message, nature étrangère admise) ou la
  donnée par un champ que les tests lisent (version, code, libellé).
- **Quatre suites de la comptabilité sont rouges sous Node 25 sur `origin/dev`** (STORY-973) : `auth/gardes.spec` et
  `acces/etat-publie.spec` (binding de Confluent), `series-des-journaux.spec` et `module.manifest.spec` (« la copie EST
  la source » : comparées aux checkouts locaux de `prospera-plateforme` et `prospera-stories`, qui ne sont pas à
  l'étiquette). Témoin par `git stash` avant de conclure ; elles passent dans l'étage `verification` (Node 24, sans les
  checkouts).

- **Sous Node 25, le câblage du module racine rougit sans rien dire du câblage** (STORY-974) :
  `app-cablage.invariant.spec.ts` et les suites `src/kafka/*` tombent sur « Could not locate the bindings file »
  (binding natif de Confluent, absent sous Node 25). Sans Docker, les jouer avec une configuration jest qui double le
  module : `moduleNameMapper: { '^@confluentinc/kafka-javascript$': '<stub>.js' }` (le stub exporte
  `KafkaJS.Kafka`, une classe vide) et `rootDir` absolu ; `preview: true` n'instancie aucun fournisseur. Vérifier qu'il
  mord : retirer un import du module neuf ⇒ `Nest can't resolve dependencies`.
- **Une mutation qui laisse un import ou une variable inutilisés ne compile pas** (STORY-974) : ts-jest rend
  « 0 total » et le script la compte « survivante ». La réécrire pour qu'elle compile (`&& false`, `Date.now() < 0 ?
  … : undefined`, retirer aussi l'import).
- **Un heredoc de plus d'environ 200 lignes casse le shell** (« unexpected EOF ») avant même d'écrire : écrire le
  script (et le texte qu'il insère) avec l'outil d'écriture.
- **Une suite qui compare des `bigint` en jest parallèle tombe sans le dire** (STORY-970, comme 966) : le script de
  mutations a compté neuf fausses survivantes (« 24 passed, 24 total » au lieu de 44 : la suite mutée n'était plus
  comptée). Jouer les mutations en `-i`, et comparer le TOTAL des tests à celui de la suite saine.
- **Mutations du socle : sur une COPIE de l'archive**, jamais dans le dépôt (STORY-970). Copier l'export `git archive`,
  muter la copie, construire l'image de vérification (le `npm ci` reste en cache : quelques secondes), jouer la suite ;
  le dépôt reste libre pour les mutations unitaires qui tournent en même temps.
- **Une course qui ne s'entrelace pas ne prouve rien** (STORY-970) : dix lettrages lancés d'un coup avec une clôture
  passaient tous avant elle (la clôture, rejouée sur la tête de la chaîne, attend qu'ils aient fini : 10 / 0). Étalés
  de 60 ms, 1 passe avant le sceau et 9 sont refusés. Écrire dans le test (`console.log`) combien de chaque côté.
- **dossier-service : un seul exercice OUVERT par dossier (Q8)** : la clôture comptable de N vient après le `clore`
  de N et l'ouverture de N+1 chez lui ; un test qui veut prouver le sceau seul pose N OUVERT chez la doublure
  (« rouvert par le TENANT_ADMIN »), sinon le refus vient de dossier-service (`details.statut: CLOS`).
- **`DELETE …/ecritures/{id}` rend 204**, pas 200 (STORY-964).
- **Un script Python lancé en tâche de fond écrit sa sortie par blocs** : le journal reste vide jusqu'à la fin. `-u`.

- **Un `open(p, 'w')` de Python sous Windows écrit des CRLF** (STORY-969) : un fichier LF réécrit ainsi change toutes
  ses fins de ligne (`git diff --stat` le montre). Toujours `open(p, 'w', encoding='utf-8', newline='')`. Le worktree
  `_wt-b-stories` est en `core.autocrlf=true` : ses fichiers sont en CRLF sur le disque ; une édition par script garde
  le CRLF (le commit le normalise).
- **Une erreur de type dans un module importé par `await import()` dans un `beforeAll` fait rougir TOUS les tests
  sans aucun message** (STORY-969) : une mutation qui ne compile pas (`TS6133`, `TS2339`) passe pour « rouge (26) ».
  Le script de mutations du socle lance d'abord `tsc --noEmit`.
- **Les suites du socle partagent une base** (STORY-969) : un `countDocuments({ journal: 'OD' })` sans filtre compte
  les écritures des autres suites (1 attendu, 12 lus). Filtrer par organisation ou exercice.
- **`subprocess.run(['bash', …])` lance le bash de WSL** sous Windows, pas Git Bash : nommer le chemin complet de
  Git Bash (`C:/Program Files/Git/usr/bin/bash.exe`). Un heredoc qui contient `\u` casse un script Python : l'écrire
  avec l'outil d'écriture.
- **La normalisation d'une référence ne retire que les espaces** : `fa-001` = `FA-001`, mais `fa 001` = `FA001` ≠
  `FA-001` (STORY-969, le jeu de la preuve l'a appris).

- **Une promesse rejetée qu'on n'attend pas encore fait tomber jest sous Node 25** (STORY-972) : un test qui crée trois
  appels d'un coup (`for (const p of [a(), b(), c()]) await refus(p)`) laisse un rejet sans gestionnaire pendant
  l'attente du premier ; le processus sort (« Node.js v25 », pas de ligne `Tests:`) et le script de mutations compte
  la mutation comme survivante. Lancer chaque appel à son tour (`for (const appel of [() => a(), …])`).
- **L'étage `verification` ne copie que ce qu'il nomme** (STORY-972) : un spec qui lit un fichier racine neuf
  (`.env.essai.example`) passe sur le poste et rougit dans l'image. L'ajouter au `COPY` de l'étage, et au
  `.dockerignore`/`.gitignore` s'ils excluent `.env.*` (ils l'excluaient : le fichier n'était même pas suivi).
- **Une base neuve du catalogue n'a aucun référentiel** (STORY-972) : un module normatif (la comptabilité) refuse son
  PUT (`REFERENTIEL_REQUIRED`, puis 422 « référentiel inexistant ») tant que l'opérateur n'a pas enregistré une version
  (`POST /catalog/admin/referentiels`, `checksum: "sha256:<64 hexa>"`).
- **`kafka-console-consumer` lancé par `subprocess(shell=True)` sous Windows** : `cmd.exe` garde les guillemets de
  `key.separator="|"` ; lire avec le séparateur par défaut (tabulation).

- **Jest résout `./x` vers `x.json` avant `x.ts`** (`moduleFileExtensions: js, json, ts`) : un fichier de données
  nommé comme un module TS du même dossier (`comptes-collectifs.json` à côté de `comptes-collectifs.ts`) remplace le
  module sous jest (« … is not a function »), alors que `tsc` et Nest le lisent bien. Nommer les données autrement
  (`collectifs-declares.json`) (STORY-968).
- **Le contrôleur des écritures recopie les lignes champ par champ** : un champ ajouté au DTO (`tiersId`,
  `echeance`) disparaît sans erreur s'il n'est pas recopié aussi. Les tests unitaires du service ne le voient pas ;
  seul `test:socle` (HTTP réel) l'a vu (STORY-968).
- **Mutations sous ts-jest** : un `return;` posé avant un `throw` rougit par compilation (TS7027,
  `allowUnreachableCode` à faux) ; `if (objet) return` rétrécit l'objet en `never` pour la suite. Muter par une
  condition qui ne rétrécit rien (`if (ligne > 0) return;`) ; un paramètre devenu inutile rougit aussi (`delai * 0`)
  (STORY-968).
- **Une ligne de collectif sans tiers est refusée depuis 968** : toute suite, script de preuve ou jeu qui saisit sur
  401, 409, 411, 416, 419, 421, 422 (SN, SMT) doit d'abord créer un tiers (`POST /dossiers/{d}/tiers`, droit
  `comptabilite:tiers:administrer`) et le citer. Le socle a `poserLesTiers` et `avecTiers` (`test/socle/outils.ts`).

- **Le hub de balance juge le dossier sur son read-model** (STORY-967) : une balance publiée deux secondes après la
  création du dossier a été rejetée `DOSSIER_INCONNU` par le vrai balance-service (fait `dossier.*` pas encore
  projeté). La comptabilité l'a dit (`REJETEE`) et la republication a pris la version suivante. Une preuve sur pile
  attend que `balance_service.dossiers_dossier` connaisse le dossier avant de publier.
- **`mongosh` lu par l'entrée standard préfixe sa sortie de l'invite** (`rs0 [direct: primary] base> […]`) : un
  script de preuve qui ne garde que les lignes commençant par `[` ou `{` ne lit rien. Couper avant `> `.
- **La porte HTTP de balance-service** (`GET …/balances`) rend 403 `BALANCE_NOT_ENTITLED` même quand le droit
  `balance` ACTIVE est posé sur `entitlement.changed` : elle lit son droit ailleurs que le read-model de l'ingestion.
  Pour prouver une ingestion, lire `balance_service.balances` et `balance_ingestions` (STORY-967).
- **Une mutation qui retire une condition de filtre peut retomber dans la branche suivante** (STORY-967 : un topic
  non filtré retombait dans la lecture de `balance.created`, et un rejet sur un autre topic restait ignoré). Le test
  qui la tue envoie un message bien formé pour la branche où l'on retombe.
- **Une transaction perdante échoue à l'index unique AVANT l'écriture de l'outbox** (STORY-967) : « aucun fait laissé
  par une perdante » ne prouve pas que l'outbox est dans la transaction. Seule une panne injectée après elle le
  prouverait (mutation survivante nommée dans la fiche).

- **Preuve de la comptabilité en réel, par dossier-service** (STORY-971) : (1) dossier-service exige le KYC approuvé
  de l'organisation (`KYC_NOT_APPROVED`) : sans kyc-service, poser `kyc.status.changed` (`orgId`, `status:
  APPROVED`, `occurredAt`, `eventId`, `schemaVersion: 1`) sur le fil ; (2) une SARL exige un dirigeant
  (`DIRIGEANT_REQUIS`) ; (3) ouvrir l'exercice AVANT de décider les axes (`AUCUN_EXERCICE_OUVERT`), sinon la
  comptabilité rend 409 `REFERENTIEL_NON_DECIDE` ; (4) le module `comptabilite` n'est pas au catalogue : poser
  l'état publié `EN_SERVICE` sur `etat-publie.changed.reel` (clé = organisation). Détail :
  `stories/STORY-971.md`, § Preuves.
- **Le dirigeant ne s'attribue pas un rôle plus large que le sien** (`TENANT_ROLE_AUTO_ESCALADE`), et l'opérateur
  n'attribue pas `DIST_DG` (`VALIDATION_DE_REPRISE_RESERVEE_AU_DG`) : pour un jeton `DIST_DG`, le fondateur invite un
  membre et le lui attribue (STORY-971).
- **La connexion est limitée en débit** (429 `ThrottlerException`) : un script de preuve qui ouvre plus de cinq ou
  six sessions par minute doit attendre et rejouer. Une surcharge vide (`ajouts: [], retraits: []`) rend 400 : on ne
  « remet pas à zéro » une surcharge par un `PUT` vide (STORY-971).
- **Le heredoc a encore mangé un antislash** (`\n` d'un script Python de preuve, devenu une vraie fin de ligne,
  STORY-971) : écrire `chr(10)`, ou passer par l'outil d'écriture ou d'édition.

- **Jest à plusieurs workers ne sait pas sérialiser un `BigInt`** (STORY-966). Un `expect(...).toEqual` qui échoue
  sur des `bigint` fait tomber TOUTE la suite (« Do not know how to serialize a BigInt », `messageParent`) : la sortie
  n'a plus de ligne `Tests: … failed`, et un script de mutations compte la mutation comme survivante. Cinq fausses
  survivantes à 966. Jouer les mutations d'une suite à `bigint` en `--runInBand` (`-i`).
- **`sed` remplace `\n` par une vraie fin de ligne** dans un script de mutations, et casse la chaîne Python (STORY-966,
  comme le heredoc de 963). Corriger un script par un autre script écrit avec l'outil d'écriture, avec une constante
  `NL`.
- **Un `$sum` MongoDB de doubles perd l'unité au-delà de 2^53** : sommer des montants par `{ $toDecimal: { $toLong:
  champ } }` (exact), puis lire le `Decimal128` en `bigint` par son écriture décimale (STORY-966). Un `$toDecimal`
  appliqué directement à un double rend des zéros de fraction (« 1.00000000000000 ») : passer par `$toLong` d'abord.
- **Lecture cohérente de plusieurs requêtes** : `connexion.startSession({ snapshot: true })` (MongoDB ≥ 5.0, jeu de
  répliques), puis `.session(s)` sur chaque `find`, `distinct`, `countDocuments` et `aggregate`. Pas de transaction.
  La course de 966 (20 validations, 30 lectures) rougit sans l'instantané (STORY-966, mutation S9).

- **Un `afterAll` qui lève laisse la connexion MongoDB ouverte, et jest ne rend jamais la main** (STORY-965) : la
  conformité a tourné plus d'une heure, sans sortie (le `grep` de la commande retenait tout). La cause : un
  `deleteMany` sur `encaissements`, collection en ajout seul (`EcritureAppendOnlyInterdite`). Ne nettoyer que les
  collections modifiables ; lancer la conformité avec `timeout 280 … --forceExit`, sans filtrer la sortie avant la fin.
- **Karapace 6.2 accepte qu'une valeur sorte d'une énumération** (BACKWARD) : le registre ne garde pas ce cas, un
  test unitaire qui compare les énumérations du schéma à celles du code le fait (STORY-965).
- **Paiement : une `cause` ou un nom neuf ne doit pas reprendre un code d'acte** (`ENCAISSEMENT_DECLARE`,
  `_VALIDE`, `_ANNULE`) : la garde de la séparation des pouvoirs les réserve à un seul fichier (STORY-965).
- **Paiement : ajouter une dépendance à `AffecterLEncaissement` fait rougir son compte de dépendances**, et la forme
  `publier: (p) => faitsDAnnulation(p)` est lue par la garde STORY-275 : les ajuster en le disant (STORY-965).
- **Script Python qui remplace en masse dans les fichiers modifiés** : il touche aussi les occurrences
  PRÉEXISTANTES des specs (des codes d'acte renommés à tort). Restreindre aux fichiers neufs, ou comparer au blob
  `HEAD` avant d'écrire (STORY-965).
- **`node scripts/…mjs` sous Node 25 sur Windows** finit parfois par `Assertion failed: !(handle->flags &
  UV_HANDLE_CLOSING)` après un `fetch` : le travail est fait, mais le code de sortie ne vaut rien. Rejouer le
  script sous Node 24 (image `verification`) pour la preuve (STORY-965).
- **La recette `recette-uj1` réécrit `docs/recette-uj1-mesures.md`** quand on joue les e2e : `git checkout --` du
  fichier avant de commiter (STORY-965).

- **Une boucle d'attente du verrou Docker lancée en arrière-plan survit au délai de l'outil** (STORY-964). Une boucle
  `until ( set -o noclobber; … ) ; do sleep 15; done` lancée par `run_in_background` avec un délai de 10 min a continué
  après ce délai et a pris le verrou une heure plus tard, alors qu'une seconde boucle (un moniteur) tournait aussi.
  Ne lancer qu'UNE boucle d'attente, de préférence comme moniteur (tué à son expiration), et **arrêter toute boucle
  avant de rendre le verrou** : sinon elle le reprend dès que le fichier disparaît.
- **Une mutation `cond && false` rougit par compilation quand `cond` rétrécit un type utilisé dans le bloc**
  (`if (e.contrePasse && false)` puis `e.contrePasse.numero` : TS2339 sur `never`) ou laisse une variable sans usage
  (`noUnusedLocals`). Muter avec une condition fausse qui garde le type et l'usage (`&& e.dateEcriture === '§'`,
  `|| (x !== y && rang < 0)`), ou annuler l'effet (`lignesInverses(l).map(inverser)`) (STORY-964, quatre mutations).
- **Un index unique non partiel sur un champ devenu facultatif** fait collisionner les documents qui ne l'ont pas
  (`null` en double). Le rendre partiel (`partialFilterExpression: { champ: { $exists: true } }`) impose un nom neuf :
  Mongoose ne remplace pas un index de même nom aux options différentes (STORY-964, `_v2`).
- **`consigner` exige désormais une transaction** (STORY-964) : une suite ou un code qui consigne sans session lève
  `PisteHorsTransaction`.

- **Paiement : une écriture d'argent neuve doit entrer dans l'inventaire FERMÉ** de `piste-opposable.invariant.spec.ts`
  (`ECRITURES_DARGENT`) : tout fichier qui appelle `this.ecriture.executer` y est listé par son nom (STORY-963).
- **Paiement : `EcritureDArgent` ne reprend rien, et c'est voulu** ; un cas d'usage idempotent par sa clef peut
  reprendre `ECRITURE_CONCURRENTE` lui-même, aussitôt et en nombre borné (AD-12 interdit la minuterie). Mesuré sur
  `rs-paiement` : 20 ouvertures concurrentes de la même clef, trois essais suffisent, aucun 409 ne sort (STORY-963).
- **Paiement : un rejeu qui passe par `EcritureDArgent` consigne une trace même quand rien ne naît** (la trace est
  obligatoire). Pour qu'un rejeu n'écrive rien, lever une erreur sentinelle dans `ecrire` quand l'upsert n'a rien
  inséré : la transaction est abandonnée, on rend la Créance existante (`RejeuSansEffet`, STORY-963).
- **La clef primaire d'une créance est insensible à la casse** (`normaliserReferenceExterne` met en majuscules) :
  deux identifiants qui ne diffèrent que par la casse visent la même clef. Comparer l'identifiant relu à la lettre
  (STORY-963, `CREANCE_SOURCE_EN_CONFLIT`).
- **Script de mutations : ne jamais écrire `\n` dans une chaîne Python par un heredoc qui l'injecte dans un autre
  script** ; la chaîne se casse en vraie fin de ligne. Écrire le script avec l'outil d'écriture et bâtir les motifs
  multilignes avec une constante `NL` (STORY-963).

- **Une variable d'environnement requise de plus fait tomber TOUTE la suite `test:socle`** (STORY-962). `AppModule`
  valide l'environnement à son import ; les suites jouent `--runInBand` et chacune pose son environnement dans son
  `beforeAll`. Une suite qui ne pose pas la variable neuve fait sortir le processus (`process.exit called with "1"`),
  et les suites suivantes ne se jouent pas. Quand on ajoute une variable requise, la poser dans **chaque** suite du
  socle (`test/socle/*.socle-spec.ts`), même avec une adresse factice.
- **Docker Desktop s'est arrêté pendant la story** (17/11, poste B/D) : la session de groupe l'a relancé. Avant de
  lever une pile, vérifier que `docker ps` répond.

- **`series-v1` ne garantit pas l'absence de TROU** (STORY-961) : elle rend des numéros consécutifs et jamais
  réémis, mais un numéro émis par un acte qui échoue ensuite reste consommé. Pour un journal légal, passer la session
  de l'acte au dépôt (`depotMongo(collection, { session })`) : l'incrément est alors annulé avec l'acte, et
  `withTransaction` rejoue la transaction perdante d'une course (erreur transitoire). Prouvé à 50 actes concurrents,
  dont 10 abandonnés : 1 → 40 ; sans la session, la suite rougit.
- **Amorcer les séries avant la première pièce** (STORY-961) : deux premières émissions concurrentes dans une
  transaction se disputeraient l'upsert du document de la série. La comptabilité les amorce à 0 quand elle arrête le
  plan (`Series.amorcer(serie, 0)`).
- **Mutation qui ôte un garde de type** (`!chaines(x)` → `!chaines([])`) : `x` n'est plus rétréci, et la mutation
  rougit par compilation. La réécrire en gardant le rétrécissement (`!chaines(x) && !Array.isArray(x)`).

- **Deux familles de droits de tenant depuis STORY-960** : le jeton (`perms[]`) ne porte que les 24 codes de
  `TenantPermission` ; tout droit neuf est hors du jeton, servi par `/moi/droits` dans `droitsHorsJeton`. Une garde
  qui ne lit que `droits` (comptabilité, D-959-4) ne verra jamais un droit neuf : lire `droits ∪ droitsHorsJeton`.
  Même chose pour les droits neufs de `paiement` (`paiement:creance:consulter`, `:credit-tiers:imputer`, B-963/965).
- **L'inscription publique exige `vertical` et refuse `distributeur`** (`VERTICAL_FERME_A_L_INSCRIPTION`) : pour une
  preuve, s'inscrire `cabinet`, puis `PATCH /api/v1/admin/organizations/{id}/vertical` par l'opérateur. Les jetons de
  vérification et d'invitation se lisent dans les tâches BullMQ (`bull:auth-notification:*`, champ `data`) de Redis.
- **Cinq suites e2e d'auth ne compilaient plus depuis STORY-942** (`TenantRolesService` absent du module de test) :
  réparées par 960. `health.e2e` exige une vraie pile ; `auth-register.e2e` rend 500 sur `dev` aussi (à reprendre).
- **Un heredoc de plus de 90 lignes avec des apostrophes typographiques a échoué** (« unexpected EOF ») : écrire les
  scripts avec l'outil d'écriture, toujours.

- **Une mutation qui casse un rétrécissement de type rougit par compilation** (STORY-959). Exemples :
  `if (deja && false) return f(deja)` (`deja` redevient `T | null`) ; un garde de type qui n'est plus appelé
  (`noUnusedLocals`). Muter en gardant le rétrécissement (`deja && deja.tenue === 'JAMAIS'`), ou muter le corps du
  garde plutôt que son appel. Le script de mutations doit exiger `Tests: … failed` ET l'absence de `TS\d{4}`.
- **Le manifeste de `_wt-b-stories` sort en CRLF** (`core.autocrlf=true` dans le worktree). Un script qui le
  remplace doit normaliser les fins de ligne avant de chercher. La copie dans le service se fait depuis le blob de
  `main`, après la fusion de l'annonce : `git -c core.autocrlf=false show origin/main:manifestes/… > src/module.manifest.ts`.
- **`cat > fichier` sans heredoc attend l'entrée standard** : la commande ne rend jamais la main (STORY-959, un appel
  perdu). Écrire les scripts avec l'outil d'écriture.

- **`prettier --write "src/**/*.ts"` reformate aussi `src/vendor/`** (STORY-958) : la copie épinglée de la garde
  partagée a changé d'empreinte (`01f9e769…` au lieu de `a830c449…`). Seul le test d'empreinte l'a vu, sous Node 24
  (sur le poste en Node 25, la suite qui le porte ne charge pas, à cause du binding natif). `src/vendor/` va dans
  `.prettierignore` de tout service qui en a un ; ne jamais formater tout `src/`.
- **Un `AppModule` avec `ConfigModule.forRoot({ validate })` valide l'environnement dès son IMPORT** : un spec qui
  l'importe en tête plante le worker jest (« child process exceptions »). Le charger par `require` après avoir posé un
  environnement complet (STORY-958, `gardes.spec.ts`).
- **Les ports de développement 3410 → 3419 sont pris** (STORY-958) : 3410 → 3416 et 3419 par les services de C et de D,
  3417 par `prospera-ia-service`, 3418 par `prospera-ia-centrale` (spine de l'IA commune). Un port proposé par un plan
  se vérifie aussi dans les spines et les manifestes, pas seulement dans les compose.
- **Mutations sous ts-jest** : une mutation qui retire le dernier usage d'un import, ou compare deux littéraux sans
  recouvrement, rougit par compilation (`noUnusedLocals`, TS2367). Muter en gardant l'usage (`&& false`, `as string`,
  `return` avant le `throw`) pour rougir sur l'assertion (STORY-958).

- **Client de Confluent : fermer un client admin est SYNCHRONE** (destruction librdkafka) : de 0,45 à 3,8 s, Kafka
  arrêté, et la boucle d'événements est bloquée pendant ce temps (STORY-957). Un contrôle de santé qui crée et ferme
  un client à chaque appel dépasse donc sa propre borne. Garder un client, et ne fermer qu'hors du chemin d'une
  réponse.
- **Une borne ou une minuterie neuve fait rougir les gardes de minuteries** : AC-5 de notification
  (`aucune-minuterie.spec.ts`) et AD-12 de paiement (`ecriture-argent.invariant.spec.ts`). Il faut une exception
  nommée, avec son motif (STORY-957, D-957-7). Une garde qui lit la source d'un fichier (STORY-940 au catalogue)
  suit le code quand on le met en commun.
- **Mutation interrompue = fichier muté laissé** : arrêter un script de mutations en cours laisse le fichier source
  muté (vu sur paiement : borne à 4 s). Après tout arrêt, `git status`, puis `git checkout -- src/` si tout est
  commité.
- **`node_modules` du poste périmés** (paiement sans le client de Confluent, catalogue sans BullMQ) : les specs
  rougissent par compilation. `npm ci --ignore-scripts` les remet à niveau (Node 25).
- **Un heredoc de plus de 180 lignes n'écrit rien, et il mange les antislashs** (`\n` dans un script Python) :
  écrire ces fichiers avec l'outil d'écriture (STORY-957, deux fois).
- **`python -I` ignore `PYTHONIOENCODING`** : un script qui affiche des emojis sous Windows doit appeler
  `sys.stdout.reconfigure(encoding='utf-8')`.

- **Verrou Docker : une prise en deux temps est une course** (STORY-956, 17/11).
  - Ce qui s'est passé : B a lu « pas de verrou », puis a lancé dans le même message la prise du verrou et le `up` de
    sa pile. D avait pris le verrou entre-temps : `grp-b` a tourné environ une minute à côté de `grp-d-1045-verif`,
    puis B l'a descendue avec ses volumes.
  - La règle : prendre le verrou **atomiquement**, avec `( set -o noclobber; echo "B STORY-<n> <heure>" >
    .verrou-docker )`, qui échoue si le fichier existe. N'enchaîner le `up` qu'après le succès de cette commande,
    jamais dans un appel parallèle.
  - Pour attendre le verrou :
    `until ( set -o noclobber; echo … > .verrou-docker ) 2>/dev/null; do sleep 10; done`.
- **Un script Python nommé comme un module standard** (`types.py` dans le dossier de travail) est importé à sa place
  par `yaml`, `re`, `enum`… et s'exécute. Nommer les scripts sans risque de collision, et lancer `python -I`.
- **`kit-cible`, preuve sous Node 24 sans Dockerfile** : export
  `git -c core.autocrlf=false archive --format=tar HEAD`, puis un conteneur `node:24-slim` nommé dans le réseau de la
  pile (`docker create`, `docker cp`, `docker start`, `docker wait`, `docker logs`). `docker cp` vers un dossier absent
  échoue : copier le dossier entier.

- **`structuredClone` sous jest rend un `Date` d'un autre royaume** : `instanceof Date` le refuse. Un faux modèle
  Mongoose qui compare des dates doit tester `Object.prototype.toString.call(v) === '[object Date]'`, sinon un test de
  bail ou d'échéance passe pour une mauvaise raison (STORY-953).
- **La clé `centrale-test-2026` des vecteurs expire le 01/01/2027** : une preuve qui avance l'horloge au-delà (essai à
  J+60) doit certifier sa propre clé de test par `racine-test-2026` (`certifier`), sans la versionner (STORY-953).

- **DNS de la VM Docker en panne** (STORY-949, 16/11) : `lookup auth.docker.io: no such host`, alors que npm répondait.
  La ligne `# syntax=docker/dockerfile:1` fait télécharger le frontal à **chaque** construction. Pour une preuve,
  construire depuis l'export `git archive` avec cette ligne retirée (le dépôt n'est pas modifié), si les images de
  base sont locales.
- **`docker run --rm` long et client détaché** (« error waiting for container: unexpected EOF ») : le conteneur
  continue, mais `--rm` l'efface avant qu'on lise ses journaux. Pour une suite longue : `docker run -d --name …`, puis
  `docker wait` et `docker logs`.

- **Deux suites jest sous Node 24 en même temps saturent la VM Docker de ce poste** (8 Go ; catalogue et notification
  ensemble ≈ 6,5 Go). Le démon a répondu `EOF`, puis 500, et une construction d'image est tombée. Une suite à la fois.
  Lancer le conteneur **nommé, sans `--rm`**, puis `docker wait` et `docker logs` : un `--rm` perd le journal si le
  client se déconnecte, et un `npm test | tail` dans `sh -c` masque le code de retour (STORY-952).

- **La borne du jeton bloque les droits de la Reprise** (STORY-948) : `borne-du-jeton.spec.ts` exige que les deux
  catalogues tiennent dans un jeton (17 + 24 = 41 ≤ 44). Les six `reprise:*` le feraient passer à 47 : ils attendent
  STORY-949 (droits hors du jeton). Tout droit de tenant nouveau bute sur la même borne d'ici là.
- **`npm ci` sur le poste en Node 25** échoue sur les bindings natifs (`@confluentinc/kafka-javascript`, `bcrypt`).
  `npm ci --ignore-scripts` suffit pour `tsc`, le lint et les tests unitaires qui ne les chargent pas ; le reste se
  joue dans l'étage `verification` (Node 24).

- **`minio/minio` n'est plus servi** par Docker Hub (« pull access denied »), ni `quay.io/minio/minio` sans
  authentification (401) : une pile neuve du compose racine ne lève plus `minio` sur ce poste. Pour la preuve
  d'auth (STORY-942), une surcouche locale non versionnée a retiré la dépendance (`depends_on: !override`, pas
  `!reset`, qui vide tout). **Pour A** (`prospera-recette`) : choisir une image MinIO disponible avant la
  prochaine recette à froid.
- **Karapace 6.2 accepte qu'un champ facultatif existant devienne requis** (BACKWARD) : le registre ne garde pas ce
  cas, un test unitaire qui confronte un événement sans ce champ au schéma le fait (STORY-942).
- **auth-service, étage `verification`** : `sm-1.invariant.spec.ts` parcourt `test/` et lit `.env.example` ; le
  `.dockerignore` excluait `test/` (STORY-942).

- **Client de Confluent : `producer.connect()` vers un broker absent ne rejette pas vite.** L'attendre dans
  `onModuleInit` retient tout l'amorçage de Nest (107 s mesurées sur notification, Kafka arrêté). Ne jamais l'attendre
  à l'amorçage : `void this.ensureConnected().catch(…)` (STORY-950, corrigé dans notification, catalogue, paiement).
  **Même risque** chez tout service migré (C : sinistres, assurance, document-service).
- **Aucune image MinIO tirable sur le second poste** (`minio/minio` : « pull access denied » ; `quay.io` : 401). La
  pile de B y remplace MinIO par un bouche-trou ; une recette qui dépose un artefact de référentiel n'y tournera pas.
- **Supprimer un topic abonné efface les offsets du groupe** : après recréation, le client repart du début
  (`Offset out of range` ⇒ `BEGINNING`) et consomme, mais `kafka-consumer-groups` montre un offset commité vide. Pour
  chronométrer, lire la projection en base plutôt que l'offset (STORY-950).
- **L'étage `verification` révèle des gardes déjà rouges sur `dev`** (notification : l'inventaire AD-12 depuis
  MNV-607) : avant cet étage, la suite n'était jouée sur aucune image.

- **Client de Confluent, supervision** : ni `CRASH` ni `GROUP_JOIN`. Un message dont le traitement lève une erreur est
  RELIVRÉ, et le blocage se compte sur ses échecs consécutifs (STORY-937, paiement).
- **Paiement, invariants qui mordent à juste titre** : la garde ne lit aucune configuration (STORY-606) ; aucun
  identifiant ne contient « change » (STORY-284) ; seul le service des demandes écrit `$set: { etat }` (STORY-260).
- **Paiement, routes `@SurfacePlateforme()`** : elles rendent 404 à un client AVANT la garde des droits (STORY-728).
  Pour éprouver la garde du module, prendre une route sans surface plateforme (`GET /api/v1/creances`).
- **`.dockerignore` de paiement excluait `test/`** : l'étage `verification` en a besoin (`test/utils`).

- **BullMQ 6 refuse un identifiant de tâche qui contient `:`** (`Custom Id cannot contain :`) : la clef d'AD-6 en porte
  (et la date ISO aussi). Identifiant = clef avec `|` ; la clef d'origine reste dans les données (STORY-933).
- **BullMQ 6 n'a plus `queue.client` ni `ping`** : passer par l'API de la file (`getJobCounts`) pour une santé Redis.
- **Le `docker-compose.yml` racine n'est pas versionné** : une dépendance de service (ex. `depends_on: redis`) se pose
  dans `prospera-recette/docker-compose.recette.yml`. Pour démarrer l'image d'une branche dans la pile :
  `docker build --target runtime -t grp-b-platform-catalog-service .` depuis le worktree, puis `up --no-build`.
- **Un heredoc mange les antislashs d'un JSON** (`"^.+\\.(t|j)s$"`) : écrire les configurations par un script
  Python ou par l'outil d'écriture.

- **Le client de Confluent est un binding natif** (librdkafka) : ses tests se jouent sous Node 24, dans le stage
  `verification` du Dockerfile (`docker build --target verification`), pas sur le poste en Node 25.
- **Un consommateur abonné à un topic absent** ne le découvre qu'à la relecture des métadonnées (≈ 5 min), comme avec
  `kafkajs`. Sur une pile neuve, un premier message peut donc attendre quelques minutes ; il n'est pas perdu.
- **`.dockerignore` du catalogue exclut `test/`** : `test:schemas` se joue depuis le poste
  (`SCHEMA_REGISTRY_URL=http://127.0.0.1:8081 npx jest --config ./test/jest-schemas.json`), les scripts `schemas:*`
  depuis l'image (`--network grp-b_default -e SCHEMA_REGISTRY_URL=http://karapace:8081`).
- **`RECETTE_SURCOUCHES` sous Git Bash** : MSYS réécrit une liste de chemins séparés par `;` en liste POSIX à `:`,
  et la recette cherche une surcouche nommée `C`. Lancer la recette depuis PowerShell (STORY-940).
- **Une pile de recette publie des ports fixes** (3001 → 3010, 27017, 6379, 9000) : deux sessions ne peuvent pas
  avoir chacune la sienne en même temps. Regarder `docker ps` avant de lever (STORY-940, `grp-c-recette`).
- **Une signature base64url altérée sur ses DERNIERS caractères reste valide** : ils portent des bits de bourrage
  qu'un décodeur ignore. Un vecteur de signature altérée change un caractère du milieu (STORY-931).
- **Lint sur ce poste** : les fichiers suivis sortent en CRLF (`autocrlf`) ; ne linter que les fichiers touchés, avec
  `--rule '{"prettier/prettier":["error",{"endOfLine":"auto"}]}'`.
