# STORY-081 : Extraction OCR Statuts + carte CFE → profil société pré-rempli éditable (étend `document-service`)

**Epic :** EPIC-018 — Profil société & régime
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A02, NFR-A05 (qualité OCR) · `tech-spec-document-service-*.md` (OcrProvider, DO-1) · STORY-041→044 (`document-service` : scaffold OCR, extraction, `document.extrait`)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 15 (EXTENDED)
**Service :** `balance-service` (:3007) + `document-service` (:3006)
**Couvre :** FR-A02 (extraction OCR des Statuts + carte CFE → profil pré-rempli)

> **Première extension de l'OCR au-delà du KYC — et première application de la règle « l'OCR assiste, il ne décide pas ».** `document-service` sait déjà lire un RCCM/CFE pour le **KYC** (EPIC-015, invariant **DO-1** : l'OCR enrichit le dossier, l'humain tranche). Cette story étend la capacité aux **Statuts** et à la **carte CFE** pour **pré-remplir le profil société** (STORY-079). Le résultat n'est **jamais** figé : c'est un **formulaire pré-rempli éditable**, chaque champ portant son **niveau de confiance**. Un profil fiscal issu d'un OCR non relu est une bombe à retardement (un NIF faux = une DSF rejetée).

---

## Conception arrêtée (2026-07-27) — décisions structurantes

> L'analyse du code existant a montré que la formule « réutilise le même moteur, ajoute 2 types + un mapping »
> **sous-estime** le travail réel : `OcrProvider.extract()` ne rend qu'une **confiance globale** (pas par champ,
> pas de zone), `document-service` **n'a aucun endpoint d'upload** (accès MinIO **lecture seule** sur le bucket
> *propriété de `kyc-service`*), et le contrat `document.extrait` est **déjà consommé par `kyc-service`** et
> **taillé pour le KYC** (`declared`/`discrepancies`, `type ∈ {RCCM,CFE}`). Décisions retenues (arbitrage user) :

**D1 — Contrat SÉPARÉ, pas d'extension du contrat KYC.** Nouveau topic **`document.profil.extrait`** (contrat
`ProfilDocumentExtraitEventV1`), **produit par `document-service`**, **consommé par `balance-service`**. Le
contrat KYC `document.extrait` **n'est pas touché** → `kyc-service` reste **BACKWARD par isolation** (il ne
s'abonne qu'à `document.extrait`, ne voit jamais le nouveau topic). Respecte « un changement de contrat = 2
dépôts » (producteur `document-service` + consommateur `balance-service`), sans 3ᵉ dépôt.

**D2 — `document-service` gagne un chemin profil PARALLÈLE au chemin KYC** (jamais mélangés) :
- nouvel enum **`ProfilDocumentType { STATUTS, CARTE_CFE }`** (le `KycDocumentType {RCCM,CFE}` reste inchangé) ;
- **écriture MinIO** : nouveau *writer* + **bucket dédié `profil-documents`** (config `MINIO_PROFIL_BUCKET`),
  le chemin KYC restant **lecture seule** sur son bucket ;
- **endpoint d'upload** `POST /api/v1/profil-extractions` (multipart : `file` + `type` + `orgId`) → `putObject`
  → crée un `ProfilExtraction` `EN_COURS` → **enqueue un job BullMQ** → **202** `{ extractionId, statut }` ;
