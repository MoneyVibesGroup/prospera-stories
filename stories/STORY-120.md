# STORY-120 : **SFD-BCEAO complet** `@2.0` — totaux du Bilan + SIG DIMF 2080 (compléter l'amorce allégée `@1.0`) — FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service) — **extension** (EPIC-010 clos ; réouverture ciblée pour compléter le SFD)
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-007 (multi-référentiel SYSCOHADA + SFD-BCEAO)
**Réf. analyse :** `docs/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §1 · `docs/referentiels/README-sfd-bceao.md`
**Réf. code livré :** STORY-057 (`sfd-bceao@1.0` allégé) · STORY-110/111/112 (modèle d'opérandes + évaluateur `FORMULE` + sous-totaux/SIG) · STORY-038 (loader/registre)
**Priorité :** Should Have
**Story Points :** 5 (incr. 1 ≈ 3 · incr. 2 ≈ 2 — total **inchangé**)
**Statut :** done ✅ — clôturée le **2026-07-25** (AC-1 → AC-15 validés, vérif docker faite, PR #34 rebase-mergée sur `dev`)
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-21 (incr. 2 cadré et livré le 2026-07-25)
**Sprint :** 15 (ajout hors engagement initial — extension EPIC-010/FR-007)

---

## User Story

**En tant qu'**organisation de type SFD/microfinance (et l'opérateur du référentiel PROSPERA),
**je veux** un référentiel SFD-BCEAO **complet** — avec les **totaux du Bilan** et les **Soldes Intermédiaires de Gestion** (SIG) du **DIMF 2080** —,
**afin de** produire un Compte de résultat SFD avec une **ligne de résultat** (excédent/déficit) et un Bilan avec ses grands totaux **équilibrés**, sans fork de code (P7).

---

## Description

### Contexte
`sfd-bceao@1.0` (STORY-057) est une **amorce allégée** : classes 1-7 en **détail** seulement — le Bilan n'a **aucun total calculé** et le Compte de résultat s'arrête aux charges/produits, **sans SIG ni bottom line**. Depuis, le moteur B8 sait évaluer des postes `regle='FORMULE'` via des **opérandes signées** (STORY-110/111/112). On peut donc **compléter** le SFD **en données pures**, sans toucher au moteur.

### Ce que `@2.0` ajoute (cf. analyse §1.2/§1.3, sourcé RCSFD, à valider par expert SFD)
- **Totaux Bilan** : postes `FORMULE` **BAT = ΣBAi** / **BPT = ΣBPi** (marqueurs `role` TOTAL_ACTIF/TOTAL_PASSIF) ; le résultat (compte 59) étant déjà logé dans BP4 → équilibre `BAT = BPT`.
- **SIG DIMF 2080** : cascade `FORMULE` **RSA** (résultat financier) → **RSB** (autres activités) → **RSC** (résultat brut d'exploitation) → **RSD** (résultat d'exploitation, cpte 595) → **RSE** (résultat exceptionnel, 596) → **RSF** (avant impôt) → **RSG** (excédent/déficit net, 592).
- **Toujours pas de TFT** : le RCSFD **n'en prévoit pas** → aucun marqueur `tresorerie` (agnosticisme P7 conservé).

### Additif — `@1.0` intact
`@2.0` est une **nouvelle version packagée** ; `@1.0` (et ses 4 specs) reste embarqué. Les versions coexistent (loader keyé `code@version`). **Même** plan de comptes réutilisé.

### ⚠️ Constat de l'incrément 2 — **mesuré**, pas supposé (2026-07-24)
Le paquet `@2.0` **packagé** en incr. 1 est **chargeable et cohérent**, mais le moteur n'en calcule **que la moitié**. Exécution du moteur sur `sfd-bceao@2.0` avec une balance SFD de démonstration :

| Ce qui marche déjà | Ce qui ne produit **rien** |
|---|---|
| **SIG CR** : `cr.sig` = RSA→RSG calculés en cascade ; `cr.coherenceSig = { resultatNetSig = RSG, resultatNetDirect, ecart: 0, coherent: true }` | **Totaux Bilan** : `bilan.sousTotaux = []` et `bilan.coherenceSousTotaux = { bz: null, dz: null, ecartEquilibre: null, equilibre: true, coherent: true }` |

**Cause racine (données, pas moteur)** : `BilanProductionService.produireSousTotaux()` ne retient que les règles `FORMULE` de l'**état de présentation** `'BILAN'` ([bilan-production.service.ts:152-158](bilan-service/src/modules/bilan/etats/bilan-production.service.ts#L152-L158)) — patron STORY-112, où SYSCOHADA déclare `BZ`/`DZ` avec `etat: 'BILAN'` et des opérandes portant `etatSource: 'BILAN_ACTIF' | 'BILAN_PASSIF'`. Or `@2.0` déclare `BAT`/`BPT` **directement** sur `BILAN_ACTIF`/`BILAN_PASSIF` : aucune formule d'état `BILAN` ⇒ cascade jamais évaluée. `FORMULE` n'étant ni dans `REGLES_ACTIF` ni dans `REGLES_PASSIF`, les deux postes n'apparaissent pas non plus en lignes de détail : ils sont **silencieusement absents**.

**Aggravant — fausse assurance** : sans sous-total, `equilibre` et `coherent` valent `true` par **non-applicabilité** ; `ControlesCoherenceProductionService` en déduit `EQUILIBRE_BILAN` OK et `valide = true`. Un Bilan SFD **sans aucun total** franchit donc aujourd'hui le gate de validation (STORY-064) sans qu'aucun contrôle ne rougisse. C'est exactement ce que la règle « un test qu'un code bugué franchit est une fausse assurance » vise.

**Second manque, comptable** : `BPT = Σ BP1..BP4` ne contient le résultat de l'exercice que si la balance importée est **post-affectation** (compte `592` crédité). Sur une balance **avant affectation** (classes 6/7 chargées, `59` vide) — le cas normal d'un import Sage — le résultat n'est nulle part au passif et `BAT ≠ BPT`. Le moteur sait le placer, mais **seulement** sur le poste marqué `role: 'RESULTAT_BILAN'` ([bilan-production.service.ts:219-221](bilan-service/src/modules/bilan/etats/bilan-production.service.ts#L219-L221)) — marqueur que `@2.0` ne pose sur **aucun** poste (SYSCOHADA le pose sur `CJ`).

**Conséquence de cadrage** : l'incrément 2 est **majoritairement une correction de données** du paquet `@2.0` (déplacement d'état + marqueur + rebuild/checksum) **plus** la preuve de bout en bout. **Aucune modification du moteur n'est attendue** (invariant P7) : si le dev croit devoir toucher `etats/*.service.ts`, c'est le signe qu'il encode du SFD en dur → s'arrêter et remonter la question.

---

## Scope

**Dans le périmètre — incrément 1 (LIVRÉ 2026-07-21) :**
- Sources `postes-sfd-v2.json` (+ SIG + totaux) et `table-de-passage-sfd-v2.json` (+ règle `FORMULE`, opérandes) ; **plan réutilisé** (`plan-comptable-sfd.json`).
- Entrée `sfd-bceao@2.0` dans `build.mjs` + `ReferentielRegistry` (checksum réel).
- Spec de cohérence (CC1..CC4) + preuve « `@2.0` apporte les `FORMULE` que `@1.0` n'avait pas ».

**Dans le périmètre — incrément 2 (LIVRÉ 2026-07-25) :**
- **Correction de données** du paquet `@2.0` : `BAT`/`BPT` portés par l'**état de présentation** `'BILAN'` avec opérandes `etatSource`, et `role: 'RESULTAT_BILAN'` posé sur `BP4` (§ Technical Notes).
- **Rebuild déterministe** + propagation du **nouveau** checksum `sfd-bceao@2.0` (registre + `meta.checksum`), **sans toucher** aux checksums SYSCOHADA et SFD@1.0.
- **Adaptation de la spec CC4** à la cascade inter-états (une opérande peut viser un poste `FORMULE` du même état de présentation).
- **Preuve de production réelle** : specs de production Bilan+CR+contrôles sur balance SFD **équilibrée**, avant **et** après affectation du résultat, + **mutation-tests** consignés.
- **Vérification docker réelle** (chargement du paquet + calcul dans `prospera-bilan-service-1`) consignée en *Progress Tracking*.

**Hors périmètre (explicite) :**
- **Toute modification du moteur** (`src/modules/bilan/etats/*.ts`) — invariant P7 : le SFD se complète **en données**.
- **TFT SFD** : le RCSFD n'en prévoit pas → aucun marqueur `tresorerie`, `VARIATION_TRESORERIE` reste non applicable.
- **Validation experte** de l'ordonnancement des SIG (cascade proposée, ancrée sur les comptes 592-596) → reste un blocker métier, **ne bloque pas** la livraison technique.
- **Attribution d'un entitlement `sfd-bceao@2.0` à une org via le catalogue** (`platform-catalog-service` : `ReferentielVersion` + grant → `entitlement.changed`). En vérif docker, le read-model est **positionné directement en base** (§ Vérification docker), ce qui prouve le moteur sans déborder sur EPIC-007.
- **Notes annexes SFD** (`NoteMeta`) et export DSF spécifique SFD.
- Migration de données (aucune : versions coexistantes, dev repart de zéro).

---

## User Flow

1. Un SFD est onboardé avec l'entitlement `bilan` `ACTIVE` portant `referentiel = { code: 'sfd-bceao', version: '2.0' }`.
2. Il importe sa balance SFD (classes 1-7 du RCSFD) — amont `balance-service`, ou soldes fournis au dry-run.
3. Il demande son Bilan : chaque poste `BA1..BA4` / `BP1..BP4` est agrégé, **puis** `BAT`/`BPT` sont calculés, le résultat de l'exercice étant absorbé par `BP4`.
4. Il demande son Compte de résultat : les charges/produits sont agrégés, **puis** la cascade `RSA → RSG` déroule les SIG DIMF 2080 — `RSG` est son **excédent/déficit net**.
5. Il demande les contrôles : `EQUILIBRE_BILAN` (`BAT = BPT`) et `COHERENCE_RESULTAT` (`RSG` = résultat au passif) sont **réellement applicables** et `OK` ⇒ `valide = true`, la liasse peut être validée (STORY-064) puis figée (STORY-065).

---

## Acceptance Criteria

### Incrément 1 — faits (2026-07-21)
- [x] **AC-1 — Packagé & chargeable.** `resolve('sfd-bceao','2.0')` ≠ null ; `load` renvoie un paquet plan/postes/mapping non vides ; checksum falsifié → `ReferentielIntegrityError`.
- [x] **AC-2 — Plan bien formé (CC1) & plan ⊇ table (CC2).** Classes 1-7, 0 orphelin.
- [x] **AC-3 — Déterminisme (CC3).** `build.mjs` reproductible ; checksum registre = sha256 artefact = `meta.checksum`.
- [x] **AC-4 — Cascades FORMULE intègres (CC4).** Chaque opérande des postes `FORMULE` (BAT/BPT/RSA..RSG) référence un poste **déclaré** du même état.
- [x] **AC-5 — Complétude vs `@1.0`.** `@2.0` déclare ≥ 1 poste `FORMULE` (totaux + SIG) là où `@1.0` n'en a **aucun** ; **même** plan de comptes.
- [x] **AC-6 — Non-régression.** `sfd-bceao@1.0` et `syscohada-revise@2.1` **inchangés** (artefacts, checksums, specs).

### Incrément 2 — à faire
- [x] **AC-7 — Totaux du Bilan réellement calculés.** Sur une balance SFD **équilibrée**, `produire()` renvoie `sousTotaux` contenant **`BAT` et `BPT`** (dans cet ordre de cascade), et `coherenceSousTotaux` vaut : `bz = totalActifDirect`, `dz = totalPassifResultatDirect`, `ecartEquilibre = 0`, `equilibre = true`, `coherent = true`. **`bz`/`dz` ne sont plus `null`** — la non-applicabilité du contrôle disparaît.
- [x] **AC-8 — Résultat de l'exercice placé au passif, une seule fois.** `BP4` porte `role: 'RESULTAT_BILAN'`. Deux specs distinctes :
  - **avant affectation** (classes 6/7 chargées, `592` à 0) : `BPT` inclut le résultat net et `BAT = BPT` ;
  - **après affectation** (`592` crédité, classes 6/7 à 0) : `resultatNet = 0`, le résultat n'est compté **qu'une fois** via le solde de `BP4`, et `BAT = BPT`.
- [x] **AC-9 — SIG de bout en bout & articulation.** `cr.sig` expose `RSA, RSB, RSC, RSD, RSE, RSF, RSG` ; `cr.coherenceSig.coherent = true` avec `resultatNetSig = RSG = resultatNetDirect` ; et **`RSG` = le résultat absorbé par `BP4`** (jonction CR ↔ Bilan explicitement assertée, pas déduite).
- [x] **AC-10 — Contrôles de cohérence applicables.** Via `POST /api/v1/bilan/etats/controles/dry-run` (référentiel effectif `sfd-bceao@2.0`) : `EQUILIBRE_BILAN` **OK et applicable** (libellé de la variante sous-totaux), `COHERENCE_RESULTAT` OK, `VARIATION_TRESORERIE` non applicable (pas de TFT), `valide = true`. Sur une balance **déséquilibrée**, `EQUILIBRE_BILAN` passe **KO** et `valide = false`.
- [x] **AC-11 — Aucune modification du moteur (P7).** Le diff de la story ne touche **aucun** fichier de `src/modules/bilan/etats/` ni `table-de-passage/` : uniquement `scripts/referentiels/sources/*sfd-v2*.json`, l'artefact `assets/sfd-bceao-2.0.json`, `referentiel-registry.ts` (checksum) et des specs. À énoncer dans la PR.
- [x] **AC-12 — Déterminisme & non-régression re-prouvés.** `node scripts/referentiels/build.mjs` régénère les 5 artefacts ; le **nouveau** checksum `sfd-bceao@2.0` est propagé au registre ; `syscohada-revise@2.1` = `01b892c057…` et `sfd-bceao@1.0` = `0509a034…` restent **byte-identiques** (spec CC3 verte sur les 5 paquets, `git diff` vide sur ces deux artefacts).
- [x] **AC-13 — Mutation-tests consignés** (chacun doit faire **virer au rouge** la spec citée, puis être restauré) :
  - retirer `role: 'RESULTAT_BILAN'` de `BP4` → AC-8 « avant affectation » rouge ;
  - remettre `BAT` sur l'état `BILAN_ACTIF` → AC-7 rouge (`sousTotaux` vide) ;
  - inverser un signe d'opérande de `RSG` → AC-9 rouge.
- [x] **AC-14 — Vérification docker réelle.** Chargement du paquet + calcul du Bilan/CR/contrôles SFD constatés dans `prospera-bilan-service-1`, requêtes `mongosh` et réponses HTTP **collées** en *Progress Tracking* (§ Vérification docker).
- [x] **AC-15 — Qualité.** Lint 0 warning · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts · Swagger inchangé (aucun endpoint nouveau).

---

## Technical Notes

### 1. Correction de données — `BAT`/`BPT` sur l'état de présentation `BILAN`
Fichier source : `bilan-service/scripts/referentiels/sources/table-de-passage-sfd-v2.json`.

**Aujourd'hui (inopérant)** :
```json
{ "etat": "BILAN_ACTIF", "poste": "BAT", "type": "total", "regle": "FORMULE", "comptesSyscohada": [],
  "operandes": [{ "poste": "BA1", "signe": "+" }, …], "role": "TOTAL_ACTIF" }
```
**Cible (patron STORY-112, identique à `BZ`/`DZ` de SYSCOHADA)** :
```json
{ "etat": "BILAN", "poste": "BAT", "type": "total", "regle": "FORMULE", "comptesSyscohada": [],
  "operandes": [
    { "poste": "BA1", "signe": "+", "etatSource": "BILAN_ACTIF" },
    { "poste": "BA2", "signe": "+", "etatSource": "BILAN_ACTIF" },
    { "poste": "BA3", "signe": "+", "etatSource": "BILAN_ACTIF" },
    { "poste": "BA4", "signe": "+", "etatSource": "BILAN_ACTIF" }
  ], "role": "TOTAL_ACTIF" }
```
Idem `BPT` avec `etatSource: "BILAN_PASSIF"` sur `BP1..BP4`. Points de vigilance :
- **`etatSource` est obligatoire ici** : sans lui, l'évaluateur résout l'opérande dans l'état de la formule (`'BILAN'`) → `OperandeNonResolueError` ([evaluateur-formule.service.ts:113-127](bilan-service/src/modules/bilan/etats/evaluateur-formule.service.ts#L113-L127)).
- **`type: 'total'` doit rester** : le seed du contexte n'amorce que les postes `type: 'detail'` — un total amorcé à 0 serait écrasé/ambigu.
- **Ordre de déclaration = ordre de cascade** : déclarer `BAT` puis `BPT` après tous les postes de détail du Bilan.
- **Liste `postes`** (`postes-sfd-v2.json`) : garder `BAT` sous `BILAN_ACTIF` et `BPT` sous `BILAN_PASSIF` — c'est ainsi que SYSCOHADA déclare `BZ`/`DZ` (présentation), et `libellesPostes()` indexe par code sans regarder l'état. Ne **pas** inventer un état `BILAN` dans `postes`.

### 2. Placement du résultat — `role: 'RESULTAT_BILAN'` sur `BP4`
`BP4` (« Provisions, fonds propres et assimilés », `SOLDE_CREDITEUR` sur `50..59`) est le poste qui accueille le compte `59` *Résultat*. Ajouter `"role": "RESULTAT_BILAN"` sur **sa** règle : `contexteDetailBilan()` **additionne** alors `resultatNet` (= Σ CR crédit − débit, donc les classes 6/7) au solde propre de `BP4`. Les deux régimes de balance sont couverts sans branche conditionnelle :

| Balance | `resultatNet` (classes 6/7) | Solde `59` dans `BP4` | `BP4` final |
|---|---|---|---|
| avant affectation | = résultat | 0 | solde + résultat ✅ |
| après affectation | 0 | = résultat | solde + 0 ✅ |

⚠️ **Cas de données dégradé à documenter, pas à corriger** : une balance qui porte **à la fois** `592` crédité **et** des classes 6/7 non soldées double-compterait le résultat → `BAT ≠ BPT` et `EQUILIBRE_BILAN` **KO**. C'est le comportement voulu (le contrôle rougit sur une balance incohérente) ; l'énoncer en commentaire de la source JSON.
`role` est un union type fermé (`'RESULTAT_BILAN' | 'TOTAL_ACTIF' | 'TOTAL_PASSIF'`, [referentiel-package.interface.ts:133](bilan-service/src/modules/bilan/referentiel/referentiel-package.interface.ts#L133)) — aucune extension nécessaire.

### 3. Rebuild & checksum
```bash
cd bilan-service && node scripts/referentiels/build.mjs      # imprime le sha256 de chaque artefact
```
Reporter le **nouveau** sha256 de `sfd-bceao-2.0.json` dans `referentiel-registry.ts` (entrée `'sfd-bceao@2.0'`, aujourd'hui `ee9bf014aa…` → **va changer**). Les entrées SYSCOHADA (`01b892c057…`) et SFD@1.0 (`0509a034…`) doivent rester **identiques** : `build.mjs` sérialise les champs additifs par spread conditionnel exactement pour ça ([build.mjs:107-115](bilan-service/scripts/referentiels/build.mjs#L107-L115)) — un `git diff` non vide sur ces deux artefacts = régression, ne pas « re-committer le nouveau checksum » pour faire passer la spec.

### 4. Spec CC4 à adapter (cascade inter-états)
`referentiels-additionnels-coherence.spec.ts` (CC4) résout chaque opérande dans `codesParEtat.get(op.etatSource ?? f.etat)`. Avec `BAT` en `etat: 'BILAN'`, `codesParEtat` n'a **aucune** clé `'BILAN'` (les `postes` déclarent `BAT` sous `BILAN_ACTIF`) → CC4 **casserait**. Élargir la résolution à ce que fait réellement l'évaluateur : une opérande est valide si son poste est **soit** déclaré dans `postes` pour `etatSource ?? f.etat`, **soit** un poste `FORMULE` déclaré dans la table de passage pour ce même état (cascade réinjectée). Ne pas neutraliser CC4 ni la `skip`.

### 5. Fichiers concernés (périmètre du diff attendu)
| Fichier | Nature |
|---|---|
| `scripts/referentiels/sources/table-de-passage-sfd-v2.json` | états `BILAN` + `etatSource` + `role` sur `BP4` |
| `scripts/referentiels/sources/postes-sfd-v2.json` | inchangé sauf besoin de libellé (à justifier) |
| `src/modules/bilan/referentiel/assets/sfd-bceao-2.0.json` | **régénéré** par `build.mjs` (jamais édité à la main) |
| `src/modules/bilan/referentiel/referentiel-registry.ts` | nouveau checksum `sfd-bceao@2.0` |
| `src/modules/bilan/referentiel/referentiels-additionnels-coherence.spec.ts` | CC4 élargie |
| `src/modules/bilan/etats/*.spec.ts` (ou une spec dédiée `sfd-bceao-liasse.spec.ts`) | AC-7/8/9/10/13 sur paquet réel |

### 6. Sécurité
Aucune surface d'attaque nouvelle : pas d'endpoint, pas de DTO, pas de champ persisté. Les dry-run restent derrière la chaîne `Throttler → JwtAuth → EmailVerified → Roles` + `@RequiresBilanAccess` (KYC `APPROVED` + entitlement `ACTIVE`), et l'intégrité du paquet reste garantie par le checksum (`ReferentielIntegrityError`). Ne pas journaliser de montants d'organisation.

---

## Dependencies

### Stories prérequises (toutes `done` — aucun blocage technique)
| Story | Service | Ce qu'elle fournit et **pourquoi c'est requis ici** |
|---|---|---|
| **STORY-032** | platform-catalog-service | `ReferentielVersion` au catalogue — c'est là que `sfd-bceao@2.0` sera un jour **offrable** (hors périmètre, cf. Scope). |
| **STORY-033 / 034** | platform-catalog-service | Entitlements (grant/revoke) + événement `entitlement.changed` (outbox) — la **source** du référentiel effectif d'une org. |
| **STORY-036** | bilan-service | Read-models locaux + consumers Kafka idempotents — `OrgBilanEntitlement` porte `referentiel { code, version }`, **seule** voie de résolution (aucun appel REST au catalogue sur le chemin chaud, invariant n°3). |
| **STORY-037** | bilan-service | Gate `@RequiresBilanAccess` — les dry-run utilisés en AC-10/AC-14 en dépendent (KYC `APPROVED` + entitlement `ACTIVE`). |
| **STORY-038** | bilan-service | `ReferentielLoader` + `ReferentielRegistry` + `BundledArtifactSource` (checksum, cache) — **AC-1/AC-3/AC-12** reposent dessus. |
| **STORY-054** | bilan-service | `resolveReferentielForOrg` : résolution liée à l'entitlement `ACTIVE` + tampon du référentiel effectif — le chemin par lequel `sfd-bceao@2.0` est chargé. |
| **STORY-055** | bilan-service | `TableDePassageService` (longest-prefix, comptes non mappés) — l'agrégation SFD des classes 1-7. |
| **STORY-056** | bilan-service | Paquet SYSCOHADA + `build.mjs` **déterministe** — le pipeline de build et le patron de non-régression de checksum. |
| **STORY-057** | bilan-service | `sfd-bceao@1.0` + `plan-comptable-sfd.json` — le **plan réutilisé** et la baseline « allégée » comparée en AC-5/AC-6. |
| **STORY-058** | bilan-service | Surcharges de mapping org (VALIDATED) — traversées par le même chemin ; à laisser vides dans les specs (non-régression 055 strict). |
| **STORY-059** | bilan-service | `BilanProductionService` (agrégation actif/passif, contrôle actif = passif + résultat) — **le consommateur** des totaux à corriger. |
| **STORY-060** | bilan-service | `CompteResultatProductionService` (+ cohérence résultat) — porte la cascade SIG, **déjà fonctionnelle** en SFD. |
| **STORY-063** | bilan-service | `ControlesCoherenceProductionService` + drapeau `valide` — **AC-10** s'y branche ; c'est aussi lui qui produit la fausse assurance décrite plus haut. |
| **STORY-110** | bilan-service | `MappingRule.operandes` + `EvaluateurFormuleService` (cascade, `etatSource`, `mode`) — **le socle** de `BAT`/`BPT`/`RSA..RSG`. |
| **STORY-111** | bilan-service | SIG en opérandes signées + calcul dans le CR + articulation `CJ = XI` — le patron dont **AC-9** est le pendant SFD (`RSG`). |
| **STORY-112** | bilan-service | Sous-totaux Bilan en état de présentation `'BILAN'` + `role` TOTAL_ACTIF/TOTAL_PASSIF/RESULTAT_BILAN + contrôle `BZ = DZ` — **le patron exact** que l'incrément 2 applique au SFD. La cause racine du constat est un écart à ce patron. |
| **STORY-064 / 065** | bilan-service | Gate de validation sur contrôles bloquants + snapshot immuable — **l'enjeu** de la fausse assurance : sans AC-7, une liasse SFD sans totaux se valide et se **fige**. |

**Non prérequis, contrairement à l'intuition :**
- **STORY-078** (`balance-service` — chargement référentiel + paquet fiscal) : deux axes **séparés**. Le paramétrage amont ne conditionne pas le calcul aval, et ⚠️ **ne jamais lire le `paquetFiscal` embarqué dans l'artefact comptable** (périmé).
- **STORY-113** (TFT) : le RCSFD ne prévoit pas de TFT → sans objet.
- **STORY-114** (notes annexes) : `@2.0` ne déclare aucune `NoteMeta` → `ARTICULATION_NOTES` non applicable.
- **STORY-101/086/099** (`balance-service` CORE, balance canonique taguée SFD-BCEAO) : utiles à un import **réel**, mais les AC passent par les soldes fournis au dry-run.

### Stories dépendantes / impactées par celle-ci
| Story | Lien de dépendance |
|---|---|
| **STORY-121** (`zone-franche-togo@1.0`, `in_progress`) | **Couplage de fichiers** : partage `scripts/referentiels/build.mjs` et la spec `referentiels-additionnels-coherence.spec.ts`. Toute modification de CC4 (§4) la concerne → **enchaîner 120 puis 121/122**, jamais en parallèle sur `dev`, sinon conflit + rebuild croisé des checksums. |
| **STORY-122** (`cima-assurances@1.0`, `in_progress`) | Même couplage. En plus, **même incrément 2 à faire** : le paquet CIMA déclare-t-il ses `FORMULE` sur l'état de présentation attendu ? Le constat §Contexte doit être **rejoué** sur CIMA (probable défaut identique) → à cadrer dans STORY-122, **pas ici**. |
| **STORY-064 / 065** (`done`) | Bénéficiaires : après 120, une liasse SFD ne peut plus être validée/figée sans totaux ni équilibre réellement contrôlés. Aucune reprise de données (dev repart de zéro). |
| **STORY-073** (export PDF/Excel, `done`) | Consommateur aval : l'export d'une liasse SFD affichait des totaux absents → devient exploitable. Non modifié par cette story ; à re-tester en non-régression si l'export lit `sousTotaux`. |
| **Attribution catalogue `sfd-bceao@2.0`** (à créer, EPIC-007) | Story **suivante** nécessaire pour qu'un SFD réel reçoive `@2.0` : `ReferentielVersion` au catalogue + grant → `entitlement.changed` → read-model. Hors périmètre ici (vérif docker par insertion directe du read-model). |
| **Validation experte SFD** (blocker métier, hors dev) | La cascade `RSA..RSG` et l'ancrage `592/595/596` restent **à faire valider**. Ne bloque pas la livraison technique ; à tracer comme finding si non levé à la clôture. |

**Dépendances externes :** aucune (paquets embarqués dans l'image, aucun appel réseau). Docker : Mongo (rs0) + `bilan-service` + `auth-service` (jeton) suffisent — **Kafka non requis** pour ces AC (démarrage dégradé, invariant n°4).

---

## Vérification docker (AC-14) — recette

```bash
# 1. Stack neuve (les volumes sont réinitialisables : dev repart de zéro)
cd /Users/vivian/Documents/Workspace/PROSPERA && docker compose down -v
docker compose up -d mongo kafka redis mailhog auth-service bilan-service
docker compose logs -f bilan-service   # attendre « Found 0 errors. Watching for file changes. »

# 2. Jeton tenant : register + login sur l'IdP (les .env ne sont pas lisibles)
#    → récupérer accessToken + organizationId (sub/org du JWT)

# 3. Positionner le référentiel effectif de l'org (⚠️ read-model SANS collection explicite
#    → nom Mongoose par défaut ; TOUJOURS lister d'abord, ne pas deviner)
docker exec prospera-mongo-1 mongosh --quiet bilan_service --eval 'db.getCollectionNames()'
docker exec prospera-mongo-1 mongosh --quiet bilan_service --eval '
  db.orgbilanentitlements.updateOne(
    { organizationId: ObjectId("<ORG_ID>") },
    { $set: { versionCode: "bilan@1", status: "ACTIVE",
              referentiel: { code: "sfd-bceao", version: "2.0" } } },
    { upsert: true });
  db.orgkycstatuses.updateOne({ organizationId: ObjectId("<ORG_ID>") },
    { $set: { statut: "APPROVED" } }, { upsert: true });'
#    (vérifier les noms de champs réels sur les schémas avant d'écrire — statut KYC/enum)

# 4. AVANT : le paquet est-il bien celui attendu ?
curl -s -H "Authorization: Bearer $TOKEN" localhost:3004/api/v1/bilan/referentiel | jq '.referentiel, .checksum'
#    → attendu : sfd-bceao@2.0 + le NOUVEAU checksum (identique à celui du registre)

# 5. Bilan + CR + contrôles sur une balance SFD équilibrée AVANT affectation
curl -s -X POST localhost:3004/api/v1/bilan/etats/bilan/dry-run -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d @/tmp/balance-sfd.json | jq '.bilan.sousTotaux, .bilan.coherenceSousTotaux'
#    → attendu : BAT et BPT présents ; bz == dz ; ecartEquilibre == 0 ; coherent == true
curl -s -X POST localhost:3004/api/v1/bilan/etats/compte-resultat/dry-run … | jq '.compteResultat.sig, .compteResultat.coherenceSig'
#    → attendu : RSA..RSG ; coherent == true ; resultatNetSig == RSG
curl -s -X POST localhost:3004/api/v1/bilan/etats/controles/dry-run … | jq '.controles, .valide'
#    → attendu : EQUILIBRE_BILAN OK (variante sous-totaux), COHERENCE_RESULTAT OK, valide == true

# 6. APRÈS-négatif : rejouer 5. avec une balance DÉSÉQUILIBRÉE
#    → attendu : EQUILIBRE_BILAN KO, valide == false  (le contrôle rougit vraiment)

# 7. Persistance : créer un jeu d'états SFD et vérifier les documents réels
curl -s -X POST localhost:3004/api/v1/bilan/etats … ; \
docker exec prospera-mongo-1 mongosh --quiet bilan_service --eval '
  db.jeux_etats.find({}, { referentiel: 1, statut: 1 }).pretty()'
```
⚠️ **`docker restart prospera-bilan-service-1`** avant de conclure qu'un correctif ne prend pas : `nest --watch` peut annoncer « Found 0 errors » en exécutant encore l'ancien module. Et l'artefact étant **embarqué**, un changement de `assets/*.json` exige un **rebuild d'image** ou de vérifier que `src/` monté en volume fournit bien le nouveau fichier.

---

## Definition of Done
- [x] Lint 0 warning (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0`) · `npm run build` OK · `npm run test:cov` ≥ **65/90/90/90** · `npm run test:e2e` verts.
- [x] AC-1 → AC-6 validés (incrément 1).
- [x] AC-7 → AC-15 validés (incrément 2), **mutation-tests consignés** (AC-13).
- [x] Non-régression SYSCOHADA / SFD@1.0 : checksums byte-identiques (AC-12), suites 057/059/060/063/110/111/112 vertes.
- [x] **Vérification docker réelle** collée en *Progress Tracking* (AC-14) — jamais « atomicité/production vérifiée » sur la foi d'un mock.
- [x] `security-review` publiée (0 vulnérabilité exploitable) → branche `MNV-120` → **PR #34** rebase-mergée sur `dev` (`450d7d6` + `ae1a948`), branche supprimée.
- [x] Clôture : statut `done` + `completed_date: "2026-07-25"` synchronisés aux **3** endroits (en-tête, `sprint-status.yaml`, *Progress Tracking*).

---

## Story Points Breakdown

- **Données de référentiel (incr. 1, fait) :** 3 points — sources `postes`/`table-de-passage` v2, entrée build + registre, spec de cohérence CC1..CC4.
- **Correction de données + preuve (incr. 2) :** 1 point — états de présentation, `role`, rebuild/checksum, CC4 élargie.
- **Tests de production + mutation + vérif docker (incr. 2) :** 1 point.
- **Total : 5 points** (inchangé — l'incrément 2 est une **correction cadrée**, pas un ajout de périmètre).

**Rationale :** aucun code moteur à écrire (P7 : tout est donnée), mais la preuve est coûteuse — deux régimes de balance, un cas négatif, trois mutations et une vérif docker. Le risque n'est pas la complexité, c'est de « faire passer les specs » en touchant le moteur ou en re-committant un checksum régressé.

---

## Additional Notes

- **Pourquoi cette story compte plus que sa taille** : elle supprime une **fausse assurance** du gate de validation. Tant que `coherenceSousTotaux.bz` est `null`, `EQUILIBRE_BILAN` est OK par non-applicabilité et une liasse SFD **sans totaux** se valide (064) puis se **fige** (065). C'est un défaut de *données de référentiel* qui se lit comme un contrôle vert.
- **Le même défaut est probable sur CIMA** (STORY-122) : rejouer le constat §Contexte sur `cima-assurances@1.0` — mais **dans sa story**, pas ici (périmètre à la lettre).
- **Hooks inertes** documentés, non implémentés : aucun marqueur `tresorerie` (pas de TFT SFD), aucune `NoteMeta` SFD, aucun `paquetFiscal` SFD.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée à partir de la re-analyse de complétude du SFD (analyse §1) par vivian.
- 2026-07-21 : **Incrément 1 livré** (paquet `@2.0` + registry + spec de cohérence, verts) — `defined → in_progress`.
- 2026-07-24 : **Incrément 2 cadré** (Scrum Master) après **exécution du moteur** sur `sfd-bceao@2.0` : constat mesuré (`sousTotaux = []`, `bz/dz = null`, SIG OK), cause racine identifiée (état de présentation + `role` manquants — écart au patron STORY-112), AC-7→AC-15, dépendances renseignées.
- 2026-07-25 : **Clôturée** — PR #34 rebase-mergée sur `dev` après revue de sécurité (0 vulnérabilité) ; un constat de revue a été instruit par la mesure et transformé en spec (balance pathologique à résultat compté deux fois). `review → done`.
- 2026-07-25 : **Incrément 2 développé et prouvé** — paquet corrigé (données seules, moteur intact), checksum `07b4ec22…` propagé, 16 specs neuves, 4 mutation-tests rouges puis restaurés, portes de qualité vertes, **vérification docker réelle** faite (liasse SFD calculée, validée, figée ; gate refusant une balance déséquilibrée). `in_progress → review`.

**Incrément 1 (fait) :** `sfd-bceao@2.0` packagé (plan **156** comptes réutilisés, **31** postes dont 9 `FORMULE`, **31** règles). Artefact `sfd-bceao-2.0.json` sha256 `ee9bf014…`. `referentiels-additionnels-coherence.spec.ts` CC1..CC4 + AC-5 **verts**. **Non-régression prouvée** : SYSCOHADA `01b892c0…` et SFD@1.0 `0509a034…` **inchangés** (regénération `build.mjs`). Lint 0 sur `referentiel/**`.

**Mesure du 2026-07-24 (baseline « AVANT » de l'incrément 2)** — moteur exécuté sur le paquet réel `sfd-bceao@2.0`, balance SFD de démonstration (soldes en unités mineures XOF) :
```
bilan.sousTotaux           = []
bilan.coherenceSousTotaux  = { bz: null, dz: null, totalActifDirect: 1700000,
                               totalPassifResultatDirect: 1300000, ecartEquilibre: null,
                               equilibre: true, coherent: true }     ← vert par NON-APPLICABILITÉ
bilan.actif                = [BA1, BA2]     bilan.passif = [BP4]     (BAT / BPT absents)
cr.sig                     = [RSA 500000, RSB 0, RSC 500000, RSD 500000, RSE 0, RSF 500000, RSG 500000]
cr.coherenceSig            = { resultatNetSig: 500000, resultatNetDirect: 500000, ecart: 0, coherent: true }
```
⇒ **SIG : conformes dès l'incrément 1. Totaux Bilan : non produits.** C'est le point de départ à faire passer au vert **par les données**.

**Incrément 2 (LIVRÉ 2026-07-25) — ce qui a été fait :**
- `BAT`/`BPT` déplacés sur l'**état de présentation** `BILAN`, opérandes portant `etat_source` (⚠️ les sources sont en **snake_case** — `normOperandes` de `build.mjs` ne lit que `etat_source` ; un `etatSource` camelCase est **silencieusement ignoré**, piège rencontré et corrigé) ; `role: 'RESULTAT_BILAN'` posé sur `BP4` (+ champ `_commentaire` documentant les deux régimes de balance, ignoré au build).
- Rebuild déterministe : `sfd-bceao@2.0` sha256 `ee9bf014…` → **`07b4ec22efa111ad698cf13528f0a3a53feba81ce82d1d47493e6a9ce711b620`**, propagé au registre. **Non-régression byte-identique prouvée** sur les 4 autres artefacts (SYSCOHADA `01b892c057…`, SFD@1.0 `0509a03480…`, zone-franche `ecbd01e2ed…`, CIMA `1f36250cbd…` — `git status` ne liste que `sfd-bceao-2.0.json`). Rebuild rejoué → même hash (déterminisme).
- CC4 élargie : une opérande se résout sur un poste **déclaré** *ou* sur un poste `FORMULE` de la table pour l'état visé (aligné sur la réinjection en cascade de l'évaluateur) — sans quoi l'état de présentation `BILAN` la ferait échouer à tort.
- Nouvelle spec `src/modules/bilan/etats/sfd-bceao-liasse.spec.ts` : **16 tests** sur l'**artefact réel embarqué** (AC-7 → AC-12).
- **AC-11 tenu** : `git diff --stat` = 4 fichiers (source JSON, artefact régénéré, registre, spec CC4) + 1 spec neuve. **Aucun** fichier de `etats/` ni `table-de-passage/` modifié — le SFD est complété **en données** (P7).

**Portes de qualité (2026-07-25) :** lint **0 warning** · `npm run build` OK · `npm run test:cov` **75 suites / 701 tests verts**, couverture **98.38 % st / 91.98 % br / 98.42 % fn / 98.36 % ln** (seuils 65/90/90/90) · `npm run test:e2e` **18 suites / 170 tests verts**.

**Mutation-tests (AC-13) — 4 mutations, chacune propagée au checksum du registre pour que l'échec vienne du *comportement* et non d'un `ReferentielIntegrityError`, puis restaurées :**

| Mutation | Résultat |
|---|---|
| `role: 'RESULTAT_BILAN'` retiré de `BP4` | **6 rouges** ciblés (dont « AVANT affectation », équilibre, RSG↔Bilan) ; SIG et non-régression `@1.0` restent verts |
| `BAT` remis sur l'état `BILAN_ACTIF` | **6 rouges** (totaux absents, `sousTotaux = []`) |
| signe de l'opérande `RC8` de `RSG` inversé | **1 rouge**, exactement le test d'impôt |
| `etat_source` retiré de l'opérande `BA1` de `BAT` | **10 rouges** (`OperandeNonResolueError`) |

⇒ les specs **filtrent** réellement ; aucune n'est un vert de complaisance.

**Vérification docker réelle (AC-14) — stack `docker compose`, `prospera-bilan-service-1` redémarré (`Found 0 errors`), artefact confirmé côté conteneur (`src/` **et** `dist/` = `07b4ec22…`, `nest-cli.json` copie les assets) :**

```
GET /api/v1/bilan/referentiel
  → sfd-bceao@2.0 · checksum 07b4ec22… · integrity "verified" · plan 156 / postes 31 / mapping 31

POST /api/v1/bilan/etats/bilan/dry-run           (balance équilibrée, AVANT affectation)
  sousTotaux        : [BAT 15 000 000 « TOTAL DE L'ACTIF », BPT 15 000 000 « TOTAL DU PASSIF »]
  coherenceST       : bz=15 000 000  dz=15 000 000  totalActifDirect=15 000 000
                      totalPassifResultatDirect=15 000 000  ecartEquilibre=0
                      equilibre=true  coherent=true          ← bz/dz NON NULS : contrôle applicable
  passif présenté   : BP1 4 000 000 · BP2 8 000 000 · BP4 2 000 000   (résultat 1 000 000 absorbé par BPT)
  comptesNonMappes  : []

POST /api/v1/bilan/etats/compte-resultat/dry-run
  SIG               : RSA 1 000 000 · RSB 0 · RSC 1 000 000 · RSD 1 000 000 · RSE 0 · RSF 1 000 000 · RSG 1 000 000
  coherenceSig      : resultatNetSig=1 000 000 = resultatNetDirect · ecart=0 · coherent=true

POST /api/v1/bilan/etats/controles/dry-run
  EQUILIBRE_BILAN      OK              ecart=0     (libellé « … = BZ = DZ » ⇒ variante sous-totaux)
  COHERENCE_RESULTAT   OK              ecart=0
  VARIATION_TRESORERIE NON_APPLICABLE              (le RCSFD ne prévoit pas de TFT)
  ARTICULATION_NOTES   NON_APPLICABLE
  valide            : true

POST /api/v1/bilan/etats/bilan/dry-run           (APRÈS affectation : 592 crédité, classes 6/7 soldées)
  resultatNet=0 · BP4=3 000 000 (capital 2 000 000 + excédent 1 000 000)
  BAT=BPT=15 000 000 · ecartEquilibre=0           ← résultat compté UNE SEULE fois
```

**Persistance & immutabilité réellement constatées** (`mongosh`, collections listées d'abord — ⚠️ `orgbilanentitlements` est le **pluriel Mongoose par défaut**, `OrgBilanEntitlement` n'ayant pas de `collection:` explicite ; une variante `org_bilan_entitlements` coexiste en base de dev) :
```
db.jeux_etats       : tenantId=6a63fcd5…0c52 · exercice=2025-SFD · referentiel={sfd-bceao,2.0}
                      checksum=07b4ec22… · 8 lignes soldesN persistées
POST /bilan/etats/<id>/valider  → statut VALIDE (gate STORY-064 franchi sur contrôles RÉELS)
db.snapshots_liasse : version=1 · sousTotaux figés [[BAT,15000000],[BPT,15000000]]
                      SIG figés [RSA…RSG] · coherenceSousTotaux equilibre=true · controles.valide=true
```
**Cas négatif — le gate MORD désormais** (c'était l'enjeu : avant, une liasse SFD sans totaux se validait) :
```
balance déséquilibrée (BP1 3 500 000) :
  EQUILIBRE_BILAN  ANOMALIE  ecart=500 000
     elements: totalActifN 15 000 000 · totalPassifN 13 500 000 · resultatNetN 1 000 000 · BZ 15 000 000 · DZ 14 500 000
  valide = false
POST /bilan/etats/<id>/valider  → HTTP 422 LIASSE_NON_VALIDABLE
                                   « EQUILIBRE_BILAN : ANOMALIE (écart 500000) »
db.jeux_etats       : statut resté BROUILLON
db.snapshots_liasse : 0 document pour ce jeu   ← aucun orphelin après échec
```

**Revue de sécurité (2026-07-25) — 0 vulnérabilité exploitable**, publiée sur la PR #34. Checksum vérifié par calcul **et** par rebuild (l'artefact est bien la sortie déterministe de la source, pas une édition manuelle masquée par un hash recalculé) ; `_commentaire` absent de l'artefact (liste blanche de `normMapping`) ; pas de récursion ni de 500 atteignable via le nouvel état de présentation. Un constat a été **instruit par la mesure plutôt que pris au mot** : le rapport avançait que le double comptage du résultat ne serait pas détecté (car `ecartN = Σ(débit − crédit)`). Mesure en docker : `BPT` 16 000 000 vs `BAT` 15 000 000, `EQUILIBRE_BILAN` **ANOMALIE** (écart −1 000 000), `valide = false` — enregistrer le résultat deux fois **déséquilibre la balance elle-même**, ce que le contrôle attrape. La propriété est désormais tenue par une **17ᵉ spec** (`ae1a948`) au lieu d'un commentaire.

**Reste hors dev :** **validation experte SFD** de l'ordonnancement de la cascade SIG (ancrage `592`/`595`/`596`) — blocker métier ouvert, tracé comme finding, ne bloque pas l'intégration. Le même défaut d'état de présentation est **probable sur `cima-assurances@1.0`** → à rejouer dans **STORY-122**, pas ici.

**Finding cosmétique (non traité, hors périmètre)** : `pkg.postes` déclare `BAT`/`BPT` sous `BILAN_ACTIF`/`BILAN_PASSIF` (comme SYSCOHADA pour `BZ`/`DZ`) alors que les règles portent l'état `BILAN`. Sans effet ici — `libellesPostes()` indexe par code tous états confondus, et les libellés officiels sortent bien (« TOTAL DE L'ACTIF » / « TOTAL DU PASSIF », constaté en docker et asserté en spec) — mais l'incohérence de déclaration mériterait d'être harmonisée à l'échelle des 5 paquets.

**Actual Effort :** incr. 1 ≈ 3 pts · incr. 2 ≈ 2 pts (dont l'essentiel en preuve : 4 mutations + vérif docker). Total 5 pts, conforme à l'estimation.

---

**Story créée avec la méthode BMAD v6 — extension EPIC-010 (FR-007).**
