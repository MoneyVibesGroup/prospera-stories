// Amendé le 2026-11-14 : faits de l'IA commune (spine de l'IA commune, AD-14, AD-39, AD-47) : clause `ia` en `capacites` (`secteur/code@majeure`), fait `<module>.realite.constatee@1`, consommation de `ia.proposition.statut.change@1` et `ia.capacite.changed@1`.
// Manifeste M05 — Sinistres (format du contrat de module, clause C1, amendée le 2026-11-10, le 2026-11-11 et
// le 2026-11-12).
// Source : PRD assurance (prds/prd-assurance-2026-11-13/prd.md), annexe A.1, treize clauses C1 → C13 ; spine assurance
// (architecture/architecture-assurance-2026-11-13/ARCHITECTURE-SPINE.md), qui GAGNE sur l'annexe A quand les deux
// divergent (AD-16 : le catalogue « complète et corrige les C5 de l'annexe A »).
// Le propriétaire du dépôt `prospera-sinistres-service` copie ce fichier dans `src/modules/sinistres/module.manifest.ts`
// la semaine où il y travaille (un module Nest par code, AD-3) ; une garde de test compare ensuite le fichier du dépôt
// à la copie du catalogue (C1).
// Références : PRD assurance §5 (FR-30 → FR-139), §6 (FR-140 → FR-158), annexe B (matrice d'accès), annexe C (contrat
//              d'échange), annexe D (paramètres) ; spine AD-1 (le LC fait foi), AD-2 (un propriétaire par objet), AD-3
//              (services), AD-4 (machine à états, 42 transitions), AD-5 (ordres), AD-6 (numéro `DEC-`), AD-7
//              (séparation des tâches), AD-8 (données de santé), AD-10 (IA : `PropositionPort`), AD-11 (provisions),
//              AD-12 (paramètres datés), AD-14 (reprise), AD-16 (catalogue des faits), AD-17 (piste d'audit), AD-22
//              (ordre : identité, immuabilité, suspension), AD-23 (registre `classification-sante`), AD-24 (recherche),
//              AD-26 (portée), AD-27 (échéances) ; épics EPIC-201 → EPIC-221 ; manifestes-a-produire.md, ligne M05.
//
// Service porteur : `prospera-sinistres-service` (module `sinistres`, avec `expertises`, spine AD-3). Il lève le
// [À CONFIRMER, D18] de l'annexe A.1 C1. Le backend de la démo (`prospera-assurance`) ne compte pas comme service.
// ⛔ Le « sinistres » comptable de `prospera-assurance-service` (registre CIMA, art. 415) est un AUTRE objet : seul le
// module du circuit porte le code M05 (AD-3). Bundle : offre unique assurance. Propriétaire du manifeste : Dev B.
//
// Écarts relevés entre l'annexe A.1 du PRD et la spine (la spine gagne) :
// - C5, `sinistres.reglement.changed@1` (annexe) : ABSENT du catalogue. Les règlements ne sont PAS une donnée de
//   `sinistres` (AD-2, AD-21) : `sinistres` publie l'ORDRE (`sinistres.reglement.ordonne@1` avec `empreinteOrdre`, puis
//   `.libere@1`, `.annule@1`, `sinistres.ordre.suspendu@1`), la quittance (`sinistres.quittance.changed@1`) et la remise
//   (`sinistres.remise.constatee@1`) ; l'état du règlement est celui de `paiement` (`paiement.reglement.changed@1`).
// - C5, `sinistres.ia.proposition.enregistree@1` → `sinistres.ia.decision.enregistree@1` : la proposition est tenue par
//   l'IA commune, la DÉCISION humaine (acceptée, modifiée, rejetée, motif) par le module consommateur (AD-10).
// - C5, faits AJOUTÉS par la spine : `sinistres.acces-sante.accorde@1` et `.retire@1` (accès par dossier de `DG` et
//   `DT` aux données de santé, AD-26) ; `sinistres.dossier.attribue@1` porte la marque « tenu par Prospera » (AD-14).
// - C5, consomme : `paiement.reglement.execute@1`, `.echoue@1`, `.inconnu@1` → `paiement.reglement.changed@1` (état
//   absolu qui les remplace, AD-5, AD-16) ; `paiement.reglement.rapproche@1` n'est pas dans la liste fermée de
//   `sinistres` (AD-16) ; `assurance.garantie.changed@1` retiré (la garantie se lit dans la projection par la route de
//   lecture d'`assurance`) ; `reseau.noeud.changed@1` → `reseau.affectation.changed@1` ; ajoutés par la spine :
//   `ged.piece.rattachee@1`, `liaison-assureur.ecart.resolu@1`, `liaison-assureur.fraicheur.changed@1`,
//   `assurance.provision.changed@1` (provision en vigueur, AD-11), `notification.reponse.recue@1` (déclaration par
//   WhatsApp ou courriel, AD-27), `reprise.feu-vert.changed@1` (conservé).
// - C1, `enrichiPar` : la spine (AD-21) met `reseau` en enrichissement (déjà le cas dans l'annexe) ; `connecteurs` reste
//   hors février.
// - C12, interrupteur `numero-attribue-par-prospera` (annexe A.1) : RETIRÉ ici. Le paramètre « qui attribue le numéro
//   officiel » (`attributeur = LC | PROSPERA`) et le préfixe `PRO-` sont à `liaison-assureur` seul (AD-6) ; `sinistres`
//   n'attribue que `DEC-` et n'en garde qu'une copie dérivée du numéro officiel.
// - C7, la spine nomme deux capacités du jeton, `sante:lire` et `sante:existence` (AD-8) : `sinistres:sante:consulter`
//   (annexe) est le droit qui porte `sante:lire` ; `sante:existence` est le défaut de tout rôle qui voit le dossier.
// - C13, `domainesEchange` : l'annexe déclare `sinistres.dossiers` ici (« servi par `liaison-assureur` »). Le point
//   d'échange unique de ce domaine est `liaison-assureur` (A.5) ; un domaine n'a qu'un propriétaire (contrat §6) :
//   `sinistres` déclare donc `[]`.
//
// Hors manifeste, pour mémoire :
// - Gate : `SINISTRES_NOT_ENTITLED` (403 sans donnée, C2). Le module n'agit que si `ged` est en service.
// - Cloisonnement (C2, AD-26) : par `organisationId` et par portée (volet corporel, matériel, risques divers ; pôle
//   recours) tenue par `sinistres` et lue par `reseau` (`sinistres.portee.volet.changed@1`) ; une portée vide est vide,
//   jamais « tout ». Le serveur évalue seul le rôle, la table des 42 transitions, les conditions nommées, le motif
//   (10 caractères) et la séparation des tâches sur l'identifiant de la personne (AD-4, AD-7). Données de santé :
//   appliquées par le service propriétaire, journalisées, double authentification pour les rôles qui les lisent (AD-8).
// - Données possédées (C3, AD-2) : dossiers et leur statut (11 statuts, 4 sorties), déclarations et référence
//   `DEC-AAAA-NNNNN`, décisions de garantie, évaluations arrêtées et décomptes, délégations et comités, offres,
//   accords, ORDRES de règlement (`ordreId`, bénéficiaire, nature, montant, marque « libéré », suspension),
//   quittances, remises constatées, recours (agrégat séparé), signaux et revues de fraude, échéances légales et
//   internes, accès par dossier aux données de santé, index de recherche (`sinistres_recherche`), registre des décisions
//   de l'IA du dossier, piste d'audit chaînée et journal des consultations. Copie DÉRIVÉE du numéro officiel.
//   Lues seulement : projections de contrats (`assurance`), pièces (`ged`), missions et rapports (`expertises`),
//   états des règlements (`paiement`), numéros (`liaison-assureur`), portées et affectations (`reseau`), Propositions.
// - Paramètres (C6) : annexe D du PRD (D.1 transverses, D.2 circuit, D.5 référentiel légal), versions immuables par
//   organisation (AD-12) ; aucune valeur dans le code. Les délais légaux du corporel sont une table en lecture seule,
//   mise à jour par Money Vibes.
// - Écrans (C8) : module d'écran `sinistres` dans `prospera-app`, `src/modules/sinistres/`, tous les écrans par Dev B.
//   `/sinistres` (corbeilles et file RESP), `/sinistres/recherche`, `/sinistres/declarer`, `/sinistres/dossiers/[id]`,
//   `/sinistres/validation`, `/sinistres/comptabilite`, `/sinistres/guichet`, `/sinistres/recours`,
//   `/sinistres/controle`, `/sinistres/reclamations`, `/sinistres/echeances`, `/sinistres/parametres`. Entrées de menu
//   par droit (`sinistres:dossier:consulter`, `sinistres:declaration:saisir`, `sinistres:decision:valider`,
//   `sinistres:reglement:emettre`, `sinistres:recours:gerer`, `sinistres:fraude:revoir`). Boutons non branchés de la
//   démo : « bientôt », jamais simulés (FR-22) ; le chatbot de l'assuré : « bientôt ».
// - Rôles : les quatorze rôles du §2.1 du PRD ; le détail rôle par droit est à l'annexe B. `ADMIN` ne lit aucune donnée
//   métier ; `CPT` n'a aucun droit de décision ; `sinistres:reglement:ordonner` n'est JAMAIS attribué à `CPT` (FR-7).
// - Sorties : aucune destination sortante propre (le LC est local, AD-25) ; le courrier part par `notification`.
// - Désinstaller ne supprime rien : dossiers, journal, registre de l'IA, ordres, recours et quittances restent stockés et
//   masqués ; aucun bouton « supprimer » (FR-175) ; test aller-retour. Les règlements déjà exécutés restent valides
//   chez `paiement`. Conservation de 10 ans au moins (art. 404, FR-174).

