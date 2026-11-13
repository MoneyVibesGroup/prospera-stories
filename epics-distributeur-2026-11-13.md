---
stepsCompleted: [1, 2]
inputDocuments:
  - prospera-stories/prds/prd-distributeur-2026-11-12/prd.md (final : 230 exigences, FR-1 → FR-25, FR-30 → FR-177, FR-180 → FR-226, FR-240 → FR-249, quatre parties, annexes A et B) et son .memlog.md (décisions du PO D-1 à D-24)
  - prospera-stories/architecture/architecture-distributeur-2026-11-13/ARCHITECTURE-SPINE.md (finale, 34 AD, AD-27 amendements chez les voisins, AD-28 ordre de construction)
  - prospera-stories/epics-microfinance-imf-2026-11-13.md et prospera-stories/epics-assurance-2026-11-13.md (modèles exacts du découpage)
  - prospera-stories/epics-pdv-2026-08-15.md, epics-stock-2026-08-15.md, epics-catalogue-produits-2026-08-15.md, epics-reseau-2026-08-15.md, epics-paiement-2026-08-03.md, epics-notification-2026-08-04.md (modules de la partie 4, déjà découpés, non redécoupés ici)
  - prospera-stories/epics-reprise-connecteurs-2026-11-12.md et epics-moteur-installation-2026-11-11.md (Reprise, essai du prospect, socle de la plateforme)
  - prospera-stories/prds/prd-moteur-installation-2026-11-09/manifestes-a-produire.md (M03, M08 à M13, M19, M21 à M26, M28, M42)
  - prospera-stories/sprint-status.yaml (epic_id_high_water_mark EPIC-221, plage Dev B EPIC-142 → 299)
---

# Distributeur — Découpage en épics

*Amendée le 2026-11-13 : assistant-service passe à :3417 ; :3011 reste à prospera-microfinance-service (déjà codé)*

## Vue d'ensemble

Découpage du **PRD Distributeur** et de sa **spine** en **épics**, comme pour la microfinance, l'assurance, le stock, le moteur et Reprise/Connecteurs : les fiches de stories ne sont **pas** écrites ici, mais par celui qui code la story, juste avant de la coder. Chaque épic porte son **backend** et ses **écrans**, et sa fin se prouve de bout en bout sur le vrai backend, sans mock. **Tous les écrans sont faits par Dev B** (règle du programme) ; le backend est proposé à Dev A, sauf décision contraire du PO. Le client de février est nommé « le distributeur ».

**Identifiants.** **EPIC-222 → EPIC-244**, pris dans la plage de Dev B (`EPIC-142 → 299`) et inscrits au registre le jour du découpage (relevé du 2026-11-13 sur toutes les branches distantes : marque haute EPIC-221). **Aucun `story_id` n'est réservé** : chaque fiche prend le suivant de la plage de celui qui la code (`STORY-900 → 1199` pour Dev B, `STORY-730 → 899` pour Dev A). Les écrans prennent leur identifiant dans la série de la coque (`PRA-`).

**Modules déjà cadrés : renvoyés, pas redécoupés.** Les huit modules de la partie 4 du PRD (`reseau`, `pdv`, `catalogue`, `stock`, `paiement`, `notification`, `reprise`, `connecteurs`) ont leurs épics existants (EPIC-044 → 053, 085 → 094, 065 → 074, 075 → 084, 035 → 042, 054 → 064, 161 → 168, 170 → 179) ; ils construisent les modules, y compris leurs écrans. Ce découpage ne les refait pas : une exigence de la partie 4 que l'un de ces épics couvre déjà y est **renvoyée** (carte de couverture : « EPIC-0xx (existant) », 7 exigences) ; les **écarts** que le PRD du distributeur exige en plus (les 50 exigences de la partie 4, moins les 7 renvoyées) et les amendements d'AD-27 deviennent de nouveaux épics, **à la suite** des existants (aucune dépendance inverse n'est créée : chaque épic ci-dessous cite ceux dont il dépend, existants compris).

**Le chemin de la démo (★).** Les deux parcours n° 1 du PRD, à égalité (décision du PO) : **la facture juste** (UJ-1 : commande, stock réservé, bon de livraison, livraison confirmée, facture en un clic sur les quantités livrées, PDF, envoi par WhatsApp, encaissement) et **la tournée finie** (UJ-2 : plan de journée, « Y aller », commande, encaissement en espèces, clôture, hors connexion). Les épics ★ les construisent et les rendent démontrables avec le jeu de démonstration (le grossiste fictif « Grossiste du Golfe », jus et boissons) : le socle (EPIC-222), les rôles (EPIC-223), les séries sans perte et l'hébergement (EPIC-224), l'encours et la saga de réservation (EPIC-225), le jeu et l'essai (EPIC-226), les référentiels (EPIC-227), la commande (EPIC-228), l'entrepôt (EPIC-229), la facturation (EPIC-230), la Créance (EPIC-231), les encaissements et l'envoi (EPIC-232), le terrain et son application (EPIC-233, EPIC-234), le recouvrement (EPIC-235) et la reprise depuis Sage (EPIC-244). **Tout est du premier jour** pour le distributeur (février) : les **23 épics** font partie du périmètre. Le ★ ne délimite pas le périmètre : il marque le **chemin de la démo**, construit en premier, dans l'ordre d'AD-28 ; les épics sans ★ (freelance, approvisionnement, conquête, équipes et contrôle de gestion, croissance, comptabilité et finance, automatisations, tableau de bord) suivent dans l'ordre de construction. Ce que le PRD place en « bientôt » (sans date) reste « bientôt » : voir « Ce qui n'est pas dans ces épics ».

**Chemin critique.** EPIC-222 (socle) → EPIC-224 (séries sans perte, avant le premier numéro) → EPIC-231 (Créance et amendement de `paiement`, Dev A, avant `facturation`) → EPIC-227 (référentiels : `reseau`, `catalogue`, `pdv`, `stock`) et EPIC-225 (encours, saga de réservation), construits ensemble → EPIC-228 (commande) → EPIC-229 (entrepôt, livraison) → EPIC-230 (facturation) → EPIC-232 (envoi et encaissement). En parallèle dès le début : EPIC-223 (rôles), EPIC-224 (jeu de répliques, amendement du moteur) et l'amendement de `paiement` d'EPIC-231 (Dev A). La tournée suit la commande : EPIC-233 (serveur) → EPIC-234 (application, qui prouve le hors ligne) ; EPIC-235 (recouvrement) après EPIC-231 et EPIC-225 ; EPIC-244 (reprise) après EPIC-230 et EPIC-231 ; **EPIC-226 (jeu, essai, recette) se construit en même temps que les commandes publiques qu'il rejoue et clôt la tranche**. Ensuite : EPIC-236 (freelance), EPIC-237, EPIC-238, puis les épics de la partie 3 qui lisent des faits (EPIC-239 à EPIC-243).

**Points ouverts qui touchent le plan.** Q-2 (tranchée le 2026-11-13 : amendement de `paiement` écrit et validé par le PO, `amendement-2026-11-13-distributeur.md` : EPIC-231) ; Q-7 (tranchée le 2026-11-13 : `assistant-service` passe à `:3417`, `:3011` reste à `prospera-microfinance-service` : EPIC-242) ; l'amendement « profil d'instance hébergée » de la spine du moteur (jeu de répliques à trois membres, EPIC-224) ; l'essai d'une demi-journée du client d'API Dart sur un point de synchronisation à formes multiples (EPIC-234, AD-14, `[ASSUMPTION]`) ; actions du PO A-1 (mentions légales par l'expert-comptable, avant la recette de la facture, EPIC-230), A-2 (avis juridique sur la position GPS, avant la mise en service de `terrain`, EPIC-233), A-3 (taille du client, cibles de performance), A-4 (exports Sage, format du numéro de facture, EPIC-224 et EPIC-244), A-5 (gamme du jeu, EPIC-226). **Risque assumé R-1** : tout, sans ordre figé, face aux essais du 15/01 et au client de février ; la charge n'est pas chiffrée ici, la règle « bientôt » donne la marge.

## Requirements Inventory

### Functional Requirements

