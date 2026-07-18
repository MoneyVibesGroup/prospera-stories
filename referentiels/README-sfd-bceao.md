# Référence SFD-BCEAO pour STORY-057 (extraite du RCSFD officiel)

**Source :** *Référentiel Comptable Spécifique des Systèmes Financiers Décentralisés de l'UMOA — Version allégée, 1ʳᵉ édition* (BCEAO / Commission Bancaire UMOA). Institué par **Instruction n°025-02-2009** ; mise en œuvre du plan de comptes = **Instruction n°026-02-2009**.
- PDF : https://www.cb-umoa.org/sites/default/files/2022-05/Référentiel comptable spécifique des SFD_1.pdf
- Portail : https://cb-umoa.org/fr/sfd

> ⚠️ Ne PAS confondre avec le **PCB** (Plan Comptable Bancaire révisé, décision n°357-11-2016) qui vise les **banques**, pas les SFD.

## Plan de comptes SFD — classes 1 à 7 (états financiers ; classe 8 hors-bilan = hors amorce)

### CLASSE 1 — Opérations de trésorerie et avec les institutions financières
- 10 Valeurs en caisse · 101 Billets et monnaies (1011 émis par BCEAO)
- 11 Comptes ordinaires chez les IF · 113 CCP · 114 Banques et correspondants · 116 SFD · 117 Autres IF
- 12 Autres comptes de dépôts chez les IF · 126 Dépôts à terme constitués · 127 Dépôts de garantie · 128 Autres dépôts
- 13 Comptes de prêts aux IF · 131 Prêts < 1 an · 133 Prêts à terme
- 15 Comptes ordinaires des IF · 154 Banques · 156 SFD · 157 Autres IF
- 16 Autres comptes de dépôts des IF · 161 Dépôts à terme reçus · 162 Dépôts de garantie reçus · 165 Autres dépôts reçus
- 17 Emprunts et autres sommes dues aux IF · 175 Emprunts < 1 an · 178 Emprunts à terme · 179 Autres sommes dues
- 18 Ressources affectées · 181 CT · 182 MT · 183 LT · 184 Intérêts capitalisés
- 19 Comptes de prêts en souffrance et immobilisés · 191 Prêts immobilisés · 192/193/194 en souffrance · 199 Provisions

### CLASSE 2 — Opérations avec les membres, bénéficiaires ou clients
- 20 Crédits aux membres · 202 Crédits CT (2022 ordinaires, 2023 découverts) · 203 Crédits MT
- 25 Comptes des membres · 251 Comptes ordinaires · 2512 sur livret · 252 Dépôts à terme reçus · 253 Épargne à régime spécial · 254 Dépôts de garantie reçus · 255 Autres dépôts reçus
- 27 Emprunts et autres sommes dues aux membres · 271 Emprunts · 272 Autres sommes dues
- 29 Crédits en souffrance · 291 immobilisés · 292/293/294 souffrance · 299 Provisions

### CLASSE 3 — Opérations sur titres et opérations diverses
- 30 Titres de placement · 32 Stocks et emplois divers (321/322/323) · 33 Débiteurs (331) et créditeurs (332) divers
- 37 Comptes transitoires et d'attente (378/379) · 38 Comptes de régularisation actif (381) / passif (382)

### CLASSE 4 — Valeurs immobilisées
- 41 Immobilisations financières · 412 Titres de participation
- 42 Dépôts et cautionnements (421)
- 43 Immobilisations en cours · 431 incorporelles · 432 corporelles
- 44 Immobilisations d'exploitation · 441 incorporelles (4418 amort.) · 442 corporelles (4428 amort.)

### CLASSE 5 — Provisions, fonds propres et assimilés
- 50 Subventions et autres fonds reçus (501 investissement, 502 fonds affectés, 503 fonds de crédit)
- 51 Provisions pour risques et charges · 52 Provisions réglementées · 53 Emprunts et titres émis subordonnés
- 54 Fonds pour risques financiers généraux · 55 Primes liées au capital et réserves (551/552)
- 56 Fonds de dotation · 57 Capital social (571) · 58 Report à nouveau · 59 Résultat (592 exercice, 593 marge…)

### CLASSE 6 — Comptes de charges
- 60 Charges d'exploitation financière (601 IF, 602 membres, 603 titres/divers, 604 valeurs immo, 605 fonds propres, 608 prestations, 609 autres)
- 61 Achats et variations de stocks · 62 Autres charges externes et diverses d'exploitation (621/622/623)
- 63 Impôts, taxes et versements assimilés · 64 Charges de personnel (641/642/643)
- 65 Dotation au fonds pour risques financiers généraux · 66 Dotations amort./provisions/pertes sur créances irrécouvrables
- 67 Charges exceptionnelles et pertes sur exercices antérieurs · 69 Impôts sur les excédents (691/692)

### CLASSE 7 — Comptes de produits
- 70 Produits d'exploitation financière (701 IF, 702 membres, 703 titres/divers, 704 valeurs immo, 708 prestations, 709 autres)
- 71 Ventes · 72 Produits divers d'exploitation · 74 Subventions d'exploitation
- 75 Reprises du fonds pour risques financiers généraux · 76 Reprises amort./provisions/récupérations · 77 Produits exceptionnels

## États de synthèse SFD
- **DIMF 2000 : Bilan** — actif (opérations IF, opérations membres = crédits, opérations diverses, immobilisations) ; passif (opérations IF, opérations membres = dépôts, opérations diverses, provisions/fonds propres/assimilés).
- **DIMF 2080 : Compte de résultat** — charges (classe 6) / produits (classe 7), + Soldes Intermédiaires de Gestion (marge d'intérêt, produit financier net, excédent/déficit).
- Codification poste = 3 caractères, 1ᵉʳ alphabétique = classe rattachée.

## Table de passage amorce (règles de solde) — proposée pour 057
- Classe 1 : ACTIF si débiteur (10/11/12/13 trésorerie, prêts) / PASSIF si créditeur (15/16/17 dépôts et emprunts reçus). Ambiguïté au solde (comme classes 4/5 SYSCOHADA).
- Classe 2 : 20 (crédits) → ACTIF ; 25/27 (dépôts, emprunts membres) → PASSIF ; 29 souffrance → ACTIF (net de provisions 299).
- Classe 3 : 33/37/38 → ACTIF ou PASSIF au solde (débiteurs/créditeurs divers, régularisations).
- Classe 4 : → ACTIF (net d'amortissements 4418/4428/provisions 4419/4429).
- Classe 5 : → PASSIF (fonds propres, provisions, subventions).
- Classe 6 : → CHARGE (Compte de résultat). Classe 7 : → PRODUIT (Compte de résultat).

## Décision de cadrage 057
Version proposée `sfd-bceao@1.0`. Amorce STRUCTURELLEMENT cohérente (plan ⊇ table de passage), statut « à valider par expert », suffisante pour **prouver le multi-référentiel FR-007**. Classe 8 (hors bilan) hors amorce (n'entre pas dans Bilan/CR).
