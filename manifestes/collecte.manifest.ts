// Manifeste M16 — Collecte (`collecte`) (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : PRD microfinance (prds/prd-microfinance-2026-11-13), annexe A.4, treize clauses C1 → C13, corrigées
// par la spine (architecture/architecture-microfinance-imf-2026-11-13) : AD-9 est le catalogue COMPLET des faits
// et gagne sur la ligne C5 de l'annexe A (écarts signalés ci-dessous).
// Le propriétaire du dépôt `prospera-imf-service` le copie dans `src/modules/collecte/module.manifest.ts` la
// semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD microfinance FR-135 → FR-142 (§6.3), annexe A.4, annexe B (ligne « Collecte terrain »), annexe D
//              (paramètres de collecte) ; spine AD-2 (collecte, seul écrivain de toute ligne d'encaissement
//              d'espèces saisie dans Prospera), AD-3 (un module Nest par code, aucun import croisé), AD-8 (clé
//              d'origine `(numeroRecu, numeroLigne)`), AD-9, AD-15, AD-16, AD-17, AD-19, AD-25, AD-29 ;
//              épics epics-microfinance-imf-2026-11-13.md (EPIC-191 : collecte terrain ; EPIC-195 : IA du suivi,
//              FR-142) ; manifestes-a-produire.md (M16).
//
// Hors manifeste, pour mémoire :
// - Offre : pack imf-sfd (manifestes-a-produire.md, M16 : absent des 13 modules du pricing, présent au pack
//   imf-sfd). Licence à vie et contrat de maintenance mensuel (D-13, D-21) : la lecture seule pour abonnement
//   échu ne s'applique pas à cette IMF (annexe A, préambule) ; elle reste une capacité de la plateforme pour les
//   autres clients, d'où les `routesLectureSeule` déclarées ci-dessous.
// - Service porteur : `prospera-imf-service` (spine AD-3 et AD-25 ; l'annexe A.4 écrivait « [À CONFIRMER, M16] »,
//   la spine l'a tranché). Port de développement réservé 3406 (convention de la spine). Collections préfixées
//   `collecte_`, piste d'audit `collecte_audit` en ajout seul (AD-17), paramètres `collecte_parametres`.
// - Écrans : module d'écran `collecte` dans `prospera-app` (C8), `src/modules/collecte/` : `/collecte` (plan du
//   jour, saisie, reçus, file de synchronisation), `/collecte/remises`, `/collecte/rapprochement`,
//   `/collecte/a-saisir`. Application terrain hors ligne : `prospera-terrain` (Flutter, PRD-D FR-109 ; AD-19) ;
//   collecte de tontine : « bientôt ». Chaque entrée de menu exige un des droits ci-dessous.
// - Rôles (annexe B, ligne « Collecte terrain ») : AT et COLL = A (agent terrain et collecteur saisissent) ; DG,
//   DAF, RA, GP, RCC, AUD = L (lecture de leur périmètre) ; CPT = L (il contresigne la remise, droit propre).
//   Les correspondances rôle → droit ci-dessous sont des propositions, à confirmer avec les rôles du vertical.
// - Cloisonnement (C2) : `organisationId` et portée lue dans `reseau.portee.changed@1` (AD-16) : le collecteur
//   lit et enregistre pour sa zone et ses clients de collecte ; le RA son agence ; le RCC son agence ou sa
//   région ; le CPT les remises de son agence ; l'auditeur lit. ADMIN_IMF ne lit aucune donnée métier. Gate :
//   refus `COLLECTE_NOT_ENTITLED`, 403 sans donnée.
// - Données possédées (C3) : collectes (type, montant, canal, client, compte ou échéance, collecteur, `dateValeur`
//   et `dateSynchro` serveur, heure déclarée de l'appareil, position, clé d'idempotence, état DECLAREE / ENVOYEE /
//   CONFIRMEE / REFUSEE), reçus numérotés et leurs lignes, plages de reçus par collecteur, remises d'espèces
//   (transferts de caisse, jamais un crédit de client) et leur contresignature, annulations avec motif,
//   rapprochements, écarts de remise, quarantaine `A_ARBITRER` des collectes d'un appareil perdu (AD-19), listes
//   « à saisir dans le cœur » (vue), plans du jour. Lues seulement : échéances, soldes, mouvements (projections de
//   `coeur-sfd`) ; clients (`microfinance`).
// - États : le PRD écrit ENVOYEE ; la spine nomme `EN_ATTENTE_COEUR` l'état d'un fait d'argent saisi dans
//   Prospera et affiché « en attente du cœur » (Consistency Conventions, ligne « Statuts »). Même état, deux noms ;
//   celui de la spine est celui du code.
// - Écart annexe D ↔ spine (AD-19) : l'annexe D écrit une plage de numéros de reçu « par appareil » ; la spine
//   attribue la plage à un COLLECTEUR, jamais à un appareil, au format `RC-<agence>-<collecteur>-<n>` (entier à 8
//   chiffres, sans réutilisation) ; la spine gagne.
// - Ce que ce module ne fait jamais (spine) : apparier un mouvement du cœur (seul `coeur-sfd` apparie, AD-8) ;
//   calculer un solde ; créditer un client d'une remise ; décider hors ligne (AD-19 : l'appareil propose, le
//   serveur juge).
// - La validation d'un paiement Mobile Money en attente (FR-140) est un acte de `paiement`
//   (`paiement:encaissement:valider`) : aucun droit de validation n'est créé ici.
// - Le reçu par SMS (enrichiPar `notification`) : le fait déclencheur n'est pas nommé dans la spine (AD-9) ;
//   [À CONFIRMER] avec `notification` (nom du fait, ou appel direct).

