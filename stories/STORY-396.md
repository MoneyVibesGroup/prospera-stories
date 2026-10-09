# STORY-396 : Une panne d'infrastructure est rendue au cabinet comme « votre pièce est illisible »

**Epic :** EPIC-020 — Pièces justificatives & OCR
**Réf. :** écart trouvé à la **vérification docker de STORY-385**, 2026-08-24
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done
**Complexité :** medium
**Sprint :** 20
**Assigné à :** `vivianMoneyVibesGroupes`
**Service :** `document-service` (`:3006`)

---

## Le constat — un défaut du SERVEUR se présente comme un défaut de la PIÈCE

Le processeur d'extraction traduit **toute** erreur synchrone du pipeline OCR en un `ECHEC` métier :

```ts
// profil-extraction.processor.ts
// Pièce **indécodable/corrompue** : l'OCR a échoué (le worker n'a rien pu
// reconnaître). On la traite comme une pièce inexploitable → ECHEC
await this.finaliser(eventId, data, [], 0, ProfilExtractionStatut.ECHEC);
```

Le commentaire annonce le cas qu'il vise — « ex. PNG au chunk IDAT invalide » — et il a raison pour
celui-là. Mais le `catch` ne distingue **pas** ce que l'erreur dit :

| Erreur attrapée | Ce que c'est vraiment | Ce que le cabinet lit |
|---|---|---|
| chunk PNG invalide | la pièce est corrompue | « illisible » ✅ |
| `Cannot find module '@napi-rs/canvas'` | **le serveur n'a pas son rasteriseur** | « illisible » ❌ |
| `tessdata` absent, OOM du worker, disque plein | **le serveur** | « illisible » ❌ |

**Observé en vrai** le 2026-08-24 : un PDF parfaitement valide, déposé sur une stack docker, est ressorti
`ECHEC` avec `champs: []`. Cause réelle dans les logs : `Cannot find module '@napi-rs/canvas'
Require stack: /app/dist/ocr/pdf-page-renderer.js`. Rien, **nulle part**, ne disait au collaborateur que la
panne était de notre côté :

- `/api/v1/health` répond **`ok`** *(mongodb up, kafka up, minio up)* — la santé du service ne couvre
  aucune dépendance du pipeline OCR ;
- la liste des pièces affiche `statutOcr: ECHEC`, que STORY-385 vient précisément de définir comme
  **« illisible »** ;
- le seul geste que l'écran propose alors est de **re-scanner** — c'est-à-dire de refaire, indéfiniment,
  ce qui ne peut pas marcher.

⚠️ **STORY-385 rend ce défaut plus coûteux, pas moins** : elle a fait de `ECHEC` une valeur d'enum au
contrat, opposée à `PRETE` + liste vide (« lu, rien trouvé ») et à `EN_COURS` (« pas encore lu »). Le
contrat est désormais précis — et il **affirme une contre-vérité** dès que la panne est nôtre.

### Comment l'écart a été trouvé (et ce que ça dit du dev)

La stack avait été démarrée par `docker compose up -d` **sans `--build`** : l'image portait un
`node_modules` **antérieur** au commit `bugfix(ocr)` qui a introduit `@napi-rs/canvas`. Vérifié :

```bash
docker compose run --rm --no-deps --entrypoint sh document-service \
  -c 'node -e "console.log(require(\"/app/package.json\").dependencies[\"@napi-rs/canvas\"])"'
# → undefined
```

La dépendance est **bien** déclarée sur `dev` et le `package-lock.json` porte les binaires linux : un
`--build` répare l'exécution. **Ce n'est donc pas un défaut de code** — et c'est exactement ce qui rend
l'écart intéressant : une image périmée est un incident d'exploitation **banal**, et le système l'a
converti en un mensonge métier durable, écrit en base, sans qu'aucun signal ne rougisse.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **savoir quand une lecture a échoué à cause du système et non de ma pièce**,
afin de **ne pas re-scanner indéfiniment un document qui n'a jamais eu de problème**.

---

## Ce que la story doit livrer

- **Séparer, au moment du `catch`, la panne de PIÈCE de la panne de SERVICE.** Une erreur qui n'est pas
  imputable au contenu déposé (module absent, `tessdata` introuvable, worker tué, écriture impossible) ne
  doit pas produire le même état terminal qu'une pièce corrompue.
