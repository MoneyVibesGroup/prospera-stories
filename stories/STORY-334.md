# STORY-334 : Le rejet administratif d'un dépôt engagé — consigné avec son motif à l'octet, sa cause en clair et la reprise dans le produit, sans altérer la version déposée

Status: done (2026-11-26 — prospera-fiscal-service#82, `dev` `69d7e65` ; lot 7 de D, n° 11) — fiche écrite et
contrat annoncé avant le code (prospera-stories#1004, `main` 9bcdf01). ⚠️ AC-1 : le fait, la règle et sa preuve sont
livrés ; le retour `DEPOSEE → A_DEPOSER` dans la porte du cycle est à C (demande ouverte, D-334-8).
Écrite le 2026-11-26 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 11,
`PLAN-LOT-7-2026-11-24.md` §4 : « même réalignement que 333 » — avec 537 → 539 et 688 → 691, lot 6 §3). Il n'existait
pas de fiche : les critères viennent d'`epics-fiscalite-2026-08-03.md` (EPIC-032) et de la salle des cabinets du
2026-11-19 (V5).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (chaîne 330 → 337)
**Points :** 3 · **Service :** `fiscal-service` (`:3012`), dossier de D `depots` (D-L7-1)
**FR :** `FR-F44` *(le rejet traité sans perdre l'historique)* · **AD-12** *(le rejet arrive comme un fait séparé ; aucun
nom de pays, de portail ni de guichet dans le domaine)* · AD-9 *(la version scellée ne se récrit pas)* · AD-10 *(le
journal chaîné, sans texte libre ; les textes en clair hors du journal, 329)*
**Dépend de :** **STORY-333** ✅ (fiscal #81, `dev` `fc317a1` : l'accusé d'un dépôt engagé, `AccusesDepotModule`,
`PreuvesDAccuse`, D-333-13) · STORY-330 ✅ (le dépôt engagé) · STORY-332 ✅ (`verifierGuidable`) · **STORY-325** de C ✅
(la version scellée au dépôt ; le retour motivé `POST …/retour` ; **D-325-9** : le rejet `DEPOSEE → A_DEPOSER` laissé à
334) · **STORY-329** de C ✅ (`MongoJournalAudit.ajouter(fait, session, textes?)` : les textes en clair d'un acte, hors du
journal) · STORY-324 de C ✅ (la porte de « Déposée », D-324-7) · STORY-538 (le motif à l'octet, `verifierMotif`).
**Suite :** STORY-335 (l'archivage, l'URL présignée), 336 (le dossier de contrôle : il lira le rejet, son motif et la
retransmission), 562 (le rejet relevé par le connecteur : une seconde source du même fait), 1102 (le premier dépôt réel).

## Histoire

En tant qu'**expert-comptable**, je veux traiter un rejet sans perdre l'historique, afin que la reprise reste traçable.
*(FR-F44)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** un rejet notifié **quand** je l'enregistre avec son motif et sa date **alors** l'obligation revient
   dans le cycle sans qu'aucune version antérieure ne soit altérée.
2. **Étant donné** une obligation rejetée puis redéposée **quand** on consulte son dossier de contrôle **alors** le rejet,
   son motif et le nouveau dépôt y figurent tous les trois.
3. *(Salle des cabinets, V5)* **Étant donné** un rejet enregistré **quand** il s'affiche **alors** sa cause est dite en
   clair (la feuille, la cellule et la règle quand on les connaît) avec la correction proposée, **et** la correction se
   fait dans le produit, jamais dans le fichier déposé.

## Réalignement avec 537 → 539 et 688 → 691 (lu sur `origin/dev`, fiscal `fc317a1`)

| Critère | Ce que le code porte déjà | Couvert ? |
|---|---|---|
| AC-1 — le rejet enregistré, motif et date | **La chaîne des dépôts de liasse** (538) : `POST /depots/{id}/rejet` (`rejeteLe`, `motif` à l'octet, `referenceRejet?`) fait passer un dépôt de liasse `TRANSMISE → REJETEE` ; « un rejet ne clôt rien » (`REJETEE_A_RETRANSMETTRE`, l'échéance court) ; la retransmission crée un dépôt lié (`precedentId`). 689 : la version lue dans le fichier retransmis. | **En partie** : seulement pour un dépôt de **liasse** de l'ancien modèle (dossier, jeu d'états, pays, état). Rien pour une **déclaration** du cycle de C (le dépôt engagé de 330, la version scellée de 325). |
| AC-1 — l'obligation revient dans le cycle | Le cycle de C : `POST …/retour {vers, motif}` (325) revient avant le dépôt, mais **jamais depuis `DEPOSEE`** (`RETOUR_AU_DELA_DU_DEPOT`, D-325-9 : « le rejet est 334 »). `CORRESPONDANCE_DEPOT` écrit `REJETEE_A_RETRANSMETTRE → A_DEPOSER` (D-323-3) ; rien ne la lit. La rectificative (325) ouvre n + 1 depuis `DEPOSEE`, mais un rejet n'est pas une rectificative (D-325-9). | **Non** : le retour est dans un fichier de C (`cycle-obligations.service.ts`, `version-declaration.ts`). |
| AC-1 — aucune version altérée | La version scellée ne se récrit par aucun chemin (325 : schéma, garde AST). | **Oui** (325) ; 334 n'écrit aucune version. |
| AC-2 — rejet, motif, nouveau dépôt | `GET /depots?…` rend la chaîne d'une liasse (rejets et retransmission). Rien pour une déclaration. | **Non.** |
| AC-3 — la cause en clair, la correction dans le produit | Nulle part : 538 ne garde que le motif. | **Non.** |
| 537, 539, 688, 690, 691 | Le premier paquet `TG × DSF`, l'échéance et les pénalités par couple (539 : lues ici, jamais refaites), le solde inversé, les notes, le numéro d'accusé facultatif : sans rapport avec le rejet. | Hors sujet. |

**Diagnostic** : 334 n'est **pas** couverte. 538 couvre le rejet du **dépôt de liasse** (l'ancien modèle, qui reste) ;
manquent le rejet de la **déclaration** (le dépôt engagé de 330, sa version scellée), sa cause en clair et sa reprise, et
le **retour de l'obligation à « À déposer »**. 334 complète sans réécrire 538. Comme en 333, ce qui est dans un dossier
de C (le retour du cycle et la numérotation de la version suivante) est **demandé à C** : D livre le fait, la preuve et
la règle (D-334-8).

