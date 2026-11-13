# Réconciliation PRD Microfinance ↔ démo : crédit, relances, recouvrement

Date : 2026-11-13. Portée : pages `credit/**` (23), `relances`, `portefeuille`, `emprunteurs`, composants `credit, cc, gp, ra, rcc, recouvrement, relances, dashboard`, `lib/dossier-enrichissement*`, `credit-*`, `relances-hub`, `fiche-client-microfinance`, `mockMicrofinance`. Le PRD relu : `prd.md` (FR-30 à FR-99, FR-209 à FR-229, annexes A.1, A.10, C). Les décisions du PO (`questions-po`, `.memlog.md`) sont tenues pour acquises : elles ne sont pas rouvertes ici.

Verdict d'ensemble : le PRD couvre le processus (statuts, gardes, comité, décaissement, blocage, étalement, perte, mauvais payeur) mieux que la démo. Les manques tiennent à ce que la démo MONTRE en lecture (contenus d'onglets, panneaux d'analyse, tableaux de bord, rapports) et que le PRD cite sans l'exiger, ou ne source pas.

Sigles : B = bloquante, I = importante, m = mineure.

---

## 1. Écran par écran

### 1.1 `/credit` (tableaux RA, ROC, RSQ ; `DashboardROC`, `CreditRaView`, `DashboardCreditRisque`, `OngletCreditDEC`)

| | Détail |
|---|---|
| Couvert | Écran conservé et branché (FR-89) ; composition par rôle (FR-230) ; PAR cumulatif et ventilation (FR-173, FR-174) ; concentration (FR-177) ; hausse anormale, migrations (FR-179) ; signaux faibles (FR-126) ; prévision PAR (FR-181) ; délais, SLA, taux d'approbation par tranche, motifs de refus (FR-83) |
| Manque | Panneau « Décisions crédit » du ROC : restructurés (étalements), contentieux, répartition par tranche de montant avec **ticket moyen** et **PAR par tranche**, évolution sur 6 mois, **motifs de restructuration** (liste de référence) : seuls le taux d'approbation par tranche et les motifs de refus sont exigés (FR-83) ; FR-220 n'a aucune liste de motifs d'étalement (E-06). « Top 10 clients à risque » et « distribution des scores » du portefeuille : aucune exigence (E-17). Compteur « workflow pré-décaissement » par statut : couvert par FR-77 en principe, à citer |
| Vague | « Contrôle quotidien (§7.5) » est cité dans FR-230 (ligne ROC) mais le §7.5 ne le définit pas : il ne mentionne que deux compteurs (tickets, disponibilité). La démo (`credit/reseau`, « Contrôle opérationnel — diagnostic IA ») en fait un diagnostic par agence : PAR, cash et prévision 24 h, décaissements prévus, analyse, actions recommandées (E-05) |
| Contradiction | FR-230 (ROC) dit « PAR 1, 7 et 30 jours » ; FR-173 et FR-215 disent PAR 1, 30, 90 ; la démo montre 1/7/30/60/90 (C-01) |

### 1.2 `/credit/pipeline` (`PipelineCreditKanban`, modales d'ajout)

| | Détail |
|---|---|
| Couvert | Kanban agence et ROC sur dossiers réels, glisser-déposer conforme à FR-78 (FR-89) ; un seul retour (FR-81) ; SLA dépassé à 48 h (FR-83, FR-87) ; étoiles et sentiment (FR-95) ; création de la demande (FR-30 à FR-36) remplace la modale « Nouvelle demande » ; « Ajouter un élément » (faux éléments par étape) disparaît : acté par FR-90 |
| Manque | Champs de carte non exigés : **priorité URGENT / HAUTE / NORMALE**, **attente en heures**, **résumé d'une ligne**, **avis du CC** affiché sur la carte, agent terrain ; recherche et filtre par agence ; bascule « file ROC seulement » (E-18) |
| Vague | FR-95 : les étoiles et le sentiment n'ont aucune règle de calcul ni seuil (démo : 3 étoiles si score ≥ 75, 2 si ≥ 55 ; sentiment tiré de la classe et des alertes). Sans IA, le PRD n'affiche ni étoile ni sentiment : la règle de la démo disparaît (C-06) |

### 1.3 `/credit/dossiers` (liste)

