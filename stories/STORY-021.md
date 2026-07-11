# STORY-021 : Événements `kyc.status.changed` (outbox Kafka) + read-model EC + e-mails

**Epic :** EPIC-003 — Capacité partagée KYC (extraite en micro-service, rebasée sur `auth-service`)
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` (v1.1) **§Contrat d'événements `kyc.status.changed` (v1) — source de vérité** · `architecture-prospera-ecosystem-2026-07-04.md` §Contrats d'événements (transport Kafka + outbox)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-10. Producteur outbox transactionnel (`kyc-service`) + consommateur read-model/e-mails (`expert-comptable`). **2 bugs trouvés en docker & corrigés** (jobId BullMQ `:`→`__` ; `MailModule` orphelin + collision de file Redis inter-services). Lève la régression de STORY-020. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-10
**Sprint :** 6
**Service :** **les deux** — `kyc-service` (producteur) + `expert-comptable` (consommateur)
**Couvre :** FR-005 / FR-006 (notifications KYC)

> **Story qui « branche le bus » du KYC.** STORY-020 a extrait la capacité KYC dans `kyc-service` mais **sans** publier d'événement : le read-model KYC d'`expert-comptable` (`OrgProfile.kycStatus`) est **figé** et l'e-mail de soumission **muet** (régression temporaire documentée). STORY-021 la lève : `kyc-service` **publie** `kyc.status.changed` (via un **outbox transactionnel** → Kafka, patron STORY-027) à chaque transition ; `expert-comptable` **consomme** (nouveau *consumer group*), met à jour son **read-model** et **envoie les e-mails** (il possède `Users`/`Mailer`). Le KYC devient ainsi **event-driven** de bout en bout, prêt pour `TenantStateGuard` (STORY-014) et la revue admin (STORY-013).

---

## User Story

En tant qu'**`expert-comptable`**,
je veux être **notifié des changements de statut KYC** de mes cabinets (via le bus Kafka),
afin de **tenir à jour mon état d'accès** (read-model local) et **d'envoyer les e-mails** au cabinet, **sans interroger `kyc-service`** à chaque requête.

---

## Description

### Contexte

Le contrat d'événements `kyc.status.changed` (v1) est défini dans `architecture-kyc-service-2026-07-03.md` §Contrat d'événements — **source de vérité** : état **absolu**, clé de partition `orgId`, livraison **at-least-once** (consommateur idempotent obligatoire), publication **après** persistance de la transition (cible : **transactional outbox**). L'écosystème dispose déjà de **tous les patrons** nécessaires, éprouvés docker :

- **Producteur outbox** — `auth-service` (STORY-027) : `OutboxService.enqueue(params, session)` (écrit l'événement **dans la transaction** de la mutation), `OutboxRelayService` (relais *polling* `PENDING → SENT`, at-least-once, tolérant Kafka down), `KafkaProducerService`. STORY-021 **réplique ce patron dans `kyc-service`**.
- **Consommateur idempotent** — `expert-comptable` (STORY-029) : consumer group kafkajs, marqueur `ProcessedIdentityEvent` (idempotence, TTL), read-models. STORY-021 **ajoute un second consumer group** (`expert-comptable-kyc`) sur le topic `kyc.status.changed`.
- **Résolutions & e-mails** — `expert-comptable` a déjà `IdentityReadModelService.resolveUserContact(userId)` et `resolveOrgAdminEmails(orgId)`, la file `MAIL_QUEUE` (BullMQ), le worker `MailProcessor` et le template `kyc-submitted.hbs`.

STORY-021 est donc une story d'**assemblage discipliné** de patrons connus, pas d'invention : le risque tient à l'**atomicité** (transition + outbox dans une transaction) et à l'**idempotence** (rejeu Kafka → ni double écriture ni double e-mail).

### Scope

**Dans le périmètre — `kyc-service` (producteur)**
- **Outbox transactionnel** (`kafka/outbox/` : `OutboxEvent` schéma, `OutboxService.enqueue(session)`, `OutboxRelayService`, `KafkaProducerService`) calqué sur `auth-service`.
- **Contrat `kyc-events.ts`** : `KycStatusChangedEventV1` (identique à l'architecture) + constante topic `kyc.status.changed`.
- **`KycStatusService` transactionnel** : la transition `TenantKycProfile` **et** l'`enqueue` outbox se font dans **une seule transaction Mongo** (session). Réintroduit `actorUserId` (uploadeur) dans `onDocumentSubmitted` (claim `actorUserId` du contrat).
- Publication déclenchée pour **toute** transition (`UNDER_REVIEW` aujourd'hui ; `APPROVED`/`REJECTED` émis « gratuitement » dès que STORY-013 les déclenchera).

**Dans le périmètre — `expert-comptable` (consommateur)**
- **`KycEventsConsumer`** (consumer group `expert-comptable-kyc`) sur `kyc.status.changed`.
- **Read-model** : `OrgProfileService.updateKycStatus` **étendu** (état absolu : `kycStatus`, `kycReviewedAt`, `kycReviewedBy`, `$unset kycRejectionReason` si absent).
- **Idempotence** : marqueur `ProcessedKycEvent` (`eventId` unique, TTL 30 j) posé **avant** commit d'offset.
- **E-mails** (file `MAIL_QUEUE`, `jobId` déterministe `${eventId}:${jobName}`) : `UNDER_REVIEW` → soumission (template existant, `actorUserId`) ; `APPROVED` → **nouveau** template vers les `TENANT_ADMIN` (`resolveOrgAdminEmails`) ; `REJECTED` → **nouveau** template avec motif (`resolveUserContact`).

**Hors périmètre**
- **Déclenchement** des transitions `APPROVED`/`REJECTED` (endpoints de revue admin) → **STORY-013**. STORY-021 implémente le consommateur **complet** (3 flux) ; seul `UNDER_REVIEW` est réellement émis d'ici STORY-013.
- `TenantStateGuard` / matrice d'accès (lecture du read-model) → **STORY-014**.
- Re-soumission après rejet (`REJECTED → UNDER_REVIEW`) → **STORY-014** (côté `kyc-service`).

### User Flow (soumission → notification)

1. Un cabinet téléverse RCCM puis CFE sur `kyc-service` (`:3002`). Au 2ᵉ document, `KycStatusService` transitionne `PENDING_DOCUMENTS → UNDER_REVIEW` **et** enfile l'événement dans l'**outbox** — **dans la même transaction**.
2. Le `OutboxRelayService` de `kyc-service` publie `kyc.status.changed` sur Kafka (clé = `orgId`), puis marque l'événement `SENT`.
3. Le `KycEventsConsumer` d'`expert-comptable` reçoit l'événement, **dédup** (`ProcessedKycEvent`), applique le read-model (`OrgProfile.kycStatus = UNDER_REVIEW`) et enfile l'e-mail de **soumission** (`actorUserId`).
4. Le `MailProcessor` envoie l'e-mail (Mailhog en dev). Un **rejeu** du même événement ne reproduit **ni** écriture **ni** e-mail.

---

## Acceptance Criteria

- [ ] **Contrat (`kyc-service`)** : `kafka/kyc-events.ts` définit `KycStatusChangedEventV1` **conforme à l'architecture** (`schemaVersion:1`, `eventId`, `orgId`, `previousStatus`, `status`, `rejectionReason?`, `reviewedBy?`, `actorUserId?`, `occurredAt`) et la constante topic `kyc.status.changed`.
- [ ] **Outbox transactionnel (`kyc-service`)** calqué sur `auth-service` : `OutboxEvent` (statut `PENDING`/`SENT`, `attempts`, `lastError`), `OutboxService.enqueue(params, session)` (création **sous session**), `OutboxRelayService` (relais *polling* trié `createdAt`, publie avec **clé de partition `orgId`** + header `eventId`/`schemaVersion`, `PENDING→SENT`, ré-entrance protégée), `KafkaProducerService` (connexion paresseuse, tolérante au broker down).
- [ ] **Transition atomique (`kyc-service`)** : `KycStatusService` ouvre une **transaction Mongo** ; la mise à jour de `TenantKycProfile` **et** l'`enqueue` outbox sont **dans la même session** — un rollback n'émet aucun événement, un commit persiste les deux. `onDocumentSubmitted(actorUserId)` réintroduit l'uploadeur ; l'événement `UNDER_REVIEW` porte `actorUserId`.
- [ ] **Consumer (`expert-comptable`)** : `KycEventsConsumer`, consumer group **`expert-comptable-kyc`** (isolé du group `identity.*`), abonné à `kyc.status.changed` ; démarrage tolérant au broker absent (réessai en tâche de fond, aligné STORY-029).
- [ ] **Read-model (`expert-comptable`)** : `OrgProfileService.updateKycStatus` **étendu** applique un **état absolu** — `$set { kycStatus, kycReviewedAt?, kycReviewedBy? }`, `$unset kycRejectionReason` quand le payload n'en porte pas ; idempotent (rejouable).
- [ ] **Idempotence (`expert-comptable`)** : marqueur **`ProcessedKycEvent`** (`eventId` unique, `processedAt`, TTL 30 j) posé **avant** le commit d'offset ; **rejouer 2× le même événement ne produit ni double écriture du read-model ni double e-mail** (**test automatisé exigé**).
- [ ] **E-mails (`expert-comptable`)** — enfilés par le consommateur sur `MAIL_QUEUE`, `jobId` déterministe `${eventId}:${jobName}` :
  - `status === UNDER_REVIEW` → `send-kyc-submitted-email { userId: actorUserId }` (template **existant** `kyc-submitted.hbs`) ;
  - `status === APPROVED` → `send-kyc-approved-email` vers **tous les `TENANT_ADMIN` actifs** de l'org (`resolveOrgAdminEmails`), **nouveau** template `kyc-approved.hbs` ;
  - `status === REJECTED` → `send-kyc-rejected-email { userId, rejectionReason }` (**nouveau** template `kyc-rejected.hbs`, motif inclus, FR-006).
- [ ] **Isolation** : l'événement d'un cabinet n'affecte que **son** read-model / ses destinataires (`orgId`).
- [ ] **Résilience Kafka** : un broker momentanément indisponible laisse l'événement `PENDING` côté producteur (repart au retour) et ne bloque aucune transition ; le boot des deux services reste tolérant (aucun crash).
- [ ] **Régression levée** : après STORY-021, upload RCCM+CFE sur `:3002` → l'`OrgProfile.kycStatus` d'`expert-comptable` passe à `UNDER_REVIEW` **et** l'e-mail de soumission part (Mailhog) — la régression temporaire de STORY-020 est close.
- [ ] **CI** : la matrice 3 services reste verte (lint → tests+couverture → e2e → build).

---

## Technical Notes

### `kyc-service` — producteur (mirroir `auth-service/src/kafka/outbox/`)

```
kyc-service/src/kafka/
├── kafka.module.ts            # existant (client @Global) — y ajouter producer + outbox
├── kafka.constants.ts         # existant (KAFKA_CLIENT)
├── kafka-producer.service.ts  # NOUVEAU (mirror auth-service) : connect() paresseux, send(topic, msgs)
├── kyc-events.ts              # NOUVEAU : KycStatusChangedEventV1 + TOPIC 'kyc.status.changed'
└── outbox/
    ├── outbox-event.schema.ts # NOUVEAU (mirror) : eventId, topic, partitionKey, schemaVersion, payload, status, attempts, lastError, sentAt
    ├── outbox.service.ts      # NOUVEAU : enqueue(params, session)  ← SOUS TRANSACTION
    ├── outbox-relay.service.ts# NOUVEAU : relais polling PENDING→SENT
    └── outbox.module.ts       # NOUVEAU
