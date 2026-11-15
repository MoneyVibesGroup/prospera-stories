# STORY-980 : Le squelette de `prospera-sinistres-service`

Status: done

**Complexité :** moyenne (un service neuf : socle, deux modules vides, gate, profil, câblage)

**Épic :** EPIC-201 (le socle technique : services, migrations et protection des données)
**Dépôt :** `MoneyVibesGroup/prospera-sinistres-service` (neuf, privé, créé par l'utilisateur, vide au 2026-11-15)
**Plage :** groupe C, n° 1 du lot de C (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

Le circuit du dossier sinistre (déclarer → archiver) vit dans un service neuf, `prospera-sinistres-service`, qui porte
deux modules : `sinistres` (M05) et `expertises` (M29) (spine assurance, AD-3). Toutes les stories suivantes du
lot qui touchent ce dépôt (988 machine à états, 989 versions et échéances) se posent dessus. Le squelette doit donc
naître **sur la pile du moteur** (pas de migration à refaire), **cloisonné par module** (chaque module s'installe et
dort seul) et **gardé dès le premier commit** (un câblage faux ne se voit qu'au démarrage).

## Ce qui doit être vrai à la fin (plan §5, n° 1)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | Le dépôt a `main` (premier commit : README) et `dev` partie de `main` ; le code arrive sur `dev` par une PR « Rebase and merge » | `gh api` des branches ; PR fusionnée |
| AC-2 | **Pile du moteur dès le premier commit** : Node 24 (`node:24-slim`, `engines.node: 24.x`), NestJS 11, Mongoose 8, MongoDB **8.0** en jeu de répliques, `@confluentinc/kafka-javascript` 1.11 (aucun `kafkajs`) | `package.json`, `Dockerfile`, `docker-compose.yml` ; un test qui refuse `kafkajs` dans les dépendances |
| AC-3 | **Deux modules Nest**, `src/modules/sinistres/` et `src/modules/expertises/`, chacun avec son manifeste copié de `prospera-stories/manifestes/<code>.manifest.ts` (`module.manifest.ts`), ses collections préfixées `<code>_` et son code de gate | test du manifeste : code = dossier, profil = code, empreinte de la source notée |
| AC-4 | **Un module n'importe jamais un autre module** (AD-3) : un import de `modules/expertises` depuis `modules/sinistres` (ou l'inverse) fait échouer la suite | test d'invariant + mutation |
| AC-5 | **Gate par module** (C2) : sur une route décorée `@ExigeModule('<code>')`, une organisation sans droit `ACTIVE` pour ce module reçoit **403 `<CODE>_NOT_ENTITLED`** sans aucune donnée (absent, `SUSPENDED`, `REVOKED`, organisation absente du jeton) ; échéance passée ⇒ lecture seule (`GET` passe, écriture **403 `ABONNEMENT_EXPIRE`**) ; le droit de `sinistres` n'ouvre pas `expertises` | e2e par statut, corps sans donnée |
| AC-6 | **Profil de démarrage** (C10) : le service déclare `profiles: ["sinistres", "expertises"]` ; le socle (Mongo, Kafka) n'a pas de profil ; `docker compose --profile sinistres up` lève le service **healthy** | `docker compose up` réel, `/api/v1/health` à 200 |
| AC-7 | **Garde de câblage** (STORY-643) : `AppModule` se résout entier (`NestFactory.create(..., { preview: true })`) ; la chaîne d'`APP_GUARD` est assertée en présence **et** en ordre | deux tests d'invariant ; mutation (retrait du gate) rouge |
| AC-8 | Lint 0, build vert, tests unitaires et e2e verts **sous Node 24** (stage `verification` du `Dockerfile`, le client Confluent étant un binding natif) | sorties des commandes |

## Décisions retenues par défaut (contestables)

- **D-980-1 — Gate par module, pas un gate `assurance`.** Le plan écrit « gate `assurance` » ; la spine (AD-3 : « gate
  `<CODE>_NOT_ENTITLED` » par module) et le manifeste de `sinistres` (« Gate : `SINISTRES_NOT_ENTITLED` ») disent un
  gate **par code de module**. La spine gagne : `SINISTRES_NOT_ENTITLED` et `EXPERTISES_NOT_ENTITLED`. Lu ainsi :
  « le gate de la verticale assurance », posé module par module. Le code `assurance` reste celui de
  `prospera-assurance-service` (STORY-981).
- **D-980-2 — La garde lit l'état du module par un port, alimenté aujourd'hui par `entitlement.changed`.** Le contrat
  C2 amendé veut que la garde lise l'**état publié** (`etat-publie.changed.<espace>@1`) ; ce contrat est celui de
  STORY-932 (B), pas encore figé, et la garde partagée est STORY-937. Le squelette lit donc un port
  `EtatDesModules`, alimenté par la projection de `entitlement.changed` v2 du catalogue (contrat existant, schéma au
  registre depuis STORY-930), avec la lecture seule à l'échéance de STORY-727. La bascule sur l'état publié change
  l'alimentation du port, pas les routes ni la garde.
- **D-980-3 — Pas de KYC dans le gate.** C2 ne demande que le droit du module. Une compagnie sur son serveur n'a pas
  de KYC Money Vibes à présenter à chaque requête ; le KYC de l'organisation reste une affaire de l'octroi
  (catalogue), pas du service. Le patron d'`assurance-service` (KYC dans le gate) est celui des verticales du
  cabinet, pas celui de la compagnie.
- **D-980-4 — Un compose dans le dépôt.** Le `docker-compose.yml` racine n'est versionné nulle part et
  `prospera-recette` est tenu par A. Le dépôt porte donc son propre `docker-compose.yml` : socle sans profil (MongoDB
  8.0 en jeu de répliques, Kafka) et le service sous les profils `sinistres` et `expertises`. Projet préfixé
  `grp-c`. L'entrée du service dans la pile de recette sera une **demande à A** quand une recette croisée en aura
  besoin.
- **D-980-5 — Pas d'outbox ni de publication dans le squelette.** Le premier fait publié par `sinistres` naît avec
  la machine à états (STORY-988), qui écrira dans la même transaction le dossier, l'audit et l'outbox (AD-4). Poser
  une outbox vide ici n'apporterait rien qu'un test puisse garder. Le squelette consomme seulement.
- **D-980-6 — L'état des modules est une donnée du socle.** Le read-model (`socle_etat_des_modules`, clé
  `(organisationId, module)`) et le registre d'idempotence (`socle_evenements_traites`, clé `(eventId,
  consommateur)`) vivent sous `src/socle/` : ils décrivent l'installation de l'organisation, pas un objet métier.
  Aucun module n'y écrit ; chaque module a son code de gate.
- **D-980-7 — Une route par module, sans donnée métier.** `GET /api/v1/<code>/module` (gardée) rend
  `{ module, version, organisationId, lectureSeule }` : elle prouve le gate de bout en bout et dit à la coque ce que
  l'organisation peut faire dans le module. Aucune autre route avant les stories qui les portent.

## Contexte pour le développeur

### Ce qui existe et se reprend

- **`prospera-assurance-service` (`origin/dev`)** est le gabarit : `main.ts` (préfixe `api`, version URI `v1`, helmet,
  CORS, Swagger), `config/` (validation d'environnement), `common/` (garde JWT RS256/JWKS, e-mail vérifié, rôles,
  throttler par clé, filtre d'exceptions, refus nommés, horloge), `health/`, `test/utils/serveur-e2e.ts`,
  `test/utils/rs256.ts`, `test/utils/app-module.ts` (chaîne d'`APP_GUARD` lue par métadonnée),
  `src/app-cablage.invariant.spec.ts` (STORY-727/643). **À ne pas reprendre** : portée dossier, KYC, référentiel,
  exercices (verticale du cabinet).
- **`platform-catalog-service` (`origin/dev`, STORY-930)** : `KafkaModule` sur `KafkaJS.Kafka({ kafkaJS: {...} })`,
  consommateur à relance exponentielle (`consommateur-identite.service.ts`), stage `verification` du `Dockerfile`.
- **Événement consommé** : `entitlement.changed` (v2), schéma `platform-catalog-service/contrat/schemas/entitlement.changed.json`,
  clé `orgId`, champs `moduleCode`, `status`, `terme`, `echeanceLe`.

### Garde-fous

- Le neuf écrit **`organisationId`** (plan §8) ; le jeton porte `tenantId`, la projection lit `orgId` (contrat
  existant, jamais renommé).
- Un seul client Kafka par processus (AD-3) ; groupe de consommateurs préfixé `sinistres-service.`.
- Temps : port `Horloge` (AD-18), jamais `Date.now()` dans une décision.
- Port de développement **3409** (spine, conventions).
- `@Prop` : jamais une union de littéraux (`type: String` + `enum`) ; `SchemaTypes.ObjectId`, jamais `Types.ObjectId`
  (chemin Mixed).
- Client Confluent : tests sous Node 24 dans `docker build --target verification`.

### Tests exigés

Unitaires (garde, projection, consommateur, manifestes, isolement des modules, câblage, chaîne de gardes), e2e
(gate par statut et par module, lecture seule, corps sans donnée), `docker compose --profile sinistres up` healthy,
mutations : retrait du gate de la chaîne, import croisé entre modules, droit de `sinistres` accepté pour
`expertises`.

## Ce qui a été livré

**PR :** `prospera-sinistres-service` #1, fusionnée sur `dev` le 2026-11-15 (`4ea6540`) ; `main` = `04a2c74` (README).
Réglage du dépôt : « Rebase and merge » seul (squash et commit de fusion refusés).

| AC | Livré | Preuve |
|:--:|---|---|
| AC-1 | `main` (README, `.gitattributes` en LF) et `dev` ; PR #1 en « Rebase and merge » | `gh pr view 1` : `MERGED` |
| AC-2 | Node 24 (`engines`, toutes les images `node:24-slim`), NestJS 11, Mongoose 8, MongoDB `mongo:8.0` en `rs0`, `@confluentinc/kafka-javascript` `~1.11.0` | `pile-du-moteur.invariant.spec.ts` ; mutation `kafkajs` ajouté ⇒ rouge |
| AC-3 | `src/modules/sinistres/`, `src/modules/expertises/` ; manifestes copiés à l'octet du commit `566bee3`, empreintes dans `src/socle/manifestes/sources-des-manifestes.ts` | test d'empreinte ; il a rougi pour de vrai pendant le développement (un renommage avait touché la copie) |
| AC-4 | `modules-isoles.invariant.spec.ts` : imports relatifs, `import()`, `require` et chemins `modules/<code>` ; seule la racine de composition (`src/*.ts`) assemble les modules | mutation `sinistres` importe `expertises` ⇒ rouge, la violation nommée |
| AC-5 | `GardeDesModules` + `@ExigeModule(code)` ; 403 `SINISTRES_NOT_ENTITLED` / `EXPERTISES_NOT_ENTITLED` sans donnée ; lecture seule ⇒ 403 `ABONNEMENT_EXPIRE` sur une écriture | e2e 11/11 (absent, `SUSPENDED`, `REVOKED`, autre organisation, jeton sans organisation, droit de `sinistres` refusé pour `expertises`) ; mutations ⇒ rouges |
| AC-6 | `profiles: ['sinistres', 'expertises']` sur le service, socle sans profil, port `127.0.0.1:3409` | `docker compose --profile sinistres up --build` ⇒ **healthy**, `/api/v1/health` 200 (MongoDB et Kafka up) |
| AC-7 | `app-cablage.invariant.spec.ts` (`preview: true`) et `app.module.invariant.spec.ts` (cinq maillons, ordre, classes du dépôt) | mutation : garde retirée ⇒ 4/4 invariants et 11/11 e2e rouges |
| AC-8 | sous Node 24.22 (stage `verification`) : lint 0, build, **289 unitaires**, **11 e2e**, couverture 98 % lignes et 93 % branches | sorties des commandes |

**La projection sur un vrai MongoDB et un vrai Kafka.** Quatre `entitlement.changed` publiés sur la pile `grp-c` : un
droit daté de `sinistres`, le même rejoué, un droit du module `assurance`, un retrait de `sinistres` plus ancien.
Résultat lu en base : **un seul état** (`sinistres`, `ACTIVE`, `ECHEANCE`, échéance du 01/12) ; deux marqueurs (le
rejeu dédoublonné) ; rien pour `assurance` ; le retrait plus ancien marqué traité, journalisé, sans rien écraser.
Index unique `(organisationId, module)` présent. Pile descendue avec ses volumes.

**Mutations (5, toutes rouges) :** garde retirée de la chaîne ; `sinistres` importe `expertises` ; la garde lit le
droit de `sinistres` pour tout module ; un fait plus ancien écrase l'état ; `kafkajs` ajouté aux dépendances.

**Ce qui reste, et où :**
- **La bascule sur l'état publié** : le contrat est figé depuis (STORY-932, `contrat-etat-publie-v1`) ; la route arrive
  avec STORY-936 et la garde partagée avec STORY-937. Le port `EtatDesModules` changera d'adaptateur à ce moment-là,
  dans une story de la plage de C.
- **Les droits `sinistres:*` et `expertises:*` dans `auth-service`** : EPIC-202, au lot suivant (après STORY-938).
- **La pile de recette** : le service n'y est pas ; ce sera une demande à A quand une recette croisée en aura besoin.
- **Avertissement de jest** (« a worker process has failed to exit gracefully ») en exécution parallèle seulement ;
  `--runInBand --detectOpenHandles` ne trouve aucune ressource ouverte.
