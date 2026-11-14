---
stepsCompleted: [1, 2]
inputDocuments:
  - prospera-stories/prds/prd-microfinance-2026-11-13/prd.md (final, #426 : FR-1 → FR-16, FR-30 → FR-274, NFR-1 → NFR-10, UJ-1 → UJ-9, annexes A à D) et addendum.md
  - prospera-stories/architecture/architecture-microfinance-imf-2026-11-13/ARCHITECTURE-SPINE.md (finale, 30 AD, #428)
  - amendements du 2026-11-13 (#427) : spine du moteur AD-9, PRD paiement, PRD reseau, PRD moteur (supervision sur place)
  - prospera-stories/epics-reprise-connecteurs-2026-11-12.md et epics-moteur-installation-2026-11-11.md (modèle : épics seulement)
  - prospera-stories/sprint-status.yaml (epic_id_high_water_mark EPIC-179, plage Dev B EPIC-142 → 299)
---

# Microfinance (IMF) — Découpage en épics

## Vue d'ensemble

Découpage du **PRD Microfinance** et de sa **spine** en **épics**, comme pour le stock, le moteur et Reprise/Connecteurs : les fiches de stories ne sont **pas** écrites ici, mais par celui qui code la story, juste avant de la coder. Chaque épic porte son **backend** et ses **écrans**, et sa fin se prouve de bout en bout sur le vrai backend, sans mock. **Tous les écrans sont faits par Dev B** (règle du programme) ; le backend est proposé à Dev A, sauf décision contraire du PO.

**Identifiants.** **EPIC-180 → EPIC-200**, pris dans la plage de Dev B (`EPIC-142 → 299`) et inscrits au registre le jour du découpage (relevé du 2026-11-13 sur toutes les branches distantes : marque haute EPIC-179 ; EPIC-180 n'apparaît que comme borne de la plage libre). **Aucun `story_id` n'est réservé** : chaque fiche prend le suivant de la plage de celui qui la code (`STORY-900 → 1199` pour Dev B, `STORY-730 → 899` pour Dev A). Les écrans prennent leur identifiant dans la série de la coque (`PRA-`).

**La démo de février (★).** Les épics ★ font la démo de février, dans l'ordre de construction de la spine (AD-24) : calcul financier et contrats (180, 183) ; produits et clients (180, 181) ; cœur fictif (184) ; crédit de bout en bout (185 → 188) avec la Créance (189) ; terrain et collecte (191) ; risque (193) ; recouvrement (194) ; IA commune v0 (190) ; tableau de bord (198). Les autres suivent, sans date figée (décision Q4 du PO : le périmètre ne change pas).

**Chemin critique.** 180 → 181 → 185 → 186 → 187 ; 183 et 184 en parallèle dès le début ; 189 avant la fin de 187 ; 190 avant la fin de 186 pour montrer l'IA (sinon emplacement `NON_INSTALLE`).

## Requirements Inventory

### Functional Requirements

- **FR-1** : Les règles transverses du PRD distributeur valent ici
- **FR-2** : Ce que Prospera tient, ce que le cœur tient
- **FR-3** : Les seuils de la démo sont des valeurs par défaut
- **FR-4** : Les seuils d'alerte se calibrent sur les données de l'IMF
- **FR-5** : Seize rôles, cinq échelons, un périmètre par rôle
- **FR-6** : Séparation des tâches et délégation tracée
- **FR-7** : Le secteur d'activité est une donnée de premier rang
- **FR-8** : L'IA est spécifiée ici, servie par l'IA commune
- **FR-9** : Qui a fait quoi, et quand
- **FR-10** : Aucun prêt au-dessus du plafond d'usure
- **FR-11** : L'IMF de démonstration
- **FR-12** : Dans la démo, on crée pour de vrai
- **FR-13** : Un jeu cohérent au centime
- **FR-14** : Les messages passent par `notification`
- **FR-15** : Données personnelles et consentements
- **FR-16** : Les modules de l'IMF s'installent un par un
- **FR-30** : Une demande n'existe que sur un client dont la fiche est utilisable
- **FR-31** : Le crédit se branche sur les prospects venus du terrain et du commercial
- **FR-32** : Créer la demande avec un produit du catalogue
- **FR-33** : Montant et durée restent dans les limites du produit
- **FR-34** : L'éligibilité du client est contrôlée avant la création
- **FR-35** : La simulation affiche l'échéancier prévu et le TEG
- **FR-36** : Le TEG est actuariel annuel proportionnel et le plafond d'usure bloque l'octroi
- **FR-37** : La demande se saisit en brouillon hors ligne
- **FR-38** : Le client peut renoncer : statut ANNULE
- **FR-39** : Le CC fixe le rendez-vous et liste les pièces manquantes
- **FR-40** : L'agent téléverse les pièces et le CC les accepte ou les rejette
- **FR-41** : Les cautions sont enregistrées, au moins 2 au-dessus d'un seuil
- **FR-42** : Les garanties exigées suivent un barème paramétrable
- **FR-43** : Le dossier passe seul à DOSSIER_COMPLET et le score est recalculé
- **FR-44** : La consultation du BIC est saisie à la main, avec sa pièce
- **FR-45** : Le CC planifie les visites au domicile et sur le lieu d'activité
- **FR-46** : Une visite d'instruction exige une photo et un GPS dans le rayon
- **FR-47** : Le rapport d'analyse porte la grille des 5C et les indicateurs calculés
- **FR-48** : Les alertes d'instruction sont affichées avec leur règle
- **FR-49** : Le score du dossier et la décision suggérée sont proposés par l'IA, avec provenance
- **FR-50** : La checklist d'instruction doit être complète à 100 % avant l'avis
- **FR-51** : Le CC rend un avis favorable ou défavorable, motivé
- **FR-52** : L'analyste risque donne un avis consultatif au-dessus d'un seuil
- **FR-53** : Le ROC lit un rapport complet avec une proposition
- **FR-54** : Le ROC approuve en fixant montant, taux, durée et gestionnaire, sans échéancier
- **FR-55** : Le ROC refuse ou demande des garanties
- **FR-56** : Le comité délibère avec un quorum paramétrable
- **FR-57** : Le niveau d'approbation dépend du montant
- **FR-58** : Les prêts aux parties liées passent par le conseil
- **FR-59** : La décision favorable fige les conditions finales
- **FR-60** : Un refus du comité est final pour la séance, avec motif
- **FR-61** : Le comité génère l'échéancier contractuel, par annuité constante par défaut
- **FR-62** : Le contrat imprimé porte le TEG et le tableau d'amortissement
- **FR-63** : Le dossier accordé est envoyé au cœur ; il y devient le prêt officiel après décaissement
- **FR-64** : Le crédit émet un ordre de décaissement avec son canal
- **FR-65** : Les frais et l'assurance sont prélevés au décaissement
- **FR-66** : Aucun décaissement tant que les gardes ne sont pas toutes vertes
- **FR-67** : Tout décaissement est autorisé par le comptable ou le DAF, jamais par celui qui l'a préparé ou décidé
- **FR-68** : Espèces et virement sont exécutés par le cœur sur l'ordre de Prospera
- **FR-69** : Mobile Money et PI-SPI passent par `paiement`, puis sont déclarés au cœur
- **FR-70** : Le comité fait passer le dossier à EN_GESTION ; le cœur confirme le décaissement
- **FR-71** : Le GP suit le prêt EN_GESTION et saisit les remboursements sans doublon
- **FR-72** : Un groupe solidaire a un dossier de groupe et un sous-dossier par membre
- **FR-73** : Le groupe a une seule décision et un échéancier par membre
- **FR-74** : Le défaut d'un membre est une affaire du groupe
- **FR-75** : La clôture est confirmée par le cœur et libère les garanties
- **FR-76** : Un nouveau cycle est proposé selon une règle
- **FR-77** : Le crédit lit les retours du recouvrement sans les ranger dans ses statuts
- **FR-78** : Le dossier suit douze statuts, plus ANNULE
- **FR-79** : Chaque transition a un acteur autorisé et des gardes évaluées au serveur
- **FR-80** : Chaque changement est horodaté : qui a fait quoi, et quand
- **FR-81** : Les retours en arrière sont limités et tracés
- **FR-82** : La séparation des tâches est contrôlée
- **FR-83** : Les délais de traitement sont mesurés sur les horodatages
- **FR-84** : Une dérogation est motivée, limitée et tracée
- **FR-85** : En cas d'absence, un rôle peut être délégué, explicitement
- **FR-86** : Tout seuil du crédit est un paramètre de l'IMF
- **FR-87** : Chaque événement du processus prévient les bonnes personnes
- **FR-88** : Un message au client respecte son consentement et son canal
- **FR-89** : Les écrans conservés de la démo deviennent réels
- **FR-90** : Les écrans qui manquent sont créés
- **FR-91** : Les boutons décoratifs deviennent branchés ou « bientôt »
- **FR-92** : Chacun ne voit que son périmètre
- **FR-93** : Le parcours UJ-1 est le test d'acceptation du crédit
- **FR-94** : Le parcours UJ-2 mène un prêt de groupe jusqu'à EN_GESTION
- **FR-95** : Le dossier porte une analyse narrative, des étoiles et un sentiment
- **FR-96** : L'analyse étendue couvre six volets, du micro au macro
- **FR-97** : Le crédit analyse le secteur d'activité et sa saturation dans le portefeuille
- **FR-98** : L'IA lève des alertes de fraude, de conformité et de comportement de crédit
- **FR-99** : À la simulation, l'IA recommande un produit et des conditions optimales
- **FR-100** : Un produit financier est une fiche versionnée, gérée à deux personnes
- **FR-101** : Un produit de crédit porte ses bornes, son taux et sa périodicité
- **FR-102** : La méthode d'amortissement est un choix du produit
- **FR-103** : Frais, assurance et garanties de frais sont typés, avec le drapeau « inclus dans le TEG »
- **FR-104** : L'éligibilité d'un client à un produit se juge sur l'ancienneté ; le score alerte
- **FR-105** : Le produit dit quelles cautions et quelles garanties il exige
- **FR-106** : Un produit d'épargne dit ses règles ; le cœur tient les comptes
- **FR-107** : Chaque modification publiée crée une version ; le dossier garde ses conditions
- **FR-108** : Une version qui dépasse le plafond d'usure, au pire cas, ne se publie pas
- **FR-109** : La simulation montre l'échéancier, les frais et le TEG, sans rien enregistrer
- **FR-110** : Le code produit est commun avec le cœur ; les conditions figées lui sont renvoyées
- **FR-111** : Le jeu de démonstration ne contient que des produits conformes, au pire cas
- **FR-112** : Le module recommande un produit selon le profil du client
- **FR-113** : La simulation propose les conditions optimales
- **FR-114** : Un prospect se crée en quelques champs, sur le terrain
- **FR-115** : Passer de prospect à client exige une fiche complète
- **FR-116** : Une personne, une fiche, un identifiant du cœur
- **FR-117** : Le secteur d'activité est un champ structuré obligatoire, d'une nomenclature commune
- **FR-118** : Les photos, la position GPS et les pièces sont des preuves, avec consentement et expiration
- **FR-119** : Le KYC a trois niveaux, avec PPE et bénéficiaire effectif
- **FR-120** : Le KYC est validé par un autre que le créateur de la fiche, avant la demande
- **FR-121** : Les listes de sanctions sont rafraîchies, et tout le fichier est refiltré
- **FR-122** : Le KYC est revu périodiquement
- **FR-123** : Les seuils CENTIF alertent, l'IMF déclare hors Prospera
- **FR-124** : Le score du client et la notation de risque LBC sont explicables, avec leur provenance
- **FR-125** : La probabilité de défaut et la classe réglementaire estimée se recalculent à chaque événement
- **FR-126** : L'IA alerte sur les signaux faibles d'un client
- **FR-127** : Chaque fiche porte une analyse par secteur, micro et macro-économique
- **FR-128** : La carte montre les zones à risque et suggère où prospecter
- **FR-129** : Un groupe solidaire est un client collectif, et sa vie est tracée
- **FR-130** : L'épargne se lit du cœur : fiche, liste des comptes, vue consolidée du DG et statistiques
- **FR-131** : L'IA commune analyse l'épargne : dormants, produit, fidélité, encours, segments
- **FR-132** : Les consentements sont horodatés, par finalité, et retirables
- **FR-133** : Qui voit quelle fiche, et ce qui est journalisé
- **FR-134** : Hors ligne, la fiche, les visites et la demande en brouillon marchent ; jamais la décision
- **FR-135** : Le collecteur enregistre un remboursement ou un dépôt d'épargne et remet un reçu
- **FR-136** : La collecte marche hors ligne, sans doublon et sans changer de solde
- **FR-137** : La collecte est rattachée à une échéance et renvoyée au cœur
- **FR-138** : Le collecteur remet les espèces au guichet : un transfert de caisse, contre une remise contresignée
- **FR-139** : La collecte est rapprochée du cœur et de la remise, et se corrige par contre-passation
- **FR-140** : Un paiement Mobile Money collecté attend la validation du comptable
- **FR-141** : Le plan de collecte du jour est préchargé sur l'appareil
- **FR-142** : L'IA propose les priorités de la journée du collecteur
- **FR-143** : Le collecteur a un fonds de caisse tracé et une position visible
- **FR-144** : La clôture du jour est une étape obligatoire du collecteur
- **FR-145** : L'écart de caisse alerte, avec des seuils calibrés sur l'IMF ; les clôtures se pilotent
- **FR-146** : La caisse du guichet se lit du cœur ; ce qui reste « bientôt »
- **FR-147** : L'IA aide le comptable à valider les paiements Mobile Money et à les rapprocher
- **FR-148** : L'IA détecte les anomalies et les risques de fraude de caisse
- **FR-149** : La prévision de trésorerie à 7 jours et le rééquilibrage entre agences se lisent, ne s'exécutent pas
- **FR-150** : Le cœur fait foi pour l'argent
- **FR-151** : Prospera reçoit du cœur les objets de l'argent
- **FR-152** : Prospera renvoie au cœur ce qu'il décide
- **FR-153** : Le dossier accordé part avec l'échéancier contractuel
- **FR-154** : L'ordre de décaissement est exécuté par le cœur, ou par `paiement`
- **FR-155** : Les remboursements saisis dans Prospera sont renvoyés au cœur, si possible
- **FR-156** : Quand le cœur ne sait pas recevoir, Prospera sort la liste « à saisir dans le cœur »
- **FR-157** : L'échange passe par une API si le cœur sait, sinon par des fichiers ; Prospera tire toujours
- **FR-158** : Un relais Money Vibes reçoit les notifications entrantes
- **FR-159** : Chaque écran dit la fraîcheur, et les écarts vont dans une file
- **FR-160** : L'idempotence et le rejeu sont des capacités du contrat
- **FR-161** : Prospera reçoit des mouvements, jamais des totaux
- **FR-162** : L'échéancier contractuel est comparé à l'échéancier officiel
- **FR-163** : Un rapprochement trimestriel compare le portefeuille de Prospera et celui du cœur
- **FR-164** : Le code d'agence est celui du cœur s'il existe
- **FR-165** : Prospera continue quand le cœur est indisponible
- **FR-166** : Le cœur fictif tient ce que tient un vrai cœur
- **FR-167** : Le cœur fictif n'est jamais installé en production réelle
- **FR-168** : Le cœur fictif exécute les décaissements, avec des cas simulés
- **FR-169** : Le cœur fictif fait vivre les 1 000 prêts
- **FR-170** : Le cœur fictif offre l'API et les fichiers, et sait tomber en panne
- **FR-171** : La démo se remet à zéro et un prospect la teste lui-même
- **FR-172** : Dans la démo, un dossier créé va jusqu'à EN_GESTION
- **FR-173** : Le PAR est calculé en encours, de façon cumulative
- **FR-174** : Le PAR se ventile par agence, agent, secteur d'activité et produit
- **FR-175** : Le classement suit les classes réglementaires du pays, barème SFD par défaut
- **FR-176** : Les provisions sont proposées, jamais comptabilisées
- **FR-177** : La concentration est mesurée et alertée
- **FR-178** : Les seuils d'alerte sont calibrés sur les données de l'IMF
- **FR-179** : Une alerte est traitée dans un délai, puis remontée ; les migrations sont listées
- **FR-180** : L'IA analyse le risque par secteur d'activité et par conjoncture
- **FR-181** : L'IA prévoit le PAR, la perte attendue et analyse les provisions
- **FR-182** : Le module reprend les règles du paquet comptable SFD, sans sa tenue des crédits
- **FR-183** : Le module génère les indicateurs périodiques
- **FR-184** : Le rapport suit la périodicité de la catégorie de supervision
- **FR-185** : Le rapport mensuel de portefeuille et de provisions est produit par Prospera
- **FR-186** : Le DG valide, l'IMF signe et dépose hors de Prospera
- **FR-187** : Les ratios prudentiels sont calculés si la balance du cœur est là
- **FR-188** : Le rapport sort en PDF et en CSV
- **FR-189** : Le plafond d'usure est contrôlé sur tout le portefeuille
- **FR-190** : L'IA calcule le score de conformité, alerte tôt et rédige le commentaire du rapport BCEAO
- **FR-191** : La piste d'audit est ajoutée seulement et conservée 10 ans
- **FR-192** : La séparation des tâches est contrôlée, et l'auditeur lit sans modifier
- **FR-193** : La LBC/FT est mise à jour régulièrement et exportée
- **FR-194** : L'IA détecte les anomalies et corrèle les événements suspects de la trace
- **FR-195** : Les textes réglementaires sont des paramètres par pays, à faire vérifier
- **FR-196** : Le portefeuille de prêts en cours est importé par la Reprise
- **FR-197** : Un prêt en cours sans échéancier complet n'entre pas
- **FR-198** : La reprise prépare aussi les seuils et les identifiants
- **FR-199** : L'IA détecte les écarts et les doublons entre Prospera et le cœur
- **FR-200** : Le plan de journée de l'agent se déduit de l'échéancier et du dossier
- **FR-201** : Une visite d'instruction est une preuve : photo, GPS, 100 m, « hors zone » refusée mais jamais effacée
- **FR-202** : Les résultats d'une visite, la collecte d'épargne et le suivi de groupe
- **FR-203** : Les missions de recouvrement arrivent dans l'application et leur résultat revient
- **FR-204** : Hors ligne, ce qui marche et ce qui ne marche jamais
- **FR-205** : Rôles, périmètres, carte et ce que l'IMF n'a pas
- **FR-206** : L'IA propose l'ordre de visite optimal et alerte quand un client en retard est proche
- **FR-207** : Saisie vocale vers la fiche et rapport du soir
- **FR-208** : L'IA suggère des zones de prospection et la réaffectation des agents
- **FR-209** : Le remboursement est reçu du cœur ou saisi dans Prospera, et le cœur fait foi
- **FR-210** : Le Mobile Money déclaré est validé par le comptable, et le rapprochement se fait à moins de 1 %
- **FR-211** : Un dossier de recouvrement par prêt, ouvert à l'entrée en retard
- **FR-212** : Le calendrier de relances de l'IMF : J-3, J+1 à J+3, J+7, 3 échecs, J+90
- **FR-213** : Une promesse de paiement suspend les relances jusqu'à sa date
- **FR-214** : Les statuts de recouvrement, un second axe décidé par des rôles
- **FR-215** : Le ROC voit le réseau trié par PAR et descend jusqu'au dossier
- **FR-216** : Le ROC définit la stratégie et affecte les agents de recouvrement par zone
- **FR-217** : Chaque action de recouvrement est tracée avec son résultat
- **FR-218** : Le ROC seul bloque un dossier, avec motif ; le blocage suspend les demandes du client et de ses cautions appelées
- **FR-219** : À J+90, le passage au contentieux est proposé au ROC ; le judiciaire exige le DG
- **FR-220** : Le plan d'étalement est limité, unique par prêt, et envoyé au cœur
- **FR-221** : La perte définitive est proposée à 24 mois, décidée par le DG, envoyée au cœur
- **FR-222** : La fiche du mauvais payeur est ouverte par règle, par client, et se ferme
- **FR-223** : L'appel des cautions et la saisie de garantie sont tracés
- **FR-224** : La relance du groupe solidaire vise d'abord la membre, puis le groupe
- **FR-225** : La clôture du prêt et le nouveau cycle, côté recouvrement
- **FR-226** : L'IA règle le déclenchement, la priorité, le canal, le moment et le message des relances
- **FR-227** : Le score de recouvrement est la probabilité de récupérer, explicable, avec ses poids
- **FR-228** : L'IA propose la stratégie par agence et analyse le comportement de retard
- **FR-229** : L'IA propose des scripts de relance et des conseils par rôle
- **FR-230** : Chacun des seize rôles a son tableau de bord, composé en données
- **FR-231** : Le DG lit douze chiffres qui engagent une décision
- **FR-232** : Le DG descend du réseau jusqu'au client, par la géographie
- **FR-233** : Le même pilotage se lit par secteur d'activité
- **FR-234** : Une alerte a un destinataire, un délai et une remontée
- **FR-235** : Les déclencheurs d'alerte sont des règles, aux seuils calibrés
- **FR-236** : Décisions à trancher, synthèse du DG et rapport de direction
- **FR-237** : Le Copilot est réel dès le premier jour, en lecture seule, chiffres sourcés
- **FR-238** : Les priorités du jour et les anomalies d'agence sont proposées, avec leur provenance
- **FR-239** : Une seule source de vérité pour les chiffres
- **FR-240** : Un seul barème d'équipe : 90, 75, 60
- **FR-241** : Objectifs par agence et par agent, écart à l'objectif
- **FR-242** : Classement, fiche agent, rémunération privée, pas de paie
- **FR-243** : L'IA des équipes : prévision du PAR par zone, coaching, comparaison entre agences
- **FR-244** : Comptes, droits et journal d'accès
- **FR-245** : Les campagnes de l'IMF, créées, validées, lancées pour de vrai
- **FR-246** : Les prospects et l'acquisition appartiennent au réseau commercial
- **FR-247** : Le chatbot WhatsApp est « bientôt » ; au premier jour, des relances sortantes et une boîte de réponses
- **FR-248** : L'IA du marketing : segmentation, ciblage, notes de prospects, propositions de campagnes
- **FR-249** : Ce qui reste « bientôt » dans le marketing
- **FR-250** : Les règles de l'IMF sont des données, et le blocage d'un dossier reste humain
- **FR-251** : Le support client est inscrit, sans écran au premier jour
- **FR-252** : Au mieux, un export des écritures vers le cœur
- **FR-253** : Pas de contrôle de gestion ; le DAF garde son tableau Budget et Rentabilité
- **FR-254** : L'IA du DAF : prévision de trésorerie à 7 jours et perte attendue, sur les données du cœur
- **FR-255** : Réseau : quatre échelons, code d'agence du cœur, zones en polygones
- **FR-256** : Paiement : décaisser et encaisser par pays et par opérateur, banques par PI-SPI
- **FR-257** : Le registre de Créance : `paiement` reste seul propriétaire
- **FR-258** : Notification : WhatsApp, SMS et lien de paiement, servis par le relais
- **FR-259** : Reprise et connecteurs : les fichiers d'abord, le vrai connecteur plus tard
- **FR-260** : Ce que l'IMF fournit à l'IA commune, ce qu'elle en reçoit, et sous quel consentement
- **FR-261** : Licence à vie : jamais de coupure ni de suspension pour impayé
- **FR-262** : Les mises à jour : essai, date choisie par l'IMF, retour arrière, fichier signé
- **FR-263** : Le relais Money Vibes, parce qu'aucun port n'est ouvert chez l'IMF
- **FR-264** : L'accès des agences : navigateur, guichet en ligne, hors ligne seulement sur le téléphone
- **FR-265** : L'exploitation est faite par l'équipe informatique de l'IMF, qui ne lit pas le métier
- **FR-266** : Le dimensionnement est celui de l'IMF ; la démonstration est testée à dix fois sa taille
- **FR-267** : Sauvegardes de l'IMF et conservation de dix ans
- **FR-268** : Les listes de sanctions LBC/FT se mettent à jour sans port entrant
- **FR-269** : Le support à distance est ouvert par l'IMF seule
- **FR-270** : L'onglet « Client » du dossier montre le client tel que le CC doit le lire
- **FR-271** : Un refinancement est un nouveau dossier qui solde l'ancien prêt
- **FR-272** : Le tableau de risque du DG : entonnoir d'ancienneté, carte de chaleur et taux
- **FR-273** : Contrôle quotidien du ROC, écran réseau, demandes en attente, portefeuille du GP et Opérations bancaires
- **FR-274** : L'onglet Preuves des relances, les campagnes de relance et la correspondance des workflows de la démo

### NonFunctional Requirements

- **NFR-1** (Performance) : (défaut, annexe D : valeurs reprises du cahier de la démo, confirmées avec la taille réelle) Le tableau de bord d'un rôle s'affiche en moins de 3 s sur une connexion 4G ; une liste en moins de 500 ms au 95ᵉ centile ; le rapport BCEAO s'exporte en PDF en moins de 10 s ; 50 visites hors ligne se synchronisent en moins de 30 s (cahier Prospera Web).
- **NFR-2** (Fraîcheur) : Un événement saisi dans Prospera apparaît dans les tableaux de bord des rôles concernés en moins de 5 s ; un mouvement du cœur, au plus tard une période d'échange après son arrivée (paramètre ; défaut : 5 minutes avec une API, sinon toutes les heures ou la nuit, annexe D). Chaque chiffre affiche la date de sa dernière lecture du cœur (FR-2).
- **NFR-3** (Disponibilité) : Le serveur central est disponible 99,5 % du temps ouvré de l'IMF (objectif de conception, sans engagement : cible reprise du cahier de la démo ; l'IMF exploite ses serveurs ; défaut, annexe D) ; l'application terrain fonctionne sans réseau (UJ-4) ; une panne du lien avec le cœur ne bloque ni l'instruction ni le recouvrement, elle retarde seulement les mouvements (§6.5).
- **NFR-4** (Sauvegarde) : Sauvegardes 3-2-1, perte de données maximale d'une heure, reprise en quatre heures (PRD moteur NFR-7). Une restauration est essayée au moins une fois par mois (FR-267). Au redémarrage ou après une restauration, les ordres de décaissement de la dernière heure sont rapprochés avec le fournisseur avant toute réémission (§5.8).
- **NFR-5** (Sécurité) : Chiffrement en transit et au repos ; double authentification pour les rôles sensibles (FR-5) ; aucun port entrant chez l'IMF (relais Money Vibes, décision B1) ; fichiers déposés vérifiés (type, antivirus) ; aucune donnée métier dans le navigateur (PRD-D FR-1).
- **NFR-6** (Trace) : Journal non modifiable par l'application, chaîné et ancré hors du serveur, conservé au moins dix ans (FR-9).
- **NFR-7** (Données personnelles) : Consentements par finalité (FR-15) ; données sur les serveurs de l'IMF ; règles de chaque pays en paramètres, à faire vérifier par un juriste.
- **NFR-8** (Hors ligne) : Une saisie hors ligne porte un identifiant unique : la rejouer ne crée jamais de doublon ; elle ne change aucun solde avant validation par le serveur (cahier Prospera Web).
- **NFR-9** (Appareils et langue) : Navigateurs récents (Chrome, Firefox, Edge, Safari iOS) ; application terrain sur téléphone Android d'entrée de gamme (appareil de référence fixé à la recette) ; interface en français.
- **NFR-10** (Exactitude) : Montants en FCFA entiers ; TEG calculé à 0,01 point près (FR-10) ; tout indicateur se recalcule depuis les données (FR-13).

### Additional Requirements (spine)

- **AD-1** : Le cœur fait foi ; Prospera ne tient que des projections datées
- **AD-2** : Les unités et leurs données : un propriétaire par objet
- **AD-3** : Sept modules dans un service, sans couplage de code
- **AD-4** : La machine à états du dossier : un seul écrivain, des transitions gardées
- **AD-5** : Le décaissement : un ordre, une clé, un seul canal
- **AD-6** : Échéancier contractuel, échéancier officiel, Créance
- **AD-7** : Le contrat d'échange avec le cœur : des objets, deux transports, Prospera tire
- **AD-8** : Apparier par la clé d'origine
- **AD-9** : Un seul catalogue de contrats nommés
- **AD-10** : Le cœur fictif : un logiciel à part, jamais en production
- **AD-11** : Une seule bibliothèque de calcul financier
- **AD-12** : Tout se fige au dossier : version du produit, version des paramètres
- **AD-13** : Les montants : entiers d'unité mineure, avec leur devise
- **AD-14** : L'IA : un port Proposition, des règles v0 dans l'IA commune
- **AD-15** : La séparation des tâches se vérifie sur l'acteur, à chaque commande
- **AD-16** : Les périmètres : lus du réseau, appliqués par chaque module
- **AD-17** : La piste d'audit métier : par module, en ajout seul, chaînée, ancrée hors de l'hôte
- **AD-18** : Les données sensibles : chiffrées par champ, clés hors du compte d'administration
- **AD-19** : Le terrain hors ligne : l'appareil propose, le serveur juge
- **AD-20** : Le recouvrement de l'IMF : le module partagé, avec des écarts nommés
- **AD-21** : Le reporting BCEAO : les chiffres viennent des projections, jamais d'un calcul à part
- **AD-22** : La LBC/FT : listes importées, filtrage par l'IMF, secret au serveur
- **AD-23** : Prospera dans l'espace d'essai et dans l'espace réel
- **AD-24** : La tranche de février et l'ordre de construction
- **AD-25** : Ce que cette spine change chez ses voisins
- **AD-26** : Le relais Money Vibes : une unité, un propriétaire, accusé après écriture
- **AD-27** : Identité d'une échéance et versions d'échéancier
- **AD-28** : Les paramètres réglementaires : un propriétaire, livrés comme données signées
- **AD-29** : Après une restauration : une fenêtre de rapprochement, des numéros qui ne reculent pas
- **AD-30** : Une horloge unique, pilotée dans l'espace d'essai

### UX Design Requirements

Il n'y a pas de contrat UX séparé : **le front de démo `prospera-web` sert de maquette** (décision du PO, comme pour le distributeur). Chaque épic reprend les écrans de la démo qu'il touche, branchés ou « bientôt », et crée les écrans qui manquent (PRD §5.14). La règle de la maquette d'abord s'applique (`prototypes/prospera-prototype.html`).

### FR Coverage Map

- FR-1 → EPIC-185 — Les règles transverses du PRD distributeur valent ici
- FR-2 → EPIC-183 — Ce que Prospera tient, ce que le cœur tient
- FR-3 → EPIC-180 — Les seuils de la démo sont des valeurs par défaut
- FR-4 → EPIC-193 — Les seuils d'alerte se calibrent sur les données de l'IMF
- FR-5 → EPIC-198 — Seize rôles, cinq échelons, un périmètre par rôle
- FR-6 → EPIC-185 — Séparation des tâches et délégation tracée
- FR-7 → EPIC-181 — Le secteur d'activité est une donnée de premier rang
- FR-8 → EPIC-190 — L'IA est spécifiée ici, servie par l'IA commune
- FR-9 → EPIC-185 — Qui a fait quoi, et quand
- FR-10 → EPIC-180 — Aucun prêt au-dessus du plafond d'usure
- FR-11 → EPIC-184 — L'IMF de démonstration
- FR-12 → EPIC-184 — Dans la démo, on crée pour de vrai
- FR-13 → EPIC-184 — Un jeu cohérent au centime
- FR-14 → EPIC-187 — Les messages passent par `notification`
- FR-15 → EPIC-181 — Données personnelles et consentements
- FR-16 → EPIC-200 — Les modules de l'IMF s'installent un par un
- FR-30 → EPIC-185 — Une demande n'existe que sur un client dont la fiche est utilisable
- FR-31 → EPIC-185 — Le crédit se branche sur les prospects venus du terrain et du commercial
- FR-32 → EPIC-185 — Créer la demande avec un produit du catalogue
- FR-33 → EPIC-185 — Montant et durée restent dans les limites du produit
- FR-34 → EPIC-185 — L'éligibilité du client est contrôlée avant la création
- FR-35 → EPIC-185 — La simulation affiche l'échéancier prévu et le TEG
- FR-36 → EPIC-185 — Le TEG est actuariel annuel proportionnel et le plafond d'usure bloque l'octroi
- FR-37 → EPIC-185 — La demande se saisit en brouillon hors ligne
- FR-38 → EPIC-185 — Le client peut renoncer : statut ANNULE
- FR-39 → EPIC-185 — Le CC fixe le rendez-vous et liste les pièces manquantes
- FR-40 → EPIC-185 — L'agent téléverse les pièces et le CC les accepte ou les rejette
- FR-41 → EPIC-185 — Les cautions sont enregistrées, au moins 2 au-dessus d'un seuil
- FR-42 → EPIC-185 — Les garanties exigées suivent un barème paramétrable
- FR-43 → EPIC-185 — Le dossier passe seul à DOSSIER_COMPLET et le score est recalculé
- FR-44 → EPIC-185 — La consultation du BIC est saisie à la main, avec sa pièce
- FR-45 → EPIC-185 — Le CC planifie les visites au domicile et sur le lieu d'activité
- FR-46 → EPIC-185 — Une visite d'instruction exige une photo et un GPS dans le rayon
- FR-47 → EPIC-186 — Le rapport d'analyse porte la grille des 5C et les indicateurs calculés
- FR-48 → EPIC-186 — Les alertes d'instruction sont affichées avec leur règle
- FR-49 → EPIC-186 — Le score du dossier et la décision suggérée sont proposés par l'IA, avec provenance
- FR-50 → EPIC-186 — La checklist d'instruction doit être complète à 100 % avant l'avis
- FR-51 → EPIC-186 — Le CC rend un avis favorable ou défavorable, motivé
- FR-52 → EPIC-186 — L'analyste risque donne un avis consultatif au-dessus d'un seuil
- FR-53 → EPIC-186 — Le ROC lit un rapport complet avec une proposition
- FR-54 → EPIC-186 — Le ROC approuve en fixant montant, taux, durée et gestionnaire, sans échéancier
- FR-55 → EPIC-186 — Le ROC refuse ou demande des garanties
- FR-56 → EPIC-187 — Le comité délibère avec un quorum paramétrable
- FR-57 → EPIC-187 — Le niveau d'approbation dépend du montant
- FR-58 → EPIC-187 — Les prêts aux parties liées passent par le conseil
- FR-59 → EPIC-187 — La décision favorable fige les conditions finales
- FR-60 → EPIC-187 — Un refus du comité est final pour la séance, avec motif
- FR-61 → EPIC-187 — Le comité génère l'échéancier contractuel, par annuité constante par défaut
- FR-62 → EPIC-187 — Le contrat imprimé porte le TEG et le tableau d'amortissement
- FR-63 → EPIC-187 — Le dossier accordé est envoyé au cœur ; il y devient le prêt officiel après décaissement
- FR-64 → EPIC-187 — Le crédit émet un ordre de décaissement avec son canal
- FR-65 → EPIC-187 — Les frais et l'assurance sont prélevés au décaissement
- FR-66 → EPIC-187 — Aucun décaissement tant que les gardes ne sont pas toutes vertes
- FR-67 → EPIC-187 — Tout décaissement est autorisé par le comptable ou le DAF, jamais par celui qui l'a préparé ou décidé
- FR-68 → EPIC-187 — Espèces et virement sont exécutés par le cœur sur l'ordre de Prospera
- FR-69 → EPIC-187 — Mobile Money et PI-SPI passent par `paiement`, puis sont déclarés au cœur
- FR-70 → EPIC-187 — Le comité fait passer le dossier à EN_GESTION ; le cœur confirme le décaissement
- FR-71 → EPIC-187 — Le GP suit le prêt EN_GESTION et saisit les remboursements sans doublon
- FR-72 → EPIC-188 — Un groupe solidaire a un dossier de groupe et un sous-dossier par membre
- FR-73 → EPIC-188 — Le groupe a une seule décision et un échéancier par membre
- FR-74 → EPIC-188 — Le défaut d'un membre est une affaire du groupe
- FR-75 → EPIC-188 — La clôture est confirmée par le cœur et libère les garanties
- FR-76 → EPIC-188 — Un nouveau cycle est proposé selon une règle
- FR-77 → EPIC-188 — Le crédit lit les retours du recouvrement sans les ranger dans ses statuts
- FR-78 → EPIC-185 — Le dossier suit douze statuts, plus ANNULE
- FR-79 → EPIC-185 — Chaque transition a un acteur autorisé et des gardes évaluées au serveur
- FR-80 → EPIC-185 — Chaque changement est horodaté : qui a fait quoi, et quand
- FR-81 → EPIC-185 — Les retours en arrière sont limités et tracés
- FR-82 → EPIC-185 — La séparation des tâches est contrôlée
- FR-83 → EPIC-185 — Les délais de traitement sont mesurés sur les horodatages
- FR-84 → EPIC-186 — Une dérogation est motivée, limitée et tracée
- FR-85 → EPIC-186 — En cas d'absence, un rôle peut être délégué, explicitement
- FR-86 → EPIC-186 — Tout seuil du crédit est un paramètre de l'IMF
- FR-87 → EPIC-187 — Chaque événement du processus prévient les bonnes personnes
- FR-88 → EPIC-187 — Un message au client respecte son consentement et son canal
- FR-89 → EPIC-186 — Les écrans conservés de la démo deviennent réels
- FR-90 → EPIC-186 — Les écrans qui manquent sont créés
- FR-91 → EPIC-186 — Les boutons décoratifs deviennent branchés ou « bientôt »
- FR-92 → EPIC-186 — Chacun ne voit que son périmètre
- FR-93 → EPIC-186 — Le parcours UJ-1 est le test d'acceptation du crédit
- FR-94 → EPIC-186 — Le parcours UJ-2 mène un prêt de groupe jusqu'à EN_GESTION
- FR-95 → EPIC-190 — Le dossier porte une analyse narrative, des étoiles et un sentiment
- FR-96 → EPIC-190 — L'analyse étendue couvre six volets, du micro au macro
- FR-97 → EPIC-190 — Le crédit analyse le secteur d'activité et sa saturation dans le portefeuille
- FR-98 → EPIC-190 — L'IA lève des alertes de fraude, de conformité et de comportement de crédit
- FR-99 → EPIC-190 — À la simulation, l'IA recommande un produit et des conditions optimales
- FR-100 → EPIC-180 — Un produit financier est une fiche versionnée, gérée à deux personnes
- FR-101 → EPIC-180 — Un produit de crédit porte ses bornes, son taux et sa périodicité
- FR-102 → EPIC-180 — La méthode d'amortissement est un choix du produit
- FR-103 → EPIC-180 — Frais, assurance et garanties de frais sont typés, avec le drapeau « inclus dans le TEG »
- FR-104 → EPIC-180 — L'éligibilité d'un client à un produit se juge sur l'ancienneté ; le score alerte
- FR-105 → EPIC-180 — Le produit dit quelles cautions et quelles garanties il exige
- FR-106 → EPIC-180 — Un produit d'épargne dit ses règles ; le cœur tient les comptes
- FR-107 → EPIC-180 — Chaque modification publiée crée une version ; le dossier garde ses conditions
- FR-108 → EPIC-180 — Une version qui dépasse le plafond d'usure, au pire cas, ne se publie pas
- FR-109 → EPIC-180 — La simulation montre l'échéancier, les frais et le TEG, sans rien enregistrer
- FR-110 → EPIC-180 — Le code produit est commun avec le cœur ; les conditions figées lui sont renvoyées
- FR-111 → EPIC-180 — Le jeu de démonstration ne contient que des produits conformes, au pire cas
- FR-112 → EPIC-190 — Le module recommande un produit selon le profil du client
- FR-113 → EPIC-190 — La simulation propose les conditions optimales
- FR-114 → EPIC-181 — Un prospect se crée en quelques champs, sur le terrain
- FR-115 → EPIC-181 — Passer de prospect à client exige une fiche complète
- FR-116 → EPIC-181 — Une personne, une fiche, un identifiant du cœur
- FR-117 → EPIC-181 — Le secteur d'activité est un champ structuré obligatoire, d'une nomenclature commune
- FR-118 → EPIC-181 — Les photos, la position GPS et les pièces sont des preuves, avec consentement et expiration
- FR-119 → EPIC-181 — Le KYC a trois niveaux, avec PPE et bénéficiaire effectif
- FR-120 → EPIC-181 — Le KYC est validé par un autre que le créateur de la fiche, avant la demande
- FR-121 → EPIC-182 — Les listes de sanctions sont rafraîchies, et tout le fichier est refiltré
- FR-122 → EPIC-181 — Le KYC est revu périodiquement
- FR-123 → EPIC-182 — Les seuils CENTIF alertent, l'IMF déclare hors Prospera
- FR-124 → EPIC-190 — Le score du client et la notation de risque LBC sont explicables, avec leur provenance
- FR-125 → EPIC-190 — La probabilité de défaut et la classe réglementaire estimée se recalculent à chaque événement
- FR-126 → EPIC-190 — L'IA alerte sur les signaux faibles d'un client
- FR-127 → EPIC-190 — Chaque fiche porte une analyse par secteur, micro et macro-économique
- FR-128 → EPIC-190 — La carte montre les zones à risque et suggère où prospecter
- FR-129 → EPIC-181 — Un groupe solidaire est un client collectif, et sa vie est tracée
- FR-130 → EPIC-181 — L'épargne se lit du cœur : fiche, liste des comptes, vue consolidée du DG et statistiques
- FR-131 → EPIC-190 — L'IA commune analyse l'épargne : dormants, produit, fidélité, encours, segments
- FR-132 → EPIC-181 — Les consentements sont horodatés, par finalité, et retirables
- FR-133 → EPIC-181 — Qui voit quelle fiche, et ce qui est journalisé
- FR-134 → EPIC-181 — Hors ligne, la fiche, les visites et la demande en brouillon marchent ; jamais la décision
- FR-135 → EPIC-191 — Le collecteur enregistre un remboursement ou un dépôt d'épargne et remet un reçu
- FR-136 → EPIC-191 — La collecte marche hors ligne, sans doublon et sans changer de solde
- FR-137 → EPIC-191 — La collecte est rattachée à une échéance et renvoyée au cœur
- FR-138 → EPIC-191 — Le collecteur remet les espèces au guichet : un transfert de caisse, contre une remise contresignée
- FR-139 → EPIC-191 — La collecte est rapprochée du cœur et de la remise, et se corrige par contre-passation
- FR-140 → EPIC-191 — Un paiement Mobile Money collecté attend la validation du comptable
- FR-141 → EPIC-191 — Le plan de collecte du jour est préchargé sur l'appareil
- FR-142 → EPIC-195 — L'IA propose les priorités de la journée du collecteur
- FR-143 → EPIC-192 — Le collecteur a un fonds de caisse tracé et une position visible
- FR-144 → EPIC-192 — La clôture du jour est une étape obligatoire du collecteur
- FR-145 → EPIC-192 — L'écart de caisse alerte, avec des seuils calibrés sur l'IMF ; les clôtures se pilotent
- FR-146 → EPIC-192 — La caisse du guichet se lit du cœur ; ce qui reste « bientôt »
- FR-147 → EPIC-195 — L'IA aide le comptable à valider les paiements Mobile Money et à les rapprocher
- FR-148 → EPIC-195 — L'IA détecte les anomalies et les risques de fraude de caisse
- FR-149 → EPIC-195 — La prévision de trésorerie à 7 jours et le rééquilibrage entre agences se lisent, ne s'exécutent pas
- FR-150 → EPIC-183 — Le cœur fait foi pour l'argent
- FR-151 → EPIC-183 — Prospera reçoit du cœur les objets de l'argent
- FR-152 → EPIC-183 — Prospera renvoie au cœur ce qu'il décide
- FR-153 → EPIC-183 — Le dossier accordé part avec l'échéancier contractuel
- FR-154 → EPIC-183 — L'ordre de décaissement est exécuté par le cœur, ou par `paiement`
- FR-155 → EPIC-183 — Les remboursements saisis dans Prospera sont renvoyés au cœur, si possible
- FR-156 → EPIC-183 — Quand le cœur ne sait pas recevoir, Prospera sort la liste « à saisir dans le cœur »
- FR-157 → EPIC-183 — L'échange passe par une API si le cœur sait, sinon par des fichiers ; Prospera tire toujours
- FR-158 → EPIC-183 — Un relais Money Vibes reçoit les notifications entrantes
- FR-159 → EPIC-183 — Chaque écran dit la fraîcheur, et les écarts vont dans une file
- FR-160 → EPIC-183 — L'idempotence et le rejeu sont des capacités du contrat
- FR-161 → EPIC-183 — Prospera reçoit des mouvements, jamais des totaux
- FR-162 → EPIC-183 — L'échéancier contractuel est comparé à l'échéancier officiel
- FR-163 → EPIC-183 — Un rapprochement trimestriel compare le portefeuille de Prospera et celui du cœur
- FR-164 → EPIC-183 — Le code d'agence est celui du cœur s'il existe
- FR-165 → EPIC-183 — Prospera continue quand le cœur est indisponible
- FR-166 → EPIC-184 — Le cœur fictif tient ce que tient un vrai cœur
- FR-167 → EPIC-184 — Le cœur fictif n'est jamais installé en production réelle
- FR-168 → EPIC-184 — Le cœur fictif exécute les décaissements, avec des cas simulés
- FR-169 → EPIC-184 — Le cœur fictif fait vivre les 1 000 prêts
- FR-170 → EPIC-184 — Le cœur fictif offre l'API et les fichiers, et sait tomber en panne
- FR-171 → EPIC-184 — La démo se remet à zéro et un prospect la teste lui-même
- FR-172 → EPIC-184 — Dans la démo, un dossier créé va jusqu'à EN_GESTION
- FR-173 → EPIC-193 — Le PAR est calculé en encours, de façon cumulative
- FR-174 → EPIC-193 — Le PAR se ventile par agence, agent, secteur d'activité et produit
- FR-175 → EPIC-193 — Le classement suit les classes réglementaires du pays, barème SFD par défaut
- FR-176 → EPIC-193 — Les provisions sont proposées, jamais comptabilisées
- FR-177 → EPIC-193 — La concentration est mesurée et alertée
- FR-178 → EPIC-193 — Les seuils d'alerte sont calibrés sur les données de l'IMF
- FR-179 → EPIC-193 — Une alerte est traitée dans un délai, puis remontée ; les migrations sont listées
- FR-180 → EPIC-195 — L'IA analyse le risque par secteur d'activité et par conjoncture
- FR-181 → EPIC-195 — L'IA prévoit le PAR, la perte attendue et analyse les provisions
- FR-182 → EPIC-193 — Le module reprend les règles du paquet comptable SFD, sans sa tenue des crédits
- FR-183 → EPIC-196 — Le module génère les indicateurs périodiques
- FR-184 → EPIC-196 — Le rapport suit la périodicité de la catégorie de supervision
- FR-185 → EPIC-196 — Le rapport mensuel de portefeuille et de provisions est produit par Prospera
- FR-186 → EPIC-196 — Le DG valide, l'IMF signe et dépose hors de Prospera
- FR-187 → EPIC-196 — Les ratios prudentiels sont calculés si la balance du cœur est là
- FR-188 → EPIC-196 — Le rapport sort en PDF et en CSV
- FR-189 → EPIC-196 — Le plafond d'usure est contrôlé sur tout le portefeuille
- FR-190 → EPIC-195 — L'IA calcule le score de conformité, alerte tôt et rédige le commentaire du rapport BCEAO
- FR-191 → EPIC-196 — La piste d'audit est ajoutée seulement et conservée 10 ans
- FR-192 → EPIC-196 — La séparation des tâches est contrôlée, et l'auditeur lit sans modifier
- FR-193 → EPIC-196 — La LBC/FT est mise à jour régulièrement et exportée
- FR-194 → EPIC-195 — L'IA détecte les anomalies et corrèle les événements suspects de la trace
- FR-195 → EPIC-196 — Les textes réglementaires sont des paramètres par pays, à faire vérifier
- FR-196 → EPIC-197 — Le portefeuille de prêts en cours est importé par la Reprise
- FR-197 → EPIC-197 — Un prêt en cours sans échéancier complet n'entre pas
- FR-198 → EPIC-197 — La reprise prépare aussi les seuils et les identifiants
- FR-199 → EPIC-195 — L'IA détecte les écarts et les doublons entre Prospera et le cœur
- FR-200 → EPIC-191 — Le plan de journée de l'agent se déduit de l'échéancier et du dossier
- FR-201 → EPIC-191 — Une visite d'instruction est une preuve : photo, GPS, 100 m, « hors zone » refusée mais jamais effacée
- FR-202 → EPIC-191 — Les résultats d'une visite, la collecte d'épargne et le suivi de groupe
- FR-203 → EPIC-191 — Les missions de recouvrement arrivent dans l'application et leur résultat revient
- FR-204 → EPIC-191 — Hors ligne, ce qui marche et ce qui ne marche jamais
- FR-205 → EPIC-191 — Rôles, périmètres, carte et ce que l'IMF n'a pas
- FR-206 → EPIC-195 — L'IA propose l'ordre de visite optimal et alerte quand un client en retard est proche
- FR-207 → EPIC-195 — Saisie vocale vers la fiche et rapport du soir
- FR-208 → EPIC-195 — L'IA suggère des zones de prospection et la réaffectation des agents
- FR-209 → EPIC-194 — Le remboursement est reçu du cœur ou saisi dans Prospera, et le cœur fait foi
- FR-210 → EPIC-194 — Le Mobile Money déclaré est validé par le comptable, et le rapprochement se fait à moins de 1 %
- FR-211 → EPIC-194 — Un dossier de recouvrement par prêt, ouvert à l'entrée en retard
- FR-212 → EPIC-194 — Le calendrier de relances de l'IMF : J-3, J+1 à J+3, J+7, 3 échecs, J+90
- FR-213 → EPIC-194 — Une promesse de paiement suspend les relances jusqu'à sa date
- FR-214 → EPIC-194 — Les statuts de recouvrement, un second axe décidé par des rôles
- FR-215 → EPIC-194 — Le ROC voit le réseau trié par PAR et descend jusqu'au dossier
- FR-216 → EPIC-194 — Le ROC définit la stratégie et affecte les agents de recouvrement par zone
- FR-217 → EPIC-194 — Chaque action de recouvrement est tracée avec son résultat
- FR-218 → EPIC-194 — Le ROC seul bloque un dossier, avec motif ; le blocage suspend les demandes du client et de ses cautions appelées
- FR-219 → EPIC-194 — À J+90, le passage au contentieux est proposé au ROC ; le judiciaire exige le DG
- FR-220 → EPIC-194 — Le plan d'étalement est limité, unique par prêt, et envoyé au cœur
- FR-221 → EPIC-194 — La perte définitive est proposée à 24 mois, décidée par le DG, envoyée au cœur
- FR-222 → EPIC-194 — La fiche du mauvais payeur est ouverte par règle, par client, et se ferme
- FR-223 → EPIC-194 — L'appel des cautions et la saisie de garantie sont tracés
- FR-224 → EPIC-194 — La relance du groupe solidaire vise d'abord la membre, puis le groupe
- FR-225 → EPIC-194 — La clôture du prêt et le nouveau cycle, côté recouvrement
- FR-226 → EPIC-195 — L'IA règle le déclenchement, la priorité, le canal, le moment et le message des relances
- FR-227 → EPIC-195 — Le score de recouvrement est la probabilité de récupérer, explicable, avec ses poids
- FR-228 → EPIC-195 — L'IA propose la stratégie par agence et analyse le comportement de retard
- FR-229 → EPIC-195 — L'IA propose des scripts de relance et des conseils par rôle
- FR-230 → EPIC-198 — Chacun des seize rôles a son tableau de bord, composé en données
- FR-231 → EPIC-198 — Le DG lit douze chiffres qui engagent une décision
- FR-232 → EPIC-198 — Le DG descend du réseau jusqu'au client, par la géographie
- FR-233 → EPIC-198 — Le même pilotage se lit par secteur d'activité
- FR-234 → EPIC-198 — Une alerte a un destinataire, un délai et une remontée
- FR-235 → EPIC-198 — Les déclencheurs d'alerte sont des règles, aux seuils calibrés
- FR-236 → EPIC-195 — Décisions à trancher, synthèse du DG et rapport de direction
- FR-237 → EPIC-195 — Le Copilot est réel dès le premier jour, en lecture seule, chiffres sourcés
- FR-238 → EPIC-198 — Les priorités du jour et les anomalies d'agence sont proposées, avec leur provenance
- FR-239 → EPIC-198 — Une seule source de vérité pour les chiffres
- FR-240 → EPIC-198 — Un seul barème d'équipe : 90, 75, 60
- FR-241 → EPIC-198 — Objectifs par agence et par agent, écart à l'objectif
- FR-242 → EPIC-198 — Classement, fiche agent, rémunération privée, pas de paie
- FR-243 → EPIC-198 — L'IA des équipes : prévision du PAR par zone, coaching, comparaison entre agences
- FR-244 → EPIC-198 — Comptes, droits et journal d'accès
- FR-245 → EPIC-199 — Les campagnes de l'IMF, créées, validées, lancées pour de vrai
- FR-246 → EPIC-199 — Les prospects et l'acquisition appartiennent au réseau commercial
- FR-247 → EPIC-199 — Le chatbot WhatsApp est « bientôt » ; au premier jour, des relances sortantes et une boîte de réponses
- FR-248 → EPIC-199 — L'IA du marketing : segmentation, ciblage, notes de prospects, propositions de campagnes
- FR-249 → EPIC-199 — Ce qui reste « bientôt » dans le marketing
- FR-250 → EPIC-199 — Les règles de l'IMF sont des données, et le blocage d'un dossier reste humain
- FR-251 → EPIC-199 — Le support client est inscrit, sans écran au premier jour
- FR-252 → EPIC-199 — Au mieux, un export des écritures vers le cœur
- FR-253 → EPIC-199 — Pas de contrôle de gestion ; le DAF garde son tableau Budget et Rentabilité
- FR-254 → EPIC-199 — L'IA du DAF : prévision de trésorerie à 7 jours et perte attendue, sur les données du cœur
- FR-255 → EPIC-200 — Réseau : quatre échelons, code d'agence du cœur, zones en polygones
- FR-256 → EPIC-189 — Paiement : décaisser et encaisser par pays et par opérateur, banques par PI-SPI
- FR-257 → EPIC-189 — Le registre de Créance : `paiement` reste seul propriétaire
- FR-258 → EPIC-200 — Notification : WhatsApp, SMS et lien de paiement, servis par le relais
- FR-259 → EPIC-200 — Reprise et connecteurs : les fichiers d'abord, le vrai connecteur plus tard
- FR-260 → EPIC-190 — Ce que l'IMF fournit à l'IA commune, ce qu'elle en reçoit, et sous quel consentement
- FR-261 → EPIC-200 — Licence à vie : jamais de coupure ni de suspension pour impayé
- FR-262 → EPIC-200 — Les mises à jour : essai, date choisie par l'IMF, retour arrière, fichier signé
- FR-263 → EPIC-200 — Le relais Money Vibes, parce qu'aucun port n'est ouvert chez l'IMF
- FR-264 → EPIC-200 — L'accès des agences : navigateur, guichet en ligne, hors ligne seulement sur le téléphone
- FR-265 → EPIC-200 — L'exploitation est faite par l'équipe informatique de l'IMF, qui ne lit pas le métier
- FR-266 → EPIC-200 — Le dimensionnement est celui de l'IMF ; la démonstration est testée à dix fois sa taille
- FR-267 → EPIC-200 — Sauvegardes de l'IMF et conservation de dix ans
- FR-268 → EPIC-200 — Les listes de sanctions LBC/FT se mettent à jour sans port entrant
- FR-269 → EPIC-200 — Le support à distance est ouvert par l'IMF seule
- FR-270 → EPIC-185 — L'onglet « Client » du dossier montre le client tel que le CC doit le lire
- FR-271 → EPIC-188 — Un refinancement est un nouveau dossier qui solde l'ancien prêt
- FR-272 → EPIC-193 — Le tableau de risque du DG : entonnoir d'ancienneté, carte de chaleur et taux
- FR-273 → EPIC-198 — Contrôle quotidien du ROC, écran réseau, demandes en attente, portefeuille du GP et Opérations bancaires
- FR-274 → EPIC-194 — L'onglet Preuves des relances, les campagnes de relance et la correspondance des workflows de la démo

## Epic List

| Épic | Titre | ★ | FR | Dépend de |
|---|---|---|---|---|
| EPIC-180 | Des produits financiers conformes à l'usure | ★ | 14 | aucun |
| EPIC-181 | Les clients, les groupes et leur KYC | ★ | 15 | EPIC-180 (éligibilité) |
| EPIC-182 | La lutte contre le blanchiment, tenue à jour |  | 2 | EPIC-181 |
| EPIC-183 | L'échange avec le cœur de l'IMF | ★ | 17 | aucun (le contrat se prouve avec EPIC-184) |
| EPIC-184 | Le cœur fictif et l'IMF de démonstration | ★ | 10 | EPIC-180, EPIC-183 |
| EPIC-185 | Demander un crédit et constituer le dossier | ★ | 27 | EPIC-180, EPIC-181 |
| EPIC-186 | Instruire et décider | ★ | 18 | EPIC-185 ; EPIC-190 pour l'affichage des propositions (sinon `NON_INSTALLE`) |
| EPIC-187 | Le comité, l'échéancier et le décaissement | ★ | 19 | EPIC-185, EPIC-186, EPIC-183 (ordre au cœur), EPIC-189 (Créance) |
| EPIC-188 | Le crédit de groupe, la clôture, le refinancement et le nouveau cycle | ★ | 7 | EPIC-187 |
| EPIC-189 | Les échéances de prêt dans `paiement` | ★ | 2 | EPIC-183, EPIC-187 |
| EPIC-190 | L'IA commune v0 : le socle et l'IA du crédit | ★ | 15 | EPIC-181, EPIC-185 |
| EPIC-191 | La collecte terrain et le terrain de l'IMF | ★ | 13 | EPIC-181, EPIC-183 |
| EPIC-192 | La caisse des collecteurs |  | 4 | EPIC-191 |
| EPIC-193 | Le risque de portefeuille | ★ | 10 | EPIC-183 |
| EPIC-194 | Le recouvrement de l'IMF | ★ | 18 | EPIC-189, EPIC-183 |
| EPIC-195 | L'IA du suivi : relances, terrain, caisse, risque, conformité, Copilot |  | 18 | EPIC-190 et l'épic de chaque module |
| EPIC-196 | La conformité BCEAO et l'audit |  | 11 | EPIC-193, EPIC-183 |
| EPIC-197 | La reprise du portefeuille de prêts en cours |  | 3 | EPIC-183, EPIC-185, EPIC-181 |
| EPIC-198 | Le pilotage de l'IMF : tableaux de bord, rôles, équipes | ★ | 15 | EPIC-193 et les épics des modules lus |
| EPIC-199 | Marketing, automatisations, support et export des écritures |  | 10 | EPIC-181 |
| EPIC-200 | L'installation chez l'IMF et les modules cadrés |  | 13 | spine du moteur ; amendements du 2026-11-13 |

### EPIC-180 : Des produits financiers conformes à l'usure ★

Le DAF crée, versionne et publie des produits de crédit et d'épargne ; un produit dont le pire cas dépasse le plafond d'usure ne peut pas être publié ; un dossier garde la version de son produit.

**FRs covered:** FR-3, FR-10, FR-100 → FR-111

- **Spine :** AD-11, AD-12, AD-13, AD-28
- **Dépôts :** `prospera-plateforme/finance` (bibliothèque de calcul), `prospera-imf-service` (module `produits-financiers`), `prospera-app`
- **Dépend de :** aucun
- **Fini quand :** Le tableau de TEG de référence (addendum §3) passe à 0,01 point ; « Crédit Commerce » 1,25 %/mois, 6 à 24 mois, se publie ; la même offre sur 3 mois avec 2 % de frais est refusée.

### EPIC-181 : Les clients, les groupes et leur KYC ★

L'agent crée un prospect puis un client avec son secteur d'activité (nomenclature NAEMA) ; un groupe solidaire se forme ; le KYC est validé par un autre que le créateur ; les consentements sont recueillis par finalité ; l'épargne du cœur s'affiche sur la fiche.

**FRs covered:** FR-7, FR-15, FR-114 → FR-120, FR-122, FR-129, FR-130, FR-132 → FR-134

- **Spine :** AD-2, AD-16, AD-18
- **Dépôts :** `prospera-imf-service` (module `microfinance`), `prospera-app`
- **Dépend de :** EPIC-180 (éligibilité)
- **Fini quand :** UJ-1 jusqu'au KYC validé ; une fiche sans secteur ne se valide pas ; le créateur ne peut pas valider son KYC.

### EPIC-182 : La lutte contre le blanchiment, tenue à jour

Les listes de sanctions arrivent chaque jour et refiltrent tout le fichier ; une correspondance confirmée suit sa procédure (blocage, gel, déclaration) sans jamais être visible des agents ; les scénarios de soupçon alertent la conformité.

**FRs covered:** FR-121, FR-123

- **Spine :** AD-22, AD-26
- **Dépôts :** `prospera-imf-service` (module `microfinance`), `prospera-app`
- **Dépend de :** EPIC-181
- **Fini quand :** Une liste importée refiltre 1 000 clients ; une correspondance confirmée bloque le client ; un CC ne voit ni le dossier de soupçon ni un compteur.

### EPIC-183 : L'échange avec le cœur de l'IMF ★

Prospera reçoit du cœur clients, prêts, échéanciers, mouvements, épargne, caisse du guichet et balance, et lui envoie dossiers accordés, ordres, annulations et remboursements ; tout mouvement s'apparie par sa clé d'origine ; un écart se voit et se traite.

**FRs covered:** FR-2, FR-150 → FR-165

- **Spine :** AD-1, AD-2, AD-7, AD-8, AD-9, AD-27, AD-29
- **Dépôts :** `prospera-plateforme/contrats/coeur-sfd`, `prospera-coeur-sfd-service`, `prospera-app`
- **Dépend de :** aucun (le contrat se prouve avec EPIC-184)
- **Fini quand :** Un message rejoué est sans effet ; un mouvement sans clé Prospera ferme une créance au cœur ; un mouvement ambigu ouvre un écart ; cœur coupé trois jours, rien ne se perd.

### EPIC-184 : Le cœur fictif et l'IMF de démonstration ★

Une équipe de l'IMF ouvre une démo vivante : 3 agences, 10 agents, 1 000 prêts actifs sur un cœur fictif qui parle le vrai contrat ; elle crée une agence, un agent et un vrai dossier.

**FRs covered:** FR-11 → FR-13, FR-166 → FR-172

- **Spine :** AD-10, AD-23, AD-30
- **Dépôts :** `prospera-coeur-fictif`, `prospera-plateforme/finance`
- **Dépend de :** EPIC-180, EPIC-183
- **Fini quand :** La même graine donne les mêmes 1 000 prêts ; le cœur fictif refuse de démarrer hors d'un espace d'essai (`COEUR_FICTIF_INTERDIT`) ; le PAR du jeu est entre 5 et 15 %.

### EPIC-185 : Demander un crédit et constituer le dossier ★

L'agent choisit un produit, simule l'échéancier et le TEG, crée le dossier ; le CC liste les pièces, enregistre cautions et garanties et la consultation du BIC ; la machine à états, la séparation des tâches et la piste d'audit chaînée tiennent dès le premier statut.

**FRs covered:** FR-1, FR-6, FR-9, FR-30 → FR-46, FR-78 → FR-83, FR-270

- **Spine :** AD-4, AD-12, AD-15, AD-17
- **Dépôts :** `prospera-imf-service` (module `credit`), `prospera-app`
- **Dépend de :** EPIC-180, EPIC-181
- **Fini quand :** UJ-1 de SOUMIS à DOSSIER_COMPLET ; une transition absente de la table est refusée ; la piste d'un dossier se relit de bout en bout.

### EPIC-186 : Instruire et décider ★

Le CC planifie les visites (photo, GPS, 100 m), remplit la grille 5C et la checklist, lit la proposition de l'IA après son premier avis et rend son avis ; l'analyste risque donne son avis ; le ROC approuve, refuse ou demande des garanties ; les dérogations et délégations sont tracées.

**FRs covered:** FR-47 → FR-55, FR-84 → FR-86, FR-89 → FR-94

- **Spine :** AD-4, AD-14, AD-15
- **Dépôts :** `prospera-imf-service` (module `credit`), `prospera-app`, `prospera-terrain` (visites)
- **Dépend de :** EPIC-185 ; EPIC-190 pour l'affichage des propositions (sinon `NON_INSTALLE`)
- **Fini quand :** UJ-1 de VISITES_PLANIFIEES à EN_COMITE_CREDIT ; une visite hors du rayon n'est pas une preuve ; l'IA absente, le dossier avance.

### EPIC-187 : Le comité, l'échéancier et le décaissement ★

Le DG définit au besoin le comité d'un dossier ; le comité fige les conditions et génère l'échéancier contractuel ; le dossier passe EN_GESTION ; l'ordre de décaissement part par un seul canal, avec une identité stable et des essais numérotés, jusqu'à la confirmation du cœur ; chacun est prévenu au bon moment.

**FRs covered:** FR-14, FR-56 → FR-71, FR-87, FR-88

- **Spine :** AD-4, AD-5, AD-6, AD-9, AD-11
- **Dépôts :** `prospera-imf-service` (module `credit`), `prospera-app`
- **Dépend de :** EPIC-185, EPIC-186, EPIC-183 (ordre au cœur), EPIC-189 (Créance)
- **Fini quand :** UJ-1 de bout en bout jusqu'à CONFIRME sur le cœur fictif ; un ordre rejoué ne décaisse pas deux fois ; un ordre sans réponse passe INCONNU et se rapproche avant réémission.

### EPIC-188 : Le crédit de groupe, la clôture, le refinancement et le nouveau cycle ★

Un groupe solidaire reçoit un dossier de groupe avec un échéancier par membre ; un prêt soldé au cœur se clôture ; un refinancement solde l'ancien prêt au net ; le client repart sur un nouveau cycle selon ses règles.

**FRs covered:** FR-72 → FR-77, FR-271

- **Spine :** AD-4, AD-5, AD-6
- **Dépôts :** `prospera-imf-service` (module `credit`), `prospera-app`
- **Dépend de :** EPIC-187
- **Fini quand :** UJ-2 jusqu'à EN_GESTION ; un refinancement verse le net et clôt l'ancien prêt à la confirmation du cœur.

### EPIC-189 : Les échéances de prêt dans `paiement` ★

`paiement` ouvre les Créances `ECHEANCE_DE_PRET` sur l'échéancier contractuel, en reste seul propriétaire, recale le montant exigible sur le cœur avant tout lien de paiement, rattache un paiement à moins de 1 % sans le solder et applique la tolérance d'arrondi.

**FRs covered:** FR-256, FR-257

- **Spine :** AD-6, AD-8, AD-9 ; spine `paiement` AD-2, AD-3, AD-11 ; amendement `paiement` du 2026-11-13
- **Dépôts :** `prospera-paiement-service`
- **Dépend de :** EPIC-183, EPIC-187
- **Fini quand :** Les quatre critères de l'amendement `paiement` du 2026-11-13 ; un test de facture du distributeur reste vert.

### EPIC-190 : L'IA commune v0 : le socle et l'IA du crédit ★

Une instance locale de l'IA commune sert, par le contrat Proposition, les règles explicables v0 : score du client et du dossier, décision suggérée, analyse étendue (micro, macro, saison, saturation du secteur), recommandation de produit ; chaque proposition dit sa provenance ; les écarts prédiction / réalité sont enregistrés et préparés pour l'apprentissage.

**FRs covered:** FR-8, FR-95 → FR-99, FR-112, FR-113, FR-124 → FR-128, FR-131, FR-260

- **Spine :** AD-14 ; spine du moteur AD-14, AD-39
- **Dépôts :** service porteur de l'IA commune (à cadrer, spine Deferred), `prospera-imf-service` (port Proposition), `prospera-app`
- **Dépend de :** EPIC-181, EPIC-185 ; EPIC-245 → 248 (socle de l'IA commune : service, contrat de proposition, garde-fous, catalogue des capacités et packs ; amendement du 2026-11-14)
- **Fini quand :** UJ-1 affiche score, décision suggérée et analyse avec leur provenance ; couper l'IA ne bloque aucun parcours ; aucune variable interdite n'entre dans le score.

### EPIC-191 : La collecte terrain et le terrain de l'IMF ★

Le collecteur et l'agent travaillent hors ligne : visites, fiches, collectes avec reçus numérotés d'une plage de l'appareil ; au retour du réseau, tout se synchronise sans doublon ; la remise au guichet est un transfert de caisse ; les missions de recouvrement arrivent sur le téléphone.

**FRs covered:** FR-135 → FR-141, FR-200 → FR-205

- **Spine :** AD-8, AD-19
- **Dépôts :** `prospera-terrain` (Flutter), `prospera-imf-service` (module `collecte`), module partagé `terrain`
- **Dépend de :** EPIC-181, EPIC-183
- **Fini quand :** UJ-4 sans réseau ; une synchronisation rejouée ne crée aucun doublon ; un reçu remis ne crédite jamais deux fois un client.

### EPIC-192 : La caisse des collecteurs

Le comptable clôture chaque jour la caisse de chaque collecteur, voit les écarts avec la déclaration et le cœur, et les résout avec un motif ; les écarts récurrents alertent.

**FRs covered:** FR-143 → FR-146

- **Spine :** AD-1, AD-8
- **Dépôts :** `prospera-imf-service` (module `caisse`), `prospera-app`
- **Dépend de :** EPIC-191
- **Fini quand :** UJ-4 se clôt ; un écart de 1 000 FCFA ouvre une alerte au RA ; la caisse du guichet n'est jamais recalculée par Prospera.

### EPIC-193 : Le risque de portefeuille ★

Le ROC et le DG lisent le PAR 1, 7, 30, 60 et 90 par réseau, région, agence, agent, secteur et produit ; les classes réglementaires et les provisions sont proposées puis validées par le DAF ; les seuils d'alerte se calibrent sur les données de l'IMF ; un arrêté se fige.

**FRs covered:** FR-4, FR-173 → FR-179, FR-182, FR-272

- **Spine :** AD-12, AD-21, AD-28
- **Dépôts :** `prospera-imf-service` (module `risque-par`), `prospera-app`
- **Dépend de :** EPIC-183
- **Fini quand :** UJ-3 sur le jeu de démo : chaque PAR se recalcule depuis les projections du cœur ; un seuil calculé n'entre en vigueur qu'après validation.

### EPIC-194 : Le recouvrement de l'IMF ★

Les relances suivent le calendrier J-3, J+1 à J+3, J+7, J+90 ; une promesse suspend les relances ; le ROC voit le réseau par PAR, affecte les agents de recouvrement, bloque un dossier avec un motif ; plan d'étalement, contentieux et perte suivent leurs règles ; les preuves et campagnes de relance sont tenues.

**FRs covered:** FR-209 → FR-225, FR-274

- **Spine :** AD-6, AD-20 ; PRD-D §6.2
- **Dépôts :** module partagé `recouvrement`, `prospera-app`
- **Dépend de :** EPIC-189, EPIC-183
- **Fini quand :** UJ-7 et UJ-8 ; une caution n'est bloquée que si elle a été appelée ; le plan d'étalement part au cœur et revient acquitté.

### EPIC-195 : L'IA du suivi : relances, terrain, caisse, risque, conformité, Copilot

L'IA commune propose l'ordre et le canal des relances, la stratégie de recouvrement, l'ordre des visites, les zones de prospection, les anomalies de caisse, les prévisions de PAR, les alertes de conformité, et le Copilot répond par rôle avec des chiffres sourcés.

**FRs covered:** FR-142, FR-147 → FR-149, FR-180, FR-181, FR-190, FR-194, FR-199, FR-206 → FR-208, FR-226 → FR-229, FR-236, FR-237

- **Spine :** AD-14
- **Dépôts :** service porteur de l'IA commune, modules concernés (port Proposition), `prospera-app`, `prospera-terrain`
- **Dépend de :** EPIC-190 et l'épic de chaque module ; EPIC-245 → 248 (socle de l'IA commune : service, contrat de proposition, garde-fous, catalogue des capacités et packs ; amendement du 2026-11-14)
- **Fini quand :** Chaque proposition porte sa provenance ; les zones de prospection s'affichent au RA ; le Copilot de l'AUD lit la piste d'audit seulement.

### EPIC-196 : La conformité BCEAO et l'audit

Le DAF produit le rapport périodique depuis l'arrêté figé et la balance du cœur ; le DG le valide ; le plafond d'usure se contrôle sur tout le portefeuille ; l'auditeur lit la piste d'audit, les anomalies et le rapprochement trimestriel.

**FRs covered:** FR-183 → FR-189, FR-191 → FR-193, FR-195

- **Spine :** AD-17, AD-21, AD-28
- **Dépôts :** `prospera-imf-service` (module `conformite-bceao`), `prospera-app`
- **Dépend de :** EPIC-193, EPIC-183
- **Fini quand :** UJ-5 : sans balance du cœur, les ratios s'affichent « en attente des données du cœur » ; le PDF sort en moins de 10 s.

### EPIC-197 : La reprise du portefeuille de prêts en cours

Les prêts en cours, leurs échéanciers, clients et garanties entrent dans Prospera par la Reprise, avec un point de coupure daté par l'IMF ; le feu vert de chaque module ouvre la mise en service.

**FRs covered:** FR-196 → FR-198

- **Spine :** AD-7 ; spine de la Reprise AD-2, AD-3, AD-12
- **Dépôts :** `reprise-service`, points d'import de `credit`, `microfinance`, `coeur-sfd`
- **Dépend de :** EPIC-183, EPIC-185, EPIC-181
- **Fini quand :** Un import de démonstration de 1 000 prêts se simule, se valide et donne le feu vert ; un prêt sans échéancier complet est refusé.

### EPIC-198 : Le pilotage de l'IMF : tableaux de bord, rôles, équipes ★

Chacun des seize rôles ouvre son tableau de bord dans son périmètre ; le DG descend du réseau au client par la géographie et par le secteur d'activité ; le ROC a son contrôle quotidien ; les équipes ont objectifs et barème ; le GP voit son portefeuille.

**FRs covered:** FR-5, FR-230 → FR-235, FR-238 → FR-244, FR-273

- **Spine :** AD-16 ; spine de la coque AD-6
- **Dépôts :** modules partagés `dashboard` et `equipe`, `prospera-app`
- **Dépend de :** EPIC-193 et les épics des modules lus
- **Fini quand :** UJ-3 ; un RA qui lit une autre agence est refusé ; ADMIN_IMF n'ouvre aucun écran métier.

### EPIC-199 : Marketing, automatisations, support et export des écritures

Le marketing mène campagnes et prospects ; les automatisations et le support suivent leurs écarts IMF ; le DAF exporte au mieux les écritures vers le cœur et garde son budget.

**FRs covered:** FR-245 → FR-254

- **Spine :** AD-2 ; PRD-D partie 3
- **Dépôts :** modules partagés `marketing`, `automatisations`, `support-client`, `finance-transactions`, `prospera-app`
- **Dépend de :** EPIC-181
- **Fini quand :** Une campagne vise un segment ; un export des écritures se relit dans le format convenu ; le chatbot est « bientôt ».

### EPIC-200 : L'installation chez l'IMF et les modules cadrés

L'IMF installe Prospera sur ses serveurs : licence à vie, contrat de maintenance mensuel, destinations sortantes déclarées, relais Money Vibes, accès des agences, supervision sur place, sauvegardes et restauration ; réseau, notification et connecteurs suivent leurs écarts IMF.

**FRs covered:** FR-16, FR-255, FR-258, FR-259, FR-261 → FR-269

- **Spine :** AD-25, AD-26, AD-29 ; spine du moteur AD-9 (amendé), AD-10, AD-16, AD-30
- **Dépôts :** `agent-instance`, `centrale-service`, relais Money Vibes, `reseau-service`, `notification-service`
- **Dépend de :** spine du moteur ; amendements du 2026-11-13
- **Fini quand :** UJ-9 ; une connexion vers un nom non déclaré est refusée ; à J+30 sans contact, le gel bloque les mises à jour mais pas le travail.

## Ce qui n'est pas dans ces épics

- **Les fiches de stories** : écrites par celui qui code, juste avant de coder.
- **Le vrai connecteur vers le cœur de l'IMF** : hors février (décision A9) ; il partira d'un épic de Connecteurs quand le logiciel de l'IMF sera connu.
- **Le Mobile Money sortant de `paiement`** : à chiffrer au plan (décision Q1) ; en démo, le cœur fictif décaisse.
- **La revue juridique** avant la mise en service (PRD §12.3, action A-2) : ce n'est pas du code.
- **Le service porteur de l'IA commune** : à cadrer (spine, Deferred) ; EPIC-190 et EPIC-195 en dépendent.

