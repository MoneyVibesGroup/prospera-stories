// Manifeste M15 — Crédit : cycle, comité et BIC (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// Source : PRD microfinance (prds/prd-microfinance-2026-11-13/prd.md), annexe A.1, treize clauses C1 → C13 ;
// spine microfinance (architecture/architecture-microfinance-imf-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE sur
// l'annexe A quand les deux divergent (AD-9 : « il complète et corrige les C5 de l'annexe A »).
// Le propriétaire du dépôt `prospera-imf-service` [À CONFIRMER, M15] le copie dans `src/module.manifest.ts` (module
// Nest `src/modules/credit/`, AD-3) la semaine où il y travaille ; une garde de test compare ensuite le fichier du
// dépôt à la copie du catalogue (C1).
// Références : PRD microfinance §5.1 → §5.14 (FR-30 → FR-99, FR-270, FR-271), annexe B (matrice d'accès), annexe C
//              (contrat d'échange avec le cœur), annexe D.2 (paramètres du crédit, FR-86) ; spine AD-2 (un
//              propriétaire par objet), AD-3 (sept modules dans un service), AD-4 (machine à états du dossier),
//              AD-5 (décaissement : un ordre, une clé, un seul canal), AD-6 (échéancier contractuel, officiel,
//              Créance), AD-9 (catalogue des faits), AD-11 (bibliothèque de calcul unique), AD-12 (tout se fige au
//              dossier), AD-14 (IA : port Proposition), AD-15 (séparation des tâches), AD-16 (périmètres), AD-17
//              (piste d'audit), AD-25, AD-27, AD-28 ; épics EPIC-185 → EPIC-188 (et EPIC-190 pour l'IA) ;
//              manifestes-a-produire.md, ligne M15 et amendement du 2026-11-13.
//
// Service porteur : `prospera-imf-service` (module `credit`, spine AD-2 et AD-25, amendement du 2026-11-13 de
// manifestes-a-produire.md : le backend de démo ne compte pas, le service actuel est surtout le paquet SFD).
// Bundle : « Crédit » et « Plateforme » de l'offre microfinance (manifestes-a-produire.md, M15 : `M: Crédit,
// Plateforme`). Épics ★ février : EPIC-185, 186, 187, 188, 190 (dépôts : `prospera-imf-service`, `prospera-app`,
// `prospera-terrain` pour les visites). Propriétaire du manifeste : Dev B.
//
// Écarts relevés entre l'annexe A.1 du PRD et la spine (la spine gagne, AD-9) :
// - C5, `credit.decaissement.ordonne@1` (annexe) → `credit.ordre-decaissement.emis@1` (spine) ;
//   `credit.decaissement.inconnu@1` → `credit.ordre-decaissement.inconnu@1`.
// - C5, `credit.decaissement.declare@1` (annexe) : ABSENT du catalogue de la spine, non publié. Le canal
//   électronique est exécuté par `paiement` (`paiement.ordre-decaissement.changed@1`) et c'est `coeur-sfd` qui
//   déclare l'exécution au cœur (AD-5) ; `credit` ne déclare rien.
// - C5, `coeur-sfd.decaissement.confirme@1` → `coeur-sfd.ordre-decaissement.confirme@1` (porte `dossierId` et
//   `pretIdCoeur`, AD-27) ; `coeur-sfd.pret.solde-nul@1` → `coeur-sfd.pret.solde@1`.
// - C5, `paiement.virement.execute@1` → `paiement.ordre-decaissement.changed@1` (AD-5) ; la nouvelle PR #430 de
//   `paiement` a ses faits en `@1` (`paiement.creance.changed@1` …).
// - C5, `terrain.visite.terminee@1` → `terrain.visite.changed@1` (AD-2, AD-9 ; porte `visitePar`, AD-15).
// - C5, `risque.proposition.emise@1` : RETIRÉ de `consomme`. « Les faits des analyses d'IA ne sont pas des faits de
//   module : ce sont des Propositions » (AD-9, AD-14) ; `credit` les demande à l'instance locale de l'IA commune par
//   le port `PropositionPort`, il ne les consomme pas sur le bus.
// - C1, `depends` : l'annexe ne liste que `produits-financiers` et `microfinance` ; la spine (diagramme de
//   l'invariant, flèche `CR -->|depends| RES`) et la clause C10 de l'annexe ajoutent `reseau` (portée, AD-16) :
//   dépendance DURE, retirée de `enrichiPar` (l'annexe l'y met). Les trois dépendances sont « proposées, à valider
//   par le PO » (annexe A.1, C1).
// - C13, `objetsDeReprise: ['credit.pret-en-cours@1']` (annexe) : la spine (AD-2) dit que les objets de Reprise
//   `client`, `pret`, `echeance`, `garantie` et `compte-epargne` sont ceux de `coeur-sfd` (manifeste A.6, M47).
//   `credit` ne tient aucun prêt (« Aucun compte de prêt officiel », C3) : `objetsDeReprise` est donc `[]` ici et
//   l'objet `pret` est à déclarer chez `coeur-sfd`. À reporter dans le manifeste M47.
// - C3, « Lues seulement : … flux Mobile Money déclarés du client » : l'annexe C a un objet « Flux Mobile Money du
//   client » mais le catalogue d'AD-9 n'a aucun fait pour lui (ni `.changed`, ni `.recu`). Voir `consomme`.
//
// Hors manifeste, pour mémoire :
// - Écrans : module d'écran `credit` dans `prospera-app` (C8), `src/modules/credit/`, tous les écrans par Dev B.
//   Existants à brancher : `/credit` (tableaux RA, ROC, RSQ), `/credit/pipeline`, `/credit/dossiers`,
//   `/credit/dossiers/[id]` (frise et onglets), `/credit/analyse`, `/credit/cycle`, `/credit/reseau`. À créer :
//   demande avec simulation (dont le refinancement), onglet « Client » du dossier, demandes en attente depuis plus
//   de 48 h, rapprochement des ordres de décaissement, pièces, cautions et garanties, visites d'instruction,
//   checklist, avis, décision du ROC, séance de comité, ordre de décaissement, dérogations et délégations,
//   clôture et renouvellement, dossier de groupe. Entrées de menu par droit : `credit:dossier:consulter`,
//   `credit:demande:saisir`, `credit:comite:decider`, `credit:decaissement:autoriser`. Boutons non branchés de la
//   démo : « bientôt » (PRD-D FR-2).
// - Gate : `CREDIT_NOT_ENTITLED` (403 sans donnée, C2).
// - Cloisonnement (C2, AD-16) : par `organisationId` et par portée lue dans `reseau.portee.changed@1` : DG réseau,
//   RA son agence, CC les dossiers de son agence et sa file, ROC toutes les agences, GP son portefeuille (`gpPret`,
//   `gpClient` par défaut, AD-2), agent sa zone, RSQ et AUD en lecture, CPT son agence. Le serveur évalue seul les
//   rôles et les gardes de chaque transition. ADMIN_IMF n'a aucune portée métier. La séparation des tâches se
//   vérifie sur l'identifiant de la personne, à chaque commande (AD-15 : refus `SEPARATION_DES_TACHES`).
// - Rôles par défaut (annexe B ; l'annexe A.1 C7 nomme ceux entre parenthèses ; le reste est une PROPOSITION à
//   confirmer avec les rôles du vertical) :
//   · `credit:demande:saisir` : CC, AT, COLL, COM (A, « Demande de crédit, simulation ») ;
//   · `credit:dossier:consulter` : tous les rôles en L de la matrice (DG, DAF, ROC, RA, CC, GP, RCC, RSQ, AUD) ;
//   · `credit:dossier:instruire` : CC, AT (A, « Pièces, cautions, visites ») ;
//   · `credit:avis:rendre` : CC (D) ; `credit:avis:conseiller` : RSQ (A) ;
//   · `credit:decision:approuver` : ROC (D) ;
//   · `credit:comite:decider` : DG, ROC, RA (D, « Comité de crédit ») ; `credit:comite:composer` : DG (D) ;
//   · `credit:decaissement:ordonner` : ROC et CPT (A pour Mobile Money, PI-SPI, virement), préparateur de l'ordre
//     (FR-67) ;
//   · `credit:decaissement:autoriser` : CPT, DAF (D) ; `credit:decaissement:rapprocher` : CPT ;
//   · `credit:derogation:accorder` : ROC (FR-34, FR-47 : « dérogation motivée du ROC ») ; nouveau cycle : [À
//     CONFIRMER] ;
//   · `credit:delegation:gerer` : [À CONFIRMER] (la matrice n'a pas de ligne « délégation », FR-6) ;
//   · `credit:parametre:administrer` : DG, ROC (D, « Paramètres métier ») ; ADMIN_IMF (A) [À CONFIRMER : saisit-il
//     ou seulement le DG et le ROC, FR-86 ?] ;
//   · `credit:journal:consulter` : AUD.
//   La séparation des tâches s'ajoute à la matrice (FR-6) ; un test parcourt la matrice et vérifie chaque cellule
//   côté serveur.
// - Les données possédées (C3, AD-2) : dossiers (12 statuts + ANNULE), dossiers de groupe et sous-dossiers,
//   demandes et simulations retenues, refinancements, pièces, cautions, garanties, liens de visite d'instruction
//   `(dossierId, visiteId)`, checklists, grilles 5C, avis, décisions du ROC, séances de comité et votes,
//   échéanciers contractuels, ordres de décaissement (`ordreId`, essais numérotés, clé d'idempotence
//   `<ordreId>:<numeroEssai>`, sous-état À_ORDONNER, ORDONNE, EXECUTE, CONFIRME, INCONNU), rapprochements,
//   dérogations, délégations, résultats BIC saisis, `gpPret`, table des combinaisons interdites, piste d'audit
//   chaînée `credit_audit` (AD-17), collections préfixées `credit_` (AD-3). Lues seulement : produits
//   (`produits-financiers`), clients et KYC (`microfinance`), prêts et échéanciers officiels (projections datées de
//   `coeur-sfd`, AD-1), visites (`terrain`), Propositions de l'IA commune. Aucun compte de prêt officiel, aucune
//   caisse, aucun solde stocké comme vérité (AD-1).
// - Tout se fige au dossier (AD-12) : `produitVersionId`, `financeVersion`, `parametresVersion`, `strategieVersion`.
//   Le TEG, l'échéancier et le contrôle au pire cas viennent de `prospera-plateforme/finance` (AD-11) ; aucun
//   module ne les recalcule.
// - Paramètres (C6, annexe D.2, FR-86) : plafond d'usure daté (24 %), éligibilité (ancienneté 3 mois bloquante ;
//   seuil d'alerte de score 45, jamais un blocage), classe de risque à l'octroi (75 / 55 / 35 / 15), cautions,
//   garanties, visites, taux d'effort (alerte 33 %, plafond bloquant 40 %), endettement 50 %, règles d'alerte
//   d'instruction, comité (quorum, DG au-dessus de 5 000 000 FCFA), parties liées 10 %, méthode d'échéancier,
//   règle de renouvellement, fenêtre de rapprochement des ordres, etc. Données, jamais code ; versionnés et datés,
//   un dossier garde les valeurs en vigueur à sa décision.
// - Licence à vie et maintenance mensuelle (annexe A, préambule) : la lecture seule pour abonnement échu ne
//   s'applique pas à cette IMF ; elle reste une capacité de la plateforme pour les autres clients. Installation
//   chez l'IMF : aucune route ouverte vers l'extérieur.
// - Le Mobile Money sortant de `paiement` n'est pas dans février : le cœur fictif décaisse (spine AD-24, AD-10).
// - Essai (AD-23) : tout ordre de décaissement réel est intercepté et compté.
// - Prérequis d'installation `produits-financiers` et `microfinance` en service : ce sont les dépendances dures de
//   `depends`, que le moteur installe et contrôle (comme `catalogue` et `pdv` pour `commande`).
// - C10 : `profiles: ["credit"]` ; socle + `produits-financiers` + `microfinance` + `reseau`. Avec le cœur fictif
//   (`coeur-sfd`) installé, le dossier va de SOUMIS à EN_GESTION puis jusqu'au décaissement CONFIRME sans autre
//   module. Au compose, le service démarre dès qu'un de ses modules est activé (AD-3).

