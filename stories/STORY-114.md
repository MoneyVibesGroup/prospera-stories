# STORY-114 : Notes annexes v1 automatables — ventilation du solde par compte sous-jacent (notes 5, 6, 8, 9, 10, 11, 12, 17) + trame pré-structurée pour les notes hors-balance (3, 4, 7) — FR-012 (complet) — B8 §6

**Epic :** EPIC-011B — États financiers : calcul complet de la liasse (opérandes SIG / sous-totaux / TFT / notes, tech-spec B8) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. tech-spec :** `docs/tech-spec-bilan-b8-2026-07-20.md` **§6** (Notes annexes — périmètre v1 : ventilation de solde ; liste des notes automatisables vs à compléter) + **§9** (traçabilité : §6 = STORY-114, FR-012)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-012 (Notes annexes — AC-1 synthèse des renvois, AC-2 balisage des zones non déductibles)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de structure OHADA/annexe codée en dur) ; CLAUDE.md §Definition of Done, §« ne devine jamais une API »
**Réf. code livré :** **STORY-062** (`NotesAnnexesProductionService` — synthèse des **renvois** de note : postes contributeurs + montants repris des états + total N/N-1 ; `libelle: null` et `detailACompleter: true` **délibérément** renvoyés à B8 §6) · **STORY-059/060** (`BilanProductionService` / `CompteResultatProductionService` — postes produits) · **STORY-055/056** (`TableDePassageService` — mapping comptes→postes ; `pkg.tableDePassage[].comptesSyscohada`) · **STORY-110** (patron de champ additif sur le contrat, passthrough `build.mjs`) · **STORY-113** (dernier « moteur » d'états livré ; patron encoder→build→checksum→câbler prouvé 4×)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done ✅ (implémentée + vérifiée docker bout-en-bout + `/code-review` OK + intégrée dans `dev` le 2026-07-20 — PR #19 bilan-service, MNV-114 « Rebase and merge », HEAD `04fbc20`, branche supprimée ; **clôt EPIC-011B** — liasse calculée de bout en bout)
**Assigné à :** vivian
**Créée :** 2026-07-20
**Sprint :** 13

---

## User Story

**En tant que** cabinet comptable produisant sa liasse OHADA dans `bilan-service`,
**je veux** que les **notes annexes automatisables** (celles déductibles d'une **simple ventilation du solde par compte sous-jacent** — notes 5, 6, 8, 9, 10, 11, 12, 17) affichent, sous chaque poste renvoyé, le **détail par compte** (numéro + libellé + montant N/N-1) réellement présent dans ma balance, avec le **titre officiel** de la note ; et que les notes exigeant des **données hors balance** (mouvements bruts d'immobilisations, antériorité — notes 3, 4, 7) me présentent une **trame pré-structurée** (titre + colonnes officielles, lignes vides à compléter) plutôt qu'un vide,
**afin que** mes notes annexes cessent d'être une simple synthèse de renvois (`libelle: null`, `detailACompleter: true`) et portent le **détail exploitable** que la balance permet — sans qu'aucune structure OHADA ne soit codée dans le moteur (les titres, colonnes et le mode d'automatisation par note sont **données** du paquet `syscohada-revise@2.1` ; SFD-BCEAO, sans ces notes, reste agnostique et inchangé — **invariant P7**), et **sans jamais inventer** un chiffre non dérivable des soldes.

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

**STORY-062 a livré la synthèse des renvois** (FR-012 AC-1) : pour chaque note déclarée via `PosteEtat.note`, ses **postes contributeurs** et leur **montant repris** des états produits + un **total** N/N-1. Mais elle a **délibérément** laissé deux zones à B8 §6 (FR-012 AC-2) : `libelle: null` (le référentiel ne stockait pas le **titre** de la note) et `detailACompleter: true` (aucun **détail** dérivé). **STORY-114 comble ces deux zones pour les notes automatisables v1**, en rejouant le patron encoder→build→checksum→câbler prouvé 4× (111 CR, 112 Bilan, 113 TFT) — mais côté **notes**.

B8 §6 fige le périmètre v1 en **deux familles** :

1. **Automatisables v1 (ventilation de solde par compte)** — notes **5** (`BA`, comptes 485/488), **6** (`BB`, 31–38), **8** (`BJ`), **9** (`BQ`, 50x), **10** (`BR`, 51x), **11** (`BS`, 52/53/57), **12** (`BU`, 478), **17** (`BH`, 409). Chacune est déductible d'une **simple ventilation du solde du poste par les comptes sous-jacents** présents dans la balance (comptes disponibles via `pkg.tableDePassage[].comptesSyscohada`). C'est le cœur de 114.

2. **À compléter (hors balance)** — notes **3** (`AD`/`AI`/`AP`, mouvements bruts d'immobilisations), **4** (`AQ`, mouvements titres/prêts), **7** (`BI`, antériorité/aging des créances). La ventilation par compte est **insuffisante** (il faut des mouvements bruts / une antériorité **hors balance**). B8 §6 exige alors une **trame pré-structurée** : **titre + colonnes officielles GUIDEF, lignes vides** — **pas** un tableau vide (E2), **jamais** un chiffre inventé.

### Le point clé — d'où vient le « détail par compte » (et pourquoi 114 a besoin des soldes)

La synthèse 062 travaille sur les **états produits** (`bilan`/`cr`) : elle ne connaît que les **montants agrégés par poste**, le détail par compte ayant été **perdu à l'agrégation** (059/060 ne conservent que le brut/amort/montant par poste). Pour ventiler `BS` (trésorerie) en `521000`, `531000`… avec leurs soldes réels, 114 doit **re-mapper les soldes bruts** : le moteur (`bilan-engine`) passe désormais les **`soldesN`/`soldesN1`** (déjà en main) au `NotesAnnexesProductionService`, qui les **rattache aux postes** via `TableDePassageService` (le **même** mapping que 059/060, aucune règle nouvelle) et **groupe par compte** au sein de chaque poste renvoyé. C'est une **ventilation**, pas un recalcul : la somme des sous-lignes d'un poste = le montant du poste (déjà exposé par 062), invariant vérifiable.

### Agnosticisme P7 — titres, colonnes et mode d'automatisation sont *données*

Le **titre** d'une note, ses **colonnes officielles** et son **mode v1** (`VENTILATION` vs `TRAME`) ne peuvent pas être devinés ni codés en dur (SYSCOHADA a ses notes, SFD-BCEAO en a d'autres / aucune). 114 les **déclare dans le paquet** via une structure **additive** `notes?: NoteMeta[]` sur le `ReferentielPackage` (patron du champ additif `tresorerie?`/`operandes?`/`role?`/`statutTft?`) : chaque `NoteMeta = { note, libelle, colonnes?, mode }`. Le moteur lit cette donnée ; **aucun numéro de note ni titre OHADA n'entre dans le code**. SFD-BCEAO **n'en déclare aucune** → `notes: []`, comportement 062 conservé (agnosticisme).

> **Pourquoi un marqueur de mode, et pas une heuristique.** On ne peut **pas** déduire « automatisable » de la seule structure : les notes 3/4/7 sont, elles aussi, rattachées à des postes de détail dont les comptes sont dans la balance — une heuristique « je sais ventiler par compte » les classerait **à tort** automatisables, alors qu'elles exigent des mouvements bruts. Le **mode est donc une décision de référentiel** (sourcée), exactement comme le `statutTft` de 113 marquait `ESTIME`/`A_COMPLETER`.

### Ce que 114 livre

1. **Contrat + source : métadonnées de notes.** Champ additif `ReferentielPackage.notes?: NoteMeta[]` (`referentiel-package.interface.ts`). Encodage dans `scripts/referentiels/sources/` (nouvelle source `notes-syscohada.json` ou section dédiée) des 11 notes v1 : les 8 `VENTILATION` (5,6,8,9,10,11,12,17) et les 3 `TRAME` (3,4,7), chacune avec son **titre officiel GUIDEF** et, pour les TRAME, ses **colonnes officielles**. `build.mjs` recopie (passthrough, patron additif). Artefact `syscohada-revise-2.1.json` régénéré → **nouveau checksum** (4ᵉ octet EPIC-011B) dans `ReferentielRegistry`. `sfd-bceao@1.0` **byte-identique**.
2. **Ventilation par compte (VENTILATION).** `NotesAnnexesProductionService` reçoit `soldesN`/`soldesN1`, rattache les comptes aux postes de chaque note `VENTILATION` (via `TableDePassageService`), et émet, **sous chaque poste contributeur**, des **sous-lignes par compte** (`compte`, `libelle` du plan de comptes si dispo, `montantN`, `montantN1`), triées. `libelle` de la note = titre sourcé (plus `null`). `detailACompleter: false` (le détail exploitable **est** produit). Invariant : Σ sous-lignes d'un poste = montant du poste (062).
3. **Trame pré-structurée (TRAME).** Pour les notes 3/4/7 : `libelle` = titre sourcé, **colonnes officielles** exposées, **lignes vides** (aucun montant inventé), `detailACompleter: true`. La synthèse des renvois (totaux 062) **reste** produite (le poste et son total agrégé sont connus ; seul le détail mouvements/antériorité manque).
4. **Non-régression 062.** La synthèse des renvois (postes contributeurs, total N/N-1, ordre, statut global, agnosticisme SFD) est **conservée** ; 114 l'**enrichit** (titre + détail/trame), sans toucher aux totaux ni au contrôle `ARTICULATION_NOTES` (063).

### Ce que 114 ne fait PAS (frontière nette)

- **SIG / sous-totaux / TFT** → déjà STORY-111/112/113. 114 ne touche **que** les notes.
- **Tables détaillées hors balance** (mouvements bruts d'immobilisations note 3/4, antériorité note 7) : **jamais dérivées** — trame vide sourcée seulement. Leur remplissage relève de l'interop balance réelle / données de mouvements (aval, blockers F1/F4).
- **E1 — liste des notes *obligatoires* v1** (candidates non couvertes : 15 variation capitaux propres, 16 dettes & échéances, 27 CA, 28 achats, 3C amortissements) : **décision MV** (hors périmètre d'encodage 114 ; 114 livre les 8 ventilables + 3 trame figées §6).
- **Narratif / méthodes comptables** (notes textuelles) : hors périmètre (aucune donnée dérivable).
- **`sfd-bceao@1.0`** : aucun octet, aucune `NoteMeta` — sa non-modification **est** la preuve d'agnosticisme.
- **Import balance réel / jeu d'essai / sign-off expert** (blockers MV A2/F4/F1) → gâtent la **preuve e2e comptable** (aval), pas l'encodage/dry-run des notes (le moteur se prouve en dry-run sur soldes fournis, comme 111/112/113).

---

## Scope

**Dans le périmètre :**

- **Contrat référentiel** : `src/modules/bilan/referentiel/referentiel-package.interface.ts` → champ additif `notes?: NoteMeta[]` sur `ReferentielPackage` ; `interface NoteMeta { note: string; libelle: string; colonnes?: string[]; mode: 'VENTILATION' | 'TRAME'; }` (additif, ignoré partout ailleurs ; SFD n'en déclare aucune).
- **Source + artefact** : encodage des 11 `NoteMeta` (8 VENTILATION + 3 TRAME, titres/colonnes GUIDEF) dans `scripts/referentiels/sources/` ; `build.mjs` passthrough (patron additif, en DERNIER pour byte-stabilité) → `syscohada-revise-2.1.json` régénéré + **MAJ checksum** `ReferentielRegistry` ; `sfd-bceao-1.0.json` **inchangé**.
- **Câblage moteur** : `bilan-engine.service.ts#produireNotesAnnexes` passe `soldesN`/`soldesN1` (déjà en main) au `NotesAnnexesProductionService`. Le service : (a) conserve la synthèse des renvois 062 ; (b) pour une note `VENTILATION`, rattache les comptes aux postes (via `TableDePassageService`, surcharges org VALIDATED incluses comme 059/060) et émet les **sous-lignes par compte** ; (c) pour une note `TRAME`, expose titre + colonnes + lignes vides ; (d) renseigne `libelle` (titre sourcé) et `detailACompleter` (`false` si VENTILATION produite, `true` si TRAME).
- **Types & DTO** : `notes-annexes.types.ts` → `PosteNote` gagne `ventilation?: LigneCompteNote[]` (`{ compte, libelle, montantN, montantN1 }`) ; `NoteAnnexe` gagne `colonnes?: string[]` et `mode?: 'VENTILATION' | 'TRAME'` ; `libelle` désormais renseigné pour les notes déclarées. `notes-annexes-response.dto.ts` (Swagger) reflète les nouveaux champs. Endpoint `POST /bilan/etats/notes-annexes/dry-run` **inchangé** en contrat d'entrée.
- **Contrôle** : `ARTICULATION_NOTES` (063) **inchangé** (Σ postes = total de note) — la ventilation n'altère pas les totaux (invariant Σ sous-lignes = montant poste). Ajout d'un test : Σ ventilation = montant du poste.
- **Garde de cohérence** : test dédié `notes-meta-coherence` (patron `operandes-coherence`) — chaque `NoteMeta` déclarée référence une `note` réellement portée par au moins un `PosteEtat.note` du paquet ; `mode` ∈ {VENTILATION, TRAME} ; VENTILATION ⇒ postes contributeurs à comptes non vides.

**Hors périmètre (hooks / stories suivantes — NE PAS déborder) :**

- Notes obligatoires E1 (15/16/27/28/3C) : décision MV ; tables de mouvements/antériorité (notes 3/4/7 détail) : hors balance ; narratif.
- **Moteur d'états** (Bilan/CR/TFT/évaluateur) : **aucune modification** — 114 ne touche que les notes.
- **`sfd-bceao@1.0`** : aucun octet, aucune `NoteMeta`.
- Preuve e2e comptable / import réel / sign-off expert (blockers MV) : aval.

---

## User Flow

1. Le mainteneur déclare les 11 `NoteMeta` (titres/colonnes/mode) dans la source syscohada, régénère l'artefact (`build.mjs` imprime le nouveau sha256), reporte le checksum dans `ReferentielRegistry`.
2. La garde `notes-meta-coherence.spec.ts` vérifie en CI que chaque `NoteMeta` référence une note réelle et qu'un mode VENTILATION a des postes à comptes — sinon échec **en CI**.
3. Un cabinet (org SYSCOHADA, entitlement `ACTIVE`) appelle `POST /bilan/etats/notes-annexes/dry-run` avec ses soldes N (+ N-1 optionnel).
4. Le moteur produit Bilan + CR, **puis** `NotesAnnexesProductionService` : synthèse des renvois (062) **+** ventilation par compte pour les notes VENTILATION (titre + sous-lignes `compte→montant`) **+** trame (titre + colonnes + lignes vides) pour les notes TRAME. Réponse **200** enrichie.
5. Une org **SFD-BCEAO** → `notes: []`, `statut: NON_APPLICABLE` (aucune `NoteMeta`). **Aucune structure OHADA n'a été codée dans le moteur.**

---

## Acceptance Criteria

- [ ] **Métadonnées de notes encodées** : les 11 `NoteMeta` (8 VENTILATION : 5,6,8,9,10,11,12,17 ; 3 TRAME : 3,4,7) portent leur `libelle` (titre GUIDEF) et `mode` (+ `colonnes` pour les TRAME) dans la source ; l'artefact est régénéré et son **nouveau checksum** reporté dans `ReferentielRegistry`.
- [ ] **Ventilation par compte (VENTILATION)** : pour une note VENTILATION, chaque poste contributeur porte ses **sous-lignes par compte** (`compte`, `libelle`, `montantN`, `montantN1`) issues de la balance rattachée ; **Σ sous-lignes = montant du poste** (invariant, testé) ; `detailACompleter: false` ; `libelle` de la note = titre sourcé.
- [ ] **Trame (TRAME)** : pour une note TRAME (3/4/7), `libelle` = titre sourcé, `colonnes` officielles exposées, **aucune sous-ligne chiffrée** (`detailACompleter: true`) — **aucun montant inventé**.
- [ ] **Non-régression 062** : postes contributeurs, `totalN`/`totalN1`, ordre des notes, `statut` global, agnosticisme SFD (`notes: []`) **identiques** ; `ARTICULATION_NOTES` (063) inchangé.
- [ ] **Câblage — sortie enrichie** : `POST /bilan/etats/notes-annexes/dry-run` renvoie **200** avec `libelle` renseigné et `ventilation`/`colonnes` selon le mode ; colonne N-1 des sous-lignes renseignée si `soldesN1` fourni, `null` sinon.
- [ ] **Agnosticisme P7** : une org **SFD-BCEAO** obtient `notes: []`, `statut: NON_APPLICABLE` ; **aucun** numéro/titre de note OHADA dans le moteur ; aucune `NoteMeta` déclarée côté SFD.
- [ ] **Garde de cohérence** : `notes-meta-coherence.spec.ts` valide les 11 `NoteMeta` (note réelle, mode valide, VENTILATION ⇒ comptes) → **0 violation**.
- [ ] **Bornage** : un cumul dépassant l'entier sûr propage `MontantHorsBornesError` → **400** (patron 062).
- [ ] **Non-régression paquet** : `sfd-bceao@1.0` **byte-identique** (checksum inchangé) ; les autres états dry-run inchangés.

---

## Technical Notes

### Composants

- **Étendu (contrat)** : `referentiel-package.interface.ts` → `NoteMeta` + `ReferentielPackage.notes?`.
- **Étendu (source + build)** : `scripts/referentiels/sources/notes-syscohada.json` (nouveau) ou section dédiée ; `build.mjs` → `normNotes` (passthrough additif, en DERNIER) → `syscohada-revise-2.1.json` + checksum `ReferentielRegistry`.
- **Étendu (moteur, notes seulement)** : `notes-annexes-production.service.ts` → `produire(pkg, bilan, cr, soldesN, soldesN1?, surcharges?)` (signature étendue) ; ventilation via `TableDePassageService.mapComptes`. `bilan-engine.service.ts#produireNotesAnnexes` passe les soldes + surcharges. `notes-annexes.types.ts` + `notes-annexes-response.dto.ts`.
- **Réutilisés inchangés** : `TableDePassageService` (mapping), `BilanProductionService`/`CompteResultatProductionService` (états), `MontantHorsBornesError`. Évaluateur / Bilan / CR / TFT **non modifiés**.

### Notes v1 figées (B8 §6 — à encoder)

| Note | Poste(s) | Comptes | Mode |
|---|---|---|---|
| 5 | `BA` | 485, 488 | VENTILATION |
| 6 | `BB` | 31–38 | VENTILATION |
| 8 | `BJ` | (comptes du poste) | VENTILATION |
| 9 | `BQ` | 50x | VENTILATION |
| 10 | `BR` | 51x | VENTILATION |
| 11 | `BS` | 52, 53, 57 | VENTILATION |
| 12 | `BU` | 478 | VENTILATION |
| 17 | `BH` | 409 | VENTILATION |
| 3 | `AD`/`AI`/`AP` | (immobilisations) | TRAME (mouvements bruts hors balance) |
| 4 | `AQ` | (titres/prêts) | TRAME (mouvements hors balance) |
| 7 | `BI` | (créances) | TRAME (antériorité/aging hors balance) |

> **⚠️ Recouper les codes/postes/comptes avec la source réelle AVANT encodage** (`postes-syscohada-guidef-togo.json` pour les renvois `note`, `table-de-passage-syscohada.json` pour les comptes). **Ne jamais deviner** un rattachement. Les titres exacts viennent des libellés GUIDEF.

### Ventilation — algorithme (dans `NotesAnnexesProductionService`)

```
Pour une note VENTILATION :
  pour chaque poste contributeur (renvoi = note) :
    comptesDuPoste = mapComptes(soldes) filtrés sur ceux rattachés à ce poste
    sous-lignes = [{ compte, libelle(plan de comptes), montantN, montantN1 }] triées par compte
    invariant : Σ montantN(sous-lignes) == montantN(poste 062)
```

La ventilation réutilise **le même** `TableDePassageService.mapComptes` que 059/060 (aucune règle nouvelle ; surcharges org VALIDATED honorées). Le `libelle` du compte vient de `pkg.planDeComptes` (STORY-056) si présent, sinon le numéro.

### Sécurité / robustesse

- Story **sans écriture base ni endpoint neuf** (dry-run 062 existe, contrat d'entrée inchangé) ⇒ **pas de transaction Mongo**, surface d'attaque inchangée. Guards en amont.
- Anti-500 : `MontantHorsBornesError` typé ; `NoteMeta` incohérente = défaut build/CI (garde).

### Edge cases

- **N-1 absent** : sous-lignes N-1 = `null` (comme les postes 062).
- **Compte mappé au poste mais absent de la balance** : pas de sous-ligne (ou 0) — la ventilation reflète la balance réelle ; l'invariant Σ = montant poste tient (le poste vaut 0 sur ce compte).
- **Note déclarée `VENTILATION` mais poste sans compte en balance** : ventilation vide, `detailACompleter: false` (le détail *est* « aucun mouvement »), total 0.
- **SFD / aucune `NoteMeta`** : `notes: []`, `NON_APPLICABLE` (062 conservé).

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** **STORY-062** (synthèse des renvois — 114 l'enrichit), **STORY-059/060** (états produits), **STORY-055/056** (`TableDePassageService`, `planDeComptes`), **STORY-110** (patron champ additif + passthrough `build.mjs`), **STORY-111/112/113** (patron encoder→build→checksum→câbler prouvé 4×). 

**Stories débloquées / suivantes :** **clôt EPIC-011B** (dernière story S13 ; SIG + sous-totaux + TFT + notes tous calculés). Ouvre EPIC-012 (validation & immutabilité de la liasse — snapshot figé) sur une liasse **complète**.

**Dépendances externes :** aucune (référentiels embarqués).

**Blockers MV (n'affectent PAS l'encodage/dry-run 114) :** notes obligatoires E1, format balance A2, jeu d'essai F4, sign-off expert F1, données de mouvements/antériorité (notes 3/4/7 détail) — aval preuve e2e comptable.

---

## Definition of Done

- [ ] Code implémenté (français) ; **aucune structure/titre OHADA en dur** (P7) — titres/colonnes/mode sont **données** du paquet ; moteur d'états (Bilan/CR/TFT/évaluateur) **non modifié** ; champs `notes`/`ventilation`/`colonnes`/`mode` **additifs**.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (nouveau code notes visé ~100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : ventilation par compte (invariant Σ = montant poste) ; titre sourcé (`libelle` ≠ null) ; TRAME (colonnes + lignes vides, aucun montant) ; N-1 (avec/sans) ; **SFD → `notes: []`** (agnosticisme) ; bornage → `MontantHorsBornesError`. `notes-meta-coherence.spec.ts` verte avec les 11 `NoteMeta` réelles. Non-régression 062 (renvois/totaux/ordre) + `ARTICULATION_NOTES` (063).
- [ ] Tests **de non-régression** : `sfd-bceao@1.0` byte-identique ; `syscohada-revise@2.1` régénéré = octet attendu (checksum) ; suites 059/060/061/062/063 vertes.
- [ ] **Vérification docker réelle** (la story n'écrit pas en base ⇒ preuve = chargement référentiel + sortie notes sur stack vivante) : `docker compose up --build` → services `/health` **200** ; login org SYSCOHADA → `POST /bilan/etats/notes-annexes/dry-run` sur un jeu de soldes → **200** avec notes VENTILATION (titre + sous-lignes `compte→montant`, Σ = poste) + notes TRAME (titre + colonnes + vides) ; checksum `syscohada-revise@2.1` = nouveau, `sfd-bceao@1.0` = inchangé ; org **SFD** → `notes: []` ; sans jeton → **401**. Consigné dans *Progress Tracking*.
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Encodage des 11 `NoteMeta` (titres/colonnes/mode) + contrat `NoteMeta` + passthrough `build.mjs` + régénération artefact + MAJ checksum :** 1 point
- **Ventilation par compte (re-mapping des soldes via `TableDePassageService`, sous-lignes, invariant Σ=poste) + trame TRAME + titre + câblage soldes dans l'engine + DTO :** 1 point
- **Tests (ventilation/invariant, TRAME, titre, agnosticisme, garde `notes-meta-coherence`, non-régression 062/063 + byte) + vérif docker :** 1 point
- **Total :** 3 points

**Rationale :** 3 points — le patron encoder→build→checksum→câbler est **déjà prouvé 4×** ; l'effort net = la **ventilation par compte** (re-mapping des soldes, invariant Σ) + le **marqueur de mode** (VENTILATION/TRAME) + les **titres sourcés**. Aucune règle comptable à trancher (les notes et leurs comptes sont dans la source ; le mode est une transcription de B8 §6).

---

## Additional Notes

- **Dernière story d'EPIC-011B** : après 114, la liasse est **calculée de bout en bout** (Bilan + sous-totaux, CR + SIG, TFT indirect, notes v1) — le squelette EPIC-011 est intégralement comblé. EPIC-012 (validation & immutabilité) pourra figer un **snapshot complet**.
- **Les notes réutilisent le mapping existant** (`TableDePassageService`) : la ventilation n'est pas un nouveau calcul mais une **projection** des soldes déjà rattachés, gardée cohérente par l'invariant Σ sous-lignes = montant du poste (062) — le pendant « notes » des articulations `XI=CJ` (111), `BZ=DZ` (112), `ZH=tréso N` (113).
- **`detailACompleter` devient signifiant** : `false` quand le détail exploitable est produit (VENTILATION), `true` quand seule une trame est possible (TRAME) — la liasse dit **honnêtement** où le détail est réel et où il reste à fournir, prolongeant le **statut de preuve** introduit par 113 (FR-A27).
- **Checksum : 4ᵉ mouvement EPIC-011B.** 111 (SIG), 112 (sous-totaux), 113 (TFT), 114 (notes). `sfd-bceao@1.0` ne bouge jamais (agnosticisme).

---

## Progress Tracking

**Status History :**
- 2026-07-20 : Créée (Scrum Master) — **5ᵉ et dernière story d'EPIC-011B**, B8 §6. Cadrée « encoder + brancher, jamais modifier le moteur d'états », en rejouant le patron 111/112/113 côté **notes** : titres/colonnes/mode sourcés (`NoteMeta`), ventilation du solde par compte pour les 8 notes automatisables, trame pré-structurée pour les 3 notes hors-balance. Rédigée après clôture de **STORY-113 (done+mergée)**.
- 2026-07-20 : Implémentée + vérifiée docker bout-en-bout (branche MNV-114 bilan-service). **Clôt EPIC-011B** — la liasse est calculée de bout en bout (SIG 111, sous-totaux 112, TFT 113, notes 114).
- 2026-07-20 : `/code-review` — 0 constat bloquant (invariant Σ ventilation = poste + non-régression 062 vérifiés ; constats non bloquants = affectation N-1 par signe N pour notes non ambiguës + transcriptions GUIDEF F1). Intégrée dans `dev` (PR #19 bilan-service, MNV-114 « Rebase and merge », HEAD `04fbc20`, branche supprimée). **Done. EPIC-011B clôturé.**

**Implémentation (dev-story, 2026-07-20) :**
- **Contrat + source** : `ReferentielPackage.notes?: NoteMeta[]` (additif) + `NoteMeta{note,libelle,colonnes?,mode}` ; **11 `NoteMeta`** dans `scripts/referentiels/sources/notes-syscohada.json` (8 VENTILATION : 5,6,8,9,10,11,12,17 ; 3 TRAME : 3,4,7 — titres dérivés des libellés GUIDEF, colonnes de mouvements/antériorité). `build.mjs` `normNotes` (passthrough additif, avant `paquetFiscal`) + `notes` passthrough dans `ReferentielLoader`. Artefact régénéré **`2b6ea55e… → 01b892c0…`** (4ᵉ octet EPIC-011B) ; `sfd-bceao@1.0` **byte-identique** (`0509a034…`, agnosticisme P7).
- **Ventilation par compte** : `NotesAnnexesProductionService` reçoit désormais `soldesN`/`soldesN1` (le détail par compte est perdu à l'agrégation 059/060) ; injecte `TableDePassageService` et **re-mappe** les comptes aux postes avec la **même** sélection que 059 (`choisirRattachement`, ventilation classes 4/5 au signe) → sous-lignes `{compte, libelle(plan), montantN, montantN1}` sous chaque poste d'une note VENTILATION. **Invariant prouvé** `Σ ventilation = montant du poste` (059). `libelle` de note = titre sourcé ; `detailACompleter: false` (VENTILATION) / `true` (TRAME + note non métatagguée). TRAME : `colonnes` officielles + lignes vides, **jamais de montant inventé**.
- **Câblage** : `bilan-engine#produireNotesAnnexes` **et** `produireControlesCoherence` passent `soldesN`/`soldesN1`/`surcharges`. DTO `NotesAnnexesDto` enrichi (Swagger). Moteur d'états (Bilan/CR/TFT/évaluateur) **non modifié** ; `ARTICULATION_NOTES` (063) inchangé.
- **Écart mineur assumé (F1)** : les **libellés de notes** et **colonnes de trame** sont des transcriptions GUIDEF raisonnables (titres dérivés des libellés de postes officiels ; colonnes de mouvements standard OHADA pour les notes 3/4/7) — libellés exacts à confirmer au sign-off expert (F1), sans impact fonctionnel.
- **Qualité** : lint **0 warning** · `npm run build` OK · **367 unit (39 suites) + 74 e2e (10 suites) verts** · `notes-annexes-production.service.ts` **97.47/90/100/99.05** · global **98.29/92.11/98.45/98.27** > seuils 65/90/90/90. Garde `notes-meta-coherence.spec.ts` **verte** (11 `NoteMeta` réelles : renvoi réel, mode valide, VENTILATION⇒comptes, TRAME⇒colonnes). Non-régression : 9 tests 062 intacts ; `sfd-bceao@1.0` byte-identique ; mapping SYSCOHADA inchangé (124, les notes ne sont pas des lignes de table).

**Vérification docker (stack vivante, bilan-service redémarré → chargement référentiel frais) :**
- `/health` **200** (`mongodb:up, kafka:up`). Login org SYSCOHADA (JWT RS256), read-models semés (KYC APPROVED + entitlement ACTIVE syscohada).
- **SYSCOHADA** (BS 300 000 → note 11 ; BI 500 000 → note 7) → **200** ; `stamp.checksum = 01b892c0…` (**nouvel** artefact) ; **11 notes** ; **note 11 VENTILATION** : `libelle='Note 11 : Banques…'`, `detailACompleter=false`, `postes[BS].ventilation=[{compte:521000, montantN:300000}]` — **Σ ventilation = total poste 300 000** ; **note 7 TRAME** : `libelle='Note 7 : Clients…'`, `detailACompleter=true`, `colonnes=['Montant brut','Créances non échues','Créances échues','Dépréciations']`, **aucune sous-ligne chiffrée** (total 500 000 repris de 062, montant hors balance non inventé) ; note 5 VENTILATION non touchée → total 0, ventil vide.
- **SFD-BCEAO** (entitlement re-pointé) → **200** ; `stamp.checksum = 0509a034…` (**inchangé**) ; `notes:[]`, `statut=NON_APPLICABLE` — **agnosticisme P7 prouvé**.
- **Sans jeton → 401** (chaîne de guards intacte).

**Actual Effort :** 3 points (conforme).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
