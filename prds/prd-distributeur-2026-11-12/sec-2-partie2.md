## 5. Partie 2 — Les modules propres au distributeur

Cette partie décrit sept modules qui n'existent que pour un distributeur ou un grossiste : Commande, Facturation, Approvisionnement, Opérations entrepôt, Conquête et objectifs, Studio réseaux sociaux, Réseau Freelance. Le front de démo `prospera-distributeur` les définit. Le PRD exige tout ce que la démo présente, mais en vrai : chaque action est enregistrée côté serveur et relue par les autres rôles. Aujourd'hui rien n'est enregistré.

Deux modules de cette partie sont ★ : le client de février en a besoin (Commande, Facturation). Les autres modules ★ (`paiement`, `recouvrement`, `pdv`, `catalogue`, `stock`, `terrain`) sont décrits aux parties 3 et 4. Les cinq autres modules de cette partie sont écrits en entier ; aucun ordre de livraison n'est figé (décision du PO du 2026-11-12 : on avance selon l'évolution).

Règles communes à tous les modules de cette partie :
- **Bouton « bientôt ».** Un bouton dont la capacité n'est pas branchée est visible, désactivé, et porte « bientôt », sans date (décision du PO du 2026-11-12). Jamais un bouton qui simule.
- **Emplacement déclaré vide.** Si un module dont on dépend n'est pas installé, la donnée s'affiche « non installé », jamais 0. Exemple : marge d'une commande quand le coût d'achat n'est pas disponible ; solde de trésorerie quand aucun module financier n'est installé.
- **Jeu de démonstration.** Les exemples chiffrés viennent du grossiste fictif « Grossiste du Golfe » : Lomé Port et dépôt Kara, zones Lomé Centre, Golfe Nord et Plateaux, 12 commerciaux dont 3 freelances, environ 600 points de vente, jus et boissons, XOF, TVA 18 %.
- **Moyens de paiement.** Tout encaissement passe par le module `paiement` (renvoi, partie 4) : PI-SPI et FedaPay, plus espèces et virement déclarés. Aucune exigence de cette partie ne se limite à PI-SPI.
- **Garde-fou.** Un paramètre par organisation qui BLOQUE une action, avec un code de refus nommé et un message lisible. Il n'est jamais seulement affiché.
- **Périmètre.** Un rôle ne lit que son périmètre, côté serveur. Une URL ou un appel direct hors périmètre est refusé.
- **Acteurs.** Les exigences nomment les rôles du §2.1, jamais un rôle inventé. Saisie d'une commande au bureau : tout rôle qui a le droit de saisir une commande (par défaut DC, RESP_VENTES, COMMERCIAL, COMPTABLE). Création et émission d'une facture : COMPTABLE et DAF. Confirmation de livraison : GEST_ENTREPOT ou l'agent de terrain qui accompagne la livraison. « Le bureau » désigne les rôles de bureau DC, RESP_VENTES et COMPTABLE. Le « magasinier » désigne le rôle GEST_ENTREPOT. Le conducteur d'un camion et le préparateur sont des données de l'organisation (FR-225), pas des rôles.
- **Freelance.** Le freelance vend pour le compte de la société (décision du PO du 2026-11-12) : le stock reste à la société jusqu'à la livraison au détaillant, il n'achète pas de stock. Le détail est au §5.7 et au parcours UJ-9 « Le freelance qui négocie ».

---

### 5.1 Commande (`commande`, M08) ★

**Dans la démo.** Trois écrans selon le rôle sur `/commandes` (`CommandesView.tsx`) : pilotage (DG, DC, DAF, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT), prise de commande terrain (COMMERCIAL, PROSPECTION) et « Mes commandes grossiste » (FREELANCE). Le pilotage affiche 8 chiffres, un pipeline `BROUILLON → VALIDEE → PREPARATION → LIVREE`, un flux par entrepôt et une file prioritaire. Le catalogue (`CatalogueView.tsx`, onglet de `/stock`) est en lecture seule. La disponibilité (`DisponibiliteView.tsx`) donne `DISPONIBLE`, `LIMITE` ou `RUPTURE` sans la quantité.
- **MORT ou absent :** valider, passer en préparation, annuler ou modifier une commande ; bon de livraison (aucun type `BonLivraison`) ; vérification du stock à la validation (cette validation n'existe pas) ; ligne de commande typée (le champ `lignes` est un entier) ; réservation du stock.
- **SIMULÉ :** « Nouvelle commande terrain » ouvre un panier gardé dans le navigateur. « Transmettre la commande » écrit une `CommandeTerrain` locale (`terrain-workflow.ts`) sans vérifier le stock, sans calculer la marge, sans rien envoyer. Le nom du point de vente est un texte libre. Le canal WhatsApp n'est qu'une étiquette.
- **Deux modèles de commande** (`Commande` du registre, `CommandeTerrain` du navigateur) ne se parlent pas. Le PRD n'en garde qu'un.
- **Chiffres à ne pas reprendre :** taux de service forcé (`+12`, plancher 72, plafond 99), marge brute tirée au hasard entre 12,8 et 18,2 %, plancher grossiste cité mais non codé.

**Ce que le module fait.** Un rôle qui a le droit de saisir une commande (DC, RESP_VENTES, COMMERCIAL, COMPTABLE) saisit une commande pour un point de vente. Le serveur fige le prix de chaque ligne depuis la grille de prix, vérifie le stock, puis, à la validation, contrôle le crédit du client (encours, plafond, blocage) et RÉSERVE le stock. Un bon de livraison est produit pour l'entrepôt. La commande terrain, la commande WhatsApp saisie, la vente au comptoir et la commande du bureau sont le même objet avec un canal différent. Une vente d'un freelance est aussi une commande de la société, servie par son stock (§5.7). Le module réalise UJ-1 (de la commande à la facture juste) et UJ-2 (la commande prise en visite).

**Objets.**
- **Commande** : `numero` (`CMD-AAAA-NNNNNN`, continu par organisation), `point_de_vente` (référence au module `pdv`, jamais un texte), `commercial`, `canal` (`BUREAU | TERRAIN | WHATSAPP | TELEPHONE | COMPTOIR`), `point_de_stock_source`, `date_livraison_souhaitee`, `conditions_reglement`, `montant_ht`, `montant_tva`, `montant_ttc`, `statut`, `motif_annulation`, `visite` (optionnelle), `id_client_appareil` (clé d'idempotence), `factures` (liste : une commande servie par deux bons peut avoir deux factures), `freelance` (rempli quand la vente est celle d'un freelance, §5.7). Champs lus, non saisis : `type_client` et `zone` (depuis `pdv`).
  - Statuts : `BROUILLON`, `TRANSMISE` (reçue du terrain ou de WhatsApp, pas encore validée), `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE`. `TRANSMISE` est ajouté aux 5 statuts de la démo (comportement par défaut, modifiable) ; le brouillon `BROUILLON` de la démo n'était jamais produit.
- **Ligne de commande** : `article`, `quantite_commandee`, `unite`, `prix_unitaire_ht` (figé à la saisie, toujours au prix de la société), `origine_du_prix` (`GRILLE_SOCIETE | PRIX_NEGOCIE_CLIENT`), `remise_pct`, `quantite_reservee`, `quantite_servie`, `quantite_livree`, `quantite_facturee`, `taux_tva`, `cout_unitaire` (si disponible), `lot` (optionnel, voir module `stock`). Le prix d'un freelance n'est jamais une ligne de commande vue de la société : il vit dans l'espace privé du freelance (FR-94, FR-96).
- **Bon de livraison** (le « bon de commande » du terrain) : `numero` (`BL-AAAA-NNNNNN`), `commande`, `point_de_stock`, `lignes` (article, quantité servie, quantité livrée, quantité refusée et motif, lot), `statut` (`EN_PREPARATION | EXPEDIE | LIVRE | AVEC_ECART | ANNULE`), `date_expedition`, `date_livraison`, `camion`, `livraison_confirmee_par`, `preuve_de_livraison`. Un bon annulé garde son numéro.
- **Réservation** : vit dans le module `stock` (Stock réservé). `commande` la demande et la libère ; il ne la stocke pas.

#### FR-30 : Créer une commande au bureau

Un rôle qui a le droit de saisir une commande (par défaut DC, RESP_VENTES, COMMERCIAL, COMPTABLE) peut créer une commande pour un point de vente de son périmètre : client, lignes, canal, date de livraison souhaitée. Réalise UJ-1.

**Conséquences (testables) :**
- Le point de vente se choisit dans une liste de son périmètre. Un texte libre est refusé. Un point de vente hors périmètre est refusé : `PDV_HORS_PERIMETRE`.
- Une commande exige un point de vente (décision du PO du 2026-11-12). Il n'y a pas de vente anonyme : la vente au comptoir se saisit sur le « client comptoir » générique de son point de stock (FR-221).
- Un prospect est un point de vente à l'état `PROSPECT` (module `pdv`). Une commande se saisit pour lui comme pour tout point de vente ; sa première commande passe sous le garde-fou de 1 500 000 XOF (FR-79).
- Le numéro `CMD-AAAA-NNNNNN` est attribué à l'enregistrement du brouillon. Il est unique et croissant dans l'organisation. Deux créations simultanées reçoivent deux numéros distincts.
- Une commande sans ligne ne peut pas quitter `BROUILLON` : `COMMANDE_SANS_LIGNE`.
- Une commande `BROUILLON` ne réserve aucun stock.
- Une commande créée par un commercial apparaît dans la liste de son superviseur et du bureau dans la minute, sans rechargement manuel. Le délai « dans la minute » est le critère de test par défaut, modifiable.

#### FR-31 : Ligne de commande typée et prix figé

Chaque ligne porte un article, une quantité, une unité et un prix unitaire HT lu dans la grille de prix du module `catalogue`. Le prix est figé sur la ligne à la saisie. Réalise UJ-1.

**Conséquences (testables) :**
- Ordre de recherche du prix : prix négocié du client (grille « ce client » du module `catalogue`, décision du PO du 2026-11-12), puis prix société. L'origine du prix est enregistrée sur la ligne.
- Une vente d'un freelance prend toujours le prix société sur la ligne de commande. Son propre prix de vente n'apparaît que dans son espace privé et sur sa facture au détaillant (FR-96), jamais sur une commande vue de la société. Les prix négociés propres à un client ne s'appliquent pas au prix freelance.
- Un article sans prix applicable est refusé : `ARTICLE_SANS_PRIX`.
- Un changement de grille après la saisie ne modifie pas une commande existante.
- Les totaux suivent FR-45 : `Σ lignes = HT` ; TVA calculée par taux sur le total HT (18 % au Togo, lu du paquet fiscal du pays) ; `TTC = HT + TVA` ; arrondis à l'unité XOF.
- Exemple de test : 10 caisses de jus d'orange 1 L à 6 000 XOF HT = 60 000 HT, 10 800 de TVA, 70 800 TTC.
- Une remise de ligne au-dessus du seuil de remise de l'organisation (paramètre) passe en validation d'un rôle supérieur : `REMISE_AU_DESSUS_DU_SEUIL`. Le seuil par défaut de ce garde-fou est 12 %, repris de la démo (`REMISE_SEUIL_DG`, combos), modifiable par organisation. La demande de remise est une décision du module `commande` (FR-14).

**Hors périmètre :** les paliers de volume et les promotions automatiques (ils vivent dans la grille du module `catalogue`).

#### FR-32 : Vérifier le stock avant validation

À la saisie de chaque ligne, le module interroge le module `stock` et affiche la disponibilité. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Pour les rôles de bureau qui saisissent une commande (DC, RESP_VENTES, COMPTABLE) et pour le responsable stock : la quantité disponible (stock moins Stock réservé) du Point de stock source est affichée.
- Pour un commercial ou un freelance : seul le statut est affiché, sans quantité. `RUPTURE` si le disponible est 0 ou moins. `LIMITE` si le disponible est inférieur ou égal au seuil de l'article (même définition que FR-61). `DISPONIBLE` sinon.
- Le statut se calcule sur le Point de stock source du client, pas sur la somme des entrepôts. (La démo consolidait tout le réseau.)
- Un article `RUPTURE` ne peut pas être ajouté à une commande terrain. Au bureau, la saisie reste possible mais la validation est refusée (FR-33).
- Si le module `stock` n'est pas installé, la disponibilité affiche « non installé » et la validation est refusée : `STOCK_NON_INSTALLE`. La commande ne se valide jamais sur un stock inconnu.

#### FR-33 : Valider une commande avec contrôles

Un rôle de bureau qui a le droit de valider (par défaut DC, RESP_VENTES, COMPTABLE), ou un superviseur, peut valider une commande `BROUILLON` ou `TRANSMISE`. Le serveur applique trois contrôles avant de passer à `VALIDEE`. Réalise UJ-1.

**Conséquences (testables) :**
- **Stock.** Chaque ligne doit avoir un disponible suffisant. Sinon `STOCK_INSUFFISANT`, avec la ligne et la quantité disponible. Le validateur peut réduire la ligne ou accepter une livraison partielle (FR-41).
- **Crédit bloqué.** Un client dont le crédit est bloqué (module `recouvrement`, partie 3 : créance échue depuis plus de 60 jours ou encours au-delà du plafond) est refusé : `CREDIT_BLOQUE`. Ce contrôle passe en premier. Il n'y a pas d'autre seuil de retard dans `commande` : le refus à 45 jours de la démo n'est pas repris. Cette règle est nouvelle : dans la démo, le blocage de crédit ne changeait rien.
- **Plafond de crédit.** `encours = créances ouvertes + commandes validées non encore facturées − crédit du tiers` (FR-52). Si `encours + TTC de la commande` dépasse le plafond de crédit du client (module `pdv`), la validation est refusée : `PLAFOND_CREDIT_DEPASSE`. Lors d'une modification (FR-35), la commande elle-même n'est pas comptée deux fois. Test : plafond 1 000 000, deux validations simultanées de 600 000 : une réussit, l'autre reçoit `PLAFOND_CREDIT_DEPASSE`.
- Plafond par défaut quand le client n'en a pas : `max(400 000 XOF, 0,6 × CA mensuel du client)`. Formule par défaut, paramétrable par organisation et remplacée par le plafond propre du client dès qu'il existe (reprise Sage) ; elle reprend la règle de la démo (`picking-engine.ts:36-45`). Le client comptoir (FR-221) est au comptant : aucune commande à crédit.
- Par défaut, les rôles autorisés à déroger à un refus de plafond sont le DG et le DAF ; le droit est attribuable à d'autres rôles. La dérogation exige un motif et elle est tracée (qui, quand, motif, montant). Un crédit bloqué ne se lève pas par dérogation : son déblocage suit la procédure du recouvrement (DAF, jamais automatique).
- La priorité affichée sur une commande (`HAUTE`, `NORMALE`, `BLOQUEE`) est dérivée du score de priorité (table de 5.1) : `BLOQUEE` si un contrôle refuse ou si le crédit est bloqué ; `HAUTE` si le score est d'au moins 70 (défaut, paramètre) ; sinon `NORMALE`. Une alerte courte s'ajoute si une créance échue existe (ex. « créance 340 K, livraison sous réserve »).
- Un commercial ne peut pas valider sa propre commande. Il la transmet.
- La validation est atomique : si un contrôle échoue, aucune réservation n'est posée.
- Un rôle sans le droit de valider ne voit pas le bouton. Un appel direct est refusé : `ROLE_NON_AUTORISE`.

#### FR-34 : Réserver le stock à la validation

À la validation, le module demande au module `stock` de réserver chaque ligne sur le Point de stock source. Réalise UJ-1.

**Conséquences (testables) :**
- Après validation, `disponible = stock − Stock réservé` baisse de la quantité réservée, pour tous les rôles qui lisent le stock.
- Une réservation est posée pour la quantité servable de chaque ligne. Elle ne dépasse jamais le disponible.
- Deux validations simultanées sur le dernier stock : une réussit, l'autre reçoit `STOCK_INSUFFISANT`.
- L'annulation d'une commande `VALIDEE` ou `PREPARATION` libère la réservation immédiatement.
- La sortie de stock est écrite quand le chargement est validé (bon `EXPEDIE`, FR-70) : la réservation devient un mouvement de sortie dans le module `stock`. La livraison confirme ensuite les quantités livrées et déclenche la facture (FR-42).
- Une commande `VALIDEE` non préparée au bout de N jours est signalée au bureau ; la réservation n'expire pas toute seule. N = 7 jours par défaut (paramètre) ; il n'y a pas d'expiration automatique : la réservation reste jusqu'à décision du bureau (comportement par défaut, modifiable).
- Si le crédit du client est bloqué après la validation, la réservation reste posée jusqu'à l'annulation de la commande ou au déblocage du crédit. Au-delà de 7 jours (défaut, paramètre), une alerte va au responsable des ventes. La préparation de cette commande est suspendue (FR-68).
- La réservation se fait à la validation ; l'allocation du matin par priorité ne porte que sur les commandes en attente de stock (FR-220, décision du PO du 2026-11-12).

**Hors périmètre :** la réservation des lots promotionnels (combos stock, marketing).

#### FR-35 : Modifier ou annuler une commande

Le propriétaire de la commande ou un rôle de bureau (DC, RESP_VENTES, COMPTABLE) peut modifier une commande `BROUILLON`, `TRANSMISE` ou `VALIDEE` non commencée. Seul un rôle de bureau peut l'annuler. L'annulation d'une commande `VALIDEE` passe ses bons à `ANNULE` ; un bon annulé garde son numéro.

**Conséquences (testables) :**
- Une commande `PREPARATION` ou au-delà n'est pas modifiable : `COMMANDE_NON_MODIFIABLE`. Elle peut être annulée par un responsable stock avec motif, ce qui libère les quantités non encore sorties.
- Modifier une commande `VALIDEE` annule la réservation, applique de nouveau FR-33, puis réserve de nouveau. Si un contrôle échoue, la commande garde son état précédent.
- L'annulation exige un motif parmi une liste (client annule, erreur de saisie, rupture, plafond de crédit, autre avec texte). Le motif est enregistré avec l'auteur et l'horodatage.
- Une commande facturée ne s'annule pas : on émet un avoir (FR-48).
- Toute modification est dans un historique en lecture seule : champ, ancienne valeur, nouvelle valeur, auteur, date.

#### FR-36 : Produire le bon de livraison

À la validation, le module crée le bon de livraison que l'entrepôt prépare. C'est **sur ce bon que le camion sort** de l'usine ou de l'entrepôt ; sur le terrain, on l'appelle aussi « bon de commande » (PO, 2026-11-12). Le bon est imprimable en PDF. Réalise UJ-1.

**Conséquences (testables) :**
- Un bon `BL-AAAA-NNNNNN` est créé pour chaque Point de stock source concerné. Une commande servie par deux points de stock a deux bons.
- Le bon liste les articles, les quantités à servir et les lots. Il ne montre ni prix, ni marge, ni plafond.
- Le bon passe à `EXPEDIE` quand le chargement est validé (FR-70), puis à `LIVRE` quand la livraison est confirmée par le GEST_ENTREPOT ou par l'agent de terrain qui accompagne la livraison. La commande passe à `LIVREE` quand tous ses bons sont `LIVRE`.
- Les quantités réellement servies (préparées) remplacent les quantités à servir. Un écart (servi inférieur à commandé) met le bon `AVEC_ECART` et ouvre un reliquat (FR-41).
- À la confirmation de livraison, la quantité livrée de chaque ligne est saisie. Une quantité refusée à la porte (casse, produit abîmé) porte un motif ; elle revient en entrée de stock, à confirmer par le GEST_ENTREPOT. La facture porte les quantités livrées confirmées (FR-42).
- La confirmation de livraison se saisit aussi hors connexion dans l'application terrain (file d'envoi, partie 3).
- Le bon est le seul document qui déclenche la sortie de stock.
- Un PDF du bon se télécharge avec la mention « Bon de livraison » et la signature du destinataire. Par défaut, la preuve de livraison de février est une photo du bon signé ; la signature à l'écran est « bientôt ».
- Pour une vente d'un freelance, le bon est celui de la société (son stock, sa sortie) ; il ne porte aucun prix, ni celui de la société ni celui du freelance.

#### FR-37 : Commande terrain (« Nouvelle commande terrain »)

Un commercial, un freelance ou un chargé de prospection peut créer une commande depuis la tournée, pour un client de son portefeuille. Réalise UJ-2.

**Conséquences (testables) :**
- « Nouvelle commande terrain » ouvre un formulaire : point de vente du portefeuille (liste), lignes choisies dans le catalogue avec la disponibilité de FR-32, canal.
- L'ajout d'un article propose la quantité et l'unité de vente (catalogue) ; la quantité 0 retire la ligne.
- Le panier d'un agent est un brouillon gardé sur l'appareil, non transmis. Il survit à la coupure du réseau et au redémarrage de l'appareil. Il n'est pas visible du serveur avant la transmission ; il devient `TRANSMISE` à l'envoi (file d'envoi, partie 3).
- Le bouton « Transmettre » enregistre la commande côté serveur à l'état `TRANSMISE`. Elle apparaît dans la file du bureau. Le commercial la voit avec son statut, qui change quand le bureau la valide.
- La commande porte le lien vers la visite en cours si elle existe (module `visites`, partie 3). La clôture de visite affiche le montant réel de la commande, pas une saisie libre.
- Une transmission répétée avec le même `id_client_appareil` ne crée qu'une commande (idempotence). Ceci est indispensable pour l'application terrain hors connexion (partie 3, M12).
- Le contrôle de plafond de FR-33 s'affiche en avertissement dès la saisie ; le blocage a lieu à la validation du bureau.
- Un commercial ne voit ni la marge de la société, ni la priorité « BLOQUÉE IA » d'autres clients (écart de la démo : la carte de commande exposait la marge brute).
- Un freelance saisit sa vente de la même façon. Il voit aussi, dans son espace privé, son prix de vente par ligne (FR-93) ; la commande transmise à la société ne porte que le prix société.

