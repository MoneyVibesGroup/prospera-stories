// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M25 — Contrôle de gestion (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Sources (dans cet ordre) : architecture/architecture-distributeur-2026-11-13 (AD-1, AD-15, AD-19, AD-20, AD-27) ;
// spine de la microfinance (AD-9 ; le module n'y est pas installé) ; PRD distributeur §6.6 (FR-150 → FR-156) et
// annexe A.13 ; PRD microfinance §7.6 (FR-253, décision F11 : « pas de contrôle de gestion ; le DAF garde son
// tableau Budget et Rentabilité ») ; CONTRAT-DE-MODULE-2026-11-09.md. Le code `controle-gestion` n'existe pas au
// catalogue (« ❌ controle-gestion » dans `manifestes-a-produire.md`) : à créer.
//
// Verticales : DISTRIBUTEUR seul. Le PRD microfinance tranche (décision F11) que `controle-gestion` N'EST PAS
// installé chez l'IMF : il n'y a pas de rôle de contrôleur de gestion, le DAF porte la fonction, et le budget du DAF
// est une donnée de `finance-transactions` (FR-253). La mention « microfinance [À CONFIRMER] » de la ligne M25 de
// `manifestes-a-produire.md` et de l'annexe A.13 (C1) est donc résolue par le PRD microfinance ; les prévisions
// glissantes, les budgets figés par comité et le rapport au comité « ne sont pas fournis, ils sont bientôt » chez
// l'IMF. Le contrat reste NEUTRE (axes, postes, vocabulaire en donnée, AD-15) : une autre verticale pourrait
// l'installer sans toucher au code. Assurance : aucune exigence.
//
// ⚠️ CODE À TIRET. `controle-gestion` ne passe pas le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`). Ses droits sont écrits dans la forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$`
// (amendement C7 du 2026-11-11). La story d'élargissement se livre AVANT LA SEMAINE 5 ; sans elle, CE MODULE NE
// PEUT PAS DÉCLARER UN SEUL DROIT (PRD distributeur, annexe A.17, point 1). Le profil de compose et les routes
// gardent le tiret ; seule la gate le remplace par `_` (`CONTROLE_GESTION_NOT_ENTITLED`).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle distributeur « Plateforme » seulement, hors bundle (écart d'offre, PRD distributeur §4.5 ;
//   manifestes-a-produire.md, M25 : « D: Plateforme (hors bundle) »).
// - Service porteur : `prospera-pilotage-service` :3415 (AD-1), sous `src/modules/controle-gestion/`.
//   (L'annexe A.13 ne nomme pas de service ; la spine fait foi.)
// - Écrans : module d'écran `controle-gestion` dans `prospera-app` (C8), tous les écrans par Dev B.
//   `/controle-gestion` (6 onglets : Cockpit, Budgets, Écarts, P&L analytique, Forecast, Rapports) ; boîte de
//   rapports chez le DG et le DAF. Entrées de menu : « Budgets » (`controle-gestion:budget:consulter`),
//   « Rapports » (`controle-gestion:rapport:envoyer`). La démo n'a AUCUNE saisie ni version de budget (« Figer le
//   budget de juillet » est absent, FR-150) : écrans à créer. « Envoyer le rapport » doit produire un PDF réel et un
//   message par `notification` (FR-155) ; sans `notification`, le rapport est `ENVOYE` dans le courrier interne et le
//   message est « non installé ».
// - Rôles proposés (annexe B.2) : `budget:fixer`, `rapport:envoyer`, `prevision:gerer` : CONTROLE_GESTION ;
//   `budget:consulter` : CONTROLE_GESTION, DG, DAF. « Le DAF arbitre, le contrôleur contrôle » : le contrôle de
//   gestion mesure, alerte et PROPOSE ; il ne décide pas ; il n'a aucune action sur la trésorerie, le crédit client
//   ni les paiements (droits du DAF, annexe A.13 C2 « poste exclusif »).
// - Cloisonnement (C2) : par `organisationId`. Données privées (AD-1, FR-156) : le contrôleur lit la MARGE PAR AXE
//   (zone, canal, famille), JAMAIS la marge de chaque facture ni par client (aucun onglet dans `/facturation`, la
//   liste des factures lui est refusée) ; il ne lit ni les rémunérations individuelles (FR-126) ni la marge d'un
//   freelance (FR-8) ; aucun libellé « Vue DG ».
// - Données possédées (C3) : budgets par axe (zone, canal, famille), centre et poste (`CA`, `MARGE`, `CHARGES`,
//   `STOCK`), versions (`BROUILLON`, `FIGEE`, une version figée ne se modifie plus : refus `BUDGET_FIGE`, une
//   révision est une nouvelle version rattachée), écarts calculés (jamais saisis à part) avec sévérité, cause par
//   règle, niveau de confiance (`AUTO`, `A_VALIDER`, `SUGGESTION`) et état (`OUVERT`, `EN_TRAITEMENT`, `CLOS`),
//   atterrissage, prévision glissante sur 3 mois en trois scénarios (`BASE`, `HAUT`, `BAS`), modèles de rapport,
//   rapports préparés et envoyés (`BROUILLON`, `ENVOYE`, `LU`).
// - Paramètres (C6, des données, jamais du code) : axes d'analyse, bande d'alerte (±3 %, valeur initiale), marge
//   cible (16,5 %, valeur initiale), période, seuils de sévérité par poste, scénarios de prévision, modèles de
//   rapport (valeurs initiales : pack du comité de direction, alerte de marge d'un canal, flash d'une zone).
// - Règles de calcul (FR-151, FR-154) : écart % = (réel − budget) ÷ |budget| × 100 arrondi à 0,1 ; budget nul : 0 si
//   réel nul, sinon 100 ; sous contrôle si |écart %| ≤ 3 ; atterrissage = réel à date + rythme restant ; prévision =
//   RÈGLE (réel à date + tendance des 3 derniers mois, saisonnalité à partir de 12 mois), « règle de prévision,
//   version, date » ; précision = 1 − |prévu − réel| ÷ réel, « non mesurée » sans historique. Un poste dont la
//   source est absente n'a pas d'écart : il n'est pas 0.
// - Vocabulaire (AD-15) : axe « lieu » = zone (distributeur), agence (IMF, assurance) ; axe « canal » = canal de
//   distribution, canal de collecte, réseau de distribution ; axe « famille » = famille de produits, produit
//   financier, branche ; poste `CA` = chiffre d'affaires, encours ou produit net bancaire, primes émises ; poste
//   `STOCK` sans objet hors distributeur. L'axe « famille » exige que `catalogue` porte la famille (FR-C05) ; sans
//   lui il est `NON_INSTALLE`.
// - Démarrer seul (C10) : `profiles: ["controle-gestion"]` ; socle seul.
// - Migrations (C12) : `SANS_PERTE`.

