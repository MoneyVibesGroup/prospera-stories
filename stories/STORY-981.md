# STORY-981 : `prospera-assurance-service` sur le socle du moteur

Status: done

**Complexité :** moyenne (migration du bus et de Node, un interrupteur par organisation)

**Épic :** EPIC-201 (le socle technique : services, migrations et protection des données)
**Dépôt :** `MoneyVibesGroup/prospera-assurance-service` (existant, tenu par C)
**Plage :** groupe C, n° 2 du lot de C (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §5).

---

## Pourquoi

La spine assurance (AD-3, Stack) a mesuré le 2026-11-13 que `prospera-assurance-service` tourne sur `node:20-slim` (fin
de vie) et `kafkajs` 2.2.4, hors de la pile du moteur. Elle impose sa migration **par une tâche d'épic qui précède**
toute nouvelle fonction du module `assurance` (projection des contrats, provisions dossier par dossier, PSAP). Elle
impose aussi l'interrupteur **`compta-cima`** : la comptabilité CIMA existante (registre art. 415, provisions
techniques, réassurance comptable, état des sinistres) est **éteinte** chez la compagnie, qui la tient ailleurs ;
« éteinte, ses routes dorment comme un module non activé » (manifeste `assurance`).

## Ce qui doit être vrai à la fin (plan §5, n° 2)

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Node 24** : `engines.node: 24.x`, toutes les images `node:24-slim` ; stage `verification` du `Dockerfile` | test d'invariant de la pile |
| AC-2 | **`kafkajs` remplacé par `@confluentinc/kafka-javascript` 1.11** : client, producteur (interface `send(topic, messages)` inchangée), relais d'outbox, quatre consommateurs, santé ; aucun `kafkajs` dans les dépendances | test d'invariant ; suites existantes vertes |
| AC-3 | **La supervision des consommateurs tient sur le client de Confluent** : relance d'un démarrage en échec avec recul ; « hors groupe » tant que le consommateur ne tourne pas ; « bloqué » après N échecs consécutifs d'un message sur une partition, levé au premier succès ou quand la partition n'est plus assignée | unitaires de la supervision ; `/health` |
| AC-4 | **Interrupteur `compta-cima`**, par organisation, **éteint par défaut** : avec l'interrupteur éteint, toute route de la comptabilité CIMA existante est refusée **403 `COMPTA_CIMA_ETEINTE`**, sans donnée ; allumé, elle répond comme avant | e2e éteint et allumé, sur chaque contrôleur comptable |
| AC-5 | Chaque route gardée par `assurance` dit si elle relève de la comptabilité CIMA : un contrôleur gardé qui ne le déclare pas fait échouer la suite (seul `whoami`, diagnostic du socle, est déclaré hors comptabilité) | test d'invariant + mutation |
| AC-6 | Le code existant ne s'abonne à **aucun fait d'AD-16** (catalogue des faits de l'assurance) : la liste d'abonnements est fermée | test d'invariant |
| AC-7 | **Suites existantes vertes** sous Node 24, lint 0, build ; **`docker compose up` du service healthy** sur la pile du moteur | sorties ; compose |

## Décisions retenues par défaut (contestables)

- **D-981-1 — D'où vient la position de l'interrupteur.** Le contrat d'état publié figé par B (STORY-932) porte
  `modules[].interrupteurs[] = { code, allume, dateLimite? }`, « un nom absent se lit éteint » ; mais la route arrive
  avec STORY-936 et la garde partagée avec STORY-937. En attendant, la position se lit dans la **configuration du droit
  `assurance`** (`entitlement.changed`, champ `config`, déjà projeté par le service), **sous la même forme** :
  `config.interrupteurs: [{ "code": "compta-cima", "allume": true }]`. Absent, mal formé ou `allume` non booléen vrai :
  **éteint**. La lecture passe par une fonction unique ; la bascule sur l'état publié ne changera qu'elle.
- **D-981-2 — Le refus.** **403 `COMPTA_CIMA_ETEINTE`**, sans donnée, dans le gate `assurance`, **après** le droit
  (e-mail, KYC, droit `ACTIVE`) et **avant** la lecture seule et le référentiel : une organisation sans le module
  apprend qu'elle n'a pas le module, pas que la comptabilité est éteinte ; une organisation qui a le module et pas la
  comptabilité l'apprend nommément. Code distinct de `ASSURANCE_NOT_ENTITLED` parce que le geste n'est pas le même
  (allumer un interrupteur, pas souscrire).
- **D-981-3 — Le périmètre.** Les sept contrôleurs existants (contrats, provisions, provisions techniques, réassurance,
  état C10b, registre des sinistres, référentiel du dossier) relèvent de la comptabilité CIMA (spine, Structural Seed).
  `whoami` (diagnostic) n'en relève pas. Une route ajoutée plus tard au module `assurance` doit se déclarer.
- **D-981-4 — « Bloqué » sans événement de crash.** Le client de Confluent ne lève pas `CRASH` ni `GROUP_JOIN` :
  un `eachMessage` qui lève est journalisé et le message est **relu** (lu dans `lib/kafkajs/_consumer.js`). Un groupe
  est donc « bloqué » quand un message de la même partition échoue N fois de suite (défaut 3) ; un succès sur la
  partition, ou sa sortie de l'assignation (`consumer.assignment()`), lève le blocage. « Hors groupe » = le
  consommateur n'est pas lancé (démarrage en échec, en relance).
- **D-981-5 — BullMQ.** L'épic écrit « BullMQ vers 6 » ; ce service n'utilise ni BullMQ ni Redis. Rien à migrer.
- **D-981-6 — Les cabinets.** Aucun appelant ne sert aujourd'hui la comptabilité CIMA (ni recette, ni front, ni pile
  racine, mesuré le 2026-11-15). Le défaut « éteint » ne casse donc personne ; un cabinet qui la tiendra l'allume par
  la configuration de son droit.