**Hors périmètre de cette exigence :** la saisie hors connexion et la synchronisation, exigées par l'application terrain Flutter `prospera-terrain` (partie 3, M12). Ici : le contrat d'idempotence que l'application utilise.

#### FR-38 : Commande WhatsApp

Un rôle qui a le droit de saisir une commande (DC, RESP_VENTES, COMMERCIAL, COMPTABLE) peut enregistrer une commande reçue par WhatsApp en choisissant le canal `WHATSAPP`. Réalise UJ-1.

**Conséquences (testables) :**
- Le canal `WHATSAPP` est une valeur de la commande. La commande suit ensuite le même cycle que toute autre.
- Le message d'origine peut être collé dans un champ « message du client » et reste attaché à la commande. Sa conservation suit les règles du PRD notification §9.2 (décision du PO du 2026-11-12).
- La réception automatique du message, son analyse et la proposition des lignes ne font pas partie de février. Le bouton « Créer depuis un message WhatsApp » est affiché désactivé avec « bientôt » : la fonction dépend du connecteur de réception WhatsApp du module `notification` (règle du PO « bouton pas encore branché = bientôt » ; Connecteurs hors février).
- L'envoi de la confirmation de commande au client par WhatsApp passe par le module `notification`, comme l'envoi de la facture (FR-47). La confirmation se télécharge aussi en PDF.

#### FR-39 : Prix société, prix freelance et marge

Le module calcule la marge de chaque commande à partir des lignes. Réalise UJ-1.

