# STORY-358 : Les pièces se rattachent au dossier — statuts et carte CFE cessent de disparaître

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **G** · décision **D5** *(rattachement additif)*
**Priorité :** Should Have
**Story Points :** 3
**Statut :** ✅ Terminé
**Complexité :** low
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `document-service` (+ `balance-service` : copies de contrat d'événement)

---

## Le constat

Les statuts et la carte CFE déposés à la création d'un dossier sont lus par l'OCR (STORY-081), servent
à pré-remplir l'identité… puis **ne sont plus visibles nulle part**. Le parcours les avale.

C'est une perte réelle : un dossier qu'on défend devant un contrôle fiscal doit exposer les pièces qui
l'ont constitué, des années après, sans que personne n'ait à retrouver le fichier d'origine.

Aujourd'hui `document-service` porte trois familles — `documents`, `piece-extractions`,
`profil-extractions` — toutes rattachées à l'**organisation**. Le rattachement au dossier est
**additif** : l'org reste, le dossier s'ajoute.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **retrouver les pièces d'un dossier depuis ce dossier**,
afin de **justifier son identité fiscale sans chercher dans mes fichiers**.

---

## Ce que la story livre

- **`dossierId` optionnel** sur les documents et extractions — *optionnel*, parce que les pièces
  **KYC du cabinet** n'appartiennent à aucun dossier et ne doivent pas être forcées d'en avoir un.
  C'est l'application littérale de la nuance D5 : on ne re-scope que ce qui porte de la donnée de
  dossier.
- **`GET /dossiers/:dossierId/pieces`** — la liste des pièces d'un dossier : type, nom d'origine, date
  de dépôt, auteur, statut d'extraction OCR, et **URL présignée** de consultation.
- **Portée héritée du dossier** : un `TENANT_USER` non affecté → **404**. La règle vient du read-model
  `Dossier` (STORY-353), elle n'est pas réinventée ici.
- **Type de pièce** sur le document : `STATUTS`, `CARTE_CFE`, `LETTRE_MISSION`, `AUTRE`. La lettre de
  mission est **facultative** — D2 a tranché que l'attestation de mandat suffit ; elle est là pour les
  cabinets qui veulent la joindre.
- **Read-model `Dossier`** local, comme partout ailleurs : aucun appel REST sortant.

## Hors périmètre

- Les **pièces KYC du cabinet** : elles restent de niveau organisation, sans `dossierId`. D2 est
  explicite — le KYC ne descend pas au dossier.
- Les **livrables de l'exercice** (liasses figées, déclarations, accusés) : ils appartiennent à
  l'exercice, pas au dossier, et relèvent de `bilan-service` et du module Fiscalité (STORY-335).
- Le **pipeline OCR** lui-même (STORY-081, livré) : il ne change pas ; il propage simplement le
  `dossierId` reçu.
- L'URL présignée sur endpoint **public** : déjà corrigée par **STORY-352**.

---

## Acceptance Criteria

- [x] Les familles qui **ont un dépôt HTTP** acceptent un `dossierId` **facultatif** ; une pièce
      déposée **sans** `dossierId` reste acceptée (**202**) et lisible comme avant.
      ⚠️ **Reformulé — la prémisse était fausse sur deux points**, cf. § *Écarts constatés* ①.
- [x] `GET /dossiers/:dossierId/pieces` rend les pièces du dossier, avec type, nom d'origine, date,
      auteur, statut OCR et **URL présignée** valide depuis un **navigateur** (endpoint public,
      STORY-352) — vérifié dans un vrai navigateur, pas au curl. **PNG affiché en 160×160 dans le
      navigateur**, cf. § *Vérification docker* ⑤.
- [~] Dossier d'une autre organisation → **404**, corps **strictement identique** à celui d'un dossier
      inexistant (prouvé en docker, ④). ⛔ **« non affecté au collaborateur » N'EST PAS livré** :
      l'affectation n'est pas diffusée par le contrat `dossier.*` v1 — cf. § *Écarts constatés* ②.
- [x] Déposer une pièce sur un dossier **archivé** → **409 `DOSSIER_ARCHIVE`** (les deux familles) ; la
      **lecture** des pièces d'un dossier archivé reste **200** (D9), prouvé en docker (⑥).
- [x] Un `dossierId` inexistant ou appartenant à une autre org au dépôt → **404**, aucune écriture,
      **aucun objet créé dans MinIO** — prouvé par comptage réel du bucket (③).
- [x] L'événement porte le `dossierId` quand il existe — mais c'est **`document.profil.extrait`**, pas
      `document.extrait` : ce dernier est le contrat **KYC**, hors périmètre. Cf. § *Écarts constatés* ③.
      Prouvé en outbox : 2 événements avec `dossierId`, 1 sans (⑦).
- [x] Non-régression : le chemin KYC n'est **pas touché** (aucun fichier de la famille `extraction`
      modifié) ; dépôt profil **sans** `dossierId` toujours 202 en docker (②). 501 unitaires + 60 e2e
      verts.

