# Extrait — client, terrain, caisse, épargne, produits (PRD Prospera Microfinance)

Statut : synthèse de lecture, 2026-11-13. Rien n'est tranché ici. Le client est « l'IMF ». Le logiciel cœur de l'IMF fait foi pour l'argent (décision PO, `brain-dump-po-2026-11-13.md:146-147`). Le front de démo `prospera-web` définit le produit mais n'enregistre rien de vrai ; le backend `localhost:3001` ne compte pas : seules les capacités sont décrites.

Abréviations de chemin : `FE` = `C:/Users/thier/Documents/prospera-font-end/prospera-web/src` ; `CDC` = `C:/Users/thier/Documents/prospera-font-end/docs/CAHIER_DES_CHARGES_BUNDLE_TERRAIN_COLLECTE.md` ; `SPEC` = `C:/Users/thier/Documents/prospera-backend/backend-dashboard-specs/` ; `PRD-D` = `prds/prd-distributeur-2026-11-12/prd.md`.

Plan : 1 Client/KYC · 2 Groupes · 3 Terrain · 4 Collecte · 5 Caisse · 6 Mobile Money/banque · 7 Épargne · 8 Produits · 9 Agences/zones/calendrier/portefeuille · 10 Doublons avec le cœur · 11 Écarts avec les modules partagés · 12 Tableau d'écarts · 13 Questions bloquantes.

Légende : « décoratif » = bouton sans action ; « simulé » = écrit dans le navigateur (`localStorage`) ou tiré d'une constante ; « réel » = calcul local effectif.

---

## 1. Fiche client, emprunteurs, KYC

### 1.1 Écrans
| Écran (chemin) | Rôle | Contenu | Actions |
|---|---|---|---|
| `/clients` (`FE/app/(dashboard)/clients/page.tsx:5-13`, `FE/components/collecte/MesClientsCollecteView.tsx:26-173`) | agent de collecte (COLLECTRICE) | « Mes clients » : cartes (nom, activité, téléphone, zone, encours, retard `J+n`, score), bandeau agent (collecte du jour / objectif, nb en retard), 4 onglets Tous / Actifs / En retard / Prospects, recherche nom ou zone | « Nouveau client » (lien réel), ouvrir une fiche (réel) |
| `/clients/nouveau` (`FE/app/(dashboard)/clients/nouveau/page.tsx:1-201`) | agent | Formulaire : nom\*, prénom, téléphone\*, zone / quartier, activité, secteur (COMMERCE, ARTISANAT, AGRICULTURE, SERVICES), adresse, type (CLIENT collecte / TONTINE / PROSPECT) | Enregistrer : essaie `useCreateProspect` (API) puis, en repli, `saveSessionClient` en `localStorage` (`FE/lib/clients-session.ts:57-84`) : simulé |
| `/clients/[id]` (`FE/app/(dashboard)/clients/[id]/page.tsx:25-56`, `FE/components/collecte/FicheClientCollecte.tsx`) | agent | Fiche : score en anneau (tendance HAUSSE / BAISSE / STABLE), appel `tel:`, WhatsApp `wa.me`, 8 KPI (encours, crédit initial, remboursé %, retard, mensualité, prochaine échéance, ponctualité %, nb crédits), profil (activité, activité 2, revenu estimé, membre depuis, segment, produit, garantie, groupe tontine), comportement de collecte (canal préféré, contact préféré, dernier paiement, visites par mois), mini-carte GPS, 5 onglets (calendrier de recouvrement, paiements, visites, alertes IA, demandes de crédit), « Profil financier détaillé » | « Demande de crédit » (modal), appel, WhatsApp. Le bouton est masqué si le statut est `DEFAUT` (`FicheClientCollecte.tsx:78`) |
| Modal « Demande de crédit » (`FE/components/collecte/DemandeCreditModal.tsx:10-189`) | agent | Produit (liste en dur : Crédit Commerce, PME, Agricole, Tontine, Express), montant (min 50 000, pas 10 000, défaut 500 000), durée (3 à 36 mois, défaut 12), objet | Soumettre : crée un dossier via l'API si `API_CREDIT_PHASE2_ENABLED`, sinon `saveDemandeCredit` en `localStorage`, statut `SOUMIS`, référence `DOS-` + 4 chiffres tirés au hasard : simulé. Aucun contrôle d'éligibilité (score, ancienneté), aucune simulation d'échéancier dans le modal |
| `/emprunteurs` (`FE/app/(dashboard)/emprunteurs/page.tsx:26-186`) | DG, RA (cadré sur son agence), GP (vue « Mes clients » à part) | Tableau paginé (20 par page), filtres (statut, zone, agent, score min / max), 4 onglets Tous / Critiques (score < 40) / En retard (retard > 0) / Sains (score ≥ 70), tri par colonne | « Nouveau emprunteur » : **décoratif** (`:109-112`, aucun `onClick`). Le RA n'a pas le bouton |
| `/emprunteurs/[id]` (`FE/app/(dashboard)/emprunteurs/[id]/page.tsx:9-45`, `FE/components/credit/FicheClientMicrofinance.tsx:19-25`) | RA, GP, DG | Fiche 6 onglets : Synthèse, Identité & KYC, Activité, Crédits & échéancier, Recouvrement, Risque BCEAO | lecture |
| `/kyc` (`FE/components/kyc/KycView.tsx:1-140`, `FE/lib/kyc-hub.ts:43-92`) | conformité / agence | 5 KPI (complets 2 847, incomplets 14, expirés 8, en vérification 6, conformité 94 %), file prioritaire (3 lignes), liste de dossiers, pièces jointes du dossier choisi avec score OCR | Sélection d'un dossier (réel) ; bouton d'ajout de pièce (`KycView.tsx:108`) : **décoratif** ; aucun bouton Valider / Rejeter |

### 1.2 Données
- **Emprunteur** (`FE/types/index.ts:40-59`) : `id, nom, telephone, score_ia (0-100), score_tendance, montant_credit, montant_rembourse, statut, retard_jours, agent, lat, lng, zone, derniere_visite, createdAt, historique_paiements, visites, alertes_ia`. Statuts : REMBOURSEMENT, RETARD, DEFAUT, RESTRUCTURE, EVALUATION (prospect), INSTRUCTION (nouveau client) (`types/index.ts:31-37`, libellés `clients-session.ts:125-135`).
- **Identité** (`FE/lib/fiche-client-microfinance.ts:23-43`) : prénom, nom, genre F/M, date de naissance, âge, nationalité, situation matrimoniale, personnes à charge, CNI (numéro, date de délivrance, lieu), adresse domicile, adresse activité, GPS, téléphone principal, secondaire, WhatsApp, e-mail, contact d'urgence (prénom, nom, lien, téléphone).
- **Activité économique** (`:45-58`) : secteur, sous-secteur, description, ancienneté (années), lieu d'exercice, n° de stand, effectif, CA mensuel, charges mensuelles, marge nette, saisonnalité, concurrence.
- **Pièces KYC de la fiche** (`:68-74`, `:77-91`) : CNI (référence, dépôt, expiration), justificatif de domicile, photo client ; la « fiche visite terrain (RA/GP) » s'ajoute seulement s'il y a une demande de crédit. Statuts : VALIDE, EXPIRE, MANQUANT, EN_ATTENTE.
- **Dossier KYC du module `/kyc`** (`kyc-hub.ts:3-28`) : niveau SIMPLIFIE / STANDARD / RENFORCE ; statut COMPLET, INCOMPLET, EXPIRE, EN_VERIFICATION, REJETE ; `score_conformite_ia` ; alertes ; pièces (types CNI, PASSEPORT, ATTESTATION_DOMICILE, PHOTO, CONTRAT, JUSTIFICATIF_REVENU ; statut VALIDE / EN_ATTENTE / REJETE / EXPIRE ; `verifie_par`, `score_ocr_ia`, `date_expiration`).
- **Cautionnaire** (`fiche-client-microfinance.ts:109-122`) : ordre, prénom, nom, lien, téléphone, contact d'urgence, profession, CNI, revenu mensuel, statut (ACTIF, APPELE, INJOIGNABLE, REALISE, REFUSE), date et montant d'engagement.
- **Garantie** (`:97-107`) : STOCK, MATERIEL, CAUTION, HYPOTHEQUE, DEPOT_GAGE ; description, valeur estimée, couverture %, statut (ACTIF, REALISE, INSUFFISANT, MANQUANT).
- **Compte d'épargne lié** (`:60-66`) : numéro, produit, solde, statut ACTIF / DORMANT / BLOQUE, dernier mouvement (la fiche client affiche donc un solde d'épargne : voir section 10).

