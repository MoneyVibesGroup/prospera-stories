# Revue des versions et de l'adéquation des outils — spine Distributeur

Date de la revue : 2026-11-13. Méthode : registres officiels (npm, pub.dev, storage.googleapis.com/flutter_infra_release, nodejs.org/dist, endoflife.date, API GitHub) et pages de documentation ; code réel de `prospera-paiement-service` et `prospera-notification-service` (package.json + node_modules installés).

## Verdict

**À CORRIGER avant fusion (5 points majeurs, aucun bloquant d'architecture).** Les décisions d'architecture tiennent ; ce sont des affirmations de version périmées ou fausses, dont deux sont des erreurs de fait : Flutter 3.50 est déjà stable (le 2026-11-11), et `openapi_generator` n'est plus à 6.1.0 (7.0.0, mai 2026). Le chiffrement de la base locale (« SQLCipher ») est obsolète : drift 2.32+ passe par sqlite3mc. NestJS 12 et Mongoose 9 existent déjà : le choix « 11 / 8 » est défendable (hérité, et le code réel est en 11/8) mais doit être écrit comme un choix, pas comme « courant ».

## Tableau

| Outil | Version dans la spine | Version vérifiée (2026-11-13) | Source | Statut |
|---|---|---|---|---|
| Node.js | 24.x LTS | 24.22.3 (LTS Krypton, EOL 2028-04-30) ; 26.13.1 passée LTS le 2026-10-28 ; 22.23.5 EOL 2027-04-30 | nodejs.org/dist/index.json, endoflife.date/nodejs | OK (24 reste supporté). Note : Dockerfile de `paiement` en `node:20-slim` (EOL), `@types/node` ^22 : écart code/spine à traiter dans la tâche de migration |
| NestJS | 11.x | latest = 12.5.0 (12.0.0 le 2026-08-27) ; 11.2.10 en branche « legacy » encore patchée (2026-11-12), support actif 11 terminé le 2026-08-27 | npm @nestjs/core, endoflife.date/nestjs | À CORRIGER (formulation) : 11 n'est plus la version courante. Code réel : 11.2.3. Garder 11 pour février est acceptable mais écrire « 11.x, maintenance ; passage à 12 : tâche différée » |
| @nestjs/mongoose | non nommé | 12.0.1 (exige Nest 11 ou 12 et mongoose 7-9) ; 11.0.4 (code réel) exige Nest 10-11 | npm | OK, à épingler avec Nest |
| @nestjs/bullmq | non nommé | 12.0.2 (peer Nest 10-12, bullmq 3-6) ; code réel de `paiement` : 12.0.0 avec Nest 11 | npm | OK (compatible) |
| Mongoose | 8.x | latest = 9.12.1 (9.0.0 le 2025-11-21) ; 8.24.9 encore publiée (2026-11-12) ; code réel 8.24.4 | npm | À CORRIGER (formulation) : 8.x est maintenue mais n'est plus la ligne courante ; le dire |
| MongoDB | 8.0 (jeu de réplicas) | 8.0.38 (EOL 2029-10-31) ; 8.3.17 (rapid) ; 9.0.8 sorti 2026-09-30 | endoflife.date/mongodb | OK (transactions sur jeu de réplicas : exact) |
| BullMQ | 6.7.x | 6.7.6 ; code réel ^6.3.4 (installé 6.3.4) | npm | OK |
| Redis | 7.2+ | 8.10.3 courant ; 7.2.17 et 7.4.12 supportés jusqu'à 2029-12-01 ; **licences : 7.2 BSD, 7.4 RSALv2/SSPL, 8.x AGPLv3 en option** (l'API GitHub rend NOASSERTION pour le dépôt) | endoflife.date/redis, API GitHub | OK avec réserve : « 7.2+ » est ambigu sur la licence ; consigner 7.2 (BSD) ou 8.x (AGPLv3 acceptable pour un usage interne, à faire valider) ; ou Valkey. ioredis : code réel ^5.11.1, npm latest 6.0.0 : sans objet pour février |
| @confluentinc/kafka-javascript | 1.11.x | 1.11.0 (MIT, Node >=18), publié 2026-10 ; rc et alpha 1.10.1 existent | npm | OK |
| kafkajs (existant) | 2.2.4 (mesuré) | 2.2.4, **dernière publication 2023-02-27** (non maintenu) | npm | OK, la spine le dit déjà (migration par tâche d'épic) ; confirmer la raison : kafkajs est abandonné |
| Karapace | 6.2.x | 6.2.4 (2026-10-02), Apache-2.0 | API GitHub Aiven-Open/karapace | OK |
| Flutter | 3.47 stable, « 3.50 au calendrier de novembre, non confirmée » | **3.50.0 stable depuis 2026-11-11 (Dart 3.14.0)** ; 3.47.9 (Dart 3.13.7) le 2026-10-29 | releases_linux.json (flutter_infra_release) | **À CORRIGER** |
| Dart | non nommé | 3.14.0 (avec Flutter 3.50) ; 3.13.7 (avec 3.47) | idem | À AJOUTER |
| drift | 2.35.1 | 2.35.4 (2026-11-08) ; exige Dart >=3.10 | pub.dev, GitHub simolus3/drift | À CORRIGER (mineur) |
| drift_flutter | « à vérifier » | 0.3.1 (2026-07-11) ; dépend de `sqlite3 ^3.0.0` ; `sqlite3_flutter_libs` et `sqlcipher_flutter_libs` sont en `+eol` | pub.dev | À CORRIGER (statut résolu) |
| Chiffrement de la base locale | « SQLCipher ou équivalent » (Deferred) | `sqlcipher_flutter_libs` obsolète depuis drift 2.32 ; voie actuelle : SQLite3MultipleCiphers (sqlite3mc) via les build hooks du paquet `sqlite3` (`hooks.user_defines.sqlite3.source: sqlite3mc`, `PRAGMA key` dans `setup`) | drift.simonbinder.eu/platforms/encryption | **À CORRIGER** |
| openapi_generator (pub.dev) | 6.1.0 (déc. 2024), « peu suivi » | **7.0.0 (2026-05-31)** ; enveloppe Dart autour du CLI Java | pub.dev | **À CORRIGER** (constat faux) |
| OpenAPI Generator CLI officiel | « OpenAPI Generator (cible Dart) », version à épingler | v7.27.0 (2026-11-02) ; npm `@openapitools/openapi-generator-cli` 2.42.2 (Apache-2.0) ; générateur `dart-dio` **STABLE** (sérialisation `built_value` par défaut ; `json_serializable` et `freezed` en BETA) | API GitHub, openapi-generator.tech/docs/generators/dart-dio | OK à retenir (voir recommandations) ; exige Java 11+ au build |
| swagger_parser | non nommé | 2.1.1 (2026-11-11), Dart ^3.13, dépôt actif (poussé le 2026-11-11, 307 étoiles) ; génère des clients Dio/Retrofit + modèles freezed/json_serializable depuis OpenAPI 2/3, sans Java | pub.dev, GitHub Carapacik/swagger_parser | Alternative viable (mainteneur unique) |
| dio / retrofit | non nommés | dio 5.11.1 ; retrofit 4.10.0 | pub.dev | À NOMMER (suit le générateur retenu) |
| FedaPay API | « adaptateur `fedapay` » | API sandbox `https://sandbox-api.fedapay.com`, live `https://api.fedapay.com` (constantes du code de `paiement`) ; webhook signé `X-FEDAPAY-SIGNATURE` (signature + horodatage, secret par endpoint et par mode) ; retries : 9 de plus sur backoff plafonné à 2 min, webhook désactivé après 10 échecs ; événements `transaction.approved/declined/canceled/transferred` | docs.fedapay.com (webhooks.md), `src/adapters/fedapay/api-fedapay.ts` | OK, adaptateur déjà codé en `fetch` natif |
| SDK Node `fedapay` | non nommé | 1.2.5 (ISC), dernière publication 2025-07-24 ; `paiement` ne l'utilise **pas** (choix commenté dans le code : le SDK se règle par état global, `setEnvironment`/`setApiKey`) | npm, docs.fedapay.com/fr/sdks/nodejs.md, code | OK : ne pas l'introduire (état global, multi-organisation incompatible) |
| Idempotence FedaPay | AD-4 / AD-17 : clé d'ordre | Aucune page de la doc ne documente un en-tête d'idempotence | docs.fedapay.com/llms.txt | NON VÉRIFIÉ : la doc n'en promet pas ; la déduplication reste côté `paiement` (comme le code) |
| PI-SPI (BCEAO) | adaptateur `API_BUSINESS` | Sandbox API Business : pispi.bceao.int (doc technique complète, nov. 2025) ; 24 interfaces API Business homologuées (2026-09-16) ; 175 participants connectés (2026-09-30) ; depuis 2026-11-02 les transactions de monnaie électronique interopérables UEMOA passent obligatoirement par PI-SPI | bceao.int communiqués, osiris.sn, launchbaseafrica.com | OK sur l'existence et le calendrier ; contenu de l'API non relu (hors périmètre de cette revue, déjà codé dans `paiement`) |
| Rendu PDF | « à épingler » | non évalué | n/a | NON VÉRIFIÉ (choix volontairement différé ; voir recommandation) |
| Google Maps (carte) | Deferred | non évalué (SDK Flutter `google_maps_flutter` à choisir) | n/a | NON VÉRIFIÉ (différé) |

## Contre le code réel

| Constat | Code | Spine |
|---|---|---|
| Nest | 11.2.3 installé (`^11.0.1`) | « 11.x » : cohérent |
| Mongoose | 8.24.4 (`^8.24.1`) | « 8.x » : cohérent |
| BullMQ | 6.3.4 (`^6.3.4`) | « 6.7.x » : le semver du code accepte 6.7.x, mais l'épinglage de la spine est plus haut que ce qui est installé |
| Kafka | `kafkajs ^2.2.4` dans les deux services | la spine le dit, exact |
| `@nestjs/bullmq` | présent dans `paiement` seulement (12.0.0) | non cité |
| Node | `Dockerfile` de `paiement` : `node:20-slim` ; `@types/node ^22` | spine : Node 24 : écart réel, ligne à ajouter à la tâche de migration (Node 20 est en fin de vie) |
| FedaPay | adaptateur codé, `fetch` natif, SDK absent | « adaptateur `fedapay` » : exact |

## Corrections proposées à la spine (section Stack)

1. Flutter : « 3.50.0 stable depuis le 2026-11-11 (Dart 3.14) ; 3.47.9 (Dart 3.13.7) reste patchée ». Choix à écrire : **partir de 3.50** (pas de version à migrer plus tard), épinglée à la première story terrain. Retirer « non confirmée » dans la spine, le `.memlog.md` (entrée `version`) et Q-8.
2. drift 2.35.4 ; `drift_flutter` 0.3.1 ; exiger Dart >=3.10 ; ne pas ajouter `sqlite3_flutter_libs` (EOL).
3. Chiffrement local : remplacer « SQLCipher ou équivalent » par « SQLite3MultipleCiphers via sqlite3 3.x (hooks), clé dans le stockage sécurisé » ; à valider par un test sur un Android à 2 Go (démarrage < 5 s, AD-14). Une base existante non chiffrée se migre par `VACUUM INTO` : sans objet pour un premier déploiement.
4. Générateur : voir recommandations ; corriger « openapi_generator 6.1.0 » en « 7.0.0 (mai 2026) ».
5. Nest/Mongoose : écrire « 11.x / 8.x retenus (lignes de maintenance ; courantes : 12.5 / 9.12) ; passage en 12 / 9 hors février, par tâche de migration unique pour tous les services ». Sinon, le « Stack » contredit le principe « versions courantes ».
6. Redis : préciser 7.2 (BSD) ou 8.x (AGPLv3), ou Valkey ; une licence, pas un « 7.2+ ».
7. Node : ajouter la ligne Dockerfile `node:20` à la migration.

## Recommandations

**Générateur OpenAPI pour Dart : retenir le CLI officiel OpenAPI Generator v7.27.x, générateur `dart-dio`, sérialisation `built_value` (défaut, STABLE).** Raisons : un seul outil pour tous les services (même `contrats/openapi/`), générateur déclaré stable, Apache-2.0, très actif (v7.27.0 le 2026-11-02), client Dio utilisable en file d'envoi (intercepteurs pour `Idempotency-Key`, `X-Client-Version`). Épingler la version du CLI (npm `@openapitools/openapi-generator-cli` 2.42.2 ou image Docker) et exécuter la génération dans le build, avec un test qui compare la sortie au contrat. Contreparties : Java 11+ au build ; `built_value` demande `build_runner` (génération plus lente) ; `json_serializable` et `freezed` y sont encore BETA : ne pas les choisir pour l'instant.

**Plan B : `swagger_parser` 2.1.1.** Actif (poussé le 2026-11-11), sans Java, sorties Dio/Retrofit avec `freezed` ou `json_serializable`. Risque : mainteneur unique, moins éprouvé sur des contrats volumineux (cinq services). À tenter seulement si le build Java pose problème.

**Ne pas retenir le paquet pub.dev `openapi_generator`** comme dépendance centrale : c'est un enveloppe autour du même CLI, utile seulement pour lancer la génération depuis `build_runner` ; il n'apporte rien si le CLI est épinglé dans le script de build.

**Premier jour de la story terrain** : faire un spike d'une demi-journée, un seul endpoint de synchronisation généré avec `dart-dio`/`built_value`, pour mesurer la taille de l'APK, le temps de `build_runner` et la gestion de `oneOf` (les faits à plusieurs formes sont le point faible habituel de ces générateurs).

**PDF** : trancher à la story de pointe de `facturation` ; critères à noter dès maintenant : rendu serveur Node déterministe (même PDF pour même facture, hachage conservé), polices embarquées, conservation 10 ans. Ne pas choisir un moteur à navigateur sans tête sans mesure de mémoire sur l'hôte central.

**FedaPay** : conserver `fetch` natif, ne pas introduire le paquet `fedapay` ; documenter dans la spine que la déduplication des ordres est faite par `paiement` (aucune garantie d'idempotence côté FedaPay trouvée), et que le webhook doit être vérifié via `X-FEDAPAY-SIGNATURE` avec secret par mode (test/réel), cohérent avec AD-17 « un essai n'encaisse jamais un paiement réel ».

## Non vérifié

Idempotence FedaPay ; contenu détaillé de l'API PI-SPI Business (documentation sur pispi.bceao.int, non relue ici) ; moteur PDF et SDK de carte (choix différés par la spine) ; mesure réelle de démarrage de drift + sqlite3mc sur Android 2 Go.

## Sources

- npm : registry.npmjs.org (@nestjs/core, mongoose, bullmq, ioredis, @confluentinc/kafka-javascript, kafkajs, fedapay, @openapitools/openapi-generator-cli, @nestjs/mongoose, @nestjs/bullmq)
- pub.dev API : drift, drift_flutter, openapi_generator, swagger_parser, dio, retrofit, sqlite3_flutter_libs, sqlcipher_flutter_libs
- storage.googleapis.com/flutter_infra_release/releases/releases_linux.json
- nodejs.org/dist/index.json ; endoflife.date (nodejs, mongodb, redis, nestjs)
- github.com : Aiven-Open/karapace, OpenAPITools/openapi-generator, simolus3/drift, Carapacik/swagger_parser, redis/redis
- openapi-generator.tech/docs/generators/dart-dio ; drift.simonbinder.eu/platforms/encryption
- docs.fedapay.com (llms.txt, sdks/nodejs.md, integration-api/webhooks.md)
- bceao.int (communiqués PI-SPI 2025-2026), osiris.sn, launchbaseafrica.com
- Code : prospera-paiement-service et prospera-notification-service (package.json, node_modules, Dockerfile, src/adapters/fedapay/api-fedapay.ts)
