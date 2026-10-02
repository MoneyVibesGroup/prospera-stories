# STORY-684 : Au démarrage à froid, le consommateur KYC de dossier-service crashe et ne revient jamais

Status: in_progress

**Épic :** EPIC-012
**Service :** `dossier-service` (consommateur `kyc.status.changed`, groupe `dossier-kyc`)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** vérification docker de STORY-538 (2026-09-25), passe 1 — constat hors périmètre.
**Branche :** `MNV-684` (dossier-service, base `dev`) — commit `6903ede`, **non poussé**.

---

## Le fait, observé

Stack neuve (`docker compose down -v` puis `up -d`) : le consommateur `dossier-kyc` a journalisé
`[Consumer] Crash: KafkaJSGroupCoordinatorNotFound` (Kafka pas encore prêt), puis `Stopped` — et **n'a
jamais rejoint son groupe**, alors que `dossier-profil` et `dossier-etats-amont`, dans le même processus,
se sont reconnectés. Le read-model `orgkycstatuses` est resté **vide** ; tout `POST /dossiers` rendait
`403 KYC_NOT_APPROVED` à des organisations approuvées. Un `docker restart` l'a rétabli. **Intermittent** :
la passe 2 (même procédure) n'a pas crashé.

⛔ C'est l'invariant 4 (démarrage dégradé) : Kafka absent au boot ne doit rien tuer — ni le process, ni
**en silence** un consommateur.

## Cause racine — mesurée

**Il n'y a AUCUNE différence de code entre les groupes.** Les 4 bootstraps du service
(`identity-consumer`, `profil-consumer`, `etats-amont-consumer`, `kyc-status-consumer`) étaient identiques à
la virgule près : `connect → subscribe → run`, puis `started = true` et arrêt de la boucle `setInterval`
de 5 s. `dossier-kyc` a été frappé parce que c'est **son** coordinateur de groupe (partition de
`__consumer_offsets` choisie par hachage du `groupId`) qui n'était pas prêt à cet instant — d'où
l'intermittence. Les trois autres groupes avaient le même défaut, latent.

Le défaut est la conjonction de deux comportements de **kafkajs 2.2.4**, lus dans
`node_modules/kafkajs/src` puis **reproduits** avec le vrai code (`consumer`, `runner`, `consumerGroup`)
et un cluster factice (`tmp/verif-684/` ; figé en test, cf. AC-3) :

1. `Runner.start()` (`consumer/runner.js:77-90`) **attrape** l'échec de `joinAndSync()` et appelle
   `onCrash` — sans relancer l'erreur. `consumer.run()` se **résout** donc normalement. L'ancien bootstrap
   en concluait « démarré » et **coupait sa propre boucle de relance**.
2. `onCrash` (`consumer/index.js:246-302`) ne relance que si l'erreur est retriable. Or
   `KafkaJSGroupCoordinatorNotFound` hérite de `KafkaJSNonRetriableError` (`errors.js:155`,
   `retriable = false`) ; `joinAndSync` la transmet telle quelle par `bail(e)`. Résultat : log
   `Crash: KafkaJSGroupCoordinatorNotFound`, `disconnect()` ⇒ log `Stopped`, événement `CRASH` avec
   `restart: false` — **plus rien**.

Mesure (sortie brute) :

```
[log] Consumer Starting
[log] Consumer Crash: KafkaJSGroupCoordinatorNotFound: Failed to find group coordinator
[log] Consumer Stopped
[CRASH] restart = false error = KafkaJSGroupCoordinatorNotFound
consumer.run() résolu sans erreur = true
appels findGroupCoordinator après 3 s = 1 (1 = jamais relancé)
```

Contre-épreuve avec une erreur **retriable** (`KafkaJSConnectionError`) : `restart = true`, kafkajs se
relance seul toutes les 300 ms — c'est le cas des groupes « qui se sont reconnectés ».

Hypothèse sur l'origine côté broker (non mesurée en docker) : `findGroupCoordinatorMetadata`
(`cluster/index.js:384-421`) ne réessaie que `GROUP_COORDINATOR_NOT_AVAILABLE` et abandonne (`bail`) sur
tout autre code — dont `GROUP_LOAD_IN_PROGRESS` (14), typique d'un `__consumer_offsets` en cours de
chargement sur un KRaft neuf ; `withBroker` avale alors l'erreur et le cluster lève
`KafkaJSGroupCoordinatorNotFound`.

