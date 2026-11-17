# Journal du groupe B

> Écrit par le groupe B seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §4 (le moteur). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3** (le socle partout, le kit des cibles, l'installation, l'essai).

## État

### Lot 3 (ouvert le 2026-11-17)

- **Plan** : `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, décidé par l'utilisateur : B passe à la **comptabilité**
  (`prospera-comptabilite-service`, EPIC-111 → 119), et sert d'abord ce qu'il doit à A (kit 1.0.1, supervision) et à
  D (rôles du distributeur, Créance). Même poste que le lot 2, même verrou Docker que D.
- **Ordre** : 956 `kit-cible` 1.0.1 (+ `encours/` de D au README) → 957 supervision Kafka (puis passation de
  `notification` à D) → 958 socle de la comptabilité (**dépôt à créer par l'utilisateur**) → 959 exercices → 960 rôles
  du distributeur (auth) → 961 journaux → 962 brouillard → 963 Créance (1) → 964 validation inaltérable → 965 Créance
  (2) → 966 grand livre → 967 balance dérivée (attend A-921) → 968 tiers → 969 lettrage → 970 clôture.
- **Avancement** :
  1. ~~STORY-956~~ : **plateforme #22** (`189183f`, étiquette **`kit-cible-v1.0.1`** : jalon du 04/12 tenu),
     contrat annoncé avant la fusion (stories #580). D1 `CLE_EN_DOUBLE`, D2 textes bornés, D3 montants requis et
     états appliqués par le kit ; suite publiée élargie à 22 cas (cloisonnement, atomicité avec `PanneDeConformite`,
     cas du témoin, `controles`) ; `encours/` au README et dans les scripts racines. Node 24 : 490/0/1 sauté, MongoDB
     8.0 23/23 ; 25 + 29 mutations. D4 → D8 restent ouverts (fiche, D-956-7).
  2. ~~STORY-957~~ : **notification #89** (`5e6c553`), **paiement #121** (`1e90517`), **catalogue #59** (`5004cc5`).
     La supervision Kafka est corrigée (défauts relevés par A, STORY-908) :
     - une relance prend un consommateur neuf ; le catalogue met ses quatre boucles en commun
       (`DemarrageAvecRelance`) ;
     - `/health` est borné à 5 s avec un seul client admin (D-957-6, trouvé sur la pile).
     Node 24 vert dans les trois services ; 30 mutations rouges. Pile `grp-b` : `/health` 200 21 à 22 s après le retour
     de Kafka, message consommé par les trois services. Témoin `dev` : notification et paiement restent hors de leur
     groupe. **`notification` est passé à D** (voir « Passations »).
  3. ~~STORY-958~~ : **prospera-comptabilite-service #1** (`8f36ef9` sur `dev` ; `main` et `dev` amorcées en
     `08c6c54`), contrat annoncé avant la fusion (stories #604). Le socle de la comptabilité : garde globale sur l'état
     publié (`garde-etat-publie-v1`), cloisonnement par dossier ET par exercice (résolus par dossier-service avec le
     jeton du membre), référentiel du dossier (`GET …/dossiers/{d}/exercices/{e}/referentiel`), piste d'audit
     append-only avec `provenance` (Q3), manifeste `comptabilite`, **port 3420** (D-958-1). Node 24 180/0/2, socle
     20/20 sur MongoDB 8.0 rs0 et Kafka, 20 mutations ; pile `grp-b` : `/health` 200.
  4. ~~STORY-959~~ : **prospera-comptabilite-service #2** (`a8784cb` sur `dev`), contrat annoncé avant la fusion
     (stories #609). Les exercices et la tenue.
     - `POST …/exercices/{e}/ouverture { tenue }` ouvre à la comptabilité un exercice OUVERT de dossier-service.
       L'exercice reste celui de dossier-service (D-959-1).
     - La tenue est exclusive (CAHIERS ou JOURNAL) : index unique et collection append-only. L'autre tenue rend 409
       `TENUE_EXCLUSIVE` ; la même, rejouée, rend 200 sans rien écrire.
     - La bascule se lit sur l'exercice précédent du dossier (`bascule`, `precedente`).
     - La piste reçoit `EXERCICE_OUVERT`, avec la provenance déduite de la proposition citée.
     - Un 4e maillon global, `GardeDesDroits`, lit `@DroitRequis` par `GET /moi/droits`.
     Node 24 : 248/0/2 ; `test:socle` 36/36 (MongoDB 8.0 rs0, Kafka) ; 25 mutations ; pile `grp-b` : `/health` 200.
     **Aucun rôle n'a encore `comptabilite:*`** : en réel, l'ouverture rend 403 (D-959-4, à lever avant B-967).
  5. ~~STORY-960~~ : **auth #42** (`cf8e001`, `8d48710` sur `dev`), contrat annoncé avant la fusion (stories #616).
     Les 15 rôles du distributeur reçoivent la table de l'annexe B.2 (131 droits), appliquée par la résolution unique
     du jeton et de `/moi/droits`.
     - Le jeton est gelé à ses 24 droits ; les 118 droits neufs sont **hors du jeton** (`droitsHorsJeton`, contrat
       1.1.0). La borne tient (17 + 24 = 41 ≤ 44) sans être relevée.
     - Claim `roleMetier` dans le jeton ; `roleMetierAttribue` sur `identity.droits.changed@1` (version 2 au registre,
       BACKWARD).
     - Données privées (rémunérations, commissions, prix d'achat, marge) : retirées à la résolution, refusées à la
       surcharge (422 `DONNEE_PRIVEE_HORS_DU_ROLE`).
     Node 24 : 99 suites, 1 364/1 364 ; 11 mutations rouges ; pile `grp-b` : 26/26, cinq jetons RS256 réels ;
     `test:schemas` 16/16. **D-1053 débloquée.** La même voie (hors du jeton) lève la borne pour `comptabilite:*`
     (D-959-4) : ils restent à attribuer, avant B-967.
  6. ~~STORY-961~~ : **prospera-comptabilite-service #3** (`acafd6f` sur `dev`), contrat annoncé avant la fusion
     (stories #621). Le plan de journaux.
     - Le plan est déclaré par référentiel (`plans-de-journaux@1`, donnée du service : SN, SMT, SFD-BCEAO, CIMA ;
       six natures, codes `AC VE BQ CA OD AN`).
     - Il est **arrêté** à l'ouverture au JOURNAL, dans la transaction de la tenue (`plans_de_journaux`,
       append-only). Les séries sont amorcées à ce moment, et la piste dit `referentiel` et `planDeJournaux`.
     - `GET …/exercices/{e}/journaux` (lecture seule). Un exercice aux CAHIERS n'a pas de journaux : 409
       `EXERCICE_TENU_AUX_CAHIERS` (D-961-3).
     - Numérotation : `series-v1` copiée à l'octet, une série par journal et par exercice. Le numéro est émis
       **dans la transaction de l'acte** : ni trou ni doublon (D-961-5).
     - La source des droits lit `droits ∪ droitsHorsJeton` (D-961-7).
     Node 24 : 289/0/3 ; `test:socle` 50/50 (50 actes concurrents, dont 10 abandonnés ⇒ 1 → 40) ; 23 mutations ;
     pile `grp-b` : `/health` 200. Avant la story : demande de A servie (plateforme #26, `jeu-cabinet-v1`).
  7. ~~STORY-962~~ : **prospera-comptabilite-service #4** (`ce22d81` sur `dev`), contrat annoncé avant la fusion
     (stories #623). L'écriture en brouillard.
     - `POST …/exercices/{e}/ecritures` (`comptabilite:ecriture:saisir`) : pièce équilibrée PAR PIÈCE, montants
       entiers en unité mineure (XOF, XAF), exercice OUVERT et tenu au journal, journal au plan, date dans les bornes.
     - Le `pieceId` est vérifié chez `document-service` (`GET /dossiers/{d}/pieces?pieceId=`, jeton du membre, 3 s,
       fermé) (D-962-4).
     - Le brouillard prend un numéro PROVISOIRE (`VE-BR-000001`, série à part) dans la transaction de la saisie ; le
       définitif s'émet à la validation (D-962-1). Piste `ECRITURE_SAISIE` avec provenance.
     - Cache des droits `(membre, organisation, dv)`, 60 s, borné ; `dv` projeté du jeton (D-962-5).
     Node 24 : 358/0/3 ; `test:socle` 69/69 ; 31 + 5 mutations ; pile `grp-b` : `/health` 200.
  8. ~~STORY-963~~ : **prospera-paiement-service #122** (`716059c` sur `dev`), contrat annoncé avant la fusion
     (stories #633). La Créance (1) : un registre unique ouvert par sa source.
     - Même collection `creances` et même upsert que STORY-251 ; la clé `(source, sourceId)` est portée par l'`_id`
       (`<org>|FACTURATION|FACTURE:<SOURCEID>`), module et référence **déduits** de la source (D-963-2).
     - `FACTURE` seule servie ; les trois autres sources rendent 422 `SOURCE_DE_CREANCE_NON_SERVIE` (D-963-3).
     - `tiersId` et `perimetre` (`SOCIETE` | `FREELANCE:<id>`) figés ; autre valeur : 409
       `CREANCE_SOURCE_EN_CONFLIT` ; autre montant : anomalie tracée (D-963-5).
     - `PUT /api/v1/creances/sources/{source}/{sourceId}` sous `paiement:demande:emettre` (dans le jeton, D-963-7) :
       201 née, 200 rejeu, rien d'écrit au rejeu ; reprise bornée à 3 sur `ECRITURE_CONCURRENTE` (D-963-6).
     Node 24 : 130 + 4 578/0/2 ; conformité `rs-paiement` : 20 ouvertures concurrentes ⇒ 1 Créance, 1 trace, 1 fait ;
     21 mutations ; pile `grp-b` : `/health` 200. « → D » : comment ouvrir une Créance (pour D-1059).
  - **Story suivante : STORY-964** (la validation inaltérable, `prospera-comptabilite-service`, EPIC-113 et 120 ; dépend
    de 962). « Fini quand » (plan §3) : brouillard → définitif ; une écriture validée ne se modifie pas, elle se
    **contre-passe** ; séquence prouvée par une piste chaînée ; mutation. À lire avant : fiche 962 (« Pour la suite » :
    valider = `numeroter(portee, code, session)` dans la transaction de la validation, D-961-5 ; le numéro provisoire
    reste sur l'écriture) et fiche 961. `comptabilite:*` n'est toujours attribué à aucun rôle dans auth (en réel, la
    saisie rend 403 jusque-là ; hors du jeton, avant B-967).
  - **Pour STORY-965** (Créance (2), paiement) : fiche 963, « Pour la suite » : `paiement.creance.changed@1` à la forme
    de `FaitCreance` d'`encours@1` (`creanceId = <source>:<sourceId>`, `revision` à ajouter au document et à incrémenter
    dans la transaction de chaque changement, deux restants, `echeanceLe` en `AAAA-MM-JJ`) ; le crédit du tiers ; la
    lecture du registre sous `paiement:creance:consulter` (hors du jeton : `paiement` devra lire `/moi/droits`) ; le
    consommateur de `facturation.facture.emise@1` si D en a fixé la charge (il appelle `OuvrirLaCreance`).

### Lot 2 (ouvert le 2026-11-16)

- **Machine** : le lot 2 de B tourne sur **un autre poste Windows** que le poste principal (plan du lot 2, §9.3).
  D y tourne aussi (worktree `_wt-d-stories`) : piles Docker préfixées `grp-b`, jamais de `down` sans `-p`. Copie de
  travail de B pour `prospera-stories` : le worktree `_wt-b-stories`.
- **Fusion** : `gh pr merge --rebase` d'abord refusé par le mode automatique de la session, puis autorisé
  explicitement par l'utilisateur (« le rebase doit marcher »). B fusionne lui-même, comme au lot 1.
- **Ordre du lot 2** (941 → 955) :
  1. ~~STORY-941~~ : **plateforme #6** (`9f43fa9`) : verrou npm, scripts racines sur les dossiers de C et de D, README ;
  2. ~~STORY-942~~ : **auth #39** (`08fc1a0`) : auth-service sur le socle (Confluent, Node 24, BullMQ 6, six schémas
     `identity.*` au registre) ; le rôle métier effectif (`roleMetier`) dans `GET /users` et le détail console ;
  3. ~~STORY-943~~ : **plateforme #7** (`5883740`, étiquette `point-de-decision-v1`) : la logique du point de
     décision, tous les refus dans l'ordre d'AD-23, mode sur site, conformité et mutation ;
  4. ~~STORY-944~~ : **catalogue #52** (`c3c63c8`) : l'installation, un plan enregistré. Point de décision copié
     (`point-de-decision-v1`), offre (souscrits), plan idempotent aux étapes horodatées, reprise après coupure prouvée
     par `docker kill` ; l'axe 2 se lit dans le plan (fin de D-936-1 pour les modules installés par un plan) ;
  6. ~~STORY-946~~ : **plateforme #8** (`300779e`) : le kit des cibles (1), les contrats de la Reprise
     (`contrats/reprise/`) et `@prospera/kit-cible` 0.1.0 (point d'import `SIMULER`/`APPLIQUER`, valeurs de contrôle) ;
     suite : STORY-947 (conformité publiée, cible témoin, `kit-cible` 1.0.0 **avant le 04/12**, relu par A).
  7. ~~STORY-947~~ : **plateforme #11** (`789a11a`, étiquette **`kit-cible-v1.0.0`**) : le kit des cibles (2), la suite
     de conformité publiée, la cible témoin, l'adaptateur MongoDB, la distribution CommonJS ; **jalon du 04/12 tenu**,
     relecture de A demandée.
  8. ~~STORY-948~~ : **catalogue #53** (`102f7e2`), **auth #40** (`017b938`), contrats annoncés avant la fusion
     (stories #543) : la naissance d'une organisation
     (`POST /api/instance/v1/naissances`), le registre des organisations et le 404 `ORGANISATION_INCONNUE` (fin de
     D-936-2), le jeton de service limité à une organisation, lu par l'état publié (fin de D-936-3), `reprise:lot:valider`
     réservé au DG ;
  5. ~~STORY-945~~ : **catalogue #55** (`99ba2db`, `9798ff5`), fusionnée **avant A-917 sur décision de
     l'utilisateur** : aucun `ACTIVE` hors du moteur ; l'échéance soldée note « acquis, à installer » ; vertical et
     propagation des packages retirés ; le `PUT` de la console passe par un plan ; l'axe 2 ne se déduit plus du droit
     (`migrate:reamorcage-moteur`). **Recettes croisées rouges sur `dev`** : demande à A ci-dessous ;
  9. ~~STORY-949~~ : **auth #41** (`a30e78f`), **catalogue #54** (`abc5716`), contrats annoncés avant la fusion
     (stories #552) : droits hors du jeton, étapes 1 et 2. Côté auth : `GET /moi/droits`, `dv` dans le jeton,
     `identity.droits.changed@1`. Côté catalogue : `droitsEffectifs` en double lecture, avec un cache invalidé par
     l'événement. **A-919 peut démarrer** (voir « → A »).
  10. ~~STORY-950~~ : **notification #87** (`e895c79`), **catalogue #50** (`9713dff`), **paiement #120** (`aa985c8`) :
      notification sur le socle (Node 24, Confluent) et la garde en double lecture ; `metadataMaxAge` 10 s dans les
      trois services ; le producteur ne retient plus l'amorçage sans Kafka.
  11. ~~STORY-951~~ : **catalogue #56** (`8f3e321`) : essai ou réel. Dans l'essai, la liste blanche des sorties et
      le journal des interceptions (`ECRITURE_REELLE_DEPUIS_ESSAI`) ; dans le réel, la mise en service d'un
      sous-ensemble (la Reprise d'abord, la vérification `donnees-importees` relue, `MISE_EN_SERVICE_SANS_FEU_VERT`,
      `reception-definitive.enregistree`) ; projection de `reprise.feu-vert.changed`. Prouvé sur la pile grp-b-951
      (module cible `temoin`, doublure de la Reprise), 28/28.
  12. ~~STORY-952~~ : **catalogue #57** (`45c3b33`), **notification #88** (`9d6f3ae`), contrats annoncés avant la
      fusion (stories #548) : l'essai d'un prospect (J+30, une prolongation, 60 jours au plus, `ESSAI_TERMINE`, signer
      rouvre sans perte), avis J-7 par la route directe de notification, horloge de recette du catalogue. Pour 953 :
      l'effacement s'accroche à l'échéance `EFFACEMENT` et au statut de l'essai (fiche, « Pour STORY-953 »).
  13. ~~STORY-953~~ : **plateforme #17** (`5a50249`, étiquette **`contrats-instance-v1`** : jalon du 14/12 tenu),
      **catalogue #58** (`4dfde25`), contrats annoncés avant la fusion (stories #562) : le contrat du jeu de
      démonstration et les formes génériques des routes C13 d'import et d'effacement ; le jeu importé à l'ouverture de
      l'essai ; l'effacement à `effacementLe` (plan idempotent, accusé de chaque propriétaire, certificat signé avec la
      date de la dernière sauvegarde) ; cinq essais simultanés prouvés sur la pile (433 ms, sans mélange).
  14. ~~STORY-954~~ : **plateforme #9** (`b4c5c46` ; étiquettes `seuils-fraicheur-v1`, `contrats-echange-v1`,
      `point-ecriture-unique-v1`), **catalogue #51** (`60473e1`) : les contrats de Connecteurs publiés avant février
      (seuils de fraîcheur, enveloppe et réponse d'échange, `connecteurs.domaine.changed`, `domainesEchange` et ses
      cas) ; `@prospera/point-ecriture-unique` (marqueur, garde de balayage) ; le catalogue rejoue les règles.
  15. ~~STORY-955~~ : **centrale-service #1** (`5671fab`), **agent-instance #1** (`db1dd58`) : agent et centrale,
      premier incrément. La centrale émet l'état voulu signé (licence, heure de référence, liste de révocation, signées
      à part ; compteur par clé ; contacts idempotents). L'agent le vérifie hors ligne, l'applique tout ou rien et
      ouvre la licence au point de décision sur site ; horloge scellée (AD-5), journal chaîné. Test croisé : les 16
      vecteurs rejoués des deux côtés, et le jeu de la vraie centrale appliqué par l'agent. `main` et `dev` posées dans
      les deux dépôts neufs.

### Lot 1 (fini le 2026-11-15)

- **2026-11-14** : journal ouvert, lot pas encore commencé.
- **2026-11-15** : le lot de B est tenu par **la session qui a tenu le lot de A**, sur le poste principal (Windows), sur
  consigne de l'utilisateur : A, puis B, puis la story du seed du catalogue (`fiscal-tg-*` octroyables pour
  `declarations`). Les stories s'enchaînent sans arrêt. **Ce journal est la mémoire du lot.**
- **Lot de B, ordre** :
  1. ~~STORY-930~~ : **catalogue #43**, **recette #17** (client de Confluent, Node 24, Karapace, schéma de
     `entitlement.changed` enregistré) ;
  2. ~~STORY-931~~ : **plateforme #1** (contrats, vecteurs signés, `@prospera/signature`, point de décision amorcé ;
     dépôt créé par l'utilisateur) ;
  3. ~~STORY-932~~ : **catalogue #44** (contrat d'état publié, **figé**, étiquette `contrat-etat-publie-v1`) ;
  4. ~~STORY-933~~ : **catalogue #45**, **recette #18** (Redis, BullMQ, bail MongoDB du relais d'outbox) ;
  5. ~~STORY-934~~ : **catalogue #46** (manifeste dans `ModuleVersion`, refus nommés, résolution, garde) ;
  6. ~~STORY-935~~ : **catalogue #47** (46 manifestes au catalogue, `catalogue.manifeste.publie`, droits renommés) ;
  7. ~~STORY-936~~ : **catalogue #48** (matrice exécutée, vraie route, émetteur de `etat-publie.changed`) ;
  8. ~~STORY-937~~ : **plateforme #2** (garde partagée, `garde-etat-publie-v1`), **paiement #117** (Node 24, Confluent,
     double lecture) ;
  9. ~~STORY-938~~ : **auth #38**, **recette #19**, ADR « droits hors du jeton » ;
  10. ~~STORY-939~~ : **paiement #118** (read-model des manifestes, la vente résout comme la console), ticket des
      écrans pour D. **Le lot de B (930 → 939) est fini.**

- **Hors lot, consigne de l'utilisateur** : ~~STORY-940~~ (le seed du catalogue : `declarations` s'ouvre aux paquets
  `fiscal-tg-*`) : **catalogue #49**, **paiement #119**, **recette #20**. Puis la relecture finale de A rejouée (les recettes
  `atelier-balance` et `zone-franche`, jouées au gate de 940 : **56/56**).
- **Docker** : aucune pile de B ne tourne. ⚡ Règle de l'utilisateur (2026-11-15) : une pile se lève pour le gate de sa
  story et **se descend avec ses volumes à la fin de cette story**, même si la suivante en aura besoin ; elle se relève
  alors au gate suivant.

## Dépôts tenus

`prospera-platform-catalog-service`, `prospera-paiement-service`, `prospera-plateforme` (à créer, STORY-931),
`prospera-notification-service` et `prospera-auth-service` (reçus de A, voir Passations).

**Lot 3** : **`prospera-comptabilite-service`** (neuf, créé par l'utilisateur ; `main` et `dev` amorcées par STORY-958,
checkout du poste en `core.autocrlf=false`, pile propre au dépôt : `docker compose -p grp-b --profile comptabilite`).
**`prospera-notification-service` n'est plus à B** depuis la fusion de STORY-957 (17/11), il est à D
(D-L3-3). B n'y écrit plus ; une demande passe par le journal de D. Pendant ce lot, la même
session tient aussi `prospera-recette` (dépôt de A, lot de A terminé).

**Lot 2** : en plus, les dépôts neufs **`centrale-service`** et **`agent-instance`** (créés par l'utilisateur, `main` et
`dev` posées par STORY-955).

## Passations

- **→ D (2026-11-17) : `prospera-notification-service` est à D** (lot 3, D-L3-3), à la fusion de STORY-957.
  **Dernier commit de B sur `dev` : `5e6c553`** (notification #89, rejoué en rebase ; arbre identique à celui éprouvé).
  **D-1051 est débloquée.** Dès ce commit, B ne touche plus ce dépôt.
  - **État** : Node 24 (`docker build --target verification`, puis `npm test` dans un conteneur nommé) :
    276 suites, 3 846 passés, 1 sauté. Client Kafka de Confluent 1.11, sept consommateurs de read-models sous
    `SupervisionConsommateur` : relance sur un consommateur neuf, recul de 1 s à 30 s, blocage compté par
    partition. `/health` agrège MongoDB, la base de preuves (même jeu de répliques), Kafka (borné à 5 s, un seul
    client admin, état des consommateurs), Redis, le référentiel et les canaux. Sur la pile de 957, `/health`
    répond 200 avec `CANAUX_DEGRADES` : sms, whatsapp et push ne sont pas configurés, email et in-app le sont (le
    statut reste `up`). La garde est en double lecture sur l'état publié (STORY-950). Deux modèles système
    viennent de l'essai prospect (STORY-952).
  - **Pièges** :
    - les tests du client de Confluent se jouent sous Node 24 seulement. Sur le poste en Node 25,
      `npm ci --ignore-scripts` suffit pour `tsc`, le lint et les specs qui n'importent que des types ;
    - **une minuterie neuve fait rougir `src/adapters/bullmq/aucune-minuterie.spec.ts`** (AC-5) : l'inventorier avec
      son motif, ou passer par une file BullMQ ;
    - `liste-fermee-ad2.spec.ts` est à l'inventaire AD-12 (STORY-950) ;
    - la sonde du compose vise `/api/v1/health` ; `/api/v1/health/live` n'interroge rien ;
    - un message illisible est ignoré et l'offset avance ; une erreur de projection est propagée et le message
      rejoué ;
    - l'avis J-7 de l'essai demande `platform-catalog-service:<jeton>` dans `JETONS_DE_SERVICE`.
  - **Ce qui reste ouvert** :
    - l'appel à `POST /sorties-essai/{organisationId}/verifier` du catalogue avant chaque envoi dans l'espace
      d'essai (STORY-951, « ⚠ Contrats ») n'est pas branché ;
    - la bascule de la garde de la double lecture vers l'état publié seul (comme A l'a faite en 918) n'est pas faite ;
    - les canaux sms, whatsapp et push n'ont pas d'adaptateur configuré sur la pile ;
    - le résidu de 957 : juste après un redémarrage sans Kafka, la rafale de relances a porté un contrôle de
      `/health` à 7,5 s.
- **Reçue le 2026-11-14 : `prospera-notification-service`**, de A, dernier commit sur `dev` : `8916ee4`.
- **Reçue le 2026-11-15 : `prospera-auth-service`**, de A, dernier commit sur `dev` : `456035f` (STORY-902). À
  reprendre : STORY-938 (droits à tiret dans les trois segments) ; la console affiche « sans rôle métier » pour un
  membre qui reçoit le rôle par défaut (l'API d'administration rend le `tenantRole` stocké, pas le rôle effectif).

## Demandes aux autres groupes

- **→ D (2026-11-17) : comment ouvrir une Créance dans `paiement` (pour D-1059)** — **information** (STORY-963, fiche
  `stories/STORY-963.md`, D-963-1 → 12). Lu dans votre journal et dans le manifeste `facturation` de `ventes` : la
  facture ouvre sa Créance par `facturation.facture.emise@1` (AD-7), et vous lirez `paiement.creance.changed@1` avec
  `creanceId = <source>:<sourceId>` (K-7). Voici ce qui est servi, et ce qui viendra.
  - **Par la route, dès aujourd'hui** : `PUT {PAIEMENT}/api/v1/creances/sources/FACTURE/{factureId}`, avec le jeton du
    membre qui émet la facture. Droit `paiement:demande:emettre`, **dans le jeton** : COMPTABLE, DAF et FREELANCE (les
    trois `facturation:facture:emettre` de l'annexe B) l'ont. Corps : `{ tiersId, perimetre: "SOCIETE" |
    "FREELANCE:<id>", montantOrigineMineur, devise, echeanceLe: "AAAA-MM-JJ", libelle, livraisonId? }`. Le montant est
    le TTC, en entier d'unité mineure ; l'échéance est celle figée à l'émission ; le libellé est le numéro d'affichage.
  - **Les réponses** :
    - 201 à la naissance, 200 au rejeu, sans rien écrire. La route se rejoue donc à volonté (relais d'outbox, relance
      après un délai dépassé).
    - 409 `CREANCE_SOURCE_EN_CONFLIT` (`details.champ`) si la même facture revient avec un autre tiers ou un autre
      périmètre. Un autre montant n'est pas refusé : c'est une anomalie tracée, et le montant d'origine reste.
    - 409 `ECRITURE_CONCURRENTE` : une ouverture concurrente de la même facture ; il suffit de rejouer.
    - 422 `SOURCE_DE_CREANCE_NON_SERVIE` pour `RELEVE_VENTE_COMPTE`, tant que le relevé n'a pas de fait.
    - 403 `PAIEMENT_NOT_ENTITLED` si l'organisation n'a pas le module `paiement`.
  - **Le porteur du `sourceId`** : l'identifiant **interne** de la facture (votre `factureId`, l'identifiant stable de
    l'objet), jamais son numéro `FAC-…`. Forme `[A-Za-z0-9_-]`, 1 à 64 caractères (un ObjectId ou un UUID). Deux
    identifiants qui ne diffèrent que par la casse sont refusés, jamais fusionnés.
  - **Par le fait, le chemin d'AD-7** : `paiement` consommera `facturation.facture.emise@1` avec la même écriture
    (`OuvrirLaCreance`), dès que vous en aurez fixé la charge. Champs proposés : `organisationId`, `factureId`
    (le `sourceId`), `tiersId`, `perimetre`, `montantTTCMineur`, `devise`, `echeanceLe`, `numero`, `livraisonId`.
    Dites ici vos noms de champs : B écrit le consommateur en 965 s'ils sont fixés avant, sinon à la story suivante.
    Les deux chemins ouvrent **la même** Créance : 1059 peut appeler la route, et publier le fait en plus.
  - **Pour relire, d'ici 965** : `GET {PAIEMENT}/api/v1/creances?source=FACTURE&sourceId=<factureId>` (même droit),
    ou le fait `paiement.creance.materialisee` (avec `source`, `sourceId`, `tiersId`, `perimetre`, `livraisonId`).
    `paiement.creance.changed@1` (état absolu, `revision`, deux restants, `echeanceLe`) vient avec STORY-965.

- **→ C (2026-11-17) : la comptabilité lit `GET /api/v1/dossiers/{dossierId}/pieces?pieceId=` de `document-service`**
  — **information**, rien n'est demandé (STORY-962, D-962-4). À la saisie d'une écriture, la comptabilité vérifie la
  pièce justificative citée : elle appelle cette route avec le jeton du membre (borne 3 s) et cherche, dans la liste,
  la pièce qui porte exactement ce `pieceId`. Elle garde `id` (comme `documentId`) et `type`. Liste vide ou 404 : la
  saisie est refusée (`PIECE_JUSTIFICATIVE_INCONNUE`) ; autre statut ou réponse hors contrat : 503. Si cette route, le
  filtre `pieceId` ou les champs `id`, `type`, `pieceId` devaient changer, le dire ici avant la fusion. Le jeton
  présenté doit porter l'audience `document-service` (c'est déjà le cas du compose racine).

- **→ D (2026-11-17) : les 15 rôles du distributeur sont servis, D-1053 est débloquée** — **information** (STORY-960,
  auth #42, `dev` `8d48710` ; fiche `stories/STORY-960.md`, § « Ce que D lit pour D-1053 »).
  - **Le jeton** : `org`, `dv` et le claim neuf `roleMetier` (`DIST_DG`, `DIST_SUPERVISEUR`…), absent pour un membre
    sans rôle. Il dit QUI, pas ce qu'il peut : ne décidez pas d'un droit sur `roleMetier` (une surcharge retire un
    droit sans changer le nom du rôle). `perms[]` ne porte que les 24 droits du jeton : aucun droit de vos modules.
  - **Les droits** : `GET {AUTH}/api/v1/moi/droits?organisationId=<org du jeton>` avec le jeton du membre. Les droits
    de tenant effectifs sont **`droits ∪ droitsHorsJeton`** (vos modules sont tous dans `droitsHorsJeton`). Cache
    `(membre, organisation, dv)`, 60 s au plus ; un jeton au `dv` plus grand force la relecture ; auth injoignable ⇒
    on ferme. Invalidation : `identity.droits.changed@1`, sur `dv` ; `roleMetierAttribue` y dit le rôle attribué
    après le changement (`null` : aucun).
  - **La table** : annexe B.2, recopiée ligne à ligne dans `auth-service/src/modules/rbac/table-d-acces-distributeur.ts`
    (vérifiée contre le PRD par un test). Les cinq `reseau:*` y sont : `noeud:consulter` (DG, DC, RESP_VENTES,
    SUPERVISEUR, RESP_STOCK, CONTROLE_GESTION, DIST_ADMIN), `noeud:modifier` (DC, DIST_ADMIN), `decoupage:modifier`
    (DC), `affectation:modifier` (DC, RESP_VENTES, DIST_ADMIN), `portee:attribuer` (DIST_ADMIN, DG).
  - **Le périmètre** reste dans `reseau.portee.changed@1` (le vôtre) : auth ne publie aucune portée.
  - ⚠ **Un membre sans rôle `DIST_*` n'a aucun droit** (D-960-12) : `TENANT_ADMIN` n'est plus « les cinq `reseau:*` ».
    Pour vos recettes : le dirigeant (le fondateur) attribue un rôle par
    `PUT /api/v1/organizations/me/members/{userId}/tenant-role { role }` ; `DIST_DG` et `DIST_DAF` portent
    `reprise:lot:valider` et ne s'attribuent que par lui (D-960-9). Paramètres de `commande` (D-1049-4, « DIST_ADMIN
    et le DG ») : l'annexe B ne nomme pas de droit pour eux ; à vous de choisir entre un droit neuf (à demander ici,
    il entrera hors du jeton) et `roleMetier`.

- **→ A (2026-11-17) : le plan de journaux est déclaré dans la comptabilité, pas dans vos paquets** — **information**,
  aucune action demandée (STORY-961, D-961-1). Vos paquets de référentiel (balance-service) portent le plan de comptes,
  pas de plan de journaux ; la comptabilité, seule à en lire un, le déclare par référentiel dans
  `src/journaux/plans-de-journaux.json` (`plans-de-journaux@1` : SN, SMT, SFD-BCEAO, CIMA ; six journaux). Si vous
  voulez un jour le porter dans les paquets, dites-le ici : seul le chargeur de la comptabilité changera.

- **→ A (2026-11-17) : la tenue d'un exercice est déclarée dans la comptabilité** — **information**, aucune action
  demandée (STORY-959, D-959-5 et D-959-6). Q1 (D-L3-4) est appliquée côté comptabilité : un exercice ouvert aux
  `CAHIERS` ne s'ouvre pas au `JOURNAL`, et l'inverse (409 `TENUE_EXCLUSIVE`). La comptabilité ne lit pas les cahiers
  de balance-service. L'Atelier ne sait donc pas encore qu'un exercice est tenu au journal. Pour le savoir sans rien
  attendre : `GET {COMPTABILITE}/api/v1/dossiers/{d}/exercices/{e}/tenue` (404 `EXERCICE_NON_OUVERT` si rien n'est
  choisi), avec le jeton du membre. Si vous voulez refuser un cahier sur un exercice tenu au journal, dites-le ici :
  B publiera `comptabilite.tenue.changed@1` (outbox, registre), annoncé dans « ⚠ Contrats ».

- **→ A (2026-11-17) : `prospera-comptabilite-service` existe, port 3420** — **information**, aucune action avant
  B-967 (STORY-958, D-958-8). Le service n'entre pas encore dans la recette : le catalogue ne connaît pas encore le
  module et la comptabilité ne publie rien. À la première recette croisée (la balance dérivée, B-967), B demandera ici :
  le service dans `docker-compose.recette.yml` (port 3420, `DOSSIER_SERVICE_URL`, `AUTH_*`) et `comptabilite-service`
  dans l'`AUTH_AUDIENCE` de l'IdP. **Ce que la comptabilité lit de dossier-service dès maintenant** (sans rien vous
  demander) : `GET /dossiers/{id}` (`id`, `orgId`, `referentielComptable`) et `GET /dossiers/{id}/axes?exerciceId=`
  (`effectifs.decision.systemeComptable`, `effectifs.herite`, `effectifs.exercice`), avec le jeton du membre. Un
  renommage de ces champs est à annoncer à B.

- **→ D (2026-11-17) : `prospera-notification-service` est à vous, D-1051 est débloquée** — **information**.
  Passation écrite plus haut (« Passations ») : dernier commit de B sur `dev` `5e6c553` (STORY-957, notification #89).
  La supervision Kafka y est corrigée, avec preuve sur pile. Pour prévenir l'assuré (1051, 1054), partez de
  `src/modules/declenchement/` (les faits qui déclenchent un envoi) et des modèles système. **AC-5** refuse toute
  minuterie : les relances de pièces espacées de 5 jours passent par une file BullMQ.

- **→ A, copie à C et D (2026-11-17) : la borne de 5 s de STORY-908 ne suffit pas, le client admin doit être gardé**
  (STORY-957, D-957-6) — **information**. Sur la pile de 957, Kafka arrêté, `/health` répondait en 6,2 à 6,4 s
  (jusqu'à 10,4 s au redémarrage) avec le patron de 908. Cause mesurée dans un conteneur : la **fermeture** d'un client
  admin du client de Confluent est **synchrone** (destruction librdkafka) et prend de **0,45 à 3,8 s**, sur le chemin
  de la réponse, à chaque contrôle. Correctif dans les trois dépôts de B (`src/health/indicators/kafka.health.ts`) :
  - un seul client admin, créé paresseusement et réutilisé, puisque librdkafka reprend seul la connexion ;
  - si sa connexion échoue, il est abandonné, fermé hors de la réponse (`setImmediate`) et remplacé au contrôle
    suivant ;
  - il est fermé à l'arrêt du module (`OnModuleDestroy`).
  Il y a aussi un écart à votre `renouveler()` : B ne l'attend pas (`void ancien.disconnect()`), parce qu'après une
  connexion réussie puis un abonnement raté, la fermeture peut retenir la relance. Balance et bilan (A), et chez C
  et D les services de la même demande, ont la fermeture par contrôle. À reprendre chez vous si vous le jugez utile ;
  B n'y touche pas.

- **→ A (2026-11-17) : relire `kit-cible` 1.0.1** (suite de ta relecture de la 1.0.0) — **ouverte**. Étiquette
  `kit-cible-v1.0.1` de `prospera-plateforme` (`189183f`, STORY-956). Les décisions sont dans
  `stories/STORY-956.md` (D-956-1 → 7), et l'annonce est plus bas, dans « ⚠ Contrats ».
  - **D1** : 422 `CLE_EN_DOUBLE` sur la requête. Le kit n'applique pas « la dernière l'emporte ».
  - **D2** : bornes dans `RefusRequete` et sur toute `raison`.
  - **D3** : `SCHEMA_NON_CONFORME` pour un montant requis absent non marqué ou un état hors circuit, et
    `REFUSE_PAR_LA_CIBLE` pour un état retenu hors circuit.
  - **La suite publiée** : 22 cas, et un banc qui doit fournir `panne`.
  - **Encore ouverts**, de ta liste : D4 (concurrence, E11000) et D5 à D8. Dis si l'un d'eux doit passer avant `pdv`.
    Verdict à écrire dans ton journal.

- **→ D (2026-11-17) : `encours/` est au README de `prospera-plateforme`, et `kit-cible` 1.0.1 est étiqueté** —
  **information** (D-L3-5, STORY-956, plateforme #22, `189183f`). **D-1047 et D-1055 sont débloquées.**
  - **`encours/`** : `npm test` joue déjà `encours/test/**/*.test.ts` et le typecheck lit `encours/**/*.ts`, avant
    même votre premier fichier, sans PR de B. La garde `test/scripts-racines.test.ts` le vérifie. Forme attendue :
    `src/`, `test/`, `scripts/` ; pas de dépendance propre (à demander ici).
  - **D-1055** : copier `bibliotheques/kit-cible/distribution/` à `kit-cible-v1.0.1`, et jamais la 1.0.0, avec
    `git -c core.autocrlf=false show`. Le banc de conformité de `reseau` fournit `panne`
    (`new PanneDeConformite()`) et enveloppe chaque raccord par `panne.envelopper(raccord)`. Une clé en double dans un
    lot est désormais refusée (422 `CLE_EN_DOUBLE`) : la Reprise doit dédoublonner.

- **→ A, copie à C (2026-11-17) : MinIO passe à `cgr.dev/chainguard/minio:latest`** — **ouverte**. Décision de
  l'utilisateur, désormais la norme (`REGLES-DES-GROUPES.md` §1.6). `minio/minio` n'existe plus sur Docker Hub (API :
  404, `pull access denied`) et `quay.io/minio/minio` rend 401 sans compte : un poste qui n'a pas l'image en cache ne
  lève plus ni la recette ni la pile de `document-service`. Vérifié le 17/11 sur le poste de B et D, dans
  `docker-compose.yml` racine (déjà basculé ici) : santé `/minio/health/live` 200, bucket créé, objet écrit puis relu
  avec `mc`. **À faire par A** :
  1. sur le poste principal, dans `C:\Users\thier\Documents\MoneyVibes_Apps\docker-compose.yml` (non versionné, service
     `minio`) : `image: cgr.dev/chainguard/minio:latest` et `user: '0'` (sans `user`, « file access denied » sur
     `/data`). La commande, les variables et les ports ne changent pas ;
  2. dans `prospera-recette/docker-compose.recette.yml`, poser l'image et `user: '0'` sur le service `minio` (il ne
     surcharge aujourd'hui que les ports), pour que la recette ne dépende plus de la copie racine de chaque poste ;
  3. rejouer une recette qui écrit dans MinIO (archive des livrables du fiscal) sur pile neuve.
  **C** : à vérifier dans la pile `grp-c-…` de `document-service` (contrat S3 de 995, OCR de 996, scellé de 997).

- **→ A, C, D (2026-11-16) : le contrat du jeu de démonstration est publié** (STORY-953, `contrats-instance-v1`, jalon
  du 14/12) — **ouverte**. Pour l'essai prospect du 15/01, chaque verticale livre :
  1. **son jeu**, au format `jeu-demonstration@1`, vérifié par `npm run jeu:verifier -- <dossier>` dans
     `prospera-plateforme`. C : le générateur à graine fixe (STORY-987) se déclare dans `generateur`, avec nom,
     source à une étiquette, graine et paramètres. Chaque objet est un fichier, un tableau JSON d'enregistrements au
     format du schéma d'objet du module ;
  2. **les routes C13 d'import et d'effacement** de chaque module de démo, aux chemins déclarés dans `routesInstance`,
     au corps exact de `contrats/instance/` :
     - l'import est idempotent et traite un objet par lot ;
     - l'effacement efface tout ce que le module tient de l'organisation, puis accuse.

  Un module sans route d'effacement figure au certificat comme `SANS_ROUTE`, ce qui veut dire qu'il ne garde rien de
  l'organisation : à ne laisser que si c'est vrai. Les jeux se déposent dans le dossier `JEUX_DEMONSTRATION_DIR` du
  catalogue de l'espace d'essai, un sous-dossier par jeu.

- **→ A (2026-11-16) : 945 FUSIONNÉE avant 917 sur décision de l'utilisateur** — **ouverte**. Catalogue #55
  (`99ba2db`, `9798ff5` sur `dev`). Sur des images reconstruites depuis `dev`, les recettes croisées sont **rouges**
  jusqu'à ta correction, faite à ta vérification. **À corriger dans `prospera-recette`** (détail :
  `stories/STORY-945.md`, § Fusion) :
  1. **`atelier-balance.recette.ts` l. 333-334, `zone-franche.recette.ts` l. 445-446,
     `referentiel-par-dossier.recette.ts` l. 295-296** : `octroyer(bilan)` avant `octroyer(balance)`. Le `PUT` passe
     par le point de décision et `bilan` dépend durement de `balance` ⇒ 422 `MODULE_DEPENDANCE_MANQUANTE` (champ
     `refus`). **Ouvrir `balance` avant `bilan`** ; `declarations` après `bilan` est déjà dans le bon ordre ;
  2. **`referentiel-par-dossier.recette.ts` l. 390** : `microfinance` dépend de `reseau` ⇒ ouvrir `reseau` d'abord ;
  3. **`abonnement.recette.ts`** (631, 632, 649, 650/651, 727, 728) :
     - **l. 634, 944, 1098** : l'échéance soldée n'ouvre plus rien, donc plus de droit `source: abonnement:<id>`. Le
       module est « acquis, à installer » (`GET /api/v1/offres/{org}`, champ `acquis` : échéance couverte, palier,
       packages). Pour l'ouvrir : `PUT /catalog/entitlements/{org}/{module}`, ou `PUT /offres` puis
       `POST /installations`. Le droit naît `source: moteur:<plan>`, `terme: ECHEANCE`, avec l'échéance et le palier
       du contrat. L'échéance suivante le prolonge comme avant ;
     - **l. 770** : le vertical n'ouvre plus rien (`vertical:distributeur`) ⇒ l'attente tombe.

  Rien d'autre ne change pour la recette : le `PUT` garde son corps et ses succès, et le groupe Kafka
  `platform-catalog-identite` existe toujours. **Migration** : `npm run migrate:reamorcage-moteur` (ou
  `node dist/migrations/reamorcage-par-le-moteur.js` dans l'image), à jouer au déploiement du catalogue sur toute base
  existante. Sans elle, les modules ouverts avant le moteur se lisent `NON_INSTALLE` à l'état publié.

- **→ A (2026-11-16) : `/moi/droits` est servi, pour A-919 (étape 3 de l'ADR, côté fiscal)** — **information**
  (STORY-949).
  - **La route** : `GET {AUTH}/api/v1/moi/droits?organisationId=<org du jeton>`, en présentant le jeton de
    l'utilisateur tel quel. 200 : `droits` (tenant), `droitsPlateforme`, `dv`. Ce que la garde fiscale compare à
    `perms[]`, c'est `droits ∪ droitsPlateforme`.
  - **`dv`** : la version des droits du membre dans l'organisation, entier croissant (absent ou 0 : jamais changé
    depuis 949). Le jeton la porte (claim `dv`) : un cache tenu à une version **inférieure** au `dv` du jeton se relit.
  - **L'invalidation** : `identity.droits.changed@1` (clé `organisationId`, champs `userId`, `organisationId`, `dv`).
    Retirer l'entrée seulement si l'événement porte un `dv` **supérieur** à celui du cache.
  - **Le cache** : 60 s au plus. Auth injoignable : la double lecture se tait, le jeton décide (pendant la double
    lecture) ; après la bascule, on ferme.
  - **Le patron** : `platform-catalog-service/src/droits-hors-du-jeton/` (cache, client, consommateur, double lecture,
    et leurs tests).
  - Un jeton dont le `dv` est plus ancien que la résolution donne un écart **attendu** (`JETON_PLUS_ANCIEN`) : ne pas
    le compter comme un défaut.

- **→ A, C, D (2026-11-16) : servir les routes de vérification de vos modules** — **information** (STORY-944). Le moteur
  installe un module seulement si chacune de ses vérifications répond `VERT` au contrat
  `verification-installation@1` (voir « ⚠ Contrats »). À faire à la gate de chaque module, avant son installation
  par le moteur : pour le cabinet, avant A-918.

- **→ A (2026-11-16) : relire `kit-cible` 1.0.0 avant le 04/12** (EPIC-161 : « relu par Dev A ») — **servie** par
  A le 16/11 (verdict : 1.0.1 nécessaire), corrigée par STORY-956 ; relecture de la 1.0.1 demandée plus haut.
  Étiquette `kit-cible-v1.0.0` sur `prospera-plateforme` (`789a11a`, STORY-947). À lire : `bibliotheques/kit-cible/src/`
  (`cible.ts`, `conformite.ts`, `mongodb.ts`), la fiche `stories/STORY-947.md` (D-947-1 → 10) et le README de la
  plateforme (section du kit). Ce qu'on attend de la relecture : la suite de conformité couvre-t-elle ce qu'un point
  d'import de `pdv` doit prouver ? la distribution CommonJS se copie-t-elle sans heurt dans un service NestJS ? Verdict
  dans le journal de A ; un défaut devient une **1.0.1**, corrigée par B dans le kit, jamais dans le dépôt de la cible.

- **→ C (2026-11-16) : les codes des domaines de `liaison-assureur`** — **question, ouverte**. Le manifeste publié de
  `liaison-assureur` déclare `assurance.contrats`, `sinistres.dossiers` et `ged.documents-sinistres` : le préfixe du
  **code** n'est pas le module, alors que la spine de Connecteurs (AD-2) écrit `<module>.<domaine>`. Le catalogue ne le
  refuse pas (STORY-954, D-954-3 : seuls les objets doivent être du module) pour ne pas casser ce manifeste. À trancher
  par C : soit le pont déclare les domaines des modules qu'il sert (alors AD-2 l'écrit), soit les codes deviennent
  `liaison-assureur.<domaine>`. Choix par défaut : rien ne change tant que C ne répond pas.

- **→ D (2026-11-16) : `prospera-plateforme` a vos trois dossiers** (D-L2-3) — **information**. Le README dit que D
  écrit dans `series/`, `vocabulaires/`, `contrats/distributeur/`, et nulle part ailleurs. Forme attendue : `src/`,
  `test/**/*.test.ts`, `scripts/` ; le `test` et le `typecheck` racines les jouent dès votre premier fichier, sans PR
  de B. Pas de dépendance propre : une dépendance nouvelle se demande ici (STORY-941, plateforme #6).

- **→ C (2026-11-15) : `prospera-plateforme` est prêt** (plan §7, « B → C ») — **information**. `main` et `dev`
  existent ; le README dit qui écrit où : C écrit dans `contrats/assurance/`, `champs-sensibles/` et
  `classification-sante/`, et nulle part ailleurs. Les contrats sont en JSON Schema **draft-07**, sans `$ref` entre
  fichiers, objets fermés (`test/contrats.test.ts` le garde aussi pour les dossiers de C). STORY-983 et 987 peuvent
  démarrer.

## Réponses aux demandes reçues

- **← C (2026-11-17, STORY-1006) : les référentiels habilités dans l'état publié ?** — **lue, prise en charge, pas
  encore servie.** Le choix par défaut de C convient : garder `entitlement.changed` pour le seul champ `referentiels`
  (D-1006-5). Le contrat d'état publié est figé (`contrat-etat-publie-v1`, ajouts facultatifs seuls, BACKWARD) : un
  champ facultatif `referentiels` y entrera par une story de B au catalogue, à placer comme remplaçante du lot 3 ou au
  lot suivant. Elle sera annoncée ici avant sa fusion ; C basculera alors.

- **← A (2026-11-17, STORY-927) : le jeu du cabinet est dans `jeux-demonstration/cabinet-demo-togo/`** — **servie
  avant STORY-961** (plateforme #26, `dev` `3407408`). (1) La ligne `jeux-demonstration/cabinet-demo-togo/` → groupe
  A est au tableau « Qui écrit dans quel dossier » du README, avec celle du jeu de l'assurance → groupe D (lue plus
  bas). (2) L'étiquette **`jeu-cabinet-v1`** est posée par B sur `e958bd6` (le commit du jeu, comme `jeu-assurance-v1`
  sur celui de D) et poussée : `generateur.source` du `jeu.json` se résout. (3) Le catalogue copiera le dossier
  entier à `JEUX_DEMONSTRATION_DIR` (le vérificateur ignore `generateur/`), à la story qui branchera le jeu du
  cabinet sur l'essai.

- **← D (2026-11-17, STORY-1050) : attribuer les droits `reseau:*` par auth-service** — **servie par STORY-960**
  (auth #42, `dev` `8d48710`). Les cinq `reseau:*` sont dans la table des 15 rôles (détail dans « → D » plus haut),
  servis par `/moi/droits` dans `droitsHorsJeton`. **Écart à la demande** : la table rôle socle (`TENANT_ADMIN` les
  cinq, `TENANT_USER` la consultation) n'est pas reprise ; il faut un rôle `DIST_*` (D-960-12, contestable).

- **← A (2026-11-16, STORY-908) : deux défauts du patron de supervision de 950** — **servie par STORY-957**
  (notification #89 `5e6c553`, paiement #121 `1e90517`, catalogue #59 `5004cc5`). Les deux défauts étaient présents
  à l'octet dans notification et paiement. Le catalogue avait déjà un consommateur neuf par relance, mais il attendait
  la fermeture de l'ancien, et `/health` n'était pas borné. Preuve rejouée comme demandé : Kafka arrêté, service
  redémarré, Kafka relancé, `/health` 200, plus un message consommé. La borne de 5 s ne suffisait pas seule : voir
  « → A » (D-957-6).
- **← A (2026-11-17) : l'origine `comptabilite` est disponible pour B-967** — **lue**, gardée pour STORY-967 (forme
  de `balance.submitted` v1, `sourceSystem` à ajouter à `INGESTION_SOURCE_SYSTEMS`, mouvements de l'exercice
  seulement).
- **← D (2026-11-17) : ce que la bibliothèque d'encours lit de la Créance** — **lue**, gardée pour STORY-963 et 965 :
  état absolu par clé, révision croissante, `statut`, les deux restants, `echeanceLe`, `perimetre`, `devise`, et le
  `solde` du crédit du tiers. Tout écart de `paiement.creance.changed@1` sera dit ici avant la fusion de 965.
- **← D (2026-11-17) : le jeu de l'assurance est dans `jeux-demonstration/`** — **lue**. La ligne
  `jeux-demonstration/assurance-compagnie-demo-reduite/` → groupe D entrera au tableau du README de
  `prospera-plateforme` avec la prochaine story de B qui touche la plateforme.

- **← A (2026-11-16) : relecture de `kit-cible` 1.0.0, « 1.0.1 nécessaire »**
  (`coordination/relecture-kit-cible-1.0.0-groupe-A.md`) — **servie par STORY-956** (plateforme #22, `189183f`,
  étiquette `kit-cible-v1.0.1`).
  - Servis : D1, D2, D3 et les trous de la suite (cloisonnement, atomicité, `rattacherA`, `REFUSE_PAR_LA_CIBLE`,
    `REQUALIFIE`, régime non admis, majeure, `OBJET_INCONNU`, 1 Mio, `controles`, `saisirMontant`).
  - Ouverts : D4 à D8 (fiche 956, D-956-7) ; relecture de la 1.0.1 demandée ci-dessus.

- **← C (2026-11-15) : la recette d'`origin/dev` ne démarre pas sur une pile NEUVE** — **servie par STORY-940**
  (catalogue et paiement créent leurs topics abonnés absents avant `subscribe`, le correctif de C). Plus besoin de
  créer les trois topics `paiement.abonnement.*` à la main une fois les images reconstruites depuis `dev`.
- **← C (2026-11-15) : `prospera-plateforme`, verrou et scripts racines** — **servie par STORY-941** (plateforme #6,
  `9f43fa9`). `npm ci` passe ; `npm test` et `npm run typecheck` racines jouent `champs-sensibles/`,
  `classification-sante/`, `contrats/assurance/` (et `demo/`). Garde `test/scripts-racines.test.ts` : un fichier de C
  que la racine ne joue pas fait rougir la CI. Vos `package.json` restent, sans dépendance propre (D-941-2).
- **← C (2026-11-15) : les ports du compose racine pour la recette de l'Atelier** — **servie**. `grp-b` est descendue
  avec ses volumes après STORY-939, et B ne garde plus de pile levée entre deux stories. La recette de 940 a attendu
  que `grp-c-recette` libère les ports.

- **← A (2026-11-15) : le rôle métier effectif dans la liste des membres**
  (`TICKET-BACKEND-role-metier-absent-de-la-reponse-des-membres`) — **servie par STORY-942** (auth #39, `08fc1a0`).
  Les quatre critères du ticket sont prouvés en direct ; **FE-115 est débloquée**. C'est aussi le reste de la
  passation d'auth (« sans rôle métier » dans la console) : le détail d'organisation publie le même `roleMetier`.

- **← A (2026-11-15) : borne du jeton face aux verticales** — **prise en charge**, pas encore servie :
  1. regex des droits à tiret ⇒ **STORY-938** ;
  2. cinq codes de plus de 40 caractères ⇒ **STORY-935** ;
  3. décision d'architecture « droits hors du jeton » ⇒ à écrire avant février, au plus tard avec STORY-938.
  — **avancée par STORY-949** (2026-11-16) : l'ADR, écrite avec 938, a ses étapes 1 et 2 (`/moi/droits`, `dv`,
  `identity.droits.changed@1`, double lecture dans la partie A). La borne reste jusqu'au retrait de `perms[]` (étape 4) ;
  les droits `reprise:*` n'entrent au catalogue de tenant qu'à ce moment (D-949-1).

## ⚠ Contrats

- **2026-11-17, STORY-963 — la Créance (1), annoncé AVANT la fusion du code** (`prospera-paiement-service`, EPIC-231 ;
  fiche `stories/STORY-963.md`, D-963-1 → 12). **Fusionné le 17/11** : paiement #122, `716059c` sur `dev` (annonce :
  stories #633). Tout est AJOUT : rien d'existant ne change de forme.
  - **Route neuve** `PUT /api/v1/creances/sources/{source}/{sourceId}`, droit `paiement:demande:emettre` (dans le
    jeton), garde du module (pas une surface plateforme). Corps : `{ tiersId, perimetre: SOCIETE | FREELANCE:<id>,
    montantOrigineMineur (entier > 0, unité mineure), devise, echeanceLe: AAAA-MM-JJ, libelle, livraisonId?, payeur? }`.
    201 (née) ou 200 (rejeu, rien d'écrit) → la vue d'une créance. Clé : `(source, sourceId)`, `sourceId` =
    identifiant interne `[A-Za-z0-9_-]{1,64}` ; l'`id` de la créance est `<orgId>|FACTURATION|FACTURE:<SOURCEID>`.
  - **Refus nommés neufs** : 422 `SOURCE_DE_CREANCE_NON_SERVIE` (`details.source` ; `RELEVE_VENTE_COMPTE`,
    `ECHEANCE_DE_PRET`, `PRIME`) ; 409 `CREANCE_SOURCE_EN_CONFLIT` (`details.champ` : `source`, `sourceId`, `tiersId`,
    `perimetre`). `CREANCE_INVALIDE` (400) couvre aussi `source`, `sourceId`, `tiersId`, `perimetre`, `livraisonId`,
    `echeanceLe`, `rattachement`.
  - **`GET /api/v1/creances`** : filtres facultatifs `source`, `sourceId`, `tiersId`, `perimetre` (égalités exactes).
  - **Vue d'une créance** (toutes les routes qui la rendent) : champs facultatifs `source`, `sourceId`, `tiersId`,
    `perimetre`, `livraisonId`, absents pour une créance sans source.
  - **`paiement.creance.materialisee`** (topic JSON, sans registre) : mêmes champs facultatifs, ajoutés quand la Créance
    a une source. La piste (`CREANCE_MATERIALISEE`) les reçoit aussi.
  - Aucun topic neuf, aucun schéma au registre, aucune variable, aucun amendement du manifeste (la route de lecture
    `GET /api/v1/creances` y est déjà). `paiement.creance.changed@1` : STORY-965.

- **2026-11-17, STORY-962 — l'écriture en brouillard, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-113 ; fiche `stories/STORY-962.md`, D-962-1 → 10). **Fusionné le 17/11** : comptabilite #4, `ce22d81` sur
  `dev` (annonce : stories #623). Tout est AJOUT : rien d'existant ne change de forme.
  - **Route neuve** `POST /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ecritures`, droit
    `comptabilite:ecriture:saisir` (lu par `/moi/droits`). Corps : `{ journal, dateEcriture: AAAA-MM-JJ, libelle,
    pieceId, devise: XOF|XAF, lignes: [{ compte, libelle?, debit, credit }] (2 à 500), proposition? }`. **Montants :
    entiers en unité mineure** (comme `balance.submitted` v1 et paiement), jamais un flottant.
    201 → `{ id, dossierId, exerciceId, journal, statut: BROUILLARD, numeroProvisoire: VE-BR-000001, dateEcriture,
    libelle, devise, lignes, totalDebit, totalCredit, pieceJustificative: { pieceId, documentId, type, verifieeLe },
    saisiePar, saisieLe, provenance }`.
  - **Routes neuves de lecture** : `GET …/ecritures?journal=` et `GET …/ecritures/{ecritureId}`, ouvertes à tout
    membre dont la portée couvre le dossier ; au manifeste en `routesLectureSeule`.
  - **Refus nommés neufs** : 422 `PIECE_DESEQUILIBREE` (`details.totalDebit`, `totalCredit`, `ecart`),
    `LIGNE_SANS_MONTANT`, `LIGNE_DEBIT_ET_CREDIT` (`details.ligne`, `compte`), `PIECE_HORS_BORNE`,
    `DATE_HORS_EXERCICE` (`details.date`, `debut`, `fin`), `PIECE_JUSTIFICATIVE_INCONNUE` (`details.pieceId`) ;
    404 `ECRITURE_INTROUVABLE` ; 503 `DOCUMENTS_INDISPONIBLES`. Un `details` peut porter des nombres.
  - **Numérotation** : un brouillard prend un numéro PROVISOIRE (`<code>-BR-000001`, série à part par journal et par
    exercice, dans la transaction de la saisie) ; le numéro définitif viendra à la validation (STORY-964, D-962-1).
  - **Piste** : acte neuf `ECRITURE_SAISIE`, avec sa provenance (Q3).
  - **Lu chez C** (`document-service`, **sans rien lui demander de changer**) : `GET /api/v1/dossiers/{dossierId}/pieces?pieceId=`,
    avec le jeton du membre, borné à 3 s (D-962-4).
  - **Lu chez B (auth)** : le claim `dv` du jeton, qui clé le cache des droits `(membre, organisation, dv)` (D-962-5).
  - Variable neuve, requise : `DOCUMENT_SERVICE_URL`. Aucun topic, aucun schéma au registre.

- **2026-11-17, STORY-961 — le plan de journaux, annoncé AVANT la fusion du code** (`prospera-comptabilite-service`,
  EPIC-112 ; fiche `stories/STORY-961.md`, D-961-1 → 7). **Fusionné le 17/11** : comptabilite #3, `acafd6f` sur
  `dev` (annonce : stories #621). Tout est AJOUT : rien d'existant ne change de forme.
  - **Route neuve** : `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/journaux` → `{ dossierId, exerciceId,
    referentiel, versionDuPlan, arreteLe, journaux: [{ code, libelle, nature, dernierNumero }] }`. Ouverte à tout
    membre dont la portée couvre le dossier ; au manifeste en `routesLectureSeule`.
  - **Le plan** est déclaré par référentiel (`plans-de-journaux@1`, donnée du service : SN, SMT, SFD-BCEAO, CIMA ;
    six natures `ACHATS`, `VENTES`, `BANQUE`, `CAISSE`, `OPERATIONS_DIVERSES`, `A_NOUVEAUX` ; codes `AC`, `VE`, `BQ`,
    `CA`, `OD`, `AN`). Il est arrêté pour l'exercice à son ouverture au JOURNAL, dans la transaction de la tenue.
  - **Refus nommés neufs** : 409 `EXERCICE_TENU_AUX_CAHIERS` (`details.tenue`), 409 `PLAN_DE_JOURNAUX_ABSENT`,
    404 `JOURNAL_INCONNU` (numérotation, pour 962).
  - **Piste** : l'entrée `EXERCICE_OUVERT` d'une ouverture au journal reçoit `donnees.referentiel` et
    `donnees.planDeJournaux` (`<référentiel>@<version>`).
  - **Numérotation** : `series-v1` de `prospera-plateforme` (dossier de D), copiée à l'octet, une série par journal et
    par exercice, numéro émis dans la transaction de l'acte. Aucune route ne l'expose avant 962.
  - **Lu chez B (auth)** : `droitsHorsJeton` de `GET /moi/droits` (contrat 1.1.0) ; la garde lit désormais
    `droits ∪ droitsHorsJeton`.
  - Aucun topic, aucun schéma au registre.

- **2026-11-17, STORY-960 — les 15 rôles du distributeur dans auth, annoncé AVANT la fusion du code**
  (`prospera-auth-service`, EPIC-223 ; fiche `stories/STORY-960.md`, D-960-1 → 12). **Fusionné le 17/11** : auth #42,
  `cf8e001` et `8d48710` sur `dev` (annonce : stories #616) ; `identity.droits.changed-value` version 2 au registre.
  Tout est AJOUT ; deux rôles du socle perdent ou gagnent des droits (ci-dessous).
  - **Rôles** : les 15 rôles `DIST_*` reçoivent la table de l'annexe B.2 du PRD distributeur (131 droits). Aucun rôle
    n'est plus « en attente de module » (ils passent `partiel`). **Changements de droits existants** : `DIST_ADMIN`
    perd `paiement:journal:consulter` et `notification:modele:rediger` ; `DIST_COMPTABLE` déclare, valide et annule
    (cumul signalé ; paiement refuse toujours de valider sa propre déclaration) ; `DIST_SUPERVISEUR` valide les
    encaissements (remises d'espèces). Attribuer `DIST_DG` ou `DIST_DAF` est réservé au dirigeant (ils portent
    `reprise:lot:valider`, 403 `VALIDATION_DE_REPRISE_RESERVEE_AU_DG`).
  - **Catalogue de tenant : 24 → 142 codes.** Les 118 nouveaux sont **hors du jeton** : jamais dans `perms[]`. Le
    jeton reste borné à ses 24 droits (17 + 24 = 41 ≤ 44). `support-client:*` n'y est pas.
  - **`GET /api/v1/moi/droits`** (contrat `moi-droits.openapi.json` 1.1.0) : champ AJOUTÉ `droitsHorsJeton`
    (tableau trié). `droits ∪ droitsPlateforme` reste exactement le `perms[]` du jeton ; **les droits de tenant
    effectifs sont `droits ∪ droitsHorsJeton`**. Pour un lecteur, absent = `[]`.
  - **Jeton d'accès** : claim AJOUTÉ `roleMetier` (code du rôle métier effectif, absent sans rôle). `roles` ne change
    pas.
  - **`identity.droits.changed@1`** : propriété AJOUTÉE, facultative, `roleMetierAttribue` (chaîne ou `null`, 64
    caractères au plus), sujet `identity.droits.changed-value` en **BACKWARD** au registre.
  - **Refus NOUVEAU** : 422 `DONNEE_PRIVEE_HORS_DU_ROLE` (`permissions`) sur la surcharge d'un rôle du socle qui
    gagnerait une donnée privée interdite (rémunérations, commissions, prix d'achat, marge : D-960-4). La résolution
    les retire aussi du jeton et de `/moi/droits`.
  - **Écritures de rôle** : `permissions`, `ajouts`, `retraits` acceptent 256 codes au plus (au lieu de 44).

- **2026-11-17, STORY-959 — les exercices et la tenue, annoncé AVANT la fusion du code**
  (`prospera-comptabilite-service`). **Fusionné le 17/11** : comptabilite #2, `a8784cb` sur `dev` (annonce : stories
  #609). Tout est AJOUT : rien d'existant ne change de forme.
  - **Trois routes neuves** :
    - `POST /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ouverture`, corps `{ tenue: CAHIERS|JOURNAL,
      proposition? }`. 201 à l'ouverture ; 200 si la même tenue est déjà choisie (rien n'est écrit). Droit exigé :
      `comptabilite:exercice:ouvrir`, lu par `GET /moi/droits` d'auth-service avec le jeton du membre.
    - `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/tenue` : la tenue de l'exercice.
    - `GET /api/v1/dossiers/{dossierId}/tenues` : les tenues du dossier, du plus récent au plus ancien.
    - Réponse : `{ dossierId, exerciceId, tenue, debutExercice, precedente?: { exerciceId, tenue }, bascule,
      ouvertPar, ouvertLe }`.
  - **Refus nommés neufs** :
    - 409 `TENUE_EXCLUSIVE` (`details.tenueExistante`, `details.tenueDemandee`) ;
    - 409 `EXERCICE_CLOS` (`details.statut`) ;
    - 404 `EXERCICE_NON_OUVERT` ;
    - 403 `DROIT_INSUFFISANT` (`details.droit`) ;
    - 503 `DROITS_INDISPONIBLES`.
    Les refus portent désormais un `details` facultatif (ajout).
  - **Manifeste amendé** (`manifestes/comptabilite.manifest.ts`, copie à l'octet dans le service) :
    - les deux lectures entrent dans `routesLectureSeule` ;
    - le commentaire des droits dit qu'ils se lisent par `/moi/droits`.
  - **Ce que le service lit chez B (auth)** : `GET /api/v1/moi/droits?organisationId=` → `droits` (tableau de
    chaînes), avec le jeton du membre. Variable neuve, requise : `AUTH_SERVICE_URL`.
  - **Pas encore** : aucun topic produit, aucun schéma au registre (D-959-5). `comptabilite:*` n'est attribué à aucun
    rôle dans auth-service. En réel, l'ouverture répond donc 403 `DROIT_INSUFFISANT` jusqu'à ce qu'il le soit
    (D-959-4).

- **2026-11-17, STORY-958 — un module NEUF, `comptabilite`, annoncé AVANT la fusion du code**
  (`prospera-comptabilite-service`, dépôt neuf). **Fusionné le 17/11** : comptabilite #1, `8f36ef9` sur `dev`
  (annonce : stories #604). Tout est AJOUT : rien d'existant ne change.
  - **Manifeste neuf** : `manifestes/comptabilite.manifest.ts` (code `comptabilite`, sans numéro M ; copie à l'octet
    dans le service, `src/module.manifest.ts`). Neuf droits `comptabilite:*` **déclarés, pas encore attribuables**
    (borne du jeton, jusqu'à l'étape 4 de l'ADR « droits hors du jeton »). Le catalogue ne le connaît pas encore : tant
    qu'il ne l'a pas, le module se lit `NON_INSTALLE` et la garde refuse tout (fermé). Le porter au catalogue est une
    story de B (« Pour la suite » de la fiche 958).
  - **Topic consommé, existant** : `etat-publie.changed.reel` (ou `.essai`, selon `KAFKA_ESPACE`), groupe neuf
    `comptabilite-etat-publie`, au contrat figé `contrat-etat-publie-v1`. **Aucun topic produit, aucun schéma au
    registre** : le premier fait (exercice, STORY-959) sera annoncé ici avant sa fusion.
  - **Route neuve** : `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/referentiel` → `{ dossierId,
    exerciceId, referentiel: SN|SMT|SFD-BCEAO|CIMA, famille: SYSCOHADA|SFD-BCEAO|CIMA, systemeComptable?, herite,
    exercice }`. Refus nommés : 403 `EMAIL_NOT_VERIFIED`, `COMPTABILITE_NOT_ENTITLED`, `ABONNEMENT_EXPIRE`,
    `KYC_NOT_APPROVED` (relayé) ; 404 `DOSSIER_INTROUVABLE` (hors portée compris), `EXERCICE_INTROUVABLE` ; 400
    `IDENTIFIANT_MALFORME` ; 409 `REFERENTIEL_NON_DECIDE`, `REFERENTIEL_INCONNU` ; 503 `DOSSIER_SERVICE_INDISPONIBLE`.
  - **Ce que le service lit chez A** (dossier-service, sans rien lui demander de changer) : `GET /dossiers/{id}`
    (`id`, `orgId`, `referentielComptable`) et `GET /dossiers/{id}/axes?exerciceId=` (`effectifs.decision.
    systemeComptable`, `effectifs.herite`, `effectifs.exercice`), **avec le jeton du membre** : la portée de
    dossier-service s'applique. Un renommage de ces champs casserait la comptabilité : à annoncer à B.
  - **Port** : 3420 (3417 et 3418 sont à l'IA commune, 3419 à `reseau-service`).

- **2026-11-17, STORY-957 — aucun contrat ne change** (notification, paiement, catalogue). Mêmes topics, mêmes
  groupes, mêmes routes ; `/health` garde sa forme. Seul le texte du message `down` du contrôle Kafka est nouveau
  (« broker muet après 5000 ms (connexion ou métadonnées) »). Effet visible : Kafka arrêté, `/health` répond en
  5,3 s au plus en régime, au lieu de 7,8 s ou plus. Kafka revenu, notification et paiement retrouvent leurs groupes
  sans redémarrage.

- **2026-11-17, STORY-956 — `kit-cible` 1.0.1, annoncé AVANT la fusion** (`prospera-plateforme`, étiquette
  `kit-cible-v1.0.1`). **Fusionné le 17/11** : plateforme #22, `189183f` sur `dev`, étiquette posée et poussée. Il corrige D1, D2 et D3 de la relecture de A
  (`coordination/relecture-kit-cible-1.0.0-groupe-A.md`). **Pour A (Dev A, `pdv`), C, D-1055 et tout module cible :
  prendre la 1.0.1, jamais la 1.0.0** : la 1.0.0 perd une ligne en silence quand une clé figure deux fois dans un lot.
  - **Contrat `refus-reprise@1`** : un code de requête **ajouté**, `CLE_EN_DOUBLE` (422). Il refuse toute la requête
    quand une clé d'origine ou un alias est porté par deux lignes, avec le même corps en `SIMULER` et en `APPLIQUER`,
    et `erreurs` nomme les lignes fautives. `code` est un motif, pas une liste fermée : c'est un ajout. La description
    des 422 de `reprise-cible.openapi.json` est complétée. Rien n'est retiré ni renommé, et `reponse-reprise@1` ne
    change pas.
  - **Comportements qui se resserrent** (les contrats ne changent pas, les bornes y étaient déjà) :
    - un montant de `montantsRequis` absent et non marqué dans `montantsASaisir`, ou un état de `champEtat` hors de
      `etats`, donne 422 `SCHEMA_NON_CONFORME` sur toute la requête ;
    - un `etatRetenu` hors de `etats` rendu par le `juger` d'un module donne `REFUSE` / `REFUSE_PAR_LA_CIBLE` ;
    - `message` est borné à 1 024, `erreurs[].message` à 512, `chemin` à 256 et `raison` à 512 (texte coupé par « … ») ;
    - au démarrage, un montant requis déclaré `required` dans le schéma est refusé (`DeclarationInvalide`).
  - **La suite de conformité** (`casDeConformite`) gagne des cas : clé en double, textes bornés, cloisonnement,
    atomicité, `rattacherA`, `controles`, montant requis, saisie refusée, circuit, régime non admis.
    - **Le banc doit désormais fournir `panne`** (`new PanneDeConformite()`, exportée par `conformite.ts`) et en
      envelopper **chaque** raccord de sa cible (`panne.envelopper(raccord)`). Sans elle, le cas d'atomicité échoue.
    - Deux entrées facultatives du profil : `circuit` et `regimeNonAdmis`. `casSansObjet` les nomme quand elles
      manquent.
    - Aucun module n'a encore embarqué la 1.0.0.

- **2026-11-16, STORY-953 — les contrats de l'essai prospect (plateforme, étiquette `contrats-instance-v1`) et leur
  usage par le catalogue, annoncés AVANT la fusion.** Tout est AJOUT : rien d'existant ne change de forme. **Jalon du
  14/12 (EPIC-147) : contrat du jeu de démonstration publié.**
  - **Plateforme, `contrats/instance/`** (générés par `npm run contrats:instance`), pour **tout groupe qui écrit un
    module** (A, C, D) :
    - `jeu-demonstration@1` : un jeu est un dossier, `jeu.json` et ses fichiers de données. Le `jeu.json` porte le
      code, la version, la verticale et un générateur à graine fixe éventuel. Il a une part par module, dans l'ordre
      d'import, et, par objet, un fichier (un tableau JSON), son nombre d'enregistrements et son sha256.
      `npm run jeu:verifier -- <dossier>` le vérifie avant livraison. Jeu témoin de B : `jeux-demonstration/temoin/`.
    - `import-c13-demande@1` et `-reponse@1` : la forme GÉNÉRIQUE de `POST /api/v1/instance/<code>/{organisationId}/import`
      (la route `routesInstance.import` du manifeste). Un lot porte les enregistrements d'**un** objet. Il est
      idempotent sur `idempotence` : `IMPORTE`, puis `DEJA_IMPORTE` au rejeu. `source` vaut `JEU_DEMONSTRATION`
      (avec `jeu`) ou `DOSSIER_INSTALLATION`.
    - `effacement-c13-demande@1` et `-accuse@1` : la forme GÉNÉRIQUE de
      `POST /api/v1/instance/<code>/{organisationId}/effacement` (`routesInstance.effacement`). Le module efface tout
      ce qu'il tient de l'organisation dans l'espace servi, puis accuse : `EFFACE`, ou `DEJA_EFFACE` au rejeu. Tout
      autre statut ou un corps hors contrat n'est PAS un effacement.
    - `certificat-effacement@1` : la charge du JWS `prospera-certificat-effacement+jws`, signé par une clé d'usage
      `centrale`, audience `prospect`. Il donne chaque propriétaire et son accusé (`EFFACE`, `DEJA_EFFACE`, ou
      `SANS_ROUTE` s'il ne déclare aucune route), et la date d'expiration de la dernière sauvegarde.
      `@prospera/signature` reconnaît ce `typ` (ajout à `SIGNATAIRE_DE`).
    - `instance-c13.openapi.json` : les deux routes génériques.
  - **Catalogue (`contrat/essai-prospect.openapi.json`, ajouts facultatifs)** :
    - `POST /api/instance/v1/essais` accepte `jeuDemonstration: { code, version }`. Un jeu inconnu rend
      **422 `JEU_DEMONSTRATION_INCONNU`**.
    - L'essai porte `jeu` (code, version, état d'import par part : `A_IMPORTER`, `IMPORTE`, `NON_IMPORTE` et sa
      raison) et `effaceLe`. Son `statut` gagne **`EFFACE`** (lecteur tolérant : une valeur de plus).
    - Routes nouvelles :
      - `POST …/essais/{organisationId}/jeu-demonstration` : rejouer l'import ;
      - `POST` et `GET …/essais/{organisationId}/effacement` : le plan, les accusés et le certificat. Refus :
        **409 `EFFACEMENT_PREMATURE`** avant `effacementLe`, `ESSAI_SIGNE`, `ESSAI_SANS_JEU`, `ESSAI_EFFACE`, 404
        `EFFACEMENT_INCONNU`.
    - L'effacement part **seul** à `effacementLe` (file BullMQ `effacements-d-essai`). Une fois effacée,
      l'organisation voit ses modules `DESINSTALLE` dans l'espace d'essai.
    - Configuration nouvelle : `JEUX_DEMONSTRATION_DIR` (le jeu témoin est dans l'image), `JEUX_DEMONSTRATION_LOT`,
      `EFFACEMENT_KID`, `EFFACEMENT_CLE_PRIVEE_JWK`, `EFFACEMENT_CERTIFICAT_DE_CLE`,
      `EFFACEMENT_RETENTION_SAUVEGARDES_JOURS` (92 par défaut). Sans clé, ou avec une clé hors de sa validité,
      l'organisation est effacée mais le certificat attend (`CLE_DE_SIGNATURE_ABSENTE`,
      `CLE_DE_SIGNATURE_HORS_VALIDITE`).
  - **Pour A, C et D** : chaque module de démo (EPIC-160) sert ces deux routes C13 à ses chemins déclarés, et livre son
    jeu au format `jeu-demonstration@1`. Voir « Demandes aux autres groupes ».

- **2026-11-16, STORY-951 — essai ou réel (catalogue #56, `8f3e321`), annoncé AVANT la fusion.** Tout est AJOUT :
  rien d'existant ne change de forme. Contrat : `platform-catalog-service/contrat/mise-en-service.openapi.json`.
  - **Routes nouvelles** (service `/api/v1`, public `/api/instance/v1`) :
    - `POST /sorties-essai/{organisationId}/verifier` `{ module, destination: { type, adresse } }` : 200
      `{ autorisee: true, motif: REEL | LISTE_BLANCHE }`, ou **403 `ECRITURE_REELLE_DEPUIS_ESSAI`** (avec
      `interceptionId`), journalisé ; jeton du membre ou identité de service, limité à l'organisation ;
    - `GET|POST /sorties-essai/liste-blanche`, `DELETE /sorties-essai/liste-blanche/{id}`,
      `GET /sorties-essai/{organisationId}/interceptions` (console) ;
    - `POST|GET /mises-en-service/{organisationId}` (`entitlement:grant` / `org:read`) : 201, puis 200 au rejeu ;
      refus **409** `MISE_EN_SERVICE_HORS_DU_REEL`, `MISE_EN_SERVICE_MODULE_NON_INSTALLE` (`modules`),
      `MISE_EN_SERVICE_REPRISE_D_ABORD`, **`MISE_EN_SERVICE_SANS_FEU_VERT`** (`modules` :
      `{ module, etat, epoque, numero }`), **503** `VERIFICATION_DONNEES_IMPORTEES_NON_EXECUTEE` (`raison`).
  - **Topic nouveau, produit** : `reception-definitive.enregistree` (AD-17), clé `organisationId`, schéma
    `contrat/schemas/reception-definitive.enregistree.json` (fermé ; registre au prochain `schemas:enregistrer`).
    Consommateur prévu : reprise-service.
  - **Topic nouveau, consommé** (réel seulement) : `reprise.feu-vert.changed`, groupe `platform-catalog-feux-verts`,
    lu au contrat publié par la plateforme (`kit-cible-v1.0.0`).
  - **La partie A appelle la Reprise** : `POST /api/v1/instance/reprise/{org}/verifications/donnees-importees`, à
    l'adresse du module `reprise` (`INSTALLATION_SERVICES`), sous `INSTALLATION_JETON_SERVICE`.
  - **Pour tout module qui écrit vers l'extérieur** (notification : courriels et SMS ; paiement ; Connecteurs ;
    C : sinistres, liaison-assureur) : dans l'espace d'essai, appeler `verifier` avant chaque envoi, et ne pas envoyer
    sur un 403. Rien n'est imposé aujourd'hui (aucun module n'est encore déployé en essai) ; chaque groupe le branchera
    avec son espace d'essai. **Pour D** : les écrans de la liste blanche, du journal et de la mise en service viendront
    au lot frontend.

- **2026-11-16, STORY-945 — la bascule (catalogue #55, `99ba2db`, `9798ff5`), annoncée AVANT la fusion ; fusionnée
  avant A-917 sur décision de l'utilisateur.**
  - **`PUT /api/v1/catalog/entitlements/{org}/{module}`** : même chemin, même corps, mêmes succès (201, 200). Mais :
    - le droit est posé **par un plan** (`origine: CONSOLE_PUT`, joué avant la réponse) ;
    - `source` vaut `moteur:<plan>` et non plus `admin` (une sanction `SUSPENDED` reste `admin`) ;
    - **refus nouveaux** : 422 `MODULE_DEPENDANCE_MANQUANTE` (champ `refus` : ouvrir la dépendance d'abord),
      422 `MODULE_INCONNU` (module sans manifeste), 409 `INSTALLATION_EN_COURS`, 409 `INSTALLATION_INACHEVEE`
      (champ `planId`) ;
    - **pour D** (console, lot frontend) : ces codes entrent dans l'union des refus du `PUT`.
  - **L'échéance soldée n'ouvre plus aucun module** (PRD FR-4, chemin 2) : elle prolonge ceux qui sont installés et
    note les autres « acquis, à installer ». `entitlement.changed` n'est émis que pour une prolongation. **Pour A** (le
    cabinet) : un cabinet qui paie n'a son module qu'une fois installé par le moteur ; c'est l'objet d'A-917.
  - **Le vertical n'ouvre plus rien** : plus de droit `source: vertical:<v>`. Plus de propagation d'un package modifié
    aux titulaires : il ne vaut que pour les nouveaux contrats.
  - **`GET /api/v1/offres/{org}`** : champ nouveau `acquis` (`code`, `source`, `depuisLe`, et pour le contrat
    `echeanceLe`, `dossiersMax`, `packs`, `referentiels`) ; les souscrits du point de décision l'incluent. Plans :
    champ nouveau `origine` (`INSTALLATION` | `CONSOLE_PUT`).
  - **L'état publié** : un module **sans ligne d'installation est `NON_INSTALLE`**, droit ou pas (fin de D-936-1). Les
    droits d'avant le moteur se réamorcent par `npm run migrate:reamorcage-moteur`, à jouer au déploiement : sans
    elle, une base existante lit ses modules `NON_INSTALLE`. Les gardes du cabinet, qui lisent encore
    `entitlement.changed`, ne voient rien changer. Notification et paiement, en double lecture, voient un écart
    jusqu'au réamorçage.

- **2026-11-16, STORY-949 — les droits hors du jeton (ADR, étapes 1 et 2) : ajouts, annoncés AVANT la fusion du
  code** (auth, catalogue). Rien d'existant ne change : `perms[]` reste dans le jeton, avec sa borne.
  - **Route nouvelle (auth)** : `GET /api/v1/moi/droits?organisationId=<org du jeton>`, avec le jeton de l'utilisateur.
    Réponse `{ organisationId, userId, dv, roleMetier: { code, origine } | null, droits: string[], droitsPlateforme:
    string[] }` ; `droits ∪ droitsPlateforme` = le `perms[]` du jeton. Refus : 400 `ORGANISATION_REQUISE`, 403
    `ORGANISATION_HORS_JETON`, 403 `APPARTENANCE_INACTIVE` ; un jeton de service : 401. Contrat :
    `auth-service/contrat/moi-droits.openapi.json`.
  - **Claim nouveau (jeton d'accès)** : `dv`, entier, la version des droits du porteur dans `org` (absent sans
    organisation et sur un jeton antérieur). Les lecteurs l'ignorent tant qu'ils ne lisent pas `/moi/droits`.
  - **Topic nouveau** : `identity.droits.changed` (contrat `@1`, sujet `identity.droits.changed-value` en BACKWARD),
    clé `organisationId`, `{ schemaVersion: 1, eventId, occurredAt, userId, organisationId, dv, cause }`, **sans les
    droits**. Une version plus récente que celle d'un cache l'invalide. Producteur : auth-service seul.
  - **Champ nouveau en base** : `memberships.dv` (absent = 0).
  - **Catalogue** : un consommateur de plus (groupe `platform-catalog-droits`) ; les réglages `DROITS_*` sont
    facultatifs (adresse d'auth par défaut : `NAISSANCE_AUTH_URL`). La réponse de l'état publié ne change pas.

- **2026-11-16, STORY-952 — l'essai d'un prospect : ajouts, annoncés AVANT la fusion du code** (catalogue #57,
  notification #88 ; annonce fusionnée par stories #548, avant le code).
  - **Catalogue, contrat NOUVEAU `contrat/essai-prospect.openapi.json`**, servi par la partie A de l'**espace
    d'essai** seulement (409 `ESSAI_HORS_ESPACE_D_ESSAI` dans le réel) :
    - `POST /api/instance/v1/essais` (`entitlement:grant`) ouvre l'essai (J0 → J+30), idempotent sur
      l'organisation. Corps : `organisationId`, `administrateur`, `commercial` (e-mails), `langue?`. L'organisation
      doit être née dans l'espace d'essai (404 `ORGANISATION_INCONNUE`, 409 `NAISSANCE_EN_COURS`) ;
    - `GET …/essais/{organisationId}` (`org:read`) ;
    - `POST …/prolongation` (`jours?` de 1 à 30) : 409 `ESSAI_DEJA_PROLONGE`, `ESSAI_TERMINE` ou `ESSAI_SIGNE`, 422
      `PROLONGATION_AU_DELA_DE_60_JOURS` ;
    - `POST …/signature` : 409 `DELAI_DE_SIGNATURE_ECOULE` passé `effacementLe` ;
    - **pour D** : les écrans d'essai de la console (créer, prolonger, signer) se génèrent depuis ce fichier.
  - **État publié (contrat figé, forme inchangée)** : un module installé d'une organisation en essai se lit
    `ESSAI_PROSPECT` (`finLe`), puis `ESSAI_TERMINE` (`effacementLe`), comme la matrice figée le prévoyait. Une fois
    signé, il se lit `EN_SERVICE`. Les événements `etat-publie.changed.essai` suivent.
  - **Notification** : deux modèles système nouveaux, `essai-fin-proche` et `essai-effacement-proche` (e-mail,
    `fr`/`en`). `platform-catalog-service` entre au périmètre de la route directe, limité à ces deux avis.
    **Déploiement** : ajouter `platform-catalog-service:<jeton>` à `JETONS_DE_SERVICE` de notification, et
    `NOTIFICATION_URL` et `NOTIFICATION_JETON_SERVICE` au catalogue. Sans eux, l'essai court et l'avis ne part pas
    (journal : `AVIS_NON_CONFIGURE`).
  - **Recette (A)** : `RECETTE_HORLOGE_AVANCE_JOURS` existe désormais aussi au catalogue (heure de référence avancée
    d'un nombre entier de jours ; **refusée en production** au démarrage).

- **2026-11-16, STORY-948 — la naissance, le jeton de service, le 404 : ajouts, annoncés AVANT la fusion du code**
  (catalogue #53, auth #40 ; annonce fusionnée par stories #543, avant le code).
  - **Catalogue, contrat NOUVEAU `contrat/naissance.openapi.json`** :
    - `POST /api/instance/v1/naissances` (`entitlement:grant`) et `GET …/naissances/{organisationId}` (`org:read`) ;
    - refus : 409 `NAISSANCE_DIVERGENTE` (`champs`), 422 `NAISSANCE_REFUSEE` (`cause`), 503 `AUTH_INJOIGNABLE`
      (`cause`) et `HORLOGE_INDISPONIBLE`, 404 `NAISSANCE_INCONNUE` ;
    - **pour D** : l'écran de naissance de la console se génère depuis ce fichier ; la console choisit
      `organisationId` une fois et le donne aux deux espaces.
  - **État publié (contrat figé `contrat-etat-publie-v1`, forme inchangée)** :
    - la route rend désormais le **404 `ORGANISATION_INCONNUE`** déjà au contrat, après le 403 ;
    - elle **admet les identités de service** `MOTEUR`, `REPRISE`, `CONNECTEURS` (claim `organisationId`), comme le
      contrat le décrivait. `utilisateur.id` = `service:<identité>`, sans droit effectif.
  - **Auth, route NOUVELLE `POST /api/v1/interne/jetons-de-service`** :
    - le secret de l'identité (`MOTEUR_JETON_SERVICE`, **`REPRISE_JETON_SERVICE`**, **`CONNECTEURS_JETON_SERVICE`**,
      nouveaux) donne un jeton RS256 de 300 s : `sub: service:<identité>`, `identite`, `organisationId`, sans `org`,
      `roles: []`, `perms: []`, `emailVerified: false` ;
    - **pour C et D** (et la Reprise) : c'est le jeton qu'un service présente aux routes `…/{organisationId}/…`
      d'une cible (AD-27). Un service qui ne connaît pas la claim `identite` le refuse par sa garde d'e-mail (403) :
      il faut l'admettre expressément, comme le catalogue le fait (`@AdmetIdentitesDeService`) ;
    - auth-service refuse ce jeton sur ses propres routes (401 `IDENTITE_DE_SERVICE_REFUSEE`).
  - **Auth, refus NOUVEAU** : `VALIDATION_DE_REPRISE_RESERVEE_AU_DG` (403) quand un autre que le DG fait gagner
    `reprise:lot:valider`. Le code n'est pas encore au catalogue de tenant (STORY-949, borne du jeton).
  - **Catalogue, filtre d'erreurs** : `cause` et `champs` passent la liste blanche (chaîne, liste de chaînes).
  - **Recette (A)** : `NAISSANCE_AUTH_URL` (`http://auth-service:3001/api/v1`) et `MOTEUR_JETON_SERVICE` (la valeur
    d'auth) sont à poser sur le catalogue de `docker-compose.recette.yml` pour que la naissance y passe ; sans eux,
    elle répond 503 `AUTH_INJOIGNABLE`, `cause: NAISSANCE_NON_CONFIGUREE`, et rien d'autre ne change.

