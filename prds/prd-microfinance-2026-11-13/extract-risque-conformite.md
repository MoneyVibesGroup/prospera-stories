# Extrait PRD — Risque, conformité BCEAO, audit, compta/finance (2026-11-13)

Plan : 1 Écrans · 2 Risque · 3 Conformité BCEAO · 4 Audit · 5 Compta/finance · 6 microfinance-service · 7 Écarts et questions.

Abréviations de chemins : `W/` = `C:/Users/thier/Documents/prospera-font-end/prospera-web/src/` ; `D/` = `C:/Users/thier/Documents/prospera-font-end/docs/` ; `R/` = `C:/Users/thier/Documents/prospera-font-end/` (rapport BCEAO d'exemple).

Règles de lecture : tout chiffre de la démo est un mock (`W/lib/mock*.ts`, `*-registry.ts`). Le front est passé en revue pour les CAPACITÉS, jamais pour une API. « Valeur démo = futur paramètre » vaut pour tout seuil de ce document.

---

## 1. Écrans

Tous les écrans lisent des mocks en mémoire (aucun appel réseau dans ces pages). Les deux écrans `risque` et `conformite` ont deux variantes : le DG (rôle `MANAGER`) voit la vue analytique ; les autres rôles voient une vue plus légère (`W/app/(dashboard)/risque/page.tsx:12-31`, `W/app/(dashboard)/conformite/page.tsx:12-32`).

| Chemin | Rôle(s) | Contenu | Actions : réelles ou décoratives |
|---|---|---|---|
| `/risque` (DG) `W/components/risque/RisqueDgView.tsx` | DG | Mémo risque IA ; Expected Loss vs provisions (3 chiffres + histogramme 6 mois + EL par agence) ; entonnoir d'aging 6 tranches ; concentrations et hausses de défauts ; scénarios de PAR prévus (« prévisions IA ») ; secteurs sous vigilance ; 6 « décisions DG en attente » ; glossaire ; 2 tableaux (clients à risque, dossiers bloqués > 48 h) | Onglets, recherche, filtre agence, pagination, dépliage de ligne : réels (état local). Lien vers fiche client : réel (navigation). Bouton « Exporter analyse risque » : DÉCORATIF (`W/components/dashboard/ExportButton.tsx:18-24` n'attend qu'un `setTimeout`, ne produit aucun fichier). Les « décisions DG » ne sont pas actionnables (texte seul, `RisqueDgView.tsx:244-255`). |
| `/risque` (autres rôles) `W/components/dashboard/onglets/OngletCreditDEC.tsx` | Directeur d'exploitation crédit (DEC) et autres | PAR granulaire 1/7/30/60/90 avec seuils ; heatmap PAR × agence ; dossiers bloqués ; clients à risque | Filtre agence par clic sur la heatmap, navigation vers dossier/client : réels. |
| `/conformite` (DG) `W/components/conformite/ConformiteDgView.tsx` | DG | Rapport IA de conformité, score BCEAO, classes de créances, provisions par agence, LBC/FT, exports | « Export PDF » (`ConformiteDgView.tsx:128-139`) : RÉEL côté navigateur (génère le rapport et le convertit en PDF, `W/lib/conformite-pdf.ts:5-69`) mais sur des données mock. |
| `/conformite` (autres) `W/components/conformite/ConformiteView.tsx` | Rôles seniors | 6 KPI (PAR 30, PAR 90, provisions, couverture, migrations, dossiers) ; moteur de classification (5 classes) ; 4 onglets : Classification, Provisions, LBC/FT, Exports (`ConformiteView.tsx:12,55-75`) | Onglets/filtre par classe : réels. Export par ligne (PDF) et « Export CENTIF » : réels côté navigateur (`W/components/conformite/ConformiteTables.tsx:128-142,305-307,683-688`). |
| `/audit` `W/app/(dashboard)/audit/page.tsx:16-41` | DAF → vue « Audit financier & conformité » (`W/components/finance/DafAuditView.tsx`) ; AUDITEUR → `DashboardAuditeur` ; autres rôles : « accès non configuré » | Accueil audit : KPI, alertes, synthèse IA, radar agences, priorités | Voir ci-dessous |
| `/audit/credit` `audit/credit/page.tsx:6-14` | Auditeur | « Contrôle crédit » : dossiers incomplets, crédits sans garanties, retards suspects, validations irrégulières, concentration portefeuille par agent (top-2) | Lecture seule. |
| `/audit/agences` | Auditeur | Conformité par site, incidents, statuts CRITIQUE/ALERTE | Lecture seule. |
| `/audit/anomalies` | Auditeur | Fraude et anomalies : liste filtrable (TOUS/CRITIQUE/HAUTE/MOYENNE), détection comportementale (activités inhabituelles, pics de transactions, opérations hors-horaires) | Filtres réels. Bouton « Investiguer » : DÉCORATIF (aucun `onClick`, `W/components/dashboard/roles/DashboardAuditeur.tsx:~120-125`). |
| `/audit/bceao` | Auditeur | Ratios réglementaires, classes de créances, calendrier de reporting | Lecture seule. |
| `/audit/caisse` | Auditeur | Écarts de caisse, suspens comptables, ajustements inhabituels | Lecture seule. |
| `/audit/tracabilite` | Auditeur | « Journal d'audit infalsifiable » : utilisateur, action, entité, poste, IP, horodatage, drapeau d'anomalie (`W/lib/mock-audit-builders.ts:562-582`) | `ExportButton` du journal : DÉCORATIF (`DashboardAuditeur.tsx:491`). Le mot « infalsifiable » n'est qu'un libellé. |
| `/comptabilite` `W/app/(dashboard)/comptabilite/page.tsx:4-12`, `W/components/comptabilite/ComptabiliteView.tsx` | DAF/compta | « Comptabilité IMF — SYSCOHADA révisé » : synthèse, 7 KPI, puis 6 sous-onglets (synthèse de clôture, balance générale, journal, grand livre, compte de résultat, rapprochement bancaire) via `DafComptabilitePanel` (`W/components/finance/DafComptabilitePanel.tsx:118-123`) | Onglets réels ; aucune écriture saisie ni validée pour de vrai. |
| `/finance` `W/app/(dashboard)/finance/page.tsx:15-19` → `DashboardDAF` | DAF | « Finance & Budget » : trésorerie, rentabilité, budget, contrôle de gestion (productivité agent, coût par dossier, CAC…), ratios prudentiels (`OngletFinancier.tsx:338`) | Lecture seule. |

Constat : la démo est surtout une VITRINE de lecture. Seuls l'export PDF/CSV de conformité et la navigation sont réels. Rien ne s'enregistre.

---

## 2. Risque

### 2.1 Indicateurs et formules

| Indicateur | Définition dans la démo | Formule / constante | Source |
|---|---|---|---|
| PAR 1 / 7 / 30 / 60 / 90 (réseau) | Part de l'encours en retard de plus de N jours | CONSTANTE dérivée : `PAR30` réel du mois ; `PAR1 = PAR30 × 1,56` ; `PAR7 = PAR30 × 1,15` ; `PAR60 = PAR30 × 0,56` ; `PAR90 = PAR30 × 0,38`. Les coefficients sont des multiplicateurs fixes, pas un calcul sur les échéances. | `W/lib/mock-time-series.ts:156-169` |
| Seuils d'alerte PAR (valeur démo) | PAR1 15 % · PAR7 12 % · PAR30 10 % · PAR60 6 % · PAR90 4 % | Constantes ; statut `NORMAL` si valeur ≤ seuil, sinon `WARN` | `mock-time-series.ts:163-167` ; repris par la heatmap `OngletCreditDEC.tsx:168-172` |
| PAR 30 | « Part de l'encours avec au moins 1 échéance impayée depuis 30 jours » ; seuil BCEAO affiché 10 % ; action DG si > 9 % pendant 2 mois | encours des prêts à retard ≥ 30 j / encours total (calcul réel dans l'export : `conformite-export.ts:62-71`) | `W/lib/risque-hub.ts:118`, `W/lib/conformite-export.ts:62-71` |
| PAR par agence (1/7/30/60/90) | idem par agence | mêmes multiplicateurs appliqués au PAR30 de l'agence | `W/lib/mock-credit-builders.ts:12-28` |
| Tendance d'agence | HAUSSE / BAISSE / STABLE | PAR30 agence vs PAR30 réseau du mois précédent ± 0,5 pt | `mock-credit-builders.ts:15-17` |
| Taux de défaut, taux de recouvrement, prêts restructurés/contentieux du mois | KPI mensuels | lus de la série mensuelle (constantes) | `mock-credit-builders.ts:32-42` |
| Aging (entonnoir) | 6 tranches : Courant, J+1-7, J+8-30, J+31-60, J+61-90, J+90+ | nombre, encours, % du nombre de dossiers ; la tranche 1-30 j est coupée 35/65 en « 1-7 » et « 8-30 » (constante) | `W/lib/credit-dossiers-stats.ts:165-205`, `risque-hub.ts:68-75` |
| Taux de provisionnement global | 4,8 % (constante) | — | `W/lib/mockMicrofinance.ts:376` |
| Expected Loss (EL) | `EL = EAD × PD × LGD` | EAD = encours ; PD et LGD par classe (constantes ci-dessous) ; l'EL total de la démo est une CONSTANTE de 2 944 000 FCFA mise à l'échelle de l'encours ; PD moyen 7,4 % ; LGD moyen 42 % | `W/lib/portefeuille-reseau.ts:243-269`, glossaire `risque-hub.ts:119` |
| PD par classe CBI | Performant 3,2 % · Sous surveillance 18,4 % · Douteux 38,6 % · Compromis 64,2 % · Perte 95 % | constantes | `portefeuille-reseau.ts:256` |
| LGD par classe | 35 / 45 / 52 / 68 / 85 % | constantes | `portefeuille-reseau.ts:257` |
| Couverture EL | provisions constituées / EL, objectif ≥ 100 % ; écart = EL − provisions | provisions constituées 4 200 000, à constituer 5 380 000, écart 1 180 000 (constantes) | `risque-hub.ts:52-66`, `portefeuille-reseau.ts:24-28` |
| PD client | probabilité de défaut 12 mois (« score IA CBI v5 ») ; PD > 50 % → comité de crédit obligatoire | modèle externe, non calculé ; EL individuelle = encours × PD × LGD | `risque-hub.ts:120`, `W/lib/mock-risque-registry.ts:42-53` |
| Score client IA | 0-100, bandes par classe CBI : 75-100 Performant, 55-74 Sous surveillance, 35-54 Douteux, 15-34 Compromis, 0-14 Perte | constantes | `portefeuille-reseau.ts:33-37` |
| Migration d'aging | passage d'une tranche à la suivante ; alerte si > 15 % migrent vers J+30 par mois | règle affichée, non calculée | `risque-hub.ts:121` |
| Concentration secteur | encours du secteur / encours réseau ; alerte WARN dès 28 %, seuil affiché 30 % ; CRITIQUE à ≥ 35 % | calcul réel sur les mocks | `mock-risque-registry.ts:148-162` |
| Concentration géographique | encours d'une agence / encours réseau ; seuil affiché 25 % | calcul réel | `mock-risque-registry.ts:164-176` |
| Concentration par agent | dossiers approuvés / dossiers traités dans le mois ; alerte si > 50 % ; CRITIQUE ≥ 60 % | calcul réel | `mock-risque-registry.ts:178-193` |
| Hausse anormale de défauts (agence) | `(PAR30 agence − PAR30 réseau) / PAR30 réseau` ; retenue si l'écart > 0,8 pt ; CRITIQUE si ≥ 25 % (fenêtre « 14 derniers jours », libellé fixe) | calcul sur mocks | `mock-risque-registry.ts:106-134` |
| Dossiers bloqués | en pipeline depuis ≥ 48 h ; « nécessite le DG » si l'étape contient « Direction » ou bloqué ≥ 72 h | règle | `mock-risque-registry.ts:87-92`, `risque-hub.ts:90-94` |
| Prévision de PAR | trajectoires « si actions P1 exécutées » vs « sans action », avec objectif et confiance | texte et chiffres figés | `risque-hub.ts:112-116` |
| Score de recouvrement | 0-100 par dossier, f(ancienneté du retard, montant, historique, garanties, visites) | modèle IA non spécifié | `D/CAHIER_DES_CHARGES_BUNDLE_RISQUE_CONFORMITE.md:204` |

