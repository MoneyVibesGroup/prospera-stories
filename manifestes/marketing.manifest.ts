// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M23 — Marketing et campagnes (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Sources (dans cet ordre) : architecture/architecture-distributeur-2026-11-13 (AD-1, AD-15, AD-16, AD-19, AD-20,
// AD-27) ; spines de la microfinance (AD-14, AD-9) et de l'assurance ; PRD distributeur §6.5 (FR-142 → FR-149) et
// annexe A.12 ; PRD microfinance §7.4 (FR-245 → FR-249) et annexe A.13 (écarts IMF) ; PRD notification (FR-211,
// FR-212) ; CONTRAT-DE-MODULE-2026-11-09.md. Le code `marketing` n'existe pas au catalogue (« ❌ marketing » dans
// `manifestes-a-produire.md`) : à créer.
//
// Ce que le module fait : campagnes (cycle de vie, entonnoir compté sur des faits, ROI), segments (des CRITÈRES
// enregistrés, jamais des listes de personnes), packages de vente (le PRD dit « combos » : offres d'écoulement
// issues du stock, `COMBO_MOTEUR`, `BUNDLE_ADOPTION`, `PROMO_CHOC`, et promotions fournisseurs), attribution des
// commandes ou des décaissements aux campagnes, scoring de leads. L'IA commune PROPOSE les packages et MESURE
// l'impact (capacités consommées, clause C11 ci-dessous) ; le décideur est un humain (AD-19).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle distributeur « Croissance & Équipes » ; microfinance « Croissance & Opérations (Marketing &
//   Acquisition) » (manifestes-a-produire.md, M23). Deux verticales ; UN code, UN contrat (AD-15).
// - Gate : `MARKETING_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Service porteur : `prospera-croissance-service` :3416 (AD-1), sous `src/modules/marketing/` ; avec
//   `studio-social` et `support-client` dans le même service, SANS collection écrite par deux modules (contrat §4).
//   Le chatbot WhatsApp de qualification de leads n'existe pas au catalogue : bouton « bientôt », sans date (FR-247).
// - Écrans : module d'écran `marketing` dans `prospera-app` (C8), tous les écrans par Dev B. `/marketing` (vue
//   opérateur ; vue DG en contrôle, le DG valide et met en pause, il ne rédige pas), `CombosStockPanel`, chez l'IMF
//   entonnoir des prospects, segments, couverture du territoire. Entrées de menu : « Campagnes »
//   (`marketing:campagne:gerer`), « Combos » (`marketing:combo:proposer`), « Mon audience »
//   (`marketing:audience:consulter`), « Prospects » (`marketing:prospect:consulter`). « Lancer », « Modifier » et
//   « Ignorer » DOIVENT aboutir pour le circuit des combos de stock en février (FR-146, FR-147) ; « bientôt », sans
//   date : chatbot WhatsApp, NPS, présence digitale, fidélisation, budget par poste, défis (FR-247, FR-249). Aucun
//   bouton ne simule une action (PRD distributeur FR-2).
// - Rôles proposés (annexe B.2) : `campagne:gerer` et `segment:gerer` : MARKETING (IMF : COMM) ;
//   `campagne:valider` : DG, DC (IMF : le DG au-dessus d'un seuil de budget) ; `combo:proposer` : MARKETING,
//   RESP_STOCK ; `combo:valider` : DG, DC (remise de 12 % ou plus) ; `audience:consulter` : MARKETING, DC ;
//   `prospect:consulter` : COMM, RCC, COM chez l'IMF. MARKETING et RECOUVREMENT ne lisent pas le CA détaillé hors
//   leur besoin ; un MARKETING ne voit JAMAIS la marge ni le prix d'un freelance (FR-142, FR-8, AD-10).
// - Cloisonnement (C2) : par `organisationId` et par portée de zone lue dans `reseau.portee.changed@1` (le
//   responsable marketing voit « Mon audience » ; IMF : COMM voit le réseau, le RCC son agence ou sa région, un
//   commercial les prospects de sa zone).
// - Données possédées (C3) : campagnes (nom, objectif, offre, canal WHATSAPP, SMS, TERRAIN ou MIXTE, segment, zone,
//   dates, budget_max, coût, statut `BROUILLON`, `PLANIFIEE`, `EN_COURS`, `PAUSE`, `TERMINEE`, `ANNULEE`, source,
//   responsable, entonnoir), cibles retenues ou écartées avec leur motif, segments (COPIE DES CRITÈRES, jamais des
//   personnes), combos stock → promotions et validations du DG (Décisions à trancher, FR-14), résultats et ROI,
//   attributions, scoring de leads (cinq facteurs à poids paramétrables chez l'IMF, FR-246). LE PROSPECT N'EST PAS
//   POSSÉDÉ : il appartient au réseau commercial (IMF, décision F10) ou à `conquete-objectifs` (distributeur) et se
//   lit. Les messages relèvent de `notification` (consentement, désabonnement, plafond de messages : FR-211,
//   FR-212 ; conservation et consentement suivent le PRD notification §9.2, décision du PO du 2026-11-12).
// - Paramètres (C6, des données, jamais du code) : `SEUIL_EXCLUSION_JOURS` (LU de la table unique des seuils de
//   retard, jamais propre à ce module ; J+30 par défaut), plafond de messages par destinataire (porté par
//   `notification`, 2 par semaine, FR-212), seuil de remise exigeant la validation du DG (12 %, FR-145), seuil de
//   budget exigeant la validation du DG (IMF), canaux d'une campagne, durée d'une campagne de combo (14 jours) et
//   budget par cible (5 500 F ; promotion fournisseur 21 jours, 4 500 F), fenêtre d'attribution (campagne + 7 jours),
//   référence « marge habituelle » du ROI (moyenne des 3 mois précédents), poids du score de prospect (25, 25, 20,
//   15, 15), tentatives avant disqualification (3).
// - Règles de calcul à ne pas dériver : UN SEUL ROI = (marge incrémentale attribuée − coût) ÷ coût (distributeur,
//   FR-143) ; chez l'IMF, retour sur la marge d'intérêt nette attendue (intérêts attendus − perte attendue de
//   `risque-par`, FR-245). Le « retour brut » (marge ÷ coût) s'appelle ainsi. Un indicateur sans fait n'affiche
//   jamais un ROI. Un client exclu reste visible avec son motif (FR-148). Un envoi vers un désabonné est un critère
//   bloquant.
// - Vocabulaire (AD-15) : tiers = point de vente (distributeur), membre ou client ou groupe solidaire (IMF), assuré
//   ou prospect (assurance) ; segment d'exclusion = client en retard ou crédit bloqué ; zone blanche = zone non
//   couverte. Le libellé vient du tableau de la verticale. Sans objet chez l'IMF : combos de stock, promotions
//   fournisseurs, studio social.
// - Démarrer seul (C10) : `profiles: ["marketing"]` ; socle + `notification` + `reseau` (annexe A.12 : socle +
//   `pdv` + `notification` + `reseau` ; `pdv` n'est plus une dépendance, voir plus bas).
// - Migrations (C12) : `SANS_PERTE`.

