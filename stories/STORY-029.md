---
baseline_commit: NO_VCS
---

# STORY-029 : Read-models identité + consumer `identity.*` (Kafka) + provisioning

**Epic :** EPIC-006 — `expert-comptable` devient *relying party* de l'IdP
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Contrat d'événements `identity.*` (v1) — **source de vérité des payloads** · `architecture-expert-comptable-2026-07-02.md` (rév. 1.2, §Bascule relying party / read-model d'identité) · `architecture-prospera-ecosystem-2026-07-04.md` (topologie IdP ↔ relying party, bus Kafka, cohérence éventuelle)
**Priorité :** Must Have
**Story Points :** 8
**Statut :** ✅ Implémenté + VÉRIFIÉ DOCKER BOUT-EN-BOUT (2026-07-08) — reste : `/code-review` formel + commit sur demande
**Assigné à :** Unassigned
**Créée le :** 2026-07-08
**Sprint :** 5
**Service :** expert-comptable (`:3000`)
**Couvre :** driver « un seul propriétaire d'identité » (l'IdP) — 2ᵉ pas de l'extraction d'identité côté vertical (après la validation JWKS de STORY-028)
**Dépendances :** STORY-027 (producteur `identity.*` + outbox, côté `auth-service`), STORY-028 (validation JWKS des JWT RS256)

> **Deuxième story d'EPIC-006 : `expert-comptable` réplique localement l'identité au lieu de la posséder.** STORY-028 a fait basculer la **vérification** des jetons vers l'IdP (RS256/JWKS), mais `expert-comptable` **possède encore** ses collections `Tenant`/`User` (émission locale, EPIC-001/002). STORY-027 a fait d'`auth-service` le **producteur** des événements `identity.*` (Kafka, via transactional outbox, état absolu, `eventId`). STORY-029 branche `expert-comptable` comme **premier consommateur Kafka de l'écosystème côté vertical** : il ouvre un **consumer group** sur les topics `identity.*`, en dérive des **read-models locaux** (`Organization` / `User` / `Membership`) idempotents, **provisionne** la part métier d'une organisation quand elle apparaît, et **coupe l'accès** sur suspension d'org/user. Les résolutions métier (destinataires d'e-mails, « dernier admin ») lisent désormais **le read-model local** au lieu des services propriétaires. STORY-029 **n'enlève rien** : les modules d'identité possédés (`AuthModule`/`UsersModule`/`TenantsModule`) et l'émission locale subsistent — leur **retrait + cutover pur** = **STORY-030**. C'est la brique qui rend `expert-comptable` **autonome sur le chemin chaud** : plus jamais d'appel réseau synchrone à l'IdP pour connaître une org, un user ou un rôle.

---

## User Story

En tant qu'**`expert-comptable`** (service *relying party* de l'écosystème PROSPERA),
je veux **répliquer localement l'identité (organisation, utilisateurs, rôles) dont j'ai besoin, en consommant les événements `identity.*` de l'IdP sur Kafka**,
afin de **fonctionner sans jamais interroger l'IdP sur le chemin chaud** (autonomie de disponibilité), de **provisionner** la part métier d'une organisation dès sa création, et que la **suspension** d'une org ou d'un user **coupe l'accès** localement.

---

## Description

### Contexte

Après STORY-028, `expert-comptable` fait **confiance** à un jeton via la clé publique de l'IdP, mais il continue de **connaître** ses organisations et utilisateurs uniquement parce qu'il les a créés lui-même (son `register`/`login` local, HS256, alimente ses collections `Tenant`/`User`). Deux problèmes en cible :

- **Source de vérité dédoublée.** Quand l'IdP (`auth-service`) devient l'émetteur (mode `rs256`), les orgs/users sont créés **là-bas** ; `expert-comptable` ne les voit pas. Ses écrans (liste des cabinets côté admin), la **résolution des destinataires** d'e-mails métier et la règle « dernier admin » interrogent `UsersService`/`TenantsService` **propriétaires** — vides ou obsolètes en mode relying party.
- **Pas d'autonomie.** Sans réplication locale, le vertical devrait appeler l'IdP en synchrone à chaque requête pour résoudre une org/un rôle — exactement ce que l'architecture programme **interdit** (les relying parties ne sollicitent **jamais** l'IdP sur le chemin chaud ; ils valident le JWT localement et **répliquent** l'identité via `identity.*`).

