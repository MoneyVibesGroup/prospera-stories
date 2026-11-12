// Manifeste M06 — Stock & logistique (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Le propriétaire du dépôt `stock-service` (à créer) le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-stock-2026-08-02 (FR-S01 → FR-S65, NFR-1 → NFR-7) ;
//              spine architecture/architecture-stock-service-2026-08-15 (AD-1 → AD-18) ;
//              épics epics-stock-2026-08-15.md (EPIC-075 → 084) ;
//              spine de pdv (AD-1 : magasin propre = point de stock + point de vente, liés) ;
//              spine de la Reprise (AD-2, AD-4, AD-11 : comptage d'ouverture, AD-23), spine de Connecteurs
//              (AD-2, AD-4, AD-20 : stock d'ouverture quand Odoo possède le stock), PRD Connecteurs FR-14.
//
// Hors manifeste, pour mémoire :
// - Offre : bundles distributeur « Stock & Logistique » et « Plateforme ».
// - Écrans : module d'écran `stock` dans `prospera-app` (C8), tous les écrans par Dev B. Chaque entrée de menu
//   exige un des droits ci-dessous.
// - C11 : sans objet. Les détections de dormant (AD-15) sont des règles chiffrées, sans modèle ; la prévision
//   de demande est différée (module scoring & prévision).
// - Le stock appartient à un DOSSIER, pas à l'organisation (AD-6) : `dossierId` est dans l'URL et vérifié
//   contre la portée serveur ; hors portée = 404. Le distributeur travaille dans son dossier propre, que
//   dossier-service crée à la naissance de l'organisation (`identity.org.created`). dossier-service est du
//   socle, pas un module : il n'entre pas dans `depends`. L'exercice vient de `dossier.exercice.*` (AD-5).
// - Rôles du socle distributeur (STORY-166), proposition à confirmer avec les rôles du vertical : magasinier
//   = `stock:etat:consulter`, `stock:mouvement:saisir`, `stock:inventaire:realiser` ; responsable de stock =
//   + `stock:ajustement:valider` (plafond 5 M), `stock:entrepot:administrer` ; DAF = `stock:ajustement:valider`
//   (plafond 20 M), `stock:valorisation:configurer` ; DG = `stock:ajustement:valider` (sans plafond) ;
//   commercial = `stock:etat:consulter`. Les plafonds sont des paramètres par organisation ; l'échelle est
//   structurelle (AD-16).
// - Droits : STORY-365 (RBAC de tenant) est intégrée au planning par le PO (2026-11-12) ; FR-S61 en dépend.
// - Le relevé du commercial en visite (FR-S56, groupe K) vient du module `terrain` : stock le consomme, il ne
//   le saisit pas ; aucun droit ici.

