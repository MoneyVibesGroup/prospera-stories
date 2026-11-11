# Relecture des versions et de la réalité technique (2026-11-11)

Méthode : `npm view`, API GitHub releases, endoflife.date, recherche web, comparaison avec `platform-catalog-service/package.json`, `auth-service/package.json`, `docker-compose.yml`.
Légende : V = vérifié par commande ou source ; P = partiel (source secondaire) ; N = non confirmé.

## Verdict

Les numéros du tableau Stack sont exacts, mais sept points sont à corriger : écarts avec le socle réel (Node, BullMQ, Redis/Kafka non listés), fin de vie proche de MongoDB 7.0, kafkajs non maintenu, pilotage de Compose par dockerode, sémantique de cosign v3 (`--offline` déprécié), chaîne de clés racine -> clés annuelles que cosign par clé ne porte pas, et horloge/compteur TPM (`TPM2_Clear`).

## Tableau Stack

| Ligne | Spine | Constat | État |
|---|---|---|---|
| Node.js | 24.x LTS | Node 24 est LTS (depuis 28/10/2025), fin de vie 30/04/2028. Mais Node 26 est devenu LTS le 28/10/2026 (26.13.0) et le support actif de la 24 s'est achevé le 20/10/2026 (maintenance seule). Le projet réel tourne sur `node:20-slim` (Dockerfile catalog, lignes 5 et 17) avec `@types/node ^22` : Node 20 est en fin de vie. « 24.x » est plus récent que le socle ; l'écart n'est écrit nulle part. | V |
| NestJS | 11.x | `@nestjs/core` dernier = 12.4.2 ; le projet est en `^11.0.1`. « Suivre le socle » est cohérent et daté dans le memlog. | V |
| Mongoose | 8.x | Dernier = 9.12.1 ; projet `^8.24.1`. Cohérent. | V |
| MongoDB | 7.x | Le projet utilise `mongo:7` (docker-compose lignes 1171, 1229, 1322) avec `--replSet rs0` à un nœud. MongoDB 7.0 : fin de vie 31/08/2027, dernière 7.0.45. Courantes : 8.0 (EOL 31/10/2029, 8.0.34) et 9.0 (30/09/2026, 9.0.4). Supporté en novembre 2026, mais à moins de 10 mois de sa fin de vie quand le premier client sur site est installé ; le spine ne le dit pas. | V |
| kafkajs | 2.2.x | Dernière publication le 27/02/2023 (2.2.4) ; dépôt sans commit depuis 08/2024 (non archivé) : de fait non maintenu. Alternative : `@confluentinc/kafka-javascript` 1.11.0 (07/10/2026, active). Le projet utilise kafkajs `^2.2.4` (catalog, auth) : l'aligner est cohérent, mais c'est une dette connue à nommer. | V |
| BullMQ | 6.7.x | 6.7.3 = dernière (10/11/2026). Le projet est en `bullmq ^5.79.2` (auth-service) avec `@nestjs/bullmq ^11` ; catalog n'a pas encore BullMQ. Le spine suppose une montée de majeure 5 -> 6 non mentionnée dans les reports. | V |
| jose | 6.2.x | 6.2.17 = dernière. Ed25519 / EdDSA supporté en JWS d'après la documentation de jose ; pas rejoué par un test. | P |
| dockerode | 5.0.x | 5.0.1, dernier commit 27/10/2026, maintenu. Voir point 1. | V |
| Docker Compose | 5.7.x | v5.7.0 (02/11/2026) confirmé par l'API GitHub. | V |
| cosign | 3.1.x | v3.1.4 (20/10/2026) confirmé. Voir point 2. | V |
| tpm2-tools | 5.8 | 5.8 (15/07/2026) confirmé. | V |
| Traefik | 3.7.x | v3.7.18 (10/11/2026) ; branche 3.7 supportée, la 3.6 est en fin de vie depuis 16/08/2026. | V |
| Redis, Kafka, MinIO | non listés | Le projet utilise `redis:7-alpine`, `apache/kafka:3.9.0`, `minio/minio` (sans tag). Le tableau ne les liste pas alors qu'ils sont dans le socle (C10). | V |

## Points détaillés

