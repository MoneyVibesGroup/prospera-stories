# STORY-092 : Liquidation de l'impôt — `IS = max(MFP, IS)` + 4 acomptes + crédits d'impôt (paquet Togo)

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A19 · `rapport-bilan-logique-metier-2026-07-12.md` §15 (CGI : **IS 27 %** art. 113 · **MFP 1 % du CA HT** art. 120 · **4 acomptes** art. 114) · `referentiels/paquet-fiscal-togo-2026.json` · GUIDEF section « Liquidation IS » (12 postes)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 18 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A19 (liquidation de l'impôt — régime réel)

> **La règle que tout le monde oublie, et qui coûte cher : l'impôt n'est pas 27 % du bénéfice.**
>
> **`Impôt dû = max( MFP ; IS de droit commun )`**
> — avec **IS = 27 % × résultat fiscal** et **MFP = 1 % du chiffre d'affaires HT** (*Minimum Forfaitaire de Perception*).
>
> **Conséquence directe :** une entreprise **déficitaire** paie quand même la MFP. Un moteur naïf qui conclut « résultat négatif ⇒ impôt = 0 » produit une liasse **fausse** et un redressement garanti. Cette story implémente la liquidation complète : plancher MFP, **4 acomptes**, crédits d'impôt, et **solde à payer** — le tout **paramétré par le paquet fiscal**, jamais en dur.

---

## User Story

En tant que **cabinet comptable**,
je veux que le système **liquide l'impôt** en appliquant le **plancher MFP**, en déduisant les **acomptes déjà versés** et les **crédits d'impôt**,
afin de connaître le **solde exact à payer** (ou le crédit à reporter) et de remplir la section « Liquidation » de la DSF sans erreur.

---

## Description

### Contexte

La liquidation, telle que la GUIDEF la structure (12 postes), enchaîne :

```
Résultat fiscal (STORY-091) ..................... RF
IS de droit commun = taux IS × RF (si RF > 0) ... IS      [Togo 2026 : 27 %]
MFP = taux MFP × CA HT .......................... MFP     [Togo 2026 : 1 %]

IMPÔT DÛ = max( IS ; MFP )   ← ⚠️ LE PLANCHER : dû même si RF ≤ 0

− Acomptes versés (4 échéances) ................. − A
− Crédits d'impôt (retenues à la source, etc.) .. − C

= SOLDE À PAYER  (si > 0)
= CRÉDIT À REPORTER / À RESTITUER  (si < 0)
```

Les **acomptes** (Togo : **4**, aux échéances du CGI art. 114, chacun ≈ **1/4 des cotisations de l'exercice précédent**) sont **payés en cours d'année** ; à la clôture, on **régularise**.

> **Tout est dans le paquet fiscal.** Taux IS, taux MFP, nombre et dates d'acomptes, mode de calcul de l'acompte, types de crédits d'impôt : **`TG@2026`** (STORY-078). Un changement de loi = un nouveau paquet, **zéro ligne de code** (NFR-A06). Et un exercice clos garde **son** paquet.

### Périmètre

**Inclus :**

- **`LiquidationService.liquider(orgId, exercice)`** :
  - **IS de droit commun** = `tauxIS × résultatFiscal` (STORY-091), **plancher à 0** si le résultat fiscal est **négatif** (pas d'IS négatif).
  - **MFP** = `tauxMFP × CA HT` — le **CA HT** est celui de l'exercice (produits classe 7 **hors taxes**, cohérent avec STORY-082/085).
  - **Impôt dû = `max(IS ; MFP)`** — ⚠️ **la règle centrale**, testée explicitement dans les deux sens.
  - **`baseRetenue`** exposée : `'IS'` ou `'MFP'` → le comptable **voit** lequel s'applique (information essentielle pour le conseil, STORY-096).
- **Acomptes** :
  - `POST /api/v1/fiscal/acomptes` : enregistrer un acompte versé `{ echeance, montant, datePaiement, pieceRef? }`.
  - **Calendrier lu du paquet** (Togo : 4 échéances) ; le **montant théorique** de chaque acompte est **proposé** (ex. 1/4 des cotisations N-1) et **modifiable** (le versement réel prime).
  - `GET /api/v1/fiscal/acomptes?exercice=` → échéances, **théorique vs versé**, **retards signalés** (une échéance dépassée non payée → avertissement).
- **Crédits d'impôt** :
  - `POST /api/v1/fiscal/credits` : `{ type, montant, justification, pieceRef? }` — types **lus du paquet** (retenues à la source RSL/RSH, crédits d'investissement…) ; **type inconnu → 400** ; **justification obligatoire**.
- **Solde** :
  - `Solde = Impôt dû − Σ acomptes − Σ crédits`.
  - **Solde > 0** → **à payer** ; **Solde < 0** → **crédit** (à reporter ou restituer — le **traitement** est indiqué par le paquet, pas deviné).
- **`GET /api/v1/fiscal/liquidation?exercice=`** → le **tableau des 12 postes** de la section « Liquidation » de la DSF, chaque poste **traçable** (formule, taux appliqué, **version du paquet**).
- **Cas limites explicitement traités et testés** :
  - **Résultat fiscal négatif** → IS = 0, **MFP due** → `baseRetenue: 'MFP'` (le cas qui piège les moteurs naïfs).
  - **Résultat fiscal positif mais faible** → IS < MFP → **MFP retenue**.
  - **CA nul** (société sans activité) → MFP = 0 et IS = 0 → impôt **0** (mais le **minimum de perception forfaitaire** éventuel du paquet, s'il existe, s'applique — **lu du paquet**, jamais supposé).
  - **Acomptes > impôt dû** → **crédit** (pas un solde négatif « à payer »).
- **Traçabilité (NFR-A07)** : chaque montant liquidé conserve la **formule**, le **taux**, la **version du paquet fiscal** utilisée → on peut **prouver** en contrôle pourquoi l'impôt vaut ce montant.
- **Tests** : `IS > MFP` → IS retenu ; **`MFP > IS` → MFP retenue** ; **résultat négatif → IS = 0 mais MFP due** *(test central)* ; CA nul ; acomptes déduits ; crédits déduits (type inconnu → 400, sans justification → 400) ; **acomptes > impôt → crédit** ; retard d'acompte signalé ; **taux lus du paquet** (aucun `0.27` / `0.01` en dur) ; immutabilité après validation (409) ; **exercice clos garde son paquet** (une réforme 2027 ne change pas la liquidation 2026).

**Hors périmètre :**

- **Résultat fiscal** → **STORY-091** (entrée de cette story).
- **TVA & autres taxes** → **STORY-093**.
- **Écriture de la provision d'IS dans la balance** (comptes `44x`/`89x`) → **STORY-094**.
- **Régime synthétique / TPU** (pas d'IS/MFP) → **STORY-095**.
- **Simulation d'optimisation** (« et si… ») → **STORY-096**, qui **rejouera** cette liquidation sur des scénarios — en tenant compte du **plancher MFP** (optimiser l'IS sous la MFP ne sert à rien : **information capitale du conseil**).
- **Télédéclaration / paiement** → **Module 3** (fiscal-service, re-scopé) et **paiement-service**.
- **Rendu de la liasse** → `bilan-service` EPIC-011.

### Flux

1. Le **résultat fiscal 2026** est calculé (STORY-091) : **5 195 000 XOF**.
2. Le **CA HT** de l'exercice (classe 7) : **48 000 000 XOF**.
3. `GET /api/v1/fiscal/liquidation?exercice=2026` :
   - **IS** = 27 % × 5 195 000 = **1 402 650**
   - **MFP** = 1 % × 48 000 000 = **480 000**
   - **Impôt dû = max(1 402 650 ; 480 000) = 1 402 650** → `baseRetenue: 'IS'`
4. **Acomptes versés** (4 échéances, paquet `TG@2026`) : 4 × 300 000 = **1 200 000**.
5. **Crédits d'impôt** (retenues à la source justifiées) : **50 000**.
6. **Solde = 1 402 650 − 1 200 000 − 50 000 = 152 650 à payer.**
7. **Variante déficitaire** (le cas qui piège) : résultat fiscal **−800 000** → **IS = 0**, mais **MFP = 480 000** → **Impôt dû = 480 000** (`baseRetenue: 'MFP'`). Après acomptes (1 200 000) → **crédit de 720 000** à reporter. *L'entreprise déficitaire paie la MFP — et a trop versé d'acomptes.*
8. **STORY-094** écrit la **provision d'IS** dans la balance (comptes `44x`/`89x`) → « les impôts font partie de la balance ».

---

## Acceptance Criteria

- [ ] **⚠️ `Impôt dû = max(IS ; MFP)`** implémenté et testé **dans les deux sens** (IS > MFP → IS ; MFP > IS → MFP).
- [ ] **⚠️ Résultat fiscal négatif → IS = 0 mais MFP DUE** *(test central — le piège des moteurs naïfs)* ; `baseRetenue: 'MFP'`.
- [ ] **`baseRetenue`** (`'IS'` | `'MFP'`) **exposée** — le comptable voit laquelle s'applique (information clé pour le conseil, STORY-096).
- [ ] **IS = tauxIS × résultat fiscal** (plancher 0) ; **MFP = tauxMFP × CA HT** — **taux lus du paquet fiscal** (`TG@2026` : **27 %** / **1 %**), **aucun en dur** (NFR-A06).
- [ ] **Acomptes** : calendrier **lu du paquet** (Togo : **4** échéances) ; montant théorique **proposé** et **modifiable** ; **retard d'échéance signalé** ; `Σ acomptes` déduite.
- [ ] **Crédits d'impôt** : types **lus du paquet** (**type inconnu → 400**) ; **justification obligatoire** (**400** sinon) ; `Σ crédits` déduite.
- [ ] **Solde** = `Impôt dû − Σ acomptes − Σ crédits` : **> 0 → à payer** ; **< 0 → crédit** (à reporter/restituer selon le paquet — **jamais deviné**).
- [ ] **Acomptes > impôt dû → CRÉDIT** (et non un « solde négatif à payer ») — test dédié.
- [ ] **CA nul** → IS = 0, MFP = 0 (sauf minimum forfaitaire éventuel **du paquet**).
- [ ] **Tableau des 12 postes** de la section « Liquidation » de la DSF, chaque poste **traçable** (formule, taux, **version du paquet**).
- [ ] **Immutabilité** : après validation de la liasse → **409** sur modification (acompte, crédit, liquidation).
- [ ] **Exercice clos garde son paquet** : une réforme `TG@2027` **ne change pas** la liquidation 2026 (test dédié).
- [ ] **Tests** : max(IS,MFP) ×2 sens, **déficit → MFP due**, CA nul, acomptes, crédits (400 ×2), acomptes > impôt → crédit, retard signalé, taux du paquet, immutabilité, immutabilité du paquet par exercice. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Le cœur — la règle du plancher

```typescript
export interface Liquidation {
  exercice: DateRange;
  resultatFiscal: number;          // STORY-091
  caHt: number;                    // classe 7, hors taxes

  tauxIs: number;                  // du paquet — TG@2026 : 0.27
  tauxMfp: number;                 // du paquet — TG@2026 : 0.01

  isDroitCommun: number;           // max(0, tauxIs × resultatFiscal)
  mfp: number;                     // tauxMfp × caHt

  impotDu: number;                 // max(isDroitCommun, mfp)   ⚠️ LE PLANCHER
  baseRetenue: 'IS' | 'MFP';       // exposé — essentiel pour le conseil (STORY-096)

  acomptes: Array<{ echeance: Date; theorique: number; verse: number; enRetard: boolean }>;
  totalAcomptes: number;
  credits: Array<{ type: string; montant: number; justification: string }>;
  totalCredits: number;

  solde: number;                   // impotDu − acomptes − credits
  sens: 'A_PAYER' | 'CREDIT';

  paquetVersion: string;           // traçabilité : quel paquet a servi (NFR-A07)
}
```

```typescript
async liquider(orgId: string, exercice: DateRange): Promise<Liquidation> {
  const paquet = await this.paquetFiscal.get(pays, exercice.fin.getFullYear());   // TG@2026 — immuable
  const rf     = (await this.resultatFiscal.calculer(orgId, exercice)).resultatFiscal;
  const caHt   = await this.caHtService.calculer(orgId, exercice);                // classe 7 HT

  // IS : jamais négatif
  const isDroitCommun = Math.max(0, Math.round(paquet.taux.is * rf));

  // MFP : due MÊME si l'entreprise est déficitaire
  const mfp = Math.round(paquet.taux.mfp * caHt);

  // ⚠️ LA RÈGLE : le minimum forfaitaire est un PLANCHER, pas une alternative
  const impotDu     = Math.max(isDroitCommun, mfp);
  const baseRetenue = impotDu === mfp && mfp > isDroitCommun ? 'MFP' : 'IS';

  const totalAcomptes = await this.acomptes.total(orgId, exercice);
  const totalCredits  = await this.credits.total(orgId, exercice);

  const solde = impotDu - totalAcomptes - totalCredits;

  return {
    /* … */,
    impotDu, baseRetenue,
    solde: Math.abs(solde),
    sens: solde >= 0 ? 'A_PAYER' : 'CREDIT',      // acomptes > impôt → CRÉDIT, pas un négatif « à payer »
    paquetVersion: paquet.version,                 // on peut PROUVER le calcul
  };
}
```

### Le test qui doit exister (et qui n'existe jamais dans les moteurs naïfs)

```typescript
it('entreprise DÉFICITAIRE : IS = 0 mais MFP DUE', async () => {
  const liq = await service.liquider(orgId, exercice2026);   // résultat fiscal = −800 000, CA HT = 48 000 000

  expect(liq.isDroitCommun).toBe(0);          // pas d'IS sur un déficit
  expect(liq.mfp).toBe(480_000);              // 1 % du CA — DUE quand même
  expect(liq.impotDu).toBe(480_000);          // ⚠️ PAS ZÉRO
  expect(liq.baseRetenue).toBe('MFP');
});
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **« Déficit ⇒ impôt = 0 »** → liasse fausse, redressement | **`max(IS ; MFP)`** implémenté ; **test central** sur l'entreprise déficitaire ; `baseRetenue` exposée |
| Taux IS/MFP en dur → faux après réforme | Taux **lus du paquet** `(pays, année)` — test anti-hardcode |
| Une réforme réécrit un exercice clos | Le paquet est **immuable par exercice** (`TG@2026` reste `TG@2026`) — test dédié |
| Acomptes > impôt traité comme un solde négatif « à payer » | `sens: 'CREDIT'` explicite |
| Crédit d'impôt non justifié → rejeté en contrôle | `justification` **obligatoire** + type **validé au paquet** |
| Retard d'acompte non vu → pénalités | Échéances **du paquet** ; **retard signalé** |
| Impossible d'expliquer le montant en contrôle | Chaque poste conserve **formule, taux, version du paquet** (NFR-A07) |
| Optimiser l'IS sans voir la MFP | `baseRetenue` exposée → **STORY-096** saura qu'optimiser sous le plancher MFP est **inutile** |

---

## Definition of Done

- [ ] `LiquidationService.liquider()` : **`max(IS ; MFP)`**, acomptes, crédits, solde
- [ ] **Test central** : entreprise **déficitaire** → **IS = 0, MFP due**, `baseRetenue: 'MFP'`
- [ ] Taux, calendrier d'acomptes et types de crédits **lus du paquet** (aucun en dur)
- [ ] Acomptes (théorique proposé, versé réel, retard signalé) ; crédits (type validé, justification obligatoire)
- [ ] Solde `A_PAYER` / `CREDIT` (acomptes > impôt → crédit)
- [ ] **Tableau des 12 postes** « Liquidation » de la DSF, traçable (formule, taux, version du paquet)
- [ ] Immutabilité après validation (409) ; paquet **immuable par exercice**
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-091 (résultat fiscal) vert

---

**Status:** ready-for-dev
**Dependencies:** **STORY-091** (résultat fiscal = base imposable), **STORY-078** (paquet : taux IS/MFP, calendrier d'acomptes, types de crédits), STORY-082/085 (CA HT), STORY-080 (régime `REEL` — sinon **STORY-095**/TPU)
**Alimente** **STORY-094** (provision d'IS écrite dans la balance), **STORY-096** (simulation — **le plancher MFP change tout le conseil**), `bilan-service` EPIC-011 (section « Liquidation » de la DSF)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A19 · CGI Togo 2026 (IS art. 113 · MFP art. 120 · acomptes art. 114) · GUIDEF « Liquidation IS » (12 postes)