export const MANIFESTE_STOCK = {
  code: 'stock',
  version: '1.0.0',

  // C1 : catalogue est une dépendance DURE. Le stock est tenu par article et en unité de base du catalogue
  // (FR-S07, NFR-2) ; « ce module n'invente aucun article » (§4.2 du PRD) ; l'unité de base immuable est un
  // invariant que le PRD Stock déclare dépendance dure (spine du catalogue, AD-2).
  depends: [
    {
      code: 'catalogue',
      raison:
        "Le stock se tient par article du catalogue et en son unité de base (FR-S07, NFR-2) ; sans catalogue, aucun article ni aucune unité n'existe.",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent.
  // - balance : la valeur de stock d'un arrêté se publie comme une balance (AD-7) ; sans balance, la valeur
  //   reste consultable et exportable, c'est le chemin nominal (FR-S32, NFR-4), et la publication s'écrit
  //   « non installé » ;
  // - commande : source de la réservation ; sans elle, `reserve = 0` et l'API le dit (`reservationBranchee:
  //   false`), jamais « rien n'est réservé » (AD-14) ;
  // - pdv : point de vente lié à un magasin propre (AD-11) et points de vente du réseau détaillant (groupe K) ;
  // - reseau : zones desservies par un entrepôt (FR-S01) et portée du groupe K ; sans reseau, aucune portée
  //   n'est publiée, donc le groupe K rend zéro enregistrement (fail-closed, AD-13) et s'écrit « non installé » ;
  // - terrain : relevé du commercial en visite (FR-S56), première des deux sources du groupe K ; sans lui,
  //   seule l'estimation déduite existe, et le relevé s'écrit « non installé », jamais un écart nul.
  enrichiPar: ['balance', 'commande', 'pdv', 'reseau', 'terrain'],

  // Aucun numéro de compte ici : le rattachement article → compte appartient à balance-service (AD-8). Seul le
  // compte 38 (transit) est nommé, et il passe par une catégorie transmise, jamais par un numéro (AD-9).
  referentielFamilies: [],

  // C7 : droits de tenant, les six de FR-S61 (vocabulaire fermé, AD-16). L'export reste réservé à
  // instance:donnees:exporter (C2).
  droits: [
    'stock:etat:consulter', // stock par point de stock, à une date, valeurs, alertes, dormant, groupe K sous portée
    'stock:mouvement:saisir', // entrée, sortie, transfert ; contre-passation (append-only, FR-S13)
    'stock:ajustement:valider', // échelle par rôle, plafonds paramétrables (FR-S16, AD-16)
    'stock:inventaire:realiser', // comptages tournants ou complets ; un comptage produit un écart (FR-S49)
    'stock:valorisation:configurer', // méthode par exercice, droit restreint : décision comptable (FR-S62)
    'stock:entrepot:administrer', // points de stock, capacités, zones desservies, fermeture gardée (AD-11)
  ],

  // C5 : faits publiés et consommés. Noms proposés ici, à figer par la story de publication (EPIC-084).
  // Chaque fait d'objet porte l'identifiant stable de l'objet, le `dossierId` et un `rang` (point d'écriture
  // unique, §6). Toute quantité est `{ valeur, unite }`, en unité de base, avec le facteur utilisé (AD-4).
  publie: [
    'stock.point-de-stock.changed@1', // entrepôt ou magasin propre, lien au point de vente, zones desservies, fermeture
    'stock.mouvement.enregistre@1', // un mouvement, ou sa contre-passation
    'stock.disponible.changed@1', // état absolu par (point de stock, article) : physique, réservé, disponible, reservationBranchee
    'stock.alerte.changed@1', // rupture, couverture excessive, péremption, dormant, surstock, invendu, saisonnier ; coût de portage
    'stock.valorisation.publiee@1', // arrêté d'exercice : méthode, date, périmètre, checksum, version (AD-7)
    'stock.ouverture.publiee@1', // comptage d'ouverture rendu à la mise en service, si Odoo possède le stock (Connecteurs AD-20)
    'balance.submitted', // topic existant (adaptateur #1 du hub), sans suffixe ; origine STOCK, à ajouter par EPIC-081
    'instance.journal@1', // ajustements validés, changements de méthode, fermetures d'entrepôt, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version
    'kyc.status.changed',
    'dossier.exercice.ouvert', // topics existants de dossier-service ; décision sur le champ `statut`, jamais sur le nom (AD-5)
    'dossier.exercice.clos',
    'dossier.exercice.rouvert',
    'balance.created', // issue de la publication : acceptée ; une balance rejetée ne consomme pas la version (AD-7)
    'balance.rejected',
    'catalogue.article.changed@1', // unité de base, facteurs versionnés, cycle de vie
    'catalogue.profil.changed@1', // fin de vie commerciale et saisonnalité : deux des quatre détections (AD-15)
    'pdv.point-de-vente.changed@1', // nature et lien au point de stock (magasin propre) ; points du groupe K
    'reseau.portee.changed@1', // groupe K seulement, fail-closed (AD-13) ; suite de conformité de reseau en CI
    'connecteurs.domaine.changed@1', // propriétaire des domaines stock.mouvements et stock.disponible (spine de Connecteurs, AD-3)
    // Les faits de terrain (relevé en visite) et de commande (réservations) s'ajoutent en version mineure
    // quand leurs manifestes les nomment.
  ],

  profilCompose: 'stock',

  // C13, point 1 : rien d'extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'exercice-ouvert',
      route: 'POST /api/v1/instance/stock/{organisationId}/verifications/exercice-ouvert',
      critere:
        "Dossier propre de l'organisation projeté avec un exercice OUVERT (read-model exercices_dossier) : 🟢 ; sinon 🔴 « aucune méthode de valorisation ne peut être figée, aucun arrêté publié » (AD-5).",
    },
    {
      code: 'stock-recalcule',
      route: 'POST /api/v1/instance/stock/{organisationId}/verifications/stock-recalcule',
      critere:
        "Couples (point de stock, article) dont le stock recalculé depuis tous les mouvements diffère du stock courant : 0 🟢 ; ≥ 1 🔴 avec leur nombre (NFR-1, SM-1 : une écriture directe, donc une corruption). Traitement différé, progression visible.",
    },
    {
      code: 'stocks-negatifs',
      route: 'POST /api/v1/instance/stock/{organisationId}/verifications/stocks-negatifs',
      critere: 'Stocks négatifs non autorisés : 0 🟢 ; ≥ 1 🔴 avec leur nombre (FR-S09, SM-3).',
    },
    {
      code: 'magasins-propres-sans-lien',
      route: 'POST /api/v1/instance/stock/{organisationId}/verifications/magasins-propres-sans-lien',
      critere:
        "Si pdv est installé : points de vente de nature « magasin propre » sans point de stock lié : 0 🟢 ; ≥ 1 🔴 avec leur nombre (leur stock manque à l'actif : CRM juste, stock juste, bilan faux ; AD-11). Sans pdv : « non installé ».",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation.
  avertissementDesinstallation:
    "Points de stock, mouvements, lots, inventaires et valorisations restent enregistrés ; aucune valeur de stock ne sera plus publiée à la balance (l'arrêté suivant se saisira à la main) et les commandes ne verront plus le disponible.",

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/stock/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (noms proposés, figés par EPIC-075 et EPIC-084).
  // L'export et la consultation de la valeur d'un arrêté restent ouverts : c'est le chemin du comptable quand
  // la publication n'est plus possible (FR-S32).
  routesLectureSeule: [
    'GET /api/v1/instance/stock/{organisationId}/export',
    'GET /api/v1/dossiers/{dossierId}/points-de-stock',
    'GET /api/v1/dossiers/{dossierId}/stock', // physique, réservé, disponible ; `?date=` pour une date passée (FR-S10)
    'GET /api/v1/dossiers/{dossierId}/mouvements',
    'GET /api/v1/dossiers/{dossierId}/lots',
    'GET /api/v1/dossiers/{dossierId}/valorisations', // valeurs par point de stock, catégorie, date ; pertes ventilées
    'GET /api/v1/dossiers/{dossierId}/alertes',
    'GET /api/v1/dossiers/{dossierId}/dormant', // part du capital qui ne tourne plus, coût de portage (FR-S40)
    'GET /api/v1/dossiers/{dossierId}/inventaires',
    'GET /api/v1/dossiers/{dossierId}/reseau-detaillant', // deux sources et leur écart, sous portée réseau (AD-12, AD-13)
    'GET /api/v1/dossiers/{dossierId}/journal', // auteur rendu par son identité
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/stock/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/stock/{organisationId}/export',
    import: 'POST /api/v1/instance/stock/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/stock/{organisationId}/effacement', // relevés nominatifs du groupe K
    sante: 'GET /api/v1/instance/stock/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : schémas dans
  // prospera-plateforme/contrats/objets/stock/, écrits avec EPIC-161. Le point d'import range dans le dossier
  // propre de l'organisation (la Reprise ne connaît pas les dossiers). Ordre de livraison : article (catalogue)
  // → point de stock → point de vente (pdv, qui référence le point de stock d'un magasin propre) → ouverture.
  // - point-de-stock : code, nom, nature (ENTREPOT ou MAGASIN_PROPRE), type (principal, régional, dépôt avancé),
  //   pays, devise (jamais convertie), localisation, zones desservies (références vers reseau, rôle principal ou
  //   secours), capacité de vente au détail. Régimes VIVANT (ouvert) et HISTORIQUE (fermé avant la reprise).
  //   Valeur de contrôle : statut ouvert/fermé (etat). Doublons : code. Pas d'emplacements au v1 (Q4 du PRD).
  // - stock-ouverture : nom fixé par la spine de la Reprise (AD-11). Une ligne par (point de stock, article, lot
  //   si l'article est suivi par lot, avec sa date limite) : quantité COMPTÉE en unité de base `{ valeur, unite }`
  //   (le gabarit convertit l'unité de Sage par le facteur du catalogue, et le facteur est conservé), coût
  //   unitaire d'ouverture. Régime VIVANT seul. Valeur de contrôle : quantité comptée.
  //   · L'ouverture REMPLACE, elle ne s'additionne jamais, par (point de stock, article) ; elle est refusée une
  //     fois stock `EN_SERVICE` (`OUVERTURE_CLOSE`). Elle s'enregistre comme un mouvement d'entrée de motif
  //     OUVERTURE, daté de la bascule, qui démarre le CUMP.
  //   · ⚠️ Le coût unitaire d'ouverture est un MONTANT REQUIS (PRD Reprise FR-7) : absent, l'écart
  //     `MONTANT_REQUIS_ABSENT` le laisse « à saisir » dans stock avant la mise en service. Sans lui, la
  //     première valeur de stock publiée serait fausse et crédible.
  //   · Si Odoo possède le stock : l'ouverture est gardée comme ajustement en attente et publiée à la mise en
  //     service (`stock.ouverture.publiee@1`), jamais additionnée chez Odoo (spine de Connecteurs, AD-20).
  // - Mouvements passés : non repris (l'historique des ventes est « à confirmer » dans la spine de la Reprise).
  objetsDeReprise: ['stock.point-de-stock@1', 'stock.stock-ouverture@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : « Stock : Odoo, ou Prospera si le client a le
  // pack Stock & Logistique » (PRD Connecteurs FR-14). Un seul point d'écriture par domaine (§6 du contrat).
  // - Odoo propriétaire : Prospera lit le disponible (LECTURE, niveau IMMEDIAT, avec sa fraîcheur, pour valider
  //   une commande) et ne recalcule jamais un stock qu'il ne possède pas (AD-4) ; un mouvement saisi dans
  //   Prospera devient un mouvement en attente de confirmation (AD-11), l'écran l'enveloppe dans
  //   `<ProtectionObjet>`.
  // - Prospera propriétaire : les mouvements partent vers Odoo (MOUVEMENT, additif chez le propriétaire).
  // Le stock du réseau détaillant (groupe K) n'est jamais échangé : ce n'est pas un stock détenu.
  domainesEchange: [
    {
      code: 'stock.mouvements',
      objets: ['stock.mouvement@1'],
      sorte: 'MOUVEMENT',
      argent: false, // une quantité n'est pas un mouvement d'argent ; la valeur suit la méthode de l'exercice
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'stock.echange.mouvements',
      publie: ['stock.mouvement.enregistre@1', 'stock.ouverture.publiee@1'],
    },
    {
      code: 'stock.disponible',
      objets: ['stock.disponible@1'],
      sorte: 'LECTURE', // jamais comparée (AD-13 de Connecteurs)
      argent: false,
      controle: false,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'stock.echange.disponible',
      publie: [], // une valeur calculée par le propriétaire se lit ; Prospera ne la pousse pas
    },
  ],
} as const;
