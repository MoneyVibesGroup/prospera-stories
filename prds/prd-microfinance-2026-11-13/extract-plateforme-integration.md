# Extrait plateforme -> PRD Prospera Microfinance (intégration, hébergement, modules)

*Synthèse de lecture, 2026-11-13. En cours de rédaction.*

Plan : 1 Hébergement chez le client ; 2 Échanges avec le logiciel cœur ; 3 Import du portefeuille ; 4 Paiement ; 5 Notification ; 6 Modules ; 7 Calendrier et charge ; 8 Trous, contradictions, questions bloquantes.

---

## 1. Hébergement chez le client

### 1.1 Déjà prévu (l'hébergement sur site est PRÉVU, pas exclu)

- Microfinance = « serveurs du client (confirmé par le PO le 2026-11-10) » : prd-moteur-installation-2026-11-09/prd.md:137. UJ-3 (prd.md:186-216) raconte déjà une IMF qui garde son logiciel (Mariam DG, Kodjo agent, Sékou chef d'agence).
- D3 révisée : l'installation complète chez le client (licence, mise à jour, retour arrière) doit être prête avant février 2027 (prd.md:64 ; .memlog).
- Spine du moteur AD-10 (spine:199) : une instance = UN serveur, Docker Compose, un Traefik, deux projets (`-essai`, `-reel`) + un projet agent ; socle d'espace = auth, catalogue, Kafka, registre de schémas, Mongo (réplica à 1 nœud), Redis, MinIO. Kubernetes et haute disponibilité de la centrale sont DIFFÉRÉS (spine:739-743).
- Installation : FR-25 (prd.md:1326) procédure scriptée à partir d'un serveur livré, refus d'un serveur sous la config minimale NFR-10 (prd.md:1502, chiffres « à fixer par l'architecture »), bilan d'instance (licence, premier signal, sauvegarde testée par restauration). AD-10 « Montage ». Pas de TPM en v1 (AD-4, D-12).
- Mises à jour à distance : FR-17 (prd.md:1179) essayées dans l'espace d'essai puis promues à la date choisie par le DSI (variante sur site) ; AD-1 : l'agent TIRE, le poste central ne pousse rien ; AD-9 contact sortant unique (443, deux noms, sans inspection TLS) ; FR-16 aucun port entrant (NFR-2), signal hebdomadaire + vérification quotidienne ; FR-18 retour arrière en un clic ; FR-19 correctif de sécurité rapide ; FR-20 vagues ; FR-21 une seule ligne de version ; AD-30 fenêtre N/N-1 ; NFR-9 coupure ≤ 15 min.
- Mise à jour sans internet : FR-22 (prd.md:1289) fichier signé (lien à durée limitée, clé USB, écran « Mettre à jour depuis un fichier » du module Administration de `prospera-app`).
- Sauvegardes : NFR-7 (prd.md:1485) 3-2-1 chiffrées, second support dans les locaux du client, clé de restauration détenue par le client, RPO 1 h, RTO 4 h, test de restauration mensuel (échec = voyant orange), rétention 7 quot. / 4 hebd. / 3 mens. (AD-16, spine:279). Une sauvegarde ne restaure jamais l'état de confiance (NFR-11, AD-4/AD-35).
- Licence/abonnement hors ligne : FR-14 (prd.md:1083) licence signée liée à l'instance, vérifiée hors ligne, numéro croissant (`LICENCE_ANTERIEURE`) ; FR-15 (prd.md:1145) J+7 alerte, J+30 sans contact = GEL (le travail continue, plus d'installation ni de mise à jour), horloge scellée (reculer la date ne prolonge rien) ; FR-32 fin de contrat ; FR-41 suspension à distance pour impayé ; NFR-8/AD-28 gestion des clés.
- Exploitation par un tiers : DSI du client garde le contrôle (prd.md:111) ; FR-23 (prd.md:1309) tunnel de support ouvert SEULEMENT par le client, borné, journalisé, comptes Money Vibes de la console fermés par défaut ; FR-16 vue de supervision côté Money Vibes ; AD-36 (spine:516) l'OS et Docker restent à la charge du DSI selon la liste du bilan ; AD-12 journal chaîné ; FR-36 (prd.md:911) trois lieux d'écrans dont « Administration » dans `prospera-app` pour le DSI (droits `instance:*`, FR-35).
- Données du client : FR-24/AD-39 les modèles d'IA du client sont intouchables ; FR-26→31 consentements et niveaux d'apprentissage (niveau 2 fermé) ; loi 2019-014 (validation juridique ouverte, prd.md:1597).
- Coque : spine `prospera-app` AD-8/AD-15 : une seule origine pour navigateur et mobile, deux hôtes (essai/réel) par instance (architecture-prospera-app-2026-11-10/ARCHITECTURE-SPINE.md:150,242).

### 1.2 Manques pour l'IMF (rien de ceci n'est écrit)

| # | Manque | Pourquoi c'est propre à une grande IMF |
|---|---|---|
| H1 | Accès des agences : topologie réseau (VPN, MPLS, internet direct, Traefik exposé comment ?) | NFR-2 interdit tout port entrant « d'internet » ; il ne dit rien des agences vers le serveur central. Le 443 de Traefik est publié sur l'hôte (AD-10) : à qui est-il ouvert ? Aucun FR sur les agences ni sur la latence/bande passante. |
| H2 | Réseau intermittent des agences | « Hors ligne » existe pour le téléphone de l'agent (app mobile, spine prospera-app:413 « porté par l'app mobile », hors de ce PRD). Rien pour un poste d'agence (guichet, caisse) dont le lien tombe. FR-15 ne parle que du lien instance-Money Vibes. |
| H3 | Dimensionnement : un serveur, Mongo à 1 nœud, centrale sans HA (spine:739-743 « deux clients en février tiennent sur un serveur ») | Grande IMF, beaucoup d'agences, ~10 rôles, collecte terrain : nombre d'utilisateurs simultanés, volume de prêts et de paiements, SLO ; NFR-10 « chiffres à fixer ». Le PO dit « dimensionné par l'IMF, Money Vibes fournit une démo » : il faut une taille de référence et une règle de retrait (« au-delà d'un serveur »). |
| H4 | Haute disponibilité du serveur de l'IMF | RTO 4 h / RPO 1 h (NFR-7) peuvent être refusés par une IMF (décaissements, caisse). Aucun SLO chiffré (Deferred, spine:740-ss : « première astreinte »). |
| H5 | Exploitation par l'équipe IT de l'IMF : runbook, supervision locale (pas seulement la vue Money Vibes FR-16), rôles DSI/administrateur système/support niveau 1, astreinte, qui patche l'OS/Docker (AD-36 : le DSI, mais aucune liste/ délai) | Le DSI est une personne unique dans le PRD ; l'IMF a une équipe. |
| H6 | Régulation : localisation des données, audit BCEAO / commission bancaire, chiffrement, séparation des responsabilités, conservation des pièces (10 ans ?) | Sauvegarde : rétention 7/4/3 par défaut (AD-16) est une rétention technique, pas légale. Loi 2019-014 est togolaise ; le pays de l'IMF est inconnu. |
| H7 | Licence/abonnement de l'IMF : modèle (achat ou abonnement) non décidé ; FR-41 suspension à distance d'une IMF = risque métier (les décaissements s'arrêteraient ?). Le gel à 30 j laisse le travail continuer (bien), la suspension non | Question PO. |
| H8 | Environnements : essai et réel sur le MÊME serveur (AD-10) ; recette de mise à jour par tests automatiques ou accès encadré ; l'IMF voudra peut-être un environnement séparé | Charge supplémentaire sur le serveur. |
| H9 | Intégration à l'annuaire de l'IMF (SSO/LDAP/AD), messagerie, passerelle SMS locale, pare-feu sortant (443 vers deux noms seulement) | auth-service est l'IdP de la plateforme ; rien sur la fédération. |
| H10 | Mises à jour d'un hôte hors ligne durable (cas de l'IMF avec pare-feu strict) | FR-22 couvre, mais Mobile Money / PI-SPI exigent des sorties vers opérateurs/banques que « 443 vers deux noms seulement » (AD-9) ne couvre PAS : il faut des destinations d'intégration en plus (voir §4). |

