# STORY-996 : l'OCR réel, le contrôle humain avant archivage et les lots de numérisation (module `ged`)

Status: done

**Complexité :** grande (une file de lecture BullMQ sur le moteur OCR du service, le contrôle humain de chaque pièce,
les lots de numérisation, deux faits, une mesure de débit)

**Épic :** EPIC-214 (les pièces, l'OCR et les archives)
**Dépôts :** `prospera-plateforme` (dossiers de C), `document-service` (dépôt `prospera-ocr-service`)
**Plage :** groupe C, n° 7 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4). Dépend de STORY-995.

---

## Pourquoi

Une pièce reçue n'a de valeur que si on peut la lire : un constat, une carte grise ou une facture arrivent le plus
souvent en **photo ou en scan sans texte**. La compagnie veut que l'OCR tourne **chez elle** (aucune image ni texte ne
sort, surtout pas une pièce médicale), que le texte lu soit rangé **à côté** de la pièce sans jamais la remplacer, et
qu'**aucune pièce ne soit archivée sans qu'une personne l'ait contrôlée**. La numérisation se fait par lots : l'opérateur
suit « N lus sur M », reprend ce qui est à refaire, et ne ferme pas un lot tant qu'une pièce n'est pas contrôlée.

**Source** : PRD FR-162, FR-163, FR-165 (et FR-153 pour la santé) ; annexe D (`ged.ocr_*`, H-127) ; spine AD-8, AD-9,
AD-16, AD-23 ; épics EPIC-214 (« un scan sans texte est lu ; lot de 50 pages en moins de 10 minutes, mesuré ») ;
manifeste `manifestes/ged.manifest.ts` (`ged.piece.controlee@1`, `ged.lot.changed@1`, droits `ged:piece:controler`,
`ged:lot:numeriser`).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Lecture réelle** (FR-163) : chaque version reçue est lue par une file BullMQ interne (`ged-lecture`) sur le moteur du service (`OcrProvider` Tesseract + rendu PDF) ; un PDF dont la couche texte compte **moins de 60 caractères par page** est traité comme une image ; **un scan sans texte est lu** (test sur le vrai moteur) | tests (vrai Tesseract) ; pile |
| AC-2 | **Statut de lecture** `NON_TRAITE`, `EN_COURS`, `OK`, `PARTIEL`, `ECHEC` par version, avec le mode (`COUCHE_TEXTE`, `OCR`, `SAISIE_MAIN`), les pages, la confiance, la **durée par page** ; une page non lue après **2 minutes** passe en échec ; `PARTIEL`/`ECHEC` portent leur consigne (relancer, numériser à nouveau à 300 dpi, saisir à la main) | tests |
| AC-3 | **Le texte est rangé à côté, jamais à la place** : le fichier de la version ne change pas ; le texte d'une pièce de santé est **chiffré** (AES-256-GCM, `GED_CLE_SANTE`) et réservé aux rôles qui lisent la santé (`ACC`/`NUM` : statut seulement) ; une lecture du texte de santé est journalisée | tests |
| AC-4 | **Relancer et saisir à la main** : `POST …/versions/{n}/lecture/relance` (sur `PARTIEL`, `ECHEC`, `NON_TRAITE`) ; `POST …/versions/{n}/lecture/saisie` (sur `PARTIEL`, `ECHEC`) : texte marqué « saisi à la main », la pièce d'origine gardée | tests ; pile |
| AC-5 | **Contrôle humain** (FR-165) : une pièce reçue (ou une nouvelle version) est « **en contrôle** » ; `POST …/pieces/{id}/controle` valide, corrige le type, ou rejette (motif obligatoire) ; contrôleur tracé ; `NUM`, l'agent qui a reçu la pièce, `GEST`/`GREC`/`RESP` ; l'IA ne contrôle jamais | tests ; pile |
| AC-6 | **À refaire** (FR-162, FR-163, FR-165) : `GET /api/v1/ged/a-refaire` liste les lectures `PARTIEL`/`ECHEC` et les pièces rejetées, avec la consigne ; une pièce de santé n'y dit que `DOCUMENT_MEDICAL` à `ACC`/`NUM` | tests ; pile |
| AC-7 | **Lots** (FR-162) : `POST /api/v1/ged/lots` (référence `LOT-AAAA-NNNNN`, origine, flux `COURANT`/`REPRISE`, documents et pages annoncés, opérateur) ; états `EN_ATTENTE` → `SCAN_EN_COURS` → `INDEXATION` → `CONTROLE_QUALITE` → `ARCHIVE`, `ANOMALIE` (motif) ; chaque passage écrit une ligne d'historique avec l'opérateur ; une pièce reçue dans un lot porte son `lotId` ; `GET /api/v1/ged/lots/{id}` donne « **N lus sur M** », les durées par page, l'état de contrôle de chaque pièce | tests ; pile |
| AC-8 | **Un lot ne se ferme pas** (`ARCHIVE`) tant qu'une de ses pièces n'est pas contrôlée (validée ou rejetée) ou qu'une lecture est en cours (409, la liste) | tests ; pile |
| AC-9 | **Faits** `ged.piece.controlee` et `ged.lot.changed` par l'outbox, dans la transaction ; clés, issue, types seulement (ni motif, ni texte, ni nom de fichier) ; champs classés au registre ; Karapace | tests ; Karapace |
| AC-10 | **Mesure** : un lot de **50 pages scannées** (sans couche texte) est lu en **moins de 10 minutes** sur la pile (temps mesuré du premier dépôt au « 50 lus sur 50 ») | pile |

