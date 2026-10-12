# STORY-098 : Contrôles d'intégrité + cohérence (Actif=Passif, articulation) + statut de preuve de la balance

**Epic :** EPIC-024 — Contrôles & livraison
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A25, FR-A26, FR-A27 · `rapport-bilan-logique-metier-2026-07-12.md` §12 (GUIDEF : **8 contrôles de cohérence officiels** — l'exemplaire fourni en **échoue 2**) · STORY-101 (`BalanceValidator` — équilibre déjà posé en CORE)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** in_progress
**Assigné à :** vivianMoneyVibesGroupes
**Complexité :** high
**Créée le :** 2026-07-12
**Sprint :** 19 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A25 (intégrité), FR-A26 (cohérence), FR-A27 (statut de preuve)

> **Le garde-qualité du hub — et la sincérité de ce qu'on livre.** La balance peut venir de **trois sources** (Sage, IMF, cahiers/OCR). Quelle qu'elle soit, elle doit passer **les mêmes contrôles** avant d'alimenter la liasse. Cette story complète les contrôles d'**intégrité** posés en CORE (équilibre, STORY-101) par :
> - les **contrôles de cohérence officiels de la DSF** — la GUIDEF en compte **8** (Actif=Passif, articulation du résultat, articulation du CA…) et **l'exemplaire réel fourni en échoue 2** : ces contrôles **existent**, ils sont **appliqués par l'administration**, et une liasse qui les échoue **sera rejetée** ;
> - le **statut de preuve (FR-A27)** — *dire la vérité sur la qualité de ce qu'on produit*. Une balance reconstituée à 80 % par OCR n'a **pas** la même valeur qu'une balance issue de relevés bancaires. **Le système doit le dire, pas le cacher.**

---

## ⚡ Cadrage rejoué sur le code (2026-10-12) — ce qui existe déjà, ce qui reste

La story date du 2026-07-12. Depuis, **STORY-101/146/147/145/679/091/455** ont livré une partie de ce qu'elle décrit. Relu sur `origin/dev` (3387d56) **avant** de coder :

| Élément de la story | État sur `dev` | Conséquence |
|---|---|---|
| Équilibre `Σ D = Σ C` (mouvements **et** soldes), doublons, montants ≥ 0, format | **refusés au dépôt** (`BalanceValidator`, STORY-101/147) | rejoués ici sur les lignes **persistées recalculées** (jamais sur `sommaire`, cf. D-098-2) |
| Comptes hors plan | **refusés au dépôt ET à la validation** (STORY-146/679 : `400`) | le « non bloquant si référentiel incomplet » n'a plus d'objet : un plan incomplet n'existe plus (D-098-4) |
| `statutPreuve` pondéré **par les montants** + `annotationRisque` | **livré** (`computeStatutPreuve`, STORY-147) | réutilisé ; le rapport ajoute la **répartition chiffrée** et signale un statut **enregistré** périmé (D-098-6) |
| Articulation résultat CR ↔ compte de résultat net | **livrée** (`articulerResultat`, STORY-091 ; compte **13** en SYSCOHADA, pas `12x`) | réutilisée telle quelle (D-098-7) |
| Gate de validation 409 | **couture livrée** (`VALIDATION_GATE`, STORY-145, porte passante) | cette story substitue le `useClass` (D-098-3) |
| Catalogue de contrôles « lu du gabarit de liasse » | **aucun gabarit de contrôles n'est publié** (ni référentiel, ni catalogue) | D-098-9 |

### Décisions

- **D-098-1 — Rapport ancré sur UNE balance** : `GET /api/v1/dossiers/:dossierId/balances/:id/controles` (et non `?exercice=`). La porte de validation juge **une** balance ; un rapport par exercice jugerait « la plus récente », donc parfois une **autre** que celle qu'on valide (piège STORY-455). Le rapport et la porte appellent **la même fonction** pour les bloquants : le rapport ne peut pas dire « prêt » quand la porte refuse.
- **D-098-2 — Recalculer, jamais relire** : les contrôles recalculent depuis `lignesNormalisees(doc)` ; aucun ne lit `sommaire.estEquilibre` (une balance d'avant 147 le lit `undefined` ⇒ invalidable à tort, cf. `ValidationGatePassante`).
- **D-098-3 — Bloquants = intégrité + Actif=Passif**, et rien d'autre. Les articulations (résultat, CA, TVA) sont des **avertissements** : une balance non encore soldée est un état de travail normal, et un contrôle qui dépend du paquet fiscal ne doit jamais rendre une balance **invalidable** parce qu'un paquet n'est pas publié.
- **D-098-4 — Comptes hors plan** : rapportés **BLOQUANT** dans le rapport (la validation les refuse déjà en `400`, le rapport le dit au lieu de promettre « prêt »).
- **D-098-5 — Actif = Passif, côté balance** : après affectation du résultat, `Σ net(bilan) + résultat = 0` ⇔ le **résidu** des comptes ni de bilan (classes 1-5, terme structurel OHADA comme `CLASSE_CAPITAUX_PROPRES`) ni de gestion (`racinesDeGestion` **du référentiel**) est nul. Tautologique pour SYSCOHADA (plan 1-8, gestion 6/7/8) ; **réel** pour CIMA (classe 0, classe 8 hors racines — cf. STORY-672). Écart > 1 unité de la devise ⇒ **BLOQUANT**, comptes fautifs listés (plafonnés). L'équilibre **des postes** de la liasse (routage table de passage) reste à `bilan-service` (EQUILIBRE_BILAN, STORY-550) — **délégué, pas dupliqué**.
- **D-098-6 — Statut de preuve** : recalculé (`computeStatutPreuve`), répartition **pondérée par les montants** publiée par niveau, annotation **chiffrée** pour tout statut ≠ `justifiée`. Si le statut **enregistré** diffère du recalcul (balance d'avant 147, pondérée par le nombre de lignes) ⇒ avertissement `STATUT_PREUVE_PERIME` : **signalé, jamais réécrit** (aucune correction automatique).
- **D-098-7 — Articulation du résultat** : CR (racines de gestion) ↔ compte de résultat net (`resoudreCompteResultatNet`) **sur la balance contrôlée**, puis ↔ résultat comptable du **tableau fiscal**, qui est calculé sur la **base fiscale retenue** (`trouverDerniereBaseFiscale`). Même balance ⇒ concordant par construction (dit dans le détail) ; balance différente ⇒ **écart signalé** — c'est le vrai risque : le tableau fiscal assis sur un autre document que celui qu'on valide.
- **D-098-8 — Articulation du CA** : la base MFP **est** le CA du poste chiffre d'affaires (`etablirChiffreAffairesSource`, marge produits bloqués = 0) : comparer le calcul à lui-même serait un test qu'un bug ne fait jamais échouer. Le contrôle compare donc le CA de la balance contrôlée au CA de la **base fiscale que retient la liquidation** ; CA non sourçable ⇒ non applicable, motif nommé.
- **D-098-8bis — Articulation TVA** : `cumulAnnuel.totalAPayer` de la déclaration (cahiers, STORY-093) ↔ solde du compte `due` **publié par le paquet** (`4441` au Togo, jamais en dur). Non applicable (motif nommé) si régime ≠ réel, paquet non publié, ou aucun cahier sur l'exercice (balance Sage : pas d'alerte fausse).
- **D-098-9 — Pas de gabarit de contrôles publié** : les **paramètres** de chaque contrôle (racines de gestion, compte de résultat net, poste CA, comptes TVA) sont lus du référentiel/paquet — **aucun compte en dur** ; le **catalogue** des contrôles est du code, faute de gabarit. Hook : `CONTROLES_DELEGUES` liste les contrôles TFT/notes/postes « à vérifier par `bilan-service` ».
- **D-098-10 — Hors périmètre signalé** : la séparation préparateur/réviseur (tracée par STORY-145 « à trancher avec le PO ») n'est **pas** tranchée ici.

---

## User Story

En tant que **cabinet comptable**,
je veux que la balance soit **contrôlée** (intégrité + cohérence articulée de la DSF) et que son **niveau de preuve soit affiché honnêtement**,
afin de **ne jamais déposer une liasse qui sera rejetée**, et de **savoir** ce que je peux défendre en contrôle.

---

## Description

### Contexte

**Trois niveaux de contrôle**, du plus dur au plus subtil :

**1. Intégrité (FR-A25) — déjà en CORE (STORY-101), consolidée ici**
`Σ débit = Σ crédit`, pas de doublon de compte, format de compte valide, montants ≥ 0. **Bloquant** : une balance déséquilibrée n'entre pas dans le système.

**2. Cohérence / articulation (FR-A26) — les 8 contrôles officiels de la DSF**
La GUIDEF **embarque ses propres contrôles** (l'analyse de l'exemplaire réel l'a montré — et il **en échoue 2**) :

| Contrôle | Vérification |
|---|---|
| **Actif = Passif** | Total du bilan équilibré |
| **Articulation du résultat** | Résultat du CR = Résultat au passif = Résultat comptable du tableau fiscal |
| **Articulation du CA** | CA du CR = CA servant de base à la MFP (liquidation) |
| **Trésorerie** | Trésorerie du bilan = trésorerie de clôture du TFT |
| **Cohérence des amortissements** | Amortissements du bilan = cumul des notes |
| *(…)* | *les 8 contrôles sont **lus du gabarit de liasse**, pas codés en dur* |

> **Point capital :** ces contrôles s'appliquent à la **liasse**, dont le rendu appartient au **`bilan-service`**. Mais **attendre le rendu pour découvrir l'erreur est trop tard** : la source du problème est **dans la balance**. Cette story exécute donc les contrôles **articulables depuis la balance + le moteur fiscal** (Actif=Passif, articulation résultat, articulation CA) **au plus tôt**, et **délègue** au `bilan-service` ceux qui exigent le TFT/les notes (**coordination**, pas duplication).

**3. Statut de preuve (FR-A27) — l'honnêteté**
Chaque ligne porte un `niveauPreuve` (`fichier` > `ocr` > `saisie` > `estimé`), consolidé en un **statut global**. Une balance **majoritairement estimée** doit être **signalée comme telle** — elle est **livrable**, mais **jamais silencieusement présentée comme justifiée**.

### Périmètre

**Inclus :**

- **`ControleIntegriteService`** (consolide FR-A25, déjà amorcé en STORY-101) :
  - `Σ débit = Σ crédit` (tolérance < 1 XOF) · doublons de compte · format de compte (référentiel) · montants ≥ 0 · comptes **inconnus du plan** (STORY-078) → **listés** (non bloquant si le référentiel est incomplet, **bloquant** sinon — paramétrable).
  - **Sévérité** : `BLOQUANT` (l'équilibre) vs `AVERTISSEMENT`.
- **`ControleCoherenceService`** (FR-A26) — **les contrôles articulables depuis la balance** :
  - **Actif = Passif** : `Σ soldes débiteurs (classes 1-5 actif)` = `Σ soldes créditeurs (classes 1-5 passif)` après affectation du résultat.
  - **Articulation du résultat** : `Résultat comptable (CR : produits − charges)` = `Résultat au passif (12x)` = `Résultat comptable du tableau fiscal (STORY-091)` → **écart signalé**.
  - **Articulation du CA** : `CA du compte de résultat (classe 7)` = **CA servant de base à la MFP** (STORY-092) → un écart ici **fausse l'impôt**.
  - **Articulation TVA** : `TVA due calculée (STORY-093)` = `solde du compte 4441` après provisions (STORY-094).
  - **Règles lues du gabarit de liasse** (D12) quand disponibles — **jamais codées en dur** (NFR-A06).
  - **Contrôles nécessitant le TFT / les notes** → **délégués au `bilan-service`** (EPIC-011, STORY-063) : ici on **liste** ce qui reste à vérifier en aval (**coordination explicite**, aucune duplication).
- **`StatutPreuveService`** (FR-A27) — la sincérité :
  - Consolide les `niveauPreuve` des lignes (pondérés **par les montants**, pas par le nombre de lignes : 1 ligne de 10 M estimée pèse plus que 50 lignes de 1 000 F justifiées).
  - `statutPreuve` : **`justifiée`** (> 80 % du montant en `fichier`) · **`partiellement_estimée`** (20-80 %) · **`majorite_estimée`** (< 20 % `fichier` **ou** > 50 % `ocr`/`estimé`).
  - **`annotationRisque`** générée : « 62 % des montants reposent sur de l'OCR non rapproché — rapprochement bancaire recommandé avant dépôt. »
  - **⚠️ Une balance `majorite_estimée` est LIVRABLE mais ne peut PAS être présentée comme « justifiée »** : le statut **accompagne** la balance jusqu'à la liasse (contrat STORY-101 → handoff STORY-099).
- **Rapport de contrôle** : `GET /api/v1/balance/controles?exercice=` → `{ integrite: [...], coherence: [...], statutPreuve, bloquants: n, avertissements: n, pretPourDepot: bool }`.
- **Gate de validation** : une balance **ne peut être VALIDÉE** (STORY-101) que si **aucun contrôle BLOQUANT** n'échoue → sinon **409** avec la liste. *(Les avertissements, eux, n'empêchent pas — ils **informent**.)*
- **Application à TOUTES les sources** : les mêmes contrôles s'exécutent que la balance vienne de **Sage** (086), de l'**IMF** (102) ou des **cahiers** (085) — **test croisé** sur les 3 sources.
- **Tests** : équilibre KO → **bloquant** ; doublon de compte ; compte hors plan → listé ; **Actif ≠ Passif → bloquant** ; **écart d'articulation du résultat → signalé** ; **écart d'articulation du CA → signalé** *(il fausse la MFP)* ; articulation TVA ; **statut de preuve pondéré PAR LES MONTANTS** *(test central : 1 grosse ligne estimée l'emporte sur 50 petites justifiées)* ; **`majorite_estimée` → livrable mais annoté** ; **validation refusée (409) si bloquant** ; **mêmes contrôles sur les 3 sources** *(test croisé)* ; règles lues du gabarit (aucune en dur).

**Hors périmètre :**

- **Contrôle d'équilibre de base** → déjà en **STORY-101** (CORE) : cette story **consolide** et **étend**.
- **Contrôles exigeant le TFT / les notes annexes** → **`bilan-service`** (EPIC-011, STORY-063) — **coordination**, pas duplication.
- **Rendu de la liasse** et **export** → `bilan-service` (EPIC-011/014).
- **Correction automatique** d'une anomalie → **interdit** : un contrôle **signale**, il ne **corrige** pas (une correction silencieuse masque l'erreur).
- **Table de passage compte → poste** → `bilan-service` (STORY-055).

### Flux

1. La balance 2026 est produite (cahiers + OCR — STORY-085), les provisions fiscales appliquées (STORY-094).
2. Le cabinet lance : `GET /api/v1/balance/controles?exercice=2026`.
3. **Intégrité (FR-A25)** :
   - `Σ D = Σ C` ✔ · aucun doublon ✔ · 2 comptes **inconnus du plan** → **avertissement** (listés).
4. **Cohérence (FR-A26)** :
   - **Actif = Passif** ✔
   - **Articulation du résultat** : CR = 6 800 000 · compte `12x` = 6 800 000 · tableau fiscal = 6 800 000 ✔
   - **⚠️ Articulation du CA** : CR (classe 7) = **48 000 000** · base MFP = **47 200 000** → **ÉCART de 800 000 signalé** — *cet écart fausserait la MFP donc l'impôt* → le cabinet corrige (une recette exonérée mal ventilée).
   - Contrôles TFT/notes → **listés comme à vérifier par `bilan-service`**.
5. **Statut de preuve (FR-A27)** :
   - 62 % des **montants** en `ocr` non rapproché · 31 % en `fichier` · 7 % `estimé`
   - → **`majorite_estimée`** ⚠️
   - **Annotation** : « 62 % des montants reposent sur de l'OCR non rapproché — **rapprochement bancaire recommandé** avant dépôt. »
6. Le cabinet lance le **rapprochement bancaire** (STORY-090) → les lignes rapprochées passent en **`fichier`** → nouveau contrôle : **`partiellement_estimée`** (74 % `fichier`) — **la balance est devenue défendable**.
7. **Validation** : aucun bloquant → la balance peut être **VALIDÉE** (STORY-101) → **immuable** → **handoff** vers `bilan-service` (STORY-099), **avec son statut de preuve**.

---

## Acceptance Criteria

- [ ] **Intégrité (FR-A25)** : équilibre (`Σ D = Σ C`, **BLOQUANT**), doublons de compte, format, montants ≥ 0, comptes hors plan (**listés**) — avec **sévérité** (`BLOQUANT` / `AVERTISSEMENT`).
- [ ] **Cohérence (FR-A26)** — contrôles articulables depuis la balance :
  - [ ] **Actif = Passif** (**BLOQUANT**)
  - [ ] **Articulation du résultat** : CR = compte `12x` = tableau fiscal → **écart signalé**
  - [ ] **⚠️ Articulation du CA** : CA du CR = **base MFP** (STORY-092) → **écart signalé** *(un écart ici fausse l'impôt)*
  - [ ] **Articulation TVA** : TVA due calculée (093) = solde `4441` après provisions (094)
- [ ] **Règles de cohérence lues du gabarit de liasse** (D12) — **aucune en dur** (NFR-A06).
- [ ] **Contrôles TFT/notes → délégués au `bilan-service`** (EPIC-011) et **listés** comme « à vérifier en aval » — **aucune duplication**.
- [ ] **Statut de preuve (FR-A27)** : consolidation des `niveauPreuve` **pondérée PAR LES MONTANTS** *(test central : 1 ligne de 10 M estimée pèse plus que 50 lignes de 1 000 F justifiées)*.
- [ ] **`statutPreuve`** ∈ `justifiée` (> 80 % `fichier`) | `partiellement_estimée` (20-80 %) | `majorite_estimée` (< 20 % `fichier` ou > 50 % `ocr`/`estimé`).
- [ ] **`annotationRisque`** générée et **explicite** (ex. « 62 % des montants reposent sur de l'OCR non rapproché — rapprochement recommandé »).
- [ ] **⚠️ Une balance `majorite_estimée` est LIVRABLE mais JAMAIS présentée comme « justifiée »** — le statut **accompagne** la balance jusqu'à la liasse (contrat STORY-101, handoff STORY-099).
- [ ] **Gate de validation** : validation **refusée (409)** s'il reste un contrôle **BLOQUANT** ; les **avertissements n'empêchent pas** (ils informent).
- [ ] **⚠️ Aucune correction automatique** : un contrôle **signale**, il ne **corrige jamais** (test : une anomalie détectée ne modifie **rien**).
- [ ] **⚠️ Mêmes contrôles pour les 3 sources** *(test croisé)* : Sage (086), IMF (102), cahiers (085) → **résultats identiques** pour une même balance.
- [ ] **Rapport** `GET /balance/controles` : intégrité, cohérence, statut de preuve, compteurs, `pretPourDepot`.
- [ ] **Tests** : équilibre KO, doublon, compte hors plan, Actif≠Passif, écart résultat, **écart CA**, articulation TVA, **pondération par montants**, `majorite_estimée` livrable + annoté, **409 si bloquant**, **aucune correction auto**, **test croisé 3 sources**, règles du gabarit. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Le statut de preuve — pondéré par les MONTANTS (pas par le nombre de lignes)

```typescript
calculerStatutPreuve(balance: BalanceCanonique): { statut: StatutPreuveBalance; annotation?: string } {
  // ⚠️ Pondération PAR LES MONTANTS : une ligne de 10 000 000 estimée pèse plus
  //    que 50 lignes de 1 000 F justifiées. Compter les lignes serait mentir.
  const total = somme(balance.lignes.map(l => (l.debiteur ?? 0) + (l.crediteur ?? 0)));

  const part = (niveau: NiveauPreuveBalance) =>
    somme(balance.lignes.filter(l => l.niveauPreuve === niveau)
                        .map(l => (l.debiteur ?? 0) + (l.crediteur ?? 0))) / total;

  const pFichier = part('fichier');
  const pFaible  = part('ocr') + part('estimé');

  let statut: StatutPreuveBalance;
  if (pFichier > 0.80)                       statut = 'justifiée';
  else if (pFichier >= 0.20 && pFaible <= 0.50) statut = 'partiellement_estimée';
  else                                        statut = 'majorite_estimée';

  const annotation = statut !== 'justifiée'
    ? `${Math.round(pFaible * 100)} % des montants reposent sur de l'OCR / des estimations — ` +
      `rapprochement bancaire recommandé avant dépôt.`
    : undefined;

  return { statut, annotation };   // ⚠️ La balance reste LIVRABLE — mais elle dit la vérité sur elle-même.
}
```

### L'articulation du CA — l'écart qui fausse l'impôt

```typescript
async controlerArticulationCa(orgId: string, exercice: DateRange): Promise<Controle> {
  const caCompteResultat = await this.caService.calculerHt(orgId, exercice);      // classe 7 (CR)
  const baseMfp = (await this.liquidation.liquider(orgId, exercice)).caHt;        // base de la MFP (092)

  const ecart = Math.abs(caCompteResultat - baseMfp);
  if (ecart > 1) {
    return {
      code: 'ARTICULATION_CA',
      severite: 'AVERTISSEMENT',   // non bloquant, mais LOURD de conséquences
      message:
        `Écart de ${fmt(ecart)} entre le CA du compte de résultat (${fmt(caCompteResultat)}) ` +
        `et la base de la MFP (${fmt(baseMfp)}). ⚠️ Cet écart fausse le calcul de l'impôt.`,
    };
  }
  return { code: 'ARTICULATION_CA', severite: 'OK' };
}
```

### La règle : signaler, jamais corriger

```typescript
// ❌ INTERDIT — « réparer » une anomalie
if (!balance.sommaire.estEquilibre) {
  balance.lignes.push({ compte: '471', debiteur: ecart });   // NON : compte d'attente = erreur masquée
}

// ✅ Le contrôle SIGNALE. La correction est un acte humain, tracé.
return { code: 'EQUILIBRE', severite: 'BLOQUANT', message: `Écart de ${fmt(ecart)} XOF` };
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Liasse rejetée par l'OTR** (contrôles officiels échoués) | Les **contrôles de la DSF** sont exécutés **au plus tôt** (depuis la balance), pas découverts au dépôt — l'exemplaire GUIDEF réel **en échoue 2** |
| **Écart d'articulation du CA** → **impôt faux** (la MFP est assise sur le CA) | Contrôle **dédié** (CR ↔ base MFP) avec message explicite sur la conséquence fiscale |
| Balance OCR présentée comme justifiée | **Statut de preuve** pondéré **par les montants** ; `majorite_estimée` **annotée** et **transportée** jusqu'à la liasse |
| Statut de preuve trompeur (pondéré par le nombre de lignes) | **Pondération par les montants** (test central) |
| **Correction automatique** masquant l'erreur (compte d'attente) | **Interdit** : le contrôle **signale**, la correction est **humaine et tracée** (test) |
| Contrôles différents selon la source | **Mêmes contrôles pour les 3 sources** — **test croisé** (Sage / IMF / cahiers) |
| Règles de cohérence en dur → fausses dans un autre pays | Règles **lues du gabarit de liasse** (D12) |
| Duplication des contrôles avec `bilan-service` | **Frontière explicite** : ici, ce qui est articulable **depuis la balance** ; TFT/notes → **délégués** (EPIC-011) |

---

## Definition of Done

- [ ] `ControleIntegriteService` (équilibre bloquant, doublons, format, comptes hors plan) avec **sévérité**
- [ ] `ControleCoherenceService` : **Actif=Passif**, **articulation résultat**, **⚠️ articulation CA**, articulation TVA
- [ ] Règles **lues du gabarit** ; contrôles TFT/notes **délégués** à `bilan-service` (listés)
- [ ] `StatutPreuveService` : **pondération par les MONTANTS**, 3 statuts, **annotation de risque**
- [ ] `majorite_estimée` → **livrable mais annotée** (jamais « justifiée »)
- [ ] **Gate de validation** : 409 si contrôle **BLOQUANT**
- [ ] **Aucune correction automatique** (test)
- [ ] **Test croisé** : mêmes contrôles sur les 3 sources (Sage / IMF / cahiers)
- [ ] Rapport `GET /balance/controles` ; Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-101 (équilibre CORE), STORY-085/086/102 (les 3 sources) verts

---

**Status:** in_progress
**Dependencies:** **STORY-101** (`BalanceValidator`, équilibre CORE — consolidé ici), STORY-085/086/102 (les **3 sources** à contrôler), STORY-091/092/093/094 (articulations résultat / CA / TVA), STORY-078 (plan + gabarit) · **coordination** `bilan-service` EPIC-011 (contrôles TFT/notes)
**Alimente** **STORY-099** (handoff — la balance part **avec son statut de preuve**) et **STORY-100** (e2e)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A25/A26/A27 · GUIDEF (**8 contrôles officiels** — l'exemplaire réel en échoue 2)

---

## Progress Tracking

- 2026-10-12 — `in_progress` : cadrage rejoué sur `origin/dev` (3387d56), décisions D-098-1 → D-098-10. Branches `MNV-098` (docs, balance-service).
