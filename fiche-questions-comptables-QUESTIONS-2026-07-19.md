# Fiche de questions comptables — Liasse OHADA (bilan-service) — **QUESTIONS SEULES**

> Version « questions claires » de `fiche-questions-comptables-REMPLIE-2026-07-19.md`.
> Destinataire : comptabilité interne Money Vibes / expert-comptable OHADA-OTR.
> Chaque question porte un tag : **[BLOQUANT]** = décision requise avant de coder · **[À CONFIRMER]** = une réponse est proposée dans la fiche remplie, il faut la valider · **[À TRANCHER]** = choix ouvert côté MV.

---

## A. Entrée — format de la balance

**1-/** Quel(s) logiciel(s) comptable(s) Money Vibes utilise-t-il réellement ? (Sage 100 « Balance des comptes » supposé — confirmer la version et d'éventuels autres outils.) **[À CONFIRMER]**

**2-/** Quelle est la structure exacte d'un export de balance ? → fournir **un fichier exemple anonymisé** (idéalement **Excel/CSV**, PDF en secours). **[BLOQUANT]**

**3-/** Les soldes sont-ils exportés **en valeur** (colonnes « Soldes cumulés Débit/Crédit ») ou faut-il les **recalculer** depuis les mouvements ? Quelles colonnes sont réellement exportées ? **[À CONFIRMER]**

**4-/** Le plan de comptes est-il **standard SYSCOHADA** ou avec des **sous-comptes internes alphanumériques** (ex. `5211BOA0`) ? → valider le rattachement **par préfixe** et le traitement des comptes non reconnus. **[À CONFIRMER]**

**5-/** Monnaie/unité : **XOF sans décimale** (facteur 1) confirmé ? Des balances peuvent-elles arriver avec des centimes ? **[À CONFIRMER]**

---

## B. Compte de résultat — les 8 soldes intermédiaires (SIG)

**6-/** **Convention de signe** : stocke-t-on chaque poste de détail en **valeur positive (magnitude)** avec des **opérandes signées** dans les formules de SIG ? (Décision n°0 — conditionne toute la section B **et** la section C.) **[BLOQUANT]**

**7-/** Valide-t-on la **composition des 8 SIG** : XA (marge commerciale), XB (chiffre d'affaires), **XC (valeur ajoutée — formule corrigée : retirer le double comptage de XA)**, XD (EBE), XE (résultat d'exploitation), XF (résultat financier), XG (résultat des activités ordinaires), XH (résultat HAO), XI (résultat net) ? **[À CONFIRMER]**

**8-/** Confirme-t-on que le **résultat net (XI)** est reporté au passif dans le **poste unique `CJ`** (signe porté : bénéfice + / perte −) et que le résultat antérieur affecté va en **`CH`** (report à nouveau) ? Contrôle d'articulation `CJ = XI`. **[À CONFIRMER]**

---

## C. Tableau des flux de trésorerie (TFT — 26 postes)

**9-/** Méthode TFT : **indirecte** (démarrage à la CAFG) confirmée ? **[À CONFIRMER]**

**10-/** Valide-t-on la **formule de la CAFG** (poste FA) proposée (méthode soustractive à partir de l'EBE, avec la liste des lignes HAO « encaissables/décaissables ») ? **[À CONFIRMER par l'expert]**

**11-/** Confirme-t-on que les variations se calculent **N − N-1 sur les valeurs NET** des postes de bilan, avec le sens : **hausse d'actif = −** (consomme la trésorerie), **hausse de passif = +** ? **[À CONFIRMER]**

**12-/** Valide-t-on les **sources des 26 lignes** du TFT, y compris les **4 corrections** (FD, FE, FL, FO/FP/FQ) et les sous-totaux exclus (BG, DP, DC) ? **[À CONFIRMER]**

**13-/** Accepte-t-on qu'en **v1** les lignes dépendant de **données hors balance** (FF–FL, FN : mouvements bruts d'immobilisations, affectation du résultat, dividendes) soient produites en **TFT « indicatif / estimé »** (statut de preuve), le TFT « validé » n'étant exigé que lorsque le détail des mouvements est fourni ? **[À TRANCHER]**

---

## D. Bilan — points à trancher

**14-/** Miroir des amortissements : les comptes **28xx** (amort.) et **29xx** (dépréc.) viennent-ils en colonne « Amort./Dépréc. » du poste d'actif brut, le **NET** étant reporté au bilan ? **[À CONFIRMER]**

**15-/** Placement du résultat au passif = **`CJ`**, poste unique, **signe porté** (pas de poste distinct pour la perte) : confirmer. **[À CONFIRMER]**

**16-/** Valide-t-on la **composition des sous-totaux du bilan** (Actif : AZ, BK, BT, **BZ** ; Passif : CP, DD, DF, DP, DT, **DZ**) et le **contrôle `BZ = DZ`** ? **[À CONFIRMER]**

**17-/** Ventilation des **classes 4 et 5 au signe du solde** (actif si débiteur, passif si créditeur) : confirmer. **[À CONFIRMER]**

**18-/** Écarts de conversion : **actif (478) → `BU`**, **passif (479) → `DV`**, présentés **séparément** (jamais compensés) ; pertes latentes BU → provision. Confirmer. **[À CONFIRMER]**

---

## E. Notes annexes — périmètre v1

**19-/** Quelles **notes annexes** le pilote MV **exige-t-il en v1** ? (Notamment celles non listées : **15** capitaux propres, **16** dettes financières & échéances, **27** chiffre d'affaires, **28** achats/charges, **3C** amortissements, provisions.) **[À TRANCHER]**

**20-/** Valide-t-on le **périmètre automatisable v1** proposé : notes **5, 6, 8, 9, 10, 11, 12, 17** en automatique (ventilation de solde) ; notes **3, 4, 7** à compléter manuellement (mouvements bruts / antériorité) ? **[À CONFIRMER]**

**21-/** Pour les notes « à compléter » : produit-on une **trame pré-structurée** (titre + tableau aux colonnes officielles GUIDEF, lignes vides — recommandé) ou un simple tableau vide ? **[À TRANCHER]**

---

## F. Questions transverses

**22-/** Qui est la **source de vérité et le validateur officiel** du référentiel SYSCOHADA (nommer l'**expert-comptable / cabinet** responsable de la validation) ? (Question ouverte n°7 du PRD.) **[BLOQUANT]**

**23-/** Quel **seuil d'arrondi / tolérance d'articulation** retient-on : **0 strict** ou **±1 XOF** par contrôle ? (Actif=Passif et CJ=XI visés à 0 après arrondi détail.) **[À TRANCHER]**

**24-/** Pour le **référentiel SFD-BCEAO** : confirme-t-on que le moteur charge des **SIG spécifiques** (états DIMF 2080) et **désactive le TFT** (absent de la version allégée du RCSFD) ? **[À CONFIRMER]**

**25-/** Peut-on disposer d'un **jeu d'essai de référence** : une **balance réelle anonymisée + la liasse attendue** correspondante (Bilan + CR + TFT + notes), idéalement en Excel/CSV, pour la non-régression ? **[BLOQUANT]**

---

## Récapitulatif — les 4 décisions **bloquantes**

- **2-/** Fichier exemple de balance (format).
- **6-/** Convention de signe (décision n°0).
- **22-/** Désigner l'expert-comptable validateur.
- **25-/** Jeu d'essai balance + liasse attendue.

*(Les autres questions ont une réponse proposée dans la fiche remplie ; il s'agit de la confirmer ou de trancher un choix.)*