```

- **Transaction** (`KycStatusService`) : ouvrir une `ClientSession` (`connection.startSession()` / `withTransaction`), passer la session à `TenantKycProfileRepository.updateStatus(..., session)` **et** à `OutboxService.enqueue(event, session)`. `TenantKycProfileRepository` doit accepter une `session` optionnelle sur `updateStatus` (et `getOrCreate`). Le payload de l'événement : `{ schemaVersion:1, eventId: randomUUID(), orgId, previousStatus, status, actorUserId, occurredAt: new Date().toISOString() }` (`rejectionReason`/`reviewedBy` seront renseignés par STORY-013).
- **Config** : ajouter `outbox: { relayIntervalMs, batchSize }` (défauts alignés `auth-service`) dans `configuration.ts` + `env.validation` (optionnels avec défauts). `KafkaProducerService` fermé proprement (`onModuleDestroy`).
- **`onDocumentSubmitted(actorUserId: string)`** : réintroduire le paramètre (retiré en STORY-020) et le propager dans l'événement. Mettre à jour le seul appelant (`KycDocumentsService.upload`, qui a déjà `userId`) et le spec associé.

### `expert-comptable` — consommateur (mirroir `identity` STORY-029)

```
expert-comptable/src/modules/kyc-events/            # NOUVEAU module (ou dans identity/)
├── kyc-events-consumer.bootstrap.ts   # consumer group 'expert-comptable-kyc' sur 'kyc.status.changed'
├── kyc-events.processor.ts            # applique read-model + enfile e-mails + marqueur
├── schemas/processed-kyc-event.schema.ts  # eventId unique, processedAt, TTL 30j
└── kyc-events.module.ts
```

- **Ordre de traitement** (par message) : (1) si `ProcessedKycEvent{eventId}` existe → **skip** ; (2) `OrgProfileService.updateKycStatus` (état absolu) ; (3) enfiler l'e-mail selon `status` ; (4) insérer `ProcessedKycEvent` ; puis commit offset. (Insérer le marqueur en dernier garantit qu'un crash avant l'insert rejoue proprement — idempotent car état absolu + `jobId` déterministe.)
- **`OrgProfileService.updateKycStatus`** : signature étendue `updateKycStatus(orgId, { kycStatus, kycReviewedAt?, kycReviewedBy?, kycRejectionReason? })` avec `$set`/`$unset` absolu. Adapter le spec.
- **Destinataires** : `IdentityReadModelService.resolveUserContact(actorUserId)` (submitted/rejected) et `resolveOrgAdminEmails(orgId)` (approved) — **déjà disponibles** (STORY-029).
- **Mail** : ajouter dans `mail.constants.ts` les jobs `SEND_KYC_APPROVED_EMAIL_JOB` / `SEND_KYC_REJECTED_EMAIL_JOB` (+ types de payload) ; ajouter les `case` dans `mail.processor.ts` ; créer `templates/kyc-approved.hbs` et `templates/kyc-rejected.hbs` (⚠️ vérifier que les `.hbs` sont bien **packagés dans `dist`** — cf. correctif STORY-025).

### Sémantique & garanties (rappel architecture)

- **Clé Kafka = `orgId`** → ordre garanti par organisation. **at-least-once** → idempotence obligatoire (marqueur `eventId`).
- **État absolu** (pas de delta) → read-model idempotent par construction ; `previousStatus` sert au diagnostic, pas au calcul.
- **Fan-out** natif : un futur vertical (bilan-service) créera son propre consumer group sur `kyc.status.changed` — **aucun effort producteur**.

### Cas limites / points d'attention

- **Perte d'événement si Kafka down au moment T** : l'outbox garde l'événement `PENDING` → rattrapé au retour du broker (pas de transaction distribuée Kafka↔Mongo). Aligné STORY-027.
- **Double e-mail sur rejeu très tardif** (après purge `removeOnComplete` **et** expiration TTL du marqueur) : accepté (e-mails informatifs, sans secret) — cf. architecture Risque 2.
- **Templates `.hbs`** non packagés dans `dist` : régression connue (STORY-025) — inclure dans `nest-cli.json assets` / vérifier au build docker.
- **Multi-instance** : relais outbox mono-instance (phase 1) ; un passage multi-replica nécessitera un `findOneAndUpdate` atomique `PENDING→PROCESSING` (noté, hors périmètre).

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-020** — `kyc-service` (KafkaModule client + `TenantKycProfile` + transitions) : la base à instrumenter.
- **STORY-027** — outbox transactionnel + relais + `KafkaProducerService` (`auth-service`) : **patron à répliquer**.
- **STORY-029** — read-models d'identité + consumer kafkajs + `ProcessedIdentityEvent` + `IdentityReadModelService.resolveUserContact`/`resolveOrgAdminEmails` (`expert-comptable`) : **patron + résolutions à réutiliser**.
- **STORY-022** — bus Kafka (KRaft) dans le compose racine.

**Stories débloquées / à suivre :**
- **STORY-013** — revue admin globale : ses transitions `APPROVED`/`REJECTED` **émettront via l'outbox** de cette story (consommateur déjà prêt).
- **STORY-014** — `TenantStateGuard` : lit le read-model `OrgProfile.kycStatus` que cette story réalimente.

**Dépendances externes :** Kafka + Redis (déjà dans le compose racine).

---

## Definition of Done

- [ ] Code implémenté sur une branche `STORY-021` (une branche par story).
- [ ] Tests unitaires écrits/étendus et **verts**, couverture ≥ seuils **65/90/90/90** des deux services :
  - [ ] `kyc-service` : `OutboxService.enqueue` (sous session), `OutboxRelayService` (dispatch/erreur/tri), `KycStatusService` (transition + enqueue atomiques, `actorUserId` propagé), contrat `kyc-events`.
  - [ ] `expert-comptable` : `KycEventsProcessor` (read-model absolu, sélection d'e-mail par statut, **idempotence rejeu 2×**), `OrgProfileService.updateKycStatus` étendu.
- [ ] Tests e2e verts (consommateur bout-en-bout avec faux Kafka/mail, rejeu idempotent).
- [ ] **ESLint 0 warning**, build OK sur les **deux** services (CI matrice 3 services verte).
- [ ] **Vérification docker bout-en-bout** (voir §Additional) réalisée et journalisée dans « Revue & validation ».
- [ ] `/code-review` (niveau ≥ high) passée ; constats traités ou tracés.
- [ ] Statut mis à jour dans `docs/sprint-status.yaml` ; commit **sur demande**.

---

## Story Points Breakdown

- **`kyc-service` producteur** : outbox (schéma+service+relay) + `KafkaProducerService` + contrat + transition transactionnelle : **2 points**
- **`expert-comptable` consommateur** : consumer group + read-model absolu + `ProcessedKycEvent` (idempotence) : **1,5 point**
- **E-mails** : 2 nouveaux templates + jobs + `case` processor + résolutions destinataires : **1 point**
- **Tests (idempotence, atomicité) + vérification docker cross-service** : **0,5 point**
- **Total : 5 points**

**Rationale :** aucune brique nouvelle à concevoir — deux patrons éprouvés (outbox STORY-027, consumer STORY-029) à assembler sur un nouveau topic, avec deux points durs (atomicité transition↔outbox, idempotence du rejeu prouvée par test). Story « les deux services » mais volume maîtrisé.

---

## Additional Notes

### Vérification docker attendue (bout-en-bout)

Sur la stack racine (`docker compose up`) :
1. `register` IdP → `verify` → `login` → JWT RS256 (cf. STORY-020) ;
2. upload RCCM+CFE sur `:3002` → transition `UNDER_REVIEW` → **1 événement** `kyc.status.changed` produit (outbox `SENT`) ;
3. `expert-comptable` : `OrgProfile.kycStatus` passe à `UNDER_REVIEW` **et** e-mail de soumission dans **Mailhog** (`:8025`) ;
4. **Rejeu** (offsets `--from-beginning` / redémarrage consumer) → **aucun** doublon (read-model inchangé, pas de 2ᵉ e-mail) ;
5. **Kafka down** au moment de l'upload → événement `PENDING` → **broker up** → `SENT` → read-model + e-mail rattrapés ;
6. (préfiguration STORY-013) forcer une transition `APPROVED`/`REJECTED` → e-mail correspondant aux `TENANT_ADMIN` / au motif.

### Contrat (référence, ne pas diverger)

```typescript
export interface KycStatusChangedEventV1 {
  schemaVersion: 1;
  eventId: string;            // UUID v4 — clé d'idempotence consommateur
  orgId: string;              // = clé de partition Kafka
  previousStatus: KycStatus;
  status: KycStatus;          // UNDER_REVIEW | APPROVED | REJECTED
  rejectionReason?: string;   // ssi REJECTED (STORY-013)
  reviewedBy?: string;        // userId PLATFORM_ADMIN (STORY-013)
  actorUserId?: string;       // uploadeur (transitions vers UNDER_REVIEW)
  occurredAt: string;         // ISO-8601 UTC
}
```

---

## Progress Tracking

**Historique des statuts :**
- 2026-07-10 : Créée par vivian (BMAD Scrum Master — `/bmad:create-story`).
- 2026-07-10 : Implémentée + vérifiée docker bout-en-bout par Claude (BMAD dev-story). ✅ Done.

**Effort réel :** 5 points (conforme à l'estimation).

---

## Revue & validation (2026-07-10)

**Livré — `kyc-service` (producteur)**
- **Transactional outbox** calqué sur `auth-service` (STORY-027) : `OutboxEvent` (schéma), `OutboxService.enqueue(session)`, `OutboxRelayService` (relais polling `PENDING→SENT`, clé de partition `orgId`, tolérant Kafka down), `KafkaProducerService` (ajouté à `KafkaModule`), `OutboxModule` `@Global`.
- **Contrat** `kafka/kyc-events.ts` (`KycStatusChangedEventV1` v1) + `KycEventsService.statusChanged(session, …)` (eventId/occurredAt, champs optionnels omis).
- **`KycStatusService` transactionnel** : `TenantKycProfileRepository.transition(from→to, extra, session)` **conditionnelle** (dédup à la source si concurrence) **+** enqueue outbox **dans la même transaction** (`withTransaction`). `onDocumentSubmitted(actorUserId)` réintroduit. Config `outbox` + env ajoutés.

**Livré — `expert-comptable` (consommateur)**
- **`KycEventsConsumer`** (group `expert-comptable-kyc`, tolérant broker down) + **`KycEventsProjectionService`** : transaction { `ProcessedKycEvent` (eventId unique, TTL 30j) → read-model **absolu** }, puis e-mails **après commit** (jobId déterministe).
- **Read-model** : `OrgProfileService.updateKycStatus` étendu (`$set` présents / `$unset` absents) ; champ **`kycReviewedBy`** ajouté au schéma `OrgProfile`.
- **E-mails** : `SEND_KYC_{SUBMITTED,APPROVED,REJECTED}_EMAIL_JOB` + templates `kyc-approved.hbs`/`kyc-rejected.hbs` + `MailerService.sendKyc{Approved,Rejected}Email` + `MailProcessor` (submitted→uploadeur ; approved/rejected→`TENANT_ADMIN` via `resolveOrgAdminEmails`). Consommateur **complet** (3 flux) — seul `UNDER_REVIEW` émis d'ici STORY-013.

**🐞 Bugs trouvés en vérification docker & corrigés**
1. **jobId BullMQ** : `${eventId}:${jobName}` rejeté (« Custom Id cannot contain : ») → séparateur **`__`**. *(L'architecture spécifiait `:` — invalide pour BullMQ.)*
2. **`MailModule` orphelin + collision de file Redis** : `MailModule` n'était **importé nulle part** (le worker `MailProcessor` ne démarrait pas → e-mails jamais consommés) ; de plus, `expert-comptable` et `auth-service` partagent Redis avec des files de **même nom** (`mail`), donc le worker d'`auth-service` **volait** les jobs KYC (« job inconnu »). Corrigé : `KycEventsModule` **importe `MailModule`** (charge le worker + réexporte la file) **et** files renommées **`expert-comptable-mail`/`expert-comptable-system`** (unicité inter-services ; le `prefix` BullMQ écarté car `@nestjs/bullmq` ne le propage pas aux workers `@Processor`).

**Tests**
- `kyc-service` : **lint 0**, build OK, **117 unit + 21 e2e**, cov **99.82 / 88.39 / 100 / 99.8**.
- `expert-comptable` : **lint 0**, build OK, **128 unit + 18 e2e**, cov **98.9 / 87.78 / 98.23 / 98.79**. Idempotence du rejeu prouvée par test unitaire (marqueur en doublon → ni écriture ni e-mail).

**Vérification docker bout-en-bout** (stack racine 3 apps + mongo rs0 + kafka + minio + mailhog) :
- register IdP → verify → login → upload RCCM+CFE (`:3002`) → transition `UNDER_REVIEW` ;
- **`kyc_service.outbox_events`** : 1 événement `kyc.status.changed` (clé `orgId`) → **`SENT`** ;
- **`expert_comptable.org_profiles`** : `kycStatus` = **`UNDER_REVIEW`** (état absolu, champs de revue `$unset`) ;
- **`processed_kyc_events`** : marqueur d'idempotence écrit ;
- **Mailhog** : e-mail de **soumission** délivré (log `MailProcessor` « soumission KYC envoyé »).
- **Régression STORY-020 levée** : read-model réalimenté + e-mail émis.

**Reste**
- `/code-review` formel (niveau ≥ high).
- Suites : **STORY-013** (revue admin — ses transitions `APPROVED`/`REJECTED` s'émettront **via l'outbox** de cette story) puis **STORY-014** (`TenantStateGuard`).
- Commit **sur demande** (branche `STORY-021` ; `kyc-service` = dépôt à initialiser).
- *Note archi* : le contrat spécifiait `jobId` séparé par `:` — corrigé en `__` (contrainte BullMQ) ; à refléter dans `architecture-kyc-service` si mise à jour.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
*Prochaine étape : `/bmad:dev-story STORY-021` (lève la régression temporaire de STORY-020), puis STORY-013 (revue admin) et STORY-014 (TenantStateGuard).*