### 1. dockerode et Docker Compose (correction)
dockerode parle à l'API du moteur Docker (conteneurs, images, réseaux, volumes). Compose n'est pas dans l'API du moteur : `docker compose up/down -p <projet> --profile ...` est une fonction du binaire/plugin Compose. Le diagramme dit « docker compose : promouvoir, revenir » mais le tableau Stack laisse croire que dockerode pilote Compose. Il faut trancher : soit l'agent appelle le binaire `docker compose` (sous-processus, version figée dans l'image de l'agent, sortie `--format json`), soit il refait la réconciliation via dockerode et Compose ne sert qu'au montage initial. Recommandation : binaire Compose pour projets et profils, dockerode pour l'inspection (santé, empreintes d'images, journaux). N : aucune source ne documente un pilotage de Compose par dockerode.

### 2. cosign v3 (correction)
- La v3 signe par défaut au nouveau format de bundle protobuf (`.sigstore.json`) et sait encore vérifier l'ancien format.
- `--offline` est déprécié en v3 (notes de version 3.0.3 : « Deprecate offline flag (#4457) »). La vérification hors ligne passe par le bundle conservé à côté de l'artefact. Le spine ne cite pas `--offline` ; à ne pas l'écrire.
- `--insecure-ignore-tlog` existe toujours sur `verify` et `verify-blob` ; c'est le réglage pour des signatures par clé jamais envoyées à Rekor. Signer avec `--tlog-upload=false` et conserver le bundle. `cosign sign-blob` / `verify-blob --key ... --bundle ... --insecure-ignore-tlog` : correct en v3. `--use-signing-config` est déprécié en 3.1.
- Impossible avec cosign par clé : la « chaîne de clés » du spine (racine hors ligne certifiant des clés de signature annuelles) n'existe pas dans `--key` (une clé publique, pas de chaîne). Soit la certification est du code maison (JWS de la racine sur la clé de signature, vérifié par l'agent avant d'appeler cosign), soit `--certificate` avec une CA privée. À écrire dans AD-7.
- N : cosign n'a pas été exécuté ; sources = documentation et notes de version.

### 3. MongoDB et l'incrément horaire
- L'oplog n'existe que sur un membre de jeu de réplicas ; un mongod autonome n'en a pas. Un jeu de réplicas à un nœud a un oplog et permet la reprise à un instant (rejeu d'oplog, `mongorestore --oplogReplay`, ou PBM). Le projet monte déjà `rs0` à un nœud en développement (docker-compose ligne 1172). Les sources trouvées sont la documentation Percona et des billets ; la page du manuel MongoDB nommant ce montage « supporté en production » n'a pas été relevée : P.
- Le choix de l'outil reste ouvert (liste des reports) ; PBM fait la tranche d'oplog continue.
- La taille de l'oplog (`replSetResizeOplog`) borne la fenêtre : à dimensionner pour 1 h de RPO plus une marge si l'agent est arrêté.

### 4. TPM : compteur NV, horloge
- `tpm2_nvdefine` avec attribut `nt=counter` (type 1) et `tpm2_nvincrement` : confirmés par les pages de manuel tpm2-tools. Un compteur ne fait qu'augmenter, et un compteur recréé repart de la valeur maximale atteinte par tout compteur du TPM. V/P.
- `tpm2_readclock` renvoie `time`, `clock`, `reset_count`, `restart_count`, `safe`. `clock` est une durée sous tension en ms ; elle est remise à zéro par `TPM2_Clear` et peut être avancée (`TPM2_ClockSet`) par le propriétaire de la hiérarchie. Le texte normatif de la spec TPM 2.0 (partie 2, TPMS_CLOCK_INFO) n'a pas été relevé ; le code de référence confirme que seul le temps de plateforme sous tension s'ajoute (P). La phrase du spine « l'horloge du TPM mesure le temps machine allumée » est donc correcte, mais insuffisante : un `TPM2_Clear` (faisable depuis l'UEFI par l'administrateur) remet à zéro la valeur `clock` ; l'agent doit lire `reset_count`, `restart_count`, `safe` et traiter cela comme une anomalie. Ce vecteur n'est pas dans AD-4.

### 5. TPM physique sur serveurs x86 depuis 2018, vTPM
- HPE : option « Trusted Platform Module 2.0 Gen10 » (864279-B21), vendue séparément, Gen10 en UEFI ; kit distinct pour Gen10 Plus. Un TPM 2.0 n'est donc pas toujours monté d'origine. Dell (14G et plus) et Lenovo ThinkSystem : aucune source officielle trouvée (seulement un revendeur) : N. À vérifier sur les fiches constructeur avant d'écrire « courant ». Le spine n'affirme rien et prévoit le niveau `LOGICIEL` : cohérent, mais ce niveau pourrait être fréquent.
- vTPM et instantané : vSphere (le retour à un instantané restaure mémoire, réglages et disques) et Proxmox (swtpm, volume `tpmstate` suit les instantanés, correctifs publiés) : les documents consultés ne disent pas en une phrase que le vTPM est ramené en arrière, donc P. L'hypothèse du spine (un vTPM ne compte jamais comme ancre) est prudente et bonne, car une copie ou un clone de VM duplique de toute façon l'état. Le memlog écrit « vérifié » : trop fort.

### 6. Écarts avec le projet réel
| Sujet | Spine | Projet |
|---|---|---|
| Node | 24.x | 20 (Dockerfile), types 22 |
| BullMQ | 6.7.x | ^5.79.2 (auth) |
| MongoDB | 7.x | mongo:7, rs0 à un nœud |
| Kafka | kafkajs 2.2.x | kafkajs ^2.2.4 ; broker apache/kafka:3.9.0 |
| Redis | non listé | redis:7-alpine |
| NestJS / Mongoose | 11 / 8 | ^11.0.1 / ^8.24.1 (identique) |

## Corrections demandées

1. Stack : ajouter Redis 7, Kafka 3.9 (broker), MinIO ; signaler que Node 24 et BullMQ 6 sont au-dessus du socle (Node 20, BullMQ 5) : migration à planifier ou revenir aux versions du socle.
2. MongoDB 7.0 : noter sa fin de vie 31/08/2027 et décider de 8.0 (EOL 2029) pour l'instance sur site.
3. kafkajs : écrire « non maintenu depuis 2023 ; remplaçable par `@confluentinc/kafka-javascript` » dans les risques ou reports.
4. dockerode vs Compose : préciser que l'agent appelle le binaire `docker compose` (v5.7) ; dockerode seulement pour l'inspection.
5. AD-7 : pas de `--offline` ; vérification par bundle + `--key` + `--insecure-ignore-tlog` ; signature avec `--tlog-upload=false` ; la chaîne racine -> clés annuelles est du code de l'agent, pas une fonction de cosign par clé.
6. AD-4 : ajouter `TPM2_Clear` (remise à zéro de l'horloge) comme anomalie détectée via `reset_count`, `restart_count`, `safe`.
7. Ne pas écrire qu'un TPM 2.0 physique est courant sans source Dell/Lenovo ; HPE le vend en option.

## Sources

- https://endoflife.date/api/mongodb.json ; https://endoflife.date/api/nodejs.json ; https://endoflife.date/api/traefik.json
- https://api.github.com/repos/sigstore/cosign/releases/latest ; https://api.github.com/repos/docker/compose/releases/latest ; https://api.github.com/repos/traefik/traefik/releases/latest ; https://api.github.com/repos/tpm2-software/tpm2-tools/releases/latest ; https://api.github.com/repos/tulios/kafkajs ; https://api.github.com/repos/apocas/dockerode
- npm : `npm view` sur kafkajs, @confluentinc/kafka-javascript, bullmq, jose, dockerode, @nestjs/core, mongoose, mongodb
- https://blog.sigstore.dev/cosign-3-0-available/ ; https://docs.sigstore.dev/cosign/verifying/verify/ ; https://newreleases.io/project/github/sigstore/cosign/release/v3.0.3 ; https://goreleaser.com/blog/cosign-v3/
- https://tpm2-tools.readthedocs.io/en/stable/man/tpm2_readclock.1/ ; https://tpm2-tools.readthedocs.io/en/stable/man/tpm2_nvincrement.1/ ; https://link.springer.com/chapter/10.1007/978-1-4302-6584-9_11
- https://docs.percona.com/percona-backup-mongodb/features/point-in-time-recovery/ ; https://www.percona.com/blog/mongodb-pit-backups-in-depth/
- https://knowledge.broadcom.com/external/article/342618/understanding-virtual-machine-snapshots.html ; https://forum.proxmox.com/threads/cant-rollback-snapshot-vm-with-tpm-feature.103593 ; https://lore.proxmox.com/all/20211014092849.2397997-2-s.reiter@proxmox.com/t
- https://www.hpe.com/us/en/collaterals/collateral.c04939549.html ; https://community.hpe.com/t5/servers-general/dl380-gen10-cto-build-tpm-2-0-module/m-p/7103951
- Projet : C:\Users\thier\Documents\MoneyVibes_Apps\platform-catalog-service\package.json, auth-service\package.json, docker-compose.yml, platform-catalog-service\Dockerfile