export const MANIFESTE_COLLECTE = {
  code: 'collecte',
  version: '1.0.0',

  // C1 : microfinance et reseau sont des dépendances DURES (annexe A.4). L'annexe A écrit « Une collecte vise un
  // client ou un groupe et son compte ou son échéance » et « Un collecteur travaille dans sa zone ».
  depends: [
    {
      code: 'microfinance',
      raison:
        "Une collecte vise un client ou un groupe et son compte ou son échéance ; la fiche, le KYC et l'état de blocage sont tenus par microfinance.",
    },
    {
      code: 'reseau',
      raison: "Un collecteur travaille dans sa zone ; la portée (zone, agence, région) est lue de reseau (AD-16).",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`{ etat: 'NON_INSTALLE', module }`), jamais 0 ni
  // absent. Un test par entrée.
  // - coeur-sfd : échéancier, comptes, renvoi et confirmation (FR-137). Absent : échéancier et confirmation
  //   `NON_INSTALLE` ; la collecte s'enregistre et reste DECLAREE ; la liste « à saisir dans le cœur » sert ;
  // - terrain : visite, position, plan préchargé, hors ligne. Absent : pas de plan préchargé ni de position ;
  // - paiement : Mobile Money, PI-SPI (FR-140). Absent : collecte Mobile Money `NON_INSTALLE` (espèces seulement) ;
  // - caisse : remise et clôture du jour. Absente : la remise s'enregistre sans clôture du jour ;
  // - notification : reçu par SMS. Absent : reçu papier seulement ;
  // - ia-commune : priorités du jour (FR-142). Absente : ordre = règle de base (retards, J-3, prospects).
  // ⚠️ `ia-commune` retiré de `enrichiPar` (harmonisation du lot 3, 2026-11-13) : l'annexe A l'écrit comme un
  // module, mais ce n'est pas un code du catalogue ; c'est le port Proposition de la spine (AD-14), service
  // porteur à cadrer. Un code inconnu ferait échouer la validation des manifestes. Son absence se traite
  // comme le dit C4 ci-dessus (règle v0 ou « indisponible »).
  enrichiPar: ['coeur-sfd', 'terrain', 'paiement', 'caisse', 'notification'],

  // Aucun référentiel : la collecte ne tient aucune écriture ; l'imputation officielle est celle du cœur.
  referentielFamilies: [],

  // C7 : droits de tenant, les sept de l'annexe A.4 (format `^[a-z]+:[a-z-]+:[a-z]+$` : conforme). L'export
  // reste réservé à instance:donnees:exporter (C2).
  droits: [
    'collecte:collecte:saisir', // enregistrer une collecte, la corriger avant remise (COLL, AT)
    'collecte:collecte:consulter', // collectes et reçus de son périmètre ; retrouver une collecte par son numéro de reçu
    'collecte:collecte:annuler', // annulation avec motif obligatoire, validée par le RA (FR-139)
    'collecte:remise:contresigner', // compter et contresigner une remise d'espèces (CPT) ; jamais sur sa propre remise (AD-15)
    'collecte:rapprochement:traiter', // écran de rapprochement : écarts de collecte, doublons possibles, file du comptable (FR-139)
    'collecte:plan:consulter', // plan du jour préchargé sur l'appareil (FR-141)
    'collecte:agence:consulter', // vue de l'agence : liste « espèces non remises », annulations par collecteur (RA, RCC)
  ],

  // C5 : faits publiés et consommés. SOURCE : le catalogue AD-9 de la spine, qui complète et corrige la ligne C5
  // de l'annexe A.4. Un nom absent d'AD-9 ne se publie ni ne se consomme (il s'ajoute par une PR qui amende AD-9).
  // Chaque fait d'objet porte l'identifiant stable de l'objet, `organisationId`, la clé d'origine
  // `(numeroRecu, numeroLigne)` quand il porte de l'argent (AD-8) et toute somme est `(entier, devise)` (AD-13).
  // Écarts annexe A.4 ↔ spine AD-9 (la spine gagne) :
  //   · `collecte.collecte.confirmee@1` et `collecte.collecte.refusee@1` (annexe A.4) : ABSENTS d'AD-9. L'état
  //     CONFIRMEE ou REFUSEE est un champ de `collecte.collecte.changed@1` (état complet, graphie `.changed`) ;
  //   · `collecte.collecte.annulee@1` et `collecte.remboursement.saisi@1` : AJOUTÉS par AD-9 (consommés par
  //     `coeur-sfd`, annexe C : « Annulation de collecte », « remboursement saisi ») ;
  //   · `coeur-sfd.mouvement.recu@1` (annexe A.4, « confirmation ») : REMPLACÉ par
  //     `coeur-sfd.mouvement.apparie@1` (AD-8). Le module propriétaire du fait ne change son état de
  //     EN_ATTENTE_COEUR à confirmé QUE sur ce fait et ne lit jamais `coeur-sfd.mouvement.recu@1` pour apparier ;
  //     un fait en attente plus vieux que son délai passe en écart par `coeur-sfd`, jamais par `collecte`.
  publie: [
    'collecte.collecte.changed@1', // état complet : états DECLAREE / EN_ATTENTE_COEUR / CONFIRMEE / REFUSEE, lignes, A_ARBITRER
    'collecte.collecte.annulee@1', // contre-passation avec motif ; référence la ligne annulée (AD-8)
    'collecte.remboursement.saisi@1', // ligne d'espèces saisie au guichet ou sur le terrain : porte `(numeroRecu, numeroLigne)`
    'collecte.remise.contresignee@1', // transfert de caisse, porteur des numéros de reçu remis ; ne crédite jamais un client (AD-8)
    'collecte.ecart.detecte@1', // porte `nature` : écart de remise ; TROU_DE_PLAGE ; NON_SYNCHRONISE (AD-19). Valeur de `nature` pour l'écart de remise : [proposition, AD-2 exige un champ `nature` distinct de l'écart de clôture de `caisse`, la valeur n'est nommée nulle part]
    'collecte.liste-a-saisir.changed@1', // vue « à saisir dans le cœur » par agence et par jour, quand le cœur ne sait pas recevoir (FR-137)
    'instance.journal@1', // [proposition, convention des manifestes voisins] annulations, dérogations, plages perdues, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'reseau.portee.changed@1', // portée : zone, agence, région, portefeuille (AD-16) ; suite de conformité de reseau en CI
    'microfinance.client.changed@1', // identité du cœur et `lueLe`, client de collecte, rattachement à la zone
    'microfinance.consentement.changed@1', // position de la collecte « si consentie » (FR-135, FR-118) [À CONFIRMER : seul usage prévu par les sources, nom présent dans AD-9]
    'microfinance.client.bloque@1', // état neutre `BLOCAGE_CONFORMITE` (AD-22 : les gardes de `collecte` ne lisent que cet état) [À CONFIRMER : FR-135 et FR-121/122 acceptent remboursement et dépôt d'un client en correspondance de sanctions ; à lever avant de coder une garde]
    'microfinance.client.debloque@1', // idem, levée du blocage [À CONFIRMER, même raison]
    'coeur-sfd.echeancier.changed@1', // échéance due, ordre d'imputation, restant dû « à jour au » (FR-137, FR-141)
    'coeur-sfd.mouvement.apparie@1', // SEUL fait de confirmation : clé d'origine, ligne, `mouvementCoeurId`, résultat CONFIRME ou ECART (AD-8)
    'paiement.encaissement.changed@1', // Mobile Money et PI-SPI : l'encaissement électronique est un objet de `paiement` (AD-2) ; sert la collecte électronique (FR-140)
    'terrain.visite.changed@1', // visite et position ; porte `visitePar` (AD-15)
    // Non consommés, volontairement : `paiement.creance.changed@1` (`montantExigible`, `lueLe`) n'est pas dans la
    // clause C5 de l'annexe A.4 ; le restant dû affiché au collecteur est celui du cœur, lu par
    // `coeur-sfd.echeancier.changed@1` (FR-137). [À CONFIRMER] si l'écran du collecteur doit afficher le
    // `montantExigible` de `paiement` (AD-6 : un reste dû calculé par `paiement` seul).
  ],

  profilCompose: 'collecte',

  // C13, point 1 : l'annexe A.4 écrit « `microfinance` et `reseau` en service » ; ce sont les dépendances dures
  // de `depends`, que le moteur installe et contrôle. Aucun prérequis extérieur (comme stock et commande).
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur. Noms de
  // routes proposés (convention commune de l'annexe A : `verifications/<code>`). Codes et critères : annexe A.4.
  verifications: [
    {
      code: 'recus-continus',
      route: 'POST /api/v1/instance/collecte/{organisationId}/verifications/recus-continus', // [proposition]
      critere:
        "Suite de reçus de chaque collecteur sur les 100 derniers : ni trou ni doublon : 🟢 ; sinon 🔴 avec le collecteur et le numéro (FR-135 ; AD-19 : un trou de plage est déclaré `collecte.ecart.detecte@1` `TROU_DE_PLAGE`, AD-29 : jamais de numéro réémis).",
    },
    {
      code: 'idempotence',
      route: 'POST /api/v1/instance/collecte/{organisationId}/verifications/idempotence', // [proposition]
      critere:
        "Renvoi de la même collecte 5 fois sur le jeu de contrôle : une seule collecte créée : 🟢 ; sinon 🔴 (FR-136).",
    },
    {
      code: 'collectes-concordantes',
      route: 'POST /api/v1/instance/collecte/{organisationId}/verifications/collectes-concordantes', // [proposition]
      critere:
        "Sur le jeu de contrôle, chaque collecte CONFIRMEE a un mouvement du cœur de même montant, apparié par `coeur-sfd.mouvement.apparie@1` (AD-8) : 🟢 ; sinon 🔴 avec leur nombre. Sans `coeur-sfd` : « non installé ».",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.4). Désinstaller ne supprime rien :
  // collectes, reçus et remises restent stockés et masqués ; la suite de numéros de reçu est conservée
  // (réinstaller reprend sans trou ni doublon, AD-29).
  avertissementDesinstallation:
    "La collecte terrain s'arrête ; les collectes non confirmées ne seront plus envoyées au cœur.",

  // C12 : format lisible par la version précédente pendant 7 jours (le compteur de reçus ne change jamais de
  // forme dans la fenêtre). Migration additive. L'image de `prospera-imf-service` est unique : son
  // `retourArriere` est le plus restrictif de ses modules (AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/collecte/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // - `renvoi-automatique-au-coeur` : éteint tant que le cœur ne sait pas recevoir un remboursement ou un dépôt ;
  //   la liste « à saisir dans le cœur » sert (FR-137) ;
  // - `priorites-ia` : ordre de visite proposé par l'IA commune (FR-142).
  // Comportement seulement, jamais la forme des données.
  interrupteurs: ['renvoi-automatique-au-coeur', 'priorites-ia'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexe A.4 : « consultation, liste à saisir, export »).
  // Seule la route d'export est nommée par la convention commune ; les autres noms sont des propositions, à
  // figer par la story d'API d'EPIC-191.
  routesLectureSeule: [
    'GET /api/v1/instance/collecte/{organisationId}/export',
    'GET /api/v1/collectes', // [proposition]
    'GET /api/v1/collectes/{id}', // [proposition] retrouvée aussi par son numéro de reçu (FR-135)
    'GET /api/v1/remises', // [proposition]
    'GET /api/v1/collectes/rapprochement', // [proposition]
    'GET /api/v1/collectes/a-saisir', // [proposition] liste « à saisir dans le cœur »
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/collecte/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/collecte/{organisationId}/export',
    import: 'POST /api/v1/instance/collecte/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/collecte/{organisationId}/effacement', // tracé, avec certificat ; respecte la conservation légale (10 ans pour la piste, AD-17)
    sante: 'GET /api/v1/instance/collecte/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : aucun objet repris. « Aucune collecte passée n'est
  // reprise ; l'historique vient du cœur » (annexe A.4) [À CONFIRMER avec le PRD Reprise : l'annexe A.4 le
  // marque ainsi]. Le compteur de reçus est une donnée du module, jamais repris : la plage d'un collecteur
  // repart au-delà du maximum déclaré (AD-29).
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : l'annexe A.4 écrit `domainesEchange:
  // ['paiements-collectes']` (propriétaire : le cœur pour l'imputation et les écritures ; Prospera pour
  // l'enregistrement, le reçu et la remise). La forme objet ci-dessous est celle des manifestes voisins ; code,
  // objet, niveau et clé de libellé sont des propositions. Le propriétaire de l'argent reste le cœur : un seul
  // point d'écriture par domaine (§6 du contrat). Transport par `coeur-sfd` (file d'envoi acquittée, AD-7).
  domainesEchange: [
    {
      code: 'collecte.paiements-collectes', // [proposition] l'annexe A.4 donne `paiements-collectes`
      objets: ['collecte.collecte@1'], // [proposition]
      sorte: 'MOUVEMENT', // [proposition] mouvements, jamais totaux (Connecteurs AD-4)
      argent: true,
      controle: true, // [À CONFIRMER] valeur de contrôle : montant en unité mineure, devise, numéro de reçu
      niveauParDefaut: 'HEURE', // [proposition] fréquences par défaut de l'annexe C : 5 min (API seulement), heure, nuit
      cleLibelleAction: 'collecte.echange.paiements-collectes', // [proposition]
      publie: ['collecte.remboursement.saisi@1', 'collecte.collecte.annulee@1', 'collecte.remise.contresignee@1'],
    },
  ],

  // C11 : capacité FR-142 (priorités de la journée du collecteur), EPIC-195. Le moteur est l'IA commune, en
  // instance locale chez l'IMF (spine AD-14) ; le module n'embarque aucun modèle et ne calcule aucun ordre
  // lui-même : il demande une Proposition au port `PropositionPort`. Noms de modèle et de finalité : annexe A.4
  // (propositions de l'annexe). Données lues par l'instance : échéances et retards (lus du cœur), promesses,
  // score, signaux faibles, secteur, distance ; seuls des écarts anonymisés repartent, SOUS le consentement
  // « IA commune » du client (AD-14, deux conditions). L'ordre est une proposition réordonnable ; le changement
  // du collecteur est enregistré pour mesurer, pas pour contrôler. Provenance affichée : règle ou modèle,
  // version, date. Absente : la règle de base sert (retards, puis échéances J-3, puis prospects).
  ia: {
    modeles: ['priorites-du-jour'],
    finalites: ['ordre-de-visite-propose'],
  },
} as const;
