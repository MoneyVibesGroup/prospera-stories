// Manifeste M30/M31 — Assurance : contrats lus, provisions, réassurance et états (format du contrat de module, clause C1,
// amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : PRD assurance (prds/prd-assurance-2026-11-13/prd.md), annexe A.4, treize clauses C1 → C13 ; spine assurance
// (architecture/architecture-assurance-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE sur l'annexe A quand les deux
// divergent (AD-16). Un SEUL manifeste pour M30 (production et polices) et M31 (comptes techniques, provisions et
// réassurance CIMA) : décision du PO du 2026-11-12, `polices` n'existe pas comme code ; la cible de reprise des polices est
// `assurance`.
// ⚠️ LE CODE `assurance` EXISTE DÉJÀ (entitlement `assurance`, gate `ASSURANCE_NOT_ENTITLED`, gardes) dans
// `prospera-assurance-service` (modules existants : `auth`, `contrats`, `provisions`, `provisions-techniques`,
// `reassurance`, `referentiel`, `etat-sinistres`, `sinistres` comptable, `read-models`, `diagnostics`). Ce manifeste décrit
// le module EXISTANT ÉTENDU, jamais un second module (spine AD-3) : les nouvelles fonctions (projection métier des contrats,
// provisions dossier par dossier, PSAP, cessions, états, exports) s'AJOUTENT au module. La comptabilité CIMA existante
// (registre art. 415, provisions techniques, réassurance comptable, état des sinistres) passe derrière l'interrupteur
// `compta-cima`, ÉTEINT chez la compagnie. Les nouvelles routes portent le gate existant ; les gardes KYC et référentiel du
// module comptable sont posés PAR ROUTE, jamais globaux pour les nouvelles routes [ASSUMPTION de la spine].
// Le propriétaire du dépôt `prospera-assurance-service` copie ce fichier dans `src/module.manifest.ts` (module Nest
// `src/modules/assurance/` ou existant, AD-3) la semaine où il y travaille ; une garde de test compare ensuite le fichier
// du dépôt à la copie du catalogue (C1).
// Références : PRD assurance §6.4 (FR-186 → FR-193), annexe B, annexe D.3 et D.5 ; spine AD-1 (projections datées, le LC fait
//              foi), AD-2 (propriétaire des copies de lecture, des mouvements de provision et du PSAP), AD-3, AD-10 (IA :
//              sans objet), AD-11 (provisions), AD-12 (paramètres datés), AD-14 (reprise), AD-16, AD-17, AD-18 (montants :
//              répartition au franc), AD-21, AD-25, AD-26 ; épics EPIC-201 → EPIC-221 ; manifestes-a-produire.md, lignes M30
//              et M31.
//
// Service porteur : `prospera-assurance-service` (existant, spine AD-3) ; il lève le [À CONFIRMER] de l'annexe A.4 C1 (M30 et
// M31 restent UN module). Le service migre d'abord (Node 24, client Kafka Confluent, BullMQ 6) par une tâche d'épic qui
// PRÉCÈDE la mise en service des nouvelles fonctions ; le code existant ne s'abonne à aucun fait d'AD-16. Bundle : offre
// unique assurance (reprise clients et polices ; pack `assurance-cima` pour la comptabilité CIMA, palier 2 EPIC-131 hors
// cadrage). Propriétaire du manifeste : Dev B.
//
// Écarts relevés entre l'annexe A.4 du PRD et la spine (la spine gagne) :
// - C1, interrupteur `compta-cima` : ABSENT de l'annexe A.4 (l'annexe ne parle pas de l'existant) ; AJOUTÉ (AD-3), éteint
//   chez la compagnie. Sans lui, la comptabilité CIMA existante serait active chez qui la tient ailleurs.
// - C5, consomme : `sinistres.dossier.changed@1` et `sinistres.reglement.changed@1` RETIRÉS (hors de la liste fermée d'`assurance`,
//   AD-16 ; les règlements sont lus de `paiement.reglement.changed@1`, AJOUTÉ, AD-2) ; `liaison-assureur.fraicheur.changed@1`
//   et `reprise.feu-vert.changed@1` RETIRÉS (la fraîcheur est calculée et publiée par `liaison-assureur` seul, `assurance`
//   en lit la valeur dans les faits `.recu`, `lueLe` ; la Reprise livre par son point d'import, pas par un fait) ;
//   `liaison-assureur.produit.recu@1` AJOUTÉ (7 produits).
// - C5, publie : `assurance.provision.changed@1` ne publie que la provision EFFECTIVE (une révision cumulée au-dessus du
//   seuil attend `RESP` et n'est pas effective avant, `assurance.provision.a-valider@1`) ; `sinistres` n'affiche comme
//   provision en vigueur que le dernier `.changed` effectif (AD-11).
// - C1, `enrichiPar` : `reseau` n'y figure pas (la portée vient du jeton, AD-26) ; `expertises` est retiré de la consommation
//   (l'estimation de référence et les honoraires se lisent par route).
// - C4, l'annexe dit « aucun emplacement d'IA propre à ce module » : confirmé par AD-10 (`ia` vide).
// - C13, `domainesEchange: ['assurance.contrats']` : REFERENTIEL, propriétaire = le logiciel de la compagnie ; le point
//   d'échange unique de ce domaine est `liaison-assureur` (A.5, contrat §6 : un propriétaire) ; `assurance` déclare `[]`.
//   ⚠️ À trancher avec le contrat de Connecteurs : le manifeste de `liaison-assureur` déclare les trois domaines.
//
// Hors manifeste, pour mémoire :
// - Gate : `ASSURANCE_NOT_ENTITLED` (existante, 403 sans donnée, C2). Aucune dépendance dure.
// - Cloisonnement (C2) : par `organisationId` et par portée portée par le jeton (AD-26). Lecture des polices et garanties :
//   les rôles de `sinistres` pour leur périmètre ; AUCUNE écriture sur un contrat pour aucun rôle (AD-1). Provision : `GEST`
//   propose, `RESP` valide une révision dont l'écart dépasse 2 000 000 FCFA (seuil jugé à la date de l'acte, AD-12) ; traités
//   saisis par `DT` ou `DG` ; clé de coassurance saisie par `RESP` ou `DT` avec pièce, seulement si le LC ne la fournit pas ;
//   états (PSAP, CRCA, export comptable) : `DT`, `DG`, `CPT`, `AUD`. `ADMIN` ne lit aucune donnée métier. L'accès par dossier
//   aux données de santé est lu dans une table locale (`sinistres.acces-sante.*`, AD-26) pour les routes qui y touchent.
// - Données possédées (C3, AD-2) : COPIE DE LECTURE des contrats (assurés, polices, garanties, produits, primes,
//   intermédiaires, coassureurs, date de dernière lecture `lueLe`, `cleOrigineLC` : jamais modifiée, AD-1), table type de
//   sinistre vers garanties qui répondent, mouvements de provision (ajout seul : séquence, date de valeur, avant, après,
//   motif, auteur, pièce, `origine` `HUMAIN | REPRISE`), état PSAP brut, cédé, net par exercice de SURVENANCE, grille de
//   provision d'ouverture, traités versionnés par millésime (en vigueur à la date de survenance), clés de coassurance et
//   lignes « à réclamer », états et exports numérotés, données de base des états CRCA versionnées, table de correspondance
//   nature vers compte. Aucune écriture au grand livre, aucune prime calculée, pas d'IBNR officiel (FR-189, FR-228).
// - Paramètres (C6) : annexe D.3 et D.5 ; fraîcheur 5 minutes avec une API, 24 heures avec des fichiers, « périmée » au
//   double ; âge maximal de lecture pour ouvrir un dossier 24 heures. Données, jamais code.
// - Écrans (C8) : module d'écran `assurance` dans `prospera-app`, `src/modules/assurance/`, tous les écrans par Dev B.
//   `/assurance/polices`, `/assurance/polices/[id]` (source et date de lecture), `/assurance/provisions`,
//   `/assurance/etats/psap`, `/assurance/etats/crca` (mention « données de base pour l'état réglementaire »),
//   `/assurance/reassurance`, `/assurance/coassurance`, `/assurance/export-comptable`, `/assurance/correspondances`,
//   `/assurance/parametres`. Aucun écran de création ou de modification de contrat. Entrées de menu par droit
//   (`assurance:police:consulter`, `assurance:etat:consulter`, `assurance:traite:gerer`). Boutons non branchés : « bientôt ».
// - Droits existants : à la lecture du code de `prospera-assurance-service` (2026-11-13), AUCUN droit `assurance:*` n'existe
//   encore (seul le gate `ASSURANCE_NOT_ENTITLED`, 17 usages) : tous les droits ci-dessous sont à créer, une PR `auth-service`
//   par droit.
// - Désinstaller ne supprime rien : projection, mouvements de provision, traités, clés de coassurance, états et exports
//   restent stockés et masqués ; la séquence des mouvements de provision est conservée. Les contrats restent au logiciel de la
//   compagnie, qui n'est jamais touché.