- **FR-1** : Chaque action est enregistrée côté serveur
- **FR-2** : Les boutons pas encore branchés sont « bientôt »
- **FR-3** : Les enchaînements entre rôles sont des étapes enregistrées
- **FR-4** : Quinze rôles, dont l'administrateur
- **FR-5** : Une seule table d'accès, appliquée par le serveur
- **FR-6** : Chacun voit son périmètre, appliqué par le serveur
- **FR-7** : Chaque rôle a sa vue, pas la vue du DG
- **FR-8** : Les données privées restent privées
- **FR-9** : Le Grossiste du Golfe
- **FR-10** : Trois tailles
- **FR-11** : Un jeu cohérent au centime
- **FR-12** : Le jeu dans l'essai du prospect
- **FR-13** : Des garde-fous paramétrables qui bloquent
- **FR-14** : Un modèle unique d'alerte et de décision
- **FR-15** : Tout indicateur se calcule depuis les données
- **FR-16** : Une prédiction dit d'où elle vient
- **FR-17** : De vrais documents
- **FR-18** : Exporter ses listes
- **FR-19** : Chaque module est installable seul
- **FR-20** : L'application terrain est livrée au prospect
- **FR-21** : Se connecter par rôle dans l'essai
- **FR-22** : Des positions qui permettent de clôturer une visite
- **FR-23** : Les envois de l'essai sont visibles
- **FR-24** : Les paiements de l'essai sont des paiements de test
- **FR-25** : Positions des agents et messages des clients
- **FR-30** : Créer une commande au bureau
- **FR-31** : Ligne de commande typée et prix figé
- **FR-32** : Vérifier le stock avant validation
- **FR-33** : Valider une commande avec contrôles
- **FR-34** : Réserver le stock à la validation
- **FR-35** : Modifier ou annuler une commande
- **FR-36** : Produire le bon de livraison
- **FR-37** : Commande terrain (« Nouvelle commande terrain »)
- **FR-38** : Commande WhatsApp
- **FR-39** : Prix société, prix freelance et marge
- **FR-40** : Suivre les commandes (pilotage) avec des chiffres réels
- **FR-41** : Livraison partielle et reliquat
- **FR-42** : Créer la facture depuis la commande, en un clic
- **FR-43** : Numérotation continue qui reprend la suite de Sage
- **FR-44** : Mentions légales sur chaque facture
- **FR-45** : Montants exacts
- **FR-46** : Imprimer et télécharger la facture en PDF
- **FR-47** : Envoyer la facture au client
- **FR-48** : Émettre un avoir
- **FR-49** : Facture, Créance et paiements partiels
- **FR-50** : Balance clients
- **FR-51** : Balance âgée
- **FR-52** : Encours, plafond de crédit et conditions de règlement par client
- **FR-53** : Marge par facture
- **FR-54** : Proforma
- **FR-55** : Probabilité d'acceptation et relance d'une proforma
- **FR-56** : Convertir une proforma en commande
- **FR-57** : E-facture (statuts, contrôles, « bientôt »)
- **FR-58** : Reprendre les factures impayées à la bascule
- **FR-59** : Registre des fournisseurs
- **FR-60** : Note du fournisseur (30 / 25 / 25 / 10 / 10)
- **FR-61** : Réapprovisionnement proposé automatiquement
- **FR-62** : Commande fournisseur, de SUGGEREE à RECUE
- **FR-63** : Plafonds de validation par montant
- **FR-64** : Plancher de trésorerie qui bloque
- **FR-65** : Fournisseur alternatif
- **FR-66** : Garde-fou anti-stock-mort à l'achat
- **FR-67** : Dette fournisseurs et échéancier
- **FR-68** : Préparer les commandes (picking)
- **FR-69** : Vagues et charge du jour
- **FR-70** : Charger les camions et valider le départ
- **FR-71** : Réception unique de marchandises (contrôle au quai)
- **FR-72** : Litiges de réception
- **FR-73** : Inventaire tournant par classe ABC
- **FR-74** : Un inventaire validé corrige le stock
- **FR-75** : Poste du magasinier et périmètre
- **FR-76** : Zones non couvertes et recensement
- **FR-77** : Carnet de prospects
- **FR-78** : Entonnoir et goulot
- **FR-79** : Garde-fous de la première commande et du carnet
- **FR-80** : Créer l'ouverture à la première commande livrée
- **FR-81** : Survie des ouvertures à M+1 et M+3
- **FR-82** : Valeur nette d'une ouverture
- **FR-83** : Passation (« Transférer ») au commercial du secteur
- **FR-84** : Objectifs par zone, par commercial et par point de vente
- **FR-85** : Atterrissage et projection de fin de mois
- **FR-86** : Mix produit, marge et distribution numérique
- **FR-87** : Calendrier des publications
- **FR-88** : Accroches proposées
- **FR-89** : Valider et programmer une publication
- **FR-90** : Boîte de réception unique
- **FR-91** : Répondre à un message
- **FR-92** : Créer un lead qui devient un prospect
- **FR-93** : Double tarification : la grille société est intouchable
- **FR-94** : Le prix du freelance n'est jamais visible de la société
- **FR-95** : Portefeuille isolé
- **FR-96** : Vente du freelance, servie par le stock de la société
- **FR-97** : Créances séparées et plafond de crédit séparé
- **FR-98** : Commissions et reversements
- **FR-99** : Classements séparés et activation de l'add-on
- **FR-100** : Plan de journée et tournée ordonnée
- **FR-101** : « Y aller » démarre la visite, pour de vrai
- **FR-102** : Clôturer une visite avec contrôle de présence
- **FR-103** : Commande depuis la visite
- **FR-104** : Encaisser en visite
- **FR-105** : Remise d'espèces et écart de caisse réels
- **FR-106** : Carte de l'équipe
- **FR-107** : Conversion visite → commande et indicateurs de tournée
- **FR-108** : Disponibilité des produits sans exposer les quantités
- **FR-109** : Application mobile hors connexion
- **FR-110** : Appareil perdu, session sûre
- **FR-111** : Une Créance, plusieurs Sources
- **FR-112** : Balance âgée unique
- **FR-113** : Dossier de recouvrement
- **FR-114** : Échelle d'escalade paramétrable
- **FR-115** : Une relance part vraiment
- **FR-116** : Enregistrer un paiement depuis le Dossier
- **FR-117** : Probabilité, prévision d'encaissement, provision
- **FR-118** : Promesse de paiement
- **FR-119** : Le blocage du crédit bloque la commande
- **FR-120** : La file du jour, priorisée par ce qu'elle rapporte
- **FR-121** : Planifier une visite de recouvrement
- **FR-122** : Les KPI de poste se calculent
- **FR-123** : Score sur 100 et statut
- **FR-124** : Classement, matrice des postes, périmètre
- **FR-125** : Coaching enregistré
- **FR-126** : Salariés, freelances et rémunération privée
- **FR-127** : Valider ou refuser une demande de remise
- **FR-128** : Barème de commission
- **FR-129** : Écritures de vente et provision générées
- **FR-130** : Écritures d'encaissement et d'achat générées
- **FR-131** : La balance soumise, et l'export qui vient après
- **FR-132** : Lettrage et suspens
- **FR-133** : Déclaration de TVA préparée, télédéclaration « bientôt »
- **FR-134** : Factures d'achat
- **FR-135** : Clôture de période
- **FR-136** : Remises de caisse et pièces manquantes
- **FR-137** : Trésorerie à 7 jours
- **FR-138** : BFR
- **FR-139** : Marge nette par canal
- **FR-140** : Décision de crédit client
- **FR-141** : Run fournisseurs et ordres de paiement
- **FR-142** : Créer et conduire une campagne
- **FR-143** : ROI et indicateurs de campagne calculés
- **FR-144** : Détecter un combo de stock
- **FR-145** : Valider un combo, au DG au-dessus du seuil
- **FR-146** : De la validation à la campagne
- **FR-147** : L'envoi part pour de vrai
- **FR-148** : Exclusions et plafond de messages
- **FR-149** : Relier les commandes aux campagnes
- **FR-150** : Budgets saisis et versionnés
- **FR-151** : Budget, réel, projection
- **FR-152** : Écarts avec cause et action proposée
- **FR-153** : Compte de résultat par axe
- **FR-154** : Prévision glissante sur 3 mois
- **FR-155** : Rapports au DG et au DAF
- **FR-156** : Périmètre du contrôle de gestion
- **FR-157** : La règle est un objet enregistré
- **FR-158** : Trois modes, et un mode AUTO qui reste sûr
- **FR-159** : Garde-fous transverses
- **FR-160** : File d'arbitrage : Valider, Reporter, Ignorer
- **FR-161** : L'exécution est réelle
- **FR-162** : Activer et désactiver une règle, pour de vrai
- **FR-163** : Le journal de la nuit
- **FR-164** : Un badge qui compte le travail réel
- **FR-165** : Un cockpit par rôle, relu des modules
- **FR-166** : Les 8 chiffres du DG
- **FR-167** : Alertes du jour
- **FR-168** : Décisions à trancher
- **FR-169** : Le rapport de direction
- **FR-170** : PDF et Envoyer, pour de vrai
- **FR-171** : Exports et courrier de gestion
- **FR-172** : Crédit du tiers
- **FR-173** : Générer le plan de journée
- **FR-174** : Alertes de tournée et exécution en magasin
- **FR-175** : Rapprochement d'un compte de trésorerie
- **FR-176** : Vue financière du DG et vue analytique
- **FR-177** : Le score de santé d'un point de vente, une règle de `dashboard`
- **FR-180** : Zones à plat et deux entrepôts comme jeu de départ
- **FR-181** : Le cadrage par zone vaut aussi en écriture
- **FR-182** : Le classement des commerciaux par couverture n'est pas calculé par `reseau`
- **FR-183** : Zones blanches : le signalement est `reseau`, la carte est `pdv`
- **FR-184** : Le score de santé ne s'affiche qu'avec sa provenance, et il a un producteur dès le premier jour
- **FR-185** : Le pipeline a six états dans la démo, cinq dans le PRD
- **FR-186** : « Vue DG » : le commercial et le freelance n'ont pas les écrans de pilotage
- **FR-187** : Plafond de crédit du client : le disponible à crédit est montré
- **FR-188** : Les conditions de règlement par client sont une exigence, pas un champ de texte
- **FR-189** : L'état « crédit bloqué » est une suspension du plafond, décidée par `recouvrement`, écrite par `pdv`
- **FR-190** : L'écran de création et de modification d'un point de vente est à créer
- **FR-191** : Les indicateurs commerciaux du point de vente ont chacun un module producteur
- **FR-192** : La carte est Google Maps (le front de démo est en Leaflet)
- **FR-193** : Le prix négocié d'un client est une grille dont la condition est « ce point de vente »
- **FR-194** : L'unité de base et le conditionnement manquent à la démo
- **FR-195** : `marge_freelance` et `montant_client` ne sont pas montrés à la société
- **FR-196** : La visibilité de la marge par rôle (société) manque au PRD catalogue
- **FR-197** : Le catalogue a ses propres écrans, il n'est plus un onglet du stock
- **FR-198** : Le coût de revient vient du stock, pas du catalogue
- **FR-199** : Le stock est une somme de mouvements, la démo tient un compteur
- **FR-200** : Lots, numéros de lot et dates limites : à créer
- **FR-201** : La valorisation du stock a une méthode, un exercice, une publication
- **FR-202** : Préparation, picking et camions vivent dans `entrepot` ; transferts et liquidation dans `stock`
- **FR-203** : La réservation du stock s'active avec `commande`, pas avant
- **FR-204** : Taux de service et ruptures sur trois mois : calcul hors `stock`
- **FR-205** : Deux adaptateurs de paiement, PI-SPI et FedaPay ; FR-P10 est à mettre à jour
- **FR-206** : Le vocabulaire « Mobile Money » est corrigé
- **FR-207** : L'écran du lien de paiement est à créer
- **FR-208** : Les frais d'encaissement sont une politique du créancier, à montrer
- **FR-209** : Le « fichier banque » du run DAF est remplacé par des ordres de paiement
- **FR-210** : Les modes et conditions de règlement d'une pièce sont séparés
- **FR-211** : Un client en défaut ou au crédit bloqué est exclu des campagnes ; la règle est de `marketing`
- **FR-212** : Le plafond de deux messages par client et par semaine est par destinataire
- **FR-213** : La file d'envoi hors réseau du terrain est dite
- **FR-214** : Les écrans de modèles, d'aperçu, de journal d'envoi et de consommation sont à créer
- **FR-215** : L'écran d'import en libre-service est entièrement à créer
- **FR-216** : Les objets de reprise du distributeur et leur module cible
- **FR-217** : La suite de numérotation des factures de Sage reprend sans trou ni doublon
- **FR-218** : Connecteurs est hors février ; l'export vers Sage vient après
- **FR-219** : Le logiciel quitté est Sage ; le document tarifaire est à corriger
- **FR-220** : Allocation du matin des commandes en attente de stock
- **FR-221** : Client comptoir générique par point de stock
- **FR-222** : Les huit chiffres de l'onglet Factures
- **FR-223** : Onglets et droits de la facturation
- **FR-224** : Facture émise par le freelance
- **FR-225** : Préparateurs et camions
- **FR-226** : Coût et ordre d'une tournée de livraison
- **FR-240** : Les alertes de la liste et de la fiche du point de vente ont une règle écrite
- **FR-241** : Un « client comptoir » générique par point de stock
- **FR-242** : Les attributs logistiques d'un article
- **FR-243** : Rentabilité et engouement d'un article ont une règle chiffrée
- **FR-244** : Le statut et la santé du stock se calculent
- **FR-245** : Les transferts entre points de stock et « Lancer la navette »
- **FR-246** : Le plan de liquidation et « Lancer le scénario »
- **FR-247** : La Créance est un registre unique tenu par `paiement`
- **FR-248** : L'argent reçu sans créance devient un crédit du tiers
- **FR-249** : La facture et la relance partent par WhatsApp dès février, avec repli SMS

### NonFunctional Requirements

Les exigences transverses du PRD (§8) sont **NFR-1 → NFR-10** ; elles ne sont pas numérotées FR et sont rattachées à l'épic qui les porte le mieux : NFR-1 (rien ne se perd) et NFR-3 (la numérotation ne ment pas) : EPIC-224 ; NFR-2 (l'argent est exact, TVA par taux, un arrondi) : EPIC-230 ; NFR-4 (sécurité) : EPIC-223 ; NFR-5 (traçabilité) : EPIC-222 ; NFR-6 (hors connexion) : EPIC-234 ; NFR-7 (performance : liste de 2 000 points de vente en moins de 2 s, facture en moins de 1 s, application en moins de 5 s) : EPIC-227, EPIC-230, EPIC-234 ; NFR-8 (français, « 35 000 F », jj/mm/aaaa) : EPIC-222 ; NFR-9 (hébergement chez Money Vibes, retour arrière 7 jours) : EPIC-224 ; NFR-10 (conservation 10 ans des factures et avoirs, purge GPS à 90 jours) : EPIC-230 et EPIC-223. Les valeurs par défaut sont celles du PRD ; les cibles de performance sont modifiables quand la taille du client sera connue (A-3).

### Additional Requirements (spine)

- **AD-1** : Un propriétaire par objet : le tableau des écrivains
- **AD-2** : Cinq services neufs, des hôtes ratifiés, aucun import croisé
- **AD-3** : La chaîne de vente : qui écrit quoi, dans quel état
- **AD-4** : Rejeu sans effet : une clé par geste, arbitrée par la base
- **AD-5** : Les séries de numérotation : un générateur, une série continue qui reprend Sage
- **AD-6** : La facture naît de la livraison, sur les quantités servies
- **AD-7** : La Créance : un registre, tenu par `paiement`, ouvert par des faits
- **AD-8** : Le stock : réserver par ligne de bon, sortir au départ du camion, le stock seul écrit
- **AD-9** : L'encours, le plafond, le blocage du crédit : qui calcule, qui bloque
- **AD-10** : Le freelance : vente pour le compte, deux prix, étanchéité par construction
- **AD-11** : Relevé de vente pour le compte, commission, compensation
- **AD-12** : Les garde-fous : des paramètres par organisation, figés à l'acte
- **AD-13** : Le terrain hors ligne : l'appareil propose, le serveur juge
- **AD-14** : Le client d'API généré, la version d'API, la distribution
- **AD-15** : Un noyau neutre de vertical : le vocabulaire est une donnée
- **AD-16** : Le recouvrement partagé : un service, la Créance lue, les décisions publiées
- **AD-17** : Les paiements : PI-SPI ET FedaPay, deux adaptateurs derrière un port
- **AD-18** : Les boutons « bientôt » : un état de la coque, pas un comportement du module
- **AD-19** : L'IA commune : `PropositionPort`, règle avant modèle, provenance toujours
- **AD-20** : Un seul catalogue de contrats nommés
- **AD-21** : La piste d'audit : par module, en ajout seul, chaînée
- **AD-22** : Montants, quantités, TVA, temps
- **AD-23** : Portée, droits et données privées : appliqués par le serveur, partout
- **AD-24** : La reprise depuis Sage : par fichiers, un objet par propriétaire, le contrôle chez la cible
- **AD-25** : La démonstration et l'essai : un grossiste fictif, un jeu à graine fixe, aucune sortie réelle
- **AD-26** : Exploitation : hébergé chez Money Vibes, ce qui diffère de l'IMF et de l'assurance
- **AD-27** : Ce que cette spine change chez ses voisins
- **AD-28** : La tranche de février et l'ordre de construction
- **AD-29** : Livraison et facturation par livraison
- **AD-30** : Aucune perte de numéro ni d'argent
- **AD-31** : Étanchéité du prix freelance : périmètre, topics distincts, ACL
- **AD-32** : Enveloppe d'exploitation hébergée
- **AD-33** : Lien public d'envoi de la facture
- **AD-34** : Saga de réservation : pas de transaction entre services

### UX Design Requirements

Il n'y a pas de contrat UX séparé : **le front de démo `prospera-font-end/prospera-distributeur` définit ce que l'on veut** (décision du PO du 2026-11-12), sauf décision postérieure et explicite (carte Google Maps, PI-SPI et FedaPay, Créance tenue par `paiement`). La démo n'a ni serveur ni base : chaque épic reprend les écrans de la démo qu'il touche, branchés ou « bientôt » (jamais simulés, FR-2), et crée les écrans qui manquent, **tous voulus** pour `reseau`, `pdv`, `catalogue` et `stock` (D-6). La règle de la maquette d'abord s'applique (`prototypes/prospera-prototype.html`).

### FR Coverage Map