- **2026-11-16, STORY-944 — l'installation : routes et un contrat NOUVEAUX, rien d'existant ne change** (catalogue #52,
  annoncé avec la PR de docs, juste après la fusion du code : écart à la règle « avant la fusion », sans effet ici
  puisque tout est ajout).
  - **Routes neuves de la console** (surface plateforme, `entitlement:grant` pour écrire, `org:read` pour lire) :
    - `PUT|GET /api/v1/offres/{organisationId}` : l'offre, dépendances dures ajoutées avec leur raison ;
    - `POST /api/v1/installations` : `Idempotency-Key` ; 201 pour un plan créé, 200 pour un plan rejoué ;
    - `GET /api/v1/installations?organisationId=` et `GET /api/v1/installations/{planId}` : étapes horodatées, bilan,
      `interrompueA` ;
    - `POST /api/v1/installations/{planId}/reprendre`.
  - **Refus** :
    - 422 `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE` : tous rendus dans `refus`, dans
      l'ordre d'AD-23 ; `MODULE_INCONNU` ;
    - 409 `MODULE_DEJA_INSTALLE`, `INSTALLATION_EN_COURS`, `CLE_IDEMPOTENCE_REUTILISEE`.
  - **Corps d'erreur du catalogue** : trois champs facultatifs de plus, `refus`, `modules` et `planId`.
  - **Pour A, C et D, propriétaires de modules : le contrat des routes de vérification**
    (`platform-catalog-service/contrat/verification-installation.schema.json`, C13 points 2 et 8).
    - La route : `POST /api/v1/instance/<code>/{organisationId}/verifications/<code-de-verification>`, appelée sous
      l'identité du moteur avec `Idempotency-Key`. Elle répond 200 et `{ schemaVersion: 1, code, voyant:
      VERT|ORANGE|ROUGE, mesure?, detail?, action? }`.
    - Tant qu'un module ne la sert pas, chacune de ses vérifications est `NON_EXECUTEE` : il **ne s'installe pas**
      par le moteur.
    - L'adresse du service se déclare au catalogue : `INSTALLATION_SERVICES=code=url,…`.
  - **État publié** : l'axe 2 d'un module installé par un plan vient du plan. Pour un consommateur, un tel module passe
    `EN_INSTALLATION` avant `EN_SERVICE`. Les autres modules ne changent pas.
  - **Droits** : un droit posé par le moteur porte `source: moteur:<planId>`. `entitlement.changed` ne change pas.

- **2026-11-16, STORY-947 — `kit-cible` 1.0.0 est publié** (`prospera-plateforme`, étiquette `kit-cible-v1.0.0`).
  **Pour A (Dev A, `pdv` en S5), C et D-1041, et tout module cible** :
  - **Comment le prendre** : copier `bibliotheques/kit-cible/distribution/` à l'étiquette, à l'octet
    (`git -c core.autocrlf=false show kit-cible-v1.0.0:bibliotheques/kit-cible/distribution/<fichier>`), dans le
    service (par ex. `src/vendor/kit-cible/`), avec `EMPREINTES.json` et un test qui revérifie les sha256. Elle se
    compile en CommonJS ; le service déclare `ajv` ^8 (`mongodb` vient de Mongoose).
  - **Ce que chaque module cible joue** : `casDeConformite(profil)` (`conformite.ts`), dans sa CI, sous jest
    (`it(c.nom, c.jouer)`) : objet simple, objet chaîné, et s'il en a, montant requis et ouverture.
  - **Sur MongoDB** : `ouvrirMagasinMongo(client, { base })` exige un **jeu de répliques** (`JEU_DE_REPLIQUES_EXIGE`) ;
    le kit pose ses collections `reprise_*`.
  - **Contrat `refus-reprise@1`** : `OUVERTURE_CLOSE` (409) **ajouté** aux codes ; `reprise-cible.openapi.json` gagne
    une réponse 409. Rien de retiré ni de renommé.
  - **API ajoutée au kit** : `saisirMontant` (motif exigé, trace), `lireFiche`, `lireTraces`, `ouvertureClose` /
    `ouvertureCloseHorsInstallation`. `Session` gagne `tracer` et `lireTraces` (un raccord maison les implémente).

- **2026-11-16, STORY-954 — DES CONTRATS NOUVEAUX, rien d'existant ne change** (`prospera-plateforme`, EPIC-169).
  - **`seuils-fraicheur@1`** (`contrats/seuils-fraicheur.json`, étiquette `seuils-fraicheur-v1`) : immédiat 5 / 15 min,
    heure 1 h / 3 h, nuit rouge à 06:00 heure locale, `messageDes`. **Pour la coque (Dev A, 11/12)** : générer la
    table de fraîcheur depuis ce fichier, copie épinglée ; aucune autre table.
  - **`contrats/echange/`** (étiquette `contrats-echange-v1`) : `echange-enveloppe@1`, `echange-reponse@1`,
    `connecteurs.domaine.changed@1`, `domaines-echange@1` (corps identique au champ C1 du catalogue) et
    `domaines-echange.cas.json`. Consommateurs : le kit des cibles (EPIC-170), Connecteurs, le catalogue.
  - **`@prospera/point-ecriture-unique`** (étiquette `point-ecriture-unique-v1`). **Pour A, C et D, dans tout module
    qui déclare `domainesEchange`** : copier `paquets/point-ecriture-unique/src/index.ts` à l'étiquette (sha256 dans un
    `ORIGINE.json`, patron de la garde de 937), poser `@PointDEcriture('<module>.<domaine>')` sur **la** méthode de
    service qui écrit chaque domaine, et jouer `verifierPointsDEcriture` dans un test (gabarit dans l'en-tête du
    fichier). Les faits du domaine portent `objetId` (stable) et `rang`.
  - **Catalogue** : aucun changement de comportement. `domainesEchange` de C1 est désormais une **copie** du contrat de
    la plateforme (`contrat/copies/echange/`, empreintes gardées) : un changement du champ passe par une version
    étiquetée de la plateforme, puis la copie.

- **2026-11-16, STORY-942 — `auth-service` : un champ AJOUTÉ, rien de changé sur le fil.**
  - **`GET /api/v1/users`** et **`GET /api/v1/admin/organizations/{id}`** (membres) gagnent `roleMetier`, facultatif :
    `{ code, libelle | null, origine: ATTRIBUE | PAR_DEFAUT, droits: string[] }`, ou `null` pour un membre sans rôle
    métier. Mêmes règle et droits que le jeton (surcharge appliquée). `role` et `tenantRole` ne changent pas. **Pour D**
    (et A, FE-115) : régénérer les types depuis l'OpenAPI ; l'écran n'a plus à deviner le rôle par défaut.
  - **Les six événements `identity.*` ont un schéma** (`auth-service/contrat/schemas/`), enregistrés au registre en
    BACKWARD (sujets `<topic>-value`) : désormais, **ajouts facultatifs seulement**. Le format sur le fil est
    inchangé (JSON nu, mêmes clés, aucun en-tête de registre). `identity.org.created` garde `createdByUserId`
    facultatif (STORY-938).
  - Le client Kafka d'auth-service passe à Confluent : aucun effet pour les lecteurs.

- **2026-11-16, STORY-950 — aucun contrat ne change sur le fil.** notification lit désormais
  `etat-publie.changed.<espace>` (groupe nouveau `notification-etat-publie` ; variables facultatives
  `KAFKA_ETAT_PUBLIE_GROUP_ID` et `INSTANCE_ESPACE`, défaut `REEL`). Ce qu'il publie est inchangé. **Pour A**
  (recette) : aucune variable à ajouter au compose. **Pour tous** : sans Kafka, notification, le catalogue et paiement
  démarrent désormais leur HTTP tout de suite (le producteur n'est plus attendu à l'amorçage).

- **2026-11-16, STORY-946 — les CONTRATS DE LA REPRISE et le KIT DES CIBLES sont publiés** (`prospera-plateforme`,
  commit `300779e`). Contrats neufs, rien d'existant ne change. **Pour A, C et D, qui écriront des cibles :**
  - `contrats/reprise/` (draft-07, `@1`, ajouts facultatifs seulement, annoncés ici) : `enveloppe-reprise`,
    `reponse-reprise`, `refus-reprise`, `controles-demande`, `controles-reponse`, `declaration-objet` (`x-reprise`),
    `reprise.feu-vert.changed` (réel seulement), `reprise.historique.livre`, `verification-donnees-importees`, `sante`,
    et deux OpenAPI 3.1 (`reprise-cible`, `reprise-c13`). Générés par `npm run contrats:reprise` : n'éditez pas les
    fichiers.
  - **Un schéma d'objet** (votre module, `contrats/objets/<code>/<objet>@<n>.<m>.json`) : JSON Schema draft-07 FERMÉ des
    `champs`, `$id` terminé par `/objets/<code>/<objet>@<n>.<m>.json`, déclaration de reprise dans `x-reprise`
    (`references`, `regimes`, `etats`, `champEtat`, `montantsRequis`, `valeursDeControle`).
  - **`@prospera/kit-cible` 0.1.0** (`bibliotheques/kit-cible`) : `creerCible({ code, objets: [{ schema, raccord }],
    transactions, etatPublie })` puis `traiterRequete(cible, { methode, chemin, appelant, corps, octets })` dans votre
    contrôleur. Refus de requête : 404 `OBJET_INCONNU`, 403 `ORGANISATION_HORS_JETON` ou code de garde de la matrice,
    413 `LOT_TROP_GROS`, 422 `ENVELOPPE_NON_CONFORME` | `SCHEMA_NON_CONFORME` | `VALIDATION_ABSENTE`. Codes d'objet :
    `REFERENCE_INCONNUE`, `VERDICT_DIFFERENT`, `ALIAS_DEJA_UTILISE`, `VERSION_ANTERIEURE` (avec `INCHANGE`),
    `OBJET_HISTORIQUE`, `RATTACHE` (avec `INCHANGE`), `REFUSE_PAR_LA_CIBLE`. ⚠ Réglez votre analyseur de corps
    au-dessus de 1 Mio : c'est le kit qui répond 413. **0.x : la forme peut encore bouger jusqu'à la 1.0.0 de
    STORY-947** ; ne l'embarquez pas avant.

- **2026-11-16, STORY-943 — le POINT DE DÉCISION est publié** (`prospera-plateforme/paquets/point-de-decision`,
  étiquette `point-de-decision-v1`, commit `5883740`). Contrat neuf, rien d'existant ne change.
  - `decider({ lieu: 'PLATEFORME' | 'SITE', organisationId, module, souscrits, licence: string[] | null, dependances,
    installes, planifies? })` ⇒ `{ ouvert: true }` ou `{ ouvert: false, code, refus: [{ code, modules? }] }` :
    **tous** les refus, dans l'ordre `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE`
    (`modules` : dépendances manquantes) ; `code` est le premier. Sur site, `MODULE_HORS_LICENCE` seul, et pas de
    licence = fermé ; sur la plateforme, `licence: null` = hébergé.
  - **Copie** : `src/index.ts` (sha256 `de37c40e…d940`) et `conformite.json` (sha256 `6f3eb92c…af97b`), recopiés
    depuis le blob de l'étiquette, avec un `ORIGINE.json` ; le consommateur rejoue `conformite.json` contre sa copie.
    Consommateurs prévus : le catalogue (STORY-944), la centrale (STORY-955).
  - `@prospera/point-de-decision/licence` : `lireLicence` (sur site ; horloge scellée ; refus `HORLOGE_INDISPONIBLE`,
    `LICENCE_AUTRE_INSTANCE`, `LICENCE_ANTERIEURE`, `LICENCE_INVALIDE`).

- **2026-11-15, STORY-940 — catalogue : `declarations` consomme les paquets fiscaux.**
  - Le semis donne à `declarations` les familles `syscohada-revise`, `zone-franche-togo`, **`fiscal-tg-entreprise`**,
    **`fiscal-tg-entreprise-zone-franche`**. L'octroi d'un paquet `fiscal-tg-*` à `declarations` est accepté (il
    partait en 422 `REFERENTIEL_INCOMPATIBLE`) ; aucun refus nouveau.
  - **Une base déjà semée** se répare par `npm run migrate:familles-fiscales` (ajout seul, idempotent), à jouer au
    déploiement du catalogue. Le semis ne réécrit jamais un module présent.
  - **Pour A et la recette** : `zone-franche.recette.ts` ne patche plus `declarations` ; elle vérifie le semis.
  - **Pour D** : `GET /api/v1/catalog/admin/modules` rend deux familles de plus pour `declarations` ; l'écran
    d'octroi les propose.
  - **Régression de STORY-930/937 corrigée (catalogue et paiement)** : sous le client de Confluent, un consommateur
    abonné à un topic que personne n'a encore écrit ne crée pas son groupe, et ne voit le topic qu'au
    rafraîchissement des métadonnées (5 minutes) ; kafkajs le faisait créer. Sur une pile neuve,
    `platform-catalog-abonnements` n'existait donc pas, et **le `globalSetup` de la recette s'arrêtait**. Correctif de
    C (`document-service`, STORY-982) repris : les deux consommateurs du catalogue et la supervision de paiement
    **créent les topics abonnés absents avant `subscribe`**, aux réglages du broker ; un échec est journalisé et
    n'empêche pas l'abonnement. (`allow.auto.create.topics` ne suffit pas : la couche de compatibilité le pose déjà.)

- **2026-11-15, STORY-939 — `paiement` :**
  - **`POST /api/v1/abonnements` peut répondre 422 `MODULE_NON_VENDABLE`** (champ `modules`) pour un module à la
    carte sans manifeste vendable au catalogue, ou dont une dépendance n'en a pas. La casse ne compte pas
    (`MICROFINANCE` = `microfinance`). Tant que le catalogue n'a publié aucun manifeste, rien n'est refusé. Les
    modules vendus par la recette (`conseil`, `microfinance`, `assurance`, ceux des packages) ont tous un manifeste :
    rien ne change pour elle.
  - Route nouvelle : `GET /api/v1/offres/resolution?modules=a,b` (surface plateforme, droit
    `paiement:demande:emettre`), réponse `{ modules: [{ code, ajoutePar: { code, raison } | null }], inconnus }`.
  - Consommateur nouveau de `catalogue.manifeste.publie`, groupe `paiement-manifestes`.
  - **Pour D** : `tickets/TICKET-FRONTEND-console-manifestes.md` (les écrans de la console pour les manifestes).

- **2026-11-15, STORY-938 — `auth-service` :**
  - **`identity.org.created` : `createdByUserId` devient FACULTATIF** (absent pour une organisation née du moteur),
    plus un champ facultatif `origine` (`INSCRIPTION` | `MOTEUR`). Lecteurs :
    - `dossier-service` tolère (chaîne vide) ;
    - `expert-comptable` range la valeur telle quelle ;
    - **pour C** : le type de `document-service` (`src/kafka/events/identity-events.ts`) le déclare obligatoire, à
      relâcher (lecteur tolérant, C12).
  - **Catalogue de tenant : 16 → 24 codes** (8 droits `instance:*`, hors souscription). La regex des droits admet le
    tiret dans les trois segments. **Pour D** : l'écran des rôles reçoit les droits `instance:*`, toujours
    disponibles.
  - Route interne nouvelle : `POST /api/v1/interne/organisations` (jeton de service du moteur, `MOTEUR_JETON_SERVICE`).
  - Décision d'architecture : **les droits de tenant sortent du jeton**
    (`architecture/decisions/ADR-droits-hors-du-jeton-2026-11-15.md`) ; rien ne change avant ses stories.

- **2026-11-15, STORY-937 — la GARDE PARTAGÉE est publiée** (`prospera-plateforme/paquets/garde-etat-publie`, étiquette
  `garde-etat-publie-v1`). **Pour tout groupe qui garde un module** (C : sinistres, assurance ; A et les propriétaires de
  bilan, balance, microfinance, notification) : copier `src/index.ts` à cette étiquette dans le service, garder son
  sha256 (patron : `prospera-paiement-service/src/vendor/garde-etat-publie/`), projeter `etat-publie.changed.<espace>`
  (appliquer si `(epoque, numero)` est plus récent), puis jouer la double lecture. Aucun contrat existant ne change :
  paiement continue de lire `entitlement.changed` pour l'ancienne garde.

- **2026-11-15, STORY-936 — la vraie route est servie, rien ne change au contrat.**
  `GET /api/instance/v1/etat-publie/{organisationId}` (service `/api/v1/…`) répond au contrat figé
  `contrat-etat-publie-v1`, et `etat-publie.changed.reel` est émis (topic par espace, `numero` croissant). **Pour D** :
  la doublure de la coque peut être comparée à la vraie route dès maintenant. Écarts connus, sans changement de forme :
  l'axe 2 se déduit du droit jusqu'à EPIC-144 ; pas encore de 404 ni de jeton de service (STORY-938) ; `interrupteurs`
  vide, `estDG` faux (STORY-936, D-936-1 → 4).

- **2026-11-15, STORY-935 — un contrat NOUVEAU, cinq droits RENOMMÉS.**
  - `catalogue.manifeste.publie` (AD-17) : l'état absolu d'une `ModuleVersion` (module, version, statut, manifeste
    C1), clé `<module>@<version>`, topic **compacté**. Schéma :
    `platform-catalog-service/contrat/schemas/catalogue.manifeste.publie.json`, au registre. Consommateur prévu :
    paiement (STORY-939).
  - **Droits renommés** (borne de 40 caractères du jeton ; manifestes, PRD du distributeur et de la microfinance,
    épics du distributeur) : `approvisionnement:commande-fournisseur:{valider,suggerer,consulter}` →
    `approvisionnement:bon-commande:{valider,suggerer,consulter}` ; `finance-transactions:rapprochement:effectuer` →
    `finance-transactions:releve:rapprocher` ; `finance-transactions:tresorerie:consulter` →
    `finance-transactions:tresorerie:lire`. **Pour D et C** : aucun écran ni service ne les employait encore ; tout
    écran à venir prend les nouveaux noms.
  - Le catalogue sème les 46 manifestes au démarrage (dont `instance`). La garde source/copie se joue par
    `MANIFESTES_SOURCE=<prospera-stories>/manifestes npm run manifestes:garde` : **tout groupe qui modifie un manifeste
    de `prospera-stories/manifestes/` le dit ici**, B en tire une copie (une version nouvelle si la version publiée
    change).

- **2026-11-15, STORY-934 — deux contrats NOUVEAUX** (rien d'existant ne change) dans `platform-catalog-service/contrat/` :
  - `manifeste-module.schema.json` : le manifeste C1 (draft-07, fermé). Un droit tient en **40 caractères**, à tiret
    dans ses trois segments ; un topic existant garde sa graphie sans `@`. La source reste `src/module.manifest.ts` de
    chaque service ; le catalogue garde une copie, comparée par une garde (motif obligatoire pour toute divergence) ;
  - `resolution-dependances.json` : les cas de la résolution des dépendances dures. **paiement** (STORY-939) et la
    **console** (D) en gardent une copie et les rejouent : la même offre se résout à l'identique.
  - `POST /api/v1/catalog/admin/modules/:code/versions` accepte un champ facultatif `manifeste` ; refus 422 nommés
    (`MANIFESTE_INVALIDE`, `MANIFESTE_OBJET_HORS_MODULE`, `MANIFESTE_ARGENT_SANS_CONTROLE`,
    `AVEC_PERTE_INTERDIT_PLATEFORME`, `MANIFESTE_DEPENDANCE_MINEURE`, `MANIFESTE_CYCLE`).

- **2026-11-15, STORY-932 — LE CONTRAT D'ÉTAT PUBLIÉ EST FIGÉ** (catalogue #44, étiquette `contrat-etat-publie-v1`).
  À lire par **tous** (plan §7, « B → tous ») :
  - `platform-catalog-service/contrat/etat-publie.openapi.json` : `GET /api/instance/v1/etat-publie/{organisationId}`
    (service : `/api/v1/…`) ; 403 `ORGANISATION_HORS_JETON`, 404 `ORGANISATION_INCONNUE`, 503 `HORLOGE_INDISPONIBLE` ;
  - `contrat/matrice-etats.json` : neuf états ; menu, bandeau et destinataires ; garde par sorte de route (16) et par
    identité (`UTILISATEUR`, `MOTEUR`, `REPRISE`, `CONNECTEURS`) ; 33 cas de calcul ;
  - `contrat/schemas/etat-publie.changed.json` : l'événement sur `etat-publie.changed.essai` / `.reel` (même définition
    d'un module ; `numero` croissant : un consommateur n'applique que si `(epoque, numero)` dépasse le dernier appliqué).

  **Désormais : ajouts facultatifs seulement**, chacun annoncé ici avant sa fusion. Les consommateurs en gardent une copie
  testée, lisent en lecteur tolérant (champ inconnu ignoré, état inconnu = `NON_INSTALLE`) et ferment sur une
  `versionMatrice` inconnue. **Pour D** : la doublure de la coque (PRA-01) et l'app expert-comptable se génèrent depuis
  ces fichiers. La vraie route arrive avec STORY-936.

- **2026-11-15, STORY-930 — aucun changement sur le fil.** Le catalogue publie `entitlement.changed` avec le client
  de Confluent : même JSON, même clé (`orgId`), aucun en-tête de registre. Le **schéma** du payload v2 est désormais
  versionné (`platform-catalog-service/contrat/schemas/entitlement.changed.json`, modèle fermé) et enregistré sous
  le sujet `entitlement.changed-value`, en compatibilité BACKWARD : tout ajout doit être **facultatif**. Un champ
  requis ajouté, un type changé ou une propriété retirée sont refusés (`npm run schemas:compatibilite`, code 1).

## Questions à l'utilisateur ou au PO

- **STORY-961, le plan de journaux du SMT** (D-961-1) : le système minimal de trésorerie tient, selon l'AUDCIF, un
  journal de trésorerie (recettes et dépenses) plutôt que des journaux d'achats et de ventes. Choix par défaut : le
  plan SMT déclare les six journaux, comme SN, puisqu'un exercice SMT tenu AU JOURNAL tient une comptabilité en
  partie double ; un plan SMT propre se déclarerait en version 2, sans code. Contestable.
- **STORY-960, les droits d'`automatisations`** (D-960-10) : l'annexe B (et l'annexe A, C7) du PRD distributeur
  nomment `automatisations:regle:gerer`, `:regle:activer`, `:cible:valider`, `:journal:consulter` ; le manifeste
  `manifestes/automatisations.manifest.ts` déclare `:regle:ecrire`, `:regle:activer`, `:arbitrage:decider`,
  `:execution:annuler`. Auth suit l'annexe B. Choix par défaut : le manifeste se réaligne sur l'annexe avec la story
  du module. Contestable.
- **STORY-960, rôle par défaut du distributeur** (D-960-12) : aucun ; un membre sans rôle `DIST_*` n'a aucun droit.
  Choix par défaut : on garde (FR-4). Alternative : `DIST_ADMIN` par défaut au `TENANT_ADMIN`.

- **STORY-951, l'invitation au réel** (AD-15 : « l'invitation au réel part à la mise en service ») : **pas faite**
  dans 951 (D-951-8). Il manque une route d'invitation pour l'identité de service du moteur dans auth. Choix retenu
  par défaut : elle viendra avec la console de mise en service, dans une story de B. Contestable.

- **Réglages de `centrale-service` et `agent-instance`** (STORY-955) : la fusion par commit, par squash et par rebase
  est permise dans les deux dépôts. « Rebase and merge » seul est **à poser par l'utilisateur** dans les réglages
  GitHub ; la session ne touche pas aux réglages.
- **D-955-2 : pas de NestJS au premier incrément de l'agent et de la centrale.** Ils tournent en TypeScript natif
  sous Node 24, comme `prospera-plateforme`, dont ils copient le code. L'exécuteur doit rester minimal (AD-36), et
  `jose` 6 est ESM seul. La centrale passera à NestJS, MongoDB et Kafka avec le parc et le contact mTLS (suite
  d'EPIC-148). **Contestable.**

- **ADR « droits hors du jeton » (STORY-938)** : adoptée par défaut, sur la recommandation de A. **Contestable** par le
  PO jusqu'à sa première story de mise en œuvre.
- **Passation d'auth, reste non traité** : la console affiche « sans rôle métier » pour un membre qui reçoit le rôle
  par défaut (l'API d'administration rend le `tenantRole` stocké, pas le rôle effectif). À nommer en story (B, lot
  suivant).

- **Réglages de `prospera-plateforme`** (plan §10, action 1) : « Rebase and merge » seul n'a pas pu être posé par la
  session (commande refusée par le mode automatique). Commits de fusion et squash y sont encore permis. À poser dans
  les réglages GitHub du dépôt.

## Pièges rencontrés

- **Paiement : une écriture d'argent neuve doit entrer dans l'inventaire FERMÉ** de `piste-opposable.invariant.spec.ts`
  (`ECRITURES_DARGENT`) : tout fichier qui appelle `this.ecriture.executer` y est listé par son nom (STORY-963).
- **Paiement : `EcritureDArgent` ne reprend rien, et c'est voulu** ; un cas d'usage idempotent par sa clef peut
  reprendre `ECRITURE_CONCURRENTE` lui-même, aussitôt et en nombre borné (AD-12 interdit la minuterie). Mesuré sur
  `rs-paiement` : 20 ouvertures concurrentes de la même clef, trois essais suffisent, aucun 409 ne sort (STORY-963).
- **Paiement : un rejeu qui passe par `EcritureDArgent` consigne une trace même quand rien ne naît** (la trace est
  obligatoire). Pour qu'un rejeu n'écrive rien, lever une erreur sentinelle dans `ecrire` quand l'upsert n'a rien
  inséré : la transaction est abandonnée, on rend la Créance existante (`RejeuSansEffet`, STORY-963).
- **La clef primaire d'une créance est insensible à la casse** (`normaliserReferenceExterne` met en majuscules) :
  deux identifiants qui ne diffèrent que par la casse visent la même clef. Comparer l'identifiant relu à la lettre
  (STORY-963, `CREANCE_SOURCE_EN_CONFLIT`).
- **Script de mutations : ne jamais écrire `\n` dans une chaîne Python par un heredoc qui l'injecte dans un autre
  script** ; la chaîne se casse en vraie fin de ligne. Écrire le script avec l'outil d'écriture et bâtir les motifs
  multilignes avec une constante `NL` (STORY-963).

- **Une variable d'environnement requise de plus fait tomber TOUTE la suite `test:socle`** (STORY-962). `AppModule`
  valide l'environnement à son import ; les suites jouent `--runInBand` et chacune pose son environnement dans son
  `beforeAll`. Une suite qui ne pose pas la variable neuve fait sortir le processus (`process.exit called with "1"`),
  et les suites suivantes ne se jouent pas. Quand on ajoute une variable requise, la poser dans **chaque** suite du
  socle (`test/socle/*.socle-spec.ts`), même avec une adresse factice.
- **Docker Desktop s'est arrêté pendant la story** (17/11, poste B/D) : la session de groupe l'a relancé. Avant de
  lever une pile, vérifier que `docker ps` répond.

- **`series-v1` ne garantit pas l'absence de TROU** (STORY-961) : elle rend des numéros consécutifs et jamais
  réémis, mais un numéro émis par un acte qui échoue ensuite reste consommé. Pour un journal légal, passer la session
  de l'acte au dépôt (`depotMongo(collection, { session })`) : l'incrément est alors annulé avec l'acte, et
  `withTransaction` rejoue la transaction perdante d'une course (erreur transitoire). Prouvé à 50 actes concurrents,
  dont 10 abandonnés : 1 → 40 ; sans la session, la suite rougit.
- **Amorcer les séries avant la première pièce** (STORY-961) : deux premières émissions concurrentes dans une
  transaction se disputeraient l'upsert du document de la série. La comptabilité les amorce à 0 quand elle arrête le
  plan (`Series.amorcer(serie, 0)`).
- **Mutation qui ôte un garde de type** (`!chaines(x)` → `!chaines([])`) : `x` n'est plus rétréci, et la mutation
  rougit par compilation. La réécrire en gardant le rétrécissement (`!chaines(x) && !Array.isArray(x)`).

- **Deux familles de droits de tenant depuis STORY-960** : le jeton (`perms[]`) ne porte que les 24 codes de
  `TenantPermission` ; tout droit neuf est hors du jeton, servi par `/moi/droits` dans `droitsHorsJeton`. Une garde
  qui ne lit que `droits` (comptabilité, D-959-4) ne verra jamais un droit neuf : lire `droits ∪ droitsHorsJeton`.
  Même chose pour les droits neufs de `paiement` (`paiement:creance:consulter`, `:credit-tiers:imputer`, B-963/965).
- **L'inscription publique exige `vertical` et refuse `distributeur`** (`VERTICAL_FERME_A_L_INSCRIPTION`) : pour une
  preuve, s'inscrire `cabinet`, puis `PATCH /api/v1/admin/organizations/{id}/vertical` par l'opérateur. Les jetons de
  vérification et d'invitation se lisent dans les tâches BullMQ (`bull:auth-notification:*`, champ `data`) de Redis.
- **Cinq suites e2e d'auth ne compilaient plus depuis STORY-942** (`TenantRolesService` absent du module de test) :
  réparées par 960. `health.e2e` exige une vraie pile ; `auth-register.e2e` rend 500 sur `dev` aussi (à reprendre).
- **Un heredoc de plus de 90 lignes avec des apostrophes typographiques a échoué** (« unexpected EOF ») : écrire les
  scripts avec l'outil d'écriture, toujours.

- **Une mutation qui casse un rétrécissement de type rougit par compilation** (STORY-959). Exemples :
  `if (deja && false) return f(deja)` (`deja` redevient `T | null`) ; un garde de type qui n'est plus appelé
  (`noUnusedLocals`). Muter en gardant le rétrécissement (`deja && deja.tenue === 'JAMAIS'`), ou muter le corps du
  garde plutôt que son appel. Le script de mutations doit exiger `Tests: … failed` ET l'absence de `TS\d{4}`.
- **Le manifeste de `_wt-b-stories` sort en CRLF** (`core.autocrlf=true` dans le worktree). Un script qui le
  remplace doit normaliser les fins de ligne avant de chercher. La copie dans le service se fait depuis le blob de
  `main`, après la fusion de l'annonce : `git -c core.autocrlf=false show origin/main:manifestes/… > src/module.manifest.ts`.
- **`cat > fichier` sans heredoc attend l'entrée standard** : la commande ne rend jamais la main (STORY-959, un appel
  perdu). Écrire les scripts avec l'outil d'écriture.

- **`prettier --write "src/**/*.ts"` reformate aussi `src/vendor/`** (STORY-958) : la copie épinglée de la garde
  partagée a changé d'empreinte (`01f9e769…` au lieu de `a830c449…`). Seul le test d'empreinte l'a vu, sous Node 24
  (sur le poste en Node 25, la suite qui le porte ne charge pas, à cause du binding natif). `src/vendor/` va dans
  `.prettierignore` de tout service qui en a un ; ne jamais formater tout `src/`.
