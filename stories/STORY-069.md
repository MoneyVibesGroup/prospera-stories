# STORY-069 : Projection annuelle 3 ans (CR prévisionnel + trésorerie + bilan simplifié N+1..N+3) — FR-019

**Epic :** EPIC-013 — Prévisionnel (mensuel 12 mois + annuel 3 ans) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-019 (CR prévisionnel + plan de trésorerie annuel + bilan prévisionnel simplifié sur N+1..N+3 ; « les projections découlent des hypothèses (FR-018) et de la base validée ») ; **dépend FR-018**
**Réf. code livré :** **STORY-068** (`JeuHypotheses` — 9 paramètres + `base` traçable) · **STORY-065** (`SnapshotLiasse` — la base validée figée : `liasse`, `soldesN`) · **STORY-060/061** (`CompteResultatProduit.totalProduitsN` · `TftProduit.tresorerieClotureN`) · **STORY-059** (`ControleEquilibre.totalActifN`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** defined
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-23
**Sprint :** 15

---

## User Story

**En tant que** cabinet comptable disposant d'un jeu d'hypothèses rattaché à une base validée,
**je veux** obtenir la **projection annuelle sur 3 exercices (N+1, N+2, N+3)** — **compte de résultat prévisionnel**, **plan de trésorerie annuel** et **bilan prévisionnel simplifié** —,
**afin de** disposer d'un prévisionnel **entièrement dérivé** de mes hypothèses (FR-018) et de la **liasse validée figée** (FR-015), sans ressaisie et sans aucun montant inventé.

---

## Description

### Contexte & cadrage

STORY-068 a livré les **paramètres** (`JeuHypotheses` : croissance, marges, délais BFR, investissements,
financement, remboursements) rattachés à une **base validée traçable** (`base.snapshotId`), en annonçant
explicitement que « **068 ne calcule aucune projection** ». STORY-069 **calcule** cette projection annuelle :
elle **lit** le snapshot figé (065), en **extrait des ancres**, applique le **modèle de projection** aux
hypothèses et **restitue** 3 exercices.

**069 ne persiste rien** : la projection est une **dérivation pure et déterministe** de
`(snapshot figé, hypothèses)`. Deux mêmes entrées ⇒ deux mêmes sorties, à l'octet près. Rien à stocker,
donc rien à invalider — et les **scénarios comparés** (FR-021) se réduisent à dériver plusieurs jeux.

### Invariant P7 tenu : l'ancrage n'utilise que des agrégats référentiel-agnostiques

Le point dur : **ancrer** la projection sur la base **sans coder un seul poste SYSCOHADA en dur**. Le
modèle n'utilise donc que **4 agrégats déjà produits par le moteur**, tous agnostiques :

| Ancre | Source dans le snapshot | Agnostique parce que… |
|---|---|---|
| `chiffreAffairesBase` | `liasse.compteResultat.totalProduitsN` | somme des postes `regle='PRODUIT'` — pilotée par le référentiel |
| `chargesBase` | `liasse.compteResultat.totalChargesN` | idem, `regle='CHARGE'` |
| `resultatBase` | `liasse.compteResultat.resultatNetN` | produits − charges |
| `totalActifBase` | `liasse.bilan.controle.totalActifN` | total actif **net** direct (059) |
| `tresorerieBase` | `liasse.tft.tresorerieClotureN` | dérivée du **marqueur** `tresorerie` (061) ; `null` pour un référentiel sans section trésorerie (SFD-BCEAO) ⇒ ancre `0` + drapeau `tresorerieAncree=false` |

**Aucun code de poste (`XI`, `BZ`, `CJ`, `ZH`…) n'apparaît dans le code de projection.** Un référentiel
sans TFT projette quand même — avec une trésorerie d'ouverture nulle, signalée.

### Modèle de projection (déterministe, documenté, en unités mineures XOF entières)

Pour chaque exercice projeté `n ∈ {1,2,3}` (rang N+n), avec `g = croissanceCaPct/100` :

**1. Compte de résultat prévisionnel**
```
chiffreAffaires(n) = round( chiffreAffaires(n-1) × (1 + g) )      chiffreAffaires(0) = chiffreAffairesBase
margeBrute(n)      = round( chiffreAffaires(n) × tauxMargePct/100 )
coutDesVentes(n)   = chiffreAffaires(n) − margeBrute(n)
chargesExploitation(n) = round( chiffreAffaires(n) × tauxChargesPct/100 )
resultatNet(n)     = margeBrute(n) − chargesExploitation(n)
```

**2. BFR normatif** (les délais des hypothèses, en jours, sur base **360 jours**)
```
stocks(n)             = round( coutDesVentes(n) × delaiBfrStocksJours / 360 )
creancesClients(n)    = round( chiffreAffaires(n) × delaiBfrClientsJours / 360 )
dettesFournisseurs(n) = round( coutDesVentes(n) × delaiBfrFournisseursJours / 360 )
bfr(n)                = stocks(n) + creancesClients(n) − dettesFournisseurs(n)
```
Le **BFR d'ancrage `bfr(0)`** est calculé avec la **même** formule normative sur `chiffreAffairesBase`
(et son coût des ventes normatif) : le modèle est **homogène** d'un bout à l'autre, donc la variation de
BFR de la 1ʳᵉ année ne mélange pas un BFR réel et un BFR normatif.

**3. Plan de trésorerie annuel**
```
capaciteAutofinancement(n) = resultatNet(n)
variationBfr(n)            = bfr(n) − bfr(n-1)
fluxExploitation(n)        = capaciteAutofinancement(n) − variationBfr(n)
fluxInvestissement(n)      = −investissements
fluxFinancement(n)         = financement − remboursements
fluxNet(n)                 = fluxExploitation(n) + fluxInvestissement(n) + fluxFinancement(n)
tresorerieOuverture(n)     = tresorerieCloture(n-1)        tresorerieCloture(0) = tresorerieBase
tresorerieCloture(n)       = tresorerieOuverture(n) + fluxNet(n)
```
`investissements` / `financement` / `remboursements` s'appliquent **à chaque exercice projeté** (montants
annuels récurrents) — convention explicite du modèle ; un échéancier non uniforme relève de FR-020.

