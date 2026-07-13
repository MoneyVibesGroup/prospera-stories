# STORY-086 : Adaptateur import fichier — balance Sage 100 (Excel/CSV prioritaire, PDF secours) → contrat canonique

**Epic :** EPIC-021 — Hub multi-source : adaptateur #2 import fichier (Sage)  
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § Épics AB-04 (import & migration) ; `sprint-plan-atelier-balance-2026-07-12.md` § D13 adaptateurs ; fixture réelle `Balance_des_comptes.pdf` (export Sage ETS RELAXED, 50 comptes)  
**Priorité :** Must Have  
**Story Points :** 5  
**Statut :** ready-for-dev  
**Assigné à :** null  
**Créée le :** 2026-07-12  
**Sprint :** 10 (CORE)  
**Service :** `balance-service` (:3007)  
**Couvre :** FR-A12 (import Sage) — D13 adaptateur #2 ; **amorce** FR-A13 (reprise à-nouveaux, vrai travail en STORY-087) et FR-A14 (profil d'import, vrai travail en STORY-088)

> **Adaptateur #2 du hub multi-source — le pont vers l'existant Sage.** D13 décide que la balance-service reçoit les balances de **3 adaptateurs** : (#1) ingestion directe `balance.submitted` (verticaux intégrés IMF, STORY-102) · (#2) **import fichier Sage** (ce qu'on fait ici, pour les cabinets déjà sur Sage 100) · (#3) construction cahiers/OCR (PME informelle, STORY-082-085). Le **profil structuré** (dont MV compta) exporte sa balance depuis Sage 100, la charge dans l'Atelier, et **poursuit dans Prospera**. Ce story produit le parser Sage + la transformation vers le contrat canonique. Aucune mutation du fichier : juste lecture → normalisation → contrat (idempotent, reproductible).

---

## User Story

En tant que **comptable du cabinet ou structure déjà sur Sage 100**,  
je veux **uploader mon export Sage (Excel ou CSV)** et avoir une **balance normalisée** prête pour les contrôles et l'export DSF,  
afin de **migrer vers Prospera rapidement** et de **continuer ma comptabilité** dans l'Atelier Balance.

---

## Description

### Contexte

Le **profil structuré** (cadres haut de gamme, cabinets, distributeurs) possède souvent une base Sage 100 existante. `bilan-service` (sprint 11-14) accepte déjà un **import générique** (STORY-050 : fichier + parsing minimal) pour le dogfooding MV. Mais le profil structuré **migrant** a un besoin plus riche : **reprise de balance d'ouverture** (balance antérieure → continuation) + **profil d'import mémorisé** (réutilisable si ré-upload). 

