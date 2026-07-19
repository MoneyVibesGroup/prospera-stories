# Fiche de questions comptables — Liasse OHADA (bilan-service)

> **Date :** 2026-07-19 · **Destinataire :** comptabilité interne Money Vibes Group (utilisateur pilote)
> **Émetteur :** équipe produit PROSPERA · **Référentiel visé :** SYSCOHADA révisé v2.1 (+ SFD-BCEAO)
> **Objet :** valider les **règles de calcul** des états financiers avant d'implémenter la version « complète » (au-delà du squelette déjà livré).

---

## Pourquoi cette fiche

Le moteur produit déjà, à partir d'une **balance importée** (N et N-1), la charpente de la liasse :
Bilan (actif/passif, contrôle actif = passif), Compte de résultat (produits/charges/résultat net),
et le contrôle de trésorerie. **Ce qui manque pour une liasse complète**, ce sont les **règles de calcul
des sous-totaux et des retraitements**, aujourd'hui absentes du référentiel (elles n'existent que sous
forme de texte dans les intitulés, non exploitable par la machine).

**Ce qu'on vous demande :** pour chaque tableau ci-dessous, **confirmer ou corriger** la formule pressentie
(colonne de droite), et trancher les décisions de méthode. Vous n'avez **rien à recalculer** — seulement
à valider la mécanique. Les cases `[ ]` sont à cocher ; les colonnes « Correction » sont à remplir si besoin.

> ⚠️ Contrainte technique importante : le moteur doit rester **agnostique au référentiel** (même code pour
> SYSCOHADA et SFD-BCEAO). Vos réponses alimentent le **paquet SYSCOHADA**, pas le code. Merci donc de
> raisonner en **codes de postes** (colonne « Réf. » de la liasse : TA, RA, XA…), pas en présentation libre.

---

## A. Entrée : format de la balance

| # | Question | Réponse |
|---|---|---|
| A1 | Quel(s) logiciel(s) comptable(s) la compta MV utilise-t-elle (Sage, autre) ? | |
| A2 | Structure exacte d'un export de **balance** : intitulés de colonnes (n° compte, libellé, débit, crédit, solde débiteur, solde créditeur, N-1 ?) ? Joindre un **fichier exemple** anonymisé. | |
| A3 | Les soldes sont-ils fournis en **valeur** (déjà soldés) ou faut-il calculer solde = débit − crédit ? | |
| A4 | Plan de comptes : est-ce le plan **SYSCOHADA normalisé** standard, ou des comptes internes à re-mapper ? | |
| A5 | Monnaie et unité : XOF en unités entières ? (le système travaille en unités mineures) | |

---

## B. Compte de résultat — cascade des Soldes Intermédiaires de Gestion (SIG)

Les postes **détail** (TA, RA, TB…) sont déjà calculés depuis la balance. Il manque les **8 SIG** (XA→XI),
aujourd'hui déclarés `FORMULE` **sans opérandes**. Merci de valider la composition de chaque solde.

*Convention : les codes en `+` s'ajoutent, les charges (R*) se soustraient conformément à la liasse.*

| SIG | Libellé liasse | **Formule pressentie** (à valider) | ✔ OK | Correction |
|---|---|---|---|---|
| **XA** | Marge commerciale | `TA − RA − RB` (ventes marchandises − achats − Δstock) | [ ] | |
| **XB** | Chiffre d'affaires | `TA + TB + TC + TD` | [ ] | |
| **XC** | Valeur ajoutée | `XB + XA(?) + (TE+TF+TG+TH+TI) − (RC+RD+RE+RF+RG+RH+RI+RJ)` | [ ] | |
| **XD** | Excédent brut d'exploitation | `XC − RK` (charges de personnel) | [ ] | |
| **XE** | Résultat d'exploitation | `XD + TJ − RL` (reprises − dotations) | [ ] | |
| **XF** | Résultat financier | `(TK+TL+TM) − (RM+RN)` | [ ] | |
| **XG** | Résultat des activités ordinaires | `XE + XF` | [ ] | |
| **XH** | Résultat HAO | `(TN+TO) − (RO+RP)` | [ ] | |
| **XI** | **Résultat net** | `XG + XH − RQ − RS` (participation, impôt) | [ ] | |

