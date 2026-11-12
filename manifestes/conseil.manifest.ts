// Manifeste M38 — Conseil fiscal (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Rétro-saisie : le métier est CODÉ, mais pas sous ce code. Les scénarios d'optimisation légale, le
// comparatif et le dossier de justification vivent dans `balance-service` (STORY-096 et suivantes, EPIC-AB-07)
// derrière la gate `balance`. Aucun service ne lit le code `conseil` (seed STORY-549 : « l'octroi n'ouvre
// rien »). Ce manifeste range ces routes sous `conseil` ; la gate est à poser (écart n° 1 ci-dessous).
// Le propriétaire du dépôt `balance-service` le copie dans `src/conseil.manifest.ts` (un fichier par module
// porté par le service, C1) la semaine où il y travaille.
// Références : PRD prd-atelier-balance-2026-07-12.md (EPIC-AB-07 : FR-A22, FR-A23, FR-A24 ; NFR-A04) ;
//              PRD Fiscalité §4 (scénarios et justification restent à balance-service) et NFR-F01 ;
//              STORY-549 (D-549-2 : `conseil` et `declarations` se vendent séparément) ;
//              décisions D11 du cadrage de l'Atelier (garde-fou de conformité).
//
// Le PRD Fiscalité ne contient aucune exigence de conseil : la source est EPIC-AB-07, seule.
//
// Hors manifeste, pour mémoire :
// - Offre : pack cabinet ; service à valeur ajoutée, vendu à part des déclarations (STORY-549).
// - Écrans : module d'écran `conseil` dans `prospera-app` (C8), tous les écrans par Dev B. La carte
//   « Conseil fiscal » de l'accueil n'a encore aucun écran derrière elle (FE-085 rend l'absence lisible).
// - C11 : sans objet. Un scénario est un calcul déterministe du moteur fiscal de balance-service sur des
//   leviers saisis ; il n'y a ni modèle ni recommandation automatique.
// - ⛔ Garde-fou (FR-A24, NFR-A04, NFR-F01), non négociable : un scénario est un BROUILLON simulé, distinct du
//   réel ; il n'existe AUCUNE route « appliquer » (un test e2e en vérifie l'absence). Retenir une option,
//   c'est saisir le retraitement RÉEL dans balance (`POST …/fiscal/retraitements`, droit
//   `balance:fiscal:calculer`), avec base légale et pièce. Le conseil optimise la base par des leviers
//   légaux ; il ne minore jamais une base réelle.
// - Écarts à combler (portés par la prochaine story de balance-service sur AB-07 ; constat et gate
//   confirmés par le PO le 2026-11-12) :
//   1. ⛔ gate `conseil` sur les routes de scénarios et de justification, refus `CONSEIL_NOT_ENTITLED`.
//      Aujourd'hui, une organisation qui a `balance` a le conseil sans l'avoir acheté ; une organisation
//      qui a acheté `conseil` sans `balance` ne peut pas l'avoir (d'où la dépendance dure) ;
//   2. le read-model d'entitlement de balance-service ne projette que `balance` : il doit projeter aussi
//      `conseil`, keyé (organisation, module), sur le patron de fiscal-service (D-549-1) ;
//   3. droits de tenant à ajouter à `TenantPermission` (auth-service) ;
//   4. routes `instance/conseil/…` (C13) : le service en expose un jeu par module porté.
// - La garde de régime est posée PAR ROUTE (D-096-4) : au régime SYNTHETIQUE, aucun levier sur le bénéfice
//   (`REGIME_INCOMPATIBLE`, 409).

