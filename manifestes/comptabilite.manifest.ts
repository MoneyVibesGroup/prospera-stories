// Manifeste du module `comptabilite` — comptabilité générale (format du contrat de module, clause C1, amendée le
// 2026-11-10, le 2026-11-11 et le 2026-11-12).
// Source : prospera-stories, `manifestes/comptabilite.manifest.ts` (STORY-958, 2026-11-17). Le service en garde une
// copie à l'octet dans `src/module.manifest.ts` ; `src/module.manifest.spec.ts` la vérifie.
// Références : epics-comptabilite-2026-08-27.md (EPIC-111 → 120, Q1 → Q4) ; PLAN-4-SESSIONS-LOT-3-2026-11-17.md §3
//              (D-L3-4) ; STORY-422 (référentiel du dossier) ; spine du moteur AD-17, AD-24 (état publié) ;
//              spine de l'IA commune AD-1, AD-5 (proposition, jamais décision).
//
// Hors manifeste, pour mémoire :
// - Code NEUF, sans numéro M (la liste `manifestes-a-produire.md` s'arrête avant la décision du PO du 2026-08-27 qui
//   sort la comptabilité des fondations différées). À ne pas confondre avec M22 `finance-transactions` (les
//   transactions et les ordres de paiement, hors février), qui ne passe aucune écriture de grand livre.
// - Service porteur : `prospera-comptabilite-service`, port de développement 3420 (D-958-1 : 3417 et 3418 sont à
//   l'IA commune, 3419 à `reseau-service`).
// - Données par DOSSIER et par EXERCICE (`dossierId`, `exerciceId` dans l'URL, résolus par `dossier-service` avec le
//   jeton du membre : hors portée = 404). dossier-service est du socle, pas un module : il n'entre pas dans `depends`.
// - Q1 (D-L3-4) : un exercice est tenu aux cahiers (balance) OU au journal (ce module), jamais les deux (STORY-959).
// - Q2 (D-L3-4) : le brouillard est validé avant toute balance publiée (STORY-964, 967).
// - Q3 (D-L3-4) : la piste d'audit distingue « proposé par la machine » de « choisi par l'utilisateur » dès le socle
//   (`provenance` de chaque entrée, STORY-958). C11 : les capacités d'IA (EPIC-117, 118) viendront de
//   `prospera-ia-service` ; aucune n'est déclarée tant qu'elles ne sont pas dans un lot.
// - Droits (C7) : DÉCLARÉS et ATTRIBUÉS depuis STORY-971 (auth-service, catalogue de tenant, hors du jeton) : le
//   rôle `CAB_ASSOCIE` reçoit les neuf, `CAB_COLLABORATEUR` six (ni `exercice:ouvrir`, ni `journal:administrer`, ni
//   `exercice:cloturer`). Le service les lit par `GET /moi/droits` (`droits ∪ droitsHorsJeton`), jamais dans le jeton.
//   Toute route qui écrit déclare le sien (`comptabilite:exercice:ouvrir` pour ouvrir un exercice,
//   `comptabilite:ecriture:saisir` pour saisir, corriger ou abandonner un brouillard depuis STORY-962 et 964,
//   `comptabilite:ecriture:valider` pour valider et contre-passer depuis STORY-964, et pour publier la balance depuis
//   STORY-967), sinon elle est fermée. La vérification de la piste chaînée exige `comptabilite:piste:consulter`
//   (STORY-964), le grand livre et les balances publiées `comptabilite:dossier:consulter` (STORY-966, 967). Pas de
//   séparation des pouvoirs au niveau de l'acteur (D-964-7) : la piste dit qui a saisi, qui a validé, qui a publié.
//   Créer un tiers exige `comptabilite:tiers:administrer` ; les lectures des tiers, des collectifs, des auxiliaires et
//   de la balance âgée exigent `comptabilite:dossier:consulter` (STORY-968, aucun droit neuf). Lettrer, délettrer et
//   demander des propositions de lettrage exigent `comptabilite:lettrage:realiser` ; lire les lettrages et les lignes
//   à lettrer, `comptabilite:dossier:consulter` (STORY-969, aucun droit neuf).
// - Grand livre (STORY-966) : calculé à la volée sur les seules écritures VALIDÉES (contre-passations comprises, jamais
//   un brouillard), lu dans un instantané MongoDB ; par compte et par période (bornes inclusives, dans l'exercice).
// - Balance (STORY-967) : dérivée du grand livre (mouvements hors à-nouveaux, soldes de clôture), équilibrée, refusée
//   tant qu'un brouillard reste dans la période (Q2) ; publiée au hub de balance sur `balance.submitted` (origine
//   `comptabilite`, `source: direct`, émetteur `comptabilite-service`, `checksum` du hub) par une outbox écrite dans
//   la transaction de la publication, avec son entrée de piste ; idempotente (même contenu : même version, même
//   `checksum`) ; le verdict du hub (`balance.created`, `balance.rejected`) est lu et porté par la publication.
// - Comptes de tiers (STORY-968) : la comptabilité POSSÈDE ses tiers (clients, fournisseurs, salariés), un registre par
//   DOSSIER (`tiers`, en ajout seul : un tiers cité par des lignes validées ne se modifie pas) ; une référence externe
//   facultative cite le même tiers dans un autre système (paiement, réseau), sans jamais l'appeler. Les comptes
//   COLLECTIFS sont déclarés par référentiel (`comptes-collectifs@1`, donnée du service : SN et SMT 401, 409, 411, 416,
//   419, 421, 422 ; CIMA 411, 414, 420, 425 ; SFD-BCEAO aucun) ; toute ligne d'écriture sur un collectif porte un tiers
//   de sa catégorie (champ facultatif `tiersId` de la ligne, refus 422 `TIERS_REQUIS` sinon) et une échéance figée.
//   L'auxiliaire et le collectif concordent par construction (ce sont les mêmes lignes) ; la balance publiée garde le
//   compte du plan (le collectif), jamais un compte auxiliaire. Balance âgée par tiers et par tranche d'ancienneté
//   (0-30, 31-60, 61-90, 91+ par défaut, paramétrables), à une date d'arrêté (l'horloge du service par défaut), sur
//   les lignes non lettrées (le lettrage de STORY-969).
// - Lettrage (STORY-969) : des lignes VALIDÉES d'un même compte de tiers (même collectif, même tiers, même devise),
//   équilibrées ; PARTIEL (une ligne garde son reste, jamais lettrée au-delà de son montant, même sous la concurrence :
//   verrou du compte de tiers dans la transaction) ; code AA, AB… unique par compte de tiers et par exercice, jamais
//   réutilisé. Il ne touche aucune écriture : collections `lettrages` et `delettrages` en ajout seul. Un écart de
//   règlement sous le seuil (`LETTRAGE_SEUIL_ECART`, 1 000 par défaut) se solde par une écriture d'écart née validée et
//   numérotée (journal des opérations diverses ; `comptes-d-ecart@1` : SN et SMT 658 et 758, CIMA 844 et 849). Le
//   lettrage automatique PROPOSE (référence, puis montant et date dans une fenêtre de 90 jours) ; un membre accepte
//   (`PROPOSE_PAR_LA_MACHINE`) ou modifie (`CHOISI_PAR_L_UTILISATEUR`), Q3. Le délettrage est tracé, refusé sur un
//   exercice clos ; une écriture lettrée se délettre avant d'être contre-passée. La balance âgée ne prend que le
//   non-lettré ; la balance publiée ne change pas (le lettrage n'affecte aucun solde).
// - Inaltérabilité (STORY-964) : une écriture validée porte son numéro définitif, continu et sans trou par journal et
//   par exercice ; elle ne se modifie ni ne se supprime (409 `ECRITURE_VALIDEE_INALTERABLE`), elle se contre-passe. La
//   piste d'audit est chaînée par empreinte (SHA-256), une chaîne par exercice, et se vérifie par une route.
// - Pièce justificative (STORY-962) : chaque écriture cite un `pieceId` de `document-service`, vérifié dans le dossier
//   à la saisie (`GET /api/v1/dossiers/{dossierId}/pieces?pieceId=`, jeton du membre). document-service est du
//   socle, pas un module : il n'entre pas dans `depends`.

