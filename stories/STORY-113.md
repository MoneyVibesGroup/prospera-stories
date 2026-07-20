# STORY-113 : TFT/TAFIRE — retraitements `FA..FQ` + CAFG (additif corrigé, correction B) + Z-sous-totaux en opérandes (modes `VARIATION`/`VALEUR_N_1`, `etatSource` inter-états) + statut par ligne `CALCULE`/`ESTIME`/`A_COMPLETER` + articulation `ZH = trésorerie nette N` portante — FR-011 (complet) — B8 §5

**Epic :** EPIC-011B — États financiers : calcul complet de la liasse (opérandes SIG / sous-totaux / TFT / notes, tech-spec B8) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. tech-spec :** `docs/tech-spec-bilan-b8-2026-07-20.md` **§5** (TFT/TAFIRE méthode indirecte — opérandes + statut par ligne, correction **B** CAFG additif) + **§1** (décision n°0 — magnitude positive + opérandes signées, ✅ tranchée MV 2026-07-20) + **§2** (évaluateur générique 110 : modes `VARIATION`/`VALEUR_N_1`, `etatSource`) + **§7** (contrôle `VARIATION_TRESORERIE : ZH − ZA = ZG` et `ZH = tréso nette N`, informatif ; tolérance F2) + **§9** (traçabilité : §5 = STORY-113, FR-011)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-011 (TFT/TAFIRE + **contrôle de variation de trésorerie** AC-2 ; **FR-A27** statut de preuve par ligne) + §FR-013 (contrôles d'articulation)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de structure OHADA/TFT codée en dur — le SFD-BCEAO n'a **aucun** TFT) ; CLAUDE.md §Definition of Done, §« ne devine jamais une API »
**Réf. code livré :** **STORY-110** (socle B8 §2 : `Operande` + `MappingRule.operandes?` + **`EvaluateurFormuleService`** `Σ signe × valeur` — **modes `VALEUR`/`VARIATION`/`VALEUR_N_1` et `etatSource` déjà implémentés et testés, mais jamais encore exercés en production** ; `additionSure`/`MontantHorsBornesError`, `OperandeNonResolueError` ; passthrough `build.mjs` `normOperandes` incl. `mode`/`etat_source`) · **STORY-111** (patron encodage+câblage sur le CR : `sig[]` + `coherenceSig` + **contexte semé à 0**) · **STORY-112** (patron sur le Bilan : `sousTotaux[]` + `coherenceSousTotaux` + marqueur `role?` + résolution inter-états `etatSource` `BILAN_ACTIF`/`BILAN_PASSIF` réelle) · **STORY-061** (`TftProductionService` — squelette TFT + ancres trésorerie via marqueur `tresorerie` + `controleTresorerie` variation TFT=Bilan ; reconnaissance des ancres par libellé `roleAncre`) · **STORY-059/060** (`BilanProductionService` postes actif net/passif montant N/N-1 + `CompteResultatProductionService` postes détail + `sig[]`) · **STORY-063** (`ControlesCoherenceProductionService` — `VARIATION_TRESORERIE` informatif) · **STORY-056/038** (`ReferentielRegistry`, `build.mjs`, sources `table-de-passage-syscohada.json` / `postes-syscohada-guidef-togo.json`)
**Priorité :** Should Have
**Story Points :** 8
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + `/code-review` OK + intégrée dans `dev` le 2026-07-20 — PR #18 bilan-service, MNV-113 « Rebase and merge », HEAD `3623596`, branche supprimée ; clôt EPIC-011B côté moteur d'états, débloque STORY-114)
**Assigné à :** vivian
**Créée :** 2026-07-20
**Sprint :** 13

---

## User Story

**En tant que** cabinet comptable produisant sa liasse OHADA dans `bilan-service`,
**je veux** que le **Tableau des flux de trésorerie (TFT/TAFIRE)** soit **réellement calculé** par la **méthode indirecte** — la CAFG (`FA`) et les retraitements de flux (`FB..FQ`) dérivés des **variations de mon Bilan** (`N − N-1`) et des postes de mon **Compte de résultat**, cascadés en Z-sous-totaux (`ZA..ZH`) — **chaque ligne portant un statut de preuve** (`CALCULE` quand elle sort intégralement des soldes, `ESTIME` quand elle repose sur une variation nette faute de mouvements bruts, `A_COMPLETER` quand la donnée est hors balance), **afin que** mon TFT ne s'arrête plus au squelette (ancres de trésorerie seules, tout le reste `A_COMPLETER`) mais restitue le **flux de trésorerie de la période**, avec la garantie d'articulation que la **trésorerie de clôture reconstituée `ZH` égale ma trésorerie nette N de Bilan** — sans qu'aucune structure OHADA ne soit codée dans le moteur (elle est **donnée** du paquet `syscohada-revise@2.1` ; SFD-BCEAO, **sans TFT**, reste agnostique et inchangé — **invariant P7**).

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

**STORY-110 a livré le socle B8 §2** et **STORY-111/112 ont prouvé le patron encodage→build→checksum→câblage** deux fois (CR, puis Bilan). **STORY-113 rejoue ce patron sur le TFT** — mais c'est la story la plus riche d'EPIC-011B, pour **trois raisons structurantes** qui la distinguent de 111/112 :

1. **1er exercice réel des modes relatifs au N-1 et de l'inter-états.** 111 et 112 n'ont exercé que le mode `VALEUR` (mono-période) : 111 mono-état (`COMPTE_RESULTAT`), 112 inter-états mais toujours `VALEUR` (sous-totaux Bilan lisant des détails Bilan). **La méthode indirecte du TFT est la raison d'être des modes `VARIATION` (`N − N-1`), `VALEUR_N_1`, et de la lecture `etatSource` vers un *autre* état (CR + Bilan) déjà présents — mais jamais encore utilisés — dans l'évaluateur 110.** 113 est leur **premier consommateur de production** : le socle 110 a été conçu exactement pour ça (cf. `evaluateur-formule.types.ts` : « cas TFT `INDETERMINABLE`, surfacé en 113 »).

2. **Statut de preuve par ligne (FR-A27) — la nouveauté conceptuelle.** Contrairement au CR (tous ses SIG `CALCULE`) et au Bilan (tous ses sous-totaux `CALCULE`), le TFT indirect **ne peut PAS tout calculer à partir des seuls soldes N/N-1** : certaines lignes (`FF..FL`, `FN`) exigent des **mouvements bruts d'immobilisations** ou l'**affectation du résultat** — données **hors balance**. B8 §5 tranche : ces lignes produisent une **estimation à partir des variations nettes** (`ESTIME`) ou restent **non calculables** (`A_COMPLETER`), **jamais inventées**. Chaque ligne porte donc un **statut de preuve** que le cabinet lit pour savoir quels chiffres sont fiables et lesquels sont provisoires. C'est la matérialisation de **FR-A27**.

