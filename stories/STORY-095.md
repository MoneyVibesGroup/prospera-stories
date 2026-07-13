# STORY-095 : Régime synthétique / TPU (taxe professionnelle unique — calcul forfaitaire + déclaratif)

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A19 (volet synthétique) · `rapport-bilan-logique-metier-2026-07-12.md` §15 (CGI Togo 2026, **Chap. V — régime de l'entreprenant / TPU**, art. 128-135 ; seuil de CA ~30 M FCFA) · `referentiels/paquet-fiscal-togo-2026.json` · STORY-080 (détermination du régime)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 18 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A19 (volet **régime synthétique / TPU**)

> **L'autre moitié du marché — et un moteur fiscal entièrement différent.** Tout ce qui précède (résultat fiscal, IS, MFP, TVA) concerne le **régime réel**. Mais la majorité des **petites structures** ouest-africaines relèvent du **régime synthétique** : au Togo, le régime de l'**entreprenant**, dont l'impôt est la **TPU (Taxe Professionnelle Unique)**.
>
> **La TPU n'est pas un « IS simplifié ».** C'est une **taxe unique** qui **remplace** l'IS **et** la TVA **et** la patente : elle se calcule sur le **chiffre d'affaires** (barème par tranches), pas sur le bénéfice. Conséquence : pas de résultat fiscal, pas de réintégrations, **pas de TVA à déclarer**. Un moteur qui appliquerait l'IS à un entreprenant produirait une liasse **absurde**. Cette story implémente la **branche synthétique** du moteur, **aiguillée par STORY-080**.

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
| **SYNTHÉTIQUE** | **TPU** (taxe unique) | **Chiffre d'affaires** (barème par tranches) | **NON** — la TPU l'inclut | **095 (ici)** |

> **Ce que la TPU remplace (CGI Togo, Chap. V) :** l'**impôt sur le revenu/les sociétés**, la **TVA**, la **patente**. Un entreprenant ne déclare **pas** de TVA — lui en calculer une serait une **erreur de régime**, et lui appliquer l'IS/MFP par-dessus la TPU serait une **double imposition**.

> **⚠️ Question ouverte assumée (PRD §13).** Le **barème TPU par tranches** n'est **pas encore complété** dans `paquet-fiscal-togo-2026.json` (le CGI le fixe, l'extraction reste à faire). Cette story implémente le **moteur générique** (barème par tranches **lu du paquet**) ; **si le barème est absent → erreur explicite** (`BAREME_TPU_INDISPONIBLE`), **jamais un taux deviné**. Compléter le barème est un **prérequis de mise en production**, pas de développement.

### Périmètre

**Inclus :**

- **Aiguillage du moteur fiscal** (`MoteurFiscalService`) :
  - Lit le **`regimeFiscal`** du profil (STORY-080).
  - `REEL` → STORY-091 (résultat fiscal) + 092 (IS/MFP) + 093 (TVA).
  - `SYNTHETIQUE` → **STORY-095** (TPU) — et **désactive** IS/MFP/TVA.
  - **Test de non-régression capital** : un dossier `SYNTHETIQUE` **ne produit ni IS, ni MFP, ni déclaration de TVA** ; un dossier `REEL` **ne produit pas de TPU**. **Les deux branches sont exclusives.**
