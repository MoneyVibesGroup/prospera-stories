// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M07 — GED, numérisation et archives (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : PRD assurance (prds/prd-assurance-2026-11-13/prd.md), annexe A.2, treize clauses C1 → C13 ; spine assurance
// (architecture/architecture-assurance-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE sur l'annexe A quand les deux
// divergent (AD-16). Le propriétaire du dépôt `document-service` copie ce fichier dans `src/modules/ged/module.manifest.ts`
// la semaine où il y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD assurance §6.2 (FR-159 → FR-176), FR-250, FR-263, annexe B, annexe D.3 ; spine AD-2 (propriétaire des
//              pièces et de leurs fichiers), AD-3 (module ajouté à `document-service`), AD-8 (santé), AD-9 (pièces, OCR,
//              archives), AD-14 (reprise), AD-16, AD-17, AD-20, AD-23, AD-25 ; épics EPIC-201 → EPIC-221 ;
//              manifestes-a-produire.md, ligne M07 (verticales : microfinance, assurance [À CONFIRMER]).
//
// Service porteur : `document-service` (qui EST `prospera-ocr-service`), module `ged` AJOUTÉ (spine AD-3) ; il lève le
// [À CONFIRMER] de l'annexe A.2 C1. `document-service` reste un relying party (RS256/JWKS) ; `ged` est seul écrivain de
// son propre bucket, jamais de `kyc-documents`. Les services existants migrent d'abord (Node 24, client Kafka Confluent,
// BullMQ 6) par une tâche d'épic qui PRÉCÈDE la mise en service du module ; le code existant ne s'abonne à aucun fait
// d'AD-16. Bundle : offre unique assurance (phase 1 GED/OCR) ; microfinance (pièces KYC) [À CONFIRMER]. Propriétaire
// du manifeste : Dev B.
//
// Écarts relevés entre l'annexe A.2 du PRD et la spine (la spine gagne) :
// - C5, consomme : `expertises.rapport.depose@1` RETIRÉ (le fichier du rapport est une pièce de `ged` ; `expertises`
//   le DÉPOSE par la route de `ged` et ne garde que `pieceId` et `versionPiece`, AD-2) ; `liaison-assureur.document.recu@1`
//   RETIRÉ (`liaison-assureur` remet les documents du LC au POINT D'IMPORT de `ged`, clé d'origine, AD-9) ;
//   `reprise.historique.livre@1` et `notification.envoi.delivre@1` RETIRÉS (hors de la liste fermée de `ged`, AD-16) ;
//   AJOUTÉS : `sinistres.acces-sante.accorde@1` et `.retire@1` (table locale de lecture de l'accès par dossier, AD-26).
// - C12, `format-archive-pdfa` : conservé [À CONFIRMER, FR-176] ; le stockage est un port objet à l'API S3, MinIO
//   pendant le développement, remplacé avant la mise en service sans toucher au code (AD-9) : aucun appel propre à MinIO
//   hors de l'adaptateur, test de contrat S3 en CI.
// - C7, la spine nomme la capacité `sante:lire` (AD-8) : portée par `ged:sante:consulter`.
// - C13, `objetsDeReprise` : la spine (AD-14) nomme trois objets, `piece`, `numero-archivage` et `cote` ; le manifeste
//   garde les deux schémas de l'annexe, `ged.piece@1` et `ged.archive@1`, et `ged.archive@1` porte le numéro d'archivage
//   d'origine ET la cote (fiche d'archive). À confirmer avec le schéma d'objet de la Reprise.
// - C13, `domainesEchange: ['ged.documents-sinistres']` (annexe) : le point d'échange unique de ce domaine est
//   `liaison-assureur` (A.5, contrat §6 : un propriétaire) ; `ged` déclare `[]`.
//
// Hors manifeste, pour mémoire :
// - Gate : `GED_NOT_ENTITLED` (403 sans donnée, C2). Aucune dépendance dure.
// - Cloisonnement (C2, AD-26) : par `organisationId` et par portée du dossier auquel la pièce appartient. Données de
//   santé : nature portée par la pièce, chiffrées par l'application avant écriture, accès par capacité appliqué à chaque
//   lecture et journalisé (AD-8, AD-23) ; `ACC` reçoit sans lire une pièce médicale ; `NUM` ne voit que type et
//   existence ; `ARCH` voit la seule image ; `EXPE` ne voit que la liste de pièces choisie pour sa mission ; `ADMIN` ne
//   lit aucune pièce. AUCUN bouton ni route « supprimer » pour aucun rôle (FR-175).
// - Données possédées (C3, AD-2) : pièces et leurs fichiers (immuables, versions, empreinte SHA-256), texte lu (classé),
//   lots de numérisation, contrôles avant archivage, file « à rattacher », numéros d'archivage `ARC-AAAA-CCCC-NNNNN`
//   (jamais réutilisés), bordereaux de versement, scellements, cotes, état du papier, sorties et restitutions,
//   reconstitutions, durées de conservation par nature, bordereaux de destruction, journal des lectures de pièces.
//   Lues seulement : dossiers et statuts (`sinistres`), clés de rattachement (`reprise`).
// - Paramètres (C6) : annexe D.3 ; la durée de conservation est un plancher réglementaire de 10 ans (art. 404, D.5).
// - Écrans (C8) : module d'écran `ged` dans `prospera-app`, `src/modules/ged/`, tous les écrans par Dev B. `/ged`,
//   `/ged/lots`, `/ged/a-rattacher`, `/ged/fonds`, `/ged/fonds/[arc]`, `/ged/chemises`, `/ged/reconstitution`,
//   `/ged/destruction`, `/ged/parametres`. L'écran d'une pièce s'affiche aussi dans le dossier (`sinistres`). Entrées de
//   menu par droit (`ged:piece:recevoir`, `ged:lot:numeriser`, `ged:fonds:verser`). Aucune dictée ; boutons non
//   branchés : « bientôt » (FR-22).
// - OCR : Tesseract 5.x derrière le port `OcrProvider` existant, hors ligne (`tesseract.js`, données `fra` locales) ;
//   une page à moins de 60 caractères de couche texte est rastérisée avant l'OCR ; PARTIEL et ECHEC vont dans « à
//   refaire » ; l'OCR n'est PAS de l'IA. `AntivirusPort` : outil indisponible = « à scanner », jamais « sain ».
// - Sorties : aucune destination sortante propre ; aucun fichier ne sort du site (NAS de la compagnie, FR-176).
// - Désinstaller ne supprime rien : pièces, versions, lots, empreintes, numéros d'archivage, cotes et bordereaux restent
//   sur le NAS, masqués ; la SUITE des numéros d'archivage est conservée (réinstaller reprend sans trou ni doublon).