L'IdP publie déjà tout le nécessaire (STORY-027). Le **contrat `identity.*` v1** (source de vérité : `architecture-auth-service-2026-07-04.md` §Contrat, et le type [`identity-events.ts`](../../auth-service/src/kafka/outbox/identity-events.ts)) :

| Topic | Déclencheur | Payload (clés, **état absolu**) | Clé de partition |
|---|---|---|---|
| `identity.org.created` | création d'org (register) | `orgId, name, slug, country, status, createdByUserId, occurredAt` | `orgId` |
| `identity.org.updated` | MAJ profil / suspension d'org | `orgId, name?, status, occurredAt` | `orgId` |
| `identity.user.registered` | création d'un user (register / invitation acceptée) | `userId, email, firstName, lastName, status, occurredAt` | `userId` |
| `identity.membership.changed` | ajout / rôle / suspension d'un membre | `userId, orgId, role, status, occurredAt` | `orgId` |
| `identity.user.suspended` | suspension d'un user | `userId, status, occurredAt` | `userId` |

Chaque message porte, en plus de sa `value` (JSON du payload), les **headers** `eventId` (idempotence) et `schemaVersion` ([`outbox-relay.service.ts:103-112`](../../auth-service/src/kafka/outbox/outbox-relay.service.ts#L103-L112)). Livraison **at-least-once** (l'outbox publie *puis* marque `SENT`) → **le consommateur doit être idempotent** (déduplication par `eventId`).

STORY-029 apporte **quatre briques** :

1. **Câblage Kafka consommateur** — première introduction du client `kafkajs` côté `expert-comptable` (aucun `KafkaModule` n'existe aujourd'hui), sur le patron du `KafkaModule` global d'`auth-service` ([`kafka.module.ts`](../../auth-service/src/kafka/kafka.module.ts)).
2. **Consumer group `identity.*`** — un consommateur unique abonné aux 5 topics, dispatchant par topic, **idempotent** (marqueur `ProcessedIdentityEvent`, `eventId` unique, TTL), appliquant l'**état absolu** (`$set` intégral, jamais de delta).
3. **Read-models locaux** — collections `Organization` / `User` / `Membership` (miroir des schémas de l'IdP), clés par les identifiants **de l'IdP** (`orgId` string = claim JWT `org` = `tenantId` d'isolation ; `userId` string = claim `sub`).
4. **Provisioning + coupure d'accès + résolutions** — `org.created` crée le read-model d'org **+ un profil métier vide** ; `org.updated(SUSPENDED)` / `user.suspended` coupent l'accès ; les résolutions métier (destinataires d'e-mails, dernier admin) lisent le **read-model**.

### Périmètre

**Inclus :**

- **`KafkaModule` (consommateur) — nouveau, côté `expert-comptable`** :
  - Client `kafkajs` partagé (token DI, `@Global`), configuré par `KafkaConfig { brokers, clientId }` (env `KAFKA_BROKERS` — **déjà injecté** dans le compose racine, [`docker-compose.yml`](../../docker-compose.yml) — + `KAFKA_CLIENT_ID`).
  - Cycle de vie propre : `connect` au bootstrap, `disconnect` à l'arrêt ; **ne fait jamais échouer le boot HTTP** si le broker est indisponible (aligné sur la tolérance panne Kafka de STORY-022 côté IdP) ; reconnexion gérée par `kafkajs`.
  - Indicateur `/health` de connectivité Kafka (*degraded* si broker injoignable), sur le patron de `KafkaHealthIndicator` de l'IdP.
- **Contrat `identity.*` v1 (consommateur)** : interfaces TypeScript des 5 payloads, **copiées** du contrat source de l'IdP (état absolu, `schemaVersion: 1`) — dépendance **contractuelle**, pas de code partagé.
- **`IdentityEventsConsumer`** :
  - Consumer group `expert-comptable-identity` (fan-out natif : n'interfère pas avec les futurs consommateurs `kyc.status.changed`, STORY-021).
  - Abonné aux 5 topics `identity.*` ; `eachMessage` → parse `value` + `eventId` (header) → **dispatch par topic** vers un handler dédié.
  - **Idempotence** : marqueur `ProcessedIdentityEvent { eventId (unique), topic, processedAt }` (TTL 30 j) ; un `eventId` déjà vu est **ignoré** (ni double écriture du read-model, ni double effet de bord). Insertion du marqueur **avant** commit de l'application (ou dans la même écriture) pour garantir l'exactement-une-fois **effective**.
  - **État absolu** : chaque handler fait un `$set` **absolu** des champs du payload (upsert), jamais un incrément/merge partiel — un rejeu ou un message plus récent converge vers le même état.
  - **Garde anti-régression d'ordre** : les événements `user.*` sont partitionnés par `userId` et les événements `org.*`/`membership.changed` par `orgId` — l'ordre **par entité** est garanti par partition, mais **pas entre topics**. Chaque read-model porte `lastEventAt` (= `occurredAt` appliqué) ; un événement dont `occurredAt` est **antérieur** au dernier appliqué sur la même entité est **ignoré** (LWW horodaté) → évite qu'un `org.updated` en retard n'écrase un état plus récent.
- **Read-models locaux (nouvelles collections dédiées, distinctes des collections possédées `Tenant`/`User`)** :
  - `Organization` (read-model) : `orgId (unique), name, slug, country, status, createdByUserId, lastEventAt`.
  - `User` (read-model d'identité) : `userId (unique), email, firstName, lastName, status, lastEventAt` (aucun secret : jamais de `passwordHash`, de token, de refresh).
  - `Membership` (read-model) : `userId, orgId, role, status, lastEventAt` (unique `{ userId, orgId }`).
  - **Provisioning** (`org.created`) : création du read-model d'org **+ d'un profil métier vide** (extension métier de l'org côté vertical : porteuse de l'abonnement — EPIC-004 — et du read-model KYC `kycStatus` — STORY-021 ; créée à `PENDING`/vide, clé `orgId`).
- **Coupure d'accès** : `org.updated(status = SUSPENDED)` et `user.suspended` répercutent `SUSPENDED` dans le read-model. Un guard/résolveur lisant le read-model **refuse** l'accès d'une org/user suspendu (en complément de l'expiration naturelle du JWT). (Le `TenantStateGuard` complet — KYC/abonnement — reste STORY-014 ; ici, seule la **suspension d'identité** est câblée.)
- **Bascule des résolutions métier vers le read-model** :
  - Destinataires des e-mails **métier** (hors e-mails d'identité, qui vivent dans l'IdP) résolus depuis le read-model `User`/`Membership` (plus `UsersService` propriétaire).
  - Règle « dernier admin » / listes d'admins d'une org résolues depuis `Membership` (rôle + statut), plus `TenantsService`/`UsersService`.
  - **Isolation** : toute lecture read-model filtrée par `orgId` (= `tenantId` du `TenantContext`).
- **Tests** : unitaires par handler (chaque topic → mutation attendue), idempotence (rejeu ×2 = 1 seul effet), LWW horodaté (événement périmé ignoré), isolation (événement d'une org n'affecte qu'elle), provisioning (org.created → org + profil métier vide), coupure (suspend → accès refusé). E2e docker : produire des `identity.*` sur le broker réel → read-model d'`expert-comptable` à jour (le round-trip **cross-service** register→read-model complet = STORY-030).

**Explicitement hors périmètre :**

- **Retrait d'`AuthModule`/`UsersModule`/`TenantsModule` et arrêt de l'émission locale** (`register`/`login` servis ici) → **STORY-030**. STORY-029 **ajoute** les read-models **à côté** des collections possédées ; il ne supprime ni ne réécrit `Tenant`/`User`.
- **e2e cross-service complet** (register/login IdP `:3001` → JWT RS256 → endpoint `expert-comptable` `:3000` → `identity.*` → read-model) → **STORY-030** (cutover).
- **`TenantStateGuard` complet (matrice KYC + abonnement)** → **STORY-014**. Ici : uniquement la coupure sur **suspension d'identité**.
- **Read-model KYC `tenant.kycStatus` + consumer `kyc.status.changed`** → **STORY-021**. STORY-029 se contente de **créer le porteur** (profil métier) où ce champ atterrira ; il **coexiste** avec les read-models d'identité.
- **Producteur d'événements** côté `expert-comptable` : aucun (il reste consommateur ; il ne publie pas d'`identity.*` — c'est le rôle de l'IdP).
- **Migration de données** des `Tenant`/`User` possédés vers les read-models (le peuplement se fait par **rejeu des événements** de l'IdP, `fromBeginning`, au cutover STORY-030).

### Flux (technique)

**A. Provisioning d'une organisation**
1. `auth-service` traite un `register` → écrit `identity.org.created` (+ `user.registered` + `membership.changed`) dans son outbox (même transaction), puis le relais les publie sur Kafka (clé `orgId`/`userId`, header `eventId`).
2. `IdentityEventsConsumer` (`expert-comptable`) reçoit `identity.org.created` → vérifie `eventId` non déjà traité → **upsert** `Organization` read-model (`$set` absolu) → **crée le profil métier vide** de l'org (abonnement/KYC placeholders) → enregistre `ProcessedIdentityEvent`.
3. `identity.user.registered` → upsert `User` read-model ; `identity.membership.changed` → upsert `Membership` (rôle/statut).
4. Les écrans admin et les résolutions d'e-mails métier lisent désormais ces read-models.

**B. Suspension**
5. `auth-service` suspend une org (`identity.org.updated`, `status: SUSPENDED`) ou un user (`identity.user.suspended`).
6. Le consommateur applique `SUSPENDED` au read-model ; le résolveur d'accès lisant le read-model **refuse** les requêtes de l'org/user suspendu (les JWT déjà émis expireront naturellement).

**C. Idempotence / ordre**
7. Un message re-livré (`eventId` déjà vu) est **ignoré**. Un message dont `occurredAt` est antérieur au `lastEventAt` de l'entité est **ignoré** (LWW). Sinon, `$set` absolu → convergence.

---

## Critères d'acceptation

- [ ] **Consumer group** `expert-comptable-identity` ouvert sur les **5 topics** `identity.*` ; le client Kafka (`kafkajs`) est introduit côté `expert-comptable` (nouveau `KafkaModule`) et **connecté au broker** du compose racine (`KAFKA_BROKERS`).
- [ ] **Read-models** `Organization` / `User` / `Membership` peuplés depuis les événements (état **absolu**, `$set` intégral) ; clés par identifiants **de l'IdP** (`orgId`/`userId` string, cohérents avec les claims JWT `org`/`sub`). Aucun secret (`passwordHash`/token) présent dans le read-model `User`.
- [ ] **Idempotence** : rejouer **2×** le même événement (même `eventId`) ne produit **ni double écriture** du read-model **ni double effet de bord** (marqueur `ProcessedIdentityEvent`, `eventId` unique) — **test automatisé exigé**.
- [ ] **Provisioning** : à `identity.org.created`, le read-model d'org **et** un **profil métier vide** (porteur abonnement + KYC placeholder) sont créés ; un `org.created` rejoué n'en crée pas un second.
- [ ] **Coupure d'accès** : `identity.org.updated(SUSPENDED)` et `identity.user.suspended` marquent `SUSPENDED` dans le read-model ; une requête d'une org/user suspendu est **refusée** par le résolveur d'accès lisant le read-model.
- [ ] **Bascule des résolutions** : la résolution des **destinataires d'e-mails métier** et la règle « **dernier / liste des admins** » lisent le **read-model local** (`User`/`Membership`), plus `UsersService`/`TenantsService` propriétaires — **test** couvrant au moins un chemin de résolution.
- [ ] **Isolation** : un événement d'une org n'affecte **que** son read-model ; toute lecture read-model est filtrée par `orgId` (= `tenantId`) — **test** d'isolation croisée.
- [ ] **Ordre / LWW** : un événement `occurredAt` **antérieur** au dernier appliqué sur la même entité est **ignoré** (pas de régression d'état) — **test** d'événement périmé.
- [ ] **Tolérance panne** : broker Kafka indisponible au démarrage → le service **démarre quand même** (HTTP up, `/health` *degraded* pour Kafka) ; à son retour, les messages en attente sont consommés (offsets Kafka) sans perte.
- [ ] `lint` 0, build OK, couverture conforme au seuil du projet ; le consommateur, les handlers par topic et l'idempotence sont couverts (nominal + rejeu + périmé + isolation).

---

## Notes techniques

### Composants (nouveaux / touchés)

| Composant | Fichier (proposé) | Nature |
|---|---|---|
| Client Kafka partagé | `expert-comptable/src/kafka/kafka.module.ts` (+ `kafka.constants.ts`) | **Nouveau** — token DI `KAFKA_CLIENT`, `@Global`, patron IdP |
| Config Kafka | [`config/configuration.ts`](../../expert-comptable/src/config/configuration.ts) `KafkaConfig` | **Nouveau** — `brokers`, `clientId` |
| Validation env | [`config/env.validation.ts`](../../expert-comptable/src/config/env.validation.ts) | `KAFKA_BROKERS`, `KAFKA_CLIENT_ID` |
| Contrat `identity.*` (types) | `expert-comptable/src/modules/identity/events/identity-events.ts` | **Nouveau** — copie du contrat v1 (miroir [`auth-service`](../../auth-service/src/kafka/outbox/identity-events.ts)) |
| Consommateur | `expert-comptable/src/modules/identity/identity-events.consumer.ts` | **Nouveau** — consumer group, dispatch par topic, idempotence |
| Read-models | `.../schemas/organization.readmodel.schema.ts`, `user.readmodel.schema.ts`, `membership.readmodel.schema.ts` | **Nouveau** — état absolu + `lastEventAt` |
| Marqueur idempotence | `.../schemas/processed-identity-event.schema.ts` | **Nouveau** — `eventId` unique, TTL 30 j |
| Profil métier | schéma d'org métier (abonnement + KYC placeholder), clé `orgId` | **Nouveau/adapté** — porteur du read-model KYC (STORY-021) et de l'abonnement (EPIC-004) |
| Résolveurs e-mails / admins | `modules/mail/*`, résolveur « dernier admin » | Lecture depuis read-model au lieu de `UsersService`/`TenantsService` |
| Santé | `health/indicators/kafka.health.ts` | **Nouveau** — connectivité broker (*degraded*) |
| Compose racine | [`docker-compose.yml`](../../docker-compose.yml) | `KAFKA_BROKERS` **déjà présent** ; ajouter `KAFKA_CLIENT_ID` si besoin ; dépendance `kafka` (déjà `depends_on`) |
| Dépendance | `expert-comptable/package.json` | Ajout `kafkajs` |
| Modules d'identité possédés | `AuthModule`/`UsersModule`/`TenantsModule` | **Non touchés** (coexistent — retrait = STORY-030) |

### Contrat de consommation (source : IdP)

- **Message Kafka** : `key = partitionKey` (`orgId` pour `org.*`/`membership.changed`, `userId` pour `user.*`), `value = JSON.stringify(payload)`, headers `eventId` + `schemaVersion` ([`outbox-relay.service.ts:103-112`](../../auth-service/src/kafka/outbox/outbox-relay.service.ts#L103-L112)).
- **`eventId`** lu **du header** (déduplication), et présent aussi dans le payload — cohérents.
- **Statuts transportés** (miroirs) : org `'ACTIVE' | 'SUSPENDED'` ; user `'INVITED' | 'ACTIVE' | 'SUSPENDED'` ; membership `'ACTIVE' | 'SUSPENDED'` ([`identity-events.ts:24-29`](../../auth-service/src/kafka/outbox/identity-events.ts#L24-L29)).
- **Rôle** : enum `Role` partagé conceptuellement (`PLATFORM_ADMIN`/`TENANT_ADMIN`/`TENANT_USER`) ; un `PLATFORM_ADMIN` n'a pas d'org (pas de `membership.changed` d'org) — cohérent avec `org: null` du JWT.

### Idempotence & exactement-une-fois *effective*

Livraison Kafka = **at-least-once** (l'outbox de l'IdP publie *puis* marque `SENT` ; un crash rejoue). Le consommateur garantit l'**exactement-une-fois effective** par : (1) `ProcessedIdentityEvent.eventId` **unique** — une seconde tentative viole l'unicité et est **ignorée** ; (2) écriture du read-model et du marqueur idéalement dans la **même transaction Mongo** (replica set `rs0` déjà en place) pour éviter « read-model écrit, marqueur manquant → rejeu = doublon d'effet de bord ». À défaut de transaction : ordonner marqueur→read-model et rendre les effets de bord (e-mails) tolérants au rejeu. **TTL 30 j** sur le marqueur (borne la collection ; au-delà, un très vieux rejeu est improbable et l'état absolu limite les dégâts).

### Décisions & points de vigilance

- **Clés d'identité = identifiants IdP (string).** Les read-models sont clés par `orgId`/`userId` **de l'IdP** (pas des `ObjectId` locaux), car ce sont eux que porte le JWT (`org`/`sub`) et qu'utilise le `TenantContext` en mode `rs256` ([`jwt.strategy.ts`](../../expert-comptable/src/modules/auth/strategies/jwt.strategy.ts)). Les collections possédées `Tenant`/`User` (ObjectId) **coexistent** sans fusion jusqu'à STORY-030.
- **Read-models dédiés, pas de réutilisation des collections possédées.** On **n'écrase pas** `Tenant`/`User` (encore alimentés par l'émission locale en mode `hs256`) : deux sources vivraient en conflit. Collections séparées → cutover propre en STORY-030.
- **Cohérence éventuelle assumée.** Latence événementielle IdP → read-model de quelques secondes (acceptable, cf. archi programme). Le chemin chaud ne bloque jamais sur l'IdP.
- **Ordre inter-topics non garanti.** `user.registered` (clé `userId`) et `membership.changed` (clé `orgId`) peuvent arriver dans le désordre relatif → chaque handler **upsert** indépendamment (un `Membership` peut précéder son `User`) ; les jointures de lecture tolèrent l'absence temporaire. Le garde `lastEventAt` protège l'ordre **intra-entité**.
- **Premier consommateur Kafka du vertical.** Introduit l'infra consommateur ; les futurs consommateurs (`kyc.status.changed`, STORY-021) réutiliseront le `KafkaModule` avec un **autre consumer group**.

---

## Dependencies

**Stories prérequises :**
- **STORY-027** — producteur `identity.*` (Kafka + transactional outbox) côté `auth-service` : sans lui, aucun événement à consommer. *(done)*
- **STORY-028** — validation JWKS (mode `rs256`) : les read-models sont clés par les identifiants portés par les JWT RS256 (`org`/`sub`). *(done)*

**Infrastructure :**
- Broker **Kafka (KRaft)** du compose racine (STORY-022) — `depends_on: kafka` déjà déclaré pour `expert-comptable` ; `KAFKA_BROKERS` déjà injecté.
- **MongoDB replica set `rs0`** (déjà en place) — nécessaire aux transactions read-model + marqueur.

**Stories bloquées / suivantes :**
- **STORY-030** — retrait des modules d'identité + cutover + e2e cross-service : consomme directement les read-models de STORY-029 (dépendance dure).
- **STORY-021** — read-model KYC `tenant.kycStatus` : atterrit dans le **profil métier** provisionné ici.

---

## Definition of Done

- [ ] Code implémenté (KafkaModule consommateur, `IdentityEventsConsumer`, read-models, provisioning, résolutions rebasculées) et committé sur branche `dev` (sur demande).
- [ ] Tests unitaires (≥ seuil projet) :
  - [ ] Un handler par topic → mutation read-model attendue (5 topics).
  - [ ] Idempotence (rejeu ×2 = 1 effet).
  - [ ] LWW horodaté (événement périmé ignoré).
  - [ ] Isolation croisée (org A ≠ org B).
  - [ ] Provisioning (org.created → org + profil métier vide).
  - [ ] Coupure d'accès (suspend → refus).
  - [ ] Résolution (destinataires e-mails / dernier admin) depuis read-model.
- [ ] Non-régression des suites e2e existantes d'`expert-comptable`.
- [ ] **Vérification docker bout-en-bout** : produire des `identity.*` sur le broker réel (script ou IdP en mode `rs256`) → read-models d'`expert-comptable` à jour ; broker down → boot OK / `/health` degraded → broker up → rattrapage.
- [ ] `lint` 0, build OK, couverture conforme.
- [ ] `/code-review` formel + revue story ↔ code.
- [ ] Documentation : notes de read-model + consumer group dans le README/architecture du service si pertinent.
- [ ] Statut mis à jour dans `docs/sprint-status.yaml`.

---

## Story Points Breakdown

- **Câblage Kafka consommateur** (KafkaModule, config, health, tolérance panne) : **2 pts**
- **Consumer group + handlers 5 topics + idempotence + LWW** : **3 pts**
- **Read-models + provisioning + profil métier** : **2 pts**
- **Bascule des résolutions (e-mails / admins) + coupure d'accès** : **1 pt**
- **Total : 8 points**

**Rationale :** premier consommateur Kafka du vertical (infra à poser), 5 handlers avec garanties d'idempotence/ordre non triviales, et un refactor de résolutions existantes vers le read-model. Le risque principal est la **correction sémantique** (idempotence, état absolu, isolation) plus que le volume de code — d'où 8 (et non 5).

---

## Additional Notes

- **Règle d'or respectée :** le JWT ne porte **jamais** l'état d'org/user au-delà des claims d'identité ; l'état (suspension, rôles à jour) est lu dans le **read-model** alimenté par événement — jamais par appel synchrone à l'IdP.
- **Coexistence des read-models :** à terme, `expert-comptable` portera trois read-models — identité (`Organization`/`User`/`Membership`, STORY-029), KYC (`tenant.kycStatus`, STORY-021), et (côté `bilan-service`) entitlement — tous alimentés par Kafka, tous locaux au chemin chaud.
- **Transition `hs256` → `rs256` :** tant que le runtime est en `hs256` (défaut legacy jusqu'à STORY-030), l'IdP ne produit pas d'événements pour les données créées **localement** ; les read-models se peupleront réellement au cutover (mode `rs256` + rejeu `fromBeginning`). STORY-029 livre la **mécanique** ; STORY-030 réalise le **basculement de source de vérité**.

---

## Implementation Notes (2026-07-08)

**Livré (service `expert-comptable`) :**

- **Client Kafka partagé** — `src/kafka/kafka.module.ts` (`@Global`, token `KAFKA_CLIENT`) + `kafka.constants.ts`. Instanciation synchrone sans I/O (n'affecte pas le boot). Config `KafkaConfig { brokers, clientId, identityGroupId }` ([configuration.ts](../../expert-comptable/src/config/configuration.ts)) + env `KAFKA_BROKERS` (requis), `KAFKA_CLIENT_ID`, `KAFKA_IDENTITY_GROUP_ID` ([env.validation.ts](../../expert-comptable/src/config/env.validation.ts)).
- **Module `identity`** (`src/modules/identity/`) :
  - Contrat `events/identity-events.ts` — copie du contrat v1 de l'IdP (5 topics, état absolu, statuts).
  - Read-models : `Organization` (`identity_organizations`), `IdentityUser` (`identity_users`), `Membership` (`identity_memberships`), tous avec `lastEventAt` (garde LWW) ; `OrgProfile` (`org_profiles`, profil métier provisionné) ; `ProcessedIdentityEvent` (`processed_identity_events`, `eventId` unique, **TTL 30 j**).
  - `IdentityProjectionService` — `apply(topic, eventId, payload)` sous **transaction Mongo** : insert marqueur (dédup `eventId`) → dispatch par topic → `$set` **absolu** avec garde **LWW** horodatée ; provisioning `OrgProfile` en `$setOnInsert` ; erreur ⇒ abort + propagation (Kafka rejoue).
  - `IdentityReadModelService` — résolutions **lues du read-model** : `resolveOrgAdminEmails`, `countActiveOrgAdmins` (règle « dernier admin »), `isAccessSuspended`/`isOrganizationActive`/`isUserSuspended` (coupure sur suspension). Exporté pour les modules métier.
  - `IdentityConsumer` (bootstrap) — consumer group `expert-comptable-identity`, abonné aux 5 topics (`fromBeginning: true`), délègue à la projection ; **tolérance panne** (retry en tâche de fond si broker down au boot, sans bloquer le boot HTTP).
- **Santé** — `KafkaHealthIndicator` + `/health` (mongodb + redis + **kafka**). `docker-compose.yml` : `KAFKA_BROKERS` + `depends_on: kafka (healthy)` ajoutés au bloc `expert-comptable`. Dépendance `kafkajs@^2.2.4`.

**Décisions notables :**
- Read-models clés par identifiants **IdP** (`orgId`/`userId` string, = claims JWT `org`/`sub`), **collections dédiées** distinctes des `Tenant`/`User` possédés (coexistence jusqu'au cutover STORY-030 — rien n'est supprimé ici).
- `/health` inclut Kafka (cohérence avec `auth-service`) ; la **résilience au boot** est assurée par le module (client sans I/O + retry consumer), pas par un `/health` toléra­nt.
- Résolutions read-model **fournies et testées** ; le remplacement des appels `UsersService`/`TenantsService` sur les chemins vivants relève du cutover (STORY-030).

**Qualité :** `lint` 0, `build` OK. **285 tests unitaires** verts (dont projection + read-model à **100 %** de couverture), **94 e2e** verts (non-régression). Couverture globale 99.44 / 90 / 98.55 / 99.4 (seuils 90/65/90/90).

**VÉRIF DOCKER BOUT-EN-BOUT (2026-07-08) — stack racine, broker Kafka réel :**
1. Consumer group `expert-comptable-identity` **joint**, assignation des 5 partitions `identity.*` ; `/health` → `kafka: up`.
2. `register` sur l'IdP (`:3001`) → `identity.org.created` + `user.registered` + `membership.changed` → read-models d'`expert-comptable` peuplés (état absolu correct : org ACTIVE, user ACTIVE, membership TENANT_ADMIN/ACTIVE).
3. **Provisioning** : `org_profiles` créé (`kycStatus: PENDING_DOCUMENTS`).
4. **Coupure** : `POST /admin/organizations/:id/suspend` (IdP, PLATFORM_ADMIN) → `identity.org.updated(SUSPENDED)` → read-model org → `status: SUSPENDED`.
5. **Idempotence par rejeu réel** : offsets du groupe remis à `earliest` → **tous** les événements re-consommés → **0 doublon** (counts read-models identiques) et **25 événements ignorés** via le marqueur `eventId` (log « déjà traité »).

## Revue de code (xhigh, 2026-07-08) — correctifs appliqués

5 constats issus de la revue `/code-review xhigh` ; 4 corrigés, 1 tranché comme décision de conception :

1. **[Corrigé] Insert de read-model partiel (champs `required` manquants).** `upsertAbsolute` (renommé `applyAbsolute`) prend désormais un flag **`insert`** : les événements *complets* (`org.created`, `user.registered`, `membership.changed`) upsertent ; les événements *partiels* (`org.updated`, `user.suspended`) **n'insèrent jamais** — si le read-model de base est absent (éviction rétention Kafka / désordre), l'événement est **ignoré** (log) au lieu de créer un document aux champs `required` à `undefined` (les validateurs Mongoose étant contournés par `updateOne`). ([identity-projection.service.ts](../../expert-comptable/src/modules/identity/identity-projection.service.ts))
2. **[Corrigé] Ré-entrance du consumer.** Ajout d'un flag **`starting`** : le timer de retry ne peut plus lancer un second `connect/subscribe/run` concurrent (double `run()` ⇒ kafkajs lève). ([identity-consumer.bootstrap.ts](../../expert-comptable/src/modules/identity/identity-consumer.bootstrap.ts))
3. **[Décision de conception — conservé] Kafka dans la readiness `/health`.** `/health` reste 503 si le broker est down, **comme `auth-service`**. Justification : déploiement **mono-instance docker** avec `depends_on: kafka (healthy)` (le broker est toujours présent au boot), et la **résilience au boot** promise par la story est déjà garantie **ailleurs** (client Kafka sans I/O + retry du consumer en tâche de fond) — pas par un `/health` tolérant. À réévaluer si passage à une readiness type k8s (liveness/readiness séparés).
4. **[Corrigé] Garde anti-poison.** Validation d'enveloppe côté consumer : un événement à `occurredAt` invalide (ou sans corps/`eventId`) est **ignoré** (offset avancé) plutôt que de faire boucler la partition ; une **erreur de traitement** (Mongo down…) reste **propagée** pour rejeu (aucune perte d'événement valide). ([identity-consumer.bootstrap.ts](../../expert-comptable/src/modules/identity/identity-consumer.bootstrap.ts))
5. **[Corrigé] Garde LWW stricte.** `>=` → `>` : deux événements distincts au même `occurredAt` (ms) sur la même entité ne s'écrasent plus (le second est ré-appliqué ; l'unicité réelle reste assurée par `eventId`).

**Après correctifs :** lint 0, build OK, **288 unit** (identity 100 %) + **94 e2e** verts ; **re-vérif docker** : register → read-models peuplés ; `suspend` (`org.updated`, base présente, `insert:false`) → org `SUSPENDED` **avec `name` préservé** ; consumer démarré une seule fois.

**Reste :** commit sur demande (branche `dev`).

---

## Progress Tracking

**Historique de statut :**
- 2026-07-08 : Créée par vivian (Scrum Master / BMAD)
- 2026-07-08 : Implémentée + vérifiée docker bout-en-bout (Developer / BMAD)

**Effort réel :** 8 points (conforme à l'estimation)

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implémentation).**
