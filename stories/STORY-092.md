# STORY-092 : Liquidation de l'impôt — `IS = max(MFP, IS)` + 4 acomptes + crédits d'impôt (paquet Togo)

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A19 · `rapport-bilan-logique-metier-2026-07-12.md` §15 (CGI : **IS 27 %** art. 113 · **MFP 1 % du CA HT** art. 120 · **4 acomptes** art. 114) · `referentiels/paquet-fiscal-togo-2026.json` · GUIDEF section « Liquidation IS » (12 postes)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
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

- [x] **⚠️ `Impôt dû = max(IS ; MFP)`** implémenté et testé **dans les deux sens** (IS > MFP → IS ; MFP > IS → MFP).
- [x] **⚠️ Résultat fiscal négatif → IS = 0 mais MFP DUE** *(test central — le piège des moteurs naïfs)* ; `baseRetenue: 'MFP'`.
- [x] **`baseRetenue`** (`'IS'` | `'MFP'`) **exposée** — le comptable voit laquelle s'applique (information clé pour le conseil, STORY-096).
- [x] **IS = tauxIS × résultat fiscal** (plancher 0) ; **MFP = tauxMFP × CA HT** — **taux lus du paquet fiscal** (`TG@2026` : **27 %** / **1 %**), **aucun en dur** (NFR-A06).
- [x] **Acomptes** : calendrier **lu du paquet** (Togo : **4** échéances) ; montant théorique **proposé** et **modifiable** ; **retard d'échéance signalé** ; `Σ acomptes` déduite.
- [x] **Crédits d'impôt** : types **lus du paquet** (**type inconnu → 400**) ; **justification obligatoire** (**400** sinon) ; `Σ crédits` déduite.
- [x] **Solde** = `Impôt dû − Σ acomptes − Σ crédits` : **> 0 → à payer** ; **< 0 → crédit** (à reporter/restituer selon le paquet — **jamais deviné**).
- [x] **Acomptes > impôt dû → CRÉDIT** (et non un « solde négatif à payer ») — test dédié.
- [x] **CA nul** → IS = 0, MFP = 0 (sauf minimum forfaitaire éventuel **du paquet**).
- [x] **Tableau des 12 postes** de la section « Liquidation » de la DSF, chaque poste **traçable** (formule, taux, **version du paquet**).
- [x] **Immutabilité** : après validation de la liasse → **409** sur modification (acompte, crédit, liquidation).
- [x] **Exercice clos garde son paquet** : une réforme `TG@2027` **ne change pas** la liquidation 2026 (test dédié).
- [x] **Tests** : max(IS,MFP) ×2 sens, **déficit → MFP due**, CA nul, acomptes, crédits (400 ×2), acomptes > impôt → crédit, retard signalé, taux du paquet, immutabilité, immutabilité du paquet par exercice. **Coverage ≥ 90 %.**
- [x] **Swagger** + **CI verte**.

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

## Décisions de cadrage (D-092-*)

Prises avant d'écrire une ligne, après lecture du paquet `togo@2026`, du référentiel
`syscohada-revise@2.1` et du moteur de résultat fiscal (STORY-091).

