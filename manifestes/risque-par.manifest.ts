// Manifeste M18 — Risque de portefeuille, PAR et provisionnement (format du contrat de module, clause C1,
// amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prds/prd-microfinance-2026-11-13/prd.md, annexe A.7 (C1 → C13) et §6.7 (FR-173 → FR-182, FR-272) ;
// spine architecture/architecture-microfinance-imf-2026-11-13/ARCHITECTURE-SPINE.md (AD-1, AD-2, AD-3, AD-6,
// AD-9, AD-12, AD-14, AD-16, AD-17, AD-21, AD-27, AD-28, AD-30) ; épic EPIC-193 (`epics-microfinance-imf-2026-11-13.md`).
// Le propriétaire du dépôt `prospera-imf-service` le copie dans `src/modules/risque-par/module.manifest.ts` la
// semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD microfinance annexe A (préambule : conventions communes, licence à vie), annexe B (matrice
//              d'accès), annexe D (table des paramètres) ; CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13, C7 amendé,
//              C11) ; manifeste `reseau` (portée) ; manifeste `paiement` (Créance, PR #430).
//
// ⚠️ CODE À TIRET. `risque-par` ne passe PAS le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`, `TENANT_PERMISSION_FORMAT`). Ses droits sont écrits dans la forme ÉLARGIE
// `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement C7 du 2026-11-11). La story `auth-service` qui élargit le format se
// livre AVANT LA SEMAINE 5 : CE MODULE NE PEUT PAS ÊTRE INSTALLÉ AVANT ELLE. Chaque droit demande en outre
// une PR `auth-service` à la livraison (catalogue fermé de 13 codes, C7). Le profil de compose et les routes
// gardent le tiret du code ; seule la gate le remplace par `_` (`RISQUE_PAR_NOT_ENTITLED`).
//
// ⚠️ ÉCARTS ANNEXE A.7 ↔ SPINE (la spine gagne, AD-9 « complète et corrige » la ligne C5 de l'annexe A) :
// - faits PUBLIÉS : A.7 en liste 13, AD-9 en liste 9. `alerte.ouverte` et `alerte.remontee` deviennent
//   `alerte.changed@1` (état complet de l'alerte, ouverte ou remontée) ; `arrete.fige@1` est AJOUTÉ (AD-21 : c'est
//   le seul fait que lit `conformite-bceao`) ; `prevision.calculee`, `scenario.calcule`, `perte-attendue.calculee`
//   et `analyse-secteur.calculee` DISPARAISSENT : « les faits des analyses d'IA ne sont pas des faits de module,
//   ce sont des Propositions » (AD-9, dernier alinéa ; AD-14) ;
// - faits CONSOMMÉS : `coeur-sfd.paiement.recu@1` n'existe pas, le fait est `coeur-sfd.mouvement.recu@1`
//   (paiements, pénalités, décaissements exécutés) ; `reseau.agence.changed@1` n'est ni au catalogue d'AD-9 ni
//   publié par le manifeste `reseau` (l'objet `agence` y est reporté à une version mineure) : les agences se lisent
//   dans `reseau.noeud.*` et la portée dans `reseau.portee.changed@1` (AD-16) ; `coeur-sfd.fraicheur.changed@1`
//   est AJOUTÉ (un arrêté n'est calculé que lorsqu'il atteste la fraîcheur, AD-21) ;
// - `instance.journal@1` EST publié (harmonisation du lot 3) : la table des topics de la spine du moteur le fait
//   verser par tous les services, l'agent seul le consomme. La piste d'audit métier reste dans chaque module, collection
//   `risque-par_audit` en ajout seul (AD-17) ;
// - paramètres réglementaires : A.7 C3 donne à `risque-par` les « jeux de paramètres de barème » ; AD-28 donne
//   la propriété des paramètres réglementaires datés (classes et barème de provision compris) à
//   `produits-financiers`, seul écrivain. Le barème est donc LU dans
//   `produits-financiers.parametre-reglementaire.changed@1` ; `risque-par` garde ses seuils et leurs versions
//   (AD-2 : « jeux de barème » restent dans sa liste d'écrivain : [À CONFIRMER] la frontière avec AD-28 à la
//   story du barème) ;
// - `enrichiPar` : `dashboard` et `conformite-bceao`, cités par A.7 C1, ne sont pas retenus : ils LISENT les faits de
//   `risque-par` (ils ne l'enrichissent pas), `conformite-bceao` en dépend durement (A.8, spine), et aucun
//   emplacement de `risque-par` ne dépend de leur présence ;
// - rôles : A.7 C2 donne une portée « zone » à l'AT et dit que l'analyste risque « lit sans modifier » ; l'annexe B
//   met l'AT à « — » et le RSQ à « A » pour le risque de portefeuille. [À CONFIRMER] avec le PO, voir les rôles
//   ci-dessous.
//
// Hors manifeste, pour mémoire :
// - Offre : bundle microfinance « Risque & Conformité » [À CONFIRMER] et « Plateforme » (manifestes-a-produire.md,
//   M18). ★ pour février (démo : PAR 1, 7, 30, 60 et 90 non nuls et variables d'un jour à l'autre, FR-11).
// - Licence à vie et contrat de maintenance mensuel (annexe A, préambule ; D-13, D-21) : la lecture seule pour
//   abonnement échu ne s'applique pas à cette IMF ; elle reste une capacité de la plateforme, déclarée ci-dessous.
// - Service porteur : `prospera-imf-service` (spine AD-2, AD-3, AD-25 ; décision du 2026-11-13, remplace le « à
//   créer [À CONFIRMER] » de A.7 C1), module Nest `src/modules/risque-par/`, collections `risque-par_<objet>`,
//   port de dev 3406. Il n'importe jamais le code d'un autre module du service (AD-3). Ses règles reprennent celles
//   du paquet comptable SFD (`prospera-microfinance-service`) SANS sa tenue des crédits (FR-182).
// - Gate : `RISQUE_PAR_NOT_ENTITLED` (403 sans donnée, C2).
// - Cloisonnement (C2, AD-16) : par `organisationId` et par la portée lue dans `reseau.portee.changed@1`,
//   appliquée au serveur à chaque lecture. ADMIN_IMF n'a aucune portée métier : toute lecture lui est refusée.
// - Écrans : module d'écran `risque-par` dans `prospera-app` (C8), `src/modules/risque-par/`, tous les écrans par
//   Dev B. `/risque` (vue DG, FR-272), `/risque/provisions`, `/risque/alertes`, `/risque/seuils`. Entrée de menu :
//   « Risque » (`risque-par:portefeuille:consulter` ou `risque-par:reseau:consulter`). L'export d'analyse du
//   risque est branché ou « bientôt », jamais décoratif.
// - Rôles proposés (annexe B ; à confirmer avec les rôles du vertical) :
//   · `risque-par:reseau:consulter` : DG, DAF, ROC, RSQ, AUD (le réseau) ; RA (raffiné à son agence) ;
//   · `risque-par:portefeuille:consulter` : GP (son portefeuille) ; AT (sa zone, ventilation limitée : A.7 C2,
//     mais « — » à l'annexe B, [À CONFIRMER]) ;
//   · `risque-par:provision:valider` : DAF (FR-176 : « le DAF valide le montant proposé ») ;
//   · `risque-par:seuil:valider` : DG, DAF (FR-178) ; l'annexe B met la décision des paramètres de risque au RSQ
//     (« D (risque) ») : [À CONFIRMER] ;
//   · `risque-par:alerte:traiter` : RSQ, ROC, RA, DG selon la nature et le périmètre (FR-179) ;
//   · `risque-par:parametre:configurer` : RSQ, DG, DAF [proposition, annexe B « Paramètres métier »].
//   Un droit de lecture ne vaut jamais un droit de décision : celui qui propose n'est pas celui qui valide.
// - Données possédées (C3, AD-2) : arrêtés figés `{date, lueLe, version, empreinte}`, jours de retard et PAR, classes
//   de chaque prêt à chaque arrêté, migrations de classe, provisions PROPOSÉES puis validées par le DAF, alertes
//   de risque et leur traitement, seuils d'alerte proposés et validés avec leurs versions, jeux de barème
//   versionnés. AUCUN prêt, AUCUN solde, AUCUN paiement : ce sont des projections de `coeur-sfd` (AD-1), copiées
//   localement par ses faits. Un fait EN_ATTENTE_COEUR n'entre jamais dans le PAR (AD-21).
// - Le PAR et les jours de retard sont calculés par `risque-par` SEUL ; `recouvrement`, `paiement` et
//   `conformite-bceao` les lisent (AD-21). `montantExigible` se lit dans `paiement.creance.changed@1` et ne se
//   recalcule jamais (AD-6).
// - Un arrêté n'est calculé que lorsque `coeur-sfd.fraicheur.changed@1` atteste que toutes les familles d'objets
//   d'argent ont un `lueLe` ≥ date + 1 jour ; sinon il reste « en attente des données du cœur » (AD-21).
// - Prospera propose, le cœur comptabilise : aucune provision n'est écrite comme comptabilisée (FR-176). Un
//   chiffre d'un rapport réglementaire ne vient jamais d'un modèle (FR-190).
// - Tout montant est un couple (entier, devise), unité mineure (AD-13). Le temps passe par le port `Horloge`
//   (AD-30), jamais par l'horloge système.

