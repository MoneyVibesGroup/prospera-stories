// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M24 — Studio réseaux sociaux (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : prds/prd-distributeur-2026-11-12/prd.md, annexe A.6 (C1 → C13, tranchées) et §5.6 (FR-87 → FR-92).
// Le propriétaire du dépôt du service (à créer) le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD distributeur §5.6 « Studio réseaux sociaux » (FR-87 → FR-92, UJ-7 et UJ-1) ;
//              annexe A, préambule (conventions communes, format des droits, graphe des dépendances
//              validé par le PO le 2026-11-12) ; annexe B.2 (rôles × droits) ;
//              CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13, C7 amendé, C11) ; manifestes `stock`
//              (`stock.alerte.changed@1`), `commande` et `conquete-objectifs`.
//
// ⚠️ CODE À TIRET. `studio-social` ne passe PAS le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`, `TENANT_PERMISSION_FORMAT`). Ses droits sont écrits dans la forme ÉLARGIE
// `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement C7 du 2026-11-11). La story `auth-service` qui élargit le format se
// livre AVANT LA SEMAINE 5 : CE MODULE NE PEUT PAS ÊTRE INSTALLÉ AVANT ELLE. Chaque droit demande en outre
// une PR `auth-service` à la livraison (catalogue fermé de 13 codes, C7). Le profil de compose et les routes
// gardent le tiret du code ; seule la gate le remplace par `_` (`STUDIO_SOCIAL_NOT_ENTITLED`).
//
// ⚠️ HORS FÉVRIER (annexe A.6, C13 ; annexe B.2). Le module n'est pas ★ et n'est pas parmi ceux dont le
// client de février a besoin. Il dépend de comptes et d'API tiers (WhatsApp Business, Facebook, TikTok,
// Instagram, application Meta) qui ne sont pas branchés : « rien ne part automatiquement » (FR-89). Quand il
// sera livré, seules entrent la saisie manuelle d'un message et la publication à la main d'un post
// `A_PUBLIER_A_LA_MAIN` ; la réception automatique, la publication automatique et la réponse automatique
// sont des boutons « bientôt » (FR-89, FR-90, FR-91). Jamais un bouton qui simule (règle du PO).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle distributeur « Croissance & Équipes » et « Plateforme » (manifestes-a-produire.md, M24,
//   « Peut fusionner avec Marketing » [À CONFIRMER]). Le module n'est pas ★ ; ligne « n°10 » de la
//   colonne des solutions : « — (peut-être n°10) ».
// - Gate : `STUDIO_SOCIAL_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Écrans : module d'écran `studio-social` dans `prospera-app` (C8), tous les écrans par Dev B. Route
//   `/marketing/social` (hors février ; l'écran n'apparaît que si le module est installé). Entrées de menu :
//   « Calendrier » (`studio-social:publication:programmer`), « Boîte de réception »
//   (`studio-social:message:repondre`). « Valider et programmer » et « Envoyer » restent « bientôt » tant que
//   l'OAuth Meta n'est pas raccordé (C8). Le DG et le DC voient le calendrier en lecture seule (FR-87).
// - Rôles (annexe B.2) : `publication:programmer` et `message:repondre` = MARKETING ; `publication:valider` =
//   DG, DC ; `compte:connecter` = MARKETING, DIST_ADMIN.
// - Service porteur : service à créer [À CONFIRMER, M24] (nom de dépôt à fixer par le propriétaire du dépôt).
//   Le module écrit seul ses collections ; il lit les autres par leurs faits (C3 du contrat).
// - Cloisonnement : `organisationId` sur chaque lecture et écriture (graphie des nouveaux contrats, C5) ;
//   périmètre par compte social connecté (C2).
// - Données personnelles : les messages WhatsApp touchent des données de clients. Décision du PO du
//   2026-11-12 : conservation des messages et recueil du consentement suivent le PRD notification §9.2
//   (FR-25). Les jetons des comptes sont chiffrés (C3).
// - « Créer le lead » (FR-92) crée un prospect dans `conquete-objectifs` (source `SOCIAL`) ; sans ce module,
//   l'action devient « Copier les coordonnées » (FR-92). Le mécanisme (appel, fait) n'est pas tranché par
//   l'annexe A.6 : proposition en commentaire de `consomme`.
// - Une réponse WhatsApp part par le module `notification` (FR-91) : c'est un appel sortant, pas un fait
//   consommé ; il est couvert par `enrichiPar`.

