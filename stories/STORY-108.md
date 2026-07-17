# STORY-108 : Propager les 3 correctifs du `KafkaBootstrapService` à `auth-service` (round-trip fiable au 1er boot, plus d'arrêt de process)

**Epic :** EPIC-005 — auth-service / IdP (epic **clos** : story **corrective**, cf. « Rattachement » ci-dessous)
**Réf. architecture :** `architecture-prospera-ecosystem-2026-07-04.md` § Orchestration (P6 Kafka) ; `.agents/rules/kafka-evenements.md` ; CLAUDE.md § « Les 4 invariants structurants » — invariant **4 (démarrage dégradé)**
**Priorité :** Must Have
**Story Points :** 3
**Statut :** done
**Assigné à :** null
**Créée le :** 2026-07-17
**Sprint :** 11 (2026-11-19 → 2026-12-03)
**Service :** `auth-service` (:3001, base `auth_service`)
**Couvre :** dette technique — aucune FR (story de correction ; **origine : STORY-076**)

> **Story de dette technique, pas de fonctionnalité.** STORY-076 a découvert **3 bugs** dans le `KafkaBootstrapService` en le copiant depuis `auth-service` — dont un qui **tue le process**. Les correctifs ont été écrits, testés et vérifiés en docker **dans `balance-service` uniquement** : le périmètre de STORY-076 interdisait de toucher aux services existants. `auth-service` — **l'original, et l'IdP dont dépendent les 7 autres services** — porte donc encore les 3 bugs. Cette story les propage, en prenant `balance-service` comme **implémentation de référence**.

---

## User Story

En tant qu'**équipe plate-forme**,
je veux que **`auth-service` porte les mêmes correctifs Kafka de démarrage que `balance-service`**,
afin que **l'IdP ne s'arrête plus tout seul après un démarrage dégradé**, que son round-trip de santé **aboutisse dès le premier boot** sur une stack neuve, et que le `unhealthy` transitoire cesse d'être pris à tort pour une régression.

---

## Description

### Contexte

Le `KafkaBootstrapService` produit un message sur un topic de santé isolé et le consomme, au démarrage : c'est la **preuve que le bus est câblé**. Le patron est né dans `auth-service` (STORY-022) et a été **copié tel quel** dans `balance-service` (STORY-076).

Copié tel quel, **il ne fonctionnait pas**. La vérification docker de STORY-076, faite sur une stack **repartie de zéro** (`down -v` → `up --build`) — condition que les vérifications précédentes ne reproduisaient pas —, a révélé **3 bugs latents** du patron d'origine. Les 3 ont été corrigés dans `balance-service`, chacun épinglé par un test, et le round-trip y aboutit désormais **au 1er boot sur Kafka vierge**.

`auth-service` n'a **pas** été corrigé : le critère de non-régression de STORY-076 interdisait explicitement de toucher au code des 7 services existants. La dette a donc été actée dès la clôture (statut STORY-076 : « ⚠️ `auth-service` PORTE LES 2 MÊMES BUGS … → **STORY DÉDIÉE À CRÉER** »). C'est cette story.

**Pourquoi ça n'est pas cosmétique** : le bug ③ **arrête le process Node** (`unhandledRejection`, Node ≥ 15) ~45 s après un démarrage réputé « dégradé mais vivant ». Sur **l'IdP**, c'est-à-dire le **seul émetteur des JWT** dont dépendent les 7 autres services. Il ne se déclenche que lorsque Kafka est joignable à l'abonnement puis défaillant à la production (broker qui tombe, partition sans leader, rebalance) — une fenêtre étroite, donc jamais rencontrée en dev, mais qui **contredit frontalement l'invariant 4** (« une erreur de connexion Kafka ne doit jamais tuer le process »).

> ⚠️ **Correction d'une hypothèse fausse (vérifiée le 2026-07-17)** : le statut de STORY-076 et la note projet affirment qu'`expert-comptable` « porte les 2 mêmes bugs ». **C'est faux.** `expert-comptable` n'a **aucun** `KafkaBootstrapService` (son `KafkaModule` ne fournit que le client) — la lecture du code le confirme. `grep -rl "KafkaBootstrap"` ne remonte que **`auth-service`** et **`balance-service`** : `kyc-service`, `platform-catalog-service`, `bilan-service`, `document-service` et `expert-comptable` n'ont jamais eu de round-trip d'amorçage. **Le périmètre réel est donc `auth-service` SEUL** (et non « auth-service + les 4 à vérifier » comme le supposait le cadrage). Le `unhealthy` transitoire d'`expert-comptable` au 1er boot a **une autre cause** → hors périmètre, cf. Q1.