- **Un état distinct, terminal ou non**, pour la panne de service — à trancher à la conception : soit une
  5ᵉ valeur de statut *(⚠️ contrat de lecture : elle entre dans l'enum publié par STORY-385, et **casse la
  compilation** des clients — c'est voulu)*, soit un `ECHEC` **requalifiable** assorti d'un motif. La
  différence porte sur une question métier : **la pièce doit-elle être rejouée automatiquement** quand le
  service est réparé ? Si oui, l'état ne peut pas être terminal.
- **`/api/v1/health` couvre les dépendances du pipeline OCR** — au minimum le rasteriseur PDF et les
  `tessdata` : un service qui ne sait plus lire un PDF n'est pas `ok`. C'est le seul signal qui aurait
  transformé 20 minutes d'enquête en une ligne.
- ⚠️ **Aucun changement de contrat d'ÉVÉNEMENT sans arbitrage** : `document.profil.extrait` et
  `document.piece.extrait` publient `statut: 'PRETE' | 'ECHEC'`. Une 5ᵉ valeur les touche, donc **2 dépôts**
  (`document-service` producteur, `balance-service` consommateur) — à cadrer avant, pas à découvrir pendant.

---

## Conception — décisions (cadrage APEX du 2026-10-09)

- **D-396-1 — la panne de service n'est PAS un état terminal, et n'ajoute aucune valeur au contrat.**
  L'extraction reste `EN_COURS` — « pas encore lue », ce qui est **vrai** — et le job BullMQ échoue pour être
  **rejoué automatiquement** (6 tentatives, attente exponentielle depuis 60 s : ~31 min de fenêtre). Une image
  réparée dans la fenêtre lit la pièce sans geste du cabinet. Aucune 5ᵉ valeur ⇒ ni l'enum de lecture de
  STORY-385 ni `document.profil.extrait` / `document.piece.extrait` ne bougent ⇒ **un seul dépôt**
  (`document-service`), `balance-service` intact.
- **D-396-2 — la distinction se fait À LA SOURCE, pas sur le texte de l'erreur.** La couche OCR lève
  `OcrIndisponibleError` (avec un `motif`) **seulement** là où l'échec ne peut pas venir de la pièce :
  chargement du rasteriseur PDF (`@napi-rs/canvas` + `pdfjs-dist`), création du worker Tesseract (core WASM,
  `tessdata`), création du répertoire temporaire (disque plein). Tout le reste — ouverture du PDF par pdf.js,
  reconnaissance d'une image — reste imputable à la pièce ⇒ `ECHEC`, inchangé. Pas de liste de messages
  d'erreur à reconnaître : elle vieillirait en silence.
- **D-396-3 — le motif est consultable en base.** Chaque panne pose `panneService { motif, message,
  survenueLe }` sur l'extraction (profil comme pièce) ; la finalisation le retire (`$unset`, champ déclaré au
  schéma). **Non publié** sur la lecture des pièces (arbitrage : le contrat de lecture ne change pas, et
  « pas encore lue » reste exact pendant la fenêtre de rejeu).
- **D-396-4 — `/api/v1/health` gagne un indicateur `ocr`** : rasteriseur chargeable **et** `tessdata` de la
  langue par défaut présent ; sinon `down` avec le motif nommé (`RASTERISEUR_PDF`, `TESSDATA`).

