# STORY-570 : Scaffold du service sur :3008, socle transverse et point de santé

Status: ready-for-dev

**Épic :** EPIC-054 — Socle `notification-service`, carnet de contacts et cloisonnement
**Service :** `notification-service` (nouveau)
**Points :** 3 · **Sprint :** S41
**Prérequis :** **aucun dans le service** · ⛔ hors service : câblage racine (voir Notes)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AR-01, AR-02, AR-16, AR-17.

---

## Le fait

Le service n'existe pas : zéro ligne de code au 2026-09-03. Le port `:3008` est **libre** au
`docker-compose` racine (vérifié le même jour ; `:3009` est pris par `dossier-service` depuis le
2026-08-13).

⛔ **Pas de starter, pas de greenfield isolé.** La spine a été ratifiée **depuis le code du dépôt**
le 2026-08-04 : on aligne sur le moule des services en place, `balance-service` étant la référence la
plus récente. Aucune stack à inventer.

⚡ **L'état de santé est à deux niveaux dès cette story**, et pas à la première passerelle. « Canal
indisponible » et « service indisponible » sont deux réponses différentes ; les séparer après coup
revient à réécrire le contrat que la console d'exploitation lira (FR-N55).

## Critères d'acceptation

- [ ] AC-1 — Scaffold sur le moule commun : NestJS 11, `@nestjs/config`, Swagger, `@nestjs/terminus`,
      helmet, throttler, `class-validator`, relying-party JWKS (`jwks-rsa` + `passport-jwt`),
      Mongoose 8.24 sur le réplica set `rs0`, outbox Kafka (`kafkajs` 2.2.4), `nestjs-cls` +
      `nestjs-pino`. **Aucun écart au moule**, seuils de couverture 65/90/90/90.
- [ ] AC-2 — Service déclaré au `docker-compose` racine sur `:3008` (AR-02).
- [ ] AC-3 — ⚡ **Santé à deux niveaux** (AR-17) : `zéro canal disponible` ou `référentiel
      irrésoluble` ⇒ **service dégradé, pas sain** ; `un canal indisponible parmi d'autres` ⇒
      **dégradé sur ce canal**, service sain. Les deux cas rendent des charges utiles distinctes et
      testées séparément.
- [ ] AC-4 — Journalisation `nestjs-pino` : **jamais** un secret de passerelle, **jamais** un lien à
      usage unique, **jamais** un rendu de message. L'identifiant de canal est journalisé **masqué**.
      Vérifié sur des journaux réels, pas par relecture.
- [ ] AC-5 — Outbox transactionnelle en place et **schémas des topics `notification.*` au schema
      registry**, compatibilité `BACKWARD` imposée en CI (AR-16). Aucun événement publié à ce stade :
      le hook est **inerte, documenté et testé comme tel** (leçon STORY-173).
- [ ] AC-6 — Vocabulaire figé au scaffold : le mot « notification » **ne désigne jamais un objet du
      domaine**, il nomme le service. L'unité est `Envoi`. Un test de présence refuse
      `Notification` comme nom de schéma ou de type du domaine.

## Notes

⛔ **Le câblage racine ne part avec aucune PR.** `docker-compose.yml`, l'override et
`.github/workflows/ci.yml` vivent à la racine et ne sont versionnés dans **aucun dépôt** — dont
l'extension d'`IDP_AUTH_AUDIENCE` à `notification-service`, **sans laquelle aucun jeton n'est
accepté**. Dette relevée par STORY-352 le 2026-08-13, toujours ouverte au 2026-09-03. À trancher avec
le PO **avant** de démarrer, pas au moment de la vérification Docker.
