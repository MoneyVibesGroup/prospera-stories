// Manifeste M02 — CRM Points de vente & pipeline (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Le propriétaire du dépôt `pdv-service` (à créer) le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-pdv-2026-08-02 (FR-V01 → FR-V43) ;
//              spine architecture/architecture-pdv-service-2026-08-15 (AD-1 → AD-17) ;
//              épics epics-pdv-2026-08-15.md (EPIC-085 → 094) ;
//              spine de la Reprise (AD-2, AD-4, AD-13, AD-23), spine de Connecteurs (AD-2, AD-4, AD-11), PRD
//              Connecteurs FR-14 (points de vente : Prospera propriétaire).
//
// Hors manifeste, pour mémoire :
// - Offre : bundles distributeur « Terrain & Ventes » et « Plateforme » (manifestes-a-produire.md, M02).
// - Écrans : module d'écran `pdv` dans `prospera-app` (C8), tous les écrans par Dev B. Chaque entrée de menu
//   exige un des droits ci-dessous.
// - C11 : sans objet. Le module PORTE des champs de score (santé, churn, potentiel) et ne les calcule pas
//   (FR-V34 → V36, AD-7) : pas de champ `ia`. Un score s'affiche avec sa source, sa date et sa version de
//   modèle ; sans producteur, il se déclare `SCORE_SANS_PRODUCTEUR`.
// - Rôles du socle distributeur (STORY-166), proposition à confirmer avec les rôles du vertical :
//   commercial salarié et freelance = `pdv:portefeuille:consulter` ; superviseur et responsable des ventes =
//   + `pdv:reseau:consulter`, `pdv:fiche:creer`, `pdv:portefeuille:reaffecter`, `pdv:transition:corriger` ;
//   DC = + `pdv:depart:declarer`, `pdv:regle:definir` (droit restreint, FR-V39) ; DAF = `pdv:plafond:modifier`,
//   `pdv:nature:modifier` (le lien vers un point de stock fait entrer un stock au bilan, AD-1).
// - Le point d'import et les valeurs de contrôle de la Reprise (C13, tableau des chemins) viennent du kit des
//   cibles (EPIC-161), dans le « fini » de pdv (EPIC-165, en S5) ; pdv est la cible minimale de la démo du
//   15/01 (spine de la Reprise, AD-23).
// - Import par fichier propre au module (FR-V40) : remplacé par la Reprise ou gardé [À CONFIRMER : le PO
//   tranchera plus tard, 2026-11-12] ; s'il reste, il passe par le même point d'écriture que la reprise
//   (dédoublonnage FR-V06, tout ou rien).
// - Carte de couverture : fond de carte Google Maps (décision du PO, 2026-11-12). Seul le fond de carte est
//   chargé chez Google, par le navigateur ; les points de vente sont dessinés côté client.