- **Un `AppModule` avec `ConfigModule.forRoot({ validate })` valide l'environnement dès son IMPORT** : un spec qui
  l'importe en tête plante le worker jest (« child process exceptions »). Le charger par `require` après avoir posé un
  environnement complet (STORY-958, `gardes.spec.ts`).
- **Les ports de développement 3410 → 3419 sont pris** (STORY-958) : 3410 → 3416 et 3419 par les services de C et de D,
  3417 par `prospera-ia-service`, 3418 par `prospera-ia-centrale` (spine de l'IA commune). Un port proposé par un plan
  se vérifie aussi dans les spines et les manifestes, pas seulement dans les compose.
- **Mutations sous ts-jest** : une mutation qui retire le dernier usage d'un import, ou compare deux littéraux sans
  recouvrement, rougit par compilation (`noUnusedLocals`, TS2367). Muter en gardant l'usage (`&& false`, `as string`,
  `return` avant le `throw`) pour rougir sur l'assertion (STORY-958).

- **Client de Confluent : fermer un client admin est SYNCHRONE** (destruction librdkafka) : de 0,45 à 3,8 s, Kafka
  arrêté, et la boucle d'événements est bloquée pendant ce temps (STORY-957). Un contrôle de santé qui crée et ferme
  un client à chaque appel dépasse donc sa propre borne. Garder un client, et ne fermer qu'hors du chemin d'une
  réponse.
