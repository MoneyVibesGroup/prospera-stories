// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M10 — Approvisionnement et fournisseurs (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : PRD distributeur (PRD FINAL du 2026-11-13), annexe A.3 (treize clauses C1 → C13, tranchées) et §5.3.
// Le propriétaire du dépôt du module (service à créer) le copie dans `src/module.manifest.ts` la semaine où il
// y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : prds/prd-distributeur-2026-11-12/prd.md, §5.3 (FR-59 → FR-67 ; FR-71 pour la réception à
//              l'entrepôt ; FR-209 pour l'ordre de paiement fournisseur ; FR-246 pour le retour fournisseur ;
//              UJ-6), annexe A.3 et annexe B.2 ;
//              spine de la Reprise (AD-2, AD-23 : « approvisionnement » désigné « à créer ») ;
//              PRD Connecteurs FR-14 (fournisseurs = Odoo si le client le garde).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle distributeur « Stock & Logistique » et « Plateforme » (manifestes-a-produire.md, M10). Module non ★ : le client de février peut
//   acheter à la main (§5.3, notes).
// - Écrans : module d'écran `approvisionnement` dans `prospera-app` (C8), tous les écrans par Dev B. Route
//   `/approvisionnement`, quatre onglets : Réappro IA, Commandes fournisseurs, Fournisseurs, Règles. Les entrées
//   sont visibles avec `approvisionnement:fournisseur:gerer`, `approvisionnement:commande-fournisseur:valider`
//   ou `approvisionnement:commande-fournisseur:consulter` (annexe A.3, C8 ; lecture ajoutée par décision du PO du 2026-11-13) ; onglet d'entrée : RESP_STOCK et DG = réapprovisionnement, DAF et COMPTABLE = fournisseurs
//   (FR-61). « Basculer sur le fournisseur alternatif » : « bientôt » (annexe A.3, C8) ; « Relancer un
//   fournisseur » : « bientôt ». « Payer une échéance » : saisie (FR-67) ; l'ordre de paiement vient de
//   `paiement` (FR-209), « non installé » sans lui.
// - Rôles du socle distributeur, tirés de l'annexe B.2, à confirmer avec les rôles du vertical :
//   `fournisseur:gerer` = RESP_STOCK, DAF ; `commande-fournisseur:suggerer` = RESP_STOCK ;
//   `commande-fournisseur:valider` = RESP_STOCK sous son plafond de validation, au-delà DAF, puis DG (FR-63) ;
//   `commande-fournisseur:consulter` = DG, DAF, COMPTABLE, CONTROLE_GESTION (décision du PO du 2026-11-13) ;
//   `regle:definir` = DG, RESP_STOCK. Les plafonds sont
//   des paramètres par organisation (C6). Le magasinier n'a accès ni aux fiches fournisseurs ni à
//   l'approvisionnement ; DG, RESP_STOCK, DAF et COMPTABLE lisent les fiches (FR-59) par
//   `commande-fournisseur:consulter`.
// - Service porteur : à créer [À CONFIRMER : l'annexe A.3 ne nomme pas le dépôt ; le PRD dit « module non
//   codé »].
// - Périmètre : par entrepôt pour le responsable stock (annexe A.3, C2). Achats en XOF seulement ; l'import
//   (devises, douane, transit) est hors périmètre (§5.3, notes).
// - Hors février : le plancher de trésorerie vient de `finance-transactions` (comptabilité, hors février,
//   décision du PO du 2026-11-12) ; en février le plancher est saisi au paramétrage de l'organisation (40 M XOF
//   est la valeur de la démo). Les factures d'achat et leur rapprochement relèvent de la comptabilité.
// - Le garde-fou de trésorerie est une règle, jamais contournée par la prédiction (annexe A.3, C11).

