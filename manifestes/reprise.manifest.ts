// Manifeste M44 — Reprise de données (format du contrat de module, clause C1, amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Le propriétaire du dépôt `reprise-service` le copie dans `src/module.manifest.ts` la semaine où il y travaille ;
// une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-reprise-donnees-2026-11-10 (FR-21, §7) ;
//              spine architecture/architecture-reprise-donnees-2026-11-11 (AD-12, AD-16, AD-17, AD-21).
//
// Hors manifeste, pour mémoire :
// - Offre : module installable, ouvert d'office dans toute offre d'essai de prospect (PRD moteur FR-33) ;
//   bundles commerciaux [À CONFIRMER] (manifestes-a-produire.md, M44).
// - Rôle prédéfini « Responsable de la reprise » (C7) : tous les droits sauf reprise:lot:valider, soit cinq
//   (importer, fusionner, consulter, regle:modifier, comptage:saisir) ; jamais reprise:lot:valider, que le DG
//   seul attribue (spine D-27, AD-26).
// - Le rôle du DSI d'un distributeur contient les six droits dès l'installation (PRD FR-19).
// - Mise en service : la première dans l'espace réel, sans feu vert (spine AD-17 ; PRD moteur FR-8).

export const MANIFESTE_REPRISE = {
  code: 'reprise',
  version: '1.0.0',

  // C1, §3 : aucune dépendance dure ; la Reprise fonctionne sans aucune cible (rapport seul, C4).
  depends: [],

  // Modules qui déclarent `objetsDeReprise` (C1, amendement du 2026-11-11). Une cible absente donne des
  // lignes « non installé » au rapport. Liste de février (propriétaires présumés, spine AD-23) :
  // `approvisionnement` (fournisseurs, spine AD-23 ; module cadré par le PRD distributeur du 2026-11-12). Les
  // polices sont reçues par `assurance` : pas de code `polices` (décision du PO, 2026-11-12).
  enrichiPar: ['pdv', 'catalogue', 'reseau', 'stock', 'facturation', 'approvisionnement', 'assurance', 'sinistres'],

  referentielFamilies: [],

  // C7 : droits de tenant. L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'reprise:lot:importer',
    'reprise:lot:valider',
    'reprise:doublon:fusionner',
    'reprise:rapport:consulter',
    'reprise:regle:modifier',
    'reprise:comptage:saisir',
  ],

  // C5 : faits publiés et consommés (noms fixés par la spine, AD-21).
  publie: [
    'reprise.feu-vert.changed@1', // réel seulement ; état absolu par module cible
    'reprise.historique.livre@1',
    'reprise.cles-rattachement.publiees@1', // nom réservé, charge décidée avec le PRD de la GED
    'instance.journal@1',
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'reception-definitive.enregistree@1', // réel seulement
    'connecteurs.nuit.terminee@1', // amendement du 2026-11-12, spine de Connecteurs (AD-15) : marche en parallèle, rapport d'écarts de la période
    'connecteurs.nuit.absente@1', // idem : nuit « non couverte » au rapport de la période
  ],

  profilCompose: 'reprise',

  // C13, point 1.
  prerequis: [
    { code: 'stockage-objets', description: "MinIO de l'espace joignable, bucket `reprise` créé" },
    { code: 'redis', description: "Redis de l'espace joignable (file BullMQ)" },
    { code: 'serveur-reference', description: "Serveur de référence : 8 cœurs, 32 Go (NFR-4)" },
    { code: 'espace-disque', description: "Espace libre pour les fichiers déposés : au moins 10 fois la taille du plus gros fichier attendu" },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelée par le moteur.
  verifications: [
    {
      code: 'donnees-importees',
      route: 'POST /api/v1/instance/reprise/{organisationId}/verifications/donnees-importees',
      critere:
        "Par module attendu : aucun objet VIVANT en ERREUR, aucun écart ouvert (spine AD-24), seuil 0 ; " +
        "pour `stock`, comptage clos. Rend ATTENDU ou VERT par module.",
    },
  ],

  // C12 : format lisible par la version précédente pendant 7 jours, lot en cours compris.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/reprise/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou (spine AD-31)
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE.
  routesLectureSeule: [
    'GET /api/v1/instance/reprise/{organisationId}/export',
    'GET /api/v1/lots',
    'GET /api/v1/lots/{lotId}',
    'GET /api/v1/lots/{lotId}/versions/{n}',
    'GET /api/v1/lots/{lotId}/versions/{n}/rapport',
    'GET /api/v1/lots/{lotId}/progression',
    'GET /api/v1/correspondances',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/reprise/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/reprise/{organisationId}/export',
    import: 'POST /api/v1/instance/reprise/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/reprise/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/reprise/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 : la Reprise ne reçoit elle-même aucun objet repris.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2 et AD-31) : la Reprise ne déclare aucun domaine d'échange.
  domainesEchange: [],
} as const;