---

## Notes techniques

- `dossierId` **optionnel** signifie qu'il ne peut pas être un `required` de schéma : la garde est
  applicative, et un index **partiel** `{ orgId: 1, dossierId: 1 }` sur les documents qui en portent un
  sert la lecture par dossier sans pénaliser les pièces KYC.
- Le contrôle « ce `dossierId` existe et appartient à mon org » se fait **sur le read-model local**,
  avant tout `putObject` : créer l'objet puis découvrir que le dossier n'existe pas laisserait un
  orphelin dans MinIO, exactement le cas que STORY-011 avait pris soin d'éviter (ordre `putObject` →
  persistance, et rien avant validation).
- La clé de stockage devient `dossiers/{orgId}/{dossierId}/{uuid}` pour les pièces de dossier, et reste
  `kyc/{orgId}/{uuid}` pour le KYC — **jamais** le nom du fichier client, règle inchangée depuis
  STORY-011.

---

## Dépendances

**Prérequises :** **STORY-301** *(dossier)* · **STORY-353** *(portée)* · **STORY-352** ✅ *(endpoint
public — sans elle, l'URL présignée serait inutilisable au navigateur)*.
**Liée :** **STORY-081** ✅ *(OCR statuts + CFE — c'est son dépôt qu'on rattache)*.

---

## Definition of Done

- [x] Lint 0 warning · build OK · couverture **99,47 / 93,25 / 99,27 / 99,43** (seuils 65/90/90/90).
- [x] 511 unitaires + 60 e2e verts ; **14 mutations volontaires, 14 rouges** (§ *Table de mutations*).
- [x] Vérification **docker réelle** sur stack neuve (`down -v`) — § *Vérification docker*.
- [x] Vérification **navigateur réel** de l'URL présignée (pas seulement curl).
- [x] Revue de code + revue de sécurité.

---

## Écarts constatés — trois prémisses de la story étaient fausses

### ① « Les **trois** familles acceptent un `dossierId` au dépôt » (AC-1)

`document-service` porte bien trois familles, mais **une seule des trois n'a pas de dépôt HTTP** :
`document_extractions` (le KYC) est alimentée par le **consommateur Kafka** `kyc.document.uploaded`,
jamais par une requête. Il n'existe aucun endpoint où y passer un `dossierId`.

Et le § *Hors périmètre* de la story tranche déjà la question dans l'autre sens : « les pièces KYC du
cabinet restent de niveau organisation, sans `dossierId` ». **L'AC-1 se contredisait donc avec le
périmètre**, sur la seule famille où il aurait fallu ajouter un chemin d'écriture.

**Retenu** : les **deux familles qui ont un dépôt** (`profil_extractions`, `piece_extractions`) portent
le champ ; le KYC est **inchangé** — aucun fichier de `modules/extraction/` n'est modifié.
Le **201** de l'AC est par ailleurs un **202** : les deux dépôts sont asynchrones depuis STORY-081/084.

### ② « Portée héritée du dossier : un `TENANT_USER` non affecté → 404 » (AC-3)

**Non livrable ici, et pour la même raison qu'en STORY-236 et STORY-357.** La story dit « la règle vient
du read-model `Dossier` (STORY-353), elle n'est pas réinventée ici » — sauf que le contrat
`dossier.*` **v1 ne diffuse pas l'affectation**. `responsableUserId` et `contributeursUserIds` vivent
dans le document `Dossier` de `dossier-service` (STORY-353) mais **ne sortent pas** : `DossierEtatV1` ne
porte que `dossierId`, `orgId`, `raisonSociale`, `pays`, `typeEntite`, `statut`, `estLeCabinet`,
`version`. Un read-model local ne peut donc **pas** connaître le portefeuille d'un collaborateur.

`bilan-service` (STORY-357, § D6/D11) et `balance-service` (STORY-236) ont buté exactement là et ont
tranché de la même façon : **frontière stricte par organisation**, limite dite honnêtement.

**Retenu** : la portée garantie est celle de l'**organisation** — dossier d'un autre cabinet ⇒ 404
indiscernable d'un dossier inexistant. Un `TENANT_USER` de l'org non affecté au dossier **passe**. La
lever suppose d'étendre `DossierEtatV1` (donc `dossier-service` + les **trois** relying parties qui en
tiennent une copie) : c'est une story à part entière, pas une note de bas de page de celle-ci.

