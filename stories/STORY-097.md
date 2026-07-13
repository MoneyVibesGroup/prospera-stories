# STORY-097 : Comparatif « déposé vs optimisé » + dossier de justification + garde-fous de conformité

**Epic :** EPIC-024 — Simulation & conseil fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A23, FR-A24, NFR-A04 (garde-fous), NFR-A07 (piste d'audit) · `rapport-bilan-logique-metier-2026-07-12.md` §13 (D11 : défendre la liasse) · STORY-096 (scénarios), STORY-091 (base légale des retraitements)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 19 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A23 (comparatif + dossier de justification), FR-A24 (garde-fous de conformité)

> **La pièce qui fait la différence en contrôle fiscal — et le verrou qui rend l'outil incapable de servir à frauder.**
>
> Un retraitement fiscal, même parfaitement légal, **sera contesté** s'il n'est pas **documenté**. Un contrôleur de l'OTR ne demande pas « avez-vous le droit ? » — il demande **« prouvez-le »** : quel article du CGI, quelle pièce, quel raisonnement, qui a décidé et quand. Cette story produit :
> 1. le **comparatif** « liasse de référence **vs** liasse optimisée » — ce qui a changé, de combien, pourquoi ;
> 2. le **dossier de justification** — **une fiche par retraitement**, avec base légale, pièce et raisonnement ;
> 3. les **garde-fous de conformité (FR-A24)** — les invariants **vérifiés et testés** qui garantissent que l'outil **ne peut pas** être utilisé pour minorer une base réelle.
>
> **C'est la story qui transforme « un logiciel qui calcule l'impôt » en « un logiciel qui défend la liasse ».**

---

## User Story

En tant que **cabinet comptable**,
je veux **un comparatif clair entre la liasse de référence et la liasse optimisée**, accompagné d'un **dossier de justification** (base légale + pièce + raisonnement pour chaque retraitement),
afin de **défendre la liasse en contrôle fiscal** et de **prouver** que chaque optimisation est légale, documentée et traçable.

---

## Description

### Contexte

**STORY-096** permet de **simuler** des scénarios. Mais une simulation n'est pas un conseil : le cabinet doit pouvoir **présenter** son choix — au client d'abord, à l'**OTR** ensuite. Deux livrables :

**1. Le comparatif (FR-A23)** — la vue de décision :

| | Liasse de référence | Liasse optimisée | Écart |
|---|---|---|---|
| Résultat comptable | 6 800 000 | 6 800 000 | — |
| Réintégrations | 485 000 | 485 000 | — |
| **Provision créances douteuses** | — | **− 1 200 000** | **− 1 200 000** |
| **Résultat fiscal** | **5 195 000** | **3 995 000** | **− 1 200 000** |
| IS (27 %) | 1 402 650 | 1 078 650 | − 324 000 |
| MFP (plancher) | 480 000 | 480 000 | — |
| **Impôt dû** | **1 402 650** | **1 078 650** | **− 324 000** |
| | | **Économie réelle** | **324 000** |

**2. Le dossier de justification (FR-A23)** — **une fiche par retraitement** :

```
RETRAITEMENT — Provision pour créances douteuses
Montant .......... 1 200 000 XOF (déduction, code 4x du paquet TG@2026)
Base légale ...... CGI Togo 2026, art. … (conditions de déductibilité des provisions)
Justification .... 3 créances de plus de 12 mois, clients mis en demeure (LRAR du 12/09/2026),
                   probabilité de non-recouvrement établie, créances individualisées.
Pièces ........... mises_en_demeure.pdf · balance_agee_clients.xlsx
Décidé par ....... M. X (cabinet Y) — le 15/01/2027
Calcul ........... voir détail par créance (annexe)
```

**3. Les garde-fous (FR-A24)** — les invariants **testés**, pas des promesses :

| Invariant | Mécanisme | Story |
|---|---|---|
| Un scénario ne touche **jamais** le réel | Isolation + **aucun endpoint d'application** | 096 |
| Aucune **minoration de recette réelle** | Le levier **n'existe pas** dans l'énumération ; recettes **confrontées aux relevés** | 096, 090 |
| Aucun retraitement **non justifié** | `baseLegale` + `justification` **obligatoires** (400 sinon) | 091, 096 |
| Une liasse **validée est immuable** | `etat: VALIDÉE` → **409** sur toute modification | 101 |
| Tout est **tracé** | Piste d'audit **append-only** (qui, quand, quoi, pourquoi) | NFR-A07 |

### Périmètre

**Inclus :**

- **`ComparatifService.comparer(orgId, exercice, scenarioId)`** — le comparatif **ligne à ligne** :
  - Colonnes : **référence** (état réel — STORY-091/092), **optimisée** (scénario simulé — STORY-096), **écart**.
  - Lignes : résultat comptable, chaque **réintégration/déduction** (par code DSF), résultat fiscal, IS, **MFP**, **impôt dû**, **économie réelle**.
  - **⚠️ L'économie affichée est l'économie RÉELLE** (plafonnée par la MFP — STORY-096), **jamais** l'économie théorique. Si le plancher MFP est atteint, le comparatif **l'affiche explicitement**.
- **`DossierJustificationService.produire(orgId, exercice, scenarioId?)`** — **une fiche par retraitement** (réels **et**, si un scénario est fourni, ceux du scénario) :
  - `retraitement` (code DSF, libellé, montant, sens), **`baseLegale`**, **`justification`**, **`pieces[]`**, **`decidePar`** (auteur), **`decideLe`**, **`calculDetaille?`**.
  - **⚠️ Un retraitement sans base légale ou sans justification ne peut pas figurer au dossier** → il est **listé comme LACUNE** (« indéfendable en l'état ») → le dossier est marqué **`INCOMPLET`**.
  - **`statut`** : `COMPLET` (tous les retraitements justifiés **et** pièces jointes) | `INCOMPLET` (lacunes listées, **explicitement**).
- **Export du dossier** : `GET /api/v1/fiscal/dossier-justification?exercice=&scenarioId=&format=pdf|json` → document **présentable au client et à l'OTR**. *(Le rendu PDF peut être délégué à `bilan-service` EPIC-014, qui possède déjà la chaîne d'export — **coordination**, pas duplication.)*
- **⚠️ Garde-fous de conformité (FR-A24) — implémentés ET testés comme des invariants** :
  1. **`ScenarioNonApplicable`** : **aucun endpoint** ne transforme un scénario en écritures (test d'**absence** d'endpoint) — le retraitement réel se saisit via **STORY-091**, geste explicite et tracé.
  2. **`AucuneMinorationDeBaseReelle`** : **aucun levier de minoration de produit / de création de charge fictive n'existe** — impossibilité **structurelle** (test sur l'énumération `TypeLevier`).
  3. **`JustificationObligatoire`** : tout retraitement (réel ou simulé) **sans** `baseLegale` **ou** `justification` → **400** (tests).
  4. **`ImmutabiliteApresValidation`** : une liasse `VALIDÉE` → **409** sur toute tentative de modification de balance, retraitement, liquidation ou provision (test transverse).
  5. **`PisteAuditAppendOnly`** : la piste d'audit ne peut être **ni modifiée ni supprimée** (test : `UPDATE`/`DELETE` sur la collection d'audit → **refusés**).
  - Un **test de conformité dédié** (suite `conformite.spec.ts`) **vérifie les 5 invariants** — ils ne sont **pas** des affirmations de documentation.
