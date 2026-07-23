# STORY-069 : Projection annuelle 3 ans (CR prévisionnel + trésorerie + bilan simplifié N+1..N+3) — FR-019

**Epic :** EPIC-013 — Prévisionnel (mensuel 12 mois + annuel 3 ans) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-019 (CR prévisionnel + plan de trésorerie annuel + bilan prévisionnel simplifié sur N+1..N+3 ; « les projections découlent des hypothèses (FR-018) et de la base validée ») ; **dépend FR-018**
**Réf. code livré :** **STORY-068** (`JeuHypotheses` — 9 paramètres + `base` traçable) · **STORY-065** (`SnapshotLiasse` — la base validée figée : `liasse`, `soldesN`) · **STORY-060/061** (`CompteResultatProduit.totalProduitsN` · `TftProduit.tresorerieClotureN`) · **STORY-059** (`ControleEquilibre.totalActifN`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + revue de code + revue de sécurité + intégrée dans `dev` le 2026-07-23 — PR #26 bilan-service, MNV-069 « Rebase and merge », HEAD `0d2f7bc`, branche supprimée)
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
| `produitsBase` | `liasse.compteResultat.totalProduitsN` | somme des postes `regle='PRODUIT'` — pilotée par le référentiel |
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
produits(n) = round( produits(n-1) × (1 + g) )                    produits(0) = produitsBase
margeBrute(n)      = round( produits(n) × tauxMargePct/100 )
coutDesVentes(n)   = produits(n) − margeBrute(n)
chargesExploitation(n) = round( produits(n) × tauxChargesPct/100 )
resultatNet(n)     = margeBrute(n) − chargesExploitation(n)
```

**2. BFR normatif** (les délais des hypothèses, en jours, sur base **360 jours**)
```
stocks(n)             = round( coutDesVentes(n) × delaiBfrStocksJours / 360 )
creancesClients(n)    = round( produits(n) × delaiBfrClientsJours / 360 )
dettesFournisseurs(n) = round( coutDesVentes(n) × delaiBfrFournisseursJours / 360 )
bfr(n)                = stocks(n) + creancesClients(n) − dettesFournisseurs(n)
```
Le **BFR d'ancrage `bfr(0)`** est calculé avec la **même** formule normative sur `produitsBase`
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
**y compris après arrondis** : les 4 seules quantités arrondies (produits, marge, charges d'exploitation, et les
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

- [x] `GET /bilan/hypotheses/:id/projection` renvoie **3 exercices** (`rang` 1..3, libellés `N+1`, `N+2`,
      `N+3`), chacun avec **compte de résultat prévisionnel**, **plan de trésorerie annuel** et **bilan
      prévisionnel simplifié**.
- [x] Les projections **découlent des hypothèses et de la base validée** : les produits du 1ᵉʳ exercice projeté
      valent `round(totalProduitsN × (1+g))`, la trésorerie d'ouverture de N+1 vaut la trésorerie de clôture
      du snapshot, et la réponse **rappelle les ancres** utilisées (traçabilité : `snapshotId`, `version`,
      `exercice` de base + les 4 agrégats d'ancrage).
- [x] **Équilibre du bilan simplifié** : `ecart === 0` et `equilibre === true` pour les 3 exercices, y
      compris avec des pourcentages produisant des arrondis.
- [x] **Agnosticisme P7** : aucune constante de poste (`XI`, `BZ`, `CJ`, `ZH`, `RA`…) dans le code de
      projection ; un snapshot **sans TFT** (`tresorerieClotureN === null`) projette quand même, avec
      `tresorerieAncree === false` et une ouverture N+1 à `0`.
- [x] **Gardes** : jeu d'hypothèses d'une autre org → **404** ; snapshot de base introuvable → **404
      `BASE_INTROUVABLE`** ; gate refusé → **403** ; sans jeton → **401**.
- [x] **Déterminisme** : deux appels successifs renvoient une réponse **identique**.

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

- [x] Lint 0 warning · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts · non-régression EPIC-012/013.
- [x] **Mutation-test** sur les critères protecteurs : casser l'équilibre (retirer `−bfr(0)` de l'ancre
      résiduelle) et l'agnosticisme (forcer une ancre nulle) doit **virer au rouge**.
- [x] **Vérif docker réelle** (jeu validé + snapshot réels en base, projection calculée, `ecart=0` constaté)
      consignée dans *Progress Tracking*.
- [x] Statut synchronisé (doc / `sprint-status.yaml` / Progress Tracking) + `completed_date`.
- [x] Flux git : `MNV-069` sur `dev` + docs sur `main`, PR « Rebase and merge ».

---

## Story Points Breakdown

- Modèle de projection pur (CR + BFR + trésorerie + bilan simplifié + équilibre) : 2 pts ·
  extraction des ancres agnostiques + orchestration + endpoint/DTO : 1,5 pt · tests unit/e2e + mutation :
  1 pt · vérif docker : 0,5 pt · **Total : 5 pts**.

---

## Progress Tracking

**Status History :**
- 2026-07-23 : Créée (Scrum Master) — statut `defined`.
- 2026-07-23 : Développée (Developer) — dérivation pure `(snapshot figé, hypothèses)` → 3 exercices.
- 2026-07-23 : Revue de code (fan-out `nestjs-prospera` / `test-prospera` / `architecte-prospera`) —
  **4 constats retenus et corrigés** dans un commit dédié (dont **2 angles morts de test réels**).
- 2026-07-23 : Revue de sécurité (PR #26) — **0 vulnérabilité exploitable**.
- 2026-07-23 : Intégrée dans `dev` (PR #26, MNV-069, « Rebase and merge », HEAD `0d2f7bc`, branche
  supprimée). Statut **done**.

**Réalisé :**
- **`projection.types.ts`** — contrats purs : `AncresProjection`, `CompteResultatPrevisionnel`,
  `BfrNormatif`, `TresoreriePrevisionnelle`, `BilanSimplifiePrevisionnel`, `ControleEquilibreProjection`,
  `ExerciceProjete`, `ProjectionAnnuelle` + `JOURS_ANNEE_COMMERCIALE`, `HORIZON_EXERCICES`,
  `MODELE_PROJECTION_VERSION`.
- **`ancrage.ts`** — **frontière d'ancrage** en fonction pure exportée `extraireAncres(liasse)` : le seul
  module autorisé à connaître `LiasseProduite`. Ne lit que des **agrégats** (totaux du CR, `totalActifN`,
  `tresorerieClotureN`) — **aucun code de poste**, invariant P7 vérifié par grep en revue.
- **`ProjectionAnnuelleService.projeter`** — moteur **pur** (0 injection) : CR prévisionnel, BFR normatif
  (base 360, ancrage par la **même** formule), trésorerie cumulée, bilan simplifié. Arrondi sur les seules
  quantités multiplicatives ⇒ `ecart = 0` **exact**. `controleEquilibre(ecart)` exportée à part (testable
  hors du cas nominal). Normalisation `-0` → `0`.
- **`ProjectionService.projeter(id)`** — orchestration lecture seule : jeu d'hypothèses (404 anti-énum) →
  snapshot `base.snapshotId` (404 `BASE_INTROUVABLE`) → `extraireAncres` → moteur.
- **`ProjectionController`** — `GET /bilan/hypotheses/:id/projection`, `@RequiresBilanAccess` + `@Roles`,
  Swagger complet. DTO rappelant `modeleVersion`, la base traçable et les ancres.
- **Hooks inertes documentés** : IS/paquet fiscal (`resultatNet` = **avant impôt**), amortissements
  (`CAF = résultat net`), échéancier non uniforme (FR-020), persistance d'une projection figée (FR-023),
  marqueur référentiel pour un CA exact.

**Qualité (DoD) :** lint 0 warning · build OK · **510 unit + 115 e2e** verts · `projection/` (y compris
`ancrage.ts`) **100 / 100 / 100 / 100**, global **98,46 / 92,69 / 98,88 / 98,42** (seuils 65/90/90/90) ·
non-régression EPIC-012/013.

**Constats de revue traités (commit dédié `e5e42ac`) :**
1. **`equilibre` codé en dur à `true` franchissait toute la suite** — le modèle ne produit jamais d'écart
   non nul, donc la relation n'était jamais éprouvée. Dérivation extraite en `controleEquilibre()`
   exportée, testée sur des écarts non nuls.
2. **BFR figé sur celui de la base franchissait toute la suite** — l'équilibre ne dépend que de la
   cohérence interne `variationBfr = bfr(n) − bfr(n−1)`, jamais de la valeur réelle du BFR. Ajout de
   **valeurs figées indépendantes** (BFR et variations des 3 exercices, recalculées hors du code testé).
3. **Frontière d'ancrage privée** → promue en unité pure exportée (`ancrage.ts`), pour que 070/071 ne
   réimplémentent pas leur extraction (point d'entrée le plus probable d'un code de poste en dur).
4. **Nommage qui mentait** : `totalProduitsN` n'est **pas** le chiffre d'affaires (produits financiers,
   HAO, reprises inclus) → renommé `produitsBase` / `produits`, approximation documentée.
   *Ajout* : `MODELE_PROJECTION_VERSION` échoée — une projection n'est reproductible que **pour une
   version de modèle donnée**.

**Mutation-test (preuve que les tests filtrent) — 5 mutations, toutes rouges, toutes restaurées :**
- ancre résiduelle privée de `− bfr(0)` ⇒ **5 tests rouges** ;
- ancre de trésorerie forcée à `0` ⇒ **1 unit + 1 e2e rouges** ;
- base 365 au lieu de 360 ⇒ **1 test rouge** ;
- `equilibre: true` codé en dur ⇒ **1 test rouge** (invisible avant la correction n°1) ;
- BFR figé sur la base au lieu des produits projetés ⇒ **2 tests rouges** (invisible avant la n°2).

**Vérification docker réelle :** stack `docker compose down -v` puis neuve (mongo rs0 + kafka + IdP +
bilan-service), org réelle créée via `register`/`login` sur l'IdP, **JWT RS256 réel**. Service redémarré
après les corrections de revue (`Found 0 errors. Watching for file changes.`).
- Base préparée en base réelle : jeu d'états **VALIDÉ** + `snapshots_liasse` v1 + jeu d'hypothèses
  `prudent` (croissance 10 %, marge 30 %, charges 20 %, BFR 45/60/30 j, invest. 5 M, fin. 3 M, remb. 1 M).
- `GET /bilan/hypotheses/:id/projection` → **200**, `modeleVersion = 1.0.0`, **3 exercices** `N+1..N+3`
  (millésimes `2026`/`2027`/`2028` déduits).
- **Ancres conformes aux documents Mongo** relus par `mongosh` dans `snapshots_liasse` :
  `totalProduitsN = 100 000 000`, `totalChargesN = 80 000 000`, `resultatNetN = 20 000 000`,
  `totalActifN = 250 000 000`, `tresorerieClotureN = 12 000 000`.
- **Équilibre** : `ecart = 0` / `equilibre = true` sur les 3 exercices
  (totalActif = totalPassif = 263 000 000 / 277 100 000 / 292 410 000).
- **BFR variable** par exercice (7 333 334 / 8 066 666 / 8 873 334), variations non nulles
  (666 668 / 733 332 / 806 668) — conforme au recalcul indépendant.
- **Déterminisme** : deux appels ⇒ réponses **strictement identiques**.
- **Gardes** : jeu d'une **autre org** → **404 `HYPOTHESES_INTROUVABLE`** · `base.snapshotId` inconnu →
  **404 `BASE_INTROUVABLE`** · sans jeton → **401**.
- **Aucune écriture** : compteurs `jeux_hypotheses` / `snapshots_liasse` / `jeux_etats` / `audit_events`
  **identiques avant et après** les appels — la projection est bien une dérivation pure.
- Endpoint présent dans Swagger (`/api/docs-json`).

**Revue de sécurité (PR #26) :** **aucune vulnérabilité exploitable** (confiance ≥ 80). Trois points
instruits et écartés avec preuve : franchissement de frontière tenant sur `jeu.base.snapshotId`
(repository tenant-scoped fail-closed + `snapshotId` jamais contrôlable par l'appelant) · `tenantObjectId`
au retour ignoré (garde décorative, non load-bearing — `BilanAccessGuard` + `TenantContext` fail-closed
portent le contrôle) · injection NoSQL via `:id` (Express produit toujours une `string` sur `req.params`,
plus `ObjectId.isValid` en amont).

**Points ouverts remontés pour le cadrage des stories suivantes (hors périmètre 069) :**
- **FR-023 (export)** : un prévisionnel exporté n'est pas recalculable aujourd'hui — les paramètres
  d'hypothèses sont **écrasés en place** par `PUT` (068). Voie recommandée : figer les **entrées**
  (historiser les versions d'hypothèses en append-only, patron 065) plutôt que la sortie.
- **STORY-071 (scénarios comparés)** : rien n'impose que N jeux comparés partagent le **même**
  `base.snapshotId` — invariant à porter par 071.
- **STORY-070/071** : réutiliser `extraireAncres` et le BFR normatif plutôt que de les réimplémenter.

**Actual Effort :** ~5 pts (conforme).
