# Extrait PRD Microfinance — Pilotage, rôles, équipes, marketing, IA

Statut : écrit le 2026-11-13. Périmètre : tableaux de bord par rôle, rôles et périmètres, utilisateurs, équipes et performance, réseau d'agences, marketing et acquisition, chatbot WhatsApp, Copilot IA, alertes, discours produit.

**Conventions.** « L'IMF » = le client (jamais nommé). Le front de démo définit le produit mais n'enregistre rien de vrai. « Constante » = valeur écrite dans le front. Toute valeur de démo (seuil, poids, objectif) est un futur paramètre (PO : « exactement », BD §7). Le logiciel cœur de l'IMF fait foi pour l'argent : encours, PAR, collecte et trésorerie sont calculés depuis ce que le cœur envoie à Prospera.

Sources abrégées. `BD` = `brain-dump-po-2026-11-13.md`. `PRD-D` = `../prd-distributeur-2026-11-12/prd.md`. `MF` = `prospera-font-end/docs/prospera_microfinance.md`. `CO` = `docs/CAHIER_DES_CHARGES_BUNDLE_CROISSANCE_OPERATIONS.md`. `WEB` = `docs/CAHIER_DES_CHARGES_PROSPERA_WEB.md`. `IA` = `docs/prospera_modules_ia.md`. `PRIX` = `docs/prospera_pricing.md`. `SCH` = `prospera-backend/backend-dashboard-specs/SCHEMAS-REFERENCE.md`. `DPV3` = `prospera-backend/document_produit_v3.md`. Chemins du front relatifs à `prospera-font-end/prospera-web/src/`. Le backend de la démo n'est pas décrit.

---

## 1. Rôles, périmètres, utilisateurs

### 1.1 Le récit

Un tableau de bord par rôle, « environ 10 rôles » ; le DG descend « réseau → secteur → agent → client » (BD:128). Chacun ne voit que son périmètre : DG tout le réseau, RA son agence, GP son portefeuille, agent sa zone (BD:129). Les docs comptent 10 personas (MF:77, 127-144), 15 profils (WEB:58-81), le code 16 codes (`types/index.ts:2-17`, `SCH:32`).

### 1.2 Liste des rôles (16 codes du front)

Niveau : R réseau · A agence · Z zone · P portefeuille. Périmètres selon les docs (CO:102-111, WEB:289-296, SCH:505-523) ; la démo ne les applique pas (1.4).

| # | Nom exact (`lib/auth.ts:106-123`) | Code | Sigle | Niveau | Périmètre | Droits clés |
|---|---|---|---|---|---|---|
| 1 | Directeur Général | `MANAGER` | DG | R | tout le réseau (5 agences en démo) | vue 360°, 5 onglets ; crée RA, RCC, ROC, GP (`components/phase1/UserCreateModal.tsx:13-18`) ; déclenche les campagnes (CO:626-627) |
| 2 | Responsable Opération & Crédit | `RESPONSABLE_CREDIT` | ROC | R | réseau, crédit et recouvrement | validation finale : Approuver, Approuver réduit, Demander garanties, Refuser (`DashboardResponsableCredit.tsx:29-32`) |
| 3 | Responsable d'Agence | `GESTIONNAIRE` | RA | A | son agence (Lomé Centre en démo) | fixe les objectifs de ses agents (CO:414-420) ; crée AT, CC, COMPTABLE, COLLECTRICE, COMMERCIAL (`UserCreateModal.tsx:21`) ; réaffecte les zones |
| 4 | Gestionnaire de Portefeuille | `GESTIONNAIRE_PORTEFEUILLE` | GP | P | ses clients après décaissement | relances, terrain, recouvrement ; ne voit pas le portefeuille d'un autre GP (WEB, scénario sécurité) |
| 5 | Chargé de Crédit | `CREDIT` | CC | P (dossiers affectés) | dossiers affectés | instruit, score, suggère ; ne décide pas (règle WEB:248-251) |
| 6 | Agent Terrain & Collecte | `AGENT_TERRAIN` | AT | P/Z | sa zone, ses prospects | visites GPS, collecte, prospection |
| 7 | Tontinière / Agent Collecte | `COLLECTRICE` | COLL | P/Z | ses groupes, tontines | collecte épargne, remboursements ; même dashboard que AT (`DashboardByRole.tsx:73-75`) |
| 8 | Commercial Agence | `COMMERCIAL` | COM | A/P | leads de son agence (CO:107) | enregistre clients, ouvre comptes, monte dossiers |
| 9 | Responsable Commerciale & Collecte | `RESPONSABLE_COMMERCIAL` | RCC | A (CO:108) / R (son dashboard compare les agences) | équipe et leads de son agence | pilote pipeline, collecte, équipe ; fixe nouveaux clients et conversion (CO:416-419) |
| 10 | Analyste Risque | `RISQUE` | RSQ | R | transverse | PAR, provisions ; dashboard « à formaliser » (SCH:521) |
| 11 | Auditeur Interne | `AUDITEUR` | AUD | R | toutes zones, lecture | fraude, anomalies, traçabilité, BCEAO ; pas de Copilot (`lib/ai/copilot-questions.ts:115-117`) |
| 12 | Directeur Administratif & Financier | `DAF` | DAF | R | réseau, finance | trésorerie, bilan, budget, rentabilité, contrôle de gestion inclus (`types/index.ts:16`) ; ouvre `/utilisateurs` |
| 13 | Finances & Recouvrement | `RELANCE` | REL | R | créances, relances | recouvrement, Mobile Money |
| 14 | Finances & Recouvrement | `COMPTABLE` | CPT | R | écritures, caisse | même libellé et dashboard que REL (`DashboardByRole.tsx:86-89`) |
| 15 | Gestionnaire Paie | `PAIE` | PAIE | R (équipes) | équipes, rémunérations | commissions, masse salariale, primes (`lib/auth.ts:144-160`) ; ouvre `/equipe` |
| 16 | Responsable Communication & Marketing | `COMMUNICATION` | COMM | R | réseau entier (CO:104) | campagnes, leads, chatbot, budget |

Sans code : **Directeur Commercial (DC)** et **Directeur Exploitation Crédit (DEC)** (MF:134-137). Dans le code ce sont des onglets du dashboard DG (`DashboardManager.tsx:45-52`). REL, CPT, PAIE ouvrent un seul composant à 3 onglets : Recouvrement, Comptabilité, Paie & KPIs (`DashboardFinancesComplet.tsx:90-92`).

### 1.3 Table rôles × écrans telle que la démo l'applique (menu)

Source `components/layout/Sidebar.tsx`. Le « Tableau de bord » est commun à tous. Le menu filtre l'affichage, il ne protège rien.

| Rôle | Entrées | Réf. |
|---|---|---|
| DG | Agences, Zones terrain, Épargne réseau, Opérations bancaires, Produits, Conformité BCEAO, Trésorerie réseau, Utilisateurs, Équipe & Performance, PAR & Risque | `:117-134` |
| ROC | Pipeline crédit, Opérations bancaires, Catalogue produits, Conformité, PAR & Risque, Recouvrement, Agences & opérations, Groupes | `:221-236` |
| RA | Emprunteurs, Terrain, Crédit & Opérations, Pipeline, Caisse agence, Équipe & Performance | `:189-202` |
| GP | Mes clients, Relances (badge), Terrain | `:151-161` |
| CC | Dossiers crédit, Pipeline, KYC, Calendrier | `:137-148` |
| AUD | Fraude & Anomalies, Contrôle crédit, Audit agences, Caisse & Compta, Traçabilité, Conformité BCEAO | `:205-218` |
| RCC | aucune : carte et calendrier dans le dashboard | `:179-186` |
| COLL | Mes clients, Épargne, Tontines & groupes, KYC, Hors-ligne | `:164-176` |
| AT | Emprunteurs, Terrain, Relances, Hors-ligne | `:31-65` |
| COM | Emprunteurs, Terrain, Épargne, Opérations bancaires, Groupes, KYC, Hors-ligne, Produits, Cycle de vie prêt | `:31-78` |
| RSQ | Emprunteurs, Crédit & Opérations, Dossiers, Pipeline, Cycle de vie, Conformité, Risque & PAR | idem |
| REL | Relances, Caisse | idem |
| CPT | Épargne, Opérations bancaires, Produits, Caisse, Comptabilité | idem |
| DAF | Épargne, Opérations bancaires, Produits, Caisse, Conformité, Finance & Budget, Comptabilité, Audit financier, Utilisateurs | idem |
| PAIE | Équipe & Performance | idem |
| COMM | Communication (`/marketing`) | idem |

### 1.4 Ce que la démo n'applique pas

