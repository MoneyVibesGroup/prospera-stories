// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M32 — Clients, KYC et LBC/FT (code `microfinance`), qui couvre aussi M17 « Épargne & dépôts » LUE du
// cœur (format du contrat de module, clause C1, amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories, PRD microfinance (prds/prd-microfinance-2026-11-13, FINAL, PR #426), annexe A.3
// (treize clauses C1 → C13), annexe B (rôles × droits), annexe C (contrat d'échange avec le cœur) et annexe D
// (paramètres) ; spine de l'IMF (architecture/architecture-microfinance-imf-2026-11-13, FINALE, PR #428 :
// AD-1, AD-2, AD-3, AD-7, AD-8, AD-9, AD-14, AD-16, AD-17, AD-18, AD-22, AD-25, AD-29, AD-30). Les noms de
// topics, de droits, de modèles et de finalités de l'annexe sont des propositions du PRD ; ce fichier les fige.
// Le propriétaire du dépôt `prospera-imf-service` (à créer) le copie dans `src/modules/microfinance/` (module
// Nest, AD-3) la semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du
// catalogue (C1).
// Références : PRD microfinance (FR-114 → FR-134 : prospects, fiche, KYC, LBC/FT, IA des clients, groupes,
//              épargne lue, consentements, accès, hors ligne) ; FR-116 (une personne, une fiche, un identifiant du cœur) ; FR-130
//              (l'épargne se lit du cœur) ; FR-196 → FR-198 (reprise) ; épics EPIC-181 (clients, groupes, KYC),
//              EPIC-182 (LBC/FT) ; `manifestes-a-produire.md` (lignes M17, M32 et amendement du 2026-11-13).
//
// ⚠️ DEUX MODULES, UN MANIFESTE (décision du PO du 2026-11-12). M17 `epargne` n'a PAS de code propre : l'épargne
// est LUE du cœur par `microfinance` (projections de `coeur-sfd`, AD-1 ; écran `/epargne`, droit
// `microfinance:epargne:consulter`). Prospera n'écrit ni solde ni mouvement d'épargne. Ni le catalogue de
// produits d'épargne (tenu par `produits-financiers`, M46) ni les comptes (tenus par le cœur) ne sont ici.
//
// ⚠️ SERVICE PORTEUR : `prospera-imf-service` (module Nest `src/modules/microfinance/`, AD-2, AD-3, AD-25 ;
// `manifestes-a-produire.md`, amendement du 2026-11-13). Cela lève le [À CONFIRMER, M32] de l'annexe A.3 C1.
// Le dépôt `prospera-microfinance-service` reste le PAQUET COMPTABLE des SFD : il n'est pas installé chez l'IMF
// au jour 1 (A11) ; on n'en réutilise que les règles (FR-182). Un module n'importe jamais le code d'un autre
// module du service (AD-3) ; collections préfixées `microfinance_`, piste d'audit en ajout seul
// `microfinance_audit` chaînée et ancrée hors de l'hôte (AD-17), journal des ACCÈS distinct, lisible de
// l'auditeur seul. L'image du service est unique : son `retourArriere` est le plus restrictif de ses modules.
//
// ⚠️ DONNÉES SENSIBLES (AD-18). Numéros de pièce, téléphones, positions GPS, photos de pièces et motifs LBC/FT
// sont CHIFFRÉS PAR CHAMP par l'application avant l'écriture en base (enveloppe `champs-sensibles` : version de
// clé, nonce, texte chiffré) ; les champs interrogeables par égalité (pièce, téléphone ; FR-116, FR-121,
// FR-123) portent un index aveugle HMAC ; les clés vivent dans le coffre de l'instance, jamais accessibles à
// ADMIN_IMF. Rien de nominatif ne quitte l'instance : ce qui part vers l'IA commune est anonymisé sur place.
//
// ⚠️ LBC/FT CLOISONNÉE (AD-22). Le dossier de soupçon, la correspondance de sanctions, l'alerte CENTIF et la
// procédure « correspondance confirmée » vivent dans une collection lisible de la seule habilitation de
// conformité, du DG et de l'AUD. AUCUN fait du bus, AUCUNE route, AUCUN message ne les expose à un autre rôle,
// pas même un compteur. Seul un ÉTAT NEUTRE sort : `microfinance.kyc.changed@1` et
// `microfinance.client.bloque@1` / `.debloque@1` (code `BLOCAGE_CONFORMITE`, sans motif, sans liste, sans
// score). Les routes de lecture seule ci-dessous n'en listent aucune qui rende ces données.
//
// ⚠️ ÉCARTS ANNEXE A.3 ↔ SPINE (la spine gagne, AD-9 « corrige les C5 de l'annexe A ») :
// 1. `microfinance.sanctions.correspondance@1` et `microfinance.alerte-centif.creee@1` (annexe A.3 C5) sont
//    ABSENTS du catalogue AD-9 et contredisent AD-22 (aucun fait n'expose une correspondance ni une alerte
//    CENTIF) : NON publiés ici.
// 2. `microfinance.client.bloque@1` et `microfinance.client.debloque@1` sont AJOUTÉS (AD-9, AD-22) : c'est par
//    eux que `credit`, `collecte` et `coeur-sfd` (demande de gel au cœur) apprennent le blocage.
// 3. `etat-publie.changed.*@1` (annexe) est écrit en deux entrées (`.essai@1`, `.reel@1`), comme les autres
//    manifestes.
// 4. Objets de reprise : l'annexe A.3 C13 déclare `microfinance.client@1`, `microfinance.groupe@1`,
//    `microfinance.kyc@1` ; la spine (AD-2, ligne 133) donne l'objet de reprise `client` (identité) à
//    `coeur-sfd`. Voir `objetsDeReprise` plus bas : [À CONFIRMER].
// 5. IA commune absente : l'annexe A.3 C4 dit « règle v0 ou indisponible » ; AD-14 dit que l'emplacement rend
//    `NON_INSTALLE` et que le processus continue. Ce fichier suit AD-14 (« règle » tant que l'origine `MODELE`
//    n'existe pas, jamais le mot « IA », FR-8).
//
// Hors manifeste, pour mémoire :
// - Offre : bundles de l'IMF « Crédit » (M32) et « Croissance & Opérations » (M17), puis « Plateforme »
//   (`manifestes-a-produire.md`, lignes M32 et M17). Licence à vie et contrat de maintenance mensuel : la lecture
//   seule pour abonnement échu ne s'applique pas à cette IMF (annexe A, préambule), elle reste une capacité de la
//   plateforme.
// - Gate : `MICROFINANCE_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Écrans : module d'écran `microfinance` dans `prospera-app` (C8), tous les écrans par Dev B. Routes
//   `/clients` (liste, prospects), `/clients/nouveau`, `/clients/[id]` (fiche : identité, activité, KYC, groupe,
//   épargne lue, analyse), `/groupes`, `/kyc` (file de validation, revues, sanctions), `/zones-risque` (carte),
//   `/epargne` (liste des comptes, vue consolidée du DG, statistiques : lecture du cœur, FR-130), `/equite`
//   (AUD et RSQ). Entrées de menu selon les droits. « Nouveau emprunteur » et « Ajouter un document » sont
//   BRANCHÉS (boutons de la démo) ; tontines et rapprochement BIC direct : « bientôt ».
// - Cloisonnement (C2, AD-16) : `organisationId` sur chaque lecture et écriture, et portée lue dans
//   `reseau.portee.changed@1` (zone, agence, portefeuille, réseau) : DG réseau, RA son agence, CC ses dossiers,
//   GP son portefeuille, agent terrain, commercial et collecteur leur zone, AUD en lecture seule ; ADMIN_IMF ne
//   lit AUCUNE donnée métier (FR-133). Accès journalisé. Le rattachement `gpClient` est écrit ici et repris par
//   `reseau` dans la portée (AD-2, AD-16).
// - Identité du client, champ par champ (AD-2, ligne 134) : nom, date de naissance, pièce, statut = cœur,
//   projetés par `coeur-sfd` ; KYC, fiche enrichie, consentements, rattachements = ce module. Il est SEUL à
//   écrire `cleOrigineCoeur` sur la fiche ; un écart d'identité est marqué `A_RAPPROCHER`, jamais corrigé. Les
//   consommateurs lisent l'identité dans `microfinance.client.changed@1` (valeur du cœur et `lueLe`).
// - Le statut KYC et sa validité (`valideJusquau`) sont calculés ICI seul ; `credit` ne les recalcule jamais
//   (AD-2, ligne 136).
// - Séparation des tâches : `creePar` et `valideePar` voyagent dans `microfinance.client.changed@1` ; le créateur
//   ne valide pas son propre KYC (AD-15, EPIC-181). Une fiche sans secteur d'activité ne se valide pas (FR-117).
// - Droits : le catalogue des droits est un `enum` fermé (C7) : chaque droit ci-dessous demande une PR
//   `auth-service` à la livraison du module. Tous passent `^[a-z]+:[a-z-]+:[a-z]+$` ; le code `microfinance` n'a
//   pas de tiret.
// - Rôles (annexe B, lignes « Fiche client, KYC » et « Listes de sanctions, revue KYC ») : fiche et KYC en
//   lecture pour DG, DAF, ROC, RA, GP, RCC, RSQ, REC, AUD, CPT ; CC DÉCIDE le KYC ; AT, COLL et COM agissent
//   (création) ; COMM et ADMIN_IMF n'ont aucun accès à la fiche. Listes de sanctions et revue KYC : CC agit ;
//   DG, DAF, ROC, RA, RSQ, AUD lisent ; ADMIN_IMF « A (sources) ». L'habilitation de conformité est
//   `microfinance:kyc:valider` + `microfinance:sanctions:traiter`, accordée par le DG (FR-120). Le rôle exact
//   de chaque autre droit n'est pas fixé par l'annexe B : [À CONFIRMER, avec la matrice de §2.1].
//   [À CONFIRMER] « ADMIN_IMF : A (sources) » sur les listes de sanctions : aucun des treize droits ne le
//   couvre ; si c'est un réglage de paramètre (annexe D), il ne donne aucune lecture métier.

