# STORY-1121 : La destruction proposée, puis visée — pièces échues, gel, visa de l'associé, accord du client, procès-verbal et registre

Status: done — **livrée le 2026-11-26** : document-service **#35** (`023446c` sur `dev`), auth **#51** (`e9c32c1`),
catalogue **#79** (`08f08d6`) ; voir « Livraison ». Fiche écrite le 2026-11-26 par la session du groupe B juste avant de la coder (lot 7, n° 3 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 3 ; identifiant réservé D-L7B-1).

**Service :** `document-service` (GitHub `prospera-ocr-service`, module `ged`) et `auth-service` (deux droits du
cabinet) · **Points :** 8 · **Dépend de :** STORY-1119 (journal d'intégrité, contrôle, documents probants ;
`b7b3f91`), STORY-1120 (fermeture, export, exemplaire signé ; `b92ac18`), STORY-1088 (durée de conservation affichée,
originaux, sorties) · **Suite :** STORY-1122 (gros fonds), STORY-1123 (alertes : échéance proche, fait publié) ·
**Écran :** FE-143 (A, lot 8)
**Sources :** PRD des services du cabinet `prds/prd-services-cabinet-2026-11-18/` (FR-11 : « aucune destruction
automatique (lot suivant : destruction proposée puis visée) » ; NFR-7 : « rien ne se supprime sans procédure visée » ;
NFR-4, NFR-5, NFR-6 ; G2) ; STORY-1087 (amendement du 24/11 : « la destruction d'un dossier est approuvée par la
direction du cabinet et inscrite à un registre » ; « la destruction, approuvée et inscrite au registre, est d'un lot
suivant ») ; STORY-1088 (AC-6, D-1088-7 : `conservation.jusquau`) ; PRD assurance FR-175 (le modèle déjà écrit :
destructible seulement à l'échéance, bordereau visé, une pièce détruite garde son numéro, ses visas et son bordereau,
refus sous contrôle, litige ou sortie d'archive) ; AUDCIF art. 24 (dix ans) ; loi n° 2019-014 (minimisation).

---

## Pourquoi

Une pièce comptable se garde dix ans après la fin de son exercice, une pièce du dossier permanent dix ans après la fin
de la mission. Au-delà, la garder coûte (stockage, quota de l'offre) et expose des données personnelles que la loi
n° 2019-014 interdit de garder sans besoin. Mais détruire une archive est le seul geste qu'on ne rattrape pas : la GED
n'a jusqu'ici aucune route ni aucune méthode qui supprime, et c'est voulu. Cette story ouvre **une seule porte**, et la
garde : la destruction se **propose** (l'archiviste, à partir de la liste des pièces échues), se **vise** (l'associé,
une autre personne), s'**accorde** (le client, sur le bordereau signé), puis s'**exécute** et se **prouve** (procès-verbal
figé, registre du cabinet, journal d'intégrité). Elle n'est jamais automatique, et elle ne touche jamais une pièce encore
en litige, en contrôle, ou sortie.

## Ce qui est déjà livré (et que cette story ne refait pas)

- **STORY-1087 / 1088** : chaque nature porte `conservationAns` (10) et son point de départ (`FIN_EXERCICE`,
  `FIN_MISSION`) ; la vue d'une pièce rend `conservation.jusquau` (D-1088-7 : 31/12 de l'exercice, ou fin de période du
  fonds). Les originaux papier, leurs boîtes, cotes, sorties et restitutions.
- **STORY-1119** : le journal d'intégrité chaîné, le contrôle des empreintes (périodique et à la demande), les documents
  probants figés (`DOCUMENT_EMIS`, retéléchargés à l'octet).
- **STORY-1120** : la fermeture du fonds (la fin de mission a désormais une date), l'export complet en volumes, le dépôt
  d'un exemplaire signé (`exemplaireSigne`, `EXEMPLAIRE_SIGNE`).
- **« En litige ou en contrôle » n'existe nulle part** (relu le 26/11) : ni dans la GED, ni dans `dossier-service`
  (statuts `ACTIF`/`ARCHIVE` seulement), ni dans le fiscal, la balance, la comptabilité, auth ou paiement (le mot
  « litige » n'y apparaît que dans des libellés de comptes ou des commentaires). D'où le **gel** ci-dessous (D-1121-1).

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls**, sous `/api/v1/ged/cabinet` (gate `GED_NOT_ENTITLED`, droits lus par `GET /moi/droits`). Le chemin de
l'assurance ne change pas. **Aucun fait Kafka publié** (D-1121-9 : `ged.destruction.decidee@1`, déjà déclaré au
manifeste, et l'alerte d'échéance sont à STORY-1123). Aucune dépendance neuve.

### 1. Les droits (auth-service, D-1121-2)

Deux codes **déjà déclarés au manifeste `ged`** (`droits`) entrent au catalogue de tenant d'auth, **hors du jeton**
(servis par `GET /moi/droits` dans `droitsHorsJeton`), dans la table d'accès du cabinet :

| Droit | Rôles | Ce qu'il ouvre |
|---|---|---|
| `ged:destruction:proposer` | `CAB_ARCHIVISTE`, `CAB_ASSOCIE` | proposer, enregistrer l'accord du client, exécuter, abandonner |
| `ged:destruction:viser` | `CAB_ASSOCIE` | viser (ou refuser) une proposition ; lever un gel |

Catalogue de tenant 165 → **167 codes** (24 + 143), borne du jeton inchangée ; `moi-droits` 1.1.0 et
`identity.droits.changed@1` inchangés. **La personne qui vise n'est jamais celle qui a proposé** (409
`VISA_PAR_LE_PROPOSANT`), même quand l'associé détient les deux droits.

### 2. Le gel : « en litige ou en contrôle » (AC-2)

| Geste | Route | Droit |
|---|---|---|
| Poser un gel | `POST /ged/cabinet/fonds/{numero}/gels` `{ motif, reference?, observation?, exercices?, pieces? }` → **201** (`GEL-AAAA-NNNNN`) | `ged:fonds:gerer` |
| Les gels d'un fonds | `GET /ged/cabinet/fonds/{numero}/gels` | `ged:fonds:gerer` |
| Lever un gel | `POST /ged/cabinet/gels/{numero}/levee` `{ observation }` (10 caractères au moins) → **200** | `ged:destruction:viser` |

- `motif` ∈ `LITIGE`, `CONTROLE_FISCAL`, `CONTROLE_SOCIAL`, `AUTRE_CONTROLE` ; `reference` : l'avis de vérification,
  le numéro de la procédure… (200 caractères au plus) ; **portée** : tout le fonds (ni `exercices` ni `pieces`), des
  exercices, ou des pièces nommées du fonds (404 `PIECE_INCONNUE` pour une pièce d'un autre fonds). Un fonds fermé se
  gèle aussi.
- Une pièce **gelée** n'est ni proposée, ni détruite : elle sort de la liste des destructibles (`blocage`), et une
  proposition déjà faite la **retire à l'exécution** (D-1121-5). Un gel levé ne gèle plus ; il reste à l'historique.
- Journal : actes neufs **`GEL`** (`details: { gel, motif, portee }`) et **`GEL_LEVE`** (`gel`), dans la transaction du
  gel ; la référence et l'observation ne vont pas au journal (elles restent au gel).
- Refus : 404 `FONDS_INCONNU`, `GEL_INCONNU`, `PIECE_INCONNUE` ; 409 `GEL_DEJA_LEVE`.

### 3. Les pièces échues (AC-1)

| Geste | Route | Droit |
|---|---|---|
| Les pièces échues d'un fonds | `GET /ged/cabinet/fonds/{numero}/pieces-echues?curseur=&limite=` | `ged:fonds:gerer` |

- **Échue** = sa date d'échéance est passée : `FIN_EXERCICE` → 31/12 de l'exercice + `conservationAns` (D-1088-7) ;
  `FIN_MISSION` → **la mission doit être finie** (le fonds est fermé) et l'échéance part de la plus tardive de la fin de
  période et de la fermeture (D-1121-3). Une pièce annuelle sans exercice, ou permanente d'un fonds ouvert, n'est
  jamais échue. Le jour se lit à l'horloge du service (`Horloge`).
- Chaque ligne : `pieceId`, `nature`, `libelleNature`, `sensible`, `exercice?`, `date?`, `reference?`, `echeance`
  (`AAAA-MM-JJ`), `versions`, `original?` (`{ cote? }` en place, ou `{ restitue: RES-… }`), et **`blocage?`**
  `{ raison: GEL | SORTIE | PROPOSEE, reference }` (le gel, la sortie, ou la proposition en cours qui la porte). Une
  pièce déjà détruite n'y est plus.
- **Lue par pages** (D-1121-4) : le service parcourt le fonds par `pieceId` croissant (`piecesDuFondsParPage`, 500 par
  page, sans la borne de 1 000 de `piecesDuFonds`) ; `limite` ≤ 200 (défaut 100) ; `curseur` rend la suite. Une nature
  sensible ne se montre qu'avec `ged:sensible:consulter` (sinon comptée dans `masquees`).

### 4. La proposition, le visa, l'accord (AC-3, AC-4)

| Geste | Route | Droit |
|---|---|---|
| Proposer | `POST /ged/cabinet/fonds/{numero}/destructions` `{ pieces?, observation? }` → **201** (`DES-AAAA-NNNNN`, `PROPOSEE`) | `ged:destruction:proposer` |
| Les destructions d'un fonds | `GET /ged/cabinet/fonds/{numero}/destructions` | `ged:fonds:gerer` |
| Une destruction | `GET /ged/cabinet/destructions/{numero}` | `ged:fonds:gerer` |
| Ses pièces | `GET /ged/cabinet/destructions/{numero}/pieces?curseur=&limite=` | `ged:fonds:gerer` |
| Viser | `POST /ged/cabinet/destructions/{numero}/visa` `{ decision: VISEE \| REFUSEE, observation? }` → **200** | `ged:destruction:viser` |
| L'accord du client | `POST /ged/cabinet/destructions/{numero}/accord` (multipart : `decision` `ACCORDEE` \| `REFUSEE`, `accordePar`, `accordeLe`, `fichier`) → **200** | `ged:destruction:proposer` |
| Abandonner | `POST /ged/cabinet/destructions/{numero}/abandon` `{ observation }` → **200** | `ged:destruction:proposer` |

- **Proposer** : sans `pieces`, **toutes les pièces destructibles** du fonds (échues, sans blocage, lisibles par le
  proposant), lues par pages, **5 000 au plus** par proposition (le reste attend la suivante, `restantes: true`) ; avec
  `pieces`, exactement celles-là, chacune destructible, sinon **409 `PIECES_NON_DESTRUCTIBLES`** (`details.pieces: [{
  pieceId, raison: NON_ECHUE | GELEE | SORTIE | DEJA_PROPOSEE | DETRUITE | INCONNUE }]`) ; aucune : **409
  `AUCUNE_PIECE_DESTRUCTIBLE`**. Une pièce n'est que dans **une** proposition en cours (index unique partiel). Journal
  **`DESTRUCTION_PROPOSEE`** (`destruction`, `pieces`, `empreinteDesLignes`).
- **Viser** (`PROPOSEE` seulement) : `VISEE` émet le **bordereau de destruction**, document probant de type neuf
  **`BORDEREAU_DE_DESTRUCTION`** (`BDE-AAAA-NNNNN`, figé, `DOCUMENT_EMIS`, `GET …/documents-probants/{numero}/pdf`) : le
  fonds, le client, la proposition, le visa (par, le), chaque pièce (nature — « nature protégée » pour une nature
  sensible —, exercice, date, référence, échéance, empreinte de chaque version, original papier), et la place de
  l'accord du client (« bon pour destruction », nom, date, signature). `REFUSEE` exige une observation (10 caractères)
  et clôt la proposition. Journal **`DESTRUCTION_VISEE`** (`destruction`, `decision`, `bordereau?`).
- **L'accord du client** (`VISEE` seulement, D-1121-6) : le client n'a pas de compte ; le cabinet dépose **le bordereau
  signé par le client** (PDF, JPEG, PNG ou WEBP ; exigé pour `ACCORDEE`, facultatif pour `REFUSEE`), gardé chiffré comme
  l'exemplaire signé de STORY-1120 (`exemplaireSigne` du `BDE-…`, retéléchargé par `GET
  …/documents-probants/{numero}/exemplaire-signe`). Journal **`DESTRUCTION_ACCORDEE`** (`destruction`, `decision`,
  `bordereau`, `empreinte?` ; ni le nom du signataire, ni le contenu). `REFUSEE` clôt la proposition.
- **Abandonner** : avant l'exécution (`PROPOSEE`, `VISEE`, `ACCORDEE`) ; journal **`DESTRUCTION_ABANDONNEE`**.
- Refus communs : 404 `FONDS_INCONNU`, `DESTRUCTION_INCONNUE` ; 409 `ETAT_DE_DESTRUCTION` (`details: { etat,
  attendu }`), `VISA_PAR_LE_PROPOSANT` ; 400 `OBSERVATION_REQUISE`, `FICHIER_ABSENT`.

### 5. L'exécution, le procès-verbal, le registre (AC-5, AC-6)

| Geste | Route | Droit |
|---|---|---|
| Exécuter | `POST /ged/cabinet/destructions/{numero}/execution` → **202** (`EN_EXECUTION`) | `ged:destruction:proposer` |
| Le registre du cabinet | `GET /ged/cabinet/registre-des-destructions?annee=&curseur=&limite=` | `ged:fonds:gerer` |

- **Jamais automatique** (D-1121-7) : l'exécution part d'un geste humain sur une proposition `ACCORDEE` ; aucun
  planificateur ne propose, ne vise ni n'exécute. Elle est jouée par une **file BullMQ neuve `ged-destructions`**
  (concurrence 1, rejouable : chaque étape est idempotente).
- **Au moment d'exécuter**, chaque pièce est rejugée : gelée, sortie (elle-même ou sa boîte) ou déjà détruite ⇒
  **retirée** de la destruction et gardée (`exclue: { raison, reference }`), nommée au procès-verbal (D-1121-5).
- **Ce qui est détruit** (D-1121-8) : le **fichier de chaque version** (l'objet retiré du stockage), le **texte lu**
  (OCR) de chaque version, et dans l'index de la pièce le **tiers**, le **NIF** et le **montant** (données qu'on ne garde
  plus sans besoin) et le nom d'origine du fichier ; les **volumes des exports** du fonds (STORY-1120), qui en portent
  une copie (l'export rend `volumesDetruits`, ses volumes 410 `EXPORT_DETRUIT`).
- **Ce qui reste**, pour prouver la destruction : la pièce (identifiant, fonds, dossier, nature, rubrique, exercice,
  date, référence, source, réception, contrôle humain) marquée **`destruction: { numero, le, procesVerbal }`** ;
  chaque version avec son **empreinte SHA-256**, sa taille, son type, sa trace de numérisation, marquée `destruction` ;
  les **bordereaux de versement et leurs scellés**, intacts (ils se recalculent depuis leurs lignes) ; le journal
  d'intégrité ; la proposition, son bordereau `BDE-` et l'accord signé ; le **procès-verbal** `PVD-`. L'original papier
  d'une pièce détruite encore au cabinet est **nommé au procès-verbal, à détruire par le cabinet** (sa boîte et sa
  cote) ; un original déjà restitué est nommé comme tel.
- **Le procès-verbal de destruction**, document probant de type neuf **`PROCES_VERBAL_DE_DESTRUCTION`**
  (`PVD-AAAA-NNNNN`, figé, `DOCUMENT_EMIS`) : la destruction, le fonds, le client, le bordereau visé et son empreinte,
  le visa, l'accord (signataire, date, empreinte de l'exemplaire), la date d'exécution, chaque pièce détruite (nature
  ou « nature protégée », exercice, référence, chaque version et son SHA-256), les pièces retirées et pourquoi, les
  originaux à détruire (cotes), les exports dont les volumes sont détruits, le rang de l'entrée `DESTRUCTION`.
- Journal : acte neuf **`DESTRUCTION`** (`destruction`, `pieces`, `versions`, `exclues`, `empreinteDesLignes`,
  `exports`) dans la transaction qui marque les pièces, **avant** que le premier objet soit retiré ; puis
  `DOCUMENT_EMIS` du procès-verbal. La chaîne ne casse pas : on n'y retire rien, on y ajoute.
- **Le registre des destructions** du cabinet : chaque destruction (par défaut `EXECUTEE` ; `etat=` pour les autres),
  du plus récent au plus ancien : numéro, fonds, client, proposée (par, le), visa, accord, exécutée le, pièces
  détruites et retirées, `BDE-` et `PVD-` (avec leur empreinte), rang de l'entrée `DESTRUCTION`.

### 6. Une pièce détruite, partout ailleurs (AC-7)

- **Contrôle des empreintes** (vérification à la demande, campagne périodique, export, certificat) : une version
  détruite régulièrement **n'est jamais `FICHIER_ABSENT`** ; elle est comptée **`detruites`** (par bordereau et pour le
  fonds, champ neuf de `ResultatDuControle`) et son scellé se recalcule depuis l'empreinte gardée. Un fichier absent
  **sans** destruction reste `FICHIER_ABSENT`.
- **Certificat d'intégrité** : il s'émet encore, et dit combien de pièces ont été détruites et par quels `PVD-`.
- **Export** : une pièce détruite figure à l'index (`destruction`), sans fichier, sans écart.
- **Lecture** : la vue d'une pièce gagne `destruction?` et ses versions `detruite: true` ; contenu et texte lu :
  **410 `PIECE_DETRUITE`** (`details: { destruction, procesVerbal }`) ; version neuve, indexation, contrôle : **409
  `PIECE_DETRUITE`** ; la recherche ne rend plus une pièce détruite.
- **Quota** : le volume du cabinet ne compte plus les versions détruites.
- **Le port de stockage** gagne **une** méthode qui retire, `detruire(cle)` (idempotente) ; un invariant exige qu'elle
  ne soit appelée **que** par le service de la destruction (D-1121-7).

### Données, configuration, manifeste

- Collections neuves : `ged_gels` (unique `(organisationId, numero)`), `ged_destructions` (unique `(organisationId,
  numero)`), `ged_destructions_lignes` (unique `(organisationId, destruction, pieceId)` ; une pièce dans une seule
  proposition en cours : unique partiel `(organisationId, pieceId)` sur `enCours`). Champs neufs : `destruction` sur
  `ged_pieces` et `ged_versions`, `volumesDetruits` sur `ged_exports_fonds`. Compteurs `gel-cabinet|org|année`,
  `destruction-cabinet|org|année`, `probant-BORDEREAU_DE_DESTRUCTION|…`, `probant-PROCES_VERBAL_DE_DESTRUCTION|…`.
- File BullMQ neuve **`ged-destructions`**. Aucune variable neuve.
- Manifeste **`ged` 1.6.0** : six routes `GET` neuves en `routesLectureSeule` (`fonds/{numero}/pieces-echues`,
  `fonds/{numero}/gels`, `fonds/{numero}/destructions`, `destructions/{numero}`, `destructions/{numero}/pieces`,
  `registre-des-destructions`) ; `droits` inchangés (les deux codes y sont déjà) ; `publie`, `consomme` inchangés.
  **Recopie au catalogue** par B après la fusion du code (D-979-24).
- **→ A (FE-143)** : types à régénérer depuis l'OpenAPI de `document-service` quand l'écran viendra (DTO de réponse
  nommés par le module : `…DestructionDto`).

## Livraison (2026-11-26)

- **Code** : document-service (`prospera-ocr-service`) **#35**, `023446c` sur `dev` : `src/modules/ged/cabinet/`
  `destruction.ts` (gel, échéance, états, lignes), `depot-destruction.ts` (`ged_gels`, `ged_destructions`,
  `ged_destructions_lignes`), `destruction.service.ts`, `destruction.controller.ts` (treize routes, DTO de réponse
  `…DestructionDto`), `destruction.planificateur.ts` (file `ged-destructions`) ; `pdf-probants.ts` (bordereau de
  destruction, procès-verbal, certificat qui cite les détruites) ; `StockageObjets.detruire` (S3 `removeObject`) ;
  `DepotGed.marquerDetruites`, `DepotLectures.effacerLesTextes`, `DepotExports.marquerVolumesDetruits` ;
  `CabinetService` (version détruite jamais `FICHIER_ABSENT`, `detruites`, 410/409 `PIECE_DETRUITE`) ; export, recherche,
  quota. Manifeste `ged` **1.6.0** recopié depuis `prospera-stories@5031fc8` (#933), empreinte épinglée.
- **Auth** : `auth-service` **#51**, `e9c32c1` sur `dev` : `ged:destruction:proposer` (`CAB_ARCHIVISTE`, `CAB_ASSOCIE`),
  `ged:destruction:viser` (`CAB_ASSOCIE`), hors du jeton ; catalogue de tenant 167 codes (24 + 143).
- **Catalogue** : `platform-catalog-service` **#79**, `08f08d6` sur `dev` : `ged` 1.6.0 recopié depuis
  `prospera-stories@5c56b2d` (seul manifeste qui change ; `manifestes:garde` verte, 48).
- **Preuves** :
  - document-service, Node 25 : unitaires 1290 passés (112 suites ; 2 rouges connues du poste, copies CRLF de
    `ged.service.spec`, chemins Windows de `piece-conservation.spec`) ; e2e **217/217** (17 suites ; `ged-destruction`
    4/4, recensement de STORY-695 compris) ; lint des fichiers touchés, `tsc`, build.
  - document-service, Node 24 (étage `verification`, image depuis `git -c core.autocrlf=false archive`) : unitaires
    112/112 suites, 1293 passés ; e2e 217/217.
  - Mutations **18/18** rouges sur assertion (gel et sortie à la proposition ; viseur = proposant ; version détruite
    relue ; gel et version ajoutée à l'exécution ; exécution non accordée ; échue le jour même ; texte lu gardé ; copies
    d'export gardées ; permanente d'un fonds ouvert ; sensible montrée ; refus de visa qui ne libère pas ; accord sans
    fichier ; pièce détruite modifiable ; contenu servi ; gel levé sans viser ; marquage retiré). Auth 2/2, catalogue 2/2.
  - auth, Node 25 : rbac, droits, rôles 23 suites 406/406 ; complète 1466 passés (4 suites rouges connues, binding de
    Confluent). Catalogue : 64/64 par chemin, complète 1625 passés (3 suites rouges connues).
  - **Pile `grp-b` neuve** (image depuis l'archive ; Mongo rs0, Kafka, Redis, MinIO Chainguard ; doublure d'auth avec les
    deux droits ; le dossier par `dossier.created`, l'état publié de `ged` par Kafka) : `healthy`, aucune erreur hors des
    sondes du démarrage ; pièces échues 2015 et 2014 (2026 absente) ; gel du contrôle fiscal de 2015 nommé `GEL`,
    proposition refusée `GELEE`, levée refusée à l'archiviste (403 `ged:destruction:viser`) puis faite par l'associé ;
    **course de 5 propositions simultanées de la même pièce : 1 × 201, 4 × 409 `DEJA_PROPOSEE`** (index partiel et
    transaction) ; visa refusé à l'archiviste, `BDE-2026-00001` émis par l'associé, exécution refusée avant l'accord
    (409), accord multipart ; **exécution par la file `ged-destructions` en 0,7 s** (3 pièces ; l'export antérieur
    `EXP-2026-00001` compris) ; **MinIO ne garde plus que la pièce de 2026 et les documents probants** ; contenu 410,
    volume d'export 410 `EXPORT_DETRUIT` ; index sans tiers ni montant, versions sans nom de fichier ; vérification
    `ok`, `detruites: 3`, aucun écart ; campagne `TERMINEE` (`detruites: 3`) ; certificat `CERT-2026-00002` émis après la
    destruction ; chaîne vérifiée (18 rangs ; `DESTRUCTION` au rang 14, le procès-verbal au rang 15) ; `PVD-2026-00001`
    retéléchargé à l'octet ; registre ; index `une_proposition_en_cours_par_piece` (partiel `enCours`) créé. Les textes
    lus de la pile étaient en `ECHEC` (faux PDF) : leur effacement est prouvé par les unitaires. Verrou 02:24 → 02:39,
    `down -v`.

### Écarts au contrat, décidés au code

- **D-1121-11** : une raison de retrait de plus à l'exécution, **`VERSION_AJOUTEE`** : une version déposée après la
  proposition n'était ni au bordereau visé ni à l'accord ; la pièce est gardée. La marque `destruction` d'une pièce
  porte son `procesVerbal`, numéroté à la demande d'exécution.
- **D-1121-12** : une exécution `EN_EXECUTION` se **redemande** (202) après une panne ; l'erreur d'une tentative reste
  dans `execution.erreur`. Les trois étapes (marquer, effacer, procès-verbal) ne se font qu'une fois chacune.
- **D-1121-13** : ajouts seuls à la réponse : `restantes` d'une proposition, `bordereauDocument` et
  `procesVerbalDocument` d'une destruction lue ou du registre, `destructionNumero` d'un document probant,
  `volumesDetruits` d'un export, `detruites` d'un contrôle de campagne.
- **D-1121-14** : la garde de STORY-395 (`piece-conservation.spec`, « aucun code n'appelle `removeObject` ») admet une
  seule exception nommée, l'adaptateur S3 de `ged` (son bucket, un seul appel) ; l'invariant de `ged` garde que seule la
  destruction l'appelle.
- **D-1121-15** : un numéro `DES-` pris par une proposition refusée (la course) n'est jamais rendu : la séquence a des
  trous, comme les autres. Un PDF orphelin d'une émission tombée (bordereau, procès-verbal) est retiré par la
  destruction elle-même avant la nouvelle émission (aucun document ne le cite).
- **D-1121-16** : la recette de l'Atelier n'est pas rejouée : le diff ne touche ni l'OCR, ni les extractions, ni le
  module Nest commun (seul `GedModule` gagne des fournisseurs et une file) ; leurs e2e passent tels quels sous Node 24 et
  25.

## Critères d'acceptation

- **AC-1** : la liste des pièces échues d'un fonds se lit par pages, sur un fonds de plus de 1 000 pièces ; une pièce
  permanente d'un fonds ouvert n'y est jamais ; chaque blocage est nommé.
- **AC-2** : un gel (litige, contrôle) se pose sur un fonds, des exercices ou des pièces ; une pièce gelée n'est ni
  proposée ni détruite ; le gel se lève par l'associé ; poser et lever s'inscrivent au journal.
- **AC-3** : une proposition porte des pièces destructibles seulement ; une pièce n'est que dans une proposition en
  cours ; elle s'inscrit au journal.
- **AC-4** : le visa est donné par une autre personne que le proposant, avec `ged:destruction:viser` ; il émet le
  bordereau de destruction figé ; l'accord du client se dépose (bordereau signé) ; un refus clôt la proposition.
- **AC-5** : l'exécution n'a lieu que sur une proposition accordée, par un geste humain, jamais par un planificateur ;
  une pièce gelée ou sortie entre-temps est retirée et gardée ; les fichiers, le texte lu et les copies d'export sont
  détruits ; l'acte `DESTRUCTION` est inscrit avant le premier objet retiré.
- **AC-6** : le procès-verbal est figé, retéléchargé à l'octet, son empreinte au journal ; le registre du cabinet le
  cite.
- **AC-7** : après une destruction, le contrôle périodique et la vérification ne nomment aucun `FICHIER_ABSENT` pour une
  pièce détruite, la chaîne du journal se vérifie, le certificat s'émet ; un fichier retiré sans destruction est
  toujours `FICHIER_ABSENT`.
- **AC-8** : le chemin de l'assurance ne change pas ; le recensement des routes du cabinet (STORY-695) classe les
  routes neuves ; aucune autre route ne supprime.

## Décisions prises au contrat (contestables)

- **D-1121-1 — « En litige ou en contrôle » est un gel posé dans la GED** : l'information n'existe nulle part (relu dans
  tous les services) ; un litige ou un contrôle fiscal est connu du cabinet avant d'être connu d'un système. Le gel
  porte un motif, une référence et une portée (fonds, exercices, pièces), il est inscrit au journal, et il gagne toujours
  sur la destruction. Poser un gel est prudent (`ged:fonds:gerer`, l'associé et l'archiviste) ; le lever rouvre la
  destruction, il revient à qui vise (`ged:destruction:viser`).
- **D-1121-2 — Deux droits neufs chez auth, pris au manifeste** : aucun droit existant ne sépare l'associé de
  l'archiviste (ils partagent `ged:fonds:gerer` et `ged:sensible:consulter`). `ged:destruction:proposer` et
  `ged:destruction:viser` sont déjà au manifeste `ged` (ceux de l'assurance) : ils entrent au catalogue de tenant d'auth
  et à la table d'accès du cabinet, hors du jeton ; le manifeste ne change pas de droits, sa recopie au catalogue suit
  sa version. La séparation se juge aussi à la personne : le viseur n'est jamais le proposant.
- **D-1121-3 — La fin de mission est la fermeture du fonds** (STORY-1120) : une pièce permanente n'est pas échue tant
  que le fonds est ouvert ; fermé, l'échéance part de la plus tardive de la fin de période et de la fermeture. La vue
  `conservation.jusquau` de STORY-1088 ne change pas (D-1088-7) ; la liste des échues porte l'échéance qu'elle applique.
- **D-1121-4 — Tout se lit par pages** : la liste des échues, la proposition sans liste et l'exécution parcourent le
  fonds par `pieceId` (pages de 500) ; une proposition porte 5 000 pièces au plus (un bordereau lisible, une
  transaction bornée) ; ses lignes vivent dans leur collection, pas dans un tableau du document.
- **D-1121-5 — Retirer plutôt que refuser à l'exécution** : visa et accord autorisent une destruction, ils n'y obligent
  pas ; une pièce gelée ou sortie après la proposition est gardée et nommée au procès-verbal. Rien d'autre que la liste
  visée ne peut être détruit.
- **D-1121-6 — L'accord du client est son bordereau signé, déposé par le cabinet** (le client n'a pas de compte, PRD
  §6) : même mécanisme que l'exemplaire signé de STORY-1120, sur le `BDE-`.
- **D-1121-7 — Une seule porte qui retire** : `StockageObjets.detruire`, appelée par le seul service de la destruction,
  sur une proposition `EN_EXECUTION` mise par une route humaine ; un invariant de test le garde, comme l'absence de tout
  planificateur répétable sur la file `ged-destructions`.
- **D-1121-8 — Ce qui reste d'une pièce détruite** : de quoi prouver qu'elle a existé, qu'elle était intègre et qu'elle
  a été détruite régulièrement (identité, nature, exercice, date, référence, empreintes, bordereaux et scellés, journal,
  bordereau visé, accord, procès-verbal) ; rien de son contenu (fichiers, texte lu, copies d'export) ni des données
  qu'on n'a plus besoin de garder (tiers, NIF, montant, nom de fichier). Les sauvegardes du stockage s'effacent à leur
  rotation (dit au procès-verbal).
- **D-1121-9 — Aucun fait publié** : l'alerte d'échéance proche et le fait de destruction sont à STORY-1123 (chez D pour
  la cloche et l'e-mail) ; `ged.destruction.decidee@1` reste déclaré, non publié.
- **D-1121-10 — Le papier** : la GED ne détruit pas le papier ; le procès-verbal nomme chaque original encore au
  cabinet (boîte, cote) que le cabinet détruit avec lui. Les boîtes et leurs historiques ne changent pas.

## Nommé pour plus tard

- L'alerte « échéance de conservation proche » et la publication d'une destruction (STORY-1123).
- La liste des pièces échues de tout le cabinet, tous fonds confondus (STORY-1122, avec la recherche sur tous les fonds).
- La destruction des pièces de l'assurance (FR-175 : double visa `RESP` puis `DG`) : le même mécanisme s'y prêtera.
