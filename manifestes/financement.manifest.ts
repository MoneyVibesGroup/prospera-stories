// Manifeste M49 — Le dossier de financement bancaire (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories, `manifestes/financement.manifest.ts` (STORY-1083, 2026-11-18). Le service porteur en
// garde une copie à l'octet dans `src/vendor/manifestes/financement.manifest.ts`, gardée par son empreinte.
// Références : prds/prd-services-cabinet-2026-11-18/prd.md (FR-1 → FR-6, FR-17, §2.3, NFR-1 → NFR-5, D-SC-1, D-SC-2,
//              D-SC-3) ; epics-services-cabinet-2026-11-18.md (EPIC-266, lots F1 et F2 : STORY-1083 → 1086,
//              FE-140 → 142, AP-50) ; spine du moteur AD-17, AD-24 (état publié).
//
// Hors manifeste, pour mémoire :
// - Module NEUF (M49 proposé par le PRD), porté par `bilan-service` (D-SC-1 : il a déjà les états, le prévisionnel
//   et l'analyse), dossier `src/modules/financement/`, derrière SA garde (refus `FINANCEMENT_NOT_ENTITLED`), comme
//   `consolidation` est un module à part dans le même service. Verticale : cabinet.
// - Le dossier de financement appartient à un dossier CLIENT du cabinet (`/dossiers/{dossierId}/financements`) :
//   portée du dossier (hors portée, et pour un collaborateur hors de son portefeuille : 404), piste d'audit du
//   dossier (`GET /dossiers/{dossierId}/bilan/audit`). dossier-service est du socle : il n'entre pas dans `depends`.
// - États (FR-1) : `BROUILLON` → `PRET` → `REMIS` → `ACCORDE` | `REFUSE` | `ABANDONNE` ; toute autre transition est
//   refusée (409 `TRANSITION_INTERDITE`). `PRET` → `REMIS` exige une version figée (FR-5, STORY-1086) : d'ici là,
//   refusée `VERSION_FIGEE_ABSENTE`. `BROUILLON` → `PRET` exigera que rien de bloquant ne manque (FR-2, STORY-1085).
//   Un dossier `REMIS` ne se modifie plus : une correction ouvre la version n+1, la précédente reste lisible.
// - Droits (C7) : déclarés ici, attribués dans `auth-service` (catalogue de tenant, HORS du jeton, STORY-1083) :
//   `CAB_ASSOCIE` (et `TENANT_ADMIN`) les trois, `CAB_COLLABORATEUR` (et `TENANT_USER`) préparer et consulter (PRD
//   §2.3). Le service les lit par `GET /moi/droits` (`droits ∪ droitsHorsJeton`), jamais dans le jeton. Créer et
//   modifier un brouillon exigent `financement:dossier:preparer` ; toute transition, et la correction d'un dossier
//   remis, `financement:dossier:valider` ; toute lecture, `financement:dossier:consulter`.
// - Banque cible : code du référentiel `exigences-bancaires-uemoa` (console, AP-50) et version lue, gardée par le
//   dossier (NFR-8). La lecture du référentiel et la complétude viennent avec STORY-1085.
// - Montants entiers en FCFA (NFR-3) ; aucune transmission à la banque (D-SC-2) : le cabinet remet le document figé.
// - Le catalogue ne connaît pas encore ce module (copie des manifestes en retard, STORY-977) : tant qu'il ne publie
//   aucun état pour `financement`, la garde refuse tout (fermé, voulu).

export const MANIFESTE_FINANCEMENT = {
  code: 'financement',
  version: '0.1.0',

  // C1 : bilan est une dépendance DURE. Le dossier de financement lit les états validés (historique), le prévisionnel
  // (scénario retenu, STORY-1084) et l'analyse (indicateurs) du module Bilan, dans le même service.
  depends: [
    {
      code: 'bilan',
      raison:
        "Le dossier présenté à la banque se construit sur les états validés, le prévisionnel et l'analyse du module Bilan.",
    },
  ],

  // C4 : `ged` (archives du client, EPIC-267) enrichira la liste des pièces ; sans lui, les pièces se lisent dans
  // document-service (socle), STORY-1085.
  enrichiPar: [],

  referentielFamilies: ['syscohada-revise'],

  // C7 : droits de tenant (format `<module>:<objet>:<action>`, 40 caractères au plus).
  droits: [
    'financement:dossier:preparer', // créer un dossier de financement, modifier un brouillon (STORY-1083)
    'financement:dossier:valider', // toute transition d'état (FR-1), correction d'un dossier remis (version n+1)
    'financement:dossier:consulter', // lire les dossiers de financement du client et leurs versions
  ],

  // C5 : faits publiés et consommés.
  publie: [],
  consomme: [
    'etat-publie.changed.essai@1', // la garde (AD-24), dans l'espace d'essai
    'etat-publie.changed.reel@1', // la garde (AD-24), dans le réel
  ],

  // Même service que `bilan` : même profil compose.
  profilCompose: 'bilan',

  prerequis: [],

  // C13, points 2 et 8 : aucune vérification propre au jour 1 (les données du module se créent après l'installation).
  verifications: [],

  avertissementDesinstallation:
    "Les dossiers de financement et leurs versions restent enregistrés et lisibles ; aucun dossier ne pourra plus être créé, modifié ni changer d'état.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/financement/migrer', // à créer
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (sous /api/v1).
  routesLectureSeule: [
    'GET /api/v1/dossiers/{dossierId}/financements',
    'GET /api/v1/dossiers/{dossierId}/financements/{financementId}',
    'GET /api/v1/dossiers/{dossierId}/financements/{financementId}/versions',
    'GET /api/v1/dossiers/{dossierId}/financements/{financementId}/versions/{version}',
  ],

  // C13, point 7 (chemins vus par le service). À créer : l'effacement de l'organisation passe aujourd'hui par celui de
  // `bilan` (`POST /api/v1/instance/bilan/{organisationId}/effacement`), qui efface aussi les collections du module.
  routesInstance: {
    export: 'GET /api/v1/instance/financement/{organisationId}/export',
    import: 'POST /api/v1/instance/financement/{organisationId}/import',
    effacement: 'POST /api/v1/instance/financement/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/financement/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  objetsDeReprise: [],

  domainesEchange: [],
} as const;
