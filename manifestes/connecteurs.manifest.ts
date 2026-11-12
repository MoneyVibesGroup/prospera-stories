// Manifeste M43 — Connecteurs (format du contrat de module, clause C1, amendée le 2026-11-10, le 2026-11-11
// et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Le propriétaire du dépôt `connecteurs-service` le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-connecteurs-2026-11-10 (FR-3, FR-19, §7) ;
//              spine architecture/architecture-connecteurs-2026-11-12 (AD-21, AD-27, AD-29).
//
// Hors manifeste, pour mémoire :
// - Offre : module commercial, ajouté d'office dès que le contrat déclare un logiciel du client ; inclus dans
//   la plateforme complète (décision du PO, 2026-11-11, QC-2). Périmètre : le logiciel du client seulement ;
//   banques, Mobile Money, OTR et signature appartiennent à leurs modules métier (spine D-2).
// - Pas requis en février : aucun client de février ne garde son logiciel (spine AD-32, D-1).
// - Droit de plateforme `connecteurs:configuration:administrer` (intégrateur Money Vibes) : au catalogue des
//   droits de plateforme (quatre copies), pas dans `droits` ci-dessous, qui ne liste que les droits de tenant (C7).
// - Le rôle du DSI contient les quatre droits de tenant dès l'installation ; `connecteurs:ecart:trancher` est
//   attribué par l'administrateur du client à la comptable ou au chef d'agence (PRD FR-8, spine AD-27).
// - C11 : sans objet pour ce module (pas de champ `ia`) ; l'historique de nuit pour l'IA est un domaine
//   ordinaire déclaré par la cible (spine AD-2, AD-27).

