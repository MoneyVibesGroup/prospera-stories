# STORY-094 : Intégration des provisions fiscales à la balance (comptes 44x / 89x)

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A21 · `rapport-bilan-logique-metier-2026-07-12.md` (décision utilisateur : **« les impôts doivent faire partie de la balance »**) · STORY-092 (liquidation IS), STORY-093 (TVA & taxes), STORY-101 (contrat + immutabilité)
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** high
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Sprint :** 19
**Service :** `balance-service` (:3007)
**Couvre :** FR-A21 (les impôts font partie de la balance)

> **La boucle de rétroaction qui ferme le moteur fiscal — et le piège du serpent qui se mord la queue.** L'impôt est **calculé à partir de la balance** (résultat → IS), puis il **retourne dans la balance** : l'IS dû est une **charge** (`891`) et une **dette envers l'État** (`441`). C'est la décision explicite du cadrage : **« les impôts font partie de la balance »**.
>
> **Mais attention au raisonnement circulaire :** si l'écriture d'IS modifiait le résultat qui sert à calculer l'IS, on boucle à l'infini. La règle comptable (et la règle ici) : **l'impôt se calcule sur le résultat AVANT impôt**, puis il est **écrit** — il **n'est jamais réinjecté** dans la base de calcul. Le moteur doit être **idempotent** : recalculer deux fois ne double pas la provision.

---

## User Story

En tant que **cabinet comptable**,
je veux que **l'IS, la TVA due et les autres taxes calculés soient écrits dans la balance** (comptes `44x` / `89x`),
afin que la balance reflète la **dette fiscale réelle** de l'entreprise et que le **bilan et le compte de résultat soient complets** — sans que ces écritures ne faussent le calcul de l'impôt lui-même.

---

## Description

### Contexte

Sans cette story, la balance est **incomplète** : elle montre un résultat **avant impôt**, aucune dette envers l'État, et le bilan ne s'équilibre pas avec la réalité fiscale. Les écritures à passer sont classiques :

| Écriture | Débit | Crédit | Source |
|---|---|---|---|
| **Impôt sur les sociétés** | `891` — Impôts sur le résultat (**charge**) | `441` — État, impôt sur le résultat (**dette**) | STORY-092 (`impotDu`) |
| **TVA due** | `443x` — TVA collectée (soldé) | `4441` — État, TVA due (**dette**) | STORY-093 |
| **Crédit de TVA** | `4449` — État, crédit de TVA (**créance**) | `445x` — TVA déductible (soldé) | STORY-093 |
| **Autres taxes** | `64x` — Impôts et taxes (**charge**) | `44x` — État (**dette**) | STORY-093 |

> **Le piège du raisonnement circulaire.** L'IS se calcule sur le **résultat fiscal**, lui-même dérivé du **résultat comptable avant impôt**. Si l'on écrit la charge `891` **puis** qu'on recalcule le résultat comptable, ce dernier **diminue** → l'IS **diminue** → on réécrit → boucle. **La règle :** le résultat servant de base au calcul est **toujours le résultat avant impôt** (`Σ classe 7 − Σ classe 6, hors compte 89x`). L'écriture d'impôt est **terminale**.
>
> **Corollaire : idempotence obligatoire.** Recalculer la liquidation deux fois ne doit pas **doubler** la provision. Les écritures fiscales sont **remplacées**, jamais **cumulées**.

### Périmètre

**Inclus :**

- **`ProvisionFiscaleService.appliquer(orgId, exercice)`** — génère les **écritures fiscales** à partir de :
  - **STORY-092** : `impotDu` → `891` (**D**) / `441` (**C**).
  - **STORY-093** : TVA due → `4441` (**C**) ; crédit de TVA → `4449` (**D**) ; autres taxes → `64x` (**D**) / `44x` (**C**).
  - **Comptes lus du plan de comptes** (STORY-078) — **jamais en dur** ; paramétrables par référentiel (`SN` / `SMT` / `SFD-BCEAO`).