- **`TpuService.calculer(orgId, exercice)`** :
  - **Base** = **chiffre d'affaires** de l'exercice (produits classe 7, **TTC** — l'entreprenant ne ventile pas la TVA).
  - **Barème par tranches lu du paquet** : `[{ trancheMin, trancheMax, taux | montantForfaitaire }]` → calcul progressif **ou** forfait selon la structure du barème (le moteur supporte **les deux** — le paquet décide).
  - **Minimum de perception** éventuel (si le paquet en prévoit un) → **plancher**.
  - **Vérification de seuil** : si le **CA dépasse le seuil du régime synthétique** (paquet, Togo ~30 M) → **avertissement fort** : « CA au-delà du seuil TPU — bascule au réel à envisager » (le changement de régime **n'est pas automatique** : c'est une décision, STORY-080).
  - **Aucun barème dans le paquet → `BAREME_TPU_INDISPONIBLE` (erreur explicite)** — **jamais** de taux par défaut.
- **Volet déclaratif** :
  - `POST /api/v1/fiscal/tpu/versements` : versements/acomptes de TPU déjà payés `{ echeance, montant, datePaiement, pieceRef? }` (calendrier **du paquet**).
  - **Solde** = `TPU due − Σ versements` → **à payer** ou **crédit**.
  - `GET /api/v1/fiscal/tpu?exercice=` → base (CA), tranche appliquée, TPU due, versements, solde — chaque montant **traçable** (barème, **version du paquet**).
- **Écriture dans la balance** (via **STORY-094**) : la TPU est une **charge** (`64x` — impôts et taxes) et une **dette envers l'État** (`44x`) → **remplace** les écritures d'IS/TVA du réel. *(STORY-094 consomme le montant produit ici.)*
- **Comptabilité allégée** : un entreprenant tient généralement une comptabilité **SMT** (axe comptable, STORY-080) — mais **pas nécessairement** (les axes sont **orthogonaux**) : le moteur TPU fonctionne **quel que soit** le système comptable.
- **Tests** : calcul TPU sur barème par tranches (plusieurs tranches) ; **barème forfaitaire** ; **minimum de perception** ; **barème absent → `BAREME_TPU_INDISPONIBLE`** *(jamais de taux deviné)* ; **CA > seuil → avertissement de bascule** (sans changement automatique) ; versements déduits → solde/crédit ; **⚠️ dossier SYNTHETIQUE → aucun IS, aucune MFP, aucune TVA** *(test central)* ; **⚠️ dossier REEL → aucune TPU** ; TPU écrite en `64x`/`44x` (STORY-094) ; traçabilité (barème + version du paquet) ; immutabilité après validation (**409**).

**Hors périmètre :**

- **Régime réel** (IS, MFP, résultat fiscal, TVA) → **STORY-091/092/093**.
- **Détermination du régime** → **STORY-080** (cette story **consomme** `regimeFiscal`).
- **Écriture effective dans la balance** → **STORY-094** (qui consomme le montant de TPU).
- **Complétion du barème TPU** dans le paquet → **question ouverte (PRD §13)** — travail de **référentiel** (admin/expert), pas de code. *Prérequis de mise en production.*
- **Bascule automatique de régime** en cours d'exercice → **interdit** : c'est une **décision** (STORY-080), pas un calcul.
- **Autres régimes** (micro-entreprise d'autres pays UEMOA) → couverts **par construction** si leur paquet expose un barème compatible ; à valider pays par pays.

### Flux

1. Le profil société (STORY-079) + la détermination des axes (STORY-080) donnent : `systemeComptable: SMT`, **`regimeFiscal: SYNTHETIQUE`**.
2. Les cahiers sont saisis (STORY-082/083) ; la balance est produite (STORY-085). **CA de l'exercice = 18 400 000 XOF** (TTC — l'entreprenant ne ventile pas la TVA).
3. Le cabinet demande la fiscalité : le **`MoteurFiscalService`** **aiguille** vers la branche **synthétique** :
   - ❌ **Pas** de résultat fiscal (STORY-091 **non appelée**)
   - ❌ **Pas** d'IS ni de MFP (STORY-092 **non appelée**)
   - ❌ **Pas** de déclaration de TVA (STORY-093 **non appelée**) — *la TPU l'inclut*
   - ✅ **TPU** (STORY-095)
4. `GET /api/v1/fiscal/tpu?exercice=2026` :
   - Base (CA) : **18 400 000**
   - **Barème du paquet `TG@2026`** → tranche applicable → **TPU due** (montant selon barème)
   - **CA (18,4 M) < seuil (~30 M)** ✔ → régime cohérent, **aucun avertissement**
5. **Versements** déjà effectués : déduits → **solde à payer** (ou crédit).
6. **STORY-094** écrit la TPU dans la balance : `64x` (**D**, charge) / `44x` (**C**, dette) — **pas** de `891`/`441` (IS), **pas** de `4441` (TVA).
7. *(Variante)* Le CA atteint **32 M** → **avertissement** : « CA au-delà du seuil TPU — bascule au réel à envisager pour l'exercice suivant » → le cabinet **décide** (STORY-080), le système ne bascule **pas** tout seul.
8. *(Variante)* Le **barème est absent** du paquet → **`BAREME_TPU_INDISPONIBLE`** : le calcul **s'arrête**. **Aucun taux deviné** — un impôt inventé est pire que pas d'impôt calculé.

---

## Acceptance Criteria

- [ ] **Aiguillage du moteur fiscal** selon `regimeFiscal` (STORY-080) : `REEL` → 091/092/093 ; **`SYNTHETIQUE` → 095 (TPU)**.
- [ ] **⚠️ Exclusivité des branches** *(tests centraux)* : un dossier **`SYNTHETIQUE`** ne produit **ni IS, ni MFP, ni déclaration de TVA** ; un dossier **`REEL`** ne produit **pas de TPU**.
- [ ] **`TpuService.calculer()`** : base = **CA de l'exercice** (classe 7, **TTC**) ; **barème par tranches lu du paquet** (progressif **ou** forfaitaire — le paquet décide) ; **minimum de perception** appliqué si le paquet en prévoit un.
- [ ] **⚠️ Barème absent du paquet → `BAREME_TPU_INDISPONIBLE`** (erreur explicite) — **jamais** de taux par défaut ni deviné (NFR-A06).
- [ ] **Seuil de régime** : **CA > seuil** (paquet, Togo ~30 M) → **avertissement fort** (« bascule au réel à envisager ») ; **aucun changement automatique de régime** (c'est une décision — STORY-080).
- [ ] **Versements de TPU** enregistrables (calendrier **du paquet**) ; **solde** = `TPU due − Σ versements` → **à payer** ou **crédit**.
- [ ] **`GET /fiscal/tpu?exercice=`** : base, tranche appliquée, TPU due, versements, solde — **traçable** (barème, **version du paquet**).
- [ ] **Écriture dans la balance** (via **STORY-094**) : TPU en **`64x` (D)** / **`44x` (C)** — **pas** de `891`/`441`, **pas** de `4441`.
- [ ] **Indépendance des axes** : le moteur TPU fonctionne **quel que soit** le système comptable (`SMT` **ou** `SN`) — les axes restent **orthogonaux** (STORY-080).
- [ ] **Traçabilité (NFR-A07)** : barème appliqué, tranche, **version du paquet**, auteur, date.
- [ ] **Immutabilité** après validation → **409**.
- [ ] **Tests** : barème par tranches, barème forfaitaire, minimum de perception, **barème absent → erreur**, **CA > seuil → avertissement (sans bascule)**, versements/solde, **SYNTHETIQUE → 0 IS/MFP/TVA**, **REEL → 0 TPU**, écriture `64x`/`44x`, axes orthogonaux, immutabilité. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### L'aiguillage — deux branches exclusives

```typescript
@Injectable()
export class MoteurFiscalService {
  async calculer(orgId: string, exercice: DateRange): Promise<ResultatFiscalComplet> {
    const profil = await this.profilSociete.get(orgId);   // STORY-079/080

    switch (profil.regimeFiscal) {
      case 'REEL':
        // Résultat fiscal → IS = max(MFP, IS) → TVA
        return {
          type: 'REEL',
          resultatFiscal: await this.resultatFiscal.calculer(orgId, exercice),   // 091
          liquidation:    await this.liquidation.liquider(orgId, exercice),      // 092
          tva:            await this.tva.calculer(orgId, exercice),              // 093
        };

      case 'SYNTHETIQUE':
        // ⚠️ La TPU REMPLACE l'IS, la MFP ET la TVA (CGI Chap. V).
        //    Ne JAMAIS appeler 091/092/093 ici — ce serait une double imposition.
        return {
          type: 'SYNTHETIQUE',
          tpu: await this.tpu.calculer(orgId, exercice),                          // 095
        };
    }
  }
}
```

### La TPU — barème du paquet, jamais deviné

```typescript
async calculer(orgId: string, exercice: DateRange): Promise<Tpu> {
  const profil = await this.profilSociete.get(orgId);
  const paquet = await this.paquetFiscal.get(profil.pays, exercice.fin.getFullYear());

  // ⚠️ Question ouverte (PRD §13) : le barème TPU du paquet TG@2026 reste à compléter.
  //    Sans barème : on LÈVE. Un impôt inventé est pire qu'un impôt non calculé.
  if (!paquet.taux.tpu?.length) {
    throw new BadRequestException('BAREME_TPU_INDISPONIBLE');
  }

  const ca = await this.caService.calculerTtc(orgId, exercice);   // classe 7, TTC (pas de ventilation TVA)

  // Avertissement de seuil — mais AUCUNE bascule automatique (c'est une décision : STORY-080)
  const avertissements: string[] = [];
  if (ca > paquet.seuilsRegime.syntheticCaMax) {
    avertissements.push(
      `CA (${fmt(ca)}) au-delà du seuil TPU (${fmt(paquet.seuilsRegime.syntheticCaMax)}) — bascule au réel à envisager`,
    );
  }

  const tranche = paquet.taux.tpu.find(t => ca >= t.trancheMin && ca <= t.trancheMax);
  if (!tranche) throw new BadRequestException('TRANCHE_TPU_INTROUVABLE');

  // Le paquet décide : barème progressif (taux) OU forfait (montantForfaitaire)
  let tpuDue = tranche.montantForfaitaire ?? Math.round(tranche.taux * ca);
  if (paquet.taux.tpuMinimum) tpuDue = Math.max(tpuDue, paquet.taux.tpuMinimum);

  const versements = await this.versements.total(orgId, exercice);
  const solde = tpuDue - versements;

  return {
    baseCa: ca, tranche, tpuDue, versements,
    solde: Math.abs(solde), sens: solde >= 0 ? 'A_PAYER' : 'CREDIT',
    avertissements, paquetVersion: paquet.version,
  };
}
```

### Les tests d'exclusivité (les plus importants)

```typescript
it('SYNTHÉTIQUE : aucun IS, aucune MFP, aucune TVA', async () => {
  const r = await moteur.calculer(orgSynthetique, ex2026);

  expect(r.type).toBe('SYNTHETIQUE');
  expect(r.tpu).toBeDefined();
  expect((r as any).liquidation).toBeUndefined();   // ⚠️ pas d'IS/MFP
  expect((r as any).tva).toBeUndefined();           // ⚠️ pas de TVA — la TPU l'inclut
});

it('RÉEL : aucune TPU', async () => {
  const r = await moteur.calculer(orgReel, ex2026);

  expect(r.type).toBe('REEL');
  expect((r as any).tpu).toBeUndefined();
});
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **⚠️ Appliquer l'IS/la TVA à un entreprenant** → double imposition, liasse absurde | **Branches exclusives** aiguillées par `regimeFiscal` ; **tests d'exclusivité** dans les deux sens |
| **Barème TPU absent** (question ouverte) → taux deviné | **`BAREME_TPU_INDISPONIBLE`** : le calcul **s'arrête**. Un impôt inventé est pire que pas d'impôt (NFR-A06) |
| Bascule automatique de régime au dépassement du seuil | **Interdit** : **avertissement** seulement ; la bascule est une **décision** (STORY-080) |
| Confondre les axes (SMT ⇒ TPU) | Axes **orthogonaux** : le moteur TPU tourne **quel que soit** le système comptable — test dédié |
| TPU écrite comme un IS (`891`/`441`) | TPU = **charge `64x`** / **dette `44x`** (impôts et taxes), **pas** un impôt sur le résultat |
| Barème d'un autre pays incompatible | Moteur **générique** (tranches : taux **ou** forfait, minimum) piloté **par le paquet** — extensible sans code |
| Mise en production sans barème | **Prérequis explicite** : compléter le barème TPU du paquet (question ouverte PRD §13) |

---

## Definition of Done

- [ ] Aiguillage `MoteurFiscalService` selon `regimeFiscal` (branches **exclusives**)
- [ ] **Tests d'exclusivité** : SYNTHETIQUE → 0 IS/MFP/TVA ; REEL → 0 TPU
- [ ] `TpuService` : base CA (TTC), **barème du paquet** (tranches : taux **ou** forfait), minimum de perception
- [ ] **`BAREME_TPU_INDISPONIBLE`** si le paquet n'a pas de barème (aucun taux deviné)
- [ ] Seuil dépassé → **avertissement**, **aucune bascule automatique**
- [ ] Versements + solde (à payer / crédit) ; traçabilité (barème, version du paquet)
- [ ] Écriture `64x`/`44x` via STORY-094 (ni `891`/`441`, ni `4441`)
- [ ] Axes orthogonaux respectés (TPU possible en SN comme en SMT)
- [ ] Immutabilité après validation (409)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] **⚠️ Prérequis de mise en production signalé** : compléter le **barème TPU** du paquet `TG@2026` (question ouverte PRD §13)
- [ ] Non-régression : STORY-091/092/093 (branche réelle) verts

---

**Status:** ready-for-dev
**Dependencies:** **STORY-080** (`regimeFiscal` — l'aiguillage), **STORY-078** (paquet : **barème TPU**, seuils, calendrier), STORY-082/085 (CA de l'exercice) · **alimente** **STORY-094** (écriture de la TPU dans la balance)
**⚠️ Question ouverte (PRD §13)** : **barème TPU par tranches à compléter** dans `paquet-fiscal-togo-2026.json` — **prérequis de mise en production**, pas de développement
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A19 · CGI Togo 2026, Chap. V (régime de l'entreprenant / TPU, art. 128-135)
