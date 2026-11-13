// Manifeste M11 — Opérations entrepôt (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : annexe A.4 du PRD distributeur (prds/prd-distributeur-2026-11-12/prd.md), PRD FINAL ; les noms de
// codes, de droits et de faits y sont validés, sauf mention « proposition » ci-dessous.
// Le propriétaire du dépôt du service porteur le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD distributeur §5.4 (FR-68 → FR-75, FR-225, FR-226), FR-199 et FR-245 (transferts), FR-202
//              (préparation, picking et camions vivent dans `entrepot`), FR-242 (attributs logistiques), annexe A.4
//              (C1 → C13), annexe B.2 (droits par rôle) ;
//              graphe de dépendances validé par le PO le 2026-11-12 (`entrepot` vers `stock` et `commande`) ;
//              manifestes `stock` (frontière : le stock, les mouvements et les points de stock sont à `stock`) et
//              `commande` (A.1 : statuts de commande lus depuis les faits d'`entrepot`).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle distributeur « Stock & Logistique » et « Plateforme », comme `stock` (manifestes-a-produire.md,
//   M11).
// - Écrans : module d'écran `entrepot` dans `prospera-app` (C8), tous les écrans par Dev B. `/entrepot` : « Mon
//   entrepôt » pour le gestionnaire, vue réseau pour le responsable. Entrées de menu : « Préparation »
//   (`entrepot:preparation:realiser`), « Expéditions » (`entrepot:expedition:gerer`, `entrepot:chargement:gerer`),
//   « Réceptions » (`entrepot:reception:controler`), « Inventaire » (`entrepot:inventaire:planifier`).
//   La confirmation de livraison (`entrepot:livraison:confirmer`) est une action de l'écran Expéditions et de
//   l'application terrain. « Valider » un inventaire produit un ajustement via `stock` (FR-199, FR-74). Boutons
//   « bientôt » : signature du client à l'écran (FR-70) ; « Lancer la navette » et « Lancer le scénario » restent
//   « bientôt » tant que `stock` ne les branche pas (note de §5.4).
// - C11 : sans objet. Picking, vagues et plan d'expédition sont des règles déterministes paramétrées (C6), sans
//   modèle appris ; l'« ordre de picking » de l'offre est un tri par règle. Si un modèle est introduit, `ia` est
//   déclaré (annexe A.4, C11).
// - Rôles proposés (annexe B.2, à confirmer avec les rôles du vertical) : GEST_ENTREPOT = `entrepot:preparation:
//   realiser`, `entrepot:chargement:gerer`, `entrepot:reception:controler`, `entrepot:expedition:gerer`,
//   `entrepot:livraison:confirmer` ; RESP_STOCK = `entrepot:expedition:gerer`, `entrepot:inventaire:planifier` ;
//   COMMERCIAL (agent de terrain qui accompagne la tournée) = `entrepot:livraison:confirmer`. Le magasinier ne
//   voit jamais un prix ni une marge : règle de rôle, testée sur toutes les réponses du serveur (FR-68, FR-75).
// - Service porteur : « M11 peut s'adosser à stock-service » [À CONFIRMER] (annexe A.4, C1). Quel que soit le
//   service, `entrepot` écrit ses collections seul et ne touche jamais celles de `stock` (C3).
// - Cloisonnement : `organisationId` et périmètre PAR ENTREPÔT (point de stock) : le gestionnaire ne voit que son
//   site ; un autre site rend `POINT_DE_STOCK_HORS_PERIMETRE` (FR-75). Le DG et le responsable stock choisissent
//   l'entrepôt. Gate `ENTREPOT_NOT_ENTITLED`.
// - Droits : chaque droit demande une PR `auth-service` à la livraison du module (catalogue enum fermé, C7).
// - Frontière avec `stock` : tout mouvement (sortie au départ du camion, entrée à la réception, ajustement d'un
//   inventaire validé, exécution d'un transfert) est écrit PAR `stock`, par son API de mouvements ou ses faits ;
//   `entrepot` publie des faits, il n'écrit jamais une quantité (annexe A.4, C3). Le droit `stock:mouvement:saisir`
//   est celui que `stock` contrôle sur l'appelant ; il n'est pas redéclaré ici.
// - Frontière avec `commande` : `entrepot` n'écrit jamais le statut d'une commande ; `commande` lit les faits
//   d'`entrepot` pour ses statuts (annexe A.4, C5).

