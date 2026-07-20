# Tech-spec Bilan — B8 : règles de calcul de la liasse OHADA

> **Date :** 2026-07-20 · **Service :** `bilan-service` · **Référentiel :** SYSCOHADA révisé v2.1 (+ SFD-BCEAO)
> **Source :** valide et fige les réponses de [`fiche-questions-comptables-REMPLIE-2026-07-19.md`](fiche-questions-comptables-REMPLIE-2026-07-19.md)
> (questionnaire [`questions-comptables-bilan-2026-07-19.md`](questions-comptables-bilan-2026-07-19.md)), **croisées avec la source de vérité
> du repo** ([`referentiels/postes-syscohada-guidef-togo.csv`](referentiels/postes-syscohada-guidef-togo.csv) — les libellés GUIDEF portent
> la formule officielle) + algèbre SYSCOHADA.
> **Statut :** proposition figée pour encodage — **sign-off officiel expert-comptable OHADA/OTR toujours dû** (F1). Ne pas confondre ce
> figement d'ingénierie avec une validation réglementaire.

---

## 0. Objet & portée — ce que B8 fige, ce qu'il ne touche pas

EPIC-011 (S12) a livré la liasse en **squelette** : postes de détail agrégés par `regle`, mais les **SIG** (`XA..XI`), les **sous-totaux**
(`AZ`, `BK`, `CP`…) et le **TFT** (`FA..FQ`) sont des postes `type='total' / regle='FORMULE'` avec `comptesSyscohada: []` et **aucune
formule exploitable** (le libellé « Somme TA à RB » est du texte). Ces règles ont été **délibérément renvoyées au tech-spec B8** (hooks
documentés dans STORY-059/060/061/062/063), pour deux raisons structurantes :

1. **Non exploitables machine** : la formule n'existe que dans l'intitulé.
2. **Spécifiques au référentiel** : les coder en dur dans le moteur **violerait l'invariant P7** (moteur agnostique) — SYSCOHADA a 9 SIG,
   SFD-BCEAO en a d'autres (états DIMF 2080) et **aucun TFT**.

**B8 fige donc les règles de calcul et les encode en OPÉRANDES STRUCTURÉES dans le paquet `syscohada-revise@2.1`, jamais dans le code.**
Le moteur gagne un **évaluateur d'opérandes générique** ; la structure comptable reste **donnée**, pas code.

**Hors périmètre B8** (restent différés) : traçage du compte fautif dans les contrôles (hook 063), tables de note détaillées exigeant des
données hors balance (mouvements bruts d'immobilisations, antériorité — notes 3/4/7), consumer de balance réel (EPIC-009 superseded →
handoff `balance-service`), moteur fiscal (EPIC-023).

---

## 1. Décision n°0 — Convention de signe (fondation de tout B8)

**Retenu :** au **détail**, chaque poste est stocké en **valeur positive / magnitude** telle qu'issue de la balance (un compte de charge
classe 6 débiteur → montant positif) ; les formules d'agrégat utilisent des **opérandes signées** (`+`/`−`).

> ⚠️ **Cohérence obligatoire.** C'est la seule convention admise dans tout ce document. Le point le plus délicat est que la fiche REMPLIE
> **s'est elle-même contredite sur XC** (voir §3, correction A) : elle a écrit `XC = XB + RA + RB + …` (notation « somme pure », charges
> négatives) alors que décision n°0 impose la magnitude signée, sous laquelle `XA = TA − RA − RB` (charges soustraites). **Sous la
> convention retenue, XC doit soustraire RA et RB.** Les libellés GUIDEF « Somme TA à RB » sont une **notation d'affichage** (charges
> présentées négatives), pas la formule d'opérandes.

