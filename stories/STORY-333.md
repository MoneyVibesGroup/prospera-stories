# STORY-333 : L'accusé d'un dépôt engagé — un document ou une simple référence, consigné une fois, horodaté, rattaché à la version déposée, et le retard qualifié à la date réelle du dépôt

Status: in-progress (2026-11-26 — fiche écrite et contrat annoncé avant le code ; lot 7 de D, n° 10)
Écrite le 2026-11-26 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 10,
`PLAN-LOT-7-2026-11-24.md` §4 : « **d'abord réaligner** avec 537 → 539 et 688 → 691, qui la couvrent en partie (lot 6
§3) : compléter ce qui manque, ou fermer en le disant »). Il n'existait pas de fiche : les critères viennent
d'`epics-fiscalite-2026-08-03.md` (EPIC-032) et de la salle des cabinets du 2026-11-19 (V2).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (chaîne 330 → 337)
**Points :** 5 · **Service :** `fiscal-service` (`:3012`), dossier de D `depots` (D-L7-1)
**FR :** `FR-F42` *(l'accusé, document ou référence)* · `FR-F43` *(le retard qualifié)* · **AD-12** *(l'accusé arrive
comme un fait séparé ; aucun nom de pays, de portail ni de guichet dans le domaine)* · AD-9 *(la version scellée)* · AD-10
*(le journal chaîné, sans texte libre)*
**Dépend de :** **STORY-332** ✅ (fiscal #79, `dev` `8d85c10` : le guidage finit sur `RELEVER_ACCUSE`, une fois, en
dernier) · STORY-330 ✅ (le dépôt engagé, son estampille) · STORY-331 ✅ (le résolveur de format) · **STORY-325** de C ✅
(la version scellée au dépôt, dans la transaction de « Déposée ») · **STORY-324** de C ✅ (la porte de « Déposée »,
D-324-7) · **STORY-317 / 318** de C ✅ (`qualifierRetard`, l'échéance applicable) · STORY-539 (les pénalités du paquet de
dépôt, `penalitesApplicables`) · STORY-327 de C ✅ (les reports déclarés font partie du contenu scellé).
**Suite :** STORY-334 (le rejet administratif, `DEPOSEE → A_DEPOSER`, D-325-9), 335 (l'archivage et l'URL présignée),
1102 (le premier accusé réel), 562 (l'accusé rapporté par le connecteur : une seconde source du même fait).

## Histoire

En tant qu'**expert-comptable**, je veux archiver la preuve du dépôt, afin de pouvoir la produire deux ans plus tard.
*(FR-F42, FR-F43)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un accusé sous forme de document **quand** je le téléverse **alors** il est horodaté et rattaché à la
   déclaration.
2. **Étant donné** un accusé sous forme de simple référence **quand** je la saisis **alors** elle est acceptée au même
   titre qu'un document.
3. **Étant donné** une obligation sans accusé **quand** on tente de la passer à « Accusé reçu » **alors** la transition
   est refusée avec `ACCUSE_REQUIS`.
4. **Étant donné** une date réelle de dépôt postérieure à l'échéance **quand** elle est enregistrée **alors** le retard
   est qualifié et le risque associé affiché.
5. *(Salle des cabinets, V2)* **Étant donné** un accusé capturé **quand** on le cherche **alors** il se retrouve depuis le
   dossier en moins de trois gestes ; le premier accusé réel est celui de STORY-1102.

## Réalignement avec 537 → 539 et 688 → 691 (lu sur `origin/dev`, fiscal `8d85c10`)

| Critère | Ce que le code porte déjà | Couvert ? |
|---|---|---|
| AC-1, AC-2 — l'accusé, document ou référence | **La chaîne des dépôts de liasse** (538) : `POST /depots/{id}/accuse` (`accepteLe`, `numeroAccuse` exigé en téléservice, facultatif ailleurs depuis 691) fait passer un dépôt de liasse `TRANSMISE → ACCEPTEE`, horodaté, attribué, au journal chaîné ; 682 archive le **fichier transmis** (pas l'accusé) ; 689 lit la version dans le fichier ; 681 propage `ACCEPTEE → DEPOSE` à `bilan-service`. | **En partie** : seulement pour un dépôt de **liasse** de l'ancien modèle (dossier, jeu d'états, pays, état), et seulement une **référence** (le numéro). Rien pour une **déclaration** du cycle de C (330 → 332 : le dépôt engagé, sa version), et aucun **document** d'accusé n'est reçu. |
| AC-3 — `ACCUSE_REQUIS` | Le cycle de C (323) passe `DEPOSEE → ACCUSE_RECU` par `CycleObligationsService.transitionner` **sans aucune garde** : le droit `deposer` suffit. La correspondance `ACCEPTEE → ACCUSE_RECU` est écrite (`CORRESPONDANCE_DEPOT`, D-323-3, « que STORY-333 et 334 utiliseront ») mais rien ne la lit. Le code `ACCUSE_REQUIS` n'existe nulle part. | **Non.** |
| AC-4 — le retard à la date réelle | 538 relaie l'échéance de `bilan-service` (jours signés **à la lecture**) ; 539 calcule l'échéance par couple et ouvre les pénalités du paquet de dépôt **à une date donnée** ; 317/318 (C) qualifient le retard d'une obligation à une date donnée (`qualifierRetard`) et alertent tant qu'elle n'est pas déposée. **Aucune date réelle de dépôt** n'est enregistrée pour une déclaration : « Déposée » est horodatée à l'instant du clic (C), et le retard d'une déclaration déposée n'est jamais qualifié. | **Non** (les briques existent : 333 les assemble, sans les refaire). |
| AC-5 — retrouver l'accusé | `GET /depots?…` rend la chaîne d'une liasse. Rien pour une déclaration. | **Non.** |
| 688, 690 | Le solde inversé et les feuilles de notes du livrable e-DSF : sans rapport avec l'accusé. | Hors sujet. |

