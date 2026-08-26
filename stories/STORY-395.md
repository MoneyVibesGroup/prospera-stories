# STORY-395 : Les pièces sont conservées, mais rien ne les range par exercice — un contrôle fiscal ne peut pas les rassembler

**Epic :** EPIC-020 — Adaptateur #3, construction chemin A (cahiers recettes/dépenses + OCR + rattachement plan comptable)
**Réf. :** exigence PO du 2026-08-24 à la validation de la maquette **FE-043** — *« n'oublie pas de bien garder les images qui sont les preuves et de bien les horodater par exercice, pour que demain, dans le cas d'un contrôle, ce soit beaucoup plus facile »*
**Priorité :** Must Have
**Story Points :** 3
**Statut :** review
**Complexité :** medium
**Sprint :** 20
**Service :** `document-service` (`:3006`) — **avec un versant `balance-service`** (cf. « Qui écrit »)

---

## Les deux moitiés de l'exigence, et elles n'ont pas le même état

### ✅ « garder les images » — **déjà vrai**, mais par absence de purge

Vérifié à la source le 2026-08-24 : **aucun index TTL, aucune tâche de purge, aucun
`removeObject`, aucune règle de cycle de vie** sur le bucket `piece-documents` ni sur la
collection `piece_extractions`. Les pièces sont donc conservées **indéfiniment**.

⚠️ **Mais ce n'est pas une politique, c'est un silence.** Rien dans le code ne dit que cette
conservation est *voulue*, ni pour combien de temps. La prochaine personne qui verra un bucket
grossir n'aura **aucun signal** lui disant qu'elle regarde des **pièces justificatives
opposables** et non un cache d'OCR. ⇒ la conservation doit être **écrite et testée**, pas
constatée.

### ⛔ « les horodater par exercice » — **pas servable du tout**

`piece_extractions` porte `orgId`, `correlationId`, `pieceId`, `dossierId?`, `type`,
`storageKey`, `statut`, `champs`, `confianceGlobale` et les `timestamps`. **Il n'y a ni exercice,
ni date d'opération.**

Et l'exercice **est connu** — mais ailleurs : `AppliquerLotDto` le porte
(`{ exercice: { debut, fin }, lignesRetenues: [{ pieceId, valeurs }] }`) au moment où le comptable
applique le lot, **côté `balance-service`**, et rien ne le renvoie jamais à `document-service`.

**Deux conséquences, et la seconde est un piège :**

1. On ne peut pas répondre à « **montre-moi toutes les pièces de l'exercice 2026** ». La seule
   lecture disponible, `GET /dossiers/{id}/pieces`, trie par **date de dépôt décroissante** — sur
   un dossier de trois exercices, c'est une pile indifférenciée.
2. ⚠️ **`createdAt` est la date de DÉPÔT, jamais celle de l'OPÉRATION.** Un commerçant qui
   photographie en janvier 2027 le cahier de mars 2026 produit une pièce `createdAt: 2027-01`
   justifiant une recette de l'exercice **2026**. Horodater « par exercice » **en se servant de
   `createdAt` rangerait la preuve dans le mauvais exercice** — c'est-à-dire produirait
   exactement la fausse assurance que cette story existe pour empêcher. **C'est le cas nominal du
   persona, pas un cas limite** : on ne tient pas un cahier papier au jour le jour dans une appli.

---

## Ce qui est demandé

### Qui écrit — et pourquoi ça ne peut pas être le dépôt

Le dépôt (`POST /piece-extractions`) **ne connaît pas l'exercice** : à ce moment-là, la date de
l'opération n'a pas encore été lue par l'OCR, et surtout **elle n'a pas encore été validée par un
humain**. L'exercice n'est certain qu'à l'**application** — le geste où le comptable retient la
pièce et confirme sa date.

⇒ `balance-service`, dans `PiecesOcrService.appliquer`, **stampe** chaque pièce retenue avec
l'exercice du lot et la **date d'opération retenue** (celle des `valeurs`, pas celle de l'OCR brut
si elle a été corrigée).