### ③ « L'événement **`document.extrait`** porte le `dossierId` » (AC-6)

`document.extrait` est le contrat **KYC** (STORY-043) : son `type` est un `KycDocumentType {RCCM, CFE}`
et son corps porte `declared`/`discrepancies`/`flags`. Or le KYC est **hors périmètre** et ne porte
jamais de `dossierId` — l'AC visait un événement qui, par construction, n'aurait rien eu à transporter.

L'événement qui pré-remplit l'identité d'un dossier est **`document.profil.extrait`** (STORY-081, celui
des statuts et de la carte CFE) — et accessoirement `document.piece.extrait` pour les pièces comptables.

**Retenu** : `dossierId` **optionnel et additif** sur ces deux contrats, `schemaVersion` **inchangé**
(compat BACKWARD P9 : un consommateur qui l'ignore lit ce qu'il lisait avant). La clé n'est posée que
si le dossier existe — « absente » et « présente à `undefined` » restent indiscernables côté
consommateur.

⚠️ **Conséquence : la story touche 2 dépôts.** Un contrat d'événement vit chez le producteur **et** chez
le consommateur (K4) ; `balance-service` porte les copies de `document.profil.extrait` et
`document.piece.extrait`. Sa PR jumelle `MNV-358` ne change **que des types** (aucun consommateur ne lit
encore le champ), mais laisser les copies diverger est précisément ce qui fait dériver un read-model
sans qu'aucune erreur ne le signale nulle part.

---

## Décisions de conception

### D-358-1 — `TypePieceDossier` est un **sur-ensemble** de `ProfilDocumentType`, pas son remplaçant

La story demande quatre types de pièce (`STATUTS`, `CARTE_CFE`, `LETTRE_MISSION`, `AUTRE`). Élargir
`ProfilDocumentType` aurait paru le chemin court — et cassait deux choses d'un coup :

1. c'est la clé de **dispatch OCR** (`ProfilParserRegistry`) : `LETTRE_MISSION` n'a aucun parseur, elle
   aurait produit une extraction **vide**, donc une proposition de profil fantôme côté
   `balance-service` ;
2. c'est le `type` du **contrat** `document.profil.extrait` (`'STATUTS' | 'CARTE_CFE'`) : l'élargir est
   un changement de contrat **sur deux dépôts**, pour livrer au consommateur des types qu'il ne sait pas
   traiter.

**Retenu** : un enum **distinct**, `TypePieceDossier`, aux **mêmes chaînes** pour les deux valeurs
communes ⇒ **aucune migration**, les documents écrits par STORY-081 restent valides tels quels. Le
prédicat `estTypeOcr()` **dérive** la liste des types lus de `ProfilDocumentType` (`Object.values`) au
lieu de la recopier : ajouter un parseur suffit, et deux listes ne peuvent pas diverger en silence.

Une pièce sans parseur est stockée, listée et consultable avec le statut **terminal** `SANS_OCR` — la
laisser `EN_COURS` ferait attendre indéfiniment un traitement qui ne viendra jamais.

### D-358-2 — La garde de dossier passe **avant** le `putObject`, jamais après

`DossierGate` est appelée avant toute écriture MinIO. L'ordre inverse laisserait, sur un 404 ou un 409,
un **binaire orphelin** dans le bucket : plus aucun document ne le référence, donc rien ne peut plus ni
le retrouver ni le purger. C'est la leçon de STORY-011, et c'est ce que le comptage réel du bucket
prouve (③ ci-dessous). **Deux mutations** vérifient que l'ordre est bien ce qui tient le critère
(M4, M5).

### D-358-3 — Clé de stockage : `dossiers/<orgId>/<dossierId>/<uuid>`

