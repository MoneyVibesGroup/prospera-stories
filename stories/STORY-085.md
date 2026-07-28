# STORY-085 : Rattachement au plan comptable (transaction → compte SYSCOHADA) + ventilation → balance canonique

**Epic :** EPIC-020 — Adaptateur #3 : construction de balance, chemin A (cahiers + OCR)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A11 · `sprint-plan-atelier-balance-2026-07-12.md` §4.1 (frontière : l'Atelier fait **transaction → compte** ; `bilan-service` fait **compte → poste**) · `referentiels/table-de-passage-syscohada.json` (validée 100 %)
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 16 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A11 (rattachement au plan comptable + ventilation)

> **La pièce qui ferme l'adaptateur #3 : des cahiers, on obtient enfin une balance.** Les recettes (STORY-082) et les dépenses (STORY-083) sont des **transactions**, pas une balance. Cette story fournit (a) le **moteur de rattachement** générique — proposer le bon **compte SYSCOHADA** pour une transaction — et (b) l'**agrégation** des transactions en **soldes par compte**, produisant la **`BalanceCanonique`** (STORY-101) avec `source: 'ocr'`. C'est le point où le chemin A rejoint le hub, **au même contrat** que Sage (STORY-086) et l'IMF (STORY-102).

> **⚠️ Frontière à ne pas franchir.** L'Atelier fait **transaction → compte** (classe 6/7 + contreparties). Le passage **compte → poste de liasse** (table de passage SYSCOHADA → GUIDEF) reste dans **`bilan-service` (STORY-055)**. Ne **pas** dupliquer la table de passage ici.

---

## User Story

En tant que **cabinet comptable** ayant saisi les cahiers d'une PME,
je veux que le système **rattache chaque transaction au bon compte SYSCOHADA** et **agrège le tout en soldes par compte**,
afin d'obtenir une **balance équilibrée** exploitable par le Bilan, sans saisir une seule écriture en partie double.

---

## Description

### Contexte

Un cahier donne des **flux** (« 15/03 — vente 120 000 », « 18/03 — loyer 75 000 »). Une balance donne des **soldes par compte** (« `701` : 4 500 000 au crédit », « `6132` : 900 000 au débit »). Entre les deux, il faut :

1. **Rattacher** chaque transaction à un **compte** (classe 7 pour les recettes, 6 pour les dépenses) — proposé, modifiable (déjà amorcé en STORY-082/083, **généralisé ici**).
2. **Générer les contreparties** — c'est le point délicat. Une vente encaissée en banque, ce n'est pas seulement `701` au crédit : c'est aussi **`521` (banque) au débit**, et **`443` (TVA collectée) au crédit** si assujetti. **Sans contrepartie, la balance ne s'équilibre jamais** (`Σ débit ≠ Σ crédit` → rejet par `BalanceValidator`, STORY-101).
3. **Agréger** en soldes par compte, puis produire la **`BalanceCanonique`**.

