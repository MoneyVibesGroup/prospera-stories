# STORY-318 : Les alertes d'échéance et les états de retard — l'alerte part avant la majoration, une seule fois

Status: done — **livrée le 2026-11-26** : prospera-fiscal-service **#70** (`cefbe20` sur `dev`) ; voir « Livraison ».
Écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 3 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat annoncé avant le code (#945, « ⚠ Contrats » et « ⚠ Communs » du journal de C).

**Epic :** EPIC-030 · **Points :** 5 · **FR :** FR-F19 · **Architecture :** AR-09, AD-18 (tout travail récurrent passe
par la file partagée, BullMQ, clé de travail idempotente ; aucun `setInterval`, aucune minuterie applicative)
**Service :** `prospera-fiscal-service` (dossier `obligations`, à C ; fichiers communs nommés plus bas).
**Après :** STORY-317 (l'échéance applicable, `qualifierRetard`). **Suite :** STORY-319 (le responsable désigné, la vue de
charge par collaborateur), que **349 de D attend**.

## Histoire

En tant que **collaborateur de cabinet**, je veux être alerté avant l'échéance, afin de ne pas découvrir le retard une
fois la majoration acquise.

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-030)

1. **Étant donné** un horizon d'alerte paramétrable **quand** une obligation entre dans cet horizon sans être préparée
   **alors** une alerte est produite.
2. **Étant donné** deux répliques du service **quand** l'ordonnanceur s'exécute **alors** l'alerte n'est produite qu'une
   fois, grâce à la clé de travail idempotente.
3. **Étant donné** le service redémarré **quand** l'ordonnanceur reprend **alors** aucun travail programmé n'est perdu.
4. **Étant donné** trois obligations distinctes **quand** on consulte leur état **alors** le système distingue « pas
   encore préparée », « en retard de préparation » et « échéance dépassée ».
5. **Étant donné** le code du service **quand** on le fouille **alors** aucun `setInterval` ni minuterie applicative n'y
   figure.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `8f6b1ba`)

- `qualifierRetard(obligation, aLa)` (317, pur, `domain/obligations/report-echeance.ts`) : l'échéance applicable, la
  légale, `reportee`, `joursDeRetard`. Aucun état de préparation, aucun horizon.
