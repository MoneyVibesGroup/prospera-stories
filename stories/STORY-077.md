# STORY-077 : Read-models (entitlement.changed + kyc.status.changed) + gate @RequiresBalanceAccess + idempotence

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique  
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § Exigences non fonctionnelles NFR-A01 ; `architecture-prospera-ecosystem-2026-07-04.md` § Read-models / Événements Kafka  
**Priorité :** Must Have  
**Story Points :** 5  
**Statut :** ready-for-dev  
**Assigné à :** null  
**Créée le :** 2026-07-12  
**Sprint :** 10 (2026-11-05 → 2026-11-19)  
**Service :** `balance-service` (:3007)  
**Couvre :** NFR-A01 (sécurité & accès : gate `@RequiresBalanceAccess`) + NFR-A02 (multi-tenant / isolation `orgId`) — socle read-models KYC/entitlements

> **Fondation de l'autorisation + isolation client du service AMONT.** STORY-076 a posé le squelette ; STORY-077 ajoute les **read-models Kafka** qui alimentent la **gate `@RequiresBalanceAccess`** — décidant qui peut créer/consulter une balance. Elle consomme les **deux événements métier critiques** : `entitlement.changed` (qui a droit au service) et `kyc.status.changed` (qui est `APPROVED`). La balance-service peut ensuite **protéger ses endpoints** et garantir l'**isolation tenant** (aucune donnée ne fuit entre org). Modèle identique à `bilan-service` (EPIC-008/010) et `auth-service` → code de référence pour les 3 adaptateurs.

---

## User Story

En tant qu'**administrateur de plateforme / développeur de balance-service**,  
je veux que **balance-service consomme les événements `entitlement.changed` et `kyc.status.changed` depuis Kafka** et les transforme en **read-models locaux**,  
afin qu'une **gate `@RequiresBalanceAccess`** décide qui peut accéder au service **sans appels réseau** (lecture read-model local, déterministe, rapide).

---

## Description

### Contexte

L'écosystème PROSPERA repose sur Kafka comme **bus d'événements inter-services**. `auth-service` émet `identity.*` (STORY-027) et `platform-catalog-service` émet `entitlement.changed` (STORY-034) ; `kyc-service` émet `kyc.status.changed` (STORY-021). 

`balance-service`, en tant que relying party, ne peut **pas** faire un appel réseau synchrone à chaque requête (violation du modèle événementiel). À la place, elle **consomme les événements** et maintient en local une **réplique d'état** (read-model) du « qui a le droit d'utiliser balance-service ». Cette story **pose ce pattern** identique à celui d'`auth-service` (STORY-029) et `bilan-service` (EPIC-008), les rendant tous trois **cohérents**.

### Périmètre

**Inclus :**

- **Read-models collections (`balance_service` MongoDB)** :
  - `org_profiles` : clé `orgId`, champs `kycStatus` (PENDING/UNDER_REVIEW/APPROVED/REJECTED), `subscriptionActive` (booléen), horodatages.
  - `entitlements` : clé `(orgId, moduleId)`, champs `granted`, `grantedAt`, `revokedAt`.
  - `processed_events` : clé `eventId` (UUID), champs `occurredAt`, `type` (pour idempotence : replay protégé).

- **Kafka consumers** :
  - **`entitlement.changed`** (topic depuis `platform-catalog-service`) : consumer group `balance-service-entitlements` → consomme `entitlement.granted` / `entitlement.revoked` → mutate `entitlements` read-model.
  - **`kyc.status.changed`** (topic depuis `kyc-service`) : consumer group `balance-service-kyc` → consomme transitions KYC → mutate `org_profiles.kycStatus`.
  - **Idempotence** : chaque événement reçu crée une ligne `ProcessedEvent` avec `eventId` unique ; re-traitement le même `eventId` = NOP (doublon détecté).