- **⚠️ Base de calcul figée « avant impôt »** :
  - Le **résultat comptable** utilisé par STORY-091/092 **exclut** systématiquement les comptes **`89x`** (impôts sur le résultat) → **aucune circularité** possible.
  - Test dédié : **appliquer les provisions puis recalculer la liquidation → l'impôt est INCHANGÉ**.
- **⚠️ Idempotence** :
  - Les écritures fiscales sont **marquées** (`origine: 'PROVISION_FISCALE'`, `exercice`).
  - Une nouvelle application **remplace** les précédentes (suppression + réécriture **dans la même transaction**) — **jamais de cumul**.
  - Test dédié : **appliquer 3 fois → une seule provision** (montants identiques, pas ×3).
- **Régénération de la balance** : les écritures fiscales sont **intégrées** à l'agrégation (STORY-085) → nouvelle **`BalanceCanonique`** en `version: N+1` (l'ancienne **archivée**, STORY-101).
  - `POST /api/v1/fiscal/provisions/appliquer?exercice=` : **dry-run (défaut) → 200** (aperçu des écritures + impact sur la balance, **aucune persistance**) ; **`dryRun=false` → 201** (persiste la nouvelle version de balance). *(Sémantique alignée sur 086/085/088.)*
- **Contrôle d'équilibre** : la balance **après** provisions doit rester **équilibrée** (`Σ D = Σ C`, FR-A25) — vérifié par `BalanceValidator` (STORY-101). Par construction, chaque écriture fiscale est équilibrée (D = C).
- **Cas particuliers explicitement traités** :
  - **Aucun impôt dû** (impôt 0) → **aucune écriture** (pas de provision à zéro qui pollue la balance).
  - **Crédit de TVA** → **créance** (`4449` au débit), pas une dette.
  - **Solde d'IS créditeur** (acomptes > impôt dû, STORY-092) → **créance sur l'État** (compte du plan, pas de dette négative).
  - **Régime TPU** (STORY-095) → **pas d'IS/TVA** : la **taxe unique** est écrite à la place (compte du paquet).
- **Traçabilité (NFR-A07)** : chaque écriture fiscale conserve sa **source** (`liquidation` / `tva` / `taxe`), la **formule**, la **version du paquet**, l'auteur et la date → on peut **prouver** pourquoi la balance porte cette dette.
- **Immutabilité** : après **validation** de la balance/liasse, plus aucune provision n'est modifiable → **409**.
- **Tests** : écritures IS (`891`/`441`) ; TVA due (`4441`) ; **crédit de TVA → créance `4449`** ; autres taxes (`64x`/`44x`) ; **⚠️ idempotence : 3 applications → 1 seule provision** ; **⚠️ non-circularité : provisions appliquées → liquidation recalculée → impôt inchangé** ; balance **équilibrée** après provisions ; **impôt 0 → aucune écriture** ; solde créditeur → créance ; comptes **lus du plan** (aucun en dur) ; dry-run **200** / persist **201** ; immutabilité (**409**).

**Hors périmètre :**

