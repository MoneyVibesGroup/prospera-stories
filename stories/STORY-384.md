# STORY-384 : Une pièce déposée avant la création du dossier ne peut plus JAMAIS lui être rattachée

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** écart remonté par **FE-064** *(les pièces du dossier)*, 2026-08-23 — prolonge **STORY-358**
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done
**Complexité :** low
**Sprint :** 20
**Service :** `document-service` (`:3006`) *(+ `balance-service` : un champ de plus au proxy OCR)*

---

## Le constat

STORY-358 a livré le rattachement d'une pièce à un dossier — **au dépôt, et seulement au dépôt** :
`dossierId` est un champ du corps multipart de `POST /profil-extractions` et de
`POST /piece-extractions`. Il n'existe **aucune** route pour rattacher une pièce déjà déposée.

Or le seul moment où le cabinet dépose ses statuts et sa carte CFE est l'**étape 1 de l'assistant de
création** (FE-060) — c'est-à-dire **avant que le dossier existe**. Et ce dépôt-là ne passe même pas
par `document-service` : il passe par `balance-service` (`POST /profil-societe/ocr`), qui proxifie
chaque pièce avec un `correlationId` commun (D4) et **ne transporte pas de `dossierId`**.

La séquence est donc structurellement fermée :

```
étape 1 : dépôt des pièces  →  (pas de dossier : rien à rattacher)
étape n : création du dossier  →  (pas de route : plus rien ne rattache)
```

**Conséquence vécue, vérifiée en docker le 2026-08-23** : un dossier créé par l'assistant s'ouvre
sur un onglet « Pièces » **vide**, alors que ses statuts et sa carte CFE ont bel et bien été déposés,
lus, et ont pré-rempli son identité. Les pièces existent — dans `profil_extractions`, sans
`dossierId` — et plus personne ne peut les retrouver depuis le dossier qu'elles ont constitué.

⚠️ **Ce n'est pas la même chose que « la pièce est perdue »** : elle est stockée, elle est opposable,
elle est même consultable par qui connaît son identifiant d'extraction. Ce qui manque est **le lien**,
et c'est précisément ce que STORY-358 existait pour créer.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **retrouver dans le dossier les pièces qui ont servi à le créer**,
afin de **justifier son identité fiscale par les documents dont elle sort**.

---

## Ce que la story doit livrer

Deux chemins sont possibles ; **le second est recommandé**, le premier est le repli.

### Option A — le rattachement a posteriori *(une route de plus)*

`PATCH /api/v1/profil-extractions/:id/dossier` *(et son jumeau pour les pièces comptables)*, corps
`{ dossierId }`, gardé par `DossierGate.exigerPourDepot` — **404** si le dossier n'existe pas dans
l'organisation de l'appelant, **409 `DOSSIER_ARCHIVE`** sur un dossier archivé.

⚠️ **La clé de stockage NE bouge PAS.** `dossiers/<orgId>/<dossierId>/<uuid>` est la convention des
pièces déposées *avec* un dossier ; déplacer un objet MinIO déjà écrit pour la respecter ferait
courir le risque d'un orphelin — exactement ce que D-358-2 refuse. Le chemin d'origine
(`<orgId>/<uuid>`) reste valide, et la lecture signe déjà d'après `storageKey`.

⚠️ **Rattachement UNIQUEMENT si la pièce n'en a pas déjà un.** Déplacer une pièce d'un dossier à un
autre est un geste différent — et non demandé : une pièce est opposable, la voir changer de dossier
réécrirait l'histoire d'un contrôle. Une pièce déjà rattachée ⇒ **409**.

### Option B — porter le `dossierId` jusqu'au bout du parcours *(recommandé)*

Le vrai défaut est en amont : l'assistant **connaît** le dossier au moment où il le crée, mais plus
rien ne redescend vers les pièces. Deux ajouts suffisent :

1. `balance-service` : `POST /profil-societe/ocr` accepte un `dossierId` **facultatif** et le
   propage au proxy vers `document-service` — le champ existe déjà côté destinataire.
2. `document-service` : la route de rattachement d'Option A, **pour le cas où le dossier n'existe
   pas encore au dépôt** — c'est le cas nominal de l'assistant, pas un cas de bord.

⇒ **Les deux sont nécessaires** : (1) sert les dépôts faits *après* création (import d'une pièce sur
un dossier existant, par un autre écran), (2) sert l'assistant. Sans (2), l'assistant reste bloqué.