- **`BalanceAccessGuard` (décorateur `@RequiresBalanceAccess`)** : gate métier calqué sur le `TenantStateGuard` d'`expert-comptable` (STORY-014) et le `@RequiresBilanAccess` de `bilan-service` (EPIC-008). Il :
  - Lit le JWT déjà validé par la `JwtStrategy` (RS256/JWKS, `aud=[balance-service]`, `iss=auth-service` — posée en STORY-076).
  - Extrait l'**`orgId` du claim `org`** (mappé en `tenantId` dans le `TenantContext`, comme STORY-028/029). **Pas de parsing du `sub`** (qui est le userId).
  - Consulte `org_profiles.findOne({orgId})` (read-model local, **aucun appel réseau**).
  - **Palier KYC (appliqué) — deny-by-default** : exige la preuve positive `kycStatus === APPROVED` ; profil absent / `tenantId` null / statut ≠ APPROVED → **403 `KYC_NOT_APPROVED`**.
  - **Palier abonnement (PRÉPARÉ, NON appliqué en sprint 10)** : code `SUBSCRIPTION_REQUIRED` **présent mais désactivé** (point d'extension EPIC-004/paiement, sprint 20) — exactement comme STORY-014. Aucun endpoint ne l'exige tant que le paiement n'est pas livré.
  - Câblé en `APP_GUARD` **après** la `JwtStrategy`/`RolesGuard` (même position que STORY-014).

- **`BalanceHealthIndicator`** : extension de `/health` : une ligne `kafka.health` reflétant l'état du consumer group (Kafka connecté et assigné aux partitions ✅, ou down ❌).

- **EventSourcing pattern** : tous les consumers sont transactionnels (Mongoose session) ; mutation de read-model + insertion `ProcessedEvent` dans **la même transaction** (atomicité).

- **Integration Kafka** :
  - Clients `kafkajs` pour chaque consumer (réutilisé du `KafkaModule` STORY-076)
  - Stratégie `fromBeginning` pour les envs de dev (reconstruction complète) ; offset sauvegardé pour prod
  - Retry + backoff si Kafka down (dégradation contrôlée)
  - Métriques/logs : chaque consommation loggée (event type, orgId, avant/après état)

- **Tests** :
  - Unit : mutation read-model sur chaque type d'événement (grant, revoke, KYC status)
  - Idempotence : re-envoyer même événement 3× → vérif aucune mutation supplémentaire
  - Gate : requête sans JWT → 401 ; JWT valide mais org pas dans read-model → 403 ; org APPROVED → 200
  - e2e : émettre `entitlement.changed` sur Kafka → consommer → vérif mutation dans DB → appel endpoint → gate passe

**Hors périmètre :**

- **Logique de balance** — création/stockage/contrôles de balance → **STORY-101+**.
- **Contrats définitifs d'événements** — les schémas `EntitlementChangedEventV1` etc. sont hérités de `platform-catalog-service`/`kyc-service` ; on les consomme, on ne les définit pas.
- **Re-synchronisation manuelle** (rattrapage offset) → outils d'admin, future story.
- **Télémetrie/observabilité avancée** (traces distribuées) → future story.

### Flux (mise en route)

1. `balance-service` démarre (STORY-076) ; le `KafkaModule` initialise les consumers `balance-service-entitlements` et `balance-service-kyc`.
2. **Consumer de `entitlement.changed`** : au démarrage, depuis le début du topic (dev) ou depuis le dernier offset (prod) :
   - Reçoit un événement `{ type: 'entitlement.granted', orgId, moduleId, grantedAt }` (ex: une nouvelle org vient de s'abonner à `balance-service`)
   - Produit une transaction Mongoose : insert/update `entitlements.findOneAndUpdate({orgId, moduleId}, {granted: true, grantedAt})` + insert `ProcessedEvent({eventId, occurredAt, type})`.
   - Commit la transaction ; consommation réussie.
3. **Consumer de `kyc.status.changed`** : reçoit un événement `{ type: 'kyc.status.changed', orgId, status, previousStatus, reviewedBy }` :
   - Produit une transaction Mongoose : update `org_profiles.findOneAndUpdate({orgId}, {kycStatus: status, …})` + insert `ProcessedEvent`.
4. Un utilisateur authentifié fait `GET /api/v1/balance` (endpoint protégé `@RequiresBalanceAccess`) :
   - `BalanceAccessGuard` extrait l'`orgId` du claim `org` du JWT (via `TenantContext`)
   - Consulte `org_profiles.findOne({orgId})` (pas d'appel réseau)
   - Vérifie `kycStatus === APPROVED` (palier abonnement préparé mais non appliqué)
   - Passe la requête au handler (qui va consulter le contrat de balance STORY-101)
5. `/api/v1/health` affiche `kafka: up` (consumer group assigné et sain).

---

## Acceptance Criteria

- [ ] **Read-models collections** (`org_profiles`, `entitlements`, `processed_events`) existent dans `balance_service` MongoDB ; schémas validés, indexes sur clés (`orgId`, `eventId`).
- [ ] **Kafka consumers** configurés et testés :
  - `balance-service-entitlements` consomme `entitlement.changed` → mutate `entitlements` read-model.
  - `balance-service-kyc` consomme `kyc.status.changed` → mutate `org_profiles` read-model.
  - Chaque mutation est **transactionnelle** (read-model + `ProcessedEvent` atomique).
- [ ] **Idempotence** : re-envoyer le même événement 3× (même `eventId`) → vérif que le read-model n'est muté qu'une fois (déboguer via logs).
- [ ] **Gate `@RequiresBalanceAccess`** (`BalanceAccessGuard`) : décorateur qui protège les endpoints balance-service :
  - Pas de JWT / JWT invalide → **401 Unauthorized**
  - JWT valide, org pas encore synchronisée (pas dans `org_profiles`) → **403 KYC_NOT_APPROVED** (deny-by-default)
  - org avec `kycStatus !== APPROVED` → **403 KYC_NOT_APPROVED**
  - org avec `kycStatus === APPROVED` → **200** (gate passe) — **le palier abonnement n'est PAS appliqué en sprint 10** (code `SUBSCRIPTION_REQUIRED` préparé, désactivé jusqu'au paiement / sprint 20)
- [ ] **`/api/v1/health`** : indicateur Kafka reflète l'état du consumer (connected + assigned ou down/disconnected).
- [ ] **Integration e2e** (docker) : émettre événement Kafka → consommer → requête authentifiée → gate passe → 200. Non-régression : endpoints non-protégés restent `@Public`.
- [ ] **Tests couvrent** : mutation read-model (grant, revoke, KYC status) ; idempotence (3× même événement) ; gate (401/403/200) ; e2e Kafka round-trip.
- [ ] **CI vert** : lint, build, test(+cov) pour `balance-service`.

---

## Technical Notes

### Read-model schemas (MongoDB)

```typescript
// org_profiles
interface OrgProfile {
  _id: ObjectId;
  orgId: string;                    // unique index
  kycStatus: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  subscriptionActive: boolean;
  kycRejectionReason?: string;      // si REJECTED
  reviewedBy?: string;              // userId
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// entitlements
interface Entitlement {
  _id: ObjectId;
  orgId: string;
  moduleId: string;                 // ex: 'balance-service', 'bilan-service'
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// processed_events (idempotence)
interface ProcessedEvent {
  _id: ObjectId;
  eventId: string;                  // UUID — unique index
  type: string;                     // 'entitlement.granted' etc.
  orgId: string;
  occurredAt: Date;
  processedAt: Date;
  ttl?: number;                     // TTL index 30 days
}

db.org_profiles.createIndex({ orgId: 1 }, { unique: true });
db.entitlements.createIndex({ orgId: 1, moduleId: 1 }, { unique: true });
db.processed_events.createIndex({ eventId: 1 }, { unique: true });
db.processed_events.createIndex({ processedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30j
```

### Kafka consumers pattern

```typescript
// Dans KafkaModule ou nouveau EventConsumersModule
async startConsumers() {
  // Consumer 1: entitlement.changed
  const entitlementConsumer = kafka.consumer({ groupId: 'balance-service-entitlements' });
  await entitlementConsumer.connect();
  await entitlementConsumer.subscribe({ topic: 'entitlement.changed' });
  await entitlementConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      await this.onEntitlementChanged(event);
    }
  });

  // Consumer 2: kyc.status.changed
  const kycConsumer = kafka.consumer({ groupId: 'balance-service-kyc' });
  await kycConsumer.connect();
  await kycConsumer.subscribe({ topic: 'kyc.status.changed' });
  await kycConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      await this.onKycStatusChanged(event);
    }
  });
}

// Traitement transactionnel
async onEntitlementChanged(event: EntitlementChangedEventV1) {
  const session = await this.mongoConnection.startSession();
  try {
    await session.withTransaction(async () => {
      // Vérifier doublon
      const exists = await this.processedEventsModel.findOne({ eventId: event.eventId }, {}, { session });
      if (exists) return; // Idempotence NOP

      // Mutate read-model
      await this.entitlementsModel.updateOne(
        { orgId: event.orgId, moduleId: 'balance-service' },
        {
          $set: { granted: event.type === 'granted', grantedAt: event.occurredAt },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true, session }
      );

      // Marker traité
      await this.processedEventsModel.insertOne(
        { eventId: event.eventId, type: event.type, orgId: event.orgId, occurredAt: event.occurredAt, processedAt: new Date() },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}
```

### Gate implementation

```typescript
@Injectable()
export class BalanceAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // peuplé par la JwtStrategy (STORY-076) après validation RS256/JWKS
    if (!user) throw new UnauthorizedException();

    // L'orgId vient du claim `org` (mappé en tenantId), PAS d'un split du sub (= userId)
    const orgId = user.org ?? user.tenantId;
    if (!orgId) throw new ForbiddenException('KYC_NOT_APPROVED'); // pas de tenant → deny-by-default

    const orgProfile = await this.orgProfilesModel.findOne({ orgId });

    // Palier KYC — APPLIQUÉ (deny-by-default : preuve positive APPROVED requise)
    if (!orgProfile || orgProfile.kycStatus !== 'APPROVED') {
      throw new ForbiddenException('KYC_NOT_APPROVED');
    }

    // Palier abonnement — PRÉPARÉ mais NON appliqué en sprint 10 (point d'extension EPIC-004 / paiement).
    // NB : ne PAS activer avant le paiement (sprint 20) — aligné sur STORY-014.
    // if (this.subscriptionEnforced && !orgProfile.subscriptionActive) {
    //   throw new ForbiddenException('SUBSCRIPTION_REQUIRED');
    // }

    return true;
  }
}

// Usage sur endpoint
@Get('/balance')
@RequiresBalanceAccess()
async getBalance(@TenantContext() org: string) {
  // org est isolé tenant ; requête sûre
}
```

---

## Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| Événement perdu (lag consumer) | Consumer `fromBeginning` en dev ; offset sauvegardé en prod ; alerting sur lag |
| Read-model désynchronisé de la source | Tests d'idempotence ; re-consommation `fromBeginning` possible en admin |
| Gate trop permissive (data leak) | Palier KYC en deny-by-default (`kycStatus === APPROVED` requis, profil absent → 403) ; tests e2e d'isolation org ; abonnement = point d'extension non appliqué (sprint 20) |
| Kafka down → balance-service degradée | Logging clair ; fallback dégradé (requêtes échouent 503) ; pas de crash du service |

---

## Definition of Done

- [ ] Read-models schemas + indexes créés dans `balance_service`
- [ ] Consumers Kafka configurés et testés unitairement (mutation read-model, idempotence)
- [ ] Gate `@RequiresBalanceAccess` implémentée et testée (401/403/200)
- [ ] Indicateur Kafka dans `/health`
- [ ] e2e docker : événement Kafka → consommer → requête → gate passe
- [ ] Tests couvrent : mutation, idempotence, gate, e2e (coverage ≥ 65%)
- [ ] Non-régression : STORY-076 e2e toujours vert

---

**Status:** ready-for-dev  
**Created:** 2026-07-12  
**Dependencies:** STORY-076 (scaffold), STORY-077 dépend de STORY-034 (platform-catalog emit entitlement.changed) et STORY-021 (kyc-service emit kyc.status.changed) — au niveau du Kafka, pas code  
**Reference:** `prd-atelier-balance-2026-07-12.md` § NFR-A01
