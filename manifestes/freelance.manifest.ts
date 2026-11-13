// Manifeste M42 — Réseau freelance (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : PRD distributeur (prds/prd-distributeur-2026-11-12), annexe A.7, treize clauses C1 → C13 tranchées.
// Le propriétaire du dépôt `pdv-service` (hôte du module, D-24) le copie dans `src/module.manifest.ts` la
// semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD distributeur §5.7 (FR-93 → FR-99), FR-8 (droit explicite de la direction), FR-33 et FR-45,
//              FR-52 et FR-224 (facture du freelance), FR-247 (Créance dont le tiers est le freelance),
//              NFR-4 (étanchéité des prix freelance) ; PRD catalogue FR-C28, FR-C29, FR-C29b, FR-C30 ;
//              PRD pdv FR-V09, FR-V12 ; spine de la Reprise (AD-2 : un module sans objet repris déclare `[]`),
//              spine de Connecteurs (AD-2 : `domainesEchange: []`).
// Dépendances dures validées par le PO le 2026-11-12 (annexe A.7, C1) : `catalogue` et `pdv`.
//
// ✅ DÉCISION DU PO (2026-11-13, D-24 du PRD distributeur, 20e séance de la salle) :
// - MODULE INSTALLABLE (code `freelance`, gate `FREELANCE_NOT_ENTITLED`, ce manifeste), VENDU comme add-on
//   (forfait plus prix par freelance actif). Un freelance n'est pas obligatoire dans une société (Dev B) ; FR-99
//   le dit : « sans lui, le type de commercial FREELANCE n'est pas proposé ». Comme Odoo : la case des
//   Paramètres que voit le client installe un module (`sale_margin`, commissions d'agents OCA).
// - Alternative écartée : « option de pack » (droits et profil portés par `catalogue`/`pdv`) : sans code de
//   module, ni gate, ni « non installé », ni compteur par freelance actif.
// - HÉBERGÉ dans `pdv-service` (pas de dépôt neuf : ~13 points de socle évités) : le portefeuille d'un
//   freelance est un portefeuille de points de vente et la révélation au départ est déjà dans pdv (AD-5).
//   Ses collections (statut, commissions, classement) restent les SIENNES, derrière sa gate : exception au
//   critère du §4 du contrat (« un agrégat distinct, un service distinct »), à ÉCRIRE dans la spine du
//   distributeur, sans quoi la garde de câblage rougit.
// - `catalogue`, `reseau` et `pdv` listent `freelance` en `enrichiPar` : sans lui, grilles et écran « Mes
//   prix », statut indépendant et révélation sont `NON_INSTALLE`.
// - Compteur de l'add-on : `freelance.freelance.active@1`, lu par `paiement` (facturation des abonnements
//   Prospera, même gate que paiement) pour « prix par freelance actif ».
//
// Décisions du PO du 2026-11-12, déjà dans le PRD : le freelance VEND POUR LE COMPTE de la société, il
// n'achète pas de stock ; deux prix (ex. 14 000 F société, 15 000 F freelance) ; la société voit 14 000 F et
// verse une commission sur 14 000 F ; la marge du freelance et ses prix au détaillant ne sont JAMAIS lisibles
// par la société ; ses prix appartiennent à `catalogue` ; ses factures et créances vivent dans `facturation`
// et `paiement` (périmètre « freelance »), jamais ici.
//
// Hors manifeste, pour mémoire :
// - Offre : add-on, option des 4 bundles distributeur (Grand et Moyen), ligne M42 de manifestes-a-produire.md.
//   Livraison Dev B, lot 4 (04/12/2026).
// - Écrans : module d'écran `freelance` dans `prospera-app` (C8), `src/modules/freelance/`, tous les écrans par
//   Dev B : cockpit du freelance (`DashboardFreelance`), « Mon portefeuille », « Mes ventes » (ventes pour le
//   compte de la société, prix société dû, commission). « Mes prix » est servi par `catalogue` (aucun droit :
//   il exige d'être le propriétaire, AD-6 de catalogue). « Mes commandes grossiste » n'existe pas : le
//   freelance n'achète pas de stock (FR-96). La marge n'est visible que du freelance (FR-195). Entrées de menu
//   proposées : « Mon portefeuille » (`freelance:portefeuille:consulter`), « Mes ventes »
//   (`freelance:creance:consulter` ou `freelance:commission:consulter`), « Classement »
//   (`freelance:classement:consulter`), « Réseau freelance » côté société (`freelance:freelance:activer`).
//   Bouton de la démo : « Simulateur de marge » = « bientôt » (§5.7). Aucun blocage d'une proforma sous marge
//   minimale : avertissement seul (FR-93).
// - Rôles proposés (annexe B.2, à confirmer avec les rôles du vertical) :
//   · `freelance:portefeuille:consulter` : FREELANCE (le sien) ;
//   · `freelance:creance:consulter` : FREELANCE (les siennes) ;
//   · `freelance:commission:consulter` : FREELANCE (la sienne) ; DG, DC, DAF par droit explicite (FR-8) ;
//   · `freelance:classement:consulter` : DG, DC, RESP_VENTES ; FREELANCE (le sien) ;
//   · `freelance:freelance:activer` : DC, DIST_ADMIN.
// - Service porteur : `pdv-service` (hôte, D-24), derrière la gate `freelance` ; pas de dépôt propre.
// - Cloisonnement (C2) : par `organisationId` ET par freelance, le plus strict du produit ; deux freelances ne
//   se voient pas (FR-C30). Gate : refus `FREELANCE_NOT_ENTITLED`, 403 sans donnée. Un point de vente hors
//   portefeuille : `PDV_HORS_PERIMETRE` ; déjà affecté à un autre portefeuille : `PDV_DEJA_AFFECTE` (FR-95).
//   La société ne voit ni les prix au détaillant ni la marge d'un freelance (FR-94, FR-C29).
// - Les données possédées (C3) : statut de l'indépendant (activation, départ), classement séparé, commissions
//   (taux × montant HT AU PRIX SOCIÉTÉ de ses ventes, acquises à la facturation ; statuts ACQUISE, VALIDEE,
//   VERSEE), paramètres du freelance (taux, plafond de crédit, marge minimale, régime fiscal, série de
//   facturation), reversements (suivi du dû par période). Le stock reste à la société jusqu'à la livraison au
//   détaillant. Lues seulement ailleurs : commandes (`commande`), relevés et dû (`facturation`, `paiement`).
//   ⛔ Ses prix au détaillant appartiennent à `catalogue`, jamais ici : aucun champ de ce module ne porte un
//   prix freelance ni une marge, pas même dans un fait publié ou dans `instance.journal@1`.
// - Le dû du freelance est une Créance de `paiement` dont le tiers est le freelance (FR-247) ; ses factures à
//   ses détaillants vivent dans `facturation` (une série de numérotation propre à chaque freelance émetteur,
//   FR-224) et leurs créances dans `paiement`, périmètre « freelance », invisibles de la société.