3. **Correction B (CAFG additif) — la seule règle comptable à figer avec soin.** La fiche REMPLIE donnait deux formules CAFG « équivalentes » — **c'est faux** (elles diffèrent de `TI`, transfert de charges déjà inclus dans l'EBE via `XD`). B8 retient l'**additif** `FA = +XI +RL +RN −TJ −TL −TN +RO` (entièrement dérivable du CR, canonique). C'est **exactement** l'analogue de la correction A (`XC`) que 111 a figée : une composition à **recopier telle quelle depuis le tech-spec**, jamais à re-dériver.

### État de départ (STORY-061) — ce que 113 transforme

Aujourd'hui `TftProductionService` (061) produit :
- le **squelette** TFT (postes `etat='TFT'` du référentiel, en-tête `Réf` exclue, ordonnés) ;
- les **ancres de trésorerie** (`ZA` ouverture = trésorerie nette N-1, `ZH` clôture = trésorerie nette N, variation), **reconnues par leur libellé** (`roleAncre` : « janvier »/« décembre »/« variation …trésorerie ») et dérivées du **Bilan produit** via le marqueur `tresorerie` ;
- le **contrôle** `controleTresorerie` (variation TFT = variation Bilan, `ecart=0` par construction, statuts `CALCULE`/`INDETERMINABLE`/`NON_APPLICABLE`).

**Tous les retraitements `FA..FQ` et les Z-sous-totaux `ZB..ZG` sont `A_COMPLETER`** (`montantN=null`) : le TFT ne porte **aucun** mapping `etat='TFT'` dans la table de passage — les postes TFT ne vivent que dans `postes` (squelette d'affichage). **Le TFT n'est PAS agrégeable par la `regle`** : il se calcule par **retraitements** (variations, reprises CR), d'où le renvoi délibéré à B8.

### Ce que 113 livre

1. **Opérandes TFT encodées (source + artefact régénéré) — 1er jeu d'opérandes multi-mode/inter-états.** Les ~22 lignes de calcul du TFT (`ZA, FA..FE, ZB, FF..FJ, ZC, FK..FN, ZD, FO..FQ, ZE, ZF, ZG, ZH`) deviennent des **`MappingRule` `etat='TFT'`, `type='total'`, `regle='FORMULE'`** avec leurs `operandes` (B8 §5) **ajoutées à `table-de-passage-syscohada.json`** (elles n'y existent pas encore — contrairement aux SIG/sous-totaux 111/112 déjà présents en squelette `FORMULE`). Les opérandes portent leurs **`mode`** (`VARIATION` pour les variations de Bilan, `VALEUR_N_1` pour l'ancre `ZA`, `VALEUR` par défaut pour les reprises CR et la cascade interne TFT) et leur **`etat_source`** (`COMPTE_RESULTAT` pour la CAFG, `BILAN`/`BILAN_ACTIF`/`BILAN_PASSIF` pour les variations, défaut `TFT` pour la cascade). `node build.mjs` régénère `syscohada-revise-2.1.json` → **nouveau sha256 (3ᵉ octet)** reporté dans `ReferentielRegistry`. `sfd-bceao@1.0` **byte-identique** (aucun TFT → aucune opérande) : agnosticisme P7.

2. **Marqueur de statut de preuve par ligne (source).** Les lignes que B8 §5 marque `ESTIME` (`FF,FG,FH,FI,FJ,FK,FM,FO,FP,FQ`) ou `A_COMPLETER` (`FN`) reçoivent un **marqueur additif** sur leur `MappingRule` (patron `role?`/`tresorerie?` de 112/061). Absent ⇒ `CALCULE` (défaut, quand la ligne a des opérandes intégralement dérivables). Ce marqueur est **donnée du paquet** (le référentiel *sait* quelles lignes sont estimées), jamais un code en dur.

3. **Câblage de l'évaluateur 110 dans le TFT — contexte MULTI-ÉTATS (CR + Bilan détail + Bilan sous-totaux).** `TftProductionService` injecte `EvaluateurFormuleService` (110) ; le moteur (`bilan-engine.service`) **produit désormais aussi le CR** en amont du TFT (aujourd'hui il ne produit que le Bilan). Le service construit un **contexte d'évaluation multi-états** — clé `${etat}:${poste}` — assemblant : (a) les postes de détail du **CR** (produits/charges, `COMPTE_RESULTAT:*`) **+ ses SIG** (`XI` etc.), avec N et N-1 ; (b) les postes de détail du **Bilan** (`BILAN_ACTIF:*` nets, `BILAN_PASSIF:*` montants), avec N **et N-1** (indispensables au mode `VARIATION`) ; (c) les **sous-totaux du Bilan** (`BILAN:*`, dont `BT`/`DT` pour l'ancre `ZA`), avec N et N-1 ; (d) un **seed à 0** de tous les postes `etat='TFT'` (patron 111/112 : garantit que la cascade — `ZD` référence `FN` sans opérande — résout sans `OperandeNonResolueError`). Puis `evaluer(formulesTft, contexte)` calcule `ZA..ZH` **dans l'ordre de déclaration** (= cascade), et le service mappe `ResultatFormule[]` → `PosteTft[]` (montant + **statut** calculé).

4. **Statut par ligne (`CALCULE`/`ESTIME`/`A_COMPLETER`) + propagation aux Z-sous-totaux.** Le statut de base vient du marqueur source. Un **Z-sous-total** (`ZB..ZH`) hérite du **pire** statut parmi ses opérandes sources (sévérité `CALCULE < ESTIME < A_COMPLETER`) : un flux d'investissement `ZC` qui somme des lignes `ESTIME` est lui-même `ESTIME` (B8 §5 : « hérite des entrées »). Une ligne dont le `montantN` sort `null` (mode `VARIATION`/`VALEUR_N_1` **sans N-1**) est exposée `montantN=null` et le **contrôle agrégé** bascule `INDETERMINABLE` (sémantique 061 conservée).

5. **Articulation `ZH = trésorerie nette N` portante + `ZH − ZA = ZG` (B8 §7).** Le `controleTresorerie` de 061 — aujourd'hui vrai par construction sur les seules ancres — devient **portant** : il réconcilie la **clôture reconstituée `ZH`** (issue de la cascade indirecte complète) avec la **trésorerie nette N du Bilan** (dérivée des marqueurs `tresorerie`, mécanisme 061 **inchangé**), et vérifie l'identité interne `ZH − ZA = ZG`. Écart comparé à la **tolérance du référentiel** (F2 ; défaut ±1 XOF proposé, **MV à confirmer** — hook paramétrable, pas de seuil en dur). `VARIATION_TRESORERIE` (063) reste **INFORMATIF** (non bloquant) : une divergence due aux lignes `ESTIME`/`A_COMPLETER` **signale** sans invalider la liasse.

### Décision n°0 câblée & correction B (aucune règle à deviner)

Postes de détail en **magnitude positive** (059/060), opérandes **signées** : une hausse d'actif **consomme** la trésorerie (`signe:'-'` sur la variation), une hausse de passif en **dégage** (`signe:'+'`). Les compositions `FA..ZH` sont **recopiées telles quelles depuis B8 §5** (CAFG = additif `+XI +RL +RN −TJ −TL −TN +RO`, corrigé B ; `FB=−BA`, `FE=+DP`, `ZA=+BT −DT` VALEUR_N_1…). **Aucune règle OHADA n'est re-dérivée** : elle est lue du tech-spec, encodée en donnée.