- **Une borne ou une minuterie neuve fait rougir les gardes de minuteries** : AC-5 de notification
  (`aucune-minuterie.spec.ts`) et AD-12 de paiement (`ecriture-argent.invariant.spec.ts`). Il faut une exception
  nommée, avec son motif (STORY-957, D-957-7). Une garde qui lit la source d'un fichier (STORY-940 au catalogue)
  suit le code quand on le met en commun.
- **Mutation interrompue = fichier muté laissé** : arrêter un script de mutations en cours laisse le fichier source
  muté (vu sur paiement : borne à 4 s). Après tout arrêt, `git status`, puis `git checkout -- src/` si tout est
  commité.
- **`node_modules` du poste périmés** (paiement sans le client de Confluent, catalogue sans BullMQ) : les specs
  rougissent par compilation. `npm ci --ignore-scripts` les remet à niveau (Node 25).
- **Un heredoc de plus de 180 lignes n'écrit rien, et il mange les antislashs** (`\n` dans un script Python) :
  écrire ces fichiers avec l'outil d'écriture (STORY-957, deux fois).
- **`python -I` ignore `PYTHONIOENCODING`** : un script qui affiche des emojis sous Windows doit appeler
  `sys.stdout.reconfigure(encoding='utf-8')`.

- **Verrou Docker : une prise en deux temps est une course** (STORY-956, 17/11).
  - Ce qui s'est passé : B a lu « pas de verrou », puis a lancé dans le même message la prise du verrou et le `up` de
    sa pile. D avait pris le verrou entre-temps : `grp-b` a tourné environ une minute à côté de `grp-d-1045-verif`,
    puis B l'a descendue avec ses volumes.
  - La règle : prendre le verrou **atomiquement**, avec `( set -o noclobber; echo "B STORY-<n> <heure>" >
    .verrou-docker )`, qui échoue si le fichier existe. N'enchaîner le `up` qu'après le succès de cette commande,
    jamais dans un appel parallèle.
  - Pour attendre le verrou :
    `until ( set -o noclobber; echo … > .verrou-docker ) 2>/dev/null; do sleep 10; done`.