**Statut :** proposé — **à confirmer par MV** (récap fiche, décision n°0). Si MV choisit au contraire la convention « somme pure » (charges
stockées négatives), alors c'est **XA/XD/XE/XF/XH/XI** qu'il faudra ré-signer, et XC (tel qu'écrit dans la fiche) redeviendrait juste. **Une
seule convention, appliquée partout.**

---

## 2. Modèle d'opérandes — extension additive du contrat + évaluateur générique

### 2.1 Extension du contrat `ReferentielPackage` (non cassante)

On étend `MappingRule` d'un champ **additif** `operandes?`, sur le patron exact du champ `tresorerie?` (STORY-061) — un paquet qui ne le
déclare pas continue de charger sans erreur (`?? []`) :

```ts
export interface Operande {
  /** Code du poste référencé (détail, SIG, sous-total, ou poste d'un autre état). */
  poste: string;
  /** Sens dans la formule. */
  signe: '+' | '-';
  /**
   * Mode de lecture de l'opérande. Par défaut 'VALEUR' (valeur N du poste dans le MÊME état).
   * 'VARIATION' = N − N-1 (TFT). 'VALEUR_N_1' = valeur N-1 (ancre trésorerie ZA).
   */
  mode?: 'VALEUR' | 'VARIATION' | 'VALEUR_N_1';
  /** État source si différent de l'état du poste porteur (TFT lit Bilan/CR). Défaut = même état. */
  etatSource?: string;
}

// MappingRule (champ additif) :
//   operandes?: Operande[];   // présent uniquement sur les postes regle='FORMULE'
```

### 2.2 Évaluateur générique (moteur, agnostique P7)

- Un poste `regle='FORMULE'` **avec** `operandes` est calculé par : `Σ signe × lire(operande)`.
- `lire(op)` résout la valeur du poste référencé selon `mode`/`etatSource` **dans les états déjà produits** (Bilan/CR/TFT sur les mêmes
  soldes) : `VALEUR` = montant N ; `VARIATION` = montant N − montant N-1 ; `VALEUR_N_1` = montant N-1.
- **Ordre d'évaluation** : les opérandes peuvent référencer d'autres `FORMULE` (ex. `XC → XB`, `XG → XE, XF`, `BZ → AZ, BK, BT`). Le moteur
  évalue **dans l'ordre de déclaration** du paquet, qui est déjà l'**ordre de cascade** de la liasse (vérifié : `XB` avant `XC`, `AZ` avant
  `BZ`…). Un opérande dont le poste n'est pas encore résolu → erreur de paquet (détectée par test de cohérence, pas au runtime).
- Un poste `FORMULE` **sans** `operandes` conserve le comportement squelette (statut « à compléter »).
- **SFD-BCEAO** ne déclare **pas** d'`operandes` SYSCOHADA → même code, résultat agnostique (ses propres opérandes DIMF viendront dans son
  paquet ; pas de TFT). L'invariant P7 est préservé : **zéro structure OHADA dans le moteur.**

---

## 3. Compte de résultat — SIG `XA..XI` (opérandes signées)

Codes recoupés avec l'état `COMPTE_RESULTAT` du fichier de postes. **Convention : magnitude positive, opérandes signées (§1).**

| SIG | Libellé | Opérandes figées (B8) | Contrôle |
|---|---|---|---|
| **XA** | Marge commerciale | `+TA −RA −RB` | ✔ = GUIDEF |
| **XB** | Chiffre d'affaires | `+TA +TB +TC +TD` | ✔ |
| **XC** | Valeur ajoutée | `+XB −RA −RB +TE +TF +TG +TH +TI −RC −RD −RE −RF −RG −RH −RI −RJ` | **✏️ CORRIGÉ (A)** |
| **XD** | Excédent brut d'exploitation | `+XC −RK` | ✔ |
| **XE** | Résultat d'exploitation | `+XD +TJ −RL` | ✔ |
| **XF** | Résultat financier | `+TK +TL +TM −RM −RN` | ✔ |
| **XG** | Résultat des activités ordinaires | `+XE +XF` | ✔ |
| **XH** | Résultat H.A.O. | `+TN +TO −RO −RP` | ✔ |
| **XI** | **Résultat net** | `+XG +XH −RQ −RS` | ✔ (= `CJ` au passif) |

