# STORY-011 : Stockage S3/MinIO + upload RCCM/CFE validé

**Epic :** EPIC-003 — KYC & validation du cabinet
**Réf. architecture :** S3.1
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Completed
**Assigné à :** vivian
**Créée le :** 2026-07-03
**Terminée le :** 2026-07-03
**Sprint :** 2
**Couvre :** FR-005

> **Note 2026-07-03 — code migré.** Cette story a été livrée **dans `expert-comptable`**, puis son code (`src/modules/kyc/`, `src/storage/`) a été **déplacé vers le micro-service `kyc-service`** lors de l'extraction de l'EPIC-003 (voir STORY-020 et `docs/architecture-kyc-service-2026-07-03.md`). La story reste **Completed** (points acquis au Sprint 2) ; seul l'emplacement du code change. Le statut KYC n'est plus porté par `Tenant.kycStatus` (devenu read-model) mais par la collection `TenantKycProfile` de kyc-service.

---

## User Story

En tant que **super-admin de compte (`TENANT_ADMIN`)**,
je veux **téléverser le RCCM et la carte CFE de mon cabinet**,
afin de **fournir les justificatifs légaux nécessaires à la validation (KYC) du cabinet**.

---

## Description

### Contexte

L'EPIC-003 conditionne l'accès aux modules métier à la **validation du cabinet** (KYC). Le premier maillon est la **collecte des justificatifs** : le **RCCM** (Registre du Commerce et du Crédit Mobilier) et la **carte CFE** (Centre de Formalités des Entreprises). STORY-011 pose l'**infrastructure de stockage** et l'**endpoint d'upload validé** ; la machine à états KYC (`PENDING_DOCUMENTS → UNDER_REVIEW`), la revue admin et les URLs présignées viennent **après** (STORY-012/013/014).

L'**amorce** est déjà en place (STORY-002) : `src/storage/` fournit un **client MinIO global** (`MINIO_CLIENT`) et un `StorageBootstrapService` qui **crée le bucket privé** `kyc-documents` au démarrage (idempotent, non bloquant). Les commentaires du code y renvoient explicitement : *« L'upload réel et les URLs présignées viendront en STORY-011. »* Cette story **consomme** cette amorce.

> Un `TENANT_ADMIN` (actif, e-mail vérifié) appelle `POST /kyc/documents` en **multipart** avec `type ∈ {RCCM, CFE}` et un fichier. Le service **vérifie le type réel du fichier par ses octets d'en-tête (magic bytes)** — pas l'extension ni le `Content-Type` client — et la **taille (≤ 10 Mo)**, **régénère un nom** (UUID) pour la clé de stockage, **pousse l'objet dans le bucket privé** via un `StorageService` abstrait (S3-compatible), puis **persiste les métadonnées** (`KycDocument` : type, `storageKey`, mime vérifié, taille, version, statut). Un fichier trop volumineux ou d'un format non supporté est **refusé en 422 explicite**.

Trois propriétés sont critiques :

- **Confiance zéro dans le client** : le type est déterminé par les **magic bytes** du contenu (allowlist `application/pdf`, `image/jpeg`, `image/png`), jamais par `file.mimetype` (fourni par le client) ni par l'extension. La taille est plafonnée **côté serveur**.
- **Aucune fuite du nom de fichier client** : la **clé de stockage est régénérée** (`kyc/{tenantId}/{uuid}`) ; le nom original n'apparaît **jamais** dans la clé (conservé au plus en métadonnée d'audit). Le bucket est **privé** (aucun accès public direct ; la lecture passera par URL présignée en STORY-013).
- **Rattachement au bon tenant, garanti par l'infra** : `KycDocument` est écrit via un **`KycDocumentsRepository` scoping** (hérite de `TenantScopedRepository<KycDocument>`, STORY-010) qui **force** le `tenantId` du contexte — un cabinet ne peut pas déposer de document pour un autre.

