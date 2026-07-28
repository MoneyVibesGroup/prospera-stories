# STORY-084 : OCR captures & factures → montants éditables, rangés par mois (étend `document-service`)

**Epic :** EPIC-020 — Adaptateur #3 : construction de balance, chemin A (cahiers + OCR)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A10, NFR-A05 · `tech-spec-document-service-*.md` (OcrProvider) · `deferred_foundations` du tracker (« document-service : extensions factures fournisseurs » — **activée ici**) · D4 (OCR dès la v1)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 16 (EXTENDED)
**Service :** `balance-service` (:3007) + `document-service` (:3006)
**Couvre :** FR-A10 (OCR des pièces : captures & factures)

> **Ce qui rend le chemin A tenable sur le terrain.** Une PME ouest-africaine n'a pas un ERP : elle a des **photos de reçus**, des **captures d'écran de TMoney/Flooz**, des **factures papier scannées**. Sans OCR, saisir 500 lignes de cahier à la main tue l'offre. Cette story branche l'OCR sur les **pièces comptables** (≠ pièces d'identité de STORY-081) et **pré-remplit les lignes** des cahiers — recettes (STORY-082) et dépenses (STORY-083). **Règle absolue (NFR-A05, D4) : les montants restent TOUJOURS éditables et rien n'est figé sur l'OCR seul.** Un montant OCR non relu qui entre dans une balance, c'est un faux en écriture.

---

## User Story

En tant que **cabinet comptable** traitant une PME,
je veux **déposer des captures (mobile money) et des factures** et obtenir des **lignes de cahier pré-remplies** (date, montant, tiers), **rangées par mois**,
afin de **ne pas ressaisir des centaines de pièces**, tout en **relisant et corrigeant** chaque montant avant qu'il n'entre dans la balance.

---

## Description

### Contexte

**D4** a acté l'OCR **dès la v1** — pas comme confort, mais comme condition de faisabilité. Deux familles de pièces :

| Famille | Exemples | Champs extraits | Difficulté |
|---|---|---|---|
| **Captures** | Écran **TMoney / Flooz**, SMS de transaction, reçu manuscrit photographié | date, montant, sens (entrée/sortie), tiers, référence | Qualité variable (photo, cadrage) |
| **Factures** | Facture fournisseur, **facture normalisée**, ticket | date, montant **HT/TVA/TTC**, fournisseur, n° facture, NIF émetteur | Structurée mais formats hétérogènes |

L'observation du terrain (balance Sage réelle, ETS RELAXED) a confirmé la présence de **TMONEY** dans les comptes de trésorerie → **le mobile money est un flux de premier plan**, pas un cas marginal.

> **Invariant repris de DO-1 / NFR-A05 :** l'OCR **propose**, l'humain **valide**. Ici, la conséquence est plus forte que pour le profil (STORY-081) : ces montants deviennent **la balance**, donc **le résultat**, donc **l'impôt**. Aucune ligne de cahier n'est créée sans **action explicite** du comptable, et chaque montant reste **éditable** jusqu'à la validation de la balance.

### Périmètre

**Inclus :**

- **`document-service` (extension — active `deferred_foundations`)** :
  - Nouveaux types : **`CAPTURE_TRANSACTION`** et **`FACTURE`**.
  - Extracteurs dédiés → `DocumentExtraction` avec, **par champ** : `valeur`, `confiance` (0-1), `zone` (bbox), `brut`.
  - **Facture** : extraction **HT / TVA / TTC** + `nifEmetteur` (permet de distinguer une **facture normalisée** — niveau de preuve supérieur).
  - **Capture** : extraction date / montant / **sens** (crédit = entrée, débit = sortie) / tiers / référence.
  - Émet **`document.piece.extrait`** (topic **dédié**, voir **D-084-1**) avec `type` + `orgId`. **Aucune connaissance du métier balance.**
- **`balance-service` (consommation)** :
  - `POST /api/v1/pieces/ocr` (`@RequiresBalanceAccess`) — dépôt **multi-fichiers** (`multipart/form-data`, jusqu'à N pièces) + `destination: 'RECETTES' | 'DEPENSES'` → **202 Accepted** `{ lotId, nbPieces }` (asynchrone).
  - **Consumer `document.extrait`** (groupe `balance-service-pieces`, **idempotent** via `ProcessedEvent` — patron STORY-077) → crée des **`LignePreProposee`** (brouillon, **jamais** une ligne de cahier).
  - `GET /api/v1/pieces/ocr/:lotId` → **200** `{ statut, lignes: [{ pieceId, date, montant, tiers, tva?, confiance, faibleConfiance, mois, avertissements }] }`.
  - **`POST /api/v1/pieces/ocr/:lotId/appliquer`** — l'humain **choisit et édite** : `{ lignesRetenues: [{ pieceId, date, montant, compte, categorieId?, ...champs édités }] }` → crée les **`LigneRecette`** (STORY-082) ou **`LigneDepense`** (STORY-083) avec `origine: 'OCR'` et `niveauPreuve: 'ocr'` (ou **`fichier`** si **facture normalisée** avec NIF émetteur reconnu).
- **Rangement par mois** : chaque ligne proposée porte son **mois** (dérivé de la `date` extraite) ; une **date illisible** → ligne marquée `dateManquante` → **le comptable doit la saisir** avant application (pas de mois par défaut).
- **Seuil de confiance** (défaut **0,80**) : sous le seuil → `faibleConfiance: true`, ligne **non pré-cochée**.
- **Détection de doublon** : une pièce déjà importée (même `checksum` de fichier, ou même `(date, montant, tiers)`) → **avertissement de doublon**, non bloquant, non appliqué par défaut.
- **Cohérence TVA (facture)** : si `HT + TVA ≠ TTC` (tolérance 1 XOF) → **avertissement** ; le comptable tranche.
- **Traçabilité (NFR-A07)** : chaque ligne créée depuis l'OCR conserve `pieceId`, `confiance`, **`valeurBrute`** vs **`valeurRetenue`**, auteur, date. La pièce reste **consultable** (MinIO) depuis la ligne.
- **Tests** : extraction capture (TMoney) + facture (HT/TVA/TTC) ; **date illisible → application bloquée** tant que non saisie ; faible confiance non pré-cochée ; **doublon signalé** ; incohérence TVA signalée ; `appliquer` ne crée **que** les lignes retenues, avec valeurs **éditées** ; idempotence du consumer ; audit brut vs retenu ; **facture normalisée → `niveauPreuve: fichier`**.

**Hors périmètre :**

- **Moteur OCR** (Tesseract / `OcrProvider`) → **`document-service`** (STORY-041, sprint 8).
- **OCR des pièces d'identité/légales** (Statuts, CFE) → **STORY-081** (autre usage, autres extracteurs).
- **Rattachement au compte comptable** (quel compte 6/7 ?) → **proposé par STORY-085** ; ici on fournit le montant/tiers/date, et la ligne héritera de la proposition de compte au moment de l'application.
- **Rapprochement bancaire** (confronter aux relevés) → **STORY-089/090**.
- **Choix du fournisseur OCR** → question ouverte (PRD §13) — on consomme l'abstraction.

### Flux

1. Le cabinet dépose **60 pièces** du mois de mars (captures TMoney + factures fournisseurs) → `POST /pieces/ocr` avec `destination: 'DEPENSES'` → **202** `{ lotId, nbPieces: 60 }`.
2. `document-service` extrait chaque pièce (type `CAPTURE_TRANSACTION` ou `FACTURE`), score les champs, émet **`document.extrait`** ×60.
3. `balance-service` consomme (idempotent) → **60 `LignePreProposee`** :
   - 52 lignes **confiance ≥ 0,80** → pré-cochées ✔
   - 5 lignes **faible confiance** → non pré-cochées ⚠️
   - 2 lignes **date illisible** → `dateManquante` → **saisie obligatoire** ⛔
   - 1 ligne **doublon** (déjà importée le mois dernier) → signalée, non pré-cochée ⚠️
4. Le comptable **relit** l'écran : corrige 3 montants, saisit les 2 dates manquantes, écarte le doublon, décoche une pièce illisible.
5. `POST /pieces/ocr/:lotId/appliquer` avec les **lignes retenues (éditées)** → création de **57 `LigneDepense`** (`origine: OCR`), chacune **tracée** (`pieceId`, confiance, brut vs retenu).
6. Les **factures normalisées** (NIF émetteur reconnu) obtiennent `niveauPreuve: 'fichier'` ; les captures, `niveauPreuve: 'ocr'`.
7. La synthèse du cahier (STORY-083) intègre ces lignes → agrégation en balance (STORY-085) → `statutPreuve` de la balance (FR-A27) reflète la part d'OCR.

---

## Acceptance Criteria

- [ ] **`document-service`** supporte **`CAPTURE_TRANSACTION`** et **`FACTURE`**, et émet **`document.piece.extrait`** (D-084-1) avec `valeur`/`confiance`/`zone`/`brut` par champ ; la **facture** expose **HT/TVA/TTC** + `nifEmetteur`.
- [ ] **`POST /api/v1/pieces/ocr`** (gate) : dépôt **multi-pièces** + `destination` (RECETTES|DEPENSES) → **202** `{ lotId, nbPieces }`.
- [ ] **Consumer `document.extrait`** **idempotent** (même `eventId` rejoué → aucune ligne dupliquée) et transactionnel.
- [ ] **Aucune ligne de cahier créée automatiquement** : l'OCR produit des **`LignePreProposee`** ; seul **`POST /:lotId/appliquer`** (action humaine) crée les `LigneRecette`/`LigneDepense` (**NFR-A05 / D4**).
- [ ] **Montants toujours éditables** : `appliquer` accepte des **valeurs modifiées** par le comptable ; la `valeurBrute` OCR est **conservée** (audit).
- [ ] **Rangement par mois** : chaque ligne proposée porte son **mois** (dérivé de la date) ; **date illisible → `dateManquante`** et **application bloquée** pour cette ligne tant que la date n'est pas saisie (**aucun mois par défaut**).
- [ ] **Seuil de confiance** (défaut 0,80) : sous le seuil → `faibleConfiance: true`, **non pré-cochée**.
- [ ] **Doublon détecté** (même checksum de fichier ou même `(date, montant, tiers)`) → **avertissement**, ligne non pré-cochée.
- [ ] **Cohérence TVA** (facture) : `HT + TVA ≠ TTC` (tolérance 1 XOF) → **avertissement** ; jamais de correction automatique.
- [ ] **Niveau de preuve** : **facture normalisée** (NIF émetteur reconnu) → `niveauPreuve: 'fichier'` ; capture/photo → `'ocr'` (alimente FR-A27).
- [ ] **Traçabilité (NFR-A07)** : chaque ligne créée conserve `pieceId`, `confiance`, `valeurBrute`, `valeurRetenue`, auteur, date ; la **pièce reste consultable** depuis la ligne.
- [ ] **Tests** : capture TMoney, facture HT/TVA/TTC, date illisible bloquante, faible confiance, doublon, incohérence TVA, application partielle éditée, idempotence, audit, facture normalisée → `fichier`. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte** (matrice avec `document-service`).

---

## Technical Notes

### Ligne pré-proposée (brouillon — jamais une ligne de cahier)

```typescript
export interface LignePreProposee {
  lotId: string;
  pieceId: string;                 // → pièce stockée (MinIO), consultable
  orgId: string;
  destination: 'RECETTES' | 'DEPENSES';

  date?: Date;                     // absente si illisible
  dateManquante: boolean;          // ⛔ bloque l'application tant que non saisie
  mois?: string;                   // '2026-03' — dérivé de la date, jamais deviné

  montant?: number;
  tiers?: string;
  sens?: 'ENTREE' | 'SORTIE';      // capture mobile money
  tva?: { ht: number; tva: number; ttc: number; incoherent: boolean };
  nifEmetteur?: string;            // facture normalisée → preuve renforcée

  confiance: number;               // 0..1
  faibleConfiance: boolean;        // < seuil (0.80) → non pré-cochée
  doublonProbable?: { ligneExistanteId: string; motif: string };
  avertissements: string[];

  brut: Record<string, string>;    // texte OCR source par champ (audit)
}
```

### La règle qui ne se négocie pas (D4 / NFR-A05)

```typescript
// ❌ INTERDIT — créer une ligne de cahier depuis l'OCR
async onDocumentExtrait(event) {
  await this.ligneDepenseRepo.create(toLigne(event));   // NON : rien n'est figé sur l'OCR seul
}

// ✅ CORRECT — proposer ; l'humain relit, édite, applique
async onDocumentExtrait(event) {
  await this.preProposeeRepo.upsert(toPreProposee(event)); // brouillon éditable
}
```

### Application — partielle, éditée, tracée

```typescript
@Post('/pieces/ocr/:lotId/appliquer')
@RequiresBalanceAccess()
async appliquer(@TenantContext() orgId, @Param('lotId') lotId, @Body() dto: AppliquerLotDto, @CurrentUser() user) {
  for (const l of dto.lignesRetenues) {
    const prop = await this.preProposeeRepo.get(orgId, lotId, l.pieceId);

    if (prop.dateManquante && !l.date) {
      throw new BadRequestException('DATE_REQUISE'); // aucun mois par défaut
    }

    const niveauPreuve = prop.nifEmetteur ? 'fichier' : 'ocr'; // facture normalisée = preuve forte

    await this.cahierService.creerLigne({
      ...l,                        // ← valeurs ÉDITÉES par l'humain (prioritaires)
      origine: 'OCR',
      niveauPreuve,
      audit: { pieceId: l.pieceId, confiance: prop.confiance, brut: prop.brut, parUserId: user.id },
    });
  }
}
```

---

## Décisions de conception (D-084-1..10)

### D-084-1 — Topic **dédié** `document.piece.extrait`, et non `document.extrait`

Le périmètre initial disait « émet `document.extrait` (topic existant, EPIC-015) ». **Écart assumé.**
`document.extrait` est le contrat **KYC** (STORY-043) : son `type` est un `KycDocumentType {RCCM, CFE}`,
et son payload porte `declared`/`discrepancies`/`flags` — la comparaison déclaré ↔ lu du dossier de revue
KYC. Y verser des `FACTURE`/`CAPTURE_TRANSACTION` casserait la compatibilité **BACKWARD** pour
`kyc-service`, qui consomme ce topic et n'a rien à faire d'un reçu TMoney.

C'est exactement le raisonnement de **D1 de STORY-081** (`document.profil.extrait`) : **compatibilité par
isolation**. Troisième chemin, troisième topic. Le contrat `PieceDocumentExtraitEventV1` est **dupliqué
byte-identique** dans les deux dépôts (décision K4, pas de lib partagée en phase 1).

### D-084-2 — `document-service` : module `piece-extraction`, parallèle à `profil-extraction`

Nouvel enum `PieceDocumentType {CAPTURE_TRANSACTION, FACTURE}` (le KYC et le profil gardent les leurs),
bucket MinIO **`piece-documents`**, file BullMQ **`piece-ocr`**, deux parseurs (`CaptureTransactionParser`,
`FactureParser`) sous un registre par type. Les helpers de *parsing* OCR (`extraireChamp`, `provenance`,
`normaliserTexte`) sont **génériques** — aucune sémantique profil : ils sont **réutilisés**, pas dupliqués.

Le client MinIO d'écriture reste **séparé du client KYC** (garde-fou #3 : `kyc-documents` demeure en lecture
seule) ; `MINIO_PIECE_BUCKET` est **optionnel** (défaut `piece-documents`, bucket créé au boot) — c'est un
nom de bucket que le service possède, pas une configuration que l'exploitant doit fournir.

### D-084-3 — `balance-service` : module `cahiers/pieces-ocr`

Deux collections en `snake_case` explicite : **`lots_pieces_ocr`** (le lot : `lotId`, `destination`,
`nbPieces`, statut) et **`lignes_pre_proposees`** (le brouillon, clé unique `{orgId, lotId, pieceId}` —
l'index unique **est** le filet d'idempotence, pas seulement le marqueur `ProcessedEvent`).

### D-084-4 — L'application **réutilise** les services de cahier, elle ne réécrit rien

`POST /:lotId/appliquer` ne parle jamais aux collections `lignes_recettes`/`lignes_depenses` : il construit
des entrées et appelle `CahiersRecettesService`/`CahiersDepensesService`. Toutes les règles de 082/083
s'appliquent donc telles quelles — compte de classe 6/7 validé, **déductibilité proposée avant la
ventilation TVA** (le piège de 083), exercice figé par une balance validée ⇒ **409**, taux et codes issus du
paquet fiscal. Réécrire ce chemin dans le module OCR aurait fabriqué un **second jeu de règles fiscales**,
divergent au premier correctif.

Les services de cahier reçoivent pour cela une **origine** et une **trace OCR** : `origine: 'OCR'` (au lieu
du `MANUELLE` codé en dur) et un sous-document `auditOcr`.

### D-084-5 — L'exercice est porté par la requête d'application, pas deviné

Une `LigneRecette`/`LigneDepense` **exige** son exercice (bornes), et l'OCR ne peut pas l'inventer : le corps
d'`appliquer` porte `exercice: { debut, fin }`, comme les DTO de lot de 082/083. Une date hors exercice est
**rejetée ligne à ligne** (règle existante `DateHorsExerciceException`), jamais rangée d'office.

### D-084-6 — Date illisible : rejet **de la ligne**, explicite et rapporté

L'AC dit « application bloquée **pour cette ligne** ». La réponse d'`appliquer` reprend donc la forme des
lots de 082/083 — `{ creees, rejetees[{ pieceId, code, motif }], soumises }` — et une ligne `dateManquante`
sans date saisie ressort en `DATE_REQUISE`. **Jamais de rejet silencieux**, et un lot de 60 pièces n'est pas
renvoyé en bloc parce qu'une seule date manque. Aucun mois par défaut n'est jamais dérivé.

### D-084-7 — Doublon : deux détections, **jamais** bloquantes

`checksum` **sha256 du fichier** (calculé côté `balance-service` à l'upload, avant le proxy) — la même pièce
redéposée est reconnue **même si l'OCR relit autrement** — **et** heuristique `(date, montant, tiers)` contre
les lignes **déjà au cahier**. Résultat : `doublonProbable` + avertissement, ligne **non pré-cochée**.
Jamais un refus : deux achats identiques le même jour chez le même fournisseur sont un cas normal
(c'est déjà pourquoi 082/083 n'ont **aucun** index unique sur les lignes).

### D-084-8 — Tolérance TVA : **1 XOF = 100 unités mineures**

Tous les montants des cahiers sont en **unités mineures XOF** (D-082-1). La « tolérance 1 XOF » du
périmètre vaut donc **100** en unités mineures. L'écart `HT + TVA ≠ TTC` produit un **avertissement**
(`TVA_INCOHERENTE`) ; jamais un recalcul.

### D-084-9 — `niveauPreuve` : `fichier` seulement sur **facture normalisée**

`FACTURE` **avec** un `nifEmetteur` reconnu ⇒ `fichier` (niveau de preuve le plus fort, FR-A27) ; tout le
reste (capture, facture sans NIF) ⇒ `ocr`. Le rang est déjà posé par `RANG_NIVEAU_PREUVE` (D-083-1) :
`estimé < ocr < saisie < fichier`.

### D-084-10 — Le consumer ne crée **jamais** de ligne de cahier

Projection idempotente (patron STORY-077 : `ProcessedEvent` inséré **en premier** dans la transaction,
E11000 ⇒ `abort` + skip). Elle n'écrit que `lignes_pre_proposees`. Cette frontière est l'objet même de la
story (D4/NFR-A05) : elle est **testée par mutation** — retirer la garde doit faire virer un test au rouge.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Un montant OCR faux entre dans la balance** → résultat et impôt faux | **Aucune création automatique** ; relecture obligatoire ; montants **toujours éditables** ; `brut` conservé |
| Date illisible → ligne rangée dans le mauvais mois | **`dateManquante`** → application **bloquée** pour cette ligne ; **aucun mois par défaut** |
| **Doublon** (même pièce importée 2×) → CA/charges gonflés | Détection par **checksum** de fichier + heuristique `(date, montant, tiers)` → **avertissement**, non appliqué par défaut |
| Qualité de photo médiocre (terrain) | `faibleConfiance` non pré-coché ; échec d'extraction → la **saisie manuelle** (STORY-082/083) reste le chemin nominal |
| Balance majoritairement OCR → fragile | `niveauPreuve: 'ocr'` remonte au **`statutPreuve`** de la balance (FR-A27) : une balance majoritairement estimée est **signalée**, pas cachée |
| TVA incohérente sur facture | **Avertissement** ; jamais de recalcul silencieux |
| Couplage fort avec `document-service` | Communication **par événement** (`document.extrait`) ; abstraction `OcrProvider` |

---

## Definition of Done

- [ ] `document-service` : types `CAPTURE_TRANSACTION` + `FACTURE` (HT/TVA/TTC, NIF émetteur) + `document.extrait`
- [ ] `balance-service` : `POST /pieces/ocr` (202 multi-pièces), consumer idempotent, `GET /:lotId`, `POST /:lotId/appliquer`
- [ ] **Aucune ligne créée automatiquement** (test qui le prouve) ; montants **éditables** à l'application
- [ ] Date illisible → **application bloquée** (aucun mois par défaut)
- [ ] Seuil de confiance + faible confiance non pré-cochée
- [ ] Détection de **doublon** (checksum + heuristique) signalée
- [ ] Incohérence TVA signalée (jamais corrigée seule)
- [ ] Facture normalisée (NIF) → `niveauPreuve: 'fichier'` ; capture → `'ocr'`
- [ ] Audit complet (pieceId, confiance, brut vs retenu) + pièce consultable
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-082/083 (saisie manuelle) + STORY-081 (OCR profil) verts

---

## Progress Tracking

| Étape | État | Date |
|---|---|---|
| Conception arrêtée (D-084-1..10) | ✅ | 2026-07-28 |
| Implémentation `document-service` (module `piece-extraction`) | ⏳ | — |
| Implémentation `balance-service` (module `cahiers/pieces-ocr`) | ⏳ | — |
| Portes DoD (lint / build / couverture / unit / e2e) | ⏳ | — |
| Vérification docker (persistance réelle) | ⏳ | — |
| Revue de code | ⏳ | — |
| Revue de sécurité | ⏳ | — |
| Merge sur `dev` (2 dépôts) | ⏳ | — |

---

**Status:** in_progress
**Dependencies:** STORY-082 (cahier recettes), STORY-083 (cahier dépenses) — cibles de l'application · STORY-077 (patron consumer idempotent) · **`document-service`** STORY-041→044 (OcrProvider) · **question ouverte** : fournisseur OCR (PRD §13)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A10, NFR-A05 · D4 (OCR dès la v1) · `deferred_foundations` (extensions document-service) — **activée par cette story**
