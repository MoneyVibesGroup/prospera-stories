# STORY-112 : Sous-totaux du Bilan (`AZ,BG,BK,BT,BZ` / `CP,DD,DF,DP,DT,DZ`) en opérandes + placement du résultat en `CJ` + contrôle d'équilibre `BZ = DZ` portant — FR-009 (complet) — B8 §4

**Epic :** EPIC-011B — États financiers : calcul complet de la liasse (opérandes SIG / sous-totaux / TFT / notes, tech-spec B8) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. tech-spec :** `docs/tech-spec-bilan-b8-2026-07-20.md` **§4** (Bilan — sous-totaux, opérandes ; 11 postes, validation D3 **sans correction**) + **§1** (décision n°0 — magnitude positive + opérandes signées, ✅ tranchée MV 2026-07-20) + note **D1/D2** (résultat net → poste **unique** `CJ` ; report antérieur → `CH`) + **§7** (contrôle `EQUILIBRE_BILAN : BZ = DZ`, bloquant) + **§9** (traçabilité : §4 = STORY-112, FR-009)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-009 (Bilan actif/passif + **contrôle d'équilibre** AC-2) + §FR-013 (contrôles d'articulation)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de structure OHADA codée en dur) ; CLAUDE.md §Definition of Done, §« ne devine jamais une API »
**Réf. code livré :** **STORY-110** (socle B8 §2 : `Operande` + `MappingRule.operandes?` + **`EvaluateurFormuleService`** `Σ signe × valeur`, cascade ordonnée, résolution d'état `op.etatSource ?? formule.etat`, `additionSure`/`MontantHorsBornesError`, `OperandeNonResolueError` ; passthrough `build.mjs` (`normOperandes`, spread conditionnel **en dernier**) ; garde `operandes-coherence.spec.ts`) · **STORY-111** (**patron d'encodage+câblage** livré sur le CR : `sig[]` + `coherenceSig` + renforcement `COHERENCE_RESULTAT`) · **STORY-059** (`BilanProductionService` — postes actif Brut/Amort/Net + passif Montant en magnitude positive ; `ControleEquilibre` `actif = passif + résultat`) · **STORY-063** (`ControlesCoherenceProductionService` — `EQUILIBRE_BILAN` bloquant) · **STORY-056/038** (`ReferentielRegistry`, `build.mjs`, sources `table-de-passage-syscohada.json`)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + `/code-review` OK + intégrée dans `dev` le 2026-07-20 — PR #17 bilan-service, MNV-112 « Rebase and merge », HEAD 99008bb ; débloque STORY-113/114)
**Assigné à :** vivian
**Créée :** 2026-07-20
**Sprint :** 13

---

## User Story

**En tant que** cabinet comptable produisant sa liasse OHADA dans `bilan-service`,
**je veux** que les **sous-totaux du Bilan** (`AZ` Total actif immobilisé → `BZ` Total général actif ; `CP` Total capitaux propres → `DZ` Total général passif) soient **réellement calculés** — chacun comme `Σ signe × valeur` de ses postes de détail et des sous-totaux amont — et que le moteur **prouve l'équilibre** de mon Bilan par la stricte égalité `BZ = DZ`,
**afin que** mon Bilan ne s'arrête plus au squelette (sous-totaux vides) mais restitue la **cascade complète** actif/passif, sans qu'aucune structure OHADA ne soit codée dans le moteur (elle est **donnée** du paquet `syscohada-revise@2.1` ; SFD-BCEAO, dont les états n'ont pas cette structure de sous-totaux, reste agnostique et inchangé — **invariant P7**).

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

**STORY-110 a livré le socle B8 §2** (`operandes?` + `EvaluateurFormuleService` générique + passthrough `build.mjs`) et **STORY-111 a livré le patron de consommation** sur le **Compte de résultat** : encoder des `operandes` dans la source → régénérer l'artefact (checksum) → brancher l'évaluateur dans le service de production → exposer le résultat + une **articulation** (`coherenceSig`, `XI=CJ`). **STORY-112 rejoue ce patron, à l'identique, sur le Bilan** (état `BILAN`). Elle ne touche **jamais** au moteur générique 110.

Aujourd'hui, les 11 sous-totaux du Bilan (`AZ, BG, BK, BT, BZ` à l'actif ; `CP, DD, DF, DP, DT, DZ` au passif) sont des postes `etat='BILAN'`, `type='total'`, `regle='FORMULE'` **sans opérande** : `BilanProductionService` les **ignore** (`choisirRattachement` filtre `type!=='total'`), le Bilan s'arrête aux postes de détail (actif Brut/Amort/Net, passif Montant) + au contrôle d'équilibre `actif = passif + résultat`.

### Deux spécificités du Bilan (que le CR n'avait pas — à traiter, sans dévier du patron)

1. **Contexte d'évaluation « aplati » sur l'état `BILAN`.** Les sous-totaux sont déclarés `etat='BILAN'`, mais leurs opérandes visent des postes de détail vivant en `BILAN_ACTIF` (`AD, AI, BH, BU`…) **et** `BILAN_PASSIF` (`CA, CJ, DV`…). L'évaluateur résout un opérande via `op.etatSource ?? formule.etat` (= `'BILAN'`). Le câblage **projette donc actif et passif dans un unique espace `BILAN`** : chaque poste d'actif y apporte son `netN`/`netN1`, chaque poste de passif son `montantN`/`montantN1` — clé `BILAN:<code>`. Les codes actif (`A*`/`B*`) et passif (`C*`/`D*`) sont **disjoints** ⇒ aucune collision. C'est **exactement** pourquoi la source déclare les sous-totaux en `etat='BILAN'` (et non `_ACTIF`/`_PASSIF`) : l'aplatissement est **voulu par le référentiel**, pas une astuce du moteur.