- **Calcul de l'IS** → **STORY-092** · **calcul TVA/taxes** → **STORY-093** (cette story ne calcule rien, elle **écrit**).
- **Régime TPU** → **STORY-095** (fournira le montant de la taxe unique à écrire ici).
- **Provisions comptables non fiscales** (créances douteuses, risques et charges) → **hors v1** (elles relèvent des écritures d'inventaire, cf. STORY-085 « hors périmètre »).
- **Amortissements** → hors v1 (même raison).
- **Paiement effectif de l'impôt** → `paiement-service` / Module 3.
- **Rendu de la liasse** → `bilan-service` EPIC-011.

### Flux

1. La balance 2026 est produite et **équilibrée** ; le **résultat comptable avant impôt** est **6 800 000** (les comptes `89x` sont **vides**).
2. **STORY-091** → résultat fiscal **5 195 000** · **STORY-092** → `impotDu` = **1 402 650** (`baseRetenue: 'IS'`).
3. **STORY-093** → TVA due de l'exercice **220 000** · autres taxes (patente, RSL) **195 000**.
4. Le cabinet lance : `POST /api/v1/fiscal/provisions/appliquer?exercice=2026` (**dry-run**) → **200** :
   ```
   891  Impôts sur le résultat ......... D 1 402 650
   441  État, impôt sur le résultat .... C 1 402 650
   4441 État, TVA due ................. C   220 000
   443x TVA collectée (soldé) .......... D   220 000
   64x  Impôts et taxes ............... D   195 000
   44x  État, autres impôts ........... C   195 000
   → Balance après provisions : Σ D = Σ C ✔
   ```
5. Il confirme (`dryRun=false`) → **201** : balance **version 2** persistée (version 1 **archivée**).
6. **⚠️ Vérification de non-circularité** : il **relance** la liquidation → le résultat comptable **avant impôt** est toujours **6 800 000** (les `89x` sont **exclus** de la base) → **impôt inchangé : 1 402 650** ✔ **Pas de boucle.**
7. **⚠️ Vérification d'idempotence** : il **réapplique** les provisions → les écritures sont **remplacées**, pas cumulées → la provision reste **1 402 650** (et non 2 805 300) ✔
8. La balance est complète → contrôles (**STORY-098**) → handoff vers `bilan-service` (**STORY-099**) → liasse avec **bilan, CR et section fiscale cohérents**.

---

## Décisions de cadrage (prises au développement)

### D-094-1 — La base de l'impôt est le **résultat comptable AVANT impôt**, et c'est une grandeur **nouvelle**

Le garde-fou du § *Technical Notes* (« filtrer les `89x` hors des charges ») ne peut **pas** être appliqué
tel quel : `calculerResultatComptable` somme les classes **6/7/8** (décision **D-091-3**), et la classe 8
**contient** les `89x`. Les en retirer purement et simplement casserait le **contrôle d'articulation** de
STORY-091, qui rapproche ce résultat du **compte de résultat net** de la balance (`13`) — lequel est un
résultat **après** impôt. L'écart affiché accuserait alors la comptabilité d'une erreur qu'elle n'a pas
commise, ce que D-091-3 existe précisément pour éviter.

Deux grandeurs distinctes sont donc publiées :

| Grandeur | Formule | À quoi elle sert |
|---|---|---|
| `resultatComptable` | Σ net créditeur classes **6/7/8** (`89x` **compris**) | articulation avec le compte `13` — **inchangée** |
| `resultatComptableAvantImpot` | `resultatComptable + chargeImpotComptabilisee` | **base du résultat fiscal** — stable |

`chargeImpotComptabilisee` = Σ `(soldeDebiteur − soldeCrediteur)` sur les comptes rattachés au compte
d'impôt sur le résultat du référentiel. C'est **exactement** la réintégration classique de l'IS
(non déductible), écrite comme une base plutôt que comme un poste de retraitement.

⚠️ **Cette décision corrige un défaut latent antérieur à cette story** : une balance importée qui portait
**déjà** une charge d'IS en `89x` minorait la base imposable du montant de cet impôt, **en silence**. Aucun
test ne le voyait, parce qu'aucun adaptateur ne produit de `89x` — seul un import réel en aurait porté.

**Le compte d'impôt sur le résultat n'est pas écrit en dur** (NFR-A06) : il est résolu du référentiel selon
le patron de `resoudreCompteResultatNet` (D-091-13) — `regles.COMPTE_IMPOT_RESULTAT` s'il est publié, sinon
**l'unique** compte de classe 8 dont le libellé normalisé commence par « impots sur le resultat » (`89` en
`syscohada-revise@2.1`), sinon `null`. `null` ⇒ rien à ajouter (le plan n'a pas de compte d'impôt : c'est le
cas de `sfd-bceao@2.0`) pour la **lecture**, mais **409** pour l'**écriture** d'une provision : on ne devine
jamais où poser une dette d'État.

### D-094-2 — Le garde-fou structurel : le moteur fiscal lit **toujours** la dernière balance NON provisionnée

