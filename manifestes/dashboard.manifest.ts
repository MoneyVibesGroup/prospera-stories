// Manifeste M28 — Tableau de bord et pilotage (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Sources (dans cet ordre) : architecture/architecture-distributeur-2026-11-13 (AD-1, AD-15, AD-19, AD-20, AD-27,
// AD-31) ; spines de la microfinance (AD-6, AD-9, AD-14, AD-16) et de l'assurance (« `dashboard` lit par faits
// d'état absolu et routes de lecture seulement ; tout indicateur se recalcule des faits ») ; PRD distributeur §6.8
// (FR-165 → FR-171, FR-177) et annexe A.15 ; PRD microfinance §7.3 (FR-230 → FR-239) et annexe A.11 ; PRD assurance
// §6.7 et §7.3 (FR-206 → FR-213, FR-228, FR-229) ; CONTRAT-DE-MODULE-2026-11-09.md. Le code `dashboard` existe au
// catalogue, déprécié : à réactiver.
//
// CE QUE LE MODULE POSSÈDE, ET CE QU'IL NE POSSÈDE PAS. `dashboard` LIT TOUS LES MODULES et ne copie rien : chaque
// cockpit est un assemblage de lectures (par fait d'état absolu ou par route de lecture), calculées à la demande ;
// un élément dont le module est absent affiche `NON_INSTALLE`, JAMAIS 0 (FR-165). Il ne possède QUE ses vues et ses
// seuils : définitions de cartes et de KPI par rôle, alertes du jour et leurs règles, rapports de direction générés,
// règle du score de santé et scores calculés, diagnostics d'article. Les décisions à trancher ne sont PAS à lui :
// chaque module possède les siennes (schéma commun, FR-14) et publie `<module>.decision.changed@1` ; `dashboard` les
// liste, et trancher une décision exige le droit du module qui la possède (« Valider » et « Reporter » appellent ce
// module). Aucun module ne dépend de `dashboard` en dur ; il ne dépend de personne.
//
// Hors manifeste, pour mémoire :
// - Offre : distributeur « Stock & Logistique » et « Plateforme » ; microfinance « Crédit » ; assurance : offre
//   unique (tableau de bord direction) ; cabinet [À CONFIRMER] (manifestes-a-produire.md, M28). Quatre à cinq
//   verticales ; UN code, UN contrat (AD-15) : le noyau est identique, ce qui change est l'ensemble des chiffres de
//   décision, qui est une donnée de paramétrage.
// - Gate : `DASHBOARD_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Service porteur : `prospera-pilotage-service` :3415 (AD-1), sous `src/modules/dashboard/`. (Les annexes ne
//   nomment pas de service ; la spine fait foi.)
// - Écrans : module d'écran `dashboard` dans `prospera-app` (C8), tous les écrans par Dev B. `/dashboard` : un
//   cockpit par rôle (15 chez le distributeur, 16 chez l'IMF), rapport de direction, courrier des rapports,
//   descente géographique et par secteur et tiroir Copilot (IMF), contrôle quotidien et écran réseau du ROC (IMF,
//   FR-273). Entrées de menu : « Tableau de bord » (`dashboard:tableau:consulter`), « Copilot »
//   (`dashboard:copilot:interroger`). Le DG « voit tout » ; la carte « Vue DG » est conditionnée par
//   `dashboard:vue-direction:consulter` (DG et DC seulement, FR-7, FR-186). « PDF » et « Envoyer » DOIVENT aboutir (PDF
//   réel, envoi par `notification`, FR-170) ; les décisions « Valider » et « Reporter » aussi, en appelant le module
//   propriétaire. « N alertes critiques » doit aboutir. Boutons non branchés : « bientôt » (FR-2) ; le « Copilot
//   conversationnel » de l'offre distributeur n'a pas d'écran dans la démo (encarts « DAF Copilot » seulement) : « bientôt »,
//   sans date. Chez l'assurance : aucune prime ni ratio sinistres sur primes (les primes relèvent du logiciel de la
//   compagnie, FR-2) ; vue finance (engagements « exigible » et « à confirmer » en deux colonnes, jamais sommées) et vue
//   exploitation (FR-229) ; les chiffres affichent la date de leur dernière lecture du logiciel de la compagnie.
// - Rôles proposés (annexe B.2) : `tableau:consulter` : les 14 rôles métier du distributeur, chacun SON cockpit (IMF :
//   les seize rôles ; ADMIN_IMF et DIST_ADMIN ne reçoivent aucune carte métier) ; `vue-direction:consulter` : DG, DC ;
//   `rapport:envoyer` : DG, DAF, CONTROLE_GESTION ; `alerte:configurer` : DG, DIST_ADMIN. Chaque rôle ne reçoit que les
//   cartes que SES droits sur les modules sources autorisent : le serveur appelle la source avec le périmètre du
//   lecteur (FR-6), il ne filtre pas une copie.
// - Cloisonnement (C2) : par `organisationId` et par portée (réseau, région, agence, zone, portefeuille : IMF FR-5,
//   FR-255). Données privées (AD-1, AD-10, AD-31) : ni la marge ni le prix d'un freelance, ni les rémunérations
//   individuelles, ni la marge par facture hors des rôles à droit explicite ; ce module ne consomme AUCUN topic de la
//   famille freelance ; le test de fuite parcourt aussi ses réponses de lecture (AD-31).
// - Données possédées (C3) : voir plus haut ; en plus chez l'IMF (annexe A.11) : composition des seize cockpits,
//   règles de déclenchement des alertes et leurs seuils calibrés (FR-235), historique des remontées à 48 h (FR-234).
//   Règle du score de santé d'un point de vente et scores calculés : DÉPOSÉS dans `pdv` avec leur provenance (origine
//   `REGLE`, version, date, facteurs ; FR-177, FR-184) par `dashboard.score-pdv.calcule@1`, lu par `pdv`.
// - Paramètres (C6, des données, jamais du code) : cartes par rôle, huit chiffres du DG (douze chez l'IMF, FR-231) et
//   leurs seuils de statut (`SAIN`, `ATTENTION`, `CRITIQUE`), seuils d'alerte et leur source (démo, calculé, fixé :
//   FR-4), modèle du rapport de direction, délai de remontée (48 h), heure du rapport (06:00), fréquence de
//   rafraîchissement (5 min, annexe D de la microfinance), PAR 1, 7, 30, 60 et 90, seuil de concentration d'un secteur,
//   voisinage d'agences (± 20 % d'encours). Le seuil d'une alerte n'est jamais changé en silence : il passe par la
//   validation de FR-4.
// - Vocabulaire (AD-15) : « argent disponible » = solde caisse et banque (distributeur), trésorerie et liquidité
//   (IMF), trésorerie (assurance) ; « ce qu'on me doit » = crédit client (encours), encours de prêts et PAR, primes à
//   recevoir ; « activité » = CA et commandes, collecte et décaissements, primes émises et sinistres. Le libellé vient
//   du tableau de la verticale.
// - Démarrer seul (C10) : `profiles: ["dashboard"]` ; socle seul.
// - Migrations (C12) : `SANS_PERTE`.

