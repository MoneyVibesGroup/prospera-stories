# STORY-044 : `document-service` — **persistance `DocumentExtraction`** (keyée `orgId`) + **`GET` consultation** de l'extraction

**Epic :** EPIC-015 — Chaîne KYC / OCR (`document-service`) : l'OCR **assiste** la revue, il ne **décide** jamais (invariant **DO-1**)
**Réf. architecture :** `tech-spec-document-service-2026-07-10.md` (v1.0, §Modèle de données « `DocumentExtraction` … keyé `orgId` », §Design d'API « Éventuel `GET /documents/:documentId/extraction` (relying party, `@Roles` restreint) », §Exigences « **Persistance** de l'extraction », **ST-DOC-2**) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Persistance (Mongo par service, isolation `orgId`) · **patron transaction idempotente** `document-service` STORY-042/043 (`markProcessedAndEmit` — marqueur `ProcessedEvent` + outbox **dans une seule transaction**) · **patron relying party** `document-service` STORY-041 (`JwtStrategy` JWKS-only, `@Roles`, `@CurrentUser`) · décisions programme **AD-2** (chaîne KYC en 2 flux) + **DO-1** (l'OCR propose, l'humain décide)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-15. Persiste `DocumentExtraction` (collection `document_extractions`, keyée `organizationId`, `documentId` **unique**, **`minimize:false`**) **dans la transaction existante** (`markProcessedPersistAndEmit` : marqueur `ProcessedEvent` + `DocumentExtraction` + outbox `document.extrait` **atomiques**) + **`GET /v1/documents/:documentId/extraction`** (relying party, `@Roles`, **isolation `orgId`** → 404 hors-tenant) qui **remplace** la sonde `whoami`. **DO-1** strict (lecture seule). lint 0, **186 unit (32 suites) + 17 e2e** ; nouveaux fichiers 100 % cov. `/code-review` (high) : **1 bug corrigé** (E11000 à la persistance = skip idempotent, anti poison-pill post-TTL) + 2 constats LOW tracés. Intégré : PR **#4 `MNV-044(document-service)` mergée « Rebase and merge » sur `dev`** (HEAD `d044333`), branche supprimée. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-15
**Sprint :** 9
**Service :** document-service (`:3006`, base `document_service`) — *relying party* pur (STORY-041), consommateur idempotent (STORY-042), producteur `document.extrait` (STORY-043)
**Couvre :** aucun FR fonctionnel direct (capacité transverse d'OCR au service du KYC ; décisions **AD-2 / DO-1**) — **quatrième maillon** du pipeline EPIC-015 (STORY-042 → 043 → **044** → 045) : elle **matérialise** l'extraction (source de vérité **consultable** dans `document_service`) au lieu de la laisser vivre uniquement dans le payload de l'événement.

> **Quatrième story de la chaîne EPIC-015 (flux B du Module 0).** STORY-041 a posé le **scaffold** (relying party, `OcrProvider`, `DocumentStorageReader` MinIO lecture, `KafkaModule`). STORY-042 a branché le **pipeline d'ingestion** (consumer idempotent → lecture MinIO → OCR → extraction RCCM/CFE ; transaction = **marqueur `ProcessedEvent` seul**). STORY-043 a **fermé la boucle métier** (résolution du déclaré via read-model `identity.*` → comparaison + drapeaux → **producteur `document.extrait`** via outbox transactionnel, **dans la même transaction** que le marqueur). STORY-044 **persiste le résultat** : elle ajoute la collection `DocumentExtraction` (base `document_service`, keyée `orgId`) et **insère l'extraction dans cette même transaction** (marqueur + `DocumentExtraction` + outbox → **atomiques**), puis expose une **consultation `GET /documents/:documentId/extraction`** (relying party, `@Roles` restreint, isolation `orgId`). **Invariant DO-1 strict :** aucune écriture du statut KYC, aucun appel sortant vers `kyc-service` — l'extraction persistée reste une **assistance** consultable, jamais une décision. La **consommation** de `document.extrait` par `kyc-service` reste **STORY-045**.

---

## User Story

En tant que **plateforme PROSPERA (chaîne KYC assistée par OCR)**,
je veux que `document-service`, après avoir extrait, comparé et émis le résultat d'une pièce (STORY-042/043), **persiste cette extraction** dans sa propre base (`DocumentExtraction`, keyée `orgId`) **dans la même transaction** que le marqueur d'idempotence et l'outbox, et **l'expose en consultation directe** via un endpoint `GET` restreint,
afin que le résultat d'OCR (lu, déclaré, écarts, drapeaux) soit une **source de vérité durable et interrogeable** — pas seulement un événement volatil — au service de la revue humaine (audit, ré-affichage, diagnostic), l'OCR **enrichissant le dossier** sans **jamais** l'approuver (invariant DO-1).

---

## Description

### Contexte

La chaîne KYC de PROSPERA est structurée en **deux flux** (décision **AD-2**) : le **flux A** (revue humaine via `admin-panel`, EPIC-016) et le **flux B** (assistance OCR via `document-service`, EPIC-015 — *cet épic*), sous invariant **DO-1** strict (l'OCR propose, l'humain décide).

STORY-042/043 ont livré **tout le traitement** : ingestion idempotente, OCR, extraction RCCM/CFE, résolution du déclaré (read-model `identity.*`), comparaison déclaré ↔ lu, drapeaux `expired`/`unreadable`, et **émission `document.extrait`** via outbox transactionnel. Mais à ce stade, le résultat métier vit **uniquement dans le payload de l'événement** (`OutboxEvent`, purgé après publication) et dans les **logs** (résumé sans PII). La transaction de `markProcessedAndEmit` a été **explicitement conçue pour être étendue** (commentaires de code STORY-042/043 : « STORY-044 ajoutera la persistance `DocumentExtraction` à cette même transaction »).

STORY-044 **matérialise** l'extraction, **sans réécrire** STORY-042/043 :

1. **Persistance `DocumentExtraction`.** Une nouvelle collection (base `document_service`, keyée `organizationId`) stocke l'**état absolu** de l'extraction — le **lu** (`extracted`), le **déclaré** (`declared`), les **écarts** (`discrepancies`), les **drapeaux** (`flags`), la **confiance** et le **provider** — ainsi que la corrélation (`documentId`, `eventId`, `type`, `occurredAt`). L'insertion se fait **dans la transaction existante** (`ProcessedEvent` + `DocumentExtraction` + `OutboxEvent` **atomiques** : « pas de marqueur sans extraction, pas d'extraction sans événement »). L'idempotence est déjà garantie par le marqueur (E11000 sur `eventId` → abort → aucun des trois) ; un index **unique** sur `documentId` sert de ceinture-et-bretelles (une extraction par pièce).
2. **Consultation `GET /documents/:documentId/extraction`.** Un endpoint **relying party** (RS256/JWKS, STORY-041) **restreint par rôle** et **isolé par `orgId`** permet de **relire** l'extraction persistée (audit, diagnostic, ré-affichage). Il **remplace** l'endpoint diagnostique provisoire `whoami` (dont le commentaire STORY-041 annonçait déjà ce remplacement) par une vraie surface métier — tout en restant **strictement en lecture** (DO-1).

