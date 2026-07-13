# STORY-096 : Scénarios d'optimisation fiscale légale (leviers → impact IS, sous contrainte du plancher MFP)

**Epic :** EPIC-024 — Simulation & conseil fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A22, NFR-A04 (garde-fous) · `rapport-bilan-logique-metier-2026-07-12.md` §13 (D11 : prévisionnel + conseil fiscal) · STORY-091 (résultat fiscal), STORY-092 (`max(MFP, IS)` + `baseRetenue`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 19 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A22 (simulation de scénarios d'optimisation légale)

> **Le conseil fiscal — la fonctionnalité la plus utile, et la plus dangereuse.** Un cabinet ne se contente pas de *calculer* l'impôt : il **conseille**. « Si vous provisionnez cette créance douteuse, votre IS baisse de X. » « Si vous imputez ce déficit reportable, vous économisez Y. » Cette story permet de **simuler** l'effet de **leviers légaux** sur l'impôt.
>
> **Trois garde-fous non négociables (NFR-A04) :**
> 1. **Un scénario est un BROUILLON SIMULÉ** — il ne touche **jamais** la balance réelle ni la liasse déposée.
> 2. **Seuls des leviers LÉGAUX** sont proposés (provisions justifiées, amortissements, report de déficits, réductions d'impôt prévues par le CGI) — **jamais** minorer une recette réelle ni créer une charge fictive.
> 3. **Chaque levier exige une base légale** — le comparatif sans justification n'existe pas (c'est l'objet de **STORY-097**).
>
> **Et l'information capitale, que seul ce moteur peut donner :** **optimiser l'IS sous le plancher de la MFP ne sert à RIEN.** Si l'impôt dû est déjà la MFP (`baseRetenue: 'MFP'`), réduire le bénéfice de 2 M **n'économise pas un franc**. Le conseil doit le **dire**.

---

## User Story

En tant que **cabinet comptable / conseil**,
je veux **simuler l'effet de leviers fiscaux légaux** sur l'impôt de mon client, **sans toucher à sa comptabilité réelle**,
afin de **lui recommander les options les plus favorables et défendables** — et de savoir **quand une optimisation est inutile** (plancher MFP atteint).

---

## Description

### Contexte

L'optimisation fiscale légale consiste à **agir sur la base imposable** via des mécanismes **prévus par la loi** :

| Levier légal | Effet | Base légale |
|---|---|---|
| **Provision** (créance douteuse, risque) | Charge **déductible** → ↓ résultat fiscal | CGI — conditions strictes (probabilité, individualisation) |
| **Amortissement** (dotation optimale) | Charge déductible → ↓ résultat fiscal | CGI — barèmes et durées |
| **Report de déficits** antérieurs | ↓ base imposable | CGI — durée et plafond |
| **Réduction d'impôt** (investissement, emploi…) | ↓ impôt directement | CGI — dispositifs incitatifs |
| **Étalement / rattachement** d'un produit | Décale l'imposition | CGI — règles de rattachement |

> **La frontière — et elle est nette.** *Optimiser*, c'est **choisir**, parmi les options que la loi offre, celle qui est la plus favorable, **et pouvoir le justifier**. *Frauder*, c'est **modifier la réalité** : minorer une recette encaissée, inventer une charge, antidater une pièce. **L'outil n'implémente aucun mécanisme de la seconde catégorie** (NFR-A04). Ce n'est pas un choix moral abstrait : une balance validée est **immuable** (STORY-101), les recettes sont **confrontées aux relevés** (STORY-090), et chaque retraitement exige une **base légale** (STORY-091).

**Le rôle du plancher MFP (STORY-092)** est ici décisif et souvent mal compris : `Impôt dû = max(MFP ; IS)`. Si la MFP (1 % du CA) **dépasse déjà** l'IS, alors **baisser le bénéfice ne change rien à l'impôt** — l'entreprise paiera la MFP quoi qu'il arrive. Un conseil qui recommanderait une provision dans ce cas ferait **perdre de la trésorerie sans gain fiscal**. Le moteur doit **détecter et signaler** cette situation.

### Périmètre

**Inclus :**

- **Modèle `ScenarioFiscal`** (collection `scenarios_fiscaux`, keyée `orgId` + `exercice`) :
  - `nom`, `description`, `statut` : **`BROUILLON`** (toujours — un scénario n'est **jamais** « appliqué »).
  - `leviers: LevierFiscal[]` — chacun : `{ type, montant, codeRetraitement (du paquet), baseLegale, justification, pieceRef? }`.
  - **⚠️ Isolation totale** : un scénario **ne touche jamais** la balance réelle, ni les retraitements réels, ni la liasse. Il vit dans **sa propre collection**.
- **Types de leviers (tous légaux, tous issus du paquet)** :
  - `PROVISION` · `AMORTISSEMENT` · `REPORT_DEFICIT` · `REDUCTION_IMPOT` · `RETRAITEMENT` (générique, code du paquet).
  - **Chaque levier exige** : `codeRetraitement` **validé contre le paquet** (**inconnu → 400**), `baseLegale` **obligatoire**, `justification` **obligatoire** (**400** sinon).
  - **⚠️ Aucun levier de type « minoration de produit » n'existe** dans l'énumération — c'est une **impossibilité structurelle**, pas une règle qu'on pourrait contourner.
- **`SimulationService.simuler(orgId, exercice, scenarioId)`** :
  - **Rejoue** le moteur fiscal (STORY-091 → 092) **sur une copie en mémoire**, en appliquant les leviers du scénario **par-dessus** les retraitements réels.
  - Retourne : `résultat fiscal simulé`, `IS simulé`, `MFP` (inchangée — elle dépend du **CA**, pas du bénéfice), **`impôt dû simulé = max(MFP ; IS simulé)`**, **`économie réelle`**.
  - **⚠️ `economieReelle` ≠ `economieIS`** : si le scénario fait passer l'impôt **sous la MFP**, l'économie est **plafonnée** à `impôt initial − MFP`. **Le moteur calcule l'économie VRAIE, pas l'économie théorique.**
- **⚠️ Détection « optimisation inutile » (la valeur ajoutée du conseil)** :
  - Si `baseRetenue` du scénario devient **`'MFP'`** → **avertissement fort** : *« L'impôt est déjà au plancher MFP (X). Réduire davantage le bénéfice n'apporte AUCUNE économie supplémentaire. »*
  - **Cas extrême** : si l'impôt initial est **déjà** la MFP → **tout levier de réduction de bénéfice a une économie de 0** → l'outil le dit **explicitement** (et déconseille le levier).
- **Contrôle de plausibilité des leviers** (garde-fou anti-abus) :
  - **Provision** : montant > X % des créances → **avertissement** (« provision inhabituellement élevée — justification renforcée requise »).
  - **Levier sans pièce justificative** → **avertissement** (« indéfendable en contrôle sans pièce »).
  - Ces contrôles **n'empêchent pas** la simulation (c'est un outil de conseil) mais **signalent le risque** — c'est **STORY-097** qui produira le dossier de défense.
- **Comparaison de scénarios** : `GET /api/v1/fiscal/scenarios?exercice=` → tous les scénarios + **impôt simulé** + **économie réelle** de chacun, **classés** par économie décroissante. *(Le comparatif détaillé « déposé vs optimisé » est **STORY-097**.)*
- **CRUD scénarios** (`@RequiresBalanceAccess`, isolation `orgId`) : `POST` **201**, `GET`, `PATCH`, `DELETE` (un scénario **peut** être supprimé — ce n'est **pas** une donnée comptable).
- **⚠️ Aucun endpoint « appliquer le scénario »** : un scénario **ne se transforme pas** en écritures. Si le cabinet retient une option, il **saisit le retraitement réel** via **STORY-091** (avec base légale et pièce) — geste **explicite, tracé, dans le monde réel**.
- **Tests** : simulation d'une provision → IS baisse, **économie calculée** ; **⚠️ scénario passant sous la MFP → `economieReelle` PLAFONNÉE** *(test central)* ; **⚠️ impôt déjà à la MFP → économie = 0 + avertissement « optimisation inutile »** *(test central)* ; levier **sans base légale → 400** ; levier **sans justification → 400** ; code de retraitement **inconnu → 400** ; **⚠️ la balance réelle et les retraitements réels sont INCHANGÉS après simulation** *(test central)* ; **aucun endpoint d'application** (test qui vérifie l'absence) ; provision inhabituelle → avertissement ; classement des scénarios par économie réelle ; isolation `orgId`.

**Hors périmètre :**

- **Comparatif détaillé + dossier de justification** (la pièce à produire en contrôle) → **STORY-097**.
- **Calcul du résultat fiscal et de l'impôt** → **STORY-091/092** (cette story les **rejoue**, elle ne les réimplémente pas).
- **Application d'un scénario** → **volontairement absent** : le retraitement réel se saisit via STORY-091.
- **Prévisionnel pluriannuel** (projection 3 ans) → **`bilan-service` EPIC-013**.
- **Optimisation TPU** (régime synthétique) : la TPU se calcule sur le **CA** — il n'y a **pas de levier sur le bénéfice** → **hors périmètre** (avertissement explicite si un scénario est demandé sur un dossier `SYNTHETIQUE`).

### Flux

1. La liasse 2026 est calculée : résultat fiscal **5 195 000** · **IS = 1 402 650** · **MFP = 480 000** → `impôt dû = 1 402 650` (**`baseRetenue: 'IS'`**).
2. Le cabinet crée un scénario **« Provision créances douteuses »** :
   - Levier `PROVISION` — **1 200 000** — code du paquet — base légale (CGI art. …) — justification (« 3 créances > 12 mois, mises en demeure ») — pièce jointe.
3. `POST /api/v1/fiscal/scenarios/:id/simuler` :
   - Résultat fiscal simulé : 5 195 000 − 1 200 000 = **3 995 000**
   - **IS simulé** = 27 % × 3 995 000 = **1 078 650**
   - **MFP** = **480 000** (inchangée — elle dépend du **CA**, pas du bénéfice)
   - **Impôt dû simulé** = max(480 000 ; 1 078 650) = **1 078 650** (`baseRetenue: 'IS'`)
   - **Économie réelle = 1 402 650 − 1 078 650 = 324 000** ✔
4. Il crée un **second scénario, plus agressif** : provision de **4 000 000**.
   - Résultat fiscal simulé : **1 195 000** → **IS simulé = 322 650**
   - **Impôt dû simulé = max(480 000 ; 322 650) = 480 000** → **`baseRetenue: 'MFP'`** ⚠️
   - **Économie réelle = 1 402 650 − 480 000 = 922 650** — **et non** 1 402 650 − 322 650 = 1 080 000 !
   - **⚠️ AVERTISSEMENT** : *« L'impôt atteint le plancher MFP (480 000). Provisionner au-delà de 3 216 000 n'apporte AUCUNE économie supplémentaire — vous immobiliseriez de la trésorerie pour rien. »*
5. Le cabinet **voit** le point d'inflexion, choisit le **scénario optimal** (provision calibrée), et **saisit le retraitement réel** via **STORY-091** (avec base légale + pièce).
6. **STORY-097** produit le **comparatif « déposé vs optimisé »** et le **dossier de justification** — la pièce qui **défend la liasse** en contrôle.
7. **La balance réelle n'a jamais été touchée** par les simulations.

---

## Acceptance Criteria

- [ ] **`ScenarioFiscal`** : CRUD (gate, isolation `orgId`) ; statut **toujours `BROUILLON`** ; stocké dans **sa propre collection**.
- [ ] **⚠️ ISOLATION TOTALE** *(test central)* : après une simulation, la **balance réelle**, les **retraitements réels** et la **liasse** sont **strictement inchangés**.
- [ ] **⚠️ AUCUN endpoint « appliquer un scénario »** (test qui vérifie son **absence**) — le retraitement réel se saisit via **STORY-091**, geste explicite et tracé.
- [ ] **Leviers légaux uniquement** : `PROVISION`, `AMORTISSEMENT`, `REPORT_DEFICIT`, `REDUCTION_IMPOT`, `RETRAITEMENT` — **aucun levier de minoration de produit n'existe dans l'énumération** (impossibilité **structurelle**, NFR-A04).
- [ ] **Chaque levier exige** : `codeRetraitement` **validé au paquet** (**inconnu → 400**), **`baseLegale` obligatoire** (**400** sinon), **`justification` obligatoire** (**400** sinon).
- [ ] **`SimulationService`** rejoue le moteur (STORY-091 → 092) **en mémoire**, sur une **copie**, et retourne : résultat fiscal simulé, IS simulé, **MFP (inchangée)**, **impôt dû simulé = `max(MFP ; IS)`**, **économie réelle**.
- [ ] **⚠️ `economieReelle` PLAFONNÉE par la MFP** *(test central)* : si le scénario fait passer l'impôt **sous la MFP**, l'économie est **`impôt initial − MFP`**, **pas** `impôt initial − IS simulé`.
- [ ] **⚠️ Détection « optimisation inutile »** *(test central)* : si `baseRetenue` devient **`'MFP'`** → **avertissement explicite** (« aucune économie supplémentaire au-delà de X — trésorerie immobilisée pour rien »). Si l'impôt est **déjà** à la MFP → **économie = 0** annoncée.
- [ ] **Contrôles de plausibilité** (avertissements, **non bloquants**) : provision inhabituellement élevée ; levier **sans pièce** → « indéfendable en contrôle sans pièce ».
- [ ] **Comparaison** : `GET /fiscal/scenarios` → scénarios classés par **économie réelle** décroissante.
- [ ] **Régime `SYNTHETIQUE`** : la TPU se calcule sur le **CA** → **avertissement** « pas de levier sur le bénéfice en TPU » (hors périmètre).
- [ ] **Tests** : simulation nominale, **plafonnement MFP**, **optimisation inutile**, base légale/justification/code manquants (400 ×3), **balance réelle inchangée**, **absence d'endpoint d'application**, plausibilité, classement, isolation `orgId`. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Le modèle — la fraude est structurellement impossible

```typescript
// ⚠️ L'énumération NE CONTIENT PAS de levier de minoration de produit / charge fictive.
//    Ce n'est pas une règle qu'on pourrait contourner : le type n'existe pas (NFR-A04).
export type TypeLevier =
  | 'PROVISION'          // charge déductible — conditions CGI strictes
  | 'AMORTISSEMENT'      // dotation — barèmes CGI
  | 'REPORT_DEFICIT'     // imputation de déficits antérieurs
  | 'REDUCTION_IMPOT'    // dispositif incitatif du CGI
  | 'RETRAITEMENT';      // générique — code du paquet

export interface LevierFiscal {
  type: TypeLevier;
  montant: number;
  codeRetraitement: string;   // validé contre le paquet (STORY-078)
  baseLegale: string;         // OBLIGATOIRE — « CGI TG 2026, art. … »
  justification: string;      // OBLIGATOIRE
  pieceRef?: string;          // son absence = avertissement « indéfendable »
}

export interface ScenarioFiscal {
  orgId: string;
  exercice: DateRange;
  nom: string;
  statut: 'BROUILLON';        // ⚠️ jamais autre chose — un scénario ne s'« applique » pas
  leviers: LevierFiscal[];
}
```

### La simulation — et le plafonnement par la MFP

```typescript
async simuler(orgId: string, exercice: DateRange, scenarioId: string): Promise<ResultatSimulation> {
  const reel = await this.liquidation.liquider(orgId, exercice);          // STORY-092 — état réel
  const scenario = await this.scenarioRepo.get(orgId, scenarioId);

  // ⚠️ COPIE EN MÉMOIRE — la balance réelle et les retraitements réels ne sont JAMAIS touchés.
  const rfSimule = await this.resultatFiscal.calculerAvecLeviers(orgId, exercice, scenario.leviers);

  const paquet   = await this.paquetFiscal.get(pays, exercice.fin.getFullYear());
  const isSimule = Math.max(0, Math.round(paquet.taux.is * rfSimule));
  const mfp      = reel.mfp;                       // ⚠️ INCHANGÉE : elle dépend du CA, pas du bénéfice

  const impotSimule = Math.max(isSimule, mfp);     // le plancher s'applique aussi en simulation
  const baseRetenue = impotSimule === mfp && mfp > isSimule ? 'MFP' : 'IS';

  // ⚠️ L'ÉCONOMIE RÉELLE, pas l'économie théorique.
  const economieReelle = reel.impotDu - impotSimule;

  const avertissements: string[] = [];
  if (baseRetenue === 'MFP') {
    const bénéficePlancher = Math.round(mfp / paquet.taux.is);   // RF en deçà duquel c'est inutile
    avertissements.push(
      `L'impôt atteint le plancher MFP (${fmt(mfp)}). Réduire le résultat fiscal en dessous de ` +
      `${fmt(bénéficePlancher)} n'apporte AUCUNE économie supplémentaire — trésorerie immobilisée pour rien.`,
    );
  }
  if (reel.baseRetenue === 'MFP') {
    avertissements.push(
      `L'impôt était DÉJÀ au plancher MFP. Ce levier n'apporte aucune économie (économie = 0).`,
    );
  }
  for (const l of scenario.leviers.filter(l => !l.pieceRef)) {
    avertissements.push(`Levier « ${l.type} » sans pièce justificative — indéfendable en contrôle.`);
  }

  return { impotReel: reel.impotDu, impotSimule, isSimule, mfp, baseRetenue, economieReelle, avertissements };
}
```

### Le test qui fait la valeur du conseil

```typescript
it('OPTIMISATION INUTILE : sous le plancher MFP, l\'économie est plafonnée', async () => {
  // Réel : IS 1 402 650 > MFP 480 000 → impôt dû 1 402 650
  // Scénario agressif : provision 4 000 000 → IS simulé 322 650 (< MFP)
  const sim = await service.simuler(orgId, ex2026, scenarioAgressif);

  expect(sim.isSimule).toBe(322_650);
  expect(sim.impotSimule).toBe(480_000);                 // ⚠️ plancher MFP, pas l'IS simulé
  expect(sim.economieReelle).toBe(922_650);              // ⚠️ PAS 1 080 000 (économie théorique)
  expect(sim.baseRetenue).toBe('MFP');
  expect(sim.avertissements.some(a => a.includes('AUCUNE économie supplémentaire'))).toBe(true);
});

it('ISOLATION : la balance réelle est INCHANGÉE après simulation', async () => {
  const avant = await balanceRepo.findLatest(orgId, ex2026);
  await service.simuler(orgId, ex2026, scenarioAgressif);
  const apres = await balanceRepo.findLatest(orgId, ex2026);

  expect(apres.checksum).toBe(avant.checksum);           // ⚠️ pas une virgule modifiée
  expect(apres.version).toBe(avant.version);
});
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **L'outil sert à frauder** (minorer une recette, inventer une charge) | **Impossibilité structurelle** : aucun levier de ce type dans l'énumération. De plus : balance validée **immuable** (101), recettes **confrontées aux relevés** (090), **base légale obligatoire** (091) |
| Un scénario « fuit » dans la comptabilité réelle | **Isolation totale** (collection dédiée, simulation en mémoire) + **aucun endpoint d'application** + **test d'isolation** |
| **Conseil erroné** : optimiser sous le plancher MFP | **Détection + avertissement explicite** ; **économie réelle plafonnée** (test central) — c'est **la** valeur ajoutée |
| Économie annoncée ≠ économie réelle | `economieReelle` calculée sur **`max(MFP ; IS)`**, jamais sur l'IS seul |
| Levier sans pièce → redressement | **Avertissement** « indéfendable en contrôle sans pièce » ; le **dossier de justification** (STORY-097) le formalise |
| Provision abusive | Contrôle de **plausibilité** (avertissement) + base légale + justification obligatoires |
| Simulation sur un dossier TPU (pas de levier sur le bénéfice) | **Avertissement explicite** — hors périmètre |

---

## Definition of Done

- [ ] `ScenarioFiscal` (CRUD, statut **BROUILLON** uniquement, collection dédiée)
- [ ] **Leviers légaux uniquement** — aucun levier de minoration dans l'énumération (NFR-A04)
- [ ] `codeRetraitement` **validé au paquet** ; `baseLegale` + `justification` **obligatoires** (400 sinon)
- [ ] `SimulationService` rejoue 091→092 **en mémoire** ; **balance réelle inchangée** (test)
- [ ] **⚠️ Économie RÉELLE plafonnée par la MFP** (test central)
- [ ] **⚠️ Avertissement « optimisation inutile »** quand le plancher MFP est atteint (test central)
- [ ] **⚠️ Aucun endpoint d'application** d'un scénario (test d'absence)
- [ ] Contrôles de plausibilité (provision élevée, levier sans pièce)
- [ ] Classement des scénarios par économie réelle ; avertissement si régime TPU
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-091/092 (moteur réel) verts

---

**Status:** ready-for-dev
**Dependencies:** **STORY-091** (résultat fiscal — rejoué), **STORY-092** (`max(MFP, IS)` + `baseRetenue` — **le plancher est le cœur du conseil**), STORY-078 (codes et taux du paquet)
**Alimente** **STORY-097** (comparatif « déposé vs optimisé » + dossier de justification — la pièce qui **défend** la liasse)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A22, NFR-A04 · D11 (conseil fiscal)
