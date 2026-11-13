# Réconciliation du PRD microfinance avec ses sources (2026-11-13)

Méthode : lecture de `prospera_modules_ia.md` (62 IA), `prospera_microfinance.md` (5 promesses, 10 personas), des cahiers terrain, risque et croissance, du rapport BCEAO d'exemple (HTML) et des écrans de la démo hors crédit ; recoupement par grep et lecture des FR du `prd.md`. Rien d'autre n'a été modifié. Les numéros de FR sont ceux du PRD actuel.

Verdict d'ensemble : le PRD est très complet. Aucune des 62 IA n'est absente. Les écarts réels sont peu nombreux et se concentrent sur : les classes du rapport BCEAO, les seuils de PAR, l'écran « Opérations bancaires » (dont le refinancement), l'épargne hors fiche, le Copilot par rôle, l'audit et le calendrier des états.

---

## 1. Les 62 IA de `prospera_modules_ia.md`

Légende : OK = exigence claire (entrées, sortie, destinataire, repli sans IA, provenance) ; VAGUE = couverte en partie ; ÉCARTÉE = décision du PO.

| M | IA (nom du document) | FR | État |
|---|---|---|---|
| 1 | Copilot IA par rôle | FR-237 | VAGUE : questions types pour 8 profils seulement (DG, RA, GP, AT, COM, RCC, COMM, DAF) ; CC, ROC, RSQ, CPT, REC absents ; AUD en `[ASSUMPTION]` ; ni « synthèse ou rapport à la demande » (cf. §4) |
| 1 | Alertes IA : priorités du jour | FR-238 | OK |
| 1 | Analyse comportement des agences | FR-238, FR-243 | OK |
| 1 | Prévision PAR | FR-181 | OK |
| 1 | Synthèse IA globale (rapport DG) | FR-236 | OK |
| 2 | Score IA dynamique 0-100 | FR-124 | OK |
| 2 | Classe BCEAO calculée | FR-125, FR-175 | VAGUE : FR-125 parle de « saine, à surveiller, en souffrance », FR-175 de tranches 6/12/24 mois, le rapport d'exemple de 5 classes (cf. B-1) |
| 2 | Probabilité de défaut en temps réel | FR-125 | OK |
| 2 | IA alerte client (signaux faibles) | FR-126 | OK |
| 2 | Carte couverture IA | FR-128, FR-208 | OK |
| 3 | Scoring IA dossier | FR-49 | OK |
| 3 | Décision suggérée (4 valeurs) | FR-49 | OK |
| 3 | Analyse Prospera : narrative | FR-95 | OK |
| 3 | Alertes actives (BCEAO, fraude, garanties) | FR-48, FR-98 | OK |
| 3 | CBI IA : vérification du comportement de crédit | FR-98, FR-44 | VAGUE : le sigle « CBI » et son « score » n'apparaissent nulle part ; FR-98 dit seulement « vérification du comportement de crédit (historique interne, BIC saisi, autres engagements) » sans sortie propre |
| 3 | Panel score dossier (décomposition) | FR-49 | OK |
| 4 | Score recouvrement IA | FR-227 | OK |
| 4 | Stratégie IA par agence | FR-228 | OK |
| 4 | BlocAnalyse IA (narrative sur la fiche mauvais payeur) | FR-228, FR-222 | VAGUE : l'analyse est livrée au ROC, rien ne dit qu'elle s'affiche à l'ouverture de la fiche du mauvais payeur (cahier M07) |
| 4 | IA Échanges : scripts de relance | FR-229 | OK |
| 4 | Copilot recouvrement | FR-229 | OK (mais « bientôt » sans IA commune, alors que FR-237 dit « réel dès le jour 1 » : cf. §4-C3) |
| 5 | Optimisation des tournées | FR-206, FR-142 | OK |
| 5 | Voice-to-CRM | FR-207 | OK |
| 5 | Alerte de proximité | FR-206 | OK |
| 5 | Rapport du soir | FR-207 | OK |
| 5 | Zone map IA | FR-208, FR-128 | OK |
| 6 | Déclenchement automatique | FR-226, FR-212 | OK |
| 6 | Priorisation IA | FR-226 | OK (formule de départ donnée) |
| 6 | Multi-canal IA | FR-226, FR-212 | OK |
| 6 | Score relance (probabilité par canal) | FR-226 | OK |
| 6 | Propositions de messages | FR-226 | OK |
| 7 | Validation IA MoMo (erreurs, doublons) | FR-147 | OK |
| 7 | Réconciliation IA | FR-147, FR-139 | OK |
| 7 | Anomalies de caisse | FR-148 | OK |
| 7 | Prévision cash 7 jours | FR-149, FR-254 | OK |
| 7 | Stratégie de transfert inter-agences | FR-149 | OK (lecture seule, exécution « bientôt ») |
| 8 | Alertes comptes dormants | FR-131 | OK |
| 8 | Recommandation de produits d'épargne | FR-131 | OK |
| 8 | Analyse du comportement d'épargne (fidélité) | FR-131 | OK |
| 9 | DAF Copilot IA | FR-237 | VAGUE : « synthèse financière intelligente » sans question type propre au DAF ; couvert seulement par la phrase « équivalents pour DAF » |
| 9 | Prévision cash 7 j (pic de sortie) | FR-254 | OK |
| 9 | Risque financier IA (EL, coût du risque, secteur moteur) | FR-181 | VAGUE : la perte attendue n'a pas de formule (EAD × PD × LGD dans la démo), ni source de la LGD (cf. I-7) |
| 9 | Analyse provisions IA (écart BCEAO) | FR-181, FR-176 | OK |
| 9 | IA ratios BCEAO | FR-187, FR-190 | OK (ratios par règle, « en attente » sans balance) |
| 9 | Contrôle de gestion IA : écarts vs budget alertés | FR-253 | VAGUE : `controle-gestion` non installé (F11) ; l'écart budget/réalisé s'affiche mais aucune alerte n'est prévue |
| 10 | Score conformité global | FR-190 | OK |
| 10 | Alertes réglementaires IA | FR-190 | OK |
| 10 | Génération du rapport BCEAO IA | FR-190, FR-185 | OK |
| 10 | Audit IA : anomalies | FR-194, FR-192 | OK |
| 10 | Traçabilité IA : corrélation | FR-194 | OK |
| 11 | IA performance gap | FR-241, FR-243 | OK |
| 11 | Benchmark des agences | FR-243, FR-238 | OK |
| 11 | Recommandations de coaching | FR-243 | OK |
| 11 | Prévision PAR par zone | FR-243, FR-181 | OK |
| 11 | Copilot équipe | FR-237 | OK (entité agent en contexte) |
| 12 | Chatbot IA leads WhatsApp | FR-247 | ÉCARTÉE (F4, « bientôt ») ; relances sortantes et boîte de réponses au jour 1 |
| 12 | Scoring prospects IA | FR-246, FR-248 | OK (5 facteurs et poids repris) |
| 12 | Segmentation IA | FR-248 | OK |
| 12 | Propositions de campagnes IA | FR-248, FR-245 | OK |
| 12 | Copilot marketing (conversion, recommandations) | FR-237 | VAGUE : COMM cité, aucune question type, aucune lecture de l'entonnoir/conversion nommée |
| 13 | IA recommandation produit | FR-112, FR-99 | OK |
| 13 | Simulation échéancier IA | FR-113, FR-109 | OK |