export const MANIFESTE_MICROFINANCE = {
  code: 'microfinance',
  version: '1.0.0',

  // C1 : une seule dépendance DURE (annexe A.3 C1, dépendances proposées, à valider par le PO) : un client
  // appartient à une agence et à une zone ; le périmètre de lecture vient de la portée du réseau.
  depends: [
    {
      code: 'reseau',
      raison:
        "Un client appartient à une agence et à une zone ; le périmètre de lecture vient de la portée du réseau.",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par
  // entrée.
  // - coeur-sfd : identifiant du cœur, comptes d'épargne et mouvements lus (FR-116, FR-130) = `{etat:
  //   NON_INSTALLE, module: coeur-sfd}` ; la fiche s'ouvre, AUCUN décaissement n'est possible (client « en
  //   attente du cœur », FR-116) ;
  // - produits-financiers : éligibilité = `NON_INSTALLE` ;
  // - credit : cautions et dossiers = `NON_INSTALLE` (partie liée comprise) ;
  // - terrain : visites et position lues de la fiche seule ;
  // - collecte : versements collectés lus pour les analyses d'épargne ; sans lui, rien ne change sur la fiche ;
  // - notification : alertes de revue et de sanctions dans l'écran seulement (les alertes de conformité
  //   partent de ce module seul, vers les habilitations de conformité, le DG et l'AUD, AD-22) ;
  // - ia-commune : score, PD, signaux faibles, analyse étendue, zones suggérées, épargne = `NON_INSTALLE`
  //   (AD-14 ; l'annexe A.3 C4 écrit « règle v0 ou indisponible » : voir l'écart n° 5). Ce n'est PAS un module
  //   du catalogue : c'est le port `PropositionPort` de l'instance locale de l'IA commune [À CONFIRMER :
  //   l'annexe le range dans `enrichiPar`, la spine AD-14 en fait un port ; à garder ou à retirer du champ
  //   quand le service porteur de l'IA commune sera cadré, Deferred de la spine].
  // ⚠️ `ia-commune` retiré de `enrichiPar` (harmonisation du lot 3, 2026-11-13) : l'annexe A l'écrit comme un
  // module, mais ce n'est pas un code du catalogue ; c'est le port Proposition de la spine (AD-14), service
  // porteur à cadrer. Un code inconnu ferait échouer la validation des manifestes. Son absence se traite
  // comme le dit C4 ci-dessus (règle v0 ou « indisponible »).
  enrichiPar: [
    'coeur-sfd',
    'produits-financiers',
    'credit',
    'terrain',
    'collecte',
    'notification',
  ],

  // Aucun numéro de compte ici : l'IMF n'y tient pas de comptabilité (le paquet comptable n'est pas installé).
  referentielFamilies: [],

  // C7 : treize droits de tenant, ceux de l'annexe A.3 C7. L'export reste réservé à instance:donnees:exporter
  // (C2). Format `^[a-z]+:[a-z-]+:[a-z]+$` conforme.
  droits: [
    'microfinance:client:consulter', // fiche, prospects, groupes, dans son périmètre (FR-114, FR-116)
    'microfinance:client:creer', // créer un prospect puis une fiche client (FR-114, FR-115, FR-117)
    'microfinance:client:convertir', // convertir un prospect en client ; déclenche la création chez le cœur (FR-115, FR-116)
    'microfinance:kyc:valider', // valider le KYC d'un client, jamais son propre créateur ; habilitation de conformité (FR-120)
    'microfinance:kyc:consulter', // niveaux, statuts, pièces, expirations, file de revue (FR-119, FR-120, FR-122)
    'microfinance:sanctions:traiter', // traiter les correspondances de listes ; habilitation de conformité (FR-121)
    'microfinance:groupe:gerer', // former et suivre un groupe solidaire : composition, rôles, caution mutuelle (FR-129)
    'microfinance:epargne:consulter', // épargne LUE du cœur : fiche, liste des comptes, vue consolidée du DG (FR-130)
    'microfinance:analyse:consulter', // score, PD, signaux faibles, analyse étendue, zones de risque, cohésion (FR-124 → FR-128)
    'microfinance:consentement:gerer', // recueillir et retirer les consentements par finalité (FR-132)
    'microfinance:journal:consulter', // journal des accès : l'auditeur seul (FR-9, FR-133)
    'microfinance:equite:consulter', // suivi d'équité : taux d'acceptation par genre, zone et secteur ; AUD et RSQ (FR-124)
    'microfinance:sanctions:confirmer', // DG ou personne désignée : correspondance confirmée, gel, déclaration (FR-121)
  ],

  // C5 : faits publiés et consommés. Source : catalogue AD-9 de la spine (qui corrige l'annexe A.3 C5, voir les
  // écarts 1 à 3 de l'en-tête). Chaque fait d'objet porte l'identifiant stable de l'objet, l'`organisationId` et
  // un `rang` (point d'écriture unique, §6 du contrat).
  publie: [
    'microfinance.client.changed@1', // état complet : identité du cœur et `lueLe`, `creePar`, `valideePar`, `cleOrigineCoeur` ; fait du domaine `microfinance.clients`
    'microfinance.client.converti@1', // prospect converti : consommé par `coeur-sfd` (objet « Création de client », annexe C)
    'microfinance.kyc.changed@1', // état NEUTRE : niveau, statut, `valideJusquau`, expiration (AD-22) ; jamais un motif
    'microfinance.groupe.changed@1', // composition, rôles, caution mutuelle ; cohésion lue de l'IA commune
    'microfinance.consentement.changed@1', // consentement par finalité, dont « IA commune » (AD-14 : seul état du consentement en vigueur)
    'microfinance.client.bloque@1', // code neutre `BLOCAGE_CONFORMITE`, sans motif, sans liste, sans score (AD-9, AD-22)
    'microfinance.client.debloque@1', // idem
    'microfinance.revue.echue@1', // revue KYC échue (renforcé 12, standard 24, simplifié 36 mois)
    // [proposition, C13 / journal d'instance, comme les autres manifestes] Fait de journal d'instance
    // (changements de niveau de KYC, conversions, exports, effacement) ; il ne porte JAMAIS un acte de la LBC/FT
    // (AD-22) : ceux-là restent dans la collection cloisonnée de conformité.
    'instance.journal@1',
    'microfinance.realite.constatee@1', // [AD-14, spine IA] client en défaut ou non à l'horizon ; compte épargne devenu dormant ou non ; évolution de l'encours d'épargne (issue : DEFAUT, SANS_DEFAUT, DORMANT, ACTIF) ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'coeur-sfd.client.changed@1', // identité du cœur : nom, date de naissance, pièce, statut (AD-2, ligne 134)
    // [À CONFIRMER] `coeur-sfd.epargne.changed@1` porte le compte ET ses mouvements ; l'annexe A.3 C5 écrit
    // aussi `coeur-sfd.mouvement.recu@1`, que le catalogue AD-9 décrit comme « paiements, pénalités,
    // décaissements exécutés » sans les mouvements d'épargne.
    'coeur-sfd.epargne.changed@1', // comptes d'épargne et soldes lus (FR-130)
    'coeur-sfd.mouvement.recu@1', // mouvements lus du cœur (annexe A.3 C5)
    // [ajouts au C5 de l'annexe, justifiés par l'annexe C et AD-9] Réponses du cœur aux deux demandes que ce
    // module déclenche : sans elles, `cleOrigineCoeur` ne s'écrit jamais (AD-2, ligne 134).
    'coeur-sfd.client.cree@1', // objet « Création de client » : identifiant du cœur renvoyé, ou refus avec motif
    'coeur-sfd.compte-epargne.ouvert@1', // objet « Ouverture de compte d'épargne » : identifiant du compte renvoyé
    'credit.dossier.changed@1', // dossiers, cautions, partie liée
    'collecte.collecte.changed@1', // états et lignes de collecte
    'reseau.portee.changed@1', // état absolu, clé (organisationId, userId) ; filtre chaque lecture au serveur (AD-16)
    // [ajouts, AD-30 et spine du moteur] Horloge pilotée de l'espace d'essai (revues échues, expirations) et
    // propriétaire des domaines d'échange.
    'essai.horloge.changed@1',
    'connecteurs.domaine.changed@1', // propriétaire du domaine `microfinance.clients` (spine de Connecteurs, AD-3)
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  // C10 (annexe A.3) : `profiles: ["microfinance"]` ; socle + `reseau`. Au compose, le service démarre dès qu'un
  // de ses sept modules est activé (AD-3).
  profilCompose: 'microfinance',

  // C13, point 1 : prérequis chiffrés, vérifiés pendant l'installation.
  // [proposition] Les deux codes de prérequis sont de ce fichier ; le texte vient de l'annexe A.3 C13
  // (« `reseau` en service ; au moins une liste de sanctions chargée »).
  prerequis: [
    {
      code: 'reseau-en-service',
      description: 'Le module `reseau` est installé et en service pour l\'organisation',
      action: 'Installer `reseau`, puis relancer la vérification.',
    },
    {
      code: 'liste-sanctions-chargee',
      description: 'Au moins une liste de sanctions est chargée (fichier, source déclarée ou miroir de Money Vibes, AD-22)',
      action:
        "Déclarer une source de liste (ou déposer un fichier) ; sans liste, le filtrage de sanctions ne peut pas protéger les décaissements.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  // Les cinq codes et leurs critères sont ceux de l'annexe A.3 C13. [proposition] Là où l'annexe ne donne pas la
  // couleur de l'autre cas, elle est posée ici (🟠 entre les deux seuils de `listes-a-jour`, 🔴 sinon pour
  // `kyc-par-niveau` et `consentements-lus`, 🟢 sinon pour `identifiant-coeur`) ; [proposition] le code
  // `identifiant-coeur` est écrit sans la ligature de l'annexe (`identifiant-cœur`), pour la route.
  verifications: [
    {
      code: 'listes-a-jour',
      route: 'POST /api/v1/instance/microfinance/{organisationId}/verifications/listes-a-jour',
      critere:
        "Chaque liste de sanctions plus récente que sa fréquence de rafraîchissement (quotidienne par défaut) : 🟢 ; une liste plus vieille que sa fréquence sans dépasser 3 fois celle-ci : 🟠 ; une liste de plus de 3 fois sa fréquence : 🔴 avec la liste en cause (annexe A.3 C13, FR-121).",
    },
    {
      code: 'kyc-par-niveau',
      route: 'POST /api/v1/instance/microfinance/{organisationId}/verifications/kyc-par-niveau',
      critere:
        "Chaque niveau de KYC (renforcé, standard, simplifié) a ses pièces définies : 100 % 🟢 ; ≥ 1 niveau sans pièce définie 🔴 avec le niveau (annexe A.3 C13, FR-119).",
    },
    {
      code: 'consentements-lus',
      route: 'POST /api/v1/instance/microfinance/{organisationId}/verifications/consentements-lus',
      critere:
        "Sur le jeu de contrôle, un client sans consentement « IA commune » n'est dans aucun écart renvoyé pour l'apprentissage : 🟢 ; sinon 🔴 avec le nombre de clients en cause (annexe A.3 C13, FR-132, AD-14).",
    },
    {
      code: 'identifiant-coeur',
      route: 'POST /api/v1/instance/microfinance/{organisationId}/verifications/identifiant-coeur',
      critere:
        "Toute fiche liée a son identifiant du cœur : 100 % 🟢 ; ≥ 1 fiche liée sans identifiant 🟠 avec leur nombre (annexe A.3 C13, FR-116). Sans `coeur-sfd` : « non installé ».",
    },
    {
      code: 'variables-du-score',
      route: 'POST /api/v1/instance/microfinance/{organisationId}/verifications/variables-du-score',
      critere:
        "Sur le jeu de contrôle, aucun facteur du score n'est le genre, la situation matrimoniale, la nationalité ou la religion : 🟢 ; sinon 🔴 avec le facteur en cause (annexe A.3 C13, FR-124, AD-14 : liste fermée de variables).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.3 C9). Désinstaller ne supprime rien :
  // fiches, pièces, consentements et journal restent stockés et masqués ; la piste d'audit se conserve au moins
  // 10 ans (J-11).
  avertissementDesinstallation:
    'Les fiches clients ne seront plus consultables ni vérifiables ; les dossiers en cours restent.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive (la nomenclature des
  // secteurs évolue par correspondance d'anciens codes, FR-117) ; un champ de fiche ajouté est lu comme inconnu
  // par la version précédente.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/microfinance/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [
    'filtrage-sanctions', // allumé ; JAMAIS éteint en production (FR-121)
    'analyse-etendue', // analyse étendue micro et macro de la fiche (FR-127)
    'signaux-faibles', // signaux faibles du client (FR-126)
  ],

  // C2, C13 point 5. Annexe A.3 C13 : « consultation des fiches, export ». [proposition] Les chemins sont de ce
  // fichier (l'annexe ne les nomme pas), figés par l'épic EPIC-181. Aucune route de sanctions, de
  // correspondance, de procédure confirmée ni d'alerte CENTIF n'y figure (AD-22). Toute écriture rendrait 403
  // `ABONNEMENT_EXPIRE` ; cet état ne s'applique pas à cette IMF (licence à vie), la capacité reste déclarée.
  routesLectureSeule: [
    'GET /api/v1/instance/microfinance/{organisationId}/export',
    'GET /api/v1/organisations/{organisationId}/clients',
    'GET /api/v1/organisations/{organisationId}/clients/{clientId}', // fiche : identité du cœur datée, KYC en état neutre
    'GET /api/v1/organisations/{organisationId}/groupes',
    'GET /api/v1/organisations/{organisationId}/groupes/{groupeId}',
    'GET /api/v1/organisations/{organisationId}/comptes-epargne', // épargne LUE du cœur, avec « à jour au » (FR-130)
    'GET /api/v1/organisations/{organisationId}/equite', // AUD et RSQ
    'GET /api/v1/organisations/{organisationId}/journal-acces', // AUD seul
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/microfinance/v1/… devant). L'effacement
  // respecte la conservation légale (piste d'audit, 10 ans).
  routesInstance: {
    export: 'GET /api/v1/instance/microfinance/{organisationId}/export',
    import: 'POST /api/v1/instance/microfinance/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/microfinance/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/microfinance/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2). Schémas dans
  // prospera-plateforme/contrats/objets/microfinance/, écrits avec EPIC-181 et EPIC-197.
  // [À CONFIRMER avec le PRD Reprise, M44] Les trois objets de l'annexe A.3 C13. ⚠️ Chevauchement avec la
  // spine : AD-2 (ligne 133) donne à `coeur-sfd` l'objet de reprise `client` (identité, identifiant du cœur) ;
  // `microfinance.client@1` ne doit alors porter que ce que Prospera ajoute (activité, secteur, photos,
  // position), sans quoi deux modules reprennent la même personne. `groupe` et `kyc` n'ont pas d'équivalent
  // chez `coeur-sfd`. L'ordre de livraison (FR-198) : `reseau`, puis les objets du cœur, puis ceux-ci.
  objetsDeReprise: ['microfinance.client@1', 'microfinance.groupe@1', 'microfinance.kyc@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2). L'annexe A.3 C13 déclare deux domaines,
  // `clients` et `comptes-epargne`, « propriétaire : le cœur pour l'identité légale, les comptes et les soldes ;
  // Prospera pour l'activité, les photos, la position, le KYC et les groupes ». [proposition] Le code de chaque
  // domaine, la sorte, le niveau et la clé de libellé sont de ce fichier (l'annexe les laisse libres) :
  // - `microfinance.clients` : la part de Prospera (fiche enrichie, KYC en état neutre, groupes) ; niveau
  //   `HEURE` comme l'objet « Client » de l'annexe C ; ni argent ni valeur de contrôle à ce stade ;
  // - `microfinance.comptes-epargne` : LECTURE (jamais comparée, AD-13 de Connecteurs) : le cœur tient les
  //   comptes et les soldes, Prospera ne fait que les lire (FR-130). [À CONFIRMER] Les règles du catalogue
  //   veulent `objets` ⊆ schémas de ce module : l'objet `microfinance.compte-epargne@1` est un schéma de LECTURE
  //   proposé ici ; si le catalogue refuse, le domaine se déclare chez `coeur-sfd` (domaine
  //   `coeur-sfd.epargne`) et celui-ci disparaît d'ici. Un seul point d'écriture par domaine (§6 du contrat).
  domainesEchange: [
    {
      code: 'microfinance.clients',
      objets: ['microfinance.client@1'],
      sorte: 'OBJET_DATE',
      argent: false,
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'microfinance.echange.clients',
      publie: ['microfinance.client.changed@1'],
    },
    {
      code: 'microfinance.comptes-epargne',
      objets: ['microfinance.compte-epargne@1'],
      sorte: 'LECTURE', // jamais comparée
      argent: true,
      controle: false,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'microfinance.echange.comptes-epargne',
      publie: [], // le cœur est propriétaire : Prospera lit et ne pousse rien
    },
  ],

  // C11 (annexe A.3 C11, FR-124 à FR-128 et FR-131 dont la cohésion du groupe, FR-126) : le moteur est l'IA
  // COMMUNE, en instance locale chez l'IMF ; le module n'embarque aucun modèle et n'appelle aucun modèle
  // lui-même : il demande une Proposition par le port `PropositionPort` (AD-14). Chaque prédiction et chaque
  // correction humaine est journalisée localement (C11, point 2) ; la calibration locale est une donnée du
  // client qu'une mise à jour n'écrase jamais.
  // - Le score est une INFORMATION et une ALERTE, jamais un refus ni un prix ; ses variables sont une liste
  //   fermée et versionnée (genre, situation matrimoniale, nationalité et religion n'y entrent jamais ;
  //   vérification `variables-du-score`).
  // - Seuls des écarts anonymisés repartent pour l'apprentissage, SOUS le consentement « IA commune » (FR-132) :
  //   retirer le consentement arrête ce renvoi, pas le score local. Les groupes de moins de 5 sont retirés.
  // - Provenance affichée (règle ou modèle, version, date) ; l'IA propose, l'humain décide ; absente, rien ne
  //   bloque (AD-14).
  ia: {
    capacites: [
      'microfinance/score-client@1',
      'microfinance/probabilite-defaut@1',
      'microfinance/signaux-faibles-client@1',
      'microfinance/analyse-sectorielle-micro-macro@1',
      'microfinance/couverture-zones-prospection@1',
      'microfinance/comptes-dormants@1',
      'microfinance/recommandation-epargne@1',
      'microfinance/fidelite-epargne@1',
      'microfinance/prevision-encours-epargne@1',
      'microfinance/segmentation-epargnants@1',
      'microfinance/cohesion-groupe@1',
    ],
    finalites: [
      'evaluation-du-risque-client',
      'alerte-precoce',
      'analyse-du-secteur',
      'suggestion-de-zones',
      'animation-de-l-epargne',
      'prevision-de-l-epargne',
      'alerte-de-cohesion',
    ],
  },
} as const;
