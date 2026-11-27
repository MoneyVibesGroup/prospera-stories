# STORY-336 : Le dossier de contrôle à la demande — en une action, tout ce qu'un contrôleur peut demander sur un périmètre, et l'intégrité des chaînes d'audit attestée

Status: done (2026-11-27 — prospera-fiscal-service#87, `dev` `a991963` ; lot 7 de D, n° 13) — fiche écrite et
contrat annoncé avant le code (prospera-stories#1020, `main` e75e593).
Écrite le 2026-11-27 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 13,
`PLAN-LOT-7-2026-11-24.md` §4). Il n'existait pas de fiche : les critères viennent d'`epics-fiscalite-2026-08-03.md`
(EPIC-032), et des stories qui renvoient au dossier de contrôle (322, 323, 324, 328, 329, 334, 335, 339, 1101, 1119).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (chaîne 330 → 337)
**Points :** 5 · **Service :** `fiscal-service` (`:3012`), dossier de D `depots` (D-L7-1)
**FR :** `FR-F52` *(produire en une action tout ce qu'un contrôleur peut demander)* · AD-9 *(la version scellée)* · AD-10
*(le journal chaîné)* · AD-12 *(aucun nom de pays, de portail ni de guichet dans le domaine)*
**Dépend de :** **STORY-335** ✅ (fiscal #85, `dev` `108221e` : l'archive par version, `ArchivesDepotService.deLaDeclaration`)
· 330 → 334 ✅ (le dépôt engagé, l'accusé, le rejet) · de C, en lecture : 322 (le triplet et ses écarts), 323 (le visa), 324
(la validation du client), 325 (les versions scellées), 328 (les anomalies et leurs levées motivées), 329 (le chemin d'un
montant, le journal vérifié), 339 (`detail.basesLegales`).
**Suite :** **STORY-337** (le rapprochement des pièces justificatives, par la route de 338 de C) : il remplit la place
`rapprochementPieces` que 336 laisse à `null` (D-336-9).

## Histoire

En tant qu'**expert-comptable**, je veux produire en une action tout ce qu'un contrôleur peut demander, afin d'aborder un
contrôle sans reconstitution. *(FR-F52)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un périmètre choisi (dossier, période, taxe) **quand** je demande le dossier de contrôle **alors** il
   contient versions, validations, dépôts, accusés, règlements, pièces et bases légales invoquées.
2. **Étant donné** un dossier de contrôle produit **quand** on vérifie les chaînes d'audit qu'il couvre **alors** leur
   intégrité est attestée.

Et ce que d'autres stories ont promis au dossier de contrôle : l'écart et son motif (322, AC-3) ; la levée motivée d'une
anomalie (328, AC-3 ; 1101) ; le visa (323) ; la pièce du client (324) ; le rejet, son motif et le nouveau dépôt (334,
AC-2) ; l'archive par version (335).

## Diagnostic (lu sur `origin/dev`, fiscal `108221e`)

Recherche « dossier de contrôle », « contrôle fiscal », « vérification » dans les fiches et le code : **aucun dossier de
contrôle n'existe**. Le seul `dossierDeControle` du code est un nom de variable de l'e2e de 328 (C), qui appelle `GET
/exercices/{id}/obligations/anomalies`. Ce qui existe, morceau par morceau :

| Ce que l'AC demande | Ce qui existe déjà | Couvert ? |
|---|---|---|
| Versions | 325 (C) : `RegistreVersionsDeclaration.deLObligation`, exporté par `ObligationsModule` ; chaque version scellée porte son contenu et son `empreinte` (`empreinteDuContenu`, pur). | Par obligation, oui ; sur un périmètre, non. |
| Validations | 323 (C) : le visa sur l'obligation et sur chaque version scellée. 324 (C) : les pièces du client (`RegistreValidationsClient.deLObligation`, port de C **non exporté**) et l'exigence du dossier. | Par obligation ; le port du client n'est pas exporté (D-336-4). |
| Dépôts | 330 (D) : `RegistreEngagementsDepot` ne lit un dépôt que par son identifiant ; l'index `depots_par_obligation` existe, aucune méthode ne s'en sert. | **Non** (D-336-5). |
| Accusés, rejets, livrables | 333 → 335 (D) : `ArchivesDepotService.deLaDeclaration` (par version, la plus récente d'abord). | Par obligation, oui. |
| Règlements | 322 (C) : le payé du triplet (`tripletDe`, pur) et l'écart payé − déclaré, motif compris. EPIC-033 (340 → 342, C) : en vol ou à venir. | Le constaté seulement (D-336-7). |
| Pièces | 329 (C) : l'étape `pieces` du chemin (les pièces des cahiers) ; 335 : les pièces du dépôt ; 324 : la pièce du client. | Par obligation. |
| Bases légales invoquées | L'article de l'obligation (`baseLegale`, du paquet) ; 339 (C) : `detail.basesLegales` du chemin, texte cité mot pour mot. | Par obligation (`HistoriqueObligationsService.chemin`, **non exporté** : D-336-4). |
| Anomalies et écarts motivés | 328 (C) : `anomaliesDe` (pur) — ouvertes et levées, motif compris ; 322 : les écarts du triplet. | Par obligation. |
| AC-2 — intégrité des chaînes | 299 : `verifierChaine` (pur, nomme la première rupture) ; `GET /depots/{id}/audit` et `/obligations/{id}/historique` vérifient **une** chaîne. | Une chaîne à la fois ; jamais toutes celles d'un périmètre. |

**Diagnostic** : 336 n'est **pas** couverte ; elle **assemble**. Tout ce qu'elle rend existe déjà, par obligation et par
une lecture à chaque fois ; ce qui manque est (1) **le périmètre** (dossier, année, redevable, taxe, période), (2) **une
seule action** qui réunit tout pour chaque obligation du périmètre, (3) **l'attestation** de toutes les chaînes couvertes
(celle de chaque obligation et celle de chacun de ses dépôts) et de l'empreinte de chaque version scellée, (4) **une
empreinte du dossier produit**, pour qu'on puisse vérifier plus tard qu'il n'a pas été retouché. Une seule méthode neuve
hors du dossier lui-même : lire les dépôts engagés d'une obligation (D-336-5). Aucun fichier de C n'est touché.

## Ce que la story livre

**`GET /api/v1/dossiers-controle?dossierId=…&annee=…[&redevableId=…][&taxe=…][&periode=…]`** : le dossier de contrôle du
périmètre, en une réponse :
- le périmètre, l'instant et l'auteur de la production, l'exigence de validation du client du dossier ;
- pour **chaque obligation** du périmètre (désactivées comprises, avec leur motif) : ce qui la situe, l'article qui la
  fonde, la version courante, **les versions scellées**, **les validations** (le visa, les pièces du client), **les dépôts
  engagés**, **l'archive par version** (livrable, accusé, rejet : 335), **le triplet** (calculé, déclaré, payé, écarts et
  motifs : le règlement constaté), **les anomalies** (ouvertes et levées, motif compris), **le chemin du montant** (329 :
  le détail du moteur, ses **bases légales** citées mot pour mot (339), la balance, le journal, **les pièces**), et la
  place du rapprochement des pièces (337) ;
- **l'intégrité** : chaque chaîne d'audit couverte, vérifiée (`intacte`, le nombre d'entrées, la première rupture
  nommée, l'empreinte de tête), ses entrées comprises pour qu'on la re-vérifie hors du produit ; chaque version scellée,
  son empreinte recalculée ; un statut d'ensemble `ATTESTEE`, `ROMPUE` ou `RIEN_A_ATTESTER` ;
- **l'empreinte du dossier** (SHA-256 de sa forme canonique, ce champ retiré).

## Décisions

- **D-336-1 — Ce que 336 reprend sans le réécrire.** L'archive par version (335, `ArchivesDepotService.deLaDeclaration`,
  qui garde sa portée), `verifierChaine` et `serialiserCanonique` (299), `JournalAudit.chaine`, `tripletDe` (322),
  `anomaliesDe` (328), `empreinteDuContenu` et `versionCouranteDe` (325), `HistoriqueObligationsService.chemin` (329, 339).
  Les obligations, leurs versions et les pièces du client sont **lues** par les ports et les services de C ; rien n'est
  écrit. La copie au fonds d'archives du client (`CopieAuFondsDArchives`, « h » servie par B le 27/11) n'est pas touchée :
  elle a sa sous-session, après 336.
- **D-336-2 — Le périmètre.** `dossierId` (exigé) et `annee` (exigée, l'année de l'obligation, comme le calendrier du
  dossier) ; `redevableId` (par défaut `entreprise`, un redevable à la fois comme 563) ; `taxe` et `periode` facultatifs,
  comparés à l'octet. Le dossier est lu d'abord chez `dossier-service` avec le jeton de l'appelant : hors de sa portée ou
  d'une autre organisation, la réponse est celle de `dossier-service` (`404 DOSSIER_INTROUVABLE`), avant toute lecture
  d'obligation. Les obligations **désactivées** sont comprises (`active`, `desactivation` avec son motif) : un contrôleur
  peut demander pourquoi une obligation a été écartée. Un périmètre sans obligation rend `200`, `obligations: []` et
  `integrite.statut: RIEN_A_ATTESTER` (jamais « attesté » sur rien). Au-delà de **100** obligations : `422
  PERIMETRE_TROP_LARGE` (`{ obligations, maximum }`), à resserrer par la taxe ou la période.
- **D-336-3 — Une action, aucune écriture.** La production est une lecture : ni collection, ni acte au journal, ni
  événement (comme les lectures de 682 et de 335). Le dossier est recalculé à chaque demande ; son empreinte (D-336-8)
  permet de prouver plus tard qu'un exemplaire remis n'a pas été retouché. Tracer la production elle-même : Q-D-33.
- **D-336-4 — Ce que C n'exporte pas, instancié en lecture dans le module de D.** `ObligationsModule` exporte
  `RegistreObligations` et `RegistreVersionsDeclaration`, pas `HistoriqueObligationsService` (le chemin) ni
  `RegistreValidationsClient` (les pièces du client). `DepotsModule` (fichier de D) les **fournit lui-même**, avec leurs
  adaptateurs de C (`MongoRegistreValidationsClient`, `HttpSourceCheminBalance`, `MongoAnnuaireCollaborateurs`), sans
  modifier un fichier de C — comme il fournit déjà `HttpSourceDossier` et `MongoJournalAudit`. Aucune méthode d'écriture
  n'est appelée. **→ C (information, non bloquante)** : si C préfère exporter ces deux fournisseurs depuis
  `ObligationsModule`, D importera au lieu de fournir ; un constructeur qui change chez C se voit au démarrage (§1.5).
- **D-336-5 — Les dépôts engagés d'une obligation.** `RegistreEngagementsDepot.deLObligation(orgId, obligationId)` :
  tous ses dépôts engagés (`ENGAGE` et `REMPLACE`), du plus ancien au plus récent, sur l'index `depots_par_obligation`
  déjà posé (330). Lecture seule ; la règle « deux écritures, pas une de plus » du port ne change pas.
- **D-336-6 — Les validations.** Le visa de l'associé (323) tel que l'obligation le porte, et celui de chaque version
  scellée ; les pièces de validation du client (324), la plus récente d'abord, chacune avec les obligations et le déclaré
  qu'elle a validés, sa référence (pièce de la GED ou référence libre) et son empreinte ; l'exigence du dossier, une fois
  en tête. 336 ne télécharge ni ne re-vérifie la pièce de la GED : la route de B `GET
  /api/v1/ged/cabinet/pieces/{pieceId}/versions/{version}` (1119) le permet, et la lecture de la GED `GET
  /api/v1/ged/cabinet/dossiers/{dossierId}/pieces-fiscales?obligationId=…` (1124, « h ») est citée en **référence
  facultative** : 336 n'en dépend pas, la source reste l'archive du fiscal (335).
- **D-336-7 — Les règlements.** Ce que le produit sait aujourd'hui du règlement : le payé du triplet (322), avec l'écart
  payé − déclaré et son motif. Le montant à régler (340, C, en vol), l'ordre (341) et le rapprochement du règlement
  (342) n'existent pas encore sur `dev` : ils rejoindront le dossier quand C les aura livrés (une suite, sans changer ce
  qui est déjà rendu).
- **D-336-8 — L'intégrité (AC-2).**
  - **Les chaînes couvertes** : `obligation:<id>` pour chaque obligation, et `depot-declaration:<depotId>` pour chacun de
    ses dépôts engagés. Chacune est lue entière (`JournalAudit.chaine`) et vérifiée par `verifierChaine` : `intacte`,
    `entrees`, la **première rupture** nommée (`SEQ_MANQUANTE`, `SEQ_DUPLIQUEE`, `EMPREINTE_PRECEDENTE_ROMPUE`,
    `EMPREINTE_ALTEREE`, `PERIMETRE_MELANGE`) ou `null`, et `tete` (l'empreinte de la dernière entrée, la genèse pour une
    chaîne vide). Les **entrées** sont rendues telles que le journal les garde (aucun texte libre : AD-10), pour qu'un tiers
    refasse le calcul hors du produit (forme canonique : JSON à clés triées, SHA-256).
  - **Les versions scellées** : l'empreinte de chaque version est recalculée sur son contenu (`empreinteDuContenu`) et
    comparée à celle qu'elle porte (`intacte`).
  - **Le statut** : `ATTESTEE` si toutes les chaînes et toutes les versions sont intactes ; `ROMPUE` sinon (la réponse
    reste `200` : un dossier qui montre sa rupture est ce que le contrôleur doit voir) ; `RIEN_A_ATTESTER` sans obligation.
  - **L'empreinte du dossier** : `sha256:` de la forme canonique de la réponse, le champ `empreinte` retiré.
  - ⚠️ La disparition de la **dernière** entrée d'une chaîne ne se voit pas par le chaînage seul (299) : le rôle MongoDB
    l'interdit. L'empreinte de tête rendue permet de la constater d'un dossier à l'autre.
- **D-336-9 — La place de 337.** Chaque obligation porte `rapprochementPieces: null` : 337 y mettra le rapprochement des
  pièces (la part non documentée, à la granularité annoncée), lu par la route de 338 de C. Rien d'autre n'est réservé.
- **D-336-10 — AD-12.** Le domaine (`domain/depot/dossier-controle.ts`) et le cas d'usage
  (`application/depots/dossier-controle.service.ts`) sont dans le périmètre de la garde d'AD-12 (dossiers déjà gardés).
- **D-336-11 — Le coût.** Les obligations sont lues une fois (`duDossier`) ; pour chacune, les lectures partent par lots
  de quatre ; le chemin interroge `balance-service` (329) et ne fait jamais échouer le dossier (une étape arrêtée est
  nommée, comme dans `/chemin`). Throttle 10/min.
- **D-336-12 — Aucune migration, aucun événement, aucun droit neuf.** L'accès fiscal (rôles `TENANT_ADMIN`,
  `TENANT_USER`), comme les lectures de 335 et de 329.

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `GET /api/v1/dossiers-controle` — l'accès fiscal ; requête : `dossierId` (ObjectId, exigé), `annee` (entier, exigé), `redevableId` (facultatif, défaut `entreprise`), `taxe` (facultatif), `periode` (facultatif) ; aucune autre clé |
| Réponse 200 | `{ perimetre: { dossierId, annee, redevableId, taxe \| null, periode \| null }, produitLe, produitPar, exigenceValidationClient, obligations: [{ obligationId, dossierId, implantationId, redevableId, taxe, periode, libelle, echeance, statut, active, desactivation, baseLegale, versionCourante, versions: [...], validations: { visa, client: [...] }, depots: [...], archive: [{ numero, livrable, accuse, rejet }], triplet, anomalies: [...], chemin, rapprochementPieces: null }], integrite: { statut: ATTESTEE \| ROMPUE \| RIEN_A_ATTESTER, chaines: [{ perimetre, obligationId, depotId \| null, intacte, entrees, rupture \| null, tete, journal: [...] }], versions: [{ obligationId, numero, empreinte, recalculee, intacte }] }, empreinte }` — les sous-objets ont la forme des routes existantes (`/obligations/{id}`, `/versions`, `/validations-client`, `/depots-declaration/archives`, `/chemin`) |
| Refus | `400` (requête mal formée) · `403` · `404 DOSSIER_INTROUVABLE` (même réponse hors portée) · **`422 PERIMETRE_TROP_LARGE`** (`{ obligations, maximum: 100 }`) · `429` · `503` |
| **Port de D** | `RegistreEngagementsDepot.deLObligation` (lecture) |
| Aucun | collection, index, migration, acte au journal, topic, droit, champ d'une route existante ; aucun fichier de C |

## Ce que cette story ne fait PAS

- ⛔ Elle n'écrit rien (ni collection, ni journal, ni fait) et ne fait avancer aucun cycle.
- ⛔ Elle ne branche pas la copie au fonds d'archives du client (le fait `fiscal.depot.piece-archivee` et la route de
  service : sous-session de suite de 335) et ne dépend pas de la GED de B.
- ⛔ Elle ne rapproche pas les pièces (337) et ne calcule pas le montant à régler (340, C).
- ⛔ Elle ne produit ni PDF ni archive ZIP : le dossier est une réponse JSON vérifiable ; l'écran et l'export sont à A.

## Definition of Done

- [x] Un périmètre (dossier, année, taxe, période) rend, pour chaque obligation, versions, validations, dépôts,
      accusés, rejets, livrables, triplet, anomalies levées avec leur motif, chemin avec `detail.basesLegales` et pièces
      (e2e) ; un dossier hors portée ⇒ `404` avant toute lecture d'obligation ; plus de 100 obligations ⇒ `422`.
- [x] Les chaînes intactes ⇒ `ATTESTEE` ; une entrée altérée, une entrée manquante, une version au contenu changé ⇒
      `ROMPUE`, la rupture nommée ; un périmètre vide ⇒ `RIEN_A_ATTESTER` ; l'empreinte du dossier se recalcule.
- [x] **MongoDB réel** (`test:conformite`) : `deLObligation` des dépôts engagés (ordre, isolement par organisation).
- [x] La garde d'AD-12 verte ; **mutations** qui rougissent sur une assertion.
- [x] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : `docker compose -p grp-d` du fiscal (Redis
      compris) sain, la route neuve en `401` sans jeton, aucune dépendance manquante au démarrage.

## Livraison (2026-11-27)

- **Code** : prospera-fiscal-service#87, fusionnée en rebase sur `dev` (`a991963`), partie d'`origin/dev` `108221e`, à jour au moment de la fusion (aucun rebase nécessaire) ; head `1e6ec93`, arbre identique. Annonce avant le code :
  prospera-stories#1020 (`main` e75e593). **Aucun écart de route, de champ ni de code de refus au contrat annoncé.**
- **Deux précisions, sans effet sur le contrat** :
  - l'empreinte du dossier est calculée sur la réponse **telle qu'elle part** (le DTO), par la règle pure
    `empreinteDuDossier` : un tiers retire `empreinte`, sérialise la forme canonique (JSON à clés triées, sans espace) et
    retrouve le SHA-256 (prouvé en e2e) ;
  - l'archive par version est rendue par le DTO de 335 (`ArchiveDeLaDeclarationDto`) : la clé d'un objet archivé n'y est
    jamais (prouvé en e2e).
- **Accord avec C (27/11, D-336-4)** : `DepotsModule` fournit lui-même, en lecture, `HistoriqueObligationsService`,
  `RegistreValidationsClient` (`MongoRegistreValidationsClient`), `HttpSourceCheminBalance` et `MongoAnnuaireCollaborateurs`.
  C ne les exporte pas pour l'instant ; il annonce dans « ⚠ Communs » et par message, avant la fusion, tout changement de
  leurs constructeurs, dépendances injectées ou signatures, et joue toute la suite du fiscal (l'e2e de D compris) avant
  chaque push. L'export reste possible, sur demande de D (une petite PR de C).
- **Fichiers** (dossiers de D) :
  - le domaine : `domain/depot/dossier-controle.ts` (pur : périmètre, borne, lots, attestation d'une chaîne et d'une
    version, statut, empreinte du dossier) et son test ;
  - le cas d'usage : `application/depots/dossier-controle.service.ts` et son test ;
  - la route : `modules/depots/dossier-controle.controller.ts`, `dto/dossier-controle.dto.ts`,
    `dossier-controle.openapi.spec.ts` ; `depots.module.ts` (le contrôleur, le cas d'usage, les fournisseurs de C en
    lecture, `PaquetsModule`, cinq schémas enregistrés en lecture) ;
  - le port `RegistreEngagementsDepot.deLObligation`, son adaptateur Mongo et son double mémoire ;
  - les tests : `test/dossier-controle.e2e-spec.ts`, un cas dans `test/engagements-depot.conformite-spec.ts`.
- **Lu, sans écriture** (dossiers de C) : les obligations, leurs versions, les pièces du client et l'exigence, le chemin du
  montant ; les règles pures `tripletDe`, `anomaliesDe`, `empreinteDuContenu`.
- **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI (une route neuve). Aucune migration, aucun
  `app.module.ts`, aucun fichier de C. `CopieAuFondsInerte` non touché (suite de 335).
  - **Preuves** :
    - Node 24 (image `verification` de l'archive LF de `7cf09cd`) : unitaires **255/256 suites, 3 841 tests (1 suite et 3 tests ignorés : la spec BullMQ sans Redis)** ; e2e **15/15 suites, 378 tests** (dont
      `test/dossier-controle.e2e-spec.ts`, 9 cas : 401, les 400, 404 hors portée avant toute lecture, AC-1 en une action,
      AC-2 attestée, rompue sur une entrée réécrite, rompue sur une version au contenu changé, périmètre vide, 422) ;
      `test:conformite` **31/31 suites, 197 tests** (dont `deLObligation` : ordre, `ENGAGE` et `REMPLACE`, cloisonnement par organisation,
      plan sur l'index `depots_par_obligation`).
    - Node 25 (local) : règles pures 18, service 9, OpenAPI 7, e2e du dossier 9/9 ; les suites du dépôt, du coffre et
      des gardes (24 suites, 484 tests) vertes une fois les copies du paquet réécrites en LF (piège connu des fins de
      ligne : 65 rouges avant, tous sur l'empreinte du paquet de dépôt ; `application/depots` rejoué 8/8, 163).
    - **Mutations 43/43**, chacune rouge sur une assertion :
      - le domaine : le redevable par défaut ; une chaîne vide gardée ; la taxe, puis la période ignorées ; la taxe sans
        casse ; la borne à 100 ; les nombres du refus ; des lots de trois ; le dernier lot perdu ; la rupture toujours
        nulle ; la tête prise à la première entrée ; une chaîne vide sans genèse ; le journal non rendu ; le dépôt perdu ;
        une version toujours intacte ; les chaînes, puis les versions ignorées au statut ; un périmètre vide attesté ; le
        champ `empreinte` compté dans l'empreinte ; une forme non canonique ;
      - le service : la portée du dossier non lue ; les désactivées exclues ; le redevable non transmis ; la borne
        contournée ; le périmètre non filtré ; les chaînes des dépôts ignorées ; la chaîne d'un dépôt lue sous
        l'obligation ; les versions non attestées ; l'auteur perdu ; le chemin d'une autre obligation ; un lot lu en partie ;
        le double mémoire qui rend les dépôts de toutes les obligations ;
      - la route et la réponse : l'empreinte calculée sur autre chose ; le rejet, la désactivation, la levée, le visa, la
        rupture perdus ; une période sans format ; une année sans borne basse ; la taxe non transmise ;
      - le stockage (MongoDB réel, sous Docker) : `deLObligation` trié du plus récent ; sans l'organisation.
      - Quatre mutants rougissaient d'abord en compilation (un import, un paramètre devenus inutiles) : ils ont été
        réécrits en gardant l'intention, puis rejoués. Un seul est resté vert au premier passage (le double mémoire qui
        rend les dépôts de toutes les obligations) : il a reçu son assertion (service, `1e6ec93`, une spec unitaire seule,
        jouée sous Node 25) et a été rejoué rouge.
    - lint des fichiers touchés et `tsc` : 0.
    - §1.5 : pile `grp-d` du fiscal **avec Redis** (image runtime de l'archive de `7cf09cd`) : santé `ok` (mongodb, audit, kafka, redis) ; `GET /api/v1/dossiers-controle` montée et en `401` sans jeton (les
      archives de 335 et le chemin de 329 aussi) ; `DepotsModule`, `ObligationsModule`, `AccusesDepotModule`, `PaquetsModule`
      initialisés, 0 `UnknownDependencies` ni `OverwriteModelError` sur 526 lignes de journal (les fournisseurs de C en
      lecture dans `DepotsModule` se résolvent) ; l'index `depots_par_obligation` posé.
    - **Verrou Docker** : deux prises par des scripts autonomes, chacune rendue par son `trap` : 01:53:24 → 02:12:29 (passe 1 sur `7cf09cd` : unitaires, e2e, conformité, deux mutations MongoDB, pile) et 02:12:50 → 02:16:18 (la mutation MongoDB réécrite). B et C prévenus. Il ne reste aucun conteneur, volume ni réseau `grp-d`.

## Questions au PO

- **Q-D-33 — La production d'un dossier de contrôle se trace-t-elle ?** Qui l'a produit, quand, sur quel périmètre, avec
  quelle empreinte. **Choix par défaut** (D-336-3) : non, c'est une lecture ; l'empreinte rendue suffit à prouver qu'un
  exemplaire remis n'a pas été retouché. Si oui : un acte au journal chaîné d'un périmètre `dossier-controle:<dossierId>`.