Aggravant : `/health` ne regardait que `describeCluster` — broker joignable ⇒ `kafka: up`, alors que
`dossier-kyc` était mort. Le défaut était **silencieux**.

## Décisions

- **D-684-1 — l'état réel vient des événements kafkajs, jamais de la résolution de `run()`.**
  `GROUP_JOIN` ⇒ dans le groupe ; `CRASH` ⇒ hors groupe. C'est la seule source fiable (point 1 ci-dessus).
- **D-684-2 — un seul utilitaire, `SupervisionConsommateur`** (`src/kafka/supervision-consommateur.util.ts`),
  pour les **4** consommateurs du service (le brief en annonçait trois : `dossier-identity` a le même code
  et le même défaut). Placé hors des `*bootstrap*` (exclus de `collectCoverageFrom`) : 100 % couvert. Il
  relance : un `CRASH` avec `restart: false`, et un échec de `connect`/`subscribe`/`run`. Il **ne relance
  pas** un `CRASH` avec `restart: true` (kafkajs le fait déjà ; relancer aussi lancerait deux `run()`
  concurrents) — il le journalise seulement. Rejouer `connect → subscribe → run` sur le **même** objet
  consommateur après un crash a été vérifié sur le vrai kafkajs (après `onCrash`, `consumerGroup` est
  remis à `null`, donc `subscribe` et `run` sont de nouveau admis).
- **D-684-3 — délai croissant borné** : 1 s, doublé à chaque échec, plafonné à 30 s (le `maxRetryTime` de
  kafkajs) ; remis à zéro à l'adhésion. Une seule relance en attente à la fois. Chaque relance est
  journalisée en `error` avec son numéro et son délai ; l'adhésion en `log`.
- **D-684-4 — 1re tentative non attendue au boot** (`void this.supervision.demarrer()`). Avant, chaque
  `onApplicationBootstrap` attendait `connect()` contre un broker absent, qui épuise d'abord ses propres
  relances kafkajs, et retardait d'autant l'écoute HTTP (lu dans le code, non chronométré en docker).
  Le démarrage HTTP n'attend plus Kafka.
- **D-684-5 — `EtatConsommateursService`** (fourni et exporté par `KafkaModule`, `@Global`) : chaque
  supervision s'y déclare **attendue** dès sa construction ; `KafkaHealthIndicator` rend `down` si le
  broker ne répond pas **ou** si un groupe attendu n'est pas rejoint (message
  `Consommateur(s) hors de leur groupe : <groupes>.`, champ `groupesHorsGroupe`). Aucun service du compose
  ne dépend de la santé de `dossier-service` (`depends_on`), donc un `/health` plus strict ne bloque aucun
  démarrage voisin.
- **D-684-6 — garde par balayage** (`src/kafka/consommateurs-supervises.invariant.spec.ts`) : chaque
  `*-consumer.bootstrap.ts` du service doit déléguer à `SupervisionConsommateur` et ne jamais appeler
  `.connect(`/`.subscribe(`/`.run(` lui-même. Le balayage asserte qu'il trouve exactement les 4 fichiers
  (un balayage vide ne prouverait rien).
- **Hors périmètre** (AC-4) : les autres services ne sont **pas** corrigés ici.

## Critères d'acceptation

- [x] AC-1 — Un crash de consommateur au démarrage (et plus tard) est **relancé**, avec délai croissant
      borné et journalisation. → `SupervisionConsommateur`, tests « délai croissant 1/2/4 s », « plafond »,
      « crash PLUS TARD … compteur remis à zéro », « broker absent au boot ».
- [x] AC-2 — `/health` dit `kafka: down` tant qu'un consommateur attendu n'a pas rejoint son groupe ; le
      process reste UP (HTTP répond 503). → `kafka.health.spec.ts` (2 cas AC-2) + e2e
      `health.e2e-spec.ts` (503 puis 200 après adhésion).
- [ ] AC-3 — Preuve : **test** ✅ (crash `KafkaJSGroupCoordinatorNotFound` au 1er `run` ⇒ relance à 1 s ⇒
      rejoint ; et contrat contre le vrai kafkajs) ; **docker** ⏳ à faire par la session principale
      (scénario ci-dessous).
- [x] AC-4 — Relevé des autres services (ci-dessous), sans correction.

## Table de mutations (exécutée — `tmp/verif-684/mutations.py`, rejouable)

Chaque mutation est appliquée par remplacement d'**une** occurrence exacte (vérifiée), tests ciblés
lancés, puis restauration depuis `HEAD` et `git diff --quiet` de contrôle. Un mutant qui ne compile pas
est classé « non probant », jamais « rouge ».