export const MANIFESTE_DASHBOARD = {
  code: 'dashboard',
  version: '1.0.0',

  // C1, annexe A.15 (et IMF A.11, assurance §7.3) : AUCUNE dépendance dure ; aucun module n'en dépend en dur. Il lit
  // des faits sans dépendre de personne (spine, graphe de dépendances).
  depends: [],

  // C4 : chaque carte dont la source est absente = `{ etat: NON_INSTALLE, module }`, jamais 0 ni absent ; un cockpit
  // s'affiche avec ses seules cartes disponibles ; un test par module de `enrichiPar`. Annexe A.15 : « tous les
  // modules du distributeur » ; annexe IMF A.11 : quinze modules ; assurance : `sinistres`, `assurance`,
  // `expertises` (FR-206 → FR-213). Liste unie, par verticale :
  // - distributeur : commande, facturation, approvisionnement, entrepot, stock, pdv, catalogue, conquete-objectifs,
  //   freelance (AU PRIX SOCIÉTÉ seulement, jamais la famille freelance), terrain, recouvrement, paiement, equipe,
  //   marketing, controle-gestion, finance-transactions, studio-social, automatisations, reseau, notification ;
  // - microfinance : credit, collecte, caisse, risque-par, conformite-bceao, microfinance, coeur-sfd (chaque chiffre
  //   d'argent = `NON_INSTALLE` sans lui ; balance du cœur absente : résultat et rentabilité = « en attente des
  //   données du cœur » ; `risque-par` absent : PAR = `NON_INSTALLE` ; `finance-transactions` absent : budget =
  //   `NON_INSTALLE` ; instance locale de l'IA absente : Copilot = « bientôt ») ;
  // - assurance : sinistres, assurance, expertises, ged ; sans `dashboard`, les files de `sinistres` restent et
  //   l'emplacement du cockpit est vide.
  enrichiPar: [
    'commande',
    'facturation',
    'approvisionnement',
    'entrepot',
    'stock',
    'pdv',
    'catalogue',
    'conquete-objectifs',
    'freelance',
    'terrain',
    'recouvrement',
    'paiement',
    'equipe',
    'marketing',
    'controle-gestion',
    'finance-transactions',
    'studio-social',
    'automatisations',
    'reseau',
    'notification',
    'credit',
    'collecte',
    'caisse',
    'risque-par',
    'conformite-bceao',
    'microfinance',
    'coeur-sfd',
    'sinistres',
    'assurance',
    'expertises',
    'ged',
  ],

  // Aucun numéro de compte ici : le module ne passe aucune écriture.
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (le code `dashboard` est sans tiret ; `vue-direction` est un
  // objet à tiret, permis). Annexe A.15 : quatre droits ; annexe IMF A.11 : deux de plus. Chaque droit demande en outre
  // une PR `auth-service` à la livraison du module (catalogue de droits à enum fermé). Trancher une décision exige le
  // droit du module qui la possède (par exemple `commande:remise:valider`), jamais un droit de `dashboard`.
  droits: [
    'dashboard:tableau:consulter', // son cockpit, avec les seules cartes que ses droits sur les sources autorisent
    'dashboard:vue-direction:consulter', // carte « Vue DG » : DG et DC seulement (FR-7, FR-186) ; IMF : onglets Crédit et Commercial compris
    'dashboard:rapport:envoyer', // générer, envoyer le rapport de direction (FR-169, FR-170)
    'dashboard:alerte:configurer', // règles de déclenchement et seuils d'alerte (FR-235) ; ne change jamais un seuil en silence
    // Annexe IMF A.11 :
    'dashboard:copilot:interroger', // Copilot par rôle, lecture seule, chiffres sourcés (FR-237)
    'dashboard:secteur:consulter', // lecture du pilotage par secteur d'activité (FR-233)
  ],

  // C5 : faits publiés et consommés. Noms du catalogue de la spine (AD-20) ; ce qui n'y figure pas est marqué
  // [proposition] (« un nom absent du tableau ne se publie ni ne se consomme » : PR d'ajout à porter). Chaque fait
  // d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`.
  publie: [
    'dashboard.rapport.genere@1', // rapport de direction généré (spine AD-20, annexes A.15 et A.11)
    'dashboard.score-pdv.calcule@1', // score de santé d'un point de vente, avec sa provenance ; lu par `pdv` (FR-184) ; SANS OBJET chez l'IMF (pas de point de vente)
    'dashboard.article.diagnostic@1', // diagnostic d'article : rentabilité, engouement (FR-243) ; lu par `catalogue` (distributeur)
    'dashboard.alerte.changed@1', // [IMF A.11, absent du catalogue de la spine] cycle de vie d'une alerte : destinataire, délai, remontée
    'dashboard.alerte.remontee@1', // [IMF A.11, absent du catalogue de la spine] remontée à 48 h (FR-234)
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] règles d'alerte, seuils, envoi de rapport, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24) ; annexe A.15 : `etat-publie.changed.*@1`
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    // Les décisions à trancher de tous les modules (spine AD-20 : « les faits de décision sont lus par `dashboard`
    // seul ») ; annexes A.15 et IMF A.11 :
    '*.decision.changed@1', // un par module propriétaire : `commande`, `recouvrement`, `marketing`, `controle-gestion`, `finance-transactions`, `credit`, …
    // « Les faits des modules sources » (annexe A.15), en faits d'ÉTAT ABSOLU, jamais en copie. Ce qui suit est la
    // liste unie des faits du catalogue de la spine qu'un cockpit lit ; chaque ligne est une [proposition] de la story
    // de consommation (l'annexe A.15 ne la détaille pas) :
    // distributeur (spine AD-20)
    'commande.commande.chiffree@1', // CA, panier (prix société, jamais freelance)
    'commande.commande.changed@1',
    'commande.engagement-tiers.changed@1', // encours
    'facturation.facture.emise@1', // CA facturé ; jamais une facture de freelance
    'facturation.facture.changed@1',
    'paiement.creance.changed@1', // balance âgée, top impayés, DSO
    'paiement.credit-tiers.changed@1',
    'paiement.encaissement.changed@1',
    'stock.disponible.changed@1',
    'stock.alerte.changed@1',
    'stock.valorisation.publiee@1',
    'pdv.point-de-vente.changed@1', // score de santé, pipeline
    'pdv.plafond.changed@1',
    'recouvrement.dossier.changed@1',
    'recouvrement.credit.bloque@1',
    'recouvrement.credit.debloque@1',
    'recouvrement.alerte-direction.emise@1',
    'terrain.visite.changed@1',
    'conquete-objectifs.objectif.changed@1',
    'approvisionnement.commande-fournisseur.changed@1',
    'entrepot.preparation.terminee@1',
    'entrepot.expedition.livree@1',
    'marketing.campagne.changed@1',
    'equipe.coaching.changed@1',
    'controle-gestion.rapport.envoye@1',
    'finance-transactions.tresorerie.changed@1',
    'reseau.portee.changed@1', // C2 : portée du lecteur
    // microfinance (spine IMF AD-9, annexes A.11 et A.14)
    'credit.dossier.changed@1',
    'collecte.collecte.changed@1',
    'caisse.fonds.changed@1',
    'risque-par.par.calcule@1', // PAR, affichage seul
    'risque-par.alerte.changed@1', // annexe IMF A.11
    'conformite-bceao.ratio.calcule@1',
    'microfinance.client.changed@1',
    'coeur-sfd.fraicheur.changed@1', // annexe IMF A.11 : « données du … » en orange au-delà de la fraîcheur attendue (FR-239)
    'coeur-sfd.balance.recue@1',
    'coeur-sfd.caisse-guichet.changed@1',
    // assurance (PRD assurance §6.7 et §7.3, C5 de `sinistres`, `assurance`, `expertises`) ; noms de la clause C5 de
    // chacun, écrits par un autre manifeste en même temps que celui-ci :
    'sinistres.dossier.changed@1', // statut, volet, gestionnaire, montants, échéances
    'assurance.provision.changed@1', // annexe assurance : lu par `dashboard`
    'expertises.mission.changed@1',
  ],

  profilCompose: 'dashboard',

  // C13, point 1 : aucun module obligatoire (annexes A.15, IMF A.11) ; aucun prérequis.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Noms de routes
  // proposés (convention commune de l'annexe A : `verifications/<code>`).
  verifications: [
    {
      code: 'cartes-resolues',
      route: 'POST /api/v1/instance/dashboard/{organisationId}/verifications/cartes-resolues',
      critere:
        "Au moins 80 % des cartes d'un cockpit d'essai se résolvent, les autres affichant `NON_INSTALLE` : 🟢 ; moins de 80 % 🔴 avec leur nombre (annexe A.15, C13).",
    },
    {
      code: 'chiffres-recoupes',
      route: 'POST /api/v1/instance/dashboard/{organisationId}/verifications/chiffres-recoupes',
      critere:
        "Les chiffres du DG se recalculent depuis les données sources à l'identique : 100 % 🟢 ; un seul écart 🔴 avec le chiffre et l'écart (annexe IMF A.11, FR-239 : « une seule source de vérité » ; chez l'IMF, recalcul depuis le cœur fictif ; vérification neutre de vertical).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.15). Rien n'est supprimé ; définitions et
  // décisions conservées.
  avertissementDesinstallation:
    "Les tableaux de bord disparaissent du menu ; aucune donnée métier n'est touchée.",

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/dashboard/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // Annexe A.15 : `rapport-ia-quotidien` et `scoring-sante-pdv`. Annexe IMF A.11 : `rapport-quotidien-dg` (même
  // interrupteur sous un autre nom : retenu sous le nom de l'annexe A.15, voir l'écart noté) et `copilot` (éteint
  // seulement si l'instance locale de l'IA ne tourne pas : « bientôt », FR-237). Comportement seulement, jamais la
  // forme des données.
  interrupteurs: ['rapport-ia-quotidien', 'scoring-sante-pdv', 'copilot'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexe A.15 : « tous les cockpits, export »). Toute écriture
  // rend 403 `ABONNEMENT_EXPIRE`. Noms de routes proposés, figés par l'épic du module.
  routesLectureSeule: [
    'GET /api/v1/instance/dashboard/{organisationId}/export',
    'GET /api/v1/dashboard/cockpits/{role}', // [proposition] un cockpit, sous le périmètre du lecteur
    'GET /api/v1/dashboard/alertes', // [proposition]
    'GET /api/v1/dashboard/decisions', // [proposition] liste seule ; trancher passe par le module propriétaire
    'GET /api/v1/dashboard/rapports', // [proposition] courrier des rapports
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/dashboard/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/dashboard/{organisationId}/export',
    import: 'POST /api/v1/instance/dashboard/{organisationId}/import', // sa part du dossier d'installation (définitions de cartes, seuils)
    effacement: 'POST /api/v1/instance/dashboard/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/dashboard/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : aucun objet repris (annexes A.15 et IMF A.11) ; les
  // chiffres se recalculent, les définitions de cartes se paramètrent.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : aucun domaine d'échange (annexes A.15 et IMF A.11).
  domainesEchange: [],

  // C11 : capacités de l'IA commune CONSOMMÉES (annexe A.15, union avec l'annexe IMF A.11), demandées par
  // `PropositionPort` (spine AD-19, microfinance AD-14) ; le module n'embarque aucun modèle et ne code aucune règle
  // de score en propre : il demande une Proposition. Noms proposés.
  // - `synthese-narrative` (finalité `rapport-de-direction`) : rapport de direction ; aujourd'hui par gabarits de
  //   texte sur les registres, SANS modèle (démo) : l'écran n'écrit « IA » que si un modèle génère réellement le texte.
  // - `prevision-ca` (finalité `prevision-ca-trimestrielle`) : prévision du chiffre d'affaires, avec provenance.
  // - `scoring-sante-pdv` (finalité `score-de-sante`) : le score de santé est une RÈGLE de `dashboard` (spine AD-19,
  //   FR-177) : origine `REGLE`, version, date, facteurs, déposée dans `pdv` ; une prédiction sans provenance ne
  //   s'affiche pas.
  // - `copilot-par-role` (finalité `pilotage-assiste`) : Copilot en lecture seule, questions types par rôle, chaque
  //   chiffre avec sa source et sa date ; réel dès le premier jour chez l'IMF, « bientôt » chez le distributeur.
  // - `priorites-du-jour` (finalité `priorites-du-jour`) et `anomalie-agence` (finalité `anomalie-d-agence`) : IMF
  //   (FR-238), proposées avec leur provenance.
  // Un chiffre financier affiché ne vient JAMAIS d'un modèle (AD-19) : les huit chiffres du DG se calculent sur les
  // faits (FR-15, FR-166). Le décideur est un humain ; l'IA ne tranche aucune décision. Le prix et la marge d'un
  // freelance ne sont jamais une entrée. Chez l'IMF et chez l'assurance l'IA tourne dans l'instance locale, aucune donnée
  // nominative ne sort ; seuls des écarts anonymisés repartent, avec consentement par finalité. Le tableau de bord de
  // l'assurance porte l'AFFICHAGE des capacités déclarées par `sinistres` (FR-208, FR-209) ; le moteur reste l'IA
  // commune. Sans IA commune, l'emplacement rend `NON_INSTALLE` et le processus continue (règles de base, Copilot
  // « bientôt »).
  ia: {
    modeles: [
      'synthese-narrative',
      'prevision-ca',
      'scoring-sante-pdv',
      'copilot-par-role',
      'priorites-du-jour',
      'anomalie-agence',
    ],
    finalites: [
      'rapport-de-direction',
      'prevision-ca-trimestrielle',
      'score-de-sante',
      'pilotage-assiste',
      'priorites-du-jour',
      'anomalie-d-agence',
    ],
  },
} as const;
