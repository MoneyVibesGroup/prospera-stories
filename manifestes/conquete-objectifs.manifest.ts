// Manifeste M13 — Conquête, territoires, objectifs et quotas (format du contrat de module, clause C1, amendée
// le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prds/prd-distributeur-2026-11-12/prd.md, annexe A.5 (C1 → C13, tranchées) et §5.5 (FR-76 → FR-86).
// Le propriétaire du dépôt du service (à créer) le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD distributeur §5.5 « Conquête, territoires, objectifs et quotas » (FR-76 → FR-86, UJ-7 et
//              UJ-1) ; annexe A, préambule (conventions communes, format des droits, graphe des dépendances
//              validé par le PO le 2026-11-12 : `reseau` ← `pdv` ← `conquete-objectifs`) ;
//              annexe B.2 (rôles × droits) ; manifestes `pdv` (FR-V06 dédoublonnage, FR-V15 pipeline) et
//              `reseau` (portée, zones, commerciaux) ; CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13, C7 amendé,
//              C11).
//
// ⚠️ CODE À TIRET. `conquete-objectifs` ne passe PAS le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`, `TENANT_PERMISSION_FORMAT`). Ses droits sont écrits dans la forme ÉLARGIE
// `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement C7 du 2026-11-11). La story `auth-service` qui élargit le format se
// livre AVANT LA SEMAINE 5 : CE MODULE NE PEUT PAS ÊTRE INSTALLÉ AVANT ELLE. Chaque droit demande en outre
// une PR `auth-service` à la livraison (catalogue fermé de 13 codes, C7). Le profil de compose et les routes
// gardent le tiret du code ; seule la gate le remplace par `_` (`CONQUETE_OBJECTIFS_NOT_ENTITLED`).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle distributeur « Croissance & Équipes » et « Plateforme » (manifestes-a-produire.md, M13 ;
//   l'offre IA de l'annexe A.5, C11, vient du cahier des charges de la démo). La conquête n'est pas ★ pour février : le rythme d'ouvertures visé se saisit en
//   objectifs (FR-84).
// - Gate : `CONQUETE_OBJECTIFS_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Écrans : module d'écran `conquete-objectifs` dans `prospera-app` (C8), tous les écrans par Dev B. Routes
//   `/prospection` et `/objectifs`. Entrées de menu : « Prospection » (`conquete-objectifs:prospect:gerer`),
//   « Objectifs » (`conquete-objectifs:objectif:consulter`). « Transférer » (passation) et le recensement de
//   zone sur carte (fond Google Maps, décision du PO du 2026-11-12 : FR-76) sont exigés en février.
//   « Simuler une réallocation » et le rendu d'un arbitrage sont « bientôt » (§5.5, boutons de la démo).
// - Rôles (annexe B.2) : `prospect:gerer` = PROSPECTION, RESP_VENTES ; `zone-blanche:recenser` et
//   `passation:declarer` = PROSPECTION ; `objectif:definir` = DC, RESP_VENTES (sa région), DIST_ADMIN ;
//   `objectif:consulter` = DG, DC, RESP_VENTES, CONTROLE_GESTION, et PROSPECTION pour les siens.
// - Service porteur : service à créer (nom de dépôt à fixer par le propriétaire du dépôt). Le module écrit
//   seul ses collections ; il lit les autres par leurs faits (C3 du contrat).
// - Cloisonnement : `organisationId` sur chaque lecture et écriture (graphie des nouveaux contrats, C5) et
//   portée de zone lue dans `reseau.portee.changed@1`, fail-closed : sans portée projetée, une lecture
//   rend zéro enregistrement ; un chargé de prospection ne voit que son territoire (C2).
// - Un prospect est un point de vente à l'état `PROSPECT` du module `pdv` (FR-76) : le module en tient le
//   DOSSIER de conquête, pdv reste propriétaire du point de vente. L'ouverture ne crée aucun point de vente
//   (FR-80). Le score 0 à 100 d'un prospect est le score de santé de son point de vente, déposé par une règle
//   de `dashboard` (FR-77) : le module le lit, il ne le calcule pas.
// - Les garde-fous de première commande sont posés ICI et appliqués par `commande` à la validation (FR-79,
//   `PLAFOND_PREMIERE_COMMANDE`) ; le fait qui porte leur valeur courante à `commande` (proposition) est à
//   nommer par le manifeste de `commande`.

