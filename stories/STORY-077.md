# STORY-077 : Read-models (entitlement.changed + kyc.status.changed) + gate @RequiresBalanceAccess + idempotence

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § NFR-A01/NFR-A02 ; `architecture-prospera-ecosystem-2026-07-04.md` § Read-models / Événements Kafka ; `architecture-bilan-service-2026-07-07.md` § Consommateurs d'événements + § Gate d'accès (**patron de référence livré**)
**Priorité :** Must Have
**Story Points :** 8 <!-- ⬆️ RÉVISÉ 5→8 à la rédaction (2026-07-17) : le travail équivalent DÉJÀ LIVRÉ dans bilan-service a coûté 8 pts en 2 stories — STORY-036 (read-models + consumers + idempotence, 5) + STORY-037 (gate 3 paliers, 3). STORY-077 fait les deux. 4ᵉ révision 5→8 du programme (cf. 104/105/106). -->
**Statut :** done
**completed_date :** 2026-07-17
**Assigné à :** null
**Créée le :** 2026-07-12
**Révisée le :** 2026-07-17 (re-cadrage sur le code réel — cf. § Écarts de rédaction)
**Sprint :** 11 (2026-11-19 → 2026-12-03) <!-- déplacée S10 → S11 par D15 (2026-07-16) -->
**Service :** `balance-service` (:3007)
**Couvre :** NFR-A01 (sécurité & accès : gate `@RequiresBalanceAccess`) + NFR-A02 (multi-tenant / isolation `orgId`)

> **Fondation de l'autorisation du service AMONT.** STORY-076 a posé le squelette (relying party RS256/JWKS, `KafkaModule`, `/health`, `/whoami`) et a laissé les **hooks inertes** que cette story vient brancher. STORY-077 ajoute les **read-models Kafka** qui alimentent la gate `@RequiresBalanceAccess` : `entitlement.changed` (qui a droit au module `balance`) et `kyc.status.changed` (qui est `APPROVED`). Décision **locale**, **sans appel réseau** (P4/B3).
>
> ⚠️ **Ce n'est pas une story de conception : c'est une TRANSCRIPTION.** `bilan-service` a livré et vérifié ce patron à l'identique (STORY-036/037, 2026-07-14). Le code de référence — contrats, projections, idempotence, gate — est à **lire et transposer**, pas à réinventer. Tout écart vs `bilan-service/src/modules/read-models/` doit être justifié.

---

## User Story

En tant qu'**organisation cliente de l'Atelier Balance**,
je veux que **`balance-service` connaisse localement mon statut KYC et mon droit d'usage du module `balance`**,
afin que **seules les organisations e-mail vérifié + KYC approuvé + entitlement actif accèdent au service**, sans qu'aucune requête n'aille interroger `auth`/`kyc`/`catalog` sur le chemin chaud.

---

## Description

### Contexte