Il n'y a PAS dans la démo : de « taux de perte » (write-off ratio) calculé, de couverture PAR (provisions / encours PAR) calculée, ni de PAR « restructuré » séparé. Le cahier des charges cite pourtant « Taux de couverture PAR » (provisions / encours PAR, alerte < 80 %, critique < 60 %, `D/…RISQUE_CONFORMITE.md:380`).

### 2.2 Classes de créances et provisions : DEUX échelles contradictoires dans la démo

| Échelle | Classes et taux de provision | Source |
|---|---|---|
| A. « Conformité » (5 classes, par jours de retard) | NORMAL 1 % (J+0-30) · SOUS_SURVEILLANCE 10 % (J+31-90) · DOUTEUX 50 % (J+91-180) · COMPROMISES 80 % (J+181-360) · CONTENTIEUX 100 % (> 360 j ou procédure) | `W/lib/conformite-registry.ts:14-20`, règles `conformite-hub.ts:171-177`, bornes dans `conformite-registry.ts:~110-150` |
| B. « Risque / CBI » (5 classes, par score) | Performant 0 % · Sous surveillance 10 % · Douteux 25 % · Compromis 50 % · Perte 100 % | `portefeuille-reseau.ts:33-37` |
| C. Cahier des charges (classes 0-4) | Sain 1 % (0 j) · 1-30 j 10 % · 31-90 j 25 % · 91-180 j 50 % · > 180 j ou contentieux 100 % | `D/…RISQUE_CONFORMITE.md:446-452` |
| D. Entonnoir d'aging (texte) | J+31-60 : « provision 10 % » ; J+90+ : « provision intégrale » | `risque-hub.ts:72,74` |