export const MANIFESTE_STUDIO_SOCIAL = {
  code: 'studio-social',
  version: '1.0.0',

  // C1, annexe A.6 : aucune dépendance dure.
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent.
  // - marketing : rattachement d'un post à une campagne ; sans lui = `NON_INSTALLE` ;
  // - stock : « suggestions depuis le stock » (stock à écouler, FR-88) ; sans lui = `NON_INSTALLE` ;
  // - commande : ventes, ROI incrémental (FR-92) ; sans lui = `NON_INSTALLE` ;
  // - notification : la réponse WhatsApp part par ce module (FR-91) ; sans lui, « Envoyer » n'est pas
  //   actif, « Copier la réponse » reste offert ;
  // - recouvrement : retard de paiement, qui interdit la réponse automatique (FR-90, FR-91) ; sans lui, le
  //   garde-fou est `NON_INSTALLE`.
  enrichiPar: ['marketing', 'stock', 'commande', 'notification', 'recouvrement'],

  // Aucun numéro de compte ici.
  referentielFamilies: [],

  // C7, forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement du 2026-11-11). ⚠️ Aucun de ces droits n'est
  // accepté par le format actuel d'auth-service : la story d'élargissement est un PRÉREQUIS D'INSTALLATION
  // (à livrer avant la semaine 5). L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'studio-social:publication:programmer', // composer, modifier, replanifier, dupliquer, supprimer un post (FR-87)
    'studio-social:publication:valider', // « Valider et programmer » ; accord du DG au-dessus du seuil de remise (FR-89)
    'studio-social:compte:connecter', // connecter un compte social (jetons chiffrés ; « bientôt » en février)
    'studio-social:message:repondre', // boîte de réception : répondre, corriger l'intention, créer le lead (FR-90 → FR-92)
  ],

  // C5 : faits publiés et consommés. Noms de l'annexe A.6, à figer par la story de publication. Chaque fait
  // d'objet porte l'identifiant stable de l'objet, `organisationId` et un `rang` (point d'écriture unique, §6).
  publie: [
    'studio-social.publication.changed@1',
    'studio-social.message.recu@1',
    // Proposition (hors liste de l'annexe A.6) : `instance.journal@1`, fait de journal commun de la
    // plateforme (même nom chez stock, pdv et conquete-objectifs), porterait ici l'export, l'effacement, la
    // révocation des jetons et les validations. À confirmer par la story de publication. Le journal
    // d'activité des posts et des messages (FR-87) est une donnée du module.
    'instance.journal@1',
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version
    'kyc.status.changed',
    'stock.alerte.changed@1', // stock à écouler : source des propositions (FR-88) ; publié par `stock`
    // Pas encore de manifeste pour `marketing` ni `recouvrement` : les deux noms viennent de la ligne C5
    // de leur annexe A, non d'un manifeste publié à ce jour.
    'marketing.campagne.changed@1', // rattachement d'un post à une campagne (annexe A.6, C5)
    'recouvrement.dossier.changed@1', // client en impayé : réponse automatique interdite (FR-90, FR-91)
    // Proposition, non publiée par studio-social à ce jour et hors liste de l'annexe A.6 : le ROI incrémental
    // (lead → commande → CA, FR-92) lit `commande.commande.validee@1`, publié par `commande`, et le
    // prospect créé par « Créer le lead » se rattache à `conquete-objectifs.prospect.changed@1`, publié par
    // `conquete-objectifs`. Ni l'un ni l'autre ne figure dans la ligne C5 de A.6 : à confirmer par le
    // manifeste de ce module avant de les ajouter en version mineure. De même, `pdv.point-de-vente.changed@1`
    // pour le client « déjà client » (`PROSPECT_DEJA_CLIENT`, FR-92) : proposition.
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  // C10 : profil de compose avec le tiret du code.
  profilCompose: 'studio-social',

  // C13, point 1 : application Meta approuvée et jetons valides [À CONFIRMER] (annexe A.6, C13). Texte de
  // description et d'action proposé ; le libellé exact est à confirmer avec le PO.
  prerequis: [
    {
      code: 'application-meta',
      description:
        "Application Meta approuvée et jetons valides pour chaque compte social connecté (Facebook, Instagram ; WhatsApp Business ; TikTok) [À CONFIRMER, annexe A.6, C13]",
      action:
        "Créer et faire approuver l'application Meta de l'organisation, puis connecter chaque compte ; sans cela, les publications se font à la main et les messages se saisissent à la main.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'compte-joignable',
      route: 'POST /api/v1/instance/studio-social/{organisationId}/verifications/compte-joignable',
      critere:
        "Appel de test au réseau : ≤ 5 s 🟢 ; sans réponse en 5 s 🔴 « compte social injoignable » (annexe A.6, C13).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.6, C9). Rien n'est supprimé.
  avertissementDesinstallation:
    'Rien ne sera supprimé. Les jetons des comptes sociaux seront révoqués : à la réinstallation, il faudra reconnecter chaque compte.',

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/studio-social/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // La réponse automatique n'existe pas en février : texte et bouton retirés tant qu'aucun envoi réel n'est
  // branché (FR-91). L'interrupteur est déclaré par l'annexe A.6, C12.
  interrupteurs: ['reponse-automatique'],

  // C11 : IA déclarée (annexe A.6, noms de modèles et de finalités). Toute accroche générée porte sa
  // provenance et reste validée par un humain avant publication. En février, les accroches viennent de
  // gabarits et l'écran dit « proposé par modèle de texte » ; le mot « IA » n'est utilisé que si un assistant
  // génère réellement le texte (FR-88). La classification d'intention est faite par règles de mots-clés,
  // étiquetée « classement automatique » (FR-90). Le journal local des prédictions et corrections est une
  // donnée du module (C11, point 2).
  ia: {
    capacites: [
      'distributeur/accroches-posts@1',
      'distributeur/classification-messages@1',
    ],
    finalites: ['redaction-assistee', 'tri-de-la-boite'],
  },

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (noms proposés, figés par l'épic du module). Toute
  // écriture rend 403 `ABONNEMENT_EXPIRE`. Annexe A.6, C13 : « calendrier, export ». Proposition : la boîte
  // de réception et le journal se lisent aussi (consultation seule, FR-87, FR-90) ; à confirmer.
  routesLectureSeule: [
    'GET /api/v1/instance/studio-social/{organisationId}/export',
    'GET /api/v1/studio-social/calendrier', // publications par réseau et angle, vue liste et vue semaine (FR-87)
    'GET /api/v1/studio-social/messages', // [proposition] boîte de réception, sans réponse (FR-90)
    'GET /api/v1/studio-social/journal', // [proposition] journal d'activité des posts et des messages (FR-87)
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/studio-social/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/studio-social/{organisationId}/export',
    import: 'POST /api/v1/instance/studio-social/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/studio-social/{organisationId}/effacement', // tracé, avec certificat ; messages de clients = personnes
    sante: 'GET /api/v1/instance/studio-social/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 : aucun objet repris (annexe A.6, C13).
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 : aucun domaine d'échange (annexe A.6, C13).
  domainesEchange: [],
} as const;
