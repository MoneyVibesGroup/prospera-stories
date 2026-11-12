// Manifeste M36 — Bilan comptable & prévisionnel (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Rétro-saisie : le module est CODÉ. Ce manifeste décrit ce que `bilan-service` fait sur origin/dev
// (3f8e235, MNV-729) ; le PRD dit ce qu'il doit faire. Là où les deux divergent, l'écart est écrit.
// Le propriétaire du dépôt `bilan-service` le copie dans `src/module.manifest.ts` la semaine où il y
// travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prd-bilan-service-2026-07-10.md (FR-001 → FR-024, NFR-001 → NFR-009, EPIC-009 → 014 ;
//              EPIC-009 « import de balance » remplacé par balance-service, décision D14 de l'Atelier) ;
//              architecture-bilan-service-2026-07-07.md ; epics-consolidation-2026-08-28.md ;
//              PRD Fiscalité §4 (bilan produit le CONTENU de la DSF, fiscal-service le dépose) ;
//              STORY-446 (bilan ne dépose rien, il enregistre un accusé), MNV-729 (référentiel par dossier).
//
// Hors manifeste, pour mémoire :
// - Offre : pack de chaque vertical (cabinet, distributeur, microfinance, assurance).
// - Écrans : module d'écran `bilan` dans `prospera-app` (C8), tous les écrans par Dev B ; l'app
//   expert-comptable suit la même règle (`/dossiers/:id/bilan`). Chaque entrée de menu exige un des droits
//   ci-dessous.
// - C11 : sans objet. L'analyse et le prévisionnel sont des calculs déterministes sur hypothèses saisies.
// - Gate existante : `@RequiresBilanAccess` (e-mail vérifié → KYC approuvé → entitlement `bilan`), refus
//   `BILAN_NOT_ENTITLED`, plus `@Roles` et la portée de dossier (hors portée = 404 ; dossier archivé :
//   lecture permise, écriture 409, D9). La consolidation ajoute une portée de groupe (`PorteeGroupeGuard`).
//   ⚠️ Écarts à combler à la prochaine gate du service : la garde lit `entitlement.changed`, pas l'état
//   publié (C2, AD-24) ; aucune route `instance/bilan/…` (C13) ; aucun profil compose (C10) ; aucun droit de
//   tenant (les rôles ouvrent tout) : les droits ci-dessous sont à ajouter à `TenantPermission` (C7).
// - Référentiel : choisi PAR DOSSIER (MNV-729) : un cabinet produit la liasse SFD ou CIMA d'un client IMF ou
//   assureur. Un dossier dont le référentiel est ambigu rend 409 (STORY-728 : référentiel à l'option seule).
// - La consolidation (épics de consolidation : agrégat, éliminations, mise en équivalence, impôts différés,
//   états consolidés) vit dans bilan-service, aujourd'hui sous la gate `bilan`. ✅ Décision du PO du
//   2026-11-12 : c'est un MODULE À PART, `consolidation` (voir `consolidation.manifest.ts`), dans le même
//   service, derrière sa propre gate. Ses routes, son droit et le topic de périmètre sortent de ce manifeste.
// - Rôles proposés (à confirmer avec les rôles du cabinet) : collaborateur = consulter, produire,
//   previsionnel ; expert-comptable = + valider, mapping, exercice, depot.

