// Manifeste M33 — Encaissements & PI-SPI (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Rétro-saisie : le module est CODÉ (rails A, C, E livrés). Ce manifeste décrit ce que
// `prospera-paiement-service` fait sur origin/dev (0dcde70, MNV-651) ; le PRD dit ce qu'il doit faire.
// Le propriétaire du dépôt le copie dans `src/module.manifest.ts` la semaine où il y travaille ; une garde de
// test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-paiement-service-2026-08-02 (FR-P01 → FR-P66, NFR-1 → NFR-8) et son amendement
//              du 2026-09-21 (ordres de paiement) ; spine architecture/architecture-paiement-service-2026-08-03
//              (AD-1 → AD-18) ; épics epics-paiement-2026-08-03.md ; STORY-647/649 (arrêté → créance,
//              facturation de la consommation) ; STORY-650/651 (délégation) ; PRD Connecteurs §4.F et FR-17.
//
// ✅ MIS À JOUR LE 2026-11-13 (décision du PO, 21e séance de la salle : points 1 et 2) :
// - PRD distributeur, annexe A.17 et point 11 : registre des Créances (FR-247) et crédit du tiers (FR-248),
//   deux droits nouveaux (annexe B), `enrichiPar` + `commande` ; amendement du PRD `paiement` écrit le même
//   jour (`prds/prd-paiement-service-2026-08-02/amendement-2026-11-13-creances-distributeur.md`).
// - Spine de la microfinance (architecture-microfinance-imf-2026-11-13, AD-5, AD-6, AD-8, AD-9, AD-25) : source
//   `ECHEANCE_DE_PRET`, exécution des ordres de décaissement, relecture ciblée du cœur.
// - Freelance (D-24, FR-98) : compteur de l'add-on et ordre de versement de la commission.
// - ⚠️ Suffixe de version : les topics DÉJÀ codés gardent leur graphie sans `@1` (C5 amendé ; les renommer
//   casserait les consommateurs en place). Seuls les faits NOUVEAUX ci-dessous portent `@1`.
// - Faits d'état : `paiement.creance.changed@1` et `paiement.encaissement.changed@1` donnent l'état ABSOLU
//   (comme `credit.dossier.changed@1` à côté de `credit.dossier.accorde@1`). Les faits fins existants restent.
// - Sorties d'argent : un fait d'état par nature d'ordre, `paiement.ordre-<nature>.changed@1` (motif fixé par
//   la spine de la microfinance) : `ordre-decaissement` (prêt), `ordre-versement` (commission du freelance).
//   Les ordres de l'amendement du 2026-09-21 (fournisseurs, remboursement d'un crédit du tiers) ne publient
//   encore aucun fait : `paiement.ordre-paiement.changed@1` le jour où un module en a besoin [À CONFIRMER].
//
// ✅ CODE DU MODULE : `paiement` (décision du PO du 2026-11-12). Le module `paiement`, ce sont les
// paiements ET les moyens de paiement. Les moyens raccordés sur origin/dev sont DEUX fournisseurs :
// PI-SPI (adaptateur `API_BUSINESS`) et FEDAPAY (adaptateur `fedapay`, barème `fedapay-bj-2026-09-05`, webhook
// signé `x-fedapay-signature`) ; s'y ajoutent les encaissements déclarés (espèces, virement). Aucun n'est
// un module : un fournisseur de plus est un adaptateur et une ligne du registre des fournisseurs
// (plateforme), jamais un code au catalogue. ⚠️ Ne jamais écrire « PI-SPI » pour dire « paiement ».
// - Le service ouvre déjà ses routes sur l'entitlement `paiement` (`PAIEMENT_MODULE_CODE`), refus
//   `PAIEMENT_NOT_ENTITLED`, et ses droits de tenant sont déjà `paiement:*` dans `TenantPermission`.
// - Le code `pi-spi` du catalogue n'est donc pas un module. Sa fiche décrit en plus autre chose
//   (« indicateurs prudentiels et états périodiques exigés des SFD », famille `sfd-bceao`, pack imf-sfd), et
//   AUCUN service ne le lit. À retirer de l'offre comme `fiscalite` (STORY-549 : `DEPRECATED`, jamais
//   supprimé, pour ne révoquer aucun octroi) et à remplacer par `paiement` dans les packs ; le prudentiel
//   SFD qu'il décrit va au PRD microfinance. Story de catalogue à ouvrir.
// - ⚠️ `paiement` (comme `notification`) n'est PAS semé au catalogue (`modules.seed-data.ts`) : la recette le
//   déclare à la main avant l'octroi. EPIC-143 (chargement des manifestes) le corrige.
//
// Hors manifeste, pour mémoire :
// - Offre : bundles distributeur « Finance & Recouvrement » et « Plateforme » ; microfinance « Terrain &
//   Collecte » (Caisse & Mobile Money) [À CONFIRMER]. Le lien de paiement figure aussi à l'application
//   terrain (M12).
// - NFR-1, structurante : Prospera ne détient JAMAIS les fonds. Le client encaisse sur SON compte, chez SON
//   fournisseur (PI-SPI ou FedaPay, Mobile Money compris) ; Prospera émet la demande, constate, rapproche
//   et prouve.
// - Écrans : module d'écran `paiement` dans `prospera-app` (C8), tous les écrans par Dev B.
// - C11 : sans objet.
// - Gate existante : `@RequiresPaiementAccess` sur la CLASSE de chaque contrôleur (e-mail vérifié → KYC
//   approuvé → entitlement `paiement`), plus `@RequiertDroit(...)` qui lit `perms` (inventaire typé
//   `droits-paiement.ts`, aucun nom de rôle sur le chemin d'autorisation). ⚠️ Écarts : la garde lit
//   `entitlement.changed`, pas l'état publié (C2, AD-24) ; aucune route `instance/paiement/…` (C13) ; aucun
//   profil compose (C10) ; registre, exploitation et abonnements laissent fuir un 403 (porte plateforme
//   APRÈS le `DroitsGuard`, défaut relevé à STORY-650).
// - ⚠️ Le service héberge AUSSI des fonctions qui ne sont PAS le module vendu au client :
//   · les ABONNEMENTS PROSPERA (Money Vibes facture ses clients ; impayé ⇒ suspendre, STORY-280 ;
//     facturation de la consommation de messages, STORY-649) : c'est la facturation de la plateforme ;
//   · le registre des fournisseurs, les barèmes contractuels et l'exploitation : actes de la PLATEFORME.
//   Leurs droits sont de plateforme (`paiement:grace:attribuer`, `paiement:fournisseur:administrer`,
//   `paiement:exploitation:consulter`, `paiement:delegation:configurer`, catalogue PLATEFORME, 4 copies à
//   l'octet près). Ils ne figurent pas dans `droits` ci-dessous. [À CONFIRMER] : la facturation des
//   abonnements doit marcher chez une organisation qui n'a PAS acheté `paiement` ; aujourd'hui elle passe
//   sous la même gate, et c'est l'organisation Money Vibes qui détient le module.
// - Séparation des pouvoirs (FR-P60, FR-P66) : déclarer et valider un encaissement, préparer et valider un
//   ordre sont des droits distincts, jamais cumulés par défaut sur un rôle ; la même personne ne valide
//   jamais l'ordre qu'elle a préparé. Aujourd'hui les ordres réutilisent `demande:emettre` (préparer) et
//   `encaissement:valider` (valider) : des droits `paiement:ordre:*` seraient plus lisibles [À CONFIRMER].
// - Rôles du socle distributeur (STORY-166), proposition : commercial = `demande:emettre` ; recouvrement =
//   + `encaissement:declarer`, `lien:revoquer` ; DAF = `encaissement:valider`, `annulation:enregistrer`,
//   `journal:consulter` ; DG ou DIST_ADMIN = `compte:administrer`. Annexe B du PRD distributeur :
//   `creance:consulter` à DG, DC, RESP_VENTES, SUPERVISEUR, DAF, COMPTABLE, CONTROLE_GESTION, RECOUVREMENT
//   (COMMERCIAL et FREELANCE pour leur portefeuille) ; `credit-tiers:imputer` à COMPTABLE et DAF.

