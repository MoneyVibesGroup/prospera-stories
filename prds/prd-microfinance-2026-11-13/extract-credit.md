# Extrait crédit — PRD Prospera Microfinance (2026-11-13)

Périmètre : crédit, de la demande à la clôture (hors recouvrement/relances). Récit = `brain-dump-po-2026-11-13.md` §4. Chemins front relatifs à `C:/Users/thier/Documents/prospera-font-end/prospera-web/src/`.

Plan : 1 écrans, 2 rôles, 3 statuts, 4 par phase, 5 produits, 6 calculs, 7 jonctions, 8 écarts, 9 questions. Annexe 4A en fin de fichier (grille 5C, IA, Kanban en détail).

---
## 1. Inventaire des écrans crédit

Racine : `src/` = `C:/Users/thier/Documents/prospera-font-end/prospera-web/src/`. Dossier `credit/` = 23 fichiers `page.tsx` ; 13 dans le périmètre (les `recouvrement*` et `mauvais-payeurs` vont à l'autre extrait). Les variantes `-with-api` sont des jumelles branchées sur le backend actuel : même écran, non décrites.

| # | Chemin | Rôles (menu `src/components/layout/Sidebar.tsx:42-72`) | Ce qu'on voit | Ce qu'on fait : réel ou décoratif |
|---|---|---|---|---|
| 1 | `/credit` | RA, ROC, Risque | RA : `CreditRaView` (agence, PAR, mauvais payeurs) ; ROC/Risque : `DashboardROC` | Navigation seulement. Chiffres constants |
| 2 | `/credit/pipeline` (+ `-with-api`) | CC, RA (4 colonnes), ROC, Risque (9 colonnes) | Kanban : carte = client, référence, montant, score, étoiles, sentiment, résumé, attente en h, agence | Glisser-déposer agence : RÉEL local (sessionStorage) avec garde-fous ; ROC : visuel sans règle. « Nouveau dossier » (min 50 000) et « Ajouter un élément » : réels locaux. Valider/Rejeter ROC : local en mémoire après alerte. Rien de persisté côté serveur |
| 3 | `/credit/dossiers` (+ `-with-api`) | CC, ROC, Risque | Liste (référence, client, montant, statut) | Recherche réelle ; clic ouvre la fiche |
| 4 | `/credit/dossiers/[id]` (+ `-with-api/[id]`) | CC, ROC, Risque ; GP via dossiers EN_GESTION | Bannière conditions finales, frise 5 étapes, actions workflow, onglets Workflow / Client / Instruction CC / Rapport CC / Rapport ROC / Score CBI / Comité / Échéancier / Recouvrement (`src/components/credit/DossierCreditFicheView.tsx:258-269`) | Avis CC, Décision ROC, Comité : DÉCORATIFS en démo (callbacks vides, `:310`). Onglets réels. Encaisser / promesse / relance : affichent « enregistré » sans rien écrire hors API |
| 5 | `/credit/analyse` | CC, ROC | Liste (filtre étape, classe BCEAO, recherche) + rapport CBI v5 : radar 5C, courbe de score, analyse IA, alertes, 8 dimensions, rappels, boutons de décision | Filtres réels. Décision DÉCORATIVE (alerte « Décision enregistrée », `src/app/(dashboard)/credit/analyse/page.tsx:92-96`). Export PDF/Excel simulé (minuterie, rien généré, `src/components/dashboard/ExportButton.tsx:24-30`) |
| 6 | `/credit/cycle` (+ `-with-api`) | CC, ROC, Commercial, Risque ; RA redirigé vers le pipeline | 6 étapes (DEMANDE, ANALYSE, COMITE, DECAISSEMENT, ECHEANCIER, CLOTURE), 6 KPI, 4 dossiers `DC-xxxx` avec historique et « action IA » | Sélection réelle ; aucune action métier ; KPI constants (`src/lib/credit-cycle-hub.ts:63-72`) |
| 7 | `/credit/reseau` (+ `-with-api`) | ROC | « Agences & opérations » : actions ROC, trésorerie inter-agences, heatmap PAR, contrôle opérationnel | Déploiement de fiche agence réel ; reste navigation. Pilotage, pas processus |
| 8 | `/credit/equipes` | ROC | Redirection vers `/credit/recouvrement#equipes` | — |

Écrans voisins qui portent le processus :
| Chemin | Constat |
|---|---|
| `/clients/nouveau` | Prospect : nom, prénom, téléphone, zone, activité, adresse, secteur, type. Aucun GPS, photo, KYC ni score (le CDC:547-557 décrit 7 étapes : écart). Session locale |
| `src/components/collecte/DemandeCreditModal.tsx` | Seul formulaire de demande : produit parmi Crédit Commerce, PME, Agricole, Tontine, Express (liste DIFFÉRENTE du catalogue), montant (défaut 500 000, min 50 000), durée 3 à 36, objet. Aucune simulation, éligibilité ni plafond de produit. Session locale ; vrai dossier seulement si l'API est branchée |
| `/kyc` (`src/lib/kyc-hub.ts`) | Niveaux SIMPLIFIE / STANDARD / RENFORCE ; statuts COMPLET / INCOMPLET / EXPIRE / EN_VERIFICATION / REJETE ; pièces CNI, PASSEPORT, ATTESTATION_DOMICILE, PHOTO, CONTRAT, JUSTIFICATIF_REVENU ; score OCR. « Dossiers incomplets bloquent décaissement » |
| `/calendrier` | Agenda CC. Bouton « Planifier » SANS action (`src/components/cc/CalendrierCcBlock.tsx:170-176`) |
| `/produits`, `/groupes` | Lecture seule |
| `/emprunteurs/[id]` | Fiche 360° (onglet Crédits : échéancier, cautionnaires, garanties) |

Constat global : aucun écran ne permet de planifier ou saisir une visite (photo + GPS) pour un dossier, téléverser une pièce, saisir des cautions, simuler un échéancier ni décaisser. Ces étapes n'existent qu'en texte (CDC) et en types (`WorkflowAction`).

---
## 2. Rôles et droits

Rôles du front (`src/types/index.ts:2-18`, 16) : MANAGER (DG), GESTIONNAIRE (RA), GESTIONNAIRE_PORTEFEUILLE (GP), AGENT_TERRAIN, COMMERCIAL, COLLECTRICE, RESPONSABLE_COMMERCIAL (RCC), CREDIT (CC), RESPONSABLE_CREDIT (ROC), RISQUE, RELANCE, COMPTABLE, AUDITEUR, DAF, PAIE, COMMUNICATION. Le « comité » n'est PAS un rôle : la démo teste les chaînes `DG` ou `COMITE` (`src/lib/credit-mock-workflow.ts:513-515`).

| Phase | Récit | Démo / cahier | Remarque |
|---|---|---|---|
| 1 Prospect, KYC | Commercial, agent terrain | CDC:551-581 : agent/commercial saisissent ; CC et Auditeur valident le KYC | `/kyc` ouvert à COMMERCIAL, COLLECTRICE, CC, AUDITEUR, RA |
| 2 Demande | Agent | Agent terrain, Commercial (CDC:684) | CC prévenu : aucune notification visible |
| 3 Dossier | CC (pièces, cautions), agent (envoi) | Idem (CDC:707-719) ; actions sans écran | |
| 4 Instruction | CC ; visites par agent ou CC | CDC:733-742 ; RISQUE a les mêmes boutons que CC (`isCcRole` = CREDIT ou RISQUE, `src/lib/credit-decisions.ts:223-225`) | L'analyste risque peut décider comme un CC |
| 5 Décision | ROC | ROC et MANAGER (DG) identiques (`:219-221`) ; CDC:944 ROC seul | Le DG peut décider à la place du ROC |
| 6 Comité | ROC + (DG ou RA) | CDC:788, 945 « selon montant » ; démo : `VALIDER_COMITE` pour `DG`/`COMITE` | Ni présence ni quorum saisis |
| 6 Décaissement | Comptable ou DAF (espèces) | CDC:800 Comptable ; terrain CDC:515 | Aucun écran dans `credit/` |
| 7 Suivi | GP | GP : encaisser, relance e-mail, promesse (`credit-mock-workflow.ts:516-520`) | RA, DG en lecture |
| Lecture | Auditeur, Risque | CDC:107 : Auditeur lit KYC et dossiers ; Risque lit le pipeline agence | |

Périmètre de données (CDC:111-120) : DG réseau, RA agence, CC dossiers agence + file, ROC toutes agences, GP portefeuille, agent zone, filtrage par jeton. La démo filtre seulement par un nom d'agence en dur (`AGENCE_RA.nom`).
Séparation des tâches (CDC risque:462-472) : alerte si la même personne valide un paiement MoMo et modifie l'échéance du même client sous 1 h ; alerte « dossier modifié après comité » ; « décaissement sans visite CC validée ».

## 3. Machine à états du dossier

Racine front : `C:/Users/thier/Documents/prospera-font-end/prospera-web/src/` (notée `src/`). Cahier : `docs/CAHIER_DES_CHARGES_BUNDLE_CREDIT.md` (noté CDC).

### 3.1 Statuts trouvés (noms exacts)
| Statut | Dans récit | Dans type `DossierStatutBd` (`src/types/credit-api.ts:3-17`) | Dans Kanban ROC (`src/lib/credit-pipeline-roc.ts:11-21`) | Dans CDC |
|---|---|---|---|---|
| SOUMIS | oui | oui | oui | oui (CDC:654) |
| RDV_PROGRAMME | oui | oui | non (jamais affiché en colonne) | oui |
| EN_ATTENTE_DOCUMENTS | oui | oui | non | oui |
| DOSSIER_COMPLET | oui | oui | oui (« Docs OK ») | oui |
| VISITES_PLANIFIEES | oui | oui | non | oui |
| EN_ANALYSE | oui | oui | oui (« Analyse CC ») | oui |
| VALIDE_CHARGE | oui | oui | oui (« Validé CC ») | oui |
| REFUSE_CHARGE | NON | oui (`credit-api.ts:11`) | non | non (absent du schéma CDC:653-658) |
| EN_ANALYSE_ROC | oui | oui | oui (« Validation ROC ») | oui |
| EN_COMITE_CREDIT | oui | oui | oui | oui |
| APPROUVE | NON | non | oui (colonne Kanban, stage de démo, `credit-pipeline-roc.ts:18`) | non |
| DECAISSEMENT | NON | non | oui (colonne Kanban) | non |
| EN_GESTION | oui | oui | oui | oui |
| CLOTURE | oui | oui | non | oui |
| REFUSE | oui | oui | non | oui |
| ANNULE | NON | oui (`credit-api.ts:17`) | non | non (CDC dit « REFUSE (annulation à tout moment) ») |

Total : récit 12 (11 + REFUSE) ; type TS 14 ; Kanban démo 9 colonnes dont 2 absentes du récit (APPROUVE, DECAISSEMENT) ; CDC:958 parle de « workflow 15 statuts » (critère d'acceptation) alors que son propre schéma en liste 12.

### 3.2 Constats de la démo (mock)
- `src/lib/credit-mock-workflow.ts:457-463` : la frise (stepper) regroupe en 5 étapes : Soumission (SOUMIS, RDV_PROGRAMME, EN_ATTENTE_DOCUMENTS) · Dossier complet (DOSSIER_COMPLET, VISITES_PLANIFIEES) · Analyse CC (EN_ANALYSE, VALIDE_CHARGE, REFUSE_CHARGE) · ROC/Comité (EN_ANALYSE_ROC, EN_COMITE_CREDIT, REFUSE) · Gestion PF (EN_GESTION, CLOTURE).
- Actions par statut (`credit-mock-workflow.ts:503-525`) : EN_ANALYSE -> `DONNER_AVIS_CC` (CC) ; VALIDE_CHARGE ou EN_ANALYSE_ROC -> `DECISION_ROC` (ROC) ; EN_COMITE_CREDIT -> `VALIDER_COMITE` (rôle `DG` ou `COMITE`) ; EN_GESTION -> `PAYER_ECHEANCE`, `ENVOYER_RELANCE_EMAIL`, `CREER_PROMESSE_PAIEMENT` (GP). Donc la décision ROC est ouverte dès VALIDE_CHARGE (pas seulement EN_ANALYSE_ROC).
- Types d'actions du workflow (`credit-api.ts:19-37`) : CREER_DEMANDE, PROGRAMMER_RDV, SIGNALER_DOCUMENTS, COMPLETER_DOSSIER_CAUTIONS, PLANIFIER_VISITES, CREER_VISITE, COMPLETER_VISITE, UPLOADER_PIECE, DONNER_AVIS_CC, DECISION_ROC, VALIDER_COMITE, VOIR_RAPPORT_*, PAYER_ECHEANCE, ENVOYER_RELANCE_EMAIL, CREER_PROMESSE_PAIEMENT, ANNULER_DOSSIER. Seules DONNER_AVIS_CC, DECISION_ROC, VALIDER_COMITE ont une interface (`DossierCreditActions.tsx`) ; les autres n'ont aucun bouton dans la fiche.
- Dans la fiche mock, le rôle passé au workflow est toujours `CHARGE_CREDIT` (`src/components/credit/DossierCreditFicheView.tsx:276`), et les trois callbacks sont `noop` (`:310`, `:350-353`) : les boutons Avis CC / Décision ROC / Comité n'ont donc AUCUN effet dans la démo (ni statut, ni donnée). Décoratif.


### 3.3 Transitions, déclencheurs, gardes (récit + démo + cahier)
| De | Vers | Déclencheur | Garde / condition | Source |
|---|---|---|---|---|
| (création) | SOUMIS | agent ou commercial crée la demande | client existant ; montant >= 50 000 ; (récit) dans les limites du produit, éligible | CDC:684-698 |
| SOUMIS | RDV_PROGRAMME | CC (action `PROGRAMMER_RDV`) | aucune écran | `credit-api.ts:21` |
| SOUMIS ou RDV_PROGRAMME | EN_ATTENTE_DOCUMENTS | CC signale pièces manquantes | — | CDC:715 |
| EN_ATTENTE_DOCUMENTS | DOSSIER_COMPLET | système, une fois pièces et cautions complètes | cautions >= 2 ; démo Kanban : >= 1 pièce | CDC:717-718 |
| DOSSIER_COMPLET | VISITES_PLANIFIEES | CC planifie les visites | >= 2 si montant > 500 000 | CDC:735 |
| VISITES_PLANIFIEES | EN_ANALYSE | visites faites | photo + GPS | CDC:736 |
| EN_ANALYSE | VALIDE_CHARGE | CC, avis favorable | checklist complète, sinon refus 400 ; démo Kanban : analyse enregistrée | CDC:739, `InstructionCcPanel.tsx:125` |
| EN_ANALYSE | REFUSE_CHARGE (type seulement) | CC, avis défavorable | — | `credit-api.ts:11` |
| VALIDE_CHARGE | EN_ANALYSE_ROC | système, rapport ROC généré | — | CDC:742 |
| EN_ANALYSE_ROC | EN_COMITE_CREDIT | ROC approuve | montant, taux, durée, GP ; sans échéancier | CDC:776 |
| EN_ANALYSE_ROC | REFUSE | ROC refuse | motif ; agent notifié | CDC:777 |
| EN_ANALYSE_ROC | EN_ATTENTE_DOCUMENTS | ROC demande garanties | — | CDC:778 |
| EN_COMITE_CREDIT | EN_GESTION | comité favorable | quorum ROC + 1 direction ; génère l'échéancier | CDC:795-799 |
| EN_COMITE_CREDIT | REFUSE | comité défavorable | — | CDC:789 |
| EN_GESTION | CLOTURE | solde nul | système (cycle de démo : acteur « Système ») | `credit-cycle-hub.ts:112` |
| tout statut | REFUSE ou ANNULE | `ANNULER_DOSSIER` avec motif (`api-credit-phase2.ts:69`) | — | |
Retours en arrière : seul le retour du ROC vers les documents est documenté ; la démo Kanban agence autorise de reculer d'une colonne librement. Horodatage de chaque transition : CDC:1.2 « 100 % horodatées » ; la démo n'a que des jalons (`WorkflowJalon`, date de soumission, dates d'éléments). Aucune trace « qui » en dehors de l'historique du cycle (acteur, date, durée en h).

### 3.4 Écarts de statuts avec le récit
1. Le front a 14 statuts de base (REFUSE_CHARGE et ANNULE en plus), 9 colonnes de Kanban ROC avec APPROUVE et DECAISSEMENT, 14 statuts de statistiques (dont PROSPECT, DOCS_INCOMPLETS, EN_VISITE, APPROUVE_ROC, EN_RETARD, CONTENTIEUX) et 6 étapes de cycle : quatre vocabulaires.
2. Le récit n'a pas de statut propre pour « avis CC défavorable » : la démo en a un (REFUSE_CHARGE).
3. Le récit place la décision ROC après VALIDE_CHARGE puis EN_ANALYSE_ROC ; la démo ouvre l'action ROC dès VALIDE_CHARGE.
4. Le suivi après EN_GESTION (EN_RETARD, EN_RECOUVREMENT, CONTENTIEUX...) est un second axe (récit §7), non mélangé aux 12 statuts.

---
## 4. Par phase (synthèse ; le détail du scoring, des alertes, de l'IA et du Kanban est en 4A)

### Phase 1 : prospection, fiche client, KYC, score, groupe
- Champs fiche client complète (`src/lib/fiche-client-microfinance.ts:23-66`) : identité (prénom, nom, genre, date de naissance, âge, nationalité, situation matrimoniale, personnes à charge, CNI + date et lieu de délivrance, adresse domicile et activité, GPS lat/lng, téléphones, WhatsApp, e-mail, contact d'urgence) ; activité (secteur, sous-secteur, description, ancienneté en années, lieu, n° de stand, effectif, CA mensuel, charges, marge nette, saisonnalité, concurrence) ; comptes d'épargne liés ; documents KYC (statut VALIDE / EXPIRE / MANQUANT / EN_ATTENTE, date de dépôt et d'expiration).
- Pièces obligatoires (`:68-95`) : CNI, justificatif de domicile, photo client ; « fiche visite terrain (RA/GP) » ajoutée si demande de crédit.
- Score client (CDC:257) : paiement 40 %, capacité 30 %, activité 20 %, terrain 10 % ; recalcul sur création, KYC, paiement, retard, visite. Aucune formule codée dans la démo (constante par client).
- KYC requis avant décaissement (CDC:470, 581). Niveaux SIMPLIFIE / STANDARD / RENFORCE (`kyc-hub.ts`).
- Groupe solidaire : voir §5.

### Phase 2 : demande de crédit
- Saisie : client, produit, montant, durée, objet, date souhaitée (CDC type `CreateDossierCreditPayload`, `credit-api.ts:115-121`). Statut initial SOUMIS.
- Règles du récit (montant dans les limites du produit ; éligibilité score minimum et ancienneté minimum ; simulation avec mensualités, intérêts, frais, TAEG) : ABSENTES du front. Elles ne se trouvent que dans le cahier terrain §9 (`docs/CAHIER_DES_CHARGES_BUNDLE_TERRAIN_COLLECTE.md:735-760`) : paramètres de produit « score minimum 45 », « ancienneté minimum 3 mois », « ajustement IA : score < 60 donne +2 points de taux » (configurable +1 à +5), fréquence de remboursement hebdomadaire / bimensuel / mensuel, garanties requises.
- Seule règle codée : montant >= 50 000 (modales) ; durée 3 à 36 mois (collecte).
- Notification du CC : aucune dans la démo.

### Phase 3 : constitution du dossier
- Pièces manquantes (`SIGNALER_DOCUMENTS`) et envoi (`UPLOADER_PIECE`) : actions typées, sans écran. Dans le Kanban, éléments PIECE ajoutés à la main (CNI + justificatif, registre de commerce).
- Cautions (`fiche-client-microfinance.ts:106-122`) : minimum 2 cautionnaires solidaires, TOUJOURS (constante `MIN_CAUTIONNAIRES = 2`), contre « au-dessus d'un seuil » dans le récit. Champs : ordre, prénom, nom, lien, téléphone, contact d'urgence, profession, CNI, revenu mensuel, statut (ACTIF / APPELE / INJOIGNABLE / REALISE / REFUSE), date et montant d'engagement. Une caution est « valide » si ACTIF ou REALISE.
- Barème de garanties selon le montant (`:136-222`, valeurs de la démo, paramétrables) :
  | Montant du crédit | Exigence |
  |---|---|
  | tout montant | 2 cautionnaires solidaires |
  | > 300 000 | dépôt de garantie 10 % (compte épargne bloqué) |
  | > 500 000 | garantie réelle (stock, matériel, nantissement) >= 30 % |
  | > 1 000 000 | dépôt 15 % (remplace 10 %) et garantie réelle >= 50 % |
  Statuts d'exigence : OK / MANQUANT / PARTIEL / NON_REQUIS. Types de garantie : STOCK, MATERIEL, CAUTION, HYPOTHEQUE, DEPOT_GAGE.
- Couverture des cautions (modèle secondaire) : somme des revenus des cautions / mensualité >= 3 donne 5 points, < 1 déclenche `CAUTIONS_INSUFFISANTES` (`PROSPERA_MODELES_RISQUE_CREDIT.md:68-72`) ; seuil de couverture « recommandé 80 % » dans une alerte de démo.
- Passage DOSSIER_COMPLET : règle du Kanban = au moins 1 pièce (`credit-pipeline-demo-store.ts`) ; CDC:718 : validé par le système ; aucune liste de pièces par produit. Le score est « recalculé » (CDC:719) : série figée dans la démo. Le statut EN_ATTENTE_DOCUMENTS reçoit aussi le retour « demander garanties » du ROC (CDC:778).

### Phase 4 : instruction par le CC
- Visites : récit = 2 visites minimum au-dessus de 500 000, photo et GPS obligatoires ; CDC:735-736 idem. Démo : aucune règle codée ni écran ; la dimension D6 « Visites terrain » donne 2 sous-notes (domicile, activité) ; exemple de dossier « 2 visites effectuées ». Règles terrain voisines (CDC terrain:229-232) : photo obligatoire, écart GPS < 100 m du client, géofencing validé côté serveur, types `VISITE_INSTRUCTION` (photo, GPS, compte rendu détaillé, revenus observés), mode hors ligne avec file locale et synchronisation par lot (idempotence par identifiant client). Alerte d'audit : visite validée à plus de 500 m de toute adresse client (CDC risque:472).
- Rapport, 5C, score, alertes, recommandation IA, checklist : voir 4A. Compléments : seuils de score et classes, PD logistique et provisions du modèle secondaire (`PROSPERA_MODELES_RISQUE_CREDIT.md:90-117`) :
  | Score consolidé | Classe | Provision |
  |---|---|---|
  | 75-100 | PERFORMANT | 0 % |
  | 55-74 | SOUS_SURVEILLANCE | 10 % |
  | 35-54 | DOUTEUX | 25 % |
  | 15-34 | COMPROMIS | 50 % |
  | 0-14 | PERTE | 100 % |
  PD = 1 / (1 + exp(0,12 x (score - 50))). Les 8 dimensions du secondaire diffèrent de la démo (D1 comportement transactionnel /25, D2 historique crédit /20, D3 capacité /15, D4 profil sociodémographique /10, D5 collatéral /10, D6 engagement terrain /5, D7 avis CC /10, D8 benchmark sectoriel /5 = 100). La démo prime (D1 historique /15, D2 stabilité /20, D3 capacité /15, D4 activité /25, D5 garanties /10, D6 visites /12, D7 avis CC /8, D8 validation ROC /5 = 110). Dimensions actives par étape (secondaire:78-84) : SOUMIS D1-D4 (max 70), DOSSIER_COMPLET + D5 (80), EN_ANALYSE + D6 (85), VALIDE_CHARGE + D7 (95), EN_ANALYSE_ROC + D8 (100).
- Avis du CC : récit = favorable ou défavorable ; favorable fait passer chez le ROC. Démo : l'écran d'action offre Favorable / Défavorable + montant suggéré + notes (`DossierCreditActions.tsx`) ; le tableau ROC montre 4 avis `FAVORABLE`, `FAVORABLE_REDUIT`, `DEFAVORABLE`, `A_DEMANDER_GARANTIES` et une note du CC sur 10 (`02-dashboard-roc.md`, `file_validation`). Garde : avis favorable refusé (400) tant que la checklist n'est pas complète (`InstructionCcPanel.tsx:125`). Un avis défavorable : statut `REFUSE_CHARGE` (type) ; le récit ne l'a pas.
- Tableaux de suivi : SLA 48 h (carte rouge `SLA dépassé`, dossiers bloqués >= 48 h, `mock-risque-registry.ts:87-92`) ; objectif de traitement du CC 24 h (`03-dashboard-charge-credit.md`, `delai_objectif_h`), délai moyen de démo 38 h ; délai demande-décaissement objectif 9 j (démo 11 j).

### Phase 5 : décision du ROC
- Entrées : rapport ROC (4A) avec proposition de montant, taux, durée.
- Sorties du récit : approuve (montant, taux, durée, GP) vers EN_COMITE_CREDIT ; refuse vers REFUSE (agent prévenu) ; demande garanties vers retour documents. Charge utile du cahier/types (`credit-api.ts:147-155`) : `approuve`, `montant_accorde`, `duree_accordee`, `taux_interet`, `gestionnairePfId`, `motif_refus`, `notes_roc`. L'écran de la fiche n'expose que montant accordé, notes, Approuver, Refuser : pas de taux, durée, GP, ni « demander garanties » (CDC:778 : `demander_garanties`). Motif de refus : texte libre (défaut « Refus ROC »).
- Règle impérative « pas d'échéancier à l'accord ROC » : respectée par le texte de l'onglet Échéancier (« visible après validation comité (EN_GESTION) », `DossierCreditFicheView.tsx:473-475`).
- À l'approbation, le modèle secondaire calcule une provision initiale = montant accordé x taux de provision de la classe, et génère le calendrier de risque du GP (mois à risque, saisonnalité) (`PROSPERA_MODELES_RISQUE_CREDIT.md:100, 176-187`).
- Plafonds : la démo a des plafonds de dossier par type de client et une « dérogation de plafond » validée par le DG (`mock-controle-interne-registry.ts:91-95` : 5 M, 3 M, 2 M ; statuts EN_REVUE, APPROUVE_DEROG) : absent du récit.

### Phase 6 : comité, échéancier, décaissement
- Quorum : récit = ROC + un membre de la direction (DG ou RA). Démo : aucun écran de séance, de présence ni de vote ; une seule action « Valider vers gestion PF » / « Refuser » avec notes (`DossierCreditActions.tsx:191-225`). Une anomalie de démo : « Membre comité absent » bloque un dossier 72 h. Prochain comité : date, nombre de dossiers, montant total (`credit-cycle-hub.ts:72`).
- Conditions figées (récit) : montant, taux, durée, mensualité, frais, TAEG, date de la première échéance, GP, notes. Cahier terrain §9.2.4 : `montant_accorde`, `taux_mensuel`, `duree_mois`, `mensualite`, `total_interet`, `frais_dossier`, `cout_total_credit`, `taeg`, `date_premier_remboursement`, `gestionnaire_portefeuille_id`, `notes_comite`. Démo (bannière `ConditionsFinalesBanner.tsx`) : n'affiche que mensualité, durée, montant accordé, taux mensuel ; ni frais, ni TAEG, ni date de première échéance, ni GP.
- Génération de l'échéancier par le comité : décrit par le CDC:797 (`credit-echeancier-builder.ts`) et par le secondaire (« PMT échéancier »). Le fichier de démo n'est PAS un générateur : capital constant (montant / durée, dernier terme ajusté), intérêt = mensualité - capital, échéance le 15 de chaque mois, mois de référence figé au 28/05/2026, sert à rendre cohérents impayés et encours (`credit-echeancier-builder.ts:365-437`). Aucun calcul d'annuité, de frais, d'assurance ni de TAEG n'existe dans le front (recherche de PMT, `pow`, TAEG, usure : 0 résultat). Méthode cible : annuité à mensualité constante (dégressif) d'après CDC terrain « 2,5 % / mois dégressif » et secondaire « PMT » ; à confirmer.
- Assurance : produit `ASS-DEC` à 1,2 %/an, obligatoire sur les microcrédits ; alerte de démo « 12 dossiers crédit sans assurance DEC, bloquer décaissement » (`14-ops-produits.md`). Non intégrée à l'échéancier.
- Décaissement : canaux du récit (espèces au guichet par Comptable ou DAF, Mobile Money, virement). Démo : seule trace = libellé `canal_decaissement` sur les crédits de démo (`Virement agence → caisse`, `Espèces guichet`, `Guichet agence`, `fiche-client-microfinance.ts:1160, 1199, 1498`) et la colonne Kanban « Décaissement ». Dans le cycle de démo, un décaissement peut être bloqué par un KYC incomplet. Autorisation : terrain CDC:515. Opérateurs MoMo du cahier : Flooz / Mixx (Togo).
- Notifications du récit (client, GP, agent, responsable commercial) : types `diffusion` et `etapes_auto` (`credit-api.ts:133-139`) seulement ; aucun canal ni message dans la démo.
- Après le comité : statut EN_GESTION, GP désigné = celui du ROC (CDC:798). Refus du comité : REFUSE.
- Phase 7 (jonction) : le CLOTURE est affiché « solde nul, libération garanties » (`credit-cycle-hub.ts:57`) ; le dossier clôturé propose un renouvellement (« proposer renouvellement 450 k », `:115`) ; aucun écran de clôture.

---
## 5. Produits de crédit

Catalogue de la démo (`src/lib/produits-hub.ts:37-47`, identique à `14-ops-produits.md`), seulement les produits de crédit et frais associés :
| Code | Nom | Taux annuel | Montant | Durée | Frais dossier | Assurance | Groupe |
|---|---|---|---|---|---|---|---|
| MIC-IND | Microcrédit individuel | 24 % | 50 000 à 2 000 000 | 3 à 12 mois | 2 % | obligatoire | non |
| CRED-GRP | Crédit groupe solidarité | 22 % | 500 000 à 5 000 000 | 6 à 24 mois | 1,5 % | obligatoire | oui (garantie croisée 5 à 15 membres) |
| FRAIS-DOS | Frais de dossier crédit | — | — | — | 2 % | — | — |
| ASS-DEC | Assurance décès invalidité | 1,2 % | — | — | — | obligatoire sur microcrédit | — |
| ASS-INC | Assurance incendie stock | 0,8 % | — | — | — | non | — |
Les produits Crédit PME, Crédit Commerce, Crédit Agricole, Crédit Express, Micro-Entrepreneur Plus (cahier terrain) et « DC-xxxx : Microcrédit, Crédit PME, Crédit groupe » (cycle) ne sont pas dans le catalogue : trois listes de produits différentes dans la démo.
- Le taux affiché est ANNUEL (24 % et 22 %), alors que le cahier terrain donne 2,5 % par mois dégressif et que la conditions finales parlent de taux mensuel (2,8). Le plafond d'usure du PO est 24 % par an : 24 % du catalogue est juste à la limite, 22 % dessous ; 2,5 %/mois (30 % nominal, 34,5 % effectif) est au-dessus. Aucun plafond réglementaire n'est codé.
- Paramètres d'un produit crédit (cahier terrain 9.2.2) : nom, type (individuel ou groupe solidaire), montant min/max, durée min/max, fréquence de remboursement, taux (mensuel, annuel ou dégressif), frais de dossier (fixe ou %), garanties requises, score minimum (ex. 45), ancienneté minimum (ex. 3 mois), ajustement IA du taux (score < seuil).
- Versionnement (cahier terrain 9.2.1) : toute modification crée une version horodatée ; les dossiers en cours gardent leurs conditions d'origine ; désactivation = INACTIF sans effet sur les dossiers en cours. Démo : aucune version, aucun formulaire de création (le cahier prévoit « formulaire création produit » 9.4).
- Crédit de groupe : minimum 5 membres (CDC:613), produit 5 à 15 membres, types de groupe TONTINE / SOLIDARITE / GARANTIE_CROISEE, rôles PRESIDENT / TRESORIER / MEMBRE, cotisation, statut de paiement A_JOUR / RETARD / EXCLU, score IA par membre, « score de cohésion » du groupe (0-100, ex. 88), cycle actuel, réunions avec décisions (« Validation décaissement DC-2919 », « Renouvellement cycle 4 ») (`groupes-hub.ts`). Dans le pipeline, un groupe est un « client » (ex. `GIE Marché Central`, 2 400 000, 24 mois). Règle de décision de groupe, solidarité en cas de défaut, partage du montant entre membres : non définis.
- Cycles et renouvellement : un client a des « crédits clôturés » comme historique (D1 : « 2 crédits clôturés », 8 points) ; « cycle actuel » pour les groupes ; clôture avec « proposer renouvellement 450 k » (+50 % sur 300 000 dans l'exemple, sans règle). Pas de règle de montant du cycle suivant.

---
## 6. Calculs : indicateur par indicateur

| Indicateur (écran) | Formule | Statut dans la démo |
|---|---|---|
| Score consolidé | score CBI + ajustement IA (borné -10 à +10), borné 0-100 | Somme de deux constantes saisies |
| Notes 5C, 8 dimensions | sous-critères notés | Constantes par dossier |
| Score client 0-100 | 40 % paiement, 30 % capacité, 20 % activité, 10 % terrain (CDC:257) | Constante |
| Classe BCEAO | seuils 75 / 55 / 35 / 15 (secondaire:92-98) | Seuils de couleur 75 / 55 / 35 dans le graphique ; classe stockée |
| PD | 1 / (1 + exp(0,12 x (score - 50))) (secondaire:107) | Constante par dossier (ex. 12,4 %) ; non cohérente avec la formule (score 72 donne 6,6 % attendu) |
| Perte attendue | EAD x PD x LGD | Mock ROC : montant x PD x 45 % ; le dashboard ROC affiche 16 000 pour 400 000 à 9,6 % (formule à 45 % donnerait 17 280) : constante |
| LGD | secondaire:122 : 75 % sans caution, 25 % si couverture > 2, -10 pts garantie physique, -5 pts lien fort | Fixe 45 % |
| Provision | montant x taux de classe (0 / 10 / 25 / 50 / 100 %) | Fixe 10 % dans le mock ROC |
| Taux d'effort | mensualité / revenu, seuil 33 % (alerte CRITICAL) ; secondaire:64 : <= 25 % donne 6 points, > 45 % donne 0 | Constante (3,1 % dans l'exemple) |
| Endettement | externe > 50 % des revenus (alerte WARN) | Constante |
| Mensualité (exemple fiche) | non calculée | Entrée de donnée |
| Échéancier | capital = montant / durée ; intérêt = mensualité - capital | Générateur de cohérence, pas de calcul d'intérêt |
| TAEG | aucune formule dans les sources | 36,4 % en dur dans le cahier terrain (`:773`). Test de l'extracteur : 2,5 %/mois dégressif sur 12 mois + 1,5 % de frais = environ 38,5 % effectif / 33,0 % nominal ; l'exemple du cahier (2,8 %/mois, mensualité 23 456) est incohérent (2,8 %/mois donnerait 24 817, intérêt total 47 799 au lieu de 31 472) |
| PAR / retards (jonction) | PAR = encours en retard >= 1 jour / encours total (CDC:993) ; PAR30, PAR90 | Constantes de série (`mock-time-series.ts`) |
| Délai de traitement, SLA | heures d'attente par dossier | Valeurs figées par dossier ; objectif CC 24 h, demande-décaissement 9 j |
| Taux d'approbation, motifs de rejet | parts par tranche | Répartition fixe (`credit-dossiers-stats.ts:54-79`) : < 100 k 88 %, 100-500 k 78 %, 500 k-1 M 62 %, 1-5 M 48 %, > 5 M 36 % ; 8 motifs (revenus insuffisants 18 %, activité non vérifiable 11 %, endettement 9 %, garanties 8 %, historique autre IMF 6 %, faux documents 4 %, taux d'effort > 33 % 4 %, concentration 3 %) |
| Pipeline « 14 statuts » | décompte par statut | Liste de 14 statuts de stats : PROSPECT, SOUMIS, DOCS_INCOMPLETS, DOSSIER_COMPLET, EN_VISITE, EN_ANALYSE, VALIDE_CHARGE, EN_ANALYSE_ROC, APPROUVE_ROC, DECAISSEMENT, EN_GESTION, EN_RETARD, CONTENTIEUX, CLOTURE (`credit-dossiers-stats.ts:70-80, 128-135`) |
| Étoiles de priorité, sentiment | non défini | Constantes |
| Cycle : KPI | 24 dossiers actifs, 4 demandes/jour, 5 comités/semaine, 3 décaissements en attente, 18 clôtures/mois, 11 j | Constantes |

---
## 7. Points de jonction

| Avec | Ce que le crédit donne / reçoit | Constat dans les sources |
|---|---|---|
| Recouvrement et relances | Reçoit EN_GESTION ; le GP encaisse, relance par e-mail, enregistre une promesse (montant, date) | Panneau GP dans la fiche dossier (`GpRecouvrementPanel.tsx`) : échéance, statut A_VENIR / PAYE / RETARD, paiement avec canal fixe `AGENCE`. Calendrier de risque du GP et alertes préventives à J+7 générés à l'approbation du ROC (secondaire:176-187). Statuts de retard et contentieux : voir l'autre extrait |
| Terrain et hors ligne | Visites d'instruction (photo + GPS), prospection | Règles de visite et synchronisation par lot dans le cahier terrain (§4 ci-dessus). La fiche dossier n'a pas de formulaire de visite ; types `CREER_VISITE`, `COMPLETER_VISITE` sans écran. Anomalie d'audit « décaissement sans visite CC validée » |
| Caisse et Mobile Money | Décaissement (espèces, MoMo, virement) ; remboursements | Comptable valide un paiement MoMo `EN_ATTENTE` ; rapprochement automatique si écart < 1 % entre montant payé et échéance (cahier terrain:505-506) ; espèces : dépôt lié à l'échéance. Décaissement espèces : Comptable ou DAF seuls (`:515`). Aucun écran de décaissement côté crédit |
| KYC et fiche client | Reçoit client, score, KYC | KYC valide requis avant décaissement (CDC:581). Pièces et niveau : §4 phase 1 |
| Épargne | Dépôt de garantie 10 % ou 15 % sur compte épargne bloqué ; D1 transactionnel (dépôts, retraits, solde) | Dans le barème de garanties et dans les alertes DEPOT_PRE_RDV_SUSPECT, GONFLEMENT_RECENT |
| Assurance | Assurance décès invalidité obligatoire sur microcrédit | Alerte « sans police » |
| Comptabilité | Écriture au décaissement | Cahier terrain: validation MoMo crée l'écriture ; hors priorité |
| Logiciel cœur de l'IMF (PO : il fait foi) | Reçoit de lui : clients, prêts en cours, paiements, soldes. Renvoie vers lui : dossier accordé (conditions figées, échéancier), ordre de décaissement à exécuter | Aucune source ne décrit cet échange. Données minimales à échanger déduites des écrans : identifiant client, référence du dossier, conditions finales (montant, taux, durée, mensualité, frais, assurance, date de la première échéance), échéancier (numéro, date, capital, intérêt, total), statut de chaque échéance (PAYE / PARTIEL / IMPAYE / A_VENIR), paiement (montant, canal, date), solde de capital restant dû, jours de retard. Sans réception des paiements, échéancier, PAR et relances seront faux (récit §7) |
| Reprise du portefeuille | Prêts en cours à importer | Les fiches de démo portent déjà montant décaissé, encours, capital restant dû, intérêts courus, pénalités, date de décaissement, date de fin prévue, canal, échéancier, cautionnaires (`CreditDetaille`, `fiche-client-microfinance.ts:536-556`) : bon gabarit d'import |
| Conformité BCEAO | Classes de risque et provisions | Deux échelles de classes différentes (4A) à unifier |

---
## 8. Écarts récit, démo, cahier, sources secondaires

| # | Sujet | Récit | Démo | Cahier | Secondaire | Remarque |
|---|---|---|---|---|---|---|
| 1 | Nombre de statuts | 12 (11 + REFUSE) | 14 de base + APPROUVE + DECAISSEMENT (Kanban) + 14 de stats | schéma 12 ; recette « 15 statuts » (:958) | « 14 statuts » (:193) | Le récit fait foi : 12. REFUSE_CHARGE et ANNULE à trancher |
| 2 | Cautions | au moins 2 au-dessus d'un seuil | 2 toujours ; barème par montant 300 k / 500 k / 1 M | « min. 2 si montant > seuil » (:717) | — | Seuil à fixer par l'IMF |
| 3 | Visites | 2 minimum au-dessus de 500 000, photo + GPS | aucune règle, aucun écran | idem (:735) ; terrain : GPS < 100 m | — | Seuil paramétrable (PO) |
| 4 | Simulation, éligibilité, TAEG | simulation avant création (mensualités, intérêts, frais, TAEG) ; éligibilité score et ancienneté | absente ; formulaire sans contrôle | cahier terrain §9.2.3 la décrit (`POST /produits/:id/simuler`) | — | TAEG 36,4 % non reproductible |
| 5 | Taux | 2,5 %/mois, TAEG 36,4 %, usure 24 %/an | catalogue en annuel : 24 % et 22 % | 2,5 %/mois dégressif ; exemple 2,8 %/mois | — | Plafond d'usure à rendre paramétrable (PO : 24 %/an) |
| 6 | Checklist d'instruction | complète à 100 % | 4 cases sur les cautions | « 100 % requis » (:739) | — | Contenu de la checklist à définir |
| 7 | Avis CC | favorable / défavorable | Favorable / Défavorable ; tableau ROC : 4 avis + note /10 | binaire | — | Choisir 2 ou 4 valeurs |
| 8 | Divergence CC / IA | le CC peut s'écarter s'il le justifie | pas de champ de justification | « diverger avec justification » (:758) | — | À ajouter |
| 9 | Décisions IA | 4 : approuver, réduit, garanties, refuser | + TRANSMETTRE_ROC / A_VOIR_ROC | 4 | 4 | |
| 10 | Décision ROC | approuve (montant, taux, durée, GP) / refuse / garanties | + Valider avec réserves, + Renvoyer au CC ; écran sans taux, durée, GP | 3 voies avec `demander_garanties` | — | |
| 11 | Qui décide au ROC | ROC | ROC et DG (même droit) | ROC | — | |
| 12 | Comité | quorum ROC + DG ou RA, conditions figées | une action sans quorum ; conditions affichées partielles | quorum idem ; « selon montant » (:945) | — | Montant déclencheur à fixer |
| 13 | Échéancier | généré par le comité seul | générateur de cohérence, capital constant | `credit-echeancier-builder.ts` | « PMT échéancier » | Méthode à trancher (annuité, capital constant, in fine) |
| 14 | Alertes CBI (9 codes) | « alertes » | 9 codes (dépôt inhabituel...) | autres codes cités (fraude, garanties, retards, revenus) | 9 codes identiques à la démo | La démo et le secondaire priment |
| 15 | Dimensions du score | grille 5C | 8 dimensions /110 | 5C + 8 dim. = 100 | 8 dimensions différentes /100 | Trois barèmes ; démo retenue, à recaler à 100 |
| 16 | Classes de risque | — | PERFORMANT...PERTE ; autre échelle en conformité (NORMAL...CONTENTIEUX) | — | 75 / 55 / 35 / 15 | À unifier |
| 17 | Notifications | SOUMIS : CC ; REFUSE : agent ; fin : client, GP, agent, responsable commercial | aucune | idem | — | Canaux et gabarits à définir |
| 18 | Décaissement | espèces (Comptable ou DAF), MoMo, virement | aucun écran | idem | — | Opérateurs par pays et par banque (PI-SPI, PO) |
| 19 | Produits | catalogue versionné | catalogue en lecture ; 3 listes de produits différentes | création + versions décrites | — | |
| 20 | Groupe solidaire | oui | lecture seule ; 5 à 15 membres ; min 5 (CDC) | min 5 (:613) | — | |
| 21 | Création prospect | identité, activité, photos, GPS | formulaire à 8 champs | wizard 7 étapes | — | |
| 22 | Dossier de suivi | statuts de recouvrement séparés | Kanban ROC ajoute EN_GESTION ; stats ajoutent EN_RETARD, CONTENTIEUX | — | — | Deux axes à séparer |
| 23 | Boutons | — | décisions, planifier, export, réception de caution : décoratifs | — | — | Voir §1 |

---
## 9. Questions ouvertes pour le PO (bloquantes pour l'écriture)
1. Statuts : garde-t-on exactement les 12 du récit ? L'avis CC défavorable crée-t-il un statut (REFUSE_CHARGE) ou passe-t-il directement à REFUSE ? Faut-il un statut d'annulation par le client (ANNULE) ?
2. Avis du CC : favorable / défavorable, ou aussi favorable réduit et garanties demandées ?
3. Droits : le DG peut-il décider à la place du ROC ? L'analyste risque peut-il donner un avis CC ? Qui sont les membres du comité (rôle dédié ou DG/RA désignés) et à partir de quel montant le comité est-il requis ?
4. Cautions : à partir de quel montant exige-t-on 2 cautions ? Reprend-on le barème de la démo (300 k : dépôt 10 % ; 500 k : garantie réelle 30 % ; 1 M : dépôt 15 % et garantie réelle 50 %) comme valeurs initiales paramétrables ?
5. Échéancier : annuité constante, capital constant ou in fine ? Frais de dossier prélevés au décaissement ou financés ? Assurance incluse dans la mensualité ? Fréquence (mensuelle, hebdomadaire) ? Jour d'échéance ?
6. TAEG : quelle formule réglementaire retient-on (taux de rendement actuariel incluant frais et assurance) ? Le plafond de 24 %/an s'applique-t-il au taux nominal ou au TAEG ?
7. Éligibilité : les valeurs « score minimum 45 » et « ancienneté 3 mois » du cahier terrain sont-elles à reprendre ? Que fait-on d'un client inéligible : blocage ou dérogation ?
8. Barème de score : retient-on les 8 dimensions de la démo (/110) ou celles du modèle (/100) ? Les seuils de classes 75 / 55 / 35 / 15 et les provisions 0 / 10 / 25 / 50 / 100 % sont-ils ceux de l'IMF ou ceux de la réglementation ?
9. Échange avec le logiciel cœur : sens et fréquence (temps réel, lot quotidien) ? Un décaissement décidé dans Prospera est-il exécuté dans le cœur puis confirmé en retour ? Le connecteur fictif de la démo doit-il simuler l'ordre de décaissement et le retour de paiement ?
10. Crédit de groupe : taille minimum (5 ?), montant par membre, solidarité en cas de défaut, une seule décision pour le groupe ?
11. Renouvellement : règle du montant du cycle suivant, délai après clôture.
12. Notifications : canaux (SMS, WhatsApp, e-mail, cloche), langue, délai ?

## Annexe 4A. Notes brutes lues (phases 4-5 : instruction, scoring, 5C, IA, ROC)

### Grille 5C et score (démo)
- Pondérations 5C (total 100) : CHARACTER /35, CAPACITY /15, CAPITAL /25, COLLATERAL /10, CONDITIONS /15 (`src/components/dashboard/RapportCcDossier.tsx:67-71`, `src/lib/mockMicrofinance.ts:643-648`). Radar normalisé en % ; vert si >= 70 %, orange >= 50 %, rouge sinon.
- Modèle « CBI v5 » = 8 dimensions D1..D8 (`src/lib/mockMicrofinance.ts:690-721`) :
  - D1 Historique remboursement /15 (CHARACTER ; cycles_anterieurs /8, incidents /7)
  - D2 Stabilité personnelle /20 (CHARACTER ; anciennete_localite /8, situation_familiale /12)
  - D3 Capacité de remboursement /15 (CAPACITY ; revenus_mensuels /8, taux_effort /7)
  - D4 Activité économique /25 (CAPITAL ; anciennete_activite /10, marge_brute /8, saisonnalite /7)
  - D5 Garanties & cautions /10 (COLLATERAL ; caution_solidaire /6, depot_garantie /4)
  - D6 Visites terrain /12 (CHARACTER ; domicile_visite /6, activite_visite /6)
  - D7 Avis CC /8 (CHARACTER ; inactive avant VALIDE_CHARGE)
  - D8 Validation ROC /5 (CONDITIONS ; inactive avant EN_ANALYSE_ROC)
  - Incohérence interne : le mapper API range D6, D7, D8 dans CONDITIONS (`src/lib/credit-rapport-mapper.ts:17-26`), la démo range D6 et D7 dans CHARACTER. Les max des dimensions (15+20+15+25+10+12+8+5 = 110) ne somment pas à 100 : les 8 dimensions et les 5C sont deux vues non réconciliées.
- Les notes 5C et dimensions sont des CONSTANTES saisies par dossier : aucune formule de calcul n'est codée côté front. Score consolidé = score_cbi + ajustement Prospera IA (borné -10..+10, `mockMicrofinance.ts:640`) ; exemple 70 + 2 = 72.
- Seuils de score (lignes de référence du graphique, `RapportCcDossier.tsx`) : >= 75 PERFORMANT (vert) ; 55-74 SOUS_SURVEILLANCE (orange) ; 35-54 DOUTEUX (rouge) ; < 35 non défini. Classes BCEAO du rapport : PERFORMANT, SOUS_SURVEILLANCE, DOUTEUX, COMPROMIS, PERTE (`mockMicrofinance.ts:600`). Le module conformité utilise une autre échelle : NORMAL, SOUS_SURVEILLANCE, DOUTEUX, COMPROMISES, CONTENTIEUX (`src/lib/conformite-hub.ts:5`).
- PD affichée : vert < 15 %, orange < 35 %, rouge au-delà. Perte attendue (mock ROC, `credit-rapport-mapper.ts:133-140`) : EAD = montant demandé ; perte attendue = montant x PD x 0,45 (LGD fixe 45 %) ; provision réglementaire = 10 % du montant (fixe).
- Évolution du score aux 5 étapes (SOUMIS, DOSSIER_COMPLET, EN_ANALYSE, VALIDE_CHARGE, EN_ANALYSE_ROC) : série figée dans la démo. Le CDC:269 et :719 dit « recalcul automatique à chaque transition ».
- 9 codes d'alerte CBI réellement dans la démo (`src/lib/mock-controle-interne-registry.ts:283-291`) :
  - DEPOT_INHABITUEL (WARN) ; GONFLEMENT_RECENT (WARN, solde gonflé < 30 j avant RDV) ; DEPOT_PRE_RDV_SUSPECT (CRITICAL, dépôt 24-72 h avant RDV d'analyse)
  - CAUTIONS_INSUFFISANTES (WARN ; exemple démo : couverture 70 % sous seuil recommandé 80 %) ; CONCENTRATION_SECTORIELLE (INFO)
  - ENDETTEMENT_ELEVE (WARN ; endettement externe > 50 % des revenus) ; TAUX_EFFORT_EXCESSIF (CRITICAL ; mensualité > 33 % des revenus)
  - COMPTE_TRANSIT (INFO) ; ECHANTILLON_BENCHMARK_FAIBLE (INFO)
  - Le CDC:279-286 cite d'autres codes (HISTORIQUE_RETARDS, INCOHERENCE_REVENUS, FRAUDE_SUSPECTEE, GARANTIES_INSUFFISANTES, ENDETTEMENT_ELEVE en CRITICAL) : écart cahier/démo.

### Recommandation IA (démo)
- Sortie `decision_suggeree` : APPROUVER, APPROUVER_REDUIT, REFUSER, DEMANDER_GARANTIES, A_VOIR_ROC (ancien nom normalisé en TRANSMETTRE_ROC, `src/lib/credit-decisions.ts:243-247`). Le CDC:270 cite 4 sorties.
- Contenu affiché : commentaire de synthèse, questions à poser au client, points à vérifier, 6 blocs d'analyse étendue (transactions et retraits, comportement client, contexte économique, saisonnalité, recouvrement et impayés, saturation sectorielle). Textes figés dans la donnée ; AUCUN moteur de décision codé (le CDC:270 annonce des règles : score, alertes actives, ratio d'endettement ; non visibles).
- Marque « Prospera IA » ; modes PROSPERA_IA_API ou FALLBACK_LOCAL (« Analyse locale »).
- Écart du CC par rapport à l'IA : le CDC:758 veut une justification ; la démo n'a AUCUN champ de justification (seule une pastille « IA » marque le bouton suggéré).

### Décisions proposées par rôle (`src/lib/credit-decisions.ts`)
- CC (rôles `CREDIT` et `RISQUE`) : Approuver, Approuver réduit, Demander garanties, Refuser, Transmettre au ROC.
- ROC (rôles `RESPONSABLE_CREDIT` et `MANAGER`) : Valider, Valider montant réduit, Valider avec réserves (APPROUVER_RESERVES), Rejeter, Renvoyer au CC (RENVOYER_CC). « Réserves » et « Renvoyer au CC » n'existent pas dans le récit ; le « demander des garanties » du ROC (récit) y devient « renvoyer au CC » (et dans la fiche, l'action ROC n'offre que Approuver / Refuser).
- Aucune de ces actions n'agit : dans `/credit/analyse` le clic déclenche une alerte navigateur « Décision enregistrée » sans rien changer (`src/app/(dashboard)/credit/analyse/page.tsx:92-96`). DÉCORATIF.
- Pipeline ROC : sur la carte EN_ANALYSE_ROC, Valider déplace la carte et Rejeter la supprime, en mémoire de la page seulement, après alerte « Décision enregistrée » (`PipelineCreditKanban.tsx`, handleDecision) ; perdu au rechargement. Agit localement.

### Rapport ROC (`src/components/credit/RapportRocView.tsx`)
Affiche : synthèse exécutive, score final / CBI / ajustement IA / classe BCEAO + PD, perte attendue (EAD, perte, provision, taux), avis du CC (avis, montant suggéré, notes), benchmark secteur (nb dossiers, taux de clôture, taux d'incident, verdict, « échantillon faible »), forces / faiblesses / recommandations avant décision, suggestion (décision, montant, durée, taux recommandés, conditions à imposer, justification), alertes. Le « montant, taux, durée proposés » du récit phase 5 = bloc `suggestion` ; en démo le taux recommandé est la constante 2,5 (`credit-rapport-mapper.ts:162`) et montant/durée recopient la demande.

### Instruction CC (`src/components/credit/InstructionCcPanel.tsx`)
La « checklist d'instruction » de la démo = 4 cases : cautionnaires renseignés, visites des cautions effectuées, dossiers des cautions reçus, prêt pour avis CC ; plus, par caution, une note de réception. Ce n'est pas la checklist « à 100 % » du récit/CDC (aucune liste de pièces/contrôles). Seule règle : « L'avis CC favorable sera refusé (400) tant que la checklist est incomplète » (`:125-129`). Données en dur (2 cautions : Koffi Jean, Mensah Ama). Le bouton « PATCH réception-dossier » n'agit qu'avec l'API, sinon recharge la constante : DÉCORATIF en démo.

### Kanban pipeline (`src/components/dashboard/PipelineCreditKanban.tsx`, `src/lib/credit-pipeline-demo-store.ts`)
- 4 colonnes agence (CC et RA) : SOUMIS « Soumis », DOSSIER_COMPLET « Docs OK », EN_ANALYSE « Analyse CC », VALIDE_CHARGE « Validé CC ». 9 colonnes ROC : + EN_ANALYSE_ROC « Validation ROC », EN_COMITE_CREDIT « Comité crédit », APPROUVE « Approuvé », DECAISSEMENT « Décaissement », EN_GESTION « En gestion ».
- Règles de glisser-déposer agence (codées, sessionStorage, perdues à la fermeture) : avancer d'une étape à la fois ; SOUMIS vers DOSSIER_COMPLET exige un élément DEMANDE ; DOSSIER_COMPLET vers EN_ANALYSE exige >= 1 pièce ; EN_ANALYSE vers VALIDE_CHARGE exige une ANALYSE enregistrée ; reculer toujours permis. Éléments ajoutables : DEMANDE, PIECE (CNI + justificatif de domicile, registre de commerce), RDV, VISITE, ANALYSE (« Grille CBI »), AVIS_CC.
- Modale « nouveau dossier » : montant minimum 50 000 FCFA (`src/components/credit/PipelineAddDossierModal.tsx:94`) ; référence générée `DOS-{année}-D{nnn}`.
- Colonnes ROC : glisser-déposer purement visuel, sans règle.
- Carte : étoiles de priorité 1-3, sentiment (POSITIF/NEUTRE/NEGATIF/CRITIQUE), délai d'attente en heures, tag « SLA dépassé » si attente >= 48 h ; valeurs figées par dossier.
- Clic sur une carte EN_ANALYSE pour un CC : ouvre `/credit/analyse?ref=`, sinon `/credit/dossiers/{id}`.