La note technique annonçait aussi `kyc/{orgId}/{uuid}` pour le KYC : **non applicable** — ce bucket
appartient à `kyc-service`, `document-service` y est en **lecture seule** et n'a jamais choisi ses clés.
Un dépôt **sans** dossier garde la convention de STORY-081 (`<orgId>/<uuid>`) : les objets déjà écrits
restent à leur place, aucune migration. Le nom du fichier client n'entre **jamais** dans la clé
(STORY-011) ; `dossierId` est bridé par `@IsMongoId` **puis** par `DossierGate` — le constat de la revue
de sécurité MNV-084 sur `correlationId` s'applique mot pour mot à ce nouveau segment.

### D-358-4 — Le TTL de présignature est **borné**, et c'est le garde-fou transmis par STORY-352

`MINIO_PRESIGNED_TTL_SECONDS` (défaut 300 s, **plancher 60 s, plafond 1 h validés au boot**). Une URL
présignée est un **porteur** : elle ouvre la pièce sans jeton et hors de la chaîne de guards. Trop
courte, la pièce se referme pendant la lecture ; trop longue, un lien recopié d'un journal ou d'un
historique reste exploitable des jours durant. Les deux **clients publics** posés par STORY-352 cessent
ici d'être des hooks : `PieceUrlSigner` est leur premier consommateur.

### D-358-5 — `correlationId` reste **requis**, y compris pour une pièce de dossier

Le rendre conditionnel (`@ValidateIf`) aurait relâché un champ validé pour un gain nul : l'écran Dossier
peut passer le `dossierId` lui-même comme clé de regroupement — « les pièces de ce dossier » *est* une
corrélation. Alternative plus lâche écartée volontairement.

---

## Vérification docker — stack NEUVE (`down -v`), 2026-08-19

Services : `mongo` (rs0) · `kafka` · `redis` · `minio` · `auth-service` · `dossier-service` ·
`document-service`. Deux organisations, trois dossiers.

**① Le read-model converge par Kafka, sans aucun appel REST** — `dossier-service` crée « Mon cabinet »
+ 2 dossiers clients ; `document_service.dossiers_dossier` en compte **3**, avec `orgId`, `statut`,
`estLeCabinet` et `version` projetés :

```
{ dossierId: 6a8549942522a1d518f7d9a1, estLeCabinet: true,  statut: 'ACTIF', raisonSociale: 'Cabinet 358' }
{ dossierId: 6a8549e12522a1d518f7d9d7, estLeCabinet: false, statut: 'ACTIF', raisonSociale: 'Client A SARL' }
{ dossierId: 6a8549e12522a1d518f7d9e0, estLeCabinet: false, statut: 'ACTIF', raisonSociale: 'Client B SARL' }
```

**② Les dépôts écrivent ce qu'il faut, et seulement quand il le faut** — `profil_extractions` :

| type | dossierId | storageKey | statut | nomOrigine / deposePar |
|---|---|---|---|---|
| `STATUTS` | A | `dossiers/<org>/<A>/6010a1d2-…` | `ECHEC` (OCR sur PDF factice) | `statuts-acme.pdf` / userId |
| `LETTRE_MISSION` | A | `dossiers/<org>/<A>/17135fcf-…` | **`SANS_OCR`** | `lettre-de-mission.pdf` / userId |
| `STATUTS` | *(aucun)* | `<org>/2e0ea3b6-…` | `ECHEC` | `statuts-acme.pdf` / userId |

La 3ᵉ ligne **ne porte pas la clé `dossierId`** (et non `dossierId: null`) — c'est ce qui garde l'index
partiel exact. Index réellement créé en base :
`{orgId:1, dossierId:1, createdAt:-1}` avec `partialFilterExpression {"dossierId":{"$exists":true}}`.

**③ Aucun orphelin dans MinIO — comptage réel du bucket.** Après un dépôt refusé en **404**
(`dossierId` bien formé mais inexistant) et un refusé en **400** (`dossierId` = `../autre-org`), le
bucket `profil-documents` contient **exactement 3 objets** — un par dépôt **accepté**, zéro pour les
deux refus :

```
6a8549947665631a40cfd0a1/2e0ea3b6-…                                    193B
dossiers/6a8549947665631a40cfd0a1/6a8549e12522a1d518f7d9d7/17135fcf-…  193B
dossiers/6a8549947665631a40cfd0a1/6a8549e12522a1d518f7d9d7/6010a1d2-…  193B
```

