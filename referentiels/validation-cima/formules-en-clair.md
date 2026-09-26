# `cima-assurances@5.0` — la structure proposée, écrite en clair

> ⚙️ **Fichier GÉNÉRÉ** par [`generer_formules.py`](generer_formules.py) depuis
> [`cima-assurances-5.0.json`](cima-assurances-5.0.json) — ne pas l'éditer à la main.
> `python3 generer_formules.py --verifier` échoue dès que ce document ou la copie de
> l'artefact diverge de ce que le produit sert.

## Identité de l'artefact soumis

| Champ | Valeur |
|---|---|
| Code et version | `cima-assurances@5.0` |
| Empreinte sha256 | `5234764a311cf472bef7f1fd3e8ae1066f6a7c3d8d8cf6849948be92b72c0859` |
| Date de l'artefact | 2026-09-22 |
| Statut déclaré | `amorce` |
| Zone et pays | CIMA — BF, BJ, CF, CG, CI, CM, GA, GQ, GW, ML, NE, SN, TD, TG |
| Postes | 72 |
| Lignes de table de passage | 65, dont 12 formules |
| Comptes au plan packagé | 90 |

**Norme source, telle que l'artefact la déclare :**

> Code des assurances CIMA — Livre IV « Règles comptables applicables aux organismes d’assurance », Chapitre III « Plan comptable particulier à l’assurance et à la capitalisation » (art. 430, classes comptables ; art. 431, liste des comptes ; art. 432, terminologie et fonctionnement — « Le solde du compte 80 est viré, pour clôture des écritures, au compte 87 », qui fait de `80` un compte de regroupement au même titre que `87`, `88` et `89` ; art. 433, états modèles ; art. 334-11, part des cessionnaires jamais compensée), lu avec le Livre III — art. 300 et art. 326 (agrément et spécialisation), Conférence Interafricaine des Marchés d’Assurances — dernière modification structurante : décision du Conseil des Ministres du 2 avril 2008.

**Mise en garde, telle que l'artefact la publie :**

> Structure de liasse et plan de comptes proposés depuis le référentiel CIMA ; les variations de provisions techniques et les cessions en réassurance entrent au résultat technique, brut et cédé publiés séparément et JAMAIS compensés ; le compte 80 « Exploitation générale » est publié dans ses DEUX modèles alternatifs de l’art. 433 — Vie / Capitalisation et Assurances de toute nature — dont UN SEUL s’applique à une entreprise donnée, l’art. 326 interdisant de pratiquer les deux activités ; et les comptes de REGROUPEMENT (80, 87, 88, 89) sont marqués et EXCLUS des racines de gestion, sans quoi le résultat comptable les compte deux fois. Le compte 87 est publié en SQUELETTE : les comptes 82 à 86 ne sont routés vers aucun poste (STORY-672). Restent NON couverts : les états C1..C25 et leur clé de ventilation par catégorie, la reprise de la charge d’impôt déjà comptabilisée, la rétrocession, les cessions « à l’étranger » (6909 / 7909), les plafonds de l’art. 308, le compte 88 et le niveau de détail du plan. À VALIDER par un actuaire avant tout usage réglementaire.

## Les règles de passage, telles que l'artefact les nomme

| Règle | Libellé dans l'artefact |
|---|---|
| `NET_ACTIF` | Solde débiteur net (déduction des amortissements/provisions), présenté à l'actif |
| `SOLDE_CREDITEUR` | Solde créditeur présenté au passif |
| `SOLDE_DEBITEUR` | Solde débiteur présenté à l'actif |
| `CHARGE` | Charge du compte de résultat |
| `PRODUIT` | Produit du compte de résultat |
| `FORMULE` | Agrégat calculé par opérandes signées (totaux du Bilan, résultat technique et résultat net) |

Une opérande marquée **Δ** est une **variation** : la valeur du poste à l'arrêté N moins sa
valeur à l'arrêté N-1. Elle se lit sur un poste de **bilan**, jamais sur un compte de gestion.
Le calcul exact de chaque règle, et ses limites, sont décrits dans [`README.md`](README.md).

## 1. Bilan — actif — `BILAN_ACTIF`

