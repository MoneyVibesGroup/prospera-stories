// Manifeste M01 — Réseau, agences & zones (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Le propriétaire du dépôt `reseau-service` (à créer) le copie dans `src/module.manifest.ts` la semaine où il
// y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-reseau-zones-2026-08-02 (FR-R01 → FR-R40, NFR-1 → NFR-6) ;
//              spine architecture/architecture-reseau-service-2026-08-15 (AD-1 → AD-15) ;
//              épics epics-reseau-2026-08-15.md (EPIC-044 → 053) ;
//              contrat de module §5 (ce que `reseau` pose en semaine 1) ;
//              spine de la Reprise (AD-2, AD-4, AD-23), spine de Connecteurs (AD-2, AD-3, AD-11), PRD
//              Connecteurs FR-14 (commerciaux : Prospera propriétaire, [A-8]).
//
// Hors manifeste, pour mémoire :
// - Offre : commun aux trois projets (distributeur, microfinance, assurance) ; bundles « Croissance &
//   Opérations » (microfinance) et « Plateforme » (distributeur) [À CONFIRMER, manifestes-a-produire.md, M01].
// - Écrans : module d'écran `reseau` dans `prospera-app` (C8), tous les écrans par Dev B. Chaque entrée de menu
//   exige un des droits ci-dessous.
// - C11 : sans objet. Le fournisseur de candidats (FR-R34) expose des faits (zones blanches, nœuds sans
//   responsable, agences fermées avec rattachements actifs) ; il ne calcule ni score ni jugement (AD-13).
// - Rôles du socle distributeur (STORY-166), proposition à confirmer avec les rôles du vertical :
//   superviseur et responsable des ventes = `reseau:noeud:consulter` ; DC = + `reseau:noeud:modifier`,
//   `reseau:affectation:modifier`, `reseau:decoupage:modifier` ; DG = + `reseau:portee:attribuer`, le droit le
//   plus sensible du module, borné par la portée de celui qui l'exerce (FR-R36, AD-8).
// - « Portée » est un homonyme : `PorteeReseau` (ici) n'est jamais `PorteeDossier` (dossier-service). Tout
//   nom porte `reseau` (AD-15).
// - Import du réseau par fichier propre au module (FR-R37) : GARDÉ pour le moment (décision du PO,
//   2026-11-12), comme FR-V40 de pdv ; remplacé par la Reprise « au bon moment ». D'ici là, il passe par le
//   même point d'écriture que la reprise (compte rendu avant persistance, tout ou rien).
//
// ⚡ L'objet « commercial » (VALIDÉ par le PO le 2026-11-12, « pour le moment » ; amende le PRD reseau, voir
// FR-R23 ci-dessous).
// - Le besoin : la Reprise de février apporte des commerciaux (spine de la Reprise AD-23 : « commerciaux →
//   reseau, à confirmer ») et pdv rattache chaque point de vente à son commercial. Or un commercial repris n'a
//   pas encore de compte : les comptes vivent dans auth-service, qui ne reçoit pas de reprise.
// - La réponse : reseau reçoit un objet `commercial`. Il porte la personne À INVITER (prénom, nom, e-mail,
//   téléphone, statut salarié ou indépendant) et ses affectations à des zones, datées (FR-R20). Le compte est
//   créé ENSUITE, par invitation. pdv rattache le point de vente à l'identifiant stable du commercial, jamais
//   à un compte.
// - Le lien au compte : l'administrateur invite depuis l'écran « Commerciaux à inviter » de reseau ; l'écran
//   appelle `POST /users` d'auth-service avec le jeton de l'administrateur (TENANT_ADMIN). Aucun appel de
//   service à service : reseau n'appelle jamais auth-service, et auth-service n'appelle jamais reseau (AD-5).
//   L'invitation publie `identity.user.registered` (e-mail en minuscules) et `identity.membership.changed`
//   dans la même transaction (vérifié dans auth-service, invitation.service.ts) ; reseau les consomme et lie
//   le commercial au compte par (organisation, e-mail), ou (organisation, téléphone) pour une invitation par
//   SMS. État du compte : `A_INVITER`, `INVITE`, `ACTIF`, `SUSPENDU`, ou `SANS_CONTACT` (ni e-mail ni
//   téléphone : il reste listé, ses points de vente restent rattachés, il ne se connecte pas).
// - ⚡ Invitation par SMS (décision du PO, 2026-11-12) : un commercial qui n'a qu'un téléphone est invité par
//   SMS ; l'e-mail reste facultatif dans le gabarit de reprise. Travail dans auth-service : STORY-900 (PR
//   prospera-stories #416), non slottée, entre au planning avec STORY-365 (l'invitation n'existe aujourd'hui que par e-mail, `InviteUserDto.email` obligatoire). Ce que le code
//   montre au 2026-11-12 :
//   · `User.email` est obligatoire, unique, et c'est l'identifiant de connexion (`POST /auth/login`) ; le
//     téléphone (`User.phone`, STORY-123) est facultatif et non unique ⇒ il faut un identifiant de connexion
//     par téléphone (normalisé E.164, unique) et l'e-mail facultatif ;
//   · le jeton porte `emailVerified`, exigé par la gate de chaque service (`emailVerified` + KYC + droit au
//     module) ⇒ un téléphone vérifié à l'acceptation doit valoir vérification, sinon le commercial invité par
//     SMS est refusé partout ; c'est le point le plus large de la story ;
//   · le lien d'invitation part par SMS via notification-service (MV détient le module `notification`) ;
//     le mot de passe oublié suit le même canal ;
//   · `identity.user.registered` doit porter le téléphone, pour que reseau lie le commercial au compte.
//   Jusqu'à STORY-900, un commercial sans e-mail reste `A_INVITER` : rattaché, sans connexion.
// - Pas d'invitation automatique : aucune invitation ne part pendant une simulation, ni dans l'espace d'essai
//   (un prospect de la démo du 15/01 ne doit pas écrire à quarante commerciaux), ni à la livraison. Inviter
//   est un acte humain, après le feu vert.
// - FR-R23 (« ce module ne gère pas les personnes ») est amendé, pas contredit : reseau garde les seules
//   coordonnées nécessaires à l'invitation ; dès que le compte existe, le nom et l'e-mail affichés viennent du
//   read-model `identity.*`, et la fiche ne porte plus que le rattachement. Contrat, carrière et performance
//   restent au module Équipe & performance (#18).