- **Un script Python nommé comme un module standard** (`types.py` dans le dossier de travail) est importé à sa place
  par `yaml`, `re`, `enum`… et s'exécute. Nommer les scripts sans risque de collision, et lancer `python -I`.
- **`kit-cible`, preuve sous Node 24 sans Dockerfile** : export
  `git -c core.autocrlf=false archive --format=tar HEAD`, puis un conteneur `node:24-slim` nommé dans le réseau de la
  pile (`docker create`, `docker cp`, `docker start`, `docker wait`, `docker logs`). `docker cp` vers un dossier absent
  échoue : copier le dossier entier.

- **`structuredClone` sous jest rend un `Date` d'un autre royaume** : `instanceof Date` le refuse. Un faux modèle
  Mongoose qui compare des dates doit tester `Object.prototype.toString.call(v) === '[object Date]'`, sinon un test de
  bail ou d'échéance passe pour une mauvaise raison (STORY-953).
- **La clé `centrale-test-2026` des vecteurs expire le 01/01/2027** : une preuve qui avance l'horloge au-delà (essai à
  J+60) doit certifier sa propre clé de test par `racine-test-2026` (`certifier`), sans la versionner (STORY-953).

- **DNS de la VM Docker en panne** (STORY-949, 16/11) : `lookup auth.docker.io: no such host`, alors que npm répondait.
  La ligne `# syntax=docker/dockerfile:1` fait télécharger le frontal à **chaque** construction. Pour une preuve,
  construire depuis l'export `git archive` avec cette ligne retirée (le dépôt n'est pas modifié), si les images de
  base sont locales.