`balance-service` est un *relying party* : il ne possède ni l'identité, ni le KYC, ni les entitlements. Le JWT ne porte **jamais** le statut KYC ni l'entitlement (invariant #3) — ils changent par des actions tierces (revue admin, octroi catalog) sans réémission de jeton. Le service **consomme donc les événements** et maintient une **réplique d'état locale** (read-model), patron identique à `expert-comptable` (STORY-029), `kyc-service` (STORY-021) et **`bilan-service` (STORY-036/037)**.

### Périmètre

**Inclus :**

- **Contrats d'événements (côté consommateur)** — `src/kafka/events/` : miroirs **stricts** des producteurs, copiés de `bilan-service` :
  - `entitlement-events.ts` : `ENTITLEMENT_CHANGED_TOPIC` + `EntitlementChangedEventV1` (producteur `platform-catalog-service`, STORY-034).
  - `kyc-events.ts` : `KYC_STATUS_CHANGED_TOPIC` + `KycStatusChangedEventV1` (producteur `kyc-service`, STORY-021).
- **Enum `EntitlementStatus`** (`ACTIVE | SUSPENDED | REVOKED`) dans `src/common/enums/` — **absent** de `balance-service` (à créer, miroir du catalog). L'enum `KycStatus` **existe déjà** (hook inerte posé par 076) — il devient consommé.
- **Read-models** (`balance_service`) — module `src/modules/read-models/` :
  - `OrgKycStatus` : keyé `organizationId` (**`Types.ObjectId`**, index unique), champ `status`.
  - `OrgBalanceEntitlement` : keyé `organizationId` (index unique), champs `versionCode`, `referentiel?`, `config`, `status`.
  - `ProcessedEvent` : `eventId` unique + `processedAt` (TTL 30 j), collection `processed_events` — **partagée** par les deux consumers.
- **Projections idempotentes** (`*.projection.service.ts`) : toute la logique, **zéro I/O Kafka** → unitairement testables.
  - Filtre fan-in `moduleCode === 'balance'` **avant** toute écriture (on ne déduplique que ce qu'on applique).
  - **État absolu (C7)** : `$set` des champs présents, `$unset` de `referentiel` s'il est absent.
  - **Idempotence par insertion-d'abord** : marqueur `ProcessedEvent` créé **en tête de transaction** ; `E11000` ⇒ rejeu ⇒ `abortTransaction` + NOP.
- **Consumers Kafka** (`*-consumer.bootstrap.ts`) : **I/O uniquement**, un consumer group chacun (`balance-entitlement`, `balance-kyc`). Tolérance panne alignée STORY-029/076 : broker absent au boot ⇒ HTTP démarre quand même, redémarrage réessayé en arrière-plan (garde `starting` non ré-entrante). Enveloppe invalide ⇒ ignorée (offset avancé, anti *poison pill*) ; erreur de traitement ⇒ propagée (Kafka rejoue, projection idempotente).
- **Gate `@RequiresBalanceAccess` + `BalanceAccessGuard`** — **5ᵉ maillon** de la chaîne globale (`Throttler → Jwt → EmailVerified → Roles → **BalanceAccess**`), **no-op sans la métadonnée** (patron `RolesGuard`). Ordre des paliers, **le premier échec déterminant le code** :
  1. `emailVerified` (claim) → **403 `EMAIL_NOT_VERIFIED`**
  2. KYC `APPROVED` (read-model `OrgKycStatus`) → **403 `KYC_NOT_APPROVED`**
  3. entitlement `balance` **`ACTIVE`** (read-model `OrgBalanceEntitlement`) → **403 `BALANCE_NOT_ENTITLED`**

  **Fail-closed** : read-model absent (cohérence éventuelle) ⇒ refus. `tenantId` absent/invalide (`PLATFORM_ADMIN`, `org: null`) ⇒ **403 `BALANCE_NOT_ENTITLED`**, jamais d'exception non gérée.
- **Sonde `GET /api/v1/whoami/balance-access`** (`@Roles(TENANT_ADMIN, TENANT_USER) @RequiresBalanceAccess()`) → `200 { access: 'granted', org }`. **Provisoire**, patron `bilan-service` : elle donne une route réelle pour exercer la gate **sans empiéter sur `/balance` (STORY-101)**.
- **Config + compose** : `entitlementGroupId` / `kycGroupId` dans `KafkaConfig`, `KAFKA_ENTITLEMENT_GROUP_ID` / `KAFKA_KYC_GROUP_ID` (optionnels + défauts) dans `env.validation.ts`, variables `BALANCE_KAFKA_*_GROUP_ID` dans `docker-compose.yml`.

**Hors périmètre :**

- **Domaine balance** (schéma canonique, stockage, contrôles d'équilibre) → **STORY-101** ; l'endpoint `GET /balance` lui appartient.
- **Producteur `balance.created`** → STORY-099. `balance-service` reste **pur consommateur** ici (aucune outbox).
- **Palier ABONNEMENT** (`SUBSCRIPTION_REQUIRED`, piloté par le paiement) → **EPIC-004 / sprint 20**. ⚠️ Ne PAS confondre avec l'entitlement (palier 3, **appliqué** ici) : l'entitlement est octroyé **manuellement** via l'admin-panel pendant le dogfooding (cf. STORY-039). **Aucun code mort** n'est posé pour l'abonnement — un commentaire de point d'extension suffit.
- **Indicateur Kafka `/health`** : **déjà livré par STORY-076** (`KafkaHealthIndicator`) → non-régression seulement, aucun travail.
- **Re-synchronisation manuelle / rattrapage d'offset** (outillage admin) et **traces distribuées** → stories futures.
- **Événements `identity.*`** : `balance-service` n'en a pas besoin (aucune donnée d'identité projetée).

### Flux

1. Le service démarre ; `ReadModelsModule` lance les deux consumers (`fromBeginning: true`).
2. `entitlement.changed` (`moduleCode: 'balance'`, `status: ACTIVE`) → transaction : `ProcessedEvent{eventId}` **puis** upsert absolu `OrgBalanceEntitlement{organizationId}` → commit.
3. `kyc.status.changed` (`status: APPROVED`) → transaction : `ProcessedEvent{eventId}` **puis** upsert `OrgKycStatus{organizationId}` → commit.
4. `GET /api/v1/whoami/balance-access` avec un JWT RS256 valide → `BalanceAccessGuard` : claim `emailVerified`, puis 2 `findOne().lean()` locaux → **200**.
5. Rejeu du même `eventId` → `E11000` sur le marqueur → transaction abandonnée → read-model **inchangé**.

---

## Écarts de rédaction (2026-07-17) — corrections vs le draft du 2026-07-12

> Le draft avait été rédigé **avant** la livraison de STORY-076 (2026-07-17) et **sans lire** `bilan-service`. Il décrivait des API **inexistantes**. Corrections actées :

| # | Draft du 2026-07-12 (❌ faux) | Réel (✅ code livré) |
|---|---|---|
| 1 | Événement `{ type: 'entitlement.granted' \| 'entitlement.revoked', moduleId, grantedAt }` | **Aucun champ `type`** : `EntitlementChangedEventV1 { schemaVersion, eventId, orgId, **moduleCode**, versionCode, referentiel?, config, **status**, occurredAt }` — **état absolu** (C7), pas de delta |
| 2 | Read-models `org_profiles{orgId: string, kycStatus, subscriptionActive}` + `entitlements{orgId, moduleId}` | `OrgKycStatus{**organizationId: ObjectId**, status}` + `OrgBalanceEntitlement{organizationId, versionCode, referentiel?, config, status}`. **Pas de `subscriptionActive`** (l'abonnement n'existe pas avant S20) |
| 3 | `kycStatus: 'PENDING' \| …` | L'enum livré est **`PENDING_DOCUMENTS`** \| `UNDER_REVIEW` \| `APPROVED` \| `REJECTED` |
| 4 | Idempotence : `findOne(eventId)` **puis** insert si absent | **Race** (deux consumers concurrents passent le `findOne` ensemble). Patron livré : **insert du marqueur d'abord**, `E11000` ⇒ abort ⇒ NOP |
| 5 | `processedEventsModel.insertOne(doc, { session })` | **N'existe pas** sur un modèle Mongoose → `create([doc], { session })` |
| 6 | Gate : `user.org ?? user.tenantId`, aucun `Reflector`, `ForbiddenException('KYC_NOT_APPROVED')` | `user.tenantId` (mappé par la `JwtStrategy`) ; **`Reflector` obligatoire** (sinon la gate s'applique à `/health` et casse tout) ; corps **`{ message, code }`** ; `Types.ObjectId.isValid` avant conversion |
| 7 | Gate = **KYC seul**, palier 2 = « abonnement préparé non appliqué » | **Contredit le PRD NFR-A01** (« email vérifié + KYC approuvé + **entitlement** ») et `bilan-service`. **Arbitrage PO 2026-07-17 : 3 paliers appliqués** (email + KYC + entitlement) ; seul l'**abonnement** est différé à S20. Lève la contradiction du draft : projeter `entitlement.changed` pour un read-model que **personne ne lit** |
| 8 | Endpoint gardé = `GET /api/v1/balance` | Appartient à **STORY-101** → sonde `GET /whoami/balance-access` (patron `bilan-service`) |
| 9 | « `BalanceHealthIndicator` : extension de `/health` » | **Déjà livré par 076** → non-régression |
| 10 | « coverage ≥ 65% » | Seuils du programme : **65 branches / 90 fonctions / 90 lignes / 90 statements** — jamais abaissés |
| 11 | Story Points 5 | **8** — l'équivalent livré (bilan 036=5 + 037=3) |

---

## Acceptance Criteria

- [ ] **Contrats** `EntitlementChangedEventV1` / `KycStatusChangedEventV1` + topics déclarés dans `src/kafka/events/`, miroirs stricts des producteurs (champs et noms **identiques**, `moduleCode` et non `moduleId`).
- [ ] **Enum `EntitlementStatus`** créé dans `common/enums/` ; `KycStatus` (076) désormais consommé.
- [ ] **Read-models** `OrgKycStatus`, `OrgBalanceEntitlement`, `ProcessedEvent` : keyés `organizationId` (`ObjectId`) / `eventId`, **index uniques** posés, TTL 30 j sur `processed_events`.
- [ ] **Projection entitlement** : filtre `moduleCode === 'balance'` (un autre module ⇒ **ni read-model ni marqueur**) ; upsert **état absolu** ; `referentiel` absent ⇒ `$unset` (aucun référentiel fantôme).
- [ ] **Projection KYC** : upsert `status` en état absolu.
- [ ] **Idempotence** : le marqueur est inséré **en tête de transaction** ; rejeu du même `eventId` (3×) ⇒ `E11000` ⇒ `abortTransaction` ⇒ **une seule** ligne `processed_events`, read-model **inchangé**, **aucune** exception propagée.
- [ ] **Transactionnalité** : marqueur + mutation dans **la même** transaction Mongo (`withTransaction`/`startTransaction` sur session) — échec ⇒ **aucun** document orphelin.
- [ ] **Consumers** : groups distincts (`balance-entitlement` / `balance-kyc`), `fromBeginning: true`, garde `starting` non ré-entrante, `onModuleDestroy` déconnecte. **Broker down au boot ⇒ HTTP démarre**, `/health` ⇒ `kafka: down`, **aucun crash de process** (invariant #4, cf. STORY-108).
- [ ] **Enveloppe invalide ignorée** (offset avancé, pas de blocage) : corps vide, JSON illisible, `eventId` absent, `occurredAt` invalide, `orgId` non-`ObjectId`.
- [ ] **Gate `@RequiresBalanceAccess`** :
  - route **sans** la métadonnée ⇒ **no-op** (`/health` reste `@Public` 200, `GET /whoami` reste 200 — **non-régression 076**)
  - pas de JWT / JWT invalide ⇒ **401**
  - `emailVerified: false` ⇒ **403 `EMAIL_NOT_VERIFIED`**
  - KYC absent du read-model ou ≠ `APPROVED` ⇒ **403 `KYC_NOT_APPROVED`** (fail-closed)
  - entitlement absent, `SUSPENDED` ou `REVOKED` ⇒ **403 `BALANCE_NOT_ENTITLED`**
  - `PLATFORM_ADMIN` / `org: null` / `tenantId` malformé ⇒ **403 `BALANCE_NOT_ENTITLED`** (aucune exception non gérée)
  - email vérifié + KYC `APPROVED` + entitlement `ACTIVE` ⇒ **200**
  - **ordre des paliers respecté** : un appelant cumulant les 3 échecs reçoit `EMAIL_NOT_VERIFIED`
- [ ] **Sonde** `GET /api/v1/whoami/balance-access` documentée dans Swagger (`@ApiForbiddenResponse` listant les 3 codes).
- [ ] **Isolation (NFR-A02)** : la gate ne lit **que** l'org du jeton ; l'entitlement d'une org A ne débloque **jamais** une org B (test dédié).
- [ ] **Zéro appel réseau** dans la gate : décision issue du claim + 2 `findOne` locaux (aucun client HTTP vers `auth`/`kyc`/`catalog`).
- [ ] **DoD du programme** : lint 0 warning, build OK, seuils **65/90/90/90** tenus, unit + e2e verts, non-régression 076.

---

## Technical Notes

> **Code de référence à transposer** (lire **avant** d'écrire) :
> `bilan-service/src/modules/read-models/` — `entitlement.projection.service.ts`, `kyc-status.projection.service.ts`, `entitlement-consumer.bootstrap.ts`, `schemas/`, `duplicate-key.util.ts`, `guards/bilan-access.guard.ts` ; `bilan-service/src/kafka/events/` ; `bilan-service/src/common/decorators/requires-bilan-access.decorator.ts`.

### Arborescence cible

```
balance-service/src/
├── common/
│   ├── decorators/requires-balance-access.decorator.ts   # métadonnée pure
│   └── enums/entitlement-status.enum.ts                  # NOUVEAU (miroir catalog)
├── kafka/events/
│   ├── entitlement-events.ts                             # topic + EntitlementChangedEventV1
│   └── kyc-events.ts                                     # topic + KycStatusChangedEventV1
└── modules/read-models/
    ├── read-models.module.ts
    ├── duplicate-key.util.ts                             # isDuplicateKeyError (E11000)
    ├── entitlement.projection.service.ts                 # logique + tests
    ├── kyc-status.projection.service.ts
    ├── entitlement-consumer.bootstrap.ts                 # I/O Kafka uniquement
    ├── kyc-status-consumer.bootstrap.ts
    ├── guards/balance-access.guard.ts
    └── schemas/{org-kyc-status,org-balance-entitlement,processed-event}.schema.ts
```

### Contrats consommés (miroirs — ne rien inventer)

```typescript
export const ENTITLEMENT_CHANGED_TOPIC = 'entitlement.changed';
export interface EntitlementChangedEventV1 {
  schemaVersion: 1;
  eventId: string;        // UUID v4 — clé d'idempotence
  orgId: string;          // ObjectId hex = clé de partition (ordre garanti par org)
  moduleCode: string;     // 'balance' ici — les autres sont ignorés
  versionCode: string;
  referentiel?: { code: string; version: string };
  config: Record<string, unknown>;
  status: EntitlementStatus;   // ACTIVE | SUSPENDED | REVOKED — état ABSOLU
  occurredAt: string;
}

export const KYC_STATUS_CHANGED_TOPIC = 'kyc.status.changed';
export interface KycStatusChangedEventV1 {
  schemaVersion: 1;
  eventId: string;
  orgId: string;
  previousStatus: KycStatus;
  status: KycStatus;      // PENDING_DOCUMENTS | UNDER_REVIEW | APPROVED | REJECTED
  rejectionReason?: string;
  reviewedBy?: string;    // conservés au contrat, NON projetés (aucun e-mail ici)
  actorUserId?: string;
  occurredAt: string;
}
```

### Idempotence — insertion-d'abord (le point à ne pas rater)

```typescript
/** Seul module dont `balance-service` projette l'entitlement. */
const BALANCE_MODULE_CODE = 'balance';

private async persist(eventId: string, payload: EntitlementChangedEventV1): Promise<boolean> {
  const session = await this.connection.startSession();
  try {
    session.startTransaction();

    // 1) Marqueur D'ABORD : un rejeu viole l'unicité → abort → NOP.
    //    (Un findOne préalable serait une RACE entre consumers concurrents.)
    try {
      await this.processedModel.create([{ eventId }], { session });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        await session.abortTransaction();
        return false;
      }
      throw error;
    }

    // 2) Read-model en état absolu (C7).
    await this.entitlementModel.updateOne(
      { organizationId: new Types.ObjectId(payload.orgId) },
      {
        $set: {
          versionCode: payload.versionCode,
          config: payload.config ?? {},
          status: payload.status,
          ...(payload.referentiel ? { referentiel: payload.referentiel } : {}),
        },
        // Sans référentiel dans l'événement, on efface l'ancien (jamais de fantôme).
        ...(payload.referentiel ? {} : { $unset: { referentiel: '' } }),
      },
      { upsert: true, session },
    );

    await session.commitTransaction();
    return true;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    throw error;   // Kafka rejoue — la projection est idempotente
  } finally {
    await session.endSession();
  }
}
```

### Gate — 3 paliers ordonnés, fail-closed

```typescript
export const BALANCE_ACCESS_CODE = {
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  KYC_NOT_APPROVED: 'KYC_NOT_APPROVED',
  BALANCE_NOT_ENTITLED: 'BALANCE_NOT_ENTITLED',
} as const;

async canActivate(context: ExecutionContext): Promise<boolean> {
  const required = this.reflector.getAllAndOverride<boolean>(
    REQUIRES_BALANCE_ACCESS_KEY, [context.getHandler(), context.getClass()],
  );
  if (!required) return true;   // no-op — sinon /health et /whoami cassent

  const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();

  // 1) e-mail vérifié (claim JWT)
  if (!user?.emailVerified) throw this.deny(EMAIL_NOT_VERIFIED_MESSAGE, BALANCE_ACCESS_CODE.EMAIL_NOT_VERIFIED);

  // Pas d'org (PLATFORM_ADMIN) ou org malformée ⇒ aucun entitlement possible
  if (!user.tenantId || !Types.ObjectId.isValid(user.tenantId)) {
    throw this.deny(BALANCE_NOT_ENTITLED_MESSAGE, BALANCE_ACCESS_CODE.BALANCE_NOT_ENTITLED);
  }
  const organizationId = new Types.ObjectId(user.tenantId);

  // 2) KYC APPROVED (read-model local) — absent = refus
  const kyc = await this.kycStatusModel.findOne({ organizationId }).lean().exec();
  if (kyc?.status !== KycStatus.APPROVED) {
    throw this.deny(KYC_NOT_APPROVED_MESSAGE, BALANCE_ACCESS_CODE.KYC_NOT_APPROVED);
  }

  // 3) entitlement `balance` ACTIVE (read-model local) — absent = refus
  const entitlement = await this.entitlementModel.findOne({ organizationId }).lean().exec();
  if (entitlement?.status !== EntitlementStatus.ACTIVE) {
    throw this.deny(BALANCE_NOT_ENTITLED_MESSAGE, BALANCE_ACCESS_CODE.BALANCE_NOT_ENTITLED);
  }

  // Palier ABONNEMENT : point d'extension EPIC-004 / S20 (paiement) — aucun code
  // mort ici ; l'entitlement (palier 3) est octroyé manuellement au dogfooding.
  return true;
}

private deny(message: string, code: string): ForbiddenException {
  return new ForbiddenException({ message, code });   // corps { message, code }
}
```

Câblage : **5ᵉ** `APP_GUARD` d'`app.module.ts`, **après** `RolesGuard` (mettre à jour le commentaire de la chaîne, qui annonce encore « palier KYC appliqué, palier abonnement préparé »). `ReadModelsModule` exporte `MongooseModule` + les projections ; le guard injecte les deux modèles.

### Config / compose (patron `bilan-service`)

```typescript
export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  entitlementGroupId: string;   // défaut 'balance-entitlement'
  kycGroupId: string;           // défaut 'balance-kyc'
}
```

`env.validation.ts` : `KAFKA_ENTITLEMENT_GROUP_ID` / `KAFKA_KYC_GROUP_ID` **optionnels** (`@IsOptional() @IsString() @IsNotEmpty()`), défauts en config.
`docker-compose.yml` (bloc `balance-service`) : `KAFKA_ENTITLEMENT_GROUP_ID: ${BALANCE_KAFKA_ENTITLEMENT_GROUP_ID:-balance-entitlement}` et `KAFKA_KYC_GROUP_ID: ${BALANCE_KAFKA_KYC_GROUP_ID:-balance-kyc}`.

### Vérification docker (obligatoire — la story écrit en base)

⚠️ Stack **repartie de zéro** (`docker compose down -v` → `up --build`), cf. règle projet. ⚠️ **Aucun seed** dans le catalog : le module `balance` doit être **créé via l'API admin** (`PLATFORM_ADMIN` via `npm run seed:admin`), puis l'entitlement **octroyé** — c'est ce qui produit `entitlement.changed`.

1. IdP : `register` org → `verify` (Mailhog :8025) → `login` → JWT RS256 (`aud` ⊇ `balance-service`).
2. **Avant tout événement** : `GET /whoami/balance-access` ⇒ **403 `KYC_NOT_APPROVED`** (fail-closed prouvé **avant**, cf. contrôle avant/après).
3. Catalog : créer module `balance` + version → **octroyer** l'entitlement à l'org ⇒ `entitlement.changed`.
4. `GET /whoami/balance-access` ⇒ **403 `KYC_NOT_APPROVED`** (le palier 2 tient encore).
5. KYC : upload RCCM/CFE → approbation admin ⇒ `kyc.status.changed`.
6. `GET /whoami/balance-access` ⇒ **200 `{ access: 'granted' }`**.
7. **Révoquer** l'entitlement ⇒ `403 `BALANCE_NOT_ENTITLED`` **avec le même jeton** (preuve que la décision ne vient pas du JWT).
8. **Idempotence** : rejouer le topic (`--reset-offsets --to-earliest` sur le group) ⇒ `processed_events` **inchangé**, read-models **inchangés**.
9. `mongosh` — invariants réels :
   ```bash
   docker exec prospera-mongo-1 mongosh --quiet balance_service --eval '
     db.orgkycstatuses.find().pretty();
     db.orgbalanceentitlements.find().pretty();
     print("processed:", db.processed_events.countDocuments());
     printjson(db.processed_events.getIndexes());   // eventId unique + TTL 30j
   '
   ```
10. **Kafka down** : `docker compose stop kafka` → le service **reste up**, `/health` ⇒ `kafka: down`, **process vivant** ; `start kafka` → rattrapage des offsets.

Consigner le tout dans *Progress Tracking* (aucune assertion « atomicité vérifiée » sur la foi d'un mock).

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Trou de couverture `*bootstrap*`** — `collectCoverageFrom` exclut `!**/*bootstrap*.ts` : la validation d'enveloppe des consumers n'est **pas** couverte. C'est **exactement** le trou qui a caché les 3 bugs Kafka de STORY-076/108 (question **Q3** ouverte) | Discipline `bilan-service` : les consumers restent **I/O pure**, toute la logique est dans les projections (testées). Les gardes anti-*poison pill* sont exercées par la **vérification docker réelle** (§8/§10), pas par les mocks. **Ne pas** déplacer de logique métier dans un `*bootstrap*` |
| Gate appliquée partout (`/health` cassé, boot en échec) | `Reflector` **obligatoire** → no-op sans métadonnée ; AC de non-régression explicite sur `/health` et `GET /whoami` |
| Read-model en retard (cohérence éventuelle) ⇒ accès indûment ouvert | **Fail-closed** : absence ⇒ refus. Jamais de « bénéfice du doute » |
| Race d'idempotence entre consumers concurrents | Insertion du marqueur **d'abord** (unicité = arbitre), jamais `findOne`-puis-insert |
| Entitlement d'un autre module débloque `balance` | Filtre `moduleCode === 'balance'` **avant** écriture + test dédié |
| `orgId` malformé ⇒ *poison pill* (rejeu infini) | `Types.ObjectId.isValid` dans le consumer ⇒ message ignoré, offset avancé |
| Confusion **entitlement** ↔ **abonnement** (le draft l'a faite) | Palier 3 = entitlement (**appliqué**) ; abonnement = S20, **commentaire seul**, zéro code mort |

---

## Dependencies

**Prérequis (livrés) :**
- **STORY-076** — scaffold `balance-service` (`KafkaModule`, `JwtStrategy` RS256/JWKS, `/health`, `/whoami`, enum `KycStatus` inerte). ✅ 2026-07-17
- **STORY-034** — `platform-catalog-service` émet `entitlement.changed` (outbox). ✅
- **STORY-021** — `kyc-service` émet `kyc.status.changed` (outbox). ✅
- **STORY-036/037** — `bilan-service` : **patron de référence** à transposer. ✅ 2026-07-14

**Débloque :** STORY-101 (contrat canonique — ses endpoints porteront `@RequiresBalanceAccess`), 086/102/082-085 (adaptateurs), 099 (handoff).

**Aucune dépendance de code** vers `catalog`/`kyc` : couplage **par le topic** uniquement.

---

## Definition of Done

- [ ] Contrats + enum + 3 schémas (index uniques + TTL) créés
- [ ] 2 projections idempotentes transactionnelles + 2 consumers I/O (groups distincts, tolérants au broker absent)
- [ ] Gate 3 paliers + décorateur + sonde `/whoami/balance-access` + 5ᵉ `APP_GUARD` câblé
- [ ] Config/env/compose : `KAFKA_ENTITLEMENT_GROUP_ID` + `KAFKA_KYC_GROUP_ID`
- [ ] Unit : projections (grant/suspend/revoke, KYC, filtre module, `$unset` référentiel, idempotence 3×) + gate (401/403×3/200, ordre des paliers, `PLATFORM_ADMIN`, isolation A≠B)
- [ ] e2e : gate 401/403/200 (JWT RS256 minté localement) + non-régression `/health` et `/whoami`
- [ ] **Vérification docker réelle** consignée (contrôle **avant/après**, révocation à jeton constant, rejeu d'offsets, `mongosh`, Kafka down → process vivant)
- [ ] lint 0 warning · build OK · **65/90/90/90** tenus · unit + e2e verts · Swagger à jour
- [ ] Statut synchronisé aux **3 endroits** (en-tête, `sprint-status.yaml`, *Progress Tracking*) + `completed_date`

---

## Story Points Breakdown

- **Contrats + enum + schémas :** 1
- **Projections + idempotence transactionnelle :** 2
- **Consumers (groups, tolérance panne, anti-poison) :** 1
- **Gate 3 paliers + décorateur + sonde + câblage :** 2
- **Tests (unit + e2e) :** 1
- **Vérification docker (catalog module+grant, KYC, rejeu, avant/après) :** 1
- **Total : 8**

**Rationale :** le travail équivalent **déjà livré** dans `bilan-service` a coûté **8 pts** (STORY-036 = 5 : read-models + consumers + idempotence ; STORY-037 = 3 : gate 3 paliers). STORY-077 fait **les deux dans une seule story**, plus le câblage config/compose que 036 n'avait pas (bilan était déjà configuré). L'estimation à 5 du draft supposait un palier de gate unique et une idempotence naïve — les deux ont été corrigés. Le code est une **transcription** d'un patron éprouvé, ce qui borne le risque : le coût réel est la **vérification docker** (créer le module au catalog + octroyer, approuver le KYC, rejouer les offsets), pas l'écriture.

---

## Progress Tracking

**Historique :**
- 2026-07-12 : créée (rédaction anticipée, sprint 10)
- 2026-07-16 : déplacée S10 → S11 (décision D15)
- 2026-07-17 : **re-cadrée sur le code réel** (`/bmad:create-story`) — 11 écarts corrigés (contrats inventés, idempotence racée, API Mongoose inexistante, gate sans `Reflector`) ; **arbitrage PO : gate à 3 paliers** (email + KYC + entitlement, PRD NFR-A01) au lieu du palier KYC seul ; endpoint gardé `/whoami/balance-access` au lieu de `/balance` (STORY-101) ; **points 5 → 8** ; statut `ready-for-dev`
- 2026-07-17 : `in_progress` → **implémentée + VÉRIFIÉE DOCKER BOUT-EN-BOUT** (branche `MNV-077`)

**Effort réel :** 8 points (conforme à la ré-estimation ; le coût s'est bien logé dans la vérification docker, pas dans l'écriture — le code est une transcription de `bilan-service`).

### Notes d'implémentation (décisions prises en codant)

1. **`parseEventEnvelope` extrait dans un fichier couvert** — seul **écart assumé vs `bilan-service`**, qui embarque cette validation dans ses deux consommateurs. Motif : `collectCoverageFrom` exclut les fichiers `*bootstrap*` (**Q3**), donc chez `bilan` les gardes anti-*poison pill* ne sont **pas couvertes** — le trou même qui a caché les bugs Kafka de 076/108. Ici la logique vit dans `event-envelope.util.ts` (**12 tests**), les consommateurs restent de purs tuyaux. Supprime au passage ~40 lignes dupliquées entre les 2 consumers.
2. **Garde `sans objet JSON` ajoutée** (absente de `bilan`) : `JSON.parse('null')` renvoie `null` sans lever → les accès `payload.eventId` suivants lèveraient un `TypeError` **non géré** sur un message qu'on doit simplement ignorer.
3. **Palier `EMAIL_NOT_VERIFIED` : inatteignable sur cette route, conservé quand même.** `EmailVerifiedGuard` (3ᵉ maillon global) refuse déjà en amont, avec un 403 **sans `code`** — découvert en écrivant l'e2e, qui échouait en attendant `EMAIL_NOT_VERIFIED`. Le palier reste dans le gate en **défense en profondeur** (il redevient seul juge sur une route `@AllowUnverified()`) ; l'unitaire du gate le prouve, l'e2e assert désormais le 403 nu. Même position que `bilan-service`. **Ne pas retirer en croyant à du code mort** (commentaire posé dans le guard).
4. **Palier abonnement : zéro ligne de code.** Ni flag, ni branche commentée — un simple commentaire de point d'extension (EPIC-004/S20). Un garde-fou désactivé serait du code mort non testé.
5. **`useClass` (et non `useExisting`) pour l'`APP_GUARD`**, guard non déclaré dans `ReadModelsModule` : aligné sur `bilan-service` (résolution des modèles via l'export `MongooseModule`).

### Vérification docker (2026-07-17) — stack repartie de ZÉRO (`down -v` → `up --build`)

Org `6a5a2ee7f41b85af65220bde` · module `balance` **créé via l'API catalog** (aucun seed) · jeton RS256 réel de l'IdP.

| # | Étape | Résultat |
|---|---|---|
| 1 | Boot Kafka **vierge** | 1er `subscribe` KO (« This server does not host this topic-partition ») → **retry auto** → les 2 consumers démarrent 8 s plus tard. **HTTP jamais bloqué** |
| 2 | **AVANT tout événement** | `/whoami/balance-access` → **403 `KYC_NOT_APPROVED`** ; read-models **vides** (0/0/0) — *fail-closed prouvé avant* |
| 3 | Non-régression 076 | `GET /whoami` → **200** (gate no-op hors métadonnée) ; `/health` → `mongo up, kafka up` |
| 4 | Octroi entitlement (catalog) | `entitlement.changed` → read-model `ACTIVE`, `versionCode 1.0`, `config` projeté, **`referentiel` absent** (aucun fantôme) |
| 5 | Gate après octroi seul | **403 `KYC_NOT_APPROVED`** — le palier 2 tient indépendamment |
| 6 | Upload RCCM+CFE → `UNDER_REVIEW` | read-model `UNDER_REVIEW` → gate **403** (toujours) |
| 7 | **Approbation admin** | `kyc.status.changed` → read-model **`APPROVED`** → `/whoami/balance-access` → **200 `{access:'granted'}`** — ⚡ **MÊME JETON** qu'aux étapes 2/5/6 : la décision ne vient **pas** du JWT |
| 8 | **Révocation entitlement** | read-model `REVOKED` → **403 `BALANCE_NOT_ENTITLED`** — **même jeton**, révocation opposable immédiatement |
| 9 | **Rejeu total** (offsets `--to-earliest` sur les 2 groups, service redémarré) | les **4** événements ré-ingérés → **4 × `E11000` → ignorés** ; `processed_events` **4 → 4** ; `updatedAt` des 2 read-models **strictement identiques** (`13:38:59.924` / `13:39:48.581`) → **aucune ré-écriture** |
| 10 | Index réels (`mongosh`) | `processed_events{eventId}` **UNIQUE** + `{processedAt}` **TTL 2592000 s** ; `orgkycstatuses{organizationId}` **UNIQUE** ; `orgbalanceentitlements{organizationId}` **UNIQUE** |
| 11 | **Kafka down** (`stop kafka`) | service **vivant** — PID **44552 inchangé**, `RestartCount: 0` ; `/health` → `kafka: down` (503) ; **la gate répond encore 403 `BALANCE_NOT_ENTITLED`** (décision 100 % locale = **P4/B3 prouvé**) ; `/whoami` → 200 |
| 12 | Kafka rétabli | `/health` → `kafka: up`, **toujours le même PID** (jamais redémarré sur tout le cycle) |

**Qualité** : lint **0 warning / 0 erreur** · build OK · **142 unit** (21 suites) + **25 e2e** verts · couverture **98.92 stmts / 88.23 branches / 97.7 fonctions / 98.82 lignes** (seuils 65/90/90/90 tenus, `test:cov` exit 0) · `read-models` et `guards` à **100 %**.

**Reste** : `/code-review` formel → intégration `dev` (Rebase and merge).

---

**Statut :** ready-for-dev
**Dépendances :** STORY-076 ✅ · STORY-034 ✅ · STORY-021 ✅ · patron STORY-036/037 ✅
**Référence :** `prd-atelier-balance-2026-07-12.md` § NFR-A01/A02
</content>
</invoke>
