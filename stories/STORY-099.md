# STORY-099 : Contrat de sortie & handoff — émission `balance.created` (transactional outbox) + API de réconciliation → bilan-service

**Epic :** EPIC-024 — Simulation & conseil fiscal + contrôles & handoff bilan-service
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A28 (contrat de sortie & handoff) ; `sprint-plan-atelier-balance-2026-07-12.md` § D13/D14 (hub multi-source, balance AVANT bilan) + § 4 (coordination balance/bilan)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** review
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-12 · **Re-cadrée le :** 2026-07-17 (contre le code réellement livré par STORY-101/086/077/076)
**Sprint :** 10-11 (CORE — dernière story du socle balance-service)
**Service :** `balance-service` (:3007) → `bilan-service` (:3004)
**Couvre :** FR-A28 (contrat de sortie & handoff), architecturale (liaison 2 services)

> **Dernière brique du CORE balance-service — le handoff du module amont.** STORY-101 a livré le contrat `BalanceCanonique`, son stockage idempotent et **le contrat de l'événement sortant `BalanceCreatedEventV1` figé mais NON branché** (hook inerte). Cette story **branche l'émission** via **transactional outbox** (patron `platform-catalog-service`/`kyc-service`/`auth-service`) et **expose l'API de réconciliation** que le `bilan-service` consommera (EPIC-009, sprints 11-14). **Aucun changement de contrat** : on câble ce que 101 a figé.
>
> **⚠️ Re-cadrage 2026-07-17.** Le draft du 2026-07-12 (rédigé AVANT 101/086) décrivait des API **inexistantes** : événement portant la **balance complète**, routes `GET /balance/:orgId/:exercice/:source` (orgId dans le chemin — **interdit**, il vient du JWT), garde `TenantStateGuard`/`@TenantContext` (n'existent pas), interface `BalanceOutput` inventée. Cette version aligne la story sur le code livré : événement **allégé** `BalanceCreatedEventV1` (référence + coordonnées + checksum, **pas** la balance entière — le consommateur relit via `GET`), routes `/balances` org-scopées, gate `@RequiresBalanceAccess` (STORY-077).
>
> **⚠️ Séquencement.** Au sprint 10-11 **le consumer `bilan-service` n'existe pas encore** (EPIC-009 = sprints 11-14). Cette story livre donc **le seul côté PRODUCTEUR** (émettre + exposer + documenter), vérifié par un **consumer de test** interne (round-trip Kafka + lecture API). L'**e2e d'intégration réel `balance-service → bilan-service`** (le vrai consommateur lit et rend la liasse DSF) est **différé** à EPIC-009, où il devient un critère du module Bilan.

---

## User Story

En tant que **développeur du `bilan-service`** (aval),
je veux que **`balance-service` publie un événement stable à chaque balance persistée et expose une API de relecture prédictible**,
afin de **consommer la balance normalisée sans couplage synchrone ni risque de breaking change**, et de produire la liasse DSF.

---

## Description

### Contexte

Le split **D14** (balance AVANT bilan) impose qu'une balance soit **stockée et notifiée** avant que le `bilan-service` la consomme. Le contrat de sortie est le **pont** entre les deux : `balance-service` **produit et notifie**, `bilan-service` **consomme** (asynchrone Kafka) et **relit au besoin** (synchrone `GET`, hors chemin chaud). Les deux conviennent d'**un seul schéma** — celui **déjà figé** par STORY-101 (`BalanceCreatedEventV1` + `BalanceCanonique`). Cette story ne **change rien au contrat** ; elle **branche l'émission** et **ouvre la relecture**.

### Ce que STORY-101 a déjà livré (à ne PAS refaire)

- `types/balance-events.ts` : contrat `BalanceCreatedEventV1`, constante `BALANCE_CREATED_TOPIC = 'balance.created'`, **mapper pur** `buildBalanceCreatedEvent(balance, balanceId, eventId, occurredAt)` — **figés + testés**, mais **aucun producteur branché** (hook inerte, cf. commentaire du fichier : « STORY-099 l'enfilera dans l'outbox au sein de la transaction d'écriture »).
- `BalanceService.submit()` : insert de la balance **dans une `session.withTransaction`** ; renvoie `{ balance, created }` (`created=false` sur NOP idempotente / gagnant de course `E11000`).
- `BalanceRepository.listByOrg(orgId, { etat, limit, skip })` : **hook** documenté « réconciliation aval — STORY-099 » (snapshot org-scopé, tri antéchronologique, pagination).
- `BalanceController` : `POST /balances`, `GET /balances/:id` (org-scopé, 404 anti-énumération), gate `@RequiresBalanceAccess` (STORY-077) + `@Roles(TENANT_ADMIN, TENANT_USER)`, `orgId`/`auteur` **du JWT**.
- `KafkaProducerService.send(topic, messages)` : producteur partagé (commentaire cite déjà « le producteur `balance.created` (STORY-099) »).

### Périmètre

**Inclus :**

1. **Transactional outbox `balance-service`** (patron répliqué de `platform-catalog-service` STORY-034 / `kyc-service` STORY-021 / `auth-service` STORY-027 — pas de package partagé en phase 1, K4/C6) :
   - `kafka/outbox/outbox-event.schema.ts` : collection `outbox_events`, `eventId` **unique**, `topic`, `partitionKey`, `schemaVersion`, `payload`, `status` (`PENDING`/`SENT`/`FAILED`), `attempts`, `sentAt`, `lastError` ; index `{ status: 1, createdAt: 1 }`.
   - `kafka/outbox/outbox.service.ts` : `enqueue(params, session)` — **exige une `session`** (l'événement ne s'écrit qu'**au sein de la transaction** de l'insert de la balance).
   - `kafka/outbox/outbox-relay.service.ts` : `setInterval` → `dispatchBatch` (PENDING les plus anciens d'abord) → `dispatchOne` ; **at-least-once** (publie puis marque `SENT`), **ordre par partition** (`orgId` : un échec bloque les événements ultérieurs de la même partition dans le tour), erreur **rejouable** (broker down) → reste `PENDING`, erreur **non rejouable** → `FAILED` après `MAX_DISPATCH_ATTEMPTS` (=5). Mono-instance (1 replica) — pas de verrou (`istanbul ignore` sur le câblage du minuteur).
   - `kafka/outbox/balance-events.service.ts` : `created(balance, balanceId, session)` — assemble l'événement via le **mapper figé** `buildBalanceCreatedEvent` (`eventId = randomUUID()`, `occurredAt = now`, `partitionKey = orgId`) et l'`enqueue` sous la session.
   - `kafka/outbox/outbox.module.ts` : `@Global`, enregistre `OutboxEvent`, fournit/exporte `OutboxService` + `BalanceEventsService` + `OutboxRelayService`.

2. **Branchement de l'émission dans `BalanceService.submit`** :
   - **Dans la `withTransaction` existante, après `repo.insert`**, appeler `balanceEvents.created(saved, saved._id.toString(), session)` → atomicité **balance ⇄ événement** (rollback de la validation ⇒ ni balance ni ligne outbox).
   - **Chemin CREATE uniquement** : la NOP idempotente (version déjà présente) et le gagnant de course `E11000` renvoient `created=false` **sans émettre** (leur insert gagnant a déjà émis dans sa propre transaction) — **jamais de doublon d'émission**.

3. **API de réconciliation (relecture)** — active le hook `listByOrg` :
   - `GET /balances` (org-scopé) : liste paginée, filtres optionnels `etat` (`BROUILLON`/`VALIDÉE`/`REJETÉE`) et `source` (`sage`/`direct`/`ocr`), `limit`/`skip`. Réponse `BalanceResponseDto[]`. Gate + rôles identiques au reste du contrôleur.
   - `GET /balances/:id` : **inchangé** (déjà livré 101). Sert la relecture ponctuelle après réception de l'événement (le consommateur `bilan-service` relit la balance complète via son `balanceId`).

4. **Config & câblage** :
   - `config/configuration.ts` : ajout d'un bloc `outbox: OutboxConfig { relayIntervalMs, batchSize }`.
   - `config/env.validation.ts` : `OUTBOX_RELAY_INTERVAL_MS?` (défaut 2000), `OUTBOX_RELAY_BATCH_SIZE?` (défaut 100).
   - `app.module.ts` : import de `OutboxModule` (comme `KafkaModule`, avant les modules métier).
   - **Racine (`docker-compose.yml`, service `balance-service`)** : `OUTBOX_RELAY_INTERVAL_MS: ${BALANCE_OUTBOX_RELAY_INTERVAL_MS:-2000}` + `OUTBOX_RELAY_BATCH_SIZE: ${BALANCE_OUTBOX_RELAY_BATCH_SIZE:-100}`.
   - **Pré-création du topic `balance.created`** au bootstrap (`KafkaBootstrapService`, `admin.createTopics` avec `waitForLeaders`) — cohérent avec le correctif STORY-076 (éviter l'échec du 1er `send` sur topic auto-créé sans leader). *Filet de sécurité réel = la relance `PENDING` de l'outbox ; la pré-création évite juste un 1er tick perdu.*

5. **Documentation du contrat** :
   - Swagger : `GET /balances` (200 + filtres), codes 403 (gate) documentés.
   - `balance-service/INTEGRATION.md` : « Comment consommer la balance » — topic `balance.created`, schéma du payload (JSON Schema), clé de partition, sémantique **at-least-once** + déduplication par `eventId`, relecture `GET /balances/:id`, versionnement (`schemaVersion=1`, tout changement cassant ⇒ v2/nouveau topic).

**Hors périmètre (différé, explicite) :**

- **Consommation réelle côté `bilan-service`** (consumer group, read-model, rendu liasse DSF) + **e2e interop réel `balance → bilan`** → **EPIC-009** (bilan-service, sprints 11-14). Ici : **producteur seul**, vérifié par un **consumer de test** interne.
- **Événement de changement d'état** (`balance.validated`/`balance.rejected` sur `marquerEtat`) : `marquerEtat` reste un **hook inerte** (workflow validation/rejet = STORY-098). `balance.created` (à la persistance) suffit au handoff CORE ; l'événement d'état est une **évolution ultérieure** (le payload porte `statutPreuve`, pas `etat` — le consommateur relit `etat` via `GET`).
- **Versioning/migration de schéma** (évolution v2) — préparé (`schemaVersion`), non implémenté.
- **SLA / métriques d'interop** (latence Kafka, lag consommateur) → story monitoring ultérieure.
- **Relais multi-instance** (verrou `findOneAndUpdate` PENDING→PROCESSING) → au passage 2+ replicas (phase 1 = mono-instance).
- **Endpoint `latest`** dédié (`findLatest` reste interne, utilisé par `nextVersion`) — non requis pour la réconciliation CORE (liste + `:id` suffisent) ; à ouvrir si `bilan-service` le demande.

### Flux (handoff producteur)

1. Un adaptateur (STORY-086 Sage / futur 102 direct / 082-085 cahiers) appelle `POST /balances` → `BalanceService.submit`.
2. Dans **la même transaction** : `validator.validate` → `repo.insert` → `balanceEvents.created(saved, id, session)` **enqueue** une ligne `outbox_events` (`PENDING`, `topic=balance.created`, `partitionKey=orgId`).
3. Commit atomique : la balance **et** l'événement sont persistés ensemble (ou aucun des deux).
4. `OutboxRelayService` (tick) lit les `PENDING`, publie sur `balance.created` (clé `orgId`, headers `eventId`/`schemaVersion`), passe `SENT`.
5. **[Différé EPIC-009]** `bilan-service` consomme `balance.created` (group `bilan-balance`), déduplique par `eventId`, puis **relit la balance complète** via `GET /balances/:balanceId` (ou stocke un read-model) → table de passage (STORY-055) → liasse (STORY-059+) → DSF (STORY-073).

---

## Acceptance Criteria

- [ ] **Outbox répliqué** : `outbox-event.schema.ts` (`eventId` unique, index `{status, createdAt}`, statuts `PENDING/SENT/FAILED`) + `OutboxService.enqueue(params, session)` **exigeant une session** — conformes au patron catalog/kyc/auth.
- [ ] **`BalanceEventsService.created`** construit `BalanceCreatedEventV1` via le **mapper figé** `buildBalanceCreatedEvent` (aucune re-définition du contrat) et l'`enqueue` sous la session ; `partitionKey = orgId`, `eventId = randomUUID()`.
- [ ] **Émission atomique, chemin CREATE seul** : `submit` enfile l'événement **dans** sa `withTransaction`, **après** l'insert ; la NOP idempotente et le gagnant `E11000` **n'émettent rien**. *(unit : 3 chemins ; docker : `countDocuments(outbox_events)`.)*
- [ ] **Atomicité prouvée** : un `POST` déséquilibré (422) **ne laisse NI balance NI ligne outbox** (rollback) — `count(balances)` **et** `count(outbox_events)` inchangés.
- [ ] **Relais** : les `PENDING` sont publiés sur `balance.created` (clé `orgId`, headers `eventId`+`schemaVersion`) puis passés `SENT` ; erreur **rejouable** ⇒ reste `PENDING` (jamais perdu) ; **ordre par partition** préservé (échec d'un `orgId` ne saute pas ses événements ultérieurs).
- [ ] **Tolérance panne Kafka (invariant #4)** : Kafka down → `POST /balances` **réussit quand même** (201, événement `PENDING`), process **vivant**, `/health` `kafka: down` ; au retour du broker, le relais draine `PENDING → SENT`.
- [ ] **API réconciliation** : `GET /balances` (org-scopé, filtres `etat`/`source`, pagination) renvoie `BalanceResponseDto[]` via `listByOrg` ; gate + rôles appliqués ; balance d'une **autre org** invisible (isolation). `GET /balances/:id` inchangé.
- [ ] **e2e producteur (docker)** : `POST /balances` → ligne `outbox_events` `PENDING` → relais → un **consumer de test** interne reçoit `balance.created` et **valide le payload** (`schemaVersion=1`, `eventId`, `orgId`, `balanceId`, `exercice`, `source`, `referentiel`, `version`, `checksum`, `statutPreuve`, `occurredAt`). *(Le vrai consommateur `bilan-service` = EPIC-009.)*
- [ ] **Swagger** : `GET /balances` documenté (200, filtres, 403 gate). **`INTEGRATION.md`** écrit (topic, JSON Schema du payload, at-least-once + dédup `eventId`, relecture `GET`, versionnement).
- [ ] **Qualité** : lint 0 warning · build OK · unit + e2e verts · couverture ≥ **65/90/90/90** (outbox + events service + relais couverts, hors `istanbul ignore` du minuteur) · **non-régression** STORY-101/086/077 (leurs suites restent vertes).

---

## Technical Notes

### Branchement dans `BalanceService.submit` (chemin CREATE)

```typescript
// … dans la withTransaction existante :
await session.withTransaction(async () => {
  this.validator.validate(canonique, dto.checksum);          // throw ⇒ rollback total
  saved = await this.repo.insert(canonique, session);
  await this.balanceEvents.created(saved, saved._id.toString(), session); // ← STORY-099 : même tx
});
// NOP idempotente (existing) et gagnant E11000 : return { created:false } SANS émettre.
```

`BalanceService` injecte `BalanceEventsService` (exporté par le `OutboxModule` `@Global`) — comme `EntitlementsService` injecte `EntitlementEventsService` dans catalog. `saved` doit exposer `_id` (document Mongo hydraté renvoyé par `repo.insert`).

### Événement (DÉJÀ figé en STORY-101 — ne pas redéfinir)

```typescript
// types/balance-events.ts (existant)
export const BALANCE_CREATED_TOPIC = 'balance.created';
export interface BalanceCreatedEventV1 {
  schemaVersion: 1; eventId: string; orgId: string; balanceId: string;
  exercice: { debut: string; fin: string };
  source: SourceBalance; referentiel: ReferentielBalance; version: number;
  checksum: string; statutPreuve: StatutPreuveBalance; occurredAt: string;
}
export function buildBalanceCreatedEvent(balance, balanceId, eventId, occurredAt): BalanceCreatedEventV1
```

Payload **auto-porteur mais allégé** : identifie la balance et ses coordonnées (org, exercice, source, référentiel, version), pas ses lignes. Le consommateur **relit** la balance complète via `GET /balances/:balanceId` (découplage : l'événement ne se périme pas, la taille Kafka reste bornée).

### `BalanceEventsService` (nouveau, calqué sur `EntitlementEventsService`)

```typescript
async created(balance: BalanceCanonique, balanceId: string, session: ClientSession): Promise<void> {
  const event = buildBalanceCreatedEvent(balance, balanceId, randomUUID(), new Date());
  await this.outbox.enqueue(
    { eventId: event.eventId, topic: BALANCE_CREATED_TOPIC, partitionKey: balance.orgId,
      schemaVersion: 1, payload: event as unknown as Record<string, unknown> },
    session,
  );
}
```

### API de réconciliation (`GET /balances`)

```typescript
@Get()
@ApiOkResponse({ type: [BalanceResponseDto] })
async list(
  @CurrentUser() user: AuthenticatedUser,
  @Query() q: ListBalancesQueryDto,     // etat?, source?, limit?, skip? (class-validator)
): Promise<BalanceResponseDto[]> {
  const docs = await this.balanceService.listByOrg(user.tenantId as string, q);
  return docs.map(toBalanceResponse);
}
```

Ajouter `BalanceService.listByOrg(orgId, options)` déléguant à `repo.listByOrg` (le repo l'expose déjà) ; `assertObjectId(orgId)`. `ListBalancesQueryDto` valide/normalise `limit`/`skip` (bornes) et `etat`/`source` (enum).

### Config / env / compose

- `OutboxConfig { relayIntervalMs; batchSize }` ; env `OUTBOX_RELAY_INTERVAL_MS` (2000), `OUTBOX_RELAY_BATCH_SIZE` (100) — **mêmes noms** que catalog/document.
- `docker-compose.yml` (bloc `balance-service`) : ajouter les deux `${BALANCE_OUTBOX_*:-…}` (la racine n'est versionnée dans aucun repo — cf. garde-fou ; l'éditer localement + le consigner dans la story).

### INTEGRATION.md (esquisse)

```markdown
# Consommer la balance depuis balance-service
## Asynchrone — topic `balance.created`
Payload : BalanceCreatedEventV1 (schemaVersion=1). Clé de partition = orgId (ordre par org).
Livraison at-least-once → dédupliquer par `eventId`. Puis relire la balance complète via GET /balances/:balanceId.
## Synchrone — GET /api/v1/balances/:id  (RS256 JWT, gate @RequiresBalanceAccess)
GET /api/v1/balances?etat=&source=&limit=&skip=  → réconciliation (snapshot org-scopé).
## Versionnement : v1 stable. Changement cassant ⇒ schemaVersion=2 + nouveau topic.
```

---

## Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| Émission hors transaction ⇒ « balance sans événement » ou l'inverse | `enqueue` **exige la session** ; appel **dans** la `withTransaction`, après l'insert ; test d'atomicité (422 ⇒ 0 balance **et** 0 outbox). |
| Double émission sur re-soumission | Émission **sur chemin CREATE seul** ; NOP idempotente / gagnant `E11000` n'émettent pas ; test unit des 3 chemins. |
| 1er `send` sur topic `balance.created` auto-créé échoue (pas de leader, cf. STORY-076) | Pré-création `admin.createTopics(waitForLeaders)` au bootstrap ; **et** l'outbox laisse l'événement `PENDING` → republié au tick suivant (jamais perdu). |
| Kafka down au moment du `POST` | Invariant #4 : l'écriture réussit, l'événement reste `PENDING`, drainé au retour du broker (test dédié). |
| Payload trop volumineux si on y mettait toutes les lignes | Contrat **allégé** (référence + coordonnées) déjà figé en 101 ; le consommateur relit via `GET`. |
| `bilan-service` attend un schéma absent | Contrat figé/ testé **avant** EPIC-009 ; `INTEGRATION.md` + JSON Schema publiés ; `schemaVersion` pour l'évolution. |

---

## Definition of Done

- [ ] Outbox `balance-service` (schema + service + relay + module + `BalanceEventsService`) implémenté, patron catalog/kyc/auth respecté.
- [ ] `submit` émet `balance.created` **dans sa transaction**, **chemin CREATE seul** (unit + docker).
- [ ] Atomicité vérifiée en **docker réel** : 422 ⇒ ni balance ni ligne outbox ; commit ⇒ les deux.
- [ ] Relais PENDING→SENT (at-least-once, ordre par partition, rejouable vs `FAILED`) testé ; tolérance Kafka down testée.
- [ ] `GET /balances` (réconciliation, `listByOrg`) + Swagger ; `GET /balances/:id` non régressé.
- [ ] `INTEGRATION.md` + JSON Schema du payload.
- [ ] e2e producteur docker (consumer de test) : round-trip `balance.created` validé.
- [ ] Config/env/compose câblés ; pré-création du topic au bootstrap.
- [ ] Lint 0 · build OK · couverture ≥ seuils · non-régression 101/086/077 · CI verte.
- [ ] **Prêt pour consommation** par `bilan-service` EPIC-009 (interop e2e = critère de ce module).

---

## Progress Tracking

**Status History :**
- 2026-07-12 : Créée (Scrum Master).
- 2026-07-17 : **Re-cadrée** (`/bmad:create-story`) contre le code livré par STORY-101/086/077/076 — draft aligné sur le contrat `BalanceCreatedEventV1` figé, l'émission par **transactional outbox** (chemin CREATE, atomique), l'API `/balances` org-scopée, la gate `@RequiresBalanceAccess`.
- 2026-07-17 : **Implémentée + vérifiée docker** (BMAD dev-story) → statut **review**.

**Décisions de mise en œuvre :**
- **Producteur seul** au sprint 10-11 ; consommateur réel + interop e2e **différés à EPIC-009** (bilan-service).
- Événement **allégé** (référence + coordonnées + checksum + statutPreuve), **pas** la balance entière — le consommateur relit via `GET /balances/:balanceId` (prouvé sur le fil : `hasLignes:false`).
- **Aucune émission d'état** (`balance.validated`) : `marquerEtat` reste hook inerte (STORY-098) ; `balance.created` à la persistance suffit au CORE.
- Outbox **mono-instance** (phase 1) ; verrou multi-instance différé.
- **Pré-création du topic** : `KafkaBootstrapService.ensureHealthTopic` généralisé en `ensureTopics` (santé **+** `balance.created`, `waitForLeaders`, patron STORY-076) ; filet complémentaire = la relance `PENDING` de l'outbox.
- **Filtre `source`** ajouté à `BalanceRepository.listByOrg` (au-delà du seul `etat` du hook 101) pour servir `GET /balances` — extension minimale justifiée par la réconciliation aval.
- ⚠️ **Racine non versionnée** : l'ajout des `OUTBOX_RELAY_*` au bloc `balance-service` de `docker-compose.yml` (racine PROSPERA, hors repo — point ouvert connu) est fait localement et consigné ici.

**Fichiers livrés :** `kafka/outbox/{outbox-event.schema,outbox.service,outbox-relay.service,balance-events.service,outbox.module}.ts` (+ 3 specs) ; `config/{configuration,env.validation}.ts` (bloc `outbox`) ; `app.module.ts` (import `OutboxModule`) ; `kafka/kafka-bootstrap.service.ts` (`ensureTopics`) ; `modules/balance/{balance.service,balance.repository,balance.controller}.ts` + `dto/list-balances-query.dto.ts` (émission + `GET /balances`) ; `INTEGRATION.md` + `docs/schemas/balance.created.v1.schema.json` ; `docker-compose.yml` (racine).

**Validation :** lint 0 warning · build OK · **259 unit + 46 e2e** verts · couverture **98,67 / 89,58 / 98,84 / 98,95** > seuils 65/90/90/90 (module `kafka/outbox` **100 %**, `balance.service`/`balance.repository`/`balance.controller` **100 %**).

**Vérification docker réelle (bout-en-bout)** — stack repartie de **ZÉRO** (`down -v` → `up --build`), 8/8 services healthy, jeton RS256 réel de l'IdP + gate `@RequiresBalanceAccess` satisfaite (read-models KYC APPROVED + entitlement `balance` ACTIVE semés) :
- **Topic** `balance.created` **pré-créé au bootstrap** (`kafka-topics --list`).
- **Émission chemin CREATE seul** : `POST` v1 → 201, v1 rejoué → **200 (même id)**, v2 → 201 ⇒ `balances`=2 (append-only), **`outbox_events`=2** (le rejeu idempotent n'émet **rien**), les deux `SENT`, `partitionKey`=orgId, `payload.balanceId`=`_id` persisté.
- **Handoff sur le fil** : 2 événements consommés sur `balance.created` — `schemaVersion:1`, `eventId` UUID, `orgId`/`balanceId`/`source`/`referentiel`/`version`/`checksum`/`statutPreuve` conformes, **payload allégé** (`hasLignes:false`).
- **Atomicité (FR-A25)** : `POST` déséquilibré → **422** ⇒ `balances`=2 **et** `outbox_events`=2 **inchangés** (ni balance ni événement orphelin).
- **API réconciliation** : `GET /balances?source=sage` → 200 (2 éléments, v1+v2) ; `GET /:id` → 200 ; `?etat=BIDON` → 400 ; `?limit=500` → 400.
- **Invariant #4 (Kafka down)** : `docker compose stop kafka` → `POST` v10 → **201**, `balance-service` **vivant** (`RestartCount=0`), event **PENDING** ; `start kafka` → drain **PENDING→SENT** (final : PENDING=0, SENT=3, **FAILED=0**).
- **Non-régression** : `/health` **200** sur les 8 services (aucun code des 7 services existants touché ; seul le bloc compose `balance-service` étendu).

**Effort réel :** ~1 séance (implémentation + specs + vérif docker).

---

**Dependencies :** STORY-076 (scaffold + `KafkaProducerService` + bootstrap), STORY-101 (contrat + mapper `balance.created` figé + `submit` transactionnel + `listByOrg`), STORY-077 (gate/auth). *(STORY-098, contrôles enrichis, ne bloque PAS : l'émission suit la validation d'équilibre de 101.)*
**Consommateur :** `bilan-service` EPIC-009 (STORY-050+, sprints 11-14) — interop e2e réel = critère de ce module.
**Reference :** `prd-atelier-balance-2026-07-12.md` § FR-A28 ; `sprint-plan-atelier-balance-2026-07-12.md` § D13/D14 + § 4 (coordination balance/bilan).