export const MANIFESTE_SINISTRES = {
  code: 'sinistres',
  version: '1.0.0',

  // C1 : `ged` est une dépendance DURE, PROPOSÉE par l'annexe A.1, à valider par le PO (la spine ne la contredit pas).
  depends: [
    {
      code: 'ged',
      raison:
        "Chaque pièce d'un dossier vit dans la GED ; sinistres n'en tient aucune copie et lit les pièces par leur référence (§6.2).",
    },
  ],

  // C4 : sans ces modules, l'emplacement est déclaré vide (`NON_INSTALLE`), jamais 0 ni absent. Un test par entrée.
  // - assurance : projection des contrats = `{ etat: NON_INSTALLE, module: assurance }` ; le contrôle de garantie ne se
  //   saute pas (FR-42) : décision motivée `GARANTIE_ACQUISE`, `SOUS_RESERVE` ou `REFUS_DE_GARANTIE` (10 caractères au
  //   moins), visible de `AUD` ; provision du dossier `NON_INSTALLE` (« provision non tenue ») ;
  // - liaison-assureur : numéro officiel `{ etat: NON_INSTALLE }` ; `DEC-` attribuée quand même, `attributeur` forcé à
  //   `PROSPERA` (`LIAISON_REQUISE` sinon, AD-6), déclaration dans la liste « à saisir » (FR-199) ;
  // - expertises : missions et portail `NON_INSTALLE` ; l'accord sur devis (FR-59) et les types sans expertise
  //   obligatoire avancent, un dossier qui exige une expertise attend (motif affiché) ;
  // - paiement : chèque enregistré à la main (FR-221), virement, PI-SPI, Mobile Money `NON_INSTALLE` ;
  // - notification : cloche interne seule, courrier papier possible ; dashboard : cockpit vide, files conservées ;
  // - reseau : un seul site, volet et pôle recours lus des affectations de `sinistres` (AD-26) ;
  // - reprise : pas de dossier repris ; connecteurs : hors février ;
  // - IA commune : usages d'IA du circuit `NON_DISPONIBLE`, règle explicable ou saisie à la main, JAMAIS bloquant (AD-10).
  enrichiPar: [
    'assurance',
    'expertises',
    'liaison-assureur',
    'paiement',
    'notification',
    'dashboard',
    'reseau',
    'reprise',
    'connecteurs',
  ],

  // Aucun numéro de compte ici : `sinistres` ne passe aucune écriture au grand livre (FR-2, FR-3).
  referentielFamilies: [],

  // C7 : droits de tenant, format `^[a-z]+:[a-z-]+:[a-z]+$` (annexe A.1) ; le code `sinistres` n'a pas de tiret.
  // Chaque droit demande une PR `auth-service` à la livraison du module (catalogue de droits à enum fermé).
  droits: [
    'sinistres:declaration:saisir', // déclaration à quatre canaux (FR-34)
    'sinistres:dossier:consulter', // lecture sous portée (FR-147, FR-150)
    'sinistres:dossier:attribuer', // RESP
    'sinistres:dossier:instruire', // GEST
    'sinistres:garantie:decider', // décision de garantie motivée (FR-42)
    'sinistres:evaluation:arreter', // évaluation et décompte (FR-69, FR-70)
    'sinistres:decision:valider', // RESP, DT, DG selon la délégation (FR-8, FR-78)
    'sinistres:comite:decider', // comité de sinistres : instance de la matrice de délégation (FR-8)
    'sinistres:offre:envoyer', // offre provisionnelle ou définitive
    'sinistres:accord:enregistrer', // accord enregistré : naissance de l'ordre d'indemnité (FR-90)
    'sinistres:reglement:ordonner', // JAMAIS attribué à CPT (FR-7)
    'sinistres:reglement:emettre', // CPT : préparation de l'ordre ; le second contrôle est évalué par `paiement` (AD-5)
    'sinistres:cheque:remettre', // ACC, CPT : remise au guichet (AD-5)
    'sinistres:dossier:clore',
    'sinistres:dossier:rouvrir',
    'sinistres:recours:gerer', // GREC (FR-108 → FR-120)
    'sinistres:fraude:revoir', // AUD : revue motivée (FR-129)
    'sinistres:sante:consulter', // capacité `sante:lire` (AD-8) : MED, GEST corporel, RESP, DG et DT par dossier
    'sinistres:reclamation:traiter',
    'sinistres:delegation:gerer', // DG
    'sinistres:parametre:administrer',
    'sinistres:journal:consulter', // AUD : journal des consultations (AD-17)
    'sinistres:ia:decider', // décision humaine sur une Proposition (AD-10)
  ],

  // C5 : faits publiés et consommés. Source : catalogue de la spine, AD-16 (qui corrige l'annexe A.1, C5). Chaque fait
  // d'objet porte l'identifiant stable de l'objet, l'`organisationId`, un `rang` ; un `.changed` est un état absolu avec
  // `versionEtat` et `emisLe`. Aucun fait ne porte de contenu de santé ni de donnée personnelle directe (AD-8, AD-16).
  publie: [
    'sinistres.declaration.enregistree@1', // référence `DEC-`, police, date de survenance, volet : pour `liaison-assureur`
    'sinistres.dossier.changed@1', // état absolu du dossier
    'sinistres.dossier.ouvert@1',
    'sinistres.dossier.attribue@1', // porte la marque « tenu par Prospera » (AD-14)
    'sinistres.garantie.decidee@1',
    'sinistres.evaluation.arretee@1',
    'sinistres.provision.revisee@1', // proposition de provision : `assurance` écrit les mouvements (AD-11)
    'sinistres.decision.validee@1',
    'sinistres.offre.envoyee@1',
    'sinistres.accord.enregistre@1',
    'sinistres.reglement.ordonne@1', // avec `empreinteOrdre` ; `libere: false` tant que l'ordre est différé
    'sinistres.reglement.libere@1',
    'sinistres.reglement.annule@1',
    'sinistres.ordre.suspendu@1', // absolu : suspendu oui ou non, motif codé (AD-22)
    'sinistres.quittance.changed@1',
    'sinistres.remise.constatee@1',
    'sinistres.dossier.cloture@1',
    'sinistres.dossier.rouvert@1',
    'sinistres.sortie.decidee@1', // rejet, sans suite, litige
    'sinistres.fraude.signalee@1', // jamais vers l'assuré ni le courtier
    'sinistres.recours.changed@1',
    'sinistres.recours.encaisse@1',
    'sinistres.acces-sante.accorde@1', // dossier, bénéficiaire, motif, échéance, sans contenu (AD-26)
    'sinistres.acces-sante.retire@1',
    'sinistres.echeance.alerte@1', // pour `notification` et `dashboard`
    'sinistres.portee.volet.changed@1', // pour `reseau`
    'sinistres.reclamation.changed@1',
    'sinistres.ia.decision.enregistree@1',
    'instance.journal@1', // [proposition, C13/journal d'instance, comme stock] dérogations, export, effacement
    'sinistres.realite.constatee@1', // [AD-14, spine IA] fraude confirmée ou écartée à la clôture de la revue humaine (et à 12 mois pour un cas sans suite), offre ou contre-proposition de recours acceptée ou refusée, anomalie de pièces ou de qualité confirmée ou écartée, surcoût de devis confirmé ou écarté, règlement final EN TRANCHE hors volet corporel seulement (issue : FRAUDE_CONFIRMEE, FRAUDE_ECARTEE, OFFRE_ACCEPTEE, OFFRE_REFUSEE, ANOMALIE_CONFIRMEE, ANOMALIE_ECARTEE, SURCOUT_CONFIRME, SURCOUT_ECARTE, REGLEMENT_FINAL_EN_TRANCHE ; `definitive` à la clôture) ; JAMAIS un montant, une tranche ou un écart sur un dossier du volet corporel (`MONTANT_CORPOREL_INTERDIT`), JAMAIS une valeur de santé ; charge : `capacite`, `objetRef` (pseudonyme), `issue`, `definitive`, `echeance`, `constateLe`, `evenementSource`, `eventId` ; consommé par `ia` seul
  ],
  consomme: [
    'etat-publie.changed.essai@1', // l'espace du service seulement (spine du moteur, AD-24)
    'etat-publie.changed.reel@1',
    'identity.*', // topics existants, nom sans suffixe de version [proposition, comme stock]
    'kyc.status.changed', // [proposition, comme stock]
    'ged.piece.recue@1',
    'ged.piece.rattachee@1',
    'ged.piece.controlee@1',
    'ged.dossier.verse@1', // un dossier réouvert ne passe pas `CLOS` sans le versement du volume courant (AD-4)
    'assurance.police.changed@1',
    'assurance.provision.changed@1', // seule provision affichée « en vigueur » (AD-11)
    'liaison-assureur.numero-sinistre.attribue@1',
    'liaison-assureur.envoi.etat@1',
    'liaison-assureur.ecart.ouvert@1',
    'liaison-assureur.ecart.resolu@1',
    'liaison-assureur.fraicheur.changed@1',
    'expertises.mission.changed@1',
    'expertises.rapport.depose@1',
    'expertises.honoraires.vises@1', // `sinistres` seul émet l'ordre `HONORAIRES` (AD-5)
    'paiement.reglement.changed@1',
    'notification.envoi.delivre@1',
    'notification.reponse.recue@1',
    'reseau.portee.changed@1',
    'reseau.affectation.changed@1',
    'reprise.feu-vert.changed@1',
    'ia.proposition.statut.change@1', // [AD-5, AD-41 de la spine IA] statut écrit par `ia` (expiration comprise), pour l'affichage
    'ia.capacite.changed@1', // [AD-32 de la spine IA] état absolu d'une capacité : coupée, dégradée, en service
  ],

  // C10 (annexe A.1) : `profiles: ["sinistres"]` ; socle + `ged`. Sans autre module, un dossier va de `DECLARE` à `CLOTURE`.
  profilCompose: 'sinistres',

  // C13, point 1 : l'annexe A.1 écrit « `ged` en service ; (recommandés) `assurance` et `liaison-assureur` ». `ged` est la
  // dépendance dure de `depends` (installée et contrôlée par le moteur) ; les deux autres sont recommandés, jamais exigés.
  prerequis: [],

  // C13, points 2 et 8 : une route, un critère chiffré (🟢, 🟠 ou 🔴) ; appelées par le moteur. Les huit codes et leurs
  // critères sont ceux de l'annexe A.1 ; noms de routes proposés (convention commune : `verifications/<code>`).
  verifications: [
    {
      code: 'transitions-gardees',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/transitions-gardees',
      critere:
        "Sur un dossier d'essai, le chemin nominal atteint les 11 statuts dans l'ordre, une transition absente de la table des 42 est refusée par le serveur (`TRANSITION_INCONNUE`) et aucun statut non terminal n'est sans issue : 🟢 ; sinon 🔴 avec la transition en cause (FR-135, FR-139, AD-4).",
    },
    {
      code: 'garantie-non-sautable',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/garantie-non-sautable',
      critere:
        "L'ouverture d'un dossier sans contrôle de garantie ni décision motivée est refusée : 🟢 ; sinon 🔴 (FR-42).",
    },
    {
      code: 'aucun-ordre-sans-accord',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/aucun-ordre-sans-accord',
      critere:
        "Un ordre de règlement est refusé tant que l'accord n'est pas enregistré (transition 14, `ACCORD_ENREGISTRE`) : 🟢 ; sinon 🔴 (FR-90, AD-5).",
    },
    {
      code: 'separation-des-taches',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/separation-des-taches',
      critere:
        "L'instructeur ne valide pas son propre dossier, celui qui décide n'émet ni ne paie, et le cumul des montants du dossier décide du niveau de validation (refus `SEPARATION_DES_TACHES` jugé sur l'identifiant de la personne) : 🟢 ; sinon 🔴 avec la ligne de FR-7 en cause (FR-7, FR-81, AD-7).",
    },
    {
      code: 'delegation-parametree',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/delegation-parametree',
      critere:
        "Un montant ≤ 1 000 000 FCFA est signé par le responsable ; au-dessus, refusé au responsable seul, il passe au comité puis au visa du directeur technique ; un règlement à titre commercial n'est signé que par la direction générale : 🟢 ; sinon 🔴 (FR-8, FR-78).",
    },
    {
      code: 'decompte-dans-l-ordre',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/decompte-dans-l-ordre',
      critere:
        'Un dossier d\'essai de 780 000 FCFA de dommage, franchise 10 % et minimum 50 000, donne 702 000 FCFA : 🟢 ; sinon 🔴 avec l\'écart en FCFA (FR-69).',
    },
    {
      code: 'corporel-sans-montant-ia',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/corporel-sans-montant-ia',
      critere:
        "Aucun point d'entrée n'accepte un montant, une fourchette ou un comparable proposé par l'IA sur un dossier de volet corporel (garde du port ET du consommateur, AD-10) : 🟢 ; sinon 🔴 avec le point d'entrée (FR-71).",
    },
    {
      code: 'plafond-especes',
      route: 'POST /api/v1/instance/sinistres/{organisationId}/verifications/plafond-especes',
      critere:
        "Un règlement en espèces au-dessus du plafond paramétré est refusé avec un code nommé : 🟢 ; sinon 🔴 (FR-98).",
    },
  ],

  // C9 : texte rendu par la partie A avant la désinstallation (annexe A.1).
  avertissementDesinstallation:
    'Plus aucun dossier ne sera déclaré, instruit, validé ni payé ; les règlements déjà exécutés restent valides, les recours en cours ne seront plus relancés, les délais légaux ne seront plus surveillés.',

  // C12 : format lisible par la version précédente pendant 7 jours. Migration additive. La forme du journal, du registre
  // de l'IA, des états du règlement et de la quittance ne change jamais dans la fenêtre de sept jours ; un statut, un
  // état ou un motif ajouté est lu comme INCONNU par la version précédente, qui refuse la transition plutôt que de la
  // deviner. La table des 42 transitions est une donnée versionnée : un dossier garde la version de son ouverture (AD-4).
  // L'image de `prospera-sinistres-service` est unique : son `retourArriere` est le plus restrictif de ses modules (AD-3).
  retourArriere: 'SANS_PERTE',
  migrer: 'POST /api/v1/instance/sinistres/migrer', // [proposition] route de service, sans organisation, idempotente, appelée par l'agent sous verrou
  // Comportement seulement, jamais la forme des données (annexe A.1, C12, moins `numero-attribue-par-prospera`, voir l'en-tête).
  interrupteurs: ['declaration-assistee-ia', 'analyse-devis-ia', 'graphe-des-liens-ia'],

  // C2, C13 point 5 : routes autorisées en LECTURE_SEULE (consultation, journal, export). Aucun nom de route de
  // `sinistres` n'est donné par le PRD ni la spine : TOUS ces noms sont des propositions, à figer par la story d'API
  // (EPIC-201 et suivants).
  routesLectureSeule: [
    'GET /api/v1/sinistres/dossiers', // [proposition]
    'GET /api/v1/sinistres/dossiers/{id}', // [proposition]
    'GET /api/v1/sinistres/recherche', // [proposition, FR-150]
    'GET /api/v1/sinistres/journal', // [proposition, `sinistres:journal:consulter`]
    'GET /api/v1/instance/sinistres/{organisationId}/export',
  ],

  // C13, point 7 (chemins vus par le service ; le chemin public est /api/sinistres/v1/… devant).
  routesInstance: {
    export: 'GET /api/v1/instance/sinistres/{organisationId}/export',
    import: 'POST /api/v1/instance/sinistres/{organisationId}/import', // sa part du dossier d'installation ; point d'import de la Reprise = commande évaluée par la machine à états (AD-4, AD-14)
    effacement: 'POST /api/v1/instance/sinistres/{organisationId}/effacement', // tracé, avec certificat ; refusé sous conservation (AD-9, AD-17)
    sante: 'GET /api/v1/instance/sinistres/{organisationId}/sante',
    etatPublie: 'GET /api/instance/v1/etat-publie/{organisationId}', // lue chez la partie A
  },

  // C1, amendement du 2026-11-11 (spine de la Reprise) : les dossiers en cours d'abord, l'historique ensuite (état traduit
  // par la table de correspondance unique tenue par `sinistres`, dates d'origine, montants, provisions, expert désigné,
  // trace de la source). Valeurs de contrôle : sinistres ouverts, somme de leurs provisions (FR-218).
  objetsDeReprise: ['sinistres.dossier@1'],

  // C1, amendement du 2026-11-12 (spine de Connecteurs) : vide ici. Le domaine `sinistres.dossiers` de l'annexe A.1 est
  // déclaré par `liaison-assureur` (point d'échange unique, A.5) ; voir les écarts en en-tête.
  domainesEchange: [],

  // C11 : `sinistres` SPÉCIFIE ces capacités (FR-35, FR-47, FR-53, FR-56, FR-60, FR-74, FR-83, FR-120, FR-122, FR-132,
  // FR-154, FR-155, FR-157, FR-208, FR-209) ; le moteur est l'IA commune, en instance locale chez la compagnie
  // (FR-10, FR-230). Le module ne code aucun score et n'appelle aucun modèle : il demande une Proposition par le port
  // `PropositionPort` (AD-10) ; les règles explicables v0 sont des stratégies typées dont les paramètres sont des entrées
  // de la demande. Garde-fous : aucune décision automatique ; JAMAIS de montant, fourchette, médiane, comparable ou écart
  // sur un dossier de volet corporel (liste blanche versionnée unique, port ET consommateur, testé par écran, FR-71) ;
  // chaque proposition est sourcée jusqu'à la pièce ; la décision humaine est écrite ici avec l'identifiant de la
  // Proposition (registre de l'IA du dossier) ; le score de fraude n'est qu'un signal et ses variables sont une liste
  // fermée sans genre, nationalité, situation matrimoniale ni religion ; aucune donnée de santé ne sort de l'instance ;
  // aucune dictée. L'orientation d'expertise, la complétude du rapport et la comparaison au portefeuille sont déclarées
  // par `expertises`. Les noms de modèles et de finalités sont des propositions (annexe A, préambule).
  // Amendé le 2026-11-14 : les anciens `modeles` deviennent des capacités `assurance/code@majeure` (AD-47) ; la recherche en
  // langage naturel est le vocabulaire assurance de la capacité unique `copilot` ; `qualite-dossier-simulation` est scindée en
  // `qualite-dossier` et `simulation-charge`. Garde : aucune capacité ne rend un montant sur un dossier du volet corporel.
  ia: {
    capacites: [
      'assurance/declaration-assistee@1',
      'assurance/coherence-pieces@1',
      'assurance/relance-pieces@1',
      'assurance/preremplissage-instruction@1',
      'assurance/analyse-devis@1',
      'assurance/explication-montant@1',
      'assurance/detection-fraude-liens@1',
      'assurance/redaction-courrier@1',
      'assurance/contre-proposition-recours@1',
      'assurance/resume-dossier@1',
      'assurance/copilot@1',
      'assurance/brief-du-matin@1',
      'assurance/qualite-dossier@1',
      'assurance/simulation-charge@1',
    ],
    finalites: [
      'declaration-assistee',
      'controle-pieces',
      'relance-pieces',
      'preremplissage-instruction',
      'analyse-devis',
      'explication-montant',
      'detection-fraude',
      'redaction-courrier',
      'recours',
      'resume-dossier',
      'recherche-langage-naturel',
      'brief-du-matin-et-veille',
      'qualite-et-simulation',
    ],
  },
} as const;
