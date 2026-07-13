# STORY-082 : Cahier de recettes (saisie + rangement par mois + rattachement aux produits, classe 7)

**Epic :** EPIC-020 — Adaptateur #3 : construction de balance, chemin A (cahiers + OCR)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A08 · `sprint-plan-atelier-balance-2026-07-12.md` § D13 (adaptateur #3) · `rapport-bilan-logique-metier-2026-07-12.md` §3 (chemin A) · `referentiels/` (plan de comptes SYSCOHADA)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 16 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A08 (cahier de recettes)

> **Le premier des deux cahiers — c'est ici que la PME informelle entre dans la comptabilité.** L'adaptateur #3 du hub (D13) ne part **d'aucun logiciel** : il part de **ce que la PME a réellement** — un cahier de recettes. Cette story permet de saisir les recettes (le **chiffre d'affaires**), **rangées par mois**, et de les **rattacher aux comptes de produits (classe 7)**. Avec le cahier de dépenses (STORY-083), elles alimentent la **balance canonique** (STORY-101) — sans Sage, sans écriture en partie double à saisir à la main. C'est le **cœur de la promesse « une nouvelle structure adopte Prospera directement »** (D9).

---

## User Story

En tant que **cabinet comptable** traitant une **PME sans logiciel comptable**,
je veux **saisir les recettes du client, mois par mois**, et les **rattacher aux comptes de produits**,
afin de **reconstituer le chiffre d'affaires** et d'alimenter la balance sans exiger du client une comptabilité en partie double.

---

## Description

### Contexte

Le **chemin A** (D6) suppose que les **deux cahiers existent** (recettes **et** dépenses). C'est le cas nominal, et le seul retenu en **v1** (les chemins B et C — reconstruction par l'inventaire ou par les charges fixes — sont **hors v1**).

Le cahier de recettes, c'est **le chiffre d'affaires**. Sa fiabilité conditionne tout : le résultat, l'IS, la **MFP (1 % du CA HT)** — donc le **plancher d'impôt** (STORY-092). Une recette oubliée, c'est un redressement ; une recette inventée, c'est une fraude. D'où deux exigences fortes :

1. **Rangement par mois** — la DSF et la TVA sont **périodiques** ; un montant sans mois est inexploitable.
2. **Niveau de preuve par ligne** — une recette adossée à un **relevé bancaire** ne vaut pas une recette **estimée** (hiérarchie de preuve : bancaire > facture normalisée > reçu/OCR > estimation). Ce niveau remonte **jusqu'au `statutPreuve` de la balance** (FR-A27, STORY-101).

> **Règle métier reprise du cadrage** : « tout dépôt bancaire est une entrée » — le rapprochement bancaire (STORY-090) confrontera ce cahier aux relevés pour **détecter les recettes non déclarées**.

### Périmètre

**Inclus :**

- **Modèle `LigneRecette`** (collection `lignes_recettes`, keyée `orgId` + `exercice`) :
  - `date` (obligatoire → détermine le **mois**), `libelle`, `montant` (XOF), `tiers?` (client), `moyenPaiement?` (espèces / banque / **mobile money**), `pieceRef?` (n° facture/reçu).
  - `compteProduit` — compte SYSCOHADA de **classe 7** (ex. `701` ventes de marchandises, `706` prestations) ; proposé automatiquement, **modifiable**.
  - `tva?` — `{ assujetti: bool, taux, montantHT, montantTVA }` (le taux vient du **paquet fiscal**, STORY-078 — jamais en dur).
  - `niveauPreuve` : `fichier` | `ocr` | `saisie` | `estimé` (alimente FR-A27).
  - `origine` : `MANUELLE` | `OCR` (STORY-084) | `IMPORT`.
- **CRUD & saisie de masse** (`@RequiresBalanceAccess`, isolation `orgId`) :
  - `POST /api/v1/cahiers/recettes` (une ligne) → **201**.
  - `POST /api/v1/cahiers/recettes/lot` (saisie multi-lignes, ex. tout un mois) → **201** + rapport `{ crees, rejetes: [{ ligne, motif }] }` (**rejet partiel possible, jamais silencieux**).
  - `GET /api/v1/cahiers/recettes?mois=2026-03` → lignes du mois + **totaux**.
  - `PATCH` / `DELETE` d'une ligne — **tant que la balance n'est pas validée** (après validation : **immuable**, NFR-A07 / STORY-101).