L'exclusion des `89x` protège d'**un** vecteur de circularité. Elle n'en protège pas d'un second, plus
large : toute écriture de provision touchant une **classe de gestion** (une charge `64x`, par exemple)
changerait le résultat comptable au recalcul suivant. Le garde-fou porte donc sur la **source**, pas sur les
comptes :

> Une balance produite par le provisionnement porte `origine: 'PROVISIONS_FISCALES'`, et une balance portant
> cette origine n'est **jamais** une base de calcul — ni pour le résultat fiscal, ni pour la liquidation, ni
> pour le chiffre d'affaires qui fixe la MFP.

Même patron que l'exclusion des socles `A_NOUVEAUX` (D-087-2), pour la même raison : un artefact **dérivé**
d'une balance n'est pas la balance. C'est ce qui rend l'idempotence vraie **par construction** — réappliquer
part toujours de la même base, donc reproduit exactement les mêmes écritures.

### D-094-3 — Ce que la story écrit : la **charge d'impôt** et le **soldage de la TVA**. Rien d'autre.

Le principe qui tranche chaque écriture : **n'écrire que ce qui n'est PAS déjà dans la balance.**

| Écriture | Écrite ? | Pourquoi |
|---|---|---|
| Charge d'IS `891` D / dette `441` C | **oui** | aucun adaptateur du hub ne produit de `89x` — elle manque toujours |
| Soldage TVA `443` D / `445` C / `4441` C / `4449` | **oui** | la ventilation (STORY-085) alimente `443`/`445` à la **saisie**, mais **jamais** `4441`/`4449` : la déclaration n'est nulle part en balance |
| Position TVA (`443` C, `445` D) du hook de 093 | **non** — écart assumé | `443`/`445` **sont déjà** dans la balance ; réécrire la position **doublerait** la TVA collectée. Le hook de STORY-093 est consommé pour ses **montants** et ses **comptes**, pas pour son **sens** |
| Autres taxes `64x` D / `44x` C | **non** — écart assumé (voir D-094-4) | elles y sont déjà |

### D-094-4 — Écart assumé au cadrage : les **autres taxes ne sont pas réécrites**

Le § *Périmètre* demande d'écrire les autres taxes `64x` (D) / `44x` (C). **Le faire doublerait une charge
déjà portée par la balance**, et deux faits le prouvent :

1. le cahier de dépenses publie une **catégorie par défaut « Impôts et taxes » → compte `64`**
   (`categories-depenses.defaut.ts`) : une patente saisie au cahier est ventilée en `64x` et **est** dans la
   balance ;
2. surtout, **STORY-093 réintègre déjà les taxes non déductibles** au résultat fiscal
   (`agregerReintegrationsTaxes`, origine `AUTO_TAXES`). Réintégrer une charge, c'est **présupposer qu'elle a
   été déduite**, donc qu'elle est dans le résultat comptable. Si les taxes n'y étaient pas, la réintégration
   de 093 serait fausse — les deux lectures ne peuvent pas être vraies en même temps, et 093 est **livrée**.

Le registre des taxes reste donc ce qu'il est : une **déclaration fiscale** de charges déjà comptabilisées,
pas un journal en attente d'écriture. Le total est **exposé** dans l'aperçu (`taxesNonEcrites`) avec son
motif — non écrit ne veut pas dire tu.

**Dette tracée** : le jour où une story cadrera un registre de taxes **non comptabilisées** (distinct de
celui-ci), leur écriture se posera ici, et la réintégration de 093 devra être revue **en même temps**.

### D-094-5 — Le soldage de TVA est écrit sur le **cumul de l'exercice**, et l'écart au réel est **signalé**

La balance de clôture porte la dette de TVA de l'**exercice entier**, pas d'une période : le soldage
consomme la synthèse annuelle déjà produite par STORY-093 (`syntheseExercice`). L'écriture est **équilibrée
par construction** :

```
443  TVA collectée ..... D  Σ collectée
445  TVA déductible .... C  Σ déductible
4441 TVA due ........... C  total à payer
4449 Crédit de TVA ..... D/C  variation du stock de crédit
```

