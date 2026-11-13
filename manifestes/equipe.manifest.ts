// Manifeste M21 — Équipes et performance (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Sources (dans cet ordre) : architecture/architecture-distributeur-2026-11-13 (AD-1, AD-15, AD-19, AD-20, AD-27,
// AD-31) ; spine de la microfinance (AD-9, AD-14) ; PRD distributeur §6.3 (FR-122 → FR-128) et annexe A.10 ;
// PRD microfinance §7.3 (FR-240 → FR-243) et annexe A.12 (écarts IMF) ; CONTRAT-DE-MODULE-2026-11-09.md.
// Le code `equipe` existe au catalogue, déprécié : à réactiver.
//
// Hors manifeste, pour mémoire :
// - Offre : bundle distributeur « Croissance & Équipes » ; microfinance « Croissance & Opérations (Équipes &
//   Réseau) » (manifestes-a-produire.md, M21). Deux verticales ; le contrat est UN pour les deux (AD-15).
// - Gate : `EQUIPE_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Service porteur : `prospera-pilotage-service` :3415 (AD-1), sous `src/modules/equipe/`. Les quatre modules du
//   service (`dashboard`, `equipe`, `controle-gestion`, `finance-transactions`) ne partagent aucune collection
//   qu'ils écrivent tous (contrat §4).
// - Écrans : module d'écran `equipe` dans `prospera-app` (C8), `src/modules/equipe/`, tous les écrans par Dev B.
//   `/equipe` (`EquipeView` : classement et fiches, tableau comparatif, coaching ; objectifs chez l'IMF),
//   `MatricePostesPanel`, fiche agent, saisie des objectifs (à créer : la démo n'a aucun écran pour fixer un
//   objectif, FR-241). Entrées de menu : « Équipe » (`equipe:indicateur:consulter`), « Objectifs »
//   (`equipe:objectif:fixer`). Le superviseur et le responsable des ventes ne voient plus la « Vue DG » (FR-186).
//   « Valider » et « Refuser » une demande de remise appartiennent à `commande` (`commande:remise:valider`) :
//   l'écran « Validations » l'appelle, ce module ne la possède pas. Défis, badges et séries de la démo : « bientôt ».
// - Rôles proposés (annexe B.2, à confirmer avec les rôles du vertical) :
//   · `equipe:indicateur:consulter` : DG, DC, RESP_VENTES, SUPERVISEUR, CONTROLE_GESTION ; chaque rôle lit son
//     propre KPI de poste sans ce droit (IMF : RA, RCC, ROC, DG) ;
//   · `equipe:classement:consulter` : DG, DC, RESP_VENTES, SUPERVISEUR ;
//   · `equipe:coaching:gerer` : SUPERVISEUR, RESP_VENTES, DC ;
//   · `equipe:remuneration:consulter` : DG, DC, DAF, et l'agent pour lui-même ; JAMAIS SUPERVISEUR ni
//     CONTROLE_GESTION (FR-126, FR-8) ;
//   · `equipe:objectif:fixer` : RA, RCC, ROC, DG chez l'IMF ; chez le distributeur, le supérieur de l'agent.
// - Cloisonnement (C2) : par `organisationId` et par portée lue dans `reseau.portee.changed@1` (le responsable
//   des ventes lit sa région, le superviseur son équipe, le RA son agence, le ROC et le DG le réseau). Un score
//   d'agent n'est jamais agrégé hors du périmètre du lecteur (FR-6) ; repli sur toute l'équipe INTERDIT quand le
//   périmètre est vide (défaut de la démo, non repris).
// - Données possédées (C3) : registre des KPI de poste (code, libellé, poids dont la somme vaut 100, objectif,
//   sens, source, plafond d'atteinte), objectifs fixés par le supérieur (agent ou poste, KPI, période, valeur,
//   `fixe_par`), scores et statuts calculés, classements, matrice des postes, benchmarks, plans de coaching
//   (`PLANIFIE`, `FAIT`, `ABANDONNE`), barème de commission et de prime (PRIVÉ, FR-128), typologie salarié /
//   indépendant (copie de `reseau.commercial`), et chez l'IMF : objectifs par agence, écarts projetés, statuts
//   d'objectif. Aucune donnée d'argent d'un autre module n'est copiée : les KPI se calculent par fait ou par route
//   de lecture (FR-15, FR-122).
// - Paramètres (C6, des données, jamais du code) : définition des KPI et poids par poste, barèmes de classement,
//   matrice des postes, statuts 90 / 75 / 60 (EXCELLENT, BON, À SURVEILLER, CRITIQUE, FR-123), plafond d'atteinte
//   130 %, date limite de fixation des objectifs (le 5 du mois), niveaux d'écart (10 %, 25 %), voisinage
//   d'agences (± 20 % d'encours), barème de commission (par type de contrat) et de prime.
// - Règle de calcul de la rémunération (FR-128, décision du PO du 2026-11-12) : un SALARIÉ est commissionné sur
//   l'ENCAISSÉ (`HT de la facture × part encaissée`, jamais le TTC, spine AD-11 « base de toute commission ») ;
//   un FREELANCE est commissionné par le module `freelance` (HT au prix société, acquise à la facturation) : ce
//   module-ci ne calcule PAS la commission d'un freelance. Le score d'un freelance vu de la société ne dépend
//   JAMAIS de sa marge (FR-122, FR-8) ; ce module ne consomme aucun topic de la famille freelance (AD-31) ; le test
//   de fuite parcourt aussi ses lectures. Chez l'IMF : pas de barème de commission ni de rémunération calculée
//   (FR-242, décision F8) ; seule la prime d'objectifs de l'agent lui est visible.
// - Un KPI sans source installée rend `NON_INSTALLE` et le score devient « partiel, calculé sur N KPI sur M »
//   (FR-123) ; jamais 0.
// - Vocabulaire (AD-15) : agent de terrain salarié ou indépendant, demande de dérogation, superviseur, zone : le
//   libellé vient du tableau de la verticale (distributeur : commercial, remise, zone commerciale ; IMF : agent
//   de crédit, dérogation de crédit, agence ; assurance : agent, courtier, dérogation de souscription). Les rôles
//   propres à l'IMF et leurs KPI remplissent le MÊME registre (FR-122).
// - Démarrer seul (C10) : `profiles: ["equipe"]` ; socle + `reseau`.
// - Migrations (C12) : `SANS_PERTE`. Un KPI ajouté est lu comme inconnu par la version précédente.