export const MANIFESTE_CREDIT = {
  code: 'credit',
  version: '1.0.0',

  // C1 : dépendances DURES, « proposées, à valider par le PO » (annexe A.1, C1) ; `reseau` vient de la spine
  // (AD-3, AD-16) et de la clause C10 (voir les écarts en en-tête) [À CONFIRMER, PO].
  depends: [
    {
      code: 'produits-financiers',
      raison:
        'Une demande vise un produit de crédit versionné ; ses bornes, son éligibilité, ses garanties et ses conditions sont figées par dossier.',
    },
    {
      code: 'microfinance',
      raison:
        'Un dossier appartient à un client (personne ou groupe solidaire) dont la fiche, le KYC et la LBC/FT sont tenus par microfinance.',
    },
    {
      code: 'reseau', // [proposition, spine AD-3 et AD-16 ; absent de la C1 de l'annexe A.1, présent en C10]
      raison: "Le périmètre de lecture (agence, zone, portefeuille) vient de la portée du réseau ; le GP est désigné au comité.",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide, jamais 0 ni absent. Un test par entrée.
  // - coeur-sfd : envoi du dossier accordé, ordre de décaissement et confirmation = `{ etat: NON_INSTALLE, module:
  //   coeur-sfd }` ; la décision du comité reste possible et fait passer le dossier à EN_GESTION (sous-état
  //   À_ORDONNER), mais l'ordre de décaissement est REFUSÉ (`COEUR_NON_INSTALLE`) : le dossier reste « en attente
  //   de décaissement », hors encours, et peut être annulé (FR-38). Le cœur fictif crée le prêt et l'échéancier
  //   officiel à l'exécution de l'ordre, pas à l'acceptation du dossier accordé (annexe C) ;
  // - paiement : canaux Mobile Money et PI-SPI = `NON_INSTALLE` ; les canaux du cœur restent ;
  // - notification : cloche interne seule ; SMS, WhatsApp, e-mail = `NON_INSTALLE` ;
  // - terrain : visites saisies depuis le web, pas d'hors ligne = `NON_INSTALLE` ;
  // - risque-par : part du secteur dans le portefeuille = `NON_EVALUE` ;
  // - ia-commune : tous les emplacements d'IA (score, décision suggérée, analyse narrative, analyse étendue,
  //   alertes IA, conditions optimales, étoiles, sentiment) = `NON_DISPONIBLE` ; le dossier avance sur l'analyse
  //   humaine, jamais bloqué (FR-8, AD-14) ;
  // - recouvrement : statut de retard = `NON_INSTALLE` ;
  // - assurance : garde « assurance souscrite » non remplie si le produit l'impose.
  // Écart : `NON_EVALUE` et `NON_DISPONIBLE` sont les états écrits par l'annexe A.1, C4, à côté de `NON_INSTALLE`
  // [À CONFIRMER avec C4 : le contrat ne connaît que `NON_INSTALLE`].
  // ⚠️ `ia-commune` retiré de `enrichiPar` (harmonisation du lot 3, 2026-11-13) : l'annexe A l'écrit comme un
  // module, mais ce n'est pas un code du catalogue ; c'est le port Proposition de la spine (AD-14), service
  // porteur à cadrer. Un code inconnu ferait échouer la validation des manifestes. Son absence se traite
  // comme le dit C4 ci-dessus (règle v0 ou « indisponible »).
  enrichiPar: [
    'coeur-sfd',
    'paiement',
    'notification',
    'terrain',
    'risque-par',
    'recouvrement',
    'assurance', // [proposition, annexe A.1 C4 la cite, la C1 ne la liste pas]
  ],

  // Aucun numéro de compte ici : le crédit ne passe aucune écriture (le grand livre est celui du cœur, AD-1).
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.1) ; le code `credit` n'a pas de tiret.
  // Chaque droit demande une PR `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'credit:demande:saisir', // demande avec simulation, brouillon hors ligne (FR-32 → FR-38)
    'credit:dossier:consulter', // lecture sous portée (FR-30)
    'credit:dossier:instruire', // pièces, cautions, garanties, visites, checklist, grille 5C (FR-39 → FR-50)
    'credit:avis:rendre', // avis du CC (FR-51)
    'credit:avis:conseiller', // avis consultatif du risque, RSQ (FR-52)
    'credit:decision:approuver', // décision du ROC (FR-54, FR-55)
    'credit:comite:decider', // vote du comité (FR-56 → FR-60)
    'credit:decaissement:ordonner', // préparer l'ordre (FR-64)
    'credit:decaissement:autoriser', // CPT, DAF (FR-67)
    'credit:decaissement:rapprocher', // CPT : ordre INCONNU (FR-71)
    'credit:comite:composer', // DG : composition du comité d'un dossier (décision P6)
    'credit:derogation:accorder', // éligibilité, taux d'effort, plafond de dossier, nouveau cycle (tracée)
    'credit:delegation:gerer', // délégation datée et motivée (FR-6)
    'credit:parametre:administrer', // paramètres du crédit (FR-86)
    'credit:journal:consulter', // AUD : piste d'audit (FR-9)
  ],

  // C5 : faits publiés et consommés. Source : catalogue de la spine, AD-9 (qui corrige l'annexe A.1, C5). Chaque
  // fait d'objet porte l'identifiant stable de l'objet, l'`organisationId` et un `rang`. Toute quantité d'argent est
  // un couple (entier, devise), unité mineure (AD-13).
  publie: [
    'credit.dossier.changed@1', // état absolu du dossier
    'credit.dossier.soumis@1',
    'credit.dossier.accorde@1', // conditions figées et échéancier contractuel : `coeur-sfd` l'envoie, `paiement` ouvre les Créances (AD-6)
    'credit.dossier.refuse@1',
    'credit.dossier.annule@1', // message d'annulation vers le cœur, avec accusé
    'credit.dossier.cloture@1',
    'credit.ordre-decaissement.emis@1', // spine ; l'annexe écrit `credit.decaissement.ordonne@1` ; `ordreId`, `numeroEssai`, canal
    'credit.ordre-decaissement.inconnu@1', // spine ; l'annexe écrit `credit.decaissement.inconnu@1` ; à rapprocher avant toute réémission
    'credit.derogation.accordee@1',
    'credit.alerte-audit.emise@1',
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock et commande] export, effacement
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'essai.horloge.changed@1', // [proposition, spine AD-30 : horloge pilotée de l'espace d'essai ; absent de la C5 de l'annexe A.1]
    'produits-financiers.produit.publie@1', // version figeable par dossier (AD-12)
    'produits-financiers.parametre-reglementaire.changed@1', // [proposition, spine AD-28 : plafond d'usure daté, lu par tous ; absent de la C5]
    'microfinance.client.changed@1', // identité du cœur, `lueLe`, `creePar`, `valideePar` (AD-2, AD-15)
    'microfinance.kyc.changed@1', // état neutre ; `credit` relit la route de microfinance à DOSSIER_COMPLET et à ORDONNE (AD-2)
    'microfinance.groupe.changed@1', // [proposition, FR-72 dossier de groupe ; fait du catalogue AD-9, absent de la C5]
    'coeur-sfd.ordre-decaissement.confirme@1', // spine ; l'annexe écrit `coeur-sfd.decaissement.confirme@1` ; porte `dossierId` et `pretIdCoeur` (AD-27)
    'coeur-sfd.ordre-decaissement.rejete@1', // [proposition, AD-5 : sous-état sur `coeur-sfd.ordre-decaissement.*` ; absent de la C5]
    'coeur-sfd.pret.changed@1',
    'coeur-sfd.pret.solde@1', // spine ; l'annexe écrit `coeur-sfd.pret.solde-nul@1` ; clôture du dossier (FR-76)
    'coeur-sfd.echeancier.changed@1', // [proposition, C3 : échéancier officiel lu, alerte d'écart FR-61 ; absent de la C5]
    'coeur-sfd.envoi.etat@1', // [proposition, AD-9 : état d'envoi du dossier accordé et accusé d'annulation ; absent de la C5]
    'coeur-sfd.epargne.changed@1', // [proposition, C3 : mouvements du compte du client, onglet « Client » (FR-48, FR-270) ; absent de la C5 ; AD-2 ne liste que prêts et échéanciers pour `credit` : à trancher]
    'paiement.ordre-decaissement.changed@1', // spine AD-5 ; l'annexe écrit `paiement.virement.execute@1` ; états EN_COURS, EXECUTE, REJETE, INCONNU
    'paiement.creance.changed@1', // [proposition, spine AD-6 : `montantExigible` et `lueLe`, jamais recalculés par `credit` ; absent de la C5]
    'terrain.visite.changed@1', // spine ; l'annexe écrit `terrain.visite.terminee@1` ; porte `visitePar`
    'recouvrement.dossier.changed@1', // statuts de retard lus (second axe, AD-4)
    'recouvrement.credit.bloque@1', // [proposition, FR-34 : le blocage de recouvrement est un blocage automatique ; fait du catalogue AD-9, absent de la C5]
    'recouvrement.credit.debloque@1', // [proposition, idem]
    'reseau.portee.changed@1', // C2, AD-16
    // Sans fait du catalogue d'AD-9 (aucun nom ne se consomme hors catalogue) : le « Flux Mobile Money du client »
    // (annexe C, objet facultatif) et la « part du secteur dans le portefeuille » de `risque-par` [À CONFIRMER :
    // fait à ajouter au catalogue par une PR qui amende AD-9, ou lecture par route].
  ],

  profilCompose: 'credit',

  // C13, point 1 : l'annexe A.1 écrit « `produits-financiers` et `microfinance` en service » : ce sont les
  // dépendances dures de `depends`. Reste le plafond d'usure daté, qui est une DONNÉE livrée par la ligne de
  // version et validée par le DG (spine AD-28).
  prerequis: [
    {
      code: 'plafond-usure-publie', // [proposition, nom du code]
      description:
        "Plafond d'usure daté publié pour le pays et la catégorie d'institution de l'IMF (24 % par an par défaut, annexe D.1), validé par le DG",
      action:
        "Faire valider le paramètre réglementaire par le DG dans `produits-financiers` (AD-28, FR-195), puis relancer la vérification.",
    },
  ],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Codes de
  // l'annexe A.1 ; noms de routes proposés (convention commune de l'annexe A : `verifications/<code>`).
  verifications: [
    {
      code: 'usure-bloquante',
      route: 'POST /api/v1/instance/credit/{organisationId}/verifications/usure-bloquante',
      critere:
        "Un produit d'essai au TEG supérieur au plafond d'usure est refusé aux trois points : simulation, comité, décaissement : 🟢 ; refusé à deux points sur trois ou moins 🔴 avec le point manquant (FR-10, FR-36).",
    },
    {
      code: 'echeancier-concordant',
      route: 'POST /api/v1/instance/credit/{organisationId}/verifications/echeancier-concordant',
      critere:
        "Échéancier d'un dossier d'essai : somme des capitaux = capital accordé, écart 0 FCFA, et simulation et échéancier du comité concordent : 🟢 ; sinon 🔴 avec l'écart en FCFA (FR-61, AD-11).",
    },
    {
      code: 'statuts-et-transitions',
      route: 'POST /api/v1/instance/credit/{organisationId}/verifications/statuts-et-transitions',
      critere:
        "Statuts du chemin nominal atteints dans l'ordre sur un dossier d'essai, sous-état de décaissement de À_ORDONNER à CONFIRME, et une transition absente des deux tables de FR-78 refusée (`TRANSITION_INTERDITE`) : 🟢 ; sinon 🔴 avec la transition en cause (AD-4).",
    },
    {
      code: 'decaissement-rapproche',
      route: 'POST /api/v1/instance/credit/{organisationId}/verifications/decaissement-rapproche',
      critere:
        "Un ordre d'essai sans réponse passe INCONNU, n'est pas réémis avant son rapprochement et garde sa clé d'idempotence `<ordreId>:<numeroEssai>` : 🟢 ; sinon 🔴 (AD-5, FR-71).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.1). Désinstaller ne supprime rien :
  // dossiers, journal, échéanciers contractuels restent stockés et masqués ; test aller-retour. Les ordres de
  // décaissement déjà exécutés restent valides chez le cœur.
  avertissementDesinstallation:
    'Plus aucun dossier de crédit ne sera saisissable ni décidé ; les prêts déjà décaissés restent tenus par le cœur.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. La forme du journal et
  // de l'échéancier contractuel ne change jamais dans la fenêtre de sept jours ; un statut ou un sous-état ajouté
  // est lu comme inconnu par la version précédente. L'image de `prospera-imf-service` est une seule : son
  // `retourArriere` est le plus restrictif de ses modules (spine AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/credit/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // `analyse-etendue` (six volets, éteint tant que les sources macro d'un pays ne sont pas paramétrées),
  // `avis-du-risque-obligatoire`, `echeancier-methode-par-produit`. Comportement seulement, jamais la forme des
  // données.
  interrupteurs: ['analyse-etendue', 'avis-du-risque-obligatoire', 'echeancier-methode-par-produit'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (consultation, journal, export, annexe A.1, C13). Aucun
  // nom de route de crédit n'est donné par le PRD ni la spine : TOUS ces noms sont des propositions, à figer
  // par la story d'API (EPIC-185). Capacité de la plateforme ; la lecture seule pour abonnement échu ne
  // s'applique pas à cette IMF (licence à vie).
  routesLectureSeule: [
    'GET /api/v1/credit/dossiers', // [proposition]
    'GET /api/v1/credit/dossiers/{id}', // [proposition]
    'GET /api/v1/credit/journal', // [proposition, `credit:journal:consulter`]
    'GET /api/v1/instance/credit/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/credit/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/credit/{organisationId}/export',
    import: 'POST /api/v1/instance/credit/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/credit/{organisationId}/effacement', // tracé, avec certificat
    sante: 'GET /api/v1/instance/credit/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : aucun objet repris par `credit`. L'annexe A.1 (C13)
  // écrit `['credit.pret-en-cours@1']` ; la spine (AD-2) attribue l'objet `pret` à `coeur-sfd` (voir les écarts en
  // en-tête). Les prêts en cours se reprennent selon la partie 3b (import du portefeuille) chez `coeur-sfd`.
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : l'annexe A.1 (C13) déclare `credit.dossiers-accordes`
  // (`MOUVEMENT`, `argent: true`, `controle: true`, publie `credit.dossier.accorde@1`), un seul point d'écriture,
  // identifiant stable ; le propriétaire de l'argent reste le cœur [À CONFIRMER avec la partie 3b]. Hors février
  // (Connecteurs hors février) : l'envoi du dossier accordé passe par `coeur-sfd` et son `TransportCoeur` (AD-7).
  // Un domaine `controle` exige les valeurs de contrôle de ses objets (contrat, amendement du 2026-11-12) ; le
  // schéma d'objet ci-dessous n'est pas nommé par l'annexe.
  domainesEchange: [
    {
      code: 'credit.dossiers-accordes',
      objets: ['credit.dossier-accorde@1'], // [proposition, nom du schéma d'objet ; `contrats/objets/credit/`]
      sorte: 'MOUVEMENT',
      argent: true,
      controle: true,
      niveauParDefaut: 'IMMEDIAT', // [proposition] annexe C : « à la décision du comité (5 min avec une API ; sinon heure) »
      cleLibelleAction: 'credit.echange.dossiers-accordes', // [proposition, même forme que `stock.echange.mouvements`]
      publie: ['credit.dossier.accorde@1'],
    },
  ],

  // C11 : le crédit SPÉCIFIE ces capacités (FR-49, FR-53, FR-74, FR-95 à FR-99) ; le moteur est l'IA commune
  // (module Risque et agents métier) : une instance locale chez l'IMF prédit, enregistre l'écart entre ses
  // prédictions et ce qui se passe, anonymise, renvoie ces écarts pour l'apprentissage et reçoit ses mises à
  // jour par un tunnel sécurisé sortant (PRD moteur ; spine AD-14). Le crédit définit les entrées, les sorties et
  // l'affichage ; il ne calcule aucun score lui-même et n'appelle aucun modèle : il passe par le port
  // `PropositionPort`. Le score est une information et une alerte, jamais un refus ni un prix en v1. Provenance
  // affichée : règle ou modèle, version, date, données utilisées ; règle explicable (v0) tant que le modèle
  // n'existe pas (défaut, annexe D). L'IA propose, le CC, le ROC et le comité décident ; la décision suggérée
  // s'affiche au CC après son premier avis ; un écart exige un motif renvoyé comme correction ; aucune donnée ne
  // sort sans consentement « IA commune » et sans que le registre de l'agent couvre la finalité. Genre, situation
  // matrimoniale, nationalité et religion n'entrent jamais dans un score. Les noms de modèles et de finalités
  // sont des propositions (annexe A, préambule).
  ia: {
    modeles: [
      'score-dossier',
      'decision-suggeree',
      'analyse-dossier',
      'analyse-macro-sectorielle',
      'detection-fraude-dossier',
      'comportement-de-credit',
      'perte-attendue-dossier',
      'cohesion-groupe',
      'recommandation-conditions',
    ],
    finalites: [
      'aide-a-la-decision-credit',
      'analyse-du-dossier',
      'detection-des-alertes',
      'analyse-sectorielle-et-macro',
      'recommandation-de-produit',
      'proposition-au-roc',
    ],
  },
} as const;
