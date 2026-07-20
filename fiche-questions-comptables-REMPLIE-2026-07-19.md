# Fiche de questions comptables — Liasse OHADA (bilan-service) — **RÉPONSES**

> **Date :** 2026-07-19 · **Destinataire :** comptabilité interne Money Vibes Group (utilisateur pilote)
> **Émetteur :** équipe produit PROSPERA · **Référentiel visé :** SYSCOHADA révisé v2.1 (+ SFD-BCEAO)
> **Rempli par :** Claude (proposition experte, à valider par un expert-comptable OHADA / OTR)

> ⚠️ **REVALIDATION 2026-07-20** — Réponses croisées avec les postes GUIDEF réels du repo (`referentiels/postes-syscohada-guidef-togo.csv`)
> + algèbre SYSCOHADA. **Verdict : tout confirmé sauf 2 erreurs corrigées** — **XC** (valeur ajoutée, §B, signe RA/RB) et **CAFG** (§C1b,
> double comptage de TI). Règles figées dans le **tech-spec Bilan B8** ([`tech-spec-bilan-b8-2026-07-20.md`](tech-spec-bilan-b8-2026-07-20.md)),
> encodées en opérandes du paquet SYSCOHADA (sprint 13 / EPIC-011B). Les corrections sont annotées en ligne ci-dessous.

---

## ⚠️ Avertissement & méthode de lecture

Cette fiche est une **proposition experte** fondée sur (a) le SYSCOHADA révisé / AUDCIF et (b) vos fichiers de référence
(`postes-syscohada-guidef-togo`, `table-de-passage-syscohada`, README). Les formules de SIG et de TFT ci-dessous sont
**recoupées avec les libellés officiels** de votre fichier de postes GUIDEF (colonne « Réf. »). Elles restent à **faire signer
par un expert-comptable togolais** avant figement dans le tech-spec Bilan.

Trois types de réponses :

- **✔ VALIDÉ** — la formule pressentie est correcte (parfois avec une note de convention).
- **✏️ CORRIGÉ** — la formule pressentie contient une erreur ; la version corrigée est donnée.
- **→ À FOURNIR PAR MV** — question sur votre installation interne (Sage, sources) que seul le pilote MV peut trancher ; une valeur par défaut est proposée.

### 🔑 Décision transverse n°0 — Convention de signe (à trancher AVANT tout le reste)

C'est le point le plus important, car il conditionne **toute la section B et la section C**.

Le **fichier officiel GUIDEF** encode les SIG en **sommes pures** : `XA = Somme(TA à RB)`, `XD = (XC+RK)`, `XI = (XG+XH+RQ+RS)`.
Cela n'est cohérent que si les **postes de charges `R*` portent un signe négatif** dans la liasse.

La **fiche pressentie**, elle, écrit les charges avec un **moins explicite** (`XA = TA − RA − RB`, `XD = XC − RK`…), ce qui suppose que
les postes `R*` sont stockés en **valeur positive** (magnitude).

**Les deux donnent le même résultat** — à condition de choisir **une seule** convention et de s'y tenir.

**Recommandation :** au niveau **détail**, stocker chaque poste en **valeur positive/magnitude** telle qu'issue de la balance
(un compte de charge classe 6 débiteur → montant positif), et encoder les SIG avec des **opérandes signées** (l'approche de la fiche
pressentie). Motif : c'est plus lisible pour le moteur agnostique et évite d'inverser le signe des classes 6 à l'import.
→ Dans ce cas, **les formules « pressenties » de la fiche sont les bonnes** ; les libellés « Somme TA à RB » du fichier GUIDEF sont à
lire comme une **notation d'affichage** (charges négatives), pas comme la formule d'opérandes.

Toutes les validations ✔ ci-dessous supposent cette convention (**détail = magnitude positive, opérandes signées**).

---

## A. Entrée : format de la balance

