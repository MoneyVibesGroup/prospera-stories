// Manifeste M47 — Échange avec le cœur de l'IMF (code `coeur-sfd`) (format du contrat de module, clause C1,
// amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories, PRD microfinance (prds/prd-microfinance-2026-11-13, FINAL, PR #426), annexe A.6
// (treize clauses C1 → C13), annexe B (ligne « Échange avec le cœur : écarts »), annexe C (contrat d'échange
// avec le cœur : objets, sens, états, clés d'origine, fréquences : ESSENTIELLE ici) et annexe D (paramètres) ;
// spine de l'IMF (architecture/architecture-microfinance-imf-2026-11-13, FINALE, PR #428 : AD-1, AD-2, AD-3,
// AD-5, AD-6, AD-7, AD-8, AD-9, AD-10, AD-16, AD-17, AD-22, AD-25, AD-26, AD-27, AD-29, AD-30). M47 est un module
// NOUVEAU, proposé par le PRD (annexe A.6, « M47 [proposition] ») et inscrit à `manifestes-a-produire.md`
// (amendement du 2026-11-13). Les noms de topics, de droits, d'objets et de domaines de l'annexe sont des
// propositions du PRD ; ce fichier les fige, en corrigeant les faits sur le catalogue AD-9 (voir plus bas).
// Le propriétaire du dépôt `prospera-coeur-sfd-service` (à créer) le copie dans `src/module.manifest.ts` la
// semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD microfinance FR-150 → FR-165 et FR-199 (échange, fraîcheur, écarts, rapprochement trimestriel,
//              IA des écarts), FR-166 → FR-172 (cœur fictif), FR-196 → FR-198 (reprise) ; épics EPIC-183
//              (« L'échange avec le cœur de l'IMF ★ ») et EPIC-184 (cœur fictif) ; AD-1 (le cœur fait foi),
//              AD-7 (objets, deux transports, Prospera tire), AD-8 (apparier par la clé d'origine).
//
// ⚠️ CODE À TIRET. `coeur-sfd` ne passe PAS le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`, `TENANT_PERMISSION_FORMAT`). Ses droits sont écrits dans la forme ÉLARGIE
// `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement C7 du 2026-11-11). La story `auth-service` qui élargit le format se
// livre AVANT LA SEMAINE 5 : CE MODULE NE PEUT PAS ÊTRE INSTALLÉ AVANT ELLE. Chaque droit demande en outre une
// PR `auth-service` à la livraison (catalogue fermé de 13 codes, C7). Le profil de compose et les routes gardent
// le tiret du code ; seule la gate le remplace par `_` (`COEUR_SFD_NOT_ENTITLED`).
//
// ⚠️ SERVICE PORTEUR : `prospera-coeur-sfd-service` (à créer ; AD-25 et `manifestes-a-produire.md`, amendement
// du 2026-11-13). Cela lève le [À CONFIRMER] de l'annexe A.6 C1 (« à créer »). Ce n'est PAS `prospera-imf-service`
// (qui porte `microfinance`, `credit`, `produits-financiers`, `collecte`, `caisse`, `risque-par`,
// `conformite-bceao`). Le CŒUR FICTIF de démonstration est une APPLICATION À PART, `prospera-coeur-fictif`
// (AD-10, FR-166) : il parle le contrat par les deux transports, ne lit ni n'écrit aucune base de Prospera, ne
// s'installe que dans un espace d'essai ; l'état voulu signé d'une instance porte `coeurFictifAutorise`
// (faux par défaut) et l'agent refuse de le démarrer ailleurs (`COEUR_FICTIF_INTERDIT`). Il n'est pas un module
// du catalogue et n'a donc pas de manifeste.
//
// ⚠️ RÈGLES D'OR DU MODULE (AD-1, AD-7, AD-8) :
// - AUCUN SOLDE, aucun encours officiel, aucune caisse du guichet ni écriture comme vérité : ce module est le
//   SEUL écrivain des PROJECTIONS du cœur (`valeur`, `lueLe`, `cleOrigineCoeur`) ; les autres modules s'en font
//   une copie par ses faits. Le cœur fait foi pour l'argent.
// - PROSPERA TIRE TOUJOURS : une API que Prospera interroge, ou des fichiers que Prospera relève ; AUCUN port
//   entrant, aucun webhook entrant (vérification `aucun-port-entrant`).
// - Deux transports derrière un seul port `TransportCoeur` (API, fichiers), même objet des deux côtés ; le port
//   est la couture où se branche un adaptateur de Connecteurs (hors février) ; la file d'envoi, la file des
//   écarts et la fraîcheur restent ICI.
// - Chaque message porte `messageId` (SHA-256 de `organisationId | objet | cleOrigine | versionObjet`,
//   déterministe), `cleOrigine`, `versionObjet`, date d'effet et empreinte SHA-256 du contenu (JCS) ; rejouer est
//   sans effet ; une correction a `versionObjet` + 1. Un objet d'une version plus récente que celle connue est
//   refusé « version inconnue » et va dans la file des écarts (C12).
// - SEUL ce module apparie, une fois, par la clé d'origine, et publie `coeur-sfd.mouvement.apparie@1` : un fait
//   saisi dans Prospera (remboursement, collecte, décaissement électronique) reste `EN_ATTENTE_COEUR` jusqu'à ce
//   fait ; jamais un rapprochement « au plus proche » ; l'IA ne propose que des doublons probables, un humain
//   applique, l'IA ne corrige jamais de l'argent.
// - Cœur indisponible : les commandes qui engagent de l'argent sont refusées `COEUR_INDISPONIBLE` (AD-1) ;
//   tous les objets passent `{etat: PERIME, depuis}` (FR-165) ; la file d'envoi attend, dans l'ordre.
// - Données sensibles chiffrées par champ (AD-18, bibliothèque `champs-sensibles`) pour les pièces d'identité et
//   téléphones des objets « Client » et « Création de client » ; aucun nom de client dans un lien de paiement
//   (AD-26). Piste d'audit en ajout seul `coeur_sfd_audit`, chaînée, tête remise à l'agent avec son `epoque`
//   (AD-17, AD-29).
//
// ⚠️ ÉCARTS ANNEXE A.6 ↔ SPINE (la spine gagne : AD-9 « complète et corrige les C5 de l'annexe A ») :
// Faits PUBLIÉS par `coeur-sfd`
// 1. `coeur-sfd.paiement.recu@1` et `coeur-sfd.penalite.recue@1` (annexe) → un seul fait
//    `coeur-sfd.mouvement.recu@1` (paiements, pénalités, décaissements exécutés).
// 2. `coeur-sfd.ordre-decaissement.etat@1` (annexe) → `coeur-sfd.ordre-decaissement.confirme@1` (porte
//    `dossierId` et `pretIdCoeur`, seul fait qui les lie, AD-27) et `coeur-sfd.ordre-decaissement.rejete@1`.
// 3. `coeur-sfd.dossier-accorde.etat@1` (annexe) → `coeur-sfd.envoi.etat@1` (état d'envoi de tout message
//    sortant : dossier accordé, annulation, remboursement, remise, plan, contentieux, perte, blocage).
// 4. `coeur-sfd.ecart.propose@1` (annexe) : ABSENT du catalogue. Les analyses d'IA ne sont pas des faits de
//    module : ce sont des Propositions (AD-14). Remplacé par `coeur-sfd.ecart.resolu@1` (nouveau, AD-9).
// 5. AJOUTÉS par la spine : `coeur-sfd.client.changed@1` (l'annexe ne le publiait jamais alors que
//    `microfinance` le consomme), `coeur-sfd.pret.solde@1`, `coeur-sfd.mouvement.apparie@1`,
//    `coeur-sfd.produit.code@1`, `coeur-sfd.envoi.etat@1`, `coeur-sfd.ecart.resolu@1`.
// Faits CONSOMMÉS
// 6. `credit.plan-etalement.decide@1` (annexe) → `recouvrement.plan-etalement.decide@1` (le plan d'étalement est
//    décidé par `recouvrement`, AD-20).
// 7. `microfinance.sanctions.gel-demande@1` (annexe) → `microfinance.client.bloque@1` (et `.debloque@1`) : AD-22
//    interdit tout fait de sanctions ; seul l'état neutre `BLOCAGE_CONFORMITE` sort de `microfinance`.
// 8. `paiement.decaissement.execute@1` (annexe) → `paiement.ordre-decaissement.changed@1` (état EXECUTE).
// 9. `credit.ordre-decaissement.emis@1`, `credit.dossier.accorde@1`, `credit.dossier.annule@1`,
//    `recouvrement.contentieux.transfere@1`, `recouvrement.perte.decidee@1`, `collecte.*` : inchangés.
// 10. `reseau.agence.changed@1` (annexe) n'existe PAS : le manifeste de `reseau` publie
//    `reseau.noeud.created@1`, `.moved@1` et `.closed@1`. [proposition] Remplacé par ces trois faits.
// 11. Faits des voisins `credit.derogation`, `recouvrement.dossier.changed@1` : jamais consommés ici (AD-9,
//    « jamais un état comme `recouvrement.dossier.changed@1` »).
// Faits de l'annexe A.1 (`credit`) qui nomment `coeur-sfd` : `coeur-sfd.decaissement.confirme@1` et
// `coeur-sfd.pret.solde-nul@1` sont CORRIGÉS en `coeur-sfd.ordre-decaissement.confirme@1` et
// `coeur-sfd.pret.solde@1` (c'est le manifeste de `credit` qui doit s'aligner, pas celui-ci).
//
// Hors manifeste, pour mémoire :
// - Offre : bundle de l'IMF non fixé par `manifestes-a-produire.md` pour M47 (la ligne n'existe que dans
//   l'amendement du 2026-11-13) [À CONFIRMER, avec le PO : « Crédit » et « Plateforme » proposés].
// - Gate : `COEUR_SFD_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Écrans : module d'écran `coeur-sfd` dans `prospera-app` (C8), tous les écrans par Dev B. Routes `/echange`
//   (état par objet, fraîcheur), `/echange/ecarts` (file des écarts), `/echange/a-saisir` (liste par agence),
//   `/echange/rapprochement` (trimestriel), `/echange/parametres`. Entrées de menu : « Échange avec le cœur »
//   (`coeur-sfd:echange:consulter`), « Écarts » (`coeur-sfd:ecart:consulter`). Boutons non branchés : « bientôt ».
// - Cloisonnement : `organisationId` sur chaque lecture et écriture. Lecture de la file des écarts : CPT, DAF,
//   ROC (agence pour CPT) ; l'annexe B ajoute DG, RA et AUD en lecture, CPT qui AGIT et ADMIN_IMF « A (technique) »
//   (sans lecture d'aucune donnée métier, FR-5). Aucune porte entrante.
// - Rôles (annexe B, ligne « Échange avec le cœur : écarts ») : `coeur-sfd:ecart:consulter` = DG, DAF, ROC, RA,
//   AUD (lecture), CPT (dans son agence) ; `coeur-sfd:ecart:resoudre` = CPT ; `coeur-sfd:echange:configurer` =
//   ADMIN_IMF (partie technique : transport, accès). L'annexe B ne dit rien des autres droits
//   (`echange:consulter`, `rapprochement:*`, `liste-a-saisir:exporter`) : [À CONFIRMER, avec la matrice de §2.1].
//   [À CONFIRMER] ADMIN_IMF ne lit aucune donnée métier : `echange:configurer` ne donne accès qu'aux
//   paramètres de transport et à l'état, jamais aux objets reçus.
// - Chaîne d'envoi (AD-7) : file d'envoi ACQUITTÉE (spine Connecteurs AD-8), ORDONNÉE par entité racine
//   (client, puis dossier ou prêt, puis ordre, annulation, remboursement) ; un message n'est envoyé qu'après
//   l'acceptation du précédent de sa chaîne ; un envoi non acquitté dans son délai (24 h) passe en écart ; une
//   annulation qui rattrape un message en file le remplace (`ANNULE_AVANT_ENVOI`).
// - Mode de tirage par objet : `DELTA` (curseur monotone) ou `SNAPSHOT` (fichier avec `genereLe`, `nbLignes`,
//   empreinte) ; le cœur fictif et les tests de contrat exercent les deux (AD-7).
// - Échéance : identité `(organisationId, pretIdCoeur, numeroEcheance, versionEcheancier)` (AD-27) ; un nouvel
//   échéancier officiel ferme les Créances de l'ancienne version chez `paiement`.
// - Relecture ciblée (AD-6) : sur `paiement.relecture.demandee@1` (`pretIdCoeur`), ce module répond par
//   `coeur-sfd.echeancier.changed@1` ou `coeur-sfd.fraicheur.changed@1` en moins de 30 s.
// - [À CONFIRMER] Deux flux de la spine n'ont PAS d'objet dans l'annexe C : la DEMANDE DE GEL au cœur
//   (AD-22, « blocages de conformité » de la file d'envoi, AD-7) et l'APPEL d'un dépôt de garantie (statut
//   « appelé » de l'objet « Dépôt de garantie », déclencheur chez `recouvrement` non nommé au catalogue AD-9). À
//   ajouter à l'annexe C (test de FR-152 : un message sans ligne est un oubli) avant de coder les envois.
// - Droits : le catalogue des droits est un `enum` fermé (C7) : chaque droit ci-dessous demande une PR
//   `auth-service` à la livraison du module.

