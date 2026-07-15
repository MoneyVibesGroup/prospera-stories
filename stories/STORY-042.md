# STORY-042 : `document-service` — consumer **idempotent** de `kyc.document.uploaded` → lecture de la pièce (MinIO) → **OCR + extraction structurée RCCM/CFE**

**Epic :** EPIC-015 — Chaîne KYC / OCR (`document-service`) : OCR au service du KYC (assiste la revue, ne décide jamais — invariant **DO-1**)
**Réf. architecture :** `tech-spec-document-service-2026-07-10.md` (v1.0, §Exigences « Consommateur… idempotent », §Plan d'implémentation — **ST-DOC-2**) · `architecture-kyc-service-2026-07-03.md` §« Contrat d'événements `kyc.document.uploaded` (v1) — source de vérité » (STORY-040) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Contrats d'événements (Kafka, at-least-once) · **patron consommateur idempotent** `bilan-service` (STORY-036 : `KycStatusConsumer` bootstrap + `ProcessedEvent` + projection transactionnelle) · décisions programme **AD-2** (chaîne KYC en 2 flux) + **DO-1** (l'OCR propose, l'humain décide)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-15. Pipeline d'ingestion OCR branché : consommateur `kyc.document.uploaded` (group `document-ocr`, **idempotent** `ProcessedEvent`, tolérant à la panne — patron `bilan-service`) → lecture pièce (MinIO lecture seule) → OCR (`OcrProvider`/Tesseract) → **extraction structurée RCCM/CFE** (`DocumentParserRegistry` + `RccmParser`/`CfeParser`) → **traçage** (sans PII). Persistance/`document.extrait`/comparaison **hors périmètre** (043/044) ; **aucune** écriture de statut KYC (**DO-1**). lint 0, **130 unit (24 suites) + 13 e2e** verts, couverture **99.27/90.66/98.97/99.2**. `/code-review` (high) : **3 constats corrigés** (dont poison-pill `null` → crash consommateur, vérifié docker). Intégré : PR `MNV-042(document-service): …` **mergée « Rebase and merge » sur `dev`**. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-15
**Sprint :** 9
**Service :** document-service (`:3006`, base `document_service`) — *relying party* pur (STORY-041)
**Couvre :** aucun FR fonctionnel direct (capacité transverse d'OCR au service du KYC ; décisions **AD-2 / DO-1**) — **premier maillon métier** du pipeline d'extraction EPIC-015 (STORY-042 → 043 → 044 → 045)

> **Deuxième story de la chaîne EPIC-015 (flux B du Module 0).** STORY-041 a posé le **scaffold** : `document-service` démarrable, *relying party* RS256/JWKS, `KafkaModule` **squelette** (client de santé seulement), `OcrProvider` (Tesseract, texte brut) et `DocumentStorageReader` (MinIO **lecture seule**). STORY-042 **branche le pipeline d'ingestion** : elle ouvre le **consommateur Kafka** du topic `kyc.document.uploaded` (contrat v1 figé par STORY-040), **idempotent** (marqueur `ProcessedEvent{eventId}`, livraison *at-least-once*), **lit** la pièce désignée par `storageKey` (MinIO), exécute l'**OCR** (`OcrProvider`), puis **parse le texte brut en champs structurés RCCM/CFE** (n° d'immatriculation, dénomination, dates…). Le résultat d'extraction est **calculé et tracé** (résumé structuré, jamais de binaire ni de PII en clair) ; sa **persistance** (`DocumentExtraction`), la **comparaison déclaré vs lu**, la **détection expiré/illisible** et la **publication de `document.extrait`** sont **hors périmètre** → STORY-043 / STORY-044. **Invariant DO-1 strict :** `document-service` **n'écrit jamais** le statut KYC — il assiste, il ne décide pas.

---

## User Story

En tant que **plateforme PROSPERA (chaîne KYC assistée par OCR)**,
je veux que `document-service` **consomme de façon idempotente** l'événement `kyc.document.uploaded` émis à chaque dépôt de pièce, **lise** la pièce correspondante dans MinIO et en **extraie les champs structurés RCCM/CFE** par OCR,
afin de disposer, à chaque téléversement de justificatif légal (RCCM / carte CFE), d'une **extraction tracée, rejouable sans doublon et prête à être comparée au déclaré** — socle sur lequel STORY-043 branchera la comparaison + la publication de `document.extrait` et STORY-044 la persistance, pour **enrichir le dossier de revue humaine sans jamais l'approuver automatiquement** (invariant DO-1).

---

## Description

### Contexte

La chaîne KYC de PROSPERA est structurée en **deux flux** (décision **AD-2**) : le **flux A** (revue humaine via `admin-panel`, EPIC-016) et le **flux B** (assistance OCR via `document-service`, EPIC-015 — *cet épic*). L'invariant **DO-1** est strict : **l'OCR propose, l'humain décide**. `document-service` **ne possède** ni l'identité (`auth-service`), ni le KYC ni les **pièces** (`kyc-service`, propriétaire du bucket MinIO `kyc-documents`). Il **réagit** à un événement, **lit** une pièce et **produit** une assistance à la revue — rien de plus.

**STORY-040** a figé le **contrat producteur `kyc.document.uploaded` v1** (source de vérité : `architecture-kyc-service-2026-07-03.md`) : `kyc-service` publie, **à chaque dépôt de pièce réussi** (`POST /kyc/documents`), un événement **transactional-outbox** (« pas de pièce sans événement, pas d'événement sans pièce ») portant `{ schemaVersion, eventId, orgId, documentId, type, storageKey, mimeType, size, version, uploadedBy, occurredAt }`, **clé de partition = `orgId`**, **livraison at-least-once**. **STORY-041** a posé le scaffold `document-service` avec le `KafkaModule` volontairement réduit à un **client de santé** (aucun consumer, aucun groupe de consommateurs) et l'`OcrProvider`/`DocumentStorageReader` prêts mais **non encore branchés sur le flux réel**.

STORY-042 est le **premier maillon métier** : elle transforme le squelette en **pipeline d'ingestion** effectif. Elle **calque le patron consommateur idempotent le plus récent de l'écosystème** — `bilan-service` STORY-036 (`KycStatusConsumer` en *bootstrap* tolérant à la panne + `KycStatusProjectionService` transactionnelle + marqueur `ProcessedEvent{eventId}` unique + `isDuplicateKeyError`) — en l'adaptant à un traitement **coûteux et non transactionnel** (l'OCR) : lecture MinIO + OCR **hors** transaction (comme `kyc-service` fait le `putObject` **avant** la transaction, STORY-040), transaction Mongo réduite au **marqueur d'idempotence**.

L'EPIC-015 se découpe en 5 stories : **STORY-041** (scaffold — *done*), **STORY-042** (consumer idempotent + lecture pièce + OCR + extraction RCCM/CFE — *cette story*), **STORY-043** (comparaison déclaré/lu + expiré/illisible → producteur `document.extrait` outbox), **STORY-044** (persistance `DocumentExtraction` keyée `orgId` + GET consultation), **STORY-045** (côté `kyc-service` : consommer `document.extrait` → enrichir le dossier). STORY-042 livre le **cœur du traitement** (ingestion + reconnaissance) **sans encore rien émettre ni persister de métier** : c'est une tranche volontairement resserrée pour rester **testable en isolation** (le consumer tourne, dédduplique, lit, OCRise, parse et **trace** un résumé d'extraction), et qui **débloque** 043/044 par extension du **même** handler.

### Périmètre

**Dans le périmètre**

- **Contrat consommé (dupliqué localement)** : `kafka/events/kyc-document-events.ts` — constante `KYC_DOCUMENT_UPLOADED_TOPIC = 'kyc.document.uploaded'` + interface `KycDocumentUploadedEventV1` **copiée fidèlement** du contrat v1 (source de vérité `architecture-kyc-service`) ; enum `KycDocumentType { RCCM, CFE }` **dupliquée** dans `common/enums/` (calque de `kyc-service/src/common/enums/kyc-document-type.enum.ts`). Duplication disciplinée assumée (décision **K4**), figée par `schemaVersion`.
- **Consommateur Kafka** `KycDocumentUploadedConsumer` (*bootstrap*, calqué sur `bilan-service` `KycStatusConsumer`) : `kafka.consumer({ groupId })` — **nouveau groupe `document-ocr`** (isolé) —, `subscribe({ topics: [KYC_DOCUMENT_UPLOADED_TOPIC], fromBeginning: true })`, `run({ eachMessage })`. **Tolérant à la panne** (broker indisponible au boot ⇒ ne fait **jamais** échouer le démarrage HTTP ; re-tentative en arrière-plan `setInterval` `unref()`), `disconnect()` propre en `onModuleDestroy`. **Aucune** logique métier dans le bootstrap (I/O Kafka uniquement → exclu de couverture `*consumer*`/`*bootstrap*`).
- **Idempotence** : schéma `ProcessedEvent{eventId unique, processedAt}` (calque `bilan-service`, TTL 30 j) + `duplicate-key.util.ts` (`isDuplicateKeyError`) **dupliqués**. Marqueur **transactionnel** (`processedModel.create([{ eventId }], { session })`) ; rejeu (même `eventId`) → E11000 → **ignoré** (exactement-une-fois **effective**). **Pré-contrôle** de présence du marqueur **avant** l'OCR (évite de ré-OCRiser une pièce déjà traitée au rejeu ; le marqueur transactionnel reste la source de vérité en cas de course).
- **Garde-fous d'enveloppe (poison-pill)** dans le handler (calque `bilan-service`) : corps absent / illisible (JSON invalide) / `eventId` manquant / `occurredAt` invalide / `orgId` non-`ObjectId` / `type ∉ {RCCM,CFE}` / `storageKey` manquant → **message ignoré** (offset avancé, `warn` loggé) — jamais de blocage de partition sur une donnée structurellement invalide.
- **Lecture de la pièce** : `DocumentStorageReader.getObject(storageKey)` (MinIO **lecture seule**, brique STORY-041) → `Buffer`. **Aucune** écriture, **aucune** création de bucket, **aucune** URL présignée. Le contenu binaire n'est **jamais** journalisé.
- **OCR** : `OcrProvider.extract(buffer, { lang })` (impl `TesseractOcrProvider`, langue par défaut `ocr.defaultLang = fra`) → `OcrResult { text, confidence, provider }` (**texte brut**, brique STORY-041). L'abstraction reste **pluggable** : `FakeOcrProvider` substituable en test (DO-1).
- **Extraction structurée RCCM/CFE** : nouveau `modules/extraction/` — un **parseur par type** (`RccmParser`, `CfeParser`) derrière un registre/abstraction `DocumentFieldParser` (dispatch sur `event.type`), transformant le **texte brut OCR** en `ExtractedFields` structurés (voir §Technical Notes). Produit un résultat **en mémoire** `ExtractedDocument { documentId, orgId, type, fields, confidence, provider, extractedAt }`. **Le provider OCR reste neutre** (texte brut only) ; **tout le *parsing* de champ vit ici**, découplé du moteur et de la comparaison.
- **Traçage du résultat** : le handler **loggue un résumé structuré** de l'extraction (`documentId`, `type`, champs **reconnus/absents** — clés seulement ou valeurs non sensibles, `confidence`, `provider`) — **jamais** le binaire, **jamais** le texte OCR intégral (PII). C'est la **sortie observable** de STORY-042 (l'extraction « existe, tracée, idempotente »).
- **Câblage** : `ExtractionModule` (consumer + service d'orchestration + parseurs + `ProcessedEvent`) importé dans `app.module.ts` ; `KafkaConfig` étendue d'un `groupId` (`KAFKA_GROUP_ID`, défaut `document-ocr`) ; env `document-service` et compose racine mis à jour en conséquence (nouvelle variable `KAFKA_GROUP_ID`).
- **Tests** : unitaires (handler idempotent, garde-fous, dispatch parseurs, mapping OCR→fields, substituabilité `FakeOcrProvider`) + e2e (consumer réel en docker : dépôt kyc → extraction tracée + marqueur ; rejeu sans doublon ; message malformé ignoré). Seuils Jest standard (**65/90/90/90**).

**Hors périmètre (stories suivantes)**

- **Comparaison déclaré vs lu** (valeurs d'inscription vs valeurs OCR) + **détection pièce expirée / illisible** (seuils de confiance, drapeaux) → **STORY-043**.
- **Producteur `document.extrait`** (outbox transactionnel, patron STORY-034/021) → **STORY-043** — STORY-042 **n'émet aucun** événement métier.
- **Persistance `DocumentExtraction`** (base `document_service`, keyée `orgId`) + éventuel `GET /documents/:documentId/extraction` → **STORY-044** — STORY-042 **ne persiste que** le marqueur `ProcessedEvent` (idempotence), **pas** le résultat d'extraction.
- **Résolution du `declared`** (identité déclarée à comparer) : `kyc.document.uploaded` v1 **ne porte pas** `declared` (kyc ne possède plus l'identité déclarée depuis le cutover STORY-030). La résolution « déclaré ↔ lu » via un **read-model `identity.*`** local est le **point de coordination STORY-042/043** — **cadré ici** (voir §Additional Notes), **câblé** en STORY-043.
- **Toute écriture du statut KYC** — invariant **DO-1** : `document-service` n'appelle jamais `kyc-service` pour changer un statut ; il ne fait qu'ingérer + reconnaître.
- **Extensions** (factures fournisseurs, dossiers de Crédit, OCR Atelier Balance EPIC-018/020) → différées (mêmes patrons, nouveaux types/parseurs).

### Flux (mise en route)

1. Stack docker complète (`mongo` rs0, `kafka`, `minio`, `auth-service:3001`, `kyc-service:3002`, `document-service:3006`). Au boot, `document-service` **ouvre le consommateur** `kyc.document.uploaded` (groupe `document-ocr`). Broker indisponible → boot HTTP **quand même** OK, re-tentative en tâche de fond.
2. Un cabinet (`TENANT_ADMIN`) dépose une pièce sur `kyc-service` : `POST :3002/kyc/documents` (type `RCCM` puis `CFE`, fichier PDF/JPEG/PNG). `kyc-service` persiste la pièce (MinIO) **et** enfile `kyc.document.uploaded` **dans la même transaction** (STORY-040) ; le relais outbox publie sur Kafka (clé `orgId`, header `eventId`/`schemaVersion`).
3. `document-service` **consomme** le message : valide l'enveloppe → **pré-contrôle** `ProcessedEvent` (déjà vu ? on ignore) → **lit** la pièce via `getObject(storageKey)` → **OCR** `extract(buffer, {lang:'fra'})` → **parse** selon `type` (`RccmParser`/`CfeParser`) → **transaction** : insère `ProcessedEvent{eventId}` (unique) → **loggue** le résumé d'extraction structuré.
4. **Rejeu** (même `eventId` re-livré : redémarrage du consumer `fromBeginning`, rééquilibrage, ou re-publication) → le pré-contrôle **ou** l'E11000 sur le marqueur ⇒ **ignoré**, **aucune** ré-extraction persistée en double (exactement-une-fois effective).
5. **Message malformé** (corps illisible, `type` inconnu, `storageKey` absent, `orgId` non-ObjectId) → **ignoré** (offset avancé), `warn` loggé, **partition non bloquée**.
6. **Aucun** `document.extrait` n'est émis, **aucune** `DocumentExtraction` persistée, **aucun** statut KYC touché (STORY-043/044/DO-1).

---

## Acceptance Criteria

- [ ] **Contrat consommé dupliqué fidèlement** : `kafka/events/kyc-document-events.ts` exporte `KYC_DOCUMENT_UPLOADED_TOPIC = 'kyc.document.uploaded'` et l'interface `KycDocumentUploadedEventV1` **identique** au contrat v1 (`{ schemaVersion:1, eventId, orgId, documentId, type, storageKey, mimeType, size, version, uploadedBy, occurredAt }`) ; enum `KycDocumentType { RCCM='RCCM', CFE='CFE' }` dupliquée sous `common/enums/`. **Aucune** dépendance de code vers `kyc-service` (copie disciplinée, `schemaVersion` comme garde-fou de dérive).
- [ ] **Consommateur Kafka fonctionnel et tolérant à la panne** : `KycDocumentUploadedConsumer` (*bootstrap*) crée `kafka.consumer({ groupId })` avec `groupId = KafkaConfig.groupId` (**nouveau `KAFKA_GROUP_ID`, défaut `document-ocr`**), `subscribe([KYC_DOCUMENT_UPLOADED_TOPIC], fromBeginning:true)`, `run({ eachMessage })`. Un **broker indisponible au boot ne fait jamais échouer le démarrage HTTP** ; la connexion est **réessayée en arrière-plan** (`setInterval` + `unref()`, garde non-réentrante). `onModuleDestroy` → `consumer.disconnect()` (best-effort). **Un seul groupe de consommateurs** est créé (`document-ocr`) — pas de consumer orphelin.
- [ ] **Idempotence — exactement-une-fois effective** : schéma `ProcessedEvent{eventId (unique), processedAt}` (TTL 30 j) + `isDuplicateKeyError` (calques `bilan-service`). Le marqueur est inséré **dans une transaction Mongo** ; un **rejeu** du même `eventId` → **E11000 → message ignoré** (pas de double traitement). Un **pré-contrôle** `findOne({eventId})` **avant** l'OCR court-circuite le rejeu **sans** ré-OCRiser (optimisation coût ; le marqueur transactionnel reste l'autorité en cas de course). **Test** : deux livraisons du même `eventId` ⇒ une seule extraction tracée, un seul marqueur.
- [ ] **Garde-fous d'enveloppe (poison-pill)** : un message dont le **corps est absent / illisible (JSON invalide)**, ou dont **`eventId`** manque, ou **`occurredAt`** est invalide, ou **`orgId`** n'est pas un `ObjectId` valide, ou **`type ∉ {RCCM,CFE}`**, ou **`storageKey`** est absent/vide → est **ignoré** (offset avancé, `warn` loggé décrivant le motif). **Aucune** de ces conditions ne bloque la partition ni ne lève. **Test** : chacun de ces cas ⇒ pas d'appel MinIO/OCR, pas de marqueur, offset avancé.
- [ ] **Lecture de la pièce — MinIO lecture seule** : le handler lit **uniquement** la clé `storageKey` de l'événement via `DocumentStorageReader.getObject(storageKey)` (brique STORY-041). **Aucun** appel d'écriture/bucket/présigné (garanti par l'API réduite du reader). **Le contenu binaire de la pièce n'est jamais journalisé.** **Test** : `getObject` appelé avec exactement le `storageKey` du message, aucune énumération.
- [ ] **OCR via l'abstraction** : `OcrProvider.extract(buffer, { lang })` est invoqué avec la langue par défaut `ocr.defaultLang` (`fra`) → `OcrResult { text, confidence, provider }` (texte brut). L'abstraction reste **pluggable** : un `FakeOcrProvider` injecté en test remplace Tesseract **sans toucher** au service d'orchestration ni aux parseurs (critère tech-spec « basculer d'OCR ne modifie pas le code métier »).
- [ ] **Extraction structurée RCCM/CFE** : un `DocumentFieldParser` **dispatch sur `event.type`** (`RccmParser` pour RCCM, `CfeParser` pour CFE) transforme le **texte brut OCR** en `ExtractedFields` structurés (n° d'immatriculation, dénomination/raison sociale, dates… — jeu de champs précisé §Technical Notes, ajustable à l'implémentation). Le résultat `ExtractedDocument { documentId, orgId, type, fields, confidence, provider, extractedAt }` est produit **en mémoire**. **Aucune** logique de comparaison, de seuil, de drapeau « expiré/illisible » (STORY-043). **Test** : sur des textes OCR d'exemple RCCM et CFE, les champs attendus sont extraits ; un texte non reconnu ⇒ champs absents (jamais d'exception métier).
- [ ] **Sortie observable = traçage, pas de persistance métier ni d'émission** : le handler **loggue un résumé structuré** de l'extraction (`documentId`, `type`, clés de champs **reconnus/absents**, `confidence`, `provider`) — **sans** binaire ni texte OCR intégral (PII). **STORY-042 ne persiste PAS** de `DocumentExtraction` (→ STORY-044), **n'émet PAS** `document.extrait` (→ STORY-043), **ne compare PAS** au déclaré (→ STORY-043) et **n'écrit JAMAIS** de statut KYC (**DO-1**). Seul le marqueur `ProcessedEvent` est persisté.
- [ ] **Robustesse OCR / lecture (non-blocage de partition)** : une erreur **transitoire** (init worker OCR, I/O MinIO, réseau) **se propage** → Kafka **rejoue** (at-least-once, traitement idempotent). Une pièce **techniquement lue mais illisible** (OCR à faible/nulle confiance) **ne bloque pas** la partition : elle produit un `ExtractedDocument` (champs possiblement vides) **marqué traité** — la **décision « illisible »** (seuil + drapeau) est **STORY-043**. Un objet **définitivement absent** (`NoSuchKey`) est **loggué en erreur et ignoré** (offset avancé, pas de marqueur) plutôt que de bloquer indéfiniment. (Comportement à figer à l'implémentation, documenté §Cas limites.)
- [ ] **Câblage & configuration** : `ExtractionModule` importé dans `app.module.ts` ; `KafkaConfig` étendue de `groupId` (validé/optionnel via `env.validation.ts`/`configuration.ts`, défaut `document-ocr`) ; bloc `document-service` du `docker-compose.yml` **racine** + override + `.env.example` reçoivent `KAFKA_GROUP_ID`. **Aucun** nouveau service d'infra (Mongo/Kafka/MinIO déjà présents). Le `/health` reste inchangé (mongo + kafka + minio).
- [ ] **CI** verte (matrice 6 services inchangée ; le nouveau code métier est couvert en **unitaire** avec `FakeOcrProvider` + Kafka/Mongo **mockés** — aucun broker/minio réel requis en CI ; le consumer réel est éprouvé en **vérif docker**). Lint **0 warning**, seuils Jest tenus.
- [ ] **Vérification docker bout-en-bout** : stack `mongo`+`kafka`+`minio`+`auth`+`kyc`+`document` ; register→login (IdP) → **dépôt RCCM puis CFE** sur `kyc-service` → `document-service` **consomme** les 2 événements : lit les pièces (MinIO), OCRise, **parse** RCCM/CFE, **loggue** 2 résumés d'extraction, persiste **2 marqueurs `ProcessedEvent`** dans `document_service`. **Rejeu** (redémarrage `document-service` / re-consommation `fromBeginning`) ⇒ **aucune** ré-extraction en double (marqueurs dédupliquent). **Message malformé** publié à la main ⇒ **ignoré** (warn), partition saine. **Aucun** `document.extrait` produit, **aucun** statut KYC modifié.

---

## Technical Notes

### Composants

- **Backend :** `document-service` (`:3006`, base `document_service`) — ajout d'un module métier `modules/extraction/` + extension `KafkaConfig`.
- **Frontend :** aucun (l'UI de revue = `admin-panel`, flux A / EPIC-016, qui lira l'extraction **via `kyc-service`** une fois 043/045 livrées).
- **Base de données :** Mongo `document_service` — **une seule** collection ajoutée : `processed_events` (marqueur d'idempotence). **Pas** de collection d'extraction (STORY-044).
- **Bus :** Kafka — **consommateur** `kyc.document.uploaded` (groupe `document-ocr`). Aucun producteur (STORY-043).
- **Stockage :** MinIO **lecture seule** (`kyc-documents`, propriété `kyc-service`) — `getObject(storageKey)`.
- **OCR :** `OcrProvider`/`TesseractOcrProvider` (STORY-041) + **nouveaux parseurs** RCCM/CFE.

### Arborescence (ajouts sur le scaffold STORY-041)

```
document-service/src/
├── common/enums/
│   └── kyc-document-type.enum.ts        # NEW — dupliqué de kyc-service (RCCM|CFE)
├── kafka/
│   ├── kafka.module.ts                  # inchangé (client partagé)
│   └── events/
│       └── kyc-document-events.ts       # NEW — KYC_DOCUMENT_UPLOADED_TOPIC + KycDocumentUploadedEventV1 (contrat v1)
├── modules/extraction/
│   ├── extraction.module.ts             # NEW — consumer + service + parseurs + ProcessedEvent
│   ├── kyc-document-uploaded.consumer.ts# NEW — bootstrap Kafka (calque bilan KycStatusConsumer) — EXCLU couverture
│   ├── extraction.service.ts            # NEW — orchestration : pré-contrôle → getObject → OCR → parse → tx marqueur → log
│   ├── parsers/
│   │   ├── document-field.parser.ts     # NEW — abstraction/registre (dispatch sur type)
│   │   ├── rccm.parser.ts               # NEW — texte OCR → ExtractedFields (RCCM)
│   │   └── cfe.parser.ts                # NEW — texte OCR → ExtractedFields (CFE)
│   ├── types/
│   │   └── extracted-document.ts        # NEW — ExtractedFields, ExtractedDocument (résultat EN MÉMOIRE)
│   ├── schemas/
│   │   └── processed-event.schema.ts    # NEW — dupliqué de bilan-service (eventId unique, TTL 30j)
│   └── duplicate-key.util.ts            # NEW — isDuplicateKeyError (E11000) — dupliqué de bilan-service
└── config/
    ├── configuration.ts                 # + KafkaConfig.groupId (KAFKA_GROUP_ID, défaut 'document-ocr')
    └── env.validation.ts                # KAFKA_GROUP_ID optionnel (défaut fourni)
```

> **Pas** de schéma de domaine `DocumentExtraction` (STORY-044), **pas** d'`OutboxEvent`/relay (STORY-043), **pas** de read-model `identity.*` (coordination 043). `storage/` et `ocr/` (STORY-041) sont **réutilisés tels quels**.

### Patron consommateur idempotent (calqué sur `bilan-service` STORY-036)

`bilan-service` fournit le **modèle exact** à dupliquer/adapter :
- **Bootstrap tolérant à la panne** (`KycStatusConsumer`) : `onApplicationBootstrap` → `tryStart()` (connect/subscribe/run) ; échec → `setInterval(tryStart, 5s).unref()` ; succès → `clearInterval`. `onModuleDestroy` → `disconnect().catch(()=>undefined)`. Garde `starting`/`started` non-réentrante. **Aucune** logique métier → exclu de couverture (`collectCoverageFrom` ignore `*consumer*`/`*bootstrap*`).
- **Handler `eachMessage`** : garde `topic`, corps `message.value?.toString()`, `JSON.parse` protégé, `eventId = headers.eventId ?? payload.eventId`, validations d'enveloppe (`occurredAt`, `orgId` `Types.ObjectId.isValid`) → **délègue** au service (`extraction.service`). Donnée invalide **ignorée** (return, pas de throw) ; erreur de traitement **propagée** (rejeu Kafka).
- **Service transactionnel** (`KycStatusProjectionService` → ici `ExtractionService`) : `connection.startSession()` + `startTransaction()` → `processedModel.create([{ eventId }], { session })` (E11000 → `abortTransaction` + `return false` = déjà traité) → **[STORY-043/044 : + enqueue outbox `document.extrait` + persist `DocumentExtraction` dans la MÊME tx]** → `commitTransaction()`. `finally` → `endSession()`.

**Adaptation STORY-042 (OCR coûteux, non transactionnel)** : contrairement à `bilan` (calcul purement en mémoire dans la tx), l'OCR/lecture MinIO sont **hors** transaction (I/O lourdes, non-rollbackables), **avant** l'ouverture de session — patron « effet de bord coûteux avant la tx » emprunté à `kyc-service` STORY-040 (`putObject` avant tx). Séquence : `findOne(ProcessedEvent)` (skip si présent) → `getObject` → `extract` → `parse` → **tx { create(ProcessedEvent) }** → log. En STORY-042 la tx **ne contient que le marqueur** (le résultat d'extraction n'est pas encore persisté) ; 043/044 y ajoutent l'outbox + la persistance, faisant du marqueur et de l'effet métier un **tout atomique**.

### `kyc-document-events.ts` — contrat consommé (copie v1)

```ts
export const KYC_DOCUMENT_UPLOADED_TOPIC = 'kyc.document.uploaded';

/** Contrat v1 (source de vérité : architecture-kyc-service-2026-07-03 §Contrat). */
export interface KycDocumentUploadedEventV1 {
  schemaVersion: 1;
  eventId: string;      // UUID v4 — clé de déduplication
  orgId: string;        // ObjectId hex — clé de partition Kafka
  documentId: string;   // ObjectId hex du KycDocument
  type: KycDocumentType;// RCCM | CFE
  storageKey: string;   // clé MinIO (bucket kyc-documents) — lecture seule
  mimeType: string;     // MIME réel (magic bytes)
  size: number;         // octets
  version: number;      // version de la pièce (ré-upload ⇒ +1)
  uploadedBy: string;   // userId opaque
  occurredAt: string;   // ISO-8601 UTC
}
```

### `parsers/` — extraction structurée (cœur métier de STORY-042)

- **Abstraction / dispatch** : `DocumentFieldParser` (registre `type → parser`) — sélectionne `RccmParser` ou `CfeParser` selon `event.type`. Découple **totalement** le parsing du moteur OCR (qui reste « texte brut ») et de la comparaison (STORY-043). Ajouter un type ultérieur (Atelier Balance : Statuts, factures) = **ajouter un parseur**, sans toucher au consumer.
- **`ExtractedFields`** (jeu **indicatif**, à affiner à l'implémentation sur pièces OHADA réelles) :
  - **RCCM** (*Registre du Commerce et du Crédit Mobilier*) : `{ rccmNumber?, denomination?, legalForm?, registrationDate? }` (n° RCCM au format zone p.ex. `TG-LOM-01-2020-B12-34567`, dénomination/raison sociale, forme juridique, date d'immatriculation).
  - **CFE** (*carte CFE* — Centre de Formalités des Entreprises) : `{ cfeNumber?, taxId?, denomination?, issueDate? }` (n° de carte / identifiant fiscal, dénomination, date d'émission).
  - Champs **optionnels** : le parsing best-effort renvoie ce qu'il reconnaît ; l'**absence** d'un champ est un résultat valide (elle nourrira les écarts/drapeaux en STORY-043), **jamais** une exception.
- **`ExtractedDocument`** (résultat **en mémoire**, non persisté ici) : `{ documentId, orgId, type, fields: ExtractedFields, confidence, provider, extractedAt }`. C'est le **type d'entrée** de la comparaison (043) et de la persistance (044).
- **Technique de parsing** : normalisation du texte OCR (casse, espaces, accents) + **regex/heuristiques par étiquette** (« RCCM N° », « Dénomination », « Immatriculé le »…). Robuste au bruit OCR (texte partiel). **Aucun** appel réseau, **aucune** dépendance externe nouvelle.

### Configuration — `KafkaConfig.groupId`

- `configuration.ts` : `kafka.groupId = process.env.KAFKA_GROUP_ID ?? 'document-ocr'`. `env.validation.ts` : optionnel (défaut fourni), non requis au boot.
- Groupe **dédié `document-ocr`** (isolé) : distinct des groupes des autres services ; permet un rejeu maîtrisé (`fromBeginning:true` au 1er démarrage du groupe).
- Compose racine + override + `.env.example` : ajouter `KAFKA_GROUP_ID: ${DOCUMENT_KAFKA_GROUP_ID:-document-ocr}` au bloc `document-service` (⚠️ édition `.env*` bloquée en sandbox — cf. STORY-041/075 : le compose fournit tout via `environment:`, impact nul).

### Sécurité

- **MinIO lecture seule** : seule la `storageKey` **fournie par l'événement** est lue ; aucune énumération de bucket, aucune écriture (garanti par l'API réduite du `DocumentStorageReader`). **Le binaire de la pièce n'est jamais journalisé** ; les logs d'extraction ne contiennent **pas** le texte OCR intégral (PII potentielle : n° RCCM, raison sociale) — seulement des **clés de champs** reconnus/absents + métriques (`confidence`, `provider`).
- **Isolation `orgId`** : l'`orgId` provient de l'événement (clé de partition) ; les données sont keyées `orgId`/`documentId`. Pas de contexte JWT ici (traitement event-driven asynchrone, hors requête HTTP).
- **DO-1** : aucun appel sortant vers `kyc-service` ni écriture de statut ; `document-service` reste **producteur d'assistance** (émission en STORY-043).

### Cas limites / points d'attention

- **⚠️ Poison-pill vs rejeu légitime.** Une donnée **structurellement invalide** (enveloppe) est **ignorée** (offset avancé) — sinon elle bloquerait la partition indéfiniment (at-least-once). Une erreur **transitoire de traitement** (OCR/MinIO/réseau) est **propagée** (Kafka rejoue). Trancher clairement à l'implémentation **quelle classe d'erreur ignore-t-on vs rejoue-t-on** (recommandation : *ignorer* = enveloppe invalide + `NoSuchKey` définitif ; *rejouer* = tout le reste).
- **⚠️ OCR faible confiance ≠ échec.** Une pièce lue mais mal reconnue produit un résultat (champs vides) **marqué traité** : ne pas la transformer en poison-pill. Le **jugement « illisible »** (seuil de confiance + drapeau) appartient à **STORY-043**.
- **PDF vs image.** `kyc.document.uploaded.mimeType` peut valoir `application/pdf` (le PRD accepte PDF/JPEG/PNG). `TesseractOcrProvider` traite des images ; le **rendu PDF→image** (le cas échéant) est une préoccupation d'implémentation OCR — si non couvert par le provider actuel, le documenter comme **limite connue** (extraction best-effort ou rendu page 1) ; ne pas faire échouer le pipeline.
- **Coût OCR au rejeu.** Le **pré-contrôle `ProcessedEvent`** évite de ré-OCRiser une pièce déjà traitée (l'OCR est l'opération la plus lourde). En cas de course (2 livraisons quasi simultanées du même `eventId`), les deux peuvent OCRiser mais **une seule** commit le marqueur (E11000) — surcoût rare accepté, **jamais** de double effet.
- **Taille de pièce.** `getObject` bufferise l'objet **entier** en mémoire (constat différé de `/code-review` STORY-041). Pièces KYC ≤ 10 Mo (borne PRD) → acceptable ; une **garde de taille** (via `statObject` avant `getObject`) est une amélioration possible (non bloquante).
- **Ordre inter-événements.** Pour un même `orgId` (clé de partition), l'ordre est garanti ; `kyc.document.uploaded` précède le `kyc.status.changed` corrélé (STORY-040) — sans impact ici (`document-service` ne consomme pas `kyc.status.changed`).
- **`declared` absent.** Le contrat v1 ne porte **pas** l'identité déclarée → la comparaison de STORY-043 la résoudra via un read-model `identity.*` local. **STORY-042 ne consomme aucune valeur déclarée** ; elle ne fait qu'**extraire le lu** (voir §Additional Notes).

---

## Dependencies

**Stories prérequises :**
- **STORY-040** (kyc émet `kyc.document.uploaded` v1 + bucket `kyc-documents` peuplé) : **le contrat consommé** — *done*.
- **STORY-041** (scaffold `document-service` : `KafkaModule` client, `OcrProvider`/Tesseract, `DocumentStorageReader` MinIO lecture, base `document_service`) : **le socle branché ici** — *done*.
- **STORY-036** (`bilan-service` : `KycStatusConsumer` bootstrap + `ProcessedEvent` + projection transactionnelle + `isDuplicateKeyError`) : **patron consommateur idempotent** direct à dupliquer/adapter — *done*.
- **STORY-024** (JWKS IdP) / **STORY-022** (compose racine + Kafka/MinIO) : socle infra — *done*.

**Stories bloquées (débloquées par celle-ci) :**
- **STORY-043** (comparaison déclaré/lu + expiré/illisible → producteur `document.extrait` outbox) — étend le **même** handler (tx : marqueur + enqueue outbox) et branche le read-model `identity.*`.
- **STORY-044** (persistance `DocumentExtraction` keyée `orgId` + GET consultation) — persiste l'`ExtractedDocument` produit ici (tx commune).
- **STORY-045** (`kyc-service` consomme `document.extrait` → enrichit le dossier) — via STORY-043.
- Stories OCR **Atelier Balance** (EPIC-018/020) réutilisant le dispatch de parseurs.

**Dépendances externes :** Kafka + MinIO + Mongo (compose racine) ; **Tesseract** (`tesseract.js` WASM offline, déjà embarqué STORY-041) — **aucune** nouvelle dépendance système.

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche **`MNV-042`** (branchée depuis `dev`, **rebasée sur `origin/dev`** avant de coder — repo `prospera-ocr-service`).
- [ ] Tests unitaires écrits et verts (seuils Jest **65/90/90/90**) :
  - [ ] **Idempotence** : 1ʳᵉ livraison traite (marqueur créé) ; rejeu même `eventId` → ignoré (E11000) ; pré-contrôle évite l'OCR au rejeu.
  - [ ] **Garde-fous d'enveloppe** : corps absent / JSON invalide / `eventId` manquant / `occurredAt` invalide / `orgId` non-ObjectId / `type` inconnu / `storageKey` absent → ignoré, pas d'appel MinIO/OCR.
  - [ ] **Lecture** : `getObject` appelé avec le `storageKey` exact ; aucune méthode d'écriture atteignable.
  - [ ] **OCR pluggable** : `FakeOcrProvider` substitué → orchestration + parseurs inchangés ; `extract` appelé avec `lang` par défaut.
  - [ ] **Parseurs** : dispatch RCCM/CFE correct ; champs attendus extraits de textes d'exemple ; texte non reconnu → champs absents (pas d'exception).
  - [ ] **Robustesse** : erreur transitoire → propagée (rejeu) ; faible confiance → marqué traité ; `NoSuchKey` → ignoré.
- [ ] Tests e2e / docker verts :
  - [ ] Dépôt RCCM + CFE (kyc) → 2 extractions tracées + 2 marqueurs `ProcessedEvent` ; **aucun** `document.extrait`, **aucun** statut KYC touché.
  - [ ] Rejeu (`fromBeginning` / restart) → **aucun** doublon.
  - [ ] Message malformé → ignoré (warn), partition saine.
- [ ] ESLint **0 warning** ; build image `runtime` OK.
- [ ] **Vérification docker bout-en-bout** réalisée et consignée en §Revue & validation (stack auth+kyc+document ; consumer réel ; idempotence prouvée par rejeu ; poison-pill toléré).
- [ ] CI verte (matrice 6 services ; nouveau code couvert en unitaire, broker/minio non requis en CI).
- [ ] `/code-review` passé (constats traités ou tracés pour 043/044).
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR **`MNV-042(document-service): …`** ouverte puis intégrée sur `dev` en **« Rebase and merge »** ; branche supprimée après merge.
- [ ] `sprint-status.yaml` mis à jour (STORY-042 → done, note de vérification + `completed_date`).

---

## Story Points Breakdown

- **Backend (consumer + idempotence) :** 2 points (bootstrap Kafka tolérant à la panne + groupe `document-ocr` + `ProcessedEvent` transactionnel + garde-fous poison-pill — duplication guidée du patron `bilan-service`).
- **OCR pipeline + parseurs :** 2 points (orchestration lecture→OCR→parse hors tx + `RccmParser`/`CfeParser` + dispatch + `ExtractedDocument` + traçage sans PII).
- **Frontend :** 0 point.
- **Testing :** 1 point (unit idempotence/garde-fous/parseurs + e2e docker consumer réel + rejeu).
- **Total :** 5 points.

**Rationale :** le patron consommateur idempotent est **déjà éprouvé** (`bilan-service`) et les briques OCR/MinIO **déjà posées** (STORY-041) — la valeur ajoutée est le **branchement du pipeline réel** + le **parsing RCCM/CFE** (nouveau code métier) + la **robustesse at-least-once** (poison-pill, coût OCR au rejeu). La complexité de comparaison/émission/persistance est reportée sur STORY-043/044.

---

## Additional Notes

- **Invariant DO-1.** STORY-042 **ingère et reconnaît** ; elle ne **décide** rien. Aucune écriture de statut KYC, aucun appel vers `kyc-service`. L'assistance à la revue (via `document.extrait`) est **émise en STORY-043**, consommée par `kyc-service` en **STORY-045**, affichée par `admin-panel` (flux A).
- **Point de coordination `declared` (STORY-042/043) — tranché ici.** `kyc.document.uploaded` v1 **ne porte pas** l'identité déclarée (kyc ne la possède plus depuis le cutover STORY-030). **Décision :** STORY-042 **n'a pas besoin** du `declared` — elle n'extrait que **le lu** (`ExtractedFields`). La résolution « déclaré ↔ lu » est **entièrement** portée par **STORY-043**, via un **read-model `identity.*`** local à `document-service` (projection d'événements d'identité d'`auth-service`), **ou** une lecture dédiée — à câbler en 043. Ce cadrage **découple proprement** l'ingestion/reconnaissance (042) de la comparaison (043).
- **Frontière STORY-042 (résolue).** Persistance = **044**, émission `document.extrait` = **043**, comparaison/flags = **043**. STORY-042 persiste **uniquement** le marqueur `ProcessedEvent` et **trace** l'`ExtractedDocument` (log structuré) comme preuve observable. Choix assumé pour une tranche **INVEST** (indépendante, testable, sans double emploi avec 043/044) : le **même** handler transactionnel sera **étendu** (et non réécrit) par 043/044, gardant marqueur + effet métier **atomiques**.
- **Duplication assumée (K4).** Contrat consommé, enum `KycDocumentType`, `ProcessedEvent`, `isDuplicateKeyError` sont **copiés** (pas de lib partagée en phase 1) ; `schemaVersion` et les documents d'architecture bornent la dérive. Factorisation en lib différée (règle « au 3ᵉ usage »).
- **Extensibilité.** Le dispatch de parseurs est la **fondation** de l'OCR structuré PROSPERA : les futurs types (Statuts, factures, captures — Atelier Balance EPIC-018/020) ajoutent un parseur sans toucher au consumer ni à l'`OcrProvider`.

---

## Progress Tracking

**Status History :**
- 2026-07-15 : Créée par Scrum Master (BMAD create-story)
- 2026-07-15 : Implémentée + vérifiée docker + `/code-review` (3 constats corrigés) par Claude (BMAD dev-story)

**Actual Effort :** ~5 points (conforme à l'estimation)

---

## Revue & validation

### Implémentation

Pipeline d'ingestion OCR branché sur le scaffold STORY-041, en **calquant le patron consommateur idempotent de `bilan-service`** (STORY-036) adapté à un traitement coûteux non transactionnel.

- **Contrat consommé dupliqué** : `common/enums/kyc-document-type.enum.ts` (RCCM|CFE) + `kafka/events/kyc-document-events.ts` (`KYC_DOCUMENT_UPLOADED_TOPIC` + `KycDocumentUploadedEventV1` copie fidèle du contrat v1, sans dépendance de code vers `kyc-service`).
- **Consommateur** : `modules/extraction/kyc-document-uploaded.consumer.bootstrap.ts` — `kafka.consumer({ groupId: 'document-ocr' })`, `subscribe(fromBeginning:true)`, `run(eachMessage)`. **Tolérant à la panne** (retry `setInterval().unref()`, `disconnect()` en `onModuleDestroy`), I/O seulement (exclu de couverture `*bootstrap*`).
- **Idempotence** : `schemas/processed-event.schema.ts` (`eventId` unique, TTL 30 j) + `duplicate-key.util.ts` (`isDuplicateKeyError`) dupliqués de `bilan-service`. `ExtractionService` : **pré-contrôle** `exists` (évite le ré-OCR au rejeu) → lecture MinIO + OCR + parsing **hors** transaction → **transaction** insérant le marqueur (E11000 → skip). 043/044 étendront cette transaction (outbox + `DocumentExtraction`).
- **Extraction structurée** : `modules/extraction/parsers/` — `DocumentFieldParser` (abstraction) + `DocumentParserRegistry` (dispatch sur `type` via factory multi-provider `DOCUMENT_FIELD_PARSERS`) + `RccmParser`/`CfeParser` (heuristiques regex sur texte OCR normalisé : n° RCCM/CFE, dénomination, forme juridique, NIF/IFU, dates → ISO). Chaque champ non reconnu = `undefined`, jamais d'exception. `parse-utils.ts` factorise normalisation/date.
- **Orchestration** `ExtractionService` : validation d'enveloppe (poison-pill), `DocumentStorageReader.getObject(storageKey)` (lecture seule), `OcrProvider.extract(buffer, {lang:'fra'})`, parsing, marqueur transactionnel, **traçage** du résumé (`documentId`/`type`/clés de champs/`confidence`/`provider` — **jamais** de binaire ni de texte OCR/PII). **Aucune** persistance `DocumentExtraction` (STORY-044), **aucun** `document.extrait` (STORY-043), **aucune** écriture de statut KYC (**DO-1**).
- **Câblage** : `ExtractionModule` importé dans `app.module.ts` ; `KafkaConfig.groupId` (`KAFKA_GROUP_ID`, défaut `document-ocr`) ajouté (config + env.validation + bloc compose racine `document-service`).

### Qualité

- **ESLint** : 0 warning (`--max-warnings 0`).
- **Tests unitaires** : **130 tests / 24 suites** verts. **Couverture 99.27 % stmts / 90.66 % branches / 98.97 % funcs / 99.2 % lines** (seuils 65/90/90/90 tenus) ; `extraction.service.ts` **100 %**. Couvre : garde-fous d'enveloppe (corps absent/JSON illisible/**corps non-objet**/eventId/occurredAt/orgId/type/storageKey), idempotence (pré-contrôle + course E11000), robustesse (NoSuchKey→skip, transitoire→propagé, **NoSuchBucket→propagé**), pluggabilité `FakeOcrProvider`, parseurs RCCM/CFE + registre + `parse-utils`.
- **E2E** : **13 tests / 4 suites** verts — dont `test/extraction.e2e-spec.ts` (graphe d'extraction réel : consomme, dédduplique au rejeu, dispatch RCCM/CFE, malformé ignoré).

### /code-review (high) & corrections

`/code-review` (high) sur le diff → **3 constats, tous corrigés** :
1. **(correctness, HIGH)** Corps JSON valide mais **non-objet** (`null`) : `payload.eventId` levait une `TypeError` **hors** du `try` de parse → propagée hors de `consume` → **crash du consommateur** (`KafkaJSNonRetriableError`, vérifié en docker) / blocage de partition. **Corrigé** : garde `typeof parsed !== 'object' || null || Array.isArray` après `JSON.parse` → message ignoré (warn). +3 tests.
2. **(correctness, MEDIUM)** `NoSuchBucket` figurait dans `MISSING_OBJECT_CODES` → une **mauvaise config de bucket** aurait fait ignorer (perdre) **silencieusement** toutes les pièces. **Corrigé** : `NoSuchBucket` **retiré** du jeu « objet absent » → l'erreur se propage (rejeu Kafka, panne visible). +1 test.
3. **(clarté, LOW)** Log « storageKey absent » trompeur (la clé est présente, c'est l'objet qui manque). **Corrigé** : message reformulé « objet '<storageKey>' absent dans MinIO ».

### Vérification docker bout-en-bout (2026-07-15)

Stack `mongo` (rs0) + `kafka` + `minio` + `auth-service:3001` + `kyc-service:3002` + `document-service:3006` (override `base`, hot-reload) — 3 apps `healthy` :

- **Consommateur** : `document-ocr` rejoint le groupe (partition `kyc.document.uploaded[0]` assignée) **après retry** (broker transitoirement indisponible au boot → boot HTTP non bloqué — tolérance panne prouvée). `/health` = **200** (mongo + kafka + minio `kyc-documents`).
- **Dépôt RCCM + CFE** (register → verify Mailhog → login IdP, `aud` incl. `kyc-service`+`document-service` ; `POST /kyc/documents` 201×2) → `document-service` **consomme** 2 événements : lecture pièce MinIO → OCR **tesseract** (confidence 90) → parsing → **2 logs d'extraction** (`champs=[]` car `sample.png` n'est pas une vraie pièce RCCM/CFE — best-effort correct) → **2 marqueurs `ProcessedEvent`** en base `document_service`. Topic offset `0:2` confirmé. **Aucun** `document.extrait`, **aucun** statut KYC touché.
- **Rejeu** (offset du groupe remis à `earliest`, redémarrage) : les 2 événements re-livrés sont **ignorés via le pré-contrôle** (`déjà traité`), **aucun ré-OCR**, marqueurs restés à **2** — exactement-une-fois effective prouvée.
- **Poison-pill** : 4 messages malformés (JSON illisible, `type` inconnu, `storageKey` vide, `orgId` non-ObjectId) → tous **ignorés** (warn ciblé), aucun marqueur, **partition saine** ; un dépôt valide ultérieur est traité normalement (marqueur +1).
- **Constat #1 vérifié en conditions réelles** : un corps `null` publié a bien **crashé le consommateur** (code d'origine) ; après correction (redémarrage), les corps `null`/`123`/`["a","b"]` sont **ignorés proprement** (« corps non-objet — ignoré »), le consommateur reste vivant et un dépôt valide suivant est traité (marqueurs = 4).

### Intégration

Repo **`prospera-ocr-service`** (branche `MNV-042` depuis `dev`, rebasée sur `origin/dev`). PR **`MNV-042(document-service): …` → `dev` en « Rebase and merge »**, branche supprimée. *(Le bloc `KAFKA_GROUP_ID` du `docker-compose.yml` racine est une mise à jour d'orchestration locale hors repo service, comme STORY-041 ; sans impact — la config a un défaut `document-ocr`.)*

### Points d'attention

- **`champs=[]` en vérif docker** : `sample.png` (asset de smoke STORY-041) n'est pas une vraie pièce RCCM/CFE → aucun champ reconnu (comportement best-effort correct). L'exactitude du *parsing* sur de vrais libellés RCCM/CFE est couverte par les **tests unitaires** (`rccm.parser.spec`/`cfe.parser.spec`).
- **Heuristiques de parsing** volontairement simples (regex sur libellés) — à affiner sur pièces OHADA réelles ; la comparaison déclaré/lu et les seuils « expiré/illisible » sont **STORY-043**.
- **`declared` absent** du contrat v1 : cadré ici, **résolu en STORY-043** via read-model `identity.*`. STORY-042 n'extrait que « le lu ».

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