export const MANIFESTE_MARKETING = {
  code: 'marketing',
  version: '1.0.0',

  // C1. ⚠️ ÉCART avec l'annexe A.12 et la spine du distributeur (§ graphe : « `marketing` → `pdv` et
  // `notification` », validé par le PO le 2026-11-12), tranché ICI en faveur de l'annexe IMF A.13 : « la
  // dépendance dure à `pdv` du distributeur est remplacée » ; `pdv` ne s'installe pas chez l'IMF, une dépendance
  // dure l'empêcherait d'y installer `marketing`. C'est la règle de l'annexe A.17 point 8 (aucune dépendance dure
  // vers un module d'une seule verticale) et d'AD-15 (un code, un contrat, pas de test « si distributeur »). L'audience
  // du distributeur (liste de points de vente, FR-V29) passe par `enrichiPar` (`pdv`), celle de l'IMF par `microfinance`.
  // À CONFIRMER par le PO : s'il maintient `pdv` en dépendance dure, l'IMF ne peut pas installer ce module.
  depends: [
    {
      code: 'notification',
      raison: "Un envoi de campagne part par notification (liste d'envoi de masse, consentement, désabonnement).",
    },
    // Ajout par rapport à la ligne C1 de l'annexe A.12 (qui l'obtenait par `pdv`) : `reseau` est dans le C10 des
    // deux annexes (A.12 et IMF A.13 : « socle + notification + reseau ») et la portée de zone (C2) est lue de
    // `reseau.portee.changed@1` ; une fois `pdv` sorti des dépendances dures, il doit y figurer lui-même.
    {
      code: 'reseau',
      raison: "La portée de zone, de région ou d'agence du lecteur vient du réseau (cloisonnement, C2).",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent ; un test par
  // dépendance de `enrichiPar`. Règle forte : `recouvrement` ou `facturation` absents (distributeur), `recouvrement`
  // ou lecture du cœur absents (IMF) : l'exclusion des clients en défaut est « NON ÉVALUÉE », JAMAIS « aucun client
  // exclu » ; confirmation explicite avant envoi ; le plafond de messages s'applique toujours (FR-148, FR-245).
  // Distributeur (A.12) :
  // - pdv : audience = liste de points de vente ; sans lui, audience du distributeur = `NON_INSTALLE` ;
  // - stock : combos d'écoulement = `NON_INSTALLE` (aucun combo, FR-144) ;
  // - recouvrement, facturation, paiement : exclusion des clients en défaut et créance la plus ancienne ;
  // - catalogue : promotions (prix promo) ;
  // - studio-social : rattachement d'un post à une campagne ;
  // - commande : attribution des commandes (FR-149) = `NON_INSTALLE`.
  // Microfinance (A.13) :
  // - microfinance : clients et prospects (audience) ; credit : décaissement attribué ; risque-par : perte
  //   attendue du ROI (absent : « marge attendue non évaluée ») ; reseau (dépendance dure) : zones sous-couvertes ; coeur-sfd :
  //   retard et dossier bloqué ; `notification` absent : « Lancer » = `NON_INSTALLE` et la campagne reste
  //   `PLANIFIEE`.
  // Propositions : conquete-objectifs (prospects du distributeur, FR-77 ; sans lui, scoring de leads vide).
  enrichiPar: [
    'pdv',
    'stock',
    'recouvrement',
    'facturation',
    'paiement',
    'catalogue',
    'studio-social',
    'commande',
    'conquete-objectifs',
    'microfinance',
    'credit',
    'risque-par',
    'coeur-sfd',
  ],

  // Aucun numéro de compte ici : une campagne ne passe aucune écriture.
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.12 : « format conforme »). Chaque droit
  // demande une PR `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'marketing:campagne:gerer', // créer, planifier, lancer, mettre en pause, arrêter, modifier (FR-142)
    'marketing:campagne:valider', // valider une campagne (DG ; IMF : au-dessus d'un seuil de budget, FR-245)
    'marketing:combo:proposer', // transmettre un combo sous le seuil, créer la campagne d'un combo validé (FR-144, FR-146)
    'marketing:combo:valider', // décision du DG sur un combo à remise ≥ 12 %, sévérité critique ou PROMO_CHOC (FR-145)
    'marketing:segment:gerer', // critères d'un segment (FR-142)
    'marketing:audience:consulter', // « Mon audience » : cibles retenues et écartées, avec motif
    'marketing:prospect:consulter', // annexe IMF A.13 : entonnoir des prospects, sous portée (FR-246)
  ],

  // C5 : faits publiés et consommés. Noms du catalogue de la spine (AD-20) ; ce qui n'y figure pas est marqué
  // [proposition] (« un nom absent du tableau ne se publie ni ne se consomme » : PR d'ajout à porter). Chaque fait
  // d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`.
  publie: [
    'marketing.campagne.changed@1', // état absolu d'une campagne et de son entonnoir (spine AD-20, A.12)
    'marketing.combo.valide@1', // combo validé : source des campagnes d'écoulement (spine AD-20, A.12)
    'marketing.attribution.etablie@1', // [IMF A.13, absent du catalogue de la spine] commande ou décaissement attribué à une campagne
    'marketing.decision.changed@1', // [spine § propriétaires : « chaque module qui a des décisions à trancher en possède les siennes et publie `<module>.decision.changed@1` »] validation DG d'un combo ou d'une campagne ; lue par `dashboard` seul
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] export, effacement, lancement, arrêt
    'marketing.realite.constatee@1', // [AD-14, spine IA] impact mesuré d'un package ou d'une campagne à son horizon (durée du package puis 30 jours ; avant/après, groupe témoin « bientôt ») (issue : IMPACT_POSITIF, IMPACT_NUL, IMPACT_NEGATIF ; `definitive` à l'horizon ; jamais un montant, jamais une liste de personnes) ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'pdv.point-de-vente.changed@1', // audience du distributeur (annexe A.12)
    'stock.alerte.changed@1', // stock lent, produit moteur : source des combos (annexe A.12)
    'stock.liquidation.lancee@1', // combo né d'un plan de liquidation (FR-246, annexe A.12)
    'recouvrement.credit.bloque@1', // exclusion d'un tiers au crédit bloqué (FR-148, annexe A.12)
    'recouvrement.credit.debloque@1', // [proposition] le tiers réapparaît au déblocage (FR-148)
    'paiement.creance.changed@1', // Créance échue au-delà du seuil : exclusion (annexe A.12)
    'notification.envoi.delivre', // topic existant de `notification`, sans suffixe de version : entonnoir (annexe A.12)
    'notification.reponse.recue', // topic existant : entonnoir, boîte de réponses (annexe A.12)
    'notification.desabonnement.enregistre', // [proposition] un désabonnement est respecté immédiatement (FR-147, FR-N48)
    'reseau.portee.changed@1', // [proposition, C2] portée de zone
    'commande.commande.chiffree@1', // [proposition, FR-149 : montants des commandes attribuables ; spine AD-20 `chiffree` : prix société, jamais freelance] CA attribué et incrémental
    'catalogue.grille.publiee@1', // [proposition, annexe A.12 `enrichiPar` catalogue (promotions) sans fait en C5] prix promo
    'conquete-objectifs.prospect.changed@1', // [proposition, FR-77 : prospects du distributeur, scoring de leads]
    // IMF (annexe A.13) :
    'recouvrement.dossier.changed@1', // retard : exclusion ; l'annexe IMF écrit `recouvrement.dossier.change@1`, le catalogue dit `changed`
    'microfinance.client.changed@1', // clients ; l'annexe IMF écrit aussi `microfinance.prospect.changed@1`, ABSENT du catalogue de la spine IMF (le prospect y est un état du client, `microfinance.client.converti@1` à la conversion) : à trancher
    'credit.dossier.accorde@1', // décaissement attribué à la campagne
    'risque-par.perte.proposee@1', // [proposition, FR-245 : perte attendue du ROI ; le catalogue de la spine IMF ne porte pas de fait « perte attendue » courante]
    'reseau.zone-blanche.changed@1', // [IMF A.13, ABSENT du manifeste `reseau` et du catalogue : le signalement de zone blanche est de `reseau` (FR-183), son nom est à fixer par l'amendement `reseau`]
    'coeur-sfd.pret.changed@1', // [proposition] retard et dossier bloqué lus du cœur
    'microfinance.client.bloque@1', // [proposition] dossier BLOQUE par le ROC : exclu des envois commerciaux (FR-245)
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  profilCompose: 'marketing',

  // C13, point 1 : `notification` est la dépendance dure de `depends` ; reste son état d'usage. Annexe A.12 : « `notification`
  // canal utilisable » ; annexe IMF A.13 : en plus « modèles WhatsApp approuvés » (FR-258). Texte de description et
  // d'action proposé ; le libellé exact est à confirmer avec le PO.
  prerequis: [
    {
      code: 'canal-notification',
      description:
        'Au moins un canal de `notification` utilisable (WhatsApp ou SMS) ; chez une IMF, modèles de message WhatsApp approuvés avant la mise en service [annexe A.12, annexe IMF A.13]',
      action:
        "Brancher un canal dans `notification` et, pour WhatsApp, faire approuver les modèles de message ; sans cela, « Lancer » reste « non installé » et la campagne reste PLANIFIEE.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Noms de routes
  // proposés (convention commune de l'annexe A : `verifications/<code>`). Essai : aucun message réel.
  verifications: [
    {
      code: 'audience-resolue',
      route: 'POST /api/v1/instance/marketing/{organisationId}/verifications/audience-resolue',
      critere:
        "Audience d'essai résolue, exclusions comptées et aucun désabonné ciblé : 3 sur 3 🟢 ; audience non résolue ou un désabonné ciblé 🔴 avec son motif (annexes A.12 et IMF A.13, C13).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.12). Rien n'est supprimé ; campagnes
  // conservées.
  avertissementDesinstallation: 'Les campagnes en cours ne seront plus envoyées.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/marketing/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // Annexe A.12 : `exclusion-clients-en-defaut` (active par défaut, JAMAIS éteinte en silence) et
  // `validation-dg-combos`. Annexe IMF A.13 : `exclusion-clients-en-retard` (même interrupteur, autre mot : retenu
  // sous le nom de l'annexe A.12, voir l'écart noté) et `validation-dg-campagnes`. Comportement seulement, jamais la
  // forme des données.
  interrupteurs: ['exclusion-clients-en-defaut', 'validation-dg-combos', 'validation-dg-campagnes'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexes A.12 et A.13 : consultation, export ; l'annexe
  // A.12 n'en liste pas). Toute écriture rend 403 `ABONNEMENT_EXPIRE`. Noms de routes proposés, figés par l'épic.
  routesLectureSeule: [
    'GET /api/v1/instance/marketing/{organisationId}/export',
    'GET /api/v1/marketing/campagnes', // [proposition]
    'GET /api/v1/marketing/campagnes/{id}', // [proposition] entonnoir, cibles, écartés et motif
    'GET /api/v1/marketing/combos', // [proposition]
    'GET /api/v1/marketing/audience', // [proposition]
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/marketing/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/marketing/{organisationId}/export',
    import: 'POST /api/v1/instance/marketing/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/marketing/{organisationId}/effacement', // tracé, avec certificat ; le droit à l'oubli s'applique à un prospect
    sante: 'GET /api/v1/instance/marketing/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : aucun objet repris (annexes A.12 et A.13). Ni les
  // campagnes passées ni les segments ne se reprennent ; les clients viennent de `pdv` et de `microfinance`.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : aucun domaine d'échange (annexes A.12 et A.13).
  domainesEchange: [],

  // C11 : capacités de l'IA commune CONSOMMÉES (annexe A.12, union avec l'annexe IMF A.13 et les deux capacités
  // demandées pour les packages), demandées par `PropositionPort` (spine AD-19, microfinance AD-14) ; le module
  // n'embarque aucun modèle et ne code aucune règle de score. Noms proposés.
  // - `proposition-de-package` (finalité `proposition-de-package`) : l'IA propose des packages de vente (combos
  //   moteur + produit lent, remise proposée, cible) ; en février la détection est une RÈGLE de combo (FR-144 : « une
  //   règle, pas une IA », origine `REGLE`, version et date affichées) servie par la même demande ; l'origine
  //   `MODELE` ne vient qu'avec l'IA commune. Un package n'est jamais lancé par l'IA : un humain décide, le DG
  //   au-dessus du seuil (FR-145).
  // - `mesure-d-impact` (finalité `mesure-d-impact-campagne`) : l'IA mesure l'impact d'une campagne ou d'un package
  //   (écart au comportement habituel des mêmes tiers). C'est une ESTIMATION, affichée comme telle avec sa
  //   provenance ; elle ne remplace JAMAIS le ROI, qui se calcule sur des faits (FR-143 ; AD-19 : un chiffre
  //   financier affiché ne vient jamais d'un modèle). Un vrai groupe témoin est « bientôt ».
  // - Les autres capacités sont celles des annexes : scoring de leads, segmentation comportementale (clusters sur
  //   des données agrégées et anonymisées), ciblage, note de prospect, propositions de campagnes, zones de
  //   prospection. Un client en retard, au dossier bloqué ou sans consentement n'est jamais dans une proposition.
  //   Le prix et la marge d'un freelance ne sont jamais une entrée. Chez l'IMF, le moteur tourne dans l'instance
  //   locale ; seuls des écarts anonymisés sortent, avec consentement par finalité. Sans IA commune, des règles
  //   servent la note de prospect et le ciblage, et le disent. Le chatbot WhatsApp de qualification n'a pas de
  //   modèle déclaré (« bientôt »).
  // Amendé le 2026-11-14 : les anciens `modeles` deviennent des capacités `secteur/code@majeure` (AD-47), une par secteur
  // qui installe le module ; `segmentation-packages` couvre la segmentation et la proposition de package (distributeur).
  ia: {
    capacites: [
      'distributeur/scoring-leads@1',
      'distributeur/segmentation-packages@1',
      'distributeur/ciblage-campagne@1',
      'distributeur/mesure-d-impact@1',
      'distributeur/zones-de-prospection@1',
      'microfinance/segmentation-clients@1',
      'microfinance/ciblage-campagne@1',
      'microfinance/note-de-prospect@1',
      'microfinance/proposition-de-campagne@1',
      'microfinance/mesure-d-impact@1',
      'microfinance/zones-de-prospection@1',
    ],
    finalites: [
      'scoring-de-leads',
      'ciblage-campagne',
      'segmentation',
      'note-de-prospect',
      'proposition-de-campagne',
      'zone-de-prospection',
      'proposition-de-package',
      'mesure-d-impact-campagne',
    ],
  },
} as const;