Ce story découple donc l'**import Sage riche** (STORY-086, balance-service, CORE sprint 10) de l'**import générique** (STORY-050, bilan-service, sprint 10 aussi, mais pour un autre cas d'usage). Les deux produisent un **contrat canonique identique** — la balance normalisée — mais le chemin diffère.

**Format Sage supporté :** Export « Balance des comptes » depuis Sage 100 i7 / 100 Modern. Format : **Excel (.xlsx)** ou **CSV (.csv)** prioritaires ; **PDF** accepté en secours (OCR nécessaire, moins fiable).

> **⚠️ Dépendance fixture (question ouverte PRD §13).** La seule pièce Sage réelle en main est un **PDF** (`Balance_des_comptes.pdf`, ETS RELAXED, 50 comptes) — pas un Excel/CSV. **Obtenir un export Sage Excel/CSV** est un prérequis pour valider le parser sur son format prioritaire ; à défaut, les tests Excel/CSV s'appuient sur une fixture **reconstruite** à partir des 50 comptes du PDF (structure connue), et le vrai fichier valide le parser à l'intégration.

**Fichier Sage caractéristique :**
```
Balance des comptes – Periode 01/01/2026 à 31/12/2026 – Devise : XOF
Numéro compte | Intitulé | Mouvements N-1 (Débit/Crédit) | Mouvements période (Débit/Crédit) | Soldes cumulés (Débit/Crédit)
101          | Capital  | ...
411FACTURE   | Clients  | ...
```

### Périmètre

**Inclus :**

- **Endpoint `POST /api/v1/balance/import/sage`** (`@RequiresBalanceAccess`, authentifié) — `multipart/form-data` :
  - DTO `ImportSageDto { file, exerciceDebut, exerciceFin, mappingProfile?, dryRun? }`
  - **Dry-run (`dryRun=true`, DÉFAUT)** → **200 OK** `{ previewLines, warnings?, errors?, totalDebiteur, totalCrediteur, estEquilibre }` (aperçu, **aucune persistance**).
  - **Persist (`dryRun=false`)** → **201 Created** `{ balanceId, status: 'BROUILLON', createdAt }` (crée la ressource balance via STORY-101).
  - Erreurs de validation (déséquilibre, format) → **400 Bad Request** avec détail.

- **Parser Sage** (`SageParserService`) :
  - Détection format (Excel via magic bytes `.xlsx`, CSV, PDF)
  - Pour Excel/CSV : extraction brute des colonnes (compte | libellé | mvt N-1 D/C | mvt période D/C | soldes D/C)
  - Pour PDF : **OCR** (étend `document-service` STORY-041, cf. déf EXTENDED si fournisseur OCR choisi ; sinon fallback : « PDF fourni, importer manuellement ou convertir Excel »)
  - Parsing des comptes (8 char alphanum SYSCOHADA ex: `5211BOA0`, `411FACTURE`, `103`)
  - Parsing des montants (float → XOF 2 décimales, ruptures de ligne ignorées)
  - **Liste de warnings** : numéros non-numérotés, montants négatifs (vérif ultérieure), cpts orphelins (sans libellé)

- **Transformation vers contrat BalanceCanonique** (`SageNormalizerService`) :
  - Entrée : liste brute `{ compte, libellé, debiteur, crediteur }`
  - Sortie : `BalanceCanonique` (D13 contrat) avec :
    - `source: 'sage'`, `referentiel: 'SN'` (Système Normal SYSCOHADA)
    - Chaque ligne (compte) → LigneBalance `{ compte, libellé, debiteur/crediteur, niveauPreuve: 'fichier' }`
    - Sommaire (total débiteur/créditeur, équilibre Actif=Passif)
    - `checksum` SHA256
    - `statutPreuve: 'justifiée'` (source fiable = fichier Sage)

- **Profil d'import** (`SageImportProfileSchema`) :
  - Schéma pour mémoriser un mapping de colonnes
  - Allows future re-imports avec mémorisation (STORY-088 : « mapping colonne assisté »)
  - Clé : `(orgId, exercice, source, profilNom)`

- **Validation (partagée dry-run + persist)** :
  - Équilibre Actif=Passif (FR-A25, délègue à `BalanceValidator` de STORY-101), pas de doublon compte, format compte SYSCOHADA.
  - **Dry-run** (200) : valide + retourne l'aperçu **sans écrire en base**.
  - **Persist** (201) : valide + **persiste atomiquement** via `BalanceRepository.submitBalance` (STORY-101) → idempotent `(orgId, exercice, source=sage, version)`.

- **Amorce reprise de balance d'ouverture (FR-A13)** :
  - `exerciceDebut`/`exerciceFin` fournis au upload → la balance est stockée en `version: 1` (le contrat démarre à 1 — STORY-101).
  - Une re-soumission du même exercice crée `version: N+1` (archivage de l'ancienne — **immutabilité définie en STORY-101**).
  - La vraie logique de *continuation* (journaux Atelier après reprise) reste **STORY-087**.

- **Tests** :
  - Unit : parsage Excel/CSV (fixture reconstruite depuis les 50 comptes de `Balance_des_comptes.pdf`) → structures brutes
  - Unit : normalisation → contrat canonique (équilibre = 100% sur la fixture, checksum déterministe)
  - Dry-run : upload → **200**, aperçu retourné, **DB intacte** (0 doc `balances`)
  - Persist : upload `dryRun=false` → **201**, balance stockée (1 doc `balances`, `version:1`)
  - Idempotence : re-persist même exercice → `version:2`, ancienne archivée (délègue STORY-101)
  - e2e : upload → dry-run 200 → persist 201 → `GET /api/v1/balance/:exercice/sage` affiche la balance
  - Régression : endpoints existants (health, gate) e2e toujours verts

**Hors périmètre :**

- **OCR PDF** — déféré si fournisseur OCR pas en place ; inline comment « PDF : OCR futur » + fallback « convertir Excel »
- **Gestion des comptes non mappés** — STORY-098 (contrôles) traite « compte orphelin, pas dans la table de passage »
- **Reprise vraie à-nouveaux** — STORY-087 « définit le profil migrant + passe en « continuation mode »
- **Autres formats Sage** (versions antérieures, exports alternatifs) → future story
- **Correction post-import** (edit lignes) → STORY-085 (cahier dépenses) fait ce travail pour OCR ; Sage import est figé

### Flux (utilisateur)

1. Comptable se connecte à `balance-service` (`@RequiresBalanceAccess` gate passe — STORY-077).
2. Clique « Importer Sage » → upload fichier Excel `Balance_2026.xlsx` (ou PDF/CSV).
3. Backend valide :
   - Format (Excel/CSV/PDF détecté)
   - Parsage (colonnes extraites, comptes numérotés)
   - Transformation → contrat canonique (équilibre vérif, checksum calc)
4. API (dry-run par défaut) retourne **200** `{ previewLines: [5 premières lignes], warnings: ["Compte vide: 104"], totalDebiteur, totalCrediteur, estEquilibre: true }`
5. Interface affiche aperçu + avertissements.
6. Comptable clique « Valider & continuer » → `POST /api/v1/balance/import/sage` avec `dryRun=false` (re-upload du même fichier).
7. Backend persiste `BalanceCanonique` dans `balances` collection (via STORY-101) → **201** `{ balanceId, status: 'BROUILLON', createdAt }`
8. Comptable voit « Balance importée. Prochaine étape : rapprochement bancaire » (STORY-089+).

---

## Acceptance Criteria

- [ ] **Endpoint `POST /api/v1/balance/import/sage`** accepte `multipart/form-data` ; **dry-run (défaut) → 200** (aperçu + warnings) ; **`dryRun=false` → 201** (persiste) ; validation KO → 400.
- [ ] **Parser Sage** (`SageParserService`) extrait comptes / libellés / débits/crédits depuis :
  - **Excel** (.xlsx) → détection magic bytes, extraction lignes via SheetJS/node-xlsx
  - **CSV** (.csv) → détection BOM/charset, parsing colonnes (séparateur `,`/`;` FR)
  - **PDF** (fallback) → message « PDF requiert OCR (futur) ; exporter en Excel/CSV » (ou OCR si fournisseur intégré)
- [ ] **Normalisation** (`SageNormalizerService`) → `BalanceCanonique` :
  - `source: 'sage'`, `referentiel: 'SN'`
  - Chaque ligne : `{ compte (alphanum 3-7c), libellé, debiteur/crediteur (XOF), niveauPreuve: 'fichier' }`
  - Sommaire : `{ totalDebiteur, totalCrediteur, estEquilibre, ecartEquilibre }`
  - Checksum SHA256 ; `statutPreuve: 'justifiée'`
- [ ] **Validation pré-persistance** (FR-A25, déléguée à `BalanceValidator` STORY-101) :
  - `totalDebiteur === totalCrediteur` (tolérance < 1 XOF)
  - Pas de doublon compte ; comptes au format SYSCOHADA
- [ ] **Dry-run** (défaut) : upload → parse + validate + aperçu (5 lignes) + warnings → **200, AUCUNE persistance DB**.
- [ ] **Persist** (`dryRun=false`) : même upload → **201**, **persiste atomiquement** via STORY-101 (`BalanceRepository`).
- [ ] **Amorce profil d'import** : structure `SageImportProfile` préparée pour re-uploads (vrai mapping assisté = STORY-088).
- [ ] **Tests** :
  - Unit : parsage Excel/CSV (fixture reconstruite depuis les 50 comptes de `Balance_des_comptes.pdf`) → structures brutes
  - Unit : normalisation → contrat (équilibre 100% sur la fixture, checksum déterministe)
  - e2e dry-run : **200**, aperçu retourné, DB inchangée
  - e2e persist : **201**, balance stockée accessible via GET
  - Régression : endpoints existants e2e verts
- [ ] **Swagger** : endpoint documenté (200 dry-run / 201 persist / 400 validation, messages génériques).
- [ ] **CI vert** : lint, build, test(+cov) pour `balance-service`.

---

## Technical Notes

### Parser architecture

```typescript
// SageParserService
@Injectable()
export class SageParserService {
  async parseFile(file: Express.Multer.File): Promise<RawBalanceLines[]> {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return this.parseExcel(file.buffer);
    } else if (file.mimetype === 'text/csv' || file.mimetype === 'application/octet-stream') {
      return this.parseCsv(file.buffer);
    } else if (file.mimetype === 'application/pdf') {
      // Fallback: error + hint
      throw new BadRequestException('PDF format requires manual export to Excel. Please export Balance des comptes as .xlsx from Sage 100.');
    }
    throw new BadRequestException(`Unsupported format: ${file.mimetype}`);
  }

  private parseExcel(buffer: Buffer): RawBalanceLines[] {
    const workbook = read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json(sheet, { defval: '' });
    // Extract: Numéro compte | Intitulé | Debits | Credits
    return rows.map(row => ({
      compte: String(row['Numéro compte']).trim(),
      libelle: String(row['Intitulé']).trim(),
      debiteur: parseFloat(row['Soldes cumulés Débit']) || 0,
      crediteur: parseFloat(row['Soldes cumulés Crédit']) || 0
    }));
  }

  private parseCsv(buffer: Buffer): RawBalanceLines[] {
    const text = buffer.toString('utf-8');
    // Parse CSV (piping papa, csv-parse, ou manual)
    // ...
  }
}
```

### Normalizer

```typescript
@Injectable()
export class SageNormalizerService {
  async normalize(rawLines: RawBalanceLines[], exercice: DateRange): Promise<BalanceCanonique> {
    const lignes = rawLines
      .filter(r => r.compte && (r.debiteur || r.crediteur))
      .map(r => ({
        compte: r.compte,
        libelle: r.libelle,
        debiteur: r.debiteur > 0 ? parseFloat(r.debiteur.toFixed(2)) : undefined,
        crediteur: r.crediteur > 0 ? parseFloat(r.crediteur.toFixed(2)) : undefined,
        niveauPreuve: 'fichier' as NiveauPreuveBalance
      }));

    const totalDebiteur = lignes.reduce((sum, l) => sum + (l.debiteur || 0), 0);
    const totalCrediteur = lignes.reduce((sum, l) => sum + (l.crediteur || 0), 0);
    const ecart = Math.abs(totalDebiteur - totalCrediteur);
    const estEquilibre = ecart < 1; // tolérance XOF

    const checksum = this.calculateChecksum(lignes);

    return {
      orgId: this.tenantContext.orgId,
      exercice,
      source: 'sage' as SourceBalance,
      referentiel: 'SN' as ReferentielBalance,
      version: 1,
      horodatage: new Date(),
      auteur: { userId: this.user.id, orgId: this.tenantContext.orgId, role: this.user.role },
      lignes,
      sommaire: { totalDebiteur, totalCrediteur, estEquilibre, ecartEquilibre: estEquilibre ? 0 : ecart },
      statutPreuve: 'justifiée' as StatutPreuveBalance,
      checksum
    };
  }

  private calculateChecksum(lignes): string {
    const sorted = lignes.sort((a, b) => a.compte.localeCompare(b.compte));
    const json = JSON.stringify(sorted);
    return createHash('sha256').update(json).digest('hex');
  }
}
```

### DB — seul le stockage diffère de STORY-101

Pas de nouveau schéma ; la balance normalisée est stockée directement dans la collection `balances` (via STORY-101 BalanceRepository).

---

## Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| Format Sage varie (versions anciennes, exports alternatifs) | Commencer par le format standard « Balance des comptes » ; future story pour variantes |
| PDF OCR fallible | Fallback : message d'erreur clair + hint Excel/CSV ; OCR intégré seulement si fournisseur fiable confirmé |
| Montants corrompus (virgules vs points décimaux) | Parser robust : detect separator (`,` FR vs `.`), parse via parseFloat + format XOF strict |
| Fichier très volumineux (timeout) | Limite taille upload (ex. 50 MB) ; fail fast si parsing échoue (pas de time-limit blocker) |

---

## Definition of Done

- [ ] Parser Sage (Excel/CSV) implémenté + testé
- [ ] Normalizer → contrat canonique implémenté + testé
- [ ] Endpoint `POST /api/v1/balance/import/sage` accept/dry-run/persist
- [ ] Dry-run ne persiste rien ; aperçu + warnings retournés
- [ ] Persist sauvegarde `BalanceCanonique` via STORY-101 BalanceRepository
- [ ] Tests : parsage, normalisation, dry-run/persist, équilibre
- [ ] Swagger documented
- [ ] CI vert (lint, build, test)
- [ ] e2e docker : upload real Sage file → persist → GET retourne balance

---

**Status:** ready-for-dev  
**Created:** 2026-07-12  
**Dependencies:** STORY-076 (scaffold), STORY-101 (BalanceRepository persist), STORY-088 (profil d'import mémorisé, future)  
**Prochaine étape:** STORY-087 (reprise à-nouveaux), STORY-089+ (rapprochement)  
**Reference:** `prd-atelier-balance-2026-07-12.md` § AB-04 (import & migration Sage)
