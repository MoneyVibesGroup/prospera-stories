// Manifeste M35 — Atelier de balance (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Rétro-saisie : le module est CODÉ. Ce manifeste décrit ce que `balance-service` fait sur origin/dev
// (12860df, MNV-729) ; le PRD dit ce qu'il doit faire. Là où les deux divergent, l'écart est écrit.
// Le propriétaire du dépôt `balance-service` le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prd-atelier-balance-2026-07-12.md (FR-A01 → FR-A28, NFR-A01 → NFR-A10, épics AB-01 → AB-08) ;
//              spine architecture/architecture-balance-service-2026-08-15 ;
//              PRD Fiscalité §4 (le CALCUL fiscal reste ici, fiscal-service porte le déclaratif) ;
//              STORY-101 (contrat de balance canonique), STORY-366 et STORY-549 (codes du catalogue) ;
//              PRD Reprise OQ-6, PRD Connecteurs FR-17 (la comptabilité d'Odoo vers Prospera attend).
//
// Hors manifeste, pour mémoire :
// - Offre : pack de chaque vertical (cabinet, distributeur, microfinance, assurance). `bilan` n'ingère que des
//   soldes et les soldes viennent d'ici : `balance` va partout où `bilan` va (seed, STORY-366).
// - Écrans : module d'écran `balance` dans `prospera-app` (C8), tous les écrans par Dev B ; l'app
//   expert-comptable suit la même règle (Atelier, `/dossiers/:id/atelier`). Chaque entrée de menu exige un
//   des droits ci-dessous.
// - C11 : sans objet. La suggestion de compte (STORY-139) est une règle (surcharges de l'organisation puis
//   plan du référentiel lu à l'envers), sans modèle. L'OCR est celui de document-service (Tesseract).
// - Gate existante : `@RequiresBalanceAccess` (e-mail vérifié → KYC approuvé → entitlement `balance`),
//   refus `BALANCE_NOT_ENTITLED`, plus `@Roles(TENANT_ADMIN, TENANT_USER)` et la portée de dossier
//   (`DossierScopeGuard`, hors portée = 404). ⚠️ Écarts à combler à la prochaine gate du service :
//   · la garde lit encore `entitlement.changed`, pas l'état publié (C2, AD-24 du moteur) ;
//   · aucune route `instance/balance/…` (C13) n'existe ; aucun profil compose (C10) ;
//   · aucun droit de tenant : les rôles TENANT_ADMIN/TENANT_USER ouvrent tout. Les droits ci-dessous sont à
//     ajouter à `TenantPermission` (auth-service) par une PR, au moment où le service les lit (C7).
// - ⛔ Le service porte aujourd'hui TROIS modules commerciaux derrière la SEULE gate `balance` :
//   · `balance` (AB-01 → AB-06, AB-08) : ce manifeste ;
//   · `conseil` (AB-07 : scénarios d'optimisation, comparatif, dossier de justification) : voir
//     `conseil.manifest.ts`. Tant que les routes AB-07 n'ont pas leur propre gate, le conseil se donne avec
//     la balance, alors que le PO a décidé qu'ils se vendent séparément (STORY-549). ✅ Constat confirmé par
//     le PO le 2026-11-12 : la gate `CONSEIL_NOT_ENTITLED` est à poser ;
//   · les immobilisations : registre, plans, cessions, dotations publiées par
//     `immobilisations.tableau.publie`. ✅ Décision du PO du 2026-11-12 : elles RESTENT dans `balance`,
//     parce qu'elles servent à faire le bilan (tableau des immobilisations, dotations, notes annexes). Ce
//     n'est pas un module à part : M40 est couvert par `balance`, sans code `immobilisations`.
// - Données par DOSSIER (`dossierId` dans l'URL, vérifié contre la portée serveur). Le cabinet tient les
//   balances de ses clients, dont celle d'un client IMF au référentiel du client (MNV-729). dossier-service
//   est du socle, pas un module : il n'entre pas dans `depends`. document-service (OCR des pièces, des
//   statuts et de la carte CFE) est traité comme socle ici [À CONFIRMER au manifeste `ged`, M07].
// - Rôles proposés (à confirmer avec les rôles du cabinet) : collaborateur = consulter, importer, cahier,
//   rapprochement ; expert-comptable = + valider, rattachement, fiscal, inventaire, a-nouveaux ;
//   administrateur du cabinet = + profil.

