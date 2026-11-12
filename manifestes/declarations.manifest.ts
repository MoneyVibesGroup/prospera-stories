// Manifeste M37 — Déclarations fiscales (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Rétro-saisie : le module est CODÉ en partie. Ce manifeste décrit ce que `prospera-fiscal-service` fait sur
// origin/dev (f48c62c, MNV-727) ; le PRD dit ce qu'il doit faire (incréments I1 → I5). Là où les deux
// divergent, l'écart est écrit.
// Le propriétaire du dépôt `prospera-fiscal-service` le copie dans `src/module.manifest.ts` la semaine où il
// y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-fiscalite-2026-07-31 (FR-F01 → FR-F80, NFR-F01 → NFR-F16, incréments I1 → I5) ;
//              spine architecture/architecture-fiscal-service-2026-08-03 (AD-1 → AD-19) ;
//              épics epics-fiscalite-2026-08-03.md (EPIC-027 → 034) ;
//              STORY-549 (D-549-1 : `declarations` reprend le rôle de `fiscalite`).
//
// Hors manifeste, pour mémoire :
// - Offre : pack cabinet ; obligation que tout cabinet a, vendue à part du conseil (STORY-549).
// - Écrans : module d'écran `declarations` dans `prospera-app` (C8), tous les écrans par Dev B ; l'app
//   expert-comptable suit la même règle. Chaque entrée de menu exige un des droits ci-dessous.
// - C11 : sans objet. Tout calcul opposable est déterministe (NFR-F03) ; familles de calcul = registre de
//   stratégies typées, jamais un interpréteur (AD de la spine).
// - Gate existante : `FiscalAccessGuard` (e-mail vérifié → KYC approuvé → entitlement), refus
//   `FISCAL_NOT_ENTITLED`. Elle ouvre le service sur `fiscalite` OU `declarations` (`FISCAL_MODULE_CODES`) ;
//   le read-model est keyé (organisation, module), D-549-1. `fiscalite` est retiré de l'offre (DEPRECATED)
//   mais reste lu pour les octrois existants.
//   ⚠️ Écarts à combler à la prochaine gate du service :
//   · le refus devrait se nommer `DECLARATIONS_NOT_ENTITLED` (C2 : `<MODULE>_NOT_ENTITLED`) ; renommer un
//     code de refus est un changement visible : `FISCAL_NOT_ENTITLED` reste lu jusqu'à la sortie de
//     `fiscalite`, puis on passe [À CONFIRMER] ;
//   · la garde lit `entitlement.changed`, pas l'état publié (C2, AD-24) ; aucune route
//     `instance/declarations/…` (C13) ; aucun profil compose (C10 : le service n'est même pas au compose) ;
//   · rôles TENANT_ADMIN / TENANT_USER seulement : les six habilitations graduées de FR-F59 (lecture,
//     préparation, contrôle, validation, dépôt, règlement) deviennent les droits ci-dessous, à ajouter à
//     `TenantPermission` (C7).
// - Ce qui est codé : échéances calculées (dossier × état × période), paquets fiscaux et paquets de dépôt
//   lus au catalogue, livrable de dépôt (e-DSF, complétude, trace), dépôts avec accusé et rejet, archivage
//   des livrables. Ce qui ne l'est pas : implantations et catalogue d'obligations dérivé (I1), cycle de vie
//   de l'obligation et validation du client (I3), règlement et social (I5).
// - Le CALCUL de l'impôt reste à balance-service (FR-F23, PRD §4) ; le CONTENU de la DSF reste à
//   bilan-service. Ce module emballe, guide le dépôt, capture l'accusé et garde la preuve.
// - Dépôt ASSISTÉ en v1 : aucun portail de la zone n'expose d'API ; aucun secret de canal n'est stocké
//   (NFR-F05). Le règlement est préparé et rapproché, JAMAIS exécuté (§3.3).
// - La gouvernance du paquet fiscal (FR-F67 → FR-F70) est un acte de la PLATEFORME (admin-panel), pas un
//   droit de tenant.
// - Jalon bloquant « format confirmé » avant tout nouveau canal de dépôt : une pièce réelle par canal.

