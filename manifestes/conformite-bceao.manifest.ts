// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M20 — Conformité BCEAO, audit et LBC/FT (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prds/prd-microfinance-2026-11-13/prd.md, annexe A.8 (C1 → C13) et §6.8 (FR-183 → FR-195) ;
// spine architecture/architecture-microfinance-imf-2026-11-13/ARCHITECTURE-SPINE.md (AD-1, AD-2, AD-3, AD-9,
// AD-14, AD-16, AD-17, AD-21, AD-22, AD-28, AD-30) ; épic EPIC-196 (`epics-microfinance-imf-2026-11-13.md`).
// Le propriétaire du dépôt `prospera-imf-service` le copie dans `src/modules/conformite-bceao/module.manifest.ts`
// la semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue
// (C1).
// Références : PRD microfinance annexe A (préambule : conventions communes, licence à vie), annexe B (matrice
//              d'accès), annexe D (table des paramètres) ; manifeste `risque-par` (M18, dépendance dure) ;
//              CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13, C7 amendé, C11).
//
// ⚠️ CODE À TIRET. `conformite-bceao` ne passe PAS le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`, `TENANT_PERMISSION_FORMAT`). Ses droits sont écrits dans la forme ÉLARGIE
// `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement C7 du 2026-11-11). La story `auth-service` qui élargit le format se
// livre AVANT LA SEMAINE 5 : CE MODULE NE PEUT PAS ÊTRE INSTALLÉ AVANT ELLE. Chaque droit demande en outre
// une PR `auth-service` à la livraison (catalogue fermé de 13 codes, C7). Le profil de compose et les routes
// gardent le tiret du code ; seule la gate le remplace par `_` (`CONFORMITE_BCEAO_NOT_ENTITLED`).
//
// Le code `conformite-bceao` existe déjà au catalogue (manifestes-a-produire.md, M20 : ✅). Il reprend le
// prudentiel SFD que décrivait l'ancienne fiche du code `pi-spi` (« indicateurs prudentiels et états périodiques
// exigés des SFD », famille `sfd-bceao`, pack imf-sfd) : en-tête de `paiement.manifest.ts`, qui renvoie ce
// prudentiel au PRD microfinance. La famille `sfd-bceao` y reste celle des états comptables (balance, bilan) ;
// `referentielFamilies` est vide ici (voir plus bas).
//
// ⚠️ ÉCARTS ANNEXE A.8 ↔ SPINE (la spine gagne, AD-9 « complète et corrige » la ligne C5 de l'annexe A) :
// - faits PUBLIÉS : A.8 en liste 9, AD-9 en liste 4. `rapport.genere`, `rapport.valide` et `rapport.depose`
//   deviennent `rapport.changed@1` (état complet : généré, validé par le DG, signé et déposé hors Prospera,
//   FR-186) ; `parametre.changed` disparaît : les paramètres réglementaires sont possédés par
//   `produits-financiers` (AD-28), `conformite-bceao` « y ajoute le statut juridique sans en être propriétaire »
//   et le catalogue d'AD-9 ne nomme aucun fait pour ce statut [À CONFIRMER] ; `score.calcule` disparaît : le score
//   de conformité est une Proposition de l'IA commune, pas un fait de module (AD-9, dernier alinéa ; AD-14) ;
//   `separation.contournee` disparaît : un contournement détecté est une `anomalie.detectee@1` (FR-192 : « chaque
//   cas détecté est une ligne du journal et une alerte à l'auditeur ») [À CONFIRMER : interprétation de la spine,
//   qui ne dit pas où va ce fait] ;
// - faits CONSOMMÉS : `risque-par.par.calcule@1` et `risque-par.classe.changed@1` sont REMPLACÉS par
//   `risque-par.arrete.fige@1` : « `conformite-bceao` ne lit que `risque-par.arrete.fige@1`, jamais `par.calcule`
//   ni un calcul à la volée » (AD-21) ; `coeur-sfd.classe-officielle.recue@1` est AJOUTÉ (la classe du rapport est
//   la classe officielle du cœur, AD-21) ; `risque-par.provision.validee@1` est conservé d'A.8 [À CONFIRMER : AD-21
//   présente `provisionProposee` à côté de `provisionComptabilisee`, sans dire si elle se lit dans l'arrêté figé ou
//   dans `provision.proposee@1`/`validee@1`] ;
// - `instance.journal@1` EST publié (harmonisation du lot 3) : la table des topics de la spine du moteur le fait
//   verser par tous les services, l'agent seul le consomme. La piste d'audit métier reste dans chaque module,
//   collection `conformite-bceao_audit` en ajout seul (AD-17).
//   A.8 C3 range pourtant « le journal d'audit ajouté seulement » (FR-191, toute action sur un dossier, un
//   paiement, un seuil, un rapport) dans les données de ce module, alors que la spine donne à CHAQUE module sa piste
//   et ne dit pas qui sert la lecture d'ensemble `/audit/tracabilite` [À CONFIRMER : route de lecture de la piste
//   de chaque module, AD-2, à nommer ; sinon C3 serait violée] ;
// - rôles : A.8 C2 donne la génération au « DAF et AUD » ; l'annexe B met le rapport BCEAO à « D » pour le DG,
//   « A » pour le DAF seul et « L » pour l'AUD (FR-192 : l'auditeur lit sans modifier). Les rôles ci-dessous suivent
//   l'annexe B et FR-192 [À CONFIRMER] ;
// - `enrichiPar` : `dashboard` (calendrier), cité par A.8 C1, n'est pas retenu : il LIT les faits du module, il ne
//   l'enrichit pas, et aucun emplacement de `conformite-bceao` ne dépend de sa présence ;
// - `enrichiPar` : `produits-financiers` est AJOUTÉ [proposition, AD-28] : plafond d'usure et paramètres
//   réglementaires viennent de lui (la spine le fait dépendre de `coeur-sfd`, donc toujours installé ici).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle microfinance « Risque & Conformité » [À CONFIRMER] et « Plateforme » (manifestes-a-produire.md,
//   M20). Pas ★ : `caisse` et `conformite-bceao` suivent février (spine AD-24).
// - Licence à vie et contrat de maintenance mensuel (annexe A, préambule ; D-13, D-21) : la lecture seule pour
//   abonnement échu ne s'applique pas à cette IMF ; elle reste une capacité de la plateforme, déclarée ci-dessous.
// - Service porteur : `prospera-imf-service` (spine AD-2, AD-3, AD-25 ; remplace le « partiel, à étendre
//   [À CONFIRMER, M20] » de A.8 C1), module Nest `src/modules/conformite-bceao/`, collections
//   `conformite-bceao_<objet>`, port de dev 3406. Aucun import du code d'un autre module du service (AD-3).
//   Rendu PDF des rapports : bibliothèque épinglée à la story de pointe du module (spine, Stack, [ASSUMPTION]).
// - Gate : `CONFORMITE_BCEAO_NOT_ENTITLED` (403 sans donnée, C2).
// - Cloisonnement (C2) : par `organisationId`. Génération : DAF ; validation : DG ; lecture : DG, DAF, AUD, RSQ ;
//   journal complet : AUD et DG seulement ; ADMIN_IMF ne lit pas les états (AD-16 : aucune portée métier).
//   « Valider » et « générer » sont deux droits attribués à deux personnes ; le générateur d'un rapport ne peut pas
//   en être le valideur (FR-186), vérifié sur l'identifiant de la personne, au serveur (AD-15).
// - Écrans : module d'écran `conformite-bceao` dans `prospera-app` (C8), `src/modules/conformite-bceao/`, tous les
//   écrans par Dev B. `/conformite` (vue DG et vue DAF), `/conformite/rapports`, `/conformite/ratios`,
//   `/conformite/usure`, `/conformite/lbc-ft`, `/audit/*` (vues de l'auditeur, lecture seule : crédit, caisse,
//   agences, BCEAO, équité, séparation des tâches, anomalies), `/audit/tracabilite`. Entrées de menu :
//   « Conformité » (`conformite-bceao:rapport:consulter`), « Audit » (`conformite-bceao:audit:consulter`). AUCUN
//   bouton de dépôt à l'autorité (FR-186) ; « Investiguer » est branché ou « bientôt ».
// - Rôles proposés (annexe B ; à confirmer avec les rôles du vertical) :
//   · `conformite-bceao:rapport:generer` : DAF ;
//   · `conformite-bceao:rapport:valider` : DG ;
//   · `conformite-bceao:rapport:consulter` : DG, DAF, AUD, RSQ (A.8 C2) ; ROC en lecture (annexe B : « L ») ;
//   · `conformite-bceao:rapport:exporter` : DG, DAF, AUD [proposition] (PDF et CSV, FR-188) ;
//   · `conformite-bceao:parametre:configurer` : DG, DAF [proposition, annexe B « Paramètres métier » ; le DG valide
//     tout changement de paramètre réglementaire, FR-195] ;
//   · `conformite-bceao:audit:consulter` : AUD, DG [proposition] ; RSQ en lecture (FR-192 : équité) ;
//   · `conformite-bceao:journal:consulter` : AUD, DG seulement (FR-191, A.8 C2 ; une consultation est elle-même
//     inscrite au journal).
// - Données possédées (C3, AD-2) : rapports générés, versions et statuts (généré, validé par le DG, signé et
//   déposé : déclaré par l'IMF avec date et référence), calendrier des échéances, statut juridique des paramètres
//   réglementaires (« vérifié par un juriste » ou « à vérifier »), résultats de ratios, listes d'anomalies d'audit,
//   journal d'audit en ajout seul, état de fraîcheur des listes LBC/FT. Lues seulement : arrêtés figés de
//   `risque-par`, balance et classe officielle (`coeur-sfd`), KYC en état neutre (`microfinance`, AD-22).
// - Les chiffres d'un rapport viennent des projections, jamais d'un calcul à part (AD-21) : PAR et classes de
//   l'arrêté figé de `risque-par`, ratios de la balance du cœur (`coeur-sfd.balance.recue@1`) ; sans balance
//   « en attente des données du cœur », jamais « conforme » (FR-187). Un rapport est un objet FIGÉ (version,
//   empreinte) ; toute correction produit une nouvelle version. Le rapport présente côte à côte
//   `provisionComptabilisee` (cœur, `lueLe`) et `provisionProposee` ; un écart au-delà du seuil de l'annexe D
//   ouvre `conformite-bceao.anomalie.detectee@1`, aucun chiffre ne résulte d'une substitution de l'un par l'autre.
// - LBC/FT (AD-22) : seul un ÉTAT NEUTRE sort de `microfinance` (`microfinance.kyc.changed@1`, sans motif, sans
//   liste, sans score). Aucun dossier de soupçon, aucune correspondance de sanctions, aucun compteur CENTIF n'est
//   lisible ici : ce module ne tient que la fraîcheur des listes et le retard des revues (FR-193).
// - Le plafond d'usure (24 % par an dès le 01/06/2026, Décision n° 19 du 29/12/2025/CM/UMOA) est contrôlé a
//   posteriori sur tout le portefeuille avec la bibliothèque de calcul unique `prospera-plateforme/finance` (AD-11) ;
//   la méthode du TEG et le plafond sont des paramètres datés, à faire vérifier par un juriste (FR-195, §12.3).
//   Un prêt dont le TEG est indéterminé est listé, jamais déclaré conforme.
// - Tout montant est un couple (entier, devise), unité mineure (AD-13). Le temps passe par le port `Horloge`
//   (AD-30).

