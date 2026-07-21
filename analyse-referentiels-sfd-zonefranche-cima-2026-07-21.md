# Analyse référentiels — SFD complet, Zone franche, CIMA assurances

> **Date :** 2026-07-21 · **Service :** `bilan-service` · **Axe :** moteur multi-référentiel (invariant P7 / D10)
> **Décision utilisateur (2026-07-21) :** traiter SFD (complété), Zone franche et CIMA comme **trois référentiels
> pluggables distincts** ; livrer aujourd'hui **analyse + paquets JSON + stories**.

## 0. Contexte & rappel d'architecture

`bilan-service` est un **moteur d'états agnostique** : il ne connaît aucun plan comptable en dur. Toute la
sémantique d'un référentiel vit dans un **paquet de données** (`ReferentielPackage` : `planDeComptes`, `postes`,
`tableDePassage`, `notes?`, `paquetFiscal?`) chargé et **vérifié par checksum** par le `ReferentielLoader`.
Ajouter un référentiel = **une entrée** dans `scripts/referentiels/build.mjs` + ses sources + **une ligne** dans
`ReferentielRegistry`, **sans toucher au moteur** (P7). Les agrégats (SIG, sous-totaux, résultat technique) sont
encodés en postes `regle='FORMULE'` avec **opérandes signées** (tech-spec B8 §2, moteur `EvaluateurFormule`).

État avant cette analyse : deux référentiels packagés — `syscohada-revise@2.1` (complet, liasse GUIDEF) et
`sfd-bceao@1.0` (**version allégée**, « à valider par expert », classes 1-7, sans totaux calculés ni SIG).

---

## 1. SFD-BCEAO — re-analyse de complétude (`@1.0` allégé → `@2.0` complet)

**Source :** *Référentiel Comptable Spécifique des SFD de l'UMOA* (BCEAO / Commission Bancaire UMOA),
Instruction **n°025-02-2009** (institution) + **n°026-02-2009** (plan de comptes). États **DIMF 2000** (Bilan) et
**DIMF 2080** (Compte de résultat). Cf. [README-sfd-bceao.md](referentiels/README-sfd-bceao.md).

### 1.1 Ce que `@1.0` couvre déjà
Plan de comptes classes 1-7 (trésorerie & IF, opérations membres, opérations diverses, valeurs immobilisées,
fonds propres, charges, produits), postes Bilan actif/passif (BA1..BA4/BP1..BP4) et Compte de résultat
(RC1..RC8 charges, RP1..RP6 produits) en **détail**, table de passage cohérente (plan ⊇ préfixes).

