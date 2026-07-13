# STORY-034 : Événements `entitlement.changed` (producteur Kafka + transactional outbox) — clôture EPIC-007

**Epic :** EPIC-007 — platform-catalog-service (catalogue modules/versions/référentiels + entitlements + topic `entitlement.changed`)
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` (v1.0) **§Contrat d'événements `entitlement.changed` (v1) — source de vérité** (l.231-268) · §Composants → **EventPublisher** (l.144) · §Authentification inter-services → **C8** (l.278) · §Journal de décisions **C7** (état absolu) / **C8** (auth service-à-service) / **C9** (cascade `identity.org.suspended`) · `architecture-prospera-ecosystem-2026-07-04.md` §Contrats d'événements (transport **Kafka** + **transactional outbox**) — décisions programme **P4** (événements + read-models), **P8** (source de vérité entitlements)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-13. Transactional outbox (`OutboxEvent`/`OutboxService.enqueue(session)`/`OutboxRelayService`/`EntitlementEventsService`) calqué sur `kyc-service` ; `EntitlementsService.upsert`/`.revoke` mis sous `withTransaction` (mutation + enqueue atomiques). C8 différé STORY-039. lint 0, **184 unit + 46 e2e** verts, couverture **100 %** sur `kafka/**` + `entitlements/**`. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-13
**Sprint :** 7
**Service :** platform-catalog-service (`:3003`) — base Mongo dédiée `catalog_service`
**Couvre :** aucun FR du PRD `expert-comptable` (capacité **plateforme**) — concrétise **P4** (`entitlement.changed` alimente les read-models locaux) et **clôt P8** (le catalog diffuse désormais sa source de vérité)

> **4ᵉ et dernière story de l'EPIC-007 — elle « branche le bus » du catalog.** STORY-031 a rendu le service démarrable et sécurisé (relying party RS256/JWKS, `/health`, `KafkaModule` **squelette** — producteur câblé mais **rien de publié**). STORY-032 a posé le **catalogue** (registre `Module`/`ModuleVersion`/`ReferentielVersion`). STORY-033 a posé les **entitlements** `(org × module)` et a **explicitement laissé une couture** : `EntitlementsService.upsert()` et `.revoke()` **retournent** l'entité persistée, avec un commentaire `// Couture STORY-034` marquant le point exact où publier. STORY-034 lève la dernière régression documentée du service : **chaque changement d'entitlement était persisté mais muet**. Désormais le catalog **publie `entitlement.changed`** (état **absolu**, clé de partition `orgId`) à chaque octroi / mise à jour / révocation, via un **transactional outbox** calqué sur `auth-service` (STORY-027) et `kyc-service` (STORY-021). Les consommateurs (`bilan-service` gate STORY-036, gateway, verticaux, `admin-panel`) pourront maintenir leur **read-model local** sans jamais appeler le catalog sur le chemin chaud. Cette story rend le catalog **event-driven de bout en bout** et **clôt l'EPIC-007**.
>
> **C8 (octroi service-à-service) est différé — décision actée 2026-07-13.** L'IdP (`auth-service`) n'expose **aucun grant `client_credentials`/M2M** aujourd'hui, et le **seul appelant réel** d'un octroi service-à-service est **STORY-039** (`expert-comptable` billing → catalog, à l'activation d'abonnement), planifiée **Module 2 (déc. 2026, sprint 20)**. Implémenter un jeton de service maintenant serait **spéculatif** (dépend d'une capacité IdP inexistante) et **non vérifiable bout-en-bout** (aucun émetteur). C8 est donc **tranché JIT avec STORY-039**. STORY-034 conserve l'**écriture réservée `PLATFORM_ADMIN`** (octroi manuel par l'opérateur plateforme, seul déclencheur en phase 1) ; le contrat d'événement, lui, est **complet et final** (il n'est pas impacté par C8, cf. arch C8 : *« n'impacte pas le contrat d'événement »*).

---

## User Story

En tant que **service consommateur d'entitlements (`bilan-service`, gateway, verticaux, `admin-panel`)**,
je veux **recevoir sur le bus (`entitlement.changed`) l'état absolu de chaque droit `(org × module)` à chaque changement**, publié de façon **fiable** (transactional outbox → aucune perte, aucun « état sans événement ») et **idempotente** (état absolu, clé `orgId`, livraison at-least-once),
afin de **maintenir mon read-model local** — quelle version de code, quel référentiel, quelle config, quel statut servir à chaque organisation — **sans jamais appeler le `platform-catalog-service` sur le chemin chaud**, et de me **re-synchroniser** par réconciliation (`GET`) en cas de perte d'événement.

---

## Description

### Contexte

Le re-cadrage écosystème (P4/P8) a fait du `platform-catalog-service` la **source de vérité unique** des entitlements, **diffusée par événements** — jamais par appel synchrone sur le chemin chaud (C4). STORY-033 a livré la **persistance** validée (`Entitlement`, upsert idempotent `$set` absolu, révocation soft `REVOKED`) mais **sans toucher au bus** : `KafkaModule` est resté le squelette de STORY-031, et `EntitlementsService.upsert()`/`.revoke()` retournent l'entité persistée avec un commentaire `// Couture STORY-034` à l'endroit exact de la future publication.

STORY-034 branche cette couture. Trois invariants la structurent :

1. **Fiabilité par transactional outbox (aligné programme).** L'écriture de l'entitlement **et** l'écriture de l'événement outbox se font dans **une seule transaction Mongo** (`session`). Un rollback n'émet **aucun** événement ; un commit persiste **les deux** atomiquement. Un relais (`OutboxRelayService`) publie ensuite sur Kafka en `PENDING → SENT` (at-least-once, tolérant Kafka down). C'est le **même patron** que `auth-service` (STORY-027) et `kyc-service` (STORY-021) — assemblage discipliné, pas invention.
2. **État absolu, keyé `orgId` (C7).** L'événement porte l'**état complet** de `(org × module)` (`versionCode`, `referentiel?`, `config`, `status`), clé de partition = `orgId` (ordre garanti par organisation). Le read-model consommateur devient **idempotent** : `$set` absolu, robuste au rejeu et au désordre. `status === REVOKED` → le consommateur **retire** le module pour cette org (jamais de suppression silencieuse — d'où la révocation **soft** de STORY-033).
3. **Atomicité transition ↔ outbox (le seul point dur).** STORY-033 faisait `findOneAndUpdate` **hors transaction**. STORY-034 doit **envelopper** `upsert` et `revoke` dans un `withTransaction`, passer la `session` **à la mutation ET à l'enqueue outbox** — sans changer la logique métier (validation de cohérence, idempotence `$set`, 201/200, 404) déjà livrée. C'est un **refactor de la couture**, pas une réécriture.

Cette story **ne modifie ni le contrat REST, ni le RBAC, ni la validation de cohérence** de STORY-033. Elle **ajoute** : le contrat d'événement (`entitlement-events.ts`), l'outbox (schéma + service + relais), le producteur branché (déjà câblé en squelette STORY-031), et la mise sous transaction des deux mutations.

### Périmètre

**Dans le périmètre**

- **Contrat d'événement** — `src/kafka/entitlement-events.ts` : interface `EntitlementChangedEventV1` **conforme littéralement à l'architecture** (l.239-254) + constante de topic `ENTITLEMENT_CHANGED_TOPIC = 'entitlement.changed'`. Champs : `schemaVersion:1`, `eventId` (UUID v4), `orgId`, `moduleCode`, `versionCode`, `referentiel?`, `config`, `status` (`ACTIVE|SUSPENDED|REVOKED`), `occurredAt` (ISO-8601 UTC). *(Mirror de `kyc-service/src/kafka/kyc-events.ts`.)*
- **Transactional outbox** (`src/kafka/outbox/`, **mirror** `kyc-service/src/kafka/outbox/`) :
  - `outbox-event.schema.ts` — `OutboxEvent` (`eventId`, `topic`, `partitionKey`, `schemaVersion`, `payload`, `status` `PENDING|SENT`, `attempts`, `lastError`, `sentAt`, `timestamps`).
  - `outbox.service.ts` — `OutboxService.enqueue(params, session)` : création de l'événement **sous session** (exige une `ClientSession`).
  - `outbox-relay.service.ts` — `OutboxRelayService` : relais *polling* trié `createdAt`, publie via `KafkaProducerService.send()` avec **clé de partition `orgId`** + headers `eventId`/`schemaVersion`, `PENDING → SENT`, ré-entrance protégée, tolérant broker down (`attempts`/`lastError`).
  - `outbox.module.ts` — `@Global`, enregistre le schéma + expose `OutboxService`.
- **`EntitlementEventsService`** (`src/kafka/outbox/entitlement-events.service.ts`, mirror `KycEventsService`) : construit l'événement à partir de l'entité persistée (`eventId = randomUUID()`, `occurredAt = new Date().toISOString()`, omet `referentiel` si absent) et appelle `OutboxService.enqueue(..., session)`.
- **`KafkaProducerService`** (déjà livré en squelette STORY-031) : réutilisé tel quel (connexion paresseuse, tolérant broker down, `send(topic, msgs)`, fermeture propre `onModuleDestroy`).
- **`EntitlementsService` transactionnel** : `upsert()` et `revoke()` enveloppés dans `connection.withTransaction(session => …)` ; la mutation `Entitlement` **et** `EntitlementEventsService.changed(entity, session)` partagent **la même session**. La logique métier de STORY-033 (cohérence 422, idempotence `$set`, `created` 201/200, révocation soft, 404, `assertObjectId` 400) est **préservée à l'identique**. Injecter `@InjectConnection()` + `EntitlementEventsService`.
- **Config** : ajouter `outbox: { relayIntervalMs, batchSize }` dans `configuration.ts` + `env.validation.ts` (optionnels, **défauts alignés `auth-service`/`kyc-service`**).
- **`app.module.ts`** : importer `OutboxModule`. `KafkaModule` (déjà `@Global`, exporte `KafkaProducerService`) inchangé.
- Tests **unitaires** (outbox enqueue sous session ; relais dispatch/erreur/tri/`SENT` ; `EntitlementEventsService` — payload conforme, `referentiel` omis si absent ; `EntitlementsService` — upsert/revoke atomiques : rollback ⇒ 0 événement, commit ⇒ 1 événement, logique 422/201/200/404 inchangée) + **e2e** (octroi → **1** événement `entitlement.changed` outbox `SENT` sur `entitlement.changed`, clé `orgId`, payload absolu ; migration → nouvel événement ; révocation → événement `status:REVOKED` ; **aucun** événement si upsert refusé 422).
- **Vérification docker bout-en-bout** : sur la stack racine (`auth`+`catalog`+`mongo` rs0+`kafka`), un octroi/màj/révocation `PLATFORM_ADMIN` produit les événements attendus dans `catalog_service.outbox_events` (**`SENT`**) et sur le **topic Kafka** `entitlement.changed` (payload absolu, clé `orgId`).

**Hors périmètre (stories suivantes)**

- **C8 — octroi service-à-service (client-credentials / M2M)** → **différé STORY-039 (Module 2)**. L'écriture reste `PLATFORM_ADMIN`. Le contrat d'événement n'en dépend pas.
- **C9 — cascade `identity.org.suspended`** (consommer l'événement d'identité pour passer les entitlements d'une org suspendue en `SUSPENDED`) → **optionnel, hors périmètre** (activable sans refonte ; désactivé tant que l'IdP ne publie pas l'événement).
- **Read-models côté consommateurs** (`bilan-service` gate STORY-036, gateway routage `orgId → version`, `admin-panel`) → services **consommateurs** (EPIC-008+, retrofit front). STORY-034 ne livre **que le producteur**.
- **Relais outbox multi-instance** : mono-instance en phase 1 (aligné STORY-021/027) ; un passage multi-replica nécessitera un `findOneAndUpdate` atomique `PENDING → PROCESSING` (noté, hors périmètre).

### Flux (octroi manuel par l'opérateur plateforme → diffusion bus)

1. Le `PLATFORM_ADMIN` se connecte à l'IdP (`:3001`) → **JWT RS256** (`roles:[PLATFORM_ADMIN]`, `org:null`, `aud` contient `platform-catalog-service`).
2. `PUT :3003/api/v1/catalog/entitlements/{orgId}/bilan { versionCode:"2.0", referentiel:{ code:"syscohada-revise", version:"2.1" }, config:{} }`.
3. `EntitlementsService.upsert` ouvre une **transaction Mongo** : validation de cohérence (STORY-032) → `findOneAndUpdate` `$set` absolu **et** `OutboxService.enqueue(entitlement.changed, session)` → **commit** (les deux atomiquement). Réponse **201** (création) / **200** (màj).
4. `OutboxRelayService` (tick périodique) publie l'événement sur le **topic `entitlement.changed`** (clé = `orgId`, header `eventId`), puis marque l'`OutboxEvent` **`SENT`**.
5. **Rejeu identique** (`PUT` à l'identique) → **200** (idempotent) **et** un **nouvel** événement `entitlement.changed` (même état absolu → consommateur idempotent, aucun effet net) : l'événement reflète **une écriture**, pas un delta.
6. **Migration** : `PUT .../bilan { versionCode:"3.0", … }` → **200** + événement `versionCode:"3.0"` (état absolu).
7. **Révocation** : `DELETE .../{orgId}/bilan` → **200** (`status → REVOKED`, soft) + événement `status:"REVOKED"` → le consommateur retire le module pour l'org.
8. **Cohérence refusée** : `PUT .../bilan { versionCode:"9.9" }` → **422**, transaction **non ouverte / rollback** → **aucun** événement.
9. **Kafka down au moment T** : l'`OutboxEvent` reste **`PENDING`** → rattrapé au retour du broker (pas de transaction distribuée Kafka↔Mongo ; l'octroi n'est jamais bloqué).

---

## Acceptance Criteria

- [ ] **Contrat** (`src/kafka/entitlement-events.ts`) : `EntitlementChangedEventV1` **conforme à l'architecture** (`schemaVersion:1`, `eventId`, `orgId`, `moduleCode`, `versionCode`, `referentiel?` `{code,version}`, `config`, `status` `ACTIVE|SUSPENDED|REVOKED`, `occurredAt` ISO-8601) + constante `ENTITLEMENT_CHANGED_TOPIC = 'entitlement.changed'`.
- [ ] **Transactional outbox** (`src/kafka/outbox/`) calqué sur `kyc-service` : `OutboxEvent` (`PENDING|SENT`, `attempts`, `lastError`, `sentAt`, `timestamps`) ; `OutboxService.enqueue(params, session)` **création sous session** (signature exige `ClientSession`) ; `OutboxRelayService` (relais polling trié `createdAt`, publie avec **clé de partition `orgId`** + headers `eventId`/`schemaVersion`, `PENDING→SENT`, ré-entrance protégée, tolérant broker down) ; `OutboxModule` `@Global`.
- [ ] **Atomicité (le point dur)** : `EntitlementsService.upsert()` **et** `.revoke()` s'exécutent dans une **transaction Mongo** (`connection.withTransaction`) ; la mutation `Entitlement` **et** l'enqueue outbox partagent **la même session** — **un rollback n'émet aucun événement, un commit persiste les deux** (test automatisé exigé).
- [ ] **Un événement par écriture** : chaque `upsert` **réussi** (201 **ou** 200) et chaque `revoke` (200) produit **exactement un** `OutboxEvent` (`entitlement.changed`) ; un `upsert` **refusé (422)** ou un `revoke` **absent (404)** ne produit **aucun** événement.
- [ ] **Payload = état absolu** : l'événement reflète l'entité **persistée** — `orgId` (hex), `moduleCode`, `versionCode`, `referentiel` **omis si absent** (module sans référentiel), `config`, `status` réel (`REVOKED` sur `DELETE`). Clé de partition Kafka = `orgId`.
- [ ] **Idempotence consommateur préservée (contrat)** : livraison **at-least-once** — `eventId` (UUID v4) unique par événement, exposé en header ; l'état absolu garantit un rejeu sûr côté consommateur (documenté dans le contrat ; le marqueur de dédup est **côté consommateur**, hors périmètre producteur).
- [ ] **Logique métier STORY-033 inchangée** : validation de cohérence (422 module/version/référentiel inexistant ou `RETIRED` ; `DEPRECATED` accepté), idempotence `$set` absolu (201/200), révocation soft `REVOKED`, 404, `orgId` non-ObjectId → 400, RBAC `PLATFORM_ADMIN` (écriture) + anti-énumération (lecture) — **tous les tests e2e de STORY-033 restent verts**.
- [ ] **Config** : `outbox.relayIntervalMs` / `outbox.batchSize` ajoutés (`configuration.ts` + `env.validation.ts`), **optionnels avec défauts** alignés `auth-service`/`kyc-service` ; `KafkaProducerService` fermé proprement (`onModuleDestroy`).
- [ ] **Aucun changement C8/C9** : l'écriture reste `PLATFORM_ADMIN` (C8 différé STORY-039) ; aucun consumer `identity.org.suspended` (C9 hors périmètre).
- [ ] **Swagger `/api/docs`** inchangé (pas de nouvel endpoint) ; **seuils Jest 65/90/90/90** tenus, **ESLint 0 warning**, build image Docker OK (**4 services** CI verte).
- [ ] **Vérification docker bout-en-bout** : via la stack racine, un JWT `PLATFORM_ADMIN` réel octroie `bilan@2.0 + syscohada-revise@2.1` (201) → **1** `OutboxEvent` `SENT` + **1** message sur `entitlement.changed` (clé `orgId`, payload absolu) ; migration `3.0` (200) → nouvel événement ; révocation (200) → événement `status:REVOKED` ; refus 422 → **aucun** événement ; un `kafka-console-consumer` (ou équivalent) sur `entitlement.changed` montre les payloads attendus.

---

## Technical Notes

### Arborescence (ajouts — `src/kafka/`)

```
platform-catalog-service/src/kafka/
├── kafka.module.ts             # existant (@Global, exporte KafkaProducerService) — inchangé
├── kafka-producer.service.ts   # existant (squelette STORY-031, send() paresseux) — RÉUTILISÉ tel quel
├── kafka.constants.ts          # existant (KAFKA_CLIENT)
├── entitlement-events.ts       # NOUVEAU : EntitlementChangedEventV1 + ENTITLEMENT_CHANGED_TOPIC
└── outbox/                     # NOUVEAU (mirror kyc-service/src/kafka/outbox/)
    ├── outbox-event.schema.ts  # OutboxEvent (eventId, topic, partitionKey, schemaVersion, payload, status, attempts, lastError, sentAt)
    ├── outbox.service.ts       # enqueue(params, session)  ← SOUS TRANSACTION
    ├── outbox-relay.service.ts # relais polling PENDING→SENT (clé orgId, headers eventId/schemaVersion)
    ├── entitlement-events.service.ts # construit l'événement depuis l'entité + enqueue(session)
    └── outbox.module.ts        # @Global : schéma + OutboxService (+ relay)
```

> `app.module.ts` : ajouter `OutboxModule`. `KafkaModule` est déjà `@Global` et exporte `KafkaProducerService` (STORY-031) — **aucun** nouveau module d'infra (Mongo/Kafka déjà câblés ; **ni** Redis **ni** MinIO). **Ne pas** dupliquer la logique d'auth (`common/`).

### Contrat (source de vérité : architecture §Contrat d'événements, l.239-254)

Reprendre **littéralement** :

```typescript
export const ENTITLEMENT_CHANGED_TOPIC = 'entitlement.changed';

/** Émis à CHAQUE changement d'entitlement d'une organisation POUR UN module. État ABSOLU. */
export interface EntitlementChangedEventV1 {
  schemaVersion: 1;
  eventId: string;             // UUID v4 — clé d'idempotence côté consommateur
  orgId: string;               // ObjectId hex (= clé de partition Kafka)
  moduleCode: string;          // "bilan", "stock", …
  versionCode: string;         // "2.0"
  referentiel?: { code: string; version: string }; // omis si module sans référentiel
  config: Record<string, unknown>;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  occurredAt: string;          // ISO-8601 UTC
}
```

### Mise sous transaction de la couture STORY-033 (`entitlements.service.ts`)

STORY-033 a laissé le point d'ancrage exact (`// ── Couture STORY-034 ──`). Refactor **minimal** : envelopper la mutation dans une session et enfiler l'événement dans la **même** transaction.

