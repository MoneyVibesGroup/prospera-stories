# STORY-036 : Read-models locaux + consumers Kafka (`entitlement.changed` + `kyc.status.changed`) + idempotence

**Epic :** EPIC-008 — bilan-service (squelette d'intégration : scaffold + read-models entitlement/KYC + gate `@RequiresBilanAccess` + `ReferentielLoader`)
**Réf. architecture :** `architecture-bilan-service-2026-07-07.md` (v1.0, §Consommateurs d'événements · §Architecture des données / read-models `OrgBilanEntitlement` + `OrgKycStatus` · §Gate d'accès) · `architecture-catalog-service-2026-07-07.md` §Contrat d'événements (`entitlement.changed`, **source de vérité**) · `architecture-kyc-service-2026-07-03.md` §Contrat d'événements (`kyc.status.changed`, **source de vérité**) · décisions **P4** (autonomie de fonctionnement), **B3** (gate zéro appel réseau), **C7** (état absolu, pas de delta)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-14. Deux consumers Kafka (`entitlement.changed` group `bilan-entitlement`, `kyc.status.changed` group `bilan-kyc`) → read-models locaux idempotents `OrgBilanEntitlement` + `OrgKycStatus` (marqueur partagé `ProcessedEvent`, transaction Mongo, état absolu, filtre `moduleCode == "bilan"`). Pur consommateur (aucune outbox/e-mail). lint 0, **82 unit (16 suites) + 8 e2e** verts, cov **98.7/86.17/98.66/98.57**. `/code-review` (high) : 3 constats, #1 (poison pill `orgId` invalide) **corrigé** & re-vérifié docker. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-14
**Sprint :** 8
**Service :** bilan-service (`:3004`) — base Mongo dédiée `bilan_service`
**Couvre :** aucun FR du PRD `expert-comptable` (capacité **partagée**, décision **D10/P7**) — pose les **read-models locaux** prérequis de la gate `@RequiresBilanAccess` (STORY-037) et du chargement de référentiel par tenant (STORY-038)

> **2ᵉ story d'EPIC-008 — le socle événementiel.** STORY-035 a livré un `bilan-service` **démarrable** (relying party RS256/JWKS, `/health`, `KafkaModule` **squelette client-seul** sans aucun consumer). Cette story branche les **deux consommateurs Kafka** dont `bilan-service` a besoin — `entitlement.changed` (de `platform-catalog-service`) et `kyc.status.changed` (de `kyc-service`) — et projette chacun dans un **read-model local** (`OrgBilanEntitlement`, `OrgKycStatus`), avec **idempotence** (`ProcessedEvent { eventId }`). Ces read-models rendent la gate d'accès (STORY-037) et le `ReferentielLoader` par tenant (STORY-038) **entièrement locaux** — **zéro appel réseau** à auth/kyc/catalog sur le chemin chaud (décisions **P4/B3**). `bilan-service` reste **pur consommateur** : il ne produit **aucun** événement (pas d'outbox). On **calque** le patron consommateur déjà éprouvé d'`expert-comptable` (`KycEventsModule` : `*-consumer.bootstrap` + `*.projection.service` + marqueur `ProcessedEvent`, STORY-021/029), **sans** la partie e-mail (`bilan-service` ne possède ni `Mailer` ni BullMQ).

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux que `bilan-service` **consomme** `entitlement.changed` et `kyc.status.changed` et maintienne des **read-models locaux** (`OrgBilanEntitlement`, `OrgKycStatus`) de manière **idempotente**,
afin que la **gate d'accès** (STORY-037) et le **chargement de référentiel par tenant** (STORY-038) s'appuient uniquement sur des données **locales** — quelle version/référentiel servir, l'accès est-il actif, le KYC de l'org est-il `APPROVED` — **sans jamais appeler** `catalog-service` ni `kyc-service` sur le chemin chaud.

---

## Description

### Contexte

`bilan-service` est une **capacité partagée** (décision **D10/P7**) qui ne **possède** ni l'identité, ni le KYC, ni l'entitlement. Il en tient des **read-models** alimentés par le bus Kafka (patron CQRS inter-services déjà en place pour `expert-comptable`, STORY-021/029) :

- **`entitlement.changed`** (`platform-catalog-service`, **unique producteur**, publié via **transactional outbox** STORY-034) → **quelle version de code et quel référentiel** servir à chaque org, et si l'accès est **actif** (`ACTIVE` / `SUSPENDED` / `REVOKED`). `bilan-service` ne retient que les événements dont **`moduleCode == "bilan"`**.
- **`kyc.status.changed`** (`kyc-service`, **unique producteur**, outbox STORY-021) → le **statut KYC** de l'org, nécessaire au **gate d'accès** (ex-`TenantStateGuard`/FR-007, désormais rejoué dans `bilan-service`).

Les deux contrats suivent le même patron : **état absolu** (la valeur finale ne dépend jamais de l'ordre d'arrivée, **C7**), `eventId` (UUID v4) pour l'**idempotence côté consommateur**, `schemaVersion` pour l'évolution, `orgId` en **clé de partition**. La livraison est **at-least-once** (l'outxbox publie *puis* marque `SENT` ; un crash rejoue) : le consommateur **doit** être idempotent.

Cette story **ne réimplémente rien** : elle **duplique** le patron consommateur d'`expert-comptable` (`KycEventsModule`) — un `*-consumer.bootstrap.ts` (I/O Kafka pure, tolérance panne au boot, exclu de couverture) qui délègue à un `*.projection.service.ts` (idempotence + read-model, testable unitairement). **Différence majeure** avec `expert-comptable` : `bilan-service` **n'envoie aucun e-mail** et **n'importe pas BullMQ/MailModule** — la projection se réduit à *(marqueur d'idempotence + upsert de read-model)* dans une transaction Mongo. Aucun producteur, aucune outbox : `bilan-service` est un **puits** d'événements en phase 1.

### Périmètre

**Dans le périmètre**

- **Read-model `OrgBilanEntitlement`** (schéma Mongoose, `organizationId` **unique**) : `versionCode`, `referentiel?` (`{ code, version }`), `config`, `status` (`EntitlementStatus`) — alimenté par `entitlement.changed` filtré `moduleCode == "bilan"`.
- **Read-model `OrgKycStatus`** (schéma Mongoose, `organizationId` **unique**) : `status` (`KycStatus`) — alimenté par `kyc.status.changed`.
- **Marqueur d'idempotence `ProcessedEvent { eventId }`** (collection dédiée, index `eventId` **unique**, TTL 30 j) — partagé par les deux consommateurs (l'`eventId` est un **UUID v4 globalement unique**).
- **Contrats consommateur (miroirs)** : `entitlement-events.ts` (miroir de `platform-catalog-service`) et `kyc-events.ts` (miroir de `kyc-service`), documentés « source de vérité = doc d'archi du producteur ».
- **Enums miroirs** dans `common/enums` : `EntitlementStatus` (`ACTIVE | SUSPENDED | REVOKED`) et `KycStatus` (`PENDING_DOCUMENTS | UNDER_REVIEW | APPROVED | REJECTED`) — ce dernier avait été **explicitement exclu** du scaffold STORY-035, il arrive ici.
- **`EntitlementConsumer`** (`*-consumer.bootstrap.ts`, consumer group **`bilan-entitlement`**) : `subscribe` `entitlement.changed`, `fromBeginning: true`, tolérance panne au boot (retry en arrière-plan, le boot HTTP ne casse jamais), délègue à `EntitlementProjectionService`.
- **`KycStatusConsumer`** (`*-consumer.bootstrap.ts`, consumer group **`bilan-kyc`**) : `subscribe` `kyc.status.changed`, même patron, délègue à `KycStatusProjectionService`.
- **`EntitlementProjectionService`** : filtre `moduleCode == "bilan"` (sinon ignore, offset avancé) ; **transaction Mongo** = insertion du marqueur `ProcessedEvent(eventId)` **puis** upsert **absolu** de `OrgBilanEntitlement` ; rejeu (même `eventId`) → violation d'unicité → transaction abandonnée, événement **ignoré**.
- **`KycStatusProjectionService`** : même transaction (marqueur puis upsert absolu de `OrgKycStatus`).
- **Config Kafka** : ajout de `entitlementGroupId` (`KAFKA_ENTITLEMENT_GROUP_ID`, défaut `bilan-entitlement`) et `kycGroupId` (`KAFKA_KYC_GROUP_ID`, défaut `bilan-kyc`) à `KafkaConfig` + `.env.example` + bloc compose.
- **Tests** : unitaires exhaustifs des deux projections (idempotence, état absolu, filtre `moduleCode`, doublon → ignoré, enveloppe invalide → ignorée) ; e2e Kafka bout-en-bout (produire un événement → read-model à jour ; rejouer le même `eventId` → aucun double effet).

**Hors périmètre (stories suivantes)**

- **Gate `@RequiresBilanAccess`** (lecture de ces read-models : `emailVerified` + `OrgKycStatus == APPROVED` + `OrgBilanEntitlement.status == ACTIVE`, codes `EMAIL_NOT_VERIFIED` / `KYC_NOT_APPROVED` / `BILAN_NOT_ENTITLED`) → **STORY-037**.
- **`ReferentielLoader`** (résolution `(code, version)` depuis `OrgBilanEntitlement` → téléchargement d'artefact + vérification checksum + cache) + moteur squelette → **STORY-038**.
- **Endpoints métier Bilan** et **schémas du domaine comptable** (écritures, états financiers) → **EPIC-009+** (PRD/tech-spec Bilan, **B8**).
- **Aucun producteur / aucune outbox** : `bilan-service` ne publie aucun événement en phase 1.
- **Aucun e-mail / BullMQ / Redis** : `bilan-service` ne possède pas `Mailer` (contrairement à `expert-comptable`).
- **Routage multi-version au gateway** (`orgId → bilan-v1/v2` via ce read-model) : concerne l'edge/ops, hors service.

### Flux (mise à jour d'un read-model)

1. Une org paie sur un vertical → le billing octroie l'entitlement `bilan` sur `catalog-service` → `catalog-service` publie `entitlement.changed` `{ moduleCode: "bilan", versionCode: "2.0", referentiel: {code:"syscohada-revise", version:"2.1"}, status: ACTIVE, eventId: <uuid> }` (via outbox, STORY-034).
2. `EntitlementConsumer` (group `bilan-entitlement`) reçoit le message → `EntitlementProjectionService.apply(eventId, payload)` : `moduleCode == "bilan"` ✓ → **transaction** : insère `ProcessedEvent(eventId)` **puis** upsert `OrgBilanEntitlement(orgId → 2.0, syscohada-revise@2.1, ACTIVE, config)` → **commit**.
3. `kyc-service` approuve le KYC de l'org → publie `kyc.status.changed` `{ status: APPROVED, eventId: <uuid> }` → `KycStatusConsumer` (group `bilan-kyc`) → upsert `OrgKycStatus(orgId → APPROVED)` en transaction idempotente.
4. **Rejeu** (crash producteur/consommateur, at-least-once) : le même `eventId` réapparaît → l'insertion du marqueur viole l'unicité → transaction abandonnée → **aucune** double écriture. Read-model inchangé.
5. **Révocation** : `entitlement.changed` `{ status: REVOKED }` → upsert absolu `OrgBilanEntitlement.status = REVOKED` (la ligne est conservée avec son statut ; la gate STORY-037 refusera l'accès).
6. **Événement d'un autre module** (`moduleCode: "stock"`) → `EntitlementProjectionService` **ignore** (offset avancé, aucun read-model écrit, aucun marqueur posé).

---

## Acceptance Criteria

- [ ] **Read-model `OrgBilanEntitlement`** (schéma Mongoose, `timestamps: true`) : `organizationId` (`ObjectId`, **unique**), `versionCode` (string), `referentiel?` (`{ code, version }`), `config` (objet, défaut `{}`), `status` (`EntitlementStatus`). Index `{ organizationId: 1 }` **unique**.
- [ ] **Read-model `OrgKycStatus`** (schéma Mongoose, `timestamps: true`) : `organizationId` (`ObjectId`, **unique**), `status` (`KycStatus`). Index `{ organizationId: 1 }` **unique**.
- [ ] **Marqueur `ProcessedEvent`** : `eventId` (string, **unique**), `processedAt` (Date). Index `{ eventId: 1 }` unique (idempotence) + index TTL `{ processedAt: 1 }` `expireAfterSeconds = 30 j`. **Partagé** par les deux consommateurs (l'`eventId` UUID v4 est globalement unique).
- [ ] **Enums** ajoutés à `common/enums` : `EntitlementStatus` (`ACTIVE | SUSPENDED | REVOKED`, miroir catalog) et `KycStatus` (`PENDING_DOCUMENTS | UNDER_REVIEW | APPROVED | REJECTED`, miroir kyc).
- [ ] **Contrats consommateur (miroirs)** : `entitlement-events.ts` (`ENTITLEMENT_CHANGED_TOPIC`, `EntitlementChangedEventV1`, miroir strict de `platform-catalog-service/src/kafka/entitlement-events.ts`) et `kyc-events.ts` (`KYC_STATUS_CHANGED_TOPIC`, `KycStatusChangedEventV1`, miroir de `kyc-service`). En-tête de fichier : « **source de vérité = doc d'archi du producteur** ».
- [ ] **`EntitlementConsumer`** (bootstrap, `OnApplicationBootstrap`/`OnModuleDestroy`) : consumer group **`bilan-entitlement`**, `subscribe({ topics: [entitlement.changed], fromBeginning: true })`, **tolérance panne au boot** (un broker indisponible ne fait **jamais** échouer le boot HTTP ; retry périodique en arrière-plan, `timer.unref()`). Valide l'enveloppe (corps lisible, `eventId` présent, `occurredAt` valide) puis délègue à `EntitlementProjectionService`. **Aucune logique métier** (exclu de couverture, patron `*bootstrap*`).
- [ ] **`KycStatusConsumer`** : idem, consumer group **`bilan-kyc`**, topic `kyc.status.changed`, délègue à `KycStatusProjectionService`.
- [ ] **`EntitlementProjectionService.apply(eventId, payload)`** :
  - **filtre `moduleCode == "bilan"`** — tout autre module est **ignoré** (aucun marqueur, aucun read-model) ;
  - **transaction Mongo** : `ProcessedEvent.create([{ eventId }], { session })` **puis** upsert **absolu** de `OrgBilanEntitlement` (`$set` des champs présents, `$unset` `referentiel` s'il est absent — le module `bilan` en a un, mais l'absolu reste correct) keyé `organizationId` ;
  - **duplicate key** (`11000`) sur le marqueur → `abortTransaction` → retourne « déjà traité » (event ignoré, log `debug`) ;
  - autre erreur (Mongo down…) → **propagée** pour laisser Kafka **rejouer** (at-least-once).
- [ ] **`KycStatusProjectionService.apply(eventId, payload)`** : même transaction (marqueur puis upsert absolu de `OrgKycStatus.status`).
- [ ] **Enveloppe invalide ignorée** (offset avancé, pas de rejeu infini) : message sans corps / JSON illisible / sans `eventId` / `occurredAt` invalide → **warn + ignoré** (aligné sur `KycEventsConsumer` d'`expert-comptable`).
- [ ] **Config Kafka** : `KafkaConfig` gagne `entitlementGroupId` (`KAFKA_ENTITLEMENT_GROUP_ID`, défaut `bilan-entitlement`) et `kycGroupId` (`KAFKA_KYC_GROUP_ID`, défaut `bilan-kyc`). `.env.example`, bloc compose (`docker-compose.yml` racine + override) et CI mis à jour.
- [ ] **`/health` inchangé** (`mongodb` + `kafka` up) ; l'ajout de consommateurs ne dégrade pas la sonde. **Aucun** endpoint métier ajouté (la lecture des read-models = gate STORY-037).
- [ ] **Tests unitaires** (seuils Jest tenus) : les deux projections — 1er passage applique, rejeu (même `eventId`) **ignoré** sans double écriture, état **absolu** (`REVOKED`/nouveau référentiel écrasent), filtre `moduleCode != "bilan"` ignoré, `updateKycStatus` absolu, erreur non-duplicate propagée. Schémas/index. Les bootstraps `*consumer*` **exclus de couverture** (I/O Kafka).
- [ ] **Tests e2e** (Kafka réel de test ou testcontainer selon le socle CI) : produire `entitlement.changed`(bilan) → `OrgBilanEntitlement` créé ; produire `kyc.status.changed`(APPROVED) → `OrgKycStatus` créé ; **rejouer le même `eventId`** → read-model inchangé, une seule ligne ; `entitlement.changed`(stock) → **aucun** read-model bilan.
- [ ] **ESLint 0 warning**, build image `runtime` OK, CI verte (matrice 5 services + base `bilan_service_test`).
- [ ] **Vérification docker bout-en-bout** : stack `auth:3001` + `catalog:3003` + `kyc:3002` + `bilan:3004` + `mongo` rs0 + `kafka` → octroi entitlement `bilan` (PLATFORM_ADMIN sur catalog) puis transition KYC (sur kyc) → `bilan_service.orgbilanentitlements` et `bilan_service.orgkycstatuses` reflètent l'état absolu ; `bilan_service.processed_events` contient un marqueur par `eventId` ; rejeu (relance producteur) → aucune ligne dupliquée. Consignée en §Revue & validation.

---

## Technical Notes

### Composants

- **Backend :** `bilan-service` — nouveau module `modules/read-models/` (schémas + projections + consumers) + enums `common/enums` + contrats `kafka/events/`.
- **Base de données :** `bilan_service` — nouvelles collections `orgbilanentitlements`, `orgkycstatuses`, `processed_events`.
- **Bus :** Kafka — 2 consumer groups **distincts** (`bilan-entitlement`, `bilan-kyc`) : fan-out isolé, offsets/rattrapage indépendants. **Aucun** producteur.

### Arborescence (ajouts sur le scaffold STORY-035)

```
bilan-service/src/
├── common/enums/
│   ├── entitlement-status.enum.ts     # miroir catalog (ACTIVE|SUSPENDED|REVOKED)
│   └── kyc-status.enum.ts             # miroir kyc  (PENDING_DOCUMENTS|UNDER_REVIEW|APPROVED|REJECTED)
├── kafka/
│   ├── kafka.module.ts                # (existant) client @Global — inchangé
│   └── events/
│       ├── entitlement-events.ts      # miroir contrat producteur catalog
│       └── kyc-events.ts              # miroir contrat producteur kyc
└── modules/read-models/
    ├── read-models.module.ts          # MongooseModule.forFeature + providers
    ├── schemas/
    │   ├── org-bilan-entitlement.schema.ts
    │   ├── org-kyc-status.schema.ts
    │   └── processed-event.schema.ts  # marqueur idempotence partagé
    ├── entitlement.projection.service.ts   (+ .spec)
    ├── entitlement-consumer.bootstrap.ts   (exclu couverture)
    ├── kyc-status.projection.service.ts    (+ .spec)
    └── kyc-status-consumer.bootstrap.ts    (exclu couverture)
```

> **Idempotence — marqueur partagé.** L'architecture (§Consommateurs d'événements) prescrit un unique `ProcessedEvent { eventId }`. L'`eventId` étant un **UUID v4** (garanti unique par les deux producteurs), une **seule** collection `processed_events` couvre les deux topics sans risque de collision — plus simple que les collections par-topic d'`expert-comptable` (`processed_kyc_events`/`processed_identity_events`), justifié car `bilan-service` n'a **aucun** effet de bord e-mail à dédupliquer séparément.

### Projection idempotente (patron `expert-comptable` sans e-mail)

```typescript
// entitlement.projection.service.ts (résumé)
async apply(eventId: string, e: EntitlementChangedEventV1): Promise<void> {
  if (e.moduleCode !== 'bilan') return;               // fan-in filtré (autres modules ignorés)
  const session = await this.connection.startSession();
  try {
    session.startTransaction();
    try {
      await this.processed.create([{ eventId }], { session });   // marqueur d'idempotence
    } catch (err) {
      if (isDuplicateKeyError(err)) { await session.abortTransaction(); return; }  // rejeu → ignoré
      throw err;
    }
    await this.model.updateOne(                          // upsert ABSOLU keyé orgId
      { organizationId: new Types.ObjectId(e.orgId) },
      {
        $set: { versionCode: e.versionCode, config: e.config ?? {}, status: e.status,
                ...(e.referentiel ? { referentiel: e.referentiel } : {}) },
        ...(e.referentiel ? {} : { $unset: { referentiel: '' } }),
      },
      { upsert: true, session },
    );
    await session.commitTransaction();
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    throw err;                                           // laisse Kafka rejouer (at-least-once)
  } finally {
    await session.endSession();
  }
}
```

`KycStatusProjectionService.apply` est le jumeau (upsert `{ status }` seul). La **transaction** exige un replica set — `mongo` tourne en `rs0` dans le compose (déjà requis par les outbox STORY-021/034).

### Consommateur (bootstrap, tolérance panne — copie de `KycEventsConsumer`)

- `OnApplicationBootstrap` → `tryStart()` ; si échec (broker down), `setInterval(CONSUMER_RETRY_MS)` en arrière-plan (`unref()`), le boot HTTP **n'échoue jamais** (aligné STORY-029). `run({ eachMessage })` → validation d'enveloppe → `projection.apply(eventId, payload)`. Une **donnée invalide** est ignorée (offset avancé) ; une **erreur de traitement** est propagée (rejeu Kafka, projection idempotente). `OnModuleDestroy` → `clearInterval` + `consumer.disconnect()`.
- `eventId` lu depuis `message.headers.eventId` **ou** `payload.eventId` (les producteurs mettent les deux ; header prioritaire).
- **Deux groups distincts** : chaque consommateur crée son propre group → rattrapage indépendant, pas d'interférence de commit d'offset entre topics.

### Config / env / compose

```typescript
// configuration.ts — KafkaConfig gagne :
entitlementGroupId: process.env.KAFKA_ENTITLEMENT_GROUP_ID ?? 'bilan-entitlement',
kycGroupId:         process.env.KAFKA_KYC_GROUP_ID         ?? 'bilan-kyc',
```

`.env.example` + bloc `bilan-service` du `docker-compose.yml` racine : ajouter `KAFKA_ENTITLEMENT_GROUP_ID` / `KAFKA_KYC_GROUP_ID` (valeurs par défaut suffisantes en dev). **Aucun** changement des autres services.

### Sécurité

- Les read-models ne contiennent **aucun secret** : seulement des identifiants opaques (`orgId`), le triplet `(module × version × référentiel)`, la config d'usage et des statuts — conforme au contrat producteur (payload sans secret).
- **`bilan-service` ne fait pas confiance à un `orgId` arbitraire** : les read-models sont alimentés **uniquement** par des événements Kafka signés en amont (producteurs = sources de vérité). Aucun endpoint d'écriture n'est exposé.
- L'exploitation de ces read-models (autorisation d'accès) est **différée à la gate STORY-037** ; cette story se limite à les **maintenir fidèlement**.

### Cas limites / points d'attention

- **⚠️ `mongo` replica set requis.** Les projections utilisent une transaction (marqueur + upsert atomiques) → `mongo` doit tourner en `rs0` (déjà le cas dans le compose racine depuis les outbox STORY-021/034). Sans replica set, `startTransaction` échoue.
- **État absolu (C7).** Les upserts **ne dépendent jamais de l'ordre** : un `entitlement.changed`(REVOKED) suivi (out-of-order) d'un ancien `ACTIVE` **ne doit pas** réactiver — mais Kafka **ordonne par partition (clé `orgId`)**, donc les événements d'une même org arrivent en ordre. On documente cet invariant ; aucun champ `version`/`sequence` n'est requis en phase 1 (l'ordre par partition suffit ; le producteur outbox préserve l'ordre d'enfilement).
- **`referentiel` absent.** Le module `bilan` a toujours un référentiel, mais le contrat le rend optionnel (`stock` n'en a pas) : l'upsert absolu `$unset` le champ si l'événement l'omet (jamais de référentiel « fantôme » d'un état antérieur).
- **`moduleCode` non-`bilan`.** Ignoré **avant** toute écriture (ni marqueur, ni read-model) : le topic `entitlement.changed` est **multi-modules** ; `bilan-service` ne pose pas de marqueur pour des événements qu'il n'applique pas (le marqueur ne sert qu'à dédupliquer ce qu'il **applique**).
- **Auto-création de topic** (observée STORY-034) : au 1er démarrage, l'`ERROR kafkajs` transitoire de course d'auto-création de topic est **non bloquant** (le retry du bootstrap rattrape).
- **`fromBeginning: true`** : un nouveau consumer group rejoue l'historique → l'idempotence (`ProcessedEvent`) garantit qu'un rejeu de l'historique ne produit **aucun** double effet ; les read-models convergent vers l'état absolu courant.

---

## Dependencies

**Stories prérequises :**
- **STORY-035** (scaffold `bilan-service` + `KafkaModule` client + `common/`) — **indispensable** : cette story y ajoute consumers + read-models.
- **STORY-034** (`platform-catalog-service` : producteur `entitlement.changed` via outbox) — **source** du 1er topic (déjà **done**, vérifié docker).
- **STORY-021** (`kyc-service` : producteur `kyc.status.changed` via outbox) — **source** du 2ᵉ topic (déjà **done**).

**Stories bloquées (débloquées par celle-ci) :**
- **STORY-037** (gate `@RequiresBilanAccess`) — **lit** `OrgKycStatus` + `OrgBilanEntitlement`.
- **STORY-038** (`ReferentielLoader`) — résout `(code, version)` depuis `OrgBilanEntitlement`.
- **FE-B00** (shell UI module Bilan) — via la gate STORY-037.

**Dépendances externes :** aucune (Mongo `rs0` + Kafka déjà dans le compose racine).

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche **`MNV-036`** (branchée depuis `dev`, rebasée sur `origin/dev` **avant** de coder).
- [ ] Tests unitaires écrits et verts (seuils Jest respectés) :
  - [ ] `EntitlementProjectionService` : 1er passage upsert absolu ; rejeu même `eventId` → ignoré (aucune 2ᵉ écriture) ; `moduleCode != "bilan"` → ignoré ; `REVOKED` écrase `ACTIVE` ; changement de référentiel écrase ; `referentiel` absent → `$unset` ; erreur non-duplicate propagée.
  - [ ] `KycStatusProjectionService` : upsert absolu du statut ; idempotence ; erreur propagée.
  - [ ] Schémas : index `unique` sur `organizationId` (les deux read-models) et `eventId` (marqueur) + TTL.
- [ ] Tests e2e verts :
  - [ ] `entitlement.changed`(bilan, ACTIVE) produit → `OrgBilanEntitlement` reflète version/référentiel/statut ; rejeu même `eventId` → 1 seule ligne.
  - [ ] `kyc.status.changed`(APPROVED) produit → `OrgKycStatus.status = APPROVED`.
  - [ ] `entitlement.changed`(stock) → **aucun** read-model bilan écrit.
- [ ] ESLint **0 warning**, build image `runtime` OK, `/health` toujours 200.
- [ ] **Vérification docker bout-en-bout** réalisée (octroi/révocation entitlement + transition KYC réels via catalog/kyc → read-models bilan à jour + marqueurs `processed_events` ; rejeu → aucun doublon) et consignée en §Revue & validation.
- [ ] CI verte (matrice 5 services + `bilan_service_test`).
- [ ] `/code-review` passé.
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR `MNV-036(bilan-service): …` ouverte puis intégrée sur `dev` en **Rebase and merge**.
- [ ] `sprint-status.yaml` mis à jour (STORY-036 → done, note de vérification) ; statut `bilan-service` mis à jour.

---

## Story Points Breakdown

- **Backend :** 4 points (2 read-models + 2 consumers/projections idempotents en transaction + enums/contrats miroirs + config/compose).
- **Frontend :** 0 point.
- **Testing :** 1 point (unitaires exhaustifs des projections + e2e Kafka bout-en-bout + vérif docker).
- **Total :** 5 points.

**Rationale :** duplication disciplinée d'un patron consommateur **déjà éprouvé** (`expert-comptable` KycEventsModule), allégé (pas d'e-mail/BullMQ), **× 2 topics** ; la vraie exigence est la **rigueur d'idempotence et d'état absolu** (transaction Mongo, filtre `moduleCode`, rejeu). Conforme à l'estimation du sprint-plan (5 pts). La gate (STORY-037) et le loader (STORY-038) portent la complexité suivante.

---

## Additional Notes

- **Pur consommateur.** `bilan-service` ne produit **aucun** événement en phase 1 — pas d'outbox, pas de `KafkaProducerService` (retiré dès STORY-035). Le seul flux sortant futur (états financiers) relèvera d'EPIC-009+.
- **CQRS inter-services cohérent.** Le patron (`entitlement.changed`/`kyc.status.changed` → read-model local + idempotence) est identique à celui d'`expert-comptable` (STORY-021/029) et de la doc d'archi — un lecteur qui connaît un service connaît l'autre. Facteur K4 (duplication assumée ; factorisation en lib différée).
- **Alignement architecture.** Noms de schémas (`OrgBilanEntitlement`, `OrgKycStatus`), champs et index **repris tels quels** de `architecture-bilan-service-2026-07-07.md` §Architecture des données — pas de dérive de contrat.

---

## Progress Tracking

**Status History :**
- 2026-07-14 : Créée par Scrum Master (BMAD create-story)

**Actual Effort :** TBD (renseigné pendant/après l'implémentation)

---

## Revue & validation

### Implémentation

Patron consommateur **calqué sur `expert-comptable` `KycEventsModule`** (STORY-021/029), **allégé** (pas d'e-mail/BullMQ — `bilan-service` est *pur consommateur*, aucune outbox) et **× 2 topics** :

- **Read-models** `OrgBilanEntitlement` (`entitlement.changed`, filtré `moduleCode == "bilan"`) et `OrgKycStatus` (`kyc.status.changed`), keyés `organizationId` (unique), **upsert en état absolu** (`$set` présents / `$unset` `referentiel` absent) — schémas repris de `architecture-bilan-service-2026-07-07.md`.
- **Idempotence** : marqueur **partagé** `ProcessedEvent { eventId unique, TTL 30j }` inséré dans la **même transaction Mongo** que l'upsert (rejeu même `eventId` → violation d'unicité → transaction abandonnée → événement ignoré). Collection unique justifiée (UUID v4 global, aucun effet de bord à dédupliquer séparément).
- **Consumers** `EntitlementConsumer` (group `bilan-entitlement`) + `KycStatusConsumer` (group `bilan-kyc`), **tolérance panne au boot** (broker down ⇒ retry arrière-plan, boot HTTP jamais cassé), validation d'enveloppe (corps lisible, `eventId`, `occurredAt`, **`orgId` ObjectId valide**), délégation aux projections (I/O Kafka seule ⇒ exclus de couverture).
- Contrats **miroirs** (`kafka/events/entitlement-events.ts`, `kyc-events.ts`) + enums miroirs (`EntitlementStatus`, `KycStatus`) ; config `entitlementGroupId`/`kycGroupId` + env + bloc compose racine.

### Qualité

- **ESLint** : 0 warning (`--max-warnings 0`).
- **Tests unitaires** : 82 tests / 16 suites verts. **Couverture 98.7 % stmts / 86.17 % branches / 98.66 % funcs / 98.57 % lines** (seuils 90/65/90/90 tenus). Projections testées : upsert absolu, filtre `moduleCode`, `$unset` référentiel, config défaut, `REVOKED`, **idempotence au rejeu**, erreurs (duplicate → ignoré / autre → propagée).
- **E2E** : 8 tests / 2 suites verts (health + whoami inchangés). L'intégration Kafka réelle est prouvée par la **vérification docker** (patron du projet : STORY-021/034).

### Vérification docker bout-en-bout (2026-07-14)

Stack `mongo` (rs0) + `kafka` + `auth-service:3001` + `platform-catalog-service:3003` + `kyc-service:3002` + `bilan-service:3004` (override target `base`, hot-reload) ; consumers `bilan-entitlement` + `bilan-kyc` joints à leurs groups au boot.

- **Entitlement réel** : login `PLATFORM_ADMIN` (IdP, `aud` incl. `bilan-service`) → `PUT /catalog/entitlements/{org}/bilan` (201) → `entitlement.changed` (outbox catalog) → `bilan_service.orgbilanentitlements` = `{org, versionCode 2.0, referentiel syscohada-revise@2.1, config, status ACTIVE}` (état absolu).
- **Mise à jour + révocation absolues** : `PUT bilan@3.0` (200) puis `DELETE` (200) → **une seule ligne**, `versionCode 3.0`, `status REVOKED` (upsert keyé `orgId`, aucune duplication).
- **KYC réel** : `bilan_service.orgkycstatuses` alimenté par les `kyc.status.changed` historiques de `kyc-service` (orgs `UNDER_REVIEW`).
- **Filtre `moduleCode`** : les `entitlement.changed` du module `story034bilan` sont **ignorés** (« ignoré (non-bilan) »), **aucun** marqueur posé.
- **Idempotence** : deux messages Kafka même `eventId` (`ACTIVE` puis `REVOKED`) → 1er appliqué, 2ᵉ **« déjà traité — ignoré (idempotence) »**, read-model **inchangé** (`ACTIVE`, pas `REVOKED`), marqueur **unique**.

### `/code-review` (high) — 3 constats

- **#1 (corrigé) — poison pill `orgId` invalide** : un `orgId` non-ObjectId faisait lever `BSONError` par `new Types.ObjectId()` dans la projection → erreur remontée, offset jamais commité, **rejeu Kafka infini bloquant la partition** (reproduit en docker : offset figé, événements suivants jamais traités). **Fix** : garde-fou `Types.ObjectId.isValid(payload.orgId)` dans la validation d'enveloppe des deux consumers (comme `eventId`/`occurredAt`) → donnée invalide *warn + offset avancé*. **Re-vérifié docker** : message `orgId` invalide « ignoré », la partition **repart**, les événements valides suivants s'appliquent.
- **#2 (accepté) — corps JSON `null`** : un corps se parsant en `null`/scalaire déréférencerait `payload.occurredAt` hors du `try` → même classe de poison ; **laissé tel quel** car calqué **verbatim** sur le patron consommateur éprouvé d'`expert-comptable` (les producteurs n'émettent jamais de corps `null` ; le fix propre exige un *narrowing* `unknown`).
- **#3 (accepté) — duplication** : projections + bootstraps quasi identiques ; **duplication intentionnelle (K4)** miroir d'`expert-comptable` (2 projections/2 bootstraps distincts), factorisation en lib différée au prochain usage.

### Points d'attention

- **`mongo` replica set (`rs0`) requis** : les projections utilisent une transaction (marqueur + upsert atomiques) — déjà en place dans le compose racine (outbox STORY-021/034).
- **Ordre par partition** : Kafka ordonne par clé `orgId` ⇒ pas de champ `sequence` requis (l'état absolu + ordre-par-partition suffisent en phase 1).
- **Aucune régression** sur les 4 services existants (ajout d'un consommateur seul ; `AUTH_AUDIENCE` de l'IdP inchangé).

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
