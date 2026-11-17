// Manifeste du module `comptabilite` — comptabilité générale (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories, `manifestes/comptabilite.manifest.ts` (STORY-958, 2026-11-17). Le service en garde une
// copie à l'octet dans `src/module.manifest.ts` ; `src/module.manifest.spec.ts` la vérifie.
// Références : epics-comptabilite-2026-08-27.md (EPIC-111 → 120, Q1 → Q4) ; PLAN-4-SESSIONS-LOT-3-2026-11-17.md §3
//              (D-L3-4) ; STORY-422 (référentiel du dossier) ; spine du moteur AD-17, AD-24 (état publié) ;
//              spine de l'IA commune AD-1, AD-5 (proposition, jamais décision).
//
// Hors manifeste, pour mémoire :
// - Code NEUF, sans numéro M (la liste `manifestes-a-produire.md` s'arrête avant la décision du PO du 2026-08-27 qui
//   sort la comptabilité des fondations différées). À ne pas confondre avec M22 `finance-transactions` (les
//   transactions et les ordres de paiement, hors février), qui ne passe aucune écriture de grand livre.
// - Service porteur : `prospera-comptabilite-service`, port de développement 3420 (D-958-1 : 3417 et 3418 sont à
//   l'IA commune, 3419 à `reseau-service`).
// - Données par DOSSIER et par EXERCICE (`dossierId`, `exerciceId` dans l'URL, résolus par `dossier-service` avec le
//   jeton du membre : hors portée = 404). dossier-service est du socle, pas un module : il n'entre pas dans `depends`.
// - Q1 (D-L3-4) : un exercice est tenu aux cahiers (balance) OU au journal (ce module), jamais les deux (STORY-959).
// - Q2 (D-L3-4) : le brouillard est validé avant toute balance publiée (STORY-964, 967).
// - Q3 (D-L3-4) : la piste d'audit distingue « proposé par la machine » de « choisi par l'utilisateur » dès le socle
//   (`provenance` de chaque entrée, STORY-958). C11 : les capacités d'IA (EPIC-117, 118) viendront de
//   `prospera-ia-service` ; aucune n'est déclarée tant qu'elles ne sont pas dans un lot.
// - Droits (C7) : DÉCLARÉS, pas encore attribuables. La borne du jeton bloque tout droit de tenant neuf jusqu'au
//   retrait de `perms[]` (ADR « droits hors du jeton », étape 4). Le socle ne les lit pas encore ; la première route
//   d'écriture (STORY-959) les lira par `/moi/droits`.

export const MANIFESTE_COMPTABILITE = {
  code: 'comptabilite',
  version: '0.1.0',

  // La comptabilité est une source : elle n'a besoin d'aucun autre module pour enregistrer. La balance qu'elle
  // publiera (STORY-967) est ingérée par `balance` si `balance` est installé (5e origine du hub, A-921).
  depends: [],

  enrichiPar: [],

  // Les familles de référentiel que la comptabilité tient : celles de `balance` (le plan de comptes et, dès
  // STORY-961, le plan de journaux viennent du paquet du référentiel du dossier, jamais du code).
  referentielFamilies: [
    'syscohada-revise',
    'smt-togo',
    'sfd-bceao',
    'cima-assurances',
  ],

  // C7 : droits de tenant proposés (format `<module>:<objet>:<action>`, 40 caractères au plus).
  droits: [
    'comptabilite:dossier:consulter', // référentiel, journaux, écritures, grand livre, balance, tiers (lecture)
    'comptabilite:exercice:ouvrir', // ouvrir un exercice, choisir sa tenue (STORY-959)
    'comptabilite:journal:administrer', // plan de journaux du dossier (STORY-961)
    'comptabilite:ecriture:saisir', // brouillard (STORY-962)
    'comptabilite:ecriture:valider', // brouillard → définitif, contre-passation (STORY-964)
    'comptabilite:tiers:administrer', // comptes de tiers auxiliaires (STORY-968)
    'comptabilite:lettrage:realiser', // lettrage et délettrage (STORY-969)
    'comptabilite:exercice:cloturer', // clôture, à-nouveaux, réouverture tracée (STORY-970)
    'comptabilite:piste:consulter', // piste d'audit et fichier des écritures (EPIC-120)
  ],

  // C5 : faits publiés et consommés. Le socle ne publie encore rien.
  publie: [
    'balance.submitted', // à créer (STORY-967) : la balance dérivée du grand livre, origine `comptabilite`, `checksum`
  ],
  consomme: [
    'etat-publie.changed.essai@1', // la garde (AD-24), dans l'espace d'essai
    'etat-publie.changed.reel@1', // la garde (AD-24), dans le réel
  ],

  profilCompose: 'comptabilite',

  // C13, point 1 : rien d'extérieur. Le référentiel vient du catalogue de l'espace, le dossier de dossier-service.
  prerequis: [],

  // C13, points 2 et 8 : à créer avec la route d'instance (le moteur n'installe pas le module avant).
  verifications: [
    {
      code: 'referentiel-resolu',
      route:
        'POST /api/v1/instance/comptabilite/{organisationId}/verifications/referentiel-resolu',
      critere:
        "Dossiers tenus au journal dont le référentiel de l'exercice ouvert se résout (SN, SMT, SFD-BCEAO ou CIMA) : tous 🟢 ; ≥ 1 REFERENTIEL_NON_DECIDE ou REFERENTIEL_INCONNU 🔴 avec leur nombre (aucune écriture n'y serait saisissable).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation.
  avertissementDesinstallation:
    "Journaux, écritures validées, grand livre et piste d'audit restent enregistrés et lisibles ; aucune nouvelle écriture ne pourra être saisie et aucune balance ne sera plus dérivée du grand livre.",

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/comptabilite/migrer', // à créer ; idempotent, appelé par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (sous /api/v1). Une comptabilité tenue reste lisible.
  routesLectureSeule: [
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/referentiel',
  ],

  // C13, point 7 (chemins vus par le service). À créer.
  routesInstance: {
    export: 'GET /api/v1/instance/comptabilite/{organisationId}/export',
    import: 'POST /api/v1/instance/comptabilite/{organisationId}/import',
    effacement:
      'POST /api/v1/instance/comptabilite/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/comptabilite/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // [À CONFIRMER] La reprise d'un grand livre (écritures d'un logiciel quitté) : pas avant EPIC-120. Un cabinet qui
  // reçoit un export Sage passe par l'Atelier de balance (epics-comptabilite, « ce que ce module ne fait pas »).
  objetsDeReprise: [],

  domainesEchange: [],
} as const;
