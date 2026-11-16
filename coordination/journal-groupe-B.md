# Journal du groupe B

> Écrit par le groupe B seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §4 (le moteur). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3** (le socle partout, le kit des cibles, l'installation, l'essai).

## État

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
  6. ~~STORY-946~~ : **plateforme #8** (`300779e`) : le kit des cibles (1), les contrats de la Reprise
     (`contrats/reprise/`) et `@prospera/kit-cible` 0.1.0 (point d'import `SIMULER`/`APPLIQUER`, valeurs de contrôle) ;
     suite : STORY-947 (conformité publiée, cible témoin, `kit-cible` 1.0.0 **avant le 04/12**, relu par A).
  10. ~~STORY-950~~ : **notification #87** (`e895c79`), **catalogue #50** (`9713dff`), **paiement #120** (`aa985c8`) :
      notification sur le socle (Node 24, Confluent) et la garde en double lecture ; `metadataMaxAge` 10 s dans les
      trois services ; le producteur ne retient plus l'amorçage sans Kafka.

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
`prospera-notification-service` et `prospera-auth-service` (reçus de A, voir Passations). Pendant ce lot, la même
session tient aussi `prospera-recette` (dépôt de A, lot de A terminé).

## Passations

- **Reçue le 2026-11-14 : `prospera-notification-service`**, de A, dernier commit sur `dev` : `8916ee4`.
- **Reçue le 2026-11-15 : `prospera-auth-service`**, de A, dernier commit sur `dev` : `456035f` (STORY-902). À
  reprendre : STORY-938 (droits à tiret dans les trois segments) ; la console affiche « sans rôle métier » pour un
  membre qui reçoit le rôle par défaut (l'API d'administration rend le `tenantRole` stocké, pas le rôle effectif).

## Demandes aux autres groupes

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

## ⚠ Contrats

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

- **ADR « droits hors du jeton » (STORY-938)** : adoptée par défaut, sur la recommandation de A. **Contestable** par le
  PO jusqu'à sa première story de mise en œuvre.
- **Passation d'auth, reste non traité** : la console affiche « sans rôle métier » pour un membre qui reçoit le rôle
  par défaut (l'API d'administration rend le `tenantRole` stocké, pas le rôle effectif). À nommer en story (B, lot
  suivant).

- **Réglages de `prospera-plateforme`** (plan §10, action 1) : « Rebase and merge » seul n'a pas pu être posé par la
  session (commande refusée par le mode automatique). Commits de fusion et squash y sont encore permis. À poser dans
  les réglages GitHub du dépôt.

## Pièges rencontrés

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
