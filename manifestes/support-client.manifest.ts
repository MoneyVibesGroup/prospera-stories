// Manifeste M03 — Support client et CRM interne (format du contrat de module, clause C1, amendée le 2026-11-10,
// le 2026-11-11 et le 2026-11-12).
// ⚠️ MANIFESTE MINIMAL. Le PRD distributeur ne donne AUCUNE exigence fonctionnelle à ce module (§6.9 : « hors de
// ce PRD, à cadrer au lot 4 » ; aucun FR posé, aucun numéro réservé) ; la démo n'a aucun écran de support ; le PRD
// microfinance (FR-251) l'inscrit de la même façon « pour la complétude », sans écran au premier jour. Tout ce
// qui suit vient de la seule ligne de l'annexe A.16 (liens « proposés, modifiables ») et du catalogue des faits de
// la spine (AD-20, ligne `support-client.dossier.changed@1`). Ce manifeste réserve le code, le service, les
// droits et les faits ; il n'invente ni écran, ni règle, ni modèle. Chaque `[proposition]` ci-dessous est à
// confirmer au cadrage du module.
// Sources : prds/prd-distributeur-2026-11-12/prd.md §6.9 et annexe A.16 ; architecture/architecture-distributeur-2026-11-13
//           (AD-1 propriétaires, AD-15 noyau neutre, AD-20 catalogue des faits) ; PRD microfinance FR-251 ;
//           CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13). Le code `support-client` existe au catalogue, déprécié : à
//           réactiver.
//
// ⚠️ CODE À TIRET. `support-client` ne passe pas le format de droit actuel d'`auth-service`
// (`^[a-z]+:[a-z-]+:[a-z]+$`). Ses droits sont écrits dans la forme ÉLARGIE `^[a-z-]+:[a-z-]+:[a-z]+$`
// (amendement C7 du 2026-11-11). La story `auth-service` qui élargit le format se livre AVANT LA SEMAINE 5 : sans
// elle, CE MODULE NE PEUT PAS DÉCLARER UN SEUL DROIT (PRD distributeur, annexe A.17, point 1). Le profil de
// compose et les routes gardent le tiret du code ; seule la gate le remplace par `_`.
//
// Hors manifeste, pour mémoire :
// - Offre : aucun bundle commercial [À CONFIRMER] ; quatre verticales [À CONFIRMER, M03] (distributeur,
//   microfinance, assurance, cabinet), un seul code et un seul contrat (AD-15).
// - Gate : `SUPPORT_CLIENT_NOT_ENTITLED` (403 sans donnée, lecture de l'état publié seul, C2).
// - Service porteur : `prospera-croissance-service` :3416 (spine AD-1 : `marketing`, `studio-social`,
//   `support-client`), sous `src/modules/support-client/`. L'annexe A.16 et la ligne M03 de
//   `manifestes-a-produire.md` nomment `support-crm-service` [à créer] : ÉCART, voir le rapport ; la spine fait foi
//   (AD-1, §Services) et le nom `support-crm-service` est abandonné à la confirmation du propriétaire du dépôt.
// - Écrans : aucun. Module d'écran `support-client` dans `prospera-app` (C8) à concevoir ; hors février. Tant qu'il
//   n'est pas livré, ses entrées de menu n'existent pas ; les compteurs qui s'y rattachent ailleurs (« tickets
//   d'incident » du contrôle quotidien du ROC chez l'IMF, FR-251/FR-273) affichent « non installé », jamais 0.
//   Aucun bouton ne simule une action (PRD distributeur FR-2).
// - Rôles : à attribuer au cadrage (annexe B.2 : « attribués au cadrage du module, écrans à concevoir »).
// - Distinction à ne pas faire : le support que Money Vibes rend à un client (incident, mise à jour) passe par le
//   tunnel ouvert par le client (moteur d'installation), PAS par ce module (PRD microfinance FR-251). La console
//   d'administration de Money Vibes devenue CRM interne est une affaire de la plateforme (PRD distributeur §6.9).
// - Données possédées (C3) : dossiers de support (réclamation, litige de livraison, facture contestée, et leurs
//   équivalents d'autres verticales), échanges, statuts. Données proposées, modifiables. Lues seulement :
//   tiers (`pdv` ou, ailleurs, le module de clients de la verticale), commandes, factures.
// - Paramètres (C6, des données, jamais du code) : types de dossier, délais de réponse, modèles de réponse.
// - Vocabulaire (AD-15) : tiers = point de vente, membre ou assuré ; le libellé affiché vient du tableau de la
//   verticale (`prospera-plateforme/vocabulaires/<verticale>.json`), jamais d'un test « si distributeur ».
// - Démarrer seul (C10) : `profiles: ["support-client"]` ; socle seul.
// - Migrations (C12) : `SANS_PERTE`, aucun interrupteur.
// - Cloisonnement (C2) : par `organisationId`. Piste d'audit `support-client_audit` en ajout seul (AD-21).

