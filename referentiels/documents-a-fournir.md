# Documents à fournir — pour compléter le référentiel Prospera (Togo)

**But :** liste des pièces à récupérer/importer pour que le moteur fiscal et le module Atelier Balance soient **complets, à jour et capables de justifier légalement chaque choix** (optimisation fiscale licite + défense de la liasse face à l'OTR).

**Contexte :** le CGI+LPF OTR 2025 dit *combien* on paie (déjà extrait → `paquet-fiscal`, `procedures-fiscales`, `corpus-complet-cgi-lpf-togo.json`). Les documents ci-dessous disent *comment payer moins légalement*, *comment sécuriser les choix*, et couvrent les **verticaux** (distributeur, microfinance, assurance).

**Légende :** ✅ obtenu · 🟡 partiel · ⬜ à fournir · 🔵 terrain (fin de sprint, tests frontend)

---

## A. Déjà obtenus et structurés (rappel)

| Pièce | Livrable référentiel | Statut |
|---|---|---|
| CGI + LPF OTR 2025 (361 p.) | `paquet-fiscal-togo-2026.json`, `procedures-fiscales-togo.json`, `corpus-complet-cgi-lpf-togo.json` (1185 art.), `corpus-justificatif-fiscal-togo.json` (42 art.) | ✅ |
| Liasse DSF Système Normal (GUIDEF) | `postes-syscohada-guidef-togo.json`, `table-de-passage-syscohada.json` | ✅ |
| Liasse SMT (Système Minimal de Trésorerie) | `postes-smt-togo.json` | ✅ |
| Plan comptable SYSCOHADA révisé | `plan-comptable-syscohada.json` | ✅ |
| Plan comptable SFD-BCEAO + états DIMF | `plan-comptable-sfd-bceao.json`, `README-sfd-bceao.md` | 🟡 (amorce) |
| Barème CNSS (taux 17,5 % + 4 %) | intégré `paquet-fiscal` | 🟡 (plafonds/branches à compléter) |

---

## B. Priorité 1 — Créer des exonérations / réductions d'impôt (leviers les plus lourds)

| # | Document | Ce qu'il débloque | Concerne |
|---|---|---|---|
| B1 | ⬜ **Code des Investissements du Togo** (+ décrets d'application) | Agréments → exonérations **IS / MFP / patente** temporaires, crédits d'impôt investissement (le CGI Art. 121 y renvoie pour l'exo MFP) | Entreprise, distributeur |
| B2 | ⬜ **Régime Zone Franche** (loi zone franche industrielle + **SAZOF** / **PIA Adétikopé**) | IS réduit/nul, exonérations douanières pour activité **exportatrice / négoce international** | **Distributeur**, industriel |
| B3 | ⬜ **Loi de Finances de l'exercice cible** (la plus récente) | Taux à jour + **nouvelles niches** et mesures temporaires ; cale la base légale (code = loi 2018 consolidée LF 2023) | Tous |
| B4 | ⬜ **Charte des PME / Startup Act togolais** (si adopté) | Abattements et régimes allégés jeunes entreprises / startups | PME, cabinet (ses dossiers) |

---

## C. Priorité 2 — Réduire les retenues à la source (transfrontalier)

| # | Document | Levier | Concerne |
|---|---|---|---|
| C1 | ⬜ **Conventions fiscales de non-double imposition** (bilatérales Togo + **Règlement UEMOA 08/2008/CM**) | Le LPF Art. 98 s'applique « **sous réserve des conventions** » → **réduit/annule la retenue 20 %** sur paiements aux fournisseurs/prestataires étrangers | **Distributeur** (imports), entreprise |

---

## D. Priorité 3 — Cadrer amortissements & provisions (déductibilité)

| # | Document | Levier |
|---|---|---|
| D1 | ⬜ **AUDCIF / SYSCOHADA révisé 2017** (Acte uniforme OHADA comptable) | Le fiscal renvoie au comptable (Art. 100 « méthode des composants… droit comptable OHADA ») → fixe les **modes d'amortissement et provisions admis** (leviers Art. 100-102) |
| D2 | ⬜ **Directives UEMOA fiscales** (TVA, accises, IS ; **01/2020** provisions créances douteuses banques, déjà citée Art. 102) | Règles harmonisées opposables |

---

## E. Sécuriser et défendre les choix (story AB-07)

| # | Document | Levier |
|---|---|---|
| E1 | ⬜ **Doctrine administrative OTR** : notes de service, circulaires, **rescrits fiscaux** | Interprétations **opposables** à l'administration — indispensable pour défendre un retraitement |
| E2 | 🟡 **Code de Sécurité Sociale + barème CNSS complet** (plafonds, branches) + ⬜ **arrêté SMIG en vigueur** | Charges patronales déductibles + plancher CNSS |
| E3 | ⬜ **Code du travail togolais + conventions collectives sectorielles** | Indemnités & **provisions congés payés** déductibles (Art. 99 b) |

---

## F. Par persona / vertical

### F.1 Distributeur (négoce, produits financiers/assurance selon vertical)
| # | Document | Levier |
|---|---|---|
| F1 | ⬜ **Régime Zone Franche / PIA** (cf. B2) | Exonérations export/négoce |
| F2 | ⬜ **Conventions fiscales** (cf. C1) | Retenues réduites sur imports |
| F3 | ⬜ **Arrêtés facture normalisée + caisse enregistreuse certifiée** | Conformité → évite l'amende 2 M F (LPF) ; TVA en règle |
| F4 | ⬜ **Barème des marges brutes autorisées** (Art. 134) | Base TPU optimisée quand la marge par produit est fixée par l'administration |
| F5 | ⬜ **Tarif Extérieur Commun (TEC) UEMOA / Code des douanes** | Valeur en douane = base du MFP 2 % à l'import (Art. 120) |

### F.2 Vertical Microfinance (SFD)
| # | Document | Levier |
|---|---|---|
| F6 | 🟡 **Plan comptable SFD-BCEAO (RCSFD)** — *déjà amorcé* : `plan-comptable-sfd-bceao.json` (156 comptes, classes 1-7) | Plan de comptes du vertical microfinance — **à faire valider/compléter** par un expert SFD |
| F7 | 🟡 **États réglementaires SFD** — DIMF 2000 (Bilan) / DIMF 2080 (Compte de résultat), Instr. 025/026-02-2009 | Gabarits de liasse SFD (SIG propres, pas de TFT — cf. fiche F3) — amorce dans `README-sfd-bceao.md` |
| F8 | ⬜ **Loi PARMEC / réglementation prudentielle SFD BCEAO** + régime fiscal spécifique microfinance | Exonérations & particularités fiscales des SFD |

### F.3 Vertical Assurance (CIMA)
| # | Document | Levier |
|---|---|---|
| F9 | ⬜ **Code CIMA** (Conférence Interafricaine des Marchés d'Assurances) | Plan comptable assurance + provisions techniques + cadre de la **TCA** (taux 20/3/6 % déjà extraits) |
| F10 | ⬜ **Liasse / états réglementaires assurance (CIMA)** | Gabarit de sortie du vertical assurance |

### F.4 Autres sectoriels (selon dossiers du cabinet)
- ⬜ **Code minier** / **Code pétrolier** / **Code de l'électricité** togolais → régimes fiscaux dérogatoires.
- ⬜ **Annexes tarifaires enregistrement & timbre** (détail des tarifs, complément du corpus).

---

## G. Terrain — pour tester et valider (fin de sprint, côté frontend) 🔵

| # | Document | Usage |
|---|---|---|
| G1 | 🔵 **Export Sage Excel/CSV ou FEC** (pas le PDF) | Parsing fiable de l'import Sage (STORY-086) |
| G2 | 🔵 **Cahiers recettes/dépenses, factures normalisées, reçus réels** | Jeu d'entraînement OCR (STORY-082-085) |
| G3 | 🔵 **Relevés bancaires + mobile money (TMoney/Flooz)** | Rapprochement bancaire (AB-06) |
| G4 | 🔵 **Exemplaires Statuts, CFE/DFE, carte NIF, RCCM** | Templates OCR profil société (AB-01) |

---

## H. Extension multi-pays (Afrique de l'Ouest → Europe → multinationales)

**Principe (décision D2/D12 déjà actée) :** le moteur est **agnostique** ; un pays = **de la donnée, pas du code**. Pour **chaque pays**, il faut le même **trio d'artefacts versionné `pays × année`**, exactement comme pour le Togo :

1. **Paquet fiscal** (CGI + LPF + Loi de Finances locale) → taux, régimes, retenues, + corpus RAG.
2. **Gabarit de liasse** (DSF officielle du pays) → postes des états financiers.
3. **Référentiel comptable** (plan de comptes + états) + **barème sécurité sociale** local.

On réutilise **le même pipeline d'extraction** que celui appliqué au Togo. Le Togo est la **1ʳᵉ instance de données**.

### Cercles concentriques (du plus simple au plus lourd)

| Cercle | Pays | Compta | Ce qui change / documents à importer | Effort |
|---|---|---|---|---|
| **1. UEMOA** (cible v1.x) | Bénin, Burkina, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal (+ Togo ✅) | **SYSCOHADA identique** (XOF) — plan comptable **déjà réutilisable tel quel** | **Seul le FISCAL change** : par pays → CGI+LPF+LF, gabarit DSF national, barème sécurité sociale (équivalent CNSS). *Que de la donnée.* | 🟢 Faible (données) |
| **2. OHADA hors UEMOA** | Guinée-Conakry (GNF), + zone CEMAC (Cameroun, Gabon…) en franc CFA **XAF** | **SYSCOHADA identique** mais **autre monnaie** | Impose le **multi-devises** (lever « XOF unique v1 ») + CGI local. | 🟡 Moyen (multi-devises) |
| **3. CEDEAO anglophone** | Nigeria, Ghana, Sierra Leone, Liberia, Gambie | **IFRS / GAAP local, HORS OHADA** | **2ᵉ référentiel comptable** (nouveau moteur d'états) + tax codes (FIRS Nigeria, GRA Ghana) + normes locales | 🔴 Élevé (nouveau référentiel) |
| **4. Europe** | France, etc. | **IFRS + plan national** (PCG France, HGB…) | Plans comptables nationaux + **directives comptables UE** + fiscalité nationale (CGI France…) + **TVA intracommunautaire** | 🔴 Élevé (référentiel séparé) |
| **5. Multinationales** (surcouche transverse) | Groupes multi-pays | **Consolidation IFRS** | **IFRS 10/consolidation**, **documentation prix de transfert** (déjà exigée par le CGI Togo), **reporting pays-par-pays CbCR / BEPS-OCDE**, conventions fiscales | 🔴 Élevé (surcouche conso) |

### H.1 Documents **communs à TOUS les pays OHADA** (à réunir une seule fois)

| # | Document | Rôle |
|---|---|---|
| H1 | ⬜ **Acte uniforme OHADA relatif au droit comptable (AUDCIF / SYSCOHADA révisé 2017)** | Plan de comptes + états **Système Normal & SMT** — socle comptable de **tous** les pays OHADA |
| H2 | ⬜ **Acte uniforme sur les sociétés commerciales et le GIE (AUSCGIE)** | Formes juridiques, structuration société (parser Statuts) |
| H3 | ⬜ **Actes uniformes complémentaires** (recouvrement & voies d'exécution, sûretés, procédures collectives) | Selon modules (recouvrement, garanties) |

### H.2 Matrice — documents à importer **par pays OHADA (les 17)**

Pour **chaque** pays, le **même paquet de 5 pièces** : ① **CGI** · ② **LPF** · ③ **Loi de Finances** de l'exercice cible · ④ **gabarit de liasse DSF national** · ⑤ **barème de la caisse de sécurité sociale nationale**. La compta (SYSCOHADA) est commune (H.1) ; seuls le **fiscal**, le **gabarit DSF** et le **social** changent + la **monnaie**.

| Pays OHADA | Zone / Monnaie | 5 pièces (CGI+LPF+LF+DSF+sécu) | Statut |
|---|---|---|---|
| **Togo** | UEMOA / XOF | ✅ CGI+LPF+LF ✅ DSF (GUIDEF) ✅ SMT 🟡 CNSS | ✅ pilote fait |
| Bénin | UEMOA / XOF | ⬜ les 5 | ⬜ |
| Burkina Faso | UEMOA / XOF | ⬜ les 5 | ⬜ |
| Côte d'Ivoire | UEMOA / XOF | ⬜ les 5 | ⬜ |
| Guinée-Bissau | UEMOA / XOF | ⬜ les 5 | ⬜ |
| Mali | UEMOA / XOF | ⬜ les 5 | ⬜ |
| Niger | UEMOA / XOF | ⬜ les 5 | ⬜ |
| Sénégal | UEMOA / XOF | ⬜ les 5 | ⬜ |
| Cameroun | CEMAC / XAF | ⬜ les 5 (+ multi-devises) | ⬜ |
| Centrafrique | CEMAC / XAF | ⬜ les 5 (+ multi-devises) | ⬜ |
| Congo (Brazza) | CEMAC / XAF | ⬜ les 5 (+ multi-devises) | ⬜ |
| Gabon | CEMAC / XAF | ⬜ les 5 (+ multi-devises) | ⬜ |
| Guinée équatoriale | CEMAC / XAF | ⬜ les 5 (+ multi-devises) | ⬜ |
| Tchad | CEMAC / XAF | ⬜ les 5 (+ multi-devises) | ⬜ |
| Comores | Hors zone CFA / KMF | ⬜ les 5 (+ multi-devises) | ⬜ |
| Guinée (Conakry) | Hors zone CFA / GNF | ⬜ les 5 (+ multi-devises) | ⬜ |
| RD Congo | Hors zone CFA / CDF | ⬜ les 5 (+ multi-devises) | ⬜ |

> **Note régimes synthétiques locaux (à confirmer sur la Loi de Finances récente de chaque pays)** : Togo = **TPU**, Sénégal = **CGU** (Contribution Globale Unique), Bénin = **TPS**, Côte d'Ivoire = **impôt des microentreprises**, Mali = **Impôt Synthétique**, Burkina = **CME** (Contribution des Microentreprises). Les autres restent à recenser. Chacun ↔ compta **SMT**.
> **Note monnaie** : seul le bloc **UEMOA (XOF)** fonctionne sans le multi-devises ; **CEMAC (XAF)**, **Comores (KMF)**, **Guinée (GNF)**, **RDC (CDF)** exigent d'abord de lever « XOF unique v1 » (chantier v2).
> **Note caisse sociale** : chaque pays a sa caisse (Togo CNSS, Côte d'Ivoire CNPS, Mali INPS, Sénégal CSS/IPRES…) — noms et barèmes à confirmer localement.

### Documents génériques multi-pays à réunir
- ⬜ **Actes uniformes OHADA** (AUDCIF/SYSCOHADA, AUSCGIE) — communs à tous les pays OHADA (cercles 1-2).
- ⬜ **Normes IFRS** (IASB) — cercles 3-4-5.
- ⬜ **Directives & Règlements UEMOA** (harmonisation fiscale) — cercle 1.
- ⬜ **Directives comptables & TVA de l'Union européenne** — cercle 4.
- ⬜ **Instructions OCDE BEPS** (prix de transfert, CbCR, Pilier 2 / impôt minimum mondial 15 %) — cercle 5.
- ⬜ Par pays cercles 1-2 : **CGI + LPF + Loi de Finances + gabarit DSF + barème sécurité sociale** (même liste que le Togo).

**Trajectoire recommandée :** v1 Togo ✅ → **v1.x autres UEMOA** (que de la donnée) → **v2 multi-devises** (Guinée/CEMAC) → **piste séparée IFRS anglophone/Europe** (2ᵉ référentiel comptable) → **surcouche multinationales** (conso + prix de transfert). Voir mémoire `atelier-balance-module` (D8, « 3 mondes comptables »).

---

## ⭐ À importer en premier (impact maximal)

1. **Code des Investissements du Togo** (B1) — le plus gros levier d'exonération.
2. **Loi de Finances de l'exercice cible** (B3) — met tout le moteur à jour.
3. **Conventions fiscales de non-double imposition** (C1) — clé pour les distributeurs qui importent.

Puis, selon le vertical à lancer : **Zone Franche** (distributeur), **RCSFD/PARMEC** (microfinance), **Code CIMA** (assurance).

> Dépose les fichiers dans ce dossier ; je les extrais et les structure comme le reste (paquet fiscal + corpus RAG + gabarits de liasse).