Remarque : le plan v3 / moteur compte l'assureur aussi sur site (prd.md:135) : les points H1-H6 serviront aux deux PRD (microfinance + assurance), à mutualiser.

---

## 2. Échanges avec le logiciel cœur

### 2.1 Ce que Connecteurs (M43) et la Reprise offrent déjà

- Principe : « le logiciel de l'IMF est TOUJOURS propriétaire de l'argent : prêts, soldes, épargne » (Connecteurs FR-15, prd-connecteurs-2026-11-10/prd.md:436). Prospera possède ce qu'il crée sur le terrain (visites, promesses, comptes-rendus, GPS). Un remboursement saisi sur le terrain reste « en attente de confirmation » tant que le logiciel de l'IMF ne l'a pas accepté. Propositions à confirmer [A-8] : clients et garanties = logiciel de l'IMF ; KYC terrain = Prospera. Doctrine AD-P18 « autorité métier extérieure » (écosystème).
- Modèle d'échange : un connecteur = une organisation + UN logiciel client ; des domaines ; un propriétaire par domaine (FR-2, AD-3, état absolu publié `connecteurs.domaine.changed`) ; des MOUVEMENTS jamais des totaux (FR-4, AD-4) ; idempotence par clé d'origine (AD-5) ; file d'envoi qui ne perd rien (FR-6, AD-8) ; refus en clair (AD-9) ; concordance de nuit + file des écarts, « jamais d'argent corrigé en silence » (FR-8/9, AD-13/14) ; trois fraîcheurs : immédiat 5 min (API seulement), heure, nuit avant 6 h (FR-5) ; Prospera ne s'arrête jamais à cause du connecteur (FR-10).
- Trois modes de source (FR-1) : API du logiciel de l'IMF ; export du logiciel (fichier tiré, dossier partagé du réseau du client ou SFTP, niveaux HEURE/NUIT seulement, AD-24) ; Odoo. Le logiciel client N'APPELLE JAMAIS Prospera : interrogation sortante, aucun webhook entrant en v1 (QK-19, moteur AD-18, FR-1). Contrat côté cible : `POST /api/<code>/v1/echange/<code>/{organisationId}/objets/<objet>`, enveloppe `echange-enveloppe@1`, `GET …/en-attente` (architecture-connecteurs-2026-11-12/ARCHITECTURE-SPINE.md:451-457).
- Le kit des cibles (AD-12, ADOPTÉ) : bibliothèque `kit-cible` ; chaque module cible déclare ses `domainesEchange`, un point d'écriture unique par domaine et son point d'import (EPIC-161 S4 et EPIC-169 S5 avant février).
- Marche en parallèle / mode ombre (Reprise FR-17, Connecteurs AD-15/34) : l'IMF y est le cas d'école (« pénalités de l'IMF calculées autrement »), mécanismes DIFFÉRÉS (Deferred de la spine Connecteurs).
- Répartition par défaut IMF livrée comme donnée : `repartitions/imf.json` (spine Connecteurs:139, 653) ; adaptateur `api` (IMF) = interface seule, DIFFÉRÉ (spine:652 ; QK-18).

### 2.2 Ce qui manque pour un cœur SFD

| # | Manque | Source |
|---|---|---|
| E1 | Le connecteur de l'IMF « n'a pas de date » (QK-18 ouverte, A-1) ; construction de `connecteurs-service` différée « au premier contrat signé qui déclare un logiciel du client » (AD-32, Deferred). Le PO a maintenant : IMF février + cœur inconnu + cœur fictif de démo. CONTRADICTION avec « rien dans connecteurs-service pour février ». | AD-32 |
| E2 | Aucun contrat de domaines IMF écrit : la liste (clients, prêts, échéancier, paiements, épargne, garanties, dossiers accordés, décaissements) n'existe que comme `imf.json` à écrire. Les `domainesEchange` doivent être déclarés par les manifestes des modules cibles microfinance (qui n'existent pas, §6). | AD-2 |
| E3 | Sens Prospera -> cœur : « dossiers accordés » et « décaissements à exécuter » sont des COMMANDES (ordre, accusé d'exécution, rejet, rapprochement), pas des mouvements d'un total. Connecteurs ne connaît que des mouvements en attente de confirmation ; il faut un état « à exécuter / exécuté par le cœur / rejeté » et un lien avec le paiement (§4). | FR-4, AD-11 |
| E4 | Qui décaisse : le cœur (compte du client crédité) ou Prospera (Mobile Money / PI-SPI via paiement-service) ? Dans les deux cas le cœur doit recevoir le décaissement exécuté. À trancher. | PO §7 |
| E5 | Le délai « immédiat 5 min » exige l'API ; sans API (export), les remboursements arrivent à l'heure ou la nuit : échéancier, PAR et relances J+1 seraient en retard (FR-5, AD-24). Limite à afficher. | AD-24 |
| E6 | Pas de gabarit IMF : l'adaptateur `fichier` lit Excel/CSV/JSON avec des gabarits, aucun n'est défini pour prêts/échéanciers. | Reprise FR-1 |
| E7 | Sur site, « 443 vers deux noms seulement » (moteur AD-9) ne concerne que Money Vibes ; le chemin réseau interne Prospera -> cœur (même LAN/VPN de l'IMF) n'est pas décrit. | moteur AD-9 |
| E8 | Épargne, caisse, comptes : le PO veut que le cœur fasse foi ; Connecteurs : « Prospera ne recalcule jamais un solde d'un domaine qu'il ne possède pas » (AD-3:163). Un module épargne/caisse complet dans Prospera ferait doublon : lecture + mouvements en attente seulement. | AD-3 |
| E9 | Comptabilité : « au mieux un export des écritures vers leur logiciel » (PO §5) ; Connecteurs ne prévoit que « écritures d'Odoo vers Prospera » (différé), pas Prospera -> cœur. | FR-17 |

### 2.3 Flux minimaux (à reprendre dans le PRD, sans nom de produit)

| Sens | Objet | Fraîcheur | Remarque |
|---|---|---|---|
| Cœur -> Prospera | clients (identité, agence, statut) | heure | propriétaire : cœur (A-8) |
| Cœur -> Prospera | prêts en cours (capital restant dû, taux, durée, échéancier, jours de retard, pénalités, garanties) | heure puis immédiat | valeurs de contrôle (Reprise AD-13) |
| Cœur -> Prospera | paiements / remboursements (date de valeur, montant, canal, référence) | immédiat (5 min) avec API | alimente échéancier, PAR, relances |
| Cœur -> Prospera | épargne (soldes, lecture) | heure | lecture seule |
| Prospera -> cœur | dossiers accordés (conditions finales : montant, taux, durée, frais, première échéance, GP, garanties) | immédiat | PO §4 phase 6 ; qui génère l'échéancier officiel ? (Q5) |
| Prospera -> cœur | décaissements à exécuter (montant, bénéficiaire, canal, référence unique) + retour exécuté/rejeté | immédiat | idempotence obligatoire (NFR-1 Connecteurs) |
| Prospera -> cœur | remboursements saisis (terrain, Mobile Money validé) en attente de confirmation | immédiat | FR-15 |
| Prospera -> cœur | export des écritures (non prioritaire) | nuit | PO §5 |

### 2.4 Forme neutre de produit (suggestion, sans trancher)

Un « contrat d'échange avec le logiciel cœur » : (a) liste fermée des objets du §2.3, champs canoniques, identifiant stable côté cœur (`cleOrigine`), montants en unités mineures (XOF entier) ; (b) trois transports interchangeables par adaptateur : API interrogée (sortante), fichiers tirés (CSV/JSON, SFTP ou dossier partagé), et, pour les ordres Prospera -> cœur quand le cœur n'a pas d'API d'écriture, fichiers de retour déposés dans un dossier que le cœur relève ; (c) une enveloppe unique avec séquence, idempotence, accusé et code de refus ; (d) rapprochement de nuit par valeurs de contrôle. Cela réutilise AD-4/5/8/9/13 de Connecteurs sans règle nouvelle. Les schémas du « paquet de référence IMF » vivraient dans `prospera-plateforme`, que l'éditeur ou l'IMF peut produire.

### 2.5 Le cœur FICTIF de démo : ce qu'il doit faire

- Plutôt un adaptateur + simulateur côté Money Vibes qu'un produit dans `prospera-adaptateurs` de production (le moteur a déjà un agent « simulé » en dev, spine moteur:682 ; Connecteurs FR-18/QK-10 : pas de bac à sable sans Money Vibes).
- Tenir les objets du §2.3 : clients, prêts avec échéanciers calculés ; un paiement saisi dans le faux cœur arrive dans Prospera ; un décaissement à exécuter est accepté, exécuté (changement d'état) et confirmé ; un rejet simulé ; un doublon ; une coupure du lien (file d'envoi) ; un écart de concordance (file des écarts).
- Offrir l'API ET l'export (deux niveaux de fraîcheur visibles).
- Vivre dans l'espace d'essai (identifiants dédiés, interception, AD-18 Connecteurs) et se remettre à zéro à la demande.
- Contredit AD-32 : il faut au moins les étapes 1-3 de FR-17 en version IMF, même sans toute la concordance de nuit ni la santé.

---

## 3. Import du portefeuille de prêts en cours

### 3.1 Ce que la Reprise (M44) couvre déjà

- Le périmètre IMF est écrit : « clients et KYC ; prêts en cours (capital restant dû, échéancier complet, retards, pénalités) ; soldes d'épargne ; garanties ; rattachement à l'agence et à l'agent de crédit » en données VIVANTES (écart nul) ; « prêts clos et leurs remboursements » en HISTORIQUE protégé (prd-reprise-donnees-2026-11-10/prd.md:268, FR-9). Profondeur : tout ce que le client peut fournir, objectif 3 ans (FR-9).
- Règle sans équivoque : un prêt en cours sans échéancier complet est une ERREUR `ECHEANCIER_INCOMPLET` (FR-9 ; spine Reprise AD-24:401) ; « sans échéancier, pas de portefeuille à risque ».
- Formats : Excel, CSV, JSON, Odoo, API (FR-1) ; adaptateurs par fichier seuls requis pour février (FR-1, AD-23). Fichiers déposés restent chez le client (FR-3, AD-15 MinIO de l'espace, tus).
- Mécanique : lot par étapes figées (AD-1), tables de correspondance (FR-4), états valides (FR-5), dates d'origine (FR-6, AD-14), jamais de zéro silencieux (FR-7), simulation sans écriture par le module cible (AD-5, FR-11), rapport avant import, validation par le DG (FR-13), doublons/fusions (FR-12), livraison par le point d'import de la cible (FR-14, AD-4, rejouable, idempotent), réconciliation au franc près sur valeurs de contrôle (prêt : capital restant dû, jours de retard, nombre d'échéances ; AD-13:239), feu vert PAR MODULE CIBLE (`reprise.feu-vert.changed`, AD-12), répétition générale dans l'essai puis reprise fraîche (FR-16), marche en parallèle (FR-17), libre-service dès février pour un prospect (FR-19), volumes : 100 000 lignes testées (spine:494, AD-30).
- Format commun = le schéma d'objet de la CIBLE (AD-2) : donc chaque module microfinance déclare `objetsDeReprise` dans son manifeste (C1 amendé le 2026-11-11).
- Relais à Connecteurs à un point de coupure daté (FR-24, AD-20) : amorçage par la Reprise, puis synchro permanente.

### 3.2 Ce qui manque

| # | Manque | Source |
|---|---|---|
| R1 | Aucun schéma d'objets microfinance (prêts, échéanciers, épargne, garanties, groupes) : « microfinance après février » (spine Reprise, Deferred :640). C'est le PRD microfinance qui doit les nommer, et la valeur de contrôle (capital restant dû) qui sert à réconcilier. | spine Reprise:640 |
| R2 | Le PO a REPORTÉ le format ; la Reprise exige pourtant un gabarit. Option : le PRD n'impose que « un format d'import documenté et versionné par objet », ajustable à la présentation (conforme au brain dump §3). Prévoir : un gabarit CSV/JSON neutre (le même que le contrat d'échange §2.4), que le cœur fictif sait produire. | brain dump §3 |
| R3 | Calcul différent des pénalités/intérêts entre cœur et Prospera (cas d'école FR-17) : le cœur fait foi ; l'import reprend l'échéancier et les montants du cœur, SANS recalcul (cf. « le module de crédit fournit les composantes », distributeur §6.0:hors périmètre). À écrire : qui recalcule quoi à la reprise. | Reprise FR-17 |
| R4 | Clés d'origine : un prêt/échéance du cœur a un identifiant stable ; la clé doit survivre aux mouvements (AD-3) pour les paiements ultérieurs reçus du cœur. Rien d'IMF n'est spécifié. | AD-3 |
| R5 | Import d'un portefeuille « vivant » quand le cœur continue de tourner : le point de coupure daté (AD-20) suppose Connecteurs, hors février. Sans Connecteurs, l'import n'est qu'un instantané : les paiements postérieurs à l'import n'arrivent pas (PAR et relances faux). Contradiction à lever avec §2 (E1). | AD-32 |
| R6 | Historique : les paiements passés (prêts clos) ont un régime protégé; mais pour l'IA (scoring) le volume de l'IMF « grande » peut être important (Mo/Go) : dimensionnement du serveur (H3). | AD-30 |
| R7 | Groupes solidaires, cautions, garanties : objets à nommer (pas dans le périmètre de la Reprise au-delà du mot « garanties »). Noyau « Tiers collectif » du distributeur §6.0. | distributeur §6.0 |
| R8 | Reprise « multi-agences » : rattachement à l'agence et à l'agent suppose `reseau` livré avant (ordre : `reseau`, puis les cibles, `paiement` à la suite — distributeur FR-216) ; l'IMF a beaucoup d'agences (volumétrie `reseau`). | FR-216 |

---

## 4. Paiement : décaissement, encaissement, PI-SPI, validation, registre de Créance

### 4.1 Ce qui est déjà cadré / codé

- Module `paiement` (M33, `prospera-paiement-service`) : « PI-SPI est un moyen de paiement, non un module ; le code `pi-spi` du catalogue est à déprécier » (distributeur FR-205 ; manifeste `manifestes/paiement.manifest.ts`). Deux fournisseurs derrière `PaymentProvider` : PI-SPI (`API_BUSINESS` : ordres sortants, relevé, QR interopérable) et FedaPay (`fedapay` : cinq pays de la zone XOF, signature des notifications), routage par pays x devise x méthode, configurable par organisation (FR-P07, FR-P08, FR-P09, FR-P12 ; distributeur FR-205).
- Paiement SORTANT : amendement du 2026-09-21 (FR-P65 à FR-P69, NFR-1d). Un ordre se prépare, se valide par une AUTRE personne (deux droits distincts, FR-P66), part UNE fois, depuis le compte de l'organisation sous SES identifiants (FR-P67), l'état vient du fournisseur (FR-P68), tout est journalisé et ne se supprime pas (FR-P69). « Prospera transmet, il n'exécute pas et ne porte jamais l'argent » (glossaire :114). Mesures réelles : le bénéficiaire est un SHID (adresse du schéma), `confirmation:false` = envoi irrévocable, le même `txId` rejoué renvoie 200 + REJETE/DU03 (amendement §2bis).
- Encaissement : lien de paiement (FR-P14 à FR-P18), paiement partiel (FR-P25/26), promesses (FR-P28/29, publiées à Relance, FR-P30), paiement hors Prospera DÉCLARÉ puis VALIDÉ par rapprochement ou par un rôle habilité, écart au-delà de 48 h ouvrées (FR-P31 à FR-P36) : c'est le patron exact de « Mobile Money en attente jusqu'à validation du comptable » ; relevé fournisseur et rapprochement (FR-P38) ; encaissement sans créance mis en attente (FR-P39) ; frais = politique du créancier (FR-P23, distributeur FR-208).
- Registre de Créance UNIQUE tenu par `paiement` (décision du PO du 2026-11-12, distributeur FR-247) : sources `FACTURE`, et « `ECHEANCE_DE_PRET` et `PRIME` réservées aux verticales microfinance et assurance », composantes principal/intérêt/pénalité/frais, ordre d'imputation paramétrable, tiers (« membre d'une IMF »), faits `paiement.creance.materialisee|changed@1|soldee|cloturee`, lecture `paiement.creance@1` ; crédit du tiers pour l'argent sans créance (FR-248) ; capacités du noyau « à valider par le PRD microfinance » (distributeur §6.0:1950-1972) : Créance à composantes, PAR sur l'encours entier, épargne/dépôts, groupe solidaire, blocage du crédit.
- Essai : paiements de TEST seulement, marqués « test » (distributeur FR-24) ; espaces d'essai interceptent les sorties (moteur FR-9, C13 point 6).
- Pays/devises : données de référence versionnées, montants en unités mineures, aucune conversion (FR-P54 à FR-P58).
- Spine microfinance existante (2026-08-27) : « ne fait pas de mobile money ni d'encaissement : le règlement reste chez `paiement-service` » (epics-microfinance:80-84) ; le service tient le portefeuille comptable/prudentiel ; AD-12 il n'enregistre pas de décision d'octroi.
- Règles de la démo (backend-dashboard-specs/23-ops-core-banking.md) : décaissement = {ref prêt, montant, date prévue, CANAL = VIREMENT | CAISSE | MOMO, statut EN_ATTENTE | EXECUTE, validateur} ; cut-off bancaire (« valider avant 16h »). 24-ops-terrain-offline.md : file de synchro (visite, collecte, photo KYC), conflits, dernière synchro.

### 4.2 Écarts

| # | Écart | Source / effet |
|---|---|---|
| P1 | Décaisser par MOBILE MONEY : aucun adaptateur sortant. PI-SPI sortant ne sait payer qu'un SHID ; « ni FedaPay ni le schéma interopérable ne se pilotent par opérateur » (distributeur FR-206). Le PO veut « Mobile Money par pays et par opérateur » : il faut soit un adaptateur par opérateur (payout), soit passer par un agrégateur ; rien n'est cadré. | FR-206, amendement §2 |
| P2 | Décaisser par VIREMENT vers IBAN/numéro de compte : « le bac à sable n'expose pas l'IBAN » ; l'amendement l'a laissé HORS (question 3). Le décaissement bancaire de l'IMF vers un compte d'un autre établissement passe-t-il par PI-SPI (SHID) ? | amendement §4 q3 |
| P3 | Décaissement ESPÈCES au guichet (autorisé par le comptable/DAF) : la caisse de guichet est HORS du périmètre de `paiement` (PRD paiement §1.1, objet B ; distributeur §6.0 Hors périmètre) ; elle revient à `caisse` (M14, `prospera-microfinance-service` à étendre, non cadré). | M14 |
| P4 | NFR-1d : l'ordre part du compte de l'ORGANISATION sous ses identifiants. Cela convient à une IMF qui détient son compte. Mais (a) une IMF est-elle participante/raccordable au schéma ? (b) le compte est chez le cœur ou la banque de l'IMF : l'ordre Prospera et le décaissement dans le cœur ne doivent pas se doubler (risque R8 « argent parti deux fois »). Si le cœur décaisse, `paiement` ne sert qu'à l'encaissement. À trancher (Q4). | NFR-1d, R8 |
| P5 | Statut juridique : « À FAIRE CONFIRMER JURIDIQUEMENT » pour l'initiation de paiement ; Mobile Money payout d'une IMF (SFD) et LCB/FT non couverts (PRD paiement §10). | §10 |
| P6 | Encaissement Mobile Money : le lien de paiement existe (FedaPay/PI-SPI) mais il est conçu pour une demande à un payeur identifié ; la collecte TERRAIN par Mobile Money et le guichet exigent des « encaissements déclarés » rattachés à une échéance avec tolérance < 1 % (PO §4) : pas de règle d'écart de rattachement dans `paiement` (FR-P38 propose à ±1 jour, pas ±1 %). | FR-P38 |
| P7 | « Validation par le comptable » : FR-P33/P36 parlent d'un « rôle habilité » sans le nommer; à nommer dans la matrice d'accès microfinance. Le comptable est-il aussi le valideur d'ordres (séparation des pouvoirs FR-P66) ? | FR-P66 |
| P8 | Registre de Créance : la source `ECHEANCE_DE_PRET` est « réservée », rien n'est défini : qui OUVRE la Créance d'une échéance (le module crédit à l'échéancier, ou le cœur via Connecteurs) ? Le cœur étant propriétaire de l'argent (§2), la Créance de Prospera ne peut être qu'un MIROIR des échéances du cœur, pas un registre propriétaire : contradiction avec « un seul propriétaire, paiement » (FR-247) tant que l'autorité extérieure n'est pas reportée dans le noyau. | FR-247, Connecteurs AD-3 |
| P9 | Ordre d'imputation réglementé (pénalité, intérêt, principal), PAR sur l'encours entier, groupe solidaire : posés comme « capacités du noyau à valider par le PRD microfinance » ; ni écrits dans le PRD paiement ni codés. | distributeur §6.0 |
| P10 | Webhooks et pages de lien publiques vs sur site : voir 4.3. | NFR-2 |
| P11 | Multi-pays/multi-opérateurs : une grande IMF dans un seul pays BCEAO ; FR-P57 compte d'encaissement par pays et devise OK ; mais routage « par opérateur » inexistant (P1). | FR-P08 |
| P12 | Délai des décaissements : NFR-7 du PRD paiement « délais cibles à confirmer après mesure ». Cut-off bancaire de la démo. | NFR-7 |

### 4.3 Contradiction structurante : sur site, "aucun port entrant" contre webhooks et liens publics

- Moteur NFR-2 : « aucune instance sur site n'expose de port entrant vers internet » (prd.md:1469) ; moteur FR-16 : toutes les liaisons sont initiées par l'instance.
- Or `paiement-service` reçoit des notifications SIGNÉES de FedaPay/PI-SPI (webhook, FR-P19 à FR-P22), `notification-service` reçoit des accusés et des réponses WhatsApp par webhook de passerelle (spine notification:44, FR-N41), et le LIEN DE PAIEMENT envoyé au client est une page publique que le téléphone du client ouvre (prospera-app AD-18, écrans publics `(public)/p/<code>`). Aucun de ces trois chemins n'est décrit comme sortant. Le client mobile de l'IMF doit atteindre le serveur de l'IMF, ou un relais.
- Pistes (sans trancher) : (a) relevé sortant périodique (FR-P38 import du relevé, STORY-669 « relevable ») à la place du webhook, au prix de la fraîcheur ; (b) un relais public hébergé par Money Vibes qui ne fait que mettre en file (point d'entrée signé) et que l'instance tire ; (c) l'IMF ouvre un 443 contrôlé (DMZ) pour ces seules routes. Choix lié à la question d'hébergement (Q2).

---

## 5. Notification : WhatsApp, SMS, lien de paiement

### 5.1 Déjà cadré / codé

- `notification` (M34) : canaux e-mail, SMS, WhatsApp, push, in-app derrière `ChannelProvider` (FR-N17, FR-N18) ; carnet de contacts dédoublonné par organisation (FR-N01 à FR-N08) ; modèles versionnés, multilingues, statut d'approbation WhatsApp par canal (FR-N09 à FR-N16) ; liste de canaux de repli « WhatsApp, sinon SMS » (FR-N21) ; transactionnel vs masse (§1.3) ; réponses entrantes routées par contexte vers le module qui a parlé (FR-N41 à FR-N45) ; consentement/désabonnement par personne, canal et nature (FR-N46 à FR-N50) ; plafond d'envois (FR-N33) ; journal et accusés avec vérité du « lu » (NFR-1 : SMS n'a pas de « lu ») ; rétention, preuve de consentement 3 ans (§9.2) ; pas de canal prérequis de démarrage (FR-N22, NFR-6).
- Déjà arbitré avec le distributeur : l'envoi WhatsApp « exigé, jamais bientôt », avec repli SMS (distributeur FR-249) ; le lien de paiement partagé par `notification` (FR-207) ; plafond par DESTINATAIRE sur les campagnes (FR-212) ; file hors réseau du terrain dans l'application (FR-213) ; écrans modèles/journal/consommation à créer (FR-214) ; essai : message intercepté, journal visible, envoi seulement vers un numéro déclaré (FR-23).
- Relances à échelle paramétrable (distributeur `recouvrement` FR-114, FR-115 « une relance part vraiment », FR-118 promesse, FR-119 blocage du crédit) : réutilisable pour J-3 / J+1..3 / J+7 / J+90 de l'IMF (PO §4 phase 7).

### 5.2 Écarts

| # | Écart |
|---|---|
| N1 | Passerelles sur site : WhatsApp Business (modèles approuvés par Meta, numéro de l'IMF) et SMS (agrégateur/passerelle locale, sender id enregistré) sont à la charge de l'IMF ; sortie réseau de l'instance (moteur AD-9 : 443 vers deux noms seulement, hors passerelles) ; contrat de passerelle et coûts (FR-N57 à N63 : qui paie ?). Les identifiants de passerelle sont chiffrés (AR-14). |
| N2 | Modèles WhatsApp de l'IMF (J-3 avec lien de paiement, relances, promesse) : à soumettre et faire approuver AVANT la mise en service (FR-N11) : délai externe, hors de la maîtrise du calendrier. |
| N3 | Chatbot WhatsApp du marketing (PO §5 : « chatbot WhatsApp ») : `notification` route les réponses entrantes mais n'est pas un agent conversationnel ; il relèverait de `assistant-service` (M26/M27, non codé) : écart. |
| N4 | Webhooks entrants de passerelle (accusés, réponses) et lien de paiement public vs « aucun port entrant » (voir 4.3). |
| N5 | Consentement : l'IMF est responsable de traitement, Prospera sous-traitant (§9.1) ; textes de référence togolais (loi 2019-014) : le pays de l'IMF est inconnu (zone BCEAO) : la base légale et la conservation changent. Relances de recouvrement : message transactionnel; mais la fiche mauvais payeur et les messages à un tiers (cautions) demandent un cadre. |
| N6 | Langues locales et UCS-2 (FR-N14) pour SMS : limite de 70 caractères pour caractères non latins (impacte le coût de relance). |
| N7 | Alertes aux rôles (CC prévenu, ROC, GP, DG) : canal in-app (FR-N19) et e-mail ; la matrice « qui est prévenu » (PO §4) est à écrire, pas la mécanique. |
| N8 | Envoi à grande échelle : relances automatiques J-3 sur tout le portefeuille d'une grande IMF chaque matin : envoi de masse par lots avec reprise (FR-N30 à N32), mais la nature « transactionnelle » d'un volume de masse est une question de classification (consentement vs exécution du contrat). |

---

## 6. Modules

### 6.1 Modules microfinance déjà nommés (prd-moteur-installation-2026-11-09/manifestes-a-produire.md ; aucun manifeste microfinance n'existe encore dans `manifestes/`)

Total « microfinance » : 26 modules sur 45 (ligne 72). Manifestes présents dans `manifestes/` : balance, bilan, catalogue, conseil, consolidation, connecteurs, declarations, notification, paiement, pdv, reprise, reseau, stock. **Aucun pour `microfinance`, `credit`, `collecte`, `caisse`, `risque-par`, `conformite-bceao`, `terrain`, `recouvrement`, `ged`...**

| M | Module (code catalogue) | Statut du code | Échéance manifeste (source) | Remarque |
|---|---|---|---|---|
| M01 | Réseau, agences et zones (`reseau`) | manifeste ÉCRIT, service à créer (Dev A, EPIC-044→053) | fait 12/11 | partagé D/MF/A ; l'IMF a beaucoup d'agences |
| M04 | Catalogue / produits financiers (`catalogue`) | manifeste ÉCRIT, service à créer | fait | produits de crédit et d'épargne avec versions (PO §5) |
| M07 | GED, numérisation, OCR (`ged`) | à créer (extension `document-service`) | 04/12 | pièces KYC/dossier ; microfinance « [À CONFIRMER] » |
| M12 | Terrain et application mobile (`terrain`) | à créer + app mobile (MB-05→49) | 20/11 (lot 2) | partagé avec le distributeur : FR-100 à FR-110, FR-173, FR-174 |
| M14 | Caisse, guichet, trésorerie réseau (`caisse`) | à créer, dans `prospera-microfinance-service` (à étendre) | 27/11 (lot 3) | n°15 du plan ; clôture de caisse, canaux |
| M15 | Crédit : cycle, comité, BIC (`credit`) | code catalogue existant, service microfinance (« existant ») | « avec le PRD microfinance » | n°19 ; PRIORITÉ du PO ; spine microfinance AD-12 : n'enregistre pas de décision d'octroi |
| M16 | Collecte terrain (`collecte`) | code existant, partiel | « avec le PRD microfinance » | n°20 ; note de la fiche : absent de la liste des 13 modules du contrat |
| M17 | Épargne et dépôts | rattaché au code `microfinance` (décision PO 2026-11-12) | « avec le PRD microfinance » | n°22 ; UN seul manifeste avec M32 |
| M18 | Risque, PAR, provisionnement (`risque-par`) | à créer (prudentiel, partiel) | 27/11 (lot 3) | n°23 ; événements de crédit append-only (microfinance AD-1 à AD-4) |
| M19 | Relances et recouvrement (`recouvrement`) | code existant, à créer (s'appuie sur notification + paiement) | 27/11 | n°24 ; partagé avec le distributeur (§6.2) |
| M20 | Conformité BCEAO, audit, LCB/FT (`conformite-bceao`) | code existant, partiel | 27/11 | n°27 |
| M21 | Équipes et performance (`equipe`) | déprécié à réactiver | 04/12 | partagé ; n°18 |
| M22 | Comptabilité et finance, transactions (`finance-transactions`) | à créer | 04/12 | partagé ; non prioritaire pour l'IMF (PO §3) |
| M23 | Marketing et campagnes (`marketing`) | à créer | 04/12 | acquisition de clients, chatbot WhatsApp |
| M25 | Contrôle de gestion (`controle-gestion`) | à créer | 04/12 | microfinance « [À CONFIRMER] » |
| M26 | Automatisations et Copilot IA (`automatisations`) | à créer (assistant-service) | 04/12 | « Copilot IA » du PO §5 |
| M28 | Dashboard et pilotage (`dashboard`) | déprécié à réactiver | 04/12 | partagé ; ~10 tableaux par rôle |
| M32 | CRM emprunteurs, KYC, membres (code `microfinance`) | partiel (`prospera-microfinance-service` + kyc-service) | « avec le PRD microfinance » | PO 13/11 : `prospera-microfinance-service` = paquet de comptabilité SFD |
| M33 | Encaissements et PI-SPI (code `paiement`) | EXISTANT, manifeste ÉCRIT | fait | pas de `pi-spi` |
| M34 | Canaux et notifications (`notification`) | EXISTANT, manifeste ÉCRIT | fait | |
| M35, M36 | Balance (`balance`), Bilan (`bilan`) | EXISTANTS, manifestes ÉCRITS | fait | `sfd-bceao@2.0`, 372 comptes ; pack `imf-sfd` |
| M03 | Support client et CRM interne (`support-client`) | déprécié à réactiver | 04/12 | microfinance [À CONFIRMER] ; hors PRD distributeur (§6.9) |
| M41 | Paie et déclarations sociales (`paie`) | à créer | 04/12 | microfinance, cabinet [À CONFIRMER] ; périmètre à trancher |
| M43, M44 | Connecteurs (`connecteurs`), Reprise (`reprise`) | manifestes ÉCRITS ; services à construire | fait | M44 requis en février ; M43 non |
| M45 | Consolidation (`consolidation`) | dans `bilan-service`, manifeste ÉCRIT | fait | cabinet seulement ; IMF multi-entités ? |
| — | `instance` (moteur) | | | socle obligatoire, hors liste commerciale |

Le pack catalogue existant s'appelle `imf-sfd` (CONTRAT-DE-MODULE:88 ; PLAN:62).

### 6.2 Modules partagés (partie 3 du PRD distributeur) à réutiliser sans réécrire

`terrain` (M12, FR-100 à FR-110, FR-173, FR-174), `recouvrement` (M19, FR-111 à FR-121 dont FR-111 Créance à plusieurs Sources, FR-172 crédit du tiers, FR-112 balance âgée, FR-114 échelle d'escalade, FR-118 promesse, FR-119 blocage), `equipe` (M21, FR-122 à FR-128), `finance-transactions` (M22, FR-129 à FR-141, FR-175), `marketing` (M23, FR-142 à FR-149), `controle-gestion` (M25, FR-150 à FR-156), `automatisations` (M26, FR-157 à FR-164), `dashboard` (M28, FR-165 à FR-171, FR-177). Règle : « une structure, plusieurs mots » : noyau neutre + tableau de vocabulaire par verticale, validé par le PRD microfinance (prd distributeur:1929-1948). Les cinq capacités du noyau (§6.0) sont à valider par ce PRD. Partie 4 : `reseau`, `pdv`, `catalogue`, `stock`, `paiement`, `notification`, `reprise`, `connecteurs` (renvois). `pdv` et `stock` ne concernent pas l'IMF.

### 6.3 Proposition de liste pour le PRD microfinance (sans trancher)

- Propres à l'IMF, à décrire en détail : `credit` (7 phases, comité, échéancier, décaissement, clôture, produits de crédit), `collecte` (terrain, guichet, Mobile Money, clôture de caisse), `caisse` (guichet, écart), `epargne` (ou dans `microfinance`), `risque-par` (PAR, provisionnement, classement), `conformite-bceao` (états, LCB/FT, audit), `microfinance` (membres, KYC, groupes solidaires, comptabilité SFD).
- Réutilisés : `terrain`, `recouvrement`, `equipe`, `dashboard`, `automatisations`, `marketing`, `controle-gestion`, `finance-transactions` (priorité basse).
- Socle : `reseau`, `catalogue`, `paiement`, `notification`, `reprise`, `connecteurs`, `ged`, `balance`, `bilan`, `instance`.
- À CRÉER, non nommés : « cœur fictif de démo » (adaptateur + simulateur), « ordres de décaissement » (peut-être dans `credit` ou `paiement`), « import du portefeuille » (objets de reprise de `credit` et `microfinance`), « groupes solidaires » (`microfinance` ou `credit`), « scoring/IA de décision » (`credit` + `assistant-service`).
- Question de code : les trois modules partageant un agrégat vivent dans `microfinance-service` avec une gate chacun (PLAN:104 ; amendement §4) ; le PO précise que `prospera-microfinance-service` est le paquet de comptabilité SFD : les services de crédit/collecte/caisse sont-ils dans ce dépôt ou dans un nouveau service ? (coût du socle ≈ 13 points par service).

### 6.4 Plages d'identifiants disponibles (sprint-status.yaml:31-130)

- Dev B : STORY-900 → STORY-1199 (consommé : STORY-900 seul) ; EPIC-142 → EPIC-299 (consommé : 142 → 179 ; libre : EPIC-180 → EPIC-299) ; PRA-100 → PRA-199 (écrans de la coque, Dev B) ; AP-38 → AP-99 (console devenue CRM interne) ; MB-05 → MB-49 (app mobile). Dev A : STORY-730 → 899. Aucune plage n'est réservée aux épics microfinance par le plan v3 : les épics microfinance de 2026-08-27 (EPIC-121→127, STORY-497→510) sont fermés (comptabilité/prudentiel).
- FR : pas de plage réservée plateforme. Le PRD distributeur utilise FR-1 → FR-259 (partie 3 : FR-100 → FR-177, plus FR-205 → FR-249) ; pour éviter toute collision, le PRD microfinance peut démarrer à FR-300 (proposition) ou préfixer par vertical.

---

## 7. Calendrier et charge

- Plan v3 : démarré le 2026-11-09 ; fin 15/01/2027 (démo) ; microfinance : « le backend comptes et états est livré ; les 7 modules opérationnels sont cadrés et chiffrés ; leur développement démarre le 18/01/2027 » (PLAN-2-DEVS:266). Lot 3 (microfinance) cadré le 27/11 : n°15, 19, 20, 22, 23, 24, 27 (PLAN:223).
- Amendement v3 du 2026-11-10 (validé 2026-11-11) : l'instance sur site est PRÊTE avant février 2027, toutes les FR du moteur sont dues pour février (démo du 15/01 = partie A) ; « Février 2027 a deux clients : une assurance sur ses serveurs, un distributeur sur ceux de Money Vibes » (amendement:31). L'IMF est donc un TROISIÈME client de février, absent de la ligne de départ. Même mode d'hébergement que l'assureur.
- Charge de Dev B : 17 à 20 semaines à chiffrer le 04/12 pour 10 semaines disponibles (07/12 → 26/02, pause des fêtes déduite) ; écart 7 à 10 semaines, creusé par les ajouts du 11/11 ; trois voies : retirer CRM interne/sinistres/GED (≈ 3 sem.), renforcer par Dev A à partir du 18/01 « au prix du démarrage de la microfinance » (≈ 5-6 sem.), dégrader (≈ 2-3 sem.). « Sans une de ces trois voies, février ne tient pas » (amendement:157-163).
- Ordre de sacrifice (amendement §3) : FR-17 sur site jamais sacrifiée ; rien pour la microfinance.
- Reprise requise en février (fichiers) ; Connecteurs hors février (spine Connecteurs AD-32) ; connecteur IMF sans date (QK-18) ; mode ombre/marche en parallèle différés.
- Contraintes à noter : (1) le PO veut « toute la plateforme au jour 1, le crédit en priorité absolue » en février 2027, alors que le développement des modules microfinance démarre le 18/01 et peut être différé pour renforcer le moteur ; (2) la démo avec un cœur fictif exige connecteur + kit-cible + domaines IMF, que les épics 170→179 n'ont pas placés ; (3) le backend du front de démo (localhost:3001) est écarté (PO §3) : tout le crédit est à construire ; (4) Dev B est aussi l'utilisateur/PO (mémoire) : le cadrage microfinance consomme sa capacité ; (5) l'installation sur site chez l'IMF requiert une recette croisée des deux modes d'hébergement (amendement:185) et les clés/CA/registre d'images, second hôte de la centrale.
- Tranche de février réaliste (ouvert) : démo contrôlée du crédit sur cœur fictif sur instance d'essai Money Vibes, puis installation chez l'IMF.

---

## 8. Trous et contradictions

| # | Sujet | Constat | Gravité |
|---|---|---|---|
| T1 | Connecteur IMF | Sans date (QK-18, AD-32) vs PO : cœur fictif pour la démo + vrai connecteur plus tard + échanges dossiers/décaissements à définir. Aucun contrat de domaines IMF. | Bloquant |
| T2 | Décaissement sortant | Ordre de paiement = SHID seulement, pas de Mobile Money par opérateur, pas d'IBAN ; décaisse-t-on par Prospera ou par le cœur ? | Bloquant |
| T3 | Autorité de la Créance | `paiement` « propriétaire unique » (FR-247) vs cœur propriétaire de l'argent (Connecteurs AD-3, P8) | Majeur |
| T4 | Webhooks/liens publics | NFR-2 « aucun port entrant » vs webhooks FedaPay/PI-SPI/WhatsApp et page publique du lien (4.3) | Bloquant pour l'encaissement |
| T5 | Accès des agences et réseau intermittent | Non cadré (H1, H2) ; le mode hors ligne est celui du téléphone seulement | Majeur |
| T6 | Dimensionnement | 1 serveur, Mongo 1 nœud, HA différée vs grande IMF | Majeur |
| T7 | Charge/calendrier | IMF 3e client de février ; microfinance démarrage 18/01 ; 7-10 sem. d'écart ; Dev A renforce Dev B au prix de la microfinance | Bloquant |
| T8 | Crédit et IA | microfinance AD-12 « ne décide aucun octroi, aucun scoring » vs PO « l'IA propose une décision » ; le score existe-t-il ? (assistant-service) | Majeur |
| T9 | Comptabilité | PO : non prioritaire ; le paquet microfinance existant EST la comptabilité SFD (balance canonique AD-5) ; épargne/caisse doublonnent le cœur (E8) | À trancher |
| T10 | Taux d'usure | PO : 24 % par an, plafond paramétrable : à porter au catalogue/credit (produit dont le TAEG 36,4 % de la démo dépasse) ; vérifier juridiquement | Majeur |
| T11 | Manifestes microfinance | Aucun écrit ; dus « avec le PRD microfinance » (credit, collecte, microfinance) et 27/11 (caisse, risque-par, conformite-bceao) : le PRD doit sortir avant | Majeur |
| T12 | Licence/suspension | FR-41 suspension à distance d'une IMF impayée vs continuité de service financier | À trancher |
| T13 | Hypothèse « un seul DSI » | exploitation par équipe tierce : rôles, astreinte, runbook non écrits (H5) | Majeur |
| T14 | Juridique | loi 2019-014 togolaise vs pays inconnu ; initiation de paiement non confirmée ; stockage chez le client | À trancher |
| T15 | Épargne/dépôts | `epargne` rattaché à `microfinance` ; noyau « Épargne et dépôts » (encaissement sans créance) à valider | À trancher |

### Questions bloquantes pour le PO

1. Q1 Cœur fictif : le décide-t-on dans le périmètre de février (donc connecteur IMF minimal + kit-cible côté crédit), malgré AD-32 (« rien dans connecteurs-service pour février ») ? Quelle forme (API, fichiers, les deux) ?
2. Q2 Webhooks et liens publics sur site : relais Money Vibes, port contrôlé chez l'IMF (DMZ), ou relevé sortant ?
3. Q3 Accès des agences : réseau (VPN/MPLS/internet), postes de guichet (navigateur) et connexion intermittente : quel comportement hors ligne attend-on des agences (guichet) en plus du téléphone ?
4. Q4 Qui décaisse : le cœur ou Prospera ? Si Prospera : quels canaux sont obligatoires en février (espèces, Mobile Money par opérateur, virement PI-SPI) ?
5. Q5 Qui génère l'échéancier officiel : Prospera (comité seul, PO §4) ou le cœur ? et qui recalcule les pénalités ?
6. Q6 Taille de référence de l'IMF (agences, utilisateurs, prêts) ou « Money Vibes fournit une démo » : sur quelle taille la démo et NFR-10 sont-elles dimensionnées ?
7. Q7 Charge : confirmer que l'IMF est un troisième client de février et arbitrer les trois voies de l'amendement (T7) ; ou fixer une tranche de février réduite (démo crédit sur cœur fictif).
8. Q8 Modèle de licence de l'IMF (achat ou abonnement) et usage de la suspension à distance pour impayé (FR-41).
9. Q9 Épargne, caisse, comptabilité : en lecture seule du cœur, ou modules complets ? (E8, T9).
10. Q10 L'IA de décision de crédit : rôle exact (propose, ne décide pas ?) et outil (`assistant-service`, M26/M27).
