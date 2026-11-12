// Manifeste M34 — Canaux & notifications (WhatsApp, SMS, e-mail) (format du contrat de module, clause C1,
// amendée le 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories (décision du PO du 2026-11-11, réponse 7 au §9 de l'amendement du plan v3).
// Rétro-saisie : le module est CODÉ (Module 1 + rails B, D, F livrés). Ce manifeste décrit ce que
// `prospera-notification-service` fait sur origin/dev (f9b179d, MNV-607) ; le PRD dit ce qu'il doit faire.
// Le propriétaire du dépôt le copie dans `src/module.manifest.ts` la semaine où il y travaille ; une garde de
// test compare ensuite le fichier du dépôt à la copie du catalogue (C1).
// Références : PRD prds/prd-notification-service-2026-08-02 (FR-N01 → …, NFR-1 → NFR-7, §9 conservation) ;
//              spine architecture/architecture-notification-service-2026-08-03 (AD-1 → AD-19) ;
//              épics epics-notification-2026-08-04.md ; STORY-650/651 (délégation), STORY-649 (consommation
//              facturée), STORY-728 (Money Vibes détient `notification` à l'amorçage) ;
//              spine de Connecteurs (trois modèles d'alerte de panne).
//
// Hors manifeste, pour mémoire :
// - Offre : transverse, non vendu seul [À CONFIRMER] ; présent dans les quatre verticales.
// - ⚠️ `notification` n'est PAS semé au catalogue (`modules.seed-data.ts`) : la recette le déclare à la main
//   avant l'octroi. EPIC-143 (chargement des manifestes) le corrige.
// - DEUX RÉGIMES (PRD §1.3), un seul module :
//   · les messages du SYSTÈME (vérification d'e-mail, invitation, réinitialisation, KYC, messages de
//     paiement) arrivent par le chemin des appelants de service (`auth-service`, `expert-comptable`,
//     `paiement-service`, chacun limité à ses clés de message) ; ils portent des secrets et ne passent
//     JAMAIS par Kafka (AD-2). Ils partent sous l'entitlement de l'organisation Money Vibes, qui détient
//     `notification` dès l'amorçage (STORY-728) : un client qui n'a pas acheté le module reçoit quand même
//     son e-mail de vérification ;
//   · les messages du CLIENT (modèles, envois, envois de masse, carnet, réponses) : ce que le module vend.
// - Écrans : module d'écran `notification` dans `prospera-app` (C8), tous les écrans par Dev B. La cloche
//   (`/cloche`) est un écran de la coque, ouvert à tout membre [À CONFIRMER].
// - C11 : sans objet. Le statut « lu » porte toujours son niveau de certitude (NFR-1) ; aucune décision
//   automatique ne se prend dessus.
// - Gate existante : `NOTIFICATION_NOT_ENTITLED` (e-mail vérifié → KYC → entitlement `notification`), plus
//   les droits lus dans `perms` (inventaire typé `droits-notification.ts`, aucun nom de rôle sur le chemin
//   d'autorisation, STORY-572). ⚠️ Écarts : la garde lit `entitlement.changed`, pas l'état publié (C2,
//   AD-24) ; aucune route `instance/notification/…` (C13) ; aucun profil compose (C10) ; la porte plateforme
//   lit encore `tenantId === null` alors que l'opérateur Money Vibes est un MEMBRE de son organisation
//   (STORY-650).
// - Droit de PLATEFORME (catalogue plateforme, 4 copies à l'octet près) : `notification:delegation:configurer`
//   (Money Vibes arme la notification POUR un client, rien n'est masqué au client, STORY-651). Il ne figure
//   pas dans `droits` ci-dessous.
// - Un modèle client n'est pas un programme (AD-8) : substitution de variables déclarées, pas de helper.
// - Trois files distinctes (transactionnel, masse, …) : la file se déduit de la nature de l'envoi, jamais
//   du choix de l'appelant (NFR-3 : un code de vérification ne passe pas derrière 50 000 messages).

