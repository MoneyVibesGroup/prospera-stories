# STORY-111 : SIG `XA..XI` en opérandes signées (XC corrigé) + calcul dans le Compte de résultat + articulation `CJ=XI` — FR-010 (complet) — B8 §3

**Epic :** EPIC-011B — États financiers : calcul complet de la liasse (opérandes SIG / sous-totaux / TFT / notes, tech-spec B8) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. tech-spec :** `docs/tech-spec-bilan-b8-2026-07-20.md` **§3** (Compte de résultat — SIG `XA..XI`, opérandes signées + **correction A** sur `XC`) + **§1** (décision n°0 — magnitude positive + opérandes signées, ✅ tranchée MV 2026-07-20) + **§7** (contrôle `COHERENCE_RESULTAT : CJ = XI`, bloquant) + **§9** (traçabilité : §3 = STORY-111, FR-010)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-010 (Compte de résultat + **soldes intermédiaires de gestion**) + §FR-013 (contrôles d'articulation)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de structure OHADA codée en dur) ; CLAUDE.md §Definition of Done, §« ne devine jamais une API »
**Réf. code livré :** **STORY-110** (socle B8 §2 : `Operande` + `MappingRule.operandes?` + **`EvaluateurFormuleService`** `Σ signe × valeur`, cascade ordonnée, `additionSure`/`MontantHorsBornesError`, `OperandeNonResolueError` ; passthrough `build.mjs` (`normOperandes`, spread conditionnel **en dernier**) ; garde `operandes-coherence.spec.ts`) · **STORY-060** (`CompteResultatProductionService` — postes détail `montantN`/`montantN1` en **magnitude positive**, convention `CHARGE = D−C` alignée décision n°0 ; `CoherenceResultat`) · **STORY-063** (`ControlesCoherenceProductionService` — `COHERENCE_RESULTAT` bloquant) · **STORY-056/038** (`ReferentielRegistry`, `build.mjs`, sources `table-de-passage-syscohada.json`)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + intégrée dans `dev` le 2026-07-20 — PR #16 bilan-service, MNV-111 « Rebase and merge », HEAD 43c895a ; débloque STORY-112)
**Assigné à :** vivian
**Créée :** 2026-07-20
**Sprint :** 13

---

## User Story

**En tant que** cabinet comptable produisant sa liasse OHADA dans `bilan-service`,
**je veux** que les **soldes intermédiaires de gestion** (`XA` Marge commerciale → `XI` Résultat net) soient **réellement calculés** dans le Compte de résultat — chacun comme `Σ signe × valeur` de ses postes de détail et des SIG amont — et que le moteur **prouve** que le résultat net `XI` articule avec le résultat porté au passif du Bilan (`CJ`),
**afin que** mon Compte de résultat ne s'arrête plus au squelette (SIG vides) mais restitue la **cascade complète** de la marge au résultat net, sans qu'aucune formule OHADA ne soit codée dans le moteur (elle est **donnée** du paquet `syscohada-revise@2.1` ; SFD-BCEAO, sans SIG, reste agnostique et inchangé — **invariant P7**).

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

**STORY-110 a livré le socle B8 §2** : le champ additif `MappingRule.operandes?`, l'`EvaluateurFormuleService` générique (`Σ signe × valeur`, cascade ordonnée, modes, bornage) et le passthrough `build.mjs` — **mais aucune opérande n'a été encodée** et **l'évaluateur n'est branché nulle part** (primitive livrée « non consommée », hook inerte documenté). Les SIG `XA..XI` du CR restent aujourd'hui des postes `type='total'` / `regle='FORMULE'` **sans opérande** : `CompteResultatProductionService` les **ignore** (`choisirPosteCR` filtre `type!=='total'`), le CR s'arrête aux postes de détail + totaux/résultat net.

**STORY-111 est le 1ᵉʳ consommateur de l'évaluateur.** Elle transforme les SIG du squelette en postes calculés, en **deux gestes** — jamais toucher au moteur générique :

1. **Encoder** les 9 opérandes SIG (B8 §3, **`XC` corrigé** — correction A) **dans la source** `table-de-passage-syscohada.json` → régénérer l'artefact (`syscohada-revise@2.1` change d'octet : **1ʳᵉ opérande réellement encodée**).
2. **Brancher** `EvaluateurFormuleService` dans la production du CR : projeter les postes de détail déjà agrégés (`montantN`/`montantN1`, magnitude positive) en contexte d'évaluation, calculer les SIG dans l'ordre de cascade, les ajouter à la sortie CR, et **articuler** `XI` avec le résultat net direct (= `CJ` au passif via STORY-060) — contrôle `COHERENCE_RESULTAT : CJ = XI` (B8 §7).