- **`docker run --rm` long et client détaché** (« error waiting for container: unexpected EOF ») : le conteneur
  continue, mais `--rm` l'efface avant qu'on lise ses journaux. Pour une suite longue : `docker run -d --name …`, puis
  `docker wait` et `docker logs`.

- **Deux suites jest sous Node 24 en même temps saturent la VM Docker de ce poste** (8 Go ; catalogue et notification
  ensemble ≈ 6,5 Go). Le démon a répondu `EOF`, puis 500, et une construction d'image est tombée. Une suite à la fois.
  Lancer le conteneur **nommé, sans `--rm`**, puis `docker wait` et `docker logs` : un `--rm` perd le journal si le
  client se déconnecte, et un `npm test | tail` dans `sh -c` masque le code de retour (STORY-952).

- **La borne du jeton bloque les droits de la Reprise** (STORY-948) : `borne-du-jeton.spec.ts` exige que les deux
  catalogues tiennent dans un jeton (17 + 24 = 41 ≤ 44). Les six `reprise:*` le feraient passer à 47 : ils attendent
  STORY-949 (droits hors du jeton). Tout droit de tenant nouveau bute sur la même borne d'ici là.
- **`npm ci` sur le poste en Node 25** échoue sur les bindings natifs (`@confluentinc/kafka-javascript`, `bcrypt`).
  `npm ci --ignore-scripts` suffit pour `tsc`, le lint et les tests unitaires qui ne les chargent pas ; le reste se
  joue dans l'étage `verification` (Node 24).

