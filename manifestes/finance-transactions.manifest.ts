// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M22 — Comptabilité et finance, transactions (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Sources (dans cet ordre) : architecture/architecture-distributeur-2026-11-13 (AD-1, AD-15, AD-19, AD-20, AD-27 ;
// §Hors périmètre : « la comptabilité de référence est hors février ; `finance-transactions` garde ses objets sans
// écrire de grand livre ») ; spines de la microfinance (AD-6, AD-14) et de l'assurance ; PRD distributeur §6.4
// (FR-129 → FR-141, FR-175, FR-176) et annexe A.11 ; PRD microfinance §7.6 (FR-252 → FR-254) et annexe A.14 ;
// CONTRAT-DE-MODULE-2026-11-09.md. Le code `finance-transactions` existe au catalogue.
//
// ⚠️ HORS PÉRIMÈTRE DE FÉVRIER (décision du PO du 2026-11-12 : « la comptabilité n'est pas considérée pour
// février » ; PRD microfinance : comptabilité non prioritaire, récit §3). CE QUI EST INSTALLÉ EN FÉVRIER : RIEN de
// ce module. Il n'entre ni dans la liste ★ ni dans l'installation de février, ni chez le distributeur ni chez
// l'IMF. Ce que février exige de la fonction « finance » vit AILLEURS : les ordres de paiement aux fournisseurs et
// le plafond de validation à deux personnes dans `paiement` (FR-209, FR-P65 à FR-P69) ; la Créance et le crédit du
// tiers dans `paiement` (FR-247, FR-248) ; la trésorerie lue du cœur chez l'IMF, par `coeur-sfd` et `dashboard`.
// Ce manifeste est écrit pour que le code, le contrat et les faits existent dès maintenant (catalogue, graphe de
// dépendances) ; ses exigences restent entières dans les PRD pour après. Tant que le module n'est pas livré, ses
// boutons (« Accorder », « Refuser », « Télédéclarer sur le portail OTR », export des écritures, sous-onglets de
// comptabilité de la démo) sont « bientôt », sans date, sans chiffre ni simulation (PRD distributeur FR-2) ; un
// test ouvre chaque sous-onglet et n'y trouve aucun nombre.
//
// ⚠️ LE PRODUIT NE PASSE PAS D'ÉCRITURES AU SENS GRAND LIVRE à ce jour (note M22 ; PRD distributeur §6.4) : pas de
// grand livre légal, pas de report à nouveau, pas de clôture légale, pas d'états financiers certifiés. Le
// périmètre du contrat est le rapprochement, la trésorerie et l'état du run de paiement ; les écritures
// générées de FR-129 à FR-131 et la balance « soumise » à `balance` (FR-131) sont des exigences DU PRD, absentes
// de la ligne C3 de l'annexe A.11 : voir l'écart noté au rapport. Chez l'IMF, le cœur tient la comptabilité
// officielle (FR-2) ; ce module n'exporte au mieux que des « écritures proposées » (FR-252).
//
// ⚠️ CODE À TIRET. `finance-transactions` ne passe pas le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`). Ses droits sont écrits dans la forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$`
// (amendement C7 du 2026-11-11). La story d'élargissement se livre AVANT LA SEMAINE 5 ; sans elle, CE MODULE NE
// PEUT PAS DÉCLARER UN SEUL DROIT (PRD distributeur, annexe A.17, point 1). Le profil de compose et les routes
// gardent le tiret ; seule la gate le remplace par `_` (`FINANCE_TRANSACTIONS_NOT_ENTITLED`).
//
// Hors manifeste, pour mémoire :
// - Offre : distributeur « Finance & Recouvrement » ; microfinance « Risque & Conformité (Finance & Comptabilité) » ;
//   assurance : offre unique (chaîne de règlement). Trois verticales ; UN code, UN contrat (AD-15).
// - Service porteur : `prospera-pilotage-service` :3415 (AD-1), sous `src/modules/finance-transactions/`
//   (l'annexe A.11 dit « service à créer [À CONFIRMER, M22] » : la spine l'a tranché). Le module écrit seul ses
//   collections ; il ne touche jamais la collection des Créances (propriété de `paiement`, AD-1).
// - Écrans : module d'écran `finance-transactions` dans `prospera-app` (C8), tous les écrans par Dev B.
//   `/comptabilite` (poste du COMPTABLE ; vue analytique en lecture seule pour les autres rôles),
//   `/pilotage-financier` (`PilotageDAFView` pour le DAF, `ComptabiliteDGView` pour le DG et le DC). Entrées de menu :
//   « Rapprochement » (`finance-transactions:rapprochement:effectuer`), « Trésorerie »
//   (`finance-transactions:tresorerie:consulter`), « Run fournisseurs » (`finance-transactions:run:consulter`).
//   Chez l'IMF : tableau Budget et Rentabilité dans le cockpit du DAF (FR-253), export des écritures proposées,
//   prévision de trésorerie ; « Payer » un fournisseur passe par les ordres de `paiement` (FR-209), jamais par ce
//   module.
// - Rôles proposés (annexe B.2, à confirmer avec les rôles du vertical) :
//   · `rapprochement:effectuer`, `suspens:traiter` : COMPTABLE (assurance : CPT) ;
//   · `tresorerie:consulter` : DG, DC, DAF ; · `run:consulter` : DG, DAF ;
//   · `ecriture:exporter`, `budget:saisir` : DAF (IMF : DAF réseau, CPT son agence, DG en lecture).
//   Préparer et valider un ordre de paiement exigent en plus les droits de `paiement` : DEUX droits, DEUX personnes
//   (FR-P66). La marge par facture reste cachée du contrôle de gestion et du superviseur (AD-1).
// - Cloisonnement (C2) : par `organisationId` et par rôle (droits financiers : DAF, comptable). Piste d'audit
//   `finance-transactions_audit` en ajout seul (AD-21) ; une écriture validée ne se modifie pas, elle se contre-passe ;
//   un budget publié ne change pas les périodes closes.
// - Données possédées (C3) : rapprochements d'un compte de trésorerie (banque, caisse, paiement mobile) ; suspens
//   (libellé, montant, ancienneté, sévérité CRITIQUE ou MODERE, action, statut) ; écritures de caisse des remises
//   d'espèces (la remise est un objet de `terrain`, sa validation un encaissement de `paiement`) ; prévision de
//   trésorerie à 7 jours avec provenance (FR-16) ; BFR ; état du run de paiement (JAMAIS l'ordre, qui est à
//   `paiement`). [Exigences du PRD hors de l'annexe C3, hors février : écritures générées équilibrées
//   (`ECRITURE_DESEQUILIBREE`, contre-passation), tâches de clôture, échéances déclaratives, demandes de crédit
//   client (Décision à trancher, FR-14) ; chez l'IMF : écritures PROPOSÉES à exporter vers le cœur, jamais
//   comptabilisées ici, et budget par agence et par poste, versionné (FR-253, décision du PO du 2026-11-13 : le
//   budget du DAF est une donnée de ce module, `controle-gestion` n'étant pas installé chez l'IMF).]
// - Paramètres (C6, des données, jamais du code) : plancher de trésorerie, horizon de prévision (7 jours), règles de
//   lettrage automatique (montant et référence), tolérance d'arrondi, référentiel comptable (plan de comptes,
//   journaux, taux : un paramètre de l'organisation, jamais du code ; la TVA est lue du paquet fiscal du pays) ;
//   chez l'IMF : plan comptable du cœur (correspondance des comptes), journal d'export, périodicité d'export,
//   plancher de liquidité.
// - Vocabulaire (AD-15), par verticale : référentiel (SYSCOHADA révisé ; plan comptable des SFD de l'UEMOA ; CIMA,
//   une amorce), compte client 411 (clients ; membres, encours de prêts ; assurés, primes à recevoir), plancher de
//   trésorerie (plancher ; ratio de liquidité ; marge de solvabilité, hors module). Distributeur seul : TVA sur
//   ventes et achats, BFR par stock, marge nette par canal (FR-139), décision de crédit client (FR-140), run
//   fournisseurs avec escompte (FR-141). Le libellé vient du tableau de la verticale.
// - Démarrer seul (C10) : `profiles: ["finance-transactions"]` ; socle + `paiement`.
// - Migrations (C12) : `SANS_PERTE`. Un budget publié ne change pas les périodes closes.