Trois échelles de taux pour les mêmes classes : le taux réglementaire n'est PAS établi. Règle de PRD : les classes (bornes en jours) et les taux de provision sont un jeu de PARAMÈTRES versionné ; sa valeur de départ vient d'une source réglementaire à faire confirmer (voir Q1). Cas particuliers de classement observés : un prêt restructuré passe en SOUS_SURVEILLANCE ; contentieux ouvert = provision 100 % ; « 3 impayés consécutifs » donne COMPROMISES (motif cité « BCEAO art. 42 », référence non vérifiée) (`conformite-registry.ts:~48-60,100-110`).

### 2.3 Alertes et seuils (valeurs démo = futurs paramètres)

| Alerte | Déclencheur (valeur démo) | Sévérité | Source |
|---|---|---|---|
| PAR 30 réseau | > 10 % | WARN | `mock-time-series.ts:165` |
| PAR 30 agence | ≥ 10 % : agence « non conforme » ; entre ~9 et 10 % : « attention » | statut agence | `mock-conformite-bceao-builder.ts:41-42`, export `R/…20260531.csv` section 4 |
| Couverture EL | < 100 % | écart « à combler » | `RisqueDgView.tsx:72-76` |
| Hausse défauts agence | écart > 0,8 pt ; ≥ 25 % = CRITIQUE | WARN/CRITIQUE | `mock-risque-registry.ts:121-133` |
| Concentration secteur | ≥ 28 % ou drapeau ; seuil 30 % ; ≥ 35 % CRITIQUE | WARN/CRITIQUE | `mock-risque-registry.ts:151-160` |
| Concentration agent | approbations > 50 % ; ≥ 60 % CRITIQUE | WARN/CRITIQUE | `mock-risque-registry.ts:182-190` |
| PD client | > 50 % → comité de crédit ou contentieux | décision | `RisqueTables.tsx:163` |
| Migration | > 15 % de l'encours vers J+30 par mois | alerte | `risque-hub.ts:121` |
| Dossier bloqué | ≥ 48 h listé ; ≥ 72 h ou « Direction » → DG | file DG | `mock-risque-registry.ts` |
| Alerte réglementaire (cahier) | PAR réseau > 12 % → alerte critique, délai d'action 15 jours | critique | `D/…RISQUE_CONFORMITE.md:494` |