| # | Décision | Pourquoi |
|---|---|---|
| **D-092-1** | La liquidation vit dans `FiscalModule`, en **service séparé** (`LiquidationService`) + moteur **pur** (`liquidation.regles.ts`), contrôleur dédié `LiquidationController` (chemins `fiscal/acomptes`, `fiscal/credits`, `fiscal/liquidation` — aucune collision avec les chemins de STORY-091). | Même agrégat fiscal, mais un moteur pur séparé reste **mutable-testable** et **rejouable** par STORY-096. |
| **D-092-2** | `impotDu = max(IS ; MFP)` ; `baseRetenue = 'MFP'` **seulement si `mfp > is`** (égalité ⇒ `'IS'`). | Le plancher est une **borne inférieure**, pas une alternative. À égalité, l'impôt est bien celui de droit commun. |
| **D-092-3** | Taux **lus du paquet** (`is.taux`, `minimumForfaitairePerception.taux`). Taux absent ou aberrant ⇒ **409 `TAUX_NON_PACKAGE`**, jamais `0`. | Un taux manquant traité comme `0` **sous-impose en silence** — le redressement que la story prévient. Sur-imposer se corrige, sous-imposer se paie. |
| **D-092-4** | **CA HT sourcé du référentiel**, jamais en dur : poste dont le libellé normalisé commence par « chiffre d'affaires » **et** qui possède une entrée de table de passage (⇒ `XB` = `TA+TB+TC+TD` = comptes `701`…`707`), opérandes dépliées **récursivement** avec leur signe, puis Σ des soldes **nets créditeurs** de la balance. Non résoluble (ex. `sfd-bceao@2.0`) ⇒ **409 `CA_NON_SOURCE`**. | Même discipline que D-091-13 (le compte `13` est résolu, pas écrit). Écrire `70` en dur marcherait pour SYSCOHADA et **mentirait** pour un plan bancaire. Le nettage par ligne fait tomber juste les `709` (RRR accordés), débiteurs. |
| **D-092-5** | `ReferentielPackageBalance` gagne `postes` et `tableDePassage`, **optionnels et lus défensivement**. | Ce sont les seules données **sourcées** qui portent le CA et les libellés de la liasse. Leur absence dégrade avec un motif — jamais une supposition. |
| **D-092-6** | La **grille des 12 postes** est publiée par le paquet (`liquidation.etatLiasse` + `liquidation.postes[] = {code, grandeur}`), ses **libellés** viennent du référentiel (état `LIQUIDATION_IS`). Grandeur inconnue du moteur ou non calculée en 092 (`B` marge bloquée, `H` régime dérogatoire, `L` pénalité de retard) ⇒ `nonCalcule: true`, jamais un zéro muet. | Les « 12 postes » ne sont **jamais** écrits en dur (leçon des « 23 postes » de STORY-091). Un nouveau plan de liasse = un nouveau paquet, zéro ligne de code (NFR-A06). |
| **D-092-7** | **Types de crédits d'impôt publiés par le paquet** (`liquidation.creditsImpot.types[]`), transcription **structurée** de `retenuesSource` (RCM, RSL, RSH, non-résidents, régime dérogatoire) déjà présente en prose. Paquet muet ⇒ **fail-closed**, tout crédit refusé. Type inconnu ⇒ **400**. | Exactement D-091-7 : la règle existait en prose, on la transcrit — on ne la parse pas à la regex, on ne l'invente pas dans le code. |
| **D-092-8** | **Acomptes** : calendrier `acomptesProvisionnels.echeances` (`"JJ-MM"`) du paquet. Une échéance **invalide** (`31-06`) est **écartée et signalée**, jamais roulée au mois suivant par `Date`. Théorique = `impôt dû N-1 ÷ nombre` (`Math.floor`) ; **N-1 non liquidable ⇒ `theorique: null` + motif**, jamais `0`. `enRetard` = échéance dépassée **et** aucun versement. | `Date.UTC(2026, 5, 31)` vaut le **1ᵉʳ juillet** sans lever d'erreur : une échéance fantôme décale un retard. `theorique: 0` dirait « rien à verser ». |
| **D-092-9** | La liquidation N-1 utilisée pour le théorique **ne calcule que l'impôt dû** (CA, IS, MFP) — **aucune récursion** sur les acomptes de N-2. | Sinon régression infinie, invisible en unitaire et fatale en production. |
| **D-092-10** | `GET /fiscal/liquidation` **n'écrit rien** (prolonge D-091-9). | STORY-096 la rejouera sur des scénarios. |
| **D-092-11** | **Plusieurs versements par échéance** admis (somme), sans index unique ; correction par suppression. | Un acompte réglé en deux virements est un cas courant ; un index unique obligerait à fusionner deux pièces justificatives en une. |
| **D-092-12** | `echeance` **validée contre le paquet** (400 sinon) ; `montant` positif ; `justification` obligatoire sur un crédit (400 sinon). Écritures **gelées** par exercice clos ou balance validée (409), lecture toujours ouverte. | Un acompte sur une échéance inexistante et un crédit non justifié sont tous deux indéfendables en contrôle. |

