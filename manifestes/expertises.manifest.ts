// Manifeste M29 — Expertises et intervenants (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : PRD assurance (prds/prd-assurance-2026-11-13/prd.md), annexe A.3, treize clauses C1 → C13 ; spine assurance
// (architecture/architecture-assurance-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE sur l'annexe A quand les deux
// divergent (AD-16). Le propriétaire du dépôt `prospera-sinistres-service` copie ce fichier dans
// `src/modules/expertises/module.manifest.ts` la semaine où il y travaille ; une garde de test compare ensuite le
// fichier du dépôt à la copie du catalogue (C1).
// Références : PRD assurance §5.5 (machine des missions, FR-58 → FR-67), §6.3 (FR-177 → FR-185a), annexe B, annexe D.2 et D.3 ;
//              spine AD-2 (propriétaire des missions, des rapports en métadonnées, des honoraires), AD-5 (honoraires :
//              `expertises` vise, `sinistres` émet l'ordre), AD-8 (santé), AD-10 (IA), AD-15 (portail par le relais),
//              AD-16, AD-17, AD-26 ; moteur AD-9 amendé et AD-44 (relais) ; épics EPIC-201 → EPIC-221 ;
//              manifestes-a-produire.md, ligne M29.
//
// Service porteur : `prospera-sinistres-service` (module `expertises`, avec `sinistres`, spine AD-3). ⚠️ ÉCART : l'annexe
// A.3 C1 écrit `prospera-assurance-service` étendu ; la spine place `expertises` dans le service des sinistres. Bundle :
// offre unique assurance. Propriétaire du manifeste : Dev B.
//
// Écarts relevés entre l'annexe A.3 du PRD et la spine (la spine gagne) :
// - C1, service porteur : voir ci-dessus.
// - C5, publie : `expertises.honoraires.vises@1` est consommé par `sinistres`, qui est SEUL à émettre l'ordre
//   `HONORAIRES` (`ordonnePar` = le visa de `RESP`) ; l'annexe écrit « pour `paiement` ». `expertises` n'envoie rien à
//   `paiement` (AD-5). `expertises.ia.proposition.enregistree@1` RETIRÉ : absent du catalogue (la Proposition est tenue
//   par l'IA commune, la décision humaine par le module consommateur, AD-10).
// - C5, consomme : la liste fermée de la spine (AD-16) est `sinistres.dossier.changed@1`, `sinistres.acces-sante.accorde@1`,
//   `.retire@1` et `ged.piece.versionnee@1`. RETIRÉS de l'annexe : `sinistres.evaluation.arretee@1` (un cabinet ne voit
//   jamais les montants de l'évaluation, AD-15 ; le volet et le dossier se lisent par la route de lecture de `sinistres`),
//   `sinistres.sortie.decidee@1` (la contre-expertise sur litige se déduit de `sinistres.dossier.changed@1`),
//   `ged.piece.controlee@1` (remplacé par `ged.piece.versionnee@1`), `assurance.provision.changed@1` (provision et
//   estimation de référence se LISENT, spine AD-2), `paiement.reglement.execute@1` et `reseau.noeud.changed@1`.
//   ⚠️ POINT À LEVER : le montant « payé » des honoraires (cinquième montant de la mission, FR-182) n'a plus de fait
//   source dans la liste fermée ; il se lit par la route de lecture de `sinistres` (état de l'ordre `HONORAIRES`).
// - C1, `depends` : l'annexe propose `sinistres` et `ged` en dépendances dures ; la spine ne les contredit pas.
//   `assurance` et `reseau` restent en enrichissement (spine AD-21).
// - C7 : `expertises:contreexpertise:ordonner` s'écrit sans tiret pour tenir le format. La capacité `sante:lire` (AD-8) est
//   portée par `expertises:sante:consulter` (`MED`).
//
// Hors manifeste, pour mémoire :
// - Gate : `EXPERTISES_NOT_ENTITLED` (403 sans donnée, C2).
// - Cloisonnement (C2, AD-15, AD-26) : par `organisationId` et par portée de la MISSION. `EXPE` (cabinet externe avec
//   compte) ne voit que ses missions, par le portail, sans recherche générale, sans montant d'évaluation, sans provision,
//   sans instruction ; compte séparé, second facteur obligatoire ; `EXPI` ses missions ; `MED` les missions médicales ;
//   `GEST` désigne pour son volet ; `RESP` et `DT` créent et désactivent un expert ; `CPT` ou `RESP` visent les honoraires
//   (celui qui vise n'émet pas) ; `AUD` lit. Les accès d'un cabinet sont tracés comme ceux d'un agent (journal des accès
//   des cabinets).
// - PORTAIL DES CABINETS (spine AD-15) : servi par le RELAIS Money Vibes (`prospera-relais`, moteur AD-44), jamais par un
//   service de la compagnie ; aucun port entrant. L'instance POUSSE vers le relais (sortie 443 déclarée dans
//   `destinationsSortantes`, nom `relais`, finalité « portail des cabinets d'expertise », module `expertises`) la liste des
//   missions du cabinet et les pièces choisies pour la mission, et TIRE les actes du cabinet (acceptation ou refus motivé,
//   accusé de réception, rapport, note d'honoraires). Pièces chiffrées de bout en bout (clé par mission jamais détenue par
//   le relais), durée limitée, sans copie gardée ; Money Vibes est sous-traitant pour ce flux. Aucune pièce médicale
//   n'y transite sauf nécessité de la mission (journalisée). Acte rejoué sans double effet (clé `(missionId, typeActe,
//   rang)`, `ACTE_CONFLICTUEL` si le contenu diffère). Relais injoignable : le circuit continue, la voie `TRANSMISE`
//   (courriel sécurisé ou papier, saisie pour le cabinet) reste le repli. En essai, le relais n'envoie rien de réel.
// - Données possédées (C3, AD-2) : référentiel des experts et cabinets (agrément et sa date de fin, mode d'honoraires,
//   capacité, état), missions et leur machine, désignations et refus motivés, convocations et examens médicaux,
//   MÉTADONNÉES des rapports (`pieceId`, `versionPiece` : le fichier est une pièce de `ged`), compléments, contre-expertises
//   et expertises contradictoires, notes d'honoraires (métadonnées) et visas, cinq montants de la mission, budget indicatif,
//   charge pondérée, relances, journal des accès des cabinets. Lues seulement : dossier et volet (`sinistres`), pièces
//   (`ged`), provision et estimation de référence (`assurance`).
// - Paramètres (C6) : annexe D.2 et D.3 ; les délais réglementaires de l'expertise médicale (art. 244 et 245) sont un
//   référentiel non modifiable (D.5).
// - Écrans (C8) : module d'écran `expertises` dans `prospera-app`, `src/modules/expertises/`, tous les écrans par Dev B.
//   `/expertises`, `/expertises/experts`, `/expertises/missions/[id]`, `/expertises/honoraires`, `/expertises/panel`,
//   `/expertises/parametres` ; portail du cabinet `/expertises/portail` (vue restreinte à `EXPE`, servie par le relais).
//   Entrées de menu par droit (`expertises:mission:designer`, `expertises:mission:accepter`,
//   `expertises:honoraires:viser`). Boutons non branchés : « bientôt » (FR-22).
// - Désinstaller ne supprime rien : référentiel, missions, rapports, notes d'honoraires et journal restent stockés et
//   masqués ; test aller-retour ; les missions ouvertes sont listées avant la désinstallation, avec le cabinet concerné.