export const MANIFESTE_ENTREPOT = {
  code: 'entrepot',
  version: '1.0.0',

  // C1 : stock et commande sont des dépendances DURES, validées par le PO le 2026-11-12.
  depends: [
    {
      code: 'stock',
      raison:
        "Toute opération d'entrepôt écrit des mouvements de stock : sortie au départ du camion, entrée à la réception, ajustement d'un inventaire validé (FR-68 à FR-74).",
    },
    {
      code: 'commande',
      raison:
        "On prépare et expédie des commandes validées : le bon de préparation naît d'une commande (FR-68, FR-70).",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent.
  // - reseau : zone de desserte d'un entrepôt (FR-69, vagues par zone de livraison) ; sans lui, `NON_INSTALLE` ;
  // - terrain : encaissement en espèces à l'expédition (UJ-2, FR-70) ; sans lui, `NON_INSTALLE` ;
  // - facturation : bon de livraison facturé ; la facture naît chez `facturation` à la livraison confirmée ;
  // - approvisionnement : commande fournisseur liée à une réception (FR-71) ; sans lui, réception sans commande
  //   fournisseur liée (annexe A.4, C4).
  enrichiPar: ['reseau', 'terrain', 'facturation', 'approvisionnement'],

  // Aucun numéro de compte ici : le module ne tient aucune comptabilité ; la valeur de l'écart d'inventaire
  // (au coût d'achat) est calculée par `stock`, pas par `entrepot`.
  referentielFamilies: [],

  // C7 : droits de tenant, les six de l'annexe A.4. La décision de liquider appartient à `stock` (FR-246).
  // L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'entrepot:preparation:realiser', // lire et préparer les bons de son entrepôt, valider une ligne servie (FR-68)
    'entrepot:expedition:gerer', // vagues, plan de chargement, départ du camion, feuille de route (FR-69, FR-70, FR-226)
    'entrepot:chargement:gerer', // charger les bons préparés dans un camion (FR-70)
    'entrepot:reception:controler', // contrôle au quai, litiges de réception (FR-71, FR-72)
    'entrepot:inventaire:planifier', // plannings d'inventaire tournant par classe ABC (FR-73)
    'entrepot:livraison:confirmer', // confirmer la livraison d'un bon, quantités livrées et refusées (FR-70, FR-36)
  ],

  // C5 : faits publiés et consommés (annexe A.4). Noms validés dans l'annexe, à figer par la story de
  // publication. Chaque fait d'objet porte l'identifiant stable de l'objet, le `organisationId` et un `rang`.
  publie: [
    'entrepot.preparation.commencee@1', // première ligne servie d'un bon (la commande passe PREPARATION chez `commande`)
    'entrepot.preparation.terminee@1', // bon PREPARE ; lu par `commande` (A.1)
    'entrepot.expedition.livree@1', // livraison confirmée, quantités livrées et refusées ; lu par `commande` (A.1)
    'entrepot.reception.enregistree@1', // réception validée, lignes acceptées, mouvement d'entrée demandé à `stock`
    'entrepot.litige.ouvert@1', // un litige par ligne LITIGE ou REFUS (FR-71, FR-72)
    'entrepot.inventaire.compte@1', // comptage terminé, écart calculé ; l'ajustement est écrit par `stock` (FR-74)
    'instance.journal@1', // départ de camion, validation de réception, clôture de litige, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version
    'commande.commande.validee@1', // la commande validée entre au carnet du point de stock (FR-68)
    'stock.disponible.changed@1', // état absolu (physique, réservé, disponible) : lignes SERVABLE, PARTIELLE, RUPTURE
    'stock.point-de-stock.changed@1', // entrepôts, capacités, heure de départ, zones desservies
    'stock.transfert.lance@1', // exécution physique d'une navette (FR-245) ; fait À AJOUTER au manifeste `stock`
    // Propositions, hors liste de l'annexe A.4 (à ajouter par version mineure si le PO les valide) :
    // - `commande.bon-livraison.emis@1` (A.1 le publie) : le bon de préparation naît du bon de livraison émis
    //   (objet « Bon de préparation » : `commande` + `bon_de_livraison`, FR-68). L'annexe A.4 ne cite que
    //   `commande.commande.validee@1` ; si le bon est créé par `entrepot` depuis la commande validée, ce fait
    //   n'est pas consommé.
    // - `commande.commande.annulee@1` (A.1 le publie) : une commande annulée sort du carnet et libère le bon
    //   (FR-34). Aujourd'hui `entrepot` le saurait par `stock.disponible.changed@1` (réservation levée) seulement.
    // - `approvisionnement.commande-fournisseur.changed@1` (A.3 le publie) : réceptions attendues, commandes
    //   fournisseurs ENVOYEE, CONFIRMEE ou EN_TRANSIT (FR-71) ; sans lui (C4), réception sans commande liée.
    // - `reseau.portee.changed@1` : périmètre par entrepôt du gestionnaire (C2) ; à confirmer avec le service
    //   porteur de la portée (le périmètre « entrepôt » peut venir de `stock.point-de-stock.changed@1`).
  ],

  profilCompose: 'entrepot',

  // C13, point 1 : rien d'extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'entrepots-lies',
      route: 'POST /api/v1/instance/entrepot/{organisationId}/verifications/entrepots-lies',
      critere:
        "Si reseau est installé : chaque entrepôt de reseau a un point de stock : 100 % 🟢 ; ≥ 1 entrepôt sans point de stock 🔴 avec leur nombre (annexe A.4, C13). Sans reseau : « non installé ».",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation.
  avertissementDesinstallation:
    'Les préparations en cours ne seront plus suivies. Préparations, expéditions, réceptions, litiges et comptages restent enregistrés.',

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/entrepot/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // Comportement seulement, jamais la forme des données.
  interrupteurs: ['coupure-camion-stricte', 'controle-quai-obligatoire'],

  // C2, C13 point 5 : consultation des expéditions et export (annexe A.4, C13). Noms de routes proposés, figés
  // par la story d'entrée du module.
  routesLectureSeule: [
    'GET /api/v1/instance/entrepot/{organisationId}/export',
    'GET /api/v1/organisations/{organisationId}/expeditions',
    'GET /api/v1/organisations/{organisationId}/expeditions/{expeditionId}',
    // Proposition : consultation des bons, réceptions, litiges et comptages (FR-68, FR-71 à FR-73). L'annexe ne
    // cite que « consultation des expéditions, export » ; à confirmer.
    'GET /api/v1/organisations/{organisationId}/preparations',
    'GET /api/v1/organisations/{organisationId}/receptions',
    'GET /api/v1/organisations/{organisationId}/litiges',
    'GET /api/v1/organisations/{organisationId}/inventaires',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/entrepot/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/entrepot/{organisationId}/export',
    import: 'POST /api/v1/instance/entrepot/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/entrepot/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/entrepot/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 : aucun objet repris. Le stock d'ouverture est dans `stock`
  // (`stock.stock-ouverture@1`) ; les préparations, expéditions et litiges en cours ne sont pas repris.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 : opérations internes, aucun domaine d'échange.
  domainesEchange: [],
} as const;