Total : 62 IA. **55 OK, 6 vagues, 1 écartée par le PO, 0 absente.**

IA présentes dans les cahiers mais pas dans la liste des 62 (donc non vérifiées par FR-8) :

| Cahier | IA | État |
|---|---|---|
| Risque M07 | Alerte de concentration des retards sur un agent ou une zone | ABSENTE (FR-177 mesure l'encours, pas les retards ; FR-179 « hausse anormale » ne vise que l'agence) |
| Terrain M11 | Prévision de l'encours d'épargne à 3 mois (Copilot DAF) | ABSENTE (FR-254 ne prévoit que la trésorerie à 7 jours) |
| Terrain M11 | Segmentation des épargnants (réguliers, occasionnels, dormants, potentiels) | ABSENTE (FR-248 segmente en général) |
| Démo risque DG | Scénarios de PAR « avec actions P1 » / « sans action » | ABSENTE (FR-181 : prévision avec intervalle, pas de scénario) |

Les autres IA des cahiers (détection d'inéligibilité, ajustement du taux au risque, fraude espèces, gamification, coaching) sont couvertes (FR-104, FR-101, FR-148, FR-242, FR-243).

---

## 2. Rapport BCEAO d'exemple (`BCEAO_SFD_PROSPERA_JUIN_2026_20260531.html`)

| Bloc du rapport | Exigence | État |
|---|---|---|
| Couverture : établissement, code SFD, agrément, pays, période, date de génération, instruction de référence, logiciel | FR-183 (gabarit paramétrable), FR-185 (références venant d'un tableau) | OK |
| Bandeau de 4 chiffres (encours, PAR 30+, provisions, emprunteurs et agences) | FR-185 « synthèse du portefeuille » | OK |
| §1 Synthèse du portefeuille | FR-185 | OK |
| §2 PAR 30+/60+/90+ avec seuil et statut CONFORME / NON CONFORME | FR-173 (PAR 1, 30, 90 seulement), FR-179 | MANQUE : pas de PAR 60 ; seuils de l'exemple 10/7/5 % absents ; autre jeu de seuils dans FR-179 et FR-231 (cf. B-2) |
| §3 Classification en 5 classes (Normal 1 %, Sous surveillance 10 %, Douteux, Compromises 80 %, Contentieux 100 %), instruction 001-01-2020 | FR-175, FR-176 (tranches SFD 40/80/100 %, déclassement dès un impayé, perte à 24 mois) | CONTRADICTION non tranchée : classes et taux différents (cf. B-1) |
| §4 Provisions par agence, statut CONFORME / ATTENTION / NON CONFORME, nombre de dossiers à risque | FR-185 « provisions par agence » ; FR-174 | VAGUE : la règle des trois statuts d'agence n'est pas écrite ; la liste des défauts d'affichage (taux = montant) est reprise en test |
| §5 Migrations de classe du mois (réf., client, agence, classe avant/après, J+, provision, motif) | FR-175 (migration datée), FR-179 (liste mensuelle), FR-185 | OK |
| §6 Annexe : détail de chaque prêt (réf., client, agence, produit, encours, J+, classe, provision, prochaine échéance) | FR-185 « détail des dossiers » | OK (colonnes non listées, à fixer dans l'addendum) |
| §7 Contrôle pré-envoi (complétude, couverture provisions/EL, migrations, exports en attente) | FR-185 (contrôle avant envoi) | OK ; « couverture EL » = FR-181 (écart de provision), à nommer |
| Signature, dépôt | FR-186 | OK |
| Export PDF + CSV | FR-188 | OK ; le HTML cité par `prospera_microfinance.md` et `prospera_modules_ia.md` (« PDF/HTML ») est abandonné sans décision écrite |
| Défauts à ne pas reproduire (période postérieure à la génération, 4 agences au lieu de 5, taux = montant, couverture à 100 % avec écart) | FR-183, FR-185 | OK |
| Autres états de la démo : PAR trimestriel consolidé, liquidité à court terme (hebdomadaire), LBC/FT mensuel, semestriel, plan de redressement, états annuels DIMF | FR-184 (périodicité mensuelle ou trimestrielle), FR-187, FR-193 | MANQUE : le calendrier « par état » n'énumère aucun état ; le trimestriel, le semestriel, le plan de redressement et le DIMF ne sont ni exigés ni écartés |

---

## 3. Modules de la démo hors crédit

| Module de la démo | Exigences | État |
|---|---|---|
| `/dashboard` (10 cockpits, vue 360°, secteurs/sous-secteurs, détail transactions et modifications) | FR-230 à FR-239 | COUVERT ; VAGUE sur l'onglet « Opérationnel » du DG (transactions suspectes avec score de fraude, modifications sensibles justifiées ou non, responsable d'enquête, épargnants) : aucune FR ne le décrit (cf. I-8) |
| `/terrain` (carte, missions, nouvelle visite, historique, hors ligne, proximité) | FR-200 à FR-208, FR-134, FR-136 | COUVERT ; l'« historique des visites » n'a pas d'écran nommé (mineur) |
| `/caisse` (guichet, validation MoMo, caisse DG, registre) | FR-143 à FR-149, FR-140 | COUVERT (guichet lu du cœur : décision du PO) |
| `/operations-bancaires` (prêts actifs, décaissements en attente avec heure limite banque, échéancier réseau, **refinancement**) | FR-64 à FR-70, FR-71 | MANQUE : écran jamais nommé, absent de l'annexe A (C8) alors qu'il est au menu de 5 rôles ; **refinancement : aucune exigence** (cf. I-1, I-2) |
| `/epargne`, `/epargne/[id]` (liste filtrable, fiche compte, ouverture, produits, vue DG, dormants, stats) | FR-106, FR-130, FR-131 | VAGUE : seule la fiche client lit l'épargne ; ni liste de comptes par produit/statut/agence/GP, ni vue DG consolidée, ni statistiques (cf. I-4) |
| `/produits` | FR-100 à FR-113 | COUVERT |
| `/clients`, `/clients/nouveau`, `/clients/[id]` | FR-114 à FR-134 | COUVERT |
| `/kyc` | FR-118 à FR-122 | COUVERT ; indicateur « KYC complet ≥ 95 % » absent (mineur) |
| `/groupes` | FR-129, FR-72 à FR-74 | COUVERT ; types TONTINE (bientôt) et SOLIDARITE seulement : la GARANTIE_CROISEE de la démo n'est ni reprise ni écartée (mineur) |
| `/zones`, `/agences` | FR-255, FR-208, FR-12 | COUVERT |
| `/equipe` | FR-240 à FR-243 | COUVERT ; badges et défis « bientôt » (FR-242) |
| `/marketing` | FR-245 à FR-249 | COUVERT ; contradiction sur le parrainage (cf. §4-C4) |
| `/risque` | FR-173 à FR-181 | VAGUE : entonnoir d'aging en 6 tranches, carte de chaleur PAR × agence, taux de défaut, taux de recouvrement, taux de perte, prêts restructurés du mois, taux de couverture du PAR (alerte < 80 %, critique < 60 %) : aucune FR (cf. I-6) |
| `/conformite` | FR-183 à FR-195 | COUVERT sauf B-1, B-2, I-5 |
| `/audit/*` (agences, crédit, caisse, BCEAO, anomalies, traçabilité) | FR-191 à FR-194, A.8 C8 | VAGUE : seules les vues crédit, caisse, séparation des tâches, anomalies et journal sont citées ; « audit agences » et ses règles (visite manquante, objectifs < 70 %, dossier sans GP, transactions non rapprochées > 7 j) et « audit BCEAO » ne sont ni écrits ni écartés (cf. I-8) |
| `/finance` | FR-253, FR-254 | COUVERT (prévision à 7 jours ; la démo montre aussi 30 jours : mineur) |
| `/comptabilite` (SYSCOHADA : synthèse de clôture, balance, journal, grand livre, résultat, bilan, rapprochements, suspens) | FR-252 (export au mieux) | VAGUE : écartée par le PO, mais aucune ligne ne liste les sous-onglets comme « bientôt » pour l'inventaire des boutons (cf. I-9) |
| `/utilisateurs` | FR-244, FR-5 | COUVERT |
| `/calendrier`, `/relances` | FR-45, FR-56, FR-212 | COUVERT |

Les 5 promesses de `prospera_microfinance.md` : toutes reprises mot pour mot au §1 et mesurées au §9 (PAR, productivité, encaissements numériques, temps réel, conformité). Le PRD tranche déjà la promesse 3 (« zéro espèces » = cible, pas règle). Reste : les gains par module de `prospera_modules_ia.md` (−3 h/jour, +35 % de visites, +40 % de conversion, ROI 171-288 M FCFA) ne sont ni indicateurs ni déclarés « illustratifs » (mineur). Tableaux de bord par rôle : les 10 personas du document sont couverts par les 16 rôles de FR-230 ; « Directeur Commercial » et « Directeur Exploitation Crédit » sont des vues du DG (écrit au §2.1).

---

## 4. Contradictions sans décision du PO

| # | Contradiction | Où | Décision existante |
|---|---|---|---|
| C1 | Trois jeux de classes pour le même objet : rapport d'exemple (5 classes, Normal à 1 %, art. 42), FR-175/176 (en souffrance par ancienneté, 40/80/100 %, rééchelonné), FR-125 (saine / à surveiller / en souffrance). « À surveiller » n'existe pas dans FR-175 puisque le déclassement a lieu dès un impayé | FR-125, FR-175, FR-176, FR-185 | D6 tranche le barème, pas la présentation du rapport ni la provision de 1 % sur les prêts sains |
| C2 | Seuils de PAR : agence 5 % alerte / 10 % critique (FR-179) contre 8 % orange / 10 % rouge (FR-231) ; réseau 12 % (FR-179) contre 10 % « seuil BCEAO » ; rapport d'exemple 30+ à 10 %, 60+ à 7 %, 90+ à 5 % ; démo risque 1/7/30/60/90 à 15/12/10/6/4 % | FR-173, FR-179, FR-231, FR-185 | E5 : calibrage sur les données de l'IMF, mais les valeurs de départ sont contradictoires |
| C3 | Copilot « réel dès le premier jour » (D-16, FR-237) contre « bientôt » sans consentement à l'IA commune (FR-237, FR-229) et lieu d'exécution du moteur de langage laissé en `[ASSUMPTION]` | FR-237, FR-229, FR-8 | F3 dit « réel jour 1 » ; le consentement le conditionne sans arbitrage |
| C4 | Parrainage : type de campagne actif (FR-245) et source de prospect (FR-246) alors que le périmètre F10 et FR-249 le mettent « bientôt » (« parrainage suivi ») | FR-245, FR-246, FR-249 | F10 |
| C5 | Dictée vocale : « bientôt » dans le PRD distributeur, exigée ici ; FR-207 dit aussi qu'elle est « bientôt » hors connexion ; avis juridique sur la voix en attente | FR-207, §12.3 | Correction du PO du 13/11 (sur tout le processus) |
| C6 | Export du rapport : PDF/HTML (documents sources) contre PDF/CSV (FR-188) | FR-188 | aucune |
| C7 | Gain annoncé « +35 % de visites par agent » (modules IA) contre « 30 à 50 % de clients supplémentaires par agent » (promesse 2) : deux mesures différentes | §1, §9 | aucune |

---

## 5. Corrections proposées

### Bloquantes (2) : une story ne peut pas être écrite sans elles

| # | Correction | Endroit |
|---|---|---|
| B-1 | Trancher (question au PO) la liste des classes du rapport et leur correspondance avec le barème SFD : soit le rapport affiche les tranches de FR-175 (≤ 6 mois, 6-12, 12-24, perte, rééchelonné), soit il garde 5 classes paramétrées. Dire si une provision sur prêts sains (1 % dans l'exemple) existe. Aligner les libellés de FR-125 (« à surveiller »). Dire que les références de l'exemple (« 001-01-2020 », « art. 42 ») sont des constantes à remplacer par le tableau de paramètres de FR-185 | FR-125, FR-175, FR-176, FR-185 |
| B-2 | Fixer UN jeu de seuils de PAR de départ (tranches 30/60/90 pour le rapport, statut CONFORME / ATTENTION / NON CONFORME des agences) et réécrire FR-179 et FR-231 pour qu'ils le citent. Ajouter le PAR 60 aux seuils paramétrables de FR-173 | FR-173, FR-179, FR-185, FR-231 |

### Importantes (9)

| # | Correction | Endroit |
|---|---|---|
| I-1 | Refinancement (nouveau prêt qui rembourse l'ancien, économie mensuelle, recommandation) : aucune exigence. Soit une FR sous le crédit (lien avec FR-76 nouveau cycle et FR-220 plan d'étalement), soit l'écarter par décision du PO | §5.10 ou §5.8 ; question au PO |
| I-2 | Nommer l'écran « Opérations bancaires » (prêts actifs, décaissements en attente avec heure limite de la banque, échéancier du réseau) : l'ajouter à A.1 (C8) et à FR-89/FR-90, avec la liste des rôles qui y accèdent (DG, ROC, COM, CPT, DAF) | FR-89, A.1 C8, Annexe B |
| I-3 | Copilot : étendre les questions types à CC, ROC, RSQ, CPT, REC (et trancher l'AUD) ; une question type pour la conversion marketing et pour la synthèse financière du DAF ; dire si « synthèse ou rapport à la demande » est exigé ; arbitrer D-16 et le consentement (C3) | FR-237, FR-229 |
| I-4 | Épargne : écrire l'écran liste des comptes (filtres produit, statut, agence, GP, indicateur de fidélité), la vue DG consolidée et les statistiques, tous lus du cœur ; ajouter la prévision d'encours à 3 mois et la segmentation des épargnants ou les écarter | FR-130, FR-131, FR-254 |
| I-5 | Calendrier réglementaire : lister les états (indicateurs mensuels ou trimestriels, PAR trimestriel, liquidité, LBC/FT, semestriel, plan de redressement, DIMF annuel) avec périodicité paramétrable, ou écarter ceux que l'IMF fait hors Prospera ; trancher le HTML | FR-183, FR-184, FR-188, §10.2 |
| I-6 | Risque : ajouter l'entonnoir d'aging (6 tranches), la carte de chaleur PAR × agence, le taux de recouvrement, le taux de défaut, le taux de perte, les prêts restructurés du mois et le taux de couverture du PAR (seuils 80 % / 60 % en défaut de démo) | FR-173 à FR-179, A.7 C8 |
| I-7 | Perte attendue : écrire la formule (encours × PD × LGD), l'origine de la LGD (garanties, dépôt de garantie, historique de recouvrement) et l'ajout des scénarios « avec / sans actions » | FR-181 |
| I-8 | Audit : écrire les vues « audit agences » et « audit BCEAO » et la liste des contrôles de la démo (visite manquante, objectif < 70 %, dossier sans GP, transaction non rapprochée > 7 j, Mobile Money en attente > 48 h, retrait > plafond) ; décrire l'onglet « Opérationnel » du DG (transactions suspectes avec score de fraude, modifications sensibles justifiées ou non, enquêteur) ; ajouter l'alerte de concentration des retards | FR-192, FR-194, FR-231, A.8 |
| I-9 | Comptabilité : lister les sous-onglets de la démo (balance, journal, grand livre, résultat, bilan, rapprochements, suspens) comme « bientôt » pour l'inventaire des boutons, et nommer le contrôle de gestion « bientôt » avec ses alertes d'écart | FR-252, FR-253, FR-91 |

### Mineures (9)

| # | Correction | Endroit |
|---|---|---|
| M-1 | CBI : dire que « CBI IA » = vérification du comportement de crédit de FR-98 et donner sa sortie (note, facteurs) ou retirer le sigle | FR-98 |
| M-2 | BlocAnalyse : afficher l'analyse à l'ouverture de la fiche du mauvais payeur | FR-222, FR-228 |
| M-3 | Parrainage : dire que le type de campagne et la source existent mais que le suivi est « bientôt » | FR-245, FR-246, FR-249 |
| M-4 | Relances : ajouter « bon payeur : rappel discret et offre de renouvellement » au tableau, nommer le « superviseur » (RA ou RCC) pour l'escalade | FR-212, FR-76 |
| M-5 | KPI « KYC complet » (≥ 95 % en défaut de démo) | FR-122, FR-193 |
| M-6 | Groupes : dire si la garantie croisée est reprise | FR-129 |
| M-7 | Écran « historique des visites » nommé ; position des agents sur la carte « pendant le service » à préciser (temps réel ou différé) | FR-202, FR-205 |
| M-8 | §9 : déclarer les gains par module (−3 h/jour, +35 % de visites, ROI en M FCFA) comme illustratifs, non engageants | §9, §1 |
| M-9 | Trésorerie : la démo montre 7 et 30 jours ; dire que 30 jours n'est pas livré | FR-254 |