| | Détail |
|---|---|
| Couvert | Écran conservé et branché (FR-89), périmètre par serveur (FR-92) |
| Vague | Colonnes, recherche, filtres non précisés ; la liste doit-elle porter le sous-état de décaissement « en attente de décaissement » (FR-70) ? À écrire |

### 1.4 `/credit/dossiers/[id]` (fiche : bannière, frise, actions, 9 onglets)

| Onglet ou bloc | Couvert | Manque ou vague |
|---|---|---|
| Bannière « conditions finales » | FR-59 (tous les champs) | — |
| Frise et actions workflow | FR-77, FR-78, FR-79 | Les 18 actions de la démo (`WorkflowAction`) : `ANNULER_DOSSIER` = FR-38, `SIGNALER_DOCUMENTS` = FR-39, `UPLOADER_PIECE` = FR-40, `PAYER_ECHEANCE` = FR-71 ; `ENVOYER_RELANCE_EMAIL` sans équivalent (C-04) |
| **Client** | L'onglet est cité (FR-89). Éléments épars : FR-41 (cautions), FR-96 (volet transactions), FR-98 (alertes) | **Aucune exigence ne décrit son contenu** (E-01) : identité enrichie (contact d'urgence, « client depuis », personnes à charge, WhatsApp, numéro secondaire) ; **mouvements du compte sur 3 mois** (type dépôt / retrait / virement / frais / Mobile Money, solde après, drapeau normal / inhabituel / suspect) ; quatre indicateurs (nombre de mouvements, **ratio de dépôts**, total des dépôts, solde maximal) ; **localisation domicile et travail « vérifiée terrain »** avec distance à l'agence ; **prêts antérieurs** (référence, montant, durée réelle de remboursement, retards avec motif, anomalies, PAR atteint) ; **couverture des garanties en %** ; cautions avec revenus déclarés et solvabilité |
| Instruction CC | FR-50 (checklist 100 %), FR-45/46 (visites), FR-41 | Les 4 cases de la démo incluent **« visites des cautions effectuées »** et **« dossiers des cautions reçus »** (avec notes de réception par caution) ; la liste par défaut de FR-50 ne contient ni l'une ni l'autre (« cautions contactées » seulement) et FR-45 ne vise que le client (E-04) |
| Rapport CC | FR-47 (5C, indicateurs), FR-48 (9 alertes), FR-95, FR-96, FR-97, FR-98 | Radar des 5C, courbe d'évolution du score par étape avec seuils 75 / 55 / 35, détail des 8 dimensions dépliables avec sous-dimensions et justification, **rappels pour l'étape courante** : rien dans le PRD (E-12, C-03). Voir aussi E-09 (règles d'alertes) |
| Rapport ROC | FR-53 (contenu), FR-97 (benchmark secteur, échantillon faible) | **Perte attendue** (EAD, perte attendue, provision réglementaire et son taux) absente au niveau du dossier (E-02) ; **suggestion de décision avec montant, durée, taux recommandés et justification** absente (E-03) ; synthèse exécutive : FR-53 dit « synthèse », sans contenu |
| Score | FR-49, FR-124 (décomposition 40/30/20/10, historique conservé) | Le « Score CBI » et l'« ajustement Prospera IA −10 / +10 » de la démo n'existent plus (décision C11 : acquise) ; **l'affichage de l'historique par étape** n'est pas exigé |
| Comité | FR-56 à FR-63 (quorum, niveaux, conditions figées, échéancier, contrat PDF) | — (la démo n'affiche qu'un texte) |
| Échéancier | FR-54, FR-61 (« visible après le comité ») | — |
| Recouvrement (GP) | FR-71, FR-213, FR-209 | « Relance e-mail » : C-04 |
| Visibilité des onglets par rôle (`sections_visibles` : pièces, cautionnaires, visites, historique des statuts) | FR-92 (périmètre de données) | La visibilité **par onglet et par rôle** n'est écrite nulle part : à ajouter à l'annexe B ou à FR-92 (E-19) |

### 1.5 `/credit/analyse` (espace d'analyse CC / ROC, « CBI v5 »)

| | Détail |
|---|---|
| Couvert | Liste + rapport conservés (FR-89) ; décision réelle à la place de l'alerte « Décision enregistrée » (FR-51, FR-54, FR-91) ; bandeau de statistiques calculé (FR-83) ; export réel ou « bientôt » (FR-91) |
| Manque | Filtre par **classe BCEAO** (5 valeurs) et par étape ; lien « Fiche processus » : les filtres ne sont pas exigés ; surtout, **l'échelle de classes n'est pas définie** (E-07) |

### 1.6 `/credit/cycle`

| | Détail |
|---|---|
| Couvert | KPI calculés (FR-83, FR-89), prochain comité avec date, nombre, montant (FR-56), renouvellement (FR-76), historique par étape avec durée (FR-80, FR-83) |
| Manque | **Synthèse IA du cycle** et **« prochaine action IA » par dossier** (ex. « Compléter la photo KYC puis lancer le décaissement ») : absentes (E-13) ; **dossier bloqué avec motif de blocage** (KYC incomplet) : la garde FR-66 existe mais l'affichage du motif sur la vue cycle n'est pas exigé |

### 1.7 `/credit/reseau` (ROC : « Agences & opérations »)

| | Détail |
|---|---|
| Couvert | Écran conservé (FR-89) ; heatmap PAR (FR-174) ; suggestion de virements entre agences (FR-149) ; équipes (FR-241) |
| Manque | « Compréhension IA — opérations réseau », « Points d'attention IA », « Actions ROC prioritaires », « Activité opérationnelle du jour », « Contrôle opérationnel — diagnostic IA » par agence (E-05) : **aucune exigence propre à l'écran** ; la fiche d'agence dépliable (PAR, cash et prévision 24 h, décaissements prévus, analyse IA, actions recommandées) non plus |

### 1.8 Fiche client crédit (`FicheClientMicrofinance`, `/emprunteurs/[id]`, `/credit/recouvrement/clients/[id]`)

| | Détail |
|---|---|
| Couvert | PD et classe estimée (FR-125) ; score et facteurs avec poids (FR-124) ; signaux faibles (FR-126) ; analyse d'activité (FR-96, partie 3a) ; échéancier, cautions, garanties, clôture libérant les garanties (FR-75) |
| Manque | **LGD, perte attendue par client, provision (% et FCFA), classe précédente et migration du mois, DTI, ratio encours/revenu** : seuls PD et classe estimée sont exigés (E-02) ; bloc « recommandation DEC » (délai, prochaine échéance, comité requis) : le rôle DEC n'existe plus (vue du DG), l'information « comité requis » reste utile : à rattacher à FR-57 (E-20) |

### 1.9 `/portefeuille`, `/emprunteurs` (vue du GP)

| | Détail |
|---|---|
| Couvert | FR-71, FR-230 (ligne GP : mon portefeuille, vieillissement, promesses, relances) |
| Manque | Liste des clients du GP en **grille et en tableau**, recherche, pagination, onglet « tous / mauvais payeurs », **carte des clients du GP** avec filtre « en retard » et raccourci « Ouvrir relances » : écrans non listés dans FR-89 ni dans l'annexe A.10 C8 (E-14) |

### 1.10 `/relances` (4 onglets : Relances, Workflows, Promesses, Preuves)

Le PRD renvoie au PRD-D (FR-113 à FR-121) « tel quel » ; le PRD-D couvre les huit chiffres, l'échelle et les promesses, pas les éléments ci-dessous.

| | Détail |
|---|---|
| Couvert | Relance qui part vraiment, canal, moment, message modifiable (FR-212, FR-226) ; promesses, statuts, fiabilité (FR-213) ; calendrier J-3 à J+90 (FR-212) ; boîte des réponses (FR-247) |
| Manque | **Campagnes de relance** (nom, cible, envoyés, taux de réponse, statut active / terminée / brouillon ; ex. « Promesses Bè Kpota ») (E-08) ; **performance par canal** et **évolution sur 7 jours** (les taux constants de la démo sont écartés par FR-226, mais rien n'exige le calcul réel) ; KPI « échecs d'envoi » ; onglet **Preuves** (SMS, WhatsApp, appel, visite, reçu Mobile Money, fichier ou référence, valide, « vérifié IA ») : FR-217 n'exige qu'une pièce jointe par action (E-10) ; onglet **Workflows** (NOUVEAU, RELANCE_1, RELANCE_2, ESCALADE, CONTENTIEUX, CLOTURE) : aucune table de correspondance avec les statuts de FR-214 (C-07) |
| Vague | « Score de tenue IA » d'une promesse (probabilité de la tenir) : FR-213 ne parle que de statut et de fiabilité passée (E-16) |

### 1.11 `/credit/recouvrement` (vue du ROC) et sous-écrans

| | Détail |
|---|---|
| Couvert | Réseau trié par PAR avec descente (FR-215) ; agents de recouvrement, statuts, objectifs (FR-215) ; stratégie par agence, affectation des REC (FR-216, FR-228) ; plan stratégique avec gain attendu en FCFA (FR-228) ; fiche mauvais payeur avec rang réseau, causes, historique des retards (FR-222) ; score de recouvrement, facteurs, poids, verdict, récupérable estimé (FR-227) ; échanges de remboursement avec promesse honorée ou non (FR-217, FR-213) ; blocage et déblocage (FR-218) |
| Manque | Écran **« Dossiers bloqués > 48 h »** (liste, « bloqué depuis », raison du blocage, pièces manquantes, historique d'étapes, **analyse IA du blocage**, **actions ROC recommandées**, lien vers l'espace d'analyse) : FR-218 le renomme « demandes en attente depuis plus de 48 h » et le renvoie à FR-83, mais **aucune exigence ne décrit l'écran** et FR-89 ne le conserve pas (E-11) ; statut d'**agence** (CRITIQUE / TENSION / OK / EXCELLENT) : FR-215 ne définit que le statut d'agent (E-21) ; KPI « clients non visités / visites du jour sur prévues » : terrain (FR-200) sans lien explicite avec la vue |
| Vague | Statuts d'agent : la démo en a trois sources différentes (CRITIQUE / DEGRADE / VIGILANCE ; BON / NORMAL / DEGRADE) ; le PRD retient BON / VIGILANCE / CRITIQUE (FR-215) : correct, à noter pour les tests |

### 1.12 Calendriers (`CalendrierCcBlock`, `CalendrierRecouvrementBlock`, `AgentCalendrierRcc`)

| | Détail |
|---|---|
| Couvert | « Planifier » branché (FR-45) ; calendrier de risque du GP issu du volet saison (FR-96) |
| Manque | Calendrier du CC : types d'événement (RDV, échéance, dossier, relance, comité, bureau), priorité critique / haute / normale, vues jour et semaine, filtre par type, **synthèse IA de la journée** : seul « agenda du CC » est dit (E-15) |

---

## 2. Capacités d'IA de la démo, absentes ou floues dans le PRD

Présentes et bien écrites : score et décision suggérée (FR-49) ; analyse narrative, étoiles, sentiment (FR-95) ; analyse étendue en six volets (FR-96) ; saturation du secteur (FR-97) ; alertes de fraude et de conformité (FR-98) ; produit et conditions optimales à la simulation (FR-99) ; déclenchement, priorité, canal, moment, message des relances (FR-226) ; score de recouvrement (FR-227) ; stratégie par agence et analyse du comportement de retard (FR-228) ; scripts et Copilot recouvrement (FR-229) ; signaux faibles (FR-126) ; prévision du PAR et perte attendue du portefeuille (FR-181).

Absentes ou floues :

| # | Capacité de la démo | État dans le PRD | Gravité |
|---|---|---|---|
| IA-1 | **Perte attendue par dossier et par client** (EAD, PD, LGD, provision) dans le rapport ROC et la fiche | FR-181 : portefeuille seulement ; FR-125 : PD et classe, ni LGD ni perte | I (E-02) |
| IA-2 | **Conditions recommandées au ROC** : montant, durée, taux, justification (« Suggestion décision ») | FR-49 : décision en 4 valeurs ; FR-99 : conditions optimales à la simulation seulement ; FR-53 : la proposition du ROC reprend celle du CC | I (E-03) |
| IA-3 | **Cohésion du groupe** (score /100) et risque de **contagion** (membres en retard de cotisation) | rien (FR-72 à FR-74, FR-224 : aucun score de groupe) | I (E-22) |
| IA-4 | « **Prochaine action IA** » par dossier et **synthèse IA** du cycle | rien | m (E-13) |
| IA-5 | **Analyse IA du blocage** d'une demande et **actions ROC recommandées** | rien | I (E-11) |
| IA-6 | **Vérification IA des preuves** de relance (reçu Mobile Money, capture) | FR-147 aide le CPT à rapprocher des paiements ; pas les preuves de relance | m (E-10) |
| IA-7 | **Probabilité de tenir une promesse** | FR-213 : statuts et fiabilité passée seulement | m (E-16) |
| IA-8 | **Synthèse IA du recouvrement** (réseau) et diagnostic IA par agent | FR-228 : stratégie et comportement ; FR-243 : coaching ; pas de synthèse d'ensemble ni de diagnostic par agent dans la vue du ROC | m |
| IA-9 | **Rapport IA par rôle** (CC, GP, ROC, RA : synthèse, chiffres clés, points forts et d'attention, recommandations, prévisions à 30 jours, comparaison au mois précédent) | FR-236 : rapport du DG seulement | m (E-23) |
| IA-10 | **Synthèse IA des opérations réseau** et points d'attention du ROC (`credit/reseau`) | rien (voir E-05) | I |
| IA-11 | Indicateur de **confiance (%)** sur les badges IA | FR-8 : provenance (règle ou modèle, version, date) sans confiance ; FR-147 et FR-243 en portent une | m |
| IA-12 | Analyse d'activité du client (contexte de marché, marge, points clés, confiance) | Partie 3a (FR-96 volet) : à vérifier par le relecteur de la partie 3a | m |

Écartés par le PRD, à confirmer comme décisions et non comme oublis : « économie IA : 420 000 FCFA » (retirée tant qu'elle n'est pas mesurée, PRD-D), taux de réponse constants par canal (FR-226), nom de modèle « XGBoost » et « Prospera AI v2.4 » (le mot « IA » est réservé à un modèle, F6).

---

## 3. Contradictions PRD ↔ démo (ou PRD ↔ PRD) sans décision

| # | Contradiction | Décision du PO ? | Gravité |
|---|---|---|---|
| C-01 | **PAR** : FR-230 (ROC) « PAR 1, 7 et 30 jours » ; FR-173 et FR-215 « 1, 30, 90 » ; démo « 1 / 7 / 30 / 60 / 90 » | Non (D5 fixe le cumul, pas les seuils) | I |
| C-02 | **Classes** : démo à 5 classes au niveau du dossier à l'octroi (PERFORMANT, SOUS_SURVEILLANCE, DOUTEUX, COMPROMIS, PERTE, seuils 75 / 55 / 35 sur le score) ; PRD : FR-49 « classe de risque » sans valeurs ; FR-125 « saine, à surveiller, en souffrance » ; FR-175 classes par ancienneté d'impayé ; 5.15 annonce « une échelle de classes » sans la donner | Non (D6 vise le classement réglementaire des prêts, pas la classe d'un dossier non décaissé) | B |
| C-03 | **5C** : la démo les calcule à partir de 8 dimensions (35 / 15 / 25 / 10 / 15) ; le PRD les fait renseigner par le CC (FR-47) | Oui (C11) : acquis ; reste à dire si le **radar** et l'évolution du score par étape sont conservés | m |
| C-04 | **Relance par e-mail** (bouton du GP, champ e-mail du client) ; FR-87 et C16 : e-mail pour le personnel, SMS et WhatsApp pour le client ; FR-212 : canaux WhatsApp, SMS, appel, visite | Non | m |
| C-05 | **ROC à 5 boutons** (valider, valider réduit, valider avec réserves, rejeter, renvoyer au CC) ; PRD : 3 choix (FR-54, FR-55) | Oui (récit du PO) : acquis ; « avec réserves » = conditions du ROC (FR-54) | — |
| C-06 | **Étoiles et sentiment** dérivés d'une règle dans la démo ; absents sans IA dans le PRD (FR-95) | Non ; cohérent avec « marche sans elle » mais la démo les montre toujours | m |
| C-07 | **Workflow des relances** (6 étapes) et **statuts de recouvrement** (FR-214, 6 statuts) : deux vocabulaires ; aucune correspondance écrite | Non | I |
| C-08 | **« Contrôle quotidien (§7.5) »** : renvoi de FR-230 vers une section qui ne le définit pas | — (incohérence interne) | I |
| C-09 | **Cautions** : démo 2 pour tout montant, PRD 2 au-dessus de 300 000 | Oui (C7) : acquis | — |
| C-10 | **Avis CC** : démo 2 ou 4 valeurs, 5 pour l'IA ; PRD 2 et 4 | Oui (C3, FR-49) : acquis | — |

---

## 4. Corrections proposées

### Bloquantes (2)

| # | Où dans le PRD | Correction |
|---|---|---|
| E-07 / C-02 | FR-49, FR-125, 5.15 (ligne « deux échelles de classes »), FR-175 | **Définir l'échelle de classes du dossier à l'octroi** : noms, bornes du score (défauts de la démo 75 / 55 / 35, paramétrables), sort de chaque classe (information seulement, aucun refus automatique), distinction écrite avec les classes réglementaires de FR-175 (qui s'appliquent après décaissement, à l'ancienneté d'impayé). Dire si l'étiquette « classe BCEAO » est conservée à l'octroi (une classe BCEAO ne s'attribue qu'à un prêt décaissé : sinon renommer en « classe de risque »). Le filtre de `/credit/analyse` et le rapport CC et ROC en dépendent |
| E-01 | Nouvelle exigence en 5.4 (après FR-48) ; Annexe C (objets) ; A.1 C3 | **Écrire le contenu de l'onglet « Client » du dossier** : identité et contacts, mouvements du compte sur la période (paramètre ; défaut 3 mois) avec type et drapeau, quatre indicateurs calculés (mouvements, ratio de dépôts, total des dépôts, solde maximal), localisation domicile et travail avec statut « vérifié terrain » (issu d'une visite valide, FR-46) et distance à l'agence, prêts antérieurs (référence, montant, durée réelle, retards et motifs, anomalies), couverture des garanties en %. **Sourcer les mouvements** : l'annexe C porte le mouvement d'épargne mais pas les flux **Mobile Money** du client que la démo mêle aux dépôts (type MOMO) et que FR-227 utilise (« flux Mobile Money 10 ») ; décider : lus du cœur, déclarés par le client avec pièce, ou « non évalué » |

### Importantes (13)

| # | Où | Correction |
|---|---|---|
| E-02 | FR-53, FR-124/125, FR-181 | Exiger la **perte attendue par dossier et par client** (EAD, PD, LGD, perte attendue, provision au barème de FR-176 ; « estimation », jamais « comptabilisé ») dans le rapport du ROC et la fiche ; la LGD vient de la valeur des garanties ; sans IA : « non installé » |
| E-03 | FR-49, FR-53 | Faire proposer par l'IA au ROC un **montant, une durée et un taux recommandés avec justification**, bornés par le produit, le plafond d'usure (FR-36) et le taux d'effort ; écart du ROC = motif (comme FR-49) ; sans IA : la proposition du CC |
| E-04 | FR-50, FR-45, FR-41 | Ajouter à la checklist par défaut **« cautions visitées »** (ou dire que la visite des cautions est hors périmètre) et **« dossier de chaque caution reçu »** (avec date, auteur, note), et faire du refus d'avis favorable une conséquence testable, comme dans la démo |
| E-05 / C-08 | FR-230 (ROC), §7.5, nouvelle exigence en 7.3 | Définir le **contrôle quotidien du ROC** (diagnostic par agence : PAR, cash et prévision à 24 h lus du cœur, décaissements prévus, alertes, tickets, disponibilité, actions recommandées) et l'écran `credit/reseau` : liste des blocs conservés, source de chaque chiffre, IA avec provenance, « non installé » sinon |
| E-06 | FR-83, FR-220 | Ajouter : liste de référence des **motifs d'étalement**, **ticket moyen** et **PAR par tranche de montant**, **évolution sur 6 mois**, compteurs « restructurés » et « contentieux » du panneau Décisions du ROC |
| E-08 | 7.2 (après FR-212) | Écrire les **campagnes de relance** : cible (filtre de dossiers), canal, statut (brouillon, active, terminée), nombre de messages, taux de réponse calculé ; validation par le GP des paliers « à valider » ; ou les déclarer « bientôt » |
| E-09 | FR-48, FR-98 | Donner la **définition chiffrée** des neuf règles (démo : dépôt suspect = plus de 15 % du montant demandé 24 à 72 h avant le rendez-vous ; « compte de transit », « dépôt inhabituel » non définis) ; sinon FR-48 n'est pas testable |
| E-11 | FR-89, FR-218, FR-83, A.1 C8 | Écrire l'écran **« demandes en attente depuis plus de 48 h »** : liste, ancienneté, étape, raison (pièce manquante, avis attendu, comité absent, KYC), actions proposées au ROC, lien vers l'analyse ; l'ajouter à la liste des écrans conservés (FR-89) |
| E-10 / C-07 | FR-217, FR-214, 7.2 | Écrire l'onglet **Preuves** (type, date, fichier ou référence, valide, vérifiée par un humain ; vérification IA facultative avec provenance) et une **table de correspondance** Workflows de la démo → statuts de FR-214 (NOUVEAU = EN_RETARD ; RELANCE_1 et 2 = paliers de FR-212 ; ESCALADE = EN_RECOUVREMENT ; CONTENTIEUX = FR-219 ; CLOTURE = REGULARISE) |
| E-14 | FR-89, A.10 C8, 7.3 (ligne GP) | Ajouter la **vue du portefeuille du GP** (grille, tableau, recherche, onglet mauvais payeurs, carte avec consentement de géolocalisation, FR-132) et `/emprunteurs/[id]` à la liste des écrans branchés |
| E-19 | FR-92, Annexe B | Ajouter la matrice **onglet × rôle** de la fiche dossier |
| E-22 | FR-72 à FR-74, FR-126 | Ajouter la **cohésion du groupe** et l'alerte de **contagion** (membres en retard de cotisation ou d'épargne) comme capacité IA proposée au CC et au ROC, avec provenance ; ou la déclarer « bientôt » |
| C-01 | FR-230 (ROC) | Aligner sur FR-173 : « PAR 1, 30 et 90 jours » ; ajouter 7 et 60 comme **paramètres de seuils** si le PO veut les voir (FR-173 permet d'en ajouter) |

### Mineures (10)

| # | Où | Correction |
|---|---|---|
| E-12 / C-03 | FR-47, FR-49 | Dire si le radar des 5C, la courbe d'évolution du score par étape (avec seuils de classe) et le détail dépliable du score sont conservés ; sinon les retirer de l'écran |
| E-13 | 5.14, 5.11 | « Prochaine action » par dossier : texte de règle (étape, pièce manquante, délai) toujours ; formulation IA si disponible ; synthèse du cycle |
| E-15 | FR-45 | Contenu du calendrier du CC (types, priorité, vues, filtre) et sa synthèse IA du jour avec provenance |
| E-16 | FR-213, FR-227 | « Probabilité de tenir la promesse » : calcul explicable (fiabilité passée du client) ou retirée |
| E-17 | 7.3, FR-174 | « Top 10 clients à risque » et « distribution des scores du portefeuille » : exiger ou retirer |
| E-18 | FR-89, FR-95 | Champs de carte du pipeline (priorité, attente en heures, résumé d'une ligne, avis du CC) et filtres |
| E-20 | FR-57 | Afficher « comité requis » (niveau selon le montant) sur la fiche et la carte ; le rôle DEC n'existe plus |
| E-21 | FR-215 | Statut d'agence (seuils paramétrables) en plus du statut d'agent |
| E-23 | FR-236 | Rapport IA par rôle (CC, GP, ROC, RA) sur le même gabarit que celui du DG |
| C-04, C-06 | FR-87, FR-212, FR-95 | Trancher : relance par e-mail au client (oui ou non, avec consentement) ; étoiles et sentiment par règle quand l'IA est absente |

### Décompte

Bloquantes : **2** (E-01, E-07). Importantes : **13** (E-02, E-03, E-04, E-05, E-06, E-08, E-09, E-10, E-11, E-14, E-19, E-22, C-01 ; C-07 et C-08 comptés avec E-10 et E-05). Mineures : **10**. Total : **25** écarts (contradictions comprises).

Les 5 manques les plus importants : (1) l'échelle de classes du dossier à l'octroi n'est pas définie ; (2) le contenu de l'onglet « Client » et la source des flux Mobile Money ; (3) la perte attendue par dossier dans le rapport du ROC ; (4) les conditions (montant, durée, taux) recommandées au ROC par l'IA ; (5) le contrôle quotidien du ROC et l'écran réseau, cités sans être définis. Viennent ensuite l'écran « demandes en attente depuis 48 h », les preuves et campagnes de relance, la contradiction sur les seuils de PAR, et la visite des cautions dans la checklist.