export const MANIFESTE_DECLARATIONS = {
  code: 'declarations',
  version: '1.0.0',

  // C1 : bilan est une dépendance DURE. La DSF, livrable principal du dépôt, est produite par bilan-service ;
  // fiscal-service l'obtient (liasse figée, contenu), la met au format du canal et la dépose. « Le service
  // qui produit le contenu n'est pas celui qui porte le dépôt » (PRD §4). balance vient avec bilan.
  depends: [
    {
      code: 'bilan',
      raison:
        "La liasse fiscale (DSF) qu'on dépose est produite et figée par le module Bilan ; sans elle, il n'y a rien à déposer.",
    },
  ],

  // C4 : sans conseil, rien ne manque ici : le dossier de justification des retraitements vient de balance
  // (FR-F55). Aucune dépendance optionnelle aujourd'hui. Le règlement de l'impôt (I5) n'utilisera pas
  // le module `paiement` : il prépare un ordre, il ne l'exécute pas.
  enrichiPar: [],

  referentielFamilies: ['syscohada-revise', 'zone-franche-togo'],

  // C7 : droits de tenant proposés, un par habilitation de FR-F59 (« aucune n'implique l'autre »), plus la
  // levée d'anomalie (FR-F66) et la base de rémunération (FR-F28). L'export de l'organisation reste réservé
  // à instance:donnees:exporter.
  droits: [
    'declarations:obligation:consulter', // calendrier, échéances, obligations, dépôts, preuves, dossier de contrôle
    'declarations:declaration:preparer', // le collaborateur prépare et soumet (FR-F34)
    'declarations:declaration:controler', // l'expert-comptable contrôle
    'declarations:declaration:valider', // validation humaine identifiée ; pièce du client (FR-F35, NFR-F02)
    'declarations:depot:enregistrer', // livrable, dépôt assisté, accusé, rejet (FR-F39 → FR-F45)
    'declarations:reglement:preparer', // ordre ou instructions de règlement, rapprochement ; jamais d'exécution
    'declarations:anomalie:lever', // levée motivée et journalisée (FR-F66)
    'declarations:remuneration:saisir', // base de rémunération, import et saisie (FR-F27 → FR-F29)
  ],

  // C5 : faits publiés et consommés, tels qu'ils existent sur origin/dev (topics sans suffixe de version).
  publie: [
    'fiscal.declaration.deposee', // lu par bilan-service (la liasse passe « déposée »)
    'instance.journal@1', // à ajouter ; le journal d'audit fiscal reste dans sa base séparée `fiscal_audit`
  ],
  consomme: [
    'etat-publie.changed.essai@1', // à brancher (C2, AD-24 du moteur) ; remplace `entitlement.changed`
    'etat-publie.changed.reel@1',
    'entitlement.changed', // `fiscalite` ou `declarations`
    'kyc.status.changed',
    'identity.user.registered',
    'identity.user.updated',
    'identity.user.suspended',
    'identity.membership.changed',
    'dossier.created',
    'dossier.updated',
    'dossier.exercice.ouvert',
    'dossier.exercice.clos',
    'dossier.exercice.rouvert',
    // bilan-service et dossier-service sont lus par endpoint documenté (liasse figée, contenu de liasse,
    // liasse déposée, portefeuille), par le proxy de l'espace (C5).
  ],

  profilCompose: 'declarations',

  // C13, point 1 : aucune ressource extérieure en v1 (dépôt assisté, aucun connecteur de portail).
  prerequis: [],

  verifications: [
    {
      code: 'paquet-fiscal-publie',
      route: 'POST /api/v1/instance/declarations/{organisationId}/verifications/paquet-fiscal-publie',
      critere:
        "Dossiers dont le paquet fiscal type d'entité × pays × année de l'exercice ouvert est publié et vérifié par empreinte : tous 🟢 ; ≥ 1 manquant 🔴 avec leur nombre (refus nommé, jamais un montant approximatif : FR-F78, NFR-F04).",
    },
    {
      code: 'bilan-joignable',
      route: 'POST /api/v1/instance/declarations/{organisationId}/verifications/bilan-joignable',
      critere:
        "Lecture d'une liasse figée de l'organisation chez bilan-service par le proxy de l'espace en moins de 5 s : 🟢 ; sinon 🔴 (aucun livrable de dépôt ne peut se produire).",
    },
    {
      code: 'depots-sans-preuve',
      route: 'POST /api/v1/instance/declarations/{organisationId}/verifications/depots-sans-preuve',
      critere:
        "Dépôts enregistrés sans accusé ni rejet depuis plus de 30 jours : 0 🟢 ; ≥ 1 🟠 avec leur nombre (la preuve est la valeur du module, FR-F42).",
    },
  ],

  avertissementDesinstallation:
    "Échéances, livrables, dépôts, accusés et preuves restent enregistrés ; le calendrier fiscal ne sera plus tenu et plus aucun dépôt ne pourra être préparé ni prouvé.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/declarations/migrer', // à créer
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (chemins existants, sous /api/v1). Enregistrer un
  // accusé ou un rejet reste ouvert : c'est constater un fait de l'administration, et la preuve d'un dépôt
  // déjà fait est un droit du client (C2 : une sanction commerciale ne crée pas de manquement).
  routesLectureSeule: [
    'GET /api/v1/instance/declarations/{organisationId}/export',
    'GET /api/v1/echeances',
    'GET /api/v1/depots',
    'GET /api/v1/depots/{id}',
    'GET /api/v1/depots/{id}/fichier',
    'POST /api/v1/depots/{id}/accuse',
    'POST /api/v1/depots/{id}/rejet',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/declarations/v1/… devant). À créer.
  routesInstance: {
    export: 'GET /api/v1/instance/declarations/{organisationId}/export',
    import: 'POST /api/v1/instance/declarations/{organisationId}/import',
    effacement: 'POST /api/v1/instance/declarations/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/declarations/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Aucun objet de reprise en v1 (PRD Reprise, OQ-6 : pas de reprise pour le cabinet). Les déclarations
  // déjà déposées d'un client restent dans son ancien outil ; la continuité des crédits et déficits passe
  // par la balance (FR-F64).
  objetsDeReprise: [],

  // Aucun domaine d'échange : les intégrations OTR et portails sont des intégrations de ce module, hors de
  // Connecteurs (amendement M43 du 2026-11-12, spine de Connecteurs AD-27), et aucune n'existe en v1.
  domainesEchange: [],
} as const;
