# STORY-1124 : Le circuit sans trou — la réception et ses boîtes d'un seul geste, les mouvements d'une boîte verrouillés, la facture désinscrite retirée du fonds

Status: done — **livrée le 2026-11-26** : document-service **#38** (`b18d3ad` sur `dev`), catalogue **#82** (`9674aeb`,
`ged` 1.9.0) ; voir « Livraison ». Fiche écrite le 2026-11-26 par la session du groupe B juste avant de la coder (lot 7, n° 6 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 6 ; identifiant réservé D-L7B-1).

**Service :** `document-service` (GitHub `prospera-ocr-service`, module `ged`) · **Points :** 3 · **Dépend de :**
STORY-1088 (réceptions, boîtes, sorties, restitutions), STORY-1100 (factures inscrites rangées), STORY-1121 (gestes
refusés sur une pièce détruite), STORY-1122 (index aveugle), STORY-1123 (paliers de retard sur les sorties) · **Attend :**
le fait `comptabilite.facture.desinscrite` de `prospera-comptabilite-service` (**C**, demande écrite au journal de B) ·
**Écran :** FE-143 (A, lot 8)
**Sources :** STORY-1088 (D-1088-11 : « la création d'une réception et de ses boîtes n'est pas transactionnelle, et deux
sorties concurrentes d'une même pièce ne sont pas verrouillées (la sortie d'une boîte entière l'est). Nommé pour un lot
suivant ») ; STORY-1100 (D-1100-3 : « la GED ne connaît que l'inscription d'une facture : un brouillard abandonné ensuite
laisse la copie au fonds […] ; un fait de désinscription est nommé pour plus tard ») ; journal de C (lot 6, « nommé pour
plus tard »).

---

## Pourquoi

Trois trous restent dans le circuit de l'original et de la copie :