1. Ajouter à `PieceExtraction` : `exerciceDebut?`, `exerciceFin?`, `dateOperation?`,
   `ligneCahierId?` — tous **facultatifs**, parce qu'une pièce **déposée et non appliquée** n'a
   légitimement pas d'exercice, et qu'un `required` la ferait échouer au dépôt (le défaut payé par
   STORY-372, puis rappelé par le `dossierId?` de STORY-358).
2. Exposer l'écriture : soit une route interne idempotente (`PATCH /piece-extractions/{id}/rattachement`),
   soit la consommation d'un événement émis à l'application. **Le choix appartient à l'archi** —
   la contrainte est l'**idempotence** : réappliquer un lot ne doit jamais dupliquer ni contredire
   un rattachement existant.
3. Ajouter le filtre de lecture sur `GET /dossiers/{id}/pieces` :
   `?exerciceDebut=&exerciceFin=`, et le tri par **`dateOperation` décroissante** quand elle
   existe (dépôt en repli). C'est **la** requête du contrôle fiscal.
4. **Écrire la conservation** : commentaire de politique sur le schéma + le bucket, et un **test
   qui échouerait si un TTL ou une purge apparaissait**. Une garantie que rien ne teste n'est pas
   une garantie — c'est ce que la moitié « déjà vrai » nous apprend.

## Critères d'acceptation

1. Une pièce **appliquée** porte `exerciceDebut`, `exerciceFin` et `dateOperation` ; une pièce
   **déposée et non appliquée** ne les porte pas — et les deux restent distinguables.
2. `dateOperation` est **la date retenue par le comptable**, jamais `createdAt`, jamais la date
   OCR brute si elle a été corrigée. **Un test couvre explicitement le cas « pièce de mars 2026
   déposée en janvier 2027 »** : elle doit ressortir dans l'exercice **2026**.
3. `GET /dossiers/{id}/pieces?exerciceDebut=…&exerciceFin=…` ne rend que les pièces de cet
   exercice, triées par `dateOperation` décroissante.
4. Réappliquer le même lot **n'altère pas** le rattachement déjà posé (idempotence).
5. Un test **interdit la purge** : présence d'un TTL ou d'une suppression sur `piece_extractions`
   ou sur le bucket ⇒ rouge.
6. Aucune régression : les pièces déjà déposées (sans exercice) restent listées et consultables.

## Recouvrement assumé avec STORY-392

