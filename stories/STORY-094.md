# STORY-094 : Intégration des provisions fiscales à la balance (comptes 44x / 89x)

**Epic :** EPIC-023 — Moteur fiscal
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A21 · `rapport-bilan-logique-metier-2026-07-12.md` (décision utilisateur : **« les impôts doivent faire partie de la balance »**) · STORY-092 (liquidation IS), STORY-093 (TVA & taxes), STORY-101 (contrat + immutabilité)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 18 (EXTENDED)
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

**Status:** ready-for-dev
**Dependencies:** **STORY-092** (`impotDu`), **STORY-093** (TVA due/crédit, taxes), **STORY-085** (agrégation/régénération de la balance), **STORY-101** (contrat, validation, versioning), STORY-078 (comptes du plan) · **STORY-095** fournira la taxe unique (TPU) à écrire pour le régime synthétique
**Réalise** la décision de cadrage : **« les impôts font partie de la balance »** (FR-A21)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A21
