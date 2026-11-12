// Manifeste M05 — Sinistres (format du contrat de module, clause C1, amendée le 2026-11-10, le 2026-11-11 et
// le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
//
// ⚠️ ÉCRIT DEPUIS LE CODE, SANS PRD (décision du PO, 2026-11-12 : « le PRD peut venir après et on va corriger
// le manifeste »). Relevé sur `prospera-assurance-service`, `origin/dev` @ e8cfc59 : modules `sinistres` et
// `etat-sinistres`. Ce qui n'est pas dans le code est marqué [À CONFIRMER] et sera tranché par le PRD de
// l'assurance. Références : épics epics-assurance-2026-08-27.md (EPIC-130 : STORY-515 sinistres et recours,
// STORY-516 cadences de règlement) ; spine architecture/architecture-assurance-service-2026-08-27 ; Code CIMA
// art. 415 (registre), art. 334-12 (provision brute) ; état modèle C10b ; spine de la Reprise (AD-2, AD-23).
//
// ⚡ Ce que le code est, et ce qu'il n'est pas.
// - C'est un REGISTRE réglementaire, pas un outil de gestion des sinistres. Les épics de l'assurance ont tranché
//   la Q1 : « on fait la comptabilité de l'assurance, pas l'assurance » ; la gestion au guichet (expertise,
//   workflow, pièces) relève du logiciel métier de l'assureur. Le code le dit : « ce module ENREGISTRE un
//   sinistre, il ne le GÈRE pas » (`EtatSinistre`).
// - Ce qu'il enregistre (art. 415) : la déclaration sur un contrat, deux chaînes d'évaluations jamais
//   compensées (SOMMES_A_PAYER, SOMMES_A_RECOUVRER, art. 334-12), les règlements (principal et frais
//   accessoires), recours et sauvetages, la terminaison et la réouverture. Tout est append-only ; l'état
//   (EN_COURS ou TERMINE) et la situation sont DÉRIVÉS, jamais stockés.
// - Il alimente les provisions pour sinistres à payer (cadences de règlement, STORY-516) et l'état C10b
//   (sinistres par exercice de survenance).
// - ⚠️ La ligne M05 de `manifestes-a-produire.md` dit « cycle DECLARE→CLOTURE ». Le code refuse ce mot :
//   le vocabulaire du régulateur est TERMINÉ (C10b), et « clos » qualifie déjà un exercice dans ce service
//   (`EXERCICE_CLOS`) ; deux refus seraient indiscernables (D-515-3). Le manifeste suit le code.
//
// ⚡ Questions au PO, à trancher avec le PRD de l'assurance :
// - [À CONFIRMER, Q1] Le code de module. La liste des manifestes et la Reprise (AD-23 : « sinistres ouverts et
//   clos → sinistres ») veulent un module `sinistres`. Le code n'en connaît pas : ses routes sont gardées par
//   l'entitlement `assurance` (`ASSURANCE_MODULE_CODE`), et `sinistres` n'est pas semé dans
//   platform-catalog-service. Recommandation : garder `sinistres` comme module à part, porté par le même
//   service, avec `depends: ['assurance']` (un sinistre se déclare sur un contrat). Coût : semer le code, et
//   que la gate des routes de sinistres lise l'entitlement `sinistres` (un second filtre dans la projection
//   d'entitlement). L'autre voie, fondre le registre dans `assurance`, ferait de la Reprise des sinistres une
//   cible `assurance`, comme les polices.
// - [À CONFIRMER, Q2] La gestion des sinistres (déclaration au guichet, expertise, pièces, workflow) : hors
//   périmètre (Q1 des épics), ou à construire ? L'offre la place « phases 1-2 » de l'offre unique.
//
// Hors manifeste, pour mémoire :
// - Service porteur : `prospera-assurance-service` (existant), à côté de `contrats` (polices, module
//   `assurance`), `provisions`, `provisions-techniques`, `reassurance`, `referentiel`.
// - Gate actuelle (code) : JWT → `emailVerified` → KYC `APPROVED` → entitlement `assurance` → référentiel du
//   dossier habilité (`REFERENTIEL_NON_HABILITE`), puis portée de dossier (`@RequiresDossierScope`, hors
//   portée = 404). Rôles : TENANT_ADMIN et TENANT_USER, sans droit fin.
// - Écrans : module d'écran `sinistres` dans `prospera-app` (C8), tous les écrans par Dev B ; aucun écran
//   n'existe aujourd'hui.
// - C11 : sans objet. Aucun calcul de probabilité ni score ; les cadences de règlement sont des statistiques
//   du registre (STORY-516).
// - Rôles proposés [À CONFIRMER avec le PRD] : gestionnaire sinistres = consulter, déclarer, évaluer ;
//   comptable = + enregistrer les règlements ; responsable sinistres = + terminer et rouvrir.