**Hors périmètre, tracé comme hook inerte** : les **arrondis légaux** publiés en **prose** par le paquet
(`is.arrondi` « fraction de bénéfice imposable < 1000 FCFA négligée », `acomptesProvisionnels.calcul`
« arrondi au millier de franc inférieur ») ne sont **pas** appliqués en 092 — le cadrage ne les demande pas,
et leur transcription structurée doit tenir compte du fait que le paquet publie des **francs** quand le
moteur travaille en **unités mineures** (× 100). L'exonération de MFP (`exonerations`, prose) et la
**marge à taux bloqué** (poste `B`) sont dans le même cas.

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

- [x] `LiquidationService.liquider()` : **`max(IS ; MFP)`**, acomptes, crédits, solde
- [x] **Test central** : entreprise **déficitaire** → **IS = 0, MFP due**, `baseRetenue: 'MFP'`
- [x] Taux, calendrier d'acomptes et types de crédits **lus du paquet** (aucun en dur)
- [x] Acomptes (théorique proposé, versé réel, retard signalé) ; crédits (type validé, justification obligatoire)
- [x] Solde `A_PAYER` / `CREDIT` (acomptes > impôt → crédit)
- [x] **Tableau des 12 postes** « Liquidation » de la DSF, traçable (formule, taux, version du paquet)
- [x] Immutabilité après validation (409) ; paquet **immuable par exercice**
- [x] Coverage ≥ 90 % ; Swagger ; CI verte
- [x] Non-régression : STORY-091 (résultat fiscal) vert

---

## Progress Tracking

- **2026-08-03 — `in_progress`** : cadrage figé (décisions **D-092-1** à **D-092-12** ci-dessus), branches
  `MNV-092` ouvertes sur `prospera-stories` (base `main`) et `balance-service` (base `dev`).