### Ce que 113 ne fait PAS (frontière nette)

- **SIG du CR** (`XA..XI`) → **déjà STORY-111** ; **sous-totaux Bilan** (`AZ..DZ`, `BZ=DZ`) → **déjà STORY-112**. 113 les **consomme** en contexte (CR SIG `XI`, Bilan sous-totaux `BT`/`DT`), ne les recalcule pas.
- **Notes annexes v1** → **STORY-114** (B8 §6).
- **Toute modification de `EvaluateurFormuleService`** (moteur 110) : **interdit** — les modes `VARIATION`/`VALEUR_N_1`/`etatSource` y sont **déjà** implémentés et testés (110). 113 les **exerce**, ne les change pas. Si un besoin d'évolution du moteur apparaît → signal de mauvais cadrage, s'arrêter et re-cadrer.
- **Mouvements bruts d'immobilisations / affectation du résultat** (données hors balance) : **hors périmètre** — ce sont précisément les entrées qui rendent `FF..FL`/`FN` `ESTIME`/`A_COMPLETER`. 113 les **marque**, ne les invente pas. Leur affinage viendra avec l'interop balance réelle / mouvements (aval EPIC-009 superseded → `balance-service` ; blockers F1/F4).
- **`sfd-bceao@1.0`** : aucun octet, aucun checksum, aucune opérande, aucun marqueur — sa non-modification **est** la preuve d'agnosticisme (il n'a **pas** de TFT).
- **Import balance réel / jeu d'essai comptable / sign-off expert / seuil d'arrondi** (blockers MV A2/F4/F1/F2) → gâtent la **preuve e2e comptable** (aval), **pas** l'encodage/dry-run du TFT (le moteur se prouve en dry-run sur soldes N/N-1 fournis, comme 111/112). **F2 (tolérance) doit néanmoins être *paramétrable*** dès 113 (défaut proposé ±1 XOF).

---

## Scope

**Dans le périmètre :**

