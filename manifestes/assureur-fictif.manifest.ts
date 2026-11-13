// Manifeste — `assureur-fictif`, logiciel de compagnie fictif (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12). DÉMONSTRATION ET ESSAI SEULEMENT : JAMAIS en production, jamais dans un espace réel.
// Source : PRD assurance (prds/prd-assurance-2026-11-13/prd.md), annexe A.6 (FR-202 → FR-205), annexe C (le contrat qu'il
// parle), annexe E ; spine assurance (architecture/architecture-assurance-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE sur
// l'annexe A quand les deux divergent : AD-19 (la démonstration : un LC fictif, jamais en production), AD-13 (les deux
// transports), AD-18 (horloge pilotée par l'agent en essai), AD-21 (`assureurFictifAutorise` dans l'état voulu), AD-25.
// Le propriétaire du dépôt `prospera-assureur-fictif` copie ce fichier dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
//
// ⚠️ PAS DE NUMÉRO, PAS DE VENTE : `assureur-fictif` n'a pas de numéro M dans manifestes-a-produire.md et ne se vend pas ; ce
// n'est pas un produit, c'est un outil de démonstration et de recette. Précédent : le cœur fictif de la microfinance
// (`prospera-coeur-fictif`) est une application à part SANS manifeste ; ici l'annexe A.6 donne les treize clauses, et le
// manifeste existe pour que le moteur le sache, le CONTRÔLE et le REFUSE hors essai. Aucun bundle. Propriétaire : Dev B.
//
// ⚠️ SERVICE PORTEUR : `prospera-assureur-fictif` (application à part, spine AD-3 et AD-19) ; il lève le [À CONFIRMER, D18] de
// l'annexe A.6 C1. Il parle l'annexe C par les DEUX transports (API et fichiers) et rien d'autre : il ne lit ni n'écrit aucune
// base de Prospera.
//
// ⚠️ ESPACE D'ESSAI SEULEMENT (AD-19) : l'état voulu signé d'une instance porte `assureurFictifAutorise` (FAUX par défaut, sur le
// modèle de `coeurFictifAutorise`) ; l'agent refuse de démarrer ce module ailleurs que dans un espace d'essai
// (`ASSUREUR_FICTIF_INTERDIT`), quelle que soit la licence, et le bilan d'installation d'un espace « réel » ÉCHOUE au rouge s'il
// est présent ou activable (vérification `assureur-fictif-absent-du-reel`, FR-205). La gate `ASSUREUR_FICTIF_NOT_ENTITLED` n'est
// accordée qu'aux espaces d'essai. Aucun secret ni destination du réel n'est reçu par l'essai (AD-25).
//
// Écarts relevés entre l'annexe A.6 du PRD et la spine (la spine gagne) :
// - C1, service porteur et interrupteur d'état : la spine nomme `assureurFictifAutorise` (champ signé de l'état voulu, AD-21) ;
//   l'annexe parle d'une gate « accordée aux espaces d'essai seulement ». Les deux se cumulent : le champ de l'état voulu fait foi
//   pour l'agent, la gate pour les routes.
// - C5, consomme : `etat-publie.changed.essai@1` seul, jamais `.reel` (annexe et spine concordent) ; la spine ajoute
//   `essai.horloge.changed@1` (l'horloge de l'essai est pilotée par l'agent et partagée avec le LC fictif : aucun calcul
//   d'échéance, d'âge ou de fraîcheur n'y utilise l'horloge système, AD-18).
// - C13, `numero-sans-trou` : la spine (AD-19) précise que le LC fictif attribue ses numéros dans un format PROPRE, différent du
//   `PRO-` de Prospera, sans trou ni doublon, `DEC-` idempotente.
// - C13, `remise-a-zero` : la spine précise que le jeu (14 gestionnaires, environ 3 500 dossiers sur tous les statuts, quatre
//   scénarios `SIN-2026-9001` à `9004`) est produit par un GÉNÉRATEUR À GRAINE FIXE, par le contrat, jamais par écriture directe ;
//   la remise à zéro est une opération serveur de `ADMIN`, en essai seulement.
//
// Hors manifeste, pour mémoire :
// - Cloisonnement (C2) : par `organisationId` ; aucun identifiant du LC fictif n'est accepté par un espace réel, aucune donnée
//   d'essai ne passe dans un espace réel (sauf par la Reprise). Réglages de panne réservés au compte d'essai de démonstration.
// - Données possédées (C3) : jeu fictif de bout en bout (aucune donnée d'une personne réelle, FR-202) : assurés, polices et
//   garanties des 7 produits de la démo (environ 25 000 contrats), tous statuts de police, primes impayées, coassurance,
//   intermédiaires, coassureurs et clés, sinistres existants et leurs documents, numéros de sinistre attribués (format propre),
//   journal des envois reçus, réglages d'essai (coupure, refus motivé, doublon, écart, retard, mode « ne reçoit pas », changement
//   d'une police après l'ouverture d'un dossier, FR-204). Ne lit aucune donnée réelle.
// - Paramètres (C6) : annexe D.4 (délai simulé d'attribution, format du numéro, taille du jeu, parts de polices suspendues,
//   impayées ou en coassurance, réglages de panne) ; aucune de ces valeurs n'entre dans un espace réel.
// - Écrans (C8) : module d'écran `assureur-fictif` dans `prospera-app`, `src/modules/assureur-fictif/`, tous les écrans par Dev B.
//   `/assureur-fictif` (bandeau « données fictives »), `/assureur-fictif/reglages`, `/assureur-fictif/jeu` (consultation et remise
//   à zéro). Entrée de menu visible dans l'espace d'essai seulement. Les écrans branchés sur lui affichent « données fictives » ;
//   boutons non branchés : « bientôt ».
// - Essai (C13) : aucune action n'envoie de message réel ; les sorties (messages, ordres) sont interceptées et comptées (FR-205).
// - Sorties : aucune destination sortante.
// - Désinstaller ne supprime rien en essai : le jeu et les réglages restent stockés et masqués ; la REMISE À ZÉRO est une action
//   explicite, pas une désinstallation.