### Les 3 bugs à propager

Référence : [`balance-service/src/kafka/kafka-bootstrap.service.ts`](../../balance-service/src/kafka/kafka-bootstrap.service.ts) — les 3 comportements y sont épinglés par des tests.

| # | Bug (dans `auth-service` aujourd'hui) | Symptôme observable | Correctif de référence |
|---|---|---|---|
| ① | **Topic auto-créé à la volée** : on produit sans garantir qu'une partition leader est élue | `This server does not host this topic-partition` au 1er boot sur Kafka vierge → round-trip OK **au 2e démarrage seulement** | `ensureHealthTopic()` : `admin.createTopics({ topics, waitForLeaders: true })` **avant** de produire (idempotent : renvoie `false` si le topic existe) |
| ② | **Délai trop court** : `HEALTH_ROUND_TRIP_TIMEOUT_MS = 10_000` | L'adhésion au consumer group prend **~18 s** sur cluster froid (mesuré `duration:18076`, 7 services adhérant en même temps) → abandon **systématique** | Délai porté à **45 s** **ET** round-trip lancé **en tâche de fond** (le hook ne renvoie **rien**) |
| ③ | 🔴 **Arrêt du process** : un `send()` en échec **après** l'abonnement laisse la promesse du round-trip **orpheline** ; son minuteur rejette sans gestionnaire | `unhandledRejection` (un `Error` simple, **non couvert** par le filet `KafkaJS*` de `main.ts` → re-levé → `uncaughtException`) → **arrêt du process**, ~45 s après un boot « dégradé mais vivant » | `waitForRoundTrip` renvoie `{ promise, cancel }` ; `cancel()` dans le `finally` sur **toutes** les sorties + `promise.catch(() => undefined)` attaché d'office |

> **③ — pourquoi le filet d'`auth-service` ne le rattrape pas** (relevé en revue, 2026-07-17). Contrairement à `balance-service` (d'où l'analyse est reprise, et qui n'en a **aucun**), `auth-service` installe un garde-fou `installKafkaUnhandledRejectionGuard` dans [`main.ts`](../../auth-service/src/main.ts) — conforme à [`kafka-evenements.md`](../../.agents/rules/kafka-evenements.md) : *« n'avaler que les erreurs `KafkaJS*`, laisser planter le reste »*. On pourrait donc croire le bug ③ déjà neutralisé ici. **Il ne l'est pas** : le filet ne ravale que les erreurs dont le `name` commence par `KafkaJS` et **re-lève tout le reste**. Or le rejet orphelin est le minuteur du round-trip, qui rejette un `Error` **simple** (« délai dépassé en attendant le message de santé ») → non reconnu → **re-levé dans le handler `unhandledRejection`** → `uncaughtException` → **arrêt du process**. Le filet fait exactement ce que la règle demande ; c'est la promesse orpheline qui n'a rien à y faire.
>
> **Corollaire sur l'altitude du correctif** : la tentation serait d'élargir le filet pour qu'il avale aussi cette erreur. Ce serait le mauvais niveau — la règle dit « laisser planter le reste » précisément pour ne pas masquer de vrais bugs. Le correctif retenu **supprime le rejet orphelin à la source** (`cancel()` + gestionnaire attaché d'office) : plus rien à rattraper, et le filet garde son périmètre.

> **② est double, et la seconde moitié est la plus importante.** Passer le délai à 45 s **sans** basculer en tâche de fond serait un **régression** : Nest **attend** la promesse du hook `onApplicationBootstrap`, donc la retourner fait dépendre le boot HTTP de Kafka. Broker absent → boot bloqué 45 s → dépassement du `start_period` (20 s) du healthcheck → **conteneur `unhealthy` redémarré en boucle**. C'est exactement l'invariant 4 qu'on prétend défendre. `onApplicationBootstrap(): void` — pas `Promise<void>`.

### Périmètre

**Inclus :**

