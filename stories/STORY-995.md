# STORY-995 : les pièces du dossier — réception, versions, pièces non rattachées (module `ged`)

Status: done

**Complexité :** grande (un module neuf dans `document-service`, son gate, un port de stockage S3 et son test de
contrat, le chiffrement des pièces de santé, quatre faits)

**Épic :** EPIC-214 (la GED du dossier)
**Dépôts :** `prospera-plateforme` (dossiers de C), `document-service`
**Plage :** groupe C, n° 6 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4).

---

## Pourquoi

Le dossier sinistre vit de ses pièces : constat, devis, certificat médical, rapport. La compagnie veut qu'une pièce
**ne se perde jamais**, qu'une pièce remplacée **reste lisible** dans son historique, qu'**aucun rôle ne puisse
supprimer** quoi que ce soit, et qu'une pièce arrivée sans dossier attende dans une file « à rattacher » au lieu d'être
refusée ou égarée. Le stockage passe par un **port à l'API S3** : MinIO pendant le développement, remplacé avant la
mise en service (Q-3 du PO) — d'où un test de contrat que tout adaptateur doit passer.

**Source** : PRD FR-153, FR-159, FR-160, FR-161, FR-166, FR-175, FR-263 ; annexe A, A.2 (`ged`, C1 → C13) ; annexe D
(`ged.*`) ; spine AD-2, AD-3, AD-8, AD-9, AD-16, AD-23, AD-26 ; manifeste `manifestes/ged.manifest.ts`.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Module `ged`** dans `document-service` (`src/modules/ged/`), gate `GED_NOT_ENTITLED` (socle « état des modules » repris de `sinistres`) ; collections `ged_*` ; manifeste recopié à l'octet ; aucun import d'un autre module | tests ; invariants |
| AC-2 | **Port de stockage S3** (`StockageObjets`) et **un seul adaptateur** (MinIO, appels S3 seulement) ; un **test de contrat** joué en CI sur le double en mémoire et sur un vrai MinIO ; bucket propre à `ged` (jamais `kyc-documents`, jamais `piece-documents`) | tests ; MinIO réel |
| AC-3 | **Réception** (FR-159, FR-160, FR-263) : `POST /api/v1/ged/pieces` (multipart) — avec un dossier connu, ou **sans dossier ⇒ file « à rattacher »** ; source, date de réception (motif si elle diffère du jour), auteur, type, responsable de fourniture ; formats `jpeg/png/webp/pdf`, 8 Mo, extension conforme au contenu (octets magiques) ; un fichier refusé **n'enregistre rien** et dit pourquoi | tests ; pile |
| AC-4 | **Versions** (FR-161, AD-9) : `POST …/pieces/{id}/versions` (motif obligatoire) crée la version n+1 ; le fichier d'une version est **immuable** (clé d'objet par version, jamais réécrite) ; la version 1 reste lisible (`GET …/pieces/{id}/versions/{n}/contenu`) ; SHA-256 par version ; même empreinte dans le dossier ⇒ **doublon signalé**, jamais refusé | tests ; MinIO réel |
| AC-5 | **À rattacher** (FR-166) : `GET /api/v1/ged/a-rattacher` (âge, auteur, état) ; `POST …/pieces/{id}/rattachement` écrit le rattachement au journal, la pièce ne change pas | tests ; pile |
| AC-6 | **Rien ne se supprime** (FR-175) : aucune route `DELETE`, aucun droit « supprimer » ; invariant qui balaie les routes | invariant |
| AC-7 | **Santé** (FR-153, AD-8) : une pièce d'un type médical est **chiffrée par l'application avant écriture** (AES-256-GCM) ; `ACC` et `NUM` n'en voient que le type et l'existence ; `ADMIN` ne lit aucune pièce | tests |
| AC-8 | **Antivirus** (FR-160, AD-9) : `AntivirusPort` ; outil absent ⇒ version « à scanner », **jamais** « saine » ; détecté ⇒ « quarantaine », jamais servie | tests |
| AC-9 | **Faits** `ged.piece.recue`, `ged.piece.versionnee`, `ged.piece.rattachee`, `ged.piece.a-rattacher` par l'outbox, dans la transaction ; clés, empreintes et types seulement (ni nom de fichier ni contenu) ; chaque champ classé ; Karapace BACKWARD | tests ; Karapace |

## Décisions retenues par défaut (contestables)

- **D-995-1 — Le dossier est connu par `sinistres.dossier.changed@1`** (spine AD-16 : `ged` le consomme) : une
  copie locale `ged_dossiers` ; une pièce déposée sur un dossier inconnu de l'organisation rend 404
  `DOSSIER_INCONNU` (anti-énumération) ; sans dossier, elle va « à rattacher ».