```
Injecter : @InjectConnection() connection: Connection ; entitlementEvents: EntitlementEventsService

upsert(orgId, moduleCode, dto, grantedBy) :
  assertObjectId(orgId)                         // 400 — inchangé
  await assertCatalogCoherence(...)             // 422 — inchangé (AVANT la transaction)
  return await this.connection.withTransaction(async (session) => {
    const existing = await model.findOne({orgId, moduleCode}).session(session)...
    const entitlement = await model.findOneAndUpdate({...}, {$set:{...}},
                          { upsert:true, new:true, setDefaultsOnInsert:true, session })
    await entitlementEvents.changed(entitlement, session)   // ← enqueue outbox SOUS session
    return { entitlement, created: existing === null }
  })

revoke(orgId, moduleCode) :
  assertObjectId(orgId)
  return await this.connection.withTransaction(async (session) => {
    const doc = await model.findOneAndUpdate({...}, {$set:{status:REVOKED}}, { new:true, session })
    if (!doc) throw new NotFoundException(...)   // 404 — rollback ⇒ aucun événement
    await entitlementEvents.changed(doc, session)
    return doc
  })
```

- **`assertCatalogCoherence` reste HORS transaction** (lecture pure du registre) : un refus **422** ne doit **pas** ouvrir de transaction ⇒ aucun événement. *(Attention à ne pas régresser les tests unitaires 422 de STORY-033.)*
- **`withTransaction`** gère commit/rollback/retry (`TransientTransactionError`) automatiquement ; ne pas ré-implémenter la boucle à la main. Nécessite le **replica set** (`mongo` rs0, déjà en place — cf. STORY-031/033).
- **`EntitlementEventsService.changed(entitlement, session)`** : `orgId = entitlement.organizationId.toString()` ; omet `referentiel` s'il est absent ; `payload` = l'état absolu ; `partitionKey = orgId` ; `OutboxService.enqueue({ eventId: randomUUID(), topic: ENTITLEMENT_CHANGED_TOPIC, partitionKey, schemaVersion: 1, payload }, session)`.
- **Ne changer aucune signature publique de contrôleur** : `upsert`/`revoke` renvoient les mêmes types (`UpsertEntitlementResult` / `Entitlement`). Le 201/200 dynamique (`@Res passthrough`) et le RBAC de STORY-033 restent intacts.

