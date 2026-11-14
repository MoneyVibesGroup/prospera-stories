// Manifeste `ia` — Le socle de l'IA commune (format du contrat de module, clause C1).
// Écrit le 2026-11-14. Source : PRD de l'IA commune (prds/prd-ia-commune-2026-11-13/prd.md), annexe A.1, annexe B
// (contrat de proposition) ; spine de l'IA commune (architecture/architecture-ia-commune-2026-11-13/
// ARCHITECTURE-SPINE.md), qui GAGNE sur l'annexe A quand les deux divergent : AD-1 (une proposition, jamais une
// décision), AD-2 (unités et données), AD-4 (port de consommation), AD-5 (contrat de proposition), AD-7 (catalogue
// des capacités), AD-13 et AD-14 (écarts, faits « prédiction » et « réalité »), AD-32 (contrats nommés), AD-33,
// AD-41 (un seul écrivain du statut), AD-43 (« qui avait raison »), AD-47 (identité `secteur/code@majeure`),
// AD-51 (table de codes) ; CONTRAT-DE-MODULE-2026-11-09.md.
//
// Service porteur : `prospera-ia-service` (:3417), qui reprend l'ancien `assistant-service` jamais codé (spine, AD-39).
// Trois modules installables séparément dans ce service : `ia` (ce manifeste), `assistant` (M27) et `automatisations`
// (M26). Même code en ligne (plusieurs organisations) et en local (une organisation, sous l'agent) : AD-3.
// La centrale `prospera-ia-centrale` (:3418, Money Vibes seulement) n'a PAS de manifeste : voir
// prds/prd-moteur-installation-2026-11-09/manifestes-a-produire.md.
// Propriétaire du manifeste : Dev B.
//
// Hors manifeste, pour mémoire :
// - Écrans : `prospera-app/src/modules/ia/` (C8) : composant commun d'affichage d'une proposition, `/ia/capacites`,
//   `/ia/registre`, `/ia/rapports`, `/ia/versions`, `/ia/consentements`, `/ia/transferts`. Aucune règle métier.
// - Gate : `IA_NOT_ENTITLED`. Cloisonnement par `organisationId` (`ORGANISATION_HORS_JETON`) ; l'IA n'a aucun droit
//   propre et n'ouvre aucune donnée que l'utilisateur ne peut voir.
// - Paramètres (C6) : annexe D du PRD, convention `ia.<domaine>.<nom>` (`ia.proposition.confiance_min`,
//   `ia.niveau.seuil_n2`, `ia.calibration.borne_pct`, `ia.export.k_min`, `ia.desaccord.horizon`, ...). Données.
// - Capacités : déclarées par les modules consommateurs dans leur clause `ia` (`secteur/code@majeure`) ; le catalogue
//   d'une instance est dérivé (capacités des modules installés ∩ packs installés, AD-7). Le socle ne déclare aucune
//   capacité métier.
// - Désinstaller ne supprime rien : registre, écarts, calibrations, modèles, rapports restent stockés et masqués.