> **B-décision.** Confirmez que **XI (résultat net) = résultat repris au passif du Bilan** (poste de report).
> Le contrôle d'articulation en dépend. → poste de destination au passif : ______

---

## C. Tableau des flux de trésorerie (TFT / TAFIRE) — 26 postes, **entièrement à définir**

**Aucun** poste TFT n'a de règle de calcul aujourd'hui : c'est un squelette d'affichage. C'est le chantier
le plus lourd. Deux décisions de méthode, puis la source de chaque ligne.

### C1. Décisions de méthode

| # | Question | Réponse |
|---|---|---|
| C1a | Méthode retenue : **directe** ou **indirecte** ? (OHADA : TAFIRE ≈ indirecte à partir de la CAFG) | |
| C1b | **CAFG** (poste FA) : formule exacte à partir du **Compte de résultat** ? (p. ex. EBE − charges décaissées + …) Préciser les postes CR sources. | |
| C1c | Les variations (stocks, créances, passif) se calculent-elles **N − N-1** sur les postes du Bilan ? Si oui, lesquels par ligne (voir C2). | |

### C2. Source de chaque ligne (à remplir : « poste(s) Bilan/CR » + sens)

| Code | Libellé | Source pressentie (à valider) | ✔ | Correction |
|---|---|---|---|---|
| **ZA** | Trésorerie nette au 1er janvier | Trésorerie actif N-1 − Trésorerie passif N-1 | [ ] | |
| FA | CAFG | *(voir C1b)* | [ ] | |
| FB | − Actif circulant HAO | Δ poste BA (N−N-1) | [ ] | |
| FC | − Variation des stocks | Δ poste BB (N−N-1) | [ ] | |
| FD | − Variation des créances | Δ postes BG+BH+BI+BJ | [ ] | |
| FE | + Variation du passif circulant | Δ postes DH+DI+DJ… | [ ] | |
| **ZB** | **Flux activités opérationnelles** | Somme FA à FE | [ ] | |
| FF/FG/FH | − Décaissements acquisitions immo (incorp./corp./fin.) | Δ postes immobilisations bruts | [ ] | |
| FI/FJ | + Encaissements cessions immo | poste CR TN / mouvements | [ ] | |
| **ZC** | **Flux d'investissement** | Somme FF à FJ | [ ] | |
| FK | + Augmentation de capital par apports nouveaux | Δ poste CA | [ ] | |
| FL | + Subventions d'investissement reçues | Δ poste CB | [ ] | |
| FM | − Prélèvements sur le capital | Δ poste CA | [ ] | |
| FN | − Dividendes versés | affectation résultat N-1 | [ ] | |
| **ZD** | **Flux capitaux propres** | Somme FK à FN | [ ] | |
| FO/FP | + Emprunts / autres dettes fin. | Δ postes DA+DB+DC | [ ] | |
| FQ | − Remboursements emprunts | Δ postes DA+DB+DC | [ ] | |
| **ZE** | **Flux capitaux étrangers** | Somme FO à FQ | [ ] | |
| **ZF** | **Flux de financement** | ZD + ZE | [ ] | |
| **ZG** | **Variation de trésorerie de la période** | ZB + ZC + ZF | [ ] | |
| **ZH** | Trésorerie nette au 31 décembre | ZG + ZA | [ ] | |

> **Contrôle final attendu :** ZH doit être égal à la **trésorerie nette N** du Bilan (Trésorerie actif N −
> Trésorerie passif N). Confirmez : les postes de « Trésorerie actif/passif » du Bilan sont bien BQ+BR+BS
> (actif) et DQ+DR (passif) ? ______

---

## D. Bilan — points à trancher