| # | Mutation | Verdict |
|---|---|---|
| M1 | retirer la relance d'un `CRASH` `restart: false` (**la relance de l'AC-3**) | ROUGE — 7 ✕ / 16 (dont AC-3, délai croissant, et le contrat contre kafkajs réel) |
| M2 | retirer la relance d'un échec `connect`/`subscribe`/`run` | ROUGE — 1 ✕ / 16 (« broker absent au boot ») |
| M3 | délai constant (plus croissant) | 1er passage **non probant** (mutant non compilable : paramètre inutilisé) ; réécrit `initialMs + 0 * tentative` ⇒ ROUGE — 4 ✕ / 16 |
| M4 | plafond retiré | ROUGE — 2 ✕ / 16 |
| M5 | compteur non remis à zéro à l'adhésion | ROUGE — 1 ✕ / 16 |
| M6 | défaut d'origine : `run()` résolu ⇒ « dans le groupe » | ROUGE — 3 ✕ / 16 |
| M7 | relancer aussi un `CRASH` `restart: true` (2 `run()` concurrents) | ROUGE — 1 ✕ / 16 |
| M8 | `/health` ignore les groupes non rejoints | ROUGE — unitaire 1 ✕ / 6 **et** e2e 1 ✕ / 3 |
| M9 | bootstrap `dossier-kyc` ne démarre plus la supervision | ROUGE — invariant 1 ✕ / 5 |
| M10 | `arreter()` ne coupe pas les relances | ROUGE — 1 ✕ / 16 |

Arbre restauré après chaque mutation (`restauré=oui` ×10), `git status` propre en fin de passe.

## Portes (worktree `tmp/wt-684-dossier`, après le commit `6903ede`)

| Porte | Résultat |
|---|---|
| `eslint "{src,test}/**/*.ts" --max-warnings 0` | 0 (aucun warning) |
| `npm run build` | OK |
| `npm run test:cov -- --maxWorkers=2` | **108 suites, 1726 tests verts** ; couverture globale **99.46 stmts / 94.67 branches / 98.58 fonctions / 99.57 lignes** (seuils 90/65/90/90 inchangés) |
| `npm run test:e2e -- --maxWorkers=2` | **9 suites, 351 tests verts** |

Par fichier neuf : `supervision-consommateur.util.ts` 100/100/100/100 · `etat-consommateurs.service.ts`
100/100/100/100 · `kafka.health.ts` 100 stmts / 50 branches (la branche manquante est le défaut
`key = 'kafka'` déjà présent avant la story).

Tests ajoutés : `supervision-consommateur.util.spec.ts` (16), `etat-consommateurs.service.spec.ts` (4),
`consommateurs-supervises.invariant.spec.ts` (5), `kafka.health.spec.ts` (+2), `health.e2e-spec.ts` (+1).
Doublure mise à jour : `migration.module.spec.ts` (le faux consommateur expose `on`/`events`, et
`EtatConsommateursService` est fourni par le décor `@Global`).

Le garde existant `dossier-access.invariant.spec.ts` (ligne `fromBeginning: true,` ancrée en début de
ligne) a **rougi** sur une première version qui écrivait l'abonnement sur une ligne : l'objet a été
remis sur plusieurs lignes (dans les 4 bootstraps, par cohérence), le garde reste tel quel.

Contrôles avant commit : aucun octet NUL dans les `.ts` modifiés ; aucun JSDoc détaché introduit (un JSDoc
détaché **préexistant** subsiste dans `migration.module.spec.ts:31`, présent dans `HEAD` avant la story —
non touché).

## AC-4 — autres services au même démarrage fragile (lecture seule, non corrigés)

Relevé sur les checkouts principaux (branche `dev`, commit indiqué), kafkajs **2.2.4** partout. Motif
fragile = `await consumer.run(...)` suivi de `started/demarre = true` et arrêt de la boucle de relance,
**sans** écoute de `CRASH`/`GROUP_JOIN` ni `restartOnFailure` (0 occurrence dans tous les services). Un
`KafkaJSGroupCoordinatorNotFound` à l'adhésion y tue le consommateur en silence, et `/health` ne le voit
pas. Ligne = l'appel `run(`.