**Diagnostic** : 333 n'est **pas** couverte. 538 et 691 couvrent l'accusé du **dépôt de liasse** (l'ancien modèle, qui
reste et que `bilan-service` consomme) ; ce qui manque est l'accusé de la **déclaration** (le dépôt engagé de 330, la
version scellée de 325), la garde `ACCUSE_REQUIS` et la qualification du retard à la date réelle. 333 complète ; elle ne
réécrit ni la chaîne de 538 ni son accusé.

## Ce que la story livre

1. **Consigner l'accusé d'un dépôt engagé** — `POST /api/v1/depots-declaration/{depotId}/accuse` (multipart) : un
   **document** (`piece`, un fichier) **ou** une **référence** (`reference`, un texte), ou les deux ; la **date réelle du
   dépôt** (`deposeLe`). L'accusé est horodaté (l'instant serveur de la consignation), attribué, rattaché à la déclaration
   **et à sa version déposée** (`obligationId`, `numero`, `empreinte`). Il se consigne **une fois** par version.
2. **Le retard qualifié à la date réelle** : la réponse et la lecture portent `retard` — l'échéance applicable (le report
   compris), les jours de retard à `deposeLe`, la qualification (`DANS_LES_DELAIS`, `EN_RETARD`, `ECHEANCE_INCONNUE`) et
   **le risque** : les pénalités que le paquet de dépôt du format déclare, ouvertes par le retard seul, jamais chiffrées.