export const MANIFESTE_PAIEMENT = {
  code: 'paiement',
  version: '1.0.0',

  depends: [],

  // C4 :
  // - notification : envoi du lien et des relances au payeur, messages de paiement par le chemin des
  //   appelants de service (`paiement-service`, clés de messages de paiement). Sans lui, le lien reste
  //   remis à la main (copier, QR) et l'envoi s'écrit `NON_INSTALLE`, jamais « envoyé » [À CONFIRMER : le
  //   comportement actuel quand le client n'a pas `notification`] ;
  // - facturation : source des créances d'un distributeur (une facture ouverte devient une créance à
  //   encaisser) : `paiement` ouvre la Créance de source `FACTURE` sur `facturation.facture.emise@1`, la réduit
  //   sur `facturation.avoir.emis@1` (FR-247, tranché par le PO le 2026-11-12) ;
  // - commande : ajouté pour suivre l'annexe A.17 (encours, FR-187). ⚠️ L'encours se calcule chez `commande`
  //   et `pdv`, qui lisent les faits de `paiement` ; `paiement` ne consomme aucun fait de `commande`. Si la
  //   story de l'encours ne lui trouve aucun usage ici, le retirer (un enrichiPar sans lecture ne sert à rien) ;
  // - freelance : créances du périmètre « freelance » (dû du freelance à la société, créances de son espace
  //   propre sur ses détaillants, FR-97) et compteur de l'add-on (D-24). Sans lui, aucun périmètre freelance ;
  // - credit, coeur-sfd (microfinance) : source `ECHEANCE_DE_PRET` (spine IMF AD-6) et ordres de décaissement
  //   (AD-5). Sans eux, la source n'est pas proposée et aucun ordre de décaissement n'est reçu.
  enrichiPar: ['notification', 'facturation', 'commande', 'freelance', 'credit', 'coeur-sfd'],

  referentielFamilies: [],

  // C7 : les sept droits de tenant DÉJÀ au catalogue (`TenantPermission`, auth-service) et lus par le
  // service (`@RequiertDroit`). L'export de l'organisation reste réservé à instance:donnees:exporter.
  droits: [
    'paiement:demande:emettre', // demande et lien de paiement, QR ; préparer un ordre de paiement ; créances
    'paiement:lien:revoquer', // révoquer un lien émis
    'paiement:encaissement:declarer', // encaissement hors Prospera (espèces, virement), promesse (FR-P27 et suiv.)
    'paiement:encaissement:valider', // valider un encaissement déclaré, un ordre, les réglages ; affecter un encaissement en attente
    'paiement:annulation:enregistrer', // annulation et régularisation (groupe I)
    'paiement:compte:administrer', // comptes d'encaissement, secrets de notification, routage, raccordements, points de vente QR
    'paiement:journal:consulter', // journal opposable par créance et par chaîne (NFR-4)
    // Nouveaux (PRD distributeur, annexe B), à ajouter à `TenantPermission` (auth-service) :
    'paiement:creance:consulter', // registre des Créances, reste dû, balance âgée (FR-247) ; portée appliquée par le serveur
    'paiement:credit-tiers:imputer', // imputer un crédit du tiers sur une Créance désignée (FR-248) ; rembourser = un ordre
  ],

  // C5 : faits publiés et consommés, tels qu'ils existent sur origin/dev (outbox ; topics sans suffixe de
  // version : l'existant garde sa graphie, C5 amendé).
  publie: [
    'paiement.demande.emise',
    'paiement.demande.revoquee',
    'paiement.encaissement.constate', // vu chez le fournisseur (notification ou relevé)
    'paiement.encaissement.declare',
    'paiement.encaissement.valide',
    'paiement.encaissement.affecte',
    'paiement.encaissement.annule',
    'paiement.encaissement.ecart.constate',
    'paiement.promesse.enregistree',
    'paiement.promesse.constatee',
    'paiement.creance.materialisee',
    'paiement.creance.soldee',
    'paiement.creance.cloturee',
    'paiement.creance.troppercu.constate',
    'paiement.creance.anomalie.constatee',
    // Nouveaux, 2026-11-13 (voir l'en-tête) :
    'paiement.creance.changed@1', // état absolu : tiers, source, périmètre, composantes, reste dû, montantExigible, lueLe, échéance, ancienneté (FR-247 ; IMF AD-6)
    'paiement.credit-tiers.changed@1', // solde, origine (avance, acompte, trop-perçu, avoir), imputations (FR-248)
    'paiement.encaissement.changed@1', // état absolu d'un encaissement ; consommé par la microfinance (spine IMF, AD-9)
    'paiement.ordre-decaissement.changed@1', // ordreId, numeroEssai, état EN_COURS, EXECUTE, REJETE ou INCONNU (spine IMF AD-5)
    'paiement.ordre-versement.changed@1', // versement de la commission d'un freelance : mêmes états (FR-98, D-24)
    'paiement.relecture.demandee@1', // relecture ciblée du reste dû auprès du cœur avant un lien de paiement (spine IMF AD-6)
    // Abonnements Prospera (facturation de la plateforme, voir l'en-tête) : consommés par le catalogue,
    // seul écrivain des entitlements (AD-13).
    'paiement.abonnement.engage',
    'paiement.abonnement.echeance.encaissee',
    'paiement.abonnement.preavis.emis',
    'paiement.abonnement.impayee',
    'paiement.abonnement.regularise',
    'instance.journal@1', // à ajouter (le journal transactionnel `EcritureDArgent` existe déjà)
  ],
  consomme: [
    'etat-publie.changed.essai@1', // à brancher (C2, AD-24 du moteur) ; remplace `entitlement.changed`
    'etat-publie.changed.reel@1',
    'entitlement.changed',
    'kyc.status.changed',
    'identity.org.created',
    'identity.org.updated',
    'notification.consommation.arretee', // facturation de la consommation de messages (STORY-649)
    'connecteurs.domaine.changed@1', // domaine `paiement.encaissements` (ci-dessous)
    // Sources de créance, distributeur (FR-247, FR-216) :
    'facturation.facture.emise@1', // ouvre la Créance `FACTURE` ; émetteur freelance ⇒ périmètre du freelance (FR-224)
    'facturation.avoir.emis@1', // réduit la Créance, ou crée un crédit du tiers sur une facture payée (FR-248)
    'facturation.facture.reprise@1', // ouvre la Créance au reste dû repris de Sage (FR-216)
    // ⚠️ Le relevé de vente qui constate le dû du freelance (FR-97) n'a pas encore de fait nommé chez
    // `facturation` : à ajouter à son manifeste par la story du relevé [À CONFIRMER].
    // Freelance (D-24, FR-98) :
    'freelance.freelance.active@1', // COMPTEUR de l'add-on : prix par freelance actif (abonnements Prospera)
    'freelance.commission.acquise@1', // commission à verser : le DAF prépare l'ordre de versement, un second valide (FR-P66)
    // Microfinance (spine IMF AD-5, AD-6, AD-8) :
    'credit.dossier.accorde@1', // échéancier contractuel ⇒ Créances `ECHEANCE_DE_PRET` (upsert idempotent)
    'credit.ordre-decaissement.emis@1', // canal électronique : `paiement` exécute l'essai
    'coeur-sfd.ordre-decaissement.confirme@1', // les échéances deviennent exigibles
    'coeur-sfd.echeancier.changed@1', // recalage du montant exigible (AJUSTEMENT_COEUR, en ajout seul)
    'coeur-sfd.fraicheur.changed@1', // réponse à une relecture ; lien désactivé si le transport est trop lent
    'coeur-sfd.mouvement.apparie@1', // seul fait qui passe un encaissement de EN_ATTENTE_COEUR à confirmé
  ],

  profilCompose: 'paiement',

  // C13, point 1 : un fournisseur raccordé est une ressource extérieure, mais l'absence de raccordement ne
  // bloque pas l'installation : l'encaissement hors Prospera (déclaré) marche sans fournisseur.
  prerequis: [],

  verifications: [
    {
      code: 'compte-encaissement-verifie',
      route: 'POST /api/v1/instance/paiement/{organisationId}/verifications/compte-encaissement-verifie',
      critere:
        "Comptes d'encaissement vérifiés auprès de leur fournisseur, PI-SPI ou FedaPay (épreuve passée) : ≥ 1 🟢 ; 0 🟠 « seul l'encaissement déclaré est possible » (aucun lien de paiement ne peut être émis).",
    },
    {
      code: 'mode-sandbox-en-essai',
      route: 'POST /api/v1/instance/paiement/{organisationId}/verifications/mode-sandbox-en-essai',
      critere:
        "Dans l'espace d'essai, comptes raccordés à un fournisseur RÉEL : 0 🟢 ; ≥ 1 🔴 avec leur nombre (C13 point 6 : aucun paiement réel ne part de l'essai, `ECRITURE_REELLE_DEPUIS_ESSAI` ; NFR-5 : le sandbox est un chemin complet).",
    },
    {
      code: 'creances-equilibrees',
      route: 'POST /api/v1/instance/paiement/{organisationId}/verifications/creances-equilibrees',
      critere:
        'Créances dont le restant dû recalculé (montant − encaissements validés + annulations) diffère du restant rangé : 0 🟢 ; ≥ 1 🔴 avec leur nombre (NFR-2, exactitude monétaire, unités mineures entières).',
    },
  ],

  avertissementDesinstallation:
    "Demandes, encaissements, créances, promesses et journal restent enregistrés ; les liens déjà envoyés cessent d'encaisser, et les paiements reçus ensuite chez votre fournisseur ne seront plus rapprochés.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/paiement/migrer', // à créer
  interrupteurs: [],

  // C2, C13 point 5 : en LECTURE_SEULE, le client garde la preuve de son argent. Le rapprochement d'un
  // paiement déjà reçu chez son fournisseur reste ouvert : c'est constater un fait, pas émettre. Aucune
  // nouvelle demande n'est émise.
  routesLectureSeule: [
    'GET /api/v1/instance/paiement/{organisationId}/export',
    'GET /api/v1/creances',
    'GET /api/v1/creances/{id}',
    'GET /api/v1/creances/{id}/encaissements',
    'GET /api/v1/encaissements',
    'GET /api/v1/encaissements/export',
    'GET /api/v1/encaissements/ecarts',
    'GET /api/v1/journal/creances/{creanceId}',
    'POST /api/v1/comptes-encaissement/{compteId}/releves/imports', // relevé du fournisseur, rapprochement
    'POST /api/v1/comptes-encaissement/{compteId}/rapprochement',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/paiement/v1/… devant). À créer.
  // La route publique du lien (`PREFIXE_PUBLIC_LIEN/:jeton`) et le webhook des fournisseurs restent hors
  // gate (identité du jeton, signature du fournisseur).
  routesInstance: {
    export: 'GET /api/v1/instance/paiement/{organisationId}/export',
    import: 'POST /api/v1/instance/paiement/{organisationId}/import',
    effacement: 'POST /api/v1/instance/paiement/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/paiement/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Aucun objet de reprise : la spine de la Reprise envoie les créances ouvertes du distributeur à
  // `facturation` (« à confirmer ») et laisse l'historique des paiements « à confirmer ». Le PRD du
  // distributeur (lot 2) tranche ; si les créances arrivent ici, ce sera `paiement.creance@1` en version
  // mineure (valeur de contrôle : reste dû).
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 : « Encaissements terrain (Mobile Money, espèces) : Prospera » (PRD
  // Connecteurs §4.F), envoyés vers la comptabilité d'Odoo à l'étape 3 de FR-17, avec la file des écarts.
  // Domaine d'argent : jamais corrigé automatiquement (NFR-3 de Connecteurs) ; un encaissement attend la
  // facture qu'il règle (`EN_ATTENTE_DEPENDANCE`). Les créances ouvertes appartiennent à Odoo tant qu'il
  // tient la comptabilité ; promesses et relances restent à Prospera : domaine à déclarer quand la
  // créance aura son porteur. ✅ Porteur tranché (FR-247 : `paiement`) ; le domaine `paiement.creances`
  // reste « déclaré pour plus tard » (annexe A.17), avec Connecteurs, hors février.
  domainesEchange: [
    {
      code: 'paiement.encaissements',
      objets: ['paiement.encaissement@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true, // valeur de contrôle : montant en unités mineures, devise, référence du fournisseur
      niveauParDefaut: 'IMMEDIAT', // 5 minutes au plus avec API (PRD Connecteurs, niveaux)
      cleLibelleAction: 'paiement.echange.encaissements',
      publie: ['paiement.encaissement.valide', 'paiement.encaissement.annule'],
    },
  ],
} as const;
