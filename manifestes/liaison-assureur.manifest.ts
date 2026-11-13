// Manifeste M48 [proposition] — Échange avec le logiciel de la compagnie, `liaison-assureur` (format du contrat de module,
// clause C1, amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : PRD assurance (prds/prd-assurance-2026-11-13/prd.md), annexe A.5 et annexe C (contrat d'échange C-1 → C-19, sans
// nom de logiciel), treize clauses C1 → C13 ; spine assurance (architecture/architecture-assurance-2026-11-13/
// ARCHITECTURE-SPINE.md), qui GAGNE sur l'annexe A quand les deux divergent (AD-16).
// Le propriétaire du dépôt `prospera-liaison-assureur-service` copie ce fichier dans `src/module.manifest.ts` la semaine où il
// y travaille ; une garde de test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD assurance §6.5 (FR-194 → FR-205, FR-245) ; spine AD-1 (projections datées, fraîcheur calculée ICI seul),
//              AD-2 (seul écrivain des projections brutes, du numéro officiel et de la voie), AD-6 (numéro officiel, préfixe
//              `PRO-`), AD-9 (documents remis au point d'import de `ged`), AD-13 (un port `TransportLC`, deux transports,
//              Prospera tire), AD-14 (reprise), AD-16, AD-17, AD-19, AD-20, AD-21, AD-22, AD-25 ; épics EPIC-201 → EPIC-221 ;
//              manifestes-a-produire.md, ligne M48 [proposition].
//
// Service porteur : `prospera-liaison-assureur-service` (module `liaison-assureur`, spine AD-3) ; il lève le [À CONFIRMER, D18]
// de l'annexe A.5 C1. Bundle : offre unique assurance. Propriétaire du manifeste : Dev B. AUCUN nom de logiciel (FR-194).
//
// ⚠️ CODE À TIRET : `liaison-assureur` a un tiret ; ses droits ne passent le format `^[a-z]+:[a-z-]+:[a-z]+$` que depuis
// l'élargissement du format de droits d'`auth-service` (amendement C7 du 2026-11-11, spine AD-21). Tant qu'il n'est pas fait,
// les droits sont DÉCLARÉS et NON ATTRIBUABLES.
//
// Écarts relevés entre l'annexe A.5 du PRD et la spine (la spine gagne) :
// - C3 et C5, numéro officiel : la spine (AD-6) fait de `liaison-assureur` le SEUL écrivain du numéro officiel et de la voie
//   (`AUTO | SAISIE_MANUELLE | REPRISE`, exclusives) et le SEUL générateur du préfixe `PRO-` ; le format des numéros attribués
//   par Prospera est `PRO-SIN-AAAA-NNNN` (compteur propre, `epoque`), alors que l'annexe A.5 C6 écrit `SIN-AAAA-NNNN`.
//   `attributeur = LC | PROSPERA` est un paramètre d'ICI ; sans ce module, `sinistres` force `PROSPERA` (`LIAISON_REQUISE`).
//   Contrôle d'unicité contre les numéros du LC au basculement, refusé en cas de conflit.
// - C13, `objetsDeReprise: []` (annexe) : CONTREDIT par la spine (AD-14 : « numéros officiels → `liaison-assureur` » par son point
//   d'import, voie `REPRISE`, sans écart). Le manifeste déclare donc `liaison-assureur.numero-officiel@1` [proposition de nom].
//   Conséquences à reporter : (1) l'annexe A.7 C1 (« `liaison-assureur` n'en fait pas partie ») et la remarque de la ligne M48
//   de manifestes-a-produire.md (« ne possède aucun objet métier ») sont à corriger ; (2) `enrichiPar` du manifeste `reprise`
//   doit AJOUTER `liaison-assureur` (il contient déjà `assurance`, `sinistres`, `ged`, `expertises`).
// - C5, consomme : l'annexe (`sinistres.reglement.changed@1`, `.recours.encaisse@1`, `.dossier.rouvert@1`, `.sortie.decidee@1`,
//   `assurance.export-comptable.produit@1`, `reprise.feu-vert.changed@1`) est remplacée par la liste fermée de la spine :
//   `sinistres.declaration.enregistree@1`, `.garantie.decidee@1`, `.evaluation.arretee@1`, `.provision.revisee@1`,
//   `.reglement.ordonne@1` (ne part que comme « décision d'indemnité »), `.quittance.changed@1`, `.recours.changed@1`,
//   `.dossier.cloture@1`, `paiement.reglement.changed@1` (un règlement n'est envoyé au LC, C-15, que sur `PAYE` ou `PARTIEL` ;
//   `ECHEC` ou `ANNULE` après un envoi produit le fait inverse) et `assurance.provision.changed@1`.
//   ⚠️ POINT À LEVER : le rejet, le classement sans suite et la réouverture (C-17) n'ont plus de fait source dans la liste
//   fermée (`sinistres.sortie.decidee@1` et `.dossier.rouvert@1` en sont absents) ; à ajouter par une PR qui amende le tableau
//   d'AD-16, ou à lire dans `sinistres.dossier.changed@1`. Le manifeste suit la spine telle qu'elle est écrite.
// - C5, publie : la spine AJOUTE `liaison-assureur.produit.recu@1` (C-4) et `liaison-assureur.ecart.resolu@1`, absents de
//   l'annexe. Un fait reçu du LC qui touche un dossier tenu par Prospera suspend ses ordres (« litige de source »,
//   `sinistres.ordre.suspendu@1`, AD-22).
// - C13, `domainesEchange` : l'annexe déclare `sinistres.dossiers`, `assurance.contrats` et `ged.documents-sinistres` ; ce
//   module est le point d'échange UNIQUE des trois (contrat §6 : un seul point d'écriture par domaine). La sorte `REFERENTIEL`
//   de l'annexe (`assurance.contrats`) n'existe pas au contrat (`MOUVEMENT`, `OBJET_DATE`, `LECTURE`) : `OBJET_DATE` ici
//   (objets datés dont le LC est propriétaire, Prospera en lecture seule, `controle: true` comme l'annexe le demande).
//   Les schémas d'objets (`contrats/objets/liaison-assureur/`) et les valeurs de contrôle sont des propositions à figer avec
//   le kit-cible de Connecteurs [À CONFIRMER]. Connecteurs est hors février : le port `TransportLC` est la couture où se
//   branchera l'adaptateur nommé ; file d'envoi, file des écarts et fraîcheur restent ici (AD-13).
//
// Hors manifeste, pour mémoire :
// - Gate : `LIAISON_ASSUREUR_NOT_ENTITLED` (403 sans donnée, C2). Aucune dépendance dure.
// - Cloisonnement (C2) : par `organisationId`. File des écarts lisible par `RESP`, le `GEST` concerné, `CPT` (écarts de règlement),
//   `AUD` ; configuration du transport par `ADMIN` (sans lire de donnée métier). PROSPERA TIRE ET DÉPOSE : aucun port entrant,
//   aucun webhook entrant (AD-13, FR-197). Aucune écriture sur un contrat du LC, aucun compte technique d'écriture.
// - Données possédées (C3, AD-2) : projections brutes du LC (`valeur`, `lueLe`, `cleOrigineLC`), journal des échanges (lots,
//   fichiers, version du contrat, empreinte), file d'envoi acquittée ordonnée par entité (déclaration, puis évaluation et
//   provision, règlement, recours, clôture ; états `à envoyer | envoyé | accepté | refusé | jamais confirmé après 24 h`), file
//   des écarts (deux valeurs, résolution tracée), liste « à saisir dans le logiciel de la compagnie », fraîcheur par objet et
//   par transport, numéro officiel et voie, table de correspondance des états du LC, répertoire d'échange sur le NAS.
//   `DEC-` est la clé d'idempotence de C-13 ; une déclaration est dans UNE voie à la fois. Les motifs vers le LC sont des
//   motifs codés d'une liste fermée, jamais de texte libre ; AUCUNE donnée de santé n'est envoyée (AD-8).
// - Paramètres (C6) : annexe D.3 ; fraîcheur 5 minutes avec une API, 24 heures avec des fichiers, « périmée » au double (calculée
//   et publiée ICI seul, `liaison-assureur.fraicheur.changed@1`) ; rejeu nocturne avant 6 h ; version du contrat N et N-1
//   acceptées [ASSUMPTION], une autre refuse le lot entier (`VERSION_CONTRAT_INCONNUE`).
// - Écrans (C8) : module d'écran `liaison-assureur` dans `prospera-app`, `src/modules/liaison-assureur/`, tous les écrans par
//   Dev B. `/echange` (état par objet, fraîcheur, transport, bandeau « LC indisponible depuis [heure] »), `/echange/ecarts`,
//   `/echange/a-saisir`, `/echange/envois`, `/echange/parametres`. Entrées de menu : « Échange avec le LC »
//   (`liaison-assureur:echange:consulter`), « Écarts » (`liaison-assureur:ecart:consulter`). Aucun bouton ne promet une
//   intégration à un produit nommé (FR-245) ; boutons non branchés : « bientôt ».
// - Sorties : le LC est LOCAL (spine AD-25) ; aucune destination sortante propre. Le transport par fichiers passe par un
//   répertoire d'échange dédié sur le NAS de la compagnie (entrée en lecture seule, sortie en écriture seule, renommage
//   atomique) ; en essai, le LC fictif dépose et relève dans le répertoire de l'espace d'essai.
// - Supervision (C13, AD-25) : `sante` passe `DEGRADE` sur fraîcheur périmée, file d'envoi bloquée plus de 24 h ou écarts ouverts.
// - Désinstaller ne supprime rien : journal, files d'envoi, écarts et liste « à saisir » restent stockés et masqués ; ce qui est en
//   file reste en file ; le logiciel de la compagnie n'est jamais modifié.