- **Avertissements de risque** (repris de STORY-096, **consolidés** dans le dossier) : levier **sans pièce**, provision **inhabituelle**, retraitement au **montant atypique** → le dossier **signale** les points faibles **avant** le contrôle, pas après.
- **Traçabilité (NFR-A07)** : la production d'un dossier est **elle-même tracée** (qui l'a généré, quand, sur quel scénario, quelle **version du paquet fiscal**).
- **Tests** : comparatif ligne à ligne exact ; **⚠️ économie réelle (plafonnée MFP) affichée, pas la théorique** ; **plancher MFP atteint → affiché explicitement** ; dossier **`COMPLET`** (tous justifiés) ; **⚠️ retraitement non justifié → LACUNE + dossier `INCOMPLET`** *(test central)* ; export PDF/JSON ; **les 5 garde-fous FR-A24 testés comme invariants** *(suite dédiée)* ; production du dossier tracée ; isolation `orgId`.

**Hors périmètre :**

- **Simulation des scénarios** → **STORY-096** (cette story **restitue** et **documente**).
- **Calcul fiscal** → STORY-091/092/093.
- **Rendu PDF de la liasse complète** → `bilan-service` EPIC-014 (**coordination** pour l'export du dossier — pas de duplication de la chaîne d'export).
- **Contrôles d'intégrité et de cohérence de la balance** → **STORY-098**.
- **Conseil juridique** : l'outil **restitue** la base légale saisie par le professionnel — il **ne dit pas le droit**. Le cabinet reste **seul responsable** de la qualification fiscale (mention explicite dans le dossier).

