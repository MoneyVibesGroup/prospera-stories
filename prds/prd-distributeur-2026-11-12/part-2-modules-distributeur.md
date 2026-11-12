## 5. Partie 2 — Les modules propres au distributeur

Cette partie décrit sept modules qui n'existent que pour un distributeur ou un grossiste : Commande, Facturation, Approvisionnement, Opérations entrepôt, Conquête et objectifs, Studio réseaux sociaux, Réseau Freelance. Le front de démo `prospera-distributeur` les définit. Le PRD exige tout ce que la démo présente, mais en vrai : chaque action est enregistrée côté serveur et relue par les autres rôles. Aujourd'hui rien n'est enregistré.

Deux modules sont ★ : le client de février en a besoin (Commande, Facturation). Les cinq autres sont écrits en entier, mais leur livraison suit les deux premiers.

Règles communes à tous les modules de cette partie :
- **Bouton « bientôt ».** Un bouton dont la capacité n'est pas branchée est visible, désactivé, et porte « bientôt » suivi d'une date. Jamais un bouton qui simule. Les dates ci-dessous sont des propositions. [ASSUMPTION: calendrier du plan v3 : démo le 15/01/2027, client de février en février 2027 ; toute date « bientôt » est à confirmer par le PO.]
- **Emplacement déclaré vide.** Si un module dont on dépend n'est pas installé, la donnée s'affiche « non installé », jamais 0. Exemple : marge d'une commande quand le coût d'achat n'est pas disponible ; solde de trésorerie quand aucun module financier n'est installé.
- **Jeu de démonstration.** Les exemples chiffrés viennent du grossiste fictif « Grossiste du Golfe » : Lomé Port et dépôt Kara, zones Lomé Centre, Golfe Nord et Plateaux, 12 commerciaux dont 3 freelances, environ 600 points de vente, jus et boissons, XOF, TVA 18 %.
- **Moyens de paiement.** Tout encaissement passe par le module `paiement` (renvoi, partie 4) : PI-SPI et FedaPay, plus espèces et virement déclarés. Aucune exigence de cette partie ne se limite à PI-SPI.
- **Garde-fou.** Un paramètre par organisation qui BLOQUE une action, avec un code de refus nommé et un message lisible. Il n'est jamais seulement affiché.
- **Périmètre.** Un rôle ne lit que son périmètre, côté serveur. Une URL ou un appel direct hors périmètre est refusé.

---

### 5.1 Commande (`commande`, M08) ★