export const MANIFESTE_RISQUE_PAR = {
  code: 'risque-par',
  version: '1.0.0',

  // C1 : dépendances dures de A.7 C1, confirmées par le diagramme de la spine (RP → CS, RP → RES).
  depends: [
    {
      code: 'coeur-sfd',
      raison:
        "Prêts, échéanciers officiels et paiements viennent du cœur ; sans eux il n'y a pas de portefeuille à mesurer.",
    },
    {
      code: 'reseau',
      raison: 'Le PAR se ventile par région, agence, zone.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par
  // dépendance de `enrichiPar`.
  // - produits-financiers : ventilation par produit = `{ etat: NON_INSTALLE, module: produits-financiers }`. ⚠️ la
  //   spine fait dépendre `coeur-sfd` de `produits-financiers` (CS → PF) : il est donc toujours installé quand
  //   `risque-par` l'est, le cas `NON_INSTALLE` n'est atteignable qu'en test (déclaré tel que l'annexe A.7) ;
  // - microfinance : secteur d'activité du client (et garanties de la fiche) = « non renseigné » avec
  //   `{ etat: NON_INSTALLE, module: microfinance }` ;
  // - recouvrement : statuts de recouvrement = `{ etat: NON_INSTALLE, module: recouvrement }` ;
  // - notification : les alertes restent visibles à l'écran, aucun envoi ;
  // - IA commune (prévisions et analyses, FR-180, FR-181) : PAS dans cette liste. Elle n'a pas de code de module
  //   au catalogue ; elle se joint par le port `PropositionPort` (AD-14) et, absente, le score, la prévision et
  //   l'analyse sont `NON_INSTALLE` tandis que le PAR et la provision restent calculés [À CONFIRMER : code de
  //   module de l'IA commune, service porteur « à cadrer » (AD-14, Deferred)].
  enrichiPar: ['produits-financiers', 'microfinance', 'recouvrement', 'notification'],

  // Aucun numéro de compte ici : la provision est PROPOSÉE, jamais passée en écriture (FR-176 ; le cœur
  // comptabilise). Les comptes 2991 à 2993 du référentiel SFD ne sont que la source du barème.
  referentielFamilies: [],

  // C7, forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement du 2026-11-11). ⚠️ Aucun de ces droits n'est
  // accepté par le format actuel d'auth-service : la story d'élargissement est un PRÉREQUIS D'INSTALLATION
  // (à livrer avant la semaine 5). L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'risque-par:portefeuille:consulter', // PAR, classes, alertes de son portefeuille ou de sa zone (FR-173, FR-174, FR-179)
    'risque-par:reseau:consulter', // PAR, entonnoir, carte de chaleur, concentration, provisions : le réseau ou l'agence (FR-173 → FR-177, FR-272)
    'risque-par:provision:valider', // valider la provision proposée ; le cœur comptabilise (FR-176)
    'risque-par:seuil:valider', // valider un seuil d'alerte proposé par calcul (FR-178, AD-12)
    'risque-par:alerte:traiter', // prendre en charge et clore une alerte avec motif ou action (FR-179)
    'risque-par:parametre:configurer', // jours du PAR, jeu de classes, seuils, délais (FR-173, FR-175, annexe D)
  ],

  // C5 : faits publiés et consommés. Noms du catalogue d'AD-9 (il corrige la ligne C5 de l'annexe A.7, voir
  // l'en-tête). Graphie `domaine.objet.fait@version`, au passé ; `.changed` pour un état complet. Chaque fait
  // d'objet porte l'identifiant stable de l'objet, `organisationId` et un `rang`. Tout montant est un couple
  // (entier, devise).
  publie: [
    'risque-par.par.calcule@1', // état courant, AFFICHAGE SEUL : jamais lu par conformite-bceao (AD-21)
    'risque-par.arrete.fige@1', // arrêté figé {date, lueLe, version, empreinte}, seul fait lu par conformite-bceao (AD-21)
    'risque-par.classe.changed@1', // classe réglementaire de chaque prêt et ses migrations (FR-175, FR-179)
    'risque-par.provision.proposee@1', // provision proposée au barème en vigueur à la date d'arrêté (FR-176)
    'risque-par.provision.validee@1', // validée par le DAF ; n'est PAS une provision comptabilisée (FR-176)
    'risque-par.perte.proposee@1', // perte au-delà de 24 mois proposée au ROC et au DG, jamais seule (FR-176)
    'risque-par.alerte.changed@1', // ouverte, prise en charge, remontée, close (FR-179 : jamais supprimée)
    'risque-par.seuil.propose@1', // seuil calculé sur les données de l'IMF (FR-178)
    'risque-par.seuil.valide@1', // n'entre en vigueur qu'après validation humaine (AD-12)
    // Ajouté à l'harmonisation du lot 3 (2026-11-13) : la spine du moteur (table des topics) fait verser
    // `instance.journal` par TOUS les services (outbox) ; seul le consommateur est l'agent. La piste d'audit
    // métier reste propre au module (spine IMF AD-17).
    'instance.journal@1', // [proposition, comme les autres manifestes] arrêtés, validations, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme commande et stock]
    'essai.horloge.changed@1', // horloge pilotée dans l'espace d'essai (AD-30) ; port `Horloge`, jamais l'horloge système
    // Cœur (AD-9, publieur `coeur-sfd`, jamais sa base : AD-2) :
    'coeur-sfd.pret.changed@1', // prêts, encours (projection : valeur, lueLe, cleOrigineCoeur)
    'coeur-sfd.pret.solde@1', // [proposition, AD-9] un prêt soldé sort de l'encours
    'coeur-sfd.echeancier.changed@1', // échéancier OFFICIEL ; un prêt sans échéancier n'est pas compté (FR-173)
    'coeur-sfd.mouvement.recu@1', // paiements, pénalités ; remplace `coeur-sfd.paiement.recu@1` de l'annexe A.7 (AD-9) ; antidaté ⇒ recalcul des jours de retard (AD-7)
    'coeur-sfd.fraicheur.changed@1', // [proposition, AD-21 ; absent de A.7 C5] condition de calcul d'un arrêté
    'coeur-sfd.ordre-decaissement.confirme@1', // [proposition, AD-27] lie `dossierId` et `pretIdCoeur` : le prêt entre dans l'encours
    'coeur-sfd.depot-garantie.changed@1', // [proposition, FR-176, FR-181] dépôt de garantie retiré de la base de provision, LGD
    'coeur-sfd.balance.recue@1', // [proposition, FR-176, FR-181 d] provision comptabilisée affichée à part ; sans balance : « en attente des données du cœur »
    // Les valeurs des GARANTIES (FR-181) n'ont pas de fait nommé au catalogue d'AD-9 : [À CONFIRMER] objet
    // `garantie` de l'annexe C porté par `coeur-sfd.pret.changed@1` ou fait à ajouter à AD-9 par une PR.
    // Paiement (PR #430) : reste dû du cœur et `lueLe`, lus et jamais recalculés (AD-6) :
    'paiement.creance.changed@1', // montantExigible, reste dû, lueLe
    // Réseau (AD-16) :
    'reseau.portee.changed@1', // portée réseau, région, agence, zone, portefeuille ; fail-closed
    'reseau.noeud.created@1', // [proposition, manifeste reseau] agences ; remplace `reseau.agence.changed@1` de l'annexe A.7
    'reseau.noeud.moved@1', // [proposition, idem]
    'reseau.noeud.closed@1', // [proposition, idem]
    // Voisins de l'IMF (AD-9, graphie conservée) :
    'recouvrement.dossier.changed@1', // statuts de recouvrement, lus seulement (AD-2)
    'recouvrement.plan-etalement.decide@1', // [proposition, FR-175, FR-272] prêt rééchelonné, restructurés du mois
    'recouvrement.perte.decidee@1', // [proposition, FR-176] clôt la perte proposée
    'microfinance.client.changed@1', // [proposition, AD-2] secteur d'activité du client
    'produits-financiers.parametre-reglementaire.changed@1', // [proposition, AD-28] classes réglementaires et barème de provision
    'produits-financiers.produit.publie@1', // [proposition, AD-9] ventilation par produit (libellé, version)
    'coeur-sfd.produit.code@1', // [proposition, AD-9] code produit du cœur de chaque prêt
  ],

  // C10 : profil de compose avec le tiret du code. Au compose, le service porte aussi les profils des six
  // autres modules du service `prospera-imf-service` (AD-3).
  profilCompose: 'risque-par',

  // C13, point 1 : A.7 C13 écrit « `coeur-sfd` et `reseau` en service » ; ce sont les dépendances dures de
  // `depends`, que le moteur installe et contrôle. Aucun prérequis extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴), une clef d'idempotence ; appelées par le
  // moteur. Codes et critères de l'annexe A.7 C13 ; chemins proposés (convention de l'annexe A du PRD-D).
  verifications: [
    {
      code: 'par-recalcul',
      route: 'POST /api/v1/instance/risque-par/{organisationId}/verifications/par-recalcul',
      critere:
        "PAR30 du jeu de contrôle égal à celui du paquet comptable SFD à l'unité de franc : 🟢 ; sinon 🔴 avec l'écart en FCFA (FR-182).",
    },
    {
      code: 'somme-agences',
      route: 'POST /api/v1/instance/risque-par/{organisationId}/verifications/somme-agences',
      critere:
        "PAR du réseau égal à la somme pondérée des PAR de ses agences, au franc près : 🟢 ; sinon 🔴 (FR-174).",
    },
    {
      code: 'provision-non-comptabilisee',
      route: 'POST /api/v1/instance/risque-par/{organisationId}/verifications/provision-non-comptabilisee',
      critere:
        "Écrans du jeu qui affichent une provision proposée comme comptabilisée : 0 🟢 ; ≥ 1 🔴 avec leur nombre (FR-176).",
    },
    {
      code: 'echeancier-manquant',
      route: 'POST /api/v1/instance/risque-par/{organisationId}/verifications/echeancier-manquant',
      critere:
        "Prêts du jeu sans échéancier officiel : 0 🟢 ; ≥ 1 🟠 avec leur nombre, listés « échéancier manquant » (FR-173, FR-197).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.7, C9). Rien n'est supprimé : classes,
  // provisions proposées, alertes et seuils restent stockés et masqués.
  avertissementDesinstallation:
    'Plus aucun PAR ni aucune alerte de risque ne sera calculé ; les rapports BCEAO perdent leurs indicateurs de portefeuille.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. Un nouveau jeu de
  // paramètres de barème est versionné ; la version précédente reste lisible et jugée à sa date d'effet.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/risque-par/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `provision-tranche-facultative` : comportement seulement (provision de la tranche « 3 mois au plus »,
  // défaut 0 %, FR-175), jamais la forme des données. Image de service unique : son `retourArriere` est le plus
  // restrictif de ses modules (AD-3).
  interrupteurs: ['provision-tranche-facultative'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE. A.7 C13 : `GET` sur PAR, classes, provisions, export.
  // Seul l'export est nommé par le contrat (C13) ; les autres chemins sont des propositions, à figer par la
  // story d'API de EPIC-193. Toute écriture rend 403 `ABONNEMENT_EXPIRE` (capacité de la plateforme : voir
  // l'en-tête sur la licence à vie).
  routesLectureSeule: [
    'GET /api/v1/instance/risque-par/{organisationId}/export',
    'GET /api/v1/risque-par/par', // [proposition] PAR 1, 7, 30, 60, 90 et ventilations (FR-173, FR-174)
    'GET /api/v1/risque-par/entonnoir', // [proposition] entonnoir d'ancienneté, carte de chaleur, taux (FR-272)
    'GET /api/v1/risque-par/classes', // [proposition] classes et migrations (FR-175, FR-179)
    'GET /api/v1/risque-par/provisions', // [proposition] proposé, validé, comptabilisé (FR-176)
    'GET /api/v1/risque-par/arretes', // [proposition] arrêtés figés (AD-21)
    'GET /api/v1/risque-par/alertes', // [proposition] alertes et leur traitement (FR-179)
    'GET /api/v1/risque-par/seuils', // [proposition] seuils proposés, validés, versions (FR-178)
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/risque-par/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/risque-par/{organisationId}/export',
    import: 'POST /api/v1/instance/risque-par/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/risque-par/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/risque-par/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 : aucun objet repris. Les classes sont recalculées après la reprise des prêts
  // (objets de `coeur-sfd`, AD-2) ; A.7 C13.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 : aucun domaine d'échange. Rien ne revient du module vers le cœur : le cœur
  // comptabilise (FR-176) ; A.7 C13.
  domainesEchange: [],

  // C11 : IA déclarée (annexe A.7, C11, FR-180, FR-181). Noms de modèles et de finalités PROPOSÉS par le PRD
  // (modifiables avant le manifeste). Le moteur est l'IA commune, en instance locale chez l'IMF (AD-14) ; le
  // module n'embarque AUCUN modèle : il demande une Proposition par `PropositionPort`, avec `origine: REGLE |
  // MODELE`, et ne publie aucun fait d'analyse (AD-9). Perte attendue = encours × PD × LGD tirée des garanties
  // (FR-181). Tant que le modèle n'existe pas : tendance du PAR par règle explicable (moyenne glissante,
  // marquée « règle »), concentration par règle, le reste `NON_INSTALLE`. L'IA propose, le DAF valide les
  // provisions, le ROC et le DG décident ; un écart à une proposition exige un motif, renvoyé comme correction
  // (journal local des prédictions et corrections, C11 point 2). Aucune estimation n'est présentée comme une
  // provision ou une écriture (FR-176). Seuls des écarts anonymisés repartent, avec le consentement de l'IMF
  // (AD-14, moteur AD-13).
  ia: {
    modeles: [
      'prevision-par',
      'scenarios-par',
      'perte-attendue',
      'secteur-moteur-risque',
      'analyse-provisions',
      'analyse-risque-sectoriel',
      'analyse-macro-conjoncture',
    ],
    finalites: [
      'prevision-du-portefeuille-a-risque',
      'scenarios-de-par-avec-ou-sans-actions',
      'estimation-de-la-perte-attendue-et-du-cout-du-risque',
      'analyse-de-l-ecart-de-provisions',
      'analyse-du-risque-par-secteur-d-activite',
      'analyse-de-conjoncture',
    ],
  },
} as const;
