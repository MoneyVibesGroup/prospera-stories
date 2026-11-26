# STORY-330 : Le port de canal asynchrone et la production du livrable — le fichier exact, estampillé de la version qu'il emballe, et un dépôt engagé qui rend un identifiant, jamais un accusé

Status: done (2026-11-26 — prospera-fiscal-service#76, `dev` `7d48fd9` ; lot 7 de D, n° 7) — fiche écrite et
contrat annoncé avant le code (prospera-stories#978, `main` 6f6b797).
Écrite le 2026-11-26 par la sous-session du groupe D juste avant de coder (lot 7 de D, n° 7,
`PLAN-LOT-7-2026-11-24.md` §4) ; contrat et fichiers communs annoncés avant le code (« ⚠ Contrats » et « ⚠ Communs » du
journal de D). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md` (EPIC-032).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle (**la première story de D dans l'épic** ; chaîne
330 → 337, puis 561 qui attend 331)
**Points :** 8 · **Service :** `fiscal-service` (`:3012`), dossiers de D `depots` et `livrables-depot` (D-L7-1)
**FR :** `FR-F39` *(le livrable au format exact du canal)* · **AD-11** *(le contenu de la liasse vient de
`bilan-service`)* · **AD-12** *(le canal est un adaptateur derrière un port asynchrone ; aucun nom de pays, de portail ni
de guichet dans le domaine)* · AD-9 *(les versions, 325)* · AD-10 *(le journal chaîné, sans texte libre)*
**Dépend de :** **STORY-325** de C ✅ (fiscal #75, `dev` `7e2bff8` : D-325-11 — une version se nomme `(obligationId,
numero)`, le port `RegistreVersionsDeclaration`, `empreinteDuContenu(contenuDeclareDe(obligation))`) · **STORY-324** de C
✅ (la porte de « Déposée », D-324-7) · STORY-537, 536, 538, 682, 689 (le livrable de la liasse, le registre des paquets de
dépôt, la chaîne des dépôts de liasse, l'archive, la version lue dans le fichier).
**Suite :** STORY-331 (le format de canal décrit comme une donnée du paquet), 332 (le guidage d'un dépôt engagé), 333
(l'accusé, fait séparé), 334 (le rejet), 561 (le connecteur, second adaptateur du même port).

## Histoire

En tant que **collaborateur de cabinet**, je veux obtenir le fichier exact attendu par l'administration, afin de ne pas
le reconstituer à la main. *(FR-F39, AD-11, AD-12)*

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-032)

1. **Étant donné** une déclaration validée **quand** je demande son livrable **alors** il est produit au format déclaré
   du canal.
2. **Étant donné** une déclaration de liasse ou d'états financiers **quand** le livrable est produit **alors** son contenu
   est **obtenu de `bilan-service`** et n'est jamais reproduit ici.
3. **Étant donné** un dépôt **quand** il est engagé **alors** l'appel rend un identifiant de dépôt **et** l'accusé n'est
   jamais une valeur de retour : il arrive comme un fait séparé.
4. **Étant donné** le domaine **quand** on le fouille **alors** aucun nom de pays, de portail ou de guichet n'y figure.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `7e2bff8`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Le livrable de la liasse (537, 680 → 701) | le classeur du contribuable rempli depuis la liasse **figée** lue chez `bilan-service` avec le jeton de l'appelant (AD-11) ; propriétés « PROSPERA format … » dans le fichier ; sortie déterministe ; sans état. Le format est choisi **par l'appelant** (`POST /livrables-depot/{pays}/{etat}`) | `application/livrables-depot/produire-livrable-depot.service.ts`, `domain/livrable-depot/` |
| Le registre des paquets de dépôt (536) | un paquet publié par couple `(pays, état)`, vérifié par sha256 ; un seul aujourd'hui, `TG × DSF` 1.3, support `TABLEUR` | `modules/paquets-depot/registre-paquets-depot.ts` |
| La chaîne des dépôts de liasse (538, 681, 682, 689) | transmis (déclaré par l'utilisateur, fichier joint, archivé), accepté (accusé), rejeté ; **déjà en deux temps** : transmettre rend un identifiant, l'accusé et le rejet arrivent par leurs routes | `application/depots/depots.service.ts`, `domain/depot/depot.ts` |
| L'obligation (C) | `gabarit` et `canal`, recopiés du catalogue du paquet fiscal (`TG×DSF` et `TELESERVICE_OTR` pour la DSF ; `gabarit: null` pour la TVA, l'IS…) ; le cycle à onze états | `ports/registre-obligations.ts`, `domain/obligations/derivation.ts` |
| Les versions (325, C) | la version courante (`versionCourante`), les versions scellées au dépôt, `empreinteDuContenu(contenuDeclareDe(o))` | `domain/obligations/version-declaration.ts`, `ports/registre-versions-declaration.ts` |
| La porte de « Déposée » (324, 325, C) | `A_DEPOSER → DEPOSEE` par `CycleObligationsService.transitionner` seul : l'accord du client, le scellement de la version | `application/obligations/cycle-obligations.service.ts` |

**Ce qui manque** : le livrable n'est demandé qu'à partir d'un couple `(pays, état)` et d'une liasse, jamais à partir
d'**une déclaration** ; rien ne dit quelle version il emballe ; aucun port de canal n'existe (le mode `DECLARE` de 538 est
un « crochet inerte » qui attendait 330) ; aucune garde ne tient AC-4.

## Ce que la story livre

1. **Le livrable d'une déclaration** — `POST /api/v1/livrables-declaration/{obligationId}` : le format se lit **sur la
   déclaration** (son `gabarit`, donnée du paquet fiscal), jamais dans la requête ; la déclaration doit être validée ; le
   livrable est **estampillé** du numéro de version et de l'empreinte du contenu qu'il emballe (D-325-11), dans le fichier
   et dans la réponse. Pour la liasse, le contenu vient de `bilan-service` par le producteur de 537, inchangé (AC-2).
2. **Le port de canal `CanalDeDepot`** (`src/ports/canal-depot.ts`) et son premier adaptateur, **le dépôt assisté**
   (`src/adapters/canal-depot/canal-assiste.ts`) : engager rend un `DepotEngage` — un identifiant, un mode, un statut, un
   instant — et **aucun champ d'accusé** (AC-3).
3. **L'engagement d'un dépôt** — `POST /api/v1/depots-declaration` et sa lecture `GET /api/v1/depots-declaration/{depotId}`
   : le dépôt engagé nomme la version et l'empreinte du livrable qu'il dépose ; il est idempotent ; un livrable périmé est
   refusé, et dit à la lecture.
4. **La garde d'AD-12** (`src/modules/depots/garde-ad12.spec.ts`) : aucun nom de pays, de portail ou de guichet dans le
   domaine du dépôt, son port, son adaptateur et ses cas d'usage (AC-4).

## Décisions

- **D-330-1 — Ce que 330 reprend sans le réécrire.** Le producteur du classeur (537) : la nouvelle route l'appelle, il
  ne change que d'un paramètre facultatif (les propriétés d'estampille, D-330-4) ; sa route `POST /livrables-depot/{pays}/
  {etat}` ne change pas d'un octet. Le registre des paquets de dépôt (536). La chaîne des dépôts de liasse (538) : ni ses
  routes, ni son modèle, ni sa collection ne changent. Les versions et l'empreinte de 325, la porte de « Déposée » de 324
  (C) : lues, jamais réimplémentées.
- **D-330-2 — Le format est celui que la déclaration déclare (AC-1).** Le `gabarit` de l'obligation, recopié du catalogue
  du paquet fiscal, nomme le paquet de dépôt sous la forme `<pays>×<état>` ; le registre de 536 rend sa version active.
  ⛔ Absent : `422 FORMAT_DE_CANAL_NON_DECLARE` (détails `{ champ: 'gabarit', canal }`) — le produit ne choisit pas un
  format à la place du paquet. Mal formé : `422 FORMAT_DE_CANAL_ILLISIBLE` (`{ champ: 'gabarit', valeur }`). Non publié :
  `422 PAQUET_DEPOT_NON_PUBLIE` (le refus existant). Aujourd'hui, seule la DSF porte un gabarit : les déclarations du mois
  (TVA, IS, retenues…) répondent `FORMAT_DE_CANAL_NON_DECLARE`, et c'est **331** qui décrit leurs formulaires comme une
  donnée du paquet (le refus de 330 nomme le champ absent ; celui de 331 nommera le champ incomplet).
- **D-330-3 — « Validée », c'est `VALIDEE` ou au-delà.** Avant : `409 DECLARATION_NON_VALIDEE` (`{ statut }`). Une
  obligation écartée : `409 OBLIGATION_DESACTIVEE` (le refus de C). Une rectificative rouverte (version n + 1 en
  préparation) n'a pas de livrable tant qu'elle n'est pas revalidée. Une obligation déposée, close comprise, garde le sien :
  il emballe **la version scellée** (D-330-4). Droit : `preparer` (comme 537).
- **D-330-4 — L'estampille.** `{ numero, empreinte }` : la version **scellée** si la version courante l'est
  (`versionCourante.versionId`, lue par `RegistreVersionsDeclaration.trouver`) ; sinon le contenu courant,
  `empreinteDuContenu(contenuDeclareDe(obligation))`. Elle part dans le fichier (trois propriétés de document de plus :
  `PROSPERA declaration obligation`, `PROSPERA declaration version`, `PROSPERA declaration empreinte`, à côté de celles du
  format et de la liasse) et dans deux en-têtes de réponse, `X-Declaration-Version` et `X-Declaration-Empreinte`, exposés au
  navigateur. La transmission de 538 ne relit que les propriétés du format : elle ignore celles-ci.
- **D-330-5 — AC-2 : la liasse n'est jamais reproduite.** Le contenu du classeur vient de `bilan-service` par
  `SourceLiasseFigee`, avec le jeton de l'appelant, par le producteur de 537 ; la nouvelle route n'ajoute aucun calcul. La
  liasse figée est désignée par l'appelant (`jeuEtatsId`, `version`), comme en 537 et en 1101 ; **le dossier est celui de
  l'obligation**, jamais celui du corps. ⚠️ Limite nommée : rien ne vérifie ici que l'exercice de la liasse est celui de
  l'obligation (`bilan-service` ne le rend que sous la forme de dates de début et de fin) ; la vérification se fait au
  guidage (332) et au dépôt réel (1102).
- **D-330-6 — Le port (AC-3).** `CanalDeDepot` : `mode` (`ASSISTE` aujourd'hui) et `engager(demande): Promise<DepotEngage>`,
  où `DepotEngage = { depotId, mode, statut: 'ENGAGE', engageLe, rejoue }`. ⛔ Aucun champ d'accusé, ni dans le type, ni
  dans la réponse : un test fige les clés, l'OpenAPI le montre, et la garde d'AD-12 refuse tout membre `accuse*` ou
  `numeroAccuse` dans le port. Une seule implémentation, `CanalAssiste`, fournie par `DepotsModule` : **il ne fait rien
  dans l'appel**, parce qu'un humain dépose, guidé (332), et rapporte l'accusé plus tard (333). **561** ajoute le
  connecteur et le choix de l'adaptateur (le repli sur l'assisté), sans toucher le port : l'engagement est enregistré par le
  registre partagé avant que l'adaptateur ne soit appelé, ce qui rend le rejeu gratuit pour les deux (561, AC-5).
- **D-330-7 — Engager n'est pas transmettre (Q-D-27).** L'engagement laisse l'obligation à `A_DEPOSER`. « Déposée »
  correspond à `TRANSMISE` (D-323-3, C) et reste la porte de C (`CycleObligationsService.transitionner` : accord du client,
  scellement de la version, D-324-7). Un engagement qui passerait à « Déposée » éteindrait l'alerte d'échéance d'un dépôt
  que personne n'a encore fait sur le portail. Le dépôt engagé est ce que le guidage (332) affiche, et ce que l'accusé (333)
  viendra clore comme un fait séparé.
- **D-330-8 — Ce qu'engager exige.** La portée (le dossier de l'obligation, lu chez `dossier-service` : hors portée ⇒
  `404 OBLIGATION_INTROUVABLE`, la même réponse qu'une obligation inexistante) ; le droit `deposer` ; l'obligation à
  `A_DEPOSER` (`409 DEPOT_NON_ENGAGEABLE`, `{ statut }`) et active ; **l'estampille du livrable égale à celle de la
  déclaration à l'instant** (`409 LIVRABLE_PERIME`, `{ numero, empreinte }` courants) — un déclaré remplacé depuis la
  production du livrable le rend périmé, et le produit le dit au lieu de laisser déposer un fichier qui dit autre chose ; un
  gabarit déclaré mais non publié : `422 PAQUET_DEPOT_NON_PUBLIE`. Une déclaration sans gabarit s'engage (format `null`) :
  son guidage (332) la portera.
- **D-330-9 — Un seul dépôt engagé en vol par version.** Clé : `(organisation, obligation, numéro)`, tenue par un index
  unique partiel (`statut: 'ENGAGE'`). Même estampille ⇒ `200`, le même `depotId`, `rejoue: true`, rien d'écrit ; deux
  engagements parallèles ⇒ un seul. Estampille nouvelle (le déclaré a changé à `A_DEPOSER` après un premier engagement) ⇒
  l'ancien passe `REMPLACE` (il reste lisible) et le nouveau est créé, dans **une** transaction avec leurs deux actes au
  journal chaîné. Aucun autre chemin d'écriture : un engagement ne se récrit pas, ne se supprime pas.
- **D-330-10 — Le journal chaîné.** Périmètre `depot-declaration:<depotId>` ; actes `DEPOT_DECLARATION_ENGAGE`
  (`obligationId`, `dossierId`, `numero`, `empreinte`, `canal`, `mode`, la référence du format ou `null`, `remplaceId`) et
  `DEPOT_DECLARATION_REMPLACE` (`remplacePar`). Aucun texte libre.
- **D-330-11 — La lecture dit si le livrable est périmé.** `GET /depots-declaration/{depotId}` : l'engagement, le statut de
  l'obligation, et `perime` (l'estampille engagée comparée à celle de la déclaration à la lecture) — c'est ce que D-325-11
  demandait à 330 de dire. Même portée que l'obligation ; aucun droit fiscal au-delà de l'accès (comme `GET /depots/{id}`).
- **D-330-12 — La garde d'AD-12 (AC-4).** Elle lit le **texte entier** (code et commentaires) des fichiers hors tests du
  domaine du dépôt (`domain/depot`, `domain/livrable-depot`, `domain/paquets-depot`, `domain/completude-depot`), du port
  (`ports/canal-depot.ts`, `ports/registre-engagements-depot.ts`), de l'adaptateur (`adapters/canal-depot/`) et des cas
  d'usage du dépôt (`application/depots`, `application/livrables-depot`, `application/completude-depot`). Liste fermée : les
  pays de la zone franc et leurs voisins (noms, adjectifs, capitales), leurs codes ISO écrits en littéral, et les portails et
  guichets connus (`GUDEF`, `dimana`, e-services, `OTR`, `DGI`…). Elle s'éprouve sur des témoins (un texte qui en porte un
  rougit). Les données (paquets, fixtures) et les tests n'y entrent pas : un pays y est une donnée. 561 y ajoutera son
  adaptateur (son AC-6).
- **D-330-13 — L'accord du client n'est pas vérifié à l'engagement.** Rien ne part à l'engagement assisté ; la porte est à
  « Déposée » (C). **→ 561** : le connecteur, lui, transmet : il vérifiera `verifierValidationClientAuDepot` avant d'agir
  (D-324-7) — `RegistreValidationsClient` n'est pas exporté par `ObligationsModule` aujourd'hui, la demande à C se fera
  avec 561.
- **D-330-14 — Aucun événement.** Personne ne consomme un dépôt engagé ; aucun topic neuf.
- **D-330-15 — Deux traces de dépôt coexistent, nommées.** La chaîne de 538 (une liasse transmise, son fichier, son
  accusé) et le dépôt engagé de 330 (une déclaration, sa version, son canal). La chaîne de 538 est la trace de transmission
  du canal à fichier ; **333** dira comment l'accusé d'un dépôt engagé et celui d'une chaîne se rejoignent (une seule
  preuve par déclaration). Rien n'est fusionné ici.
- **D-330-16 — Les chemins.** `livrables-declaration` et `depots-declaration` plutôt que `livrables-depot/declarations/…` :
  `livrables-depot/{pays}/{etat}` capterait le premier segment. Les deux contrôleurs sont gardés au niveau de la classe.

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `POST /api/v1/livrables-declaration/{obligationId}` — droit `fiscalite:declaration:preparer` ; multipart : `classeur` (fichier, 15 Mo), `jeuEtatsId`, `version`, `signataire[nom]`, `signataire[qualite]`, `signataire[dateSignature]` (facultatif), `expertComptable[nom]`, `expertComptable[numeroOrdre]` (les champs de 537 moins `dossierId`, pris sur l'obligation) |
| Réponse 200 | le classeur rempli (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`), en pièce jointe ; en-têtes `X-Format-Depot`, `X-Format-Depot-Checksum`, `X-Livrable-Sha256` (ceux de 537) **+ `X-Declaration-Version`** (le numéro) **+ `X-Declaration-Empreinte`** (`sha256:…`) |
| Refus | `404 OBLIGATION_INTROUVABLE` · `409 DECLARATION_NON_VALIDEE` · `409 OBLIGATION_DESACTIVEE` · `422 FORMAT_DE_CANAL_NON_DECLARE` · `422 FORMAT_DE_CANAL_ILLISIBLE` · `422 PAQUET_DEPOT_NON_PUBLIE` · et tous ceux de 537 (classeur, liasse, déclarant, amont) |
| **Route neuve** | `POST /api/v1/depots-declaration` — droit `fiscalite:declaration:deposer` ; corps `{ obligationId, numero, empreinte }` (aucune autre clé) |
| Réponse 201 / 200 | `{ depotId, obligationId, dossierId, numero, empreinte, canal, format: { pays, etat, version, checksum } \| null, mode: 'ASSISTE', statut: 'ENGAGE', engagePar, engageLe, rejoue }` — `201` à la création, `200` au rejeu (`rejoue: true`). ⛔ Aucun champ d'accusé |
| Refus | `400` (corps) · `404 OBLIGATION_INTROUVABLE` · `409 DEPOT_NON_ENGAGEABLE` · `409 OBLIGATION_DESACTIVEE` · `409 LIVRABLE_PERIME` · `409 ENGAGEMENT_CONCURRENT` · `422 FORMAT_DE_CANAL_ILLISIBLE` · `422 PAQUET_DEPOT_NON_PUBLIE` |
| **Route neuve** | `GET /api/v1/depots-declaration/{depotId}` — l'accès fiscal ; `200` le dépôt engagé (mêmes champs, sans `rejoue`) **+ `statut` `ENGAGE \| REMPLACE`, `remplacePar`, `perime`, `statutObligation`** ; `404 DEPOT_INTROUVABLE` |
| **Journal chaîné** | `depot-declaration:<depotId>` : `DEPOT_DECLARATION_ENGAGE`, `DEPOT_DECLARATION_REMPLACE` |
| **Stockage** | collection neuve `engagements_depot` (index posés par Mongoose au démarrage) ; **aucune migration** |
| Aucun | topic, droit, champ d'une route existante |

## Ce que cette story ne fait PAS

- ⛔ Elle ne décrit aucun format nouveau (331) et ne choisit pas de format à la place du paquet (D-330-2).
- ⛔ Elle ne fait passer aucune obligation à « Déposée » et ne touche pas la porte de C (D-330-7).
- ⛔ Elle ne guide pas (332), ne consigne ni accusé (333) ni rejet (334), n'archive pas le livrable (335) et ne branche
  aucun connecteur (561).
- ⛔ Elle ne change rien à la chaîne des dépôts de liasse de 538, ni à la route de 537 (D-330-1, D-330-15).
- ⛔ Elle ne touche aucun fichier de C : les obligations, les versions et la porte sont lues.

## Definition of Done

- [x] Une déclaration de liasse validée ⇒ son classeur, au format du paquet que son `gabarit` nomme, estampillé (fichier
      et en-têtes) ; la même déclaration déposée ⇒ l'estampille de la version scellée (e2e, vrai classeur, vrai paquet).
- [x] Le contenu vient de la source de la liasse (simulée en e2e, jamais recalculé) ; le dossier est celui de l'obligation.
- [x] Les refus de D-330-2 et D-330-3, chacun par un test.
- [x] Engager : `201` puis `200` au rejeu (le même identifiant) ; aucun champ d'accusé (clés figées, OpenAPI) ;
      l'obligation reste à `A_DEPOSER` ; `LIVRABLE_PERIME` ; `DEPOT_NON_ENGAGEABLE` ; un déclaré changé ⇒ `perime: true`
      à la lecture, puis l'engagement nouveau remplace l'ancien.
- [x] **MongoDB réel** (`test:conformite`) : l'index unique partiel existe ; dix engagements parallèles de la même version
      ⇒ un seul ; le remplacement et ses deux actes sont tout ou rien ; la chaîne du journal est intacte.
- [x] La garde d'AD-12 verte sur le code, rouge sur ses témoins.
- [x] **Mutations** qui rougissent sur une assertion (format choisi autrement que par le gabarit ; état exigé relâché ;
      estampille du contenu courant sur une version scellée ; périmé non vu ; rejeu qui crée ; remplacement sans
      `REMPLACE` ; un champ d'accusé dans la réponse ; la garde qui ne lit plus les commentaires).
- [x] Node 24 : unitaires, e2e, `test:conformite` ; lint et `tsc` ; §1.5 : `docker compose -p grp-d` du fiscal (Redis
      compris) sain, les trois routes en `401` sans jeton.

## Livraison (2026-11-26)

- **Code** : prospera-fiscal-service#76, fusionnée en rebase sur `dev` (`7d48fd9` ; arbre identique à la tête poussée
  `fb518ba`), partie de `origin/dev` `7e2bff8` (325 de C) ; aucun rebase : `origin/dev` n'avait pas bougé à la fusion. Annonce avant le code : prospera-stories#978 (`main`
  6f6b797). **Aucun écart au contrat annoncé.**