| Service (commit) | Consommateurs fragiles |
|---|---|
| `assurance-service` (`c030b85`) | `src/modules/read-models/kyc-status-consumer.bootstrap.ts:83` · `entitlement-consumer.bootstrap.ts:87` · `exercice-consumer.bootstrap.ts:96` · `dossier-consumer.bootstrap.ts:94` |
| `balance-service` (`7a42a5c`) | `src/modules/read-models/axes-consumer.bootstrap.ts:91` · `exercice-consumer.bootstrap.ts:96` · `entitlement-consumer.bootstrap.ts:87` · `dossier-consumer.bootstrap.ts:93` · `kyc-status-consumer.bootstrap.ts:83` · `src/modules/balance/ingestion/ingestion-consumer.bootstrap.ts:84` · `src/modules/profil-societe/ocr/profil-ocr-consumer.bootstrap.ts:82` · `src/modules/cahiers/pieces-ocr/pieces-ocr-consumer.bootstrap.ts:82` |
| `bilan-service` (`4c93357`) | `src/modules/read-models/immobilisations-consumer.bootstrap.ts:89` · `exercice-consumer.bootstrap.ts:93` · `kyc-status-consumer.bootstrap.ts:80` · `entitlement-consumer.bootstrap.ts:83` · `identity-consumer.bootstrap.ts:86` · `dossier-consumer.bootstrap.ts:88` · `perimetre-consumer.bootstrap.ts:89` · `balance-consumer.bootstrap.ts:93` · `src/modules/bilan/jeu-etats/depot-fiscal/declaration-deposee-consumer.bootstrap.ts:92` |
| `document-service` (`4d93bb2`) | `src/modules/read-models/dossier-consumer.bootstrap.ts:88` · `identity-consumer.bootstrap.ts:89` · `src/modules/piece-extraction/cahier-piece-consumer.bootstrap.ts:89` · `src/modules/extraction/kyc-document-uploaded.consumer.bootstrap.ts:77` |
| `kyc-service` (`0fb71b1`) | `src/modules/document-extract/document-extrait-consumer.bootstrap.ts:85` |
| `microfinance-service` (`954d065`) | `src/modules/read-models/kyc-status-consumer.bootstrap.ts:83` · `entitlement-consumer.bootstrap.ts:87` · `exercice-consumer.bootstrap.ts:96` · `dossier-consumer.bootstrap.ts:94` |
| `expert-comptable` (`d7e4c88`) | `src/modules/identity/identity-consumer.bootstrap.ts:89` · `src/modules/kyc-events/kyc-events-consumer.bootstrap.ts:81` |
| `fiscal-service` (`4cc14d2`) | classe de base `src/modules/read-models/consumer-read-model.bootstrap.ts:54` (`demarre = true` l.57) — **5** sous-classes |
| `paiement-service` (`9779774`) | classe de base `src/modules/read-models/consommateur-read-model.bootstrap.ts:93` (`demarre = true` l.96) — **3** sous-classes |
| `notification-service` (`c882653`) | classe de base `src/modules/read-models/consommateur-read-model.bootstrap.ts:132` (`demarre = true` l.135) — **5** sous-classes |