(l'identité `Σ collectée + Δcrédit = Σ déductible + total à payer` se démontre période à période :
`collectée − déductible = due − créditGénéré`.)

⚠️ Si la balance porte sur `443`/`445` des soldes **différents** des cumuls déclarés — cas d'un import Sage,
ou d'une saisie partielle — le soldage laisse un **résidu**. Il n'est pas corrigé d'office (ce serait écraser
une comptabilité au profit d'un calcul) mais **signalé** : `SOLDE_TVA_DIVERGENT`, avec les deux montants.

### D-094-6 — Les acomptes versés ne sont **jamais** écrits ; la position nette est **exposée**

L'écriture porte la **charge de l'exercice** (`impotDu`), pas le **solde à payer**. Les acomptes ont été
**décaissés** : ils sont déjà comptabilisés par le cabinet, et les réécrire ici les compterait deux fois tout
en faisant diverger la trésorerie. En conséquence `441` ressort **créditeur**, jamais négatif — l'AC « solde
d'IS créditeur → créance, pas de dette négative » est **tenue par construction** (aucune dette négative n'est
jamais écrite), et le cas « acomptes > impôt » est **exposé** : l'aperçu publie `positionEtat`
(`{ montant, sens: 'A_PAYER' | 'CREANCE' }`) et lève l'avertissement `EXCEDENT_ACOMPTES_NON_ECRIT`.

---

## Acceptance Criteria

- [ ] **Écritures IS** : `891` (**D**) / `441` (**C**) pour le montant `impotDu` (STORY-092).
- [ ] **Écritures TVA** : **TVA due** → `4441` (**C**) ; **crédit de TVA** → **créance** `4449` (**D**) — jamais une dette négative.
- [ ] **Écritures autres taxes** : `64x` (**D**) / `44x` (**C**) (STORY-093).
- [ ] **Comptes lus du plan de comptes** (STORY-078), paramétrables par référentiel (`SN`/`SMT`/`SFD-BCEAO`) — **aucun compte en dur** (NFR-A06).
- [ ] **⚠️ NON-CIRCULARITÉ** *(test central)* : le résultat comptable servant de base au calcul de l'impôt **exclut les comptes `89x`** → **appliquer les provisions puis recalculer la liquidation ⇒ impôt INCHANGÉ**.
- [ ] **⚠️ IDEMPOTENCE** *(test central)* : appliquer les provisions **3 fois** → **une seule provision** (montants **non cumulés**) ; les écritures fiscales sont **remplacées**, jamais additionnées.
- [ ] **Balance après provisions équilibrée** (`Σ D = Σ C`, FR-A25) — vérifié par `BalanceValidator` (STORY-101).
- [ ] **Nouvelle version de balance** (`version: N+1`), ancienne **archivée** (immutabilité STORY-101).
- [ ] **Impôt nul → aucune écriture** (pas de provision à zéro).
- [ ] **Solde d'IS créditeur** (acomptes > impôt) → **créance sur l'État**, pas une dette négative.
- [ ] **`POST /fiscal/provisions/appliquer`** : **dry-run (défaut) → 200** (aperçu, aucune persistance) ; **`dryRun=false` → 201** (persiste).
- [ ] **Traçabilité (NFR-A07)** : chaque écriture conserve **source**, **formule**, **version du paquet**, auteur, date.
- [ ] **Immutabilité** : après validation → **409**.
- [ ] **Tests** : IS, TVA due, **crédit → créance**, taxes, **idempotence ×3**, **non-circularité**, équilibre, impôt 0, solde créditeur, comptes du plan, dry-run/persist, immutabilité. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Le garde-fou anti-circularité

```typescript
// La base de calcul de l'impôt EXCLUT toujours les comptes 89x (impôts sur le résultat).
// Sans cela : écrire la charge d'IS ferait baisser le résultat → baisser l'IS → réécrire → boucle infinie.
async resultatComptableAvantImpot(orgId: string, exercice: DateRange): Promise<number> {
  const balance = await this.balanceRepo.findLatest(orgId, exercice);

  const produits = somme(balance.lignes.filter(l => l.compte.startsWith('7')).map(soldeCrediteur));
  const charges  = somme(
    balance.lignes
      .filter(l => l.compte.startsWith('6'))          // charges d'exploitation
      .filter(l => !l.compte.startsWith('89'))        // ⚠️ EXCLUSION des impôts sur le résultat
      .map(soldeDebiteur)
  );

  return produits - charges;   // ← base STABLE : réappliquer les provisions ne la change pas
}
```

