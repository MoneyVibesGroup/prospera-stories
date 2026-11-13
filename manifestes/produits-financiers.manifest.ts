// Manifeste M46 — Produits financiers (format du contrat de module, clause C1, amendée le 2026-11-10, le
// 2026-11-11 et le 2026-11-12).
// Source : PRD microfinance (prds/prd-microfinance-2026-11-13/prd.md), annexe A.2, treize clauses C1 → C13 ;
// spine microfinance (architecture/architecture-microfinance-imf-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE sur
// l'annexe A quand les deux divergent (AD-9 : « il complète et corrige les C5 de l'annexe A »).
// Le propriétaire du dépôt `prospera-imf-service` [À CONFIRMER, M46] le copie dans `src/module.manifest.ts`
// (module Nest `src/modules/produits-financiers/`, AD-3) la semaine où il y travaille ; une garde de test compare
// ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD microfinance §5.2 (FR-100 → FR-113), FR-10 (plafond d'usure), FR-195 (textes réglementaires =
//              paramètres), décisions T1 et T5 (module distinct du `catalogue`), annexe B (matrice d'accès),
//              annexe C (objet « Produit »), annexe D.1 et D.3 ; spine AD-2, AD-3, AD-9, AD-11 (bibliothèque de
//              calcul unique), AD-12 (tout se fige au dossier), AD-13, AD-14, AD-25, AD-28 (paramètres
//              réglementaires) ; épic EPIC-180 ; manifestes-a-produire.md, amendement du 2026-11-13 sur M46 et M47.
//
// ⚠️ CODE À TIRET. `produits-financiers` ne passe PAS le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`, `TENANT_PERMISSION_FORMAT`). Ses droits sont écrits dans la forme ÉLARGIE
// `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement C7 du 2026-11-11). La story `auth-service` qui élargit le format est un
// PRÉREQUIS D'INSTALLATION de ce module (à livrer avant son installation ; EPIC-180 est ★ février) : CE MODULE NE
// PEUT PAS ÊTRE INSTALLÉ AVANT ELLE. Chaque droit demande en outre une PR `auth-service` à la livraison
// (catalogue fermé, C7). Le profil de compose et les routes gardent le tiret du code ; seule la gate le remplace
// par `_` (`PRODUITS_FINANCIERS_NOT_ENTITLED`).
//
// Service porteur : `prospera-imf-service` (module `produits-financiers`, spine AD-2 et AD-25 ; M46 est un
// nouveau module de l'amendement du 2026-11-13 de manifestes-a-produire.md). Le code `produits-financiers` est
// une proposition [À CONFIRMER, M46].
// Bundle : « Crédit » et « Plateforme » de l'offre microfinance [proposition : manifestes-a-produire.md ne
// contient pas de ligne M46 ; le catalogue des produits est consommé par le crédit, M15, bundle `M: Crédit,
// Plateforme`] [À CONFIRMER]. Épic ★ février : EPIC-180 (dépôts : `prospera-plateforme/finance` pour la
// bibliothèque de calcul, `prospera-imf-service`, `prospera-app`). Propriétaire du manifeste : Dev B.
//
// Écarts relevés entre l'annexe A.2 du PRD et la spine (la spine gagne, AD-9) :
// - C5, `produits-financiers.produit.changed@1` (annexe) : ABSENT du catalogue d'AD-9, non publié (« un nom absent
//   du tableau ne se publie ni ne se consomme »). Le catalogue donne `produit.publie`, `produit.retire`,
//   `produit.a-revoir` et AJOUTE `produits-financiers.parametre-reglementaire.changed@1` (AD-28). Si un état
//   absolu est voulu, il s'ajoute par une PR qui amende AD-9 [À CONFIRMER].
// - C3 / C5, plafond d'usure : l'annexe le range dans « Lues seulement : plafond d'usure daté (partie 1) » et
//   dans les faits consommés. La spine (AD-28) dit le contraire : les paramètres réglementaires datés (plafond
//   d'usure par pays et catégorie, classes et barème de provision, seuils CENTIF, conservation, périodicités) sont
//   POSSÉDÉS par `produits-financiers`, seul écrivain, validés par le DG (FR-195), et lus par tous par
//   `produits-financiers.parametre-reglementaire.changed@1`. Il n'est donc ni lu ni consommé ici : il est publié.
//   `conformite-bceao` y ajoute le statut juridique sans en être propriétaire.
// - C13, prérequis « plafond d'usure publié (partie 1) » : le plafond est une donnée livrée comme donnée signée de
//   la ligne de version, appliquée à l'essai puis validée par le DG (AD-28), pas un module en service : voir
//   `prerequis`.
// - C5, `coeur-sfd.produit.code@1` : présent dans le catalogue d'AD-9, conservé tel quel.
// - C1, `enrichiPar` : `ia-commune` n'est pas un module installable du catalogue ; l'annexe l'écrit ainsi (et
//   `ia-commune` en C4) ; retiré de la liste à l'harmonisation du lot 3 (voir le commentaire de `enrichiPar`).
// - C2, qui publie : l'annexe A.2 (C2) et FR-100 disent « publié par le DG ou le ROC » (l'auteur ne publie pas) ;
//   la matrice d'accès (annexe B, ligne « Produits financiers ») marque D (publication) pour le DG ET le DAF et A
//   pour le ROC. FR-100 est suivi ici ; à lever [À CONFIRMER, PO].
// - C10 : « socle + `reseau` » ; mais `depends` est `[]` (C1) et la spine ne trace aucune flèche
//   `produits-financiers → reseau`. Le catalogue est celui de l'IMF, sans portée (C2) : `reseau` n'est ni dépendance
//   ni enrichissement ici [À CONFIRMER].
// - Aucun droit n'est nommé pour valider les paramètres réglementaires (DG, FR-195, AD-28) : voir `droits`.
//
// Hors manifeste, pour mémoire :
// - Écrans : module d'écran `produits-financiers` dans `prospera-app` (C8), `src/modules/produits-financiers/`,
//   tous les écrans par Dev B. Route `/produits` (catalogue, fiche de version, historique, simulation). Entrée de
//   menu : « Produits » (`produits-financiers:produit:consulter`). Boutons « Nouveau produit », « Publier »,
//   « Simuler » branchés ; familles tontine et assurance : « bientôt » (décision T1 ; l'assurance relève du PRD
//   assurance).
// - Gate : `PRODUITS_FINANCIERS_NOT_ENTITLED` (403 sans donnée, C2).
// - Cloisonnement (C2) : par `organisationId` ; le catalogue est celui de l'IMF, lu par tous les rôles du crédit.
//   ADMIN_IMF ne lit aucune donnée de client (FR-5).
// - Rôles par défaut (FR-100 et annexe B, ligne « Produits financiers » ; PROPOSITION à confirmer avec les rôles
//   du vertical) :
//   · `produits-financiers:produit:gerer` : ADMIN_IMF, DAF (créer, modifier) ;
//   · `produits-financiers:produit:publier` : DG, ROC (deux personnes : le créateur d'une version ne la publie
//     pas) ;
//   · `produits-financiers:produit:consulter` : DG, DAF, ROC, RA, CC, GP, AT, COLL, COM, RCC, RSQ, AUD, CPT, COMM
//     (L) ; pas REC ni ADMIN_IMF en lecture métier ;
//   · `produits-financiers:simulation:lancer` : CC, RA, GP, AT, COM, COLL (FR-100 : « le lisent et simulent ») ;
//   · `produits-financiers:derogation:accorder` : ROC (éligibilité, C7).
// - Les données possédées (C3, AD-2) : produits de crédit et d'épargne (familles : crédit individuel, crédit de
//   groupe, épargne à vue, épargne bloquée, dépôt à terme), versions horodatées et immuables (taux, bornes,
//   périodicité, méthode d'amortissement, frais et drapeaux « inclus dans le TEG », assurance, éligibilité,
//   cautions et garanties exigées), statut (brouillon, publié, retiré, à revoir), code produit du cœur, journal de
//   publication, ET les paramètres réglementaires datés (AD-28). Une version publiée ne change jamais de forme
//   (AD-12) : on en publie une nouvelle. Lues seulement : score (IA commune), identifiant et code du cœur.
// - Le contrôle au pire cas (durée la plus courte, frais les plus élevés, assurance comprise) vient de
//   `prospera-plateforme/finance` (AD-11), à la même version majeure.mineure épinglée que `credit` et le cœur
//   fictif ; un produit dont le pire cas dépasse le plafond d'usure ne peut pas être publié (EPIC-180).
// - Paramètres (C6) : bornes par version ; pas de saisie du montant (10 000 FCFA) ; montant minimum de démo
//   (50 000 FCFA) ; score d'alerte (45, information seulement) et ancienneté minimum (3 mois) ; méthode du TEG
//   figée et écart toléré du tableau de référence (0,1 point) ; cautions (2 au-dessus de 300 000), dépôt (10 %,
//   15 % au-dessus de 1 000 000), garantie réelle (30 %, 50 %) ; taux d'effort = celui du plafond bloquant du
//   crédit (40 %, annexe D), pas un seuil propre ; dormance par produit (6 mois) ; plafond d'usure (24 %, daté).
//   Données, jamais code.
// - Licence à vie et maintenance mensuelle (annexe A, préambule) : la lecture seule pour abonnement échu ne
//   s'applique pas à cette IMF. Désinstaller ne supprime rien (C9) : produits et versions restent stockés et
//   masqués ; les dossiers accordés gardent leurs conditions figées, stockées dans `credit`.
// - C10 : `profiles: ["produits-financiers"]` ; socle. Le catalogue se tient sans le cœur.
// - Paramètres réglementaires livrés comme données signées de la ligne de version, sans migration ; sur une
//   instance gelée, par fichier (AD-28).

