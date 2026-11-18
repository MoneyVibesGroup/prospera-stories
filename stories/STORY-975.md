# STORY-975 : la comptabilité installable par le moteur

Status: done

**Complexité :** moyenne à grande (une identité de service dans un service dont la garde est globale, une vérification
C13, un plan d'effacement complet sur des collections en ajout seul, la recopie des manifestes du catalogue, une preuve
sur pile)

**Épic :** EPIC-111 (le socle de la comptabilité), EPIC-145 (le moteur : installation, C13)
**Dépôts :** `MoneyVibesGroup/prospera-comptabilite-service` ; `MoneyVibesGroup/platform-catalog-service` (la recopie
des manifestes et l'adresse de l'espace d'essai)
**Plage :** groupe B, n° 7 du lot 4 (`coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 975).
**Fini quand (plan) :** la vérification `referentiel-resolu` répond au contrat `verification-installation@1` ; routes
C13 de la comptabilité (import et effacement du jeu du cabinet, ou sans objet nommé) ; `POST /installations` de
`comptabilite` aboutit (D-972-2).
**Débloque :** STORY-1093 (la comptabilité branchée au hub et à la recette), STORY-1080 (le cabinet installé par le
moteur).

**Sources lues :** fiches STORY-972 (D-972-2, « Ce qui reste »), 958 (le socle : D-958-3, garde globale), 928 (les
routes C13 de balance et bilan : D-928-1 → 9, plan d'effacement gardé par un test qui lit les schémas réels), 929
(D-929-1 : pourquoi `POST /installations` échouait), 944 (le plan, `VerificationsParHttp`) ; contrat
`contrat/verification-installation.schema.json` du catalogue (`origin/dev`, STORY-944) ; `contrats/instance/` de
`prospera-plateforme` (étiquette `contrats-instance-v1`, `5a50249`) ; manifeste `manifestes/comptabilite.manifest.ts`
(0.1.0) ; code sur `origin/dev` : comptabilité `dd3dc52` (gardes, tenue, plan de journaux, piste, séries), catalogue
`a672a44` (exécuteur de plans, émetteur de l'état publié, `copies.json`, `.env.essai.example`), balance `98078b0` et
bilan `d236c56` (`instance-c13/`), auth `96f8ab3` (jeton de service limité à une organisation) ; jeu
`jeux-demonstration/cabinet-demo-togo/jeu.json` (aucune part `comptabilite`) ; journal de B (977, 1083 : la copie des
manifestes en retard ; 973 : `test:socle` à jouer ici).

---

## Pourquoi

Le manifeste `comptabilite` déclare une vérification (`referentiel-resolu`) et des routes d'instance que le service ne
sert pas (« à créer »). Le moteur ne diffère une vérification que pour le `PUT` de la console (STORY-945) : par
`POST /installations`, la vérification est appelée, et une route absente (404) bloque le plan `EN_ATTENTE` (FR-6,
D-929-1). La comptabilité ne s'installe donc que par le `PUT` (D-972-2). Dans un espace d'essai, un module installé
qui ne sert pas son effacement laisse le plan d'effacement `EN_COURS` (D-953-4) : elle ne peut pas non plus entrer dans
l'offre d'essai.

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|---|---|---|
| AC-1 | `POST /api/v1/instance/comptabilite/{organisationId}/verifications/referentiel-resolu` rend 200 au corps `verification-installation@1` (copie à l'octet du schéma du catalogue, validée par Ajv dans les tests), voyant `VERT` ou `ROUGE`, mesure chiffrée ; un code de vérification inconnu : 404 `VERIFICATION_INCONNUE` | unitaires ; socle ; pile |
| AC-2 | Ces routes n'admettent que l'identité de service `MOTEUR`, limitée à l'organisation du chemin : jeton d'utilisateur (même vérifié) 403 `IDENTITE_DE_SERVICE_REQUISE` ; autre identité 403 `IDENTITE_DE_SERVICE_REFUSEE` ; autre organisation 403 `ORGANISATION_HORS_JETON` ; jeton de service illisible 401 `JETON_DE_SERVICE_INVALIDE`. Un jeton de service sur toute autre route : 403 `IDENTITE_DE_SERVICE_REFUSEE` | unitaires ; socle ; pile |
| AC-3 | Import C13 (`import-c13-demande@1`) : servi **sans objet** (le jeu du cabinet n'a pas de part `comptabilite`) ; tout objet 422 `OBJET_INCONNU` (`objetsImportables: []`) ; espace d'essai seulement (403 `ESPACE_REEL_REFUSE` avant le corps) ; corps hors contrat 422 `SCHEMA_NON_CONFORME` | unitaires ; socle |
| AC-4 | Effacement C13 (`effacement-c13-demande@1` → `effacement-c13-accuse@1`) : espace d'essai seulement, motif `FIN_ESSAI` seul ; efface TOUT ce que le service tient de l'organisation, collections en ajout seul comprises ; une autre organisation intacte ; rejoué : `DEJA_EFFACE` avec la date du premier ; des données revenues : `EFFACE` | unitaires ; socle (vrai MongoDB) ; pile |
| AC-5 | Le plan d'effacement est gardé par un test qui lit les schémas réels : toute collection du service est effacée par le plan ou exclue avec sa raison | invariant |
| AC-6 | `POST /installations` de `comptabilite` aboutit sur une pile (plan `TERMINE`, vérification `VERT`, droit `ACTIVE`, état publié `EN_SERVICE`) ; rejouée, la vérification ne double rien | pile `grp-b` |
| AC-7 | Le catalogue : `manifestes:garde` verte (copie = source, dont `terrain`, `facturation`, `comptabilite`, et `financement` 0.2.0 neuf) ; `.env.essai.example` nomme `comptabilite` | garde ; spec ; pile |
| AC-8 | `test:socle` de la comptabilité joué sur la pile (dette de 973), Node 24 ; lint, build, mutations rouges sur une assertion ; `docker compose up` sain (module Nest neuf, dépendance neuve) | « Preuves » |

## Décisions (recommandations appliquées, contestables)

- **D-975-1 — Une identité de service dans la comptabilité, au patron de balance (D-928-1, STORY-948).**
  `JwtStrategy` lit les claims `identite` et `organisationId` d'un jeton de service d'`auth-service` : identité connue
  (`MOTEUR`, `REPRISE`, `CONNECTEURS`) et organisation de 24 hexadécimaux, sinon 401 `JETON_DE_SERVICE_INVALIDE`. Le
  porteur projeté garde `organisationId: null` (rien d'une route métier ne s'ouvre par lui) et porte l'organisation du
  service à part (`organisationDuService`). `EmailVerifiedGuard` décide de l'identité avant l'e-mail : une route
  marquée `@RouteDuMoteur()` exige `MOTEUR` et l'organisation du chemin ; toute autre route refuse un jeton de service.
- **D-975-2 — Les routes du moteur ne lisent pas l'état publié ; la garde reste globale.** `GardeComptabilite` et
  `GardeDesDroits` laissent passer une route marquée `@RouteDuMoteur()`, que seule l'identité `MOTEUR` franchit
  (D-975-1). Pourquoi : (1) le plan appelle la vérification aussitôt après `INSCRIRE`, alors que `EN_INSTALLATION` part
  par l'outbox du catalogue puis par Kafka : lire la projection, c'est perdre la course et arrêter le plan
  `EN_ATTENTE` ; (2) l'effacement doit passer quel que soit l'état publié, même jamais reçu (D-928-1) ; (3) la matrice
  ouvre déjà ces sortes au `MOTEUR` (`verification` en `EN_INSTALLATION`, `effacement` partout sauf `NON_INSTALLE`) :
  il ne reste que le délai de propagation et `NON_INSTALLE`. D-958-3 tient : aucune route n'est ouverte par un oubli
  (la marque n'ouvre qu'au moteur), et une route métier reste fermée au moteur.
- **D-975-3 — `referentiel-resolu` mesure ce que la comptabilité tient : le référentiel arrêté.** À l'ouverture au
  journal, le référentiel résolu (dossier-service) est arrêté avec le plan de journaux, dans la transaction de la
  tenue (D-961-2) : c'est celui de toutes les écritures de l'exercice. La vérification compte, parmi les exercices tenus
  au journal **non clôturés** (pas de sceau sur leur chaîne de piste), ceux dont le dossier n'a pas de plan arrêté
  (`REFERENTIEL_NON_DECIDE`) ou un référentiel que le service ne tient pas (`REFERENTIEL_INCONNU`) ; mesure = le nombre
  de **dossiers** concernés ; `VERT` à 0, `ROUGE` sinon, avec l'action à mener. Elle ne rappelle pas `dossier-service` :
  il n'admet aucune identité de service (D-928-3), et le jeton du moteur n'est pas celui d'un membre. Une installation
  neuve n'a aucun exercice : `VERT`, mesure 0. Toujours 200 (le voyant dit le résultat) ; servie dans les deux espaces
  (on installe dans les deux) ; l'en-tête `Idempotency-Key` est accepté, pas exigé : la mesure n'écrit rien.
- **D-975-4 — L'import est servi sans objet** (comme bilan, D-928-5) : le jeu `cabinet-demo-togo` n'a pas de part
  `comptabilite` (D-927-1). Après l'espace, le contrat, l'organisation et la source, tout objet reçoit 422
  `OBJET_INCONNU` (`objetsImportables: []`). Pas de registre d'import : aucun lot n'est jamais joué.
- **D-975-5 — L'effacement efface TOUT, par un plan nommé, gardé par un test qui lit les schémas réels.** Trois verrous
  (D-928-2) : espace d'essai (`KAFKA_ESPACE=ESSAI`, la variable d'espace du service ; sinon 403 `ESPACE_REEL_REFUSE`
  avant la lecture du corps), motif `FIN_ESSAI` (`FIN_CONTRAT` : 422 `MOTIF_NON_SERVI`), identité du moteur limitée à
  l'organisation. Le test est plus strict que celui de 928 : **chaque** collection déclarée par un schéma du service
  est dans le plan ou exclue avec sa raison, à champ d'organisation ou non. Les collections dont l'organisation est
  dans l'`_id` sont effacées par préfixe (`chaines_de_piste` : `piste:<org>:` ; `series_des_journaux` :
  `journal:<org>:` et `brouillard:<org>:`) ; l'outbox par sa clé (`cle` = l'organisation). La piste d'audit est
  effacée, pas pseudonymisée (D-928-8). Registre `instance_c13_effacements` (organisation, date, décompte, clef) : il
  survit pour rejouer l'accusé ; `EFFACE` / `DEJA_EFFACE` comme D-928-6.
- **D-975-6 — Le seul chemin qui passe outre l'ajout seul.** Les écritures validées, la piste, les tenues, les plans,
  les lettrages et les clôtures sont en ajout seul côté programme (`rendreAppendOnly`, `rendreValideesInalterables`) :
  l'effaceur passe par le pilote natif (`connection.collection(…).deleteMany`), qui ne joue pas ces gardes. C'est voulu
  pour une organisation d'essai (données fictives, AD-38) et seulement là : un invariant vérifie que `deleteMany` natif
  n'apparaît dans `src/` que dans l'effaceur.
- **D-975-7 — `ajv ^8.20.0` en dépendance directe** (déjà dans le lock, tirée en `peer`) : valider les corps contre les
  schémas copiés à l'octet, comme balance et bilan (928). Copies : `contrats/instance/` de `prospera-plateforme` à
  `contrats-instance-v1` (quatre schémas) et `contrat/verification-installation.schema.json` du catalogue ;
  `ORIGINE.json` garde les empreintes, un invariant rougit sur une copie retouchée.
- **D-975-8 — Le catalogue recopie tous les manifestes** (`npm run manifestes:copier`, source `prospera-stories` à
  `origin/main`) : `terrain` (droit de D-1060), `facturation` (D-1061), `comptabilite` (avertissement, routes de 969 et
  970) et **`financement` 0.2.0** (STORY-1083, 1084), qui n'y était pas : le 403 `FINANCEMENT_NOT_ENTITLED` de toutes ses
  routes venait de là. Sur une base neuve, chacun naît à sa version ; sur une base existante, une version amendée sans
  numéro neuf reste `divergente` (D-972-3). `.env.essai.example` nomme `comptabilite=http://comptabilite-service:3420`.
- **D-975-9 — Le manifeste ne change que dans ses commentaires** (« à créer » devient « servi ») : aucune valeur, donc
  aucune version neuve ; la copie du service se refait depuis le blob de `main` après la fusion de l'annonce.
- **D-975-10 — `export`, `sante` et `migrer` restent à créer** : hors de la ligne du plan ; rien ne les appelle encore
  pour ce module (« Ce qui reste »).

- **D-975-11 — Le jeton que le moteur présente est STATIQUE, limité à UNE organisation : à suivre par 1080.** Le
  catalogue envoie `INSTALLATION_JETON_SERVICE` tel quel (STORY-944), alors que le jeton de service d'auth est limité à
  une organisation (C2, STORY-948) et vit 300 s par défaut. Les routes du moteur (comptabilité, comme balance et bilan,
  D-928-1) refusent donc `ORGANISATION_HORS_JETON` pour toute autre organisation que celle du jeton : `POST
  /installations` n'aboutit que pour elle. La preuve l'a fait (jeton de l'organisation de démonstration, durée portée à
  3 600 s). **Suite, chez B (catalogue)** : le moteur demande à auth un jeton par organisation
  (`POST /api/v1/interne/jetons-de-service`, secret `MOTEUR_JETON_SERVICE`) avant chaque appel, gardé jusqu'à son
  terme ; nécessaire à STORY-1080 (`cabinet-moteur` par `POST /installations` dans la recette).

## Preuves

- **Node 24** (étages `verification` construits depuis `git -c core.autocrlf=false archive` des branches, conteneurs
  nommés) : comptabilité **56/56 suites, 815 passés** (3 sautés préexistants) ; catalogue **102/102 suites,
  1 568/1 568**.
- **`test:socle` de la comptabilité sur la pile `grp-b` (dette de 973) : 11/11 suites, 244/244**, dont
  `instance.socle-spec.ts` 12/12 : vérification VERT sans état publié reçu (D-975-2), VERT puis ROUGE mesure 1
  (exercice au journal sans plan arrêté), rejouée identique ; identité (401, 403 `IDENTITE_DE_SERVICE_REQUISE`,
  `ORGANISATION_HORS_JETON`, `IDENTITE_DE_SERVICE_REFUSEE` sur une route métier, 401 `JETON_DE_SERVICE_INVALIDE`) ;
  import 422 `OBJET_INCONNU` ; **effacement de 29 documents dans 16 collections** (tenue, plan, séries, piste, tête de
  chaîne et tiers écrits par les vraies routes, en ajout seul ; écritures dont une à organisation en chaîne, lettrage,
  clôture, balance publiée, outbox, état publié) : plus rien de l'organisation, l'autre organisation intacte ; rejeu
  `DEJA_EFFACE` à la date du premier. Premier passage complet : `cloture` rouge une fois sur sa course D-970-10 (une
  clôture au milieu de dix lettrages, 409) pendant une construction d'image ; seule puis au second passage complet :
  verte (piège ci-dessous).
- **Node 25** (poste) : comptabilité 794 passés, 4 suites rouges connues (binding de Confluent, copies comparées aux
  checkouts) ; catalogue 1 549 passés, 3 suites rouges connues (binding). `tsc`, lint des fichiers touchés (`endOfLine
  auto`), `manifestes:garde` **verte, 48 manifestes** (rouge avant : `terrain`, `facturation`, `comptabilite`,
  `financement`). `git diff --stat` = `--ignore-cr-at-eol` dans les trois dépôts ; aucun fichier non suivi.
- **Mutations, comptabilité : 20/20 rouges sur une assertion** (identité : organisation du chemin, autre identité,
  jeton de service sur une route métier, revérification par les deux gardes, organisation du service projetée,
  organisation malformée ; mesure : exercices scellés, sans plan, référentiel non tenu, par exercice au lieu de dossier,
  appariement par exercice seul ; code hérité d'`Object` ; import en espace réel ; `DEJA_EFFACE` sur des données
  revenues ; heure du conteneur ; tiers oubliés par le plan ; organisation sous sa seule forme ObjectId ; séries des
  brouillards oubliées ; tout espace pris pour un essai). Trois ne compilaient pas d'abord (import devenu inutile,
  TS6133) : réécrites, rouges.
- **Pile `grp-b`** (compose racine + surcouche locale non versionnée : auth d'`origin/dev` `96f8ab3`, catalogue et
  comptabilité des branches ; MongoDB en jeu de répliques, Kafka, Redis, MinIO Chainguard, mailhog) : les trois
  `healthy` ; la comptabilité démarre avec `InstanceModule` (trois routes mappées), image `runtime` avec `ajv` (`npm ci
  --omit=dev` vert) ; semis du catalogue « créés 29, rattachés 19, refusés 0 » (48, `financement` ACTIVE).
  - **Réel, 17/17** : référentiel `syscohada-revise@2.3` au registre, offre `comptabilite` ; **`POST /installations` :
    201, plan `TERMINE` en 1,1 s** — `INSCRIRE`, `VERIFIER referentiel-resolu` **VERT, mesure 0, non différée**,
    `OUVRIR` ; droit `ACTIVE`, source `moteur:<plan>` ; la comptabilité projette `EN_SERVICE` (fait émis par le
    catalogue). Rejouée avec la même clef : 200, le même plan (une autre clef : 409 `MODULE_DEJA_INSTALLE`). La
    vérification appelée deux fois par le moteur : même corps, aucun document écrit ; utilisateur 403
    `IDENTITE_DE_SERVICE_REQUISE`, sans jeton 401, autre organisation 403, route métier 403
    `IDENTITE_DE_SERVICE_REFUSEE` ; import et effacement 403 `ESPACE_REEL_REFUSE`.
  - **Essai, 6/6** (comptabilité relancée `KAFKA_ESPACE=ESSAI`) : import 422 `OBJET_INCONNU` (`objetsImportables: []`) ;
    `FIN_CONTRAT` 422 ; effacement **`EFFACE`**, `effaceLe` = `demandeLe`, plus aucun document de l'organisation ; rejeu
    **`DEJA_EFFACE`**, même date et même décompte ; la vérification répond aussi.
- Après la fusion : **arbres identiques** aux branches éprouvées (`ddc9fa5^{tree}` = `030393c^{tree}`,
  `a5a2676^{tree}` = `0d76007^{tree}`).
- **Verrou Docker** : D le tenait (STORY-1063, 22:10) ; code, tests et mutations faits pendant l'attente (un seul
  moniteur borné, ré-armé) ; pris à 22:55 (atomique), pile descendue avec ses volumes, images de la preuve retirées,
  **rendu à 23:27** ; aucune boucle d'attente ne tourne après la remise.

## Livraison

🏁 **DONE (2026-11-18)** — `prospera-comptabilite-service` #12 (`dev` `dc6809d`, `ddc9fa5`) ;
`platform-catalog-service` #62 (`dev` `a5a2676`) ; annonce avant le code : stories #713 (`5eb9d9a`).

## Ce qui reste

- Les routes `export`, `sante` et `migrer` de la comptabilité (D-975-10).
- La vérification rappellera le référentiel de `dossier-service` quand celui-ci admettra le moteur (STORY-1082 le fait
  pour la création du dossier de démonstration).
- La comptabilité dans la recette, dans `INGESTION_SOURCE_SYSTEMS` et dans l'`AUTH_AUDIENCE` de l'IdP : STORY-1093.
- Le jeton du moteur par organisation dans le catalogue (D-975-11) : avant STORY-1080.
