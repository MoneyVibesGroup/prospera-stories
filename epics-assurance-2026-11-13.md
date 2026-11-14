---
stepsCompleted: [1, 2]
inputDocuments:
  - prospera-stories/prds/prd-assurance-2026-11-13/prd.md (final, PR #432 : FR-1 → FR-29, FR-30 → FR-149, FR-150 → FR-219, FR-220 → FR-246, FR-250 → FR-264, annexes A à E)
  - prospera-stories/architecture/architecture-assurance-2026-11-13/ARCHITECTURE-SPINE.md (finale, 27 AD)
  - prospera-stories/prds/prd-paiement-service-2026-08-02/amendement-2026-11-13-reglements-de-sinistres.md (validé par le PO le 2026-11-13)
  - prospera-stories/prds/prd-reprise-donnees-2026-11-10/amendement-2026-11-13-assurance.md (validé par le PO le 2026-11-13)
  - prospera-stories/epics-microfinance-imf-2026-11-13.md (modèle exact du découpage) et epics-reprise-connecteurs-2026-11-12.md
  - prospera-stories/prds/prd-moteur-installation-2026-11-09/manifestes-a-produire.md (M05, M07, M29, M30, M31, M48)
  - prospera-stories/sprint-status.yaml (epic_id_high_water_mark EPIC-200, plage Dev B EPIC-142 → 299)
---

# Assurance (chaîne sinistres) — Découpage en épics

## Vue d'ensemble

Découpage du **PRD Assurance** et de sa **spine** en **épics**, comme pour la microfinance, le stock, le moteur et Reprise/Connecteurs : les fiches de stories ne sont **pas** écrites ici, mais par celui qui code la story, juste avant de la coder. Chaque épic porte son **backend** et ses **écrans**, et sa fin se prouve de bout en bout sur le vrai backend, sans mock. **Tous les écrans sont faits par Dev B** (règle du programme) ; le backend est proposé à Dev A, sauf décision contraire du PO.

**Identifiants.** **EPIC-201 → EPIC-221**, pris dans la plage de Dev B (`EPIC-142 → 299`) et inscrits au registre le jour du découpage (relevé du 2026-11-13 sur toutes les branches distantes : marque haute EPIC-200). **Aucun `story_id` n'est réservé** : chaque fiche prend le suivant de la plage de celui qui la code (`STORY-900 → 1199` pour Dev B, `STORY-730 → 899` pour Dev A). Les écrans prennent leur identifiant dans la série de la coque (`PRA-`).

**Le chemin de la démo (★).** Les épics ★ font la démo, construite en premier, dans l'ordre de construction du PRD (§10.3) et de la spine : le parcours de bout en bout (déclarer, ouvrir, attribuer, instruire, expertise, chiffrer, décider, offre, accord, payer, clore, archiver) par EPIC-205 → EPIC-211 ; l'échange avec le logiciel de compagnie fictif (EPIC-203, EPIC-204) ; la recherche et la fiche (EPIC-213) ; la GED avec OCR (EPIC-214) ; l'IA du premier jour, sauf la voix (EPIC-217) ; la reprise des archives (EPIC-219) ; le pilotage (EPIC-216) ; les contrats lus et la provision (EPIC-215) ; les messages (EPIC-220). **Tout est du premier jour** (décision du PO : tout le circuit jusqu'au chèque, recours compris, et l'IA dès le premier jour sauf la voix ; mise en service en février 2027) : les **21 épics** font partie du périmètre de février. Le ★ ne délimite pas le périmètre : il marque le **chemin de la démo**, construit en premier ; le recours et la fraude (EPIC-212), l'IA avancée (EPIC-218), l'installation et la mise en service (EPIC-221), les sorties du circuit, le PSAP, les états techniques et le portail des cabinets viennent ensuite dans l'ordre de construction, avant la mise en service. Le critère de mise en service est le feu vert par module (PRD §10.3, FR-218). La charge de février reste une question au PO (action A-16 : aucune réduction de périmètre).

**Chemin critique.** EPIC-201 (migrations, classification, index aveugle) → EPIC-205 (machine à états) → EPIC-206 → EPIC-207 → EPIC-209 → EPIC-210 → EPIC-211 → EPIC-214 (archiver). En parallèle dès le début : EPIC-203 et EPIC-204 (le contrat d'échange se prouve avec le LC fictif), EPIC-202 (rôles et portées), EPIC-214 (GED, dès la migration de `document-service`). Avant la fin d'EPIC-207 : EPIC-215 (contrats et provision) et EPIC-217 (IA, sinon emplacement `NON_INSTALLE`). Après le chemin : EPIC-208 (experts) s'intercale entre EPIC-206 et EPIC-209 ; EPIC-216 et EPIC-219 suivent les modules qu'ils lisent ; la recette de l'annexe E (EPIC-204) clôt la tranche.

**Points ouverts qui touchent le plan.** Q-3 (produit de stockage de production, EPIC-214 et EPIC-221), Q-4 (service et propriétaire du relais Money Vibes, EPIC-220), Q-6 (`paiement.reglement.changed@1`, EPIC-210), Q-2 et Q-7 (quittance, chèque et séquence `DEC-`, EPIC-205 et EPIC-210). Actions A-11 (Mobile Money sortant, à chiffrer) et A-12 (tables du barème corporel, EPIC-207).

## Requirements Inventory

### Functional Requirements

- **FR-1** : Les règles transverses du PRD distributeur valent ici
- **FR-2** : Ce que Prospera tient, ce que le logiciel de la compagnie tient
- **FR-3** : Les contrats sont lus, jamais modifiés
- **FR-4** : Les seuils de la démo sont des valeurs par défaut
- **FR-5** : Les seuils d'alerte se calibrent sur les données reprises
- **FR-6** : Quatorze rôles, un périmètre par rôle
- **FR-7** : Séparation des tâches
- **FR-8** : La matrice de délégation est un paramètre
- **FR-9** : Les données de santé sont des données sensibles
- **FR-10** : L'IA est spécifiée ici, servie par l'IA commune
- **FR-11** : Les garde-fous de l'IA
- **FR-12** : Le registre de l'IA et l'instance locale
- **FR-13** : Qui a fait quoi, qui a lu quoi, et quand
- **FR-14** : Délais légaux et délais internes, séparés
- **FR-15** : La compagnie de démonstration
- **FR-16** : Dans la démo, on crée pour de vrai, rôle après rôle
- **FR-17** : Un jeu cohérent au franc près
- **FR-18** : Les messages passent par `notification`
- **FR-19** : Données personnelles et consentements
- **FR-20** : Les modules de la compagnie s'installent un par un
- **FR-21** : Le papier reste tenu, le numérique sert
- **FR-22** : « Bientôt » n'est jamais simulé
- **FR-23** : Une hypothèse de dimensionnement, à remplacer par les vrais volumes
- **FR-24** : Revue juridique obligatoire avant la mise en service
- **FR-25** : Authentification, sessions et double authentification
- **FR-26** : Toute décision est défendable
- **FR-27** : Le processus évolue par paramètres, puis par version
- **FR-28** : Deux agents, un dossier
- **FR-29** : Partie au dossier
- **FR-30** : Le dossier avance par 8 phases et 11 statuts, et chaque pas est gardé
- **FR-31** : Quatre sorties du circuit, chacune avec un motif
- **FR-32** : Le recours est un suivi parallèle, pas un statut du dossier
- **FR-33** : Quatre règles tiennent tout le circuit
- **FR-34** : Le sinistre se déclare par quatre canaux, avec un mode de saisie commun
- **FR-35** : Déclaration assistée par l'IA depuis un message WhatsApp ou un e-mail (usage n°1)
- **FR-36** : Une référence de déclaration immédiate et un accusé de déclaration
- **FR-37** : Le numéro de sinistre officiel vient du logiciel de la compagnie
- **FR-38** : Le doublon se contrôle à la déclaration, dans Prospera et dans le LC
- **FR-39** : Une déclaration s'enregistre toujours ; les contrôles donnent des réserves
- **FR-40** : Urgence corporelle et responsabilité initiale
- **FR-41** : La recevabilité répond à quatre questions, sur les contrats lus
- **FR-42** : Le contrôle de garantie ne se saute pas
- **FR-43** : Une déclaration tardive donne une réserve et un motif, jamais une déchéance automatique
- **FR-44** : Les pièces obligatoires et complémentaires dépendent du type de sinistre
- **FR-45** : Ouvrir « en attente de pièces », puis reprendre le circuit
- **FR-46** : La liste exacte des pièces est remise à l'assuré, avec un courrier de demande
- **FR-47** : Pièces manquantes et relances rédigées par l'IA (usage n°4)
- **FR-48** : Accusé de réception du dossier complet (10 jours au plus), courtier et coassureurs informés
- **FR-49** : La provision d'ouverture est posée à l'ouverture
- **FR-50** : Le responsable affecte le dossier ; l'accueil oriente, il n'affecte jamais
- **FR-51** : La charge pondérée guide l'affectation ; la réaffectation exige un motif
- **FR-52** : Prendre le dossier en instruction
- **FR-53** : Contrôle des pièces par l'IA : cohérence et photo réutilisée (usage n°3)
- **FR-54** : La responsabilité se qualifie à l'instruction, et ouvre le recours
- **FR-55** : Un formulaire d'instruction par type de sinistre
- **FR-56** : Pré-remplissage de l'instruction par l'IA (usage n°7)
- **FR-57** : Demander des pièces complémentaires pendant l'instruction
- **FR-57a** : Les sinistres majeurs
- **FR-58** : L'orientation d'expertise assistée propose, elle ne crée rien
- **FR-59** : Les seuils d'expertise et la voie « accord sur devis »
- **FR-60** : Analyse des devis par l'IA (usage n°8)
- **FR-61** : La mission d'expertise a sa propre machine d'états
- **FR-62** : Désigner l'expert, interne ou externe
- **FR-63** : L'expertise médicale : convocation, examen, rapport, médecin-conseil
- **FR-63a** : Le suivi médical du dossier corporel
- **FR-64** : Contrôle de complétude d'un rapport d'expertise, assisté par l'IA
- **FR-65** : L'écart entre le rapport et le dossier : 15 % d'attention, 35 % bloquant
- **FR-66** : La contre-expertise ne revient ni au cabinet initial ni au panel interne
- **FR-67** : Un complément demandé et non revenu bloque la validation ; le cabinet sans compte
- **FR-68** : Délais de rapport par domaine et honoraires d'expert
- **FR-69** : Le décompte suit un ordre fixe : dommage, vétusté, règle proportionnelle, plafond, franchise
- **FR-70** : Le corporel se calcule poste par poste, selon le Code CIMA (art. 257 à 266)
- **FR-70a** : Le registre des décès et des ayants droit
- **FR-71** : L'IA ne propose jamais de montant sur un préjudice corporel
- **FR-72** : Le matériel automobile : vétusté sur pièces selon l'âge, et épave
- **FR-73** : Les autres types de sinistre, et l'arrondi
- **FR-74** : « Pourquoi ce montant ? » : l'explication assistée par l'IA (usage n°9)
- **FR-75** : Une évaluation arrêtée n'est jamais recalculée ; les cinq montants ne se confondent pas
- **FR-76** : La provision est revue à chaque événement, avec un motif
- **FR-77** : Envoyer en validation avec une fiche de décision préparée
- **FR-78** : Une matrice de délégation à plusieurs niveaux, paramétrable
- **FR-79** : Le comité sinistres : quorum, votes, procès-verbal de séance
- **FR-80** : Tolérances affichées au signataire, et renvoi motivé
- **FR-81** : Séparation des tâches : celui qui décide ne paie pas
- **FR-82** : L'offre est préparée, définitive ou provisionnelle
- **FR-83** : L'offre est rédigée par l'IA, relue et signée par l'agent (usage n°11)
- **FR-84** : L'offre validée part sous 48 heures ouvrées
- **FR-85** : Les délais légaux du corporel et la pénalité de 5 % par mois, séparés des délais internes
- **FR-86** : L'accord est enregistré ; aucun ordre sans accord
- **FR-87** : Une contre-proposition rouvre l'instruction avec un motif
- **FR-88** : Un refus de l'offre mène au litige et à la contre-expertise
- **FR-89** : Une offre sans réponse déclenche des relances et une alerte
- **FR-90** : L'ordre de règlement naît de l'accord enregistré, jamais sans
- **FR-91** : Un dossier peut porter plusieurs règlements
- **FR-92** : États du règlement, états de la quittance, statut du dossier
- **FR-93** : La comptabilité émet le règlement, et seule la comptabilité
- **FR-94** : Le règlement par chèque
- **FR-95** : Le règlement par virement, PI-SPI ou Mobile Money
- **FR-96** : La quittance, signée avant tout paiement électronique
- **FR-97** : La remise du chèque au guichet
- **FR-98** : Les espèces sont plafonnées
- **FR-99** : La comptabilité peut rejeter l'ordre
- **FR-100** : Les contrôles LBC/FT avant paiement
- **FR-101** : Le chèque non retiré se relance puis s'expose
- **FR-102** : Le paiement sous 72 heures après l'accord
- **FR-103** : L'état et l'export pour la comptabilité
- **FR-104** : Les conditions de clôture
- **FR-105** : Les effets de la clôture
- **FR-106** : Le recours continue seul quand le dossier est clos
- **FR-107** : La réouverture d'un dossier clos
- **FR-108** : Le recours naît dès l'ouverture quand un tiers est en cause
- **FR-109** : La lettre de mise en cause part dès l'ouverture
- **FR-110** : Le recours se relance tous les 15 jours
- **FR-111** : La réclamation du remboursement part après le paiement de l'assuré (subrogation)
- **FR-112** : La machine du recours
- **FR-113** : La créance et ses trois montants
- **FR-114** : La mise en demeure
- **FR-115** : La négociation
- **FR-116** : Le contentieux
- **FR-117** : Les encaissements se rapprochent avant d'être imputés
- **FR-118** : La prescription, un terme à vérifier
- **FR-119** : L'arbitrage entre assureurs et les conventions, en paramètre
- **FR-120** : L'IA du recours (usage n° 12)
- **FR-121** : Le refus de prise en charge (`REJETE`) est motivé et opposable
- **FR-122** : Le courrier de refus est rédigé par l'IA, relu et signé (usage n° 11)
- **FR-123** : Le classement sans suite quand l'assuré est injoignable
- **FR-124** : Le litige quand l'offre est refusée ou contestée
- **FR-125** : La fraude suspectée suspend le paiement sans le dire à l'assuré
- **FR-126** : La réouverture des sorties
- **FR-127** : Les signaux et leurs poids
- **FR-128** : Le score est plafonné à 100 et se lit en quatre niveaux
- **FR-129** : La revue humaine est obligatoire et motivée
- **FR-130** : Un dossier BLOQUE non écarté suspend l'ordre et le paiement
- **FR-131** : La priorisation des revues
- **FR-132** : Le graphe des liens par l'IA (usage n° 10)
- **FR-133** : La confirmation de la fraude par la direction ou le contrôle interne
- **FR-134** : Les statuts du dossier
- **FR-135** : Les transitions
- **FR-136** : Les conditions nommées et leur texte
- **FR-137** : Un écran ne peut pas forcer ce que le serveur refuse
- **FR-138** : La piste d'audit de chaque transition
- **FR-139** : Aucun état non terminal sans issue
- **FR-140** : Toute échéance a une nature, un départ, un arrêt, une valeur de paramètre
- **FR-141** : Les échéances réglementaires du corporel automobile
- **FR-142** : Les échéances internes, le matériel et les autres branches
- **FR-143** : Les relances : 5 jours entre deux, 3 sans effet, puis un arbitrage
- **FR-144** : Les dossiers muets se détectent à 8, 15 et 30 jours
- **FR-145** : Les pièces bloquantes, et les vues des échéances
- **FR-146** : Les notifications du circuit
- **FR-147** : La corbeille du gestionnaire et la file du responsable
- **FR-148** : La file de validation, la file de la comptabilité, le guichet de remise
- **FR-149** : Les files du pôle recours et du contrôle interne
- **FR-150** : Une seule recherche pour tout retrouver
- **FR-151** : La recherche tolère les fautes et respecte les droits
- **FR-152** : La fiche « répondre pendant l'appel »
- **FR-153** : Téléphone masqué et données de santé protégées
- **FR-154** : Le résumé sourcé du dossier (IA, usage n° 5)
- **FR-155** : La recherche en langage naturel (IA, usage n° 6)
- **FR-156** : Les réclamations des assurés
- **FR-157** : La réponse à une réclamation, rédigée par l'IA (usage n° 11)
- **FR-158** : Chaque consultation est tracée
- **FR-159** : Une pièce se reçoit au guichet, par téléversement ou par l'opérateur de numérisation
- **FR-160** : Les types et la taille des fichiers sont des paramètres
- **FR-161** : Une pièce a des versions, jamais écrasées
- **FR-162** : Les lots de numérisation
- **FR-163** : L'OCR est réel, y compris sur les pièces scannées
- **FR-164** : L'IA lit et classe les pièces (usage n° 2)
- **FR-165** : Un contrôle humain avant tout archivage
- **FR-166** : Les pièces non rattachées ont une file
- **FR-167** : Le numéro d'archivage
- **FR-168** : Verser un dossier clos au fonds
- **FR-169** : Le scellement par empreinte, et le support de référence
- **FR-170** : L'archive physique a une cote, une boîte et une chemise de couleur
- **FR-171** : La sortie et la restitution du papier
- **FR-172** : Le papier reste obligatoire (double support)
- **FR-173** : Reconstituer un dossier perdu
- **FR-174** : La conservation dure au moins 10 ans, plus selon la nature
- **FR-175** : Détruire est une décision visée et tracée, jamais un défaut
- **FR-176** : Les pièces vivent sur le NAS de la compagnie, sauvegardées chaque jour
- **FR-177** : Le référentiel des experts
- **FR-178** : Un agrément échu rend l'expert non désignable
- **FR-179** : Le panel interne et le médecin-conseil
- **FR-180** : Le portail du cabinet externe
- **FR-181** : Un cabinet sans compte : le gestionnaire saisit
- **FR-182** : Les honoraires de l'expert : note, visa, jamais au-delà du facturé
- **FR-183** : La charge et la capacité des experts
- **FR-184** : Les délais de rapport, par domaine
- **FR-185** : Le budget indicatif d'une mission
- **FR-185a** : Les intervenants tiers des risques divers
- **FR-186** : Les polices sont lues du LC, datées, jamais modifiées
- **FR-187** : Les garanties qui répondent d'un type de sinistre
- **FR-188** : La provision, dossier par dossier
- **FR-189** : L'état des provisions (PSAP), par exercice de survenance, brut, cédé, net
- **FR-190** : La réassurance, par traité et par millésime
- **FR-191** : La coassurance, par clé de répartition
- **FR-192** : Les données des états pour le contrôle de la CRCA
- **FR-193** : L'export pour la comptabilité
- **FR-194** : Le LC fait foi pour les contrats et le numéro de sinistre ; Prospera tient le dossier
- **FR-195** : Prospera reçoit du LC les objets des contrats
- **FR-196** : Prospera renvoie au LC ce qu'il décide
- **FR-197** : API ou fichier, dans les deux sens
- **FR-198** : Le numéro de sinistre : référence immédiate, numéro officiel ensuite
- **FR-199** : Quand le LC ne sait pas recevoir, Prospera sort la liste « à saisir dans le logiciel de la compagnie »
- **FR-200** : L'idempotence, le rejet motivé et la file des écarts sont des capacités du contrat
- **FR-201** : Chaque écran dit la fraîcheur, et Prospera continue quand le LC est coupé
- **FR-202** : Le LC fictif tient ce que tient un vrai LC
- **FR-203** : Le LC fictif attribue les numéros de sinistre
- **FR-204** : Le LC fictif sait tomber en panne et refuser
- **FR-205** : Il n'est jamais installé en production ; la démo se remet à zéro
- **FR-206** : Le tableau de bord du responsable et de la direction : où en sont les dossiers
- **FR-207** : La charge, les pièces attendues, les règlements en attente, les délais qui expirent
- **FR-208** : Le brief du matin et la veille (IA, usage n° 13)
- **FR-209** : La note de qualité du dossier et la simulation « et si… » (IA, usage n° 14)
- **FR-210** : Le contrôle interne : le plan de contrôle exécuté sur les données
- **FR-211** : Un dossier prêt pour un contrôle de la CRCA, sans reconstitution
- **FR-212** : Tout indicateur se recalcule depuis les données
- **FR-213** : Les indicateurs de délai et de qualité du circuit
- **FR-214** : La reprise lit une API ou un fichier Excel ou JSON, et traduit sans trahir
- **FR-215** : Les dossiers en cours d'abord, le numéro d'archivage conservé, le papier tenu
- **FR-216** : Le rapport de reprise, validé avant que rien n'entre
- **FR-217** : La resynchronisation nocturne, et le dossier qui change des deux côtés
- **FR-218** : Le feu vert de la reprise, module par module
- **FR-219** : Ce que la compagnie doit fournir, et le premier risque
- **FR-220** : Paiement : `sinistres` ordonne, `paiement` exécute
- **FR-221** : Le chèque est enregistré, pas exécuté
- **FR-222** : Virement bancaire et PI-SPI
- **FR-223** : Mobile Money sortant : T-Money et Flooz
- **FR-224** : Rapprochement des règlements
- **FR-225** : Plafond d'espèces et LBC/FT
- **FR-226** : Notification : SMS, WhatsApp, e-mail et cloche, servis par le relais
- **FR-227** : Aucune donnée de santé dans un message
- **FR-228** : Tableau de bord : un cockpit par rôle, spécifié au §6.7
- **FR-229** : Vue finance et vue exploitation
- **FR-230** : Ce que la compagnie fournit à l'IA commune, ce qu'elle en reçoit, et sous quel consentement
- **FR-231** : L'apprentissage sur l'historique repris, le réentraînement mensuel, le rapport mensuel
- **FR-232** : Rien de nominatif ni de médical ne sort
- **FR-233** : Les mises à jour de l'IA sont versionnées et retirables
- **FR-234** : Un serveur applicatif et un NAS chez la compagnie
- **FR-235** : Les mises à jour : essai, date choisie, retour arrière, fichier signé
- **FR-236** : Sauvegarde quotidienne, restauration testée, conservation
- **FR-237** : L'accès des guichets au serveur central
- **FR-238** : L'exploitation est faite par l'équipe informatique de la compagnie, qui ne lit pas le métier
- **FR-239** : Le relais Money Vibes, parce qu'aucun port n'est ouvert chez la compagnie
- **FR-240** : Mise en service
- **FR-241** : Le support à distance est ouvert par la compagnie seule
- **FR-242** : Réversibilité et remise d'exploitation
- **FR-244** : Réseau : le site central, les guichets, les volets
- **FR-245** : Connecteurs : hors février ; l'échange générique, lui, est du premier jour
- **FR-246** : Support : une anomalie bloquante prise en charge en 4 heures ouvrées
- **FR-250** : Performance de la recherche et des écrans de travail
- **FR-251** : Disponibilité pendant les heures d'ouverture
- **FR-252** : Sauvegarde quotidienne et restauration testée
- **FR-253** : Chiffrement des pièces et des données sensibles
- **FR-254** : Double authentification et sessions
- **FR-255** : Journal, trace et lecture des consultations
- **FR-256** : Conservation de dix ans au moins
- **FR-257** : Données personnelles, hébergement et aucun port entrant
- **FR-258** : Accessibilité depuis les postes existants
- **FR-259** : Le travail se fait en ligne ; le hors connexion n'est pas requis
- **FR-260** : Langue française, montants en FCFA, dates
- **FR-261** : Exploitation par l'équipe informatique de la compagnie
- **FR-262** : Exactitude des montants et des indicateurs
- **FR-263** : Fichiers déposés contrôlés
- **FR-264** : Évolution par paramètres, et recette sur le vrai serveur

### NonFunctional Requirements

Les exigences non fonctionnelles du PRD (§8) sont numérotées **FR-250 → FR-264** : elles figurent dans la liste ci-dessus et dans la carte de couverture, rattachées à l'épic qui les porte le mieux (performance de la recherche : EPIC-213 ; chiffrement, journal, accessibilité, hors connexion, langue, exactitude : EPIC-201 ; conservation, fichiers contrôlés : EPIC-214 ; double authentification : EPIC-202 ; disponibilité, sauvegarde, hébergement, exploitation, recette sur le vrai serveur : EPIC-221). Les valeurs par défaut sont celles de l'annexe D du PRD ; la perte maximale (1 h) et la reprise (4 h) sont celles du moteur (spine AD-25), qui corrigent la proposition A-14 du PRD.

### Additional Requirements (spine)

- **AD-1** : Le LC fait foi pour les contrats et le numéro ; Prospera ne tient que des projections datées
- **AD-2** : Les unités et leurs données : un propriétaire par objet
- **AD-3** : Services, module `assurance` existant et découpage
- **AD-4** : La machine à états du dossier : un écrivain, 42 transitions en donnée versionnée
- **AD-5** : Ordres et règlements : `sinistres` ordonne, `paiement` est le seul registre des règlements
- **AD-6** : Numéro de sinistre et déclaration : `DEC-` sans trou, une seule voie, un seul numéro
- **AD-7** : La séparation des tâches se vérifie sur l'historique des acteurs, à chaque commande
- **AD-8** : Les données de santé : classées, appliquées par le propriétaire, jamais dans un événement
- **AD-9** : Pièces, OCR et archives : `ged` stocke, scelle, numérote, ne détruit rien seul
- **AD-10** : L'IA : `PropositionPort`, décision humaine chez le consommateur, jamais bloquante
- **AD-11** : Provisions : `sinistres` propose, `assurance` est seul écrivain des mouvements et du PSAP
- **AD-12** : Paramètres et référentiels datés : jugé à la date de survenance, évaluation figée
- **AD-13** : L'échange avec le LC : un port, deux transports, Prospera tire
- **AD-14** : La reprise : un objet par module cible, la clé d'origine suit, les dossiers en cours d'abord
- **AD-15** : Le portail des cabinets d'expertise : par le relais, aucun port entrant
- **AD-16** : Un seul catalogue de contrats nommés
- **AD-17** : La piste d'audit et le journal des consultations : par module, chaînés, 10 ans
- **AD-18** : Montants, temps et délais
- **AD-19** : La démonstration : un LC fictif, jamais en production
- **AD-20** : Après une restauration : numéros qui ne reculent pas, aucune émission avant rapprochement
- **AD-21** : Ce que cette spine change chez ses voisins
- **AD-22** : Identité, immuabilité et suspension d'un ordre
- **AD-23** : Registre `classification-sante` : une seule liste des champs classés
- **AD-24** : Recherche, champs sensibles et index aveugle
- **AD-25** : Exploitation : sauvegardes, supervision, sorties, mises à jour
- **AD-26** : Portée et accès par dossier : appliqués par chaque service
- **AD-27** : Échéances, pilotage et canaux entrants

### UX Design Requirements

Il n'y a pas de contrat UX séparé : **le front de démo `prospera-font-end/prospera-assurance` (et `docs/SPEC_METIER.md`) sert de maquette** (décision du PO, comme pour le distributeur et la microfinance). Chaque épic reprend les écrans de la démo qu'il touche, branchés ou « bientôt » (jamais simulés, FR-22), et crée les écrans qui manquent. La règle de la maquette d'abord s'applique (`prototypes/prospera-prototype.html`).

### FR Coverage Map

- FR-1 → EPIC-201 — Les règles transverses du PRD distributeur valent ici
- FR-2 → EPIC-203 — Ce que Prospera tient, ce que le logiciel de la compagnie tient
- FR-3 → EPIC-203 — Les contrats sont lus, jamais modifiés
- FR-4 → EPIC-204 — Les seuils de la démo sont des valeurs par défaut
- FR-5 → EPIC-216 — Les seuils d'alerte se calibrent sur les données reprises
- FR-6 → EPIC-202 — Quatorze rôles, un périmètre par rôle
- FR-7 → EPIC-202 — Séparation des tâches
- FR-8 → EPIC-202 — La matrice de délégation est un paramètre
- FR-9 → EPIC-201 — Les données de santé sont des données sensibles
- FR-10 → EPIC-217 — L'IA est spécifiée ici, servie par l'IA commune
- FR-11 → EPIC-217 — Les garde-fous de l'IA
- FR-12 → EPIC-217 — Le registre de l'IA et l'instance locale
- FR-13 → EPIC-201 — Qui a fait quoi, qui a lu quoi, et quand
- FR-14 → EPIC-205 — Délais légaux et délais internes, séparés
- FR-15 → EPIC-204 — La compagnie de démonstration
- FR-16 → EPIC-204 — Dans la démo, on crée pour de vrai, rôle après rôle
- FR-17 → EPIC-204 — Un jeu cohérent au franc près
- FR-18 → EPIC-220 — Les messages passent par `notification`
- FR-19 → EPIC-220 — Données personnelles et consentements
- FR-20 → EPIC-201 — Les modules de la compagnie s'installent un par un
- FR-21 → EPIC-214 — Le papier reste tenu, le numérique sert
- FR-22 → EPIC-201 — « Bientôt » n'est jamais simulé
- FR-23 → EPIC-221 — Une hypothèse de dimensionnement, à remplacer par les vrais volumes
- FR-24 → EPIC-221 — Revue juridique obligatoire avant la mise en service
- FR-25 → EPIC-202 — Authentification, sessions et double authentification
- FR-26 → EPIC-209 — Toute décision est défendable
- FR-27 → EPIC-201 — Le processus évolue par paramètres, puis par version
- FR-28 → EPIC-205 — Deux agents, un dossier
- FR-29 → EPIC-202 — Partie au dossier
- FR-30 → EPIC-205 — Le dossier avance par 8 phases et 11 statuts, et chaque pas est gardé
- FR-31 → EPIC-205 — Quatre sorties du circuit, chacune avec un motif
- FR-32 → EPIC-212 — Le recours est un suivi parallèle, pas un statut du dossier
- FR-33 → EPIC-205 — Quatre règles tiennent tout le circuit
- FR-34 → EPIC-206 — Le sinistre se déclare par quatre canaux, avec un mode de saisie commun
- FR-35 → EPIC-217 — Déclaration assistée par l'IA depuis un message WhatsApp ou un e-mail (usage n°1)
- FR-36 → EPIC-206 — Une référence de déclaration immédiate et un accusé de déclaration
- FR-37 → EPIC-203 — Le numéro de sinistre officiel vient du logiciel de la compagnie
- FR-38 → EPIC-206 — Le doublon se contrôle à la déclaration, dans Prospera et dans le LC
- FR-39 → EPIC-206 — Une déclaration s'enregistre toujours ; les contrôles donnent des réserves
- FR-40 → EPIC-206 — Urgence corporelle et responsabilité initiale
- FR-41 → EPIC-206 — La recevabilité répond à quatre questions, sur les contrats lus
- FR-42 → EPIC-206 — Le contrôle de garantie ne se saute pas
- FR-43 → EPIC-206 — Une déclaration tardive donne une réserve et un motif, jamais une déchéance automatique
- FR-44 → EPIC-206 — Les pièces obligatoires et complémentaires dépendent du type de sinistre
- FR-45 → EPIC-206 — Ouvrir « en attente de pièces », puis reprendre le circuit
- FR-46 → EPIC-206 — La liste exacte des pièces est remise à l'assuré, avec un courrier de demande
- FR-47 → EPIC-217 — Pièces manquantes et relances rédigées par l'IA (usage n°4)
- FR-48 → EPIC-206 — Accusé de réception du dossier complet (10 jours au plus), courtier et coassureurs informés
- FR-49 → EPIC-206 — La provision d'ouverture est posée à l'ouverture
- FR-50 → EPIC-206 — Le responsable affecte le dossier ; l'accueil oriente, il n'affecte jamais
- FR-51 → EPIC-206 — La charge pondérée guide l'affectation ; la réaffectation exige un motif
- FR-52 → EPIC-207 — Prendre le dossier en instruction
- FR-53 → EPIC-217 — Contrôle des pièces par l'IA : cohérence et photo réutilisée (usage n°3)
- FR-54 → EPIC-207 — La responsabilité se qualifie à l'instruction, et ouvre le recours
- FR-55 → EPIC-207 — Un formulaire d'instruction par type de sinistre
- FR-56 → EPIC-217 — Pré-remplissage de l'instruction par l'IA (usage n°7)
- FR-57 → EPIC-207 — Demander des pièces complémentaires pendant l'instruction
- FR-57a → EPIC-207 — Les sinistres majeurs
- FR-58 → EPIC-218 — L'orientation d'expertise assistée propose, elle ne crée rien
- FR-59 → EPIC-208 — Les seuils d'expertise et la voie « accord sur devis »
- FR-60 → EPIC-218 — Analyse des devis par l'IA (usage n°8)
- FR-61 → EPIC-208 — La mission d'expertise a sa propre machine d'états
- FR-62 → EPIC-208 — Désigner l'expert, interne ou externe
- FR-63 → EPIC-208 — L'expertise médicale : convocation, examen, rapport, médecin-conseil
- FR-63a → EPIC-208 — Le suivi médical du dossier corporel
- FR-64 → EPIC-218 — Contrôle de complétude d'un rapport d'expertise, assisté par l'IA
- FR-65 → EPIC-208 — L'écart entre le rapport et le dossier : 15 % d'attention, 35 % bloquant
- FR-66 → EPIC-208 — La contre-expertise ne revient ni au cabinet initial ni au panel interne
- FR-67 → EPIC-208 — Un complément demandé et non revenu bloque la validation ; le cabinet sans compte
- FR-68 → EPIC-208 — Délais de rapport par domaine et honoraires d'expert
- FR-69 → EPIC-207 — Le décompte suit un ordre fixe : dommage, vétusté, règle proportionnelle, plafond, franchise
- FR-70 → EPIC-207 — Le corporel se calcule poste par poste, selon le Code CIMA (art. 257 à 266)
- FR-70a → EPIC-207 — Le registre des décès et des ayants droit
- FR-71 → EPIC-207 — L'IA ne propose jamais de montant sur un préjudice corporel
- FR-72 → EPIC-207 — Le matériel automobile : vétusté sur pièces selon l'âge, et épave
- FR-73 → EPIC-207 — Les autres types de sinistre, et l'arrondi
- FR-74 → EPIC-217 — « Pourquoi ce montant ? » : l'explication assistée par l'IA (usage n°9)
- FR-75 → EPIC-207 — Une évaluation arrêtée n'est jamais recalculée ; les cinq montants ne se confondent pas
- FR-76 → EPIC-215 — La provision est revue à chaque événement, avec un motif
- FR-77 → EPIC-209 — Envoyer en validation avec une fiche de décision préparée
- FR-78 → EPIC-209 — Une matrice de délégation à plusieurs niveaux, paramétrable
- FR-79 → EPIC-209 — Le comité sinistres : quorum, votes, procès-verbal de séance
- FR-80 → EPIC-209 — Tolérances affichées au signataire, et renvoi motivé
- FR-81 → EPIC-209 — Séparation des tâches : celui qui décide ne paie pas
- FR-82 → EPIC-209 — L'offre est préparée, définitive ou provisionnelle
- FR-83 → EPIC-217 — L'offre est rédigée par l'IA, relue et signée par l'agent (usage n°11)
- FR-84 → EPIC-209 — L'offre validée part sous 48 heures ouvrées
- FR-85 → EPIC-209 — Les délais légaux du corporel et la pénalité de 5 % par mois, séparés des délais internes
- FR-86 → EPIC-209 — L'accord est enregistré ; aucun ordre sans accord
- FR-87 → EPIC-209 — Une contre-proposition rouvre l'instruction avec un motif
- FR-88 → EPIC-209 — Un refus de l'offre mène au litige et à la contre-expertise
- FR-89 → EPIC-209 — Une offre sans réponse déclenche des relances et une alerte
- FR-90 → EPIC-210 — L'ordre de règlement naît de l'accord enregistré, jamais sans
- FR-91 → EPIC-210 — Un dossier peut porter plusieurs règlements
- FR-92 → EPIC-210 — États du règlement, états de la quittance, statut du dossier
- FR-93 → EPIC-210 — La comptabilité émet le règlement, et seule la comptabilité
- FR-94 → EPIC-210 — Le règlement par chèque
- FR-95 → EPIC-210 — Le règlement par virement, PI-SPI ou Mobile Money
- FR-96 → EPIC-210 — La quittance, signée avant tout paiement électronique
- FR-97 → EPIC-210 — La remise du chèque au guichet
- FR-98 → EPIC-210 — Les espèces sont plafonnées
- FR-99 → EPIC-210 — La comptabilité peut rejeter l'ordre
- FR-100 → EPIC-210 — Les contrôles LBC/FT avant paiement
- FR-101 → EPIC-210 — Le chèque non retiré se relance puis s'expose
- FR-102 → EPIC-210 — Le paiement sous 72 heures après l'accord
- FR-103 → EPIC-210 — L'état et l'export pour la comptabilité
- FR-104 → EPIC-211 — Les conditions de clôture
- FR-105 → EPIC-211 — Les effets de la clôture
- FR-106 → EPIC-212 — Le recours continue seul quand le dossier est clos
- FR-107 → EPIC-211 — La réouverture d'un dossier clos
- FR-108 → EPIC-212 — Le recours naît dès l'ouverture quand un tiers est en cause
- FR-109 → EPIC-212 — La lettre de mise en cause part dès l'ouverture
- FR-110 → EPIC-212 — Le recours se relance tous les 15 jours
- FR-111 → EPIC-212 — La réclamation du remboursement part après le paiement de l'assuré (subrogation)
- FR-112 → EPIC-212 — La machine du recours
- FR-113 → EPIC-212 — La créance et ses trois montants
- FR-114 → EPIC-212 — La mise en demeure
- FR-115 → EPIC-212 — La négociation
- FR-116 → EPIC-212 — Le contentieux
- FR-117 → EPIC-212 — Les encaissements se rapprochent avant d'être imputés
- FR-118 → EPIC-212 — La prescription, un terme à vérifier
- FR-119 → EPIC-212 — L'arbitrage entre assureurs et les conventions, en paramètre
- FR-120 → EPIC-218 — L'IA du recours (usage n° 12)
- FR-121 → EPIC-211 — Le refus de prise en charge (`REJETE`) est motivé et opposable
- FR-122 → EPIC-218 — Le courrier de refus est rédigé par l'IA, relu et signé (usage n° 11)
- FR-123 → EPIC-211 — Le classement sans suite quand l'assuré est injoignable
- FR-124 → EPIC-211 — Le litige quand l'offre est refusée ou contestée
- FR-125 → EPIC-212 — La fraude suspectée suspend le paiement sans le dire à l'assuré
- FR-126 → EPIC-211 — La réouverture des sorties
- FR-127 → EPIC-212 — Les signaux et leurs poids
- FR-128 → EPIC-212 — Le score est plafonné à 100 et se lit en quatre niveaux
- FR-129 → EPIC-212 — La revue humaine est obligatoire et motivée
- FR-130 → EPIC-212 — Un dossier BLOQUE non écarté suspend l'ordre et le paiement
- FR-131 → EPIC-212 — La priorisation des revues
- FR-132 → EPIC-218 — Le graphe des liens par l'IA (usage n° 10)
- FR-133 → EPIC-212 — La confirmation de la fraude par la direction ou le contrôle interne
- FR-134 → EPIC-205 — Les statuts du dossier
- FR-135 → EPIC-205 — Les transitions
- FR-136 → EPIC-205 — Les conditions nommées et leur texte
- FR-137 → EPIC-205 — Un écran ne peut pas forcer ce que le serveur refuse
- FR-138 → EPIC-205 — La piste d'audit de chaque transition
- FR-139 → EPIC-205 — Aucun état non terminal sans issue
- FR-140 → EPIC-205 — Toute échéance a une nature, un départ, un arrêt, une valeur de paramètre
- FR-141 → EPIC-205 — Les échéances réglementaires du corporel automobile
- FR-142 → EPIC-205 — Les échéances internes, le matériel et les autres branches
- FR-143 → EPIC-205 — Les relances : 5 jours entre deux, 3 sans effet, puis un arbitrage
- FR-144 → EPIC-205 — Les dossiers muets se détectent à 8, 15 et 30 jours
- FR-145 → EPIC-205 — Les pièces bloquantes, et les vues des échéances
- FR-146 → EPIC-220 — Les notifications du circuit
- FR-147 → EPIC-205 — La corbeille du gestionnaire et la file du responsable
- FR-148 → EPIC-205 — La file de validation, la file de la comptabilité, le guichet de remise
- FR-149 → EPIC-216 — Les files du pôle recours et du contrôle interne
- FR-150 → EPIC-213 — Une seule recherche pour tout retrouver
- FR-151 → EPIC-213 — La recherche tolère les fautes et respecte les droits
- FR-152 → EPIC-213 — La fiche « répondre pendant l'appel »
- FR-153 → EPIC-213 — Téléphone masqué et données de santé protégées
- FR-154 → EPIC-217 — Le résumé sourcé du dossier (IA, usage n° 5)
- FR-155 → EPIC-217 — La recherche en langage naturel (IA, usage n° 6)
- FR-156 → EPIC-213 — Les réclamations des assurés
- FR-157 → EPIC-217 — La réponse à une réclamation, rédigée par l'IA (usage n° 11)
- FR-158 → EPIC-213 — Chaque consultation est tracée
- FR-159 → EPIC-214 — Une pièce se reçoit au guichet, par téléversement ou par l'opérateur de numérisation
- FR-160 → EPIC-214 — Les types et la taille des fichiers sont des paramètres
- FR-161 → EPIC-214 — Une pièce a des versions, jamais écrasées
- FR-162 → EPIC-214 — Les lots de numérisation
- FR-163 → EPIC-214 — L'OCR est réel, y compris sur les pièces scannées
- FR-164 → EPIC-217 — L'IA lit et classe les pièces (usage n° 2)
- FR-165 → EPIC-214 — Un contrôle humain avant tout archivage
- FR-166 → EPIC-214 — Les pièces non rattachées ont une file
- FR-167 → EPIC-214 — Le numéro d'archivage
- FR-168 → EPIC-214 — Verser un dossier clos au fonds
- FR-169 → EPIC-214 — Le scellement par empreinte, et le support de référence
- FR-170 → EPIC-214 — L'archive physique a une cote, une boîte et une chemise de couleur
- FR-171 → EPIC-214 — La sortie et la restitution du papier
- FR-172 → EPIC-214 — Le papier reste obligatoire (double support)
- FR-173 → EPIC-214 — Reconstituer un dossier perdu
- FR-174 → EPIC-214 — La conservation dure au moins 10 ans, plus selon la nature
- FR-175 → EPIC-214 — Détruire est une décision visée et tracée, jamais un défaut
- FR-176 → EPIC-214 — Les pièces vivent sur le NAS de la compagnie, sauvegardées chaque jour
- FR-177 → EPIC-208 — Le référentiel des experts
- FR-178 → EPIC-208 — Un agrément échu rend l'expert non désignable
- FR-179 → EPIC-208 — Le panel interne et le médecin-conseil
- FR-180 → EPIC-220 — Le portail du cabinet externe
- FR-181 → EPIC-208 — Un cabinet sans compte : le gestionnaire saisit
- FR-182 → EPIC-208 — Les honoraires de l'expert : note, visa, jamais au-delà du facturé
- FR-183 → EPIC-208 — La charge et la capacité des experts
- FR-184 → EPIC-208 — Les délais de rapport, par domaine
- FR-185 → EPIC-208 — Le budget indicatif d'une mission
- FR-185a → EPIC-208 — Les intervenants tiers des risques divers
- FR-186 → EPIC-215 — Les polices sont lues du LC, datées, jamais modifiées
- FR-187 → EPIC-215 — Les garanties qui répondent d'un type de sinistre
- FR-188 → EPIC-215 — La provision, dossier par dossier
- FR-189 → EPIC-215 — L'état des provisions (PSAP), par exercice de survenance, brut, cédé, net
- FR-190 → EPIC-215 — La réassurance, par traité et par millésime
- FR-191 → EPIC-215 — La coassurance, par clé de répartition
- FR-192 → EPIC-215 — Les données des états pour le contrôle de la CRCA
- FR-193 → EPIC-215 — L'export pour la comptabilité
- FR-194 → EPIC-203 — Le LC fait foi pour les contrats et le numéro de sinistre ; Prospera tient le dossier
- FR-195 → EPIC-203 — Prospera reçoit du LC les objets des contrats
- FR-196 → EPIC-203 — Prospera renvoie au LC ce qu'il décide
- FR-197 → EPIC-203 — API ou fichier, dans les deux sens
- FR-198 → EPIC-203 — Le numéro de sinistre : référence immédiate, numéro officiel ensuite
- FR-199 → EPIC-203 — Quand le LC ne sait pas recevoir, Prospera sort la liste « à saisir dans le logiciel de la compagnie »
- FR-200 → EPIC-203 — L'idempotence, le rejet motivé et la file des écarts sont des capacités du contrat
- FR-201 → EPIC-203 — Chaque écran dit la fraîcheur, et Prospera continue quand le LC est coupé
- FR-202 → EPIC-204 — Le LC fictif tient ce que tient un vrai LC
- FR-203 → EPIC-204 — Le LC fictif attribue les numéros de sinistre
- FR-204 → EPIC-204 — Le LC fictif sait tomber en panne et refuser
- FR-205 → EPIC-204 — Il n'est jamais installé en production ; la démo se remet à zéro
- FR-206 → EPIC-216 — Le tableau de bord du responsable et de la direction : où en sont les dossiers
- FR-207 → EPIC-216 — La charge, les pièces attendues, les règlements en attente, les délais qui expirent
- FR-208 → EPIC-217 — Le brief du matin et la veille (IA, usage n° 13)
- FR-209 → EPIC-217 — La note de qualité du dossier et la simulation « et si… » (IA, usage n° 14)
- FR-210 → EPIC-216 — Le contrôle interne : le plan de contrôle exécuté sur les données
- FR-211 → EPIC-216 — Un dossier prêt pour un contrôle de la CRCA, sans reconstitution
- FR-212 → EPIC-216 — Tout indicateur se recalcule depuis les données
- FR-213 → EPIC-216 — Les indicateurs de délai et de qualité du circuit
- FR-214 → EPIC-219 — La reprise lit une API ou un fichier Excel ou JSON, et traduit sans trahir
- FR-215 → EPIC-219 — Les dossiers en cours d'abord, le numéro d'archivage conservé, le papier tenu
- FR-216 → EPIC-219 — Le rapport de reprise, validé avant que rien n'entre
- FR-217 → EPIC-219 — La resynchronisation nocturne, et le dossier qui change des deux côtés
- FR-218 → EPIC-219 — Le feu vert de la reprise, module par module
- FR-219 → EPIC-219 — Ce que la compagnie doit fournir, et le premier risque
- FR-220 → EPIC-210 — Paiement : `sinistres` ordonne, `paiement` exécute
- FR-221 → EPIC-210 — Le chèque est enregistré, pas exécuté
- FR-222 → EPIC-210 — Virement bancaire et PI-SPI
- FR-223 → EPIC-210 — Mobile Money sortant : T-Money et Flooz
- FR-224 → EPIC-210 — Rapprochement des règlements
- FR-225 → EPIC-210 — Plafond d'espèces et LBC/FT
- FR-226 → EPIC-220 — Notification : SMS, WhatsApp, e-mail et cloche, servis par le relais
- FR-227 → EPIC-220 — Aucune donnée de santé dans un message
- FR-228 → EPIC-216 — Tableau de bord : un cockpit par rôle, spécifié au §6.7
- FR-229 → EPIC-216 — Vue finance et vue exploitation
- FR-230 → EPIC-217 — Ce que la compagnie fournit à l'IA commune, ce qu'elle en reçoit, et sous quel consentement
- FR-231 → EPIC-217 — L'apprentissage sur l'historique repris, le réentraînement mensuel, le rapport mensuel
- FR-232 → EPIC-217 — Rien de nominatif ni de médical ne sort
- FR-233 → EPIC-217 — Les mises à jour de l'IA sont versionnées et retirables
- FR-234 → EPIC-221 — Un serveur applicatif et un NAS chez la compagnie
- FR-235 → EPIC-221 — Les mises à jour : essai, date choisie, retour arrière, fichier signé
- FR-236 → EPIC-221 — Sauvegarde quotidienne, restauration testée, conservation
- FR-237 → EPIC-221 — L'accès des guichets au serveur central
- FR-238 → EPIC-221 — L'exploitation est faite par l'équipe informatique de la compagnie, qui ne lit pas le métier
- FR-239 → EPIC-220 — Le relais Money Vibes, parce qu'aucun port n'est ouvert chez la compagnie
- FR-240 → EPIC-221 — Mise en service
- FR-241 → EPIC-221 — Le support à distance est ouvert par la compagnie seule
- FR-242 → EPIC-221 — Réversibilité et remise d'exploitation
- FR-244 → EPIC-202 — Réseau : le site central, les guichets, les volets
- FR-245 → EPIC-203 — Connecteurs : hors février ; l'échange générique, lui, est du premier jour
- FR-246 → EPIC-221 — Support : une anomalie bloquante prise en charge en 4 heures ouvrées
- FR-250 → EPIC-213 — Performance de la recherche et des écrans de travail
- FR-251 → EPIC-221 — Disponibilité pendant les heures d'ouverture
- FR-252 → EPIC-221 — Sauvegarde quotidienne et restauration testée
- FR-253 → EPIC-201 — Chiffrement des pièces et des données sensibles
- FR-254 → EPIC-202 — Double authentification et sessions
- FR-255 → EPIC-201 — Journal, trace et lecture des consultations
- FR-256 → EPIC-214 — Conservation de dix ans au moins
- FR-257 → EPIC-221 — Données personnelles, hébergement et aucun port entrant
- FR-258 → EPIC-201 — Accessibilité depuis les postes existants
- FR-259 → EPIC-201 — Le travail se fait en ligne ; le hors connexion n'est pas requis
- FR-260 → EPIC-201 — Langue française, montants en FCFA, dates
- FR-261 → EPIC-221 — Exploitation par l'équipe informatique de la compagnie
- FR-262 → EPIC-201 — Exactitude des montants et des indicateurs
- FR-263 → EPIC-214 — Fichiers déposés contrôlés
- FR-264 → EPIC-221 — Évolution par paramètres, et recette sur le vrai serveur

## Epic List

| Épic | Titre | ★ | FR | Dépend de |
|---|---|---|---|---|
| EPIC-201 | Le socle technique : services, migrations et protection des données | ★ | 12 | aucun (premier chantier ; précède tout code neuf dans `document-service` et `prospera-assurance-service`) |
| EPIC-202 | Les rôles, les portées, le réseau et la séparation des tâches | ★ | 7 | EPIC-201 |
| EPIC-203 | L'échange avec le logiciel de la compagnie | ★ | 12 | EPIC-201 (le contrat se prouve avec EPIC-204) |
| EPIC-204 | Le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo | ★ | 8 | EPIC-203 (le contrat) ; spine du moteur (`assureurFictifAutorise`) |
| EPIC-205 | Le dossier : machine à états, versions et échéances | ★ | 19 | EPIC-201, EPIC-202 |
| EPIC-206 | Déclarer, ouvrir et attribuer | ★ | 15 | EPIC-205, EPIC-203 (numéros, police lue), EPIC-214 (pièces) |
| EPIC-207 | Instruire et chiffrer | ★ | 12 | EPIC-206, EPIC-215 (garanties, provision), EPIC-214 (pièces) |
| EPIC-208 | Les experts et les missions d'expertise | ★ | 18 | EPIC-207, EPIC-214 (rapports déposés), EPIC-202 |
| EPIC-209 | Décider et offrir | ★ | 13 | EPIC-207, EPIC-208 (rapports et devis), EPIC-202 (délégations) |
| EPIC-210 | Payer : de l'ordre de règlement à la remise | ★ | 20 | EPIC-209, EPIC-203 (police à relire), EPIC-214 (quittance archivée) ; amendement `paiement` du 2026-11-13 |
| EPIC-211 | Clore, sortir et rouvrir | ★ | 7 | EPIC-210, EPIC-214 (versement aux archives) |
| EPIC-212 | Le recours et la fraude | ★ | 21 | EPIC-210 (le recours naît d'un paiement), EPIC-215 (créance), EPIC-205 |
| EPIC-213 | Retrouver : la recherche unique, la fiche et les réclamations | ★ | 7 | EPIC-201 (index aveugle), EPIC-206, EPIC-203, EPIC-214 |
| EPIC-214 | Les pièces, l'OCR et les archives | ★ | 20 | EPIC-201 (migration de `document-service`, classification) |
| EPIC-215 | Les contrats lus, la provision et les états techniques | ★ | 9 | EPIC-201 (interrupteur `compta-cima`), EPIC-203 (projections) |
| EPIC-216 | Le pilotage et le contrôle interne | ★ | 10 | EPIC-205 et les épics des modules lus (EPIC-206 à EPIC-215) |
| EPIC-217 | L'IA commune : le socle et les usages du chemin de la démo | ★ | 19 | EPIC-201, EPIC-206 (déclaration), EPIC-214 (pièces), EPIC-209 (offre) |
| EPIC-218 | L'IA avancée : orientation d'expertise, devis, complétude, courriers de refus, recours et graphe de fraude | ★ | 6 | EPIC-217 et l'épic de chaque module consommateur (EPIC-208, EPIC-211, EPIC-212) |
| EPIC-219 | La reprise des archives et la vie en parallèle | ★ | 6 | EPIC-201, EPIC-203, EPIC-206, EPIC-214, EPIC-215 ; amendement Reprise du 2026-11-13 |
| EPIC-220 | Prévenir : notification, relais Money Vibes et portail des cabinets | ★ | 7 | EPIC-201, EPIC-205 (faits du circuit) ; Q-4 (service et propriétaire du relais) pour le portail |
| EPIC-221 | L'installation, l'exploitation et la mise en service | ★ | 16 | spine du moteur ; EPIC-201 ; EPIC-204 (recette de la démo) ; Q-3 (stockage de production) |

### EPIC-201 : Le socle technique : services, migrations et protection des données ★

Le socle commun du circuit : trois services sur la pile du moteur, la classification des données de santé, le chiffrement par champ et l'index aveugle, la trace et les règles d'écran communes (hors connexion non requis, français, FCFA, « bientôt » jamais simulé). Tâches techniques imposées par la spine : migration de `document-service` (Node 22 vers 24, kafkajs vers le client Confluent, BullMQ 5 vers 6) et de `prospera-assurance-service` (Node 20 vers 24, kafkajs vers Confluent, BullMQ vers 6), avant toute nouvelle fonction ; interrupteur `compta-cima` éteint sur le module `assurance` existant ; registre `classification-sante.json` avec son test de contrat côté Karapace ; bibliothèque `champs-sensibles` héritée de la microfinance ; catalogue de contrats nommés et schémas de l'annexe C ; test de lint « un module n'importe jamais un autre module ».

**FRs covered:** FR-1, FR-9, FR-13, FR-20, FR-22, FR-27, FR-253, FR-255, FR-258 → FR-260, FR-262

- **Spine :** AD-3, AD-8, AD-17, AD-18, AD-23, AD-24 (index aveugle), AD-26 ; Stack ; moteur AD-27
- **Dépôts :** `prospera-sinistres-service` (squelette, deux modules), `prospera-assurance-service` (migration, interrupteur `compta-cima`), `document-service` (migration), `prospera-plateforme` (`contrats/assurance`, `champs-sensibles`, registre `classification-sante`), `prospera-app` (coques de modules d'écran)
- **Dépend de :** aucun (premier chantier ; précède tout code neuf dans `document-service` et `prospera-assurance-service`)
- **Fini quand :** Les trois services démarrent par `docker compose up` sur la pile du moteur et leurs suites existantes restent vertes ; avec `compta-cima` éteint, les routes comptables sont refusées et les routes neuves passent le gate `assurance` ; un champ de santé ajouté à un schéma d'événement fait échouer la CI ; un téléphone chiffré se retrouve à l'égalité par index aveugle ; un module qui importe un voisin fait échouer le lint ; la liste d'abonnements du code existant ne contient aucun fait d'AD-16.

### EPIC-202 : Les rôles, les portées, le réseau et la séparation des tâches ★

Quatorze rôles, un périmètre par rôle, la séparation des tâches vérifiée sur l'historique des acteurs à chaque commande, la liste fermée des actes qui font une personne « partie au dossier », la matrice de délégation en paramètre, la double authentification des rôles sensibles. Le site central, les guichets et les volets (corporel, matériel, risques divers, pôle recours) sont des portées tenues par `sinistres` et lues par `reseau`. Le format de droits d'`auth-service` s'élargit aux codes à tiret `liaison-assureur` et `assureur-fictif`.

**FRs covered:** FR-6 → FR-8, FR-25, FR-29, FR-244, FR-254

- **Spine :** AD-7, AD-26 ; moteur AD-16 (portées) ; spine de la coque AD-3, AD-6
- **Dépôts :** `prospera-sinistres-service` (module `sinistres` : portées par volet, affectations, accès par dossier), `reseau-service` (portée par volet lue des faits de `sinistres`, transfert daté), `auth-service` (droits des codes à tiret : amendement C7), `prospera-app`
- **Dépend de :** EPIC-201
- **Fini quand :** UJ-1 et UJ-6 passent sur le vrai backend : un agent ne voit ni guichet ni volet hors de sa portée, une portée vide est vide ; un cumul interdit de FR-7 est refusé par le serveur, un test par acte de la liste de FR-29 ; un transfert d'agent entre guichets est daté et tracé ; la double authentification est exigée des rôles sensibles ; les routes par `dossierId` refusent hors portée (test de contrat).

### EPIC-203 : L'échange avec le logiciel de la compagnie ★

Le contrat d'échange générique, par API ou par fichier (Excel, JSON), dans les deux sens ; Prospera tire, rien n'est poussé. Les projections datées des contrats (assurés, polices, garanties, primes), le numéro officiel de sinistre (référence `DEC-` d'abord, numéro du LC ensuite, un seul numéro), le journal des échanges, la file d'envoi acquittée, la file des écarts, la liste « à saisir dans le logiciel de la compagnie », la fraîcheur par objet et par transport, la poursuite du circuit quand le LC est muet. Le connecteur nommé reste hors février : `TransportLC` est la couture.

**FRs covered:** FR-2, FR-3, FR-37, FR-194 → FR-201, FR-245

- **Spine :** AD-1, AD-2, AD-6, AD-13, AD-16, AD-21 ; annexe C du PRD
- **Dépôts :** `prospera-liaison-assureur-service` (module `liaison-assureur`), `prospera-assurance-service` (copie de lecture des projections), `prospera-plateforme/contrats/assurance` (schémas de l'annexe C), `prospera-app` (écrans fraîcheur, file des écarts, liste « à saisir »)
- **Dépend de :** EPIC-201 (le contrat se prouve avec EPIC-204)
- **Fini quand :** Contre le LC fictif, les deux transports passent : un fait rejoué ne crée aucun doublon, un rejet motivé entre dans la file des écarts, une coupure du LC laisse déclarer, instruire et ordonner mais refuse la libération d'un ordre sur une police à relire ; la liste « à saisir » sort quand le LC ne sait pas recevoir ; chaque écran affiche la fraîcheur ; le numéro officiel remplace la référence sans trou ni doublon.

### EPIC-204 : Le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo ★

Le LC fictif parle l'annexe C par les deux transports, attribue des numéros dans un format propre, sait tomber en panne, refuser, doubler et changer une police ; il ne s'installe que dans un espace d'essai. Le jeu de la compagnie fictive (14 gestionnaires, environ 3 500 dossiers sur tous les statuts, quatre scénarios `SIN-2026-9001` à `9004`) est produit par un générateur à graine fixe, au franc près, par le contrat. Ce chantier porte aussi la recette de la démo : l'annexe E (104 vérifications rejouées, 21 refus à provoquer), jouée au fur et à mesure que les épics du chemin les rendent possibles.

**FRs covered:** FR-4, FR-15 → FR-17, FR-202 → FR-205

- **Spine :** AD-19, AD-20, AD-21 ; moteur AD-30 ; annexe E du PRD
- **Dépôts :** `prospera-assureur-fictif` (application à part), `agent-instance` (drapeau `assureurFictifAutorise`, remise à zéro en essai), `prospera-plateforme` (générateur à graine fixe), `prospera-app`
- **Dépend de :** EPIC-203 (le contrat) ; spine du moteur (`assureurFictifAutorise`)
- **Fini quand :** L'agent refuse de démarrer le LC fictif dans un espace réel et le bilan d'un espace réel échoue s'il est présent ; les quatre scénarios se rejouent après une remise à zéro ; la démonstration crée pour de vrai, rôle après rôle (FR-16) ; à la fin de la tranche de février, les 104 vérifications de l'annexe E et les 21 refus sont rejoués sur le vrai backend, sans mock.

### EPIC-205 : Le dossier : machine à états, versions et échéances ★

Le cœur du module `sinistres` : huit phases, onze statuts, quatre sorties, les 42 transitions tenues comme une donnée versionnée avec un seul écrivain, les conditions nommées évaluées au serveur, la piste d'audit de chaque transition, aucun état non terminal sans issue. Le numéro de version du dossier (deux agents, un dossier : refus nommé, saisie conservée, écran mis à jour sans rechargement). Les échéances (légales et internes séparées, relances, dossiers muets à 8, 15 et 30 jours) par `upsertJobScheduler`, clé `(dossierId, échéance, epoque)`. La corbeille du gestionnaire, la file du responsable, les files de validation, de la comptabilité et du guichet de remise.

**FRs covered:** FR-14, FR-28, FR-30, FR-31, FR-33, FR-134 → FR-145, FR-147, FR-148

- **Spine :** AD-4, AD-12, AD-18, AD-27 ; moteur AD-16 (`epoque`)
- **Dépôts :** `prospera-sinistres-service` (module `sinistres`), `prospera-app` (module d'écran `sinistres`)
- **Dépend de :** EPIC-201, EPIC-202
- **Fini quand :** Une transition hors de la table, ou dont la condition nommée est fausse, est refusée par le serveur même si l'écran la propose ; deux agents sur un même dossier : le second est refusé avec « modifié par X à hh:mm » ; une restauration ne rejoue aucune échéance ; chaque état non terminal a une issue ; les files s'affichent pour chaque rôle sur le vrai backend.

### EPIC-206 : Déclarer, ouvrir et attribuer ★

Les quatre canaux de déclaration avec un mode de saisie commun, la référence `DEC-` sans trou et l'accusé immédiat, le contrôle du doublon (dans Prospera et dans le LC), la déclaration qui s'enregistre toujours (les contrôles donnent des réserves), l'urgence corporelle, la recevabilité à quatre questions sur les contrats lus, le contrôle de garantie, la déclaration tardive. L'ouverture « en attente de pièces » avec la liste exacte et le courrier de demande, l'accusé de réception du dossier complet, la provision d'ouverture, l'affectation par le responsable (charge pondérée, réaffectation motivée).

**FRs covered:** FR-34, FR-36, FR-38 → FR-46, FR-48 → FR-51

- **Spine :** AD-4, AD-6, AD-12, AD-24 ; AD-27 (canaux entrants)
- **Dépôts :** `prospera-sinistres-service` (module `sinistres`), `prospera-assurance-service` (garanties qui répondent), `document-service` (pièces de déclaration), `prospera-app`
- **Dépend de :** EPIC-205, EPIC-203 (numéros, police lue), EPIC-214 (pièces)
- **Fini quand :** Le parcours déclarer, ouvrir, attribuer se joue de bout en bout sur le vrai backend et le LC fictif : une déclaration en double est signalée, une déclaration tardive donne une réserve et jamais une déchéance, l'accueil oriente sans affecter, une provision d'ouverture est posée ; le courrier de demande de pièces est archivé en copie.

### EPIC-207 : Instruire et chiffrer ★

L'instruction (prise en charge, formulaire par type de sinistre, responsabilité qui ouvre le recours, pièces complémentaires, sinistres majeurs avec avis au réassureur, comité de suivi et rapports périodiques) et le chiffrage : décompte dans l'ordre fixe (dommage, vétusté, règle proportionnelle, plafond, franchise), corporel poste par poste selon le Code CIMA, registre des décès et des ayants droit, matériel automobile avec vétusté sur pièces et épave, autres types et arrondi ; une évaluation arrêtée n'est jamais recalculée et ne se confond pas avec les quatre autres montants. Tâche du plan : la saisie des tables du barème corporel (action A-12, images du PDF officiel : saisie, relecture par un second agent, validation actuaire ou juriste) ; repli : saisie manuelle motivée.

**FRs covered:** FR-52, FR-54, FR-55, FR-57, FR-57a, FR-69, FR-70, FR-70a, FR-71 → FR-73, FR-75

- **Spine :** AD-4, AD-11, AD-12, AD-18 ; Deferred (barème corporel)
- **Dépôts :** `prospera-sinistres-service` (module `sinistres`), `prospera-assurance-service` (table type de sinistre vers garanties), `prospera-plateforme` (tables légales datées), `prospera-app`
- **Dépend de :** EPIC-206, EPIC-215 (garanties, provision), EPIC-214 (pièces)
- **Fini quand :** Les montants de référence de la démo et de l'annexe E (matériel, corporel, vétusté) sont retrouvés au franc près ; l'IA ne propose jamais de montant sur un préjudice corporel ; une évaluation arrêtée résiste à un changement de table (jugée à la date de survenance) ; les tables du barème corporel sont saisies, relues deux fois et validées, ou le mode dégradé est actif et affiché ; un sinistre majeur déclenche l'avis au réassureur et son comité de suivi.

### EPIC-208 : Les experts et les missions d'expertise ★

Le référentiel des experts et cabinets (un agrément échu rend l'expert non désignable), le panel interne et le médecin-conseil, la mission et sa machine d'états propre, la désignation interne ou externe, l'expertise médicale (convocation, examen, rapport, suivi médical du dossier corporel), l'écart rapport-dossier (15 % d'attention, 35 % bloquant), la contre-expertise qui ne revient ni au cabinet initial ni au panel, le complément non revenu qui bloque la validation, les délais de rapport par domaine, les honoraires (note, visa, jamais au-delà du facturé), la charge et la capacité des experts, le budget indicatif, les intervenants tiers des risques divers. Un cabinet sans compte : le gestionnaire saisit. Le portail du cabinet externe est dans EPIC-220.

**FRs covered:** FR-59, FR-61 → FR-63, FR-63a, FR-65 → FR-68, FR-177 → FR-179, FR-181 → FR-185, FR-185a

- **Spine :** AD-2, AD-8, AD-12, AD-15 (côté instance), AD-26
- **Dépôts :** `prospera-sinistres-service` (module `expertises`), `document-service` (rapports, notes, pièces de mission), `prospera-assurance-service` (provision), `prospera-app`
- **Dépend de :** EPIC-207, EPIC-214 (rapports déposés), EPIC-202
- **Fini quand :** Une mission suit sa machine du début au rapport validé sur le vrai backend ; un expert à agrément échu ne se désigne pas ; un rapport dépose son fichier dans `ged` et `expertises` ne garde que `pieceId` et `versionPiece` ; un écart de 35 % bloque la validation ; des honoraires supérieurs au facturé sont refusés ; la voie `TRANSMISE` (cabinet sans compte) se déroule sans portail.

### EPIC-209 : Décider et offrir ★

L'envoi en validation avec une fiche de décision préparée, la matrice de délégation à plusieurs niveaux, le comité sinistres (quorum, votes, procès-verbal), les tolérances affichées au signataire et le renvoi motivé, la séparation « celui qui décide ne paie pas », l'offre définitive ou provisionnelle, son envoi sous 48 heures ouvrées, les délais légaux du corporel et la pénalité de 5 % par mois, l'accord enregistré (aucun ordre sans accord), la contre-proposition qui rouvre l'instruction, le refus de l'offre qui mène au litige, les relances d'une offre sans réponse. Toute décision est défendable : chaque proposition garde son motif et sa source.

**FRs covered:** FR-26, FR-77 → FR-82, FR-84 → FR-89

- **Spine :** AD-4, AD-7, AD-12 ; AD-5 (ordre libéré)
- **Dépôts :** `prospera-sinistres-service` (module `sinistres`), `notification-service` (offre envoyée), `prospera-app`
- **Dépend de :** EPIC-207, EPIC-208 (rapports et devis), EPIC-202 (délégations)
- **Fini quand :** Le dossier va de l'évaluation à l'accord enregistré sur le vrai backend ; le signataire qui a instruit ne valide pas (refus du serveur) ; un comité sans quorum ne décide pas ; aucun ordre n'est possible sans accord ; la pénalité de 5 % par mois est calculée sur les délais légaux, séparés des délais internes.

### EPIC-210 : Payer : de l'ordre de règlement à la remise ★

`sinistres` ordonne, `paiement` exécute ou enregistre. L'ordre de règlement (`ordreId` stable, empreinte, immuable une fois libéré, suspension), plusieurs règlements par dossier, les états du règlement, de la quittance et du dossier (dérivés des faits de `paiement`), la quittance signée avant tout paiement électronique, le chèque (enregistré par la comptabilité, remis au guichet, relancé puis exposé), le virement et PI-SPI, les espèces plafonnées, le rejet de l'ordre par la comptabilité, les contrôles LBC/FT, le paiement sous 72 heures, le rapprochement (alerte à 60 jours), l'état et l'export pour la comptabilité. Le Mobile Money sortant (T-Money, Flooz) est « bientôt » et à chiffrer au plan, sans rien simuler. Une restauration ne recrée aucun ordre et n'émet rien avant rapprochement.

**FRs covered:** FR-90 → FR-103, FR-220 → FR-225

- **Spine :** AD-2, AD-5, AD-7, AD-20, AD-22 ; moteur AD-27
- **Dépôts :** `prospera-sinistres-service` (module `sinistres` : ordre, quittance, remise), `prospera-paiement-service` (registre des règlements sortants, chèque enregistré, virement, PI-SPI, rapprochement), `prospera-app`
- **Dépend de :** EPIC-209, EPIC-203 (police à relire), EPIC-214 (quittance archivée) ; amendement `paiement` du 2026-11-13
- **Fini quand :** Un règlement par chèque, un par virement et un par PI-SPI vont de l'accord au statut `REGLE` sur le vrai `paiement` ; rejouer un ordre ne paie pas deux fois ; un règlement d'issue inconnue est rapproché du relevé avant toute réémission ; le même ordre avec une autre empreinte est refusé ; un ordre suspendu n'est pas exécuté ; celui qui a décidé ou instruit ne peut ni émettre ni remettre.

### EPIC-211 : Clore, sortir et rouvrir ★

La clôture (solde à zéro, motif écrit, versement au fonds d'archives), ses effets, la réouverture d'un dossier clos (un volume complémentaire rattaché au scellé d'origine), et les sorties du circuit : refus de prise en charge motivé et opposable, classement sans suite d'un assuré injoignable, litige quand l'offre est refusée ou contestée, réouverture des sorties. La clôture vient d'abord (chemin de la démo) ; les sorties suivent dans l'ordre de construction, avant la mise en service.

**FRs covered:** FR-104, FR-105, FR-107, FR-121, FR-123, FR-124, FR-126

- **Spine :** AD-4, AD-9 (volume complémentaire), AD-22
- **Dépôts :** `prospera-sinistres-service` (module `sinistres`), `document-service` (versement, volume complémentaire), `prospera-app`
- **Dépend de :** EPIC-210, EPIC-214 (versement aux archives)
- **Fini quand :** Un dossier ne se clôt qu'à solde zéro et avec un motif ; la clôture verse le dossier à `ged` ; la réouverture ouvre `ARC-…/C1` sans invalider le scellé d'origine ; un refus de garantie, un classement sans suite et un litige ont chacun leur motif et se rouvrent.

### EPIC-212 : Le recours et la fraude ★
Le recours en suivi parallèle (il n'est pas un statut du dossier) : lettre de mise en cause dès l'ouverture, relance tous les 15 jours, réclamation après paiement de l'assuré (subrogation), machine du recours, créance à trois montants, mise en demeure, négociation, contentieux, encaissements rapprochés avant imputation, prescription, arbitrage entre assureurs en paramètre ; il continue seul quand le dossier est clos. La fraude : signaux et poids, score plafonné à 100 sur quatre niveaux, revue humaine obligatoire et motivée, dossier BLOQUE qui suspend l'ordre et le paiement sans le dire à l'assuré, priorisation, confirmation par la direction ou le contrôle interne.

**FRs covered:** FR-32, FR-106, FR-108 → FR-119, FR-125, FR-127 → FR-131, FR-133

- **Spine :** AD-4, AD-5, AD-8, AD-22
- **Dépôts :** `prospera-sinistres-service` (module `sinistres` : recours en agrégat séparé, signaux et revues de fraude), `prospera-assurance-service` (créance, encaissements), `prospera-app`
- **Dépend de :** EPIC-210 (le recours naît d'un paiement), EPIC-215 (créance), EPIC-205
- **Fini quand :** Un dossier clos garde son recours vivant ; un score de fraude ne bloque jamais seul, il ouvre une revue humaine ; un dossier BLOQUE non écarté suspend l'ordre côté `paiement` ; aucun message à l'assuré ne contient « fraude » ; un encaissement de recours ne s'impute qu'après rapprochement.

### EPIC-213 : Retrouver : la recherche unique, la fiche et les réclamations ★

Une seule recherche pour tout retrouver (dossiers, déclarations, numéros, immatriculations, noms, téléphones, numéros d'archivage), tolérante aux fautes sur les champs non chiffrés et respectueuse des droits, la fiche « répondre pendant l'appel » (téléphone masqué, données de santé protégées), les réclamations des assurés, la consultation tracée.

**FRs covered:** FR-150 → FR-153, FR-156, FR-158, FR-250

- **Spine :** AD-8, AD-24, AD-26
- **Dépôts :** `prospera-sinistres-service` (index `sinistres_recherche`), `document-service` (index du texte OCR filtré par la capacité santé), `prospera-app`
- **Dépend de :** EPIC-201 (index aveugle), EPIC-206, EPIC-203, EPIC-214
- **Fini quand :** Sur 50 000 dossiers, la recherche répond en moins de 5 s au 95e centile (test de volume) ; un téléphone chiffré se retrouve à l'égalité ; un agent hors portée ne trouve rien ; une fiche de santé n'apparaît qu'avec la capacité ; chaque consultation est dans le journal.

### EPIC-214 : Les pièces, l'OCR et les archives ★

Réception d'une pièce par guichet, téléversement ou opérateur de numérisation ; versions jamais écrasées ; lots de numérisation ; OCR réel, y compris sur les scans ; contrôle humain avant tout archivage ; file des pièces non rattachées ; numéro d'archivage ; versement du dossier clos ; scellement par empreinte ; archive physique (cote, boîte, chemise de couleur, sortie et restitution) ; papier toujours tenu ; reconstitution d'un dossier perdu ; conservation d'au moins dix ans ; destruction visée, jamais un défaut ; fichiers contrôlés (type, taille, antivirus). Tâches techniques : port de stockage objet à l'API S3 avec test de contrat (MinIO pendant le développement, remplacement avant la mise en service, décision Q-3 du PO), mesure de l'OCR (lot de 50 pages sous 10 minutes) et montée éventuelle de tesseract.js et pdfjs-dist.

**FRs covered:** FR-21, FR-159 → FR-163, FR-165 → FR-176, FR-256, FR-263

- **Spine :** AD-8, AD-9, AD-20, AD-23, AD-26 ; Stack ; Deferred (stockage de production, OCR)
- **Dépôts :** `document-service` (module `ged`, adaptateur S3 unique, `OcrProvider`), `prospera-app` (module d'écran `ged`)
- **Dépend de :** EPIC-201 (migration de `document-service`, classification)
- **Fini quand :** Un scan sans texte est lu par l'OCR ; une pièce remplacée devient une nouvelle version et l'ancienne reste lisible ; un scellé échoue à la vérification après toute modification ; aucun bouton ni route « supprimer » ; le test de contrat S3 passe sur MinIO et sur le produit de remplacement ; aucun appel propre à MinIO hors de l'adaptateur.

### EPIC-215 : Les contrats lus, la provision et les états techniques ★

La copie de lecture des polices, jamais modifiées et toujours datées ; la table type de sinistre vers garanties ; la provision dossier par dossier, revue à chaque événement avec un motif (`assurance` seul écrivain des mouvements) ; l'état des provisions (PSAP) par exercice de survenance, brut, cédé, net ; la réassurance par traité et par millésime ; la coassurance par clé de répartition ; les données des états pour la CRCA ; l'export pour la comptabilité. La provision, la lecture des contrats et la garantie viennent d'abord (chemin de la démo) ; le PSAP, la réassurance, la coassurance et les états suivent dans l'ordre de construction, avant la mise en service.

**FRs covered:** FR-76, FR-186 → FR-193

- **Spine :** AD-1, AD-3, AD-11, AD-12
- **Dépôts :** `prospera-assurance-service` (module `assurance` existant), `prospera-app` (module d'écran `assurance`)
- **Dépend de :** EPIC-201 (interrupteur `compta-cima`), EPIC-203 (projections)
- **Fini quand :** Les mouvements de provision d'un dossier de la démo se retrouvent dans l'état PSAP brut, cédé et net, au franc près ; une police périmée est « à relire », jamais un refus de garantie ; avec `assurance` absent, l'emplacement rend `NON_INSTALLE` et la garantie est motivée par l'humain ; l'export comptable sort sans toucher à la comptabilité CIMA, éteinte.

### EPIC-216 : Le pilotage et le contrôle interne ★

Un cockpit par rôle : dossiers par statut, bloqués et pourquoi, sans action depuis 30 jours, charge, pièces attendues, règlements en attente, délais qui expirent ; les files du pôle recours et du contrôle interne ; le plan de contrôle exécuté sur les données ; un dossier prêt pour la CRCA sans reconstitution ; indicateurs de délai et de qualité recalculés depuis les données, jamais constants ; vue finance et exploitation pour le DAF et le DSI ; les seuils d'alerte se calibrent sur les données reprises. Aucune prime ni ratio sinistres sur primes.

**FRs covered:** FR-5, FR-149, FR-206, FR-207, FR-210 → FR-213, FR-228, FR-229

- **Spine :** AD-17, AD-27
- **Dépôts :** `dashboard-service` (affichage), `prospera-sinistres-service` (routes de lecture, plan de contrôle), `prospera-app`
- **Dépend de :** EPIC-205 et les épics des modules lus (EPIC-206 à EPIC-215)
- **Fini quand :** Chaque indicateur se recalcule depuis les faits (un test modifie une donnée et le chiffre bouge) ; le cockpit de chaque rôle ne montre que sa portée ; sans `dashboard`, l'emplacement est vide et les files de `sinistres` restent ; un dossier se prépare pour la CRCA en un geste.

### EPIC-217 : L'IA commune : le socle et les usages du chemin de la démo ★

Le socle : `PropositionPort` (décision humaine chez le consommateur, jamais bloquante), garde-fous, registre de l'IA, instance locale chez la compagnie, apprentissage sur l'historique repris, réentraînement et rapport mensuels, mises à jour versionnées et retirables, rien de nominatif ni de médical qui sorte. Les usages du premier jour : déclaration assistée par WhatsApp ou e-mail, lecture et classement des pièces, contrôle des pièces (cohérence, photo réutilisée), pièces manquantes et relances, pré-remplissage de l'instruction, « pourquoi ce montant ? », offre rédigée par l'IA et relue par l'agent, résumé sourcé, recherche en langage naturel, réponse aux réclamations, brief du matin, qualité du dossier et simulation « et si… ». Tant qu'aucun modèle n'existe, des règles explicables servent chaque capacité et l'annoncent. Pas de voix.

**FRs covered:** FR-10 → FR-12, FR-35, FR-47, FR-53, FR-56, FR-74, FR-83, FR-154, FR-155, FR-157, FR-164, FR-208, FR-209, FR-230 → FR-233

- **Spine :** AD-8, AD-10, AD-23 ; spine microfinance AD-14 (`PropositionPort`)
- **Dépôts :** instance locale de l'IA commune (service porteur à cadrer, Deferred), `prospera-sinistres-service`, `document-service`, `prospera-app`
- **Dépend de :** EPIC-201, EPIC-206 (déclaration), EPIC-214 (pièces), EPIC-209 (offre) ; EPIC-245 → 248 (socle de l'IA commune : service, contrat de proposition, garde-fous, catalogue des capacités et packs ; amendement du 2026-11-14)
- **Fini quand :** Chaque usage rend une Proposition avec sa provenance et la décision humaine (acceptée, modifiée, rejetée, motif) s'écrit chez le consommateur ; coupée, l'IA ne bloque aucun geste ; un test vérifie qu'aucune donnée nominative ni de santé ne sort de l'instance ; le rapport mensuel compte les décisions par usage.

### EPIC-218 : L'IA avancée : orientation d'expertise, devis, complétude, courriers de refus, recours et graphe de fraude ★
Les usages d'ordre 3 de la construction : orientation d'expertise assistée (propose, ne crée rien), analyse des devis, contrôle de complétude d'un rapport d'expertise, IA du recours, courrier de refus rédigé et relu, graphe des liens de la fraude. Ils sont du premier jour (décision du PO : l'IA dès le premier jour, sauf la voix) et suivent l'IA du chemin de la démo (EPIC-217) dans l'ordre de construction.

**FRs covered:** FR-58, FR-60, FR-64, FR-120, FR-122, FR-132

- **Spine :** AD-8, AD-10
- **Dépôts :** instance locale de l'IA commune, `prospera-sinistres-service`, `prospera-app`
- **Dépend de :** EPIC-217 et l'épic de chaque module consommateur (EPIC-208, EPIC-211, EPIC-212) ; EPIC-245 → 248 (socle de l'IA commune : service, contrat de proposition, garde-fous, catalogue des capacités et packs ; amendement du 2026-11-14)
- **Fini quand :** Chaque usage fonctionne en règles explicables puis par modèle sans changer le port ; l'orientation d'expertise ne crée aucune mission ; le graphe de fraude n'ouvre qu'une revue humaine.

### EPIC-219 : La reprise des archives et la vie en parallèle ★

La reprise lit un fichier Excel ou JSON dès le premier jour (l'adaptateur API s'écrit quand le LC est connu, en janvier, avant la mise en service) et traduit sans trahir : assurés, polices et provisions ouvertes, dossiers, pièces avec leur numéro d'archivage et leur cote physique, experts, règlements historiques repris en lecture seule. Les dossiers en cours d'abord ; le rapport de reprise validé avant que rien n'entre ; la resynchronisation nocturne et le dossier qui change des deux côtés ; le feu vert module par module ; ce que la compagnie doit fournir et le premier risque. Les rapports masquent les champs de santé.

**FRs covered:** FR-214 → FR-219

- **Spine :** AD-14, AD-13, AD-23 ; spine de la Reprise AD-3, AD-5, AD-13
- **Dépôts :** `reprise-service`, points d'import de `prospera-sinistres-service`, `prospera-assurance-service`, `document-service` et `expertises`, `prospera-liaison-assureur-service` (resynchronisation nocturne), `prospera-app`
- **Dépend de :** EPIC-201, EPIC-203, EPIC-206, EPIC-214, EPIC-215 ; amendement Reprise du 2026-11-13
- **Fini quand :** Un fichier de la compagnie fictive est repris dans l'ordre des dépendances, avec rapport validé et feu vert par module ; un montant requis absent n'est jamais remplacé par zéro ; un numéro d'archivage d'origine garde son format et un doublon est refusé avec son motif ; le dossier modifié des deux côtés apparaît dans la file des écarts.

### EPIC-220 : Prévenir : notification, relais Money Vibes et portail des cabinets ★

Les messages passent par `notification` (SMS, WhatsApp, e-mail, cloche, courrier avec preuve) : modèles WhatsApp approuvés avant la mise en service, relances de pièces espacées de 5 jours, aucune donnée de santé dans un message, aucun montant d'indemnité ni mot « fraude » à l'assuré, consentements par finalité, réponses entrantes qui deviennent un brouillon de déclaration. Le relais Money Vibes reçoit les réponses et les notifications sans port entrant chez la compagnie ; il héberge le portail du cabinet d'expertise externe (pièces de mission chiffrées de bout en bout, durée limitée, sans copie). Le portail dépend de Q-4 et n'est pas ★ ; sans lui, la voie `TRANSMISE` (courriel sécurisé ou papier) sert.

**FRs covered:** FR-18, FR-19, FR-146, FR-180, FR-226, FR-227, FR-239

- **Spine :** AD-15, AD-27 ; moteur AD-9 (amendé)
- **Dépôts :** `notification-service`, relais Money Vibes (service à cadrer, Q-4), `agent-instance` (destinations sortantes), `prospera-sinistres-service` (module `expertises`), `prospera-app`
- **Dépend de :** EPIC-201, EPIC-205 (faits du circuit) ; Q-4 (service et propriétaire du relais) pour le portail
- **Fini quand :** Un message de la démo part, est accusé et se retrouve dans la cloche en repli ; une réponse WhatsApp entrante crée un brouillon de déclaration par commande ; aucun texte ne porte de donnée de santé (test) ; un cabinet externe reçoit une mission, dépose son rapport et n'atteint que le relais ; une connexion vers un nom non déclaré est refusée.

### EPIC-221 : L'installation, l'exploitation et la mise en service ★
Un serveur applicatif et un NAS chez la compagnie ; mises à jour essayées, promues à la date choisie, retour arrière, fichier signé ; sauvegarde quotidienne et incrément horaire (perte maximale 1 h, reprise 4 h, stockage objet au même instant que Mongo), restauration testée, clé de secours ; accès des guichets par le réseau de la compagnie ; exploitation par la DSI qui ne lit pas le métier ; support à distance ouvert par la compagnie seule ; support : anomalie bloquante prise en charge en 4 heures ouvrées ; disponibilité aux heures d'ouverture ; données personnelles et aucun port entrant ; mise en service, formation par profil, documentation, accompagnement ; réversibilité (export complet en format ouvert, accès administrateur remis). Non-code : hypothèse de dimensionnement à remplacer par les volumes réels, revue juridique obligatoire quatre semaines avant la mise en service. Le relais et le portail sont dans EPIC-220. Recette sur le vrai serveur de la compagnie.

**FRs covered:** FR-23, FR-24, FR-234 → FR-238, FR-240 → FR-242, FR-246, FR-251, FR-252, FR-257, FR-261, FR-264

- **Spine :** AD-20, AD-25 ; moteur AD-4, AD-9, AD-10, AD-16, AD-30, AD-40
- **Dépôts :** `agent-instance`, `centrale-service`, relais Money Vibes, `prospera-sinistres-service`, `prospera-assurance-service`, `document-service`, `prospera-liaison-assureur-service`
- **Dépend de :** spine du moteur ; EPIC-201 ; EPIC-204 (recette de la démo) ; Q-3 (stockage de production)
- **Fini quand :** Une restauration complète est jouée : les compteurs `DEC-`, chèque, quittance et `ARC-` reprennent au maximum, aucune émission avant rapprochement ; une sortie vers un nom non déclaré est refusée ; à J+30 sans contact, le gel bloque les mises à jour mais pas le travail ; un support à distance ne s'ouvre que par la compagnie ; un export complet se relit hors Prospera ; la revue juridique est datée et ses issues tracées.

## Ce qui n'est pas dans ces épics

- **Les fiches de stories** : écrites par celui qui code, juste avant de coder.
- **Le connecteur nommé vers le logiciel de la compagnie** et le module `connecteurs` : hors février (FR-245) ; il partira d'un épic de Connecteurs quand le logiciel sera connu (en janvier). L'adaptateur d'API de la reprise s'écrit au même moment, avant la mise en service.
- **Le Mobile Money sortant de `paiement`** (T-Money, Flooz) : à chiffrer au plan (action A-11) ; « bientôt », sans simulation.
- **L'IA vocale, le chatbot de l'assuré, l'anglais, la signature électronique** : « bientôt », sans date (PRD §10.2).
- **Le produit de stockage objet de production** (remplaçant de MinIO) : décision de plateforme (Q-3), à porter dans la spine du moteur ; EPIC-214 ne livre que le port S3 et son test de contrat.
- **Le service porteur de l'instance locale de l'IA commune** et les modèles : à cadrer (spine, Deferred) ; EPIC-217 et EPIC-218 en dépendent.
- **Les amendements à porter chez les voisins** (spine AD-21 : PRD assurance annexe A.1, `paiement`, `reseau`, `reprise`, format de droits d'`auth-service`) : une série de PR à part ; les épics les supposent faits.
- **Les actions de la compagnie et du PO** qui ne sont pas du code (manuel de procédures, délégations, liste des experts, barèmes, modèles de courriers, volumes, revue juridique : PRD §12.2) ; seule la revue juridique figure dans EPIC-221 comme condition de mise en service.
