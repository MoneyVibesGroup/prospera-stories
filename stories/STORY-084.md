# STORY-084 : OCR captures & factures → montants éditables, rangés par mois (étend `document-service`)

**Epic :** EPIC-020 — Adaptateur #3 : construction de balance, chemin A (cahiers + OCR)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A10, NFR-A05 · `tech-spec-document-service-*.md` (OcrProvider) · `deferred_foundations` du tracker (« document-service : extensions factures fournisseurs » — **activée ici**) · D4 (OCR dès la v1)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
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
  - Émet **`document.extrait`** (topic existant, EPIC-015) avec `type` + `orgId`. **Aucune connaissance du métier balance.**
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

- [ ] **`document-service`** supporte **`CAPTURE_TRANSACTION`** et **`FACTURE`**, et émet **`document.extrait`** avec `valeur`/`confiance`/`zone`/`brut` par champ ; la **facture** expose **HT/TVA/TTC** + `nifEmetteur`.
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

**Status:** ready-for-dev
**Dependencies:** STORY-082 (cahier recettes), STORY-083 (cahier dépenses) — cibles de l'application · STORY-077 (patron consumer idempotent) · **`document-service`** STORY-041→044 (OcrProvider) · **question ouverte** : fournisseur OCR (PRD §13)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A10, NFR-A05 · D4 (OCR dès la v1) · `deferred_foundations` (extensions document-service) — **activée par cette story**