### Correction A — XC (Valeur ajoutée)

La fiche REMPLIE a **corrigé à raison** le double comptage de `XA` (retiré), mais a laissé `+RA +RB` — incohérent avec décision n°0 et avec
son propre `XA`. Sous la convention retenue, **RA (achats de marchandises) et RB (variation de stocks marchandises) sont des charges → à
soustraire** :

```
XC = XB − RA − RB + (TE+TF+TG+TH+TI) − (RC+RD+RE+RF+RG+RH+RI+RJ)
```

**Vérif numérique** (TA=1 000, RA=600, TB=2 000, RC=800, reste 0) : VA attendue = marge (400) + production vendue (2 000) − conso (800)
= **1 600**. Formule fiche `+RA` → 2 800 ✗. Formule corrigée `−RA` → **1 600 ✓**. C'est cette version qui va dans le paquet.

---

## 4. Bilan — sous-totaux (opérandes)

Recoupés avec `BILAN_ACTIF` / `BILAN_PASSIF`. Tous ✔ (validation D3, aucune correction).

| Poste | Libellé | Opérandes figées |
|---|---|---|
| `AZ` | Total actif immobilisé | `+AD +AI +AP +AQ` |
| `BG` | Créances et emplois assimilés (sous-total) | `+BH +BI +BJ` |
| `BK` | Total actif circulant | `+BA +BB +BG` |
| `BT` | Total trésorerie actif | `+BQ +BR +BS` |
| `BZ` | **Total général actif** | `+AZ +BK +BT +BU` |
| `CP` | Total capitaux propres | `+CA +CB +CD +CE +CF +CG +CH +CJ +CL +CM` |
| `DD` | Total dettes financières | `+DA +DB +DC` |
| `DF` | Total ressources stables | `+CP +DD` |
| `DP` | Total passif circulant | `+DH +DI +DJ +DK +DM +DN` |
| `DT` | Total trésorerie passif | `+DQ +DR` |
| `DZ` | **Total général passif** | `+DF +DP +DT +DV` |

**Points de règle liés (D1/D2/D4/D5, tous ✔ — déjà portés par la table de passage, rappelés ici) :** miroir amortissements 28xx/29xx en
colonne Amort./Dépréc. du poste brut correspondant (`regle=NET_ACTIF`) ; résultat net → poste **unique** `CJ` (signe porté), report antérieur
→ `CH` ; classes 4/5 ventilées **au signe du solde** (actif si débiteur, passif si créditeur) ; écarts de conversion **non nettés** : actif
(478) → `BU`, passif (479) → `DV`. **Contrôle d'équilibre : `BZ = DZ`** (déjà FR-009 AC-2).

---

## 5. TFT / TAFIRE — méthode indirecte (opérandes + statut par ligne)

**Méthode : INDIRECTE** (démarre de la CAFG). Recoupé avec l'état `TFT`. Le TFT lit des **variations de Bilan** (`mode='VARIATION'`) et des
postes de **CR** (`etatSource='COMPTE_RESULTAT'`). Sens : hausse d'actif consomme la trésorerie (−), hausse de passif en dégage (+).

⚠️ **Limite structurelle** : `FF–FL` et `FN` exigent des données **hors balance N/N-1** (mouvements bruts d'immobilisations, affectation du
résultat). En v1, ces lignes produisent une **estimation à partir des variations nettes**, marquée `ESTIME` ou `A_COMPLETER` (statut de
preuve, FR-A27). Le TFT n'est **« validé »** que si aucune ligne bloquante n'est en défaut de données.

