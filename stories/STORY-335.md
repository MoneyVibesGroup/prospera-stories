# STORY-335 : L'archive d'une déclaration déposée — le livrable déposé et la pièce de l'accusé, relus par URL présignée, et l'archive par version que le dossier de contrôle lira

Status: in-progress (2026-11-26) — fiche écrite et contrat annoncé avant le code.
Écrite le 2026-11-26 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 12,
`PLAN-LOT-7-2026-11-24.md` §4 : « même réalignement, en partie » — avec 537 → 539 et 688 → 691, lot 6 §3). Il
n'existait pas de fiche : les critères viennent d'`epics-fiscalite-2026-08-03.md` (EPIC-032) et de la salle des
cabinets du 2026-11-19 (V9).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (chaîne 330 → 337)
**Points :** 3 · **Service :** `fiscal-service` (`:3012`), dossier de D `depots` (D-L7-1)
**FR :** `FR-F45` *(retrouver toute pièce depuis l'obligation)* · **NFR-F07** *(URL présignée à durée limitée, vérifiée
depuis le client qui la consomme)* · AD-9 *(la version scellée)* · AD-10 *(le journal chaîné, sans texte libre)* · AD-12
*(aucun nom de pays, de portail ni de guichet dans le domaine)*
**Dépend de :** **STORY-334** ✅ (fiscal #82, `dev` `69d7e65` : le rejet, `rejets_depot`) · STORY-333 ✅ (l'accusé,
`accuses_depot`, la pièce archivée sous `accuses/` dans le bucket de 682) · STORY-330 → 332 ✅ (le dépôt engagé et son
estampille, le format, le guidage) · **STORY-682** ✅ (le bucket privé `fiscal-depots`, `ArchiveLivrables`, l'URL
présignée re-vérifiée) · STORY-325 de C ✅ (la version scellée).
**Suite :** **STORY-336** (le dossier de contrôle à la demande : il lit l'archive par obligation et par version) ; **→ B**
(la copie dans le fonds d'archives du client, `document-service`, D-335-9).

## Histoire

En tant qu'**expert-comptable**, je veux retrouver toute pièce depuis l'obligation qu'elle concerne, afin de ne plus
fouiller une boîte mail. *(FR-F45)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un livrable ou un accusé **quand** il est archivé **alors** il l'est dans `document-service`, rattaché
   au dossier, à l'implantation, à l'obligation et à la période.
2. **Étant donné** une pièce archivée **quand** je la consulte **alors** l'accès passe par une URL présignée à durée
   limitée, vérifiée depuis le client qui la consomme. *(NFR-F07)*
3. *(Salle des cabinets, V9)* **Étant donné** une liasse déposée **quand** on ouvre le dossier du client des années plus
   tard **alors** la liasse figée, son accusé et la validation du client sont dans le même fonds d'archives que les pièces
   (STORY-1100).

## Réalignement avec 537 → 539, 682 et 688 → 691 (lu sur `origin/dev`, fiscal `69d7e65`)

| Critère | Ce que le code porte déjà | Couvert ? |
|---|---|---|
| AC-1 — le livrable archivé | **La chaîne des dépôts de liasse** (538, 682) : le fichier joint à la transmission est archivé dans le bucket privé `fiscal-depots` (clé `depots/<aléa>`), dans la même opération que le dépôt, sans orphelin. **Le livrable d'une déclaration** (330, 331) est produit **à la demande et sans état** : le classeur exige le classeur fourni par l'appelant (537), le formulaire est rendu en valeurs ; l'engagement ne garde que l'estampille (`numero`, `empreinte`). | **En partie** : seulement pour la **liasse** de l'ancien modèle. Le livrable **déposé** d'une déclaration n'est conservé nulle part. |
| AC-1 — l'accusé archivé | 333 archive la **pièce** de l'accusé (document) dans le même bucket, clé `accuses/<orgId>/<accuseId>`, avec son empreinte ; la référence est gardée à l'octet. | **Oui pour l'objet**, sans lecture. |
| AC-1 — rattaché au dossier, à l'implantation, à l'obligation, à la période | L'accusé et le rejet portent `obligationId`, `dossierId`, `numero` ; l'implantation, le redevable, la taxe et la période sont sur l'obligation (C). Aucune lecture ne rassemble, **par version**, le livrable, l'accusé et le rejet. | **Non** (les rattachements existent, pas l'archive par version). |
| AC-1 — « dans `document-service` » | Rien : le fonds d'archives du client (1100, GED de B) ne reçoit que les factures comptabilisées (`comptabilite.facture.inscrite`) ; sa pièce ne s'indexe ni par obligation, ni par implantation, ni par période ; aucun fait du fiscal n'y est consommé. Le lot 6 a choisi le bucket privé du fiscal pour la preuve du dépôt (682, décision de l'utilisateur sur 538). | **Non**, et pas dans les dossiers de D : **→ B** (D-335-9). |
| AC-2 — URL présignée | 682 : `GET /v1/depots/{id}/fichier` — la portée d'abord, l'objet relu et re-haché, `FICHIER_ARCHIVE_ALTERE` (502) sinon, URL signée par l'endpoint **public** (la signature couvre l'hôte que le client appelle), 300 s par défaut (`MINIO_PRESIGNED_TTL`), throttle 20/min. | **Oui pour la liasse** ; **non** pour la pièce de l'accusé (333 renvoyait l'URL à 335) ni pour un livrable de déclaration. |
| AC-3 (V9) — le même fonds que les pièces | La validation du client (324) est une pièce de C ; le fonds est chez B. | **Non** : → B (D-335-9) ; la validation, → 336 (lue par le port de C). |
| 537, 539, 688 → 691 | Le classeur rempli, le calendrier et les pénalités, le solde inversé, la version lue dans le fichier (689, réemployée ici), les feuilles de notes, l'accusé sans numéro de la liasse. | Rien à reprendre au-delà de 689. |