- **Rangement par mois** : `GET /api/v1/cahiers/recettes/synthese?exercice=2026` → `{ parMois: [{ mois, totalHT, totalTVA, totalTTC, nbLignes }], totalExercice }` — c'est **la vue de travail du comptable**.
- **Rattachement classe 7 (proposition)** :
  - Le compte est **proposé** selon le libellé/tiers/activité (règles simples + `codeNaema` du profil, STORY-079) et **validé par le plan de comptes** (`ReferentielProvider`, STORY-078).
  - **Un compte hors classe 7 est refusé** (une recette n'est pas une charge) → **400**.
  - La proposition est **toujours modifiable** ; la **règle de rattachement fine** (moteur générique transaction → compte) est **STORY-085**.
- **TVA par ligne** : si le régime est assujetti (profil/régime — STORY-080), le taux vient du **paquet fiscal** ; ventilation HT/TVA calculée et **modifiable** (une recette peut être exonérée).
- **Alimentation de la balance** : un service `CahiersVersBalance` **agrège** les lignes (recettes **et** dépenses) en **soldes par compte** → `LigneBalance[]` du contrat canonique (STORY-101). *(L'agrégation complète et l'équilibre relèvent de **STORY-085** ; ici on expose les totaux par compte de classe 7.)*
- **Tests** : CRUD + lot avec rejet partiel ; refus d'un compte hors classe 7 ; synthèse mensuelle exacte ; TVA (taux du paquet, exonération) ; isolation `orgId` ; **édition refusée après validation de la balance** ; niveau de preuve propagé.

**Hors périmètre :**

- **Cahier de dépenses** → **STORY-083** (même sprint, symétrique).
- **OCR des captures/factures de recettes** → **STORY-084** (alimente `origine: OCR`).
- **Moteur de rattachement transaction → compte** (règles génériques, ventilation) → **STORY-085**.
- **Rapprochement bancaire** (confronter les recettes aux relevés) → **STORY-089/090**.
- **Chemins B et C** (reconstruction du CA par l'inventaire / par les charges) → **hors v1** (D6).
- **Calcul de la TVA due** (collectée − déductible) → **STORY-093** (S18).

### Flux

1. Le cabinet ouvre le dossier d'une PME (profil + régime déjà posés — STORY-079/080).
2. Il saisit le **cahier de recettes de mars 2026** : `POST /cahiers/recettes/lot` avec 34 lignes (ventes du mois).
3. Pour chaque ligne, le système **propose** un compte de classe 7 (ex. `701` — ventes de marchandises), **validé** contre le plan de comptes (STORY-078). Le comptable **corrige** 3 lignes (prestations → `706`).
4. La **TVA** est ventilée au taux du paquet **`TG@2026`** (**18 %**) ; deux lignes sont marquées **exonérées** → ventilation ajustée.
5. Chaque ligne porte son **niveau de preuve** (ici `saisie` — elles seront **confirmées** par le rapprochement bancaire, STORY-090, qui pourra les faire passer à `fichier`).
6. `GET /cahiers/recettes/synthese?exercice=2026` → totaux **par mois** et **CA de l'exercice** (le CA qui servira au régime, STORY-080, et à la **MFP**, STORY-092).
7. Avec le cahier de dépenses (STORY-083), l'agrégation (STORY-085) produit la **balance canonique** (STORY-101) → contrôles (STORY-098) → handoff `bilan-service` (STORY-099).

---

## Acceptance Criteria

- [ ] **Modèle `LigneRecette`** persisté (keyé `orgId` + `exercice`), avec `date`, `libelle`, `montant`, `compteProduit`, `tva?`, `niveauPreuve`, `origine`.
- [ ] **CRUD** (`@RequiresBalanceAccess`) : création unitaire **201**, **saisie en lot** **201** avec **rapport de rejet partiel** (`{ crees, rejetes: [{ligne, motif}] }` — jamais de rejet silencieux).
- [ ] **Isolation multi-tenant** : `orgId` **issu du JWT** ; une org ne voit jamais les recettes d'une autre (test e2e).
- [ ] **Rattachement classe 7** : compte **proposé** puis **validé contre le plan de comptes** (STORY-078) ; un compte **hors classe 7** est **refusé (400)** ; la proposition reste **modifiable**.
- [ ] **Rangement par mois** : `GET /synthese` retourne les totaux **par mois** (HT, TVA, TTC, nb lignes) + **total exercice**, exacts au XOF près.
- [ ] **TVA** : taux lu du **paquet fiscal** (STORY-078) — **jamais en dur** ; ventilation HT/TVA calculée et **modifiable** ; **exonération** possible par ligne.
- [ ] **Niveau de preuve** par ligne (`fichier`/`ocr`/`saisie`/`estimé`) — propagé vers le `statutPreuve` de la balance (FR-A27).
- [ ] **Immutabilité après validation** : toute `PATCH`/`DELETE` d'une ligne dont la balance de l'exercice est **VALIDÉE** → **409** (NFR-A07, cohérent STORY-101).
- [ ] **Totaux par compte de classe 7** exposés pour l'agrégation en balance (consommés par STORY-085).
- [ ] **Tests** : CRUD, lot + rejet partiel, refus hors classe 7, synthèse mensuelle, TVA (paquet + exonération), isolation, édition post-validation refusée. **Coverage ≥ 90 %.**
- [ ] **Swagger** (201/400/403/409) + **CI verte**.

---

## Technical Notes

### Modèle

```typescript
export interface LigneRecette {
  orgId: string;                 // du JWT — jamais du client
  exercice: { debut: Date; fin: Date };

  date: Date;                    // → détermine le mois (clé de regroupement)
  libelle: string;
  montant: number;               // XOF (TTC si assujetti)
  tiers?: string;
  moyenPaiement?: 'ESPECES' | 'BANQUE' | 'MOBILE_MONEY';
  pieceRef?: string;

  compteProduit: string;         // classe 7 obligatoire (validé via ReferentielProvider)

  tva?: {
    assujetti: boolean;
    taux: number;                // du paquet fiscal (TG@2026 → 0.18) — JAMAIS en dur
    montantHT: number;
    montantTVA: number;
    exonere?: boolean;
  };

  niveauPreuve: 'fichier' | 'ocr' | 'saisie' | 'estimé';  // → FR-A27
  origine: 'MANUELLE' | 'OCR' | 'IMPORT';

  createdAt: Date;
  updatedAt: Date;
}

db.lignes_recettes.createIndex({ orgId: 1, 'exercice.debut': 1, date: 1 });
```

### Garde-fou : une recette est un produit

```typescript
async valider(ligne: LigneRecette, ref: ArtefactRef) {
  const classe = Number(ligne.compteProduit[0]);
  if (classe !== 7) {
    throw new BadRequestException('COMPTE_HORS_CLASSE_7'); // une recette n'est pas une charge
  }
  if (!(await this.referentiel.isCompteValide(ligne.compteProduit, ref))) {
    throw new BadRequestException('COMPTE_INCONNU');
  }
}
```

### Immutabilité après validation (cohérent STORY-101)

```typescript
async modifier(orgId: string, ligneId: string, patch: Partial<LigneRecette>) {
  const balance = await this.balanceRepo.findLatest(orgId, exercice, 'ocr');
  if (balance?.etat === 'VALIDÉE') {
    throw new ConflictException('BALANCE_VALIDEE_IMMUABLE'); // NFR-A07
  }
  // …
}
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Recette oubliée** → CA minoré → redressement | Le **rapprochement bancaire** (STORY-090) confronte les recettes aux relevés (« tout dépôt = une entrée ») et signale les écarts |
| Recette saisie sans preuve → balance fragile | `niveauPreuve` obligatoire → remonte au **`statutPreuve`** de la balance (FR-A27) ; une balance majoritairement estimée est **signalée** |
| Taux de TVA en dur | Taux **lu du paquet fiscal** (STORY-078) — test anti-hardcode |
| Mauvais compte (charge au lieu de produit) | **Refus** de tout compte hors classe 7 + validation contre le plan de comptes |
| Saisie en lot : une ligne fausse casse tout le lot | **Rejet partiel** avec rapport détaillé — les lignes valides passent, les autres sont listées avec motif |
| Modification après clôture | **409** si la balance de l'exercice est VALIDÉE (immutabilité) |

---

## Definition of Done

- [ ] Modèle `LigneRecette` + index (orgId, exercice, date)
- [ ] CRUD + saisie en lot avec **rapport de rejet partiel**
- [ ] Rattachement classe 7 proposé, validé (plan de comptes), modifiable ; hors classe 7 → 400
- [ ] Synthèse **par mois** + total exercice (exacts au XOF)
- [ ] TVA au taux du **paquet fiscal** + exonération par ligne
- [ ] `niveauPreuve` propagé vers la balance (FR-A27)
- [ ] Édition refusée (409) si balance VALIDÉE
- [ ] Isolation multi-tenant prouvée (e2e)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : CORE S10 + S15 verts

---

**Status:** ready-for-dev
**Dependencies:** STORY-078 (plan de comptes + taux TVA), STORY-079/080 (profil, régime, assujettissement), STORY-101 (contrat balance, immutabilité) · **alimenté par** STORY-084 (OCR) · **agrégé par** STORY-085 · **confronté par** STORY-090 (rapprochement)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A08 · D6 (chemin A) · D9 (adoption directe par une nouvelle structure)