Les 9 alertes « CBI » de fraude/scoring crédit (dépôt inhabituel, gonflement récent de solde, dépôt pré-RDV suspect, cautions insuffisantes, concentration sectorielle, endettement élevé > 50 % des revenus, taux d'effort > 33 % des revenus, compte de transit, benchmark faible) relèvent du crédit, pas du risque de portefeuille : `W/lib/mock-controle-interne-registry.ts:282-291`.

---

## 3. Conformité BCEAO

### 3.1 Structure du rapport d'exemple (`R/BCEAO_SFD_PROSPERA_JUIN_2026_20260531.html` et `.csv`)

Le .html et le .csv sont le MÊME rapport (« Situation mensuelle des SFD — Portefeuille crédit et provisions », période juin 2026, généré le 31/05/2026), produit par `W/lib/conformite-export.ts:74-182` (CSV, séparateur « ; ») et `conformite-report-html.ts` (mise en page, PDF via `conformite-pdf.ts`). Il est entièrement calculé sur les mocks.

| Bloc | Contenu | Source de la donnée |
|---|---|---|
| Couverture | Établissement, code SFD (`SFD-TG-0042`), agrément (`N° 2021-008/SFD/TG`), pays, période, date de génération, référence normative (« Instruction BCEAO n°001-01-2020 »), logiciel | constantes `conformite-export.ts:12-21` : À PARAMÉTRER par l'IMF |
| 4 KPI de tête | Encours brut, PAR 30+, provisions totales, nombre d'emprunteurs et d'agences | portefeuille |
| Section 1 — Synthèse portefeuille | encours brut crédit, nombre de dossiers actifs, nombre d'emprunteurs, agences actives | crédit |
| Section 2 — Indicateurs PAR (base encours) | lignes PAR 30+/60+/90+ : encours à risque, taux, seuil, statut ; seuils 10 % / 7 % / 5 % (`conformite-export.ts:87-91`). Exemple : PAR30 = 12,09 % NON CONFORME ; PAR60 = 0,05 % ; PAR90 = 0 % | crédit (retard ≥ N jours / encours) |
| Section 3 — Classification des créances | 5 classes : nombre, % du portefeuille, encours, taux de provision, provisions (exemple : Normal 789 dossiers à 1 % ; Sous surveillance 115 à 10 % ; Douteux 0 ; Compromises 1 à 80 % ; Contentieux 1 à 100 % ; total provisions 11 507 400 FCFA) | crédit (échelle A de §2.2) |
| Section 4 — Provisions par agence | encours, provisions, taux, PAR 30 d'agence, dossiers à risque, statut CONFORME/ATTENTION/NON CONFORME (Bè Kpota 11,2 % NON CONFORME ; Adidogomé 9,4 % ATTENTION) | crédit par agence |
| Section 5 — Migrations de classe du mois | réf. prêt, client, agence, classe précédente, classe actuelle, J+ max, provision, motif (31 migrations dans l'exemple) | crédit (historique de classes) |
| Section 6 — Annexe détail des dossiers | une ligne par prêt : réf. prêt, ID client, client, agence, produit, encours, J+ max, classe, % et montant de provision, prochaine échéance (906 lignes) | crédit |
| Section 7 — Contrôle IA pré-envoi | complétude des données (97 %), couverture provisions / EL, migrations détectées, exports en attente, « signature » Prospera AI | calcul interne |

Autres exports de la démo (`conformite-export.ts:184-310`, tous sur mocks) : rapport trimestriel PAR consolidé (PAR 30/60/90 réseau et par agence, évolution, dossiers ≥ 30 j) ; situation de liquidité à court terme (ratio = liquidités / engagements à court terme, seuil 100 %, avec « engagements CT » = 8 % de l'encours, constante) ; LBC/FT (synthèse KYC, opérations suspectes, déclarations du mois, contrôles internes).

Défauts de l'exemple à NE PAS reproduire : la période (« Juin 2026 ») est postérieure à la date de génération (31/05) ; « 4 agences actives » alors que le tableau en liste 5 ; dans le HTML, la section 2 affiche « Taux provision 3608400 % » (un montant dans la colonne du taux) ; « Couverture EL : 100 % » alors que la démo affiche ailleurs 78,1 % (`mock-conformite-bceao-builder.ts:31-33`) ; AUCUN ratio prudentiel (ni solvabilité, ni liquidité, ni capitalisation) alors que le cahier prévoit un « tableau 8 ratios » (`D/CAHIER_DES_CHARGES_BUNDLE_RISQUE_CONFORMITE.md:482`) ; aucun champ de signature du DG alors que le cahier l'exige (`:487,599,670`).

### 3.2 Ratios et normes affichés par la démo et par le cahier (NON FIABLES)

Les 10 « ratios réglementaires » du tableau de conformité (`W/lib/mock-conformite-bceao-builder.ts:40-51`) :

| Indicateur | Valeur démo | Seuil démo | Formule affichée | Nature |
|---|---|---|---|---|
| PAR > 30 j réseau | PAR30 du mois | < 10 % | portefeuille à risque > 30 j / encours total | calculé |
| PAR > 30 j par agence | PAR de Bè Kpota | < 10 % | idem | calculé |
| PAR > 90 j | PAR90 du mois | < 5 % | idem | calculé |
| Ratio de solvabilité | 8,4 % | ≥ 8 % | fonds propres nets / risques pondérés, « Bâle I » | CONSTANTE |
| Ratio de liquidité | 82 % | ≥ 80 % | actifs liquides / passifs à court terme (≤ 3 mois) | CONSTANTE |
| Ratio de transformation | 71 % | ≥ 80 % | ressources stables (> 1 an) / emplois long terme | CONSTANTE |
| Concentration (top 2) | 37 % | ≤ 25 % | 2 premiers emprunteurs d'un agent / encours de l'agent | CONSTANTE |
| Couverture des provisions | 78,1 % | 100 % | provisions constituées / requises | calculé sur constantes |
| Coefficient d'exploitation | 68 % | ≤ 75 % | charges d'exploitation / produits d'exploitation | CONSTANTE |
| Résultat net / encours | formule fantaisiste (collecte × 0,22 × 0,33 / encours) | ≥ 3 % | rentabilité minimale | CONSTANTE |

Score de conformité de la démo : `88 − 4 × (ratios non conformes) − 2 si l'agence la plus risquée dépasse 10 %`, borné à [50 ; 95] ; niveau CONFORME ≥ 85, ATTENTION ≥ 70 (`mock-conformite-bceao-builder.ts:53-54,73`). Le cahier propose un autre score : 5 dimensions pondérées (PAR 30 %, provisions 25 %, liquidité 20 %, KYC 15 %, traçabilité 10 %) et 4 niveaux 80/60/40 (`D/…RISQUE_CONFORMITE.md:386-401`). Ce score est une invention produit, pas une norme : à ne pas présenter comme réglementaire.

Le cahier liste 8 ratios « prudentiels » avec seuil d'alerte et seuil critique (`D/…RISQUE_CONFORMITE.md:373-382`) : PAR30 (> 10 / > 15 %), PAR90 (> 5 / > 10 %), solvabilité (< 15 / < 10 %), liquidité (< 100 / < 80 %), couverture des risques (< 90 / < 75 %), couverture du PAR (< 80 / < 60 %), plafond de dividendes (> 50 / > 75 %), ratio d'immobilisations (> 100 / > 150 %). Les seuils de solvabilité (8 % ou 15 %), de transformation (80 %) et de liquidité (80 % ou 100 %) se contredisent d'un document à l'autre et ne coïncident pas avec l'Instruction n°010-08-2010 (voir ci-dessous). Les specs backend ajoutent un ratio de liquidité en « multiple » (1,84x, minimum 1,5x : `C:/Users/thier/Documents/prospera-backend/backend-dashboard-specs/10-dashboard-daf.md:95-96`), encore une définition différente.

### 3.3 Ratios et normes RÉELS des SFD de l'UMOA (sourcés dans l'existant, à valider par un expert)

Source : Instruction n°010-08-2010 du 30 août 2010, annexes I à IX, transcrites dans `C:/Users/thier/Documents/MoneyVibes_Apps/prospera-microfinance-service/src/modules/referentiel/assets/prudentiel-sfd-bceao-1.2.json` (section `ratios`, statut `a-valider-par-expert`, « transcription non relue par un praticien SFD », `_meta.miseEnGarde`) et `C:/Users/thier/Documents/MoneyVibes_Apps/prospera-stories-prd-mf/referentiels/README-ratios-prudentiels-sfd-bceao.md:1-22`, qui précise que c'est l'artefact `ratios-prudentiels-sfd-bceao@1.0` de `bilan-service` qui fait foi pour un ratio. Seuils en POUR CENT. Les assiettes sont des POSTES DE BALANCE du RCSFD.

| # | Norme | Formule | Seuil | Annexe |
|---|---|---|---|---|
| 1 | Limitation des risques | risques nets / ressources | ≤ 200 % | I |
| 2 | Couverture des emplois à moyen et long terme | ressources stables / emplois moyen-long terme | ≥ 100 % | II |
| 3 | Prêts aux dirigeants, au personnel et aux personnes liées | prêts et engagements par signature / fonds propres | ≤ 10 % | III |
| 4 | Risques sur une seule signature | prêts et engagements du plus gros emprunteur / fonds propres | ≤ 10 % | IV |
| 5a | Liquidité, SFD non affiliés collectant des dépôts | valeurs réalisables et disponibles / passif exigible | ≥ 100 % | V |
| 5b | Liquidité, mutualistes affiliés | idem | ≥ 80 % | V |
| 5c | Liquidité, SFD ne collectant pas de dépôts | idem | ≥ 60 % | V |
| 6 | Opérations autres qu'épargne et crédit | montant consacré / risques nets | ≤ 5 % | VI |
| 7 | Dotation à la réserve générale | dotation annuelle sur base (résultat + report à nouveau déficitaire) | ≥ 15 % | VII |
| 8 | Capitalisation | fonds propres / total actif net | ≥ 15 % | VIII |
| 9 | Prises de participation | titres de participation hors EC et SFD / fonds propres | ≤ 25 % | IX |

Les seuils 100/80/60 % de la liquidité dépendent d'une « catégorie prudentielle » du SFD que le produit ne déclare nulle part : PARAMÈTRE à déclarer par l'IMF (lacune `CATEGORIE_PRUDENTIELLE_NON_DECLAREE`).

Ce que Prospera peut calculer depuis le crédit, et ce qui doit venir du logiciel cœur :

| Élément | D'où il vient | Prospera peut-il le calculer ? |
|---|---|---|
| PAR 30/90/180, encours par catégorie (sain / en souffrance / restructuré), taux d'encaissement des échéances échues, taux de récupération après perte | échéancier et paiements du crédit | OUI, à condition de recevoir prêts et paiements du cœur |
| Classement par ancienneté de retard, base de provision (encours − dépôt de garantie du débiteur), provision PROPOSÉE | échéancier, garanties, produit | OUI (proposition, jamais écriture) |
| Plus gros emprunteur ; prêts aux dirigeants, au personnel, aux liés (numérateurs des normes 3 et 4) | crédit, avec un marquage « personne liée » absent de la démo | PARTIELLEMENT : le texte renvoie à des « tableaux annexés aux états financiers », sans compte (`ASSIETTE_DECLARATIVE_HORS_BALANCE`) |
| Fonds propres, total actif net, ressources stables, passif exigible, valeurs réalisables et disponibles, résultat, report à nouveau | balance générale / comptabilité officielle | NON : vient du logiciel cœur. Sans balance, les normes 1, 2, 5, 8, 9 ne sont pas calculables |
| Durée résiduelle des emplois et des ressources (normes 2 et 5) | échéanciers de crédits ET de dépôts | NON sans les échéanciers de dépôts du cœur (`VENTILATION_PAR_DUREE_RESIDUELLE_ABSENTE`) |
| Postes hors bilan (engagements, cautions) | cœur / crédit | PARTIELLEMENT |

Le README de provenance l'écrit : « Aucune des 11 normes n'est intégralement calculable depuis une balance, et c'est le texte qui le veut » (`README-ratios-prudentiels-sfd-bceao.md:~33`). Conséquence pour le PRD : le jour 1, les ratios prudentiels sont un IMPORT venant du cœur (valeur, date d'arrêté, source), comparé au seuil paramétré ; Prospera n'en calcule que les numérateurs issus du crédit. Les calculer tous suppose que le cœur livre une balance en postes RCSFD (voir §6).

### 3.4 Périodicité et destinataires

| Livrable | Périodicité | Délai et support | Source |
|---|---|---|---|
| Démo : rapport mensuel BCEAO | mensuel ; « avant le 5 du mois suivant » (glossaire) mais échéances affichées 02/06 et 02/07, et 31/05 dans le calendrier ; trimestriel 15/07 ; plan de redressement 31/07 ; semestriel 31/08 | — | `W/lib/conformite-hub.ts:184` ; `conformite-registry.ts:232-237` ; `mock-conformite-bceao-builder.ts:96-101` |
| Démo : PAR trimestriel ; liquidité hebdomadaire ; LBC/FT mensuel (« avant le 5 ») | trimestriel / hebdo / mensuel | — | `conformite-registry.ts:234-236,278` |
| Réel : indicateurs périodiques (Instruction n°020-12-2010) | MENSUEL pour les SFD de l'article 44 (encours de dépôts ou de crédits ≥ 2 Md FCFA sur deux exercices consécutifs) ; TRIMESTRIEL pour les autres | 30 jours calendaires ; électronique obligatoire pour l'art. 44 | `C:/Users/thier/Documents/MoneyVibes_Apps/prospera-stories-prd-mf/referentiels/README-etats-dimf-sfd-bceao.md:84-92` |
| Réel : états financiers DIMF 2000 et 2080 (Instruction n°030-02-2009) | ANNUEL, arrêté au 31/12 | 6 mois ; papier signé (électronique en complément) ; 5 exemplaires au ministre des Finances, 2 à la BCEAO et à la Commission bancaire pour l'art. 44 ; conservation 10 ans | idem `:50-82` |

Une grande IMF multi-agences relève très probablement de l'article 44 (≥ 2 Md FCFA) : indicateurs MENSUELS et version développée du RCSFD. À confirmer avec l'IMF (Q4). Aucun format de fichier BCEAO n'est prescrit (ni XML ni plateforme de télétransmission trouvés) : « produire le fichier déposable » signifie produire un document imprimable conforme au gabarit, prêt à signer. La référence « Instruction n°001-01-2020 » du rapport d'exemple et la mention « art. 42 » (migration en COMPROMISES après 3 impayés, `conformite-registry.ts:~48-55`) ne se retrouvent dans aucune source de l'existant : citations non vérifiées.

### 3.5 Export PDF

La démo prouve la capacité : rapport mis en page (HTML) converti en PDF A4 dans le navigateur, nom de fichier daté, CSV en parallèle (`W/lib/conformite-export.ts:350-363`, `conformite-pdf.ts:5-69`). Limites : image rasterisée (texte non sélectionnable, non signable), aucune signature, aucun numéro de version du modèle ; le bouton « Export PDF » du DG exporte « le premier export à l'état GENERE » sans choix de période (`ConformiteDgView.tsx:130-132`). Exigences du cahier : PDF complet en moins de 15 s, modal de confirmation du DG, rapport non transmissible sans validation du DG, archivage 10 ans (`D/…RISQUE_CONFORMITE.md:509,543,643,670`). Statuts d'un export : `GENERE → ENVOYE → VALIDE` (`conformite-hub.ts:40`), sans trace de qui a signé. Précision : le texte réel impose un document SIGNÉ sur papier pour les DIMF annuels (§3.4).

### 3.6 LBC/FT et CENTIF (présents dans l'écran conformité)

KYC complet ≥ 95 % (valeur démo 94,2 %), 14 dossiers KYC incomplets, déclaration de soupçon (DS) transmise au CENTIF « sans retard », déclaration automatique au-delà de 5 M FCFA « au Togo », rapport mensuel avant le 5, screening des listes de sanctions et des personnes politiquement exposées (PPE), formation des agents, conservation des pièces 5 ans, référentiel « Instruction n°008-05-2012, loi n°2018-006 (Togo) » (`W/lib/conformite-registry.ts:244-299`). Tous ces seuils et références sont PAR PAYS : des paramètres, pas des constantes. Ce périmètre dépasse le risque de crédit : à rattacher au PRD des clients et du KYC (Q5).

### 3.7 Taux d'usure (24 % par an, décision du PO)

- Dans la démo : AUCUN contrôle. Les produits portent un taux annuel (`W/lib/produits-hub.ts:38-39` : microcrédit 24 %, crédit de groupe 22 %), mais le cahier du crédit et le récit du PO montrent un taux MENSUEL de 2,5 à 2,8 % et un TAEG de 36,4 % (`D/CAHIER_DES_CHARGES_BUNDLE_TERRAIN_COLLECTE.md:~773`). 2,5 %/mois = 30 %/an nominal : l'exemple de la démo dépasserait le plafond.
- Dans l'existant : nulle part (`prospera-microfinance-service` n'a ni plafond de taux ni contrôle d'usure ; recherche du mot « usure » vide dans `src`).
- Comment le contrôler (capacités) : (1) un paramètre « plafond de taux » par pays et par date d'effet, valeur de départ 24 % par an, base de comparaison à préciser (taux nominal ou TAEG : Q2) ; (2) TAEG calculé à la simulation, frais de dossier et assurance obligatoire inclus ; (3) blocage de la création d'un produit et de la décision du comité au-dessus du plafond, dérogation tracée ; (4) contrôle a posteriori sur tout le portefeuille importé du cœur ; (5) alerte d'audit « taux > plafond » ; (6) historique des plafonds : un prêt est jugé au plafond en vigueur à son octroi.

---

## 4. Audit et séparation des responsabilités

### 4.1 Règles « qui ne peut pas faire quoi »

| Règle | Source |
|---|---|
| L'accord du ROC ne crée pas d'échéancier ; seul le comité (ROC + un membre de la direction, DG ou RA) le génère | récit du PO §4 ; `D/CAHIER_DES_CHARGES_BUNDLE_CREDIT.md:660` |
| Décaissement en espèces au guichet : comptable ou DAF seulement | récit du PO §4 |
| Paiement Mobile Money « en attente » jusqu'à validation par le comptable | récit du PO §4 |
| Seul le ROC bloque / débloque un dossier (motif obligatoire) ; le DAF reçoit une notification pour provision à 100 % | `D/…RISQUE_CONFORMITE.md:212-213,331-333,624` |
| L'IA ne place jamais un dossier en contentieux, ne signe pas le rapport BCEAO ; le DG signe obligatoirement ; le DAF valide le montant des provisions | `D/…RISQUE_CONFORMITE.md:181,593-600` |
| Rapport BCEAO : l'auditeur génère, le DG valide ; traçabilité lisible par AUDITEUR et DG seulement | `D/…RISQUE_CONFORMITE.md:622-623` |
| Un agent instructeur ne valide pas son propre dossier (cas détecté dans la démo : DC-2788 « validé par l'agent instructeur lui-même (conflit d'intérêt) ») | `W/lib/mock-audit-builders.ts:~531` |
| « Validation incestueuse » : même utilisateur valide un paiement Mobile Money ET modifie l'échéance du même client dans l'heure | `D/…RISQUE_CONFORMITE.md:468` |
| Périmètre : DG tout le réseau, RA son agence, GP son portefeuille, agent sa zone ; hors périmètre = refus | récit du PO §5 ; `D/…RISQUE_CONFORMITE.md:104-112` |

La démo ne FAIT respecter aucune de ces règles (aucune écriture réelle). Elles deviennent des exigences de contrôle d'accès et de flux d'approbation (« quatre yeux ») du PRD. Seuils de la démo, à paramétrer : dérogation de plafond de produit (ex. 5,4 M pour 5 M), > 3 crédits actifs simultanés, écart de caisse > 5 000 FCFA, transaction Mobile Money en attente > 48 h, dossier bloqué > 30 j.

### 4.2 Piste d'audit

| Élément | Exigence | Source |
|---|---|---|
| Journal | INSERT seul, pas de UPDATE ni DELETE ; champs : utilisateur, action, type et id d'entité, valeur avant / après, IP, poste, horodatage | `D/…RISQUE_CONFORMITE.md:458-462,529,621` ; démo `mock-audit-builders.ts:562-582` |
| Capturé | authentification (5 ans) ; mutations sensibles, actions admin, validations financières (10 ans) ; exports (5 ans) | `D/…:456-462` |
| Rétention | audit 10 ans ; rapports BCEAO 10 ans ; anomalies 5 ans ; DIMF 10 ans (texte réel) | `D/…:639-644` |
| Chaque changement de statut de dossier : horodaté, qui, quand | récit du PO §4 |
| Journal « infalsifiable » | libellé seulement dans la démo ; aucun mécanisme (chaînage, scellement) | à trancher |

### 4.3 Contrôles (démo et cahier)

Agences (visite manquante, écarts de caisse, objectifs < 70 %, dossier sans GP, transactions non rapprochées > 7 j) ; caisse (Mobile Money en attente > 48 h, écart collecte > 5 000 FCFA, doublons, paiement sans dossier, retrait > plafond) ; crédit (dossier bloqué > 30 j, plafond produit dépassé, score < 40 sans justification ROC, > 3 crédits actifs, dossiers en attente > 30 j, concentration top-2 par agent > 25 %) ; anomalies (collecte > 2 × la moyenne 30 j, modification après comité, décaissement sans visite, visite à > 500 m, connexion 22h-05h, suppression de document KYC) ; détection de fraude (9 codes CBI, `mock-controle-interne-registry.ts:282-291`) ; jobs prévus : anomalies 04h00, score 06h00 (`D/…:530-531`). Dans la démo les écrans d'audit sont en lecture seule, « Investiguer » est décoratif.

## 5. Comptabilité et finance dans la démo

### 5.1 Ce qui s'y voit

| Écran | Contenu | Réalité |
|---|---|---|
| `/comptabilite` (`ComptabiliteView.tsx`, `DafComptabilitePanel.tsx`) | norme « SYSCOHADA révisé » (titre ; l'existant parle de RCSFD, plan `sfd-bceao@2.0`) ; 7 KPI (comptes mouvementés, écritures en attente de validation DAF, caisse 531, banques 512, écart de rapprochement, score BCEAO) ; sous-onglets synthèse de clôture, balance générale (mouvements du mois + soldes N et N-1), journal (codes AN, OD, BQ, CA, CR, VT), grand livre, compte de résultat, rapprochement bancaire ; plan comptable ; 5 écritures automatiques ; clôtures mensuelles | mocks (`W/lib/comptabilite-hub.ts:107-200`, `mock-comptabilite-syscohada.ts`) |
| `/finance` (`DashboardDAF`) | trésorerie (flux 7 j, prévision 30 j), revenus / charges, budget, rentabilité, contrôle de gestion (coût par dossier, productivité, CAC), ratios prudentiels | mocks |
| `/audit` (DAF) | checklist de clôture : balance équilibrée, écritures en attente = 0, rapprochements finalisés, comptes 471/401 lettrés, bilan actif = passif, ratios non conformes ≤ 2 | `mock-daf-audit.ts:170-177` |

Écritures automatiques de la démo (déclencheur, débit, crédit) : décaissement (411 / 512) ; remboursement caisse ou Mobile Money (531 / 411) ; dépôt d'épargne (531 / 521) ; constatation des intérêts (411 / 701) ; dotation de provisions (871 / 419) (`comptabilite-hub.ts:~135-140`). Ces comptes sont ceux de la démo et ne coïncident pas forcément avec le plan `sfd-bceao@2.0` (372 comptes, provisions en 299, classe 8 hors bilan non packagée) : à ne pas reprendre sans confrontation.

### 5.2 Décision : tout reste un export (décision PO : comptabilité non prioritaire, le cœur fait foi)

Gardés en LECTURE (indicateurs issus du crédit) : PAR, classement, provision proposée, EL. Hors périmètre jour 1 : balance, journal, grand livre, rapprochement, clôture, bilan, budget, trésorerie consolidée.

### 5.3 Contenu minimal d'un « export des écritures » vers un logiciel tiers

1. En-tête de lot : identifiant du lot et de la version du modèle, période, date de génération, devise, IMF, agence ou siège, nombre de lignes, total débit = total crédit, empreinte du fichier.
2. Par écriture : journal (code), date de pièce et de valeur, numéro de pièce, libellé, agence, compte (plan du cœur, via une table de correspondance paramétrable), sens et montant (débit / crédit, entiers en devise minimale), référence du tiers (client), référence métier (dossier, échéance, paiement, id de la décision), utilisateur créateur et valideur, statut (proposée, validée).
3. Faits générateurs à couvrir : décaissement ; remboursement ventilé capital / intérêts / frais / pénalités ; frais de dossier et assurance ; dotation et reprise de provision par classe (résultat du provisionnement proposé et validé par le DAF) ; passage en perte ; recouvrement après perte ; clôture de caisse et écart.
4. Règles : idempotence (même lot rejoué = aucun doublon), annulation par contre-passation (jamais de modification), numérotation continue, lot équilibré, rejet explicite par ligne ; format (CSV ou autre) imposé par le cœur et inconnu à ce jour (Q6).

## 6. `prospera-microfinance-service` : l'existant

Chemin : `C:/Users/thier/Documents/MoneyVibes_Apps/prospera-microfinance-service`. Le README (`README.md:1-39`) ne décrit que le socle ; le code en livre bien plus.

### 6.1 Capacités déjà livrées (module par module)

| Module (`src/modules/`) | Capacités |
|---|---|
| `membres`, `parts-sociales` | sociétaires, adhésion, clôture, rectification d'identité ; mouvements de parts, annulables, solde dérivé |
| `depots` | comptes à vue et à terme, mouvements en ajout seul, intérêts de dépôt à terme, blocage ; situation DÉRIVÉE à une date |
| `credits` | produits de crédit ; octroi, décaissement (par tranches), remboursements imputés sur l'échéancier (ordre figé), rééchelonnement (versions d'échéancier), recouvrement, passage en perte, annulation par contre-mouvement ; crédit = somme de ses événements, situation à une date d'arrêté ; engagements hors bilan (cautions) |
| `credits/classement` | classement sain / en souffrance / restructuré dérivé à une date d'arrêté ; règle de contagion par débiteur (livrée mais INACTIVE : le texte réel n'en contient pas) ; restructuration |
| `credits/provisionnement` | provision calculée par tranche d'ancienneté et PROPOSÉE ; arrêté de provision appliqué (verrouillé), décisions de reprise ; jamais appliquée d'office |
| `credits/indicateurs` | PAR 30/90/180 (jours, comparaison stricte), taux d'encaissement des échéances échues, taux de récupération après perte, encours par catégorie, encours moyen, ventilation par PRODUIT ; chaque ratio publie numérateur, dénominateur, arrondi ; par AGENCE : NON livré (`parAgence` nul, l'agence n'existe dans aucun service) (`credits/emplacements-non-livres.ts`, `indicateurs-portefeuille.ts:27-60`) |
| `prudentiel` + `referentiel` | paquet prudentiel versionné (1.0 vide, 1.1, 1.2) : tranches de provision, garanties admises, règles de déclassement, 11 seuils de ratios ; référentiel comptable `sfd-bceao@2.0` (372 comptes, vérifié par checksum) ; devise du dossier |
| socle | accès par entitlement, cloisonnement par dossier et par exercice, outbox d'événements |