export const MANIFESTE_LIAISON_ASSUREUR = {
  code: 'liaison-assureur',
  version: '1.0.0',

  // C1 : aucune dépendance dure. Le module porte le contrat d'échange générique de l'annexe C et marche sans autre module : file
  // des écarts, liste « à saisir », fraîcheur.
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par entrée.
  // - sinistres : rien à envoyer, les objets reçus se rangent au journal ;
  // - assurance : objets de contrat reçus conservés au journal, lus par personne ;
  // - ged : documents reçus conservés au journal, non rattachés ;
  // - notification : alertes en cloche interne seule ; reprise : pas de sinistre existant livré ;
  // - reseau : nœuds non lus ; dashboard : fraîcheur lue dans l'écran du module ;
  // - connecteurs : le contrat générique suffit (le connecteur nommé est hors février, FR-245) ;
  // - assureur-fictif : essai et démonstration seulement ;
  // - LC absent ou injoignable : tous les objets en `{ etat: PERIME, depuis }` ; Prospera sert la dernière donnée connue, les envois
  //   restent en file et partent dans l'ordre à la reprise, sans perte ;
  // - IA commune absente : sans objet (la détection de doublon probable est une règle).
  enrichiPar: [
    'sinistres',
    'assurance',
    'ged',
    'reprise',
    'notification',
    'reseau',
    'dashboard',
    'connecteurs',
    'assureur-fictif',
  ],

  // Aucun numéro de compte ici : le module ne passe aucune écriture.
  referentielFamilies: [],

  // C7 : droits de tenant (annexe A.5). Le code a un tiret : le format `^[a-z]+:[a-z-]+:[a-z]+$` n'est tenu qu'APRÈS
  // l'élargissement du format de droits d'`auth-service` ; tant qu'il n'est pas fait, ces droits sont déclarés et NON ATTRIBUABLES.
  droits: [
    'liaison-assureur:echange:consulter',
    'liaison-assureur:echange:configurer', // ADMIN : transport, fréquences, répertoire d'échange
    'liaison-assureur:ecart:consulter',
    'liaison-assureur:ecart:resoudre', // RESP, GEST concerné, CPT pour les règlements
    'liaison-assureur:liste-a-saisir:exporter',
    'liaison-assureur:numero:reporter', // l'agent qui saisit dans le LC : clôt la voie `SAISIE_MANUELLE`
  ],

  // C5 : faits publiés et consommés. Source : catalogue de la spine, AD-16 (qui corrige l'annexe A.5, C5). Les faits reçus ne
  // portent que des clés et des identifiants (AD-8, AD-16). Chaque fait d'objet porte l'identifiant stable, l'`organisationId` et
  // un `rang`.
  publie: [
    'liaison-assureur.assure.recu@1',
    'liaison-assureur.police.recue@1',
    'liaison-assureur.garantie.recue@1',
    'liaison-assureur.prime.recue@1',
    'liaison-assureur.intermediaire.recu@1',
    'liaison-assureur.coassurance.recue@1',
    'liaison-assureur.traite.recu@1', // facultatif
    'liaison-assureur.produit.recu@1',
    'liaison-assureur.sinistre-existant.recu@1', // alimente la resynchronisation nocturne de `reprise` (annexe A.7 C5)
    'liaison-assureur.document.recu@1', // métadonnées ; le fichier va au point d'import de `ged`
    'liaison-assureur.numero-sinistre.attribue@1', // `DEC-` et numéro officiel, indicateur de doublon
    'liaison-assureur.envoi.etat@1', // état absolu d'un envoi : accepté, refusé avec code et motif, jamais confirmé
    'liaison-assureur.ecart.ouvert@1',
    'liaison-assureur.ecart.resolu@1',
    'liaison-assureur.fraicheur.changed@1',
    'liaison-assureur.liste-a-saisir.changed@1',
    'liaison-assureur.sans-numero.alerte@1', // plus d'1 jour ouvré ; horloge suspendue pendant une coupure déclarée
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'sinistres.declaration.enregistree@1',
    'sinistres.garantie.decidee@1',
    'sinistres.evaluation.arretee@1',
    'sinistres.provision.revisee@1',
    'sinistres.reglement.ordonne@1',
    'sinistres.quittance.changed@1',
    'sinistres.recours.changed@1',
    'sinistres.dossier.cloture@1',
    'paiement.reglement.changed@1',
    'assurance.provision.changed@1',
  ],

  // C10 (annexe A.5) : `profiles: ["liaison-assureur"]` ; socle seul.
  profilCompose: 'liaison-assureur',

  // C13, point 1 : l'annexe A.5 écrit « un transport configuré (API ou emplacement partagé du réseau de la compagnie) ». Aucun
  // module n'est exigé. [proposition] Le code de prérequis est de ce fichier.
  prerequis: [
    {
      code: 'transport-configure',
      description:
        "Un transport est configuré : API du logiciel de la compagnie, ou répertoire d'échange sur le NAS de la compagnie (entrée en lecture seule, sortie en écriture seule)",
      action: "Faire configurer le transport par l'administrateur de la compagnie, puis relancer la vérification.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Les sept codes et leurs critères
  // sont ceux de l'annexe A.5 ; noms de routes proposés (convention commune : `verifications/<code>`).
  verifications: [
    {
      code: 'lc-joignable',
      route: 'POST /api/v1/instance/liaison-assureur/{organisationId}/verifications/lc-joignable',
      critere:
        "Dernière lecture valide à moins de deux fois la fraîcheur par défaut : 🟢 ; périmée : 🟠 ; jamais lue : 🔴 (FR-201, AD-1).",
    },
    {
      code: 'aucun-port-entrant',
      route: 'POST /api/v1/instance/liaison-assureur/{organisationId}/verifications/aucun-port-entrant',
      critere: "Aucun port n'est ouvert pour l'échange : 🟢 ; sinon 🔴 avec le port (FR-197, AD-13).",
    },
    {
      code: 'envoi-idempotent',
      route: 'POST /api/v1/instance/liaison-assureur/{organisationId}/verifications/envoi-idempotent',
      critere:
        "Rejouer un lot déjà intégré ne change aucun dossier, aucune provision, aucun règlement affiché (`LOT_DEJA_INTEGRE`) : 🟢 ; sinon 🔴 (FR-200).",
    },
    {
      code: 'reference-sans-trou',
      route: 'POST /api/v1/instance/liaison-assureur/{organisationId}/verifications/reference-sans-trou',
      critere:
        "La référence `DEC-` est attribuée sans trou ni doublon, même avec le LC coupé (les trous d'annulation sont consignés avec leur motif) : 🟢 ; sinon 🔴 avec le numéro (FR-198, AD-6).",
    },
    {
      code: 'aucune-donnee-de-sante-vers-le-lc',
      route: 'POST /api/v1/instance/liaison-assureur/{organisationId}/verifications/aucune-donnee-de-sante-vers-le-lc',
      critere:
        "Un lot sortant d'un dossier corporel d'essai ne contient que références, montants, garanties, états et motifs codés : 🟢 ; sinon 🔴 avec le champ en cause (FR-196, AD-8, AD-23).",
    },
    {
      code: 'lc-fictif-absent-du-reel',
      route: 'POST /api/v1/instance/liaison-assureur/{organisationId}/verifications/lc-fictif-absent-du-reel',
      critere:
        "Le LC fictif est présent ou activable dans un espace réel : 🔴 (`ASSUREUR_FICTIF_INTERDIT`) ; absent : 🟢. Lit `assureurFictifAutorise` dans l'état publié (FR-205, AD-19).",
    },
    {
      code: 'annexe-c-complete',
      route: 'POST /api/v1/instance/liaison-assureur/{organisationId}/verifications/annexe-c-complete',
      critere:
        "Un test parcourt l'annexe C et le corps du PRD et ne trouve aucun message sortant sans ligne : 🟢 ; sinon 🔴 avec le message (FR-196).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.5).
  avertissementDesinstallation:
    "Plus aucune déclaration, évaluation, provision, règlement ni clôture ne partira vers le logiciel de la compagnie ; plus aucun numéro de sinistre officiel ni aucun contrat ne sera reçu ; ce qui est en file reste en file.",

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. La version du contrat d'échange est portée
  // par chaque objet et chaque fichier : une version inconnue est refusée en entier (`VERSION_CONTRAT_INCONNUE`) et va dans la file
  // des écarts. La forme du journal et des files ne change jamais dans la fenêtre de sept jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/liaison-assureur/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `echange-par-fichiers` : le transport seulement, jamais la forme des données. `numero-attribue-par-prospera` : bascule du
  // paramètre `attributeur` sans reprise de code (FR-198, AD-6) ; refusée en cas de conflit d'unicité.
  interrupteurs: ['echange-par-fichiers', 'numero-attribue-par-prospera'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (file, état, liste « à saisir », export). Noms proposés, à figer par la
  // story d'API.
  routesLectureSeule: [
    'GET /api/v1/liaison-assureur/etat', // [proposition]
    'GET /api/v1/liaison-assureur/envois', // [proposition]
    'GET /api/v1/liaison-assureur/ecarts', // [proposition]
    'GET /api/v1/liaison-assureur/a-saisir', // [proposition]
    'GET /api/v1/instance/liaison-assureur/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/liaison-assureur/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/liaison-assureur/{organisationId}/export',
    import: 'POST /api/v1/instance/liaison-assureur/{organisationId}/import', // sa part du dossier d'installation ; point d'import des numéros officiels (voie `REPRISE`)
    effacement: 'POST /api/v1/instance/liaison-assureur/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/liaison-assureur/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : les numéros officiels de sinistre entrent par le point d'import de ce
  // module (AD-14, voie `REPRISE`). Voir les écarts en en-tête : l'annexe A.5 déclare `[]`, la spine gagne.
  objetsDeReprise: ['liaison-assureur.numero-officiel@1'], // [proposition de nom du schéma d'objet]

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : les trois domaines de l'annexe A.5, ce module étant leur point d'échange
  // unique. Connecteurs est HORS février : ils se déclarent maintenant et se branchent plus tard sur `TransportLC`. Propositions :
  // la sorte, `argent`, `controle`, le niveau et la clé de libellé sont de ce fichier [À CONFIRMER avec le contrat de Connecteurs].
  domainesEchange: [
    {
      code: 'assurance.contrats', // LC → Prospera ; propriétaire = le logiciel de la compagnie, Prospera en lecture seule
      objets: [
        'liaison-assureur.assure@1',
        'liaison-assureur.police@1',
        'liaison-assureur.garantie@1',
        'liaison-assureur.prime@1',
        'liaison-assureur.intermediaire@1',
        'liaison-assureur.coassurance@1',
        'liaison-assureur.traite@1',
        'liaison-assureur.produit@1',
      ], // C-1 à C-8
      sorte: 'OBJET_DATE', // l'annexe écrit `REFERENTIEL`, absent du contrat
      argent: false,
      controle: true,
      niveauParDefaut: 'HEURE', // annexe C : « heure (5 min avec API) »
      cleLibelleAction: 'liaison-assureur.echange.contrats',
      publie: [], // sens entrant seul : les faits `.recu` sont publiés par le module (voir `publie`)
    },
    {
      code: 'sinistres.dossiers', // sinistres existants du LC → Prospera (C-9, C-11, C-12) ; déclarations, évaluations, règlements, recours, clôtures Prospera → LC (C-13 à C-17)
      objets: [
        'liaison-assureur.sinistre-existant@1',
        'liaison-assureur.declaration@1',
        'liaison-assureur.evaluation-provision@1',
        'liaison-assureur.reglement@1',
        'liaison-assureur.recours-encaisse@1',
        'liaison-assureur.cloture@1',
      ],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true, // sinistres ouverts, somme de leurs provisions
      niveauParDefaut: 'IMMEDIAT', // « à l'événement » : 5 minutes avec une API, à l'heure avec des fichiers
      cleLibelleAction: 'liaison-assureur.echange.sinistres',
      publie: ['liaison-assureur.envoi.etat@1'],
    },
    {
      code: 'ged.documents-sinistres', // LC → Prospera (C-10) ; le fichier est remis au point d'import de `ged` (AD-9)
      objets: ['liaison-assureur.document-sinistre@1'],
      sorte: 'MOUVEMENT',
      argent: false,
      controle: true, // pièces rattachées
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'liaison-assureur.echange.documents',
      publie: ['liaison-assureur.document.recu@1'],
    },
  ],

  // C11 : sans objet, aucun modèle promis (le contrôle de doublon de FR-198 porte sur la police, la date de survenance,
  // l'immatriculation et la victime : c'est une règle, signalée au gestionnaire qui décide ; Prospera ne fusionne jamais seul).
  // Aucune donnée ne passe par l'IA commune depuis ce module ; l'IA ne corrige jamais un écart ni un montant.
  ia: {
    modeles: [],
    finalites: [],
  },
} as const;