### 1.2 Écarts « allégé → complet » (ce qui manquait)
| # | Manque | Impact | Traitement `@2.0` |
|---|---|---|---|
| G1 | **Aucun total calculé** au Bilan (BAT/BPT existent en postes mais ne sont pas alimentés) | pas de grand total, pas de contrôle d'équilibre | Postes `FORMULE` **BAT = ΣBAi**, **BPT = ΣBPi** (opérandes signées), marqueurs `role` TOTAL_ACTIF/TOTAL_PASSIF ; le résultat (compte 59) est déjà logé dans BP4 → équilibre `BAT = BPT` |
| G2 | **Aucun Solde Intermédiaire de Gestion** (DIMF 2080) : le CR s'arrête aux détails charges/produits, pas d'excédent/déficit | pas de bottom line, CR incomplet | Cascade SIG en postes `FORMULE` : **RSA** résultat financier → **RSB** résultat autres activités → **RSC** résultat brut d'exploitation → **RSD** résultat d'exploitation (595) → **RSE** résultat exceptionnel (596) → **RSF** excédent/déficit avant impôt → **RSG** excédent/déficit net (592) |
| G3 | Comptes SIG du plan (592/593/594/595/596) non exploités | — | référencés par les postes SIG (traçabilité) |
| — | **Pas de TFT/TAFIRE** | *conforme* : le RCSFD **ne prévoit pas** de tableau de flux → `@2.0` n'en déclare **aucun** (agnosticisme P7 : aucun marqueur `tresorerie`) | inchangé |
| — | Classe 8 (hors-bilan / engagements) | *hors états DIMF 2000/2080* → hors amorce (n'entre ni au Bilan ni au CR) | inchangé |

### 1.3 SIG SFD retenus (cascade `@2.0`, à valider par expert SFD)
Convention B8 : magnitudes positives + opérandes signées ; produits `+`, charges `−`.
```
RSA Résultat financier            = +RP1 −RC1
RSB Résultat des autres activités = +RP2 +RP3 −RC2 −RC3
RSC Résultat brut d'exploitation  = +RSA +RSB +RP4 −RC4 −RC5
RSD Résultat d'exploitation (595) = +RSC +RP5 −RC6
RSE Résultat exceptionnel (596)   = +RP6 −RC7
RSF Excédent/déficit avant impôt  = +RSD +RSE
RSG Excédent/déficit net (592)    = +RSF −RC8
```
> La cascade est **ancrée sur les soldes intermédiaires du plan RCSFD** (accounts 592-596) mais son ordonnancement
> reste une **proposition à valider** par un expert SFD avant usage en production (comme l'était `@1.0`).

`@2.0` est **additif** : `@1.0` (et ses 4 specs) reste packagé et intact (les versions coexistent, cf. loader).

---

## 2. Zone Franche Togo (`zone-franche-togo@1.0`)

**Nature :** régime **fiscal/douanier dérogatoire**, **pas un plan comptable**. Une entreprise franche tient
sa compta en **SYSCOHADA révisé**. Cf. [README-zone-franche-togo.md](referentiels/README-zone-franche-togo.md).

**Décision utilisateur :** packagé comme **référentiel pluggable distinct** (pas simple surcouche). Modélisation
honnête (aucune donnée comptable inventée) :
- **plan / postes / table de passage = sources SYSCOHADA révisé réutilisées** (l'assiette comptable EST le SYSCOHADA) ;
- **`paquetFiscal` propre** = barème IS **dégressif** (0 % ans 1-5 · 8 % ans 6-10 · 10 % ans 11-20 · 20 % dès 21),
  exonérations TVA / droits de douane, taxe sur dividendes (exonérée 5 ans puis 50 %) — `pays=TG`, `regime=zone-franche`.

Ce référentiel se distingue du SYSCOHADA de droit commun **uniquement** par son paquet fiscal ; la **liasse
d'états est identique**. Le paquet fiscal sera consommé par le **prévisionnel** (EPIC-013, impôt prévisionnel),
pas par la liasse. Barème **à valider/actualiser par un fiscaliste** (évolue avec les lois de finances).

---

## 3. CIMA assurances (`cima-assurances@1.0`, version allégée)

**Source :** Code CIMA, Chapitre III « Plan comptable particulier à l'assurance et à la capitalisation »,
art. **431** (liste des comptes) et **433** (états modèles). Cf. [README-cima-assurances.md](referentiels/README-cima-assurances.md).

Secteur **exclu du SYSCOHADA** → plan **propre** (classes 1-8 et 0). Particularités : **provisions techniques
(classe 3)** au cœur du passif, **cycle inversé** (primes d'avance / sinistres différés → variations de
provisions techniques dans le résultat), **réassurance** omniprésente, séparation **Vie/Non-Vie**, **pas de TFT**.

**Amorce v1 :**
- `planDeComptes` = **liste officielle art. 431** (comptes à 2 chiffres, libellés verbatim, classes 0-8) ;
- `postes` + `tableDePassage` = **proposition structurellement cohérente** (plan ⊇ préfixes) : Bilan actif
  (valeurs immobilisées, part réassureurs, créances, comptes financiers), Bilan passif (capitaux propres,
  provisions R&C, **provisions techniques brutes**, dettes), Compte de résultat avec **résultat technique**
  (`FORMULE`) et **résultat net** (`FORMULE`). Statut **« à valider par actuaire / expert assurance »** ;
- ventilation fine Vie/Non-Vie, variations de provisions techniques poste à poste, états annexes **C1..C25** →
  **hors amorce**, stories dédiées. Amorce suffisante pour prouver le **4ᵉ référentiel** et le vertical `assurance`.

---

## 4. Livrables & découpage (stories)

| Livrable aujourd'hui | Détail |
|---|---|
| **Doc d'analyse** (ce fichier) + extraits sourcés | `docs/referentiels/README-cima-assurances.md`, `README-zone-franche-togo.md` |
| **Paquets JSON** | `sfd-bceao@2.0`, `zone-franche-togo@1.0`, `cima-assurances@1.0` : sources + `build.mjs` + assets + `ReferentielRegistry` + specs de cohérence |
| **Stories BMAD** | découpage ci-dessous |

| Story | Objet | Réf. |
|---|---|---|
| STORY-120 | **SFD-BCEAO complet** `@2.0` : totaux Bilan (BAT/BPT) + SIG DIMF 2080 (RSA..RSG) en `FORMULE`, additif à `@1.0` | FR-007 |
| STORY-121 | **Référentiel Zone Franche Togo** `@1.0` : présentation SYSCOHADA + **paquet fiscal** dégressif zone franche | FR-005/FR-007 |
| STORY-122 | **Référentiel CIMA assurances** `@1.0` (allégé) : plan art. 431 + Bilan/CR technique & net (`FORMULE`), à valider actuaire | FR-007 |

> **Invariants respectés :** aucun code de plan comptable dans le moteur (P7) ; chaque paquet vérifié par
> checksum ; SYSCOHADA `@2.1` **inchangé** (non-régression 163 postes / 124 mappings) ; `sfd-bceao@1.0`
> **inchangé** (additif `@2.0`). Statuts « à valider par expert » explicites (pas de donnée réglementaire
> présentée comme certifiée — conforme à la règle projet « ne jamais deviner, sourcer l'officiel »).

## 5. Sources (récapitulatif)
- RCSFD BCEAO : instr. 025/026-02-2009 · https://cb-umoa.org/fr/sfd · https://www.bceao.int/fr/documents/principes-comptables-retenus-dans-le-referentiel-comptable-specifique-des-sfd
- CIMA : art. 431 · https://cima-afrique.org/wp-content/code-cima/fr/Article431Listedescomptes.html — art. 433 · https://cima-afrique.org/wp-content/code-cima/fr/Article433Etatsmodeles.html
- Zone franche Togo : https://investissement.gouv.tg/wp-content/uploads/2025/05/Manuel2024V4-2.pdf · https://www.togofirst.com/fr/fiscalite/2310-8770-togo-tout-savoir-sur-le-paiement-de-l-impot-sur-les-societes-is