**4. Bilan prévisionnel simplifié**
```
ACTIF
  actifImmobiliseNet(n) = actifImmobiliseNet(n-1) + investissements
  bfr(n)                                                   (cf. §2)
  tresorerieNette(n)    = tresorerieCloture(n)             (cf. §3)
  totalActif(n)         = actifImmobiliseNet(n) + bfr(n) + tresorerieNette(n)

PASSIF
  ressourcesStablesInitiales   = totalActifBase                        (figé)
  resultatsCumules(n)          = Σ_{k≤n} resultatNet(k)
  financementNetCumule(n)      = Σ_{k≤n} (financement − remboursements)
  totalPassif(n)               = ressourcesStablesInitiales + resultatsCumules(n) + financementNetCumule(n)
```
avec l'**ancre résiduelle** `actifImmobiliseNet(0) = totalActifBase − bfr(0) − tresorerieBase`, ligne
**assumée comme un solde d'ancrage** (elle absorbe tout ce que le modèle simplifié ne ventile pas :
immobilisations, autres créances/dettes). Elle n'est **pas un montant inventé** : elle est *définie* comme
le résidu qui fait boucler l'ancrage exactement.

**5. Contrôle d'équilibre — vrai contrôle, pas une décoration**
```
ecart(n) = totalActif(n) − totalPassif(n)        equilibre(n) = (ecart(n) === 0)
```
`ecart(n) = 0` **par construction** (la trésorerie de clôture absorbe exactement les flux ; en développant,
`Σ fluxNet = Σ resultatNet − (bfr(n) − bfr(0)) − Σ investissements + Σ (financement − remboursements)`),
**y compris après arrondis** : les 4 seules quantités arrondies (CA, marge, charges d'exploitation, et les
3 composantes de BFR) le sont **avant** que toute l'arithmétique restante ne se fasse en **entiers exacts**.
Le champ **prouve** donc la cohérence interne du modèle — sur le patron de `CoherenceResultat` /
`CoherenceSig` / `CoherenceSousTotaux` déjà en place.

### Frontières nettes

- **Plan de trésorerie MENSUEL 12 mois** (FR-020) → STORY-070. 069 = **annuel** seulement.
- **Scénarios comparés** (FR-021) → STORY-071 ; la dérivation pure de 069 en est le hook direct.
- **Impôt sur les sociétés / paquet fiscal** : hors modèle (le `paquetFiscal` est un **axe séparé** — cf.
  STORY-078). `resultatNet` est ici un **résultat avant impôt** — champ nommé et documenté comme tel, hook.
- **Dotations aux amortissements** : hors modèle simplifié (`CAF = résultat net`) → hook documenté.
- **Persistance d'une projection** : aucune (dérivation pure). Si FR-022/023 exigent de figer une projection
  exportée, ce sera un agrégat dédié — hook.

---

## Scope

