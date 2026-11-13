// Manifeste M12 — Commercial terrain & application mobile (Terrain & Tournées ; Agents terrain) (format du
// contrat de module, clause C1, amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : PRD distributeur `prds/prd-distributeur-2026-11-12/prd.md`, annexe A.8 (13 clauses) et PRD
//          microfinance `prds/prd-microfinance-2026-11-13/prd.md`, annexe A.9 (« écarts IMF » : seules les
//          valeurs qui changent ou s'ajoutent) ; spine de la microfinance
//          `architecture/architecture-microfinance-imf-2026-11-13/ARCHITECTURE-SPINE.md` (AD-2, AD-9, AD-16,
//          AD-19, AD-25) ; épics EPIC-191 (IMF, ★) ; amendement C7 du 2026-11-11.
// Rétro-saisie : AUCUNE. Le module n'est pas codé (catalogue : ❌ `terrain`). Service porteur : à créer
// [À CONFIRMER : la spine du distributeur le nomme] ; application mobile Flutter `prospera-terrain` (client
// d'API généré depuis OpenAPI, décision D4 ; AD-19).
//
// ⚡ UN MODULE, DEUX VERTICALES (PRD distributeur A.8 C1, PRD microfinance A.9, annexe A.17 point 8) : le
// vocabulaire (« visite », « client » ou « membre », « tournée ») est une DONNÉE (C6), jamais deux modules.
// La seule dépendance dure est `reseau` ; tout ce qui est propre à une verticale passe par `enrichiPar`.
//
// ⚠️ Arbitrages de ce manifeste entre les deux PRD et la spine (la spine gagne, AD-9 : « un nom absent du
// tableau ne se publie ni ne se consomme ») :
// - Visites : la spine fait lire `terrain.visite.changed@1` (état complet, avec `visitePar`) par `credit`, qui
//   calcule « visite valide » ; le fait est AJOUTÉ. La visite d'instruction est une visite (AD-2 : `terrain`
//   seul écrivain des visites, instruction comprise) : la proposition `terrain.visite-instruction.cloturee@1`
//   du PRD microfinance (A.9 C5) n'est PAS publiée ; le statut de preuve et « hors zone » voyagent dans
//   `terrain.visite.changed@1`.
// - Missions de recouvrement : objets de `recouvrement` que `terrain` LIT (AD-2) ; le téléphone les reçoit et
//   renvoie leur résultat par la route de synchronisation de `recouvrement` (AD-19 : chaque service reçoit
//   ses éléments par sa propre route). Les propositions `recouvrement.mission.creee@1` et
//   `terrain.mission-recouvrement.cloturee@1` (A.9, A.10) ne sont donc ni consommées ni publiées.
// - Liens de visite d'instruction : objets de `credit` (AD-2), lus par route ; la proposition
//   `credit.visite.planifiee@1` (A.9 C5) est absente du catalogue d'AD-9 et n'est pas consommée.
// - Le PRD microfinance A.12 (`equipe`) écrit `terrain.visite.terminee@1` : coquille, à lire
//   `terrain.visite.changed@1` (ou `terrain.visite.cloturee@1`) quand le manifeste `equipe` s'écrira.
//
// Hors manifeste, pour mémoire :
// - Gate : `TERRAIN_NOT_ENTITLED` (403 sans donnée, état publié seul, C2). Portée lue dans
//   `reseau.portee.changed@1` et appliquée par le module (AD-16). Distributeur : le commercial voit sa
//   tournée, le superviseur son équipe. IMF : AT et COLL leur zone, COM ses prospects, CC ses visites
//   d'instruction, REC ses missions, RA son agence, RCC son agence ou sa région, ROC et DG le réseau, AUD en
//   lecture (FR-205).
// - Écrans (C8, tous par Dev B) : `/commercial` (carte d'équipe, coaching), `/tournees` (PJP, strike rate,
//   caisse), `/mon-activite` (« Ma journée », clôture de visite) ; IMF : « Mes visites d'instruction »,
//   « Missions de recouvrement », « Zones de prospection », rapport du soir. Fond de carte Google Maps commun
//   (FR-192). « Y aller » et « Clôturer » aboutissent en février. L'application `prospera-terrain`, hors
//   connexion, est EXIGÉE (UJ-2 distributeur, UJ-4 IMF), jamais « bientôt » ; elle se distribue au prospect
//   de l'essai par un lien de téléchargement, avec une connexion par rôle à un clic.
// - C3, données possédées : tournées (PJP), missions de tournée, visites et leur clôture (résultat,
//   commentaire, photos géolocalisées), visites d'instruction (photo, position, distance au client, statut
//   « hors zone » conservé, jamais effacé), positions GPS d'équipe, remises d'espèces et écarts de caisse du
//   commercial (distributeur), agenda, comptes rendus dictés, rapports du soir, propositions de zones de
//   prospection et de réaffectation avec leurs décisions, appareils. Pas de relevé de stock ni de panier
//   chez l'IMF.
// - Hors ligne (AD-19) : identifiant créé sur l'appareil, synchronisation rejouable sans doublon ; aucune
//   décision hors ligne ; le serveur horodate à la réception (l'heure de l'appareil = « heure déclarée »,
//   jamais un contrôle) ; données locales chiffrées, verrouillage, effacement après un délai sans connexion
//   ou sur l'état « appareil perdu ».
// - Positions (décision du PO du 2026-11-12) : consentement de niveau 0 par défaut, information de l'agent à
//   l'embauche, conservation de 90 jours glissants puis purge ; avis juridique à obtenir. La dictée ne garde
//   pas l'audio (J-9) ; la reconnaissance vocale est éteinte sans consentement propre de l'IMF (FR-207).
// - C6, paramètres (données, jamais code) : vocabulaire par verticale, durée d'une visite, rayon de
//   géofencing (200 m ; 100 m pour la visite d'instruction, T7), barème de caisse (seuil d'écart), fenêtre
//   d'optimisation de tournée ; IMF : verrouillage après 5 min d'inactivité, effacement après 14 jours sans
//   connexion, photo (JPEG ou PNG, 5 Mo), alerte de proximité (200 m), rapport du soir (18 h), seuil de
//   coaching (80 %), expiration d'une file hors ligne (7 jours), stockage local (500 Mo), seuils des zones de
//   prospection (calibrés, E5), rangs de priorité des motifs IMF (annexe D).
// - Offre : distributeur « Terrain & Ventes » et « Plateforme » ; microfinance « Terrain & Collecte ».