Tranches du paquet 1.2 (version ALLÉGÉE du RCSFD, comptes 29/299, p. 64-65, `prudentiel-sfd-bceao-1.2.json`) : 0 à 89 j = 0 % (facultatif) ; 90 à 181 j = 40 % ; 182 à 365 j = 80 % ; 366 à 730 j = 100 % ; ≥ 731 j = 100 % et passage en charges ; assiette = encours − dépôt de garantie du DÉBITEUR. Toutes contredisent les échelles de la démo (1/10/50/80/100) : la version allégée est réservée aux SFD < 50 M FCFA d'encours, l'IMF cible relève donc de la version DÉVELOPPÉE dont les taux ne sont pas vérifiés (Q1).

### 6.2 État des épics EPIC-121 → 127 (`sprint-status.yaml`, plage lignes 266-272 et 3857-3985)

| Épic | Stories | État |
|---|---|---|
| EPIC-121 Socle | 497, 498 | done 2026-09-13 (498 : mécanique seule à l'origine) |
| EPIC-122 Membres et dépôts | 499, 500 | done 2026-09-13 |
| EPIC-123 Portefeuille crédit | 501, 502 | done (14/09) |
| EPIC-124 Classement et provisionnement | 503, 504, 505, 659 | done ; 659 (valeurs prudentielles) done 15/09 mais valeurs « à valider par expert » |
| EPIC-125 Indicateurs | 506 | done 16/09 (sans ventilation par agence) |
| EPIC-126 Vers la balance | 507, 508 | done 17/09 (contribution prudentielle partielle publiée vers `balance-service`, « jamais une fausse balance générale » ; pas de compte de classe 8) |
| EPIC-127 États et ratios | 509, 510 | done 19/09 mais livrés dans `bilan-service`, PAS dans ce service (états DIMF 2000 et 2080, 11 normes) ; gabarit développé seul ; rendu imprimable signable renvoyé à une story dédiée |

### 6.3 Ce qui sert au reporting BCEAO du jour 1, sans que la compta soit prioritaire

- Tout le calcul de risque de portefeuille : classement, provision proposée, PAR 30/90/180, encours par catégorie, taux de récupération. Ces fonctions sont des calculs purs à date d'arrêté, rejouables.
- Le paquet prudentiel (seuils des 11 normes, tranches, garanties admises) comme référentiel de paramètres, avec sa provenance et sa mise en garde.
- La publication d'écritures de provision (dotations, reprises, pertes) : candidate naturelle pour l'export d'écritures du §5.3.
- Les ratios et les états DIMF sont dans `bilan-service` et exigent une balance : donc le cœur doit fournir une balance (en postes RCSFD) ou rester la source de ces états. Ne sert pas au jour 1 sans cette alimentation.

### 6.4 Risque de chevauchement avec le crédit du PRD (double vérité)

| Zone | Service existant | PRD / démo | Risque |
|---|---|---|---|
| Argent du prêt (encours, décaissements, remboursements, échéancier) | tient le crédit « par événements » et recalcule l'échéancier | le cœur fait foi ; l'échéancier est généré par le comité de crédit dans Prospera | DEUX échéanciers et deux encours : il faut décider qui écrit un remboursement (le cœur) et traiter le service comme un calculateur alimenté par import, ou ne pas le déployer côté crédit |
| Épargne, dépôts, parts sociales, membres | tient comptes et mouvements | le cœur garde les comptes (PO) ; la démo a épargne et caisse | doublon direct avec les comptes du cœur |
| Provisions | propose et applique un arrêté (verrou) | provisions comptabilisées dans le cœur | provision de Prospera ≠ provision du cœur : la proposition ne doit jamais être présentée comme comptabilisée |
| Rééchelonnement / passage en perte | écrit des mouvements | ROC / comité décident, le cœur exécute | idem : décision dans Prospera, écriture dans le cœur |
| Agence | inconnue (`parAgence` nul) | PAR par agence partout dans la démo | dépend du service réseau |
| Gate d'accès | entitlement `microfinance`, référentiel `sfd-bceao@2.0` | installation chez le client | à intégrer au moteur d'installation |

## 7. Écarts et questions

### 7.1 Écarts récit PO ↔ démo ↔ docs ↔ existant

| Sujet | Récit PO | Démo | Docs / cahier | Existant |
|---|---|---|---|---|
| Taux de provision | — | 1/10/50/80/100 % par jours (conformité) ; 0/10/25/50/100 % par score (risque) | 1/10/25/50/100 % classes 0-4 | 0/40/80/100/100 % par mois (version allégée du RCSFD) |
| Classes | — | NORMAL…CONTENTIEUX (5) et PERFORMANT…PERTE (5) | classes 0-4 | catégories sain / souffrance / restructuré + tranches |
| PAR | « baisse du PAR » | 1/7/30/60/90 par multiplicateurs fixes | PAR 30/90 | 30/90/180 en jours, calcul exact |
| Seuils PAR90 | — | 4 % (indicateur), 5 % (export) | > 5 / > 10 % | aucun seuil réglementaire |
| Ratios prudentiels | — | solvabilité 8 %, transformation 80 %, liquidité 80 %, constantes | solvabilité 15/10 %, liquidité 100/80 % | 11 normes de l'Instruction 010-08-2010 (capitalisation 15 %, liquidité 100/80/60 %, etc.) |
| Périodicité | rapport réglementaire avec export PDF | mensuel « avant le 5 » | mensuel | mensuel (art. 44) ou trimestriel, 30 j ; DIMF annuel, 6 mois, papier signé |
| Comptabilité | non prioritaire, export des écritures | module complet SYSCOHADA | M08 « voir PGI » (document PGI générique, sans SFD) | paquet comptable SFD `sfd-bceao@2.0` fait |
| Taux d'usure | 24 %/an | aucun contrôle ; 2,5 %/mois, TAEG 36,4 % | — | aucun |
| Qui fait foi | le cœur | tout est saisi dans Prospera | — | tient crédit et dépôts |
| Export PDF | oui | réel côté navigateur, non signable | rapport signé par le DG | texte réel : papier signé |
| Journal d'audit | traçabilité | « infalsifiable » en libellé | table sans UPDATE ni DELETE | outbox, pas de journal d'audit identifié |

### 7.2 Questions bloquantes pour le PO

1. Q1 Provisionnement : quel barème l'IMF applique-t-elle (version développée du RCSFD, taux non vérifiés, ou la grille de la banque centrale locale) ? Qui valide (praticien SFD, `a-valider-par-expert`) ? Prospera propose-t-il seulement, le cœur comptabilisant ?
2. Q2 Taux d'usure : 24 % compare-t-il le taux nominal ou le TAEG (frais et assurance compris) ? Dérogation possible, et par qui ?
3. Q3 Le cœur peut-il livrer une balance en postes RCSFD (ou les montants de fonds propres, actif net, ressources stables, passif exigible) pour les ratios ? Sinon les ratios restent hors Prospera.
4. Q4 L'IMF est-elle de l'article 44 (≥ 2 Md FCFA) : indicateurs mensuels, version développée ? Quelle catégorie prudentielle (liquidité 100/80/60 %) ?
5. Q5 LBC/FT (KYC, CENTIF, listes de sanctions) : dans ce PRD ou dans celui des clients ? Quel pays, donc quelles références ?
6. Q6 Format d'échange des écritures et des paiements avec le cœur (inconnu) : l'export est-il un fichier, un flux, une saisie ? Mapping de comptes à la charge de qui ?
7. Q7 `prospera-microfinance-service` : on le déploie comme calculateur de risque seul (crédits alimentés par import du cœur), ou on laisse sa tenue des crédits et dépôts de côté pour éviter la double vérité ?
8. Q8 Signature et dépôt : le DG signe-t-il dans Prospera (signature numérique) ou sur papier ? Qui dépose à la BCEAO (l'IMF, hors Prospera) ?
9. Q9 Seuils d'alerte internes (PAR, concentration, écart de caisse, délai de blocage) : valeurs de départ de la démo acceptées comme paramètres ?
10. Q10 PAR par agence et par agent est central dans la démo ; le service existant ne sait pas l'agence : confirmer que l'agence vient du réseau d'agences de la plateforme.
