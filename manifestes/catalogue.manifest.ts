// Manifeste M04 — Catalogue, produits & tarification (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Le propriétaire du dépôt `catalogue-produits-service` (à créer) le copie dans `src/module.manifest.ts` la
// semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-catalogue-produits-2026-08-02 (FR-C01 → FR-C52, NFR-1 → NFR-6) ;
//              spine architecture/architecture-catalogue-produits-service-2026-08-15 (AD-1 → AD-15) ;
//              épics epics-catalogue-produits-2026-08-15.md (EPIC-065 → 074) ;
//              spine de pdv (AD-5 : le départ d'un commercial déclenche la révélation) ;
//              spine de la Reprise (AD-2, AD-4, AD-23), spine de Connecteurs (AD-2, AD-4, AD-11), PRD
//              Connecteurs FR-14 (produits et prix : Odoo propriétaire si les achats y travaillent).
//
// ⚡ Le code du module est `catalogue`, pas `catalogue-produits` [À CONFIRMER par le PO].
// - La spine (AD-14, arbitrage du PO du 2026-08-15) voulait renommer le code en `catalogue-produits`. Le
//   renommage n'a jamais été livré : `platform-catalog-service` sème `catalogue` (modules.seed-data.ts,
//   STORY-366, avec la mention « le renommage n'est pas livré »), quatre packs le citent, et pdv le déclare
//   déjà dans `enrichiPar`.
// - Raison décisive de garder `catalogue` : le code est le premier segment des droits de tenant, et
//   `TENANT_PERMISSION_FORMAT = /^[a-z]+:[a-z-]+:[a-z]+$/` (auth-service) refuse un tiret à cet endroit ;
//   `catalogue-produits:article:gerer` serait refusé.
// - Ce qui reste d'AD-14 : le SERVICE s'appelle `catalogue-produits-service`, et `catalog` nu reste interdit
//   dans son code (types, collections). L'homonyme avec `platform-catalog-service` (qui catalogue les modules
//   Prospera) se lève par le nom du service, pas par le code du module.
// - À corriger au passage dans le seed : sa description dit « produits et services vendus par le cabinet » ;
//   ce module sert le distributeur.
//
// Hors manifeste, pour mémoire :
// - Offre : bundles distributeur « Terrain & Ventes » et « Plateforme ». La ligne M04 cite aussi les
//   « Produits financiers » de la microfinance [À CONFIRMER] : ce PRD ne les couvre pas (unités entières,
//   grilles par zone, prix freelance). Recommandation : les produits de crédit et d'épargne restent dans
//   `microfinance` et `credit` ; ce manifeste ne décrit que le catalogue du distributeur.
// - Écrans : module d'écran `catalogue` dans `prospera-app` (C8), tous les écrans par Dev B. Chaque entrée
//   de menu exige un des droits ci-dessous ; l'écran « Mes prix » du freelance n'exige aucun droit, il exige
//   d'être le propriétaire (AD-6).
// - C11 : sans objet. L'élasticité est saisie ou héritée d'une famille, jamais mesurée (A4) ; le fournisseur
//   de candidats (FR-C51) expose des faits, sans score.
// - Rôles du socle distributeur (STORY-166), proposition à confirmer avec les rôles du vertical :
//   commercial salarié et freelance = `catalogue:article:consulter` (la grille société est visible de tous,
//   FR-C32) ; gestionnaire du catalogue ou des achats = + `catalogue:article:gerer` ; DC = +
//   `catalogue:promotion:gerer` ; DAF = + `catalogue:grille:gerer`.
// - Droits : le catalogue des droits de tenant existe (STORY-166, `tenant-permission.enum.ts`, où ces quatre
//   codes s'ajoutent, C7) ; STORY-365 (RBAC de tenant porté jusqu'au contrôle des routes, AD-P15) est encore
//   `not_started` au 2026-11-12, et FR-C48 en dépend (spine, « Ce que cette spine impose ailleurs »).
// - Import par fichier propre au module (FR-C45) : même question que FR-V40 de pdv et FR-R37 de reseau,
//   remplacé par la Reprise ou gardé [À CONFIRMER : le PO tranchera les trois ensemble] ; s'il reste, il
//   passe par le même point d'écriture que la reprise (compte rendu avant persistance, tout ou rien).
//
// ⛔ Étanchéité des prix freelance (NFR-4, AD-6), appliquée à chaque champ de ce manifeste :
// - aucun fait publié ne porte un prix freelance, pas même `instance.journal@1` (le journal freelance reste
//   dans sa propre collection, lisible du seul propriétaire, AD-7) ;
// - aucun objet de reprise et aucun domaine d'échange ne porte un prix freelance : le rapport de la Reprise
//   est lu par la société, et le logiciel du client est celui de la société ;
// - l'export rendu à un utilisateur de l'organisation ne contient ni `grilles_freelance` ni le journal
//   freelance ; voir `routesInstance.export`.
// La seule exception reste la route plateforme `@PlatformReadOnly` (AD-15, AD-P16), hors manifeste : `orgId`
// en paramètre explicite, lecture seule, une organisation à la fois, motif journalisé.