3. **Retrouver l'accusé** : `GET /api/v1/depots-declaration/{depotId}/accuse` et `GET /api/v1/depots-declaration/accuses?
   obligationId=…` (les accusés d'une déclaration, toutes versions : dossier → déclaration → accusé, deux gestes).
4. **La preuve que la garde `ACCUSE_REQUIS` lit** : le port `PreuvesDAccuse` (`accuseDe(orgId, obligationId, numero)`)
   et la règle pure `verifierAccuseAuRecu` (`409 ACCUSE_REQUIS`), fournis par un module de D que `ObligationsModule` peut
   importer sans cycle. **→ C** : l'appeler dans `transitionner` à `vers === 'ACCUSE_RECU'` (D-333-3).

## Décisions

- **D-333-1 — Ce que 333 reprend sans le réécrire.** La chaîne des dépôts de liasse de 538 et son accusé (routes,
  modèle, collection, événement `fiscal.declaration.deposee` vers `bilan-service`) : intacts. Le dépôt engagé de 330
  (`RegistreEngagementsDepot.trouver`, `estPerime`, `DeclarationsEnPortee`) ; le résolveur de format de 331 ; la
  qualification du retard de C (`qualifierRetard`, `domain/obligations/report-echeance.ts`, pure) et les pénalités du
  paquet de dépôt de 539 (`penalitesApplicables`, pure) : lus et appelés, jamais réimplémentés. **Aucun fichier de C n'est
  touché** (`obligations` et `echeances` en lecture seule pour D au lot 7).
- **D-333-2 — L'accusé se consigne sur un dépôt engagé d'une déclaration déposée.** Ordre : le dépôt engagé
  (`404 DEPOT_INTROUVABLE` : inexistant, d'une autre organisation ou hors de la portée — la même réponse) ; `ENGAGE`
  (`409 DEPOT_REMPLACE`, `{ remplacePar }`) ; la déclaration active (`409 OBLIGATION_DESACTIVEE`) et **déposée** — son
  statut est `DEPOSEE` ou au-delà dans le cycle (`409 ACCUSE_NON_CONSIGNABLE`, `{ statut }`) : un accusé est la preuve
  d'un dépôt, il ne précède pas « Déposée », qui reste la porte de C (accord du client, scellement de la version,
  D-324-7) ; **l'estampille engagée égale à la version scellée** (`409 LIVRABLE_PERIME`, `{ numero, empreinte }`) — on
  ne consigne pas l'accusé d'un fichier qui n'est pas la version déposée ; au moins une preuve (`422 ACCUSE_REQUIS`) ;
  les dates (D-333-5) ; puis l'écriture. Droit `deposer` (celui qui dépose rapporte la preuve, comme `ACCUSE_RECU` chez
  C).
- **D-333-3 — `ACCUSE_REQUIS` : la règle est à D, la porte reste à C.** `DEPOSEE → ACCUSE_RECU` passe par
  `CycleObligationsService.transitionner`, fichier de C, et ce service n'est pas exporté par `ObligationsModule` : D ne
  peut ni l'appeler ni le garder sans toucher un dossier de C. D livre donc **la preuve et la règle** :
  - le port `PreuvesDAccuse` (`src/ports/preuves-accuse.ts`) : `accuseDe(orgId, obligationId, numero): Promise<{
    accuseId, consigneLe } | null>` ;
  - la règle pure `verifierAccuseAuRecu(accuse)` (`src/domain/depot/accuse-depot.ts`) : `null` ⇒ `RefusMetier
    ACCUSE_REQUIS`, nature `TRANSITION_INTERDITE` (409, comme les refus du cycle), `details: { obligationId, numero }` ;
  - le module `AccusesDepotModule` (`src/modules/depots/accuses-depot.module.ts`) : la collection et le registre
    seulement, il **n'importe pas** `ObligationsModule` — `ObligationsModule` peut donc l'importer sans dépendance
    circulaire.
  **→ C (demande ouverte par 333)** : dans `transitionner`, à `vers === 'ACCUSE_RECU'`, lire
  `preuves.accuseDe(orgId, id, versionCourante.numero)` et appeler `verifierAccuseAuRecu` (après les gardes d'état, à
  côté de la porte de « Déposée ») ; importer `AccusesDepotModule` dans `ObligationsModule`. Trois lignes et une
  injection ; aucune migration. ⚠️ **Jusqu'à ce que C le fasse, AC-3 n'est tenu que par la règle et sa preuve** : la
  route générique de C laisse encore passer « Accusé reçu » sans accusé. C'est dit dans le tracker et au rapport.
- **D-333-4 — La consignation ne fait pas avancer le cycle.** Elle n'appelle pas `transitionner` (non exporté, D-333-3) :
  l'obligation reste `DEPOSEE` ; « Accusé reçu » se pose ensuite par la route de C, qui lira la preuve. ⛔ Écarté : écrire
  le statut de l'obligation depuis D (contournerait la porte, D-324-7). La réponse dit `statutObligation` et la suite.
- **D-333-5 — Les dates.** `deposeLe` (`AAAA-MM-JJ`) est exigée : c'est la date réelle du dépôt sur le portail, déclarée
  par l'humain (le produit ne la connaît pas en mode assisté). Bornes (leçon de 446 et 538, D-538-9) : pas avant le
  **jour** de l'engagement, pas après aujourd'hui (`422 DATE_DEPOT_HORS_BORNES`, `{ min, max }`). L'horodatage de
  l'accusé est l'instant serveur de la consignation (`consigneLe`), jamais déclaré.
- **D-333-6 — Les deux preuves, au même titre (AC-1, AC-2).**
  - **Document** (`piece`) : 15 Mo au plus, PDF, PNG, JPEG ou XML d'après ses octets (signature lue, jamais le type
    déclaré) ; il est **archivé** dans le bucket privé de 682 (`ArchiveLivrables`, clé neuve `accuses/<orgId>/<accuseId>`,
    jamais une URL stockée) **avant** l'écriture de l'accusé ; l'accusé garde `{ sha256, taille, type, nom }`, l'empreinte
    calculée sur les octets reçus. L'URL présignée de lecture est **335**.
  - **Référence** (`reference`) : 1 à 200 caractères, conservée **à l'octet** (ni rognée ni normalisée, D-538-5) ; refusée
    si elle est blanche ou porte un caractère de contrôle (`400`).
  - `nature` : `DOCUMENT`, `REFERENCE` ou `DOCUMENT_ET_REFERENCE`. Aucune des deux ⇒ `422 ACCUSE_REQUIS` — le même code que
    la garde du cycle : il n'y a pas d'accusé.
- **D-333-7 — Une fois par version.** Clé `(organisation, obligation, numéro)`, tenue par un index unique. Un second
  envoi ⇒ `409 ACCUSE_DEJA_CONSIGNE` (`{ accuseId }`) : l'accusé ne se récrit pas, ne se supprime pas (le guidage le fait
  relever une fois, en dernier). Une rectificative (version n + 1) aura le sien. Un document archivé dont l'écriture perd
  la course est supprimé (aucun orphelin). Aucun autre chemin d'écriture.
- **D-333-8 — Le retard qualifié (AC-4).** `qualifierRetard(obligation, deposeLe)` de C : l'échéance **applicable** (le
  report compris, 317) et les jours de retard à la date réelle. `qualification` : `ECHEANCE_INCONNUE` (pas d'échéance),
  `EN_RETARD` (jours > 0), `DANS_LES_DELAIS`. **Le risque** : les pénalités du paquet de dépôt du format de la déclaration
  (un format à fichier : le couple que le gabarit nomme, `penalites[]` de 536/539), ouvertes par le retard seul, publiées
  telles que le paquet les déclare (taux, assiette, source) — **jamais choisies ni chiffrées** (539 AC-5) ; `source` dit le
  paquet qui les déclare, ou `null` quand aucun paquet n'en déclare pour cette déclaration (un formulaire du mois :
  Q-D-30). Le retard est **figé** à la consignation (il ne bouge plus quand le temps passe) et part au journal.
- **D-333-9 — Le journal chaîné.** Périmètre `depot-declaration:<depotId>` (celui de 330) ; acte
  `DEPOT_DECLARATION_ACCUSE` : `accuseId`, `obligationId`, `numero`, `empreinte`, `deposeLe`, `nature`, l'empreinte du
  document ou `null`, **l'empreinte** de la référence (jamais le texte : AD-10), `joursDeRetard`, `qualification`. L'accusé
  et son acte partent dans **une** transaction.
- **D-333-10 — Jonction avec la chaîne de 538 (reste de D-330-15).** Une seule preuve **par déclaration** : l'accusé de
  la déclaration est celui de 333. La chaîne de 538 reste la trace de transmission d'une **liasse** et ce que
  `bilan-service` consomme ; rien n'est fusionné ni recopié de l'une à l'autre. Qu'un accusé de déclaration propage
  `DEPOSE` à `bilan-service` est hors périmètre (aucun consommateur ne l'attend ; à revoir au premier dépôt réel, 1102).
- **D-333-11 — AD-12, AD-13.** Le domaine (`domain/depot/accuse-depot.ts`), le port et le cas d'usage
  (`application/depots/accuses-depot.service.ts`) entrent dans la garde d'AD-12 (aucun nom de pays, de portail ni de
  guichet). La route reçoit un fichier : elle entre dans la liste fermée de la garde d'AD-13 de 560 (aucun champ de
  secret), comme D-330-17.
- **D-333-12 — Aucun événement.** Personne ne consomme un accusé de déclaration aujourd'hui ; aucun topic neuf.
- **D-333-13 — Limite nommée.** Une déclaration passée à « Déposée » sans dépôt engagé (avant 330, ou sans passer par
  lui) n'a pas d'accusé possible par cette route : l'engagement exige `A_DEPOSER`. Rattrapage : le retour motivé de 334.

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `POST /api/v1/depots-declaration/{depotId}/accuse` — droit `fiscalite:declaration:deposer` ; multipart : `piece` (fichier, facultatif, 15 Mo), `reference` (texte, facultatif, 1 à 200), `deposeLe` (`AAAA-MM-JJ`, exigé) ; aucune autre clé |
| Réponse 201 | `{ accuseId, depotId, obligationId, dossierId, numero, empreinte, nature: 'DOCUMENT' \| 'REFERENCE' \| 'DOCUMENT_ET_REFERENCE', reference: string \| null, piece: { sha256, taille, type, nom } \| null, deposeLe, consignePar, consigneLe, retard: { echeance, echeanceLegale, reportee, joursDeRetard, qualification: 'DANS_LES_DELAIS' \| 'EN_RETARD' \| 'ECHEANCE_INCONNUE', penalites: [{ tauxPourcent, assiette, source }], source: { pays, etat, version } \| null }, statutObligation }` |
| Refus | `400` (corps, référence) · `404 DEPOT_INTROUVABLE` · `409 DEPOT_REMPLACE` · `409 OBLIGATION_DESACTIVEE` · **`409 ACCUSE_NON_CONSIGNABLE`** (`{ statut }`) · `409 LIVRABLE_PERIME` · **`409 ACCUSE_DEJA_CONSIGNE`** (`{ accuseId }`) · **`422 ACCUSE_REQUIS`** · **`422 DATE_DEPOT_HORS_BORNES`** (`{ min, max }`) · **`422 PIECE_ACCUSE_TYPE_REFUSE`** · `413` (pièce trop grosse) · `503` |
| **Route neuve** | `GET /api/v1/depots-declaration/{depotId}/accuse` — l'accès fiscal ; `200` l'accusé (mêmes champs) ; `404 DEPOT_INTROUVABLE`, **`404 ACCUSE_INTROUVABLE`** |
| **Route neuve** | `GET /api/v1/depots-declaration/accuses?obligationId=…` — l'accès fiscal ; `200 { obligationId, accuses: [...] }` (le plus récent d'abord) ; `404 OBLIGATION_INTROUVABLE` |
| **Code neuf pour C** | `409 ACCUSE_REQUIS` (`TRANSITION_INTERDITE`, `{ obligationId, numero }`) sur `POST /api/v1/obligations/{id}/transition` `{ vers: 'ACCUSE_RECU' }` — **quand C l'aura branché** (D-333-3) |
| **Journal chaîné** | `depot-declaration:<depotId>` : `DEPOT_DECLARATION_ACCUSE` |
| **Stockage** | collection neuve `accuses_depot` (index unique `(orgId, obligationId, numero)` posé par Mongoose au démarrage) ; objets dans le bucket privé de 682 sous `accuses/` ; **aucune migration** |
| Aucun | topic, droit, champ d'une route existante |

## Ce que cette story ne fait PAS

- ⛔ Elle ne fait passer aucune obligation à « Déposée » ni à « Accusé reçu » et ne touche pas un fichier de C (D-333-3,
  D-333-4).
- ⛔ Elle ne change rien à la chaîne de 538, à son accusé ni à l'événement vers `bilan-service` (D-333-10).
- ⛔ Elle ne consigne aucun rejet (334), ne délivre aucune URL présignée (335) et ne branche aucun connecteur (561, 562).

## Definition of Done

- [ ] Un document seul, une référence seule, les deux : chacun consigné (201), horodaté, rattaché à la version déposée ;
      aucun des deux ⇒ `ACCUSE_REQUIS` ; un second envoi ⇒ `ACCUSE_DEJA_CONSIGNE` (e2e).
- [ ] Les refus de D-333-2 et D-333-5, chacun par un test ; le document archivé avant l'écriture, supprimé si elle échoue.
- [ ] Le retard : dans les délais, en retard (les pénalités du paquet de dépôt, la source), le report compris, sans
      échéance ; figé à la consignation.
- [ ] La règle `verifierAccuseAuRecu` et le port `PreuvesDAccuse` prouvés ; `AccusesDepotModule` n'importe pas
      `ObligationsModule`.
- [ ] **MongoDB réel** (`test:conformite`) : l'index unique ; dix consignations parallèles ⇒ une seule et un seul acte ;
      l'accusé et son acte tout ou rien ; schéma strict.
- [ ] Les gardes d'AD-12 et d'AD-13 vertes.
- [ ] **Mutations** qui rougissent sur une assertion.
- [ ] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : `docker compose -p grp-d` du fiscal (Redis
      compris) sain, les routes neuves en `401` sans jeton.

## Questions au PO

- **Q-D-30 — Les majorations de retard des déclarations du mois (TVA, IS, retenues…) : quel paquet les déclare ?**
  Aujourd'hui seul le paquet de dépôt de la liasse (`TG × DSF`) porte `penalites[]` ; un paquet de formulaire ne décrit que
  la forme (331), et le paquet fiscal n'en déclare pas. **Choix par défaut** (D-333-8) : le retard d'une déclaration du mois
  est qualifié (jours, `EN_RETARD`), et le risque dit `source: null` (« aucun paquet ne déclare de pénalité ») au lieu
  d'inventer un taux. Les déclarer ne coûtera qu'une donnée de paquet.