export const MANIFESTE_CONSEIL = {
  code: 'conseil',
  version: '1.0.0',

  // C1 : balance est une dépendance DURE. Un scénario se simule sur le résultat fiscal et la liquidation
  // calculés par le moteur fiscal de balance-service (AB-06), plancher MFP compris (FR-A22) ; sans balance,
  // il n'y a rien à simuler. Les deux modules vivent dans le même service (contrat, §4) : même agrégat
  // (résultat fiscal du dossier), deux gates.
  depends: [
    {
      code: 'balance',
      raison:
        "Un scénario se simule sur le résultat fiscal et l'impôt calculés à partir de la balance du dossier (FR-A22) ; sans balance, il n'y a rien à simuler.",
    },
  ],

  // C4 : sans bilan, le comparatif « liasse de référence vs scénario optimisé » (FR-A23) se lit sur la
  // liquidation de balance, et la colonne « liasse déposée » s'écrit `NON_INSTALLE`, jamais un écart nul.
  // [À CONFIRMER] : le code actuel compare au calcul de référence de balance-service, pas à une liasse.
  enrichiPar: ['bilan'],

  // Familles de `fiscalite`, reprises par D-549-2 : normatif, donc fermé par défaut.
  referentielFamilies: ['syscohada-revise', 'zone-franche-togo'],

  // C7 : droits de tenant proposés. Retenir une option n'est PAS un droit du conseil (voir l'en-tête).
  droits: [
    'conseil:scenario:consulter', // liste et détail des scénarios, classement
    'conseil:scenario:simuler', // créer, modifier, supprimer un brouillon ; lancer la simulation
    'conseil:justification:consulter', // comparatif par scénario et dossier de justification (FR-A23)
  ],

  // C5 : rien n'est publié aujourd'hui. Un scénario est un brouillon : il ne devient jamais un fait de
  // domaine. Seul le journal sort.
  publie: [
    'instance.journal@1', // création, simulation, suppression de scénario ; consultation du dossier de justification (à ajouter)
  ],
  // Le conseil lit le moteur fiscal de balance en processus (même service) : aucun topic de balance n'est
  // consommé pour lui. Il consomme ce que toute gate consomme.
  consomme: [
    'etat-publie.changed.essai@1', // à brancher (C2, AD-24 du moteur)
    'etat-publie.changed.reel@1',
    'entitlement.changed', // la projection doit couvrir `conseil` (écart n° 2)
  ],

  profilCompose: 'balance', // même service, même profil compose (C10)

  prerequis: [],

  verifications: [
    {
      code: 'aucun-scenario-applique',
      route: 'POST /api/v1/instance/conseil/{organisationId}/verifications/aucun-scenario-applique',
      critere:
        "Retraitements RÉELS de balance sans base légale ou sans justification (ceux qu'un scénario aurait pu glisser dans le réel) : 0 🟢 ; ≥ 1 🔴 avec leur nombre (FR-A24, NFR-A04).",
    },
    {
      code: 'gate-conseil',
      route: 'POST /api/v1/instance/conseil/{organisationId}/verifications/gate-conseil',
      critere:
        "Routes de scénarios et de justification refusées `CONSEIL_NOT_ENTITLED` à une organisation qui a `balance` sans `conseil` : toutes 🟢 ; ≥ 1 ouverte 🔴 avec leur nombre (écart n° 1).",
    },
  ],

  avertissementDesinstallation:
    "Les scénarios et dossiers de justification restent enregistrés ; plus aucune simulation n'est possible. Les retraitements réels saisis dans la balance ne changent pas.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/conseil/migrer', // à créer
  interrupteurs: [],

  // Le dossier de justification reste lisible en lecture seule : c'est la défense du client en contrôle.
  routesLectureSeule: [
    'GET /api/v1/instance/conseil/{organisationId}/export',
    'GET /api/v1/dossiers/{dossierId}/fiscal/scenarios',
    'GET /api/v1/dossiers/{dossierId}/fiscal/scenarios/{id}',
    'GET /api/v1/dossiers/{dossierId}/fiscal/scenarios/{id}/comparatif',
    'GET /api/v1/dossiers/{dossierId}/fiscal/dossier-justification',
  ],

  // C13 (chemins vus par le service ; le chemin public est /api/conseil/v1/… devant). À créer dans
  // balance-service, à côté de ceux de `balance`.
  routesInstance: {
    export: 'GET /api/v1/instance/conseil/{organisationId}/export',
    import: 'POST /api/v1/instance/conseil/{organisationId}/import',
    effacement: 'POST /api/v1/instance/conseil/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/conseil/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Un brouillon de simulation ne se reprend pas d'un ancien logiciel, et ne s'échange pas.
  objetsDeReprise: [],
  domainesEchange: [],
} as const;