export const MANIFESTE_BALANCE = {
  code: 'balance',
  version: '1.0.0',

  // Le module est la source : il ne dépend d'aucun autre module. Le référentiel comptable et le paquet
  // fiscal sont des artefacts du catalogue (STORY-078), pas des modules.
  depends: [],

  // C4 : sources de l'adaptateur #1 du hub (ingestion directe `balance.submitted`, STORY-102). Sans elles,
  // aucune balance n'arrive par ce chemin ; l'import de fichier (Sage, profils) et les cahiers restent.
  // Une balance attendue d'un vertical non installé s'écrit `NON_INSTALLE`, jamais « aucune balance ».
  // - microfinance : publie `balance.submitted` (constaté sur origin/dev) ;
  // - stock : la valeur de stock d'un arrêté se publie comme une balance (spine du stock, AD-7 ; origine
  //   STOCK à ajouter, EPIC-081) ;
  // - assurance : [À CONFIRMER] (la publication n'est pas constatée dans le code).
  enrichiPar: ['microfinance', 'stock', 'assurance'],

  // Les familles que le pont `ReferentielRegistry.PONT_TAG` sait servir (seed STORY-366).
  referentielFamilies: ['syscohada-revise', 'smt-togo', 'sfd-bceao', 'cima-assurances'],

  // C7 : droits de tenant proposés (format `<module>:<objet>:<action>`, vérifié contre
  // TENANT_PERMISSION_FORMAT). L'export de l'organisation reste réservé à instance:donnees:exporter (C2).
  droits: [
    'balance:balance:consulter', // balances, contrôles, rejets d'ingestion, référentiel actif, plan de comptes
    'balance:balance:importer', // import Sage et par profil (à blanc par défaut), agrégation des cahiers en balance
    'balance:balance:valider', // BROUILLON → VALIDÉE ou rejet : la balance validée part au bilan (FR-A28)
    'balance:cahier:saisir', // cahiers de recettes et de dépenses, catégories, pièces OCR (chemin A)
    'balance:rattachement:arbitrer', // surcharges compte → poste, ventilation, suggestion de compte (FR-A07, FR-A11)
    'balance:rapprochement:realiser', // comptes de trésorerie, relevés (Mobile Money compris), appariements (AB-05)
    'balance:fiscal:calculer', // retraitements réels, déficits, acomptes, crédits, TVA, TPU, taxes, provisions (AB-06)
    'balance:inventaire:realiser', // inventaire de clôture, créances et dettes en devises, réévaluation
    'balance:a-nouveaux:reprendre', // ouverture d'exercice, à-nouveaux, affectation du résultat (FR-A13)
    'balance:profil:administrer', // profil société, OCR des statuts et de la carte CFE, deux axes (AB-01)
  ],

  // C5 : faits publiés et consommés, tels qu'ils existent sur origin/dev (topics sans suffixe de version :
  // l'existant garde sa graphie, un renommage passe par un `@2`, C5 amendé et C12).
  publie: [
    'balance.created', // balance validée et livrée (handoff STORY-099), lue par bilan-service
    'balance.rejected', // balance soumise (adaptateur #1) refusée par le validateur, avec motif
    'balance.etat.change', // cycle de vie BROUILLON → VALIDÉE → …
    'balance.etat.document.change',
    'cahier.piece.rattachee', // une pièce OCR rattachée à une ligne de cahier
    'profil.societe.consolide', // profil société validé par l'humain (FR-A02)
    'immobilisations.tableau.publie', // tableau des immobilisations et dotations, lu par bilan-service (M40 couvert par balance)
    'instance.journal@1', // validations, rejets, changements de rattachement, export, effacement (à ajouter)
  ],
  consomme: [
    'etat-publie.changed.essai@1', // à brancher (C2, AD-24 du moteur) ; remplace `entitlement.changed`
    'etat-publie.changed.reel@1',
    'entitlement.changed', // lu aujourd'hui par la garde
    'kyc.status.changed',
    'balance.submitted', // adaptateur #1 du hub (STORY-102)
    'document.piece.extrait', // OCR des pièces de cahier
    'document.profil.extrait', // OCR des statuts et de la carte CFE
    'dossier.created',
    'dossier.updated',
    'dossier.axes.decides', // système comptable et régime fiscal du dossier
    'dossier.exercice.ouvert',
    'dossier.exercice.clos',
    'dossier.exercice.rouvert',
  ],

  profilCompose: 'balance',

  // C13, point 1 : rien d'extérieur. Le référentiel et le paquet fiscal viennent du catalogue de l'espace.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'referentiel-resolu',
      route: 'POST /api/v1/instance/balance/{organisationId}/verifications/referentiel-resolu',
      critere:
        "Dossiers de l'organisation dont le référentiel comptable actif se résout à un seul artefact vérifié par empreinte : tous 🟢 ; ≥ 1 sans référentiel ou ambigu 🔴 avec leur nombre (aucune balance n'y serait validable).",
    },
    {
      code: 'paquet-fiscal-disponible',
      route: 'POST /api/v1/instance/balance/{organisationId}/verifications/paquet-fiscal-disponible',
      critere:
        "Dossiers au régime réel ou synthétique dont le paquet fiscal pays × année de l'exercice ouvert est publié : tous 🟢 ; ≥ 1 manquant 🟠 avec leur nombre (la balance reste utilisable, le calcul fiscal non).",
    },
    {
      code: 'balances-equilibrees',
      route: 'POST /api/v1/instance/balance/{organisationId}/verifications/balances-equilibrees',
      critere:
        'Balances VALIDÉES dont le recalcul (Σ débit − Σ crédit, checksum) sort de la tolérance de 100 unités mineures ou diffère de la valeur rangée : 0 🟢 ; ≥ 1 🔴 avec leur nombre (FR-A25, NFR-A03).',
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation.
  avertissementDesinstallation:
    "Balances, cahiers, rapprochements, calculs fiscaux et profils restent enregistrés ; aucune nouvelle balance ne sera livrée au bilan (états et liasses figés restent lisibles) et le conseil fiscal ne pourra plus simuler.",

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/balance/migrer', // à créer ; idempotent, appelé par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (chemins existants, sous /api/v1). La balance
  // validée et le résultat fiscal restent lisibles et exportables : c'est la matière d'une liasse à déposer.
  routesLectureSeule: [
    'GET /api/v1/instance/balance/{organisationId}/export',
    'GET /api/v1/dossiers/{dossierId}/balances',
    'GET /api/v1/dossiers/{dossierId}/balances/{id}',
    'GET /api/v1/dossiers/{dossierId}/balances/{id}/export',
    'GET /api/v1/dossiers/{dossierId}/balances/{id}/controles',
    'GET /api/v1/dossiers/{dossierId}/fiscal/resultat-fiscal',
    'GET /api/v1/dossiers/{dossierId}/fiscal/resultat-fiscal/export',
    'GET /api/v1/dossiers/{dossierId}/fiscal/liquidation',
    'GET /api/v1/dossiers/{dossierId}/rapprochement/etat', // état de rapprochement de fin d'exercice (FR-A17)
    'GET /api/v1/dossiers/{dossierId}/immobilisations',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/balance/v1/… devant). À créer.
  routesInstance: {
    export: 'GET /api/v1/instance/balance/{organisationId}/export',
    import: 'POST /api/v1/instance/balance/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/balance/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/balance/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // Aucun objet de reprise (PRD Reprise, OQ-6 : « le cabinet importe ses balances par l'Atelier de
  // balance »). La balance d'ouverture d'un client qui quitte Sage entre par l'import Sage de l'Atelier puis
  // les à-nouveaux (FR-A12, FR-A13), pas par la Reprise. [À CONFIRMER] pour le distributeur de février s'il
  // reprend aussi sa comptabilité : même chemin, par l'Atelier.
  objetsDeReprise: [],

  // Aucun domaine d'échange : quand Odoo tient la comptabilité, il est propriétaire des écritures, et la
  // comptabilité d'Odoo vers Prospera « attend » (PRD Connecteurs FR-17). Le jour où elle vient, la voie
  // naturelle est une balance soumise par l'adaptateur #1 (`balance.submitted`) [À CONFIRMER].
  domainesEchange: [],
} as const;
