# STORY-1103 : Renvoyer un dossier KYC pour correction — le cabinet est prévenu et lit le motif de chaque pièce

Status: done (2026-11-24 ; AC-5 ouvert avec la demande à D, D-1103-1) — **créée le 2026-11-19** par A, à la validation de la maquette d'AP-38 (l'utilisateur a suivi la
recommandation de A : « suis ta recommandation »). **Placée au lot 6 de B, n° 5** (`PLAN-LOT-6-2026-11-23.md` §5 ;
Docker : non ; fini quand `kyc.correction.requested@1` est publié et AP-62 débloquée). Prise par B le 2026-11-24 :
décisions du premier geste et contrat ci-dessous, **annoncés avant le code** (AC-1).

**Services :** `kyc-service` (principal) · le BFF `admin-panel-service` (relais) · le service qui envoie déjà les
e-mails KYC au cabinet (consommateur de `kyc.status.changed`, STORY-021 ; à confirmer au premier geste, D-1103-1)
**Points :** 5 · **Écran :** AP-62 (console) · **Maquette :** validée avec AP-38, Artifact de la console, version 9
(`docs/mockups/ap-02-organisations.html`, frontend-admin-panel #32)

---

## Pourquoi

Lu dans `kyc-service` (`origin/dev`, 2026-11-19), le renvoi d'une pièce pour correction est muet :

- `POST /admin/orgs/:orgId/kyc/documents/:documentId/reject` part **sans corps**. La pièce passe `REJECTED`, le
  dossier reste `UNDER_REVIEW`, et **aucun événement** n'est émis (`kyc-admin.service.ts`, `reviewDocument`).
- Le cabinet n'est donc **pas prévenu**. Il ne voit « rejetée » que s'il relit lui-même son statut
  (`GET /kyc/status`, champ `reviewStatus` de la pièce), et il ne lit **aucun motif**.
- Le seul motif qui arrive au cabinet est celui du rejet **global** (`POST …/kyc/reject`, `reason` ≤ 1 000), qui
  l'oblige à tout reprendre, pièces validées comprises.

Dans la console, l'opérateur tape un motif par pièce que personne ne lira. AP-38 corrige le cas du rejet global sans
backend. Le renvoi, lui, a besoin de cette story.

## Ce qui est attendu

1. **Un motif facultatif sur la marque d'une pièce.** La route de rejet d'une pièce accepte `{ motif?: string }` :
   - texte rogné, 500 caractères au plus, vide ⇒ absent ;
   - persisté sur la pièce ;
   - effacé si la pièce est ensuite approuvée ;
   - conservé dans l'historique quand une nouvelle version de la pièce la remplace.

   Il est exposé :
   - côté cabinet, dans `KycDocumentResponseDto` (`motifRenvoi`) ;
   - côté console, dans le détail admin du dossier.
2. **Un acte de renvoi au dossier**, distinct du rejet global.
   - **Route :** `POST /admin/orgs/:orgId/kyc/request-correction`. Permission `kyc:reject`, `If-Match` obligatoire,
     comme `reject`.
   - **Corps :** `{ message?: string }`, 1 000 caractères au plus. C'est « un mot pour le cabinet », facultatif.
   - **Préconditions :**
     - dossier `UNDER_REVIEW` ;
     - au moins une pièce `REJECTED`, sinon 409 `RENVOI_SANS_PIECE_A_CORRIGER` ;
     - conflit de décision traité comme pour `reject` (STORY-182).
   - **Effet recommandé :** le dossier passe en `PENDING_DOCUMENTS`. Il sort ainsi de la file KYC, puisqu'il attend
     le cabinet, et les pièces validées restent validées. Le re-dépôt des pièces renvoyées le repasse en
     `UNDER_REVIEW` par le chemin de soumission existant (`kyc-status.service`). À vérifier en premier (D-1103-2) :
     si ce chemin ne convient pas, garder `UNDER_REVIEW` avec un horodatage `correctionDemandeeLe`, et le dire dans
     l'annonce du contrat.
   - **Événement :** `kyc.correction.requested@1` est émis par l'outbox, dans la même transaction. Il porte
     `orgId`, `message` et `pieces[]` (`documentId`, type, `motifRenvoi`), ainsi que `demandeLe`.
3. **Le cabinet est prévenu** par e-mail. L'e-mail contient :
   - le mot de l'opérateur ;
   - une ligne `— <libellé de la pièce> : <motif>` par pièce renvoyée qui porte un motif ;
   - une pièce sans motif, nommée sans texte ;
   - le lien vers son espace.

   La composition est **la même** que l'aperçu de la console (maquette validée).
4. **Le journal du dossier** (`GET /kyc-admin/:orgId`) inscrit l'acte « Renvoi pour correction », avec le message et
   les lignes des pièces.
5. **Le BFF** relaie :
   - le corps de la marque de pièce ;
   - la nouvelle route ;
   - les nouveaux champs du détail.

## Critères d'acceptation

- **AC-1** : le contrat est **annoncé avant le code**, comme pour STORY-1080. L'annonce couvre :
  - les routes ;
  - le DTO ;
  - l'événement et son schéma ;
  - les codes de refus ;
  - la transition d'état retenue (D-1103-2).
- **AC-2** : une pièce rejetée avec motif le restitue, au cabinet comme à la console. Une pièce approuvée ensuite ne le
  restitue plus.
- **AC-3** : le renvoi refuse un dossier sans pièce rejetée (409 nommé), et un `If-Match` périmé (412 ou 409, comme
  `reject`).
- **AC-4** : le renvoi émet `kyc.correction.requested@1` une seule fois, dans la transaction. Un crash ne laisse ni
  événement sans état, ni état sans événement.
- **AC-5** : l'e-mail reçu par le cabinet contient exactement les lignes attendues. C'est vérifié dans mailhog, dans
  la recette.
- **AC-6** : le journal du dossier montre l'acte, son auteur, le message et les lignes.
- **AC-7** : aucune régression du rejet global. `reason` reste obligatoire, avec 1 000 caractères au plus.

## Décisions à prendre au premier geste

- **D-1103-1** : quel service envoie l'e-mail KYC au cabinet aujourd'hui ? Le consommateur de `kyc.status.changed`
  (STORY-021) est à relire. Recommandé : le même service ajoute `kyc.correction.requested`.
- **D-1103-2** : la transition de l'effet 2. Recommandé : `PENDING_DOCUMENTS`.

## Hors périmètre

- L'écran de la console : AP-62.
- Le rejet global avec motif composé : AP-38, sans backend.
- Un motif par pièce lisible du cabinet **dans son espace**, pièce par pièce : il suit naturellement l'AC-2. Son écran
  côté cabinet est à nommer au prochain tri.

---

## Ce que le code disait le 2026-11-24 (relu avant la fiche, `kyc-service` `origin/dev` `d4932c6`, BFF `3a5f5ef`)

- Rien de la story n'était servi : la marque de pièce part sans corps, aucun arc ne ramène un dossier en
  `PENDING_DOCUMENTS`, aucun événement de renvoi, aucun schéma d'événement dans `kyc-service` (ni `contrat/`, ni
  registre).
