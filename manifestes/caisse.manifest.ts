// Manifeste M14 — Caisse des collecteurs (`caisse`) (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : PRD microfinance (prds/prd-microfinance-2026-11-13), annexe A.5, treize clauses C1 → C13, corrigées par
// la spine (architecture/architecture-microfinance-imf-2026-11-13) : AD-9 est le catalogue COMPLET des faits et
// gagne sur la ligne C5 de l'annexe A (écarts signalés ci-dessous).
// Le propriétaire du dépôt `prospera-imf-service` le copie dans `src/modules/caisse/module.manifest.ts` la semaine
// où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD microfinance §6.4 (FR-143 → FR-149), annexe A.5, annexe B (ligne « Caisse des collecteurs,
//              clôture du jour »), annexe D (paramètres de caisse) ; spine AD-2 (caisse : fonds, clôtures,
//              rattrapages, écarts de clôture, seuils), AD-3, AD-8 (la remise est un transfert de caisse), AD-9,
//              AD-15, AD-16, AD-17, AD-19 (rattrapage, blocage de clôture), AD-25, AD-29 ;
//              épics epics-microfinance-imf-2026-11-13.md (EPIC-192 : la caisse des collecteurs ; EPIC-195 : IA,
//              FR-147 → FR-149) ; manifestes-a-produire.md (M14 : « Caisse, guichet & trésorerie réseau »,
//              bundle « Caisse & Mobile Money », lot 3, échéance 27/11/2026).
//
// Hors manifeste, pour mémoire :
// - Offre : M14 est dans la catégorie « Caisse & Mobile Money » (manifestes-a-produire.md).
// - Service porteur : `prospera-imf-service` (spine AD-3 et AD-25 ; l'annexe A.5 écrivait « [À CONFIRMER, M14] »,
//   la spine l'a tranché). Collections préfixées `caisse_`, piste d'audit `caisse_audit` en ajout seul (AD-17).
// - Écrans : module d'écran `caisse` dans `prospera-app` (C8), `src/modules/caisse/` : `/caisse` (position,
//   clôtures, écarts, vue du réseau), `/caisse/guichet` (lecture du cœur), `/caisse/previsions`. Chaque entrée de
//   menu exige un des droits ci-dessous. Boutons « bientôt », sans date, jamais simulés (FR-146) : exécution des
//   virements entre agences, rapprochement du float Mobile Money avec le relevé de l'opérateur, réserve obligatoire
//   et tension par agence, caisse des tontines. Aucun écran ne propose « dépôt », « retrait » ni « clôturer
//   l'agence » : ces actes sont « dans le cœur ».
// - Rôles (annexe B, ligne « Caisse des collecteurs, clôture du jour ») : AT et COLL = A ; CPT = D (il valide la
//   clôture) ; DG, DAF, RA, RCC, AUD = L. Correspondances rôle → droit : annexe A.5 (DG, DAF, CPT, RA entre
//   parenthèses), le reste est à confirmer avec les rôles du vertical.
// - Cloisonnement (C2) : `organisationId` et portée lue dans `reseau.portee.changed@1` (AD-16) : le collecteur sa
//   position ; le CPT son guichet ; le RA son agence ; le DAF et le DG le réseau ; l'auditeur lit avec le journal.
//   Gate : refus `CAISSE_NOT_ENTITLED`, 403 sans donnée.
// - Données possédées (C3) : fonds de caisse des collecteurs (projection calculée de `collecte` seule, `calculeLe` :
//   elle ne se présente jamais comme le compte d'attente du cœur, AD-2), clôtures du jour (OUVERTE, VALIDEE,
//   ECART), écarts de clôture (deux montants, motif de résolution), rattrapages datés de J+n rattachés à J (AD-19),
//   alertes d'écart et de récurrence, seuils proposés et validés. Lues seulement : caisse du guichet, flux,
//   clôture, solde de l'opérateur (projections du cœur) ; collectes et remises (`collecte`) ; paiements
//   (`paiement`). AUCUN SOLDE de caisse du guichet n'est tenu : le cœur fait foi (EPIC-192 : « la caisse du
//   guichet n'est jamais recalculée par Prospera »).
// - Un écart de REMISE appartient à `collecte`, un écart de CLÔTURE à `caisse` : champ `nature` distinct, jamais
//   fusionnés (AD-2).
// - Cette IMF est en licence à vie (annexe A, préambule) : la lecture seule pour abonnement échu ne s'applique
//   pas ; elle reste une capacité de la plateforme, d'où les `routesLectureSeule`.