- **Source référentiel** : `scripts/referentiels/sources/table-de-passage-syscohada.json` → **ajout** de ~22 lignes `etat='TFT'`, `type='total'`, `regle='FORMULE'` (`ZA, FA, FB, FC, FD, FE, ZB, FF, FG, FH, FI, FJ, ZC, FK, FL, FM, FN, ZD, FO, FP, FQ, ZE, ZF, ZG, ZH`) avec leurs `operandes` (B8 §5), chaque opérande portant `poste`/`signe` + **`mode`** (`VARIATION`/`VALEUR_N_1`, absent = `VALEUR`) + **`etat_source`** (`COMPTE_RESULTAT`/`BILAN`/`BILAN_ACTIF`/`BILAN_PASSIF`, absent = `TFT`) ; + **marqueur de statut** sur les lignes `ESTIME`/`A_COMPLETER`. `FN` (dividendes, hors balance) → **aucune opérande** (reste squelette `A_COMPLETER`, mais explicitement marquée pour la propagation). **Ordre de déclaration = ordre de cascade** (`ZA, FA..FE, ZB, FF..FJ, ZC, FK..FN, ZD, FO..FQ, ZE, ZF, ZG, ZH`) — à respecter strictement. **Aucune** ligne de détail Bilan/CR modifiée.
- **Artefact + registre** : régénération via `build.mjs` (`normOperandes` recopie déjà `mode`/`etat_source` — **rien à changer côté build pour les opérandes** ; **ajouter le passthrough du marqueur de statut** sur le patron `role`) → `src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json` (nouvel octet, 3ᵉ mouvement) + **MAJ du `checksum`** `syscohada-revise@2.1` dans `ReferentielRegistry` (courant `f55e4ed5…` → nouveau). `sfd-bceao-1.0.json` et son checksum (`0509a034…`) **inchangés**.
- **Contrat référentiel** : champ additif sur `MappingRule` pour le **statut de preuve** (ex. `statutTft?: 'ESTIME' | 'A_COMPLETER'`, patron `role?`) dans `referentiel-package.interface.ts` — **additif**, ignoré partout ailleurs. (Réutiliser `operandes?`/`mode`/`etatSource` **tels quels** — déjà au contrat 110.)
- **Extension du type ligne** : `StatutLigneTft = 'CALCULE' | 'A_COMPLETER'` → `'CALCULE' | 'ESTIME' | 'A_COMPLETER'` (`tft.types.ts`), commentaire mis à jour (FR-A27). `PosteTft` inchangé de structure (`montantN` désormais renseigné pour `CALCULE`/`ESTIME`).
- **Câblage moteur** : `bilan-engine.service.ts#produireTft` produit **aussi le CR** (`crProduction.produire`) et le passe au TFT ; `TftProductionService.produire(pkg, bilan, cr)` injecte `EvaluateurFormuleService`, construit le **contexte multi-états** (CR détail + SIG, Bilan détail actif/passif N+N-1, Bilan sous-totaux N+N-1, seed 0 des lignes TFT), sélectionne les `FORMULE` `etat='TFT'` (ordre du paquet), `evaluer(...)`, mappe → `PosteTft[]` avec `montantN` + `statut` (base source + propagation cascade). **Ancres/contrôle 061 réconciliés** avec la cascade (`ZH` vs trésorerie nette Bilan).
- **Contrôle d'articulation** : `controleTresorerie` alimenté par la **vraie** clôture `ZH` (au lieu de l'ancre dérivée seule) ; `ecart = ZH − trésorerieNetteN` comparé à la **tolérance référentiel** (F2, paramétrable ; défaut ±1). `ControlesCoherenceProductionService.controleTresorerie` (063) **inchangé de contrat** (reste INFORMATIF, reprend le statut) — mais désormais **portant** (l'écart peut être non nul via les `ESTIME`).
- **DTO/Swagger** : `TftDto` — enrichir la doc de `postes[]`/`controleTresorerie` (nouveaux statuts `ESTIME`, articulation `ZH`), exemples `FA`/`ZB`/`ZH` calculés. Endpoint `POST /bilan/etats/tft/dry-run` **inchangé** en contrat d'entrée (`BilanDryRunRequestDto`).
- **Garde de cohérence** : `operandes-coherence.spec.ts` (110) charge désormais **aussi** les opérandes des lignes TFT sur `syscohada-revise@2.1` (vrai `ReferentielLoader`, checksum vérifié) → doit **passer** : chaque opérande résout dans son `etat_source` (CR/Bilan/TFT), cascade respectée (aval déclaré après amont), `mode`/`signe` valides. Blinde l'encodage inter-états.

**Hors périmètre (hooks / stories suivantes — NE PAS déborder) :**

- SIG CR → **déjà 111** ; sous-totaux Bilan → **déjà 112** ; notes v1 → **STORY-114**.
- **Toute modification de `EvaluateurFormuleService`** (110) : interdit (les modes sont déjà là).
- **Mouvements bruts d'immobilisations / affectation du résultat** (hors balance) : les lignes concernées restent `ESTIME`/`A_COMPLETER` — 113 ne cherche pas à les rendre `CALCULE`.
- **`sfd-bceao@1.0`** : aucun octet, aucun checksum, aucune opérande, aucun marqueur (agnosticisme).
- Preuve e2e comptable / import réel / **valeur** définitive du seuil d'arrondi F2 (113 le rend *paramétrable* avec un défaut ; la valeur retenue = décision MV) : aval.

---

## User Flow

*(Story moteur — « flux » = celui du cabinet via l'endpoint de diagnostic + celui du mainteneur de référentiel.)*

1. Le mainteneur déclare les `operandes` des ~22 lignes TFT (avec `mode`/`etat_source`) **et** les marqueurs de statut `ESTIME`/`A_COMPLETER` dans la source syscohada, régénère l'artefact (`build.mjs` imprime le nouveau sha256), reporte le checksum dans `ReferentielRegistry`.
2. La garde `operandes-coherence.spec.ts` vérifie en CI que chaque opérande TFT résout vers un poste connu de son `etat_source` (CR/Bilan/TFT) et que l'ordre de cascade est respecté — sinon échec **en CI** (jamais au runtime).
3. Un cabinet (org SYSCOHADA, entitlement `ACTIVE`) appelle `POST /bilan/etats/tft/dry-run` avec ses soldes **N + N-1** (N-1 nécessaire aux variations).
4. Le moteur produit le Bilan (059) **et le CR** (060) sur les mêmes soldes, **puis** `TftProductionService` construit le contexte multi-états et `EvaluateurFormuleService` calcule `ZA..ZH` par retraitements ; la réponse **200** porte le TFT **chiffré** : `FA` (CAFG), `FB..FE`, `ZB` (flux opérationnels), `ZC/ZD/ZE` (invest./capitaux/étrangers, `ESTIME`), `ZG` (variation période), `ZH` (clôture), **chaque ligne avec son `statut`** ; `controleTresorerie.statut=CALCULE`, `ZH = trésorerie nette N` (dans la tolérance).
5. Sans N-1 : les lignes `VARIATION`/`VALEUR_N_1` sortent `montantN=null`, `FA` (CAFG, pur CR) reste chiffrée, `controleTresorerie.statut=INDETERMINABLE`.
6. Une org **SFD-BCEAO** appelle le même endpoint → `postes: []` (aucun TFT), `controleTresorerie.statut=NON_APPLICABLE`. **Aucune structure OHADA/TFT n'a été codée dans le moteur.**

---

## Acceptance Criteria

- [ ] **Opérandes TFT encodées (multi-mode / inter-états)** : les ~22 lignes `FORMULE` `etat='TFT'` (`ZA, FA..FQ, ZB..ZH`) portent leurs `operandes` (B8 §5) dans la source, avec `mode` (`VARIATION`/`VALEUR_N_1` là où B8 le prescrit) et `etat_source` (`COMPTE_RESULTAT`/`BILAN`/`BILAN_ACTIF`/`BILAN_PASSIF`) ; l'artefact `syscohada-revise-2.1.json` est régénéré et son **nouveau checksum** (3ᵉ octet) reporté dans `ReferentielRegistry`.
- [ ] **CAFG additif (correction B)** : `FA = +XI +RL +RN −TJ −TL −TN +RO` (opérandes `etat_source='COMPTE_RESULTAT'`). Test dédié : sur un jeu où le soustractif `XD+TI+…` **différerait** (présence de `TI`), la valeur produite = l'**additif** (preuve que `TI` n'est pas double-compté), analogue à la preuve `XC` de 111.
- [ ] **Cascade indirecte complète** : `ZB=+FA+FB+FC+FD+FE`, `ZC=+FF..+FJ`, `ZD=+FK..+FN`, `ZE=+FO+FP+FQ`, `ZF=+ZD+ZE`, `ZG=+ZB+ZC+ZF`, `ZH=+ZG+ZA` — calculés dans l'ordre, un Z-sous-total amont réinjecté en aval.
- [ ] **Modes N-1 exercés** : `FB=−BA`, `FC=−BB`, `FD=−BG`, `FE=+DP` en `VARIATION` (`N−N-1`), `ZA=+BT −DT` en `VALEUR_N_1` — valeurs conformes au calcul manuel sur un jeu N/N-1. **Sans N-1** : ces lignes → `montantN=null` ; `FA` reste chiffrée (pur CR) ; `controleTresorerie.statut=INDETERMINABLE`.
- [ ] **Statut par ligne (FR-A27)** : `FA..FE`, `FL` = `CALCULE` ; `FF,FG,FH,FI,FJ,FK,FM,FO,FP,FQ` = `ESTIME` ; `FN` = `A_COMPLETER` (`montantN=null`). Les Z-sous-totaux **héritent du pire statut** de leurs composants (`ZC`/`ZD`/`ZE`/`ZF`/`ZG` = `ESTIME` ou pire ; `ZB` = `CALCULE` si N-1). Test dédié de propagation.
- [ ] **Articulation `ZH = trésorerie nette N` (B8 §7)** : sur un jeu N/N-1 couvert, `ZH` (clôture reconstituée) = trésorerie nette N du Bilan **dans la tolérance** ; `ZH − ZA = ZG`. `controleTresorerie.statut=CALCULE`, `coherent=true`. Tolérance **paramétrable par référentiel** (F2), défaut ±1 XOF — **aucun seuil en dur**.
- [ ] **Câblage — sortie TFT enrichie** : `POST /bilan/etats/tft/dry-run` renvoie **200** avec les `postes[]` **chiffrés** (`montantN` renseigné pour `CALCULE`/`ESTIME`, `null` pour `A_COMPLETER`) + `tresorerieOuvertureN/ClotureN/variationTresorerieN` + `controleTresorerie` alimenté par la cascade.
- [ ] **Non-régression des ancres 061** : `tresorerieOuvertureN` (= trésorerie nette N-1) et `tresorerieClotureN` (= trésorerie nette N) **restent** cohérents avec la dérivation marqueur `tresorerie` du Bilan ; le `controleTresorerie` conserve ses statuts `CALCULE`/`INDETERMINABLE`/`NON_APPLICABLE`.
- [ ] **Agnosticisme P7** : une org **SFD-BCEAO** obtient `postes: []`, `controleTresorerie.statut=NON_APPLICABLE` ; **aucun** code SYSCOHADA/TFT ajouté au moteur ; `EvaluateurFormuleService` **non modifié** ; aucun marqueur/opérande TFT déclaré côté SFD.
- [ ] **Garde de cohérence** : `operandes-coherence.spec.ts` charge `syscohada-revise@2.1` (vrai loader) et valide les opérandes TFT (résolution inter-états `etat_source` + cascade + `mode`/`signe`) → **0 violation**.
- [ ] **Bornage** : un cumul TFT dépassant l'entier sûr propage `MontantHorsBornesError` → **400**, jamais 500 (patron 059/110/111/112).
- [ ] **Non-régression paquet** : `sfd-bceao@1.0` **byte-identique** (checksum inchangé) ; les autres états dry-run (`bilan`, `compte-resultat`, `notes-annexes`, `controles`) **inchangés** hormis `VARIATION_TRESORERIE` (désormais portant, reste INFORMATIF).

---

## Technical Notes

### Composants

- **Étendu (source)** : `scripts/referentiels/sources/table-de-passage-syscohada.json` → **~22 nouvelles lignes** `etat='TFT'` `regle='FORMULE'` avec `operandes` (`{ "poste": "…", "signe": "±", "mode": "VARIATION"|"VALEUR_N_1"?, "etat_source": "…"? }`) + marqueur de statut. Format source (snake) identique à 111/112.
- **Étendu (build)** : `scripts/referentiels/build.mjs` → **passthrough du marqueur de statut** (spread conditionnel, patron `role`). `normOperandes` gère **déjà** `mode`/`etat_source` — **ne pas y toucher**.
- **Régénéré** : `src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json` + `ReferentielRegistry` (`syscohada-revise@2.1.checksum` ← nouveau sha256).
- **Étendu (contrat)** : `src/modules/bilan/referentiel/referentiel-package.interface.ts` → `MappingRule.statutTft?: 'ESTIME' | 'A_COMPLETER'` (**additif**, patron `role?`).
- **Étendu (types)** : `src/modules/bilan/etats/tft.types.ts` → `StatutLigneTft` + `'ESTIME'`.
- **Étendu (moteur, consommation)** : `src/modules/bilan/etats/tft-production.service.ts` → constructeur `+ EvaluateurFormuleService` ; `produire(pkg, bilan, cr)` (signature étendue : reçoit le **CR produit**) construit le contexte multi-états, `evaluer`, mappe + statut/propagation, réconcilie `controleTresorerie` avec `ZH`. `src/modules/bilan/bilan-engine.service.ts#produireTft` → produit le CR (`crProduction`) et le passe ; **et `produireControlesCoherence`** passe déjà le TFT à 063 (le TFT porte désormais la cascade). `src/modules/bilan/dto/tft-response.dto.ts` → doc/exemples.
- **Réutilisés inchangés** : `EvaluateurFormuleService` (110, **aucune modification** — modes déjà présents), `ReferentielLoader`, `BilanProductionService` (059/112), `CompteResultatProductionService` (060/111), `MontantHorsBornesError`, `roleAncre` (repérage des ancres par libellé — conservé).

### Opérandes TFT figées (B8 §5 — à encoder, `etat='TFT'`)

| Code | Opérandes (poste · signe · mode · etat_source) | Statut v1 |
|---|---|---|
| `ZA` | `+BT −DT` · `VALEUR_N_1` · `BILAN` | `CALCULE` si N-1, sinon `null`/INDETERMINABLE |
| `FA` (CAFG) | `+XI +RL +RN −TJ −TL −TN +RO` · `VALEUR` · `COMPTE_RESULTAT` | `CALCULE` (**correction B, additif**) |
| `FB` | `−BA` · `VARIATION` · `BILAN_ACTIF` | `CALCULE` |
| `FC` | `−BB` · `VARIATION` · `BILAN_ACTIF` | `CALCULE` |
| `FD` | `−BG` · `VARIATION` · `BILAN` *(BG sous-total)* | `CALCULE` |
| `FE` | `+DP` · `VARIATION` · `BILAN` *(DP sous-total)* | `CALCULE` |
| `ZB` | `+FA +FB +FC +FD +FE` · `VALEUR` · `TFT` | hérite (`CALCULE` si N-1) |
| `FF/FG/FH` | `−AA/−AC/−AF…` variation valeur brute par nature (à préciser du référentiel : 21 / 22-24 / 26-27) · `VARIATION` | **`ESTIME`** (mouvements bruts manquants) |
| `FI/FJ` | `+TN` (CR) ; ventilation incorp+corp / fin. si détail | **`ESTIME`** |
| `ZC` | `+FF..+FJ` · `TFT` | `ESTIME` (hérite) |
| `FK` | `+CA` · `VARIATION` · `BILAN_PASSIF` (hors incorporation réserves) | **`ESTIME`** |
| `FL` | `+CL` · `VARIATION` · `BILAN_PASSIF` *(pas CB — correction fiche ✔)* | `CALCULE` |
| `FM` | `−CA` · `VARIATION` · `BILAN_PASSIF` (baisse) | `ESTIME` |
| `FN` | affectation résultat N-1 (**hors bilan**) → **aucune opérande** | **`A_COMPLETER`** |
| `ZD` | `+FK +FL +FM +FN` · `TFT` | `ESTIME`/pire (hérite, `FN` A_COMPLETER) |
| `FO` | `+DA` · `VARIATION` · `BILAN_PASSIF` | `CALCULE`/`ESTIME` |
| `FP` | `+DB` · `VARIATION` · `BILAN_PASSIF` *(DC exclu — non-cash ✔)* | `CALCULE`/`ESTIME` |
| `FQ` | `−DA −DB` · `VARIATION` · `BILAN_PASSIF` (part remboursée, Δ net) | `ESTIME` |
| `ZE` | `+FO +FP +FQ` · `TFT` | `ESTIME` (hérite) |
| `ZF` | `+ZD +ZE` · `TFT` | hérite |
| `ZG` | `+ZB +ZC +ZF` · `TFT` | hérite |
| `ZH` | `+ZG +ZA` · `TFT` | hérite ; **= trésorerie nette N du Bilan** |

> **⚠️ Les codes de postes de détail sources (`AA/AC/AF…` pour `FF..FH`, ventilation `FI/FJ`) sont à recouper avec `BILAN_ACTIF` du fichier de postes AVANT encodage** — ne **jamais** deviner un code : lire `postes-syscohada-guidef-togo.json` / `table-de-passage-syscohada.json`. Là où B8 laisse une estimation nette (variation de la valeur nette faute de brut), l'opérande porte la **variation nette disponible** et la ligne est marquée `ESTIME`. **Ordre de déclaration = ordre de cascade** (garde CI).

### Contexte d'évaluation « TFT » (multi-états) — le point clé du câblage

```
CR      : pour chaque produit/charge → { etat:'COMPTE_RESULTAT', poste, valeurN: montantN, valeurN1: montantN1 }
          + chaque SIG (dont XI)     → { etat:'COMPTE_RESULTAT', poste, valeurN, valeurN1 }
Bilan   : chaque détail actif        → { etat:'BILAN_ACTIF',  poste, valeurN: netN,     valeurN1: netN1 }
          chaque détail passif       → { etat:'BILAN_PASSIF', poste, valeurN: montantN, valeurN1: montantN1 }
          chaque sous-total          → { etat:'BILAN', poste, valeurN, valeurN1 }   (BT, DT, BG, DP… pour ZA/FD/FE)
Seed    : chaque ligne etat='TFT'    → 0  (garantit ZD→FN, cascade, sans OperandeNonResolueError — patron 111/112)
```

L'évaluateur résout chaque opérande via `op.etatSource ?? formule.etat` (défaut `'TFT'` pour la cascade interne). **N-1 impératif** dans le contexte : sans lui, `VARIATION`/`VALEUR_N_1` renvoient `null` (110) → montants `null`, contrôle `INDETERMINABLE`. C'est le **premier** câblage à peupler les colonnes **N-1** de tous les postes détail (les modes relatifs en dépendent).

### Statut par ligne + propagation (FR-A27)

```
statutBase(ligne) = ligne.statutTft ?? (ligne a des operandes ? 'CALCULE' : 'A_COMPLETER')
severite : CALCULE=0 < ESTIME=1 < A_COMPLETER=2
Pour un Z-sous-total : statut = max( statutBase(self), max sur ses operandes etat='TFT' de statut(sous-ligne) )
```

Le service calcule les statuts **dans l'ordre de cascade** (chaque Z lit les statuts déjà fixés de ses composants). Un `montantN=null` (N-1 manquant) n'est **pas** un statut de ligne mais une indétermination de colonne → remontée au `controleTresorerie` (`INDETERMINABLE`), sémantique 061 conservée.

### Contrôle `controleTresorerie` réconcilié (B8 §7)

- **Aujourd'hui (061)** : `variationTft` = clôture − ouverture (ancres) ; `variationBilan` = trésorerie N − N-1 ; `ecart=0` par construction.
- **113** : `ZH` = clôture **reconstituée par la cascade indirecte** ; le contrôle vérifie `ZH == trésorerieNetteN` (Bilan) **et** `ZH − ZA == ZG`, écart comparé à `pkg.regles`/tolérance F2 (**paramétrable**, défaut ±1). `coherent` = écart dans la tolérance. `statut` : `CALCULE` (N-1 présent, TFT chiffré) / `INDETERMINABLE` (N-1 absent) / `NON_APPLICABLE` (SFD). **Reste INFORMATIF** dans 063 — les lignes `ESTIME`/`A_COMPLETER` peuvent introduire un écart légitime (données hors balance) sans invalider la liasse.

> **⚠️ Repérage `ZA`/`ZG`/`ZH` sans coder OHADA en dur (P7).** Deux options : (a) **réutiliser `roleAncre`** (libellé — mécanisme 061 déjà en place et testé) ; (b) promouvoir en marqueurs explicites (`role` étendu). **(a) recommandé** (zéro nouveau marqueur, déjà prouvé) ; ne **jamais** écrire `'ZH'` littéralement dans le service.

### Vérification numérique (à écrire en test)

Jeu minimal N/N-1 (magnitude positive, unités mineures). Poser un CR (→ `XI`, `RL` dotations amort., `TN` cessions…) et un Bilan N/N-1 avec variations de trésorerie, stocks, créances, dettes. Vérifier : `FA` = additif (≠ soustractif d'un `TI`) ; `FB=−ΔBA`, `FE=+ΔDP` ; `ZB=FA+FB+…FE` ; `ZA=+BT(N-1) −DT(N-1)` ; `ZH=ZG+ZA` **= trésorerie nette N du Bilan** (`ecart` dans la tolérance) ; statuts (`ZC` ESTIME, `FN` A_COMPLETER). Retirer N-1 ⇒ toutes les VARIATION/VALEUR_N_1 `null`, `FA` chiffrée, contrôle `INDETERMINABLE`. Cumul géant ⇒ `MontantHorsBornesError` → 400.

### Sécurité / robustesse

- Story **sans écriture base ni endpoint neuf** (dry-run 061 existe, contrat d'entrée inchangé) ⇒ **pas de transaction Mongo**, surface d'attaque inchangée. Guards (`@RequiresBilanAccess` + rôles) en amont.
- Anti-500 : `MontantHorsBornesError` (bornage) et `OperandeNonResolueError` (paquet incohérent) **typés** ; un paquet incohérent est un défaut **build/CI** (garde), pas une entrée utilisateur.

### Edge cases

- **N-1 absent** : variations/ancre N-1 = `null`, `FA` (pur CR) chiffrée, `controleTresorerie=INDETERMINABLE`. `montantN=null` proprement exposé (jamais 0 silencieux qui masquerait l'indétermination).
- **`FN` (dividendes) sans opérande** : reste `A_COMPLETER` (`montantN=null`), **seedée à 0** dans le contexte → `ZD` résout (avec `ZD` marqué au pire statut `A_COMPLETER`). Documenté (donnée hors balance).
- **Poste détail absent en N ou N-1** (montant nul) : contribue `0` (seed 0 → pas d'erreur), variation cohérente.
- **SFD-BCEAO / tout `FORMULE` TFT non encodé** : `postes: []`, `controleTresorerie=NON_APPLICABLE`.
- **Écart d'articulation `ZH ≠ trésorerie nette N`** dû aux `ESTIME` : `coherent=false` **informatif** — ne bloque pas `valide` (063). Tracé pour l'utilisateur (statuts + écart).
- **Référence en avant / poste inconnu** (ne devrait pas arriver, ordre déjà cascade) : détecté par `operandes-coherence.spec.ts` (CI) et `OperandeNonResolueError` à l'évaluation.

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** **STORY-110** (socle B8 §2 : `operandes?` + `EvaluateurFormuleService` — **modes `VARIATION`/`VALEUR_N_1`/`etatSource` déjà livrés**, 113 les exerce enfin + passthrough `build.mjs` `mode`/`etat_source` + garde), **STORY-111** (patron encodage+câblage + contexte semé à 0), **STORY-112** (patron Bilan + résolution inter-états `etatSource` réelle + sous-totaux `BT`/`DT`/`BG`/`DP` que le TFT consomme), **STORY-061** (`TftProductionService` squelette + ancres + `controleTresorerie` + `roleAncre`), **STORY-059/060** (Bilan actif/passif N/N-1, CR détail + SIG), **STORY-063** (`VARIATION_TRESORERIE`), **STORY-056/038** (`ReferentielRegistry`, `build.mjs`, sources). **Décision n°0** ✅ tranchée MV 2026-07-20 ; **correction B (CAFG additif)** ✅ figée B8 §5.

**Stories débloquées / suivantes :** **STORY-114** (notes v1). 113 **complète l'articulation de trésorerie** (`ZH = tréso nette N`) attendue par la validation de liasse (EPIC-012), et **prouve en production** les modes `VARIATION`/`VALEUR_N_1`/inter-états du socle 110.

**Dépendances externes :** aucune (référentiels embarqués, aucun appel réseau).

**Blockers MV (n'affectent PAS l'encodage/dry-run 113) :** format balance A2, **jeu d'essai F4**, **sign-off expert F1** (validité réglementaire des retraitements/CAFG), **valeur du seuil de tolérance F2** (113 le rend *paramétrable* avec défaut ±1 ; la valeur retenue = décision MV), **mouvements bruts d'immobilisations / affectation du résultat** (hors balance — rendent `FF..FL`/`FN` `ESTIME`/`A_COMPLETER`). Ils gâtent la **preuve e2e comptable** (aval), pas le moteur (prouvé en dry-run sur soldes N/N-1 fournis).

---

## Definition of Done

- [ ] Code implémenté (français) ; **aucune formule ni structure OHADA/TFT en dur** (P7) — les retraitements sont **données** du paquet, les statuts `ESTIME`/`A_COMPLETER` sont **marqués** dans le paquet ; `EvaluateurFormuleService` (110) **non modifié** ; champs `statutTft`/`StatutLigne.ESTIME` + opérandes **additifs**.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (nouveau code TFT/contrôle visé ~100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : cascade `ZA..ZH` sur jeu N/N-1 de référence ; **CAFG additif** (≠ soustractif, `TI` non double-compté) ; **modes** `VARIATION` (`FB..FE`)/`VALEUR_N_1` (`ZA`) exercés + **sans N-1** (`null` + `INDETERMINABLE`) ; **statut par ligne + propagation** (`FN`=A_COMPLETER, `ZC/ZD/ZE`=ESTIME) ; **articulation `ZH = trésorerie nette N`** (dans tolérance) + `ZH−ZA=ZG` ; **tolérance paramétrable** (aucun seuil en dur) ; non-régression ancres 061 ; **SFD → `postes: []`** (agnosticisme) ; bornage → `MontantHorsBornesError`. `operandes-coherence.spec.ts` **verte** avec les opérandes TFT réelles (résolution inter-états + cascade) chargées via le vrai loader.
- [ ] Tests **de non-régression** : `TftProductionService` (061) — ancres/`controleTresorerie` statuts **cohérents** ; suites 059/060/062/063 vertes ; **`sfd-bceao@1.0` byte-identique** (checksum inchangé) ; `syscohada-revise@2.1` régénéré = **exactement** l'octet attendu (test `referentiel-stamp`/`referentiel-registry` avec le nouveau checksum).
- [ ] **Vérification docker réelle** (la story n'écrit pas en base ⇒ preuve = chargement référentiel + sortie TFT sur stack vivante) : `docker compose up --build` → 8 services `/health` **200** ; login org SYSCOHADA (entitlement `ACTIVE`) → `POST /bilan/etats/tft/dry-run` sur un jeu de soldes **N + N-1** couvert → **200** avec TFT **chiffré** (`FA` CAFG, `FB..FE`, `ZB`, `ZC/ZD/ZE` ESTIME, `ZG`, `ZH`), **statuts par ligne** corrects, `controleTresorerie.statut=CALCULE` + `ZH = trésorerie nette N` (dans tolérance) ; **sans N-1** → variations `null`, `FA` chiffrée, `INDETERMINABLE` ; org **SFD** → `postes: []`, `NON_APPLICABLE` ; checksum `syscohada-revise@2.1` = nouveau, `sfd-bceao@1.0` = inchangé ; `POST …/controles/dry-run` → `VARIATION_TRESORERIE` reflète le nouveau contrôle (INFORMATIF) ; sans jeton → **401**. Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Encodage des ~22 opérandes TFT (modes `VARIATION`/`VALEUR_N_1`, `etat_source` CR/Bilan, CAFG additif corrigé B) + marqueurs de statut + recoupement des codes de détail source + passthrough statut `build.mjs` + régénération artefact + MAJ checksum :** 3 points
- **Câblage `EvaluateurFormuleService` dans le TFT — contexte MULTI-ÉTATS (CR détail + SIG, Bilan détail actif/passif N+N-1, Bilan sous-totaux N+N-1, seed lignes TFT), production CR en amont, `StatutLigneTft.ESTIME`, calcul + propagation des statuts, réconciliation `controleTresorerie` avec `ZH`, tolérance paramétrable :** 3 points
- **Tests (cascade indirecte, CAFG additif, modes N-1 + sans-N-1, statut/propagation, articulation `ZH`, agnosticisme SFD, garde réelle inter-états, non-régression byte + 061) + vérif docker N/N-1 :** 2 points
- **Total :** 8 points

**Rationale :** 8 points (vs 3 pour 112, 5 pour 111) car 113 cumule **trois nouveautés** qu'aucune story précédente n'a portées : (1) **premier exercice de production** des modes `VARIATION`/`VALEUR_N_1` et de la lecture inter-états multi-source (CR **et** Bilan **et** sous-totaux, avec **colonnes N-1** à peupler partout) ; (2) le **statut de preuve par ligne + propagation** (FR-A27) — une couche absente du CR/Bilan ; (3) la **méthode indirecte** avec sa réserve `ESTIME`/`A_COMPLETER` et l'articulation portante `ZH = trésorerie nette N` (tolérance paramétrable). La seule règle comptable à figer (CAFG additif, correction B) est **déjà tranchée** au tech-spec — comme `XC` en 111.

---

## Additional Notes

- **3ᵉ (et dernier « moteur ») consommateur de l'évaluateur 110**, après 111 (CR) et 112 (Bilan). Il **valide le socle 110 en entier** : c'est la story pour laquelle les modes `VARIATION`/`VALEUR_N_1`/`etatSource` ont été conçus dès 110 (« surfacé en 113 »). Après 113, le patron « transformer un agrégat de squelette en poste calculé = encoder des `operandes` (avec mode/état) dans la source + projeter le contexte + brancher `evaluer` » est prouvé sur **les trois** natures d'agrégat (formule mono-état, sous-total inter-états `VALEUR`, retraitement inter-états `VARIATION`/`VALEUR_N_1`).
- **La méthode indirecte est une décision de référentiel**, pas du moteur : la source déclare comment la CAFG et chaque flux se dérivent des variations de Bilan et des postes de CR ; le moteur (110) se contente de résoudre `op.etatSource ?? formule.etat` selon `op.mode`. SFD-BCEAO — **sans TFT** — n'en déclare rien : **même code, résultat agnostique**.
- **Le statut de preuve (FR-A27) est la contribution conceptuelle de 113** : la liasse cesse d'être « tout ou rien » (calculé / squelette) et devient **honnête sur sa propre fiabilité** — chaque chiffre du TFT dit s'il est exact (`CALCULE`), estimé faute de mouvements bruts (`ESTIME`), ou hors de portée des soldes (`A_COMPLETER`). C'est ce qui permettra à EPIC-012 de **valider** une liasse en connaissant ses zones d'estimation.
- **Checksum : 3ᵉ mouvement.** 110 checksum-neutre ; 111 = 9 SIG (`cb8a7e11…→6e35de56…`) ; 112 = 11 sous-totaux + marqueurs (`6e35de56…→f55e4ed5…`) ; 113 = ~22 lignes TFT + marqueurs de statut (`f55e4ed5…→ nouveau`). `sfd-bceao@1.0` (`0509a034…`) ne bouge jamais.
- **Réserve F1 (sign-off expert)** : l'additif CAFG néglige la reprise de subventions d'investissement virées au résultat (raffinement à trancher au sign-off, sans impact sur l'articulation `ZH`) ; les codes de détail des acquisitions/cessions d'immobilisations (`FF..FJ`) et l'exhaustivité de la couverture des variations restent à valider sur **jeu d'essai réel (F4)**. 113 encode l'ingénierie figée ; la validation réglementaire reste due.

---

## Progress Tracking

**Status History :**
- 2026-07-20 : Créée (Scrum Master) — **4ᵉ story d'EPIC-011B**, B8 §5. Cadrée « encoder + brancher, jamais modifier le moteur », en rejouant le patron 111/112 sur le **TFT** — mais avec trois nouveautés (modes N-1/inter-états en production, statut de preuve par ligne FR-A27, méthode indirecte + articulation `ZH` portante). Rédigée après confirmation que **STORY-112 est done+mergée**.
- 2026-07-20 : Implémentée + vérifiée docker bout-en-bout (branche MNV-113 bilan-service). **3ᵉ (et dernier « moteur ») consommateur de l'évaluateur 110** — 1er usage en production des modes `VARIATION`/`VALEUR_N_1`/`etatSource` inter-états.
- 2026-07-20 : `/code-review` — 0 constat bloquant (correction du contrôle sans-N-1 + propagation de statut vérifiées ; constats non bloquants = choix `ESTIME` gross/net tracés F1/F4). Intégrée dans `dev` (PR #18 bilan-service, MNV-113 « Rebase and merge », HEAD `3623596`, branche supprimée). **Done.**

**Implémentation (dev-story, 2026-07-20) — écarts assumés vs le cadrage initial :**
- **Résolution multi-états — `etatSource` explicite (mécanisme 110 déjà générique), aucun contexte « aplati ».** `TftProductionService` injecte `EvaluateurFormuleService` (110, **non modifié**) et construit un **contexte multi-états** : seed à 0 de **tous** les postes du paquet (patron 111/112, évite `OperandeNonResolueError` — y compris pour `FN` A_COMPLETER référencé par `ZD`), puis overlay CR (produits/charges **+ SIG `XI`**), Bilan détail actif/passif **N et N-1**, sous-totaux Bilan (`BT`/`DT`/`BG`/`DP`). Chaque opérande résout via `op.etatSource ?? 'TFT'`.
- **Encodage source** : **25 lignes `FORMULE` `etat='TFT'` AJOUTÉES** (`ZA, FA..FQ, ZB..ZH` — elles n'existaient pas, vs SIG/sous-totaux déjà en squelette) avec `mode` (`VARIATION`/`VALEUR_N_1`) + `etat_source` (CR/BILAN/BILAN_ACTIF/BILAN_PASSIF) + marqueurs `statut_tft`. CAFG additif (correction B) `FA = +XI +RL +RN −TJ −TL −TN +RO`. `node build.mjs` → `syscohada-revise-2.1.json` sha256 **`f55e4ed5… → 2b6ea55e…`** reporté dans `ReferentielRegistry` ; `sfd-bceao-1.0.json` **byte-identique** (`0509a034…`, agnosticisme P7). Contrat : champ additif `MappingRule.statutTft?` (patron `role?`) + passthrough `build.mjs` ; type `StatutLigneTft += 'ESTIME'`.
- **⚠️ Écart assumé vs le libellé littéral de B8 §5 (documenté, F1/F4).** Là où le tech-spec **scinde une variation nette unique en deux lignes gross-increase / gross-decrease** (qui exigeraient des mouvements bruts absents de la balance), encoder les **deux** signes de la même Δ les ferait **s'annuler** dans le Z-sous-total (sous-compte à zéro). Décision de dev **sûre et non-régressive** : la variation nette est portée par la ligne d'**augmentation** (`FK=+ΔCA`, `FO=+ΔDA`, `FP=+ΔDB` — `ESTIME`) et la ligne de **diminution** reste `A_COMPLETER` sans opérande (`FM` prélèvements, `FQ` remboursements) ; idem `FJ` (ventilation cessions financières hors balance). Analogue aux findings `XC` (111) / AMORCE (112) : l'ingénierie figée est encodée, la validation réglementaire reste due (**blockers F1 expert / F4 jeu d'essai**).
- **Câblage** : `bilan-engine.service#produireTft` produit **aussi le CR** et le passe ; `produireControlesCoherence` passe le CR déjà produit. `VARIATION_TRESORERIE` (063) **inchangé de contrat** mais désormais **portant** (`variationTft = ZG` cascade vs `variationBilan`, tolérance F2 `regles.toleranceTresorerie` défaut ±1 — **paramétrable, aucun seuil en dur**). Reste **INFORMATIF**.
- **Statut par ligne + propagation** : base source (`statutTft` ?? opérandes⇒`CALCULE` / sinon `A_COMPLETER`) ; un Z-sous-total devient `ESTIME` dès qu'un composant `TFT` n'est pas `CALCULE`. Résultat conforme B8 §5 : `FA..FE`/`FL` `CALCULE`, `FF..FK`/`FO`/`FP` `ESTIME`, `FJ`/`FM`/`FN`/`FQ` `A_COMPLETER`, `ZC..ZH` `ESTIME`.
- **Qualité** : lint **0 warning** · `npm run build` OK · **355 unit (38 suites) + 73 e2e (10 suites) verts** · `tft-production.service.ts` **100/94.79/100/100** · `evaluateur-formule.service.ts` **100 %** (non modifié) · global **98.42/92.66/98.36/98.27** > seuils 65/90/90/90. Garde `operandes-coherence.spec.ts` **verte** avec les opérandes TFT réelles (résolution inter-états `COMPTE_RESULTAT`/`BILAN` + modes `VARIATION`/`VALEUR_N_1` + cascade). Non-régression : 11 tests 061 (fallback ancre) intacts ; mapping SYSCOHADA 99 → **124** (25 lignes TFT) mis à jour dans les gardes de comptage ; `sfd-bceao@1.0` byte-identique.

**Vérification docker (stack vivante, infra remontée `down`→`up` mongo/kafka, bilan-service redémarré → chargement référentiel frais) :**
- `/health` **200** (`mongodb:up, kafka:up`) bilan + auth. Flux réel register→verify(mongo `emailVerifiedAt`)→login (JWT RS256) ; read-models semés (`orgkycstatuses` APPROVED + `orgbilanentitlements` ACTIVE syscohada).
- **SYSCOHADA, jeu couvert N/N-1** (vente 50 000 : cash +30 000, créance +20 000) → **200** ; `stamp.checksum = 2b6ea55e…` (**nouvel** artefact) ; TFT **chiffré** : `FA`(CAFG)=**50 000** CALCULE, `FD`(−ΔBG)=**−20 000** CALCULE (VARIATION), `ZA`=**100 000** CALCULE (VALEUR_N_1), `ZB`=**30 000** CALCULE, `ZH`=**130 000** ESTIME ; `controleTresorerie{statut:CALCULE, tresorerieNetteN:130000, tresorerieNetteN1:100000, variationTft:30000, variationBilan:30000, ecart:0, coherent:true}` — **`ZH = trésorerie nette N` prouvé en production**. Statuts : `FN` A_COMPLETER (montantN null), `ZC/ZD/ZE/ZF/ZG/ZH` ESTIME (propagation).
- **Contrôles** `POST …/controles/dry-run` → `VARIATION_TRESORERIE` **INFORMATIF, statut OK, ecart 0** ; `valide=true`.
- **Sans N-1** → `controleTresorerie.statut=INDETERMINABLE`, `FA` (pur CR) reste **50 000**.
- **SFD-BCEAO** (entitlement re-pointé) → **200** ; `stamp.checksum = 0509a034…` (**inchangé**) ; `postes:[]` ; `controleTresorerie.statut=NON_APPLICABLE` — **agnosticisme P7 prouvé** (aucun TFT).
- **Sans jeton → 401** (chaîne de guards intacte).

**Actual Effort :** 8 points (conforme).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