## Ce que la story livre

1. **Consigner le rejet d'un dépôt engagé** — `POST /api/v1/depots-declaration/{depotId}/rejet` (JSON) : la date du
   rejet (`rejeteLe`), le **motif** tel que l'administration le rend (à l'octet), sa référence, **la cause en clair**
   (`cause.feuille`, `cause.cellule`, `cause.regle`, chacune quand on la connaît) et la **correction proposée**. Le rejet
   est horodaté, attribué, rattaché à la déclaration **et à sa version déposée** (`obligationId`, `numero`, `empreinte`) ;
   il se consigne une fois par version.
2. **La reprise dans le produit** (AC-3) : la réponse dit la version rejetée (intacte), le retour à faire (`A_DEPOSER`)
   et les étapes de la reprise — corriger dans le produit, produire un livrable neuf, engager, déposer, rapporter
   l'accusé. L'ancien fichier ne se redépose pas : son estampille n'est plus celle de la déclaration (`LIVRABLE_PERIME`,
   330).
3. **Retrouver le rejet et la retransmission** (AC-2) : `GET …/{depotId}/rejet` et `GET /api/v1/depots-declaration/rejets?
   obligationId=…` — chaque rejet, son motif, et **la version déposée ensuite** (le nouveau dépôt) ; c'est ce que le
   dossier de contrôle (336) lira.
