# Revue « versions et ancrage dans le réel »

Lentille imposée par `finalize_reviewers` : chaque décision engagée a-t-elle été vérifiée contre le web,
le dépôt ou le starter courant — ou affirmée de mémoire ?

## Vérifié, avec sa source

| Élément engagé | Statut | Source de la vérification |
| --- | --- | --- |
| NestJS 11, Mongoose 8.24, kafkajs 2.2.4, TypeScript 5.7, `nestjs-cls` 6.2, `nestjs-pino` 4.6, helmet 8, throttler 6.5, Swagger 11, Terminus 11, class-validator 0.14, Jest 29 | ✅ | `balance-service/package.json` lu directement |
| MongoDB **7**, en **réplica set `rs0`** | ✅ | `docker-compose.yml` : `image: mongo:7`, `command: ['mongod','--replSet','rs0','--bind_ip_all']` + initiation `rs.initiate` |
| Redis 7-alpine, MinIO | ✅ | `docker-compose.yml` |
| Rôle MongoDB restreint à `{db, collection}` avec actions `find`/`insert`/`update`/`remove` | ✅ | Recherche web — documentation MongoDB (rôles intégrés / rôles personnalisés). C'est bien une contrainte serveur, pas une convention applicative |
| Port `:3012` libre | ✅ | `docker-compose.yml` (3000-3004, 3006, 3007, 3010 pris) croisé avec les réservations documentées : `:3005` paiement-service, `:3011` assistant-service |
| Patron de gate `@RequiresBilanAccess` | ✅ | `architecture-bilan-service-2026-07-07.md` §Gate d'accès, lu |
| Schéma `ReferentielVersion` (code, version, artifactUri, checksum, index unique code+version) | ✅ | `architecture-catalog-service-2026-07-07.md`, lu |
| Outbox transactionnelle | ✅ | STORY-099 dans `sprint-status.yaml` |
| Finding F-078-1 invoqué à l'appui de AD-6 | ✅ | `sprint-status.yaml`, entrée STORY-078 |

## Constats

- **medium — Redis/BullMQ est cité comme contrainte héritée mais absent de la pile engagée.** Or le
  calendrier implique du travail récurrent (cf. S6 de la revue adverse). Soit la file entre dans la pile
  et un AD la gouverne, soit elle sort des contraintes héritées. Un composant à moitié présent est le
  pire des deux.
- **low — Kafka n'est pas épinglé en version.** Le client `kafkajs` l'est ; le courtier ne l'est pas dans
  la table. Il est hérité de l'écosystème, donc légitimement hors de cette colonne — à condition de ne
  pas le nommer comme s'il l'était.
- **info — aucune version n'a été affirmée de mémoire.** Toutes proviennent du dépôt ou du web. Le seul
  point qui l'avait été au brouillon — « MongoDB 7 » — a été vérifié avant publication, et se trouve
  exact.