- Le cycle de l'obligation (323) : `A_PREPARER → EN_PREPARATION → A_CONTROLER → A_VALIDER → VALIDEE → A_DEPOSER →
  DEPOSEE → …` ; le champ humain `responsable` existe (toujours `null` : 319 le désigne).
- **Aucune file BullMQ** dans le service (Redis n'y sert qu'à la santé) ; **un `setInterval`** : le relais de l'outbox
  (`kafka/outbox/outbox-relay.service.ts`, STORY-681), « mono-instance, pas de verrou » ; trois `setTimeout` qui bornent
  une attente (sonde Kafka de la santé, relance d'un consommateur Kafka, durée de vie du fil du classeur).
- Un seul topic produit : `fiscal.declaration.deposee` (outbox, D).

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls.** Aucun champ, aucune route, aucun topic existant ne change de nom ni de forme.

### Le modèle (que 319 prolonge sans le refaire)

- **`qualifierEcheance(obligation, aLa, horizonJours)`** (pur, `domain/obligations/alertes-echeance.ts`) compose
  `qualifierRetard` de 317 et ajoute : **`etat`**, **`datePreparationLimite`** (l'échéance applicable moins l'horizon),
  **`joursRestants`** (jusqu'à l'applicable, négatif une fois passée). Le retard se compte toujours sur l'**applicable**
  (la date reportée s'il y a un report).
- **Les états** (`EtatEcheance`) d'une obligation active :

  | État | Quand |
  |---|---|
  | `NON_DATEE` | aucune échéance (la date manque au paquet) |
  | `DEPOSEE` | le cycle a atteint `DEPOSEE` (ou après) : plus rien à craindre de l'échéance de dépôt |
  | `ECHEANCE_DEPASSEE` | le jour est **après** l'applicable, rien n'est déposé (préparée ou non) |
  | `PREPAREE` | le cycle a atteint `VALIDEE` (ou `A_DEPOSER`), l'applicable n'est pas passée |
  | `EN_RETARD_DE_PREPARATION` | pas encore `VALIDEE`, et le jour a atteint la date limite de préparation |
  | `PAS_ENCORE_PREPAREE` | pas encore `VALIDEE`, la date limite de préparation n'est pas atteinte |

  Le jour de l'échéance n'est pas « dépassé ». Une obligation écartée n'a pas d'état d'échéance (elle n'est ni au
  calendrier ni au balayage).
- **L'horizon** est un paramètre **de l'organisation** : `horizonJours`, entier de **1 à 90**, **7 par défaut**
  (`ALERTES_HORIZON_JOURS_DEFAUT`). « Entrer dans l'horizon sans être préparée » = passer `EN_RETARD_DE_PREPARATION`.
- **Une alerte est un fait produit une fois** par `(obligation, état, échéance applicable)` — la **clé de l'alerte**,
  unique en base : c'est elle qui garantit l'unicité entre répliques (AC-2). Deux états alertent :
  `EN_RETARD_DE_PREPARATION` (AC-1) et `ECHEANCE_DEPASSEE`. Un report change l'applicable, donc la clé : l'obligation
  reportée peut être alertée de nouveau à l'approche de sa nouvelle date.

### L'ordonnanceur (AD-18)

- **BullMQ** (`bullmq` ~6.7, `@nestjs/bullmq` 11, comme `sinistres` et le catalogue), sur le Redis du service.
- **Le balayage des échéances** : un planificateur de travail à identifiant fixe (`balayage-des-echeances`,
  `upsertJobScheduler`, idempotent : chaque réplique le pose, il n'y en a qu'un), cadence `ALERTES_ECHEANCE_CRON`
  (**`0 5 * * *`**, 05:00 UTC chaque jour). Il qualifie chaque obligation active non déposée dont l'applicable tombe
  avant la fin de l'horizon le plus large, avec l'horizon de **son** organisation, et produit les alertes manquantes.
  Au démarrage, une tâche de **rattrapage** à identifiant du jour (`rattrapage-AAAA-MM-JJ`) : un balayage manqué pendant
  un arrêt est fait au retour, et le balayage qualifie toujours à l'instant où il passe — rien de ce qui était dû n'est
  perdu (AC-3). Une tâche interrompue par un arrêt est reprise par BullMQ (tâche « bloquée », rejouée), et la clé de
  l'alerte rend la reprise sans doublon.
- **Le relais de l'outbox** passe sur la même file partagée (AC-5) : son `setInterval` est retiré ; un planificateur à
  identifiant fixe (`relais-outbox`, toutes les `OUTBOX_RELAY_INTERVAL_MS`) et une **concurrence globale de 1** — deux
  répliques ne relaient plus jamais en même temps (le relais était « mono-instance » faute de verrou). Le contenu d'un
  tour (`dispatchBatch`, ordre par partition, `FAILED` après 5 échecs non rejouables) ne change pas.
- **Redis absent** : le service démarre quand même (la planification n'est pas attendue au démarrage, elle se journalise
  et se refait au tour suivant) ; tant que Redis manque, aucune alerte ne se produit et l'outbox ne se relaie pas —
  les événements restent `PENDING`, jamais perdus, et la santé dit déjà Redis tombé.

### Ce que le fiscal expose

- **`GET /api/v1/obligations/alertes`** (rôles du cabinet, gate fiscale) — les alertes produites pour les dossiers de la
  **portée de l'appelant** (la même que le calendrier, 315), la plus récente d'abord. Filtres : `dossierId`, `etat`
  (`EN_RETARD_DE_PREPARATION` | `ECHEANCE_DEPASSEE`), `responsable` (un utilisateur, ou `AUCUN`) ; `limite` (1 à 200, 50
  par défaut), `apres` (curseur opaque). → `200 { alertes: AlerteEcheanceDto[], suivant: string | null }`.
  `AlerteEcheanceDto` : `{ alerteId, obligationId, dossierId, redevableId, taxe, libelle, periode, etat, echeance,
  echeanceLegale, reportee, horizonJours, datePreparationLimite, joursRestants, statut, responsable, produiteLe }`
  (`statut` et `responsable` : ceux de l'obligation au moment de l'alerte). `400 CURSEUR_INVALIDE`.
- **`GET /api/v1/obligations/alertes/horizon`** → `200 { horizonJours, parDefaut, par, le }` (`parDefaut: true`, `par` et
  `le` à `null` tant que le cabinet ne l'a pas réglé).
- **`PUT /api/v1/obligations/alertes/horizon`** `{ horizonJours }` (droit `fiscalite:declaration:valider`) → même
  réponse ; `400` hors de 1 à 90. Acte **`ALERTES_HORIZON_CHANGE`** au journal chaîné (`organisation:<orgId>` :
  `avant`, `apres`, auteur). Il vaut pour les prochains balayages ; les alertes déjà produites restent.
- **Le calendrier** (`GET /obligations/calendrier`, `LigneCalendrierDto`) gagne **`etatEcheance`** et **`joursRestants`**
  (au jour de la lecture, avec l'horizon de l'organisation) : c'est là qu'on « consulte l'état » (AC-4).
- **Le fait publié** : **`fiscal.obligation.alerte-echeance`** (v1, `schemaVersion` en en-tête, clé de partition
  `orgId`), écrit par l'outbox **dans la transaction** qui crée l'alerte : `{ schemaVersion: 1, eventId, occurredAt,
  orgId, alerteId, obligationId, dossierId, redevableId, taxe, libelle, periode, etat, echeance, echeanceLegale,
  reportee, horizonJours, datePreparationLimite, joursRestants, statut, responsable }` — état absolu, aucune donnée
  personnelle (`responsable` est un identifiant d'utilisateur). Aucun consommateur aujourd'hui.

### Persistance et fichiers communs (D-L7-2)

- **Aucune migration** : deux collections neuves, `alertes_echeance` (index unique `cle_alerte`, index de lecture
  `{ orgId, _id }`) et `parametres_alertes` (une ligne par organisation), index posés par Mongoose au démarrage.
- **Communs touchés** : `package.json` / `package-lock.json` (`bullmq`, `@nestjs/bullmq`), `app.module.ts` (la file
  partagée), le contrat OpenAPI (les trois routes, deux champs du calendrier), `kafka/outbox/` (le relais sur BullMQ),
  `config/` (trois variables : `ALERTES_ECHEANCE_CRON`, `ALERTES_HORIZON_JOURS_DEFAUT`, et `OUTBOX_RELAY_INTERVAL_MS`
  qui garde son sens), `.env.example`. Rien dans les dossiers de D.

## Ce qui part ailleurs

- **→ D (notification, `prospera-notification-service`)** : l'alerte par e-mail ou dans la cloche n'est pas au fiscal.
  Demandé : consommer `fiscal.obligation.alerte-echeance` et prévenir le `responsable` (ou, sans responsable, les
  associés du cabinet). **Choix par défaut** : l'alerte se lit dans l'application (`GET /obligations/alertes`, le
  calendrier) ; aucun message ne part tant que D ne la consomme pas.
- **319 (C)** désigne le `responsable` : l'alerte le recopie déjà ; la vue de charge lira `qualifierEcheance` et les
  alertes, sans rien changer ici.

## Livraison (2026-11-26)

- **fiscal** (#70, `cefbe20` sur `dev`, rebasée sur `8f6b1ba`) : `domain/obligations/alertes-echeance.ts` (`qualifierEcheance`,
  `cleAlerte`, `faitHorizonChange`, purs ; `qualifierRetard` de 317 composé, son interface élargie à `report: { date }`),
  `application/obligations/alertes-echeance.service.ts` (balayage, lecture, horizon), port `RegistreAlertesEcheance` et son
  adaptateur Mongo (`alertes_echeance`, `parametres_alertes`, outbox dans la transaction), `modules/obligations/
  alertes-echeance.planificateur.ts` et `.controller.ts`, `kafka/events/alerte-echeance-events.ts`,
  `kafka/outbox/outbox-relay.planificateur.ts` (le relais sur BullMQ), la ligne du calendrier enrichie, `src/garde-minuteries.spec.ts`.
- **Les AC en tests** : AC-1 (le balayage alerte celle qui entre dans l'horizon, pas les autres, avec l'horizon de SON
  organisation ; l'horizon réglé par `PUT` change l'état au calendrier, e2e) ; AC-2 (deux balayages parallèles : une alerte, un
  fait ; sur le vrai MongoDB, trois `produire` simultanés de la même clé : une alerte, une ligne d'outbox ; sur un vrai Redis,
  deux « répliques » : un planificateur, un rattrapage ; **sur la pile, deux répliques du service : 2 alertes pour 2 clés
  après 12 balayages**) ; AC-3 (sur un vrai Redis, le planificateur survit à l'arrêt et le travail dû part à la reprise ; **sur
  la pile, les deux répliques arrêtées, une obligation entrée dans l'horizon pendant l'arrêt est alertée à la reprise, rien en
  double**) ; AC-4 (trois obligations, trois états, au calendrier en unitaire et en e2e) ; AC-5 (garde AST : aucun
  `setInterval`, aucun import de `node:timers`, `setTimeout` / `setImmediate` en liste fermée et comptée — quatre attentes
  bornées).
- **Preuves** (Node 24, image `verification` de l'archive LF de `1eedcee`, arbre identique à `cefbe20`) : unitaires **209/209
  suites, 3050** (3 sautés) ; spec BullMQ sur un vrai Redis **2/2** ; e2e **13/13, 282** ; `test:conformite` **20/20, 126** ;
  `nest build` ; **mutations 20/20** rouges sur l'assertion (jour de l'échéance dépassé, horizon ignoré, préparée dès
  `A_VALIDER`, déposée non reconnue, clé sans l'état, limite décalée, report ignoré, horizon de l'organisation ignoré au
  balayage, préparée qui alerte, aucune borne aux retards anciens, une seule page, portée ignorée, horizon hors bornes, identifiant
  de planificateur variable, rattrapage à l'instant, cron hors UTC, relais sans concurrence globale, `setInterval` qui revient,
  calendrier sans l'horizon de l'organisation, calendrier sans la date reportée) ; §1.5 et gate : `docker compose -p grp-c`
  avec **deux répliques** (`fiscal-service` et `fiscal-service-b`, cron toutes les 10 s), saines (MongoDB en jeu de
  répliques, Kafka, Redis), faits `SENT` par le relais BullMQ, Redis : un planificateur `balayage-des-echeances`, un
  `relais-outbox`, concurrence du relais 1 ; 401 sans jeton sur les trois routes et le calendrier ; 0 `UnknownDependencies`.
  Lint des fichiers touchés : aucun écart neuf (les 7 erreurs restantes sont celles d'`origin/dev`). Node 25 : 205/209 suites,
  les 4 rouges sont le client Kafka natif (connus). Verrou pris deux fois (03:43 → 04:00, preuve coupée par moi sur une
  erreur de compilation trouvée par les mutations ; 04:15 → 04:26).

### Écarts au contrat, décidés au code

- **D-318-13** : le balayage ne regarde pas une échéance **dépassée depuis plus de 31 jours** : une alerte sert à agir avant la
  majoration ; sans cette borne, la première mise en service alerterait sur toutes les années passées non déposées. Ces
  obligations restent `ECHEANCE_DEPASSEE` au calendrier.
- Le contrôleur des alertes est **à part** (`AlertesEcheanceController`, même dossier, même gate) : les routes et leurs formes
  sont celles annoncées.
- Une quatrième attente bornée entre dans la liste fermée de la garde : le `setImmediate` de l'intercepteur de journalisation.

## Décisions prises au contrat (contestables)

- **D-318-1** : **un seul paramètre**, l'horizon, par organisation (1 à 90 jours, 7 par défaut). La date limite de
  préparation est l'applicable moins l'horizon : entrer dans l'horizon sans être préparée, c'est être en retard de
  préparation. Un horizon par type d'obligation (mensuelle, annuelle) est nommé pour plus tard.
- **D-318-2** : « **préparée** » = le cycle a atteint `VALIDEE` (contrôlée et visée : prête à déposer) ; « déposée » =
  `DEPOSEE` ou après. Un retard de **paiement** (`A_PAYER` après l'échéance) est à 343 / 344, pas ici.
- **D-318-3** : l'unicité de l'alerte tient à **sa clé en base** (index unique, écriture et outbox dans une transaction) ;
  BullMQ assure qu'un seul balayage est planifié, mais ce n'est pas lui qui garantit l'unicité : deux répliques qui
  balaieraient ensemble produisent toujours une seule alerte.
- **D-318-4** : le balayage est **quotidien** et **qualifie à l'instant où il passe** (un rattrapage par nature) ; le
  rattrapage au démarrage porte l'identifiant du jour. Pas de tâche différée par obligation (une par échéance, à
  replanifier à chaque report et chaque dérivation) : plus de pièces mobiles pour le même résultat au jour près.
- **D-318-5** : le **relais de l'outbox** passe sur BullMQ (AC-5 et AD-18 : « nulle part dans le service »), avec une
  concurrence globale de 1. C'est un fichier commun (D publie `fiscal.declaration.deposee` par lui) : son comportement ne
  change pas, sauf qu'il ne relaie pas sans Redis.
- **D-318-6** : AC-5 se lit « **aucun ordonnancement en mémoire** » : aucun `setInterval`, aucun `setTimeout` qui
  planifie un travail. Restent trois `setTimeout` qui **bornent une attente** (délai de la sonde Kafka, relance d'un
  consommateur Kafka déconnecté, durée de vie du fil du classeur) : la garde les tient en **liste fermée et comptée**,
  chacun avec sa raison ; un `setTimeout` neuf la fait rougir.
- **D-318-7** : l'e-mail et la notification sont à `prospera-notification-service` (D) : le fiscal publie le fait et
  sert la lecture (→ D ci-dessus).
- **D-318-8** : le destinataire est le **`responsable` de l'obligation au moment de l'alerte** (`null` tant que 319 ne
  l'a pas désigné) ; l'alerte ne le recalcule pas après coup.
- **D-318-9** : régler l'horizon exige `fiscalite:declaration:valider` (l'expert-comptable, comme un report) ; le lire,
  la gate fiscale seule. Aucun droit neuf.
- **D-318-10** : le manifeste `declarations` (`publie`) n'est pas amendé ici : le topic neuf entre à sa prochaine
  version, avec les routes de 317 et la note périmée de 560 (même choix que D en 560).
- **D-318-11** : le calendrier rend l'état, il ne **filtre** pas encore par état (calculé au jour de la lecture, hors
  index) ; la lecture des alertes filtre, elle, par état.
- **D-318-12** : `qualifierRetard` (317) ne change pas ; `qualifierEcheance` la compose.