export const MANIFESTE_SINISTRES = {
  code: 'sinistres', // [À CONFIRMER, Q1] : le code n'existe ni au catalogue ni dans la gate du service
  version: '1.0.0',

  // C1 : un sinistre se déclare sur un contrat (`contratId` obligatoire), qui donne sa catégorie Vie ou
  // Non-Vie ; les contrats sont le module `assurance` (polices, décision du PO du 2026-11-12). Le référentiel
  // CIMA du dossier est exigé par la gate (`@RequiresReferentielDuDossier`).
  depends: [
    {
      code: 'assurance',
      raison:
        "Un sinistre se déclare sur un contrat (police) du module assurance, qui en donne la catégorie Vie ou Non-Vie ; sans contrat, aucune déclaration n'est recevable.",
    },
  ],

  // C4 : aucun module optionnel aujourd'hui. Les provisions et l'état C10b lisent le registre dans le même
  // service ; ce sont des consommateurs, pas des sources.
  enrichiPar: [],

  // Le référentiel CIMA est exigé par la gate, mais il est porté par le module `assurance` (familles déjà
  // semées : `cima-assurances`) ; ce module n'en ajoute aucune.
  referentielFamilies: [],

  // C7 : droits de tenant PROPOSÉS [À CONFIRMER avec le PRD]. Le code n'applique aujourd'hui que les rôles
  // TENANT_ADMIN et TENANT_USER ; ces droits dépendent de STORY-365 (intégrée au planning).
  droits: [
    'sinistres:sinistre:consulter', // registre, évaluations, mouvements, situation, tableau C10b
    'sinistres:sinistre:declarer', // déclaration sur un contrat (exercice de la déclaration OUVERT)
    'sinistres:evaluation:enregistrer', // nouvelle évaluation d'une des deux natures, chaînée, jamais compensée
    'sinistres:mouvement:enregistrer', // règlement, recours, sauvetage : de l'argent, date d'opération
    'sinistres:sinistre:terminer', // terminaison et réouverture, datées, tracées
  ],

  // C5 : le code ne publie RIEN aujourd'hui (« l'outbox reste inerte : aucun AC ne demande de publier un
  // événement inter-services », sinistres.module.ts). Le fait ci-dessous est PROPOSÉ pour la Reprise et pour
  // un consommateur futur ; il n'existe pas tant qu'une story ne le livre pas. L'imputation comptable
  // (comptes 6020, 6026, 6029) appartient à l'adaptateur de balance de l'assurance (spine assurance, AD-5),
  // dans le même service : pas besoin d'un fait pour elle.
  publie: [
    'sinistres.sinistre.changed@1', // [PROPOSÉ] état absolu : état dérivé, deux évaluations en vigueur, cumuls
    'instance.journal@1', // déclarations, terminaisons, réouvertures, export, effacement
  ],
  // Topics réellement consommés par le service (read-models, origin/dev), plus ceux du moteur.
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'kyc.status.changed', // existant
    'entitlement.changed', // existant ; filtre aujourd'hui `moduleCode == "assurance"` (voir Q1)
    'dossier.created', // existants : read-model des dossiers
    'dossier.updated',
    'dossier.exercice.ouvert', // existants : verrou d'écriture sur exercice clos (EXERCICE_CLOS)
    'dossier.exercice.clos',
    'dossier.exercice.rouvert',
  ],

  profilCompose: 'assurance', // même service et même profil de compose que le module assurance

  // C13, point 1 : rien d'extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  // Routes PROPOSÉES : elles n'existent pas dans le code.
  verifications: [
    {
      code: 'exercice-ouvert',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/exercice-ouvert',
      critere:
        "Au moins un exercice OUVERT dans le dossier de l'assureur : 🟢 ; sinon 🔴 « aucune déclaration ni aucun mouvement n'est recevable » (EXERCICE_INTROUVABLE, EXERCICE_CLOS).",
    },
    {
      code: 'referentiel-cima',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/referentiel-cima',
      critere:
        "Référentiel du dossier habilité (cima-assurances) : 🟢 ; sinon 🔴 « toutes les routes rendent REFERENTIEL_NON_HABILITE ».",
    },
    {
      code: 'sinistres-sans-evaluation',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/sinistres-sans-evaluation',
      critere:
        "Sinistres EN_COURS sans évaluation SOMMES_A_PAYER : 0 🟢 ; ≥ 1 🟠 avec leur nombre (la provision de ces sinistres ne peut pas être calculée, art. 334-12).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation.
  avertissementDesinstallation:
    "Les sinistres, leurs évaluations et leurs règlements restent enregistrés ; les provisions pour sinistres à payer et l'état C10b ne recevront plus de nouveaux sinistres.",

  // C12 : format lisible par la version précédente pendant 7 jours. Tout est append-only.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/sinistres/migrer', // [PROPOSÉE] route de service, idempotente, appelée par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE. Les routes métier EXISTENT dans le code (préfixe et
  // version du service devant) ; l'export est proposé.
  routesLectureSeule: [
    'GET /api/v1/instance/sinistres/{organisationId}/export',
    'GET /api/v1/dossiers/{dossierId}/assurance/sinistres',
    'GET /api/v1/dossiers/{dossierId}/assurance/sinistres/{sinistreId}',
    'GET /api/v1/dossiers/{dossierId}/assurance/sinistres/{sinistreId}/evaluations',
    'GET /api/v1/dossiers/{dossierId}/assurance/sinistres/{sinistreId}/mouvements',
    'GET /api/v1/dossiers/{dossierId}/assurance/sinistres/{sinistreId}/situation', // dérivée, recalculée à chaque lecture
    'GET /api/v1/dossiers/{dossierId}/assurance/sinistres-par-exercice-de-survenance', // tableau de l'état C10b
  ],

  // C13, point 7 : routes d'instance PROPOSÉES (aucune n'existe dans le code).
  routesInstance: {
    export: 'GET /api/v1/instance/sinistres/{organisationId}/export',
    import: 'POST /api/v1/instance/sinistres/{organisationId}/import',
    effacement: 'POST /api/v1/instance/sinistres/{organisationId}/effacement', // [À CONFIRMER] un registre réglementaire s'efface-t-il ?
    sante: 'GET /api/v1/instance/sinistres/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2 et AD-23 : « Assurance — sinistres ouverts et clos
  // → sinistres »). Schémas dans prospera-plateforme/contrats/objets/sinistres/. Source de février : export
  // Excel de l'assureur (modèle de gabarit `export-assureur`). Ordre : contrat (assurance) → sinistre →
  // évaluation et mouvement.
  // - sinistre : référence, contrat (référence vers le contrat du module assurance ; nom de l'objet fixé par
  //   son manifeste), nature de l'événement, date de survenance, date de déclaration, devise. Régimes VIVANT
  //   (EN_COURS) et HISTORIQUE (TERMINE avant la reprise). Valeur de contrôle : état (etat). Doublons :
  //   référence.
  // - evaluation : nature (SOMMES_A_PAYER ou SOMMES_A_RECOUVRER), date, montant ; la dernière de chaque nature
  //   au moins. Jamais une estimation « nette de recours » : le gabarit qui n'a qu'une colonne la range en
  //   SOMMES_A_PAYER et laisse SOMMES_A_RECOUVRER vide. Valeur de contrôle : montant en vigueur par nature.
  // - mouvement : règlement (principal, frais accessoires), recours ou sauvetage, date d'opération. Argent :
  //   règle « écart nul ». Valeur de contrôle : cumul par type et par sinistre.
  // ⚠️ [À CONFIRMER, Q3] Le code refuse toute écriture datée dans un exercice CLOS (`EXERCICE_CLOS`). Or les
  // règlements des années passées tombent dans des exercices clos. Deux voies : (a) ne reprendre un à un que
  // les mouvements de l'exercice ouvert, et un cumul par exercice de survenance pour les années closes, que la
  // cible doit savoir recevoir ; (b) une exception nommée du verrou pour le point d'import, tant que le module
  // est EN_INSTALLATION. Recommandation : (a), qui ne touche pas le verrou ; l'état C10b compte les paiements
  // de l'exercice, pas ceux des années passées.
  objetsDeReprise: ['sinistres.sinistre@1', 'sinistres.evaluation@1', 'sinistres.mouvement@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : AUCUN domaine au v1. Connecteurs couvre Odoo
  // et les API d'IMF ; aucun adaptateur n'existe pour le logiciel métier d'un assureur, et février passe par
  // l'export Excel de la Reprise. Si un adaptateur arrive, le domaine des règlements sera un domaine d'argent
  // (`argent: true`, donc `controle: true`), ajouté en version mineure.
  domainesEchange: [],
} as const;