export const MANIFESTE_PRODUITS_FINANCIERS = {
  code: 'produits-financiers',
  version: '1.0.0',

  // C1 : aucune dépendance dure (aucun module n'est requis pour tenir un catalogue).
  depends: [],

  // C4 : sans ces modules, l'emplacement est déclaré vide, jamais 0 ni absent. Un test par entrée.
  // - coeur-sfd : code produit du cœur = `{ etat: NON_INSTALLE, module: coeur-sfd }` ; un produit se publie,
  //   AUCUN dossier qui le porte ne peut être accordé (FR-110) ;
  // - microfinance : éligibilité = `NON_INSTALLE` ; l'ancienneté n'est pas vérifiable et la demande est refusée
  //   par défaut (garde-fou non vérifiable) ; le score, lui, n'a jamais été un blocage ;
  // - credit : le catalogue se tient seul ;
  // - risque-par : taux et frais pour la lecture du portefeuille = `NON_INSTALLE` ;
  // - ia-commune : recommandation et conditions optimales = « indisponible » (`NON_DISPONIBLE`) ; simulation
  //   manuelle complète. L'IA propose, l'agent choisit ; indisponible, rien ne bloque.
  // ⚠️ `ia-commune` retiré de `enrichiPar` (harmonisation du lot 3, 2026-11-13) : l'annexe A l'écrit comme un
  // module, mais ce n'est pas un code du catalogue ; c'est le port Proposition de la spine (AD-14), service
  // porteur à cadrer. Un code inconnu ferait échouer la validation des manifestes. Son absence se traite
  // comme le dit C4 ci-dessus (règle v0 ou « indisponible »).
  enrichiPar: ['coeur-sfd', 'microfinance', 'credit', 'risque-par'],

  // Aucun numéro de compte ici : un produit ne passe aucune écriture (le code produit comptable est celui du
  // cœur, annexe C).
  referentielFamilies: [],

  // C7, forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$` (amendement du 2026-11-11). ⚠️ Aucun de ces droits n'est accepté
  // par le format actuel d'auth-service : la story d'élargissement est un PRÉREQUIS D'INSTALLATION.
  droits: [
    'produits-financiers:produit:consulter', // catalogue, fiche de version, historique (FR-100)
    'produits-financiers:produit:gerer', // créer, modifier un produit et ses versions en brouillon (FR-100 → FR-107)
    'produits-financiers:produit:publier', // publier une version, retirer ; deux personnes (FR-100, FR-108)
    'produits-financiers:derogation:accorder', // dérogation d'éligibilité, ROC (FR-104)
    'produits-financiers:simulation:lancer', // simulation du TEG et de l'échéancier (FR-109)
    // Aucun droit nommé par l'annexe A.2 pour VALIDER un paramètre réglementaire (plafond d'usure, classes,
    // barème de provision, seuils CENTIF ; FR-195 : « validés par le DG », AD-28) : réutiliser `produit:publier`
    // ou ajouter un droit `produits-financiers:parametre:valider` [À CONFIRMER, PO ; aucun nom n'est inventé ici].
  ],

  // C5 : faits publiés et consommés. Source : catalogue de la spine, AD-9 (qui corrige l'annexe A.2, C5). Chaque
  // fait d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`.
  publie: [
    'produits-financiers.produit.publie@1', // version figeable par `credit` (AD-12)
    'produits-financiers.produit.retire@1',
    'produits-financiers.produit.a-revoir@1', // plafond d'usure abaissé : le pire cas d'une version publiée le dépasse
    'produits-financiers.parametre-reglementaire.changed@1', // spine AD-28 ; absent de l'annexe A.2 ; plafond d'usure, classes, barème de provision, seuils, conservation
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock et commande] publications, export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'essai.horloge.changed@1', // [proposition, spine AD-30 : date d'effet d'une version dans l'espace d'essai ; absent de la C5 de l'annexe A.2]
    'coeur-sfd.produit.code@1', // code produit du cœur (FR-110) ; projection datée, AD-1
    'microfinance.client.changed@1', // éligibilité : ancienneté (FR-104)
  ],

  profilCompose: 'produits-financiers',

  // C13, point 1 : l'annexe A.2 écrit « plafond d'usure publié (partie 1) ». Le plafond est une donnée de ce
  // module (AD-28) : la vérification demande qu'il existe et soit validé par le DG avant d'accepter une publication.
  prerequis: [
    {
      code: 'plafond-usure-publie', // [proposition, nom du code]
      description:
        "Plafond d'usure daté publié pour le pays et la catégorie d'institution de l'IMF (24 % par an par défaut, annexe D.1), validé par le DG",
      action:
        "Appliquer les paramètres réglementaires de la ligne de version (ou les déposer par fichier sur une instance gelée), puis les faire valider par le DG ; relancer la vérification.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Codes de
  // l'annexe A.2 ; noms de routes proposés (convention commune de l'annexe A : `verifications/<code>`).
  verifications: [
    {
      code: 'produits-conformes',
      route: 'POST /api/v1/instance/produits-financiers/{organisationId}/verifications/produits-conformes',
      critere:
        "TEG au pire cas (durée la plus courte, frais les plus élevés, assurance comprise) de chaque version publiée ≤ plafond d'usure : 🟢 ; un seul au-dessus 🔴 avec son code produit (FR-10, FR-108).",
    },
    {
      code: 'jeu-de-demo-conforme',
      route: 'POST /api/v1/instance/produits-financiers/{organisationId}/verifications/jeu-de-demo-conforme',
      critere:
        "Produits du jeu de démo tous ≤ 24 % au pire cas : 🟢 ; un seul au-dessus 🔴 avec son code produit (FR-11, annexe C, objet « Produit »).",
    },
    {
      code: 'teg-reference',
      route: 'POST /api/v1/instance/produits-financiers/{organisationId}/verifications/teg-reference',
      critere:
        "Tableau de TEG de référence de FR-111 (addendum §3) reproduit à 0,1 point près : 🟢 ; sinon 🔴 avec le nombre de lignes en écart (AD-11 : la suite d'or de la bibliothèque est à 0,01 point).",
    },
    {
      // L'annexe écrit `code-cœur-present` ; le caractère `œ` est remplacé par `oe` pour que le code serve dans
      // un chemin de route [proposition, ASCII].
      code: 'code-coeur-present',
      route: 'POST /api/v1/instance/produits-financiers/{organisationId}/verifications/code-coeur-present',
      critere:
        "Produits publiés sans code du cœur : 0 🟢 ; ≥ 1 🟠 avec leur nombre (FR-110 : aucun dossier ne peut être accordé sur un produit sans code du cœur).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.2).
  avertissementDesinstallation:
    'Plus aucun produit ne sera proposé ; les dossiers en cours gardent leurs conditions.',

  // C12 : format lisible par la version précédente pendant 7 jours. Une version publiée ne change jamais de
  // forme ; un champ de produit ajouté est lu comme inconnu par la version précédente. L'image de
  // `prospera-imf-service` est une seule : son `retourArriere` est le plus restrictif de ses modules (AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/produits-financiers/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `controle-usure-publication` : allumé, jamais éteint en production (FR-10) ; `recommandation-produit` :
  // recommandation de l'IA commune (FR-112). Comportement seulement, jamais la forme des données.
  interrupteurs: ['controle-usure-publication', 'recommandation-produit'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (catalogue, versions, export, annexe A.2, C13). Aucun
  // nom de route n'est donné par le PRD ni la spine : TOUS ces noms sont des propositions, à figer par la story
  // d'API (EPIC-180).
  routesLectureSeule: [
    'GET /api/v1/produits-financiers/produits', // [proposition]
    'GET /api/v1/produits-financiers/produits/{id}', // [proposition]
    'GET /api/v1/produits-financiers/produits/{id}/versions', // [proposition]
    'GET /api/v1/instance/produits-financiers/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/produits-financiers/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/produits-financiers/{organisationId}/export',
    import: 'POST /api/v1/instance/produits-financiers/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/produits-financiers/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/produits-financiers/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : l'annexe A.2 (C13) déclare
  // `['produits-financiers.produit@1']` : les produits en cours, si le cœur ne les fournit pas [À CONFIRMER avec la
  // Reprise]. La spine (AD-2) ne cite pas cet objet parmi ceux de `coeur-sfd` (`client`, `pret`, `echeance`,
  // `garantie`, `compte-epargne`) : il reste donc ici.
  objetsDeReprise: ['produits-financiers.produit@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : l'annexe A.2 (C13) écrit `domainesEchange: ['produits']`
  // (propriétaire : le cœur pour le code et le plan comptable, Prospera pour le catalogue commercial) ; le contrat
  // demande un objet par domaine : la forme complète ci-dessous est une PROPOSITION. Hors février (Connecteurs hors
  // février). Annexe C, objet « Produit » : cœur → Prospera (référence), fréquence « nuit ».
  domainesEchange: [
    {
      code: 'produits-financiers.produits', // [proposition, l'annexe écrit `produits`]
      objets: ['produits-financiers.produit@1'], // [proposition, même nom que l'objet de reprise]
      sorte: 'OBJET_DATE', // [proposition] un produit porte une version et une date d'effet
      argent: false, // un produit n'est pas un mouvement d'argent
      controle: false,
      niveauParDefaut: 'NUIT', // annexe C : fréquence « nuit »
      cleLibelleAction: 'produits-financiers.echange.produits', // [proposition, même forme que `stock.echange.mouvements`]
      publie: ['produits-financiers.produit.publie@1'],
    },
  ],

  // C11 : capacités FR-112 et FR-113, servies par l'IA commune (module Relation client et module Risque). Le
  // moteur est l'IA commune, en instance locale chez l'IMF, par le port `PropositionPort` (spine AD-14) ; le module
  // n'embarque aucun modèle. Données lues par l'instance : profil du client (secteur, ancienneté, revenus
  // estimés), produits éligibles ; seuls des écarts anonymisés repartent pour l'apprentissage, SOUS LE CONSENTEMENT
  // « IA commune » du client ; l'instance reçoit ses mises à jour par un tunnel sortant. L'IA propose, l'agent
  // choisit ; indisponible, rien ne bloque. Les noms de modèles et de finalités sont des propositions (annexe A,
  // préambule).
  ia: {
    modeles: ['recommandation-produit', 'conditions-optimales'],
    finalites: ['recommandation-de-produit', 'proposition-de-conditions'],
  },
} as const;