export const MANIFESTE_PDV = {
  code: 'pdv',
  version: '1.0.0',

  // C1, §3 et §5 du contrat : premier vrai cas de dépendance dure.
  depends: [
    {
      code: 'reseau',
      raison:
        "Un point de vente se rattache à une zone du réseau, et la lecture de « tout le réseau » se filtre par la portée de reseau (AD-15).",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent (AD-7).
  // - stock : point de stock lié à un magasin propre (AD-1) ; sans lui, le magasin propre est « sans point de
  //   stock lié », donc sans valorisation ;
  // - commande, facturation, terrain, recouvrement : les quatre sources de la vue 360° (commandes, créances et
  //   leur ancienneté, visites, relances ; AD-6) et les consommateurs du plafond ;
  // - catalogue : étape de révélation des prix au départ d'un indépendant (AD-5) ; sans lui, le départ se
  //   réduit à la réaffectation et l'étape s'écrit « non installé ».
  enrichiPar: ['stock', 'commande', 'facturation', 'terrain', 'recouvrement', 'catalogue'],

  referentielFamilies: [],

  // C7 : droits de tenant. Les six de FR-V38, plus trois actes que le PRD réserve à un « rôle habilité »
  // (nature FR-V02, correction d'une transition FR-V20, départ FR-V13), gardés pour le moment (décision du PO,
  // 2026-11-12). L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'pdv:portefeuille:consulter', // ses propres points de vente (chemin « mon portefeuille », AD-3)
    'pdv:reseau:consulter', // tout le réseau, raffiné par la portée de reseau, fail-closed (AD-15)
    'pdv:fiche:creer', // créer et modifier une fiche, fermer un point de vente (FR-V07)
    'pdv:portefeuille:reaffecter', // affectation et réaffectation, point par point ou par lot (FR-V12)
    'pdv:plafond:modifier', // plafond, conditions de règlement, suspension (FR-V30 → V33)
    'pdv:regle:definir', // règles de pipeline, droit restreint (FR-V39)
    'pdv:nature:modifier', // poser ou retirer le lien vers un point de stock (FR-V02, AD-1)
    'pdv:transition:corriger', // corriger une transition automatique, tracée comme un désaccord (FR-V20, AD-9)
    'pdv:depart:declarer', // départ d'un commercial : un seul processus, révélation si indépendant (AD-5)
  ],

  // C5 : faits publiés et consommés. Noms proposés ici, à figer par la story de publication (EPIC-094).
  // Chaque fait d'objet porte l'identifiant stable de l'objet et un `rang` (point d'écriture unique, §6).
  publie: [
    'pdv.point-de-vente.changed@1', // état absolu : création, modification, fermeture, lien point de stock
    'pdv.affectation.changed@1', // titulaire courant ou SANS_COMMERCIAL (AD-2)
    'pdv.transition.enregistree@1', // transition de pipeline expliquée : moteur, règle, valeurs (AD-9)
    'pdv.plafond.changed@1', // limite, devise, suspension, ou PLAFOND_SANS_OBJET, jamais 0 (AD-11)
    'pdv.commercial.parti@1', // départ ; liste exacte des points qui restent ; consommé par catalogue (AD-5)
    'instance.journal@1', // affectations, plafonds, changements de nature, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'reseau.portee.changed@1', // suite de conformité de reseau jouée en CI, inscription au registre (AD-15)
    'connecteurs.domaine.changed@1', // propriétaire du domaine pdv.points-de-vente (spine de Connecteurs, AD-3)
    'identity.*', // topics existants, nom sans suffixe de version
    'kyc.status.changed',
    // Les faits des quatre sources de la vue 360° (commande, facturation, terrain, recouvrement) s'ajoutent en
    // version mineure quand leurs manifestes les nomment (lots 2 et 3).
  ],

  profilCompose: 'pdv',

  // C13, point 1.
  prerequis: [
    {
      code: 'fond-de-carte',
      description:
        "Google Maps joignable depuis le poste de l'utilisateur (décision du PO, 2026-11-12) : clé de l'API Maps JavaScript de l'espace, facturation active, clé restreinte au domaine de l'application (FR-V27)",
      action:
        "Renseigner une clé Google Maps valide et ouvrir l'accès à Google depuis les postes ; sans elle la carte est vide, la liste reste utilisable.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'portee-reseau',
      route: 'POST /api/v1/instance/pdv/{organisationId}/verifications/portee-reseau',
      critere:
        "Portée de l'organisation reçue de reseau et projetée : 🟢 si le dernier numéro publié est projeté ; 🔴 sinon (la lecture de « tout le réseau » rendrait 0 point, AD-15).",
    },
    {
      code: 'regles-pipeline',
      route: 'POST /api/v1/instance/pdv/{organisationId}/verifications/regles-pipeline',
      critere:
        'Nombre de règles de transition actives : ≥ 1 🟢 ; 0 🟠 « seules les transitions humaines s\'appliquent » (FR-V16, FR-V17).',
    },
    {
      code: 'points-sans-commercial',
      route: 'POST /api/v1/instance/pdv/{organisationId}/verifications/points-sans-commercial',
      critere: 'Points de vente ouverts sans commercial : 0 🟢 ; ≥ 1 🟠 avec leur nombre (FR-V14, SM-1).',
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation.
  avertissementDesinstallation:
    "Les points de vente, leurs affectations et leur historique restent enregistrés ; commande, facturation et catalogue ne recevront plus les plafonds ni les départs de commerciaux.",

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/pdv/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (noms proposés, figés par EPIC-085).
  routesLectureSeule: [
    'GET /api/v1/instance/pdv/{organisationId}/export',
    'GET /api/v1/points-de-vente',
    'GET /api/v1/points-de-vente/{pointDeVenteId}', // fiche et vue 360°, chaque élément avec source et fraîcheur
    'GET /api/v1/points-de-vente/{pointDeVenteId}/transitions',
    'GET /api/v1/portefeuille',
    'GET /api/v1/carte',
    'GET /api/v1/segments',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/pdv/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/pdv/{organisationId}/export',
    import: 'POST /api/v1/instance/pdv/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/pdv/{organisationId}/effacement', // contacts = personnes (AD-13)
    sante: 'GET /api/v1/instance/pdv/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : schémas dans
  // prospera-plateforme/contrats/objets/pdv/, écrits avec EPIC-161.
  // - point-de-vente : identité, contacts, adresse, zone (référence vers reseau), géolocalisation facultative
  //   (NON_GEOLOCALISE), nature, plafond et conditions. Régimes VIVANT (ouvert) et HISTORIQUE (fermé avant la
  //   reprise). Valeurs de contrôle : nature (etat), statut ouvert/fermé (etat), plafond (montant, ou
  //   PLAFOND_SANS_OBJET pour un magasin propre). Doublons : téléphone d'abord, proximité ensuite (FR-V06).
  // - affectation : point de vente → commercial titulaire, datée (AD-2, AD-4). Le commercial est une personne
  //   (compte d'auth-service) ; reseau porte son affectation à une zone (PRD reseau FR-R20). L'objet visé par la
  //   référence se décide avec le manifeste de reseau [À CONFIRMER : spine de la Reprise AD-23].
  // - L'état du pipeline n'est pas repris : il se recalcule par les règles du distributeur (décision du PO,
  //   2026-11-12 ; à vérifier en recette sur un lot repris).
  objetsDeReprise: ['pdv.point-de-vente@1', 'pdv.affectation@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : Prospera propriétaire par défaut (PRD
  // Connecteurs FR-14). Un seul point d'écriture pour ce domaine (§6 du contrat). L'affectation reste à
  // Prospera seule : elle n'est pas échangée (le commercial Odoo n'a pas de correspondance définie).
  domainesEchange: [
    {
      code: 'pdv.points-de-vente',
      objets: ['pdv.point-de-vente@1'],
      sorte: 'OBJET_DATE',
      argent: false, // un plafond n'est pas un mouvement d'argent (spine de Connecteurs, AD-2)
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'pdv.echange.points-de-vente',
      publie: ['pdv.point-de-vente.changed@1'],
    },
  ],
} as const;