## Décisions retenues par défaut (contestables)

- **D-996-1 — La lecture se fait par version**, dans une collection `ged_lectures` (une par pièce et version). Absente
  ⇒ `NON_TRAITE`. La file `ged-lecture` (BullMQ, Redis du service ; jamais Kafka) est alimentée APRÈS la transaction de
  réception ou de version (un échec d'enfilage laisse `NON_TRAITE`, relançable, jamais une pièce perdue). Identifiant de
  tâche déterministe (`pièce:version:tentative`) : un double enfilage ne lit pas deux fois.
- **D-996-2 — Le moteur est celui du service** (`src/ocr` : `OcrProvider` Tesseract, `PdfPageRenderer`), hors des
  modules : l'invariant AD-3 de `ged` admet `ocr` à côté de `common`, `kafka`, `socle`. La lecture va **page par page**
  (rendu d'une page, OCR de cette page) pour mesurer chaque page et l'arrêter à 2 minutes.
- **D-996-3 — Statut d'une lecture** : une page est **lue** si son texte n'est pas vide et sa confiance ≥ 0,60
  (paramètre). Toutes lues ⇒ `OK` ; certaines ⇒ `PARTIEL` (consigne : numériser à nouveau à 300 dpi) ; aucune ⇒
  `ECHEC` (consigne : relancer si une page a dépassé le délai, sinon numériser à nouveau ; fichier indécodable ⇒
  saisir à la main). Couche texte suffisante ⇒ `OK`, mode `COUCHE_TEXTE`, confiance 1. Moteur indisponible
  (`OcrIndisponibleError`) ⇒ la lecture reste `EN_COURS` et la tâche est rejouée (la pièce n'y est pour rien).
- **D-996-4 — Les paramètres de lecture** entrent dans la table `ged.parametres` en version **`2026.2`** (la `2026.1`
  ne change pas) : `lecture.seuilCaracteresParPage` 60, `lecture.delaiParPageSecondes` 120,
  `lecture.confianceMinimalePage` 0,60.
- **D-996-5 — Le contrôle porte sur la pièce et sa version courante** : `EN_CONTROLE` à la réception et à chaque
  nouvelle version ; `CONTROLEE` (validée, type corrigé ou non) ; `REJETEE` (motif ≥ 10 caractères). Une correction de
  type qui **franchit la frontière de la santé** (ordinaire ↔ médical) est refusée (`CORRECTION_SANTE_IMPOSSIBLE`) : le
  chiffrement dépend du type ; la consigne est de rejeter et de recevoir à nouveau. Le contrôle n'attend pas la lecture
  (la qualité de l'image se juge à l'œil) ; la fermeture du lot, elle, l'attend.
- **D-996-6 — Qui contrôle** : `NUM` toute pièce ; `ACC` les pièces qu'il a reçues ; `GEST`, `GREC`, `RESP` toute
  pièce. Le contrôle d'une pièce de santé par `ACC`/`NUM` ne leur montre rien de son contenu (FR-165). Les droits fins
  `ged:piece:controler`, `ged:lot:numeriser` restent à poser chez `auth-service`.
- **D-996-7 — Le rejet d'une pièce d'assuré** : le fait `ged.piece.controlee` (issue `REJETEE`, responsable de
  fourniture) suffit à `sinistres` pour sa demande de pièce (§5.2) ; `sinistres` ne le consomme pas encore (STORY-1003
  ou après). Aucun fait de lecture : le texte ne sort pas, et le statut reste dans `ged`.
- **D-996-8 — Les lots** : référence attribuée par un compteur par organisation et par année (`ged_compteurs`) ;
  transitions `EN_ATTENTE → SCAN_EN_COURS → INDEXATION → CONTROLE_QUALITE → ARCHIVE` ; `ANOMALIE` depuis tout état non
  terminal (motif) et retour à l'état d'où le lot était parti ; seuls `NUM` et `RESP` font passer un lot ; une pièce
  entre dans un lot en `SCAN_EN_COURS` ou `INDEXATION`. « N lus » = lectures `OK` de la version courante. Les pièces
  « de moins de 48 heures avec ce qu'elles bloquent » et le taux de numérisation du fonds viennent avec le pilotage
  (EPIC-216) : ils lisent `sinistres`.
- **D-996-9 — Les routes** (proposition, le manifeste ne les nomme pas) : `POST/GET /api/v1/ged/lots…`,
  `POST /api/v1/ged/lots/{id}/etat`, `GET /api/v1/ged/a-refaire`, `GET|POST …/pieces/{id}/versions/{n}/lecture…`,
  `POST …/pieces/{id}/controle`. La recherche dans le texte lu viendra avec la recherche unique (EPIC-213).

- **D-996-10 — Le moteur OCR du service est corrigé ici** (`src/ocr/pdf-page-renderer.ts`, partagé par le KYC, le
  profil et les pièces comptables) : pour peindre une image (la page d'un scan est un JPEG), pdf.js créait ses canvas
  temporaires avec **sa propre copie** de `@napi-rs/canvas` (`pdfjs-dist/node_modules`, 0.1.100), alors que la page est
  un canvas de la copie du service (1.0.7). Le mélange des deux bibliothèques natives donnait une segmentation fault
  sous Windows et un rendu bloqué (ou « double free or corruption ») sous Linux. Le test existant (« PDF scanné ») ne
  dessinait qu'un aplat gris, jamais une image : le défaut était invisible. Correctif sans changer les dépendances
  (le registre npm est injoignable depuis les images, 16/11) : une `CanvasFactory` fournie à pdf.js, sur l'instance du
  service ; test de régression sur un vrai scan JPEG au smoke OCR. Aligner les deux versions (une seule copie) reste à
  faire quand le registre reviendra.

## Ce qui n'est pas ici

- La lecture et le classement par l'IA (FR-164, EPIC-217) et `ged.realite.constatee@1`.
- Le versement, le scellé, le numéro d'archivage (STORY-997).
- La consommation de `ged.piece.controlee` par `sinistres` (pièce « reçue » pour l'ouverture, FR-136).

## Ce qui a été livré

**2026-11-16/17** — fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#18** (`dev` `6b57633`) : `ged.piece.controlee`, `ged.lot.changed` ; 11 champs classés.
- `document-service` (dépôt `prospera-ocr-service`) **#27** (`dev` `03e5d99`) :
  - lecture par version (`ged_lectures`, file BullMQ `ged-lecture`, page par page, 2 min par page) sur le moteur du
    service ; couche texte sous 60 caractères par page = image ; `OK`/`PARTIEL`/`ECHEC` et leur consigne ; relance
    (tentative déterministe) et saisie à la main ; texte de santé chiffré, lu par les seuls rôles santé (`TEXTE_LU`) ;
    paramètres `ged` `2026.2` ;
  - contrôle humain (validé, type corrigé jamais à travers la frontière de la santé, rejeté avec motif) ; « à refaire » ;
  - lots (`LOT-AAAA-NNNNN`, chemin, anomalie et retour, « N lus sur M », durées par page ; pas de fermeture avant
    contrôle et lecture) ;
  - ⛔ **le moteur OCR du service corrigé** (D-996-10) : `CanvasFactory` sur l'instance de `@napi-rs/canvas` du
    service ; test de régression sur un vrai scan JPEG au smoke OCR ; fabrique de scans de test
    (`src/ocr/testing/scan-fixture.ts`) ;
  - le filtre d'exceptions transmet `details` d'un refus nommé (additif) : la liste des pièces qui bloquent un lot.
- **Node 24** : 1 041 unitaires, 193 e2e (dont la lecture réelle d'un scan sans couche texte), lint, build.
- **Pile `grp-c-996`** : **lot de 50 pages scannées lu en 48 s** (premier passage : 73 s ; moyenne 1,4 à 2,3 s par
  page), 10/10 `OK` ; page blanche → `ECHEC` (300 dpi), « à refaire », saisie à la main ; certificat : texte chiffré seul
  (0 en clair), ACC ne voit rien, GEST lit « ITT », lecture journalisée ; contrôle par un autre agent d'accueil 403 ;
  correction vers un type médical 409 ; lot : anomalie et retour, fermeture refusée (« 11 non contrôlées »), puis
  `ARCHIVE` « 11 lus sur 11 » ; 12 tâches BullMQ terminées, 0 en échec ; 0 texte, motif ou nom de fichier dans les
  faits ; Karapace 6 sujets, 0 refus ; 0 erreur aux journaux.
- **Ce que la preuve a montré** : au premier passage, la pile ne démarrait pas (`PdfPageRenderer` non exporté par
  `OcrModule`, invisible aux tests unitaires) et le recensement des routes (STORY-695) refusait les 8 routes neuves ;
  corrigé (#27). Le détail des refus 409 n'arrivait pas au client (filtre global) ; corrigé.
- **Rejouée sur les images reconstruites depuis `dev`** (`a504061`, pile `grp-c-996d`) : 50 pages scannées lues en 48,6 s ; fermeture refusée « 11 non contrôlées », puis archivé ; ACC crée un lot 403 ; Karapace 9 sujets, 0 refus ; 0 erreur aux journaux.

**Reste** : la lecture et le classement par l'IA (FR-164) ; la consommation de `ged.piece.controlee` par `sinistres`
(pièce « reçue » pour l'ouverture) ; les pièces de moins de 48 heures et le taux de numérisation (pilotage) ;
l'alignement des deux copies de `@napi-rs/canvas` (une seule version) quand le registre npm reviendra.