export const MANIFESTE_CONNECTEURS = {
  code: 'connecteurs',
  version: '1.0.0',

  // C1, §3 : vendu sans la Reprise (PRD C1).
  depends: [],

  // Raisons (spine AD-27) :
  // - reprise : crée les tables de correspondance et le point de coupure, cédés à Connecteurs (AD-20) ;
  // - pdv, catalogue, stock, facturation, pi-spi (encaissements), approvisionnement : modules du distributeur
  //   avec Odoo (PRD FR-14) qui déclarent `domainesEchange` et reçoivent ou émettent les échanges.
  // La liste est à confirmer par les manifestes des cibles. Un module absent : domaine « non installé » (C4).
  enrichiPar: ['reprise', 'pdv', 'catalogue', 'stock', 'facturation', 'pi-spi', 'approvisionnement'],

  referentielFamilies: [],

  // C7 : droits de tenant (format <module>:<objet>:<action>). L'export reste réservé à
  // instance:donnees:exporter (C2).
  droits: [
    'connecteurs:file:consulter', // file d'envoi, refus, écarts, interceptions, bandeau de la file
    'connecteurs:refus:renvoyer', // « Corriger et renvoyer »
    'connecteurs:ecart:trancher', // décision sur un écart
    'connecteurs:file:reprendre', // reprise de la file après un retour arrière (DSI)
  ],

  // C5 : faits publiés et consommés (noms fixés par la spine, AD-29). Les faits sortants des cibles
  // (`<code>.<objet>.<fait>`) sont lus depuis leurs `domainesEchange`, pas listés ici.
  publie: [
    'connecteurs.domaine.changed@1', // état absolu par domaine (propriétaire, état, niveau)
    'connecteurs.nuit.terminee@1', // fin de la nuit d'une organisation (marche en parallèle)
    'connecteurs.nuit.absente@1', // données de nuit absentes à 06 h 00
    'instance.indicateurs@1', // compteurs par domaine (dont le niveau), schéma fermé
    'instance.journal@1',
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
  ],

  profilCompose: 'connecteurs',

  // C13, point 1 (PRD C13, FR-14 ; spine AD-23, AD-27). `action` : ce que l'intégrateur fait si le prérequis échoue.
  prerequis: [
    {
      code: 'logiciel-joignable',
      description: 'Une lecture de test du logiciel du client aboutit en moins de 30 secondes',
      action: "Ouvrir l'accès réseau de Money Vibes vers le logiciel du client, puis relancer la vérification.",
    },
    {
      code: 'version-detectee',
      description: 'Version et édition du logiciel du client détectées (Odoo : Community ou Enterprise)',
      action: 'Vérifier l\'adresse et la base déclarées ; une version jamais testée est signalée au bilan, sans refus.',
    },
    {
      code: 'droits-du-compte',
      description:
        'Le compte du connecteur a les droits exigés par les domaines configurés ; Odoo, compte d\'écriture du réel : groupe « Droits d\'accès » (identifiants externes), sinon repli sans déduplication',
      action: "Demander au client d'accorder les droits manquants, ou accepter le repli (liaison chez Connecteurs seulement).",
    },
    {
      code: 'odoo-online-custom',
      description: "Odoo Online : plan Custom (seul plan qui ouvre l'API externe)",
      action: 'Le client passe au plan Custom, ou le connecteur Odoo ne peut pas être mis en service.',
    },
    {
      code: 'redis',
      description: "Redis de l'espace joignable (file BullMQ)",
      action: "Rétablir Redis de l'espace ; la santé du connecteur reste DEGRADE tant qu'il manque.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'acces-logiciel',
      route: 'POST /api/v1/instance/connecteurs/{organisationId}/verifications/acces-logiciel',
      critere: 'Lecture de test en moins de 30 s ; version, édition et société détectées et rendues.',
    },
    {
      code: 'lecture-seule',
      route: 'POST /api/v1/instance/connecteurs/{organisationId}/verifications/lecture-seule',
      critere:
        "Identifiants de l'essai : 0 droit d'écriture constaté par le contrôle de droits natif du profil de version (Odoo : check_access_rights jusqu'à 17, has_access dès 18 ; modèles des domaines, objet de test, ir.model.data) ; sans contrôle natif, écriture de test refusée sur l'objet de test déclaré, sinon « non démontrée ».",
    },
    {
      code: 'bac-a-sable',
      route: 'POST /api/v1/instance/connecteurs/{organisationId}/verifications/bac-a-sable',
      critere:
        'Confirmation écrite enregistrée, base distincte de celle lue pour le réel (adresse, nom de base, identifiant de base quand il est lisible), envois de messages du bac à sable coupés ; empreinte revérifiée à chaque session.',
    },
    {
      code: 'objets-lus',
      route: 'POST /api/v1/instance/connecteurs/{organisationId}/verifications/objets-lus',
      critere: 'Par domaine entrant configuré : nombre d’objets lus ≥ 1, traduits sans refus de traduction.',
    },
    {
      code: 'aller-retour',
      route: 'POST /api/v1/instance/connecteurs/{organisationId}/verifications/aller-retour',
      critere:
        "1 objet de test écrit puis relu à l'identique (sur un bac à sable : l'écriture de test acceptée de C13 point 2) ; intercepté dans l'essai : 🟠 « aller-retour non vérifié ».",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (spine AD-21).
  avertissementDesinstallation:
    'Le logiciel du client cessera de recevoir les mouvements de Prospera ; la file d\'envoi sera figée, rien ne sera supprimé.',

  // C12 : format lisible par la version précédente pendant 7 jours ; un connecteur qui a écrit chez le client
  // n'est pas réversible chez lui (mouvements inverses proposés, jamais automatiques).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/connecteurs/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: ['odoo-json2'], // utiliser l'API JSON-2 d'Odoo dès qu'elle existe (Odoo 19 et suivants) ; lu dans interrupteurs[] de l'état publié

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (l'entrant continue, il n'est pas une route d'utilisateur).
  // Même liste que la spine AD-27.
  routesLectureSeule: [
    'GET /api/v1/instance/connecteurs/{organisationId}/export',
    'GET /api/v1/etat-synchro',
    'GET /api/v1/connecteurs',
    'GET /api/v1/connecteurs/{connecteurId}/domaines',
    'GET /api/v1/file-envoi',
    'GET /api/v1/refus',
    'GET /api/v1/ecarts',
    'GET /api/v1/interceptions',
    'GET /api/v1/concordances/{concordanceId}',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/connecteurs/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/connecteurs/{organisationId}/export',
    import: 'POST /api/v1/instance/connecteurs/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/connecteurs/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/connecteurs/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendements du 2026-11-11 et du 2026-11-12 : Connecteurs ne reçoit aucun objet repris (il reçoit la
  // cession) et ne déclare aucun domaine d'échange (il les relie : ceux des modules cibles).
  objetsDeReprise: [],
  domainesEchange: [],
} as const;