| # | Question | Réponse |
|---|---|---|
| D1 | **Miroir amortissements** : les comptes 28xx/29xx (amort./dépréciations) doivent-ils venir en colonne « Amort./Dépréc. » du poste d'actif brut correspondant ? Règle générale (28x → poste de l'immo 2x) ou cas particuliers ? | |
| D2 | **Placement du résultat** au passif : dans quel poste précis le résultat net va-t-il ? Un poste si bénéfice, un autre si perte ? (codes) | |
| D3 | **Sous-totaux du Bilan** (totaux par classe, total actif, total passif) : composition exacte (liste des postes sommés) ? | |
| D4 | **Ventilation classes 4 et 5** : un compte de classe 4/5 va à l'actif ou au passif **selon le signe de son solde** — confirmez-vous cette règle ? | |
| D5 | **Écarts de conversion** (BU actif / poste passif) : traitement spécifique ? | |

---

## E. Notes annexes — périmètre v1

Le référentiel déclare **11 renvois de note** (ci-dessous). Pour chacun : est-il **automatisable** depuis
la seule balance (✔), ou faut-il le laisser « à compléter » manuellement (les détails type mouvements
d'immobilisations, antériorité des créances ne sont pas déductibles d'une balance) ?

| Note | Poste rattaché | Sujet | Automatisable v1 ? |
|---|---|---|---|
| 3 | AD/AI/AP | Immobilisations incorporelles & corporelles | [ ] oui / [ ] à compléter |
| 4 | AQ | Immobilisations financières | [ ] oui / [ ] à compléter |
| 5 | BA | Actif circulant HAO | [ ] oui / [ ] à compléter |
| 6 | BB | Stocks et en-cours | [ ] oui / [ ] à compléter |
| 7 | BI | Clients | [ ] oui / [ ] à compléter |
| 8 | BJ | Autres créances | [ ] oui / [ ] à compléter |
| 9 | BQ | Titres de placement | [ ] oui / [ ] à compléter |
| 10 | BR | Valeurs à encaisser | [ ] oui / [ ] à compléter |
| 11 | BS | Banques, CCP, caisse | [ ] oui / [ ] à compléter |
| 12 | BU | Écart de conversion-Actif | [ ] oui / [ ] à compléter |
| 17 | BH | Fournisseurs, avances versées | [ ] oui / [ ] à compléter |

| # | Question | Réponse |
|---|---|---|
| E1 | Y a-t-il des notes **obligatoires** manquantes dans cette liste que le pilote MV exige en v1 ? | |
| E2 | Pour les notes « à compléter », un simple **titre + tableau vide** suffit-il, ou faut-il une trame précise ? | |

---

## F. Questions transverses

| # | Question | Réponse |
|---|---|---|
| F1 | **Source de vérité** du référentiel SYSCOHADA v1 (plan normalisé + table de passage) : qui la fournit et la valide officiellement ? | |
| F2 | **Arrondis** : tolérance d'écart admise sur les contrôles d'articulation (0 XOF strict, ou seuil) ? | |
| F3 | **SFD-BCEAO** : dispose-t-on de SIG / TFT propres à ce référentiel, ou est-il volontairement sans SIG ni TFT (présentation simplifiée) ? | |
| F4 | Un **jeu d'essai de référence** (balance réelle anonymisée + liasse attendue déjà produite par un logiciel/expert) est-il disponible pour valider les calculs ? | |

---

## Récapitulatif — décisions bloquantes attendues

1. **Format de balance** + fichier exemple (A2).
2. **Composition des 8 SIG** (section B).
3. **Méthode TFT** (directe/indirecte) + **formule CAFG** + source de chaque flux (section C).
4. **Miroir amortissements** + **poste de report du résultat** (D1, D2).
5. **Liste des notes automatisées v1** (section E).
6. **Jeu d'essai de référence** pour non-régression comptable (F4).

> Ces réponses seront figées dans le **tech-spec Bilan (B8)** puis encodées dans le paquet SYSCOHADA
> (opérandes structurées), sans jamais coder la structure comptable « en dur » dans le moteur.

---

*Rempli par : ________________  ·  Fonction : ________________  ·  Date : ____ / ____ / ______*
