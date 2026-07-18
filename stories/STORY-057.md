# STORY-057 : Paquet référentiel **SFD-BCEAO** (plan de comptes + table de passage) — 2ᵉ référentiel packagé, prouve le multi-référentiel — FR-007

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service)
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-007 (multi-référentiel SYSCOHADA + SFD-BCEAO, même code / tables distinctes)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (P7/D10 : code ⊥ référentiel, chargé **par tenant**) ; `docs/referentiels/README.md` (statut des amorces)
**Réf. code livré :** STORY-038 (`ReferentielRegistry` *multi-référentiel ready*, `ReferentielLoader`) · STORY-055 (`TableDePassageService.mapComptes`) · **STORY-056** (patron `CompteReferentiel` + `planDeComptes` + build multi-source + contrôles de cohérence)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker + revue + intégrée dans `dev` le 2026-07-18 — PR #8 bilan-service, MNV-057 rebase-merge)
**Assigné à :** vivian
**Créée :** 2026-07-18
**Sprint :** 11

---

## User Story

**En tant qu'**opérateur du référentiel PROSPERA (et, en aval, une organisation de type SFD/microfinance),
**je veux** un **second** référentiel packagé — `sfd-bceao` (plan de comptes + table de passage), versionné et vérifié par checksum — sélectionnable **sans fork de code**,
**afin de** prouver le découplage P7/D10 : une org SYSCOHADA et une org SFD tournent sur la **même** version de code `bilan`, avec des **tables de passage distinctes** (FR-007).

---

## Description

### Contexte & re-cadrage (⚠️ lire avant de coder)

STORY-057 est le **jumeau** de STORY-056 pour le référentiel **SFD-BCEAO**. Elle **réutilise à l'identique** la mécanique posée par 056 (interface `CompteReferentiel` + `planDeComptes`, `build.mjs` déterministe multi-source, `ReferentielRegistry` par données, contrôles de cohérence) : le registre est **déjà** *multi-référentiel ready* (commentaire de `ReferentielRegistry` : « le paquet `sfd-bceao` est STORY-057 »). Il ne s'agit donc **pas** d'écrire du moteur : il s'agit de **constituer un 2ᵉ jeu de données référentiel** et de le brancher.

### ⚠️ Contrainte de données — SFD en **amorce** (aucune donnée SFD interne)

Vérifié le 2026-07-18 : `docs/referentiels/` **ne contient AUCUNE donnée SFD-BCEAO** (uniquement SYSCOHADA/Togo GUIDEF). Le PRD l'acte explicitement (FR-007, note de dépendance) : *« SFD-BCEAO validé quand des données SFD internes sont disponibles. »*

**Décision de cadrage :** on constitue une **amorce** `sfd-bceao@1.0` à partir du **référentiel officiel public** BCEAO — *Référentiel Comptable Spécifique des SFD de l'UMOA, version allégée* (**Instruction n°025-02-2009** ; plan de comptes = **Instruction n°026-02-2009**). Recherche web effectuée le 2026-07-18 → **données réelles extraites** (voir *Provenance & données extraites* ci-dessous), consignées dans `scratchpad/sfd-bceao-reference.md`. **Statut « amorce à valider par un expert »** conservé (identique au SYSCOHADA). L'objectif de la story n'est **pas** l'exhaustivité comptable SFD mais de **prouver la capacité multi-référentiel** : deux paquets **réels et distincts** chargés par le **même** code, chacun cohérent (plan ⊇ table de passage). L'enrichissement/validation experte reste un travail aval.

### Provenance & données extraites (recherche web 2026-07-18)

