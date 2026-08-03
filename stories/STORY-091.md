# STORY-091 : Détermination du résultat fiscal (réintégrations / déductions, codes DSF)

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A18 · `rapport-bilan-logique-metier-2026-07-12.md` §12/§15 (section « Résultat fiscal » de la GUIDEF : 23 postes) · `referentiels/paquet-fiscal-togo-2026.json` (codes de réintégration 10-80, codes de déduction 90-170) · CGI Togo 2026
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 18 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A18 (détermination du résultat fiscal)

> **Le pont entre la comptabilité et l'impôt — et le socle de tout le conseil fiscal.** Le **résultat comptable** (produits − charges) n'est **pas** la base imposable. Le **résultat fiscal** s'en déduit par des **retraitements extra-comptables** :
>
> **Résultat fiscal = Résultat comptable + Réintégrations − Déductions − Déficits reportables**
>
> Les **réintégrations** rajoutent les charges que le fisc n'admet pas (amendes, charges non justifiées, cadeaux au-delà du plafond…). Les **déductions** retirent les produits non imposables ou déjà taxés. Chaque retraitement porte un **code officiel de la DSF** — ce sont **exactement** les 23 postes de la section « Résultat fiscal » de la GUIDEF. Cette story les **calcule**, les **justifie**, et **prépare le terrain** de la liquidation (STORY-092) et de l'optimisation légale (STORY-096).

---

## User Story

En tant que **cabinet comptable**,
je veux que le système **calcule le résultat fiscal** à partir du résultat comptable, en appliquant les **réintégrations et déductions** avec leur **code DSF officiel**,
afin d'obtenir la **base imposable exacte**, **justifiée ligne à ligne**, et prête pour la liquidation de l'impôt et pour la défense en contrôle.

---

## Description

### Contexte

Deux sources alimentent les retraitements, et c'est ce qui rend le calcul **fiable plutôt que déclaratif** :

1. **Les retraitements déjà posés à la saisie** (STORY-083) : chaque `LigneDepense` porte `deductible` + `codeReintegration` (proposés depuis la catégorie, confirmés par le comptable). Le moteur n'a qu'à **agréger** — pas à ré-analyser 4 000 lignes en fin d'exercice.
2. **Les retraitements « de clôture »** que rien ne peut déduire d'une ligne de dépense : amortissements excédentaires, provisions non déductibles, **déficits reportables** des exercices antérieurs, plus-values à régime particulier… → **saisis explicitement** par le comptable, avec un **code DSF** et une **justification**.

> **Aucun retraitement n'est inventé, aucun n'est silencieux (NFR-A04).** Chaque ligne porte : un **code officiel** (du paquet fiscal), un **montant**, une **base légale** (article du CGI), une **justification**, et éventuellement une **pièce**. C'est ce qui rendra la liasse **défendable** (STORY-097) — et ce qui interdit toute minoration non documentée.

**Les codes viennent du paquet fiscal** (`TG@2026`, STORY-078) — **jamais** du code source : une réforme change les codes sans redéploiement (NFR-A06).

### Périmètre

**Inclus :**