export const MANIFESTE_CONQUETE_OBJECTIFS = {
  code: 'conquete-objectifs',
  version: '1.0.0',

  // C1, validées par le PO le 2026-11-12 (annexe A, préambule) : reseau puis pdv.
  depends: [
    {
      code: 'reseau',
      raison: 'Zones, zones blanches et portée viennent du réseau.',
    },
    {
      code: 'pdv',
      raison: 'Prospects, ouvertures et passation concernent des points de vente.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent.
  // - commande : première commande livrée (FR-80), réachat M+1 et M+3 (FR-81) ; sans lui, l'atterrissage et
  //   la première commande s'écrivent `NON_INSTALLE`, jamais 0 % ni 100 % ;
  // - facturation : chiffre d'affaires réalisé, marge cumulée, mix et distribution numérique (FR-82, FR-85,
  //   FR-86) ; sans lui, l'atterrissage s'écrit `NON_INSTALLE` ;
  // - terrain : visites du prospect, prochaine action portée dans la tournée du chargé (FR-77) ; sans lui,
  //   « visites du prospect » = `NON_INSTALLE` ;
  // - equipe : commerciaux et leur classement (FR-83, FR-84).
  enrichiPar: ['commande', 'facturation', 'terrain', 'equipe'],

  // Aucun numéro de compte ici : la marge et le chiffre d'affaires se lisent chez facturation.
  referentielFamilies: [],

  // C7, forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement du 2026-11-11). ⚠️ Aucun de ces droits n'est
  // accepté par le format actuel d'auth-service : la story d'élargissement est un PRÉREQUIS D'INSTALLATION
  // (à livrer avant la semaine 5). L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'conquete-objectifs:prospect:gerer', // carnet de prospects : créer, faire avancer, marquer perdu, retirer avec motif (FR-77, FR-80)
    'conquete-objectifs:zone-blanche:recenser', // recenser un commerce, changer le statut d'une zone avec motif (FR-76)
    'conquete-objectifs:passation:declarer', // « Transférer » une ouverture au commercial du secteur, l'annuler (FR-83)
    'conquete-objectifs:objectif:definir', // fixer et répartir objectifs et quotas par zone, commercial, point de vente (FR-84)
    'conquete-objectifs:objectif:consulter', // objectifs, atterrissage, mix, marge ; un commercial lit les siens (FR-84 → FR-86)
  ],

  // C5 : faits publiés et consommés. Noms de l'annexe A.5, à figer par la story de publication. Chaque fait
  // d'objet porte l'identifiant stable de l'objet, `organisationId` et un `rang` (point d'écriture unique, §6).
  publie: [
    'conquete-objectifs.prospect.changed@1',
    'conquete-objectifs.passation.effectuee@1',
    'conquete-objectifs.objectif.changed@1',
    // Proposition (hors liste de l'annexe A.5) : `instance.journal@1`, fait de journal commun de la
    // plateforme (même nom chez stock et pdv), porterait ici les dérogations aux garde-fous (FR-79), les
    // changements de statut de zone, l'export et l'effacement. À confirmer par la story de publication.
    'instance.journal@1',
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version
    'kyc.status.changed',
    'reseau.noeud.created@1', // zones (annexe A.5, C5)
    'reseau.portee.changed@1', // fail-closed : suite de conformité de reseau jouée en CI, inscription au registre
    'pdv.point-de-vente.changed@1', // état `PROSPECT`, affectation, nature
    'commande.commande.validee@1', // première commande, réachat M+1 et M+3 (FR-80, FR-81)
    'facturation.facture.emise@1', // chiffre d'affaires réalisé, marge, mix (FR-82, FR-85, FR-86)
    // Proposition, à confirmer avec les manifestes de commande, terrain et reseau : la LIVRAISON de la
    // première commande (FR-80 : « livrée », pas « saisie »), la visite clôturée (FR-77) et le commercial
    // destinataire d'une passation (FR-83, `reseau.commercial.changed@1`) n'ont pas de fait dans la liste de
    // l'annexe A.5 ; ils s'ajoutent en version mineure quand ces manifestes les nomment.
  ],

  // C10 : profil de compose avec le tiret du code.
  profilCompose: 'conquete-objectifs',

  // C13, point 1 : rien d'extérieur. `reseau` et `pdv` sont des dépendances dures (`depends`) que le moteur
  // vérifie avant ; l'annexe A.5 les cite aussi comme prérequis. Le recensement sur carte (FR-76) suppose le
  // fond de carte Google Maps ; pdv déclare déjà le prérequis `fond-de-carte` pour la même clé, il n'est pas
  // redéclaré ici (proposition, hors annexe).
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'zones-chargees',
      route: 'POST /api/v1/instance/conquete-objectifs/{organisationId}/verifications/zones-chargees',
      critere:
        "Zones lues dans reseau et projetées : ≥ 1 🟢 ; 0 🔴 « aucune zone à conquérir ni à doter d'un objectif » (annexe A.5, C13).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.5, C9). Rien n'est supprimé.
  avertissementDesinstallation:
    'Les objectifs et prospects ne seront plus accessibles ; leurs données sont conservées.',

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/conquete-objectifs/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: ['passation-automatique'],

  // C11 : IA déclarée (annexe A.5). Noms de modèles et de finalités PROPOSÉS, issus de l'offre « scoring
  // prospects, suggestions d'allocation » des cahiers des charges de la démo (bundle Croissance et
  // Opérations), modifiables avant le manifeste. Une allocation de quota suggérée reste une proposition :
  // l'objectif est fixé par un humain qui détient `objectif:definir` (FR-84, FR-85 : « une proposition, pas
  // une action »). Le journal local des prédictions et corrections est une donnée du module (C11, point 2).
  ia: {
    modeles: ['scoring-prospects', 'allocation-quotas'],
    finalites: ['priorisation-prospects', 'suggestion-allocation'],
  },

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (noms proposés, figés par l'épic du module). Toute
  // écriture rend 403 `ABONNEMENT_EXPIRE`. Consultation et export seulement (annexe A.5, C13).
  routesLectureSeule: [
    'GET /api/v1/instance/conquete-objectifs/{organisationId}/export',
    'GET /api/v1/conquete-objectifs/zones', // zones de conquête, statut, recensement, conversion (FR-76)
    'GET /api/v1/conquete-objectifs/prospects', // carnet, sous portée (FR-77)
    'GET /api/v1/conquete-objectifs/entonnoir', // entonnoir et goulot (FR-78)
    'GET /api/v1/conquete-objectifs/ouvertures', // survie M+1 et M+3, valeur nette (FR-81, FR-82)
    'GET /api/v1/conquete-objectifs/passations', // file de passation, orphelines (FR-83)
    'GET /api/v1/conquete-objectifs/objectifs', // objectifs et historique (FR-84)
    'GET /api/v1/conquete-objectifs/atterrissage', // projection de fin de mois, arbitrages proposés (FR-85)
    'GET /api/v1/conquete-objectifs/mix', // mix produit, marge, distribution numérique (FR-86)
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/conquete-objectifs/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/conquete-objectifs/{organisationId}/export',
    import: 'POST /api/v1/instance/conquete-objectifs/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/conquete-objectifs/{organisationId}/effacement', // tracé, avec certificat ; contacts des prospects = personnes
    sante: 'GET /api/v1/instance/conquete-objectifs/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 : aucun objet repris en février. Les prospects ne sont pas repris : la
  // reprise demandée par le PO porte sur clients, articles, tarifs, factures ouvertes et numérotation
  // (annexe A.5, C13 ; brain dump, §2). Un fichier d'objectifs en CSV (FR-84) est une reprise à part, dont le
  // format est « fixé au manifeste de reprise des objectifs » : hors de ce manifeste.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 : aucun domaine d'échange (annexe A.5, C13).
  domainesEchange: [],
} as const;