### Outbox & relais (mirror `kyc-service/src/kafka/outbox/`)

- **`OutboxService.enqueue(params, session)`** : `outboxModel.create([{...}], { session })` — **exige** la session (un événement `entitlement.changed` ne peut exister qu'à l'intérieur de la transaction qui le produit).
- **`OutboxRelayService`** : `setInterval(intervalMs)` (`unref()`), `tick()` ré-entrant (`running`), `dispatchBatch()` (find `PENDING` trié `createdAt`, `limit(batchSize)`), `dispatchOne()` (publie via `producer.send(topic, [{ key: partitionKey, value: JSON.stringify(payload), headers:{ eventId, schemaVersion } }])` **puis** `status:SENT, sentAt` ; échec ⇒ `$inc attempts` + `lastError`, reste `PENDING`). **Copie fidèle** du relais kyc (mêmes `/* istanbul ignore next */` sur le câblage du minuteur).
- **`KafkaProducerService`** : déjà livré (STORY-031). Vérifier qu'il expose `send(topic, messages)` et se connecte paresseusement ; **ne pas** le réécrire.

### Config (`configuration.ts` + `env.validation.ts`)

```
outbox: {
  relayIntervalMs: parseInt(env.OUTBOX_RELAY_INTERVAL_MS ?? '2000', 10),  // défaut aligné kyc/auth
  batchSize:       parseInt(env.OUTBOX_BATCH_SIZE ?? '50', 10),
}
```
Variables **optionnelles** dans `env.validation.ts` (avec défauts) — ne pas rendre le boot dépendant de nouvelles variables obligatoires.