export const MANIFESTE_ASSURANCE = {
  code: 'assurance',
  version: '1.0.0',

  // C1 : aucune dépendance dure. Le module tient la projection des contrats lus et se consulte sans le circuit ; la provision et
  // les états portent sur des dossiers lus de `sinistres`, qui est une entrée de `enrichiPar` et non une dépendance dure :
  // aucun cycle avec `sinistres` [à valider par la spine : confirmé, AD-3].
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par entrée.
  // - liaison-assureur : la projection n'est alimentée que par la reprise ou par un fichier déposé à la main ; chaque donnée
  //   porte « source : reprise » et sa date, ou `{ etat: NON_INSTALLE, module: liaison-assureur }` ; la clé de coassurance se saisit ;
  // - sinistres : polices et traités se consultent, provisions, états et export = `NON_INSTALLE` ;
  // - reprise : projection vide au départ, « police inconnue du LC » ; expertises : estimation de référence `NON_INSTALLE` ;
  // - paiement : règlements lus du seul `sinistres` ; dashboard : états lus dans les écrans du module ;
  // - IA commune : aucun emplacement d'IA propre ; le calibrage de l'IA est son affaire, les états se calculent sans elle.
  // Donnée du LC plus vieille que le double de la fraîcheur : marquée « périmée » (AD-1).
  enrichiPar: ['sinistres', 'liaison-assureur', 'reprise', 'expertises', 'paiement', 'dashboard'],

  // Aucun numéro de compte ici : `assurance` ne passe aucune écriture au grand livre ; la table nature de l'opération vers
  // compte (plan de comptes de la compagnie) est un paramètre de l'export (D.3), jamais une famille de référentiel.
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.4) ; le code `assurance` n'a pas de tiret. Chaque droit
  // demande une PR `auth-service`. Aucun droit d'écriture sur une police, une garantie, une prime, un intermédiaire ou un
  // coassureur n'existe (FR-186).
  droits: [
    'assurance:police:consulter',
    'assurance:garantie:consulter',
    'assurance:correspondance:gerer', // RESP, DT : type de sinistre vers garanties, nature vers compte
    'assurance:provision:consulter',
    'assurance:provision:reviser', // GEST : proposition de révision (AD-11)
    'assurance:provision:valider', // RESP : révision au-dessus du seuil glissant
    'assurance:provision:reporter', // GEST, motif : report de reprise
    'assurance:traite:gerer', // DT, DG
    'assurance:coassurance:saisir', // RESP, DT, avec pièce
    'assurance:etat:consulter', // DT, DG, CPT, AUD
    'assurance:etat:exporter',
    'assurance:export:produire', // CPT : export comptable
    'assurance:parametre:administrer',
  ],

  // C5 : faits publiés et consommés. Source : catalogue de la spine, AD-16 (qui corrige l'annexe A.4, C5). Aucun fait ne
  // porte de contenu de santé ni de donnée personnelle directe (AD-8, AD-16).
  publie: [
    'assurance.police.changed@1', // état absolu de la projection d'une police, avec `lueLe`
    'assurance.garantie.changed@1',
    'assurance.coassurance.changed@1',
    'assurance.coassurance.reglee@1', // encaissement de coassureur : clé `(objetId, rang)`, rapproché d'un relevé (AD-11)
    'assurance.traite.changed@1',
    'assurance.provision.changed@1', // provision EFFECTIVE : dossier, avant, après, motif
    'assurance.provision.a-valider@1', // écart au-dessus du seuil : attend `RESP`
    'assurance.cession.changed@1', // brut, rétention, part du réassureur, net
    'assurance.etat-provisions.produit@1',
    'assurance.etat-crca.produit@1',
    'assurance.export-comptable.produit@1', // pour le dépôt dans l'emplacement partagé (FR-193)
    'assurance.sans-traite.constate@1', // « sans traité », jamais cédé à zéro
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'liaison-assureur.assure.recu@1',
    'liaison-assureur.police.recue@1',
    'liaison-assureur.garantie.recue@1',
    'liaison-assureur.prime.recue@1',
    'liaison-assureur.intermediaire.recu@1',
    'liaison-assureur.coassurance.recue@1',
    'liaison-assureur.traite.recu@1',
    'liaison-assureur.produit.recu@1',
    'sinistres.provision.revisee@1', // proposition de `sinistres` : `assurance` seul écrit les mouvements
    'sinistres.dossier.cloture@1', // provision ramenée à zéro, motif « clôture »
    'sinistres.recours.encaisse@1',
    'paiement.reglement.changed@1',
  ],

  // C10 (annexe A.4) : `profiles: ["assurance"]` ; socle seul.
  profilCompose: 'assurance',

  // C13, point 1 : l'annexe A.4 écrit « le transport du LC configuré (API ou fichiers) ou un fichier de polices de la Reprise ».
  // Ce n'est pas un module en service : c'est un prérequis extérieur, contrôlé avant l'installation. [proposition] Le code de
  // prérequis est de ce fichier.
  prerequis: [
    {
      code: 'source-de-contrats',
      description:
        'Un transport du logiciel de la compagnie est configuré (API ou fichiers) dans `liaison-assureur`, ou un fichier de polices est prêt pour la Reprise (sinon la projection reste vide)',
      action: 'Configurer le transport du LC ou déposer le fichier de polices, puis relancer la vérification.',
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Les sept codes et leurs
  // critères sont ceux de l'annexe A.4 ; noms de routes proposés (convention commune : `verifications/<code>`).
  verifications: [
    {
      code: 'projection-en-lecture-seule',
      route: 'POST /api/v1/instance/assurance/{organisationId}/verifications/projection-en-lecture-seule',
      critere:
        "Aucune route ni aucun écran ne crée, modifie ou supprime une police, une garantie, une prime, un intermédiaire ou un coassureur : 🟢 ; sinon 🔴 avec la route (FR-186, AD-1).",
    },
    {
      code: 'provision-jamais-ecrasee',
      route: 'POST /api/v1/instance/assurance/{organisationId}/verifications/provision-jamais-ecrasee',
      critere:
        "Deux révisions successives d'un dossier d'essai laissent deux mouvements ; un montant égal à l'ancien ou sans motif est refusé : 🟢 ; sinon 🔴 (FR-188, AD-11).",
    },
    {
      code: 'psap-au-franc-pres',
      route: 'POST /api/v1/instance/assurance/{organisationId}/verifications/psap-au-franc-pres',
      critere:
        "Le total de l'état des provisions d'un jeu de dossiers d'essai égale la somme des provisions au franc près et un dossier est classé selon l'exercice de sa date de survenance : 🟢 ; sinon 🔴 avec l'écart en FCFA (FR-189).",
    },
    {
      code: 'cession-par-millesime',
      route: 'POST /api/v1/instance/assurance/{organisationId}/verifications/cession-par-millesime',
      critere:
        "Un sinistre de 2025 est cédé selon le traité 2025 et un sinistre de 2026 selon le traité 2026 ; un dossier sans traité s'affiche « sans traité » au lieu d'une cession à zéro : 🟢 ; sinon 🔴 (FR-190).",
    },
    {
      code: 'coassurance-a-cent',
      route: 'POST /api/v1/instance/assurance/{organisationId}/verifications/coassurance-a-cent',
      critere: "Une clé dont la somme n'est pas 100 % est refusée : 🟢 ; sinon 🔴 (FR-191).",
    },
    {
      code: 'export-equilibre',
      route: 'POST /api/v1/instance/assurance/{organisationId}/verifications/export-equilibre',
      critere:
        "La somme des débits égale celle des crédits de chaque export et en demander un second pour la même période ne duplique aucune ligne : 🟢 ; sinon 🔴 avec l'écart (FR-193).",
    },
    {
      code: 'peremption-signalee',
      route: 'POST /api/v1/instance/assurance/{organisationId}/verifications/peremption-signalee',
      critere:
        'Une donnée plus vieille que le double de sa fraîcheur est marquée « périmée » : 🟢 ; sinon 🔴 (FR-186, AD-1).',
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.4).
  avertissementDesinstallation:
    'La provision des dossiers ne sera plus tenue ni les états produits ; la projection des contrats ne sera plus mise à jour ; les exports déjà remis restent valides.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. La forme d'un mouvement de provision et
  // de la projection ne change jamais dans la fenêtre de sept jours ; les colonnes des exports CRCA et comptable sont
  // VERSIONNÉES (une colonne ajoutée ne change aucun export passé). L'image de `prospera-assurance-service` est unique : son
  // `retourArriere` est le plus restrictif de ses modules, dont la comptabilité CIMA existante (spine AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/assurance/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `compta-cima` : comptabilité CIMA EXISTANTE (registre art. 415, provisions techniques, réassurance comptable, état des
  // sinistres) ; ÉTEINT chez la compagnie (spine AD-3). Éteint, ses routes dorment comme un module non activé. Les deux
  // autres : annexe A.4, C12. Comportement seulement, jamais la forme des données.
  interrupteurs: ['compta-cima', 'colonne-ibnr', 'traites-recus-du-lc'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (consultation, états, export). Noms proposés, à figer par la story d'API.
  routesLectureSeule: [
    'GET /api/v1/assurance/polices', // [proposition]
    'GET /api/v1/assurance/polices/{id}', // [proposition]
    'GET /api/v1/assurance/provisions', // [proposition]
    'GET /api/v1/assurance/etats/psap', // [proposition]
    'GET /api/v1/assurance/etats/crca', // [proposition]
    'GET /api/v1/instance/assurance/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/assurance/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/assurance/{organisationId}/export',
    import: 'POST /api/v1/instance/assurance/{organisationId}/import', // sa part du dossier d'installation ; point d'import de la Reprise (polices, assurés, provision ouverte)
    effacement: 'POST /api/v1/instance/assurance/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/assurance/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : les assurés, les polices avec leurs garanties, produits,
  // intermédiaires et clés de coassurance (reçus par `assurance`, il n'existe pas de module `polices`), et la provision
  // ouverte des sinistres repris, qui entre comme un mouvement d'ouverture daté d'`origine = REPRISE` (AD-11) [À CONFIRMER
  // avec le PRD Reprise]. Valeurs de contrôle : polices en vigueur, somme des provisions des sinistres ouverts (FR-218).
  objetsDeReprise: ['assurance.assure@1', 'assurance.police@1', 'assurance.provision-ouverte@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : vide ici ; voir les écarts en en-tête (`assurance.contrats` est
  // déclaré par `liaison-assureur`).
  domainesEchange: [],

  // C11 : sans objet, aucun modèle promis (aucun des 14 usages du FR-10 ne relève du module). Il fournit à l'IA commune, sous
  // le consentement de la compagnie, les données qu'elle calibre (provisions, coûts, délais, FR-230, FR-231) ; l'IA ne pose,
  // ne révise ni ne valide jamais une provision et ne propose aucun montant sur un préjudice corporel (FR-71).
  ia: {
    modeles: [],
    finalites: [],
  },
} as const;