**Diagnostic** : 335 n'est **pas** couverte ; elle **complète**. Ce qui manque dans les dossiers de D : (1) archiver **le
livrable déposé** d'une déclaration ; (2) le relire, et la pièce de l'accusé, **par URL présignée** (le patron de 682,
tel quel) ; (3) **l'archive par version** d'une déclaration, rattachée au dossier, à l'implantation, au redevable, à la
taxe et à la période, que 336 lira. Ce qui n'est pas dans les dossiers de D : la copie dans le fonds d'archives du client
(`document-service`, B) — **demandée à B**, sans attendre (D-335-9, Q-D-31). 335 ne réécrit ni la chaîne de 538, ni
682, ni l'accusé de 333, ni le rejet de 334.

## Ce que la story livre

1. **Archiver le livrable déposé** — `POST /api/v1/depots-declaration/{depotId}/livrable` (multipart) : pour un format
   **à fichier**, le fichier réellement déposé, dont l'estampille inscrite à sa production (330 : les trois propriétés
   `PROSPERA declaration …`) doit être celle de la version déposée ; pour un **formulaire**, aucun fichier : le produit
   archive lui-même les valeurs du formulaire de la version déposée (331), en JSON. Une fois par version.
2. **Le relire** — `GET /api/v1/depots-declaration/{depotId}/livrable` : l'archive et une URL présignée éphémère, après
   relecture et re-hachage de l'objet (682).
