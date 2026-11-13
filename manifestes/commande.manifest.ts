// Manifeste M08 — Commande (format du contrat de module, clause C1, amendée le 2026-11-10, le 2026-11-11 et
// le 2026-11-12).
// Source : PRD distributeur (prds/prd-distributeur-2026-11-12), annexe A.1, treize clauses C1 → C13 tranchées.
// Le propriétaire du dépôt `commande-service` [À CONFIRMER, M08] le copie dans `src/module.manifest.ts` la
// semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD distributeur §5.1 (FR-30 → FR-41, FR-220, FR-221) et annexe A.1 ; FR-14 (décisions : la remise
//              est une décision de `commande`), FR-127 (remise), FR-187 (refus au plafond ou au crédit bloqué),
//              FR-203 (la réservation s'active avec `commande`), FR-216 (reprise : ni commandes en cours ni
//              historique), FR-241 (client comptoir) ; PRD Connecteurs FR-14 (commandes terrain = Prospera) ;
//              spine de la Reprise (AD-2 : un module sans objet repris déclare `[]`), spine de Connecteurs (AD-2 :
//              `domainesEchange: []` en février).
// Dépendances dures validées par le PO le 2026-11-12 (annexe A, préambule) : `catalogue` et `pdv`.
//
// Hors manifeste, pour mémoire :
// - Offre : bundles distributeur « Terrain & Ventes » et « Plateforme » (manifestes-a-produire.md, M08).
// - Écrans : module d'écran `commande` dans `prospera-app` (C8), `src/modules/commande/`, tous les écrans par
//   Dev B. `/commandes` (trois vues : pilotage, terrain, freelance) ; `/disponibilite` (trois états du
//   commercial : `DISPONIBLE`, `LIMITE`, `RUPTURE`) ; tiroir panier. Entrées de menu : « Commandes »
//   (`commande:portefeuille:consulter` ou `commande:reseau:consulter`), « Disponibilité »
//   (`commande:portefeuille:consulter`). Boutons non branchés de la démo : « bientôt » (« Créer depuis un
//   message WhatsApp », FR-38 ; signature du destinataire à l'écran, FR-36).
// - Rôles proposés (annexe B.2, à confirmer avec les rôles du vertical) :
//   · `commande:commande:saisir` : DC, RESP_VENTES, COMMERCIAL, FREELANCE, PROSPECTION, COMPTABLE ;
//   · `commande:commande:valider` : DC, RESP_VENTES, SUPERVISEUR, COMPTABLE ;
//   · `commande:commande:annuler` : DC, RESP_VENTES, COMPTABLE ;
//   · `commande:portefeuille:consulter` : COMMERCIAL, FREELANCE, PROSPECTION ;
//   · `commande:reseau:consulter` : DG, DC, RESP_VENTES, SUPERVISEUR, RESP_STOCK, COMPTABLE (raffiné par la
//     portée) ;
//   · `commande:remise:valider` : SUPERVISEUR, RESP_VENTES, DC ;
//   · `commande:bon-livraison:emettre` : DC, RESP_VENTES, SUPERVISEUR, COMPTABLE, RESP_STOCK.
//   La dérogation à un refus de plafond (DG et DAF par défaut, FR-33) est un droit attribuable à d'autres
//   rôles ; elle n'est pas dans l'annexe A.1 et n'est PAS ajoutée ici [À CONFIRMER : droit propre ou
//   `commande:commande:valider` à portée élargie].
// - Service porteur : `commande-service` [À CONFIRMER, M08].
// - Cloisonnement (C2) : par `organisationId` et par portée (zone, portefeuille), lue dans
//   `reseau.portee.changed@1` ; un commercial ne lit que ses commandes, un freelance que les siennes (FR-C30),
//   un superviseur sa zone. Gate : refus `COMMANDE_NOT_ENTITLED`, 403 sans donnée.
// - La réservation vit dans `stock` : `commande` la demande et la libère, il ne la stocke pas (§5.1, Objets).
//   Le prix d'un freelance n'est jamais une ligne de commande vue de la société (FR-31, FR-94, FR-96).
// - Les données possédées (C3) : commandes, lignes, états (brouillon, validée, préparée, livrée, annulée),
//   demandes de remise et leur décision, bons de livraison émis, journal d'états. Lues seulement : articles et
//   prix (`catalogue`), plafond et conditions (`pdv`), disponible (`stock`).
// - Une commande exige un point de vente : la vente au comptoir passe par le « client comptoir » générique de
//   chaque point de stock (FR-221), créé dans `pdv`.