export const MANIFESTE_IA = {
  code: 'ia',
  version: '1.0.0',

  // C1 : aucune dépendance dure (socle de la plateforme seulement). Les quatre logiciels consomment l'IA par la
  // clause C11, sans dépendance dure (FR-40, FR-43) : un module sans IA rend `NON_INSTALLE` ou `INDISPONIBLE`.
  depends: [],

  // C4 : un module métier absent retire ses capacités du catalogue ; un fait de réalité absent laisse la capacité
  // N0 ou N1 ; `document-service` absent : lecture de pièces `NON_INSTALLE` ; modèle de langage absent : repli sur
  // gabarit et règle, dit à l'écran (`DEGRADE`).
  enrichiPar: ['assistant', 'automatisations'],

  referentielFamilies: [],

  // C7 : droits propres au module (réglage, registre, promotion). Aucun droit n'ouvre une donnée métier.
  droits: [
    'ia:registre:lire', // AUD, RM
    'ia:journal:lire', // AUD, DPD
    'ia:capacite:consulter', // UM, RM, DSI, DG
    'ia:capacite:couper', // RM pour son périmètre, DG pour toute l'organisation
    'ia:rapport:lire', // RM, DSI
    'ia:desaccord:lire', // RM ; l'agent pour ses propres désaccords seulement (FR-75)
    'ia:observation:enregistrer', // UM, pour la personne concernée (FR-22)
    'ia:version:promouvoir', // DSI (FR-66)
    'ia:version:retirer', // DSI (FR-67)
    'ia:parametre:regler', // DSI, RM selon le paramètre
    'ia:consentement:modifier', // DG ou désigné par écrit (`CONSENTEMENT_RESERVE_AU_DG`, FR-76)
  ],

  // C5 : AD-32 (un catalogue, un producteur par fait). Chaque fait porte `organisationId` et `eventId`.
  publie: [
    'ia.proposition.rendue@1', // identifiant, capacité (`secteur/code@majeure`), version, maturité, origine (REGLE | MODELE | LANGAGE), niveau, statut ; pour les deux formes d'appel (AD-42)
    'ia.proposition.statut.change@1', // statut écrit par `ia` seul (AD-41), correction d'expiration comprise
    'ia.prediction.enregistree@1', // AD-14 : pour une proposition REMISE seulement ; `objetRef` pseudonyme ; ACL de topic : consommé par `ia` seul ; aucune valeur sur le bus pour la santé (AD-27)
    'ia.ecart.enregistre@1',
    'ia.desaccord.tranche@1', // IA_AVAIT_RAISON, HUMAIN_AVAIT_RAISON, INDECIDABLE (AD-43)
    'ia.capacite.changed@1', // état absolu : coupée, dégradée, en service, niveau, version
    'ia.modele.promu@1',
    'ia.modele.retire@1',
    'ia.derive.alertee@1',
    'instance.indicateurs@1', // [proposition, AD-32] indicateurs de niveau 0 de l'IA, schéma fermé, lus par l'agent
    'instance.journal@1', // [proposition, C13/journal d'instance] export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'ia.proposition.decidee@1', // AD-41 : fait d'intention du module consommateur ; `ia` est le seul écrivain du statut
    // AD-14 : `<module>.realite.constatee@1` (`definitive`, `echeance`), produit par le module qui sait. Noms retenus
    // à ce jour, un par module qui constate la réalité (chaque module les déclare à son manifeste, C5) :
    'approvisionnement.realite.constatee@1',
    'caisse.realite.constatee@1',
    'coeur-sfd.realite.constatee@1',
    'collecte.realite.constatee@1',
    'commande.realite.constatee@1',
    'conformite-bceao.realite.constatee@1',
    'conquete-objectifs.realite.constatee@1',
    'credit.realite.constatee@1',
    'facturation.realite.constatee@1',
    'microfinance.realite.constatee@1',
    'recouvrement.realite.constatee@1',
    'risque-par.realite.constatee@1',
    'terrain.realite.constatee@1',
    'controle-gestion.realite.constatee@1',
    'dashboard.realite.constatee@1',
    'equipe.realite.constatee@1',
    'expertises.realite.constatee@1',
    'finance-transactions.realite.constatee@1',
    'ged.realite.constatee@1',
    'marketing.realite.constatee@1',
    'sinistres.realite.constatee@1',
    // À ajouter par les manifestes des modules qui n'existent pas encore sur la branche : balance, bilan, declarations,
    // conseil. `pdv`, `support-client`, `assurance` et `liaison-assureur` n'ont aucune capacité (aucun fait de réalité).
    'ia.modele.signe@1', // `prospera-ia-centrale` : ligne de modèles distincte (AD-21)
    'ia.modele.publie@1',
    'ia.jeton.export@1', // jeton quotidien d'export, produit par `centrale-service` du moteur
    'ia.execution.demandee@1', // [AD-32] déposé par `automatisations` par le contrat public d'`ia` ; transmis à `assistant`, seul propriétaire d'exécution (AD-45)
    // Hors bus, lus par route : `types-action@AAAA.N`, `classification-sante`, corpus légal (`ReferentielVersion`),
    // liste des objets et effets interdits (`platform-catalog-service`).
  ],

  profilCompose: 'ia',

  // C13 : sans prérequis de données ; au moins un module métier qui déclare une capacité est recommandé.
  prerequis: [],

  // C13 : une route, un critère chiffré (vert, orange ou rouge), appelées par le moteur. Noms de routes proposés.
  verifications: [
    {
      code: 'registre-complet',
      route: 'POST /api/v1/instance/ia/{organisationId}/verifications/registre-complet',
      critere: "Le nombre de propositions affichées égale le nombre d'entrées du registre : 🟢 ; sinon 🔴 avec l'écart (FR-17).",
    },
    {
      code: 'jamais-bloquante',
      route: 'POST /api/v1/instance/ia/{organisationId}/verifications/jamais-bloquante',
      critere: "L'IA coupée, un parcours d'essai de chaque logiciel va au bout : 🟢 ; sinon 🔴 avec le parcours en cause (FR-40, AD-4).",
    },
    {
      code: 'port-unique',
      route: 'POST /api/v1/instance/ia/{organisationId}/verifications/port-unique',
      critere: "Aucun appel direct à un fournisseur de modèle ni constante de barème n'est trouvé hors du port : 🟢 ; sinon 🔴 (FR-37).",
    },
    {
      code: 'aucun-port-entrant',
      route: 'POST /api/v1/instance/ia/{organisationId}/verifications/aucun-port-entrant',
      critere: 'En local, le balayage de ports ne trouve aucun port entrant : 🟢 ; sinon 🔴 avec le port (FR-32).',
    },
    {
      code: 'sante-hors-instance',
      route: 'POST /api/v1/instance/ia/{organisationId}/verifications/sante-hors-instance',
      critere: 'Une demande classée santé vers un modèle hébergé est refusée (`SANTE_HORS_INSTANCE`) : 🟢 ; sinon 🔴 (FR-36, AD-27).',
    },
    {
      code: 'contrat-identique',
      route: 'POST /api/v1/instance/ia/{organisationId}/verifications/contrat-identique',
      critere: 'La suite de contrat rend les mêmes propositions en ligne et en local : 🟢 ; sinon 🔴 avec la différence (FR-30, AD-3).',
    },
    {
      code: 'equite',
      route: 'POST /api/v1/instance/ia/{organisationId}/verifications/equite',
      critere: 'Une variable hors liste fermée est refusée (`VARIABLE_NON_AUTORISEE`) : 🟢 ; sinon 🔴 avec la variable (FR-70, AD-48).',
    },
  ],

  // C9 : désinstaller ne supprime rien ; aucun bouton « supprimer » ; test aller-retour ; la rétention du registre
  // (`ia.registre.retention_annees`) vaut après désinstallation (FR-181).
  avertissementDesinstallation:
    "Plus aucune proposition d'IA ne sera rendue ; les règles de base de chaque module continuent de servir ; le registre est conservé.",

  // C12 : fenêtre de retour arrière de 30 jours (`ia.promotion.retour_conservation_jours`). Migration additive ; le
  // journal des écarts, le registre et les calibrations sont hors de la migration de promotion et lisibles par la
  // version précédente. L'image du service est une seule : son `retourArriere` est le plus restrictif de ses modules.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/ia/migrer', // [proposition] route de service, sans organisation, idempotente
  // Comportement seulement, jamais la forme des données.
  interrupteurs: ['copilot-ia', 'langage-ia', 'apprentissage-commun', 'modele-commun', 'voix-terrain', 'versions-de-catalogue'],

  // C2, C13 : routes autorisées en LECTURE_SEULE (propositions, registre, export). Noms proposés.
  routesLectureSeule: [
    'GET /api/v1/ia/{organisationId}/propositions', // [proposition] PropositionPort, lecture
    'GET /api/v1/ia/{organisationId}/registre', // [proposition, `ia:registre:lire`]
    'GET /api/v1/instance/ia/{organisationId}/export',
  ],

  routesInstance: {
    export: 'GET /api/v1/instance/ia/{organisationId}/export',
    import: 'POST /api/v1/instance/ia/{organisationId}/import',
    effacement: 'POST /api/v1/instance/ia/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/ia/{organisationId}/sante', // OK ou DEGRADE par capacité et par moteur
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Le registre, les écarts et les calibrations ne se reprennent pas d'un autre logiciel.
  objetsDeReprise: [],
  domainesEchange: [],

  // C11 : l'IA EST le moteur ; elle ne déclare aucune capacité métier. Les capacités à maturité N1 se déclarent ici
  // quand un modèle commun existe (au plus tôt au second semestre 2027) ; la finalité est celle de l'apprentissage
  // commun (vocabulaire fermé du moteur).
  ia: {
    capacites: [],
    finalites: ['apprentissage-commun'],
  },
} as const;
