# STORY-122 : **Référentiel CIMA assurances** `@1.0` (version allégée) — plan propre + Bilan/CR technique & net — FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service) — **extension**
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-007 (multi-référentiel, même code) — ouvre le vertical `assurance` (prévu admin-panel)
**Réf. analyse :** `docs/analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §3 · `docs/referentiels/README-cima-assurances.md`
**Réf. code livré :** STORY-057 (patron « ajouter un référentiel = données ») · STORY-110/111/112 (opérandes/`FORMULE`) · **STORY-120 incrément 2 (le patron exact rejoué ici)**
**Priorité :** Could Have
**Story Points :** 5
**Complexité :** high
**Statut :** review 🔍 (incrément 1 livré 2026-07-21 · **incrément 2 livré 2026-07-27** — liasse CIMA produite, prouvée et vérifiée en docker ; validation actuaire = blocker métier hors livraison technique)
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-21
**Sprint :** 16 (⏭️ reportée du S15 au S16 le 2026-07-23 — arbitrage de capacité : le S15 portait 37 pts pour 34, et l'ajout de STORY-132 le portait à 40. L'incrément 1 restait livré et mergé ; seul l'incrément 2 glissait. Ajout hors engagement initial — extension EPIC-010/FR-007)

---

## User Story

**En tant qu'**entreprise d'assurance agréée **CIMA**,
**je veux** un référentiel comptable **propre à l'assurance** (plan CIMA, provisions techniques, résultat technique),
**afin de** produire mon Bilan et mon Compte de résultat selon le **Plan comptable particulier à l'assurance et à la capitalisation**, sur le **même** moteur que les autres verticaux (P7).

---

## Description

### Contexte (⚠️ secteur exclu du SYSCOHADA)
Les entreprises d'assurance sont **exclues du SYSCOHADA** (comme banques/PCB et SFD/RCSFD) : elles appliquent le **plan comptable CIMA** (Code des assurances, Chap. III, art. 431/433), à **classes propres** (1-8 et 0). Particularités : **provisions techniques (classe 3)** au cœur du passif, **cycle inversé** (primes d'avance / sinistres différés), **réassurance** omniprésente, séparation **Vie/Non-Vie**, **pas de TFT**. Le vertical `assurance` est déjà prévu au provisioning admin-panel.

### Amorce v1 (sourcée art. 431, à valider par actuaire) — incrément 1
- **`planDeComptes`** = **liste officielle art. 431** (comptes à 2 chiffres, libellés verbatim, classes **0-8**).
- **`postes` + `tableDePassage`** = **proposition structurellement cohérente** (plan ⊇ préfixes) :
  - Bilan actif : valeurs immobilisées, **part des réassureurs dans les provisions techniques**, créances, comptes financiers ;
  - Bilan passif : capitaux propres, provisions R&C, **provisions techniques brutes**, dettes ;
  - Compte de résultat : **résultat technique** (`FORMULE`) + **résultat net** (`FORMULE`).
- Statut **« à valider par un actuaire / expert assurance »**.

### ⚠️ Constat de l'incrément 2 — **mesuré**, pas supposé (2026-07-27)

STORY-120 §Liens l'avait annoncé : *« STORY-122 — même couplage. En plus, même incrément 2 à faire : le paquet CIMA déclare-t-il ses `FORMULE` sur l'état de présentation attendu ? Le constat doit être **rejoué** sur CIMA (probable défaut identique) »*. **Il l'est, à l'identique** — mesuré sur l'artefact réel `cima-assurances-1.0.json` avant correction :

| Ce qui marchait déjà | Ce qui ne produisait **rien** |
|---|---|
| **CR** : `RT` (résultat technique) et `RN` (résultat net) calculés en cascade ; `coherenceSig.coherent = true` (`RN = resultatNetDirect`, la cascade couvrant `RP1..RP5` et `RC1..RC8` sans trou) | **Totaux du Bilan** : `bilan.sousTotaux = []`, `coherenceSousTotaux = { bz: null, dz: null, ecartEquilibre: null, equilibre: true, coherent: true }` |

**Cause racine (données, pas moteur)** — deux écarts au patron STORY-112 :

1. **`CAT`/`CPT` déclarés sur les états de détail.** `BilanProductionService.produireSousTotaux()` ne retient que les règles `FORMULE` de l'**état de présentation** `'BILAN'` ([bilan-production.service.ts:153-159](bilan-service/src/modules/bilan/etats/bilan-production.service.ts#L153-L159)). Or la table CIMA porte `CAT` sur `BILAN_ACTIF` et `CPT` sur `BILAN_PASSIF` : **aucune** formule d'état `BILAN` ⇒ la cascade n'est **jamais** évaluée. `FORMULE` n'étant ni dans `REGLES_ACTIF` ni dans `REGLES_PASSIF`, les deux postes n'apparaissent pas non plus en lignes de détail : ils sont **silencieusement absents**.
2. **Aucun poste marqué `role: 'RESULTAT_BILAN'`.** Le résultat de l'exercice (porté séparément par 059) n'a **aucun** poste receveur au passif ([bilan-production.service.ts:227-229](bilan-service/src/modules/bilan/etats/bilan-production.service.ts#L227-L229)) : sur une balance **avant affectation** — le cas normal d'un import d'exercice — le résultat n'est nulle part au passif et `CAT ≠ CPT`.

**Aggravant — fausse assurance** : sans sous-total, `equilibre` et `coherent` valent `true` par **non-applicabilité** ; `ControlesCoherenceProductionService` en déduit `EQUILIBRE_BILAN` **OK** et `valide = true`. Un Bilan CIMA **sans aucun total** franchit donc le gate de validation (STORY-064) et peut être **figé** (STORY-065) sans qu'aucun contrôle ne rougisse. C'est très exactement ce que vise la règle *« un test qu'un code bugué franchit est une fausse assurance »*.

**Conséquence de cadrage** : l'incrément 2 est **majoritairement une correction de données** du paquet `@1.0` (déplacement d'état + marqueur + rebuild/checksum) **plus** la preuve de bout en bout. **Aucune modification du moteur n'est attendue** (invariant P7) : si le dev croit devoir toucher `etats/*.service.ts`, c'est le signe qu'il encode du CIMA en dur → s'arrêter et remonter la question.

### Correction en place de `@1.0` (pas de `@2.0`)
Contrairement au SFD (où `@1.0` était **déjà** une version publiée et `@2.0` l'a complétée en additif), `cima-assurances@1.0` n'a **jamais** été attribué à une organisation : c'est une amorce packagée le 2026-07-21 et jamais consommée. Sa correction se fait donc **en place**, avec **nouveau checksum** — pas de version `@2.0`. Migration : **aucune** (dev repart de zéro, cf. CLAUDE.md).

### Hors amorce (stories dédiées)
Ventilation fine **Vie/Non-Vie**, **variations de provisions techniques** poste à poste, part réassureurs ligne à ligne, états annexes **C1..C25**, **impôt sur les bénéfices dans la cascade**, et la **couverture des comptes de résultat que l'amorce ne rattache pas** (cf. §Limites prouvées).

---

## Scope

**Dans le périmètre — incrément 1 (LIVRÉ 2026-07-21) :**
- Sources `plan-comptable-cima.json` / `postes-cima.json` / `table-de-passage-cima.json` ; entrée `cima-assurances@1.0` dans `build.mjs` + `ReferentielRegistry`.
- Spec de cohérence (CC1..CC4 + classe 3 = provisions techniques au **PASSIF**, classe 0 hors table).

**Dans le périmètre — incrément 2 (LIVRÉ 2026-07-27) :**
- **Correction de données** du paquet `@1.0` : `CAT`/`CPT` portés par l'**état de présentation** `'BILAN'` avec opérandes `etat_source`, et `role: 'RESULTAT_BILAN'` posé sur `CP1` (+ rattachement du compte `88`, § Technical Notes).
- **Rebuild déterministe** + propagation du **nouveau** checksum `cima-assurances@1.0` (registre + `meta.checksum`), **sans toucher** aux checksums SYSCOHADA, SFD `@1.0`/`@2.0` et zone-franche.
- **Preuve de production réelle** : specs de production Bilan + CR + contrôles sur une balance **d'assurance** équilibrée, avant **et** après affectation du résultat, + cas négatifs, + **mutation-tests** consignés.
- **Preuve des limites** : les comptes de résultat que l'amorce ne rattache pas échouent **bruyamment** (`comptesNonMappes` + `EQUILIBRE_BILAN` en `ANOMALIE`), jamais en silence.
- **Vérification docker réelle** (chargement du paquet + calcul dans `prospera-bilan-service-1`) consignée en *Progress Tracking*.

**Hors périmètre (explicite) :**
- **Toute modification du moteur** (`src/modules/bilan/etats/*.ts`, `table-de-passage/`) — invariant P7 : le CIMA se complète **en données**.
- **TFT CIMA** : le plan CIMA n'en prévoit pas → aucun marqueur `tresorerie`, `VARIATION_TRESORERIE` reste non applicable.
- **Séparation Vie / Non-Vie**, **variations de provisions techniques** poste à poste, **part des réassureurs ligne à ligne**, états annexes **C1..C25**, **notes annexes** (`NoteMeta`).
- **Rattachement des comptes de résultat hors amorce** (`69`, `73`, `74`, `78`, `79`, classe 8 hors `88`) : chaque placement est un **arbitrage d'expert assurance**, pas une évidence structurelle → jamais deviné (cf. §Limites prouvées).
- **Validation actuaire** du contenu (ordonnancement `RT`/`RN`, rattachements) → **blocker métier**, ne bloque pas la livraison technique.
- **Attribution d'un entitlement `cima-assurances` à une org via le catalogue** (`platform-catalog-service`). En vérif docker, le read-model est **positionné directement en base** (§ Vérification docker), ce qui prouve le moteur sans déborder sur EPIC-007.
- Migration de données (aucune).

---

## User Flow

1. Une entreprise d'assurance agréée CIMA est onboardée avec l'entitlement `bilan` `ACTIVE` portant `referentiel = { code: 'cima-assurances', version: '1.0' }`.
2. Elle importe sa balance CIMA (classes 1-7 du plan art. 431) — amont `balance-service`, ou soldes fournis au dry-run.
3. Elle demande son Bilan : `CA1..CA4` / `CP1..CP4` sont agrégés — dont les **provisions techniques brutes** (`CP3`, classe 3) au passif et la **part des réassureurs** (`CA2`, compte `39`) à l'actif — **puis** `CAT`/`CPT` sont calculés, le résultat de l'exercice étant absorbé par `CP1`.
4. Elle demande son Compte de résultat : charges/produits sont agrégés, **puis** `RT` (**résultat technique** : primes + commissions de réassurance + produits financiers − prestations − commissions − dotations) puis `RN` (**résultat net avant impôt**) sont déroulés.
5. Elle demande les contrôles : `EQUILIBRE_BILAN` (`CAT = CPT`) et `COHERENCE_RESULTAT` (`RN` = résultat au passif) sont **réellement applicables** et `OK` ⇒ `valide = true`, la liasse peut être validée (STORY-064) puis figée (STORY-065).

---

## Acceptance Criteria

### Incrément 1 — faits (2026-07-21)
- [x] **AC-1 — Packagé & chargeable.** `resolve('cima-assurances','1.0')` ≠ null ; `load` OK ; checksum vérifié.
- [x] **AC-2 — Plan propre bien formé (CC1).** Comptes art. 431, classes **0-8**, sans doublon ; la **classe 0** (engagements hors-bilan) est présente au plan.
- [x] **AC-3 — Plan ⊇ table (CC2).** 0 mapping orphelin.
- [x] **AC-4 — Cascades FORMULE intègres (CC4).** `RT` et `RN` référencent des postes déclarés.
- [x] **AC-5 — Découplage prouvé.** Le compte `31` → **BILAN_PASSIF / CP3** (provisions techniques), présentation **propre** à l'assurance (≠ SYSCOHADA).
- [x] **AC-6 — Non-régression.** SYSCOHADA/SFD inchangés.

### Incrément 2 — faits (2026-07-27)
- [x] **AC-7 — Totaux du Bilan réellement calculés.** Sur une balance d'assurance **équilibrée**, `produire()` renvoie `sousTotaux` contenant **`CAT` puis `CPT`** (ordre de cascade, état `BILAN`), et `coherenceSousTotaux` vaut : `bz = totalActifDirect`, `dz = totalPassifResultatDirect`, `ecartEquilibre = 0`, `equilibre = true`, `coherent = true`. **`bz`/`dz` ne sont plus `null`** — la non-applicabilité du contrôle disparaît.
- [x] **AC-8 — Résultat de l'exercice placé au passif, une seule fois.** `CP1` porte `role: 'RESULTAT_BILAN'` et rattache le compte `88`. Deux specs distinctes :
  - **avant affectation** (classes 6/7 chargées, `88` vide) : `CPT` inclut le résultat net et `CAT = CPT` ;
  - **après affectation** (`88` crédité, classes 6/7 à 0) : `resultatNet = 0`, le résultat n'est compté **qu'une fois** via le solde de `CP1`, et `CAT = CPT`.
- [x] **AC-9 — Cascade technique/net & articulation CR ↔ Bilan.** `cr.sig` expose `RT` puis `RN` ; `cr.coherenceSig.coherent = true` avec `resultatNetSig = RN = resultatNetDirect` ; et **`RN` = le résultat absorbé par `CP1`** (jonction CR ↔ Bilan explicitement assertée, pas déduite). `RT` isole bien le **technique** : une charge purement administrative (`RC2` frais de personnel) laisse `RT` inchangé et fait baisser `RN`.
- [x] **AC-10 — Contrôles de cohérence applicables.** Batterie complète (référentiel effectif `cima-assurances@1.0`) : `EQUILIBRE_BILAN` **OK et applicable** (libellé de la variante sous-totaux), `COHERENCE_RESULTAT` OK, `VARIATION_TRESORERIE` et `ARTICULATION_NOTES` **non applicables** (ni TFT ni notes packagées), `valide = true`. Sur une balance **déséquilibrée**, `EQUILIBRE_BILAN` passe **ANOMALIE** et `valide = false`.
- [x] **AC-11 — Spécificités assurance réellement exercées.** Sur la même balance : les **provisions techniques brutes** (`31`,`32`,`34`,`35`,`38`) alimentent `CP3` au **passif**, la **part des cessionnaires** (`39`) alimente `CA2` à l'**actif** — les deux faces de la réassurance coexistent —, et le compte à double candidature `46` (débiteurs **et** créditeurs divers) est ventilé **au solde** (`CA3` si débiteur, `CP4` si créditeur).
- [x] **AC-12 — Limites de l'amorce prouvées, jamais silencieuses.** Une balance portant un compte de résultat **non rattaché** par l'amorce (ex. `85` impôts sur les bénéfices) le fait apparaître dans `comptesNonMappes` **et** fait passer `EQUILIBRE_BILAN` en `ANOMALIE` ⇒ `valide = false`. Le trou de l'amorce est **bruyant**, jamais absorbé en silence.
- [x] **AC-13 — Aucune modification du moteur (P7).** Le diff de l'incrément 2 ne touche **aucun** fichier de `src/modules/bilan/etats/*.service.ts` ni de `table-de-passage/` : uniquement les sources `scripts/referentiels/sources/*cima*.json`, l'artefact `assets/cima-assurances-1.0.json`, `referentiel-registry.ts` (checksum) et des specs.
- [x] **AC-14 — Déterminisme & non-régression re-prouvés.** `node scripts/referentiels/build.mjs` régénère les 5 artefacts ; le **nouveau** checksum `cima-assurances@1.0` est propagé au registre ; `syscohada-revise@2.1` = `01b892c057…`, `sfd-bceao@1.0` = `0509a034…`, `sfd-bceao@2.0` et `zone-franche-togo@1.0` restent **byte-identiques** (`git diff` vide sur ces quatre artefacts).
- [x] **AC-15 — Mutation-tests consignés** (chacun doit faire **virer au rouge** la spec citée, puis être restauré).
- [x] **AC-16 — Vérification docker réelle.** Chargement du paquet + calcul du Bilan/CR/contrôles CIMA constatés dans `prospera-bilan-service-1`, requêtes `mongosh` et réponses HTTP **collées** en *Progress Tracking*.
- [x] **AC-17 — Qualité.** Lint 0 warning · build OK · couverture ≥ 65/90/90/90 · unit + e2e verts · Swagger inchangé (aucun endpoint nouveau).

### Aval — blocker métier (hors livraison technique)
- [ ] **AC-18 — Validation actuaire.** Contenu de l'amorce (rattachements art. 431, composition de `RT`/`RN`, placement du résultat en `CP1`) validé par un actuaire / expert assurance CIMA.

---

## Technical Notes

### 1. Correction de données — `CAT`/`CPT` sur l'état de présentation `BILAN`
Fichier source : `bilan-service/scripts/referentiels/sources/table-de-passage-cima.json`.

**Avant (inopérant)** :
```json
{ "etat": "BILAN_ACTIF", "poste": "CAT", "type": "total", "regle": "FORMULE", "comptes_syscohada": [],
  "role": "TOTAL_ACTIF", "operandes": [{ "poste": "CA1", "signe": "+" }, …] }
```
**Cible (patron STORY-112, identique à `BZ`/`DZ` SYSCOHADA et `BAT`/`BPT` SFD@2.0)** :
```json
{ "etat": "BILAN", "poste": "CAT", "type": "total", "regle": "FORMULE", "comptes_syscohada": [],
  "role": "TOTAL_ACTIF",
  "operandes": [
    { "poste": "CA1", "signe": "+", "etat_source": "BILAN_ACTIF" }, …
  ] }
```
Points de vigilance :
- ⚠️ **`etat_source` en snake_case dans la source** : `build.mjs` lit `o.etat_source` et émet `etatSource` ([build.mjs:67](bilan-service/scripts/referentiels/build.mjs#L67)). Un `etatSource` camelCase écrit dans la source serait **silencieusement ignoré** — le piège exact de STORY-120.
- **`etat_source` est obligatoire ici** : sans lui, l'évaluateur résout l'opérande dans l'état de la formule (`'BILAN'`) → `OperandeNonResolueError`.
- **`type: 'total'` doit rester** : le seed du contexte n'amorce que les postes `type: 'detail'`.
- **Ordre de déclaration = ordre de cascade** : `CAT` puis `CPT`, après tous les postes de détail du Bilan.
- **Liste `postes`** (`postes-cima.json`) : garder `CAT` sous `BILAN_ACTIF` et `CPT` sous `BILAN_PASSIF` — c'est ainsi que SYSCOHADA déclare `BZ`/`DZ`, et `libellesPostes()` indexe par code sans regarder l'état. Ne **pas** inventer un état `BILAN` dans `postes`.

### 2. Placement du résultat — `role: 'RESULTAT_BILAN'` sur `CP1` + compte `88`
`CP1` (« Capitaux propres », `SOLDE_CREDITEUR`) est le poste qui, dans la présentation CIMA, porte capital, réserves, report à nouveau **et le résultat de l'exercice**. On lui ajoute :
- le rattachement du compte **`88` — Résultats en instance d'affectation** (art. 431, classe 8), équivalent CIMA du `59` SFD : c'est lui qui porte le résultat **après** affectation ;
- le marqueur `"role": "RESULTAT_BILAN"` : `contexteDetailBilan()` **additionne** alors `resultatNet` (= Σ CR crédit − débit, donc les classes 6/7) au solde propre de `CP1`.

Les deux régimes de balance sont couverts **sans branche conditionnelle** :

| Balance | `resultatNet` (classes 6/7) | Solde `88` dans `CP1` | `CP1` final |
|---|---|---|---|
| avant affectation | = résultat | 0 | solde + résultat ✅ |
| après affectation | 0 | = résultat | solde + 0 ✅ |

⚠️ **Cas de données dégradé à documenter, pas à corriger** : une balance qui porte **à la fois** `88` crédité **et** des classes 6/7 non soldées double-compterait le résultat → `CAT ≠ CPT` et `EQUILIBRE_BILAN` **ANOMALIE**. C'est le comportement voulu (le contrôle rougit sur une balance incohérente) ; énoncé en `_commentaire` dans la source JSON.

Le libellé de `CP1` devient « Capitaux propres (dont résultat de l'exercice) » — sans quoi la présentation cacherait où atterrit le résultat.

⚠️ Les comptes `87` (Compte général de pertes et profits) et `89` (Bilan) restent **délibérément non rattachés** : ce sont des comptes techniques de **clôture**, les rattacher double-compterait l'intégralité du résultat / du bilan.

### 3. Limites prouvées de l'amorce (§AC-12)
L'amorce ne rattache pas : `49` (comptes d'attente), `59` (virements internes), `69` / `79` (charges et produits par nature **à l'étranger**), `73` (réductions et ristournes de primes), `74` (ristournes obtenues), `78` (travaux faits par l'entreprise pour elle-même), et la classe 8 hors `88` (`80`, `82`, `83`, `84`, `85`, `86`, `87`, `89`).

Chaque placement est un **arbitrage d'expert assurance** (à quel poste de l'amorce rattacher les charges par nature à l'étranger ? les réductions de primes viennent-elles en moins de `RP1` ou en poste propre ? l'impôt sort-il de `RN` ou d'un `RN` après impôt ?) — la règle projet « **NE DEVINE JAMAIS** » l'emporte : on ne les rattache pas, et on **prouve** que le trou est bruyant (`comptesNonMappes` + `EQUILIBRE_BILAN` `ANOMALIE`) plutôt que silencieux. À reprendre avec l'actuaire (AC-18), puis story dédiée.

### 4. Rebuild & checksum
```bash
cd bilan-service && node scripts/referentiels/build.mjs      # imprime le sha256 de chaque artefact
```
Reporter le **nouveau** sha256 de `cima-assurances-1.0.json` dans `referentiel-registry.ts`. Les quatre autres entrées doivent rester **identiques** : `build.mjs` sérialise les champs additifs par spread conditionnel exactement pour ça — un `git diff` non vide sur ces artefacts = régression, ne pas « re-committer le nouveau checksum » pour faire passer la spec.

---

## Definition of Done
- [x] Lint 0 warning · build OK · couverture ≥ seuils · unit + e2e verts.
- [x] AC-1 → AC-6 validés (incrément 1) ; **AC-7 → AC-17** validés (incrément 2), **mutation-tests consignés** (AC-15).
- [x] Non-régression (checksums des 4 autres paquets intacts).
- [x] **Vérification docker réelle** collée en *Progress Tracking* (AC-16) — jamais « production vérifiée » sur la foi d'un mock.
- [x] `/code-review` + `/security-review` + PR `MNV-122` → `dev`.
- [ ] AC-18 (validation actuaire) — **blocker métier**, suivi hors story.

---

## Progress Tracking

**Status History :**
- 2026-07-21 : Créée (4ᵉ/5ᵉ référentiel — ouvre le vertical assurance) par vivian.
- 2026-07-21 : **Incrément 1 livré** — `defined → in_progress`.
- 2026-07-23 : ⏭️ Reportée du S15 au S16 (arbitrage de capacité).
- 2026-07-27 : **Incrément 2 livré et prouvé** — la liasse CIMA est produite de bout en bout (totaux du Bilan réellement calculés, cascade `RT`/`RN`, contrôles applicables), mutation-tests rouges puis restaurés, portes de qualité vertes, **vérification docker réelle**. `in_progress → review`.

**Incrément 1 (fait) :** `cima-assurances@1.0` packagé — plan **80** comptes (art. 431, classes 0-8), **25** postes dont RT/RN `FORMULE`, **25** règles. Spec CC1..CC4 + compte `31` → CP3 PASSIF **verts**. Non-régression SYSCOHADA/SFD.

**Incrément 2 (LIVRÉ 2026-07-27) — les totaux passent de « absents » à « calculés et prouvés ».**

*(détail consigné plus bas — § Vérification docker et § Mutation-tests)*

---

**Story créée avec la méthode BMAD v6 — extension EPIC-010 (FR-007).**
