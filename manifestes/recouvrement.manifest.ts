// Manifeste M19 — Relances & Recouvrement (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : PRD distributeur `prds/prd-distributeur-2026-11-12/prd.md`, annexe A.9 (13 clauses), FR-247,
//          FR-248 ; PRD microfinance `prds/prd-microfinance-2026-11-13/prd.md`, annexe A.10 (« écarts IMF »),
//          FR-209 → FR-229, FR-274 ; spine de la microfinance
//          `architecture/architecture-microfinance-imf-2026-11-13/ARCHITECTURE-SPINE.md` (AD-2, AD-6, AD-9,
//          AD-20, AD-25) ; amendement `paiement` du 2026-11-13 (Créances du distributeur) ; épics EPIC-194 (IMF,
//          ★).
// Rétro-saisie : AUCUNE. Le code `recouvrement` existe au catalogue, aucun service ne le sert. Service
// porteur : à créer, appuyé sur `paiement` et `notification` [À CONFIRMER : la spine du distributeur le nomme].
//
// ⚡ UN MODULE, DEUX VERTICALES (PRD distributeur A.9 C1 ; spine IMF AD-20 : « un second module de
// recouvrement pour l'IMF » est interdit) : distributeur = factures impayées, dossier PAR TIERS par défaut ;
// IMF = impayés de crédit, dossier PAR PRÊT. Les statuts de l'IMF (EN_RETARD, EN_RECOUVREMENT,
// PLAN_ETALEMENT, REGULARISE, BLOQUE, CONTENTIEUX_JUDICIAIRE, PERTE_DEFINITIVE), la granularité du dossier et le
// vocabulaire sont des RÉGLAGES DE VERTICALE (C6), jamais du code.
//
// La Créance est tenue par `paiement` seul (FR-247, décision du PO du 2026-11-12, confirmée pour l'IMF : Q2).
// `recouvrement` la LIT dans `paiement.creance.changed@1` (reste dû, `montantExigible`, `lueLe`) et n'en garde
// aucune copie ; il ne calcule ni pénalité, ni intérêt, ni retard (AD-20 : les jours de retard viennent de
// `risque-par`). La balance âgée est lue dans `paiement`, jamais recopiée.
//
// ⚠️ Arbitrages entre l'annexe A.10 du PRD microfinance et la spine (AD-9 « complète et corrige » les C5) :
// - `recouvrement.plan-etalement.valide@1` (A.10) → `recouvrement.plan-etalement.decide@1` (spine) ;
//   `recouvrement.contentieux.decide@1` (A.10) → `recouvrement.contentieux.transfere@1` (spine). Ces faits de
//   DÉCISION, avec `recouvrement.perte.decidee@1`, sont ceux que `coeur-sfd` consomme pour passer la décision
//   au cœur ; `coeur-sfd` ne consomme jamais `recouvrement.dossier.changed@1` (AD-20).
// - `coeur-sfd.paiement.recu@1` et `coeur-sfd.penalite.recue@1` (A.10) → `coeur-sfd.mouvement.recu@1` (spine :
//   « paiements, pénalités, décaissements exécutés »).
// - `recouvrement.mission.creee@1` (A.10) et `terrain.mission-recouvrement.cloturee@1` (A.9) sont absents du
//   catalogue d'AD-9 : la mission est un objet de `recouvrement` que `terrain` LIT (AD-2) ; le téléphone la
//   reçoit et renvoie son résultat par la route de synchronisation de `recouvrement` (AD-19). Aucun fait.
// - Le PRD microfinance A.12 (`equipe`) écrit `recouvrement.dossier.change@1` : coquille, à lire
//   `recouvrement.dossier.changed@1` quand le manifeste `equipe` s'écrira.
//
// Hors manifeste, pour mémoire :
// - Gate : `RECOUVREMENT_NOT_ENTITLED` (403 sans donnée, état publié seul, C2). Portée lue dans
//   `reseau.portee.changed@1`. Distributeur : le recouvrement voit ses dossiers (« Mes dossiers »), le
//   commercial « Mes relances ». IMF : ROC et DG le réseau, RA son agence, GP son portefeuille, REC ses zones
//   affectées, CPT la file de rapprochement de son agence, AUD en lecture.
// - Droits par défaut : `recouvrement:credit:debloquer` au DAF seul chez le distributeur ; `credit:bloquer` et
//   `credit:debloquer` au ROC SEUL chez l'IMF ; `contentieux:decider`, `perte:decider`, `recours:examiner` au
//   DG ; `strategie:valider`, `plan:proposer`, `caution:appeler` au ROC ; `affectation:definir` et
//   `campagne:lancer` au ROC et au RA.
// - Écrans (C8, tous par Dev B) : `/relances`, balance âgée, blocage du crédit avec trace ; IMF : vue réseau du
//   ROC par PAR (agence → agent → client → dossier), fiche d'agent de recouvrement, fiche mauvais payeur,
//   stratégie, affectation des REC, plan d'étalement, file « propositions J+90 et perte », onglet Preuves et
//   campagnes de relance (FR-274). « Relancer », « Bloquer » et « Débloquer » aboutissent en février ; mise en
//   demeure et saisie sont « bientôt », sans simulation.
// - C3, données possédées : dossiers de recouvrement (par tiers ou par prêt), séquence d'escalade, promesses,
//   décisions de blocage et de déblocage avec motif et trace de surcharge, journal d'actions ; IMF en plus :
//   stratégies par agence et leur validation, affectations des REC par zone, actions et résultats (appel,
//   visite, mise en demeure, saisie), missions de recouvrement, plans d'étalement et accords signés, appels de
//   caution, propositions de contentieux et de perte avec leurs décisions, fiches de mauvais payeur, scores et
//   leurs facteurs, recours et réexamens de blocage, preuves de relance, campagnes.
// - C6, paramètres (une seule table de seuils, en données) : distributeur J+1 rappel, J+30 alerte à la
//   direction, blocage automatique au-delà de 60 jours d'échu ou au-dessus du plafond (règle auditée),
//   déblocage jamais automatique, escalade WhatsApp → SMS → visite → direction, `SEUIL_EXCLUSION_JOURS` (30),
//   cinq tranches de balance âgée ; IMF : entrée en retard à J+7, J-3 et J+1 automatiques, envois à 6 h et
//   14 h, 3 échecs avant mission terrain, alerte ROC à J+7 sous un score de 50, contentieux proposé à J+90 ou
//   sous un score de 20, perte proposée à 24 mois d'impayé, plan d'étalement de 12 mois au plus (un par prêt),
//   fiche mauvais payeur à 30 jours ou 2 promesses rompues (fermée après 6 mois), grâce de promesse de 24 h,
//   réexamen d'un blocage à 6 mois, poids du score (annexe D). Le rattachement (1 %), la tolérance d'arrondi
//   (5 FCFA) et l'âge maximal de lecture (15 min) sont des réglages de `paiement` (amendement du 2026-11-13).
// - Offre : distributeur « Finance & Recouvrement » et « Plateforme » ; microfinance « Terrain & Collecte »
//   (Relances) et « Risque & Conformité » (Recouvrement).

