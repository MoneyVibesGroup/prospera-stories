---
stepsCompleted: [1, 2]
inputDocuments:
  - prospera-stories/prds/prd-ia-commune-2026-11-13/prd.md (final : FR-1 → FR-190, annexes A à D) et son .memlog.md (décisions du PO D1 à D14, « qui avait raison », packages de vente, ajout d'un secteur, voix par pack)
  - prospera-stories/architecture/architecture-ia-commune-2026-11-13/ARCHITECTURE-SPINE.md (finale, 51 AD, `arbitrages-relectures-spine.md`)
  - prospera-stories/architecture/architecture-moteur-installation-2026-11-11/ARCHITECTURE-SPINE.md (amendements du 2026-11-13 : AD-3, AD-7, AD-9, AD-12, AD-13, AD-14, AD-17, AD-22, AD-28, AD-32, AD-37)
  - prospera-stories/epics-assurance-2026-11-13.md et epics-distributeur-2026-11-13.md (modèles exacts du découpage), epics-microfinance-imf-2026-11-13.md
  - prospera-stories/epics-assistant-ia-2026-08-16.md (EPIC-095 → 105, assistant d'août : réconcilié, voir plus bas) et epics-moteur-installation-2026-11-11.md
  - prospera-stories/sprint-status.yaml (epic_id_high_water_mark EPIC-244, plage Dev B EPIC-142 → 299)
---

# IA commune — Découpage en épics

## Vue d'ensemble

Découpage du **PRD de l'IA commune** et de sa **spine** en **épics**, comme pour l'assurance, le distributeur, la microfinance, le stock, le moteur et Reprise/Connecteurs : les fiches de stories ne sont **pas** écrites ici, mais par celui qui code la story, juste avant de la coder. Chaque épic porte son **backend** et ses **écrans**, et sa fin se prouve de bout en bout sur le vrai backend, sans mock. **Tous les écrans sont faits par Dev B** (règle du programme) ; le backend est proposé à Dev A, sauf décision contraire du PO.

**Identifiants.** **EPIC-245 → EPIC-261**, pris dans la plage de Dev B (`EPIC-142 → 299`) et inscrits au registre le jour du découpage (relevé du 2026-11-14 sur toutes les branches distantes : marque haute EPIC-244). **Aucun `story_id` n'est réservé** : chaque fiche prend le suivant de la plage de celui qui la code (`STORY-900 → 1199` pour Dev B, `STORY-730 → 899` pour Dev A). Les écrans prennent leur identifiant dans la série de la coque (`PRA-`).

**Le socle, pas les usages.** Ces épics portent **le socle commun** de l'IA : le service (`prospera-ia-service`, ancien `assistant-service`, `:3417`), le contrat de proposition, le registre, les garde-fous, le catalogue des capacités et leurs niveaux, les capacités par famille (la règle, la fiche, le fait de réalité), les boucles d'apprentissage, la centrale (`prospera-ia-centrale`, `:3418`), la ligne de modèles, la passerelle de langage et le modèle ouvert local, les packs de secteur, le Copilot commun. **Les usages propres à chaque logiciel restent dans les épics de la verticale**, qui dépendent de ceux-ci et ne sont pas redécoupés : microfinance EPIC-190 et EPIC-195, assurance EPIC-217 et EPIC-218, distributeur EPIC-242 et EPIC-243, cabinet EPIC-100. Aucun client n'est nommé : il s'agit des quatre logiciels.

**L'assistant d'août, réconcilié.** Les épics EPIC-095 → 105 (`epics-assistant-ia-2026-08-16.md`) sont le premier découpage du module d'assistant. Le PRD de l'IA commune l'**étend** (FR-2) et la spine **ratifie et étend** ses AD-1 à AD-23. **Repris tels quels** : EPIC-099 (corpus légal versionné, citation résolue) et EPIC-100 (mapping de comptes du cabinet, qui porte FR-111). **Repris, renommés et étendus** : EPIC-095 (EPIC-245), EPIC-096 (EPIC-255), EPIC-098 (EPIC-246), EPIC-101 à EPIC-105 (plan de construction d'EPIC-254). **Remplacé** : EPIC-097 (la Proposition d'août), par le contrat unique d'EPIC-246, qui reprend aussi `PropositionPort` de la microfinance. Les notes d'architecture d'août qui disent « rien n'est appliqué sans validation humaine » sont dépassées (FR-13, FR-14) : une action non engageante, réversible et sous mandat peut être autonome.

**Le chemin de construction (★).** Les épics ★ sont construits d'abord : le socle (EPIC-245), le contrat de proposition et le registre (EPIC-246), les garde-fous (EPIC-247), le catalogue, les trois niveaux et les quatre premiers packs (EPIC-248), **les règles N0 des capacités du chemin des démos** (EPIC-249, EPIC-250, EPIC-251) et le Copilot en texte (EPIC-253). Sans modèle de langage et sans centrale, chaque capacité sert déjà en règle ou en gabarit et le dit : c'est ce qui permet aux trois démos du 15/01 (distributeur, microfinance, assurance) et au cabinet d'afficher de vraies propositions avec leur provenance. **Tout est du premier jour**, sauf ce que le PRD place « bientôt » ou en horizon (§13, §17.2, §17.3) : cela est inscrit au catalogue par EPIC-261, sans code. Le ★ ne délimite pas le périmètre : il marque le chemin de construction. Les 17 épics sont du premier jour ; les épics sans ★ (capacités de terrain, agents et automatisations, passerelle et modèle local, boucle locale et mesure, export et consentement, centrale, packs et pays, exploitation, feuille de route) suivent dans l'ordre de construction de la spine (AD-40), la centrale venant en dernier et pouvant n'être qu'un squelette tant qu'aucune organisation ne consent. Le premier modèle commun réellement entraîné ne vient qu'au second semestre 2027 au plus tôt (FR-47) : la chaîne qui le recevra se construit avant.

**Chemin critique.** EPIC-245 (socle) → EPIC-246 (contrat, port, registre) → EPIC-248 (catalogue, niveaux, quatre packs : une première capacité de bout en bout) → EPIC-249, EPIC-250 et EPIC-251 (N0 des capacités des verticales, construits au rythme des verticales qui les demandent) → EPIC-253 (Copilot en texte). **En parallèle dès EPIC-246** : EPIC-247 (garde-fous : posés avant la première capacité qui touche une personne) ; EPIC-255 (passerelle et modèle local : pas sur le chemin, les capacités servent en gabarit sans lui). **Après le chemin** : EPIC-256 (boucle locale et mesure : elle lit les faits de réalité que les verticales publient) → EPIC-257 (export et consentement) → EPIC-258 (centrale, ligne de modèles, plan de promotion) ; EPIC-254 (agents et automatisations) après EPIC-253 ; EPIC-252 (terrain, segmentation) après EPIC-248 ; EPIC-259 (secteurs, pays, voix) après EPIC-258 et EPIC-255 ; EPIC-260 (exploitation et recette) clôt la tranche ; EPIC-261 (feuille de route) dès EPIC-248. **Dépendances vers les épics existants** : le moteur d'installation (EPIC-142 → 160 : manifestes EPIC-143, agent EPIC-148, chaîne de clés EPIC-149, promotion EPIC-151, sauvegarde EPIC-153, socle EPIC-155, vagues EPIC-156, consentements EPIC-157, apprentissage EPIC-158) et les quatre verticales (leurs faits de réalité, leurs emplacements d'écran).

**Charge et ordre.** Le PO a demandé de tout charger sans regarder la capacité (« on va y arriver ») : la charge n'est pas chiffrée ici ; la règle « bientôt » donne la marge. Les amendements du moteur (AD-39 de la spine) sont des PR à part, citées dans EPIC-246, 256, 257 et 258.

**Points ouverts qui touchent le plan.** Q-1 de la spine (le module `automatisations` garde-t-il le code `M26` : EPIC-254), Q-3 (un seul `llama-server` sans état pour l'essai et le réel : EPIC-255), Q-4 (annexe B amendée : EPIC-246), le choix du modèle de langage ouvert et les paliers mesurés (EPIC-255), la revue juridique avant un score de crédit ou d'assurance (EPIC-247), la durée de conservation du son et la qualité de reconnaissance sur le terrain (recette J-IA-08, EPIC-259).

## Requirements Inventory

### Functional Requirements

- **FR-1** : Une seule IA Prospera, quatre logiciels, deux façons de tourner
- **FR-2** : Ce que ce PRD remplace, étend ou laisse
- **FR-3** : Comment ce PRD se lit, se numérote et évolue
- **FR-4** : Une seule IA, une seule façon de se présenter
- **FR-5** : Les premières informations dès le premier jour
- **FR-6** : Apprendre toujours, se mettre à jour, atteindre ses objectifs
- **FR-7** : On met en commun l'apprentissage, pas les données
- **FR-8** : Les rôles de l'IA et leur périmètre
- **FR-9** : Ce que l'IA ne fait pas au premier jour
- **FR-10** : Les parcours UJ-1 à UJ-11 sont des cas de recette
- **FR-11** : Le vocabulaire est contractuel
- **FR-12** : Un seul contrat de proposition
- **FR-13** : L'IA propose, l'humain décide
- **FR-14** : L'autonomie, seulement non engageante, seulement sous mandat
- **FR-15** : L'IA n'est jamais bloquante
- **FR-16** : Provenance et explication de chaque proposition
- **FR-17** : Le registre de l'IA
- **FR-18** : L'équité des scores sur une personne
- **FR-19** : La classification des données de santé
- **FR-20** : Une capacité peut être interdite de proposer un montant sur un objet
- **FR-21** : Les droits de l'utilisateur sur ce que l'IA lui propose
- **FR-22** : Le droit d'observation et d'opposition de la personne concernée
- **FR-23** : Le journal des accès
- **FR-24** : Règle avant « IA » : le mot juste
- **FR-25** : Les droits viennent de l'utilisateur, jamais de l'IA
- **FR-26** : Le déterministe fait foi, l'IA n'invente aucun chiffre officiel
- **FR-27** : Pas de validation de façade
- **FR-28** : Revue juridique avant le score de crédit et d'assurance
- **FR-29** : Ne jamais promettre plus que ce qui est vrai
- **FR-30** : Un seul code, deux façons de tourner
- **FR-31** : En ligne, une organisation ne voit jamais l'IA d'une autre
- **FR-32** : En local, l'IA vit sous l'agent, sans port entrant
- **FR-33** : En ligne, une passerelle unique vers les grands modèles de langage
- **FR-34** : La passerelle masque, journalise, ne laisse rien
- **FR-35** : En local, un modèle ouvert sur le serveur du client, dimensionné au contrat, et un repli dit à l'écran
- **FR-36** : Rien de médical ne sort de l'instance
- **FR-37** : Les modules métier déclarent les capacités qu'ils consomment
- **FR-38** : L'IA ne lit pas les bases des modules
- **FR-39** : Chaque capacité tourne avec les droits de celui qui la demande
- **FR-40** : L'IA n'est jamais bloquante
- **FR-41** : L'empreinte matérielle de l'IA est publiée et le dimensionnement est du devis
- **FR-42** : L'IA existe dans les deux espaces, une calibration par espace
- **FR-43** : L'IA est un module facultatif, installé par manifeste
- **FR-44** : Aucune règle métier dans l'écran, l'IA se branche par emplacements
- **FR-45** : Trois niveaux par capacité, jamais confondus
- **FR-46** : N0, des règles expertes livrées et paramétrées par pays et par verticale
- **FR-47** : N1, un modèle commun pré-entraîné, jamais sur les données d'un client sans sa finalité
- **FR-48** : N2, la calibration ou le modèle propre au client, au seuil mesuré par capacité
- **FR-49** : Ce que chaque proposition dit de son niveau
- **FR-50** : Ce que chaque logiciel voit au premier jour
- **FR-51** : Les règles amorcent l'apprentissage
- **FR-52** : Qui décide le passage d'un niveau à l'autre, et comment il s'affiche
- **FR-53** : La règle N0 est toujours le repli
- **FR-54** : Sous le seuil, l'IA dit qu'elle ne sait pas
- **FR-55** : Les jeux de référence datés voyagent avec l'IA
- **FR-56** : Chaque proposition laisse un écart
- **FR-57** : Les faits de réalité viennent des modules, par des faits nommés
- **FR-58** : Le motif d'un écart est codé, jamais libre
- **FR-59** : Chaque nuit, une recalibration locale, bornée
- **FR-60** : La calibration validée est intouchable ; une nouvelle calibration naît à côté
- **FR-61** : Chaque jour, des écarts agrégés remontent, si, et seulement si, tout est en règle
- **FR-62** : Le modèle commun s'entraîne chez Money Vibes, à une cadence qui limite la rétention
- **FR-63** : Une ligne de modèles, distincte de la ligne de la plateforme
- **FR-64** : Le plan de promotion d'un modèle : essai, ombre, canari, général
- **FR-65** : Les portes sont écrites avant l'essai
- **FR-66** : La date est celle du DSI en local, un interrupteur de changement en ligne
- **FR-67** : Le retour arrière tient en une action
- **FR-68** : Chaque capacité a des objectifs mesurés
- **FR-69** : Le champion et le challenger
- **FR-70** : L'équité se mesure et bloque
- **FR-71** : Un rapport mensuel local, par capacité et par client
- **FR-72** : Un rapport mensuel global, chez Money Vibes
- **FR-73** : La dérive est détectée, alertée, et peut arrêter une promotion
- **FR-74** : Chaque désaccord est gardé, puis tranché par la réalité à son horizon
- **FR-75** : Le taux « qui avait raison », sur une période glissante, par capacité, agent, agence, client et en global
- **FR-76** : Une finalité « apprentissage commun », consentie au contrat
- **FR-77** : Un niveau d'export « apprentissage » propre
- **FR-78** : Un jeton quotidien autorise l'envoi
- **FR-79** : Le retrait du consentement arrête l'usage futur
- **FR-80** : Les transferts hors du pays sont déclarés et informés
- **FR-81** : Un modèle déjà publié n'est pas désentraîné, et sa composition est tracée
- **FR-82** : Le croisement entre verticales est un horizon ; ce qu'un modèle n'apprend jamais
- **FR-83** : Tout modèle est signé, par une clé dont l'usage le couvre
- **FR-84** : Même contenu par le réseau et par le fichier
- **FR-85** : Gel, version figée, licence à vie : l'IA sert indéfiniment
- **FR-86** : L'IA est supervisée comme le reste, par sa route de santé
- **FR-87** : Les modèles et les calibrations se sauvegardent et se restaurent avec les données
- **FR-88** : Hébergé : la garde du registre se place entre l'IA et les données
- **FR-89** : Le registre de l'IA, sa durée et son effacement
- **FR-90** : Chaque capacité est déclarée, versionnée, et porte un vocabulaire par logiciel
- **FR-91** : Le niveau d'une capacité au premier jour : règle, modèle commun, modèle du client
- **FR-92** : Chaque capacité a des objectifs mesurés, et un rapport mensuel
- **FR-93** : Un score est une note expliquée, avec sa règle v0, puis un modèle sous le même contrat
- **FR-94** : Tout score sur une personne a une liste fermée de variables et un suivi d'équité
- **FR-95** : Un score est une information : il ne refuse pas, ne bloque pas et ne fixe pas de prix
- **FR-96** : La probabilité de paiement ou de recouvrement est une règle versionnée, puis un modèle sous le même contrat
- **FR-97** : La file de relances est triée par valeur espérée, avec action et canal, sans jamais décider du blocage
- **FR-98** : La stratégie de recouvrement et les scripts de relance sont des projets modifiables
- **FR-99** : La lecture d'une pièce extrait, classe et pré-remplit, sans jamais valider ni rejeter
- **FR-100** : Un message entrant est lu comme une pièce : déclaration assistée, commande, lead
- **FR-101** : Le contrôle de cohérence d'un dossier signale, avec gravité et action, et ne bloque pas
- **FR-102** : Le contrôle de saisie et de conformité alerte, sans empêcher
- **FR-103** : Un signal n'est pas une accusation : il ouvre une revue humaine
- **FR-104** : Le graphe des liens de l'assurance ouvre une revue, sans modifier le score
- **FR-105** : La prévision de trésorerie et de chiffre d'affaires est une règle versionnée avec sa précision mesurée
- **FR-106** : La prévision du retard de portefeuille et de l'épargne donne deux scénarios, « sans action » et « avec actions »
- **FR-107** : La prévision et l'analyse financière du cabinet ne calculent aucun chiffre officiel
- **FR-108** : Une recommandation est une liste classée, chacune avec sa raison, dans les contraintes dures du logiciel
- **FR-109** : Le réapprovisionnement, le fournisseur et les combos de stock lent sont proposés avec leurs garde-fous
- **FR-110** : Assurance : orientation d'expertise, devis, comparaison, contre-proposition, sans jamais proposer de montant corporel
- **FR-111** : Le rattachement d'un compte et le conseil fiscal sont proposés dans un flux qui reste maître
- **FR-112** : Un brouillon n'est jamais envoyé seul ; gabarit ou modèle de langage, il le dit
- **FR-113** : Un résumé dit d'où vient chaque phrase, et omet ce que l'utilisateur ne peut pas voir
- **FR-114** : Un rapport de direction est un gabarit tant qu'aucun modèle ne l'a rédigé
- **FR-115** : Le Copilot est une seule capacité, servie aux quatre logiciels au premier jour
- **FR-116** : Le brief du matin est une lecture du périmètre du rôle, sans contact avec personne
- **FR-117** : Les priorités d'agence et du collecteur sont des listes ordonnées avec motif
- **FR-118** : La tournée est proposée par l'IA et validée par l'humain, avec calcul local
- **FR-119** : La position est consentie, les zones sont suggérées, l'affectation reste humaine
- **FR-120** : Toute proposition s'explique, et la règle fait foi
- **FR-121** : Les segments sont agrégés, les campagnes sont validées par un humain
- **FR-122** : Le distributeur : l'IA propose des packages de vente, l'humain les valide, l'IA mesure l'impact
- **FR-123** : Le coaching est une règle à points, et un agent n'est jamais jugé par l'IA seule
- **FR-124** : L'IA propose un rattachement ; elle ne valide jamais et n'écrit jamais d'écriture
- **FR-125** : Une simulation n'entre dans aucun indicateur ni aucun état
- **FR-126** : L'analyse sectorielle cite des sources datées et n'est qu'une information
- **FR-127** : Le moteur d'automatisation est un seul moteur, dont le mode le plus strict est le défaut
- **FR-128** : Ce qui est « bientôt », « plus tard » ou exclu est inscrit au catalogue, avec son bouton
- **FR-129** : Les seize contradictions entre les PRD des logiciels sont résolues comme suit
- **FR-130** : Aucune des 95 capacités recensées n'est oubliée : tableau de contrôle
- **FR-131** : Le Copilot est servi au premier jour aux quatre logiciels, en texte et en lecture seule
- **FR-132** : Le Copilot a les droits de l'utilisateur, cite ses sources et donne le périmètre de chaque chiffre
- **FR-133** : Le Copilot a un vocabulaire et des rôles par logiciel, et marche sans modèle de langage
- **FR-134** : Les agents agissent sous un catalogue de types d'action ; seule une action non engageante et réversible peut être autonome
- **FR-135** : Un mandat est une délégation bornée, avec un plafond cumulé réservé puis confirmé
- **FR-136** : Une exécution est une demande par événement, idempotente, annulable par compensation
- **FR-137** : Ce que chaque logiciel permet à un agent
- **FR-138** : La voix est un réglage du pack de secteur ; le chatbot de messagerie et les langues locales sont « bientôt »
- **FR-139** : Le Copilot et les agents ont leurs objectifs mesurés et leurs quotas
- **FR-140** : La reconnaissance de caractères reste dans le service de documents ; la lecture et le classement sont dans l'IA
- **FR-141** : Un PDF sans couche texte, un scan ou une photo sont lus de la même façon
- **FR-142** : Chaque lecture a une confiance par champ, et l'humain confirme
- **FR-143** : Les pièces médicales ne quittent jamais l'instance, et leur texte est une donnée de santé
- **FR-144** : Au cabinet, la lecture alimente le profil de société et les cahiers, avec la hiérarchie de preuve
- **FR-145** : Un modèle de vision viendra plus tard, sous le même contrat
- **FR-146** : La feuille de route classe chaque produit de la vision, avec son statut
- **FR-147** : Risque, le moteur de décision de risque, est une note et non une décision
- **FR-148** : La finance de la chaîne dépend d'un partenaire qui prête, et d'un contrôle de surendettement
- **FR-149** : L'assurance embarquée ne s'impose pas, et Money Vibes n'assure pas
- **FR-150** : Les agents métier sont des surfaces sous mandat, avec un humain toujours joignable
- **FR-151** : Le passeport financier suppose une identité partagée et un consentement explicite
- **FR-152** : Pulse ne publie jamais une donnée individuelle ni un concurrent
- **FR-153** : La Météo des prix et de la demande est retenue, et dépend de données multi-clients
- **FR-154** : La distribution en pilote automatique enchaîne voir, prévoir, agir, financer, assurer
- **FR-155** : La Relation client commune est un seul moteur de relance et de service client
- **FR-156** : La facture certifiée qui vaut crédit relie conformité fiscale et financement
- **FR-157** : L'argent programmable sur PI-SPI respecte un plancher de vie et un consentement révocable
- **FR-158** : Le modèle de fondation sectoriel et le transfrontalier ne sont pas tranchés
- **FR-159** : Les garde-fous de la vision s'appliquent à tous ces produits
- **FR-160** : Un secteur s'ajoute, le socle ne se modifie pas
- **FR-161** : Le pack de secteur, déclaratif et versionné
- **FR-162** : Le vocabulaire du secteur se rattache à un noyau neutre
- **FR-163** : Les capacités consommées et les règles N0 du secteur
- **FR-164** : Les objectifs et les vérités terrain du secteur
- **FR-165** : Les garde-fous propres au secteur ne peuvent qu'ajouter
- **FR-166** : Les modèles et les calibrations d'un secteur sont versionnés à part
- **FR-167** : Non-régression obligatoire, champion et challenger par secteur
- **FR-168** : L'apprentissage commun ne mélange les secteurs que pour des familles déclarées transverses
- **FR-169** : Une famille nouvelle est une extension versionnée du catalogue
- **FR-170** : Le démarrage à froid d'un secteur
- **FR-171** : Un pays est un référentiel, avec sa langue, sa devise et ses calendriers
- **FR-172** : La résidence des données et le rail de paiement se déclarent, ils ne se recodent pas
- **FR-173** : Le format est public, l'IA reste à Money Vibes
- **FR-174** : La checklist d'ajout d'un secteur ou d'un pays, et un exemple
- **FR-175** : Performance des propositions de règle et de modèle
- **FR-176** : Performance du Copilot et des capacités de langage
- **FR-177** : Disponibilité de l'IA et de ce qui en dépend
- **FR-178** : Isolation entre organisations, entre secteurs et entre capacités
- **FR-179** : Sécurité de l'IA
- **FR-180** : Journalisation de l'IA
- **FR-181** : Conservation du registre, des écarts et des journaux
- **FR-182** : Dimensionnement du matériel local
- **FR-183** : Coût d'inférence maîtrisé
- **FR-184** : Observabilité de l'IA
- **FR-185** : Montée en charge en ligne et ajout de clients
- **FR-186** : Compatibilité et évolution des contrats
- **FR-187** : Accessibilité, langue et lisibilité
- **FR-188** : Résilience, sauvegarde et restauration
- **FR-189** : La conformité se prouve par des tests rejoués à chaque livraison
- **FR-190** : La saisie vocale de terrain de la microfinance

### NonFunctional Requirements

Les exigences non fonctionnelles du PRD (§15) sont numérotées **FR-175 → FR-189** : elles figurent dans la liste ci-dessus et dans la carte de couverture, rattachées à l'épic qui les porte le mieux (performance, disponibilité, isolation, observabilité, montée en charge, compatibilité, accessibilité, résilience, conformité par tests rejoués : EPIC-260 ; sécurité de l'IA : EPIC-247 ; journalisation et conservation : EPIC-246 ; dimensionnement du matériel local et coût d'inférence : EPIC-255 ; isolation de base : EPIC-245 ; contrats : EPIC-245). Les valeurs par défaut sont celles de l'annexe D du PRD.

### Additional Requirements (spine)

- **AD-1** : Une proposition, jamais une décision : le noyau ne détient aucune donnée métier
- **AD-2** : Les unités et leurs données : un propriétaire par objet, sans import croisé
- **AD-3** : Un seul code, deux profils, une liste fermée de différences
- **AD-4** : Le port de consommation : une demande, une proposition, jamais bloquante
- **AD-5** : Le contrat de proposition (annexe B) : immuable, chaîné, un événement par transition
- **AD-6** : L'autonomie interdite est une garde du port et une garde du consommateur
- **AD-7** : Le catalogue des capacités : une fiche déclarative, sans fiche pas de capacité
- **AD-8** : Trois niveaux, N0 en données versionnées dans les packs, le plus bas toujours disponible
- **AD-9** : La version servie : une sélection par capacité et par organisation, jamais par calendrier
- **AD-10** : Le registre de l'IA : unique, append-only, chaîné, deux horloges, base séparée
- **AD-11** : Isolation, droits de l'utilisateur, tourniquet et quota fail-closed
- **AD-12** : Les entrées sont préparées par le module, déclarées, minimisées
- **AD-13** : Le journal des écarts : une paire prédiction/réalité sous une clé pseudonyme stable sur l'instance
- **AD-14** : Les faits « prédiction » et « réalité » sont des contrats nommés, versionnés, testés des deux côtés
- **AD-15** : Le désaccord : gardé, tranché à l'horizon, calculé sur l'instance
- **AD-16** : L'échantillon aveugle, et aucune promotion sur les seuls prêts accordés
- **AD-17** : La boucle locale : une calibration sœur chaque nuit, bornée, jamais en place
- **AD-18** : Champion et challenger, jeu d'évaluation figé, équité qui bloque
- **AD-19** : Le niveau d'export « apprentissage » : préparé sur l'instance, agrégé, schéma fermé
- **AD-20** : La centrale de l'IA : agréger, entraîner, évaluer, signer, rien d'autre
- **AD-21** : Une ligne de modèles distincte, signée, même contenu par le réseau et par le fichier
- **AD-22** : Le plan de promotion : essai, ombre, canari, général ; correctif de modèle = couper ou revenir
- **AD-23** : Les secteurs ne se mélangent pas : une clé de secteur, des alias séparés, des familles transverses déclarées
- **AD-24** : La passerelle de langage : un seul chemin en ligne, masqué, journalisé avant chaque envoi, fail-closed
- **AD-25** : Le modèle local : `llama-server` sous l'agent, paliers mesurés, repli dit à l'écran
- **AD-26** : La sortie de langage est sourcée, ses chiffres viennent des entrées, le contenu récupéré est une donnée
- **AD-27** : La santé : une classification unique, appliquée par l'IA à chaque sortie
- **AD-28** : Un pack de secteur est déclaratif, fermé, signé, versionné ; il n'ajoute que des garde-fous
- **AD-29** : Le Copilot est en lecture seule ; les agents n'agissent que sous catalogue, mandat et événement
- **AD-30** : Les automatisations : une grammaire fermée, un seul moteur de règles, le mode le plus strict par défaut
- **AD-31** : La lecture de pièces : l'OCR reste dans `document-service`, la lecture et le classement dans l'IA
- **AD-32** : Les contrats nommés de l'IA : un catalogue, un producteur par fait
- **AD-33** : Sans contact, l'IA sert indéfiniment ; seul ce qui vient de Money Vibes s'arrête
- **AD-34** : Sécurité et clés : un usage « modèle », une signature par lot, des secrets à un seul endroit
- **AD-35** : Observabilité, rapports mensuels, dérive : mesurer sans rien exporter de personnel
- **AD-36** : Essai et réel : une calibration par espace, jamais copiée à la signature
- **AD-37** : Montants, temps, identifiants et travaux planifiés
- **AD-38** : L'écran : des emplacements, un composant commun, aucune règle
- **AD-39** : Ce que cette spine change chez ses voisins
- **AD-40** : La tranche de départ et l'ordre de construction
- **AD-41** : Un seul écrivain du statut d'une proposition : la décision porte son heure
- **AD-42** : Une capacité, une forme d'appel ; une demande, une proposition
- **AD-43** : « Qui avait raison » : une règle, un horizon, un calcul, une version
- **AD-44** : Tout ce qui change une proposition visible passe par le même plan, sous une classe d'effet signée
- **AD-45** : Une exécution, un propriétaire, un compteur : `assistant`
- **AD-46** : Les objets interdits sont reliés aux types d'action ; les étiquettes ne bloquent jamais
- **AD-47** : L'identité d'une capacité est `secteur/code@majeure` partout
- **AD-48** : L'équité : des groupes consentis, mesurés sur l'instance, exportés en agrégats
- **AD-49** : L'exploitation de la centrale de l'IA : sauvegardée, supervisée, sur l'infrastructure de Money Vibes
- **AD-50** : La charge en ligne : une image, deux rôles, calcul hors boucle d'événements
- **AD-51** : Une table de codes, trois catégories : état, refus, erreur

### UX Design Requirements

Il n'y a pas de contrat UX séparé : **l'écran est un composant commun et des emplacements** (spine AD-38), et les maquettes des quatre logiciels portent les emplacements d'IA (décision du PO : les fronts de démo servent de maquette). Chaque épic reprend les écrans qu'il touche, branchés ou « bientôt » (jamais simulés), et crée ceux qui manquent : `/ia/capacites`, `/ia/registre`, `/ia/rapports`, `/ia/versions`, `/ia/consentements`, `/ia/transferts`, `/assistant/mandats`, `/assistant/executions`, `/assistant/arbitrage`, `/automatisations`. La règle de la maquette d'abord s'applique (`prototypes/prospera-prototype.html`).

### FR Coverage Map

- FR-1 → EPIC-245 — Une seule IA Prospera, quatre logiciels, deux façons de tourner
- FR-2 → EPIC-245 — Ce que ce PRD remplace, étend ou laisse
- FR-3 → EPIC-245 — Comment ce PRD se lit, se numérote et évolue
- FR-4 → EPIC-246 — Une seule IA, une seule façon de se présenter
- FR-5 → EPIC-248 — Les premières informations dès le premier jour
- FR-6 → EPIC-256 — Apprendre toujours, se mettre à jour, atteindre ses objectifs
- FR-7 → EPIC-257 — On met en commun l'apprentissage, pas les données
- FR-8 → EPIC-245 — Les rôles de l'IA et leur périmètre
- FR-9 → EPIC-248 — Ce que l'IA ne fait pas au premier jour
- FR-10 → EPIC-260 — Les parcours UJ-1 à UJ-11 sont des cas de recette
- FR-11 → EPIC-245 — Le vocabulaire est contractuel
- FR-12 → EPIC-246 — Un seul contrat de proposition
- FR-13 → EPIC-246 — L'IA propose, l'humain décide
- FR-14 → EPIC-247 — L'autonomie, seulement non engageante, seulement sous mandat
- FR-15 → EPIC-246 — L'IA n'est jamais bloquante
- FR-16 → EPIC-246 — Provenance et explication de chaque proposition
- FR-17 → EPIC-246 — Le registre de l'IA
- FR-18 → EPIC-247 — L'équité des scores sur une personne
- FR-19 → EPIC-247 — La classification des données de santé
- FR-20 → EPIC-247 — Une capacité peut être interdite de proposer un montant sur un objet
- FR-21 → EPIC-246 — Les droits de l'utilisateur sur ce que l'IA lui propose
- FR-22 → EPIC-247 — Le droit d'observation et d'opposition de la personne concernée
- FR-23 → EPIC-246 — Le journal des accès
- FR-24 → EPIC-246 — Règle avant « IA » : le mot juste
- FR-25 → EPIC-245 — Les droits viennent de l'utilisateur, jamais de l'IA
- FR-26 → EPIC-247 — Le déterministe fait foi, l'IA n'invente aucun chiffre officiel
- FR-27 → EPIC-247 — Pas de validation de façade
- FR-28 → EPIC-247 — Revue juridique avant le score de crédit et d'assurance
- FR-29 → EPIC-247 — Ne jamais promettre plus que ce qui est vrai
- FR-30 → EPIC-245 — Un seul code, deux façons de tourner
- FR-31 → EPIC-245 — En ligne, une organisation ne voit jamais l'IA d'une autre
- FR-32 → EPIC-245 — En local, l'IA vit sous l'agent, sans port entrant
- FR-33 → EPIC-255 — En ligne, une passerelle unique vers les grands modèles de langage
- FR-34 → EPIC-255 — La passerelle masque, journalise, ne laisse rien
- FR-35 → EPIC-255 — En local, un modèle ouvert sur le serveur du client, dimensionné au contrat, et un repli dit à l'écran
- FR-36 → EPIC-247 — Rien de médical ne sort de l'instance
- FR-37 → EPIC-248 — Les modules métier déclarent les capacités qu'ils consomment
- FR-38 → EPIC-245 — L'IA ne lit pas les bases des modules
- FR-39 → EPIC-245 — Chaque capacité tourne avec les droits de celui qui la demande
- FR-40 → EPIC-246 — L'IA n'est jamais bloquante
- FR-41 → EPIC-255 — L'empreinte matérielle de l'IA est publiée et le dimensionnement est du devis
- FR-42 → EPIC-245 — L'IA existe dans les deux espaces, une calibration par espace
- FR-43 → EPIC-245 — L'IA est un module facultatif, installé par manifeste
- FR-44 → EPIC-246 — Aucune règle métier dans l'écran, l'IA se branche par emplacements
- FR-45 → EPIC-248 — Trois niveaux par capacité, jamais confondus
- FR-46 → EPIC-248 — N0, des règles expertes livrées et paramétrées par pays et par verticale
- FR-47 → EPIC-258 — N1, un modèle commun pré-entraîné, jamais sur les données d'un client sans sa finalité
- FR-48 → EPIC-256 — N2, la calibration ou le modèle propre au client, au seuil mesuré par capacité
- FR-49 → EPIC-248 — Ce que chaque proposition dit de son niveau
- FR-50 → EPIC-248 — Ce que chaque logiciel voit au premier jour
- FR-51 → EPIC-256 — Les règles amorcent l'apprentissage
- FR-52 → EPIC-256 — Qui décide le passage d'un niveau à l'autre, et comment il s'affiche
- FR-53 → EPIC-248 — La règle N0 est toujours le repli
- FR-54 → EPIC-248 — Sous le seuil, l'IA dit qu'elle ne sait pas
- FR-55 → EPIC-258 — Les jeux de référence datés voyagent avec l'IA
- FR-56 → EPIC-256 — Chaque proposition laisse un écart
- FR-57 → EPIC-256 — Les faits de réalité viennent des modules, par des faits nommés
- FR-58 → EPIC-256 — Le motif d'un écart est codé, jamais libre
- FR-59 → EPIC-256 — Chaque nuit, une recalibration locale, bornée
- FR-60 → EPIC-256 — La calibration validée est intouchable ; une nouvelle calibration naît à côté
- FR-61 → EPIC-257 — Chaque jour, des écarts agrégés remontent, si, et seulement si, tout est en règle
- FR-62 → EPIC-258 — Le modèle commun s'entraîne chez Money Vibes, à une cadence qui limite la rétention
- FR-63 → EPIC-258 — Une ligne de modèles, distincte de la ligne de la plateforme
- FR-64 → EPIC-258 — Le plan de promotion d'un modèle : essai, ombre, canari, général
- FR-65 → EPIC-258 — Les portes sont écrites avant l'essai
- FR-66 → EPIC-258 — La date est celle du DSI en local, un interrupteur de changement en ligne
- FR-67 → EPIC-258 — Le retour arrière tient en une action
- FR-68 → EPIC-256 — Chaque capacité a des objectifs mesurés
- FR-69 → EPIC-256 — Le champion et le challenger
- FR-70 → EPIC-256 — L'équité se mesure et bloque
- FR-71 → EPIC-256 — Un rapport mensuel local, par capacité et par client
- FR-72 → EPIC-258 — Un rapport mensuel global, chez Money Vibes
- FR-73 → EPIC-256 — La dérive est détectée, alertée, et peut arrêter une promotion
- FR-74 → EPIC-256 — Chaque désaccord est gardé, puis tranché par la réalité à son horizon
- FR-75 → EPIC-256 — Le taux « qui avait raison », sur une période glissante, par capacité, agent, agence, client et en global
- FR-76 → EPIC-257 — Une finalité « apprentissage commun », consentie au contrat
- FR-77 → EPIC-257 — Un niveau d'export « apprentissage » propre
- FR-78 → EPIC-257 — Un jeton quotidien autorise l'envoi
- FR-79 → EPIC-257 — Le retrait du consentement arrête l'usage futur
- FR-80 → EPIC-257 — Les transferts hors du pays sont déclarés et informés
- FR-81 → EPIC-257 — Un modèle déjà publié n'est pas désentraîné, et sa composition est tracée
- FR-82 → EPIC-257 — Le croisement entre verticales est un horizon ; ce qu'un modèle n'apprend jamais
- FR-83 → EPIC-258 — Tout modèle est signé, par une clé dont l'usage le couvre
- FR-84 → EPIC-258 — Même contenu par le réseau et par le fichier
- FR-85 → EPIC-260 — Gel, version figée, licence à vie : l'IA sert indéfiniment
- FR-86 → EPIC-260 — L'IA est supervisée comme le reste, par sa route de santé
- FR-87 → EPIC-260 — Les modèles et les calibrations se sauvegardent et se restaurent avec les données
- FR-88 → EPIC-257 — Hébergé : la garde du registre se place entre l'IA et les données
- FR-89 → EPIC-246 — Le registre de l'IA, sa durée et son effacement
- FR-90 → EPIC-248 — Chaque capacité est déclarée, versionnée, et porte un vocabulaire par logiciel
- FR-91 → EPIC-248 — Le niveau d'une capacité au premier jour : règle, modèle commun, modèle du client
- FR-92 → EPIC-256 — Chaque capacité a des objectifs mesurés, et un rapport mensuel
- FR-93 → EPIC-249 — Un score est une note expliquée, avec sa règle v0, puis un modèle sous le même contrat
- FR-94 → EPIC-249 — Tout score sur une personne a une liste fermée de variables et un suivi d'équité
- FR-95 → EPIC-249 — Un score est une information : il ne refuse pas, ne bloque pas et ne fixe pas de prix
- FR-96 → EPIC-249 — La probabilité de paiement ou de recouvrement est une règle versionnée, puis un modèle sous le même contrat
- FR-97 → EPIC-249 — La file de relances est triée par valeur espérée, avec action et canal, sans jamais décider du blocage
- FR-98 → EPIC-249 — La stratégie de recouvrement et les scripts de relance sont des projets modifiables
- FR-99 → EPIC-250 — La lecture d'une pièce extrait, classe et pré-remplit, sans jamais valider ni rejeter
- FR-100 → EPIC-250 — Un message entrant est lu comme une pièce : déclaration assistée, commande, lead
- FR-101 → EPIC-250 — Le contrôle de cohérence d'un dossier signale, avec gravité et action, et ne bloque pas
- FR-102 → EPIC-250 — Le contrôle de saisie et de conformité alerte, sans empêcher
- FR-103 → EPIC-250 — Un signal n'est pas une accusation : il ouvre une revue humaine
- FR-104 → EPIC-250 — Le graphe des liens de l'assurance ouvre une revue, sans modifier le score
- FR-105 → EPIC-251 — La prévision de trésorerie et de chiffre d'affaires est une règle versionnée avec sa précision mesurée
- FR-106 → EPIC-251 — La prévision du retard de portefeuille et de l'épargne donne deux scénarios, « sans action » et « avec actions »
- FR-107 → EPIC-251 — La prévision et l'analyse financière du cabinet ne calculent aucun chiffre officiel
- FR-108 → EPIC-249 — Une recommandation est une liste classée, chacune avec sa raison, dans les contraintes dures du logiciel
- FR-109 → EPIC-249 — Le réapprovisionnement, le fournisseur et les combos de stock lent sont proposés avec leurs garde-fous
- FR-110 → EPIC-249 — Assurance : orientation d'expertise, devis, comparaison, contre-proposition, sans jamais proposer de montant corporel
- FR-111 → EPIC-100 (existant) — Le rattachement d'un compte et le conseil fiscal sont proposés dans un flux qui reste maître
- FR-112 → EPIC-251 — Un brouillon n'est jamais envoyé seul ; gabarit ou modèle de langage, il le dit
- FR-113 → EPIC-251 — Un résumé dit d'où vient chaque phrase, et omet ce que l'utilisateur ne peut pas voir
- FR-114 → EPIC-251 — Un rapport de direction est un gabarit tant qu'aucun modèle ne l'a rédigé
- FR-115 → EPIC-253 — Le Copilot est une seule capacité, servie aux quatre logiciels au premier jour
- FR-116 → EPIC-251 — Le brief du matin est une lecture du périmètre du rôle, sans contact avec personne
- FR-117 → EPIC-252 — Les priorités d'agence et du collecteur sont des listes ordonnées avec motif
- FR-118 → EPIC-252 — La tournée est proposée par l'IA et validée par l'humain, avec calcul local
- FR-119 → EPIC-252 — La position est consentie, les zones sont suggérées, l'affectation reste humaine
- FR-120 → EPIC-251 — Toute proposition s'explique, et la règle fait foi
- FR-121 → EPIC-252 — Les segments sont agrégés, les campagnes sont validées par un humain
- FR-122 → EPIC-252 — Le distributeur : l'IA propose des packages de vente, l'humain les valide, l'IA mesure l'impact
- FR-123 → EPIC-252 — Le coaching est une règle à points, et un agent n'est jamais jugé par l'IA seule
- FR-124 → EPIC-251 — L'IA propose un rattachement ; elle ne valide jamais et n'écrit jamais d'écriture
- FR-125 → EPIC-251 — Une simulation n'entre dans aucun indicateur ni aucun état
- FR-126 → EPIC-251 — L'analyse sectorielle cite des sources datées et n'est qu'une information
- FR-127 → EPIC-254 — Le moteur d'automatisation est un seul moteur, dont le mode le plus strict est le défaut
- FR-128 → EPIC-261 — Ce qui est « bientôt », « plus tard » ou exclu est inscrit au catalogue, avec son bouton
- FR-129 → EPIC-248 — Les seize contradictions entre les PRD des logiciels sont résolues comme suit
- FR-130 → EPIC-248 — Aucune des 95 capacités recensées n'est oubliée : tableau de contrôle
- FR-131 → EPIC-253 — Le Copilot est servi au premier jour aux quatre logiciels, en texte et en lecture seule
- FR-132 → EPIC-253 — Le Copilot a les droits de l'utilisateur, cite ses sources et donne le périmètre de chaque chiffre
- FR-133 → EPIC-253 — Le Copilot a un vocabulaire et des rôles par logiciel, et marche sans modèle de langage
- FR-134 → EPIC-254 — Les agents agissent sous un catalogue de types d'action ; seule une action non engageante et réversible peut être autonome
- FR-135 → EPIC-254 — Un mandat est une délégation bornée, avec un plafond cumulé réservé puis confirmé
- FR-136 → EPIC-254 — Une exécution est une demande par événement, idempotente, annulable par compensation
- FR-137 → EPIC-254 — Ce que chaque logiciel permet à un agent
- FR-138 → EPIC-259 — La voix est un réglage du pack de secteur ; le chatbot de messagerie et les langues locales sont « bientôt »
- FR-139 → EPIC-253 — Le Copilot et les agents ont leurs objectifs mesurés et leurs quotas
- FR-140 → EPIC-250 — La reconnaissance de caractères reste dans le service de documents ; la lecture et le classement sont dans l'IA
- FR-141 → EPIC-250 — Un PDF sans couche texte, un scan ou une photo sont lus de la même façon
- FR-142 → EPIC-250 — Chaque lecture a une confiance par champ, et l'humain confirme
- FR-143 → EPIC-247 — Les pièces médicales ne quittent jamais l'instance, et leur texte est une donnée de santé
- FR-144 → EPIC-250 — Au cabinet, la lecture alimente le profil de société et les cahiers, avec la hiérarchie de preuve
- FR-145 → EPIC-250 — Un modèle de vision viendra plus tard, sous le même contrat
- FR-146 → EPIC-261 — La feuille de route classe chaque produit de la vision, avec son statut
- FR-147 → EPIC-261 — Risque, le moteur de décision de risque, est une note et non une décision
- FR-148 → EPIC-261 — La finance de la chaîne dépend d'un partenaire qui prête, et d'un contrôle de surendettement
- FR-149 → EPIC-261 — L'assurance embarquée ne s'impose pas, et Money Vibes n'assure pas
- FR-150 → EPIC-261 — Les agents métier sont des surfaces sous mandat, avec un humain toujours joignable
- FR-151 → EPIC-261 — Le passeport financier suppose une identité partagée et un consentement explicite
- FR-152 → EPIC-261 — Pulse ne publie jamais une donnée individuelle ni un concurrent
- FR-153 → EPIC-261 — La Météo des prix et de la demande est retenue, et dépend de données multi-clients
- FR-154 → EPIC-261 — La distribution en pilote automatique enchaîne voir, prévoir, agir, financer, assurer
- FR-155 → EPIC-261 — La Relation client commune est un seul moteur de relance et de service client
- FR-156 → EPIC-261 — La facture certifiée qui vaut crédit relie conformité fiscale et financement
- FR-157 → EPIC-261 — L'argent programmable sur PI-SPI respecte un plancher de vie et un consentement révocable
- FR-158 → EPIC-261 — Le modèle de fondation sectoriel et le transfrontalier ne sont pas tranchés
- FR-159 → EPIC-261 — Les garde-fous de la vision s'appliquent à tous ces produits
- FR-160 → EPIC-259 — Un secteur s'ajoute, le socle ne se modifie pas
- FR-161 → EPIC-248 — Le pack de secteur, déclaratif et versionné
- FR-162 → EPIC-248 — Le vocabulaire du secteur se rattache à un noyau neutre
- FR-163 → EPIC-248 — Les capacités consommées et les règles N0 du secteur
- FR-164 → EPIC-248 — Les objectifs et les vérités terrain du secteur
- FR-165 → EPIC-259 — Les garde-fous propres au secteur ne peuvent qu'ajouter
- FR-166 → EPIC-259 — Les modèles et les calibrations d'un secteur sont versionnés à part
- FR-167 → EPIC-259 — Non-régression obligatoire, champion et challenger par secteur
- FR-168 → EPIC-259 — L'apprentissage commun ne mélange les secteurs que pour des familles déclarées transverses
- FR-169 → EPIC-248 — Une famille nouvelle est une extension versionnée du catalogue
- FR-170 → EPIC-259 — Le démarrage à froid d'un secteur
- FR-171 → EPIC-259 — Un pays est un référentiel, avec sa langue, sa devise et ses calendriers
- FR-172 → EPIC-259 — La résidence des données et le rail de paiement se déclarent, ils ne se recodent pas
- FR-173 → EPIC-259 — Le format est public, l'IA reste à Money Vibes
- FR-174 → EPIC-259 — La checklist d'ajout d'un secteur ou d'un pays, et un exemple
- FR-175 → EPIC-260 — Performance des propositions de règle et de modèle
- FR-176 → EPIC-260 — Performance du Copilot et des capacités de langage
- FR-177 → EPIC-260 — Disponibilité de l'IA et de ce qui en dépend
- FR-178 → EPIC-245 — Isolation entre organisations, entre secteurs et entre capacités
- FR-179 → EPIC-247 — Sécurité de l'IA
- FR-180 → EPIC-246 — Journalisation de l'IA
- FR-181 → EPIC-246 — Conservation du registre, des écarts et des journaux
- FR-182 → EPIC-255 — Dimensionnement du matériel local
- FR-183 → EPIC-255 — Coût d'inférence maîtrisé
- FR-184 → EPIC-260 — Observabilité de l'IA
- FR-185 → EPIC-260 — Montée en charge en ligne et ajout de clients
- FR-186 → EPIC-245 — Compatibilité et évolution des contrats
- FR-187 → EPIC-260 — Accessibilité, langue et lisibilité
- FR-188 → EPIC-260 — Résilience, sauvegarde et restauration
- FR-189 → EPIC-260 — La conformité se prouve par des tests rejoués à chaque livraison
- FR-190 → EPIC-259 — La saisie vocale de terrain de la microfinance


**Arbitrages de l'assembleur (2026-11-14, délégation du PO)** : le module `automatisations` garde le code **M26** (spine Q-1) ; **un seul `llama-server`, sans état**, sert l'espace d'essai et l'espace réel d'une instance, les données de chaque espace restant séparées (spine Q-3). Les épics d'usage des verticales (EPIC-190, 195, 217, 218, 242, 243, 100) dépendent de EPIC-245 → 248 ; leur ligne de dépendance est à ajouter par une PR à part.

## Epic List

| Épic | Titre | ★ | FR | Dépend de |
|---|---|---|---|---|
| EPIC-245 | Le socle : `prospera-ia-service`, le renommage et les deux façons de tourner | ★ | 15 | EPIC-155 (existant : Node 24, MongoDB 8.0, client Kafka Confluent, Karapace) ; EPIC-143 (existant : le catalogue connaît chaque module par son manifeste) ; EPIC-148 (existant : instance sur site, agent) ; EPIC-095 (existant : à tirer renommé) |
| EPIC-246 | Le contrat de proposition, le port unique et le registre de l'IA | ★ | 14 | EPIC-245 ; EPIC-098 (existant : audit à deux horloges, repris tel quel et étendu au registre) ; EPIC-145 (existant : emplacements d'écran de la coque) |
| EPIC-247 | Les garde-fous : santé, équité, autonomie interdite, preuves et revue juridique | ★ | 12 | EPIC-246 ; le registre `classification-sante` de la spine assurance (EPIC-201, existant) |
| EPIC-248 | Le catalogue des capacités, les trois niveaux et les quatre premiers packs | ★ | 18 | EPIC-246 ; EPIC-143 (existant : manifestes) ; EPIC-157 (existant : consentements et indicateurs de niveau 0) |
| EPIC-249 | Les capacités du jugement : scores, probabilités, relances, recommandations | ★ | 9 | EPIC-248, EPIC-247 (équité, autonomie interdite) ; EPIC-100 (existant) |
| EPIC-250 | Les capacités de lecture : pièces, contrôles de cohérence, anomalies et fraude | ★ | 11 | EPIC-248, EPIC-247 (santé, anomalie sans accusation) ; `document-service` (EPIC-214 d'assurance, existant, pour l'OCR réel) |
| EPIC-251 | Les capacités de langage et de calcul : prévoir, rédiger, résumer, expliquer, simuler, rapprocher | ★ | 11 | EPIC-248 ; EPIC-099 (existant : corpus légal versionné et citation résolue, repris tel quel pour les sources) ; EPIC-255 pour le modèle de langage (sans lui, gabarits) |
| EPIC-252 | Les capacités du terrain, de la segmentation et du coaching |  | 6 | EPIC-248, EPIC-247 ; les faits des modules de terrain et de croissance (lus, jamais écrits) |
| EPIC-253 | Le Copilot en texte, en lecture seule, pour les quatre logiciels | ★ | 5 | EPIC-246, EPIC-248 ; EPIC-255 pour le modèle de langage (sans lui, repli) |
| EPIC-254 | Les agents sous mandat et les automatisations par règles |  | 5 | EPIC-246, EPIC-247 (autonomie interdite) ; EPIC-253 ; EPIC-101, EPIC-102, EPIC-103, EPIC-104, EPIC-105 (existants : à tirer renommés) ; `STORY-365` (existant : droits tenant) |
| EPIC-255 | La passerelle de langage, le modèle ouvert hébergé et `llama-server` sur l'instance |  | 6 | EPIC-245 ; EPIC-096 (existant : `LlmProvider` et gabarits, repris) ; EPIC-148 (existant : l'agent)  |
| EPIC-256 | La boucle locale et la mesure : écarts, calibration nocturne, « qui avait raison » |  | 17 | EPIC-248, EPIC-246 (registre) ; EPIC-151 (existant : promouvoir et revenir, fenêtre de mise à jour) ; EPIC-157 (existant : consentements et indicateurs de niveau 0) ; EPIC-153 (existant : la calibration se sauvegarde avec les données) |
| EPIC-257 | L'export « apprentissage » et le consentement : ce qui sort, et ce qui n'en sort jamais |  | 10 | EPIC-256 (écarts mûrs) ; EPIC-157 et EPIC-158 (existants : consentements, exports préparés et approuvés, niveaux 0 à 3 d'`apprentissage-service`) ; EPIC-149 (existant : chaîne de confiance) |
| EPIC-258 | La centrale `prospera-ia-centrale`, la ligne de modèles et le plan de promotion |  | 11 | EPIC-257 (consentement et lot) ; EPIC-256 (ombre et non-régression) ; EPIC-149, EPIC-151, EPIC-156 (existants : chaîne de clés, promotion et retour, vagues et incidents) ; EPIC-158 (existant : contributions et modèle commun, niveaux 0 à 3) ; EPIC-153 (existant : sauvegarde) |
| EPIC-259 | Ajouter un secteur ou un pays sans rien perturber, et la voix du pack |  | 12 | EPIC-248 (le format et les quatre packs) ; EPIC-258 (artefacts par secteur et non-régression) ; EPIC-255 (le modèle ouvert local) ; EPIC-195 (existant : la dictée côté microfinance) |
| EPIC-260 | L'exploitation de l'IA, la performance et la recette des parcours |  | 12 | EPIC-245 à EPIC-259 (les parcours qu'elle rejoue) ; EPIC-153 (existant : sauvegarde et restauration) ; EPIC-150 (existant : gel et licence) ; EPIC-160 (existant : démos du 15/01) |
| EPIC-261 | La feuille de route : « bientôt », « plus tard », « exclu » et l'horizon inscrits au catalogue, sans code |  | 15 | EPIC-248 (le catalogue) |


### EPIC-245 : Le socle : `prospera-ia-service`, le renommage et les deux façons de tourner ★

Le service qui porte toute l'IA. `assistant-service` (jamais codé, épics EPIC-095 → 105) devient `prospera-ia-service` sur le port `:3417` et porte trois modules installables séparément : `ia` (le socle), `assistant` et `automatisations` ; les deux derniers dépendent d'`ia` et ne s'importent jamais entre eux. Le même code tourne en ligne (plusieurs organisations dans un service, une image, deux rôles API et travailleur) et en local (une organisation, sous l'agent, sans port entrant) : la différence est la configuration signée de l'état voulu, et la liste fermée des écarts de comportement d'AD-3 (dix adaptateurs choisis par le nom de profil lu une fois au démarrage). Le gate `IA_NOT_ENTITLED`, le cloisonnement par `organisationId` (aucune requête, aucun cache, aucun journal ne mélange deux organisations), les droits propres au module (réglage, registre, promotion ; jamais une donnée métier), la clé d'identité `secteur/code@majeure`, l'IA qui ne lit pas la base d'un module et ne dispose que des droits de celui qui demande, une calibration par espace (essai et réel), l'installation par manifeste (C1 à C13) et la désinstallation qui ne supprime rien. Tâches imposées par la spine : renommage et passage de `:3011` à `:3417` (`:3011` reste à `prospera-microfinance-service`) ; migration sur la pile du moteur (Node 24, NestJS 11, Mongoose 8, MongoDB 8.0, BullMQ 6, client Kafka Confluent, Karapace) ; suite de contrat identique jouée contre les deux profils ; balayage de la CI (appel direct à un fournisseur de modèle, branche de profil hors de la liste, import croisé de modules) ; manifestes des trois modules et fiche de la centrale (annexe A). Les épics d'août qui ne sont pas remplacés (EPIC-095, 098) se tirent ici, renommés.

**FRs covered:** FR-1 → FR-3, FR-8, FR-11, FR-25, FR-30 → FR-32, FR-38, FR-39, FR-42, FR-43, FR-178, FR-186

- **Spine :** AD-2, AD-3, AD-11, AD-33 (démarrage seul), AD-37, AD-47, AD-50 ; moteur AD-3, AD-10, AD-16, AD-27 ; spine de l'assistant AD-14 à AD-23 (ratifiées)
- **Dépôts :** `prospera-ia-service` (renommé depuis `assistant-service`, trois modules), `prospera-plateforme` (`contrats/ia/`, gate et catalogue de droits), `agent-instance` (le profil local, sans port entrant), `prospera-app` (coques des modules d'écran `ia`, `assistant`, `automatisations`)
- **Dépend de :** EPIC-155 (existant : Node 24, MongoDB 8.0, client Kafka Confluent, Karapace) ; EPIC-143 (existant : le catalogue connaît chaque module par son manifeste) ; EPIC-148 (existant : instance sur site, agent) ; EPIC-095 (existant : à tirer renommé)
- **Fini quand :** `docker compose up` démarre le service dans les deux profils avec les trois modules, `assistant` installé sans `ia` est refusé (`MODULE_DEPENDANCE_MANQUANTE`) ; la suite de contrat rend les mêmes propositions en ligne et en local ; une requête d'une organisation sur le jeton d'une autre est refusée (`ORGANISATION_HORS_JETON`) ; le balayage de ports d'une instance locale ne trouve aucun port entrant ; la CI échoue sur une branche de profil hors liste, un import croisé de modules ou un appel direct à un fournisseur ; désinstaller `ia` ne supprime rien (test aller-retour) et aucun parcours des quatre logiciels ne casse.

### EPIC-246 : Le contrat de proposition, le port unique et le registre de l'IA ★

Le contrat unique de l'annexe B : une proposition immuable, chaînée, à origine `REGLE`, `MODELE` ou `LANGAGE`, avec son niveau, sa confiance, sa provenance et son explication ; un seul écrivain de son statut (la décision humaine porte son heure) ; une capacité, une forme d'appel, une demande, une proposition ; `PropositionPort` jamais bloquant (un état d'indisponibilité est un `200` avec état, jamais une exception). Le registre de l'IA, unique, en ajout seul, chaîné, à deux horloges (la trace opposable au long cours, le contexte brut purgé court), dans une base séparée ; le journal des accès ; la conservation et l'effacement. Le composant commun d'affichage d'une proposition (provenance, explication, accepter, modifier, rejeter, voir pourquoi) pour les quatre logiciels : aucune règle métier dans l'écran, l'IA se branche par emplacements ; le mot juste (« règle » tant que ce n'est pas un modèle). Tâche : porter le schéma JSON versionné dans `prospera-plateforme/contrats/ia/` (source du client généré), les faits `ia.proposition.*` aux manifestes des quatre logiciels (amendement C5), et les corrections d'annexe B de la spine (`masquee`, `NON_SOURCEE`, `BLOQUEE`). Le contrat de Proposition d'août (EPIC-097) et le `PropositionPort` de la microfinance sont **remplacés** par ce contrat.

**FRs covered:** FR-4, FR-12, FR-13, FR-15 → FR-17, FR-21, FR-23, FR-24, FR-40, FR-44, FR-89, FR-180, FR-181

- **Spine :** AD-1, AD-4, AD-5, AD-10, AD-26, AD-38, AD-41, AD-42, AD-51 ; spine de l'assistant AD-1 à AD-3 (formes reprises)
- **Dépôts :** `prospera-ia-service` (module `ia`), `prospera-plateforme` (`contrats/ia/proposition`, table de codes unique), `prospera-app` (`src/modules/ia/` : composant commun, `/ia/capacites`, `/ia/registre`)
- **Dépend de :** EPIC-245 ; EPIC-098 (existant : audit à deux horloges, repris tel quel et étendu au registre) ; EPIC-145 (existant : emplacements d'écran de la coque)
- **Fini quand :** Un module d'essai demande une proposition et reçoit un contrat valide, la décision humaine (acceptée, modifiée, rejetée, motif codé) s'écrit chez le consommateur et le statut ne change que par l'écrivain unique ; le nombre de propositions affichées égale le nombre d'entrées du registre ; une proposition n'est jamais réécrite (ré-proposer chaîne) ; l'IA coupée, un parcours d'essai de chaque logiciel va au bout ; une lecture au journal des accès est tracée ; le contexte brut est purgé à l'échéance courte et la trace reste.

### EPIC-247 : Les garde-fous : santé, équité, autonomie interdite, preuves et revue juridique ★

Ce que l'IA ne fait jamais, appliqué par le port et, une seconde fois, par chaque consommateur. L'autonomie seulement non engageante et sous mandat, interdite sans exception sur le crédit, la garantie, le sinistre, le paiement, le refus et le blocage ; la suspension d'un paiement pour fraude est une mise en attente. La classification des données de santé, une seule liste appliquée à chaque sortie (registre `classification-sante`), qui reste sur l'instance : rien de médical ne sort, et le texte d'une pièce médicale est une donnée de santé. L'équité d'un score sur une personne : liste fermée de variables, `VARIABLE_NON_AUTORISEE`, groupes consentis ; la capacité interdite de proposer un montant sur un objet (jamais de montant corporel). Le droit d'observation et d'opposition de la personne concernée ; le déterministe fait foi et l'IA n'invente aucun chiffre officiel ; pas de validation de façade (échantillon d'audit) ; la revue juridique avant un score de crédit ou d'assurance ; ne jamais promettre plus que ce qui est vrai ; sécurité (texte libre sensible par défaut, anti-injection, contenu récupéré traité comme une donnée). Tâches : liaison des objets interdits aux types d'action (AD-46, les étiquettes ne bloquent jamais), tests de mutation qui retirent une classification ou un champ, balayage de la CI des étiquettes `ia:*`.

**FRs covered:** FR-14, FR-18 → FR-20, FR-22, FR-26 → FR-29, FR-36, FR-143, FR-179

- **Spine :** AD-6, AD-26, AD-27, AD-46, AD-48 ; spine assurance AD-8, AD-23 ; spine microfinance AD-18
- **Dépôts :** `prospera-ia-service` (module `ia`, gardes du port), `prospera-plateforme` (registre `classification-sante`, `champs-sensibles`), les services consommateurs (la seconde garde, par les trois épics de verticale), `prospera-app`
- **Dépend de :** EPIC-246 ; le registre `classification-sante` de la spine assurance (EPIC-201, existant)
- **Fini quand :** Une demande classée santé vers un modèle hébergé est refusée (`SANTE_HORS_INSTANCE`) ; un type engageant ou irréversible en `AUTO` est refusé (`TYPE_NON_AUTONOMISABLE`) ; une variable hors liste est refusée à l'enregistrement d'un score ; un test de mutation qui retire une classification fait échouer la CI ; une observation de la personne concernée est enregistrée et visible du responsable ; aucune capacité qui touche une personne n'est mise en service sans sa revue juridique datée.

### EPIC-248 : Le catalogue des capacités, les trois niveaux et les quatre premiers packs ★

La fiche de capacité déclarative (sans fiche, pas de capacité), versionnée, publiée par les modules (clause C11) et lue par l'instance ; trois niveaux jamais confondus : N0 des règles expertes livrées en données versionnées (le repli toujours disponible), N1 un modèle commun, N2 une calibration propre au client ; la version servie est une sélection par capacité et par organisation (un seul écrivain, compare-and-set), jamais un calendrier. Ce que chaque proposition dit de son niveau, l'IA qui dit qu'elle ne sait pas sous le seuil de confiance, ce que chaque logiciel voit au premier jour. Le format du pack de secteur (déclaratif, fermé, signé, versionné, noyau neutre) avec son chargeur, et les **quatre premiers packs** (cabinet, distributeur, microfinance, assurance) : vocabulaire, capacités consommées, règles N0, objectifs et vérités terrain. Les règles N0 de chaque famille s'y déposent avec l'épic de la famille (EPIC-249 à EPIC-253). Tâche : première capacité de bout en bout (une règle N0 d'un module d'essai, rendue, enregistrée, lue au catalogue) avant toute autre ; `CAPACITE_NON_DECLAREE` ; statuts `BIENTOT`, `PLUS_TARD`, `EXCLU` lus d'EPIC-261.

**FRs covered:** FR-5, FR-9, FR-37, FR-45, FR-46, FR-49, FR-50, FR-53, FR-54, FR-90, FR-91, FR-129, FR-130, FR-161 → FR-164, FR-169

- **Spine :** AD-7, AD-8, AD-9, AD-28 (format), AD-40, AD-44, AD-47 ; moteur AD-17 (catalogue des contrats nommés)
- **Dépôts :** `prospera-ia-service` (module `ia` : `catalogue`, `selection`, `packs/`), `prospera-plateforme` (`contrats/ia/pack`, fiches), les manifestes des modules consommateurs (C11 : `ia: { capacites, finalites }`), `prospera-app` (`/ia/capacites`)
- **Dépend de :** EPIC-246 ; EPIC-143 (existant : manifestes) ; EPIC-157 (existant : consentements et indicateurs de niveau 0)
- **Fini quand :** Une capacité déclarée par un module apparaît au catalogue avec sa version, son niveau servi et sa date de mise en service ; un module absent retire ses capacités ; une capacité sans fiche est refusée ; une règle N0 est toujours le repli quand un modèle est coupé ou en défaut ; sous le seuil de confiance, la proposition dit « je ne sais pas » ; les quatre packs se chargent et se lisent, et le vocabulaire d'un logiciel s'affiche chez lui sans changer celui d'un autre.

### EPIC-249 : Les capacités du jugement : scores, probabilités, relances, recommandations ★

Les familles 1, 2 et 7 du catalogue, en règle N0 partout. Le score d'un tiers (risque ou santé) est une note expliquée, avec sa règle v0 puis un modèle sous le même contrat, sa liste fermée de variables et son suivi d'équité ; un score est une information : il ne refuse pas, ne bloque pas et ne fixe aucun prix. La probabilité de paiement ou de recouvrement, la file de relances triée par valeur espérée avec action et canal sans jamais décider du blocage, la stratégie de recouvrement et les scripts comme projets modifiables. La recommandation : une liste classée, chacune avec sa raison, dans les contraintes dures du logiciel ; réapprovisionnement, fournisseur et combos de stock lent avec leurs garde-fous ; assurance : orientation d'expertise, devis, comparaison, contre-proposition, sans jamais proposer de montant corporel. Les usages métier restent chez la verticale (crédit : EPIC-190 ; recouvrement : EPIC-195 ; devis et expertise : EPIC-218 ; réapprovisionnement : EPIC-242) ; ici, la capacité, sa règle, sa fiche, son fait de réalité. Le rattachement d'un compte du cabinet reste dans EPIC-100 (existant).

**FRs covered:** FR-93 → FR-98, FR-108 → FR-110 ; renvoyé : FR-111 → EPIC-100 (existant)

- **Spine :** AD-6, AD-7, AD-8, AD-15, AD-16 (échantillon aveugle, score de crédit), AD-46, AD-48
- **Dépôts :** `prospera-ia-service` (module `ia`), `packs/` (règles N0 des quatre packs), `prospera-plateforme`, les modules consommateurs (emplacements), `prospera-app`
- **Dépend de :** EPIC-248, EPIC-247 (équité, autonomie interdite) ; EPIC-100 (existant)
- **Fini quand :** Chaque capacité de ces familles rend une proposition N0 avec sa règle, sa version et son explication dans les quatre logiciels qui la consomment ; une variable hors liste est refusée ; aucun score ne bloque ni ne refuse ; la file de relances ne décide jamais du blocage ; l'assurance ne propose aucun montant corporel.

### EPIC-250 : Les capacités de lecture : pièces, contrôles de cohérence, anomalies et fraude ★

Les familles 3, 4 et 5 et la lecture de pièces du §12. L'OCR reste dans `document-service` ; la lecture et le classement sont dans l'IA, qui reçoit le texte et la structure et rend une proposition d'extraction avec une confiance par champ : elle extrait, classe et pré-remplit, sans jamais valider ni rejeter, et l'humain confirme. Un PDF sans couche texte, un scan et une photo se lisent de la même façon ; une pièce illisible est mise de côté sans arrêter le lot (`PIECE_ILLISIBLE`). Un message entrant est lu comme une pièce (déclaration assistée, commande, lead). Au cabinet, la lecture alimente le profil de société et les cahiers, avec la hiérarchie de preuve. Le contrôle de cohérence d'un dossier (gravité et action, jamais bloquant), le contrôle de saisie et de conformité (alerte sans empêcher), le signal de fraude qui ouvre une revue humaine sans accuser, le graphe des liens de l'assurance qui ne modifie pas le score. Un modèle de vision viendra plus tard sous le même contrat.

**FRs covered:** FR-99 → FR-104, FR-140 → FR-142, FR-144, FR-145

- **Spine :** AD-27, AD-31, AD-46 ; spine assurance AD-9, AD-10
- **Dépôts :** `prospera-ia-service` (module `ia`), `document-service` (texte et structure fournis ; pas d'OCR dans l'IA), `packs/`, `prospera-app`
- **Dépend de :** EPIC-248, EPIC-247 (santé, anomalie sans accusation) ; `document-service` (EPIC-214 d'assurance, existant, pour l'OCR réel)
- **Fini quand :** Un PDF scanné, une photo et un PDF texte rendent la même extraction avec confiance par champ ; rien n'est validé sans confirmation humaine ; une pièce médicale est lue sur l'instance et jamais envoyée à un modèle hébergé ; une pièce illisible n'arrête pas un lot ; un signal de fraude ouvre une revue et ne change aucun statut ; `document-service` absent rend `NON_INSTALLE`.

### EPIC-251 : Les capacités de langage et de calcul : prévoir, rédiger, résumer, expliquer, simuler, rapprocher ★

Les familles 6, 8, 9, 13, 16, 17 et 18 et le brief du matin. La prévision (trésorerie, chiffre d'affaires, retard de portefeuille et épargne en deux scénarios « sans action » et « avec actions ») est une règle versionnée avec sa précision mesurée ; au cabinet elle ne calcule aucun chiffre officiel. La rédaction d'un message ou d'un courrier : un brouillon jamais envoyé seul, gabarit ou modèle de langage, et la provenance le dit. Le résumé dit d'où vient chaque phrase et omet ce que l'utilisateur ne peut pas voir ; le rapport de direction est un gabarit tant qu'aucun modèle ne l'a rédigé. L'explication d'un calcul, d'un score ou d'un montant (« pourquoi ce montant ? ») où la règle fait foi. Le rapprochement, la réconciliation, les écarts et les doublons : l'IA propose, ne valide jamais, n'écrit aucune écriture. La simulation « et si » n'entre dans aucun indicateur ni aucun état. L'analyse sectorielle cite des sources datées et n'est qu'une information. Le brief du matin est une lecture du périmètre du rôle, sans contact avec personne. Les usages sont ceux des verticales (assurance : EPIC-217 ; IMF : EPIC-195 ; distributeur : EPIC-243).

**FRs covered:** FR-105 → FR-107, FR-112 → FR-114, FR-116, FR-120, FR-124 → FR-126

- **Spine :** AD-4, AD-24, AD-26 (sortie sourcée, chiffres des entrées), AD-42 ; spine assurance AD-10
- **Dépôts :** `prospera-ia-service` (module `ia`), `packs/` (gabarits et règles N0), `prospera-app`
- **Dépend de :** EPIC-248 ; EPIC-099 (existant : corpus légal versionné et citation résolue, repris tel quel pour les sources) ; EPIC-255 pour le modèle de langage (sans lui, gabarits)
- **Fini quand :** Chaque capacité rend, sans modèle de langage, un gabarit qui dit « Rédigé sans modèle de langage : version simplifiée » ; un brouillon n'est jamais envoyé seul ; un résumé dont une phrase n'a pas de source la marque `NON_SOURCEE` et la rend inacceptable ; un chiffre rédigé qui n'est pas dans les entrées est refusé ; une simulation ne bouge aucun indicateur ; l'explication d'un montant renvoie à la règle qui le calcule.

### EPIC-252 : Les capacités du terrain, de la segmentation et du coaching

Les familles 12, 14 et 15. La tournée proposée par l'IA et validée par l'humain, avec calcul local ; la priorité d'agence et du collecteur, liste ordonnée avec motif ; la position consentie, les zones suggérées, l'affectation qui reste humaine. Les segments sont agrégés et les campagnes sont validées par un humain ; pour le distributeur, l'IA propose des packages de vente (lots, prix, cibles), l'humain les valide, l'IA mesure l'impact (ventes, marge, panier, points de vente touchés, avant et après, contre groupe témoin) avec un rapport par package et par campagne. Le coaching est une règle à points, et un agent n'est jamais jugé par l'IA seule. Les usages métier restent chez la verticale (collecte et terrain de l'IMF : EPIC-195 ; croissance et campagnes du distributeur : EPIC-240 ; équipes : EPIC-239).

**FRs covered:** FR-117 → FR-119, FR-121 → FR-123

- **Spine :** AD-4, AD-6, AD-12 (entrées minimisées), AD-46 ; spine du distributeur AD-19
- **Dépôts :** `prospera-ia-service` (module `ia`), `packs/`, `prospera-app`
- **Dépend de :** EPIC-248, EPIC-247 ; les faits des modules de terrain et de croissance (lus, jamais écrits)
- **Fini quand :** Une tournée proposée se valide ou se modifie et l'affectation reste humaine ; un package de vente se valide par un humain et son impact se mesure avec un groupe témoin ; une position non consentie n'entre dans aucune proposition ; le coaching affiche ses points et ne juge personne seul.

### EPIC-253 : Le Copilot en texte, en lecture seule, pour les quatre logiciels ★

Le module `assistant`, première moitié : une seule capacité servie aux quatre logiciels au premier jour, en texte et en lecture seule, avec un vocabulaire et des rôles par logiciel. Le Copilot a les droits de l'utilisateur et rien de plus, cite ses sources et donne le périmètre de chaque chiffre ; il marche sans modèle de langage (recherche par règles et gabarits, dit à l'écran) ; sessions dont le contexte brut est purgé à l'échéance courte ; compte de service dédié pour une lecture plus large, sous la garde du registre des consentements. Objectifs mesurés et quotas du Copilot. Sa surface est un emplacement du module d'écran `assistant` dans les quatre logiciels, sans saisie vocale. Les corpus propres à chaque logiciel (cabinet, distributeur, IMF, assurance) se branchent chez la verticale (EPIC-195 pour l'IMF, EPIC-217 pour la recherche en langage naturel de l'assurance).

**FRs covered:** FR-115, FR-131 → FR-133, FR-139

- **Spine :** AD-26, AD-29 (Copilot) ; spine de l'assistant AD-5 (surface = gabarit)
- **Dépôts :** `prospera-ia-service` (module `assistant`), `prospera-app` (`src/modules/assistant/`, emplacement Copilot dans les quatre logiciels)
- **Dépend de :** EPIC-246, EPIC-248 ; EPIC-255 pour le modèle de langage (sans lui, repli)
- **Fini quand :** Un utilisateur de chacun des quatre logiciels pose une question et reçoit une réponse sourcée, avec le périmètre de chaque chiffre ; le Copilot ne crée, ne modifie, n'envoie ni ne supprime rien ; il ne rend rien que l'utilisateur ne peut pas voir ; sans modèle de langage, il répond par la recherche et dit qu'il est en repli ; le temps de réponse est mesuré.


### EPIC-254 : Les agents sous mandat et les automatisations par règles

Les modules `assistant` (seconde moitié) et `automatisations` (code `M26`, à confirmer, spine Q-1). Les agents n'agissent que sous un catalogue de types d'action (seule une action non engageante et réversible peut être autonome), un mandat (délégation bornée, plafond cumulé réservé puis confirmé, durée maximale), et une exécution qui est une demande par événement, idempotente, annulable par compensation : l'assistant décide, il n'exécute pas, la sortie est un ordre et jamais une écriture dans la base d'un module. Un exécuteur, un compteur : `assistant`. Ce que chaque logiciel permet à un agent. Le moteur d'automatisation est un seul moteur pour les quatre logiciels : grammaire fermée (aucun code libre), règle avant modèle, le mode le plus strict par défaut (`SUGGESTION`, `VALIDATION`, `AUTO`, `AUTO_SOUS_MANDAT`), file d'arbitrage bornée avec décision groupée plafonnée, journal des déclenchements ; `AUTO` jamais pour un type engageant, refusé en assurance (`MODE_NON_PERMIS_ASSURANCE`). Repris des épics d'août : le catalogue des types d'action et le contrôle de mode (EPIC-101), les règles (EPIC-102), les trois modes, le mandat et l'interrupteur (EPIC-104), la file d'arbitrage (EPIC-105) restent le plan de construction de ce module ; ils se tirent renommés et étendus aux quatre logiciels et aux deux origines de l'annexe B. Les règles propres à chaque logiciel restent chez lui (distributeur : EPIC-242).

**FRs covered:** FR-127, FR-134 → FR-137

- **Spine :** AD-29, AD-30, AD-45, AD-46 ; spine de l'assistant AD-4 à AD-6, AD-10, AD-13 ; moteur AD-37 (commandes)
- **Dépôts :** `prospera-ia-service` (modules `assistant` et `automatisations`), `prospera-plateforme` (référentiel des types d'action, contrat des faits `action.executee` et `action.annulee`), modules exécutants (types d'action publiés par eux), `prospera-app` (`/assistant/mandats`, `/assistant/executions`, `/assistant/arbitrage`, `/automatisations`)
- **Dépend de :** EPIC-246, EPIC-247 (autonomie interdite) ; EPIC-253 ; EPIC-101, EPIC-102, EPIC-103, EPIC-104, EPIC-105 (existants : à tirer renommés) ; `STORY-365` (existant : droits tenant)
- **Fini quand :** Un type engageant ou irréversible en `AUTO` est refusé ; une exécution au-delà du plafond cumulé du mandat est refusée ; une exécution annulée est compensée ; une règle qui contient du code libre est refusée à l'enregistrement ; toute règle neuve est en `SUGGESTION` ou `VALIDATION` ; le mode `AUTO` est refusé en assurance ; sans module exécutant, le Copilot répond en lecture seule et l'agent n'a aucune action ; désinstaller suspend les règles et annule les exécutions en cours par compensation.

### EPIC-255 : La passerelle de langage, le modèle ouvert hébergé et `llama-server` sur l'instance

Les capacités de langage. En ligne, un seul chemin vers les grands modèles : la passerelle du service, qui seule détient les secrets des fournisseurs, masque les données, journalise avant chaque envoi, échoue fermée ; le modèle par défaut est un **modèle ouvert hébergé chez Money Vibes**, un fournisseur externe n'étant qu'une configuration (`ia.passerelle.modele.<capacité>`, zéro ligne de code). En local, un **modèle ouvert exécuté sur le serveur de l'instance par `llama-server`** (llama.cpp), service du projet Compose de l'instance démarré et surveillé par l'agent, interne, sans port entrant, activé au palier P1 et plus, mesuré au démarrage ; P0 (sans modèle de langage) est le défaut d'un serveur sans processeur graphique ; au démarrage l'instance mesure la machine, dit son palier et désactive en le disant ce qu'elle ne sert pas (`PALIER_INSUFFISANT`). Un modèle sans licence vérifiée n'entre pas au catalogue. L'empreinte matérielle publiée dimensionne le devis ; le coût d'inférence est maîtrisé (quotas, tourniquet). Sous le palier, la capacité rend son gabarit et la santé rend `DEGRADE`, sans jamais bloquer. Tâche : le client `openai` (API compatible) côté passerelle et côté serveur local ; les paquets GGUF se livrent d'abord par fichier, la ligne de modèles d'EPIC-258 les reprend ensuite ; test de fuite (aucun appel à un fournisseur hors passerelle) ; en essai et en réel, un `llama-server` sans état (question ouverte Q-3 de la spine). Repris des épics d'août : le port `LlmProvider` et les gabarits versionnés (EPIC-096).

**FRs covered:** FR-33 → FR-35, FR-41, FR-182, FR-183

- **Spine :** AD-24, AD-25, AD-26 ; spine de l'assistant AD-21 ; moteur AD-10 (Compose, l'agent seul aux commandes)
- **Dépôts :** `prospera-ia-service` (module `ia/passerelle`, adaptateur `llama-server`), `agent-instance` (démarrage, mesure du palier, surveillance), `prospera-plateforme` (paquets GGUF de la ligne de modèles, fiche de licence), infrastructure Money Vibes (modèle ouvert hébergé)
- **Dépend de :** EPIC-245 ; EPIC-096 (existant : `LlmProvider` et gabarits, repris) ; EPIC-148 (existant : l'agent) 
- **Fini quand :** Aucun appel à un fournisseur ne sort ailleurs que de la passerelle (inspection du trafic) ; un fournisseur se change par configuration sans toucher une ancienne proposition ; une instance sans processeur graphique démarre en P0 et le dit ; une instance P1 sert une capacité de langage par `llama-server` sans port publié ; un modèle sans licence vérifiée est refusé ; le modèle arrêté, la capacité rend son gabarit et `sante` rend `DEGRADE`.

### EPIC-256 : La boucle locale et la mesure : écarts, calibration nocturne, « qui avait raison »

Comment l'IA apprend sur l'instance et comment on sait si elle a raison. Chaque proposition laisse un écart (une paire prédiction et réalité sous une clé pseudonyme stable sur l'instance) ; les faits « prédiction » et « réalité » sont des contrats nommés, versionnés, testés des deux côtés, publiés par les modules (`<module>.realite.constatee@1`) ; le motif d'un écart est codé, jamais libre. Chaque nuit, une **calibration sœur** bornée par la fiche (poids, seuils et probabilités dans leurs bornes), en TypeScript sans Python, incrémentale, jamais en place, activée seulement si elle gagne contre l'active sur le jeu de validation de l'organisation et, pour un niveau visible, dans la **fenêtre du DSI** ; la calibration validée est intouchable par une promotion. Les règles N0 amorcent l'apprentissage ; le seuil de passage N0 vers N2 se mesure par capacité. Les objectifs mesurés par capacité, le champion et le challenger sur jeu d'évaluation figé, l'équité qui se mesure et bloque, le rapport mensuel local par capacité et par client, la dérive détectée, alertée, capable d'arrêter une promotion. **« Qui avait raison »** : chaque désaccord entre l'IA et l'humain est gardé, puis tranché par la réalité à son horizon (source unique : le pack de secteur), le classement (`IA_AVAIT_RAISON`, `HUMAIN_AVAIT_RAISON`, `INDECIDABLE`) est calculé une seule fois, sur l'instance ; le taux sur une période glissante, par capacité, agent, agence, client et en global, visible du responsable et de l'agent pour ses propres désaccords, sans usage disciplinaire ; l'**échantillon aveugle** (5 % par défaut, tiré par le service avant le choix du niveau, proposition masquée jusqu'à la décision) ; aucun score de crédit promu sur les seuls prêts accordés. Tâche : fait « réalité » ajouté aux manifestes des quatre logiciels (amendement C5, une PR par logiciel).

**FRs covered:** FR-6, FR-48, FR-51, FR-52, FR-56 → FR-60, FR-68 → FR-71, FR-73 → FR-75, FR-92

- **Spine :** AD-13 à AD-18, AD-35, AD-43, AD-48 ; moteur AD-16 (sauvegarde de la calibration), AD-22 (`fenetreDSI`), AD-39 (calibration intouchable)
- **Dépôts :** `prospera-ia-service` (module `ia` : `ecarts`, `desaccords`, `calibration`, `rapports`), `prospera-plateforme` (faits `ia.prediction.enregistree@1` et `<module>.realite.constatee@1`, vecteurs d'équité), les manifestes des quatre logiciels, `agent-instance` (la fenêtre du DSI lue de l'état voulu), `prospera-app` (`/ia/rapports`, `/ia/versions`)
- **Dépend de :** EPIC-248, EPIC-246 (registre) ; EPIC-151 (existant : promouvoir et revenir, fenêtre de mise à jour) ; EPIC-157 (existant : consentements et indicateurs de niveau 0) ; EPIC-153 (existant : la calibration se sauvegarde avec les données)
- **Fini quand :** Une proposition d'essai laisse un écart qui mûrit à son horizon sur une réalité définitive ; la recalibration de nuit est reprise après coupure et n'active rien hors bornes ni hors fenêtre du DSI ; une calibration qui perd contre l'active n'est pas activée ; le désaccord d'un agent est tranché et compté dans « qui avait raison », par agent et par agence ; l'échantillon aveugle est reproductible et sans effet ; une équité dégradée bloque une promotion ; le rapport mensuel local se lit par capacité.

### EPIC-257 : L'export « apprentissage » et le consentement : ce qui sort, et ce qui n'en sort jamais

La boucle commune vue de l'instance. La finalité « apprentissage commun », consentie au contrat par le DG ou son désigné écrit (`CONSENTEMENT_RESERVE_AU_DG`), la garde du registre des consentements entre l'IA et les données (compte de service en ligne, agent en local), la finalité « agrégats de mesure » pour la porte d'équité. Le niveau d'export « apprentissage », **à part des niveaux 0 à 3** du moteur : préparé sur l'instance par la bibliothèque unique de préparation du lot, écarts mûrs et définitifs seulement, agrégés avec un effectif minimal `k` par groupe, schéma fermé, sans texte libre, sans donnée de santé, sans pièce, sans son, pseudonyme salé propre à chaque envoi, table de correspondance qui ne quitte pas l'instance, montants par tranches ; un **jeton quotidien** remis par la centrale autorise l'envoi par le tunnel déclaré (destination sortante déclarée de l'agent : l'IA dépose, l'agent envoie) ; un manifeste type approuvé une fois au contrat, caduc au changement. Le retrait du consentement arrête l'usage futur ; un modèle déjà publié n'est pas désentraîné mais sa composition est tracée ; les transferts hors du pays sont déclarés et informés ; le croisement entre verticales est un horizon, et ce qu'un modèle n'apprend jamais est listé. Tâche : amendements du moteur (AD-9 destination sortante, AD-13 finalités, AD-14 niveau « apprentissage » et `approbationsExport`) portés avec leurs tests.

**FRs covered:** FR-7, FR-61, FR-76 → FR-82, FR-88

- **Spine :** AD-19, AD-20 (réception), AD-27, AD-48 ; moteur AD-9, AD-13, AD-14 (amendés)
- **Dépôts :** `prospera-ia-service` (dépôt du lot à l'agent, `EnvoiAgent`), `prospera-plateforme/preparation-lot` (bibliothèque unique), `agent-instance` (préparation, tunnel, jeton), `prospera-ia-centrale` (réception du jeton), `prospera-app` (`/ia/consentements`, `/ia/transferts`)
- **Dépend de :** EPIC-256 (écarts mûrs) ; EPIC-157 et EPIC-158 (existants : consentements, exports préparés et approuvés, niveaux 0 à 3 d'`apprentissage-service`) ; EPIC-149 (existant : chaîne de confiance)
- **Fini quand :** Contre le squelette de réception d'EPIC-258 (construit en premier dans cet épic), un lot d'écarts mûrs sort sans identité, au `k` minimal, sans texte libre ni santé ni pièce (test de lot) ; sans consentement ou sans jeton valide, rien ne part (`CONSENTEMENT_ABSENT`) ; en ligne, la garde du registre refuse une organisation non consentante ; le retrait du consentement arrête l'envoi suivant ; le tunnel ne joint que la destination déclarée ; aucun lot ne contient de son, de prix ni de marge de freelance.

### EPIC-258 : La centrale `prospera-ia-centrale`, la ligne de modèles et le plan de promotion

Le service qui n'existe que chez Money Vibes et n'est jamais installé chez un client (`:3418`). L'API de réception en NestJS (une seule implémentation de la vérification des clés, réutilisée de `prospera-plateforme`), par morceaux repris, clé d'idempotence, sans connexion à un autre service du poste central que la voie du jeton ; l'entraînement et l'évaluation en **Python 3.14**, à part (LightGBM, scikit-learn, Fairlearn, MLflow comme registre de modèles) ; le format de sortie est **ONNX**, exécuté dans le service par `onnxruntime-node` avec parité d'inférence testée ; un artefact par secteur, promu par l'alias de son secteur. La **ligne de modèles**, distincte de la ligne de la plateforme et de celle de l'agent : manifeste signé avec la classe d'effet de chaque artefact (`INVISIBLE`, `VISIBLE`, `COUPE_OU_RETOUR`), cadence, fenêtre N/N-1, même contenu par le réseau et par le fichier ; la signature par la famille `ci` sous l'usage `modele` (double signature pour une capacité qui touche une personne), validité vérifiée une seule fois à l'installation. Le **plan de promotion** (évaluation hors ligne, essai, ombre, canari, général ; `PROMOTION_ETAPE_MANQUANTE`), les portes écrites avant l'essai, le **retour arrière en une action** (couper ou revenir ; le correctif d'urgence ne peut que couper ou revenir ; commande `modele.revenir`), la conservation du modèle précédent 30 jours. Le premier modèle commun réellement entraîné n'arrive qu'après des écarts mûrs consentis (au plus tôt au second semestre 2027) ; jusque-là la centrale peut être un squelette (registre vide, publication désactivée, C10). Rapport mensuel global. Exploitation : sauvegarde 3-2-1, supervision par le moteur, clé de signature scellée, sans effet sur le service rendu. Tâches : amendements du moteur AD-3, AD-7, AD-12, AD-22, AD-28, AD-32, AD-37 (`cibleModeles`, incident de modèle, fichier d'urgence de modèle) portés avec leurs tests ; jeux de référence datés qui voyagent avec l'IA.

**FRs covered:** FR-47, FR-55, FR-62 → FR-67, FR-72, FR-83, FR-84

- **Spine :** AD-20, AD-21, AD-22, AD-23, AD-34, AD-44, AD-47, AD-49 ; moteur AD-3, AD-7, AD-12, AD-22, AD-28, AD-32, AD-37 (amendés)
- **Dépôts :** `prospera-ia-centrale` (réception NestJS, `entrainement/` et `evaluation/` Python), `prospera-ia-service` (installation, vérification, essai, ombre, canari, retour), `prospera-plateforme` (vecteurs signés, chaîne de clés), `agent-instance` (état voulu `cibleModeles` et `fenetreDSI`), CI de publication
- **Dépend de :** EPIC-257 (consentement et lot) ; EPIC-256 (ombre et non-régression) ; EPIC-149, EPIC-151, EPIC-156 (existants : chaîne de clés, promotion et retour, vagues et incidents) ; EPIC-158 (existant : contributions et modèle commun, niveaux 0 à 3) ; EPIC-153 (existant : sauvegarde)
- **Fini quand :** Un paquet de modèles se vérifie hors ligne (signature, usage `modele`, période de validité) et un modèle mal signé est refusé (`MODELE_REFUSE_SIGNATURE`) ; une promotion ne saute aucune étape ; un retour arrière se joue en une action, sous le délai du paramètre, sans perte ; un artefact `VISIBLE` sans interrupteur est refusé ; la centrale démarre vide et ne publie rien ; la sortie ONNX rend les mêmes propositions que l'entraînement (parité) ; le même contenu arrive par le réseau et par le fichier ; sans contact, les instances servent avec leur dernier modèle.

### EPIC-259 : Ajouter un secteur ou un pays sans rien perturber, et la voix du pack

Le socle est fermé à la modification et ouvert à l'ajout. Un secteur s'ajoute par un pack et, au plus, une extension de catalogue ; retirer un secteur, c'est désinstaller son pack. Les garde-fous propres à un secteur ne peuvent qu'ajouter ; les modèles et les calibrations d'un secteur sont versionnés à part ; la non-régression est obligatoire, champion et challenger par secteur, et la non-régression d'un candidat transverse rejoue tous les secteurs qui l'héritent ; l'apprentissage commun ne mélange les secteurs que pour des familles déclarées transverses ; une famille nouvelle est une extension versionnée du catalogue ; le démarrage à froid d'un secteur ; un pays est un référentiel (langue, devise, calendriers) ; la résidence des données et le rail de paiement se déclarent et ne se recodent pas ; le format est public et l'IA reste à Money Vibes (kit public) ; la liste de contrôle d'ajout d'un secteur ou d'un pays et son exemple (un cinquième pack en preuve du format). La **voix** est un réglage du pack (`ACTIVEE`, `BIENTOT`, `SANS_VOIX`) : saisie vocale de terrain de la microfinance au premier jour, transcrite sur l'instance par un modèle ouvert, jamais d'audio qui sorte, son supprimé après confirmation, consentement propre de l'agent, repli clavier, champs de décision interdits à la dictée ; assurance sans voix ; distributeur et cabinet « bientôt ». L'usage de la dictée dans la fiche et le rapport du soir reste dans EPIC-195 (microfinance).

**FRs covered:** FR-138, FR-160, FR-165 → FR-168, FR-170 → FR-174, FR-190

- **Spine :** AD-23, AD-28, AD-31 (voix), AD-47 ; moteur AD-43
- **Dépôts :** `prospera-ia-service` (module `ia/packs`, transcription locale), `prospera-plateforme` (`contrats/ia/pack`, kit public, liste de contrôle), `agent-instance` (le modèle de reconnaissance vocale du palier P1 et plus), `prospera-app`
- **Dépend de :** EPIC-248 (le format et les quatre packs) ; EPIC-258 (artefacts par secteur et non-régression) ; EPIC-255 (le modèle ouvert local) ; EPIC-195 (existant : la dictée côté microfinance)
- **Fini quand :** Un pack d'essai ajouté en suivant la liste de contrôle ne change aucune proposition d'un autre secteur (jeu de dossiers figés, écart nul) ; retirer son pack le retire sans toucher aux autres ; une dictée de microfinance se transcrit sur l'instance réseau coupé sans qu'aucun octet audio ne sorte, ne remplit jamais un champ de décision et se supprime après confirmation ; dans un pack `BIENTOT` ou `SANS_VOIX`, aucun emplacement de dictée ne capte (test d'écran) ; un pays ajouté par référentiel affiche sa langue, sa devise et ses calendriers sans code.

### EPIC-260 : L'exploitation de l'IA, la performance et la recette des parcours

L'IA exploitée comme le reste. Supervisée par sa route de santé (`OK` ou `DEGRADE` par capacité et par moteur) et par le signal fermé du moteur ; sauvegardée et restaurée avec les données (modèles, calibrations, registre, écarts ; perte maximale 1 h, reprise 4 h) ; sans contact avec Money Vibes, elle sert indéfiniment : gel, version figée, licence à vie, seul ce qui vient de Money Vibes s'arrête. Performances (propositions de règle et de modèle, Copilot et langage), disponibilité de l'IA et de ce qui en dépend, isolation entre organisations, entre secteurs et entre capacités, observabilité sans exporter rien de personnel, dimensionnement du matériel local (paliers), montée en charge en ligne (recette sur 50 organisations, calcul hors de la boucle d'événements), compatibilité et évolution des contrats (N et N-1, un champ ajouté est lu comme inconnu), accessibilité et lisibilité, résilience, et la conformité qui se prouve par des tests rejoués à chaque livraison. La recette : les parcours UJ-1 à UJ-11 rejoués de bout en bout sur le vrai backend, sans mock, et les sept vérifications d'installation (`registre-complet`, `jamais-bloquante`, `port-unique`, `aucun-port-entrant`, `sante-hors-instance`, `contrat-identique`, `equite`).

**FRs covered:** FR-10, FR-85 → FR-87, FR-175 → FR-177, FR-184, FR-185, FR-187 → FR-189

- **Spine :** AD-33, AD-35, AD-36, AD-37, AD-50 ; moteur AD-16, AD-30, AD-40
- **Dépôts :** `prospera-ia-service`, `agent-instance` (supervision, sauvegarde), `prospera-plateforme` (suite de contrat), `prospera-app`, `prospera-recette` (parcours croisés)
- **Dépend de :** EPIC-245 à EPIC-259 (les parcours qu'elle rejoue) ; EPIC-153 (existant : sauvegarde et restauration) ; EPIC-150 (existant : gel et licence) ; EPIC-160 (existant : démos du 15/01)
- **Fini quand :** Une restauration complète rejoue une instance dont la calibration, le registre et les modèles sont identiques à ceux d'avant ; à J+30 sans contact le gel bloque les mises à jour, jamais les propositions ; la suite de contrat passe à chaque livraison et rend les mêmes résultats en ligne et en local ; la recette de 50 organisations tient la latence mesurée pendant la nuit de recalibration ; les onze parcours UJ passent et les sept vérifications d'installation sont vertes.

### EPIC-261 : La feuille de route : « bientôt », « plus tard », « exclu » et l'horizon inscrits au catalogue, sans code

Ce qui n'est pas du premier jour est écrit, jamais simulé. Les capacités `BIENTOT`, `PLUS_TARD` et `EXCLU` sont des lignes du catalogue qui rendent `CAPACITE_BIENTOT` à tout appel ; aucun écran du premier jour n'appelle une capacité `BIENTOT`, seul le bouton « bientôt » s'affiche ; un statut se change par une publication du catalogue, sans déploiement du logiciel. La feuille de route classe chaque produit de la vision et lui donne sa fiche : Risque, Pulse, Météo des prix et de la demande, distribution en pilote automatique, facture certifiée qui vaut crédit, argent programmable sur PI-SPI, assurance embarquée, Relation client commune, passeport financier, agents métier à grande échelle, modèle de fondation sectoriel et transfrontalier ; les garde-fous de la vision s'appliquent à tous (aucune donnée individuelle publiée, plancher de vie, consentement révocable, identité partagée). Aucune ligne de code de ces produits n'est écrite ici. Le contrôle automatique à la publication du catalogue refuse une capacité dont le statut contredit les seize résolutions du PRD (FR-129).

**FRs covered:** FR-128, FR-146 → FR-159

- **Spine :** AD-6, AD-7 (une fiche chacune), AD-23, Deferred
- **Dépôts :** `prospera-ia-service` (catalogue), `prospera-plateforme` (fiches de l'horizon), `prospera-app` (bouton « bientôt »)
- **Dépend de :** EPIC-248 (le catalogue)
- **Fini quand :** Un appel à une capacité `BIENTOT` rend `CAPACITE_BIENTOT` et aucun appel réel ; le bouton « bientôt » s'affiche à la place de la capacité dans chacun des quatre logiciels ; une publication de catalogue qui contredit une résolution de FR-129 est refusée ; chaque produit de l'horizon a une fiche et un statut, sans PRD ni engagement de date.

## Ce qui n'est pas dans ces épics

- **Les fiches de stories** : écrites par celui qui code, juste avant de coder.
- **Les usages propres à chaque logiciel** : ils restent dans les épics de leur verticale, qui **dépendent** des épics ci-dessus et ne sont pas redécoupés ici : microfinance EPIC-190 (socle et IA du crédit) et EPIC-195 (IA du suivi, dictée dans la fiche, Copilot par rôle), assurance EPIC-217 et EPIC-218 (les quatorze usages du circuit sinistres), distributeur EPIC-242 (automatisations) et EPIC-243 (provenance des règles), cabinet EPIC-100 (rattachement d'un compte) et l'app de l'expert-comptable. **Ce qui change chez eux** : la ligne « service porteur à cadrer » devient `prospera-ia-service` (EPIC-245) et leur dépendance au socle devient EPIC-245 → 248 ; leurs épics sont à amender d'une ligne de dépendance (une PR à part, sans changer leur périmètre).
- **Les épics de l'assistant d'août (EPIC-095 → 105)** : leur réconciliation est dans la note en tête de `epics-assistant-ia-2026-08-16.md`. **Repris tels quels** : EPIC-099 (corpus légal et citation résolue) et EPIC-100 (mapping de comptes, qui porte FR-111). **Repris, renommés et étendus** : EPIC-095 (socle, EPIC-245), EPIC-096 (fournisseur de modèle, EPIC-255), EPIC-098 (audit à deux horloges, EPIC-246), EPIC-101, EPIC-102, EPIC-103, EPIC-104 et EPIC-105 (catalogue des types d'action, règles, évaluation, modes et mandat, arbitrage : le plan de construction d'EPIC-254). **Remplacé** : EPIC-097 (le contrat Proposition d'août), par le contrat unique d'EPIC-246.
- **Le conseil fiscal** : codé dans le service de balance sans porte d'installation, il y reste au premier jour (FR-111, X14 de FR-129) ; sa reprise par l'IA commune est à décider avec le PO après vérification du code.
- **Le choix du modèle de langage ouvert** (local et hébergé), les valeurs d'empreinte des paliers P0, P1 et P2 et la famille d'algorithmes de chaque N1 : à mesurer et à décider avec la première recette de langage et la première capacité N1 (spine, Deferred).
- **Le premier modèle commun réellement entraîné** : au plus tôt au second semestre 2027 ; EPIC-258 livre la chaîne qui le recevra, pas le modèle.
- **Le chatbot de messagerie, les langues locales, la voix du distributeur et du cabinet, le modèle de vision** : « bientôt », sans date (EPIC-261).
- **La machine d'IA à part gérée par l'agent** : dernier recours de dimensionnement, jamais livrée sans sa sauvegarde, sa supervision, son horloge et ses clés (spine, Deferred ; trou T-02 du moteur).
- **Les amendements à porter chez les voisins** (spine AD-39) : faits « prédiction » et « réalité » aux manifestes des quatre logiciels, renommages d'`assistant-service`, trois spines sœurs, annexe B du PRD, moteur (AD-3, AD-7, AD-9, AD-12, AD-13, AD-14, AD-17, AD-22, AD-28, AD-32, AD-37) : une série de PR à part ; les épics les supposent faits, et les tâches d'amendement sont citées dans EPIC-246, 256, 257 et 258.
- **La revue juridique et les actions du PO qui ne sont pas du code** (revue avant un score de crédit ou d'assurance, avis sur le taux « qui avait raison » par agent, analyse de ré-identification des lots, clauses entre institutions concurrentes) : conditions de mise en service d'une capacité (EPIC-247), pas du code.