- **D-995-2 — Les noms de routes** (ni le PRD ni la spine n'en donnent ; le manifeste les marque « proposition ») :
  `/api/v1/ged/pieces`, `/api/v1/ged/a-rattacher`. Bucket : `ged-pieces` (paramètre `GED_BUCKET`).
- **D-995-3 — Les rôles se lisent dans le jeton** (patron D-988-2) : déposer `ACC`, `NUM`, `GEST`, `GREC`, `RESP` ;
  rattacher `NUM`, `GEST`, `RESP` ; lire le contenu d'une pièce de santé : `GEST`, `GREC`, `RESP`, `DT`, `MC` ;
  `ACC` et `NUM` : existence seulement ; `ADMIN` : rien. Les droits fins `ged:*` (une PR `auth-service` par droit)
  ne sont pas encore posés.
- **D-995-4 — Les types de pièces** sont un paramètre versionné du module (`ged.types_pieces` `2026.1`, les 20 types
  de la démo, `PieceType`). Les cinq types médicaux portent leur classe du registre `classification-sante`
  (`piecesSante`) : `CERTIFICAT_MEDICAL_INITIAL` → `certificat-medical`, `CERTIFICAT_MEDICAL_FINAL` →
  `certificat-de-consolidation`, `PRESCRIPTION` → `ordonnance`, `FACTURE_MEDICALE` → `facture-de-soins`,
  `CERTIFICAT_DECES` → `certificat-de-deces`. Les deux vocabulaires (démo, registre) restent distincts ; la table fait
  le lien, et un test vérifie que chaque classe citée existe au registre.
- **D-995-5 — Le chiffrement des pièces de santé** : AES-256-GCM, clé de l'instance par la configuration
  (`GED_CLE_SANTE`, 32 octets en base64), IV aléatoire par version ; l'empreinte SHA-256 porte sur le **clair** (le
  doublon se juge sur le document, pas sur son chiffré). La rotation de clé viendra avec la mise en service.
- **D-995-6 — L'antivirus de développement est « absent »** : toute version arrive « à scanner » (AD-9 : jamais
  « saine » sans outil) ; elle reste lisible des rôles qui la lisent. Le branchement d'un outil réel (ClamAV) est une
  tâche de mise en service.
- **D-995-7 — `ged.piece.recue@1` part au dépôt** (la pièce est reçue, « en contrôle ») ; `ged.piece.controlee@1`
  viendra du contrôle humain (STORY-996).

## Ce qui a été livré

**2026-11-16** — deux PR fusionnées en « Rebase and merge » :

- `prospera-plateforme` **#16** (`dev` `c5fd205`) : `ged.piece.recue`, `.versionnee`, `.rattachee`, `.a-rattacher` ;
  clés, empreinte, taille, état de l'antivirus et type seulement (`DOCUMENT_MEDICAL` pour la santé) ; champs classés au
  module `ged` du registre (ses premiers faits) ; 408/408.
- `document-service` (dépôt `prospera-ocr-service`) **#26** (`dev` `a682bd1`) : module `src/modules/ged/` — pièces,
  versions à fichier immuable, journal, copie des dossiers sinistres ; port `StockageObjets` et adaptateur S3 unique
  (bucket `ged-pieces`) avec son test de contrat ; contrôles du fichier (octets magiques, 8 Mo, extension) ; antivirus
  (absent ⇒ « à scanner ») ; santé chiffrée AES-256-GCM (`GED_CLE_SANTE`), lue par `GEST`/`GREC`/`RESP`/`DT`/`MC`
  seulement, chaque lecture journalisée ; socle « état des modules » repris de `sinistres` (gate `GED_NOT_ENTITLED`) ;
  `roles[]` du jeton gardés ; manifeste `ged` recopié. Node 24 : 1 027 unitaires + 189 e2e, lint 0, build ;
  **contrat S3 vert sur un vrai MinIO** (6/6, le double en mémoire aussi).
- **Pile `grp-c-995`** (MongoDB, Kafka, Karapace, MinIO, IdP de test) :
  - avant le droit : 403 `GED_NOT_ENTITLED` ; après : le dossier connu par `sinistres.dossier.changed` ;
  - constat déposé (ACC) → version 1, « à scanner » ; version 2 (GEST, motif) ; la version 1 relue **à l'octet** ;
  - certificat médical (ACC) : ACC voit `DOCUMENT_MEDICAL`, ni contenu ni nom de fichier ; contenu → 403 pour ACC, 200
    pour GEST, lecture journalisée (`CONTENU_LU`) ;
  - sans dossier (NUM) → « à rattacher », puis rattaché ; fichier qui ment → 400 `FORMAT_NON_CONFORME` (« rien n'est
    enregistré ») ; dossier inconnu → 404 ; **DELETE → 404** ; ADMIN → 403 ;
  - 3 pièces, 4 versions, journal complet ; 6 faits `SENT` et sur Kafka, **aucun nom de fichier dans les faits** ;
    Karapace : 4 sujets, garde `classification-sante` 0 refus ;
  - `/health` 200 (MongoDB, Kafka avec les 6 consommateurs, MinIO, OCR) une fois le bucket KYC présent : au premier
    passage la pile de preuve n'avait pas le bucket `kyc-documents` (propriété de `kyc-service`), d'où un conteneur
    « unhealthy » sans rapport avec `ged`.
- **Rejouée sur les images reconstruites depuis `dev`** (document-service `a682bd1`, pile `grp-c-995d`) : même scénario, même issue — 403 `GED_NOT_ENTITLED` avant le droit ; v1 relue à l'octet ; santé 403 pour ACC, 200 pour GEST ; « à rattacher » puis rattachée ; 400, 404, DELETE 404 ; 3 pièces, 4 versions, 6 faits `SENT` et sur Kafka, 0 nom de fichier ; Karapace 4 sujets, 0 refus ; 0 erreur aux journaux.

**Reste** : le contrôle humain et l'OCR réel (STORY-996) ; le versement, le scellé et le volume complémentaire
(STORY-997) ; les droits fins `ged:*` à `auth-service` ; la portée par volet et dossier (STORY-1004) ; l'antivirus réel
et la rotation de la clé de santé (mise en service).
