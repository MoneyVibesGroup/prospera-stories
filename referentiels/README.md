# Référentiels — amorces (2026-07-12)

Amorces de référentiels pour le module **Atelier Balance** / `bilan-service`, extraites des documents fournis par l'utilisateur le 2026-07-12. **Statut : brouillons à documenter et valider par un expert** (voir `rapport-bilan-logique-metier-2026-07-12.md`).

## Fichiers

| Fichier | Contenu | Source | Statut |
|---|---|---|---|
| `postes-syscohada-guidef-togo.csv` / `.json` | **163 postes** d'états financiers (codes officiels + libellés + renvoi note) : Bilan Actif (30), Bilan Passif (29), Compte de Résultat (43), TFT (26), Résultat fiscal (23), Liquidation IS (12) | Extrait de la liasse GUIDEF `1000745307_2025_Definitif (1).xlsx` (DSF Togo, Système Normal) | Amorce — base de la **table de passage** comptes→postes |
| `paquet-fiscal-togo-2026.json` | Taux & règles fiscales Togo : IS 27 %, **IRPP barème 8 tranches (haute 35 %)**, MFP 1 % (2 % véhicules d'occasion, impôt = max(MFP, IS)), TVA 18 %, **TPU (plafond 60 M ; forfaitaire ≤ 30 M / déclaratif 2 %-8 %, min 20 000 F)**, **TAF 10 %**, **TCA (20/3/6 %)**, retenues capitaux mobiliers, accises, **CNSS (17,5 % + 4 %)**, 4 acomptes, réintégrations/déductions | **CGI + LPF OTR 2025** (361 p.) + barème CNSS utilisateur | **✅ COMPLET — à valider expert** (révision 2026-07-19) |
| `procedures-fiscales-togo.json` | **Calendrier & sanctions fiscales** : dépôt DSF (EI 31/03, société 30/04, assurance/banque 31/05), acomptes, TPU/SMT 31/03, majorations 30/40/80 %, amendes facture normalisée/caisse, garde-fous conformité (dissimulation = fraude) | **LPF OTR 2025** + dates dépôt utilisateur | Amorce — alimente moteur fiscal & story conseil AB-07 |
| `postes-smt-togo.json` | **Référentiel de postes SMT** (Système Minimal de Trésorerie) : bilan simplifié + compte de résultat de trésorerie (Recettes − Dépenses ± variations − amortissements), codes régime/pays/activités NAEMA | `LIASSE SYSCOHADA REVISE- SMT-Réf 24-01-19.xlsx` (formulaire officiel) | Amorce — pendant du GUIDEF pour le SMT ; cible du chemin A (cahiers) |
| `corpus-justificatif-fiscal-togo.json` | **Corpus de citation/justification** : **42 articles clés** (CGI + LPF) en **texte verbatim**, chacun tagué `theme` + `usage_bilan`, pour adosser chaque choix de retraitement (déductibilité Art.98-102, amortissement, provision, report déficit, retenues, régime, sanctions) au texte légal exact | **CGI + LPF OTR 2025** (extraction par article) | Amorce — « antisèche » de justification IA (story AB-07) ; sous-ensemble de `corpus-complet` |
| `corpus-complet-cgi-lpf-togo.json` | **Base RAG intégrale** : **les 1185 articles** du CGI (644) + LPF (541), texte verbatim, avec `livre`+`article`+`page` (citation) ; les 42 pivots portent `cle:true`+`theme`+`usage_bilan` | **CGI + LPF OTR 2025** (extraction intégrale, 925 Ko) | **✅ COMPLET** — CGI 1→644 sans trou ; LPF 1→546 (356/360/362/367/382 abrogés). ⚠️ **numérotation CGI ≠ LPF** ; base 2018 consolidée → confirmer la LF en vigueur ; verbatim à valider avant contentieux |
| `table-de-passage-syscohada.json` / `.csv` | **Table de passage compte SYSCOHADA → poste GUIDEF** (79 postes détail + 20 totaux) : Bilan Actif/Passif + Compte de Résultat, avec règles (NET_ACTIF, SOLDE_CREDITEUR, CHARGE/PRODUIT) | Construite (règles standard SYSCOHADA révisé) contre les codes postes extraits | Amorce — **validée à 100 %** (voir ci-dessous) |
| `plan-comptable-syscohada.json` | **Plan de comptes SYSCOHADA révisé** (Système Normal) — **174 comptes** (têtes de classe 2 chiffres 1→8 + comptes couvrant les 155 préfixes de la table de passage), `{numero, libelle, classe}` | Plan comptable normalisé AUDCIF 2017 (SYSCOHADA révisé) | **STORY-056** — intégré au paquet `syscohada-revise@2.1` ; amorce à valider |
| `plan-comptable-sfd-bceao.json` | **Plan de comptes SFD-BCEAO** (RCSFD version allégée) — **156 comptes**, classes **1 à 7** : trésorerie/IF (cl.1), membres/crédits/dépôts (cl.2), opérations diverses (cl.3), valeurs immobilisées (cl.4), fonds propres/provisions (cl.5), charges (cl.6), produits (cl.7) | **Référentiel Comptable Spécifique des SFD de l'UMOA** (BCEAO, Instr. n°025-02-2009 / n°026-02-2009 — [PDF cb-umoa.org](https://www.cb-umoa.org/fr/sfd)) — extrait 2026-07-18 | **STORY-057** — base du paquet `sfd-bceao@1.0` ; amorce à valider |

📋 **`documents-a-fournir.md`** = checklist des pièces restantes à importer pour compléter le référentiel (exonérations : Code des Investissements / Zone Franche / Loi de Finances ; conventions fiscales ; doctrine OTR ; verticaux distributeur / SFD / CIMA ; + terrain Sage/cahiers/relevés).

Voir aussi **`README-sfd-bceao.md`** : provenance détaillée du SFD (plan classes 1-7, états **DIMF 2000 Bilan** / **DIMF 2080 Compte de résultat**, table de passage proposée). ⚠️ Ne PAS confondre le RCSFD (SFD) avec le **PCB** (Plan Comptable Bancaire révisé, décision n°357-11-2016), qui vise les **banques**.

## ✅ Validation de la table de passage (2026-07-12)

Croisée avec les **50 comptes réels** de la balance Sage `Balance_des_comptes.pdf` (ETS RELAXED) : **0 compte non mappé**. Points confirmés : mobile money **TMONEY → Trésorerie**, comptes **alphanumériques** (`5211BOA0`) gérés par préfixe, **amortissements (28x)** traités en contra (déduits du net actif), ambiguïté **classes 4/5** (actif si débiteur / passif si créditeur) résolue au **solde**. Restes à affiner (non bloquants) : distinguer sous-total `AQ` du détail `AS` ; ventilation fine de certains sous-comptes 44x ; **TFT et section fiscale** (résultat fiscal, liquidation) à mapper dans un second temps.

## Provenance & confiance

- **Postes** : extraction fidèle des codes/libellés du classeur officiel → fiable pour la structure ; reste à établir le **mapping comptes→postes** (quel compte SYSCOHADA alimente quel code poste).
- **Taux fiscaux** : extraits du **CGI + LPF OTR 2025** (361 p., références d'articles dans le JSON). Barème IRPP, seuils/taux TPU, TAF, TCA, retenues, accises désormais **chiffrés** (correction : IRPP tranche haute = **35 %**, pas 30 % ; seuil TPU = **60 M**, pas 30 M). **Barème CNSS** ajouté (source utilisateur, Code de Sécurité Sociale). Reste : validation experte obligatoire + confirmation de la loi de finances en vigueur (l'édition OTR 2025 consolide jusqu'à la LF 2023).

## Prochaines étapes

1. Compléter la **table de passage** (numéro de compte SYSCOHADA → code poste) — pièce maîtresse de FR-006 ; ajouter le mapping cahiers→postes **SMT** (`postes-smt-togo.json`).
2. ~~Compléter le paquet fiscal + barème CNSS~~ ✅ **fait** (2026-07-19, depuis OTR 2025 + CNSS) — reste la **validation experte** et la confirmation de la loi de finances en vigueur ; compléter le barème CNSS (plafond/branches/SMIG).
3. Généraliser le schéma à d'autres pays UEMOA (le paquet est keyé `pays × année` ; le gabarit GUIDEF est géré côté admin — D12).
4. ~~Prévoir la liasse **SMT**~~ ✅ **obtenue et extraite** (`postes-smt-togo.json`).
