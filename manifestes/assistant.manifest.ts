// Manifeste M27 — Assistant IA : Copilot et agents sous mandat (format du contrat de module, clause C1).
// Écrit le 2026-11-14. Source : PRD de l'IA commune (prds/prd-ia-commune-2026-11-13/prd.md), annexe A.2 ; spine de
// l'IA commune (architecture/architecture-ia-commune-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE : AD-26 (sortie
// de langage sourcée), AD-29 (Copilot en lecture seule, agents sous catalogue, mandat et événement), AD-32 (contrats
// nommés), AD-39 (actions listées), AD-45 (une exécution, un propriétaire, un compteur : `assistant`), AD-46 (objets
// interdits reliés aux types d'action) ; spine de l'assistant d'août (ratifiée et étendue, AD-1 à AD-23) ; PRD
// assistant d'août (prd-assistant-ia) ; manifestes-a-produire.md, ligne M27.
//
// Service porteur : `prospera-ia-service` (:3417), module `assistant` (le code est `assistant`, pas `assistant-ia`).
// Dépend DUREMENT de `ia`. Propriétaire du manifeste : Dev B.
//
// Hors manifeste, pour mémoire :
// - Écrans : `prospera-app/src/modules/assistant/` (C8) : emplacement du Copilot dans les quatre logiciels (texte,
//   lecture seule, chiffres sourcés, périmètre de chaque chiffre dit), `/assistant/mandats`,
//   `/assistant/executions`, `/assistant/arbitrage`. Aucune saisie vocale dans le Copilot au premier jour.
// - Gate : `ASSISTANT_NOT_ENTITLED`. Le Copilot lit ce que l'utilisateur peut lire ; un agent agit dans le
//   périmètre de son mandat ; les droits viennent du rôle métier, jamais d'un rôle IA.
// - Paramètres (C6) : `ia.mandat.duree_max_jours` (90), `ia.arbitrage.plafond_lot`, `ia.agent.annulees_pct_max`,
//   `ia.objectif.copilot.temps_reponse_s`, `ia.perf.copilot_p95_s`, `ia.cout.quota_mensuel`.
// - Le Copilot marche sans modèle de langage (recherche par règles et gabarits, dit à l'écran).
// - L'agrégat `Execution`, le compteur de mandat, l'outbox sortante et la file d'arbitrage sont à `assistant` seul
//   (AD-45) ; `automatisations` dépose une demande, il ne publie jamais `assistant.action.demandee`.
// - Assurance : le mode `AUTO` est refusé (`MODE_NON_PERMIS_ASSURANCE`) ; un type engageant ou irréversible n'est
//   jamais autonomisable (`TYPE_NON_AUTONOMISABLE`).