- **Fichiers** (dossiers de D) : `domain/depot/depot-declaration.ts` (pur : le format lu sur le gabarit, l'état exigé,
  l'estampille, le rejeu, le remplacement, `perime`) et son test ; `ports/canal-depot.ts`,
  `ports/registre-engagements-depot.ts` ; `adapters/canal-depot/canal-assiste.ts` et son test ;
  `adapters/mongo/depot-declaration.schema.ts` (collection `engagements_depot`, index unique partiel) et
  `mongo-registre-engagements-depot.ts` ; `application/depots/declarations-en-portee.ts`,
  `depots-declaration.service.ts` et son test ; `application/livrables-depot/livrables-declaration.service.ts` et son
  test ; `ProduireLivrableDepot` (un paramètre facultatif : les propriétés d'estampille, D-330-1) ; les deux contrôleurs,
  leurs DTO, `depots.module.ts` et `livrables-depot.module.ts` (importent `ObligationsModule`) ; `garde-ad12.spec.ts`,
  `depots-declaration.openapi.spec.ts` ; `test/depots-declaration.e2e-spec.ts`,
  `test/engagements-depot.conformite-spec.ts`, `test/utils/registre-engagements-depot-memoire.ts`. **Lus, sans
  écriture** (dossiers de C) : `ports/registre-obligations.ts`, `ports/registre-versions-declaration.ts`,
  `domain/obligations/version-declaration.ts`, `domain/obligations/cycle.ts`, `test/utils/registre-obligations-memoire.ts`.
- **D-330-17 — La garde d'AD-13 de 560 admet la route du livrable d'une déclaration.** Sa liste fermée des routes qui
  reçoivent un fichier (`src/modules/coffre-secrets/garde-ad13.spec.ts`, dossier de D) gagne
  `livrables-declaration.controller.ts#produire` : c'est le classeur à remplir de 537, aux mêmes limites multipart, sans
  aucun champ de plus (comme D-346-12 pour l'import de paie). Vue rouge à la suite complète sous Node 25, corrigée avant
  le commit.
- **Communs** (D-L7-2, annoncés avant le code) : le contrat OpenAPI (trois routes neuves) et `src/main.ts` (deux en-têtes
  exposés au CORS). Aucune migration.
- **Preuves** :
  - Node 24 (image `verification` de l'archive LF de `fb518ba`) : unitaires **231/231 suites, 3 341 tests** (1 suite et 3 tests
    ignorés : la spec BullMQ sans Redis ; `app.module.invariant` et `app-cablage.invariant` verts, rouges sous Node 25
    par le seul client Kafka natif) ; e2e **14/14 suites, 325 tests** (dont `depots-declaration`, 17) ;
    **`test:conformite` 26/26 suites, 167 tests** (dont `engagements-depot.conformite-spec.ts`, 7 : l'index unique partiel, dix
    engagements parallèles ⇒ un seul en base et un seul acte, l'index refuse un second `ENGAGE` écrit à côté, le
    remplacement en deux actes et deux chaînes intactes, tout ou rien sur une panne du journal, l'isolement des
    organisations, le schéma strict).
  - Node 25 (local) : domaine 55/55, services 13/13 et 7/7, adaptateur 3/3, OpenAPI 3/3, garde d'AD-12 12/12, e2e
    `depots-declaration` 17/17 ; les 35 suites du dépôt, du livrable, des paquets, de la complétude et du coffre
    **35/35, 578 tests**.
  - **Mutations 25/25**, chacune rouge sur une assertion : format choisi autrement que par le gabarit, gabarit blanc,
    état exigé relâché (livrable et engagement), estampille du contenu courant sur une version scellée, version scellée
    d'un autre document, périmé non vu, rejeu qui crée, relevé non périmé, empreinte ignorée, engagement sans
    comparer l'estampille, désactivée engagée, format de l'engagement ignoré, portée non lue, version scellée jamais
    lue, dossier autre que celui de la déclaration, estampille absente du fichier, livrable non validé ou désactivé,
    rejeu tu par le canal, `201` au rejeu, empreinte du fichier dans l'en-tête, un champ d'accusé dans la réponse, la
    garde qui ne lit plus les commentaires, le remplacement pris pour une création (une première écriture de « rejeu qui crée » ne trouvait pas son motif,
    reformaté par prettier : réécrite et rejouée seule).
  - lint des fichiers touchés et `tsc` 0.
  - §1.5 : pile `grp-d` du fiscal **avec Redis** (image runtime de l'archive : santé `ok` (mongodb, audit, kafka, redis), les trois routes montées et en `401` sans jeton, 0 `UnknownDependencies` sur 476 lignes de journal, l'index `un_engagement_en_vol_par_version` posé par l'application).
  - **Verrou Docker** : pris à 12:39 (une seule prise), rendu à 12:48 par le `trap` du script autonome ; B l'a repris aussitôt (1126) ; B et C prévenus (`-be`, `-f7`) ; aucun conteneur, volume ni réseau `grp-d`.
- **Ce qui reste** : → A (plus tard) : l'écran du livrable d'une déclaration et de son engagement (FE-081). → 331 : les
  formulaires des déclarations du mois comme donnée du paquet (elles répondent `FORMAT_DE_CANAL_NON_DECLARE`) ; → 332 :
  le guidage d'un dépôt engagé (et la vérification de l'exercice de la liasse, D-330-5) ; → 333 : l'accusé d'un dépôt
  engagé, fait séparé, et sa jonction avec la chaîne de 538 (D-330-15) ; → 561 : le connecteur, l'accord du client
  avant d'agir (D-330-13). Q-D-27 au PO.

## Questions au PO

- **Q-D-27 — Engager un dépôt le fait-il passer à « Déposée » ?** Choix par défaut : **non** (D-330-7). « Déposée » est la
  transmission (D-323-3) et reste la porte de C, avec l'accord du client et le scellement ; un dépôt engagé mais pas encore
  fait sur le portail garde son alerte d'échéance. Si le PO veut l'inverse, l'engagement appellera la porte de C (D-324-7),
  sans autre changement.