export const MANIFESTE_EXPERTISES = {
  code: 'expertises',
  version: '1.0.0',

  // C1 : `sinistres` et `ged` sont des dépendances DURES, PROPOSÉES par l'annexe A.3, à valider par le PO.
  depends: [
    {
      code: 'sinistres',
      raison:
        "Une mission d'expertise est rattachée à un dossier sinistre et à une question distincte (véhicule, blessures, responsabilité) ; sans dossier, pas de mission (§5.5).",
    },
    {
      code: 'ged',
      raison:
        "Le rapport d'expertise, les photos et les pièces transmises à un expert sont des pièces du dossier ; expertises n'en tient aucune copie (FR-180, spine AD-2).",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par entrée.
  // - paiement : honoraires visés « à payer » ; moyen de paiement `NON_INSTALLE`, chèque enregistré à la main ;
  // - notification : désignation et relance en cloche interne et courrier ; le portail se consulte ;
  // - reseau : zones d'expert en texte libre ;
  // - assurance : estimation de référence `NON_INSTALLE`, budget indicatif calculé sur l'enjeu du dossier ;
  // - dashboard : charge visible dans la liste des experts seulement ;
  // - IA commune : orientation, complétude, comparaison `NON_DISPONIBLE` ; liste de contrôle fixe, rien n'est bloqué.
  // Cabinet sans compte : le gestionnaire saisit la désignation, l'acceptation, l'accusé et le rapport reçu (pièce jointe
  // obligatoire, FR-181).
  enrichiPar: ['assurance', 'paiement', 'notification', 'reseau', 'dashboard'],

  // Aucun numéro de compte ici : `expertises` ne passe aucune écriture.
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.3). Chaque droit demande une PR `auth-service`.
  droits: [
    'expertises:expert:gerer', // RESP, DT (FR-177)
    'expertises:expert:consulter',
    'expertises:mission:suggerer',
    'expertises:mission:designer', // GEST
    'expertises:mission:accepter', // EXPE, EXPI, MED
    'expertises:rapport:deposer', // EXPE, EXPI, MED
    'expertises:rapport:saisir', // GEST, pour un cabinet sans compte (FR-181)
    'expertises:rapport:valider', // GEST
    'expertises:complement:demander',
    'expertises:contreexpertise:ordonner', // RESP ; écrit sans tiret pour tenir le format
    'expertises:honoraires:noter', // EXPE
    'expertises:honoraires:viser', // RESP, CPT : celui qui vise n'émet pas (FR-182)
    'expertises:agrement:prolonger', // RESP, DT
    'expertises:parametre:administrer',
    'expertises:sante:consulter', // MED ; capacité `sante:lire` (AD-8)
  ],

  // C5 : faits publiés et consommés. Source : catalogue de la spine, AD-16. Aucun fait ne porte de contenu médical (AD-8).
  publie: [
    'expertises.mission.changed@1', // état absolu : domaine, expert, état, échéance du rapport
    'expertises.mission.designee@1',
    'expertises.mission.refusee@1',
    'expertises.rapport.depose@1', // pour `sinistres` ; le fichier est une pièce de `ged`
    'expertises.complement.demande@1',
    'expertises.complement.revenu@1',
    'expertises.rapport.retard@1',
    'expertises.honoraires.notes@1',
    'expertises.honoraires.vises@1', // pour `sinistres` (seul émetteur de l'ordre `HONORAIRES`, AD-5)
    'expertises.agrement.echu@1', // alerte 60 jours avant
    'expertises.expert.changed@1',
    'expertises.charge.changed@1', // pour `dashboard`
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'sinistres.dossier.changed@1',
    'sinistres.acces-sante.accorde@1', // table locale de lecture (AD-26)
    'sinistres.acces-sante.retire@1',
    'ged.piece.versionnee@1',
  ],

  // C10 (annexe A.3) : `profiles: ["expertises"]` ; socle + `sinistres` + `ged`.
  profilCompose: 'expertises',

  // C13, point 1 : l'annexe A.3 écrit « `sinistres` et `ged` en service » : ce sont les dépendances dures de `depends`.
  // Reste « au moins un expert » (panel interne de démonstration en essai seulement, jamais en réel, FR-219) et, pour le
  // portail, le relais déclaré dans les destinations sortantes. [proposition] Les codes de prérequis sont de ce fichier.
  prerequis: [
    {
      code: 'un-expert-au-moins',
      description:
        "Au moins un expert ou cabinet est saisi dans le référentiel (liste fournie par la compagnie ; le panel interne de démonstration n'existe qu'en essai, FR-219)",
      action: 'Saisir ou reprendre le référentiel des experts, puis relancer la vérification.',
    },
    {
      code: 'relais-declare',
      description:
        "Seulement si l'interrupteur `portail-cabinet` est allumé : le relais Money Vibes figure dans `destinationsSortantes` de l'état voulu (sortie 443, AD-15, AD-25)",
      action: "Faire déclarer la destination sortante `relais` à l'état voulu, puis relancer la vérification.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Les six codes et leurs
  // critères sont ceux de l'annexe A.3 ; noms de routes proposés (convention commune : `verifications/<code>`).
  verifications: [
    {
      code: 'agrement-bloque-la-designation',
      route: 'POST /api/v1/instance/expertises/{organisationId}/verifications/agrement-bloque-la-designation',
      critere:
        "La désignation d'un expert à agrément échu est refusée avec « agrément échu le [date] » : 🟢 ; sinon 🔴 (FR-178).",
    },
    {
      code: 'contre-expertise-exclusive',
      route: 'POST /api/v1/instance/expertises/{organisationId}/verifications/contre-expertise-exclusive',
      critere:
        'La contre-expertise ne peut revenir ni au cabinet initial ni au panel interne : 🟢 ; sinon 🔴 (FR-66).',
    },
    {
      code: 'portail-cloisonne',
      route: 'POST /api/v1/instance/expertises/{organisationId}/verifications/portail-cloisonne',
      critere:
        "Un compte `EXPE` d'essai ne voit que ses missions, aucun montant d'évaluation ni provision, et aucune recherche générale : 🟢 ; sinon 🔴 avec ce qu'il a vu en trop (FR-180, AD-15).",
    },
    {
      code: 'honoraires-bornes',
      route: 'POST /api/v1/instance/expertises/{organisationId}/verifications/honoraires-bornes',
      critere:
        "Viser plus que le facturé est refusé, viser au-delà du convenu exige un motif et celui qui vise ne peut émettre le même règlement : 🟢 ; sinon 🔴 (FR-182, AD-5).",
    },
    {
      code: 'rapport-saisi-avec-piece',
      route: 'POST /api/v1/instance/expertises/{organisationId}/verifications/rapport-saisi-avec-piece',
      critere:
        "La saisie d'un rapport pour un cabinet sans compte est refusée sans pièce jointe : 🟢 ; sinon 🔴 (FR-181).",
    },
    {
      code: 'complement-bloque-la-validation',
      route: 'POST /api/v1/instance/expertises/{organisationId}/verifications/complement-bloque-la-validation',
      critere:
        'Un complément demandé et non revenu bloque la validation, sauf passage outre motivé de `RESP` : 🟢 ; sinon 🔴 (FR-67).',
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.3).
  avertissementDesinstallation:
    "Plus aucune mission d'expertise ne sera désignée ni suivie ; le portail des cabinets est fermé ; les rapports et les honoraires déjà enregistrés restent dans les dossiers.",

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. La forme d'une mission, d'un
  // rapport versionné et d'une note d'honoraires ne change jamais dans la fenêtre de sept jours ; un état de mission ajouté
  // est lu comme inconnu par la version précédente. Un budget déjà calculé n'est jamais recalculé (FR-185). L'image de
  // `prospera-sinistres-service` est unique : son `retourArriere` est le plus restrictif de ses modules (spine AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/expertises/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `portail-cabinet` : éteint tant qu'aucun cabinet n'a de compte (le gestionnaire saisit, FR-181). Comportement seulement.
  interrupteurs: ['portail-cabinet', 'orientation-ia'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (consultation, journal, export). Noms proposés, à figer par la
  // story d'API.
  routesLectureSeule: [
    'GET /api/v1/expertises/missions', // [proposition]
    'GET /api/v1/expertises/missions/{id}', // [proposition]
    'GET /api/v1/expertises/experts', // [proposition]
    'GET /api/v1/instance/expertises/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/expertises/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/expertises/{organisationId}/export',
    import: 'POST /api/v1/instance/expertises/{organisationId}/import', // sa part du dossier d'installation ; point d'import de la Reprise
    effacement: 'POST /api/v1/instance/expertises/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/expertises/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : le référentiel des experts et cabinets (liste fournie par la
  // compagnie, FR-177, FR-219). Les missions passées d'un dossier repris suivent `sinistres.dossier@1` [À CONFIRMER avec le
  // PRD Reprise].
  objetsDeReprise: ['expertises.expert@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : aucun domaine d'échange (l'expert n'est tenu par aucun logiciel externe).
  domainesEchange: [],

  // C11 : trois capacités de FR-58 et FR-64, servies par l'IA commune en instance locale par le port `PropositionPort`
  // (AD-10). Orientation : dossier → besoin d'expertise proposé, « à confirmer », qui ne crée rien ; complétude : rapport →
  // points manquants (la liste fixe tient lieu sans modèle) ; comparaison au portefeuille : dossier ou rapport → écart à des
  // dossiers comparables. Destinataire : GEST. Garde-fous : l'IA propose, le gestionnaire décide, désigne et valide ;
  // aucune désignation, aucun rejet de rapport par l'IA ; JAMAIS de montant proposé sur un préjudice corporel (FR-71) ;
  // aucun contenu médical ne sort de l'instance (AD-8) ; niveau `RECOMMANDATION` ou `ANALYSE`. Les noms sont des propositions.
  ia: {
    modeles: ['orientation-expertise', 'completude-rapport-expert', 'comparaison-portefeuille'],
    finalites: ['orientation-expertise', 'completude-rapport-expert', 'comparaison-portefeuille'],
  },
} as const;
