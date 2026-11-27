# STORY-1124 : Le circuit sans trou — la réception et ses boîtes d'un seul geste, les mouvements d'une boîte verrouillés, la facture désinscrite retirée du fonds

Status: done — **suite « j » livrée le 2026-11-27** (← D, après fiscal #89 : les deux faits proposés publiés,
l'aller-retour GED ↔ vrai fiscal joué, 32/32 ; « Suite du 2026-11-27 (bis) », D-1124-27 → 36) : document-service **#43**
(`f6c00d6` sur `dev`). **Suite « h » livrée le 2026-11-27** : les pièces du dépôt d'une déclaration au fonds du client (← D,
STORY-335 ; « Suite du 2026-11-27 », D-1124-13 → 26) : document-service **#42** (`8f9040d` sur `dev`), catalogue **#88**
(`e528afc`, `ged` 1.11.0). **Livrée le 2026-11-26** : document-service **#38** (`b18d3ad` sur `dev`), catalogue **#82** (`9674aeb`,
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

## Suite du 2026-11-27 — les pièces du dépôt d'une déclaration au fonds du client (groupe B, lot 7, ordre « h »)

**Demande :** D, STORY-335 (journal de D, « Demandes aux autres groupes » : « → B (2026-11-26, STORY-335) : recevoir dans
le fonds d'archives du client les pièces du dépôt d'une déclaration », stories #1009, `main` `af552d3` ; fiche
`STORY-335.md`, D-335-9, Q-D-31 ; le bucket privé du fiscal : STORY-682) ; placée par la session de groupe après
STORY-1129, avant STORY-1130 (D-L7B-12). **Aucun identifiant neuf.**
**Dépôt :** `document-service` (GitHub `prospera-ocr-service`, module `ged`), branche `MNV-1124-fiscal`, commits
`MNV-1124(ged): …` ; le catalogue pour la recopie du manifeste · **Lu seulement :** `prospera-fiscal-service` (le dépôt
de C, où D travaille par dossier ; B n'y écrit rien) · **Exécutée par :** groupe B.

**Pourquoi :** l'AC-1 de 335 veut le livrable déposé et l'accusé « archivés dans `document-service`, rattachés au
dossier, à l'implantation, à l'obligation et à la période », et la V9 de la salle du 19/11 veut « la liasse figée, son
accusé et la validation du client dans le même fonds d'archives que les pièces ». Le fiscal tient l'original dans son
bucket privé (682), re-vérifié à chaque lecture ; la GED ne reçoit rien du fiscal, et sa pièce ne s'indexe ni par
obligation, ni par implantation, ni par période. D attend la forme (port inerte `CopieAuFondsDArchives`, `MNV-335`).

### Où en est-on

- [x] Rituel : journaux de A, C, D (aucune demande neuve à B hors de celle-ci) ; `document-service` sur `dev` à jour
  (`57f9581`), propre ; verrou tenu par C (STORY-338) au rituel.
- [x] Relu avant d'écrire (le code, pas les fiches) : dans la GED, `factures-consumer.bootstrap.ts`, `factures.service.ts`,
  `facture-inscrite.ts`, `depot-factures.ts` (le fait consommé, l'attente `SANS_FONDS` rangée à l'ouverture du fonds,
  l'unicité par l'origine), `cabinet.service.ts` (`rangerUneCopie`, `controlerFichier`, `sceller`, `pieceAccessible`,
  `metadonneesDeVersion`), `pieces/depot-ged.ts` (index `une_piece_par_ecriture_comptable`), `reception/controles.ts` et
  `parametres/ged-2026.3.json` (**formats acceptés : JPEG, PNG, WEBP, PDF ; 8 Mo**), `lectures/` (la lecture d'une
  version, exigée au scellé), `cabinet/droits.ts` (`SourceDesDroitsHttp`), `parametres/ged-cabinet-2026.2.json`,
  `kafka/supervision-consommateur.util.ts` (un message en échec est relu, le groupe « bloqué » au troisième), l'outbox de
  1123 ; dans le fiscal (branche `MNV-335` de D, lecture seule) : `ports/copie-fonds-archives.ts` et l'adaptateur inerte,
  `domain/depot/archive-depot.ts` (`RattachementDeclaration`, le livrable `FICHIER` = classeur XLSX ou `FORMULAIRE` =
  JSON, 15 Mo), `domain/depot/accuse-depot.ts` (la pièce de l'accusé : PDF, PNG, JPEG, XML), `kafka/outbox/` et
  `kafka/events/declaration-events.ts` (l'outbox du fiscal, son fait `fiscal.declaration.deposee`, ses conventions
  `orgId`, `occurredAt`), `adapters/http/http-envoi-invitations.ts` (le fiscal appelle déjà un service avec un jeton de
  service) ; dans l'écosystème : `prospera-notification-service/src/config/jetons-de-service.ts` (STORY-589 :
  `JETONS_DE_SERVICE=<appelant>:<jeton>`, empreinte seule) et `auth-service/src/modules/identites-de-service/` (STORY-948 :
  jetons RS256 limités à une organisation, pour `MOTEUR`, `REPRISE`, `CONNECTEURS` seulement) ; fiche STORY-324 (D-324-2 :
  la validation du client est **déjà** une pièce de la GED, le fiscal n'en garde que la référence).
- [x] Forme choisie et contrat annoncés avant la fusion (cette PR de docs ; manifeste `ged` 1.11.0 à la source).
- [x] PR de code fusionnée en rebase : document-service **#42** (`dev` **`8f9040d`**) ; manifeste `ged` 1.11.0 recopié
  depuis `prospera-stories@dc05d12` ; preuves ci-dessous.
- [x] Recopie au catalogue : **#88** (`e528afc`), avec la demande « i » de C (`comptabilite` 0.6.0, D-L7B-13 ; annonce
  #1018) ; PR de docs finale (fiche, tracker, journal : avancement, « Réponses » → D et → C) ; message à D, information à C.

### Les deux formes, comparées sur le code

| | (1) un fait du fiscal, la GED tire les octets | (2) une route de dépôt de la GED, le fiscal l'appelle |
|---|---|---|
| **Rien ne se perd** | Le fait s'écrit dans l'**outbox du fiscal, dans la transaction** de l'archivage (comme `fiscal.declaration.deposee`, 681) : la copie est due dès que l'original existe, et le relais la livre au moins une fois. | Le fiscal appelle **après** son écriture (le port de D l'appelle hors transaction et avale l'échec) : une GED arrêtée perd la copie, sauf si D écrit une file de reprise — une seconde outbox. |
| **Pas de fonds ouvert** | La GED sait déjà attendre : le fait garde sa place (`SANS_FONDS`), il se range à l'ouverture du fonds (patron des factures, 1100) ; les octets ne se tirent qu'à ce moment. | La GED devrait garder les octets en attente (un stockage de plus) ou refuser, et le fiscal réessaierait sans savoir quand un fonds s'ouvre. |
| **Idempotence** | Rejeu du fait : la clé `(orgId, obligationId, numero, nature)` et l'origine de la pièce, uniques. | La même clé, sur la route. Équivalent. |
| **Ce que la GED sait déjà** | Un consommateur supervisé (client de Confluent, jamais attendu à l'amorçage), la lecture validée d'un fait (Ajv, schéma copié à l'octet), `rangerUneCopie` (copie chiffrée, pré-indexée, reliée à son origine, à contrôler), l'attente et son rangement. Il manque l'adaptateur qui tire les octets. | `POST …/ged/cabinet/pieces` existe, mais **au jeton d'un membre** et sous ses droits `ged:*` (lus chez auth) : un collaborateur fiscal sans droit de la GED ne copierait rien, et un fait ou un rejeu n'a pas de membre. Il faudrait une route neuve, sous une authentification de service neuve dans la GED. |
| **Authentification de service** | Le fiscal sert une route `/api/v1/service/…` au jeton de service de `document-service` (patron de notification, STORY-589, que le fiscal pratique déjà comme appelant) ; la GED garde un jeton. | La GED sert une route au jeton de service du fiscal (même patron, de l'autre côté). Équivalent. |
| **La validation du client** | Aucun octet à tirer : la pièce est déjà dans la GED (D-324-2) ; le fait porte sa référence, la GED la **rattache**. Le même fait, la même clé. | Une seconde route (rattacher sans fichier). |
| **Preuve** | La GED re-hache les octets tirés contre le SHA-256 du fait (64 hexadécimaux, format de `ged.piece.recue`) : une copie qui ne concorde pas n'entre pas. | Le fiscal déclare l'empreinte dans la requête ; même contrôle. Équivalent. |
| **Ce que D écrit** | Le fait dans l'outbox (un adaptateur du port inerte, trois appels) et une route de lecture de service. | L'appel HTTP, et la file de reprise sinon la copie se perd. |

**Choix : la forme (1)** (D-1124-14).

### Contrat (annoncé avant la fusion)

- **Fait consommé `fiscal.depot.piece-archivee` v1 — proposé par B à D** (schéma JSON 2020-12,
  `additionalProperties: false`, dans `prospera-ocr-service` : `contrat/consommes/fiscal.depot.piece-archivee.v1.json` et
  `src/modules/ged/cabinet/schemas/`, origine « proposé à D » ; D le recopie à l'octet dans le fiscal, et la GED recopiera
  l'octet de D à sa publication). Publié par l'**outbox du fiscal, dans la transaction** de l'archivage du livrable
  (`POST …/depots-declaration/{depotId}/livrable`), de la consignation d'un accusé **avec sa pièce** (333) et, quand 336
  la lira, de la consignation d'une validation du client **dont la référence est une pièce de la GED** (324). Un fait par
  pièce et par obligation. Clé de partition `orgId` ; en-têtes `eventId`, `schemaVersion`. État absolu, aucun contenu, ni
  signataire, ni auteur, ni texte libre.
  - Requis : `eventId` (uuid), `schemaVersion: 1`, `occurredAt` (date-time), `orgId`, `dossierId`, `obligationId`,
    `depotId` (24 hexadécimaux minuscules), `implantationId`, `redevableId` (`^[A-Za-z0-9_-]{1,64}$` : `principale`,
    `entreprise`…), `taxe` (`^[A-Z][A-Z0-9_]{0,39}$`), `periode` (`AAAA`, `AAAA-MM`, `AAAA-Tn`, `AAAA-En`), `numero`
    (entier ≥ 1 : la version de la déclaration), `nature` (`LIVRABLE_DEPOSE` | `ACCUSE_DEPOT` | `VALIDATION_CLIENT`),
    `date` (`AAAA-MM-JJ` : le jour du dépôt engagé, la date de l'accusé, le jour de l'accord).
  - `LIVRABLE_DEPOSE`, `ACCUSE_DEPOT` : **`piece`** requis = `{ id (archiveId ou accuseId, 24 hexa), sha256 (64 hexa,
    sans préfixe), taille (1 → 15 728 640), type (application/pdf | image/png | image/jpeg | application/xml |
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | application/json), nom (1 → 255) }` ;
    `pieceGed` interdit.
  - `VALIDATION_CLIENT` : **`pieceGed`** requis = `{ pieceId (24 hexa), version (≥ 1), sha256 (64 hexa) }` (la
    référence que la GED a rendue, D-324-2) ; `piece` interdit. Une validation à référence libre (hors GED) ne s'émet pas.
- **Route de service du fiscal, proposée à D** (D l'écrit dans son dossier `depots`) : **`GET
  /api/v1/service/organisations/{orgId}/pieces-depot/{nature}/{pieceId}`** (`nature` : `LIVRABLE_DEPOSE` |
  `ACCUSE_DEPOT` ; `pieceId` : `piece.id` du fait) ; `Authorization: Bearer <jeton de service>`, le fiscal reconnaît
  `JETONS_DE_SERVICE=document-service:<jeton>` (32 caractères au moins, empreinte seule gardée : patron de STORY-589),
  aucun jeton d'utilisateur, aucun droit. **200** : le corps = les octets exacts, `Content-Type:
  application/octet-stream`, `X-Empreinte-Sha256: <64 hexa>` ; l'objet est **relu et re-haché** avant d'être servi
  (682). **404 `PIECE_INTROUVABLE`** (inconnue, autre organisation, nature qui ne va pas avec l'identifiant, accusé sans
  pièce) ; **502 `FICHIER_ARCHIVE_ALTERE`** ; **401 `JETON_DE_SERVICE_REQUIS`** ; 503.
- **Côté GED** (consommateur, groupe **`ged.fiscal`**) :
  - **Idempotence** : un rattachement par `(organisation, obligationId, numero, nature)` (collection neuve
    `ged_pieces_fiscales`, index unique) et une copie par origine (`origine.systeme = fiscal`, `origine.id =
    <obligationId>:<numero>:<nature>`, index unique partiel neuf `une_piece_par_piece_fiscale`) : un rejeu ne range
    jamais deux fois ; un rejeu dont l'empreinte diffère ne change rien (journalisé).
  - **Rangement** : le fonds **ouvert** du dossier dont la période couvre le début de la période fiscale, sinon le plus
    récent ouvert ; sans fonds, le fait **attend** (`SANS_FONDS`) et se range à l'ouverture d'un fonds du dossier. Copie
    chiffrée, `source: FISCAL`, pré-indexée (`exercice` = l'année de la période, `date`, `reference` = `<taxe>
    <periode>`), reliée à son origine, **à contrôler** avant le versement (comme une facture, 1100). Nature :
    `LIVRABLE_DEPOSE` → **`DECLARATION_FISCALE`** (au plan depuis 1087), `ACCUSE_DEPOT` → **`ACCUSE_DEPOT`** (neuve).
    `VALIDATION_CLIENT` : la pièce de la GED est **rattachée**, jamais copiée (même cabinet, même dossier, la version
    et son empreinte doivent concorder).
  - **Les octets** : tirés par la route de service du fiscal (`FISCAL_SERVICE_URL`, `FISCAL_JETON_SERVICE`,
    `FISCAL_SERVICE_DELAI_MS`, 15 000 ms par défaut) ; taille et SHA-256 recalculés contre le fait. Attentes nommées :
    `SANS_FONDS`, `PIECE_INTROUVABLE` (404), `ORIGINAL_ALTERE` (502), `EMPREINTE_DIVERGENTE`, `PIECE_GED_INTROUVABLE`,
    le code d'un fichier refusé, `SOURCE_INDISPONIBLE`. Une panne du fiscal (injoignable, délai, 5xx, non configuré)
    pendant la lecture d'un fait : le message est **relu** (le groupe passe « bloqué » au troisième échec, `/health` le
    dit) ; pendant une reprise d'attentes : l'attente reste, `SOURCE_INDISPONIBLE`. Les attentes d'un dossier se
    reprennent à l'ouverture d'un fonds et à chaque fait du même dossier.
  - **Formats d'une copie du fiscal** : ceux du fiscal (PDF, PNG, JPEG, XML, XLSX, JSON), jugés sur les octets et
    conformes au `type` du fait, 15 Mo au plus ; la GED ne lit (OCR, couche texte) que le PDF et les images : un
    classeur, un XML ou un JSON n'a pas de lecture, et le scellé d'un bordereau ne l'attend pas.
- **Plan de classement du cabinet `ged-cabinet-2026.3`** (2026.2 ne change pas d'un octet) : 2026.2 et une nature
  **`ACCUSE_DEPOT`** « Accusé de dépôt d'une déclaration » — `ANNUEL` / `FISCAL` (après `VALIDATION_CLIENT`), non
  sensible, 10 ans après la fin de l'exercice ; servie à tous les fonds ; un code déjà pris par un cabinet reste le sien
  (D-1119-21). `GET …/ged/cabinet/natures` rend `version: "2026.3"`.
- **Route neuve `GET /api/v1/ged/cabinet/dossiers/{dossierId}/pieces-fiscales`** (jeton du membre ;
  `ged:piece:consulter` ; portée du dossier) ; filtres facultatifs `obligationId`, `periode`, `implantationId`, `nature`
  → `200 { pieces: [{ obligationId, implantationId, redevableId, taxe, periode, numero, nature, depotId, date, statut:
  RANGEE | EN_ATTENTE, raison?, pieceId?, version?, fondsNumero?, empreinte, recueLe, rangeeLe? }] }` (période puis
  version, la plus récente d'abord ; 500 au plus). Refus : `403 DROIT_INSUFFISANT`, `403 GED_NOT_ENTITLED`, `404
  DOSSIER_INCONNU` (hors portée compris), `400` (filtre invalide).
- **Manifeste `ged` 1.11.0** (`manifestes/ged.manifest.ts`, cette PR) : `fiscal.depot.piece-archivee` en `consomme`
  [proposition, à D] ; la route en `routesLectureSeule`. Recopié dans le service par le code, puis au catalogue. Aucun
  droit neuf (auth inchangé), aucun fait publié, aucune route d'écriture.

### Décisions retenues par défaut (contestables)

- **D-1124-13 — La demande se rattache à STORY-1124.** C'est la story de B qui a fait entrer au fonds du client ce
  qu'un autre service lui annonce par un fait qu'elle a proposé (`comptabilite.facture.desinscrite`, accepté par C) : le
  circuit sans trou de la copie. STORY-1100 (la facture inscrite) est une story de C ; STORY-1119 (« f ») porte la
  preuve, pas la réception. Aucun identifiant neuf (D-L7B-12).
- **D-1124-14 — La forme (1) : un fait du fiscal, la GED tire les octets par une route de service du fiscal.** Voir le
  tableau. La raison qui décide : le fiscal a déjà une **outbox transactionnelle**, la GED a déjà un **consommateur qui
  attend son fonds** ; la forme (2) demandait à D une file de reprise (sans elle, une GED arrêtée perd la copie) et à la
  GED un stockage des octets en attente ou un refus sans fin. Le coût de (1) est une route de lecture de service dans le
  fiscal ; celui de (2), une route d'écriture de service dans la GED, plus la reprise.
- **D-1124-15 — Le schéma suit les conventions du producteur.** Le topic est au fiscal : `orgId` et `occurredAt` comme
  `fiscal.declaration.deposee` (681), pas `organisationId` comme les faits de la comptabilité. Un fait par pièce et par
  obligation (une validation qui porte sur trois déclarations donne trois faits) : la clé d'idempotence est celle que D
  demandait, `obligationId` + `numero` + nature. `piece` et `pieceGed` s'excluent par la nature (`if`/`then`/`else`,
  vérifié sous Ajv strict). Aucun texte libre, ni signataire, ni auteur : la GED range sous `systeme:fiscal`, la trace de
  qui a archivé reste au journal chaîné du fiscal.
- **D-1124-16 — L'authentification : le jeton de service par appelant, pas l'identité de service d'auth.** Le patron de
  `prospera-notification-service` (STORY-589 : `JETONS_DE_SERVICE=<appelant>:<jeton>`, 32 caractères au moins, seule
  l'empreinte gardée, refus au démarrage d'un jeton trop court) est celui que le fiscal pratique déjà comme appelant ;
  l'identité de service d'auth (STORY-948) est réservée au moteur, à la Reprise et aux Connecteurs et demanderait un jeton
  par organisation à chaque copie. La route du fiscal n'accepte aucun jeton d'utilisateur.
- **D-1124-17 — Deux unicités.** Le rattachement `(organisation, obligationId, numero, nature)` est l'idempotence que D
  demande ; l'origine de la copie (`fiscal`, `<obligationId>:<numero>:<nature>`) la double dans la collection des pièces,
  pour qu'une course (le fait et la reprise d'une attente, deux consommateurs) ne range jamais deux copies (patron de
  `une_piece_par_ecriture_comptable`, 1100).
- **D-1124-18 — Le fonds et l'index, comme une facture.** Le fonds ouvert dont la période couvre le premier jour de la
  période fiscale (une DSF de `2025` va au fonds de l'exercice 2025, même déposée en 2026), sinon le plus récent ouvert ;
  un fonds fermé ne reçoit rien (1120). `exercice` = l'année de la période (le plan exige l'exercice d'une pièce annuelle)
  ; la conservation (10 ans après la fin de l'exercice) et l'échéance de destruction s'en déduisent (1121) ; `reference`
  = `<taxe> <periode>` entre dans l'index aveugle (1122) par ses mots. La copie reste **à contrôler** : l'IA ni un fait ne
  contrôlent jamais (FR-165).
- **D-1124-19 — Une nature neuve pour l'accusé, aucune pour le livrable.** `DECLARATION_FISCALE` est au plan depuis 1087
  et dit exactement le livrable déposé ; l'accusé n'est ni une quittance ni un avis d'imposition : `ACCUSE_DEPOT`, au plan
  `2026.3` (D-1119-20 : une version neuve de la table, servie à tous les fonds). La validation du client garde la nature
  que le cabinet lui a donnée en la rangeant (`VALIDATION_CLIENT` d'ordinaire, « f »).
- **D-1124-20 — Les formats du fiscal, sans lecture pour ceux que la GED ne lit pas.** Le livrable est un classeur XLSX
  ou un JSON, l'accusé peut être un XML : la GED les refusait (`FORMAT_NON_ACCEPTE`, 8 Mo). La copie du fiscal accepte
  ses six formats et 15 Mo (sa propre limite), jugés sur les octets ; les paramètres de la GED (`ged-2026.3`, ceux des
  dépôts des membres) ne changent pas. Une lecture OCR d'un classeur échouerait et irait « à refaire » : elle n'est pas
  planifiée ; le scellé n'attend une lecture que pour un format lu (PDF, images). L'OCR, les extractions et la lecture
  ne changent pas.
- **D-1124-21 — Une panne du fiscal relit le message ; un refus du fiscal fait attendre.** Injoignable, délai, 5xx ou
  configuration absente : le message n'est pas acquitté (la supervision le relit, avec son délai croissant, et `/health`
  nomme le groupe bloqué) — rien ne se perd et la panne se voit. `404`, `502 FICHIER_ARCHIVE_ALTERE`, une empreinte ou une
  taille qui ne concordent pas, un fichier refusé : l'attente garde sa raison, la partition continue. Les attentes d'un
  dossier se reprennent à l'ouverture d'un fonds et à chaque fait du même dossier (aucune minuterie neuve).
- **D-1124-22 — Une lecture des rattachements par dossier.** « Retrouver toute pièce depuis l'obligation » (FR-F45) : la
  route rend les rattachements d'un dossier, filtrés par obligation, période, implantation ou nature, avec la pièce de la
  GED et sa version (que `…/versions/{version}` de « f » sait vérifier), ou la raison d'une attente. Sous la garde de la
  pièce (`ged:piece:consulter`, portée du dossier), comme la recherche (1122).
- **D-1124-23 — Manifeste `ged` 1.11.0 ; la recopie au catalogue dans cette suite.** Un fait consommé et une route de
  lecture neufs. Le fait est marqué « proposition, à D » jusqu'à sa publication par le fiscal.
- **D-1124-24 — Docker pour la preuve ; la recette de l'Atelier n'est pas rejouée.** Un consommateur neuf et un appel
  HTTP sortant se prouvent sur une pile `grp-b` neuve (vrai Kafka, doublure de la route du fiscal), et le client de
  Confluent sous Node 24 (étage `verification`). Ni l'OCR, ni les extractions, ni le module Nest commun ne changent : la
  recette de l'Atelier n'apporterait rien (D-1124-8).

### Livré (27/11)

- **document-service #42**, deux commits sur `dev` : `ee2302b`, **`8f9040d`** (fusionnée en rebase, `mergedAt` non nul,
  `headRefOid` = `2719605` poussé, arbre identique). `src/modules/ged/cabinet/` : `piece-fiscale.ts` (le fait, Ajv strict,
  règles pures : période → premier jour et exercice, fonds ouvert, origine, formats du fiscal lus dans les octets),
  `source-pieces-fiscales.ts` (port, adaptateur HTTP borné à la taille annoncée + 1, double), `depot-pieces-fiscales.ts`
  (`ged_pieces_fiscales`), `pieces-fiscales.service.ts`, `pieces-fiscales.controller.ts` (`PiecesFiscalesDto`),
  `pieces-fiscales-consumer.bootstrap.ts` ; `cabinet.service.ts` (`rangerUneCopie` : format déjà jugé, lecture seulement
  d'un format lu ; `sceller` ; `dossierOuRefus` public), `index-de-recherche.ts`, `reversibilite.ts` (extensions),
  `cabinet.controller.ts` (reprise à l'ouverture d'un fonds) ; `pieces/depot-ged.ts` (index `une_piece_par_piece_fiscale`,
  motif de clés `{ origine.systeme, organisationId, origine.id }` : deux index partiels ne partagent pas un motif) ;
  `ged.config.ts`, `.env.example` (`FISCAL_SERVICE_URL`, `FISCAL_JETON_SERVICE`, `FISCAL_SERVICE_DELAI_MS`) ; schéma
  `contrat/consommes/fiscal.depot.piece-archivee.v1.json` = `cabinet/schemas/` (sha256 LF `51838a86…3493`, origine «
  proposé à D ») ; `parametres/ged-cabinet-2026.3.json` (`be3e8f20…8bea` ; 2026.2 inchangé) ; manifeste `ged` 1.11.0
  recopié depuis `prospera-stories@dc05d12` (`dfd36a0b…6d72`).
- **Catalogue #88** (`e528afc` sur `dev`) : `copies.json` depuis `prospera-stories@c926f55` ; seuls `ged` 1.11.0 et
  `comptabilite` 0.6.0 (← C, demande « i », D-L7B-13) changent ; `manifestes:garde` verte (48).
- Annonces : stories #1014 (`dc05d12`, avant la fusion du code) et #1018 (`20b7791`, avant la fusion du catalogue). Tel
  qu'annoncé : aucun écart de contrat.

### Écarts décidés au code

- **D-1124-25 — Le motif de clés de l'index des copies du fiscal diffère de celui des factures** (`origine.systeme`
  d'abord) : deux index partiels sur le même motif de clés ne coexistent pas partout ; l'unicité est la même.
- **D-1124-26 — La reprise d'un dossier passe aussi à chaque fait d'un AUTRE type du même dossier**, validation du client
  comprise : sur la pile, la validation (qui ne tire aucun octet) a fait retenter les trois attentes de D1 — c'est
  D-1124-21, voulu ; l'assertion du script qui comptait « aucun appel au fiscal » après elle était fausse (voir Preuves).

### Preuves

- Node 25 (poste), par chemin : `piece-fiscale.spec.ts`, `source-pieces-fiscales.spec.ts`,
  `pieces-fiscales-consumer.bootstrap.spec.ts` 20/20 ; `pieces-fiscales.service.spec.ts` 25/25 ;
  `plan-cabinet.spec.ts` 9/9 ; `cabinet.service.spec.ts` et l'invariant des consommateurs 50/50 ; e2e `ged-cabinet` et
  `dossier-portee-collaborateur` 78/78. Suite complète : unitaires 1 441 passés avant les deux corrections de tests de
  version (2 suites rouges connues du poste : CRLF de `ged.service.spec`, chemins Windows de `piece-conservation.spec`) ;
  **e2e 224/224** ; lint des fichiers touchés, `tsc`, build.
- **Node 24** (étage `verification`, image depuis `git -c core.autocrlf=false archive`) : sur `ba4cfe2`, 120/121 suites —
  la liste des schémas consommés de `ged.service.spec` ne comptait pas le fait neuf (masquée sur le poste par la copie
  CRLF connue), corrigée par `2719605` ; sur **`2719605` : 121/121 suites, 1 448 passés** (5 ignorés) ; **e2e 224/224**.
- **Mutations 23/23 rouges sur assertion** : rejeu, copie retrouvée par son origine, fonds fermé, trimestre, panne
  pendant un fait (acquittée) ou une reprise (levée), empreinte, format déclaré, validation d'un autre dossier ou d'une
  autre empreinte, lecture sans droit ou hors portée, lecture planifiée d'un classeur, scellé qui attend un classeur, index
  qui attend son texte, 404 du fiscal pris pour une panne, tout 502 pris pour un original altéré, lecture non bornée,
  jeton court, ouverture d'un fonds sans reprise (e2e), fait sans reprise, mauvais groupe, unicité mémoire. Trois
  survivantes au premier tour (rejeu, origine, unicité : des gardes redondantes) tuées par trois tests neufs ; trois
  mutants réécrits parce qu'ils ne compilaient pas.
- **Pile `grp-b` neuve** (Mongo 7 `rs0`, Kafka 3.9, Redis, MinIO Chainguard, doublure d'auth, **doublure de la route de
  service du fiscal** qui exige le jeton ; image depuis l'archive de `ba4cfe2`) — **42/43** : plan `2026.3` et
  `ACCUSE_DEPOT` servis ; index `une_piece_par_piece_fiscale` (unique, partiel) et `un_rattachement_par_piece_fiscale`
  posés ; un **classeur** rangé par un vrai fait Kafka, rattaché (obligation, implantation, période, version, fonds), lu
  par la route de « f » (`DECLARATION_FISCALE`, type XLSX), contenu relu **à l'octet** depuis MinIO, chiffré en base,
  **aucune lecture planifiée** ; le fiscal appelé **une fois, au jeton de service**, `accept: application/octet-stream` ;
  **trois rejeux : une seule copie, aucun octet de plus** ; un accusé PDF `ACCUSE_DEPOT` avec sa lecture ; D2 sans fonds :
  `SANS_FONDS` sans tirer d'octets, puis **rangé dans la réponse même de l'ouverture du fonds** ; **le fiscal en panne** :
  rien d'écrit, `/health` 503 nomme **`ged.fiscal` bloqué**, la panne levée, le message relu est rangé ; 404 →
  `PIECE_INTROUVABLE`, 502 → `ORIGINAL_ALTERE`, autres octets → `EMPREINTE_DIVERGENTE`, deux messages hors contrat
  écartés, le suivant rangé ; **la validation du client rattachée à la pièce de la GED, sans copie** ; **course entre
  l'ouverture d'un fonds et un fait du même dossier : quatre pièces rangées, aucune copie en double** ; filtres, 400, le
  collaborateur responsable 200, hors portée 404 `DOSSIER_INCONNU` ; un fonds qui ne porte qu'un classeur contrôlé se
  **verse et se scelle** (200). Le KO : « validation : aucun appel au fiscal » — le journal de la doublure montre que les
  trois appels après la validation sont la reprise des trois attentes de D1 (`…05`, `…06`, `…07`), voulue (D-1124-26) ;
  aucun appel pour la validation elle-même, aucune pièce neuve. 7 lignes d'erreur au journal du service, toutes de la
  panne voulue (groupe bloqué, santé 503).
- Verrou : 01:08 → 01:17 (pile, `down -v`, étage `verification`), 01:25 → 01:27 (étage `verification` sur `2719605`).
  Aucun conteneur ni volume `grp-b` ne reste. Une boucle d'attente du verrou au premier plan a été passée en arrière-plan
  par l'outil au bout de 180 s : arrêtée aussitôt (`TaskStop`), le verrou n'était pas pris (piège).
- Recette de l'Atelier non rejouée (D-1124-24) : ni l'OCR, ni les extractions, ni le module Nest commun ne changent.

### Nommé pour plus tard

- Le fait et la route dans le fiscal (**D**, à la place de l'adaptateur inerte de 335), puis la recopie à l'octet du schéma
  de D dans la GED (B).
- Une reprise périodique des attentes `SOURCE_INDISPONIBLE` d'un dossier qui ne reçoit plus de fait ni de fonds (aujourd'hui
  : à l'ouverture d'un fonds ou au fait suivant du dossier).

## Suite du 2026-11-27 (bis) — les deux faits proposés sont publiés, et l'aller-retour GED ↔ fiscal est joué (groupe B, lot 7, ordre « j »)

**Demande :** D (après la fusion de la suite de 335 côté fiscal : `prospera-fiscal-service` #89, `dev` `dae6a10` ; docs
#1023, #1028, `main` `5a07107`) ; placée par la session de groupe après STORY-1137 et la demande « k », avant STORY-1131
(D-L7B-14). **Aucun identifiant neuf.** Et l'information de C (« i », comptabilite #21, `dev` `58803f5`) : la recopie de
l'octet de `comptabilite.facture.desinscrite` « reste à la prochaine story de B sur `document-service` ».
**Dépôt :** `document-service` (GitHub `prospera-ocr-service`, module `ged`), branche `MNV-1124-j`, commits
`MNV-1124(ged): …` · **Lus seulement :** `prospera-fiscal-service` et `prospera-comptabilite-service` (dépôts de C ; B n'y
écrit rien) · **Exécutée par :** groupe B.

**Pourquoi :** la GED décrit encore les deux faits comme des propositions (manifeste `[proposition, à C]`, `[proposition, à
D]` ; `contrat/ORIGINE-DES-SCHEMAS.json` : « PROPOSÉ à … ; la source sera … ») alors que leurs producteurs les publient ; et
l'aller-retour réel — le fait écrit par l'outbox du fiscal, les octets tirés par la vraie route de service, au vrai jeton —
n'a jamais été joué : la preuve de « h » doublait la route (D-1124-24).

### Où en est-on

- [x] Rituel : journaux de A, C, D (aucune demande neuve à B hors de celles placées : « k » est servie à part, dans
  `auth-service`) ; `document-service` sur `dev` à jour (`8f9040d`), propre.
- [x] Relu avant d'écrire : les deux octets (ci-dessous) ; dans la GED, `contrat/ORIGINE-DES-SCHEMAS.json`,
  `piece-fiscale.spec.ts` et `factures.service.spec.ts` (les gardes d'octet des faits consommés), `module.manifest.ts`,
  `socle/manifestes/sources-des-manifestes.ts`, `.env.example` ; dans le fiscal (`origin/dev`, lecture seule) :
  `Dockerfile`, `config/env.validation.ts`, `mongo/` (son Mongo authentifié, provisionné par ses scripts),
  `modules/depots/depots.module.ts`, `application/depots/archives-depot.service.ts` et `accuses-depot.service.ts`,
  `adapters/mongo/mongo-registre-livrables-archives.ts` et `mongo-registre-accuses-depot.ts` (le livrable, son acte au
  journal chaîné et le fait dans l'outbox, une transaction), `kafka/events/piece-archivee-events.ts`,
  `kafka/outbox/outbox-relay.*` (relais BullMQ sur Redis), `domain/depot/pieces-depot-service.ts` (le jeton de
  service, la route) ; la surcouche `prospera-recette/docker-compose.fiscal.yml` (STORY-901).
- [x] Annonce avant le code (stories #1037, `main` `c82795a`) ; aller-retour sur pile `grp-b` neuve, 32/32 ; PR de code
  fusionnée en rebase : document-service **#43** (`f6c00d6` sur `dev`) ; PR de docs finale (« Réponses » → D, information
  à C).

### Les octets, vérifiés

| Fait | Producteur (`origin/dev`, blob en LF) | Copies de la GED (`contrat/consommes/`, `cabinet/schemas/`) |
|---|---|---|
| `fiscal.depot.piece-archivee` v1 | `prospera-fiscal-service@dae6a10` (#89 ; `dev` `6cd99ee` le porte, inchangé), `src/kafka/events/fiscal.depot.piece-archivee.v1.json` : `51838a86…3493` | `51838a86…3493`, les deux |
| `comptabilite.facture.desinscrite` v1 | `prospera-comptabilite-service@58803f5` (#21), `contrat/schemas/comptabilite.facture.desinscrite.v1.json` : `86a50e6f…2ecf` | `86a50e6f…2ecf`, les deux |

Aucune recopie de texte : les producteurs ont repris l'octet de B.

### Décisions retenues par défaut (contestables)

- **D-1124-27 — La demande « j » se rattache à STORY-1124**, comme « h » (D-1124-13) : elle en achève le circuit (publier
  ce qui était proposé, jouer l'aller-retour que la doublure remplaçait). Aucun identifiant neuf (D-L7B-14).
- **D-1124-28 — Le texte des schémas ne change pas ; leur origine, si.** La description des deux schémas dit encore
  « proposé par B à … » : c'est l'octet que les producteurs publient, et le réécrire dans la GED casserait la copie à
  l'octet (§1.8). Seule `ORIGINE-DES-SCHEMAS.json` (`origines`) passe de « PROPOSÉ à … ; la source sera … » au producteur
  publié, dépôt@commit et chemin — la forme de `comptabilite.facture.inscrite` (D-1100-4) ; les commentaires du code
  (`piece-fiscale.ts`, `facture-desinscrite.ts`, le consommateur des factures) et les titres des tests suivent.
- **D-1124-29 — Un garde-fou de plus, sur le patron des faits consommés.** Chaque fait consommé a déjà sa garde d'octet
  (copie = image d'exécution = empreinte épinglée = `ORIGINE`). Le test exige en plus que l'origine des deux faits **nomme
  son producteur à un commit** (`^prospera-fiscal-service@[0-9a-f]{7}`, `^prospera-comptabilite-service@[0-9a-f]{7}`) et ne
  dise plus « PROPOSÉ » : une origine qui retomberait en proposition, ou une copie changée sans sa source, rougit. Le test
  ne lit pas le dépôt du producteur (la CI n'en a pas le checkout) : la comparaison avec l'octet du producteur est le geste
  de la story, noté ici.
- **D-1124-30 — Le manifeste `ged` reste 1.11.0 ; aucune recopie au catalogue.** Seuls deux commentaires changent
  (`[proposition, à C]` → `[publié par C, comptabilite #21]`, `[proposition, à D]` → `[publié par D, fiscal #89]`) et une
  ligne d'historique ; aucune valeur (la liste `consomme` est la même). Le catalogue copie des valeurs (`copies.json`, la
  garde compare champ par champ) : sa copie est identique, une version neuve n'aurait rien à porter. La source
  (`prospera-stories/manifestes/ged.manifest.ts`, cette PR) est recopiée à l'octet dans le service avec sa nouvelle
  empreinte (`sources-des-manifestes.ts`).
- **D-1124-31 — L'aller-retour se joue contre le vrai fiscal.** Image construite depuis `git -c core.autocrlf=false archive
  origin/dev` du dépôt de C ; ses dépendances relues : **aucun Postgres** ; son MongoDB authentifié en replica set, monté
  par ses propres scripts (`mongo/`, comme la recette, STORY-901), Kafka, Redis (le relais de l'outbox est une tâche
  BullMQ), MinIO (son bucket privé `fiscal-depots`, créé à son démarrage), un JWKS (la doublure d'auth). **Le dépôt** :
  la route `POST …/depots-declaration/{depotId}/livrable` exige la chaîne entière en amont (l'obligation du portefeuille,
  la déclaration figée lue chez `bilan-service`, le guidage du paquet de dépôt, l'engagement, l'estampille du classeur) —
  disproportionné pour prouver la copie. L'archivage est donc fait **par le code du fiscal lui-même**, dans son image :
  ses registres (`archiver`, `consigner` : l'objet dans son bucket, puis le livrable ou l'accusé, son acte au journal
  chaîné et le fait dans l'outbox, en une transaction), ses constructeurs du fait (`construirePieceArchivee`,
  `enveloppePieceArchivee`) — les appels mêmes du service après ses préconditions. Le relais du fiscal publie ; la GED
  consomme et tire les octets par la vraie route, au vrai jeton. Le livrable est un vrai classeur (le gabarit DSF des
  fixtures du fiscal), l'accusé un PDF.
- **D-1124-32 — Le jeton de service naît dans la pile.** Un conteneur d'amorce tire 48 caractères aléatoires dans un volume
  de la pile ; le fiscal (`JETONS_DE_SERVICE=document-service:<jeton>`) et la GED (`FISCAL_JETON_SERVICE`) le lisent au
  démarrage. Il n'est écrit ni dans un fichier versionné, ni dans le compose, ni sur l'hôte ; le volume part au `down -v`.
- **D-1124-33 — Le registre confirme l'identité.** Karapace sur le Kafka de la pile : le schéma du fiscal (son fichier)
  enregistré sous `fiscal.depot.piece-archivee-value`, puis la copie de la GED soumise au même sujet — le registre rend le
  même identifiant (aucune version neuve). L'enregistrement réel du fait au registre de la plateforme reste au producteur.

### Preuves attendues

Sur une pile `grp-b` neuve : le classeur et l'accusé archivés par le fiscal → le fait sur le topic (clé `orgId`, en-têtes
`eventId`, `schemaVersion`) → la GED range `DECLARATION_FISCALE` et `ACCUSE_DEPOT` au fonds de la période, octets relus à
l'identique, empreinte = `X-Empreinte-Sha256` ; le rejeu du fait (même message, trois fois) ne range rien de plus ; la route
refuse un mauvais jeton (401 `JETON_DE_SERVICE_REQUIS`) et la GED au mauvais jeton n'écrit rien (message relu, `ged.fiscal`
bloqué), puis range au bon ; un objet altéré dans le bucket du fiscal → 502 `FICHIER_ARCHIVE_ALTERE` → attente
`ORIGINAL_ALTERE` ; une pièce inconnue → 404 `PIECE_INTROUVABLE`. Puis l'étage `verification` (Node 24) de la GED.

### Livré (27/11)

- **document-service #43**, trois commits sur `dev` (fusionnée en rebase ; dernier : `f6c00d6`) : `contrat/ORIGINE-DES-SCHEMAS.json`
  (les deux origines au producteur, à son commit) ; gardes des deux faits et de `comptabilite.facture.inscrite` ; commentaires
  de `piece-fiscale.ts`, `facture-desinscrite.ts`, du consommateur des factures ; manifeste `ged` 1.11.0 recopié depuis
  `prospera-stories@c82795a` (`4b34ac5f…7191`, `sources-des-manifestes.ts`) ; **`pieces-fiscales-consumer.bootstrap.ts`**
  (D-1124-34). Aucun schéma, aucune route, aucun droit, aucun fait publié ne change ; le catalogue n'est pas touché (D-1124-30).

### Écarts décidés au code

- **D-1124-34 — Un échec du groupe `ged.fiscal` attend avant d'être relu.** L'aller-retour l'a montré : le client de Confluent
  relit un message aussitôt que son traitement lève, et la supervision ne retarde que les démarrages. Une GED au mauvais jeton
  a appelé le vrai fiscal **162 fois en 111 s** (401, puis **429** de son limiteur, 100 par minute et par adresse). Le
  consommateur attend désormais, à chaque échec consécutif, 1 s, puis 2, 4… 30 s au plus, **avant** de lever (le message reste
  relu, rien ne se perd, le groupe passe toujours « bloqué » au troisième échec) ; un message traité remet le compte à zéro ;
  l'arrêt du module coupe l'attente. Sur la pile : **7 appels en 66 s**. Seul ce consommateur appelle un service à chaque
  message ; ceux des factures ne lisent que Mongo.
- **D-1124-35 — Le dépôt par le code du fiscal, confirmé.** `amorce.cjs` (preuve, hors dépôt) ouvre le contexte Nest de
  l'`AppModule` compilé du fiscal dans son image, avec Kafka et Redis injoignables pour ce seul processus : il n'écrit que dans
  Mongo et MinIO, par `RegistreLivrablesArchives.archiver` et `RegistreAccusesDepot.consigner` ; le relais du service publie.
  Le fait arrive sur le topic avec la clé `orgId` et les en-têtes `eventId`, `schemaVersion` (`schemaVersion:1`), la ligne
  d'outbox passe `SENT`.
- **D-1124-36 — Le limiteur du fiscal sur la route de service : une information à D, pas un défaut bloquant.** La route
  `/api/v1/service/…` passe sous le limiteur global du fiscal (100 requêtes par minute et par adresse) : une reprise de plus de
  cent attentes d'un même dossier (l'ouverture d'un fonds après une longue panne) recevrait des 429, que la GED traite comme une
  source indisponible (l'attente reste `SOURCE_INDISPONIBLE`, reprise au fait suivant). Demande non bloquante à D (journal de
  B) : exempter la route de service du limiteur par adresse, ou lui donner sa limite.

### Preuves

- **Pile `grp-b` neuve, le vrai fiscal** (image de `prospera-fiscal-service` depuis `git -c core.autocrlf=false archive
  origin/dev`, `6cd99ee`, qui porte `dae6a10` ; son Mongo 8.0 authentifié `rs-fiscal` monté par ses scripts ; Redis à lui ;
  MinIO, bucket `fiscal-depots` créé à son démarrage ; aucun Postgres) ; la GED depuis l'archive de la branche (Mongo 7 `rs0`,
  Kafka 3.9, Redis, Karapace 6.2, doublure d'auth) ; **jeton de service de 48 caractères tiré dans le volume de la pile**,
  lu au démarrage par les deux services — **32/32** :
  le fiscal sain (Mongo, audit, Kafka, Redis) ; **Karapace** : le schéma du fiscal et la copie de la GED, un seul schéma (id 1,
  une version) ; un **vrai classeur** (gabarit DSF des fixtures du fiscal, 5 535 188 octets) archivé par le fiscal → outbox
  `SENT` → topic (clé `orgId`, en-têtes `eventId`, `schemaVersion:1`) → la GED range **`DECLARATION_FISCALE`** au fonds de la
  période (`ARC-2026-ALPHA-00001`), empreinte = celle du fiscal, **contenu relu à l'octet** ; la route au vrai jeton : 200,
  `X-Empreinte-Sha256` = les octets, `application/octet-stream`, `no-store` ; un accusé PDF → **`ACCUSE_DEPOT`**, avec sa
  lecture ; **rejeu** : le relais du fiscal republie le même fait (ligne d'outbox remise `PENDING`), puis le même message trois
  fois, un témoin rangé après : **une copie, un rattachement** ; un objet **altéré** dans le bucket du fiscal : la route rend
  **502 `FICHIER_ARCHIVE_ALTERE`**, la GED attend **`ORIGINAL_ALTERE`**, aucune copie ; **404 `PIECE_INTROUVABLE`** pour une
  pièce inconnue et pour un livrable demandé comme accusé ; **401 `JETON_DE_SERVICE_REQUIS`** sans jeton, au mauvais jeton
  (aucun octet servi) et au jeton d'un membre ; **la GED au mauvais jeton** (redémarrée) : rien d'écrit, `/health` 503 nomme
  `ged.fiscal`, **7 appels en 66 s** (D-1124-34) ; au bon jeton (redémarrée), le message relu est rangé (version 2 du livrable).
  Journaux : les erreurs sont celles voulues (502, 401, santé 503 pendant la panne). Mémoire de la pile ≤ 2,0 Gio.
- Première passe (avant le correctif, 12:26 → 12:40) : 26/26 puis coupée par son délai avant le 502 et le 404 ; elle a montré
  les 162 appels.
- Node 25 (poste), par chemin : `pieces-fiscales-consumer.bootstrap.spec.ts` 3/3 ; `factures.service.spec.ts`,
  `piece-fiscale.spec.ts`, `socle/manifestes` 37/37 ; `cabinet/`, `socle/manifestes`, `kafka/` 423/424 avant la correction
  d'`ORIGINE` (voir « Pièges ») ; lint des fichiers touchés.
- **Node 24** (étage `verification`, archive de la branche) : unitaires 121/121 suites, 1 450 passés (5 ignorés) ; e2e 17/17 suites, 224/224.
- **Mutations** : origines 6/6 (fiscal retombé en proposition, sans commit, autre chemin ; désinscrite retombée en proposition,
  au nom de la GED ; inscrite au nom de la GED) ; attente 5/5 (aucune attente, compte jamais remis à zéro, aucun plafond, délai
  constant, arrêt qui ne coupe pas l'attente).
- Verrou : 10:17 → 12:26 (passe figée, voir « Pièges »), 12:26 → 12:40, 13:19 → 13:34, 14:06 → 14:11 (Node 24).

### Nommé pour plus tard

- L'enregistrement de `fiscal.depot.piece-archivee` au registre de la plateforme : au producteur (D), comme ses autres faits.
- `VALIDATION_CLIENT` émise par le fiscal (D-335-14, D) : la GED la rattache déjà (« h »).