4. **La preuve que le retour du cycle lit** : le port `PreuvesDeRejet` (`rejetDe(orgId, obligationId, numero)`) et la
   règle pure `verifierRejetAuRetour` (`409 REJET_REQUIS`), fournis par `AccusesDepotModule` (sans `ObligationsModule`).
   **→ C** : ouvrir `DEPOSEE → A_DEPOSER` sur cette preuve (D-334-8).

## Décisions

- **D-334-1 — Ce que 334 reprend sans le réécrire.** La chaîne de 538 et son rejet (routes, modèle, collection) :
  intacts. Le motif est vérifié par `verifierMotif` de 538 (D-538-5 : non vide, 4 000 caractères au plus, aucun caractère
  de contrôle hors tabulation et sauts de ligne ; refusé, jamais corrigé). Le dépôt engagé de 330, la règle du guidage
  de 332 (`verifierGuidable`), la qualification du retard de 333 (`qualifierRetardAuDepot`) : appelés tels quels.
  **Aucun fichier de C n'est touché.**
- **D-334-2 — Le rejet se consigne sur un dépôt engagé d'une déclaration « Déposée ».** Ordre : le dépôt engagé (`404
  DEPOT_INTROUVABLE`, même réponse hors portée) ; la règle du guidage (`409 DEPOT_REMPLACE`, `409 OBLIGATION_DESACTIVEE`,
  `409 LIVRABLE_PERIME` : l'estampille engagée est la version déposée) ; la déclaration **exactement** `DEPOSEE` (`409
  REJET_NON_CONSIGNABLE`, `{ statut }`) — avant, rien n'est parti ; après « Accusé reçu », le dépôt a été reçu (D-334-5) ;
  les textes (D-334-3) ; la date (D-334-4) ; un accusé déjà consigné pour cette version (`409 ACCUSE_DEJA_CONSIGNE`, `{
  accuseId }`) ; un rejet déjà consigné (`409 REJET_DEJA_CONSIGNE`, `{ rejetId }`) ; puis l'écriture.
- **D-334-3 — Les textes, à l'octet (AC-3).** `motif` : la règle de 538. `reference` (1 à 200), `cause.feuille`,
  `cause.cellule`, `cause.regle` (1 à 200 chacune) et `correctionProposee` (1 à 2 000) : facultatifs, conservés à
  l'octet, refusés s'ils sont blancs, trop longs ou portent un caractère de contrôle (`400 TEXTE_REJET_INVALIDE`, `{
  champ }`). `cause` sans aucun des trois ⇒ le même refus (`{ champ: 'cause' }`). Le produit ne devine pas la cause : il
  la dit telle qu'elle a été relevée (Q-D-32).
- **D-334-4 — La date.** `rejeteLe` (`AAAA-MM-JJ`) est exigée : la date du rejet notifié. Pas avant le **jour** de
  l'engagement, pas après aujourd'hui (`422 DATE_REJET_HORS_BORNES`, `{ min, max }`, D-538-9). L'horodatage est l'instant
  serveur (`consigneLe`).
- **D-334-5 — Accusé et rejet s'excluent, par version** (comme `ACCEPTEE` et `REJETEE` en 538). Un rejet ne se consigne
  pas sur une version qui a son accusé (`ACCUSE_DEJA_CONSIGNE`) ; **l'accusé de 333** ne se consigne plus sur une version
  rejetée (`409 DEPOT_REJETE`, `{ rejetId }`) — un refus de plus sur la route de 333 (annoncé). Un rejet après un accusé
  (un contrôle a posteriori) est une **rectificative** (325, C) : Q-D-31.
- **D-334-6 — Une fois par version.** Clé `(organisation, obligation, numéro)`, index unique `un_rejet_par_version`.
  Un rejet ne se récrit pas, ne se supprime pas. La retransmission (version n + 1) pourra avoir le sien.
- **D-334-7 — « Un rejet ne clôt rien »** (538, AC-4). La réponse porte `retard` : la qualification de 333 à la date du
  rejet (l'échéance applicable, les jours, les pénalités du paquet de dépôt ouvertes par le retard, jamais chiffrées) —
  l'échéance continue de courir. Figé à la consignation.
- **D-334-8 — Le retour au cycle : la règle est à D, la porte reste à C.** `DEPOSEE → A_DEPOSER` est dans
  `CycleObligationsService.revenir` et `verifierRetour` (fichiers de C), et le service n'est pas exporté. D livre :
  - le port `PreuvesDeRejet` (`src/ports/preuves-rejet.ts`) : `rejetDe(orgId, obligationId, numero): Promise<{ rejetId,
    rejeteLe, consigneLe } | null>` ;
  - la règle pure `verifierRejetAuRetour(preuve, { obligationId, numero })` (`src/domain/depot/rejet-depot.ts`) : `null`
    ⇒ `RefusMetier REJET_REQUIS`, nature `TRANSITION_INTERDITE` (409) ;
  - `AccusesDepotModule` l'exporte aussi (le module que C importera en 339 pour `ACCUSE_REQUIS` : un seul import pour
    les deux preuves ; il n'importe toujours pas `ObligationsModule`).
  **→ C (demande ouverte par 334)** : dans `revenir`, de `DEPOSEE` vers `A_DEPOSER` seulement, lire `rejetDe(orgId, id,
  versionCourante.numero)` et appeler `verifierRejetAuRetour` ; la version scellée n reste telle quelle ; le pointeur passe
  à `{ numero: n + 1, nature: 'RETRANSMISSION', versionId: null }` (l'ajout annoncé par D-325-9) ; le dépôt suivant scelle
  n + 1. Le motif du retour reste exigé par la route (C peut citer `rejetId` dans l'acte). ⚠️ **Jusque-là, AC-1 n'est
  tenu que par le fait, la règle et sa preuve** ; la reprise passe par la rectificative de 325 (`POST …/rectificatives`,
  n + 1 nommée `RECTIFICATIVE`, la version n intacte). C'est dit au tracker et au journal ; la réponse ne porte pas de
  drapeau qui changerait à la fusion de C (D-334-9).
- **D-334-9 — La reprise dite par la réponse (AC-3).** `reprise` : `{ versionRejetee: { numero, empreinte }, retour: {
  vers: 'A_DEPOSER' }, etapes: ['REVENIR_A_DEPOSER', 'CORRIGER_DANS_LE_PRODUIT', 'PRODUIRE_LE_LIVRABLE',
  'ENGAGER_LE_DEPOT', 'DEPOSER', 'RAPPORTER_L_ACCUSE'] }` — une liste fermée, pas un texte. Elle ne dépend pas de l'état
  de la demande à C (pas de drapeau qui changerait à sa fusion) : l'écran (FE-081) dira la route.
- **D-334-10 — Le journal chaîné.** Périmètre `depot-declaration:<depotId>` ; acte `DEPOT_DECLARATION_REJET` :
  `rejetId`, `obligationId`, `numero`, `empreinte`, `rejeteLe`, l'empreinte du motif, de la référence, de chaque élément de
  la cause et de la correction (`null` quand absent), `joursDeRetard`, `qualification` — **aucun texte** (AD-10). Les
  textes en clair partent par `MongoJournalAudit.ajouter(fait, session, textes)` (329) dans la base métier
  (`textes_audit`), dans **la même** transaction que le rejet et son acte.
- **D-334-11 — La retransmission lue (AC-2).** `GET …/rejets?obligationId=` rend, pour chaque rejet, `retransmission` :
  la **première version scellée de numéro supérieur** (`{ numero, nature, versionId, scelleLe }`, lue par
  `RegistreVersionsDeclaration` de C), ou `null`. Le rejet, son motif et le nouveau dépôt sont donc lus ensemble ; le
  dossier de contrôle (336) les assemblera.
- **D-334-12 — Le droit.** Consigner un rejet : `fiscalite:declaration:preparer` (D-538-8 : c'est l'acte qui rouvre
  l'obligation ; il ne peut rendre le produit que plus prudent, et chaque heure de retard à le saisir coûte). Le retour
  du cycle reste au droit de C (`deposer`, l'état quitté). Lire : l'accès fiscal.
- **D-334-13 — AD-12, AD-13.** Le domaine (`domain/depot/rejet-depot.ts`), les ports et le cas d'usage entrent dans la
  garde d'AD-12. Aucun champ de secret (corps strict, `forbidNonWhitelisted`).
- **D-334-14 — Aucun événement.** Personne ne consomme un rejet de déclaration aujourd'hui ; aucun topic neuf.
- **D-334-15 — Limite nommée (D-333-13).** Une déclaration passée à « Déposée » sans dépôt engagé n'a pas de rejet
  possible par cette route ; sa reprise est la rectificative (325).

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `POST /api/v1/depots-declaration/{depotId}/rejet` — droit `fiscalite:declaration:preparer` ; JSON : `rejeteLe` (`AAAA-MM-JJ`, exigé), `motif` (exigé, 4 000 au plus), `reference?` (1 à 200), `cause?: { feuille?, cellule?, regle? }` (1 à 200 chacune, une au moins), `correctionProposee?` (1 à 2 000) ; aucune autre clé |
| Réponse 201 | `{ rejetId, depotId, obligationId, dossierId, numero, empreinte, rejeteLe, motif, reference, cause: { feuille, cellule, regle } \| null, correctionProposee, consignePar, consigneLe, retard: { echeance, echeanceLegale, reportee, joursDeRetard, qualification, penalites, source }, reprise: { versionRejetee: { numero, empreinte }, retour: { vers: 'A_DEPOSER' }, etapes: [...] }, statutObligation }` |
| Refus | `400` (corps, `MOTIF_INVALIDE`, **`TEXTE_REJET_INVALIDE`** `{ champ }`) · `403` · `404 DEPOT_INTROUVABLE` · `409 DEPOT_REMPLACE` · `409 OBLIGATION_DESACTIVEE` · `409 LIVRABLE_PERIME` · **`409 REJET_NON_CONSIGNABLE`** (`{ statut }`) · `409 ACCUSE_DEJA_CONSIGNE` (`{ accuseId }`) · **`409 REJET_DEJA_CONSIGNE`** (`{ rejetId }`) · **`422 DATE_REJET_HORS_BORNES`** (`{ min, max }`) · `503` |
| **Route neuve** | `GET /api/v1/depots-declaration/{depotId}/rejet` — l'accès fiscal ; `200` le rejet (mêmes champs) ; `404 DEPOT_INTROUVABLE`, **`404 REJET_INTROUVABLE`** |
| **Route neuve** | `GET /api/v1/depots-declaration/rejets?obligationId=…` — l'accès fiscal ; `200 { obligationId, statutObligation, rejets: [{ ...rejet, retransmission: { numero, nature, versionId, scelleLe } \| null }] }` (le plus récent d'abord) ; `404 OBLIGATION_INTROUVABLE` |
| **Route existante, un refus de plus** | `POST /api/v1/depots-declaration/{depotId}/accuse` (333) : **`409 DEPOT_REJETE`** (`{ rejetId }`) sur une version rejetée (D-334-5) |
| **Code neuf pour C** | `409 REJET_REQUIS` (`TRANSITION_INTERDITE`, `{ obligationId, numero }`) sur `POST /api/v1/obligations/{id}/retour` `{ vers: 'A_DEPOSER' }` depuis `DEPOSEE`, et la nature `RETRANSMISSION` — **quand C l'aura ouvert** (D-334-8) |
| **Journal chaîné** | `depot-declaration:<depotId>` : `DEPOT_DECLARATION_REJET` (empreintes seules) ; textes en clair dans `textes_audit` (329) |
| **Stockage** | collection neuve `rejets_depot` (index unique `un_rejet_par_version`, index `rejet_par_depot`, posés par Mongoose) ; **aucune migration** |
| Aucun | topic, droit neuf, champ d'une route existante |

## Ce que cette story ne fait PAS

- ⛔ Elle ne fait revenir aucune obligation à « À déposer » et ne touche pas un fichier de C (D-334-8) ; elle n'écrit
  aucune version.
- ⛔ Elle ne change rien à la chaîne de 538 ni à son rejet.
- ⛔ Elle ne lit pas la cause dans un fichier rendu par un portail (562) et n'assemble pas le dossier de contrôle (336).

## Definition of Done

- [x] Un rejet consigné (201) avec motif à l'octet, cause, correction, reprise et retard ; chaque refus de D-334-2 → 5 par
      un test ; l'accusé de 333 refusé sur une version rejetée (e2e).
- [x] La lecture d'un rejet et des rejets d'une déclaration, la retransmission lue sur une version scellée plus récente.
- [x] La règle `verifierRejetAuRetour` et le port `PreuvesDeRejet` prouvés ; `AccusesDepotModule` n'importe pas
      `ObligationsModule`.
- [x] **MongoDB réel** (`test:conformite`) : l'index unique ; dix consignations parallèles ⇒ un seul rejet et un seul
      acte ; le rejet, son acte et ses textes tout ou rien ; schéma strict.
- [x] Les gardes d'AD-12 et d'AD-13 vertes.
- [x] **Mutations** qui rougissent sur une assertion.
- [x] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : `docker compose -p grp-d` du fiscal (Redis
      compris) sain, les routes neuves en `401` sans jeton.

## Livraison (2026-11-26)

- **Code** : prospera-fiscal-service#82, fusionnée en rebase sur `dev` (`69d7e65`), rebasée sur `origin/dev` `c459960` — 339 de C, au-dessus de `74b33ec`, qui touchait aussi le contrat OpenAPI et `ObligationsModule` : aucun conflit — avant la fusion. Annonce avant le code :
  prospera-stories#1004 (`main` 9bcdf01). **Aucun écart au contrat annoncé.**
- **Fichiers** (dossiers de D) : `domain/depot/rejet-depot.ts` (pur : la règle de la porte `verifierRejetAuRetour`,
  « consignable », les textes à l'octet, la cause, la correction, les bornes, la reprise, l'acte et les textes hors du
  journal) et son test ; `ports/preuves-rejet.ts`, `ports/registre-rejets-depot.ts` ; `adapters/mongo/rejet-depot.schema.ts`
  (collection `rejets_depot`, index `un_rejet_par_version` et `rejet_par_depot`) et `mongo-registre-rejets-depot.ts` ;
  `modules/depots/accuses-depot.module.ts` (exporte aussi `RegistreRejetsDepot` et `PreuvesDeRejet` ; n'importe toujours
  pas `ObligationsModule`) ; `application/depots/rejets-depot.service.ts` et son test ; `accuses-depot.service.ts`
  (`DEPOT_REJETE`, et `penalitesDeclareesDu` partagée avec le rejet) ; les trois routes dans
  `DepotsDeclarationController`, leurs DTO (`dto/rejet-depot.dto.ts` ; `RetardDepotDto.depuis` dans `accuse-depot.dto.ts`),
  `depots.module.ts` ; la garde d'AD-12 (deux ports de plus) ; `depots-declaration.openapi.spec.ts` ;
  `test/depots-declaration.e2e-spec.ts` (cinq cas de plus), `test/rejets-depot.conformite-spec.ts`,
  `test/utils/registre-rejets-depot-memoire.ts`. **Lus, sans écriture** (dossiers de C) : `verifierMotif` (538, dossier de
  D), `RegistreVersionsDeclaration`, les ports des obligations.
- **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI (trois routes neuves, un refus de plus sur la route de
  l'accusé). Aucune migration.
- **Preuves** :
    - Node 24 (image `verification` de l'archive LF de `8959a3a`, avant le rebase) : unitaires **248/249 suites, 3 708
      tests** (1 suite et 3 tests ignorés : la spec BullMQ sans Redis) ; e2e **14/14 suites, 360 tests** ; **`test:conformite`
      30/30 suites, 189 tests** (dont `rejets-depot.conformite-spec.ts` : l'index unique, dix consignations parallèles ⇒ un
      seul rejet et un seul acte, les textes en clair hors du journal sous leur empreinte, tout ou rien sur une panne du
      journal — ni rejet ni texte —, la relecture et l'isolement, le schéma strict). Après le rebase sur `c459960` (339 de C, au-dessus
      de `74b33ec` : la garde `ACCUSE_REQUIS`, qui fait importer `AccusesDepotModule` par `ObligationsModule`), archive LF
      de `b44eae6` : e2e **14/14 suites, 361 tests**.
    - Node 25 (local) : domaine 12/12, service 13/13, accusé 19/19, OpenAPI et gardes du module `depots` (9 suites, 125
      tests), e2e `depots-declaration` 44/44.
    - **Mutations 29/29**, chacune rouge sur une assertion : la porte du retour sans rejet ; « Accusé reçu » puis « À
      déposer » consignables ; un texte blanc, trop long, porteur d'un contrôle, rogné ; le motif non vérifié ; la
      correction sans ses sauts de ligne ; le nom du champ de la cause perdu ; une cause vide admise ; chaque borne de date
      retirée ; les étapes de la reprise perdues ; le motif en clair au journal ; la cellule perdue à l'acte ; les textes
      absents gardés ; le périmé non vérifié ; « consignable » non vérifié ; l'accusé de la version ignoré ; le rejet déjà
      consigné ignoré ; la date de l'engagement ignorée ; la retransmission qui prend la version rejetée, puis la plus
      récente ; les versions lues sans rejet ; l'accusé admis sur une version rejetée ; le droit `preparer` retiré ; la
      règle de la cause et la correction perdues dans la réponse. Quatre mutants qui rougissaient en compilation (un
      import devenu inutile) ont été réécrits en gardant l'intention ; deux restés verts au premier passage (la règle de la
      cause dans la réponse, le rejet déjà consigné vu avant l'écriture) ont reçu leur assertion, puis ont été rejoués.
    - lint des fichiers touchés et `tsc` 0.
    - §1.5 : pile `grp-d` du fiscal **avec Redis** (image runtime de l'archive de `8959a3a`) : santé `ok` (mongodb, audit,
      kafka, redis) ; les trois routes neuves montées et en `401` sans jeton ; `AccusesDepotModule` initialisé ; 0
      `UnknownDependencies` sur 497 lignes de journal ; les index `un_rejet_par_version` et `rejet_par_depot` posés par
      l'application. Rejouée sur l'arbre rebasé (archive de `b44eae6`) : santé `ok`, les trois routes en `401`, `AccusesDepotModule` initialisé (importé par `DepotsModule` et par `ObligationsModule`), 0 erreur sur 497 lignes, les index posés.
    - **Verrou Docker** : deux prises par les scripts autonomes, de 21:24:18 à 21:43:47 (la passe complète) et de 22:20:23 à 22:22:51 (la passe courte après le rebase), rendues par leur `trap`. B et C prévenus à chaque reddition. Il ne reste aucun conteneur, volume ni réseau
      `grp-d`.

- **Ce qui reste** :
  - **→ C : ouvrir `DEPOSEE → A_DEPOSER` sur un rejet consigné** (D-334-8) — ouverte. Jusque-là, AC-1 n'est tenu que
    par le fait, la règle et sa preuve ; la reprise passe par la rectificative de 325.
  - → 336 : le dossier de contrôle lit le rejet, son motif et la retransmission ; → A (plus tard) : FE-081.
  - Q-D-31, Q-D-32 au PO.

## Questions au PO

- **Q-D-31 — Un rejet qui suit un accusé (un contrôle a posteriori) : rejet ou rectificative ?** **Choix par défaut**
  (D-334-5, comme 538) : l'accusé et le rejet s'excluent pour une version ; après un accusé, la reprise est une
  rectificative (325).
- **Q-D-32 — La cause d'un rejet : la relever à la main, ou la lire dans le fichier rendu par le portail ?** **Choix
  par défaut** (D-334-3) : relevée à la main (feuille, cellule, règle, chacune facultative), dite telle quelle. La lire
  dans le fichier du portail viendra avec le connecteur (562) et le premier rejet réel (1102).