Soit **45 consommateurs** dans 10 services. Les plus critiques, par effet : les `kyc-status` (gate
d'accès fail-closed : assurance, balance, bilan, microfinance) et les `entitlement`.

Non concernés : `auth-service` (`src/kafka/kafka-bootstrap.service.ts:165`) et `balance-service`
(`src/kafka/kafka-bootstrap.service.ts:172`) — consommateur **éphémère** de la sonde aller-retour de
`/health`, borné par un délai qui rend `down` : pas de mort silencieuse. `platform-catalog-service` et
`admin-panel` : aucun consommateur.

Suite proposée : une story par service (ou une story transverse) portant `SupervisionConsommateur` +
`EtatConsommateursService` ; pour fiscal/paiement/notification, la correction tient dans la classe de base.

## Scénario docker à rejouer (session principale — AC-3)

⚠️ `dossier-service` déclare `depends_on: kafka: condition: service_healthy` : un
`docker compose up dossier-service` **démarrerait Kafka**. Il faut `--no-deps`. Dossier de travail :
`PROSPERA/tmp/verif-docker-684/` (jamais le scratchpad).

1. **Stack neuve** : `docker compose down -v`.
2. **Boot sans Kafka** : `docker compose up -d mongo` puis, une fois Mongo sain,
   `docker compose up -d --no-deps dossier-service`. Vérifier `docker compose ps kafka` ⇒ absent.
3. **HTTP up, santé down** : attendre `Found 0 errors. Watching for file changes.` dans
   `docker compose logs dossier-service` ; puis
   `curl -s -w '\n%{http_code}\n' localhost:3009/api/v1/health` ⇒ **503**, `details.kafka.status = "down"`.
   Le process répond : invariant 4.
4. **Relances journalisées, délai croissant** :
   `docker compose logs dossier-service | grep -E "relance n°|groupe .* rejoint"` ⇒ pour chacun des 4
   groupes, `démarrage en échec (…) — relance n°1 dans 1000 ms`, puis n°2 2000, n°3 4000 … plafonné à
   `30000 ms`. Consigner les horodatages (écart croissant).
5. **Kafka arrive** : `docker compose up -d kafka` (puis `auth-service kyc-service` et ce qu'exige la
   création d'un compte approuvé, cf. `tmp/verif-docker-538/p1_comptes.py`).
6. **Adhésion** : dans les ≤ 30 s qui suivent le Kafka sain, les logs montrent
   `Consommateur kyc.status.changed : groupe dossier-kyc rejoint.` (et les 3 autres groupes). Côté broker :
   `docker exec prospera-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group dossier-kyc --members`
   ⇒ 1 membre (chemin du binaire propre à l'image `apache/kafka:3.9.0` — à confirmer par `ls /opt/kafka/bin`).
   `/health` ⇒ **200**, `kafka: up`.
7. **Read-model rempli** : créer une organisation et approuver son KYC (script `p1_comptes.py` de 538 ou
   équivalent), puis
   `docker exec prospera-mongo-1 mongosh --quiet dossier_service --eval 'db.getCollectionNames(); db.orgkycstatuses.find({}, {orgId:1, status:1}).toArray()'`
   ⇒ la ligne de l'organisation, statut approuvé. ⚠️ `orgkycstatuses` est l'**exception** documentée au
   snake_case (schéma sans `collection:` explicite) ; commencer par `getCollectionNames()`.
8. **Effet métier** : `POST /api/v1/dossiers` avec le jeton de cette organisation ⇒ **201** (et non plus
   `403 KYC_NOT_APPROVED`).
9. **Crash plus tard** (facultatif, AC-1 « plus tard ») : `docker compose restart kafka` pendant que
   `dossier-service` tourne ⇒ logs `CRASH` puis soit `kafkajs le relance lui-même`, soit `relance n°1 dans
   1000 ms` ; `/health` 503 pendant la coupure, puis 200 et `groupe dossier-kyc rejoint.`.
10. `docker compose stop` en fin de vérification.

Limite assumée : le cas **exact** `KafkaJSGroupCoordinatorNotFound` est intermittent et ne se provoque
pas à la demande en docker ; il est prouvé par le test contre le vrai code kafkajs. Le docker prouve le
chemin « broker absent au boot ⇒ relances ⇒ adhésion ⇒ read-model rempli ».

## Risques

- `/health` est plus strict : pendant le démarrage (≤ 1 s après un Kafka déjà sain, jusqu'à 30 s après un
  Kafka tardif), `dossier-service` est `unhealthy`. Aucun `depends_on` n'en dépend aujourd'hui ; à
  surveiller si un orchestrateur coupe le trafic sur readiness.
- La réponse 503 publique de `/health` nomme les groupes hors groupe (`dossier-kyc`…) : information
  d'infrastructure interne, du même ordre que le message d'erreur broker déjà exposé.
- Le test « contre kafkajs réel » importe `kafkajs/src/consumer` et `kafkajs/src/loggers` (chemins
  internes) : une montée de version de kafkajs peut le casser — c'est voulu, il fige le comportement dont
  dépend la cause racine.
- Le test réel s'appuie sur une attente bornée (relance à 20 ms, attente ≤ 2 s) : marge large, mais c'est
  le seul test temporel réel de la suite.

## Notes

- Journal de la passe : `PROSPERA/tmp/verif-docker-538/passe-1/journal.log` (l.108).
- Voir [[STORY-538]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-538.

**2026-10-02 — dev livré, `in_progress`.** Cause racine mesurée (kafkajs 2.2.4, aucune différence de code
entre les groupes) ; `SupervisionConsommateur` + `EtatConsommateursService` appliqués aux 4 consommateurs
de `dossier-service` ; portes vertes (lint 0, build OK, 1726 unitaires, 351 e2e, couverture
99.46/94.67/98.58/99.57) ; table de mutations M1–M10 toutes rouges. Commit `6903ede` sur `MNV-684`, non
poussé. **Reste** : vérification docker (scénario ci-dessus), revues ⑥/⑦, puis `review`.
`sprint-status.yaml` non modifié à ce stade (consigne).
