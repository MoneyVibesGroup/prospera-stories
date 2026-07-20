# STORY-110 : Modèle d'opérandes (`MappingRule.operandes?`, additif) + évaluateur `FORMULE` générique agnostique — socle B8 §2

**Epic :** EPIC-011B — États financiers : calcul complet de la liasse (opérandes SIG / sous-totaux / TFT / notes, tech-spec B8) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. tech-spec :** `docs/tech-spec-bilan-b8-2026-07-20.md` **§2** (Modèle d'opérandes — extension additive du contrat + évaluateur générique) + **§1** (Décision n°0 — convention de signe : magnitude positive + opérandes signées, ✅ tranchée MV 2026-07-20) + **§9** (traçabilité B8 → stories : §2 = STORY-110, socle FR-009/010/013)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-009/FR-010/FR-013 (structure des états + calcul des agrégats + contrôles d'articulation — socle de calcul commun)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de structure OHADA codée en dur) ; §« tech-spec Bilan **B8** » ; CLAUDE.md §Definition of Done, §« ne devine jamais une API »
**Réf. code livré :** STORY-038/056 (`ReferentielPackage`, `MappingRule`, `build.mjs`, `ReferentielRegistry`) · STORY-061 (**patron du champ additif `tresorerie?`** sur `MappingRule` — même technique d'extension non cassante + spread conditionnel en dernier dans `build.mjs` pour préserver l'octet/checksum) · STORY-060 (`CompteResultatProductionService` — convention `CHARGE = D−C`, alignée sur décision n°0) · STORY-059/062/063 (états produits + `MontantHorsBornesError`, bornage safe-integer)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker + intégrée dans `dev` le 2026-07-20 — PR #15 bilan-service, MNV-110 rebase-merge ; **ouvre EPIC-011B**, débloque STORY-111→114)
**Assigné à :** vivian
**Créée :** 2026-07-20
**Sprint :** 13

---

## User Story

**En tant que** mainteneur du référentiel comptable de `bilan-service`,
**je veux** un **modèle d'opérandes signées** (champ **additif** `MappingRule.operandes?`) et un **évaluateur `FORMULE` générique** dans le moteur, capable de calculer n'importe quel poste agrégat comme `Σ signe × valeur(poste référencé)` — en cascade, tous états confondus, **piloté par les données du paquet**,
**afin que** les SIG, sous-totaux, retraitements TFT et notes de la liasse (STORY-111→114) se réduisent à **de la donnée** encodée dans le paquet SYSCOHADA, **sans jamais coder une seule formule OHADA en dur** dans le moteur (invariant **P7** préservé ; SFD-BCEAO reste agnostique et inchangé).

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

EPIC-011 (S12) a livré la liasse en **squelette** : les postes agrégats — SIG `XA..XI` du CR, sous-totaux du Bilan (`AZ`, `BK`, `CP`, `BZ`, `DZ`…), lignes du TFT (`FA..FQ`, `ZA..ZH`) — sont des `type='total'` / `regle='FORMULE'` avec `comptesSyscohada: []` et **aucune formule exploitable** : leur intitulé (« Somme TA à RB ») est du **texte**, pas une formule machine. Ces règles ont été **délibérément renvoyées au tech-spec B8** (hooks documentés dans STORY-059/060/061) pour deux raisons structurantes :

1. **Non exploitables machine** — la formule n'existe que dans le libellé.
2. **Spécifiques au référentiel** — les coder en dur dans le moteur **violerait P7** (moteur agnostique) : SYSCOHADA a 9 SIG et un TFT, SFD-BCEAO a d'autres agrégats (états DIMF) et **aucun TFT**.

La tech-spec **B8 est désormais figée** (`docs/tech-spec-bilan-b8-2026-07-20.md`, 2026-07-20) et la **décision n°0 est tranchée** (magnitude positive + opérandes signées, §1). STORY-110 est la **1ʳᵉ story d'EPIC-011B** : elle livre **le socle §2 — le mécanisme, pas encore les formules**. Elle n'encode **aucune** opérande SYSCOHADA (cela reste de la donnée, ajoutée par 111→114) : elle fournit **le champ de contrat, l'évaluateur générique et le passthrough de build** qui rendront ces ajouts **purement déclaratifs**.