> **Pourquoi le CR d'abord (SIG) ?** C'est le **cas le plus simple** de l'évaluateur : toutes les opérandes sont **mono-état** (`COMPTE_RESULTAT`), **mono-période** en lecture `VALEUR` (défaut), **sans** `etatSource` ni mode relatif. Il valide le **cœur** de l'algèbre (somme signée + cascade `XC→XB`, `XD→XC`, `XG→XE,XF`, `XI→XG,XH`) avant que STORY-112 (sous-totaux Bilan) et STORY-113 (TFT : `VARIATION`/`VALEUR_N_1`/`etatSource`) n'exercent les modes avancés.

### Décision n°0 câblée — magnitude positive + opérandes signées

Les postes de détail du CR sont émis par STORY-060 en **magnitude positive** : un **produit** = `Σ (crédit − débit)` positif, une **charge** = `Σ (débit − crédit)` positive. Les opérandes SIG **soustraient** les charges (`signe:'-'`) et **ajoutent** les produits (`signe:'+'`) — **exactement** la convention de l'évaluateur 110. C'est ce qui rend la **correction A** (`XC`) correcte : `RA`/`RB` (achats & variation de stocks marchandises, charges positives) sont **soustraits**, pas ajoutés (voir *Technical Notes* — vérif numérique VA = 1 600).

### Correction A — `XC` (Valeur ajoutée), figée par B8 §3

La fiche comptable avait laissé `XC = XB + RA + RB + …` (charges **ajoutées**) — incohérent avec décision n°0 et avec son propre `XA`. **B8 fige la forme corrigée** (magnitude signée) :

```
XC = +XB − RA − RB + (TE+TF+TG+TH+TI) − (RC+RD+RE+RF+RG+RH+RI+RJ)
```

C'est **cette** version qui est encodée. Elle retire aussi le double-comptage de `XA` (déjà fait par la fiche). **Aucune autre correction** sur les SIG (XA/XB/XD/XE/XF/XG/XH/XI = GUIDEF, validés B8 §3).

### Ce que 111 livre

1. **Opérandes SIG encodées (source + artefact régénéré).** Les 9 postes `FORMULE` du `COMPTE_RESULTAT` reçoivent leurs `operandes` (B8 §3, `XC` corrigé) dans `scripts/referentiels/sources/table-de-passage-syscohada.json`. `node scripts/referentiels/build.mjs` régénère `syscohada-revise-2.1.json` → **nouveau sha256** (recopié dans `ReferentielRegistry`). `sfd-bceao@1.0` **byte-identique** (aucun SIG → aucune opérande) : agnosticisme P7 prouvé.
2. **Câblage de l'évaluateur dans le CR.** `CompteResultatProductionService` (060) injecte `EvaluateurFormuleService`, projette ses postes détail agrégés en `ValeurPoste[]` (`etat='COMPTE_RESULTAT'`, `valeurN=montantN`, `valeurN1=montantN1`), sélectionne les `MappingRule` `FORMULE` du CR **dans l'ordre de déclaration** (= cascade), appelle `evaluer(...)` et expose les résultats en nouveau champ `sig: PosteSig[]` sur `CompteResultatProduit`. Postes détail / totaux / résultat net **inchangés** (non-régression stricte des champs existants).
3. **Articulation `CJ = XI` (B8 §7).** Nouveau contrôle de cohérence `coherenceSig` (`XI` calculé vs résultat net direct `resultatNetN`) : `ecart=0` **attendu par construction** (`XI` = `+XG +XH −RQ −RS` développé = `Σ_CR (crédit − débit)`), matérialisant `CJ = XI` (car `resultatNetN = CJ` via 060). Le contrôle `COHERENCE_RESULTAT` de la batterie 063 est **renforcé** : lorsque le référentiel produit des SIG, il assert **aussi** `XI = CJ` (additif ; un référentiel sans SIG — SFD — conserve le sens `CR = CJ` actuel).

### Ce que 111 ne fait PAS (frontière nette)