- **Le middleware ne contrôle que la connexion** : cookie `prospera_auth`, redirection vers `/login` s'il manque (`middleware.ts:41-60`). Le cookie est l'identifiant utilisateur, non signé (`lib/auth.ts:85-93`) ; le rôle est dans `localStorage` (`contexts/AuthContext.tsx:58-62`). Le layout vérifie seulement qu'un utilisateur existe (`app/(dashboard)/layout.tsx:15-35`). Aucune route n'est refusée selon le rôle.
- **Les pages s'adaptent mais ne refusent personne** : `/equipe` rend la vue DG à tout rôle non RA/ROC (`app/(dashboard)/equipe/page.tsx:25-54`) ; `/marketing` rend le dashboard Communication à tout connecté (`marketing/page.tsx:20-34`) ; `/utilisateurs` sans garde (`utilisateurs/page.tsx:4-13`).
- **Aucun périmètre serveur** : dashboards câblés sur une agence ou un agent fixes (RA = Lomé Centre, `DashboardResponsableAgence.tsx:21`, `Sidebar.tsx:188`). Le filtrage « par JWT » n'existe que dans la doc (WEB:297, 1473 ; CO:516).
- **11 comptes de démo** (`lib/auth.ts:13-80`) : DG, ROC, DAF, AUD, RA, GP, CC, RCC, AT, COLL, COMM. Aucun pour COM, RSQ, REL, CPT, PAIE.
- Le front crée un `COMMERCIAL` sous le rôle API `AGENT_TERRAIN` (`lib/api-role-map.ts:41`) : COM et AT ne sont pas distingués côté serveur.

### 1.5 Utilisateurs (`/utilisateurs`)

Sources `components/admin/UtilisateursView.tsx`, `lib/utilisateurs-hub.ts`.
- **Indicateurs** : Utilisateurs, Actifs, Suspendus, Sans MFA (actifs sans MFA), Connexions jour. Calculés sur 7 lignes en dur, sauf Connexions jour = 34 (constante, `utilisateurs-hub.ts:52-58`).
- **Liste** : nom, e-mail, rôle, agence, statut (ACTIF, INACTIF, SUSPENDU), MFA ; recherche nom/e-mail ; ni pagination ni filtre.
- **Journal d'accès** : 4 lignes en dur (connexion, échec, export PDF, validation de dossier ; IP masquées) (`:64-69`).
- **Création** : bouton pour DG et RA (`UtilisateursView.tsx:30-31`) mais le menu RA n'a pas `/utilisateurs` (incohérence). DG crée RA, RCC, ROC, GP avec choix d'agence ; RA crée AT, CC, COMPTABLE, COLLECTRICE, COMMERCIAL (`UserCreateModal.tsx:13-21, 70`). **Personne ne peut créer DAF, AUD, COMM, RSQ, REL, PAIE.**
- **Absent** : changer rôle, suspendre, réinitialiser le mot de passe, activer le MFA, changer d'agence, périmètre multi-agences, journal complet. Le sous-titre annonce « RBAC · Zones d'affectation · MFA · Journal d'accès » (`utilisateurs/page.tsx:8`).

### 1.6 Règles proposées

1. Rôle et périmètre tenus par le serveur ; un filtre vide ne retombe jamais sur « tout le réseau ».
2. Changement de rôle ou de périmètre effectif à la requête suivante.
3. Liste des rôles créables par rôle = donnée paramétrable, tous rôles couverts.
4. Écran non autorisé : « accès refusé » ; API : refus nommé sans donnée.
5. MFA exigé pour les rôles qui voient l'argent du réseau : proposition (aucune source ne l'exige), question Q9.

## 2. Tableau de bord par rôle

Règle commune de la démo : chaque dashboard est un composant dédié (`components/dashboard/DashboardByRole.tsx:66-98`) ; les valeurs viennent de séries simulées (`lib/mock-time-series.ts`, Déc 2025 → Mai 2026, 6 points) et de registres ; beaucoup de variations et de ratios sont des multiplicateurs ou des constantes. Chaque rôle a un « rapport IA » narratif pré-écrit et un bouton d'export qui est **simulé** (`ExportButton.tsx:22-29` : un `setTimeout`, aucun fichier). La cible des docs : rafraîchissement automatique toutes les 5 min en production (WEB:291), alertes rouges = action sous 24 h (WEB:298). Formule cible générale PAR portefeuille = encours en retard ÷ encours total × 100 (CO:407).

### 2.1 DG — `DashboardManager.tsx`

- **12 indicateurs « Vue exécutive 360° »** avec sparkline 6 mois, variation et clic de descente (`lib/mock-reseau-kpis-builder.ts:40-108`). Famille PORTEFEUILLE : Encours total ; Clients actifs ; PAR 30 / 90 ; EL / Provisions (écart affiché). Famille ACTIVITÉ : Décaissements du mois ; Collecte du mois (% de l'objectif) ; Encours épargne ; Transactions du mois. Famille RENTABILITÉ : Revenus du mois ; Profit net ; Coût du risque ; Liquidité disponible (semaines d'autonomie).
  - Formules de la démo (à ne pas reprendre telles quelles) : Revenus = Collecte × 0,22 ; Profit net = Revenus × 0,33 ; Encours épargne = Encours crédit × 0,283 ; Transactions = Décaissements × 54,7 ; Coût du risque = EL ÷ Encours ; variations Transactions (14,8), Profit net (8,7), Coût du risque (0,2) constantes (`:84-101`).
  - Formules cibles docs : PAR, collecte, pipeline, effectifs agents (WEB:339-349).
