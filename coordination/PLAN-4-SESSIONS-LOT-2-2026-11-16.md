# Quatre sessions, lot 2 : 15 stories backend par groupe

> **Date :** 2026-11-16 (S2 du plan maître) · **Statut :** décidé par l'utilisateur (« refais chaque groupe avec 15
> stories ; pour le groupe D, pas de frontend d'abord, juste du backend »), en vigueur dès la fusion de ce document.
> **Remplace**, pour la suite, les lots du §3 → §6 de `PLAN-4-SESSIONS-2026-11-14.md` (tous terminés, sauf STORY-989
> de C et FE-069 de A). **Tout le reste de ce plan-là reste en vigueur** : le rituel du §0, les journaux du §9, les
> règles communes du §8 et `REGLES-DES-GROUPES.md`, sauf la règle « D ne corrige jamais un backend » (§5 des règles),
> **suspendue pour ce lot** : D tient désormais des dépôts backend.
> **Cadre :** `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (chemins critiques §2, semaines §3) et
> `amendement-plan-fevrier-2026-11-14.md` : le cabinet d'abord, puis le distributeur et l'assurance, l'IMF en dernier.
> **Rédigé par** la session du groupe C, sur consigne de l'utilisateur, à partir des journaux des quatre groupes, des
> épics et de l'état réel des dépôts (relevé le 16/11).

---

## 0. Ce qui ne change pas

- Le **rituel** avant chaque story (§0 du plan du 14/11) : relire ce plan et les demandes des autres journaux, écrire la
  fiche juste avant de coder, prouver (tests, lint, build, `docker compose up`, recette sur images reconstruites depuis
  `dev`), pousser, PR, **« Rebase and merge » par le groupe lui-même**, vérifier le SHA de tête, PR de docs, story
  suivante.
- **Backend seulement** pour les quatre groupes. Les écrans viendront avec la coque `prospera-app` (EPIC-265) et un lot
  frontend ultérieur. FE-069, déjà entamée par A, est **hors de ce lot** (§2).
- **Un dépôt = un groupe** (§1). Une demande à un autre groupe passe par son journal.
- Les piles Docker sont préfixées par le groupe (`grp-a`, `grp-b`, `grp-c`, `grp-d`), ne publient que le port du
  service, et descendent **avec leurs volumes** à la fin de chaque story.

## 1. Qui tient quel dépôt (lot 2)

| Dépôt | Groupe | Changement par rapport au 14/11 |
|---|---|---|
| `prospera-fiscal-service`, `prospera-balance-service`, `prospera-bilan-service`, `prospera-dossier-service`, `prospera-kyc-service`, `prospera-admin-panel-service`, `prospera-recette`, `prospera-frontend-expert-comptable` (FE-069 en attente) | **A** | — |
| `prospera-platform-catalog-service`, `prospera-paiement-service`, `prospera-notification-service`, `prospera-auth-service`, `prospera-plateforme` (sauf les dossiers ci-dessous), **neufs** `agent-instance`, `centrale-service` | **B** | dépôts neufs de l'agent et de la centrale |
| `prospera-assurance-service`, `prospera-ocr-service` (`document-service`), `prospera-sinistres-service`, `prospera-liaison-assureur-service`, `prospera-assureur-fictif` ; dans `prospera-plateforme` : `contrats/assurance/`, `champs-sensibles/`, `classification-sante/` | **C** | — |
| `reseau-service` (existe, **vide**), **neufs** `prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`, `prospera-pilotage-service`, `prospera-croissance-service` ; dans `prospera-plateforme` : `series/`, `vocabulaires/`, `contrats/distributeur/` | **D** | **D passe au backend** |
| `frontend-admin-panel` (console), `prototypes/` | personne pendant ce lot | D n'y écrit pas pendant le lot 2 |

**Décisions de partage (retenues par défaut, contestables) :**

- **D-L2-1 — EPIC-159 (le cabinet sur le moteur) passe de B à A** : il ne touche que des dépôts de A (balance, bilan,
  fiscal, dossier). B a livré ce dont il a besoin (contrat figé 932, route 936, garde 937).
- **D-L2-2 — EPIC-144 se coupe en deux** : B retire les chemins d'octroi dans le catalogue et paiement (B-949) ; A
  réécrit les recettes croisées dans `prospera-recette` (A-917). **Les deux PR se fusionnent ensemble**, annoncées dans
  la section « ⚠ Contrats » de B avant la fusion. Le `PUT /catalog/entitlements/...` que la console appelle **reste
  servi** tant que la console n'a pas migré, mais il passe par le plan d'installation : aucun `ACTIVE` n'est posé hors
  du moteur.
- **D-L2-3 — `prospera-plateforme` gagne trois dossiers de D** (`series/`, `vocabulaires/`, `contrats/distributeur/`).
  B l'écrit dans le README à sa première story (B-941). La suite de conformité du réseau vit dans `reseau-service`,
  publiée comme paquet, pas dans la plateforme.
- **D-L2-4 — `reseau-service` garde son nom** (le dépôt GitHub existe, sans préfixe `prospera-`) ; les dépôts neufs du
  distributeur prennent le préfixe, comme dans la spine du distributeur.
- **D-L2-5 — Dev A (arrivée le 07/12)** reprend ce que D aura laissé du distributeur : D écrit sa passation dans son
  journal **avant le 04/12**. La plage de Dev A (STORY-730 → 899) n'est pas touchée.

## 2. Groupe A : le cabinet sur le socle, puis sur le moteur

Plage : **STORY-905 → STORY-929** (905 déjà nommée). Chemin du plan maître : EPIC-155 dans les dépôts du cabinet (S5)
→ EPIC-144 → **EPIC-159** (S6-S7, en premier) → clôture.

| # | Story | Source | Dépôts | Dépend de | Fini quand | État |
|:--:|---|---|---|---|---|---|
| 1 | **905** une simulation est une lecture | journal de A ; FE-069 A10 ; C13.5 | balance, bilan | — | en lecture seule, les `…/dry-run` passent et toute écriture garde `403 ABONNEMENT_EXPIRE` ; la liste des routes permises en lecture seule est déclarée et éprouvée par mutation | prête |
| 2 | **906** la balance dit son dossier et son référentiel | tickets `balance-ne-declare-pas-son-dossier`, `tag-referentiel-non-expose` | balance | — | `dossierId` publié ; le tag de référentiel servi ou déduit du dossier ; un tag contradictoire est un 409 nommé | prête |
| 3 | **907** la TPU déclarative et la RSH au catalogue d'obligations | STORY-313 (écarts) ; FE-112, FE-116 | balance, dossier, fiscal | — | la dérivation d'un dossier TPE rend la TPU, la RSH est dérivée ; empreintes réalignées dans les trois dépôts ; recette `zone-franche` verte | prête |
| 4 | **908** balance et bilan sur le socle | EPIC-155 | balance, bilan | — | Node 24, client Confluent (topics créés avant l'abonnement, `metadataMaxAge`), schémas au registre en BACKWARD ; recettes `atelier-balance` et `zone-franche` vertes à froid depuis `dev` | prête |
| 5 | **909** fiscal-service sur le socle | EPIC-155 | fiscal | — | idem ; `test:conformite` vert sous Node 24 | prête |
| 6 | **910** dossier-service et kyc-service sur le socle | EPIC-155 | dossier, kyc | — | idem ; recette `pile` verte | prête |
| 7 | **911** le BFF de la console et les piles de recette sur le socle | EPIC-155 | admin-panel, recette | — | BFF sain sous Node 24, coupe-circuit de 903 rejoué ; recettes vertes sur MongoDB 8.0 | prête |
| 8 | **912** la garde partagée en double lecture : balance et bilan | EPIC-159 (a) | balance, bilan | 908 | garde copiée à `garde-etat-publie-v1` avec son sha256 ; projection de `etat-publie.changed.*` ; falsifier `echeanceLe` ne change aucune décision | prête après 908 |
| 9 | **913** la même chose : fiscal et dossier | EPIC-159 (b) | fiscal, dossier | 909, 910 | idem | prête après 909, 910 |
| 10 | **914** la lecture seule et l'export suivent l'état publié | EPIC-159 (c) ; FR-43 | balance, bilan, fiscal | 905, 912, 913 | préavis de 30 jours puis lecture seule, par l'horloge de référence (aucun `Date.now()`) ; liste blanche d'export | prête après 912, 913 |
| 11 | **915** le portefeuille porte l'état des axes | ticket `portefeuille-ne-porte-plus-l-etat-des-axes` | dossier | — | un état d'axes par ligne de `GET /dossiers`, tri « à traiter d'abord », sans requête par dossier (500 dossiers) | prête |
| 12 | **916** `PATCH /dossiers/{id}` et l'attestation de mandat lisible | ticket `fiche-dossier-trois-surfaces` | dossier | — | l'identité se modifie et l'acte est journalisé ; date, heure et auteur du mandat servis | prête |
| 13 | **917** les recettes croisées sur le point de décision unique ; le BFF quitte le `PUT` d'octroi | EPIC-144, part de A | recette, admin-panel | **B-949** (fusion ensemble) | recettes 631, 632, 649, 650/651, 728 vertes depuis `dev`, amorce par le moteur | bloquée par B-948/949 |
| 14 | **918** le cabinet installé par le moteur (clôture) | EPIC-159 (d) | balance, bilan, fiscal, dossier, recette | 912 → 914, 917 | lecture d'`entitlement.changed` retirée ; recette croisée « cabinet installé par le moteur » verte sans mock (jalon S7) | bloquée par 917 |
| 15 | **919** droits hors du jeton, étape 3, côté fiscal | ADR « droits hors du jeton » | fiscal | **B-955** | la garde fiscale lit `/moi/droits` en double lecture contre `perms[]` ; mêmes décisions ; un `dv` plus récent force la relecture | bloquée par B-955 |

**Remplaçantes** (si une story bloque) : l'impact recalculé d'une surcharge de mapping (bilan, EPIC-100, volet sans
IA) ; STORY-564 (barème IRPP) → 348 → 364 ; le ticket `ligne-de-balance-sans-provenance`.

**FE-069** reste à A, en attente (branche `fe-069` à `4148d65`, A3 → A13 et B1 → B25 restent) : elle reprend avec le
lot frontend.

## 3. Groupe B : le socle partout, le kit des cibles, l'installation, l'essai

Plage : **STORY-941 → STORY-979**. Jalons : kit des cibles 1.0 **le 04/12** ; contrat du jeu de démonstration **le
14/12**.

| # | Story | Épic | Dépôts | Dépend de | Fini quand | État |
|:--:|---|---|---|---|---|---|
| 1 | **941** le verrou npm et les scripts racines de la plateforme ; le README des dossiers | 142 | plateforme (racine) | — | `npm ci` passe ; `test` et `typecheck` racines lisent les dossiers de C ; README à jour avec les dossiers de D (D-L2-3) ; demande de C servie | prête |
| 2 | **942** auth-service sur le socle ; le rôle métier effectif dans la liste des membres | 155, 264 | auth | — | Node 24, Confluent, BullMQ 6, schémas `identity.*` au registre ; l'API des membres rend le rôle effectif (ticket de A servi, FE-115 débloquée) | prête |
| 3 | **943** notification-service sur le socle, garde en double lecture ; `metadataMaxAge` dans le catalogue et paiement | 155, 145 | notification, catalogue, paiement | — | Node 24 et Confluent ; garde à `garde-etat-publie-v1` ; un topic neuf vu en secondes dans les trois services | prête |
| 4 | **944** le kit des cibles (1) : contrats de la Reprise, routes d'import et de contrôle | 161 | plateforme (`bibliotheques/kit-cible/`, contrats de la Reprise) | 941 | contrats publiés, CI Ajv ; `SIMULER` et `APPLIQUER`, idempotence, refus nommés | prête |
| 5 | **945** le kit des cibles (2) : conformité, cible témoin, `kit-cible` 1.0.0 | 161 | plateforme | 944 | la suite rejoue la matrice ; trois mutations rougissent ; 1.0.0 étiqueté **avant le 04/12**, relu par A | prête après 944 |
| 6 | **946** les contrats de Connecteurs et le point d'écriture unique | 169 | plateforme, catalogue | 941 | `seuils-fraicheur@1`, `contrats/echange/` étiquetés ; un manifeste `argent` sans `controle` est refusé | prête |
| 7 | **947** la logique du point de décision | 144 | plateforme (`paquets/point-de-decision`) | — | `decider` rend les refus dans l'ordre ; mode sur site ; conformité et mutation | prête |
| 8 | **948** l'installation, un plan enregistré | 144 | catalogue | 947 | installation idempotente, étapes horodatées, reprise après coupure ; l'axe 2 lu depuis le plan (fin de D-936-1) | prête après 947 |
| 9 | **949** la bascule : retrait des quatre chemins d'octroi | 144 | catalogue, paiement | 948 ; **fusion avec A-917** (D-L2-2) | aucun `ACTIVE` hors du moteur ; `entitlement.changed` toujours émis ; le `PUT` de la console passe par le plan ; annonce « ⚠ Contrats » avant la fusion | prête après 948 |
| 10 | **950** la naissance d'une organisation ; l'identité de la Reprise | 146 | catalogue, auth | 942, 948 | `POST /api/instance/v1/naissances` idempotent ; 404 `ORGANISATION_INCONNUE` (fin de D-936-2) ; jeton de service lu (fin de D-936-3) ; droits `reprise:*` | prête après 948 |
| 11 | **951** essai ou réel : répétition générale et mise en service | 146 | catalogue | 950, 945 | `ECRITURE_REELLE_DEPUIS_ESSAI` ; `MISE_EN_SERVICE_SANS_FEU_VERT` ; prouvé sur la cible témoin | prête après 950 |
| 12 | **952** l'essai prospect et ses avis | 147 | catalogue, notification | 950, 943 | J+30, une prolongation (60 jours au plus), `ESSAI_TERMINE`, signer rouvre sans perte ; avis J-7 | prête après 950 |
| 13 | **953** le contrat du jeu de démonstration, l'effacement, cinq essais simultanés | 147 | plateforme, catalogue | 952 | contrat publié **au plus tard le 14/12** ; effacement idempotent avec certificat signé | prête après 952 (contenu des jeux : A, C, D) |
| 14 | **954** agent et centrale, premier incrément | 148 | **neufs** `agent-instance`, `centrale-service` ; plateforme | 947 | un agent simulé vérifie un état voulu signé et applique une licence, test croisé des vecteurs | **bloquée : dépôts à créer par l'utilisateur** (§6) |
| 15 | **955** droits hors du jeton, étapes 1 et 2 | 145, 264 | auth, catalogue | 942, 950 | `GET /moi/droits`, `dv` dans le jeton, `identity.droits.changed@1` annoncé ; double lecture contre `perms[]` | prête après 942 |

**Remplaçantes** : désinstaller et réinstaller (FR-39) ; préavis de 30 jours et liste blanche d'export (FR-43, côté
catalogue) ; un pack modifié ne vaut que pour les nouveaux contrats (FR-12) ; les tickets `dates-cibles-de-module` et
`repartition-par-version` (catalogue).

**À servir aux autres groupes pendant le lot** : ajout d'auth et de notification à la pile de recette (demande à A) ;
`identity.org.created` garde son format sur le fil (lu par A et C).

## 4. Groupe C : l'assurance, du dossier à l'instruction

Plage : **STORY-989, STORY-991 → STORY-1029**. Chemin du plan maître : 205 (S7-S9) → 206 → 207 ; en parallèle 203, 214,
215.

| # | Story | Épic | Dépôts | Dépend de | Fini quand | État |
|:--:|---|---|---|---|---|---|
| 1 | **989** versions et échéances du dossier | 205 | sinistres | 988 | deux agents sur un dossier : le second est refusé « modifié par X à hh:mm » ; échéances par `upsertJobScheduler`, clé `(dossierId, échéance, epoque)` ; une restauration ne rejoue aucune échéance | prête |
| 2 | **991** les faits `liaison-assureur.*@1` et `sinistres.dossier.changed@1`, la fraîcheur, la liste « à saisir » | 203, 205 | liaison-assureur, sinistres | 989 | schémas au registre, chaque champ classé (`classification-sante`) ; fraîcheur par objet et par transport ; la liste « à saisir » sort quand le LC ne reçoit pas | prête |
| 3 | **992** le circuit continue quand le LC est muet ; le numéro officiel remplace la référence | 203 | sinistres, liaison-assureur | 991 | une coupure laisse déclarer, instruire, ordonner ; la libération d'un ordre sur une police « à relire » est refusée ; un seul numéro, sans trou ni doublon | prête après 991 |
| 4 | **993** la copie de lecture des polices et la table type de sinistre → garanties | 215 | assurance | 991 | polices datées, jamais modifiées ; une police périmée est « à relire », jamais un refus de garantie ; `assurance` absent : `NON_INSTALLE` | prête |
| 5 | **994** la provision dossier par dossier | 215 | assurance | 993 | `assurance` seul écrivain des mouvements, motif à chaque révision ; provision d'ouverture arrondie à 5 000 | prête après 993 |
| 6 | **995** les pièces du dossier : réception, versions, pièces non rattachées | 214 | document-service | — | une pièce remplacée devient une version, l'ancienne reste lisible ; aucune route « supprimer » ; port S3 avec test de contrat sur MinIO | prête |
| 7 | **996** l'OCR réel et le contrôle humain avant archivage | 214 | document-service | 995 | un scan sans texte est lu ; lot de 50 pages en moins de 10 minutes, mesuré | prête après 995 |
| 8 | **997** le versement, le scellé et le volume complémentaire | 214 | document-service | 995 | un scellé échoue à la vérification après toute modification ; `ARC-…/C1` sans invalider l'origine | prête après 995 |
| 9 | **998** les files de travail par rôle | 205 | sinistres | 989 | corbeille du gestionnaire, file du responsable, files de validation, de la comptabilité et du guichet de remise, servies par des routes de lecture | prête |
| 10 | **999** relances et dossiers muets à 8, 15 et 30 jours | 205 | sinistres | 989 | échéances légales et internes séparées ; relances posées et levées par les transitions | prête après 989 |
| 11 | **1000** les portées par volet et l'accès par dossier | 202 | sinistres | **D-1036** (`reseau.portee.changed@1`, 27/11) | un agent ne voit aucun dossier hors de sa portée ; une portée vide est vide ; les routes par `dossierId` refusent hors portée ; la suite de conformité du réseau passe | bloquée jusqu'au 27/11 |
| 12 | **1001** les actes qui font une partie au dossier ; cumuls interdits ; matrice de délégation | 202 | sinistres | 1000 | un test par acte de FR-29 ; un cumul interdit de FR-7 refusé ; la délégation est un paramètre daté (résout `COMITE`) | prête après 1000 |
| 13 | **1002** déclarer : canaux, saisie commune, doublon, réserves, urgence corporelle | 206 | sinistres | 992, 995 | une déclaration s'enregistre toujours ; un doublon (Prospera ou LC) est signalé ; une déclaration tardive donne une réserve, jamais une déchéance | prête après 992 |
| 14 | **1003** ouvrir : recevabilité, garantie, pièces attendues et courrier ; provision d'ouverture | 206 | sinistres, assurance | 1002, 993, 994 | les constats `PIECES_COMPLETES`, `CONTRAT_VERIFIE`, `GARANTIE_ENGAGEABLE` sont posés par ces commandes (fin des constats posés en base) ; le courrier est archivé en copie | prête après 1002 |
| 15 | **1004** attribuer : charge pondérée, réaffectation motivée ; la prise en instruction | 206, 207 | sinistres | 1003 | `DOSSIER_AFFECTE` posé par l'affectation ; une réaffectation exige un motif ; le parcours déclarer → ouvrir → attribuer → instruire se joue contre le LC fictif | prête après 1003 |

**Remplaçantes** : la coassurance et la réassurance (215) ; l'archive physique (214) ; les premières vérifications de
l'annexe E rendues possibles (204).

## 5. Groupe D : le réseau, puis le socle du distributeur

Plage : **STORY-1030 → STORY-1079** (nouvelle, prise dans la réserve de Dev B, inscrite au tracker). Pile de référence :
celle de `prospera-sinistres-service` (Node 24-slim, NestJS 11, Mongoose 8, client Confluent ~1.11, Karapace, MongoDB
8.0) ; pièges : `REGLES-DES-GROUPES.md` §1.9. **Jalon : `reseau.portee.changed@1` publié le 27/11** (EPIC-050 ;
attendu par C-1000, et par 223, 227, 238).

| # | Story | Épic | Dépôts | Dépend de | Fini quand | État |
|:--:|---|---|---|---|---|---|
| 1 | **1030** le squelette de `reseau-service` sur la pile du moteur | 044 | reseau-service | — | `main` et `dev` posées ; `docker compose up` sain ; démarrage dégradé sans Kafka ; manifeste copié à l'octet depuis `manifestes/reseau.manifest.ts` avec sa garde ; port fixé (3419 proposé, à vérifier) | prête |
| 2 | **1031** gate, read-models et cloisonnement | 044 | reseau-service | 1030 | e-mail vérifié, KYC, droit au module, lus dans les read-models locaux ; `orgId` tiré du jeton seulement ; outbox transactionnelle | prête après 1030 |
| 3 | **1032** zones et agences | 045 | reseau-service | 1031 | code jamais réattribué ; fermeture sans suppression, refus nommé ; montants entiers avec leur devise | prête après 1031 |
| 4 | **1033** la hiérarchie récursive à profondeur configurable | 046 | reseau-service | 1032 | un agrégat `Noeud` ; passer de 3 à 4 niveaux par configuration ; cycle refusé ; déplacement précédé d'un compte rendu | prête après 1032 |
| 5 | **1034** personnes, commerciaux et affectations | 048 | reseau-service | 1033 | affectations datées sur plusieurs nœuds ; historique conservé ; états du commercial | prête après 1033 |
| 6 | **1035** le modèle de portée, l'héritage et la gouvernance | 049 | reseau-service | 1033, 1034 | « totale » distincte de « aucune » ; personne n'attribue plus que sa portée ; journal avant/après | prête après 1034 |
| 7 | **1036** la publication de `reseau.portee.changed@1` | 050 | reseau-service | 1035 | état absolu, clé `(orgId, userId)`, par l'outbox, schéma au registre en BACKWARD ; annoncé dans « ⚠ Contrats » de D. **Jalon du 27/11** | prête après 1035 |
| 8 | **1037** la suite de conformité de la portée et le registre des consommateurs | 050 | reseau-service (paquet publié, D-L2-3) | 1036 | six cas (absente, vide, totale, héritée, restreinte, révoquée en vol) ; une portée absente rend zéro ligne ; ticket à C pour 1000 | prête après 1036 |
| 9 | **1038** le redécoupage ne réécrit pas le passé | 047 | reseau-service | 1033 | scission, fusion, transfert datés ; la version de découpage dans chaque événement ; une période passée se restitue avec sa version | prête après 1033 |
| 10 | **1039** le rattachement lieux ↔ zones et la résolution | 051 | reseau-service | 1038, 1032 | rattachement principal ou secours ; une adresse inconnue rend « non résolu », jamais une zone approchante | prête après 1038 |
| 11 | **1040** la couverture, les zones blanches, les candidats | 052 | reseau-service | 1039 | couverture comptée sans jugement ; zones blanches listables | prête après 1039 |
| 12 | **1041** l'administration, l'import tout ou rien, le journal d'audit lisible | 053 | reseau-service | 1035 | cinq droits distincts ; import avec compte rendu avant persistance ; journal en ajout seul avec sa route de lecture (volet Reprise après 945 de B) | prête après 1035 |
| 13 | **1042** le socle de `prospera-ventes-service` et les bibliothèques transverses | 222 | **neuf** `prospera-ventes-service` ; plateforme (`vocabulaires/`, `contrats/distributeur/`) | 941 (README) | modules `commande`, `facturation`, `entrepot`, `approvisionnement`, chacun sa gate ; le lint « aucun import croisé » ; piste d'audit chaînée (AD-21) ; chaque module s'installe et se désinstalle seul | **bloquée : dépôt à créer** (§6) |
| 14 | **1043** les quatre autres services du distributeur | 222 | **neufs** terrain, recouvrement, pilotage, croissance | 1042 | les quatre démarrent par `docker compose up`, manifestes copiés, gates et audit repris de 1042 | **bloquée : dépôts à créer** |
| 15 | **1044** la bibliothèque `series` : des séries sans perte | 224 | plateforme (`series/`), consommée par ventes | 1042 | 50 émissions simultanées = 50 numéros consécutifs ; un bon annulé garde son numéro ; la première facture suit le dernier numéro Sage ; après restauration, aucun numéro réémis | prête après 1042 (hors profil hébergé, EPIC-263) |

**Remplaçantes** (si les dépôts neufs tardent) : les vocabulaires et contrats du distributeur dans la plateforme (sans
dépôt neuf) ; les squelettes de `pdv-service`, `catalogue-produits-service`, `stock-service` dès leur création.

**Hors de ce lot** : la Créance (EPIC-231) et les compteurs de `paiement` (dépôt de B) ; les rôles du distributeur dans
auth (EPIC-223, dépôt de B) : par demande à B.

## 6. Ce que l'utilisateur doit faire (gestes réservés)

| Geste | Pour | Avant |
|---|---|---|
| Créer `agent-instance` et `centrale-service` (privés, `MoneyVibesGroup`) | B-954 | sa 14e story |
| Créer `prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`, `prospera-pilotage-service`, `prospera-croissance-service` | D-1042, 1043 | sa 13e story (vers le 25/11) |
| Poser « Rebase and merge » seul sur chaque dépôt neuf, et sur `prospera-plateforme` (encore en attente) | tous | à la création |
| Lancer les sessions B et D sur ce plan (D : backend) | B, D | dès la fusion |

## 7. Ce que les groupes attendent les uns des autres

| De | Vers | Quoi | Échéance |
|---|---|---|---|
| B-941 | D, C | README de la plateforme (dossiers de D) ; verrou et scripts racines | début du lot |
| B-942 | A | rôle métier effectif dans la liste des membres | S3 |
| B-948/949 | A-917 | retrait des chemins d'octroi : les deux PR fusionnées ensemble | S5 |
| B-955 | A-919 | `/moi/droits` | S5-S6 |
| B-945 | A (relecture), D-1041 | `kit-cible` 1.0.0 | **04/12** |
| B-953 | A, C, D | contrat du jeu de démonstration | **14/12** |
| D-1036, 1037 | C-1000 | `reseau.portee.changed@1` et sa suite de conformité | **27/11** |
| C-991 | B, D | faits de l'assurance au registre, champs classés | S3 |
| A | B, C, D | toute modification de `prospera-recette` (ajout d'un service à la pile) passe par une demande à A | — |

## 8. Les plages d'identifiants (lot 2)

| Groupe | Plage | Prochain numéro |
|---|---|---|
| A | STORY-905 → 929 | 905 |
| B | STORY-941 → 979 | 941 |
| C | STORY-989, 991 → 1029 | 989 |
| D | **STORY-1030 → 1079** (nouvelle) | 1030 |

Le plafond `story_id_high_water_mark` reste le MAX réellement écrit (STORY-990 au 16/11) ; chacun puise dans sa seule
plage, dans l'ordre.