- **`minio/minio` n'est plus servi** par Docker Hub (« pull access denied »), ni `quay.io/minio/minio` sans
  authentification (401) : une pile neuve du compose racine ne lève plus `minio` sur ce poste. Pour la preuve
  d'auth (STORY-942), une surcouche locale non versionnée a retiré la dépendance (`depends_on: !override`, pas
  `!reset`, qui vide tout). **Pour A** (`prospera-recette`) : choisir une image MinIO disponible avant la
  prochaine recette à froid.
- **Karapace 6.2 accepte qu'un champ facultatif existant devienne requis** (BACKWARD) : le registre ne garde pas ce
  cas, un test unitaire qui confronte un événement sans ce champ au schéma le fait (STORY-942).
- **auth-service, étage `verification`** : `sm-1.invariant.spec.ts` parcourt `test/` et lit `.env.example` ; le
  `.dockerignore` excluait `test/` (STORY-942).

- **Client de Confluent : `producer.connect()` vers un broker absent ne rejette pas vite.** L'attendre dans
  `onModuleInit` retient tout l'amorçage de Nest (107 s mesurées sur notification, Kafka arrêté). Ne jamais l'attendre
  à l'amorçage : `void this.ensureConnected().catch(…)` (STORY-950, corrigé dans notification, catalogue, paiement).
  **Même risque** chez tout service migré (C : sinistres, assurance, document-service).