> **La contrepartie est déduite du `moyenPaiement`** (espèces → caisse `57x` ; banque → `52x` ; **mobile money → compte de trésorerie dédié**, confirmé par l'observation terrain : `TMONEY` figure bien dans la balance Sage réelle). Un moyen de paiement manquant → **la ligne ne peut pas être ventilée** → signalée, non silencieuse.

### Périmètre

**Inclus :**

- **`RattachementService`** — moteur de proposition **transaction → compte** :
  - Règles : libellé + catégorie (dépenses) + tiers + `codeNaema` du profil (STORY-079) → **compte proposé**, **validé** contre le plan de comptes (`ReferentielProvider`, STORY-078).
  - **Surcharges par organisation** : `(orgId, motif|catégorie) → compte` mémorisées ; une correction faite une fois est **réutilisée** (apprentissage simple, déterministe, **traçable** — pas de « magie »).
  - Toujours **modifiable** ; **compte inconnu du plan → 400**.
- **`VentilationService`** — génération des **contreparties** :
  - **Recette** encaissée : `[compteProduit (7xx) au CRÉDIT]` + `[TVA collectée (44x) au CRÉDIT si assujetti]` + `[trésorerie (5xx) au DÉBIT]`.
  - **Dépense** payée : `[compteCharge (6xx) au DÉBIT]` + `[TVA déductible (44x) au DÉBIT si déductible]` + `[trésorerie (5xx) au CRÉDIT]`.
  - **Trésorerie déduite du `moyenPaiement`** : `ESPECES` → caisse (`57x`), `BANQUE` → banque (`52x`), `MOBILE_MONEY` → compte mobile money dédié (`5xx`, paramétrable par org).
  - **Créances / dettes** : une recette **non encaissée** (facture émise, `moyenPaiement` absent + `tiers` présent) → contrepartie **`411` clients** ; une dépense **non payée** → **`401` fournisseurs`**. Sinon : **erreur explicite** (`VENTILATION_IMPOSSIBLE`), jamais d'équilibrage arbitraire.
- **`AgregationService`** — transactions → `BalanceCanonique` :
  - Agrège **toutes** les écritures ventilées de l'exercice en **soldes par compte** (`debiteur` / `crediteur`).
  - Produit une **`BalanceCanonique`** (STORY-101) : `source: 'ocr'`, `referentiel` = système comptable du profil (`SN`/`SMT`, STORY-080), `version` incrémentale.
  - **`niveauPreuve` par ligne de balance** = **le plus faible** des niveaux des transactions qui l'alimentent (une agrégation ne « lave » pas une estimation) → alimente le **`statutPreuve`** global (FR-A27).
  - `POST /api/v1/balance/depuis-cahiers` (`@RequiresBalanceAccess`) : **dry-run par défaut → 200** (aperçu + contrôles) ; **`dryRun=false` → 201** (persiste via `BalanceRepository`, STORY-101). *(Sémantique alignée sur STORY-086.)*
- **Contrôle d'équilibre intégré** : l'agrégation **délègue** à `BalanceValidator` (STORY-101) — `Σ débit = Σ crédit`. Un déséquilibre → **400** avec le **détail des transactions non ventilables** (jamais de « ligne d'écart » ajoutée pour forcer l'équilibre).
- **Tests** : proposition de compte + surcharge org mémorisée ; ventilation des 3 moyens de paiement (espèces / banque / **mobile money**) ; recette non encaissée → `411` ; dépense non payée → `401` ; **moyen de paiement absent et pas de tiers → `VENTILATION_IMPOSSIBLE`** ; agrégation → **balance équilibrée** (`Σ D = Σ C`) ; `niveauPreuve` = le plus faible ; dry-run **200** sans persistance / persist **201** ; compte hors plan → 400.

**Hors périmètre :**

- **Table de passage compte → poste** (liasse) → **`bilan-service` STORY-055**. **Ne pas dupliquer.**
- **Saisie des cahiers** → STORY-082/083 ; **OCR** → STORY-084.
- **Contrôles de cohérence avancés** (articulation Bilan↔CR↔TFT) → **STORY-098**.
- **Rapprochement bancaire** (confronter la trésorerie aux relevés) → **STORY-089/090**.
- **Écritures d'inventaire / amortissements / provisions** (variation de stocks, dotations) → **hors v1** : signalées comme « à saisir manuellement » (avertissement), traitées en **STORY-094** pour les provisions fiscales.
- **Chemins B/C** (reconstruction) → hors v1 (D6).

### Flux

1. Les cahiers de l'exercice 2026 sont saisis (STORY-082/083, éventuellement via OCR — STORY-084).
2. Le cabinet lance : `POST /api/v1/balance/depuis-cahiers?exercice=2026` (**dry-run** par défaut).
3. **Rattachement** : chaque transaction reçoit son compte (proposé, déjà corrigé/surchargé par le cabinet).
4. **Ventilation** : chaque transaction devient **2 ou 3 écritures** équilibrées.
   - « 15/03 — vente 118 000 TTC, banque, assujetti » → `521` **D** 118 000 · `701` **C** 100 000 · `4431` **C** 18 000.
   - « 18/03 — loyer 75 000, TMoney » → `6132` **D** 75 000 · `5xx TMoney` **C** 75 000.
   - « 22/03 — facture émise 50 000, non encaissée » → `411` **D** 50 000 · `701` **C** 50 000.
5. **Agrégation** → soldes par compte → **`BalanceCanonique`** (`source: 'ocr'`, `referentiel: 'SN'`).
6. **Contrôle** : `Σ débit = Σ crédit` ✔ → **200** avec aperçu (+ avertissements : 2 transactions sans moyen de paiement **non ventilables**).
7. Le cabinet corrige les 2 transactions, relance en **`dryRun=false`** → **201** : la balance est **persistée** (STORY-101), prête pour les contrôles (STORY-098) puis le handoff vers `bilan-service` (STORY-099).

---

## Acceptance Criteria

- [ ] **`RattachementService`** propose un compte SYSCOHADA par transaction (règles libellé/catégorie/tiers/NAEMA), **validé contre le plan de comptes** (STORY-078) ; compte inconnu → **400** ; proposition **toujours modifiable**.
- [ ] **Surcharge par organisation** `(orgId, motif) → compte` **mémorisée et réutilisée**, **traçable** (qui, quand) — comportement **déterministe**, pas d'apprentissage opaque.
- [ ] **`VentilationService`** génère les **contreparties équilibrées** :
  - Recette encaissée → produit (7xx) **C** + TVA collectée (44x) **C** si assujetti + trésorerie (5xx) **D**.
  - Dépense payée → charge (6xx) **D** + TVA déductible (44x) **D** si déductible + trésorerie (5xx) **C**.
- [ ] **Trésorerie déduite du `moyenPaiement`** : `ESPECES` → caisse (57x), `BANQUE` → banque (52x), **`MOBILE_MONEY` → compte de trésorerie dédié** (paramétrable par org).
- [ ] **Créances/dettes** : recette non encaissée (tiers, sans paiement) → **`411`** ; dépense non payée → **`401`**.
- [ ] **Aucun équilibrage arbitraire** : une transaction non ventilable (ni moyen de paiement, ni tiers) → **`VENTILATION_IMPOSSIBLE`** listée explicitement ; **jamais** de « ligne d'écart » ajoutée pour forcer `Σ D = Σ C`.
- [ ] **`AgregationService`** produit une **`BalanceCanonique`** (STORY-101) : `source: 'ocr'`, `referentiel` = système comptable du profil (STORY-080), soldes par compte exacts au XOF.
- [ ] **Balance équilibrée** : `Σ débit = Σ crédit` (déléguée à `BalanceValidator`, STORY-101) ; déséquilibre → **400** avec le **détail** des transactions fautives.
- [ ] **`niveauPreuve` d'une ligne de balance = le plus faible** des niveaux des transactions qui l'alimentent (une agrégation ne « lave » pas une estimation) → alimente le `statutPreuve` (FR-A27).
- [ ] **`POST /balance/depuis-cahiers`** : **dry-run (défaut) → 200** (aperçu, **aucune persistance**) ; **`dryRun=false` → 201** (persiste via `BalanceRepository`). *(Même sémantique que STORY-086.)*
- [ ] **Aucune duplication de la table de passage** compte → poste (elle reste dans `bilan-service` STORY-055) — vérifié en revue.
- [ ] **Tests** : rattachement + surcharge, 3 moyens de paiement, 411/401, ventilation impossible, équilibre, niveauPreuve le plus faible, dry-run/persist, compte hors plan. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Ventilation — le cœur

```typescript
export interface EcritureVentilee {
  compte: string;
  sens: 'DEBIT' | 'CREDIT';
  montant: number;                 // XOF
  niveauPreuve: NiveauPreuveBalance;
}

ventilerRecette(l: LigneRecette, plan: PlanDeComptes, cfg: ComptesTresorerie): EcritureVentilee[] {
  const ecr: EcritureVentilee[] = [];
  const ht  = l.tva?.assujetti ? l.tva.montantHT  : l.montant;
  const tva = l.tva?.assujetti ? l.tva.montantTVA : 0;

  ecr.push({ compte: l.compteProduit, sens: 'CREDIT', montant: ht,  niveauPreuve: l.niveauPreuve }); // 7xx
  if (tva > 0) ecr.push({ compte: cfg.tvaCollectee, sens: 'CREDIT', montant: tva, niveauPreuve: l.niveauPreuve }); // 44x

  // Contrepartie : trésorerie si encaissé, sinon créance client
  const contrepartie = this.resoudreContrepartie(l, cfg);   // 52x / 57x / mobile money / 411
  if (!contrepartie) {
    throw new BadRequestException({ code: 'VENTILATION_IMPOSSIBLE', ligne: l.id }); // JAMAIS d'écart forcé
  }
  ecr.push({ compte: contrepartie, sens: 'DEBIT', montant: ht + tva, niveauPreuve: l.niveauPreuve });

  return ecr; // Σ débit = Σ crédit par construction
}

resoudreContrepartie(l, cfg): string | null {
  switch (l.moyenPaiement) {
    case 'ESPECES':      return cfg.caisse;         // 57x
    case 'BANQUE':       return cfg.banque;         // 52x
    case 'MOBILE_MONEY': return cfg.mobileMoney;    // 5xx dédié (TMoney/Flooz — confirmé terrain)
    default:             return l.tiers ? cfg.clients /* 411 */ : null; // non encaissé → créance
  }
}
```

### Agrégation → balance canonique

```typescript
async agreger(orgId: string, exercice: DateRange): Promise<BalanceCanonique> {
  const ecritures = [
    ...(await this.ventilerToutesRecettes(orgId, exercice)),
    ...(await this.ventilerToutesDepenses(orgId, exercice)),
  ];

  const parCompte = new Map<string, { d: number; c: number; preuve: NiveauPreuveBalance }>();
  for (const e of ecritures) {
    const agg = parCompte.get(e.compte) ?? { d: 0, c: 0, preuve: 'fichier' };
    if (e.sens === 'DEBIT') agg.d += e.montant; else agg.c += e.montant;
    agg.preuve = pireNiveau(agg.preuve, e.niveauPreuve); // ⚠️ le plus FAIBLE l'emporte
    parCompte.set(e.compte, agg);
  }

  const lignes = [...parCompte].map(([compte, a]) => ({
    compte,
    libelle: this.plan.libelle(compte),
    debiteur:  a.d > a.c ? a.d - a.c : undefined,   // solde net
    crediteur: a.c > a.d ? a.c - a.d : undefined,
    niveauPreuve: a.preuve,
  }));

  return this.balanceFactory.build({ orgId, exercice, source: 'ocr', lignes }); // → validée par STORY-101
}
```

---

## Décisions de cadrage (2026-07-28)

**D-085-1 — La balance ne se construit PAS à partir des totaux par compte de 082/083.**
STORY-082 expose `calculerTotauxParCompte` (classe 7 au crédit, HT) et STORY-083
`calculerTotauxParCompteCharge` (classe 6 au débit, montant imputé). Ces deux vues sont **justes
séparément et inéquilibrées ensemble** : `Σ crédit produits ≠ Σ débit charges`, par construction —
il leur manque toute la trésorerie, la TVA et les tiers. Les réutiliser pour bâtir la balance
conduirait droit à un déséquilibre systématique qu'on serait tenté de « corriger ».
085 **ventile ligne à ligne** en écritures équilibrées, puis agrège les écritures. Les fonctions de
082/083 restent en place : elles servent la **vue de travail du comptable**, pas la balance.

**D-085-2 — L'équilibre est une propriété d'arithmétique, pas un contrôle a posteriori.**
Chaque transaction produit 2 ou 3 écritures dont `Σ D = Σ C` **par construction entière** :

| | Débit | Crédit |
|---|---|---|
| Recette | contrepartie = `montant` (TTC) | produit `7xx` = HT · TVA collectée `443` = TVA |
| Dépense | charge `6xx` = `montantImpute` · TVA déductible `445` = TVA **si déductible** | contrepartie = `montant` (TTC) |

Côté dépense l'identité tient dans les **deux** branches de D-083-2 : TVA déductible ⇒
`HT + TVA = TTC` ; TVA non déductible ⇒ `TTC + 0 = TTC` (la TVA non récupérable est **dans** la
charge, elle ne s'écrit pas en classe 4). C'est **le** piège de cette story : imputer le HT et
écrire quand même la TVA en `445` sur une ligne non déductible déséquilibrerait la balance **et**
créerait une créance fiscale inexistante. Le `BalanceValidator` (STORY-101) est appelé quand même —
il **vérifie**, il ne rattrape pas.

**D-085-3 — Ni compte d'attente, ni ligne d'écart, jamais.** Une transaction sans moyen de paiement
**et** sans tiers n'est pas ventilable : elle est **exclue** de l'agrégation et **listée** dans
`VENTILATION_IMPOSSIBLE` (avec `id`, `date`, `libellé`, `montant`). Une balance amputée mais
équilibrée et une liste explicite valent mieux qu'une balance complète et fausse.

**D-085-4 — La balance porte le solde NET par compte** (`debit = max(0, D−C)`, `credit = max(0, C−D)`,
l'autre à `0`). Cohérent avec l'adaptateur Sage, qui normalise déjà des **soldes** (`debiteur`/
`crediteur`), et avec `bilan-service` qui dérive ses postes de soldes. Les mouvements bruts ne sont
pas perdus : ils restent dans les cahiers, ligne à ligne.

**D-085-5 — Comptes de contrepartie : défauts SYSCOHADA + surcharge par organisation.**
Nouvelle collection `comptes_ventilation` (un document par org, snake_case). Défauts *structurels*
lus dans le plan du référentiel — pas de la fiscalité, donc aucune entorse à NFR-A06 :
`571` caisse · `521` banque · `551` monnaie électronique (**mobile money**, compte `55` du plan
SYSCOHADA révisé) · `443` TVA facturée · `445` TVA récupérable · `411` clients · `401` fournisseurs.
Chacun est surchargeable ; chaque compte surchargé est **validé contre le plan** (400 sinon).

**D-085-6 — La surcharge de rattachement porte sur le LIBELLÉ et le TIERS, pas sur la catégorie.**
Côté **dépenses**, le rattachement passe déjà par la **catégorie**, dont le `compteCharge` est
éditable et mémorisé par organisation depuis STORY-083 : c'est **déjà** la surcharge
`(org, catégorie) → compte`. En ajouter une seconde créerait deux sources de vérité qui divergeraient
au premier remappage. La collection `surcharges_rattachement` porte donc `(orgId, type, valeur) →
compte`, `type ∈ {LIBELLE, TIERS}`, tracée (`parUserId`, `le`), unique par `(orgId, type, valeur)`.
Elle s'applique **à la proposition** (chemin de saisie), jamais à l'agrégation : au moment d'agréger,
le compte porté par la ligne est **la décision du comptable** — la réécrire effacerait sa correction.

**D-085-7 — Le `referentiel` de la balance vient du profil, et n'est jamais deviné.**
`systemeComptable` (`SN`/`SMT`, STORY-080) → tag de la balance. Profil absent ou système non
déterminé ⇒ **409 `SYSTEME_COMPTABLE_INDETERMINE`**. Retomber sur `SN` par défaut taguerait une
balance SMT comme normale et fausserait la liasse en aval, sans la moindre erreur visible.

**D-085-8 — `niveauPreuve` d'un compte = le plus faible de ses écritures**, via `RANG_NIVEAU_PREUVE`
déjà partagé par les deux cahiers. Les contreparties (trésorerie, TVA, tiers) **héritent** du niveau
de la transaction qui les engendre : une trésorerie alimentée par une recette estimée n'est pas
justifiée.

**D-085-9 — Écritures d'inventaire : avertissement explicite, jamais de silence.** La balance des
cahiers ne porte ni stocks, ni amortissements, ni provisions (hors v1). Le résultat porte
systématiquement l'avertissement « aucune écriture d'inventaire — à saisir manuellement » : une
balance équilibrée sans dotations *paraît* complète, et c'est exactement ce qui ferait signer une
liasse fausse.

**D-085-10 — Pas de gel spécifique à l'agrégation (hook documenté).** Le versioning est append-only :
relancer sur un exercice dont la balance est déjà VALIDÉE empile une version `N+1`. Les cahiers, eux,
sont déjà figés par NFR-A07 (STORY-082/083) : la version N+1 sera donc identique. Refuser
explicitement relève des contrôles STORY-098 — **hors périmètre ici**.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Balance déséquilibrée** (contrepartie manquante) | Ventilation **par construction équilibrée** ; transaction non ventilable → **erreur explicite listée**, jamais de « ligne d'écart » |
| Tentation d'ajouter un compte d'attente pour forcer `Σ D = Σ C` | **Interdit** : le déséquilibre **doit** remonter (STORY-101 `BalanceValidator`) — un équilibre forcé masque une erreur |
| Mobile money mal ventilé | Compte de trésorerie **dédié et paramétrable** par org (TMoney/Flooz observés en balance réelle) |
| Mauvais compte proposé en masse | Surcharge `(orgId, motif) → compte` **mémorisée**, **déterministe** et **traçable** ; correction unique, réutilisée |
| Agrégation « lave » une estimation | `niveauPreuve` d'une ligne = **le plus faible** de ses transactions → `statutPreuve` honnête (FR-A27) |
| Duplication de la table de passage | Frontière explicite : **compte → poste reste dans `bilan-service`** (revue obligatoire) |
| Écritures d'inventaire absentes (stocks, amortissements) | **Hors v1** : avertissement explicite « à saisir manuellement » ; provisions fiscales → STORY-094 |

---

## Definition of Done

- [ ] `RattachementService` (proposition + validation plan + surcharge org tracée)
- [ ] `VentilationService` (contreparties équilibrées ; espèces/banque/**mobile money** ; 411/401)
- [ ] **`VENTILATION_IMPOSSIBLE`** explicite — aucun équilibrage arbitraire
- [ ] `AgregationService` → **`BalanceCanonique`** (`source: 'ocr'`), soldes exacts
- [ ] Équilibre `Σ D = Σ C` vérifié (délégué à STORY-101) ; déséquilibre → 400 détaillé
- [ ] `niveauPreuve` = le plus faible (FR-A27)
- [ ] `POST /balance/depuis-cahiers` : dry-run **200** / persist **201**
- [ ] Aucune duplication de la table de passage (revue)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] **e2e chemin A** : cahiers saisis → agrégation → balance **équilibrée** persistée
- [ ] Non-régression : STORY-082/083/084 verts

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Cadrage (décisions D-085-1..10) | ✅ 2026-07-28 | branche `MNV-085` sur `docs/` |
| Développement | ⏳ | branche `MNV-085` sur `balance-service` |
| Portes DoD (lint/build/couverture/unit/e2e) | ⏳ | |
| Vérification docker (persistance + atomicité) | ⏳ | |
| Revue de code | ⏳ | |
| Revue de sécurité | ⏳ | |

---

**Status:** in_progress
**Dependencies:** STORY-082 (recettes), STORY-083 (dépenses), STORY-084 (OCR — optionnel), STORY-078 (plan de comptes), STORY-080 (système comptable → tag `referentiel`), **STORY-101** (contrat + `BalanceValidator` + persistance)
**Ferme** l'adaptateur #3 du hub (D13) · **Alimente** STORY-090 (rapprochement), STORY-091→095 (moteur fiscal), STORY-098 (contrôles), STORY-099 (handoff)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A11 · `sprint-plan-atelier-balance-2026-07-12.md` §4.1 (frontière transaction→compte vs compte→poste)