export const MANIFESTE_CONFORMITE_BCEAO = {
  code: 'conformite-bceao',
  version: '1.0.0',

  // C1 : dépendances dures de A.8 C1, confirmées par le diagramme de la spine (CB → RP, CB → CS).
  depends: [
    {
      code: 'risque-par',
      raison: "Les états de portefeuille et de provisions s'appuient sur le PAR et le classement.",
    },
    {
      code: 'coeur-sfd',
      raison: 'Les indicateurs, la balance et le rapprochement viennent du cœur.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par
  // dépendance de `enrichiPar`.
  // - microfinance : LBC/FT et KYC = `{ etat: NON_INSTALLE, module: microfinance }`, le rapport l'indique ;
  // - credit : comité et parties liées = `{ etat: NON_INSTALLE, module: credit }` ;
  // - caisse : écarts de caisse = `{ etat: NON_INSTALLE, module: caisse }` ;
  // - bilan : états annuels non générés, `{ etat: NON_INSTALLE, module: bilan }` (FR-184 : « par le module `bilan`
  //   quand il est installé ; sinon hors Prospera ») ;
  // - balance : ⚠️ A.8 C1 écrit « balance (ratios, balance canonique du cœur) » et A.8 C4 « `balance` du cœur
  //   absente : chaque ratio = en attente des données du cœur (FR-187), jamais conforme ». La spine lit la balance
  //   dans `coeur-sfd.balance.recue@1` (AD-21), pas dans le MODULE `balance`. L'absence de la balance DU CŒUR est
  //   donc un cas de contenu (« en attente »), pas un `NON_INSTALLE` de module ; l'entrée du module `balance`
  //   est gardée comme l'annexe l'écrit, sans fait consommé [À CONFIRMER] ;
  // - notification : échéances visibles à l'écran, aucun envoi ;
  // - reseau : agences actives du rapport (FR-185). Dépendance dure indirecte (risque-par et coeur-sfd en
  //   dépendent) : toujours installé, le cas `NON_INSTALLE` n'est atteignable qu'en test ;
  // - produits-financiers : [proposition, AD-28] plafond d'usure et paramètres réglementaires ; absent, le
  //   contrôle d'usure et les mentions de texte sont `NON_INSTALLE` (jamais « conforme »). Même remarque : la spine
  //   le rend indirectement obligatoire (CS → PF).
  enrichiPar: [
    'microfinance',
    'credit',
    'caisse',
    'reseau',
    'balance',
    'bilan',
    'notification',
    'produits-financiers',
  ],

  // Aucun numéro de compte ici : les ratios se lisent dans la balance du cœur au plan comptable SFD de
  // l'installation (FR-187). La famille `sfd-bceao` est celle des modules `balance` et `bilan`, pas de celui-ci.
  referentielFamilies: [],

  // C7, forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement du 2026-11-11). ⚠️ Aucun de ces droits n'est
  // accepté par le format actuel d'auth-service : la story d'élargissement est un PRÉREQUIS D'INSTALLATION
  // (à livrer avant la semaine 5). L'export des données de l'organisation reste réservé à
  // instance:donnees:exporter (C2).
  droits: [
    'conformite-bceao:rapport:generer', // générer un état du calendrier (FR-183, FR-185) ; deux personnes distinctes de celui qui valide
    'conformite-bceao:rapport:valider', // « validé par le DG » ; le générateur ne peut pas valider (FR-186)
    'conformite-bceao:rapport:consulter', // lire rapports, ratios, usure, calendrier, LBC/FT en état neutre (FR-183 → FR-189, FR-193)
    'conformite-bceao:rapport:exporter', // PDF et CSV d'un rapport (FR-188)
    'conformite-bceao:parametre:configurer', // paramètres réglementaires : statut juridique, catégorie, périodicité ; validés par le DG (FR-195)
    'conformite-bceao:audit:consulter', // vues de l'auditeur, lecture seule (FR-192, FR-194)
    'conformite-bceao:journal:consulter', // journal d'audit complet et d'accès : AUD et DG seulement (FR-191)
  ],

  // C5 : faits publiés et consommés. Noms du catalogue d'AD-9 (il corrige la ligne C5 de l'annexe A.8, voir
  // l'en-tête). Graphie `domaine.objet.fait@version`, au passé ; `.changed` pour un état complet. Chaque fait
  // d'objet porte l'identifiant stable de l'objet, `organisationId` et un `rang`.
  publie: [
    'conformite-bceao.rapport.changed@1', // généré, validé par le DG, signé et déposé (déclaré par l'IMF), nouvelle version (FR-186)
    'conformite-bceao.ratio.calcule@1', // numérateur, dénominateur, date d'arrêté, seuil ; « en attente » sans balance (FR-187)
    'conformite-bceao.usure.depassee@1', // prêt dont le TEG dépasse le plafond en vigueur à son octroi (FR-189)
    'conformite-bceao.anomalie.detectee@1', // anomalie d'audit, séparation contournée comprise, écart de provision (AD-21, FR-192)
    // Ajouté à l'harmonisation du lot 3 (2026-11-13) : la spine du moteur (table des topics) fait verser
    // `instance.journal` par TOUS les services (outbox) ; seul le consommateur est l'agent. La piste d'audit
    // métier reste propre au module (spine IMF AD-17).
    'instance.journal@1', // [proposition, comme les autres manifestes] arrêtés, validations, export, effacement
    'conformite-bceao.realite.constatee@1', // [AD-14, spine IA] alerte réglementaire ou anomalie opérationnelle confirmée ou écartée (issue : CONFIRMEE, ECARTEE) ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme commande et stock]
    'essai.horloge.changed@1', // horloge pilotée dans l'espace d'essai (AD-30) ; échéances et délais, jamais l'horloge système
    // Risque (AD-21) : l'arrêté figé seulement.
    'risque-par.arrete.fige@1', // remplace `par.calcule@1` et `classe.changed@1` de l'annexe A.8 (AD-21)
    'risque-par.provision.validee@1', // conservé d'A.8 C5 [À CONFIRMER, voir l'en-tête]
    // Cœur (AD-9, publieur `coeur-sfd`) :
    'coeur-sfd.balance.recue@1', // ratios prudentiels ; seul objet agrégé du cœur (AD-7, AD-21)
    'coeur-sfd.classe-officielle.recue@1', // [proposition, AD-21 ; absent d'A.8 C5] classe du rapport et provision comptabilisée (cœur, lueLe)
    'coeur-sfd.pret.changed@1', // contrôle a posteriori du plafond d'usure sur le portefeuille (FR-189)
    'coeur-sfd.ecart.ouvert@1', // rapprochement : écarts ouverts, leur ancienneté (FR-192)
    // KYC en ÉTAT NEUTRE (AD-22) : rien d'autre ne sort de `microfinance` :
    'microfinance.kyc.changed@1', // statut et `valideJusquau`, sans motif, sans liste, sans score
    'microfinance.revue.echue@1', // [proposition, AD-9, FR-193] revue KYC en retard ; la FRAÎCHEUR des listes de sanctions n'a pas de fait nommé [À CONFIRMER]
    // Paramètres réglementaires (AD-28) : propriétaire `produits-financiers`, validés par le DG.
    'produits-financiers.parametre-reglementaire.changed@1', // [proposition, AD-28] plafond d'usure, barème, normes, périodicités, conservation
    // Voisins d'audit (AD-9, graphie conservée) :
    'credit.dossier.changed@1', // [proposition, FR-192 ; A.8 C1 « comité, parties liées »] dossiers incomplets, modification après comité
    'credit.derogation.accordee@1', // [proposition, AD-9] dérogations vues par l'auditeur
    'credit.alerte-audit.emise@1', // [proposition, AD-9] alertes d'audit émises par `credit`
    'caisse.ecart.detecte@1', // [proposition, AD-9 ; A.8 C1 « caisse (écarts) »]
    'caisse.ecart.resolu@1', // [proposition, idem]
    // Réseau : agences actives (FR-185). La portée n'est pas lue : A.8 C2 cloisonne par `organisationId` seul.
    'reseau.noeud.created@1', // [proposition, manifeste reseau] nombre d'agences actives à la date
    'reseau.noeud.moved@1', // [proposition, idem]
    'reseau.noeud.closed@1', // [proposition, idem]
    // États annuels DIMF (FR-184) : « par le module `bilan` quand il est installé ».
    'liasse.etat.change', // [proposition, manifeste bilan : nom existant, sans suffixe de version] cycle de vie du jeu d'états
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  // C10 : profil de compose avec le tiret du code. Au compose, le service porte aussi les profils des six
  // autres modules du service `prospera-imf-service` (AD-3).
  profilCompose: 'conformite-bceao',

  // C13, point 1 : A.8 C13 écrit « `risque-par` et `coeur-sfd` en service » ; ce sont les dépendances dures de
  // `depends`, que le moteur installe et contrôle. Aucun prérequis extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴), une clef d'idempotence ; appelées par le
  // moteur. Codes et critères de l'annexe A.8 C13 ; chemins proposés (convention de l'annexe A du PRD-D).
  verifications: [
    {
      code: 'rapport-sans-trou',
      route: 'POST /api/v1/instance/conformite-bceao/{organisationId}/verifications/rapport-sans-trou',
      critere:
        "Champs du rapport du jeu de contrôle remplis par un défaut silencieux : 0 🟢 ; ≥ 1 🔴 avec leur nombre (FR-183 : un champ absent est vide et signalé, jamais zéro).",
    },
    {
      code: 'total-egal-risque',
      route: 'POST /api/v1/instance/conformite-bceao/{organisationId}/verifications/total-egal-risque',
      critere:
        "Totaux du rapport égaux à ceux de `risque-par` à la date d'arrêté : 🟢 ; sinon 🔴 avec l'écart en FCFA (FR-185).",
    },
    {
      code: 'ratios-en-attente',
      route: 'POST /api/v1/instance/conformite-bceao/{organisationId}/verifications/ratios-en-attente',
      critere:
        "Sans balance du cœur, chaque ratio dit « en attente des données du cœur » : 🟢 ; un seul ratio calculé sans balance 🔴 avec son code (FR-187).",
    },
    {
      code: 'journal-ajout-seul',
      route: 'POST /api/v1/instance/conformite-bceao/{organisationId}/verifications/journal-ajout-seul',
      critere:
        "Une écriture du journal ne peut ni être modifiée ni être supprimée : 🟢 ; sinon 🔴 (FR-191, AD-17).",
    },
    {
      code: 'usure-portefeuille',
      route: 'POST /api/v1/instance/conformite-bceao/{organisationId}/verifications/usure-portefeuille',
      critere:
        "Prêts du jeu au-dessus du plafond en vigueur à leur octroi tous listés : 🟢 ; un seul absent de la liste 🔴 avec son nombre (FR-189).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.8, C9). Rien n'est supprimé : rapports,
  // versions, paramètres et journal d'audit restent stockés (conservation 10 ans) et masqués.
  avertissementDesinstallation:
    "Plus aucun état réglementaire ne sera généré ; les états déjà validés restent conservés.",

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. Un nouveau gabarit de
  // rapport est un jeu de paramètres versionné ; un rapport validé reste figé dans la version de son gabarit.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/conformite-bceao/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `seuil-supervision-banque-centrale` : remplace l'article 44 par le seuil fixé par la Banque Centrale
  // (FR-184, FR-195). Comportement seulement, jamais la forme des données. Image de service unique : son
  // `retourArriere` est le plus restrictif de ses modules (AD-3).
  interrupteurs: ['seuil-supervision-banque-centrale'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE. A.8 C13 : `GET` sur rapports, ratios, journal, export.
  // Seul l'export est nommé par le contrat (C13) ; les autres chemins sont des propositions, à figer par la story
  // d'API de EPIC-196. Toute écriture rend 403 `ABONNEMENT_EXPIRE` (capacité de la plateforme : voir l'en-tête sur
  // la licence à vie). Le journal reste lisible par l'AUD et le DG seuls même en lecture seule.
  routesLectureSeule: [
    'GET /api/v1/instance/conformite-bceao/{organisationId}/export',
    'GET /api/v1/conformite-bceao/rapports', // [proposition] rapports, versions, statuts (FR-185, FR-186)
    'GET /api/v1/conformite-bceao/rapports/{id}', // [proposition]
    'GET /api/v1/conformite-bceao/rapports/{id}/export', // [proposition] PDF et CSV d'un rapport figé (FR-188)
    'GET /api/v1/conformite-bceao/calendrier', // [proposition] échéances et statuts (FR-184)
    'GET /api/v1/conformite-bceao/ratios', // [proposition] ratios prudentiels (FR-187)
    'GET /api/v1/conformite-bceao/usure', // [proposition] prêts au-dessus du plafond (FR-189)
    'GET /api/v1/conformite-bceao/lbc-ft', // [proposition] fraîcheur des listes, revues en retard, état neutre (FR-193)
    'GET /api/v1/conformite-bceao/audit', // [proposition] vues de l'auditeur (FR-192)
    'GET /api/v1/conformite-bceao/journal', // [proposition] journal d'audit, AUD et DG seulement (FR-191)
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/conformite-bceao/v1/… devant).
  // L'effacement du journal est REFUSÉ avant 10 ans (conservation, FR-191) : le certificat dit ce qui est resté.
  routesInstance: {
    export: 'GET /api/v1/instance/conformite-bceao/{organisationId}/export',
    import: 'POST /api/v1/instance/conformite-bceao/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/conformite-bceao/{organisationId}/effacement', // tracé, avec certificat ; journal refusé avant 10 ans
    sante: 'GET /api/v1/instance/conformite-bceao/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 : aucun objet repris (A.8 C13).
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 : aucun domaine d'échange. Le dépôt à l'autorité est hors Prospera (A.8 C13,
  // FR-186) : le bouton n'existe pas, seule la déclaration « signé et déposé » est enregistrée.
  domainesEchange: [],

  // C11 : IA déclarée (annexe A.8, C11, FR-190, FR-194). Noms de modèles et de finalités PROPOSÉS par le PRD
  // (modifiables avant le manifeste). Le moteur est l'IA commune, en instance locale chez l'IMF (AD-14) ; le
  // module n'embarque AUCUN modèle et ne publie aucun fait d'analyse (AD-9). L'IA ne valide, ne signe et ne
  // dépose JAMAIS un rapport, ne produit AUCUN chiffre du rapport (ils viennent de `risque-par` et du cœur : un
  // test compare chaque nombre du commentaire à une valeur du rapport, sinon le commentaire est refusé) et ne
  // classe aucune anomalie seule. Sans elle : ratios, alertes sur seuils, anomalies par règle et rapport par
  // gabarit fonctionnent ; la synthèse rédigée et la corrélation affichent `NON_INSTALLE`, rien ne bloque. Journal
  // local des prédictions et corrections (C11, point 2) ; provenance affichée ; seuls des écarts anonymisés
  // repartent, avec le consentement de l'IMF (AD-14, moteur AD-13).
  ia: {
    capacites: [
      'microfinance/score-conformite@1',
      'microfinance/alertes-reglementaires@1',
      'microfinance/commentaire-rapport-bceao@1',
      'microfinance/detection-anomalies-operationnelles@1',
      'microfinance/correlation-evenements-trace@1',
    ],
    finalites: [
      'score-de-conformite-global',
      'alerte-reglementaire-proactive',
      'commentaire-du-rapport',
      'detection-d-anomalies',
      'correlation-d-evenements-suspects',
    ],
  },
} as const;