- **traitement asynchrone via BullMQ** (invariant #1 : job **interne** à un service = Redis/BullMQ, **jamais**
  Kafka ; ajout `RedisModule`+`QueueModule` calqués sur le patron e-mail d'`auth-service`) : le processeur
  fait l'OCR **par champ**, écrit `ProfilExtraction` `PRETE`/`ECHEC`, **émet `document.profil.extrait`** via
  l'**outbox transactionnel**.

**D3 — OCR par champ.** `OcrProvider` étendu d'une méthode **`extractDetailed()`** rendant les **mots** avec
`text` + `confiance` (0-1) + `zone` (bbox), **sans toucher** `extract()` (chemin KYC intact). Les extracteurs
Statuts/CFE rendent, **par champ** : `{ valeur, confiance, zone?, brut }` (provenance mot(s) source).

**D4 — Corrélation des 2 pièces.** `balance-service` `POST /profil-societe/ocr` génère **un** `extractionId`
(clé de la `PropositionProfil`), l'envoie comme **`correlationId`** à `document-service` pour **chaque** pièce ;
`document.profil.extrait` **réécho** ce `correlationId` → le consumer fusionne Statuts+CFE dans **une seule**
`PropositionProfil` et détecte les **conflits** inter-pièces.

**D5 — `balance-service` inchangé sur la frontière :** aucune écriture profil hors `POST /ocr/:id/appliquer`
(action humaine, DO-1) ; consumer idempotent (`ProcessedEvent`, patron STORY-077) ; application partielle,
éditable, tracée (audit append-only, patron STORY-079).

**Répartition branches (2 dépôts, base `dev`, PR chacune) :** `document-service` MNV-081 (D2/D3 + contrat
produit) · `balance-service` MNV-081 (D4/D5 + contrat consommé). `kyc-service` : **aucune modification**,
seulement une assertion de non-régression (il ignore toujours ce qu'il ne connaît pas).

**Garde-fous de mise en œuvre (revue `architecte-prospera`, verdict : conforme aux 4 invariants) :**
1. **Démarrage dégradé (#4) sur 2 nouvelles dépendances** — Redis absent au boot ne tue pas `document-service`
   (tolérance calquée sur `queue-bootstrap.service.ts` d'`auth-service`) ; `document-service` injoignable ne
   fait pas planter `balance-service` au boot ni `/health` — seule **l'action d'upload** dégrade (502/erreur claire).
2. **Aucun recouplage synchrone masqué côté balance** — `/appliquer` et l'affichage des champs lisent le
   **read-model local** `PropositionProfil` (alimenté par `document.profil.extrait`) ; **jamais** de re-appel
   HTTP à `document-service` pour relire une extraction. Le seul HTTP autorisé est **l'upload aller** (commande + binaire).
3. **Credentials MinIO scindés** — le *writer* profil n'a de droit d'écriture que sur `profil-documents` ;
   le bucket KYC reste en **lecture seule** (pas de client d'écriture à droits élargis sur les deux buckets).

---

## User Story

En tant que **cabinet comptable** ouvrant un dossier client,
je veux **déposer les Statuts et la carte CFE** et obtenir un **profil société pré-rempli** (raison sociale, forme juridique, NIF, RCCM, capital, gérant, objet…),
afin de **ne pas ressaisir 20 champs à la main**, tout en **relisant et corrigeant** ce que la machine a lu.

---

## Description

### Contexte

Le **profil société** (STORY-079) compte ~20 champs, tous présents dans **deux pièces que le client fournit de toute façon** :

| Pièce | Champs extractibles |
|---|---|
| **Statuts** (acte constitutif) | Raison sociale, sigle, forme juridique, **capital social**, objet social, date de création, **actionnaires + parts**, gérant/DG |
| **Carte CFE** (Centre de Formalités des Entreprises) | **NIF**, **RCCM**, raison sociale, adresse, activité (**NAEMA**), date d'immatriculation |

L'OCR est **déjà en place** pour le KYC (`document-service`, EPIC-015 : `OcrProvider`, consumer `kyc.document.uploaded`, producteur `document.extrait`). Cette story **réutilise le même moteur** en ajoutant **deux nouveaux types de document** (`STATUTS`, `CARTE_CFE`) et un **mapping vers le profil société**.

> **Invariant DO-1 étendu (NFR-A05).** L'OCR **propose**, l'humain **valide**. Aucun champ n'est écrit dans le profil sans une **action explicite** du cabinet. Chaque champ extrait porte un **score de confiance** ; les champs à faible confiance sont **signalés visuellement** (et jamais pré-validés).

### Périmètre

**Inclus :**

- **`document-service` (extension — chemin profil PARALLÈLE au KYC, cf. D2/D3)** :
  - Nouvel enum `ProfilDocumentType { STATUTS, CARTE_CFE }` (le `KycDocumentType {RCCM,CFE}` reste intact).
  - **Endpoint d'upload** `POST /api/v1/profil-extractions` (multipart) → *writer* MinIO (bucket `profil-documents`) → job **BullMQ** → **202** `{ extractionId, statut }`.
  - **Extracteurs dédiés** Statuts/CFE → **par champ** : `valeur`, `confiance` (0-1), `zone` (bbox), `brut` (via `OcrProvider.extractDetailed()`).
  - Émet **`document.profil.extrait`** (nouveau topic, D1) avec `type`, `orgId`, `correlationId`. **Contrat KYC `document.extrait` non touché.**
  - **Aucune écriture** dans le profil société : `document-service` ne connaît pas le métier balance (séparation des responsabilités).
- **`balance-service` (consommation)** :
  - Endpoint `POST /api/v1/profil-societe/ocr` (`@RequiresBalanceAccess`) — upload **Statuts** et/ou **carte CFE** (`multipart/form-data`) → génère un `extractionId`, **proxifie** chaque pièce vers `document-service` (`correlationId`=extractionId, D4) → **202 Accepted** `{ extractionId, statut: 'EN_COURS' }` (traitement asynchrone).
  - **Consumer `document.profil.extrait`** (groupe `balance-profil-ocr`, idempotent via `ProcessedEvent` — patron STORY-077) → fusionne Statuts+CFE dans une **`PropositionProfil`** (brouillon, **jamais** le profil lui-même).
  - `GET /api/v1/profil-societe/ocr/:extractionId` → **200** `{ statut, champs: [{ champ, valeur, confiance, source: 'STATUTS'|'CARTE_CFE' }], avertissements }`.
  - **`POST /api/v1/profil-societe/ocr/:extractionId/appliquer`** → l'humain **choisit les champs à appliquer** (`champsRetenus: string[]`, valeurs **éditées** possibles) → écrit sur le `ProfilSociete` (STORY-079) + **audit** (`source: OCR`, `confiance`, `valeurBrute`, `valeurRetenue`).
- **Fusion des deux pièces** : si Statuts **et** CFE donnent la même donnée (ex. raison sociale) et **divergent** → **conflit signalé** (les deux valeurs présentées, aucune choisie automatiquement).
- **Seuil de confiance** : sous un seuil configurable (défaut **0,80**), le champ est marqué `faibleConfiance: true` et **exclu du pré-cochage** (l'humain doit le cocher sciemment).
- **Rien n'est bloquant** : un OCR raté n'empêche pas la saisie manuelle (STORY-079 reste le chemin nominal).
- **Tests** : extraction Statuts (capital, forme juridique, actionnaires) ; extraction CFE (NIF, RCCM, NAEMA) ; **conflit** entre les deux pièces → signalé, non résolu ; champ sous seuil → `faibleConfiance`, non pré-coché ; `appliquer` n'écrit **que** les champs retenus ; idempotence du consumer ; audit tracé (brut vs retenu).

**Hors périmètre :**

- **Moteur OCR lui-même** (Tesseract/`OcrProvider`) → **`document-service`** (STORY-041, déjà livré sprint 8).
- **OCR des pièces comptables** (captures de recettes, factures) → **STORY-084** (S16) — autre usage, autres extracteurs.
- **Validation légale des pièces** (le document est-il authentique ?) → **KYC** (`kyc-service`), hors périmètre.
- **Écriture automatique du profil** → **interdite** (DO-1/NFR-A05) : l'application est **toujours** une action humaine.
- **Choix du fournisseur OCR** → question ouverte (PRD §13) ; on consomme l'abstraction `OcrProvider`.

### Flux

1. Le cabinet ouvre un dossier et dépose **Statuts.pdf** + **carte-CFE.jpg** → `POST /profil-societe/ocr` → **202** `{ extractionId }`.
2. `balance-service` transmet à `document-service` (types `STATUTS`, `CARTE_CFE`).
3. `document-service` extrait, score chaque champ, émet **`document.extrait`**.
4. `balance-service` consomme (idempotent) et construit une **`PropositionProfil`** :
   - `raisonSociale` = « ETS RELAXED » (confiance **0,97**, source CFE **et** Statuts — concordant ✔)
   - `nif` = « 1000745307 » (confiance **0,93**, source CFE)
   - `capitalSocial` = « 1 000 000 » (confiance **0,71** → **faible confiance**, non pré-coché ⚠️)
   - `formeJuridique` : Statuts disent « SARL », CFE dit « SUARL » → **CONFLIT** (les deux affichées, aucune choisie).
5. Le cabinet **relit** : corrige le capital, tranche le conflit, décoche un champ douteux.
6. `POST /ocr/:id/appliquer` avec `champsRetenus` (+ valeurs éditées) → le **profil société** est écrit, chaque champ **tracé** (`source: OCR`, confiance, brut, retenu).
7. Les champs non retenus restent **vides** → `GET /profil-societe/completude` (STORY-079) les signale.

---

## Acceptance Criteria

- [ ] **`document-service`** supporte les types **`STATUTS`** et **`CARTE_CFE`** et émet **`document.extrait`** avec, **par champ** : `valeur`, `confiance` (0-1), `zone`, `brut`.
- [ ] **`POST /api/v1/profil-societe/ocr`** (gate) accepte Statuts et/ou CFE → **202** `{ extractionId, statut }` (asynchrone).
- [ ] **Consumer `document.extrait`** idempotent (même `eventId` rejoué → **aucune** proposition dupliquée), transactionnel (patron STORY-077).
- [ ] **`GET /ocr/:extractionId`** retourne les champs proposés avec **confiance** et **source** (`STATUTS` / `CARTE_CFE`).
- [ ] **Aucune écriture automatique du profil** : la `PropositionProfil` est un **brouillon** ; seul **`POST /ocr/:id/appliquer`** (action humaine) écrit sur `ProfilSociete` (NFR-A05 / DO-1).
- [ ] **`appliquer`** n'écrit **que** les `champsRetenus`, en acceptant des **valeurs éditées** par l'humain (l'OCR n'est jamais figé).
- [ ] **Seuil de confiance** (défaut **0,80**) : sous le seuil → `faibleConfiance: true`, champ **non pré-coché**.
- [ ] **Conflit Statuts ↔ CFE** sur un même champ → **signalé** avec les deux valeurs ; **aucune résolution automatique**.
- [ ] **Audit (NFR-A07)** : chaque champ appliqué trace `source: OCR`, `confiance`, `valeurBrute`, `valeurRetenue`, auteur, date.
- [ ] **Non bloquant** : un OCR en échec/illisible n'empêche pas la **saisie manuelle** (STORY-079 reste opérationnelle).
- [ ] **Tests** : extraction Statuts + CFE, conflit, faible confiance, `appliquer` partiel, idempotence, audit. **Coverage ≥ 90 %** côté `balance-service`.
- [ ] **Swagger** + **CI verte** (matrice incluant `document-service`).

---

## Technical Notes

### Contrat de proposition

```typescript
export interface ChampPropose {
  champ: keyof ProfilSociete;      // 'nif' | 'capitalSocial' | …
  valeur: unknown;
  confiance: number;               // 0..1
  source: 'STATUTS' | 'CARTE_CFE';
  brut: string;                    // texte OCR source (traçabilité)
  faibleConfiance: boolean;        // confiance < seuil (défaut 0.80)
  conflit?: {                      // si les 2 pièces divergent
    autreValeur: unknown;
    autreSource: 'STATUTS' | 'CARTE_CFE';
  };
}

export interface PropositionProfil {
  extractionId: string;
  orgId: string;
  statut: 'EN_COURS' | 'PRETE' | 'ECHEC';
  champs: ChampPropose[];
  avertissements: string[];
  createdAt: Date;
}
```

### Contrat wire `document.profil.extrait` (D1) — produit `document-service`, consommé `balance-service`

```typescript
export const DOCUMENT_PROFIL_EXTRAIT_TOPIC = 'document.profil.extrait';

/** Un champ lu sur une pièce profil, avec sa provenance (D3). */
export interface ChampExtraitProfil {
  champ: string;          // clé de EtatProfilSociete : 'nif' | 'capitalSocial' | 'raisonSociale' | …
  valeur: string;         // valeur normalisée lue (brute côté OCR, non typée métier)
  confiance: number;      // 0..1 (dérivée des mots source)
  zone?: { x: number; y: number; w: number; h: number }; // bbox, surlignage front (optionnel)
  brut: string;           // fragment OCR source (traçabilité)
}

/** État absolu, compat BACKWARD (P9). `correlationId` = extractionId côté balance (D4). */
export interface ProfilDocumentExtraitEventV1 {
  schemaVersion: 1;
  eventId: string;        // déterministe : `${jobId}:profil-extrait`
  orgId: string;          // clé de partition Kafka
  correlationId: string;  // regroupe Statuts + CFE d'une même PropositionProfil
  type: 'STATUTS' | 'CARTE_CFE';
  champs: ChampExtraitProfil[];
  confianceGlobale: number; // 0..1, best-effort (drapeau ECHEC si trop bas / illisible)
  statut: 'PRETE' | 'ECHEC';
  ocrProvider: string;
  occurredAt: string;     // ISO-8601 UTC
}
```

> **Frontière D1/D2** : `document-service` ne connaît **pas** `ProfilSociete` — il rend des `champs` bruts
> (clé + valeur + provenance). La transformation en `ChampPropose` (seuil `faibleConfiance`, détection de
> `conflit` inter-pièces) et l'écriture du profil sont **entièrement** côté `balance-service` (séparation des
> responsabilités : `document-service` lit, `balance-service` décide du métier, l'humain applique).

### La règle qui ne se négocie pas

```typescript
// ❌ INTERDIT — écrire le profil directement depuis l'OCR
async onDocumentExtrait(event) {
  await this.profilSociete.update(event.orgId, event.champs); // NON (DO-1 / NFR-A05)
}

// ✅ CORRECT — stocker une PROPOSITION ; l'humain applique
async onDocumentExtrait(event) {
  await this.propositionRepo.upsert(toProposition(event));    // brouillon, éditable
}
```

### Application (humaine, partielle, éditable, tracée)

```typescript
@Post('/profil-societe/ocr/:extractionId/appliquer')
@RequiresBalanceAccess()
async appliquer(
  @TenantContext() orgId: string,
  @Param('extractionId') id: string,
  @Body() dto: { champsRetenus: Array<{ champ: string; valeur: unknown }> }, // valeurs ÉDITABLES
  @CurrentUser() user,
) {
  const proposition = await this.propositionRepo.get(orgId, id);
  return this.profilService.appliquerDepuisOcr(orgId, proposition, dto.champsRetenus, user); // + audit
}
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Un NIF faux entre dans le profil** → DSF rejetée | **Aucune écriture auto** ; relecture humaine obligatoire ; confiance affichée ; audit `brut` vs `retenu` |
| OCR trop confiant (score élevé, valeur fausse) | Champs **toujours éditables** ; `brut` conservé pour contrôle ; seuil de pré-cochage conservateur (0,80) |
| Statuts et CFE se contredisent | **Conflit signalé**, jamais arbitré par la machine |
| Dépendance au fournisseur OCR (question ouverte) | Abstraction **`OcrProvider`** (`document-service`) — changer de moteur ne touche pas `balance-service` |
| Qualité de scan médiocre (photos AO) | `statut: ECHEC` + avertissement ; **la saisie manuelle reste le chemin nominal** (non bloquant) |
| Couplage `balance-service` ↔ `document-service` | Communication **par événement** (`document.extrait`), pas d'appel synchrone bloquant |

---

## Definition of Done

- [ ] `document-service` : types `STATUTS`/`CARTE_CFE` + extracteurs + `document.profil.extrait` (confiance par champ)
- [ ] `balance-service` : `POST /profil-societe/ocr` (202), consumer idempotent, `GET /ocr/:id`, `POST /ocr/:id/appliquer`
- [ ] **Aucune écriture automatique du profil** (test qui le prouve)
- [ ] Seuil de confiance + `faibleConfiance` non pré-coché
- [ ] Conflit Statuts↔CFE signalé, non résolu automatiquement
- [ ] Audit (source OCR, confiance, brut, retenu) append-only
- [ ] OCR en échec → saisie manuelle toujours possible (non bloquant)
- [ ] Coverage ≥ 90 % (balance-service) ; Swagger ; CI verte
- [ ] Non-régression : STORY-079 (saisie manuelle) + KYC OCR (EPIC-015) verts

---

## Progress Tracking

> À renseigner au fil du dev (flux APEX-PROSPERA). **Non clôturable en `done`** tant que la vérification
> docker réelle (persistance + atomicité + idempotence + absence d'orphelin) n'y est pas consignée.

### Dev
- [ ] `document-service` MNV-081 : upload + writer MinIO + BullMQ + OCR par champ + `document.profil.extrait`
- [ ] `balance-service` MNV-081 : `POST /ocr` (proxy 202) + consumer idempotent + `PropositionProfil` + `GET /ocr/:id` + `POST /ocr/:id/appliquer` + audit

### Portes de qualité (par service)
- [ ] Lint 0 warning · build · couverture ≥ 65/90/90/90 · unit + e2e verts

### Vérification docker (obligatoire — story écrit en base)
- [ ] `PropositionProfil` réellement persistée (mongosh), fusion Statuts+CFE sous un seul `extractionId`
- [ ] Consumer idempotent : même `eventId` rejoué → aucune proposition dupliquée
- [ ] `POST /appliquer` : seuls les `champsRetenus` écrits sur `ProfilSociete` ; audit append-only tracé (brut vs retenu)
- [ ] Conflit Statuts↔CFE capturé en base (deux valeurs, aucune choisie)
- [ ] Mutation-test : retrait de la garde « écriture auto interdite » / de l'idempotence → test vire au rouge

### Revue / sécurité
- [ ] Revue de code (opus) — constats traités/laissés
- [ ] Revue de sécurité (opus) — vulnérabilités ≥ 80 corrigées

---

**Status:** in_progress
**Dependencies:** STORY-079 (profil société — cible de l'application), STORY-077 (gate + patron consumer idempotent), **`document-service`** STORY-041→044 (OcrProvider, outbox, ProcessedEvent — patrons réutilisés ; le contrat `document.extrait` KYC **n'est pas** réutilisé, cf. D1) · **question ouverte** : fournisseur OCR (PRD §13, on consomme l'abstraction `OcrProvider`)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A02, NFR-A05 · invariant DO-1