Cette story **crée un nouveau `KycModule`** (`KycController`, `KycDocumentsService`, `KycDocumentsRepository`, schéma `KycDocument`), **étend le `StorageModule`** existant (ajout d'un `StorageService` abstrait + implémentation MinIO, exporté), et **réutilise** la chaîne de guards (`JwtAuthGuard → EmailVerifiedGuard → RolesGuard`) et le repository scoping.

### Périmètre

**Inclus :**
- **`StorageService`** (abstraction S3-compatible) dans `src/storage/` : contrat `putObject(key, body, size, mimeType, metadata?)` (+ implémentation `MinioStorageService` s'appuyant sur `MINIO_CLIENT` et le bucket `kyc-documents`). **Exporté** par le `StorageModule` (`@Global`) pour réemploi par l'EPIC-003.
- **`POST /api/v1/kyc/documents`** (`@Roles(TENANT_ADMIN)`, e-mail vérifié) en **multipart/form-data** : champ `type ∈ {RCCM, CFE}` + champ `file`. Réponse **201** (`KycDocumentResponseDto` : id, type, mimeType, size, version, status, createdAt).
- **Validation stricte du fichier** :
  - **taille ≤ 10 Mo** (constante serveur) — dépassement → **422** explicite ;
  - **type réel par magic bytes** (allowlist `application/pdf`, `image/jpeg`, `image/png`) — format non reconnu / hors allowlist → **422** explicite ;
  - **`type` métier** invalide ou fichier manquant → **400**.
- **Régénération de la clé** : `kyc/{tenantId}/{randomUUID}` (`crypto.randomUUID()`), **jamais** le nom client dans la clé.
- **Schéma `KycDocument`** (nouveau) : `tenantId`, `type`, `storageKey`, `mimeType` (vérifié), `size`, `version` (défaut 1), `status` (`SUBMITTED`|`SUPERSEDED`, défaut `SUBMITTED`), `uploadedBy`, `originalName?` (audit), timestamps ; index `{ tenantId, type, status }`.
- **Ré-upload d'un même `type`** : le précédent document `SUBMITTED` de ce type (dans le tenant) passe **`SUPERSEDED`** et le nouveau prend `version = précédente + 1` — garantit **un seul document courant par type** (décision, cf. *Additional Notes*).
- **Tests** unitaires (`StorageService`/`MinioStorageService` mock client, util magic bytes, `KycDocumentsService` : validation taille/format/type + supersede + `tenantId` forcé, `KycController` + guard rôle) + **e2e** (upload PDF/JPEG/PNG → 201, trop gros → 422, format falsifié → 422, `type` invalide → 400, `TENANT_USER` → 403, sans token → 401, **isolation** cross-tenant, clé sans nom client).

**Hors périmètre :**
- **Machine à états KYC** (`Tenant.kycStatus`, passage auto en `UNDER_REVIEW` quand RCCM **et** CFE présents, e-mail de soumission) → **STORY-012**.
- **`GET /kyc/status`** (statut + liste des documents côté cabinet) → **STORY-012**.
- **Revue admin global** (file d'attente, **URLs présignées** de consultation ≤ 5 min, approve/reject motivé) → **STORY-013**. STORY-011 n'expose **aucune** lecture/téléchargement de document.
- **Re-soumission après rejet** (retour en `UNDER_REVIEW`, matrice d'accès) → **STORY-014**. STORY-011 pose seulement le champ `version` et le statut `SUPERSEDED` que STORY-014 réutilisera.
- **`TenantStateGuard`** (blocage des modules selon KYC/abonnement) → **STORY-014**.
- **Chiffrement côté serveur (SSE)** : activé en **prod** (SSE-S3) via configuration d'infrastructure ; en dev, bucket **privé** MinIO sans SSE. Non implémenté applicativement ici.
- **Antivirus / scan de contenu** des fichiers → hors phase 1 (non planifié).
- **Page frontend d'upload** → pas de front en phase 1 (l'API accepte le multipart directement, testable via Swagger/`curl`).

### Flux (utilisateur)

1. Un `TENANT_ADMIN` (actif, vérifié) prépare son **RCCM** (PDF/JPEG/PNG, ≤ 10 Mo).
2. Il appelle `POST /api/v1/kyc/documents` en multipart : `type=RCCM` + `file=<binaire>`.
3. Le service **lit le buffer**, vérifie **taille** puis **magic bytes** ; en cas d'échec → **422** avec un message explicite (taille / format).
4. Le service **régénère la clé** `kyc/{tenantId}/{uuid}`, **pousse** l'objet dans le bucket privé via `StorageService.putObject`, puis **persiste** le `KycDocument` (repository scoping → `tenantId` forcé). Si un RCCM `SUBMITTED` existait déjà, il passe **`SUPERSEDED`** et la version est incrémentée.
5. Réponse **201** avec les métadonnées sûres (jamais le buffer, jamais la clé exposée comme URL publique).
6. Il répète l'opération pour la **carte CFE** (`type=CFE`).
7. *(STORY-012)* Une fois **RCCM et CFE** présents, le cabinet passera automatiquement en `UNDER_REVIEW` — **hors périmètre ici**.

---

## Acceptance Criteria

- [x] Un **`StorageService` abstrait** (S3-compatible) existe dans `src/storage/`, avec une implémentation **MinIO** (`putObject` vers le bucket **privé** `kyc-documents`), **exporté** par le `StorageModule` global et injectable par le `KycModule`. Le bucket est créé au démarrage (amorce STORY-002, réutilisée). *(Vérifié unitaire + docker.)*
- [x] `POST /api/v1/kyc/documents` (**`TENANT_ADMIN` uniquement**, e-mail vérifié) accepte un **multipart** `{ type ∈ {RCCM, CFE}, file }` et renvoie **201** avec les métadonnées sûres (id, type, mimeType, size, version, status). Sans token → **401** ; `TENANT_USER` → **403** ; `type` absent/invalide ou fichier manquant → **400**. *(Vérifié e2e + docker.)*
- [x] Le **type réel** du fichier est vérifié par ses **magic bytes** (allowlist `application/pdf`, `image/jpeg`, `image/png`) — **pas** l'extension ni le `Content-Type` client. Un fichier dont l'en-tête n'est **pas** dans l'allowlist (y compris extension/`Content-Type` falsifiés) → **422 explicite**. *(Vérifié unitaire + e2e + docker.)*
- [x] Un fichier **> 10 Mo** → **422 explicite** (plafond appliqué **côté serveur**, dans le service). Le plafond ne dépend pas d'une valeur fournie par le client. *(Vérifié unitaire + e2e + docker.)*
- [x] Le **nom de fichier est régénéré** (UUID) : la **clé de stockage** vaut `kyc/{tenantId}/{uuid}` et **ne contient jamais** le nom du fichier client. (Vérifié : clé ≠ nom d'origine ; nom d'origine au plus en métadonnée d'audit — confirmé directement en base Mongo.)
- [x] Les **métadonnées `KycDocument`** sont persistées : `type`, `storageKey`, `mimeType` (vérifié), `size`, `version`, `status`, `tenantId` (forcé par le repository scoping), `uploadedBy`. Un ré-upload du même `type` marque le précédent **`SUPERSEDED`** et incrémente `version` (un seul document **courant** par type). *(Vérifié unitaire + e2e + docker : v1→SUPERSEDED, v2→SUBMITTED.)*
- [x] **Isolation** : le document est écrit via `KycDocumentsRepository` (hérite de `TenantScopedRepository`, STORY-010) → `tenantId` **forcé** du contexte ; aucun cabinet ne peut déposer/écraser un document d'un autre tenant. *(Vérifié e2e + docker : l'upload du tenant B reste `version 1`, indépendant du supersede du tenant A.)*
- [x] `docker compose up` : parcours vérifiable de bout en bout (upload RCCM+CFE → objets présents dans MinIO, métadonnées en Mongo, clés en UUID, 422 sur trop gros / format falsifié) — **15/0** ; tests des stories précédentes **verts** ; **lint 0 warning** ; **couverture** ≥ seuils (90/65/90/90).

---

## Technical Notes

### Composants / fichiers
```
src/storage/storage.service.ts                    # StorageService (abstract) + MinioStorageService (nouveau)
src/storage/storage.service.spec.ts               # putObject → client MinIO mocké (nouveau)
src/storage/storage.module.ts                     # + provider { provide: StorageService, useClass: MinioStorageService } + export
src/storage/storage.constants.ts                  # (existant) MINIO_CLIENT

src/modules/kyc/kyc.module.ts                     # MongooseModule.forFeature([KycDocument]) + providers/controller (nouveau)
src/modules/kyc/kyc.controller.ts                 # POST /kyc/documents (FileInterceptor) (nouveau)
src/modules/kyc/kyc-documents.service.ts          # validation + putObject + persistance + supersede (nouveau)
src/modules/kyc/kyc-documents.repository.ts        # extends TenantScopedRepository<KycDocument> (nouveau)
src/modules/kyc/schemas/kyc-document.schema.ts     # schéma + index (nouveau)
src/modules/kyc/enums/kyc-document-type.enum.ts    # RCCM | CFE (nouveau)
src/modules/kyc/enums/kyc-document-status.enum.ts  # SUBMITTED | SUPERSEDED (nouveau)
src/modules/kyc/dto/upload-kyc-document.dto.ts     # { type } (champ texte du multipart) (nouveau)
src/modules/kyc/dto/kyc-document-response.dto.ts   # projection sûre (nouveau)
src/modules/kyc/kyc.constants.ts                   # MAX_FILE_SIZE, ALLOWED_MIME, signatures magic bytes (nouveau)

src/common/utils/file-signature.util.ts            # détection MIME par magic bytes (+ .spec) (nouveau)

src/app.module.ts                                  # + KycModule dans imports
test/kyc-documents.e2e-spec.ts                     # parcours upload + 422 + isolation (nouveau)
```

### `StorageService` (abstraction S3-compatible)
- **Classe abstraite** `StorageService` (sert de token d'injection Nest) — contrat minimal pour STORY-011 :
  ```ts
  abstract class StorageService {
    abstract putObject(
      key: string,
      body: Buffer,
      size: number,
      mimeType: string,
      metadata?: Record<string, string>,
    ): Promise<void>;
  }
  ```
- **`MinioStorageService`** : injecte `MINIO_CLIENT` + lit le `bucket` via `ConfigService.getOrThrow<MinioConfig>('minio')` ; `putObject` appelle `client.putObject(bucket, key, body, size, { 'Content-Type': mimeType, ...metadata })`.
- Enregistrement : `{ provide: StorageService, useClass: MinioStorageService }` dans `StorageModule`, **ajouté aux `exports`** (à côté de `MINIO_CLIENT`). Le module reste `@Global`.
- La lecture/`presignedGetUrl` sera **ajoutée au contrat en STORY-013** (revue admin) — inutile ici.

### Détection du type par magic bytes (`file-signature.util`)
- Petit utilitaire **sans dépendance** (le projet n'a pas `file-type` ; on reste sur `crypto`/`Buffer` natifs) : compare les premiers octets du buffer aux signatures connues.
  - **PDF** : `25 50 44 46` (`%PDF`) → `application/pdf`
  - **JPEG** : `FF D8 FF` → `image/jpeg`
  - **PNG** : `89 50 4E 47 0D 0A 1A 0A` → `image/png`
- Renvoie le MIME détecté ou `null`. Le service **rejette (422)** si `null` **ou** hors allowlist. Le `mimeType` **persisté** est celui **détecté**, jamais celui annoncé par le client.

### Endpoint & pipeline de validation
- `@Post('documents')` avec `@UseInterceptors(FileInterceptor('file'))` (`@nestjs/platform-express`, **stockage mémoire** par défaut → `file.buffer` disponible pour le sniff et `putObject`).
- **Plafond de taille — deux niveaux** :
  1. **Défense multer** : `FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } })` coupe les flux abusifs (dernier rempart mémoire).
  2. **Règle métier** : le service vérifie `file.size / buffer.length ≤ 10 Mo` et renvoie **422 explicite** (message clair) — la coupure multer brute (413) est **remappée/évitée** au profit du 422 attendu (cf. décision *Additional Notes*).
- **Ordre** : rôle/vérif e-mail (guards) → `type` valide (`ValidationPipe` sur `UploadKycDocumentDto`) → fichier présent → **taille** → **magic bytes** → `putObject` → persistance. On **ne persiste jamais** avant un `putObject` réussi.
- **`type`** vient d'un **champ texte du multipart** ; le valider via `@IsEnum(KycDocumentType)` (`UploadKycDocumentDto`).

### Schéma `KycDocument`
```
tenantId    : ObjectId  (requis, index)      # forcé par le repository scoping
type        : enum RCCM | CFE (requis)
storageKey  : string    (requis)             # kyc/{tenantId}/{uuid} — jamais le nom client
mimeType    : string    (requis)             # MIME détecté (magic bytes)
size        : number    (requis)             # octets
version     : number    (défaut 1)
status      : enum SUBMITTED | SUPERSEDED (défaut SUBMITTED)
uploadedBy  : ObjectId ref User              # audit
originalName: string?   (optionnel, audit)   # jamais utilisé dans la clé
timestamps  : createdAt / updatedAt
```
- Index `{ tenantId: 1, type: 1, status: 1 }` : retrouver le document **courant** par type (pour supersede et, plus tard, la lecture STORY-012/013).
- `KycDocumentsRepository extends TenantScopedRepository<KycDocument>` (comme `UsersRepository`) : `create` **force** `tenantId`, `find/count/updateOne` scoping ; `forTenant(tenantId)` réservé à l'admin global (STORY-013).

### Sécurité
- **Guards** : `@Roles(TENANT_ADMIN)` (le `RolesGuard` renvoie 403) ; l'`EmailVerifiedGuard` global impose l'e-mail vérifié ; `JwtAuthGuard` impose le token (401).
- **Confiance zéro client** : type par **magic bytes** (pas l'extension/`Content-Type`), taille plafonnée serveur, clé **régénérée** (pas de path traversal via le nom de fichier).
- **Bucket privé** : aucune URL publique ; la consultation passera par **URL présignée** courte (STORY-013). STORY-011 n'expose aucun GET de document.
- **Isolation** : écriture via repository scoping (`tenantId` forcé) ; la clé **inclut le `tenantId`** (défense en profondeur, pas la frontière de sécurité — la frontière reste le filtre Mongo).
- **Pas de secret en log** : ni buffer, ni clés MinIO ; les erreurs de stockage remontent en **500 générique** via le filtre global (une indispo MinIO n'est pas une erreur client).
- **SSE (prod)** : chiffrement au repos activé par configuration d'infrastructure côté objet ; noté ici, appliqué au déploiement.

### Cas limites
- **Extension/`Content-Type` falsifiés** (ex. `.pdf` sur un exécutable) → magic bytes hors allowlist → **422**.
- **Fichier exactement à 10 Mo** → accepté ; **10 Mo + 1 octet** → **422**.
- **Champ `file` absent** → **400** ; **`type` absent/hors enum** → **400**.
- **Ré-upload du même type** avant revue → ancien **`SUPERSEDED`**, nouveau `version+1` (un seul courant).
- **Indispo MinIO** au `putObject` → **500 générique** ; **aucune** métadonnée persistée (ordre putObject → persist).
- **Fichier vide (0 octet)** → magic bytes absents → **422**.

---

## Dependencies

**Stories prérequises :**
- **STORY-010** ✅ (`TenantScopedRepository` — isolation forcée du `tenantId` ; base du `KycDocumentsRepository`).
- **STORY-002** ✅ (amorce `StorageModule` : `MINIO_CLIENT` global + bucket privé `kyc-documents` créé au démarrage ; config `minio`).
- **STORY-004/005/006** ✅ (schéma `Tenant`/`User`, chaîne de guards `JwtAuthGuard → EmailVerifiedGuard → RolesGuard`, `@Roles`, `CurrentUser`).

**Stories débloquées par celle-ci :**
- **STORY-012** (statut KYC + passage auto en `UNDER_REVIEW` quand RCCM & CFE présents ; `GET /kyc/status`).
- **STORY-013** (revue admin : lecture via **URL présignée** — étend le `StorageService`).
- **STORY-014** (re-soumission après rejet : réutilise `version` + `SUPERSEDED`).

**Dépendances externes :** aucune en dev (MinIO fourni par docker-compose, bucket auto-créé). Pas de nouvelle dépendance npm (`minio` et `@nestjs/platform-express` déjà présents ; UUID via `crypto.randomUUID()`, magic bytes via util maison).

---

## Definition of Done

- [x] Code implémenté (branche de travail locale, non commitée — voir note sous « Progress Tracking »).
- [x] Tests :
  - [x] Unitaire `file-signature.util` : PDF/JPEG/PNG reconnus ; buffer inconnu/vide → `null`.
  - [x] Unitaire `MinioStorageService.putObject` : appelle `client.putObject(bucket, key, body, size, headers)` (client mocké) ; propage l'erreur.
  - [x] Unitaire `KycDocumentsService` : 422 taille, 422 format (magic bytes), clé régénérée (UUID, sans nom client), `tenantId` forcé, `mimeType` = détecté, supersede du précédent, `putObject` **avant** persistance.
  - [x] Unitaire `KycController` + guard rôle (délégation service).
  - [x] e2e : upload PDF/JPEG/PNG → 201 ; > 10 Mo → 422 ; format falsifié → 422 ; `type` invalide → 400 ; fichier manquant → 400 ; sans token → 401 ; `TENANT_USER` → 403 ; supersede (version incrémentée) ; **isolation** cross-tenant ; clé de stockage ≠ nom client.
- [x] `npm run test:cov` respecte les seuils (90/65/90/90) ; `npm run test:e2e` vert.
- [x] Lint (`eslint --max-warnings 0`) et `nest build` OK ; tests précédents toujours verts.
- [x] Endpoint documenté dans **Swagger** (tag `kyc`, `@ApiConsumes('multipart/form-data')` + schéma du fichier).
- [x] `docker compose up` : upload RCCM + CFE vérifié (objets dans MinIO, métadonnées en Mongo, clés UUID), 422 sur trop gros / format falsifié, isolation cross-tenant, supersede confirmé en base.
- [ ] Revue de code (`/code-review`) — non lancée dans cette session ; à faire avant merge. Points d'attention : **validation par magic bytes** (jamais l'extension), **plafond serveur**, **régénération de clé**, **isolation** du repository.
- [x] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **`StorageService` (abstraction + `MinioStorageService` + export module)** : 1 pt
- **`file-signature.util` (magic bytes) + pipeline de validation (taille/format 422)** : 1 pt
- **`POST /kyc/documents` (FileInterceptor, DTO, régénération de clé, putObject)** : 1.5 pt
- **Schéma `KycDocument` + `KycDocumentsRepository` scoping + supersede** : 0.5 pt
- **Tests unitaires & e2e (upload, 422, isolation, clé UUID)** : 1 pt
- **Total : 5 points**

**Rationale :** la story **réutilise** l'amorce MinIO (STORY-002) et le repository scoping (STORY-010), mais introduit un **nouveau module**, la **manipulation de fichiers binaires** (multipart, buffer, magic bytes) et une **validation serveur stricte** (deux niveaux de plafond, allowlist par contenu) — surface de test notable (formats falsifiés, tailles limites, isolation). Cohérent avec l'estimation initiale de 5 pts.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Détection du type** — **Recommandé :** util **maison** de magic bytes (3 signatures : PDF/JPEG/PNG), zéro dépendance, compatible CommonJS/Jest. *Alternative :* lib `file-type` — écartée (ESM-only, friction avec le build/tests CommonJS actuels).
2. **422 vs 413 sur dépassement de taille** — **Recommandé :** plafond métier dans le service → **422 explicite** (message clair « > 10 Mo »), avec `limits.fileSize` multer comme **dernier rempart** mémoire (mappé sur 422 le cas échéant). *Alternative :* laisser multer renvoyer 413 — écartée (le plan exige un **422 explicite**).
3. **Ré-upload d'un même type** — **Recommandé :** **superséder** le précédent `SUBMITTED` (→ `SUPERSEDED`, `version+1`) pour garantir **un seul document courant** par type et fournir à STORY-014 son point d'extension. *Alternative :* refuser le 2ᵉ upload (**409**) tant que STORY-012/014 ne gèrent pas la re-soumission — écartée (moins ergonomique, complique la correction d'un mauvais fichier).
4. **Emplacement du `StorageService`** — **Recommandé :** dans `src/storage/` (module `@Global`), aux côtés de `MINIO_CLIENT`, **exporté** → réutilisable par STORY-013 (présigné). *Alternative :* interne au `KycModule` — écartée (l'admin global en aura besoin hors tenant).
5. **Convention de clé** — **Recommandé :** `kyc/{tenantId}/{uuid}` (sans extension ; le MIME vit en métadonnée/DB). *Alternative :* suffixer l'extension dérivée du **MIME vérifié** pour la lisibilité des objets — acceptable, jamais dérivée du nom client.
6. **Stockage mémoire multer** — **Recommandé :** mémoire (buffer) : plafond 10 Mo raisonnable, nécessaire au sniff des magic bytes et au `putObject` en un temps. *Alternative :* flux/disque — inutile à cette taille, complique le sniff.

### Notes diverses
- **Amorce déjà présente** : ne pas recréer le client ni le bucket — `StorageModule`/`StorageBootstrapService` (STORY-002) les fournissent ; STORY-011 **ajoute** `StorageService` et l'usage réel.
- **Swagger multipart** : `@ApiConsumes('multipart/form-data')` + `@ApiBody({ schema: { type: 'object', properties: { type: {...}, file: { type: 'string', format: 'binary' } } } })` pour un formulaire testable dans l'UI.
- **Ne rien exposer de sensible** : la réponse 201 est une **projection** (`KycDocumentResponseDto`) — pas de buffer, pas d'URL publique, `storageKey` interne (exposition contrôlée seulement à la revue admin, STORY-013).
- **Seams pour l'EPIC-003** : `KycDocumentsRepository.forTenant()` (lecture admin cross-tenant, STORY-013) ; `version`/`SUPERSEDED` (re-soumission, STORY-014) ; documents lisibles par `Tenant` pour la transition d'état (STORY-012).

---

## Progress Tracking

**Historique de statut :**
- 2026-07-03 : Créée (Scrum Master, BMAD)
- 2026-07-03 : Implémentée, testée et vérifiée sur docker — ✅ Completed (Developer, BMAD)

**Effort réel :** 5 points (conforme à l'estimation).

---

## Notes d'implémentation

### Décisions ouvertes — tranchées
1. **Détection du type** : util **maison** `file-signature.util.ts` (3 signatures PDF/JPEG/PNG), zéro dépendance.
2. **422 vs 413 sur dépassement de taille** : le plafond métier (10 Mo) est vérifié **dans le service** sur `file.size` → **422 explicite**, avant tout `putObject`. Le `FileInterceptor` conserve un `limits.fileSize` **large** (`MAX_FILE_SIZE_BYTES * 4`) comme simple garde-fou mémoire de dernier recours — il n'intervient jamais dans les cas testés (10 Mo pile / 10 Mo + 1) et n'a donc pas nécessité de mapping d'erreur multer → 422.
3. **Ré-upload d'un même type** : **superséde** le précédent `SUBMITTED` (→ `SUPERSEDED`, `version+1`), comme prévu — confirmé unitaire/e2e/docker.
4. **Emplacement du `StorageService`** : dans `src/storage/` (module `@Global`), **exporté** aux côtés de `MINIO_CLIENT` — prêt pour STORY-013 (URL présignée).
5. **Convention de clé** : `kyc/{tenantId}/{uuid}`, sans extension (le MIME vit en métadonnée/DB) — confirmé sans le nom client, directement en base Mongo.
6. **Stockage mémoire multer** : par défaut (aucune `storage` déclarée) → `file.buffer` disponible pour le sniff magic bytes et le `putObject`.

### Écarts / points notables vs. plan
- **Pas de dépendance `@types/multer`** : `Express.Multer.File` n'étant pas typé dans ce projet (multer ne fournit pas son propre `.d.ts` et `@types/multer` n'est pas installé), le fichier reçu par `@UploadedFile()` est typé via une interface locale minimaliste `UploadedFileLike { buffer, size, originalname? }` dans `kyc-documents.service.ts`, réutilisée par le contrôleur — cohérent avec la contrainte « zéro nouvelle dépendance npm » du plan.
- **`createdAt`/`updatedAt`** ajoutés en tant que champs **non-`@Prop`** sur la classe `KycDocument` (typage TS uniquement ; `{ timestamps: true }` les peuple déjà au runtime), pour permettre à `KycDocumentResponseDto.fromDocument` de les exposer sans cast `unknown`.
- **`TenantContext.tenantId`** est lu directement par `KycDocumentsService` (via assertion non-null, cohérent avec l'usage déjà présent ailleurs dans le code, ex. `patch.$set!.role`) pour construire la clé de stockage **avant** l'appel `create()` du repository — le repository forcerait de toute façon ce même `tenantId` à la persistance, donc aucune divergence possible entre la clé et les métadonnées.

### Fichiers clés
- **Storage** : `storage.service.ts` (`StorageService` abstrait + `MinioStorageService`), `storage.module.ts` (provider + export ajoutés).
- **Kyc** : `kyc.module.ts`, `kyc.controller.ts` (`POST /kyc/documents`, `FileInterceptor`, Swagger multipart), `kyc-documents.service.ts` (validation + supersede + orchestration), `kyc-documents.repository.ts` (`extends TenantScopedRepository`), `schemas/kyc-document.schema.ts`, `dto/upload-kyc-document.dto.ts`, `dto/kyc-document-response.dto.ts`, `kyc.constants.ts`, `enums/kyc-document-type.enum.ts`, `enums/kyc-document-status.enum.ts`.
- **Commun** : `common/utils/file-signature.util.ts` (détection magic bytes).
- **App** : `app.module.ts` (+ `KycModule`).

### Résultats de vérification
- **Unitaires** : `38 suites / 238 tests` — verts. Couverture globale **99.39 % stmts / 89.18 % branches / 98.8 % fn / 99.35 % lignes** (seuils 90/65/90/90). Module `kyc` et `storage.service.ts` : **100 %** sur les quatre métriques.
- **e2e** : `10 suites / 75 tests` — verts (dont `kyc-documents` : 11 tests — auth/rôle, 3 formats valides, 422 taille/format, 400 type/fichier manquant, supersede, isolation).
- **Lint** : `0 warning`. **Build** `nest build` OK.
- **Docker (`docker compose up --build`) — 15/0** : upload RCCM (PDF) + CFE (JPEG) → 201 (métadonnées sûres, sans `storageKey`) ; 403 `TENANT_USER` ; 401 sans token ; 422 (> 10 Mo, format falsifié) ; 400 (`type` invalide, fichier manquant) ; ré-upload RCCM (PNG) → 201 version 2 ; upload tenant B indépendant → 201 version 1.
- **Invariants Mongo** (`kycdocuments`) : `storageKey` au format `kyc/{tenantId}/{uuid}`, **jamais** le nom client (`originalName` distinct, ex. `rccm.pdf`/`cfe.jpg`) ; premier RCCM → `SUPERSEDED` après le second upload, second → `SUBMITTED` `version 2` ; tenant B isolé (son propre `tenantId`, `version 1` non affecté par le supersede de A).
- **Invariants MinIO** (client `minio` Node exécuté dans le conteneur `app`) : les **4** objets attendus sont présents dans le bucket privé `kyc-documents` (`statObject` OK), avec la taille et le `Content-Type` (magic bytes détecté) corrects ; `listObjectsV2` confirme qu'aucun objet superflu n'a été créé pour les tentatives rejetées (422/400).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