export const MANIFESTE_FREELANCE = {
  code: 'freelance',
  version: '1.0.0',

  // C1 : catalogue et pdv sont des dépendances DURES, validées par le PO le 2026-11-12.
  depends: [
    {
      code: 'catalogue',
      raison:
        'Le freelance vend les articles de la société au prix société et fixe son propre prix au détaillant (FR-C28).',
    },
    {
      code: 'pdv',
      raison: 'Le portefeuille du freelance est un ensemble de points de vente.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par
  // dépendance de `enrichiPar`. Liste de l'annexe A.7 C1 : commande, facturation, paiement, terrain, equipe.
  // - commande : vente du freelance servie par le stock de la société ; absent, ventes du freelance =
  //   `{ etat: NON_INSTALLE, module: commande }` (A.7 C4) ;
  // - facturation : facture émise par le freelance à son détaillant ; absent, commissions = `NON_INSTALLE`
  //   (A.7 C4 : `commande`/`facturation` absents, ventes et commissions du freelance) ;
  // - paiement : prix société dû par le freelance, créances de son espace propre ; absent, dû = `NON_INSTALLE` ;
  // - terrain : le freelance saisit sa vente comme toute commande terrain (FR-96) ; absent, seules les ventes
  //   du bureau existent ;
  // - equipe : classement séparé des freelances ; absent, classement = `NON_INSTALLE` (code catalogue `equipe`
  //   déprécié, à réactiver, ligne M21 de manifestes-a-produire.md).
  enrichiPar: ['commande', 'facturation', 'paiement', 'terrain', 'equipe'],

  // Aucun numéro de compte ici : le module ne passe aucune écriture (la facture et le grand livre sont ailleurs).
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.7 C7). Chaque droit demande une PR
  // `auth-service` à la livraison du module (catalogue de droits à enum fermé). Aucun droit ne donne à la
  // société la lecture des prix au détaillant ni de la marge d'un freelance (FR-94, FR-C29) : la direction
  // lit des mesures de la société (CA au prix société, dû, règlements, commission), jamais la marge.
  droits: [
    'freelance:portefeuille:consulter', // le sien (FR-95)
    'freelance:creance:consulter', // les siennes : dû à la société, reversements (FR-97, FR-98)
    'freelance:commission:consulter', // la sienne ; la direction par droit explicite, jamais la marge (FR-98, FR-8)
    'freelance:classement:consulter', // classement séparé des salariés ; score propre, ou score vu de la société (FR-99)
    'freelance:freelance:activer', // activer, désactiver un freelance ; sert à compter l'add-on (FR-93, FR-99)
  ],

  // C5 : faits publiés et consommés (annexe A.7 C5). Noms de l'annexe, à figer par la story de publication.
  // Chaque fait d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`. ⛔ Aucun fait
  // ne porte un prix freelance ni une marge. Le départ d'un freelance n'a qu'une source, `pdv.commercial.parti@1`.
  publie: [
    'freelance.freelance.active@1', // activation d'un commercial en freelance ; COMPTEUR de l'add-on, lu par paiement (abonnements, D-24) ; facturation, equipe le lisent
    'freelance.commission.acquise@1', // base : prix société facturé (FR-98) ; jamais le prix freelance
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] activations, désactivations, export, effacement ; AUCUN prix freelance
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'reseau.commercial.changed@1', // le commercial de type FREELANCE, son compte, son statut indépendant
    'pdv.commercial.parti@1', // seule source du départ d'un freelance
    'catalogue.profil.changed@1', // profil commercial ; publié par catalogue (ligne C5 de l'annexe A.7)
    'facturation.facture.emise@1', // vente facturée du freelance : acquisition de la commission (FR-98)
    // Absents de la ligne C5 de l'annexe A.7. Propositions à figer par la story de consommation, sans quoi
    // `freelance:creance:consulter` (dû, réglé, restant, retard : FR-97, FR-98) et le passage de la commission
    // à VERSEE n'ont pas de source :
    // ✅ Noms fixés le 2026-11-13 (décision du PO, 21e séance) et publiés par le manifeste `paiement` :
    'paiement.creance.changed@1', // dû, réglé, restant, retard du freelance (tiers = freelance, FR-97, FR-98)
    'paiement.ordre-versement.changed@1', // EXECUTE ⇒ commission VALIDEE → VERSEE (FR-98) ; motif `ordre-<nature>` de la microfinance
  ],

  // C10 : `profiles: ["freelance"]`, socle + `catalogue` + `pdv` + `reseau` (annexe A.7).
  profilCompose: 'freelance',

  // C13, point 1 : l'annexe A.7 écrit « Prérequis : `catalogue`, `pdv` » ; ce sont les dépendances dures de
  // `depends`, que le moteur installe et contrôle. Aucun prérequis extérieur (comme commande et stock).
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Nom de la
  // vérification de l'annexe A.7 ; route proposée (convention commune : `verifications/<code>`).
  verifications: [
    {
      code: 'etancheite-prix',
      route: 'POST /api/v1/instance/freelance/{organisationId}/verifications/etancheite-prix',
      critere:
        "Un compte « société » du jeu de contrôle reçoit 0 champ de prix de revente sur 20 requêtes d'API : 🟢 ; sinon 🔴 avec la route et le champ en cause (FR-94, FR-C29).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.7). Rien supprimé ; au départ d'un
  // freelance, la révélation des prix suit le seul processus de `pdv` (`pdv.commercial.parti@1`).
  avertissementDesinstallation:
    "Désinstaller l'add-on ne révèle aucun prix à la société.",

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/freelance/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `activation-par-freelance` : facturation de l'add-on par freelance actif (A.7 C12). Comportement
  // seulement, jamais la forme des données.
  interrupteurs: ['activation-par-freelance'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE. L'annexe A.7 ne nomme aucune route ; tous les noms
  // sont des propositions, à figer par la story d'API. Chaque réponse est celle du freelance connecté, et de
  // lui seul (FR-C30) ; aucune ne porte un prix freelance ni une marge côté société (FR-94). Quand l'add-on
  // est désactivé, le portefeuille est figé en lecture seule (FR-95).
  routesLectureSeule: [
    'GET /api/v1/mon-portefeuille', // [proposition] points de vente du freelance connecté (FR-95)
    'GET /api/v1/mes-commissions', // [proposition] commissions du freelance connecté (FR-98)
    'GET /api/v1/mes-reversements', // [proposition] dû, réglé, restant, retard (FR-97, FR-98)
    'GET /api/v1/freelances', // [proposition] vue société : statut, activation, mesures de la société SEULEMENT (FR-94)
    'GET /api/v1/freelances/classement', // [proposition] classement séparé, score vu de la société ou score propre (FR-99)
    'GET /api/v1/instance/freelance/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/freelance/v1/… devant).
  routesInstance: {
    // L'export de la société EXCLUT les prix du freelance au détaillant et les factures qu'il émet (FR-C29) ;
    // l'export du freelance lui est propre (annexe A.7 C13). Statut, commissions et dû sans prix freelance.
    export: 'GET /api/v1/instance/freelance/{organisationId}/export',
    import: 'POST /api/v1/instance/freelance/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/freelance/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/freelance/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : aucun objet repris (A.7 C13). Les freelances naissent
  // à l'invitation, jamais par la reprise (voir facturation) ; le « prix freelance » du fichier Sage est lu par
  // `catalogue` comme une grille société de catégorie freelance.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : vide, et pour toujours (A.7 C13) : les prix du
  // freelance ne sortent pas.
  domainesEchange: [],

  // C11 : pas de champ `ia`. Sans objet au premier jour (A.7 C11) : « recommandation de prix client » et
  // « marge optimale » (offre) supposeraient d'apprendre sur des prix que la société n'a pas le droit de voir
  // (FR-C29). Aucune finalité d'apprentissage ne lit un prix de freelance ; tout modèle futur exige une
  // décision du PO et un consentement du freelance.
} as const;