- FR-1 → EPIC-222 — Chaque action est enregistrée côté serveur
- FR-2 → EPIC-222 — Les boutons pas encore branchés sont « bientôt »
- FR-3 → EPIC-222 — Les enchaînements entre rôles sont des étapes enregistrées
- FR-4 → EPIC-223 — Quinze rôles, dont l'administrateur
- FR-5 → EPIC-223 — Une seule table d'accès, appliquée par le serveur
- FR-6 → EPIC-223 — Chacun voit son périmètre, appliqué par le serveur
- FR-7 → EPIC-223 — Chaque rôle a sa vue, pas la vue du DG
- FR-8 → EPIC-223 — Les données privées restent privées
- FR-9 → EPIC-226 — Le Grossiste du Golfe
- FR-10 → EPIC-226 — Trois tailles
- FR-11 → EPIC-226 — Un jeu cohérent au centime
- FR-12 → EPIC-226 — Le jeu dans l'essai du prospect
- FR-13 → EPIC-225 — Des garde-fous paramétrables qui bloquent
- FR-14 → EPIC-243 — Un modèle unique d'alerte et de décision
- FR-15 → EPIC-243 — Tout indicateur se calcule depuis les données
- FR-16 → EPIC-243 — Une prédiction dit d'où elle vient
- FR-17 → EPIC-230 — De vrais documents
- FR-18 → EPIC-243 — Exporter ses listes
- FR-19 → EPIC-222 — Chaque module est installable seul
- FR-20 → EPIC-226 — L'application terrain est livrée au prospect
- FR-21 → EPIC-226 — Se connecter par rôle dans l'essai
- FR-22 → EPIC-226 — Des positions qui permettent de clôturer une visite
- FR-23 → EPIC-226 — Les envois de l'essai sont visibles
- FR-24 → EPIC-226 — Les paiements de l'essai sont des paiements de test
- FR-25 → EPIC-223 — Positions des agents et messages des clients
- FR-30 → EPIC-228 — Créer une commande au bureau
- FR-31 → EPIC-228 — Ligne de commande typée et prix figé
- FR-32 → EPIC-225 — Vérifier le stock avant validation
- FR-33 → EPIC-228 — Valider une commande avec contrôles
- FR-34 → EPIC-225 — Réserver le stock à la validation
- FR-35 → EPIC-228 — Modifier ou annuler une commande
- FR-36 → EPIC-228 — Produire le bon de livraison
- FR-37 → EPIC-228 — Commande terrain (« Nouvelle commande terrain »)
- FR-38 → EPIC-228 — Commande WhatsApp
- FR-39 → EPIC-228 — Prix société, prix freelance et marge
- FR-40 → EPIC-228 — Suivre les commandes (pilotage) avec des chiffres réels
- FR-41 → EPIC-228 — Livraison partielle et reliquat
- FR-42 → EPIC-230 — Créer la facture depuis la commande, en un clic
- FR-43 → EPIC-224 — Numérotation continue qui reprend la suite de Sage
- FR-44 → EPIC-230 — Mentions légales sur chaque facture
- FR-45 → EPIC-230 — Montants exacts
- FR-46 → EPIC-230 — Imprimer et télécharger la facture en PDF
- FR-47 → EPIC-230 — Envoyer la facture au client
- FR-48 → EPIC-230 — Émettre un avoir
- FR-49 → EPIC-231 — Facture, Créance et paiements partiels
- FR-50 → EPIC-231 — Balance clients
- FR-51 → EPIC-231 — Balance âgée
- FR-52 → EPIC-225 — Encours, plafond de crédit et conditions de règlement par client
- FR-53 → EPIC-230 — Marge par facture
- FR-54 → EPIC-230 — Proforma
- FR-55 → EPIC-230 — Probabilité d'acceptation et relance d'une proforma
- FR-56 → EPIC-230 — Convertir une proforma en commande
- FR-57 → EPIC-230 — E-facture (statuts, contrôles, « bientôt »)
- FR-58 → EPIC-244 — Reprendre les factures impayées à la bascule
- FR-59 → EPIC-237 — Registre des fournisseurs
- FR-60 → EPIC-237 — Note du fournisseur (30 / 25 / 25 / 10 / 10)
- FR-61 → EPIC-237 — Réapprovisionnement proposé automatiquement
- FR-62 → EPIC-237 — Commande fournisseur, de SUGGEREE à RECUE
- FR-63 → EPIC-237 — Plafonds de validation par montant
- FR-64 → EPIC-237 — Plancher de trésorerie qui bloque
- FR-65 → EPIC-237 — Fournisseur alternatif
- FR-66 → EPIC-237 — Garde-fou anti-stock-mort à l'achat
- FR-67 → EPIC-237 — Dette fournisseurs et échéancier
- FR-68 → EPIC-229 — Préparer les commandes (picking)
- FR-69 → EPIC-229 — Vagues et charge du jour
- FR-70 → EPIC-229 — Charger les camions et valider le départ
- FR-71 → EPIC-229 — Réception unique de marchandises (contrôle au quai)
- FR-72 → EPIC-229 — Litiges de réception
- FR-73 → EPIC-229 — Inventaire tournant par classe ABC
- FR-74 → EPIC-229 — Un inventaire validé corrige le stock
- FR-75 → EPIC-229 — Poste du magasinier et périmètre
- FR-76 → EPIC-238 — Zones non couvertes et recensement
- FR-77 → EPIC-238 — Carnet de prospects
- FR-78 → EPIC-238 — Entonnoir et goulot
- FR-79 → EPIC-238 — Garde-fous de la première commande et du carnet
- FR-80 → EPIC-238 — Créer l'ouverture à la première commande livrée
- FR-81 → EPIC-238 — Survie des ouvertures à M+1 et M+3
- FR-82 → EPIC-238 — Valeur nette d'une ouverture
- FR-83 → EPIC-238 — Passation (« Transférer ») au commercial du secteur
- FR-84 → EPIC-238 — Objectifs par zone, par commercial et par point de vente
- FR-85 → EPIC-238 — Atterrissage et projection de fin de mois
- FR-86 → EPIC-238 — Mix produit, marge et distribution numérique
- FR-87 → EPIC-240 — Calendrier des publications
- FR-88 → EPIC-240 — Accroches proposées
- FR-89 → EPIC-240 — Valider et programmer une publication
- FR-90 → EPIC-240 — Boîte de réception unique
- FR-91 → EPIC-240 — Répondre à un message
- FR-92 → EPIC-240 — Créer un lead qui devient un prospect
- FR-93 → EPIC-236 — Double tarification : la grille société est intouchable
- FR-94 → EPIC-236 — Le prix du freelance n'est jamais visible de la société
- FR-95 → EPIC-236 — Portefeuille isolé
- FR-96 → EPIC-236 — Vente du freelance, servie par le stock de la société
- FR-97 → EPIC-236 — Créances séparées et plafond de crédit séparé
- FR-98 → EPIC-236 — Commissions et reversements
- FR-99 → EPIC-236 — Classements séparés et activation de l'add-on
- FR-100 → EPIC-233 — Plan de journée et tournée ordonnée
- FR-101 → EPIC-233 — « Y aller » démarre la visite, pour de vrai
- FR-102 → EPIC-233 — Clôturer une visite avec contrôle de présence
- FR-103 → EPIC-233 — Commande depuis la visite
- FR-104 → EPIC-233 — Encaisser en visite
- FR-105 → EPIC-233 — Remise d'espèces et écart de caisse réels
- FR-106 → EPIC-233 — Carte de l'équipe
- FR-107 → EPIC-233 — Conversion visite → commande et indicateurs de tournée
- FR-108 → EPIC-233 — Disponibilité des produits sans exposer les quantités
- FR-109 → EPIC-234 — Application mobile hors connexion
- FR-110 → EPIC-234 — Appareil perdu, session sûre
- FR-111 → EPIC-231 — Une Créance, plusieurs Sources
- FR-112 → EPIC-231 — Balance âgée unique
- FR-113 → EPIC-235 — Dossier de recouvrement
- FR-114 → EPIC-235 — Échelle d'escalade paramétrable
- FR-115 → EPIC-235 — Une relance part vraiment
- FR-116 → EPIC-235 — Enregistrer un paiement depuis le Dossier
- FR-117 → EPIC-235 — Probabilité, prévision d'encaissement, provision
- FR-118 → EPIC-235 — Promesse de paiement
- FR-119 → EPIC-235 — Le blocage du crédit bloque la commande
- FR-120 → EPIC-235 — La file du jour, priorisée par ce qu'elle rapporte
- FR-121 → EPIC-235 — Planifier une visite de recouvrement
- FR-122 → EPIC-239 — Les KPI de poste se calculent
- FR-123 → EPIC-239 — Score sur 100 et statut
- FR-124 → EPIC-239 — Classement, matrice des postes, périmètre
- FR-125 → EPIC-239 — Coaching enregistré
- FR-126 → EPIC-239 — Salariés, freelances et rémunération privée
- FR-127 → EPIC-239 — Valider ou refuser une demande de remise
- FR-128 → EPIC-239 — Barème de commission
- FR-129 → EPIC-241 — Écritures de vente et provision générées
- FR-130 → EPIC-241 — Écritures d'encaissement et d'achat générées
- FR-131 → EPIC-241 — La balance soumise, et l'export qui vient après
- FR-132 → EPIC-241 — Lettrage et suspens
- FR-133 → EPIC-241 — Déclaration de TVA préparée, télédéclaration « bientôt »
- FR-134 → EPIC-241 — Factures d'achat
- FR-135 → EPIC-241 — Clôture de période
- FR-136 → EPIC-241 — Remises de caisse et pièces manquantes
- FR-137 → EPIC-241 — Trésorerie à 7 jours
- FR-138 → EPIC-241 — BFR
- FR-139 → EPIC-241 — Marge nette par canal
- FR-140 → EPIC-241 — Décision de crédit client
- FR-141 → EPIC-241 — Run fournisseurs et ordres de paiement
- FR-142 → EPIC-240 — Créer et conduire une campagne
- FR-143 → EPIC-240 — ROI et indicateurs de campagne calculés
- FR-144 → EPIC-240 — Détecter un combo de stock
- FR-145 → EPIC-240 — Valider un combo, au DG au-dessus du seuil
- FR-146 → EPIC-240 — De la validation à la campagne
- FR-147 → EPIC-240 — L'envoi part pour de vrai
- FR-148 → EPIC-240 — Exclusions et plafond de messages
- FR-149 → EPIC-240 — Relier les commandes aux campagnes
- FR-150 → EPIC-239 — Budgets saisis et versionnés
- FR-151 → EPIC-239 — Budget, réel, projection
- FR-152 → EPIC-239 — Écarts avec cause et action proposée
- FR-153 → EPIC-239 — Compte de résultat par axe
- FR-154 → EPIC-239 — Prévision glissante sur 3 mois
- FR-155 → EPIC-239 — Rapports au DG et au DAF
- FR-156 → EPIC-239 — Périmètre du contrôle de gestion
- FR-157 → EPIC-242 — La règle est un objet enregistré
- FR-158 → EPIC-242 — Trois modes, et un mode AUTO qui reste sûr
- FR-159 → EPIC-242 — Garde-fous transverses
- FR-160 → EPIC-242 — File d'arbitrage : Valider, Reporter, Ignorer
- FR-161 → EPIC-242 — L'exécution est réelle
- FR-162 → EPIC-242 — Activer et désactiver une règle, pour de vrai
- FR-163 → EPIC-242 — Le journal de la nuit
- FR-164 → EPIC-242 — Un badge qui compte le travail réel
- FR-165 → EPIC-243 — Un cockpit par rôle, relu des modules
- FR-166 → EPIC-243 — Les 8 chiffres du DG
- FR-167 → EPIC-243 — Alertes du jour
- FR-168 → EPIC-243 — Décisions à trancher
- FR-169 → EPIC-243 — Le rapport de direction
- FR-170 → EPIC-243 — PDF et Envoyer, pour de vrai
- FR-171 → EPIC-243 — Exports et courrier de gestion
- FR-172 → EPIC-231 — Crédit du tiers
- FR-173 → EPIC-233 — Générer le plan de journée
- FR-174 → EPIC-233 — Alertes de tournée et exécution en magasin
- FR-175 → EPIC-241 — Rapprochement d'un compte de trésorerie
- FR-176 → EPIC-241 — Vue financière du DG et vue analytique
- FR-177 → EPIC-243 — Le score de santé d'un point de vente, une règle de `dashboard`
- FR-180 → EPIC-227 — Zones à plat et deux entrepôts comme jeu de départ
- FR-181 → EPIC-049 (existant) — Le cadrage par zone vaut aussi en écriture
- FR-182 → EPIC-052 (existant) — Le classement des commerciaux par couverture n'est pas calculé par `reseau`
- FR-183 → EPIC-052 (existant) — Zones blanches : le signalement est `reseau`, la carte est `pdv`
- FR-184 → EPIC-243 — Le score de santé ne s'affiche qu'avec sa provenance, et il a un producteur dès le premier jour
- FR-185 → EPIC-227 — Le pipeline a six états dans la démo, cinq dans le PRD
- FR-186 → EPIC-227 — « Vue DG » : le commercial et le freelance n'ont pas les écrans de pilotage
- FR-187 → EPIC-225 — Plafond de crédit du client : le disponible à crédit est montré
- FR-188 → EPIC-225 — Les conditions de règlement par client sont une exigence, pas un champ de texte
- FR-189 → EPIC-225 — L'état « crédit bloqué » est une suspension du plafond, décidée par `recouvrement`, écrite par `pdv`
- FR-190 → EPIC-227 — L'écran de création et de modification d'un point de vente est à créer
- FR-191 → EPIC-227 — Les indicateurs commerciaux du point de vente ont chacun un module producteur
- FR-192 → EPIC-227 — La carte est Google Maps (le front de démo est en Leaflet)
- FR-193 → EPIC-227 — Le prix négocié d'un client est une grille dont la condition est « ce point de vente »
- FR-194 → EPIC-227 — L'unité de base et le conditionnement manquent à la démo
- FR-195 → EPIC-227 — `marge_freelance` et `montant_client` ne sont pas montrés à la société
- FR-196 → EPIC-227 — La visibilité de la marge par rôle (société) manque au PRD catalogue
- FR-197 → EPIC-227 — Le catalogue a ses propres écrans, il n'est plus un onglet du stock
- FR-198 → EPIC-243 — Le coût de revient vient du stock, pas du catalogue
- FR-199 → EPIC-077 (existant) — Le stock est une somme de mouvements, la démo tient un compteur
- FR-200 → EPIC-079 (existant) — Lots, numéros de lot et dates limites : à créer
- FR-201 → EPIC-080 (existant) — La valorisation du stock a une méthode, un exercice, une publication
- FR-202 → EPIC-227 — Préparation, picking et camions vivent dans `entrepot` ; transferts et liquidation dans `stock`
- FR-203 → EPIC-225 — La réservation du stock s'active avec `commande`, pas avant
- FR-204 → EPIC-243 — Taux de service et ruptures sur trois mois : calcul hors `stock`
- FR-205 → EPIC-232 — Deux adaptateurs de paiement, PI-SPI et FedaPay ; FR-P10 est à mettre à jour
- FR-206 → EPIC-232 — Le vocabulaire « Mobile Money » est corrigé
- FR-207 → EPIC-232 — L'écran du lien de paiement est à créer
- FR-208 → EPIC-232 — Les frais d'encaissement sont une politique du créancier, à montrer
- FR-209 → EPIC-232 — Le « fichier banque » du run DAF est remplacé par des ordres de paiement
- FR-210 → EPIC-231 — Les modes et conditions de règlement d'une pièce sont séparés
- FR-211 → EPIC-240 — Un client en défaut ou au crédit bloqué est exclu des campagnes ; la règle est de `marketing`
- FR-212 → EPIC-232 — Le plafond de deux messages par client et par semaine est par destinataire
- FR-213 → EPIC-234 — La file d'envoi hors réseau du terrain est dite
- FR-214 → EPIC-232 — Les écrans de modèles, d'aperçu, de journal d'envoi et de consommation sont à créer
- FR-215 → EPIC-168 (existant) — L'écran d'import en libre-service est entièrement à créer
- FR-216 → EPIC-244 — Les objets de reprise du distributeur et leur module cible
- FR-217 → EPIC-224 — La suite de numérotation des factures de Sage reprend sans trou ni doublon
- FR-218 → EPIC-222 — Connecteurs est hors février ; l'export vers Sage vient après
- FR-219 → EPIC-244 — Le logiciel quitté est Sage ; le document tarifaire est à corriger
- FR-220 → EPIC-228 — Allocation du matin des commandes en attente de stock
- FR-221 → EPIC-228 — Client comptoir générique par point de stock
- FR-222 → EPIC-230 — Les huit chiffres de l'onglet Factures
- FR-223 → EPIC-230 — Onglets et droits de la facturation
- FR-224 → EPIC-236 — Facture émise par le freelance
- FR-225 → EPIC-229 — Préparateurs et camions
- FR-226 → EPIC-229 — Coût et ordre d'une tournée de livraison
- FR-240 → EPIC-227 — Les alertes de la liste et de la fiche du point de vente ont une règle écrite
- FR-241 → EPIC-227 — Un « client comptoir » générique par point de stock
- FR-242 → EPIC-227 — Les attributs logistiques d'un article
- FR-243 → EPIC-243 — Rentabilité et engouement d'un article ont une règle chiffrée
- FR-244 → EPIC-227 — Le statut et la santé du stock se calculent
- FR-245 → EPIC-227 — Les transferts entre points de stock et « Lancer la navette »
- FR-246 → EPIC-227 — Le plan de liquidation et « Lancer le scénario »
- FR-247 → EPIC-231 — La Créance est un registre unique tenu par `paiement`
- FR-248 → EPIC-231 — L'argent reçu sans créance devient un crédit du tiers
- FR-249 → EPIC-232 — La facture et la relance partent par WhatsApp dès février, avec repli SMS