export const MANIFESTE_COEUR_SFD = {
  code: 'coeur-sfd',
  version: '1.0.0',

  // C1 (annexe A.6, dépendances proposées, à valider par le PO) : deux dépendances DURES.
  depends: [
    {
      code: 'reseau',
      raison: "Une agence du cœur se range dans le réseau ; son code est celui du cœur s'il existe (FR-164).",
    },
    {
      code: 'produits-financiers',
      raison: 'Un prêt reçu du cœur se rattache à un produit versionné.',
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par
  // entrée.
  // - credit : aucun dossier accordé ni ordre à envoyer, état `NON_INSTALLE` ;
  // - microfinance : clients lus seulement comme références de prêt ; sans lui, pas de « Création de client »
  //   ni d'ouverture de compte d'épargne ;
  // - collecte : aucun remboursement saisi ni remise à renvoyer ; les listes « à saisir dans le cœur » restent
  //   vides ;
  // - caisse : caisse du guichet = `NON_INSTALLE` ;
  // - recouvrement : échéancier officiel et pénalités lus par lui ; sans lui, ni plan d'étalement, ni
  //   contentieux, ni perte à envoyer ;
  // - risque-par et conformite-bceao : aucune lecture dérivée ;
  // - paiement : décaissement Mobile Money et PI-SPI = `NON_INSTALLE`, seuls espèces et virement par le cœur
  //   restent ;
  // - reprise : import du portefeuille (point d'import des cinq objets) ; sans lui, pas d'import ;
  // - connecteurs : vrai connecteur du cœur, hors février (FR-259).
  // Cœur absent ou injoignable : tous les objets en `{etat: PERIME, depuis}` (FR-165).
  enrichiPar: [
    'credit',
    'microfinance',
    'collecte',
    'caisse',
    'recouvrement',
    'risque-par',
    'conformite-bceao',
    'paiement',
    'reprise',
    'connecteurs',
  ],

  // Aucun numéro de compte ici : le module ne tient aucune écriture (AD-1) ; la balance du cœur se publie telle
  // quelle (`coeur-sfd.balance.recue@1`), lue par `conformite-bceao`.
  referentielFamilies: [],

  // C7, forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement du 2026-11-11). ⚠️ Aucun de ces droits n'est accepté
  // par le format actuel d'auth-service : la story d'élargissement est un PRÉREQUIS D'INSTALLATION. Sept droits
  // (annexe A.6 C7). L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'coeur-sfd:echange:consulter', // état par objet, fraîcheur, transport utilisé (FR-159)
    'coeur-sfd:echange:configurer', // transport (API ou fichiers), fraîcheur, délais ; partie technique (FR-157)
    'coeur-sfd:ecart:consulter', // file des écarts : objet, clé d'origine, nature, date, auteur de la résolution (FR-159)
    'coeur-sfd:ecart:resoudre', // résoudre un écart : la ligne reste, « résolue », avec l'auteur et le motif (FR-159)
    'coeur-sfd:rapprochement:consulter', // rapprochement trimestriel : portefeuille de Prospera contre celui du cœur (FR-163)
    'coeur-sfd:rapprochement:valider', // valider un rapprochement trimestriel (FR-163)
    'coeur-sfd:liste-a-saisir:exporter', // liste « à saisir dans le cœur », par agence (FR-156)
  ],

  // C5 : faits publiés et consommés. Source : catalogue AD-9 de la spine (qui corrige l'annexe A.6 C5, voir les
  // écarts 1 à 11 de l'en-tête). Chaque fait d'objet porte l'identifiant stable de l'objet, l'`organisationId` et
  // un `rang` (point d'écriture unique, §6 du contrat). Mouvements, jamais totaux (AD-7 ; la balance du cœur est
  // le seul objet agrégé).
  publie: [
    'coeur-sfd.client.changed@1', // identité du cœur (nom, naissance, pièce, statut) ; consommé par `microfinance`
    'coeur-sfd.client.cree@1', // réponse à « Création de client » : identifiant du cœur, ou refus avec motif
    'coeur-sfd.pret.changed@1', // prêt (encours, statut, jours de retard après décaissement, solde de contrôle) en projection datée
    'coeur-sfd.pret.solde@1', // prêt soldé (ancien `pret.solde-nul` de l'annexe A.1)
    'coeur-sfd.echeancier.changed@1', // échéancier officiel et reste dû de chaque échéance avec sa date de lecture ; réponse à la relecture ciblée
    'coeur-sfd.mouvement.recu@1', // paiements, pénalités et décaissements exécutés ; mouvements datés, jamais des totaux
    'coeur-sfd.mouvement.apparie@1', // clé d'origine, ligne, `mouvementCoeurId`, résultat CONFIRME ou ECART (AD-8)
    'coeur-sfd.epargne.changed@1', // compte d'épargne et ses mouvements lus du cœur
    'coeur-sfd.compte-epargne.ouvert@1', // réponse à « Ouverture de compte d'épargne » : identifiant du compte, ou refus
    'coeur-sfd.caisse-guichet.changed@1', // caisse du guichet (et non `coeur-sfd.caisse.changed@1`, AD-9)
    'coeur-sfd.remise.changed@1', // état d'une remise d'espèces au cœur
    'coeur-sfd.balance.recue@1', // balance du cœur, seul objet agrégé ; lue pour les ratios
    'coeur-sfd.classe-officielle.recue@1', // classe réglementaire officielle et provision comptabilisée, par prêt et par arrêté
    'coeur-sfd.depot-garantie.changed@1', // blocage, restitution, appel d'un dépôt de garantie
    'coeur-sfd.produit.code@1', // code produit comptable du cœur (projection)
    'coeur-sfd.ordre-decaissement.confirme@1', // exécuté : porte `dossierId` et `pretIdCoeur`, le prêt créé (AD-27)
    'coeur-sfd.ordre-decaissement.rejete@1', // rejeté ou expiré, avec le motif du cœur
    'coeur-sfd.envoi.etat@1', // à envoyer, envoyé, accepté, refusé (motif), annulé avant envoi ; jamais confirmé après un délai (FR-152)
    'coeur-sfd.ecart.ouvert@1', // un objet refusé, un envoi sans confirmation, une concordance rompue (FR-159)
    'coeur-sfd.ecart.resolu@1', // résolution par un humain, avec auteur et motif
    'coeur-sfd.fraicheur.changed@1', // fraîcheur par famille d'objets : condition des arrêtés de `risque-par` (AD-21)
    // [proposition, C13 / journal d'instance, comme les autres manifestes] envois, rejets, résolutions d'écarts,
    // changements de transport, rapprochements validés, export, effacement.
    'instance.journal@1',
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    // Faits de DÉCISION des autres modules (AD-9 : « jamais un état comme `recouvrement.dossier.changed@1` »).
    'credit.dossier.accorde@1', // objet « Dossier accordé » : conditions figées et échéancier contractuel
    'credit.dossier.annule@1', // objet « Annulation d'un dossier ou d'un ordre »
    'credit.ordre-decaissement.emis@1', // objet « Ordre de décaissement » (clé d'essai `<ordreId>:<numeroEssai>`, AD-5)
    // [proposition, annexe C « Dépôt de garantie » : restitution à la clôture du prêt] Déclencheur nommé chez
    // son décideur ; le blocage se fait à l'exécution du décaissement, l'APPEL n'a pas de fait (voir l'en-tête).
    'credit.dossier.cloture@1',
    'recouvrement.plan-etalement.decide@1', // objet « Plan d'étalement » (nouvel échéancier contractuel, non recalculé ici, AD-20)
    'recouvrement.contentieux.transfere@1', // objet « Transfert au contentieux »
    'recouvrement.perte.decidee@1', // objet « Perte définitive »
    'collecte.remboursement.saisi@1', // objet « Remboursement saisi dans Prospera » (numéro de reçu obligatoire)
    'collecte.collecte.annulee@1', // objet « Annulation de collecte »
    'collecte.remise.contresignee@1', // objet « Remise d'espèces » : transfert de caisse, ne crédite aucun client
    'microfinance.client.converti@1', // objet « Création de client » (à la conversion du prospect)
    'microfinance.client.bloque@1', // état neutre `BLOCAGE_CONFORMITE` : demande de gel au cœur (AD-22)
    'microfinance.client.debloque@1', // [À CONFIRMER] levée du gel ; la spine ne nomme que le blocage pour le cœur
    'paiement.ordre-decaissement.changed@1', // EXECUTE : déclaration au cœur (« Décaissement exécuté hors du cœur », AD-5)
    'paiement.relecture.demandee@1', // relecture ciblée avant un lien de paiement (AD-6) ; réponse en moins de 30 s
    // [proposition, FR-155 : « Mobile Money validé » renvoyé au cœur ; FR-159 : écart de montant entre la
    // Créance et le reste dû du cœur] Faits d'ÉTAT de `paiement` : à confirmer, car AD-9 réserve à ce module les
    // faits de décision.
    'paiement.encaissement.changed@1',
    'paiement.creance.changed@1',
    // Agences : [proposition, voir l'écart n° 10] le manifeste de `reseau` publie ces trois faits, non
    // `reseau.agence.changed@1`.
    'reseau.noeud.created@1',
    'reseau.noeud.moved@1',
    'reseau.noeud.closed@1',
    'reseau.portee.changed@1', // [proposition, AD-16 et annexe A.6 C2 : « agence pour CPT »] filtre chaque lecture au serveur
    // Produits : [proposition, annexe C « Produit » ; A.6 C3 « lues seulement : produits »] référence à publier
    // vers le cœur dans l'espace d'essai ; rattachement d'un prêt reçu à un produit versionné.
    'produits-financiers.produit.publie@1',
    'produits-financiers.produit.retire@1',
    // [ajouts, AD-30 et spine du moteur] Horloge pilotée de l'espace d'essai, partagée avec le cœur fictif ;
    // propriétaire des domaines d'échange.
    'essai.horloge.changed@1',
    'connecteurs.domaine.changed@1', // propriétaire des domaines `coeur-sfd.*` (spine de Connecteurs, AD-3)
  ],

  // C10 (annexe A.6) : `profiles: ["coeur-sfd"]` ; socle + `reseau` + `produits-financiers`. Le cœur fictif s'y
  // ajoute dans un espace d'essai seulement.
  profilCompose: 'coeur-sfd',

  // C13, point 1 : `reseau` et `produits-financiers` en service (annexe A.6 C13). [proposition] Les deux codes de
  // prérequis sont de ce fichier.
  prerequis: [
    {
      code: 'reseau-en-service',
      description: "Le module `reseau` est installé et en service pour l'organisation",
      action: 'Installer `reseau`, puis relancer la vérification.',
    },
    {
      code: 'produits-financiers-en-service',
      description: "Le module `produits-financiers` est installé et en service pour l'organisation",
      action: 'Installer `produits-financiers`, puis relancer la vérification.',
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  // Les cinq codes et leurs critères sont ceux de l'annexe A.6 C13. [proposition] Le code `coeur-joignable` est
  // écrit sans la ligature de l'annexe (`cœur-joignable`), pour la route ; la couleur de l'autre cas, là où
  // l'annexe ne la donne pas, est posée ici (🟢 sinon pour `aucun-port-entrant` et `coeur-fictif-absent-du-reel`,
  // 🔴 sinon pour `envoi-idempotent` et `solde-de-controle`).
  verifications: [
    {
      code: 'coeur-joignable',
      route: 'POST /api/v1/instance/coeur-sfd/{organisationId}/verifications/coeur-joignable',
      critere:
        "Dernière interrogation réussie depuis moins de 2 fois la fraîcheur par défaut (heure : moins de 2 h) : 🟢 ; interrogation périmée : 🟠 ; jamais réussie : 🔴 (annexe A.6 C13, FR-159, FR-165).",
    },
    {
      code: 'aucun-port-entrant',
      route: 'POST /api/v1/instance/coeur-sfd/{organisationId}/verifications/aucun-port-entrant',
      critere:
        "Aucun port ouvert pour l'échange (Prospera tire toujours, FR-157) : 🟢 ; ≥ 1 port ouvert pour l'échange : 🔴 avec le port (annexe A.6 C13).",
    },
    {
      code: 'envoi-idempotent',
      route: 'POST /api/v1/instance/coeur-sfd/{organisationId}/verifications/envoi-idempotent',
      critere:
        "Un lot rejoué ne change aucun compte du jeu de contrôle (écart 0 FCFA, 0 objet créé en double) : 🟢 ; sinon 🔴 avec le nombre d'objets en écart (annexe A.6 C13, FR-160). Joué dans l'espace d'essai.",
    },
    {
      code: 'solde-de-controle',
      route: 'POST /api/v1/instance/coeur-sfd/{organisationId}/verifications/solde-de-controle',
      critere:
        "100 % des prêts du jeu de contrôle ont le solde du cœur au franc près : 🟢 ; ≥ 1 prêt en écart : 🔴 avec leur nombre (annexe A.6 C13, FR-161). Lecture seule chez le cœur ; traitement différé, progression visible.",
    },
    {
      code: 'coeur-fictif-absent-du-reel',
      route: 'POST /api/v1/instance/coeur-sfd/{organisationId}/verifications/coeur-fictif-absent-du-reel',
      critere:
        "Cœur fictif actif dans un espace RÉEL : 🔴 (`COEUR_FICTIF_INTERDIT`, FR-167) ; absent d'un espace réel : 🟢. Lit `coeurFictifAutorise` dans l'état publié (AD-10).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.6 C9). Désinstaller ne supprime rien : le
  // journal, la file et les écarts restent stockés et masqués ; test aller-retour.
  avertissementDesinstallation:
    "Plus aucun dossier accordé ni ordre ne partira vers le cœur ; ce qui est en file reste en file.",

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. La version du contrat
  // d'échange est portée par chaque objet : un objet d'une version plus récente est refusé « version inconnue » et
  // va dans la file des écarts. Règle d'or : `messageId` et `cleOrigine` ne changent jamais de forme dans la
  // fenêtre de 7 jours (la déduplication du cœur repose sur eux).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/coeur-sfd/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [
    'echange-par-fichiers', // le TRANSPORT seulement, jamais la forme des données (annexe A.6 C12)
  ],

  // C2, C13 point 5. Annexe A.6 C13 : « `GET` sur la file et l'état, export ». [proposition] Les chemins sont de
  // ce fichier, figés par EPIC-183. Aucune écriture : ni envoi, ni résolution d'écart, ni validation de
  // rapprochement, ni tirage forcé. Ces routes s'appliquent aux autres clients de la plateforme ; la lecture seule
  // pour abonnement échu ne vaut pas pour cette IMF (licence à vie), la capacité reste déclarée.
  routesLectureSeule: [
    'GET /api/v1/instance/coeur-sfd/{organisationId}/export',
    'GET /api/v1/organisations/{organisationId}/echange/etat', // état par objet, fraîcheur, transport
    'GET /api/v1/organisations/{organisationId}/echange/envois', // file d'envoi et états d'envoi
    'GET /api/v1/organisations/{organisationId}/echange/ecarts', // file des écarts
    'GET /api/v1/organisations/{organisationId}/echange/a-saisir', // liste « à saisir dans le cœur », par agence
    'GET /api/v1/organisations/{organisationId}/echange/rapprochement', // rapprochement trimestriel
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/coeur-sfd/v1/… devant : le code garde le
  // tiret). Les routes du point d'import de la Reprise et de l'échange (C13, tableau du contrat) s'ajoutent côté
  // service : `POST /api/v1/reprise/coeur-sfd/{organisationId}/objets/<objet>`, `…/controles/<objet>`, et
  // `POST /api/v1/echange/coeur-sfd/{organisationId}/objets/<objet>`, `GET …/en-attente`.
  routesInstance: {
    export: 'GET /api/v1/instance/coeur-sfd/{organisationId}/export',
    import: 'POST /api/v1/instance/coeur-sfd/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/coeur-sfd/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/coeur-sfd/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2). Les cinq objets de l'annexe A.6 C13, écrits sans
  // préfixe dans l'annexe (« schémas à déclarer, FR-196 ») ; au format du contrat `<code>.<objet>@1`. AD-2 (ligne
  // 133) : ce sont les objets de Reprise de `coeur-sfd`. Schémas dans prospera-plateforme/contrats/objets/coeur-sfd/
  // (reprise), distincts de prospera-plateforme/contrats/coeur-sfd/ (échange, AD-7) ; par défaut le format de
  // reprise est celui du contrat d'échange (FR-196), pour que le cœur fictif sache le produire.
  // - Ordre (FR-198) : `reseau` d'abord (agences et agents), puis `client`, `compte-epargne`, `pret`, `echeance`,
  //   `garantie` ; un prêt dont l'agence est inconnue est listé et n'est pas importé.
  // - Un prêt sans échéancier complet n'entre pas (`ECHEANCIER_INCOMPLET`, FR-197) ; l'import reprend échéancier
  //   et montants du cœur SANS recalcul de pénalités ni d'intérêts : le cœur fait foi.
  // - Valeurs de contrôle : solde de contrôle et reste dû, au franc près, par prêt (annexe C : « solde de
  //   contrôle » du prêt et du compte d'épargne, « reste dû » de l'échéance) ; un écart refuse le feu vert.
  // - Chevauchement avec `microfinance` : voir son manifeste (`microfinance.client@1`).
  objetsDeReprise: [
    'coeur-sfd.client@1',
    'coeur-sfd.pret@1',
    'coeur-sfd.echeance@1',
    'coeur-sfd.garantie@1',
    'coeur-sfd.compte-epargne@1',
  ],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2). Les VINGT domaines de l'annexe A.6 C13, dans son
  // ordre ; propriétaire de l'argent = le cœur. Le connecteur du cœur est HORS février (FR-259) : ces domaines
  // se déclarent maintenant, comme l'exigent A.6 C13 et FR-259, et se branchent plus tard sur `TransportCoeur`.
  // [proposition] Pour chacun : la sorte, `argent`, `controle`, le niveau et la clé de libellé sont de ce fichier
  // (l'annexe ne donne que les codes) ; le niveau suit la colonne « fréquence par défaut » de l'annexe C
  // (`IMMEDIAT` = « 5 min avec une API » ; un cœur sans API est limité à `HEURE` et `NUIT`) ; `objets` reprennent
  // les libellés de l'annexe C (les cinq de `objetsDeReprise` mis à part, les noms de schéma sont des
  // propositions) ; `publie` = les faits que ce module émet pour le domaine (`coeur-sfd.envoi.etat@1` pour un
  // sens Prospera vers le cœur) [À CONFIRMER avec EPIC-183 et le kit-cible de Connecteurs].
  // Règles du catalogue : `argent` implique `controle` (sauf sorte `LECTURE`) ; un domaine `controle` exige les
  // valeurs de contrôle de ses objets (annexe C : soldes de contrôle, reste dû, montants bruts, totaux de la
  // balance) [À CONFIRMER, EPIC-183]. Un seul point d'écriture par domaine (§6 du contrat) : ce module est le
  // propriétaire de TOUS ces domaines. Les objets « Agence » et « Produit » de l'annexe C n'ont pas de domaine
  // dans l'annexe : ils relèvent de `reseau` et de `produits-financiers`.
  domainesEchange: [
    {
      code: 'coeur-sfd.clients', // cœur → Prospera
      objets: ['coeur-sfd.client@1'],
      sorte: 'OBJET_DATE',
      argent: false,
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'coeur-sfd.echange.clients',
      publie: ['coeur-sfd.client.changed@1'],
    },
    {
      code: 'coeur-sfd.prets', // cœur → Prospera ; la garantie voyage avec le prêt (annexe C : « garanties (nature, valeur) »)
      objets: ['coeur-sfd.pret@1', 'coeur-sfd.garantie@1'],
      sorte: 'OBJET_DATE',
      argent: true,
      controle: true, // solde de contrôle, encours
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'coeur-sfd.echange.prets',
      publie: ['coeur-sfd.pret.changed@1', 'coeur-sfd.pret.solde@1'],
    },
    {
      code: 'coeur-sfd.echeances', // cœur → Prospera
      objets: ['coeur-sfd.echeance@1'],
      sorte: 'OBJET_DATE',
      argent: true,
      controle: true, // reste dû et sa date de lecture
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'coeur-sfd.echange.echeances',
      publie: ['coeur-sfd.echeancier.changed@1'],
    },
    {
      code: 'coeur-sfd.paiements', // cœur → Prospera ; « Mouvement de paiement »
      objets: ['coeur-sfd.mouvement-paiement@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.paiements',
      publie: ['coeur-sfd.mouvement.recu@1', 'coeur-sfd.mouvement.apparie@1'],
    },
    {
      code: 'coeur-sfd.penalites', // cœur → Prospera
      objets: ['coeur-sfd.penalite@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'coeur-sfd.echange.penalites',
      publie: ['coeur-sfd.mouvement.recu@1'], // les pénalités passent par le fait `mouvement.recu` (écart n° 1)
    },
    {
      code: 'coeur-sfd.epargne', // cœur → Prospera ; compte et mouvement d'épargne ; collecte renvoyée si le cœur sait recevoir
      objets: ['coeur-sfd.compte-epargne@1', 'coeur-sfd.mouvement-epargne@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true, // solde de contrôle du compte
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'coeur-sfd.echange.epargne',
      publie: ['coeur-sfd.epargne.changed@1'],
    },
    {
      code: 'coeur-sfd.caisse-guichet', // cœur → Prospera
      objets: ['coeur-sfd.caisse-guichet@1'],
      sorte: 'OBJET_DATE',
      argent: true,
      controle: true, // soldes d'ouverture et de clôture, écart
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'coeur-sfd.echange.caisse-guichet',
      publie: ['coeur-sfd.caisse-guichet.changed@1'],
    },
    {
      code: 'coeur-sfd.balance', // cœur → Prospera, facultatif ; seul objet agrégé
      objets: ['coeur-sfd.balance@1'],
      sorte: 'OBJET_DATE',
      argent: true,
      controle: true, // total débit = total crédit
      niveauParDefaut: 'NUIT',
      cleLibelleAction: 'coeur-sfd.echange.balance',
      publie: ['coeur-sfd.balance.recue@1'],
    },
    {
      code: 'coeur-sfd.dossiers-accordes', // Prospera → cœur ; « ne crée pas le prêt »
      objets: ['coeur-sfd.dossier-accorde@1'],
      sorte: 'OBJET_DATE',
      argent: true,
      controle: true, // montant brut accordé
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.dossiers-accordes',
      publie: ['coeur-sfd.envoi.etat@1'],
    },
    {
      // Prospera → cœur (ordre, déclaration d'un décaissement exécuté par `paiement`) et cœur → Prospera
      // (confirmation d'exécution). [proposition] « Décaissement exécuté hors du cœur » n'a pas de domaine
      // propre dans l'annexe : rangé ici avec l'ordre dont il est l'exécution.
      code: 'coeur-sfd.ordres-decaissement',
      objets: [
        'coeur-sfd.ordre-decaissement@1',
        'coeur-sfd.confirmation-execution@1',
        'coeur-sfd.decaissement-hors-coeur@1',
      ],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true, // montant brut, frais retenus, net à verser
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.ordres-decaissement',
      publie: [
        'coeur-sfd.envoi.etat@1',
        'coeur-sfd.ordre-decaissement.confirme@1',
        'coeur-sfd.ordre-decaissement.rejete@1',
      ],
    },
    {
      code: 'coeur-sfd.remboursements-saisis', // Prospera → cœur, si le cœur sait recevoir ; sinon liste « à saisir »
      objets: ['coeur-sfd.remboursement-saisi@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.remboursements-saisis',
      publie: ['coeur-sfd.envoi.etat@1'],
    },
    {
      code: 'coeur-sfd.creation-client', // Prospera → cœur, à la conversion du prospect
      objets: ['coeur-sfd.creation-client@1'],
      sorte: 'OBJET_DATE',
      argent: false,
      controle: false,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.creation-client',
      publie: ['coeur-sfd.envoi.etat@1', 'coeur-sfd.client.cree@1'],
    },
    {
      code: 'coeur-sfd.ouverture-compte-epargne', // Prospera → cœur ; « bientôt » si le cœur ne sait pas recevoir (FR-106)
      objets: ['coeur-sfd.ouverture-compte-epargne@1'],
      sorte: 'OBJET_DATE',
      argent: false,
      controle: false,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.ouverture-compte-epargne',
      publie: ['coeur-sfd.envoi.etat@1', 'coeur-sfd.compte-epargne.ouvert@1'],
    },
    {
      code: 'coeur-sfd.annulations', // Prospera → cœur : annulation d'un dossier ou d'un ordre ; annulation de collecte
      objets: ['coeur-sfd.annulation-dossier-ordre@1', 'coeur-sfd.annulation-collecte@1'],
      sorte: 'MOUVEMENT',
      argent: false, // l'annulation de collecte référence un numéro de reçu, le mouvement inverse est au cœur
      controle: false,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.annulations',
      publie: ['coeur-sfd.envoi.etat@1'],
    },
    {
      code: 'coeur-sfd.remises-especes', // Prospera → cœur, si le cœur sait recevoir ; sinon liste quotidienne
      objets: ['coeur-sfd.remise-especes@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true, // montant déclaré, montant compté, écart
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.remises-especes',
      publie: ['coeur-sfd.envoi.etat@1', 'coeur-sfd.remise.changed@1'],
    },
    {
      code: 'coeur-sfd.etalements', // Prospera → cœur ; renvoie le nouvel échéancier officiel (AD-27)
      objets: ['coeur-sfd.plan-etalement@1'],
      sorte: 'OBJET_DATE',
      argent: true,
      controle: true,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.etalements',
      publie: ['coeur-sfd.envoi.etat@1', 'coeur-sfd.echeancier.changed@1'],
    },
    {
      code: 'coeur-sfd.contentieux-et-pertes', // Prospera → cœur : transfert au contentieux, perte définitive
      objets: ['coeur-sfd.transfert-contentieux@1', 'coeur-sfd.perte-definitive@1'],
      sorte: 'MOUVEMENT',
      argent: true, // montant en perte (capital restant dû)
      controle: true,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.contentieux-et-pertes',
      publie: ['coeur-sfd.envoi.etat@1'],
    },
    {
      code: 'coeur-sfd.depots-de-garantie', // Prospera → cœur (blocage, restitution) ; cœur → Prospera (statut)
      objets: ['coeur-sfd.depot-garantie@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true,
      niveauParDefaut: 'IMMEDIAT',
      cleLibelleAction: 'coeur-sfd.echange.depots-de-garantie',
      publie: ['coeur-sfd.envoi.etat@1', 'coeur-sfd.depot-garantie.changed@1'],
    },
    {
      code: 'coeur-sfd.classe-officielle', // cœur → Prospera : classe réglementaire officielle et provisions comptabilisées
      objets: ['coeur-sfd.classe-officielle@1'],
      sorte: 'OBJET_DATE',
      argent: true,
      controle: true, // provision comptabilisée, par prêt et par agence
      niveauParDefaut: 'NUIT',
      cleLibelleAction: 'coeur-sfd.echange.classe-officielle',
      publie: ['coeur-sfd.classe-officielle.recue@1'],
    },
    {
      code: 'coeur-sfd.flux-mobile-money', // cœur → Prospera, FACULTATIF : onglet « Client » du dossier de crédit
      objets: ['coeur-sfd.flux-mobile-money@1'],
      sorte: 'LECTURE', // jamais comparée
      argent: true,
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'coeur-sfd.echange.flux-mobile-money',
      publie: [], // lecture : rien ne repart
    },
  ],

  // C11 (annexe A.6 C11, FR-199) : détection des écarts et des doublons probables entre Prospera et le cœur, avec
  // cause probable et confiance. Le moteur est l'IA COMMUNE (instance locale chez l'IMF) ; sans elle la file des
  // écarts fonctionne par règles et rien ne bloque (AD-14 : `NON_INSTALLE`, le processus continue). L'IA propose,
  // un humain rapproche ; l'IA ne corrige JAMAIS de l'argent et ne propose que des doublons probables, jamais un
  // rapprochement « au plus proche » (AD-8). Provenance affichée (règle ou modèle, version, date). Chaque
  // prédiction et chaque correction humaine est journalisée localement (C11, point 2) ; seuls des écarts
  // anonymisés repartent, avec le consentement de l'IMF. La proposition n'est pas un fait de module (AD-14) :
  // aucun fait `coeur-sfd.ecart.propose@1` (écart n° 4).
  ia: {
    modeles: ['detection-ecarts-doublons'],
    finalites: ['rapprochement-assiste'],
  },
} as const;
