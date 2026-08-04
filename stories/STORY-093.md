# STORY-093 : TVA (collectée / déductible / due / crédit) + autres taxes + catégorie « Autres »

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A20 · `rapport-bilan-logique-metier-2026-07-12.md` §15 (CGI : **TVA 18 % taux unique**, art. 195 ; autres impôts : TAF, TCA, droits d'accises, patente, foncière, TH, enregistrement, retenues RSL/RSH, CNSS) · `referentiels/paquet-fiscal-togo-2026.json`
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 18 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A20 (TVA, taxes, catégorie « Autres »)

> **La TVA n'est pas une charge — c'est de l'argent qui ne vous appartient pas.** L'entreprise **collecte** la TVA pour l'État (sur ses ventes) et **déduit** celle qu'elle a payée (sur ses achats). La différence est **due** — ou constitue un **crédit** reportable. Une erreur de TVA n'affecte pas le résultat, elle crée une **dette envers l'État** : c'est le premier poste de redressement en contrôle.
>
> Cette story calcule la **TVA due/crédit** à partir des cahiers (où la ventilation HT/TVA a déjà été posée — STORY-082/083), gère les **autres impôts** du CGI, et prévoit une **catégorie « Autres »** (taux + montant manuels) pour **tout impôt local hors liste** — parce qu'aucun référentiel n'est exhaustif et qu'un blocage sur un impôt inconnu rendrait l'outil inutilisable.

---

## User Story

En tant que **cabinet comptable**,
je veux **calculer la TVA due (ou le crédit) et enregistrer les autres impôts et taxes** de l'exercice,
afin de **déclarer le bon montant**, d'alimenter les comptes `44x` de la balance, et de **ne jamais être bloqué** par un impôt local que le référentiel ne connaît pas.

---

## Description

### Contexte

**La TVA** (Togo : **18 %, taux unique** — art. 195) fonctionne par **différence** :

```
TVA collectée (sur les ventes) ........... classe 7 assujettie  →  compte 443x
− TVA déductible (sur les achats) ........ classe 6 déductible  →  compte 445x
= TVA due (si > 0)  →  à payer, compte 4441
= CRÉDIT de TVA (si < 0)  →  reportable sur la période suivante, compte 4449
```

Le travail est **déjà fait à la saisie** : chaque `LigneRecette` (STORY-082) porte sa TVA collectée, chaque `LigneDepense` (STORY-083) sa TVA déductible (et sa **non-déductibilité** éventuelle). Le moteur **agrège** — par **période de déclaration** (mensuelle en général), pas seulement à l'année.

> **Piège classique : toute la TVA d'achat n'est pas déductible.** Certaines charges ouvrent droit à déduction, d'autres non (véhicules de tourisme, cadeaux, dépenses non professionnelles…). Le marquage a lieu **à la saisie** (`tva.deductible`, STORY-083) ; ici on **respecte** ce marquage — on ne déduit **jamais** par défaut.

**Les autres impôts** du CGI Togo (patente, foncière, taxe d'habitation, TAF, TCA, droits d'accises, droits d'enregistrement, retenues **RSL/RSH**, **CNSS**…) sont **enregistrés** (ils sont pour la plupart des **charges déductibles**, compte `64x`) et alimentent la liasse.

> **La catégorie « Autres » est une décision de conception délibérée.** Le paquet fiscal ne sera **jamais** exhaustif (taxes communales, redevances sectorielles, impôts nouveaux…). Plutôt que de bloquer, on permet **`{ libellé, base, taux OU montant, compte }`** saisi manuellement, **justifié** et **tracé**. C'est la soupape qui évite que le cabinet ne sorte de l'outil.

### Périmètre

**Inclus :**

- **`TvaService.calculer(orgId, periode)`** — par **période de déclaration** (mensuelle/trimestrielle **selon le paquet**) **et** cumul annuel :
  - **TVA collectée** = `Σ tva.montantTVA` des `LigneRecette` **assujetties** (STORY-082), **hors exonérées**.
  - **TVA déductible** = `Σ tva.montantTVA` des `LigneDepense` marquées **`tva.deductible: true`** (STORY-083) — ⚠️ **jamais** la TVA des charges non déductibles.
  - **TVA due** = `collectée − déductible` (si > 0) ; sinon **crédit de TVA** (si < 0).
  - **Report du crédit** : le crédit d'une période **s'impute** sur la période suivante → **suivi du stock de crédit** (jamais perdu, jamais dupliqué).
  - **Taux lu du paquet** (`TG@2026` : **18 %**) — **jamais en dur** (NFR-A06).
- **`AutresTaxesService`** — les impôts et taxes du CGI :
  - Types **lus du paquet** (patente, foncière, TH, TAF, TCA, accises, enregistrement, **RSL/RSH**, **CNSS**…) : `{ code, libelle, compteComptable, deductible }`.
  - `POST /api/v1/fiscal/taxes` : `{ code, base?, taux?, montant, periode, justification, pieceRef? }` → montant calculé (`base × taux`) **ou** saisi directement.
  - **Déductibilité** : selon le paquet (la plupart sont des charges déductibles `64x` ; certaines **non** → **réintégration** automatique via STORY-091).
- **⚠️ Catégorie « Autres » (FR-A20)** — la soupape :
  - `POST /api/v1/fiscal/taxes/autres` : `{ libelle (obligatoire), base?, taux?, montant (obligatoire), compteComptable (validé), deductible, justification (obligatoire), pieceRef? }`.
  - Permet **tout impôt hors liste** (taxe communale, redevance sectorielle, impôt nouveau…) — **sans blocage**.
  - **Contraintes** : `libelle` + `justification` + `compteComptable` **obligatoires** ; le compte est **validé** contre le plan (STORY-078) ; l'entrée est **tracée** (NFR-A07) et **signalée** comme « hors référentiel » (pour qu'un jour elle **enrichisse le paquet** côté admin).
- **Déclaration de TVA** — `GET /api/v1/fiscal/tva?periode=2026-03` :
  - Tableau : collectée, déductible (dont non déductible **écartée**), due/crédit, crédit antérieur imputé, **crédit restant**.
  - **Traçabilité** : chaque montant remonte à ses **lignes sources** (recettes/dépenses).
- **Alimentation de la balance** : les montants de TVA (`443x`, `445x`, `4441`, `4449`) et de taxes (`64x`) sont **exposés** pour être écrits dans la balance → **STORY-094** (« les impôts font partie de la balance »).
- **Tests** : collectée (exonérées **exclues**) ; **déductible : les charges non déductibles n'ouvrent PAS droit à déduction** *(test central)* ; due > 0 ; **crédit reporté et imputé sur la période suivante** (jamais perdu/dupliqué) ; taux **du paquet** (aucun `0.18` en dur) ; taxe du paquet (code inconnu → **400**) ; **catégorie « Autres »** : sans `justification` → **400**, sans `compteComptable` valide → **400**, avec tout → **201** + marquée « hors référentiel » ; taxe non déductible → **réintégration** (STORY-091) ; immutabilité après validation (**409**).

**Hors périmètre :**

- **Écriture effective dans la balance** (comptes `44x`/`64x`) → **STORY-094**.
- **Résultat fiscal / IS** → **STORY-091/092**.
- **TPU** (le régime synthétique **remplace** TVA + IS par une taxe unique) → **STORY-095**.
- **Télédéclaration / paiement de la TVA** → **Module 3** (fiscal-service re-scopé) + `paiement-service`.
- **TVA intracommunautaire / import-export** (autoliquidation, exonérations à l'export) → **hors v1** : traitable via la catégorie « Autres » + exonération de ligne, en attendant un paquet enrichi.
- **Barème CNSS détaillé** (cotisations salariales/patronales) → **question ouverte** (PRD §13) : ici on **enregistre** le montant ; le **calcul** viendra avec le paquet complété ou la paie.

### Flux

1. Les cahiers de mars 2026 sont saisis : recettes **assujetties** (TVA collectée) et dépenses (TVA déductible ou non — STORY-083).
2. `GET /api/v1/fiscal/tva?periode=2026-03` :
   - **TVA collectée** : 720 000 (2 ventes **exonérées** correctement **exclues** ✔)
   - **TVA déductible** : 410 000 — ⚠️ **65 000 de TVA sur charges non déductibles ÉCARTÉE** (test central)
   - **TVA due** = 720 000 − 410 000 = **310 000**
   - **Crédit antérieur** (février) : 90 000 → **imputé**
   - **TVA à payer** = **220 000** ; crédit restant = 0.
3. Le cabinet enregistre les **autres taxes** : patente (code du paquet) 150 000, retenues **RSL** 45 000 → comptes `64x`, déductibles.
4. Il rencontre une **taxe communale de salubrité** — **absente du paquet** → il utilise la **catégorie « Autres »** : `{ libelle: "Taxe communale de salubrité", montant: 30 000, compteComptable: "646x", deductible: true, justification: "Avis d'imposition mairie n°… " }` → **201**, marquée **« hors référentiel »** (remontée pour enrichir le paquet côté admin).
5. **STORY-094** écrit ces montants dans la **balance** (`4441` TVA due, `64x` taxes) — « les impôts font partie de la balance ».
6. Les taxes **non déductibles** éventuelles remontent en **réintégration** (STORY-091).

---

## Acceptance Criteria

- [ ] **TVA collectée** = `Σ` TVA des recettes **assujetties** ; **les exonérées sont exclues** (test).
- [ ] **⚠️ TVA déductible** = `Σ` TVA des dépenses marquées **`tva.deductible: true`** uniquement — **la TVA des charges non déductibles n'ouvre PAS droit à déduction** *(test central)*.
- [ ] **TVA due** = `collectée − déductible` (> 0) ; **crédit de TVA** (< 0).
- [ ] **Crédit reporté** : imputé sur la période suivante ; **stock de crédit suivi** (jamais perdu, jamais compté deux fois) — test dédié.
- [ ] **Calcul par période de déclaration** (mensuelle/trimestrielle **selon le paquet**) **et** cumul annuel.
- [ ] **Taux TVA lu du paquet** (`TG@2026` : **18 %**) — **aucun taux en dur** (NFR-A06).
- [ ] **Autres taxes** : types **lus du paquet** (patente, foncière, TH, TAF, TCA, accises, enregistrement, RSL/RSH, CNSS) ; **code inconnu → 400** ; montant `base × taux` **ou** saisi ; déductibilité **selon le paquet**.
- [ ] **⚠️ Catégorie « Autres »** (FR-A20) : permet **tout impôt hors liste** — `libelle` + `montant` + `compteComptable` (**validé**) + `justification` **obligatoires** (**400** sinon) ; entrée **tracée** et **marquée « hors référentiel »** (pour enrichir le paquet côté admin).
- [ ] **Taxe non déductible** → remonte en **réintégration** (STORY-091).
- [ ] **Déclaration de TVA** (`GET /fiscal/tva?periode=`) : collectée, déductible (dont **écartée**), due/crédit, crédit antérieur imputé, crédit restant — chaque montant **traçable** à ses lignes sources.
- [ ] **Montants exposés** pour écriture dans la balance (`443x`, `445x`, `4441`, `4449`, `64x`) → consommés par **STORY-094**.
- [ ] **Immutabilité** après validation → **409**.
- [ ] **Tests** : exonérées exclues, **non déductibles écartées**, due, **crédit reporté/imputé**, taux du paquet, code taxe inconnu (400), « Autres » (400 ×2 puis 201 + hors référentiel), taxe non déductible → réintégration, immutabilité. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### TVA — le calcul et le piège

```typescript
export interface DeclarationTva {
  periode: { debut: Date; fin: Date };
  tvaCollectee: number;            // recettes assujetties (exonérées EXCLUES)
  tvaDeductible: number;           // dépenses avec tva.deductible === true UNIQUEMENT
  tvaEcartee: number;              // ⚠️ TVA des charges NON déductibles — affichée, jamais déduite
  tvaDue: number;                  // max(0, collectee − deductible)
  creditGenere: number;            // max(0, deductible − collectee)
  creditAnterieurImpute: number;
  creditRestant: number;
  aPayer: number;
  paquetVersion: string;           // traçabilité
}
```

```typescript
async calculer(orgId: string, periode: DateRange): Promise<DeclarationTva> {
  const paquet = await this.paquetFiscal.get(pays, periode.fin.getFullYear());  // taux 18 % — jamais en dur

  const recettes = await this.recettesRepo.periode(orgId, periode);
  const depenses = await this.depensesRepo.periode(orgId, periode);

  // Collectée : assujetties, hors exonérées
  const tvaCollectee = somme(
    recettes.filter(r => r.tva?.assujetti && !r.tva.exonere).map(r => r.tva!.montantTVA)
  );

  // ⚠️ Déductible : UNIQUEMENT les charges dont la TVA est déductible.
  //    La TVA d'une charge non déductible n'ouvre PAS droit à déduction (piège n°1 en contrôle).
  const deductibles    = depenses.filter(d => d.tva?.deductible === true);
  const nonDeductibles = depenses.filter(d => d.tva && d.tva.deductible === false);

  const tvaDeductible = somme(deductibles.map(d => d.tva!.montantTVA));
  const tvaEcartee    = somme(nonDeductibles.map(d => d.tva!.montantTVA));   // affichée pour transparence

  const solde = tvaCollectee - tvaDeductible;
  const creditAnterieur = await this.creditRepo.stock(orgId, periode);        // jamais perdu

  /* … imputation du crédit antérieur, calcul du restant … */
}
```

### La soupape « Autres » — ne jamais bloquer le cabinet

```typescript
@Post('/fiscal/taxes/autres')
@RequiresBalanceAccess()
async autreTaxe(@Body() dto: AutreTaxeDto, @TenantContext() orgId, @CurrentUser() user) {
  // Aucun référentiel n'est exhaustif (taxes communales, redevances sectorielles, impôts nouveaux).
  // On accepte — mais JAMAIS en aveugle : libellé, montant, compte validé, justification.
  if (!dto.libelle || !dto.montant || !dto.justification) {
    throw new BadRequestException('LIBELLE_MONTANT_JUSTIFICATION_REQUIS');
  }
  if (!(await this.referentiel.isCompteValide(dto.compteComptable))) {
    throw new BadRequestException('COMPTE_INCONNU');
  }

  return this.taxeRepo.creer({
    ...dto,
    horsReferentiel: true,        // ← remonté à l'admin pour enrichir le paquet fiscal
    parUserId: user.id, le: new Date(),
  });
}
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **TVA d'une charge non déductible déduite** → redressement (piège n°1) | Déduction **strictement limitée** à `tva.deductible === true` (marqué à la saisie, STORY-083) ; la TVA écartée est **affichée** |
| Crédit de TVA **perdu** ou **compté deux fois** | **Stock de crédit** suivi et imputé période par période (test dédié) |
| Taux TVA en dur → faux après réforme | Taux **lu du paquet** — test anti-hardcode |
| **Impôt local inconnu → cabinet bloqué**, sort de l'outil | **Catégorie « Autres »** (FR-A20) : accepte tout, mais **justifié, tracé, compte validé**, et **marqué hors référentiel** pour enrichir le paquet |
| « Autres » devient une poubelle non contrôlée | `libelle` + `justification` + `compteComptable` **obligatoires** ; entrée **tracée** et **remontée à l'admin** |
| Exonérations comptées comme collectées | Exonérées **exclues** (test) |
| Barème CNSS incomplet (question ouverte) | On **enregistre** le montant ; le **calcul** attend le paquet complété — pas de valeur devinée |

---

## Definition of Done

- [ ] `TvaService` : collectée (exonérées exclues), **déductible stricte**, due/crédit, **report du crédit**
- [ ] **Test central** : TVA des charges non déductibles **écartée**, jamais déduite
- [ ] Calcul par **période de déclaration** (du paquet) + cumul annuel
- [ ] `AutresTaxesService` : types du paquet, code inconnu → 400, déductibilité du paquet
- [ ] **Catégorie « Autres »** : libellé + montant + compte validé + justification obligatoires ; marquée **hors référentiel**
- [ ] Taxe non déductible → **réintégration** (STORY-091)
- [ ] Déclaration TVA traçable (lignes sources) ; montants exposés pour la balance (STORY-094)
- [ ] Aucun taux en dur ; immutabilité après validation (409)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-082/083 (ventilation TVA à la saisie) verts

---

**Status:** in_progress
**Dependencies:** **STORY-078** (taux TVA, types de taxes, périodicité), **STORY-082** (TVA collectée), **STORY-083** (TVA déductible **et non déductible**), STORY-080 (assujettissement)
**Alimente** **STORY-094** (écriture des `44x`/`64x` dans la balance), **STORY-091** (taxes non déductibles → réintégration), `bilan-service` EPIC-011 (état TVA de la DSF)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A20 · CGI Togo 2026 (TVA 18 %, art. 195)

---

## Progress Tracking

**Statut : `review` → `done`** (MNV-093, 2026-08-04)

### Décisions de conception

| # | Décision | Pourquoi |
|---|---|---|
| **D-093-1** | Le paquet `togo@2026` gagne `tva.declaration` (périodicités, report du crédit, comptes) et une rubrique `taxes` (types + soupape). Régénéré, checksum **`08d4ad81`** | **Rupture assumée avec 091/092** : ces deux blocs ne transcrivent **pas** une prose déjà présente — la périodicité de dépôt et le régime du crédit n'étaient publiés **nulle part**. Ils sortent donc marqués `A_CONFIRMER` et alimentent `aFaire`, plutôt que d'être devinés dans le moteur où ils auraient été invisibles (NFR-A06) |
| **D-093-2** | `GET /fiscal/tva` **n'écrit rien** : le chaînage du crédit est rejoué depuis la première période à chaque appel | Prolonge D-091-9 / D-092-10. Consommer le stock en base le corromprait à chaque rechargement, et STORY-096 doit pouvoir rejouer |
| **D-093-3** | Le crédit **hérité de l'exercice précédent** est **déclaré** (`credits_tva_anterieurs`, index unique par exercice) | Même situation que les déficits reportables de 091 : il vient d'exercices que l'outil n'a jamais vus. Le recalculer en remontant les exercices ouvrirait la régression infinie que D-092-9 interdit |
| **D-093-4** | Le taux du paquet **contrôle**, il ne recalcule pas : `coherenceTaux` publie la collectée théorique et l'écart | La TVA est ventilée **à la saisie** (082/083) et le comptable a pu la corriger. Recalculer écraserait sa correction ; ne rien faire du taux en ferait une donnée morte et l'exigence « taux du paquet » un vœu invérifiable |
| **D-093-5** | **Deux portes séparées** : `POST /taxes` (le paquet donne compte + déductibilité) et `POST /taxes/autres` (le client donne tout, sous 4 exigences) | Fondues, un client postant un `code` connu **avec** son propre compte aurait silencieusement choisi lequel fait foi |
| **D-093-6** | RSL/RSH sont publiées en taxes **et** signalées `aussiCreditImpot` | Le paquet les publie déjà comme crédits d'impôt (092) : les enregistrer en charge **et** les déclarer en crédit les compterait **deux fois**. Signalé, non bloqué — c'est le cabinet qui sait si la retenue a été subie ou supportée |
| **D-093-7** | `compteComptable` et `deductible` sont **persistés**, pas relus du paquet | Un paquet republié ne doit pas changer rétroactivement la déductibilité d'une charge déjà entrée dans une assiette déposée. Le paquet **valide à l'écriture**, le document fait foi ensuite |
| **D-093-8** | Les montants sont **exposés** (`ecritures[]`), jamais écrits en balance | Hook inerte de **STORY-094**. Un compte non publié ou hors plan sort **sans compte** + motif, jamais une case au hasard |

**Écart documenté au cadrage** : la story décrivait `periode` dans le corps d'une taxe ; l'implémentation porte une **`date` d'exigibilité** validée dans l'exercice. Une date dit strictement la même chose en mieux (c'est ce dont la balance a besoin) et évite un second axe temporel à valider contre une périodicité TVA qui ne gouverne pas la patente.

### Portes de qualité

- Lint **0 warning** · build OK
- **2 338 tests unitaires** verts (134 suites) — couverture **98.93 / 91.32 / 98.22 / 99.04** (seuils 65/90/90/90)
- **498 e2e** verts (22 suites), dont `tva-taxes.e2e-spec.ts` (37 tests) sur les **artefacts réels** `togo@2026` + `syscohada-revise@2.1`
- Non-régression : STORY-082/083 (ventilation à la saisie), 091 (résultat fiscal), 092 (liquidation) verts
- ⚠️ Un run e2e complet a produit une fois un `Parse Error: Expected HTTP/` sur `fiscal.e2e-spec.ts` — **flake connu** de la suite (non reproductible sur 3 runs consécutifs, suite verte seule). Non introduit par cette story.

### Mutation-tests (11 mutations, toutes rouges puis restaurées)

| # | Mutation | Effet attendu | Résultat |
|---|---|---|---|
| M1 | `tva.deductible === true` → `!== false` | la TVA d'une charge **sans marquage** serait déduite | 🔴 1 test |
| M2 | exonérées non exclues de la collectée | dette envers l'État **majorée** | 🔴 1 test |
| M3 | stock de crédit réinitialisé à chaque période | crédit **dupliqué** période après période | 🔴 4 tests |
| M4 | `TVA_DUE` écrit la due **brute** au lieu du « à payer » | crédit antérieur payé **deux fois** | 🔴 3 tests |
| M5 | garde de déductibilité des taxes inversée | les taxes **déductibles** seraient réintégrées | 🔴 9 tests |
| M6 | compte « Autres » non validé contre le plan | la soupape devient une **poubelle** | 🔴 2 tests |
| M7 | déductibilité « Autres » forcée à `true` | base imposable **minorée** en silence | 🔴 1 test |
| M8 | déductibilité d'une taxe cataloguée non lue du paquet | une pénalité fiscale deviendrait déductible | 🔴 1 test |
| M9 | montant nul accepté au lieu d'un refus | taxe enregistrée qui ne pèse rien | 🔴 1 test |
| M10 | plafond de périodes rendu inopérant | allocation non bornée (CWE-770) | 🔴 1 test |
| M11 | `taxes/:id` déclarée **avant** `taxes/autres` | Nest capterait « autres » comme identifiant | 🔴 1 test |

### Vérification docker (stack réelle, `mongosh` direct)

Organisation `6a71426794d25a1666204f50`, régime **RÉEL** (assujettie TVA), paquet `togo@2026` checksum `08d4ad81`.

**Le scénario de la story, sur données réellement persistées** :

| Grandeur | Attendu | Obtenu | Source tracée |
|---|---|---|---|
| TVA collectée | 720 000 | **720 000** | 1 ligne — les **2 ventes exonérées** (180 000 + 90 000) **exclues** ✔ |
| TVA déductible | 410 000 | **410 000** | 1 ligne de dépense marquée `deductible: true` |
| **TVA écartée** | 65 000 | **65 000** | ⚠️ TVA de la charge **non déductible** — affichée, **jamais** déduite |
| TVA due | 310 000 | **310 000** | `720 000 − 410 000` |
| Crédit antérieur imputé | 90 000 | **90 000** | stock déclaré, imputé sur mars |
| **À payer** | **220 000** | **220 000** | `310 000 − 90 000`, crédit restant 0 |

- **Taux 18 %** et comptes **443 / 445 / 4441** lus du **paquet réel** (`coherenceTaux.tauxStandard = 0.18`, écart 0, aucun avertissement).
- **`credits_tva_anterieurs`** : 1 document ; la **seconde** déclaration du même exercice → **409**, index unique `(orgId, exercice.debut, exercice.fin)` **confirmé `unique: true` en base**.
- **`taxes_fiscales`** : 4 documents (patente 641, RSL 641 + signal `aussiCreditImpot`, taxe communale 646 `horsReferentiel: true`, pénalité 647 non déductible). Registre : total 225 000, écritures agrégées **par compte** (641 : 195 000 · 646 : 30 000).
- **Aucun document orphelin après échec** : les 3 refus (justification manquante, compte `999999` hors plan, code `TAXE_SALUBRITE` inconnu) n'ont **rien** écrit — le compte en base correspond exactement aux créations réussies. `sans orgId = 0`, `sans exercice = 0`, `sans justification = 0`, `sans compte = 0`.
- **Couture STORY-091 vérifiée en réel** : `GET /fiscal/resultat-fiscal` remonte deux postes automatiques — la pénalité (45 000, code `20`, `origine: AUTO_TAXES`, `taxesSources` pointant le vrai document) **et** la charge non déductible du cahier (365 000 **TTC**, piège D-083-2 respecté). Résultat comptable 5 195 000 → **résultat fiscal 5 605 000**.
- Collections en **snake_case explicite** : `taxes_fiscales`, `credits_tva_anterieurs` (le pluriel Mongoose aurait donné `taxefiscales` / `credittvaanterieurs`).

### Hooks inertes posés

- `ecritures[]` sur `GET /fiscal/tva` et `GET /fiscal/taxes` — **STORY-094** les consommera pour écrire les `44x`/`64x` en balance. Rien n'est écrit ici.
- Le moteur lit `periodicites[].moisParPeriode` sans connaître aucun code : publier une **trimestrielle** dans le paquet suffira, **zéro ligne de code**.