export const MANIFESTE_NOTIFICATION = {
  code: 'notification',
  version: '1.0.0',

  depends: [],

  // C4 : rien. Le module ne lit aucun module métier : ce sont eux qui l'appellent. Ses déclencheurs sont une
  // liste FERMÉE de faits du socle (identité, KYC, entitlement), MNV-607.
  enrichiPar: [],

  referentielFamilies: [],

  // C7 : les six droits de tenant DÉJÀ au catalogue (`TenantPermission`, auth-service) et lus par le
  // service. L'export de l'organisation reste réservé à instance:donnees:exporter.
  droits: [
    'notification:modele:rediger', // modèles, versions, essais, segments
    'notification:envoi-de-masse:executer', // préparer et lancer une campagne
    'notification:envoi-de-masse:valider', // la valider avant exécution (deux personnes)
    'notification:journal:consulter', // journal d'envoi, accusés, activité, consommation, export
    'notification:canal:administrer', // passerelles (SMS, WhatsApp, e-mail), domaines, marque, garde-fous
    'notification:donnees:administrer', // carnet, listes, désabonnements, droits des personnes, rétention
  ],

  // C5 : faits publiés et consommés, tels qu'ils existent sur origin/dev (outbox ; topics sans suffixe de
  // version). Les faits d'envoi sont aussi remis à la destination du client (`/sorties`, rejouables).
  publie: [
    'notification.envoi.delivre',
    'notification.envoi.echoue',
    'notification.envoi.lu', // jamais sans son `niveauCertitude` (NFR-1, AD-5)
    'notification.reponse.recue', // rattachée à un envoi, avec son niveau de certitude (AD-10)
    'notification.desabonnement.enregistre',
    'notification.consommation.arretee', // arrêté de période, facturé par paiement (STORY-649)
    'instance.journal@1', // à ajouter (le journal des actes de configuration existe depuis STORY-651)
  ],
  consomme: [
    'etat-publie.changed.essai@1', // à brancher (C2, AD-24 du moteur) ; remplace `entitlement.changed`
    'etat-publie.changed.reel@1',
    'entitlement.changed', // read-model ET déclencheur
    'kyc.status.changed',
    'identity.org.created',
    'identity.org.updated',
    'identity.user.registered',
    'identity.user.updated',
    'identity.user.suspended',
    'identity.membership.changed',
  ],

  profilCompose: 'notification',

  // C13, point 1 : aucun canal n'est un prérequis de démarrage (NFR-6). Une passerelle absente rend le
  // canal indisponible, pas le module.
  prerequis: [],

  verifications: [
    {
      code: 'canal-utilisable',
      route: 'POST /api/v1/instance/notification/{organisationId}/verifications/canal-utilisable',
      critere:
        "Canaux dont la passerelle est configurée et vérifiée (ou la passerelle de Money Vibes par défaut) : ≥ 1 🟢 ; 0 🟠 « aucun envoi du client ne partira » (les messages du système partent quand même).",
    },
    {
      code: 'sorties-interceptees-en-essai',
      route: 'POST /api/v1/instance/notification/{organisationId}/verifications/sorties-interceptees-en-essai',
      critere:
        "Dans l'espace d'essai, envoi d'épreuve vers un destinataire réel : intercepté et compté, refus `ECRITURE_REELLE_DEPUIS_ESSAI`, 🟢 ; remis à une passerelle 🔴 (C13 point 6). Dans le réel : sans objet.",
    },
    {
      code: 'purge-a-jour',
      route: 'POST /api/v1/instance/notification/{organisationId}/verifications/purge-a-jour',
      critere:
        "Envois et variables au-delà de la durée de conservation de la politique de rétention (§9.2 du PRD) : 0 🟢 ; ≥ 1 🟠 avec leur nombre (la purge est en retard).",
    },
  ],

  avertissementDesinstallation:
    "Carnet, modèles, journal d'envoi et consentements restent enregistrés ; vos envois et campagnes s'arrêtent. Les messages du système (vérification d'e-mail, invitations, alertes de paiement) continuent de partir.",

  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/notification/migrer', // à créer
  interrupteurs: [],

  // C2, C13 point 5 : en LECTURE_SEULE, le journal et les preuves d'envoi restent lisibles ; les droits des
  // personnes et le désabonnement restent ouverts : ce sont des obligations légales, pas des envois.
  routesLectureSeule: [
    'GET /api/v1/instance/notification/{organisationId}/export',
    'GET /api/v1/envois',
    'GET /api/v1/envois/{id}',
    'GET /api/v1/envois/export',
    'POST /api/v1/envois/{id}/attestation', // attestation d'envoi : une preuve, pas un envoi
    'GET /api/v1/consommation',
    'GET /api/v1/retention/export',
    'POST /api/v1/droits-des-personnes/restitution',
    'POST /api/v1/droits-des-personnes/rectification',
    'POST /api/v1/droits-des-personnes/effacement',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/notification/v1/… devant). À créer.
  // Restent hors gate : désabonnement par jeton, réponses entrantes et webhooks des passerelles (jeton ou
  // signature), et le chemin des appelants de service (identité de service, limitée à ses clés).
  routesInstance: {
    export: 'GET /api/v1/instance/notification/{organisationId}/export',
    import: 'POST /api/v1/instance/notification/{organisationId}/import',
    effacement: 'POST /api/v1/instance/notification/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/notification/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}',
  },

  // Aucun objet de reprise : les contacts d'un distributeur arrivent avec ses points de vente (pdv) et ses
  // commerciaux (reseau). Le carnet garde son import de fichier (`contacts/import`, aperçu d'abord) ; les
  // consentements passés ne se reprennent pas sans leur preuve [À CONFIRMER].
  objetsDeReprise: [],

  // Aucun domaine d'échange : un message envoyé n'est l'objet d'aucun autre logiciel.
  domainesEchange: [],
} as const;