### L'idempotence

```typescript
async appliquer(orgId: string, exercice: DateRange, dryRun: boolean) {
  const liquidation = await this.liquidation.liquider(orgId, exercice);   // STORY-092
  const tva         = await this.tva.calculer(orgId, exercice);           // STORY-093
  const taxes       = await this.taxes.total(orgId, exercice);

  const ecritures = [
    ...this.ecrituresIs(liquidation),      // 891 D / 441 C — rien si impotDu === 0
    ...this.ecrituresTva(tva),             // 4441 C (due) OU 4449 D (crédit → créance)
    ...this.ecrituresTaxes(taxes),         // 64x D / 44x C
  ].map(e => ({ ...e, origine: 'PROVISION_FISCALE', exercice }));   // ← marquage

  if (dryRun) {
    return { statut: 200, ecritures, apercuBalance: await this.simuler(orgId, exercice, ecritures) };
  }

  const session = await this.mongo.startSession();
  try {
    await session.withTransaction(async () => {
      // ⚠️ IDEMPOTENCE : on REMPLACE les provisions précédentes, on ne les CUMULE jamais.
      await this.ecritureRepo.supprimerParOrigine(orgId, exercice, 'PROVISION_FISCALE', session);
      await this.ecritureRepo.insertMany(ecritures, session);

      const balance = await this.agregation.regenerer(orgId, exercice, session);  // STORY-085
      await this.balanceValidator.validate(balance);                              // Σ D = Σ C (FR-A25)
      await this.balanceRepo.submitBalance(balance, session);                     // version N+1
    });
  } finally { await session.endSession(); }

  return { statut: 201 };
}
```

### Les tests qui protègent des deux pièges