1. **Une réception à moitié écrite.** Le bordereau de réception s'écrit, puis ses boîtes ; une panne entre les deux laisse
   une réception `REC-…` sans boîte (ou des boîtes sans réception si l'ordre change).
2. **Deux sorties d'un même original.** Deux archivistes qui sortent la même pièce au même instant (ou l'un la pièce,
   l'autre la boîte entière) passent tous les deux le contrôle « déjà sortie ? » : l'original est prêté deux fois, et le
   premier retour remet la boîte en place alors qu'une pièce est dehors. Une restitution qui croise une sortie rend au
   client une boîte dont une pièce est chez le contrôleur.
3. **Une facture désinscrite qui reste au fonds.** Le brouillard né d'une facture (STORY-1097) s'abandonne ; la
   comptabilité rend la facture inscriptible à nouveau, mais la GED garde la copie rangée (STORY-1100). Réinscrite, la
   même facture entre une seconde fois au fonds.

## Ce qui est déjà livré (relu dans le code le 26/11)

- **`DepotPhysiqueMongo.creerReception`** : `receptions.create` puis `boites.insertMany`, sans session.
- **`PhysiqueService.sortir`** : lit les sorties ouvertes de la boîte, juge, puis `creerSortie` ; seule la sortie d'une
  boîte entière passe par un changement atomique (`EN_PLACE` → `SORTIE`). `rentrer` rentre la sortie puis remet la
  boîte en place en deux écritures ; `restituer` compte, puis `updateMany`, puis crée la restitution.
- **`lierOriginal`** déplace l'original d'une pièce d'une boîte à l'autre sans regarder si elle est sortie.
- **Comptabilité** (`prospera-comptabilite-service`, `dev` `e4a53cc`, lu sans y toucher) : `BrouillardService.abandonner`
  supprime le brouillard, consigne `ECRITURE_ABANDONNEE` à sa piste et, par `MemoireDesChoixService.surAbandon`, rend la
  pièce du lot inscriptible (`$unset pieces.$.inscription`), **dans une transaction**. **Aucun fait n'est publié** :
  `contrat/schemas/` n'a que `comptabilite.facture.inscrite.v1.json`. Aucun fait de désinscription au registre, au
  manifeste `comptabilite` 0.5.0 ni au catalogue.
- **La pile de preuve** des stories précédentes (`preuve1119` → `preuve1123`) tourne sur **MongoDB en replica set**
  (`rs0`) : les transactions y sont réelles. Le service en use déjà (`connexion.transaction` du dépôt des pièces, de
  l'intégrité, des fonds).

## Contrat annoncé avant le code (2026-11-26)

**Aucune route neuve, aucun droit neuf, aucun fait publié.** Deux réponses changent (ajouts seuls), trois refus naissent,
un topic est consommé (proposé à C).

### 1. La réception d'un seul geste (AC-1)

`POST …/ged/cabinet/fonds/{numero}/receptions` écrit le bordereau et toutes ses boîtes dans **une transaction MongoDB** :
tout ou rien. Le numéro `REC-AAAA-NNNNN` est pris avant (une transaction annulée laisse un trou dans la suite, jamais un
doublon). Réponse inchangée.

### 2. Les mouvements d'une boîte verrouillés (AC-2 → AC-4)

- **Un verrou par boîte** : tout mouvement d'une boîte (sortie de la boîte ou d'une de ses pièces, retour, restitution,
  original relié ou déplacé) écrit d'abord la boîte (compteur `ged_boites.mouvements`), puis relit dans la même
  transaction l'état de la boîte et ses sorties ouvertes, juge, et écrit. Deux mouvements simultanés d'une même boîte se
  heurtent sur la boîte : MongoDB annule l'un, qui se rejoue et voit l'autre.
- **Sortie** (`POST …/boites/{boiteId}/sorties`) : une seule sortie ouverte par pièce ; une boîte entière ne sort pas si
  une de ses pièces est dehors, une pièce ne sort pas d'une boîte sortie : **409 `DEJA_SORTIE`** (inchangé) ; une boîte
  restituée entre-temps : **409 `BOITE_RESTITUEE`** (inchangé).
- **Retour** (`POST …/sorties/{sortieId}/retour`) : la sortie rentre et la boîte entière revient `EN_PLACE` dans la même
  transaction ; rejoué : **409 `DEJA_RENTREE`** (inchangé).
- **Restitution** (`POST …/fonds/{numero}/restitutions`) : les boîtes passent `RESTITUEE` et le bordereau `RES-` s'écrit
  dans la même transaction, sous le verrou de chaque boîte ; une sortie ouverte entre-temps : **409 `BOITE_SORTIE`**
  (inchangé).
- **Original relié** (`PUT …/pieces/{pieceId}/original`) : **refus neuf 409 `PIECE_SORTIE`** si l'original de la pièce est
  dehors (sortie de la pièce ou de sa boîte) : on ne le change pas de boîte pendant qu'il est prêté. Sous le verrou de
  l'ancienne et de la nouvelle boîte.

### 3. La facture désinscrite retirée du fonds (AC-5 → AC-8)

- **Le fait consommé, proposé à C** : `comptabilite.facture.desinscrite` v1 (topic sans suffixe de version, clé
  `organisationId`, en-têtes `eventId` et `schemaVersion` du relais de l'outbox), publié **dans la transaction de
  l'abandon** d'un brouillard né d'une facture inscrite :
  `{ eventId (uuid), schemaVersion: 1, organisationId, dossierId, exerciceId, ecritureId, numeroProvisoire, lotId,
  pieceId (SHA-256), motif: BROUILLARD_ABANDONNE, desinscriteLe, desinscritePar }` — ni montant, ni tiers, ni ligne.
  Schéma proposé : `prospera-ocr-service/contrat/consommes/comptabilite.facture.desinscrite.v1.json` (copie de la GED,
  origine « proposé à C ») ; la source sera celle de C (`contrat/schemas/` de la comptabilité), recopiée à l'octet.
- **La GED consomme** dans le groupe `ged.comptabilite` (celui de l'inscription, deux topics), validé par le schéma ; un
  message hors contrat est écarté et journalisé, jamais relancé. Tant que C ne publie pas, le topic est vide (créé par le
  consommateur avant l'abonnement, comme tout topic consommé).
- **Ce que la GED fait** de la désinscription d'une écriture :
  - elle la **note** d'abord (`ged_factures_a_ranger`, statut neuf `DESINSCRITE`) : une facture qui attendait son fonds
    ne se range plus ; une inscription qui arrive après (deux topics, aucun ordre entre eux) ne range rien ;
  - la copie **jamais versée** (aucune ligne d'un bordereau du fonds) est **retirée du fonds** : elle sort de la liste du
    fonds, du versement, des reprises, de l'export de réversibilité, des pièces échues et de l'index de recherche ; ses
    fichiers restent (aucune destruction sans visa, FR-11) ; elle se lit encore par son identifiant, et plus aucun geste
    ne la touche (contrôle, indexation, version, original) : **refus neuf 409 `PIECE_RETIREE`** ;
  - la copie **déjà versée** est **gardée** : l'archive ne perd pas une ligne de bordereau, et l'original reste un
    justificatif (le motif de D-1100-3) ; elle porte sa désinscription ;
  - chaque issue s'inscrit au journal de la pièce (acte neuf `DESINSCRITE`, avec l'écriture) ; un rejeu ne change rien.
- **La vue d'une pièce** (`GET …/ged/cabinet/pieces/{pieceId}` et toute réponse qui la rend) gagne
  **`desinscription?: { ecritureId, le, issue: RETIREE | GARDEE }`** (facultatif).

### Données, configuration, manifeste

- Champs neufs : `ged_boites.mouvements` (le verrou) ; `ged_pieces.desinscription` ; `ged_factures_a_ranger.statut`
  gagne `DESINSCRITE`, et `.desinscription` (le fait). Aucun index neuf, aucune collection neuve, aucune variable neuve.
- **Manifeste `ged` 1.9.0** (`manifestes/ged.manifest.ts`, cette PR) : `comptabilite.facture.desinscrite` en `consomme`
  `[proposition, à C]` ; `publie`, `droits`, routes inchangés ; recopié dans le service par le code, **puis au catalogue
  par B** après la fusion du code.
- **OpenAPI** : la description de `GET …/pieces/{pieceId}`, `PUT …/original` et `POST …/sorties` (refus neufs et champ
  neuf). A en régénère les types (aucun DTO de réponse neuf).

## Livraison (2026-11-26)

- **Code** : document-service (`prospera-ocr-service`) **#38**, trois commits sur `dev` (`e51c4d5`, `4bb6fcb`, `b18d3ad` ;
  arbre identique à `7706782` poussé) : `src/modules/ged/cabinet/` `physique.ts` (`refusDeSortie`, `originalDehors`),
  `depot-physique.ts` (réception en transaction ; `verrouiller` : la boîte écrite d'abord, `$inc mouvements` ; `sortir`,
  `rentrer`, `restituer`, `lierOriginal` sous le verrou), `physique.service.ts`, `facture-desinscrite.ts` (lecture et
  validation du fait proposé), `factures.service.ts` (`desinscrire`, note relue avant et après le rangement),
  `depot-factures.ts` (`noterDesinscription` par un pipeline, statut `DESINSCRITE`), `factures-consumer.bootstrap.ts` (deux
  topics, un groupe), `cabinet.service.ts` (`desinscrireUneCopie`, `exigerNonRetiree`, vue `desinscription`),
  `recherche.ts` et `index-de-recherche.ts` (une copie retirée close comme une détruite) ; `pieces/depot-ged.ts` (copies
  retirées hors des pages d'un fonds ; `desinscription` au schéma) ; schéma proposé dans `contrat/consommes/` et
  `cabinet/schemas/` (`86a50e6f…2ecf`, origine « proposé à C ») ; refus `PIECE_SORTIE`, `PIECE_RETIREE`. Manifeste `ged`
  **1.9.0** recopié depuis `prospera-stories@95d4465` (#959), empreinte épinglée.
- **Catalogue** : `platform-catalog-service` **#82**, `9674aeb` sur `dev` : `ged` 1.9.0 recopié depuis
  `prospera-stories@5bd506e` (seul manifeste qui change ; `manifestes:garde` verte, 48 ; spec 26/26).
- **C** a accepté le fait le 26/11 (message de la session de groupe) : il le place dans sa **STORY-338** et reprend le
  schéma proposé tel quel ; à sa fusion, B recopie l'octet de C (même texte attendu : rien ne change).
- **Preuves** :
  - Node 25 : unitaires 1 359 passés (116 suites ; 2 rouges connues du poste) ; e2e **217/217** ; lint des fichiers
    touchés, `tsc`, build.
  - Node 24 (étage `verification`, image depuis `git -c core.autocrlf=false archive 7706782`) : **116/116 suites**, 1 366
    passés ; e2e **217/217**.
  - Mutations **24/24** rouges sur assertion (règles pures, second jugement du dépôt en mémoire et en Mongo, réception
    hors session, original relu sous le verrou, copie versée retirée, geste sur une copie retirée, note ignorée avant et
    après le rangement, note jamais posée, attente remise, liste et filtre Mongo qui gardent la copie, index et recherche
    qui la gardent, consommateur qui confond les topics, schéma sans le champ). Deux survivantes au premier tour (M6, M18)
    tuées par des tests directs du dépôt ; M24 ne rougissait qu'au compilateur (le test lit sans le type inféré).
  - **Pile `grp-b` neuve** (Mongo 7 `rs0`, Kafka 3.9, Redis, MinIO Chainguard, doublure d'auth), **41/41** : réception de
    40 boîtes ; une réception refusée par la base (validateur posé pour la preuve) : 500, ni réception ni boîte ; **10
    sorties simultanées d'une pièce : 1 × 201, 9 × 409** (325 ms), une sortie ouverte en base ; pièce et boîte entière
    mêlées : 1 ; 10 sorties d'une boîte : 1 ; **10 retours : 1 × 200, 9 × 409** ; restitution et sortie simultanées (trois
    fois) : une seule passe, jamais `RESTITUEE` avec une sortie ouverte ; original sorti déplacé : 409 `PIECE_SORTIE` ;
    déplacement et sortie simultanés : 200 / 409 `PIECE_HORS_BOITE` ; une facture rangée depuis un vrai fait Kafka (pièce
    comptable déposée par `POST /piece-extractions`) puis désinscrite : **RETIREE** (hors liste, 409 `PIECE_RETIREE`,
    absente de la recherche, entrée close, version gardée) ; versée : **GARDEE** ; attente désinscrite jamais rangée ;
    désinscription avant l'inscription : rien de rangé ; hors contrat écarté, le suivant lu.
  - Verrou : 09:08 → 09:19 (première passe : le schéma strict, D-1124-10), 09:22 → 09:25 (`down -v`), gardé par le
    redémarrage du poste jusqu'à 09:39 (rendu à la reprise), étage `verification` 10:04 → 10:07.

### Écarts au contrat, décidés au code

- **D-1124-9 — La sortie d'une pièce relit aussi la boîte de son original sous le verrou** : sans cela, un déplacement
  de l'original et sa sortie simultanés laissaient une sortie ouverte dans l'ancienne boîte (relevé en écrivant le
  script de preuve) ; elle rend alors 409 `PIECE_HORS_BOITE` (code existant). Le déplacement verrouille l'ancienne et la
  nouvelle boîte, dans l'ordre des identifiants.
- **D-1124-10 — Le schéma Mongo des pièces déclare `desinscription`** : strict, il retirait le champ de chaque écriture en
  silence (première passe de la pile : 6 KO sur la désinscription, les doubles en mémoire verts) ; un test construit un
  document du modèle et lit le champ.
- **D-1124-11 — Le consommateur garde son libellé de supervision** (`comptabilite.facture.inscrite`) et son groupe : la
  santé Kafka nomme le groupe, pas les topics.
- **D-1124-12 — La note de désinscription se pose par un pipeline d'agrégation** (`updateOne` avec `upsert`) : la première
  désinscription seule compte, une facture rangée reste `RANGEE`, deux notes simultanées se rejouent sur l'unique.

## Critères d'acceptation

- **AC-1** : une réception s'écrit avec toutes ses boîtes ou pas du tout (transaction) ; prouvé sur la pile (une
  réception de 40 boîtes, une réception refusée par la base n'en laisse aucune).
- **AC-2** : **N sorties simultanées d'une même pièce : une seule passe**, les autres rendent 409 `DEJA_SORTIE` ; idem
  pour une pièce et sa boîte entière en même temps ; prouvé sur la pile (MongoDB rs0), N = 10.
- **AC-3** : le retour d'une boîte entière la remet en place dans la transaction de la sortie rentrée ; N retours
  simultanés : un seul passe.
- **AC-4** : une restitution et une sortie d'une pièce de la même boîte, simultanées : l'une passe, l'autre rend 409 ; une
  boîte n'est jamais `RESTITUEE` avec une sortie ouverte.
- **AC-5** : une facture désinscrite qui attendait son fonds ne se range plus, même après l'ouverture du fonds.
- **AC-6** : une copie jamais versée est retirée du fonds (liste, versement, export, échues, index) ; ses fichiers
  restent ; tout geste rend 409 `PIECE_RETIREE` ; sa vue porte `desinscription.issue = RETIREE`.
- **AC-7** : une copie déjà versée est gardée et porte `desinscription.issue = GARDEE` ; le bordereau ne change pas.
- **AC-8** : la désinscription lue avant l'inscription empêche le rangement ; un rejeu ne change rien ; un message hors
  contrat est écarté sans bloquer le groupe ; le consommateur démarre sans attendre Kafka (client de Confluent, Node 24).

## Décisions prises au contrat (contestables)

- **D-1124-1 — Le numéro d'une réception se prend hors de sa transaction** : le compteur partagé n'entre pas dans la
  transaction (il ne bloque pas les autres réceptions) ; une transaction annulée laisse un trou, jamais un doublon, comme
  `DES-` (STORY-1121).
- **D-1124-2 — Le verrou est la boîte, pas un index** : un index unique partiel ne dit pas « pas de pièce dehors quand la
  boîte sort » (deux clés différentes) ; écrire la boîte en premier dans la transaction sérialise tous ses mouvements
  (conflit d'écriture de MongoDB, rejoué par `connexion.transaction`), sans collection de verrous ni délai d'expiration.
- **D-1124-3 — Le fait de désinscription est à C, la GED est prête** : la GED ne publie pas au nom de la comptabilité.
  Elle consomme le schéma **proposé** (au journal de B, « Demandes ») ; si C le publie autrement, la GED écarte et
  journalise (rien n'est retiré à tort) et B recopie la forme de C. Aucun ordre entre les deux topics : la désinscription
  se note avant de chercher la copie, l'inscription relit la note avant et après avoir rangé.
- **D-1124-4 — Retirée si jamais versée, gardée si versée** : une copie qui n'a pas encore de ligne de bordereau n'est
  pas encore une archive ; une copie versée l'est, et le bordereau (scellé ou non) ne perd pas de ligne. L'archiviste
  garde la main sur une copie gardée (la destruction de STORY-1121, le gel).
- **D-1124-5 — Une copie retirée garde ses fichiers et compte au quota** : la retirer n'est pas la détruire (FR-11 : jamais
  sans visa) ; c'est une copie d'une pièce que `document-service` garde de toute façon pour la comptabilité.
- **D-1124-6 — La mémoire de classement n'oublie pas** ce qu'elle a appris d'une copie retirée : l'indexation a été
  validée par une personne (D-1100-1) ; la comptabilité oublie de son côté sa propre mémoire (STORY-1098).
- **D-1124-7 — Une réinscription est une écriture neuve** : la comptabilité donne un `ecritureId` neuf, la GED range une
  copie neuve (l'unique `une_piece_par_ecriture_comptable` ne change pas).
- **D-1124-8 — La recette de l'Atelier n'est pas rejouée** si le diff ne touche ni l'OCR, ni les extractions, ni le module
  Nest commun (seul `GedModule` et ses dépôts changent), comme D-1122-12 et D-1123-11.

## Nommé pour plus tard

- La publication du fait par la comptabilité (C, STORY-338, acceptée le 26/11) ; la recopie à l'octet de son schéma dans la
  GED (B, à la fusion de C).
- Une alerte « copie gardée, écriture abandonnée » pour l'archiviste (un fait de plus, STORY-1123).