**Conséquences (testables) :**
- `marge = Σ (prix_unitaire_ht − cout_unitaire) × quantité`, et `marge_pct = marge / montant_ht`. Le coût vient du module `stock` (coût d'achat moyen).
- Sans coût disponible pour au moins une ligne, la marge affiche « non calculable » avec la ligne en cause, jamais 0 et jamais un pourcentage par défaut.
- La marge est visible des rôles qui ont le droit « voir la valeur commerciale » : DG, DC, DAF, CONTROLE_GESTION. Le responsable stock, le magasinier, le commercial et le freelance ne la voient pas. Droits par défaut (modifiables par rôle) : le responsable stock n'a pas le droit « voir la valeur commerciale » (`perimetre-logistique.ts`) ; la démo se contredisait, la règle du moindre droit est appliquée aussi au catalogue.
- Pour une vente d'un freelance, la marge de la société se calcule sur le prix société. La société ne voit que le prix société. Le prix que le freelance facture à son détaillant est enregistré dans l'espace privé du freelance ; aucun écran ni aucune réponse du serveur destinés à la société ne le contient (FR-94).
- La marge moyenne d'une période est pondérée par le montant HT, pas une moyenne simple.

#### FR-40 : Suivre les commandes (pilotage) avec des chiffres réels

Un DG, un DC, un responsable des ventes ou un superviseur voit le pipeline des commandes de son périmètre. Réalise UJ-1.

**Conséquences (testables) :**
- Les 8 chiffres de la démo (volume du jour, panier moyen, marge brute moyenne, en préparation, priorité, bloquées crédit, enseignes, lignes totales) sont calculés sur les commandes enregistrées. Aucune constante.
- Le pipeline compte les commandes par statut (`BROUILLON`, `TRANSMISE`, `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE`). Un clic sur un statut filtre la liste.
- Le taux de service = lignes servies / lignes commandées sur la période, sans ajustement. (La formule de la démo `+12` est supprimée.)
- Le périmètre est appliqué côté serveur : commercial et freelance = leurs commandes ; superviseur = sa zone ; responsable des ventes = ses zones ; magasinier = bons de préparation de son entrepôt, sans le carnet de commandes.
- Une zone sans commande affiche 0 commande. Un module non installé affiche « non installé ».
- Le pilotage affiche aussi : le flux par point de stock (commandes, en préparation, bloquées crédit, taux de service, charge de préparation = lignes à préparer / capacité du jour, FR-69) ; la répartition du volume par type de client (`DEPOT`, `GROSSISTE`, `SUPERETTE`, `ENSEIGNE`, `EPICERIE`, `KIOSQUE`, lu de la fiche du point de vente) et par zone ; la file prioritaire (6 commandes).
- La file prioritaire du pilotage est triée par : montant en millions + 100 si bloquée crédit + 50 si priorité haute + 30 si en préparation + 20 si magasin propre (règle de la démo, paramètres). Le score du bon de préparation (FR-68) est un second score, celui de l'entrepôt.

#### FR-41 : Livraison partielle et reliquat

Quand le servi est inférieur au commandé, le responsable stock ou un rôle de bureau (DC, RESP_VENTES, COMPTABLE) décide du reliquat.

**Conséquences (testables) :**
- Le reliquat d'une ligne (commandé moins servi) est proposé : `LIVRER_PLUS_TARD` (nouveau bon quand le stock arrive) ou `ANNULER_LE_RELIQUAT`.
- `LIVRER_PLUS_TARD` met le reliquat « en attente de stock ». Il garde la réservation ouverte sur les quantités à venir si elles sont attendues (commande fournisseur en cours) ; sinon il attend sans réserver. Les reliquats en attente sont servis par l'allocation du matin (FR-220).
- La facture ne porte que les quantités livrées confirmées (FR-42).
- Une commande dont tout le reliquat est annulé et dont tous les bons sont `LIVRE` passe à `LIVREE`.
- Un reliquat en attente depuis plus de 15 jours (délai par défaut, paramètre) est annulé automatiquement, avec une alerte au rôle qui a validé la commande.

#### FR-220 : Allocation du matin des commandes en attente de stock

Chaque matin, le module alloue le stock disponible aux commandes en attente de stock, par score de priorité décroissant. La réservation des commandes validées reste posée à la validation (FR-34) : l'allocation ne la remet jamais en cause (décision du PO du 2026-11-12). Réalise UJ-1.

**Conséquences (testables) :**
- L'allocation ne porte que sur les lignes en attente de stock : reliquats `LIVRER_PLUS_TARD` (FR-41) et lignes validées sans réservation. Une ligne déjà réservée n'est ni dé-réservée ni reclassée.
- Ordre : score de priorité de la table de 5.1, puis date de validation la plus ancienne en cas d'égalité.
- Une commande dont le crédit est bloqué n'est pas allouée ; elle reste en attente.
- Une allocation pose une réservation (FR-34) et crée un nouveau bon de livraison (FR-36). Elle peut être partielle ; elle ne dépasse jamais le disponible du Point de stock.
- Heure de l'allocation : 06:00 par défaut, paramètre de l'organisation. Un rôle de bureau peut la relancer à la main après une réception.
- Exemple de test : deux reliquats de 30 et 20 caisses, scores 80 et 60, 40 caisses reçues : 30 vont au premier, 10 au second, 10 restent en attente.
- L'ordre de PRÉPARATION du carnet est un autre sujet : il suit le score et la capacité du jour (FR-68, FR-69).

#### FR-221 : Client comptoir générique par point de stock

Chaque point de stock a un « client comptoir » générique, qui porte la vente au comptoir (décision du PO du 2026-11-12). Réalise UJ-1.

**Conséquences (testables) :**
- Le client comptoir est créé dans `pdv` à la création du point de stock, au nom « Client comptoir {point de stock} ». Il ne se supprime pas.
- Une vente au comptoir est une commande de canal `COMPTOIR` sur ce client. Elle suit le même cycle ; la remise au comptoir confirme la livraison (GEST_ENTREPOT) et la facture suit (FR-42).
- Le client comptoir est au comptant : aucune commande à crédit, aucun plafond. L'encaissement passe par `paiement`.
- Un acheteur qui demande une facture à son nom (avec son NIF) est saisi comme point de vente ; il ne passe pas par le client comptoir.
- Le client comptoir n'entre ni dans un portefeuille, ni dans les tournées, ni dans les classements de points de vente.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Statut de disponibilité | `RUPTURE` si stock ≤ 0 ; `LIMITE` si stock ≤ seuil (la démo disait « < », aligné sur FR-61) ; sinon `DISPONIBLE` | seuil par article | `DisponibiliteView.tsx:25-29` |
| Blocage crédit | créance échue depuis plus de 60 j OU encours > plafond (la démo disait 45 j : non repris, décision du PO du 2026-11-12) | 60 j : oui | `picking-engine.ts:36-45` ; FR-119 |
| Plafond par défaut | `max(400 000, 0,6 × CA mensuel)` | oui | idem |
| TVA | 18 % au Togo, lu du paquet fiscal du pays, calculé par taux sur le total HT | par pays, voir FR-45 | `proforma-builder.ts:14` |
| Score de priorité d'une commande | base 50 ; +30 priorité haute ; −40 bloquée ; +15 client à risque ; +10 client fidèle ; −10 créance > 30 j ; +10 montant > 5 M ; +8 validée ; borné 0 à 100 | non en février | `picking-engine.ts:176-196` |
| Alerte « pic de préparation » | volume en préparation > 15 M XOF | oui | `commandes-dg-builder.ts:73` |
| Marge | `(prix − coût) / prix`, pondérée par le montant | non | nouvelle (la démo la tirait au hasard) |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Tuile du pipeline, filtre de zone, « Tout afficher » | LECTURE (filtre local) | FR-40 |
| Nouvelle commande terrain | SIMULÉ (panier local) | FR-37 |
| Panier : −, +, corbeille, Vider | SIMULÉ (navigateur) | FR-37 |
| Canal En visite / WhatsApp / Téléphone | SIMULÉ (étiquette) | FR-37 et FR-38 |
| Transmettre la commande | SIMULÉ (aucune vérification) | FR-37 |
| Ajouter (disponibilité) | SIMULÉ | FR-32 et FR-37 |
| Valider la commande | n'existe pas | FR-33 |
| Annuler, modifier | n'existent pas | FR-35 |
| Bon de livraison : générer, imprimer | n'existe pas | FR-36 |
| (absent) Confirmer la livraison, saisir les quantités livrées | n'existe pas | FR-36 |
| (absent) Vente au comptoir | n'existe pas | FR-221 |
| Créer depuis un message WhatsApp | n'existe pas | bientôt |
| Signature du destinataire à l'écran | n'existe pas | bientôt |

**Notes.**
- **Tranchée (PO, 2026-11-12).** Les prix propres à chaque client (reprise de février) vivent dans une grille « ce client » du module `catalogue` (amendement du PRD catalogue, partie 4). Une catégorie de client à un seul membre n'est pas retenue : elle multiplierait les catégories pour des centaines de prix négociés. Ce module consomme le prix, il ne le stocke pas.
- **Tranchée (PO, 2026-11-12).** La facture naît à la livraison, sur les quantités livrées confirmées (FR-42) ; le camion sort sur le bon émis à la validation. Facturer dès `VALIDEE` reste un paramètre de l'organisation (comportement par défaut : livraison).
- **Tranchée (PO, 2026-11-12).** Les consignes de bouteilles et de casiers sont hors v1. Un casier rendu n'est ni un avoir ni un paiement.
- Par défaut, une seule adresse de livraison par client : celle du point de vente (comme la démo) ; plusieurs adresses = évolution.
- Aucune commande ne se crée sans Organisation, Rôle et Périmètre résolus par le socle ; la commande lit ses acteurs dans `reseau` et ses clients dans `pdv`.

---

### 5.2 Facturation, proformas et e-facture (`facturation`, M09) ★

**Dans la démo.** `/facturation` a trois onglets (`FacturationShell.tsx`) : Factures et créances (8 chiffres, top clients impayés, grille tarifaire par type de client, fiche facture), Proformas (6 chiffres, builder, score d'acceptation), E-facturation et avoirs (file de transmission, rejets, 3 avoirs).
- **Aucune action d'écriture sur une facture** dans l'onglet des factures : ni envoyer, ni imprimer, ni encaisser, ni créer un avoir.
- **SIMULÉ :** « Convertir en commande » fabrique deux références (`CMD-` et `FAC-`) sans rien créer ; « Relancer » une proforma incrémente un compteur ; « Envoyer au client » écrit une proforma locale ; « Imprimer / PDF » appelle `window.print()` ; « Corriger et retransmettre » ne corrige rien.
- **Statut e-facture DÉRIVÉ** de l'ancienneté de l'impayé (`efacture-builder.ts:41-48`), pas reçu d'une plateforme. Le hash et le QR sont factices.
- **Numérotation :** `FAC-2026-NNNN` avec l'année figée à 2026 ; compteur local, ni global ni transactionnel.
- **Données incohérentes :** les lignes d'une facture ne rejoignent pas son montant (`FAC-2026-8821` : lignes 3 450 000, montant 2 840 000) ; HT, TVA et TTC sont déclarés mais non renseignés ; marge 15 % par défaut ; NIF et RCCM de l'émetteur écrits en dur dans le composant (`DocumentPreview.tsx:284`).
- **Mentions absentes du modèle :** NIF, RCCM et adresse du client ; adresse du siège, capital, régime fiscal, coordonnées de paiement de l'émetteur ; pénalités de retard ; numéro de commande et de BL ; signature et cachet.
- **Rôles :** onglet factures pour DG, DC, DAF, COMPTABLE, RECOUVREMENT ; proformas pour la force de vente ; e-facture pour DG, DAF, COMPTABLE. CONTROLE_GESTION a la route mais aucun onglet (écran vide).

**Ce que le module fait.** Il émet les factures, les avoirs et les proformas. Une facture se crée depuis une commande en un clic. Elle reçoit un numéro continu qui reprend la suite de Sage. Elle porte toutes les mentions légales et la TVA du paquet fiscal du pays (18 % au Togo). Elle s'imprime, se télécharge en PDF et s'envoie par e-mail et par WhatsApp. Le module publie ses faits (facture émise, avoir émis) ; le module `paiement` ouvre et réduit la Créance en les consommant (registre unique, décision du PO du 2026-11-12 ; renvoi : partie 4 ; la Créance est un objet commun décrit en partie 3). `facturation` dépend en dur de `paiement` : sans lui, aucun reste dû n'existe et le module ne s'installe pas. Le module donne la balance clients et la balance âgée, comme vues qui lisent les Créances de `paiement`. Il porte aussi la reprise des factures impayées à la bascule et la facture émise par un freelance (FR-224). L'e-facture (certification OTR) est visible mais « bientôt » tant que la plateforme n'est pas branchée. Le module réalise UJ-1.

**Objets.**
- **Facture** : `numero`, `serie`, `emetteur` (l'Organisation, ou un freelance pour FR-224), `client` (point de vente), `commande`, `bons_de_livraison`, `date_emission`, `date_echeance`, `conditions_reglement`, `lignes`, `montant_ht`, `montant_tva` (par taux), `montant_ttc`, `statut`, `origine` (`EMISE_PROSPERA | REPRISE`), `pdf` (fichier figé), `envois`. Champs lus, non stockés par `facturation` : `montant_avoirs`, `montant_encaisse`, `reste_du` (depuis la Créance tenue par `paiement`), `zone`, `commercial`, `type_client` (depuis `pdv` et `commande`), `nb_relances` (depuis `recouvrement`), `date_dernier_encaissement` (depuis `paiement`).
  - Statuts : `BROUILLON`, `EMISE`, `PARTIELLE`, `PAYEE`, `ANNULEE_PAR_AVOIR`. `PARTIELLE` et `PAYEE` se déduisent de la Créance. `EN_RETARD` n'est pas un statut : c'est un calcul (échéance dépassée et reste dû supérieur à 0).
- **Ligne de facture** : `article`, `designation`, `quantite`, `unite`, `prix_unitaire_ht`, `remise_pct`, `taux_tva`, `total_ht`, `commande_ligne`.
- **Avoir** : `numero` (`AV-AAAA-NNNNNN`), `facture`, `motif`, `lignes`, `montant_ht`, `montant_ttc`, `date`, `statut` (`EMIS | IMPUTE | REMBOURSE`).
- **Proforma** : `numero` (`PRO-AAAA-NNNNNN`), `client`, `commercial`, `date_emission`, `date_validite`, `lignes`, `remise_globale_pct`, `montant_ht`, `montant_tva`, `montant_ttc`, `conditions_reglement`, `statut` (`BROUILLON | ENVOYEE | VUE | ACCEPTEE | REFUSEE | EXPIREE | CONVERTIE`), `probabilite_acceptation` (0-100), `canal_envoi` (`WHATSAPP | EMAIL | SMS | IMPRESSION`), `relances_envoyees`, `commande`.
- **Suite de numérotation** : `serie`, `emetteur` (l'Organisation ou un freelance), `format`, `dernier_numero_attribue`, `dernier_numero_repris` (Sage), `date_reprise`.
- **E-facture** : `facture`, `statut` (`NON_TRANSMISE | EN_ATTENTE | TRANSMISE | CERTIFIEE | REJETEE`), `numero_certification`, `date_transmission`, `motif_rejet`, `tentatives`, `plateforme`, `archive`.
- **Créance** : objet commun de la partie 3, tenu par `paiement` seul. `paiement` l'ouvre en consommant le fait « facture émise » et la réduit en consommant le fait « avoir émis » et les Encaissements. `facturation` ne tient aucun solde propre.
- **Crédit du tiers** : tenu par `paiement` (partie 3). Avance, acompte, trop-perçu ou avoir sur facture déjà payée ; imputé ensuite sur une Créance ou remboursé.

#### FR-42 : Créer la facture depuis la commande, en un clic

Un COMPTABLE ou un DAF peut créer et émettre la facture d'une commande en un clic. Réalise UJ-1.

**Conséquences (testables) :**
- Le bouton « Facturer » est actif sur une commande `LIVREE` ou sur un bon `LIVRE` non encore facturé. (Décision du PO du 2026-11-12 : la facture naît à la livraison ; une option par organisation permet de facturer dès `VALIDEE`.)
- Les lignes de la facture reprennent les quantités livrées confirmées (FR-36), les prix figés de la commande et le taux de TVA de chaque article. L'utilisateur ne retape rien. Une quantité refusée à la porte n'est pas facturée.
- Un deuxième clic sur la même commande ne crée pas de deuxième facture : il ouvre la première (idempotence).
- Une facture peut couvrir une livraison partielle. Le reliquat livré plus tard donne une seconde facture. Le lien commande ↔ factures est visible dans les deux sens.
- La facture est créée `BROUILLON`, puis émise (FR-43) dans la même action si toutes les mentions légales sont complètes (FR-44).
- Si le module `commande` n'est pas installé, le bouton n'existe pas et la facture se saisit à la main (lignes libres). Comportement par défaut : la saisie manuelle sert à la reprise et à ce cas. Avec `commande` installé, la vente au comptoir passe par une commande sur le client comptoir (FR-221).
- Pour une vente d'un freelance, la livraison donne la facture du freelance à son détaillant (FR-224) et le relevé de ce qu'il doit à la société (FR-96). La société n'émet pas de facture au détaillant.

#### FR-43 : Numérotation continue qui reprend la suite de Sage

Le DAF peut déclarer à la bascule le dernier numéro de facture émis sous Sage. La première facture Prospera porte le numéro suivant. Réalise UJ-1.

**Conséquences (testables) :**
- Avant la déclaration, l'émission d'une facture est refusée : `NUMEROTATION_NON_INITIALISEE`.
- Le format est un paramètre de l'organisation : préfixe, année optionnelle, largeur du numéro. Décidé par le PO (une série par organisation, continue, reprenant Sage) : le format est saisi à la bascule d'après la dernière facture Sage, car le format exact est inconnu avant les exports Sage. Largeur par défaut : facture 4 chiffres, avoir et proforma 6 chiffres ; la largeur est un paramètre de série.
- L'année du format est celle de la date d'émission ; le compteur ne repart pas à 1. Exemple de test : dernier numéro Sage `FAC-2026-0412` ; première facture Prospera émise le 01/02/2027 : `FAC-2027-0413`.
- Le numéro est attribué à l'émission, pas au brouillon. Un brouillon abandonné ne crée aucun trou.
- Aucun numéro n'est jamais réutilisé ni sauté. Test : 50 émissions simultanées donnent 50 numéros consécutifs, sans doublon.
- Une facture émise ne se supprime pas et ne se modifie plus. Une erreur se corrige par un avoir (FR-48).
- Les avoirs ont leur propre suite continue. Les proformas aussi (sans valeur fiscale).
- Une facture reprise de Sage (FR-58) garde son numéro d'origine et n'avance pas la suite.
- **Tranchée (PO, 2026-11-12).** Une seule série par organisation, continue d'année en année ; l'année peut figurer dans le format sans remettre le compteur à zéro.
- Les factures émises par un freelance ont leur propre série, une par freelance (FR-224). Elles n'entrent jamais dans la série de la société.

#### FR-44 : Mentions légales sur chaque facture

L'émission d'une facture exige que toutes les mentions légales soient présentes. Réalise UJ-1.

**Conséquences (testables) :**
- Émetteur, lu de la fiche de l'Organisation (jamais en dur) : raison sociale, forme juridique, capital, adresse du siège, NIF, RCCM, régime fiscal, coordonnées de paiement (RIB, compte Mobile Money).
- Client, lu de la fiche du point de vente : nom, adresse, NIF si le client est assujetti.
- Document : numéro, date d'émission, date d'échéance, références de commande et de bon de livraison, lignes (désignation, référence, quantité, prix unitaire HT, remise, total HT), total HT, TVA par taux (18 % au Togo), total TTC, conditions de règlement, pénalités de retard, conditions d'escompte (ou « pas d'escompte »), zone « Signature et cachet de l'émetteur » (image de l'organisation, optionnelle).
- Une mention manquante bloque l'émission : `MENTION_OBLIGATOIRE_MANQUANTE`, avec la liste des champs absents et le lien vers la fiche à compléter.
- Le texte de la facture indique « Facture » pour une facture, « Avoir » pour un avoir et « Proforma, ce document n'a pas valeur de facture » pour une proforma.
- **Décision du PO du 2026-11-12.** La liste ci-dessus (celle de la démo, complétée par les usages UEMOA) est une liste de travail jusqu'à sa validation par l'expert-comptable du client. Le PO obtient cette validation avant la recette de la facture. La liste est un paramètre : la corriger ne demande pas de nouveau développement.

#### FR-45 : Montants exacts

Les montants d'une facture, d'un avoir et d'une proforma suivent une règle unique. Réalise UJ-1.

**Conséquences (testables) :**
- `Σ total_ht des lignes = montant_ht` (après remise globale). La TVA se calcule par taux, sur le total HT de la facture : pour chaque taux, `tva_taux = arrondi(Σ HT des lignes à ce taux × taux)`, un seul arrondi par taux, à l'unité XOF. `montant_tva = Σ tva_taux`. `montant_ttc = montant_ht + montant_tva`. Cette règle écrite est la même que NFR-2 ; elle sert la facture, l'avoir et la proforma. Ces égalités sont vérifiées à l'émission ; un écart refuse l'émission : `TOTAUX_INCOHERENTS`.
- Le taux de TVA vient du paquet fiscal du pays, jamais d'une valeur en dur ; l'article (module `catalogue`) porte le code de taux qui s'y applique. Au Togo, 18 %.
- Une remise de ligne se déduit du prix avant calcul de la TVA. La TVA se calcule sur le HT remisé. (La démo avait un cas à 17,4 %.)
- La devise est XOF et se déclare sur le document.
- Exemple de test (Grossiste du Golfe) : 40 caisses de jus de mangue à 7 500 HT + 25 caisses de boisson gazeuse à 5 200 HT = 300 000 + 130 000 = 430 000 HT, TVA 77 400, TTC 507 400.
- **Hors périmètre :** TVA multi-pays, exonérations partielles, taxes spécifiques (accises). Brain dump du PO : « TVA 18 % ». En février, un taux unique à 18 % ; la règle par taux reste écrite pour qu'un second taux ne demande pas de nouveau calcul.

#### FR-46 : Imprimer et télécharger la facture en PDF

Tout rôle qui voit une facture peut l'imprimer et la télécharger en PDF. Réalise UJ-1.

**Conséquences (testables) :**
- Un PDF est généré par le serveur à l'émission et conservé. Le même fichier se retélécharge à l'identique des années plus tard.
- Le PDF reproduit les mentions de FR-44. Il tient sur des pages A4, avec le numéro de page et le numéro de facture en pied.
- Le bouton « Imprimer / PDF » ne dépend pas de l'impression du navigateur.
- Un brouillon se télécharge avec le filigrane « BROUILLON — sans valeur ». Une proforma avec la mention de FR-44.
- Un rôle hors périmètre reçoit un refus, y compris par l'adresse directe du fichier : `FACTURE_HORS_PERIMETRE`.
- Les factures sont conservées au moins 10 ans (durée de la démo, `types/index.ts:199`). Cette durée fait partie de la liste de travail de FR-44, validée par l'expert-comptable du client (décision du PO du 2026-11-12).
- Le PDF remis au détaillant d'un freelance ne porte que le prix du freelance, jamais le prix société (FR-224).

#### FR-47 : Envoyer la facture au client

Un COMPTABLE ou un DAF peut envoyer la facture par e-mail et par WhatsApp. L'envoi par WhatsApp est exigé : il fait partie du parcours UJ-1 et le module `notification` existe. Réalise UJ-1.

**Conséquences (testables) :**
- L'envoi passe par le module `notification`. Le statut d'envoi (`ENVOYE`, `ECHEC`, avec la raison) est enregistré sur la facture avec la date et l'auteur.
- Le PDF de FR-46 est joint (e-mail) ou accessible par un lien à durée limitée (WhatsApp, SMS). Le lien est propre à la facture, expire (7 jours par défaut, paramètre) et chaque ouverture est journalisée.
- Les canaux exigés sont l'e-mail et WhatsApp. Le SMS est proposé si l'organisation a ouvert ce canal dans `notification` ; sinon son bouton n'apparaît pas.
- Si l'organisation a ouvert PI-SPI ou FedaPay, le message d'envoi porte un lien de paiement du reste dû (module `paiement`). Un lien payé en plusieurs fois fait passer la facture à `PARTIELLE`, puis à `PAYEE` (FR-49).
- Dans l'essai, l'envoi suit FR-23 (journal d'envoi visible, numéro déclaré par le prospect) et le lien de paiement suit FR-24 (paiement de test).
- Un envoi échoué ne passe jamais pour réussi. L'utilisateur voit l'échec et peut réessayer.
- Si `notification` n'est pas installé, tous les boutons d'envoi affichent « non installé » et le téléchargement reste disponible.
- Le client sans adresse e-mail ni numéro est signalé avant l'envoi.

#### FR-48 : Émettre un avoir

Un COMPTABLE, avec validation d'un DAF au-dessus d'un seuil, ou un DAF peut émettre un avoir sur une facture émise. Réalise UJ-1.

**Conséquences (testables) :**
- L'avoir est total ou partiel. Il se compose de lignes de la facture (quantité et prix) ou d'un montant libre avec motif.
- Le motif est obligatoire : retour de marchandise, erreur de prix, remise commerciale, litige de livraison, erreur de facturation.
- Un avoir qui dépasse le reste à créditer de la facture est refusé : `AVOIR_SUPERIEUR_A_LA_FACTURE`.
- L'avoir reçoit un numéro `AV-AAAA-NNNNNN` continu (FR-43) et un PDF avec la mention « Avoir » et la référence de la facture.
- `facturation` publie le fait « avoir émis » ; `paiement` réduit la Créance de la facture en le consommant, en moins de 5 secondes. Sur une facture déjà payée (ou pour la part qui dépasse le reste dû), l'avoir crée un crédit du tiers tenu par `paiement` : il est imputé sur une facture suivante (`IMPUTE`) ou remboursé (`REMBOURSE`).
- La TVA de l'avoir se calcule par taux, comme celle de la facture (FR-45) ; le cumul des avoirs ne dépasse jamais la facture, taux par taux.
- Un avoir égal au montant TTC restant à créditer passe la facture à `ANNULEE_PAR_AVOIR` ; un avoir partiel la laisse `EMISE` ou `PARTIELLE`.
- Un avoir pour retour de marchandise propose une entrée de stock dans le module `stock`, à confirmer par le magasinier. Comportement par défaut : l'avoir n'entre jamais le stock tout seul.
- Un avoir au-dessus de 500 000 XOF exige la validation du DAF. Seuil d'approbation par défaut, paramétrable : 500 000 XOF.
- Les avoirs se lisent dans l'onglet « E-facturation et avoirs » (numéro, facture, motif, montant HT et TTC, date, statut, PDF). Cette liste ne dépend pas de la plateforme OTR.
- Un avoir émis ne se supprime pas.

#### FR-49 : Facture, Créance et paiements partiels

Chaque facture émise donne une Créance, tenue par le module `paiement` (registre unique, décision du PO du 2026-11-12). `facturation` publie le fait « facture émise » ; `paiement` ouvre la Créance en le consommant ; les Encaissements la réduisent, en une ou plusieurs fois. Réalise UJ-1.

**Conséquences (testables) :**
- La Créance reflète la facture émise en moins de 5 secondes. Aucun test ne suppose que deux modules changent « au même instant ».
- `reste_du = montant_ttc − montant_avoirs − montant_encaisse`, calculé par `paiement` et lu par `facturation`. Un paiement partiel passe la facture à `PARTIELLE` ; quand `reste_du` atteint 0, elle passe à `PAYEE`.
- Les moyens de paiement acceptés sont ceux de l'organisation : PI-SPI, FedaPay, espèces, virement. Le module `facturation` ne les implémente pas ; il lit les Encaissements du module `paiement`.
- Exemple de test (UJ-1) : facture de 507 400 XOF ; paiement de 200 000 par FedaPay, reste dû 307 400, statut `PARTIELLE` ; paiement de 307 400 par PI-SPI, statut `PAYEE`.
- Un paiement déjà reçu chez PI-SPI ou FedaPay n'est jamais refusé. La part qui dépasse le reste dû devient un crédit du tiers, tenu par `paiement`, remboursable ou imputable. Test : reste dû 307 400, paiement FedaPay de 310 000 : facture `PAYEE`, crédit du tiers 2 600.
- Un paiement déclaré à la main (espèces, virement) supérieur au reste dû demande une confirmation explicite ; une fois confirmé, l'excédent devient aussi un crédit du tiers.
- Un encaissement reçu avant la facture (acompte, encaissement en visite) est un crédit du tiers. À l'émission, il s'impute d'abord selon son affectation explicite (la commande ou la facture désignée), sinon sur la créance échue la plus ancienne.
- La facture affiche la liste de ses Encaissements : date, moyen, montant, référence. (La démo ne gardait qu'un total.)
- `facturation` dépend en dur de `paiement` : le module ne s'installe pas sans lui, et aucune facture n'existe sans Créance.
- Le statut passe à `EN_RETARD` à l'affichage le lendemain de l'échéance, sans traitement manuel.

#### FR-50 : Balance clients

Un DG, un DAF, un comptable, un responsable du recouvrement ou un commercial (pour son portefeuille) peut lire la balance clients à une date. Réalise UJ-1.

**Conséquences (testables) :**
- La balance est une vue de `facturation` qui lit les Créances tenues par `paiement` ; elle ne tient aucun solde propre. Ses totaux sont ceux de la balance du recouvrement (FR-112).
- Une ligne par client : total facturé, avoirs, encaissé, reste dû, crédit du tiers, nombre de factures ouvertes, plus ancienne échéance dépassée, plafond de crédit, encours (FR-52).
- Le total de la balance égale la somme des restes dus de toutes les factures ouvertes et des factures reprises (FR-58). Cette égalité est vérifiée par un contrôle visible. Un écart s'affiche en rouge avec le client en cause.
- Les factures émises par un freelance à ses détaillants n'entrent pas dans la balance de la société ; ce que le freelance doit à la société y figure, avec le freelance comme client (FR-97).
- On peut choisir une date passée (« au 31/01 ») : la balance se recalcule sur les pièces et Encaissements datés avant.
- Le périmètre limite les lignes : un commercial ne voit que ses clients (côté serveur).
- La balance s'exporte en CSV et en PDF.
- Un client dépassant son plafond est marqué « plafond dépassé ».

#### FR-51 : Balance âgée

Les mêmes rôles peuvent lire la balance âgée des Créances. Réalise UJ-1.

**Conséquences (testables) :**
- Tranches par défaut, paramétrables : non échu, 1 à 30 jours, 31 à 60 jours, 61 à 90 jours, plus de 90 jours. Cinq tranches par défaut, comme la version « comptable » de la démo ; la version des relances n'en avait que 4. Ce sont les mêmes tranches que FR-112.
- L'âge se calcule depuis l'échéance, pas depuis l'émission.
- Vues : par client, par commercial, par zone, par moyen de règlement attendu. Une tranche vide s'affiche à 0.
- Le total de la balance âgée égale le total de la balance clients de la même date (FR-50). Test automatique.
- Les factures reprises de Sage (FR-58) y figurent avec leur échéance d'origine.
- Un clic sur une tranche ouvre la liste des factures. La balance alimente le rapport du DG et les dossiers de relance (partie 3).
- Il n'y a pas de balance âgée fournisseur dans cette exigence : elle appartient à l'Approvisionnement (FR-67).

#### FR-52 : Encours, plafond de crédit et conditions de règlement par client

Le module lit le plafond de crédit et les conditions de règlement du client dans le module `pdv` et les applique. Réalise UJ-1.

**Conséquences (testables) :**
- `encours = créances ouvertes (Σ reste dû des factures émises et reprises) + commandes validées non encore facturées (TTC restant à facturer) − crédit du tiers`. Il est recalculé à chaque validation, facture, encaissement ou avoir. Le plafond de crédit se juge sur cet encours (FR-33). La fiche du client affiche `plafond − encours = disponible à crédit`.
- Exemple de test : plafond 2 000 000 ; créances ouvertes 900 000 ; commande validée non facturée de 600 000 ; crédit du tiers 100 000 : encours 1 400 000, disponible 600 000.
- L'échéance d'une facture = date d'émission + délai de règlement du client (30, 45 ou 60 jours, ou comptant). Sans délai sur la fiche du client, l'émission est refusée : `CONDITIONS_REGLEMENT_MANQUANTES`.
- Un plafond est porté par le client, pas par la facture. (La démo recopiait le plafond de la première facture.)
- Un client dont l'encours dépasse le plafond affiche « plafond dépassé » dans la balance, la fiche client et la commande (FR-33).
- Les valeurs par défaut par type de client (remise de base, délai, plafond) de la démo sont des valeurs d'amorçage à saisir à la reprise : dépôt ou grossiste volume : remise 8 %, 60 j, plafond 5 à 15 M ; grossiste : 5 %, 30 j, 3 à 10 M ; supérette : 3 %, 30 j, 5 à 12 M ; épicerie ou kiosque : 0 %, 30 j, 1 à 4 M ; enseigne interne : remise 0 %, règlement par virement, plafond sans objet (`PLAFOND_SANS_OBJET`, comme un magasin propre dans `pdv`). Ces plafonds sont du texte libre dans la démo ; ils ne sont repris que comme suggestions modifiables (valeurs d'amorçage).
- Les conditions de règlement par client vivent dans `pdv`. Le PRD `pdv` ne les décrit pas encore alors que son manifeste les cite : ce module les exige, et l'amendement du PRD `pdv` est porté par la partie 4.
- Le freelance a un plafond propre pour ce qu'il doit à la société (FR-97), jugé comme celui de tout client.

#### FR-53 : Marge par facture

Un DG, un DC ou un DAF voit la marge de chaque facture. Le contrôleur de gestion voit la marge par axe (article, famille, client, zone, commercial, période), pas la marge de chaque facture. Réalise UJ-1.

**Conséquences (testables) :**
- `marge_facture = Σ (prix_unitaire_ht − cout_unitaire) × quantité` ; `marge_pct = marge_facture / montant_ht`. Les coûts viennent du module `stock` au moment de la sortie.
- Un coût absent donne « non calculable », pas 15 %. (La démo posait 15 % par défaut.)
- Une facture reprise de Sage affiche « sans détail de lignes » : sa marge est « non calculable ».
- Le commercial et le magasinier ne voient pas la marge.
- Un appel du contrôleur de gestion qui demande la marge d'une facture précise est refusé : `ROLE_NON_AUTORISE`. Ses agrégats par axe portent au moins deux factures.
- Pour une vente d'un freelance, la marge de la société se calcule au prix société ; la marge de négociation du freelance n'entre dans aucune marge vue de la société.
- Un avoir réduit la marge de la facture d'origine au prorata.

#### FR-54 : Proforma

Un commercial, un freelance ou un responsable des ventes peut créer et envoyer une proforma. Réalise UJ-2 pour la proforma préparée en visite.

**Conséquences (testables) :**
- La proforma prend les prix de la grille applicable au client (prix négocié ou prix société), pas un prix unique. La proforma d'un freelance porte son propre prix de vente : elle vit dans l'espace privé du freelance et aucun rôle de la société ne la lit (FR-94).
- Validité : 15 jours après l'émission (paramètre). Au 16e jour, la proforma passe seule à `EXPIREE`. (Le passage n'était pas codé dans la démo.)
- Elle a sa propre numérotation `PRO-AAAA-NNNNNN` et ne consomme aucun numéro de facture.
- Elle ne réserve pas de stock et n'ouvre pas de Créance.
- Statuts : `BROUILLON → ENVOYEE → VUE → ACCEPTEE | REFUSEE | EXPIREE → CONVERTIE`. `VUE` n'est posé que si le client ouvre le lien ; sans canal qui le sait, le statut reste `ENVOYEE`.
- Si l'encours du client après la proforma dépasse son plafond, un bandeau avertit et la conversion demandera la dérogation de FR-33 (DAF ou DG). Le superviseur peut valider une remise, pas un dépassement de plafond.
- Pour un freelance : la marge minimale du freelance (12 % par défaut) avertit sans bloquer (FR-93).
- L'envoi suit FR-47.

#### FR-55 : Probabilité d'acceptation et relance d'une proforma

Le module affiche une probabilité d'acceptation et permet de relancer la proforma. Réalise UJ-2.

**Conséquences (testables) :**
- La probabilité (0 à 100) se calcule avec la formule de la démo (voir « Règles de calcul »). Elle est étiquetée « estimation ». ≥ 70 vert, ≥ 50 orange, sinon rouge.
- Chaque entrée de la formule vient de données réelles : score du client, créance, plafond, panier habituel, relances envoyées, vue ou non.
- Les proformas qui expirent sous 48 h sont comptées et listées.
- « Relancer » envoie réellement un message au client par le canal choisi (FR-47), incrémente `relances_envoyees` et journalise la date. Un canal non branché affiche « bientôt ».
- Le taux d'acceptation = `(ACCEPTEE + CONVERTIE) / (ACCEPTEE + CONVERTIE + REFUSEE + EXPIREE)`.
- Le délai moyen proforma → commande est la moyenne des durées réelles entre l'émission et la conversion. (La démo prenait la moitié de la validité.)
- L'onglet Proformas affiche six chiffres calculés, sur le périmètre du lecteur : **en attente** (statuts `BROUILLON`, `ENVOYEE`, `VUE`) ; **taux d'acceptation** ; **délai proforma → commande** ; **montant en jeu** = Σ `montant_ttc` des proformas en attente ; **expirent sous 48 h** ; **probabilité moyenne** des proformas en attente, étiquetée « estimation ». Chacun porte sa période et son heure de calcul (FR-15).
- Les rôles de pilotage (DG, DC, RESP_VENTES, SUPERVISEUR, DAF, COMPTABLE) voient le taux d'acceptation par agent, dans leur périmètre ; un rôle de portefeuille ne voit que ses proformas. Les proformas d'un freelance n'entrent pas dans ce panneau (FR-94).
- Une suggestion accompagne chaque proforma ouverte, choisie par règle dans cet ordre : créance > 0 et probabilité < 50 : « solder l'impayé avant de relancer » ; remise globale < 3 % et probabilité < 65 : « proposer 3 % » ; `ENVOYEE` sans relance : « relancer par WhatsApp aujourd'hui » ; `VUE` : « appeler » ; score du client ≥ 80 et probabilité ≥ 70 : « convertir directement ». Provenance « règle, version » (FR-16). Aucune suggestion sur une proforma `ACCEPTEE` ou `CONVERTIE`.

#### FR-56 : Convertir une proforma en commande

Un commercial ou un responsable des ventes peut convertir une proforma acceptée en commande. Réalise UJ-2.

**Conséquences (testables) :**
- Seule une proforma `ACCEPTEE` se convertit : `PROFORMA_NON_ACCEPTEE` sinon. (La démo laissait convertir un brouillon.)
- La conversion crée une Commande (FR-30) avec les lignes et les prix de la proforma, puis applique les contrôles de FR-33. Elle ne crée pas de facture. La facture suit la commande (FR-42).
- La conversion d'une proforma de freelance ne crée jamais une commande à son prix. Elle crée une vente du freelance (FR-96) : la commande de la société porte le prix société de chaque ligne ; le prix du freelance reste dans son espace privé, rattaché à la commande. Test : après conversion d'une proforma à 15 000 F la ligne, la commande lue par le DG porte 14 000 F, et aucune réponse du serveur destinée à la société ne contient 15 000.
- La proforma passe à `CONVERTIE` et garde le lien vers la commande. Une deuxième conversion renvoie la même commande.
- Une proforma `EXPIREE` ne se convertit pas : on en recrée une.
- Un client marqué `ACCEPTEE` hors du système (message WhatsApp, appel) : le commercial passe la proforma à `ACCEPTEE` à la main, avec date et auteur.

#### FR-57 : E-facture (statuts, contrôles, « bientôt »)

Le module porte le suivi de l'e-facture. En février la certification OTR n'est pas exigée et la plateforme n'est pas branchée. Réalise UJ-1 (partie fiscale, plus tard).

**Conséquences (testables) :**
- Tant que la plateforme OTR n'est pas branchée, toute facture est `NON_TRANSMISE`. L'onglet « E-facturation » affiche le bandeau « Plateforme OTR non branchée : bientôt » et ne montre aucun chiffre de certification.
- Interdit : afficher `TRANSMISE`, `CERTIFIEE` ou `REJETEE` sans réponse réelle de la plateforme. Interdit : un numéro de certification, un hash ou un QR fabriqués. (La démo dérivait ces statuts de l'ancienneté de l'impayé.)
- Les boutons « Transmettre », « Corriger et retransmettre » et « Télécharger l'archive » sont désactivés avec « bientôt ».
- Contrôles préalables à la transmission, exécutables avant la plateforme : NIF du client présent, taux de TVA cohérent, code de nomenclature de chaque article présent. Chaque échec nomme la facture et la fiche à compléter : `NIF_CLIENT_ABSENT`, `TVA_INCOHERENTE`, `NOMENCLATURE_ABSENTE`. En février ils sont des avertissements, pas des blocages.
- Quand la plateforme sera branchée : statuts reçus (`EN_ATTENTE`, `TRANSMISE`, `CERTIFIEE`, `REJETEE`), motif de rejet, tentatives, archive légale conservée 10 ans.
- Test : un rôle hors périmètre ne voit aucune ligne de la file de transmission (`FACTURE_HORS_PERIMETRE`).
- **Hors périmètre février :** la facture normalisée certifiée OTR et l'export vers Sage.

#### FR-58 : Reprendre les factures impayées à la bascule

L'administrateur de l'organisation (DIST_ADMIN) peut charger les factures impayées de l'ancien système, pour que la balance clients soit juste dès le premier jour. Réalise UJ-1.

**Conséquences (testables) :**
- Objet de reprise `facturation.facture-ouverte@1` (nom et version fixés ici par défaut et confirmés au manifeste de reprise) : numéro d'origine, client (référence reconnue dans `pdv`), date d'émission, date d'échéance, montant TTC, reste dû, devise.
- Une facture reprise garde son numéro d'origine tel quel. Elle n'avance pas la suite de numérotation (FR-43) et n'a pas de lignes (« sans détail »).
- Elle publie le même fait qu'une facture émise : `paiement` ouvre sa Créance pour le reste dû repris. Elle apparaît dans la balance clients et la balance âgée, peut recevoir un Encaissement et un avoir, et porte `origine = REPRISE`.
- Contrôle de la reprise : `Σ reste dû chargé = total de la balance Sage fourni`, par client et en total, à la date de coupure déclarée avec le fichier. Un écart refuse la validation de la reprise : `ECART_DE_CONTROLE`.
- Un client absent de `pdv` rejette sa ligne avec le code `CLIENT_INCONNU` ; la ligne apparaît dans un rapport d'écarts ; elle ne crée pas de client en silence.
- Un numéro d'origine déjà présent est refusé : `NUMERO_DEJA_REPRIS`. Recharger le même fichier ne crée aucun doublon.
- Le PDF original reste dans Sage. Prospera n'en génère pas pour une facture reprise.
- Ce module n'a aucun manifeste aujourd'hui : l'objet de reprise est à produire au manifeste `facturation` (dû le 20/11). Sans lui, le chiffre de contrôle « reste dû » n'a pas de porteur.

#### FR-222 : Les huit chiffres de l'onglet Factures

L'onglet « Factures et créances » affiche huit chiffres calculés, pour la période choisie (mois en cours par défaut) et le périmètre du lecteur. Réalise UJ-1.

**Conséquences (testables) :**
- **CA facturé** : Σ `montant_ht` des factures émises dans la période, avoirs déduits ; le TTC s'affiche en second.
- **Encaissé** : Σ des Encaissements de la période (module `paiement`).
- **Créances ouvertes** : Σ `reste_du`.
- **Impayés en retard** : Σ `reste_du` des factures `EN_RETARD`.
- **Taux de recouvrement** : encaissé ÷ facturé × 100, arrondi à 0,1.
- **Délai d'encaissement** : règle de la table « Règles de calcul » ; « non calculable » sans facture payée.
- **Factures en retard** : nombre.
- **Clients à risque** : nombre de clients ayant au moins une facture de niveau `CRITIQUE` ou `ELEVE` (règle de la table). Sans score du client, la règle ignore ce terme et l'écrit (« score non disponible ») ; elle n'applique pas le score de 70 de la démo.
- Chaque chiffre porte sa période et son heure de calcul (FR-15). La démo sommait le TTC de toutes les factures chargées, sans période : non repris.
- Sous les chiffres : **Top clients impayés** (les 5 plus grands `reste_du` en retard, avec le nombre de factures, le plus ancien retard, le plafond et la pastille « plafond dépassé ») et **Recouvrement par commercial** (encaissé ÷ facturé par agent, sur les factures de son portefeuille).
- La liste filtre par vue (toutes, créances ouvertes, en retard, émises à échéance future, payées, par canal du client) et par statut. Ordre par défaut : `EN_RETARD`, `PARTIELLE`, `EMISE`, `PAYEE`, `BROUILLON`, puis jours de retard décroissants. Les vues « Partenaires B2B » et « Enseigne » de la démo sont des valeurs du canal du client, pas du code.

#### FR-223 : Onglets et droits de la facturation

Chaque rôle qui a la route `/facturation` a au moins un onglet ; aucun écran n'est vide. Réalise UJ-1.

**Conséquences (testables) :**
- Onglet **Factures et créances** : DG, DC, DAF, COMPTABLE, RECOUVREMENT ; CONTROLE_GESTION en lecture seule, avec la marge par axe (FR-53), sans marge par facture et sans action d'écriture. (Corrige l'écran vide de la démo.)
- Onglet **Proformas** : DG, DC, RESP_VENTES, SUPERVISEUR, COMMERCIAL, PROSPECTION, DAF, COMPTABLE.
- Onglet **E-facturation et avoirs** : DG, DAF, COMPTABLE.
- Actions d'écriture sur une facture et un avoir (créer, émettre, envoyer, avoir) : COMPTABLE et DAF (FR-42, FR-47, FR-48).
- Un commercial ne voit que les proformas et les factures de son portefeuille (périmètre côté serveur).
- Le freelance a son propre espace « Mes ventes » : ses proformas, ses factures à ses détaillants (FR-224) et ses relevés envers la société (FR-96). Aucun rôle de la société n'y accède.
- Un appel direct vers un onglet hors droits est refusé : `ROLE_NON_AUTORISE`.

#### FR-224 : Facture émise par le freelance

Le freelance émet dans Prospera la facture de sa vente à son détaillant. Il en est l'émetteur, à son prix (décision du PO du 2026-11-12). Réalise UJ-9.

**Conséquences (testables) :**
- Le bouton « Facturer » de la vente du freelance est actif quand le bon est `LIVRE`. Les lignes reprennent les quantités livrées confirmées et le prix du freelance.
- Émetteur : la fiche du freelance (nom ou raison sociale, adresse, NIF s'il en a un, régime fiscal). Les mentions suivent la liste de travail de FR-44, appliquée à cet émetteur. Une mention manquante bloque l'émission : `MENTION_OBLIGATOIRE_MANQUANTE`.
- Série propre à chaque freelance, continue, sans trou ni doublon, avec les règles de FR-43 (format paramétrable). Elle n'entre jamais dans la série de la société.
- La TVA suit le régime fiscal déclaré sur la fiche du freelance (par défaut : assujetti ou non, lu de sa fiche ; taux du paquet fiscal du pays) et la règle de calcul de FR-45.
- Le PDF remis au détaillant porte le prix du freelance seul. Il ne porte jamais le prix société, ni la marge de négociation. Test : le texte du PDF ne contient pas le prix société d'aucune ligne.
- L'envoi suit FR-47 (e-mail, WhatsApp).
- Aucun rôle de la société ne lit cette facture, ni à l'écran, ni par une réponse du serveur, ni par un export de l'organisation. Elle n'entre pas dans la balance clients de la société (FR-50) ; ce que le détaillant doit au freelance est suivi dans l'espace du freelance (FR-97).
- Le freelance corrige sa facture par un avoir de sa propre série. Cet avoir ne change pas ce qu'il doit à la société (FR-96).

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| TVA | 18 % au Togo, lu du paquet fiscal du pays | par pays | `proforma-builder.ts:14` |
| Totaux proforma | `HT = arrondi(brut × (1 − remise/100))` ; TVA par taux sur le total HT (FR-45) ; `TTC = HT + TVA` | non | `proforma-builder.ts:24-29` |
| Ligne | `total = arrondi(prix × quantité × (1 − remise_ligne/100))` | non | `:31-41` |
| Validité d'une proforma | 15 jours | oui | `:16` |
| Proforma « expirante » | statut `ENVOYEE`, `VUE` ou `BROUILLON` et 0 à 2 jours restants | seuil : oui | `:112-116` |
| Probabilité d'acceptation | `score = score_client × 0,5` ; − `min(25, (créance/plafond) × 30)` ; + `min(20, remise × 3,5)` ; si panier/panier habituel > 1,5 : − `min(18, (ratio − 1,5) × 12)` ; si < 0,8 : + 6 ; + 8 si vue ; − 4 par relance ; résultat = `borné(0, 100, arrondi(score + 25))` | coefficients : non en février | `:47-80` |
| Plafond d'une proforma nouvelle | `max(1 M, ca_mois × 1,5)` ; panier habituel `max(200 000, ca_mois / 3)` | oui | `ProformaBuilder.tsx:56-70` |
| Reste à payer | `montant − avoirs − encaissé` | non | `facturation-dg-builder.ts:78` |
| Niveau de risque d'une facture | `CRITIQUE` si retard > 30 j OU score < 35 OU reste > plafond ; `ELEVE` si retard > 14 j OU score < 55 ; `MODERE` si retard > 0 ou partielle ; sinon `FAIBLE` | seuils : oui | `:67-74` |
| Taux de recouvrement | encaissé / facturé × 100 | non | `:115` |
| Délai moyen d'encaissement | moyenne (dernier paiement − émission) des factures `PAYEE` ; « non calculable » sans facture payée (la démo mettait 25 ou 28 j) | non | `:95-114` |
| Numérotation | suite continue, voir FR-43 | format : oui | nouvelle |
| E-facture | statuts reçus de la plateforme uniquement | non | nouvelle |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Vues et filtres de factures | LECTURE | FR-50 et FR-51 |
| (absent) Facturer depuis la commande | n'existe pas | FR-42 |
| (absent) Enregistrer un paiement sur une facture | n'existe pas | FR-49 (via `paiement`) |
| (absent) Créer un avoir | n'existe pas | FR-48 |
| Imprimer / PDF | SIMULÉ (`window.print()`) | FR-46 |
| Envoyer au client | SIMULÉ (proforma locale) | FR-47 (e-mail et WhatsApp exigés, lien de paiement) |
| (absent) Facture du freelance à son détaillant | n'existe pas | FR-224 |
| Créer une proforma | local | FR-54 |
| Convertir en commande | SIMULÉ (deux références vides) | FR-56 |
| Relancer par {canal} | SIMULÉ (compteur) | FR-55 |
| Corriger et retransmettre (e-facture) | SIMULÉ | bientôt |
| Transmettre à la plateforme, télécharger l'archive | n'existe pas | bientôt |
| Exporter vers Sage | n'existe pas | bientôt |

**Notes.**
- **Tranchée (PO, 2026-11-12).** La Créance est portée par `paiement` (`paiement.creance@1`, registre unique de la partie 3). `facturation` émet les factures, les avoirs et la suite de numérotation, et publie ses faits ; `paiement` ouvre une Créance de source `FACTURE` en consommant le fait « facture émise ». `facturation` dépend en dur de `paiement`.
- **Tranchée (PO, 2026-11-12).** Une seule série par organisation, continue d'année en année, qui reprend le dernier numéro de Sage à la bascule.
- **Tranchée (PO, 2026-11-12).** La vente au comptoir passe par une commande sur le client comptoir de son point de stock (FR-221) ; la facture suit la commande.
- **Tranchée (PO, 2026-11-12).** Le client quitte Sage. L'export de factures et de paiements vers Sage est hors périmètre de la phase démontrable et vient après ; son bouton est « bientôt ».
- Le modèle de facture Sage du client (remises sur plusieurs niveaux, frais de transport) s'obtient avec les exports de la reprise ; les consignes sont hors v1.
- Les relances, la promesse de paiement et le blocage de crédit sont au module partagé Relances et recouvrement (partie 3).

---

### 5.3 Approvisionnement et fournisseurs (`approvisionnement`, M10)

**Dans la démo.** `/approvisionnement` (RESP_STOCK, DG, DAF, COMPTABLE) a quatre onglets : Réappro IA (impact trésorerie, commandes suggérées, « Valider tout »), Commandes fournisseurs (filtre par statut, réception avec écarts), Fournisseurs (registre, score, fiche) et Règles d'automatisation (lecture seule). Le moteur `reappro-engine.ts` est un vrai algorithme ; l'exécution est creuse.
- **SIMULÉ :** « Valider la commande » écrit au journal local, sans créer de commande, sans passer à `ENVOYEE`, sans contrôler le rôle ni le montant. « Basculer sur le fournisseur alternatif » ne recalcule rien. « Valider la réception » affiche « entrée en stock passée » sans écrire (la fonction `receptionner` n'est jamais appelée).
- **N'EXISTE PAS :** créer ou éditer un fournisseur, une commande manuelle, une règle ; payer une échéance.
- **Non appliqués :** les plafonds de validation (un responsable stock peut valider 30 M), le plancher de trésorerie (l'encadré devient rouge, le bouton reste actif), le garde-fou anti-stock-mort sur les commandes suggérées, les deux fournisseurs par produit.
- **Note fournisseur :** `score_fiabilite` est une valeur saisie en dur, jamais recalculée ; le score de sélection est un second calcul, relatif aux candidats. Le point de commande `pointDeCommande` n'est utilisé pour rien.
- **Données :** 10 fournisseurs et 9 à 10 commandes écrits en dur.

**Ce que le module fait.** Il tient le registre des fournisseurs, note chacun, et propose automatiquement les réapprovisionnements dont le stock a besoin. Chaque proposition devient une commande fournisseur qui suit le cycle `SUGGEREE → … → RECUE`. Elle est validée par le bon niveau d'autorité selon son montant. Le plancher de trésorerie la bloque quand elle ferait passer la trésorerie sous 40 M XOF, et elle monte alors au DAF. La réception physique est faite par l'entrepôt (module `entrepot`, FR-71) ; ce module reçoit son résultat. Le module réalise UJ-6.

**Objets.**
- **Fournisseur** : `code` (`FRN-NNN`), `nom`, `categories`, `contact`, `pays`, `statut` (`ACTIF | PREFERENTIEL | SUSPENDU | EN_EVALUATION`), `delai_livraison_j`, `delai_paiement_j`, `franco_de_port`, `minimum_commande`, `remise_volume_pct`, `plafond_credit_accorde`, `note` (0-100) et ses 5 composantes.
- **Article fournisseur** : `article`, `fournisseur`, `prix_achat`, `delai_j`, `quantite_min`, `quantite_lot`, `prioritaire`.
- **Règle de réapprovisionnement** : `article`, `actif`, `seuil_stock`, `couverture_min_jours`, `mode_quantite` (`STOCK_CIBLE | QUANTITE_FIXE | PREVISION`), `stock_cible`, `quantite_fixe`, `niveau_auto` (`ALERTE_SEULE | PROPOSITION | AUTO_SI_SOUS_PLAFOND | AUTO_TOTAL`), `fournisseur_prefere`, `plafond_auto`, `valideur`.
- **Commande fournisseur** : `reference` (`CF-AAAA-NNNN`), `fournisseur`, `point_de_stock_destination`, `statut`, `origine` (`AUTO | MANUELLE`), `lignes`, `montant_ht`, `montant_ttc`, `date_creation`, `date_envoi`, `date_livraison_prevue`, `date_livraison_reelle`, `echeance_paiement`, `statut_paiement` (`NON_DUE | A_PAYER | PARTIEL | PAYEE | ECHUE`), `valide_par`, `valide_le`, `justification`, `fournisseur_alternatif`.
  - Statuts : `SUGGEREE`, `BROUILLON`, `EN_VALIDATION`, `ENVOYEE`, `CONFIRMEE`, `EN_TRANSIT`, `RECUE_PARTIELLE`, `RECUE`, `ANNULEE`, `LITIGE`.
- **Ligne de commande fournisseur** : `article`, `quantite_commandee`, `quantite_recue`, `prix_achat_unitaire`, `total`, `motif` (`SEUIL_ATTEINT | PREVISION_RUPTURE | REGROUPEMENT | MANUEL | PROMO_FOURNISSEUR`).
- **Impact de trésorerie** : `solde_actuel`, `montant_engage`, `solde_projete`, `plancher`, `franchit_plancher`.

#### FR-59 : Registre des fournisseurs

Un responsable stock ou un DAF peut créer, modifier, suspendre et évaluer un fournisseur. Réalise UJ-6.

**Conséquences (testables) :**
- Un fournisseur se crée avec nom, catégories, contact, conditions (délai de livraison, délai de paiement, franco, minimum, remise de volume). Un fournisseur sans nom est refusé.
- Un fournisseur `SUSPENDU` ne reçoit plus de commande suggérée ni manuelle : `FOURNISSEUR_SUSPENDU`. Ses commandes en cours restent visibles.
- Par défaut, un fournisseur `EN_EVALUATION` peut recevoir des commandes ; son statut est affiché (comme la démo).
- Chaque article stocké doit avoir au moins un fournisseur prioritaire et un fournisseur de secours. Un article avec un seul fournisseur déclenche une alerte `MODEREE` au responsable stock. Comportement par défaut : alerte, pas blocage.
- La reprise des fournisseurs a un objet de reprise propre, à produire au manifeste (aucun manifeste aujourd'hui). Sans le module, la reprise affiche « module non installé ».
- Les fiches ne sont lues que par DG, RESP_STOCK, DAF, COMPTABLE. Le magasinier n'y a pas accès.

#### FR-60 : Note du fournisseur (30 / 25 / 25 / 10 / 10)

Le module calcule une seule note par fournisseur, de 0 à 100, qui sert à la fois à l'affichage et au choix du fournisseur. Réalise UJ-6.

**Conséquences (testables) :**
- `note = 0,30 × prix + 0,25 × délai réel + 0,25 × fiabilité + 0,10 × dette + 0,10 × franco`.
- Prix, délai et dette sont normalisés entre les fournisseurs candidats pour l'article (le meilleur vaut 100). La fiabilité est le taux de livraisons conformes. Le franco vaut 100 si le montant atteint le franco, sinon `montant / franco × 100`.
- La note est recalculée à chaque réception terminée (délai réel, conformité, litiges). La démo la gardait figée.
- Une note affiche ses cinq composantes et une phrase de justification (écart de prix avec le suivant, délai réel, conformité, encours échu, franco).
- Un fournisseur sans historique affiche « non évaluée » et n'a pas de note par défaut.
- Couleurs : ≥ 80 vert, ≥ 60 ambre, sinon rouge.
- Deux fournisseurs de notes égales sont départagés par le prix le plus bas, puis par le délai réel.

#### FR-61 : Réapprovisionnement proposé automatiquement

Le module propose les réapprovisionnements nécessaires à partir des règles par article. Réalise UJ-6.

**Conséquences (testables) :**
- Un article est « en manque » si `stock ≤ seuil` OU `couverture < couverture_min_jours` (10 jours par défaut pour une règle de réapprovisionnement ; 7 jours pour un transfert entre points de stock, PRD `stock`). La couverture = stock / vitesse de vente journalière, où la vitesse = ventes des 30 derniers jours / 30. Les deux définitions du seuil sont alignées (≤).
- Le stock lu est le stock disponible du Point de stock (module `stock`). Si `stock` n'est pas installé : « non installé » et aucune proposition.
- Quantité proposée : `QUANTITE_FIXE` → la quantité fixe ; `STOCK_CIBLE` → `max(0, stock_cible − stock)` ; `PREVISION` → `max(0, vitesse × (délai + couverture_min) + vitesse × délai × 1,3 − stock)`. Le résultat est arrondi au multiple supérieur du lot, avec au moins un lot.
- Les propositions d'un même fournisseur sont regroupées en une commande. La remise de volume ne s'applique que si le montant HT atteint le franco.
- Les articles dont la règle est `ALERTE_SEULE` ne produisent qu'une alerte.
- Criticité : `CRITIQUE` si `stock ≤ 0,5 × seuil` ou couverture < 3 jours ; `HAUTE` si sous le seuil ; sinon `MODEREE`.
- Une règle se crée, se modifie et se désactive (RESP_STOCK, DG) ; le bouton « Déclencher maintenant » lance l'évaluation. (Dans la démo, les règles sont en lecture seule.)
- Une règle créée sans paramètre prend ces valeurs : active, couverture minimale 10 jours, mode `PREVISION`, niveau `PROPOSITION`, plafond d'envoi automatique 0, valideur RESP_STOCK, stock cible = 2,5 × seuil. Le jeu de démonstration comprend deux règles d'exception : les eaux en `AUTO_SI_SOUS_PLAFOND` (plafond 3 M, couverture 7 jours) et un article à valideur DAF.
- L'écran d'approvisionnement affiche un bandeau de 6 chiffres calculés : articles sous seuil, commandes automatiques à valider, dette fournisseurs, dont échue, délai de réapprovisionnement moyen, taux de service fournisseur (livraisons conformes / livraisons). Onglet d'entrée : RESP_STOCK et DG = réapprovisionnement ; DAF et COMPTABLE = fournisseurs.
- Exemple de test (Grossiste du Golfe) : jus d'orange 1 L, stock 80 caisses, seuil 100, ventes 30 j = 600 → vitesse 20 caisses/j, couverture 4 j ; proposition émise ; criticité `HAUTE`.
- Le point de commande `vitesse × délai × 2,3` est calculé et affiché comme repère, mais le déclenchement se fait sur le seuil de la règle (comportement par défaut, comme la démo).

#### FR-62 : Commande fournisseur, de SUGGEREE à RECUE

Un responsable stock peut transformer une proposition en commande fournisseur et la suivre jusqu'à la réception. Réalise UJ-6.

**Conséquences (testables) :**
- Cycle : `SUGGEREE → EN_VALIDATION → ENVOYEE → CONFIRMEE → EN_TRANSIT → RECUE_PARTIELLE | RECUE`. `ANNULEE` et `LITIGE` sont possibles. Une transition interdite renvoie `TRANSITION_INTERDITE`.
- « Valider » crée vraiment la commande (statut `ENVOYEE`, `valide_par`, `valide_le`) et enregistre la ligne dans le registre. « Valider tout » valide chaque commande restante avec les mêmes contrôles ; si une échoue, les autres passent et l'échec est listé.
- La commande fournisseur se crée aussi à la main (fournisseur, lignes, destination).
- L'envoi au fournisseur (e-mail ou PDF) se fait par le module `notification` ; sans lui, la commande fournisseur se télécharge en PDF et le bouton d'envoi affiche « non installé ». (« Bon de commande » désigne seulement le bon de livraison du terrain, jamais la commande fournisseur.)
- La commande `ENVOYEE`, `CONFIRMEE` ou `EN_TRANSIT` apparaît dans les « réceptions attendues » de l'entrepôt (FR-71).
- La réception (partielle ou totale) renvoyée par l'entrepôt met à jour `quantite_recue`, le statut (`RECUE_PARTIELLE`, `RECUE`, `LITIGE`), la dette fournisseur (FR-67) et la note (FR-60).
- La date de livraison prévue = date d'envoi + délai de livraison du fournisseur. L'échéance de paiement = date de réception + délai de paiement. (La démo calculait à la création.)
- Une commande `SUGGEREE` non traitée en 7 jours (délai par défaut, paramètre) est signalée.

#### FR-63 : Plafonds de validation par montant

Une commande fournisseur n'est validée que par le rôle qui a l'autorité pour son montant. Réalise UJ-6.

**Conséquences (testables) :**
- Jusqu'à 5 000 000 XOF TTC : le responsable stock. Au-dessus de 5 M et jusqu'à 20 M : le DAF. Au-dessus de 20 M : le DG. Valeurs paramétrables par organisation.
- Un rôle qui valide au-dessus de son plafond est refusé : `PLAFOND_VALIDATION_DEPASSE`, avec le rôle qui doit valider. (Dans la démo, un responsable stock validait 30 M.)
- Les bornes sont incluses vers le bas : exactement 5 000 000 se valide par le responsable stock.
- Une commande hors plafond reste `EN_VALIDATION` et apparaît dans la liste « à valider » du bon rôle (badge dans le menu).
- Le valideur ne peut pas être l'auteur d'une commande manuelle de plus de 5 M. Séparation des tâches par défaut, seuil de 5 M paramétrable.
- Une commande auto ne part sans validation que si la règle est `AUTO_TOTAL`, ou `AUTO_SI_SOUS_PLAFOND` et `montant_ttc ≤ plafond_auto` de la règle. Sinon elle reste `SUGGEREE`.

#### FR-64 : Plancher de trésorerie qui bloque

Une commande qui ferait passer la trésorerie sous 40 000 000 XOF ne part pas : elle monte au DAF. Réalise UJ-6.

**Conséquences (testables) :**
- `solde_projete = solde_actuel − montant engagé`, où le solde actuel est la somme des soldes des comptes de trésorerie de l'organisation, et le montant engagé la somme des TTC des commandes en cours de validation, plus celle que l'on valide.
- Si `solde_projete < plancher` (40 M par défaut, paramétrable), la validation par le responsable stock est refusée : `PLANCHER_TRESORERIE_FRANCHI`. La commande passe `EN_VALIDATION`, étiquetée « escalade DAF », et le DAF est notifié (module `notification`, ou liste « à valider » si le module n'est pas branché).
- Seul le DAF (ou le DG) peut débloquer, avec un motif. La dérogation est tracée.
- L'escalade vaut pour tous les montants. (La démo l'appliquait au journal seulement au-dessus de 20 M.)
- L'encadré « Impact trésorerie » affiche solde actuel, montant engagé, solde projeté, plancher.
- Si aucun module financier n'est installé, le solde affiche « non installé » et le plancher ne peut pas être évalué. Comportement par défaut : avertir (« trésorerie non vérifiée »), sans bloquer ; bloquer est un paramètre de l'organisation.
- **Hors périmètre :** la prévision de trésorerie à 7 jours (module Pilotage financier, partie 3).

#### FR-65 : Fournisseur alternatif

Le module propose un fournisseur alternatif pour chaque commande suggérée et permet d'y basculer. Réalise UJ-6.

**Conséquences (testables) :**
- L'alternatif est le fournisseur suivant au classement de la note (FR-60), hors `SUSPENDU`.
- « Basculer sur {fournisseur} » recalcule les prix d'achat, le franco, la remise de volume, les délais, le montant HT et TTC, puis relance les contrôles de FR-63 et FR-64. (La démo ne recalculait rien.)
- Si un prix manque chez l'alternatif pour un article, la bascule est refusée : `PRIX_FOURNISSEUR_ABSENT`.
- Si un fournisseur est suspendu et qu'un article n'a plus de fournisseur prioritaire, une alerte l'indique au responsable stock.
- La bascule est tracée : qui, quand, ancien fournisseur, nouveau.

#### FR-66 : Garde-fou anti-stock-mort à l'achat

Chaque commande suggérée est contrôlée contre l'achat de stock qui ne se vendra pas. Réalise UJ-6.

**Conséquences (testables) :**
- Cinq motifs : durée de vie (DLC), saison, fin de vie du produit, remise piège, couverture excessive.
- On ne commande pas plus de 70 % de la durée de vie restante en couverture, ni plus de 60 jours de couverture.
- Verdicts : `PASSE`, `ECRETE` (quantité réduite et expliquée), `REFUSE` (motif nommé).
- Le contrôle s'applique à l'écran de réapprovisionnement et à toute commande validée. (Dans la démo il n'était appelé que par le journal d'automatisation.)
- Les motifs `SAISON` et `FIN_DE_VIE` lisent le profil de l'article dans le catalogue : saison de vente (mois), fin de vie planifiée, élasticité prix, pourcentage de reprise fournisseur (champs optionnels). Sans profil, le motif affiche « non évalué ».
- Une quantité écrêtée est affichée à côté de la quantité proposée. Le responsable stock peut passer outre avec un motif.
- Sans durée de vie renseignée sur l'article, le motif DLC affiche « non évalué » et ne bloque pas.

#### FR-67 : Dette fournisseurs et échéancier

Un DAF, un comptable ou un DG voit ce que l'organisation doit à ses fournisseurs. Réalise UJ-6.

**Conséquences (testables) :**
- La réception d'une commande fournisseur crée la dette : `Σ prix_achat × quantité reçue`, plus la TVA par taux (taux lu du paquet fiscal du pays, jamais en dur ; FR-45), échéance = date de réception + délai de paiement.
- Un litige (FR-72) bloque le paiement de la ligne en cause jusqu'à sa résolution et réduit la dette du montant d'un avoir obtenu.
- Échéancier en tranches : échu, J+7, J+15, J+30, au-delà.
- La balance âgée fournisseurs est la même vue en retard par fournisseur. La spécification V2 de la démo (§7.10) demande une balance âgée « client ET fournisseur » ; elle est donc incluse ici.
- Le statut de paiement (`NON_DUE`, `A_PAYER`, `PARTIEL`, `PAYEE`, `ECHUE`) se met à jour avec les paiements fournisseurs saisis par le DAF.
- Les ordres de paiement aux fournisseurs sont exigés ; ils relèvent du Pilotage financier (partie 3). La transmission réelle part dès que le raccordement de l'organisation est fait (décision du PO du 2026-11-12). Ici : saisie du paiement et solde.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Note fournisseur | 0,30 prix, 0,25 délai réel, 0,25 fiabilité, 0,10 dette, 0,10 franco | poids : oui | `reappro-engine.ts:129-180` |
| Vitesse de vente | ventes 30 j / 30 | non | `:27-29` |
| Quantité (prévision) | `vitesse × (délai + couv_min) + vitesse × délai × 1,3 − stock`, arrondi au lot | coeff. 1,3 : oui | `:49-72` |
| Couverture minimale par défaut | 10 jours (règle) ; 7 jours (transfert) | oui | `regles-reappro-registry.ts` |
| Criticité | `CRITIQUE` si stock ≤ 0,5 × seuil ou couverture < 3 j ; `HAUTE` si sous seuil | non | `:99-101` |
| Plafonds de validation | 5 M (responsable stock), 20 M (DAF), au-delà DG | oui | `regles-reappro-registry.ts:10-14` |
| Plancher de trésorerie | 40 000 000 XOF | oui | `reappro-engine.ts:24` |
| Auto-envoi | `AUTO_TOTAL`, ou `AUTO_SI_SOUS_PLAFOND` et TTC ≤ plafond de la règle | oui | `:241-243` |
| TVA d'achat | 18 % | par article | `:20` |
| Anti-stock-mort | 70 % de la DLC ; 60 jours de couverture | oui | `garde-fou-achat.ts:62-64` |
| Économie de regroupement | 45 000 XOF si franco atteint (+ remise de volume) ; valeur en dur dans la démo | oui (à calculer) | `:236` |
| Tranches de dette | échu, J+7, J+15, J+30, au-delà | oui | `:373-418` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Valider la commande | SIMULÉ (journal local) | FR-62, FR-63, FR-64, FR-66 |
| Valider tout (N) | SIMULÉ | FR-62 |
| Basculer sur {fournisseur alternatif} | SIMULÉ (rien recalculé) | FR-65 |
| Annuler (validation) | SIMULÉ | FR-62 |
| Valider la réception (côté achats) | SIMULÉ | FR-71 (une seule réception, à l'entrepôt) |
| Saisie des quantités reçues | SIMULÉ | FR-71 |
| Filtres de statut, fiche fournisseur, filtre de règles | LECTURE | FR-59, FR-61 |
| (absent) Créer ou éditer un fournisseur | n'existe pas | FR-59 |
| (absent) Éditer une règle, Déclencher maintenant | n'existent pas | FR-61 |
| (absent) Commande manuelle | n'existe pas | FR-62 |
| (absent) Payer une échéance | n'existe pas | FR-67 (saisie) ; ordre de paiement exigé (partie 3), transmis dès le raccordement de l'organisation |
| (absent) Relancer un fournisseur | n'existe pas | bientôt |
| Envoyer la commande au fournisseur | n'existe pas | FR-62 (e-mail via `notification`) |

**Notes.**
- Ce module n'est pas ★ : le client de février peut acheter à la main. Il est écrit en entier parce que la démo le montre.
- Un seul processus de réception : l'écran de l'entrepôt (FR-71). L'onglet « Commandes fournisseurs » de l'achat affiche le résultat, il ne saisit pas.
- Par défaut, achats en XOF seulement ; l'import (devises, douane, transit) est hors périmètre.
- Le plancher de 40 M est la valeur de la démo ; le plancher du client de février se saisit au paramétrage de son organisation.
- Les factures d'achat et leur rapprochement avec la commande et la réception sont au module Comptabilité (partie 3), hors du périmètre de février (décision du PO du 2026-11-12 : la comptabilité vient après).

---

### 5.4 Opérations entrepôt (`entrepot`, M11)

**Dans la démo.** `/entrepot` (DG, RESP_STOCK, GEST_ENTREPOT) est un poste de travail sans chiffre commercial, avec quatre onglets : Préparation, Expéditions et chargement, Réceptions, Inventaire tournant. Les moteurs `picking-engine`, `expedition-engine`, `reception-engine` et `inventaire-engine` sont de vrais algorithmes.
- **LECTURE :** ouvrir un bon de préparation, voir les expéditions. Aucun bouton pour imprimer un bon, valider une ligne servie, accepter un substitut, démarrer une vague, valider le départ d'un camion.
- **SIMULÉ :** saisie des quantités reçues (pré-remplies avec le commandé), « Valider le contrôle au quai » (le bilan est calculé, mais le stock n'augmente pas, aucun avoir ni litige n'est créé), saisie du compté d'un inventaire (l'écart est calculé, le stock théorique n'est pas ajusté).
- **Deux écrans de réception** (quai et achats) écrivent la même entrée de journal et se télescopent.
- **Pas d'objet Litige** : c'est un booléen, un statut et un compteur.
- **Données en dur :** 6 camions, 5 préparateurs, 2 entrepôts (Lomé Port : 3 200 m², 4 quais, départ à 15:30 ; Kara : 900 m², 1 quai, 14:00). Le nombre d'écarts récents d'inventaire est tiré au hasard.
- **Texte seul :** les « actions automatiques » d'un bilan de réception (mise en stock, avoir préparé, facture fournisseur bloquée, note recalculée).

**Ce que le module fait.** C'est le poste du magasinier. Il prépare les commandes validées, charge les camions, reçoit les marchandises du fournisseur et compte le stock. Chaque action écrit dans le module `stock` : le départ du camion sort le stock réservé, une réception l'augmente, un inventaire validé le CORRIGE. Le magasinier ne voit jamais un prix ni une marge. Le module réalise UJ-1 (préparation et livraison), UJ-2 (remise des espèces, côté chargement) et UJ-6 (réception avec litige, stock corrigé).

**Objets.**
- **Bon de préparation** : `commande`, `bon_de_livraison`, `point_de_stock`, `client`, `zone`, `priorite`, `score_priorite`, `lignes`, `decision` (`PREPARER | PREPARER_PARTIEL | BLOQUER`), `motif_blocage`, `poids_total`, `volume_total`, `palettes`, `duree_prevue_min`, `statut` (`A_PREPARER | EN_COURS | PREPARE | CHARGE`).
- **Ligne de préparation** : `article`, `quantite_demandee`, `quantite_servie`, `statut` (`SERVABLE | PARTIELLE | RUPTURE`), `emplacement`, `allee`, `ordre_parcours`, `lot`, `substitut`.
- **Vague** : `creneau`, `point_de_stock`, `bons`, `preparateur`, `duree_prevue`, `parcours`, `tenable`.
- **Préparateur** et **Camion** : données de l'organisation, décrites en FR-225.
- **Tournée de livraison** : `camion`, `conducteur` (nom, donnée du camion, pas un rôle), `agent_accompagnant` (optionnel : l'agent de terrain qui confirme les livraisons), `arrets` (client, bon, ordre, heure estimée, encaissement attendu), `remplissage_pct`, `contrainte` (`POIDS | VOLUME`), `distance_km`, `cout`, `depart`, `statut`.
- **Réception** : `commande_fournisseur`, `point_de_stock`, `lignes` (`quantite_recue`, `conforme`, `motif_ecart`), `niveau_controle` (`INTEGRAL | RENFORCE | ALLEGE`), `decisions_d_ecart` (`ACCEPTE | RESERVE | LITIGE | REFUS`), `taux_conformite`, `receptionne_par` (GEST_ENTREPOT), `date`.
- **Litige** : `numero`, `reception`, `fournisseur`, `lignes`, `montant_conteste`, `statut` (`OUVERT | EN_NEGOCIATION | RESOLU_AVOIR | RESOLU_REMPLACEMENT | RESOLU_REFUS | CLOS`), `responsable`, `echeance`, `pieces_jointes`, `resolution`.
- **Comptage d'inventaire** : `article`, `classe` (`A | B | C`), `point_de_stock`, `emplacement`, `quantite_theorique`, `quantite_comptee`, `ecart`, `ecart_pct`, `statut` (`A_COMPTER | EN_RETARD | COMPTE | A_VALIDER | RECOMPTER | VALIDE`), `compteur`, `second_compteur`.

#### FR-68 : Préparer les commandes (picking)

Un magasinier voit les bons de préparation de son entrepôt et les prépare ligne par ligne. Réalise UJ-1.

**Conséquences (testables) :**
- Le carnet est composé des commandes `VALIDEE` et `PREPARATION` du Point de stock, triées par score de priorité (table de 5.1). Il est libéré dans cet ordre jusqu'à la capacité du jour (FR-69) ; le reste va à l'arriéré (arriéré = carnet − libérées − suspendues). Cet ordre est celui de la préparation : il ne change pas la réservation posée à la validation (FR-34, FR-220).
- Le magasinier n'a pas accès au carnet de commandes ni aux prix : il reçoit des bons de préparation.
- Il valide chaque ligne servie avec la quantité réellement préparée et le lot. Il peut déclarer `PARTIELLE` ou `RUPTURE`.
- Un substitut est proposé si un article de même catégorie, même site, a du stock net suffisant et un prix inférieur ou égal à 125 % de l'original. Le substitut n'est servi qu'avec l'accord d'un rôle de bureau (DC, RESP_VENTES, COMPTABLE). Comportement par défaut : l'accord du bureau est obligatoire.
- Un bon dont le client a son crédit bloqué après la validation passe `BLOQUER` et ne se prépare pas : `CREDIT_BLOQUE`. La réservation posée à la validation reste jusqu'à l'annulation de la commande ou au déblocage (FR-34) ; au déblocage, le bon revient dans le carnet. Un camion déjà parti n'est jamais rappelé par cette règle.
- Quand toutes les lignes sont servies, le bon est `PREPARE` ; la commande passe `PREPARATION` dès la première ligne servie.
- Le bon s'imprime en PDF : lignes triées dans l'ordre de parcours, emplacement et allée.
- Poids, volume et palettes du bon se calculent avec les attributs logistiques de l'article (poids, volume, unités par palette), tenus par le module `catalogue` (renvoi, partie 4). Un article sans poids ni volume est signalé « non chargeable », jamais compté à zéro.
- « Aucun prix, marge, CA ni plafond » est une règle de rôle, testée sur toutes les réponses du serveur à ce rôle.

#### FR-69 : Vagues et charge du jour

Un responsable stock regroupe les bons en vagues et voit si l'équipe présente peut sortir le travail avant l'heure de départ. Réalise UJ-1.

**Conséquences (testables) :**
- Les vagues regroupent les bons par zone de livraison, dans trois créneaux : 07:00-09:30, 09:30-12:00, 13:00-heure de départ du site. Un préparateur par vague.
- L'heure de départ des camions et les capacités sont des paramètres de chaque point de stock. Jeu de démonstration : Lomé Port, 3 200 m², 1 450 emplacements, 4 quais, départ 15:30 ; Kara, 900 m², 380 emplacements, 1 quai, départ 14:00.
- Une vague est `tenable` si sa durée ne dépasse pas 150 minutes.
- La capacité du jour = `Σ cadence × heures disponibles` des préparateurs présents. Durée d'un bon = `lignes / cadence moyenne × 60` minutes ; cadence par défaut 35 lignes/heure.
- Une alerte s'affiche si le taux de charge dépasse 85 % ou si des lignes sont reportées. Alerte structurelle si l'arriéré dépasse 2 fois les commandes libérées.
- Un préparateur absent se déclare ; la capacité se recalcule.
- Le responsable stock démarre une vague : les bons passent `EN_COURS` avec l'heure et l'auteur.
- Préparateurs et camions sont des données de l'organisation, éditables (FR-225). Comportement par défaut : création, modification et absence, par le responsable stock.

#### FR-70 : Charger les camions et valider le départ

Un GEST_ENTREPOT ou un responsable stock charge des bons préparés dans un camion et valide le départ. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Le plan de chargement place les bons du plus lourd au plus léger, par zone, dans les camions disponibles triés par charge utile. Il respecte le poids ET le volume (attributs logistiques de l'article, module `catalogue` ; capacités du camion, FR-225).
- Remplissage = `max(poids / charge utile, volume / volume utile)`. Une tournée sous 65 % est signalée « non rentable ».
- Un bon qui ne rentre dans aucun camion disponible est listé « non chargé ».
- « Valider le départ » passe les bons à `EXPEDIE`, enregistre l'heure, le camion et le conducteur, et sort le stock : le Stock réservé devient un mouvement de sortie dans `stock`. Les bons passent `LIVRE` à la confirmation de livraison (FR-36).
- La feuille de route s'imprime (PDF) : arrêts dans l'ordre (FR-226), clients, adresses, encaissement attendu pour chaque arrêt. Elle ne porte aucun prix de freelance.
- La livraison est confirmée par l'agent de terrain qui accompagne la tournée (application terrain, y compris hors connexion) ou, au retour du bon signé, par le GEST_ENTREPOT. L'agent saisit l'encaissement reçu en espèces ; ce montant est ensuite une remise à rapprocher (module Terrain et caisse, partie 3).
- Un camion indisponible se déclare avec le motif ; il sort du plan.
- La signature du client à l'écran est « bientôt » ; la photo du bon signé est possible en février.

#### FR-71 : Réception unique de marchandises (contrôle au quai)

Un magasinier reçoit une livraison de fournisseur en comptant ce qui arrive. Il n'y a qu'un seul écran de réception. Réalise UJ-6.

**Conséquences (testables) :**
- Les réceptions attendues sont les commandes fournisseurs `ENVOYEE`, `CONFIRMEE` ou `EN_TRANSIT` du Point de stock. Statut d'attente : `A_QUAI`, `ATTENDU_JOUR` (2 jours ou moins), `EN_RETARD`, `A_VENIR`.
- Les quantités reçues ne sont JAMAIS pré-remplies avec le commandé. Une réception se valide seulement si chaque ligne a une quantité saisie : `QUANTITE_RECUE_NON_SAISIE`. (La démo pré-remplissait.)
- Pour chaque ligne : `ecart_pct = |reçu − commandé| / commandé`. `ACCEPTE` si l'écart est nul ou ≤ 2 % et la ligne conforme ; `RESERVE` si ≤ 5 % ; `LITIGE` au-delà ; `REFUS` si la ligne est marquée non conforme.
- Niveau de contrôle selon le fournisseur : `INTEGRAL` si taux de litige ≥ 5 % ou taux conforme < 90 % ; `RENFORCE` si taux conforme < 97 % ; sinon `ALLEGE`.
- À la validation, la réception met en stock les quantités acceptées (mouvement d'entrée dans `stock`, avec le lot), met à jour la commande fournisseur (`RECUE_PARTIELLE`, `RECUE` ou `LITIGE`, FR-62), crée la dette (FR-67) et ouvre un Litige (FR-72) pour chaque ligne `LITIGE` ou `REFUS`.
- Les actions du bilan ne sont plus du texte : mise en stock, litige ouvert, note recalculée sont effectives.
- Une réception validée ne se modifie plus. Une erreur se corrige par un ajustement de stock tracé (responsable stock).
- Charge des quais : durée d'une réception vs capacité `quais × 8 h × 60 × 0,5` ; saturation signalée.

#### FR-72 : Litiges de réception

Un responsable stock suit chaque litige jusqu'à sa résolution. Réalise UJ-6.

**Conséquences (testables) :**
- Un litige a un numéro, un responsable, une échéance, des pièces jointes (photos du quai) et un historique.
- Il porte le montant contesté = `|écart| × prix d'achat` des lignes en manquant ou refusées. C'est « l'avoir à réclamer ».
- Statuts : `OUVERT → EN_NEGOCIATION → RESOLU_AVOIR | RESOLU_REMPLACEMENT | RESOLU_REFUS → CLOS`. Le montant d'avoir obtenu réduit la dette fournisseur (FR-67).
- Un litige ouvert bloque le paiement de la ligne contestée.
- Le taux de litige du fournisseur est calculé à partir de ces objets, et alimente la note (FR-60) et le niveau de contrôle (FR-71).
- Un litige sans mouvement depuis 15 jours (délai par défaut, paramètre) est signalé au responsable stock.
- Un litige ne se supprime pas ; il se clôt avec un motif.
- Le délai de traitement des litiges est un indicateur du superviseur (partie 3, tableaux de bord).

#### FR-73 : Inventaire tournant par classe ABC

Un responsable stock planifie les comptages ; un magasinier compte. Réalise UJ-6.

**Conséquences (testables) :**
- Le classement ABC se calcule sur la valeur de consommation annuelle au coût d'achat (`ventes 30 j × 12 × coût`). A = cumul jusqu'à 80 %, B = jusqu'à 95 %, C = le reste.
- Fréquences de comptage : A tous les 30 jours, B tous les 90 jours, C tous les 180 jours.
- Une tâche est `EN_RETARD` si le retard dépasse 15 jours, `A_COMPTER` sinon dès l'échéance. Tri : retards, puis écarts récents, puis classe.
- Les « écarts récents » sont les écarts réels des 3 derniers comptages. (Plus de tirage au hasard.) Trois écarts font suspecter l'article.
- Le magasinier saisit la quantité comptée sans voir la quantité théorique. Comportement par défaut : comptage « en aveugle » ; la démo affichait le théorique.
- Durée prévue d'un comptage = max(4, palettes × 3 + 4) minutes, avec palettes = stock / unités par palette (attribut de l'article, module `catalogue`).
- Un article de classe A est recompté par un second magasinier si l'écart dépasse le seuil (FR-74).
- La fiabilité d'inventaire = part des références non suspectes. La démarque sur 90 jours estimée = `Σ stock × 1,5 % × coût` des suspects.

#### FR-74 : Un inventaire validé corrige le stock

La validation d'un comptage corrige le stock dans le module `stock`. Réalise UJ-6.

**Conséquences (testables) :**
- `ecart = compté − théorique à l'instant du comptage` ; `ecart_pct = ecart / théorique`. Si le théorique vaut 0, l'écart en pourcentage n'est pas calculé : tout écart non nul exige un recomptage.
- Écart jusqu'à 1 % : ajustement automatique. Écart de 1 à 3 % : validation du responsable stock. Écart au-delà de 3 % : recomptage obligatoire, par deux personnes si l'article est de classe A. Seuils paramétrables.
- Un comptage validé crée un mouvement d'ajustement de la valeur de l'écart dans le module `stock`. Sans mouvement entre le comptage et la validation, le stock après = quantité comptée. Test : théorique 120, compté 117, écart −3, −2,5 % ; validation du responsable ; le stock disponible devient 117 après la validation. Si 5 caisses sortent entre le comptage et la validation, il devient 112.
- Le mouvement porte le comptage, les deux comptes, l'auteur et le motif.
- La valeur de l'écart se calcule au coût d'achat ; elle est visible du responsable stock, pas du magasinier.
- L'annulation d'un comptage non validé ne touche pas le stock. Un comptage validé s'annule par un ajustement inverse tracé.
- Pendant un inventaire de l'article, les sorties restent possibles. Comportement par défaut : pas de gel du stock ; l'écart est ajusté des mouvements intermédiaires.
- Si `stock` n'est pas installé, aucun comptage ne peut être validé : « non installé ».

#### FR-75 : Poste du magasinier et périmètre

Le gestionnaire d'entrepôt ne voit que son entrepôt, sans prix. Réalise UJ-1.

**Conséquences (testables) :**
- Un magasinier est rattaché à un Point de stock. Il ne lit que les bons, réceptions et comptages de ce point ; l'autre entrepôt est refusé : `POINT_DE_STOCK_HORS_PERIMETRE`.
- Le DG et le responsable stock choisissent l'entrepôt.
- La vue stock du magasinier montre emplacement, stock, réservé, disponible, palettes. Aucun prix, aucune marge, aucun chiffre d'affaires.
- Le magasinier n'a pas accès à la commande ni à l'approvisionnement ; il voit les livraisons attendues dans « Réceptions ».
- Le magasinier lit l'historique des bons de son entrepôt (numéro, destinataire, statut, date), sans valeur ; le responsable stock lit la valeur au coût d'achat.
- Seul le responsable stock ou le DG engage une dépense (transfert, commande, ajustement important).

#### FR-225 : Préparateurs et camions

Les préparateurs et les camions sont des données de l'organisation, rattachées à un point de stock. Ce ne sont pas des rôles. Réalise UJ-1.

**Conséquences (testables) :**
- Un préparateur a : nom, point de stock, cadence (lignes par heure, 35 par défaut), heures disponibles, présence, absence avec motif.
- Un camion a : immatriculation, type (`PORTEUR`, `FOURGON`, `TRICYCLE`), point de stock, charge utile (kg), volume utile (m³), conducteur (nom), coût de mise en route, coût au kilomètre, disponibilité avec motif.
- Création, modification et indisponibilité : RESP_STOCK et DG. Le GEST_ENTREPOT déclare l'absence d'un préparateur ; la capacité du jour se recalcule (FR-69).
- Le taux d'erreur de préparation est mesuré (lignes corrigées au contrôle / lignes préparées), jamais saisi.
- Le jeu de démonstration crée au moins 5 préparateurs et 6 camions, répartis entre Lomé Port et Kara.

#### FR-226 : Coût et ordre d'une tournée de livraison

Le module calcule l'ordre des arrêts et le coût de chaque tournée de livraison. Réalise UJ-1.

**Conséquences (testables) :**
- Distance = distance à vol d'oiseau × 1,35 (coefficient routier, paramètre).
- Coût de la tournée = coût de mise en route du camion + kilomètres × coût au kilomètre. Coût par palette = coût / palettes chargées.
- Ordre des arrêts : le plus proche voisin, depuis le point de stock. Heure d'arrivée estimée par arrêt, avec la vitesse et la durée d'arrêt de l'organisation (paramètres).
- Économie de regroupement = coût d'une tournée par commande − coût réel de la tournée.
- Un camion sans coût renseigné affiche « non calculable », jamais 0.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Tolérance de réception | 2 % | oui | `reception-engine.ts:19` |
| Seuil de litige | 5 % | oui | `:21` |
| Niveau de contrôle | `INTEGRAL` si litige ≥ 5 % ou conforme < 90 % ; `RENFORCE` si < 97 % | oui | `:103-120` |
| Seuil d'écart d'inventaire | 3 % (≤ 1 % auto) | oui | `inventaire-engine.ts:91` |
| Classes ABC | A ≤ 80 %, B ≤ 95 %, C reste | oui | `:114-163` |
| Fréquence de comptage | A 30 j, B 90 j, C 180 j | oui | `:93` |
| Retard de comptage | `EN_RETARD` au-delà de 15 j | oui | `:176-211` |
| Capacité de préparation | `Σ cadence × heures` ; cadence par défaut 35 lignes/h | oui | `picking-engine.ts:414-418` |
| Vague tenable | durée ≤ 150 min | oui | `:430-487` |
| Remplissage rentable | ≥ 65 % | oui | `expedition-engine.ts:20` |
| Charge des quais | `quais × 8 h × 60 × 0,5` | oui | `reception-engine.ts:300-319` |
| Substitut | même catégorie, même site, prix ≤ 125 % | oui | `picking-engine.ts:228-249` |
| Score de priorité | voir 5.1 | non en février | `:176-196` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Ouvrir ou replier un bon | LECTURE | FR-68 |
| (absent) Imprimer le bon, valider une ligne servie, accepter un substitut | n'existent pas | FR-68 |
| (absent) Démarrer une vague | n'existe pas | FR-69 |
| (absent) Valider le départ camion, feuille de route, signature | n'existent pas | FR-70, FR-226 ; signature : bientôt |
| (absent) Créer ou modifier un préparateur, un camion | n'existent pas | FR-225 |
| Saisie des quantités reçues (pré-remplies) | SIMULÉ | FR-71 (jamais pré-remplies) |
| Valider le contrôle au quai | SIMULÉ (rien n'est mis en stock) | FR-71 |
| Annuler (réception, comptage) | SIMULÉ | FR-71, FR-74 (correction par ajustement tracé) |
| Saisie « compté » + Valider (inventaire) | SIMULÉ (stock non corrigé) | FR-73, FR-74 |
| Choix de l'entrepôt (RESP_STOCK, DG) | LECTURE | FR-75 |
| (absent) Suivre un litige | n'existe pas | FR-72 |

**Notes.**
- « Lancer la navette » (transfert entre points de stock) et « Lancer le scénario » (plan de liquidation) appartiennent au module `stock`, comme exigences d'amendement de son PRD avec leurs règles chiffrées (partie 4, §7.4). Ils sont SIMULÉS dans la démo ; le module `entrepot` exécute le mouvement physique d'un transfert quand `stock` le décide (FR-68 à FR-70). Tant qu'ils ne sont pas branchés, ils affichent « bientôt ».
- Décidé par le PO (jeu de test) : Grossiste du Golfe a deux entrepôts, Lomé Port et un dépôt à Kara, avec emplacements et lots à date limite pour les jus. La structure réelle du client de février s'obtient au prochain rendez-vous ; elle se saisit en paramètres, sans changer les exigences.
- Les indicateurs de poste du responsable stock et du GEST_ENTREPOT sont au module Équipes et performance (partie 3, FR-122) ; ils lisent les données de ce module (délai de préparation, expéditions par jour, erreur de préparation, bons en attente).
- Le suivi GPS des camions et la preuve de livraison électronique sont hors périmètre de février.
- Le lien entre le chargement et la remise d'espèces de l'agent qui accompagne la tournée est décrit à la partie 3.

---

### 5.5 Conquête, territoires, objectifs et quotas (`conquete-objectifs`, M13)

**Dans la démo.** `/prospection` (« Conquête et Territoires », DG, DC, RESP_VENTES, PROSPECTION) a quatre onglets : Territoires (carte, zones, recensement), Carnet de prospects (entonnoir, motifs de perte), Ouvertures et survie (cohortes), Passation. `/objectifs` (DG, DC, RESP_VENTES, CONTROLE_GESTION) montre l'allocation par zone, l'atterrissage, le mix produit et la marge. Il n'a aucun bouton.
- **SIMULÉ :** « Activer le recensement » et le clic sur la carte (un `window.prompt` pour le nom) écrivent un prospect recensé dans le navigateur, qui n'alimente ni le carnet ni les chiffres. « Transférer » (passation) écrit un transfert local sans prévenir le commercial et sans l'ajouter à sa tournée. La corbeille retire un prospect local.
- **N'EXISTE PAS :** contacter, planifier une visite, faire avancer d'étape, marquer perdu, créer l'ouverture, nouveau prospect ; saisir ou réallouer un quota ; objectif par commercial ou par point de vente.
- **Chiffres fabriqués :** l'objectif du point de vente vaut `CA × 1,1` (circulaire) ; les objectifs de zone utilisent 11 jours écoulés sur 26 en dur ; le mix produit est identique pour tous les périmètres ; la « distribution numérique » est un proxy (`couverture × 0,82`).
- **À reprendre tel quel :** les garde-fous de conquête (`REGLES_CONQUETE`), qui sont des règles métier explicites.

**Ce que le module fait.** Il aide le chargé de prospection à ouvrir de nouveaux points de vente qui durent. Il montre les zones non couvertes, tient le carnet de prospects, empêche les ouvertures risquées par des garde-fous qui BLOQUENT, suit la survie des ouvertures à un et trois mois, calcule leur valeur nette, et organise la passation au commercial du secteur. Il porte aussi les objectifs par zone, par commercial et par point de vente, la projection de fin de mois et le mix produit. Le module réalise UJ-7 (l'ouverture qui tient).

**Objets.**
- **Zone de conquête** : `zone`, `commercial`, `statut` (`A_RECENSER | RECENSEMENT_EN_COURS | EN_CONQUETE | COUVERTE | ABANDONNEE`), `pdv_estimes`, `pdv_recenses`, `pdv_ouverts`, `distance_depot_km`, `cout_service_mois`, `potentiel_ca_mois`, `concurrent_installe`.
- **Prospect** : dossier de conquête d'un point de vente à l'état `PROSPECT` du module `pdv` (`point_de_vente`), `nom`, `zone`, `quartier`, `telephone`, `adresse`, `lat`, `lng`, `type_commerce`, `surface_m2`, `ca_estime_mois`, `capacite_paiement` (`COMPTANT | CREDIT_7J | CREDIT_30J | INCONNUE`), `concurrent_fournisseur`, `etape` (`RECENSE | QUALIFIE | PREMIER_CONTACT | OFFRE_ENVOYEE | PREMIERE_COMMANDE | PERDU`), `jours_dans_etape`, `commercial`, `source` (`RECENSEMENT | SOCIAL | RECOMMANDATION | AUTRE`), `motif_perte`, `prochaine_action`, `prochaine_action_date`, `historique`.
- **Ouverture** : `point_de_vente`, `zone`, `commercial`, `mois_ouverture`, `ca_premiere_commande`, `conditions_premiere_commande`, `reachat_m1`, `reachat_m3` (`vrai | faux | non jugeable`), `impaye`, `sante` (`VIVANT | DORMANT | MORT | IMPAYE`), `cout_acquisition`, `marge_cumulee`, `transfere_a`, `jours_depuis_ouverture`.
- **Passation** : `ouverture`, `commercial_secteur`, `date`, `auteur`, `statut` (`EN_ATTENTE | ACCEPTEE`).
- **Objectif** : `perimetre` (`ZONE | COMMERCIAL | POINT_DE_VENTE`), `cible`, `periode` (mois), `indicateur` (`CA | MARGE | VISITES | NOUVEAUX_PDV | ENCAISSEMENT | DN`), `valeur`, `fixe_par`, `date`.
- **Garde-fous de conquête** : paramètres de l'organisation (voir FR-79).

#### FR-76 : Zones non couvertes et recensement

Un chargé de prospection voit les zones non couvertes et recense les commerces qu'il y trouve. Réalise UJ-7.

**Conséquences (testables) :**
- Une carte montre les zones colorées par statut et les commerces recensés. Les zones sont celles du module `reseau`. Décision du PO du 2026-11-12 (manifeste `pdv`) : la carte utilise Google Maps ; la démo avait Leaflet/OpenStreetMap.
- « Recenser » ouvre un formulaire (nom, type de commerce, téléphone, adresse) et prend les coordonnées du point pointé ou de la position du téléphone. Il remplace le `window.prompt` de la démo.
- Un commerce recensé crée un point de vente à l'état `PROSPECT` dans `pdv` et son dossier `RECENSE` dans le carnet (FR-77) ; il augmente le compteur de la zone. La démo gardait deux listes séparées.
- Le point de vente `PROSPECT` reçoit les conditions de règlement par défaut de l'organisation et, pour plafond, le garde-fou de la première commande (FR-79). Il porte le chargé de prospection comme commercial.
- Doublon : un commerce de même téléphone, ou à moins de 30 mètres avec un nom proche d'un prospect ou d'un point de vente existant, est signalé avant création. Seuil de proximité par défaut : 30 m, paramètre ; la clé primaire du dédoublonnage est le téléphone (PRD pdv FR-V06) et la proximité est un contrôle secondaire.
- Chaque zone affiche : statut, distance au dépôt, coût de desserte mensuel, potentiel, concurrent installé, recensement (recensés / estimés), conversion (ouverts / recensés).
- La rentabilité de la desserte = `cout_service_mois / potentiel_ca_mois`; rouge au-dessus de 15 %. La conversion est verte à 20 % et plus.
- Le chargé de prospection modifie le statut d'une zone (démarrer le recensement, mettre en conquête, abandonner) avec un motif.

#### FR-77 : Carnet de prospects

Un chargé de prospection tient son carnet de prospects et fait avancer chacun d'étape en étape. Réalise UJ-7.

**Conséquences (testables) :**
- Un prospect se crée à la main, par recensement (FR-76) ou depuis le studio social (FR-92).
- Étapes : `RECENSE → QUALIFIE → PREMIER_CONTACT → OFFRE_ENVOYEE → PREMIERE_COMMANDE`, ou `PERDU` à tout moment avec un motif obligatoire.
- Une étape se franchit par action (« Qualifier », « Contacter », « Envoyer l'offre ») qui enregistre l'auteur, la date et une note. Passer à `OFFRE_ENVOYEE` crée une proforma (FR-54).
- La prochaine action et sa date sont des champs qui apparaissent dans la tournée du chargé (module `visites`).
- Un prospect de plus de 21 jours dans la même étape est « bloqué » (FR-79).
- Le score 0 à 100 affiché sur un prospect est le score de santé de son point de vente : une règle de `dashboard`, déposée dans `pdv` avec sa provenance (décision du PO du 2026-11-12). Comportement par défaut : « non défini » tant que la règle n'a rien déposé ; la démo saisissait le score à la main, ce n'est pas repris.
- Une commande se saisit pour un prospect comme pour tout point de vente (FR-30). Le prospect passe à `PREMIERE_COMMANDE` quand sa première commande est livrée (FR-80), pas à la saisie.
- Un commercial ne voit que ses prospects ; un responsable des ventes ceux de ses zones.

#### FR-78 : Entonnoir et goulot

Un responsable des ventes lit l'entonnoir de conquête et voit où les prospects se bloquent. Réalise UJ-7.

**Conséquences (testables) :**
- Pour chaque étape : nombre de prospects non perdus ayant atteint cette étape ou une étape plus avancée, pourcentage des recensés, nombre de « bloqués » (plus de 21 jours dans l'étape).
- Le goulot = l'étape qui a le plus de dossiers bloqués.
- Les motifs de perte sont classés évitables ou non évitables (concurrent exclusif, exclusivité = non évitable).
- Le résultat est calculé sur les prospects enregistrés, pas sur un registre fixe.
- Un entonnoir sans prospect affiche 0 prospect et « aucun goulot ».
- L'en-tête affiche les 9 chiffres de la démo, tous calculés : zones en conquête, recensement % (Σ recensés / Σ estimés des zones non abandonnées), prospects actifs, dossiers bloqués, réachat M+1, survie M+3, ouvertures orphelines, valeur nette, alertes critiques.

#### FR-79 : Garde-fous de la première commande et du carnet

Les règles de conquête BLOQUENT l'action risquée. Elles sont des Garde-fous, paramétrables par organisation. Réalise UJ-7.

**Conséquences (testables) :**
- **Plafond de crédit de la première commande : 1 500 000 XOF.** Une première commande à crédit au-dessus de ce montant est refusée à la validation (module `commande`, FR-33) : `PLAFOND_PREMIERE_COMMANDE`. Levée possible : acompte de 50 %, ou validation du DAF avec motif.
- **Prospect à crédit de 30 jours avec un CA estimé supérieur à 2 fois le plafond (3 M)** : acompte de 50 % exigé ou validation du DAF.
- **Distance maximale rentable : 35 km du dépôt.** Un prospect au-delà ne peut pas passer à `OFFRE_ENVOYEE` sans validation du responsable des ventes : `DISTANCE_AU_DELA_DU_RENTABLE`.
- **Dossier dormant : 21 jours** sans contact dans la même étape. Le dossier est signalé ; le chargé le relance ou le clôture avec un motif. Un dossier au score élevé (60 et plus, si le score existe) est signalé « fort potentiel ».
- **Passation : 45 jours.** Une ouverture `VIVANT` ou `DORMANT` sans commercial de secteur au bout de 45 jours est « orpheline » (FR-83).
- Chaque refus nomme le garde-fou, la valeur du paramètre et la valeur constatée. Le paramétrage est réservé à l'administrateur de l'organisation (DIST_ADMIN).
- Un garde-fou ne se contourne que par la dérogation prévue, avec motif et auteur.
- Les alertes sont triées `CRITIQUE`, `HAUTE`, `MOYENNE`. Gravités : première commande à crédit au-dessus de 1,5 M : `CRITIQUE` si elle est impayée, sinon `HAUTE` ; prospect à plus de 35 km : `MOYENNE` ; dossier dormant : `HAUTE` si score ≥ 60, sinon `MOYENNE`, avec l'action « clôturer : le dossier ne rembourse pas son coût d'acquisition » ; ouverture orpheline : `CRITIQUE`.

#### FR-80 : Créer l'ouverture à la première commande livrée

Quand la première commande d'un prospect est livrée, son point de vente quitte l'état `PROSPECT` et l'ouverture est suivie. Réalise UJ-7.

**Conséquences (testables) :**
- Le prospect est déjà un point de vente à l'état `PROSPECT` (FR-76). À la livraison de sa première commande, le module `pdv` le passe au pipeline `PREMIERE_COMMANDE`. Aucun point de vente n'est créé à ce moment. Si `pdv` n'est pas installé, l'ouverture affiche « non installé » et ne peut pas être créée.
- Une Ouverture est créée avec la date, le montant et les conditions de la première commande, le coût d'acquisition et le commercial.
- La première commande est soumise aux garde-fous de FR-79.
- Un prospect déjà point de vente ne peut pas être ouvert deux fois : `PROSPECT_DEJA_CLIENT`.
- Le coût d'acquisition = coûts de visite et de desserte imputés à l'ouverture. Méthode d'imputation par défaut : valeur saisie, à affiner avec le contrôle de gestion.
- La date de l'ouverture est celle de la première commande livrée.

#### FR-81 : Survie des ouvertures à M+1 et M+3

Le module suit si un point de vente ouvert recommande. Réalise UJ-7.

**Conséquences (testables) :**
- `reachat_m1` est vrai si une deuxième commande est passée dans le mois qui suit l'ouverture. `reachat_m3` est vrai si le point de vente commande encore dans le troisième mois.
- Un `reachat_m3` d'une ouverture de moins de 3 mois est « non jugeable » et n'entre pas dans le calcul.
- Réachat M+1 = `ouvertures avec reachat_m1 / total des ouvertures`. Survie M+3 = `ouvertures avec reachat_m3 = vrai / ouvertures jugeables`. Vert à 60 % et plus (M+1), à 70 % et plus (M+3).
- Santé d'une ouverture : `VIVANT`, `DORMANT`, `MORT`, `IMPAYE` (constaté trois mois après la première commande).
- La cohorte par mois d'ouverture affiche vivants, dormants, morts, impayés.
- Les calculs lisent les commandes réelles du module `commande`. Sans lui : « non installé ».

#### FR-82 : Valeur nette d'une ouverture

Le module calcule ce que rapporte réellement un portefeuille d'ouvertures. Réalise UJ-7.

**Conséquences (testables) :**
- `valeur_nette = marge_cumulee − cout_acquisition − impayes`.
- La marge cumulée vient des factures (FR-53). Si la marge est « non calculable », la valeur nette l'est aussi.
- Une valeur nette négative affiche le bandeau « Le portefeuille d'ouvertures détruit de la valeur ».
- Le total du portefeuille est la somme des valeurs nettes des ouvertures, par commercial, par zone et par mois.
- Exemple de test : marge cumulée 180 000, coût d'acquisition 60 000, impayé 150 000 → valeur nette −30 000.
- Le chiffre alimente les indicateurs du poste du chargé de prospection (partie 3).

#### FR-83 : Passation (« Transférer ») au commercial du secteur

Un chargé de prospection passe une ouverture au commercial du secteur du point de vente. Réalise UJ-7.

**Conséquences (testables) :**
- La file de passation liste les ouvertures `VIVANT` ou `DORMANT` sans commercial de secteur, triées par ancienneté.
- Une ouverture est « orpheline » après 45 jours. Les jours de retard s'affichent.
- « Transférer » ouvre une liste des commerciaux du secteur du point de vente (module `reseau`), pas un `window.prompt`. Le commercial par défaut est celui de la zone.
- Le transfert change le commercial du point de vente dans le module `pdv` (affectation). Le point de vente apparaît dans le portefeuille et la tournée du commercial du secteur ; il sort de celui du chargé.
- Le commercial reçoit une notification (module `notification`) ; s'il n'est pas branché, la passation apparaît dans sa liste « passations à accepter ».
- Un transfert se défait (« Annuler le transfert ») tant que le commercial n'a pas accepté.
- Un point de vente dont l'ouverture est transférée reste suivi en survie (FR-81).
- Un commercial freelance ne peut pas recevoir une passation sans l'add-on Freelance (FR-93).

#### FR-84 : Objectifs par zone, par commercial et par point de vente

Un responsable des ventes ou un DC fixe les objectifs d'un mois. Réalise UJ-7 et UJ-1.

**Conséquences (testables) :**
- Un objectif a un périmètre (zone, commercial ou point de vente), une période (mois), un indicateur (CA, marge, visites, nouveaux points de vente, encaissement, distribution numérique) et une valeur. (La démo n'a qu'un quota de zone.)
- Le responsable des ventes pilote par zone et fixe les objectifs de zone ; il répartit ensuite sur les commerciaux. La somme des objectifs des commerciaux d'une zone ne dépasse pas l'objectif de zone sans avertissement. Comportement par défaut : avertissement et non blocage.
- L'objectif du point de vente est saisi, pas déduit du CA. (La démo prenait `CA × 1,1`.)
- Un objectif se modifie en cours de mois avec un historique ; le changement n'efface pas la valeur d'origine.
- La reprise des objectifs d'un fichier est possible (CSV). Le format du fichier est fixé au manifeste de reprise des objectifs.
- Un commercial lit ses propres objectifs ; il ne lit pas ceux des autres.
- Sans objectif saisi, l'avancement affiche « aucun objectif » et pas un pourcentage fabriqué.

#### FR-85 : Atterrissage et projection de fin de mois

Le module projette le résultat du mois à partir du rythme réel. Réalise UJ-1.

**Conséquences (testables) :**
- `ca_realise` = factures émises (HT) du périmètre sur le mois à date, avoirs du mois déduits. `rythme_actuel_jour = ca_realise / jours ouvrés écoulés`. `atterrissage = rythme_actuel_jour × jours ouvrés du mois`. `ecart_projete = atterrissage − quota`. `rythme_requis_jour = max(quota − réalisé, 0) / jours ouvrés restants`.
- Les jours ouvrés viennent d'un calendrier de l'organisation (dimanche non travaillé, jours fériés déclarés). La démo posait 11 sur 26 en dur.
- Statut de zone : `TIENT` si atterrissage ≥ quota, `JUSTE` si ≥ 92 % du quota, sinon `DECROCHE`.
- Les chiffres lisent les factures du module `facturation`; sans lui : « non installé ».
- Une zone sans objectif n'a pas de statut.
- Les arbitrages à rendre (zone qui décroche : exécution ou panier ; surperformance : réallouer ; CA non encaissé : geler le crédit) sont recalculés sur ces chiffres. Chaque arbitrage est une proposition, pas une action.
- Règles des arbitrages (paramètres) : zone qui décroche et couverture des visites < 80 % : « le problème est l'exécution, renforcer l'effectif » ; couverture ≥ 80 % : « le problème est le panier, pousser le mix à meilleure marge » ; zone dont les créances échues dépassent 25 % du CA : « geler les livraisons à crédit au-delà de 30 jours » ; 4 arbitrages au plus.
- Le seuil vert de « réalisé / quota » n'est pas une constante (42 % dans la démo = 11 jours sur 26) : il vaut la part du mois ouvré écoulée à la date de lecture.

#### FR-86 : Mix produit, marge et distribution numérique

Un DG, un DC ou un responsable des ventes lit le mix produit et la marge du périmètre. Réalise UJ-1.

**Conséquences (testables) :**
- Le mix = part du CA par famille d'articles (famille du module `catalogue`), sur les factures du périmètre. Il change selon le périmètre ; il n'est plus une constante.
- Marge du mix = `Σ part × marge de la famille`. Cible de marge paramétrable (16,5 % dans la démo).
- Une famille est « sur-représentée et peu margée » si sa part dépasse la cible de plus de 2 points et que sa marge est sous la cible de marge.
- Distribution numérique (DN) = points de vente ayant commandé dans la période / points de vente actifs du portefeuille. (La démo utilisait un proxy.) Vert à 75 % et plus.
- Une marge « non calculable » exclut la famille et l'indique.
- Les familles (boissons, jus, eaux, etc.) viennent du catalogue de l'organisation, pas de cinq familles fixes.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Plafond de la 1re commande à crédit | 1 500 000 XOF | oui | `prospection-registry.ts:114-123` |
| Distance maximale rentable | 35 km | oui | idem |
| Jours maximum sans contact | 21 | oui | idem |
| Jours avant passation | 45 | oui | idem |
| Acompte exigé | 50 % | oui | `prospection-builder.ts:224-307` |
| Seuil de CA estimé à crédit | 2 × plafond (3 M) | oui | idem |
| Réachat M+1 | `réachat_m1 / total` ; vert ≥ 60 % | seuil : oui | `:139,168` |
| Survie M+3 | `réachat_m3 vrai / jugeables` ; vert ≥ 70 % | seuil : oui | `:137-138,167` |
| Valeur nette | marge cumulée − coût d'acquisition − impayés | non | `:173` |
| Rentabilité de desserte | `coût de service / potentiel` ; rouge > 15 % | seuil : oui | `ConqueteView.tsx:434-436` |
| Conversion de zone | `ouverts / recensés` ; vert ≥ 20 % | seuil : oui | `:421` |
| Atterrissage | `rythme × jours ouvrés` ; `TIENT` ≥ 100 %, `JUSTE` ≥ 92 % | oui | `objectifs-builder.ts:111-143` |
| Cible de marge du mix | 16,5 % | oui | `:103` |
| DN verte | ≥ 75 % | oui | `ObjectifsView.tsx:70` |
| Indicateurs du poste « prospection » | survie M+3 (30), recensé → 1re commande (25), impayé 1re commande (20), coût d'acquisition (15), ouvertures transférées (10) | poids : oui | `kpi-postes-registry.ts:155-172` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Activer le recensement / carte | SIMULÉ (`window.prompt`, liste locale) | FR-76 |
| Corbeille « Retirer ce prospect recensé » | SIMULÉ | FR-77 (retrait avec motif) |
| Transférer (passation) | SIMULÉ (rien notifié) | FR-83 |
| Annuler le transfert | existe dans le contexte, aucun bouton | FR-83 |
| Onglets, sélection de zone ou de prospect | BRANCHÉ (état local) | FR-76 à FR-78 |
| (absent) Contacter, planifier une visite | n'existent pas | FR-77 (via la tournée, partie 3) |
| (absent) Faire avancer d'étape, marquer perdu | n'existent pas | FR-77 |
| (absent) Nouveau prospect, créer l'ouverture | n'existent pas | FR-77, FR-80 |
| (absent) Saisir ou réallouer un quota | n'existe pas | FR-84 |
| (absent) Simuler une réallocation | n'existe pas | bientôt |
| Rendre un arbitrage (« Transférer 1 commercial ») | texte seul | bientôt |

**Notes.**
- Par défaut, le responsable des ventes pose les statuts de zone `COUVERTE` et `ABANDONNEE`, à la main, avec motif.
- **Voulue (PO).** La segmentation actifs, dormants et VIP des points de vente : exigence du module `pdv` (FR-V26), voir la partie 4.
- La conquête n'est pas ★ pour février. Le rythme d'ouvertures visé par le client de février se saisit en objectifs (FR-84).
- Le score de santé 0 à 100 d'un point de vente n'a pas de formule dans la démo. Au premier jour, c'est une règle de `dashboard`, déposée dans `pdv` avec sa provenance (décision du PO du 2026-11-12).
- Les indicateurs d'équipe (classements, rémunération) sont au module Équipes et performance (partie 3). Droit par défaut : la rémunération individuelle n'est visible que des rôles qui ont ce droit explicite (pas superviseur ni contrôle de gestion) ; c'est un écart de la démo (`/equipe`) corrigé dans la partie 3.

---

### 5.6 Studio réseaux sociaux (`studio-social`, M24)

**Dans la démo.** `/marketing/social` (DG, DC, MARKETING) a cinq onglets : calendrier éditorial, idées et modèles, boîte de réception unique, performance, journal. Quatre canaux : WhatsApp (canal de vente), Facebook, TikTok, Instagram (compte non connecté).
- **BRANCHÉ dans la démo (objets créés, relus dans le calendrier) :** composer un nouveau post, dupliquer vers un autre réseau.
- **SIMULÉ :** « Valider et programmer » (le post affiche « programmé », rien n'est publié), réécrire, éditer, replanifier, supprimer ; « Envoyer » une réponse (aucun message ne part) ; « Créer le lead » (aucun lead créé).
- **MORT :** la réponse automatique « part dans 2 minutes sauf annulation » (aucune minuterie) ; connecter un compte.
- **« IA » :** les trois accroches proposées sont des gabarits par angle (`social-builder.ts:382-440`), pas un modèle de langage. Le calendrier de 7 jours est généré à partir des combos de stock, de la disponibilité et des zones blanches.
- **Chiffres :** coût mensuel de 420 000 F et marge incrémentale de 13 % en dur.

**Ce que le module fait.** Il prépare des publications pour WhatsApp, Facebook, TikTok et Instagram à partir de ce que le distributeur doit écouter ou vendre : stock à écouler, produits disponibles, zones à conquérir. Le responsable marketing valide chaque publication. Il reçoit les messages des clients dans une boîte unique, y répond, et transforme un message d'intérêt en prospect. **Ce qui part réellement en février : rien automatiquement.** Un post validé est rangé « À publier » avec son texte et son visuel prêts à copier ; la publication automatique par réseau est un bouton « bientôt ». La réponse à un client sur WhatsApp part par le module `notification` ; les autres réseaux restent « bientôt ». Le module réalise UJ-7 (le lead qui devient un prospect) et nourrit UJ-1 (promotion d'un stock à écouler).

**Objets.**
- **Compte social** : `reseau` (`WHATSAPP | FACEBOOK | TIKTOK | INSTAGRAM`), `identifiant`, `connecte` (`vrai | faux`), `date_connexion`.
- **Publication** : `date`, `heure`, `reseau`, `angle` (`ECOULEMENT | PROMO | PREUVE_SOCIALE | EDUCATION | DISPONIBILITE | ACQUISITION`), `statut` (`BROUILLON | A_VALIDER | PROGRAMME | A_PUBLIER_A_LA_MAIN | PUBLIE | ECHEC | ANNULE`), `accroche`, `corps`, `hashtags`, `appel_a_l_action`, `visuel`, `article`, `pourquoi` (raison commerciale), `source` (`MANUEL | PROPOSITION`), `validee_par`, `resultats` (portée, clics, leads, commandes).
- **Message reçu** : `reseau`, `auteur`, `contenu`, `recu_le`, `intention` (`COMMANDE | RECLAMATION | PRIX | DISPONIBILITE | PARTENARIAT | SPAM`), `delai_de_reponse` (heures), `reponse_suggeree`, `statut` (`NOUVEAU | REPONDU | TRANSFERE | LEAD_CREE | IGNORE`), `prospect`.
- **Rythme commercial** : `nom`, `periode` (semaine de paie 22-25, veille de marché, pic de chaleur, week-end).

#### FR-87 : Calendrier des publications

Un responsable marketing compose, modifie et planifie les publications d'un calendrier, par réseau. Réalise UJ-7 (en amont) et UJ-1.

**Conséquences (testables) :**
- Un post se crée à la main, depuis une idée, depuis un modèle ou depuis une proposition (FR-88). Il a un statut parmi `BROUILLON`, `A_VALIDER`, `PROGRAMME`, `A_PUBLIER_A_LA_MAIN`, `PUBLIE`, `ECHEC`, `ANNULE`.
- Le calendrier existe en vue liste et en vue semaine ; il filtre par réseau et par angle.
- Un post peut être modifié, replanifié, dupliqué vers un autre réseau (adapté en heure, longueur, hashtags et lien WhatsApp), supprimé ou rétabli. Ces actions sont enregistrées côté serveur.
- Le DG et le DC voient le calendrier ; ils ne rédigent pas. Droit par défaut : lecture seule du DG et du DC, comme dans la démo (`route-access.ts:47`).
- Les rythmes commerciaux (semaine de paie, veille de jour de marché, pic de chaleur) sont des repères paramétrables.
- Tout post enregistré est relu par les autres rôles autorisés (il ne disparaît pas au rechargement).
- Un journal d'activité liste chaque action sur les posts et les messages (auteur, heure, action).
- L'heure conseillée d'un post vient des résultats des 90 derniers jours du réseau ; sans résultat, elle affiche « non disponible ».

#### FR-88 : Accroches proposées

Le module propose trois variantes d'accroche et des posts à partir des données de l'organisation. Réalise UJ-1.

**Conséquences (testables) :**
- Les propositions s'appuient sur des données lues dans les autres modules : stock à écouler (module `stock`), disponibilité, zones non couvertes (FR-76). Un module non installé retire sa source avec la mention « non installé ».
- Chaque proposition affiche sa raison commerciale (« pourquoi ») et un score d'engagement estimé, étiqueté « estimation ».
- Les trois variantes d'accroche (urgence, bénéfice, question) sont générées à partir de gabarits ; l'écran dit « proposé par modèle de texte » tant qu'aucun assistant IA n'est branché. Le mot « IA » n'est utilisé que si un assistant génère réellement le texte. Conforme à la règle du PO « jamais un bouton qui simule » : en février, le texte vient des gabarits ; le module `assistant` se branche plus tard.
- Le choix d'une variante remplace l'accroche du post et est tracé.
- Une proposition qui contient un prix, un stock ou une promotion cite la valeur lue au moment de la proposition, et signale si elle a changé avant la validation.
- Une promotion de stock à écouler respecte le seuil de validation du DG (12 % de remise dans la démo).

#### FR-89 : Valider et programmer une publication

Le responsable marketing valide un post, qui devient prêt à partir. Réalise UJ-1.

**Conséquences (testables) :**
- « Valider et programmer » passe le post de `A_VALIDER` à `PROGRAMME` (réseau connecté) ou à `A_PUBLIER_A_LA_MAIN` (réseau non connecté). L'auteur et l'heure sont tracés.
- **Ce qui part réellement en février :** rien automatiquement. Un post `A_PUBLIER_A_LA_MAIN` affiche le texte, les hashtags et le visuel à copier, avec le rappel de l'heure choisie. Le responsable le publie lui-même puis marque « Publié ».
- Pour chaque réseau, un bouton « Publier automatiquement » est désactivé avec « bientôt » : WhatsApp (via `notification`) bientôt ; Facebook, Instagram et TikTok bientôt ; chacun dépend de la connexion du compte et de l'API du réseau.
- Jamais le statut `PUBLIE` ne s'affiche sans un retour réel du réseau ou une confirmation manuelle de l'utilisateur, étiquetée « marqué publié à la main ».
- Un échec de publication passe le post à `ECHEC` avec la raison, et alerte le responsable.
- Un post avec une remise au-dessus du seuil de validation du DG attend l'accord du DG (`EN_ATTENTE_DG`).
- Les résultats (portée, clics, leads, commandes) d'un post ne s'affichent que s'ils viennent d'une source réelle ; sinon « non disponible ».

#### FR-90 : Boîte de réception unique

Le responsable marketing et le bureau voient les messages de tous les réseaux dans une seule liste, triée par potentiel. Réalise UJ-7.

**Conséquences (testables) :**
- Chaque message a une intention (commande, réclamation, prix, disponibilité, partenariat, spam) et un délai de réponse cible : 1 h pour commande et réclamation, 2 h pour prix et disponibilité, 24 h pour partenariat. Un message hors délai est marqué.
- Le spam est écarté de la liste principale.
- **Ce qui entre réellement en février :** la saisie manuelle d'un message (copier-coller depuis le téléphone) avec son réseau et son auteur. La réception automatique des messages est un bouton « bientôt » par réseau : elle dépend des connecteurs WhatsApp Business, Meta et TikTok (Connecteurs hors février).
- La classification d'intention est faite par règles de mots-clés ; l'écran affiche sa confiance et dit « classement automatique ». L'utilisateur peut la corriger.
- Un message d'un client en impayé ne reçoit pas de réponse automatique : il est transféré au recouvrement (FR-91).
- Un message de commande peut ouvrir une commande (FR-38, canal `WHATSAPP`).

#### FR-91 : Répondre à un message

Un responsable marketing répond à un message, avec un garde-fou sur les clients en impayé. Réalise UJ-7.

**Conséquences (testables) :**
- La réponse suggérée est un texte modifiable. « Modifier » ouvre un éditeur.
- « Envoyer » ne s'active que si le réseau du message est branché à un moyen d'envoi réel. WhatsApp : la réponse part par le module `notification`. Facebook, Instagram et TikTok : le bouton affiche « bientôt » et propose « Copier la réponse ». (La démo affichait « réponse envoyée » sans envoi.)
- Un message d'un client dont la Créance échue dépasse le garde-fou est marqué « NE PAS RÉPONDRE AUTOMATIQUEMENT » et transféré au recouvrement (partie 3). La réponse automatique est interdite dans ce cas : `REPONSE_AUTO_INTERDITE_CLIENT_EN_IMPAYE`.
- Les réponses automatiques (« part dans 2 minutes sauf annulation ») n'existent pas en février. Le texte et le bouton sont retirés tant qu'aucun envoi réel n'est branché.
- Chaque réponse est tracée : auteur, heure, canal, texte.

#### FR-92 : Créer un lead qui devient un prospect

Depuis un message d'intérêt, un responsable marketing crée un prospect dans le carnet de conquête. Réalise UJ-7.

**Conséquences (testables) :**
- « Créer le lead » crée un Prospect (FR-77) à l'étape `RECENSE`, donc un point de vente à l'état `PROSPECT` (FR-76), avec la source `SOCIAL`, le réseau, le nom, le téléphone et le message d'origine. (La démo n'écrivait que dans son journal.)
- Le prospect apparaît dans le carnet de la zone concernée, assigné au chargé de prospection de la zone.
- Un prospect de même téléphone existant est signalé : pas de doublon. Un point de vente déjà client est signalé : `PROSPECT_DEJA_CLIENT`.
- Le message passe à `LEAD_CREE` et garde le lien vers le prospect.
- L'attribution (lead → commande → CA) se lit sur le prospect et l'ouverture. Le CA « incrémental » (nouveaux clients et réactivations) n'est affiché que s'il se calcule à partir de ces liens.
- Sans le module `conquete-objectifs` installé, « Créer le lead » est remplacé par « Copier les coordonnées ». « non installé » s'affiche pour le carnet.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Délais de réponse | commande et réclamation 1 h ; prix et disponibilité 2 h ; partenariat 24 h | oui | `social-builder.ts:539-557` |
| Calendrier généré | WhatsApp chaque matin ouvré ; Facebook lundi, jeudi et mardi ; TikTok mercredi et vendredi soir | oui | `:243-277` |
| Seuil de validation DG | remise ≥ 12 % | oui | `combo-stock-workflow.ts:7` |
| Marge incrémentale | 13 % du CA incrémental | oui (ou calculée) | `:356-377` |
| Coût mensuel du studio | 420 000 F en dur | à saisir | `:356-377` |
| ROI | `(marge incrémentale − coût) / coût` | non | idem |
| Rythmes commerciaux | semaine de paie 22-25 ; veille de marché ; chaleur juin-septembre ; jeudi | oui | `social-registry.ts:75-107` |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Nouveau post, depuis une idée ou un modèle | BRANCHÉ (objet local) | FR-87 |
| Dupliquer vers un autre réseau | BRANCHÉ (objet local) | FR-87 |
| Réécrire (3 accroches) | SIMULÉ | FR-88 |
| Éditer à la main, replanifier, supprimer | SIMULÉ | FR-87 |
| Valider et programmer | SIMULÉ (rien publié) | FR-89 ; publication automatique : bientôt |
| Annuler la dernière action | SIMULÉ | FR-87 (historique) |
| Envoyer la réponse | SIMULÉ (aucun message ne part) | FR-91 (WhatsApp par `notification` ; autres réseaux : bientôt) |
| Modifier la réponse | SIMULÉ (sans éditeur) | FR-91 |
| Créer le lead | SIMULÉ (aucun lead) | FR-92 |
| Réponse automatique | MORT | bientôt |
| Connecter un compte (Instagram) | MORT | bientôt |
| Réception automatique des messages | n'existe pas | bientôt |

**Notes.**
- Ce module n'est pas ★. Il dépend de comptes et d'API tiers qui ne sont pas branchés. La règle du PO s'applique : aucun bouton qui simule.
- Les publications automatiques et la réception des messages dépendent des comptes WhatsApp Business, Facebook, TikTok et Instagram de chaque organisation. Sans eux, le studio se démontre en saisie manuelle et publication à la main, ce que le PRD exige.
- Le coût mensuel du studio (420 000 F en dur dans la démo) est un paramètre que le client saisit ; le ROI affiche « non calculable » tant qu'il n'est pas saisi.
- Le marketing (campagnes, combos stock → promotion) est au PRD marketing (partie 3). Le circuit « combos stock » est le seul de la démo branché de bout en bout ; il est le modèle des circuits à états à généraliser.
- Les réponses sur WhatsApp touchent des données personnelles de clients. Décision du PO du 2026-11-12 : la conservation des messages et le recueil du consentement suivent le PRD notification §9.2 (FR-25).

---

### 5.7 Add-on Réseau Freelance (`freelance`, M42)

**Dans la démo.** Pas de page propre. Le rôle `FREELANCE` a six écrans : tableau de bord (« ma marge du jour vs coût société »), Mon activité, Mes commandes grossiste, Disponibilité (prix société = « votre coût »), Facturation (proformas) et Mon portefeuille.
- **Contradictions :** le bandeau du freelance dit « marge non visible par la société », alors que la carte de commande du DG affiche « Marge free. » (`CommandesView.tsx:78-80`). La marge du freelance est un pourcentage du prix société (12 à 22 %), pas un écart de grille.
- **N'existent pas :** grille de prix freelance, prix client du freelance (le champ `grille_client_personnalisee` existe, inutilisé), plancher grossiste (cité, non codé), simulateur de marge, blocage d'une proforma sous marge minimale (12 % : avertit, ne bloque pas). Le freelance ne peut pas créer une commande depuis `/commandes` ; il transmet un panier depuis la disponibilité.
- **Chiffres à ne pas reprendre :** la rémunération du freelance (`ca_jour × 22 + marge_jour × 22`, somme du CA société et de la marge) est incohérente.
- **Prix de l'add-on (grille tarifaire) :** forfait Grand / Moyen / Petit, plus un prix par freelance actif (+25 000 / +16 000 / +10 000 F par mois en abonnement). [Voir la fiche de l'offre en partie 1.]

**Ce que le module fait.** Il permet au distributeur de travailler avec des commerciaux indépendants qui **vendent pour le compte de la société** (décision du PO du 2026-11-12). Le stock reste à la société jusqu'à la livraison au détaillant : le freelance n'achète pas de stock. Sa vente au détaillant est une commande de la société, servie par son stock et livrée sur son bon. **Le freelance facture le détaillant** à son prix, avec sa propre série et ses mentions d'émetteur (FR-224). Chaque ligne garde **les deux prix** : le prix freelance et le prix société. La société ne voit que le prix société. Le freelance doit le prix société à la société, même si son détaillant ne le paie pas. **La société lui verse une commission calculée sur le prix société**, acquise à la facturation. La marge de négociation (son prix moins le prix société) est à lui et reste invisible de la société. Exemple (UJ-9 « Le freelance qui négocie ») : prix société 14 000 F, vendu 15 000 F ; la société voit 14 000 F, la commission se calcule sur 14 000 F, les 1 000 F sont au freelance, et il doit 14 000 F même si son détaillant ne paie pas. Les points de vente du freelance appartiennent à l'entreprise : la société les connaît ; seuls les prix du freelance lui restent confidentiels. Le module réalise UJ-9 et UJ-2 (la tournée d'un freelance).

**Objets.**
- **Freelance** : lien vers un commercial du module `reseau` de type `FREELANCE`, `actif` (compté pour la facturation de l'add-on), `taux_commission`, `plafond_de_credit` (pour ce qu'il doit à la société), `marge_minimale_pct`, `regime_fiscal`, `serie_de_facturation` (FR-224), `date_activation`.
- **Grille société** : la grille de prix société du module `catalogue`. Non modifiable par un freelance.
- **Prix du freelance** : `freelance`, `article`, `prix_de_vente_ht`. Visible du freelance, de personne d'autre.
- **Portefeuille du freelance** : ses points de vente (module `pdv`, `portefeuille = freelance`). Ils appartiennent à l'entreprise.
- **Vente du freelance** : une Commande de la société (5.1), client = le détaillant, champ `freelance` rempli, lignes au prix société, servie par le stock de la société. Son double privé, dans l'espace du freelance, garde le prix freelance de chaque ligne.
- **Facture du freelance** : émise par le freelance au détaillant, à son prix (FR-224). Lue par le freelance seul.
- **Relevé de vente pour le compte** : la pièce de la société qui constate ce que le freelance lui doit pour une vente livrée : `numero` (`RVC-AAAA-NNNNNN`, suite continue de la société), `freelance`, `vente`, lignes au prix société (quantités livrées confirmées), montant HT, TVA (FR-45), TTC.
- **Dû du freelance** : la Créance de la société sur le freelance (tiers = freelance), ouverte par `paiement` à partir du relevé (partie 3).
- **Créance de son client** : ce qu'un détaillant doit au freelance. Suivie dans l'espace du freelance, visible de lui seul.
- **Reversement** : règlement du dû par période : `freelance`, `periode`, `montant_du_a_la_societe`, `montant_regle`, `statut` (`A_REGLER | REGLE | PARTIEL | EN_RETARD`).
- **Commission** : `freelance`, `vente`, `base` (montant HT au prix société), `taux`, `montant`, `acquise_le` (date de facturation), `statut` (`ACQUISE | VALIDEE | VERSEE`).

#### FR-93 : Double tarification : la grille société est intouchable

L'administrateur de l'organisation (DIST_ADMIN) active un commercial en freelance et lui rattache la grille société. Réalise UJ-9.

**Conséquences (testables) :**
- Le prix société d'une vente du freelance est celui de la grille société. Aucun écran ni appel ne lui permet de le modifier : `GRILLE_SOCIETE_NON_MODIFIABLE`.
- Le prix de la grille société s'affiche au freelance sous le libellé « prix société », jamais « coût d'achat » : le freelance n'achète pas.
- Le freelance fixe, pour chaque article, le prix auquel il vend à ses détaillants. Il saisit ce prix dans son écran ; c'est le « prix freelance ». Il peut l'ajuster sur une vente (négociation). Un article sans prix freelance n'a pas de marge calculée.
- Le freelance voit, par ligne, sa marge de négociation (`prix freelance − prix société`, en valeur et en pourcentage) et sa commission estimée (FR-98).
- Un prix freelance inférieur au prix société déclenche un avertissement ; il est autorisé (promotion). Une marge sous le minimum (12 % par défaut, paramétrable) affiche un bandeau et ne bloque jamais l'envoi (source : la démo, `MARGE_MIN_FREELANCE_PCT`). Aucune validation de la société ne porte sur le prix du freelance : la société ne le voit pas.
- Les prix négociés propres à un client de la société ne s'appliquent jamais au prix freelance.
- Sans le module `catalogue`, aucun prix n'est disponible : « non installé ».

#### FR-94 : Le prix du freelance n'est jamais visible de la société

Aucun rôle de la société ne lit le prix de vente, la marge de négociation ni les factures d'un freelance à ses détaillants. Réalise UJ-9.

**Conséquences (testables) :**
- Le prix de vente du freelance est stocké dans un espace lisible du freelance seul. Un appel au serveur par un autre rôle (DG compris) ne le retourne pas.
- Aucun écran de la société n'affiche « Marge free. ». La vente du freelance vue par le DG montre le montant au prix société seulement. (Corrige l'écart de la démo.)
- Fuites fermées : la conversion d'une proforma de freelance (FR-56) ne porte que le prix société dans la commande ; le PDF remis au détaillant ne porte jamais le prix société (FR-224) ; le bon de livraison et la feuille de route ne portent aucun prix (FR-36, FR-70) ; le score du poste freelance vu de la société ne contient pas sa marge (FR-99).
- Les exports de l'organisation, les rapports, les indicateurs d'équipe et les analyses ne contiennent pas le prix, la marge ni les factures d'un freelance. Test : chercher le prix freelance d'une ligne dans toutes les réponses du serveur à un rôle de la société : zéro occurrence.
- Les indicateurs de la société sur un freelance se limitent à ce que la société sait : ventes au prix société, dû, règlements, commission, points de vente rattachés.
- Le freelance voit les règles qui le concernent : sa grille société, ses prix, sa marge, sa commission, son dû.
- Le DG voit le classement des freelances sur les mesures de la société (CA société, règlement du dû, nombre de points de vente), pas sur leur marge.

#### FR-95 : Portefeuille isolé

Chaque freelance a un portefeuille de points de vente. Il ne voit que le sien ; la société, à qui ces points de vente appartiennent, les voit sans les prix du freelance. Réalise UJ-9 et UJ-2.

**Conséquences (testables) :**
- Un freelance ne lit que les points de vente de son portefeuille. L'adresse directe de la fiche d'un point de vente hors portefeuille est refusée : `PDV_HORS_PERIMETRE`.
- Un point de vente est dans un portefeuille de freelance ou dans un portefeuille de commercial salarié, jamais les deux. L'ajout d'un point de vente déjà au portefeuille d'un autre est signalé : `PDV_DEJA_AFFECTE`.
- Le portefeuille appartient à l'entreprise (PRD pdv FR-V09, FR-V12). Il ne se transfère que par décision du responsable des ventes (décideur par défaut), avec motif et trace.
- La société voit la liste des points de vente du freelance (nom, adresse, ventes au prix société), jamais ses prix (PRD pdv FR-V09 ; PRD catalogue FR-C29b).
- Ces points de vente sont couverts : ils n'entrent pas dans les listes de prospection de la société.
- Un freelance ne reçoit pas de passation d'ouverture sans que l'add-on soit actif (FR-83).
- Quand l'add-on est désactivé, le portefeuille est figé en lecture seule, et la société décide de sa reprise.

#### FR-96 : Vente du freelance, servie par le stock de la société

Le freelance vend à un détaillant de son portefeuille pour le compte de la société. Sa vente est une commande de la société, servie par son stock ; il facture le détaillant à son prix et doit le prix société à la société (décision du PO du 2026-11-12). Réalise UJ-9 et UJ-2.

**Conséquences (testables) :**
- Le freelance saisit la vente comme toute commande terrain (FR-37) : client = le détaillant, champ `freelance` = lui, lignes au prix société. Il fixe son prix par ligne dans son espace privé.
- Le freelance n'achète pas de stock. Il n'y a ni commande du freelance à la société ni écran d'achat « Mes commandes grossiste » : l'écran devient « Mes ventes » (FR-223). Le bandeau « paniers 2-4 M » de la démo (achat en gros) n'est pas repris.
- La vente suit le cycle de la commande : validation par le bureau (FR-33), réservation du stock de la société (FR-34), bon de livraison de la société (FR-36), sortie de stock au départ du camion (FR-70). Le stock reste à la société jusqu'à la livraison au détaillant.
- Le contrôle de crédit porte sur le freelance, qui porte le risque : son encours (FR-97) plus le montant TTC au prix société de la vente ne dépasse pas son plafond, sinon `PLAFOND_CREDIT_DEPASSE` ; un freelance dont le crédit est bloqué est refusé : `CREDIT_BLOQUE`.
- À la livraison confirmée, deux pièces naissent des quantités livrées : la facture du freelance au détaillant, à son prix (FR-224) ; le relevé de vente pour le compte, au prix société, qui constate le dû du freelance. `paiement` ouvre la Créance de la société sur le freelance à partir du relevé. La commission est acquise au même moment (FR-98).
- Chaque ligne garde les deux prix : le prix société sur la commande et le relevé, le prix freelance sur la facture du freelance. Le lien entre les deux vit dans l'espace du freelance. Les écrans et les réponses du serveur destinés à la société ne contiennent que le prix société (FR-94).
- Le freelance doit le prix société même si son détaillant ne le paie pas. Test (UJ-9) : prix société 14 000 F, prix freelance 15 000 F, livraison confirmée ; le détaillant ne paie pas ; le dû du freelance reste 14 000 F (TVA en plus selon FR-45) et sa commission ne change pas.
- Un retour de marchandise après facturation, remis au stock de la société et confirmé par le GEST_ENTREPOT, donne un avoir de la société sur le relevé : il réduit le dû et la commission au prorata. Un avoir du freelance à son détaillant ne change ni l'un ni l'autre.

#### FR-97 : Créances séparées et plafond de crédit séparé

Le dû du freelance envers la société et les dettes de ses détaillants envers lui sont deux choses distinctes. Réalise UJ-9.

**Conséquences (testables) :**
- Le freelance a un crédit avec un plafond propre (champ du freelance), distinct du plafond de ses détaillants. Il se règle par le DAF.
- L'encours du freelance suit FR-52 : dû ouvert (Créances de la société sur le freelance) + ventes validées non encore facturées (TTC au prix société) − crédit du tiers. Au-delà du plafond, ses ventes sont refusées : `PLAFOND_CREDIT_DEPASSE`.
- Un dû échu depuis plus de 60 jours, ou un encours au-delà du plafond, bloque le crédit du freelance comme celui de tout client (partie 3) ; le déblocage est une décision du DAF, jamais automatique.
- Les créances que les détaillants du freelance lui doivent naissent de ses propres factures (FR-224). Elles sont visibles du freelance seul. La société ne les voit pas ; elles n'entrent pas dans sa balance clients.
- La balance clients et la balance âgée de la société contiennent le dû du freelance et pas les créances de ses détaillants.
- Un détaillant impayé ne réduit ni le dû du freelance envers la société, ni sa commission.
- Le freelance règle son dû par PI-SPI, FedaPay, espèces ou virement, comme tout client (module `paiement`).

#### FR-98 : Commissions et reversements

Le module suit ce que le freelance doit à la société et calcule la commission que la société lui verse, sur le prix société. Réalise UJ-9.

**Conséquences (testables) :**
- **Commission (décision du PO du 2026-11-12) :** `commission = taux × montant HT au prix société` de chaque vente facturée (14 000 F dans l'exemple), jamais sur son prix de vente. Elle est acquise à la facturation, que le détaillant ait payé le freelance ou non. Le taux est un paramètre de l'organisation, réglable par freelance. Exemple de test : taux 5 %, vente de 14 000 F HT au prix société : commission 700 F, acquise le jour de la facture.
- La commission des salariés se calcule sur l'encaissé (partie 3) ; celle du freelance reste sur le prix société facturé (décision du PO du 2026-11-12).
- La commission passe de `ACQUISE` à `VALIDEE` (DAF), puis à `VERSEE` par un ordre du module `paiement`.
- **La marge de négociation** (prix freelance − prix société, 1 000 F dans l'exemple) appartient au freelance et n'est visible que de lui. Elle n'entre ni dans la base de la commission ni dans aucun chiffre de la société.
- Le reversement = règlement du dû par période. Le module suit le dû, le réglé, le restant et le retard. Le règlement passe par un Encaissement du module `paiement` (FR-49) et réduit la Créance de la société sur le freelance.
- Le versement de la commission et le règlement du dû sont deux mouvements distincts. Une compensation entre les deux est une décision du DAF, tracée.
- Le freelance voit son état : dû, réglé, restant, en retard ; commissions acquises, validées, versées.
- La formule de rémunération de la démo (`ca_jour × 22 + marge_jour × 22`) est incohérente et n'est pas reprise.
- La société voit la commission d'un freelance, jamais sa marge. Un freelance ne voit pas la rémunération des autres. Le superviseur et le contrôleur de gestion ne voient pas les rémunérations individuelles.
- Les reversements et commissions s'exportent en CSV pour le DAF, sans aucun prix freelance.

#### FR-99 : Classements séparés et activation de l'add-on

Les freelances sont classés à part des salariés, et l'add-on se compte par freelance actif. Réalise UJ-9 et UJ-2.

**Conséquences (testables) :**
- Le classement des freelances est séparé de celui des salariés.
- Deux scores distincts. **Score du freelance**, visible de lui seul : marge nette dégagée (30), CA société (20), points de vente du portefeuille (15), respect de la grille de prix (25), nouveaux points de vente (10) (poids de la démo). **Score vu de la société** : seulement les mesures qu'elle connaît, CA société (45), points de vente du portefeuille (33), nouveaux points de vente (22) (poids de la démo ramenés à 100, paramétrables). Test : à CA société constant, une variation de la marge d'un freelance ne change pas le score vu de la société.
- L'administrateur de l'organisation (DIST_ADMIN) active et désactive un freelance. Le nombre de freelances actifs est visible (il sert à la facturation de l'add-on : forfait plus prix par freelance actif).
- L'add-on est un module installable : sans lui, le type de commercial `FREELANCE` n'est pas proposé et les écrans freelance n'existent pas. Aucune donnée freelance n'est affichée « 0 » : elle affiche « non installé ».
- La désactivation d'un freelance ne supprime ni ses factures, ni ses relevés, ni son dû, ni ses commissions.
- Le jeu de démonstration contient 3 freelances sur 12 commerciaux, chacun avec un portefeuille de 25 à 60 points de vente, un plafond de crédit, un taux de commission et des prix propres.
- Le respect de la grille de prix = part des lignes vendues au-dessus de la marge minimale (12 %). La mesure appartient au freelance.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Marge minimale du freelance | 12 % de marge ; avertit, ne bloque pas | oui | `ProformaBuilder.tsx:22-23` |
| Majoration par défaut | 15 % | oui | idem |
| Panier minimal d'une commande de freelance | 2 à 4 M XOF (texte du bandeau) | non repris (le freelance n'achète pas) | `CommandesView.tsx:138` |
| Marge freelance | `prix freelance − prix société` (en valeur et en %) | non | nouvelle (la démo la posait à 12-22 % du prix société) |
| Commission | `taux × montant HT au prix société`, acquise à la facturation | taux : oui | nouvelle (décision du PO du 2026-11-12) |
| Respect de la grille de prix | cible 95 % | oui | `kpi-postes-registry.ts:134-146` |
| Tarification de l'add-on | forfait + prix par freelance actif | à fixer | fiche de l'offre |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Disponibilité : prix société = « votre coût » | LECTURE | FR-93 (libellé « prix société ») |
| Ajouter au panier, transmettre | SIMULÉ | FR-37, FR-96 |
| (absent) Fixer mon prix de vente | n'existe pas | FR-93 |
| (absent) Nouvelle commande depuis « Mes commandes grossiste » | n'existe pas | supprimé : le freelance n'achète pas ; sa vente se saisit par FR-96 |
| (absent) Facturer mon détaillant | n'existe pas | FR-224 |
| Marge visible par la société (« Marge free. ») | affichée | supprimée : FR-94 |
| (absent) Simulateur de marge | n'existe pas | bientôt |
| (absent) Blocage d'une proforma sous marge minimale | n'existe pas | aucun blocage : FR-93 (avertissement seul) |
| (absent) Suivi du dû et des commissions | n'existe pas | FR-98 |
| (absent) Activer ou désactiver un freelance | n'existe pas | FR-99 |

**Notes.**
- Ce module n'est pas ★ : le client de février n'est pas décrit comme ayant des freelances. Le jeu de démonstration en a trois, pour démontrer l'isolement.
- **Tranchée (PO, 2026-11-12).** Le freelance vend pour le compte de la société ; il n'achète pas de stock, qui reste à la société jusqu'à la livraison au détaillant.
- **Tranchée (PO, 2026-11-12).** Le freelance facture son détaillant dans Prospera, à son prix ; la société ne voit que le prix société.
- **Tranchée (PO, 2026-11-12).** La société verse au freelance une commission calculée sur le prix société, acquise à la facturation ; la marge de négociation est à lui.
- **Tranchée (PO, 2026-11-12).** Le freelance doit le prix société à la société, même si son détaillant ne le paie pas. Il a un crédit avec un plafond propre, bloqué comme tout client.
- Les points de vente d'un freelance restent à l'entreprise : la société voit la liste de ses détaillants (nom, adresse), sans ses prix (PRD pdv FR-V09 ; PRD catalogue FR-C29b).
- **Écart de l'offre.** Les trois documents de l'offre ne concordent pas sur le prix de l'add-on et le nombre de modules ; l'arbitrage appartient à la partie 1.

---