- **D-396-5 (revue ⑥) — la création du worker Tesseract est bornée (60 s) et traduite en `MOTEUR_OCR`** : un
  rejet de `createWorker` (core WASM absent) et une création figée (`traineddata` tronqué : tesseract.js avale
  l'échec de `loadLanguage`) gardaient sinon le job actif pour toujours ou rendaient la pièce « illisible ».
- **D-396-6 (revue ⑥) — le chemin KYC PROPAGE la panne de service** au lieu de publier `unreadable: true` : le
  `verifierTessdata` à la source avait rendu immédiat ce qui, avant, gelait seulement la partition. Kafka rejoue
  et la supervision (STORY-705) tient le groupe « bloqué ».

**Hors périmètre** — sur le chemin **KYC**, au-delà de D-396-6, rien ne change (contrat `kyc.document.extrait`
intact) ; le **rejeu des jobs épuisés** au-delà de la fenêtre (BullMQ `failed`, rejouable à la main —
l'indicateur `/health` dit qu'il faut réparer d'abord).

## Acceptance Criteria

- [x] Une erreur **non imputable à la pièce** simulée dans le pipeline OCR ne produit **pas** l'état qui
      signifie « illisible » — vérifié par mutation *(retirer la distinction ⇒ le test rougit)*.
- [x] Une pièce réellement corrompue produit **toujours** l'état « illisible » — la distinction n'élargit
      rien.
- [x] `/api/v1/health` passe **`down`** quand le rasteriseur PDF est absent, et le dit nommément.
- [x] Le motif de la panne de service est **consultable** (journalisé et, si l'arbitrage le retient, publié
      sur la lecture des pièces) — jamais seulement dans les logs du conteneur.
- [x] Non-régression : le chemin **PNG/JPEG**, qui ne passe pas par le rasteriseur, est inchangé.
- [x] Si un état s'ajoute au contrat d'événement : la story est **livrée sur 2 dépôts**, PR ouvertes et
      intégrées ensemble.

---

## Dépendances

**Prérequise :** **STORY-385** ✅ *(c'est elle qui a fait de `ECHEC` une valeur de contrat explicite,
donc qui rend la contre-vérité lisible)*.
**Touche potentiellement :** `balance-service` *(consommateur des deux contrats d'extraction)*.

---

## Note de provenance

Trouvée à la **vérification docker de STORY-385**, pas en lisant le code : le PDF de test devait servir à
produire une pièce `PRETE`, il est ressorti `ECHEC`. ⚡ **L'échec a rendu service deux fois** — il a fourni
à STORY-385 le cas `ECHEC` réel dont sa table de vérification avait besoin *(une pièce `ECHEC` porte bien
`champs: []` en base, et c'est ce qui prouve que le statut doit décider, pas le tableau)*, et il a exposé
ce défaut-ci.

---

## Progress Tracking

**Statut : `done` (2026-10-09).** prospera-ocr-service#23 (document-service) rebase-mergée sur `dev`, branche
supprimée. Scripts : `PROSPERA/tmp/396/` (mutations, portes) et `tmp/verif-docker-396/` (`verif.sh`, `outil.js`).

**Portes (état final)** — lint 0, build OK, test:cov 908 tests (99,18/93,97/98,28/99,20), test:e2e 183 (dont
`/health` : `ocr` up, puis 503 nommé sans cause brute).

**Mutations** — 21/21 rouges : panne de service rendue `ECHEC` (processeur pièce, processeur profil — AC-1),
rasteriseur non traduit, tessdata non vérifié avant `createWorker`, disque plein non traduit, rejet de
`createWorker` non traduit, création non bornée, `/health` toujours up, cause brute rendue par `/health`, `/health`
qui journalise à chaque sonde, indicateur absent du contrôleur, disponibilité sans rasteriseur, trace sans filtre
`EN_COURS`, `$unset` retiré (×2), rejeu retiré (×2), trace qui masque la panne, panne non tracée, abandon journalisé
dès la 1re tentative, KYC qui publie `unreadable`.

**Vérif docker (stack neuve, code de la branche, aucune modification du code)** — seule l'image est abîmée :
`@napi-rs/canvas` renommé dans le conteneur puis redémarrage. `/health` ⇒ **503**, `ocr` :
`{ status: down, motif: RASTERISEUR_PDF, message: "OCR indisponible : rasteriseur PDF indisponible (@napi-rs/canvas
/ pdfjs-dist)." }` (aucun chemin du conteneur). PDF de statuts valide enfilé comme le fait le service (options de
rejeu lues dans le `dist` réel) : extraction **`EN_COURS`**, `panneService { motif: RASTERISEUR_PDF, message,
survenueLe }`, 0 marqueur, 0 outbox, job BullMQ **`delayed`** après 1 tentative. Rasteriseur rendu + redémarrage :
`/health` 200, `ocr` up ; **rejeu automatique** ⇒ extraction **`PRETE`** (confiance 0,9, champs `formeJuridique`,
`capitalSocial`), `panneService` **retiré**, 1 marqueur, 1 outbox, job `completed` en 2 tentatives. PNG corrompu
(rasteriseur présent) ⇒ **`ECHEC`**, sans `panneService`, job `completed` en 1 tentative (AC « la distinction
n'élargit rien »). Chemin PNG/JPEG inchangé (AC non-régression). Stack arrêtée.

**Revue de code (⑥)** — scan opus + lentille ECC `silent-failure-hunter`. Retenus et corrigés : (1) **bloquant** —
e2e `/health` non câblé (3 rouges) ; (2) rejet de `createWorker` resté « pièce illisible » ⇒ D-396-5 ; (3) création
figée par un `traineddata` tronqué (job actif pour toujours) ⇒ délai de 60 s ; (4) le chemin KYC publiait désormais
`unreadable` pour une panne de service ⇒ D-396-6 ; (5) `/health` journalisait à chaque sonde ⇒ au changement d'état ;
(6) commentaire de rejeu faux + abandon indiscernable ⇒ commentaire rectifié et journal d'abandon
(`@OnWorkerEvent('failed')`). Mutation « indicateur sous une autre clé » restée verte ⇒ double du contrôleur
corrigé. Écartés (assumés, documentés) : une erreur déterministe hors OCR rejouée 6 fois avant abandon ; jobs
épuisés `EN_COURS` jusqu'au rejeu manuel (hors périmètre) ; deux JSDoc détachés préexistants sur `dev`.

**Revue de sécurité (⑦)** — 0 constat, en deux passes (branche, puis delta de revue) : `/health` ne rend que le
libellé du motif ; aucune pièce ne peut déclencher `OcrIndisponibleError` (`lang` vient de la configuration, la
pièce n'entre qu'au `recognize`) ; rejeu idempotent (marqueur + `jobId` stable) ; `panneService` exposé par aucune
route.

Historique : `in_progress` (2026-10-09) — cadrage APEX : décisions D-396-1 à 4 ; un seul dépôt, aucun contrat
modifié.