- **Source :** RCSFD version allégée (BCEAO / Commission Bancaire UMOA) — https://www.cb-umoa.org/fr/sfd · PDF officiel récupéré et parsé (plan de comptes p.29-40, documents de synthèse p.117-125).
- ⚠️ **Ne PAS confondre** avec le **PCB** (Plan Comptable Bancaire révisé, décision n°357-11-2016) qui vise les **banques** — c'est un autre référentiel.
- **Plan de comptes SFD (classes 1 à 7)** — extrait réel :
  - **Classe 1** — Opérations de trésorerie et avec les institutions financières (10 caisse, 11 comptes ordinaires chez IF, 12 dépôts constitués, 13 prêts aux IF, 15 comptes ordinaires des IF, 16 dépôts reçus des IF, 17 emprunts, 18 ressources affectées, 19 prêts en souffrance).
  - **Classe 2** — Opérations avec les membres, bénéficiaires ou clients (20 crédits, 25 comptes/dépôts des membres, 27 emprunts, 29 crédits en souffrance).
  - **Classe 3** — Opérations sur titres et opérations diverses (30 titres, 32 stocks, 33 débiteurs/créditeurs divers, 37 transitoires, 38 régularisation).
  - **Classe 4** — Valeurs immobilisées (41 immo financières, 42 dépôts/cautionnements, 43 immo en cours, 44 immo d'exploitation + amortissements 4418/4428).
  - **Classe 5** — Provisions, fonds propres et assimilés (50 subventions, 51/52 provisions, 53 emprunts subordonnés, 54 FRFG, 55 primes/réserves, 56 fonds de dotation, 57 capital, 58 report à nouveau, 59 résultat).
  - **Classe 6** — Comptes de charges (60 exploitation financière, 61 achats, 62 charges externes, 63 impôts/taxes, 64 personnel, 65/66 dotations, 67 exceptionnelles, 69 impôts sur excédents).
  - **Classe 7** — Comptes de produits (70 exploitation financière, 71 ventes, 72 produits divers, 74 subventions, 75/76 reprises, 77 exceptionnels).
- **États de synthèse :** **DIMF 2000 : Bilan** (actif : opérations IF / crédits membres / opérations diverses / immobilisations ; passif : opérations IF / dépôts membres / opérations diverses / provisions-fonds propres) · **DIMF 2080 : Compte de résultat** (charges cl.6 / produits cl.7 + Soldes Intermédiaires de Gestion). Code poste = 3 caractères, 1ᵉʳ alphabétique = classe.
- **Classe 8 (hors-bilan)** : **hors amorce** (n'entre pas dans Bilan/CR).

### Problème résolu

Sans un **second** référentiel packagé, le découplage P7 (code ⊥ référentiel) reste **non démontré** : tout marche sur `syscohada-revise@2.1`, et rien ne prouve qu'un autre référentiel se charge et se mappe **sans toucher au code**. STORY-057 fournit ce second paquet et **la preuve** (une org SFD et une org SYSCOHADA, même binaire, tables distinctes).

---

## Scope

**Dans le périmètre :**

- Constitution d'une **amorce SFD-BCEAO** : `docs/referentiels/plan-comptable-sfd.{json,csv}`, `docs/referentiels/table-de-passage-sfd.json`, `docs/referentiels/postes-sfd.json` (structure d'états SFD simplifiée), + copies sources de build sous `scripts/referentiels/sources/`.
- Génération d'un **artefact** `sfd-bceao-1.0.json` au format `ReferentielPackage` (mêmes `CompteReferentiel`/`planDeComptes`/`postes`/`tableDePassage` que 056), via `build.mjs` **paramétré par référentiel** (construit désormais `syscohada-revise@2.1` **et** `sfd-bceao@1.0`, chacun avec son sha256).
- **Nouvelle entrée** `sfd-bceao@1.0` dans `ReferentielRegistry` (`{ locator, checksum }`).
- **Contrôles de cohérence** (CC1/CC2/CC3 de 056) **appliqués aussi** au paquet SFD.
- **Preuve multi-référentiel** (FR-007) : test chargeant les **deux** paquets et mappant un compte-échantillon via chacun → **postes distincts** ; même version de code.
- **Hooks inertes** : consommation SFD (états EPIC-011) identique au SYSCOHADA.
- Le `README.md` de provenance mis à jour (ligne SFD, statut amorce).

**Hors périmètre :**

- **Exhaustivité/validation experte** du contenu comptable SFD (dépend de données internes — déclenché ultérieurement) : l'amorce est structurellement complète et cohérente, pas réglementairement exhaustive.
- **Paquet fiscal** SFD (le fiscal SFD n'est pas requis par le moteur d'états — champ `paquetFiscal` **omis** ou minimal).
- Consommation du plan/mapping SFD (production d'états = **EPIC-011**), surcharges org (**STORY-058**), régime SMT / autres pays UEMOA (différés D12).
- Attribution d'un entitlement `sfd-bceao` à une org (relève du catalog-service / read-model) : la story **package** le référentiel, elle ne provisionne pas d'org SFD en prod.

---

## User Flow (technique)

1. **Constitution** : plan de comptes SFD + table de passage + postes SFD saisis en sources.
2. **Build** : `node scripts/referentiels/build.mjs` produit **les deux** artefacts (`syscohada-revise-2.1.json` inchangé, `sfd-bceao-1.0.json` nouveau) et imprime **leurs** sha256.
3. **Registre** : le sha256 SFD est reporté dans `ReferentielRegistry` (`sfd-bceao@1.0`).
4. **Chargement** : `ReferentielLoader.load('sfd-bceao','1.0')` → fetch → checksum vérifié → parse → paquet SFD exposé/caché ; le SYSCOHADA reste chargeable **en parallèle** (clés de cache distinctes, versions coexistent).
5. **Cohérence & preuve** : les specs prouvent (a) le paquet SFD bien formé + plan ⊇ table de passage, (b) un même compte-échantillon mappé via SYSCOHADA vs SFD → **postes distincts**.

---

## Acceptance Criteria

- [ ] **AC-1 — Paquet SFD packagé.** `sfd-bceao@1.0` est résolu par `ReferentielRegistry` (`{ locator:'sfd-bceao-1.0.json', checksum:<sha256> }`) ; `resolve('sfd-bceao','1.0')` ≠ null. (Le test négatif existant `resolve('sfd-bceao','1.3') → null` reste valide.)
- [ ] **AC-2 — Chargeable & intègre.** `ReferentielLoader.load('sfd-bceao','1.0')` renvoie un `ReferentielPackage` avec `planDeComptes` **non vide**, `postes` non vide, `tableDePassage` non vide ; un checksum falsifié → `ReferentielIntegrityError` (aucun calcul sur référentiel non intègre).
- [ ] **AC-3 — Plan bien formé (CC1).** Chaque compte SFD : `numero ^\d{2,}$`, `libelle` non vide, `classe` = 1er chiffre ∈ [1..7] (le RCSFD version allégée structure les états sur les classes 1 à 7 ; classe 8 hors-bilan hors amorce), aucun `numero` en doublon.
- [ ] **AC-4 — Cohérence plan ⊇ table de passage (CC2).** Chaque préfixe de `tableDePassage[].comptesSyscohada` du paquet SFD est couvert par ≥ 1 compte du plan SFD → **0 mapping orphelin**.
- [ ] **AC-5 — Déterminisme (CC3).** Ré-exécuter `build.mjs` produit `sfd-bceao-1.0.json` **octet-pour-octet identique** ⇒ même sha256 ; le checksum du registre **égale** ce sha256.
- [ ] **AC-6 — Multi-référentiel prouvé (FR-007, cœur).** Un test charge **les deux** paquets sur la **même** instance et mappe un compte-échantillon (ex. un compte de dépôt) : le poste obtenu via `syscohada-revise@2.1` **diffère** du poste obtenu via `sfd-bceao@1.0` (présentations distinctes) ; `TableDePassageService.mapComptes` est **le même** code dans les deux cas.
- [ ] **AC-7 — Non-régression SYSCOHADA.** L'artefact `syscohada-revise-2.1.json` et son checksum (056) sont **inchangés** ; tous les tests 056 restent verts ; `build.mjs` produit les deux artefacts sans altérer le SYSCOHADA.
- [ ] **AC-8 — Périmètre respecté.** Aucun endpoint nouveau, aucune écriture Mongo ; consommation d'états SFD = hook inerte (EPIC-011) ; pas de surcharge org (058) ; statut « amorce à valider » documenté.

---

## Technical Notes

### Réutilisation stricte de 056

Aucun **nouveau** type ni aucune **nouvelle** logique de chargement : `CompteReferentiel`, `planDeComptes`, `PosteEtat`, `MappingRule`, `ReferentielLoader`, `ReferentielRegistry`, les contrôles de cohérence — **tout vient de 056**. STORY-057 = **données SFD** + **une ligne de registre** + **un artefact** + **la généralisation du build** à N référentiels.

### Build paramétré (N référentiels)

`scripts/referentiels/build.mjs` : refactor **léger** pour boucler sur une liste de définitions `{ code, version, libelle, sources }` (SYSCOHADA + SFD) et écrire un artefact par référentiel, en **conservant l'ordre de clés figé** (déterminisme). Le SYSCOHADA doit sortir **identique** à 056 (AC-7) — vérifier que le refactor ne change **pas** son octet (donc son checksum). *(Si le refactor risque de bouger le SYSCOHADA, préférer une 2ᵉ passe additive laissant intact le chemin SYSCOHADA.)*

### Données SFD (amorce)

- **Plan de comptes SFD** : classes **1 à 9** du référentiel comptable BCEAO des SFD (trésorerie/institutions financières, opérations avec les membres — dépôts/crédits, opérations diverses, valeurs immobilisées, provisions/fonds propres, charges, produits, résultats, **hors bilan classe 9**). Comptes principaux (2–3 chiffres) suffisants pour couvrir la table de passage.
- **Table de passage SFD** : rattachement des comptes SFD aux postes d'un **Bilan SFD** et d'un **Compte de résultat SFD** simplifiés (règles `NET_ACTIF`/`SOLDE_CREDITEUR`/`CHARGE`/`PRODUIT` réutilisées). Distincte de la présentation SYSCOHADA (AC-6).
- **Postes SFD** : structure d'états propre au SFD (au moins `BILAN_ACTIF`, `BILAN_PASSIF`, `COMPTE_RESULTAT`).
- **`paquetFiscal`** : omis (non requis par le moteur d'états ; le fiscal SFD n'est pas au périmètre).

### Version

`sfd-bceao@1.0` (1ʳᵉ version packagée). Le `1.3` cité dans les tests/commentaires n'était qu'un **exemple** de référentiel *non* packagé — il le reste (test négatif conservé).

### Non-régression

- `referentiel-registry.spec.ts` : ajouter l'assertion `resolve('sfd-bceao','1.0')` ≠ null ; **conserver** `resolve('sfd-bceao','1.3') → null` et le SYSCOHADA inchangé.
- Tous les specs 056 (cohérence SYSCOHADA, checksum) restent verts.

---

## Dependencies

**Prérequises (livrées / à livrer avant) :** STORY-038 (registre/loader), STORY-055 (mapping), **STORY-056** (patron `planDeComptes` + build multi-source + cohérence — **doit être mergée avant** : 057 branche sur `dev` à jour).

**Débloque :** EPIC-011 (production d'états multi-référentiel).

**Externes :** structure publique du *Référentiel comptable des SFD de l'UMOA* (BCEAO) ; validation experte du contenu = aval (données SFD internes).

---

## Definition of Done

- [ ] Code (branche `MNV-057`, rebasée sur `dev` **après** merge de 056).
- [ ] **Lint 0 warning · build OK.**
- [ ] **Couverture ≥ 65 branches / 90 fonctions / 90 lignes / 90 statements** (référentiel/** couvert).
- [ ] **Unit + e2e verts.**
- [ ] **AC-1 → AC-8** validés, dont **AC-6** (preuve multi-référentiel) et CC1/CC2/CC3 sur le paquet SFD.
- [ ] **Non-régression** : SYSCOHADA (056) inchangé (artefact + checksum + tests).
- [ ] **Vérification docker réelle** (057 n'écrit **pas** en base) : stack `down -v` → `up --build` ; dans `bilan-service`, `ReferentielLoader` charge `sfd-bceao@1.0` (log `plan=…`) **et** `syscohada-revise@2.1` ; un compte-échantillon mappé via chaque référentiel → **postes distincts** (via `GET /bilan/table-de-passage/dry-run` de 055 avec le référentiel résolu, ou test d'intégration) ; 8/8 services healthy. Consigné dans *Progress Tracking*.
- [ ] Périmètre respecté (statut amorce documenté, aucune consommation d'états, aucune surcharge org).

---

## Story Points Breakdown

- **Données / provenance SFD :** 3 pts — constitution cohérente (plan + table de passage + postes SFD couvrant la structure BCEAO).
- **Code :** 1 pt — généralisation `build.mjs` (N référentiels) + entrée registre.
- **Tests :** 1 pt — CC1/CC2/CC3 SFD + **preuve multi-référentiel** (AC-6) + non-régression SYSCOHADA.
- **Total : 5 points.**

**Rationale :** structurellement un clone de 056 (réutilisation totale du contrat/chargement) ; le coût est la **constitution des données SFD** + la **preuve** du découplage. La contrainte « pas de données SFD internes » plafonne l'ambition à une **amorce** — cadrage assumé, aligné FR-007.

---

## Additional Notes

- **Ne pas** tenter l'exhaustivité comptable SFD : impossible et hors périmètre (dépend de données internes). L'amorce **prouve la machinerie**, elle ne fait pas foi réglementaire.
- Ce patron « ajouter un référentiel = données + 1 ligne de registre + 1 artefact, **zéro code moteur** » est la **démonstration vivante** de P7/D10 — à souligner dans la note de clôture.

---

## Progress Tracking

**Status History :**
- 2026-07-18 : Créée (jumelle de 056 pour SFD-BCEAO ; cadrée « amorce » — objectif = preuve multi-référentiel FR-007) par vivian (Scrum Master).
- 2026-07-18 : Recherche web → données SFD **réelles** extraites du RCSFD officiel (BCEAO), consignées `docs/referentiels/` (plan JSON + `README-sfd-bceao.md`).
- 2026-07-18 : Implémentée + livrée (branche `MNV-057`, PR #8) — `defined → done`.

**Implémentation :** `sfd-bceao@1.0` packagé (plan 156 comptes cl.1-7, 24 postes DIMF 2000/2080, 22 règles). `build.mjs` généralisé à N référentiels (piloté par données) ; **SYSCOHADA byte-identique** (checksum `e9370b14` inchangé). Artefact `sfd-bceao-1.0.json` (sha256 `0509a034`) + entrée registre. `sfd-bceao-coherence.spec` (CC1/CC2/CC3 + AC-6). Aucun code moteur touché.

**Vérification docker RÉELLE :** 2 paquets chargés dans le conteneur `prospera-bilan-service-1` — `syscohada-revise@2.1 chargé (plan=174…)` **et** `sfd-bceao@1.0 chargé (plan=156, postes=24, mapping=22)`, checksums vérifiés, **CC2 SFD = 0 orphelin**, **AC-6** : compte « 52 » → `BILAN_ACTIF/BS` (SYSCOHADA) vs `BILAN_PASSIF/BP4` (SFD) = **présentations distinctes, même code**. Non-régression SYSCOHADA (174/163/99, checksum inchangé). 057 n'écrit pas en base → preuve = chargement réel.

**Revue** `/code-review high` : 1 constat (`@ts-check` : `pkg.paquetFiscal` post-hoc → TS2339) **corrigé** (spread conditionnel, checksum inchangé).

**Qualité :** lint 0 · build OK · **164 unit (26 suites) + 28 e2e (4 suites)** · couverture > seuils.

**Actual Effort :** 5 points (conforme).

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