export const MANIFESTE_CATALOGUE = {
  code: 'catalogue',
  version: '1.0.0',

  // C1 : aucune dépendance dure. La zone d'une grille est une référence opaque tant que reseau n'est pas là
  // (A2) ; reseau la rend résoluble sans l'imposer (spine de reseau, AD-12).
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent.
  // - reseau : zones des conditions de grille vérifiées à la saisie ; sans lui, la zone est une référence
  //   opaque non vérifiée (A2) ;
  // - pdv : prix freelance par point de vente (FR-C28) et départ d'un commercial, qui déclenche la révélation
  //   (AD-8) ; sans lui, le volet freelance est `NON_INSTALLE` et le hook de révélation reste inerte ;
  // - stock, commande : le retrait d'un article qui porte du stock ou des commandes en cours est refusé
  //   (FR-C43) ; sans eux, le compte rendu de retrait dit « stock : non installé », jamais « 0 ».
  enrichiPar: ['reseau', 'pdv', 'stock', 'commande'],

  // Le régime de taxe de l'article (FR-C13d) porte son taux ; il n'est pas lu dans un référentiel fiscal au
  // v1 [À CONFIRMER : le brancher sur le référentiel fiscal du Togo quand fiscal-service le publiera].
  referentielFamilies: [],

  // C7 : droits de tenant, les quatre de FR-C48. « Gérer son propre tarif freelance » n'est pas un droit mais
  // une propriété : le dépôt exige le userId propriétaire (AD-6). L'export reste réservé à
  // instance:donnees:exporter (C2).
  droits: [
    'catalogue:article:consulter', // articles, conditionnements, grilles société, promotions ; simuler un prix (FR-C27)
    'catalogue:article:gerer', // créer, modifier, suspendre, retirer, remplacer un article ; conditionnements et facteurs
    'catalogue:grille:gerer', // grilles société : prix, devise, HT/TTC, conditions, priorité, versions
    'catalogue:promotion:gerer', // promotions de ligne et de pied de commande, plafonds, cumul déclaré
  ],

  // C5 : faits publiés et consommés. Noms proposés ici, à figer par la story de publication (EPIC-074).
  // Chaque fait d'objet porte l'identifiant stable de l'objet et un `rang` (point d'écriture unique, §6).
  // Toute quantité est `{ valeur, unite }` et tout facteur voyage avec sa version (AD-4, AD-9).
  publie: [
    'catalogue.article.changed@1', // état absolu : cycle de vie, unité de base, conditionnements et facteurs versionnés, remplacement
    'catalogue.grille.publiee@1', // version de grille société : devise, HT/TTC, conditions, prix par article ET par unité
    'catalogue.promotion.changed@1', // ouverte, modifiée, close ; périmètre ligne ou commande entière
    'catalogue.profil.changed@1', // profil commercial, ou PROFIL_ABSENT, jamais neutre (AD-10)
    'catalogue.revelation.effectuee@1', // départ d'un freelance : date, points de vente révélés ; AUCUN prix dans la charge
    'instance.journal@1', // actes de la société seulement : grilles, promotions, facteurs, import, export, révélation
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version
    'kyc.status.changed',
    'pdv.commercial.parti@1', // déclencheur de la révélation (spine de pdv, AD-5) ; liste exacte des points qui restent
    'reseau.commercial.changed@1', // commercial → compte (userId) et statut indépendant : à qui appartient une grille freelance
    'connecteurs.domaine.changed@1', // propriétaire des domaines catalogue.articles et catalogue.prix (spine de Connecteurs, AD-3)
    // Les faits de stock et de commande (articles portant du stock ou des engagements, FR-C43) s'ajoutent en
    // version mineure quand leurs manifestes les nomment.
  ],

  profilCompose: 'catalogue',

  // C13, point 1 : rien d'extérieur. Les photos d'articles (FR-C04) passent par le stockage de fichiers de la
  // plateforme, pas par un service tiers.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'consommateurs-conformes',
      route: 'POST /api/v1/instance/catalogue/{organisationId}/verifications/consommateurs-conformes',
      critere:
        "Modules installés pour l'organisation qui échangent des quantités (stock, commande, facturation) présents au registre avec la version courante de la suite de conformité : tous 🟢 ; un absent 🔴 avec son code (NFR-1, AD-9 : une absence est un écart ouvert).",
    },
    {
      code: 'regime-de-taxe',
      route: 'POST /api/v1/instance/catalogue/{organisationId}/verifications/regime-de-taxe',
      critere:
        "Articles actifs sans régime de taxe : 0 🟢 ; ≥ 1 🔴 si facturation est installé (pas de facture conforme, FR-C13d), 🟠 sinon ; avec leur nombre.",
    },
    {
      code: 'articles-sans-prix',
      route: 'POST /api/v1/instance/catalogue/{organisationId}/verifications/articles-sans-prix',
      critere:
        "Articles actifs sans prix dans aucune grille société active, pour leur unité vendable : 0 🟢 ; ≥ 1 🟠 avec leur nombre (ils rendront PAS_DE_PRIX à la commande, FR-C26, SM-5).",
    },
    {
      code: 'profils-complets',
      route: 'POST /api/v1/instance/catalogue/{organisationId}/verifications/profils-complets',
      critere:
        "Part des articles actifs dont le profil commercial a ses quatre champs renseignés (AUCUNE compte comme une réponse) : ≥ 80 % 🟢 ; < 80 % 🟠 avec la part (SM-4).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (refusée tant qu'un module qui en dépend est
  // installé, `MODULE_REQUIS_PAR`).
  avertissementDesinstallation:
    "Articles, grilles, promotions et prix des freelances restent enregistrés ; plus aucun prix ne sera résolu : une nouvelle commande rendra « pas de prix ». Les prix déjà figés sur les commandes ne changent pas.",

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/catalogue/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (noms proposés, figés par EPIC-065 et EPIC-074).
  routesLectureSeule: [
    'GET /api/v1/instance/catalogue/{organisationId}/export',
    'GET /api/v1/articles',
    'GET /api/v1/articles/{articleId}', // conditionnements, facteurs et leurs versions, profil, filiation
    'GET /api/v1/grilles',
    'GET /api/v1/grilles/{grilleId}/versions',
    'GET /api/v1/promotions',
    'POST /api/v1/resolutions', // ligne ou panier ; résout sans créer d'engagement (FR-C23, FR-C27)
    'GET /api/v1/mes-prix', // prix et marges du freelance connecté, et de lui seul (AD-6)
    'GET /api/v1/journal', // journal de la société ; auteur rendu par son identité (AD-7)
    'GET /api/v1/mon-journal', // journal freelance, lisible du seul propriétaire (AD-7)
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/catalogue/v1/… devant).
  routesInstance: {
    // Appelée par un utilisateur (instance:donnees:exporter) : SANS grilles freelance ni journal freelance
    // (NFR-4). Appelée par l'identité de service du moteur pour le dossier d'installation : complète, car le
    // dossier sert à restaurer ; [À CONFIRMER avec la spine du moteur : le dossier n'est jamais rendu lisible
    // à l'organisation, sinon les prix freelance doivent y être chiffrés pour leur seul propriétaire].
    export: 'GET /api/v1/instance/catalogue/{organisationId}/export',
    import: 'POST /api/v1/instance/catalogue/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/catalogue/{organisationId}/effacement', // un freelance effacé : ses grilles et son journal
    sante: 'GET /api/v1/instance/catalogue/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : schémas dans
  // prospera-plateforme/contrats/objets/catalogue/, écrits avec EPIC-161. Ordre de livraison : article avant
  // grille (une grille référence des articles).
  // - article : référence (clé de rapprochement, FR-C45b, jamais réattribuée, AD-1), nom, classification à
  //   deux niveaux, unité de base, conditionnements avec facteur ENTIER vers l'unité de base et ce qu'ils
  //   autorisent (achetable, stockable, vendable), identifiants externes, régime de taxe, profil commercial
  //   s'il existe (sinon PROFIL_ABSENT, jamais un profil neutre), état de cycle de vie. Régimes VIVANT
  //   (brouillon, actif, suspendu) et HISTORIQUE (retiré avant la reprise : l'historique des ventes y renvoie).
  //   Valeurs de contrôle : état de cycle de vie (etat), unité de base (etat). Doublons : référence, puis
  //   code-barres. Une version suivante du lot qui change l'unité de base rend REFUSE
  //   `UNITE_DE_BASE_IMMUABLE` (AD-2) ; un facteur changé crée une version, jamais une écriture en place.
  //   ⚠️ « Pâtes 500g (carton 20) » : le conditionnement en texte libre dans le nom (§1.2 du PRD) est à
  //   traduire par le gabarit en conditionnement chiffré ; le gabarit ne l'invente pas, la ligne sans facteur
  //   reste en écart.
  // - grille : grille société, version de départ, devise (XOF : zéro décimale), HT ou TTC, conditions (zone,
  //   catégorie de client, seuil de volume), priorité, période, prix par article ET par unité (aucun prix
  //   déduit d'un autre, AD-5). Régimes VIVANT (en vigueur) et HISTORIQUE (close). Valeur de contrôle : prix
  //   (montant) de chaque ligne.
  //   ⚡ Le « prix freelance » du fichier Sage du distributeur (spine de la Reprise AD-23 : « produits et prix,
  //   société, freelance ») est lu comme le prix AUQUEL le freelance achète : une grille société de catégorie
  //   de client « freelance » (FR-C32), visible de tous. Les prix que le freelance pratique chez ses
  //   détaillants ne sont jamais repris : la société ne les connaît pas et ne doit pas les voir (NFR-4) ; le
  //   freelance les saisit lui-même. [À CONFIRMER sur le fichier du distributeur.]
  // - Promotions : non reprises en février (aucune n'est demandée) ; une promotion en cours à la bascule se
  //   recrée dans Prospera [À CONFIRMER].
  objetsDeReprise: ['catalogue.article@1', 'catalogue.grille@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : « Produits et prix : Odoo, si les achats y
  // travaillent » (PRD Connecteurs FR-14). Le propriétaire se configure par organisation ; un seul point
  // d'écriture par domaine (§6 du contrat). Quand Odoo est propriétaire, une saisie dans Prospera devient un
  // mouvement en attente de confirmation (AD-11), et l'écran enveloppe l'article ou la grille dans
  // `<ProtectionObjet>`.
  // Un prix reçu porte sa `dateEffet` (sans elle : `DATE_EFFET_ABSENTE`, AD-4) et crée une version de grille ;
  // il ne touche jamais un prix figé sur un engagement (FR-C25). Les promotions et les prix freelance ne sont
  // pas échangés.
  domainesEchange: [
    {
      code: 'catalogue.articles',
      objets: ['catalogue.article@1'],
      sorte: 'OBJET_DATE',
      argent: false,
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'catalogue.echange.articles',
      publie: ['catalogue.article.changed@1'],
    },
    {
      code: 'catalogue.prix',
      objets: ['catalogue.grille@1'],
      sorte: 'OBJET_DATE',
      argent: false, // un prix de vente n'est pas un mouvement d'argent (spine de Connecteurs, AD-2)
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'catalogue.echange.prix',
      publie: ['catalogue.grille.publiee@1'],
    },
  ],
} as const;