3. **Relire la pièce de l'accusé** — `GET /api/v1/depots-declaration/{depotId}/accuse/piece` : la même règle.
4. **L'archive d'une déclaration, par version** — `GET /api/v1/depots-declaration/archives?obligationId=…` : les
   rattachements de la déclaration et, pour chaque version déposée (la plus récente d'abord), le livrable archivé,
   l'accusé et le rejet ; aucune URL (elles se demandent pièce par pièce). Le cas d'usage
   `ArchivesDepotService.deLaDeclaration` est ce que 336 appellera.

## Décisions

- **D-335-1 — Ce que 335 reprend sans le réécrire.** Le port `ArchiveLivrables` et son adaptateur MinIO (682 : `deposer`,
  `mesurer`, `signer`, `supprimer`, le bucket `fiscal-depots`, l'endpoint public, la durée), la règle
  `verifierFichierArchive` (682, AC-3), le lecteur de propriétés (689, `LecteurProprietesDocument`), l'estampille et ses
  propriétés (330, `PROPRIETES_ESTAMPILLE`), les valeurs du formulaire (331, `valeursDuFormulaire`), la règle du guidage
  (332, `verifierGuidable`, `formatEngage`), l'accusé et le rejet (333, 334 : leurs registres, en lecture). Aucun fichier
  de C n'est touché.
- **D-335-2 — Le livrable s'archive sur un dépôt engagé d'une déclaration déposée.** Ordre : le dépôt (`404
  DEPOT_INTROUVABLE`, la même réponse hors portée) ; la règle du guidage (`409 DEPOT_REMPLACE`, `409
  OBLIGATION_DESACTIVEE`, `409 LIVRABLE_PERIME`) ; la déclaration **déposée** ou au-delà (`409 LIVRABLE_NON_ARCHIVABLE`,
  `{ statut }`) — on archive ce qui a été déposé, donc la version scellée ; le format engagé (`422
  FORMAT_DE_CANAL_NON_DECLARE` : rien à archiver) ; le fichier selon la nature (D-335-3) ; déjà archivé (`409
  LIVRABLE_DEJA_ARCHIVE`, `{ archiveId }`) ; puis l'objet, puis **une** écriture. Droit `deposer` (celui qui dépose
  rapporte ce qu'il a déposé, comme l'accusé). Une version rejetée garde son livrable : c'est la preuve de ce qui a été
  rejeté (334, AC-2 : le rejet et le nouveau dépôt figurent tous les deux).
- **D-335-3 — Le fichier, selon la nature du format.**
  - **À fichier** (`TELEVERSEMENT_FICHIER`) : `fichier` exigé (`422 LIVRABLE_REQUIS`), 15 Mo au plus (`413`) ; le fichier
    est traité comme hostile (le lecteur de 689 : `CLASSEUR_*` s'il n'est pas un classeur lisible) ; ses trois propriétés
    d'estampille doivent égaler `(obligationId, numero, empreinte)` du dépôt engagé (`422 LIVRABLE_NON_CONFORME`, `{
    attendu, lu }`, une propriété absente lue `null`). On n'archive pas un fichier qui dit une autre version.
  - **Formulaire** (`SAISIE_FORMULAIRE`) : aucun fichier (`422 FICHIER_NON_ATTENDU`) ; l'objet archivé est le JSON
    `{ obligationId, format, estampille, champs }` des valeurs de la version scellée, sérialisé une fois par le produit
    (`application/json`). Le dépôt réel se faisant par saisie, ce sont ces valeurs qui ont été déposées.
- **D-335-4 — Une fois par version, rattachée.** Clé `(organisation, obligation, numéro)`, index unique
  `un_livrable_par_version` ; la course de deux archivages en laisse passer un, l'autre lève `LIVRABLE_DEJA_ARCHIVE` et son
  objet est supprimé (aucun orphelin, patron de 333). L'archive porte `archiveId`, `depotId`, `obligationId`,
  **`dossierId`, `implantationId`, `redevableId`, `taxe`, `periode`** (recopiés de la déclaration à l'archivage),
  `numero`, `empreinte`, `nature` (`FICHIER` ou `FORMULAIRE`), `format { pays, etat, version }`, `fichier { sha256,
  taille, type, nom }`, `archivePar`, `archiveLe` ; la **clé** de l'objet (`livrables/<orgId>/<archiveId>`) n'est jamais
  rendue. Aucun chemin ne la récrit ni ne la supprime.
- **D-335-5 — L'URL présignée (AC-2, NFR-F07).** Les deux routes de lecture suivent 682 à la lettre : la portée d'abord
  (hors portée : la même réponse qu'un dépôt inexistant) ; l'objet **relu et re-haché** contre l'empreinte gardée
  (`502 FICHIER_ARCHIVE_ALTERE`, jamais une URL vers autre chose) ; l'URL signée par l'endpoint **public** que le client
  appelle (« vérifiée depuis le client qui la consomme ») ; durée `MINIO_PRESIGNED_TTL` (300 s par défaut) et `expireLe`
  dans la réponse ; régénérée à chaque demande, jamais persistée ; throttle 20/min. Accès fiscal (comme les lectures de 333
  et 334). Refus : `404 LIVRABLE_NON_ARCHIVE` ; pour l'accusé, `404 ACCUSE_INTROUVABLE`, **`404 PIECE_ACCUSE_ABSENTE`**
  (un accusé par référence seule n'a pas de pièce).
- **D-335-6 — L'archive par version (AC-1, pour 336).** Les rattachements viennent de la déclaration (C, en lecture) ; les
  versions sont celles qui ont **au moins une pièce** (un livrable, un accusé ou un rejet), la plus récente d'abord ; pour
  chacune, `livrable`, `accuse` (sans la clé), `rejet` (sans les textes que 334 garde hors du journal : on les relit par sa
  route), chacun `null` s'il manque. Aucune URL. Lecture seule, aucun droit au-delà de l'accès.
- **D-335-7 — Le journal chaîné.** Périmètre `depot-declaration:<depotId>` ; acte `DEPOT_DECLARATION_LIVRABLE_ARCHIVE` :
  `archiveId`, `obligationId`, `numero`, `empreinte`, `nature`, l'empreinte et la taille du fichier. L'archive et son acte
  dans **une** transaction. Aucun acte pour une lecture (682 n'en écrit pas).
- **D-335-8 — AD-12, AD-13.** Le domaine (`domain/depot/archive-depot.ts`), le port (`ports/registre-livrables-archives.ts`)
  et le cas d'usage (`application/depots/archives-depot.service.ts`) entrent dans la garde d'AD-12. La route qui reçoit
  un fichier entre dans la liste fermée de la garde d'AD-13 (aucun champ de secret), comme 333.
- **D-335-9 — `document-service` : la copie dans le fonds du client est demandée à B (AC-1, AC-3).** Le fonds d'archives
  est la GED de B (1100) ; il faudrait y indexer une pièce par obligation, implantation et période, et consommer un fait
  du fiscal. Rien de cela n'est dans les dossiers de D. **→ B (ouverte)** : recevoir dans le fonds du dossier, en copie
  (l'original reste la preuve du fiscal, re-vérifiée), le livrable déposé, la pièce de l'accusé et, quand 336 la lira, la
  validation du client, rattachés à `obligationId`, `implantationId`, `periode`, `numero` ; la forme (un fait
  `fiscal.depot.piece-archivee` avec une route de service qui sert les octets, ou une route de dépôt de B) est à choisir
  par B. **Aucun fait n'est émis par 335** tant que personne ne le consomme (D-333-12) : D l'ajoutera quand B aura choisi.
  ⚠️ Jusque-là, AC-1 est tenu **dans le fiscal** (bucket privé, rattaché, relu par URL présignée), pas dans
  `document-service` ; c'est dit au tracker et au rapport (Q-D-31).
- **D-335-10 — Aucun événement, aucune migration.** Collection neuve `livrables_archives_depot` (index posés par Mongoose
  au démarrage). Aucun topic, aucun droit neuf.

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `POST /api/v1/depots-declaration/{depotId}/livrable` — droit `fiscalite:declaration:deposer` ; multipart : `fichier` (facultatif selon le format, 15 Mo) ; aucune autre clé |
| Réponse 201 | `{ archiveId, depotId, obligationId, dossierId, implantationId, redevableId, taxe, periode, numero, empreinte, nature: 'FICHIER' \| 'FORMULAIRE', format: { pays, etat, version }, fichier: { sha256, taille, type, nom }, archivePar, archiveLe, statutObligation }` |
| Refus | `400` · `404 DEPOT_INTROUVABLE` · `409 DEPOT_REMPLACE` · `409 OBLIGATION_DESACTIVEE` · `409 LIVRABLE_PERIME` · **`409 LIVRABLE_NON_ARCHIVABLE`** (`{ statut }`) · **`409 LIVRABLE_DEJA_ARCHIVE`** (`{ archiveId }`) · `422 FORMAT_DE_CANAL_NON_DECLARE` · **`422 LIVRABLE_REQUIS`** · **`422 FICHIER_NON_ATTENDU`** · **`422 LIVRABLE_NON_CONFORME`** (`{ attendu, lu }`) · `422 CLASSEUR_*` · `413` · `503` |
| **Route neuve** | `GET /api/v1/depots-declaration/{depotId}/livrable` — l'accès fiscal ; `200 { livrable: {…mêmes champs}, url, expireLe }` ; `404 DEPOT_INTROUVABLE`, **`404 LIVRABLE_NON_ARCHIVE`**, `502 FICHIER_ARCHIVE_ALTERE`, `503` |
| **Route neuve** | `GET /api/v1/depots-declaration/{depotId}/accuse/piece` — l'accès fiscal ; `200 { accuseId, piece: { sha256, taille, type, nom }, url, expireLe }` ; `404 DEPOT_INTROUVABLE`, `404 ACCUSE_INTROUVABLE`, **`404 PIECE_ACCUSE_ABSENTE`**, `502 FICHIER_ARCHIVE_ALTERE`, `503` |
| **Route neuve** | `GET /api/v1/depots-declaration/archives?obligationId=…` — l'accès fiscal ; `200 { obligationId, dossierId, implantationId, redevableId, taxe, periode, statutObligation, versions: [{ numero, livrable \| null, accuse \| null, rejet \| null }] }` ; `404 OBLIGATION_INTROUVABLE` |
| **Journal chaîné** | `depot-declaration:<depotId>` : `DEPOT_DECLARATION_LIVRABLE_ARCHIVE` |
| **Stockage** | collection neuve `livrables_archives_depot` (index unique `un_livrable_par_version` `(orgId, obligationId, numero)` et `livrable_par_depot`) ; objets dans le bucket privé de 682 sous `livrables/` ; **aucune migration** |
| Aucun | topic, droit, champ d'une route existante |

## Ce que cette story ne fait PAS

- ⛔ Elle n'écrit rien dans `document-service` et n'émet aucun fait (D-335-9 : → B).
- ⛔ Elle ne change rien à la chaîne de 538, à l'archive de 682, à l'accusé de 333 ni au rejet de 334 ; elle ne fait
  avancer aucun cycle et ne touche aucun fichier de C.
- ⛔ Elle ne produit pas le dossier de contrôle (336) et ne lit pas la validation du client (336, par le port de C).

## Definition of Done

- [ ] Un livrable à fichier conforme archivé (201), relu par URL présignée ; non conforme, absent, en trop, déjà archivé,
      non déposé : chacun refusé par un test ; un formulaire archivé sans fichier, ses valeurs relues à l'octet (e2e).
- [ ] La pièce de l'accusé relue par URL présignée ; un accusé par référence seule ⇒ `PIECE_ACCUSE_ABSENTE` ; un objet
      altéré ⇒ `FICHIER_ARCHIVE_ALTERE`, jamais une URL.
- [ ] L'archive par version : livrable, accusé, rejet, la plus récente d'abord, les rattachements de la déclaration.
- [ ] **MongoDB réel** (`test:conformite`) : l'index unique ; dix archivages parallèles ⇒ un seul et un seul acte ;
      l'archive et son acte tout ou rien ; schéma strict.
- [ ] Les gardes d'AD-12 et d'AD-13 vertes ; **mutations** qui rougissent sur une assertion.
- [ ] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : `docker compose -p grp-d` du fiscal (Redis
      compris) sain, les routes neuves en `401` sans jeton.

## Questions au PO

- **Q-D-31 — La preuve du dépôt vit dans le fiscal ; le fonds du client en reçoit-il une copie ?** L'AC-1 dit « dans
  `document-service` » ; le lot 6 a mis la preuve du dépôt dans le bucket privé du fiscal (682), re-vérifiée à chaque
  lecture. **Choix par défaut** (D-335-9) : l'original reste au fiscal (la preuve, l'empreinte, l'URL présignée) ; la
  GED de B en reçoit une copie rattachée, quand B l'aura ouverte (« → B », journal de D).
