# STORY-1080 : le cabinet installé par le moteur (clôture du lot 4 de B)

Status: done

**Complexité :** grande (six vérifications d'installation dans deux services, la recette `cabinet-moteur` réécrite
autour de `POST /installations`, le catalogue de la recette armé pour le moteur, la recette croisée complète)

**Épic :** EPIC-145 (le moteur : installation, C13), EPIC-159 (le cabinet installé par le moteur, volet d)
**Dépôts :** `MoneyVibesGroup/prospera-balance-service`, `MoneyVibesGroup/prospera-bilan-service`,
`MoneyVibesGroup/prospera-recette` ; **amendé le 24/11 (lot 6, reprise)** : `prospera-platform-catalog-service` et
`prospera-admin-panel-service` (le BFF), pour débloquer AP-55 (D-1080-14 → 17).
**Lot 6 :** ligne n° 1 de B au §5 de `PLAN-LOT-6-2026-11-23.md` (« Fini quand : contrat déjà annoncé (19/11) ;
recette croisée verte sur pile neuve ; AP-55 débloquée »). balance #159 et bilan #182 sont fusionnés depuis le 19/11 ;
la recette restait sur une branche locale non poussée (reprise le 24/11).
**Plage :** reçue de A (lot 4, D-L4-1), ligne n° 10 et dernière du §3 du plan du lot 4.
**Fini quand (plan) :** balance et bilan servent leurs six routes `…/verifications/…` (contrat
`verification-installation@1`, comme la comptabilité à 975) ; `cabinet-moteur` installe par `POST /installations` (le
test D-929-1 s'inverse), plus par le `PUT` de la console ; `INSTALLATION_SERVICES` au catalogue de la recette ; recette
croisée complète verte sur pile neuve, **jouée une fois**.
**Ticket fermé à la livraison :** `tickets/TICKET-BACKEND-verifications-de-balance-et-de-bilan-non-servies.md`.

**Sources lues :** plan du lot 4 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B en entier (état, pièges,
⚠ Contrats, « Suivante » de 978) ; journaux de A, C, D (aucune demande neuve à B) ; fiches STORY-928, 929 (D-929-1/2/3 ;
pièges : `COMPOSE_PARALLEL_LIMIT=2`, mémoire du poste, `ECONNRESET` ⇒ `docker desktop restart`, `RECETTE_ESPACE`), 975
(`referentiel-resolu` de la comptabilité, D-975-2), 978 (jeton du moteur par organisation, « Pour STORY-1080 »), 1081,
1082, 1093 ; le ticket ; manifestes `balance`, `bilan` (les six vérifications), `conseil`, `financement`. Code relu sur
`origin/dev` : balance `695b6c7`, bilan `d236c56`, catalogue `f9e9e26` (`VerificationsParHttp`,
`PassageParLeMoteur`, DTO de `POST /installations`), comptabilité `ddc9fa5` (le patron des vérifications), recette
`a1d68d7`.

**Ce qui existait déjà (relu avant la fiche) :** balance et bilan servent l'import et l'effacement C13 (928) sous
l'identité `MOTEUR` (`@AdmetIdentitesDeService('MOTEUR')`, `exigerLeMoteur`) ; **aucune** route `…/verifications/…`
(`git grep verifications` vide), aucune copie de `verification-installation.schema.json`. Le catalogue demande déjà un
jeton par organisation (978) et ne diffère une vérification sans adresse que pour le `PUT` de la console (945) ; le `PUT`
d'un module DÉJÀ installé (levée de sanction) ne rejoue aucune vérification. Le catalogue de la recette n'a ni
`NAISSANCE_AUTH_URL`, ni `MOTEUR_JETON_SERVICE`, ni `INSTALLATION_SERVICES`.

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | balance sert `POST /api/v1/instance/balance/{organisationId}/verifications/{code}` pour `referentiel-resolu`, `paquet-fiscal-disponible`, `balances-equilibrees` ; bilan sert `…/instance/bilan/…` pour `referentiel-resolu`, `snapshots-intacts`, `consommateurs-actifs` : 200 au corps `verification-installation@1` (copie à l'octet du schéma du catalogue, validée par Ajv avant de répondre), mesure chiffrée, `VERT` à 0 | unitaires ; e2e ; pile |
| AC-2 | Identité `MOTEUR` seule, limitée à l'organisation du chemin (401 sans jeton ; 403 `IDENTITE_DE_SERVICE_REQUISE`, `ORGANISATION_HORS_JETON`, `IDENTITE_DE_SERVICE_REFUSEE`) ; un code non déclaré 404 `VERIFICATION_INCONNUE` ; servies dans les deux espaces ; `Idempotency-Key` acceptée, jamais exigée ; rien d'écrit | e2e ; pile |
| AC-3 | Chaque mesure suit le critère de son manifeste (décisions D-1080-2 → 7) ; une panne transitoire n'est jamais un voyant (la vérification remonte : NON EXÉCUTÉE) | unitaires ; mutations |
| AC-4 | Le catalogue de la recette reçoit `NAISSANCE_AUTH_URL`, `MOTEUR_JETON_SERVICE` (même valeur qu'auth) et `INSTALLATION_SERVICES` (balance, bilan, comptabilite), jamais `INSTALLATION_JETON_SERVICE` ; la garde du profil le vérifie | garde ; mutation |
| AC-5 | `cabinet-moteur` installe balance et bilan par `POST /installations` (six vérifications `VERT`, plan `TERMINE`, droit `moteur:<plan>`) ; le test D-929-1 s'inverse ; les six mesures restent `VERT` sur un cabinet qui tient des données (balance validée, jeu d'états validé) ; `conseil` (sans adresse) n'est toujours pas ouvert (FR-6) | recette |
| AC-6 | Points ouverts soldés : 978 (deux organisations installées par `POST /installations` sans jeton posé à la main ; démarrage réel du catalogue avec `JetonsDuMoteur`) ; 974 (démarrage réel du module d'invitation d'auth et du fournisseur du catalogue) ; 1081 (parcours 923 joué par un collaborateur : son portefeuille, 404 hors portefeuille) ; 1082 (le dossier de démonstration créé par le moteur dans la recette d'essai) | recette |
| AC-7 | Recette croisée complète verte sur pile neuve, jouée une fois ; tests relancés par chemin, lint, `tsc`, build, mutations rouges sur une assertion | « Preuves » |
| AC-8 | **AP-55 débloquée (24/11)** : la console lit où en est une organisation qu'elle installe — le catalogue sert `GET /api/v1/console/etat-publie/{organisationId}` (`org:read`, le calcul du contrat sans `utilisateur`), le BFF le relaie en `GET /api/v1/admin/orgs/{orgId}/etat-publie` (projection typée, `org:read`) ; la recette installe une organisation par les relais du BFF (offre, installations, plan) et y lit `EN_SERVICE`, `SUSPENDU`, `NON_INSTALLE` | unitaires ; e2e ; OpenAPI ; recette |

## Décisions (recommandations appliquées, contestables)

- **D-1080-1 — Une vérification MESURE ce que le service tient, sans lire l'habilitation.** Pendant le plan, l'étape
  `VERIFIER` passe AVANT `OUVRIR` : le droit du module n'est pas encore `ACTIVE`, et ses référentiels non plus. Les
  résolveurs du service (balance : `lireHabilitation` ; bilan : `resolveReferentielForOrg`) sont fail-closed sur le
  droit : les appeler rendrait tout dossier 🔴 à la première installation. Les vérifications reprennent donc les
  marches du résolveur SAUF l'habilitation (que l'installation pose elle-même), comme la comptabilité (D-975-3).
- **D-1080-2 — balance, `referentiel-resolu`** : pour chaque dossier non archivé, le système comptable par la cascade
  unique du service (`systemeComptableEffectif` : décision datée d'axes à l'heure de référence, type d'entité, profil
  du cabinet), puis l'artefact du pont **chargé** (sha256 vérifié). Compté 🔴 : un système que le service ne sait pas
  valider, un artefact absent, altéré ou illisible, ou un dossier sans système décidé qui porte déjà une balance non
  rejetée. **Non compté** : un dossier neuf sans système décidé ni balance (le dépôt y est refusé tant que la décision
  manque, 409 `SYSTEME_COMPTABLE_INDETERMINE`) ; il est dit dans `detail`. Sinon toute installation d'un cabinet dont
  les dossiers attendent leurs axes serait bloquée. L'invariant de portée de STORY-694 (`portee-cabinet.invariant`)
  reçoit le fichier dans sa liste justifiée (il lit le profil du cabinet pour la cascade ; seul un décompte sort).
- **D-1080-3 — balance, `paquet-fiscal-disponible`** : chaque exercice OUVERT d'un dossier non archivé passe par **le
  point unique** du service (`ReferentielService.chargerPaquetFiscal` : pays du dossier, troisième axe, année de
  clôture, sha256). Réel et synthétique lisent le même paquet : tous les dossiers sont concernés. Mesure = dossiers ;
  🟠 jamais 🔴 (critère du manifeste) ; le `detail` nomme les paires pays × année. Le moteur ne tient que `VERT` pour
  une réussite (FR-6) : un exercice ouvert sur une année sans paquet (2025, 2027 au Togo) bloque donc l'installation de
  `balance` — c'est le critère, assumé.
- **D-1080-4 — balance, `balances-equilibrees`** : chaque balance `VALIDÉE`, lue brute (les formes `v1` héritées
  comprises), recalculée : (1) `computeSommaire` des lignes, mouvements ET soldes, à **la tolérance de la devise de la
  balance** (celle de la validation : 100 unités mineures à l'échelle 2 ; 1 pour une devise sans décimale, plus strict
  que le « 100 » du manifeste, contestable) ; (2) les totaux recalculés = les totaux rangés ; (3) le checksum recalculé
  **sous la version qui l'a scellé** (`checksumVersion ?? 'v1'`) = le checksum rangé. Mesure = balances en écart, avec
  leur cause dans `detail`.
- **D-1080-5 — bilan, `referentiel-resolu`** : le référentiel de bilan est celui qui calcule les jeux d'états (capturé
  sur chaque jeu). Pour chaque dossier non archivé qui porte au moins un jeu : chaque référentiel capturé se charge
  (paquet au manifeste, sha256 vérifié), est le **même paquet** que celui du calcul (`meta.checksum` = `checksum` du
  jeu), et est de la **famille** du dossier (STORY-729 ; « Mon cabinet » non jugé sur son `typeEntite`). Un dossier
  sans jeu n'est pas compté (dit dans `detail`).
- **D-1080-6 — bilan, `snapshots-intacts`** : chaque version figée (`snapshots_liasse`) qui porte une empreinte est
  recalculée par `empreinteSnapshot` (la fonction de la lecture d'une version, STORY-452), documents hydratés comme
  elle. Mesure = **jeux d'états** dont une version ne se recalcule plus. Une version sans empreinte (avant 452) n'est
  pas jugée (règle du service), elle est comptée dans `detail`.
- **D-1080-7 — bilan, `consommateurs-actifs`** : `EtatConsommateursService` (le registre que `/health` lit) : groupes
  hors de leur groupe ou bloqués, nommés. La mesure porte sur le service, pas sur l'organisation.
- **D-1080-8 — Forme commune** : une route par module, `POST …/verifications/:code`, `exigerLeMoteur` dans le
  contrôleur C13 existant ; les trois codes du manifeste et eux seuls (404 `VERIFICATION_INCONNUE`, nouveau code
  de refus, avec `details.verificationsServies`) ; servies dans les deux espaces ; aucune écriture ; la réponse est
  relue contre le schéma avant de partir (un corps hors contrat est une erreur 500, jamais un voyant). Schéma copié à
  l'octet du catalogue (`c3c63c8`), à côté des quatre contrats C13 (`ORIGINE.json`, `autresOrigines`).
- **D-1080-9 — La recette : `INSTALLATION_SERVICES` = balance, bilan, comptabilite, et eux seuls.** Ce sont les
  modules dont le service tourne dans la pile ET sert ses vérifications. `conseil` (dans balance-service),
  `declarations`, `consolidation`… n'y sont pas : leurs vérifications ne sont pas servies, le `PUT` de la console
  continue de les différer, `POST /installations` refuse de les ouvrir (test FR-6 gardé, sur `conseil`).
  **Conséquence pour toutes les recettes** : le `PUT` d'un de ces trois modules joue désormais les vraies
  vérifications (jeton du moteur demandé à auth).
- **D-1080-10 — Le `PUT` de la console reste dans `cabinet-moteur` pour la SANCTION et sa levée seulement** (chemin
  5 : `SUSPENDED`, puis `ACTIVE` d'un module installé, sans nouveau plan). L'installation passe par
  `POST /installations`.
- **D-1080-11 — 974 : la mise en service avec `invites` n'entre pas dans la recette.** Elle suppose un espace d'essai
  ET un espace réel à la fois (la console transmet les utilisateurs de l'essai au réel) ; la pile de recette est d'un
  seul espace (D-929-2). Le démarrage réel du module d'invitation d'auth et du fournisseur du catalogue est prouvé par
  la pile (services `healthy`, routes mappées) ; le parcours reste à jouer par une recette à deux espaces.
- **D-1080-12 — Les images de la preuve** : services construits depuis `git -c core.autocrlf=false archive origin/dev`
  **après la fusion** des PR de balance et de bilan (on recette ce qui est livré) ; la recette (tests, profil) jouée
  depuis la branche `MNV-1080`, fusionnée après la recette verte. Espace d'essai (`RECETTE_ESPACE=ESSAI`, comme 929) :
  les tests C13 et 1082 ne tournent que là.
- **D-1080-13 — Aucune dépendance, aucun Dockerfile ne change** ; deux modules Nest importent des modules existants
  (balance : `ReadModelsModule`, `IdentiteDossierModule`, `ReferentielModule` ; bilan : `BilanModule`) : le démarrage
  réel est prouvé par la pile.

- **D-1080-14 — (24/11) La console lit l'état publié par une route de plus du catalogue, pas par celle du contrat.**
  AP-55 (AC-4) dit en une ligne où en est l'organisation ; A a demandé le relais de `GET /etat-publie/{org}` (journal de
  A, 24/11). Or cette route est réservée à un MEMBRE de l'organisation ou à une identité de service limitée à elle
  (`ORGANISATION_HORS_JETON`, contrat figé `contrat-etat-publie-v1`) : l'opérateur de Money Vibes n'est membre d'aucune
  organisation qu'il installe. Plutôt que d'élargir le contrat figé, le catalogue sert
  **`GET /api/v1/console/etat-publie/{organisationId}`**, de la surface plateforme comme l'offre et les plans
  (`org:read`, le droit de `GET /offres/{org}`), qui rend **le même calcul** (`LectureEtatPublie`, une seule règle) :
  la réponse du contrat **sans le bloc `utilisateur`** (l'opérateur n'a aucun droit dans l'instance du client) et sans
  les `droits` des modules (FR-35) ; aucune double lecture (elle compare les droits d'un membre). Mêmes refus :
  404 `ORGANISATION_INCONNUE`, 503 `HORLOGE_INDISPONIBLE`, 400 `ORGANISATION_ID_INVALIDE`.
- **D-1080-15 — (24/11) Le BFF relaie `GET /api/v1/admin/orgs/{orgId}/etat-publie`** (`org:read`, à côté des relais de
  l'offre et des plans), **projeté champ par champ** (anti-fuite, STORY-378) : `EtatPublieOrganisationDto`
  (`schemaEtatPublie`, `versionMatrice`, `organisationId`, `espace`, `heureDeReference { instantUtc, statut }`,
  `modules[] { code, libelle, etat, finLe?, effacementLe?, versionCode?, acquis? }`), publié à l'OpenAPI (A génère ses
  types). Un état inconnu du BFF se lit `NON_INSTALLE` (règle du contrat pour tout consommateur : il ferme). 404
  `ORGANISATION_INCONNUE` garde son code (la console propose d'installer) ; les autres refus passent par la traduction
  générique ; un corps hors contrat ou d'une autre organisation que l'URL rend 503. Au passage, l'OpenAPI de
  `POST /admin/orgs/{orgId}/installations` publie la forme de `referentiels` (une liste `{ code, version }` par module) :
  sans elle, le générateur de la console le typait `Record<string, never>` (l'invariant de STORY-181 le voit dès que le
  contrôleur entre au document).
- **D-1080-16 — (24/11) La preuve du déblocage est la recette** : dans `cabinet-moteur`, la seconde organisation
  s'installe **par les relais du BFF** (offre, `POST …/installations`, lecture du plan), et la console lit l'état publié
  du cabinet (`EN_SERVICE`, puis `SUSPENDU` sous sanction, `EN_SERVICE` à la levée) et de la seconde organisation
  (`balance` `EN_SERVICE`, `bilan` `NON_INSTALLE`) ; la route du contrat refuse toujours l'opérateur (403
  `ORGANISATION_HORS_JETON`) et sert le même état au cabinet lui-même.
- **D-1080-17 — (24/11) Fait dans 1080, pas dans une story neuve** : « AP-55 débloquée » est le « Fini quand » de la
  ligne du plan, la demande de A passe avant la story, et le catalogue comme le BFF sont des dépôts de B. Leur démarrage
  réel (un contrôleur de plus dans `EtatPublieModule` ; aucun module Nest, aucune dépendance, aucun Dockerfile neufs)
  est prouvé par la recette croisée, images reconstruites depuis `origin/dev` après la fusion.

## Preuves

- **balance (#159, `dev` `4edb4c8`) et bilan (#182, `dev` `0f17ec4`)**, fusionnés le 19/11 : Node 25, vérifications
  27/27 (balance) et 17/17 (bilan), e2e `instance-c13` 24/24 chacun, suites complètes à leurs rouges préexistantes
  (14 et 15 suites : binding de Confluent, chemins Windows) ; mutations 15/15 et 10/10.
- **catalogue (#67, `dev` `fddfa7d`)** : Node 25, `src/etat-publie` 34/34 (5 neufs : la réponse de la console validée
  par Ajv contre le contrat sans `utilisateur`, mot pour mot la lecture d'un administrateur sans `droits` ; aucune
  double lecture ; 404 ; 503 ; `org:read` sans identité de service), e2e de la chaîne de gardes 5/5 (opérateur
  `org:read` 200 ; sans `org:read`, membre de l'organisation elle-même : 403 ; 401 ; 400) ; suite complète 1 597 passés
  (3 suites rouges connues, binding de Confluent) ; e2e : 5 suites rouges **à l'identique sur `origin/dev`** (172
  échecs avant comme après : fournisseurs absents de leurs modules de test, `RedisHealthIndicator`,
  `PublicationDesManifestes`) ; `tsc`, lint ; **mutations 6/6** rouges sur une assertion.
- **BFF (#38, `dev` `7c85076`)** : Node 25, `etat-publie.spec` 15/15, OpenAPI 18/18 (2 neufs), unitaires 548/548 (44
  suites), e2e 238/238 (13 suites) ; `tsc`, lint ; **mutations 6/6**.
- **recette (#27, `dev` `a6da2ea`)** : `npm test` 10 suites, 98/98 ; `npm run verifier` vert ; **mutations de la
  garde du profil 4/4** (bilan retiré d'`INSTALLATION_SERVICES`, secret du moteur différent d'auth, jeton statique
  reposé, naissance sans adresse).
- **Recette croisée complète, jouée une fois sur pile neuve : 11/11 suites, 142/142 tests, 1 160 s**
  (`renvoi-du-lien`, `facturation`, `atelier-balance`, `distributeur`, `delegation`, `abonnement`, `zone-franche`, `cabinet-moteur`, `referentiel-par-dossier`, `pile`, `comptabilite`). `COMPOSE_PROJECT_NAME=grp-b`, `RECETTE_ESPACE=ESSAI`, volumes neufs, `COMPOSE_PARALLEL_LIMIT=2`,
  images des treize services construites depuis `git -c core.autocrlf=false archive origin/dev` **après la fusion** de
  #67 et #38 (auth `96f8ab3`, kyc `d4932c6`, catalogue `fddfa7d`, notification `e0a50c0`, paiement `4684d22`,
  dossier `2bf9dbd`, document `da4ddf2`, balance `0ff2402` (1080 et 1099 de C), bilan `0f17ec4`, BFF `7c85076`,
  fiscal `4ee8ed7`, comptabilité `6e4132b`, plateforme `50c12a6` pour le jeu), fiscal en surcouche, surcouche de
  contextes hors dépôt. `cabinet-moteur` **11/11** :
  - `POST /installations` de `balance` + `bilan` : **six vérifications `FAITE` / `VERT` / mesure 0**, plan `TERMINE`,
    droits `moteur:<plan>`, modules ouverts par l'état publié ; **aucun jeton posé à la main** (le catalogue l'a demandé
    à auth, STORY-978 : démarrage réel de `JetonsDuMoteur` prouvé) ;
  - sur le cabinet qui tient une balance validée et un jeu d'états validé, les six mesures rejouées par le jeton du
    moteur : `VERT`, `detail` lu (« 1 balance validée recalculée : 0 écart. », « 1 version figée recalculée (0 sans
    empreinte, non jugée) : 0 jeu d'états altéré. », « 1 exercice ouvert examiné : 0 dossier sans paquet fiscal
    publié. »…) ; jeton d'utilisateur 403 `IDENTITE_DE_SERVICE_REQUISE`, code non déclaré 404 `VERIFICATION_INCONNUE` ;
  - **AP-55** : la console lit l'état publié par le BFF (`balance`/`bilan` `EN_SERVICE`, `SUSPENDU` sous sanction,
    `EN_SERVICE` à la levée) ; la route du contrat refuse l'opérateur (403 `ORGANISATION_HORS_JETON`) et sert le même
    état au cabinet ; une **seconde organisation installée par les relais du BFF** (offre, `POST …/installations`, plan
    lu) : `balance` `EN_SERVICE`, `bilan` `NON_INSTALLE` — deux organisations, deux jetons du moteur ;
  - FR-6 : `conseil` (sans adresse) n'est pas ouvert (`EN_ATTENTE`, `NON_EXECUTEE` `SERVICE_NON_CONFIGURE`) ;
  - 924 + 923 contre le vrai `dossier-service`, **1081** (le collaborateur modifie un dossier de son portefeuille par le
    BFF, 404 hors portefeuille), **1082** (C13 : le dossier de démonstration naît dans `dossier-service`, créé par le
    moteur, visible au portefeuille du cabinet), effacement `EFFACE` puis `DEJA_EFFACE`.
  - Points ouverts soldés : 974 (module d'invitation d'auth et fournisseur du catalogue démarrés : services `healthy`),
    978, 1081, 1082 ; **1083/1084** déjà soldés à 1082.
- **Essais avant la recette finale : 4.** (1) `cabinet-moteur` seul, pile neuve : 10/11, une assertion fausse de ma
  recette (le portefeuille de `dossier-service` range ses lignes dans `lignes`, pas `items`) ; (2) la même : 11/11 en
  200 s ; (3) **recette complète sur pile neuve : 9/11 suites, 134/142** — `delegation` rouge (3) : depuis STORY-960
  (auth `cf8e001`, 17/11, après la dernière recette complète de 929), `DIST_ADMIN` ne lit plus le journal du paiement
  ni ne rédige de modèle (403 `PERMISSION_DENIED`, voulu par l'annexe B), plus un 429 du plafond par adresse de la
  notification ; `comptabilite` rouge en `ECONNRESET` sur Mailhog (`localhost`, fin de recette : le symptôme mémoire de
  929). Recette corrigée (`delegation` : un membre du client au rôle de lecture composé, attente du 429) ; (4)
  `delegation` + `comptabilite` sur la même pile : 20/20. Puis `down -v`, volumes retirés, `docker desktop restart`, et
  la pile neuve de la recette finale.
- **Verrou Docker** : pris à 02:00 (atomique, libre ; D ne le tenait pas), rendu à 03:26 après `down -v`
  (aucun conteneur, volume ni réseau `grp-b` ne reste).

## Livraison

🏁 **DONE (2026-11-24)** — balance **#159** (`dev` `4edb4c8`, 19/11), bilan **#182** (`dev` `0f17ec4`, 19/11),
catalogue **#67** (`dev` `fddfa7d`), BFF **#38** (`dev` `7c85076`), recette **#27** (`dev` `a6da2ea`) ; contrats
annoncés avant la fusion (stories #728 le 19/11, #764 le 24/11), sans écart. Ticket
`verifications-de-balance-et-de-bilan-non-servies` fermé. **AP-55 débloquée** (journal de B, « → A »).

## Ce qui reste

- Les vérifications de `conseil` (`aucun-scenario-applique`, `gate-conseil`, balance-service), de `consolidation` et de
  `declarations` (fiscal, à A) ne sont pas servies : nommées par le ticket, hors de cette ligne du plan.
- La mise en service avec `invites` jouée par une recette à deux espaces (D-1080-11).
- La recette ne passe pas encore par `POST …/reprendre` du BFF (aucun plan inachevé reprenable dans ce parcours) :
  relayé depuis STORY-917, éprouvé par ses tests ; AP-55 l'éprouvera dans son gate réel.