2. **Placement du résultat en `CJ` (D1/D2, MV-validé) — condition de `BZ = DZ`.** Sur une balance **avant solde des comptes de gestion**, le résultat net vit dans les classes 6/7 (`agg.resultatNet`, porté **séparément** par 059, jamais dans un poste de passif). Or `DZ = +DF +DP +DT +DV` avec `DF = CP + DD` et `CP = … +CJ +…` : pour que `DZ` **absorbe** le résultat et que `BZ = DZ` tienne, le résultat net doit être **placé dans le poste de résultat du Bilan** (`CJ` en SYSCOHADA). C'est la note **D1/D2** de B8 §4 (« résultat net → poste **unique** `CJ` »), validée par MV. **Ce placement est le pendant Bilan de l'articulation `XI=CJ`** que STORY-111 a ajoutée au CR : là où 111 a **prouvé** que la cascade des SIG reproduit le résultat direct, 112 **place** ce même résultat au passif pour fermer l'équilibre `BZ = DZ`.

> **Agnosticisme du placement (P7).** Le poste receveur du résultat est **déclaré par le paquet** (marqueur additif sur la `MappingRule` de `CJ`, sur le **patron du champ `tresorerie?`** de STORY-061 — donnée sourcée, jamais un code en dur). SFD-BCEAO **ne le déclare pas** (pas de section sous-totaux de ce type) → **aucun** placement, **aucun** sous-total : même code, résultat agnostique. Le placement n'altère **ni** l'agrégation brute **ni** le `ControleEquilibre` `actif = passif + résultat` de 059 (inchangé, reste le contrôle faillible primaire) : il ne vit **que** dans le contexte d'évaluation des sous-totaux.

### Décision n°0 câblée — magnitude positive + opérandes signées

Les postes de détail du Bilan sont émis par STORY-059 en **magnitude positive** (actif `netN = brut − amort ≥ 0` normalement ; passif `montantN = Σ(crédit − débit) ≥ 0`). Les 11 sous-totaux de B8 §4 sont **tous additifs** (`signe:'+'`) — validation D3 **sans aucune correction** (contrairement au CR où `XC` exigeait la correction A). Le risque « deviner une règle OHADA » est donc **nul** : les compositions sont recopiées telles quelles.

### Ce que 112 livre