export const MANIFESTE_COMPTABILITE = {
  code: 'comptabilite',
  version: '0.1.0',

  // La comptabilité est une source : elle n'a besoin d'aucun autre module pour enregistrer. La balance qu'elle
  // publie (STORY-967) est ingérée par `balance` si `balance` est installé (origine `comptabilite` du hub, A-921).
  depends: [],

  enrichiPar: [],

  // Les familles de référentiel que la comptabilité tient : celles de `balance`. Le plan de comptes vient du paquet du
  // référentiel ; le plan de journaux est DÉCLARÉ PAR RÉFÉRENTIEL (STORY-961, D-961-1 : une donnée du service,
  // `plans-de-journaux@1`, tant qu'aucun paquet ne le porte), jamais codé en dur.
  referentielFamilies: [
    'syscohada-revise',
    'smt-togo',
    'sfd-bceao',
    'cima-assurances',
  ],

  // C7 : droits de tenant proposés (format `<module>:<objet>:<action>`, 40 caractères au plus).
  droits: [
    'comptabilite:dossier:consulter', // référentiel, journaux, écritures, grand livre, balance, tiers (lecture)
    'comptabilite:exercice:ouvrir', // ouvrir un exercice, choisir sa tenue (STORY-959)
    'comptabilite:journal:administrer', // ajouter un journal au plan déclaré (à venir : STORY-961 déclare le plan sans geste)
    'comptabilite:ecriture:saisir', // brouillard (STORY-962)
    'comptabilite:ecriture:valider', // brouillard → définitif, contre-passation (STORY-964)
    'comptabilite:tiers:administrer', // comptes de tiers auxiliaires (STORY-968)
    'comptabilite:lettrage:realiser', // lettrage et délettrage (STORY-969)
    'comptabilite:exercice:cloturer', // clôture, à-nouveaux, réouverture tracée (STORY-970)
    'comptabilite:piste:consulter', // piste d'audit et fichier des écritures (EPIC-120)
  ],

  // C5 : faits publiés et consommés.
  publie: [
    'balance.submitted', // STORY-967 : la balance dérivée du grand livre, origine `comptabilite`, `checksum` (outbox)
  ],
  consomme: [
    'etat-publie.changed.essai@1', // la garde (AD-24), dans l'espace d'essai
    'etat-publie.changed.reel@1', // la garde (AD-24), dans le réel
    'balance.created', // STORY-967 : le hub a ingéré une balance publiée (apparié par checksum et version)
    'balance.rejected', // STORY-967 : le hub a refusé une balance publiée (apparié par submittedEventId)
  ],

  profilCompose: 'comptabilite',

  // C13, point 1 : rien d'extérieur. Le référentiel vient du catalogue de l'espace, le dossier de dossier-service.
  prerequis: [],

  // C13, points 2 et 8 : à créer avec la route d'instance (le moteur n'installe pas le module avant).
  verifications: [
    {
      code: 'referentiel-resolu',
      route:
        'POST /api/v1/instance/comptabilite/{organisationId}/verifications/referentiel-resolu',
      critere:
        "Dossiers tenus au journal dont le référentiel de l'exercice ouvert se résout (SN, SMT, SFD-BCEAO ou CIMA) : tous 🟢 ; ≥ 1 REFERENTIEL_NON_DECIDE ou REFERENTIEL_INCONNU 🔴 avec leur nombre (aucune écriture n'y serait saisissable).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation.
  avertissementDesinstallation:
    "Journaux, écritures validées, tiers, lettrages, grand livre et piste d'audit restent enregistrés et lisibles ; aucune nouvelle écriture ne pourra être saisie et aucune balance ne sera plus dérivée du grand livre.",

  // C12 : format lisible par la version précédente pendant 7 jours.
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/comptabilite/migrer', // à créer ; idempotent, appelé par l'agent sous verrou
  interrupteurs: [],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (sous /api/v1). Une comptabilité tenue reste lisible.
  routesLectureSeule: [
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/referentiel',
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/tenue', // STORY-959
    'GET /api/v1/dossiers/{dossierId}/tenues', // STORY-959 : l'historique des tenues et des bascules
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/journaux', // STORY-961 : le plan de journaux
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ecritures', // STORY-962 : les écritures de l'exercice
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ecritures/{ecritureId}', // STORY-962 : une écriture
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/piste/verification', // STORY-964 : la piste chaînée
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/grand-livre', // STORY-966 : les comptes mouvementés
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/grand-livre/comptes/{compte}', // STORY-966 : un compte
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/balance/publications', // STORY-967 : les balances publiées
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/balance/publications/{version}', // STORY-967 : une balance
    'GET /api/v1/dossiers/{dossierId}/tiers', // STORY-968 : le registre des tiers du dossier
    'GET /api/v1/dossiers/{dossierId}/tiers/{tiersId}', // STORY-968 : un tiers
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/comptes-collectifs', // STORY-968 : les collectifs
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/comptes-collectifs/{racine}/auxiliaires', // STORY-968
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/tiers/balance-agee', // STORY-968 : la balance âgée
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/tiers/{tiersId}/grand-livre', // STORY-968 : un auxiliaire
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/tiers/{tiersId}/lignes-a-lettrer', // STORY-969
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/lettrages', // STORY-969 : les lettrages de l'exercice
    'GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/lettrages/{lettrageId}', // STORY-969 : un lettrage
  ],

  // C13, point 7 (chemins vus par le service). À créer.
  routesInstance: {
    export: 'GET /api/v1/instance/comptabilite/{organisationId}/export',
    import: 'POST /api/v1/instance/comptabilite/{organisationId}/import',
    effacement:
      'POST /api/v1/instance/comptabilite/{organisationId}/effacement',
    sante: 'GET /api/v1/instance/comptabilite/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // [À CONFIRMER] La reprise d'un grand livre (écritures d'un logiciel quitté) : pas avant EPIC-120. Un cabinet qui
  // reçoit un export Sage passe par l'Atelier de balance (epics-comptabilite, « ce que ce module ne fait pas »).
  objetsDeReprise: [],

  domainesEchange: [],
} as const;
