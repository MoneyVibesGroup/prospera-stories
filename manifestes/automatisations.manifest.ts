// Manifeste M26 — Automatisations par règles (format du contrat de module, clause C1).
// Écrit le 2026-11-14. Source : PRD de l'IA commune (prds/prd-ia-commune-2026-11-13/prd.md), annexe A.3 ; spine de
// l'IA commune (architecture/architecture-ia-commune-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE : AD-30
// (grammaire fermée, un seul moteur de règles, mode le plus strict par défaut), AD-32 (contrats nommés), AD-45
// (une exécution, un propriétaire, un compteur : `assistant`) ; PRD distributeur (centre de règles, EPIC-222 →
// EPIC-244) ; manifestes-a-produire.md, ligne M26. Question ouverte Q-1 de la spine : le code M26 est-il gardé ?
//
// Service porteur : `prospera-ia-service` (:3417), module `automatisations`. Dépend DUREMENT de `ia` ; ne dépend
// PAS de `assistant` (`automatisations` demande, `assistant` exécute) mais, sans lui, toute règle est `SUGGESTION`
// ou `VALIDATION` seulement : aucun `AUTO` sans propriétaire d'exécution (AD-30, AD-45).
// Propriétaire du manifeste : Dev B.
//
// Hors manifeste, pour mémoire :
// - Écrans : `prospera-app/src/modules/automatisations/` (C8) : `/automatisations` (éditeur à grammaire fermée,
//   aucun code libre), `/automatisations/arbitrage` (décision groupée), `/automatisations/historique`.
// - Gate : `AUTOMATISATIONS_NOT_ENTITLED`. Une règle tourne avec le droit DU RESPONSABLE ; elle s'arrête et notifie
//   s'il le perd. Aucun modèle de langage n'évalue une condition (`GRAMMAIRE_FERMEE`).
// - Paramètres (C6) : `ia.arbitrage.plafond_lot` (25 par défaut, 100 au plus), `ia.agent.annulees_pct_max`, plus les
//   paramètres propres à chaque règle, déclarés par le client.
// - Modes : `SUGGESTION`, `VALIDATION`, `AUTO`, `AUTO_SOUS_MANDAT` ; le plus strict est le défaut. Assurance :
//   `AUTO` refusé (`MODE_NON_PERMIS_ASSURANCE`). Un type engageant n'est jamais en `AUTO` (`TYPE_NON_AUTONOMISABLE`).
// - Écart de l'annexe A.3 : elle écrit `automatisations.execution.demandee@1` ; la spine (AD-32, AD-45) retient
//   `ia.execution.demandee@1`, déposé par le contrat public d'`ia`, que `assistant` consomme. La spine gagne.

export const MANIFESTE_AUTOMATISATIONS = {
  code: 'automatisations',
  version: '1.0.0',

  depends: [
    {
      code: 'ia',
      raison: "Les règles proposent par le port unique et inscrivent leurs actions au registre de l'IA.",
    },
  ],

  // C4 : un module exécutant absent : l'action n'est pas proposée dans l'éditeur de règles. `assistant` est le
  // propriétaire d'exécution : sans lui, `SUGGESTION` et `VALIDATION` seulement.
  enrichiPar: ['assistant'],

  referentielFamilies: [],

  droits: [
    'automatisations:regle:ecrire', // RM
    'automatisations:regle:activer', // RM ; `AUTO` pour les seuls types qui le permettent
    'automatisations:arbitrage:decider', // RM
    'automatisations:execution:annuler', // RM
  ],

  publie: [
    'automatisations.regle.changed@1', // état absolu d'une règle : déclencheur, conditions, action, mode
    'ia.execution.demandee@1', // AD-45 : demande d'exécution déposée par le contrat public d'`ia` ; `automatisations` ne publie JAMAIS `assistant.action.demandee`
    'instance.journal@1', // [proposition, C13/journal d'instance] export, effacement, journal des déclenchements
  ],
  consomme: [
    'etat-publie.changed.essai@1',
    'etat-publie.changed.reel@1',
    'ia.execution.terminee@1', // republié par `assistant` pour la règle demandeuse
    'ia.proposition.statut.change@1',
    'ia.capacite.changed@1',
    // Faits des modules qui déclenchent les règles (`<module>.<objet>.<evenement>@1`), choisis par le client dans
    // l'éditeur, parmi les faits publiés des modules installés ; aucun nom n'est consommé hors catalogue.
    // Aucun joker : chaque fait déclencheur est ajouté nommément quand une règle d'automatisation le
    // déclare dans son pack (liste fermée, validée à l'installation).
  ],

  profilCompose: 'automatisations',
  prerequis: [],

  verifications: [
    {
      code: 'grammaire-fermee',
      route: 'POST /api/v1/instance/automatisations/{organisationId}/verifications/grammaire-fermee',
      critere: 'Une règle contenant du code libre est refusée (`GRAMMAIRE_FERMEE`) : 🟢 ; sinon 🔴 (FR-127, AD-30).',
    },
    {
      code: 'mode-strict-par-defaut',
      route: 'POST /api/v1/instance/automatisations/{organisationId}/verifications/mode-strict-par-defaut',
      critere: 'Toute règle neuve est en `SUGGESTION` ou `VALIDATION` : 🟢 ; sinon 🔴 avec la règle (FR-127).',
    },
    {
      code: 'assurance-sans-auto',
      route: 'POST /api/v1/instance/automatisations/{organisationId}/verifications/assurance-sans-auto',
      critere: "Le mode `AUTO` est refusé en assurance (`MODE_NON_PERMIS_ASSURANCE`) : 🟢 ; sinon 🔴.",
    },
    {
      code: 'jamais-engageant-en-auto',
      route: 'POST /api/v1/instance/automatisations/{organisationId}/verifications/jamais-engageant-en-auto',
      critere: 'Un type engageant en `AUTO` est refusé (`TYPE_NON_AUTONOMISABLE`) : 🟢 ; sinon 🔴.',
    },
  ],

  // C9 : désinstaller SUSPEND toutes les règles et ne supprime rien.
  avertissementDesinstallation:
    'Plus aucune règle ne se déclenchera ; les exécutions en cours sont annulées par compensation.',

  // C12 : un mode ou un type ajouté est lu comme inconnu par la version précédente, qui refuse la règle.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/automatisations/migrer', // [proposition]
  interrupteurs: ['regles-en-auto', 'decision-groupee'],

  routesLectureSeule: [
    'GET /api/v1/automatisations/{organisationId}/regles', // [proposition]
    'GET /api/v1/automatisations/{organisationId}/historique', // [proposition]
    'GET /api/v1/instance/automatisations/{organisationId}/export',
  ],

  routesInstance: {
    export: 'GET /api/v1/instance/automatisations/{organisationId}/export',
    import: 'POST /api/v1/instance/automatisations/{organisationId}/import',
    effacement: 'POST /api/v1/instance/automatisations/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/automatisations/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  objetsDeReprise: [],
  domainesEchange: [],

  // C11 : famille `automatisation` ; aucun modèle de langage n'évalue une condition. Aucun apprentissage commun.
  ia: {
    capacites: [
      'cabinet/automatisation@1',
      'distributeur/automatisation@1',
      'microfinance/automatisation@1',
      'assurance/automatisation@1',
    ],
    finalites: [],
  },
} as const;
