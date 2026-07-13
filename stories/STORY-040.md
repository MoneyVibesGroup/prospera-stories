# STORY-040 : kyc-service — émettre `kyc.document.uploaded` (producteur Kafka + transactional outbox) au dépôt de pièce

**Epic :** EPIC-015 — document-service (OCR au service du KYC, Module 0) — *story productrice côté kyc-service, prérequis DO-1*
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` (v1.1) **§Contrat d'événements** (l.188-225, source de vérité — **à étendre** avec `kyc.document.uploaded` v1) · §Données → `KycDocument` (l.184) · §Authentification inter-services · `tech-spec-document-service-2026-07-10.md` §Contrats d'événements (l.72-74, esquisse **consommateur** : `{ eventId, orgId, documentId, type, storageRef, declared:{…} }`) · `architecture-prospera-ecosystem-2026-07-04.md` §Contrats d'événements (transport **Kafka** + **transactional outbox**, décisions programme **P4** événements + read-models) · `synthese-services-prospera-2026-07-10.md` (Module 0, décisions **AD-2** / **DO-1** : l'OCR assiste, n'approuve jamais)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-13. `kyc.document.uploaded` (v1) émis via **transactional outbox** au dépôt de pièce : `KycDocumentsService.upload()` fait le `putObject` MinIO **avant** la transaction, puis supersede + `create` + `documentUploaded(session)` sous `connection.startSession()+withTransaction` (patron STORY-021/034) ; écritures repository rendues **session-aware** (`create`/`updateOne`). Champ `declared` **écarté** du producteur (kyc-service ne possède plus l'identité — cutover STORY-030) ; résolu en aval (point de coordination STORY-042/043). lint 0, **145 unit + 38 e2e** verts, **couverture 100 %** sur `kafka/**` + `kyc-documents.service.ts` + `tenant-scoped.repository.ts`. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-13
**Sprint :** 7
**Service :** kyc-service (`:3001`) — base Mongo dédiée `kyc_service`
**Couvre :** aucun FR du PRD `expert-comptable` (capacité **plateforme / Module 0**) — **prérequis** de DO-1 : c'est l'**événement source** que `document-service` (STORY-041/042) consomme pour déclencher l'OCR des pièces RCCM/CFE.

> **Vérification préalable (note de sprint) — tranchée.** STORY-020/021 ont fait de `kyc-service` un producteur d'événements, mais **uniquement** du topic `kyc.status.changed` (transitions de statut). Le dépôt d'une **pièce** (`POST /kyc/documents`) est aujourd'hui **muet sur le bus** : la pièce est stockée (MinIO) + persistée (`KycDocument`), et seul un éventuel *passage en revue* (`onDocumentSubmitted` → `kyc.status.changed`) est émis quand RCCM **et** CFE sont enfin présents. Or `document-service` a besoin de réagir à **chaque pièce**, dès son dépôt, indépendamment du statut global du dossier. **Constat : `kyc.document.uploaded` n'existe pas.** Cette story l'ajoute — c'est la « petite story productrice côté kyc-service » explicitement anticipée par la tech-spec document-service (l.107, l.117) et par la note de sprint de STORY-040.
>
> **Point dur — le champ `declared:{…}` de l'esquisse consommateur est écarté du contrat producteur (décision de cette story).** La tech-spec document-service esquisse un payload `{ …, declared:{…} }` (données déclarées à l'inscription : raison sociale, n° RCCM/CFE, dates) pour que l'OCR **compare déclaré ↔ lu**. Mais **`kyc-service` ne possède pas ces données** : depuis le cutover relying party (STORY-030), l'identité appartient à `auth-service`, et le `TenantKycProfile` de `kyc-service` ne stocke **que le statut KYC** (aucun attribut d'identité déclarée). Faire porter `declared` par cet événement obligerait `kyc-service` à construire un read-model d'identité — hors périmètre d'une story de 3 pts et **hors de son domaine**. **Décision : `kyc.document.uploaded` transporte uniquement ce que `kyc-service` possède légitimement** (identifiants opaques + métadonnées de la pièce + `storageKey` pour lecture MinIO). La résolution du « déclaré » est un **point de coordination** reporté au consommateur (voir §Dépendances) : `document-service` la câblera via son propre read-model d'identité (`identity.*`) ou une lecture dédiée lors de STORY-042/043. STORY-040 reste un **producteur pur**.

---

## User Story

En tant que **`document-service` (consommateur OCR, Module 0)**,
je veux **recevoir sur le bus (`kyc.document.uploaded`) un événement fiable à chaque pièce KYC déposée**, portant l'`orgId`, l'identifiant de la pièce, son `type` (RCCM/CFE) et sa **clé de stockage MinIO**, publié de façon **atomique** avec la persistance de la pièce (transactional outbox → aucune pièce muette, aucun événement fantôme) et **idempotente** (clé `orgId`, `eventId`, livraison at-least-once),
afin de **déclencher l'extraction OCR de chaque pièce dès son dépôt** — lire l'objet en MinIO (lecture seule), extraire RCCM/CFE, comparer, signaler écarts/péremption/illisibilité — **sans jamais appeler `kyc-service` en synchrone** et **sans jamais décider** du statut KYC (invariant DO-1 : l'OCR assiste, l'humain approuve).

---

## Description

### Contexte

`kyc-service` est le **propriétaire du domaine KYC** : il stocke les pièces justificatives du cabinet (RCCM, CFE) dans un bucket privé MinIO (clé régénérée `kyc/{tenantId}/{uuid}`, jamais le nom client) et en persiste les métadonnées (`KycDocument` : `type`, `storageKey`, `mimeType`, `size`, `version`, `status`, `uploadedBy`). Depuis STORY-021, chaque **transition de statut** du dossier est publiée sur `kyc.status.changed` via un **transactional outbox** (invariant « pas de transition sans événement »).

Le **Module 0** (décision AD-2/DO-1) introduit un `document-service` qui **assiste la revue KYC** par l'OCR : à chaque pièce déposée, il lit l'objet MinIO, extrait les champs (n° RCCM/CFE, raison sociale, dates), compare au déclaré, signale les anomalies, et publie `document.extrait` pour **enrichir** le dossier de revue — **sans jamais approuver** (le statut reste piloté par l'humain via `kyc-service`). Pour cela, `document-service` a besoin d'un **événement source** émis à chaque dépôt de pièce.

Cet événement — `kyc.document.uploaded` — **n'existe pas aujourd'hui**. Le point d'émission `POST /kyc/documents` → `KycDocumentsService.upload()` stocke et persiste la pièce mais **ne publie rien** sur le bus (seul le *hook* `onDocumentSubmitted` peut émettre un `kyc.status.changed`, et seulement quand le dossier bascule effectivement en `UNDER_REVIEW`). Cette story **branche le producteur manquant**, en réutilisant à l'identique le patron transactional outbox de STORY-021 (kyc `kyc.status.changed`) / STORY-027 (auth) / STORY-034 (catalog `entitlement.changed`).

### Problème résolu

Sans cet événement, `document-service` ne peut pas être déclenché : DO-1 est **bloqué**. Émettre `kyc.document.uploaded` de façon fiable (outbox) et ordonnée (clé `orgId`) débloque tout le Module 0 (STORY-041 scaffold, STORY-042 consumer + OCR, STORY-043 comparaison + `document.extrait`), **sans aucune modification ultérieure du producteur** (fan-out Kafka natif : d'autres consommateurs pourront s'y abonner sans effort côté `kyc-service`).

---

## Scope

**Dans le périmètre :**
- **Contrat `kyc.document.uploaded` v1** : nouveau topic + interface d'événement TypeScript (`schemaVersion`, `eventId`, `orgId`, `documentId`, `type`, `storageKey`, `mimeType`, `size`, `version`, `uploadedBy`, `occurredAt`) — **état d'un fait ponctuel** (une pièce a été déposée), keyé `orgId`.
- **Émission via transactional outbox** au point de dépôt (`KycDocumentsService.upload()`), **atomique** avec la persistance de la pièce : supersede du précédent `SUBMITTED` + création du `KycDocument` + `enqueue` de l'événement, **dans une même transaction Mongo**.
- **Extension de la source de vérité** : ajout du contrat `kyc.document.uploaded` v1 à `docs/architecture-kyc-service-2026-07-03.md` §Contrat d'événements (à côté de `kyc.status.changed`).
- Tests unitaires (fabrique d'événement, atomicité, ordre) + e2e (upload → 1 ligne outbox `PENDING`/`SENT` clé `orgId`, non-régression du 409 double-clic et du `kyc.status.changed` de bascule).

**Hors périmètre (explicite) :**
- **`declared:{…}`** (données déclarées pour comparaison OCR) — **non porté** par cet événement (kyc-service ne possède pas l'identité ; voir encart *Point dur* et §Dépendances). C'est au consommateur (`document-service`) de le résoudre.
- **Le consommateur** (`document-service` : lecture MinIO, OCR, `document.extrait`) → STORY-041/042/043.
- **Toute transition de statut KYC** : `kyc.document.uploaded` est **découplé** de `kyc.status.changed` — l'un signale un dépôt de pièce, l'autre un changement d'état de dossier. Le hook `onDocumentSubmitted` (bascule `UNDER_REVIEW`) reste **inchangé**.
- **Aucune URL présignée / accès MinIO en écriture** ne transite par l'événement : seul le `storageKey` opaque circule ; le consommateur lit en MinIO **en lecture seule** avec ses propres droits.
- **C8 / auth service-à-service** : non concerné (producteur d'événement, pas d'appel synchrone).

---

## User Flow

1. Un `TENANT_ADMIN` du cabinet téléverse une pièce (`POST /kyc/documents`, `type=RCCM|CFE`, `file`).
2. `KycDocumentsService.upload()` valide **taille** puis **type réel** (magic bytes), régénère `storageKey`, pousse l'objet en MinIO (**avant** transaction — aucune métadonnée orpheline).
3. **Dans une transaction Mongo** : le précédent `SUBMITTED` du même type est marqué `SUPERSEDED`, le nouveau `KycDocument` est créé (`version` incrémentée), **et** un événement `kyc.document.uploaded` est enfilé dans l'outbox (`payload` complet, `partitionKey = orgId`).
   - Rollback (ex. E11000 double-clic) ⇒ **ni** pièce **ni** événement (mappé `409`).
   - Commit ⇒ pièce **et** événement, atomiquement.
4. Le *hook* `onDocumentSubmitted(userId)` s'exécute (transaction **distincte**, inchangée) : si RCCM **et** CFE sont désormais `SUBMITTED` et le dossier éligible → bascule `UNDER_REVIEW` + `kyc.status.changed` (enfilé **après** ⇒ `createdAt` postérieur ⇒ publié après).
5. Le **relais outbox** (`OutboxRelayService`, inchangé — topic-agnostique) publie l'événement sur Kafka avec clé `orgId` + header `eventId`/`schemaVersion`, puis le passe `SENT` (at-least-once).
6. `document-service` (futur) consomme `kyc.document.uploaded`, lit la pièce en MinIO, lance l'OCR (idempotent par `eventId`).

---

## Acceptance Criteria

- [ ] **AC1 — Contrat v1 défini.** Un module `kyc-events` expose `KYC_DOCUMENT_UPLOADED_TOPIC = 'kyc.document.uploaded'`, un `schemaVersion = 1`, et une interface `KycDocumentUploadedEventV1` = `{ schemaVersion, eventId, orgId, documentId, type, storageKey, mimeType, size, version, uploadedBy, occurredAt }`. Aucun champ `undefined` n'est sérialisé.
- [ ] **AC2 — Émission à chaque dépôt réussi.** Tout `POST /kyc/documents` renvoyant `201` produit **exactement une** ligne outbox `topic = kyc.document.uploaded`, `partitionKey = orgId`, `payload` conforme AC1 (`documentId` = `_id` du `KycDocument` créé, `type`/`storageKey`/`mimeType`/`size`/`version` = ceux de la pièce persistée, `uploadedBy` = uploadeur).
- [ ] **AC3 — Atomicité (transactional outbox).** La création de la pièce **et** l'`enqueue` de l'événement sont dans **une même transaction Mongo** : un échec de persistance (ex. E11000 double-clic → `409`) ⇒ **0 pièce ET 0 événement** ; un succès ⇒ **1 pièce ET 1 événement**. Jamais de pièce sans événement, ni d'événement sans pièce.
- [ ] **AC4 — `storageKey` porté, aucun binaire.** Le payload transporte le `storageKey` opaque (le consommateur lira la pièce en MinIO) mais **aucun contenu de fichier** ni nom de fichier client (`originalName` **exclu** du payload). *(Exception assumée vs `kyc.status.changed`, qui ne porte pas de `storageKey` — justifiée : ici le consommateur DOIT accéder à la pièce.)*
- [ ] **AC5 — Découplage & ordre.** L'événement est émis **indépendamment** de toute transition de statut ; quand une bascule `UNDER_REVIEW` a lieu au même appel, `kyc.document.uploaded` a un `createdAt` **antérieur** au `kyc.status.changed` correspondant (⇒ publié en premier pour un même `orgId`). Le comportement de `onDocumentSubmitted` / `kyc.status.changed` est **inchangé** (non-régression).
- [ ] **AC6 — Idempotence côté consommateur possible.** Chaque événement porte un `eventId` (UUID v4) unique et le header `eventId` est propagé par le relais (déjà le cas) — permettant au consommateur de dédupliquer.
- [ ] **AC7 — Publication réelle vérifiée.** Le relais outbox publie l'événement sur le topic Kafka `kyc.document.uploaded` (clé `orgId`) sans modification du relais (topic-agnostique) ; ligne passée `SENT` après publication.
- [ ] **AC8 — Sécurité/RBAC inchangés.** L'upload reste réservé `@Roles(TENANT_ADMIN)` (401 sans token, 403 autre rôle) ; l'isolation `orgId` (repository tenant-scoped) est préservée ; le contenu de la pièce n'est jamais journalisé.
- [ ] **AC9 — Source de vérité mise à jour.** `docs/architecture-kyc-service-2026-07-03.md` §Contrat d'événements documente `kyc.document.uploaded` v1 (transport, clé, producteur unique, absence de `declared` + renvoi au point de coordination).
- [ ] **AC10 — Qualité.** `lint` 0 ; couverture ≥ seuils du service sur les fichiers ajoutés/modifiés (`kafka/**`, `modules/kyc/kyc-documents.service.ts`) ; suites unit + e2e vertes.

---

## Technical Notes

### Composants
- **Contrat :** `src/kafka/kyc-events.ts` — ajouter `KYC_DOCUMENT_UPLOADED_TOPIC`, `KycDocumentUploadedEventV1` (le fichier documente déjà `kyc.status.changed` ; y adjoindre le nouveau contrat, même patron).
- **Fabrique + enqueue :** `src/kafka/outbox/kyc-events.service.ts` — ajouter `documentUploaded(session, input)` (miroir de `statusChanged`) : centralise `eventId`/`occurredAt`/`partitionKey = orgId`, écrit dans l'outbox **sous la session fournie**.
- **Point d'émission :** `src/modules/kyc/kyc-documents.service.ts` — refactor de `upload()` pour rendre supersede + create + enqueue **transactionnels** (voir ci-dessous). Injecter `KycEventsService` (déjà exporté par le `@Global OutboxModule`) et `@InjectConnection() Connection`.
- **Repository :** `src/modules/kyc/kyc-documents.repository.ts` / `src/common/database/tenant-scoped.repository.ts` — les écritures (`create`, `updateOne`) doivent accepter une **`ClientSession` optionnelle** pour participer à la transaction (aujourd'hui non session-aware). Ajouter un paramètre `session?` propagé à `model.create([...], { session })` / `findOneAndUpdate(..., { session })`, **sans changer** la sémantique de scoping tenant (le `tenantId` forcé reste inchangé).
- **Relais :** `src/kafka/outbox/outbox-relay.service.ts` — **aucun changement** (déjà topic-agnostique : lit `event.topic`).

### Transaction (patron STORY-021/027/034)
```
await putObject(storageKey, …)               // AVANT la transaction (idempotent ; blob orphelin toléré si rollback)
session = await connection.startSession()
await session.withTransaction(async () => {
  await repo.markSupersededIfPresent(type, session)   // ex-supersede, sous session
  const created = await repo.create({...}, session)   // E11000 ⇒ abort ⇒ catch ⇒ 409
  await kycEvents.documentUploaded(session, {
    orgId, documentId: created._id.toString(), type,
    storageKey, mimeType, size, version: created.version, uploadedBy: userId,
  })
})
// puis (INCHANGÉ, transaction distincte) :
await kycStatusService.onDocumentSubmitted(userId)   // peut émettre kyc.status.changed
```
- **`putObject` reste hors transaction**, **avant** toute écriture Mongo : préserve l'invariant « aucune métadonnée orpheline » (déjà en place). Un rollback laisse au pire un objet MinIO orphelin (inoffensif, ramassable) — jamais de métadonnée/événement fantôme.
- **E11000 (double-clic, index unique partiel `(tenantId,type)` sur `SUBMITTED`)** : l'insert échoue **dans** la transaction ⇒ rollback ⇒ **ni pièce ni événement** ; mappé `409` comme aujourd'hui (déplacer le `try/catch` autour du `withTransaction`).
- **Ordre des deux événements** : `documentUploaded` est enfilé **avant** l'appel `onDocumentSubmitted` ⇒ `createdAt` antérieur ⇒ le relais (tri `createdAt` asc, ordre par partition `orgId`) publie `kyc.document.uploaded` avant `kyc.status.changed`. Sémantiquement correct (pièce déposée → puis, éventuellement, passage en revue).

### Contrat d'événement (payload v1)
```typescript
export const KYC_DOCUMENT_UPLOADED_TOPIC = 'kyc.document.uploaded';

/** Émis à CHAQUE dépôt de pièce KYC réussi. Fait ponctuel (pas un état absolu). */
export interface KycDocumentUploadedEventV1 {
  schemaVersion: 1;
  eventId: string;          // UUID v4 — clé d'idempotence côté consommateur
  orgId: string;            // ObjectId hex de l'organisation (= clé de partition Kafka)
  documentId: string;       // ObjectId hex du KycDocument créé
  type: KycDocumentType;    // RCCM | CFE
  storageKey: string;       // clé objet MinIO (bucket privé) — le consommateur LIT la pièce
  mimeType: string;         // MIME réel (magic bytes), jamais celui déclaré par le client
  size: number;             // octets
  version: number;          // n° de version de la pièce (ré-upload ⇒ +1)
  uploadedBy: string;       // userId opaque de l'uploadeur
  occurredAt: string;       // ISO-8601 UTC
}
```
> **Divergence assumée vs l'esquisse tech-spec** (`{ …, storageRef, declared:{…} }`) : `storageRef` → **`storageKey`** (nom aligné sur le champ possédé) ; **`declared` omis** (kyc-service ne possède pas l'identité déclarée — voir *Point dur* + §Dépendances) ; ajout de `mimeType/size/version/uploadedBy` (métadonnées que le producteur possède, utiles au traitement/traçage consommateur). Cette story fait **foi** sur le contrat producteur v1 ; la tech-spec document-service sera ajustée à l'implémentation du consommateur.

### Sémantique Kafka & fiabilité
- **Clé de partition = `orgId`** (co-localise/ordonne les événements d'une même organisation, cohérent avec `kyc.status.changed` et `entitlement.changed`).
- **Livraison at-least-once** (relais publie **puis** marque `SENT`) → le consommateur **doit** dédupliquer par `eventId` (`ProcessedEvent` côté document-service, hors périmètre ici).
- **Tolérance panne Kafka** héritée du relais (erreur rejouable ⇒ reste `PENDING` ; empoisonné ⇒ `FAILED` après `MAX_DISPATCH_ATTEMPTS`).

### Sécurité
- Payload = **identifiants opaques + métadonnées de fichier + `storageKey`**. **Aucun binaire**, aucun `originalName` (nom client), aucune donnée personnelle. `storageKey` est une clé interne au bucket privé (pas une URL présignée) : sa fuite ne donne pas accès à l'objet sans droits MinIO.
- Accès MinIO du consommateur = **lecture seule** (câblé côté document-service, STORY-041).
- RBAC/scoping inchangés (upload `TENANT_ADMIN`, repository tenant-scoped).

### Edge cases
- **Fichier invalide** (taille/type) → rejeté **avant** `putObject` et transaction ⇒ 0 pièce, 0 événement (inchangé).
- **Double-clic concurrent** → E11000 dans la transaction ⇒ rollback ⇒ 0 événement ⇒ 409.
- **Ré-upload (supersede)** → 1 nouvel événement `version = n+1` ; le `SUPERSEDED` ne produit **pas** d'événement (seule la nouvelle pièce est « uploadée »).
- **Panne du relais/broker** → événement reste `PENDING`, publié au retour (jamais perdu).
- **Rollback après `putObject`** → objet MinIO orphelin toléré (pas de métadonnée/événement) ; garbage-collectable, non bloquant.

---

## Dependencies

**Stories prérequises :**
- **STORY-020** (scaffold kyc-service + migration KYC) — *done*.
- **STORY-021** (transactional outbox + `kyc.status.changed`) — *done* : fournit `OutboxService`/`KycEventsService`/`OutboxRelayService` réutilisés tels quels.

**Débloque (aval) :**
- **STORY-041** (scaffold document-service + `OcrProvider` + accès MinIO lecture) et surtout **STORY-042** (consumer `kyc.document.uploaded` → lecture pièce → OCR) : STORY-040 est l'**événement source** de DO-1. Sans elle, le consommateur n'a rien à consommer.

**Point de coordination (`declared`) — à trancher à l'implémentation du consommateur :**
- `document-service` a besoin des **données déclarées** (raison sociale, n° RCCM/CFE, dates) pour comparer au lu. `kyc-service` ne les possède pas. **Options** (décision différée à STORY-042/043, hors périmètre ici) : (a) `document-service` maintient un **read-model d'identité** alimenté par les événements `identity.*` (patron read-model déjà éprouvé) et joint par `orgId` ; (b) une lecture dédiée côté service propriétaire de l'identité. **STORY-040 ne préempte pas ce choix** : elle émet un événement producteur pur, et le « déclaré » est résolu en aval.

**Dépendances externes :**
- **Kafka** (topic `kyc.document.uploaded` auto-créé par le relais au premier envoi, comme les topics existants).
- **MongoDB replica set `rs0`** (transactions multi-documents — déjà en place, requis par le patron outbox).
- **MinIO** (bucket privé KYC — déjà en place).

---

## Definition of Done

- [ ] Contrat `kyc.document.uploaded` v1 ajouté (`kyc-events.ts`) + méthode `documentUploaded(session, …)` (`kyc-events.service.ts`).
- [ ] `KycDocumentsService.upload()` refactoré : supersede + create + enqueue **transactionnels** ; `putObject` conservé avant transaction ; 409 double-clic préservé.
- [ ] Écritures repository session-aware (`create`/`updateOne` acceptent `session?`) **sans** régression du scoping tenant.
- [ ] Code implémenté sur une branche dédiée (`MNV-040`, branchée depuis `dev` + rebase `origin/dev` **avant** de coder).
- [ ] Tests **unitaires** : fabrique d'événement (payload conforme, champs optionnels omis), atomicité (rollback ⇒ 0 événement), ordre document.uploaded < status.changed, non-régression `onDocumentSubmitted`.
- [ ] Tests **e2e** (docker) : `POST /kyc/documents` → 1 ligne `outbox_events` `kyc.document.uploaded` clé `orgId` ; double-clic ⇒ 409 **et** 0 événement surnuméraire ; RCCM+CFE ⇒ `document.uploaded` **puis** `status.changed` ; 401/403 inchangés.
- [ ] Couverture ≥ seuils du service sur les fichiers touchés ; `lint` 0 ; build OK.
- [ ] `docs/architecture-kyc-service-2026-07-03.md` §Contrat d'événements étendu (`kyc.document.uploaded` v1).
- [ ] **Vérification docker bout-en-bout** : stack `auth + kyc-service + mongo(rs0) + kafka + minio` ; login → upload RCCM/CFE → `kyc_service.outbox_events` contient les lignes `kyc.document.uploaded` (clé `orgId`, `SENT`) ; topic Kafka `kyc.document.uploaded` reçoit les messages (clé `orgId`, header `eventId`/`schemaVersion`, payload conforme, **sans** `declared` ni `originalName`).
- [ ] `/code-review` formel passé.
- [ ] Story poussée (branche `MNV-040` + PR « Rebase and merge » vers `dev`) une fois testée et validée ; `docs/sprint-status.yaml` mis à jour.

---

## Story Points Breakdown

- **Contrat + fabrique d'événement** (`kyc-events.ts` + `documentUploaded`) : 0,5 pt
- **Refactor transactionnel `upload()` + session-aware repository** : 1,5 pt
- **Tests unit + e2e + doc contrat** : 1 pt
- **Total : 3 points**

**Rationale :** patron transactional outbox **déjà en place** (STORY-021) → l'essentiel du coût est le refactor de `upload()` en transaction (rendre les écritures repository session-aware sans casser le scoping) et la couverture des cas d'atomicité/ordre. Aucun nouveau composant d'infra, relais inchangé.

---

## Additional Notes

- **Invariant DO-1** rappelé dans la story : l'événement **déclenche** l'OCR mais l'OCR **n'approuve jamais** — le statut KYC reste piloté par l'humain via `kyc-service`. `kyc.document.uploaded` est purement informatif pour le consommateur.
- **Fan-out** : d'autres services pourront s'abonner à `kyc.document.uploaded` (audit, notifications) sans aucune modification du producteur (Kafka natif).
- **Nommage de branche** : `MNV-040` (norme depuis 2026-07-10 : préfixe `MNV-0XX`, une branche par story).

---

## Revue & validation

**Fichiers touchés (kyc-service, branche `MNV-040`) :**
- `src/kafka/kyc-events.ts` — contrat `kyc.document.uploaded` v1 (`KYC_DOCUMENT_UPLOADED_TOPIC`, `_SCHEMA_VERSION`, `KycDocumentUploadedEventV1`).
- `src/kafka/outbox/kyc-events.service.ts` — fabrique `documentUploaded(session, input)` + `KycDocumentUploadedInput`.
- `src/common/database/tenant-scoped.repository.ts` — `create`/`updateOne` acceptent une `ClientSession?` (transaction), scoping tenant inchangé.
- `src/modules/kyc/kyc-documents.service.ts` — `upload()` refactoré : `putObject` avant tx ; `persistAndEmit()` = supersede + create + enqueue sous `withTransaction` ; E11000 → 409 conservé ; hook `onDocumentSubmitted` (tx distincte) inchangé.
- `docs/architecture-kyc-service-2026-07-03.md` — §Contrat d'événements `kyc.document.uploaded` (v1) ajouté (source de vérité).
- Tests : `kyc-events.service.spec.ts`, `kyc-documents.service.spec.ts`, `tenant-scoped.repository.spec.ts`, e2e `kyc-documents.e2e-spec.ts` (émission/atomicité/supersede) + `kyc-status.e2e-spec.ts` (mock `documentUploaded`).

**Résultats :** `lint` 0 · **147 unit** (26 suites) · **38 e2e** (4 suites) · **couverture 100/100/100/100** sur `kyc-events.ts`, `kyc-events.service.ts`, `outbox.service.ts`, `tenant-scoped.repository.ts`, `kyc-documents.service.ts` · `nest build` OK.

**`/code-review` (xhigh) — 6 constats, corrigés/vérifiés :**
- **#2** (E11000→409 via `withTransaction`) — **vérifié docker** : 4 tours de double-clic concurrent réel → toujours 1×201 + 1×409 (~0,1 s), aucun 500 ni hang.
- **#4** cast `created as` → **garde-fou explicite** (`throw` si document indéfini après commit).
- **#3** `endSession()` en `finally` **absorbe son échec** (`.catch`) pour ne jamais masquer l'erreur/résultat primaire.
- **#6** commentaires d'ordre corrigés (`kyc-documents.service` + `kyc-events`) : les 2 événements sont sur des **topics différents** → ordre inter-topics ni garanti ni requis (seul l'ordre PAR topic, clé `orgId`, compte).
- **#5** `KycDocumentType` déplacé `modules/kyc/enums` → **`common/enums`** (aligné `KycStatus`/`Role`) : la couche kafka ne dépend plus du module kyc ; 16 imports mis à jour.
- **#1** (fenêtre inter-transactions statut/pièce sur crash) — **corrigé (fusion transactionnelle)** : la bascule `PENDING/REJECTED → UNDER_REVIEW` (+ `kyc.status.changed`) rejoint la **même transaction** que la persistance de la pièce (+ `kyc.document.uploaded`). `onDocumentSubmitted(session)` s'exécute dans la tx du dépôt (`exists`/`getOrCreate` sous session, read-your-writes ; `runTransition` réutilise la session au lieu d'en ouvrir une). Un crash ne peut plus laisser une pièce sans bascule. Reliquat documenté : deux dépôts **strictement simultanés** des 2 types requis peuvent différer la bascule (isolation snapshot) — rare, même symptôme récupérable, upload séquentiel non concerné. **Vérifié docker** : RCCM → PENDING ; +CFE → une seule tx émet `document.uploaded(CFE)` + `status.changed(UNDER_REVIEW)`, profil `UNDER_REVIEW`.

**Commits revue MNV-040 :** `97e685a` (#2/#3/#4/#5/#6) + `6ffc5fd` (#1 fusion transactionnelle). Couverture **100 %** maintenue (149 unit + 38 e2e).

**Vérif docker bout-en-bout (2026-07-13)** — stack racine `auth-service:3001 + kyc-service:3002 + mongo(rs0) + kafka + minio + mailhog` :
1. `register` IdP → e-mail Mailhog → `verify-email` → `login` → JWT **RS256** (`org`, `roles=[TENANT_ADMIN]`, `aud` incl. `kyc-service`, `emailVerified`).
2. `POST /kyc/documents` RCCM (PDF) **201** puis CFE (JPEG) **201** ; sans token **401**.
3. `kyc_service.outbox_events` (clé `orgId`) = **2× `kyc.document.uploaded`** (RCCM v1, CFE v1) + **1× `kyc.status.changed`** (PENDING_DOCUMENTS→UNDER_REVIEW), **tous `SENT` attempts=0**. Ordre `createdAt` : les 2 `document.uploaded` **précèdent** le `status.changed` ✅. Payloads **sans `declared` ni `originalName`**.
4. Topic Kafka **`kyc.document.uploaded`** = 2 messages **key=`orgId`**, headers `eventId`/`schemaVersion:1`, payload v1 complet (`documentId`, `type`, `storageKey`, `mimeType`, `size`, `version`, `uploadedBy`, `occurredAt`) — **aucun `declared`, aucun `originalName`, aucun binaire**.

**Intégration `dev` — FAITE (2026-07-13).** PR #1 (`fix/review-outbox-kyc-submitted` → `dev`) mergée en « Rebase and merge » (fix devenu `c08a948`), puis MNV-040 rebasée sur le nouveau `dev` (`git rebase --onto origin/dev 8a8cc7e`, retire le commit du fix devenu doublon), PR #2 re-ciblée sur `dev` (MERGEABLE/CLEAN, 3 commits) et mergée en « Rebase and merge ». `dev` linéaire : `c08a948` (fix) → `f0610ee` (feat STORY-040) → `11a6134` (revue #2-#6) → `5c04638` (revue #1). Aucune PR ouverte ; branches mergées supprimées en local. `dev` build OK. **Story livrée et intégrée.**

---

## Progress Tracking

**Status History :**
- 2026-07-13 : Créée par Scrum Master (BMAD create-story) — vérification préalable effectuée (`kyc.document.uploaded` confirmé **absent** ; contrat producteur v1 défini ; `declared` écarté du périmètre producteur).
- 2026-07-13 : Implémentée + testée + **vérifiée docker bout-en-bout** par Developer (BMAD dev-story). Statut → **Done**.

**Actual Effort :** ~3 points (conforme à l'estimation).

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