| # | Question | Réponse |
|---|---|---|
| A1 | Logiciel(s) comptable(s) MV | **→ À CONFIRMER PAR MV.** Le PRD suppose **Sage 100 « Balance des comptes »** (dogfooding MV). Merci de confirmer version + éventuels autres outils. |
| A2 | Structure d'un export de balance | **→ À FOURNIR PAR MV (fichier exemple anonymisé requis — décision bloquante).** Structure Sage 100 attendue : `N° compte (8 car.)`, `Libellé`, puis blocs **Mouvements N-1**, **Mouvements période**, **Soldes cumulés** (colonnes Débit / Crédit). Idéalement export **Excel/CSV** (parser fiable) ; PDF en secours seulement (cf. FR-A12). |
| A3 | Soldes en valeur ou à calculer | **Proposition : supporter les deux.** Si les colonnes « Soldes cumulés Débit/Crédit » sont présentes → `solde = soldeDébiteur − soldeCréditeur`. Sinon → `solde = Σ débit − Σ crédit` sur les mouvements. Le moteur doit **ignorer les lignes de report** et contrôler par les **totaux** de la balance. → **MV confirme** quelles colonnes sont réellement exportées. |
| A4 | Plan de comptes standard ou interne | **Mixte, déjà géré.** La validation sur la balance réelle **ETS RELAXED** montre un plan **SYSCOHADA normalisé** avec des **sous-comptes internes alphanumériques** (ex. `5211BOA0`) rattachés **par préfixe** via la table de passage. → Règle : rattachement au **préfixe SYSCOHADA** ; comptes non reconnus listés pour arbitrage (FR-A07). |
| A5 | Monnaie / unité | **XOF, exposant ISO 4217 = 0** (pas de sous-unité en circulation). Le système travaille en **unités mineures** → pour le XOF **facteur = 1** (1 XOF = 1 unité mineure), **aucune décimale**. → MV confirme qu'aucune balance n'arrive avec des centimes. |

---

## B. Compte de résultat — cascade des SIG (XA→XI)

Codes recoupés avec `postes-syscohada-guidef-togo` (état `COMPTE_RESULTAT`). Convention : **détail = magnitude positive, opérandes signées** (voir décision n°0).

| SIG | Libellé liasse | Formule pressentie | Statut | Formule retenue (opérandes signées) |
|---|---|---|---|---|
| **XA** | Marge commerciale | `TA − RA − RB` | **✔ VALIDÉ** | `TA − RA − RB` (ventes marchandises − achats marchandises − variation stocks marchandises). *Officiel GUIDEF « Somme TA à RB » = même chose, RA/RB négatifs.* |
| **XB** | Chiffre d'affaires | `TA + TB + TC + TD` | **✔ VALIDÉ** | `TA + TB + TC + TD` (A+B+C+D). |
| **XC** | Valeur ajoutée | `XB + XA(?) + (TE..TI) − (RC..RJ)` | **✏️ CORRIGÉ² (voir ⚠️)** | Retirer le `XA` (double comptage) : ✔. Mais la formule retenue `XB + RA + RB + …` est écrite en notation « somme pure » (RA/RB négatifs) — **incohérente avec la décision n°0** (magnitude signée) et avec `XA = TA − RA − RB` de cette même fiche. ⚠️ **Revalidé 2026-07-20 (B8 §3, correction A)** : sous la convention retenue, RA/RB sont des **charges → à soustraire** : **`XC = XB − RA − RB + (TE+TF+TG+TH+TI) − (RC+…+RJ)`**. *(Vérif : TA=1000,RA=600,TB=2000,RC=800 → VA=1600 ; `+RA`→2800 ✗ ; `−RA`→1600 ✓.)* |
| **XD** | Excédent brut d'exploitation | `XC − RK` | **✔ VALIDÉ** | `XC − RK` (charges de personnel). |
| **XE** | Résultat d'exploitation | `XD + TJ − RL` | **✔ VALIDÉ** | `XD + TJ − RL` (reprises TJ − dotations RL). |
| **XF** | Résultat financier | `(TK+TL+TM) − (RM+RN)` | **✔ VALIDÉ** | `TK + TL + TM − RM − RN`. |
| **XG** | Résultat des activités ordinaires | `XE + XF` | **✔ VALIDÉ** | `XE + XF`. |
| **XH** | Résultat HAO | `(TN+TO) − (RO+RP)` | **✔ VALIDÉ** | `TN + TO − RO − RP`. |
| **XI** | **Résultat net** | `XG + XH − RQ − RS` | **✔ VALIDÉ** | `XG + XH − RQ − RS` (participation travailleurs RQ − impôt sur le résultat RS). |

**Un seul point corrigé : XC.** Toutes les autres formules sont exactes sous la convention retenue.

> **B-décision — Poste de report du résultat au passif.**
> **✔ CONFIRMÉ : XI (résultat net) → poste `CJ` « Résultat net de l'exercice (bénéfice + ou perte −) ».**
> **Poste de destination au passif : `CJ`.** Un **seul** poste, quel que soit le signe (bénéfice positif / perte négative — le signe est porté).
> Le résultat des exercices antérieurs affecté va, lui, en `CH` « Report à nouveau (+ ou −) ».
> **Contrôle d'articulation :** `CJ = XI` (résultat net du CR = résultat net porté au bilan). Tolérance = celle de F2.

