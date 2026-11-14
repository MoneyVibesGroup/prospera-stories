// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M09 — Facturation, proformas et e-facture (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories, PRD distributeur (prds/prd-distributeur-2026-11-12, FINAL), annexe A.2 (treize
// clauses C1 → C13, dépendances validées par le PO le 2026-11-12). Les noms de topics, de droits, de modèles
// et de finalités de l'annexe sont des propositions, modifiables avant ce manifeste ; ce fichier les fige.
// Le propriétaire du dépôt `facturation-service` (à créer, voir ci-dessous) le copie dans
// `src/module.manifest.ts` la semaine où il y travaille ; une garde de test compare ensuite le fichier du
// dépôt à la copie du catalogue (C1).
// Références : PRD distributeur §5.2 (FR-42 → FR-58, FR-222 → FR-224) ; FR-216 et FR-217 (objets de reprise
//              et suite de numérotation) ; FR-247 et FR-248 (la Créance et le crédit du tiers sont tenus par
//              `paiement`) ; FR-249 (envoi par WhatsApp, repli SMS) ; annexe A.2 et annexe B.2 ;
//              spine de la Reprise (AD-2, AD-11, AD-23) ; manifeste de `paiement` (domaine `paiement.creances`).
//
// ⚠️ SERVICE PORTEUR : [À CONFIRMER, M09 : partiel, STORY-647/649]. La Créance est tenue par `paiement-service`
// (FR-247) ; la facture, ses lignes, ses avoirs et ses séries de numérotation sont tenus par un service
// `facturation` à créer. Deux modules dans un même service ne partagent pas de collection qu'ils écrivent
// tous deux (contrat §4) : `facturation` n'écrit JAMAIS dans la collection des Créances de `paiement`. Le
// manifeste ne préjuge pas du service ; si la décision change, seul l'en-tête et la route de service bougent.
//
// Hors manifeste, pour mémoire :
// - Offre : bundles distributeur « Finance & Recouvrement » et « Plateforme » (manifestes-a-produire.md, M09).
// - Écrans : module d'écran `facturation` dans `prospera-app` (C8), tous les écrans par Dev B. Route
//   `/facturation`, trois onglets : Factures et créances, Proformas, E-facturation et avoirs. Entrées de
//   menu : « Factures » (`facturation:facture:consulter`), « Proformas » (`facturation:proforma:gerer`),
//   « Balance clients » (`facturation:balance:consulter`). « Imprimer / PDF » et « Envoyer au client » sont
//   exigés en février ; « Corriger et retransmettre » (e-facture OTR) affiche « bientôt » (la facture
//   normalisée OTR n'est pas exigée en février).
// - Rôles proposés (annexe B.2, à confirmer avec les rôles du vertical ; chaque droit s'exerce sur le
//   périmètre du rôle) : `facturation:facture:emettre` = COMPTABLE, DAF ; FREELANCE pour ses propres factures,
//   dans son espace ; `facturation:facture:consulter` = DG, DC, RESP_VENTES, DAF, COMPTABLE, CONTROLE_GESTION
//   (lecture), RECOUVREMENT ; COMMERCIAL, FREELANCE, PROSPECTION pour leur portefeuille ;
//   `facturation:avoir:emettre` = COMPTABLE, DAF ; `facturation:proforma:gerer` = DC, RESP_VENTES, COMMERCIAL,
//   FREELANCE, PROSPECTION, COMPTABLE, DAF ; `facturation:balance:consulter` = DG, DC, RESP_VENTES, DAF,
//   COMPTABLE, CONTROLE_GESTION, RECOUVREMENT ; `facturation:numerotation:administrer` = DAF
//   (initialisation par la reprise, une fois). Le CONTROLE_GESTION voit la marge par axe, pas la marge de
//   chaque facture (FR-223) ; le SUPERVISEUR n'a pas `/facturation` ; DIST_ADMIN ne reçoit aucun droit qui
//   lit une donnée métier (B.2).
// - Cloisonnement du freelance (FR-224, A.2 C2) : un freelance ne lit que les factures qu'il émet à ses
//   détaillants ; la société ne les lit jamais, ni à l'écran, ni par une réponse du serveur, ni par un export
//   de l'organisation ; elles n'entrent pas dans la balance clients de la société (FR-50). Série propre à
//   chaque freelance émetteur, jamais mêlée à celle de la société.
// - La facture est un document figé : une facture émise ne se supprime pas et ne se modifie plus ; une erreur
//   se corrige par un avoir (FR-43, FR-48) ; une annulation ne libère pas son numéro.
// - Montants (FR-45) : TVA calculée par taux sur le total HT de la facture, un seul arrondi par taux, à
//   l'unité XOF ; taux de 18 % au Togo, lu du référentiel fiscal du pays (paquet fiscal), jamais en dur.
// - Mentions légales (FR-44, FR-46) : liste de travail jusqu'à la validation par l'expert-comptable du client
//   (décision du PO du 2026-11-12) ; durée de conservation des factures : 10 ans au moins, dans cette liste.
// - Aucune créance dans ce module (FR-247) : `facturation` ne contient aucun champ de reste dû, de montant
//   encaissé ni de statut payé (test de schéma). `PARTIELLE` et `PAYEE` se déduisent de la Créance lue chez
//   `paiement` ; la balance clients et la balance âgée sont des VUES de `facturation` qui lisent
//   `paiement.creance@1`, sans solde propre (FR-50, FR-51).
// - C11 : l'IA est déclarée (champ `ia` plus bas). Le scoring de crédit est une AIDE : il n'accorde ni ne
//   refuse seul (garde-fou « plafond de crédit non négociable »).
// - Graphe (A, préambule) : `reseau` ← `pdv` ← `facturation` ; `catalogue` ← `facturation` ;
//   `paiement` ← `facturation`. Aucun module n'en dépend en retour : les retours passent par `enrichiPar`
//   (`pdv`, `reprise`, `conquete-objectifs` et `controle-gestion` listent `facturation` en `enrichiPar`).
// - Droits : le catalogue des droits est un `enum` fermé (C7) : chaque droit ci-dessous demande une PR
//   `auth-service` à la livraison du module. Tous passent `^[a-z]+:[a-z-]+:[a-z]+$` ; aucun code de module
//   à tiret n'est en jeu ici.