- Les routes de kyc sont sous **`/admin/kyc/:orgId/…`** ; celles de la fiche (`/admin/orgs/:orgId/kyc/…`) sont celles
  du **BFF**, qui les relaie (D-1103-3).
- Le BFF ne publiait pas `reviewStatus` ni `reviewedAt` d'une pièce dans `KycDocumentDto` (servis par kyc depuis
  STORY-128, traversés à l'exécution, absents de l'OpenAPI) : ajoutés ici (D-1103-9).
- **Le chemin des e-mails KYC** (D-1103-1) : `prospera-expert-comptable` consomme `kyc.status.changed` (STORY-021) et,
  depuis STORY-590, demande les trois messages (`kyc-dossier-recu`, `kyc-dossier-approuve`, `kyc-dossier-a-corriger`)
  à `prospera-notification-service`, qui en tient les textes (socle). Aucun des deux n'est à B.

## Décisions du premier geste (B, 2026-11-24)

- **D-1103-1 — l'e-mail au cabinet n'est pas dans un dépôt de B.** Le consommateur des e-mails KYC est
  `prospera-expert-comptable` (tenu par **personne**, plan maître §2) et les textes vivent dans
  `prospera-notification-service` (**à D** depuis le lot 3, D-L3-3). B ne touche ni l'un ni l'autre : B **publie
  l'événement** (schéma au dépôt, compatible BACKWARD), avec un texte déjà composé (D-1103-5) pour que l'e-mail n'ait
  rien à recomposer, et adresse la suite à **D** (`→ D (2026-11-24) : consommer kyc.correction.requested@1 pour
  prévenir le cabinet — ouverte`, journal de B). Question à l'utilisateur, **choix par défaut : D porte aussi le
  consommateur dans `prospera-expert-comptable`** (même patron que STORY-590 : destinataires lus dans le read-model
  d'identité, une demande par administrateur du cabinet). **L'AC-5 (mailhog) reste ouvert** avec cette demande ; le
  « fini quand » du plan (événement publié, AP-62 débloquée) ne l'attend pas.
- **D-1103-2 — le renvoi fait passer le dossier en `PENDING_DOCUMENTS`** (recommandation de la fiche), arc neuf
  `UNDER_REVIEW → PENDING_DOCUMENTS`. Le chemin de soumission convient **à une correction près** : depuis
  `PENDING_DOCUMENTS`, le dossier ne repasse en revue que lorsque **plus aucune pièce courante n'est `REJECTED`**
  (toutes les pièces renvoyées remplacées). Sans elle, le premier re-dépôt d'une seule des deux pièces renvoyées
  rouvrirait la revue. Ce retour est journalisé `RESOUMISSION` (et non `SOUMISSION`) et purge `reviewedAt`,
  `reviewedBy`, `correctionDemandeeLe`, comme la re-soumission après rejet. Le rejet global (`REJECTED → UNDER_REVIEW`)
  ne change pas (AC-7).
- **D-1103-3 — chemins** : kyc `POST /admin/kyc/:orgId/request-correction` ; BFF `POST
  /api/v1/admin/orgs/{orgId}/kyc/request-correction`. La marque de pièce garde ses routes : **corps facultatif** sur
  `…/documents/:documentId/reject` (rien n'est renommé, §1.8).
- **D-1103-4 — le renvoi émet aussi `kyc.status.changed`** (invariant du service : pas de transition sans événement),
  `previousStatus: UNDER_REVIEW`, `status: PENDING_DOCUMENTS`, `reviewedBy`. Les consommateurs relus (balance, bilan,
  dossier, paiement, assurance, réseau, notification, expert-comptable…) n'ouvrent leur garde que sur `APPROVED` ;
  expert-comptable n'envoie aucun e-mail pour `PENDING_DOCUMENTS`. Les deux événements partent par l'outbox, dans la
  transaction du renvoi.
- **D-1103-5 — kyc compose le texte** que lira le cabinet, une fois, et le fige dans l'événement **et** le journal :
  le message rogné (s'il y en a un), puis une ligne par pièce renvoyée, dans l'ordre RCCM puis CFE, `— <libellé> :
  <motif>` ou `— <libellé>` sans motif, jointes par un saut de ligne. Libellés = ceux de la console (`RCCM`, `Carte
  CFE`). C'est la règle de `composeMotif` de la maquette validée, plus la ligne d'une pièce sans motif (§3 de la
  fiche).
- **D-1103-6 — le schéma** est `contrat/schemas/kyc.correction.requested.json` dans `kyc-service` (patron d'auth et du
  catalogue : un fichier par topic, titre = topic, sujet `<topic>-value`, modèle fermé). Le script du registre
  (`npm run schemas:compatibilite` / `schemas:enregistrer`, BACKWARD) parle à l'API REST du registre par `fetch` :
  **aucune dépendance neuve** (Docker : non). Preuve sans pile : un test valide l'événement **produit par le code**
  contre le schéma.
- **D-1103-7 — le renvoi estampille `reviewedAt` et `reviewedBy`** (plus `correctionDemandeeLe`, même instant) : une
  décision concurrente reçoit le 409 `KYC_DECISION_CONFLIT` qui nomme le renvoi (`DECISION_CONCURRENTE`, verdict
  `PENDING_DOCUMENTS`, auteur, date), au lieu d'un `DOSSIER_MODIFIE` muet.
- **D-1103-8 — le motif d'une pièce** : rogné, 500 au plus, vide ⇒ absent ; une nouvelle marque « rejetée » sans motif
  efface l'ancien ; une approbation (de la pièce ou du dossier) l'efface ; le rejet global garde ceux déjà posés ; une
  pièce remplacée le garde dans l'historique (`SUPERSEDED`).
- **D-1103-9 — le BFF** relaie le corps de la marque, la route neuve et les champs neufs en DTO typés publiés dans son
  OpenAPI (noms de schéma uniques) ; `RENVOI_SANS_PIECE_A_CORRIGER` traverse par son code (409) ; le conflit de
  décision traverse comme pour `reject` (`details`).
- **D-1103-10 — `correctionDemandeeLe`** est servi au détail admin et au statut du cabinet (`GET /kyc/status`) : le
  cabinet distingue « renvoyé pour correction » de « jamais soumis », sans lire le journal.
- Permission : **`kyc:reject`** (aucune neuve ; `permission.enum.ts` n'est pas touché, piège MNV-650).

## Contrat (annoncé avant le code, AC-1)

**kyc-service** (ajouts seuls) :

- `POST /admin/kyc/:orgId/documents/:documentId/reject` : corps **facultatif** `RejeterPieceKycDto { motif?: string }`
  (500 au plus après rognage ; vide ⇒ absent ; au-delà ⇒ 400). Réponse `AdminKycDocumentReviewDto` + `motifRenvoi?`.
- **`POST /admin/kyc/:orgId/request-correction`** (`kyc:reject`, `If-Match` obligatoire) : corps facultatif
  `DemanderCorrectionKycDto { message?: string }` (1 000 au plus, rogné, vide ⇒ absent). 200 → `AdminKycReviewItemDto`
  (`status: PENDING_DOCUMENTS`). Refus : 404 dossier inconnu ; 428 `PRECONDITION_REQUISE` ; 409
  `KYC_DECISION_CONFLIT` (`details` comme `reject`) si le dossier n'est pas en revue ou a bougé ; **409
  `RENVOI_SANS_PIECE_A_CORRIGER`** si aucune pièce courante n'est `REJECTED` ; 400 message trop long.
- Champs neufs (facultatifs) : `motifRenvoi` sur `KycDocumentResponseDto` (cabinet), `AdminKycDocumentDto` et
  `AdminKycDocumentReviewDto` ; `correctionDemandeeLe` sur `AdminKycDetailDto` et `KycStatusResponseDto` ; dans la
  chronologie (`AdminKycEvenementDto`), type neuf **`RENVOI_CORRECTION`** et `message?`, `texte?`, `piecesRenvoyees?`
  (`AdminKycPieceRenvoyeeDto { documentId, type, libelle, version, motifRenvoi? }`). Les `decisions` ne changent pas
  (un renvoi n'est pas un verdict).
- Machine à états : arc neuf `UNDER_REVIEW → PENDING_DOCUMENTS` (D-1103-2), visible sur `kyc.status.changed`.
- **Événement neuf `kyc.correction.requested` v1** (clé `orgId`, outbox, une fois par renvoi) : `schemaVersion: 1`,
  `eventId` (uuid), `occurredAt`, `orgId`, `demandeLe` (= `correctionDemandeeLe`), `demandePar` (userId opaque de
  l'opérateur), `message?`, `pieces[]` (au moins une : `documentId`, `type` `RCCM` | `CFE`, `libelle`, `version`,
  `motifRenvoi?`), `texte` (D-1103-5). Modèle fermé ; aucun binaire, aucune clé de stockage, aucune adresse.

**BFF** (OpenAPI, A génère ses types depuis lui) :

- `POST /api/v1/admin/orgs/{orgId}/kyc/documents/{documentId}/reject` : corps facultatif `RejeterPieceKycRequestDto
  { motif? }` ; réponse `KycDocumentReviewDto` + `motifRenvoi?`.
- **`POST /api/v1/admin/orgs/{orgId}/kyc/request-correction`** (`kyc:reject`, `If-Match` relayé) : corps
  `DemanderCorrectionKycRequestDto { message? }` → `KycDecisionResultDto`. Refus relayés : 428, 409
  `KYC_DECISION_CONFLIT` (`details`), 409 **`RENVOI_SANS_PIECE_A_CORRIGER`**, 400, 403, 404, 503.
- Détail (`GET /api/v1/admin/orgs/{orgId}`, bloc `kyc`) : `KycDocumentDto` + `reviewStatus`, `reviewedAt?`,
  `motifRenvoi?` ; `KycDetailDto` + `correctionDemandeeLe?` ; `KycEvenementDossierDto` : type `RENVOI_CORRECTION`,
  `message?`, `texte?`, `piecesRenvoyees?` (`KycPieceRenvoyeeDto`).

## Livré (2026-11-24)

- **kyc #29** (`9cef9cb` sur `dev`) et **BFF #42** (`c451b17` sur `dev`), fusionnées en rebase, arbres identiques aux
  branches poussées (`ee567cd`, `636a432`). Contrat annoncé avant le code : stories #805 ; **sans écart**. Deux
  précisions de comportement, écrites dans « ⚠ Contrats » : le refus `RENVOI_SANS_PIECE_A_CORRIGER` est rendu avant
  toute écriture ; un dossier déjà sorti de revue sans pièce rejetée reçoit `KYC_DECISION_CONFLIT`.
- Fichiers neufs de kyc : `src/modules/kyc/texte-de-renvoi.util.ts` (composition, libellés), `dto/renvoi-correction.dto.ts`,
  `contrat/schemas/kyc.correction.requested.json`, `scripts/schemas/registre.mjs` (+ `npm run schemas:compatibilite`,
  `schemas:enregistrer`). Du BFF : `dto/renvoi-correction.dto.ts`, `test/admin-kyc-renvoi.e2e-spec.ts`,
  `test/fixtures/kyc-renvoi/` (corps produits par le code de kyc de la story, `ORIGINE.json` dit d'où).
- Aucun module, contrôleur, fournisseur, dépendance ni Dockerfile neuf ; `permission.enum.ts` intact (`kyc:reject`).

## Preuves

| AC | Preuve |
|---|---|
| AC-1 | « ⚠ Contrats » du journal de B, stories #805, fusionné avant la première ligne de code |
| AC-2 | e2e kyc : la marque avec motif le rend (réponse, détail admin, `GET /kyc/status` du cabinet) ; approuvée ensuite, plus de motif ; marque sans motif ou blanche ⇒ effacé ; 501 caractères ⇒ 400 |
| AC-3 | e2e kyc : 409 `RENVOI_SANS_PIECE_A_CORRIGER` (dossier inchangé, aucun événement), `If-Match` périmé ⇒ 409 `KYC_DECISION_CONFLIT`, absent ⇒ 428 ; BFF : les mêmes refus traversent par leur code |
| AC-4 | unitaire : ordre profil (ETag) → pièces → transition → journal → `kyc.status.changed` → `kyc.correction.requested`, tous sous la même session, une fois chacun ; sans pièce ou ETag périmé, aucune écriture ; e2e : un seul `correctionRequested` |
| AC-5 | **ouvert** : l'e-mail est hors des dépôts de B (D-1103-1), demande à D |
| AC-6 | e2e kyc et BFF : chronologie `RENVOI_CORRECTION` avec auteur, message, texte et pièces ; `decisions` inchangées |
| AC-7 | e2e kyc : `reject` sans `reason` ⇒ 400 ; suites existantes du rejet global vertes |
| D-1103-2 | e2e cabinet : une pièce renvoyée redéposée ⇒ `UNDER_REVIEW` (journal `RESOUMISSION`, renvoi purgé, l'ancienne version garde son motif) ; deux renvoyées, une redéposée ⇒ le dossier attend |
| Schéma | `src/kafka/kyc-correction-requested.schema.spec.ts` : l'événement produit par `KycEventsService` est valide (ajv, draft-07), le modèle fermé refuse 9 altérations ; le script du registre éprouvé contre un faux registre (nouveau sujet, BACKWARD posé, compatible, incompatible ⇒ code 1, registre injoignable ⇒ code 1) |

- Node 25 : kyc unitaires **521 passés** (4 suites rouges connues, toutes du binding natif du client Kafka et
  identiques sur `dev` : `app-cablage`, `kafka-producer`, `outbox-relay`, `document-extrait-consumer`), e2e **121/121** ;
  BFF **711/711**, e2e **294/294** (dont 12 contre la doublure de kyc et 4 du contrat OpenAPI) ; `tsc`, lint des
  fichiers touchés, `nest build` verts ; garde des noms de schéma uniques du BFF vert.
- Mutations : kyc **16/16** (motif posé ou gardé à tort, retour en revue prématuré, purge oubliée, journal
  `SOUMISSION`, renvoi compté comme soumission, renvoi sans pièce accepté, pièces non triées, événement non émis, 409
  non traduit, texte non rogné, `correctionDemandeeLe` ou pièces absents du détail, `message` indéfini sérialisé, motif
  perdu en route, ligne sans motif omise) ; BFF **8/8** (motif ou `If-Match` ou message perdus, code du refus
  neutralisé ou relayé sous un autre statut, texte non rogné, borne relâchée, énumération amputée).
- **Docker : non** (plan §5) : aucun module, dépendance ni Dockerfile ne change ; verrou non pris.