| Poste | Libellé | Règle | Comptes rattachés |
|---|---|---|---|
| **CA1** | Valeurs immobilisées (placements et immobilisations) | `NET_ACTIF` | `20` Frais d'établissement et de développement dans le pays concerné · `21` Immobilisations dans le pays concerné · `22` Immobilisations en cours dans le pays concerné · `23` Valeurs mobilières et titres assimilés (affectables à la représentation) · `24` Prêts et effets assimilés (affectables à la représentation) · `25` Titres de participation · `26` Dépôts et cautionnement · `27` Valeurs garantissant les engagements · `28` Valeurs immobilisées à l'étranger |
| **CA2** | Part des cessionnaires et rétrocessionnaires dans les provisions techniques | `SOLDE_DEBITEUR` | `39` Part des cessionnaires et rétrocessionnaires dans les provisions techniques |
| **CA3** | Créances (assurés et intermédiaires, réassureurs, État, divers) | `SOLDE_DEBITEUR` | `40` Réassureurs, cédants, coassureurs · `41` Assurés et courtiers, agents généraux et autres producteurs · `44` Actionnaires (ou sociétaires) · `45` Filiales (ou société mère) · `46` Débiteurs et créditeurs divers · `48` Comptes de régularisation, actif |
| **CA4** | Comptes financiers (titres de placement, banques, caisse) | `SOLDE_DEBITEUR` | `51` Prêts non affectables à la représentation · `53` Effets à recevoir · `54` Chèques et coupons à encaisser · `55` Titres de placement · `56` Banques et chèques postaux · `57` Caisse |

## 2. Bilan — passif — `BILAN_PASSIF`

| Poste | Libellé | Règle | Comptes rattachés |
|---|---|---|---|
| **CP1** | Capitaux propres *(rôle : `RESULTAT_BILAN`)* | `SOLDE_CREDITEUR` | `10` Capital · `11` Réserves · `12` Report à nouveau · `13` Réserves réglementaires · `14` Subventions d'équipement reçues · `88` Résultats en instance d'affectation |
| **CP2** | Provisions pour risques et charges et dépréciations | `SOLDE_CREDITEUR` | `15` Provisions pour pertes et charges · `19` Provision pour dépréciation des immobilisations et titres |
| **CP3** | Provisions techniques brutes | `SOLDE_CREDITEUR` | `31` Provisions techniques opérations d'assurance directe vie · `32` Provisions techniques opérations d'assurance directe dommages, RC et risques divers · `34` Provisions techniques acceptations vie · `35` Provisions techniques acceptations dommages, RC et risques divers · `38` Provisions techniques à l'étranger |
| **CP4** | Dettes (financières, réassureurs, tiers) | `SOLDE_CREDITEUR` | `16` Emprunts et autres dettes à plus d'un an · `17` Comptes de liaison des établissements et succursales · `18` Dettes pour espèces remises par les cessionnaires et rétrocessionnaires · `42` Personnel · `43` État · `46` Débiteurs et créditeurs divers · `47` Comptes de régularisation, passif · `50` Emprunts à moins d'un an · `52` Effets à payer |

## 3. Bilan — totaux — `BILAN`

### CAT — TOTAL DE L'ACTIF — rôle `TOTAL_ACTIF`

**CAT = CA1 + CA2 + CA3 + CA4**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | `CA1` | Valeurs immobilisées (placements et immobilisations) | bilan actif |
| + | `CA2` | Part des cessionnaires et rétrocessionnaires dans les provisions techniques | bilan actif |
| + | `CA3` | Créances (assurés et intermédiaires, réassureurs, État, divers) | bilan actif |
| + | `CA4` | Comptes financiers (titres de placement, banques, caisse) | bilan actif |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | `20`, `21`, `22`, `23`, `24`, `25`, `26`, `27`, `28` | `CA1` |
| + | `39` | `CA2` |
| + | `40`, `41`, `44`, `45`, `46`, `48` | `CA3` |
| + | `51`, `53`, `54`, `55`, `56`, `57` | `CA4` |

### CPT — TOTAL DU PASSIF — rôle `TOTAL_PASSIF`

**CPT = CP1 + CP2 + CP3 + CP4**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | `CP1` | Capitaux propres | bilan passif |
| + | `CP2` | Provisions pour risques et charges et dépréciations | bilan passif |
| + | `CP3` | Provisions techniques brutes | bilan passif |
| + | `CP4` | Dettes (financières, réassureurs, tiers) | bilan passif |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | `10`, `11`, `12`, `13`, `14`, `88` | `CP1` |
| + | `15`, `19` | `CP2` |
| + | `31`, `32`, `34`, `35`, `38` | `CP3` |
| + | `16`, `17`, `18`, `42`, `43`, `46`, `47`, `50`, `52` | `CP4` |

## 4. Compte de résultat — présentation propre au produit, hors modèles de l'art. 433 — `COMPTE_RESULTAT`

