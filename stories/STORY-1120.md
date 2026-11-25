# STORY-1120 : Fin de mission et réversibilité — le fonds se ferme, s'exporte en entier et se restitue contre signature

Status: done — **livrée le 2026-11-25** : document-service **#34** (`b92ac18` sur `dev`), catalogue **#78**
(`ea10b51`) ; voir « Livraison ». Fiche écrite le 2026-11-25 par la session du groupe B juste avant de la coder (lot 7, n° 2 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 2 ; identifiant réservé D-L7B-1).

**Service :** `document-service` (GitHub `prospera-ocr-service`, module `ged`) · **Points :** 8 · **Dépend de :**
STORY-1119 (journal d'intégrité, certificat ; `b7b3f91`), STORY-1088 (restitution des originaux, `POST …/restitutions`)
· **Suite :** STORY-1121 (la destruction proposée, puis visée) · **Écran :** FE-143 (A, lot 8)
**Sources :** PRD des services du cabinet `prds/prd-services-cabinet-2026-11-18/` (FR-10 : « restitution au client en
fin de mission, avec bordereau signé » ; §3 : « archiver un dossier » ferme un dossier client ; D-SC-5 ; G2 « restitution
numérique » nommée pour plus tard) ; addendum §4 (loi n° 2017-07, ARTP v2.0) ; STORY-1087 (amendement : « en fin de
mission, le cabinet restitue au client les documents qu'il lui a confiés ») ; STORY-1088 (AC-4) ; STORY-1119 (« nommé
pour plus tard » : le journal et les documents probants dans l'export de réversibilité).

---

## Pourquoi

Un cabinet garde les archives d'un client le temps de la mission. Quand elle s'arrête, ou quand le client part chez un
confrère, il doit **tout rendre** : les originaux papier (STORY-1088 le fait déjà, boîte par boîte, avec un bordereau à
signer) **et** les copies numériques, avec ce qui les rend opposables (index, bordereaux, scellés, empreintes, journal,
certificat). Sans cela, le client est captif du cabinet, et le cabinet ne peut pas prouver ce qu'il a remis. Et un fonds
dont la mission est finie ne doit plus rien recevoir : un versement tardif dans le fonds d'un client parti est une
erreur qui se voit trop tard.

## Ce qui est déjà livré (et que cette story ne refait pas)

- **STORY-1088** : la restitution des **originaux** (`POST /fonds/{numero}/restitutions`, `RES-AAAA-NNNNN`, boîtes
  `RESTITUEE`, bordereau PDF avec la place de la signature du client). Cette story s'appuie dessus : le bordereau de
  restitution numérique cite les restitutions papier du fonds et les boîtes encore au cabinet.
- **STORY-1119** : le journal d'intégrité chaîné, le contrôle des empreintes (`controlerFonds`), le certificat
  d'intégrité figé, les documents probants et leur téléchargement à l'octet.
- **`dossier-service`** publie déjà l'archivage d'un dossier : `POST /dossiers/{id}/archiver` écrit `statut: ARCHIVE` et
  publie l'état absolu sur **`dossier.updated`** (même transaction, outbox ; `reactiver` le remet `ACTIF`). Il n'existe
  pas de fait dédié à l'archivage ; `document-service` le projette déjà dans `dossiers_dossier` (STORY-358), où la GED
  le lit pour refuser d'ouvrir un fonds sur un dossier archivé (409 `DOSSIER_ARCHIVE`, STORY-1087). **`dossier-service`
  ne change pas.**

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls**, sous `/api/v1/ged/cabinet` (gate `GED_NOT_ENTITLED`, droits lus par `GET /moi/droits`). **Aucun droit
neuf** (D-1120-6), **aucun fait Kafka publié**, aucune dépendance neuve. Le chemin de l'assurance ne change pas.

### 1. La fermeture du fonds (AC-1, AC-2)

| Geste | Route | Droit |
|---|---|---|
| Fermer un fonds | `POST /ged/cabinet/fonds/{numero}/fermeture` `{ motif: FIN_DE_MISSION \| DEPART_DU_CLIENT, observation? }` → **200** (le fonds) | `ged:fonds:gerer` |

- **Avec le dossier client** (D-1120-1) : la GED s'abonne à **`dossier.updated`** (topic existant de `dossier-service`,
  groupe neuf `ged.dossiers-clients`, depuis le début) ; un message `statut: ARCHIVE` ferme les fonds **ouverts** de ce
  dossier, ouverts avant l'archivage (`ouvertLe ≤ occurredAt`), motif **`DOSSIER_ARCHIVE`**, acteur `SYSTEME`.
  Idempotent : un fonds déjà fermé ne bouge pas, un rejeu n'écrit rien.
- **Irréversible** (D-1120-2) : réactiver le dossier ne rouvre pas le fonds ; un fonds neuf s'ouvre pour la nouvelle
  période (le code du fonds reste au dossier).
- La vue d'un fonds gagne **`etat`** (`OUVERT` | `FERME`) et **`fermeture?`** `{ le, par, motif, origine: CABINET |
  DOSSIER_ARCHIVE, observation? }`.
- **Un fonds fermé refuse tout versement neuf** (D-1120-3) : **409 `FONDS_FERME`** (`details: { fermeLe, motif }`) sur
  le dépôt d'une pièce (`POST /pieces` avec ce fonds), une version neuve (`POST /pieces/{id}/versions`), un versement
  (`POST /fonds/{n}/versements`), une reprise (`POST /fonds/{n}/reprises`), une réception de boîtes (`POST
  /fonds/{n}/receptions`) ; une facture inscrite par la comptabilité ne s'y range plus (elle attend un fonds ouvert,
  `SANS_FONDS`). **Il reste lisible et exportable** : lectures, recherche, contenu, vérification, contrôles, attestations
  et certificat, exports ; et le circuit des originaux reste ouvert pour les rendre (indexation et contrôle des pièces
  déjà reçues, scellé d'un bordereau déjà versé, cotes, sorties, retours, récolement, restitution). Fermer deux fois :
  **409 `FONDS_DEJA_FERME`**.
- Journal d'intégrité : acte neuf **`FERMETURE`** (`details: { motif, origine, bordereaux, scelles }`), dans la
  transaction de la fermeture.

### 2. L'export complet (AC-3, AC-4)

| Geste | Route | Droit |
|---|---|---|
| Demander l'export | `POST /ged/cabinet/fonds/{numero}/exports` → **202** `{ numero: EXP-AAAA-NNNNN, etat: PLANIFIE, demandeLe }` | `ged:fonds:gerer` **et** `ged:sensible:consulter` |
| Les exports d'un fonds | `GET /ged/cabinet/fonds/{numero}/exports` | `ged:fonds:gerer` |
| Un export | `GET /ged/cabinet/exports/{numero}` | `ged:fonds:gerer` |
| Télécharger un volume | `GET /ged/cabinet/exports/{numero}/volumes/{rang}` (`application/zip`, `attachment`, `X-Empreinte-Sha256`) | `ged:fonds:gerer` **et** `ged:sensible:consulter` |

- **Ouvert ou fermé** : un fonds ouvert s'exporte aussi (une copie en cours de mission, `fondsFerme: false`) ; seul un
  export d'un fonds fermé fonde la restitution (§3).
- **Joué par la file BullMQ du service** (D-1120-4), file neuve `ged-exports` (même Redis), une tâche par export,
  rejouable : `PLANIFIE` → `EN_COURS` → `TERMINE` | `ECHOUE`.
- **Complet** (D-1120-5) : **toutes** les pièces du fonds (versées ou non), **toutes** leurs versions, natures sensibles
  comprises (d'où le second droit) ; une version en quarantaine est listée sans son fichier. Le texte lu (OCR) n'est
  pas exporté (dérivé, non probant).
- **En volumes ZIP** (sans compression, D-1120-7) d'au plus **`GED_EXPORT_VOLUME_OCTETS`** (défaut 50 000 000) : les
  volumes `EXP-…-v001.zip`, `-v002.zip`… portent les fichiers en clair (`pieces/<rubrique>/<sous-rubrique>/<exercice>/
  <pieceId>/v<n>.<ext>`), et le volume d'index **`EXP-…-index.zip`** (rang 0) porte :
  `LISEZMOI.txt` (comment vérifier), `fonds.json` (le fonds, sa fermeture), `index.json` et `index.csv` (chaque pièce,
  son index — nature, exercice, date, tiers, montant, référence —, son contrôle humain, son original papier, chaque
  version avec son fichier, son volume et son **SHA-256**), `bordereaux.json` (bordereaux, lignes, scellés, liens,
  vérifications), `journal-integrite.json` (les entrées du fonds, et la chaîne du cabinet vérifiée à l'export),
  `controle-integrite.json` (le contrôle fait à l'export, écarts nommés), `originaux-papier.json` (réceptions, boîtes et
  cotes, restitutions de STORY-1088), `documents-probants/*.pdf` (attestations et certificats du fonds) et
  **`empreintes.sha256`** (format de `sha256sum -c`, tous les fichiers de tous les volumes).
- **Le certificat d'intégrité** : l'export en émet un neuf (`CERT-…`, inscrit `DOCUMENT_EMIS`) quand le fonds le permet
  (un bordereau scellé, aucun écart, journal intact) ; sinon il n'en porte pas et `controle-integrite.json` dit pourquoi
  (`AUCUN_SCELLE`, `INTEGRITE_EN_ECART`, `JOURNAL_ROMPU`) : **le client reçoit ses archives même quand le cabinet ne peut
  pas les certifier**. Chaque fichier relu pendant l'export est rehaché : un écart est nommé dans l'export
  (`FICHIER_MODIFIE`, `FICHIER_ABSENT`).
- Chaque volume est gardé **chiffré** (`GED_CLE_CABINET`), avec son SHA-256 en clair, et se **retélécharge à l'octet** ;
  un volume qui ne redonne plus son empreinte n'est pas servi (409 `INTEGRITE_EN_ECART`).
- Journal : acte neuf **`EXPORT`** à la fin (`details: { export, fondsFerme, volumes, pieces, versions, sensibles,
  ecarts, certificat, empreinteDesVolumes }`) ; acte neuf **`EXPORT_TELECHARGE`** (`export`, `volume`, `empreinte`)
  **avant** que le volume parte (il porte des pièces sensibles : 503 `JOURNAL_INDISPONIBLE` si l'entrée ne s'écrit pas).
- Refus : 404 `FONDS_INCONNU`, `EXPORT_INCONNU`, `VOLUME_INCONNU` ; 409 `EXPORT_NON_TERMINE` ; 503 `FILE_INDISPONIBLE`.

### 3. Le bordereau de restitution, et son exemplaire signé (AC-5)

| Geste | Route | Droit |
|---|---|---|
| Émettre le bordereau | `POST /ged/cabinet/exports/{numero}/bordereau-de-restitution` `{ remisA, remisLe, moyen: TELECHARGEMENT \| SUPPORT_REMIS, observation? }` → **201** (document probant `BRN-AAAA-NNNNN`) | `ged:fonds:gerer` |
| Déposer l'exemplaire signé | `POST /ged/cabinet/documents-probants/{numero}/exemplaire-signe` (multipart : `fichier` PDF, JPEG, PNG ou WEBP, `signePar`, `signeLe`) → **201** (le document, avec `exemplaireSigne`) | `ged:fonds:gerer` |
| Télécharger l'exemplaire signé | `GET /ged/cabinet/documents-probants/{numero}/exemplaire-signe` (`attachment`, `X-Empreinte-Sha256`) | `ged:fonds:gerer` |

- **Le bordereau de restitution numérique** est un **document probant** de STORY-1119 (type neuf
  `BORDEREAU_DE_RESTITUTION`, figé, chiffré, empreinte au journal `DOCUMENT_EMIS`, retéléchargé par `GET
  /documents-probants/{numero}/pdf`). Il porte le fonds, le client, la fermeture, l'export (numéro, date, nombre de
  pièces et de versions), **chaque volume et son SHA-256**, le certificat remis (ou la raison de son absence), les
  restitutions d'originaux de STORY-1088 (`RES-…`, boîtes) et les boîtes encore au cabinet, la manière de vérifier, et
  deux places de signature (le cabinet, le client).
- Il exige un export **`TERMINE` d'un fonds fermé** (409 `EXPORT_NON_TERMINE`, `EXPORT_AVANT_FERMETURE`) ; **un seul
  par export** (409 `BORDEREAU_DEJA_EMIS`, `details.document`).
- **Signé** (D-1120-8) : la signature est manuscrite, sur le papier ; le cabinet **dépose l'exemplaire signé** (scan ou
  PDF), gardé chiffré avec son SHA-256, une seule fois (409 `EXEMPLAIRE_DEJA_DEPOSE` ; 409 `EXEMPLAIRE_NON_ATTENDU` pour
  un autre type de document). Journal : acte neuf **`EXEMPLAIRE_SIGNE`** (`document`, `empreinte` ; ni le nom du
  signataire, ni son contenu). Le document rend `exemplaireSigne?: { deposeLe, deposePar, signePar, signeLe, empreinte,
  typeContenu, journalRang }`.

### Données, configuration, manifeste

- Collection neuve `ged_exports_fonds` (unique `(organisationId, numero)`) ; champ `fermeture` sur `ged_fonds_cabinet` ;
  champ `exemplaireSigne` sur `ged_documents_probants` ; compteurs `export-cabinet|org|année` et
  `probant-BORDEREAU_DE_RESTITUTION|org|année`. Aucune méthode ne supprime.
- Variable neuve **`GED_EXPORT_VOLUME_OCTETS`** ; file BullMQ neuve **`ged-exports`** ; groupe Kafka neuf
  **`ged.dossiers-clients`** (sur `dossier.updated`, existant).
- Manifeste **`ged` 1.5.0** : `consomme` gagne `dossier.updated` ; quatre routes `GET` neuves en `routesLectureSeule`
  (`fonds/{numero}/exports`, `exports/{numero}`, `exports/{numero}/volumes/{rang}`,
  `documents-probants/{numero}/exemplaire-signe`) ; `droits`, `publie` inchangés. **Recopie au catalogue** par B après
  la fusion du code (D-979-24).
- **→ A (FE-143)** : types à régénérer depuis l'OpenAPI de `document-service` quand l'écran viendra (DTO de réponse
  nommés par le module).

## Livraison (2026-11-25)

- **Code** : document-service (`prospera-ocr-service`) **#34**, `b92ac18` sur `dev` : `src/modules/ged/cabinet/`
  `reversibilite.ts` (fermeture, export, lecture de `dossier.updated`, chemins, volumes, CSV, `LISEZMOI`),
  `zip-stocke.ts` (archive ZIP stockée, sans dépendance), `depot-reversibilite.ts` (`ged_exports_fonds`),
  `reversibilite.service.ts`, `reversibilite.controller.ts` (huit routes, DTO de réponse), `export.planificateur.ts`
  (file `ged-exports`), `dossiers-clients-consumer.bootstrap.ts` (groupe `ged.dossiers-clients`) ; `exigerOuvert` dans
  `CabinetService` (pièce, version, versement, reprise) et `PhysiqueService` (réception) ; les factures inscrites ne se
  rangent que dans un fonds ouvert ; `IntegriteService.certifier` et `emettreDocument` (le certificat sans acteur HTTP,
  le bordereau de restitution) ; `DepotGed.piecesDuFondsParPage`. Manifeste `ged` **1.5.0** recopié depuis
  `prospera-stories@f3be71e` (#926), empreinte épinglée.
- **Catalogue** : `platform-catalog-service` **#78**, `ea10b51` sur `dev` : `ged` 1.5.0 recopié depuis
  `prospera-stories@28dc047` (seul manifeste qui change ; `manifestes:garde` verte, 48).
- **Preuves** :
  - Node 25 : unitaires 1243 passés (111 suites ; 2 rouges connues du poste, copies CRLF de `ged.service.spec`, chemins
    Windows de `piece-conservation.spec`) ; e2e **213/213** (16 suites ; `ged-reversibilite` 4/4, recensement de
    STORY-695 compris) ; lint des fichiers touchés, `tsc`, build.
  - Node 24 (étage `verification`, image depuis `git -c core.autocrlf=false archive`) : unitaires 111/111 suites, 1250
    passés ; e2e 213/213.
  - Mutations **21/22** rouges sur assertion (fonds fermé : dépôt, versement, boîtes, facture ; fermer deux fois ;
    fermeture hors transaction ; archivage ancien ; tout statut ; droit sensible ; écart de fichier ; quarantaine ; volume
    altéré ; téléchargement sans trace ; bordereau avant fermeture ; deux bordereaux ; exemplaire deux fois ; rempart du
    dépôt ; CSV ; CRC ; empreintes de l'index ; certificat sur écart) ; **1 équivalente** (export terminé rejoué : le
    second rempart, `commencer()`, le refuse aussi). Catalogue 2/2.
  - **Pile `grp-b` neuve** (image depuis l'archive ; Mongo rs0, Kafka, Redis, MinIO Chainguard ; doublure d'auth ; les
    dossiers par `dossier.created`, l'état publié de `ged` par Kafka ; `GED_EXPORT_VOLUME_OCTETS=200`) : `healthy`,
    aucune ligne d'erreur ; fonds A fermé à la main (200, `FERME`), 409 `FONDS_FERME` sur un dépôt et un versement, 409
    `FONDS_DEJA_FERME` ; **dossier D2 archivé par `dossier.updated`** ⇒ fonds B fermé par `SYSTEME` en 0,1 s, dépôt
    refusé (`DOSSIER_ARCHIVE`), message rejoué sans seconde `FERMETURE` ; export du fonds A **par la file** `TERMINE` en
    0,6 s, certificat neuf `CERT-2026-00002`, volumes retéléchargés à l'octet (SHA-256 = export = `X-Empreinte-Sha256`),
    **Python `zipfile` sans erreur et `sha256sum -c empreintes.sha256` : 12/12 OK** ; `BRN-2026-00001` émis, un seul,
    PDF retéléchargé à l'octet ; exemplaire signé déposé puis retéléchargé ; journal du fonds : `FERMETURE`,
    `DOCUMENT_EMIS` (certificat, bordereau), `EXPORT`, `EXPORT_TELECHARGE`, `EXEMPLAIRE_SIGNE`, chaîne vérifiée (14 rangs) ;
    fonds B exporté sans certificat (`AUCUN_SCELLE`) ; index `un_numero_d_export`, `exports_du_fonds` créés. Verrou
    23:37 → 23:44, `down -v`.
- **Variable neuve** : `GED_EXPORT_VOLUME_OCTETS` (défaut 50 000 000).

### Écarts au contrat, décidés au code

- **D-1120-10** : ajouts seuls à la réponse : `fermeture.journalRang` (le rang de l'entrée `FERMETURE`) et
  `exportNumero` d'un document probant (l'export que restitue un bordereau) ; `DocumentProbantDto.type` s'élargit à
  `BORDEREAU_DE_RESTITUTION`.
- **D-1120-11** : les huit routes ont leurs **DTO de réponse** nommés par le module (`…ReversibiliteDto`,
  `ExemplaireSigneProbantDto`) : A génère ses types sans rien écrire.
- **D-1120-12** : un fichier qui se déchiffre mais ne redonne plus son empreinte est **remis tel quel** dans l'export
  (`empreinteConstatee` à l'index, écart `FICHIER_MODIFIE`) ; un fichier qui ne se déchiffre plus ou manque n'est pas
  remis (`exclu`). Le client reçoit ce que le cabinet a, et sait ce qui a bougé.
- **D-1120-13** : le bordereau et l'exemplaire sont refusés **avant** tout dépôt (aucun PDF orphelin) ; le conditionnel
  sous la transaction (`lierBordereau`, `poserExemplaireSigne`) reste le second rempart d'une course. Le PDF d'un
  document est déposé avant sa transaction, comme D-1119-16.
- **D-1120-14** : la recette de l'Atelier (règle de `document-service`) n'est pas rejouée : le diff ne touche ni l'OCR,
  ni les extractions, ni le module Nest commun (seul `GedModule` gagne des fournisseurs ; un invariant de `src/kafka`
  compte un consommateur de plus) ; leurs e2e passent tels quels sous Node 24 et 25.
- **D-1120-15** : deux exports simultanés d'un même fonds tournent l'un après l'autre (file à concurrence 1) et
  émettent chacun leur certificat (vu sur la pile) ; un dépôt de pièce concurrent d'une fermeture peut passer dans la
  fenêtre (le dépôt ne touche pas au fonds) : il est exporté comme toute pièce.

## Critères d'acceptation

- **AC-1** : un fonds se ferme à la main (fin de mission, départ du client) ou avec son dossier client archivé ; la
  fermeture est inscrite au journal, une seule fois ; elle est irréversible.
- **AC-2** : un fonds fermé refuse tout versement neuf (409 `FONDS_FERME`), reste lisible, contrôlable et exportable ;
  ses originaux se rendent toujours.
- **AC-3** : l'export d'un fonds porte toutes ses pièces et versions en clair, leur index, les bordereaux et scellés,
  les empreintes vérifiables par `sha256sum -c`, le journal du fonds, le contrôle et le certificat d'intégrité (ou la
  raison de son absence), les originaux papier ; il est inscrit au journal.
- **AC-4** : chaque volume se retélécharge à l'octet (SHA-256 = en-tête = export = journal) ; son téléchargement est
  inscrit avant de partir ; une archive ZIP s'ouvre avec un outil standard.
- **AC-5** : le bordereau de restitution d'un export d'un fonds fermé cite chaque volume et son empreinte, les
  restitutions papier et les boîtes encore au cabinet ; l'exemplaire signé se dépose une fois et se retélécharge.
- **AC-6** : aucune suppression ; le chemin de l'assurance ne change pas ; le recensement des routes du cabinet
  (STORY-695) classe les routes neuves.

## Décisions prises au contrat (contestables)

- **D-1120-1 — La GED apprend l'archivage par `dossier.updated`**, déjà publié par `dossier-service` (état absolu,
  `statut: ARCHIVE`) : aucun fait neuf chez le producteur, aucun appel synchrone. Un consommateur propre à la GED
  (groupe `ged.dossiers-clients`) plutôt qu'un crochet dans la projection commune `dossiers_dossier` : la GED ferme ses
  fonds et inscrit son journal sans que le read-model du service dépende d'elle (AD-3). La garde `ouvertLe ≤
  occurredAt` empêche un rejeu depuis le début de fermer un fonds ouvert après une réactivation.
- **D-1120-2 — Irréversible** : la fermeture est un acte probant inscrit au journal ; la rouvrir brouillerait ce que
  l'export et le bordereau ont fixé. Un dossier réactivé ouvre un fonds neuf.
- **D-1120-3 — « Versement neuf » = tout ce qui ajoute du contenu au fonds** (pièce, version, bordereau, reprise,
  facture, boîtes reçues). Ce qui achève l'existant (indexer, contrôler, sceller un bordereau déjà versé) et le circuit
  des originaux restent ouverts : on ferme un fonds pour le rendre, pas pour l'empêcher d'être rendu.
- **D-1120-4 — Un export asynchrone par la file BullMQ du service**, comme les campagnes de STORY-1119 : un gros fonds
  ne tient pas dans une requête HTTP.
- **D-1120-5 — Complet, sensibles comprises** : la réversibilité rend au client tout ce qu'il a confié ; seul qui lit les
  natures sensibles peut produire ou télécharger l'export.
- **D-1120-6 — Aucun droit neuf** : `ged:fonds:gerer` ferme, lit, émet ; `ged:sensible:consulter` en plus pour produire
  et télécharger ce qui porte des pièces sensibles.
- **D-1120-7 — Des volumes ZIP bornés, sans compression, écrits par le service** (pas de dépendance neuve ; les pièces
  sont déjà des PDF et des images) : mémoire bornée par volume, un format que tout poste ouvre, des empreintes
  vérifiables par `sha256sum -c`.
- **D-1120-8 — « Signé » = l'exemplaire signé à la main, déposé et scellé par son empreinte** : ni signature
  électronique qualifiée, ni tiers (D-1119-9) ; le dépôt est inscrit au journal.
- **D-1120-9 — `dossier-service` ne change pas** : la recopie du paquet fiscal demandée par C (STORY-564) attend une
  story qui le touche.

## Nommé pour plus tard

- La lecture de plus de 1 000 pièces d'un fonds par le versement et le contrôle (`DepotGed.piecesDuFonds` borné à 1 000 ;
  l'export lit par pages) : STORY-1122 (gros fonds).
- La destruction visée en fin de conservation (STORY-1121) ; l'alerte d'une fermeture ou d'un export prêt (STORY-1123).
- La restitution numérique par un lien de téléchargement remis au client lui-même (portail client, M2).