**④ Anti-énumération : les corps sont strictement identiques.** Le cabinet rival lit et dépose sur le
dossier A ; un troisième appel vise un dossier inexistant. Les **trois** rendent le même corps (au
`requestId` près) :
`{"statusCode":404,"error":"Not Found","message":"Dossier introuvable pour cette organisation.","code":"DOSSIER_INTROUVABLE"}`.

**⑤ L'URL présignée s'ouvre DANS UN NAVIGATEUR** — et pas seulement au `curl`, c'est le critère que
FE-023 puis STORY-179 puis STORY-352 ont payé trois fois :

- `GET /dossiers/<A>/pieces` rend l'URL signée pour **`localhost:9000`** (endpoint **public**), avec
  `X-Amz-Expires=300` — le TTL configuré, lisible dans l'URL même ;
- `curl` depuis l'**hôte** : `HTTP 200`, `content-type: application/pdf`, fichier **identique octet pour
  octet** à celui déposé ;
- la **même clé** signée pour l'hôte **interne** (`minio:9000`) : `curl exit 6` — hôte irrésoluble,
  exactement le défaut que le client public évite ;
- **navigateur réel** : un PNG 160×160 déposé en `CARTE_CFE` s'affiche à l'écran depuis son URL
  présignée. C'est la preuve que la signature couvre le bon hôte et que rien ne bloque côté navigateur.

**⑥ Archivage (D9) : écriture refusée, lecture préservée.** Dossier A archivé côté `dossier-service` →
`dossiers_dossier` passe à `statut: ARCHIVE, version: 2` (projection de `dossier.updated`). Alors :

| appel | attendu | obtenu |
|---|---|---|
| `POST /profil-extractions` sur A | 409 | **409 `DOSSIER_ARCHIVE`** |
| `POST /piece-extractions` sur A | 409 | **409 `DOSSIER_ARCHIVE`** |
| `GET /dossiers/A/pieces` | 200 | **200**, 3 pièces toujours listées |

Et le bucket ne gagne **aucun objet** au passage (4 objets avant, 4 après ; `piece-documents` reste à 0).

**⑦ `dossierId` voyage réellement dans l'événement.** `outbox_events`, topic
`document.profil.extrait`, tous `status: SENT` (donc publiés sur Kafka) :

```
{ correlationId: 'corr-358-a',    dossierId: '6a8549e1…d9d7', type: 'STATUTS',   statut: 'ECHEC' }
{ correlationId: 'corr-358-sans',                             type: 'STATUTS',   statut: 'ECHEC' }
{ correlationId: 'corr-358-a',    dossierId: '6a8549e1…d9d7', type: 'CARTE_CFE', statut: 'ECHEC' }
```

**2** événements avec `dossierId`, **1** sans (clé **absente**, pas `null`), **3** au total — et la
`LETTRE_MISSION` n'en a émis **aucun** : `SANS_OCR` n'entre jamais dans le pipeline, exactement comme
prévu.

---

## Table de mutations — 14 mutations volontaires, 14 rouges

Un test qu'un code bugué franchit est une fausse assurance. Chaque garde de cette story a été **cassée
volontairement**, le test ciblé rejoué, puis le code restauré. Le script vérifie que le motif de
remplacement **existe** avant de patcher — une mutation silencieusement non appliquée se lit « verte »
et fait conclure l'inverse (leçon STORY-373).

| # | Mutation | Résultat |
|---|---|---|
| M1 | `findOne({dossierId, orgId})` → `findOne({dossierId})` (filtre partiel) | 🔴 |
| M2 | 404 → 403 sur dossier hors organisation | 🔴 |
| M3 | refus d'archivage neutralisé au dépôt | 🔴 |
| M4 | garde de dossier **après** le `putObject` (profil) | 🔴 |
| M5 | garde de dossier **après** le `putObject` (pièces) | 🔴 |
| M6 | `estTypeOcr()` renvoie toujours `true` | 🔴 |
| M7 | contrôle `ObjectId` retiré du payload `dossier.*` | 🔴 |
| M8 | `dossierId` écrit inconditionnellement (index partiel cassé) | 🔴 |
| M9 | pièce profil signée par le client des **pièces comptables** | 🔴 |
| M10 | comparateur de tri non total (départage par `_id` retiré) | 🔴 |
| M11 | TTL de présignature en dur au lieu de la configuration | 🔴 |
| M12 | garde de lecture retirée de `GET /dossiers/:id/pieces` | 🔴 |
| M13 | garde de dossier **remise après** la déduplication de rejeu *(correctif de revue)* | 🔴 |
| M14 | garde relâchée à « 12 ou 24 hexa » = `ObjectId.isValid` *(correctif de sécurité)* | 🔴 |