---

## Acceptance Criteria

- [x] Une pièce déposée **sans** `dossierId` peut être rattachée ensuite à un dossier de la **même
      organisation** ; elle apparaît alors dans `GET /dossiers/:dossierId/pieces`.
      *(docker : onglet `[]` → 2 pièces ; les deux familles, par id ET par corrélation)*
- [x] Le rattachement vers un dossier **inexistant ou d'une autre organisation** rend **404**, corps
      strictement identique dans les deux cas *(anti-énumération, comme STORY-358)*.
      *(docker : corps identiques au `requestId` près)*
- [x] Le rattachement vers un dossier **archivé** rend **409 `DOSSIER_ARCHIVE`** — on ne verse plus
      de pièce à un dossier clos *(D9)*. *(docker ; et le refus n'écrit rien : la pièce reste clé absente)*
- [x] Une pièce **déjà rattachée** ne se re-rattache pas *(409)* : elle est opposable.
      *(docker : même dossier ET autre dossier ⇒ 409 `PIECE_DEJA_RATTACHEE`)*
- [x] `POST /profil-societe/ocr` (`balance-service`) accepte un `dossierId` facultatif et le
      **propage tel quel** ; l'omettre garde le comportement actuel, **202** inchangé.
      ⚠️ **Ce critère était INVÉRIFIABLE au départ** : la route rendait **502** pour *tout* appel depuis
      STORY-081 — cf. § *Écart trouvé*. Il n'est tenu que parce que ce défaut a été corrigé.
- [x] Non-régression : le chemin **KYC** n'est pas touché *(D2 — le KYC ne descend pas au dossier)*.
      *(aucun fichier du chemin KYC dans le diff ; `document_extractions` intacte)*
- [x] Vérification **docker réelle** : un dossier créé par l'assistant expose ses **deux** pièces.
      *(parcours complet rejoué — cf. § *Constat de revue BLOQUANT*, le geste par corrélation)*

---

## Hors périmètre

- **Option A seule** — le repli sans (1) n'est pas ce qui est livré : `balance-service` propage `dossierId`
  **et** `document-service` expose la route de rattachement. Les deux sont nécessaires (Option B).
- **Déplacement d'une pièce déjà rattachée d'un dossier à un autre** — geste différent, non demandé
  (D-358-2 : une pièce est opposable). Une pièce déjà rattachée rend **409**, jamais un nouveau lien.
- **Déplacement de la clé de stockage MinIO** — la convention `<orgId>/<uuid>` des pièces déposées sans
  dossier reste inchangée après rattachement ; seul le lien Mongo (`dossierId`) change.
- **Émission ou consommation Kafka** — la lecture `GET /dossiers/:dossierId/pieces` interroge directement
  les collections de `document-service` (pas un read-model alimenté par événement) : aucun contrat
  d'événement ne change.
- **Amélioration de la dégradation gracieuse de `balance-service`** — un `dossierId` que `document-service`
  refuserait (404/409) reste absorbé par le catch-all existant de `ProfilOcrService.demarrer` (502
  `DOCUMENT_SERVICE_INJOIGNABLE` + proposition `ECHEC`), comportement **inchangé**, pas plus fin qu'avant.
- **Front (FE-060)** — l'assistant de création n'est pas câblé par cette story ; elle livre le maillon
  serveur qui lui manquait.

---

## Dépendances

**Prérequise :** **STORY-358** ✅ *(le champ, la garde et la lecture existent — il manque le geste)*.
**Consommateur :** **FE-060** *(l'assistant)* et **FE-064** *(l'onglet « Pièces », livré le
2026-08-23)*. ⚠️ **Le front est prêt des deux côtés** : la liste sait afficher les pièces, le dépôt
sait envoyer un `dossierId`. Il ne manque que le maillon serveur.

---

## Notes techniques

- **Rattachement atomique, à sens unique.** `PieceExtractionRepository.rattacherDossier` /
  `ProfilExtractionRepository.rattacherDossier` posent `dossierId` via un **unique** `updateOne` filtré
  `{ _id, orgId, dossierId: { $exists: false } }` : le filtre exclut lui-même toute pièce déjà rattachée,
  donc deux appels concurrents sur la même pièce ne peuvent jamais tous les deux réussir — pas de
  lecture-puis-écriture séparée qui laisserait une fenêtre de course. `modifiedCount === 0` déclenche une
  seconde lecture (`exists({ _id, orgId })`) **seulement** pour distinguer le message d'erreur
  (`INTROUVABLE` vs `DEJA_RATTACHEE`), jamais sur le chemin qui réussit.
- **Ordre des vérifications, côté service** : `DossierGate.exigerPourDepot` (le dossier visé existe-t-il,
  est-il ouvert ?) est appelée **avant** l'écriture — c'est une validation de la **requête**, à distinguer
  de la décision sur l'**effet** (la pièce a-t-elle déjà un dossier ?) que l'écriture atomique tranche
  ensuite. Même raisonnement que l'ordre posé en STORY-358 pour `deposer`/`uploader`.
- **`INTROUVABLE` couvre indifféremment** un `extractionId` malformé, une pièce absente et une pièce d'une
  autre organisation — anti-énumération, même patron que `DossierGate.introuvable()`.
- **Codes d'erreur** : `PIECE_CODE.PIECE_DEJA_RATTACHEE` (409), dupliqué dans les deux modules
  (`piece-extraction.constants.ts` / `profil-extraction.constants.ts`) — même convention que les messages
  `MESSAGE_FICHIER_*` déjà dupliqués par module dans ce service.
- **`balance-service`** : `dossierId` ajouté en **facultatif** au DTO de `POST /profil-societe/ocr`
  (`DemarrerOcrDto`), validé `@IsMongoId()`, propagé **tel quel** par `DocumentServiceClient.soumettrePiece`
  (**4ᵉ** paramètre — `orgId` ayant été retiré de la signature, cf. § *Écart trouvé*) — aucune validation
  métier côté `balance-service` : `document-service` reste la seule source de vérité sur l'existence et
  l'état du dossier.
- **Noms de DTO porteurs de la famille** (`RattacherDossierPieceDto` / `RattacherDossierProfilDto`,
  `PieceComptableRattacheeResponseDto` / `PieceProfilRattacheeResponseDto`) : `@nestjs/swagger` indexe les
  schémas **par nom de classe**, donc deux DTO homonymes dans deux modules du même service ne publient
  qu'**un seul** schéma — constat de revue, vérifié sur l'OpenAPI vivant.

## Definition of Done

- [x] Lint 0 warning (`document-service`, `balance-service`)
- [x] Build OK (`document-service`, `balance-service`)
- [x] Unitaires + e2e verts, couverture ≥ seuils sur les fichiers touchés (100 % lignes/fonctions/branches
      sur les nouveaux `repository.rattacherDossier` / `service.rattacherDossier` / `controller`)
- [x] Discipline mutation-test appliquée sur la garde atomique (filtre `$exists: false`) et sur l'ordre
      `DossierGate` avant écriture — mutations rouges, restaurées (voir *Table de mutations*)
- [x] Vérification docker réelle (persistance + non-régression), **rejouée sur l'état final** après les correctifs de revue
- [x] Revue de code — 5 constats, **tous traités** (1 bloquant : la route inatteignable depuis le parcours de l'assistant)
- [x] Revue de sécurité — **0 vulnérabilité**, arguments exécutables
- [x] Endpoints documentés dans Swagger — **confirmé sur l'OpenAPI vivant** de `:3006` : les **4** routes
      `PATCH` publiées, chacune avec son propre schéma de corps et de réponse

## ⚡ Écart trouvé À LA VÉRIFICATION : le proxy OCR profil était MORT depuis STORY-081

**Débordement de périmètre assumé, arbitré par l'user le 2026-08-24.**

Au moment de prouver l'AC-5 (`POST /profil-societe/ocr` avec `dossierId` ⇒ « 202 inchangé »), l'appel
rendait **502 `DOCUMENT_SERVICE_INJOIGNABLE`**. La cause, lue dans les logs de `document-service` :

```
POST /api/v1/profil-extractions -> 400 ["property orgId should not exist"]
```

`DocumentServiceClient.soumettrePiece` ajoutait `orgId` au multipart, or le DTO destinataire tourne en
`forbidNonWhitelisted` et lit l'organisation **dans le JWT**. Donc **chaque** dépôt profil partait en 400,
converti en 502 par la dégradation gracieuse — **indiscernable d'un `document-service` réellement
injoignable**. C'est le masque qui a permis au défaut de survivre.

**Trois faits établis avant de toucher quoi que ce soit :**

| Question | Preuve |
|---|---|
| Est-ce moi qui l'ai introduit ? | **Non** — `git diff origin/dev..MNV-384` sur ce fichier n'ajoute que `dossierId` ; `git log -S "form.append('orgId'"` date la ligne de **MNV-081** |
| Est-ce `dossierId` qui le déclenche ? | **Non** — l'appel **sans** `dossierId` rend le même 400/502 |
| Est-ce un défaut connu ? | **Oui, et déjà corrigé une fois** — STORY-084 l'a trouvé sur le client **jumeau** (`DocumentPieceClient`) et l'a réparé en écrivant : *« Le champ était de toute façon inutile (l'organisation vient du JWT) et, envoyé, il aurait été une organisation déclarée par l'appelant. Retiré. »* Elle n'a **pas** touché le client profil. |

⇒ **Correctif aligné sur le jumeau** : `orgId` retiré du formulaire **et** de la signature (le paramètre
devenait mort). Une garde de non-régression est posée dans `document-service.client.spec.ts` — elle
**assène l'absence** de la part `orgId`, pas seulement la présence des autres.

⚠️ **Ce que les tests ne pouvaient pas voir** : les e2e mockent `DocumentServiceClient`, les unitaires
vérifiaient la **présence** des parts attendues et jamais l'**absence** d'une part de trop. Seul un appel
docker réel, de bout en bout, pouvait le révéler — c'est exactement ce que la DoD attend de la vérification
docker, et la deuxième fois que ce même défaut se paie ainsi.

⚠️ **Piège du hot-reload, rencontré ici aussi** : après le correctif, l'appel rendait **encore** 502 alors
que le fichier **dans le conteneur** ne contenait plus la ligne (`grep -c` = 0). `nest --watch` n'avait pas
rechargé le module. Un `docker compose restart balance-service` a été nécessaire — sans quoi j'aurais conclu
que le correctif ne marchait pas.

---

## Vérification docker — stack en marche, 2026-08-24

Services : `mongo` (rs0) · `kafka` · `redis` · `minio` · `auth-service` · `dossier-service` ·
`document-service` · `balance-service`. **Deux organisations** (A et B rivale), **trois dossiers**.

⚠️ **Le code exécuté est bien celui de la branche** — prouvé par l'OpenAPI **vivant** de `:3006`, qui
publie **7 chemins** dont les deux `PATCH …/dossier` (la story notait **5** chemins avant, sans aucun
`PATCH`) :

```
PATCH  /api/v1/piece-extractions/{id}/dossier
PATCH  /api/v1/profil-extractions/{id}/dossier
```

**① Le bug de la story est REPRODUIT avant d'être corrigé.** Deux pièces (`STATUTS`, `CARTE_CFE`) déposées
**sans** `dossierId`, puis le dossier créé :

```
GET /dossiers/<A1>/pieces  →  []          ← l'onglet « Pièces » VIDE de FE-064
profil_extractions          →  2 documents, dossierId = (CLÉ ABSENTE)
```

**② Le rattachement a posteriori répare exactement cela.** Deux `PATCH …/dossier` ⇒ **200**, puis :

```
GET /dossiers/<A1>/pieces  →  2 pièces, avec URL de consultation signée
```

**③ La clé MinIO NE BOUGE PAS** (D-358-2). Après rattachement, les deux pièces gardent leur clé d'origine —
comptage réel : `0` pièce dont la clé a migré sous `dossiers/` :

```
STATUTS   | dossierId=<A1> | key=<org>/7374e864-…   ← inchangée
CARTE_CFE | dossierId=<A1> | key=<org>/08cec6ea-…   ← inchangée
```

**④ Les six refus, mesurés un par un** :

| Cas | Attendu | Obtenu |
|---|---|---|
| pièce **déjà rattachée**, même dossier | 409 | **409 `PIECE_DEJA_RATTACHEE`** |
| pièce déjà rattachée, **autre** dossier *(déplacement)* | 409 | **409 `PIECE_DEJA_RATTACHEE`** |
| dossier d'une **autre organisation** | 404 | **404 `DOSSIER_INTROUVABLE`** |
| dossier **inexistant** (bien formé) | 404 | **404 `DOSSIER_INTROUVABLE`** |
| `dossierId` **mal formé** (`../autre-org`) | 400 | **400** *(`@IsMongoId`, avant toute écriture)* |
| dossier **archivé** *(D9)* | 409 | **409 `DOSSIER_ARCHIVE`** |

**⑤ Anti-énumération : les corps sont strictement identiques.** « Dossier d'une autre organisation » et
« dossier inexistant » rendent le **même** corps, au `requestId` près :
`{"statusCode":404,"error":"Not Found","message":"Dossier introuvable pour cette organisation.","code":"DOSSIER_INTROUVABLE"}`

**⑥ Isolation sur la PIÈCE, pas seulement sur le dossier.** L'org B tente de rattacher une pièce **d'org
A** à **son propre** dossier ⇒ **404 « Pièce profil introuvable pour cette organisation. »** — le filtre
`orgId` de l'`updateOne` est appliqué en base, pas seulement par la garde.

**⑦ Les deux familles, et la lecture qui les agrège.** Une pièce **comptable** (`FACTURE`) déposée sans
dossier puis rattachée ⇒ **200**, re-rattachement ⇒ **409**. `GET /dossiers/<A1>/pieces` rend alors les
**3** pièces (2 profil + 1 comptable), puis **5** après le parcours assistant.

**⑧ Le parcours de l'assistant, de bout en bout** *(rendu possible par le correctif ci-dessus)* :
`POST /profil-societe/ocr` avec `dossierId` ⇒ **202**, et les deux pièces arrivent chez `document-service`
**avec** leur dossier, rangées sous la convention « avec dossier » :

```
STATUTS   | dossierId=<A1> | key=dossiers/<org>/<A1>/2645cd3f-…
CARTE_CFE | dossierId=<A1> | key=dossiers/<org>/<A1>/d696d00c-…
```

**⑨ Non-régression du chemin sans dossier** : `POST /profil-societe/ocr` **sans** `dossierId` ⇒ **202**,
pièce écrite sous `<org>/<uuid>`, `dossierId` **clé absente**.

**⑩ L'index partiel reste exact, et le test qui le prouve a dû être corrigé.** Index réellement en base :
`{orgId:1, dossierId:1, createdAt:-1}` / `partialFilterExpression {"dossierId":{"$exists":true}}` — il
couvre **4** documents sur **6**.

> 🪤 **Mon premier contrôle était FAUX, pas le code** : `countDocuments({dossierId: null})` rendait `2` et
> j'ai failli conclure à une régression. En Mongo, `{champ: null}` matche **aussi les documents où la clé
> est absente** — il faut `{$type: 'null'}` pour le null littéral. Refait correctement :
> `$type:'null'` → **0**, clé absente → **2**, `$type:'string'` → **4**.

**⑪ Aucun orphelin MinIO — rapprochement croisé, pas un comptage.** Les 6 clés de `profil_extractions` et
les 6 objets du bucket `profil-documents` sont confrontés deux à deux (`comm`) :

```
objets MinIO : 6      clés Mongo : 6
orphelins MinIO (objet sans document) : (aucun)
documents pointant un objet absent    : (aucun)
```

Et **aucun des six refus** n'a créé d'objet.

**⑫ Aucune fuite cross-tenant** : pour chaque pièce portant un `dossierId`, le dossier correspondant du
read-model est relu et son `orgId` comparé à celui de la pièce ⇒ **0 fuite**.

---

## ⚡⚡ Constat de revue BLOQUANT : la route existait mais était INATTEIGNABLE depuis le seul chemin qu'elle devait servir

**La prémisse de la story était fausse.** Elle affirmait « (2) sert l'assistant » — or le rattachement
livré prend l'**id de la `ProfilExtraction`**, et le parcours de l'assistant ne peut pas le connaître.

**Établi en docker, pas déduit** :

| Ce que le front appelle | Ce qu'il reçoit |
|---|---|
| `POST /profil-societe/ocr` *(le proxy, chemin de l'assistant)* | `{extractionId, statut}` — l'id de la **`PropositionProfil` de balance** |
| `GET /profil-societe/ocr/:extractionId` | `['statut','champs','avertissements']` — **aucun id de pièce** |

Les vrais ids (`6a8c600a…c1`, `6a8c600b…cb`) n'existent que dans la base de `document-service`, et
**aucune route ne les expose** — l'OpenAPI vivant le confirme. `DocumentServiceClient.soumettrePiece`
retourne `Promise<void>` : les ids sont **jetés au moment même où ils sont créés**.

⇒ `PATCH /profil-extractions/:id/dossier` était **un livrable inerte pour l'assistant** — la classe de
défaut exacte de STORY-173. Ma vérification docker initiale ne l'a pas vu parce qu'elle obtenait l'id du
dépôt **direct**, jamais du proxy : elle prouvait un chemin que la story ne visait pas.

### Le correctif, arbitré par l'user : rattacher par `correlationId`

`PATCH /api/v1/profil-extractions/dossier` *(et son jumeau `piece-extractions`)*, corps
`{ correlationId, dossierId }` — rattache **d'un geste toutes** les pièces d'un même dépôt.

Le `correlationId`, lui, **est connu du front** : c'est l'`extractionId` que le proxy lui a rendu. Et il
**groupe par construction les pièces d'un même dépôt** (D4) — la route épouse donc le domaine au lieu de le
contourner.

- **Transaction obligatoire** : l'opération écrit **plusieurs documents** qui doivent rester cohérents —
  les deux pièces d'un dépôt appartiennent au même dossier ou à aucun. `updateMany` n'est **pas** atomique
  entre documents : une interruption laisserait les statuts rattachés et la carte CFE orpheline, c'est-à-dire
  un dossier n'affichant que la moitié de ce qui l'a constitué. Abort **gardé** par `session.inTransaction()`.
- **Même règle de sens unique** : `dossierId: { $exists: false }` exclut les pièces déjà rattachées — elles
  ne sont ni déplacées ni comptées.
- **`rattachees` est publié** : une corrélation peut porter deux pièces dont une seule était libre ; un
  total qu'on ne peut pas recomposer depuis la réponse serait un chiffre à croire sur parole.
- **Route littérale déclarée AVANT la paramétrée**, et un e2e vérifie que **les deux** restent atteignables.

### Vérification docker — le parcours de l'assistant, enfin bouclé

```
① POST /profil-societe/ocr (SANS dossier)  → 202, le front ne connaît QUE correlationId=6a8c7701…
② création du dossier                       → 6a8c7702…
③ GET /dossiers/<D>/pieces                  → []                    ← le symptôme de FE-064
④ PATCH /profil-extractions/dossier         → 200 { rattachees: 2 }  ← LE GESTE QUI MANQUAIT
⑤ GET /dossiers/<D>/pieces                  → 2 pièces
```

Refus mesurés : rejeu ⇒ **409** · corrélation inconnue ⇒ **404** · **org B visant la corrélation d'org A
⇒ 404, pièces d'A inchangées** · dossier archivé ⇒ **409 `DOSSIER_ARCHIVE`** (et la pièce reste **clé
absente** : le refus n'écrit rien) · `dossierId` mal formé ⇒ **400**.

**Atomicité du lot prouvée en base** : `distinct('dossierId')` sur la corrélation rend **1 seule** valeur —
les deux pièces ont atterri ensemble. `$type: 'null'` ⇒ **0**.

---

## Table de mutations — les gardes prouvées par leur échec

Un test qu'un code bugué franchit est une fausse assurance. Les deux gardes qui portent cette story ont été
**cassées volontairement**, la suite a viré au **rouge**, puis le code a été **restauré** et re-vérifié.

| # | Mutation | Effet attendu | Résultat |
|---|---|---|---|
| 1 | Retirer `dossierId: { $exists: false }` du filtre de `rattacherDossier` *(le rattachement cesse d'être à sens unique)* | le test du filtre atomique échoue | 🔴 **rouge** — `toHaveBeenCalledWith` exhibe le filtre amputé |
| 2 | Déplacer `DossierGate.exigerPourDepot` **après** l'écriture *(la garde ne garde plus rien en amont)* | les 2 tests « le repository n'est jamais appelé » échouent | 🔴 **rouge** — `Expected 0 calls, received 1`, deux fois |
| 3 | Retirer `dossierId: { $exists: false }` du `updateMany` **par corrélation** *(le rattachement de lot cesse d'être à sens unique)* | le test du filtre échoue | 🔴 **rouge** |
| 4 | Retirer `{ session }` du `updateMany` *(l'écriture multi-documents n'est plus transactionnelle)* | le test d'atomicité échoue | 🔴 **rouge** |

⚡ **La mutation #2 a AUSSI servi à réparer un test menteur** *(constat de revue)* : le test intitulé
« garde AVANT écriture : porte le dossier consultée en premier » ne vérifiait **aucun ordre** — il n'assertait
que `toHaveBeenCalledWith` sur les deux collaborateurs, or dans le cas nominal la garde ne lève pas, donc les
deux mocks reçoivent les mêmes arguments **quel que soit leur ordre**. Il restait **vert** sous la mutation.
Une assertion `invocationCallOrder` a été ajoutée, et la mutation le fait désormais **rougir** — vérifié.

⚠️ La garde de non-régression sur `orgId` (§ *Écart trouvé*) est **née d'un défaut réel constaté en
docker** : elle n'a pas besoin d'une mutation pour prouver qu'elle filtre — elle a été écrite **après**
avoir vu le 400 qu'elle interdit désormais.

---

## Progress Tracking

| Phase | État | Preuve |
|---|---|---|
| Rédaction / recadrage | ✅ 2026-08-24 | *Hors périmètre*, *Notes techniques* et *DoD* ajoutés — la story n'en avait aucun |
| Développement | ✅ 2026-08-24 | 2 dépôts, branches `MNV-384` |
| Portes DoD | ✅ 2026-08-24 | `document-service` **577 unit + 82 e2e** · `balance-service` lint/build verts, e2e `profil-ocr` **13/13** |
| Vérification docker | ✅ 2026-08-24, **rejouée sur l'état final** | 12 points mesurés, puis parcours assistant complet après correctif de revue |
| Revue de code | ✅ 2026-08-24 | **5 constats, tous traités** — dont **1 bloquant** (route inatteignable) |
| Revue de sécurité | ✅ 2026-08-24 | **0 vulnérabilité**, arguments exécutables |
| Merge | ✅ 2026-08-24 | PR [ocr-service#13](https://github.com/MoneyVibesGroup/prospera-ocr-service/pull/13) et [balance-service#48](https://github.com/MoneyVibesGroup/prospera-balance-service/pull/48), **rebase-merge**, branches supprimées |

**Ce qui a été livré, au-delà du cadrage initial :**

1. **Le proxy OCR profil était mort depuis STORY-081** (`orgId` refusé par le DTO destinataire, 400 masqué
   en 502). Sans ce correctif, l'AC-5 était invérifiable. Arbitré par l'user.
2. **La route de rattachement était inatteignable depuis le parcours de l'assistant** — la prémisse de la
   story était fausse. Correctif : rattachement **par `correlationId`**. Arbitré par l'user.

**Ce qui reste ouvert, et qui n'a PAS été traité ici :**

- ⚠️ `document.piece.extrait` est émis **sans** `dossierId` si l'OCR se termine **après** un rattachement a
  posteriori — le processeur lit le `dossierId` du `jobData` **figé au dépôt**. Écart d'intégrité de
  read-model, sans effet d'autorisation *(la portée d'aval reste `orgId`, et la projection de
  `balance-service` dérive le dossier du lot, pas de l'événement)*. **Kafka est hors périmètre déclaré** de
  cette story ⇒ à ouvrir séparément.
- ⚠️ Le commentaire de `dossier.gate.ts` sur `Types.ObjectId.isValid` est **factuellement périmé** : depuis
  bson 5, il n'accepte plus les chaînes de 12 caractères, et c'est `@IsMongoId` qui est le plus permissif
  (il accepte un préfixe `0x`). **Sans conséquence** — `OBJECT_ID_STRICT` attrape le cas avant toute
  construction de clé — mais la justification écrite ne correspond plus à la bibliothèque installée. Fichier
  **hors du diff** de cette story.
- ⚠️ `ProfilOcrController.demarrer` monte `FileFieldsInterceptor` **sans `limits`**, là où `document-service`
  plafonne les siens. Un appelant authentifié peut faire bufferiser un fichier de taille arbitraire par
  `balance-service`. **Préexistant et non aggravé** par cette story.

---

## Note de provenance

Remontée par **FE-064**, dont le §4 de périmètre demandait exactement ce rattachement. Il a été
**constaté non servi plutôt que simulé** : le simuler côté client aurait supposé re-déposer les mêmes
fichiers après création — un second objet MinIO, une seconde extraction OCR, et un second
`document.profil.extrait` portant un `correlationId` qu'aucune proposition ne connaît.