- **Aucune image MinIO tirable sur le second poste** (`minio/minio` : « pull access denied » ; `quay.io` : 401). La
  pile de B y remplace MinIO par un bouche-trou ; une recette qui dépose un artefact de référentiel n'y tournera pas.
- **Supprimer un topic abonné efface les offsets du groupe** : après recréation, le client repart du début
  (`Offset out of range` ⇒ `BEGINNING`) et consomme, mais `kafka-consumer-groups` montre un offset commité vide. Pour
  chronométrer, lire la projection en base plutôt que l'offset (STORY-950).
- **L'étage `verification` révèle des gardes déjà rouges sur `dev`** (notification : l'inventaire AD-12 depuis
  MNV-607) : avant cet étage, la suite n'était jouée sur aucune image.

- **Client de Confluent, supervision** : ni `CRASH` ni `GROUP_JOIN`. Un message dont le traitement lève une erreur est
  RELIVRÉ, et le blocage se compte sur ses échecs consécutifs (STORY-937, paiement).
- **Paiement, invariants qui mordent à juste titre** : la garde ne lit aucune configuration (STORY-606) ; aucun
  identifiant ne contient « change » (STORY-284) ; seul le service des demandes écrit `$set: { etat }` (STORY-260).
- **Paiement, routes `@SurfacePlateforme()`** : elles rendent 404 à un client AVANT la garde des droits (STORY-728).
  Pour éprouver la garde du module, prendre une route sans surface plateforme (`GET /api/v1/creances`).
- **`.dockerignore` de paiement excluait `test/`** : l'étage `verification` en a besoin (`test/utils`).

- **BullMQ 6 refuse un identifiant de tâche qui contient `:`** (`Custom Id cannot contain :`) : la clef d'AD-6 en porte
  (et la date ISO aussi). Identifiant = clef avec `|` ; la clef d'origine reste dans les données (STORY-933).
- **BullMQ 6 n'a plus `queue.client` ni `ping`** : passer par l'API de la file (`getJobCounts`) pour une santé Redis.
- **Le `docker-compose.yml` racine n'est pas versionné** : une dépendance de service (ex. `depends_on: redis`) se pose
  dans `prospera-recette/docker-compose.recette.yml`. Pour démarrer l'image d'une branche dans la pile :
  `docker build --target runtime -t grp-b-platform-catalog-service .` depuis le worktree, puis `up --no-build`.
- **Un heredoc mange les antislashs d'un JSON** (`"^.+\\.(t|j)s$"`) : écrire les configurations par un script
  Python ou par l'outil d'écriture.

- **Le client de Confluent est un binding natif** (librdkafka) : ses tests se jouent sous Node 24, dans le stage
  `verification` du Dockerfile (`docker build --target verification`), pas sur le poste en Node 25.
- **Un consommateur abonné à un topic absent** ne le découvre qu'à la relecture des métadonnées (≈ 5 min), comme avec
  `kafkajs`. Sur une pile neuve, un premier message peut donc attendre quelques minutes ; il n'est pas perdu.
- **`.dockerignore` du catalogue exclut `test/`** : `test:schemas` se joue depuis le poste
  (`SCHEMA_REGISTRY_URL=http://127.0.0.1:8081 npx jest --config ./test/jest-schemas.json`), les scripts `schemas:*`
  depuis l'image (`--network grp-b_default -e SCHEMA_REGISTRY_URL=http://karapace:8081`).
- **`RECETTE_SURCOUCHES` sous Git Bash** : MSYS réécrit une liste de chemins séparés par `;` en liste POSIX à `:`,
  et la recette cherche une surcouche nommée `C`. Lancer la recette depuis PowerShell (STORY-940).
- **Une pile de recette publie des ports fixes** (3001 → 3010, 27017, 6379, 9000) : deux sessions ne peuvent pas
  avoir chacune la sienne en même temps. Regarder `docker ps` avant de lever (STORY-940, `grp-c-recette`).
- **Une signature base64url altérée sur ses DERNIERS caractères reste valide** : ils portent des bits de bourrage
  qu'un décodeur ignore. Un vecteur de signature altérée change un caractère du milieu (STORY-931).
- **Lint sur ce poste** : les fichiers suivis sortent en CRLF (`autocrlf`) ; ne linter que les fichiers touchés, avec
  `--rule '{"prettier/prettier":["error",{"endOfLine":"auto"}]}'`.