export const MANIFESTE_COMMANDE = {
  code: 'commande',
  version: '1.0.0',

  // C1 : catalogue et pdv sont des dépendances DURES, validées par le PO le 2026-11-12.
  depends: [
    {
      code: 'catalogue',
      raison: 'Une ligne de commande vise un article et un prix résolu par la grille.',
    },
    {
      code: 'pdv',
      raison: 'Une commande appartient à un point de vente et lit son plafond et ses conditions de règlement.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par
  // dépendance de `enrichiPar`.
  // - stock : disponible et réservation = `{ etat: NON_INSTALLE, module: stock }` ; la validation est REFUSÉE
  //   avec `STOCK_NON_INSTALLE` (FR-32) ; le brouillon reste saisissable ;
  // - facturation : « Transformer en facture » = `NON_INSTALLE` ;
  // - paiement : encours et disponible à crédit = `NON_INSTALLE` ; la commande à crédit est refusée (garde-fou
  //   financier non vérifiable : refus par défaut) ;
  // - terrain : commande saisie en tournée ; sans lui, seules les commandes du bureau existent ;
  // - entrepot : statut de préparation = `NON_INSTALLE` ;
  // - recouvrement : crédit bloqué = `NON_INSTALLE`.
  enrichiPar: ['stock', 'facturation', 'paiement', 'terrain', 'entrepot', 'recouvrement'],

  // Aucun numéro de compte ici : la commande ne passe aucune écriture (la facture et le grand livre sont
  // ailleurs).
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.1). Chaque droit demande une PR
  // `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'commande:commande:saisir', // créer, modifier (FR-30, FR-35, FR-37, FR-38) ; vente au comptoir (FR-221)
    'commande:commande:valider', // validation avec contrôles et réservation (FR-33, FR-34) ; un commercial transmet, il ne valide pas
    'commande:commande:annuler', // annulation avec motif (FR-35) ; libère la réservation
    'commande:portefeuille:consulter', // ses commandes et la disponibilité en statut seul (FR-32, FR-40)
    'commande:reseau:consulter', // pilotage sous portée : zone, portefeuilles (FR-40)
    'commande:remise:valider', // décision d'une demande de remise au-dessus du seuil (FR-31, FR-127)
    'commande:bon-livraison:emettre', // bon de livraison, reliquat (FR-36, FR-41)
  ],

  // C5 : faits publiés et consommés. Noms de l'annexe A.1, à figer par la story de publication. Chaque fait
  // d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`. Toute quantité est
  // `{ valeur, unite }`, en unité de base.
  publie: [
    'commande.commande.validee@1', // commande validée, stock réservé : entrepot la lit
    'commande.commande.annulee@1',
    'commande.commande.changed@1', // état absolu de la commande
    'commande.remise.decidee@1',
    'commande.bon-livraison.emis@1',
    'commande.bon-livraison.livre@1', // quantités livrées confirmées, d'où naît la facture (FR-36, FR-42)
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] dérogations, annulations, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'catalogue.grille.publiee@1', // prix société et prix « ce client » (FR-31)
    'catalogue.article.changed@1',
    'pdv.plafond.changed@1', // plafond de crédit (FR-33)
    'pdv.point-de-vente.changed@1', // conditions de règlement, type de client, zone, client comptoir
    'stock.disponible.changed@1', // disponible et réservation (FR-32, FR-34)
    'entrepot.preparation.terminee@1', // quantités servies
    'entrepot.expedition.livree@1', // livraison confirmée
    'paiement.creance.changed@1', // encours (FR-187, FR-247)
    'paiement.credit-tiers.changed@1', // crédit du tiers (FR-248)
    // Le blocage du crédit (`recouvrement`, FR-119) et la portée (`reseau.portee.changed@1`, C2) ne figurent pas
    // dans la ligne C5 de l'annexe A.1. Propositions à figer par la story de consommation, sans quoi les refus
    // `CREDIT_BLOQUE` et le cloisonnement par zone n'ont pas de source :
    'recouvrement.credit.bloque@1', // [proposition, FR-33, FR-119 ; nom de l'annexe A.9 du PRD distributeur]
    'recouvrement.credit.debloque@1', // [proposition, idem]
    'reseau.portee.changed@1', // [proposition, C2 : portée zone et portefeuille]
  ],

  profilCompose: 'commande',

  // C13, point 1 : l'annexe A.1 écrit « `catalogue` et `pdv` en service » ; ce sont les dépendances dures de
  // `depends`, que le moteur installe et contrôle. Aucun prérequis extérieur (comme stock).
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Noms de routes
  // proposés (convention commune de l'annexe A : `verifications/<code>`).
  verifications: [
    {
      code: 'grille-resolue',
      route: 'POST /api/v1/instance/commande/{organisationId}/verifications/grille-resolue',
      critere:
        "Articles du jeu de contrôle dont la grille résout un prix : 100 % 🟢 ; un seul sans prix 🔴 avec son code (FR-31 : `ARTICLE_SANS_PRIX`).",
    },
    {
      code: 'plafond-lu',
      route: 'POST /api/v1/instance/commande/{organisationId}/verifications/plafond-lu',
      critere:
        "Plafond de crédit des 3 points de vente d'essai projeté dans le read-model : 3 sur 3 🟢 ; sinon 🔴 avec leur nombre (FR-33).",
    },
    {
      code: 'client-comptoir',
      route: 'POST /api/v1/instance/commande/{organisationId}/verifications/client-comptoir',
      critere:
        "Points de stock sans client comptoir : 0 🟢 ; ≥ 1 🔴 avec leur nombre (FR-221, FR-241 : la vente au comptoir n'aurait pas de point de vente).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.1).
  avertissementDesinstallation:
    'Les commandes ne seront plus saisissables ; les factures déjà émises restent.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. Un état de commande
  // ajouté est lu comme inconnu par la version précédente.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/commande/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `allocation-du-matin` : allocation par priorité des seules commandes en attente de stock (FR-220, décision
  // du PO du 2026-11-12). Comportement seulement, jamais la forme des données.
  interrupteurs: ['allocation-du-matin'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE. L'annexe A.1 donne `GET /api/v1/commandes`,
  // `/commandes/{id}` et l'export ; les autres noms sont des propositions (clause C13, FR-40, FR-36).
  routesLectureSeule: [
    'GET /api/v1/commandes',
    'GET /api/v1/commandes/{id}',
    'GET /api/v1/instance/commande/{organisationId}/export',
    // Propositions (FR-36, FR-40) : lecture du pilotage et des bons, à figer par la story d'API.
    'GET /api/v1/commandes/pilotage',
    'GET /api/v1/bons-de-livraison',
    'GET /api/v1/bons-de-livraison/{id}',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/commande/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/commande/{organisationId}/export',
    import: 'POST /api/v1/instance/commande/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/commande/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/commande/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : aucun objet repris. La reprise demandée par le PO ne
  // cite ni les commandes en cours ni l'historique (FR-216).
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : vide en février. Les commandes terrain sont
  // créées dans Prospera, propriétaire par défaut (PRD Connecteurs FR-14).
  domainesEchange: [],

  // C11 : offre « recommandation de panier, détection d'erreurs » (cahier des charges de la démo). La démo est
  // déterministe : le moteur est une règle en première version. Journal local des prédictions et corrections ;
  // prédiction affichée avec modèle, version, date.
  ia: {
    modeles: ['recommandation-panier', 'detection-erreur-commande'],
    finalites: ['suggestion-de-panier', 'controle-de-saisie'],
  },
} as const;