export const MANIFESTE_ASSISTANT = {
  code: 'assistant',
  version: '1.0.0',

  depends: [
    {
      code: 'ia',
      raison: 'Le contrat de proposition, le registre, le catalogue et la calibration vivent dans `ia` (MODULE_DEPENDANCE_MANQUANTE sans lui).',
    },
  ],

  // C4 : un module exécutant absent ne publie pas son type d'action, l'agent n'a pas cette action ; modèle de
  // langage absent : le Copilot se replie sur la recherche par règles et gabarits et le dit.
  // `enrichiPar` : les modules métier qui publient des types d'action (FR-134) ; liste à compléter à mesure que les
  // modules exécutants publient leur catalogue.
  enrichiPar: ['commande', 'facturation', 'recouvrement', 'collecte', 'caisse', 'terrain', 'approvisionnement'],

  referentielFamilies: [],

  // C7 : une question n'ouvre aucun droit supplémentaire.
  droits: [
    'assistant:copilot:interroger', // UM, RM
    'assistant:mandat:delivrer', // RM ou DG (`AUTORITE_INSUFFISANTE` sinon)
    'assistant:mandat:revoquer', // RM ou DG
    'assistant:execution:annuler', // RM
    'assistant:arbitrage:decider', // RM
    'assistant:catalogue:publier', // responsable de publication à nommer (action A-10)
  ],

  // C5 : AD-32.
  publie: [
    'assistant.mandat.delivre@1',
    'assistant.mandat.revoque@1',
    'assistant.execution.demandee@1',
    'assistant.execution.annulee@1',
    'assistant.arbitrage.decide@1',
    'ia.execution.terminee@1', // republié pour la règle demandeuse (AD-45)
    'assistant.action.demandee', // ordre vers le module exécutant ; topic UNIQUE sortant (assistant AD-10) ; `assistant` seul le produit
    'instance.journal@1', // [proposition, C13/journal d'instance] export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1',
    'etat-publie.changed.reel@1',
    'ia.execution.demandee@1', // demande d'une règle d'`automatisations`, par le contrat public d'`ia`
    'ia.proposition.statut.change@1',
    'ia.capacite.changed@1',
    // Publiés par les modules exécutants sous leur propre manifeste ; `executionId` et `origine` (`COPILOT` ou
    // `REGLE:<id>`). Un fait par module exécutant à mesure qu'il publie un type d'action :
    // Les faits « action exécutée / annulée » sont publiés par CHAQUE module exécutant et ajoutés ici
    // nommément quand ce module déclare un type d'action au catalogue (aucun joker : spine distributeur AD-20).
    // Hors bus : `types-action@AAAA.N`, objets et effets interdits (`platform-catalog-service`, AD-46).
  ],

  profilCompose: 'assistant',
  prerequis: [],

  verifications: [
    {
      code: 'copilot-lecture-seule',
      route: 'POST /api/v1/instance/assistant/{organisationId}/verifications/copilot-lecture-seule',
      critere: "Le Copilot ne crée, ne modifie, n'envoie et ne supprime rien : 🟢 ; sinon 🔴 avec l'écriture trouvée (FR-131, AD-29).",
    },
    {
      code: 'type-engageant-non-autonome',
      route: 'POST /api/v1/instance/assistant/{organisationId}/verifications/type-engageant-non-autonome',
      critere: 'Un type engageant ou irréversible en `AUTO` ou `AUTO_SOUS_MANDAT` est refusé (`TYPE_NON_AUTONOMISABLE`) : 🟢 ; sinon 🔴 (FR-134).',
    },
    {
      code: 'mandat-plafonne',
      route: 'POST /api/v1/instance/assistant/{organisationId}/verifications/mandat-plafonne',
      critere: 'Une exécution au-delà du plafond cumulé du mandat est refusée : 🟢 ; sinon 🔴 avec le montant (FR-135, AD-45).',
    },
    {
      code: 'droits-de-l-utilisateur',
      route: 'POST /api/v1/instance/assistant/{organisationId}/verifications/droits-de-l-utilisateur',
      critere: "Le Copilot ne rend rien que l'utilisateur ne puisse voir : 🟢 ; sinon 🔴 avec la donnée (FR-132).",
    },
    {
      code: 'assurance-sans-auto',
      route: 'POST /api/v1/instance/assistant/{organisationId}/verifications/assurance-sans-auto',
      critere: "L'activation du mode `AUTO` pour l'assurance est refusée (`MODE_NON_PERMIS_ASSURANCE`) : 🟢 ; sinon 🔴 (FR-127).",
    },
  ],

  // C9 : désinstaller ne supprime rien ; les exécutions en cours sont annulées par compensation ou terminées avant
  // l'arrêt (FR-136) ; `ia` continue de servir les propositions.
  avertissementDesinstallation: 'Plus aucune action autonome ne sera exécutée ; les mandats sont suspendus.',

  // C12 : un type d'action ajouté au catalogue est lu comme inconnu par la version précédente, qui le refuse.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/assistant/migrer', // [proposition]
  interrupteurs: ['copilot', 'agents-sous-mandat', 'mode-auto'], // `mode-auto` jamais pour un type engageant

  routesLectureSeule: [
    'GET /api/v1/assistant/{organisationId}/mandats', // [proposition]
    'GET /api/v1/assistant/{organisationId}/executions', // [proposition]
    'GET /api/v1/instance/assistant/{organisationId}/export',
  ],

  routesInstance: {
    export: 'GET /api/v1/instance/assistant/{organisationId}/export',
    import: 'POST /api/v1/instance/assistant/{organisationId}/import',
    effacement: 'POST /api/v1/instance/assistant/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/assistant/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  objetsDeReprise: [],
  domainesEchange: [],

  // C11 : familles servies `copilot` et, pour les agents, `redaction`, `automatisation`, `brief-priorites`. Le
  // Copilot est servi au premier jour pour les quatre logiciels (D12), en texte. Aucun apprentissage commun propre
  // (`finalites: []`) ; compte de service dédié sous la garde du registre des consentements.
  ia: {
    capacites: [
      'cabinet/copilot@1',
      'distributeur/copilot@1',
      'microfinance/copilot@1',
      'assurance/copilot@1',
    ],
    finalites: [],
  },
} as const;