### 1.3 Règles et seuils (valeur de démo = futur paramètre de l'IMF)
| Règle | Valeur de la démo | Source |
|---|---|---|
| Cautionnaires minimum | 2 (constante `MIN_CAUTIONNAIRES`) ; sont comptés ceux au statut ACTIF ou REALISE | `fiche-client-microfinance.ts:107`, `:166-168` |
| Dépôt de garantie | 0 jusqu'à 300 000 ; 10 % du montant au-dessus de 300 000 ; 15 % au-dessus de 1 000 000 ; porté par un « compte épargne bloqué » | `:145-153`, `:166`, `:502-507` |
| Garantie réelle (stock, matériel, nantissement) | 0 jusqu'à 500 000 ; ≥ 30 % du montant au-dessus de 500 000 ; ≥ 50 % au-dessus de 1 000 000 | `:149-153`, `:172` |
| Couverture totale | 50 % cautions + 20 % dépôt + 30 % garantie réelle ; cautions : 100 si le minimum est atteint, sinon (valides ÷ 2) × 50 | `:206-211` |
| Éligibilité produit | score minimum et ancienneté minimum (cahier : 45 et 3 mois en exemple) ; **non contrôlée par la démo** | CDC:745-746 |
| Bande de score | critique < 40, surveiller 40-69, sain ≥ 70 ; facteur de score : FORT ≥ 75, MOYEN ≥ 55, FAIBLE ≥ 35, sinon CRITIQUE | `types/index.ts:39`, `fiche-client-microfinance.ts:586-591` |
| Montant et durée d'une demande | montant ≥ 50 000 par pas de 10 000 ; durée 3-36 mois | `DemandeCreditModal.tsx:140-141,152-153` |

Note : le récit du PO fixe « au moins 2 cautions au-dessus d'un seuil » (`brain-dump:71-73`) ; la démo, elle, impose les 2 cautions à tout montant (le seuil de 500 000 de la démo porte sur la garantie réelle et sur les 2 visites, pas sur les cautions).

Calcul : le score client (« score IA Prospera, modèle XGBoost »), le score CBI, la PD, la LGD, la perte attendue (`el_fcfa`), la classe BCEAO, la provision (`provision_pct`, `provision_fcfa`), le DTI et le ratio encours/revenu sont **des valeurs semées** ; l'« explication » en facteurs pondérés est reconstruite pour retomber sur le score cible (`ajusterContributions`, `fiche-client-microfinance.ts:581-585`) : constantes, pas un modèle (`:575-640`). Le récit du PO dit que le score est recalculé quand le dossier est complet (`brain-dump:68-69`).

### 1.4 Statuts et transitions
- Client : création → INSTRUCTION (client) ou EVALUATION (prospect) (`clients-session.ts:67`) ; aucune autre transition dans la démo.
- Dossier KYC : aucune transition dans la démo (lecture seule). Le cahier n'a pas de section KYC ; `SPEC/17-ops-kyc.md` redit le contenu du hub.
- Demande de crédit : naît `SOUMIS` (`clients-session.ts:30,104-105`) ; le reste du circuit relève du crédit.

### 1.5 Hors ligne
La création de client et la demande de crédit se rabattent sur `localStorage` si l'appel échoue (`clients/nouveau/page.tsx:38-60`, `DemandeCreditModal.tsx:41-80`). Ce n'est pas une file de synchronisation : aucun identifiant d'idempotence, identifiant `new-<horodatage>`, GPS fixé en dur à 6,131 / 1,220 (`clients-session.ts:58,70-71`). Une « photo KYC » hors ligne existe dans la file de `/terrain/offline` (type `PHOTO_KYC`, 890 Ko ; conseil « compresser sous 500 Ko », `SPEC/24-ops-terrain-offline.md`).

### 1.6 Doublon avec le cœur et ce qui ne vient que de lui
- Doublon : identité, KYC, solde d'épargne lié et encours existent aussi dans le cœur (le client y est titulaire de comptes).
- Ne vient que du cœur : numéro de client, numéros de compte, soldes, encours comptable, classe de risque réglementaire officielle.
- Proposition (sans trancher) : Prospera reçoit du cœur les clients, les comptes liés (numéro, produit, statut, solde) et les prêts ; il lui renvoie les prospects convertis (client à créer), les pièces KYC numérisées et la demande accordée. La clé de correspondance (numéro de client du cœur) est à fixer.

---

## 2. Groupes solidaires et tontines

### 2.1 Écrans
`/groupes` (`FE/app/(dashboard)/groupes/page.tsx`, `FE/components/groupes/GroupesView.tsx:1-118`, hub `FE/lib/groupes-hub.ts:51-105`) : 6 KPI (groupes actifs 47, membres 612, encours groupe 28,4 M, taux de cotisation 91 %, réunions de la semaine 12, défauts de groupe 4), liste, fiche du groupe sélectionné (score de cohésion IA, tableau des membres avec rôle, cotisation, statut de paiement, score), réunions à venir (lieu, présents / total, décisions). Aucun bouton d'écriture (création de groupe, ajout de membre, présence, tirage au sort) : la page est **en lecture seule**.

### 2.2 Données
- Groupe (`groupes-hub.ts:21-35`) : `id` (GS-014), nom, **type** TONTINE / SOLIDARITE / GARANTIE_CROISEE, agence, agent, nombre de membres, encours crédit, encours épargne, **cycle actuel** (3 ; 14 pour la tontine), statut ACTIF / SUSPENDU / CLOTURE, prochaine réunion, score de cohésion IA (88, 72).
- Membre (`:3-10`) : rôle PRESIDENT / TRESORIER / MEMBRE ; cotisation (50 000 en garantie croisée, 10 000 en tontine) ; statut A_JOUR / RETARD / EXCLU ; score.
- Réunion (`:12-19`) : date, lieu, présents, total, décisions (« Validation décaissement DC-2919 », « Tirage au sort cycle 14 », « Régularisation cotisations retard »).