---

## Revue de code — 3 constats, 0 bloquant

**① La déduplication court-circuitait la garde de dossier** *(pièces comptables, corrigé)*.
`trouverParPiece` rendait la main **avant** `exigerPourDepot` : un couple `(lot, pièce)` déjà déposé,
redéposé en annonçant un dossier **archivé** — ou inexistant, ou d'un autre cabinet — recevait **202 +
l'id existant** au lieu du 409/404 exigé par AC-4 et AC-5. La réponse dépendait de l'**historique du
couple** et non de l'état du dossier ; côté appelant, un rattachement refusé se lisait comme un succès,
et le `dossierId` n'était jamais écrit. Le chemin profil n'avait pas ce défaut : **les deux familles
divergeaient là où les critères les traitent ensemble**.
La garde passe désormais avant : elle valide la **requête**, la déduplication décide de l'**effet**.
3 tests ajoutés, dont un qui vérifie que l'idempotence du rejeu **nominal** n'est pas cassée au passage.

**② Test tautologique retiré** *(corrigé)*. `expect(DOSSIER_TOPICS_CONSOMMES).not.toBe(
Object.values(DossierTopic))` passait **quelle que soit l'implémentation** — `Object.values` rend un
nouveau tableau à chaque appel — y compris celle qu'elle prétendait interdire. Fausse assurance sur
l'invariant précis que le projet a déjà payé (topics dérivés d'un enum). Remplacé par ce qui garde
réellement : l'épinglage des chaînes **en dur**, plus un test d'alignement avec l'enum qui vire au rouge
le jour où un topic est ajouté d'un seul côté.

**③ `GET /dossiers/:dossierId/pieces` n'est pas borné** — *dette assumée, non corrigée*. Les deux
collections sont lues intégralement, fusionnées, triées en mémoire, et **une URL présignée est calculée
par ligne**. Un dossier d'un exercice complet à ~5 000 pièces produirait une réponse de plusieurs Mo et
5 000 signatures S3 par appel. Le défaut ne se voit ni en unitaire (fixtures à 1–2 lignes) ni en vérif
docker (3 pièces). **Non corrigé volontairement** : la story ne cadre pas la pagination, et un
`.limit()` sans pagination **tronquerait en silence** — pire que le problème. À rapprocher de STORY-187
(file de revue KYC), où l'absence de pagination avait déjà été le sujet. 🪝 **Transmis à la story qui
fera transmettre le `dossierId` par `balance-service`** : c'est elle qui rendra le volume réel.

Simplification ponytail appliquée : deux mappeurs jumeaux de 24 lignes ne différaient que par un
littéral ⇒ une fonction `enLigne(doc, famille)`, 12 lignes.

---

## Revue de sécurité — 0 vulnérabilité, 1 asymétrie fermée

**Aucun constat à confiance ≥ 80.** Examinés et écartés avec leur raison : traversée de chemin par le
segment de clé MinIO (double barrière `@IsMongoId` puis `DossierGate`, et la clé n'est construite
qu'après) · URL présignée (GET sur un objet unique, jamais un préfixe ni un PUT, TTL borné **des deux
côtés** et réellement appliqué au boot, jamais journalisée) · empoisonnement du read-model par un
événement forgé (validation stricte enveloppe + corps, message invalide **ignoré** plutôt que
bloquant) · IDOR / isolation tenant (`orgId` **toujours** du JWT, jamais du corps ni de l'URL ; les
deux lectures **refiltrent** sur `orgId` en base) · anti-énumération (même 404, même corps) ·
`nomOrigine` (jamais une clé, borné, restitué en JSON seulement) · MIME (magic bytes, jamais le
`Content-Type` client, y compris pour les nouveaux types) · throttler/RBAC (aucun `@Public()` ajouté,
401 sur jeton HS256 forgé couvert en e2e) · injection NoSQL · secrets.