STORY-392 ajoute `pieceId`/`correlationId` et un filtre à **la même route**. Les deux touchent
`PieceDossierResponseDto` et `listerParDossier` — **les livrer ensemble évite deux passes** sur le
même DTO. Elles restent **distinctes** parce qu'elles répondent à deux questions différentes :
392 = « quelle image justifie *cette ligne* ? » (l'écran) ; 395 = « quelles pièces justifient *cet
exercice* ? » (le contrôle). L'une sert le comptable au quotidien, l'autre l'inspecteur trois ans
plus tard.

## Ce que le front fait en attendant

FE-043 affiche la preuve **par mois**, en s'appuyant sur la date de la **ligne de cahier** — qui,
elle, est bien dans le bon exercice. La **pièce**, en revanche, reste non filtrable par exercice :
l'onglet « Pièces » du dossier montre une pile triée par dépôt. Le contournement se retire quand
cette story est livrée.

---

## Décision d'architecture — le rattachement passe par Kafka, pas par un PATCH HTTP

La story laissait le choix à l'archi entre « une route interne idempotente » et « la consommation
d'un événement ». **Kafka a été retenu**, et la raison est le mode de panne, pas la préférence :

| | route `PATCH` synchrone | événement `cahier.piece.rattachee` (retenu) |
|---|---|---|
| Chemin d'appel | sur l'**écriture comptable** (`appliquer`) | hors chemin chaud |
| `document-service` indisponible | rattachement **perdu en silence**, ou 500 sur une écriture déjà commitée | rejoué par l'outbox (*at-least-once*) |
| Invariant #1 / garde-fou #2 | second couplage synchrone sortant | conforme : le seul HTTP sortant reste l'upload aller |
| Identité d'appel | exigerait de propager le bearer jusqu'à `appliquer` | aucune |

Un rattachement perdu en silence, c'est **exactement** la fausse assurance que cette story existe
pour fermer : l'image resterait conservée, et introuvable pour son exercice.

⚠️ **`eventId` aléatoire, jamais dérivé de `(lot, pièce)`.** Un identifiant déterministe buterait
sur l'unicité de l'outbox à la seconde application du même lot, avorterait la transaction de trace
et rendrait **500** une écriture comptable déjà commitée. L'idempotence de l'**effet** (AC4) est
portée par le **consommateur** — filtre `dateOperation: { $exists: false }`, premier rattachement
gagnant — jamais par un doublon côté producteur.

## Progress Tracking

**Statut : `review`** — implémentée, validée, vérifiée en docker sur stack neuve. Deux dépôts.

### Livré

**`balance-service` (producteur)**
- `src/kafka/events/cahier-piece-events.ts` — contrat `cahier.piece.rattachee` v1 + mapper figé
  (`lotId`, `pieceId`, `exerciceDebut`, `exerciceFin`, `dateOperation`, `ligneCahierId`,
  `dossierId`, `occurredAt`). **Byte-identique** avec la copie de `document-service` (K4).
- `src/kafka/outbox/cahier-events.service.ts` — `CahierEventsService.pieceRattachee`, partition
  `orgId`, exporté par `OutboxModule` (`@Global`).
- `PiecesOcrService.tracerApplication` — devient **transactionnelle** : `marquerAppliquee` (N docs)
  + `outbox.enqueue` (N docs) dans **une** session, abort **gardé**. `dateOperation` vient de
  `creees[i].date` — la date **retenue par le comptable**, jamais celle du brouillon OCR.
- `CahiersRecettesService`/`CahiersDepensesService.creerLotOcr` rendent désormais l'`exercice`
  **résolu** (`exigerExercice`) : une seule vérité, jamais re-dérivée par l'appelant.

**`document-service` (consommateur)**
- 4 champs **facultatifs** sur `PieceExtraction` : `exerciceDebut`, `exerciceFin`, `dateOperation`,
  `ligneCahierId` — posés **ensemble** ou pas du tout.
- Index partiel `(orgId, dossierId, dateOperation, _id)` — voir *Plan de requête* ci-dessous.
- `CahierPieceConsumer` (group **isolé** `document-cahier`, `KAFKA_CAHIER_GROUP_ID`, tolérant panne)
  → `lireEvenementCahierPiece` (fichier **couvert**) → `PieceRattachementProjectionService`
  (transaction `ProcessedEvent` + rattachement).
- `PieceExtractionRepository.rattacherExercice` — **premier rattachement gagnant**
  (`dateOperation: { $exists: false }`).
- `GET /dossiers/:id/pieces?exerciceDebut=&exerciceFin=` — bornes **par paire**, **incluses**,
  portant sur `dateOperation` ; tri par date d'opération décroissante, **dépôt en repli** ; les 4
  champs publiés sur `PieceDossierResponseDto`.
- **Politique de conservation écrite et testée** (`piece-conservation.spec.ts`).

### Portes de qualité

| | `balance-service` | `document-service` |
|---|---|---|
| Lint | 0 warning | 0 warning |
| Build | OK | OK |
| Unitaires | 3 083 | 745 |
| e2e | 739 | 116 |
| Couverture | 99,13 / 92,07 / 98,55 / 99,22 | 99,19 / 93,34 / 98,21 / 99,23 |

**28 mutations jouées, 27 rouges.** La 28ᵉ (`creerLotOcr` rendant `new Date(brut)` au lieu de
l'exercice résolu) est une mutation **équivalente** — sur ce chemin `resoudreExercice` fait
littéralement `new Date` — et a été remplacée par deux mutations non équivalentes (bornes rendues
en **chaînes**), toutes deux rouges.

⚠️ **Deux tests écrits par mes soins étaient VACANTS, et seule la mutation l'a montré :**
1. le test « cas du persona » du tri utilisait une fixture où **les deux tris donnaient le même
   ordre** — trier par `createdAt` le laissait **vert**. Refait avec des dates volontairement en
   ordre inverse l'une de l'autre ;
2. la garde « aucune propriété ne porte `expires` » testait `'expires' in options`. Mesuré :
   **Mongoose pose cette clé — à `undefined` — sur TOUT chemin `Date`**, `createdAt` compris. Le
   test aurait été rouge en permanence sur un schéma sain, et la seule façon de le « réparer »
   aurait été de le désarmer. C'est la **valeur** qui dit s'il y a un TTL.

### Vérification docker (stack neuve, `down -v`)

Parcours réel : `register` → dossier (`dossier-service`) → dépôt de 3 pièces via le proxy OCR de
`balance-service` → application des lots → lecture par `document-service`.

- **⚡ Le cas du persona, mesuré en base** : pièce déposée le **2026-08-26**, rattachée à
  l'opération du **2026-03-14**. `createdAt` et `dateOperation` divergent de cinq mois, et c'est la
  seconde qui range la preuve.
- **Round-trip Kafka complet** : `outbox_events` (balance) `SENT` → `piece_extractions`
  (document) portant les 4 champs.
- **AC4 — idempotence prouvée sur DEUX messages distincts** : réapplication du même lot avec une
  autre date (2026-09-01) et une autre ligne ⇒ second événement bien émis, rattachement **inchangé**
  (2026-03-14, première ligne). Journal du consommateur : *« Rattachement … sans effet : pièce
  inconnue ou déjà rattachée »*.
- **Lien inter-services non orphelin** : chaque `ligneCahierId` pointe une `lignes_recettes` réelle,
  à la **même date** que `dateOperation`, `origine: OCR`. 0 rattachement partiel, 0 orphelin.
- **AC3 / AC6, 7 requêtes** : sans filtre → 3 pièces (dont la non appliquée, rangée sur son dépôt en
  repli) · exercice 2026 → 2 pièces triées par opération décroissante · 2025 → 0 · T1 2026 → 1 ·
  bornes incluses pile sur l'opération → 1 · une seule borne → **400** · horodatage sans fuseau →
  **400**.
- **AC5 — conservation** : `getIndexes()` sur `piece_extractions` ⇒ **aucun index TTL**.
- **Démarrage dégradé** confirmé : `Démarrage du consommateur cahier.piece.rattachee différé : This
  server does not host this topic-partition`, puis adhésion au group — le boot HTTP n'a jamais
  échoué.

#### Plan de requête — l'index a été corrigé PAR la mesure

L'`explain()` de la requête du contrôle a **infirmé** une première rédaction : un index s'arrêtant à
`dateOperation` ne sert **pas** le tri, parce que la lecture départage les ex æquo par `_id`.

| tri demandé | index | étape racine | `SORT` bloquant |
|---|---|---|---|
| `{ createdAt, _id }` | `(org, dossier, dateOperation)` | `SORT` | **oui** |
| `{ dateOperation, _id }` | `(org, dossier, dateOperation)` | `SORT` | **oui** |
| `{ dateOperation, _id }` | `(org, dossier, dateOperation, _id)` | `FETCH` | **non** |

⇒ l'index porte `_id` en quatrième clé : il garde le **départage total** (leçon STORY-187 : un tri
non total ne se voit qu'en pagination) **et** supprime le tri en mémoire sur un dossier qui peut
compter des milliers de pièces.

⚠️ **Index obsolète confirmé** : la version à 3 clés déployée en cours de vérification est restée en
base après le changement de schéma — **Mongoose ne supprime jamais un index obsolète** (leçon
STORY-357). Retiré à la main, puis redémarrage : le schéma seul ne recrée que l'index voulu.

### Hors périmètre (hooks inertes, documentés)

- **Aucune reprise rétroactive** des pièces déjà appliquées avant cette story : elles restent sans
  exercice et continuent de sortir sur la lecture non filtrée (AC6). Migration = souci de prod,
  différé (règle projet).
- **`profil_extractions` n'est pas rattachable à un exercice** : une pièce de constitution ne
  justifie aucune opération. Le filtre l'exclut explicitement plutôt qu'en silence.
- **Pas de pagination** sur `GET /dossiers/:id/pieces` — inchangé depuis STORY-358. L'index porte
  déjà `_id`, donc le jour où elle arrivera, le tri sera total.

### Front

Le contournement de **FE-043** (affichage par mois via la date de la *ligne de cahier*) peut être
retiré : l'onglet « Pièces » sait désormais se filtrer par exercice.