- **`ResultatComptableService`** — calcul du résultat comptable depuis la **balance** (STORY-101) :
  - `Résultat comptable = Σ produits (classe 7) − Σ charges (classe 6)`.
  - Doit être **cohérent** avec le compte `12x` de la balance si présent → **écart signalé** (contrôle d'articulation, cf. STORY-098).
- **`RetraitementService`** — les retraitements extra-comptables :
  - **Agrégation automatique** depuis les cahiers (STORY-083) : `Σ montants des LigneDepense` avec `deductible: false`, **groupés par `codeReintegration`** → une ligne de réintégration par code, **traçable jusqu'aux lignes sources**.
  - **Saisie manuelle** (`POST /api/v1/fiscal/retraitements`) : `{ code, sens: REINTEGRATION|DEDUCTION, montant, baseLegale, justification, pieceRef? }` — le `code` est **validé** contre le paquet fiscal (**code inconnu → 400**).
  - **`justification` et `baseLegale` OBLIGATOIRES** pour tout retraitement **manuel** (un retraitement non justifié est un retraitement indéfendable).
  - CRUD + **immutabilité** : après validation de la liasse, tout retraitement est **figé** (**409**).
- **Déficits reportables** :
  - `POST /api/v1/fiscal/deficits` : déficits des exercices antérieurs (montant, exercice d'origine).
  - **Imputation** sur le résultat fiscal **bénéficiaire**, dans la limite des règles du paquet (durée de report, plafond éventuel) → **jamais au-delà**, jamais pour créer un déficit artificiel.
  - **Suivi du stock** : `GET /api/v1/fiscal/deficits` → déficits restants par exercice d'origine (avec date d'expiration).
- **`ResultatFiscalService.calculer(orgId, exercice)`** — l'assemblage :
  ```
  Résultat comptable ................... R
  + Σ Réintégrations (par code DSF) .... + I
  − Σ Déductions (par code DSF) ........ − D
  = Résultat fiscal avant déficits ..... R + I − D
  − Déficits reportables imputés ....... − F   (dans la limite du disponible)
  = RÉSULTAT FISCAL .................... base imposable (STORY-092)
  ```
  - Sortie **détaillée** : le **tableau des 23 postes** de la section « Résultat fiscal » de la DSF, chaque poste avec son **code**, son **montant** et ses **lignes sources**.
  - **Déficit fiscal** (résultat négatif) → **aucun IS de droit commun**, mais **la MFP reste due** (plancher — STORY-092) : le résultat fiscal négatif **alimente le stock de déficits reportables**.
- **`GET /api/v1/fiscal/resultat-fiscal?exercice=`** → le tableau complet + **traçabilité** (chaque montant remonte à ses lignes sources ou à sa saisie manuelle).
- **Tests** : résultat comptable = produits − charges ; **agrégation des non-déductibles par code** (depuis STORY-083) ; retraitement manuel **sans justification → 400** ; **code inconnu du paquet → 400** ; imputation de déficits **dans la limite du stock** (jamais au-delà) ; **résultat négatif → déficit reportable créé, IS de droit commun nul** ; traçabilité (un montant de réintégration → ses lignes de dépense) ; immutabilité après validation (**409**) ; codes **lus du paquet** (aucun en dur).

**Hors périmètre :**

- **Liquidation de l'impôt** (`IS = max(MFP, IS)`, acomptes, crédits) → **STORY-092**.
- **TVA & autres taxes** → **STORY-093**.
- **Écriture des provisions dans la balance** → **STORY-094**.
- **Régime synthétique / TPU** (pas de résultat fiscal au sens du réel) → **STORY-095**.
- **Simulation d'optimisation** (« et si je provisionnais ? ») → **STORY-096** — qui **rejouera** ce moteur sur des scénarios.
- **Rendu des états fiscaux dans la liasse** (mise en page DSF) → **`bilan-service` EPIC-011** (qui **consomme** ce calcul).

### Flux

1. La balance de l'exercice 2026 est produite (Sage, cahiers ou IMF) et **équilibrée** (STORY-101).
2. Le cabinet demande le résultat fiscal : `GET /api/v1/fiscal/resultat-fiscal?exercice=2026`.
3. **Résultat comptable** : produits 48 000 000 − charges 41 200 000 = **6 800 000**.
4. **Réintégrations agrégées automatiquement** (depuis les cahiers, STORY-083) :
   - code `20` — Amendes et pénalités : **65 000** (3 lignes sources)
   - code `30` — Charges non justifiées : **240 000** (12 lignes sources)
5. **Retraitements manuels** saisis par le comptable :
   - code `40` — Amortissements excédentaires : **180 000** (base légale : CGI art. …, justification, pièce)
   - code `120` — Produits déjà taxés (déduction) : **−90 000**
6. **Résultat fiscal avant déficits** = 6 800 000 + 485 000 − 90 000 = **7 195 000**.
7. **Déficits reportables** : stock 2024 = 2 000 000 → **imputés** (dans la limite du paquet) → **résultat fiscal = 5 195 000**.
8. Le tableau des **23 postes DSF** est produit, chaque montant **traçable** jusqu'à sa source.
9. **STORY-092** liquide l'impôt : `IS = max(MFP 1 % du CA HT ; IS 27 % × 5 195 000)`.

---

## Acceptance Criteria

- [ ] **Résultat comptable** calculé depuis la balance (`Σ classe 7 − Σ classe 6`) ; **écart** avec le compte `12x` (si présent) **signalé** (articulation).
- [ ] **Agrégation automatique des réintégrations** depuis les cahiers (STORY-083) : `LigneDepense` avec `deductible: false`, **groupées par `codeReintegration`** — **traçables jusqu'aux lignes sources**.
- [ ] **Retraitement manuel** : `code` **validé contre le paquet fiscal** (**code inconnu → 400**) ; **`justification` + `baseLegale` OBLIGATOIRES** (sinon **400**) — un retraitement non justifié est indéfendable (NFR-A04).
- [ ] **Codes lus du paquet fiscal** (`TG@2026` : réintégrations 10-80, déductions 90-170) — **aucun code en dur** (NFR-A06).
- [ ] **Déficits reportables** : stock suivi par exercice d'origine ; **imputation limitée au disponible** et aux règles du paquet (durée/plafond) — **jamais au-delà**, jamais pour fabriquer un déficit.
- [ ] **`ResultatFiscalService.calculer()`** applique : `R + Réintégrations − Déductions − Déficits imputés` = **résultat fiscal**.
- [ ] **Résultat fiscal négatif** → **déficit reportable créé** (alimente le stock) ; **IS de droit commun nul** — **mais la MFP reste due** (plancher, STORY-092) : le moteur ne conclut **pas** « aucun impôt ».
- [ ] **Tableau des postes DSF** (section « Résultat fiscal » — 23 postes GUIDEF) produit avec **code**, **montant**, **lignes sources**.
- [ ] **Traçabilité (NFR-A07)** : chaque montant remonte à ses **lignes sources** (cahiers) ou à sa **saisie manuelle** (auteur, date, base légale, pièce).
- [ ] **Immutabilité** : après validation de la liasse, tout retraitement est **figé** → **409** sur modification.
- [ ] **Tests** : résultat comptable, agrégation par code, retraitement sans justification (400), code inconnu (400), déficits (limite du stock), résultat négatif → déficit + MFP due, traçabilité, immutabilité, aucun code en dur. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Le calcul

```typescript
export interface LigneRetraitement {
  code: string;                        // code DSF du paquet fiscal (ex. '20', '120')
  libelle: string;                     // du paquet
  sens: 'REINTEGRATION' | 'DEDUCTION';
  montant: number;                     // XOF, positif

  origine: 'AUTO_CAHIERS' | 'MANUEL';
  lignesSources?: string[];            // ids des LigneDepense (si AUTO) — traçabilité
  baseLegale?: string;                 // OBLIGATOIRE si MANUEL (ex. « CGI TG 2026, art. … »)
  justification?: string;              // OBLIGATOIRE si MANUEL
  pieceRef?: string;

  parUserId?: string;
  le?: Date;
}

export interface ResultatFiscal {
  exercice: DateRange;
  resultatComptable: number;
  reintegrations: LigneRetraitement[];
  deductions: LigneRetraitement[];
  totalReintegrations: number;
  totalDeductions: number;
  resultatAvantDeficits: number;
  deficitsImputes: Array<{ exerciceOrigine: number; montant: number }>;
  resultatFiscal: number;              // ← base imposable (STORY-092)
  deficitGenere?: number;              // si résultat < 0 → alimente le stock reportable
}
```

```typescript
async calculer(orgId: string, exercice: DateRange): Promise<ResultatFiscal> {
  const paquet = await this.paquetFiscal.get(pays, exercice.fin.getFullYear());  // STORY-078

  const resultatComptable = await this.resultatComptable.calculer(orgId, exercice);

  // 1) Réintégrations agrégées depuis les cahiers — le travail a été fait À LA SAISIE (STORY-083)
  const auto = await this.agregerNonDeductibles(orgId, exercice);   // groupées par codeReintegration

  // 2) + retraitements de clôture (manuels, justifiés)
  const manuels = await this.retraitementRepo.manuels(orgId, exercice);

  const reintegrations = [...auto, ...manuels.filter(r => r.sens === 'REINTEGRATION')];
  const deductions     = manuels.filter(r => r.sens === 'DEDUCTION');

  const avantDeficits =
    resultatComptable + somme(reintegrations) - somme(deductions);

  // 3) Déficits — imputés DANS LA LIMITE du stock et des règles du paquet
  const { imputes, reste } = await this.deficits.imputer(orgId, avantDeficits, paquet);

  const resultatFiscal = avantDeficits - somme(imputes);

  return {
    exercice, resultatComptable, reintegrations, deductions,
    totalReintegrations: somme(reintegrations), totalDeductions: somme(deductions),
    resultatAvantDeficits: avantDeficits, deficitsImputes: imputes, resultatFiscal,
    // ⚠️ Résultat négatif → déficit reportable. MAIS la MFP reste due (STORY-092) :
    //    ce moteur ne conclut JAMAIS « aucun impôt ».
    deficitGenere: resultatFiscal < 0 ? Math.abs(resultatFiscal) : undefined,
  };
}
```

### Le garde-fou : pas de retraitement sans justification

```typescript
@Post('/fiscal/retraitements')
@RequiresBalanceAccess()
async creer(@Body() dto: RetraitementDto, @TenantContext() orgId, @CurrentUser() user) {
  const paquet = await this.paquetFiscal.get(/* … */);

  if (!paquet.reglesRetraitement.some(r => r.code === dto.code)) {
    throw new BadRequestException('CODE_RETRAITEMENT_INCONNU');       // codes du paquet, jamais en dur
  }
  if (!dto.baseLegale || !dto.justification) {
    throw new BadRequestException('JUSTIFICATION_REQUISE');           // NFR-A04 — indéfendable sinon
  }
  return this.retraitementRepo.creer({ ...dto, origine: 'MANUEL', parUserId: user.id, le: new Date() });
}
```

---

## Décisions techniques (cadrage relu contre le code livré — 2026-08-03)

Le cadrage initial datait du 2026-07-12, avant la livraison de STORY-083/085/087/090/145/146/147. Sa
relecture contre le code réel corrige **trois erreurs de cadrage** (D-091-2, D-091-5, D-091-11) et fixe
dix décisions.

| # | Décision |
|---|---|
| **D-091-1** | **Module `src/modules/fiscal/` à part**, feuille : il importe `BalanceModule` (soldes), `CahiersModule` (lignes de dépenses, **lecture seule**), `ReferentielModule` (paquet fiscal) et `RepriseModule` (exercice CLOS). Aucun des quatre ne l'importe — même montage qu'`AgregationModule` / `RapprochementModule`. |
| **D-091-2** | ⚠️ **Correction du cadrage : le compte d'articulation est `13`, pas `12x`.** En SYSCOHADA révisé, `12` = **Report à nouveau** (résultat des exercices *antérieurs*) et `13` = **Résultat net de l'exercice**. Confronter le résultat de N au report à nouveau aurait produit un écart **systématiquement faux**, et d'autant plus crédible qu'il aurait été non nul. |
| **D-091-3** | **Résultat comptable = Σ (soldeCrediteur − soldeDebiteur) sur les classes 6, 7 et 8**, **netté ligne à ligne**. Les classes viennent des règles publiées par le référentiel (`CHARGE: "classe 6/8 (debit)"`, `PRODUIT: "classe 7/8 (credit)"`) : **omettre la classe 8** (HAO, participation des travailleurs, **impôt sur le résultat `89`**) donnerait un résultat *avant* HAO et *avant* impôt, qui ne s'articulerait jamais avec le compte `13`. Netter est obligatoire (STORY-147/172) : sommer les colonnes séparément double les comptes mouvementés des deux côtés. |
| **D-091-4** | **Agrégation automatique sur `montantImpute`**, jamais sur `montant` — le **piège des charges** (D-083-2, 6ᵉ occurrence) : la charge imputée en classe 6 vaut le **HT** si la TVA est déductible, le **TTC** sinon. Réintégrer le TTC d'une ligne imputée en HT majorerait la base ; l'inverse la minorerait. |
| **D-091-5** | ⚠️ **Correction du cadrage : une ligne non déductible SANS `codeReintegration` est quand même réintégrée.** `togo@2026` ne publie **aucune** correspondance `motif → code` (D-083-3) : la quasi-totalité des lignes automatiques sortiront **sans code**. Les grouper par code seul les aurait fait disparaître de l'assiette — exactement la « charge non déductible oubliée ⇒ redressement » du tableau des risques. Elles forment donc des postes groupés **par motif**, comptés dans le total, marqués `codeAbsent: true`. |
| **D-091-6** | **Codes lus du paquet, fail-closed** : `resultatFiscal.reintegrations_codes` / `deductions_codes`. Paquet muet ⇒ **tout** code manuel refusé (400), comme `estCodeReintegrationAdmis` de STORY-083. Les **libellés** ne sont lus que si le paquet les publie (`*_libelles`, additif et absent aujourd'hui) — jamais inventés : nommer `20` « Amendes et pénalités » dans le code serait écrire du fiscal en dur (NFR-A06). |
| **D-091-7** | **La règle de report déficitaire est STRUCTURÉE DANS LE PAQUET**, pas dans le code. `togo@2026` ne la publie qu'en **prose** (`reglesNotables.reportDeficitaire`) ; parser « dans la limite de 50 % » à la regex serait un taux en dur avec une étape de plus. La source est ajoutée en `resultatFiscal.reportDeficitaire { plafondPourcentageBenefice: 0.5, dureeReportAnnees: null, source: "Art. 101 CGI" }` — **transcription** d'un fait déjà sourcé dans le même artefact, pas un ajout de doctrine. Le paquet fiscal est **produit par `balance-service`** (`scripts/referentiels/build.mjs`, D-078-2 ne vaut que pour les référentiels comptables) : c'est un changement **mono-dépôt**, checksum régénéré et reporté au manifeste. **Règle absente ⇒ aucune imputation** + motif exposé : sur-imposer se corrige, sous-imposer est un redressement. |
| **D-091-8** | **Imputation FIFO** (déficit d'origine la plus ancienne d'abord), plafonnée à `plafond% × résultat avant déficits` **et** au stock disponible, **et** au bénéfice lui-même. Résultat avant déficits ≤ 0 ⇒ **aucune** imputation : un déficit ne se crée jamais par imputation (AC « jamais pour fabriquer un déficit »). |
| **D-091-9** | **`GET /resultat-fiscal` n'écrit RIEN** — l'imputation est **calculée, jamais persistée**. Ce n'est pas une commodité : **STORY-096 rejoue ce moteur sur des scénarios** (« et si je provisionnais ? »). Un calcul qui consommerait le stock corromprait les déficits à chaque simulation. Le stock consommé par les exercices antérieurs est donc une donnée **déclarée** (`montantDejaImpute`), pas un effet de bord de lecture ; sa persistance à l'arrêté relève de **STORY-092**. |
| **D-091-10** | **Immutabilité** : une balance **VALIDÉE** sur l'exercice (toutes sources, socles d'à-nouveaux exclus) fige retraitements **et** déficits ⇒ **409**, patron `BalanceValideeImmuableException` de STORY-082/083. Un exercice **CLOS** (STORY-087) refuse aussi l'écriture ; la **lecture** reste ouverte (D-090-11). |
| **D-091-11** | ⚠️ **Correction du cadrage : « 23 postes » n'est pas une constante du code.** Le tableau des postes DSF est **dérivé du paquet** — `togo@2026` en publie **17** (12 réintégrations + 5 déductions). Écrire 23 en dur ferait échouer le premier paquet conforme. Le tableau expose **tous** les codes publiés (montant `0` si non alimenté, la grille de la liasse est fixe) **plus** les postes sans code de D-091-5. |
| **D-091-12** | **`U` de « CRUD » volontairement non implémenté** : un retraitement se **supprime et se ressaisit**. Un `PATCH` réécrirait en silence une décision auditée (`parUserId`, `le`, `justification`) sans historique — la trace d'un retraitement modifié est le sujet de **STORY-097** (défense en contrôle), pas de celle-ci. Périmètre restreint **et déclaré**, jamais élargi. |
| **D-091-13** | **Articulation `13` fail-closed** : le compte de résultat net est lu (1) de `regles.COMPTE_RESULTAT_NET` si le référentiel le publie, sinon (2) de **l'unique** entrée de classe 1 du plan dont le libellé normalisé commence par `resultat net` — `13` pour `syscohada-revise@2.1`, **rien** pour `sfd-bceao@2.0` (plan bancaire, sans compte de résultat). Zéro ou plusieurs correspondances ⇒ contrôle **non applicable**, motif exposé — jamais un compte choisi au hasard. |

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Charge non déductible oubliée** → base minorée → redressement | Réintégrations **agrégées automatiquement** depuis les cahiers (le marquage a eu lieu **à la saisie**, STORY-083) |
| Retraitement **non justifié** → indéfendable en contrôle | `baseLegale` + `justification` **obligatoires** (400 sinon) ; pièce attachable |
| **Déficit imputé au-delà du stock** ou hors délai | Imputation **plafonnée** au disponible + règles du paquet ; stock suivi par exercice d'origine |
| Conclure « résultat négatif ⇒ aucun impôt » | **Faux** : la **MFP** (1 % du CA) reste due → explicité ici, appliqué en **STORY-092** |
| Codes DSF en dur → faux après réforme | Codes **lus du paquet fiscal** (`pays × année`) — test anti-hardcode |
| Montant non traçable en contrôle | Chaque ligne remonte à ses **lignes sources** ou à sa **saisie** (auteur, date, base légale) |
| Retraitement modifié après dépôt | **Immutabilité** après validation (409) |

---

## Definition of Done

- [ ] `ResultatComptableService` (produits − charges) + écart `12x` signalé
- [ ] Agrégation automatique des non-déductibles **par code** (traçable aux lignes sources)
- [ ] Retraitement manuel : code **validé au paquet**, `baseLegale` + `justification` **obligatoires**
- [ ] Déficits reportables (stock, imputation plafonnée, expiration)
- [ ] `ResultatFiscalService.calculer()` → base imposable + **tableau des 23 postes DSF**
- [ ] Résultat négatif → déficit reportable ; **MFP toujours due** (pas de conclusion « zéro impôt »)
- [ ] Traçabilité complète (NFR-A07) ; immutabilité après validation (409)
- [ ] Aucun code/taux en dur (NFR-A06)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-083 (marquage à la saisie), STORY-085 (balance) verts

---

## Progress Tracking

- **2026-08-03 — `in_progress`.** Cadrage relu contre le code livré de STORY-078/083/085/087/090/145/146/147 : 13 décisions posées (D-091-1 → D-091-13), dont **trois corrections du cadrage initial** — le compte d'articulation (`13` et non `12x`, D-091-2), les réintégrations sans code fiscal qui restaient hors assiette (D-091-5) et les « 23 postes » écrits en dur (D-091-11). Module `src/modules/fiscal/` à part, feuille.

- **2026-08-03 — développement.** Module `src/modules/fiscal/` : moteur **pur** (`fiscal.regles.ts` — résultat comptable, articulation, agrégation, imputation, assemblage, validation), deux collections (`retraitements_fiscaux`, `deficits_reportables`), 6 routes sous `/api/v1/fiscal`. Le paquet `togo@2026` gagne `resultatFiscal.reportDeficitaire` **structuré** (plafond 50 %, report illimité, Art. 101 CGI) — transcription du texte déjà sourcé en prose dans le même artefact ; artefact régénéré par `scripts/referentiels/build.mjs`, checksum `13c2df48…` reporté au manifeste. **Aucun fichier existant n'a changé de comportement** hors le checksum du manifeste.

- **2026-08-03 — qualité.** Lint 0 warning · build OK · **2076 unitaires + 428 e2e** verts · couverture **98,86 / 91,03 / 97,93 / 98,90** (seuils 65/90/90/90 ; module fiscal 98,85 / 91,51 / 98,57 / 99,07).
  **30 mutation-tests, 30 rouges** — classe 8 retirée du résultat, soldes non nettés, montant TTC au lieu de `montantImpute`, réintégrations sans code écartées de l'assiette, imputation non bornée par le bénéfice, imputation sur résultat nul, arrondi du plafond au-dessus, LIFO au lieu de FIFO, déficits périmés réputés imputables, restant négatif conservé, règle de report inventée quand le paquet est muet, contrôle du sens retiré, justification non exigée, code inconnu accepté, ambiguïté du compte de résultat tranchée au hasard, articulation sur le `12`, articulation par égalité stricte, tableau DSF réduit aux postes alimentés, MFP réputé non dû, gel après validation retiré, gel sur exercice clos retiré, gel contrôlé sur l'exercice **du client**, 404 hors org transformé en suppression silencieuse, `E11000` non mappé, balance absente rendue en résultat 0, dépôt non org-scopé, `orgId` du JWT écrasable, gate d'accès retirée, montant négatif accepté, déficits de l'exercice courant inclus dans leur propre calcul.
  ⚠️ Une mutation (« imputation non bornée par le bénéfice ») est passée **verte au premier tour** : le plafond du paquet étant ≤ 1 par construction, la borne était **inobservable** par le chemin d'extraction. Un test appelant `imputerDeficits` **directement** avec un plafond aberrant (150 %) la rend observable — la fonction est exportée, STORY-092/096 lui passeront une règle construite ailleurs.

- **2026-08-03 — VÉRIFICATION DOCKER** (stack **neuve**, `down -v`, 2 organisations réelles créées via l'IdP, régime `REEL` confirmé, balance 2026 soumise par le vrai chemin `POST /balances`).
  - **Résultat comptable réel** : produits `701` 480 000 000 + HAO `84` 5 000 000 − charges `601` 412 000 000 − HAO `83` 3 000 000 − impôt `89` 12 000 000 = **58 000 000**. **Articulation** : compte `13` résolu **depuis le plan de comptes chargé** (174 comptes, checksum `01b892c0`), solde comptabilisé 58 000 000, **écart 0**. Le compte `12` (report à nouveau) est présent au plan et **n'est pas retenu** — la correction D-091-2 est prouvée sur données réelles.
  - **Piège des charges (D-091-4) prouvé en base** : poste `20` = 650 000 (dépense sans TVA ⇒ **TTC**) + 1 000 000 (dépense à TVA déductible ⇒ **HT**, TTC 1 180 000) = **1 650 000**. Réintégrer le TTC aurait donné 1 830 000.
  - **Réintégration sans code (D-091-5)** : la charge non justifiée de 2 400 000 sort **sans `code`**, groupée sur `motif: CHARGE_NON_JUSTIFIEE`, et **compte dans l'assiette**. La charge parfaitement déductible de 5 000 000 n'est **jamais** réintégrée.
  - **Persistance** : `retraitements_fiscaux` = 2 documents (code `40` REINTEGRATION 1 800 000 / code `120` DEDUCTION 900 000), chacun avec `baseLegale`, `justification` et `parUserId` = le `sub` réel du JWT ; `deficits_reportables` = 2 documents (2024 : 20 000 000 ; 2023 : 6 000 000 dont 1 000 000 déjà imputé). **Invariants : 0 retraitement sans justification, 0 montant ≤ 0, 0 document hors des 2 organisations connues.**
  - **Index unique présent EN BASE** (`orgId_1_exerciceOrigine_1`, `unique: true`) : la seconde déclaration d'un déficit 2024 est refusée **par l'index** ⇒ **409 `DEFICIT_DEJA_DECLARE`**.
  - **Imputation FIFO plafonnée** : réintégrations 5 850 000 − déductions 900 000 sur 58 000 000 ⇒ avant déficits **62 950 000** ; imputation **2023 d'abord** (5 000 000) puis **2024** (20 000 000) = 25 000 000 (plafond 50 % = 31 475 000, non atteignant : le stock est la borne) ⇒ **résultat fiscal 37 950 000**, `mfpToujoursDue: true`.
  - **Le calcul N'ÉCRIT RIEN (D-091-9)** : compteurs et `montantDejaImpute` **strictement identiques** avant et après **3** appels consécutifs à `GET /resultat-fiscal` — condition nécessaire au rejeu de STORY-096.
  - **Isolation** : retraitement et déficit de A ⇒ **404** pour B dans les deux sens (jamais 403) ; le stock de B est vide, sa liste de retraitements vide, son `GET /resultat-fiscal` **404** (aucune balance) ; les 4 documents de A restent intacts.
  - **Gel** : balance passée `VALIDÉE` (200) ⇒ `POST` **et** `DELETE` de retraitement **409 `BALANCE_VALIDEE_IMMUABLE`**, documents inchangés, tandis que `GET /resultat-fiscal` reste **200** (lecture ouverte, D-090-11).
  - **Paramétrage** : exercice 2029 (balance soumise, paquet non publié) ⇒ **409 `PAQUET_FISCAL_NON_PUBLIE`**, jamais un 500. Refus de saisie vérifiés en réel : code hors paquet **400 `CODE_RETRAITEMENT_INCONNU`**, sens contredisant le paquet **400 `SENS_INCOHERENT`**, justification blanche **400**, `montantDejaImpute > montant` **400**, exercice d'origine futur **400**.
  - **Atomicité** : *sans objet ici* — aucune opération de cette story n'écrit **plus d'un document** (un retraitement, un déficit). Il n'y a donc **aucune transaction** à prouver, et rien n'est déclaré tel. Le filet contre la double déclaration est l'**index unique**, vérifié présent en base ci-dessus.
  - **Non-régression** : STORY-078 (diagnostic `/referentiels/actifs` ⇒ 200, `integrity: verified` sur le **nouveau** checksum), STORY-079/080 (profil + régime `REEL` ⇒ 200), STORY-083 (4 dépenses saisies, déductibilité et code proposés à la saisie), STORY-101 (2 balances soumises, validation ⇒ 200).

---

**Status:** in_progress
**Dependencies:** **STORY-078** (paquet fiscal : codes de retraitement, règles de déficits), **STORY-083** (déductibilité posée à la saisie), **STORY-101** (balance → résultat comptable), STORY-080 (régime `REEL` — sinon voir STORY-095/TPU)
**Alimente** **STORY-092** (liquidation IS), **STORY-096** (simulation d'optimisation — rejoue ce moteur), `bilan-service` EPIC-011 (rendu des états fiscaux de la DSF)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A18, NFR-A04/A06 · GUIDEF section « Résultat fiscal » (23 postes) · CGI Togo 2026
