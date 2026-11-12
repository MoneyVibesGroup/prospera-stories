// Manifeste M45 — Consolidation des comptes de groupe (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-12 : la consolidation est un module à part).
// Rétro-saisie : le métier est CODÉ dans `bilan-service` (origin/dev 3f8e235), sous la gate `bilan`. Aucun
// service ne lit le code `consolidation`, absent du catalogue. Ce manifeste range les routes de consolidation
// sous ce code ; la gate est à poser (écart n° 1). Le propriétaire du dépôt `bilan-service` le copie dans
// `src/consolidation.manifest.ts` (un fichier par module porté par le service, C1).
// Références : epics-consolidation-2026-08-28.md (niveau ③ SYSCOHADA, EPIC-137 → EPIC-141, STORY-541 → 548) ;
//              STORY-683 (D-683-7 : portée de groupe) ; PRD bilan (FR-009 → FR-013 pour les liasses agrégées).
//
// Hors manifeste, pour mémoire :
// - Offre : option du pack cabinet (et des groupes distributeurs) ; ne sert qu'aux groupes de sociétés,
//   vendue à part du bilan (décision du PO du 2026-11-12), comme Odoo et Sage le font.
// - Écrans : module d'écran `consolidation` dans `prospera-app` (C8), tous les écrans par Dev B.
// - C11 : sans objet. Les propositions d'élimination sont des appariements de réciproques par règles.
// - Le groupe = une MÈRE (le dossier du chemin) et ses filiales, dossiers du même cabinet ; le périmètre et
//   les pourcentages viennent de dossier-service (`dossier.perimetre.arrete`, socle).
// - ⛔ Portée de GROUPE (STORY-683, D-683-7, CWE-863) : un appelant qui n'est pas TENANT_ADMIN ne lit ni
//   n'écrit RIEN tant que TOUTES les sociétés du groupe ne sont pas dans sa portée ; sinon 404
//   `DOSSIER_INTROUVABLE`, le même corps qu'un dossier inexistant. `@PorteeGroupe()` sur chaque contrôleur,
//   vérifié par balayage. À garder tel quel sous la nouvelle gate.
// - Écarts à combler (story de bilan-service à ouvrir) :
//   1. ⛔ gate `consolidation` sur toutes les routes de `bilan/consolidation/`, refus
//      `CONSOLIDATION_NOT_ENTITLED` ; aujourd'hui toute organisation qui a `bilan` consolide ;
//   2. le read-model d'entitlement de bilan-service doit projeter aussi `consolidation`, keyé
//      (organisation, module), sur le patron de fiscal-service (D-549-1) ;
//   3. `consolidation` à ajouter au catalogue ; droits à ajouter à `TenantPermission` (C7) ;
//   4. routes `instance/consolidation/…` (C13).
// - ⚠️ EPIC-140 (conversion des entités étrangères) est bloqué par STORY-489 : le contrat de balance ne
//   porte pas de devise.

export const MANIFESTE_CONSOLIDATION = {
  code: 'consolidation',
  version: '1.0.0',

  // C1 : bilan est une dépendance DURE. La consolidation part des liasses des sociétés du groupe, produites
  // par le module Bilan (même service, même agrégat de liasses, deux gates : contrat, §4).
  depends: [
    {
      code: 'bilan',
      raison:
        'Les comptes consolidés se construisent à partir des liasses de chaque société du groupe, produites par le module Bilan.',
    },
  ],

  // C4 : rien. Les écritures fiscales de consolidation et les impôts différés se saisissent ici.
  enrichiPar: [],

  referentielFamilies: ['syscohada-revise'],

  // C7 : droits de tenant proposés. La portée de groupe s'ajoute à chacun (voir l'en-tête).
  droits: [
    'consolidation:etats:consulter', // agrégat, éliminations, retraitements, états consolidés et leurs versions
    'consolidation:ecriture:saisir', // appariements, éliminations, retraitements, conversions, dividendes, écarts, impôts différés, mise en équivalence, résultats internes
    'consolidation:methodes:administrer', // méthodes comptables du groupe et par société (homogénéisation, EPIC-137)
    'consolidation:etats:arreter', // figer une version des états consolidés
  ],

  publie: [
    'instance.journal@1', // à ajouter : écritures, annulations, versions arrêtées
  ],
  consomme: [
    'etat-publie.changed.essai@1', // à brancher (C2, AD-24 du moteur)
    'etat-publie.changed.reel@1',
    'entitlement.changed', // la projection doit couvrir `consolidation` (écart n° 2)
    'dossier.perimetre.arrete', // périmètre et pourcentages du groupe (dossier-service)
  ],

  profilCompose: 'bilan', // même service, même profil compose (C10)

  prerequis: [],

  verifications: [
    {
      code: 'perimetre-arrete',
      route: 'POST /api/v1/instance/consolidation/{organisationId}/verifications/perimetre-arrete',
      critere:
        "Groupes avec un exercice ouvert dont le périmètre est arrêté : tous 🟢 ; ≥ 1 sans périmètre 🟠 avec leur nombre (rien ne peut s'y consolider).",
    },
    {
      code: 'ecritures-equilibrees',
      route: 'POST /api/v1/instance/consolidation/{organisationId}/verifications/ecritures-equilibrees',
      critere:
        'Écritures de consolidation non annulées dont Σ débit ≠ Σ crédit : 0 🟢 ; ≥ 1 🔴 avec leur nombre.',
    },
    {
      code: 'gate-consolidation',
      route: 'POST /api/v1/instance/consolidation/{organisationId}/verifications/gate-consolidation',
      critere:
        "Routes de `bilan/consolidation/` refusées `CONSOLIDATION_NOT_ENTITLED` à une organisation qui a `bilan` sans `consolidation` : toutes 🟢 ; ≥ 1 ouverte 🔴 avec leur nombre (écart n° 1).",
    },
  ],

  avertissementDesinstallation:
    "Méthodes, écritures de consolidation et états consolidés restent enregistrés ; plus aucun état consolidé ne pourra être produit. Les liasses de chaque société ne changent pas.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/consolidation/migrer', // à créer
  interrupteurs: [],

  routesLectureSeule: [
    'GET /api/v1/instance/consolidation/{organisationId}/export',
    'GET /api/v1/dossiers/{dossierId}/consolidation/exercices/{exerciceId}/etats',
    'GET /api/v1/dossiers/{dossierId}/consolidation/exercices/{exerciceId}/etats/versions',
    'GET /api/v1/dossiers/{dossierId}/consolidation/exercices/{exerciceId}/etats/versions/{version}',
    'GET /api/v1/dossiers/{dossierId}/consolidation/exercices/{exerciceId}/agregat',
  ],

  // C13 (chemins vus par le service ; le chemin public est /api/consolidation/v1/… devant). À créer dans
  // bilan-service, à côté de ceux de `bilan`.
  routesInstance: {
    export: 'GET /api/v1/instance/consolidation/{organisationId}/export',
    import: 'POST /api/v1/instance/consolidation/{organisationId}/import',
    effacement: 'POST /api/v1/instance/consolidation/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/consolidation/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Les états consolidés se recalculent depuis les liasses ; ils ne se reprennent pas.
  objetsDeReprise: [],
  domainesEchange: [],
} as const;
