---
baseline_commit: NO_VCS
---

# STORY-027 : Événements identity.* (producteur Kafka + outbox) + admin organisations

**Epic :** EPIC-005 — Extraction `auth-service` (fournisseur d'identité / IdP)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` §Contrat d'événements `identity.*` (v1) — source de vérité · §Conception de l'API (Admin plateforme) · `architecture-prospera-ecosystem-2026-07-04.md` (transport Kafka, patron outbox, cohérence éventuelle)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Implémenté + vérifié docker bout-en-bout (2026-07-08) — reste : `/code-review` formel + commit sur demande
**Assigné à :** Unassigned
**Créée le :** 2026-07-08
**Sprint :** 4
**Service :** auth-service (`:3001`)
**Couvre :** propagation `identity.*` (drivers 4 « autonomie des consommateurs ») + FR-012 (tranche identité : admin plateforme des organisations)

> **Dernière story d'EPIC-005 : l'IdP cesse d'être muet.** STORY-023→026 ont construit l'identité **locale** (organisations, users, memberships, rôles, seed `PLATFORM_ADMIN`) et l'émission RS256/JWKS, mais **aucune mutation n'est publiée** : les seams `identity.*` sont **inertes** (cf. `publishIdentityCreated()` « Inerte jusqu'à STORY-027 » [auth.service.ts:406-411](../../auth-service/src/modules/auth/auth.service.ts#L406-L411)). STORY-027 branche le **transactional outbox** : chaque mutation d'identité (register, invitation acceptée, changement de rôle, suspension, soft-delete, MAJ profil d'org, suspension admin) écrit un **événement d'outbox dans sa propre transaction**, qu'un **relais** publie ensuite sur **Kafka** (topics `identity.*`, clé de partition `orgId`, `eventId` idempotent). Elle livre aussi le **volet identité du dashboard admin** (`GET/POST /admin/organizations/*`, `[PLATFORM_ADMIN]`) reporté par STORY-026 — dont la **suspension d'organisation** qui coupe l'accès partout via `identity.org.updated`. À l'issue de 027, `expert-comptable` (STORY-029) peut bâtir son read-model d'identité par consommation. **`auth-service` n'émet toujours aucun état métier** (A3 : ni KYC, ni abonnement, ni entitlement).

---

## User Story

En tant que **relying party** de l'écosystème (`expert-comptable`, `kyc-service`, futurs verticaux), je veux **recevoir de façon fiable les changements d'identité** (organisation, utilisateur, appartenance, suspension) via des **événements `identity.*` sur Kafka**,
et en tant qu'**opérateur de la plateforme** (`PLATFORM_ADMIN`), je veux **lister/inspecter et suspendre les organisations**,
afin que **chaque service réplique l'identité et provisionne/coupe l'accès sans jamais interroger l'IdP sur le chemin chaud**, et que **la plateforme puisse gouverner les organisations de bout en bout**.

---

## Description

### Contexte

L'IdP sait aujourd'hui **muter** l'identité en local mais pas la **propager**, et l'admin plateforme n'a **aucun endpoint** :

- Le producteur Kafka partagé existe (`KafkaProducerService.send(topic, messages)`, STORY-022) mais ne sert qu'au **round-trip de santé** ; aucun topic métier n'est produit ([kafka-producer.service.ts:45-47](../../auth-service/src/kafka/kafka-producer.service.ts#L45-L47)).
- Les seams de publication sont **inertes et documentés** : `AuthService.publishIdentityCreated()` est un no-op « Inerte jusqu'à STORY-027 » ; STORY-025/026 notent que les mutations (invitation, rôle, suspension, soft-delete) changent l'**état local** sans publier (« seam documenté, pas un oubli »).
- **Aucun** endpoint `/admin/organizations/*` : STORY-026 s'est limitée à **seeder** le `PLATFORM_ADMIN` et à rendre son rôle **opérant** dans les jetons (`roles:['PLATFORM_ADMIN']`, `org:null`) ; l'admin plateforme des organisations était explicitement reporté ici.

STORY-027 apporte trois briques :

1. **Contrat `identity.*` (v1)** — types partagés (`IdentityOrgCreatedV1`, `IdentityOrgUpdatedV1`, `IdentityUserRegisteredV1`, `IdentityMembershipChangedV1`, `IdentityUserSuspendedV1`) et constantes de topics, **fidèles à la source de vérité** de l'architecture (`schemaVersion`, `eventId`, `occurredAt`, état absolu). C'est le contrat que les consommateurs (STORY-029, kyc, bilan) implémenteront.

2. **Transactional outbox + relais** — une collection `OutboxEvent` ; chaque mutation d'identité **écrit son (ses) événement(s) dans la même transaction** que le changement d'état (register/invite/rôle/suspension/soft-delete/MAJ org/suspend admin), garantissant « pas d'état muté sans événement, pas d'événement sans état muté ». Un **relais** (`OutboxRelayService`, polling) lit les événements `PENDING`, les **publie sur Kafka** (`KafkaProducerService`, clé = `orgId`), les marque `SENT` ; **at-least-once** avec `eventId` pour la déduplication côté consommateur. Cela **remplace** les seams post-commit inertes par une publication fiable (l'ancien `publishIdentityCreated` post-commit — non transactionnel — devient une écriture d'outbox **dans** la transaction de `register`).

3. **Admin plateforme des organisations** (`[PLATFORM_ADMIN]`) — `GET /admin/organizations` (liste/recherche **inter-org**, paginée), `GET /admin/organizations/:id` (détail identité + membres), `POST /admin/organizations/:id/suspend` (suspend l'org → `Organization.status=SUSPENDED` **+** `identity.org.updated` → coupe l'accès dans chaque vertical via leur read-model). Ces endpoints sont **globaux** (non org-scopés) et réservés au `PLATFORM_ADMIN` seedé en STORY-026.

### Périmètre

**Inclus :**

- **Contrat & topics `identity.*` (v1)** :
  - `src/kafka/identity-events.ts` (ou `src/modules/identity-events/`) : interfaces des 5 événements + constantes de topics + `enum IdentityTopic`. Champs communs : `schemaVersion: 1`, `eventId: string` (UUID), `occurredAt: string` (ISO-8601). État **absolu** (pas de delta).
  - **Matrice d'émission** (topic ← déclencheur) :
    | Topic | Déclencheur (mutation) | Clés du payload |
    |---|---|---|
    | `identity.org.created` | `register` (création d'org) | `orgId, name, slug, country, status, createdByUserId` |
    | `identity.org.updated` | `PATCH /organizations/me` ; `POST /admin/organizations/:id/suspend` | `orgId, name?, status` |
    | `identity.user.registered` | `register` (admin) ; invitation **acceptée** (user devient `ACTIVE`) | `userId, email, firstName, lastName, status` |
    | `identity.membership.changed` | création (register/invite) ; `PATCH /users/:id {role\|status}` ; soft-delete | `userId, orgId, role, status` |
    | `identity.user.suspended` | `PATCH /users/:id {status:SUSPENDED}` ; soft-delete | `userId, status` |
- **Collection `OutboxEvent`** (`src/kafka/outbox/`) :
  - Schéma : `eventId` (unique), `topic`, `partitionKey` (=`orgId`, ou `userId` pour `user.*` sans org), `schemaVersion`, `payload` (le corps complet de l'événement), `status` (`PENDING|SENT`), `attempts`, `createdAt`, `sentAt?`, `lastError?`. Index `{ status:1, createdAt:1 }` (relais) + `{ eventId:1 }` unique.
  - `OutboxService.enqueue(event, session)` : **exige** une `session` (l'écriture d'outbox est **toujours** dans la transaction de la mutation) ; construit `eventId` (UUID), `occurredAt`, `partitionKey`.
- **Relais (`OutboxRelayService`)** :
  - Boucle de **polling** (intervalle configurable, défaut ~2 s) : réclame un lot de `PENDING` (les plus anciens d'abord), publie chacun via `KafkaProducerService.send(topic, [{ key: partitionKey, value: JSON.stringify(payload), headers: { eventId, schemaVersion } }])`, marque `SENT` (`sentAt`). Échec de publication → laisse `PENDING`, incrémente `attempts`/`lastError`, retente au tick suivant (backoff simple).
  - **Tolérance panne Kafka** alignée sur STORY-022 : un broker indisponible ne fait **jamais** échouer une mutation (l'événement reste en outbox, publié dès que Kafka revient) ni le boot HTTP.
  - **Ordre** : clé de partition `orgId` ⇒ ordre par organisation préservé ; le relais publie dans l'ordre `createdAt`.
- **Branchement dans les mutations existantes** (écriture d'outbox **dans la transaction**) :
  - `AuthService.register` : remplace `publishIdentityCreated()` (post-commit inerte) par `outbox.enqueue(org.created + user.registered + membership.changed)` **dans** la transaction `register`.
  - `InvitationService.accept` (user → `ACTIVE`) : `user.registered` (+ `membership.changed`) dans la transaction d'acceptation.
  - `UserManagementService.updateMember` : `membership.changed` (rôle/statut) et, si suspension, `user.suspended` — dans la transaction existante.
  - `UserManagementService.removeMember` (soft-delete) : `user.suspended` + `membership.changed`.
  - `OrganizationsService.updateProfile` : `org.updated`.
- **Admin plateforme des organisations** — nouveau `AdminModule` / `AdminOrganizationsController` (`[PLATFORM_ADMIN]`, **inter-org**) :
  - `GET /api/v1/admin/organizations` — liste/recherche **globale** paginée (`page`/`limit`, filtres `status?`, `q?` sur name/slug), renvoie identité + statut + compteur de membres.
  - `GET /api/v1/admin/organizations/:id` — détail identité d'une org + ses membres (jointure `Membership`→`User`).
  - `POST /api/v1/admin/organizations/:id/suspend` — `Organization.status=SUSPENDED` **dans une transaction** + `identity.org.updated {status:SUSPENDED}` en outbox. Idempotent (org déjà suspendue → 200/no-op). *(Réactivation `POST /:id/reactivate` : cf. Décisions ouvertes.)*
- **Idempotence & sécurité de contenu** : `eventId` (UUID) unique par événement ; les payloads **ne portent jamais** de secret (pas de `passwordHash`, pas de token, pas de refresh). `email`/noms transportés (identité, nécessaires aux read-models et à la résolution des destinataires côté verticaux).
- **Swagger** : nouveau tag `admin` (organizations list/detail/suspend) — 200/400/403/404 ; messages génériques.
- **Tests** : unit (outbox écrit **sous session** ; relais publie + marque `SENT` ; retry si Kafka down ; idempotence `eventId` ; payloads conformes au contrat ; admin RBAC/pagination/recherche ; suspend émet `org.updated`) + e2e (mutations → événements en outbox → `SENT` ; admin list/detail/suspend) + **vérification docker** (consommer réellement les topics `identity.*` sur le broker — cf. DoD).

**Hors périmètre :**

- **Consommation des `identity.*`** (read-models, provisioning, coupure d'accès) côté `expert-comptable` → **STORY-029** ; côté `kyc-service` → STORY-020/021 ; côté `bilan-service` → STORY-036. 027 est **producteur only**.
- **Retrait des modules d'identité d'`expert-comptable` / cutover HS256→RS256** → STORY-028/030.
- **Schema registry / Avro / compatibilité forward** : phase 1 = JSON + `schemaVersion` entier ; l'evolution de schéma (v2) est différée (le champ `schemaVersion` la prépare).
- **Deny-list de jetons / révocation immédiate de l'access token** : la suspension coupe via read-model + expiration naturelle (≤ 15 min) ; le durcissement (deny-list) reste hors périmètre (déjà acté STORY-026).
- **Dashboard admin agrégé (FR-012 complet)** : croise identité + KYC + entitlement → **`admin-panel` (BFF)** (P8, A3). 027 ne livre que la **tranche identité** (organisations).
- **Relais par change-stream MongoDB** : le polling suffit en phase 1 (volumétrie faible) ; le change-stream est une optimisation différée (cf. Décisions ouvertes).
- **Réémission/rejeu manuel d'événements, purge/archivage de l'outbox** : hors périmètre MVP (rétention simple ; purge dédiée plus tard).

### Flux

**A. Propagation (transactional outbox)**
1. Un `TENANT_ADMIN` fait `PATCH /users/:id {status:'SUSPENDED'}` → **dans la transaction** : `Membership.status`/`User.status`=SUSPENDED, `refreshTokenHash` effacé, **+ 2 événements d'outbox** (`membership.changed`, `user.suspended`), `PENDING`.
2. Le **relais** (tick suivant) lit ces `PENDING`, publie sur `identity.membership.changed` / `identity.user.suspended` (clé `orgId`/`userId`), marque `SENT`.
3. Si Kafka est **down** : la mutation a **réussi** (l'outbox est écrit), les événements restent `PENDING` et partent **dès le retour** du broker. Aucune perte, aucune mutation bloquée.
4. Un consommateur (STORY-029) reçoit l'événement, **déduplique sur `eventId`**, met à jour son read-model → l'utilisateur suspendu perd l'accès dans le vertical.

**B. Admin plateforme (PLATFORM_ADMIN)**
1. Le `PLATFORM_ADMIN` (seedé STORY-026) `login` → `roles:['PLATFORM_ADMIN']`, `org:null`.
2. `GET /admin/organizations?status=ACTIVE&q=cabinet` → liste **inter-org** paginée.
3. `GET /admin/organizations/:id` → détail + membres.
4. `POST /admin/organizations/:id/suspend` → `Organization.status=SUSPENDED` + `identity.org.updated{status:SUSPENDED}` (outbox) → **200** ; les verticaux couperont l'accès de toute l'org via leur read-model. Re-suspend → **200** no-op.
5. Un `TENANT_ADMIN`/`TENANT_USER` sur ces routes → **403** (rôle plateforme requis).

---

## Acceptance Criteria

- [ ] **Contrat `identity.*` (v1)** : 5 interfaces typées + constantes de topics/`enum IdentityTopic` conformes à l'architecture (`schemaVersion:1`, `eventId`, `occurredAt` ISO, état absolu). Les payloads **ne contiennent aucun secret** (ni `passwordHash`, ni token/refresh).
- [ ] **Outbox transactionnel** : `OutboxService.enqueue(event, session)` **exige une session** et écrit l'événement **dans la même transaction** que la mutation ; si la transaction **rollback**, **aucun** événement n'est persisté (prouvé par test : mutation en échec → 0 ligne d'outbox). `eventId` unique (index).
- [ ] **Register** émet, **dans sa transaction**, `identity.org.created` + `identity.user.registered` + `identity.membership.changed` (le no-op `publishIdentityCreated` post-commit est **supprimé/remplacé**). Un `register` réussi ⇒ exactement 3 lignes d'outbox liées ; un `register` en conflit (409) ⇒ 0 ligne.
- [ ] **Mutations propagées** : invitation acceptée → `user.registered` (+`membership.changed`) ; `PATCH /users/:id {role}` → `membership.changed` ; `{status:SUSPENDED}` → `membership.changed` + `user.suspended` ; `{status:ACTIVE}` (réactivation) → `membership.changed` ; soft-delete → `user.suspended` + `membership.changed` ; `PATCH /organizations/me` → `org.updated`. Chaque payload est conforme au contrat (état absolu).
- [ ] **Relais** : `OutboxRelayService` publie les `PENDING` (ordre `createdAt`) via `KafkaProducerService` avec **clé de partition = `orgId`** (ou `userId` pour `user.*` sans org) et header `eventId`, puis marque `SENT` (`sentAt`). Publié **au plus une fois marqué SENT**, **at-least-once** garanti (un crash entre publish et markSent ⇒ re-publication ⇒ dédup consommateur sur `eventId`).
- [ ] **Tolérance panne Kafka** : Kafka **down** ⇒ (1) la mutation réussit quand même, (2) l'événement reste `PENDING` (`attempts` incrémenté), (3) il est publié **dès le retour** du broker, (4) le boot HTTP n'échoue jamais. Aucune mutation d'identité n'est bloquée par l'indisponibilité du bus.
- [ ] **Admin — liste** : `GET /api/v1/admin/organizations` (`[PLATFORM_ADMIN]`) renvoie **toutes** les organisations (inter-org), paginé (`page`/`limit`), filtrable (`status`, `q` name/slug) ; un `TENANT_ADMIN`/`TENANT_USER` → **403**.
- [ ] **Admin — détail** : `GET /api/v1/admin/organizations/:id` renvoie l'identité de l'org + ses membres ; id inconnu → **404**.
- [ ] **Admin — suspension** : `POST /api/v1/admin/organizations/:id/suspend` passe `Organization.status=SUSPENDED` **dans une transaction** et émet `identity.org.updated{status:SUSPENDED}` (outbox) → **200** ; idempotent (déjà suspendue → **200** no-op, pas de doublon d'événement incohérent). Le login d'un membre d'une org suspendue reste **401 générique** (contrôle existant STORY-024/026).
- [ ] **RBAC & isolation** : les routes `/admin/*` exigent `@Roles(PLATFORM_ADMIN)` (chaîne de guards existante) ; elles sont **globales** (non filtrées par `orgId`) — c'est le **seul** endroit où l'on sort de l'org-scope, réservé à l'opérateur plateforme.
- [ ] **Qualité** : `lint` 0 warning ; **couverture** ≥ seuils du gate repo (90/65/90/90, cf. STORY-026) **sans exclusion** des fichiers de la story (outbox, relais, admin) ; `nest build` OK ; suites STORY-022→026 **toujours vertes**.
- [ ] **`docker compose up` (racine)** : vérifié bout-en-bout sur **broker réel** — (1) un consommateur de test abonné à `identity.*` **reçoit** les événements après `register` / `PATCH role` / suspension / `admin suspend`, avec `eventId`, clé `orgId`, payload conforme ; (2) Kafka arrêté puis muté puis redémarré ⇒ l'événement `PENDING` **part au retour** ; (3) `admin/organizations` list/detail/suspend via `PLATFORM_ADMIN` seedé. Résultats consignés en *Progress Tracking*.

---

## Technical Notes

### Composants / fichiers (auth-service)

```
src/kafka/identity-events.ts                     # interfaces IdentityXxxV1 + IdentityTopic + constantes  (NOUVEAU)
src/kafka/outbox/outbox-event.schema.ts          # collection OutboxEvent (status, eventId unique, partitionKey)  (NOUVEAU)
src/kafka/outbox/outbox.service.ts               # enqueue(event, session) — écrit SOUS session  (NOUVEAU)
src/kafka/outbox/outbox-relay.service.ts         # polling → KafkaProducerService.send → markSent + retry  (NOUVEAU)
src/kafka/outbox/outbox.module.ts                # (ou étend KafkaModule) providers + schema Mongoose  (NOUVEAU)
src/kafka/kafka.constants.ts                     # + topics identity.* (ou dans identity-events.ts)
src/kafka/kafka-producer.service.ts              # inchangé (send accepte déjà key/headers via Message)

src/modules/auth/auth.service.ts                 # register: outbox.enqueue(org.created+user.registered+membership.changed) DANS la tx ; supprime publishIdentityCreated no-op
src/modules/users/invitation.service.ts          # accept: outbox.enqueue(user.registered [+membership.changed]) DANS la tx
src/modules/users/user-management.service.ts     # updateMember/removeMember: outbox.enqueue(membership.changed / user.suspended) DANS la tx existante
src/modules/organizations/organizations.service.ts  # updateProfile: outbox.enqueue(org.updated)  (+ suspendByAdmin)

src/modules/admin/admin-organizations.controller.ts  # GET / , GET /:id , POST /:id/suspend  [PLATFORM_ADMIN]  (NOUVEAU)
src/modules/admin/admin-organizations.service.ts     # listAll(paginé, q, status), getWithMembers, suspend(tx + outbox)  (NOUVEAU)
src/modules/admin/admin.module.ts                    # (NOUVEAU)
src/modules/admin/dto/*.ts                            # ListOrganizationsQueryDto, OrganizationAdminDto, OrganizationDetailDto  (NOUVEAU)

src/config/configuration.ts                      # + outbox.relayIntervalMs / batchSize (défauts)
docker-compose.yml (racine)                       # (défauts déjà en place ; rien de neuf sauf éventuel OUTBOX_RELAY_INTERVAL_MS)
```

### Transactional outbox — le cœur

- **Invariant** : *pas de mutation d'identité sans événement, pas d'événement sans mutation*. Obtenu en écrivant la ligne d'outbox **dans la même transaction Mongo** (`session`) que le changement d'état. `OutboxService.enqueue(event, session)` **refuse** (type-level : `session` requis) une écriture hors transaction. Rollback ⇒ l'outbox n'a rien.
- **Pourquoi remplacer les seams post-commit** : `register` publiait via `runPostRegistrationHooks` **après** `commitTransaction` (fenêtre de perte : commit OK puis process meurt avant publication). L'outbox **dans** la transaction ferme cette fenêtre. Le hook post-commit devient donc, pour l'identité, une **écriture d'outbox in-tx** ; l'e-mail de vérification (BullMQ) **reste** post-commit (best-effort, déjà toléré).
- **Relais at-least-once** : `publish` **puis** `markSent`. Un crash entre les deux ⇒ re-publication au prochain tick ⇒ **doublon** côté bus → les consommateurs **dédupliquent sur `eventId`** (contrat). On n'essaie **pas** l'exactly-once (pas de transaction Kafka+Mongo distribuée) : at-least-once + idempotence consommateur, patron standard.
- **Réclamation de lot** : lecture des `PENDING` triés `createdAt` (index `{status:1, createdAt:1}`) ; en mono-instance (équipe 1, 1 replica) pas de contention ; si multi-instance plus tard, `findOneAndUpdate` atomique (`PENDING`→`PROCESSING` + `attempts++`) évite le double envoi. Documenter le choix mono-instance en phase 1.
- **Clé de partition** : `orgId` pour tous les événements rattachables à une org (`org.*`, `membership.changed`) → ordre par organisation. `user.*` sans org (ex. futur multi-org) : `userId`. Header Kafka `eventId` + `schemaVersion` (traçabilité NFR-005).

### Contrat (rappel, source de vérité = archi §identity.*)

```typescript
export interface IdentityEventBase {
  schemaVersion: 1;
  eventId: string;       // UUID — idempotence consommateur
  occurredAt: string;    // ISO-8601
}
export interface IdentityOrgCreatedV1 extends IdentityEventBase {
  orgId: string; name: string; slug: string; country: string;
  status: 'ACTIVE' | 'SUSPENDED'; createdByUserId: string;
}
export interface IdentityOrgUpdatedV1 extends IdentityEventBase {
  orgId: string; name?: string; status: 'ACTIVE' | 'SUSPENDED';
}
export interface IdentityUserRegisteredV1 extends IdentityEventBase {
  userId: string; email: string; firstName: string; lastName: string;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED';
}
export interface IdentityMembershipChangedV1 extends IdentityEventBase {
  userId: string; orgId: string; role: Role; status: 'ACTIVE' | 'SUSPENDED';
}
export interface IdentityUserSuspendedV1 extends IdentityEventBase {
  userId: string; status: 'SUSPENDED';
}
```

### Admin plateforme (le seul endroit non org-scopé)

- `@Roles(PLATFORM_ADMIN)` via la chaîne de guards globale (STORY-024) ; le `PLATFORM_ADMIN` a `org:null` → **ne pas** appliquer le filtre `orgId` du membership (ces requêtes sont **inter-org** par nature). Bien vérifier qu'aucun intercepteur/tenant-scope n'injecte un filtre `orgId` ici.
- **Suspension** : transaction (`Organization.status`) + `outbox.enqueue(org.updated)` **dans** la même transaction (cohérent avec l'invariant outbox). Idempotent : si déjà `SUSPENDED`, renvoyer 200 sans réécrire ni ré-émettre un événement redondant (ou émettre un `org.updated` idempotent — état absolu ⇒ inoffensif, mais éviter le bruit).
- La suspension d'org **ne révoque pas** les access tokens en vol (stateless, ≤15 min) ; elle coupe l'accès via (a) le contrôle « org suspendue » au **login/refresh** (existant) et (b) le read-model des verticaux (STORY-029). Documenté, cohérent avec STORY-026.

### Cas limites

- **Kafka down au boot / pendant une rafale** : mutations OK, outbox s'accumule, relais rattrape au retour. Vérifié en docker (AC).
- **Relais publie mais crash avant markSent** → re-publication → dédup `eventId` consommateur. Test : simuler l'échec de `markSent`, vérifier la re-publication au tick suivant.
- **register en conflit (409)** : transaction rollback ⇒ **0** événement d'outbox (test anti-régression).
- **PATCH sans changement réel** (même rôle/statut) : pas de mutation ⇒ pas d'événement (cohérent avec le no-op 200 de STORY-026) — ou événement idempotent selon impl ; **recommandé : ne pas émettre** si l'état est inchangé.
- **Suspension d'un membre déjà suspendu / re-suspend d'org** : idempotent, pas de doublon d'événement incohérent.
- **Payload volumineux / PII** : seuls `email` + noms voyagent (nécessaires read-models) ; **jamais** de hash/token. Revue de sécurité sur le contenu des payloads.
- **Ordre inter-événements d'une même mutation** (ex. `membership.changed` avant/après `user.suspended`) : même clé de partition `orgId` ⇒ ordre `createdAt` respecté ; documenter que les consommateurs doivent tolérer l'ordre d'écriture.

---

## Dependencies

**Stories prérequises :**
- **STORY-022** ✅ (client Kafka partagé `KAFKA_CLIENT`, `KafkaProducerService.send`, `KafkaBootstrapService`, tolérance panne au boot).
- **STORY-023** ✅ (transactions rs0 `withTransaction`, modèle `Organizations/Users/Memberships`, `register` atomique — point d'ancrage des premiers événements).
- **STORY-024** ✅ (chaîne de guards `RolesGuard` global + `@Roles`, contrôle « org suspendue » au login/refresh).
- **STORY-025** ✅ (invitation/acceptation — point d'émission `user.registered` à l'acceptation).
- **STORY-026** ✅ (mutations rôle/suspension/soft-delete transactionnelles `UserManagementService`, `updateProfile` org, **seed `PLATFORM_ADMIN` + rôle opérant** — indispensable pour `@Roles(PLATFORM_ADMIN)` sur `/admin/*` ; seams identity.* laissés inertes ici).

**Stories débloquées par celle-ci :**
- **STORY-029** (read-models identité + consumer `identity.*` côté `expert-comptable`) : consomme les topics produits ici.
- **STORY-021** (topic `kyc.status.changed`) et **STORY-036** (bilan-service) : réutilisent le **patron outbox** posé ici.
- **STORY-034** (entitlement.changed, catalog-service) : « producteur Kafka + outbox » explicitement modelé sur ce patron.

**Dépendances externes :** aucune nouvelle (Kafka/KRaft déjà dans le compose racine STORY-022). `uuid` (ou `crypto.randomUUID`) pour `eventId`.

---

## Definition of Done

- [ ] **Contrat `identity.*` (v1)** : 5 interfaces + topics/`enum` conformes à l'architecture ; aucun secret dans les payloads.
- [ ] **Outbox** : schéma `OutboxEvent` (eventId unique, status, partitionKey, index `{status,createdAt}`) + `OutboxService.enqueue(event, session)` **exigeant une session** (écriture in-tx) ; rollback ⇒ 0 événement (testé).
- [ ] **Relais** : `OutboxRelayService` (polling configurable) publie via `KafkaProducerService` (clé `orgId`, header `eventId`), marque `SENT`, retente les échecs (`attempts`/`lastError`), tolère Kafka down (aucune mutation bloquée, aucun crash de boot).
- [ ] **Branchement mutations** : register / invite-accept / PATCH role / PATCH status (suspend+réactiver) / soft-delete / PATCH organizations/me émettent les événements de la **matrice**, **dans leur transaction** ; `publishIdentityCreated` no-op **supprimé**.
- [ ] **Admin plateforme** : `AdminOrganizationsController` — `GET /admin/organizations` (paginé, `status`/`q`), `GET /admin/organizations/:id` (+ membres), `POST /admin/organizations/:id/suspend` (tx + `org.updated`, idempotent) ; toutes `[PLATFORM_ADMIN]`, **inter-org** (pas de filtre `orgId`).
- [ ] **DTO / Swagger** : `ListOrganizationsQueryDto`, `OrganizationAdminDto`, `OrganizationDetailDto` ; tag `admin` documenté (200/400/403/404, messages génériques).
- [ ] **Tests** :
  - [ ] Unitaires : `enqueue` sous session ; rollback ⇒ 0 ligne ; relais publie + markSent ; retry si publish échoue ; dédup au niveau `eventId` (unicité) ; payload de chaque événement conforme ; admin list (pagination/filtre/recherche) ; admin suspend émet `org.updated` + idempotence ; RBAC 403 non-PLATFORM_ADMIN.
  - [ ] e2e : mutations → lignes d'outbox → passées `SENT` ; admin list/detail/suspend via `PLATFORM_ADMIN`.
- [ ] `npm run test:cov` ≥ seuils (**sans** exclure outbox/relais/admin) ; `npm run test:e2e` vert ; suites STORY-022→026 vertes ; `eslint --max-warnings 0` ; `nest build` OK.
- [ ] **CRITICAL — vérification docker** (`.agents/rules/qualite-verification.md`) : `docker compose up` (racine) + **consommateur réel** abonné à `identity.*` → réception après register/PATCH/suspend (eventId, clé orgId, payload conforme) ; **scénario Kafka down→up** (événement `PENDING` publié au retour) ; admin list/detail/suspend. Résultats consignés en *Progress Tracking*.
- [ ] Revue de code (`/code-review`) — **à déclencher par l'utilisateur**. Points d'attention : **atomicité outbox/mutation** (écriture bien sous session, rollback = 0 événement), **at-least-once + idempotence** (dédup `eventId`, pas d'exactly-once fictif), **tolérance panne Kafka** (aucune mutation bloquée), **contenu des payloads** (aucun secret/PII superflu), **admin inter-org** (pas de fuite mais bien PLATFORM_ADMIN-only), **ordre par clé de partition**.
- [ ] Statut synchronisé (en-tête story + `sprint-status.yaml` + Progress Tracking).
- [ ] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **Contrat `identity.*` + collection/service outbox (enqueue in-tx)** : **1.5 pt**
- **Relais (polling, publish, markSent, retry, tolérance Kafka down)** : **1.5 pt**
- **Branchement des 6 points de mutation (register/invite/role/status/delete/org)** : **1 pt**
- **Admin plateforme des organisations (list/detail/suspend + DTO/Swagger)** : **0.5 pt**
- **Tests (unit + e2e) + vérification docker (consommateur réel, scénario down→up)** : **0.5 pt**
- **Total : 5 points**

**Rationale :** le producteur Kafka et le patron transactionnel **existent déjà** (STORY-022/023) et les seams sont **posés** (`publishIdentityCreated` inerte, hooks documentés) — le neuf est l'**outbox + relais** (nouveau patron pour l'équipe, à valider sur broker réel) et 3 endpoints admin **repris** de la même mécanique que les CRUD existants. Cohérent avec le sprint-plan (Sprint 4, 5 pts) ; dernière story d'EPIC-005.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Relais : polling vs change-stream MongoDB** — **Recommandé : polling** (intervalle ~2 s, simple, robuste, suffisant à faible volumétrie). *Alternative :* change-stream (temps réel, plus de latence en moins) — différé, le champ `status`/index restent compatibles.
2. **Réclamation de lot mono- vs multi-instance** — **Recommandé :** patron **mono-instance** (équipe 1, 1 replica) avec lecture `PENDING` triée ; documenter que le passage multi-instance exigera `findOneAndUpdate` atomique (`PENDING`→`PROCESSING`). *Alternative :* verrouillage atomique dès maintenant — surcoût inutile en phase 1.
3. **Emplacement du contrat** — **Recommandé :** `src/kafka/identity-events.ts` (proche du transport). *Alternative :* futur package partagé `@prospera/contracts` (quand les consommateurs seront extraits) — différé ; garder les interfaces **exportables** pour cette extraction.
4. **Réactivation d'org côté admin** (`POST /:id/reactivate`) — **Recommandé :** l'**ajouter** (symétrie avec suspend, émet `org.updated{status:ACTIVE}`) si peu coûteux ; sinon différer. L'architecture ne liste que `suspend` explicitement.
5. **PATCH sans changement effectif** — **Recommandé :** **ne pas émettre** d'événement si l'état est inchangé (évite le bruit) ; les payloads étant en **état absolu**, un doublon resterait toutefois inoffensif côté consommateur.
6. **`markSent` : suppression vs conservation** — **Recommandé :** **conserver** la ligne `SENT` (audit/traçabilité NFR-005) avec purge différée ; *alternative :* supprimer après envoi (outbox mince) — écartée (perte d'audit).

### Notes diverses

- **Patron réutilisable** : l'outbox + relais posés ici sont le **gabarit** explicitement réutilisé par STORY-021 (`kyc.status.changed`) et STORY-034 (`entitlement.changed`). Soigner la lisibilité/réutilisabilité.
- **A3 préservé** : `auth-service` n'émet **que** de l'identité — jamais KYC, abonnement ni entitlement. Les payloads le reflètent (pas de champ métier).
- **Cohérence éventuelle assumée** (driver 4) : les consommateurs voient les changements avec un léger délai (relais + réseau) ; le login/refresh « org/user suspendu » (synchrone, existant) reste le garde-fou immédiat côté IdP.
- **Pas de commit sans demande** : implémentation → vérification docker → commit uniquement sur demande explicite (cf. STORY-025/026).

---

## Progress Tracking

**Historique de statut :**
- 2026-07-08 : Story créée (Scrum Master). En `not_started`. Prête pour `/dev-story STORY-027`.
- 2026-07-08 : **Implémentation (Developer)**. Nouveaux fichiers : contrat `identity-events.ts` (5 interfaces + `IdentityTopic`), `OutboxEvent` (schéma + index `{status,createdAt}` + `eventId` unique), `OutboxService.enqueue(session)` (écriture **sous session**), `IdentityEventsService` (5 builders typés, clé de partition orgId/userId), `OutboxRelayService` (polling configurable → `KafkaProducerService` → `markSent`, retry `attempts`/`lastError`, tolérant Kafka down), `OutboxModule` (@Global). Admin : `AdminModule` + `AdminOrganizationsController`/`Service` (`GET /admin/organizations`, `GET /:id`, `POST /:id/suspend`, `[PLATFORM_ADMIN]`, inter-org) + DTO. Branchement des mutations **dans leur transaction** : `register` (org.created+user.registered+membership.changed, remplace le no-op `publishIdentityCreated` **supprimé**), invitation (user.registered INVITED + membership.changed), acceptation (user.registered ACTIVE, désormais transactionnelle), `UserManagementService` (membership.changed +/− user.suspended), `OrganizationsService.updateProfileAndEmit` + `suspendAndEmit`. Config `outbox.{relayIntervalMs,batchSize}` + env optionnels. **Qualité** : lint 0, `nest build` OK, **237 unit (37 suites) verts**, couverture **96.06 / 83.09 / 97.64 / 96.1** (gates 90/65/90/90 ; fichiers STORY-027 à **100 %**), **13 e2e verts** (2 mocks e2e pré-existants réparés : chaîne `.session` + `_id` ObjectId réel pour `findActiveByUser`).
- 2026-07-08 : **VÉRIFICATION DOCKER BOUT-EN-BOUT (`docker compose up`, image auth-service reconstruite, broker réel) — TOUT VERT ✅** :
  - **register** → 3 lignes d'outbox (`org.created`, `user.registered`, `membership.changed`) passées `SENT` ; **consommées sur le broker** (header `eventId`+`schemaVersion`, clé `orgId`/`userId`, payload conforme au contrat) ;
  - **admin plateforme** : `seed:admin` (idempotent) → `login` PLATFORM_ADMIN (`roles:['PLATFORM_ADMIN']`, `org:null`, `emailVerified:true`) → `GET /admin/organizations` (inter-org, total=21, `memberCount`) → `GET /:id` (identité + membres) → `POST /:id/suspend` **200** → **un seul** `org.updated{status:SUSPENDED}` SENT ; **2ᵉ suspend idempotent** (pas de doublon) ; id inconnu → **404** ; TENANT_ADMIN sur `/admin/*` → **403** ;
  - **flux membre** : invite → `user.registered`(INVITED) + `membership.changed`(TENANT_USER,ACTIVE) ; PATCH rôle → `membership.changed`(TENANT_ADMIN,ACTIVE) ; PATCH suspend → `membership.changed`(TENANT_ADMIN,SUSPENDED) + `user.suspended` — **tous SENT** ;
  - **flux e-mail réels (STORY-025 non régressée par 027)** via **Mailhog** (jetons extraits du vrai e-mail, aucun contournement base) : `register`→`login` `emailVerified=false`→ `GET /verify-email?token=` **200** →`login` `emailVerified=true` ; **acceptation d'invitation** (`POST /auth/accept-invitation` avec jeton Mailhog, chemin désormais **transactionnel**) → **200** puis `user.registered`(ACTIVE) émis (séquence collaborateur : INVITED → membership ACTIVE → ACTIVE) ;
  - **tolérance panne Kafka** : `docker compose stop kafka` → `register` **201** (mutation OK) + 3 events **PENDING** (non perdus) ; `start kafka` → relais rattrape → **PENDING→SENT** (0 PENDING) ;
  - 5 topics `identity.*` présents sur le broker.
  - **Reste** : `/code-review` formel (à déclencher par l'utilisateur) ; **commit sur demande** (non commité).

**Effort réel :** 1 cycle d'implémentation + vérification docker bout-en-bout (aucune reprise nécessaire).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