```typescript
it('NON-CIRCULARITÉ : appliquer les provisions ne change pas l\'impôt', async () => {
  const avant = await liquidation.liquider(orgId, ex2026);
  await provisions.appliquer(orgId, ex2026, /* dryRun */ false);
  const apres = await liquidation.liquider(orgId, ex2026);

  expect(apres.impotDu).toBe(avant.impotDu);   // ⚠️ inchangé — la base exclut les 89x
});

it('IDEMPOTENCE : 3 applications → 1 seule provision', async () => {
  await provisions.appliquer(orgId, ex2026, false);
  await provisions.appliquer(orgId, ex2026, false);
  await provisions.appliquer(orgId, ex2026, false);

  const balance = await balanceRepo.findLatest(orgId, ex2026);
  const is = balance.lignes.find(l => l.compte === '891');
  expect(is!.debiteur).toBe(1_402_650);        // ⚠️ PAS 4 207 950
});
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **⚠️ Raisonnement circulaire** (l'écriture d'IS modifie la base de l'IS) | Base de calcul **exclut les `89x`** → résultat **avant impôt** stable ; **test de non-circularité** |
| **⚠️ Provision doublée** au recalcul | **Idempotence** : les écritures `PROVISION_FISCALE` sont **remplacées**, jamais cumulées ; **test ×3 applications** |
| Balance déséquilibrée après provisions | Chaque écriture est **équilibrée par construction** (D = C) ; `BalanceValidator` **vérifie** (FR-A25) |
| Crédit de TVA écrit comme une dette négative | Crédit → **créance** (`4449` au débit) — test dédié |
| Provision à zéro polluant la balance | **Aucune écriture** si impôt nul |
| Comptes `44x`/`89x` en dur → faux en `SFD-BCEAO` | Comptes **lus du plan** et **paramétrables par référentiel** |
| Écriture fiscale modifiée après dépôt | **Immutabilité** après validation (409) + traçabilité complète |

---

## Definition of Done

- [ ] `ProvisionFiscaleService.appliquer()` : écritures IS (`891`/`441`), TVA (`4441` / `4449`), taxes (`64x`/`44x`)
- [ ] **Test de NON-CIRCULARITÉ** (base excluant les `89x` — impôt inchangé après application)
- [ ] **Test d'IDEMPOTENCE** (3 applications → 1 provision)
- [ ] Balance **équilibrée** après provisions ; nouvelle **version N+1**, ancienne archivée
- [ ] Impôt 0 → aucune écriture ; crédit de TVA → **créance** ; solde d'IS créditeur → créance
- [ ] Comptes **lus du plan**, paramétrables par référentiel (aucun en dur)
- [ ] dry-run **200** / persist **201** ; traçabilité (source, formule, version du paquet)
- [ ] Immutabilité après validation (409)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-092/093 (calculs), STORY-085 (agrégation), STORY-101 (contrat) verts

---

## Progress Tracking

- **2026-08-04** — statut `not_started` → `in_progress`. Cadrage relu et **six décisions** posées
  (D-094-1 à D-094-6) : la non-circularité s'obtient par une **grandeur nouvelle**
  (`resultatComptableAvantImpot`) plus un **garde-fou de source** (`origine: PROVISIONS_FISCALES` jamais base
  de calcul), et **deux écritures du cadrage ne sont pas écrites** parce qu'elles sont déjà dans la balance
  (position de TVA, autres taxes). Branches `MNV-094` ouvertes sur `docs/` (base `main`) et `balance-service`
  (base `dev`).

- **2026-08-04** — implémentation livrée. Portes : **lint 0**, build OK, **2 443 unitaires + 519 e2e verts**,
  couverture **98.97 / 91.57 / 98.26 / 99.06** (seuils 65/90/90/90), **15 mutation-tests** tous rouges à la
  mutation (dont : retirer `PROVISIONS_FISCALES` de la base de calcul, revenir au résultat **net** comme base
  imposable, solder la TVA partiellement au lieu de tout-ou-rien, désactiver l'idempotence, écrire l'impôt au
  **brut** au lieu du delta).

### ⚠️ D-094-7 — défaut trouvé **en vérification docker**, invisible à tous les tests

Sur une balance **importée** qui portait déjà une charge d'IS de `900 000`, le provisionnement écrivait
l'impôt dû **par-dessus** : `891` sortait à **2 736 000** pour un impôt réel de **1 836 000** — une charge
**doublée**, sur une balance pourtant parfaitement **équilibrée** (l'écriture l'est par construction), donc
aucun contrôle ne bronchait. Ni les unitaires ni les e2e ne le voyaient : **toutes leurs fixtures partaient
d'une base sans `89x`**, c'est-à-dire du seul cas où le défaut est inobservable.

Correctif : l'écriture d'impôt porte le **delta** `impôt dû − charge déjà comptabilisée`, ce qui amène `891`
**au** montant dû quel qu'ait été son point de départ. Trois cas — complément (`891` D), rien (`delta = 0`,
la charge est déjà exacte, donc **idempotent face à une base re-soumise**), **extourne** (`891` C) quand la
charge comptabilisée dépasse l'impôt dû. Deux avertissements nouveaux le disent
(`IMPOT_DEJA_PARTIELLEMENT_PROVISIONNE`, `IMPOT_SUR_PROVISIONNE`) et `chargeDejaComptabilisee` est publiée :
sans elle, un comptable ne pourrait pas expliquer pourquoi l'écriture proposée n'égale pas l'impôt dû.

### Vérification docker — stack **neuve** (`down -v` puis `up`), org réelle, Mongo interrogé

Base `balance_service`, collections listées avant toute requête (`db.getCollectionNames()`).
Organisation `6a71b1a8…` (register + login sur l'IdP), gates `orgkycstatuses`/`orgbalanceentitlements`
amorcées, référentiel `syscohada-revise@2.1`, profil `REEL`/`SN`. Balance de base `direct` v1 équilibrée
(CA `10 000 000`, TVA `443` = `720 000` / `445` = `410 000`), cahiers alimentés (recette assujettie
`720 000` de TVA, dépense à TVA déductible `410 000`, même période).

| Contrôle | Attendu | Constaté |
|---|---|---|
| Liquidation avant provision | — | `résultat fiscal 6 800 000` · `IS 1 836 000` · `MFP 100 000` · `impôt dû 1 836 000` (`baseRetenue: IS`) |
| Dry-run | **200**, aucune écriture | **200** ; `db.balances.countDocuments()` **inchangé** (1) |
| Écritures proposées | équilibrées | `891` D `1 836 000` · `441` C `1 836 000` · `443` D `720 000` · `445` C `410 000` · `4441` C `310 000` → **ΣD = ΣC = 2 556 000** |
| Persist | **201**, version N+1 | **201** ; balance **v2**, `origine: PROVISIONS_FISCALES`, `balanceSourceId → v1`, `checksumVersion: v2` |
| Équilibre après provision | `Σ D = Σ C` | mouvements `16 166 000 = 16 166 000` · soldes `15 036 000 = 15 036 000` · `estEquilibre: true` |
| `443`/`445` soldés | solde nul, **mouvements conservés** | `443` sD=0 sC=0 (mvt 720 000/720 000) · `445` idem — la ligne reste, son activité doit rester visible |
| **Idempotence ×3** | **1 seule** provision | appels 2 et 3 → **200 `idempotent: true`**, même `balanceId` ; `countDocuments({origine:'PROVISIONS_FISCALES'})` = **1** ; `891` = `1 836 000`, **jamais** `5 508 000` |
| **Non-circularité** | impôt **inchangé** | après provisionnement : `résultat fiscal 6 800 000`, `impôt dû 1 836 000` — **identiques** ; la liquidation retient toujours la **base v1**, pas la provision |
| Base **inchangée** (append-only) | intacte | checksum `288603884210ca43…` inchangé, aucun `89x` ajouté à la v1 |
| **D-094-1 sur import réel** | base **redressée** | balance Sage portant `891` = `900 000` : `resultatComptable` (net) **5 900 000** · `chargeImpotComptabilisee` **900 000** · `resultatComptableAvantImpot` **6 800 000** · impôt **1 836 000 inchangé** (sans la reprise : assiette `5 900 000` ⇒ IS `1 593 000`, soit **243 000 de sous-imposition silencieuse**) |
| **D-094-7 après correctif** | `891` **au** montant dû | écriture `891` D **936 000** (= `1 836 000 − 900 000`), avertissement `IMPOT_DEJA_PARTIELLEMENT_PROVISIONNE` ; en base `891` = **1 836 000** (et non `2 736 000` comme avant correctif — constaté sur la v2 fautive) |
| Immutabilité | **409** | balance provisionnée `VALIDÉE` → persist **409 `BALANCE_VALIDEE_IMMUABLE`** *et* dry-run **409** ; `countDocuments()` inchangé |
| **Atomicité** | aucun orphelin | balance volontairement déséquilibrée (écart `−500 000` > tolérance 100) → **422** ; `balances` **6 → 6**, `outbox_events` **6 → 6**, `balances` sur l'exercice 2028 = **0**. Les 5 balances écrites portent **chacune exactement 1** `balance.created` : jamais une balance sans événement, jamais l'inverse |

⚠️ Contrôle des noms de collections effectué **avant** toute conclusion : `balances`, `outbox_events`,
`orgkycstatuses`/`orgbalanceentitlements` (exception au snake_case, collections Mongoose par défaut),
`profils_societe`.

---

**Status:** in_progress
**Dependencies:** **STORY-092** (`impotDu`), **STORY-093** (TVA due/crédit, taxes), **STORY-085** (agrégation/régénération de la balance), **STORY-101** (contrat, validation, versioning), STORY-078 (comptes du plan) · **STORY-095** fournira la taxe unique (TPU) à écrire pour le régime synthétique
**Réalise** la décision de cadrage : **« les impôts font partie de la balance »** (FR-A21)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A21