export const MANIFESTE_CONTROLE_GESTION = {
  code: 'controle-gestion',
  version: '1.0.0',

  // C1, annexe A.13 : aucune dépendance dure. Un budget seul reste utilisable sans réel.
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent ; un test par
  // dépendance de `enrichiPar`. Annexe A.13 : « réel absent (`facturation`, `commande`) : colonne réel =
  // `NON_INSTALLE` ; budget seul reste utilisable ».
  // - facturation : CA et marge réels (par axe, jamais par facture) ;
  // - commande : commandes chiffrées, atterrissage du mois ;
  // - stock : coût et valorisation (poste `STOCK`, marge) ;
  // - reseau : axe « zone » ; catalogue (proposition) : axe « famille » ;
  // - finance-transactions : charges, trésorerie indicative, plancher (hors février) ;
  // - notification : envoi des rapports au DG et au DAF (appel sortant, pas un fait consommé) ; sans lui,
  //   courrier interne seul.
  enrichiPar: ['facturation', 'commande', 'stock', 'reseau', 'catalogue', 'finance-transactions', 'notification'],

  // Aucun numéro de compte ici : le module lit des agrégats, il ne passe aucune écriture.
  referentielFamilies: [],

  // C7, forme ÉLARGIE (voir l'avertissement en tête). Annexe A.13 : quatre droits. Chaque droit demande en outre une
  // PR `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'controle-gestion:budget:fixer', // saisir, modifier, figer un budget, créer une version (FR-150)
    'controle-gestion:budget:consulter', // lire budgets, écarts, compte de résultat par axe (FR-151 → FR-153)
    'controle-gestion:rapport:envoyer', // préparer et envoyer un rapport au DG et au DAF (FR-155)
    'controle-gestion:prevision:gerer', // paramétrer et lire la prévision glissante (FR-154)
  ],

  // C5 : faits publiés et consommés. Noms du catalogue de la spine (AD-20) ; ce qui n'y figure pas est marqué
  // [proposition]. Chaque fait d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`.
  publie: [
    'controle-gestion.rapport.envoye@1', // rapport envoyé (spine AD-20, annexe A.13) ; lu par `dashboard`
    'controle-gestion.budget.fige@1', // version de budget figée (spine AD-20, annexe A.13)
    'controle-gestion.decision.changed@1', // [spine § propriétaires : « chaque module qui a des décisions à trancher en possède les siennes »] action suggérée devenue Décision à trancher adressée au DAF (FR-152) ; lue par `dashboard` seul
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] figeage, envoi, export, effacement
    'controle-gestion.realite.constatee@1', // [AD-14, spine IA] cause d'un écart confirmée ou corrigée par le contrôleur ou le DAF, alerte de bande confirmée ou écartée (issue : CAUSE_CONFIRMEE, CAUSE_CORRIGEE, ALERTE_CONFIRMEE, ALERTE_ECARTEE ; `definitive` à la clôture du mois) ; aucun chiffre de l'écart sur le bus ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'facturation.facture.emise@1', // CA réel ; JAMAIS une facture de freelance (AD-31) ; aucune marge par facture n'est lue
    'reseau.noeud.created@1', // axe « zone » (annexe A.13)
    'stock.valorisation.publiee@1', // coût, poste STOCK (annexe A.13)
    // Propositions, hors de la ligne C5 de l'annexe A.13 (sans elles, `enrichiPar` n'a pas de source) :
    'reseau.noeud.moved@1', // [proposition] changer la zone d'un tiers déplace ses ventes dans le compte de résultat (FR-153)
    'reseau.noeud.closed@1', // [proposition]
    'reseau.decoupage.versionne@1', // [proposition] scission, fusion, transfert d'une zone : les axes se recalent
    'commande.commande.chiffree@1', // [proposition, spine AD-20 : montants, prix société] atterrissage du mois
    'finance-transactions.tresorerie.changed@1', // [proposition, FR-154 : trésorerie indicative et plancher]
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  profilCompose: 'controle-gestion',

  // C13, point 1 : aucun module obligatoire, aucun prérequis extérieur (annexe A.13).
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Annexe A.13 :
  // `budget-charge`.
  verifications: [
    {
      code: 'budget-charge',
      route: 'POST /api/v1/instance/controle-gestion/{organisationId}/verifications/budget-charge',
      critere:
        "Au moins 1 budget chargé : 🟢 ; aucun budget : 🔴 (annexe A.13, C13).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.13). Rien n'est supprimé ; budgets conservés.
  avertissementDesinstallation: 'Les budgets ne seront plus comparés au réel.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/controle-gestion/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // Annexe A.13 : `envoi-automatique-rapports`. Comportement seulement, jamais la forme des données.
  interrupteurs: ['envoi-automatique-rapports'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexe A.13 : consultation, export). Toute écriture rend
  // 403 `ABONNEMENT_EXPIRE`. Noms de routes proposés, figés par l'épic du module.
  routesLectureSeule: [
    'GET /api/v1/instance/controle-gestion/{organisationId}/export',
    'GET /api/v1/controle-gestion/budgets', // [proposition]
    'GET /api/v1/controle-gestion/ecarts', // [proposition]
    'GET /api/v1/controle-gestion/compte-de-resultat', // [proposition] par axe
    'GET /api/v1/controle-gestion/previsions', // [proposition]
    'GET /api/v1/controle-gestion/rapports', // [proposition]
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/controle-gestion/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/controle-gestion/{organisationId}/export',
    import: 'POST /api/v1/instance/controle-gestion/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/controle-gestion/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/controle-gestion/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : aucun objet repris (annexe A.13). Les budgets se
  // saisissent ou s'importent d'un fichier au format d'export (FR-150, FR-18), ce qui n'est pas une reprise.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : aucun domaine d'échange (annexe A.13).
  domainesEchange: [],

  // C11 : capacités de l'IA commune CONSOMMÉES (annexe A.13), demandées par `PropositionPort` (spine AD-19) ; le
  // module n'embarque aucun modèle. Noms proposés. `synthese-ecarts` : explication en langage des écarts et alerte de
  // bande, avec provenance. Aujourd'hui la cause d'un écart est une RÈGLE (« règle de cause, version », FR-152) et la
  // prévision aussi (« règle de prévision, version, date », FR-154) : « aucun modèle d'IA n'est affiché » ; le texte
  // de la démo étiqueté « IA » et écrit à la main disparaît. Un chiffre (écart, atterrissage, prévision) ne vient
  // JAMAIS d'un modèle (AD-19) ; l'IA ne rédige que l'explication. Le contrôleur propose, le DAF arbitre.
  // Amendé le 2026-11-14 : l'ancien `modeles` devient la capacité `distributeur/explication-ecarts@1` (AD-47) ; verticale unique : le
  // distributeur.
  ia: {
    capacites: [
      'distributeur/explication-ecarts@1',
    ],
    finalites: ['explication-des-ecarts', 'alerte-de-bande'],
  },
} as const;