1. **Opérandes sous-totaux encodées (source + artefact régénéré).** Les 11 postes `FORMULE` de l'état `BILAN` (`AZ,BG,BK,BT,BZ,CP,DD,DF,DP,DT,DZ`) reçoivent leurs `operandes` (B8 §4) dans `scripts/referentiels/sources/table-de-passage-syscohada.json`. `node scripts/referentiels/build.mjs` régénère `syscohada-revise-2.1.json` → **nouveau sha256** (2ᵉ jeu d'opérandes réel après 111) reporté dans `ReferentielRegistry`. `sfd-bceao@1.0` **byte-identique** (aucun sous-total → aucune opérande) : agnosticisme P7.
2. **Marqueur de placement du résultat.** La `MappingRule` du poste de résultat (`CJ`) reçoit un marqueur additif (patron `tresorerie?`) déclarant qu'elle **accueille le résultat net**. Encodé dans la source, recopié par `build.mjs` (comme `normOperandes`/`tresorerie`).
3. **Câblage de l'évaluateur dans le Bilan.** `BilanProductionService` (059) injecte `EvaluateurFormuleService` (110), construit le **contexte aplati `BILAN`** (actif nets + passif montants + **résultat placé en `CJ`**), sélectionne les `MappingRule` `FORMULE` `etat='BILAN'` **dans l'ordre du paquet** (= cascade), appelle `evaluer(...)` et expose les résultats en nouveau champ `sousTotaux: PosteSousTotal[]` sur `BilanProduit`. Postes détail actif/passif + `controle` (059) **inchangés** (non-régression stricte).
4. **Articulation `BZ = DZ` + reproduction (`coherenceSousTotaux`).** Nouveau contrôle : `BZ` (grand total actif calculé) et `DZ` (grand total passif calculé) doivent (a) **reproduire** les totaux directs de 059 (`BZ = totalActifNet` ; `DZ = totalPassif + résultat`) — filet anti-erreur d'encodage, écart `0` par construction — et (b) **s'égaler** (`BZ = DZ`, l'équilibre). Le contrôle `EQUILIBRE_BILAN` de la batterie 063 est **renforcé** : lorsqu'un référentiel produit des sous-totaux, il assert **aussi** `BZ = DZ` (additif ; un référentiel sans sous-totaux — SFD — conserve le sens `actif = passif + résultat` actuel).

### Ce que 112 ne fait PAS (frontière nette)

- **SIG du CR** (`XA..XI`, `CJ=XI`) → **déjà livré STORY-111**. 112 ne touche **que** l'état `BILAN`.
- **TFT / CAFG** (`FA..ZH`, modes `VARIATION`/`VALEUR_N_1`, `etatSource` **inter-états**, statut par ligne) → **STORY-113** (B8 §5). 112 n'exerce **que** le mode `VALEUR` mono-état (espace `BILAN` aplati). Le placement du résultat ici est une **injection de contexte** (pas un opérande `etatSource` — ce dernier reste 113).
- **Notes annexes v1** → **STORY-114** (B8 §6).
- **Report antérieur → `CH`** (D2) : `CH` est un poste de **détail** `SOLDE_CREDITEUR` **déjà** alimenté par la table de passage (comptes 11x) — **rien à faire** ici (rappelé pour mémoire).
- **Convention miroir amortissements `28xx/29xx`** (D non concerné par les sous-totaux) : hors périmètre (déjà géré/différé côté 059).
- **Import balance réel / jeu d'essai comptable / sign-off expert / seuil d'arrondi** (blockers MV A2/F4/F1/F2) → gâtent la **preuve e2e comptable** (aval), **pas** l'encodage/dry-run des sous-totaux (le moteur se prouve en dry-run sur soldes fournis, comme EPIC-011 et comme 111).
- **Moteur générique** (`EvaluateurFormuleService`) : **aucune modification** — 112 le **consomme**, ne le change pas.

---

## Scope

**Dans le périmètre :**

- **Source référentiel** : `scripts/referentiels/sources/table-de-passage-syscohada.json` → (a) ajout du tableau `operandes` sur les 11 lignes `poste ∈ {AZ,BG,BK,BT,BZ,CP,DD,DF,DP,DT,DZ}` (`etat='BILAN'`, `regle='FORMULE'`), compositions B8 §4 (toutes `signe:'+'`) ; (b) marqueur de **placement du résultat** sur la ligne `CJ` (`etat='BILAN_PASSIF'`). Ordre de déclaration **déjà** = ordre de cascade (`AZ,BG,BK,BT` avant `BZ` ; `CP,DD` avant `DF` ; `DF,DP,DT` avant `DZ` — **à vérifier/rétablir** dans la source). **Aucune** ligne de détail modifiée.
- **Artefact + registre** : régénération via `build.mjs` (`normOperandes` + recopie du marqueur — passthrough à ajouter au niveau du marqueur de placement, sur le patron `tresorerie`) → `src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json` (nouvel octet) + **MAJ du `checksum`** `syscohada-revise@2.1` dans `ReferentielRegistry`. `sfd-bceao-1.0.json` et son checksum **inchangés**.
- **Contrat référentiel** : champ additif sur `MappingRule` pour le marqueur de placement du résultat (ex. `roleResultatBilan?: true`, patron `tresorerie?`) dans `referentiel-package.interface.ts` — **additif**, ignoré partout ailleurs.
- **Câblage Bilan** : `BilanProductionService` (059) injecte `EvaluateurFormuleService` (110) ; nouvelle étape en fin de `produire` : construit le **contexte `BILAN` aplati** (seed à 0 de tous les détails `BILAN_ACTIF`/`BILAN_PASSIF`, overlay actif `netN`/`netN1` + passif `montantN`/`montantN1`, **injection de `agg.resultatNet` dans le poste marqué**), sélectionne les `FORMULE` `etat='BILAN'` (ordre de déclaration), `evaluer(...)`, mappe `ResultatFormule[]` → `sousTotaux: PosteSousTotal[]` (libellé du poste). Détail actif/passif + `controle` **inchangés**.
- **Types & DTO** : nouveau `PosteSousTotal` (`etat:'BILAN'`, `poste`, `libelle`, `valeurN`, `valeurN1`) + champ `sousTotaux: PosteSousTotal[]` sur `BilanProduit` (`bilan.types.ts`) ; champ `coherenceSousTotaux` (nouveau `CoherenceSousTotaux` : `bz`, `dz`, `totalActifDirect`, `totalPassifResultatDirect`, `ecartEquilibre`, `equilibre`, `coherent`) ; exposition dans `BilanResponseDto` (Swagger). Le `bilan-diagnostics.controller` mappe les nouveaux champs (endpoint `POST /bilan/etats/bilan/dry-run` **inchangé** en contrat d'entrée).
- **Articulation `BZ=DZ`** : calcul de `coherenceSousTotaux` (dans `produire` ou l'engine) + **renforcement** de `ControlesCoherenceProductionService.controleEquilibre` (063) pour asserter `BZ=DZ` quand des sous-totaux sont produits (additif, agnostique : sans sous-total → comportement 063 inchangé). `BilanEngineService.produireControlesCoherence` passe déjà le `bilan` (qui porte désormais `sousTotaux` + `coherenceSousTotaux`).
- **Garde de cohérence** : `operandes-coherence.spec.ts` (110) charge désormais **aussi** les opérandes des 11 sous-totaux sur `syscohada-revise@2.1` (via le vrai `ReferentielLoader`, checksum vérifié) → doit **passer** (résolution des opérandes dans l'espace `BILAN`, cascade respectée, `signe`/`mode` valides). Filet qui blinde l'encodage.

**Hors périmètre (hooks / stories suivantes — NE PAS déborder) :**

- SIG du CR → **déjà STORY-111** ; TFT + CAFG + statut par ligne → **STORY-113** ; notes v1 → **STORY-114**.
- **Toute modification de `EvaluateurFormuleService`** (moteur générique 110) : interdit. Si un besoin apparaît (ex. l'espace `BILAN` aplati exige un mode absent), c'est un signal de mauvais cadrage — s'arrêter et re-cadrer (le contexte aplati est justement conçu pour **rester** en mode `VALEUR` mono-état).
- **`sfd-bceao@1.0`** : aucun octet, aucun checksum, aucune opérande, aucun marqueur — sa non-modification **est** la preuve d'agnosticisme.
- Preuve e2e comptable / import réel / seuil d'arrondi (blockers MV) : aval.

---

## User Flow

*(Story moteur — « flux » = celui du cabinet via l'endpoint de diagnostic + celui du mainteneur de référentiel.)*

1. Le mainteneur déclare les `operandes` des 11 sous-totaux **et** le marqueur de placement du résultat sur `CJ` dans la source syscohada, régénère l'artefact (`build.mjs` imprime le nouveau sha256), reporte le checksum dans `ReferentielRegistry`.
2. La garde `operandes-coherence.spec.ts` vérifie en CI que chaque opérande de sous-total résout vers un poste connu de l'espace `BILAN` et que l'ordre de cascade est respecté — sinon échec **en CI** (jamais au runtime).
3. Un cabinet (org SYSCOHADA, entitlement `ACTIVE`) appelle `POST /bilan/etats/bilan/dry-run` avec ses soldes N (+ N-1 optionnel).
4. `BilanProductionService` agrège les postes détail (inchangé), **puis** `EvaluateurFormuleService` calcule `AZ..DZ` en cascade sur le contexte aplati (actif nets + passif montants + résultat placé en `CJ`) ; la réponse **200** porte désormais `sousTotaux[]` (11 sous-totaux, N/N-1) **en plus** des `actif`/`passif`/`controle` existants, et `coherenceSousTotaux` (`BZ = DZ` = équilibre).
5. Une org **SFD-BCEAO** appelle le même endpoint → `sousTotaux: []`, `coherenceSousTotaux` non applicable, `EQUILIBRE_BILAN` conserve son sens `actif = passif + résultat`. **Aucune structure OHADA n'a été codée dans le moteur.**

---

## Acceptance Criteria

- [ ] **Opérandes sous-totaux encodées** : les 11 postes `FORMULE` de l'état `BILAN` (`AZ,BG,BK,BT,BZ,CP,DD,DF,DP,DT,DZ`) portent leurs `operandes` (B8 §4, toutes `signe:'+'`) dans la source ; l'artefact `syscohada-revise-2.1.json` est régénéré et son **nouveau checksum** est reporté dans `ReferentielRegistry` (le chargement vérifie l'intégrité → un checksum non mis à jour ferait échouer tout chargement).
- [ ] **Placement du résultat en `CJ`** : la `MappingRule` de `CJ` porte le marqueur de placement ; `BilanProductionService` **injecte `agg.resultatNet`** dans le contexte d'évaluation à la clé `BILAN:CJ` (additionné à un éventuel montant `CJ` issu de la balance) — **sans** modifier l'agrégation brute ni le `controle` de 059.
- [ ] **Cascade Bilan complète** : sur un jeu de soldes de référence, `AZ..DZ` sont calculés dans l'ordre, un sous-total amont réinjecté dans un sous-total aval (`AZ,BK,BT→BZ` ; `CP,DD→DF` ; `DF,DP,DT→DZ`) ; `BZ = totalActifNet`, `DZ = totalPassif + résultat`.
- [ ] **Équilibre `BZ = DZ` (B8 §7)** : sur une balance équilibrée, `coherenceSousTotaux.bz === coherenceSousTotaux.dz` (`ecartEquilibre = 0`, `equilibre = true`). Test dédié : balance **déséquilibrée** ⇒ `equilibre = false` et `EQUILIBRE_BILAN` = `ANOMALIE` (le contrôle reste faillible et **portant**).
- [ ] **Câblage — sortie Bilan enrichie** : `POST /bilan/etats/bilan/dry-run` renvoie **200** avec `sousTotaux[]` (11 sous-totaux : `poste`, `libelle`, `valeurN`, `valeurN1`) **en plus** des champs existants ; colonne N-1 des sous-totaux renseignée si `soldesN1` fourni, `null` sinon.
- [ ] **Non-régression des champs existants** : `actif[]`, `passif[]`, `controle` (`totalActifN/N1`, `totalPassifN/N1`, `resultatNetN/N1`, `ecartN/N1`, `equilibreN/N1`), `comptesNonMappes` **identiques** à EPIC-011 (STORY-059) sur les mêmes soldes.
- [ ] **Reproduction (`coherenceSousTotaux`)** : `bz` reproduit `totalActifNet` **direct** et `dz` reproduit `totalPassif + résultat` **direct** (écart `0` par construction) — filet qui détecte un opérande manquant/erroné (ex. un poste d'actif oublié dans `BZ`).
- [ ] **Agnosticisme P7** : une org **SFD-BCEAO** obtient `sousTotaux: []` et un `EQUILIBRE_BILAN` inchangé (`actif = passif + résultat`) ; **aucun** code SYSCOHADA/OHADA ajouté au moteur ; `EvaluateurFormuleService` **non modifié** ; aucun marqueur de placement déclaré côté SFD.
- [ ] **Garde de cohérence** : `operandes-coherence.spec.ts` charge `syscohada-revise@2.1` (vrai loader) et valide les 11 opérandes de sous-totaux (résolution dans l'espace `BILAN` + cascade + `signe`) → **0 violation**.
- [ ] **Bornage** : un cumul de sous-total dépassant l'entier sûr propage `MontantHorsBornesError` → **400**, jamais 500 (patron 059/110/111).
- [ ] **Non-régression paquet** : `sfd-bceao@1.0` **byte-identique** (checksum inchangé) ; les autres états dry-run (`compte-resultat`, `tft`, `notes-annexes`, `controles`) **inchangés** hormis le renforcement `EQUILIBRE_BILAN` (qui reste `OK` par construction sur balance équilibrée).

---

## Technical Notes

### Composants

- **Étendu (source)** : `scripts/referentiels/sources/table-de-passage-syscohada.json` → `operandes` sur `AZ..DZ` + marqueur de placement sur `CJ`. Format source (snake, comme le reste) : `{ "poste": "…", "signe": "+" }` (les sous-totaux sont mono-espace `BILAN` en mode `VALEUR` par défaut ⇒ ni `mode` ni `etat_source`) ; marqueur ex. `"role_resultat_bilan": true`. `build.mjs`/`normOperandes` (110) recopie les opérandes ; **ajouter le passthrough du marqueur** (spread conditionnel, patron `tresorerie`).
- **Régénéré** : `src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json` + `ReferentielRegistry` (`syscohada-revise@2.1.checksum` ← nouveau sha256 imprimé par `build.mjs`).
- **Étendu (contrat)** : `src/modules/bilan/referentiel/referentiel-package.interface.ts` → `MappingRule.roleResultatBilan?: boolean` (**additif**, patron `tresorerie?`).
- **Étendu (moteur, consommation)** : `src/modules/bilan/etats/bilan-production.service.ts` → constructeur `+ EvaluateurFormuleService` ; `produire` calcule et joint `sousTotaux` + `coherenceSousTotaux`. `src/modules/bilan/etats/bilan.types.ts` → `PosteSousTotal`, `CoherenceSousTotaux`, `sousTotaux`/`coherenceSousTotaux` sur `BilanProduit`. `src/modules/bilan/dto/bilan-response.dto.ts` → `@ApiProperty` pour `sousTotaux`/`coherenceSousTotaux`. `src/modules/bilan/bilan-diagnostics.controller.ts` → mapping des nouveaux champs.
- **Étendu (contrôles)** : `src/modules/bilan/etats/controles-coherence-production.service.ts` → `controleEquilibre` assert `BZ=DZ` si sous-totaux présents (additif). Le `BilanEngineService.produireControlesCoherence` passe déjà le `bilan`.
- **Réutilisés inchangés** : `EvaluateurFormuleService` (110, **aucune modification**), `ReferentielLoader`, `TableDePassageService`, `CompteResultatProductionService` (060/111), `MontantHorsBornesError`.

### Opérandes sous-totaux figées (B8 §4 — à encoder, `etat=BILAN`, mode `VALEUR`, toutes `signe:'+'`)

| Poste | Libellé | Opérandes | Cascade (dépend de) |
|---|---|---|---|
| `AZ` | Total actif immobilisé | `+AD +AI +AP +AQ` | détails actif |
| `BG` | Créances et emplois assimilés | `+BH +BI +BJ` | détails actif |
| `BK` | Total actif circulant | `+BA +BB +BG` | ← `BG` |
| `BT` | Total trésorerie actif | `+BQ +BR +BS` | détails actif |
| `BZ` | **Total général actif** | `+AZ +BK +BT +BU` | ← `AZ,BK,BT` (+ `BU` détail) |
| `CP` | Total capitaux propres | `+CA +CB +CD +CE +CF +CG +CH +CJ +CL +CM` | détails passif (**dont `CJ` = résultat placé**) |
| `DD` | Total dettes financières | `+DA +DB +DC` | détails passif |
| `DF` | Total ressources stables | `+CP +DD` | ← `CP,DD` |
| `DP` | Total passif circulant | `+DH +DI +DJ +DK +DM +DN` | détails passif |
| `DT` | Total trésorerie passif | `+DQ +DR` | détails passif |
| `DZ` | **Total général passif** | `+DF +DP +DT +DV` | ← `DF,DP,DT` (+ `DV` détail) |

> **Ordre de déclaration = ordre de cascade** : `AZ,BG,BK,BT,BZ` puis `CP,DD,DF,DP,DT,DZ`. À **vérifier dans la source** (et rétablir si besoin) avant `build` — l'évaluateur réinjecte au fil de l'eau ; un aval déclaré avant son amont lèverait `OperandeNonResolueError` (détecté par la garde en CI).

### Contexte d'évaluation « BILAN » (aplati) — le point clé du câblage

```
Pour chaque poste de détail BILAN_ACTIF  : { etat:'BILAN', poste, valeurN: netN,     valeurN1: netN1 }
Pour chaque poste de détail BILAN_PASSIF : { etat:'BILAN', poste, valeurN: montantN,  valeurN1: montantN1 }
Seed à 0 de TOUT poste de détail BILAN_ACTIF/BILAN_PASSIF non alimenté (patron 111 : évite OperandeNonResolueError sur balance creuse).
Placement : au poste marqué roleResultatBilan (= CJ), AJOUTER agg.resultatNet (colonne N ; N-1 = resultatNetN1 si N-1 produit).
```

Tous les opérandes des sous-totaux résolvent alors via `op.etatSource ?? 'BILAN'` = `'BILAN'`. Codes actif/passif disjoints ⇒ un seul espace, aucune collision. **`etatSource` reste inutilisé en 112** (réservé au TFT inter-états, 113).

### Contrats (types)

```ts
// bilan.types.ts (extension additive)
/** Un sous-total du Bilan calculé (AZ..DZ), colonnes N / N-1. */
export interface PosteSousTotal {
  etat: 'BILAN';
  poste: string;
  libelle: string;
  valeurN: number;
  valeurN1: number | null;
}

/** Articulation d'équilibre par les sous-totaux (B8 §7) : BZ (total actif) = DZ (total passif, résultat inclus). */
export interface CoherenceSousTotaux {
  bz: number | null;                          // Total général actif (null si non produit)
  dz: number | null;                          // Total général passif (null si non produit)
  totalActifDirect: number;                   // 059 : totalActifNet
  totalPassifResultatDirect: number;          // 059 : totalPassif + resultatNet
  ecartEquilibre: number | null;              // bz − dz
  equilibre: boolean;                         // ecartEquilibre === 0
  coherent: boolean;                          // bz==totalActifDirect && dz==totalPassifResultatDirect
}

// BilanProduit : + sousTotaux: PosteSousTotal[]; + coherenceSousTotaux: CoherenceSousTotaux;
```

### Algorithme (dans `BilanProductionService.produire`, après émission des postes détail)

1. **Contexte** : construire le contexte `BILAN` aplati ci-dessus (seed 0 + overlay actif/passif + **placement résultat**). Colonne N-1 = valeurs N-1 si `aggN1` produit, sinon `null`.
2. **Formules** : `pkg.tableDePassage.filter(r => r.etat==='BILAN' && r.regle==='FORMULE')`, **dans l'ordre du paquet** (= cascade — garanti par la garde de cohérence).
3. **`evaluer(formules, valeurs)`** (110) → `ResultatFormule[]` ; map → `PosteSousTotal[]` en reprenant le `libelle` de la `MappingRule` (ou du `PosteEtat` `BILAN`). `valeurN` d'un sous-total ne peut être `null` en mode `VALEUR` → garde défensive `?? 0` (patron 111).
4. **`coherenceSousTotaux`** : localiser `BZ`/`DZ` dans `sousTotaux` (par le marqueur « grand total » ou, à défaut, par position terminale actif/passif — **à ancrer proprement** : privilégier un repérage par le paquet, jamais un code `'BZ'`/`'DZ'` en dur ; cf. note ci-dessous). `ecartEquilibre = bz − dz` ; `equilibre = (ecartEquilibre === 0)` ; `coherent` = reproduction OK. Sans sous-total (SFD) → tout `null`/`true` (non applicable).
5. **Pureté** : aucune constante de poste OHADA dans le service (codes lus du paquet, résultat placé via le **marqueur**) ; bornage hérité de l'évaluateur (`MontantHorsBornesError`).

> **⚠️ Repérage `BZ`/`DZ` sans coder OHADA en dur (P7).** Ne pas écrire `'BZ'`/`'DZ'` littéralement. Options agnostiques à trancher au dev : (a) un 2ᵉ marqueur `roleTotalActif`/`roleTotalPassif` sur les postes `BZ`/`DZ` (patron `tresorerie?`) ; (b) dériver « grand total actif » = sous-total dont les opérandes couvrent l'ensemble des postes d'actif. **(a) recommandé** (explicite, sourcé, symétrique du marqueur de placement résultat). Le repérage ne sert qu'à **exposer** `coherenceSousTotaux`/renforcer `EQUILIBRE_BILAN` — la valeur, elle, sort de l'évaluateur générique.

### Placement du résultat — pourquoi, et où exactement

- **Pourquoi** : `DZ ⊃ DF ⊃ CP ⊃ CJ`. Sur balance avant-solde, `CJ` (classe 1 résultat) est vide ; le résultat vit en 6/7 (`agg.resultatNet`). Sans placement, `DZ = totalPassif` et `BZ − DZ = résultat ≠ 0` → `BZ = DZ` toujours en anomalie. Le placement referme l'équilibre **par construction** (`BZ = totalActif = totalPassif + résultat = DZ`).
- **Où** : **uniquement** dans le contexte d'évaluation des sous-totaux (clé `BILAN:CJ`). L'agrégation brute (`agg.passifs`, `agg.totalPassif`, `agg.resultatNet`) et le `ControleEquilibre` de 059 **ne bougent pas** → pas de double-comptage, `EQUILIBRE_BILAN` reste faillible sur balance déséquilibrée.
- **Cohérence 111 ↔ 112** : 111 a **prouvé** `XI = résultat direct (= CJ)` ; 112 **matérialise** ce `CJ` au passif du Bilan. Les deux articulations pointent le même montant sous deux angles (cascade CR vs équilibre Bilan).

### Vérification numérique (à écrire en test)

Jeu minimal équilibré (magnitude positive, unités mineures) : actif `AD=1000, BA=500` ; passif `CA=800` ; résultat via CR `résultatNet=700` (produit − charge). Alors `totalActifNet = 1500`, `totalPassif = 800`, placement `CJ += 700` ⇒ `CP ⊇ CJ = 700`. `BZ = 1500`, `DZ = 800 + 700 = 1500` ⇒ `ecartEquilibre = 0`, `equilibre = true`. Déséquilibrer (retirer 100 d'actif) ⇒ `BZ = 1400 ≠ 1500 = DZ` ⇒ `equilibre = false`, `EQUILIBRE_BILAN = ANOMALIE`.

### Sécurité / robustesse

- Story **sans écriture base ni endpoint neuf** (l'endpoint dry-run 059 existe, contrat d'entrée inchangé) ⇒ **pas de transaction Mongo**, surface d'attaque inchangée. Les guards (`@RequiresBilanAccess` + rôles) restent en amont.
- Anti-500 : `MontantHorsBornesError` (bornage) et `OperandeNonResolueError` (paquet incohérent) sont **typés** ; un paquet incohérent est un défaut de **build/CI** (garde), pas une entrée utilisateur.

### Edge cases

- **N-1 absent** : sous-totaux calculés en N, colonne N-1 = `null` (mode `VALEUR`, 110). `coherenceSousTotaux` porte sur N.
- **Poste détail absent en N** (montant nul) : contribue `0` au sous-total (seed 0 → pas d'erreur).
- **Balance avec résultat déjà en classe 1** (`CJ` alimenté par la balance) **et** 6/7 soldés (`agg.resultatNet = 0`) : placement ajoute `0` → `CJ` conserve son montant balance ; équilibre tient. **Balance malformée** (résultat à la fois en classe 1 **et** en 6/7 ouverts) : déjà détectée par `EQUILIBRE_BILAN` de 059 (hors périmètre — c'est une balance invalide).
- **SFD-BCEAO / tout `FORMULE` non encodé** : `sousTotaux: []`, `coherenceSousTotaux` non applicable, `EQUILIBRE_BILAN` = `actif = passif + résultat`.
- **Référence en avant / poste inconnu** (ne devrait pas arriver, ordre déjà cascade) : détecté par `operandes-coherence.spec.ts` (CI) et par `OperandeNonResolueError` à l'évaluation.

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** **STORY-110** (socle B8 §2 : `operandes?` + `EvaluateurFormuleService` + passthrough `build.mjs` + garde), **STORY-111** (patron encodage+câblage prouvé sur le CR — 112 le **rejoue** sur le Bilan), **STORY-059** (Bilan actif/passif + `ControleEquilibre`), **STORY-063** (batterie `EQUILIBRE_BILAN`), **STORY-056/038** (`ReferentielRegistry`, `build.mjs`, sources). **Décision n°0** ✅ tranchée MV 2026-07-20 ; **D1/D2/D3** (compositions + placement résultat) ✅ validés MV.

**Stories débloquées / suivantes :** **STORY-113** (TFT + CAFG — exerce enfin `VARIATION`/`VALEUR_N_1`/`etatSource` inter-états ; consomme les variations de Bilan que 112 aura fiabilisées), **STORY-114** (notes v1). 112 **complète l'articulation `BZ=DZ`** attendue par la validation de liasse (EPIC-012).

**Dépendances externes :** aucune (référentiels embarqués, aucun appel réseau).

**Blockers MV (n'affectent PAS 112) :** format balance A2, jeu d'essai F4, sign-off expert F1, seuil arrondi F2 — ils gâtent la **preuve e2e comptable** (aval), pas l'encodage/dry-run des sous-totaux (le moteur se prouve en dry-run sur soldes fournis, comme 111).

---

## Definition of Done

- [ ] Code implémenté (français) ; **aucune formule ni structure OHADA en dur** (P7) — les sous-totaux sont **données** du paquet, le poste receveur du résultat est **marqué** dans le paquet ; `EvaluateurFormuleService` (110) **non modifié** ; champs `sousTotaux`/`coherenceSousTotaux` + marqueur **additifs**.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (nouveau code Bilan/contrôles visé ~100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : cascade `AZ..DZ` sur soldes de référence ; **équilibre `BZ=DZ`** (balance équilibrée ⇒ `equilibre=true` ; déséquilibrée ⇒ `false` + `EQUILIBRE_BILAN=ANOMALIE`) ; **placement résultat** (`CJ` reçoit `agg.resultatNet`, `DZ` l'absorbe) ; reproduction (`bz=totalActifNet`, `dz=totalPassif+résultat`) ; sous-totaux N-1 (avec/sans `soldesN1`) ; **SFD → `sousTotaux: []`** (agnosticisme) ; bornage → `MontantHorsBornesError`. `operandes-coherence.spec.ts` **verte** avec les 11 sous-totaux réels chargés via le vrai loader.
- [ ] Tests **de non-régression** : `BilanProductionService` (059) — `actif`/`passif`/`controle`/`comptesNonMappes` **inchangés** ; suites 060/061/062/063 vertes ; **`sfd-bceao@1.0` byte-identique** (checksum inchangé) ; `syscohada-revise@2.1` régénéré = **exactement** l'octet attendu (test `referentiel-stamp`/`referentiel-registry` avec le nouveau checksum).
- [ ] **Vérification docker réelle** (la story n'écrit pas en base ⇒ preuve = chargement référentiel + sortie Bilan sur stack vivante) : `docker compose up --build` → 8 services `/health` **200** ; login org SYSCOHADA (entitlement `ACTIVE`) → `POST /bilan/etats/bilan/dry-run` sur un jeu de soldes équilibré → **200** avec `sousTotaux[]` (11 sous-totaux, valeurs cohérentes) + `coherenceSousTotaux.equilibre=true` (`BZ=DZ`) ; champs actif/passif/controle **identiques** à EPIC-011 (cross-check) ; balance déséquilibrée → `EQUILIBRE_BILAN=ANOMALIE` ; org **SFD** → `sousTotaux: []` ; checksum `syscohada-revise@2.1` chargé = nouveau, `sfd-bceao@1.0` = inchangé. Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Encodage des 11 opérandes de sous-totaux (source) + marqueur placement résultat + régénération artefact + MAJ checksum registre :** 1 point
- **Câblage `EvaluateurFormuleService` dans le Bilan (contexte `BILAN` aplati, placement résultat, `PosteSousTotal`, DTO/controller) :** 1 point
- **Articulation `BZ=DZ` (`coherenceSousTotaux` + repérage agnostique `BZ`/`DZ` + renforcement `EQUILIBRE_BILAN`) + tests (unit équilibre/placement/agnosticisme + garde réelle + non-régression byte) + vérif docker :** 1 point
- **Total :** 3 points

**Rationale :** **zéro règle comptable à trancher** (compositions D3 validées **sans correction**, toutes additives — contrairement à `XC` en 111). Le patron encoder→build→checksum→câbler est **déjà prouvé par 111**. L'effort net = les **deux spécificités Bilan** (contexte aplati `BILAN` + placement du résultat en `CJ` pour fermer `BZ=DZ`), toutes deux petites et bien cadrées. D'où **3 points** (vs 5 pour 111).

---

## Additional Notes

- **2ᵉ consommateur de l'évaluateur 110**, après 111. Confirme que « transformer un agrégat de squelette en poste calculé = encoder des `operandes` dans la source + projeter le contexte + brancher `evaluer` » — jamais toucher au moteur générique.
- **L'aplatissement `BILAN` est une décision de référentiel**, pas du moteur : la source déclare les sous-totaux `etat='BILAN'` précisément pour qu'actif et passif partagent un espace de résolution ; le moteur (110) se contente de résoudre `op.etatSource ?? formule.etat`. C'est le premier cas où un état de **présentation** (`BILAN`) diffère des états de **détail** (`BILAN_ACTIF`/`BILAN_PASSIF`) — utile à garder en tête pour 113 (TFT lit du Bilan et du CR via `etatSource`).
- **Le placement du résultat en `CJ` boucle l'équilibre** : `EQUILIBRE_BILAN` devient portant *via les sous-totaux* (`BZ=DZ`), en plus de l'identité brute `actif = passif + résultat` de 059 — deux angles sur le même équilibre, symétriques de la double lecture `CR=CJ` / `XI=CJ` que 111 a donnée à `COHERENCE_RESULTAT`.
- **Checksum : 2ᵉ mouvement.** 110 était checksum-neutre ; 111 a encodé les 9 SIG (1ᵉʳ octet) ; 112 encode les 11 sous-totaux + le marqueur (2ᵉ octet). `sfd-bceao@1.0` ne bouge jamais (agnosticisme).

---

## Progress Tracking

**Status History :**
- 2026-07-20 : Créée (Scrum Master) — **3ᵉ story d'EPIC-011B**, B8 §4. Rédigée après confirmation que **STORY-111 est done+mergée** (la demande initiale « STORY-111 » était un lapsus pour **STORY-112**). Cadrée « encoder + brancher, jamais modifier le moteur », en rejouant le patron 111 sur le **Bilan**.
- 2026-07-20 : Implémentée + vérifiée docker bout-en-bout (branche MNV-112 bilan-service). 2ᵉ consommateur réel de l'évaluateur 110, sur le Bilan.
- 2026-07-20 : `/code-review` — 1 constat correctness CORRIGÉ (placement résultat sur `posteResultat.etat` déclaré, plus `ETAT_PASSIF` en dur → hypothèse latente levée) + 2 constats LOW acceptés (1ᵉʳ marqueur `role` gagnant ; incomplétude AMORCE tracée F1/F4). Intégrée dans `dev` (PR #17 bilan-service, MNV-112 « Rebase and merge », HEAD `99008bb`, branche supprimée). **Done.**

**Implémentation (dev-story, 2026-07-20) — écarts assumés vs le cadrage initial :**
- **Résolution d'état — `etatSource` explicite, PAS un « contexte aplati ».** Le sketch de création proposait d'aplatir actif+passif dans un espace `BILAN`. À l'implémentation, la **garde** `operandes-coherence.spec.ts` (résolution `op.etatSource ?? formule.etat`) a tranché en faveur du mécanisme **déjà générique** : chaque opérande de détail porte son `etat_source` (`BILAN_ACTIF`/`BILAN_PASSIF`), les opérandes vers un sous-total amont restent en `BILAN` (défaut). **Zéro modification du moteur (110) ni de la garde** ; contexte d'évaluation construit sur les **vrais** états de détail. (Le mode reste `VALEUR` mono-période ; `VARIATION`/`VALEUR_N_1` restent 113.)
- **Encodage source** : 11 postes `FORMULE` `etat='BILAN'` (`AZ,BG,BK,BT,BZ,CP,DD,DF,DP,DT,DZ`) reçoivent leurs `operandes` (B8 §4, toutes `signe:'+'`) + 3 marqueurs `role` (`RESULTAT_BILAN` sur `CJ`, `TOTAL_ACTIF` sur `BZ`, `TOTAL_PASSIF` sur `DZ`). `node build.mjs` → `syscohada-revise-2.1.json` sha256 `6e35de56… → f55e4ed5…` reporté dans `ReferentielRegistry` ; `sfd-bceao-1.0.json` **byte-identique** (`0509a034…`, agnosticisme P7). Contrat : champ additif `MappingRule.role?` (patron `tresorerie?`) + passthrough `build.mjs`.
- **Câblage Bilan** : `BilanProductionService` (059) injecte `EvaluateurFormuleService` (110) → `produireSousTotaux` (seed à 0 des détails Bilan + overlay `netN`/`montantN` + **placement additif du résultat** au poste `role=RESULTAT_BILAN`) → champ `sousTotaux[]` ; `coherenceSousTotaux` (`bz`/`dz` via les marqueurs `TOTAL_ACTIF`/`TOTAL_PASSIF`, `equilibre = bz===dz`, `coherent = reproduction des totaux directs`). `EQUILIBRE_BILAN` (063) **matérialisé** : expose `BZ`/`DZ`, libellé enrichi ; **verdict inchangé = `equilibreN`** (059). Moteur générique 110 **non modifié**.
- **⚠️ Finding — table de passage AMORCE incohérente avec §4 (à remonter MV, F1/F4).** Le mapping AMORCE peuple des **postes fins** (`AE=211, AJ=22…`) **hors** de la chaîne `AZ=AD+AI+AP+AQ` (+ prefix-ties `AI/AJ=22`, `AQ/AR=26`). Sur une balance réelle touchant ces postes fins, `BZ` **sous-compte** → `coherent=false`. **Décision de dev (safe, non-régressive)** : `EQUILIBRE_BILAN` garde son verdict `equilibreN` (jamais de fausse anomalie sur une cascade incomplète) ; `coherent` **diagnostique** la complétude. `BZ=DZ` est **prouvé en dry-run sur jeu de soldes couvert** (comme 111 sur soldes synthétiques) ; la preuve sur balance réelle attend l'affinage de la table (blockers **F1 expert / F4 jeu d'essai**). Le placement résultat en `CJ` est **additif** (fonctionne balance avant-solde **et** après-affectation).
- **Qualité** : lint **0 warning** · `npm run build` OK · **346 unit (38 suites) + 73 e2e (10 suites) verts** · `bilan-production.service.ts` 100/92.04/100/100 · `evaluateur-formule.service.ts` **100 %** (non modifié) · `controles-coherence-production.service.ts` 100/97.29/100/100 · global **98.34/92.61/98.29/98.18** > seuils 65/90/90/90. Garde `operandes-coherence.spec.ts` **verte** avec les opérandes réelles des 11 sous-totaux (résolution `etatSource` + cascade). e2e : `BZ=DZ` prouvé **sur HTTP** (jeu couvert) + SFD `sousTotaux:[]`.

**Vérification docker (stack vivante, bilan-service redémarré → chargement référentiel frais) :**
- `/health` **200** (`mongodb:up, kafka:up`). Flux réel register→verify(mongo)→login (JWT RS256 `emailVerified`, `aud` incl. `bilan-service`) ; read-models semés (`orgkycstatuses` APPROVED + `orgbilanentitlements` ACTIVE syscohada).
- **SYSCOHADA, jeu de soldes couvert** (BB 1M, BS 0,5M, CA 1M, DJ 0,1M, résultat 0,4M) → **200** ; `stamp.checksum = f55e4ed5…` (**nouvel** artefact) ; **11 sous-totaux** (libellés GUIDEF, `BZ`=`TOTAL GENERAL`) ; `BZ=1 500 000` (`BK`[BB] + `BT`[BS]) ; `DZ=1 500 000` (`CP`[CA + **résultat 0,4M placé en CJ**] + `DP`[DJ]) ; `coherenceSousTotaux{bz:1500000, dz:1500000, equilibre:true, coherent:true, ecart:0}` — **`BZ=DZ` prouvé**. `controle.equilibreN=true`, `resultatNetN=400000` (non-régression 059).
- **Diagnostic AMORCE** : soldes `211000→AE` (hors chaîne) → `equilibreN=true` MAIS `coherent=false` (`bz=0` vs `totalActifDirect=1 000 000`) — le gate de complétude fonctionne **sans** fausser l'équilibre.
- **Contrôles** `POST …/controles/dry-run` (jeu couvert) → `EQUILIBRE_BILAN` **statut OK**, libellé « …= BZ = DZ », `elements=[{BZ:1500000},{DZ:1500000}]`.
- **SFD-BCEAO** (entitlement re-pointé) → **200** ; `stamp.checksum = 0509a034…` (**inchangé**) ; `sousTotaux:[]` ; `coherenceSousTotaux.bz=null, coherent=true` — **agnosticisme P7 prouvé**.
- **Sans jeton → 401** (chaîne de guards intacte).

**Effort réel :** 3 points (conforme).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