### Cas limites / points d'attention

- **`assertCatalogCoherence` avant la transaction** : garder la validation 422 **hors** `withTransaction` pour ne pas ouvrir de session inutile et garantir « refus ⇒ zéro événement ». Bien re-tester les 4 cas 422 de STORY-033.
- **Rejeu idempotent = nouvel événement (assumé)** : un `PUT` identique renvoie 200 **et** émet un événement (même état absolu). C'est **voulu** (l'événement reflète une écriture) ; le consommateur est idempotent (état absolu + `eventId`). Ne **pas** tenter de dédupliquer côté producteur.
- **`referentiel` absent** : module sans référentiel (ex. futur `stock`) → **omettre** la clé `referentiel` du payload (ne pas émettre `referentiel: undefined`/`null`), conforme au contrat.
- **`config` volumineux** : la `config` est copiée telle quelle dans le payload (état absolu). Aucune limite en phase 1 (registre léger, C3).
- **Kafka down** : l'`OutboxEvent` reste `PENDING`, l'octroi **réussit** (200/201) — jamais de mutation bloquée par le broker (aligné STORY-022/027).
- **Multi-instance (noté)** : relais mono-instance en phase 1 ; multi-replica ⇒ `findOneAndUpdate` atomique `PENDING→PROCESSING` (hors périmètre).
- **Duplication assumée (K4/C6)** : le patron outbox est **volontairement dupliqué** depuis `kyc-service`/`auth-service` (pas de package partagé en phase 1). Cloner **fidèlement** (schéma, service, relais) plutôt qu'abstraire.
- **`session` sur les lectures** : `findOne(existing)` doit lire **dans la session** pour un `created` cohérent avec l'upsert transactionnel.

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-033** — entitlements `(org × module)` + upsert idempotent + révocation soft + **couture de publication** (`upsert`/`revoke` retournent l'entité, commentaire `// Couture STORY-034`). **✅ Done + vérifié docker 2026-07-13.** Point d'ancrage direct de cette story.
- **STORY-032 / STORY-031** — catalogue + scaffold (`KafkaModule` squelette avec `KafkaProducerService` déjà câblé, `/health`, base `catalog_service` rs0, compose racine + `aud` IdP). **✅ Done + vérifié docker.**

**Patron à cloner (outbox transactionnel + relais + contrat d'événement) :**
- **STORY-027** (`auth-service`) — outbox transactionnel + relais + `KafkaProducerService` : **patron de référence**.
- **STORY-021** (`kyc-service`) — mirror le plus proche : `src/kafka/outbox/` (`OutboxEvent`, `OutboxService.enqueue(session)`, `OutboxRelayService`, `kyc-events.ts` + `KycEventsService`) + mise sous transaction de la mutation (`KycStatusService.withTransaction`). **À répliquer** pour `entitlement.changed`.

**Stories débloquées :**
- **STORY-036** (`bilan-service`) — consumer `entitlement.changed` + read-model + gate `@RequiresBilanAccess` (EPIC-008, sprint 8).
- **admin-panel** / **gateway** / **verticaux** — consommateurs du topic (read-models locaux, retrofit front).

**Différé (décision 2026-07-13) :**
- **C8 / STORY-039** — octroi service-à-service (billing vertical → catalog via client-credentials IdP) : **Module 2 (déc. 2026)**. Requiert un grant `client_credentials` **inexistant** dans l'IdP aujourd'hui ; tranché JIT. **N'impacte pas** le contrat d'événement de cette story.
- **C9** — cascade `identity.org.suspended` : optionnel, activable sans refonte.

**Dépendances externes :** Mongo (base `catalog_service`, **replica set** requis pour `withTransaction` — déjà en place) ; Kafka (broker de la stack racine). **Aucun** MinIO/Redis nouveau.

---

## Definition of Done

- [ ] Code implémenté sur une branche **`MNV-034`** (une branche par story, préfixe `MNV-0XX`), **branchée depuis `dev` + rebasée sur `origin/dev`** avant de coder.
- [ ] Tests **unitaires** verts, couverture ≥ **65/90/90/90** :
  - [ ] `OutboxService.enqueue` — création **sous session**.
  - [ ] `OutboxRelayService` — dispatch (`SENT`), échec (reste `PENDING`, `attempts`/`lastError`), tri `createdAt`, ré-entrance.
  - [ ] `EntitlementEventsService.changed` — payload conforme (état absolu), `referentiel` **omis** si absent, `eventId`/`occurredAt`/`partitionKey=orgId`.
  - [ ] `EntitlementsService` — **atomicité** : commit ⇒ 1 événement + 1 entité ; **rollback ⇒ 0 événement** (mutation ratée) ; 422 (avant transaction) ⇒ 0 événement ; 201/200/404/400 **inchangés**.
- [ ] Tests **e2e** verts (`platform-catalog-service/test/`) : octroi → **1** `entitlement.changed` (`SENT`, clé `orgId`, payload absolu) ; migration → nouvel événement ; révocation → `status:REVOKED` ; refus 422 → **0** événement ; **tous les e2e STORY-033** (RBAC/anti-énum/cohérence/idempotence/404) **restent verts**. JWT RS256 mintés en test ; catalogue seedé via les services STORY-032.
- [ ] **ESLint 0 warning**, build image Docker OK (**4 services** en CI verte).
- [ ] **Vérification docker bout-en-bout** (dernier AC) réalisée et journalisée dans « Revue & validation » : `catalog_service.outbox_events` → `SENT` + messages observés sur le topic `entitlement.changed`.
- [ ] Swagger `/api/docs` inchangé (aucun endpoint ajouté).
- [ ] `/code-review` (niveau ≥ high) passée ; constats traités ou tracés.
- [ ] Story mise à jour (statut) dans `docs/sprint-status.yaml` ; **push sur `prospera-platform-catalog-service`** : branche `MNV-034`, puis **PR vers `dev`** (« Rebase and merge »). Commit/push **après test + validation**.
- [ ] **EPIC-007 clôturé** dans `sprint-status.yaml` (STORY-031→034 done) ; statut du service `platform-catalog-service` mis à jour.

---

## Story Points Breakdown

- **Contrat `entitlement-events.ts` + `EntitlementEventsService` (construction payload absolu) :** 1 point
- **Outbox (schéma + `OutboxService.enqueue(session)` + `OutboxRelayService` + `OutboxModule`) — mirror kyc :** 1,5 point
- **Mise sous transaction de `upsert`/`revoke` (couture STORY-033) sans régresser la logique métier :** 1,5 point
- **Tests unit (atomicité rollback/commit, relais, payload) + e2e (événements sur le bus) + config + vérif docker :** 1 point
- **Total : 5 points**

**Rationale :** aucune brique nouvelle à concevoir — **deux patrons éprouvés docker** (outbox STORY-027, mirror kyc STORY-021) à assembler sur un nouveau topic. Le poids réel tient à l'**atomicité** (mettre sous transaction un `findOneAndUpdate` qui était hors transaction, **sans** régresser la validation 422 / l'idempotence 201/200 / la révocation soft de STORY-033) et à la **preuve par test** (rollback ⇒ 0 événement, commit ⇒ 1 événement). C8 **différé** allège le scope (pas de travail IdP ni d'acceptation service-à-service) ; l'estimation reste à 5 pts, portée par le refactor transactionnel et la vérification bus bout-en-bout. Comparable à STORY-021 (« brancher le bus » du KYC), sans le volet consommateur/e-mails.

---

## Additional Notes

- **Le contrat est final (C8-indépendant)** : différer C8 ne touche **pas** `EntitlementChangedEventV1`. Quand STORY-039 activera l'octroi service-à-service, la publication est déjà en place — seul le **déclencheur** (billing vertical vs admin) et l'**auth de l'appelant** changeront, pas l'événement.
- **État absolu, pas de deltas (C7/P4)** : chaque événement porte l'état complet de `(org × module)` ; c'est la garantie d'idempotence côté consommateur. Ne pas introduire d'événements de type « diff ».
- **Un seul déclencheur d'octroi en phase 1** : l'`admin` (`PLATFORM_ADMIN`). L'octroi par le billing d'un vertical (C8) arrive Module 2.
- **Clôture EPIC-007** : STORY-031 (scaffold ✅) → 032 (catalogue ✅) → 033 (entitlements ✅) → **034 (événements — cette story)**. À l'issue, le `platform-catalog-service` est la **source de vérité diffusée** des entitlements, prête pour `bilan-service` (STORY-036) et l'`admin-panel`.
- **Nommage** : topic `entitlement.changed` ; collection outbox `catalog_service.outbox_events` ; contrat `src/kafka/entitlement-events.ts`.

---

## Progress Tracking

**Historique des statuts :**
- 2026-07-13 : Créée par vivian (BMAD Scrum Master — `/bmad:create-story`). Décision **C8 différé STORY-039** actée à la création.
- 2026-07-13 : Implémentée + vérifiée docker bout-en-bout par Claude (BMAD dev-story). ✅ Done — **clôt l'EPIC-007**.

**Effort réel :** 5 points (conforme à l'estimation).

---

## Revue & validation (2026-07-13)

**Livré**
- **Contrat** `src/kafka/entitlement-events.ts` : `EntitlementChangedEventV1` (v1) conforme à l'architecture + `ENTITLEMENT_CHANGED_TOPIC = 'entitlement.changed'` + `ENTITLEMENT_EVENT_SCHEMA_VERSION`.
- **Transactional outbox** `src/kafka/outbox/` (mirror `kyc-service`) : `OutboxEvent` (schéma `PENDING|SENT`, `attempts`/`lastError`/`sentAt`, index `{status,createdAt}`, collection `outbox_events`) ; `OutboxService.enqueue(params, session)` (création **sous session**) ; `OutboxRelayService` (relais polling trié `createdAt`, publie via `KafkaProducerService.send` avec **clé `orgId`** + headers `eventId`/`schemaVersion`, `PENDING→SENT`, ré-entrance, tolérant broker down) ; `EntitlementEventsService.changed(session, entitlement)` (enveloppe état absolu, `referentiel` omis si absent) ; `OutboxModule` `@Global`.
- **`EntitlementsService` transactionnel** : `upsert`/`revoke` enveloppés dans `connection.startSession()` + `session.withTransaction(…)` ; la mutation `Entitlement` **et** l'`enqueue` outbox partagent la **même session** (rollback ⇒ 0 événement, commit ⇒ les deux). La **validation de cohérence reste hors transaction** (un `422` n'ouvre aucune session ⇒ aucun événement). Logique métier STORY-033 (422/201/200/404/400, RBAC, anti-énumération) **inchangée**.
- **Config** `outbox: { relayIntervalMs (2000), batchSize (100) }` (`configuration.ts` + `env.validation.ts`, optionnels avec défauts) ; `OutboxModule` importé dans `app.module.ts`. **C8 différé STORY-039** (écriture reste `PLATFORM_ADMIN`) ; **C9** hors périmètre.

**Tests**
- **lint 0**, build OK. **184 unit (26 suites)** + **46 e2e (3 suites)** verts. Couverture **100 / 100 / 100 / 100** sur `src/kafka/**` (contrat, outbox, relais, events) et `entitlements/**` inchangé à 100 %.
- Unit : `OutboxService.enqueue` (sous session) ; `OutboxRelayService` (dispatch `SENT` / échec `PENDING`+attempts / tri / ré-entrance) ; `EntitlementEventsService` (payload absolu, `referentiel` omis, `REVOKED`, `config` défaut) ; `EntitlementsService` **atomicité** (upsert/revoke réussis → 1 événement ; 422 → 0 événement ; 404 → 0 événement + `endSession`).
- e2e `entitlements.e2e-spec.ts` : octroi → **1** `entitlement.changed` capté (topic, clé `orgId`, état absolu ACTIVE, `referentiel`, `eventId`/`occurredAt`) ; refus **422** → **aucun** nouvel événement ; révocation → événement **`REVOKED`** ; **tous les e2e STORY-033** (RBAC/anti-énum/cohérence/idempotence/404/401) restent verts.

**Vérification docker bout-en-bout** (stack racine dev : `auth-service:3001`, `platform-catalog-service:3003`, `mongo` rs0, `kafka`) — **OK** :
- `/health` catalog → 200 (mongodb + kafka up).
- login `PLATFORM_ADMIN` (IdP) → **JWT RS256** `aud:[expert-comptable, kyc-service, platform-catalog-service]`, `org:null`, `sub` réel.
- Sur le **service + Mongo rs0 + Kafka réels** (codes frais `story034*`) : octroi `2.0` **201**, rejeu **200**, migration `3.0` **200**, cohérence `9.9` **422**, révocation **200**, sans jeton **401**.
- **`catalog_service.outbox_events`** : exactement **4 lignes** `entitlement.changed` (clé `orgId`) → toutes **`SENT`** (`attempts:0`) : `2.0 ACTIVE`, `2.0 ACTIVE` (rejeu), `3.0 ACTIVE` (migration), `3.0 REVOKED`. Le **422 n'a produit aucune ligne** (4, pas 5) — invariant « refus ⇒ 0 événement » prouvé sur Mongo réel.
- **Topic Kafka `entitlement.changed`** (kafka-console-consumer) : les **4 messages** livrés, **key = orgId**, payloads en **état absolu** (`ACTIVE 2.0` → `ACTIVE 2.0` → `ACTIVE 3.0` → `REVOKED 3.0`), `referentiel` inclus, `schemaVersion:1`. *(Un ERROR kafkajs « does not host this topic-partition » transitoire au 1ᵉʳ produce = course d'auto-création du topic ; non bloquant — les 4 `send` ont réussi, `attempts:0`.)*

**Reste**
- `/code-review` formel (niveau ≥ high).
- Push `MNV-034` + PR vers `dev` sur `prospera-platform-catalog-service` (**stackée sur `MNV-033`** — à merger après STORY-033).
- **EPIC-007 clos** : STORY-031→034 done. Prochain jalon consommateur : **STORY-036** (`bilan-service` read-model + gate).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
*EPIC-007 (platform-catalog-service) clôturé. Prochaine étape : STORY-035/036 (`bilan-service`, EPIC-008).*