export const MANIFESTE_ASSUREUR_FICTIF = {
  code: 'assureur-fictif',
  version: '1.0.0',

  // Particularité de ce manifeste [proposition de champ, à porter au contrat à l'amendement des modules d'essai] : le module n'est
  // installable que dans un espace d'essai, autorisé par `assureurFictifAutorise` dans l'état voulu (AD-19, AD-21). Sans ce
  // champ, la garde est dans `prerequis` et dans la vérification `assureur-fictif-absent-du-reel`.
  espacesAutorises: ['essai'],
  champEtatVoulu: 'assureurFictifAutorise', // faux par défaut

  // C1 : aucune dépendance. Le module n'a besoin que du socle pour servir l'API et les fichiers du contrat d'échange.
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par entrée.
  // - liaison-assureur : sa seule contrepartie ; absent, le LC fictif tourne et sert son API et ses fichiers, mais personne ne les lit ;
  // - sinistres, assurance : le jeu se charge et se consulte seul ;
  // - ged : documents de sinistres existants servis, non lus ;
  // - reprise : pas de répétition de reprise dans l'espace d'essai ;
  // - IA commune : sans objet, aucun emplacement d'IA.
  enrichiPar: ['liaison-assureur', 'sinistres', 'assurance', 'ged', 'reprise'],

  // Aucun numéro de compte ici : le module ne passe aucune écriture.
  referentielFamilies: [],

  // C7 : droits de tenant (annexe A.6). Le code a un tiret : le format `^[a-z]+:[a-z-]+:[a-z]+$` n'est tenu qu'APRÈS
  // l'élargissement du format de droits d'`auth-service` (amendement C7 du 2026-11-11) ; tant qu'il n'est pas fait, ces droits sont
  // déclarés et NON ATTRIBUABLES ; le compte d'essai de démonstration les porte. Aucun rôle métier de la compagnie n'y accède.
  droits: [
    'assureur-fictif:jeu:consulter',
    'assureur-fictif:jeu:reinitialiser', // remise à zéro : opération serveur de ADMIN, en essai seulement
    'assureur-fictif:reglage:modifier', // coupure, refus, doublon, écart, retard, mode « ne reçoit pas », changement de police
  ],

  // C5 : faits publiés et consommés (annexe A.6). Le module parle le contrat de l'annexe C par son TRANSPORT (API et fichiers),
  // pas par des faits : les objets C-1 à C-12 sortent par l'API et les fichiers, les messages C-13 à C-19 y entrent. Ces trois
  // faits sont des propositions (hors catalogue d'AD-16, qui est celui du périmètre assurance de production).
  publie: [
    'assureur-fictif.jeu.charge@1',
    'assureur-fictif.jeu.remis-a-zero@1',
    'assureur-fictif.reglage.changed@1', // coupure, refus, retard, mode « ne reçoit pas »
  ],
  consomme: [
    'etat-publie.changed.essai@1', // il n'écoute JAMAIS `.reel`
    'essai.horloge.changed@1', // horloge de l'essai pilotée par l'agent (AD-18)
  ],

  // C10 (annexe A.6) : `profiles: ["assureur-fictif"]` ; socle seul, espace d'essai.
  profilCompose: 'assureur-fictif',

  // C13, point 1 : l'annexe A.6 écrit « un espace d'essai (jamais un espace réel) ». [proposition] Le code de prérequis est de ce
  // fichier.
  prerequis: [
    {
      code: 'espace-d-essai',
      description:
        "L'espace est un espace d'essai et l'état voulu signé porte `assureurFictifAutorise` à vrai ; jamais un espace réel",
      action: "Installer dans l'espace d'essai du prospect ; le refuser sinon (`ASSUREUR_FICTIF_INTERDIT`).",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Les cinq codes et leurs critères
  // sont ceux de l'annexe A.6 ; noms de routes proposés (convention commune : `verifications/<code>`).
  verifications: [
    {
      code: 'assureur-fictif-absent-du-reel',
      route: 'POST /api/v1/instance/assureur-fictif/{organisationId}/verifications/assureur-fictif-absent-du-reel',
      critere:
        "Le LC fictif est présent ou activable dans un espace réel : 🔴 (`ASSUREUR_FICTIF_INTERDIT`) ; absent : 🟢. Le bilan d'installation d'un espace réel échoue au rouge (FR-205, AD-19).",
    },
    {
      code: 'objets-de-l-annexe-c',
      route: 'POST /api/v1/instance/assureur-fictif/{organisationId}/verifications/objets-de-l-annexe-c',
      critere:
        "Chaque objet « LC → Prospera » de l'annexe C est produit avec ses champs minimaux et chaque objet « Prospera → LC » est accepté, refusé avec un code ou reconnu comme doublon : 🟢 ; sinon 🔴 avec l'objet (FR-202).",
    },
    {
      code: 'numero-sans-trou',
      route: 'POST /api/v1/instance/assureur-fictif/{organisationId}/verifications/numero-sans-trou',
      critere:
        "Les numéros attribués sont sans trou ni doublon et le même `DEC-` présenté deux fois reçoit le même numéro : 🟢 ; sinon 🔴 (FR-203, AD-19).",
    },
    {
      code: 'jeu-sans-personne-reelle',
      route: 'POST /api/v1/instance/assureur-fictif/{organisationId}/verifications/jeu-sans-personne-reelle',
      critere:
        "Aucune donnée du jeu ne provient d'une personne réelle (noms, immatriculations, téléphones) : 🟢 ; sinon 🔴 (FR-202).",
    },
    {
      code: 'remise-a-zero',
      route: 'POST /api/v1/instance/assureur-fictif/{organisationId}/verifications/remise-a-zero',
      critere:
        "La remise à zéro recharge 14 gestionnaires, environ 3 500 dossiers, polices et garanties des 7 produits et experts, et rejoue les quatre scénarios `SIN-2026-9001` à `9004` : 🟢 ; sinon 🔴 avec le scénario en cause (FR-205, AD-19).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.6).
  avertissementDesinstallation:
    "Le logiciel de compagnie fictif disparaît de l'espace d'essai : aucune police, aucune garantie ni aucun numéro de sinistre fictif ne sera servi ; aucune donnée réelle n'est concernée.",

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive, sur un espace d'essai. Le jeu se recharge
  // depuis sa source de démonstration : il n'est pas migré. Une version du contrat d'échange plus récente que celle du LC fictif
  // est refusée par lui comme par un vrai LC (`VERSION_CONTRAT_INCONNUE`, N et N-1 acceptées).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/assureur-fictif/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (consultation du jeu). Noms proposés, à figer par la story d'API.
  routesLectureSeule: [
    'GET /api/v1/assureur-fictif/jeu', // [proposition]
    'GET /api/v1/assureur-fictif/reglages', // [proposition]
    'GET /api/v1/instance/assureur-fictif/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/assureur-fictif/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/assureur-fictif/{organisationId}/export',
    import: 'POST /api/v1/instance/assureur-fictif/{organisationId}/import', // sa part du dossier d'installation (essai)
    effacement: 'POST /api/v1/instance/assureur-fictif/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/assureur-fictif/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : aucune donnée fictive n'est reprise dans un espace réel.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : il tient la place du propriétaire des domaines de `liaison-assureur` en
  // essai, il n'en déclare aucun lui-même.
  domainesEchange: [],

  // C11 : sans objet, aucun modèle promis. Le jeu de démonstration n'entraîne aucun modèle ; ses données fictives ne sortent jamais
  // de l'espace d'essai, ni vers l'IA commune ni ailleurs.
  ia: {
    modeles: [],
    finalites: [],
  },
} as const;