**⚡ Une asymétrie fermée quand même** — pas une faille, un piège armé.
`Types.ObjectId.isValid()` est plus **large** qu'il n'en a l'air : il accepte aussi toute chaîne de
**12 caractères**. `DossierGate` était donc plus **permissive** que le `@IsMongoId` (24 hexadécimaux
stricts) des DTO qu'elle prolonge — le propriétaire de la règle plus laxiste que son consommateur.
Rien d'exploitable : le `findOne` ne rend rien sur une telle valeur, et la clé n'est construite
qu'après. Mais deux choses en faisaient une dette dangereuse : le chemin de **lecture** n'a **aucun
DTO** (le `dossierId` vient d'un `@Param`, cette expression est la **seule** barrière de format qui
existe), et il suffisait qu'un jour quelqu'un retire un `@IsMongoId` « puisque la garde valide déjà le
format ». Remplacé par `/^[0-9a-fA-F]{24}$/` sur les deux identifiants.

**⚡⚡ Et la première version du test ne gardait RIEN — c'est la mutation qui l'a dit.** Relâcher la
garde à « 12 **ou** 24 hexadécimaux » (le comportement exact de `ObjectId.isValid`) laissait le mutant
**vert**. Les cas à 12 caractères que j'avais écrits (`'../autre-org'`, `'zzzzzzzzzzzz'`) ne sont **pas
hexadécimaux** : ils échouent des **deux côtés** de la frontière, donc ils ne la mesurent pas. Seul
`'507f1f77bcf8'` — 12 caractères **hexadécimaux** — sépare les deux implémentations. Cas ajouté,
mutation **M14** rejouée ⇒ **rouge**. Un test qui ne franchit pas la frontière qu'il prétend garder est
une fausse assurance, même écrit après un constat de sécurité.

---

## Vérification docker REJOUÉE sur l'état final (après les deux commits de correctif)

Les correctifs touchent des gardes déjà vérifiées : la vérification est rejouée, jamais reportée depuis
la mesure d'avant. Code exécuté par le conteneur **confirmé** comme celui de la branche
(`exigerPourDepot` en ligne 105, **avant** `trouverParPiece` en 108 ; `OBJECT_ID_STRICT` présent) — et
prouvé **par le comportement**, pas seulement par la lecture du fichier : le 400 sur 12 hexadécimaux
est une réponse qui **n'existait pas** avant ce commit.

| scénario | attendu | obtenu |
|---|---|---|
| `dossierId` de 12 hexa — **lecture** `GET /dossiers/507f1f77bcf8/pieces` | 400 | **400 `DOSSIER_ID_INVALIDE`** |
| `dossierId` de 12 hexa — **dépôt** | 400 | **400** |
| 1er dépôt du couple `(lot-rejeu, p9)`, dossier **actif** | 202 | **202** |
| **rejeu** du même couple en annonçant le dossier **archivé** | 409 | **409 `DOSSIER_ARCHIVE`** |
| **rejeu** du même couple sur un dossier **inexistant** | 404 | **404 `DOSSIER_INTROUVABLE`** |
| **rejeu nominal** (dossier toujours actif) | 202, **même id** | **202**, `6a85579c…7df8` — **le même** |

En base : **1 seul** document pour `(lot-rejeu, p9)` malgré **4** dépôts ⇒ l'idempotence du rejeu
n'a pas été cassée par le correctif. Dans MinIO : `piece-documents` = **1 objet**, `profil-documents`
= **4** (inchangé) ⇒ ni le 409, ni le 404, ni le 400 n'ont laissé le moindre orphelin.

---

## Hooks inertes posés pour les stories suivantes

- **`piece_extractions.dossierId`** : le champ, l'index partiel et la garde sont livrés et prouvés, mais
  `balance-service` ne transmet **pas encore** de `dossierId` au proxy `POST /pieces/ocr`. Le jour où il
  le fera, rien n'est à ajouter côté `document-service`.
- **`dossierId` dans `document.profil.extrait` / `document.piece.extrait`** : émis, mais **aucun
  consommateur ne le lit encore**. `dossier-service` n'est abonné à aucun des deux ; la story qui lui
  fera pré-remplir l'identité depuis l'OCR trouvera le champ déjà là.
- **`estLeCabinet` et `raisonSociale`** sont projetés dans `dossiers_dossier` et rendus par
  `DossierGate`, sans lecteur à ce stade : ils coûtent un champ et évitent une seconde projection.

---

## Story Points Breakdown

- Champ + index partiel + convention de clé : 0,5 pt
- `GET /dossiers/:dossierId/pieces` + présignature + portée : 1 pt
- Gardes (dossier inexistant avant `putObject`, archivage) + propagation dans `document.extrait` : 1 pt
- Tests + vérification navigateur : 0,5 pt
- **Total : 3 points**