export const MANIFESTE_RECOUVREMENT = {
  code: 'recouvrement',
  version: '1.0.0',

  // C1 : aucune dépendance dure vers un module d'une seule verticale (annexe A.17 point 8 du PRD distributeur).
  depends: [
    {
      code: 'paiement',
      raison: 'La Créance (registre unique), les promesses et les liens de paiement sont portés par paiement.',
    },
    {
      code: 'notification',
      raison: 'Les relances multicanal partent par notification.',
    },
  ],

  // C4 : chaque absence s'écrit `{etat: NON_INSTALLE, module}`, un test par dépendance. Chaque verticale
  // alimente la source de créances par `enrichiPar`.
  // Distributeur (A.9) :
  // - facturation : aucune Créance de source `FACTURE` ⇒ dossiers du distributeur vides, NON_INSTALLE ;
  // - pdv : blocage du crédit appliqué au point de vente ; absent, le blocage est publié
  //   (`recouvrement.credit.bloque@1`) et lu directement par les modules qui en ont besoin ;
  // - finance-transactions : provisions, plus tard.
  // Microfinance (A.10) :
  // - credit : source `ECHEANCE_DE_PRET`, prêt EN_GESTION, plan d'étalement, clôture ; absent, source IMF
  //   NON_INSTALLE ;
  // - coeur-sfd : reste dû, pénalités, mouvements, échéancier officiel (le cœur fait foi pour l'argent) ;
  //   absent, aucun montant du cœur affiché, NON_INSTALLE ;
  // - microfinance : clients, groupes, cautions ;
  // - risque-par : PAR, classes, jours de retard, provisions proposées ; absent, NON_INSTALLE ;
  // - reseau : agences, zones, affectation des REC.
  // Les deux : terrain (tournée de recouvrement ; missions IMF, FR-203) ; absent, NON_INSTALLE.
  // L'« IA commune » n'est pas un module : sans elle, relances par règle de base, score par règle explicable
  // v0, stratégie et analyse sans texte, scripts en gabarits, Copilot « bientôt ».
  enrichiPar: [
    'facturation',
    'pdv',
    'finance-transactions',
    'credit',
    'coeur-sfd',
    'microfinance',
    'risque-par',
    'reseau',
    'terrain',
  ],

  referentielFamilies: [],

  // C7 : distributeur (A.9) puis microfinance (A.10). Format `^[a-z]+:[a-z-]+:[a-z]+$`.
  droits: [
    'recouvrement:dossier:traiter', // « Mes dossiers »
    'recouvrement:relance:envoyer',
    'recouvrement:promesse:enregistrer',
    'recouvrement:credit:bloquer',
    'recouvrement:credit:debloquer', // DAF seul (distributeur) ; ROC seul (IMF)
    'recouvrement:regle:definir',
    'recouvrement:balance:consulter', // « Balance âgée »
    'recouvrement:affectation:definir', // affectation des REC par zone (IMF)
    'recouvrement:strategie:valider',
    'recouvrement:plan:proposer', // plan d'étalement
    'recouvrement:contentieux:decider',
    'recouvrement:perte:decider',
    'recouvrement:caution:appeler',
    'recouvrement:fiche:consulter', // « Mauvais payeurs »
    'recouvrement:recours:examiner',
    'recouvrement:campagne:lancer', // campagnes de relance (FR-274)
  ],

  // C5.
  publie: [
    'recouvrement.dossier.changed@1', // état complet, statut de recouvrement compris (IMF) ; jamais lu par `coeur-sfd`
    'recouvrement.credit.bloque@1', // porte le dossier, le client et ses cautions APPELÉES (IMF, niveau dossier, FR-218) ; lu par `commande`, `pdv`
    'recouvrement.credit.debloque@1',
    'recouvrement.promesse.changed@1',
    'recouvrement.alerte-direction.emise@1',
    // Faits de décision, catalogue d'AD-9 (IMF), consommés par `coeur-sfd` (file d'envoi au cœur) :
    'recouvrement.plan-etalement.decide@1', // décideur, nouvel échéancier contractuel (jamais recalculé par `coeur-sfd`)
    'recouvrement.contentieux.transfere@1',
    'recouvrement.perte.decidee@1',
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] blocages, déblocages, décisions, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'reseau.portee.changed@1', // portée appliquée par le module (AD-16)
    // `paiement` (topics existants sans suffixe ; faits nouveaux de la PR #430) :
    'paiement.creance.materialisee',
    'paiement.creance.changed@1', // reste dû, montantExigible, lueLe, échéance, ancienneté : jamais recalculés (AD-6)
    'paiement.creance.soldee',
    'paiement.credit-tiers.changed@1',
    'paiement.promesse.constatee',
    'notification.reponse.recue',
    'pdv.plafond.changed@1', // blocage au-dessus du plafond (distributeur)
    // Microfinance (A.10, noms corrigés par le catalogue d'AD-9) :
    'credit.dossier.changed@1', // prêt EN_GESTION, clôture, nouveau cycle (FR-225)
    'coeur-sfd.pret.changed@1',
    'coeur-sfd.echeancier.changed@1', // échéancier officiel, nouveau après un plan d'étalement (AD-27)
    'coeur-sfd.mouvement.recu@1', // paiements et pénalités du cœur : affichage du journal seulement ; le reste dû vient de `paiement`
    'risque-par.classe.changed@1', // [proposition, AD-20 « jours de retard de risque-par » ; nom du catalogue d'AD-9]
    'microfinance.client.changed@1', // [proposition, A.10 C1 « clients, groupes, cautions » ; nom du catalogue d'AD-9]
  ],

  profilCompose: 'recouvrement',

  // C13, point 1 : `paiement` et `notification` sont les dépendances dures de `depends`, que le moteur installe
  // et contrôle. Aucun prérequis extérieur.
  prerequis: [],

  verifications: [
    {
      code: 'source-creances',
      route: 'POST /api/v1/instance/recouvrement/{organisationId}/verifications/source-creances',
      critere:
        'Le registre des Créances de `paiement` répond ET au moins une source est installée (`facturation` ou `credit`) : 🟢 ; registre muet 🔴 ; aucune source 🟠 « aucun dossier ne peut s\'ouvrir ».',
    },
    {
      code: 'canal-utilisable',
      route: 'POST /api/v1/instance/recouvrement/{organisationId}/verifications/canal-utilisable',
      critere: 'Hérité de `notification` : au moins un canal de relance utilisable 🟢 ; aucun 🔴.',
    },
    {
      code: 'lecture-du-coeur',
      route: 'POST /api/v1/instance/recouvrement/{organisationId}/verifications/lecture-du-coeur',
      critere:
        'IMF : `coeur-sfd` répond et la dernière lecture date de moins de la fraîcheur paramétrée 🟢 ; sinon 🔴 ; sans objet 🟢 si `coeur-sfd` n\'est pas installé.',
    },
    {
      code: 'affectation-des-rec',
      route: 'POST /api/v1/instance/recouvrement/{organisationId}/verifications/affectation-des-rec',
      critere: 'IMF : zones en retard sans agent de recouvrement affecté : 0 🟢 ; ≥ 1 🟠 avec leur nombre.',
    },
  ],

  avertissementDesinstallation:
    "Les relances cessent. Dossiers, promesses et décisions restent enregistrés ; les crédits et les dossiers déjà bloqués le restent, avec les demandes de leurs clients et de leurs cautions appelées, jusqu'à leur déblocage manuel.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/recouvrement/migrer', // à créer ; IMF : à la reprise du portefeuille (FR-196), les dossiers se recréent depuis les échéances impayées reprises

  // C12. Défauts par verticale (réglages de verticale, AD-20) : `blocage-automatique-au-seuil` ALLUMÉ chez le
  // distributeur, ÉTEINT chez l'IMF ; `relance-automatique` allumé (IMF : J-3 et J+1 seulement) ;
  // `canal-choisi-par-ia` éteint.
  interrupteurs: ['blocage-automatique-au-seuil', 'relance-automatique', 'canal-choisi-par-ia'],

  // C2, C13 point 5. Essai : aucune relance réelle ne part.
  routesLectureSeule: [
    'GET /api/v1/instance/recouvrement/{organisationId}/export',
    'GET /api/v1/dossiers', // [proposition] « Mes dossiers »
    'GET /api/v1/dossiers/{id}', // [proposition] journal d'actions, preuves
  ],

  // C13, point 7. À créer.
  routesInstance: {
    export: 'GET /api/v1/instance/recouvrement/{organisationId}/export',
    import: 'POST /api/v1/instance/recouvrement/{organisationId}/import',
    effacement: 'POST /api/v1/instance/recouvrement/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/recouvrement/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Les promesses ne sont pas reprises (brain dump du PO, §2) ; promesses, relances et décisions de
  // recouvrement = Prospera ; reste dû, pénalités et mouvements = le cœur (IMF).
  objetsDeReprise: [],
  domainesEchange: [],

  // C11 : union des deux verticales. Moteur : IA commune ; chez l'IMF, dans son instance locale (FR-260).
  // Le blocage, le contentieux, la perte et le plan d'étalement ne sont JAMAIS décidés par un modèle : ils
  // suivent la règle chiffrée de C6 ou une décision humaine (FR-218 → FR-221). Score : règle explicable v0, puis
  // modèle de l'IA commune avec sa provenance (FR-227).
  ia: {
    modeles: [
      'priorisation-par-probabilite',
      'choix-du-canal',
      'declenchement-par-profil',
      'score-recouvrement',
      'strategie-par-agence',
      'analyse-comportement-retard',
      'scripts-de-relance',
      'copilot-recouvrement',
    ],
    finalites: [
      'priorisation-des-dossiers',
      'choix-du-canal-de-relance', // distributeur (A.9)
      'choix-du-canal-et-du-moment', // IMF (A.10)
      'declenchement-des-relances',
      'score-de-recouvrement',
      'strategie-de-recouvrement',
      'analyse-du-comportement-de-retard',
      'aide-a-la-relance',
      'conseil-par-role',
    ],
  },
} as const;