export const MANIFESTE_TERRAIN = {
  code: 'terrain',
  version: '1.0.0',

  // C1 : aucune dépendance dure vers un module d'une seule verticale (annexe A.17 point 8 du PRD distributeur).
  depends: [
    {
      code: 'reseau',
      raison: "Les tournées, la carte d'équipe et la couverture se rattachent aux zones.",
    },
  ],

  // C4 : chaque absence s'écrit `{etat: NON_INSTALLE, module}`, un test par dépendance.
  // Distributeur (A.8) :
  // - pdv : la visite vise un lieu libre ; « point de vente » = NON_INSTALLE ;
  // - commande : « Prendre une commande » = NON_INSTALLE (toujours, chez l'IMF) ;
  // - catalogue : panier et recommandation de panier absents ;
  // - stock : relevé de stock du commercial (FR-S56) = NON_INSTALLE (toujours, chez l'IMF) ;
  // - paiement : encaissement terrain = NON_INSTALLE ;
  // - recouvrement : tournée de recouvrement (distributeur) et missions de recouvrement (IMF, FR-203) =
  //   NON_INSTALLE ;
  // - facturation, notification : facture remise en visite, messages au client.
  // Microfinance (A.9) :
  // - credit : visite d'instruction liée à un dossier (FR-201) = NON_INSTALLE ;
  // - collecte : remboursements et épargne saisis en visite (FR-202) = NON_INSTALLE ;
  // - microfinance : clients, prospects, groupes solidaires ;
  // - coeur-sfd : échéances lues pour le plan du jour (FR-200) ;
  // - risque-par : PAR de zone (FR-208).
  // L'« IA commune » n'est pas un module du catalogue : sans elle, ordre de visite et alerte de proximité par
  // règle, rapport du soir en tableau, dictée « bientôt », zones sans suggestion (FR-206 → FR-208).
  enrichiPar: [
    'pdv',
    'commande',
    'catalogue',
    'stock',
    'paiement',
    'recouvrement',
    'facturation',
    'notification',
    'credit',
    'collecte',
    'microfinance',
    'coeur-sfd',
    'risque-par',
  ],

  referentielFamilies: [],

  // C7 : distributeur (A.8) puis microfinance (A.9). Format `^[a-z]+:[a-z-]+:[a-z]+$`.
  droits: [
    'terrain:visite:realiser', // « Ma journée », clôture de visite
    'terrain:tournee:planifier', // « Tournées » (PJP)
    'terrain:equipe:consulter', // « Équipe », carte GPS d'équipe
    'terrain:mission:affecter',
    'terrain:remise:declarer', // remise d'espèces du commercial (distributeur)
    'terrain:remise:valider',
    'terrain:instruction:realiser', // visite d'instruction d'un dossier de crédit (IMF, FR-201)
    'terrain:mission:realiser', // mission de recouvrement (IMF, FR-203)
    'terrain:prospection:consulter', // « Zones de prospection »
    'terrain:prospection:decider', // RA, RCC, DG
    // ⚠️ Le PRD microfinance (A.9 C7) écrit `terrain:appareil:declarer-perdu` et le dit « format conforme » :
    // c'est faux, l'action ne prend pas de tiret (`[a-z]+`, même dans la forme élargie de C7). Forme retenue :
    'terrain:appareil-perdu:declarer', // [proposition, correction du format] RA ; ADMIN_IMF, sans lecture du métier (FR-204)
  ],

  // C5.
  publie: [
    'terrain.visite.changed@1', // état complet d'une visite, instruction comprise : `visitePar`, preuve, « hors zone » (spine IMF AD-2, AD-9) ; lu par `credit`
    'terrain.visite.cloturee@1', // clôture : résultat, commentaire, photos géolocalisées (PRD distributeur A.8)
    'terrain.remise.declaree@1', // remise d'espèces du commercial (distributeur ; chez l'IMF la remise est un transfert de caisse de `collecte`, AD-8)
    'terrain.position.changed@1', // positions d'équipe (purge à 90 jours)
    'terrain.releve-stock.saisi@1', // relevé de stock du commercial (distributeur, FR-S56)
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] clôtures, appareils perdus, décisions de prospection, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'reseau.noeud.created@1',
    'reseau.portee.changed@1', // portée appliquée par le module (AD-16), portée portefeuille comprise (T6)
    'pdv.point-de-vente.changed@1', // clients visités (distributeur)
    'commande.commande.validee@1', // commande prise en visite
    'paiement.encaissement.valide', // topic existant de `paiement`, sans suffixe de version
    'coeur-sfd.echeancier.changed@1', // échéances du plan du jour (IMF, FR-200)
    'microfinance.client.changed@1', // [proposition, A.9 C4 « clients, prospects, groupes » ; nom du catalogue d'AD-9] clients visités (IMF)
    'risque-par.par.calcule@1', // [proposition, A.9 C4 « PAR de zone » (FR-208) ; nom du catalogue d'AD-9, affichage seul]
    // ⚠️ Le PRD microfinance (A.9 C5) fait consommer `reseau.affectation.changed@1`, que le manifeste `reseau`
    // ne publie pas (il publie `reseau.commercial.changed@1` et `reseau.portee.changed@1`). À trancher avec
    // l'amendement `reseau` de la microfinance (2026-11-13) [À CONFIRMER] :
    'reseau.commercial.changed@1', // [proposition, à la place de `reseau.affectation.changed@1`] agent ↔ zone
  ],

  profilCompose: 'terrain',

  // C13, point 1 : `reseau` est la dépendance dure de `depends` ; reste la clé Google Maps, comme `pdv`.
  prerequis: [
    {
      code: 'fond-de-carte',
      description:
        "Google Maps joignable depuis le poste et depuis l'application mobile (FR-192) : clé de l'espace, facturation active, clé restreinte à l'application",
      action:
        "Renseigner une clé Google Maps valide ; sans elle la carte d'équipe et « Y aller » sont indisponibles, la liste de la journée reste utilisable.",
    },
  ],

  verifications: [
    {
      code: 'zones-lues',
      route: 'POST /api/v1/instance/terrain/{organisationId}/verifications/zones-lues',
      critere: 'Zones lues dans `reseau` : ≥ 1 🟢 ; 0 🔴 « aucune zone : aucune tournée ne peut se rattacher ».',
    },
    {
      code: 'fond-de-carte',
      route: 'POST /api/v1/instance/terrain/{organisationId}/verifications/fond-de-carte',
      critere: 'La clé Google Maps répond : 🟢 ; sinon 🔴 (carte d\'équipe et « Y aller » indisponibles).',
    },
    {
      code: 'purge-positions',
      route: 'POST /api/v1/instance/terrain/{organisationId}/verifications/purge-positions',
      critere: 'Positions de plus de 90 jours : 0 🟢 ; ≥ 1 🔴 avec leur nombre (décision du PO du 2026-11-12).',
    },
    {
      code: 'rayon-instruction',
      route: 'POST /api/v1/instance/terrain/{organisationId}/verifications/rayon-instruction',
      critere:
        'Rayon de la visite d\'instruction paramétré et ≤ 200 m : 🟢 ; sinon 🔴 (IMF, T7 ; sans objet 🟢 si `credit` n\'est pas installé).',
    },
  ],

  avertissementDesinstallation:
    "Les tournées et la clôture de visite cesseront ; l'application mobile ne se synchronisera plus. Les visites d'instruction exigées par les dossiers de crédit et les missions de recouvrement cesseront. Visites, positions et preuves de visite restent enregistrées.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/terrain/migrer', // à créer ; la synchronisation de l'appareil lit deux versions (l'appareil tolère un champ inconnu)

  // C12 : distributeur (A.8) puis microfinance (A.9).
  interrupteurs: [
    'mode-hors-ligne',
    'optimisation-automatique',
    'saisie-vocale', // éteint sans consentement propre à la voix (FR-207)
    'zones-de-prospection',
    'effacement-hors-connexion', // allumé : chiffrement local, verrouillage, état « appareil perdu » (FR-204)
  ],

  // C2, C13 point 5 : consultation des visites et export. Essai : aucune position réelle collectée ; un mode
  // « démonstration » simule la position, visible à l'écran (« position simulée »), calée sur les points de
  // vente ou les clients du jeu ; elle est acceptée comme preuve d'instruction pour que UJ-1 (IMF) aille à
  // EN_GESTION (FR-201).
  routesLectureSeule: [
    'GET /api/v1/instance/terrain/{organisationId}/export',
    'GET /api/v1/visites', // [proposition] consultation des visites
    'GET /api/v1/visites/{id}', // [proposition]
  ],

  // C13, point 7. À créer.
  routesInstance: {
    export: 'GET /api/v1/instance/terrain/{organisationId}/export',
    import: 'POST /api/v1/instance/terrain/{organisationId}/import',
    effacement: 'POST /api/v1/instance/terrain/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/terrain/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Visites et commandes terrain = Prospera (PRD distributeur FR-14) ; rien à reprendre ni à échanger.
  objetsDeReprise: [],
  domainesEchange: [],

  // C11 : union des deux verticales. `recommandation-panier` et `aide-a-la-commande` ne servent pas l'IMF
  // (pas de commande). Moteur : IA commune ; chez l'IMF, dans son instance locale (FR-260). L'IA propose,
  // l'humain décide, la provenance est affichée ; rien ne bloque sans IA. Le compte rendu vocal du
  // distributeur (voice-to-CRM) reste « bientôt », sans date.
  ia: {
    modeles: [
      'optimisation-tournees',
      'recommandation-panier',
      'validation-geofencing',
      'alerte-proximite',
      'saisie-vocale',
      'rapport-du-soir',
      'zones-de-prospection',
    ],
    finalites: [
      'planification-de-tournee',
      'aide-a-la-commande',
      'controle-de-presence',
      'alerte-proximite-client-en-retard',
      'saisie-vocale-de-visite',
      'rapport-quotidien-agent',
      'suggestion-de-zones-de-prospection',
    ],
  },
} as const;