| Code | Libellé | Opérandes / source | Statut v1 |
|---|---|---|---|
| `ZA` | Trésorerie nette au 1er janvier | `+BT −DT` en `mode=VALEUR_N_1` | CALCULE si N-1, sinon INDETERMINABLE |
| `FA` | **CAFG** | **additif : `+XI +RL +RN −TJ −TL −TN +RO`** (CR) | CALCULE |
| `FB` | − Actif circulant HAO | `−BA` `mode=VARIATION` | CALCULE |
| `FC` | − Variation des stocks | `−BB` VARIATION | CALCULE |
| `FD` | − Variation des créances | `−BG` VARIATION *(=BH+BI+BJ ; BG, pas BG+détail)* | CALCULE |
| `FE` | + Variation du passif circulant | `+DP` VARIATION *(=DH+DI+DJ+DK+DM+DN)* | CALCULE |
| `ZB` | Flux opérationnels | `+FA +FB +FC +FD +FE` | CALCULE |
| `FF/FG/FH` | − Acquisitions immo (incorp./corp./fin.) | −Δ valeur brute par nature (21 / 22-24 / 26-27) | **ESTIME** (mouvements bruts manquants) |
| `FI/FJ` | + Cessions immo | `+TN` (CR) ; ventilation incorp+corp / fin. si détail | **ESTIME** |
| `ZC` | Flux d'investissement | `+FF..+FJ` | ESTIME (hérite des entrées) |
| `FK` | + Augmentation de capital (apports) | `+CA` VARIATION, **hors incorporation de réserves** | **ESTIME** |
| `FL` | + Subventions d'investissement reçues | `+CL` VARIATION *(pas CB — correction fiche ✔)* | CALCULE |
| `FM` | − Prélèvements sur le capital | `−CA` VARIATION (baisse) | ESTIME |
| `FN` | − Dividendes versés | affectation du résultat N-1 (hors bilan direct) | **A_COMPLETER** |
| `ZD` | Flux capitaux propres | `+FK..+FN` | ESTIME |
| `FO` | + Emprunts | `+DA` VARIATION | CALCULE/ESTIME |
| `FP` | + Autres dettes financières | `+DB` VARIATION *(location-acquisition ; DC exclu — non-cash ✔)* | CALCULE/ESTIME |
| `FQ` | − Remboursements | `−(DA+DB)` VARIATION (part remboursée) | ESTIME (Δ net) |
| `ZE` | Flux capitaux étrangers | `+FO +FP +FQ` | ESTIME |
| `ZF` | Flux de financement | `+ZD +ZE` | — |
| `ZG` | Variation de trésorerie période | `+ZB +ZC +ZF` | — |
| `ZH` | Trésorerie nette au 31 décembre | `+ZG +ZA` | **= trésorerie nette N du Bilan** |

**Contrôle final :** `ZH = (BQ+BR+BS)(N) − (DQ+DR)(N)` = trésorerie nette N du Bilan (tolérance F2). C'est le `controleTresorerie` de
STORY-061, désormais alimenté par les vraies opérandes.

### Correction B — CAFG (`FA`)

La fiche donnait deux formules en les disant équivalentes, **ce qui est faux** : le **soustractif** `XD + TI + TK + TM + TO − RM − RP − RQ − RS`
et l'**additif** `XI + RL + RN − TJ − TL + RO − TN` **diffèrent de `TI`**. En développant `XI`, l'additif se réduit à
`XD + TK + TM + TO − RM − RP − RQ − RS` — soit le soustractif **moins TI**. Le soustractif **double-compte `TI`** (transfert de charges
d'exploitation), **déjà inclus dans `XD`/EBE** (GUIDEF : `XC = (XB+RA+RB)+Somme TE à RJ`, et `TI ∈ [TE..RJ]`).

**B8 retient l'ADDITIF** `FA = +XI +RL +RN −TJ −TL −TN +RO` : entièrement dérivable du CR (opérandes propres, aucun jugement HAO
encaissable/décaissable ligne à ligne), canonique. **Réserve expert (F1) :** l'additif néglige la reprise de subventions d'investissement
virées au résultat — raffinement à trancher au sign-off ; sans impact sur l'articulation `ZH`.

---

## 6. Notes annexes — périmètre v1 (ventilation de solde)