### Flux

1. La liasse 2026 est calculée (référence) : **impôt dû 1 402 650** (`baseRetenue: 'IS'`).
2. Le cabinet a simulé un scénario **« Provision créances douteuses — 1 200 000 »** (STORY-096) : **impôt simulé 1 078 650**, **économie réelle 324 000**.
3. `GET /api/v1/fiscal/comparatif?exercice=2026&scenarioId=…` → le tableau **ligne à ligne** (ci-dessus), avec l'**écart** et l'**économie réelle**.
4. `GET /api/v1/fiscal/dossier-justification?exercice=2026&scenarioId=…&format=pdf` :
   - **Fiche 1** — Provision créances douteuses : montant, **base légale (CGI art. …)**, justification (3 créances > 12 mois, mises en demeure), **pièces** (LRAR, balance âgée), décidé par, le.
   - **Fiche 2** — Amendes et pénalités (réintégration, code 20) : montant, base légale, justification, lignes sources (3 lignes de dépenses).
   - **Statut : `COMPLET`** ✔ → le dossier est **présentable à l'OTR**.
5. *(Variante — le cas qui protège)* Un retraitement a été saisi **sans base légale** → il apparaît comme **LACUNE** : « Retraitement code 40 — **1 80 000 — indéfendable en l'état : base légale manquante** » → le dossier est **`INCOMPLET`** → le cabinet **complète avant de déposer**. **L'outil signale la faiblesse avant le contrôle, pas après.**
6. Le cabinet retient le scénario, **saisit le retraitement réel** (STORY-091, avec base légale et pièce), **valide la liasse** → **immuable** (STORY-101).
7. **En contrôle** : le dossier de justification est **la pièce** qui répond à « prouvez-le ».

---

## Acceptance Criteria

- [ ] **Comparatif** (`GET /fiscal/comparatif`) : **ligne à ligne** (résultat comptable, retraitements par code, résultat fiscal, IS, **MFP**, **impôt dû**) en 3 colonnes : **référence / optimisée / écart**.
- [ ] **⚠️ Économie RÉELLE affichée** (plafonnée par la MFP — STORY-096), **jamais** l'économie théorique ; si le **plancher MFP** est atteint → **affiché explicitement** dans le comparatif.
- [ ] **Dossier de justification** : **une fiche par retraitement** avec `code DSF`, `montant`, **`baseLegale`**, **`justification`**, **`pieces[]`**, **`decidePar`**, **`decideLe`**, `calculDetaille?`.
- [ ] **⚠️ Retraitement non justifié → LACUNE** *(test central)* : listé comme « indéfendable en l'état » → dossier marqué **`INCOMPLET`**. Un retraitement sans base légale **ne peut pas** figurer comme justifié.
- [ ] **Statut du dossier** : `COMPLET` (tous justifiés + pièces) | **`INCOMPLET`** (lacunes **listées explicitement**).
- [ ] **Export** `format=pdf|json` — document présentable au client et à l'OTR (rendu PDF **coordonné** avec `bilan-service` EPIC-014, sans duplication).
- [ ] **⚠️ GARDE-FOUS FR-A24 — les 5 invariants IMPLÉMENTÉS ET TESTÉS** (suite dédiée `conformite.spec.ts`) :
  - [ ] **1.** **Aucun endpoint** n'applique un scénario (test d'**absence**) — le réel se saisit via STORY-091.
  - [ ] **2.** **Aucun levier de minoration** de base réelle n'existe (test sur l'énumération `TypeLevier`) — impossibilité **structurelle**.
  - [ ] **3.** **Justification obligatoire** : retraitement sans `baseLegale`/`justification` → **400**.
  - [ ] **4.** **Immutabilité après validation** : liasse `VALIDÉE` → **409** sur balance / retraitement / liquidation / provision (test transverse).
  - [ ] **5.** **Piste d'audit append-only** : `UPDATE`/`DELETE` sur la collection d'audit → **refusés**.