## Epic List

| Épic | Titre | ★ | FR | Dépend de |
|---|---|---|---|---|
| EPIC-222 | Le socle technique : cinq services neufs, bibliothèques de la plateforme et règles d'écran | ★ | 5 | aucun (premier chantier : précède tout code neuf des cinq services) ; EPIC-155 (existant : Node 24, client Kafka Confluent et Karapace, fini le 04/12) ; EPIC-142 et EPIC-145 (existants : contrat d'état publié et garde de la coque) |
| EPIC-223 | Les rôles, les périmètres, les droits et les données privées | ★ | 6 | EPIC-222 ; EPIC-049 et EPIC-050 (existants : portée d'accès publiée en état absolu) ; EPIC-145 (existant : garde de la coque) |
| EPIC-224 | Les séries sans perte, le jeu de répliques et l'exploitation hébergée | ★ | 2 | EPIC-222 ; EPIC-155 (existant : socle Node 24 et MongoDB 8.0) ; amendement « profil d'instance hébergée » de la spine du moteur (Dev A) avant EPIC-230 |
| EPIC-225 | Les garde-fous, l'encours, le plafond de crédit et la saga de réservation | ★ | 8 | EPIC-222, EPIC-224 (série `BL-`) ; EPIC-077 et EPIC-078 (existants : mouvements et solde de `stock`) ; EPIC-086 et EPIC-093 (existants : point de vente, plafond porté) |
| EPIC-226 | Le jeu « Grossiste du Golfe », l'essai du prospect et la recette des deux parcours | ★ | 9 | EPIC-228, EPIC-230, EPIC-233 et EPIC-234 (les commandes publiques à rejouer ; le générateur s'écrit en même temps qu'elles) ; EPIC-147 et EPIC-160 (existants : essai du prospect et jeu de démonstration par verticale) ; EPIC-146 (existant : deux espaces) |
| EPIC-227 | Les référentiels : réseau, points de vente, catalogue et stock, les écarts du distributeur | ★ | 18 | EPIC-222 ; EPIC-044, EPIC-085, EPIC-065 et EPIC-075 (existants : les quatre socles) ; EPIC-045, EPIC-086, EPIC-066, EPIC-067, EPIC-068 et EPIC-070 (existants : zones, point de vente, article, conditionnements, grilles, résolution du prix) ; EPIC-083 (existant : transferts et seuils) ; EPIC-225 (plafond et suspension) |
| EPIC-228 | La commande : saisie, validation, bon de livraison et prise de commande sur le terrain | ★ | 12 | EPIC-225 (garde-fous, encours, saga) ; EPIC-224 (`BL-`) ; EPIC-227 (grille « ce client », client comptoir) ; EPIC-070 (existant : résolution du prix par ligne et par panier) ; EPIC-077 (existant : mouvements) |
| EPIC-229 | L'entrepôt : préparer, charger, livrer, recevoir et inventorier | ★ | 10 | EPIC-228 ; EPIC-227 (attributs logistiques) ; EPIC-077 et EPIC-078 (existants : mouvements et solde) ; EPIC-082 (existant : inventaire et échelle de validation) |
| EPIC-230 | La facturation : la facture juste, l'avoir, la proforma et le lien public | ★ | 14 | EPIC-224 (séries sans perte, avant le premier numéro) ; EPIC-228 et EPIC-229 (bon livré) ; EPIC-231 (Créance et crédit du tiers) ; action A-1 (mentions légales) avant la recette de la facture |
| EPIC-231 | La Créance, le crédit du tiers et l'amendement de `paiement` | ★ | 9 | EPIC-222 ; EPIC-035 et EPIC-037 (existants : socle de `paiement`, Créance, demande, lien public et encaissement) ; EPIC-155 (existant : client Kafka) ; l'amendement précède EPIC-230 ; EPIC-224 (compteurs) |
| EPIC-232 | Encaisser et prévenir : PI-SPI et FedaPay, lien de paiement, ordres de paiement et WhatsApp | ★ | 8 | EPIC-231 ; EPIC-036, EPIC-037 et EPIC-038 (existants : fournisseurs interchangeables, lien public, paiement hors Prospera) ; EPIC-054, EPIC-055, EPIC-056, EPIC-061 et EPIC-063 (existants : socle de `notification`, modèles, premier message, envoi de masse, passerelles) ; EPIC-230 (la facture à envoyer) |
| EPIC-233 | Le terrain : plan de journée, visite, commande, encaissement et remise d'espèces | ★ | 11 | EPIC-222, EPIC-223 ; EPIC-228 (commande depuis la visite) ; EPIC-231 (encaissement d'espèces) ; EPIC-049 et EPIC-050 (existants : portée) ; EPIC-086 (existant : point de vente) ; l'application EPIC-234 la prouve sur appareil |
| EPIC-234 | L'application mobile `prospera-terrain` : Flutter, hors ligne, appareil perdu | ★ | 3 | EPIC-233 (les routes de synchronisation), EPIC-228 (route des commandes), EPIC-229 (confirmation de livraison), EPIC-232 (accusé de `notification`) ; EPIC-222 (contrats OpenAPI) |
| EPIC-235 | Le recouvrement : dossier, escalade, relance, promesse et blocage du crédit | ★ | 9 | EPIC-231 (Créance, crédit du tiers, promesses migrées) ; EPIC-225 (blocage, encours) ; EPIC-232 (relance WhatsApp) ; EPIC-233 (visite de recouvrement) ; EPIC-038 (existant : promesses de paiement, code à migrer) ; EPIC-054 et EPIC-063 (existants : `notification`) |
| EPIC-236 | Le réseau freelance : vente pour le compte, deux prix et étanchéité par construction |  | 8 | EPIC-230, EPIC-231 ; EPIC-228 (le prix société, la livraison) ; EPIC-071 et EPIC-087 (existants : double tarification et étanchéité entre indépendants) ; EPIC-223 (données privées) |
| EPIC-237 | L'approvisionnement et les fournisseurs |  | 9 | EPIC-229 (réception), EPIC-232 (ordres de paiement), EPIC-227 (catalogue, attributs) ; EPIC-083 (existant : seuils et couverture de `stock`) |
| EPIC-238 | La conquête, les territoires, les objectifs et les quotas |  | 11 | EPIC-233 ; EPIC-227 (réseau, points de vente) ; EPIC-052 (existant : zones blanches) ; EPIC-092 (existant : carte) |
| EPIC-239 | Les équipes, la performance et le contrôle de gestion |  | 14 | EPIC-230, EPIC-231, EPIC-233 (les faits qu'ils lisent) ; EPIC-223 (données privées) ; EPIC-236 (commission freelance) |
| EPIC-240 | La croissance : marketing, campagnes et studio réseaux sociaux |  | 15 | EPIC-232 (`notification`) ; EPIC-235 (exclusions des clients en défaut) ; EPIC-238 (prospect) ; EPIC-227 (listes de points de vente) ; EPIC-061 (existant : envoi de masse) |
| EPIC-241 | La comptabilité et la finance : encaissements, trésorerie, BFR et décisions de crédit |  | 15 | EPIC-230, EPIC-231, EPIC-232 (ordres), EPIC-237 (dette fournisseurs) ; EPIC-235 (décision de crédit) |
| EPIC-242 | Les automatisations |  | 8 | EPIC-222, EPIC-225 (garde-fous) ; EPIC-237 (réappro), EPIC-235 (relances), EPIC-240 (campagnes) pour les règles qu'il exécute ; EPIC-095 et suivants (existants : `assistant-service`) |
| EPIC-243 | Le tableau de bord, les indicateurs et la provenance des règles « IA » |  | 16 | EPIC-230, EPIC-231, EPIC-228, EPIC-229 (faits lus) ; EPIC-227 (score et attributs) ; EPIC-235 (alertes de créance) |
| EPIC-244 | La reprise depuis Sage : fichiers, contrôle chez la cible et bascule | ★ | 3 | EPIC-224 (suite de numérotation), EPIC-227, EPIC-230, EPIC-231 (les cibles) ; EPIC-161 à EPIC-165 et EPIC-167 (existants : kit des cibles, adaptateurs, lot de la Reprise, points d'import, comptage d'ouverture) ; actions A-4 (exports Sage) et A-3 (taille du client) |

Total : 23 épics, 223 exigences portées, 7 exigences renvoyées à des épics existants, 230 exigences couvertes (230).

**Exigences renvoyées à un épic existant** (la carte de couverture ci-dessus les liste aussi) :

| FR | Épic existant | Ce qu'il couvre |
|---|---|---|
| FR-181 | EPIC-049 | portée d'accès en lecture et en écriture, dans `reseau` (EPIC-049 et EPIC-050 : le superviseur lit sa région, ne modifie que sa zone) ; écran et jeu de test du superviseur dans EPIC-223 |
| FR-182 | EPIC-052 | `reseau` compte la couverture et ne classe rien ; le taux de couverture par commercial est publié par `terrain` (EPIC-233) |
| FR-183 | EPIC-052 | liste des zones blanches de `reseau` ; la carte est dessinée par `pdv` (EPIC-092 existant, fond Google Maps par EPIC-227) |
| FR-199 | EPIC-077 | stock = somme de mouvements append-only (EPIC-077 et EPIC-078) ; aucun écran ne modifie un solde, condition de recette reprise dans EPIC-229 |
| FR-200 | EPIC-079 | lots, numéros de lot, dates limites et règle « date limite la plus proche d'abord » (suivi par lot activable article par article) |
| FR-201 | EPIC-080 | valorisation CUMP par défaut, méthode figée par exercice et publiée (EPIC-080 et EPIC-081) ; l'écran porte la méthode et l'exercice |
| FR-215 | EPIC-168 | écran d'import en libre-service de la Reprise (EPIC-163, EPIC-164, EPIC-168) ; les gabarits Sage et les points d'import des modules du distributeur sont dans EPIC-244 |

### EPIC-222 : Le socle technique : cinq services neufs, bibliothèques de la plateforme et règles d'écran ★

Les cinq services neufs sur la pile du moteur (`prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`, `prospera-pilotage-service`, `prospera-croissance-service`, ports de développement proposés 3412 → 3416), chacun avec ses modules Nest `src/modules/<code>/`, sa gate par module, son manifeste et sa route `sante` ; `automatisations` reste porté par `assistant-service`. Chaque action est enregistrée côté serveur (FR-1) et chaque enchaînement entre rôles est une étape enregistrée, jamais un geste implicite (FR-3). Les boutons pas encore branchés sont un état de la coque, `BRANCHE` ou `BIENTOT`, déclaré par action dans le descripteur d'écran, sans date et sans appel serveur ; un test parcourt chaque écran et échoue sur un bouton ni branché ni « bientôt » (FR-2, FR-218 : « Intégration Odoo », « Export Sage », « Télédéclarer sur le portail OTR » affichent « bientôt », `domainesEchange: []` en février). Chaque module s'installe seul (FR-19). Tâches techniques imposées par la spine : Node 24, NestJS 11 et Mongoose 8 (lignes de maintenance), client Kafka Confluent, Karapace en BACKWARD, BullMQ 6 pour les services neufs ; bibliothèques privées de `prospera-plateforme` (`champs-sensibles` héritée de la microfinance, `vocabulaires/`, contrats OpenAPI du terrain, catalogue de contrats nommés d'AD-20, rien d'autre ne circule sur le bus) ; piste d'audit par module, en ajout seul et chaînée, dix ans (AD-21) ; règles de montants, quantités, TVA et temps (AD-22) ; test de lint « un module n'importe jamais un autre module » ; coques de modules d'écran `prospera-app/src/modules/<code>/` sans donnée ni règle métier.

**FRs covered:** FR-1 → FR-3, FR-19, FR-218

- **Spine :** AD-1, AD-2, AD-15, AD-18, AD-20, AD-21, AD-22 ; Stack ; moteur AD-24, AD-27 ; coque AD-3, AD-11, AD-16
- **Dépôts :** `prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`, `prospera-pilotage-service`, `prospera-croissance-service` (squelettes), `assistant-service` (module `automatisations`, squelette), `prospera-plateforme` (`champs-sensibles`, `vocabulaires/`, `contrats/`, OpenAPI), `prospera-app` (coques de modules d'écran)
- **Dépend de :** aucun (premier chantier : précède tout code neuf des cinq services) ; EPIC-155 (existant : Node 24, client Kafka Confluent et Karapace, fini le 04/12) ; EPIC-142 et EPIC-145 (existants : contrat d'état publié et garde de la coque)
- **Fini quand :** Les cinq services démarrent par `docker compose up` sur la pile du moteur et leur route `sante` répond ; un module qui importe un voisin fait échouer le lint ; un bouton ni `BRANCHE` ni `BIENTOT` fait échouer le test de parcours, et l'inventaire des boutons (écran, libellé, état) se génère des descripteurs (SM-2 : 0 bouton simulé) ; un bouton `BIENTOT` n'émet aucun appel serveur ; un fait absent du catalogue d'AD-20 ne passe pas la CI ; toute action métier laisse une ligne de piste d'audit chaînée et une modification du journal est détectée ; chaque module du distributeur s'installe puis se désinstalle seul sans toucher les collections d'un voisin.

### EPIC-223 : Les rôles, les périmètres, les droits et les données privées ★

Quinze rôles dont l'administrateur, une seule table d'accès (annexe B du PRD) appliquée par le serveur et jamais par l'écran, un périmètre par rôle, une vue par rôle (pas la vue du DG pour tous). Les données privées restent privées : rémunération des salariés et des freelances, prix pratiqué par un freelance chez ses détaillants (la preuve de fuite se rejoue avec EPIC-236), lecture de la marge selon le droit. Les positions des agents et les messages des clients : information à l'embauche, positions conservées 90 jours glissants puis purgées, conservation et consentement des messages WhatsApp alignés sur le PRD notification (D-14, D-19). Le format de droits d'`auth-service` est celui du moteur ; un rôle composé ne sert qu'à donner des droits, jamais à en calculer côté écran.

**FRs covered:** FR-4 → FR-8, FR-25

- **Spine :** AD-1, AD-21, AD-23 ; moteur AD-16 (portées) ; coque AD-3, AD-6
- **Dépôts :** `auth-service` (droits et rôles du distributeur), `reseau-service` (portée publiée, lue par les cinq services), les cinq services neufs (garde par module, portée par route), `prospera-app` (écrans par droit, `<Ecriture>`)
- **Dépend de :** EPIC-222 ; EPIC-049 et EPIC-050 (existants : portée d'accès publiée en état absolu) ; EPIC-145 (existant : garde de la coque)
- **Fini quand :** SM-6 passe sur le vrai backend : une suite essaie chaque rôle contre chaque écran et chaque route, zéro donnée hors périmètre rendue, une portée vide est vide ; la matrice de l'annexe B se rejoue droit par droit (un test par droit, `ROLE_NON_AUTORISE` nommé) ; un superviseur ne voit que ses commerciaux ; un commercial et un freelance n'ont pas les écrans de pilotage ; une position vieille de 91 jours n'existe plus ; la consultation d'une donnée privée est tracée.

### EPIC-224 : Les séries sans perte, le jeu de répliques et l'exploitation hébergée ★

La bibliothèque `series` de `prospera-plateforme` : un générateur, une série par organisation continue d'année en année (`FAC-`, `AV-`, `PRO-`, `BL-`, `RVC-`, largeur et préfixe en paramètres de série), qui reprend le dernier numéro de Sage ; la suite reprise par `facturation.suite-numerotation@1` ne laisse ni trou ni doublon (FR-43, FR-217). Hébergé chez Money Vibes, les séries, factures, avoirs, bons, encaissements et compteurs s'écrivent en écriture majoritaire synchrone sur un jeu de répliques MongoDB à trois membres porteurs de données, sur au moins deux machines ou supports distincts (Q-9 tranchée) : RPO 0 pour eux, un numéro ou un PDF n'est remis qu'après l'acquittement de l'écriture. Après une restauration, un compteur reprend au maximum connu (réplique, tête de série ancrée par l'agent, topic `serie.changed@1` conservé sans expiration, numéros portés par les Créances) ; un numéro n'est jamais réémis, un trou éventuel est déclaré et documenté, jamais comblé ; rapprochement avec le relevé du fournisseur de paiement après toute restauration. Tâche imposée : l'amendement « profil d'instance hébergée » de la spine du moteur (jeu de répliques à trois membres, coffre de clés par organisation, successeur de Redis), écrit par Dev A avant l'épic de `facturation`. Enveloppe d'exploitation hébergée : disponibilité 99,5 % sur les heures ouvrées, RTO 4 h, clés des champs sensibles dans un coffre par organisation, bris de glace tracé et visible du client, alertes propres (consommateur bloqué, retard de l'outbox, dérive d'une série), pas de licence ni de gel J+30, version de plateforme unique avec annonce 7 jours avant, `AVEC_PERTE` interdite.

**FRs covered:** FR-43, FR-217

- **Spine :** AD-5, AD-26, AD-30, AD-32, Q-9 ; moteur AD-15, AD-19, AD-20, AD-38, AD-40
- **Dépôts :** `prospera-plateforme` (bibliothèque `series`), `prospera-ventes-service`, `paiement-service` (compteurs et encaissements en écriture majoritaire), `agent-instance` et plateforme Money Vibes (jeu de répliques, coffre de clés, ancrage des têtes de série), spine du moteur (amendement)
- **Dépend de :** EPIC-222 ; EPIC-155 (existant : socle Node 24 et MongoDB 8.0) ; amendement « profil d'instance hébergée » de la spine du moteur (Dev A) avant EPIC-230
- **Fini quand :** 50 émissions simultanées donnent 50 numéros consécutifs ; un bon annulé garde son numéro ; la première facture après la reprise porte le numéro suivant celui de Sage ; une restauration complète est jouée : chaque compteur reprend au maximum connu, aucun numéro n'est réémis, le trou éventuel est déclaré ; l'arrêt d'un membre du jeu de répliques ne perd aucun numéro ni aucun encaissement confirmé ; une dérive de série lève une alerte ; un accès du support aux données d'un client passe par le bris de glace et se voit chez le client.

### EPIC-225 : Les garde-fous, l'encours, le plafond de crédit et la saga de réservation ★

Les garde-fous paramétrables qui bloquent, paramètres par organisation figés à l'acte (AD-12). La bibliothèque d'encours de `prospera-plateforme` (AD-9) : une seule règle de calcul de l'encours, lue par `commande`, `pdv` et `recouvrement`, sur le même résultat pour la même entrée ; plafond, disponible à crédit (plafond − encours) à la fiche et à la saisie de commande ; condition de règlement par défaut par client, choisie dans un référentiel versionné ; dérogation au plafond par droit propre `commande:plafond:deroger` (D-21), qui ne lève jamais un crédit bloqué ; le crédit bloqué est une suspension du plafond : `recouvrement` décide et publie `recouvrement.credit.bloque@1`, `pdv` seul propriétaire du plafond l'applique. La saga de réservation (AD-34) : `commande` écrit en une transaction locale la commande, ses bons `EN_ATTENTE_RESERVATION` et l'engagement du tiers, puis appelle `stock` pour chaque ligne de bon ; sur réponse, le bon passe `EMIS` (numéro `BL-`) ; un échec laisse le bon en attente avec son motif, sans compensation à écrire ; `stock` libère toute réservation sans bon vivant après un délai (paramètre de `stock`). La réservation est active dès que `commande` est installé, sinon le « réservé » est `NON_INSTALLE` ; la disponibilité du commercial (disponible, limité, rupture) se calcule sur le disponible (FR-203). Amendements d'AD-27 portés ici : API de réservation par ligne de bon, libération du non servi et fait `stock.reservation.changed@1` dans la spine et le manifeste de `stock` ; `commande.engagement-tiers.changed@1`.

**FRs covered:** FR-13, FR-32, FR-34, FR-52, FR-187 → FR-189, FR-203

- **Spine :** AD-3, AD-8, AD-9, AD-12, AD-34 ; AD-27 (stock, commande, pdv)
- **Dépôts :** `prospera-plateforme` (bibliothèque `encours`), `prospera-ventes-service` (module `commande`, saga), `stock-service` (API de réservation, libération, fait de réservation), `pdv-service` (plafond, suspension, conditions de règlement), `prospera-recouvrement-service` (décision de blocage), `prospera-app`
- **Dépend de :** EPIC-222, EPIC-224 (série `BL-`) ; EPIC-077 et EPIC-078 (existants : mouvements et solde de `stock`) ; EPIC-086 et EPIC-093 (existants : point de vente, plafond porté)
- **Fini quand :** Deux validations simultanées sur le dernier stock : une seule passe, l'autre reçoit `STOCK_INSUFFISANT` ; un crash entre la réservation et la bascule du bon ne laisse aucune réservation orpheline (libérée après le délai) ; 100 réservés, 70 sortis, 30 annulés laissent un stock juste ; sans `stock`, la validation est refusée `STOCK_NON_INSTALLE` ; plafond 1 000 000 avec 600 000 + 600 000 et une facture entre les deux : la seconde commande est refusée `PLAFOND_CREDIT_DEPASSE` ; même entrée, même encours dans `commande`, `pdv` et `recouvrement` ; une dérogation vaut pour une commande, avec motif, tracée, et ne change pas le plafond ; un crédit bloqué refuse la commande `CREDIT_BLOQUE` même sous le plafond.

### EPIC-226 : Le jeu « Grossiste du Golfe », l'essai du prospect et la recette des deux parcours ★

Le jeu de démonstration d'un grossiste fictif de jus et boissons (Lomé Port et dépôt Kara, trois zones, douze commerciaux dont trois freelances, environ 600 points de vente, XOF, TVA 18 %), en trois tailles, produit par un générateur à graine fixe (`prospera-plateforme/jeu-grossiste`) qui passe par les commandes publiques de chaque module, jamais par une écriture directe en base, cohérent au centime (chaque total se retrouve dans la pièce qui le porte). Il se charge dans l'essai du prospect (FR-12) : l'application terrain est livrée au prospect par un lien d'installation (FR-20), il se connecte rôle par rôle, la connexion « en tant que » un compte du jeu n'existant que dans l'essai (FR-21), les positions qui permettent de clôturer une visite sont simulées et marquées (FR-22), chaque envoi est intercepté, compté et visible du prospect, avec des messages vers un numéro déclaré seulement (FR-23), et tout paiement est un paiement de test portant la mention « test » (FR-24). Ce chantier porte aussi la recette : les parcours UJ-1, UJ-2 et UJ-8 scriptés et rejoués sur chaque essai avec le journal de leurs étapes (SM-1), jouée au fur et à mesure que les épics ★ la rendent possible. Rien de l'essai ne passe au réel, sauf par la reprise ou le dossier d'installation.

**FRs covered:** FR-9 → FR-12, FR-20 → FR-24

- **Spine :** AD-17 (essai), AD-25 ; AD-14 (distribution) ; moteur AD-15, C13
- **Dépôts :** `prospera-plateforme` (`jeu-grossiste`), `agent-instance` (drapeaux d'essai, remise à zéro), `notification-service` (interception et journal d'envoi), `paiement-service` (mode test), `prospera-terrain` (lien d'installation), `prospera-app`
- **Dépend de :** EPIC-228, EPIC-230, EPIC-233 et EPIC-234 (les commandes publiques à rejouer ; le générateur s'écrit en même temps qu'elles) ; EPIC-147 et EPIC-160 (existants : essai du prospect et jeu de démonstration par verticale) ; EPIC-146 (existant : deux espaces)
- **Fini quand :** Un prospect joue UJ-1 et UJ-2 de bout en bout, seul, sur le vrai serveur, dans son essai, cinq essais simultanés ; le jeu se regénère à l'identique (même graine, mêmes totaux au centime) pour chaque taille ; recharger la page ne perd rien ; un message ou un paiement d'essai ne sort jamais vers un tiers réel et le journal d'envoi le montre ; la connexion « en tant que » est refusée dans l'espace réel ; une visite simulée ne se mélange pas aux positions réelles ; la facture sort juste (SM-3) et la visite clôturée hors connexion apparaît chez le superviseur en moins d'une minute après le retour du réseau (SM-4).

### EPIC-227 : Les référentiels : réseau, points de vente, catalogue et stock, les écarts du distributeur ★

Les épics existants de `reseau`, `pdv`, `catalogue` et `stock` construisent les modules ; celui-ci porte ce que le distributeur exige en plus, et les amendements de leurs PRD (prérequis des modules ★, PRD §12.2). **Réseau et points de vente** : le gabarit d'installation à zones à plat et deux entrepôts rattachés à une zone, sans le mot « agence » ni « secteur » à l'écran (vocabulaire en donnée) ; le pipeline à sept états (ceux de la démo plus `perdu`) ; trois vues de la fiche choisies par le droit, jamais par un nom de rôle ; l'écran de création et de modification (doublon par téléphone puis proximité, fermeture avec motif) ; chaque indicateur de la fiche rattaché à son module producteur ; la carte Google Maps comme fond unique de tout le produit ; les alertes de liste et de fiche, règles écrites paramétrables ; le « client comptoir » générique par point de stock (comptant, sans crédit). **Catalogue** : la grille « ce client » (condition : ce point de vente) qui porte les prix propres à chaque client ; unité de base et conditionnements bouteille, pack, palette d'un même article ; `marge_freelance` et `montant_client` jamais montrés à la société ; droit `catalogue:marge:consulter` distinct ; module d'écran propre au catalogue ; attributs logistiques (poids, volume, colis par palette, `fragile`, `froid`). **Stock** : préparation, picking et camions placés dans `entrepot`, transferts et liquidation dans `stock` ; transferts et « Lancer la navette » qui écrivent de vrais mouvements ; statut et santé du stock calculés par article et par point de stock ; plan de liquidation et « Lancer le scénario » qui créent de vrais objets. Tous les écrans de ces quatre modules sont voulus (D-6).

**FRs covered:** FR-180, FR-185, FR-186, FR-190 → FR-197, FR-202, FR-240 → FR-242, FR-244 → FR-246

- **Spine :** AD-1, AD-3, AD-8, AD-10, AD-15, AD-18, AD-27, AD-28 ; spines de `reseau`, `pdv`, `catalogue`, `stock`
- **Dépôts :** `reseau-service`, `pdv-service`, `catalogue-produits-service`, `stock-service`, `prospera-plateforme` (`vocabulaires/`), `prospera-app` (modules d'écran `reseau`, `pdv`, `catalogue`, `stock`)
- **Dépend de :** EPIC-222 ; EPIC-044, EPIC-085, EPIC-065 et EPIC-075 (existants : les quatre socles) ; EPIC-045, EPIC-086, EPIC-066, EPIC-067, EPIC-068 et EPIC-070 (existants : zones, point de vente, article, conditionnements, grilles, résolution du prix) ; EPIC-083 (existant : transferts et seuils) ; EPIC-225 (plafond et suspension)
- **Fini quand :** Sur le jeu « Grossiste du Golfe », la reprise produit des zones sans nœud intermédiaire et Lomé Port et Kara apparaissent rattachés à une zone ; un prix négocié par un client est résolu pour ce seul point de vente et le journal de résolution le dit ; 20 cartons et 10 packs d'un même article se convertissent sans perte ; le DG ne voit jamais le prix d'un freelance (test de réponse de lecture) ; un transfert Lomé Port vers Kara déplace vraiment le stock et « Lancer le scénario » crée sa promotion ou son transfert ; un point de vente se crée sans doublon et s'affiche sur Google Maps ; une liste de 2 000 points de vente s'affiche en moins de 2 s (NFR-7) ; la liste des boutons de ces écrans ne contient que du `BRANCHE` ou du `BIENTOT`.

### EPIC-228 : La commande : saisie, validation, bon de livraison et prise de commande sur le terrain ★

Le module `commande` : commande au bureau, ligne typée et prix figé à la validation (version de grille conservée), validation avec les contrôles du garde-fou (stock, plafond, crédit bloqué), modification et annulation tracées, bon de livraison par point de stock (un bon `EMIS` quitte l'entrepôt, le terrain l'appelle « bon de commande »), commande prise sur le terrain (`TRANSMISE`, écart `PRIX_CHANGE` si la grille a bougé, refus `COMMANDE_PROBABLEMENT_DOUBLE` pour deux commandes identiques d'une même visite), commande reçue par WhatsApp, prix société, prix freelance et marge, suivi des commandes avec des chiffres réels, livraison partielle et reliquat (une nouvelle livraison du même bon), allocation du matin des commandes en attente de stock (06:00 par défaut, par priorité), client comptoir pour la vente au comptoir. La commande publie `commande.engagement-tiers.changed@1`, `.commande.chiffree@1`, `.derogation.accordee@1`, `.serie.changed@1` et `commande.bon-livraison.livre@1` (quantités de cette livraison, jamais cumulées) ; manifeste de `commande` amendé (AD-27 : service porteur `prospera-ventes-service`, validation sans `stock` refusée).

**FRs covered:** FR-30, FR-31, FR-33, FR-35 → FR-41, FR-220, FR-221

- **Spine :** AD-3, AD-4, AD-9, AD-12, AD-13, AD-29, AD-34 ; AD-27
- **Dépôts :** `prospera-ventes-service` (module `commande`), `catalogue-produits-service` (résolution du prix), `pdv-service`, `stock-service`, `prospera-app`
- **Dépend de :** EPIC-225 (garde-fous, encours, saga) ; EPIC-224 (`BL-`) ; EPIC-227 (grille « ce client », client comptoir) ; EPIC-070 (existant : résolution du prix par ligne et par panier) ; EPIC-077 (existant : mouvements)
- **Fini quand :** UJ-1 jusqu'au bon : saisir 20 cartons de jus d'orange 1 L et 10 packs de cola 33 cl pour une boutique d'Adidogomé, le stock de Lomé Port est vérifié et réservé, la validation émet un `BL-` ; une commande jouée deux fois avec la même clé n'a aucun effet de plus ; une commande terrain `TRANSMISE` dont la grille a changé reste en attente avec `PRIX_CHANGE` jusqu'à confirmation ; le reliquat livré plus tard est une seconde livraison du même bon ; l'allocation du matin ne touche que les commandes en attente de stock ; la vente au comptoir passe par le client comptoir du point de stock.

### EPIC-229 : L'entrepôt : préparer, charger, livrer, recevoir et inventorier ★

Le module `entrepot`, hébergé par `prospera-ventes-service` (jamais dans `stock-service` : le stock est le seul écrivain de ses mouvements, l'entrepôt les demande par l'API). Préparer les commandes (picking), vagues et charge du jour, préparateurs et camions, chargement des camions (poids et volume des attributs logistiques, palettes) et validation du départ qui sort le stock, coût et ordre d'une tournée de livraison ; confirmation de livraison unique par `livraisonId` (`<bonId>:<n°>`), identique pour l'appareil et le bureau, un second geste aux mêmes quantités est un no-op, à des quantités différentes un écart `A_ARBITRER` ; réception unique de marchandises au quai avec litige de réception (le fait `entrepot.reception.enregistree@1` est consommé par `approvisionnement`, D-22) ; inventaire tournant par classe ABC dont la validation corrige le stock par un mouvement ; poste du magasinier et périmètre. Les retours entrent en stock par une demande de `entrepot` seul, référencée à la facture ou à l'avoir. Le parcours ★ est la préparation, le départ et la livraison confirmée.

**FRs covered:** FR-68 → FR-75, FR-225, FR-226

- **Spine :** AD-2, AD-3, AD-8, AD-29 ; AD-27 (manifeste `entrepot`)
- **Dépôts :** `prospera-ventes-service` (module `entrepot`), `stock-service` (API de mouvements), `prospera-app`
- **Dépend de :** EPIC-228 ; EPIC-227 (attributs logistiques) ; EPIC-077 et EPIC-078 (existants : mouvements et solde) ; EPIC-082 (existant : inventaire et échelle de validation)
- **Fini quand :** UJ-1 jusqu'à la livraison : le départ du camion sort le stock une seule fois, la confirmation de livraison par l'appareil puis une confirmation du bureau donnent une seule livraison, `commande.bon-livraison.livre@1` porte les quantités de cette livraison ; une réception de 6 % d'écart ouvre un litige et le stock est corrigé de ce qui est réellement arrivé (UJ-6) ; un inventaire validé corrige par mouvement, aucun écran ne modifie un solde ; un magasinier ne voit que son point de stock.

### EPIC-230 : La facturation : la facture juste, l'avoir, la proforma et le lien public ★

Le module `facturation` : la facture naît de la livraison, sur les quantités servies de cette livraison, en un clic (AD-6, AD-29) ; chaque ligne de bon tient sa quantité facturée, facturer au-delà du servi est refusé `QUANTITE_DEJA_FACTUREE` ; la clé d'idempotence de la facture est le `livraisonId` ; une facture à lignes libres est `SANS_BON`, sans effet sur le stock. Mentions légales (liste de travail jusqu'à la validation de l'expert-comptable du client, A-1), montants exacts (TVA par taux sur le total HT, un seul arrondi par taux, taux du paquet fiscal), PDF déterministe rendu côté serveur avec polices embarquées et empreinte conservée, avoir qui ne dépasse jamais la facture et fait naître un crédit du tiers s'il porte sur une facture payée, marge par facture, proforma avec probabilité d'acceptation (règle avec provenance) et relance, conversion proforma en commande, e-facture OTR : statuts et contrôles affichés, télédéclaration « bientôt ». Le lien public d'envoi est signé (jeton opaque de 128 bits stocké haché), sert un seul document, expire à 7 jours, révocable, sans compte, servi par `facturation` seule derrière la passerelle publique, avec limitation de débit et trace de chaque ouverture (AD-33). Les huit chiffres de l'onglet Factures et les droits par onglet. La facturation ne tient aucun solde : le reste dû vient de `paiement`. Publie `facturation.serie.changed@1` et les faits de facture et d'avoir ; manifeste amendé (AD-27).

**FRs covered:** FR-17, FR-42, FR-44 → FR-48, FR-53 → FR-57, FR-222, FR-223

- **Spine :** AD-5, AD-6, AD-7, AD-29, AD-30, AD-33 ; AD-27 (manifeste `facturation`)
- **Dépôts :** `prospera-ventes-service` (module `facturation`), `paiement-service` (faits lus, Créance), `notification-service` (envoi), `prospera-plateforme` (`series`), `prospera-app`
- **Dépend de :** EPIC-224 (séries sans perte, avant le premier numéro) ; EPIC-228 et EPIC-229 (bon livré) ; EPIC-231 (Créance et crédit du tiers) ; action A-1 (mentions légales) avant la recette de la facture
- **Fini quand :** UJ-1 de bout en bout : 20 cartons et 10 packs livrés, facture en un clic sur les quantités livrées, numéro `FAC-` continu, PDF identique si régénéré, TVA 18 % au franc près (SM-3 : zéro trou, zéro doublon) ; livraison partielle puis reliquat donnent deux factures sans excès ; la facture 507 400 payée en 200 000 puis 307 400 affiche 307 400 sans que `facturation` tienne de solde (test de schéma) ; un avoir supérieur à la facture est refusé `AVOIR_SUPERIEUR_A_LA_FACTURE` ; un lien public expire à 7 jours, se révoque, ne s'énumère pas (test) et chaque ouverture est tracée ; une facture se crée en moins de 1 s (NFR-7).

### EPIC-231 : La Créance, le crédit du tiers et l'amendement de `paiement` ★

`paiement-service` tient seul la Créance (D-1) : un registre unique ouvert par sa source (`FACTURE` pour le distributeur, `RELEVE_VENTE_COMPTE` pour le freelance ; `ECHEANCE_DE_PRET` et `PRIME` réservées aux autres verticales), clé `(source, sourceId)`, un tiers, un périmètre, des composantes (principal seul pour le distributeur), soldée par les encaissements, lue par `facturation`, `recouvrement` et les tableaux. La balance clients et la balance âgée à cinq tranches paramétrables sortent de la même requête sur `paiement.creance@1` ; l'argent reçu sans créance devient un crédit du tiers (acompte, trop-perçu, avoir sur facture payée), imputé sur la créance désignée puis sur l'échue la plus ancienne, remboursable par un ordre ; le mode d'encaissement (`LIEN`, `ESPECES`, `VIREMENT`, `CHEQUE`) est séparé de la condition de règlement, qui appartient à `pdv` et `facturation`. Tâches imposées par la spine (amendement d'AD-27, Dev A l'écrit, Q-2) : amendement du PRD et du manifeste de `paiement` (source `RELEVE_VENTE_COMPTE`, topics freelance distincts, échéance `echeanceLe`, `montantExigible`, `montantDeclare`, `perimetre`, `livraisonId` dans `paiement.creance.changed@1`, imputation rangée avec l'encaissement, encaissement d'espèces avec remise de caisse, consommateurs qui lisent les deux graphies d'organisation du code, module `points-de-vente` documenté « affiche de paiement ») ; migration du module `promesses` codé de `paiement` vers `recouvrement` (`paiement` ne garde que le constat), livrée avec EPIC-235 ; migration du Dockerfile de `paiement` de `node:20-slim` vers Node 24 et de `kafkajs` vers le client Confluent.

**FRs covered:** FR-49 → FR-51, FR-111, FR-112, FR-172, FR-210, FR-247, FR-248

- **Spine :** AD-3, AD-7, AD-9, AD-30, AD-31, AD-27 ; spine de `paiement` AD-1 à AD-17
- **Dépôts :** `paiement-service` (existant : Créance, crédit du tiers, ledger, topics, Dockerfile, client Kafka), `prospera-ventes-service` (lecture), `pdv-service` (consomme `paiement.creance.changed@1` et `paiement.credit-tiers.changed@1`), `prospera-plateforme` (contrats), `prospera-app` (registre des créances et crédits du tiers, balances)
- **Dépend de :** EPIC-222 ; EPIC-035 et EPIC-037 (existants : socle de `paiement`, Créance, demande, lien public et encaissement) ; EPIC-155 (existant : client Kafka) ; l'amendement précède EPIC-230 ; EPIC-224 (compteurs)
- **Fini quand :** Une facture de 507 400 émise ouvre en moins de 5 secondes une Créance de 507 400 ; 200 000 encaissés la ramènent à 307 400 et la facture, le dossier de recouvrement et la balance âgée affichent 307 400 ; un paiement par lien de 520 000 sur 507 400 solde la créance et crée un crédit du tiers de 12 600, imputé sur la facture suivante ; un acompte avant toute facture est un crédit du tiers ; un encaissement déclaré au-dessus du reste dû est refusé `PAIEMENT_SUPERIEUR_AU_RESTE_DU` ; `paiement` ne contient aucun champ de condition de crédit (test de schéma) ; rejeu d'un encaissement = même imputation ; une créance de périmètre freelance n'apparaît dans aucune balance de la société ; le service démarre sous Node 24 avec le client Confluent et ses suites existantes restent vertes.

### EPIC-232 : Encaisser et prévenir : PI-SPI et FedaPay, lien de paiement, ordres de paiement et WhatsApp ★

Les moyens de paiement sont PI-SPI (adaptateur `API_BUSINESS`) ET FedaPay (adaptateur `fedapay`), plus espèces et virement déclarés, tous derrière le port `PaymentProvider` ; le routage par pays, devise et méthode est de `paiement`, désactiver l'un laisse l'autre actif sans déploiement, aucun module du distributeur n'appelle un fournisseur ; PRD `paiement` amendé (FR-P10 : deux fournisseurs en service) et code `pi-spi` du catalogue déprécié. Écrans à créer : « Encaissements » et « Paiement mobile » (jamais « module PI-SPI », jamais MTN MoMo ni Orange Money pour une organisation togolaise), lien de paiement émis depuis une facture ou un dossier (30 jours, 90 au plus, révocable, page publique légère), frais d'encaissement comme politique du créancier figée à l'émission (le montant imputé est le montant dû), ordres de paiement aux fournisseurs préparés et validés par deux droits et deux personnes, « en attente de raccordement » tant que le fournisseur n'est pas raccordé, « Générer le fichier banque » en « bientôt ». Côté `notification` : la facture et la relance partent par WhatsApp dès février (modèles approuvés avant la mise en service, hors fenêtre de 24 heures seul un modèle approuvé part), repli SMS puis e-mail ; plafond de messages par destinataire et par période, sur la nature « campagne » seulement ; écrans de modèles, aperçu avant envoi, journal d'envoi et consommation. Migration de `notification-service` vers le client Kafka Confluent. Le Mobile Money sortant n'est pas dans cet épic.

**FRs covered:** FR-205 → FR-209, FR-212, FR-214, FR-249

- **Spine :** AD-17, AD-33 ; AD-27 (PRD `paiement`) ; spine de `paiement` AD-5, AD-6 ; spine de `notification`
- **Dépôts :** `paiement-service` (adaptateurs, liens, frais, ordres), `notification-service` (modèles, repli, plafond par destinataire, client Kafka), `prospera-app` (modules d'écran `paiement` et `notification`)
- **Dépend de :** EPIC-231 ; EPIC-036, EPIC-037 et EPIC-038 (existants : fournisseurs interchangeables, lien public, paiement hors Prospera) ; EPIC-054, EPIC-055, EPIC-056, EPIC-061 et EPIC-063 (existants : socle de `notification`, modèles, premier message, envoi de masse, passerelles) ; EPIC-230 (la facture à envoyer)
- **Fini quand :** Le routage d'une demande de 50 000 FCFA vers un payeur togolais retourne le fournisseur choisi par la configuration et le journal le nomme ; désactiver FedaPay laisse PI-SPI actif ; depuis une facture de 120 000 FCFA, « Envoyer un lien » crée la demande, la transmet par `notification`, et le paiement en bac à sable réduit le solde sans action humaine ; un lien expiré ou révoqué n'encaisse plus ; préparer et valider un ordre sont deux droits et deux personnes, un ordre rejeté est terminal ; la facture part par WhatsApp avec le modèle approuvé et, si WhatsApp échoue, par SMS ; dans l'essai, aucun lien, message ni ordre réel ne part ; aucun libellé « module PI-SPI » ni opérateur étranger ne figure à l'écran (balayage).

### EPIC-233 : Le terrain : plan de journée, visite, commande, encaissement et remise d'espèces ★

Le module `terrain` de `prospera-terrain-service`, partagé avec la microfinance (vocabulaire en donnée, un seul binaire pour toutes les verticales) : plan de journée et tournée ordonnée, généré (FR-173), « Y aller » qui démarre la visite pour de vrai, clôture avec contrôle de présence (200 m ; hors rayon la clôture reste possible, avec motif), commande depuis la visite, encaissement en visite (espèces ou lien de paiement), remise d'espèces et écart de caisse réel calculé toujours sur les encaissements déclarés de la tournée (« remise non saisie » plutôt que 0), carte de l'équipe (Google Maps), conversion visite vers commande et indicateurs de tournée, disponibilité des produits sans exposer les quantités (disponible, limité, rupture), alertes de tournée et exécution en magasin. Chaque service reçoit ses éléments par sa propre route : commandes vers `commande`, confirmations de livraison vers `entrepot`, encaissements d'espèces vers `collecte` si installé sinon `paiement`, visites, remises et positions vers `terrain` ; positions conservées 90 jours puis purgées ; `politiqueAppareilPerdu` devient un réglage de verticale (amendement de la spine de la microfinance AD-19) ; manifeste `terrain` amendé (service porteur fixé). `terrain` publie le taux de couverture par commercial (source `reseau.zone` et `pdv.point-de-vente`), le classement n'étant jamais de `reseau`.

**FRs covered:** FR-100 → FR-108, FR-173, FR-174

- **Spine :** AD-1, AD-13, AD-15, AD-23 ; AD-27 (terrain) ; spine de la microfinance AD-19
- **Dépôts :** `prospera-terrain-service` (module `terrain`), `prospera-ventes-service` (commande, entrepôt), `paiement-service` (encaissement d'espèces, remise de caisse), `stock-service` (disponibilité), `reseau-service`, `prospera-app` (écrans web du superviseur)
- **Dépend de :** EPIC-222, EPIC-223 ; EPIC-228 (commande depuis la visite) ; EPIC-231 (encaissement d'espèces) ; EPIC-049 et EPIC-050 (existants : portée) ; EPIC-086 (existant : point de vente) ; l'application EPIC-234 la prouve sur appareil
- **Fini quand :** UJ-3 sur le vrai backend : le superviseur voit la tournée telle qu'elle s'est passée, visites faites, commandes prises, espèces déclarées, écart de caisse réel entre déclaré et remis, clôtures hors rayon avec leur motif, et seulement ses commerciaux ; une visite clôturée deux fois n'en compte qu'une ; un encaissement dont la clé existe renvoie l'existant ; la disponibilité n'expose aucune quantité ; une position de 91 jours est purgée ; le déclarant d'un encaissement ne le confirme pas ; un rapprochement de remise valide les encaissements chez `paiement` sans changer l'écart.

### EPIC-234 : L'application mobile `prospera-terrain` : Flutter, hors ligne, appareil perdu ★

L'application unique `prospera-terrain` en Flutter (décision D4 du PO), même binaire pour toutes les verticales : la table des routes de synchronisation, l'ordre d'envoi, la politique d'appareil perdu et les objets optionnels sont une donnée de la verticale chargée à l'ouverture de session ; aucune règle métier dans l'application. Une base locale chiffrée (consultation du plan, des tiers, du catalogue et des états de disponibilité) et une file d'envoi persistante : visites clôturées, commandes, encaissements, confirmations de livraison, remises, relevés de stock ; chaque élément porte son identifiant, sa clé d'idempotence, son parent et son état local (`A_ENVOYER`, `ENVOYE`, `CONFIRME`, `REFUSE` avec le motif du serveur) ; un seul ordre d'envoi, `PARENT_INCONNU` réessayable puis `REFUSE` après N jours ; l'heure de l'appareil n'est qu'une trace. Appareil perdu : jeton révoqué, application verrouillée, `TRANSMETTRE_PUIS_EFFACER` (au contact suivant l'application transmet d'abord sa file, puis efface sa base). La file d'envoi hors réseau des messages (une proforma WhatsApp mise en file) est dans l'application : un message n'est jamais présenté « envoyé » avant l'accusé de `notification`. Tâches techniques imposées par la spine (AD-14) : Flutter 3.50 et Dart 3.14 épinglés à la première story, drift 2.35.4, chiffrement SQLite3MultipleCiphers avec la clé dans le stockage sécurisé, client d'API généré depuis l'OpenAPI publié par OpenAPI Generator `dart-dio` + `built_value` (essai d'une demi-journée sur un point de synchronisation à formes multiples `oneOf` avant la première story ; plan B `swagger_parser`), routes de synchronisation `/api/v1/` additives (`/api/v2/` servi en parallèle pendant la fenêtre de retour arrière de 7 jours), en-tête `X-Client-Version` et `CLIENT_TROP_ANCIEN` qui conserve la file ; distribution Android seule par lien d'installation, mise à jour par le même lien, sans boutique.

**FRs covered:** FR-109, FR-110, FR-213

- **Spine :** AD-13, AD-14, AD-15, AD-4 ; Stack ; spine de la microfinance AD-18, AD-19
- **Dépôts :** `prospera-terrain` (nouveau dépôt Flutter), `prospera-plateforme/contrats/openapi`, `prospera-terrain-service`, `prospera-ventes-service`, `paiement-service`, `notification-service`
- **Dépend de :** EPIC-233 (les routes de synchronisation), EPIC-228 (route des commandes), EPIC-229 (confirmation de livraison), EPIC-232 (accusé de `notification`) ; EPIC-222 (contrats OpenAPI)
- **Fini quand :** Une journée en 3G coupée, 5 visites, 2 commandes et 3 encaissements : tout arrive une fois, dans l'ordre, sans doublon d'encaissement (SM-4, NFR-6) ; l'application démarre en moins de 5 s sur un Android à 2 Go ; un appareil perdu avec 3 encaissements non transmis les transmet puis efface sa base, et le superviseur en est averti ; un client plus ancien que le minimum reçoit `CLIENT_TROP_ANCIEN` et garde sa file intacte ; si le client Dart généré diffère du contrat, le build échoue ; la mise à jour passe par le même lien ; une proforma mise en file hors réseau n'est « envoyée » qu'à l'accusé.

### EPIC-235 : Le recouvrement : dossier, escalade, relance, promesse et blocage du crédit ★

Le module `recouvrement` de `prospera-recouvrement-service`, partagé avec la microfinance (le dossier est par tiers pour le distributeur, par prêt pour l'IMF ; le vocabulaire est une donnée) : un dossier de recouvrement par tiers, échelle d'escalade unique et paramétrable, une relance qui part vraiment (WhatsApp, repli SMS, par `notification`), l'enregistrement d'un paiement depuis le dossier (par `paiement`), probabilité de recouvrement, prévision d'encaissement et provision (règles avec provenance), promesse de paiement, file du jour priorisée par ce qu'elle rapporte, planification d'une visite de recouvrement (par `terrain`). Seuils par défaut : rappel à J+1, alerte à la direction à J+30, blocage automatique du crédit au-delà de 60 jours de créance échue ou d'un encours au-dessus du plafond, jamais de déblocage automatique, seul le DAF lève. Le blocage est une décision publiée (`recouvrement.credit.bloque@1`) que `commande` et `pdv` appliquent. Tâches imposées (AD-27) : manifeste `recouvrement` amendé (`enrichiPar` + `commande` pour `engagement-tiers.changed@1` et `derogation.accordee@1`, promesses, service porteur fixé) ; migration du module `promesses` codé de `paiement` vers `recouvrement` (EPIC-231 livre l'amendement de `paiement`) ; route d'encaissement `collecte` ou `paiement` selon la verticale.

**FRs covered:** FR-113 → FR-121

- **Spine :** AD-7, AD-9, AD-15, AD-16, AD-23 ; AD-27 (recouvrement, paiement)
- **Dépôts :** `prospera-recouvrement-service` (nouveau, module `recouvrement`), `paiement-service` (retrait du module `promesses`), `prospera-ventes-service` (applique le blocage), `pdv-service` (suspension du plafond), `notification-service`, `prospera-terrain-service` (visite de recouvrement), `prospera-app`
- **Dépend de :** EPIC-231 (Créance, crédit du tiers, promesses migrées) ; EPIC-225 (blocage, encours) ; EPIC-232 (relance WhatsApp) ; EPIC-233 (visite de recouvrement) ; EPIC-038 (existant : promesses de paiement, code à migrer) ; EPIC-054 et EPIC-063 (existants : `notification`)
- **Fini quand :** UJ-4 de bout en bout : la file du jour s'ouvre triée par ce qu'elle rapporte, une relance WhatsApp part et une promesse au 20 s'enregistre ; une créance échue depuis plus de 60 jours bloque le crédit automatiquement, la commande suivante est refusée `CREDIT_BLOQUE`, seul le DAF peut débloquer ; le dossier, la balance âgée et la facture affichent le même reste dû ; une promesse non tenue relance l'escalade ; l'ancien module `promesses` de `paiement` ne répond plus ; la même installation sert un dossier par prêt chez l'IMF sans branche de code.

### EPIC-236 : Le réseau freelance : vente pour le compte, deux prix et étanchéité par construction

L'add-on `freelance`, hébergé par `pdv-service` derrière sa propre gate `FREELANCE_NOT_ENTITLED` et ses collections `freelance_*` (exception ratifiée, D-24). Le freelance vend pour le compte de la société (stock à la société jusqu'à la livraison), facture son détaillant à son prix, doit le prix société à la société même si son détaillant ne paie pas, et reçoit une commission calculée sur le prix société ; sa marge de négociation est à lui et invisible de la société. Double tarification (la grille société est intouchable, `GRILLE_SOCIETE_NON_MODIFIABLE`), portefeuille isolé, créances et plafond de crédit séparés, relevé de vente pour le compte (`RVC-`), commission et compensation sur décision du DAF, classements séparés, activation de l'add-on. Tâches imposées par la spine (AD-31) : champ `perimetre` (`SOCIETE` ou `FREELANCE:<id>`) obligatoire sur la Créance, le crédit du tiers et l'encaissement ; topics distincts `facturation.facture-freelance.emise@1`, `avoir-freelance.emis@1`, `serie-freelance.changed@1`, `paiement.creance-freelance.changed@1`, `paiement.encaissement-freelance.changed@1` ; ACL Kafka par service déclarées dans les manifestes et vérifiées par un test de câblage ; collection séparée `facturation_factures_freelance` ; la facture du freelance a sa série créée par `facturation` ; manifeste `freelance` amendé (consomme `releve-vente.emis@1` et `facture-freelance.emise@1`, compteur `freelance.freelance.active@1` lu par `paiement`).

**FRs covered:** FR-93 → FR-99, FR-224

- **Spine :** AD-10, AD-11, AD-2 (D-24), AD-27, AD-31 ; spine de `catalogue` / `pdv` AD-5, AD-9
- **Dépôts :** `pdv-service` (module `freelance`), `prospera-ventes-service` (`facturation` : factures, avoirs, séries et relevés du freelance), `paiement-service` (topics et Créance de périmètre freelance), `catalogue-produits-service` (grille freelance), `agent-instance` (ACL Kafka), `prospera-app`
- **Dépend de :** EPIC-230, EPIC-231 ; EPIC-228 (le prix société, la livraison) ; EPIC-071 et EPIC-087 (existants : double tarification et étanchéité entre indépendants) ; EPIC-223 (données privées)
- **Fini quand :** UJ-9 : la société vend 14 000, Ama facture 15 000, la société ne voit que 14 000 et verse sa commission sur 14 000, les 1 000 de négociation ne se voient nulle part, Ama doit 14 000 à la société même si son détaillant ne paie pas ; le test de fuite parcourt tous les topics d'AD-20 et toutes les réponses de lecture (dont `paiement`, `recouvrement`, `dashboard`) : zéro occurrence du prix freelance ; un consommateur de la société abonné à la famille freelance est refusé par l'ACL ; l'imputation d'un encaissement ne franchit jamais un périmètre ; sans l'add-on, `catalogue`, `reseau` et `pdv` rendent `NON_INSTALLE`.

### EPIC-237 : L'approvisionnement et les fournisseurs

Le module `approvisionnement` de `prospera-ventes-service` : registre des fournisseurs, note du fournisseur (30 / 25 / 25 / 10 / 10), réapprovisionnement proposé automatiquement, commande fournisseur de `SUGGEREE` à `RECUE`, plafonds de validation par montant, plancher de trésorerie qui bloque, fournisseur alternatif, garde-fou anti-stock-mort à l'achat, dette fournisseurs et échéancier. La réception d'une commande fournisseur appartient à `entrepot` (D-22) ; `approvisionnement` en consomme le fait pour le statut, la dette et la note. Les ordres de paiement aux fournisseurs passent par `paiement` (EPIC-232) ; lecture seule par le droit `approvisionnement:commande-fournisseur:consulter` (D-23). Objet de reprise : `approvisionnement.fournisseur@1`.

**FRs covered:** FR-59 → FR-67

- **Spine :** AD-4, AD-8, AD-12, AD-20 ; AD-24 (reprise)
- **Dépôts :** `prospera-ventes-service` (module `approvisionnement`), `stock-service`, `catalogue-produits-service`, `paiement-service` (ordres), `prospera-app`
- **Dépend de :** EPIC-229 (réception), EPIC-232 (ordres de paiement), EPIC-227 (catalogue, attributs) ; EPIC-083 (existant : seuils et couverture de `stock`)
- **Fini quand :** UJ-6 : trois réappros proposés, une commande fournisseur de 18 M au-dessus du plafond de 5 M passe au DAF, qui la valide parce que la trésorerie reste au-dessus du plancher ; un écart de réception de 6 % ouvre un litige et le stock est corrigé de ce qui est réellement arrivé ; sous le plancher, la validation est refusée ; la dette fournisseur reste ouverte tant que l'ordre n'est pas payé ; l'achat d'un article au stock mort est bloqué par le garde-fou.

### EPIC-238 : La conquête, les territoires, les objectifs et les quotas

Le module `conquete-objectifs` de `prospera-terrain-service` : zones non couvertes et recensement, carnet de prospects, entonnoir et goulot, garde-fous de la première commande (1,5 M par défaut) et du carnet, création de l'ouverture à la première commande livrée, survie des ouvertures à M+1 et M+3, valeur nette d'une ouverture, passation (« Transférer ») au commercial du secteur (fait `conquete-objectifs.passation.effectuee@1`), objectifs par zone, par commercial et par point de vente, atterrissage et projection de fin de mois, mix produit, marge et distribution numérique. Le module lit la liste des zones blanches de `reseau`, il ne crée jamais de zone.

**FRs covered:** FR-76 → FR-86

- **Spine :** AD-1, AD-12, AD-15, AD-20 ; AD-27 (manifeste)
- **Dépôts :** `prospera-terrain-service` (module `conquete-objectifs`), `reseau-service` (zones blanches), `pdv-service`, `prospera-app`
- **Dépend de :** EPIC-233 ; EPIC-227 (réseau, points de vente) ; EPIC-052 (existant : zones blanches) ; EPIC-092 (existant : carte)
- **Fini quand :** UJ-7 : une chargée de prospection recense une boutique en zone blanche, obtient une première commande sous le garde-fou de 1,5 M, la transfère au commercial du secteur ; un mois puis trois mois plus tard l'outil dit si l'ouverture tient ; `conquete-objectifs` installé ou non ne crée jamais de zone ; l'atterrissage et la projection de fin de mois bougent quand une commande est livrée (SM-5).

### EPIC-239 : Les équipes, la performance et le contrôle de gestion

Deux modules de `prospera-pilotage-service`. `equipe` : KPI de poste calculés, score sur 100 et statut, classement, matrice des postes et périmètre, coaching enregistré, salariés, freelances et rémunération privée (jamais lue hors droit), validation ou refus d'une demande de remise, barème de commission (sur l'encaissé pour les salariés, sur le prix société facturé pour le freelance, D-15). `controle-gestion` : budgets saisis et versionnés, budget-réel-projection, écarts avec cause et action proposée, compte de résultat par axe, prévision glissante sur 3 mois, rapports au DG et au DAF, périmètre du contrôle de gestion. Les deux modules lisent des faits publiés ; `equipe` dépend de `reseau`, `controle-gestion` n'est la dépendance dure de personne.

**FRs covered:** FR-122 → FR-128, FR-150 → FR-156

- **Spine :** AD-1, AD-10, AD-15, AD-19, AD-20, AD-23
- **Dépôts :** `prospera-pilotage-service` (modules `equipe`, `controle-gestion`), `reseau-service`, `prospera-app`
- **Dépend de :** EPIC-230, EPIC-231, EPIC-233 (les faits qu'ils lisent) ; EPIC-223 (données privées) ; EPIC-236 (commission freelance)
- **Fini quand :** Un KPI de poste bouge quand une donnée change (test qui modifie une donnée et attend le chiffre, SM-5) ; un superviseur ne voit que ses commerciaux et personne hors droit ne lit une rémunération ; le barème calcule une commission sur l'encaissé pour un salarié et sur le prix société pour un freelance ; un budget versionné donne un écart avec sa cause ; la prévision glissante porte sa provenance ; le rapport au DAF se génère depuis les données.

### EPIC-240 : La croissance : marketing, campagnes et studio réseaux sociaux

Deux modules de `prospera-croissance-service`. `marketing` : créer et conduire une campagne, ROI et indicateurs calculés, détection d'un combo de stock, validation d'un combo (au DG au-dessus du seuil), de la validation à la campagne, envoi qui part vraiment par `notification`, exclusions et plafond de messages (deux par destinataire et par semaine, FR-212 portée par EPIC-232), rattachement des commandes aux campagnes ; un client en défaut ou au crédit bloqué est exclu à la constitution de l'audience (règle de `marketing`, seuil publié par `recouvrement`). `studio-social` : calendrier des publications, accroches proposées, valider et programmer, boîte de réception unique, répondre à un message, créer un lead qui devient un prospect (la file de publication et l'OAuth Meta et TikTok sont portés ici ; hors février, saisie manuelle seule selon le manifeste). `support-client` (M03) n'a aucune exigence dans ce PRD (§6.9) : il n'a pas d'épic ici.

**FRs covered:** FR-87 → FR-92, FR-142 → FR-149, FR-211

- **Spine :** AD-1, AD-15, AD-18, AD-19, AD-20
- **Dépôts :** `prospera-croissance-service` (modules `marketing`, `studio-social`), `notification-service`, `pdv-service`, `prospera-terrain-service` (prospect), `prospera-app`
- **Dépend de :** EPIC-232 (`notification`) ; EPIC-235 (exclusions des clients en défaut) ; EPIC-238 (prospect) ; EPIC-227 (listes de points de vente) ; EPIC-061 (existant : envoi de masse)
- **Fini quand :** Une campagne se crée, s'envoie vraiment (dans l'essai : interceptée et comptée), son ROI est recalculé depuis les commandes rattachées ; un client au crédit bloqué ou en défaut n'est jamais dans l'audience ; un destinataire ne reçoit pas plus de deux messages de campagne par semaine ; un combo au-dessus du seuil exige le DG ; un lead du studio devient un prospect du carnet de `conquete-objectifs` ; chaque bouton non branché affiche « bientôt ».

### EPIC-241 : La comptabilité et la finance : encaissements, trésorerie, BFR et décisions de crédit

Le module `finance-transactions` de `prospera-pilotage-service` : écritures de vente et de provision, écritures d'encaissement et d'achat générées depuis les factures et les encaissements, balance soumise (l'export vient après), lettrage et suspens, déclaration de TVA préparée (télédéclaration « bientôt »), factures d'achat, clôture de période, remises de caisse et pièces manquantes, trésorerie à 7 jours, BFR, marge nette par canal, décision de crédit client, run fournisseurs et ordres de paiement (par `paiement`), rapprochement d'un compte de trésorerie, vue financière du DG et vue analytique. Le PRD place la comptabilité de référence après février (D-9, §10.2) : cet épic est construit après les épics ★ et n'entre pas dans la recette de février ; le module garde ses objets sans écrire de grand livre, l'export vers Sage et la facture normalisée restent « bientôt ».

**FRs covered:** FR-129 → FR-141, FR-175, FR-176

- **Spine :** AD-1, AD-7, AD-17, AD-19, AD-20 ; Deferred (comptabilité de référence)
- **Dépôts :** `prospera-pilotage-service` (module `finance-transactions`), `paiement-service` (lecture, ordres), `prospera-ventes-service`, `prospera-app`
- **Dépend de :** EPIC-230, EPIC-231, EPIC-232 (ordres), EPIC-237 (dette fournisseurs) ; EPIC-235 (décision de crédit)
- **Fini quand :** Une facture et un encaissement génèrent leurs écritures préparées au franc près, lisibles et retrouvables depuis la pièce ; un lettrage et un suspens se règlent à la main ; la trésorerie à 7 jours et le BFR se recalculent quand une pièce change ; une période close refuse l'écriture ; un ordre de paiement du run fournisseurs passe par les deux droits et les deux personnes de `paiement` ; l'export vers Sage et la télédéclaration affichent « bientôt ».

### EPIC-242 : Les automatisations

Le module `automatisations` (M26) porté par `assistant-service` : la règle est un objet enregistré, trois modes dont un mode `AUTO` qui reste sûr, garde-fous transverses, file d'arbitrage (Valider, Reporter, Ignorer), exécution réelle (jamais simulée), activer et désactiver une règle pour de vrai, journal de la nuit, badge qui compte le travail réel. Le module lit des faits et ne dépend de personne ; la règle avant le modèle et la provenance toujours (`PropositionPort`). Port de `assistant-service` : `:3417` (Q-7 tranchée le 2026-11-13) ; `:3011` reste à `prospera-microfinance-service`.

**FRs covered:** FR-157 → FR-164

- **Spine :** AD-12, AD-19, AD-20 ; Q-7
- **Dépôts :** `assistant-service` (module `automatisations`), `prospera-ventes-service`, `prospera-recouvrement-service`, `prospera-croissance-service`, `prospera-app`
- **Dépend de :** EPIC-222, EPIC-225 (garde-fous) ; EPIC-237 (réappro), EPIC-235 (relances), EPIC-240 (campagnes) pour les règles qu'il exécute ; EPIC-095 et suivants (existants : `assistant-service`)
- **Fini quand :** Une règle activée s'exécute pour de vrai et laisse une ligne au journal de la nuit ; en mode `AUTO`, aucun garde-fou n'est contourné ; une action passée en arbitrage attend « Valider » ; le badge compte le travail réel (modifier une donnée fait bouger le compte) ; une règle désactivée ne s'exécute plus.

### EPIC-243 : Le tableau de bord, les indicateurs et la provenance des règles « IA »

Le module `dashboard` de `prospera-pilotage-service` : un cockpit par rôle relu des modules, les 8 chiffres du DG, alertes du jour et décisions à trancher selon un modèle unique d'alerte et de décision (FR-14), rapport de direction, PDF et « Envoyer » pour de vrai, exports et courrier de gestion (FR-18). Tout indicateur se calcule depuis les données (SM-5, aucun indicateur constant) ; une prédiction dit d'où elle vient : règle, version, date, source, jamais un score sans provenance (FR-16 ; l'IA commune sert des règles v0, `PropositionPort`). Le score de santé d'un point de vente est une règle de `dashboard` déposée dans `pdv` avec sa provenance dès le premier jour (D-16) ; le rang de zone ; taux de service et ruptures sur trois mois ; rentabilité et engouement d'un article avec règle chiffrée, et coût de revient lu de la valorisation du stock (écran « Pilotage catalogue et assortiment »).

**FRs covered:** FR-14 → FR-16, FR-18, FR-165 → FR-171, FR-177, FR-184, FR-198, FR-204, FR-243

- **Spine :** AD-1, AD-15, AD-19, AD-20 ; AD-27
- **Dépôts :** `prospera-pilotage-service` (module `dashboard`), `pdv-service` (dépôt du score), `prospera-app`, IA commune
- **Dépend de :** EPIC-230, EPIC-231, EPIC-228, EPIC-229 (faits lus) ; EPIC-227 (score et attributs) ; EPIC-235 (alertes de créance)
- **Fini quand :** UJ-5 : le DG lit ses 8 chiffres, ouvre les décisions à trancher, en valide deux et en reporte une avec la trace, télécharge le rapport de direction en PDF et l'envoie au DAF ; modifier une donnée fait bouger l'indicateur (SM-5) ; un score de santé s'affiche avec sa règle, sa version et sa date ou ne s'affiche pas ; le rang de zone et le taux de service se lisent des modules qui ont la donnée ; chaque alerte a une règle écrite et paramétrable ; un cockpit de commercial ne montre aucun écran de pilotage.

### EPIC-244 : La reprise depuis Sage : fichiers, contrôle chez la cible et bascule ★

La reprise de février du distributeur, par fichiers (Connecteurs est hors février) : clients avec conditions de règlement et plafonds (`pdv`), articles et tarifs dont les prix propres à chaque client (`catalogue`), factures impayées (`facturation.facture-ouverte@1`, qui ouvre la Créance au reste dû repris, `origine = REPRISE`, sans lignes ni PDF), suite de numérotation (`facturation.suite-numerotation@1`, EPIC-224), fournisseurs, stock d'ouverture, zones et commerciaux (`reseau`). `commande`, `terrain`, `recouvrement` et les modules de la partie 3 ont `objetsDeReprise: []`. Le contrôle est chez la cible : la somme du reste dû chargé égale le total de la balance Sage fournie, par client et en total, à la date de coupure (`ECART_DE_CONTROLE` refuse la validation) ; un client absent de `pdv` rejette sa ligne (`CLIENT_INCONNU`) ; un numéro repris deux fois est refusé (`NUMERO_DEJA_REPRIS`) ; aucun crédit du tiers n'est repris, les avoirs et acomptes non imputés de Sage sont listés au rapport de contrôle et validés par le DAF. La marche en parallèle ne dépasse pas le gel de Sage. Le logiciel quitté est Sage (aucun connecteur Odoo en février) ; le document tarifaire qui classe le client « Odoo complet » est à corriger (action du PO). Les gabarits Sage se téléchargent dans l'écran d'import de la Reprise (EPIC-168) ; cet épic écrit les gabarits, les points d'import de chaque module cible du distributeur et la recette rejouée sur le jeu de reprise du client.

**FRs covered:** FR-58, FR-216, FR-219

- **Spine :** AD-5, AD-24, AD-30 ; spine de la Reprise AD-3, AD-5, AD-13 ; AD-27
- **Dépôts :** `pdv-service`, `catalogue-produits-service`, `prospera-ventes-service` (`facturation`, `approvisionnement`), `paiement-service` (Créance reprise), `stock-service`, `reseau-service`, module `reprise` de la plateforme, `prospera-app`
- **Dépend de :** EPIC-224 (suite de numérotation), EPIC-227, EPIC-230, EPIC-231 (les cibles) ; EPIC-161 à EPIC-165 et EPIC-167 (existants : kit des cibles, adaptateurs, lot de la Reprise, points d'import, comptage d'ouverture) ; actions A-4 (exports Sage) et A-3 (taille du client)
- **Fini quand :** Sur le jeu de reprise du client de février : la somme du reste dû chargé égale la balance Sage au franc près, par client et en total ; un écart refuse la validation ; une ligne d'un client inconnu est rejetée ; la première facture Prospera porte le numéro qui suit le dernier de Sage ; une facture reprise ouvre sa Créance et un encaissement la ramène au bon reste dû ; aucun client n'est créé en silence ; les besoins du premier jour de §10.1 sont joués de bout en bout avant la mise en service (SM-7).

## Ce qui n'est pas dans ces épics

- **Les fiches de stories** : écrites par celui qui code, juste avant de coder.
- **Les épics existants des modules de la partie 4** (`reseau`, `pdv`, `catalogue`, `stock`, `paiement`, `notification`, Reprise, Connecteurs) : non redécoupés ; ce découpage n'en porte que les écarts du distributeur et y renvoie sept exigences (carte de couverture).
- **Les « bientôt » du PRD, qui restent « bientôt »** (sans date, jamais simulés, un bouton `BIENTOT` n'appelle aucun serveur) : l'export vers Sage (factures et paiements importables) ; la facture normalisée et la certification OTR (les statuts et contrôles s'affichent, la télédéclaration non) ; Connecteurs et le connecteur Odoo ; le fichier banque du run fournisseurs ; la comptabilité de référence (écritures de grand livre, lettrage 411), que le PRD place après février (D-9) ; le compte rendu vocal et l'assistant conversationnel ; la détection de départ d'un client, la fraude sur les espèces, l'optimisation des tournées, l'alerte de proximité, la comparaison avec d'autres distributeurs et la recommandation de prix au freelance ; un second pays ; l'application sur iOS (Android seul en février).
- **Les consignes de bouteilles et de casiers** : hors v1 (D-12) ; un casier rendu n'est ni un avoir ni un paiement.
- **`support-client` (M03)** : le PRD ne pose aucune exigence (§6.9) ; il est à cadrer au lot 4, et la console devenue CRM interne de Money Vibes relève de la plateforme.
- **Le Mobile Money sortant de `paiement`** (T-Money, Flooz) : hors de ces épics ; les ordres de paiement aux fournisseurs, eux, sont dans EPIC-232 et restent « en attente de raccordement » tant que le fournisseur n'est pas raccordé.
- **La migration vers NestJS 12 et Mongoose 9**, tâche unique pour tous les services ; les métriques de capacité par client ; la sortie d'un module de son service ; plusieurs serveurs et la haute disponibilité : au Deferred de la spine.
- **Le prix, les paliers d'abonnement, la maintenance et l'offre pilote** : ils relèvent de l'offre commerciale (PRD §10.2).
- **Les amendements chez les voisins** (spine AD-27) sont portés **dans** les épics qui les consomment, non dans une série à part : manifestes `commande`, `facturation`, `recouvrement`, `freelance`, `pdv`, `terrain`, `entrepot` (EPIC-222 pour la forme, puis l'épic de chaque module) ; PRD et manifeste de `paiement`, migration des promesses, Node 24 du Dockerfile (EPIC-231) ; spine de `stock` (EPIC-225) ; spine de la microfinance AD-19 (EPIC-233) ; spine du moteur, profil d'instance hébergée (EPIC-224) ; `manifestes-a-produire.md` (notes des lignes M03, M08 à M13, M19, M21 à M26, M28, M42).
- **Les actions du PO qui ne sont pas du code** : A-1 (mentions légales par l'expert-comptable du client), A-2 (avis juridique sur la position GPS), A-3 (taille du client), A-4 (exports Sage), A-5 (gamme du jeu), A-6 (offre : le document tarifaire qui classe le client « Odoo complet » est à corriger, FR-219) ; seules A-1, A-2, A-3, A-4 et A-5 conditionnent une recette, elles sont nommées dans les épics concernés.