- **`auth-service/src/kafka/kafka-bootstrap.service.ts`** : les 3 correctifs, alignés sur `balance-service` (structure, commentaires explicatifs et noms compris — l'écart entre les deux fichiers doit se réduire au **nom du service**).
  - `onApplicationBootstrap(): void` — lance `runHealthRoundTrip()` en tâche de fond, expose `roundTripSettled?: Promise<void>` **pour les tests uniquement**.
  - `runHealthRoundTrip()` : ne rejette **jamais** (toute erreur journalisée puis avalée) ; `finally` → `roundTrip?.cancel()` puis `consumer?.disconnect()`.
  - `ensureHealthTopic()` : `admin.connect()` → `createTopics({ waitForLeaders: true })` → `admin.disconnect()` dans un `finally`.
  - `waitForRoundTrip()` : renvoie `{ promise, cancel }` ; `promise.catch(() => undefined)` attaché avant retour ; `clearTimeout` sorti du `eachMessage`/`catch` et porté par `cancel`.
- **`auth-service/src/kafka/kafka.constants.ts`** : `HEALTH_ROUND_TRIP_TIMEOUT_MS` **10_000 → 45_000** (avec le commentaire justifiant le dimensionnement « cluster froid ») + ajout de `SERVICE_NAME = 'auth-service'` (aujourd'hui la chaîne `'auth-service'` est **codée en dur** dans le payload du bootstrap — l'aligner sur le patron `balance-service`).
- **`auth-service/src/kafka/kafka-bootstrap.service.spec.ts`** — **fichier à créer** : `auth-service` n'a **aucun test** sur son `KafkaBootstrapService` (c'est précisément pourquoi les 3 bugs y ont survécu). Porter les **6 tests** de `balance-service` :
  1. rend la main immédiatement — le boot ne dépend jamais de Kafka ;
  2. s'abonne au topic de santé depuis le début, dans son groupe dédié ;
  3. crée le topic de santé (idempotent, avec leader) **AVANT** de produire ;
  4. produit un message corrélé puis le consomme → journalise le succès ;
  5. n'échoue pas le démarrage si la production échoue (Kafka down) ;
  6. **ne laisse ni minuteur armé ni promesse orpheline quand `send` échoue** (le test qui garde le bug ③).
- **Vérification docker réelle** sur stack **repartie de zéro** — c'est le seul protocole qui reproduit les 3 bugs (cf. AC-07 → AC-10).

**Hors périmètre :**

- **Les 5 autres services** (`expert-comptable`, `kyc-service`, `platform-catalog-service`, `bilan-service`, `document-service`) : **aucun `KafkaBootstrapService`** → rien à propager. Vérifié par `grep -rl "KafkaBootstrap"` (ne remonte que `auth-service` + `balance-service`). **Ne pas leur en ajouter un** : ce serait une fonctionnalité nouvelle, pas une correction.
- **Le `unhealthy` transitoire d'`expert-comptable`** au 1er boot : cause **différente** (pas de bootstrap chez lui) → Q1, à instruire séparément si le symptôme gêne.
- **Extraction d'un paquet partagé `@prospera/kafka`** : la duplication reste le choix assumé du projet (K4, comme l'enum `Role` dans 4 services). Cette story **aligne** deux copies, elle n'en supprime pas une. Cf. Q2.
- **`KafkaHealthIndicator`** : contrôle de connectivité **indépendant** du round-trip, non concerné.
- **Remplacement du round-trip par le simple indicateur en prod** : évoqué dans les commentaires des deux services, reste une décision ouverte non tranchée ici.

---

## Critères d'acceptation

**Code**

- [ ] **AC-01** — `auth-service/src/kafka/kafka-bootstrap.service.ts` crée le topic de santé via `admin.createTopics({ waitForLeaders: true })` **avant** tout `send()`, et déconnecte l'admin dans un `finally`.
- [ ] **AC-02** — `HEALTH_ROUND_TRIP_TIMEOUT_MS === 45_000` et `SERVICE_NAME === 'auth-service'` est exporté par `kafka.constants.ts` puis consommé par le payload (plus de chaîne codée en dur).
- [ ] **AC-03** — `onApplicationBootstrap` a le type de retour **`void`** (pas `Promise<void>`) et n'attend pas le round-trip ; `roundTripSettled` expose la promesse **pour les tests**.
- [ ] **AC-04** — `waitForRoundTrip` renvoie `{ promise, cancel }` ; un gestionnaire de rejet est attaché d'office ; `cancel()` est appelé dans le `finally` de `runHealthRoundTrip` sur **toutes** les sorties (succès, `send` en échec, abonnement en échec).
- [ ] **AC-05** — `runHealthRoundTrip` ne rejette jamais : Kafka indisponible → `logger.error` + le process **reste vivant**.
- [ ] **AC-06** — Le diff `auth-service` ↔ `balance-service` sur `kafka-bootstrap.service.ts` **ne porte plus que sur le nom du service** (vérifié par un `diff` explicite consigné dans le suivi).