export const MANIFESTE_BILAN = {
  code: 'bilan',
  version: '1.0.0',

  // C1 : balance est une dépendance DURE. Le bilan n'ingère que des soldes, et les soldes viennent de la
  // balance validée (`balance.created`, D14) : « balance va partout où bilan va » (seed, STORY-366).
  depends: [
    {
      code: 'balance',
      raison:
        "Les états financiers se calculent sur une balance validée ; c'est l'Atelier de balance qui la produit et la livre (D14).",
    },
  ],

  // C4 : sans declarations, l'état « déposée » d'une liasse vient de l'accusé saisi à la main
  // (`POST …/etats/:id/deposer`, STORY-446) ; le fait `fiscal.declaration.deposee` s'écrit « non installé »,
  // jamais « non déposée ».
  enrichiPar: ['declarations'],

  referentielFamilies: ['syscohada-revise', 'sfd-bceao', 'cima-assurances'],

  // C7 : droits de tenant proposés. L'export de l'organisation reste réservé à instance:donnees:exporter.
  droits: [
    'bilan:etats:consulter', // états, versions, comparaisons, analyse, audit, projections, exports PDF/Excel
    'bilan:etats:produire', // créer, recalculer, compléter un jeu d'états brouillon
    'bilan:etats:valider', // figer (snapshot immuable, FR-014/015) et rouvrir avec motif
    'bilan:depot:enregistrer', // accusé de dépôt reçu de l'administration (STORY-446) ; bilan ne dépose rien
    'bilan:mapping:arbitrer', // ajustements compte → poste, validés ou rejetés (FR-008)
    'bilan:exercice:clore', // clore et rouvrir un exercice (FR-016)
    'bilan:previsionnel:construire', // hypothèses, versions, verrouillage, rebasage (FR-018 → FR-021)
  ],

  // C5 : faits publiés et consommés, tels qu'ils existent sur origin/dev (topics sans suffixe de version).
  publie: [
    'liasse.etat.change', // cycle de vie du jeu d'états : brouillon, validé, rouvert, déposé
    'instance.journal@1', // validations, réouvertures, dépôts enregistrés, export, effacement (à ajouter)
  ],
  consomme: [
    'etat-publie.changed.essai@1', // à brancher (C2, AD-24 du moteur) ; remplace `entitlement.changed`
    'etat-publie.changed.reel@1',
    'entitlement.changed',
    'kyc.status.changed',
    'identity.user.registered', // auteur rendu par son identité dans l'audit
    'identity.user.updated',
    'identity.user.suspended',
    'identity.membership.changed',
    'balance.created', // read-model des balances validées (sans les lignes : bilan ne duplique pas la balance)
    'balance.etat.document.change',
    'immobilisations.tableau.publie', // émis par balance-service (voir M40)
    'fiscal.declaration.deposee', // émis par fiscal-service (module `declarations`)
    'dossier.created',
    'dossier.updated',
    'dossier.exercice.ouvert',
    'dossier.exercice.clos',
    'dossier.exercice.rouvert',
  ],

  profilCompose: 'bilan',

  prerequis: [],

  verifications: [
    {
      code: 'referentiel-resolu',
      route: 'POST /api/v1/instance/bilan/{organisationId}/verifications/referentiel-resolu',
      critere:
        "Dossiers dont le référentiel se résout à un seul artefact (postes, table de passage) vérifié par empreinte : tous 🟢 ; ≥ 1 sans référentiel ou ambigu (409) 🔴 avec leur nombre (NFR-009, MNV-729).",
    },
    {
      code: 'snapshots-intacts',
      route: 'POST /api/v1/instance/bilan/{organisationId}/verifications/snapshots-intacts',
      critere:
        "Jeux d'états VALIDÉS dont l'empreinte recalculée diffère de l'empreinte rangée : 0 🟢 ; ≥ 1 🔴 avec leur nombre (FR-015, NFR-004 : un snapshot figé est immuable).",
    },
    {
      code: 'consommateurs-actifs',
      route: 'POST /api/v1/instance/bilan/{organisationId}/verifications/consommateurs-actifs',
      critere:
        "Consommateurs du service à l'arrêt (balance, déclaration, immobilisations, exercice, entitlement ; `etat-consommateurs`) : 0 🟢 ; ≥ 1 🔴 avec leur nom. Un consommateur arrêté laisse le producteur émettre dans le vide sans erreur nulle part : c'est arrivé à `balance.created` pendant treize mois.",
    },
  ],

  avertissementDesinstallation:
    "Jeux d'états, liasses figées, hypothèses et prévisionnels restent enregistrés ; aucune nouvelle liasse ne pourra être produite, et la déclaration ne trouvera plus de DSF à déposer.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/bilan/migrer', // à créer
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (chemins existants, sous /api/v1). Les dry-runs
  // sont des POST qui ne persistent rien (`@LectureSeule`, STORY-357) : ils passent comme des lectures.
  // Enregistrer un accusé de dépôt reste ouvert : une DSF se dépose après la clôture, et le constat d'un
  // dépôt n'est pas une production (STORY-446) [À CONFIRMER].
  routesLectureSeule: [
    'GET /api/v1/instance/bilan/{organisationId}/export',
    'GET /api/v1/dossiers/{dossierId}/bilan/etats',
    'GET /api/v1/dossiers/{dossierId}/bilan/etats/{id}',
    'GET /api/v1/dossiers/{dossierId}/bilan/etats/{id}/versions',
    'GET /api/v1/dossiers/{dossierId}/bilan/etats/{id}/versions/{version}/contenu',
    'GET /api/v1/dossiers/{dossierId}/bilan/export/etats/{jeuEtatsId}', // liasse PDF/Excel
    'GET /api/v1/dossiers/{dossierId}/bilan/export/previsionnel/{hypothesesId}',
    'GET /api/v1/dossiers/{dossierId}/bilan/consultation',
    'POST /api/v1/dossiers/{dossierId}/bilan/etats/bilan/dry-run',
    'POST /api/v1/dossiers/{dossierId}/bilan/etats/compte-resultat/dry-run',
    'POST /api/v1/dossiers/{dossierId}/bilan/etats/tft/dry-run',
    'POST /api/v1/dossiers/{dossierId}/bilan/etats/notes-annexes/dry-run',
    'POST /api/v1/dossiers/{dossierId}/bilan/etats/controles/dry-run',
    'POST /api/v1/dossiers/{dossierId}/bilan/etats/{id}/deposer',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/bilan/v1/… devant). À créer.
  routesInstance: {
    export: 'GET /api/v1/instance/bilan/{organisationId}/export',
    import: 'POST /api/v1/instance/bilan/{organisationId}/import',
    effacement: 'POST /api/v1/instance/bilan/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/bilan/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Aucun objet de reprise : les états se recalculent depuis la balance, ils ne se reprennent pas
  // (PRD Reprise, OQ-6). Les liasses déjà déposées d'un client restent dans son ancien logiciel ou en PDF ;
  // le comparatif N-1 vient de la balance d'ouverture reprise par l'Atelier.
  objetsDeReprise: [],

  // Aucun domaine d'échange : un état financier est calculé, il ne s'échange pas avec Odoo.
  domainesEchange: [],
} as const;