**Dans la démo.** Trois écrans selon le rôle sur `/commandes` (`CommandesView.tsx`) : pilotage (DG, DC, DAF, RESP_VENTES, SUPERVISEUR, RESP_STOCK, GEST_ENTREPOT), prise de commande terrain (COMMERCIAL, PROSPECTION) et « Mes commandes grossiste » (FREELANCE). Le pilotage affiche 8 chiffres, un pipeline `BROUILLON → VALIDEE → PREPARATION → LIVREE`, un flux par entrepôt et une file prioritaire. Le catalogue (`CatalogueView.tsx`, onglet de `/stock`) est en lecture seule. La disponibilité (`DisponibiliteView.tsx`) donne `DISPONIBLE`, `LIMITE` ou `RUPTURE` sans la quantité.
- **MORT ou absent :** valider, passer en préparation, annuler ou modifier une commande ; bon de livraison (aucun type `BonLivraison`) ; vérification du stock à la validation (cette validation n'existe pas) ; ligne de commande typée (le champ `lignes` est un entier) ; réservation du stock.
- **SIMULÉ :** « Nouvelle commande terrain » ouvre un panier gardé dans le navigateur. « Transmettre la commande » écrit une `CommandeTerrain` locale (`terrain-workflow.ts`) sans vérifier le stock, sans calculer la marge, sans rien envoyer. Le nom du point de vente est un texte libre. Le canal WhatsApp n'est qu'une étiquette.
- **Deux modèles de commande** (`Commande` du registre, `CommandeTerrain` du navigateur) ne se parlent pas. Le PRD n'en garde qu'un.
- **Chiffres à ne pas reprendre :** taux de service forcé (`+12`, plancher 72, plafond 99), marge brute tirée au hasard entre 12,8 et 18,2 %, plancher grossiste cité mais non codé.

**Ce que le module fait.** Un chargé de bureau ou un commercial saisit une commande pour un point de vente. Le serveur fige le prix de chaque ligne depuis la grille de prix, vérifie le stock, puis, à la validation, contrôle le plafond de crédit et RÉSERVE le stock. Un bon de livraison est produit pour l'entrepôt. La commande terrain, la commande WhatsApp saisie et la commande du bureau sont le même objet avec un canal différent. Le module réalise UJ-1 (de la commande à la facture juste) et UJ-2 (la commande prise en visite).

**Objets.**
- **Commande** : `numero` (`CMD-AAAA-NNNNNN`, continu par organisation), `point_de_vente` (référence au module `pdv`, jamais un texte), `commercial`, `canal` (`BUREAU | TERRAIN | WHATSAPP | TELEPHONE`), `point_de_stock_source`, `date_livraison_souhaitee`, `conditions_reglement`, `montant_ht`, `montant_tva`, `montant_ttc`, `statut`, `motif_annulation`, `visite` (optionnelle), `id_client_appareil` (clé d'idempotence), `facture` (lien, rempli à la facturation).
  - Statuts : `BROUILLON`, `TRANSMISE` (reçue du terrain ou de WhatsApp, pas encore validée), `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE`. [ASSUMPTION: `TRANSMISE` est ajouté aux 5 statuts de la démo ; le brouillon `BROUILLON` de la démo n'était jamais produit.]
- **Ligne de commande** : `article`, `quantite_commandee`, `unite`, `prix_unitaire_ht` (figé à la saisie), `origine_du_prix` (`GRILLE_SOCIETE | PRIX_NEGOCIE_CLIENT | GRILLE_FREELANCE`), `remise_pct`, `quantite_reservee`, `quantite_servie`, `quantite_facturee`, `taux_tva`, `cout_unitaire` (si disponible), `lot` (optionnel, voir module `stock`).
- **Bon de livraison** : `numero` (`BL-AAAA-NNNNNN`), `commande`, `point_de_stock`, `lignes` (article, quantité servie, lot), `statut` (`EN_PREPARATION | EXPEDIE | LIVRE | AVEC_ECART`), `date_expedition`, `date_livraison`, `chauffeur`, `preuve_de_livraison`.
- **Réservation** : vit dans le module `stock` (Stock réservé). `commande` la demande et la libère ; il ne la stocke pas.

#### FR-30 : Créer une commande au bureau

Un chargé de bureau, un responsable des ventes ou un commercial peut créer une commande pour un point de vente de son périmètre : client, lignes, canal, date de livraison souhaitée. Réalise UJ-1.

**Conséquences (testables) :**
- Le point de vente se choisit dans une liste de son périmètre. Un texte libre est refusé. Un point de vente hors périmètre est refusé : `PDV_HORS_PERIMETRE`.
- Le numéro `CMD-AAAA-NNNNNN` est attribué à l'enregistrement du brouillon. Il est unique et croissant dans l'organisation. Deux créations simultanées reçoivent deux numéros distincts.
- Une commande sans ligne ne peut pas quitter `BROUILLON` : `COMMANDE_SANS_LIGNE`.
- Une commande `BROUILLON` ne réserve aucun stock.
- Une commande créée par un commercial apparaît dans la liste de son superviseur et du bureau dans la minute, sans rechargement manuel. [ASSUMPTION: « dans la minute » sert de critère de test.]

#### FR-31 : Ligne de commande typée et prix figé

Chaque ligne porte un article, une quantité, une unité et un prix unitaire HT lu dans la grille de prix du module `catalogue`. Le prix est figé sur la ligne à la saisie. Réalise UJ-1.

**Conséquences (testables) :**
- Ordre de recherche du prix : prix négocié du client, puis prix société. Un commercial freelance utilise la grille du freelance (FR-93). L'origine du prix est enregistrée sur la ligne.
- Un article sans prix applicable est refusé : `ARTICLE_SANS_PRIX`.
- Un changement de grille après la saisie ne modifie pas une commande existante.
- Les totaux suivent FR-45 : `Σ lignes = HT`, `TVA = 18 %`, `TTC = HT + TVA`, arrondis à l'unité XOF.
- Exemple de test : 10 caisses de jus d'orange 1 L à 6 000 XOF HT = 60 000 HT, 10 800 de TVA, 70 800 TTC.
- Une remise de ligne au-dessus du seuil de remise de l'organisation (paramètre) passe en validation d'un rôle supérieur : `REMISE_AU_DESSUS_DU_SEUIL`. [ASSUMPTION: le seuil de la démo pour les combos est 12 % ; il est repris comme valeur par défaut de ce garde-fou.]

**Hors périmètre :** les paliers de volume et les promotions automatiques (ils vivent dans la grille du module `catalogue`).

#### FR-32 : Vérifier le stock avant validation

À la saisie de chaque ligne, le module interroge le module `stock` et affiche la disponibilité. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Pour le chargé de bureau et le responsable stock : la quantité disponible (stock moins Stock réservé) du Point de stock source est affichée.
- Pour un commercial ou un freelance : seul le statut est affiché, sans quantité. `RUPTURE` si le disponible est 0 ou moins. `LIMITE` si le disponible est sous le seuil de l'article. `DISPONIBLE` sinon.
- Le statut se calcule sur le Point de stock source du client, pas sur la somme des entrepôts. (La démo consolidait tout le réseau.)
- Un article `RUPTURE` ne peut pas être ajouté à une commande terrain. Au bureau, la saisie reste possible mais la validation est refusée (FR-33).
- Si le module `stock` n'est pas installé, la disponibilité affiche « non installé » et la validation est refusée : `STOCK_NON_INSTALLE`. La commande ne se valide jamais sur un stock inconnu.

#### FR-33 : Valider une commande avec contrôles

Un chargé de bureau, un superviseur ou un responsable des ventes peut valider une commande `BROUILLON` ou `TRANSMISE`. Le serveur applique trois contrôles avant de passer à `VALIDEE`. Réalise UJ-1.

**Conséquences (testables) :**
- **Stock.** Chaque ligne doit avoir un disponible suffisant. Sinon `STOCK_INSUFFISANT`, avec la ligne et la quantité disponible. Le validateur peut réduire la ligne ou accepter une livraison partielle (FR-41).
- **Plafond de crédit.** Si `encours du client + TTC de la commande` dépasse le plafond de crédit du client (module `pdv`), la validation est refusée : `PLAFOND_CREDIT_DEPASSE`. Le plafond par défaut, quand le client n'en a pas, est `max(400 000 XOF, 0,6 × CA mensuel du client)`. [ASSUMPTION: règle de la démo, `picking-engine.ts:36-45`, reprise comme valeur par défaut paramétrable.]
- **Créance échue.** Si le client a une créance échue depuis 45 jours ou plus (paramètre), la validation est refusée : `CREANCE_ECHUE_BLOQUANTE`.
- Un DAF ou un DG peut lever un refus de plafond ou de créance par une dérogation avec motif obligatoire. La dérogation est tracée (qui, quand, motif, montant). [ASSUMPTION: rôles autorisés à déroger = DG et DAF.]
- Un client dont le crédit est bloqué par le recouvrement (module partagé, partie 3) est refusé : `CREDIT_BLOQUE`. Cette règle est nouvelle : dans la démo, le blocage de crédit ne changeait rien.
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
- La livraison transforme la réservation en sortie de stock (un mouvement dans le module `stock`).
- Une commande `VALIDEE` non préparée au bout de N jours est signalée au bureau ; la réservation n'expire pas toute seule. [ASSUMPTION: N = 7 jours, paramètre. Décision à trancher : expiration automatique ou non.]

**Hors périmètre :** la réservation des lots promotionnels (combos stock, marketing).

#### FR-35 : Modifier ou annuler une commande

Le propriétaire de la commande ou le bureau peut modifier une commande `BROUILLON`, `TRANSMISE` ou `VALIDEE` non commencée. Seul le bureau peut l'annuler.

**Conséquences (testables) :**
- Une commande `PREPARATION` ou au-delà n'est pas modifiable : `COMMANDE_NON_MODIFIABLE`. Elle peut être annulée par un responsable stock avec motif, ce qui libère les quantités non encore sorties.
- Modifier une commande `VALIDEE` annule la réservation, applique de nouveau FR-33, puis réserve de nouveau. Si un contrôle échoue, la commande garde son état précédent.
- L'annulation exige un motif parmi une liste (client annule, erreur de saisie, rupture, plafond de crédit, autre avec texte). Le motif est enregistré avec l'auteur et l'horodatage.
- Une commande facturée ne s'annule pas : on émet un avoir (FR-48).
- Toute modification est dans un historique en lecture seule : champ, ancienne valeur, nouvelle valeur, auteur, date.

#### FR-36 : Produire le bon de livraison

À la validation, le module crée le bon de livraison que l'entrepôt prépare. Le bon est imprimable en PDF. Réalise UJ-1.

**Conséquences (testables) :**
- Un bon `BL-AAAA-NNNNNN` est créé pour chaque Point de stock source concerné. Une commande servie par deux points de stock a deux bons.
- Le bon liste les articles, les quantités à servir et les lots. Il ne montre ni prix, ni marge, ni plafond.
- Le bon passe à `EXPEDIE` quand le chargement est validé (FR-70), puis à `LIVRE` quand la livraison est confirmée (chauffeur ou commercial). La commande passe à `LIVREE` quand tous ses bons sont `LIVRE`.
- Les quantités réellement servies remplacent les quantités à servir. Un écart (servi inférieur à commandé) met le bon `AVEC_ECART` et ouvre un reliquat (FR-41).
- Le bon est le seul document qui déclenche la sortie de stock.
- Un PDF du bon se télécharge avec la mention « Bon de livraison » et la signature du destinataire. [ASSUMPTION: la preuve de livraison de février est une photo du bon signé ; la signature à l'écran est « bientôt ».]

#### FR-37 : Commande terrain (« Nouvelle commande terrain »)

Un commercial, un freelance ou un chargé de prospection peut créer une commande depuis la tournée, pour un client de son portefeuille. Réalise UJ-2.

**Conséquences (testables) :**
- « Nouvelle commande terrain » ouvre un formulaire : point de vente du portefeuille (liste), lignes choisies dans le catalogue avec la disponibilité de FR-32, canal.
- Le bouton « Transmettre » enregistre la commande côté serveur à l'état `TRANSMISE`. Elle apparaît dans la file du bureau. Le commercial la voit avec son statut, qui change quand le bureau la valide.
- La commande porte le lien vers la visite en cours si elle existe (module `visites`, partie 3). La clôture de visite affiche le montant réel de la commande, pas une saisie libre.
- Une transmission répétée avec le même `id_client_appareil` ne crée qu'une commande (idempotence). Ceci est indispensable pour l'application terrain hors connexion (partie 3, M12).
- Le contrôle de plafond de FR-33 s'affiche en avertissement dès la saisie ; le blocage a lieu à la validation du bureau.
- Un commercial ne voit ni la marge de la société, ni la priorité « BLOQUÉE IA » d'autres clients (écart de la démo : la carte de commande exposait la marge brute).

**Hors périmètre :** la saisie hors connexion et la synchronisation (partie 3, application `prospera-terrain`, M12). Ici : le contrat d'idempotence que l'application utilisera.

#### FR-38 : Commande WhatsApp

Un chargé de bureau ou un commercial peut enregistrer une commande reçue par WhatsApp en choisissant le canal `WHATSAPP`. Réalise UJ-1.

**Conséquences (testables) :**
- Le canal `WHATSAPP` est une valeur de la commande. La commande suit ensuite le même cycle que toute autre.
- Le message d'origine peut être collé dans un champ « message du client » et reste attaché à la commande.
- La réception automatique du message, son analyse et la proposition des lignes ne font pas partie de février. Le bouton « Créer depuis un message WhatsApp » est affiché désactivé avec « bientôt (après février 2027) ». [ASSUMPTION: dépend du connecteur WhatsApp du module `notification`.]
- L'envoi de la confirmation de commande au client par WhatsApp passe par le module `notification`. S'il n'est pas branché, le bouton affiche « bientôt » et la confirmation peut se télécharger en PDF.

#### FR-39 : Prix société, prix freelance et marge

Le module calcule la marge de chaque commande à partir des lignes. Réalise UJ-1.

**Conséquences (testables) :**
- `marge = Σ (prix_unitaire_ht − cout_unitaire) × quantité`, et `marge_pct = marge / montant_ht`. Le coût vient du module `stock` (coût d'achat moyen).
- Sans coût disponible pour au moins une ligne, la marge affiche « non calculable » avec la ligne en cause, jamais 0 et jamais un pourcentage par défaut.
- La marge est visible des rôles qui ont le droit « voir la valeur commerciale » : DG, DC, DAF, CONTROLE_GESTION. Le responsable stock, le magasinier, le commercial et le freelance ne la voient pas. [ASSUMPTION: la démo se contredisait ; le responsable stock n'a pas ce droit dans `perimetre-logistique.ts`, on l'applique aussi au catalogue.]
- Pour une commande d'un freelance, la société ne voit que le prix société. Le prix que le freelance facture à son client n'est jamais stocké côté société (FR-94).
- La marge moyenne d'une période est pondérée par le montant HT, pas une moyenne simple.

#### FR-40 : Suivre les commandes (pilotage) avec des chiffres réels

Un DG, un DC, un responsable des ventes ou un superviseur voit le pipeline des commandes de son périmètre. Réalise UJ-1.

**Conséquences (testables) :**
- Les 8 chiffres de la démo (volume du jour, panier moyen, marge brute moyenne, en préparation, priorité, bloquées crédit, enseignes, lignes totales) sont calculés sur les commandes enregistrées. Aucune constante.
- Le pipeline compte les commandes par statut (`BROUILLON`, `TRANSMISE`, `VALIDEE`, `PREPARATION`, `LIVREE`, `ANNULEE`). Un clic sur un statut filtre la liste.
- Le taux de service = lignes servies / lignes commandées sur la période, sans ajustement. (La formule de la démo `+12` est supprimée.)
- Le périmètre est appliqué côté serveur : commercial et freelance = leurs commandes ; superviseur = sa zone ; responsable des ventes = ses zones ; magasinier = bons de préparation de son entrepôt, sans le carnet de commandes.
- Une zone sans commande affiche 0 commande. Un module non installé affiche « non installé ».

#### FR-41 : Livraison partielle et reliquat

Quand le servi est inférieur au commandé, le responsable stock ou le bureau décide du reliquat.

**Conséquences (testables) :**
- Le reliquat d'une ligne (commandé moins servi) est proposé : `LIVRER_PLUS_TARD` (nouveau bon quand le stock arrive) ou `ANNULER_LE_RELIQUAT`.
- `LIVRER_PLUS_TARD` garde la réservation ouverte sur les quantités à venir si elles sont attendues (commande fournisseur en cours) ; sinon le reliquat reste en attente sans réserver.
- La facture ne porte que les quantités servies (FR-42).
- Une commande dont tout le reliquat est annulé et dont tous les bons sont `LIVRE` passe à `LIVREE`.
- **Décision à trancher :** délai maximal d'un reliquat avant annulation automatique. [ASSUMPTION: 15 jours, paramètre.]

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Statut de disponibilité | `RUPTURE` si stock ≤ 0 ; `LIMITE` si stock < seuil ; sinon `DISPONIBLE` | seuil par article | `DisponibiliteView.tsx:25-29` |
| Blocage crédit | créance > 0 ET (retard ≥ 45 j OU créance > plafond) | 45 j : oui | `picking-engine.ts:36-45` |
| Plafond par défaut | `max(400 000, 0,6 × CA mensuel)` | oui | idem |
| TVA | 18 % | par article, voir FR-45 | `proforma-builder.ts:14` |
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
| Créer depuis un message WhatsApp | n'existe pas | bientôt (après février 2027) |
| Signature du destinataire à l'écran | n'existe pas | bientôt (après février 2027) |

**Notes.**
- **Décision à trancher.** Où vivent les prix propres à chaque client (reprise de février) ? La grille du module `catalogue` ne connaît que zone, catégorie de client et seuil de volume. Option A : une grille dont la condition est « ce client » (amendement du PRD `catalogue`). Option B : une catégorie de client à un seul membre. [ASSUMPTION: option A, car B multiplie les catégories pour un client de plusieurs centaines de prix négociés.] Ce module consomme le prix, il ne le stocke pas.
- **Décision à trancher.** Facturer à la validation ou à la livraison ? [ASSUMPTION: par défaut à la livraison, sur les quantités servies (FR-42), paramétrable.]
- **Question ouverte.** Un casier ou une consigne de bouteille rendu(e) n'est ni un avoir ni un paiement. [ASSUMPTION: les consignes sont hors v1.]
- **Question ouverte.** Un client peut-il avoir plusieurs adresses de livraison ? La démo n'a qu'une adresse par point de vente. [ASSUMPTION: une adresse, celle du point de vente.]
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

**Ce que le module fait.** Il émet les factures, les avoirs et les proformas. Une facture se crée depuis une commande en un clic. Elle reçoit un numéro continu qui reprend la suite de Sage. Elle porte toutes les mentions légales et la TVA à 18 %. Elle s'imprime, se télécharge en PDF et s'envoie. Elle ouvre une Créance, que les Encaissements du module `paiement` réduisent (renvoi : partie 4 ; la Créance est un objet commun décrit en partie 3). Le module donne la balance clients et la balance âgée. Il porte aussi la reprise des factures impayées à la bascule. L'e-facture (certification OTR) est visible mais « bientôt » tant que la plateforme n'est pas branchée. Le module réalise UJ-1.

**Objets.**
- **Facture** : `numero`, `serie`, `client` (point de vente), `commande`, `bons_de_livraison`, `date_emission`, `date_echeance`, `conditions_reglement`, `lignes`, `montant_ht`, `montant_tva`, `montant_ttc`, `montant_avoirs`, `montant_encaisse`, `reste_du`, `statut`, `origine` (`EMISE_PROSPERA | REPRISE`), `pdf` (fichier figé), `envois`.
  - Statuts : `BROUILLON`, `EMISE`, `PARTIELLE`, `PAYEE`, `ANNULEE_PAR_AVOIR`. `EN_RETARD` n'est pas un statut : c'est un calcul (échéance dépassée et reste dû supérieur à 0).
- **Ligne de facture** : `article`, `designation`, `quantite`, `unite`, `prix_unitaire_ht`, `remise_pct`, `taux_tva`, `total_ht`, `commande_ligne`.
- **Avoir** : `numero` (`AV-AAAA-NNNNNN`), `facture`, `motif`, `lignes`, `montant_ht`, `montant_ttc`, `date`, `statut` (`EMIS | IMPUTE | REMBOURSE`).
- **Proforma** : `numero` (`PRO-AAAA-NNNNNN`), `client`, `commercial`, `date_emission`, `date_validite`, `lignes`, `remise_globale_pct`, `montant_ht`, `montant_tva`, `montant_ttc`, `conditions_reglement`, `statut` (`BROUILLON | ENVOYEE | VUE | ACCEPTEE | REFUSEE | EXPIREE | CONVERTIE`), `probabilite_acceptation` (0-100), `canal_envoi` (`WHATSAPP | EMAIL | SMS | IMPRESSION`), `relances_envoyees`, `commande`.
- **Suite de numérotation** : `serie`, `format`, `dernier_numero_attribue`, `dernier_numero_repris` (Sage), `date_reprise`.
- **E-facture** : `facture`, `statut` (`NON_TRANSMISE | EN_ATTENTE | TRANSMISE | CERTIFIEE | REJETEE`), `numero_certification`, `date_transmission`, `motif_rejet`, `tentatives`, `plateforme`, `archive`.
- **Créance** : objet commun de la partie 3. Une facture émise en ouvre une ; un avoir ou un Encaissement la réduit.

#### FR-42 : Créer la facture depuis la commande, en un clic

Un chargé de facturation ou un DAF peut créer et émettre la facture d'une commande en un clic. Réalise UJ-1.

**Conséquences (testables) :**
- Le bouton « Facturer » est actif sur une commande `LIVREE` ou sur un bon `LIVRE` non encore facturé. [ASSUMPTION: facturation à la livraison par défaut ; une option par organisation permet de facturer dès `VALIDEE`.]
- Les lignes de la facture reprennent les quantités servies, les prix figés de la commande et la TVA de chaque article. L'utilisateur ne retape rien.
- Un deuxième clic sur la même commande ne crée pas de deuxième facture : il ouvre la première (idempotence).
- Une facture peut couvrir une livraison partielle. Le reliquat livré plus tard donne une seconde facture. Le lien commande ↔ factures est visible dans les deux sens.
- La facture est créée `BROUILLON`, puis émise (FR-43) dans la même action si toutes les mentions légales sont complètes (FR-44).
- Si le module `commande` n'est pas installé, le bouton n'existe pas et la facture se saisit à la main (lignes libres). [ASSUMPTION: la saisie manuelle sert à la reprise et aux ventes comptoir.]

#### FR-43 : Numérotation continue qui reprend la suite de Sage

Le DAF peut déclarer à la bascule le dernier numéro de facture émis sous Sage. La première facture Prospera porte le numéro suivant. Réalise UJ-1.

**Conséquences (testables) :**
- Avant la déclaration, l'émission d'une facture est refusée : `NUMEROTATION_NON_INITIALISEE`.
- Le format est un paramètre de l'organisation : préfixe, année optionnelle, largeur du numéro. [ASSUMPTION: le format exact de Sage est inconnu ; il est saisi à la bascule d'après la dernière facture Sage. Exemple de test : dernier numéro Sage `FAC-2026-0412`, première facture Prospera `FAC-2026-0413`.]
- Le numéro est attribué à l'émission, pas au brouillon. Un brouillon abandonné ne crée aucun trou.
- Aucun numéro n'est jamais réutilisé ni sauté. Test : 50 émissions simultanées donnent 50 numéros consécutifs, sans doublon.
- Une facture émise ne se supprime pas et ne se modifie plus. Une erreur se corrige par un avoir (FR-48).
- Les avoirs ont leur propre suite continue. Les proformas aussi (sans valeur fiscale).
- Une facture reprise de Sage (FR-58) garde son numéro d'origine et n'avance pas la suite.
- **Décision à trancher.** La suite repart-elle à 1 chaque année, ou est-elle continue sur plusieurs années ? [ASSUMPTION: continue, avec l'année dans le format. À valider par l'expert-comptable du client.]

#### FR-44 : Mentions légales sur chaque facture

L'émission d'une facture exige que toutes les mentions légales soient présentes. Réalise UJ-1.

**Conséquences (testables) :**
- Émetteur, lu de la fiche de l'Organisation (jamais en dur) : raison sociale, forme juridique, capital, adresse du siège, NIF, RCCM, régime fiscal, coordonnées de paiement (RIB, compte Mobile Money).
- Client, lu de la fiche du point de vente : nom, adresse, NIF si le client est assujetti.
- Document : numéro, date d'émission, date d'échéance, références de commande et de bon de livraison, lignes (désignation, référence, quantité, prix unitaire HT, remise, total HT), total HT, TVA à 18 %, total TTC, conditions de règlement, pénalités de retard.
- Une mention manquante bloque l'émission : `MENTION_OBLIGATOIRE_MANQUANTE`, avec la liste des champs absents et le lien vers la fiche à compléter.
- Le texte de la facture indique « Facture » pour une facture, « Avoir » pour un avoir et « Proforma, ce document n'a pas valeur de facture » pour une proforma.
- [ASSUMPTION: la liste exacte des mentions obligatoires au Togo est à faire valider par l'expert-comptable du client avant le 20/11 ; la liste ci-dessus est celle de la démo complétée par les usages UEMOA.]

#### FR-45 : Montants exacts

Les montants d'une facture, d'un avoir et d'une proforma suivent une règle unique. Réalise UJ-1.

**Conséquences (testables) :**
- `Σ total_ht des lignes = montant_ht` (après remise globale). `montant_tva = arrondi(montant_ht × 18 %)`. `montant_ttc = montant_ht + montant_tva`. Arrondi à l'unité XOF. Ces égalités sont vérifiées à l'émission ; un écart refuse l'émission : `TOTAUX_INCOHERENTS`.
- Le taux de TVA est porté par l'article (module `catalogue`), 18 % par défaut. Plusieurs taux sur une facture donnent une TVA par taux, arrondie par taux.
- Une remise de ligne se déduit du prix avant calcul de la TVA. La TVA se calcule sur le HT remisé. (La démo avait un cas à 17,4 %.)
- La devise est XOF et se déclare sur le document.
- Exemple de test (Grossiste du Golfe) : 40 caisses de jus de mangue à 7 500 HT + 25 caisses de boisson gazeuse à 5 200 HT = 300 000 + 130 000 = 430 000 HT, TVA 77 400, TTC 507 400.
- **Hors périmètre :** TVA multi-pays, exonérations partielles, taxes spécifiques (accises). [ASSUMPTION: taux unique à 18 % en février ; la démo ne gère ni multi-taux ni exonération.]

#### FR-46 : Imprimer et télécharger la facture en PDF

Tout rôle qui voit une facture peut l'imprimer et la télécharger en PDF. Réalise UJ-1.

**Conséquences (testables) :**
- Un PDF est généré par le serveur à l'émission et conservé. Le même fichier se retélécharge à l'identique des années plus tard.
- Le PDF reproduit les mentions de FR-44. Il tient sur des pages A4, avec le numéro de page et le numéro de facture en pied.
- Le bouton « Imprimer / PDF » ne dépend pas de l'impression du navigateur.
- Un brouillon se télécharge avec le filigrane « BROUILLON — sans valeur ». Une proforma avec la mention de FR-44.
- Un rôle hors périmètre reçoit un refus, y compris par l'adresse directe du fichier : `FACTURE_HORS_PERIMETRE`.
- Les factures sont conservées au moins 10 ans (durée de la démo, `types/index.ts:199`). [ASSUMPTION: 10 ans.]

#### FR-47 : Envoyer la facture au client

Un chargé de facturation peut envoyer la facture par e-mail, et par WhatsApp ou SMS quand ces canaux sont branchés. Réalise UJ-1.

**Conséquences (testables) :**
- L'envoi passe par le module `notification`. Le statut d'envoi (`ENVOYE`, `ECHEC`, avec la raison) est enregistré sur la facture avec la date et l'auteur.
- Le PDF de FR-46 est joint (e-mail) ou accessible par un lien à durée limitée (WhatsApp, SMS).
- Un canal non branché affiche son bouton désactivé : « Envoyer par WhatsApp : bientôt (février 2027) ». [ASSUMPTION: e-mail disponible en février ; WhatsApp et SMS dépendent de `notification`.]
- Un envoi échoué ne passe jamais pour réussi. L'utilisateur voit l'échec et peut réessayer.
- Si `notification` n'est pas installé, tous les boutons d'envoi affichent « non installé » et le téléchargement reste disponible.
- Le client sans adresse e-mail ni numéro est signalé avant l'envoi.

#### FR-48 : Émettre un avoir

Un chargé de facturation, avec validation d'un DAF au-dessus d'un seuil, peut émettre un avoir sur une facture émise. Réalise UJ-1.

**Conséquences (testables) :**
- L'avoir est total ou partiel. Il se compose de lignes de la facture (quantité et prix) ou d'un montant libre avec motif.
- Le motif est obligatoire : retour de marchandise, erreur de prix, remise commerciale, litige de livraison, erreur de facturation.
- Un avoir qui dépasse le reste à créditer de la facture est refusé : `AVOIR_SUPERIEUR_A_LA_FACTURE`.
- L'avoir reçoit un numéro `AV-AAAA-NNNNNN` continu (FR-43) et un PDF avec la mention « Avoir » et la référence de la facture.
- L'avoir réduit la Créance. Si le client a déjà tout payé, le crédit reste au solde du client (`IMPUTE` sur une facture suivante ou `REMBOURSE`).
- Un avoir pour retour de marchandise propose une entrée de stock dans le module `stock`, à confirmer par le magasinier. [ASSUMPTION: l'avoir n'entre jamais le stock tout seul.]
- Un avoir au-dessus de 500 000 XOF exige la validation du DAF. [ASSUMPTION: seuil paramétrable, 500 000 XOF par défaut.]
- Un avoir émis ne se supprime pas.

#### FR-49 : Facture, Créance et paiements partiels

Chaque facture émise ouvre une Créance. Les Encaissements du module `paiement` la réduisent, en une ou plusieurs fois. Réalise UJ-1.

**Conséquences (testables) :**
- `reste_du = montant_ttc − montant_avoirs − montant_encaisse`. Un paiement partiel passe la facture à `PARTIELLE` ; quand `reste_du` atteint 0, elle passe à `PAYEE`.
- Les moyens de paiement acceptés sont ceux de l'organisation : PI-SPI, FedaPay, espèces, virement. Le module `facturation` ne les implémente pas ; il lit les Encaissements du module `paiement`.
- Exemple de test (UJ-1) : facture de 507 400 XOF ; paiement de 200 000 par FedaPay, reste dû 307 400, statut `PARTIELLE` ; paiement de 307 400 par PI-SPI, statut `PAYEE`.
- Un paiement supérieur au reste dû est refusé : `PAIEMENT_SUPERIEUR_AU_RESTE_DU`. [ASSUMPTION: l'excédent n'est pas géré en février.]
- La facture affiche la liste de ses Encaissements : date, moyen, montant, référence. (La démo ne gardait qu'un total.)
- Si le module `paiement` n'est pas installé, le champ « encaissé » affiche « non installé » et aucun reste dû n'est calculé.
- Le statut passe à `EN_RETARD` à l'affichage le lendemain de l'échéance, sans traitement manuel.

#### FR-50 : Balance clients

Un DG, un DAF, un comptable, un responsable du recouvrement ou un commercial (pour son portefeuille) peut lire la balance clients à une date. Réalise UJ-1.

**Conséquences (testables) :**
- Une ligne par client : total facturé, avoirs, encaissé, reste dû, nombre de factures ouvertes, plus ancienne échéance dépassée, plafond de crédit, encours.
- Le total de la balance égale la somme des restes dus de toutes les factures ouvertes et des factures reprises (FR-58). Cette égalité est vérifiée par un contrôle visible. Un écart s'affiche en rouge avec le client en cause.
- On peut choisir une date passée (« au 31/01 ») : la balance se recalcule sur les pièces et Encaissements datés avant.
- Le périmètre limite les lignes : un commercial ne voit que ses clients (côté serveur).
- La balance s'exporte en CSV et en PDF.
- Un client dépassant son plafond est marqué « plafond dépassé ».

#### FR-51 : Balance âgée

Les mêmes rôles peuvent lire la balance âgée des Créances. Réalise UJ-1.

**Conséquences (testables) :**
- Tranches par défaut, paramétrables : non échu, 1 à 30 jours, 31 à 60 jours, 61 à 90 jours, plus de 90 jours. [ASSUMPTION: 5 tranches, comme la version « comptable » de la démo ; la version des relances n'en avait que 4. Décision à trancher.]
- L'âge se calcule depuis l'échéance, pas depuis l'émission.
- Vues : par client, par commercial, par zone, par moyen de règlement attendu. Une tranche vide s'affiche à 0.
- Le total de la balance âgée égale le total de la balance clients de la même date (FR-50). Test automatique.
- Les factures reprises de Sage (FR-58) y figurent avec leur échéance d'origine.
- Un clic sur une tranche ouvre la liste des factures. La balance alimente le rapport du DG et les dossiers de relance (partie 3).
- Il n'y a pas de balance âgée fournisseur dans cette exigence : elle appartient à l'Approvisionnement (FR-67).

#### FR-52 : Encours, plafond de crédit et conditions de règlement par client

Le module lit le plafond de crédit et les conditions de règlement du client dans le module `pdv` et les applique. Réalise UJ-1.

**Conséquences (testables) :**
- `encours = Σ reste dû des factures du client (émises et reprises)`. Il est recalculé à chaque encaissement ou avoir.
- L'échéance d'une facture = date d'émission + délai de règlement du client (30, 45 ou 60 jours, ou comptant). Sans délai sur la fiche du client, l'émission est refusée : `CONDITIONS_REGLEMENT_MANQUANTES`.
- Un plafond est porté par le client, pas par la facture. (La démo recopiait le plafond de la première facture.)
- Un client dont l'encours dépasse le plafond affiche « plafond dépassé » dans la balance, la fiche client et la commande (FR-33).
- Les valeurs par défaut par type de client (remise de base, délai, plafond) de la démo sont des valeurs d'amorçage à saisir à la reprise : dépôt ou grossiste volume : remise 8 %, 60 j, plafond 5 à 15 M ; grossiste : 5 %, 30 j, 3 à 10 M ; supérette : 3 %, 30 j, 5 à 12 M ; épicerie ou kiosque : 0 %, 30 j, 1 à 4 M. [ASSUMPTION: ces plafonds sont du texte libre dans la démo ; ils ne sont repris que comme suggestions modifiables.]
- **Décision à trancher.** Le PRD `pdv` ne dit rien des conditions de règlement par client, alors que son manifeste les cite (écart relevé dans la reprise). Ce module les exige ; l'amendement du PRD `pdv` est à écrire.

#### FR-53 : Marge par facture

Un DG, un DC, un DAF ou un contrôleur de gestion voit la marge de chaque facture. Réalise UJ-1.

**Conséquences (testables) :**
- `marge_facture = Σ (prix_unitaire_ht − cout_unitaire) × quantité` ; `marge_pct = marge_facture / montant_ht`. Les coûts viennent du module `stock` au moment de la sortie.
- Un coût absent donne « non calculable », pas 15 %. (La démo posait 15 % par défaut.)
- Une facture reprise de Sage affiche « sans détail de lignes » : sa marge est « non calculable ».
- Le commercial et le magasinier ne voient pas la marge.
- Un avoir réduit la marge de la facture d'origine au prorata.

#### FR-54 : Proforma

Un commercial, un freelance ou un responsable des ventes peut créer et envoyer une proforma. Réalise UJ-2 pour la proforma préparée en visite.

**Conséquences (testables) :**
- La proforma prend les prix de la grille applicable au client (prix négocié, société ou freelance), pas un prix unique.
- Validité : 15 jours après l'émission (paramètre). Au 16e jour, la proforma passe seule à `EXPIREE`. (Le passage n'était pas codé dans la démo.)
- Elle a sa propre numérotation `PRO-AAAA-NNNNNN` et ne consomme aucun numéro de facture.
- Elle ne réserve pas de stock et n'ouvre pas de Créance.
- Statuts : `BROUILLON → ENVOYEE → VUE → ACCEPTEE | REFUSEE | EXPIREE → CONVERTIE`. `VUE` n'est posé que si le client ouvre le lien ; sans canal qui le sait, le statut reste `ENVOYEE`.
- Si l'encours du client après la proforma dépasse son plafond, un bandeau avertit et la conversion demandera la dérogation de FR-33.
- Pour un freelance : la marge minimale du freelance (12 % par défaut) avertit sans bloquer (FR-99).
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

#### FR-56 : Convertir une proforma en commande

Un commercial ou un responsable des ventes peut convertir une proforma acceptée en commande. Réalise UJ-2.

**Conséquences (testables) :**
- Seule une proforma `ACCEPTEE` se convertit : `PROFORMA_NON_ACCEPTEE` sinon. (La démo laissait convertir un brouillon.)
- La conversion crée une Commande (FR-30) avec les lignes et les prix de la proforma, puis applique les contrôles de FR-33. Elle ne crée pas de facture. La facture suit la commande (FR-42).
- La proforma passe à `CONVERTIE` et garde le lien vers la commande. Une deuxième conversion renvoie la même commande.
- Une proforma `EXPIREE` ne se convertit pas : on en recrée une.
- Un client marqué `ACCEPTEE` hors du système (message WhatsApp, appel) : le commercial passe la proforma à `ACCEPTEE` à la main, avec date et auteur.

#### FR-57 : E-facture (statuts, contrôles, « bientôt »)

Le module porte le suivi de l'e-facture. En février la certification OTR n'est pas exigée et la plateforme n'est pas branchée. Réalise UJ-1 (partie fiscale, plus tard).

**Conséquences (testables) :**
- Tant que la plateforme OTR n'est pas branchée, toute facture est `NON_TRANSMISE`. L'onglet « E-facturation » affiche le bandeau « Plateforme OTR non branchée : bientôt (date à fixer avec le client) » et ne montre aucun chiffre de certification.
- Interdit : afficher `TRANSMISE`, `CERTIFIEE` ou `REJETEE` sans réponse réelle de la plateforme. Interdit : un numéro de certification, un hash ou un QR fabriqués. (La démo dérivait ces statuts de l'ancienneté de l'impayé.)
- Les boutons « Transmettre », « Corriger et retransmettre » et « Télécharger l'archive » sont désactivés avec « bientôt ».
- Contrôles préalables à la transmission, exécutables avant la plateforme : NIF du client présent, taux de TVA cohérent, code de nomenclature de chaque article présent. Chaque échec nomme la facture et la fiche à compléter : `NIF_CLIENT_ABSENT`, `TVA_INCOHERENTE`, `NOMENCLATURE_ABSENTE`. En février ils sont des avertissements, pas des blocages.
- Quand la plateforme sera branchée : statuts reçus (`EN_ATTENTE`, `TRANSMISE`, `CERTIFIEE`, `REJETEE`), motif de rejet, tentatives, archive légale conservée 10 ans.
- **Hors périmètre février :** la facture normalisée certifiée OTR et l'export vers Sage.

#### FR-58 : Reprendre les factures impayées à la bascule

Un administrateur de l'organisation peut charger les factures impayées de l'ancien système, pour que la balance clients soit juste dès le premier jour. Réalise UJ-1.

**Conséquences (testables) :**
- Objet de reprise `facturation.facture-ouverte` [ASSUMPTION: nom et version à fixer au manifeste, `facturation.facture-ouverte@1`] : numéro d'origine, client (référence reconnue dans `pdv`), date d'émission, date d'échéance, montant TTC, reste dû, devise.
- Une facture reprise garde son numéro d'origine tel quel. Elle n'avance pas la suite de numérotation (FR-43) et n'a pas de lignes (« sans détail »).
- Elle ouvre une Créance, apparaît dans la balance clients et la balance âgée, peut recevoir un Encaissement et un avoir, et porte `origine = REPRISE`.
- Contrôle de la reprise : `Σ reste dû chargé = total de la balance Sage fourni`, par client et en total. Un écart refuse la validation de la reprise : `ECART_DE_CONTROLE`.
- Un client absent de `pdv` rejette sa ligne avec le code `CLIENT_INCONNU` ; la ligne apparaît dans un rapport d'écarts ; elle ne crée pas de client en silence.
- Un numéro d'origine déjà présent est refusé : `NUMERO_DEJA_REPRIS`. Recharger le même fichier ne crée aucun doublon.
- Le PDF original reste dans Sage. Prospera n'en génère pas pour une facture reprise.
- Ce module n'a aucun manifeste aujourd'hui : l'objet de reprise est à produire au manifeste `facturation` (dû le 20/11). Sans lui, le chiffre de contrôle « reste dû » n'a pas de porteur.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| TVA | 18 % | par article | `proforma-builder.ts:14` |
| Totaux proforma | `HT = arrondi(brut × (1 − remise/100))` ; `TVA = arrondi(HT × 0,18)` ; `TTC = HT + TVA` | non | `proforma-builder.ts:24-29` |
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
| Envoyer au client | SIMULÉ (proforma locale) | FR-47 ; WhatsApp et SMS : bientôt (février 2027) |
| Créer une proforma | local | FR-54 |
| Convertir en commande | SIMULÉ (deux références vides) | FR-56 |
| Relancer par {canal} | SIMULÉ (compteur) | FR-55 |
| Corriger et retransmettre (e-facture) | SIMULÉ | bientôt (date à fixer, plateforme OTR) |
| Transmettre à la plateforme, télécharger l'archive | n'existe pas | bientôt (date à fixer, plateforme OTR) |
| Exporter vers Sage | n'existe pas | bientôt (après février 2027) |

**Notes.**
- **Décision à trancher.** Quel module porte la Créance : `facturation` (nouveau) ou `paiement` (`paiement.creance@1`) ? La spine de la reprise dit « à confirmer ». [ASSUMPTION: `facturation` émet les factures et la suite de numérotation ; la Créance est l'objet commun de la partie 3, alimenté par `facturation` et réduit par `paiement`.]
- **Décision à trancher.** Nombre de séries : une ou plusieurs (par entrepôt, par canal) ? [ASSUMPTION: une série par organisation en février, pour garder « sans trou ni doublon » simple à contrôler.]
- **Question ouverte.** Les factures de vente comptoir sans commande : une facture manuelle suffit-elle ? [ASSUMPTION: oui, FR-42.]
- **Question ouverte.** Le client de février garde-t-il Sage en parallèle ? Si oui, l'export de factures et de paiements est hors périmètre de la phase démontrable et vient après.
- **Question ouverte.** Les factures du client de février contiennent-elles des remises sur plusieurs niveaux, des consignes, des frais de transport ? À obtenir avec le modèle de facture Sage.
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
- Un fournisseur `EN_EVALUATION` peut recevoir des commandes ; son statut est affiché. [ASSUMPTION: la démo ne l'excluait pas du choix.]
- Chaque article stocké doit avoir au moins un fournisseur prioritaire et un fournisseur de secours. Un article avec un seul fournisseur déclenche une alerte au responsable stock. [ASSUMPTION: alerte, pas blocage ; la démo l'écrit en spécification sans le contrôler.]
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
- Un article est « en manque » si `stock ≤ seuil` OU `couverture < couverture_min_jours` (7 jours par défaut). La couverture = stock / vitesse de vente journalière, où la vitesse = ventes des 30 derniers jours / 30. Les deux définitions du seuil sont alignées (≤).
- Le stock lu est le stock disponible du Point de stock (module `stock`). Si `stock` n'est pas installé : « non installé » et aucune proposition.
- Quantité proposée : `QUANTITE_FIXE` → la quantité fixe ; `STOCK_CIBLE` → `max(0, stock_cible − stock)` ; `PREVISION` → `max(0, vitesse × (délai + couverture_min) + vitesse × délai × 1,3 − stock)`. Le résultat est arrondi au multiple supérieur du lot, avec au moins un lot.
- Les propositions d'un même fournisseur sont regroupées en une commande. La remise de volume ne s'applique que si le montant HT atteint le franco.
- Les articles dont la règle est `ALERTE_SEULE` ne produisent qu'une alerte.
- Criticité : `CRITIQUE` si `stock ≤ 0,5 × seuil` ou couverture < 3 jours ; `HAUTE` si sous le seuil ; sinon `MODEREE`.
- Une règle se crée, se modifie et se désactive (RESP_STOCK, DG) ; le bouton « Déclencher maintenant » lance l'évaluation. (Dans la démo, les règles sont en lecture seule.)
- Exemple de test (Grossiste du Golfe) : jus d'orange 1 L, stock 80 caisses, seuil 100, ventes 30 j = 600 → vitesse 20 caisses/j, couverture 4 j ; proposition émise ; criticité `HAUTE`.
- Le point de commande `vitesse × délai × 2,3` est calculé et affiché comme repère, mais le déclenchement se fait sur le seuil de la règle. [ASSUMPTION: on garde le déclenchement de la démo.]

#### FR-62 : Commande fournisseur, de SUGGEREE à RECUE

Un responsable stock peut transformer une proposition en commande fournisseur et la suivre jusqu'à la réception. Réalise UJ-6.

**Conséquences (testables) :**
- Cycle : `SUGGEREE → EN_VALIDATION → ENVOYEE → CONFIRMEE → EN_TRANSIT → RECUE_PARTIELLE | RECUE`. `ANNULEE` et `LITIGE` sont possibles. Une transition interdite renvoie `TRANSITION_INTERDITE`.
- « Valider » crée vraiment la commande (statut `ENVOYEE`, `valide_par`, `valide_le`) et enregistre la ligne dans le registre. « Valider tout » valide chaque commande restante avec les mêmes contrôles ; si une échoue, les autres passent et l'échec est listé.
- La commande fournisseur se crée aussi à la main (fournisseur, lignes, destination).
- L'envoi au fournisseur (e-mail ou PDF) se fait par le module `notification` ; sans lui, le bon de commande se télécharge en PDF et le bouton d'envoi affiche « bientôt ».
- La commande `ENVOYEE`, `CONFIRMEE` ou `EN_TRANSIT` apparaît dans les « réceptions attendues » de l'entrepôt (FR-71).
- La réception (partielle ou totale) renvoyée par l'entrepôt met à jour `quantite_recue`, le statut (`RECUE_PARTIELLE`, `RECUE`, `LITIGE`), la dette fournisseur (FR-67) et la note (FR-60).
- La date de livraison prévue = date d'envoi + délai de livraison du fournisseur. L'échéance de paiement = date de réception + délai de paiement. (La démo calculait à la création.)
- Une commande `SUGGEREE` non traitée en 7 jours est signalée. [ASSUMPTION: 7 jours, paramètre.]

#### FR-63 : Plafonds de validation par montant

Une commande fournisseur n'est validée que par le rôle qui a l'autorité pour son montant. Réalise UJ-6.

**Conséquences (testables) :**
- Jusqu'à 5 000 000 XOF TTC : le responsable stock. Au-dessus de 5 M et jusqu'à 20 M : le DAF. Au-dessus de 20 M : le DG. Valeurs paramétrables par organisation.
- Un rôle qui valide au-dessus de son plafond est refusé : `PLAFOND_VALIDATION_DEPASSE`, avec le rôle qui doit valider. (Dans la démo, un responsable stock validait 30 M.)
- Les bornes sont incluses vers le bas : exactement 5 000 000 se valide par le responsable stock.
- Une commande hors plafond reste `EN_VALIDATION` et apparaît dans la liste « à valider » du bon rôle (badge dans le menu).
- Le valideur ne peut pas être l'auteur d'une commande manuelle de plus de 5 M. [ASSUMPTION: séparation des tâches ; à valider avec le client.]
- Une commande auto ne part sans validation que si la règle est `AUTO_TOTAL`, ou `AUTO_SI_SOUS_PLAFOND` et `montant_ttc ≤ plafond_auto` de la règle. Sinon elle reste `SUGGEREE`.

#### FR-64 : Plancher de trésorerie qui bloque

Une commande qui ferait passer la trésorerie sous 40 000 000 XOF ne part pas : elle monte au DAF. Réalise UJ-6.

**Conséquences (testables) :**
- `solde_projete = solde_actuel − montant engagé`, où le solde actuel est la somme des soldes des comptes de trésorerie de l'organisation, et le montant engagé la somme des TTC des commandes en cours de validation, plus celle que l'on valide.
- Si `solde_projete < plancher` (40 M par défaut, paramétrable), la validation par le responsable stock est refusée : `PLANCHER_TRESORERIE_FRANCHI`. La commande passe `EN_VALIDATION`, étiquetée « escalade DAF », et le DAF est notifié (module `notification`, ou liste « à valider » si le module n'est pas branché).
- Seul le DAF (ou le DG) peut débloquer, avec un motif. La dérogation est tracée.
- L'escalade vaut pour tous les montants. (La démo l'appliquait au journal seulement au-dessus de 20 M.)
- L'encadré « Impact trésorerie » affiche solde actuel, montant engagé, solde projeté, plancher.
- Si aucun module financier n'est installé, le solde affiche « non installé » et le plancher ne peut pas être évalué. La validation reste possible mais l'écran dit « trésorerie non vérifiée ». [ASSUMPTION: décision à trancher : bloquer ou avertir quand la trésorerie est inconnue.]
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
- Une quantité écrêtée est affichée à côté de la quantité proposée. Le responsable stock peut passer outre avec un motif.
- Sans durée de vie renseignée sur l'article, le motif DLC affiche « non évalué » et ne bloque pas.

#### FR-67 : Dette fournisseurs et échéancier

Un DAF, un comptable ou un DG voit ce que l'organisation doit à ses fournisseurs. Réalise UJ-6.

**Conséquences (testables) :**
- La réception d'une commande fournisseur crée la dette : `Σ prix_achat × quantité reçue × 1,18` (TVA de l'article), échéance = date de réception + délai de paiement.
- Un litige (FR-72) bloque le paiement de la ligne en cause jusqu'à sa résolution et réduit la dette du montant d'un avoir obtenu.
- Échéancier en tranches : échu, J+7, J+15, J+30, au-delà.
- La balance âgée fournisseurs est la même vue en retard par fournisseur. [ASSUMPTION: elle est incluse ici ; la démo n'en avait pas alors que la spécification v2 la demande.]
- Le statut de paiement (`NON_DUE`, `A_PAYER`, `PARTIEL`, `PAYEE`, `ECHUE`) se met à jour avec les paiements fournisseurs saisis par le DAF.
- Le paiement effectif d'un fournisseur (ordre de virement) relève du Pilotage financier (partie 3). Ici : saisie du paiement et solde.

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
| (absent) Payer une échéance | n'existe pas | FR-67 (saisie) ; virement réel : bientôt (après février 2027) |
| (absent) Relancer un fournisseur | n'existe pas | bientôt (après février 2027) |
| Envoyer la commande au fournisseur | n'existe pas | FR-62 (e-mail via `notification`) |

**Notes.**
- Ce module n'est pas ★ : le client de février peut acheter à la main. Il est écrit en entier parce que la démo le montre.
- **Décision à trancher.** Un seul processus de réception : l'écran de l'entrepôt (FR-71). L'onglet « Commandes fournisseurs » de l'achat affiche le résultat, ne saisit pas.
- **Question ouverte.** Les achats du client de février sont-ils en XOF uniquement ? Les achats importés (devises, douane, transit) sont hors périmètre. [ASSUMPTION: XOF seulement.]
- **Question ouverte.** Le plancher de 40 M est la valeur de la démo ; le plancher du client de février est à demander.
- Les facture d'achat et leur rapprochement avec la commande et la réception sont au module Comptabilité (partie 3).

---

### 5.4 Opérations entrepôt (`entrepot`, M11)

**Dans la démo.** `/entrepot` (DG, RESP_STOCK, GEST_ENTREPOT) est un poste de travail sans chiffre commercial, avec quatre onglets : Préparation, Expéditions et chargement, Réceptions, Inventaire tournant. Les moteurs `picking-engine`, `expedition-engine`, `reception-engine` et `inventaire-engine` sont de vrais algorithmes.
- **LECTURE :** ouvrir un bon de préparation, voir les expéditions. Aucun bouton pour imprimer un bon, valider une ligne servie, accepter un substitut, démarrer une vague, valider le départ d'un camion.
- **SIMULÉ :** saisie des quantités reçues (pré-remplies avec le commandé), « Valider le contrôle au quai » (le bilan est calculé, mais le stock n'augmente pas, aucun avoir ni litige n'est créé), saisie du compté d'un inventaire (l'écart est calculé, le stock théorique n'est pas ajusté).
- **Deux écrans de réception** (quai et achats) écrivent la même entrée de journal et se télescopent.
- **Pas d'objet Litige** : c'est un booléen, un statut et un compteur.
- **Données en dur :** 6 camions, 5 préparateurs, 2 entrepôts (Lomé Port : 3 200 m², 4 quais, départ à 15:30 ; Kara : 900 m², 1 quai, 14:00). Le nombre d'écarts récents d'inventaire est tiré au hasard.
- **Texte seul :** les « actions automatiques » d'un bilan de réception (mise en stock, avoir préparé, facture fournisseur bloquée, note recalculée).

**Ce que le module fait.** C'est le poste du magasinier. Il prépare les commandes validées, charge les camions, reçoit les marchandises du fournisseur et compte le stock. Chaque action écrit dans le module `stock` : une préparation sort le stock réservé, une réception l'augmente, un inventaire validé le CORRIGE. Le magasinier ne voit jamais un prix ni une marge. Le module réalise UJ-1 (préparation et livraison), UJ-2 (remise des espèces, côté chargement) et UJ-6 (réception avec litige, stock corrigé).

**Objets.**
- **Bon de préparation** : `commande`, `bon_de_livraison`, `point_de_stock`, `client`, `zone`, `priorite`, `score_priorite`, `lignes`, `decision` (`PREPARER | PREPARER_PARTIEL | BLOQUER`), `motif_blocage`, `poids_total`, `volume_total`, `palettes`, `duree_prevue_min`, `statut` (`A_PREPARER | EN_COURS | PREPARE | CHARGE`).
- **Ligne de préparation** : `article`, `quantite_demandee`, `quantite_servie`, `statut` (`SERVABLE | PARTIELLE | RUPTURE`), `emplacement`, `allee`, `ordre_parcours`, `lot`, `substitut`.
- **Vague** : `creneau`, `point_de_stock`, `bons`, `preparateur`, `duree_prevue`, `parcours`, `tenable`.
- **Tournée de livraison** : `camion`, `chauffeur`, `arrets` (client, bon, ordre, heure estimée, encaissement attendu), `remplissage_pct`, `contrainte` (`POIDS | VOLUME`), `distance_km`, `cout`, `depart`, `statut`.
- **Réception** : `commande_fournisseur`, `point_de_stock`, `lignes` (`quantite_recue`, `conforme`, `motif_ecart`), `niveau_controle` (`INTEGRAL | RENFORCE | ALLEGE`), `decisions_d_ecart` (`ACCEPTE | RESERVE | LITIGE | REFUS`), `taux_conformite`, `receptionnaire`, `date`.
- **Litige** : `numero`, `reception`, `fournisseur`, `lignes`, `montant_conteste`, `statut` (`OUVERT | EN_NEGOCIATION | RESOLU_AVOIR | RESOLU_REMPLACEMENT | RESOLU_REFUS | CLOS`), `responsable`, `echeance`, `pieces_jointes`, `resolution`.
- **Comptage d'inventaire** : `article`, `classe` (`A | B | C`), `point_de_stock`, `emplacement`, `quantite_theorique`, `quantite_comptee`, `ecart`, `ecart_pct`, `statut` (`A_COMPTER | EN_RETARD | COMPTE | A_VALIDER | RECOMPTER | VALIDE`), `compteur`, `second_compteur`.

#### FR-68 : Préparer les commandes (picking)

Un magasinier voit les bons de préparation de son entrepôt et les prépare ligne par ligne. Réalise UJ-1.

**Conséquences (testables) :**
- Le carnet est composé des commandes `VALIDEE` et `PREPARATION` du Point de stock, triées par score de priorité (règle de FR-40).
- Le magasinier n'a pas accès au carnet de commandes ni aux prix : il reçoit des bons de préparation.
- Il valide chaque ligne servie avec la quantité réellement préparée et le lot. Il peut déclarer `PARTIELLE` ou `RUPTURE`.
- Un substitut est proposé si un article de même catégorie, même site, a du stock net suffisant et un prix inférieur ou égal à 125 % de l'original. Le substitut n'est servi qu'avec l'accord du bureau. [ASSUMPTION: accord du bureau obligatoire ; la démo ne dit pas qui accepte.]
- Un bon dont le client est bloqué crédit passe `BLOQUER` et ne se prépare pas : `CREDIT_BLOQUE`. Il ne réserve rien.
- Quand toutes les lignes sont servies, le bon est `PREPARE` ; la commande passe `PREPARATION` dès la première ligne servie.
- Le bon s'imprime en PDF : lignes triées dans l'ordre de parcours, emplacement et allée.
- « Aucun prix, marge, CA ni plafond » est une règle de rôle, testée sur toutes les réponses du serveur à ce rôle.

#### FR-69 : Vagues et charge du jour

Un responsable stock regroupe les bons en vagues et voit si l'équipe présente peut sortir le travail avant l'heure de départ. Réalise UJ-1.

**Conséquences (testables) :**
- Les vagues regroupent les bons par zone de livraison, dans trois créneaux : 07:00-09:30, 09:30-12:00, 13:00-heure de départ du site. Un préparateur par vague.
- Une vague est `tenable` si sa durée ne dépasse pas 150 minutes.
- La capacité du jour = `Σ cadence × heures disponibles` des préparateurs présents. Durée d'un bon = `lignes / cadence moyenne × 60` minutes ; cadence par défaut 35 lignes/heure.
- Une alerte s'affiche si le taux de charge dépasse 85 % ou si des lignes sont reportées. Alerte structurelle si l'arriéré dépasse 2 fois les commandes libérées.
- Un préparateur absent se déclare ; la capacité se recalcule.
- Le responsable stock démarre une vague : les bons passent `EN_COURS` avec l'heure et l'auteur.
- Préparateurs et camions sont des données de l'organisation, éditables (RESP_STOCK). [ASSUMPTION: création, modification, absence ; la démo les codait en dur.]

#### FR-70 : Charger les camions et valider le départ

Un magasinier ou un responsable stock charge des bons préparés dans un camion et valide le départ. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Le plan de chargement place les bons du plus lourd au plus léger, par zone, dans les camions disponibles triés par charge utile. Il respecte le poids ET le volume.
- Remplissage = `max(poids / charge utile, volume / volume utile)`. Une tournée sous 65 % est signalée « non rentable ».
- Un bon qui ne rentre dans aucun camion disponible est listé « non chargé ».
- « Valider le départ » passe les bons à `EXPEDIE`, enregistre l'heure et le chauffeur, et sort le stock : le Stock réservé devient un mouvement de sortie dans `stock`. Les bons passent `LIVRE` à la confirmation de livraison (FR-36).
- La feuille de route du chauffeur s'imprime (PDF) : arrêts, clients, adresses, encaissement attendu pour chaque arrêt.
- Le chauffeur peut confirmer une livraison et saisir l'encaissement reçu en espèces ; ce montant est ensuite une remise à rapprocher (module Terrain et caisse, partie 3).
- Un camion indisponible se déclare avec le motif ; il sort du plan.
- La signature du client sur l'écran du chauffeur est « bientôt (après février 2027) » ; la photo du bon signé est possible en février.

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
- Un litige sans mouvement depuis 15 jours est signalé au responsable stock. [ASSUMPTION: 15 jours, paramètre.]
- Un litige ne se supprime pas ; il se clôt avec un motif.
- Le délai de traitement des litiges est un indicateur du superviseur (partie 3, tableaux de bord).

#### FR-73 : Inventaire tournant par classe ABC

Un responsable stock planifie les comptages ; un magasinier compte. Réalise UJ-6.

**Conséquences (testables) :**
- Le classement ABC se calcule sur la valeur de consommation annuelle au coût d'achat (`ventes 30 j × 12 × coût`). A = cumul jusqu'à 80 %, B = jusqu'à 95 %, C = le reste.
- Fréquences de comptage : A tous les 30 jours, B tous les 90 jours, C tous les 180 jours.
- Une tâche est `EN_RETARD` si le retard dépasse 15 jours, `A_COMPTER` sinon dès l'échéance. Tri : retards, puis écarts récents, puis classe.
- Les « écarts récents » sont les écarts réels des 3 derniers comptages. (Plus de tirage au hasard.) Trois écarts font suspecter l'article.
- Le magasinier saisit la quantité comptée sans voir la quantité théorique. [ASSUMPTION: comptage « en aveugle » ; la démo affichait le théorique.]
- Un article de classe A est recompté par un second magasinier si l'écart dépasse le seuil (FR-74).
- La fiabilité d'inventaire = part des références non suspectes. La démarque sur 90 jours estimée = `Σ stock × 1,5 % × coût` des suspects.

#### FR-74 : Un inventaire validé corrige le stock

La validation d'un comptage corrige le stock dans le module `stock`. Réalise UJ-6.

**Conséquences (testables) :**
- `ecart = compté − théorique` ; `ecart_pct = ecart / théorique`.
- Écart jusqu'à 1 % : ajustement automatique. Écart de 1 à 3 % : validation du responsable stock. Écart au-delà de 3 % : recomptage obligatoire, par deux personnes si l'article est de classe A. Seuils paramétrables.
- Un comptage validé crée un mouvement d'ajustement dans le module `stock` ; `stock` après = quantité comptée. Test : théorique 120, compté 117, écart −3, −2,5 % ; validation du responsable ; le stock disponible devient 117 après la validation.
- Le mouvement porte le comptage, les deux comptes, l'auteur et le motif.
- La valeur de l'écart se calcule au coût d'achat ; elle est visible du responsable stock, pas du magasinier.
- L'annulation d'un comptage non validé ne touche pas le stock. Un comptage validé s'annule par un ajustement inverse tracé.
- Pendant un inventaire de l'article, les sorties restent possibles ; l'écart tient compte des mouvements entre le gel et la validation. [ASSUMPTION: pas de gel du stock ; l'écart est ajusté des mouvements intermédiaires. Décision à trancher.]
- Si `stock` n'est pas installé, aucun comptage ne peut être validé : « non installé ».

#### FR-75 : Poste du magasinier et périmètre

Le gestionnaire d'entrepôt ne voit que son entrepôt, sans prix. Réalise UJ-1.

**Conséquences (testables) :**
- Un magasinier est rattaché à un Point de stock. Il ne lit que les bons, réceptions et comptages de ce point ; l'autre entrepôt est refusé : `POINT_DE_STOCK_HORS_PERIMETRE`.
- Le DG et le responsable stock choisissent l'entrepôt.
- La vue stock du magasinier montre emplacement, stock, réservé, disponible, palettes. Aucun prix, aucune marge, aucun chiffre d'affaires.
- Le magasinier n'a pas accès à la commande ni à l'approvisionnement ; il voit les livraisons attendues dans « Réceptions ».
- Seul le responsable stock ou le DG engage une dépense (transfert, commande, ajustement important).

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
| (absent) Valider le départ camion, feuille de route, signature | n'existent pas | FR-70 ; signature : bientôt (après février 2027) |
| Saisie des quantités reçues (pré-remplies) | SIMULÉ | FR-71 (jamais pré-remplies) |
| Valider le contrôle au quai | SIMULÉ (rien n'est mis en stock) | FR-71 |
| Annuler (réception, comptage) | SIMULÉ | FR-71, FR-74 (correction par ajustement tracé) |
| Saisie « compté » + Valider (inventaire) | SIMULÉ (stock non corrigé) | FR-73, FR-74 |
| Choix de l'entrepôt (RESP_STOCK, DG) | LECTURE | FR-75 |
| (absent) Suivre un litige | n'existe pas | FR-72 |

**Notes.**
- **Décision à trancher.** Les transferts entre entrepôts (« Lancer la navette ») et les plans de liquidation (« Lancer le scénario ») appartiennent au PRD `stock` (renvoi, partie 4). Ils sont SIMULÉS dans la démo ; le module `entrepot` exécute le mouvement physique d'un transfert quand `stock` le décide.
- **Question ouverte.** Le client de février a-t-il un ou plusieurs entrepôts ? Y a-t-il des quais, des emplacements, des lots à date limite ? [ASSUMPTION: Grossiste du Golfe a 2 entrepôts, des emplacements, et des lots à date limite pour les jus.]
- Le suivi GPS des camions et la preuve de livraison électronique sont hors périmètre de février.
- Le lien entre le chargement et la remise d'espèces du chauffeur est décrit à la partie 3.

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
- **Prospect** : `nom`, `zone`, `quartier`, `telephone`, `adresse`, `lat`, `lng`, `type_commerce`, `surface_m2`, `ca_estime_mois`, `capacite_paiement` (`COMPTANT | CREDIT_7J | CREDIT_30J | INCONNUE`), `concurrent_fournisseur`, `etape` (`RECENSE | QUALIFIE | PREMIER_CONTACT | OFFRE_ENVOYEE | PREMIERE_COMMANDE | PERDU`), `jours_dans_etape`, `commercial`, `source` (`RECENSEMENT | SOCIAL | RECOMMANDATION | AUTRE`), `motif_perte`, `prochaine_action`, `prochaine_action_date`, `historique`.
- **Ouverture** : `point_de_vente`, `zone`, `commercial`, `mois_ouverture`, `ca_premiere_commande`, `conditions_premiere_commande`, `reachat_m1`, `reachat_m3` (`vrai | faux | non jugeable`), `impaye`, `sante` (`VIVANT | DORMANT | MORT | IMPAYE`), `cout_acquisition`, `marge_cumulee`, `transfere_a`, `jours_depuis_ouverture`.
- **Passation** : `ouverture`, `commercial_secteur`, `date`, `auteur`, `statut` (`EN_ATTENTE | ACCEPTEE`).
- **Objectif** : `perimetre` (`ZONE | COMMERCIAL | POINT_DE_VENTE`), `cible`, `periode` (mois), `indicateur` (`CA | MARGE | VISITES | NOUVEAUX_PDV | ENCAISSEMENT | DN`), `valeur`, `fixe_par`, `date`.
- **Garde-fous de conquête** : paramètres de l'organisation (voir FR-79).

#### FR-76 : Zones non couvertes et recensement

Un chargé de prospection voit les zones non couvertes et recense les commerces qu'il y trouve. Réalise UJ-7.

**Conséquences (testables) :**
- Une carte montre les zones colorées par statut et les commerces recensés. Les zones sont celles du module `reseau`. [ASSUMPTION: la carte utilise Google Maps, choix du PO pour le module `pdv`.]
- « Recenser » ouvre un formulaire (nom, type de commerce, téléphone, adresse) et prend les coordonnées du point pointé ou de la position du téléphone. Il remplace le `window.prompt` de la démo.
- Un commerce recensé crée un Prospect `RECENSE` dans le carnet (FR-77) et augmente le compteur de la zone. La démo gardait deux listes séparées.
- Doublon : un commerce de même téléphone, ou à moins de 30 mètres avec un nom proche d'un prospect ou d'un point de vente existant, est signalé avant création. [ASSUMPTION: règle de proximité du module `pdv`, 30 m à confirmer.]
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
- Le score de santé 0 à 100 d'un prospect est « non défini » tant qu'aucune formule n'est arrêtée. [ASSUMPTION: la démo saisit le score à la main, sans formule ; on l'affiche seulement s'il est calculé.] Décision à trancher.
- Un prospect passe à `PREMIERE_COMMANDE` quand sa première commande est livrée (FR-80), pas à la saisie.
- Un commercial ne voit que ses prospects ; un responsable des ventes ceux de ses zones.

#### FR-78 : Entonnoir et goulot

Un responsable des ventes lit l'entonnoir de conquête et voit où les prospects se bloquent. Réalise UJ-7.

**Conséquences (testables) :**
- Pour chaque étape : nombre de prospects non perdus ayant atteint cette étape ou une étape plus avancée, pourcentage des recensés, nombre de « bloqués » (plus de 21 jours dans l'étape).
- Le goulot = l'étape qui a le plus de dossiers bloqués.
- Les motifs de perte sont classés évitables ou non évitables (concurrent exclusif, exclusivité = non évitable).
- Le résultat est calculé sur les prospects enregistrés, pas sur un registre fixe.
- Un entonnoir sans prospect affiche 0 prospect et « aucun goulot ».

#### FR-79 : Garde-fous de la première commande et du carnet

Les règles de conquête BLOQUENT l'action risquée. Elles sont des Garde-fous, paramétrables par organisation. Réalise UJ-7.

**Conséquences (testables) :**
- **Plafond de crédit de la première commande : 1 500 000 XOF.** Une première commande à crédit au-dessus de ce montant est refusée à la validation (module `commande`, FR-33) : `PLAFOND_PREMIERE_COMMANDE`. Levée possible : acompte de 50 %, ou validation du DAF avec motif.
- **Prospect à crédit de 30 jours avec un CA estimé supérieur à 2 fois le plafond (3 M)** : acompte de 50 % exigé ou validation du DAF.
- **Distance maximale rentable : 35 km du dépôt.** Un prospect au-delà ne peut pas passer à `OFFRE_ENVOYEE` sans validation du responsable des ventes : `DISTANCE_AU_DELA_DU_RENTABLE`.
- **Dossier dormant : 21 jours** sans contact dans la même étape. Le dossier est signalé ; le chargé le relance ou le clôture avec un motif. Un dossier au score élevé (60 et plus, si le score existe) est signalé « fort potentiel ».
- **Passation : 45 jours.** Une ouverture `VIVANT` ou `DORMANT` sans commercial de secteur au bout de 45 jours est « orpheline » (FR-83).
- Chaque refus nomme le garde-fou, la valeur du paramètre et la valeur constatée. Le paramétrage est réservé à l'administrateur de l'organisation.
- Un garde-fou ne se contourne que par la dérogation prévue, avec motif et auteur.
- Les alertes sont triées `CRITIQUE`, `HAUTE`, `MOYENNE`.

#### FR-80 : Créer l'ouverture à la première commande livrée

Quand un prospect passe sa première commande, le point de vente est créé et l'ouverture est suivie. Réalise UJ-7.

**Conséquences (testables) :**
- À la validation de la première commande d'un prospect, le module `pdv` crée le point de vente (pipeline `PREMIERE_COMMANDE`) et le lie au prospect. Si `pdv` n'est pas installé, l'ouverture affiche « non installé » et ne peut pas être créée.
- Une Ouverture est créée avec la date, le montant et les conditions de la première commande, le coût d'acquisition et le commercial.
- La première commande est soumise aux garde-fous de FR-79.
- Un prospect déjà point de vente ne peut pas être ouvert deux fois : `PROSPECT_DEJA_CLIENT`.
- Le coût d'acquisition = coûts de visite et de desserte imputés à l'ouverture. [ASSUMPTION: méthode d'imputation à définir avec le contrôle de gestion ; la démo stocke une valeur.]
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
- Le responsable des ventes pilote par zone et fixe les objectifs de zone ; il répartit ensuite sur les commerciaux. La somme des objectifs des commerciaux d'une zone ne dépasse pas l'objectif de zone sans avertissement. [ASSUMPTION: avertissement et non blocage.]
- L'objectif du point de vente est saisi, pas déduit du CA. (La démo prenait `CA × 1,1`.)
- Un objectif se modifie en cours de mois avec un historique ; le changement n'efface pas la valeur d'origine.
- La reprise des objectifs d'un fichier est possible (CSV). [ASSUMPTION: format du fichier à définir.]
- Un commercial lit ses propres objectifs ; il ne lit pas ceux des autres.
- Sans objectif saisi, l'avancement affiche « aucun objectif » et pas un pourcentage fabriqué.

#### FR-85 : Atterrissage et projection de fin de mois

Le module projette le résultat du mois à partir du rythme réel. Réalise UJ-1.

**Conséquences (testables) :**
- `ca_realise` = factures émises (HT) du périmètre sur le mois à date. `rythme_actuel_jour = ca_realise / jours ouvrés écoulés`. `atterrissage = rythme_actuel_jour × jours ouvrés du mois`. `ecart_projete = atterrissage − quota`. `rythme_requis_jour = max(quota − réalisé, 0) / jours ouvrés restants`.
- Les jours ouvrés viennent d'un calendrier de l'organisation (dimanche non travaillé, jours fériés déclarés). La démo posait 11 sur 26 en dur.
- Statut de zone : `TIENT` si atterrissage ≥ quota, `JUSTE` si ≥ 92 % du quota, sinon `DECROCHE`.
- Les chiffres lisent les factures du module `facturation`; sans lui : « non installé ».
- Une zone sans objectif n'a pas de statut.
- Les arbitrages à rendre (zone qui décroche : exécution ou panier ; surperformance : réallouer ; CA non encaissé : geler le crédit) sont recalculés sur ces chiffres. Chaque arbitrage est une proposition, pas une action.

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
| (absent) Simuler une réallocation | n'existe pas | bientôt (après février 2027) |
| Rendre un arbitrage (« Transférer 1 commercial ») | texte seul | bientôt (après février 2027) |

**Notes.**
- **Décision à trancher.** Les statuts de zone `COUVERTE` et `ABANDONNEE` : qui les pose et sur quels critères ? [ASSUMPTION: le responsable des ventes, à la main, avec motif.]
- **Question ouverte.** La segmentation actifs, dormants et VIP des points de vente n'existe pas dans le code. Si le PO la veut, elle se spécifie au module `pdv`.
- **Question ouverte.** Les ouvertures du client de février : combien par mois ? La conquête n'est pas ★ pour février.
- Le score de santé 0 à 100 d'un point de vente n'a pas de formule dans la démo. Il relève du module `pdv`.
- Les indicateurs d'équipe (classements, rémunération) sont au module Équipes et performance (partie 3). La rémunération individuelle n'est pas visible d'un superviseur ni d'un contrôleur de gestion. [ASSUMPTION: écart de la démo (`/equipe`) à corriger dans la partie 3.]

---

### 5.6 Studio réseaux sociaux (`studio-social`, M24)

**Dans la démo.** `/marketing/social` (DG, DC, MARKETING) a cinq onglets : calendrier éditorial, idées et modèles, boîte de réception unique, performance, journal. Quatre canaux : WhatsApp (canal de vente), Facebook, TikTok, Instagram (compte non connecté).
- **BRANCHÉ dans la démo (objets créés, relus dans le calendrier) :** composer un nouveau post, dupliquer vers un autre réseau.
- **SIMULÉ :** « Valider et programmer » (le post affiche « programmé », rien n'est publié), réécrire, éditer, replanifier, supprimer ; « Envoyer » une réponse (aucun message ne part) ; « Créer le lead » (aucun lead créé).
- **MORT :** la réponse automatique « part dans 2 minutes sauf annulation » (aucune minuterie) ; connecter un compte.
- **« IA » :** les trois accroches proposées sont des gabarits par angle (`social-builder.ts:382-440`), pas un modèle de langage. Le calendrier de 7 jours est généré à partir des combos de stock, de la disponibilité et des zones blanches.
- **Chiffres :** coût mensuel de 420 000 F et marge incrémentale de 13 % en dur.

**Ce que le module fait.** Il prépare des publications pour WhatsApp, Facebook, TikTok et Instagram à partir de ce que le distributeur doit écouter ou vendre : stock à écouler, produits disponibles, zones à conquérir. Le responsable marketing valide chaque publication. Il reçoit les messages des clients dans une boîte unique, y répond, et transforme un message d'intérêt en prospect. **Ce qui part réellement en février : rien automatiquement.** Un post validé est rangé « À publier » avec son texte et son visuel prêts à copier ; la publication automatique par réseau est un bouton « bientôt ». La réponse à un client sur WhatsApp passe par le module `notification` quand il est branché. Le module réalise UJ-7 (le lead qui devient un prospect) et nourrit UJ-1 (promotion d'un stock à écouler).

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
- Le DG et le DC voient le calendrier ; ils ne rédigent pas. [ASSUMPTION: droit de lecture seule du DG, comme dans la démo (`route-access.ts:47`).]
- Les rythmes commerciaux (semaine de paie, veille de jour de marché, pic de chaleur) sont des repères paramétrables.
- Tout post enregistré est relu par les autres rôles autorisés (il ne disparaît pas au rechargement).

#### FR-88 : Accroches proposées

Le module propose trois variantes d'accroche et des posts à partir des données de l'organisation. Réalise UJ-1.

**Conséquences (testables) :**
- Les propositions s'appuient sur des données lues dans les autres modules : stock à écouler (module `stock`), disponibilité, zones non couvertes (FR-76). Un module non installé retire sa source avec la mention « non installé ».
- Chaque proposition affiche sa raison commerciale (« pourquoi ») et un score d'engagement estimé, étiqueté « estimation ».
- Les trois variantes d'accroche (urgence, bénéfice, question) sont générées à partir de gabarits ; l'écran dit « proposé par modèle de texte » tant qu'aucun assistant IA n'est branché. Le mot « IA » n'est utilisé que si un assistant génère réellement le texte. [ASSUMPTION: module `assistant` (assistant-service) branché plus tard ; en février, gabarits.]
- Le choix d'une variante remplace l'accroche du post et est tracé.
- Une proposition qui contient un prix, un stock ou une promotion cite la valeur lue au moment de la proposition, et signale si elle a changé avant la validation.
- Une promotion de stock à écouler respecte le seuil de validation du DG (12 % de remise dans la démo).

#### FR-89 : Valider et programmer une publication

Le responsable marketing valide un post, qui devient prêt à partir. Réalise UJ-1.

**Conséquences (testables) :**
- « Valider et programmer » passe le post de `A_VALIDER` à `PROGRAMME` (réseau connecté) ou à `A_PUBLIER_A_LA_MAIN` (réseau non connecté). L'auteur et l'heure sont tracés.
- **Ce qui part réellement en février :** rien automatiquement. Un post `A_PUBLIER_A_LA_MAIN` affiche le texte, les hashtags et le visuel à copier, avec le rappel de l'heure choisie. Le responsable le publie lui-même puis marque « Publié ».
- Pour chaque réseau, un bouton « Publier automatiquement » est désactivé avec « bientôt » : WhatsApp (via `notification`) bientôt (février 2027) ; Facebook, Instagram et TikTok bientôt (après février 2027) ; chacun dépend de la connexion du compte et de l'API du réseau.
- Jamais le statut `PUBLIE` ne s'affiche sans un retour réel du réseau ou une confirmation manuelle de l'utilisateur, étiquetée « marqué publié à la main ».
- Un échec de publication passe le post à `ECHEC` avec la raison, et alerte le responsable.
- Un post avec une remise au-dessus du seuil de validation du DG attend l'accord du DG (`EN_ATTENTE_DG`).
- Les résultats (portée, clics, leads, commandes) d'un post ne s'affichent que s'ils viennent d'une source réelle ; sinon « non disponible ».

#### FR-90 : Boîte de réception unique

Le responsable marketing et le bureau voient les messages de tous les réseaux dans une seule liste, triée par potentiel. Réalise UJ-7.

**Conséquences (testables) :**
- Chaque message a une intention (commande, réclamation, prix, disponibilité, partenariat, spam) et un délai de réponse cible : 1 h pour commande et réclamation, 2 h pour prix et disponibilité, 24 h pour partenariat. Un message hors délai est marqué.
- Le spam est écarté de la liste principale.
- **Ce qui entre réellement en février :** la saisie manuelle d'un message (copier-coller depuis le téléphone) avec son réseau et son auteur. La réception automatique des messages est un bouton « bientôt (après février 2027) » par réseau. [ASSUMPTION: dépend des connecteurs WhatsApp Business, Meta et TikTok.]
- La classification d'intention est faite par règles de mots-clés ; l'écran affiche sa confiance et dit « classement automatique ». L'utilisateur peut la corriger.
- Un message d'un client en impayé ne reçoit pas de réponse automatique : il est transféré au recouvrement (FR-91).
- Un message de commande peut ouvrir une commande (FR-38, canal `WHATSAPP`).

#### FR-91 : Répondre à un message

Un responsable marketing répond à un message, avec un garde-fou sur les clients en impayé. Réalise UJ-7.

**Conséquences (testables) :**
- La réponse suggérée est un texte modifiable. « Modifier » ouvre un éditeur.
- « Envoyer » ne s'active que si le réseau du message est branché à un moyen d'envoi réel : WhatsApp via `notification` (bientôt, février 2027), les autres réseaux bientôt. Sinon le bouton affiche « bientôt » et propose « Copier la réponse ». (La démo affichait « réponse envoyée » sans envoi.)
- Un message d'un client dont la Créance échue dépasse le garde-fou est marqué « NE PAS RÉPONDRE AUTOMATIQUEMENT » et transféré au recouvrement (partie 3). La réponse automatique est interdite dans ce cas : `REPONSE_AUTO_INTERDITE_CLIENT_EN_IMPAYE`.
- Les réponses automatiques (« part dans 2 minutes sauf annulation ») n'existent pas en février. Le texte et le bouton sont retirés tant qu'aucun envoi réel n'est branché.
- Chaque réponse est tracée : auteur, heure, canal, texte.

#### FR-92 : Créer un lead qui devient un prospect

Depuis un message d'intérêt, un responsable marketing crée un prospect dans le carnet de conquête. Réalise UJ-7.

**Conséquences (testables) :**
- « Créer le lead » crée un Prospect (FR-77) à l'étape `RECENSE`, avec la source `SOCIAL`, le réseau, le nom, le téléphone et le message d'origine. (La démo n'écrivait que dans son journal.)
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
| Valider et programmer | SIMULÉ (rien publié) | FR-89 ; publication automatique : bientôt (WhatsApp février 2027, autres réseaux après) |
| Annuler la dernière action | SIMULÉ | FR-87 (historique) |
| Envoyer la réponse | SIMULÉ (aucun message ne part) | FR-91 ; envoi réel : bientôt (WhatsApp février 2027) |
| Modifier la réponse | SIMULÉ (sans éditeur) | FR-91 |
| Créer le lead | SIMULÉ (aucun lead) | FR-92 |
| Réponse automatique | MORT | bientôt (après février 2027) |
| Connecter un compte (Instagram) | MORT | bientôt (après février 2027) |
| Réception automatique des messages | n'existe pas | bientôt (après février 2027) |

**Notes.**
- Ce module n'est pas ★. Il dépend de comptes et d'API tiers qui ne sont pas branchés. La règle du PO s'applique : aucun bouton qui simule.
- **Question ouverte.** Le PO a-t-il les comptes WhatsApp Business, Facebook, TikTok et Instagram du client de démonstration ? Sans eux, aucun branchement n'est démontrable.
- **Question ouverte.** Le coût mensuel du studio (420 000 F en dur) est un exemple ; le vrai coût est à saisir par le client.
- Le marketing (campagnes, combos stock → promotion) est au PRD marketing (partie 3). Le circuit « combos stock » est le seul de la démo branché de bout en bout ; il est le modèle des circuits à états à généraliser.
- Les réponses sur WhatsApp touchent des données personnelles de clients : la conservation et le consentement des messages sont à fixer avec le client. [ASSUMPTION: les messages sont conservés 12 mois.]

---

### 5.7 Add-on Réseau Freelance (`freelance`, M42)

**Dans la démo.** Pas de page propre. Le rôle `FREELANCE` a six écrans : tableau de bord (« ma marge du jour vs coût société »), Mon activité, Mes commandes grossiste, Disponibilité (prix société = « votre coût »), Facturation (proformas) et Mon portefeuille.
- **Contradictions :** le bandeau du freelance dit « marge non visible par la société », alors que la carte de commande du DG affiche « Marge free. » (`CommandesView.tsx:78-80`). La marge du freelance est un pourcentage du prix société (12 à 22 %), pas un écart de grille.
- **N'existent pas :** grille de prix freelance, prix client du freelance (le champ `grille_client_personnalisee` existe, inutilisé), plancher grossiste (cité, non codé), simulateur de marge, blocage d'une proforma sous marge minimale (12 % : avertit, ne bloque pas). Le freelance ne peut pas créer une commande depuis `/commandes` ; il transmet un panier depuis la disponibilité.
- **Chiffres à ne pas reprendre :** la rémunération du freelance (`ca_jour × 22 + marge_jour × 22`, somme du CA société et de la marge) est incohérente.
- **Prix de l'add-on (grille tarifaire) :** forfait Grand / Moyen / Petit, plus un prix par freelance actif (+25 000 / +16 000 / +10 000 F par mois en abonnement). [Voir la fiche de l'offre en partie 1.]

**Ce que le module fait.** Il permet au distributeur de travailler avec des commerciaux indépendants. Le freelance achète à la société au prix de la grille société, qu'il ne peut pas modifier, et revend à ses propres détaillants au prix qu'il fixe. La société ne voit jamais le prix du freelance. Chaque freelance a un portefeuille isolé, ses créances sont séparées, et son plafond de crédit est propre. Le module gère aussi les commissions et les reversements. Il réalise UJ-2 (la tournée d'un freelance) et UJ-1 (la facture d'un freelance à la société).

**Objets.**
- **Freelance** : lien vers un commercial du module `reseau` de type `FREELANCE`, `actif` (compté pour la facturation de l'add-on), `grille_applicable`, `plafond_de_credit`, `marge_minimale_pct`, `date_activation`.
- **Grille société** : la grille de prix société du module `catalogue`. Non modifiable par un freelance.
- **Prix du freelance** : `freelance`, `article`, `prix_de_vente_ht`. Visible du freelance, de personne d'autre.
- **Portefeuille du freelance** : ses points de vente (module `pdv`, `portefeuille = freelance`).
- **Commande du freelance** : une Commande (5.1) au prix société, `client = freelance` pour la société.
- **Créance du freelance** : ce que le freelance doit à la société (Créance, partie 3).
- **Créance de son client** : ce qu'un détaillant doit au freelance. Visible du freelance seul.
- **Reversement** : `freelance`, `periode`, `montant_du_a_la_societe`, `montant_verse`, `statut` (`A_VERSER | VERSE | PARTIEL | EN_RETARD`).
- **Commission** : `freelance`, `periode`, `base`, `taux`, `montant`. [ASSUMPTION: voir FR-98.]

#### FR-93 : Double tarification : la grille société est intouchable

Un administrateur active un commercial en freelance et lui rattache la grille société. Réalise UJ-1 et UJ-2.

**Conséquences (testables) :**
- Le freelance achète au prix de la grille société. Aucun écran ni appel ne lui permet de le modifier : `GRILLE_SOCIETE_NON_MODIFIABLE`.
- Le prix de la grille société s'affiche au freelance sous le libellé « votre coût d'achat ».
- Le freelance fixe, pour chaque article, le prix auquel il revend à ses détaillants. Il saisit ce prix dans son écran ; c'est le « prix freelance ». Un article sans prix freelance n'a pas de marge calculée.
- Le freelance voit sa marge par ligne : `prix freelance − prix société`, en valeur et en pourcentage.
- Un prix freelance inférieur au prix société déclenche un avertissement ; il est autorisé (promotion). Une marge sous le minimum (12 % par défaut) affiche un bandeau, sans blocage. [ASSUMPTION: avertir sans bloquer, comme la démo.]
- Les prix négociés propres à un client de la société ne s'appliquent jamais à un freelance.
- Sans le module `catalogue`, aucun prix n'est disponible : « non installé ».

#### FR-94 : Le prix du freelance n'est jamais visible de la société

Aucun rôle de la société ne lit le prix de vente, la marge ni les clients finaux d'un freelance. Réalise UJ-1.

**Conséquences (testables) :**
- Le prix de vente du freelance est stocké dans un espace lisible du freelance seul. Un appel au serveur par un autre rôle (DG compris) ne le retourne pas.
- Aucun écran de la société n'affiche « Marge free. ». La commande du freelance vue par le DG montre le montant société seulement. (Corrige l'écart de la démo.)
- Les exports, les rapports, les indicateurs d'équipe et les analyses IA ne contiennent pas le prix ni la marge d'un freelance. Test : chercher la marge d'un freelance dans toutes les réponses du serveur à un rôle de la société : zéro occurrence.
- Les indicateurs de la société sur un freelance se limitent à ce que la société sait : commandes passées à la société, montants au prix société, règlements, créance, points de vente rattachés.
- Le freelance voit les règles qui le concernent : sa grille société, ses prix, sa marge, ses créances.
- Le DG voit le classement des freelances sur les mesures de la société (CA société, règlement, nombre de points de vente), pas sur leur marge.

#### FR-95 : Portefeuille isolé

Chaque freelance a un portefeuille de points de vente que lui seul voit. Réalise UJ-2.

**Conséquences (testables) :**
- Un freelance ne lit que les points de vente de son portefeuille. L'adresse directe de la fiche d'un point de vente hors portefeuille est refusée : `PDV_HORS_PERIMETRE`.
- Un point de vente est dans un portefeuille de freelance ou dans un portefeuille de commercial salarié, jamais les deux. L'ajout d'un point de vente déjà au portefeuille d'un autre est signalé : `PDV_DEJA_AFFECTE`.
- Le portefeuille ne se transfère que par décision du responsable des ventes, avec motif. [ASSUMPTION: règle du module `pdv`.]
- Un freelance ne reçoit pas de passation d'ouverture sans que l'add-on soit actif (FR-83).
- Les points de vente d'un freelance ne sont pas dans les listes de conquête de la société, sauf accord. [ASSUMPTION: décision à trancher : la société sait-elle quels détaillants le freelance sert ?]
- Quand l'add-on est désactivé, le portefeuille est figé en lecture seule, et la société décide de sa reprise.

#### FR-96 : Commande à double flux

Un freelance passe une commande à la société à prix société, et vend à ses détaillants à son prix. Réalise UJ-2.

**Conséquences (testables) :**
- Un freelance crée une commande (5.1) dont le client, pour la société, est le freelance, au prix société. Le panier minimal est un paramètre (2 à 4 M XOF dans la démo, bandeau « paniers 2-4 M »).
- La société facture le freelance (FR-42) au prix société. Le freelance reçoit la facture et le bon de livraison.
- Le freelance a un écran « Mes commandes grossiste » avec la liste de ses commandes à la société. Il crée une commande depuis cet écran. (La démo l'interdisait.)
- La revente du freelance à ses détaillants se fait hors du système de la société : le freelance peut tenir ses ventes dans son propre espace (commandes, créances de ses clients). [ASSUMPTION: la facturation du freelance à ses détaillants est hors périmètre de février. Question ouverte au PO : qui facture le détaillant final ?]
- Les contrôles de la commande (stock, plafond de crédit du freelance, créance échue) s'appliquent à la commande du freelance (FR-33).
- Le stock réservé par un freelance est géré comme celui des autres commandes.

#### FR-97 : Créances séparées et plafond de crédit séparé

La dette du freelance envers la société et les dettes de ses détaillants envers lui sont deux choses distinctes. Réalise UJ-1.

**Conséquences (testables) :**
- Le plafond de crédit d'un freelance est le sien (champ du freelance), distinct du plafond de ses détaillants. Il se règle par le DAF.
- L'encours du freelance = restes dus des factures émises au freelance (FR-52). Il bloque ses commandes au-delà du plafond : `PLAFOND_CREDIT_DEPASSE`.
- Les créances que les détaillants du freelance lui doivent sont visibles du freelance seul. La société ne les voit pas ; elles n'entrent pas dans sa balance clients.
- La balance âgée de la société contient la créance du freelance et pas celles de ses détaillants.
- Un freelance en retard de règlement est bloqué comme tout client (FR-33).
- Le freelance règle ses factures par PI-SPI, FedaPay, espèces ou virement, comme tout client (module `paiement`).

#### FR-98 : Commissions et reversements

Le module calcule ce que le freelance doit reverser à la société et, si le distributeur le décide, sa commission. Réalise UJ-1.

**Conséquences (testables) :**
- Le reversement = ce que le freelance doit à la société au titre des factures du période, selon le prix société. Le module suit le montant dû, versé, restant, par période.
- Le freelance voit son état : à verser, versé, restant, en retard.
- Le règlement d'un reversement passe par un Encaissement du module `paiement` (FR-49) et réduit la Créance du freelance.
- **Commission :** le modèle économique de la démo est que le freelance gagne la différence entre son prix et le prix société ; il n'y a pas de commission payée par la société. La formule de rémunération de la démo (`ca_jour × 22 + marge_jour × 22`) est incohérente et n'est pas reprise.
- Si le distributeur veut verser une commission ou une prime à un freelance (par exemple un bonus sur objectif), le taux est un paramètre de l'organisation, appliqué au CA société du freelance. [ASSUMPTION: option désactivée par défaut ; décision à trancher avec le PO.]
- Un freelance ne voit pas la rémunération des autres. Le superviseur et le contrôleur de gestion ne voient pas les rémunérations individuelles.
- Les reversements et commissions s'exportent en CSV pour le DAF.

#### FR-99 : Classements séparés et activation de l'add-on

Les freelances sont classés à part des salariés, et l'add-on se compte par freelance actif. Réalise UJ-2.

**Conséquences (testables) :**
- Le classement des freelances est séparé de celui des salariés. Les indicateurs du poste freelance sont : marge nette dégagée (30), CA société (20), points de vente du portefeuille (15), respect de la grille de prix (25), nouveaux points de vente (10) (poids de la démo). Marge nette et respect de la grille de prix sont visibles du freelance seul ; la société voit les mesures qu'elle connaît (FR-94).
- Un administrateur active et désactive un freelance. Le nombre de freelances actifs est visible (il sert à la facturation de l'add-on : forfait plus prix par freelance actif).
- L'add-on est un module installable : sans lui, le type de commercial `FREELANCE` n'est pas proposé et les écrans freelance n'existent pas. Aucune donnée freelance n'est affichée « 0 » : elle affiche « non installé ».
- La désactivation d'un freelance ne supprime ni ses factures ni ses créances.
- Le jeu de démonstration contient 3 freelances sur 12 commerciaux, chacun avec un portefeuille de 25 à 60 points de vente, un plafond de crédit et des prix propres.
- Le respect de la grille de prix = part des lignes vendues au-dessus de la marge minimale (12 %). La mesure appartient au freelance.

**Règles de calcul reprises de la démo.**

| Règle | Valeur de la démo | Paramétrable | Source |
|---|---|---|---|
| Marge minimale du freelance | 12 % de marge | oui | `ProformaBuilder.tsx:22-23` |
| Majoration par défaut | 15 % | oui | idem |
| Panier minimal d'une commande de freelance | 2 à 4 M XOF (texte du bandeau) | oui | `CommandesView.tsx:138` |
| Marge freelance | `prix freelance − prix société` (en valeur et en %) | non | nouvelle (la démo la posait à 12-22 % du prix société) |
| Respect de la grille de prix | cible 95 % | oui | `kpi-postes-registry.ts:134-146` |
| Tarification de l'add-on | forfait + prix par freelance actif | à fixer | fiche de l'offre |

**Boutons de la démo.**

| Bouton | État dans la démo | Exigence qui le branche, ou « bientôt » |
|---|---|---|
| Disponibilité : prix société = « votre coût » | LECTURE | FR-93 |
| Ajouter au panier, transmettre | SIMULÉ | FR-96 |
| (absent) Fixer mon prix de vente | n'existe pas | FR-93 |
| (absent) Nouvelle commande depuis « Mes commandes grossiste » | n'existe pas | FR-96 |
| Marge visible par la société (« Marge free. ») | affichée | supprimée : FR-94 |
| (absent) Simulateur de marge | n'existe pas | bientôt (après février 2027) |
| (absent) Blocage d'une proforma sous marge minimale | n'existe pas | FR-93 (avertissement) ; blocage : décision à trancher |
| (absent) Suivi des reversements | n'existe pas | FR-98 |
| (absent) Activer ou désactiver un freelance | n'existe pas | FR-99 |

**Notes.**
- Ce module n'est pas ★ : le client de février n'est pas décrit comme ayant des freelances. Le jeu de démonstration en a trois, pour démontrer l'isolement.
- **Question ouverte (bloquante pour FR-96 et FR-98).** Qui facture le détaillant final : le freelance, ou la société pour son compte ? Le texte « le prix client est le vôtre » suggère que le freelance facture lui-même. Si la société facturait, elle verrait le prix du freelance, ce que la règle interdit.
- **Question ouverte.** Le freelance paie-t-il comptant la société ou a-t-il un crédit ? [ASSUMPTION: crédit avec plafond propre, comme tout client.]
- **Question ouverte.** Une commission est-elle versée par la société au freelance ? [ASSUMPTION: non.]
- **Décision à trancher.** La société voit-elle la liste des détaillants d'un freelance (nom, adresse) sans leurs prix ? [ASSUMPTION: non en v1.]
- **Écart de l'offre.** Les trois documents de l'offre ne concordent pas sur le prix de l'add-on et le nombre de modules ; l'arbitrage appartient à la partie 1.