**Dans le périmètre :**
- Nouveau dossier `src/modules/bilan/projection/` : `projection.types.ts` (contrats purs),
  `projection-annuelle.service.ts` (**dérivation pure**, aucune dépendance Mongo), `projection.service.ts`
  (orchestration : charge le jeu d'hypothèses + son snapshot de base), `projection.controller.ts`, `dto/`.
- `GET /api/v1/bilan/hypotheses/:id/projection` — gardé `@RequiresBilanAccess` + `@Roles`, tenant-scoped,
  404 anti-énumération.
- Extraction des ancres depuis `SnapshotLiasse.liasse` **sans aucun code de poste en dur** (invariant P7).
- Tests unit (modèle + orchestration + contrôleur) + e2e (contrat HTTP + gardes) + **vérif docker réelle**
  (projection calculée sur une base validée réelle, équilibre `ecart=0` prouvé sur documents Mongo réels).

**Hors périmètre :** FR-020 (mensuel), FR-021 (scénarios), IS/paquet fiscal, amortissements, persistance
de projection, export (FR-023).

---

## Critères d'acceptation

- [ ] `GET /bilan/hypotheses/:id/projection` renvoie **3 exercices** (`rang` 1..3, libellés `N+1`, `N+2`,
      `N+3`), chacun avec **compte de résultat prévisionnel**, **plan de trésorerie annuel** et **bilan
      prévisionnel simplifié**.
- [ ] Les projections **découlent des hypothèses et de la base validée** : le CA du 1ᵉʳ exercice projeté
      vaut `round(totalProduitsN × (1+g))`, la trésorerie d'ouverture de N+1 vaut la trésorerie de clôture
      du snapshot, et la réponse **rappelle les ancres** utilisées (traçabilité : `snapshotId`, `version`,
      `exercice` de base + les 4 agrégats d'ancrage).
- [ ] **Équilibre du bilan simplifié** : `ecart === 0` et `equilibre === true` pour les 3 exercices, y
      compris avec des pourcentages produisant des arrondis.
- [ ] **Agnosticisme P7** : aucune constante de poste (`XI`, `BZ`, `CJ`, `ZH`, `RA`…) dans le code de
      projection ; un snapshot **sans TFT** (`tresorerieClotureN === null`) projette quand même, avec
      `tresorerieAncree === false` et une ouverture N+1 à `0`.
- [ ] **Gardes** : jeu d'hypothèses d'une autre org → **404** ; snapshot de base introuvable → **404
      `BASE_INTROUVABLE`** ; gate refusé → **403** ; sans jeton → **401**.
- [ ] **Déterminisme** : deux appels successifs renvoient une réponse **identique**.

---

## Notes techniques

- **`ProjectionAnnuelleService`** — service **pur** (aucune injection) : `projeter(ancres, hypotheses)`.
  C'est lui qui porte le modèle ; il est testable exhaustivement sans Mongo.
- **`ProjectionService`** — orchestration : `JeuHypothesesRepository.findById` (404 anti-énum) →
  `SnapshotLiasseRepository.findById(base.snapshotId)` (404 `BASE_INTROUVABLE`) → extraction des ancres →
  `ProjectionAnnuelleService.projeter`. **Lecture seule, aucune transaction.**
- **Ordre de déclaration des routes** : `/bilan/hypotheses/:id/projection` vit dans un **contrôleur
  distinct** ; les segments diffèrent de `@Get(':id')` de `JeuHypothesesController`, donc pas de collision
  — mais l'e2e le **prouve** (piège documenté dans CLAUDE.md).
- **Arrondis** : `Math.round` sur les 4 quantités multiplicatives uniquement ; tout le reste en entiers.
  `Math.round(-0.5) === -0` en JS ⇒ normaliser (`| 0` / `+ 0`) pour ne jamais sérialiser `-0`.
- **Unités** : montants en **unités mineures XOF entières** (aligné `BalanceCanonique`, STORY-101) ;
  pourcentages en points ; délais en jours (base 360).

---

## Dépendances

**Prérequis :** STORY-068 (hypothèses + base traçable) ✅ · STORY-065 (snapshot figé) ✅ · STORY-059/060/061
(agrégats d'ancrage) ✅.
**Débloque :** FR-020 (STORY-070, trésorerie mensuelle — réutilise les ancres et le BFR normatif),
FR-021 (STORY-071, scénarios comparés — dérive N jeux), FR-022/023 (consultation/export du prévisionnel).

---

## Definition of Done

- [ ] Lint 0 warning · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts · non-régression EPIC-012/013.
- [ ] **Mutation-test** sur les critères protecteurs : casser l'équilibre (retirer `−bfr(0)` de l'ancre
      résiduelle) et l'agnosticisme (forcer une ancre nulle) doit **virer au rouge**.
- [ ] **Vérif docker réelle** (jeu validé + snapshot réels en base, projection calculée, `ecart=0` constaté)
      consignée dans *Progress Tracking*.
- [ ] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [ ] Flux git : `MNV-069` sur `dev` + docs sur `main`, PR « Rebase and merge ».

---

## Story Points Breakdown

- Modèle de projection pur (CR + BFR + trésorerie + bilan simplifié + équilibre) : 2 pts ·
  extraction des ancres agnostiques + orchestration + endpoint/DTO : 1,5 pt · tests unit/e2e + mutation :
  1 pt · vérif docker : 0,5 pt · **Total : 5 pts**.

---

## Progress Tracking

**Status History :**
- 2026-07-23 : Créée (Scrum Master) — statut `defined`.

**Réalisé :** _(à compléter en dev-story)_

**Qualité (DoD) :** _(à compléter — lint / build / couverture / unit / e2e / non-régression)_

**Mutation-test :** _(à compléter — mutations prévues : ancre résiduelle privée de `− bfr(0)` ⇒ `ecart ≠ 0` ;
ancre trésorerie forcée à `0` ⇒ ouverture N+1 fausse ; base 365 au lieu de 360 ⇒ BFR normatif faux)_

**Vérification docker réelle :** _(à compléter — jeu validé + snapshot réels, projection calculée,
`ecart = 0` constaté, aucune écriture)_

**Actual Effort :** _(à compléter)_