- **Cartes d'agence** (5) : PAR >30j (rouge > 10, orange > 8), taux de remboursement (vert ≥ 93), collecte en % de l'objectif (vert ≥ 90, orange ≥ 70), statut de conformité BCEAO, score de santé /100 (vert ≥ 80, orange ≥ 65), emprunteurs, agents, RA (`DashboardManager.tsx:59-110`).
- **Graphiques** : Évolution PAR 30j et remboursement avec prévisions juin-août (confiance 82 %) et ligne « Seuil BCEAO » à 10 % (`:340-345`) ; répartition du portefeuille par produit avec PAR (> 10 « au-dessus du seuil BCEAO », > 8 « proche », sinon « sain ») ; vieillissement du portefeuille (aging) ; classes BCEAO ; secteurs d'activité ; carte de couverture IA ; analyse comportementale des agences IA.
- **Onglets** : Vue 360°, Crédit (DEC), Commercial (DC), Financier (DAF), Opérationnel, Terrain (RA) (`:45-52`).
- **Alertes** : bouton « N alertes critiques » = nombre d'anomalies de gravité CRITIQUE du registre du jour (`:154, 183-186`) ; **le bouton n'a pas d'action**.
- **Actions** : « Exporter rapport DG » (simulé) ; Agence sélectionnable (filtre l'écran).
- **Descente** : Réseau → Agence (clic sur la carte, filtre tous les graphiques) → Agent (`/dashboard/agents/[id]`, depuis `PilotageEquipesDg`) → Client (`/dashboard/credit/clients/[id]`, `/dashboard/commercial/clients/[id]`, `/dashboard/operationnel/clients/[id]`) → Transaction ou modification (`/dashboard/operationnel/transactions/[id]`, `/dashboard/operationnel/modifications/[id]`) ; dossier (`/dashboard/credit/dossiers/[id]`). Fil d'Ariane typé `RESEAU | REGION | AGENCE | AGENT | CLIENT | PRET` (`DrillDownBreadcrumb.tsx:5`) ; **« REGION » n'est jamais alimenté**, et le « secteur » du DG (`/dashboard/secteurs/[slug]`, sous-secteurs) est le **secteur d'activité économique** (Commerce, Agriculture…) avec seuil de concentration à 30 % (`lib/secteur-hub.ts:7`), pas un découpage géographique. Voir Q2.
- **Rapport IA global** : analyse de situation, piliers, priorités ; généré à 06:00 dans la doc (WEB:318).

### 2.2 ROC — `DashboardResponsableCredit.tsx`

- Indicateurs immédiats : Prêts actifs ; Décaissements du jour (nombre et montant) ; Remboursements du jour ; PAR 1j, 7j, 30j ; Dossiers en retard ; Montant des impayés ; Dossiers bloqués > 48 h ; Délai de traitement moyen (objectif affiché) (`:146-194`). KPI réseau : Encours, PAR 30j, Expected Loss, Cash réseau, À valider, Uptime système (`mock-reseau-kpis-builder.ts:116-123`).
- Blocs : Pipeline des dossiers (kanban) ; File de validation ROC ; Top 5 alertes priorisées IA ; Évolution PAR 30j sur 12 semaines avec lignes « BCEAO 10 % » et « Interne 8 % » ; Top mauvais payeurs ; Recouvrement réseau du jour ; Performance des agents de recouvrement (détection de sous-performance) ; Heatmap PAR par agence (rouge > seuil × 1,3 ; orange > seuil ; jaune > seuil × 0,7) ; Tension cash des agences ; Dossiers bloqués > 48 h ; Contrôle quotidien (transactions échouées, opérations annulées, dossiers incomplets, agences actives, tickets d'incident).
- Actions : Approuver, Approuver réduit, Demander garanties, Refuser. Descente : dossier, client, agent, agence.

### 2.3 CC — `DashboardChargeCredit.tsx`

Objectifs du jour : Décisions, En attente, Délai moyen, Alertes CBI, Transmis ROC, Taux d'approbation, Score moyen, Qualité (`:96-107`). Blocs : Ma file de dossiers, Alertes CBI v5, calendrier du jour, Workflow par étape, « Moi vs équipe CC » (score moyen, délai en heures, approbation, qualité), Productivité 7 jours, Dernières décisions. Raccourcis : Analyse dossiers, Pipeline, Calendrier.

### 2.4 RA — `DashboardResponsableAgence.tsx`

8 indicateurs « temps réel » (`:50-64`) : Emprunteurs (+ nouveaux clients du mois) ; Encours agence ; PAR 30 (alerte si > 8 %) ; Recouvrement (taux de remboursement) ; Collecte du jour ; Agents terrain actifs / total (couverture) ; Transactions par jour ; Liquidité (et solde de caisse). Blocs : rapport IA de l'agence ; 4 cartes d'accès (Emprunteurs, Terrain, Crédit, Équipe) ; **classement des agents du jour** (rang, visites faites/prévues, collecte, couverture — rouge si < 70 %, performance en %) ; ligne grisée rouge si statut DEGRADE. Descente : Équipe complète, fiche agent. Contenu hérité d'une seule agence (Lomé Centre).

### 2.5 GP — `DashboardGestionnairePortefeuille.tsx`

Indicateurs portefeuille (`:99-110`) : Clients, Encours, PAR 30, Recouvrement, En retard, Collecte du jour, Visites, À relancer. Blocs : Aging des retards ; Segmentation ; Recouvrement du jour (objectif, recouvré) ; Activité terrain (visites, manquées, temps moyen, distance, itinéraire IA) ; Ma performance du mois ; Productivité 30 jours.

### 2.6 RCC — `DashboardResponsableCommercial.tsx`

Trois groupes (`:83-103`) : Commercial (Nouveaux clients, Objectif du mois, Prospects actifs, Conversion) ; Collecte (Réalisé du jour, Taux de collecte, Promesses, Retards) ; Équipe (Agents actifs, Visites, Sous-performants, Productivité). Blocs : Propositions IA (actions prioritaires) ; Analyse par agence ; Zones contrôlées et collecte terrain (carte) ; Calendrier des agents du jour ; Performance du jour de l'équipe (collecte, nouveaux clients, conversion, visites) ; Alertes.

### 2.7 Agent terrain / Collectrice — `DashboardTerrain.tsx`

Ma journée (`:181-188`) : À visiter, À collecter, Tontines, En retard, Objectif du jour, Atteinte, Prospects, Dossiers. Blocs : Synthèse IA de la journée ; Planning intelligent du jour ; Alertes ; Carte de tournée optimisée ; Zones de potentiel ; Vigilance sécurité ; Mon portefeuille par segment (VIP, Bonne payeuse, Sensible, À risque, Inactive) ; Recouvrement (En retard, À recouvrer, Récupéré du jour, Retards critiques, Promesses du jour) ; Tontines (Prévu du jour, Collecté, Taux, Absentes, Versements manqués, Retards, Groupes actifs) ; Prospection (Nouveaux du mois, RDV du jour, Conversion, Dossiers ouverts, Chauds). Hors ligne via `/terrain/offline`.

### 2.8 Commercial — `DashboardCommercial.tsx`

Visites du jour ; Collecte du jour ; Classement équipe ; Streak actif ; progression des objectifs du jour (visites, collecte Mobile Money, points de gamification) ; Plan de tournée IA ; Défis actifs (réalisé/objectif, récompense, échéance) ; Badges du mois ; Visites récentes ; Classement de la semaine ; Activité 7 jours ; « Ready to Revisit » (prospects tièdes, scoring de conversion) ; Détection GPS anti-collision (rayon 50 m).

### 2.9 Communication — `DashboardCommunication.tsx` (détail au §6)

Indicateurs : Leads du mois, Convertis, Conversion, CAC, NPS, Rétention, Leads chatbot, Non assignés, Pipeline valorisé, Budget consommé, ROI global, LTV moyen (`:248-262`). 9 onglets : Acquisition, Chatbot IA, Campagnes, Présence, Fidélisation, Couverture, Marché, Budget, Institutionnel.

### 2.10 Auditeur — `DashboardAuditeur.tsx`

Compteurs (`:842-849`) : Anomalies actives, Transactions suspectes, Alertes fraude, Écarts de caisse, Dossiers incomplets, Opérations hors horaires, Violations de procédure, Conformité GPS. Blocs : conformité réglementaire BCEAO (évaluation IA, calcul automatique), détection comportementale, contrôle crédit, audit des agences, caisse et comptabilité, traçabilité « infalsifiable ». Pages dédiées `/audit/*`.

### 2.11 DAF — `DashboardDAF.tsx`

Bandeau (`:483-490`) : Trésorerie, Résultat net, Produits financiers, Charges opérationnelles, Ratio de liquidité, Coût du risque, Coefficient d'exploitation, Objectif annuel. Efficacité (`:286-290`) : Productivité par agent, Revenus par employé, Coût par dossier, Coût de collecte, CAC moyen. Onglets : Trésorerie, Rentabilité, Budget ; raccourcis Comptabilité, Trésorerie, Budgets, Rentabilité, Contrôle de gestion ; projection IA.

### 2.12 Risque — `DashboardCreditRisque.tsx`

PAR > 30j global ; Pipeline actif ; Décaissé ce mois ; Signaux faibles IA ; PAR > 30 / 60 / 90 j (`:36-55`). Blocs : pipeline 7 étapes ; dossiers prioritaires avec recommandation IA (modèle annoncé XGBoost) ; prévision de défauts à 7-30 jours ; évolution du PAR avec prévision à 3 mois ; signaux faibles comportementaux à 14 jours ; distribution des scores ; PAR par agence ; performance crédit (remboursement, collecte du mois, objectif de collecte, encours) ; Performance Gap Analysis des agents (coaching IA).

### 2.13 Finances (REL, CPT, PAIE) — `DashboardFinancesComplet.tsx`

Encaissé ce mois ; En retard / impayé ; Réconciliation MoMo ; Commissions agents (`:44-53`). Recouvrement : file de relances, taux de réponse par canal, stratégie de relance IA (situation → action), changement de canal. Comptabilité : flux de trésorerie 7 jours, créances par statut, transactions Mobile Money récentes. Paie : performance des agents (GPS validé seulement), objectifs multi-niveaux mensuel, trimestriel, annuel.

### 2.14 Écarts de cohérence entre écrans (à lever)

- Mêmes entités, chiffres différents : le DG compte 905 emprunteurs et 409,49 M de FCFA d'encours (`lib/mock-time-series.ts`, commentaire « valeurs canoniques ») ; la spec backend du DG affiche 188 clients et 61,18 M (`backend-dashboard-specs/01-dashboard-dg.md:45-60`) ; la couverture territoire de la Communication dit 1 200 clients actifs et 5,4 % de PAR à Bè Kpota (`lib/mockMicrofinance.ts` après 1840) contre 11,2 % dans `lib/agences.ts:90`.
- Seuil de concentration : 30 % (`secteur-hub.ts:7`) contre 25 % cité par l'audit (« Seuil BCEAO = 25 % »).
- Seuil de dossier bloqué : 48 h (ROC) contre 30 jours (WEB:320).

---

## 3. Alertes

### 3.1 Mécanismes dans la démo

| Mécanisme | Contenu | Où | Cycle de vie |
|---|---|---|---|
| Alerte client (`AIAlert`) | gravité `CRITIQUE`, `SURVEILLANCE`, `INFO` ; types `RETARD_J7`, `SCORE_BAISSE`, `INACTIVITE_WHATSAPP`, `DEFAUT_PREVU`, `ECHEANCE_3J` ; client, retard en jours, score IA, action recommandée, agent (`types/index.ts:132-151`) | panneau « Alertes IA » (5 premières) ; badge rouge sur « Relances » = nombre de CRITIQUE, relu toutes les 60 s (`Sidebar.tsx:274-275, 318` ; `hooks/useAlertes.ts`) | aucun : lecture seule |
| Anomalie du jour du DG | 12 entrées AN-001 à AN-012 ; domaines FRAUDE, CREDIT, OPERATIONNEL, COMMERCIAL, FINANCE, CONFORMITE, TERRAIN ; gravité CRITIQUE, HAUTE, MOYENNE ; impact estimé, action, responsable, délai, ancienneté (`lib/mock-controle-interne-registry.ts:428-447`) | bouton « N alertes critiques » (sans action) | aucun |
| Anomalie d'audit | types : double décaissement, modification manuelle, décaissements liés, annulations anormales, crédit sans garantie, concentration, opération hors horaires, écart de caisse, compte dormant, connexion suspecte, double financement ; statuts DETECTE, EN_COURS, RESOLU (`:450-475`) | dashboard Auditeur | statut affiché seulement |
| Alertes CBI v5 | alertes de scoring sur dossiers | dashboard CC | aucun |
| Priorisées ROC | « Top 5 alertes priorisées IA », dossiers bloqués > 48 h | dashboard ROC | aucun |
| Conformité par agence | CONFORME, ATTENTION, NON_CONFORME | carte d'agence DG | aucun |
| Alertes Communication / RCC / terrain | leads non assignés > 24 h, GPS, vigilance sécurité | onglet « Toutes les alertes » | aucun |

Aucun mécanisme n'a de prise en charge, de résolution, d'accusé ni d'historique. Le PRD-D FR-14 et FR-167 donnent le modèle cible (objet unique, statuts OUVERTE, PRISE_EN_CHARGE, RESOLUE).

### 3.2 Déclencheurs, destinataires et seuils

| Déclencheur | Seuil (valeur démo, paramètre futur) | Destinataire | Source |
|---|---|---|---|
| PAR d'une agence en hausse | +2 points vs M-1 | DG (in-app + e-mail), RA, ROC | WEB:320, WEB:1452 |
| PAR agence au-dessus du seuil | 10 % (BCEAO) ; 8 % interne | DG, ROC, RA | `DashboardManager.tsx:60, 345` ; `DashboardResponsableCredit.tsx` |
| PAR par zone | au-dessus d'un seuil ou hausse > 2 points vs M-1 | RA, DG | CO:492 |
| Collecte | < 80 % de l'objectif | RA, DG | WEB:320 |
| Dossier bloqué | > 48 h (front) ou > 30 jours (doc) | ROC, CC | front / WEB:320 |
| Performance gap d'un agent | < −25 % : alerte RA et coaching obligatoire ; −11 à −25 % : recommandation ; −1 à −10 % : affichage | RA | CO:436-441 |
| Agent « DEGRADE » | score < 70 ou recouvrement < 60 % : plan d'action sous 7 jours | RA, DG | `lib/equipe-registry.ts:73, 199` |
| Collecte d'agence (couleur) | < 70 % rouge, < 90 % orange | DG | `DashboardManager.tsx:92` |
| Score de santé d'agence | < 65 rouge, < 80 orange | DG | `:104` |
| Retard d'échéance | J-3 : WhatsApp avec lien ; J+1 à J+3 : WhatsApp + SMS ; J+7 : visite terrain créée automatiquement ; risque élevé + retard : escalade superviseur + alerte ROC ; promesse non tenue : re-relance + escalade | client, GP/AT, RA, ROC | MF:168-175 |
| Concentration d'un secteur | 30 % (front) / 25 % (audit) | DG, RSQ, AUD | `secteur-hub.ts:7` |
| Rapport BCEAO en retard | échéance 31/05 dépassée | DAF, DG | AN-010 |
| Lead non assigné | > 24 h | COMM, RCC | AN-007 ; `copilot-questions.ts` |
| Écart de caisse | caisse physique ≠ caisse système (148 000 et 220 000 F en démo) | RA, DAF, AUD | AN-008, AN-009 |
| GPS incohérent / coupé | trajet impossible, GPS coupé 47 min ; anti-collision 50 m | RA, AUD | AN-001, AN-011 ; `DashboardCommercial.tsx:309` |
| Opération hors horaires | système verrouillé à 20 h | AUD | AN-007 audit |

Récapitulatif : l'IMF doit pouvoir régler chaque seuil par réseau, puis par agence. Les destinataires des alertes ne sont écrits nulle part de façon exhaustive ; le tableau ci-dessus est la meilleure reconstitution (Q8).

---

## 4. Copilot IA et IA en général

### 4.1 Copilot (tiroir latéral)

- **Où** : monté dans le layout, sur toutes les pages du tableau de bord, sauf pour l'Auditeur (`app/(dashboard)/layout.tsx:46` ; `lib/ai/copilot-questions.ts:115-117`).
- **Entrées** : 5 suggestions par profil (11 profils : executive, agence, portefeuille, terrain, commercial, rcc, credit, roc, finances, daf, marketing ; `copilot-questions.ts:9-106`) et saisie libre. Contexte envoyé : prénom, rôle, zone, nom complet (`lib/ai/copilot-context.ts`). **La page ouverte et l'entité consultée ne sont pas transmises**, alors que la doc les exige (WEB:1399 environ : `{ question, role, pageContext, entityIds }`).
- **Questions types** (DG) : priorités du jour ; évolution du PAR réseau ; agence en alerte ; liquidité et caisse ; actions IA recommandées de la semaine. RA : objectif agence, agent en difficulté, PAR et mauvais payeurs, dossiers à débloquer, couverture terrain. GP : clients à visiter, retards critiques, renouvellements, collecte du jour, risque. AT : ordre de visite, retards de zone, objectif de collecte, prospects chauds, conseil de tournée. COMM : leads non assignés > 24 h, conversion par canal, performance du chatbot, campagnes recommandées, meilleur segment. DAF : suspens et clôture, provisions, cash à 7 jours, ratios BCEAO non conformes, risques financiers.
- **Moteur** : détection d'intention (19 intentions : objectifs, retard, client, dossier, agent, PAR comparé, évolution PAR, agences en alerte, trésorerie, actions de la semaine, priorités du jour, DAF…), résolution des entités (client, agence, agent, dossier DOS-…), réponse construite sur des jeux simulés (`lib/ai/copilot-engine.ts:1-80`). Cible : `POST /ia/copilot`, moteur LLM (WEB:1424).
- **Sorties** : texte seul. Les boutons d'action (« Voir dossier », « Ouvrir agence ») de la doc (WEB:1404) n'existent pas. Aucun chiffre ne cite sa source ni sa date, contre la règle WEB:1416.
- **Garde-fous** (doc, WEB:1415-1417) : ne jamais exécuter d'action destructive ; proposer des liens ; citer chiffres, source, périmètre ; répondre « Données non disponibles pour {entité} » si les données manquent. Démo : réponse de repli générique invitant à reformuler (`lib/ai/copilot-responses.ts:6-8`).
- **Règle fondamentale** : aucune décision réglementaire ou financière définitive par l'IA seule ; décision d'un utilisateur habilité ou d'une règle métier explicite (WEB:248-251).

### 4.2 Les trois niveaux d'IA (WEB:210-220)

Assistance (l'IA recommande, l'humain décide) ; Automatisation (règle claire, ex. relance WhatsApp J-3) ; Alerte (anomalie détectée). Le cahier Croissance fixe les niveaux par processus (CO:163-174, repris en 5 et 6).

### 4.3 Où l'IA apparaît dans les dashboards

| Fonction | Rôle(s) | Entrée | Sortie |
|---|---|---|---|
| Rapport IA / synthèse du jour (DG, RA, RCC, COMM, AT, DAF, GP) | tous les cockpits | agrégats du périmètre | texte structuré (intro, points positifs, négatifs, attention, priorités) ; cron 06:00 (WEB:318) |
| Prévision du PAR 30 / 60 / 90 jours | DG, RSQ | historique d'échéances | courbe et confiance (82 % en démo) |
| Analyse du comportement des agences | DG | KPI d'agences | anomalies, benchmark |
| Carte de couverture IA, zones sous-couvertes | DG, RCC, COMM | clients/km², prospects | zones vierges, priorité |
| Scoring client 0-100 | CC, GP, RSQ, tous | historique, comportement | score, signaux faibles |
| Prévision de défauts, signaux faibles | RSQ, ROC | comportement de paiement | liste à 7-30 jours (annoncé XGBoost) |
| Alertes CBI v5 | CC | dossier | alerte de scoring |
| Relances intelligentes | GP, REL, AT | retard, profil | canal, moment, message pré-rédigé |
| Optimisation de tournée, voice-to-CRM, rapport du soir | AT, COM | missions, GPS | itinéraire, compte-rendu |
| Chatbot, scoring de leads, segmentation, recommandation de campagne, gamification | COMM, COM | message, lead | voir §6 |
| Performance gap, coaching, benchmarking, prévision de PAR par zone | RA, DG, RCC | KPI agents | voir §5 |
| Validation Mobile Money, réconciliation | CPT, REL | transactions | doublons, rapprochement |

Les « agents IA autonomes » du document produit v3 (qualification 100 % autonome, relance avec escalade, coaching en suggestion, prévision, reporting sur demande) sont un document générique d'outil commercial (`DPV3:352-366`), pas propre à l'IMF.

### 4.4 Provenance

La démo mêle règles écrites à la main, calculs et textes présentés comme « IA » (badges « Prospera AI », « Synthèse IA », confiance en %). La plupart des textes sont des constantes. Le PRD-D FR-16 impose la provenance (règle ou modèle, version, date) et interdit d'appeler « IA » une règle. Question Q6.

---

## 5. Équipes, objectifs, performance, classement, réseau d'agences

### 5.1 Ce que fait l'écran `/equipe`

- **Vue DG** (`components/equipe/EquipeDgView.tsx`) : KPI Performance moyenne, Objectif de collecte atteint, Recouvrement moyen, Clients en portefeuille ; classement des agents avec fiche ; répartition par agence ; décisions DG. Plusieurs textes et variations sont des constantes (« Collecte objectif 76,9 % », « −3,1 pt vs avril », variations +2,4, −3,1, +1,8 : `:21-24, 81-84`).
- **Vue RA** (`components/ra/EquipeRaBlock.tsx`) : commerciaux terrain (visites, collecte, objectif d'atteinte : vert ≥ 80 %, orange ≥ 60 %), gestionnaires de portefeuille (vert ≥ 95 %, orange ≥ 85 %), points forts et points à surveiller, ouverture de la fiche agent.
- **Fiche agent** (`FicheAgentMicrofinance.tsx`) : portefeuille, clients à risque (alerte si > 5), PAR (alerte si > 10), recouvrement, GPS conforme, dernière visite ; objectifs du mois contre réalisé (visites, relances, collecte, recouvrement, nouveaux clients, décaissements) ; points forts, points d'attention ; évolution 6 mois ; journal d'activité terrain ; historique des visites.
- **Pilotage des équipes du DG** (`PilotageEquipesDg.tsx`) : agents de pilotage (RA, « 0 visite ») séparés des agents terrain (« Visites · GPS · Collecte ») et de la direction siège (DEC, DC, DAF, Audit).
- Le ROC est redirigé vers `/credit/recouvrement` (équipes de recouvrement) (`equipe/page.tsx:15-23`, `credit/equipes/page.tsx`).

### 5.2 Score, statut, classement (règles de la démo)

- **Score de performance** : « indice composite 0-100 : collecte, recouvrement, visites, PAR et GPS », sans poids écrits (`lib/equipe-registry.ts:196`). Pour certains agents le score est simplement le taux de recouvrement (`:122`).
- **Statut** : BON si score ≥ 85, NORMAL si ≥ 70, DEGRADE sinon (`:73`) ; DEGRADE aussi si recouvrement < 60 %, avec plan d'action obligatoire sous 7 jours (`:199`).
- **Badges** OR, ARGENT, BRONZE du top 3 (`components/dashboard/PerformanceGap.tsx:4-36`). Rang = tri décroissant du score (`equipe-registry.ts:149-150`).
- **Objectif atteint** = collecte réalisée ÷ objectif mensuel fixé par la direction (`:198`) ; vert ≥ 85 %, orange ≥ 65 % (`EquipeTables.tsx:220`).
- **Performance Gap Analysis** : meilleur, moyenne de l'équipe, plus faible, en taux de recouvrement (`PerformanceGap.tsx:38-50`).
- **Statuts d'un objectif** : EN_AVANCE, DANS_LES_TEMPS, EN_RETARD, CRITIQUE ; « score global » = moyenne des progressions (`ObjectifsPanel.tsx:87-90`) ; chaque objectif porte un conseil IA et, si critique, une action urgente.

### 5.3 Règles des docs (cahier Croissance, M12)

- **KPI agents** (CO:400-411) : visites réalisées (géofencing validé) ; taux de visite = réalisées ÷ planifiées ; collecte terrain (encaissements TONTINE validés, FCFA/mois) ; PAR du portefeuille = encours en retard ÷ encours total ; nouveaux clients (prospects convertis en clients actifs) ; taux de conversion = leads qualifiés ÷ leads créés ; satisfaction de saisie = visites avec compte-rendu et photo.
- **Objectifs mensuels** (CO:412-420) : visites et collecte fixées par le RA par agent ; nouveaux clients et conversion fixés par le RCC par commercial ; PAR maximal du GP fixé par le RA (ex. < 8 %) ; valeurs par défaut suggérées par l'IA (moyenne N-1 + croissance, portefeuille × taux de collecte). Objectifs à jour avant le 5 du mois (CO:665). **La démo n'a aucun écran pour fixer un objectif** (aucune action « fixer » dans les composants ; seuls des clients d'API existent : `lib/api-phase1.ts:30`, `lib/api-phases-ad.ts:84`).
- **Performance gap** (CO:422-441) : projection de fin de mois = réalisé ÷ jours écoulés × 30 ; écart prévisionnel en % de l'objectif. Niveaux : > 0 vert ; −1 à −10 % jaune (affichage) ; −11 à −25 % orange (recommandation de coaching) ; < −25 % rouge (alerte RA, coaching obligatoire). Exemple : objectif 120 visites, 65 à J20 → 97,5 projetées, −22,5 (−19 %). Alerte IA quotidienne si la projection est < 75 % de l'objectif (CO:489).
- **Benchmarking** inter-agences hebdomadaire : agences de taille proche (± 20 % d'encours), 5 KPI (PAR, collecte %, conversion des leads, nouveaux clients, visites par agent) (CO:490).
- **Coaching IA** : si un agent est sous-performant, analyse des causes (zone difficile, portefeuille à risque, faible collecte) puis recommandations ; le RA décide (CO:491, 495).
- **Cycle mensuel** : objectifs en début de mois (RA) → KPI continus → gap quotidien → entretien RA/agent → benchmarking DG hebdomadaire → Copilot DG mensuel (CO:389-398).
- **Personnes** : le DG voit le réseau ; le RA son agence ; le RCC son équipe ; l'agent ses propres KPI (CO:109-111). PAIE gère les équipes et la structure du réseau (CO:100).
- **Rémunération** : PAIE « commissions agents, masse salariale, primes de performance » (`lib/auth.ts:158`) ; la démo n'a ni barème ni règle de calcul.

### 5.4 Réseau d'agences et zones

- **Structure** (CO:454-463) : Réseau > Agence (point de service physique, N agents, N zones) > Zone (polygone GPS) > Sous-secteur ; Agent rattaché à 1 agence et 1-N zones ; Équipe = groupe fonctionnel transversal.
- **Gestion des zones** (CO:443-452) : le RA dessine un polygone, assigne des agents, subdivise en sous-secteurs, transfère un agent ; l'IA repère les zones peu couvertes (clients actifs par km²). Écrans : `/zones` (carte, agents, micro-zones, zones d'expansion, lacunes, décisions DG, glossaire : `lib/zones-hub.ts:55-80`), `/agences` (vue DG et vue standard), `/credit/reseau` (« Agences & opérations » du ROC).
- **Indicateurs de zones** : couverture des micro-zones %, zones actives, zones vierges, agents actifs/total, clients cartographiés, pénétration du marché %, anomalies GPS sur 7 jours, rayon de couverture (km).
- **Agences en démo** (`lib/agences.ts:32-137`) : Lomé Centre, Adidogomé, Bè Kpota (PAR 11,2 %, en redressement), Hédzranawoé, Kpalimé (agence pilote, PAR 4,2 %). Pays et nombre réels : à fournir par l'IMF (« c'est eux qui gèrent », BD §7).
- **Écart** : la doc parle de « dessiner un polygone » (Leaflet Draw) ; la démo montre une carte avec marqueurs et zones préparées, sans dessin.

---

## 6. Marketing, acquisition, chatbot WhatsApp

### 6.1 Ce que fait l'écran (`/marketing`, rôle COMM)

Dashboard à 9 onglets, **tout en lecture** : le seul bouton avec effet est le sélecteur d'onglet et d'agence ; les boutons d'action (« {action} → ») n'ont pas de gestionnaire (`DashboardCommunication.tsx:845`). Aucune création de campagne, aucun changement de statut d'un lead, aucune assignation.

### 6.2 Parcours et données

**Lead (CO:192-216).** `NOUVEAU → QUALIFIE → CONVERTI` ou `DISQUALIFIE` (hors cible ou injoignable après 3 tentatives). Sources : chatbot WhatsApp, terrain direct, campagne WhatsApp, référencement, portail web. Conversion = création du client puis du dossier de crédit ; le lead converti garde le lien vers le client (critère bloquant CO:652). La démo affiche la température CHAUD / TIEDE / FROID, le score, le besoin, l'agence, la source, et « assigné / À assigner ! » (`mockMicrofinance.ts` pipeline).

**Scoring de prospect (CO:243-258).** Zone couverte 25 % ; secteur porteur 25 % ; montant cohérent 20 % ; rapidité de réponse du chatbot 15 % (< 10 min = fort) ; source 15 % (référencement = fort). Priorité : 80-100 appeler sous 24 h ; 60-79 sous 48 h ; 40-59 dans la semaine ; < 40 file d'attente et nurturing. Score présent à 100 % des leads à la création (critère bloquant).

**Chatbot WhatsApp (CO:218-241).** Premier message du prospect → réponse immédiate 24 h/24 (hors heures : « Nous vous répondrons dès demain à 08h00 »). 5 questions : prénom, activité principale, zone/quartier, montant souhaité, téléphone de rappel. Création du lead et du score ; message final « un conseiller de l'agence la plus proche vous contactera dans les 48h » ; notification du commercial assigné (agence déduite de la zone). Le chatbot est le seul cas où l'IA contacte seule (sur un message entrant) (CO:176). Démo : monitoring seul — conversations/mois 312, du jour 14, leads créés 47 (du jour 4), résolution automatique 72 %, en attente 7, satisfaction 4,4/5, temps de réponse 2,8 min, pic 19h-21h, top sujets (crédit individuel, tontine de groupe, conditions d'accès, remboursement, création de compte), statuts de conversation (LEAD_CREE, TRANSFERE, QUALIFIE) (`mockMicrofinance.ts` bloc `chatbot`).

**Entonnoir de la démo** : messages WhatsApp reçus 312 → qualifiés par le chatbot 198 → leads CRM → RDV/visite (leads × 0,62) → dossier soumis (leads × 0,40) → client gagné (`lib/mock-persona-builders.ts:1029-1036`).

**Campagnes (CO:260-280).** Choix du segment → type (Renouvellement, Réactivation épargne, Nouveau produit, Parrainage, Nurturing) → message généré par l'IA par segment avec {prénom}, {produit}, {montant} → validation humaine du message et du planning → envoi en lot par WhatsApp → suivi (envois, ouvertures, clics, conversions) → analyse. Seul le DG ou le responsable communication déclenche (CO:626-627 ; « jamais l'IA seule », CO:176). Démo : 4 campagnes (Crédit Express, Tontine Groupe Femmes, Lancement Kpalimé Pilote, Promotion Ramadan) avec budget, dépense, envois, ouvertures %, clics, conversions, revenu généré, ROI, note IA. **ROI de la démo = revenu généré ÷ budget** (558 000 ÷ 45 000 = 12,4 ; vérifié sur les quatre campagnes) ; ce n'est ni une marge ni un gain net.

**Gamification (CO:282-292).** Classements d'agences (conversion des leads, nouveaux clients, volume) et d'agents, défis (« Top 3 des ouvertures de compte »), badges automatiques (« Chasseur » 5 leads traités par semaine, « Recruteur » 10 conversions par mois), barre d'objectif collective ; calculés chaque soir sur des KPI réels. Démo : streak, points, défis actifs, badges (dashboard COM).

**Autres onglets de la démo.** Présence digitale (score global, Google Maps, Facebook, WhatsApp Business : 538 contacts opt-in, 4 diffusions par mois, taux de lecture 89 %, site web) ; Fidélisation (rétention 87 % contre 92 %, NPS 72 contre 80, clients à risque d'attrition, ambassadeurs, parrainages, raisons de départ) ; Couverture du territoire (pénétration 31 %, 326 prospects non couverts, 5 zones vierges) ; Budget (850 000 F par mois, consommé 578 000, répartition par poste, CAC) ; Institutionnel.

### 6.3 Formules de la démo (indicateurs Communication, `lib/mock-persona-builders.ts:1003-1026`)

Leads qualifiés = leads × 0,73 ; LTV moyen = encours ÷ emprunteurs (pas une vraie valeur vie client) ; Pipeline valorisé = encours × 0,17 ; Leads non assignés = max(1, leads × 0,06) ; Pénétration = emprunteurs ÷ 600 ; CAC moyen = 18 400 (constante) ; NPS 72, rétention 87 %, chatbot 312/47 : constantes.

### 6.4 Règles de consentement et sécurité (cahier, CO:623-639)

Opt-in : le lead a initié le contact ou accepté explicitement (campagnes). Opt-out : « STOP » par SMS ou WhatsApp met `opt_out=true`, plus aucune communication (critère bloquant : aucun envoi vers un opt-out). Tout envoi horodaté et archivé. Droit à l'oubli sur un lead. Segments agrégés et anonymisés (pas de données personnelles dans les clusters). Le commercial ne voit que les leads de son agence. **La démo n'a aucun écran de consentement, d'opt-out ni d'archive des envois.** Nombre maximal de messages par client : non prévu au cahier (le PRD-D FR-148 fixe 2 par semaine, voir §9).

### 6.5 Exigences du cahier (CO:612-621)

Réponse du chatbot < 3 s ; calcul du score < 1 s ; dashboard équipe de 20 agents < 3 s ; envoi de 500 leads < 10 min sans doublon ni délai dépassé ; clustering hebdomadaire < 30 min ; classements < 5 min après la fin de journée.

---

## 7. Les 5 promesses et leur mesure

Mot pour mot (MF:21-31, tableau « Les 5 promesses de Prospera pour la microfinance ») :

| # | Promesse | Impact attendu |
|---|---|---|
| 1 | Réduire le PAR (Portefeuille à Risque) | Baisse du PAR > 30 jours de 15 à 25 % |
| 2 | Augmenter la productivité terrain | 30 à 50 % de clients supplémentaires par agent |
| 3 | Digitaliser 100 % des encaissements | Zéro manipulation d'espèces |
| 4 | Piloter en temps réel | Alertes IA et tableaux de bord 360° |
| 5 | Garantir la conformité BCEAO | Reporting réglementaire automatisé + export PDF |

Le récit PO les reprend sans le détail : « baisse du PAR, productivité terrain, encaissements 100 % numériques, pilotage en temps réel, conformité BCEAO » (BD:140). MF:19 ajoute : « Un Copilot IA accompagne chaque utilisateur ».

| Promesse | Indicateur de mesure | Source de calcul | État dans la démo |
|---|---|---|---|
| 1 PAR | PAR > 30 j (et 1 j, 7 j, 60 j, 90 j) en % de l'encours ; évolution mensuelle ; EL contre provisions ; coût du risque | cœur de l'IMF (échéances) | affiché (DG, ROC, RA, RSQ, GP) sur série simulée de 12,0 % (déc. 2025) à la valeur de mai 2026 ; la baisse de « 15 à 25 % » est relative (PAR 12 → ≈ 9-10), pas en points : à préciser |
| 2 Productivité terrain | clients actifs par agent ; visites par jour ; taux de visite ; couverture ; nouveaux clients par agent ; collecte par agent | visites GPS, portefeuille | affichés (RA, AT, équipe) ; aucune référence « avant Prospera » (valeur de départ) |
| 3 Encaissements numériques | part des encaissements par Mobile Money ou virement ; espèces manipulées ; écarts de caisse ; réconciliation MoMo | caisse, Mobile Money, cœur | dashboard Finances (réconciliation MoMo), écarts de caisse de l'audit ; la part numérique n'est affichée nulle part |
| 4 Pilotage temps réel | fraîcheur des données (délai entre l'événement et le dashboard) ; alertes émises/traitées ; taux d'usage des dashboards par rôle | Prospera | libellés « temps réel » sans mesure ; rafraîchissement 5 min cible (WEB:291) |
| 5 Conformité BCEAO | ratios réglementaires conformes / total ; score de conformité 0-100 ; rapports remis à l'heure ; export PDF < 10 s | conformité, comptabilité | statuts CONFORME / ATTENTION / NON_CONFORME par agence, rapport en retard 4 j (AN-010) |

Chiffrage commercial associé (MF:282-293) : PAR 80 M, fraude agents 50 M, productivité 60 M, conformité 15 M, recouvrement 40 M, direction 20 M = 265 M F par an. L'estimation `IA` donne 171 à 288 M (`IA:52-67`) sur une IMF de 800 M d'encours et 5 agences, hypothèses PAR initial 11 %, recouvrement 72 %. Ce sont des arguments de vente, pas des exigences.

**Découpage commercial (PRIX:19-110) pour mémoire.** Crédit (Dashboard & Pilotage, CRM, Crédit) ; Terrain & Collecte (Terrain, Relances, Caisse & Mobile Money) ; Risque & Conformité (Recouvrement, Finance & Compta, Conformité & Audit) ; Croissance & Opérations (Marketing, Épargne, Équipes, Produits). Le pilotage du présent extrait se partage entre les bundles Crédit (dashboards) et Croissance (équipes, marketing). Le mot « offre » de la source est à lire « solution » dans les livrables.

---

## 8. Exigences non fonctionnelles trouvées

| Domaine | Exigence | Source |
|---|---|---|
| Performance | chargement du dashboard (LCP) < 3 s en 4G ; API liste p95 < 500 ms ; export PDF BCEAO < 10 s ; synchronisation de 50 visites hors ligne < 30 s | WEB:1463-1467 |
| Performance (bundle) | chatbot < 3 s ; score lead < 1 s ; dashboard équipe 20 agents < 3 s ; campagne de 500 leads < 10 min ; classements < 5 min | CO:612-621 |
| Fraîcheur | rafraîchissement automatique toutes les 5 min ; synthèses à 06:00 ; classements en fin de journée | WEB:291, 318 ; CO:302 |
| Disponibilité | API de production 99,5 % ; terrain hors ligne fonctionnel sans API ; SLA 24/7 annoncé dans l'accompagnement | WEB:1482-1483 ; MF:340 |
| Sécurité | JWT court (15 min) avec refresh et liste noire ; HTTPS obligatoire ; filtrage par rôle et agence côté serveur ; pas de mot de passe en clair ; antivirus et validation MIME à l'upload ; journalisation de toute mutation (utilisateur, action, entité, charge, IP) ; chiffrement au repos et en transit | WEB:1384-1389, 1439-1441, 1470-1480 ; DPV3:925-940 |
| Données personnelles | droit à l'oubli sur les leads ; opt-in/opt-out ; historique des envois ; option d'hébergement en Afrique ; conformité RGPD et règles locales | CO:630-639 ; DPV3:925-940 |
| Hors ligne | IndexedDB (visites, collectes, photos) ; synchronisation en lot idempotente (`client_uuid`) ; les données hors ligne ne modifient pas les soldes avant validation | WEB:1431-1436 |
| Langue | français ; document produit général : français, anglais, langues locales | DPV3:925 |
| Appareils | Chrome, Firefox, Edge 120+, Safari iOS 16+ (tablettes terrain) ; « mobile-first » dans le document produit général | WEB:1487 ; DPV3 |
| Fiabilité des chiffres | « citer les chiffres avec source, date de calcul, périmètre » | WEB:1416 |
| Notifications | alerte de PAR d'agence : in-app + e-mail au DG ; relance d'échéance : WhatsApp, SMS ; validation MoMo : SMS au client ; validation du comité : e-mail client, GP, agent, RCC | WEB:1446-1453 |
| Taille | nombre d'agences, d'utilisateurs, de prêts actifs : inconnu, à fournir par l'IMF | BD:157-158 |

---

## 9. Écarts avec les modules partagés du PRD distributeur

Légende : **Couvert** (le PRD microfinance renvoie au noyau), **À ajouter** (propre à l'IMF), **Contradiction** (à arbitrer). Renvois PRD-D : §2.1 (L64-88), §3 (L126), FR-4 à FR-8 (L207-253), FR-13 à FR-16 (L308-361), §6.0 (L1950), M21 (L2486), M23 (L2915), M25 (L3065), M26 (L3202), M28 (L3354), M03 (L3539), annexe B (L4408).

### 9.1 Rôles, périmètres, matrice d'accès (FR-4 à FR-8, annexe B)

| Point | Statut | Détail |
|---|---|---|
| Table d'accès unique appliquée par le serveur (FR-5), périmètre serveur (FR-6), jamais de repli sur « tout » | Couvert | même règle que 1.6 ; la démo IMF n'applique rien (1.4) |
| Les 15 rôles du distributeur | À ajouter | aucun des 16 rôles IMF n'y figure sauf DG, DAF, COMPTABLE, MARKETING≈COMM, RECOUVREMENT≈REL. À créer : ROC, RA, GP, CC, AT, COLL, COM, RCC, RSQ, AUD, PAIE. Le tableau de vocabulaire de M21 pose seulement « superviseur → chef d'agence », « zone → agence » (PRD-D vocabulaire M21) |
| Niveaux de périmètre : tout, région, zone, portefeuille, entrepôt | À ajouter | pour l'IMF : réseau, agence, zone, portefeuille de clients, portefeuille de dossiers (CC). « Entrepôt » sans objet. La zone du distributeur devient l'agence ; la zone IMF est un polygone sous l'agence |
| `DIST_ADMIN` lit aucune donnée métier | Contradiction | à l'IMF le DG crée et gère les utilisateurs (`UtilisateursView.tsx:30`) : il faut trancher un administrateur sans lecture métier, ou donner le droit au DG (Q9) |
| Données privées (FR-8) : rémunération visible de l'agent et de la direction (DG, DC, DAF) seulement | Contradiction | le rôle PAIE existe et sert à suivre « commissions, masse salariale, primes » ; il faut lui donner le droit explicite `equipe:remuneration:consulter` ou le lui refuser |
| « Vue DG » réservée au DG et DC (FR-7) | À ajouter | `/equipe` rend la vue DG à tout rôle par défaut (`equipe/page.tsx:47-54`) : exactement la fuite que FR-7 interdit |
| Auditeur (lecture seule transverse, traçabilité) | À ajouter | pas d'équivalent au distributeur |
| Contrôleur de gestion | Contradiction | absent de l'IMF (le DAF porte le contrôle de gestion) : voir 9.4 |
| Matrice écran × rôle (annexe B) | À ajouter | table IMF rôles × écrans (1.3) à reprendre comme point de départ, comme la démo distributeur l'a été |

### 9.2 Équipes et performance, `equipe` M21 (FR-122 à FR-128)

| Point | Statut | Détail |
|---|---|---|
| Registre de KPI de poste par rôle, 4 à 5 KPI pondérés à 100, objectif fixé par le supérieur, score plafonné, statut | Couvert | l'IMF remplit le même registre (PRD-D M21 : « Les rôles propres à l'IMF… sont écrits par le PRD microfinance ») |
| KPI de poste IMF (RA, GP, CC, AT, COLL, COM, RCC, ROC) | À ajouter | départ : CO:400-411 (visites, taux de visite, collecte, PAR de portefeuille, nouveaux clients, conversion, qualité de saisie). Poids : la démo n'en donne aucun (`equipe-registry.ts:196`) |
| Seuils de statut | Contradiction | PRD-D : EXCELLENT ≥ 90, BON ≥ 75, À SURVEILLER ≥ 60, CRITIQUE < 60 ; démo IMF : BON ≥ 85, NORMAL ≥ 70, DEGRADE < 70 (ou recouvrement < 60 %). À unifier (Q5) |
| Statut à 5 niveaux (TOP à DEGRADE) et formule de performance globale « non reprises » | Couvert | le statut IMF à trois niveaux est un reste du même type |
| Plan de coaching enregistré, priorité de coaching à points (règle, pas IA) | Couvert | FR-125 ; le « coaching IA » de l'IMF devient une règle avec provenance, ou un vrai modèle déclaré (FR-16) |
| Performance gap avec projection de fin de mois et 4 niveaux (CO:422-441) | À ajouter | proche de l'atterrissage du distributeur (FR-85, partie 2) mais pas dans M21 |
| Benchmarking inter-agences (± 20 % d'encours, 5 KPI) | À ajouter | pas dans M21 |
| Gamification (défis, badges, streak, classements agences et agents) | À ajouter | absente de M21 ; la démo la porte (dashboard COM) et le cahier la demande (CO:282-292) |
| Objectifs par agence et par agent, fixés par RA/RCC avant le 5 du mois | Couvert (noyau) / À ajouter (types) | objet Objectif de M21 ; types d'objectifs IMF (visites, collecte, nouveaux clients, conversion, PAR max) à déclarer |
| Demande de dérogation (remise au distributeur, dérogation de crédit à l'IMF) | À ajouter | vocabulaire déjà prévu ; seuils de validation par niveau (CC, ROC, comité) à définir par le PRD crédit |
| Barème de commission : salarié sur l'encaissé, freelance sur le prix société | À ajouter | l'IMF a « agent indépendant, démarcheur commissionné » (vocabulaire M21) ; règle de base (décaissé, remboursé, PAR) à trancher |
| Fiche agent avec journal d'activité GPS | Couvert (par `terrain`) | à brancher à M21 |

### 9.3 Marketing et campagnes, `marketing` M23 (FR-142 à FR-149)

| Point | Statut | Détail |
|---|---|---|
| Objet Campagne, entonnoir (cibles, contactés, délivrés, ouverts, répondus, convertis), cible retenue/écartée avec motif, attribution | Couvert | vocabulaire IMF déjà donné : membre, campagne d'épargne, de crédit, de renouvellement ; segment d'exclusion = membre en retard |
| Envoi de masse par `notification` (WhatsApp, SMS), consentement, désabonnement | Couvert | FR-147 renvoie au PRD notification ; couvre le « STOP » du cahier CO:638 |
| Exclusion des membres en retard ou au crédit bloqué ; plafond de 2 messages commerciaux par semaine | Couvert / à confirmer | l'IMF doit valider le chiffre 2 (non cité au cahier) |
| Attribution commande ↔ campagne | À ajouter | à l'IMF : décaissement, ouverture de compte ou dépôt d'épargne attribué à la campagne |
| ROI unique de campagne (marge incrémentale − coût) ÷ coût (FR-143) | Contradiction | la démo IMF calcule revenu généré ÷ budget (§6.2). Le « revenu » d'une IMF est un produit d'intérêts étalé : définir la base (intérêts perçus, PNB attribuable) |
| Leads, pipeline `NOUVEAU/QUALIFIE/CONVERTI/DISQUALIFIE`, scoring à 5 facteurs | À ajouter | dans le distributeur c'est `conquete-objectifs` (prospects, entonnoir) ; pour l'IMF à rattacher à `marketing` ou à `reseau` (Q10) |
| Chatbot WhatsApp de qualification | Contradiction | PRD-D FR (règle `mkt-qualif-leads`) : « bouton bientôt, sans date » ; le récit PO met « chatbot WhatsApp » dans ce qui marche au jour 1 (BD:134). Décision à prendre (Q4) |
| Segmentation par clustering, recommandation de campagne, types Renouvellement, Réactivation épargne, Nouveau produit, Parrainage, Nurturing | À ajouter | la segmentation du distributeur est un critère enregistré ; pour l'IMF le « clustering IA » doit déclarer sa provenance (FR-16) |
| Combos de stock, promotions fournisseurs | Sans objet | |
| Zones blanches | Couvert | vocabulaire : village non couvert ; carte de couverture IA de la démo à rattacher |
| Présence digitale (Google Maps, Facebook, site), fidélisation (NPS, rétention, ambassadeurs), budget par poste, institutionnel | À ajouter | hors M23 tel que posé ; à classer dans le périmètre ou à écarter |

### 9.4 Contrôle de gestion, `controle-gestion` M25 (FR-150 à FR-156)

| Point | Statut | Détail |
|---|---|---|
| M25 « microfinance à confirmer » | À trancher | l'IMF n'a pas de rôle contrôleur de gestion ; le DAF « inclut le contrôle de gestion » (`types/index.ts:16`) et la démo DAF montre Budget, Rentabilité, Contrôle de gestion, projection IA (`DashboardDAF.tsx:442-501`) |
| Axes : agence, canal de collecte, produit financier ; postes encours, produit net bancaire, marge d'intérêt | À ajouter | vocabulaire M25 déjà proposé ; la démo n'a pas de budget saisi ni versionné |
| Budgets saisis et figés, écart calculé depuis les budgets, bande ±3 %, prévision glissante à 3 mois, rapport PDF au DG | Couvert si M25 retenu | le DAF remplace le contrôleur : « le DAF arbitre, le contrôleur contrôle » n'a plus de sens, à reformuler |
| Rentabilité par agence, coût par dossier, coût de collecte, coefficient d'exploitation | À ajouter | indicateurs IMF absents de M25 |

### 9.5 Automatisations, `automatisations` M26 (FR-157 à FR-162)

| Point | Statut | Détail |
|---|---|---|
| Règle = objet enregistré, 3 modes (AUTO, A_VALIDER, SUGGESTION), garde-fous, file d'arbitrage, exécutions réelles | Couvert | |
| Table de relance IMF (J-3 WhatsApp, J+1-3 WhatsApp + SMS, J+7 visite créée automatiquement, escalade superviseur et alerte ROC, bon payeur : rappel discret + offre de renouvellement, promesse non tenue : re-relance) | À ajouter | ce sont les règles initiales du module recouvrement IMF (MF:168-175) |
| « Visite terrain créée automatiquement » | À confirmer | création d'une mission = action réversible, sans argent : AUTO admissible ; une escalade qui engage la réputation = A_VALIDER |
| Blocage automatique du crédit | À ajouter | à l'IMF : refus d'un nouveau décaissement ; seul le déblocage est humain |
| Rappel d'échéance de remboursement, membre sans opération, plafond d'octroi | Couvert | vocabulaire M26 |

### 9.6 Tableau de bord, `dashboard` M28 (FR-165 à FR-171, FR-177)

| Point | Statut | Détail |
|---|---|---|
| Un cockpit par rôle, composition = données, « non installé » jamais 0, cockpit lu depuis les modules | Couvert | |
| 8 chiffres du DG | Contradiction | l'IMF en a 12 en 3 familles (portefeuille, activité, rentabilité) ; le vocabulaire M28 prévoit trésorerie, encours et PAR, épargne collectée, décaissements. À remplacer, seuils paramétrables |
| Variations calculées (période de comparaison affichée) | Couvert | les variations de la démo IMF sont en partie constantes (2.1) |
| Alerte = objet unique, cycle de vie, bouton « N alertes critiques » vrai | Couvert | corrige le bouton sans action du DG (2.1) |
| Décisions à trancher + journal | À ajouter | côté IMF : décisions DG (`EquipeDgView`), ROC (Approuver/Réduire/Garanties/Refuser), comité de crédit |
| Descente DG réseau → agence → agent → client → transaction | À ajouter | non prévue en M28 ; périmètre à définir (« secteur » du récit, Q2) |
| Rapport de direction PDF réel, envoi par `notification`, programmation hebdomadaire | Couvert | le rapport IA du DG de la démo est un texte pré-écrit |
| Rapport « IA » de la démo contre « règle et gabarit » du distributeur | Contradiction | PRD-D FR-169 interdit le mot « IA » tant qu'aucun modèle n'a rédigé ; l'IMF vend le Copilot et la synthèse IA (MF:19, 241-248) |
| Copilot | Contradiction | PRD-D : hors PRD, bouton « bientôt » ; IMF : promesse de vente centrale, Copilot par rôle (Q3) |
| Score de santé d'un point de vente (règle `dashboard`, FR-177) | À ajouter | équivalent IMF : score client 0-100, score de santé d'agence (`DashboardManager.tsx:104`) |

### 9.7 Support client, `support-client` M03

Hors PRD distributeur, sans exigence. À l'IMF aucun écran de support n'existe ; seuls traces : « Tickets incidents » et « Uptime système » dans le contrôle quotidien du ROC (`DashboardResponsableCredit.tsx` bloc « Contrôle quotidien » ; `lib/mockMicrofinance.ts:494`, priorités P1 à P4). À signaler au lot 4, sans exigence.

### 9.8 Les cinq écarts les plus lourds

1. Rôles : 11 rôles IMF à créer, périmètres agence/zone/portefeuille de clients et de dossiers, administrateur à trancher.
2. Seuils de statut des scores (85/70 contre 90/75/60) et absence de pondération dans l'IMF.
3. Chatbot WhatsApp et Copilot : « bientôt » chez le distributeur, promesse de jour 1 chez l'IMF.
4. ROI de campagne : revenu ÷ budget (IMF) contre marge incrémentale (distributeur) ; base de calcul à fixer.
5. Descente DG réseau → agence → agent → client → transaction et ses 12 chiffres, non prévue dans M28.

---

## 10. Écarts récit ↔ démo ↔ docs, questions bloquantes

### 10.1 Tableau des écarts

| # | Sujet | Récit PO | Démo | Docs | Conséquence |
|---|---|---|---|---|---|
| 1 | Nombre de rôles | ~10 (BD:128) | 16 codes, 11 comptes | 10 personas (MF:77), 15 profils (WEB:58) | liste cible à figer (Q1) |
| 2 | « Secteur » dans la descente DG | réseau → secteur → agent → client | secteur = activité économique (Commerce, Agriculture), descente réelle réseau → agence → agent → client → transaction | réseau → agences → zones → agents → clients → transactions (MF:150, WEB:303-310) | choisir entre agence, zone et secteur d'activité (Q2) |
| 3 | Droits et périmètres | chacun voit son périmètre | menu seulement ; aucun refus ; dashboards câblés sur une agence | filtrage JWT par rôle et agence | à construire côté serveur |
| 4 | Copilot IA | « Copilot IA » au jour 1 | tiroir, 5 questions par profil, texte seul, réponse simulée, pas de contexte de page, pas d'Auditeur | actions et sources citées, `POST /ia/copilot` LLM | périmètre du Copilot (Q3) |
| 5 | Alertes | « alertes » | 3 listes en lecture, bouton sans action, seuils figés | règles PAR +2 pts, collecte < 80 %, dossier > 30 j ; notification in-app + e-mail | cycle de vie et seuils à spécifier (Q8) |
| 6 | Objectifs par agence et agent | « objectifs et performance par agence et par agent » (BD:134) | affichage seul, aucune saisie | saisie par RA/RCC avant le 5 du mois, suggestion IA | écran de saisie à créer |
| 7 | Seuils de statut d'agent | non dit | BON 85 / NORMAL 70 / DEGRADE | non dit | unifier avec le distributeur (Q5) |
| 8 | Chatbot WhatsApp | au jour 1 | monitoring seul, chiffres constants | 5 questions, création de lead, scoring (CO:218-258) | conversation réelle à construire ; dépend de `notification` et des consentements (Q4) |
| 9 | Campagnes | « marketing » | 4 campagnes en lecture, aucun bouton qui agit | wizard 5 étapes, validation humaine | création, lancement, suivi à construire |
| 10 | Acquisition de clients | « acquisition de clients » | pipeline de leads en lecture | statuts, assignation, conversion en client | dépend du CRM clients et du cœur (qui fait foi pour les comptes) |
| 11 | Gamification | non dite | défis, badges, streak (COM) | classements et badges (CO:282-292) | à garder ou écarter (Q10) |
| 12 | Cohérence des chiffres | — | 905 emprunteurs ou 188 ou 1 200 selon l'écran ; PAR Bè Kpota 11,2 % ou 5,4 % | 800 M / 1 200 emprunteurs / 5 agences dans `IA` | une seule source de vérité (cœur de l'IMF) |
| 13 | Seuils réglementaires | taux d'usure 24 % par an (BD:149) | PAR : 10 % BCEAO, 8 % interne ; concentration 30 % ou 25 % | « seuil BCEAO » | tous paramétrables ; valeurs à faire valider par un juriste |
| 14 | Export | « export PDF » conformité | boutons d'export simulés (`ExportButton.tsx:22-29`) | PDF < 10 s | PDF réels |
| 15 | MFA et journal d'accès | non dit | MFA affiché, 4 lignes de journal | traçabilité de toute mutation | exigences à poser (Q9) |
| 16 | Cible pays et opérateurs | par pays et par opérateur, via PI-SPI (BD:152) | libellés Togo, Flooz et Mixx | — | pays et agences à fournir par l'IMF |
| 17 | Vocabulaire | — | « offre » dans les docs de prix | « solution » dans les livrables | corriger dans les présentations |

### 10.2 Questions bloquantes pour le PO

1. **Q1, rôles.** Quelle liste ferme pour « environ 10 rôles » ? Propositions : (a) les 10 personas de MF:127-144 (DG, DC, DEC, ROC, RA, GP, CC, AT, DAF, Auditeur), ou (b) les 16 codes du code. DC et DEC ont-ils un compte ou seulement une vue du DG ? Faut-il Communication, Risque, Paie, Collectrice, Commercial, Comptable/Relance comme rôles distincts ?
2. **Q2, descente du DG.** « Secteur » veut-il dire secteur d'activité (Commerce, Agriculture) ou un échelon géographique entre le réseau et l'agent (agence, zone) ? La démo descend réseau → agence → agent → client → transaction.
3. **Q3, Copilot.** Jour 1 : un vrai assistant par rôle (questions libres, chiffres cités, lecture seule) ou un bouton « bientôt » comme chez le distributeur ? Si oui, sur quel modèle et quelles données, y compris pour l'Auditeur ?
4. **Q4, chatbot WhatsApp.** Jour 1 réel (qualification en 5 questions, création de lead) ou « bientôt » ? Qui détient le numéro WhatsApp et l'accord (opt-in) des prospects ?
5. **Q5, score et statut.** Un seul barème d'équipe pour le distributeur et l'IMF (90/75/60) ou 85/70 ? Quels KPI et quels poids pour RA, GP, CC, AT, COLL, COM, RCC ?
6. **Q6, mot « IA ».** Garder « IA » pour des règles à seuil (alertes, rapports du DG), ou appliquer la provenance du PRD-D FR-16 (règle ou modèle, version, date) ?
7. **Q7, administration.** Qui crée quel rôle ? Le DG peut-il créer DAF, Auditeur, Communication ? L'administrateur lit-il des données métier ? Faut-il un administrateur dédié ?
8. **Q8, alertes.** Pour chaque alerte du §3.2 : destinataire, seuil de l'IMF (PAR, collecte, dossier bloqué 48 h ou 30 jours) et délai de traitement attendu.
9. **Q9, sécurité.** MFA obligatoire pour quels rôles ? Durée de session ? Journal d'accès complet consultable par qui ?
10. **Q10, périmètre marketing.** Garder présence digitale, fidélisation (NPS, ambassadeurs), gamification, budget marketing ? Le pipeline de leads relève-t-il du marketing ou du réseau commercial (RCC) ? Quelle base pour le ROI de campagne ?
11. **Q11, contrôle de gestion.** Reprend-on `controle-gestion` pour le DAF de l'IMF ou le DAF garde-t-il son tableau Budget et Rentabilité sans module M25 ?
12. **Q12, rémunération.** Le rôle PAIE calcule-t-il des commissions dans Prospera ? Sur quelle base (décaissé, remboursé, PAR) et pour quels agents (salariés, indépendants) ?
13. **Q13, volumétrie.** Nombre d'agences, d'utilisateurs, de prêts actifs : à fournir par l'IMF pour fixer les objectifs de performance et les seuils.