export const MANIFESTE_FINANCE_TRANSACTIONS = {
  code: 'finance-transactions',
  version: '1.0.0',

  // C1, annexes A.11 et IMF A.14 : `paiement` seul (le rapprochement repose sur les encaissements).
  depends: [
    {
      code: 'paiement',
      raison:
        'Le rapprochement et le suivi du run de paiement reposent sur les encaissements, les Créances et les ordres de paiement.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent ; un test par
  // dépendance de `enrichiPar`.
  // Annexe A.11 :
  // - facturation : lettrage du compte clients (411) = `NON_INSTALLE` ;
  // - approvisionnement : factures d'achat et run fournisseurs = `NON_INSTALLE` ;
  // - balance : écritures soumises et atelier de balance = `NON_INSTALLE` ;
  // - connecteurs : export comptable (plus tard, hors février).
  // Microfinance (A.14) :
  // - coeur-sfd : export des écritures proposées = `NON_INSTALLE` (le fichier reste téléchargeable) ; balance du
  //   cœur absente : résultat et rentabilité = « en attente des données du cœur » ; trésorerie lue du cœur ;
  // - risque-par : provisions proposées, perte attendue (lue, jamais recalculée ici) ;
  // - caisse : remises des collecteurs ;
  // - un budget non saisi : écart = « budget non saisi », jamais 0.
  // Autres liens [proposition] : terrain (remises d'espèces déclarées, FR-136) ; stock (valorisation pour le BFR,
  // FR-138) ; recouvrement (provision, FR-129) ; reprise sans objet.
  enrichiPar: [
    'facturation',
    'approvisionnement',
    'balance',
    'connecteurs',
    'coeur-sfd',
    'risque-par',
    'caisse',
    'terrain',
    'stock',
    'recouvrement',
  ],

  // Aucun numéro de compte ici : le référentiel comptable est un paramètre de l'organisation (C6), pas du code.
  referentielFamilies: [],

  // C7, forme ÉLARGIE (voir l'avertissement en tête). Annexe A.11 (distributeur) puis annexe IMF A.14. Chaque droit
  // demande en outre une PR `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'finance-transactions:rapprochement:effectuer', // lettrer, rapprocher un compte de trésorerie (FR-132, FR-175)
    'finance-transactions:tresorerie:consulter', // trésorerie à 7 jours, BFR (FR-137, FR-138)
    'finance-transactions:run:consulter', // état du run fournisseurs ; préparer et valider un ordre exige en plus `paiement:*`
    'finance-transactions:suspens:traiter', // mettre en suspens, traiter un suspens (FR-132)
    // Annexe IMF A.14 :
    'finance-transactions:ecriture:exporter', // exporter les écritures proposées vers le cœur (FR-252)
    'finance-transactions:budget:saisir', // saisir le budget du DAF par agence et par poste, versionné (FR-253)
    // Les droits propres aux exigences du PRD distributeur FR-129 → FR-135, FR-140, FR-141 (valider une écriture,
    // clore une période, décider d'un crédit client, geler un run) ne sont PAS nommés par l'annexe A.11 ; ils se
    // figeront à la reprise du module après février, avec l'annexe B.2.
  ],

  // C5 : faits publiés et consommés. Noms du catalogue de la spine (AD-20) ; ce qui n'y figure pas est marqué
  // [proposition] (« un nom absent du tableau ne se publie ni ne se consomme » : PR d'ajout à porter). Chaque fait
  // d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`.
  publie: [
    'finance-transactions.tresorerie.changed@1', // prévision à 7 jours, solde, plancher (spine AD-20, annexe A.11)
    'finance-transactions.rapprochement.effectue@1', // un rapprochement confirmé (spine AD-20, annexe A.11)
    'finance-transactions.ecriture.proposee@1', // [IMF A.14, absent du catalogue de la spine] écriture proposée au cœur, jamais comptabilisée
    'finance-transactions.budget.changed@1', // [IMF A.14, absent du catalogue de la spine] budget du DAF, version publiée ; lu par `dashboard`
    'finance-transactions.decision.changed@1', // [proposition, FR-14 et AD-20 « chaque module qui a des décisions en possède les siennes »] demande de crédit client ; lue par `dashboard` seul
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] export, effacement, actes de configuration
    'finance-transactions.realite.constatee@1', // [AD-14, spine IA] rattachement de lettrage confirmé ou rejeté par le comptable, anomalie comptable confirmée ou écartée à la clôture du mois, trésorerie réalisée à 7 jours contre la prévision (issue : RATTACHEMENT_CONFIRME, RATTACHEMENT_REJETE, ANOMALIE_CONFIRMEE, ANOMALIE_ECARTEE, TRESORERIE_DANS_LA_BANDE, TRESORERIE_HORS_BANDE ; `definitive` à la clôture du mois ou à 7 jours) ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'paiement.encaissement.valide', // topic existant de `paiement`, sans suffixe de version (annexe A.11)
    'paiement.encaissement.ecart.constate', // topic existant de `paiement` (annexe A.11)
    'paiement.creance.changed@1', // créances à rapprocher, DSO (annexe A.11)
    'approvisionnement.commande-fournisseur.changed@1', // dette fournisseurs, run (annexe A.11)
    // Propositions, hors de la ligne C5 de l'annexe A.11 (sans elles, chaque emplacement de `enrichiPar` n'a pas de
    // source) :
    'paiement.encaissement.changed@1', // [proposition] état absolu d'un encaissement (spine AD-20)
    'facturation.facture.emise@1', // [proposition, lettrage 411, FR-132]
    'facturation.avoir.emis@1', // [proposition, lettrage 411]
    'paiement.ordre-paiement.changed@1', // [proposition, ÉCART : aucun fait du catalogue ne porte l'ordre de paiement fournisseur (FR-209) ; la forme `paiement.ordre-<nature>.changed@1` est celle de `ordre-versement` et `ordre-decaissement`] état du run, jamais l'ordre lui-même
    'terrain.remise.declaree@1', // [proposition, FR-136 : remises d'espèces à rapprocher]
    'stock.valorisation.publiee@1', // [proposition, FR-138 : stock du BFR]
    // IMF (annexe A.14) :
    'coeur-sfd.balance.recue@1', // balance du cœur (résultat, rentabilité)
    'coeur-sfd.caisse-guichet.changed@1', // caisse du guichet lue du cœur (trésorerie)
    'risque-par.provision.proposee@1', // provisions à proposer en écriture (FR-252)
    'caisse.remise.constatee@1', // [IMF A.14, ABSENT du catalogue de la spine IMF, qui publie `caisse.fonds.changed@1`, `caisse.cloture.changed@1` et `collecte.remise.contresignee@1`] remises des collecteurs : nom à trancher avec `caisse`
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  profilCompose: 'finance-transactions',

  // C13, point 1 : `paiement` est la dépendance dure de `depends` (annexes A.11 et A.14 : « Prérequis : `paiement` ») ;
  // aucun prérequis extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Noms de routes
  // proposés (convention commune de l'annexe A : `verifications/<code>`).
  verifications: [
    {
      code: 'suspens-bornes',
      route: 'POST /api/v1/instance/finance-transactions/{organisationId}/verifications/suspens-bornes',
      critere:
        "Montant en suspens ≤ le seuil de l'organisation : 🟢 ; au-dessus : 🔴 avec le montant et le seuil (annexe A.11, C13).",
    },
    {
      code: 'ecritures-equilibrees',
      route: 'POST /api/v1/instance/finance-transactions/{organisationId}/verifications/ecritures-equilibrees',
      critere:
        "Chaque écriture proposée du jeu d'essai est équilibrée au franc près : 100 % 🟢 ; une seule déséquilibrée 🔴 `ECRITURE_DESEQUILIBREE` (annexe IMF A.14, C13).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.11). Rien n'est supprimé ; rapprochements,
  // budgets et écritures proposées conservés. Annexe IMF A.14 : « L'export des écritures cesse ; la comptabilité
  // reste dans le cœur. »
  avertissementDesinstallation:
    'Les rapprochements cessent ; les paiements restent chez le module paiement.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/finance-transactions/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // Annexe A.11 : `lettrage-automatique` (lettrage proposé par règles de montant et de référence ; un rapprochement
  // proposé est toujours confirmé par un humain en v1), `alerte-doublon`. Annexe IMF A.14 : `export-ecritures`.
  // Comportement seulement, jamais la forme des données.
  interrupteurs: ['lettrage-automatique', 'alerte-doublon', 'export-ecritures'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexes A.11 et A.14 : consultation, export). Toute
  // écriture rend 403 `ABONNEMENT_EXPIRE`. Noms de routes proposés, figés par l'épic du module.
  routesLectureSeule: [
    'GET /api/v1/instance/finance-transactions/{organisationId}/export',
    'GET /api/v1/finance-transactions/rapprochements', // [proposition]
    'GET /api/v1/finance-transactions/suspens', // [proposition]
    'GET /api/v1/finance-transactions/tresorerie', // [proposition]
    'GET /api/v1/finance-transactions/run', // [proposition] état du run
    'GET /api/v1/finance-transactions/budgets', // [proposition, IMF]
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/finance-transactions/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/finance-transactions/{organisationId}/export',
    import: 'POST /api/v1/instance/finance-transactions/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/finance-transactions/{organisationId}/effacement', // tracé, avec certificat ; sous réserve de la conservation comptable
    sante: 'GET /api/v1/instance/finance-transactions/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : aucun objet repris (annexes A.11 et A.14). Le solde
  // d'ouverture d'un client se reprend par `facturation.facture-ouverte` ; la comptabilité n'est pas reprise.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : `[]` en février pour le distributeur (annexe A.11 ;
  // Connecteurs est hors février). L'annexe IMF A.14 déclare `finance-transactions.ecritures` « pour plus tard »
  // (vrai connecteur hors février, décision A9) : même régime que `paiement.creances`, domaine déclaré mais inactif
  // tant que `connecteurs` n'est pas installé. Forme objet des manifestes voisins ; code, objet, niveau et clé de
  // libellé sont des propositions. Domaine d'argent : `controle: true` (spine de Connecteurs, point d'écriture
  // unique) ; Prospera PROPOSE, le cœur comptabilise.
  domainesEchange: [
    {
      code: 'finance-transactions.ecritures', // [proposition] l'annexe A.14 donne ce nom
      objets: ['finance-transactions.ecriture@1'], // [proposition]
      sorte: 'MOUVEMENT', // [proposition]
      argent: true, // [proposition] écriture proposée = montants ; le cœur reste le comptable
      controle: true, // valeur de contrôle : montant en unités mineures, devise, compte, référence de la pièce
      niveauParDefaut: 'NUIT', // [proposition] fréquences par défaut de l'annexe C de la microfinance : 5 min (API seulement), heure, nuit
      cleLibelleAction: 'finance-transactions.echange.ecritures', // [proposition]
      publie: ['finance-transactions.ecriture.proposee@1'],
    },
  ],

  // C11 : capacités de l'IA commune CONSOMMÉES (annexe A.11, union avec l'annexe IMF A.14), demandées par
  // `PropositionPort` (spine AD-19, microfinance AD-14) ; le module n'embarque aucun modèle. Noms proposés.
  // Un chiffre financier affiché ne vient JAMAIS d'un modèle (AD-19) : la prévision de trésorerie porte sa
  // provenance (origine, version, date, confiance, date de la dernière lecture du cœur) et n'est pas recalculée sur
  // des données périmées. Un rapprochement proposé est toujours confirmé par un humain en v1 ; l'IA ne valide
  // jamais un paiement ni ne passe d'écriture. La perte attendue est celle de `risque-par`, lue ici et marquée
  // « estimation », jamais une provision comptabilisée. `reconciliation-auto` et `detection-anomalies` sont sans
  // objet chez l'IMF (pas de lettrage). Sans IA commune, l'emplacement rend `NON_INSTALLE` et le processus
  // continue (règles de lettrage de base).
  // Amendé le 2026-11-14 : les anciens `modeles` deviennent des capacités `secteur/code@majeure` (AD-47) ; l'assurance n'en a aucune
  // ici (rapprochement des recours par règle). `perte-attendue` est celle de `risque-par` : sa réalité n'est pas constatée ici.
  ia: {
    capacites: [
      'distributeur/lettrage-assiste@1',
      'distributeur/detection-anomalies-comptables@1',
      'distributeur/prevision-tresorerie@1',
      'microfinance/prevision-tresorerie-7j@1',
      'microfinance/perte-attendue@1',
    ],
    finalites: ['lettrage-assiste', 'alerte-anomalie', 'prevision-de-cash', 'perte-attendue'],
  },
} as const;