## Contexte pour le développeur

- **Patron de la migration** : STORY-930 (`platform-catalog-service`) et STORY-980 (`prospera-sinistres-service`) :
  `new KafkaJS.Kafka({ kafkaJS: { clientId, brokers } })`, `fromBeginning` dans la configuration du consommateur
  (pas dans `subscribe`), `admin.listTopics()` pour la santé (`describeCluster` n'existe pas).
- **À préserver** : le format sur le fil (même JSON, même clé, en-tête `eventId`) du relais d'outbox ; l'interface du
  producteur ; l'ordre de la chaîne de gardes (sept maillons) ; la lecture seule de STORY-727 ; les quatre
  consommateurs (`dossier.*`, `dossier.exercice.*`, `entitlement.changed`, `kyc.status.changed`) et leur idempotence.
- **Pièges** : barrels de l'éditeur ; tests du client Confluent sous Node 24 dans Docker ; fins de ligne (le dépôt est
  en `autocrlf=true` sur ce poste : comparer `--stat` et `--stat --ignore-cr-at-eol`).

## Ce qui a été livré

**PR :** `prospera-assurance-service` #20, fusionnée sur `dev` le 2026-11-15 (`8ccaa35`, `9e42ecd`, `c813294`).
Réglage du dépôt : « Rebase and merge » seul (les commits de fusion y étaient encore permis).

| AC | Livré | Preuve |
|:--:|---|---|
| AC-1 | `engines.node: 24.x`, `node:24-slim` partout, stage `verification` (le `.dockerignore` ne retire plus `test/` ni le `Dockerfile`) | `pile-du-moteur.invariant.spec.ts` |
| AC-2 | `@confluentinc/kafka-javascript` `~1.11.0` : client (`kafkaJS: { clientId, brokers }`), producteur (`send(topic, messages)` inchangé), quatre consommateurs, santé par `listTopics` ; `kafkajs` retiré du lockfile | invariant ; mutation `kafkajs` réintroduit ⇒ rouge |
| AC-3 | `SupervisionConsommateur` réécrite (D-981-4) : consommateur neuf à chaque tentative, recul 1 s → 30 s, « bloqué » au 3ᵉ échec consécutif d'un message sur une partition, levé au premier succès ou quand la partition sort de `consumer.assignment()` (une assignation vide n'efface rien) | 24 unitaires ; mutation « ne bloque jamais » ⇒ 7 rouges |
| AC-4 | `@RelevantDeComptaCima()` sur les sept contrôleurs comptables ; étape ③bis du gate : **403 `COMPTA_CIMA_ETEINTE`** ; position lue par `interrupteurAllume(config, 'compta-cima')` (D-981-1) | e2e : chaque route GET comptable **découverte sur l'application montée** rend 403 éteint ; `whoami` reste servi ; allumé, le référentiel répond 200 ; sans le module, `ASSURANCE_NOT_ENTITLED` d'abord |
| AC-5 | `compta-cima.invariant.spec.ts` : les huit contrôleurs gardés lus dans le graphe réel d'`AppModule`, chacun déclare sa marque ; seul `whoami` est `@HorsComptaCima()` | mutation (marque et import retirés, compile) ⇒ invariant et e2e rouges |
| AC-6 | liste d'abonnements fermée : aucun topic en `@`, aucun producteur de la chaîne des sinistres, seulement `dossier.*`, `entitlement.changed`, `kyc.status.changed` | mutation (abonnement à `sinistres.dossier.changed@1`) ⇒ rouge |
| AC-7 | sous Node 24.22, depuis un export LF : **2 197 unitaires**, **347 e2e**, lint 0, build ; couverture 99,5 % lignes, 94,3 % branches. `docker compose --profile assurance up --build` (fichier ajouté au dépôt : socle MongoDB 8.0 + Kafka sans profil) ⇒ **healthy**, quatre consommateurs lancés | sorties ; compose |

**Sur la vraie pile :** un `entitlement.changed` publié dans Kafka (`config.interrupteurs` = `compta-cima` allumé)
arrive par le client de Confluent dans `org_assurance_entitlement`, interrupteur compris (≈ 4 min 30 de découverte du
topic sur une pile neuve). Pile descendue avec ses volumes.

**Mutations (6, toutes rouges, toutes compilent) :** marque retirée de la réassurance ; gate qui ignore l'interrupteur ;
nom absent lu « allumé » ; `kafkajs` réintroduit ; supervision qui ne bloque jamais ; abonnement à un fait d'AD-16. Deux
premières mutations ont rougi par **erreur de compilation** (import ou variable devenus inutilisés) : rejouées pour que
le rouge vienne du test.

**Ce qui reste, et où :**
- **La bascule sur l'état publié** (position des interrupteurs et état du module) : avec la garde partagée (STORY-937).
- **Les fonctions neuves du module `assurance`** (projection des contrats, provisions dossier par dossier, PSAP) :
  EPIC-215, chacune marquée `@HorsComptaCima()`.
- **Le manifeste `assurance`** n'est pas encore copié dans le dépôt (`src/module.manifest.ts`) : il le sera avec la
  première fonction neuve du module.