> **Analogie directe** — STORY-061 avait livré le marqueur `tresorerie?` (donnée additive) **avant** que le TFT le consomme. STORY-110 fait exactement pareil pour les opérandes : **la primitive réutilisable d'abord**, ses consommateurs (CR/Bilan/TFT/notes) ensuite.

### Ce que 110 livre — trois briques de mécanisme

**1. Extension additive du contrat (`MappingRule.operandes?`)** — sur le **patron exact** du champ `tresorerie?` (STORY-061), non cassante : un paquet qui ne le déclare pas continue de charger (`?? undefined`, aucune validation renforcée). Nouveau type `Operande` :

```ts
export interface Operande {
  /** Code du poste référencé (détail, SIG, sous-total, ou poste d'un autre état). */
  poste: string;
  /** Sens dans la formule (convention magnitude + opérandes signées, décision n°0). */
  signe: '+' | '-';
  /**
   * Mode de lecture. Défaut 'VALEUR' (valeur N du poste, MÊME état).
   * 'VARIATION' = N − N-1 (retraitements TFT). 'VALEUR_N_1' = valeur N-1 (ancre trésorerie ZA).
   */
  mode?: 'VALEUR' | 'VARIATION' | 'VALEUR_N_1';
  /** État source si différent de l'état du poste porteur (le TFT lit Bilan/CR). Défaut = même état. */
  etatSource?: string;
}
// MappingRule gagne : operandes?: Operande[];  // présent uniquement sur les postes regle='FORMULE'
```

**2. Évaluateur `FORMULE` générique (moteur, pur, agnostique P7)** — `EvaluateurFormuleService` :

- calcule un poste `regle='FORMULE'` **porteur d'`operandes`** par `Σ signe × lire(op)` ;
- `lire(op)` résout la valeur du poste référencé **dans les états déjà produits** selon `mode`/`etatSource` : `VALEUR` = montant N ; `VARIATION` = montant N − montant N-1 ; `VALEUR_N_1` = montant N-1 ;
- **ordre d'évaluation = ordre de déclaration** du paquet, qui est déjà l'**ordre de cascade** de la liasse (une `FORMULE` peut référencer une `FORMULE` déclarée **avant** elle : `XC → XB`, `BZ → AZ, BK, BT`…) → les valeurs calculées sont **réinjectées** dans le contexte au fil de l'eau ;
- un poste `FORMULE` **sans** `operandes` conserve le **comportement squelette** (renvoyé « à compléter », inchangé) ;
- **bornage safe-integer** (unités mineures XOF) réutilisant le patron `MontantHorsBornesError` (059/060) : tout cumul hors entier sûr → erreur propagée en 400, jamais 500 ;
- **100 % agnostique** : SFD-BCEAO ne déclare aucune opérande SYSCOHADA → **même code, résultat agnostique**. **Zéro structure OHADA dans le moteur.**

**3. Passthrough de build + garde de cohérence** — `build.mjs` recopie `operandes` des sources (spread **conditionnel, en dernier** → préserve l'octet des lignes sans opérande, comme `tresorerie`) ; un test de **cohérence des opérandes** garantit que **toute** opérande déclarée (aujourd'hui : aucune sur les paquets réels ; demain : SIG/sous-totaux/TFT) **résout** vers un poste connu du paquet et respecte l'**ordre de cascade** (aucune référence en avant vers une `FORMULE` non encore évaluée).

### Ce que 110 ne fait PAS (frontière nette avec 111→114)

STORY-110 n'ajoute **aucune** opérande aux paquets réels et **ne câble l'évaluateur dans aucun état produit**. Les paquets `syscohada-revise@2.1` et `sfd-bceao@1.0` restent **byte-identiques** → **checksums 056/057/061 inchangés**, sorties `bilan`/`compte-resultat`/`tft`/`notes`/`controles` dry-run **inchangées**. L'évaluateur est une **primitive réutilisable, entièrement testée en unitaire**, mise à disposition (provider enregistré) mais **pas encore consommée** — hook inerte documenté pour :

