# STORY-013 : Revue KYC admin global (`kyc-service`)

**Epic :** EPIC-003 — Capacité partagée KYC (extraite en micro-service, rebasée sur `auth-service`)
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` §KYC (machine à états, revue) · `architecture-prospera-ecosystem-2026-07-04.md` §Ownership (P8, admin-panel BFF) · `docs/tech-spec-admin-panel-2026-07-10.md` (consommateur amont de ces endpoints)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-10 (18 assertions OK/0 KO). Revue admin : file → détail (URLs présignées téléchargeables) → approve/reject → événement outbox → read-model EC + e-mails. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-10
**Sprint :** 6
**Service :** `kyc-service`
**Couvre :** FR-003/FR-004 (revue KYC) — déclenche les transitions `APPROVED`/`REJECTED` du contrat émis en STORY-021

> **Story qui « ferme la boucle » du KYC.** STORY-021 a rendu le KYC *event-driven* : à chaque transition, `kyc-service` publie `kyc.status.changed` via son outbox, et `expert-comptable` consomme (read-model + e-mails). Mais seule la transition `PENDING_DOCUMENTS → UNDER_REVIEW` (déclenchée par l'upload) est réellement émise : **aucun endpoint ne déclenche `APPROVED`/`REJECTED`**. STORY-013 ajoute la **revue admin globale** (`PLATFORM_ADMIN`) — file de revue, consultation des pièces par **URL présignée**, **approbation / rejet motivé** — qui déclenche ces transitions (donc les e-mails d'approbation/rejet, déjà prêts côté consommateur) et débloque **admin-panel** (Module 0, STORY-047/048).

---

## User Story

En tant qu'**administrateur plateforme (`PLATFORM_ADMIN`)**,
je veux **consulter les dossiers KYC en attente, ouvrir leurs pièces et approuver ou rejeter (avec motif)**,
afin de **statuer sur la conformité d'un cabinet** — l'humain valide, jamais l'automatisation.

---

## Description

### Contexte

Tout le socle nécessaire **existe déjà** (le code de STORY-020/021 a été écrit en anticipant STORY-013) :

- **Transitions** : `KycStatusService.runTransition(orgId, from, to, extra, event)` (transactionnel : transition conditionnelle `TenantKycProfileRepository.transition` **+** enqueue outbox `kyc.status.changed`, dans une même transaction Mongo). Le graphe `ALLOWED_TRANSITIONS` autorise déjà `UNDER_REVIEW → APPROVED | REJECTED`.
- **Contrat d'événement** : `KycStatusChangedEventV1` porte déjà `rejectionReason?` et `reviewedBy?` (marqués « STORY-013 »). Le consommateur `expert-comptable` (STORY-021) envoie déjà les e-mails `APPROVED`/`REJECTED`.
- **Schéma** : `TenantKycProfile` porte déjà `rejectionReason`, `reviewedAt`, `reviewedBy` (ObjectId, opaque) + un **index `{ status, submittedAt }`** dédié à la file de revue.
- **Lecture cross-tenant** : `TenantScopedRepository.forTenant(orgId)` fournit une vue lecture **opt-in** pour le code admin ; `TenantKycProfileRepository` est déjà adressé par `orgId` explicite.
- **Stockage** : `StorageService` est abstrait, à **étendre** avec les URLs présignées (le commentaire l'annonce déjà).
- **RBAC** : `@Roles(Role.PLATFORM_ADMIN)` + `RolesGuard` global ; `PLATFORM_ADMIN` a `tenantId = null` (les lectures passent donc par `forTenant(orgId)` explicite, jamais par le contexte).

STORY-013 est donc un **assemblage** : un contrôleur admin + un service admin (listing/détail/URL présignée) + deux méthodes de transition publiques — sans nouvelle brique d'infrastructure.

### Scope

**Dans le périmètre — `kyc-service`**
- **`KycAdminController`** (`@Controller('admin/kyc')`, `@Roles(PLATFORM_ADMIN)`) :
  - `GET /admin/kyc` — file de revue (profils, filtre `status` optionnel, défaut = tous), plus anciens d'abord.
  - `GET /admin/kyc/:orgId` — détail : profil + pièces (métadonnées + **URL présignée** de consultation) via `forTenant(orgId)`.
  - `POST /admin/kyc/:orgId/approve` — `UNDER_REVIEW → APPROVED`.
  - `POST /admin/kyc/:orgId/reject` — `UNDER_REVIEW → REJECTED` (corps `{ reason }` obligatoire, non vide).
- **`KycAdminService`** : listing (`listByStatus`), détail (`forTenant` + `StorageService.presignedGetUrl`), et orchestration approve/reject (404 si profil absent, 409 si l'org n'est pas `UNDER_REVIEW`).
- **`KycStatusService`** : `runTransition` renvoie désormais `boolean` (transition appliquée) ; méthodes publiques `approveByAdmin(orgId, reviewerUserId)` / `rejectByAdmin(orgId, reviewerUserId, reason)` réutilisant `runTransition` (renseignent `reviewedAt`/`reviewedBy` + `rejectionReason`, émettent l'événement avec `reviewedBy`).
- **`TenantKycProfileRepository.listByStatus(status?)`** : lecture admin cross-org (tous les profils, filtre statut optionnel, tri `submittedAt` asc via l'index dédié).
- **`StorageService.presignedGetUrl(key, expirySeconds?)`** + impl MinIO (`presignedGetObject`) ; TTL configurable (`MINIO_PRESIGNED_TTL`, défaut 300 s).

**Hors périmètre**
- `TenantStateGuard` / matrice d'accès du vertical (lecture read-model) → **STORY-014**.
- Re-soumission après rejet (`REJECTED → UNDER_REVIEW`) → **STORY-014** (côté `kyc-service`).
- **admin-panel** (BFF qui proxifie ces endpoints) → **STORY-046/047/048** (Module 0).
- Toute **décision automatique** : l'OCR (document-service, STORY-041+) n'approuve jamais — il assiste (DO-1). Ici, seul un humain `PLATFORM_ADMIN` statue.

### User Flow (revue → décision → notification)

1. Un cabinet a téléversé RCCM+CFE → son profil est `UNDER_REVIEW` (STORY-021).
2. Un `PLATFORM_ADMIN` appelle `GET /admin/kyc?status=UNDER_REVIEW` → la file de revue (plus anciens d'abord).
3. Il ouvre `GET /admin/kyc/:orgId` → pièces consultables par **URL présignée** (expirante).
4. Il **approuve** (`POST …/approve`) ou **rejette avec motif** (`POST …/reject { reason }`).
5. La transition `UNDER_REVIEW → APPROVED|REJECTED` persiste **et** émet `kyc.status.changed` (avec `reviewedBy`, et `rejectionReason` si rejet) via l'outbox → `expert-comptable` met à jour son read-model **et** envoie l'e-mail correspondant (STORY-021).

---

## Acceptance Criteria

- [ ] **Endpoints admin gardés** : les 4 routes sont sous `@Roles(PLATFORM_ADMIN)` — `401` sans token, `403` pour `TENANT_ADMIN`/`TENANT_USER`.
- [ ] **File de revue** : `GET /admin/kyc` renvoie les profils (filtre `status` optionnel, validé enum), triés `submittedAt` croissant (plus anciens d'abord) via l'index `{ status, submittedAt }`.
- [ ] **Détail + URLs présignées** : `GET /admin/kyc/:orgId` renvoie le profil **et** les pièces `SUBMITTED` avec une **URL présignée** de consultation (jamais la `storageKey` brute ni de binaire) ; lecture via `forTenant(orgId)` (cross-tenant explicite).
- [ ] **Approbation** : `POST /admin/kyc/:orgId/approve` sur une org `UNDER_REVIEW` → `APPROVED`, `reviewedAt`/`reviewedBy` renseignés, **un** événement `kyc.status.changed { status: APPROVED, reviewedBy }` émis (outbox).
- [ ] **Rejet motivé** : `POST /admin/kyc/:orgId/reject { reason }` sur une org `UNDER_REVIEW` → `REJECTED`, `rejectionReason` + `reviewedAt`/`reviewedBy` renseignés, **un** événement `{ status: REJECTED, rejectionReason, reviewedBy }` émis. `reason` vide/absent → `400`.
- [ ] **Sémantique d'erreur** : org inconnue (ou `orgId` malformé) → `404` (anti-énumération) ; org non `UNDER_REVIEW` (déjà `APPROVED`/`PENDING`) → `409` (aucun événement émis).
- [ ] **Atomicité & idempotence** : la décision réutilise `runTransition` (transition conditionnelle `from = UNDER_REVIEW` + outbox dans **une** transaction) ; une double requête concurrente n'émet qu'**un** événement (la seconde → `409`/no-op).
- [ ] **Isolation** : un admin ne voit/altère que l'org ciblée par `:orgId` ; `reviewedBy` est le `userId` opaque de l'admin (claim JWT).
- [ ] **Tests** : unitaires (service admin : listing, détail+URL présignée mockée, approve/reject 404/409/succès ; `KycStatusService` transitions admin) + e2e (403 non-admin, file, détail, approve→APPROVED, reject→REJECTED, 409 sur re-décision). Couverture ≥ **65/90/90/90**. **ESLint 0 warning**, build OK.
- [ ] **Vérification docker bout-en-bout** (voir §Additional) : upload → `UNDER_REVIEW` → `GET /admin/kyc` → `approve`/`reject` → `kyc.status.changed` (outbox `SENT`) → read-model + e-mail côté `expert-comptable` (Mailhog).

---

## Technical Notes

### Fichiers — `kyc-service`

```
src/modules/kyc/
├── kyc-admin.controller.ts        # NOUVEAU : @Roles(PLATFORM_ADMIN), 4 routes admin/kyc
├── kyc-admin.service.ts           # NOUVEAU : listByStatus + détail (forTenant + presigned) + approve/reject (404/409)
├── kyc-status.service.ts          # runTransition → boolean ; + approveByAdmin / rejectByAdmin
├── tenant-kyc-profile.repository.ts # + listByStatus(status?)  (cross-org, tri submittedAt)
├── dto/
│   ├── admin-kyc-review-item.dto.ts   # NOUVEAU : orgId, status, submittedAt?, reviewedAt?
│   ├── admin-kyc-detail.dto.ts        # NOUVEAU : profil + documents (avec url présignée)
│   ├── admin-kyc-document.dto.ts      # NOUVEAU : métadonnées doc + url
│   └── reject-kyc.dto.ts              # NOUVEAU : { reason } (@IsNotEmpty, @MaxLength)
└── kyc.module.ts                  # + KycAdminController / KycAdminService
src/storage/storage.service.ts     # + presignedGetUrl(key, expiry?) (abstrait + impl MinIO)
src/config/configuration.ts        # + minio.presignedExpirySeconds (MINIO_PRESIGNED_TTL, défaut 300)
```

- **`runTransition`** : renvoyer `Promise<boolean>` (`true` = transition appliquée + événement émis ; `false` = état déjà changé par un concurrent). `onDocumentSubmitted` ignore le retour ; les méthodes admin l'utilisent pour distinguer 200 vs 409.
- **`approveByAdmin(orgId, reviewerUserId)`** : `assertTransition(UNDER_REVIEW, APPROVED)` puis `runTransition(orgId, UNDER_REVIEW, APPROVED, { reviewedAt: new Date(), reviewedBy: new Types.ObjectId(reviewerUserId) }, { reviewedBy: reviewerUserId })`.
- **`rejectByAdmin(orgId, reviewerUserId, reason)`** : idem vers `REJECTED` avec `rejectionReason: reason` dans `extra` **et** l'événement.
- **`KycAdminService`** : `getReviewQueue(status?)` → `listByStatus` → DTOs ; `getDetail(orgId)` → `findByOrgId` (404 si null) + `kycDocumentsRepository.forTenant(orgId).find({ status: SUBMITTED })` + `presignedGetUrl(storageKey)` par pièce ; `approve/reject` → `findByOrgId` (404) puis `approveByAdmin/rejectByAdmin` (`false` → `ConflictException` 409).
- **`presignedGetUrl`** : impl MinIO `client.presignedGetObject(bucket, key, expirySeconds)`. Injecter le `MINIO_CLIENT` (déjà exporté) dans `MinioStorageService` (déjà le cas) ; TTL depuis config.
- **Anti-énumération** : `orgId` malformé → `404` (pas `400`/`500`) ; valider via `Types.ObjectId.isValid` dans le service, `NotFoundException` sinon.

### Points d'attention
- **`PLATFORM_ADMIN` a `tenantId = null`** → **ne jamais** passer par les lectures scoping du contexte ; uniquement `forTenant(orgId)` / `findByOrgId(orgId)` (orgId de l'URL, mais toujours une valeur signée côté admin-panel plus tard ; ici l'admin fournit l'orgId).
- **Approve depuis `UNDER_REVIEW`** : pas de `rejectionReason` à nettoyer (la re-soumission `REJECTED→UNDER_REVIEW` de STORY-014 le remettra à zéro). Ne pas l'écrire sur `approve`.
- **URL présignée** = fuite potentielle si journalisée → ne jamais logger l'URL ; TTL court (défaut 300 s).
- **EmailVerifiedGuard** : le `PLATFORM_ADMIN` seedé est `emailVerified` → passe la chaîne de guards sans `@AllowUnverified`.

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-020** — `kyc-service` (profil, documents, storage, guards).
- **STORY-021** — outbox + contrat `kyc.status.changed` (avec `reviewedBy`/`rejectionReason`) + consommateur `expert-comptable` (e-mails `APPROVED`/`REJECTED` **déjà prêts**).

**Stories débloquées :**
- **STORY-047/048** (admin-panel) — proxifient ces endpoints (Module 0, AD-2).
- **STORY-014** — `TenantStateGuard` (lit le read-model `APPROVED`/`REJECTED` que ces décisions réalimentent) + re-soumission.

**Dépendances externes :** MinIO (URLs présignées), Kafka (outbox), Mongo rs0 (transaction) — déjà dans le compose racine.

---

## Definition of Done

- [ ] Code implémenté sur une branche `STORY-013`.
- [ ] Tests unitaires + e2e **verts**, couverture ≥ **65/90/90/90**.
- [ ] **ESLint 0 warning**, build OK (CI matrice 3 services verte).
- [ ] **Vérification docker bout-en-bout** réalisée et journalisée dans « Revue & validation ».
- [ ] `/code-review` (≥ high) passée ; constats traités ou tracés.
- [ ] Statut mis à jour dans `docs/sprint-status.yaml` ; commit **sur demande**.

---

## Additional Notes

### Vérification docker attendue (bout-en-bout)
Sur la stack racine (`docker compose up`) :
1. `register` IdP (org cabinet) → `verify` → `login` cabinet → upload RCCM+CFE (`:3002`) → `UNDER_REVIEW`.
2. `login` **PLATFORM_ADMIN** (seed) → `GET /admin/kyc?status=UNDER_REVIEW` → l'org apparaît ; `GET /admin/kyc/:orgId` → 2 pièces avec **URL présignée** (téléchargeable).
3. `POST /admin/kyc/:orgId/approve` → profil `APPROVED`, `reviewedBy` = admin ; **outbox** `kyc.status.changed { APPROVED }` `SENT` → `expert-comptable` : read-model `APPROVED` + e-mail **d'approbation** (Mailhog).
4. Rejouer `approve`/`reject` sur la même org → `409` (aucun 2ᵉ événement).
5. Variante rejet : sur une autre org `UNDER_REVIEW`, `POST …/reject { reason }` → `REJECTED` + e-mail **de rejet** motivé.
6. `TENANT_ADMIN` sur `/admin/kyc` → `403`.

---

## Progress Tracking

**Historique des statuts :**
- 2026-07-10 : Créée par vivian (BMAD Scrum Master — `/bmad:create-story`).
- 2026-07-10 : Implémentée par Claude (BMAD dev-story) — code + tests verts ; **vérif docker en attente** (démon Docker non démarré dans l'environnement).

**Effort réel :** 5 points (conforme à l'estimation).

---

## Revue & validation (2026-07-10)

**Livré — `kyc-service`**
- **`KycAdminController`** (`admin/kyc`, `@Roles(PLATFORM_ADMIN)`) : `GET /` (file, filtre `status`), `GET /:orgId` (détail + URLs présignées), `POST /:orgId/approve`, `POST /:orgId/reject` (`{ reason }`).
- **`KycAdminService`** : `getReviewQueue` (via `listByStatus`), `getDetail` (`forTenant(orgId).find` + `presignedGetUrl` par pièce), `approve`/`reject` (`404` org inconnue/`orgId` malformé — anti-énumération ; `409` hors `UNDER_REVIEW`).
- **`KycStatusService`** : `runTransition` → `boolean` (appliqué/déjà fait) ; `approveByAdmin`/`rejectByAdmin` (transaction conditionnelle + outbox `kyc.status.changed` avec `reviewedBy`/`rejectionReason`).
- **`TenantKycProfileRepository.listByStatus(status?)`** (lecture admin cross-org, tri `submittedAt`, index dédié).
- **`StorageService.presignedGetUrl`** + impl MinIO (`presignedGetObject`) ; TTL `MINIO_PRESIGNED_TTL` (défaut 300 s).
- DTOs : `AdminKycReviewItemDto`, `AdminKycDetailDto`, `AdminKycDocumentDto`, `RejectKycDto`, `AdminKycQueryDto`. Swagger `kyc-admin` ajouté.

**Tests (verts)** — `kyc-service` : **ESLint 0 warning**, **build OK**, **129 unit + 33 e2e** (dont **12 e2e admin** : 401/403, file triée, détail+URL présignée, `404` inconnu/malformé, `approve`→APPROVED+1 événement, `409` re-décision, `reject` sans motif→`400`, `reject`→REJECTED+motif émis). **Couverture ≥ 65/90/90/90** (seuils du projet respectés).

**Vérification docker bout-en-bout (2026-07-10) — ✅ 18 assertions OK / 0 KO** (stack racine : auth-service + expert-comptable + kyc-service + mongo rs0 + kafka + minio + mailhog) :
- Onboard cabinet A (register IdP → verify e-mail Mailhog → login → upload RCCM+CFE) → `UNDER_REVIEW`.
- `GET /api/v1/admin/kyc?status=UNDER_REVIEW` (PLATFORM_ADMIN seed) → A présent dans la file.
- RBAC : `TENANT_ADMIN` → **403**, sans token → **401**.
- `GET /admin/kyc/:orgId` → 2 pièces + **URL présignée** ; l'URL est **réellement téléchargeable (200)** depuis le réseau docker.
- `POST …/approve` → `APPROVED` ; **re-décision → 409** ; org inconnue/`orgId` malformé → **404**.
- **Outbox `kyc_service.outbox_events`** : `kyc.status.changed { status: APPROVED, reviewedBy: <adminId> }` → **`SENT`**.
- **Read-model `expert_comptable.org_profiles`** : `kycStatus = APPROVED`.
- **Mailhog** : e-mail « Votre dossier KYC a été approuvé » délivré.
- Flux **rejet** (cabinet B) : `reject` sans motif → **400** ; `reject { reason }` → `REJECTED` ; l'événement outbox porte `rejectionReason = "RCCM illisible"`.

**Reste**
- `/code-review` (≥ high).
- Commit / push **branche `STORY-013`** (selon la règle « pusher après validation »).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4.**
*Prochaine étape : vérif docker de STORY-013, puis STORY-014 (TenantStateGuard + re-soumission).*