- **Sous-totaux du Bilan** (`AZ`…`DZ`, contrôle `BZ=DZ`) → **STORY-112** (B8 §4). 111 ne touche **que** l'état `COMPTE_RESULTAT`.
- **TFT / CAFG** (`FA..ZH`, modes `VARIATION`/`VALEUR_N_1`, `etatSource`, statut par ligne) → **STORY-113** (B8 §5). 111 n'exerce **que** le mode `VALEUR` mono-état.
- **Notes annexes v1** → **STORY-114** (B8 §6).
- **Import balance réel / jeu d'essai comptable / sign-off expert / seuil d'arrondi** (blockers MV A2/F4/F1/F2) → gâtent la **preuve e2e comptable** (aval), **pas** l'encodage/dry-run des SIG (le moteur se prouve en dry-run sur soldes fournis, comme EPIC-011).
- **Moteur générique** (`EvaluateurFormuleService`) : **aucune modification** — 111 le **consomme**, ne le change pas.

---

## Scope

**Dans le périmètre :**

- **Source référentiel** : `scripts/referentiels/sources/table-de-passage-syscohada.json` → ajout du tableau `operandes` sur les 9 lignes `poste ∈ {XA,XB,XC,XD,XE,XF,XG,XH,XI}` (`etat='COMPTE_RESULTAT'`, `regle='FORMULE'`), formules B8 §3 (`XC` corrigé). Ordre de déclaration **déjà** = ordre de cascade (`XB` avant `XC`, etc. — vérifié). **Aucune** ligne de détail modifiée.
- **Artefact + registre** : régénération via `build.mjs` (le passthrough `normOperandes` existe depuis 110) → `src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json` (nouvel octet) + **MAJ du `checksum`** `syscohada-revise@2.1` dans `ReferentielRegistry`. `sfd-bceao-1.0.json` et son checksum **inchangés**.
- **Câblage CR** : `CompteResultatProductionService` (060) injecte `EvaluateurFormuleService` (110) ; nouvelle étape en fin de `produire` : construit `ValeurPoste[]` depuis `produits`+`charges`, sélectionne les `FORMULE` du CR (ordre de déclaration), `evaluer(...)`, mappe `ResultatFormule[]` → `sig: PosteSig[]` (avec libellé du poste). Détail/totaux/résultat net **inchangés**.
- **Types & DTO** : nouveau `PosteSig` (`etat`, `poste`, `libelle`, `valeurN`, `valeurN1`) + champ `sig: PosteSig[]` sur `CompteResultatProduit` (`compte-resultat.types.ts`) ; champ `coherenceSig` (nouveau `CoherenceSig`) ; exposition dans `CompteResultatDto` (Swagger). Le `bilan-diagnostics.controller` mappe les nouveaux champs (endpoint `POST /bilan/etats/compte-resultat/dry-run` **inchangé** en contrat d'entrée).
- **Articulation `CJ=XI`** : calcul de `coherenceSig` (dans `produire` ou l'engine) + **renforcement** de `ControlesCoherenceProductionService.controleResultat` (063) pour asserter `XI=CJ` quand des SIG sont produits (additif, agnostique : sans SIG → comportement 063 inchangé).
- **Garde de cohérence** : `operandes-coherence.spec.ts` (110) charge désormais des opérandes **réelles** sur `syscohada-revise@2.1` (via le vrai `ReferentielLoader`, checksum vérifié) → doit **passer** (résolution des 9 SIG, cascade respectée, `signe`/`mode`/`etatSource` valides). Filet qui blinde l'encodage.

**Hors périmètre (hooks / stories suivantes — NE PAS déborder) :**

- Sous-totaux Bilan + `BZ=DZ` → **STORY-112** ; TFT + CAFG + statut par ligne → **STORY-113** ; notes v1 → **STORY-114**.
- **Toute modification de `EvaluateurFormuleService`** (moteur générique 110) : interdit. Si un besoin apparaît (ex. mode manquant), c'est un signal de mauvais cadrage — s'arrêter.
- **`sfd-bceao@1.0`** : aucun octet, aucun checksum, aucune opérande — sa non-modification **est** la preuve d'agnosticisme.
- Preuve e2e comptable / import réel (blockers MV) : aval.

---

## User Flow

*(Story moteur — « flux » = celui du cabinet via l'endpoint de diagnostic + celui du mainteneur de référentiel.)*

1. Le mainteneur déclare les `operandes` des SIG dans la source syscohada, régénère l'artefact (`build.mjs` imprime le nouveau sha256), reporte le checksum dans `ReferentielRegistry`.
2. La garde `operandes-coherence.spec.ts` vérifie en CI que chaque opérande SIG résout vers un poste connu du CR et que l'ordre de cascade est respecté — sinon échec **en CI** (jamais au runtime).
3. Un cabinet (org SYSCOHADA, entitlement `ACTIVE`) appelle `POST /bilan/etats/compte-resultat/dry-run` avec ses soldes N (+ N-1 optionnel).
4. `CompteResultatProductionService` agrège les postes détail (inchangé), **puis** `EvaluateurFormuleService` calcule `XA..XI` en cascade sur ces postes ; la réponse **200** porte désormais `sig[]` (9 SIG, N/N-1) **en plus** des `produits`/`charges`/`resultatNet` existants, et `coherenceSig` (`XI = résultat net = CJ`).
5. Une org **SFD-BCEAO** appelle le même endpoint → `sig: []`, `coherenceSig` non applicable, `COHERENCE_RESULTAT` conserve son sens `CR = CJ`. **Aucune structure OHADA n'a été codée dans le moteur.**

---

## Acceptance Criteria

- [ ] **Opérandes SIG encodées** : les 9 postes `FORMULE` du `COMPTE_RESULTAT` (`XA..XI`) portent leurs `operandes` (B8 §3) dans la source ; l'artefact `syscohada-revise-2.1.json` est régénéré et son **nouveau checksum** est reporté dans `ReferentielRegistry` (le chargement vérifie l'intégrité → un checksum non mis à jour ferait échouer tout chargement).
- [ ] **`XC` corrigé (correction A)** : `XC = +XB −RA −RB +TE +TF +TG +TH +TI −RC −RD −RE −RF −RG −RH −RI −RJ` (charges **soustraites**). Test numérique dédié : soldes `TA=1000, RA=600, TB=2000, RC=800` (reste 0) ⇒ `XC = 1600` (et **non** 2800). `XA` **absent** des opérandes de `XC` (pas de double-comptage).
- [ ] **Cascade CR complète** : sur un jeu de soldes de référence, `XA..XI` sont calculés dans l'ordre, une SIG amont réinjectée dans une SIG aval (`XC→XB`, `XD→XC`, `XE→XD`, `XG→XE,XF`, `XI→XG,XH`) ; `XI` = résultat net direct.
- [ ] **Câblage — sortie CR enrichie** : `POST /bilan/etats/compte-resultat/dry-run` renvoie **200** avec `sig[]` (9 SIG : `poste`, `libelle`, `valeurN`, `valeurN1`) **en plus** des champs existants ; colonne N-1 des SIG renseignée si `soldesN1` fourni, `null` sinon.
- [ ] **Non-régression des champs existants** : `produits`, `charges`, `totalProduitsN/N1`, `totalChargesN/N1`, `resultatNetN/N1`, `coherenceResultat`, `comptesNonMappes` **identiques** à EPIC-011 (STORY-060) sur les mêmes soldes.
- [ ] **Articulation `CJ = XI` (B8 §7)** : `coherenceSig` expose `resultatNetSig (XI)`, `resultatNetDirect (=CJ)`, `ecart`, `coherent` ; `ecart=0` par construction. Le contrôle `COHERENCE_RESULTAT` de la batterie 063 assert `XI=CJ` quand des SIG existent.
- [ ] **Agnosticisme P7** : une org **SFD-BCEAO** obtient `sig: []` et un `COHERENCE_RESULTAT` inchangé (`CR = CJ`) ; **aucun** code SYSCOHADA/OHADA ajouté au moteur ; `EvaluateurFormuleService` **non modifié**.
- [ ] **Garde de cohérence** : `operandes-coherence.spec.ts` charge `syscohada-revise@2.1` (vrai loader) et valide les 9 opérandes SIG (résolution + cascade + `signe`/`mode`/`etatSource`) → **0 violation**.
- [ ] **Bornage** : un cumul de SIG dépassant l'entier sûr propage `MontantHorsBornesError` → **400**, jamais 500 (patron 060/110).
- [ ] **Non-régression paquet** : `sfd-bceao@1.0` **byte-identique** (checksum inchangé) ; les autres états dry-run (`bilan`, `tft`, `notes-annexes`, `controles`) **inchangés** hormis le renforcement `COHERENCE_RESULTAT` (qui reste `OK` par construction).

---

## Technical Notes

### Composants

- **Étendu (source)** : `scripts/referentiels/sources/table-de-passage-syscohada.json` → `operandes` sur `XA..XI`. Format source (snake, comme le reste) : `{ "poste": "…", "signe": "+|-" }` (les SIG sont mono-état `COMPTE_RESULTAT` en mode `VALEUR` par défaut ⇒ ni `mode` ni `etat_source`). `build.mjs`/`normOperandes` (110) recopie tel quel (spread conditionnel **en dernier**).
- **Régénéré** : `src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json` + `ReferentielRegistry` (`syscohada-revise@2.1.checksum` ← nouveau sha256 imprimé par `build.mjs`).
- **Étendu (moteur, consommation)** : `src/modules/bilan/etats/compte-resultat-production.service.ts` → constructeur `+ EvaluateurFormuleService` ; `produire` calcule et joint `sig` + `coherenceSig`. `src/modules/bilan/etats/compte-resultat.types.ts` → `PosteSig`, `CoherenceSig`, `sig`/`coherenceSig` sur `CompteResultatProduit`. `src/modules/bilan/dto/compte-resultat-response.dto.ts` → `@ApiProperty` pour `sig`/`coherenceSig`. `src/modules/bilan/bilan-diagnostics.controller.ts` → mapping des nouveaux champs.
- **Étendu (contrôles)** : `src/modules/bilan/etats/controles-coherence-production.service.ts` → `controleResultat` assert `XI=CJ` si SIG présents (additif). Le `BilanEngineService.produireControlesCoherence` passe déjà le CR (qui porte désormais `sig`).
- **Réutilisés inchangés** : `EvaluateurFormuleService` (110, **aucune modification**), `ReferentielLoader`, `TableDePassageService`, `BilanProductionService` (059), `MontantHorsBornesError`.

### Opérandes SIG figées (B8 §3 — à encoder, `etat=COMPTE_RESULTAT`, mode `VALEUR`)

| SIG | Libellé | Opérandes |
|---|---|---|
| `XA` | Marge commerciale | `+TA −RA −RB` |
| `XB` | Chiffre d'affaires | `+TA +TB +TC +TD` |
| `XC` | Valeur ajoutée | `+XB −RA −RB +TE +TF +TG +TH +TI −RC −RD −RE −RF −RG −RH −RI −RJ` **(corrigé A)** |
| `XD` | Excédent brut d'exploitation | `+XC −RK` |
| `XE` | Résultat d'exploitation | `+XD +TJ −RL` |
| `XF` | Résultat financier | `+TK +TL +TM −RM −RN` |
| `XG` | Résultat des activités ordinaires | `+XE +XF` |
| `XH` | Résultat H.A.O. | `+TN +TO −RO −RP` |
| `XI` | **Résultat net** | `+XG +XH −RQ −RS` |

### Contrats (types)

```ts
// compte-resultat.types.ts (extension additive)
/** Un solde intermédiaire de gestion calculé (XA..XI), colonnes N / N-1. */
export interface PosteSig {
  etat: 'COMPTE_RESULTAT';
  poste: string;
  libelle: string;
  valeurN: number;
  valeurN1: number | null;
}

/** Articulation CJ=XI (B8 §7) : le résultat net SIG = résultat net direct (= CJ au passif). */
export interface CoherenceSig {
  resultatNetSig: number | null;   // XI (null si non produit)
  resultatNetDirect: number;       // resultatNetN (= CJ via 060)
  ecart: number | null;
  coherent: boolean;
}

// CompteResultatProduit : + sig: PosteSig[]; + coherenceSig: CoherenceSig;
```

### Algorithme (dans `CompteResultatProductionService.produire`, après émission des postes détail)

1. **Contexte** : `ValeurPoste[]` = pour chaque poste de `produits`+`charges`, `{ etat:'COMPTE_RESULTAT', poste, valeurN: montantN, valeurN1: montantN1 }`. (Magnitude positive — décision n°0 ; les signes vivent dans les opérandes.)
2. **Formules** : `pkg.tableDePassage.filter(r => r.etat==='COMPTE_RESULTAT' && r.regle==='FORMULE')`, **dans l'ordre du paquet** (= cascade — garanti par la garde de cohérence).
3. **`evaluer(formules, valeurs)`** (110) → `ResultatFormule[]` ; map → `PosteSig[]` en reprenant le `libelle` de la `MappingRule` (ou du `PosteEtat`). `valeurN1` non pertinent en l'absence de N-1 → `null` (mode `VALEUR` bi-colonne géré par 110).
4. **`coherenceSig`** : trouve `XI` dans `sig` ; `ecart = (XI.valeurN ?? null) − resultatNetN` ; `coherent = ecart===0`. Sans SIG (SFD) → `resultatNetSig=null, ecart=null, coherent=true` (non applicable, ne casse pas la validabilité).
5. **Pureté** : aucune constante de poste OHADA dans le service (il lit les codes depuis le paquet) ; bornage hérité de l'évaluateur (`MontantHorsBornesError`).

### Vérification numérique (correction A — `XC`)

Soldes `TA=1000, RA=600, TB=2000, RC=800`, reste 0 (magnitude positive) :
`XB = 1000+2000 = 3000` ; `XC = 3000 − 600 − 0 + 0 − 800 = 1600` ✓ (VA = marge 400 + production vendue 2000 − conso 800). Forme fiche `+RA` aurait donné `2800` ✗.

### Sécurité / robustesse

- Story **sans écriture base ni endpoint neuf** (l'endpoint dry-run 060 existe, contrat d'entrée inchangé) ⇒ **pas de transaction Mongo**, surface d'attaque inchangée. Les guards (`@RequiresBilanAccess` + rôles) restent en amont.
- Anti-500 : `MontantHorsBornesError` (bornage) et `OperandeNonResolueError` (paquet incohérent) sont **typés** ; un paquet incohérent est un défaut de **build/CI** (garde), pas une entrée utilisateur.

### Edge cases

- **N-1 absent** : SIG calculés en N, colonne N-1 = `null` (mode `VALEUR`, 110). `coherenceSig` porte sur N.
- **Poste détail absent en N** (montant nul) : contribue `0` à la SIG (pas d'erreur).
- **SFD-BCEAO / tout `FORMULE` non encodé** : `sig: []`, `coherenceSig` non applicable, `COHERENCE_RESULTAT` = `CR = CJ`.
- **Référence en avant / poste inconnu** (ne devrait pas arriver, ordre déjà cascade) : détecté par `operandes-coherence.spec.ts` (CI) et par `OperandeNonResolueError` à l'évaluation.

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** **STORY-110** (socle B8 §2 : `operandes?` + `EvaluateurFormuleService` + passthrough `build.mjs` + garde — 1ᵉʳ consommateur = cette story), **STORY-060** (CR détail en magnitude positive + `CoherenceResultat`), **STORY-063** (batterie `COHERENCE_RESULTAT`), **STORY-056/038** (`ReferentielRegistry`, `build.mjs`, sources). **Décision n°0** ✅ tranchée MV 2026-07-20.

**Stories débloquées / suivantes :** **STORY-112** (sous-totaux Bilan, `BZ=DZ` — même patron : encoder + brancher), **STORY-113** (TFT + CAFG — exerce `VARIATION`/`VALEUR_N_1`/`etatSource`), **STORY-114** (notes v1). 111 **prouve le patron d'encodage** (source → build → checksum → câblage → articulation) que 112/113/114 rejouent.

**Dépendances externes :** aucune (référentiels embarqués, aucun appel réseau).

**Blockers MV (n'affectent PAS 111) :** format balance A2, jeu d'essai F4, sign-off expert F1, seuil arrondi F2 — ils gâtent la **preuve e2e comptable** (aval), pas l'encodage/dry-run des SIG.

---

## Definition of Done

- [ ] Code implémenté (français) ; **aucune formule ni structure OHADA en dur** (P7) — les SIG sont **données** du paquet ; `EvaluateurFormuleService` (110) **non modifié** ; champs `sig`/`coherenceSig` **additifs**.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (nouveau code CR/contrôles visé ~100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : cascade `XA..XI` sur soldes de référence ; **vérif numérique `XC` corrigé** (1600, pas 2800) ; `XI = résultat net direct` ; SIG N-1 (avec/sans `soldesN1`) ; **SFD → `sig: []`** (agnosticisme) ; bornage → `MontantHorsBornesError`. `operandes-coherence.spec.ts` **verte** avec les 9 SIG réelles chargées via le vrai loader.
- [ ] Tests **de non-régression** : `CompteResultatProductionService` (060) — champs détail/totaux/résultat net **inchangés** ; suites 059/061/062/063 vertes ; **`sfd-bceao@1.0` byte-identique** (checksum inchangé) ; `syscohada-revise@2.1` régénéré = **exactement** l'octet attendu (test `referentiel-stamp`/`referentiel-registry` avec le nouveau checksum).
- [ ] **Vérification docker réelle** (la story n'écrit pas en base ⇒ preuve = chargement référentiel + sortie CR sur stack vivante) : `docker compose up --build` → 8 services `/health` **200** ; login org SYSCOHADA (entitlement `ACTIVE`) → `POST /bilan/etats/compte-resultat/dry-run` sur un jeu de soldes → **200** avec `sig[]` (9 SIG, valeurs cohérentes, `XC` vérifié) + `coherenceSig.coherent=true` (`XI=CJ`) ; champs détail **identiques** à EPIC-011 (cross-check) ; org **SFD** → `sig: []` ; checksum `syscohada-revise@2.1` chargé = nouveau, `sfd-bceao@1.0` = inchangé. Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Encodage des 9 opérandes SIG (source, `XC` corrigé) + régénération artefact + MAJ checksum registre :** 1.5 point
- **Câblage `EvaluateurFormuleService` dans le CR (`ValeurPoste[]`, sélection `FORMULE`, `PosteSig`, DTO/controller) :** 1.5 point
- **Articulation `CJ=XI` (`coherenceSig` + renforcement `COHERENCE_RESULTAT`) :** 1 point
- **Tests (unit numériques + agnosticisme SFD + garde réelle + non-régression byte) + vérif docker :** 1 point
- **Total :** 5 points

**Rationale :** une seule règle comptable réelle est en jeu (la **correction A** de `XC`, déjà figée et vérifiée numériquement par B8) — le risque « deviner une règle OHADA » est **nul**. L'effort tient au **1ᵉʳ câblage** de l'évaluateur (projection contexte, ordre de cascade, enrichissement DTO) et à la **non-régression byte** de l'artefact (changement de checksum maîtrisé). 111 fixe le **patron** que 112/113/114 rejoueront.

---

## Additional Notes

- **1ᵉʳ consommateur de l'évaluateur 110.** Après 111, transformer un agrégat de squelette en poste calculé = **encoder des `operandes` dans la source + projeter le contexte + brancher `evaluer`** — jamais toucher au moteur générique.
- **Parallèle 061→110→111** : 061 a livré `tresorerie?` (donnée) puis 110 `operandes?`+évaluateur (mécanisme) ; 111 est la 1ʳᵉ **consommation réelle** — la boucle « donnée → mécanisme → consommation » est bouclée sur le CR.
- **Checksum : c'est ici qu'il bouge.** STORY-110 était volontairement **checksum-neutre** (0 opérande) ; STORY-111 encode la **1ʳᵉ opérande réelle** → `syscohada-revise@2.1` change d'octet. `sfd-bceao@1.0` ne bouge jamais (agnosticisme).
- **`COHERENCE_RESULTAT` devient portant** : sur un squelette, `CR=CJ` était vrai par construction ; avec les SIG, `XI=CJ` prouve en plus que la **cascade** reproduit le résultat direct — le contrôle a désormais un vrai contenu (B8 §7).

---

## Progress Tracking

**Status History :**
- 2026-07-20 : Créée (Scrum Master) — **2ᵉ story d'EPIC-011B**, B8 §3. Cadrée « encoder + brancher, jamais modifier le moteur » : opérandes SIG `XA..XI` (`XC` corrigé A) dans la source syscohada → régénération artefact + MAJ checksum ; câblage `EvaluateurFormuleService` (110) dans `CompteResultatProductionService` (060) → champ `sig[]` ; articulation `CJ=XI` (`coherenceSig` + renforcement `COHERENCE_RESULTAT`). `sfd-bceao@1.0` inchangé (agnosticisme P7). 1ᵉʳ consommateur de l'évaluateur ; fixe le patron pour 112/113/114.
- 2026-07-20 : Implémentée + vérifiée docker bout-en-bout (branche MNV-111 bilan-service). 1ᵉʳ consommateur réel de l'évaluateur 110 branché.

**Implémentation (dev-story, 2026-07-20) :**
- **Encodage source** : les 9 postes `FORMULE` du `COMPTE_RESULTAT` (`XA..XI`) reçoivent leurs `operandes` (B8 §3) dans `scripts/referentiels/sources/table-de-passage-syscohada.json` (`XC` corrigé A : `+XB −RA −RB +TE..TI −RC..RJ` — charges soustraites). `node scripts/referentiels/build.mjs` régénère l'artefact : `syscohada-revise-2.1.json` sha256 `cb8a7e11… → 6e35de56…` (1ʳᵉ opérande réelle), reporté dans `ReferentielRegistry` ; `sfd-bceao-1.0.json` **byte-identique** (`0509a034…`, aucune opérande → agnosticisme P7).
- **Câblage CR** : `CompteResultatProductionService` (060) injecte `EvaluateurFormuleService` (110). Nouvelle étape `produireSig` : **sème à 0 tous les postes de détail du CR** (une opérande `+TA` peut viser un poste absent d'une balance creuse → sinon `OperandeNonResolueError`), superpose les valeurs agrégées (magnitude positive), sélectionne les `FORMULE` du CR **dans l'ordre du paquet** (= cascade), `evaluer(...)` → `sig: PosteSig[]` (libellé repris des postes GUIDEF `pkg.postes`). Détail/totaux/résultat net **inchangés**. Le **moteur générique 110 n'est PAS modifié**.
- **Articulation `CJ=XI`** : `coherenceSig` (SIG terminal = dernier de la cascade vs `resultatNetN` direct = `CJ` via 060). `ControlesCoherenceProductionService.controleResultat` (063) **renforcé** (5ᵉ arg additif `coherenceSig?`) : assert `XI=CJ` si SIG produits ; sans SIG (SFD) → sens `CR=CJ` conservé. `BilanEngineService.produireControlesCoherence` passe `cr.coherenceSig`.
- **Types/DTO** : `PosteSig`, `CoherenceSig`, champs `sig`/`coherenceSig` sur `CompteResultatProduit` ; `@ApiProperty` sur `CompteResultatDto` (le controller propage par spread `...compteResultat`).
- **Qualité** : lint **0 warning** · `npm run build` OK · **333 unit (38 suites) verts** · `compte-resultat-production.service.ts` 100/96.4/100/100, `controles-coherence-production.service.ts` 100/96.9/100/100, `evaluateur-formule.service.ts` **100 %** · global **98.26/93.27/98.2/98.1** > seuils 65/90/90/90 · **71 e2e (10 suites) verts** (modules e2e complétés du provider `EvaluateurFormuleService`). Garde `operandes-coherence.spec.ts` (110) **verte avec les 9 SIG réelles** chargées via le vrai `ReferentielLoader` (checksum vérifié).

**Vérification docker (stack vivante, bilan-service redémarré → chargement référentiel frais)** :
- `/health` bilan-service **200** (`mongodb:up, kafka:up`). Flux réel register→verify(Mailhog)→login (JWT RS256 `emailVerified:true`, `aud` incl. `bilan-service`) ; read-models semés en base (`orgkycstatuses` APPROVED + `orgbilanentitlements` ACTIVE, référentiel `syscohada-revise@2.1`).
- **SYSCOHADA** `POST /bilan/etats/compte-resultat/dry-run` (TA=1000, RA=600, TB=2000, RC=800) → **200** ; `stamp.checksum = 6e35de56…` (**nouvel** artefact chargé, intégrité vérifiée) ; `sig` = **9 SIG** : XA=400, XB=3000, **XC=1600** (correction A prouvée sur stack — vaudrait 2800 avec `+RA`), XD=1600, XE=1600, XF=0, XG=1600, XH=0, **XI=1600** ; `resultatNetN=1600` = `XI` ; `coherenceSig={resultatNetSig:1600, resultatNetDirect:1600, ecart:0, coherent:true}` (**CJ=XI**).
- **SFD-BCEAO** (entitlement re-pointé) même endpoint → **200** ; `stamp.checksum = 0509a034…` (**inchangé**) ; `sig: []` ; `coherenceSig` non applicable (`resultatNetSig:null, coherent:true`) — **agnosticisme P7 prouvé**.
- **Contrôles** `POST /bilan/etats/controles/dry-run` (SYSCOHADA) → **200** ; `COHERENCE_RESULTAT` = « Cohérence du résultat (CR = résultat au passif = XI) », statut **OK**, ecart 0 (contrôle **renforcé portant**). *(`valide:false` attendu : le vecteur ne contient que des comptes de CR → `EQUILIBRE_BILAN` en anomalie, sans rapport avec 111.)*
- **Non-régression surface** : `POST …/compte-resultat/dry-run` **sans jeton → 401** (chaîne de guards intacte).

**Effort réel :** 5 points (conforme).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