### 2.3 Règles
- Garantie croisée de 5 à 15 membres (produit CRED-GRP : 500 000 à 5 000 000, 6-24 mois, 22 %/an, frais 1,5 %, assurance obligatoire : `SPEC/14-ops-produits.md`).
- Tontine : cotisation rotative hebdomadaire de 2 000 à 50 000 (produit TONT-SOL, même source).
- Le cahier n'a **pas de section groupes** ; il cite seulement l'épargne tontine (hebdomadaire, redistribution à l'échéance du cycle ; dormance après 2 cycles manqués : `CDC:630,640`).
- Cohésion, taux de cotisation, défauts, « risque de contagion » : constantes et texte statique, aucun calcul.

### 2.4 Doublon et cœur
Un groupe qui porte un prêt de groupe et une épargne de groupe (2,4 M de crédit, 890 000 d'épargne) est, dans le cœur, un client collectif avec ses comptes. Proposition : le cœur fait foi pour le compte et le solde du groupe ; Prospera tient la composition (membres, rôles), le calendrier de réunions, la cohésion et la caution mutuelle. C'est la capacité « Groupe solidaire » déjà prévue au noyau (`PRD-D` §6.0, tableau).

---

## 3. Terrain (visites géolocalisées, hors ligne, synchronisation)

### 3.1 Écrans
| Écran | Rôle | Contenu | Actions |
|---|---|---|---|
| `/terrain` (`FE/app/(dashboard)/terrain/page.tsx:26-114`) agent / collectrice / commercial | AGENT_TERRAIN, COLLECTRICE, COMMERCIAL | Carte de sa zone (`MaZoneCard`), missions de recouvrement (agent seulement), bandeau hors ligne, carte Leaflet des visites du jour, légende de 3 agents (noms en dur `:20-24`) | liens « Hors-ligne », « Nouvelle visite », « Historique » (réels) |
| `/terrain` vue RA (`:50-62`, `FE/components/ra/TerrainRaBlock.tsx`, hub `FE/lib/ra-terrain-zones-hub.ts`) | RA | « Couverture terrain » de l'agence : 5 KPI (micro-zones, couverture moyenne %, visites réalisées / prévues, agents actifs, clients cartographiés), onglets Carte & zones / Visites / Micro-zones, liste « zones à renforcer (< 70 %) », fiche d'une visite, d'un agent, d'une zone | sélection (réel) ; aucune création de mission (le cahier l'exige, `CDC:267`) |
| `/terrain` vue GP (`:35-48`, `FE/components/gp/GpTerrainView.tsx`) | GP | localisation des 300 clients du portefeuille, relances prioritaires | lecture |
| `/terrain/nouvelle-visite` (`FE/app/(dashboard)/terrain/nouvelle-visite/page.tsx`, `FE/components/terrain/VisitForm.tsx:46-268`) | agent | Formulaire : nom\*, ID client (vide = prospect), téléphone prospect\* si pas d'ID, méthode de contact (visite terrain, porte-à-porte, appel, brochure, lettre), statut de la réponse (positive, négative, sans réponse), commentaire, GPS, carte OpenStreetMap avec repère déplaçable | « Détecter ma position GPS » (réel, `navigator.geolocation`), « Enregistrer » (appel API, sinon rien n'est gardé : le `catch` est vide, `:97-99`) |
| `/terrain/historique` (`FE/app/(dashboard)/terrain/historique/page.tsx`) | RA, GP | filtres période (jour, semaine, mois), agent, statut ; camembert par statut ; visites par agent ; « emprunteurs prêts à revisiter » | lecture |
| `/terrain/offline` (`FE/app/(dashboard)/terrain/offline/page.tsx`, `FE/components/terrain/TerrainOfflinePanel.tsx:25-128`, `FE/lib/terrain-offline-hub.ts`) | agent | bascule « en ligne / hors ligne », « Synchroniser maintenant », 5 KPI (en attente, visites non synchronisées, collecte en file, conflits, stockage Mo), file de synchronisation (type, libellé, date, taille, statut), historique des synchronisations, conseils IA | voir ci-dessous |
| `/terrain-with-api` (`FE/app/(dashboard)/terrain-with-api/page.tsx:21-90`) | idem | même écran branché sur `GET /visites` ; panneau « Missions recouvrement » (clients en retard, promesses à suivre, activité récente : `AgentMissionsPanelWithApi.tsx`) | interface seulement ; on retient les capacités : missions de recouvrement du jour, promesses à suivre |

### 3.2 Ce qui est simulé et ce qui est réel
- **Bascule hors ligne et synchronisation : simulées.** « Mode hors-ligne » ne change qu'un booléen d'affichage (`TerrainOfflinePanel.tsx:43-45`). « Synchroniser » attend 1,5 s puis passe tout à `SYNC` et remet les compteurs à zéro (`:29-41`). Aucun stockage local de visite, aucune file persistante, aucune idempotence. Le cahier prévoit IndexedDB / Dexie (`CDC:851`) ; le PRD distributeur exige une application mobile Flutter hors connexion (`PRD-D` FR-109).
- **Incohérences de chiffres** : « collecte en file » vaut 165 000 (`terrain-offline-hub.ts:40`) alors que la file n'en contient que 120 000 (OFF-2) ; la synthèse dit « collecte 45 k » ; le secondaire dit 165 000 (`SPEC/24-ops-terrain-offline.md`). À ne pas reprendre comme règle.
- **GPS** : le repère de la carte est déplaçable à la main et un clic le déplace (`VisitForm.tsx:21-44`), donc la position n'est pas une preuve de présence. Aucun calcul de distance entre l'agent et le client, aucun seuil, aucune photo (`Visit.photo_url` existe dans le type mais pas dans le formulaire : `FE/types/index.ts:93`). Défaut de position : Lomé 6,1374 / 1,2123 (`:57-58`).
- **« Alerte de proximité »** (`FE/components/terrain/ProximityAlert.tsx`) : ce n'est pas l'alerte du cahier (agent à moins de 200 m d'un client en retard, `CDC:227,274`). Dans la démo, elle liste les adresses **déjà visitées** autour de la position (contrôle anti-doublon de prospection) ; la distance affichée est tirée au hasard entre 5 et 50 m (`FE/hooks/useVisits.ts:65-71`).
- **Indicateurs de couverture** (`ra-terrain-zones-hub.ts`) : `gps_conformite_pct = min(99, couverture + 6)`, `gps_alerte = couverture < 70 %` : formules de démo, pas une mesure GPS réelle. Seuil « zone à renforcer » : couverture < 70 %.
- **Missions** : l'ordre optimisé, le gain de 18 % en distance, la durée moyenne de visite de 25 minutes et le rapport du soir à 18 h 00 sont dans le cahier (`CDC:225-234,273-276`) et dans le secondaire `SPEC/08-dashboard-agent-terrain.md` (texte de synthèse), pas dans un calcul du front.

### 3.3 Données (visite)
`Visit` (`FE/types/index.ts:80-96`) : id, emprunteur (id, nom), agent (id, nom), lat, lng, adresse, méthode (VISITE_TERRAIN, PORTE_A_PORTE, APPEL, BROCHURE, LETTRE), statut de réponse (POSITIVE, NEGATIVE, SANS_REPONSE), commentaire, commentaire additionnel, photo, date, distance (m). Le formulaire accepte aussi `nom_prospect` et `telephone_prospect`.
Cahier (`CDC:236-245`) : 6 types de visite (instruction de dossier, collecte, prospection, recouvrement, routinière, urgente) ; statuts `BROUILLON`, `VALIDEE`, `REJETEE` avec motif ; `client_uuid` et `created_at_local` pour la file.
Récit du PO (`brain-dump:75`) : 2 visites au moins au-dessus de 500 000 FCFA, domicile et lieu d'activité, photo et GPS exigés par visite. Aucun de ces contrôles n'existe dans la démo.

### 3.4 Règles et seuils du cahier (futurs paramètres de l'IMF)
| Règle | Valeur | Source |
|---|---|---|
| Géofencing de la visite | distance agent-client < 100 m (défaut, configurable), jugée côté serveur | `CDC:229,302,908` |
| Photo | obligatoire, JPEG ou PNG, 5 Mo maximum | `CDC:229,889` |
| Alerte de proximité | agent à moins de 200 m d'un client en retard | `CDC:227` |
| Priorité des missions | retards > échéances J-3 > prospects > visites routinières | `CDC:225` |
| Durée de visite moyenne | 25 minutes | `CDC:273` |
| Alerte d'inactivité | agent sans visite après 10 h 00 | `CDC:265` |
| Actualisation de la carte du RA | 5 minutes | `CDC:263` |
| Rapport du soir | 18 h 00, coaching si objectif < 80 % | `CDC:276` |
| Expiration d'une visite hors ligne | plus de 7 jours : alerte à l'agent | `CDC:898` |
| Stockage local | 500 Mo maximum | `CDC:894` |
| Synchronisation | 50 visites en moins de 30 s ; visites urgentes de recouvrement en tête | `CDC:910,896` |
| Perte d'un solde | les soldes ne changent pas tant que la synchronisation n'est pas validée côté serveur | `CDC:257` |

### 3.5 Hors ligne : conflits et synchronisation (cahier)
- Saisie d'une visite ou d'une collecte sans réseau : file locale avec `client_uuid` (UUID v4 généré sur l'appareil) et heure locale ; à la reconnexion, envoi par lot (`POST /visites/batch`), le serveur vérifie l'idempotence et le géofencing visite par visite, accepte ou rejette avec motif ; l'appareil affiche succès / erreur par visite (`CDC:247-257,324-327`).
- Conflit : une même visite envoyée deux fois est dédupliquée par `client_uuid` (`CDC:897`) ; pour les encaissements, `client_uuid` unique et déduplication sur 5 minutes (`CDC:887`).
- File de la démo : types VISITE, COLLECTE, REMBOURSEMENT, NOUVEAU_CLIENT, PHOTO_KYC ; états SYNC, EN_ATTENTE, CONFLIT, ERREUR ; historique OK / PARTIEL / ECHEC (`terrain-offline-hub.ts:3-30`). Les photos KYC pèsent 890 Ko dans l'exemple et le conseil est de les compresser sous 500 Ko.
- Ce que le PRD distributeur a déjà tranché et que le PRD microfinance peut reprendre : serveur seul juge, heure du serveur fait foi pour l'ordre, clé d'idempotence par encaissement, état de synchronisation visible (à envoyer, envoyé, confirmé, refusé avec motif), une seule visite `EN_COURS` par agent, appareil perdu = déconnexion à distance avec envoi de la file avant effacement (`PRD-D` FR-101, FR-104, FR-109, FR-110).

### 3.6 Écarts avec le module partagé `terrain` (M12, PRD distributeur §6.1)
Le noyau Visite / Tournée / Remise d'espèces / Écart de caisse / Position convient à l'IMF (le PRD distributeur propose déjà les mots IMF : agent de crédit ou de collecte, membre, visite de collecte, rendez-vous d'octroi, suivi de groupe, tournée de collecte, versement de caisse : `PRD-D` §6.1, tableau). Écarts propres à l'IMF à porter dans le PRD microfinance :
1. **Résultats de visite** : le noyau a commande, encaissement, promesse, sans suite, client absent. L'IMF y ajoute « demande de crédit » (déjà prévu au vocabulaire), mais aussi « collecte d'épargne », « photo KYC / mise à jour de fiche » et, pour le crédit, les visites d'instruction exigées par le dossier (2 au-dessus de 500 000, photo et GPS, `brain-dump:75`). La visite d'instruction est liée à un dossier de crédit, pas à une commande.
2. **Motifs** : le noyau a relance d'impayé, réclamation, réassort, lancement de produit, fidélisation, prospection. Réassort et lancement de produit n'existent pas à l'IMF ; l'IMF a instruction de dossier, collecte d'échéance, collecte tontine / épargne, recouvrement, routinière, urgente (PAR élevé), suivi de groupe.
3. **Preuve de présence** : le noyau juge « sur place » à 200 m, avec motif obligatoire hors rayon et alerte au superviseur (`PRD-D` FR-102). Le cahier de l'IMF dit 100 m, photo obligatoire et rejet de la visite (`CDC:229,302,908`). Il faut trancher un seuil et dire si le hors-rayon bloque (cahier) ou signale (noyau).
4. **Carte** : le noyau utilise Google Maps (`PRD-D` FR-106) ; la démo et le cahier utilisent Leaflet et OpenStreetMap (`CDC:213,849`).
5. **Rôles** : le noyau a agent, superviseur, comptable ; l'IMF a agent terrain, collectrice, GP, RA, ROC (récit du PO §4), avec le RA qui supervise l'agence et crée une mission urgente.
6. **Pas de commande, de stock ni de catalogue** : les exigences FR-103 (commande) et FR-108 (disponibilité) sont « non installé » (`PRD-D` §6.1, « propre au distributeur »). À l'IMF, la « commande » est une demande de crédit et la disponibilité n'existe pas.
7. **Plan de journée** : le noyau le génère chaque soir pour le lendemain (FR-173). Chez l'IMF, la matière du plan est l'échéancier : échéances J-3, retards, promesses du jour, relances J+7 qui créent une mission (`CDC:365-371`), prospects. Le motif se déduit de l'état de l'échéance de prêt, pas d'une créance de facture.
8. **Prospect** : à l'IMF, une visite de prospection crée un prospect (nom, téléphone, zone, activité, GPS) qui devient un client après KYC et score ; ce cycle n'est pas dans le noyau (le point de vente à l'état `PROSPECT` du distributeur y ressemble).

---

## 4. Collecte (remboursements et épargne collectés sur le terrain)

### 4.1 Écrans
- `/clients` + fiche client (section 1) : l'agent y voit encours, mensualité, prochaine échéance, ponctualité, canal de collecte préféré (ESPECES, MOMO, TONTINE, VIREMENT : `FE/lib/collecte-agent-hub.ts:15-37`).
- Bloc « Collecte — agrégats » (`FE/components/collecte/CollecteAgregatsBlock.tsx:9-47`, `GET /collecte/agregats`) : jour et mois, montant / objectif / taux, synthèse IA.
- Tableau de bord de l'agent (`FE/components/dashboard/roles/DashboardTerrain.tsx`) : « À collecter » du jour, taux de collecte, collecte par groupe de tontine (collecté / prévu), objectif mensuel, comparaison avec l'équipe. Secondaire : `SPEC/08-dashboard-agent-terrain.md` (résumé de la journée : 23 clients à visiter, 385 000 à collecter, 8 tontines, 9 clients en retard, objectif du jour 450 000) et `SPEC/06-dashboard-responsable-commercial-collecte.md` (collecte du jour 3,85 M sur 4,7 M prévus, soit 82 % ; régularité 88 % ; collecte par secteur).
- **Il n'y a pas d'écran de saisie d'un encaissement terrain dans la démo hors API.** La visite n'a pas de champ « montant collecté » (`VisitForm.tsx`) alors que le cahier le demande (`CDC:241`). Le seul bouton d'encaissement est « Encaisser une échéance » du panneau de recouvrement du GP, qui n'existe qu'avec l'API (`FE/components/gp/GpRecouvrementPanel.tsx:166`, action `PAYER_ECHEANCE`) : on retient la capacité, pas l'API.

### 4.2 Règles (cahier et récit du PO)
- Trois canaux de flux : **TONTINE** (collecte terrain : validée aussitôt, solde client crédité, écriture comptable), **AGENCE** (guichet espèces : validée aussitôt), **MOBILE** (Mobile Money : `EN_ATTENTE` jusqu'à validation par le comptable) (`CDC:489-495`).
- Un encaissement terrain est lié à l'échéance s'il y a un dossier actif (`CDC:231`).
- Un paiement Mobile Money est rattaché à l'échéance automatiquement si l'écart est inférieur à 1 % (`brain-dump:98`, `CDC:507,563`) ; le cahier dit aussi « montant exact » dans une autre ligne (`CDC:533`) : contradiction à résoudre (1 % ou exact).
- Détection de fraude d'espèces : écart entre la collecte déclarée et les transactions validées supérieur à 5 000 FCFA (défaut) → alerte à l'auditeur et au DAF (`CDC:534`).
- Doublons : même client, même montant à ± 100 FCFA, fenêtre de 5 minutes → alerte, validation automatique bloquée (`CDC:532`).
- L'IA n'écrit jamais une écriture comptable ni ne valide un Mobile Money (`CDC:203`).

### 4.3 Hors ligne
Une collecte hors ligne est une action de la file (type COLLECTE, 8 Ko, `terrain-offline-hub.ts:46`) ; le solde du client ne bouge qu'après validation serveur (`CDC:257`).

### 4.4 Doublon avec le cœur et ce qui ne vient que de lui
- Doublon : la démo crédite « le solde client » à la validation d'une collecte (`CDC:493,505`) et génère l'écriture comptable (`CDC:566`). Dans le cœur, le solde, le remboursement imputé à l'échéance et l'écriture sont à lui.
- Proposition (sans trancher) : Prospera enregistre la collecte (agent, client, montant, canal, géolocalisation, reçu, identifiant d'idempotence), la rattache à une échéance, puis la **renvoie** au cœur comme remboursement ou dépôt à passer ; le cœur répond par l'accusé et l'imputation officielle, et Prospera recalcule échéancier, PAR et relances à partir de ce que le cœur confirme. Tant que le cœur n'a pas accusé réception, la collecte est « déclarée », pas « confirmée » (même mécanique que les encaissements déclarés du distributeur : `PRD-D` FR-104, FR-105).
- Dans la démo fictive de Money Vibes, le cœur fictif joue ce rôle d'accusé de réception.

---

## 5. Caisse (guichet, clôture quotidienne, écarts)

### 5.1 Écrans
| Écran | Rôle | Contenu | Actions |
|---|---|---|---|
| `/caisse` DAF / réseau (`FE/app/(dashboard)/caisse/page.tsx:41-51`, `FE/components/caisse/CaisseView.tsx:14-79`) | DAF (« Trésorerie réseau ») | bandeau « trésorerie ≠ épargne », 6 KPI (liquidité totale, entrées jour, sorties jour, écart de clôture, écart MoMo, agences non clôturées), 5 onglets Position / Flux jour / Clôtures / MoMo / Virements | lecture, pagination (aucun bouton d'écriture dans `FE/components/caisse/CaisseTables.tsx`) |
| `/caisse` RA (`:27-39`) | RA | même vue limitée à l'agence, KPI « couverture réserve » à la place des agences non clôturées | lecture |
| `/caisse` DG (`FE/components/caisse/CaisseDgView.tsx`) | DG | liquidité du réseau sur 5 agences, tension par agence, alertes, actions prioritaires (texte statique) | lecture |
| `/caisse-with-api` (`FE/components/caisse/CaisseViewWithApi.tsx`, `CaisseGuichetPanelWithApi.tsx`, `MomoValidationPanelWithApi.tsx`) | comptable | capacités : saisie guichet dépôt / retrait (montant, identifiant client optionnel), file d'attente des paiements Mobile Money `EN_ATTENTE`, **Valider** et **Rejeter** par transaction, onglets Mouvements / Clôture journalière / Rapprochement MoMo, statistiques du jour (solde net, entrées, sorties, nombre de dépôts et de retraits) | « Rejeter » envoie un motif fixé en dur « Rejet comptable » (`MomoValidationPanelWithApi.tsx:27`), alors que le cahier exige un motif saisi avec liste de motifs (`CDC:546`) ; la **clôture** n'a pas de bouton de saisie du comptage physique dans la démo (le cahier le demande : `CDC:552`) |

### 5.2 Données
- Flux de caisse (`FE/lib/caisse-hub.ts:3-33`) : type (DECAISSEMENT, REMBOURSEMENT, VIREMENT_INTER_AGENCE, APPROVISIONNEMENT, FRAIS_GESTION, RETRAIT_EPARGNE, DEPOT_EPARGNE), canal (ESPECES, MOMO_MIXX, MOMO_FLOOZ, VIREMENT, CHEQUE), sens ENTREE / SORTIE, libellé, montant, agence, agent, pièce, rapproché.
- Position par agence (`:35-47`) : caisse physique, float Mixx, float Flooz, total disponible, réserve obligatoire, ratio de couverture, statut OK / TENSION / CRITIQUE, encours de crédit, décaissements prévus du jour.
- Clôture journalière (`:49-60`) : date, agence, solde théorique, solde physique, écart, statut OUVERTE / VALIDEE / ECART, validateur, heure de clôture, nombre d'opérations du jour.
- Rapprochement Mobile Money (`:73-84`) : opérateur (MIXX, FLOOZ), solde plateforme, solde comptable, écart, nombre non rapproché, statut OK / ECART / EN_COURS ; transaction non rapprochée : référence externe, statut NON_LETTRE / EN_COURS / LETTRE.
- Virement inter-agences (`:86-95`) : émetteur, bénéficiaire, montant, motif, statut EXECUTE / EN_ATTENTE / ANNULE, validateur.

### 5.3 Règles, seuils et calculs
| Règle ou calcul | Valeur de la démo | Source |
|---|---|---|
| Réserve obligatoire par agence | 300 000 FCFA par défaut, sinon la valeur du détail de l'agence (« seuil minimum BCEAO par agence » dans le glossaire) | `FE/lib/caisse-registry.ts:29`, `caisse-hub.ts` (glossaire) |
| Statut de tension | `TENSION` si total disponible < 120 % de la réserve ; la démo force `CRITIQUE` pour l'agence Bè Kpota (cas écrit en dur) | `caisse-registry.ts:34-35` |
| Ratio de couverture | total disponible ÷ réserve × 100 | `caisse-registry.ts:32`, `caisse-hub.ts` (vue agence) |
| Écart de clôture | solde théorique − solde physique ; valeurs écrites en dur (Bè Kpota 42 000, Hédzranawoé 0) | `caisse-registry.ts:144-165` |
| Statut de clôture | OUVERTE, VALIDEE (heure 18:00), ECART ; écrits en dur par agence | `caisse-registry.ts:140-165` |
| Écart Mobile Money | somme des transactions NON_LETTRE de l'agence | `caisse-hub.ts` (vue agence) |
| Seuil d'alerte de fraude sur espèces | 5 000 FCFA (défaut) | `CDC:534` |
| Décaissement en espèces | réservé au comptable ou au DAF | `CDC:515`, `brain-dump:93` |
| Fonds de caisse | alimentation ou prélèvement, traçabilité DG / DAF obligatoire | `CDC:516` |
| Retrait | vérifie le solde disponible | `CDC:514` |
| Heure limite de décaissement | « valider avant 16 h pour le cut-off BOA » (texte de synthèse du secondaire) | `SPEC/23-ops-core-banking.md` |
| Rapprochement Mobile Money automatique | lancé à 19 h (texte de synthèse) ; recommandation : clôturer avant 18 h | `SPEC/19-ops-caisse.md` |

Processus de clôture du cahier (`CDC:518-526`) : (1) le comptable valide ou rejette toutes les transactions `EN_ATTENTE` (file à 0) ; (2) compte les espèces ; (3) le système compare attendu et déclaré ; (4) le comptable clôture, le registre est validé ; (5) alerte au DAF et à l'auditeur si l'écart dépasse le seuil. Il n'y a ni seuil de clôture ni règle « verrouillage de la journée » chiffrés pour l'écart de clôture (le seuil de 5 000 est celui de la fraude sur collecte).

### 5.4 Statuts et transitions
- Transaction : `EN_ATTENTE` → `VALIDE` ou `REJETE` (motif obligatoire) pour le canal MOBILE ; `VALIDE` immédiat pour TONTINE et AGENCE (`CDC:493-495`).
- Clôture : `OUVERTE` → `VALIDEE` (écart nul ou accepté) ou `ECART`.
- Rapprochement : `EN_COURS` → `OK` ou `ECART` ; transaction `NON_LETTRE` → `EN_COURS` → `LETTRE`.
- Virement inter-agences : `EN_ATTENTE` → `EXECUTE` ou `ANNULE`.

### 5.5 Hors ligne
La caisse de guichet n'est pas prévue hors ligne (aucune file) ; seul le terrain l'est.

### 5.6 Doublon avec le cœur : la question la plus nette
- **Doublonne le cœur** : caisse physique par agence, position de trésorerie, flux de caisse (remboursements, décaissements, dépôts et retraits d'épargne), clôture et écart, réserve obligatoire, float Mobile Money et son rapprochement comptable, virements inter-agences. Le glossaire de la démo le dit lui-même : « rapprochement avec la **comptabilité Prospera** » (`caisse-hub.ts`, glossaire), alors que la comptabilité officielle est celle du cœur.
- **Ne peut venir que du cœur** : le solde de caisse et de banque faisant foi, la clôture comptable de la journée, les écritures.
- **Peut rester à Prospera** (proposition) : la saisie des opérations de guichet **comme un geste de l'agent** qui est transmis au cœur ; la file de validation des paiements Mobile Money (c'est un fait extérieur : opérateur ou PI-SPI) ; les remises d'espèces des agents de terrain (module `terrain`, déjà au noyau : `PRD-D` FR-105) ; les alertes d'écart ; la prévision de trésorerie à 7 jours.
- **Prospera pourrait recevoir du cœur** : solde de caisse théorique de la journée par agence, flux de caisse officiels, clôture validée (avec son écart), solde du compte opérateur. **Prospera pourrait lui renvoyer** : dépôts / retraits saisis, remboursements collectés, décaissements exécutés, remises d'espèces rapprochées. Quel côté tient la clôture de caisse est une question bloquante (section 13, Q2).
- Le PRD distributeur a déjà exclu la caisse de guichet de son périmètre (« module Caisse, objet B du PRD paiement ») : `PRD-D` §6.0 « hors périmètre », FR-105 « hors périmètre ». La caisse de guichet n'est donc couverte par aucun module partagé : elle est propre à l'IMF si le PO la veut.

---

## 6. Mobile Money et opérations bancaires

### 6.1 Mobile Money (démo : Flooz et Mixx by Yas, Togo)
- Opérateurs dans la démo : « Mixx By Yas » et « Flooz » (`caisse-hub.ts:14,73-84`, titres de `/caisse`). Le cahier dit `FLOOZ_MIXX` **unique**, tout autre opérateur rejeté en erreur 400 (`CDC:501,565,931,855`). Le secondaire de caisse montre MTN et MOOV (`SPEC/19-ops-caisse.md`, canaux `MOMO_MTN`, `MOMO_MOOV`), ce qui contredit la démo et le cahier : à ne pas reprendre.
- Décision du PO : Mobile Money par pays et par opérateur, et banques via PI-SPI (`brain-dump:155-156`). Donc `operateur_mobile` ne peut pas être une énumération à deux valeurs : c'est une donnée par pays.
- Écrans : voir caisse (onglet MoMo : rapprochement par opérateur, transactions non lettrées) et validation (Valider / Rejeter, section 5).
- Règles : une transaction Mobile Money naît `EN_ATTENTE`, le solde du client n'est pas modifié ; le comptable vérifie sur la console de l'opérateur (montant, numéro, référence) ; validation = solde crédité, rapprochement de l'échéance, écriture ; rejet = motif obligatoire, agent notifié, solde inchangé (`CDC:497-507`). Idempotence : `client_uuid`, Redis 5 minutes (`CDC:887`). Frais : produit « Frais Mobile Money » à 0,5 % (commission retrait / dépôt, `SPEC/14-ops-produits.md`).
- Lien de paiement : le message de relance contient un lien Flooz / Mixx avec montant et référence de dossier pré-remplis (`CDC:441`) ; relance J-3 par WhatsApp avec lien (`brain-dump:104`).
- Côté Prospera (proposition) : l'encaissement mobile est un moyen de paiement du module partagé `paiement` (mode `LIEN`, fournisseur PI-SPI ou FedaPay, opérateur en information : `PRD-D` FR-205, FR-206), et le rapprochement avec le relevé du fournisseur est celui de `paiement` (`PRD-D` FR-P37 à FR-P39). L'écart IMF : la validation par le comptable avant crédit du client, que `paiement` ne connaît pas (il constate l'encaissement chez le fournisseur) ; le déclarant ne confirme pas son propre encaissement (`PRD-D` FR-104).

### 6.2 Opérations bancaires (`/operations-bancaires`)
Ce n'est **pas** un cœur bancaire. L'écran « Core banking » de la démo est une vue des **prêts** : (`FE/components/banking/CoreBankingView.tsx:15-60`, hub `FE/lib/core-banking-hub.ts`, secondaire `SPEC/23-ops-core-banking.md`).
- 6 KPI : encours de crédit, décaissements du jour, décaissements en attente, échéances du jour, taux de remboursement, nombre de prêts actifs.
- 4 onglets : Prêts actifs, Décaissements, Échéancier, Refinancement. Aucune action d'écriture dans les tableaux.
- Prêt : référence (DC-2912), client, montant, taux annuel, durée, statut (DEMANDE, APPROUVE, DECAISSE, EN_COURS, SOLDE, IMPAYE, RESTRUCTURE), solde restant, prochaine échéance, agence, produit, score, mensualité, date de décaissement, échéances payées, jours de retard.
- Décaissement : prêt, client, montant, date prévue et effective, **canal CAISSE / VIREMENT / MOMO**, statut EN_ATTENTE / EXECUTE / ANNULE, validateur.
- Échéance : numéro, date, capital, intérêt, total, statut A_VENIR / PAYE / RETARD / IMPAYE. Exemple du secondaire : capital constant 200 000, intérêt 24 000 puis 20 000, 16 000, 12 000, 8 000, soit 2 % par mois sur le capital restant dû (1 200 000 au départ) : taux annuel proportionnel 24 %, amortissement du capital constant (`SPEC/23-ops-core-banking.md`, `echeancier_exemple`).
- Refinancement : prêt initial, montant initial, montant refinancé, économie mensuelle, statut ETUDE / APPROUVE / REJETE, motif IA.
- Taux des prêts de la démo : crédit individuel 24 %, microcrédit **28 %**, crédit groupe 22 %, crédit PME 24 %, crédit tontine 20 % (`FE/lib/core-banking-registry.ts:26-30`). Le microcrédit à 28 % dépasse le plafond de 24 % par an confirmé par le PO (`brain-dump:149-150`).
- Banques : la démo n'a aucun écran de virement bancaire, de chèque ni de PI-SPI ; le mot « virement » ne désigne que le canal de décaissement, le canal d'un dépôt d'épargne et les virements entre agences. Le cahier cite « virement, chèques (module complémentaire) » sans le décrire (`CDC:550`) et la mention « cut-off BOA » (banque) n'apparaît que dans un texte de synthèse. Le PO veut les banques via PI-SPI ; le PRD distributeur a déjà le mécanisme d'ordres de paiement préparés / validés à deux personnes et transmis par le fournisseur (`PRD-D` FR-209) : pour l'IMF, ce serait le décaissement par virement.

### 6.3 Doublon avec le cœur et ce qui ne vient que de lui
- Doublon : encours, solde restant dû, échéances payées, statut du prêt, décaissement exécuté : tout cela est dans le cœur de l'IMF dès qu'un prêt y est enregistré.
- Ne peut venir que du cœur : la confirmation qu'un décaissement a été exécuté (sortie de caisse ou de banque), l'imputation comptable d'un remboursement, la classification officielle.
- Proposition : Prospera reçoit clients, prêts, échéanciers officiels, paiements (récit du PO §2) ; il renvoie le dossier accordé et l'ordre de décaissement (canal, montant, bénéficiaire, validateur). Le canal de décaissement (caisse, Mobile Money, virement) et ses règles (espèces au guichet seulement par le comptable ou le DAF : `brain-dump:93`) restent des règles de Prospera, l'exécution est celle du cœur ou du fournisseur de paiement.

---

## 7. Épargne

### 7.1 Écrans
| Écran | Rôle | Contenu | Actions |
|---|---|---|---|
| `/epargne` agence (`FE/app/(dashboard)/epargne/page.tsx:18-29`, `FE/components/epargne/EpargneView.tsx:31-163`) | GP, RA, collectrice, agent, commercial (cadrés sur l'agence : `FE/lib/epargne-hub.ts:19-26`) | 6 KPI (encours, comptes actifs, dormants, dépôts jour, retraits jour, flux net), 3 onglets Comptes / Mouvements / Produits | « Ouvrir compte » : **décoratif** (`EpargneView.tsx:81-84`, aucun `onClick`) ; ouvrir un compte (réel) |
| `/epargne` DG (`FE/components/epargne/EpargneDgView.tsx`, `EpargneDgTables.tsx`) | DG | onglets comptes, mouvements, produits, dormants (« sans mouvement > 6 mois », potentiel 8 M sur 90 jours, `EpargneDgTables.tsx:320-334`), tontines (cycles, prochaine clôture, collecte %) | lecture ; aucun bouton « Relancer » (le cahier le demande, `CDC:668`) |
| `/epargne/[id]` (`FE/app/(dashboard)/epargne/[id]/page.tsx`, `FE/components/epargne/CompteEpargneDetailView.tsx`, `FE/lib/epargne-compte-detail.ts`) | idem | fiche : solde, produit, date et agent d'ouverture, mouvements, progression de l'objectif, intérêts cumulés ; selon le type : DAT (échéance, montant initial, durée restante, renouvellement automatique), tontine (cycle, membres), bloquée (crédit lié, couverture %, date de déblocage), à vue (plafond de retrait par jour, mandataire) ; crédit éligible ; analyse IA et alertes | lecture |

### 7.2 Données
- Compte (`FE/lib/epargne-hub.ts:68-80`) : id, client, numéro (format `373-xxxx-nn`, tontine `373-Tnnn`), **type** VUE / BLOQUE / TONTINE / DAT, solde, objectif, taux, agence, statut ACTIF / DORMANT / BLOQUE, dernier mouvement, score IA.
- Mouvement (`:82-91`) : type DEPOT / RETRAIT / INTERET / FRAIS, montant, solde après, canal CAISSE / MOMO / VIREMENT.
- Produit : VUE 2,5 %/an dépôt minimum 5 000 ; DAT 6 mois 8,5 %/an minimum 100 000 ; tontine 0 %, minimum 2 000, maximum 50 000 ; « épargne bloquée crédit » 4 %/an, minimum 50 000 (`SPEC/15-ops-epargne.md`, `SPEC/14-ops-produits.md`). Le cahier ajoute Épargne Projet et Plan Épargne Crédit (`CDC:626-632`).
- Statuts : ACTIF, DORMANT, BLOQUE ; cahier : ACTIF, CLOS, DORMANT_CONFIRME (`CDC:622,646`).

### 7.3 Règles, seuils, calculs
| Règle | Valeur | Source |
|---|---|---|
| Premier dépôt | ≥ dépôt minimum du produit | `CDC:616` |
| Fréquence de dépôt | quotidienne, hebdomadaire ou mensuelle selon le produit | `CDC:617` |
| Dormance compte à vue | 6 mois sans mouvement ; DAT : 3 mois après l'échéance non renouvelée ; tontine : 2 cycles manqués ; 12 mois sans réponse = `DORMANT_CONFIRME` | `CDC:636-646` |
| Dormance dans la démo | texte « > 6 mois » (`EpargneDgTables.tsx:331`, `epargne-compte-detail.ts:167`) mais jours d'inactivité tirés à 90 + hasard (`epargne-registry.ts:213`) et « > 90 jours » dans le secondaire : **incohérence** | |
| Potentiel d'un dormant | 1,4 × solde arrondi à 10 000 | `epargne-registry.ts:214` |
| Intérêts cumulés (DAT) | solde × taux × 0,45 (constante, pas un calcul d'échéance) | `epargne-compte-detail.ts:150` |
| Crédit éligible (cross-sell) | 1,5 × solde si solde ≥ 200 000 | `epargne-compte-detail.ts:161` |
| Plafond de retrait par jour (à vue) | min(solde ; 500 000) | `epargne-compte-detail.ts:204` |
| Compte bloqué | retrait impossible tant que le crédit lié est en cours ; couverture = solde ÷ montant du prêt (plafonnée à 100 %) | `epargne-compte-detail.ts:195-200` |
| DAT | pas de retrait avant l'échéance (pénalité non chiffrée) ; intérêts calculés à l'échéance ou annuellement | `CDC:629,619` |
| Dépôt de garantie d'un crédit | 10 % (> 300 000) ou 15 % (> 1 000 000) sur un compte bloqué | section 1.3 |
| Part des dépôts par Mobile Money | ratio calculé et cité dans la synthèse | `epargne-hub.ts:46-47` |
Scores (fidélité, score IA du compte) : constantes ; le cahier les définit (régularité 0-100) sans formule (`CDC:654`).

### 7.4 Hors ligne
Le dépôt d'épargne collecté sur le terrain est une action de la file hors ligne (cahier : mouvement lié à une transaction de type `EPARGNE_DEPOT`, `CDC:677`). Aucune file d'épargne dans la démo.

### 7.5 Doublon avec le cœur : le cas le plus net
- **Doublonne le cœur** : comptes d'épargne (numéro, solde, statut), mouvements, intérêts, soldes des DAT, comptes bloqués, tontines tenues comme comptes, encours d'épargne du réseau, dormance. Le cahier le dit : « tous les mouvements épargne transitent par M06 » et génèrent des écritures (`CDC:594,939`).
- **Ne peut venir que du cœur** : numéro de compte, solde faisant foi, intérêts crédités, blocage réel, clôture du compte.
- **Peut rester à Prospera** (proposition) : le catalogue commercial des produits d'épargne (si le PO le veut côté Prospera), la détection et la relance des dormants, le scoring de fidélité, la recommandation de produit, le cross-sell vers un crédit garanti par l'épargne, les cycles et réunions de tontine côté groupe, la collecte d'épargne sur le terrain comme geste.
- **Prospera reçoit du cœur** : comptes liés au client (numéro, produit, statut, solde, dernier mouvement), mouvements, intérêts. **Prospera lui renvoie** : dépôts collectés (sans créance : c'est le cas « encaissement sans créance » du noyau, `PRD-D` §6.0), demandes d'ouverture de compte, gel de dépôt de garantie lié à un dossier.
- Le noyau distributeur prévoit déjà « Épargne et dépôts » comme capacité (encaissement sans créance, crédit du tiers) mais ne la détaille pas pour l'IMF (`PRD-D` §6.0) : les comptes d'épargne eux-mêmes ne sont pas couverts par un module partagé.

---

## 8. Catalogue de produits (crédit et épargne, versionnement)

### 8.1 Écran
`/produits` (`FE/app/(dashboard)/produits/page.tsx`, `FE/components/produits/ProduitsView.tsx:39-124`, `FE/lib/produits-hub.ts`) : 4 KPI (9 produits actifs, encours 217,95 M, 186 souscriptions par mois, taux d'utilisation 78 %), filtre par famille (CREDIT, EPARGNE, TONTINE, FRAIS, ASSURANCE), cartes produit (taux, montants, durées, frais, assurance obligatoire, garantie de groupe, clients actifs, encours, suggestion IA). **Lecture seule** : aucune création, modification, désactivation, version, ni simulation (le cahier demande formulaire admin, curseurs de simulation, tableau d'échéancier, bannière de conditions finales : `CDC:794-802`). Le modal de demande de crédit a sa propre liste de 5 produits en dur, différente du catalogue (Commerce, PME, Agricole, Tontine, Express contre Microcrédit individuel, Crédit groupe : `DemandeCreditModal.tsx:10-16` et `produits-hub.ts:37-47`) : pas de source unique.

### 8.2 Données
Produit de démo (`produits-hub.ts:5-23`) : id, code, nom, famille, description, actif, taux annuel, montant min / max, durée min / max, frais de dossier %, assurance obligatoire, garantie de groupe, clients actifs, encours. Exemples : MIC-IND 24 %/an, 50 000-2 000 000, 3-12 mois, frais 2 %, assurance obligatoire ; CRED-GRP 22 %/an, 500 000-5 000 000, 6-24 mois, frais 1,5 % ; ASS-DEC 1,2 %/an ; ASS-INC 0,8 % ; FRAIS-MOMO 0,5 %.
Cahier (`CDC:733-747`) ajoute : type individuel ou groupe, **fréquence de remboursement** (hebdomadaire, bimensuel, mensuel), taux mensuel, annuel ou dégressif, garanties requises, **score minimum** (45 en exemple), **ancienneté minimum** (3 mois), ajustement de risque (score < 60 : +2 points ; configurable +1 à +5 ou durée réduite). Exemple de conditions finales (`CDC:763-779`) : montant 250 000, taux 2,8 %/mois, 12 mois, mensualité 23 456, intérêts 31 472, frais 3 750, coût total 285 222, TAEG 36,4 %.

### 8.3 Règles
- Montant et durée dans la fourchette du produit ; client éligible (score et ancienneté) ; produits inéligibles masqués (non bloquant) (`CDC:788,950`).
- **Versionnement** : une modification crée une nouvelle version horodatée ; les dossiers en cours gardent leurs conditions d'origine ; désactiver un produit le masque sans toucher aux dossiers en cours (`CDC:730-731`, `brain-dump:132`). La démo n'en montre rien.
- Conditions finales validées par le comité : immuables, sauf par l'administrateur avec journal (`CDC:948`).
- Simulation sans persistance (`CDC:947`), moins de 500 ms (`CDC:877`).
- Taux d'usure : 24 % par an, plafond réglementaire à rendre paramétrable (PO, `brain-dump:149-150`). Constat : l'exemple du cahier (2,5 %/mois) et le TAEG de 36,4 % le dépassent ; le microcrédit de la démo est à 28 %/an (`core-banking-registry.ts:27`) ; le produit principal est à 24 % pile.
- Rôles : administrateur ou DAF gèrent le catalogue ; CC sélectionne et simule ; comité valide (`CDC:722`).
- Calculs : mensualité, intérêts totaux, TAEG, échéancier : le cahier les confie à une simulation côté serveur (`CDC:800`) ; la formule n'est pas écrite dans le cahier. L'exemple de la démo est un amortissement à capital constant avec intérêt de 2 %/mois sur le capital restant dû (section 6.2), alors que la mensualité de l'exemple du cahier (23 456 pour 250 000 sur 12 mois à 2,8 %) correspond à une mensualité constante : **deux méthodes d'amortissement différentes**, à fixer (question bloquante).

### 8.4 Doublon avec le cœur
Un produit de crédit ou d'épargne existe aussi dans le cœur, avec ses règles comptables et réglementaires. Proposition : le cœur fait foi pour le **code produit et le plan comptable**, Prospera tient le **catalogue commercial versionné** (conditions, éligibilité, simulation) et renvoie au cœur le code produit et les conditions figées du dossier accordé. Le code produit doit être commun.

---

## 9. Agences, zones, calendrier, portefeuille

### 9.1 Écrans
| Écran | Rôle | Contenu | Actions |
|---|---|---|---|
| `/agences` (`FE/app/(dashboard)/agences/page.tsx`, `FE/components/agences/AgencesDgView.tsx`, `AgencesStandardView.tsx`) | DG (vue réseau, descente agence → secteur → sous-secteur : `FE/components/secteurs/`), autres (vue de leur agence) | par agence : responsable, ouverture, emprunteurs actifs, agents, encours, PAR courant, taux de remboursement, collecte du mois et objectif, nouveaux clients, statut ACTIF / PILOTE / EXPANSION, latitude et longitude (`FE/lib/agences.ts:9-30`) ; statut de conformité BCEAO CONFORME / ATTENTION / NON_CONFORME | lecture (descente par clic) |
| `/zones` DG (`FE/components/zones/ZonesDgView.tsx`, `ZonesDgMap.tsx`, hub `FE/lib/zones-hub.ts`) | DG | couverture des micro-zones %, zones actives, zones vierges, agents actifs, clients cartographiés, pénétration de marché %, anomalies GPS sur 7 jours, rayon de couverture en km, zones d'expansion (potentiel TRES_ELEVE / ELEVE / MODERE, prospects, action, confiance, retour rapide) | lecture |
| `/zones` opérationnel (`FE/app/(dashboard)/zones/page.tsx:18-58`, `FE/components/phase1/ZoneAssignPanel.tsx`) | responsable commercial et collecte (RCC) | carte des agents, agent sélectionné, **affectation d'une zone** : libellé, centre (latitude, longitude), couleur, description | « Enregistrer » appelle l'API ; zone = **point et rayon**, pas de polygone (« polygone GeoJSON en phase 2 », `ZoneAssignPanel.tsx:14`), alors que le cahier parle de polygones (`CDC:266,299`) |
| `/calendrier` « Planning crédit » (`FE/app/(dashboard)/calendrier/page.tsx`, `FE/components/cc/CalendrierCcBlock.tsx:31-38`) | CC | vue semaine ; types d'événement : RDV terrain / agence, échéance de dossier, pièces / instruction, relance, comité de crédit, bureau / admin ; filtres par type | navigation de semaine (réel) ; les événements sont semés |
| `/portefeuille` (`FE/app/(dashboard)/portefeuille/page.tsx`, `FE/components/gp/GpPortefeuilleDossiersView.tsx`, `-with-api`) | GP | « Mon portefeuille crédit » : dossiers en gestion, onglets Tous / Mauvais payeurs, suivi et recouvrement (le GP est désigné par le ROC à l'accord : `brain-dump:81-83`) | capacités : suivi, promesse, encaissement d'échéance (détail au recouvrement, hors de ce périmètre) |

### 9.2 Règles et seuils
- 5 agences dans la démo, toutes à Lomé, Adidogomé, Bè Kpota, Hédzranawoé et Kpalimé (`FE/lib/agences.ts`, Kpalimé en région des Plateaux) ; le PO parle de « beaucoup d'agences », taille inconnue (`brain-dump:158-159`).
- Couverture : zone à renforcer si couverture < 70 % (`TerrainRaBlock.tsx:185`).
- Réserve obligatoire BCEAO par agence : 300 000 par défaut, tension sous 120 % (`caisse-registry.ts:29-34`).
- Statut d'agence : ACTIF / PILOTE / EXPANSION ; conformité BCEAO par agence : 3 niveaux (règle de calcul non lue, hors périmètre).
- Hiérarchie de la démo : réseau → agence → secteur → sous-secteur → agent → client (`FE/components/secteurs/*`) ; périmètre de données par rôle (cahier `CDC:108-117`, récit du PO §5 : DG tout le réseau, RA son agence, GP son portefeuille, agent sa zone).
- Calcul des périmètres de la démo : par nom d'agence dans la zone de l'utilisateur (`resolveAgenceNomFromZone`, `epargne-hub.ts:26-33`) : fragile, à remplacer par un rattachement réel.

### 9.3 Doublon avec le cœur
Agences et zones sont aussi des données du cœur (code agence, agence de rattachement du compte). Proposition : le cœur fait foi pour les **codes d'agence** (clé de rattachement des comptes et de la comptabilité) ; Prospera tient la hiérarchie opérationnelle (zones, secteurs, micro-zones), les affectations d'agents et le portefeuille des GP.

---

## 10. Synthèse : ce qui doublonne le logiciel cœur et ce que Prospera échange avec lui (propositions, rien n'est tranché)

| Objet | La démo le tient | Qui devrait faire foi | Prospera reçoit du cœur | Prospera renvoie au cœur |
|---|---|---|---|---|
| Client (identité, n° client) | oui, fiche complète | cœur pour l'identité légale et le n° ; Prospera pour activité, photos, GPS, score | clients, n° de client | prospects convertis, pièces KYC, score |
| Compte d'épargne, solde, mouvements, intérêts | oui (`/epargne`) | cœur | comptes, soldes, mouvements | dépôts collectés, ouvertures demandées |
| Caisse physique, clôture, écart | oui (`/caisse`) | cœur (comptabilité officielle) | solde théorique, clôture validée | opérations de guichet saisies, remises d'espèces rapprochées |
| Float Mobile Money et rapprochement | oui | `paiement` (relevé du fournisseur) + cœur pour l'écriture | solde du compte opérateur | encaissements constatés |
| Prêt, échéancier, solde restant | oui (`/operations-bancaires`) | cœur après décaissement ; Prospera avant (instruction, comité) | prêts, échéanciers, paiements | dossier accordé, ordre de décaissement |
| Décaissement exécuté | oui (statut EXECUTE) | cœur ou fournisseur de paiement | confirmation d'exécution | ordre (canal, montant, validateur) |
| Produits (crédit, épargne) | oui | cœur pour le code et le plan comptable ; Prospera pour le catalogue commercial | codes produit | conditions figées du dossier |
| Agences | oui | cœur pour les codes | codes d'agence | rien |
| Groupe solidaire | oui (lecture) | cœur pour le compte du groupe ; Prospera pour les membres et réunions | compte et solde du groupe | composition, caution mutuelle |
Ce qui ne peut venir que du cœur : numéros de compte, soldes officiels, écritures, clôtures comptables, classification réglementaire officielle, confirmation d'exécution d'une sortie d'argent.

---

## 11. Écarts avec les modules partagés du PRD distributeur

### 11.1 Terrain (`terrain`, M12)
Voir section 3.6 (8 écarts).

### 11.2 Réseau (`reseau`, M01, `PRD-D` §7.1)
- Le distributeur n'a ni agences, ni secteurs : zones à plat et 2 entrepôts, profondeur configurable « non exigée pour février » (FR-180). **L'IMF est l'inverse** : agences multiples, secteur, sous-secteur, micro-zones : la profondeur configurable (FR-R12) est exigée, avec les mots « agence » et « secteur » en donnée de vocabulaire.
- L'IMF ajoute à `reseau` : code d'agence commun avec le cœur, statut ACTIF / PILOTE / EXPANSION, réserve obligatoire et caisse d'agence (un lieu qui porte une caisse), conformité BCEAO par agence.
- Portée en écriture (FR-181) : le RA modifie son agence, lit son secteur ; à vérifier avec le GP (son portefeuille) et le ROC (réseau).
- Zones : la démo affecte un point et un rayon, le cahier des polygones ; `reseau` suppose des zones sans mur (FR-R01).
- Classement par couverture : relève de `terrain` et `dashboard`, pas de `reseau` (FR-182) ; la couverture de la démo (seuil 70 %) y trouve sa place.
- Zones blanches (FR-183) : proche des « zones vierges » et « zones d'expansion » de la démo ; la carte est Google Maps côté PRD distributeur, Leaflet côté démo IMF.

### 11.3 Catalogue (`catalogue`, M04, `PRD-D` §7.3)
- Le catalogue du distributeur porte des **articles** avec unité de base, conditionnements, grilles de prix par zone, catégorie ou client, promotions, stock. Rien de cela n'existe à l'IMF : le « produit » d'IMF est un **produit financier** (taux, durée, fourchette de montant, fréquence, frais, garanties, éligibilité par score et ancienneté, assurance obligatoire) avec **versions** et conditions figées par dossier. Le module catalogue ne couvre pas ces objets : soit un module `produits-financiers` distinct, soit une extension du noyau ; point de décision du PO (Q6).
- Points communs réutilisables : versionnement avec « le dossier garde ses conditions », simulation sans persistance (cf. FR-C25 prix figé et FR-C27 simulation de prix), droits par rôle (FR-196).
- Familles de la démo non couvertes par le catalogue distributeur : épargne, tontine, frais, assurance.
- Prix négocié par client (FR-193) : l'équivalent IMF est le taux ajusté au risque du client (+1 à +5 points) : une grille par score, pas par client.

### 11.4 Paiement (`paiement`, M33, `PRD-D` §7.5)
- Créance à composantes (principal, intérêt, pénalité, frais) et ordre d'imputation (§6.0) : l'échéance de prêt est la source `ECHEANCE_DE_PRET` ; le calcul des intérêts et des pénalités reste au module de crédit (hors périmètre du noyau).
- Moyens de paiement : `paiement` porte PI-SPI et FedaPay, espèces et virement déclarés, chèque (FR-205, FR-206). L'IMF ajoute le Mobile Money **par pays et par opérateur** (PO), des dépôts **sans créance** à l'épargne (compte du tiers : crédit du tiers ou compte d'épargne du cœur ?), et la **validation comptable** d'un paiement Mobile Money avant tout crédit.
- La **caisse de guichet** (dépôt, retrait, décaissement espèces, clôture, écart) est écartée du noyau (« objet B du PRD paiement ») : à l'IMF elle est centrale et doublonne le cœur.
- Décaissement : les ordres de paiement préparés par un utilisateur, validés par un autre, transmis par le fournisseur (FR-209) conviennent au décaissement par virement ou Mobile Money ; l'espèce au guichet n'y est pas.
- Un paiement déjà reçu n'est jamais refusé (FR-248) : à l'IMF, trop-perçu = crédit du tiers ou dépôt d'épargne ?
- Lien de paiement (FR-207) : réutilisable pour les relances J-3 avec lien Mobile Money (`brain-dump:104`).

---

## 12. Tableau d'écarts : récit du PO, démo, cahier, secondaire

| Sujet | Récit du PO | Démo (`prospera-web`) | Cahier (`CDC`) | Secondaire (`SPEC`) |
|---|---|---|---|---|
| Qui fait foi pour l'argent | le logiciel cœur de l'IMF (`brain-dump:146-147`) | Prospera tient comptes d'épargne, caisse, soldes, prêts | Prospera tient tout, écritures SYSCOHADA générées (`CDC:566`) | idem démo |
| Opérateurs Mobile Money | par pays, par opérateur, et banques via PI-SPI (`:155-156`) | Mixx by Yas et Flooz (`caisse-hub.ts:14`) | `FLOOZ_MIXX` unique, autres refusés (`CDC:565`) | MTN et MOOV (`SPEC/19`) |
| Taux d'usure | 24 %/an, plafond paramétrable (`:149-150`) | produits à 24 %, microcrédit à 28 % (`core-banking-registry.ts:27`) | exemple 2,5-2,8 %/mois, TAEG 36,4 % (`CDC:742,774`) | 24 %, 22 %, 28 %, 20 %, tontine 0 % |
| Cautions | au moins 2 au-dessus d'un seuil (`:72-73`) | 2 cautions dès le premier franc (`fiche-client-microfinance.ts:107,143-144`) | « caution + CNI » en exemple (`CDC:744`) | n/a |
| Seuil de 500 000 | 2 visites au-dessus de 500 000 (`:75`) | garantie réelle ≥ 30 % au-dessus de 500 000 ; aucune règle de 2 visites | n/a | n/a |
| Visite : photo et GPS | exigés (`:75`) | ni photo ni contrôle de distance ; repère déplaçable | photo obligatoire, GPS < 100 m, rejet (`CDC:229,302`) | n/a |
| Proximité | n/a | adresses déjà visitées, distance aléatoire | agent à < 200 m d'un client en retard (`CDC:227`) | n/a |
| Hors ligne | « mode hors ligne, synchronisation » (`:130`) | bouton simulé 1,5 s | IndexedDB, `client_uuid`, lot de 50 en 30 s (`CDC:251-253,910`) | file de démo, chiffres incohérents |
| Rapprochement MoMo | rattaché si écart < 1 % (`:98`) | écart MoMo calculé, pas de lettrage | < 1 % (`CDC:507`) ou montant exact (`CDC:533`) | lettrage des opérations J-1 |
| Validation Mobile Money | attente jusqu'à validation du comptable (`:98`) | Valider / Rejeter (API), motif fixe | motif obligatoire saisi (`CDC:546`) | n/a |
| Clôture de caisse | quotidienne, alerte d'écart (`:131`) | statuts écrits en dur, pas de saisie | 5 étapes, seuil d'alerte non chiffré (`CDC:520-526`) | écarts +42 k et −18 k |
| Seuil d'écart | n/a | n/a | 5 000 FCFA (fraude sur collecte, `CDC:534`) | n/a |
| Dormance épargne | n/a | « > 6 mois » affiché, 90 + hasard calculé | 6 mois, 3 mois après échéance DAT, 2 cycles tontine, 12 mois confirmé | « > 90 jours » |
| Décaissement en espèces | seulement comptable ou DAF (`:93`) | canal CAISSE / VIREMENT / MOMO affiché | idem (`CDC:515`) | cut-off banque 16 h |
| Versions de produit | historique, dossier garde ses conditions (`:132`) | aucun | nouvelle version horodatée (`CDC:731`) | n/a |
| Éligibilité produit | score et ancienneté minimum (`:65`) | non contrôlée, pas de champ | score min 45, ancienneté 3 mois (`CDC:745-746`) | n/a |
| Groupes | crédit de groupe (`:61`) | lecture seule, 3 types | non couvert | 5 à 15 membres, tontine 2 000-50 000 |
| Zones | agent « sa zone » (`:128`) | point et rayon | polygones GPS (`CDC:266`) | n/a |
| Carte | n/a | Leaflet / OpenStreetMap | Leaflet | Google Maps côté PRD distributeur (FR-106) |
| Amortissement | échéancier par le comité seulement (`:87`) | capital constant, intérêt 2 %/mois sur le restant | mensualité constante (exemple 23 456) | capital constant (200 000 par mois) |
| Boutons décoratifs | n/a | « Nouveau emprunteur », « Ouvrir compte », « Ajouter document » | n/a | n/a |

---

## 13. Questions bloquantes pour le PO

1. **Périmètre de la démo fictive du cœur** : quels objets le cœur fictif porte-t-il (clients, comptes d'épargne, prêts, paiements, caisse, produits, agences) ? La section 10 propose un partage ; il faut le valider ligne par ligne.
2. **Caisse et clôture** : qui tient la caisse de guichet et la clôture quotidienne, Prospera ou le cœur ? Si le cœur, le module Caisse se réduit à la file de validation des paiements, aux remises d'espèces des agents et aux alertes d'écart.
3. **Épargne** : Prospera ouvre-t-il et tient-il des comptes d'épargne (démo actuelle) ou seulement les lit-il et collecte-t-il les dépôts ? Le dépôt de garantie d'un crédit (10 % / 15 %) suppose de bloquer des fonds dans le cœur.
4. **Mobile Money et banques** : pays et opérateurs de la première installation ; l'IMF passe-t-elle par FedaPay, PI-SPI, ou les deux ; le comptable valide-t-il encore à la main un paiement déjà confirmé par le fournisseur ?
5. **Seuils à confirmer** (valeur de démo, future valeur de l'IMF) : cautions (2) et à partir de quel montant ; 500 000 pour les 2 visites ; dépôt de garantie 10 % / 15 % ; garantie réelle 30 % / 50 % ; géofencing 100 m ou 200 m, bloquant ou signalé ; écart de caisse (5 000) ; réserve (300 000, tension à 120 %) ; dormance (6 mois ou 90 jours).
6. **Produits financiers** : un module distinct du `catalogue` (articles) ou une extension ? Un seul catalogue pour crédit, épargne, tontine, frais et assurance (et l'assurance appartient au PRD assurance ?).
7. **Méthode d'amortissement et TAEG** : capital constant (démo, secondaire) ou mensualité constante (cahier) ; formule du TAEG ; taux proportionnel annuel de 24 % ou taux mensuel ; confirmation juridique du plafond de 24 % pour toutes les familles (microcrédit à 28 % de la démo, tontine, groupe).
8. **Visite et preuve de présence** : photo obligatoire, rejet automatique ou signalement ; identité de l'appareil ; une application mobile (Flutter, comme le distributeur) ou la PWA du cahier.
9. **Collecte d'épargne et de tontine sur le terrain** : le groupe est-il un client collectif du cœur ; qui tient les cycles, le tirage au sort et la redistribution ?
10. **Reprise** : les clients, comptes d'épargne et prêts en cours arrivent-ils du cœur (connecteur) ou d'un import de fichier (février : fichiers seulement, `PRD-D` §7.7) ?