export const MANIFESTE_RESEAU = {
  code: 'reseau',
  version: '1.0.0',

  // C1, §5 du contrat : aucune dépendance dure. pdv dépend de reseau (premier `MODULE_DEPENDANCE_MANQUANTE`) ;
  // désinstaller reseau tant que pdv est installé est refusé (`MODULE_REQUIS_PAR`, contrat Q2).
  depends: [],

  // C4 : la couverture d'une zone se compte avec ce que les autres modules y rattachent (FR-R31, AD-13).
  // Sans eux, le compte est déclaré vide (`NON_INSTALLE`), jamais 0 : une zone n'est pas « blanche » parce que
  // le module qui y rattache des lieux est absent.
  // - pdv : points de vente rattachés à une zone, et commerciaux qui portent un portefeuille ;
  // - stock : entrepôts et magasins propres rattachés, avec leur rôle de desserte (FR-R17).
  // Le §5 du contrat écrivait `enrichiPar: []` pour le squelette de la semaine 1 ; la couverture arrive avec
  // l'incrément 3 (EPIC-051, EPIC-052).
  // - freelance (décision du PO du 2026-11-13, D-24 du PRD distributeur, FR-99) : sans lui, le statut « indépendant » d'un commercial n'est PAS
  //   proposé (seul « salarié » l'est) ; un commercial indépendant déjà enregistré reste lisible, marqué
  //   « module freelance non installé ».
  enrichiPar: ['pdv', 'stock', 'freelance'],

  // Pas de référentiel national de localités au v1 : la résolution par localité (FR-R18b) s'appuie sur les
  // localités que l'organisation déclare sur ses zones (FR-R02, Q4 : liste de localités au v1).
  referentielFamilies: [],

  // C7 : droits de tenant, les cinq de FR-R35, rien de plus.
  droits: [
    'reseau:noeud:consulter', // hiérarchie, zones, agences, affectations, commerciaux, couverture
    'reseau:noeud:modifier', // créer, modifier, fermer, déplacer un nœud ; rattacher un lieu (FR-R14, FR-R16)
    'reseau:decoupage:modifier', // scission, fusion, transfert ; crée une version de découpage (FR-R05, AD-4)
    'reseau:affectation:modifier', // affecter une personne ou un commercial, nommer un responsable (FR-R20, FR-R21)
    'reseau:portee:attribuer', // le droit le plus sensible, borné par la portée de celui qui l'exerce (AD-8)
  ],

  // C5 : faits publiés et consommés. Noms de la spine (événements publiés), suffixés @1 ; les deux faits du
  // commercial sont nouveaux, à figer par la story de publication (EPIC-050, EPIC-053). Chaque fait d'objet
  // porte l'identifiant stable de l'objet, un `rang` (point d'écriture unique, §6) et la version de découpage
  // en vigueur (AD-4 : elle voyage dans la charge utile, jamais à aller chercher).
  publie: [
    'reseau.noeud.created@1',
    'reseau.noeud.moved@1',
    'reseau.noeud.closed@1',
    'reseau.decoupage.versionne@1', // scission, fusion, transfert (AD-4)
    'reseau.responsable.changed@1', // FR-R21
    'reseau.portee.changed@1', // état absolu, clé (organisationId, userId) ; « totale » est une valeur (AD-5, AD-6)
    'reseau.commercial.changed@1', // état absolu : identité à inviter, état du compte, userId lié, affectations datées
    'instance.journal@1', // portées attribuées ou retirées, redécoupages, affectations, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe ; lie le commercial au compte (user.registered, membership.changed)
    'kyc.status.changed',
    'pdv.point-de-vente.changed@1', // zone du point de vente : rattachement par référence, couverture (AD-12, AD-13)
    'connecteurs.domaine.changed@1', // propriétaire du domaine reseau.commerciaux (spine de Connecteurs, AD-3)
    // Les faits de stock (entrepôt, magasin propre et leurs zones desservies) s'ajoutent en version mineure
    // quand le manifeste de stock les nomme.
  ],

  profilCompose: 'reseau',

  // C13, point 1 : rien d'extérieur. Pas de fond de carte ici : la carte des zones blanches s'affiche dans
  // l'écran de couverture avec le fond de carte de pdv (Google Maps) ; sans lui, la liste reste utilisable.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'portees-totales',
      route: 'POST /api/v1/instance/reseau/{organisationId}/verifications/portees-totales',
      critere:
        "Portées « totales » attribuées à des utilisateurs non plateforme : 0 🟢 ; ≥ 1 🔴 avec leurs noms (CM-2 : seuil à zéro, alerte unitaire, AD-8).",
    },
    {
      code: 'consommateurs-conformes',
      route: 'POST /api/v1/instance/reseau/{organisationId}/verifications/consommateurs-conformes',
      critere:
        "Modules installés pour l'organisation qui filtrent par la portée (pdv, stock…) présents au registre avec la version courante de la suite de conformité : tous 🟢 ; un absent 🔴 avec son code (SM-3, AD-6 : une absence est un écart ouvert).",
    },
    {
      code: 'noeuds-sans-responsable',
      route: 'POST /api/v1/instance/reseau/{organisationId}/verifications/noeuds-sans-responsable',
      critere: 'Nœuds ouverts sans responsable : 0 🟢 ; ≥ 1 🟠 avec leur nombre (FR-R21, SM-2).',
    },
    {
      code: 'commerciaux-sans-compte',
      route: 'POST /api/v1/instance/reseau/{organisationId}/verifications/commerciaux-sans-compte',
      critere:
        "Commerciaux actifs sans compte actif : 0 🟢 ; ≥ 1 🟠 avec deux nombres, « à inviter » et « sans contact » (ils ne se connectent pas ; leurs points de vente restent rattachés).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (refusée tant que pdv est installé).
  avertissementDesinstallation:
    "Zones, agences, commerciaux, affectations et portées restent enregistrés ; aucune portée ne sera plus publiée : un retrait de portée fait après la désinstallation ne sera pas vu par les autres modules.",

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/reseau/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (noms proposés, figés par EPIC-044 et EPIC-053).
  // ⚠️ La lecture seule n'arrête pas la publication de `reseau.portee.changed` : un retrait de portée doit
  // toujours se propager (fail-closed, AD-6). Seule l'attribution ou l'élargissement est refusé.
  routesLectureSeule: [
    'GET /api/v1/instance/reseau/{organisationId}/export',
    'GET /api/v1/noeuds', // hiérarchie complète, ou à une date passée par sa version de découpage (FR-R15, AD-4)
    'GET /api/v1/noeuds/{noeudId}',
    'GET /api/v1/noeuds/{noeudId}/chemin',
    'GET /api/v1/commerciaux',
    'GET /api/v1/commerciaux/{commercialId}',
    'GET /api/v1/affectations',
    'GET /api/v1/portees',
    'GET /api/v1/couverture',
    'GET /api/v1/resolution', // zone d'un point ou d'une localité ; « non résolu » avec le chemin utilisé (AD-11)
    'GET /api/v1/journal', // lecture livrée avec l'écriture, auteur rendu par son identité (AD-14)
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/reseau/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/reseau/{organisationId}/export',
    import: 'POST /api/v1/instance/reseau/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/reseau/{organisationId}/effacement', // commerciaux = personnes
    sante: 'GET /api/v1/instance/reseau/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : schémas dans
  // prospera-plateforme/contrats/objets/reseau/, écrits avec EPIC-161. Ordre de livraison : la Reprise trie
  // par références (zone → commercial → point de vente → affectation de pdv), modules confondus.
  // - zone : code stable (FR-R03), nom, type, parent (référence vers une zone, intra-type : un cycle est un
  //   écart `CYCLE_REFERENCES`), localités déclarées. Régimes VIVANT (ouverte) et HISTORIQUE (fermée avant la
  //   reprise). Un code de zone repris n'est jamais réattribué ensuite (AD-3). La version de découpage de
  //   départ est créée par la première livraison. Valeur de contrôle : statut ouvert/fermé (etat). Le
  //   distributeur n'a pas d'agences (A4) : l'objet `agence` viendra en version mineure avec la microfinance,
  //   après février.
  // - commercial : clé d'origine (code vendeur de Sage), prénom, nom, e-mail et téléphone (au moins un des deux, sinon `SANS_CONTACT`),
  //   téléphone, statut salarié ou indépendant, affectations à des zones avec date de début et de fin (FR-R20,
  //   FR-R22). Régimes VIVANT (en poste) et HISTORIQUE (parti avant la reprise : il reste référencé par
  //   l'historique d'affectation des points de vente). Valeur de contrôle : statut en poste/parti (etat).
  //   Doublons : e-mail d'abord, téléphone ensuite. La livraison n'envoie aucune invitation.
  // - Les portées ne sont pas reprises : elles s'attribuent dans Prospera, par quelqu'un qui détient
  //   `reseau:portee:attribuer` (AD-8). Une portée importée d'un autre logiciel serait une portée que personne
  //   n'a attribuée.
  objetsDeReprise: ['reseau.zone@1', 'reseau.commercial@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : « Commerciaux : Prospera propriétaire, ce sont
  // les utilisateurs terrain » (PRD Connecteurs FR-14, [A-8]). Un seul point d'écriture pour ce domaine (§6
  // du contrat). La correspondance côté Odoo (vendeur = `res.users`) reste à définir avec l'adaptateur Odoo
  // [À CONFIRMER]. Les zones ne sont pas échangées : Odoo n'a pas d'objet équivalent.
  domainesEchange: [
    {
      code: 'reseau.commerciaux',
      objets: ['reseau.commercial@1'],
      sorte: 'OBJET_DATE',
      argent: false,
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'reseau.echange.commerciaux',
      publie: ['reseau.commercial.changed@1'],
    },
  ],
} as const;