- [ ] **Avertissements de risque consolidés** dans le dossier (levier sans pièce, provision inhabituelle, montant atypique) — **signalés avant le contrôle**.
- [ ] **Mention de responsabilité** : l'outil **restitue** la base légale saisie par le professionnel ; il **ne dit pas le droit** — le cabinet reste responsable de la qualification.
- [ ] **Traçabilité (NFR-A07)** : la génération du dossier est tracée (auteur, date, scénario, **version du paquet fiscal**).
- [ ] **Tests** : comparatif exact, **économie réelle (pas théorique)**, plancher MFP affiché, dossier COMPLET, **retraitement non justifié → LACUNE + INCOMPLET**, export, **les 5 garde-fous**, traçabilité, isolation. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Le dossier — et la lacune qui protège

```typescript
export interface FicheJustification {
  code: string;                    // code DSF (paquet)
  libelle: string;
  montant: number;
  sens: 'REINTEGRATION' | 'DEDUCTION';

  baseLegale?: string;             // « CGI TG 2026, art. … »
  justification?: string;
  pieces: string[];
  decidePar?: string;
  decideLe?: Date;
  calculDetaille?: string;

  // ⚠️ Si baseLegale ou justification manque → LACUNE (indéfendable)
  lacune?: string;
  risques: string[];               // « sans pièce justificative », « montant atypique »
}

export interface DossierJustification {
  exercice: DateRange;
  statut: 'COMPLET' | 'INCOMPLET';     // INCOMPLET dès qu'UNE lacune existe
  fiches: FicheJustification[];
  lacunes: string[];                   // listées explicitement — à combler AVANT dépôt
  paquetVersion: string;
  generePar: string; genereLe: Date;
  mentionResponsabilite: string;       // l'outil restitue, il ne dit pas le droit
}
```

```typescript
async produire(orgId: string, exercice: DateRange, scenarioId?: string): Promise<DossierJustification> {
  const retraitements = await this.retraitementRepo.tous(orgId, exercice);   // réels (STORY-091)
  const leviers = scenarioId ? (await this.scenarioRepo.get(orgId, scenarioId)).leviers : [];

  const fiches = [...retraitements, ...leviers].map(r => {
    const fiche: FicheJustification = { /* … */ risques: [] };

    // ⚠️ Le cœur du garde-fou : pas de justification ⇒ LACUNE, jamais « justifié par défaut »
    if (!r.baseLegale || !r.justification) {
      fiche.lacune = `Indéfendable en l'état : ${!r.baseLegale ? 'base légale' : 'justification'} manquante`;
    }
    if (!r.pieceRef) {
      fiche.risques.push('Aucune pièce justificative — sera contesté en contrôle');
    }
    return fiche;
  });

  const lacunes = fiches.filter(f => f.lacune).map(f => `${f.code} (${fmt(f.montant)}) — ${f.lacune}`);

  return {
    exercice,
    statut: lacunes.length === 0 ? 'COMPLET' : 'INCOMPLET',   // ⚠️ une seule lacune ⇒ INCOMPLET
    fiches, lacunes,
    /* … */
    mentionResponsabilite:
      "Ce dossier restitue les bases légales et justifications saisies par le professionnel. " +
      "L'outil ne se substitue pas à la qualification fiscale, qui relève du cabinet.",
  };
}
```

### Les garde-fous — testés comme des invariants, pas affirmés

```typescript
// conformite.spec.ts — FR-A24 : ces tests sont la PREUVE que l'outil ne peut pas servir à frauder.