export const MANIFESTE_SUPPORT_CLIENT = {
  code: 'support-client',
  version: '1.0.0',

  // C1, annexe A.16 : aucune dépendance dure.
  depends: [],

  // C4 : chaque module lié absent rend le lien du dossier `{ etat: NON_INSTALLE, module }`, jamais 0 ni absent ;
  // un test par dépendance. Liens proposés (annexe A.16, « aucune source du distributeur ne décrit ce module »).
  // - pdv : fiche du client concerné (distributeur) ;
  // - commande : commande en cause ;
  // - facturation : facture contestée ;
  // - entrepot : litige de livraison (`entrepot.litige.ouvert@1`) ;
  // - notification : réponse au client par le canal choisi (appel sortant, pas un fait consommé).
  // Chez les autres verticales, le même rôle est tenu par le module de clients de la verticale
  // (`microfinance`, `assurance`) : [proposition, non écrite par les PRD microfinance et assurance, qui ne posent
  // aucune exigence ; à trancher au cadrage].
  enrichiPar: ['pdv', 'commande', 'facturation', 'entrepot', 'notification'],

  // Aucun numéro de compte ici : le module ne passe aucune écriture.
  referentielFamilies: [],

  // C7, forme ÉLARGIE (voir l'avertissement en tête). Annexe A.16 : trois droits. Chaque droit demande en outre
  // une PR `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'support-client:dossier:ouvrir', // ouvrir un dossier (réclamation, litige, facture contestée)
    'support-client:dossier:traiter', // répondre, changer le statut, joindre un échange
    'support-client:dossier:cloturer', // clore un dossier
  ],

  // C5 : faits publiés et consommés. Noms de l'annexe A.16 et de la spine (AD-20). Chaque fait d'objet porte
  // l'identifiant stable de l'objet, l'`organisationId` et un `rang`.
  publie: [
    'support-client.dossier.changed@1', // état absolu du dossier ; seul fait métier du module
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] export, effacement, actes de configuration
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'pdv.point-de-vente.changed@1', // fiche du client (annexe A.16)
    'commande.commande.changed@1', // commande en cause (annexe A.16)
    'facturation.facture.changed@1', // facture contestée (annexe A.16)
    // Proposition, hors de la ligne C5 de l'annexe A.16 : `entrepot.litige.ouvert@1` (AD-20) ouvre « litige de
    // livraison » dans `enrichiPar`. À confirmer au cadrage avant de l'ajouter en version mineure.
  ],

  profilCompose: 'support-client',

  // C13, point 1 : aucun prérequis.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré. Annexe A.16 : `dossier-cree`.
  verifications: [
    {
      code: 'dossier-cree',
      route: 'POST /api/v1/instance/support-client/{organisationId}/verifications/dossier-cree',
      critere:
        "Un dossier d'essai se crée puis se relit à l'identique : 1 sur 1 🟢 ; sinon 🔴 avec l'étape en échec (annexe A.16, C13).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.16). Rien n'est supprimé.
  avertissementDesinstallation: 'Les dossiers ouverts ne seront plus suivis.',

  // C12 : format lisible par la version précédente pendant 7 jours. Annexe A.16 : `interrupteurs: []`.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/support-client/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (annexe A.16 : consultation, export). Toute écriture
  // rend 403 `ABONNEMENT_EXPIRE`. Noms de routes proposés, figés par l'épic du module quand il sera cadré.
  routesLectureSeule: [
    'GET /api/v1/instance/support-client/{organisationId}/export',
    'GET /api/v1/support-client/dossiers', // [proposition]
    'GET /api/v1/support-client/dossiers/{id}', // [proposition]
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/support-client/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/support-client/{organisationId}/export',
    import: 'POST /api/v1/instance/support-client/{organisationId}/import', // sa part du dossier d'installation
    effacement: 'POST /api/v1/instance/support-client/{organisationId}/effacement', // tracé, avec certificat ; les échanges peuvent contenir des données de personnes
    sante: 'GET /api/v1/instance/support-client/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 : aucun objet repris (annexe A.16, C13).
  objetsDeReprise: [],

  // C1, amendement du 2026-11-12 : aucun domaine d'échange (annexe A.16, C13).
  domainesEchange: [],

  // C11 : PAS de champ `ia`. Annexe A.16 : « sans objet : aucun modèle n'est promis par l'offre pour ce module ».
  // Tout résumé automatique de dossier ou toute réponse suggérée ouvrirait la clause : il faudrait alors déclarer
  // `ia` et demander une Proposition par `PropositionPort` de l'IA commune (spine AD-19), avec provenance.
} as const;