export const MANIFESTE_GED = {
  code: 'ged',
  // 1.1.0 (2026-11-24, STORY-1087) : la GED s'ouvre au cabinet comptable (fonds d'archives d'un dossier client, plan
  // de classement OHADA, droits du cabinet) ; les routes de lecture deviennent les routes réelles.
  // 1.2.0 (2026-11-24, STORY-1088) : l'original papier (réceptions, boîtes, cotes, sorties, récolement, restitution)
  // et la recherche dans un fonds.
  // 1.3.0 (2026-11-24, STORY-1100) : la mémoire de classement du cabinet (suggestion, consultation, oubli) et les
  // factures comptabilisées rangées au fonds du client (`comptabilite.facture.inscrite`).
  // 1.4.0 (2026-11-25, STORY-1119) : les archives du cabinet ont valeur de preuve (journal d'intégrité chaîné, contrôle
  // périodique des empreintes, attestation de numérisation et certificat d'intégrité) ; sept routes de lecture neuves.
  // 1.5.0 (2026-11-25, STORY-1120) : fin de mission et réversibilité (fermeture du fonds, avec le dossier client archivé
  // par `dossier.updated` ; export complet en volumes ; bordereau de restitution et son exemplaire signé) ; quatre routes
  // de lecture neuves.
  // 1.6.0 (2026-11-26, STORY-1121) : la destruction proposée, puis visée (pièces échues, gel en litige ou en contrôle,
  // proposition, visa de l'associé, accord du client, exécution, procès-verbal et registre) ; six routes de lecture
  // neuves ; `ged:destruction:proposer` et `ged:destruction:viser` (déjà déclarés) attribués au cabinet par auth.
  // 1.7.0 (2026-11-26, STORY-1122) : retrouver dans tous les fonds du cabinet (un index aveugle à jetons, sans mot en
  // clair) ; une route de lecture neuve.
  // 1.8.0 (2026-11-26, STORY-1123) : les alertes de l'archiviste (retour d'un original en retard, échéance de
  // conservation proche, quota dépassé, écart d'intégrité) et les étapes d'une destruction, publiées ; cinq faits neufs ;
  // la liste des pièces échues de tout le cabinet (une route de lecture neuve).
  // 1.9.0 (2026-11-26, STORY-1124) : le circuit sans trou (réception et boîtes dans une transaction, mouvements d'une
  // boîte verrouillés) ; la facture désinscrite de la comptabilité retirée du fonds (`comptabilite.facture.desinscrite`,
  // proposé à C) ; aucune route neuve.
  version: '1.9.0',

  // C1 : aucune dépendance dure. La GED reçoit, lit, classe, conserve et retrouve des pièces sans autre module ; une pièce
  // enregistrée sans dossier va dans la file « à rattacher » (FR-159, FR-166).
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par entrée.
  // - sinistres : pièces reçues et rangées mais rattachées à aucun dossier (file « à rattacher ») ; pièces attendues
  //   `{ etat: NON_INSTALLE, module: sinistres }` ;
  // - reprise : pas de pièce historique, numéros d'archivage attribués par la GED seule ;
  // - expertises : aucune liste de pièces transmises ; assurance : pas de rattachement par police ;
  // - liaison-assureur : aucun document du LC remis au point d'import ;
  // - notification : alertes en cloche interne seule ; reseau : un seul poste de numérisation, pas de guichet ;
  // - IA commune : lecture et classement des pièces `NON_DISPONIBLE`, classement manuel, l'OCR continue (FR-164).
  enrichiPar: ['sinistres', 'expertises', 'assurance', 'liaison-assureur', 'reprise', 'notification', 'reseau'],

  // Aucun numéro de compte ici : la GED ne passe aucune écriture.
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.2). Chaque droit demande une PR `auth-service`.
  // AUCUN droit « supprimer » n'existe dans le catalogue (FR-175).
  droits: [
    'ged:piece:recevoir', // ACC, NUM
    'ged:piece:consulter',
    'ged:piece:controler', // NUM, agent récepteur : contrôle humain AVANT tout archivage (FR-165)
    'ged:piece:rattacher',
    'ged:lot:numeriser', // NUM
    'ged:fonds:verser', // ARCH
    'ged:fonds:sceller', // ARCH
    'ged:fonds:verifier', // ARCH, AUD
    'ged:papier:sortir', // ARCH
    'ged:dossier:reconstituer',
    'ged:destruction:proposer', // ARCH ; au cabinet (STORY-1121) : CAB_ARCHIVISTE, CAB_ASSOCIE
    'ged:destruction:viser', // RESP puis DG : double visa (AD-9) ; au cabinet (STORY-1121) : CAB_ASSOCIE, jamais le proposant
    'ged:sante:consulter', // capacité `sante:lire` (AD-8)
    'ged:parametre:administrer',
    'ged:journal:consulter', // AUD : journal des lectures de pièces (AD-17)
    // STORY-1087 : les droits du cabinet (PRD des services du cabinet, §2.3), lus par GET /moi/droits.
    'ged:fonds:gerer', // ouvrir un fonds d'archives, ajouter une nature (CAB_ASSOCIE, CAB_ARCHIVISTE)
    'ged:piece:indexer', // indexer, contrôler, reprendre une pièce déjà déposée (CAB_ARCHIVISTE)
    'ged:versement:verser', // verser au fonds, sceller, vérifier (CAB_ARCHIVISTE)
    'ged:sensible:consulter', // bulletins, contrats de travail, pièces d'identité, pièces médicales (404 sinon)
    'ged:physique:gerer', // STORY-1088 : réception, cotes, sorties et retours, récolement, restitution
  ],

  // C5 : faits publiés et consommés. Source : catalogue de la spine, AD-16. Aucun fait ne porte de contenu de santé
  // (le texte OCR d'une pièce médicale est une donnée classée de `ged`, jamais un fait, AD-23).
  publie: [
    'ged.piece.recue@1', // « reçue, en contrôle »
    'ged.piece.controlee@1', // « reçue » au sens de l'ouverture du dossier (FR-165)
    'ged.piece.versionnee@1',
    'ged.piece.rattachee@1',
    'ged.piece.a-rattacher@1', // alerte à 3 jours ouvrés
    'ged.lot.changed@1',
    'ged.dossier.verse@1', // numéro d'archivage, bordereau
    'ged.dossier.scelle@1', // support de référence
    'ged.empreinte.echec@1',
    'ged.sortie-archive.changed@1', // alerte à 15 et 30 jours
    'ged.dossier.reconstitue@1',
    'ged.destruction.decidee@1',
    'ged.stockage.alerte@1', // sauvegarde en échec, NAS à 80 %
    // STORY-1123 : les alertes de l'archiviste du cabinet (cloche et e-mail : `notification`). Clés, numéros, comptes, dates
    // et destinataires (identifiants d'utilisateur) seulement ; jamais un contenu de pièce (ni tiers, ni NIF, ni montant,
    // ni texte lu), ni le motif ou l'emprunteur d'une sortie, ni la raison sociale du client.
    'ged.original.retour-en-retard@1', // une sortie non rentrée, à 1, 7 et 30 jours de retard
    'ged.conservation.echeance-proche@1', // les pièces d'un fonds qui entrent dans l'horizon d'échéance (ou déjà échues)
    'ged.quota.depasse@1', // le volume du cabinet passe au-dessus de son quota (une fois par franchissement)
    'ged.integrite.ecart@1', // une campagne de contrôle d'intégrité qui trouve un écart ou un journal rompu
    'ged.destruction.changed@1', // les étapes d'une destruction du cabinet (proposée, visée, refusée, accordée, abandonnée, exécutée)
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] export, effacement refusé
    'ged.realite.constatee@1', // [AD-14, spine IA] classement ou lecture d'une pièce confirmé ou corrigé par la personne au contrôle (issue : CONFIRMEE, CORRIGEE ; `definitive` à la clôture du dossier, valeur retenue en fin de dossier) ; AUCUNE valeur de champ, AUCUN contenu de pièce, JAMAIS de donnée de santé sur le bus ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'sinistres.dossier.changed@1', // statut, clôture : le dossier clos à verser
    'sinistres.dossier.cloture@1',
    'sinistres.dossier.rouvert@1', // sortie de chemise ; ouvre un volume complémentaire `ARC-…/C1` (AD-9)
    'sinistres.acces-sante.accorde@1', // table locale de lecture (AD-26)
    'sinistres.acces-sante.retire@1',
    'reprise.cles-rattachement.publiees@1', // numéro de police, de sinistre, `DEC-`, numéro d'archivage d'origine (FR-215)
    'comptabilite.facture.inscrite', // STORY-1100 : une facture inscrite au brouillard, rangée en copie pré-indexée au fonds du client (si `comptabilite` est installé)
    'comptabilite.facture.desinscrite', // STORY-1124 [proposition, à C] : le brouillard né d'une facture inscrite est abandonné ; la copie jamais versée est retirée du fonds, la copie versée gardée
    'dossier.updated', // STORY-1120 : un dossier client archivé (`statut: ARCHIVE`, état absolu publié par `dossier-service`) ferme ses fonds d'archives ouverts
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  // C10 (annexe A.2) : `profiles: ["ged"]` ; socle seul.
  profilCompose: 'ged',

  // C13, point 1 : prérequis de l'annexe A.2 : le NAS de la compagnie joignable et la sauvegarde configurée.
  // [proposition] Les deux codes de prérequis sont de ce fichier.
  prerequis: [
    {
      code: 'nas-joignable',
      description:
        'Le NAS de la compagnie est joignable par le port de stockage objet à l\'API S3 (données vivantes et sauvegardes sur deux supports distincts, spine AD-25)',
      action: "Rendre le NAS joignable depuis le serveur applicatif, puis relancer la vérification.",
    },
    {
      code: 'sauvegarde-configuree',
      description:
        "La sauvegarde est configurée : le stockage objet est dans le jeu « même instant » que la base (perte maximale 1 h, reprise 4 h) et la clé de chiffrement des pièces est dans la clé de secours remise à la compagnie",
      action: 'Configurer la sauvegarde et remettre la clé de secours, puis relancer la vérification.',
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Les huit codes et leurs
  // critères sont ceux de l'annexe A.2 ; noms de routes proposés (convention commune : `verifications/<code>`).
  verifications: [
    {
      code: 'ocr-lit-un-scan',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/ocr-lit-un-scan',
      critere:
        "Un PDF scanné sans couche texte, déposé sur le jeu de contrôle, est lu, classé et ses champs extraits : 🟢 ; déclaré illisible : 🔴 (FR-163).",
    },
    {
      code: 'versions-intactes',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/versions-intactes',
      critere:
        'Le second scan d\'une pièce crée la version 2 et laisse la version 1 lisible : 🟢 ; sinon 🔴 (FR-161).',
    },
    {
      code: 'archivage-controle',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/archivage-controle',
      critere:
        'Une pièce non contrôlée reste « reçue, en contrôle » et n\'est pas comptée reçue : 🟢 ; sinon 🔴 (FR-165).',
    },
    {
      code: 'numero-archivage-unique',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/numero-archivage-unique',
      critere:
        "Deux versements concurrents ne reçoivent jamais le même numéro et un numéro détruit n'est pas réattribué : 🟢 ; sinon 🔴 (FR-167, AD-6).",
    },
    {
      code: 'empreinte-fiable',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/empreinte-fiable',
      critere:
        "La modification d'une pièce après scellement fait échouer la vérification et lève l'alerte (`ged.empreinte.echec@1`) : 🟢 ; sinon 🔴 (FR-169).",
    },
    {
      code: 'rien-ne-se-supprime',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/rien-ne-se-supprime',
      critere:
        "Aucune route ni aucun écran ne supprime une pièce ou un dossier pour aucun rôle : 🟢 ; sinon 🔴 avec la route (FR-175).",
    },
    {
      code: 'conservation-plancher',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/conservation-plancher',
      critere:
        'Une durée de conservation inférieure à 10 ans est refusée par le formulaire : 🟢 ; sinon 🔴 (FR-174, art. 404).',
    },
    {
      code: 'restauration-testee',
      route: 'POST /api/v1/instance/ged/{organisationId}/verifications/restauration-testee',
      critere:
        'Une pièce déposée se retrouve après la restauration de la sauvegarde la plus récente : 🟢 ; sinon 🔴 (FR-176, AD-25).',
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.2).
  avertissementDesinstallation:
    'Plus aucune pièce ne sera reçue, classée ni archivée ; les dossiers ne pourront plus joindre de pièces ; les pièces déjà conservées restent sur le NAS, sous conservation de dix ans au moins.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. Le format d'une version de pièce,
  // de l'empreinte, du numéro d'archivage et de la cote ne change jamais dans la fenêtre de sept jours ; l'image d'origine
  // n'est jamais modifiée par une migration. L'image de `document-service` est unique : son `retourArriere` est le plus
  // restrictif de ses modules (spine AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/ged/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `horodatage-qualifie` : option du scellement, à valider par le juriste (D21). Comportement seulement.
  interrupteurs: ['lecture-ia-des-pieces', 'horodatage-qualifie', 'format-archive-pdfa'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (consultation, export). 1.1.0 (STORY-1087) : les routes RÉELLES
  // du service, à la place des propositions de la 1.0.0 (qui n'existaient pas), et celles du cabinet.
  routesLectureSeule: [
    'GET /api/v1/ged/a-rattacher',
    'GET /api/v1/ged/a-refaire',
    'GET /api/v1/ged/pieces/{pieceId}', // la capacité santé s'applique (AD-8)
    'GET /api/v1/ged/pieces/{pieceId}/versions/{version}/lecture',
    'GET /api/v1/ged/pieces/{pieceId}/versions/{version}/contenu',
    'GET /api/v1/ged/lots/{lotId}',
    'GET /api/v1/ged/fonds/{numero}',
    'GET /api/v1/ged/cabinet/natures', // STORY-1087 : le plan de classement servi
    'GET /api/v1/ged/cabinet/dossiers/{dossierId}/fonds', // STORY-1087 : les fonds d'un dossier client
    'GET /api/v1/ged/cabinet/fonds/{numero}', // STORY-1087
    'GET /api/v1/ged/cabinet/fonds/{numero}/pieces', // STORY-1087 : par rubrique et par exercice
    'GET /api/v1/ged/cabinet/fonds/{numero}/pieces-du-dossier', // STORY-1087 : déjà déposées, par référence
    'GET /api/v1/ged/cabinet/pieces/{pieceId}', // STORY-1087 : natures sensibles en 404 sans le droit
    'GET /api/v1/ged/cabinet/pieces/{pieceId}/versions/{version}/contenu', // STORY-1087
    'GET /api/v1/ged/cabinet/pieces/{pieceId}/versions/{version}/lecture', // STORY-1087
    'GET /api/v1/ged/cabinet/lots/{lotId}', // STORY-1087
    'GET /api/v1/ged/cabinet/quota', // STORY-1087 : le volume stocké et le quota de l'offre
    'GET /api/v1/ged/cabinet/fonds/{numero}/receptions', // STORY-1088 : les réceptions d'archives
    'GET /api/v1/ged/cabinet/receptions/{numero}', // STORY-1088
    'GET /api/v1/ged/cabinet/receptions/{numero}/bordereau', // STORY-1088 : le bordereau de réception (PDF)
    'GET /api/v1/ged/cabinet/fonds/{numero}/boites', // STORY-1088 : les boîtes, leur cote et leur présence
    'GET /api/v1/ged/cabinet/boites/{boiteId}', // STORY-1088
    'GET /api/v1/ged/cabinet/boites/{boiteId}/etiquette', // STORY-1088 : l'étiquette à code QR (PDF)
    'GET /api/v1/ged/cabinet/sorties', // STORY-1088 : les sorties en cours, et en retard
    'GET /api/v1/ged/cabinet/fonds/{numero}/recolements', // STORY-1088
    'GET /api/v1/ged/cabinet/fonds/{numero}/restitutions', // STORY-1088
    'GET /api/v1/ged/cabinet/restitutions/{numero}/bordereau', // STORY-1088 : le bordereau de restitution (PDF)
    'GET /api/v1/ged/cabinet/fonds/{numero}/recherche', // STORY-1088 : retrouver une pièce
    'GET /api/v1/ged/cabinet/pieces/{pieceId}/suggestion', // STORY-1100 : le classement que le cabinet a déjà choisi
    'GET /api/v1/ged/cabinet/fonds/{numero}/memoire-de-classement', // STORY-1100
    'GET /api/v1/ged/cabinet/memoire-de-classement', // STORY-1100 : la mémoire du cabinet, et le journal des oublis
    'GET /api/v1/ged/cabinet/journal-integrite', // STORY-1119 : le journal d'intégrité chaîné du cabinet
    'GET /api/v1/ged/cabinet/journal-integrite/verification', // STORY-1119 : la chaîne recalculée
    'GET /api/v1/ged/cabinet/controles-integrite', // STORY-1119 : les campagnes de contrôle des empreintes
    'GET /api/v1/ged/cabinet/controles-integrite/{campagneId}', // STORY-1119 : fonds par fonds, écarts nommés
    'GET /api/v1/ged/cabinet/fonds/{numero}/controles-integrite', // STORY-1119
    'GET /api/v1/ged/cabinet/fonds/{numero}/documents-probants', // STORY-1119 : attestations et certificats émis
    'GET /api/v1/ged/cabinet/documents-probants/{numero}/pdf', // STORY-1119 : retéléchargé à l'identique (NFR-4)
    'GET /api/v1/ged/cabinet/fonds/{numero}/exports', // STORY-1120 : les exports de réversibilité d'un fonds
    'GET /api/v1/ged/cabinet/exports/{numero}', // STORY-1120 : un export, ses volumes et leurs empreintes
    'GET /api/v1/ged/cabinet/exports/{numero}/volumes/{rang}', // STORY-1120 : un volume ZIP, retéléchargé à l'octet
    'GET /api/v1/ged/cabinet/documents-probants/{numero}/exemplaire-signe', // STORY-1120 : le bordereau de restitution signé
    'GET /api/v1/ged/cabinet/fonds/{numero}/pieces-echues', // STORY-1121 : les pièces dont la conservation est échue, par pages
    'GET /api/v1/ged/cabinet/fonds/{numero}/gels', // STORY-1121 : les gels (litige, contrôle) d'un fonds
    'GET /api/v1/ged/cabinet/fonds/{numero}/destructions', // STORY-1121 : les propositions de destruction d'un fonds
    'GET /api/v1/ged/cabinet/destructions/{numero}', // STORY-1121 : une destruction, son visa, l'accord, son procès-verbal
    'GET /api/v1/ged/cabinet/destructions/{numero}/pieces', // STORY-1121 : ses pièces, par pages
    'GET /api/v1/ged/cabinet/registre-des-destructions', // STORY-1121 : le registre des destructions du cabinet
    'GET /api/v1/ged/cabinet/recherche', // STORY-1122 : retrouver une pièce dans tous les fonds du cabinet
    'GET /api/v1/ged/cabinet/pieces-echues', // STORY-1123 : les pièces échues (ou proches de l'être) de tout le cabinet
    'GET /api/v1/instance/ged/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/ged/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/ged/{organisationId}/export',
    import: 'POST /api/v1/instance/ged/{organisationId}/import', // sa part du dossier d'installation ; point d'import de la Reprise et des documents du LC (clé d'origine)
    effacement: 'POST /api/v1/instance/ged/{organisationId}/effacement', // tracé, avec certificat ; refusé avec un code nommé sous conservation (AD-9)
    sante: 'GET /api/v1/instance/ged/{organisationId}/sante', // consommateurs de file (Kafka, BullMQ, OCR) supervisés (AD-25)
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : les pièces (fichier et métadonnées : assuré, police, sinistre,
  // date, type) et les fiches d'archive (numéro d'archivage d'origine conservé, cote physique, chemise, état du papier) ;
  // le papier historique n'est PAS numérisé pour la reprise (FR-172). Valeur de contrôle : pièces rattachées (FR-218).
  objetsDeReprise: ['ged.piece@1', 'ged.archive@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : vide ici ; voir les écarts en en-tête.
  domainesEchange: [],

  // C11 : capacité du FR-164 (type, champs lus avec leur extrait source, rattachement proposé, confiance), servie par
  // l'IA commune en instance locale, par le port `PropositionPort` (AD-10). L'OCR (FR-163) n'est PAS de l'IA et tourne
  // sur le serveur de la compagnie. Destinataire : ACC, NUM, GEST. Garde-fous : l'IA propose, la personne confirme au
  // contrôle avant archivage ; elle ne rejette aucune pièce ; sous le seuil bas (0,60) rien n'est pré-sélectionné ; un
  // champ sans extrait n'est pas proposé ; niveau `EXTRACTION` ; une pièce médicale est lue dans l'instance, jamais
  // affichée à `ACC`, et rien n'en sort (AD-8). Le contrôle de cohérence des pièces est déclaré par `sinistres`.
  // Amendé le 2026-11-14 : l'ancien `modeles` devient la capacité `assurance/lecture-classement-pieces@1` (AD-47) ; la lecture des
  // pièces KYC de la microfinance reste [À CONFIRMER] : aucune capacité `microfinance/…` n'est déclarée ici.
  ia: {
    capacites: [
      'assurance/lecture-classement-pieces@1',
    ],
    finalites: ['lecture-pieces'],
  },
} as const;