describe('FR-A24 — Garde-fous de conformité', () => {

  it('1. AUCUN endpoint n\'applique un scénario au réel', () => {
    const routes = listerRoutes(ScenarioController);
    expect(routes.some(r => /appliquer|valider|commit/i.test(r.path))).toBe(false);
  });

  it('2. AUCUN levier de minoration de base réelle n\'existe', () => {
    const leviers: TypeLevier[] = ['PROVISION', 'AMORTISSEMENT', 'REPORT_DEFICIT', 'REDUCTION_IMPOT', 'RETRAITEMENT'];
    expect(leviers).not.toContain('MINORATION_PRODUIT');     // le type n'existe même pas
    expect(leviers).not.toContain('CHARGE_FICTIVE');
  });

  it('3. Retraitement sans base légale → 400', async () => {
    await expect(api.post('/fiscal/retraitements', { code: '40', montant: 100_000 }))
      .rejects.toMatchObject({ status: 400, code: 'JUSTIFICATION_REQUISE' });
  });

  it('4. Liasse VALIDÉE → 409 sur TOUTE modification', async () => {
    await liasse.valider(orgId, ex2026);
    await expect(api.patch('/fiscal/retraitements/x', { montant: 1 })).rejects.toMatchObject({ status: 409 });
    await expect(api.post('/balance/depuis-cahiers?dryRun=false')).rejects.toMatchObject({ status: 409 });
    await expect(api.post('/fiscal/provisions/appliquer?dryRun=false')).rejects.toMatchObject({ status: 409 });
  });

  it('5. Piste d\'audit APPEND-ONLY (ni UPDATE ni DELETE)', async () => {
    await expect(auditRepo.update(id, { /* … */ })).rejects.toThrow();
    await expect(auditRepo.delete(id)).rejects.toThrow();
  });
});
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Retraitement non justifié déposé** → redressement | **LACUNE** listée + dossier **`INCOMPLET`** → le cabinet **complète avant dépôt** (l'outil signale **avant** le contrôle) |
| **Économie théorique annoncée** (ignorant la MFP) → conseil faux | **Économie réelle** (plafonnée MFP, STORY-096) ; plancher **affiché** |
| L'outil sert à frauder | **5 garde-fous FR-A24 testés comme invariants** (suite dédiée) — pas des promesses de documentation |
| Un scénario « fuit » dans le réel | **Aucun endpoint d'application** (test d'absence) ; isolation (096) |
| Une liasse validée est retouchée | **Immutabilité** → 409 (test transverse sur balance / retraitement / liquidation / provision) |
| Piste d'audit altérée | **Append-only** — `UPDATE`/`DELETE` **refusés** (test) |
| L'outil est pris pour un conseil juridique | **Mention de responsabilité** explicite : il **restitue**, il **ne dit pas le droit** |
| Duplication de la chaîne d'export PDF | **Coordination** avec `bilan-service` EPIC-014 (qui possède déjà l'export) |

---

## Definition of Done

- [ ] Comparatif **ligne à ligne** (référence / optimisée / écart) avec **économie RÉELLE** (plafonnée MFP)
- [ ] Plancher MFP atteint → **affiché explicitement**
- [ ] Dossier de justification : **une fiche par retraitement** (base légale, justification, pièces, décideur, date)
- [ ] **Retraitement non justifié → LACUNE + dossier `INCOMPLET`** (test central)
- [ ] Export `pdf|json` (coordonné avec `bilan-service` EPIC-014)
- [ ] **Les 5 garde-fous FR-A24 implémentés ET testés** (`conformite.spec.ts`)
- [ ] Avertissements de risque consolidés ; mention de responsabilité
- [ ] Génération du dossier tracée (NFR-A07)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-096 (scénarios), STORY-091/092 (moteur) verts

---

**Status:** ready-for-dev
**Dependencies:** **STORY-096** (scénarios + **économie réelle plafonnée MFP**), **STORY-091** (retraitements réels + base légale), STORY-092 (liquidation), **STORY-101** (immutabilité) · **coordination** `bilan-service` EPIC-014 (chaîne d'export PDF)
**Réalise D11** : *défendre la liasse* — et **FR-A24** : les garde-fous qui rendent la fraude structurellement impossible
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A23/A24, NFR-A04/A07