export const MANIFESTE_FACTURATION = {
  code: 'facturation',
  version: '1.0.0',

  // C1 : trois dépendances DURES, validées par le PO le 2026-11-12.
  // - catalogue : une ligne de facture porte un article, une taxe et un prix résolu ;
  // - pdv : une facture est émise à un point de vente (le client) ; il fournit ses conditions de règlement et
  //   son plafond. Il n'y a pas de vente anonyme : la vente au comptoir passe par le « client comptoir »
  //   générique de chaque point de stock (FR-241) ;
  // - paiement : la Créance ouverte par la facture, son reste dû et les balances sont tenus par `paiement`
  //   (FR-247) ; sans lui, une facture n'a aucun reste dû lisible.
  depends: [
    {
      code: 'catalogue',
      raison: "Une ligne de facture porte un article, une taxe et un prix résolu par la grille.",
    },
    {
      code: 'pdv',
      raison:
        "Une facture est émise à un point de vente ; elle lit ses conditions de règlement et son plafond de crédit.",
    },
    {
      code: 'paiement',
      raison:
        "La Créance ouverte par la facture, son reste dû et les balances sont tenus par paiement (FR-247) ; facturation ne tient aucun solde.",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent.
  // - commande : « Facture depuis commande » = `NON_INSTALLE` ; la facture se saisit directement, lignes
  //   libres (FR-42). Source de la facture à la livraison, en un clic, sur les quantités livrées confirmées ;
  // - stock : sortie facturée et coût de revient ; sans lui, la marge par facture = `NON_INSTALLE` (FR-53) ;
  // - recouvrement : lit les factures échues pour ses relances ; sans lui, rien ne change ici ;
  // - notification : « Envoyer au client » = `NON_INSTALLE`, le PDF reste téléchargeable ; envoi du PDF et
  //   du lien par WhatsApp, repli SMS (FR-249) ;
  // - freelance : facture émise par le freelance à son détaillant, dans son espace propre (FR-224) ;
  // - connecteurs : export vers Sage, plus tard (FR-218, hors février).
  enrichiPar: ['commande', 'stock', 'recouvrement', 'notification', 'freelance', 'connecteurs'],

  // Aucun numéro de compte ici : l'écriture comptable des factures (journal VT) appartient à balance-service
  // et à `finance-transactions` (hors février). La démo n'a aucune écriture réelle (PRD, partie 4).
  referentielFamilies: [],

  // C7 : droits de tenant, les six de l'annexe A.2. L'export reste réservé à instance:donnees:exporter (C2).
  droits: [
    'facturation:facture:emettre', // créer et émettre une facture, l'envoyer au client (FR-42, FR-43, FR-47)
    'facturation:facture:consulter', // factures, PDF, huit chiffres, portefeuille selon le rôle (FR-222, FR-223)
    'facturation:avoir:emettre', // avoir complet ou partiel, par taux (FR-48)
    'facturation:proforma:gerer', // créer, envoyer, relancer, convertir en commande (FR-54 → FR-56)
    'facturation:balance:consulter', // balance clients et balance âgée, lues chez `paiement` (FR-50, FR-51)
    'facturation:numerotation:administrer', // initialisation de la suite par la reprise, une fois ; droit restreint (FR-217)
  ],

  // C5 : faits publiés et consommés (annexe A.2). Chaque fait d'objet porte l'identifiant stable de l'objet,
  // l'`organisationId` et un `rang` (point d'écriture unique, §6 du contrat).
  publie: [
    'facturation.facture.emise@1', // ouvre la Créance chez `paiement` (FR-247) ; fait du domaine `facturation.factures`
    'facturation.facture.changed@1', // statut, envoi, annulation par avoir ; jamais un solde
    'facturation.avoir.emis@1', // réduit la Créance, ou crée un crédit du tiers sur une facture payée (FR-248)
    'facturation.facture.reprise@1', // facture ouverte reprise de Sage : `paiement` ouvre sa Créance au reste dû repris (FR-58, FR-216)
    'facturation.proforma.changed@1', // statut, relances, probabilité d'acceptation
    'instance.journal@1', // émissions, avoirs, initialisation de la suite, envois, effacement (journal d'émission, A.2 C3)
    'facturation.realite.constatee@1', // [AD-14, spine IA] facture encaissée à l'échéance ou non, proforma acceptée ou non (issue : ENCAISSEE, ENCAISSEE_EN_RETARD, IMPAYEE, PROFORMA_ACCEPTEE, PROFORMA_REFUSEE) ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version
    'kyc.status.changed',
    'commande.bon-livraison.livre@1', // la facture naît à la livraison, sur les quantités livrées confirmées (FR-42)
    'commande.commande.validee@1', // option « facturer dès la validation »
    'paiement.creance.changed@1', // reste dû, échéance, ancienneté : de quoi déduire PARTIELLE et PAYEE (FR-49)
    'paiement.creance.soldee', // topic de `paiement`, sans suffixe de version
    'catalogue.grille.publiee@1', // prix résolus pour les lignes et les proformas
    'pdv.plafond.changed@1', // plafond de crédit, y compris sa suspension (FR-V33) ; seul chemin du blocage de crédit
    'connecteurs.domaine.changed@1', // propriétaire du domaine facturation.factures, plus tard (spine de Connecteurs, AD-3)
    // Les faits de `recouvrement` (crédit bloqué, via `pdv.plafond.changed@1`) et de `freelance` s'ajoutent
    // en version mineure quand leurs manifestes les nomment.
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  profilCompose: 'facturation',

  // C13, point 1 : le référentiel fiscal du Togo publié (taux de TVA, paquet fiscal du pays) est une donnée
  // de la plateforme, vérifiée plus bas ; aucun prérequis d'infrastructure extérieur.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré, une clef d'idempotence ; appelées par le moteur.
  verifications: [
    {
      code: 'numerotation-continue',
      route: 'POST /api/v1/instance/facturation/{organisationId}/verifications/numerotation-continue',
      critere:
        "Suite de chaque série (facture, avoir, proforma ; séries des freelances comprises) sans trou ni doublon sur les 100 derniers numéros : 🟢 ; sinon 🔴 avec la série et le numéro en cause (FR-43, FR-217). Une facture reprise n'avance pas la suite et n'entre pas dans le contrôle.",
    },
    {
      code: 'creances-concordantes',
      route: 'POST /api/v1/instance/facturation/{organisationId}/verifications/creances-concordantes',
      critere:
        "Pour chaque facture, le TTC moins les avoirs égale le reste dû de sa Créance chez `paiement` plus les encaissements imputés, écart 0 FCFA : 🟢 ; sinon 🔴 avec le nombre de factures en écart (FR-247). Lecture seule chez `paiement` ; traitement différé, progression visible.",
    },
    {
      // Proposition (annexe A.2 C13 « prérequis : référentiel fiscal du Togo publié » ; FR-45) : le prérequis
      // de l'annexe devient une vérification chiffrée, comme exige C13 point 2.
      code: 'referentiel-fiscal-publie',
      route: 'POST /api/v1/instance/facturation/{organisationId}/verifications/referentiel-fiscal-publie',
      critere:
        "Référentiel fiscal du pays de l'organisation publié avec un taux de TVA en vigueur (18 % au Togo) : 🟢 ; sinon 🔴 « aucune facture ne peut être émise, la TVA n'a pas de taux » (FR-45).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.2). Le compteur de numérotation est
  // conservé : réinstaller reprend au numéro suivant, sans trou ni doublon.
  avertissementDesinstallation:
    'Plus aucune facture ne pourra être émise ; la suite de numéros est conservée.',

  // C12 : format lisible par la version précédente pendant 7 jours. Règle d'or : le compteur de numérotation
  // ne change jamais de forme dans la fenêtre de 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/facturation/migrer', // route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [
    'e-facture-otr', // certification de la facture normalisée OTR ; hors février (FR-57), éteint par défaut
    'avoir-automatique-sur-annulation', // une annulation émet un avoir au lieu de libérer le numéro (FR-43, FR-48)
  ],

  // C11 (annexe A.2) : offre « scoring crédit, score d'acceptation, prévision 7/30 jours ». Chaque prédiction
  // et chaque correction humaine est journalisée localement (C11, point 2) ; la calibration locale est une
  // donnée du client, qu'une mise à jour n'écrase jamais.
  // - score-acceptation-proforma : probabilité d'acceptation (0-100) d'une proforma, FR-55 ;
  // - scoring-credit-client : aide à la décision ; n'accorde ni ne refuse seul (« plafond de crédit non
  //   négociable ») ;
  // - prevision-encaissement : prévision à 7 et 30 jours, lue des Créances de `paiement`.
  ia: {
    capacites: [
      'distributeur/score-acceptation-proforma@1',
      'distributeur/scoring-credit-client@1',
      'distributeur/prevision-encaissement@1',
    ],
    finalites: ['aide-a-la-decision-credit', 'priorisation-des-creances'],
  },

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (noms proposés, figés par l'épic de facturation).
  // Consultation, PDF et export ; toute écriture rend 403 `ABONNEMENT_EXPIRE`. Les balances sont des vues de
  // `facturation` sur les Créances de `paiement` : elles restent lisibles.
  routesLectureSeule: [
    'GET /api/v1/instance/facturation/{organisationId}/export',
    'GET /api/v1/organisations/{organisationId}/factures',
    'GET /api/v1/organisations/{organisationId}/factures/{factureId}', // fiche facture ; reste dû lu chez `paiement`
    'GET /api/v1/organisations/{organisationId}/factures/{factureId}/pdf', // PDF figé, jamais régénéré (FR-46)
    'GET /api/v1/organisations/{organisationId}/avoirs',
    'GET /api/v1/organisations/{organisationId}/proformas',
    'GET /api/v1/organisations/{organisationId}/balance-clients', // vue sur `paiement.creance@1` (FR-50)
    'GET /api/v1/organisations/{organisationId}/balance-agee', // cinq tranches par défaut (FR-51)
    'GET /api/v1/organisations/{organisationId}/numerotation', // suite de chaque série, en lecture
    'GET /api/v1/organisations/{organisationId}/journal', // auteur rendu par son identité
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/facturation/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/facturation/{organisationId}/export',
    import: 'POST /api/v1/instance/facturation/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/facturation/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/facturation/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise, AD-2) : schémas dans
  // prospera-plateforme/contrats/objets/facturation/, écrits avec EPIC-161. Noms proposés (FR-216, FR-217),
  // modifiables. Le point d'import range dans l'organisation (la Reprise n'écrit jamais dans la base de la
  // cible, AD-2). Ordre de livraison : `reseau`, puis `pdv` et `catalogue`, puis `stock` ; `facturation` en
  // DERNIER, car une facture ouverte référence un client et un article ; `paiement` ouvre ses Créances à la
  // suite (FR-216). `paiement.objetsDeReprise` reste `[]`.
  // - facture-ouverte (FR-58) : une facture IMPAYÉE de Sage, reprise « sans détail ». Champs : numéro d'origine
  //   (gardé tel quel), client (référence reconnue dans `pdv`), date d'émission, date d'échéance, montant TTC,
  //   reste dû, devise (jamais convertie), `origine = REPRISE`. Pas de lignes ; pas de PDF (l'original reste
  //   dans Sage). Régime VIVANT seul (une facture soldée n'est pas reprise ; l'historique des ventes et des
  //   paiements n'est pas repris en février, FR-216).
  //   · Valeur de contrôle : « reste dû » (montant), par client et en total, à la date de coupure déclarée
  //     avec le fichier : Σ reste dû chargé = total de la balance Sage fourni, à l'unité de FCFA. Elle se
  //     vérifie dans le registre de `paiement` (`paiement.creance@1`), pas dans `facturation`, qui ne tient
  //     aucun solde (FR-247). Un écart refuse la validation : `ECART_DE_CONTROLE`.
  //   · ⚠️ Le reste dû est un MONTANT REQUIS (PRD Reprise FR-7) : absent, l'écart `MONTANT_REQUIS_ABSENT` le
  //     laisse « à saisir » dans `facturation` avant la mise en service ; sans lui, la balance du premier jour
  //     serait fausse et crédible.
  //   · Doublons : numéro d'origine. Un numéro déjà présent est refusé (`NUMERO_DEJA_REPRIS`) ; recharger le
  //     même fichier ne crée aucun doublon (idempotent).
  //   · Un client absent de `pdv` rejette sa ligne (`CLIENT_INCONNU`) ; elle va au rapport d'écarts et ne
  //     crée jamais de client en silence.
  //   · La facture reprise publie `facturation.facture.reprise@1` ; `paiement` ouvre sa Créance au reste dû
  //     repris (FR-247). Sans Créance ouverte dans les 5 secondes : écart au rapport, et le feu vert de
  //     `facturation` reste refusé (FR-216, conséquence 5). Elle entre dans la balance clients et la balance
  //     âgée avec son échéance d'origine, peut recevoir un Encaissement et un avoir.
  //   · N'avance JAMAIS la suite de numérotation (FR-43, FR-58).
  // - suite-numerotation (FR-217) : le dernier numéro émis sous Sage, PAR SÉRIE (facture, avoir, proforma),
  //   repris comme valeur de départ du compteur. Champs : série, émetteur (l'organisation ; les séries des
  //   freelances naissent à l'invitation, jamais par la reprise), format (préfixe, année, largeur, repris du
  //   fichier Sage, non du code), dernier numéro repris, date de reprise.
  //   · Valeur de contrôle : « dernier numéro » (donnée, comparée par série). Exemple : dernier numéro
  //     `FAC-2026-8821` repris, première facture émise `FAC-2026-8822` ; aucun trou ni doublon, y compris
  //     sous 50 émissions parallèles.
  //   · Doublons : (série, émetteur) ; réimporter une seconde suite après la première facture Prospera est
  //     refusé avec un code nommé (FR-217, conséquence 4). L'initialisation n'a lieu qu'UNE fois, par la
  //     reprise seule, sous `facturation:numerotation:administrer`.
  //   · S'initialise au GEL de Sage : à partir de l'heure de bascule plus aucune facture ne s'émet dans Sage,
  //     même pendant la marche en parallèle ; un numéro Sage postérieur au gel, trouvé au rapport, bloque le
  //     feu vert de `facturation` (FR-217, conséquence 6). Une série continue qui reprend Sage (décision du PO).
  //   · Le format exact des numéros Sage du client de février n'est pas encore connu : il est obtenu avec
  //     l'export des factures ouvertes (FR-217).
  // - Ordre entre les deux objets : suite-numerotation d'abord (la suite doit exister avant la première
  //   émission), puis facture-ouverte ; les deux avant le feu vert de `facturation`.
  objetsDeReprise: ['facturation.facture-ouverte@1', 'facturation.suite-numerotation@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs, AD-2) : RIEN en février (Connecteurs est hors
  // février, décision du PO ; FR-218). Déclaré pour plus tard, comme l'exige l'annexe A.2 (C13) et FR-218 :
  // un seul point d'écriture par domaine (§6 du contrat), avec identifiant stable et `rang`.
  // Les créances ne sont plus un domaine de `facturation` : `paiement.creances` (voir `paiement`).
  // Choix proposés (annexe A.2 les laisse libres, FR-218) :
  // - niveauParDefaut `HEURE` : une facture émise n'a pas besoin de l'immédiat (le disponible de stock, lui,
  //   le demande) ; le contrôle (`controle: true`) se joue sur les valeurs, pas sur la fraîcheur ;
  // - cleLibelleAction `facturation.echange.factures` : même forme que `stock.echange.mouvements`.
  // Valeurs de contrôle d'un domaine d'argent (annexe, point 6) : montants TTC et nombre de factures émises
  // sur la période, à confirmer par l'épic de Connecteurs.
  domainesEchange: [
    {
      code: 'facturation.factures',
      objets: ['facturation.facture@1'],
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true,
      niveauParDefaut: 'HEURE',
      cleLibelleAction: 'facturation.echange.factures',
      publie: ['facturation.facture.emise@1'],
    },
  ],
} as const;