L'EPIC-015 se découpe en 5 stories : **STORY-041** (scaffold — *done*), **STORY-042** (consumer + OCR + extraction — *done*), **STORY-043** (comparaison + producteur `document.extrait` — *done*), **STORY-044** (persistance `DocumentExtraction` + GET consultation — *cette story*), **STORY-045** (`kyc-service` consomme `document.extrait` → enrichit le dossier de revue). STORY-044 est la story qui **rend l'extraction durable et interrogeable** au sein de `document-service`.

### Périmètre

**Dans le périmètre**

- **Schéma `DocumentExtraction`** (`modules/extraction/schemas/document-extraction.schema.ts`, collection **`document_extractions`**, base `document_service`) : `{ organizationId (indexé), documentId (unique), eventId, type, extracted, declared, discrepancies, flags:{expired,unreadable}, confidence, ocrProvider, occurredAt }` + `timestamps`. **`minimize: false`** (impératif, **même raison** que l'`OutboxEvent` STORY-043 : `extracted:{}` / `declared:{}` sont des **sous-objets vides légitimes** — aucun champ OCR reconnu / org non projetée — que le `minimize` par défaut de Mongoose amputerait). État **absolu** (rejouable, cohérent avec le contrat `document.extrait`).
- **Persistance transactionnelle (extension de `markProcessedAndEmit`)** : la transaction de STORY-042/043 est **étendue** d'un `documentExtractionModel.create([doc], { session })` **entre** le marqueur `ProcessedEvent` et l'`enqueue` outbox. La méthode devient `markProcessedPersistAndEmit` (ou équivalent) : **une seule transaction** insérant `ProcessedEvent{eventId}` → `DocumentExtraction{...}` → `OutboxEvent(document.extrait)`. E11000 sur le marqueur (rejeu) → `abort` → **aucun** des trois documents. Le pré-contrôle d'idempotence + le hors-transaction OCR/lecture (STORY-042) et la résolution/comparaison/drapeaux (STORY-043) sont **conservés tels quels**.
- **Read-model / repository de consultation** : `DocumentExtractionRepository.findByDocumentId(documentId)` (+ éventuel `findByOrg(orgId)` pour une future liste — v1 : lookup par `documentId`). Aucune écriture hors du pipeline.
- **Endpoint `GET /documents/:documentId/extraction`** (`modules/extraction/extraction.controller.ts`, versionné `v1`) : **relying party** (chaîne de guards globale `JwtAuthGuard`), **`@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`** (consultation restreinte), **isolation `orgId`** — un `TENANT_ADMIN` ne lit **que** les extractions de **son** org (`extraction.organizationId === user.tenantId`) ; un `PLATFORM_ADMIN` (`tenantId = null`) lit **toute** org. Renvoie un **DTO structuré** (`ExtractionResponseDto`) ; **404** si absente **ou** hors-tenant (ne révèle pas l'existence d'une pièce d'une autre org). **Swagger** documenté (`@ApiTags`, `@ApiBearerAuth`, `@ApiOkResponse`, `@ApiNotFoundResponse`).
- **Retrait de l'endpoint diagnostique `whoami`** (STORY-041, provisoire) : remplacé par la vraie surface `GET .../extraction` (le câblage JWKS de bout en bout est désormais prouvé par l'endpoint métier). *(Alternative acceptable : conserver `whoami` — décision mineure, cf. §Cas limites.)*
- **Câblage** : `ExtractionModule` enregistre le modèle `DocumentExtraction` (`MongooseModule.forFeature`), le repository et le contrôleur ; `DiagnosticsModule` retiré/allégé si `whoami` est supprimé. **Aucune** nouvelle variable d'environnement, **aucun** nouveau service d'infra (Mongo/Kafka/MinIO déjà présents). `/health` reste inchangé.
- **Tests** : unitaires (persistance `DocumentExtraction` **dans** la tx du marqueur ; E11000 rejeu → aucun des trois documents ; `documentId` unique → ceinture-et-bretelles ; `findByDocumentId` ; contrôleur : succès, **404 absente**, **404/refus hors-tenant**, `PLATFORM_ADMIN` cross-org autorisé) + e2e docker (dépôt RCCM/CFE → `DocumentExtraction` **persistée** avec `extracted`/`declared`/`discrepancies`/`flags` → `GET` la renvoie ; rejeu → **une seule** extraction ; isolation `orgId` : un autre tenant → 404). Seuils Jest standard (**65/90/90/90**).

**Hors périmètre (stories suivantes ou décisions figées)**

- **Consommation de `document.extrait`** côté `kyc-service` (enrichir le dossier de revue) → **STORY-045**.
- **Historique / versionnage riche** des extractions (liste de toutes les versions d'une org, pagination, filtres) → **différé** : v1 persiste **une extraction par pièce** (`documentId` unique — chaque re-dépôt kyc crée un **nouveau** `documentId` via *supersede*, STORY-041, donc l'historique existe **de facto** au niveau pièce). Un `GET /documents?orgId=…` paginé est extensible sans rupture.
- **Front de revue** (affichage de l'extraction) → `admin-panel` (flux A, EPIC-016), qui lira **via `kyc-service`** (STORY-045).
- **Toute écriture du statut KYC / tout appel sortant vers `kyc-service`** — invariant **DO-1** strict.
- **Suppression / rétention / RGPD** des extractions (purge, droit à l'oubli) → hors v1 (à cadrer avec la politique de rétention KYC ; le `document.extrait` reste piloté par la pièce source, propriété `kyc-service`).

### Flux (mise en route)

1. Stack docker complète (`mongo` rs0, `kafka`, `minio`, `auth-service:3001`, `kyc-service:3002`, `document-service:3006`). Boot inchangé (deux consommateurs `document-ocr` + `document-identity`, relais outbox).
2. Un cabinet s'inscrit (`auth-service register`) → `identity.org.created` **projeté** dans le read-model (STORY-043). Le cabinet dépose une pièce (`POST :3002/kyc/documents`, RCCM puis CFE) → `kyc-service` publie `kyc.document.uploaded` (outbox, STORY-040).
3. `document-service` consomme (STORY-042/043) : lecture MinIO → OCR → parsing → résolution du déclaré → comparaison + drapeaux → **transaction** : `ProcessedEvent{eventId}` **+ `DocumentExtraction{...}` (STORY-044)** + `OutboxEvent(document.extrait)` → commit. Le relais publie `document.extrait` (clé `orgId`).
4. **Consultation** : un `TENANT_ADMIN` du cabinet (ou un `PLATFORM_ADMIN`) appelle `GET :3006/v1/documents/:documentId/extraction` (Bearer RS256) → **200** avec l'extraction (lu, déclaré, écarts, drapeaux, confiance, provider). Une pièce d'**une autre org** → **404** (isolation `orgId`).
5. **Rejeu** (même `eventId` re-livré) → pré-contrôle **ou** E11000 sur le marqueur ⇒ transaction **abort**, **aucune** double `DocumentExtraction`, **aucune** double émission (exactement-une-fois effective, STORY-042/043 préservé).
6. **Déclaré absent** (org pas encore projetée) → `DocumentExtraction` persistée en mode **dégradé** (`declared:{}`, `discrepancies:[]` — jamais fabriqués), consultable telle quelle (le lu + les drapeaux restent utiles).
7. **Aucun** statut KYC touché (DO-1). `kyc-service` **consommera** `document.extrait` en **STORY-045**.

---

## Acceptance Criteria

- [ ] **Schéma `DocumentExtraction` (keyé `orgId`, état absolu)** : collection `document_extractions` (base `document_service`) avec `{ organizationId (indexé), documentId (unique), eventId, type, extracted, declared, discrepancies, flags:{expired,unreadable}, confidence, ocrProvider, occurredAt }` + `timestamps`, **`minimize: false`** (préserve `extracted:{}` / `declared:{}`). **Test** : un document avec `extracted:{}` et `declared:{}` est persisté **avec** ces sous-objets vides (régression `minimize:false`, comme l'`OutboxEvent`).
- [ ] **Persistance transactionnelle atomique** : `DocumentExtraction` est insérée **dans la même transaction** que le marqueur `ProcessedEvent` **et** l'`enqueue` outbox `document.extrait` (ordre : marqueur → extraction → outbox → commit). Un **commit** crée les **trois** ; un **abort** (E11000 rejeu sur le marqueur) n'en crée **aucun**. **Test** : commit ⇒ `ProcessedEvent` + `DocumentExtraction` + `OutboxEvent` présents ; rejeu (E11000) ⇒ **aucun** des trois.
- [ ] **Exactement-une-fois effective (persistance)** : un **rejeu** du même `kyc.document.uploaded` (même `eventId`) ⇒ **une seule** `DocumentExtraction` par pièce (garanti par le marqueur ; l'index **unique** `documentId` est une ceinture-et-bretelles). **Test** : deux livraisons du même `eventId` ⇒ une seule `DocumentExtraction`.
- [ ] **Consultation `GET /documents/:documentId/extraction` (relying party, restreinte)** : endpoint versionné `v1`, protégé par la chaîne de guards globale (JWT RS256/JWKS), **`@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`**. Un token **valide** avec le bon rôle et le bon `orgId` ⇒ **200** + DTO structuré (lu, déclaré, écarts, drapeaux, confiance, provider, `documentId`, `type`, `occurredAt`). **Sans** token / rôle insuffisant ⇒ **401 / 403**. **Test** : 200 (rôle+org ok) ; 401 (sans token) ; 403 (rôle insuffisant).
- [ ] **Isolation `orgId`** : un `TENANT_ADMIN` ne peut lire **que** les extractions de **son** org (`organizationId === user.tenantId`) ; une pièce d'**une autre org** ⇒ **404** (ne révèle pas l'existence). Un `PLATFORM_ADMIN` (`tenantId = null`) lit **toute** org. **Test** : `TENANT_ADMIN` sur pièce d'un autre org ⇒ 404 ; `PLATFORM_ADMIN` ⇒ 200 cross-org.
- [ ] **404 pièce inconnue** : `GET` sur un `documentId` sans extraction ⇒ **404** (message générique, pas de fuite). **Test** : `documentId` inexistant ⇒ 404.
- [ ] **Dégradation gracieuse persistée** : org non projetée ⇒ `DocumentExtraction` persistée avec `declared:{}`, `discrepancies:[]`, `extracted` présent ; le `GET` la renvoie telle quelle (le lu + les drapeaux restent utiles). **Test** : déclaré absent ⇒ extraction persistée dégradée, consultable.
- [ ] **Extension sans réécriture + DO-1 préservé** : `ExtractionService` (STORY-042/043) est **étendu** (insert `DocumentExtraction` dans la tx), pas réécrit ; le hors-transaction OCR/lecture, la résolution/comparaison/drapeaux et l'émission outbox sont **conservés**. **Aucune** écriture de statut KYC, **aucun** appel sortant vers `kyc-service` ; le `GET` est **strictement en lecture**. **Test** : le handler n'appelle jamais `kyc-service` ; le contrôleur n'écrit rien.
- [ ] **Retrait / remplacement de `whoami`** : l'endpoint diagnostique provisoire `whoami` (STORY-041) est **retiré** (ou explicitement conservé — décision tracée), la surface métier `GET .../extraction` prouvant désormais le câblage relying party de bout en bout. **Test** : la route `GET .../extraction` est protégée par la même chaîne de guards (JWKS).
- [ ] **Câblage & configuration** : `ExtractionModule` enregistre le modèle `DocumentExtraction`, le repository et le contrôleur ; **aucune** nouvelle variable d'env, **aucun** nouveau service d'infra ; `/health` inchangé.
- [ ] **CI** verte (matrice 6 services inchangée ; nouveau code couvert en **unitaire** avec Mongo mocké ; le pipeline réel est éprouvé en **vérif docker**). Lint **0 warning**, seuils Jest tenus.
- [ ] **Vérification docker bout-en-bout** : stack `mongo`+`kafka`+`minio`+`auth`+`kyc`+`document` ; `register` → dépôt RCCM+CFE → `document-service` **persiste 2 `DocumentExtraction`** (base `document_service`, keyées `orgId`) + émet 2 `document.extrait` ; `GET /v1/documents/:documentId/extraction` (token du cabinet) ⇒ **200** avec l'extraction ; token d'**un autre org** ⇒ **404** ; **rejeu** ⇒ **une seule** extraction par pièce ; **aucun** statut KYC touché.

---

## Technical Notes

### Composants

- **Backend :** `document-service` (`:3006`, base `document_service`) — ajout d'un schéma `DocumentExtraction` + repository dans `modules/extraction/`, **extension** de la transaction de `ExtractionService` (insert dans la tx existante), ajout d'un **contrôleur HTTP** de consultation (relying party). Retrait probable du `DiagnosticsModule`/`whoami`.
- **Frontend :** aucun (la revue = `admin-panel`, flux A / EPIC-016, qui lira l'assistance **via `kyc-service`** une fois 045 livrée).
- **Base de données :** Mongo `document_service` — **1 collection ajoutée** : `document_extractions` (keyée `organizationId`, `documentId` unique). `processed_events` (STORY-042) / `org_identities` + `outbox_events` (STORY-043) **inchangées**.
- **Bus :** Kafka — **inchangé** (consomme `kyc.document.uploaded` + `identity.org.*` ; produit `document.extrait`). STORY-044 n'ajoute **ni** consommateur **ni** producteur : elle **persiste** et **expose** le résultat déjà calculé.
- **Stockage :** MinIO **lecture seule** (inchangé, STORY-042).

### Arborescence (ajouts sur STORY-043)

```
document-service/src/
├── modules/extraction/
│   ├── extraction.service.ts                # EXT — insert DocumentExtraction DANS la tx (marqueur → extraction → outbox)
│   ├── extraction.controller.ts             # NEW — GET /v1/documents/:documentId/extraction (relying party, @Roles, isolation orgId)
│   ├── document-extraction.repository.ts     # NEW — findByDocumentId (+ findByOrg futur)
│   ├── dto/
│   │   └── extraction-response.dto.ts        # NEW — DTO Swagger (structuré, sans binaire ni texte OCR intégral)
│   ├── schemas/
│   │   ├── processed-event.schema.ts         # inchangé (STORY-042, partagé)
│   │   └── document-extraction.schema.ts     # NEW — { organizationId idx, documentId unique, eventId, type, extracted, declared, discrepancies, flags, confidence, ocrProvider, occurredAt } minimize:false
│   ├── comparison/                            # inchangé (STORY-043)
│   ├── types/                                # inchangé (ExtractedDocument = type d'entrée de la persistance)
│   └── extraction.module.ts                  # EXT — forFeature(DocumentExtraction) + repository + controller
└── diagnostics/                              # RETIRÉ (ou allégé) — whoami remplacé par GET .../extraction
```

> `read-models/`, `kafka/outbox/`, `ocr/`, `storage/`, les parseurs (STORY-041/042/043) sont **réutilisés tels quels**. STORY-044 **greffe** la persistance sur la transaction existante et **ajoute** une surface de lecture — **aucun** nouveau flux Kafka, **aucune** nouvelle infra.

### Modèle de données `DocumentExtraction` (base `document_service`, tech-spec §Modèle de données)

```ts
@Schema({ timestamps: true, collection: 'document_extractions', minimize: false })
export class DocumentExtraction {
  @Prop({ required: true, index: true })
  organizationId!: string;      // ObjectId hex — isolation orgId, requêtes par org

  @Prop({ required: true, unique: true })
  documentId!: string;          // ObjectId hex du KycDocument — 1 extraction / pièce (ceinture-et-bretelles idempotence)

  @Prop({ required: true })
  eventId!: string;             // eventId source (kyc.document.uploaded) — corrélation ProcessedEvent

  @Prop({ type: String, enum: KycDocumentType, required: true })
  type!: KycDocumentType;       // RCCM | CFE

  @Prop({ type: Object, required: true })
  extracted!: ExtractedFields;  // le « lu » (STORY-042) — {} légitime

  @Prop({ type: Object, required: true })
  declared!: DeclaredFields;    // le « déclaré » (read-model) — {} si org non projetée

  @Prop({ type: [Object], required: true })
  discrepancies!: FieldDiscrepancy[]; // écarts — [] si déclaré indisponible

  @Prop({ type: Object, required: true })
  flags!: { expired: boolean; unreadable: boolean };

  @Prop({ required: true })
  confidence!: number;          // confiance OCR globale (0–100)

  @Prop({ required: true })
  ocrProvider!: string;         // ex. 'tesseract'

  @Prop({ required: true })
  occurredAt!: Date;            // horodatage du traitement
}
```

> **État absolu**, cohérent avec le payload `document.extrait` (STORY-043). **`minimize: false`** est **impératif** (même piège que l'`OutboxEvent` : `minimize` amputerait `extracted:{}` / `declared:{}`). L'`eventId` **source** (celui du marqueur `ProcessedEvent`) est stocké pour la corrélation (le payload événement porte, lui, l'`eventId` dérivé `${eventId}:extrait`).

### Extension de la transaction (`ExtractionService`)

```
--- STORY-042/043 (conservé) ---
alreadyProcessed(eventId) ? → skip
buffer = readPiece(storageKey) ; ocr = OcrProvider.extract(buffer) ; fields = parsers.parse(type, ocr.text)
extracted = { … }
declared = readModel.findDeclared(orgId) ?? {}
discrepancies = declared ? comparator.compare(declared, fields) : []
flags = documentFlags.evaluate(fields, ocr.confidence)
extrait = buildExtrait(eventId, extracted, declared, discrepancies, flags)
--- transaction (STORY-044 : + persistance) ---
session.startTransaction()
  processedModel.create([{ eventId }], { session })            // E11000 → abort → return false (skip)
  documentExtractionModel.create([{                            // NEW (STORY-044)
    organizationId: orgId, documentId, eventId, type,
    extracted: fields, declared, discrepancies, flags,
    confidence: ocr.confidence, ocrProvider: ocr.provider,
    occurredAt: new Date(),
  }], { session })
  outbox.enqueue({ eventId: `${eventId}:extrait`, topic: DOCUMENT_EXTRAIT_TOPIC,
                   partitionKey: orgId, schemaVersion: 1, payload: extrait }, session)   // STORY-043
commit
logExtraction(extracted, discrepancies, flags)                 // trace sans PII (STORY-042/043)
```

> Le marqueur reste **inséré en premier** (garde d'idempotence : E11000 ⇒ abort ⇒ **aucun** des trois). L'insertion `DocumentExtraction` **hérite** de cette garantie ; l'index **unique** `documentId` la double (protège aussi contre un hypothétique doublon de `documentId` sur deux `eventId` distincts — non attendu, *supersede* kyc créant un id neuf).

### Endpoint de consultation (`ExtractionController`)

- `GET /v1/documents/:documentId/extraction` — **relying party** (chaîne de guards globale `JwtAuthGuard`, JWKS de l'IdP, STORY-041). `@Roles(PLATFORM_ADMIN, TENANT_ADMIN)` (consultation restreinte ; `@CurrentUser()` fournit `userId`, `tenantId`, `role`).
- **Isolation `orgId`** : le service charge l'extraction par `documentId`, puis **compare** `extraction.organizationId` à `user.tenantId` — sauf `PLATFORM_ADMIN` (`tenantId = null` ⇒ accès global). **Mismatch ⇒ `NotFoundException`** (on renvoie **404**, pas 403, pour **ne pas révéler** l'existence d'une pièce d'une autre org). Absente ⇒ **404**.
- **DTO `ExtractionResponseDto`** (Swagger) : `{ documentId, organizationId, type, extracted, declared, discrepancies, flags, confidence, ocrProvider, occurredAt }`. **Jamais** de binaire ni de texte OCR intégral (déjà exclus en amont). `@ApiBearerAuth`, `@ApiTags('documents')`, `@ApiOkResponse`, `@ApiNotFoundResponse`.
- **`whoami`** (STORY-041) : **retiré** (son unique rôle — prouver le câblage JWKS — est repris par cet endpoint métier). *(Conserver `whoami` reste acceptable si l'on veut un ping non-métier ; à trancher à l'implémentation, sans impact fonctionnel.)*

### Configuration

- **Aucune** nouvelle variable d'environnement. `OCR_MIN_CONFIDENCE` / `KAFKA_IDENTITY_GROUP_ID` / `OUTBOX_RELAY_*` (STORY-043) inchangés. Compose racine / override / `.env.example` : **rien à ajouter** (⚠️ édition `.env*` restée bloquée en sandbox — sans objet ici).

### Sécurité

- **DO-1** : la persistance et le `GET` sont **strictement en lecture/enrichissement** — **aucune** écriture de statut KYC, **aucun** appel sortant vers `kyc-service`. Le statut reste piloté par l'humain (kyc-service).
- **Isolation `orgId`** : persistance keyée `organizationId` ; consultation **filtrée** par `tenantId` (404 hors-tenant, sauf `PLATFORM_ADMIN`). Cohérent avec l'isolation multi-tenant de l'écosystème.
- **PII** : la `DocumentExtraction` porte des champs **structurés** (dénomination, n° RCCM/CFE lus) nécessaires à la revue — **assumé** (le service est le producteur de l'assistance). Le `GET` est **restreint par rôle** ; les **logs** restent sans PII (résumé de clés, STORY-042). Le **binaire** et le **texte OCR intégral** ne sont **jamais** persistés ni renvoyés.
- **Relying party** : `GET .../extraction` valide un access token **RS256/JWKS** de l'IdP (aucune vérification e-mail requise n'est ici pertinente — l'accès est **rôle + org**).

### Cas limites / points d'attention

- **⚠️ `minimize: false` (récurrent).** `extracted:{}` (aucun champ OCR) et `declared:{}` (org non projetée) sont **légitimes** et **requis** — comme pour l'`OutboxEvent` (bug HIGH corrigé en STORY-043). **Le même piège** guette la `DocumentExtraction` : `minimize:false` **impératif** + test de régression.
- **Idempotence à deux verrous.** Le marqueur `ProcessedEvent` (E11000 → abort) est le **verrou primaire** (aucun des trois documents au rejeu). L'index **unique** `documentId` est un **second verrou** défensif (une extraction par pièce). Les deux se recouvrent volontairement.
- **Re-dépôt d'une pièce (versionnage).** `kyc-service` *supersede* + crée un **nouveau** `KycDocument` (nouvel `_id`, STORY-041) à chaque re-dépôt → **nouveau** `documentId` → **nouvelle** `DocumentExtraction` (l'ancienne reste, historique de facto). L'unicité `documentId` **n'empêche pas** le versionnage ; elle empêche seulement le doublon d'une **même** pièce.
- **404 plutôt que 403 (hors-tenant).** Renvoyer **404** (et non 403) sur une pièce d'une autre org évite de **divulguer** qu'un `documentId` existe ailleurs — pratique d'isolation multi-tenant.
- **Consultation vs source de vérité de la revue.** Ce `GET` est un **accès direct** (audit/diagnostic/ré-affichage). Le **chemin nominal** de la revue reste `admin-panel` → `kyc-service` (qui consomme `document.extrait`, STORY-045). Les deux coexistent sans conflit (DO-1 : lecture seule des deux côtés).
- **Rétention.** Pas de purge en v1 ; à cadrer avec la politique de rétention KYC (la pièce source appartient à `kyc-service`). Documenté comme dette assumée.

---

## Dependencies

**Stories prérequises :**
- **STORY-043** (`document-service` : comparaison déclaré/lu + producteur `document.extrait` via outbox transactionnel ; `markProcessedAndEmit` — la transaction **étendue** ici) — *done*.
- **STORY-042** (`document-service` : consumer idempotent + OCR + extraction ; `ExtractedDocument` = **type d'entrée** de la persistance) — *done*.
- **STORY-041** (scaffold `document-service` : relying party RS256/JWKS, `@Roles`/`@CurrentUser`, base `document_service`, `whoami`) — *done*.
- **STORY-040** (`kyc-service` émet `kyc.document.uploaded` v1) — *done*.

**Stories bloquées (débloquées / facilitées par celle-ci) :**
- **STORY-045** (`kyc-service` consomme `document.extrait` → enrichit le dossier de revue) : **indépendante du contrat** (STORY-043 l'a livré), mais STORY-044 fournit la **source de vérité consultable** côté `document-service` (diagnostic, ré-affichage, audit de l'assistance).
- Chaîne KYC complète e2e docker (STORY-049) + revue `admin-panel` (flux A).

**Dépendances externes :** Mongo (base `document_service`, déjà en place — compose racine) ; `auth-service` (IdP RS256/JWKS, `document-service` dans `AUTH_AUDIENCE` — STORY-041) ; **aucune** nouvelle dépendance système, **aucun** nouveau service d'infra.

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche **`MNV-044`** (branchée depuis `dev`, **rebasée sur `origin/dev`** avant de coder — repo `prospera-ocr-service`).
- [ ] Tests unitaires écrits et verts (seuils Jest **65/90/90/90**) :
  - [ ] **Schéma** : `minimize:false` (régression — `extracted:{}` / `declared:{}` préservés) ; `documentId` unique.
  - [ ] **Persistance transactionnelle** : `markProcessed…` crée `ProcessedEvent` **+** `DocumentExtraction` **+** `OutboxEvent` dans la **même tx** ; E11000 (rejeu) → **aucun** des trois.
  - [ ] **Repository** : `findByDocumentId` (présente / absente).
  - [ ] **Contrôleur** : 200 (rôle+org ok) ; 401 (sans token) ; 403 (rôle insuffisant) ; **404 absente** ; **404 hors-tenant** ; `PLATFORM_ADMIN` cross-org → 200.
- [ ] Tests e2e / docker verts :
  - [ ] `register` (auth) → dépôt RCCM+CFE (kyc) → **2 `DocumentExtraction` persistées** (keyées `orgId`) + 2 `document.extrait` émis ; `GET .../extraction` (token cabinet) → 200 ; token autre org → 404 ; **aucun** statut KYC touché.
  - [ ] Rejeu (`fromBeginning` / restart) → **une seule** `DocumentExtraction` par pièce.
  - [ ] Déclaré absent → extraction persistée **dégradée** (`declared:{}`, `discrepancies:[]`), consultable.
- [ ] ESLint **0 warning** ; build image `runtime` OK.
- [ ] **Vérification docker bout-en-bout** réalisée et consignée en §Revue & validation (stack auth+kyc+document ; `DocumentExtraction` persistée ; `GET` renvoie l'extraction ; isolation `orgId` prouvée ; idempotence prouvée par rejeu ; dégradation déclaré-absent).
- [ ] CI verte (matrice 6 services ; nouveau code couvert en unitaire, Mongo mocké).
- [ ] `/code-review` passé (constats traités ou tracés pour 045).
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR **`MNV-044(document-service): …`** ouverte puis intégrée sur `dev` en **« Rebase and merge »** ; branche supprimée après merge.
- [ ] `sprint-status.yaml` mis à jour (STORY-044 → done, note de vérification + `completed_date`).

---

## Story Points Breakdown

- **Backend (persistance) :** 1,5 point (schéma `DocumentExtraction` `minimize:false` + insert **dans la tx existante** — extension ciblée de `markProcessedAndEmit`, pas de nouveau flux — + repository `findByDocumentId`).
- **Backend (consultation) :** 1 point (contrôleur `GET .../extraction` relying party + `@Roles` + **isolation `orgId`** + DTO Swagger + retrait `whoami`).
- **Frontend :** 0 point.
- **Testing :** 0,5 point (unit persistance/idempotence/contrôleur — succès/401/403/404/hors-tenant + e2e docker chaîne réelle).
- **Total :** 3 points.

**Rationale :** le **plus dur est déjà fait** (extraction, comparaison, drapeaux, émission — STORY-042/043) et la transaction est **conçue pour l'extension**. La valeur ajoutée est la **matérialisation** de l'extraction (source de vérité durable, keyée `orgId`) dans la **même transaction** (atomicité marqueur + extraction + outbox) et une **surface de lecture** restreinte et isolée par tenant. Les patrons (schéma Mongoose `minimize:false`, relying party `@Roles`/`@CurrentUser`, isolation `orgId`) sont **déjà éprouvés** dans le service et l'écosystème — d'où l'estimation basse.

---

## Additional Notes

- **Invariant DO-1 (rappel).** STORY-044 **persiste et expose** une **assistance** ; elle ne **décide** rien. Aucune écriture de statut KYC, aucun appel sortant vers `kyc-service` ; le `GET` est **strictement en lecture**. L'approbation reste **humaine** (kyc-service + admin-panel).
- **Extension, pas réécriture.** `ExtractionService`, les parseurs, le read-model et l'outbox (STORY-042/043) sont **conservés** ; STORY-044 **greffe** un `create(DocumentExtraction)` sur la transaction existante et **ajoute** un contrôleur de lecture. La séquence marqueur → extraction → outbox garde le marqueur en **garde d'idempotence**.
- **État absolu partout (C7/P9).** La `DocumentExtraction` (état absolu) reflète le payload `document.extrait` (BACKWARD) : rejouable, cohérente, keyée `orgId`.
- **`minimize:false` — dette de vigilance.** Troisième schéma Mongoose du service à sous-objets vides légitimes (après `OutboxEvent`) ; **toujours** `minimize:false` + test de régression pour ne pas ré-introduire le bug HIGH de STORY-043.
- **Duplication assumée (K4).** `isDuplicateKeyError`, `ProcessedEvent`, patrons de schéma restent **copiés** (pas de lib partagée en phase 1) ; `schemaVersion` + docs d'architecture bornent la dérive. Factorisation différée.
- **Extensibilité.** `GET /documents?orgId=…` paginé (liste des extractions d'une org), filtres par `type`/`flags`, rétention/purge : tous **ajoutables sans rupture** (schéma en état absolu, `organizationId` indexé). v1 se limite au lookup par `documentId`.

---

## Progress Tracking

**Status History :**
- 2026-07-15 : Créée par Scrum Master (BMAD create-story)
- 2026-07-15 : Implémentée + vérifiée docker + `/code-review` (1 bug corrigé) + intégrée sur `dev` par Claude (BMAD dev-story)

**Actual Effort :** ~3 points (conforme à l'estimation)

---

## Revue & validation

### Implémentation

Extension de la transaction de `ExtractionService` (STORY-042/043) **sans réécriture**, plus une surface de lecture relying party.

- **Persistance** : `schemas/document-extraction.schema.ts` (collection `document_extractions`, keyée `organizationId`, `documentId` **unique**, `type: [Object]` pour `discrepancies`, **`minimize:false`** — préserve `extracted:{}`/`declared:{}`, même piège que l'`OutboxEvent`) + `document-extraction.repository.ts` (`persist(input, session)` **dans la tx** + `findByDocumentId` en `lean`). Ids en **String** (comme la `partitionKey` de l'outbox) : isolation par comparaison directe au `tenantId` et **aucune** conversion `ObjectId` dans la transaction.
- **Transaction** : `ExtractionService.markProcessedPersistAndEmit` insère marqueur `ProcessedEvent` **+** `DocumentExtraction` **+** enqueue `document.extrait` **atomiques**. Garde `documentId` ajoutée à `consume()` (le champ requis persisté sinon lèverait dans la tx → poison-pill).
- **Consultation** : `extraction.controller.ts` — `GET /v1/documents/:documentId/extraction`, `@Roles(PLATFORM_ADMIN, TENANT_ADMIN)`, **isolation `orgId`** (`PLATFORM_ADMIN` global, sinon `organizationId === tenantId`), **404** si absente **ou** hors-tenant. DTO `ExtractionResponseDto` (structuré, sans binaire/texte OCR).
- **Retrait `whoami`** : `DiagnosticsModule` + `whoami.controller`/spec/dto + `whoami.e2e-spec` supprimés ; le câblage JWKS est désormais prouvé par la vraie surface métier (`documents.e2e-spec`). `main.ts` : tag Swagger `diagnostics` → `documents`.
- **DO-1** : lecture seule, aucune écriture de statut KYC, aucun appel sortant vers `kyc-service`.

### Qualité

- **ESLint** : 0 warning. **186 unit / 32 suites** ; **nouveaux fichiers 100 %** (`document-extraction.repository.ts`, `extraction.controller.ts`, `extraction.service.ts`, `document-extraction.schema.ts`). **17 e2e / 4 suites** (dont `documents.e2e` : JWKS 401/HS256/audience + rôle 403 + e-mail non vérifié 403 + isolation 404). Build image `runtime` OK.
- Couvre : schéma (`minimize:false`, `documentId` unique), persistance **dans la tx** (ordre marqueur→persist→enqueue ; rejeu → aucun des trois ; E11000 documentId post-TTL → skip), repository (`persist`/`findByDocumentId`), contrôleur (200 / 404 absente / 404 cross-tenant / `PLATFORM_ADMIN` cross-org), garde `documentId`.

### /code-review (high) & corrections

`/code-review` (high) → **1 bug corrigé** + 2 constats LOW différés :
1. **(correctness, corrigé)** E11000 sur l'unicité `documentId` **à la persistance** n'était **pas** traité comme un rejeu (seul le E11000 du **marqueur** l'était) → **propagé** → **poison-pill** bloquant la partition. **Reachable** : `ProcessedEvent` porte un **TTL 30 j** alors que `DocumentExtraction` (`documentId` unique) et `OutboxEvent` (`eventId` unique) sont **permanents** ; une re-livraison **après purge du marqueur** recrée le marqueur mais bute sur le `documentId` déjà présent. **Fix** : marqueur + persist + enqueue regroupés dans **un seul `try`** ; **toute** violation d'unicité → `abort` + `return false` (skip idempotent), jamais propagée (+ test « rejeu post-TTL »).
2. **(simplification, LOW, différé)** `DocumentExtractionRecord` ≈ `PersistExtractionInput` (types write/read voisins — duplication assumée).
3. **(consistency, LOW, différé)** `organizationId` en `String` (vs `Types.ObjectId` du read-model `OrgIdentity`) — choix **anti-poison-pill** assumé (aucune conversion dans la tx), documenté au schéma ; un futur `$lookup` nécessiterait un cast.

### Vérification docker bout-en-bout (2026-07-15)

Stack `mongo` (rs0) + `kafka` + `minio` + `mailhog` + `auth-service:3001` + `kyc-service:3002` + `document-service:3006` (override `base`, hot-reload) :

- **/health** = 200 (mongo + kafka + minio `kyc-documents`). Les **deux** consommateurs (`document-identity`, `document-ocr`) rejoignent leurs groupes. Route **`GET /api/documents/:documentId/extraction` mappée** ; **`whoami` retiré** (`/api/v1/whoami` → 404) ; GET sans jeton → **401**.
- **Pipeline nominal** : `register` (cabinet `MNV044 VERIF SARL`, `CI`) → `verify` (Mailhog) → `login` (aud incl. `document-service`) → upload **RCCM + CFE** → `document-service` persiste **2 `DocumentExtraction`** (keyées `orgId`, une par pièce) : **`extracted:{}` préservé** (`minimize:false` prouvé en réel — `sort-arrow-sprite.png` n'est pas une vraie pièce), `declared` **résolu** `{denomination:'MNV044 a SARL', country:'CI'}`, `discrepancies:[{denomination, missing_read}]`, `flags:{unreadable:true, expired:false}`, `eventId` = **source** (UUID) ; **2 `document.extrait` `SENT`** (clé `orgId`, `eventId` `…:extrait`).
- **Consultation** : `GET .../:doc/extraction` (token du cabinet) → **200** + DTO complet ; **pièce inconnue** → **404** ; **cross-tenant** (cabinet C sur les 2 pièces de A) → **404 × 2** (isolation `orgId`, n'expose pas l'existence).
- **Idempotence (rejeu)** : reset des offsets `document-ocr` → `earliest` + restart → **tous** les events re-livrés **ignorés** (pré-contrôle « déjà traité »), `document_extractions` **reste 2**, outbox `document.extrait` **reste 7** — **aucune** double persistance, **aucune** ré-émission (exactement-une-fois effective).
- **Aucun** statut KYC touché (DO-1).

### Intégration

Repo **`prospera-ocr-service`** (branche `MNV-044` depuis `dev`, rebasée sur `origin/dev`). PR **#4 `MNV-044(document-service): …` → `dev` en « Rebase and merge »** (HEAD `d044333`), branche supprimée. *(Le bloc `document-service` du `docker-compose.yml` racine était déjà complet — STORY-044 n'ajoute aucune variable d'env.)*

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