- **2026-08-03 — développement terminé.** `LiquidationService` + moteur pur `liquidation.regles.ts`,
  contrôleur `LiquidationController`, collections `acomptes_provisionnels` et `credits_impot`,
  `ContexteFiscalService` extrait du moteur de STORY-091 (gel de l'exercice + chargement du paramétrage,
  partagé plutôt que recopié). Paquet `togo@2026` régénéré (rubrique `liquidation` : grille, types de
  crédits, traitement de l'excédent) — **checksum `aa0c378d…`**. `ReferentielPackageBalance` gagne
  `postes` et `tableDePassage`, lus **défensivement**.

- **2026-08-03 — portes de qualité (DoD)** : lint **0 warning** · `nest build` OK ·
  **2 180 tests unitaires** + **460 e2e** verts · couverture **98.87 / 91.12 / 98.08 / 98.97**
  (seuils 65/90/90/90).

- **2026-08-03 — mutation-tests : 17 mutations, 17 rouges.** Un test qu'un code bugué franchit est une
  fausse assurance ; chaque critère protecteur a été cassé volontairement, vérifié rouge, puis restauré :
  plancher MFP supprimé · égalité IS/MFP annoncée « MFP » · IS négatif autorisé · relecture de date
  retirée (`31-06` roulée au 1ᵉʳ juillet) · poste CA résolu sans exiger de table de passage (deux
  homonymes) · premier préfixe au lieu du plus long (double comptage du CA) · versement partiel compté
  comme retard · crédit sans case rangé d'office dans un poste · taux manquant remplacé par `0` ·
  CA non sourçable remplacé par `0` · échéance non validée contre le paquet · type de crédit non validé ·
  gel retiré à l'enregistrement · gel contrôlé sur l'exercice **du client** au lieu du document ·
  404 hors organisation remplacé par une suppression silencieuse · **récursion N−1 rétablie** (la suite
  meurt en OOM) · `acomptes/:id` renommé sur le segment de STORY-091 (collision de routes).

- **2026-08-03 — vérification docker (stack neuve, `down -v`).** `mongo` + `kafka` + `redis` +
  `auth-service` + `balance-service`, organisation créée sur l'IdP, read-models KYC/entitlement semés,
  balance 2026 réelle (CA `701` = 48 000 000, charges `601`, résultat `13`).

  | Contrôle | Résultat mesuré |
  |---|---|
  | CA **sourcé du référentiel réel** | poste `XB` / `COMPTE_RESULTAT` → comptes `701`…`707`, montant `4 800 000 000` (unités mineures) |
  | Taux **du paquet réel** | `tauxIs 0.27`, `tauxMfp 0.01`, checksum `aa0c378d…` publié dans la réponse |
  | Scénario nominal | IS `140 265 000` > MFP `48 000 000` ⇒ impôt dû **`140 265 000`**, `baseRetenue: IS`, solde **`15 265 000` `A_PAYER`** (= 152 650 XOF, exactement le flux de la story) |
  | ⚠️ **Cas déficitaire** (balance v2, résultat `−80 000 000`) | IS **`0`**, MFP **`48 000 000` DUE**, impôt dû **`48 000 000` — pas zéro**, `baseRetenue: MFP`, acomptes `120 000 000` ⇒ **`CREDIT` de `77 000 000`** |
  | Grille des 12 postes | `A`→`L` remplis, **libellés du référentiel** (`Impôt dû (max D: F)`…), `B`/`H`/`L` en `nonCalcule` + `HORS_PERIMETRE_092`, `K` = `G − crédits` |
  | Persistance réelle (`mongosh`) | `acomptes_provisionnels` : **4 documents**, `orgId`/`exercice`/`parUserId`/`pieceRef` renseignés, Σ = `120 000 000` · `credits_impot` : **1 document** justifié · index `(orgId, exercice.debut, exercice.fin)` présents sur les deux |
  | Refus **sans orphelin** | `15-03` ⇒ **400 `ECHEANCE_INCONNUE`** · type inventé ⇒ **400 `TYPE_CREDIT_INCONNU`** · après les deux refus : toujours **4 acomptes / 1 crédit**, aucun document parasite |
  | Invariants en base | aucun acompte sans `orgId`, sans exercice ou de montant ≤ 0 · aucun crédit sans justification · **aucune échéance hors calendrier** · **aucun type hors paquet** |
  | Immutabilité (balance `VALIDÉE`) | `POST /acomptes` **409** · `POST /credits` **409** · `DELETE /acomptes/:id` **409 `BALANCE_VALIDEE_IMMUABLE`** · `GET /liquidation` **200** (lecture ouverte) · documents inchangés |
  | Isolation inter-organisations | l'org B supprimant un acompte de l'org A ⇒ **404 `ACOMPTE_INTROUVABLE`** (jamais 403), document **intact** ; son calendrier voit `totalVerse: 0` |

  ⚠️ Le théorique d'acompte sort à `null` avec `motifTheorique: EXERCICE_PRECEDENT_NON_LIQUIDABLE`
  (aucune balance 2025 dans cette stack) — conforme à **D-092-8** : jamais `0`, qui se lirait
  « rien à verser ».

- **2026-08-03 — revue de code : 5 constats, tous traités** (commit dédié, séparé de la feature).
  **F-092-1 (BLOQUANT)** : un versement dont l'échéance **n'est plus publiée** disparaissait de tous les
  totaux, sans le moindre signal. L'échéance n'est validée qu'**à l'écriture** ; un paquet republié
  (`31-05` → `30-05` — ce que cette story vient elle-même de faire sur `togo@2026`) laissait le versement
  orphelin, et le solde à payer était majoré d'un montant **réellement versé au Trésor**, sans qu'aucun
  champ n'explique l'écart — alors que `creditsHorsGrille` traite exactement ce risque côté crédits.
  ⇒ versements orphelins **comptés et signalés** (`acomptesHorsCalendrier`, `echeancesOrphelines`).
  **F-092-4** : `taux: 1` était lu comme **100 %** ; or le taux MFP **vaut 1 %**, donc `"taux": 1` est une
  écriture plausible pour 1 % — la lire comme 100 % donnait `MFP = chiffre d'affaires`, retenue par
  `max(IS ; MFP)`, soit un impôt égal au CA servi sans refus. Tout taux atteignant 100 % est désormais
  **refusé**. **F-092-5** : `restituable` extrait, typé, publié et lu par personne ⇒ **exposé** et
  documenté comme **hook inerte**. **F-092-2 / F-092-3** : deux commentaires affirmaient ce que le code ne
  fait pas (rabais `709` non rattachés au poste par `syscohada-revise@2.1` ; « chaque occurrence compte »
  contredit par la valorisation, qui ne retient qu'un préfixe par ligne — à dessein, pour ne pas doubler la
  MFP). **5 mutation-tests supplémentaires, 5 rouges**, dont le bug d'origine rejoué.

- **2026-08-03 — revue de sécurité : aucune vulnérabilité** (confiance ≥ 80). Vecteurs vérifiés et écartés :
  isolation multi-tenant (`orgId` du JWT dans **les quatre** méthodes de chaque dépôt, y compris le filtre
  de `deleteOne` — pas de fenêtre entre lecture et suppression) · **404 générique** hors organisation,
  jamais 403 · injection NoSQL (`echeance` ancrée, `type` persisté depuis le **paquet** et non le DTO,
  bornes converties en `Date`, `id` validé) · contournement du gel, y compris la variante « bornes décalées
  d'1 ms » (inerte : toutes les relectures matchent par égalité exacte) · ReDoS · fuite d'information
  (corps d'erreur en liste blanche, ni `orgId` ni `parUserId` exposés) · détournement de l'acompte N−1 ·
  chaîne de gardes et ordre des routes · intégrité du paquet régénéré (sha256 réel = manifeste). Une
  fenêtre TOCTOU et l'absence d'index unique (**D-092-11**, délibérée) ont été examinées puis écartées :
  acteur légitime sur ses **propres** données déclaratives, patron identique à celui déjà en place pour
  `retraitements`/`deficits`, non introduit par cette PR.

- **2026-08-03 — `done`.** Vérification docker **rejouée** après `docker restart` sur l'état final : un
  versement orphelin réel (20 000 000, échéance `30-05`) est bien compté (`totalAcomptes` 140 000 000)
  **et** signalé. État final : lint 0 · build OK · **2 186 unit** + **461 e2e** verts · couverture
  **98.87 / 91.12 / 98.09 / 98.97** · **22 mutation-tests rouges**. PR `balance-service` **#30**
  rebase-mergée sur `dev`, branche supprimée.

---

**Status:** done
**Dependencies:** **STORY-091** (résultat fiscal = base imposable), **STORY-078** (paquet : taux IS/MFP, calendrier d'acomptes, types de crédits), STORY-082/085 (CA HT), STORY-080 (régime `REEL` — sinon **STORY-095**/TPU)
**Alimente** **STORY-094** (provision d'IS écrite dans la balance), **STORY-096** (simulation — **le plancher MFP change tout le conseil**), `bilan-service` EPIC-011 (section « Liquidation » de la DSF)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A19 · CGI Togo 2026 (IS art. 113 · MFP art. 120 · acomptes art. 114) · GUIDEF « Liquidation IS » (12 postes)