export const MANIFESTE_CAISSE = {
  code: 'caisse',
  version: '1.0.0',

  // C1 : collecte est une dépendance DURE (annexe A.5) : « La caisse des collecteurs est faite des collectes
  // remises et clôturées ». microfinance et reseau suivent par la dépendance de `collecte` (annexe A.5, C10 :
  // « socle + reseau + collecte + microfinance »).
  depends: [
    {
      code: 'collecte',
      raison: 'La caisse des collecteurs est faite des collectes remises et clôturées ; la position se calcule des seules collectes et remises de collecte (AD-2).',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`{ etat: 'NON_INSTALLE', module }`), jamais 0 ni
  // absent. Un test par entrée.
  // - coeur-sfd : caisse du guichet lue, décaissement espèces exécuté (FR-146). Absent : caisse du guichet =
  //   `{etat: NON_INSTALLE, module: coeur-sfd}` ; la caisse des collecteurs se tient seule ;
  // - paiement : paiements Mobile Money, PI-SPI. Absent : file Mobile Money `NON_INSTALLE` ;
  // - reseau : agences. Absent : pas de vue par agence ;
  // - notification : alertes d'écart. Absent : alertes dans l'écran seulement ;
  // - ia-commune : validation Mobile Money, anomalies, prévision de trésorerie, rééquilibrage. Absente :
  //   « indisponible », les seuils d'écart de FR-145 restent actifs.
  // ⚠️ Incohérence de l'annexe A.5 : `reseau` est ici optionnel (C1 et C4) mais l'annexe A.5, C10, le liste dans
  // le profil de démarrage seul (« socle + reseau + collecte + microfinance ») ; AD-16 lit la portée dans
  // `reseau.portee.changed@1`. Il reste présent par `collecte` (dépendance dure de `collecte`), l'absence de
  // `reseau` ne se produit donc que si `collecte` est elle-même installée sans lui, ce qu'elle interdit.
  // [À CONFIRMER : garder `reseau` dans `enrichiPar`, comme l'annexe, ou le remonter en `depends`.]
  // ⚠️ `ia-commune` retiré de `enrichiPar` (harmonisation du lot 3, 2026-11-13) : l'annexe A l'écrit comme un
  // module, mais ce n'est pas un code du catalogue ; c'est le port Proposition de la spine (AD-14), service
  // porteur à cadrer. Un code inconnu ferait échouer la validation des manifestes. Son absence se traite
  // comme le dit C4 ci-dessus (règle v0 ou « indisponible »).
  enrichiPar: ['coeur-sfd', 'paiement', 'reseau', 'notification'],

  // Aucun référentiel : la caisse ne tient aucune écriture comptable (l'IA « ne passe aucune écriture », FR-147).
  referentielFamilies: [],

  // C7 : droits de tenant, les huit de l'annexe A.5 (format `^[a-z]+:[a-z-]+:[a-z]+$` : conforme). L'export
  // reste réservé à instance:donnees:exporter (C2).
  droits: [
    'caisse:fonds:attribuer', // attribuer ou prélever un fonds de caisse, trace du DG ou du DAF ; jamais son propre fonds (DG, DAF ; FR-143)
    'caisse:cloture:consulter', // clôtures du jour, tableau par agence et par collecteur (FR-145)
    'caisse:cloture:valider', // compter, contresigner et valider une clôture (CPT ; FR-144)
    'caisse:ecart:resoudre', // résoudre un écart avec un motif et un auteur (RA, DAF ; FR-145)
    'caisse:guichet:consulter', // caisse du guichet LUE du cœur, datée « à jour au » (FR-146)
    'caisse:alerte:consulter', // alertes d'écart, de récurrence et d'anomalie (FR-145, FR-148)
    'caisse:prevision:consulter', // prévision de trésorerie à 7 jours et suggestion de rééquilibrage, en lecture (DAF, DG, RA ; FR-149)
    'caisse:seuil:valider', // valider un seuil d'écart proposé par recalcul (DAF, DG ; FR-145, décision E5)
  ],

  // C5 : faits publiés et consommés. SOURCE : le catalogue AD-9 de la spine, qui complète et corrige la ligne C5
  // de l'annexe A.5. Un nom absent d'AD-9 ne se publie ni ne se consomme (il s'ajoute par une PR qui amende AD-9).
  // Chaque fait d'objet porte l'identifiant stable de l'objet et `organisationId` ; toute somme est
  // `(entier, devise)` (AD-13).
  // Écarts annexe A.5 ↔ spine AD-9 (la spine gagne) :
  //   · `caisse.alerte.changed@1` (annexe A.5) : ABSENT d'AD-9. Une alerte de caisse est l'objet d'alerte unique
  //     du PRD-D FR-14, avec la remontée de FR-234 (« les écarts de caisse (FR-145) utilisent cet objet et cette
  //     remontée, sans mécanisme à part ») ; ce module n'a donc aucun fait d'alerte propre ;
  //   · `coeur-sfd.caisse.changed@1` (annexe A.5) : REMPLACÉ par `coeur-sfd.caisse-guichet.changed@1` (AD-9
  //     relève expressément cette divergence : « coeur-sfd.caisse.changed contre coeur-sfd.caisse-guichet.changed ») ;
  //   · `collecte.ecart.detecte@1` et `collecte.collecte.annulee@1` : AJOUTÉS à la consommation, hors annexe A.5.
  //     Le premier porte `nature: NON_SYNCHRONISE` qui bloque la clôture du collecteur (AD-19) et
  //     `TROU_DE_PLAGE` ; le second corrige la position (fonds calculé de `collecte` seule, AD-2).
  publie: [
    'caisse.fonds.changed@1', // fonds de caisse d'un collecteur : attributions, retours, détenu (fonds + collecté − remis), `calculeLe`
    'caisse.cloture.changed@1', // état OUVERTE / VALIDEE / ECART d'une clôture du jour ; un rattrapage y est rattaché à J (AD-19)
    'caisse.ecart.detecte@1', // écart de CLÔTURE : deux montants, `nature` distinct de l'écart de remise de `collecte` (AD-2) ; valeur de `nature` : [proposition, non nommée par les sources]
    'caisse.ecart.resolu@1', // motif (erreur de comptage, perte, vol, ajustement) et auteur ; jamais effacé
    'instance.journal@1', // [proposition, convention des manifestes voisins] attributions de fonds, résolutions d'écart, validations de seuil, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'reseau.portee.changed@1', // portée : agence, région, réseau (AD-16)
    'collecte.collecte.changed@1', // collectes enregistrées, y compris celles de la file hors ligne une fois synchronisées ; sert aussi le rattrapage (AD-19)
    'collecte.collecte.annulee@1', // [proposition, AD-2] une annulation modifie le détenu ; absente de l'annexe A.5
    'collecte.remise.contresignee@1', // transfert de caisse contresigné par le CPT (AD-8)
    'collecte.ecart.detecte@1', // `NON_SYNCHRONISE` bloque la clôture du collecteur ; `TROU_DE_PLAGE` à l'écran (AD-19)
    'coeur-sfd.caisse-guichet.changed@1', // caisse du guichet : trois champs `valeur`, `lueLe`, `cleOrigineCoeur` ; lue, jamais recalculée (FR-146)
    'paiement.encaissement.changed@1', // file des paiements Mobile Money et PI-SPI (FR-140, FR-147) ; la validation est un acte de `paiement` (`paiement:encaissement:valider`)
  ],

  profilCompose: 'caisse',

  // C13, point 1 : l'annexe A.5 écrit « `collecte` en service » ; c'est la dépendance dure de `depends`, que le
  // moteur installe et contrôle. Aucun prérequis extérieur (comme stock et commande).
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴), une clef d'idempotence ; appelées par le
  // moteur. Noms de routes proposés (convention commune de l'annexe A : `verifications/<code>`). Codes et critères :
  // annexe A.5.
  verifications: [
    {
      code: 'cloture-complete',
      route: 'POST /api/v1/instance/caisse/{organisationId}/verifications/cloture-complete', // [proposition]
      critere:
        "Sur le jeu de contrôle, une clôture refuse un collecteur avec une collecte non synchronisée ou sans remise ni motif : 🟢 ; sinon 🔴 (FR-144, AD-19).",
    },
    {
      code: 'ecart-calcule',
      route: 'POST /api/v1/instance/caisse/{organisationId}/verifications/ecart-calcule', // [proposition]
      critere:
        "Déclaré 450 000, compté 441 000 : écart de 9 000 et alerte au RA, au DAF et à l'auditeur : 🟢 ; sinon 🔴 (FR-145 : au-dessus du seuil d'alerte, 5 000 FCFA par défaut).",
    },
    {
      code: 'lecture-guichet',
      route: 'POST /api/v1/instance/caisse/{organisationId}/verifications/lecture-guichet', // [proposition]
      critere:
        "Dernière lecture de la caisse du guichet datée de moins de 24 h : 🟢 ; plus de 24 h : 🟠 (FR-146). Sans `coeur-sfd` : « non installé ».",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.5). Désinstaller ne supprime rien :
  // clôtures, écarts et fonds restent stockés et masqués ; les écarts ouverts restent résolubles à la
  // réinstallation.
  avertissementDesinstallation:
    'Les clôtures du jour des collecteurs ne seront plus faites ; les écarts ouverts restent.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. L'image de
  // `prospera-imf-service` est unique : son `retourArriere` est le plus restrictif de ses modules (AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/caisse/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // - `blocage-cloture-non-faite` : la clôture non faite de la veille bloque l'ouverture de la journée suivante
  //   du collecteur (1 jour par défaut, FR-144) ;
  // - `alerte-recurrence` : trois écarts non résolus d'un même collecteur en 30 jours alertent le RCC (FR-145) ;
  // - `ia-caisse` : validation, anomalies, prévision et rééquilibrage de l'IA commune (FR-147 → FR-149).
  // Comportement seulement, jamais la forme des données. Les seuils proposés par recalcul ne s'appliquent jamais
  // sans validation humaine (`caisse:seuil:valider`).
  interrupteurs: ['blocage-cloture-non-faite', 'alerte-recurrence', 'ia-caisse'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexe A.5 : « consultation, export »). Seule la route
  // d'export est nommée par la convention commune ; les autres noms sont des propositions, à figer par la story
  // d'API d'EPIC-192.
  routesLectureSeule: [
    'GET /api/v1/instance/caisse/{organisationId}/export',
    'GET /api/v1/caisse/clotures', // [proposition]
    'GET /api/v1/caisse/ecarts', // [proposition]
    'GET /api/v1/caisse/fonds', // [proposition]
    'GET /api/v1/caisse/guichet', // [proposition] lecture du cœur, datée
    'GET /api/v1/caisse/previsions', // [proposition]
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/caisse/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/caisse/{organisationId}/export',
    import: 'POST /api/v1/instance/caisse/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/caisse/{organisationId}/effacement', // tracé, avec certificat ; respecte la conservation légale (10 ans pour la piste, AD-17)
    sante: 'GET /api/v1/instance/caisse/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : aucun objet repris. « La caisse du guichet est
  // celle du cœur ; les clôtures passées de collecteurs ne sont pas reprises » (annexe A.5) [À CONFIRMER, comme
  // l'annexe].
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : l'annexe A.5 écrit `domainesEchange:
  // ['caisse-guichet']` (propriétaire : le cœur ; Prospera lit seulement). La forme objet ci-dessous est celle
  // des manifestes voisins ; code, objet, niveau et clé de libellé sont des propositions. Domaine en LECTURE,
  // jamais comparé ; Prospera ne pousse rien (`publie: []`) ; la caisse du guichet est tirée par `coeur-sfd`.
  domainesEchange: [
    {
      code: 'caisse.caisse-guichet', // [proposition] l'annexe A.5 donne `caisse-guichet`
      objets: ['caisse.guichet@1'], // [proposition]
      sorte: 'LECTURE',
      argent: false, // [proposition] une lecture n'est pas un mouvement d'argent de Prospera ; le cœur tient l'argent
      controle: false,
      niveauParDefaut: 'HEURE', // [proposition] fréquences par défaut de l'annexe C : 5 min (API seulement), heure, nuit
      cleLibelleAction: 'caisse.echange.caisse-guichet', // [proposition]
      publie: [],
    },
  ],

  // C11 : capacités FR-147 à FR-149, EPIC-195. Le moteur est l'IA commune, en instance locale chez l'IMF (spine
  // AD-14) ; le module n'embarque aucun modèle et demande une Proposition au port `PropositionPort`. Noms de
  // modèle et de finalité : annexe A.5 (propositions de l'annexe). Données lues par l'instance : paiements Mobile
  // Money, collectes, remises, écarts, annulations, lectures de la caisse du guichet. L'IA ne valide JAMAIS un
  // paiement, ne passe aucune écriture, ne déplace aucun fonds ; une alerte n'est pas une accusation et l'alerte
  // classée sans suite exige un motif, renvoyé comme correction. Seuls des écarts anonymisés repartent, sous le
  // consentement de l'IMF (mutualisation entre verticales, apprentissage fédéré ; l'annexe A.5 ne parle pas du
  // consentement « IA commune » du client, contrairement à A.4). Provenance affichée. Absente : les seuils
  // d'écart et les règles de doublon de FR-139 restent actifs.
  ia: {
    modeles: ['validation-mobile-money', 'anomalies-caisse', 'prevision-tresorerie-7j', 'reequilibrage-agences'],
    finalites: ['aide-a-la-validation', 'detection-d-anomalies', 'prevision-de-tresorerie', 'suggestion-de-reequilibrage'],
  },
} as const;