export const MANIFESTE_EQUIPE = {
  code: 'equipe',
  version: '1.0.0',

  // C1, annexes A.10 (distributeur) et A.12 (IMF) : `reseau` seul, un module des deux verticales.
  depends: [
    {
      code: 'reseau',
      raison: 'Les équipes, leurs agents de terrain, leurs zones et leur portée viennent du réseau.',
    },
  ],

  // C4 : chaque source absente rend ses indicateurs `NON_INSTALLE` (score partiel), jamais 0 ni absent ; un test par
  // dépendance de `enrichiPar`. L'annexe A.10 liste six modules, l'annexe IMF A.12 sept ; les autres viennent du
  // tableau des KPI de poste (FR-122, « chaque module fournit la requête de ses KPI ») [proposition, à confirmer
  // par la story de consommation].
  // Distributeur (A.10) :
  // - pdv : points de vente actifs, nouveaux, à risque de départ (KPI du superviseur, du freelance, du DC) ;
  // - commande : commandes prises, CA généré, panier moyen ;
  // - terrain : visites par jour, couverture, transformation visite → commande ;
  // - conquete-objectifs : objectifs et quotas par zone, ouvertures à M+3 (PROSPECTION) ;
  // - freelance : classement freelance = `NON_INSTALLE` s'il est absent ;
  // - facturation : CA facturé, base de la commission d'un salarié.
  // Autres KPI de poste (FR-122) [proposition] :
  // - stock, entrepot, approvisionnement : taux de service, ruptures, rotation, préparation, réapprovisionnement
  //   dans le délai (RESP_STOCK, GEST_ENTREPOT) ;
  // - paiement, recouvrement : encaissé (base de la commission d'un salarié), taux d'encaissement, DSO ;
  // - finance-transactions, controle-gestion : taux de rapprochement, suspens, écart budget / réel (COMPTABLE,
  //   CONTROLE_GESTION, DAF) ;
  // - marketing : ROI des campagnes, points de vente touchés (MARKETING).
  // Microfinance (A.12) : credit (KPI du chargé de crédit et du ROC), collecte (KPI du collecteur),
  // microfinance (clients, prospects), coeur-sfd (prêts et retards lus du cœur), risque-par (prévision du PAR par
  // zone, FR-243 : lue, jamais recalculée ici), recouvrement, marketing.
  enrichiPar: [
    'pdv',
    'commande',
    'terrain',
    'conquete-objectifs',
    'freelance',
    'facturation',
    'stock',
    'entrepot',
    'approvisionnement',
    'paiement',
    'recouvrement',
    'finance-transactions',
    'controle-gestion',
    'marketing',
    'credit',
    'collecte',
    'microfinance',
    'coeur-sfd',
    'risque-par',
  ],

  // Aucun numéro de compte ici : le module ne passe aucune écriture.
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (le code `equipe` est sans tiret). Chaque droit demande
  // une PR `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'equipe:indicateur:consulter', // KPI de poste, scores, tableau comparatif sous portée (FR-122, FR-123)
    'equipe:classement:consulter', // classement, matrice des postes (FR-124)
    'equipe:coaching:gerer', // planifier, suivre, abandonner un coaching (FR-125)
    // Annexe B.2 (nouveau, FR-8) et annexe IMF A.12 : la rémunération individuelle est privée.
    'equipe:remuneration:consulter', // l'agent pour lui seul par défaut ; DG, DC, DAF ; jamais SUPERVISEUR ni CONTROLE_GESTION
    // Annexe IMF A.12 : fixer un objectif par agence et par agent (FR-241).
    'equipe:objectif:fixer',
    // Proposition (FR-128 : « un DG ou un rôle habilité peut saisir le barème » ; aucun droit nommé par l'annexe
    // A.10) : saisir et modifier le barème de commission et de prime, tracé (auteur, date, ancienne valeur). Sans ce
    // droit, la saisie du barème n'aurait pas de porte. À confirmer par le PO avec l'annexe B.2.
    'equipe:bareme:fixer',
  ],

  // C5 : faits publiés et consommés. Noms du catalogue de la spine (AD-20) ; les ajouts de l'annexe IMF A.12 qui
  // ne figurent dans aucun catalogue sont marqués [proposition] (« un nom absent du tableau ne se publie ni ne se
  // consomme » : PR d'ajout à porter).
  publie: [
    'equipe.coaching.changed@1', // état absolu d'un plan de coaching (spine AD-20, annexe A.10)
    // Annexe IMF A.12, absents du catalogue de la spine du distributeur et de celle de la microfinance :
    'equipe.objectif.fixe@1', // [proposition, IMF A.12] objectif fixé par un supérieur (FR-241)
    'equipe.ecart.change@1', // [proposition, IMF A.12] niveau d'écart à l'objectif ; alimente les alertes de `dashboard`
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] actes de barème, export, effacement ; aucune rémunération individuelle
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'reseau.commercial.changed@1', // agents, type de contrat, affectations (annexe A.10)
    'reseau.portee.changed@1', // [proposition, C2 : portée de zone et d'agence ; annexe IMF A.12]
    'commande.commande.validee@1', // commandes prises ; SANS prix ni identité de freelance (spine AD-20)
    'commande.commande.chiffree@1', // [proposition, spine AD-20 : montants, prix société] CA généré
    'facturation.facture.emise@1', // CA facturé, base d'une commission de salarié ; JAMAIS une facture de freelance (AD-31)
    'paiement.creance.changed@1', // [proposition, FR-128 : part encaissée d'une facture, base de la commission d'un salarié ; échéance pour le KPI « règlement à l'échéance »]
    'terrain.visite.cloturee@1', // visites réalisées (annexe A.10) ; l'annexe IMF écrit `terrain.visite.terminee@1` : le catalogue dit `cloturee`
    'conquete-objectifs.objectif.changed@1', // objectifs et quotas par zone (annexe A.10)
    'pdv.point-de-vente.changed@1', // [proposition, `pdv` figure dans `enrichiPar` de l'annexe A.10 sans fait en C5] points de vente actifs, à risque
    'recouvrement.dossier.changed@1', // [proposition, KPI du RECOUVREMENT et du superviseur] ; l'annexe IMF écrit `recouvrement.dossier.change@1`
    'stock.alerte.changed@1', // [proposition, KPI RESP_STOCK : ruptures]
    'credit.dossier.changed@1', // [IMF A.12] KPI du chargé de crédit
    'collecte.remboursement.saisi@1', // [IMF A.12] KPI du collecteur
    'coeur-sfd.pret.changed@1', // [IMF A.12] prêts et retards lus du cœur
    // Famille freelance (`facturation.facture-freelance.emise@1`, `paiement.creance-freelance.changed@1`, …) :
    // JAMAIS consommée ici (AD-31). Le « CA société généré » d'un freelance vient des faits au prix société.
  ],

  // C10 : profil de compose avec le nom du code.
  profilCompose: 'equipe',

  // C13, point 1 : `reseau` est la dépendance dure de `depends` (annexes A.10 et A.12 : « Prérequis : `reseau` ») ;
  // aucun prérequis extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Noms de routes
  // proposés (convention commune de l'annexe A : `verifications/<code>`).
  verifications: [
    {
      code: 'agents-lus',
      route: 'POST /api/v1/instance/equipe/{organisationId}/verifications/agents-lus',
      critere:
        "Au moins 1 agent de terrain et 1 zone (ou agence) lus de `reseau` : 🟢 ; 0 : 🔴 (annexe A.10 : `commerciaux-lus`, annexe IMF A.12 : `agents-lus` ; nom neutre retenu, voir le rapport).",
    },
    {
      code: 'poids-valides',
      route: 'POST /api/v1/instance/equipe/{organisationId}/verifications/poids-valides',
      critere:
        "Poids des KPI de chaque poste du jeu d'essai : somme = 100 pour 100 % des postes 🟢 ; un seul poste hors 100 🔴 avec son code (annexe IMF A.12, FR-122).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.10, repris par l'annexe IMF A.12).
  // Rien n'est supprimé ; coachings et objectifs conservés.
  avertissementDesinstallation: 'Les classements ne seront plus calculés.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/equipe/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // Annexes A.10 et IMF A.12 : `classement-public-equipe` (classement visible de toute l'équipe ; fermé tant que le
  // PO ne l'ouvre pas) et `projection-fin-de-mois` (projection de l'écart à l'objectif, FR-241). Comportement
  // seulement, jamais la forme des données.
  interrupteurs: ['classement-public-equipe', 'projection-fin-de-mois'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexes A.10 et A.12 : consultation, export). Toute
  // écriture rend 403 `ABONNEMENT_EXPIRE`. Noms de routes proposés, figés par l'épic du module.
  routesLectureSeule: [
    'GET /api/v1/instance/equipe/{organisationId}/export',
    'GET /api/v1/equipe/indicateurs', // [proposition] KPI et scores sous portée
    'GET /api/v1/equipe/classement', // [proposition]
    'GET /api/v1/equipe/matrice-des-postes', // [proposition]
    'GET /api/v1/equipe/coachings', // [proposition]
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/equipe/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/equipe/{organisationId}/export', // sans rémunération individuelle hors du droit `equipe:remuneration:consulter`
    import: 'POST /api/v1/instance/equipe/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/equipe/{organisationId}/effacement', // tracé, avec certificat ; les agents sont des personnes
    sante: 'GET /api/v1/instance/equipe/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : un module sans objet repris déclare `[]`.
  // Les agents sont repris par `reseau` (`reseau.commercial@1`) ; les KPI se recalculent.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : vide en février.
  domainesEchange: [],

  // C11 : capacités de l'IA commune CONSOMMÉES (annexe A.10, union avec l'annexe IMF A.12), demandées par
  // `PropositionPort` (spine AD-19, microfinance AD-14) ; le module n'embarque aucun modèle et ne code aucune règle de
  // score. Noms proposés. Origine `REGLE` ou `MODELE` affichée avec version et date ; une règle s'appelle « règle »
  // (le coaching à points de FR-125 est la règle de base sans modèle). Aucun agent n'est classé ni jugé par l'IA
  // seule ; un écart à une recommandation exige un motif. « Recommandation de prix client (freelance) » EXCLUE
  // (FR-C29) : le prix et la marge d'un freelance ne sont jamais une entrée d'une Proposition de la société
  // (AD-19). La prévision du PAR par zone vient de `risque-par` (module Risque de l'IA commune), lue ici. Chez
  // l'IMF le moteur tourne dans l'instance locale ; seuls des écarts anonymisés sortent, avec consentement.
  ia: {
    modeles: ['ecart-de-performance', 'coaching-cible', 'prevision-par-zone', 'benchmark-agences'],
    finalites: ['coaching-individuel', 'benchmark-bonnes-pratiques', 'prevision-du-risque-par-zone'],
  },
} as const;