export const MANIFESTE_APPROVISIONNEMENT = {
  code: 'approvisionnement',
  version: '1.0.0',

  // C1 : stock et catalogue sont des dépendances DURES, validées par le PO le 2026-11-12 (annexe A, préambule).
  depends: [
    {
      code: 'stock',
      raison: 'Le réapprovisionnement part du disponible, du seuil et de la couverture.',
    },
    {
      code: 'catalogue',
      raison: 'Une commande fournisseur vise des articles et des conditionnements.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent.
  // - paiement : ordres de paiement fournisseurs, exigés (FR-209) ; sans lui, « Payer » = `NON_INSTALLE` ;
  // - finance-transactions : plancher de trésorerie, hors février ; sans lui, le plancher = `NON_INSTALLE`
  //   (l'écran le dit, garde-fou non vérifié) ;
  // - notification : alerte au DAF ; sans elle, l'escalade reste visible à l'écran seulement ;
  // - entrepot : SEUL propriétaire de la réception (FR-71 « un seul écran de réception », §5.3 « les achats
  //   affichent le résultat, ils ne saisissent pas », décision du PO du 2026-11-13). approvisionnement consomme
  //   `entrepot.reception.enregistree@1` et met à jour la commande fournisseur (RECUE_PARTIELLE, RECUE,
  //   LITIGE), la dette (FR-67) et la note du fournisseur (FR-60). Sans entrepot, la réception se saisit dans
  //   `stock` comme une entrée de motif RECEPTION_FOURNISSEUR portant la référence de la commande fournisseur,
  //   et approvisionnement la lit dans `stock.mouvement.enregistre@1` ;
  // - connecteurs : fournisseurs tenus par le logiciel d'un client qui en garde un, plus tard.
  enrichiPar: ['paiement', 'finance-transactions', 'notification', 'entrepot', 'connecteurs'],

  // Aucun numéro de compte ici : l'annexe A.3 n'en déclare pas (la comptabilité des achats est hors février).
  referentielFamilies: [],

  // C7 : droits de tenant (format `^[a-z]+:[a-z-]+:[a-z]+$`, conforme). Chaque droit demande une PR
  // `auth-service` à la livraison du module (catalogue fermé, C7). Par rapport à l'annexe A.3 (décision du PO du 2026-11-13) :
  // `reception:enregistrer` RETIRÉ (la réception appartient à entrepot, droit `entrepot:reception:controler`) ;
  // `commande-fournisseur:consulter` AJOUTÉ (lire sans pouvoir agir, comme `stock:etat:consulter`).
  droits: [
    'approvisionnement:fournisseur:gerer', // créer, modifier, suspendre, évaluer ; lire les fiches (FR-59)
    'approvisionnement:commande-fournisseur:valider', // échelle par montant, plafonds paramétrables (FR-63) ; plancher de trésorerie (FR-64)
    'approvisionnement:commande-fournisseur:suggerer', // proposer et préparer une commande, y compris manuelle (FR-61, FR-62)
    'approvisionnement:commande-fournisseur:consulter', // lecture seule : commandes fournisseurs, résultats de réception, fiches, dettes et échéances (FR-59, FR-67)
    'approvisionnement:regle:definir', // règles de réapprovisionnement : seuil, couverture, mode, niveau d'automatisme (FR-61)
  ],

  // C5 : faits publiés et consommés (noms de l'annexe A.3). À figer par la story de publication.
  publie: [
    'approvisionnement.commande-fournisseur.changed@1', // cycle SUGGEREE → RECUE, statut de paiement (FR-62)
    'approvisionnement.fournisseur.changed@1', // registre, statut, note recalculée à chaque réception (FR-59, FR-60)
    'approvisionnement.escalade.demandee@1', // montée vers le DAF : plancher franchi ou plafond dépassé (FR-63, FR-64)
    'approvisionnement.retour.changed@1', // demande de retour fournisseur née d'un scénario de liquidation (FR-246)
    'instance.journal@1', // proposition (cité par le manifeste de stock, absent de l'annexe A.3) : suggestions et décisions
    'approvisionnement.realite.constatee@1', // [AD-14, spine IA] réception conforme ou rupture constatée après une suggestion de réapprovisionnement (issue : SUIVIE_CONFORME, SUIVIE_RUPTURE, NON_SUIVIE_RUPTURE, NON_SUIVIE_SANS_RUPTURE) ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'stock.alerte.changed@1', // rupture, couverture, dormant : déclencheurs du réapprovisionnement
    'stock.disponible.changed@1', // disponible, seuil et couverture (FR-61)
    'stock.liquidation.lancee@1', // fait À AJOUTER au manifeste de stock (annexe A.17 : « faits à ajouter ») ; origine du retour fournisseur (FR-246)
    'catalogue.article.changed@1', // articles et conditionnements visés par une commande fournisseur
    'entrepot.reception.enregistree@1', // SEUL fait de réception (décision du PO du 2026-11-13) : statut, dette, note
    'stock.mouvement.enregistre@1', // sans entrepot : entrée RECEPTION_FOURNISSEUR avec la référence de la commande fournisseur
    'finance-transactions.tresorerie.changed@1', // plancher de trésorerie, hors février ; sans lui `NON_INSTALLE`
    'etat-publie.changed.*@1', // l'espace du service seulement (spine du moteur, AD-24)
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  profilCompose: 'approvisionnement',

  // C13, point 1 : rien d'extérieur. « stock en service » (annexe A.3) est une dépendance du module, bloquée à
  // l'installation par `depends` ; ce n'est pas un prérequis externe. Proposition, à confirmer.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'articles-lies',
      route: 'POST /api/v1/instance/approvisionnement/{organisationId}/verifications/articles-lies',
      critere: "Articles suggérés qui existent au catalogue : 100 % 🟢 ; sinon 🔴 avec le nombre d'articles orphelins.",
    },
    {
      code: 'regle-valide',
      route: 'POST /api/v1/instance/approvisionnement/{organisationId}/verifications/regle-valide',
      critere: 'Règles de réapprovisionnement dont le seuil est ≥ 0 : toutes 🟢 ; ≥ 1 règle fautive 🔴 avec leur nombre.',
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.3).
  avertissementDesinstallation:
    'Les suggestions de réapprovisionnement cessent ; les commandes ouvertes ne sont plus suivies.',

  // C12 : format lisible par la version précédente pendant 7 jours. Interrupteurs de l'annexe A.3 ;
  // `envoi-automatique-commande-fournisseur` est éteint par défaut.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/approvisionnement/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: ['envoi-automatique-commande-fournisseur', 'escalade-daf'],

  // C2, C13 point 5 : lecture seule = registre, commandes, export (annexe A.3). Noms proposés, figés par les
  // épics du module.
  routesLectureSeule: [
    'GET /api/v1/instance/approvisionnement/{organisationId}/export',
    'GET /api/v1/fournisseurs', // registre, note et ses cinq composantes (FR-59, FR-60)
    'GET /api/v1/fournisseurs/{fournisseurId}',
    'GET /api/v1/commandes-fournisseurs', // filtre par statut ; réception rendue par l'entrepôt (FR-62, FR-71)
    'GET /api/v1/commandes-fournisseurs/{commandeId}',
    'GET /api/v1/regles-reapprovisionnement',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/approvisionnement/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/approvisionnement/{organisationId}/export',
    import: 'POST /api/v1/instance/approvisionnement/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/approvisionnement/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/approvisionnement/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C11 : l'annexe A.3 déclare deux modèles et deux finalités. Le garde-fou de trésorerie est une règle, non un
  // modèle ; il n'est jamais contourné par la prédiction. Journal local de chaque prédiction et correction,
  // calibration locale jamais écrasée (C11, points 2 et 3).
  ia: {
    capacites: [
      'distributeur/prevision-demande@1',
      'distributeur/scoring-fournisseur-explicable@1',
    ],
    finalites: ['reapprovisionnement-propose', 'choix-fournisseur-justifie'],
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : l'annexe A.3 déclare UN objet, le fournisseur
  // (FR-59 : « la reprise des fournisseurs a un objet de reprise propre »). `reprise.enrichiPar` le cite
  // (PR #420). Module non codé : « non installé » possible en février. Schéma dans
  // prospera-plateforme/contrats/objets/approvisionnement/, à écrire avec l'épic de reprise ; son contenu (code
  // FRN-NNN, nom, catégories, contact, pays, conditions, valeur de contrôle) reste à proposer à ce moment-là
  // [À CONFIRMER]. Pas d'objet de reprise pour les commandes fournisseurs ni les règles.
  objetsDeReprise: ['approvisionnement.fournisseur@1'],

  // C1, amendement du 2026-11-12 : rien en février (Connecteurs hors février ; le client de février quitte Sage,
  // aucun logiciel externe ne possède les fournisseurs). Déclaré pour plus tard (annexe A.3, C13), non listé ici
  // pour ne pas en faire un domaine actif : `approvisionnement.fournisseurs` (propriétaire : le logiciel externe
  // d'un client qui en garde un ; PRD Connecteurs FR-14).
  domainesEchange: [],
} as const;