| Poste | Libellé | Règle | Comptes rattachés |
|---|---|---|---|
| **RC1** | Charges de prestations (sinistres, capitaux et rentes) — brutes de la part des réassureurs | `CHARGE` | `60` Prestations dans le pays concerné · `601` Prestations échues (affaires directes vie) · `602` Prestations et frais payés (affaires directes dommages, RC et risques divers) · `604` Prestations échues (acceptations vie) · `605` Prestations et frais (acceptations d'affaires dommages, RC et risques divers) |
| **RC9** | Part des réassureurs dans les prestations et frais | `CHARGE` | `609` Part des réassureurs dans les prestations et frais |
| **RC2** | Frais de personnel | `CHARGE` | `61` Frais de personnel dans le pays concerné |
| **RC3** | Impôts et taxes | `CHARGE` | `62` Impôts et taxes dans le pays concerné |
| **RC4** | Travaux, fournitures et services extérieurs ; transports et déplacements | `CHARGE` | `63` Travaux, fournitures et services extérieurs · `64` Transports et déplacements |
| **RC5** | Commissions | `CHARGE` | `65` Commissions dans le pays concerné |
| **RC6** | Frais divers de gestion | `CHARGE` | `66` Frais divers de gestion |
| **RC7** | Frais financiers (charges de placements) | `CHARGE` | `67` Frais financiers |
| **RC8** | Dotations aux amortissements et provisions | `CHARGE` | `68` Dotations aux amortissements et provisions |
| **RP1** | Primes ou cotisations — brutes de cessions | `PRODUIT` | `70` Primes ou cotisations dans le pays concerné · `701` Primes (affaires directes vie) · `702` Primes (affaires directes dommages, RC et risques divers) · `704` Primes (acceptations vie) · `705` Primes (acceptations dommages, RC et risques divers) |
| **RP6** | Part des réassureurs dans les primes | `PRODUIT` | `709` Part des réassureurs dans les primes |
| **RP2** | Subventions d'exploitation reçues | `PRODUIT` | `71` Subventions d'exploitation reçues |
| **RP3** | Commissions et participations reçues des réassureurs | `PRODUIT` | `75` Commissions et participations reçues des réassureurs |
| **RP4** | Produits accessoires | `PRODUIT` | `76` Produits accessoires |
| **RP5** | Produits financiers (produits de placements) | `PRODUIT` | `77` Produits financiers |

### RV1 — Variation des provisions techniques brutes

**RV1 = Δ CP3**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | Δ `CP3` | Provisions techniques brutes | bilan passif, variation N − N-1 |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | Δ (`31`, `32`, `34`, `35`, `38`) | `CP3` |

### RV2 — Variation de la part des cessionnaires et rétrocessionnaires dans les provisions techniques

**RV2 = Δ CA2**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | Δ `CA2` | Part des cessionnaires et rétrocessionnaires dans les provisions techniques | bilan actif, variation N − N-1 |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | Δ (`39`) | `CA2` |

### RT — Résultat technique (amorce — hors les charges générales que l’art. 432 range au compte 80)

**RT = RP1 + RP6 + RP3 + RP5 − RC1 − RC9 − RC5 − RC8 − RV1 + RV2**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | `RP1` | Primes ou cotisations — brutes de cessions | — |
| + | `RP6` | Part des réassureurs dans les primes | — |
| + | `RP3` | Commissions et participations reçues des réassureurs | — |
| + | `RP5` | Produits financiers (produits de placements) | — |
| − | `RC1` | Charges de prestations (sinistres, capitaux et rentes) — brutes de la part des réassureurs | — |
| − | `RC9` | Part des réassureurs dans les prestations et frais | — |
| − | `RC5` | Commissions | — |
| − | `RC8` | Dotations aux amortissements et provisions | — |
| − | `RV1` | Variation des provisions techniques brutes | — |
| + | `RV2` | Variation de la part des cessionnaires et rétrocessionnaires dans les provisions techniques | — |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | `70`, `701`, `702`, `704`, `705` | `RP1` |
| + | `709` | `RP6` |
| + | `75` | `RP3` |
| + | `77` | `RP5` |
| − | `60`, `601`, `602`, `604`, `605` | `RC1` |
| − | `609` | `RC9` |
| − | `65` | `RC5` |
| − | `68` | `RC8` |
| − | Δ (`31`, `32`, `34`, `35`, `38`) | `RV1` › `CP3` |
| + | Δ (`39`) | `RV2` › `CA2` |

### RN — RÉSULTAT NET DE L'EXERCICE (avant impôt sur les bénéfices — amorce ; tel que les livres le portent, hors variations de provisions techniques)

**RN = RP1 + RP6 + RP2 + RP3 + RP4 + RP5 − RC1 − RC9 − RC2 − RC3 − RC4 − RC5 − RC6 − RC7 − RC8**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | `RP1` | Primes ou cotisations — brutes de cessions | — |
| + | `RP6` | Part des réassureurs dans les primes | — |
| + | `RP2` | Subventions d'exploitation reçues | — |
| + | `RP3` | Commissions et participations reçues des réassureurs | — |
| + | `RP4` | Produits accessoires | — |
| + | `RP5` | Produits financiers (produits de placements) | — |
| − | `RC1` | Charges de prestations (sinistres, capitaux et rentes) — brutes de la part des réassureurs | — |
| − | `RC9` | Part des réassureurs dans les prestations et frais | — |
| − | `RC2` | Frais de personnel | — |
| − | `RC3` | Impôts et taxes | — |
| − | `RC4` | Travaux, fournitures et services extérieurs ; transports et déplacements | — |
| − | `RC5` | Commissions | — |
| − | `RC6` | Frais divers de gestion | — |
| − | `RC7` | Frais financiers (charges de placements) | — |
| − | `RC8` | Dotations aux amortissements et provisions | — |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | `70`, `701`, `702`, `704`, `705` | `RP1` |
| + | `709` | `RP6` |
| + | `71` | `RP2` |
| + | `75` | `RP3` |
| + | `76` | `RP4` |
| + | `77` | `RP5` |
| − | `60`, `601`, `602`, `604`, `605` | `RC1` |
| − | `609` | `RC9` |
| − | `61` | `RC2` |
| − | `62` | `RC3` |
| − | `63`, `64` | `RC4` |
| − | `65` | `RC5` |
| − | `66` | `RC6` |
| − | `67` | `RC7` |
| − | `68` | `RC8` |

## 5. Compte 80 — Vie / Capitalisation (modèle de l'art. 433) — `COMPTE_80_VIE_CAPITALISATION`

| Poste | Libellé | Règle | Comptes rattachés |
|---|---|---|---|
| **EV1** | Prestations échues (affaires directes vie et acceptations) — brutes de la part des réassureurs | `CHARGE` | `601` Prestations échues (affaires directes vie) · `604` Prestations échues (acceptations vie) · `605` Prestations et frais (acceptations d'affaires dommages, RC et risques divers) |
| **EV2** | Part des réassureurs dans les prestations et frais | `CHARGE` | `609` Part des réassureurs dans les prestations et frais |
| **EV3** | Charges de commissions | `CHARGE` | `65` Commissions dans le pays concerné |
| **EV4** | Frais de personnel | `CHARGE` | `61` Frais de personnel dans le pays concerné |
| **EV5** | Impôts et taxes | `CHARGE` | `62` Impôts et taxes dans le pays concerné |
| **EV6** | Travaux, fournitures et services extérieurs ; transports et déplacements | `CHARGE` | `63` Travaux, fournitures et services extérieurs · `64` Transports et déplacements |
| **EV7** | Frais divers de gestion | `CHARGE` | `66` Frais divers de gestion |
| **EV8** | Dotations aux amortissements et provisions | `CHARGE` | `68` Dotations aux amortissements et provisions |
| **EV9** | Charges des placements | `CHARGE` | `67` Frais financiers |
| **EV12** | Commissions et participations reçues des réassureurs | `PRODUIT` | `75` Commissions et participations reçues des réassureurs |
| **EV13** | Produits des placements | `PRODUIT` | `77` Produits financiers |
| **EV14** | Subventions d'exploitation | `PRODUIT` | `71` Subventions d'exploitation reçues |
| **EV15** | Produits accessoires | `PRODUIT` | `76` Produits accessoires |
| **EV10** | Primes et accessoires, nets d'annulations (affaires directes vie et acceptations) — brutes de cessions | `PRODUIT` | `701` Primes (affaires directes vie) · `704` Primes (acceptations vie) · `705` Primes (acceptations dommages, RC et risques divers) |
| **EV11** | Part des réassureurs dans les primes | `PRODUIT` | `709` Part des réassureurs dans les primes |

### EV16 — Variation des provisions techniques brutes

**EV16 = Δ CP3**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | Δ `CP3` | Provisions techniques brutes | bilan passif, variation N − N-1 |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | Δ (`31`, `32`, `34`, `35`, `38`) | `CP3` |

### EV17 — Variation de la part des cessionnaires et rétrocessionnaires dans les provisions techniques

**EV17 = Δ CA2**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | Δ `CA2` | Part des cessionnaires et rétrocessionnaires dans les provisions techniques | bilan actif, variation N − N-1 |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | Δ (`39`) | `CA2` |

### EV18 — SOLDE DU COMPTE 80 — Vie / Capitalisation

**EV18 = EV10 + EV11 + EV12 + EV13 + EV14 + EV15 − EV1 − EV2 − EV3 − EV4 − EV5 − EV6 − EV7 − EV8 − EV9 − EV16 + EV17**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | `EV10` | Primes et accessoires, nets d'annulations (affaires directes vie et acceptations) — brutes de cessions | — |
| + | `EV11` | Part des réassureurs dans les primes | — |
| + | `EV12` | Commissions et participations reçues des réassureurs | — |
| + | `EV13` | Produits des placements | — |
| + | `EV14` | Subventions d'exploitation | — |
| + | `EV15` | Produits accessoires | — |
| − | `EV1` | Prestations échues (affaires directes vie et acceptations) — brutes de la part des réassureurs | — |
| − | `EV2` | Part des réassureurs dans les prestations et frais | — |
| − | `EV3` | Charges de commissions | — |
| − | `EV4` | Frais de personnel | — |
| − | `EV5` | Impôts et taxes | — |
| − | `EV6` | Travaux, fournitures et services extérieurs ; transports et déplacements | — |
| − | `EV7` | Frais divers de gestion | — |
| − | `EV8` | Dotations aux amortissements et provisions | — |
| − | `EV9` | Charges des placements | — |
| − | `EV16` | Variation des provisions techniques brutes | — |
| + | `EV17` | Variation de la part des cessionnaires et rétrocessionnaires dans les provisions techniques | — |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | `701`, `704`, `705` | `EV10` |
| + | `709` | `EV11` |
| + | `75` | `EV12` |
| + | `77` | `EV13` |
| + | `71` | `EV14` |
| + | `76` | `EV15` |
| − | `601`, `604`, `605` | `EV1` |
| − | `609` | `EV2` |
| − | `65` | `EV3` |
| − | `61` | `EV4` |
| − | `62` | `EV5` |
| − | `63`, `64` | `EV6` |
| − | `66` | `EV7` |
| − | `68` | `EV8` |
| − | `67` | `EV9` |
| − | Δ (`31`, `32`, `34`, `35`, `38`) | `EV16` › `CP3` |
| + | Δ (`39`) | `EV17` › `CA2` |

## 6. Compte 80 — Assurances de toute nature (modèle de l'art. 433) — `COMPTE_80_TOUTE_NATURE`

| Poste | Libellé | Règle | Comptes rattachés |
|---|---|---|---|
| **EN1** | Prestations et frais payés (affaires directes dommages, RC et risques divers, et acceptations) — bruts de la part des réassureurs | `CHARGE` | `602` Prestations et frais payés (affaires directes dommages, RC et risques divers) · `604` Prestations échues (acceptations vie) · `605` Prestations et frais (acceptations d'affaires dommages, RC et risques divers) |
| **EN2** | Part des réassureurs dans les prestations et frais | `CHARGE` | `609` Part des réassureurs dans les prestations et frais |
| **EN3** | Charges de commissions | `CHARGE` | `65` Commissions dans le pays concerné |
| **EN4** | Frais de personnel | `CHARGE` | `61` Frais de personnel dans le pays concerné |
| **EN5** | Impôts et taxes | `CHARGE` | `62` Impôts et taxes dans le pays concerné |
| **EN6** | Travaux, fournitures et services extérieurs ; transports et déplacements | `CHARGE` | `63` Travaux, fournitures et services extérieurs · `64` Transports et déplacements |
| **EN7** | Frais divers de gestion | `CHARGE` | `66` Frais divers de gestion |
| **EN8** | Dotations aux amortissements et provisions | `CHARGE` | `68` Dotations aux amortissements et provisions |
| **EN9** | Charges des placements | `CHARGE` | `67` Frais financiers |
| **EN12** | Commissions et participations reçues des réassureurs | `PRODUIT` | `75` Commissions et participations reçues des réassureurs |
| **EN13** | Produits des placements | `PRODUIT` | `77` Produits financiers |
| **EN14** | Subventions d'exploitation | `PRODUIT` | `71` Subventions d'exploitation reçues |
| **EN15** | Produits accessoires | `PRODUIT` | `76` Produits accessoires |
| **EN10** | Primes et accessoires, nets d'annulations (affaires directes dommages, RC et risques divers, et acceptations) — brutes de cessions | `PRODUIT` | `702` Primes (affaires directes dommages, RC et risques divers) · `704` Primes (acceptations vie) · `705` Primes (acceptations dommages, RC et risques divers) |
| **EN11** | Part des réassureurs dans les primes | `PRODUIT` | `709` Part des réassureurs dans les primes |

### EN16 — Variation des provisions techniques brutes

**EN16 = Δ CP3**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | Δ `CP3` | Provisions techniques brutes | bilan passif, variation N − N-1 |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | Δ (`31`, `32`, `34`, `35`, `38`) | `CP3` |

### EN17 — Variation de la part des cessionnaires et rétrocessionnaires dans les provisions techniques

**EN17 = Δ CA2**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | Δ `CA2` | Part des cessionnaires et rétrocessionnaires dans les provisions techniques | bilan actif, variation N − N-1 |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | Δ (`39`) | `CA2` |

### EN18 — SOLDE DU COMPTE 80 — Assurances de toute nature

**EN18 = EN10 + EN11 + EN12 + EN13 + EN14 + EN15 − EN1 − EN2 − EN3 − EN4 − EN5 − EN6 − EN7 − EN8 − EN9 − EN16 + EN17**

| Signe | Opérande | Libellé | Lu sur |
|:---:|---|---|---|
| + | `EN10` | Primes et accessoires, nets d'annulations (affaires directes dommages, RC et risques divers, et acceptations) — brutes de cessions | — |
| + | `EN11` | Part des réassureurs dans les primes | — |
| + | `EN12` | Commissions et participations reçues des réassureurs | — |
| + | `EN13` | Produits des placements | — |
| + | `EN14` | Subventions d'exploitation | — |
| + | `EN15` | Produits accessoires | — |
| − | `EN1` | Prestations et frais payés (affaires directes dommages, RC et risques divers, et acceptations) — bruts de la part des réassureurs | — |
| − | `EN2` | Part des réassureurs dans les prestations et frais | — |
| − | `EN3` | Charges de commissions | — |
| − | `EN4` | Frais de personnel | — |
| − | `EN5` | Impôts et taxes | — |
| − | `EN6` | Travaux, fournitures et services extérieurs ; transports et déplacements | — |
| − | `EN7` | Frais divers de gestion | — |
| − | `EN8` | Dotations aux amortissements et provisions | — |
| − | `EN9` | Charges des placements | — |
| − | `EN16` | Variation des provisions techniques brutes | — |
| + | `EN17` | Variation de la part des cessionnaires et rétrocessionnaires dans les provisions techniques | — |

Développée jusqu'aux comptes :

| Signe | Comptes | Chemin |
|:---:|---|---|
| + | `702`, `704`, `705` | `EN10` |
| + | `709` | `EN11` |
| + | `75` | `EN12` |
| + | `77` | `EN13` |
| + | `71` | `EN14` |
| + | `76` | `EN15` |
| − | `602`, `604`, `605` | `EN1` |
| − | `609` | `EN2` |
| − | `65` | `EN3` |
| − | `61` | `EN4` |
| − | `62` | `EN5` |
| − | `63`, `64` | `EN6` |
| − | `66` | `EN7` |
| − | `68` | `EN8` |
| − | `67` | `EN9` |
| − | Δ (`31`, `32`, `34`, `35`, `38`) | `EN16` › `CP3` |
| + | Δ (`39`) | `EN17` › `CA2` |

## 7. Compte 87 — Compte général de pertes et profits (modèle de l'art. 433) — `COMPTE_87_PERTES_ET_PROFITS`

⛔ **Postes publiés SANS aucune ligne de table de passage** — aucun compte ne les
alimente : l'état les sert vides, avec le statut `A_COMPLETER`.

| Poste | Libellé |
|---|---|
| **PP1** | Pertes ou profits d'exploitation de l'exercice (compte 80) |
| **PP2** | Pertes et profits sur exercices antérieurs |
| **PP3** | Dotations de l'exercice aux provisions hors exploitation et aux réserves réglementaires |
| **PP4** | Pertes et profits exceptionnels |
| **PP5** | Impôts sur les bénéfices |
| **PP6** | Produits et prestations de services échangés entre établissements |
| **PPN** | RÉSULTAT NET DE L'EXERCICE (solde du compte 87) |

## 8. Le plan packagé, et ce que chaque compte alimente

Chaque compte du plan est capté, comme dans le moteur, par le **plus long préfixe** que cite
la table de passage, tous états confondus, et reçoit toutes les lignes qui portent ce préfixe.
Les postes se lisent par leur préfixe : `CA`/`CP` bilan, `RC`/`RP` compte de résultat,
`EV` compte 80 Vie, `EN` compte 80 toute nature. Un compte marqué ⛔ n'alimente **aucun** poste.

| Compte | Libellé (tel que packagé) | Classe | Nature | Postes alimentés |
|---|---|:---:|---|---|
| `10` | Capital | 1 |  | `CP1` |
| `11` | Réserves | 1 |  | `CP1` |
| `12` | Report à nouveau | 1 |  | `CP1` |
| `13` | Réserves réglementaires | 1 |  | `CP1` |
| `14` | Subventions d'équipement reçues | 1 |  | `CP1` |
| `15` | Provisions pour pertes et charges | 1 |  | `CP2` |
| `16` | Emprunts et autres dettes à plus d'un an | 1 |  | `CP4` |
| `17` | Comptes de liaison des établissements et succursales | 1 |  | `CP4` |
| `18` | Dettes pour espèces remises par les cessionnaires et rétrocessionnaires | 1 |  | `CP4` |
| `19` | Provision pour dépréciation des immobilisations et titres | 1 |  | `CP2` |
| `20` | Frais d'établissement et de développement dans le pays concerné | 2 |  | `CA1` |
| `21` | Immobilisations dans le pays concerné | 2 |  | `CA1` |
| `22` | Immobilisations en cours dans le pays concerné | 2 |  | `CA1` |
| `23` | Valeurs mobilières et titres assimilés (affectables à la représentation) | 2 |  | `CA1` |
| `24` | Prêts et effets assimilés (affectables à la représentation) | 2 |  | `CA1` |
| `25` | Titres de participation | 2 |  | `CA1` |
| `26` | Dépôts et cautionnement | 2 |  | `CA1` |
| `27` | Valeurs garantissant les engagements | 2 |  | `CA1` |
| `28` | Valeurs immobilisées à l'étranger | 2 |  | `CA1` |
| `31` | Provisions techniques opérations d'assurance directe vie | 3 |  | `CP3` |
| `32` | Provisions techniques opérations d'assurance directe dommages, RC et risques divers | 3 |  | `CP3` |
| `34` | Provisions techniques acceptations vie | 3 |  | `CP3` |
| `35` | Provisions techniques acceptations dommages, RC et risques divers | 3 |  | `CP3` |
| `38` | Provisions techniques à l'étranger | 3 |  | `CP3` |
| `39` | Part des cessionnaires et rétrocessionnaires dans les provisions techniques | 3 |  | `CA2` |
| `40` | Réassureurs, cédants, coassureurs | 4 |  | `CA3` |
| `41` | Assurés et courtiers, agents généraux et autres producteurs | 4 |  | `CA3` |
| `42` | Personnel | 4 |  | `CP4` |
| `43` | État | 4 |  | `CP4` |
| `44` | Actionnaires (ou sociétaires) | 4 |  | `CA3` |
| `45` | Filiales (ou société mère) | 4 |  | `CA3` |
| `46` | Débiteurs et créditeurs divers | 4 |  | `CA3`, `CP4` |
| `47` | Comptes de régularisation, passif | 4 |  | `CP4` |
| `48` | Comptes de régularisation, actif | 4 |  | `CA3` |
| `49` | Comptes d'attente à régulariser | 4 |  | ⛔ **aucun** |
| `50` | Emprunts à moins d'un an | 5 |  | `CP4` |
| `51` | Prêts non affectables à la représentation | 5 |  | `CA4` |
| `52` | Effets à payer | 5 |  | `CP4` |
| `53` | Effets à recevoir | 5 |  | `CA4` |
| `54` | Chèques et coupons à encaisser | 5 |  | `CA4` |
| `55` | Titres de placement | 5 |  | `CA4` |
| `56` | Banques et chèques postaux | 5 |  | `CA4` |
| `57` | Caisse | 5 |  | `CA4` |
| `59` | Virements internes | 5 |  | ⛔ **aucun** |
| `60` | Prestations dans le pays concerné | 6 |  | `RC1` |
| `601` | Prestations échues (affaires directes vie) | 6 |  | `RC1`, `EV1` |
| `602` | Prestations et frais payés (affaires directes dommages, RC et risques divers) | 6 |  | `RC1`, `EN1` |
| `604` | Prestations échues (acceptations vie) | 6 |  | `RC1`, `EV1`, `EN1` |
| `605` | Prestations et frais (acceptations d'affaires dommages, RC et risques divers) | 6 |  | `RC1`, `EV1`, `EN1` |
| `609` | Part des réassureurs dans les prestations et frais | 6 |  | `RC9`, `EV2`, `EN2` |
| `61` | Frais de personnel dans le pays concerné | 6 |  | `RC2`, `EV4`, `EN4` |
| `62` | Impôts et taxes dans le pays concerné | 6 |  | `RC3`, `EV5`, `EN5` |
| `63` | Travaux, fournitures et services extérieurs | 6 |  | `RC4`, `EV6`, `EN6` |
| `64` | Transports et déplacements | 6 |  | `RC4`, `EV6`, `EN6` |
| `65` | Commissions dans le pays concerné | 6 |  | `RC5`, `EV3`, `EN3` |
| `66` | Frais divers de gestion | 6 |  | `RC6`, `EV7`, `EN7` |
| `67` | Frais financiers | 6 |  | `RC7`, `EV9`, `EN9` |
| `68` | Dotations aux amortissements et provisions | 6 |  | `RC8`, `EV8`, `EN8` |
| `69` | Charges par nature à l'étranger | 6 |  | ⛔ **aucun** |
| `70` | Primes ou cotisations dans le pays concerné | 7 |  | `RP1` |
| `701` | Primes (affaires directes vie) | 7 |  | `RP1`, `EV10` |
| `702` | Primes (affaires directes dommages, RC et risques divers) | 7 |  | `RP1`, `EN10` |
| `704` | Primes (acceptations vie) | 7 |  | `RP1`, `EV10`, `EN10` |
| `705` | Primes (acceptations dommages, RC et risques divers) | 7 |  | `RP1`, `EV10`, `EN10` |
| `709` | Part des réassureurs dans les primes | 7 |  | `RP6`, `EV11`, `EN11` |
| `71` | Subventions d'exploitation reçues | 7 |  | `RP2`, `EV14`, `EN14` |
| `73` | Réductions et ristournes de primes | 7 |  | ⛔ **aucun** |
| `74` | Ristournes, rabais et remises obtenus | 7 |  | ⛔ **aucun** |
| `75` | Commissions et participations reçues des réassureurs | 7 |  | `RP3`, `EV12`, `EN12` |
| `76` | Produits accessoires | 7 |  | `RP4`, `EV15`, `EN15` |
| `77` | Produits financiers | 7 |  | `RP5`, `EV13`, `EN13` |
| `78` | Travaux faits par l'entreprise pour elle-même | 7 |  | ⛔ **aucun** |
| `79` | Produits par nature à l'étranger | 7 |  | ⛔ **aucun** |
| `80` | Exploitation générale | 8 | `REGROUPEMENT` | ⛔ **aucun** |
| `82` | Pertes et profits sur exercices antérieurs | 8 |  | ⛔ **aucun** |
| `83` | Dotation aux provisions exceptionnelles et réserves réglementaires | 8 |  | ⛔ **aucun** |
| `84` | Pertes et profits exceptionnels | 8 |  | ⛔ **aucun** |
| `85` | Impôts sur les bénéfices | 8 |  | ⛔ **aucun** |
| `86` | Produits de prestations de services échangés | 8 |  | ⛔ **aucun** |
| `87` | Compte général de pertes et profits | 8 | `REGROUPEMENT` | ⛔ **aucun** |
| `88` | Résultats en instance d'affectation | 8 | `REGROUPEMENT` | `CP1` |
| `89` | Bilan | 8 | `REGROUPEMENT` | ⛔ **aucun** |
| `00` | Engagements en faveur de l'entreprise | 0 |  | ⛔ **aucun** |
| `01` | Engagements à la charge de l'entreprise | 0 |  | ⛔ **aucun** |
| `03` | Autres charges envers des tiers | 0 |  | ⛔ **aucun** |
| `05` | Plan d'investissement | 0 |  | ⛔ **aucun** |
| `06` | Valeurs reçues en nantissement des cessionnaires et rétrocessionnaires | 0 |  | ⛔ **aucun** |
| `07` | Valeurs appartenant à des institutions de prévoyance | 0 |  | ⛔ **aucun** |
| `08` | Valeurs remises par les organismes réassurés | 0 |  | ⛔ **aucun** |
| `09` | Autres valeurs détenues par l'entreprise | 0 |  | ⛔ **aucun** |

**23 comptes du plan n'alimentent aucun poste** : `49`, `59`, `69`, `73`, `74`, `78`, `79`, `80`, `82`, `83`, `84`, `85`, `86`, `87`, `89`, `00`, `01`, `03`, `05`, `06`, `07`, `08`, `09`.

## 9. Racines de gestion — le périmètre du résultat comptable

`racinesDeGestion` = `6`, `7`, `82`, `83`, `84`, `85`, `86`.

Comptes marqués `REGROUPEMENT`, qu'aucune racine ne capte : `80` Exploitation générale, `87` Compte général de pertes et profits, `88` Résultats en instance d'affectation, `89` Bilan.