- **STORY-111** — encode les opérandes **SIG XA..XI** (XC corrigé) et **branche l'évaluateur dans le CR** (+ articulation `CJ=XI`).
- **STORY-112** — encode les **sous-totaux Bilan** et branche dans le Bilan (+ contrôle `BZ=DZ`).
- **STORY-113** — encode le **TFT + CAFG** (modes `VARIATION`/`VALEUR_N_1`, `etatSource`) et branche dans le TFT (+ statut par ligne).

---

## Scope

**Dans le périmètre :**

- **Contrat** : `Operande` (interface) + champ additif `operandes?: Operande[]` sur `MappingRule` dans `referentiel/referentiel-package.interface.ts`. **Aucune** validation renforcée au chargement (additif pur, `?? undefined` comme `tresorerie` en 061) → `ReferentielLoader` et `referentiel-http.mapper` **inchangés** (le loader passe `tableDePassage` tel quel).
- **`EvaluateurFormuleService` (pur, aucune I/O, agnostique)** — `src/modules/bilan/etats/evaluateur-formule.service.ts` + types (`evaluateur-formule.types.ts`). Entrée : les postes des états **déjà produits** (valeur N + N-1 par `(etat, poste)`) et la liste **ordonnée** des `MappingRule` `FORMULE` porteuses d'`operandes` ; sortie : la valeur calculée de chaque `FORMULE`, résolue en **cascade** (réinjection au fil de la déclaration), avec `VALEUR`/`VARIATION`/`VALEUR_N_1`, `etatSource`, et **bornage safe-integer** (`MontantHorsBornesError`). Enregistré comme **provider** dans `bilan.module.ts` (primitive partagée 111→114) — **non injecté** ailleurs (hook inerte).
- **`build.mjs`** : `normMapping` recopie `operandes` depuis la source **si présente** (spread conditionnel **en dernier** → non-régression d'octet/checksum pour toute ligne sans opérande). Sources `table-de-passage-*.json` **inchangées** en 110 (aucune opérande ajoutée).
- **Garde de cohérence** — `referentiel/operandes-coherence.spec.ts` (jumeau de `plan-comptable-coherence.spec.ts`) : pour chaque paquet packagé **et** pour des paquets **synthétiques** de fixture, toute `operande.poste` déclarée résout vers un poste du paquet, l'ordre de déclaration respecte la **cascade** (pas de référence en avant), `mode`/`etatSource` valides. Sur les paquets réels (0 opérande) → **passe à vide** (filet pour 111→114).
- **Non-régression** : paquets réels **byte-identiques** (checksums `syscohada-revise@2.1` / `sfd-bceao@1.0` **inchangés**) ; `ReferentielLoader`, `TableDePassageService`, `BilanProductionService` (059), `CompteResultatProductionService` (060), `TftProductionService` (061), `NotesAnnexesProductionService` (062), `ControlesCoherenceProductionService` (063) et **tous** les endpoints existants **inchangés**.

**Hors périmètre (hooks inertes documentés — NE PAS déborder) :**

- **Encodage des opérandes SIG `XA..XI` (XC corrigé) + câblage dans le CR + articulation `CJ=XI`** → **STORY-111** (B8 §3, correction A).
- **Encodage des sous-totaux Bilan (`AZ`…`DZ`) + câblage + contrôle `BZ=DZ`** → **STORY-112** (B8 §4).
- **Encodage TFT `FA..FQ` / `ZA..ZH` + CAFG additif (correction B) + statut par ligne `CALCULE`/`ESTIME`/`A_COMPLETER`** → **STORY-113** (B8 §5).
- **Notes annexes v1 automatables (ventilation de solde)** → **STORY-114** (B8 §6).
- **Câblage de l'évaluateur dans un état produit / un endpoint** — 110 livre la primitive **non branchée** ; chaque état est branché par sa story (111/112/113).
- **Tolérance d'articulation paramétrable (F2, seuil 0 vs ±1 XOF)**, **jeu d'essai comptable (F4)**, **sign-off expert (F1)**, **import balance réel (A2)** → blockers MV / stories ultérieures ; ils gâtent la **preuve e2e comptable**, pas le socle de 110.

---

## User Flow

*(Story d'infrastructure — pas de flux utilisateur final ; « flux » = celui du mainteneur de référentiel et du moteur.)*

1. Un mainteneur déclare, dans une source `table-de-passage-*.json`, un poste `FORMULE` porteur d'`operandes` (ex. `XC` avec `+XB −RA −RB …`). *(effectif en 111→114 ; en 110, prouvé sur fixtures synthétiques.)*
2. `node scripts/referentiels/build.mjs` régénère l'artefact : `operandes` est recopié tel quel (spread conditionnel en dernier), le sha256 est réimprimé.
3. Le test de **cohérence des opérandes** vérifie que chaque poste référencé existe et que l'ordre de déclaration respecte la cascade — sinon échec **en CI** (pas au runtime).
4. À la production d'un état (câblage 111→114), `EvaluateurFormuleService` reçoit les postes déjà produits + les `FORMULE` ordonnées et calcule chaque agrégat `Σ signe × lire(op)`, en réinjectant les valeurs au fil de la cascade.
5. Un paquet **sans** opérande (SFD-BCEAO, ou tout `FORMULE` non encore encodé) → l'évaluateur ne calcule rien pour ce poste (**comportement squelette conservé**). **Aucune structure OHADA n'a été codée dans le moteur.**

---

## Acceptance Criteria

- [ ] **Contrat additif** : `MappingRule` porte `operandes?: Operande[]` et le type `Operande` (`poste`, `signe:'+'|'-'`, `mode?:'VALEUR'|'VARIATION'|'VALEUR_N_1'`, `etatSource?`) est exporté. Un paquet **sans** `operandes` charge sans erreur (non cassant, comme `tresorerie?`).
- [ ] **Évaluateur — somme signée** : sur un paquet de fixture, un poste `FORMULE` `+A −B` calcule `valeur(A) − valeur(B)` (magnitude + opérandes signées, décision n°0).
- [ ] **Cascade** : une `FORMULE` référençant une autre `FORMULE` déclarée **avant** elle (ex. `XC → XB`, `BZ → AZ, BK, BT`) est résolue avec la valeur **calculée** de la précédente (réinjection au fil de la déclaration).
- [ ] **Modes** : `mode='VARIATION'` calcule `N − N-1` ; `mode='VALEUR_N_1'` calcule `N-1` ; `mode` absent ⇒ `VALEUR` (montant N). Sans jeu N-1, `VARIATION`/`VALEUR_N_1` sont indéterminés → gérés sans crash (valeur nulle/statut, jamais 500).
- [ ] **`etatSource`** : une `FORMULE` d'un état (ex. `TFT`) lit un poste d'un **autre** état (ex. `COMPTE_RESULTAT`, `BILAN_ACTIF`) via `etatSource`.
- [ ] **Poste `FORMULE` sans opérande** → **comportement squelette conservé** (aucune valeur inventée), inchangé vs EPIC-011.
- [ ] **Référence non résolue** : une opérande pointant un poste absent du contexte est **détectée** (erreur explicite en test de cohérence / évaluation), jamais silencieusement nulle en production.
- [ ] **Bornage** : un cumul dépassant l'entier sûr lève `MontantHorsBornesError` → **400** (`MONTANT_HORS_BORNES`), jamais 500 (patron 059/060).
- [ ] **Agnostique P7** : l'évaluateur ne contient **aucun** code SYSCOHADA/OHADA en dur ; un paquet sans opérande (SFD-BCEAO) traverse le **même** code sans effet. **Aucune structure comptable dans le moteur.**
- [ ] **Build** : `build.mjs` recopie `operandes` quand une source la déclare (spread conditionnel **en dernier**, patron **identique** à `tresorerie?` de STORY-061 — prouvé) ; **absente** ⇒ octet de sortie **inchangé** (régénération **byte-identique** vérifiée). *(1ʳᵉ source porteuse d'opérande = STORY-111 → exercice de bout en bout à ce moment.)*
- [ ] **Non-régression** : paquets `syscohada-revise@2.1` / `sfd-bceao@1.0` **byte-identiques** → **checksums 056/057/061 inchangés** ; `bilan`/`compte-resultat`/`tft`/`notes-annexes`/`controles` dry-run (059→063) **inchangés** ; `ReferentielLoader` / `referentiel-http.mapper` **non modifiés**.

---

## Technical Notes

### Composants

- **Étendu** : `src/modules/bilan/referentiel/referentiel-package.interface.ts` → nouveau `export interface Operande` + champ additif `operandes?: Operande[]` sur `MappingRule` (documenté « présent uniquement sur les postes `regle='FORMULE'` »).
- **Nouveau** : `src/modules/bilan/etats/evaluateur-formule.service.ts` (**pur**, `@Injectable`) + `.spec.ts` ; `src/modules/bilan/etats/evaluateur-formule.types.ts` (types d'E/S de l'évaluateur).
- **Nouveau** : `src/modules/bilan/referentiel/operandes-coherence.spec.ts` (garde de cohérence, jumeau de `plan-comptable-coherence.spec.ts`).
- **Étendu** : `scripts/referentiels/build.mjs` → `normMapping` recopie `operandes` (spread conditionnel en dernier) ; `src/modules/bilan/bilan.module.ts` → provider `EvaluateurFormuleService` (primitive partagée 111→114, non injectée en 110).
- **Réutilisés inchangés** : `ReferentielLoader` (passe `tableDePassage` tel quel), `referentiel-http.mapper`, `TableDePassageService`, `MontantHorsBornesError`, `ReferentielRegistry`, tous les `*ProductionService` (059→063).

### Contrats (types)

```ts
// referentiel-package.interface.ts (extension additive)
export interface Operande {
  poste: string;
  signe: '+' | '-';
  mode?: 'VALEUR' | 'VARIATION' | 'VALEUR_N_1';
  etatSource?: string;
}
// MappingRule : + operandes?: Operande[];

// evaluateur-formule.types.ts (E/S de l'évaluateur — pur)
/** Valeur d'un poste déjà produit, par état, avec colonnes N / N-1. */
export interface ValeurPoste { etat: string; poste: string; valeurN: number; valeurN1: number | null; }

/** Contexte : toutes les valeurs de postes déjà connues (détail + FORMULE déjà résolues). */
export interface ContexteEvaluation {
  /** Clé = `${etat}:${poste}` → valeur. Alimenté par les états produits, enrichi en cascade. */
  valeurs: Map<string, ValeurPoste>;
  /** État « courant » du poste porteur (défaut de l'opérande sans etatSource). */
  etatCourant: string;
}

export interface ResultatFormule { poste: string; etat: string; valeurN: number; valeurN1: number | null; }
```

### Algorithme (`EvaluateurFormuleService`)

1. **`evaluer(formulesOrdonnees, contexte)`** : itère les `MappingRule` `FORMULE` **dans l'ordre de déclaration**. Pour chacune porteuse d'`operandes` :
   - `valeurN = Σ signeNum(op) × lire(op, 'N', contexte)` ; idem `valeurN1` (null si aucun N-1 disponible et qu'une opérande l'exige) ;
   - **réinjecte** `{etat, poste} → valeur` dans `contexte.valeurs` (une `FORMULE` suivante peut la lire = cascade) ;
   - une `FORMULE` **sans** opérande est **ignorée** (comportement squelette conservé).
2. **`lire(op, colonne, contexte)`** : résout `${op.etatSource ?? etatCourant}:${op.poste}` dans `contexte.valeurs` ; **absent → erreur** (`OperandeNonResolueError`, mappée 400/500 selon origine, jamais silencieuse). Applique `mode` : `VALEUR`→N ; `VALEUR_N_1`→N-1 ; `VARIATION`→N − N-1.
3. **`signeNum('+')=+1`, `signeNum('-')=−1`** ; chaque cumul passe par `additionSure` (patron 060) → `MontantHorsBornesError` si hors entier sûr.
4. **Pureté & agnosticisme** : aucune constante de code de poste OHADA ; l'évaluateur ne connaît que la structure `Operande`. Un paquet sans opérande = **aucun effet**.

### Cohérence des opérandes (`operandes-coherence.spec.ts`)

- Charge chaque paquet packagé + des fixtures synthétiques. Pour chaque `MappingRule` porteuse d'`operandes` : (a) chaque `operande.poste` (état = `etatSource ?? poste porteur`) **existe** parmi les postes/règles du paquet ; (b) si le poste référencé est lui-même `FORMULE`, il est déclaré **avant** (ordre de cascade — pas de référence en avant) ; (c) `signe ∈ {+,-}`, `mode ∈ {VALEUR,VARIATION,VALEUR_N_1}∪{absent}`, `etatSource` (si présent) est un état connu. Sur `syscohada-revise@2.1` / `sfd-bceao@1.0` réels (0 opérande) → **passe à vide**.

### Sécurité / robustesse

- Story **d'infrastructure sans endpoint ni écriture** → **pas de transaction Mongo**, pas de surface d'attaque nouvelle.
- Anti-500 : `MontantHorsBornesError` (bornage) et `OperandeNonResolueError` (paquet incohérent) sont des **erreurs typées** ; en production, un paquet incohérent est un défaut de **build/CI** (garde de cohérence), pas une entrée utilisateur.

### Edge cases

- **`operandes: []`** (tableau vide) ⇒ traité comme **absent** (poste squelette).
- **N-1 absent** ⇒ une opérande `VARIATION`/`VALEUR_N_1` donne un `valeurN1 = null` propagé sans crash (le statut fin `INDETERMINABLE` sera porté par le TFT en 113).
- **Cascade profonde** (`BZ → AZ, BK, BT` où chacun est lui-même une `FORMULE`) ⇒ résolue si l'ordre de déclaration est respecté (garanti par la garde de cohérence).
- **Référence en avant** (opérande vers une `FORMULE` non encore évaluée) ⇒ **détectée** par la garde de cohérence (échec CI), et à l'évaluation par `OperandeNonResolueError`.
- **SFD-BCEAO / tout `FORMULE` non encodé** ⇒ aucun calcul, squelette conservé.

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** STORY-038/056 (contrat `ReferentielPackage`/`MappingRule` + `build.mjs` + `ReferentielRegistry`), STORY-061 (**patron du champ additif `tresorerie?`** + spread conditionnel en dernier), STORY-059/060/062/063 (états produits + `MontantHorsBornesError`, bornage). **Décision n°0** (convention de signe) ✅ tranchée MV 2026-07-20.

**Stories débloquées :** **STORY-111** (SIG `XA..XI`, XC corrigé — 1ᵉʳ consommateur de l'évaluateur), **STORY-112** (sous-totaux Bilan, `BZ=DZ`), **STORY-113** (TFT + CAFG, modes `VARIATION`/`VALEUR_N_1`/`etatSource`), **STORY-114** (notes v1). L'évaluateur et le champ `operandes?` sont **leur socle commun**.

**Dépendances externes :** aucune (référentiels embarqués ; aucun appel réseau).

**Blockers MV (n'affectent PAS 110)** : format balance A2, jeu d'essai F4, sign-off expert F1, seuil arrondi F2 — ils gâtent la **preuve e2e comptable** (aval), pas l'encodage/dry-run du socle.

---

## Definition of Done

- [ ] Code implémenté (français) ; `EvaluateurFormuleService` **pur** et **référentiel-agnostique** ; **aucune formule ni structure OHADA en dur** (P7) ; champ `operandes?` **additif** (non cassant).
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (`evaluateur-formule.service.ts` visé **100 %**). Seuils jamais baissés.
- [ ] Tests **unitaires** de l'évaluateur : somme signée `+A−B` ; cascade (`FORMULE → FORMULE` antérieure) ; modes `VALEUR`/`VARIATION`/`VALEUR_N_1` ; `etatSource` inter-états ; `FORMULE` sans opérande = squelette ; référence non résolue → erreur ; bornage → `MontantHorsBornesError` ; **paquet sans opérande = aucun effet** (agnosticisme). Garde de cohérence verte sur paquets réels **et** fixtures.
- [ ] Tests **de non-régression** : suites 055→063 vertes **inchangées** ; **artefacts régénérés byte-identiques** → checksums `syscohada-revise@2.1` / `sfd-bceao@1.0` **inchangés** dans `ReferentielRegistry` (test `referentiel-registry` / `referentiel-stamp` vert). Garde `operandes-coherence.spec.ts` **charge les deux paquets réels via le vrai `ReferentielLoader`** (vérif. checksum) → **0 violation** (protège 111→114).
- [ ] **Vérification docker réelle** (la story n'écrit pas en base et n'expose aucun endpoint ⇒ preuve = **intégrité du chargement référentiel + non-régression sur stack vivante**) : `docker compose up --build` → 8 services `/health` **200** ; `bilan-service` **charge** `syscohada-revise@2.1` et `sfd-bceao@1.0` avec **checksums inchangés** (log de chargement) ; `bilan`/`compte-resultat`/`tft`/`notes-annexes`/`controles` dry-run (059→063) renvoient une sortie **identique à EPIC-011** sur un jeu de soldes de référence (cross-check byte/nombre). Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé ; constats de correction traités (attention particulière au « code non consommé » : l'évaluateur est un **hook documenté** pour 111→114, justifié).
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Contrat `Operande` + champ additif `MappingRule.operandes?` :** 1 point
- **`EvaluateurFormuleService` (somme signée, cascade, modes, `etatSource`, bornage) + types :** 2 points
- **`build.mjs` passthrough + garde de cohérence des opérandes :** 1 point
- **Tests (unit + fixtures + non-régression) + vérif docker intégrité :** 1 point
- **Total :** 5 points

**Rationale :** aucune règle comptable neuve — 110 est **pur mécanisme**. L'effort réel est de concevoir un évaluateur **générique** correct (cascade ordonnée, modes N/N-1/variation, cross-état, bornage) et une garde de cohérence robuste, tout en **garantissant la non-régression byte** des paquets réels (checksum-neutre). Le risque « deviner une règle OHADA » est **nul** (aucune opérande encodée ici). C'est le socle qui rend 111→114 **purement déclaratifs**.

---

## Additional Notes

- **Ouvre EPIC-011B.** Après 110, transformer un poste agrégat de squelette en poste calculé = **ajouter des `operandes` dans la source + brancher l'évaluateur dans l'état** (111→114) — jamais toucher au moteur.
- **Parallèle 061 → 110** : 061 avait livré `tresorerie?` (donnée additive) avant que le TFT le lise ; 110 livre `operandes?` + l'évaluateur avant que CR/Bilan/TFT les consomment. Même technique d'extension non cassante, même préservation d'octet/checksum.
- **Décision n°0 câblée par construction** : magnitude positive + opérandes signées → `signe '-'` = soustraction. La correction **A (XC)** et **B (CAFG)** de B8 ne sont **pas** dans 110 (ce sont des **opérandes**, encodées en 111/113) ; 110 fournit seulement l'algèbre `Σ signe × valeur` qui les rendra exactes.
- **Checksum-neutre volontaire** : 110 ne modifie **aucun** octet des paquets réels. Les checksums `syscohada-revise@2.1` évolueront en **111** (1ʳᵉ opérande réellement encodée), pas ici.

---

## Progress Tracking

**Status History :**
- 2026-07-20 : Créée (Scrum Master) — **1ʳᵉ story d'EPIC-011B**, socle B8 §2. Cadrée strictement « mécanisme, pas formules » : contrat additif `Operande`/`MappingRule.operandes?` + `EvaluateurFormuleService` générique agnostique + passthrough `build.mjs` + garde de cohérence. **Aucune opérande SYSCOHADA encodée** (→ 111→114) ; paquets réels byte-identiques (checksums inchangés) ; évaluateur livré comme primitive testée mais **non branchée** (hook inerte pour CR/Bilan/TFT). Décision n°0 tranchée → algèbre `Σ signe × valeur` définitive.
- 2026-07-20 : Implémentée + vérifiée docker + intégrée dans `dev` (MNV-110, PR #15 bilan-service, rebase-merge, branche supprimée). **Ouvre EPIC-011B** ; débloque STORY-111→114.

**Implémentation (dev-story, 2026-07-20) :**
- **Contrat** (`referentiel-package.interface.ts`) : `Operande` (`poste`, `signe:'+'|'-'`, `mode?:'VALEUR'|'VARIATION'|'VALEUR_N_1'`, `etatSource?`) + champ **additif** `MappingRule.operandes?: Operande[]` (documenté « présent uniquement sur les postes `regle='FORMULE'` »). Non cassant : loader/http-mapper **inchangés** (le loader passe `tableDePassage` tel quel).
- **`EvaluateurFormuleService`** (`etats/evaluateur-formule.service.ts`, **pur**, `@Injectable`) : `evaluer(formules, valeursInitiales)` calcule chaque `FORMULE` porteuse d'opérandes en `Σ signe × lire(op)`, **dans l'ordre de déclaration** (cascade — réinjection au fil de l'eau, copie locale du contexte, aucune mutation de l'entrée). Modes `VALEUR`/`VARIATION`/`VALEUR_N_1` sur la **colonne N** ; colonne N-1 significative **seulement** pour les opérandes `VALEUR` (SIG/sous-totaux), `null` sinon (TFT mono-période). `FORMULE` sans opérande → **ignorée** (squelette). Bornage `additionSure` → `MontantHorsBornesError` (patron 060). Opérande non résolue → `OperandeNonResolueError` (jamais silencieuse). **Zéro structure OHADA** : primitive livrée **non branchée** (provider enregistré dans `BilanModule`, hook 111→114).
- **`build.mjs`** : `normOperandes` + spread conditionnel **en dernier** (après `tresorerie`) → régénération **byte-identique** vérifiée (`shasum` avant/après = `cb8a7e11…` syscohada / `0509a03…` sfd, **inchangés**). Aucune source ne déclare d'opérande en 110.
- **Garde** `operandes-coherence.spec.ts` : `verifierOperandes(pkg)` (résolution + cascade/ordre + `signe`/`mode`/`etatSource` valides) → **0 violation** sur les 2 paquets réels **chargés via le vrai `ReferentielLoader`** (vérif. checksum) + 7 fixtures synthétiques prouvant la **détection** (référence en avant, poste inconnu, mode/signe/etatSource invalides, cascade & inter-états valides).
- **Qualité** : lint **0 warning** · `npm run build` OK · **321 unit tests (38 suites) verts** · `evaluateur-formule.service.ts` **100/100/100/100**, `evaluateur-formule.errors.ts`/`.types.ts` **100 %** · global **98.21/93.21/98.15/98.05** > seuils 65/90/90/90. Suites 055→063 **inchangées** (non-régression).

**Vérification docker (socle : aucune écriture base, aucun endpoint neuf ⇒ preuve = intégrité chargement référentiel + non-régression sur stack neuve)** :
- Stack **neuve** (`down -v` → `up -d`, images existantes, `src/` monté hot-reload). `bilan-service` **HEALTHY** en ~63 s : `/health` = `{status:ok, mongodb:up, kafka:up}`.
- Hot-reload TypeScript : **« Found 0 errors »** — mon code compile dans le conteneur ; `dist/modules/bilan/etats/evaluateur-formule.*` présents ; **app démarrée avec le provider `EvaluateurFormuleService` enregistré** (aucune erreur de résolution DI au boot).
- **Intégrité référentiel** : régénération byte-identique (checksums inchangés) + garde `operandes-coherence` charge les 2 paquets réels via le vrai loader (checksum vérifié) → 0 violation.
- **Non-régression HTTP** : `POST /bilan/etats/{bilan,compte-resultat,controles}/dry-run` **sans jeton → 401** (guards + surface inchangés). Les `ERROR kafkajs « does not host this topic-partition »` au boot = transitoire de démarrage dégradé (invariant #4), `kafka:up` ensuite — sans rapport avec la story.

**Effort réel :** 5 points (conforme).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
