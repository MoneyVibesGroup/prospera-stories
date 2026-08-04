# STORY-095 : Régime synthétique / TPU (taxe professionnelle unique — calcul forfaitaire + déclaratif)

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A19 (volet synthétique) · `rapport-bilan-logique-metier-2026-07-12.md` §15 (CGI Togo 2026, **Chap. V — régime de l'entreprenant / TPU**, art. 128-139) · `referentiels/paquet-fiscal-togo-2026.json` · STORY-080 (détermination du régime)
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 19
**Service :** `balance-service` (:3007)
**Couvre :** FR-A19 (volet **régime synthétique / TPU**)

> **L'autre moitié du marché — et un moteur fiscal entièrement différent.** Tout ce qui précède (résultat fiscal, IS, MFP, TVA) concerne le **régime réel**. Mais la majorité des **petites structures** ouest-africaines relèvent du **régime synthétique** : au Togo, le régime de l'**entreprenant**, dont l'impôt est la **TPU (Taxe Professionnelle Unique)**.
>
> **La TPU n'est pas un « IS simplifié ».** C'est une **taxe unique** qui **remplace** l'IS **et** la TVA **et** la patente : elle se calcule sur le **chiffre d'affaires**, pas sur le bénéfice. Conséquence : pas de résultat fiscal, pas de réintégrations, **pas de TVA à déclarer**. Un moteur qui appliquerait l'IS à un entreprenant produirait une liasse **absurde**. Cette story implémente la **branche synthétique** du moteur, **aiguillée par STORY-080**.

---

## ⚠️ Recadrage du 2026-08-04 — ce que dit le paquet fiscal réel

Le cadrage initial (2026-07-12) supposait un paquet publiant `taux.tpu = [{trancheMin, trancheMax, taux | montantForfaitaire}]` et un « seuil de régime ~30 M ». **Le paquet `togo@2026` publié en STORY-078 dit autre chose**, et c'est la lecture de ses octets qui fait foi :

```
regimesImposition.synthetique_entreprenant_tpu
├── plafondCA: 60000000                      ← plafond DU RÉGIME (frontière réel ↔ synthétique)
├── exonerationTemporaire: "non due pendant les 24 premiers mois d'exercice"   (PROSE)
├── neSappliquePasA: [BNC, panificateurs industriels, importateurs]
├── statut: "confirme_complet"
└── composantes
    ├── forfaitaire   seuilCA "CA annuel <= 30 000 000 FCFA"        (PROSE)
    │                 modeCalcul "tarifs forfaitaires (barème par activité/tonnage…)"  (PROSE)
    │                 beneficiaire "collectivités locales"    ⇒ AUCUN BARÈME EXPLOITABLE
    └── declaratif    seuilCA "30 000 000 < CA annuel <= 60 000 000 FCFA"      (PROSE)
                      taux { productionEtCommerce: 0.02, prestationsDeServices: 0.08,
                             montantMinimumAnnuel: 20000 }         ⇒ COMPLET ET SOURCÉ
```

**Quatre écarts au cadrage, tous structurants** :

1. **Ce ne sont pas des tranches d'un même barème, ce sont DEUX composantes de nature différente** — l'une forfaitaire au profit des **collectivités locales**, l'autre déclarative au profit de l'**État**. Le « moteur générique par tranches » du cadrage n'a pas d'objet ici : il aurait fallu inventer la structure qu'il prétendait lire.
2. **Le seuil de 30 M n'est PAS le plafond du régime** : c'est la **frontière interne** entre les deux composantes. Le plafond du régime est **60 M** (`plafondCA`). Le cadrage écrivait « CA > seuil du régime synthétique (paquet, Togo ~30 M) → avertissement de bascule » : appliqué tel quel, il aurait averti de basculer au réel une entreprise **parfaitement dans son régime**. STORY-080 avait déjà tranché le point — `extrairePlafondTpu` documente explicitement la confusion à ne pas faire.
3. **La question ouverte du PRD §13 est à moitié refermée** : la composante **déclarative** est complète et sourcée (2 % / 8 % / minimum 20 000, Art. 130-134 CGI) — elle **se calcule**. La composante **forfaitaire** n'a **aucun barème** dans la source (seulement une phrase décrivant son mode de calcul) — elle **ne se calcule pas**, et c'est elle, et elle seule, qui lève `BAREME_TPU_INDISPONIBLE`.
4. **Les deux `seuilCA` sont en PROSE**, donc non exploitables (`"CA annuel <= 30 000 000 FCFA"` est une chaîne). Les parser à la regex serait « un taux en dur avec une étape de plus » (D-091-13). Ils sont donc **transcrits en donnée structurée** dans le paquet — 5ᵉ régénération, même parti pris qu'en 091/092/093/094.

### F-095-1 — défaut trouvé au cadrage, hors du périmètre annoncé, corrigé quand même

`regime.regles.ts` (STORY-080) compare un **chiffre d'affaires en unités mineures** (centimes, convention `balance-canonique`) au **`plafondCA` du paquet exprimé en FCFA** — un facteur **100**. Conséquence : le plafond appliqué vaut en réalité **600 000 FCFA**, et le système propose `REEL` à la quasi-totalité des entreprenants qu'il devrait proposer en `SYNTHETIQUE`.

**Invisible à la suite de tests** : les specs construisent le CA à partir de lignes de balance fabriquées et posent `plafondCA: 60_000_000` — les deux côtés sont cohérents *entre eux* et muets sur l'unité. C'est le motif « un test qu'un code bugué franchit ».

**Corrigé ici** et pas laissé en dette, parce que STORY-095 devient le **second lecteur** des mêmes montants : les laisser diverger produirait un système qui propose `REEL` puis refuse de liquider l'IS d'un dossier que le CGI met à la TPU. Le correctif passe par un convertisseur **partagé et unique** (`montantPaquetVersUnitesMineures`), déclaré une fois, appliqué à **tout** montant lu du paquet — jamais aux taux, qui sont des ratios.

---

## User Story

En tant que **cabinet comptable** traitant une **petite structure au régime synthétique**,
je veux que le système **calcule la TPU** (au lieu de l'IS, de la MFP et de la TVA),
afin de **déclarer le bon impôt** pour ce régime, sans lui appliquer par erreur la mécanique du réel.

---

## Description

### Contexte

Le **régime fiscal** est déterminé en **STORY-080** (axe fiscal, indépendant de l'axe comptable SN/SMT). Deux branches **exclusives** :

| Régime | Impôt | Base | TVA | Stories |
|---|---|---|---|---|
| **RÉEL** | `IS = max(MFP, IS)` | **Résultat fiscal** (après retraitements) | **Oui** (collectée − déductible) | 091, 092, 093 |
| **SYNTHÉTIQUE** | **TPU** (taxe unique) | **Chiffre d'affaires** | **NON** — la TPU l'inclut | **095 (ici)** |

> **Ce que la TPU remplace (CGI Togo, Chap. V, `liberatoireDe`) :** l'**IRPP catégorie revenus d'affaires**, le **minimum forfaitaire de perception**, la **patente**, la **TVA**. Un entreprenant ne déclare **pas** de TVA — lui en calculer une serait une **erreur de régime**, et lui appliquer l'IS/MFP par-dessus la TPU serait une **double imposition**.

### Décisions de cadrage

| # | Décision | Pourquoi |
|---|---|---|
| **D-095-1** | **Régime absent ⇒ `REEL`** (droit commun), jamais `SYNTHETIQUE` présumé. Un dossier sans profil, ou dont `regimeFiscal` est `null`, reste traité **exactement comme aujourd'hui**. | Même parti pris que `evaluerAxeFiscal` (080) : « jamais présumer une faveur fiscale ». C'est aussi ce qui rend la story **non régressive** pour 091/092/093/094, dont tous les dossiers de test n'ont pas de profil. |
| **D-095-2** | Le moteur lit `regimesImposition.synthetique_entreprenant_tpu.composantes`, **pas** un barème de tranches. | Le paquet publie deux composantes de **nature** différente, pas deux tranches d'un même barème. |
| **D-095-3** | **Deux seuils distincts, jamais confondus** : `plafondCA` (60 M) = frontière **du régime** ; `caMax` de la composante forfaitaire (30 M) = frontière **interne**. L'avertissement de bascule au réel se déclenche sur le **plafond**, pas sur la frontière interne. | Confondre les deux avertit de basculer au réel une entreprise dans son régime — un conseil faux et crédible. |
| **D-095-4** | Les seuils en prose sont **transcrits en donnée structurée** dans le paquet (`plafondCA` conservé, `composantes.*.caMin`/`caMax` ajoutés) → **régénération** de `paquet-fiscal-togo-2026.json` + report du sha256 au manifeste. | 5ᵉ régénération, même parti pris qu'en 091 : parser la prose à la regex, c'est du taux en dur avec une étape de plus. |
| **D-095-5** | Composante **forfaitaire** (CA ≤ 30 M) ⇒ **`BAREME_TPU_INDISPONIBLE` (409)**, jamais un taux emprunté à la composante déclarative. | Le barème forfaitaire est un tarif **par activité et par tonnage** que la source ne publie pas. Appliquer 2 % à sa place produirait un impôt inventé, plausible et faux. |
| **D-095-6** | Le taux déclaratif dépend de la **nature d'activité** (production/commerce **2 %** vs prestations de services **8 %**) — donnée **absente du profil** (`secteur`, `objetSocial` sont du texte libre). Elle est **saisie explicitement** et persistée (`tpu_parametrages`, unique par org × exercice) ; absente ⇒ **`NATURE_ACTIVITE_TPU_INDETERMINEE` (409)**. | La dériver d'un texte libre reviendrait à deviner un facteur **4** sur l'impôt. Une activité mixte relève d'une ventilation du CA : **hors périmètre**, hook documenté. |
| **D-095-7** | Les comptes de la TPU (**charge `64x`** / **dette `44x`**) sont **publiés par le paquet** et **validés contre le plan** du référentiel avant écriture — jamais en dur. | Reprise exacte de D-094-1 : `646`/`441` sont des numéros SYSCOHADA ; les écrire dans le moteur mentirait sur un plan bancaire. |
| **D-095-8** | Le paquet ne publie **aucun calendrier d'échéances TPU**. `echeance` est donc **optionnelle** sur un versement, et n'est acceptée que si le paquet en publie un — sinon **`ECHEANCE_INCONNUE` (400)**. | Fail-closed identique aux acomptes d'IS : une échéance qui n'existe dans aucun calendrier serait déduite de l'impôt sans apparaître dans aucune ligne. |
| **D-095-9** | **Exonération des 24 premiers mois** (`exonerationTemporaire`, prose ⇒ transcrite `exonerationTemporaireMois: 24`) : appliquée **uniquement si l'exercice entier** tombe dans les 24 mois suivant `dateCreation`. Chevauchement partiel ⇒ **avertissement**, aucun prorata. `dateCreation` absente ⇒ **avertissement**, aucune exonération. | La loi exonère une **période**, pas une fraction d'exercice. Inventer un prorata sous-imposerait ; ignorer l'exonération sur-imposerait un exercice entièrement couvert. |
| **D-095-10** | `neSappliquePasA` (BNC, panificateurs industriels, importateurs) n'est **pas dérivable** des données du dossier ⇒ **avertissement** nommant les exclusions à vérifier. | Le régime peut être inapplicable pour une raison que le système ne voit pas. Le taire, c'est laisser calculer un impôt qui n'est pas dû. |
| **D-095-11** | Branche synthétique du provisionnement (094) : écriture **au delta** `chargeTpu` (D) / `detteTpu` (C), **et aucun soldage de TVA**. | Le delta est la règle de D-094-7 (ne pas doubler une charge déjà comptabilisée). Solder la TVA d'un entreprenant écrirait une déclaration qu'il ne dépose pas. |
| **D-095-12** | **F-095-1** : tout montant lu du paquet passe par `montantPaquetVersUnitesMineures` (× 100) ; les **taux** n'y passent jamais. Le correctif s'applique aussi au lecteur existant de STORY-080. | Le paquet transcrit le CGI, dont les montants sont en FCFA ; le service compte en unités mineures. La conversion doit exister **une** fois, pas à chaque site de lecture. |

### Périmètre

**Inclus :**

- **Régénération du paquet fiscal `togo@2026`** (D-095-4) : `composantes.forfaitaire.caMax`, `composantes.declaratif.caMin`/`caMax`, `exonerationTemporaireMois`, et le bloc `comptes` de la TPU (`chargeTpu`/`detteTpu`, marqués `A_CONFIRMER`) — plus le report du nouveau sha256 dans `PaquetFiscalRegistry`.
- **`MoteurFiscalService` — l'aiguillage** :
  - lit le `regimeFiscal` du profil (STORY-080), `REEL` par défaut (D-095-1) ;
  - `REEL` → résultat fiscal (091) + liquidation (092) + TVA (093) ;
  - `SYNTHETIQUE` → **TPU (095)**, et **rien d'autre** ;
  - `GET /api/v1/fiscal/moteur?exercice=` expose le résultat aiguillé — c'est la surface où l'exclusivité s'observe de bout en bout.
- **Exclusivité opposable, pas décorative** : les endpoints du **réel** (`resultat-fiscal`, `liquidation`, `acomptes`, `credits`, `tva`, …) refusent un dossier `SYNTHETIQUE` (**409 `REGIME_INCOMPATIBLE`**) et les endpoints **TPU** refusent un dossier `REEL`. Un aiguillage qui laisserait les deux surfaces ouvertes ne serait qu'un `switch` que rien n'empêche de contourner.
- **`TpuService`** :
  - **Base** = **chiffre d'affaires** de l'exercice, lu **du référentiel** (même source que la MFP, D-092-4 : poste de CA + table de passage) — jamais un préfixe `70` en dur ;
  - **composante déterminée par le CA** (D-095-2/3) : `CA ≤ caMax(forfaitaire)` ⇒ forfaitaire ⇒ **409** ; `caMin < CA ≤ plafond` ⇒ déclarative ⇒ `TPU = CA × taux(nature)` ;
  - **minimum annuel** (`montantMinimumAnnuel`) appliqué en **plancher** ;
  - **CA > `plafondCA`** ⇒ **avertissement fort** de bascule au réel (`depassementSeuil`, Art. 132) — **aucune bascule automatique** : c'est une décision (STORY-080) ;
  - exonération des 24 mois (D-095-9) et exclusions d'activité (D-095-10) en avertissements ;
  - **traçabilité** : composante, taux appliqué, nature d'activité, base, **checksum + version du paquet**.
- **Paramétrage TPU** : `PUT /api/v1/fiscal/tpu/parametrage` — `natureActivite` (`PRODUCTION_COMMERCE` | `PRESTATIONS_SERVICES`), unique par org × exercice, gelé par l'exercice clos / la balance validée.
- **Volet déclaratif** : `POST /api/v1/fiscal/tpu/versements` (`montant`, `datePaiement`, `echeance?`, `pieceRef?`), `GET`, `DELETE /:id` ; **solde** = `TPU due − Σ versements` → `A_PAYER` ou `CREDIT`.
- **`GET /api/v1/fiscal/tpu?exercice=`** : base (CA), composante, taux, TPU due, versements, solde, avertissements, traçabilité.
- **Écriture dans la balance** (branche synthétique de **STORY-094**) : `chargeTpu` (**D**) / `detteTpu` (**C**) **au delta**, **sans** soldage de TVA, **sans** `891`/`441`.
- **F-095-1** : convertisseur partagé des montants du paquet + correction du lecteur de STORY-080.
- **Tests** : composante déclarative (2 % et 8 %), plancher du minimum annuel, **forfaitaire ⇒ `BAREME_TPU_INDISPONIBLE`**, nature absente ⇒ **409**, **CA > plafond ⇒ avertissement sans bascule**, exonération 24 mois (exercice entier / chevauchement / date absente), versements ⇒ solde et crédit, **⚠️ SYNTHETIQUE ⇒ aucun IS, aucune MFP, aucune TVA** *(test central)*, **⚠️ REEL ⇒ aucune TPU**, écriture `64x`/`44x` sans `4441`, axes orthogonaux (TPU en SN comme en SMT), traçabilité, immutabilité (409).

**Hors périmètre :**

- **Régime réel** (IS, MFP, résultat fiscal, TVA) → **STORY-091/092/093**.
- **Détermination / changement du régime** → **STORY-080** (cette story **consomme** `regimeFiscal`, et ne le modifie jamais).
- **Barème forfaitaire TPU** (tarifs par activité/tonnage, Art. 130-131/135) → **question ouverte (PRD §13)**, travail de **référentiel** : **prérequis de mise en production** de la composante forfaitaire, pas de développement. Hook : le moteur le lira à `composantes.forfaitaire.bareme` sans autre changement de code.
- **Activité mixte** (CA à ventiler entre 2 % et 8 %) → une seule nature par exercice en v1. Hook documenté.
- **Bascule automatique de régime** au dépassement du plafond → **interdit** : avertissement seulement.
- **Autres pays UEMOA** → couverts **par construction** si leur paquet expose les mêmes clés ; à valider pays par pays.

### Flux

1. Profil (079) + axes (080) : `systemeComptable: SMT`, **`regimeFiscal: SYNTHETIQUE`**.
2. Cahiers saisis (082/083), balance produite (085). **CA de l'exercice = 42 000 000 FCFA**.
3. Paramétrage : `natureActivite = PRESTATIONS_SERVICES`.
4. `GET /api/v1/fiscal/moteur?exercice=2026` → **aiguillage synthétique** :
   - ❌ pas de résultat fiscal (091 **non appelée**) · ❌ pas d'IS ni de MFP (092) · ❌ pas de TVA (093) — *la TPU l'inclut*
   - ✅ **TPU** (095)
5. `GET /api/v1/fiscal/tpu?exercice=2026` : `30 M < 42 M ≤ 60 M` ⇒ **composante déclarative**, taux **8 %** ⇒ **TPU due = 3 360 000**, supérieure au minimum annuel (20 000). CA sous le plafond ⇒ aucun avertissement de bascule.
6. **Versements** déjà effectués : déduits → **solde à payer** (ou crédit).
7. **STORY-094** écrit la TPU : `chargeTpu` (**D**) / `detteTpu` (**C**) — **pas** de `891`/`441`, **pas** de `4441`.
8. *(Variante)* CA = **18 M** ⇒ composante **forfaitaire** ⇒ **`BAREME_TPU_INDISPONIBLE`**. Le calcul s'arrête. **Aucun taux emprunté** — un impôt inventé est pire qu'un impôt non calculé.
9. *(Variante)* CA = **72 M** ⇒ TPU calculée sur la composante déclarative **et** avertissement fort « CA au-delà du plafond TPU (60 M) — dénonciation du régime, bascule au réel à envisager » (Art. 132). Le cabinet **décide** (080).

---

## Acceptance Criteria

- [ ] **Aiguillage** selon `regimeFiscal` : `REEL` (ou régime absent, D-095-1) → 091/092/093 ; **`SYNTHETIQUE` → 095**.
- [ ] **⚠️ Exclusivité opposable** *(tests centraux)* : un dossier `SYNTHETIQUE` ne produit **ni IS, ni MFP, ni TVA** — et les endpoints du réel le **refusent en 409** ; un dossier `REEL` ne produit **pas de TPU** — et les endpoints TPU le **refusent en 409**.
- [ ] **`TpuService`** : base = **CA sourcé du référentiel** ; **composante** déterminée par le CA contre les seuils **structurés du paquet** ; taux déclaratif selon la **nature d'activité** ; **minimum annuel** en plancher.
- [ ] **⚠️ Composante forfaitaire ⇒ `BAREME_TPU_INDISPONIBLE` (409)** — jamais le taux déclaratif emprunté, jamais un taux deviné (NFR-A06).
- [ ] **Nature d'activité absente ⇒ `NATURE_ACTIVITE_TPU_INDETERMINEE` (409)** — jamais 2 % par défaut.
- [ ] **Plafond du régime (60 M, jamais 30 M)** dépassé ⇒ **avertissement fort** ; **aucun changement automatique de régime**.
- [ ] **Exonération des 24 premiers mois** : exercice entièrement couvert ⇒ TPU nulle **motivée** ; chevauchement partiel ou `dateCreation` absente ⇒ **avertissement**, aucun prorata.
- [ ] **Versements** enregistrables (échéance validée **si et seulement si** le paquet publie un calendrier) ; **solde** = `TPU due − Σ versements` → à payer ou crédit.
- [ ] **`GET /fiscal/tpu?exercice=`** : base, composante, taux, nature, TPU due, versements, solde, avertissements — **traçable** (checksum + version du paquet, référentiel).
- [ ] **Écriture dans la balance** (094) : TPU en **`64x` (D)** / **`44x` (C)**, **au delta** — **pas** de `891`/`441`, **pas** de `4441`, **aucun soldage de TVA**.
- [ ] **Indépendance des axes** : le moteur TPU fonctionne en `SMT` **comme** en `SN`.
- [ ] **F-095-1** : les montants du paquet sont convertis en unités mineures par un helper **unique** ; le lecteur de STORY-080 est corrigé et son test **échoue** sur le code d'avant (mutation-test).
- [ ] **Traçabilité (NFR-A07)** : composante, taux, nature, version + checksum du paquet, auteur, date.
- [ ] **Immutabilité** après validation / exercice clos → **409** sur toute saisie TPU.
- [ ] **Tests** : cf. § Périmètre. **Couverture ≥ seuils** (65/90/90/90), **mutation-tests** sur chaque garde.
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### L'aiguillage — deux branches exclusives

```typescript
@Injectable()
export class MoteurFiscalService {
  /** Régime en vigueur, `REEL` par défaut (D-095-1) — jamais SYNTHETIQUE présumé. */
  async resoudreRegime(orgId: string): Promise<RegimeFiscal> { … }

  /** Garde d'exclusivité posée par CHAQUE surface fiscale (409 REGIME_INCOMPATIBLE). */
  async exigerRegime(orgId: string, attendu: RegimeFiscal): Promise<void> { … }

  async calculer(user, query): Promise<ResultatFiscalComplet> {
    switch (await this.resoudreRegime(orgId)) {
      case RegimeFiscal.REEL:
        return { type: 'REEL', resultatFiscal: …, liquidation: …, tva: … };
      case RegimeFiscal.SYNTHETIQUE:
        // ⚠️ La TPU REMPLACE l'IS, la MFP ET la TVA (CGI Chap. V, `liberatoireDe`).
        //    Appeler 091/092/093 ici serait une double imposition.
        return { type: 'SYNTHETIQUE', tpu: await this.tpu.calculer(user, query) };
    }
  }
}
```

### La TPU — composantes du paquet, jamais devinées

```typescript
// Règle PURE — aucune I/O, c'est là que se joue l'erreur la plus chère de la story.
export function determinerComposanteTpu(ca: number, seuils: SeuilsTpu): ComposanteTpu | RefusTpu {
  if (seuils.forfaitaireCaMax !== null && ca <= seuils.forfaitaireCaMax) {
    return { refus: 'BAREME_FORFAITAIRE_NON_PACKAGE' };   // ⇒ 409, jamais 2 % emprunté
  }
  return 'DECLARATIF';                                     // le plafond ne borne pas le
}                                                          // calcul : il AVERTIT (Art. 132)
```

### Les tests d'exclusivité (les plus importants)

```typescript
it('SYNTHÉTIQUE : aucun IS, aucune MFP, aucune TVA', async () => {
  const r = await moteur.calculer(userSynthetique, ex2026);
  expect(r.type).toBe('SYNTHETIQUE');
  expect(r.tpu).toBeDefined();
  expect((r as any).liquidation).toBeUndefined();   // ⚠️ pas d'IS/MFP
  expect((r as any).tva).toBeUndefined();           // ⚠️ pas de TVA — la TPU l'inclut
});

it('SYNTHÉTIQUE : GET /fiscal/liquidation est REFUSÉ (409)', async () => { … });  // la garde
it('RÉEL : aucune TPU, et GET /fiscal/tpu est REFUSÉ (409)', async () => { … });
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **⚠️ Appliquer l'IS/la TVA à un entreprenant** → double imposition, liasse absurde | Branches exclusives **opposables** (409 des deux côtés), tests d'exclusivité dans les deux sens |
| **Confondre le seuil interne (30 M) et le plafond du régime (60 M)** | D-095-3 : deux grandeurs nommées séparément, avertissement de bascule branché sur le **plafond** ; test dédié à 42 M (dans le régime, aucun avertissement) |
| **Barème forfaitaire absent** → taux emprunté à la composante déclarative | **`BAREME_TPU_INDISPONIBLE`** : le calcul s'arrête (NFR-A06) |
| **Nature d'activité devinée** → facteur 4 sur l'impôt | Saisie explicite obligatoire, 409 sinon (D-095-6) |
| **Montants du paquet en FCFA lus comme des unités mineures** | F-095-1 : convertisseur unique, correction du lecteur de 080, mutation-test |
| Bascule automatique de régime au dépassement | **Interdit** : avertissement seulement (STORY-080 décide) |
| Confondre les axes (SMT ⇒ TPU) | Axes **orthogonaux** — test dédié TPU en `SN` |
| TPU écrite comme un IS (`891`/`441`) | TPU = **charge `64x`** / **dette `44x`** publiées par le paquet et validées contre le plan |
| Mise en production sans barème forfaitaire | **Prérequis explicite** signalé à la clôture |

---

## Definition of Done

- [ ] Paquet `togo@2026` régénéré (seuils structurés, `exonerationTemporaireMois`, comptes TPU) + sha256 reporté au manifeste
- [ ] `MoteurFiscalService` : aiguillage + **gardes d'exclusivité sur les deux surfaces**
- [ ] **Tests d'exclusivité** : SYNTHETIQUE → 0 IS/MFP/TVA + 409 sur le réel ; REEL → 0 TPU + 409 sur la TPU
- [ ] `TpuService` : CA sourcé du référentiel, composantes du paquet, taux par nature, minimum annuel
- [ ] `BAREME_TPU_INDISPONIBLE` (forfaitaire) et `NATURE_ACTIVITE_TPU_INDETERMINEE` — aucun taux deviné
- [ ] Plafond dépassé ⇒ avertissement, **aucune bascule** ; exonération 24 mois selon D-095-9
- [ ] Versements + solde (à payer / crédit) ; traçabilité (composante, taux, paquet)
- [ ] Écriture `64x`/`44x` au delta via 094 (ni `891`/`441`, ni `4441`, ni soldage TVA)
- [ ] Axes orthogonaux respectés (TPU possible en SN comme en SMT)
- [ ] Immutabilité après validation / exercice clos (409)
- [ ] **F-095-1** corrigé (convertisseur unique + lecteur de 080)
- [ ] Lint 0 warning · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts · **mutation-tests rouges à la mutation**
- [ ] **Vérification docker** de la persistance réelle (paramétrage, versements, balance TPU)
- [ ] Swagger ; CI verte
- [ ] **⚠️ Prérequis de mise en production signalé** : compléter le **barème forfaitaire TPU** (PRD §13)
- [ ] Non-régression : STORY-091/092/093/094 (branche réelle) verts

---

## Progress Tracking

- **2026-08-04** — Story reprise en `in_progress`. **Recadrage majeur** contre les octets du paquet `togo@2026` : le barème supposé (`taux.tpu[]` en tranches) n'existe pas ; le paquet publie **deux composantes** (forfaitaire sans barème / déclarative complète), un **plafond de régime à 60 M** (et non un « seuil à 30 M ») et ses seuils **en prose**. 12 décisions de cadrage posées (D-095-1 → D-095-12), dont un défaut trouvé au cadrage et corrigé (**F-095-1** : facteur 100 entre les montants du paquet et les unités mineures du service, invisible à la suite de tests de STORY-080).

- **2026-08-04 — Portes de qualité.** Lint **0 warning** · build OK · **2 591** tests unitaires + **546** e2e verts · couverture **98.98 / 91.77 / 98.20 / 99.07** (seuils 65/90/90/90). Aucun fichier neuf sous la barre : `tpu.regles` 99 %, `tpu.service` 98.6 %, `tpu.repositories`, `tpu.controller`, `moteur-fiscal.*`, `regime-fiscal.guard` et `montants-paquet` à **100 %** — l'angle mort « fichier neuf à 0 % masqué par la couverture globale » a été refermé explicitement.

- **2026-08-04 — Mutation-tests : 12 mutations, 12 rouges.** Chaque garde a été inversée puis restaurée, et la suite **doit** virer au rouge : ① le convertisseur d'unités privé de son `× 100` (F-095-1) ; ② l'avertissement de bascule branché sur la **frontière interne** au lieu du **plafond** (D-095-3) ; ③ la composante forfaitaire calculée au taux déclaratif (D-095-5) ; ④ nature absente ⇒ 2 % par défaut (D-095-6) ; ⑤ régime absent présumé `SYNTHETIQUE` (D-095-1) ; ⑥ la garde d'exclusivité désarmée ; ⑦ le provisionnement n'aiguillant plus (D-095-11) ; ⑧ l'exonération appliquée à un exercice **à cheval** (D-095-9) ; ⑨ le minimum annuel appliqué **après** l'exonération ; ⑩ l'écriture TPU au montant brut au lieu du delta ; ⑪ l'échéance acceptée sans calendrier publié (D-095-8) ; ⑫ le gel contrôlé sur un exercice **fourni par le client**.

### Vérification docker — persistance réelle (obligatoire, § DoD)

Stack `docker compose` complète, `balance-service` **redémarré** avant toute conclusion (le hot-reload peut annoncer « Found 0 errors » en exécutant l'ancien module). Deux organisations réelles créées via l'IdP, gates KYC/entitlement posées, référentiel `syscohada-revise@2.1` attribué.

**Dossier A — `Entreprenant TPU 095`, régime `SYNTHETIQUE` confirmé, CA 42 000 000 FCFA :**

| Contrôle | Résultat |
|---|---|
| **F-095-1 en réel** | la proposition de régime affiche « CA **42 000 000** ≤ plafond TPU **60 000 000** » — les deux grandeurs enfin dans la même unité. Avant le correctif, ce CA était comparé à un plafond cent fois trop bas et proposait `REEL` |
| TPU sans nature déclarée | **409 `NATURE_ACTIVITE_TPU_INDETERMINEE`**, message nommant les deux valeurs admises |
| `/fiscal/liquidation`, `/fiscal/tva`, `/fiscal/resultat-fiscal` | **409 `REGIME_INCOMPATIBLE`** sur les trois, message orientant vers `/fiscal/tpu` |
| `PUT /fiscal/tpu/parametrage` | **200** ; document réel dans **`tpu_parametrages`** (snake_case vérifié), `orgId` + `parUserId` + `natureActivite` persistés |
| `GET /fiscal/tpu` | composante `DECLARATIF`, taux **0.08**, TPU due **3 360 000 FCFA**, seuils publiés **séparément** (`plafondRegime` 60 M ≠ `forfaitaireCaMax` 30 M), `baremeForfaitaireDisponible: false`, **aucun** `CA_AU_DELA_DU_PLAFOND` (42 M < 60 M — le cadrage initial aurait averti à tort) |
| versement avec échéance `30-04` | **400 `ECHEANCE_INCONNUE`** (« échéances admises : (aucune publiée) ») et **aucun document orphelin** : `tpu_versements` reste à 0 |
| versement sans échéance | **201**, document réel dans **`tpu_versements`**, solde recalculé à `A_PAYER 2 360 000` |
| **écriture en balance** | balance v2 `origine: PROVISIONS_FISCALES`, chaînée à sa base : **`641` D 336 000 000 / `441` C 336 000 000**. **`89x` : 0 ligne. `443`/`445`/`4441`/`4449` : 0 ligne.** Équilibre des soldes exact (D = C = 4 536 000 000) |
| idempotence | 3 applications ⇒ **1 seule** balance provisionnée, 2 versions au total |
| gel après validation | `PUT parametrage`, `POST versement` et `DELETE versement` ⇒ **409** ; la nature et le versement en base sont **inchangés** ; `GET /fiscal/tpu` reste **200** (D-090-11) |

**Dossier B — `Cabinet Reel 095`, aucun profil (donc `REEL` par défaut, D-095-1) — la non-régression :**

| Contrôle | Résultat |
|---|---|
| `/fiscal/resultat-fiscal`, `/fiscal/liquidation`, `/fiscal/tva` | **200** sur les trois — comportement **identique** à avant STORY-095 |
| `/fiscal/tpu` | **409 `REGIME_INCOMPATIBLE`**, orienté vers les surfaces du réel |
| provisionnement | `regime: REEL`, écritures **`891`/`441`** (`source: liquidation`) — **aucun `641`**. La branche réelle est intacte |

### Revue de code — 4 constats corrigés, puis vérification docker **rejouée**

Rapport de revue : 6 constats ≥ 80 de confiance. Deux **bloquants**, retenus et corrigés ; deux de documentation ; deux écartés après examen (voir la PR).

| # | Constat | Traitement |
|---|---|---|
| **F-095-2** ⛔ | les routes du **registre des autres impôts et taxes** vivaient dans `TvaController`, dont elles héritaient `@RequiresRegime(REEL)`. Or la TPU est libératoire de l'IRPP-affaires, du MFP, de la patente et de la TVA — **et de rien d'autre** : un entreprenant doit toujours sa taxe sur les salaires. Il recevait **409 sur l'enregistrement d'une taxe qu'il doit**, et `taxesNonEcrites` valait toujours `0` dans la branche synthétique, rendant `TAXES_NON_REECRITES` **indéclenchable** alors que ce code le lit | routes sorties dans un **`TaxesController`** sans garde de régime |
| **F-095-3** ⛔ | la charge de TPU déjà comptabilisée était lue **par préfixe**, comme l'impôt sur le résultat. Mais `891` est un objet fiscal subdivisé alors que **`641` est la RACINE des impôts et taxes directs** : une taxe sur les salaires (`6413`) venait **éteindre une partie de la TPU due**, la dette envers l'État ressortant sous-provisionnée d'autant, sur une balance équilibrée et sans un seul avertissement. ⚠️ Le test qui prétendait couvrir le cas utilisait `645`, une **racine sœur** : il passait au vert quel que soit le comportement sur `641x` | lecture par **égalité stricte** (**D-095-13**) — le compte lu est exactement celui sur lequel on écrit, ce qui rend le delta exact et préserve l'idempotence |
| **F-095-4** | `supprimerVersement` était la **seule** des six méthodes de `TpuService` sans garde de régime — le motif « posée d'un côté et pas de l'autre » reproduit dans le service qui le dénonce. ⚠️ **La mutation est restée VERTE au premier passage** : aucun test ne le couvrait | garde ajoutée **et** assertion manquante écrite ; mutation rejouée ⇒ rouge |
| **F-095-5** | Swagger du provisionnement muet sur la branche synthétique (3 codes 409 nouveaux, écritures `64x`/`44x`) ; commentaire d'`exigerRegime` promettant une lecture unique du profil, fausse au niveau HTTP ; contradiction « minimum annuel appliqué » annoncée sur un exercice exonéré à TPU nulle | corrigés |

**Portes après correctifs** : lint 0 · build OK · **2 598** unit + **547** e2e verts · couverture **98.99 / 91.81 / 98.20 / 99.07** · **14 mutation-tests, 14 rouges** (les 2 nouveaux couvrent F-095-3 et F-095-4).

**Vérification docker rejouée** sur l'état final (les correctifs touchent la logique déjà éprouvée) — stack redémarrée, `Found 0 errors`, routes `taxes*` et `tpu*` remappées :

| Contrôle | Résultat |
|---|---|
| `GET /fiscal/taxes` sur un dossier `SYNTHETIQUE` | **200** — plus de `REGIME_INCOMPATIBLE` (F-095-2 levé) |
| `POST /fiscal/taxes/autres` sur ce même dossier | **409 `BALANCE_VALIDEE_IMMUABLE`** — le **gel**, plus le régime : la garde de régime ne s'interpose plus |
| `GET /fiscal/liquidation` | **409 `REGIME_INCOMPATIBLE`** — l'exclusivité tient toujours |
| **F-095-3 sur un dossier neuf** : balance portant `6413` = 900 000 F et un CA de 42 M | `chargeProvisionComptabilisee` = **0**, TPU écrite au montant **plein** (`641` D 3 360 000 / `441` C 3 360 000), `6413` **intact** en base. Avant le correctif, la dette envers l'État aurait été **minorée de 900 000 F** |

⚠️ **Incident d'infra pendant la re-vérification** : les conteneurs Mongo/Kafka/Redis/MinIO ont chuté, et Kafka a redémarré en boucle sur `all log dirs in /tmp/kafka-logs have failed` — volume corrompu par l'arrêt brutal. Volume `prospera_kafka-data` recréé (Mongo intact, les dossiers de vérification conservés). Sans rapport avec la story, mais à connaître : un `docker compose restart` sur un Kafka tué de force ne suffit pas.

⚠️ **Un piège rencontré et à retenir** : le premier contrôle du contenu de la balance a été fait avec un `findOne({origine:'PROVISIONS_FISCALES'})` **non scopé sur l'org** — il a rendu la balance d'un dossier de STORY-094, avec ses `891` et ses comptes de TVA, et faisait conclure à un aiguillage cassé. Le parc de vérification n'est jamais vide : **toute requête `mongosh` de contrôle doit porter `orgId`**.

---

**Status:** in_progress
**Dependencies:** **STORY-080** (`regimeFiscal` — l'aiguillage), **STORY-078** (paquet : seuils, taux, comptes), STORY-082/085 (CA de l'exercice), **STORY-092** (le CA sourcé du référentiel) · **alimente** **STORY-094** (écriture de la TPU dans la balance)
**⚠️ Question ouverte (PRD §13)** — **réduite de moitié** : la composante **déclarative** est complète et sourcée ; le **barème forfaitaire** (tarifs par activité/tonnage, Art. 130-131/135) reste à extraire — **prérequis de mise en production**, pas de développement
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A19 · CGI Togo 2026, Chap. V (régime de l'entreprenant / TPU, art. 128-139)