---

## C. Tableau des flux de trésorerie (TFT) — 26 postes

Codes recoupés avec l'état `TFT` du fichier de postes. **Attention :** plusieurs lignes d'investissement/financement ne sont **pas
intégralement déductibles d'une balance N/N-1 seule** (il faut le détail des **mouvements bruts** d'immobilisations et l'**affectation
du résultat**). Ces cas sont signalés ⚠️.

### C1. Décisions de méthode

| # | Question | Réponse |
|---|---|---|
| C1a | Directe ou indirecte ? | **✔ INDIRECTE.** Le TFT SYSCOHADA révisé démarre de la **CAFG** (méthode indirecte pour l'opérationnel). C'est aussi le seul choix cohérent avec le squelette (ZA→ZH) fourni. |
| C1b | Formule CAFG (poste FA) | **Méthode soustractive à partir de l'EBE (XD)** — recommandée :<br>`CAFG = XD (EBE) + TI (transferts charges expl.) + TK (revenus financiers) + TM (transferts charges fin.) + TO (autres produits HAO encaissables) − RM (frais financiers) − RP (autres charges HAO décaissables) − RQ (participation) − RS (impôt)`.<br>**Exclure** (non-cash) : dotations `RL`/`RN`, reprises `TJ`/`TL`, production immobilisée `TF`, produits/valeurs de cession `TN`/`RO`, subventions d'investissement.<br>*Vérification :* équivaut à la méthode additive `CAFG = XI + RL + RN − TJ − TL + RO − TN` (mêmes retraitements). **→ à faire valider par l'expert** (le choix des lignes HAO « encaissables/décaissables » mérite confirmation).<br>⚠️ **Revalidé 2026-07-20 (B8 §5, correction B)** : les deux formules **NE sont PAS égales** — en développant XI, l'additif = `XD + TK + TM + TO − RM − RP − RQ − RS`, soit le soustractif **moins TI**. Le soustractif **double-compte TI** (transfert de charges d'exploitation), **déjà dans XD/EBE** (GUIDEF `XC = (XB+RA+RB)+Somme TE à RJ`, TI ∈ TE..RJ). **B8 retient l'ADDITIF** `FA = XI + RL + RN − TJ − TL − TN + RO` (canonique, 100 % dérivable du CR). |
| C1c | Variations = N − N-1 sur postes Bilan ? | **✔ OUI**, sur les valeurs **NET** des postes de bilan (voir C2). Sens : une **hausse d'actif** consomme de la trésorerie (signe −), une **hausse de passif** en dégage (signe +). |

### C2. Source de chaque ligne

| Code | Libellé | Source pressentie | Statut | Source retenue |
|---|---|---|---|---|
| **ZA** | Trésorerie nette au 1er janvier | Trés. actif N-1 − Trés. passif N-1 | **✔ VALIDÉ** | `BT(N-1) − DT(N-1)` = `(BQ+BR+BS)(N-1) − (DQ+DR)(N-1)`. |
| FA | CAFG | *(voir C1b)* | **✔ VALIDÉ** | Formule C1b. |
| FB | − Actif circulant HAO | Δ BA | **✔ VALIDÉ** | `− Δ BA (N−N-1)`. |
| FC | − Variation des stocks | Δ BB | **✔ VALIDÉ** | `− Δ BB (N−N-1)`. |
| FD | − Variation des créances | Δ BG+BH+BI+BJ | **✏️ CORRIGÉ** | `− Δ (BH+BI+BJ)`. **Retirer `BG`** (c'est le **sous-total** « Créances et emplois assimilés », pas un détail → double comptage). |
| FE | + Variation du passif circulant | Δ DH+DI+DJ… | **✏️ COMPLÉTÉ** | `+ Δ (DH+DI+DJ+DK+DM+DN)` (tout le passif circulant détail ; **`DP` est le sous-total**, à exclure). |
| **ZB** | Flux activités opérationnelles | Somme FA à FE | **✔ VALIDÉ** | `FA+FB+FC+FD+FE`. |
| FF/FG/FH | − Acquisitions immo (incorp./corp./fin.) | Δ immobilisations bruts | **⚠️ CORRIGÉ / limite** | `− (immo brute N − immo brute N-1 + valeur brute des sorties)` par nature. **Non calculable depuis une balance N/N-1 seule** : il faut le **détail des mouvements bruts** (note 3/4). En v1 : approximation `− Δ valeur brute` **et** signaler la limite si le détail des cessions manque. FF=incorp. (21), FG=corp. (22-24), FH=fin. (26-27). |
| FI/FJ | + Cessions immo | poste CR TN | **⚠️ VALIDÉ / limite** | `+ TN` (produits des cessions d'immobilisations, du CR). **Ventilation FI (incorp.+corp.) vs FJ (financières)** nécessite le détail de `TN` → sinon tout en FI + note. |
| **ZC** | Flux d'investissement | Somme FF à FJ | **✔ VALIDÉ** | `FF+…+FJ`. |
| FK | + Augmentation de capital (apports nouveaux) | Δ CA | **⚠️ VALIDÉ / limite** | `+ Δ CA` **hors incorporation de réserves** (non-cash). Si la hausse de `CA` provient d'une incorporation de réserves/RAN → exclure. Détail d'affectation requis. |
| FL | + Subventions d'investissement reçues | Δ CB | **✏️ CORRIGÉ** | `+ Δ CL` (poste **`CL` Subventions d'investissement**). **`CB`** dans la pressentie = « Apporteurs capital non appelé (−) » → **erreur**. |
| FM | − Prélèvements sur le capital | Δ CA | **✔ VALIDÉ** | `− Δ CA` (partie à la baisse / prélèvements). |
| FN | − Dividendes versés | affectation résultat N-1 | **⚠️ VALIDÉ / limite** | Issu de l'**affectation du résultat N-1** (résultat N-1 − Δ réserves CF/CG − Δ report à nouveau CH). **Pas un poste de bilan direct** → nécessite la décision d'affectation. |
| **ZD** | Flux capitaux propres | Somme FK à FN | **✔ VALIDÉ** | `FK+…+FN`. |
| FO/FP | + Emprunts / autres dettes fin. | Δ DA+DB+DC | **✏️ CORRIGÉ** | `+ Δ DA` (FO emprunts) et `+ Δ DB` (FP dettes de location-acquisition). **Exclure `DC`** (« Provisions pour risques et charges » = non-cash, ne relève pas des flux). |
| FQ | − Remboursements emprunts | Δ DA+DB+DC | **✏️ CORRIGÉ** | `− Δ (DA+DB)` (partie remboursée). **Exclure `DC`** (idem). |
| **ZE** | Flux capitaux étrangers | Somme FO à FQ | **✔ VALIDÉ** | `FO+FP+FQ`. |
| **ZF** | Flux de financement | ZD + ZE | **✔ VALIDÉ** | `ZD + ZE`. |
| **ZG** | Variation de trésorerie période | ZB + ZC + ZF | **✔ VALIDÉ** | `ZB + ZC + ZF`. |
| **ZH** | Trésorerie nette au 31 décembre | ZG + ZA | **✔ VALIDÉ** | `ZG + ZA`. |

> **Contrôle final — ✔ CONFIRMÉ.**
> `ZH` doit égaler la **trésorerie nette N** du bilan.
> **Trésorerie actif** = `BT` = **`BQ + BR + BS`** ✔ · **Trésorerie passif** = `DT` = **`DQ + DR`** ✔.
> Donc contrôle : `ZH = (BQ+BR+BS)(N) − (DQ+DR)(N)`. Tolérance = F2.

> **Note d'implémentation TFT.** Les lignes **FF–FL, FN** dépendent de données absentes d'une balance N/N-1 (mouvements bruts
> d'immobilisations, affectation du résultat). Recommandation v1 : produire un TFT **« indicatif »** à partir des variations nettes,
> **marqué comme estimé** (statut de preuve, FR-A27), et n'exiger un TFT « validé » que lorsque le détail des mouvements est disponible
> (note 3). Cela évite de bloquer l'équilibre sur des données non fournies par le seul import.

---

## D. Bilan — points à trancher

| # | Question | Réponse |
|---|---|---|
| **D1** | Miroir amortissements 28xx/29xx | **✔ Règle générale.** Les comptes **28x** (amortissements) et **29x** (dépréciations) viennent en colonne **« Amort./Dépréc. »** du poste d'actif brut correspondant (28x/29x → l'immo 2x associée), le **NET** étant reporté au bilan. C'est déjà ce que fait la **table de passage** (`regle = NET_ACTIF`, contra 28x/29x). Correspondances fines déjà mappées (ex. `2831→AK`, `2841/2844→AM`, `296→AR`, `297→AS`). Pas de cas particulier hors ce mapping. |
| **D2** | Placement du résultat au passif | **✔ Poste `CJ`** « Résultat net de l'exercice (bénéfice + ou perte −) ». **Un seul poste**, le **signe est porté** (bénéfice > 0, perte < 0) — **pas** de poste distinct pour la perte. Report antérieur → `CH`. |
| **D3** | Sous-totaux du bilan (composition) | **Actif :** `AZ` (Total actif immobilisé) = `AD+AI+AP+AQ` (nets) · `BK` (Total actif circulant) = `BA+BB+BH+BI+BJ` · `BT` (Trésorerie actif) = `BQ+BR+BS` · **`BZ` (Total général actif) = `AZ+BK+BT+BU`**.<br>**Passif :** `CP` (Capitaux propres) = `CA+CB+CD+CE+CF+CG+CH+CJ+CL+CM` · `DD` (Total dettes financières) = `DA+DB+DC` · `DF` (Ressources stables) = `CP+DD` · `DP` (Passif circulant) = `DH+DI+DJ+DK+DM+DN` · `DT` (Trésorerie passif) = `DQ+DR` · **`DZ` (Total général passif) = `DF+DP+DT+DV`**.<br>**Contrôle :** `BZ = DZ`. |
| **D4** | Ventilation classes 4 et 5 au signe du solde | **✔ CONFIRMÉ.** Un compte de classe 4/5 va à l'**actif si solde débiteur**, au **passif si solde créditeur**. Déjà géré par la table de passage (résolution **au solde**). |
| **D5** | Écarts de conversion | **Traitement spécifique, non netté.** Écart de conversion **actif** (comptes **478**) → poste **`BU`** ; écart **passif** (comptes **479**) → poste **`DV`**. Chacun au solde, présenté **séparément** (jamais compensé). Rappel : les **pertes latentes** (BU) donnent lieu à une **provision** (dotation 6594 / poste RL) — hors périmètre du simple mapping, à signaler. |

---

## E. Notes annexes — périmètre v1

Principe : une note est **automatisable v1** si elle se déduit d'une **simple ventilation du solde** par compte sous-jacent.
Elle est **à compléter** manuellement si elle exige des données **hors balance** (mouvements bruts, **antériorité/aging**, échéancier).

| Note | Poste | Sujet | Automatisable v1 ? |
|---|---|---|---|
| 3 | AD/AI/AP | Immobilisations incorp. & corp. | **☐ oui / ☑ à compléter** — exige le **tableau des mouvements bruts** (acquisitions, cessions) + amortissements, non déductible d'une balance N seule. |
| 4 | AQ | Immobilisations financières | **☐ oui / ☑ à compléter** — mouvements des titres/prêts non dans la balance. |
| 5 | BA | Actif circulant HAO | **☑ oui** — ventilation du solde par compte (485/488). |
| 6 | BB | Stocks et en-cours | **☑ oui** (ventilation par compte 31–38) — *dépréciation 39 en partiel.* |
| 7 | BI | Clients | **☐ oui / ☑ à compléter** — l'**antériorité (aging)** des créances n'est pas dans une balance. Montant global : oui ; ventilation par échéance : non. |
| 8 | BJ | Autres créances | **☑ oui (partiel)** — ventilation par compte oui ; antériorité non. |
| 9 | BQ | Titres de placement | **☑ oui** — ventilation par compte (50x). |
| 10 | BR | Valeurs à encaisser | **☑ oui** — ventilation par compte (51x). |
| 11 | BS | Banques, CCP, caisse | **☑ oui** — ventilation par compte (52/53/57). |
| 12 | BU | Écart de conversion-Actif | **☑ oui** — report direct du solde (478). |
| 17 | BH | Fournisseurs, avances versées | **☑ oui (partiel)** — ventilation par compte (409) ; antériorité non. |

**Synthèse E :** automatisables v1 → **notes 5, 6, 8, 9, 10, 11, 12, 17** (ventilation de solde). À compléter manuellement → **notes 3, 4, 7** (mouvements bruts / antériorité).

| # | Question | Réponse |
|---|---|---|
| E1 | Notes obligatoires manquantes ? | **→ MV tranche.** Candidates fréquemment exigées et **non listées** ici : **Note 15** (capitaux propres / variation), **Note 16** (dettes financières & échéances), **Note 27** (chiffre d'affaires / ventilation), **Note 28** (achats / charges), **Note 3C** (amortissements), **Note 8** (provisions). Merci d'indiquer lesquelles le pilote MV **exige en v1**. |
| E2 | « À compléter » : titre+tableau vide ou trame ? | **Recommandation : trame précise** (titre + tableau **pré-structuré** avec les bonnes colonnes officielles GUIDEF, lignes vides), pas un simple tableau vide. Coût faible, gain de conformité fort et prêt à saisir. |

---

## F. Questions transverses

| # | Question | Réponse |
|---|---|---|
| **F1** | Source de vérité du référentiel SYSCOHADA | **Officielle :** l'**Acte uniforme OHADA relatif au droit comptable (AUDCIF)** pour le plan normalisé + le **gabarit GUIDEF de la DGI/OTR Togo** pour les postes de liasse. **Interne :** le référentiel packagé (`syscohada-revise@2.1`) est détenu par l'**admin-panel** (D12) et doit être **contresigné par un expert-comptable togolais**. → **MV nomme la personne/cabinet responsable de la validation officielle** (question ouverte n°7 du PRD). |
| **F2** | Arrondis / tolérance d'articulation | **Recommandation :** arrondir **au niveau détail** en XOF entier (facteur 1), puis **tolérance paramétrable** sur les contrôles d'articulation. Défaut proposé : **±1 XOF** par contrôle (pour absorber le cumul d'arrondis des sous-totaux), configurable par référentiel. **Actif=Passif** et **CJ=XI** visés à **0** après arrondi détail ; alerte si écart > tolérance. → **MV valide le seuil** (0 strict vs ±1). |
| **F3** | SFD-BCEAO : SIG / TFT propres ? | **SIG : OUI, propres et différents** (marge d'intérêt, produit financier net, excédent/déficit — états **DIMF 2080**). **TFT : NON** dans la version **allégée** du RCSFD (présentation simplifiée, pas de TAFIRE). → Le moteur **agnostique** doit : charger des **opérandes SIG spécifiques** dans le paquet `sfd-bceao@1.0`, et **laisser le TFT vide/désactivé** pour ce référentiel. C'est cohérent avec l'objectif « prouver le multi-référentiel FR-007 ». |
| **F4** | Jeu d'essai de référence | **→ À FOURNIR PAR MV (décision bloquante).** Aujourd'hui disponible : la balance **ETS RELAXED** (`Balance_des_comptes.pdf`), validée à **100 % de mapping** (0 compte orphelin) — mais **sans liasse attendue**. Pour la non-régression comptable, il faut **une balance réelle anonymisée + la liasse correspondante déjà produite par Sage/un expert** (Bilan + CR + TFT + notes). Idéalement en **Excel/CSV**. |

---

## Récapitulatif — décisions bloquantes attendues (statut)

| # | Décision | Statut |
|---|---|---|
| 0 | **Convention de signe** (détail = magnitude positive, opérandes signées) | **Proposé — à confirmer** (conditionne B et C) |
| 1 | **Format de balance + fichier exemple** (A2) | **→ MV doit fournir** |
| 2 | **Composition des 8 SIG** (section B) | **✔ Fournie** — 7 validées, **XC corrigée** |
| 3 | **Méthode TFT (indirecte) + CAFG + sources** (section C) | **✔ Fournie** — méthode & sources ; **4 corrections** (FD, FE, FL, FO/FP/FQ) ; lignes ⚠️ dépendantes de données hors balance signalées |
| 4 | **Miroir amortissements (D1) + poste de report (D2 = CJ)** | **✔ Fournie** |
| 5 | **Liste des notes automatisées v1** (section E) | **✔ Fournie** (5,6,8,9,10,11,12,17 auto ; 3,4,7 manuelles) — MV tranche E1 |
| 6 | **Jeu d'essai de référence** (F4) | **→ MV doit fournir** |

### Ce qui reste à trancher côté MV (non résolu ici)
1. Confirmer **Sage 100** + fournir un **export balance exemple** (Excel/CSV) — A1, A2.
2. Valider la **convention de signe** (décision n°0).
3. Confirmer le **seuil d'arrondi** (F2 : 0 strict ou ±1 XOF).
4. Désigner l'**expert-comptable** validateur du référentiel et du paquet fiscal (F1, PRD Q7).
5. Fournir un **jeu d'essai balance + liasse attendue** (F4).
6. Trancher les **notes obligatoires v1** (E1).

---

*Proposition experte — à valider par un expert-comptable OHADA / OTR avant figement dans le tech-spec Bilan (B8) et encodage des opérandes dans le paquet `syscohada-revise@2.1`.*