**Vérification docker — stack repartie de ZÉRO** (`docker compose down -v` → `up --build` ; le protocole est le cœur de la story, cf. AC-11)

- [ ] **AC-07** — Sur Kafka **vierge**, `auth-service` journalise **`Kafka round-trip OK`** dès le **1er** boot (aujourd'hui : `This server does not host this topic-partition`, OK au 2e seulement).
- [ ] **AC-08** — Le topic `prospera.health.auth-service` existe après le 1er boot (`kafka-topics --list`).
- [ ] **AC-09** — `auth-service` devient `healthy` **sans passer par ~1 min d'`unhealthy`** ; `GET :3001/api/v1/health` → 200 `{ mongodb: up, kafka: up }`.
- [ ] **AC-10** — **Démarrage dégradé préservé** (invariant 4) : stack **sans Kafka**, `auth-service` démarre quand même, `/health` signale `kafka: down`, et le process est **toujours vivant > 60 s** après le boot (fenêtre qui couvre le délai de 45 s), sans redémarrage de conteneur.
  > ⚠️ **Corrigé le 2026-07-17 (à la vérification)** : ce critère disait « c'est la preuve du bug ③ corrigé ». **C'est faux, et vérifié comme tel** — l'ancien code **passe ce test aussi** (mesuré : PID inchangé, `RestartCount: 0` après 70 s). Raison structurelle : sans Kafka, `consumer.connect()` échoue **avant** que `waitForRoundTrip` n'arme le minuteur — le bug ③ ne peut pas se déclencher. AC-10 reste un **garde-fou utile de l'invariant 4**, mais il **ne discrimine pas** ancien/nouveau code. La preuve du bug ③ est AC-11.
- [ ] **AC-11** — Preuve du bug ③ par **test unitaire mutation-testé** : le test « ne laisse ni minuteur armé ni promesse orpheline quand `send` échoue » **tombe** quand on retire `cancel()` + le gestionnaire de rejet, et **passe** avec. Le bug ③ exige que l'abonnement **réussisse** *puis* que `send()` échoue — fenêtre étroite (broker qui tombe entre `subscribe` et `send`, partition sans leader) **non reproductible proprement en docker** : le test unitaire est le bon instrument, pas la stack.
  > **Chaque correctif est mutation-testé** (retirer le correctif ⇒ le test correspondant, et lui seul, échoue) : ① `createTopics` déplacé après le `send` ⇒ tombe ; ② le hook renvoie la promesse ⇒ tombe ; ③ `cancel()` + gestionnaire retirés ⇒ tombe.

**Non-régression**

- [ ] **AC-12** — Le flux **identité** d'`auth-service` est intact : `register` → `login` → JWT RS256 accepté par un service aval ; les événements `identity.*` (STORY-027) sont toujours produits — **le round-trip de santé et l'outbox métier sont indépendants, le prouver plutôt que le supposer**.
- [ ] **AC-13** — Les **7 autres services** répondent `/health` 200 (aucun code applicatif touché en dehors d'`auth-service`).
- [ ] **AC-14** — Lint **0 warning** · build OK · unit + e2e verts · couverture **≥ 65/90/90/90** sur `auth-service` tenue.
  > ⚠️ **Corrigé le 2026-07-17 (à la vérification)** : ce critère disait « la couverture doit **monter** : le fichier passe de 0 test à 6 ». **Faux** : `kafka-bootstrap.service.ts` est **exclu de la couverture** par `collectCoverageFrom` (`!**/*bootstrap*.ts`) — et pas seulement dans `auth-service` : **les 4 services vérifiés portent la même exclusion**, `balance-service` compris (ses 6 tests ne comptent pas davantage). Les tests **s'exécutent et attrapent les bugs** (mutation-testés), ils ne **pèsent** simplement pas dans la métrique. La couverture ne bouge donc pas. **L'exclusion n'est pas touchée** : c'est une convention partagée par tous les services, la changer pour un seul créerait une divergence — cf. Q3.

---

## Notes techniques

### Composants

- **Modifiés :** `auth-service/src/kafka/kafka-bootstrap.service.ts`, `auth-service/src/kafka/kafka.constants.ts`
- **Créé :** `auth-service/src/kafka/kafka-bootstrap.service.spec.ts`
- **Référence (ne pas modifier) :** `balance-service/src/kafka/kafka-bootstrap.service.ts` + `.spec.ts`
- **Non touchés :** `kafka.module.ts` (déjà identique des deux côtés), `kafka-producer.service.ts`, `health/indicators/kafka.health.ts`, `kafka/outbox/`

### Méthode

**Porter, ne pas réinventer.** L'implémentation de référence est vérifiée en docker et revue (`/code-review high`, 3 constats corrigés). Partir du fichier `balance-service`, l'adapter au nom du service, et **conserver les commentaires explicatifs** : ils portent le *pourquoi* (le mesuré `~18 s`, le `start_period` 20 s, l'`unhandledRejection`) que la prochaine copie du patron perdra sinon une troisième fois.

**Attention au sens de la copie.** `auth-service` est **l'original** : sa version contient des références historiques (« STORY-022 ») à conserver ou à actualiser, pas à remplacer aveuglément par « STORY-076 ». Le commentaire d'en-tête doit rester juste pour `auth-service`.

### Aucun changement de base ni d'API

Ni schéma, ni endpoint, ni variable d'env, ni contrat d'événement. Le topic de santé (`prospera.health.auth-service`) et le groupe (`auth-service-health`) sont **inchangés** : STORY-108 ne modifie que la **façon** dont le topic est créé et dont le round-trip est attendu. Aucun impact sur les consommateurs aval.

### Sécurité

Aucune surface d'authentification touchée. Le seul angle : le payload de santé porte `{ service, nonce, at }` — **aucun secret**, à préserver tel quel.

### Cas limites

- **Topic préexistant** (2e boot et suivants) : `createTopics` renvoie `false`, aucune erreur → le chemin nominal doit rester silencieux.
- **Broker absent** : `admin.connect()` échoue → `logger.error`, boot HTTP **intact** (c'est AC-10).
- **`send()` en échec après abonnement** : chemin du bug ③ → `cancel()`, aucune `unhandledRejection` (c'est AC-11).
- **Résidu d'un boot précédent sur le topic** : le filtrage par `nonce` + `fromBeginning: true` est **déjà correct** dans `auth-service` — ne pas le casser en portant le reste.
- **Rebalance pendant l'attente** : couvert par le délai de 45 s.

---

## Dépendances

**Stories prérequises :**

- **STORY-076** ✅ *done* (2026-07-17) — fournit l'implémentation de référence **et** ses tests. Sans elle, cette story n'a pas de source.
- **STORY-022** ✅ *done* — a introduit le `KafkaBootstrapService` dans `auth-service` (l'original bugué).

**Stories bloquées :** aucune. **Mais** : tant que cette story n'est pas passée, chaque vérification docker sur stack neuve continue de produire un `unhealthy` transitoire sur `auth-service` — **bruit** qu'un développeur peut prendre pour une régression de sa propre story (c'est déjà arrivé). Bénéfice diffus mais réel sur toutes les stories du sprint 11.

**Dépendances externes :** aucune. `kafkajs` (`admin()`, `createTopics`) est déjà une dépendance d'`auth-service`.

**Ordonnancement :** indépendante des stories balance CORE (077/101/086/099) — ne touche aucun fichier partagé avec elles. Peut passer **à tout moment** du sprint 11. À faire de préférence **tôt** : le bruit de démarrage qu'elle supprime pollue les vérifications docker de toutes les autres.

---

## Definition of Done

- [ ] Lint `auth-service` **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0` — binaire **local**)
- [ ] `npm run build` OK
- [ ] `npm run test:cov` vert, seuils **≥ 65/90/90/90** tenus (jamais baissés)
- [ ] `npm run test:e2e` vert
- [ ] Les **6 tests** portés passent, dont celui du minuteur orphelin (bug ③)
- [ ] **Vérification docker réelle** sur stack repartie de **zéro** (`down -v` → `up --build`), consignée dans *Progress Tracking* : round-trip OK au **1er** boot + topic créé + `/health` 200 + **process vivant > 60 s sans Kafka**
- [ ] Non-régression : flux identité OK + `/health` 200 sur les **7** autres services
- [ ] `diff` `auth-service` ↔ `balance-service` consigné : écart réduit au nom du service
- [ ] Swagger : **sans objet** (aucun endpoint)
- [ ] Statut synchronisé aux **3 endroits** (en-tête, `sprint-status.yaml` + commentaire daté, *Progress Tracking*) + `completed_date`
- [ ] `/code-review` passé, constats traités
- [ ] Branche `MNV-108`, PR titrée `MNV-108(auth-service): …`, **Rebase and merge** sur `dev`, branche supprimée

---

## Découpage des points

- **Portage du service + constantes :** 1 point
- **Tests (6 tests portés, fichier créé de zéro) :** 1 point
- **Vérification docker sur stack neuve (down -v, 2 scénarios dont « sans Kafka » + sonde minuteur) :** 1 point
- **Total : 3 points**

**Justification.** Aligné sur STORY-076 (3 pts) : **un seul service**, implémentation de référence **déjà écrite, testée et revue**, aucun changement de base ni d'API. Le travail de code est un **portage**. Le coût réel est la **vérification** : elle exige un `down -v` (stack complète à reconstruire, ~plusieurs minutes) et deux scénarios distincts, dont un « sans Kafka » avec attente > 60 s pour prouver le bug ③.

⚠️ **Signal du sprint 10** (3 révisions 5→8 consécutives, *« estimer à la LECTURE du code, pas au plan »*) : ici la lecture **a été faite pendant la rédaction** — les 2 fichiers ont été lus et diffés, les 6 tests recensés, le périmètre **réduit** de « auth-service + 4 services à vérifier » à « **auth-service seul** » par `grep`. Le risque de sous-estimation est donc bas, et c'est le périmètre — pas l'estimation — qui a bougé.

---

## Notes additionnelles

### Rattachement à un epic

EPIC-005 (auth-service / IdP) est **clos** depuis le sprint 3. STORY-108 y est rattachée parce qu'elle **corrige du code livré par STORY-022**, qui en fait partie — rouvrir l'epic n'aurait pas de sens, et en créer un pour une story de dette non plus. À traiter comme une **story corrective hors decompte d'epic** ; elle est portée par le **sprint 11**.

### Impact sur le sprint 11

Le sprint 11 est **déjà surchargé** : **44 pts engagés pour 34 de capacité** (⚠️ signalé dans `sprint-status.yaml` comme « à arbitrer au prochain `/bmad:sprint-planning` »). STORY-108 le porte à **47/34**. Ce n'est **pas** un argument pour la reporter — c'en est un de plus pour **arbitrer le sprint 11** (l'arbitrage probable déjà noté : pousser EPIC-010 / 054→058 au sprint 12). À 3 pts pour un bug d'**arrêt de process sur l'IdP**, le rapport valeur/coût est le meilleur du sprint.

### Questions ouvertes

- **Q1 — le `unhealthy` transitoire d'`expert-comptable`.** Il est réel (observé en STORY-076) mais **n'a pas la cause supposée** : le service n'a pas de bootstrap. Piste : `IdentityConsumer` qui adhère à son groupe sur cluster froid (~18 s), ou le `KafkaHealthIndicator` pendant ce temps. **Hors périmètre.** À instruire dans une story dédiée **si le symptôme gêne** — il est bénin (le service répond 200 en direct), et la présente story supprime déjà le plus gros du bruit.
- **Q2 — paquet partagé `@prospera/kafka` ?** Deux copies du même fichier, deux fois les mêmes bugs, corrigés à ~6 mois d'écart : c'est l'argument classique. Le projet a **tranché contre** (K4, duplication assumée). Cette story **n'ouvre pas le débat**, elle le documente : si un 3e service copie un jour le patron, **rouvrir la question**, pas re-corriger une 3e fois.
- **Q3 — `!**/*bootstrap*.ts` exclu de la couverture, dans les 8 services.** Découvert à la vérification (cf. AC-14). C'est la **seconde cause racine** de cette story : le fichier n'avait aucun test **et** la métrique ne pouvait pas le signaler — un fichier exclu affiche « 100 % » par omission. L'exclusion couvre aussi `main.ts`, `*.module.ts`, `configuration.ts` : du câblage sans logique, ce qui est **défendable en général**, mais `kafka-bootstrap.service.ts` **porte de la logique** (corrélation, minuteur, gestion d'erreur) — il n'a de « bootstrap » que le nom. **Non touché ici** (convention partagée par les 8 services ; la changer pour un seul créerait la divergence que K4 cherche à éviter). À trancher au niveau **projet** : soit renommer le fichier hors du motif, soit restreindre l'exclusion. Tant que rien n'est fait, **tout futur `*bootstrap*.ts` sera invisible à la couverture** — c'est exactement le trou par lequel ces 3 bugs sont passés.

### Leçon à retenir (au-delà du correctif)

Les 3 bugs ont survécu ~6 mois dans l'IdP parce que **trois angles morts se sont superposés** : (a) `auth-service` n'avait **aucun test** sur ce fichier ; (b) le fichier est **exclu de la couverture** (Q3) — donc rien ne signalait (a) : la métrique affichait « kafka : 100 % » ; (c) les vérifications docker se faisaient sur une stack **déjà chaude** (topics créés, groupes formés) — or les bugs ① et ② ne se manifestent **que** sur Kafka vierge.

Aucune revue de code ne les aurait attrapés : ils sont dans l'**interaction avec un broker froid**, pas dans la logique. Le protocole `down -v` → `up --build` est ce qui les fait tomber, et c'est pour cela qu'il est **inscrit dans les critères d'acceptation** (AC-07→AC-09) plutôt que laissé à l'appréciation du développeur.

**Corollaire, appris en vérifiant cette story même** : une vérification docker ne prouve que ce qu'elle **discrimine**. AC-10 (« le process survit sans Kafka ») semblait prouver le bug ③ — l'ancien code le passe tout aussi bien. Un critère qu'un code bugué franchit n'est pas une preuve, c'est une **fausse assurance**. Pour le bug ③, seul le test unitaire **mutation-testé** tranche. D'où la règle appliquée ici : **chaque correctif doit être accompagné d'un test dont on a vérifié qu'il tombe quand on retire le correctif** — sans quoi on ne sait pas si le test teste quoi que ce soit.

---

## Progress Tracking

**Historique des statuts :**

- 2026-07-17 : **créée** (`/bmad:create-story`) — statut `defined`. Origine : dette actée à la clôture de STORY-076. ⚠️ Périmètre **réduit à la rédaction** de « auth-service + 4 services à vérifier » à « **auth-service seul** » : `grep -rl "KafkaBootstrap"` ne remonte que `auth-service` et `balance-service` — `expert-comptable` (que le cadrage de STORY-076 désignait explicitement) n'a **jamais eu** de `KafkaBootstrapService`. L'hypothèse du cadrage était fausse ; la note projet `kafka-round-trip-bugs-latents` est à corriger.

- 2026-07-17 : **implémentée** (branche `MNV-108`) — statut `review`.
- 2026-07-17 : **`/code-review high`** — 5 constats. **3 de documentation, tous corrigés** : (a) AC-10 ne prouve pas le bug ③ ; (b) AC-14 « la couverture doit monter » est faux ; (c) **sévérité du ③ à préciser** — `auth-service` porte un filet `installKafkaUnhandledRejectionGuard` (`main.ts`) que `balance-service` **n'a pas**, d'où le risque qu'un relecteur croie le bug déjà neutralisé ; il ne l'est pas (le filet ne ravale que les erreurs `KafkaJS*` et **re-lève** le reste ; le minuteur rejette un `Error` simple → re-levé → `uncaughtException` → arrêt). **2 assumés** : la connexion admin supplémentaire au boot (prix du correctif ①) et la couture de test `roundTripSettled` — tous deux imposés par l'alignement AC-06 sur `balance-service` ; diverger coûterait plus que le gain.
- 2026-07-17 : **livrée** — PR #5 `auth-service` (`MNV-108` → `dev`, *Rebase and merge*, branche supprimée) + PR #3 `docs` (→ `main`). Statut `done`.

**Vérification docker réelle — 2026-07-17, stack repartie de ZÉRO (`down -v` → `up --build`)**

**① Contrôle « AVANT » (le point qui compte) — ancien code, Kafka VIERGE.** Plutôt que de faire confiance aux notes de STORY-076, le bug a été **reproduit sur cette machine** : `git stash` du correctif → `down -v` → boot. Résultat, exactement le bug annoncé :
```
error: "This server does not host this topic-partition"  (kafkajs, Metadata v6)
msg:   "Échec du round-trip Kafka de démarrage : This server does not host this topic-partition"
```
**② « APRÈS » — correctif, Kafka VIERGE** (vérifié **2 fois**, deux `down -v` successifs) :
```
msg: "Kafka round-trip OK (topic « prospera.health.auth-service », groupe « auth-service-health »)."
```

| AC | Résultat |
|---|---|
| **AC-07** | ✅ `Kafka round-trip OK` au **1er** boot sur Kafka vierge, **aucune** erreur `topic-partition` (le contrôle ① prouve que l'ancien code échoue au même endroit) |
| **AC-08** | ✅ topic `prospera.health.auth-service` présent après le 1er boot (`kafka-topics --list`) |
| **AC-09** | ✅ `healthy` **sans boucle d'`unhealthy`** ; `:3001/api/v1/health` → **200** `{mongodb:up, redis:up, kafka:up}` ; **8/8 services healthy simultanément** |
| **AC-10** | ✅ stack **sans Kafka** : PID **inchangé** après **75 s** (> délai 45 s), `Running: true`, `RestartCount: 0`, aucune `unhandledRejection` ; `/health` → 503 `kafka: down` (HTTP up, santé dégradée = invariant 4). ⚠️ **Ne discrimine pas** — cf. ci-dessous |
| **AC-11** | ✅ par **mutation** (docker écarté, cf. ci-dessous) : ① `createTopics` après le `send` → seul « crée le topic … AVANT de produire » tombe ; ② hook renvoyant la promesse → seul « rend la main immédiatement » tombe ; ③ `cancel()` + gestionnaire retirés → seul « ne laisse ni minuteur armé ni promesse orpheline » tombe. **Chaque test garde bien son correctif.** |
| **AC-12** | ✅ non-régression identité : `register` → 201 (`organizationId`/`userId`) ; `login` → JWT **RS256** (`alg:RS256`, `kid` présent) ; jeton **accepté par un service aval** (`balance-service :3007/whoami` → **200**) ; `identity.user.registered` **réellement publié dans Kafka** (payload consommé : `userId` et `email` correspondent à l'inscription) ; `outbox_events` → **3 × `SENT`** (relais OK) |
| **AC-13** | ✅ `/health` → **200** sur les **8** services (`:3000 :3001 :3002 :3003 :3004 :3006 :3007 :3010`) |
| **AC-14** | ✅ lint **0 warning** · build OK · **390 unit** (48 suites) + **56 e2e** (6 suites) verts · couverture **96,72 / 87,36 / 98,13 / 96,75** > seuils 90/65/90/90. ⚠️ Fichier **exclu** de la couverture (cf. AC-14 corrigé + Q3) |

> ⚠️ **Deux critères de cette story se sont révélés faux, et ont été corrigés plutôt que cochés** :
> 1. **AC-10 ne prouve pas le bug ③.** Mesuré : l'**ancien code passe aussi** ce test (PID inchangé, `RestartCount: 0` après 70 s sans Kafka). Cause structurelle : sans broker, `consumer.connect()` échoue **avant** que le minuteur soit armé — le bug ③ ne peut pas se déclencher. AC-10 garde l'invariant 4, mais **ne discrimine pas** ; la preuve du ③ est le test mutation-testé (AC-11).
> 2. **AC-14 « la couverture doit monter » est faux.** `kafka-bootstrap.service.ts` est exclu par `collectCoverageFrom` (`!**/*bootstrap*.ts`) — dans **tous** les services vérifiés, `balance-service` compris. Les tests tournent et attrapent les bugs ; ils ne pèsent pas dans la métrique. **Seconde cause racine** de la story → Q3.

**AC-01→AC-06 (code) :** ✅ — `diff auth-service ↔ balance-service` sur `kafka-bootstrap.service.ts` **ne porte plus que sur le nom du service et les références de story** (AC-06 tenu).

**Effort réel :** 3 points (conforme à l'estimation)

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning)**