STORY-062 a livré la **synthèse des renvois** (note → postes, montants repris). B8 fige les notes **automatisables v1** = celles déductibles
d'une **simple ventilation du solde par compte sous-jacent** (comptes disponibles via la table de passage) :

- **Automatisables v1 :** notes **5** (BA, 485/488), **6** (BB, 31–38), **8** (BJ), **9** (BQ, 50x), **10** (BR, 51x), **11** (BS, 52/53/57),
  **12** (BU, 478), **17** (BH, 409).
- **À compléter (hors balance) :** notes **3** (AD/AI/AP — mouvements bruts), **4** (AQ — mouvements titres/prêts), **7** (BI — antériorité/aging).
  → **trame pré-structurée** (titre + colonnes officielles GUIDEF, lignes vides), pas un tableau vide (E2).

**E1 (notes obligatoires v1) reste à trancher par MV** : candidates non couvertes ici — Note 15 (variation capitaux propres), 16 (dettes &
échéances), 27 (CA), 28 (achats), 3C (amortissements).

---

## 7. Contrôles d'articulation impactés & tolérance

Une fois les opérandes en place, les contrôles de STORY-063 deviennent **portants** (aujourd'hui vrais par construction sur un squelette) :

- `EQUILIBRE_BILAN` : `BZ = DZ` (bloquant).
- `COHERENCE_RESULTAT` : `CJ = XI` (bloquant).
- `VARIATION_TRESORERIE` : `ZH − ZA = ZG` et `ZH = tréso nette N` (informatif ; INDETERMINABLE si N-1 absent).
- `ARTICULATION_NOTES` : Σ note = Σ postes rattachés (informatif).

**Tolérance (F2) :** arrondi au **XOF entier** (facteur 1, unités mineures) au détail, puis **tolérance paramétrable par référentiel** sur les
articulations. **Défaut proposé : ±1 XOF** par contrôle (absorbe le cumul d'arrondis) — `EQUILIBRE`/`COHERENCE_RESULTAT` visés à 0.
**MV valide le seuil** (0 strict vs ±1).

---

## 8. Décisions bloquantes restant côté MV (inputs, non tranchables ici)

| # | Décision | Effet si non tranché |
|---|---|---|
| n°0 | Confirmer la convention de signe (§1) | Fige le signe de tout B8 (XC dépend du choix) |
| A1/A2 | Confirmer Sage 100 + **fichier balance exemple** (Excel/CSV) | Bloque le parseur d'import réel (amont `balance-service`) |
| F2 | Seuil d'arrondi (0 strict vs ±1 XOF) | Paramètre des contrôles d'articulation |
| F1 | **Expert-comptable validateur** (sign-off officiel) | Aucun figement réglementaire sans lui |
| F4 | **Jeu d'essai balance + liasse attendue** | Bloque la non-régression comptable (preuve e2e) |
| E1 | Notes obligatoires v1 | Périmètre des notes à trame |

> Ces blockers gâtent la **preuve e2e** et l'import réel — **pas** l'encodage des opérandes ci-dessus, qui peut avancer sur les formules
> validées (le moteur se prouve en dry-run sur soldes fournis, comme EPIC-011).

---

## 9. Traçabilité — B8 → stories (EPIC-011B)

| Section B8 | FR complété | Story |
|---|---|---|
| §2 modèle d'opérandes + évaluateur générique | socle FR-009/010/013 | **STORY-110** |
| §3 SIG XA..XI (XC corrigé) | FR-010 | **STORY-111** |
| §4 sous-totaux Bilan | FR-009 | **STORY-112** |
| §5 TFT + CAFG (corrigée) + statut par ligne | FR-011 | **STORY-113** |
| §6 notes v1 automatables | FR-012 | **STORY-114** |

*Encodage dans le paquet `syscohada-revise@2.1` via `scripts/referentiels/build.mjs` (régénérer + MAJ checksum `ReferentielRegistry`) ;
`sfd-bceao@1.0` INCHANGÉ (agnosticisme P7). Aucun code comptable en dur dans le moteur.*
