# STORY-045 : `kyc-service` — **consommer `document.extrait`** → **enrichir le dossier de revue KYC** (l'OCR **assiste**, il ne **décide** jamais)

**Epic :** EPIC-015 — Chaîne KYC / OCR : l'OCR **assiste** la revue humaine, il ne **décide** jamais (invariant **DO-1**)
**Réf. architecture :** `architecture-kyc-service-2026-07-03.md` §« Contrat d'événements `kyc.document.uploaded` (v1) — **Point de coordination `declared`** » (la comparaison est résolue **en aval** ; `kyc-service` reste **producteur pur** — jusqu'ici), §« AdminKycController (revue globale, FR-006) », §« Schéma `TenantKycProfile` » · `tech-spec-document-service-2026-07-10.md` §Contrats d'événements `document.extrait` (contrat **consommé** ici) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Contrats d'événements (Kafka, at-least-once, idempotence par marqueur, état absolu) · **patron read-model idempotent** `bilan-service` STORY-036 / `document-service` STORY-043 (`*Consumer` bootstrap tolérant à la panne + `ProcessedEvent` + projection transactionnelle) · **contrat produit** `document-service` STORY-043 (`DocumentExtraitEventV1`) · **revue admin** `kyc-service` STORY-013 (`KycAdminService.getDetail` + `AdminKycDetailDto`/`AdminKycDocumentDto`) · décisions programme **AD-2** (chaîne KYC en 2 flux) + **DO-1** (l'OCR propose, l'humain décide)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-15. `kyc-service` devient son **premier consommateur Kafka** (jusqu'ici producteur pur) : `DocumentExtraitConsumer` (group `kyc-document-extract`, bootstrap tolérant panne) → projection idempotente `DocumentExtractionAssist` (keyée `documentId`, **`minimize:false`**, marqueur `ProcessedEvent` **+** upsert **dans une seule transaction**) → enrichissement de `KycAdminService.getDetail` (jointure par `documentId` → `extraction?` + `ocrSummary`). **Invariant DO-1 strict** : aucune écriture/transition de statut. lint 0, **175 unit (30 suites) + 39 e2e** ; `/code-review` (high) : **0 bug**, 2 constats LOW différés. Intégré : PR **#3 `MNV-045(kyc-service)` mergée « Rebase and merge » sur `dev`** (HEAD `9268877`), branche supprimée. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-15
**Sprint :** 9
**Service :** kyc-service (`:3002`, base `kyc_service`) — *relying party* pur (STORY-030), **producteur** `kyc.status.changed` (STORY-021) + `kyc.document.uploaded` (STORY-040). **Cette story fait de `kyc-service` son premier _consommateur_ Kafka** (jusqu'ici producteur pur).
**Couvre :** aucun FR fonctionnel direct (capacité transverse : porter l'assistance OCR jusqu'à la revue humaine ; décisions **AD-2 / DO-1**) — **cinquième et dernier maillon** du pipeline EPIC-015 (STORY-042 → 043 → 044 → **045**) : c'est la story qui **referme la boucle côté KYC**, en **rapatriant** l'assistance produite par `document-service` (`document.extrait`) **dans le dossier que l'humain relit** (`GET /admin/kyc/:orgId`).

> **Cinquième story de la chaîne EPIC-015 (flux B du Module 0), et son point de jonction avec le flux A (revue humaine).** STORY-040 a fait de `kyc-service` le **producteur** de `kyc.document.uploaded`. STORY-041→044 ont construit `document-service` : scaffold + OCR (041), consumer idempotent + extraction RCCM/CFE (042), comparaison déclaré↔lu + drapeaux → **producteur `document.extrait`** (043), persistance `DocumentExtraction` + `GET` (044). Il manque le **dernier maillon** : que l'**assistance** (le lu, le déclaré, les écarts, les drapeaux) **remonte jusqu'à l'écran de revue**. STORY-045 branche ce maillon : `kyc-service` **consomme** `document.extrait` (son **premier consommateur**), **projette** l'assistance dans un read-model local (keyé `documentId`, scopé `orgId`), et **enrichit** le détail de revue admin (STORY-013) — chaque pièce du dossier porte désormais ses **signaux OCR**. **Invariant DO-1 strict :** la consommation **n'écrit jamais** le statut KYC, ne déclenche **aucune** transition, n'auto-approuve/rejette **rien** : elle **affiche des signaux**, l'humain **décide**.

---

## User Story

En tant que **super-administrateur PROSPERA (revue KYC globale)**,
je veux que, lorsqu'une pièce déposée par un cabinet a été analysée par l'OCR (`document-service` publie `document.extrait`), `kyc-service` **rapatrie cette assistance** — champs lus, valeurs déclarées, écarts détectés, drapeaux « illisible / expiré », niveau de confiance — et **l'affiche à côté de chaque pièce** dans le dossier de revue (`GET /admin/kyc/:orgId`),
afin que je **statue plus vite et plus sûrement** (approuver / rejeter) en voyant d'un coup d'œil ce que l'OCR a lu et **où ça diverge du déclaré** — sans jamais que l'OCR ne **décide** à ma place : les signaux **éclairent** ma revue, ils ne changent **jamais** le statut (invariant **DO-1**).

---

## Description

### Contexte

La chaîne KYC de PROSPERA est structurée en **deux flux** (décision **AD-2**) : le **flux A** (revue humaine — `kyc-service` STORY-013 aujourd'hui, `admin-panel` EPIC-016 demain) et le **flux B** (assistance OCR — `document-service`, EPIC-015). L'invariant **DO-1** est strict : **l'OCR propose, l'humain décide**. Le flux B est **complet côté production du signal** : dès qu'une pièce est déposée, `document-service` la lit (MinIO), l'OCR-ise, en extrait les champs (RCCM/CFE), **résout le déclaré** (read-model `identity.*`), **compare** (écarts), **calcule les drapeaux** (illisible/expiré) et **publie `document.extrait`** de façon fiable (outbox transactionnel, STORY-043) — puis **persiste** l'extraction et l'expose en `GET` côté `document-service` (STORY-044).

Mais ce signal ne **remonte pas encore** jusqu'au **dossier que l'humain relit**. Le point de coordination `declared` de l'architecture kyc (`architecture-kyc-service` §`kyc.document.uploaded`) a explicitement tranché : `kyc-service` **ne possède plus l'identité** (cutover *relying party*, STORY-030), la comparaison est faite **en aval** par `document-service`, et « `kyc-service` reste **producteur pur** — invariant DO-1 ». STORY-045 **fait évoluer** ce point : `kyc-service` devient **aussi consommateur** — non pour **décider**, mais pour **rapatrier l'assistance** et l'**afficher**. Le statut KYC reste **exclusivement** piloté par l'humain (`approve`/`reject`, STORY-013).

STORY-045 branche **trois briques**, sans réécrire STORY-013 ni STORY-040 :

1. **Premier consommateur Kafka de `kyc-service`.** Le service n'a jusqu'ici qu'un **producteur** (`KafkaProducerService` + outbox `kyc.status.changed`/`kyc.document.uploaded`). STORY-045 introduit un **consommateur** de `document.extrait` (groupe **dédié `kyc-document-extract`**, `fromBeginning:true`, **bootstrap tolérant à la panne** — broker indisponible au boot ne fait **jamais** échouer le démarrage HTTP), calqué sur le patron read-model idempotent de `bilan-service` STORY-036 / `document-service` STORY-043. Idempotence par marqueur `ProcessedEvent { eventId }` (première collection de déduplication _entrante_ du service).
2. **Read-model « assistance de revue » (projection état absolu).** Une nouvelle collection `DocumentExtractionAssist` (base `kyc_service`, keyée **`documentId` unique**, portant **`orgId`** pour le scoping) projette le payload `document.extrait` en **état absolu** (`$set`), **idempotente** (marqueur + upsert **dans une seule transaction** — atomiques, exactement-une-fois effective). Schéma **`minimize:false`** (leçon STORY-043/044 : préserver `extracted:{}`/`declared:{}`, sinon Mongoose ampute les sous-objets vides du contrat).
3. **Enrichissement du dossier de revue admin.** `KycAdminService.getDetail(orgId)` (STORY-013) **joint** l'assistance (par `documentId`) et **attache** à chaque pièce (`AdminKycDocumentDto`) un sous-objet `extraction?` (lu / déclaré / écarts / drapeaux / confiance / provider). Un **résumé org** (`ocrSummary`) signale d'un coup d'œil « des écarts / une pièce illisible existent ». **Aucune** décision : c'est de l'**information** pour l'œil humain.

L'EPIC-015 se découpe en 5 stories : **STORY-041** (scaffold — *done*), **STORY-042** (consumer + OCR + extraction — *done*), **STORY-043** (comparaison + producteur `document.extrait` — *done*), **STORY-044** (persistance `DocumentExtraction` + GET — *done*), **STORY-045** (`kyc-service` consomme `document.extrait` → enrichit la revue — *cette story*). STORY-045 est la story qui **rend le flux B visible** dans le flux A : sans elle, l'OCR produit un signal que **personne ne lit** côté décision.

### Périmètre

**Dans le périmètre**

- **Contrat consommé `document.extrait` v1 (dupliqué localement — K4)** : `kafka/events/document-extrait-events.ts` — `DOCUMENT_EXTRAIT_TOPIC = 'document.extrait'` + interfaces `DocumentExtraitEventV1`, `DeclaredFields`, `FieldDiscrepancy`, `DiscrepancyKind`, `DocumentFlags`, `ExtractedFields` : **copie fidèle** du contrat **produit** par `document-service` (`kafka/events/document-events.ts`, STORY-043), **sans dépendance de code** vers `document-service` (décision **K4**, bornée par `schemaVersion` + docs d'architecture). État **absolu**, compat **BACKWARD** (P9).
- **Consommateur idempotent (premier de `kyc-service`)** : `modules/document-extract/` (nouveau) — `DocumentExtraitConsumer` (bootstrap Kafka tolérant à la panne, groupe **`kyc-document-extract`**, `subscribe([DOCUMENT_EXTRAIT_TOPIC], fromBeginning:true)`, retry `setInterval().unref()`, `disconnect` propre en `onModuleDestroy`, I/O seul → **exclu de couverture** `*consumer*`/`*bootstrap*`), validation d'enveloppe (JSON objet, champs requis) → **poison-pill ignoré** (offset avancé, `warn`, partition non bloquée), pré-contrôle `ProcessedEvent` puis projection transactionnelle.
- **Marqueur d'idempotence entrant** : `schemas/processed-event.schema.ts` — `ProcessedEvent { eventId (unique), processedAt }` (TTL 30 j), collection `processed_events` (première collection de déduplication _entrante_ ; **distincte** de l'`OutboxEvent` producteur). La déduplication est **ceinture-et-bretelles** : le marqueur `eventId` **plus** le fait que l'`eventId` de `document.extrait` est **déjà dérivé** (`${sourceEventId}:extrait`, STORY-043).
- **Read-model « assistance de revue » (projection état absolu, keyée `documentId`)** : `schemas/document-extraction-assist.schema.ts` — `DocumentExtractionAssist { documentId (unique), orgId (index), type, extracted, declared, discrepancies, flags:{expired,unreadable}, confidence, ocrProvider, occurredAt, eventId, updatedAt }`, **`@Schema({ minimize:false })`**. `DocumentExtractionAssistProjectionService` : `markProcessedAndProject(event)` — **une seule transaction** insérant `ProcessedEvent{eventId}` **puis** upsert **absolu** (`$set`, `upsert:true`) keyé `documentId` (E11000 sur le marqueur → abort → skip, aucune projection). `DocumentExtractionAssistReadModel.findByOrg(orgId)` → `Map<documentId, assist>` pour la jointure admin.
- **Enrichissement de la revue admin (extension `KycAdminService.getDetail`, pas de réécriture)** : après la construction des `AdminKycDocumentDto` (STORY-013), résoudre `assistByDoc = readModel.findByOrg(orgId)` → attacher à chaque pièce son `extraction?` (par `documentId`) → construire un `ocrSummary` org (`{ hasDiscrepancies, anyUnreadable, anyExpired, extractedCount }`). DTO structuré `AdminKycExtractionDto` (lu / déclaré / écarts / drapeaux / confiance / provider / `occurredAt`) — **sans** binaire ni texte OCR intégral. `AdminKycDocumentDto.extraction?` **optionnel** : `undefined` tant que l'OCR n'a pas (encore) traité la pièce — **dégradation gracieuse** (voir §Cas limites).
- **Câblage & configuration** : `DocumentExtractModule` importé dans `app.module.ts` ; `KafkaModule` reste inchangé (le **client** `KAFKA_CLIENT` existant sert à créer le `consumer`, comme le producteur) ; `configuration.ts`/`env.validation.ts` étendus (`KAFKA_DOCUMENT_EXTRACT_GROUP_ID` défaut `kyc-document-extract` — optionnel). Bloc `kyc-service` du `docker-compose.yml` **racine** + override reçoivent la variable (⚠️ édition `.env*` bloquée en sandbox — cf. STORY-041→044 : le compose fournit tout via `environment:`, impact nul, à tracer). **Aucun** nouveau service d'infra (Mongo/Kafka déjà présents). `/health` inchangé.
- **Tests** : unitaires (projection idempotente état absolu ; marqueur + upsert **dans** la tx ; E11000 rejeu → skip ; **DO-1 : consommer un `document.extrait` (illisible + écarts) ne change PAS `TenantKycProfile.status`** ; enrichissement admin : jointure par `documentId`, pièce **sans** assistance → `extraction: undefined`, `ocrSummary` correct ; poison-pill ignoré ; forme du contrat dupliqué) + e2e docker (chaîne réelle : dépôt RCCM/CFE → `document-service` publie `document.extrait` → `kyc-service` consomme → `GET /admin/kyc/:orgId` **montre** les extractions avec écarts + drapeaux ; rejeu **sans** double effet ; **statut KYC inchangé**). Seuils Jest du service (**65/90/90/90**).

**Hors périmètre (stories suivantes ou décisions figées)**

- **Toute écriture / transition du statut KYC déclenchée par l'OCR** — invariant **DO-1** strict : la consommation de `document.extrait` **n'appelle jamais** `KycStatusService`, ne fait **aucune** transition, n'auto-approuve/rejette **rien**. Le statut reste piloté par l'humain (`approve`/`reject`, STORY-013). C'est le **cœur** de la story.
- **Vue agrégée & actions côté `admin-panel`** (BFF EPIC-016) : STORY-047 (vue agrégée orgs) **lira** l'enrichissement exposé ici via l'API admin de `kyc-service` ; STORY-048 (actions proxifiées) portera l'approbation. STORY-045 se limite à **produire l'enrichissement** dans l'API `kyc-service` (flux A backend).
- **Projection des extractions dans la liste `GET /admin/kyc/pending`** (au-delà du détail) : v1 **différée** — l'assistance est jointe dans le **détail** (`getDetail`), suffisant pour la décision. Un compteur de signaux dans l'item de file (`hasOcrSignals`) est **extensible** sans rupture (jointure déjà en place). *(Voir §Additional Notes.)*
- **Ré-appel synchrone du `GET /documents/:documentId/extraction` de `document-service` (STORY-044)** : **écarté** — l'assistance arrive par **événement** (découplage, cohérence éventuelle, pas d'appel réseau par requête de revue), conformément au patron read-model de l'écosystème. Le `GET` de `document-service` reste une consultation **directe** (audit/debug), pas la source de la revue kyc.
- **Historisation / versionning de l'assistance par `version` de pièce** : v1 keye par `documentId` (unique par pièce/version, STORY-040). Une pièce re-uploadée porte un **nouveau** `documentId` ⇒ nouvelle assistance ; l'ancienne devient orpheline (tolérée, cf. §Cas limites). Pas de collection d'historique dédiée en v1.
- **Extensions du contrat comparé** (nouveaux champs, règles d'échéance riches, fuzzy) → portées par `document-service` (le **producteur**) ; `kyc-service` **suit** le contrat en état absolu sans changement (BACKWARD).

### Flux (mise en route)

1. Stack docker complète (`mongo` rs0, `kafka`, `minio`, `mailhog`, `auth-service:3001`, `kyc-service:3002`, `document-service:3006`). Au boot, `kyc-service` ouvre — **en plus** de son relais outbox producteur (STORY-021/040) — un **consommateur** `document.extrait` (groupe `kyc-document-extract`). Broker indisponible → boot HTTP **quand même** OK, re-tentatives en tâche de fond (tolérance panne).
2. Un cabinet s'inscrit/se connecte (`auth-service`) puis dépose RCCM puis CFE (`POST :3002/kyc/documents`). `kyc-service` crée les `KycDocument`, publie `kyc.document.uploaded` (outbox, STORY-040), et bascule en `UNDER_REVIEW` quand les deux pièces sont présentes (`kyc.status.changed`).
3. `document-service` **consomme** `kyc.document.uploaded` (STORY-042) → lecture MinIO → OCR → extraction → résolution du déclaré → comparaison + drapeaux → **publie `document.extrait`** (outbox, STORY-043) + persiste (STORY-044). Clé de partition = `orgId`, `eventId` dérivé `${…}:extrait`.
4. `kyc-service` **consomme** `document.extrait` (**nouveau**, STORY-045) : valide l'enveloppe → pré-contrôle `ProcessedEvent{eventId}` → **transaction** : `ProcessedEvent{eventId}` + upsert **absolu** `DocumentExtractionAssist` keyé `documentId` → commit. **Aucune** transition de statut (DO-1).
5. Le super-admin ouvre le dossier (`GET :3002/admin/kyc/:orgId`, `@Roles PLATFORM_ADMIN`, STORY-013) → le détail liste les pièces **enrichies** : chaque `AdminKycDocumentDto` porte son `extraction` (lu / déclaré / écarts / drapeaux / confiance) + un `ocrSummary` org. Il **décide** (approve/reject) — la décision reste **son** acte (transition explicite, STORY-013).
6. **Rejeu** (même `eventId` `document.extrait` re-livré) → pré-contrôle **ou** E11000 sur le marqueur ⇒ **ignoré**, **aucune** double projection (exactement-une-fois effective).
7. **OCR pas encore passé** (course dépôt→OCR : la pièce existe mais `document.extrait` n'est pas encore arrivé) → le détail renvoie la pièce **sans** `extraction` (`undefined`), `ocrSummary.extractedCount < documents.length` — **jamais** de blocage, jamais d'erreur ; l'assistance s'affiche dès qu'elle arrive (cohérence éventuelle).
8. **Message malformé** (enveloppe invalide) → **ignoré** (offset avancé, `warn`), **partition non bloquée**. Une pièce **illisible** (`flags.unreadable=true`) **n'est pas** un poison-pill : elle est projetée normalement (l'assistance **signale** l'illisibilité, l'humain relira l'URL présignée).
9. **Aucun** statut KYC touché par l'OCR (DO-1). Le statut ne change **que** par `approve`/`reject` humain (STORY-013).

---

## Acceptance Criteria

- [ ] **Consommateur `document.extrait` (premier consommateur de `kyc-service`, idempotent, tolérant à la panne)** : `kyc-service` **consomme** `document.extrait` (groupe **dédié `kyc-document-extract`**, `fromBeginning:true`) ; le bootstrap est **tolérant à la panne** (broker indisponible au boot ne fait **jamais** échouer le démarrage HTTP, re-tentatives en tâche de fond). Contrat consommé **dupliqué fidèlement** (`document-extrait-events.ts`), **aucune** dépendance de code vers `document-service`. **Test** : un `document.extrait` valide est consommé et projeté ; un rejeu du même `eventId` est ignoré (marqueur / E11000).
- [ ] **Projection « assistance de revue » (état absolu, keyée `documentId`, idempotente, transactionnelle)** : le payload est projeté dans `DocumentExtractionAssist { documentId (unique), orgId, type, extracted, declared, discrepancies, flags, confidence, ocrProvider, occurredAt, eventId }` en **état absolu** (`$set`, upsert keyé `documentId`), **dans la même transaction** que le marqueur `ProcessedEvent{eventId}` (marqueur + projection **atomiques**). Schéma **`minimize:false`** (préserve `extracted:{}`/`declared:{}`). **Test** : `commit` crée marqueur **et** document projeté ; `abort` (E11000 rejeu) n'en crée **aucun** ; une seconde livraison du même `documentId` avec un payload à jour **remplace** l'état (idempotent, rejouable) ; un sous-objet vide (`extracted:{}`) est **conservé**.
- [ ] **Enrichissement du détail de revue admin (DO-1 : information, pas décision)** : `GET /admin/kyc/:orgId` (`@Roles PLATFORM_ADMIN`, STORY-013) renvoie chaque pièce enrichie d'un `extraction?` (`AdminKycExtractionDto` : `extracted`, `declared`, `discrepancies`, `flags`, `confidence`, `ocrProvider`, `occurredAt`) **joint par `documentId`**, **plus** un `ocrSummary` org (`{ hasDiscrepancies, anyUnreadable, anyExpired, extractedCount }`). **Aucune** `storageKey`, **aucun** binaire, **aucun** texte OCR intégral exposés. **Test** : le détail joint la bonne assistance à la bonne pièce (par `documentId`) ; `ocrSummary` reflète les écarts/drapeaux présents.
- [ ] **Dégradation gracieuse (OCR pas encore passé)** : une pièce **sans** assistance projetée (course dépôt→OCR) apparaît dans le détail **sans** `extraction` (`undefined`), **sans** erreur ni blocage ; `ocrSummary.extractedCount` reflète le nombre réellement enrichi. **Test** : org avec 2 pièces et 1 seule assistance ⇒ 1 pièce enrichie, 1 pièce `extraction: undefined`, `extractedCount = 1`.
- [ ] **Invariant DO-1 strict (cœur de la story)** : la consommation de `document.extrait` **n'écrit jamais** le statut KYC, ne déclenche **aucune** transition, n'appelle **jamais** `KycStatusService` ni aucune écriture de `TenantKycProfile.status`. Un `document.extrait` avec `flags.unreadable=true` et des `discrepancies` **ne modifie pas** le statut. **Test** : après consommation d'un événement « illisible + écarts », `TenantKycProfile.status` est **inchangé** ; le handler n'invoque aucun service de transition.
- [ ] **Exactement-une-fois effective (projection)** : un **rejeu** du même `document.extrait` (même `eventId`) ⇒ **aucune** double projection (pré-contrôle + E11000). L'`eventId` étant **déjà dérivé** en amont (`${…}:extrait`, STORY-043), la déduplication est ceinture-et-bretelles. **Test** : deux livraisons du même `eventId` ⇒ un seul marqueur, un seul état projeté.
- [ ] **Robustesse (non-blocage de partition)** : une enveloppe **structurellement invalide** (JSON non-objet, champ requis manquant) est **ignorée** (offset avancé, `warn`, partition saine) ; une pièce **illisible** (`unreadable=true`) **est projetée** (elle n'est **jamais** transformée en message ignoré) ; une erreur **transitoire** (Mongo/réseau) **se propage** (rejeu Kafka) — jamais de perte silencieuse. **Test** : 4 malformés ignorés (partition saine) ; illisible ⇒ projeté avec drapeau ; transitoire ⇒ rejeu.
- [ ] **Extension sans réécriture (STORY-013/040 préservées)** : `KycAdminService.getDetail` est **étendu** (jointure + `ocrSummary`), pas réécrit ; `KycStatusService`, l'outbox producteur (STORY-040) et le flux d'upload sont **intacts**. `KafkaModule` réutilise le `KAFKA_CLIENT` existant pour créer le consommateur. **Test** : les e2e admin existants (STORY-013) restent verts (approve/reject/404/409/RBAC inchangés).
- [ ] **Câblage & configuration** : `DocumentExtractModule` importé ; `KAFKA_DOCUMENT_EXTRACT_GROUP_ID` validé (défaut fourni, non requis au boot) ; bloc compose racine `kyc-service` + override mis à jour. **Aucun** nouveau service d'infra ; `/health` inchangé (mongo + kafka + minio).
- [ ] **CI** verte (matrice services inchangée ; nouveau code métier couvert en **unitaire** avec Kafka/Mongo **mockés** — aucun broker réel requis en CI ; consommateur/projection réels éprouvés en **vérif docker**). Lint **0 warning**, seuils Jest tenus.
- [ ] **Vérification docker bout-en-bout** : stack `mongo`+`kafka`+`minio`+`mailhog`+`auth`+`kyc`+`document` ; `register`/`verify`/`login` (auth) → **dépôt RCCM puis CFE** (kyc) → `document-service` **publie 2 `document.extrait`** → `kyc-service` **consomme** et **projette** 2 `DocumentExtractionAssist` (keyées `documentId`) → `GET /admin/kyc/:orgId` (token `PLATFORM_ADMIN`) **montre** 2 pièces **enrichies** (`extraction` avec `declared`/`discrepancies`/`flags`/`confidence`) + `ocrSummary`. **Rejeu** (`fromBeginning`/restart) ⇒ **aucune** double projection. **Statut KYC inchangé** par l'OCR (ne bascule que par `approve`/`reject` humain).

---

## Technical Notes

### Composants

- **Backend :** `kyc-service` (`:3002`, base `kyc_service`) — ajout d'un `modules/document-extract/` (consommateur + projection + read-model + schémas), extension de `modules/kyc/` (jointure d'enrichissement dans `KycAdminService.getDetail` + DTOs), extension **minimale** du `KafkaModule` (le consommateur utilise le `KAFKA_CLIENT` **déjà** exporté ; aucun nouveau provider Kafka de bas niveau requis).
- **Frontend :** aucun (la revue = API admin `kyc-service`, lue par `admin-panel` EPIC-016 en STORY-047).
- **Base de données :** Mongo `kyc_service` — **2 collections ajoutées** : `document_extraction_assists` (read-model d'assistance) et `processed_events` (idempotence **entrante**, distincte de `outbox_events` producteur). `TenantKycProfile` / `KycDocument` **inchangés**.
- **Bus :** Kafka — **consomme** `document.extrait` (**nouveau** groupe `kyc-document-extract`) ; **continue de produire** `kyc.status.changed` + `kyc.document.uploaded` (outbox, inchangé). `kyc-service` devient **producteur _et_ consommateur**.
- **Stockage :** MinIO **inchangé** (les URLs présignées de revue restent gérées par `StorageService`, STORY-013).

### Arborescence (ajouts sur l'existant kyc-service)

```
kyc-service/src/
├── kafka/
│   ├── kafka.module.ts                         # (inchangé) KAFKA_CLIENT + KafkaProducerService déjà exportés
│   └── events/
│       └── document-extrait-events.ts          # NEW — DOCUMENT_EXTRAIT_TOPIC + DocumentExtraitEventV1 (copie contrat produit STORY-043, K4)
├── modules/document-extract/                    # NEW module (premier consommateur du service)
│   ├── document-extract.module.ts              # NEW — consumer + projection + read-model + schémas
│   ├── document-extrait.consumer.ts            # NEW — bootstrap Kafka tolérant panne (groupe kyc-document-extract) — EXCLU couverture
│   ├── document-extraction-assist.projection.service.ts  # NEW — markProcessedAndProject : marqueur + upsert absolu (une tx)
│   ├── document-extraction-assist.read-model.ts # NEW — findByOrg(orgId) → Map<documentId, assist>
│   └── schemas/
│       ├── document-extraction-assist.schema.ts # NEW — { documentId unique, orgId, …payload }  @Schema({ minimize:false })
│       └── processed-event.schema.ts            # NEW — { eventId unique, processedAt } TTL 30 j (idempotence entrante)
├── modules/kyc/
│   ├── kyc-admin.service.ts                     # EXT — getDetail : jointure assistance (findByOrg) + ocrSummary
│   └── dto/
│       ├── admin-kyc-document.dto.ts            # EXT — + extraction?: AdminKycExtractionDto
│       ├── admin-kyc-detail.dto.ts              # EXT — + ocrSummary?: AdminKycOcrSummaryDto
│       └── admin-kyc-extraction.dto.ts          # NEW — AdminKycExtractionDto + AdminKycOcrSummaryDto (structurés, sans PII brute)
├── config/
│   ├── configuration.ts                         # + kafka.documentExtractGroupId (défaut 'kyc-document-extract')
│   └── env.validation.ts                        # + KAFKA_DOCUMENT_EXTRACT_GROUP_ID (optionnel)
└── app.module.ts                                # + DocumentExtractModule
```

> Les modules `kyc` (documents, statut, admin), `storage`, `common`, l'outbox producteur (STORY-013/021/030/040) sont **réutilisés tels quels**. STORY-045 **greffe** un module consommateur + une jointure de lecture ; elle ne touche **ni** la machine à états, **ni** l'outbox producteur, **ni** le flux d'upload.

### Contrat consommé `document.extrait` v1 (`document-extrait-events.ts`) — copie fidèle du producteur (STORY-043)

```ts
export const DOCUMENT_EXTRAIT_TOPIC = 'document.extrait';

export interface ExtractedFields { [key: string]: string | undefined; } // le « lu » (RCCM/CFE), copie STORY-042
export interface DeclaredFields { denomination?: string; country?: string; } // le « déclaré » (read-model identity)
export type DiscrepancyKind = 'mismatch' | 'missing_declared' | 'missing_read';
export interface FieldDiscrepancy { field: string; declared?: string; read?: string; kind: DiscrepancyKind; }
export interface DocumentFlags { expired: boolean; unreadable: boolean; }

/** Contrat CONSOMMÉ v1 — état ABSOLU (P9 BACKWARD). Clé de partition = orgId. `eventId` déjà dérivé (`${…}:extrait`). */
export interface DocumentExtraitEventV1 {
  schemaVersion: 1;
  eventId: string;                 // dérivé en amont → dédup ceinture-et-bretelles
  orgId: string;                   // ObjectId hex — clé de partition
  documentId: string;              // ObjectId hex du KycDocument — clé du read-model
  type: string;                    // 'RCCM' | 'CFE' (KycDocumentType)
  extracted: ExtractedFields;
  declared: DeclaredFields;
  discrepancies: FieldDiscrepancy[];
  flags: DocumentFlags;
  confidence: number;
  ocrProvider: string;
  occurredAt: string;              // ISO-8601 UTC
}
```

> **Duplication K4 assumée.** Le contrat est **copié** depuis `document-service` (pas de lib partagée en phase 1). La source de vérité du contrat **produit** reste `document-service` (STORY-043) ; `kyc-service` en est un **consommateur** qui suit l'état absolu / BACKWARD. `schemaVersion` + docs d'architecture bornent la dérive.

### Read-model « assistance » (calque `bilan-service` STORY-036 / `document-service` STORY-043)

`bilan-service`/`document-service` fournissent le **modèle exact** : bootstrap consommateur **tolérant à la panne** (retry `setInterval().unref()`, `disconnect` en `onModuleDestroy`, I/O seul → **exclu** de couverture `*consumer*`/`*bootstrap*`) ; projection transactionnelle **marqueur d'abord puis upsert absolu** (`$set` keyé, rejouable). Ici la clé de projection est **`documentId`** (une assistance par pièce), tandis que la clé de **partition Kafka** est `orgId` (ordre garanti par organisation). L'upsert **état absolu** rend le rejeu et la ré-émission (état absolu STORY-043) naturellement idempotents.

```
DocumentExtraitConsumer.handle(message):
  event = parseEnvelope(message.value)              // JSON objet + champs requis, sinon warn + skip (offset avancé)
  if alreadyProcessed(event.eventId): return        // pré-contrôle
  markProcessedAndProject(event):                    // UNE transaction
    session.startTransaction()
      processedModel.create([{ eventId: event.eventId }], { session })   // E11000 → abort → skip
      assistModel.updateOne(
        { documentId: event.documentId },
        { $set: { orgId, type, extracted, declared, discrepancies, flags, confidence, ocrProvider, occurredAt, eventId } },
        { upsert: true, session })
    commit
  // AUCUN appel à KycStatusService — DO-1
```

### Enrichissement de `KycAdminService.getDetail` (extension, séquence)

```
profile   = tenantKycProfileRepo.findByOrg(orgId)          (STORY-013)
documents = kycDocumentsRepo.listSubmitted(orgId)          (STORY-013)
docDtos   = documents.map(d => AdminKycDocumentDto.fromDocument(d, presignedUrl(d)))   (STORY-013)
--- STORY-045 ---
assistByDoc = documentExtractionAssistReadModel.findByOrg(orgId)   // Map<documentId, assist>
docDtos.forEach(dto => dto.extraction = assistByDoc.get(dto.id))    // jointure par documentId (undefined si absent)
ocrSummary = summarize(assistByDoc, documents)                      // { hasDiscrepancies, anyUnreadable, anyExpired, extractedCount }
return AdminKycDetailDto.from(profile, docDtos, ocrSummary)
```

> `AdminKycExtractionDto` est **structuré** (lu / déclaré / écarts / drapeaux / confiance / provider / `occurredAt`) et **exclut** toute `storageKey`, binaire ou texte OCR intégral. `extraction` **optionnel** (dégradation gracieuse).

### Configuration

- `configuration.ts` : `kafka.documentExtractGroupId = process.env.KAFKA_DOCUMENT_EXTRACT_GROUP_ID ?? 'kyc-document-extract'`. `env.validation.ts` : optionnel (défaut fourni). Groupe **distinct** de tout autre (le producteur n'a pas de groupe ; c'est le **premier** groupe consommateur du service).
- Compose racine + override : ajouter `KAFKA_DOCUMENT_EXTRACT_GROUP_ID` au bloc `kyc-service` (⚠️ édition `.env*` bloquée en sandbox — cf. STORY-041→044 : le compose fournit tout via `environment:`, impact nul, à tracer).

### Sécurité

- **DO-1 (cœur de cette story).** La consommation de `document.extrait` **n'écrit jamais** le statut KYC, ne déclenche **aucune** transition, n'appelle **jamais** `KycStatusService`. `document.extrait` est une **assistance** (signaux : écarts, drapeaux) affichée à l'humain ; l'approbation reste **son** acte explicite (STORY-013).
- **RBAC inchangé.** L'enrichissement est exposé **uniquement** via `GET /admin/kyc/:orgId` (`@Roles PLATFORM_ADMIN`, e-mail vérifié — guards STORY-013). Aucun nouvel endpoint public ; aucune fuite d'assistance hors du canal admin.
- **PII / isolation.** Le read-model porte des champs **structurés** (dénomination, n° lus/déclarés) nécessaires à la revue — **assumé** (canal = revue admin globale). Il est keyé `documentId` **et** porte `orgId` ; la jointure admin est **scopée `orgId`** (le détail d'un org ne voit que ses pièces). Les **logs** restent sans PII (résumé de clés) ; **jamais** de binaire, de `storageKey`, ni de texte OCR intégral journalisés/exposés.
- **Aucun secret transporté.** `document.extrait` ne transporte aucun secret (source : `document-service`, jamais de credential).

### Cas limites / points d'attention

- **⚠️ OCR pas encore passé (course dépôt→OCR).** `document.extrait` arrive **après** que `kyc-service` a créé le `KycDocument` (kyc est la **source** de `kyc.document.uploaded`), mais **après** un délai d'OCR. **Décision v1** : **dégradation gracieuse** — le détail affiche la pièce **sans** `extraction` (`undefined`), jamais d'erreur ni d'attente. L'assistance apparaît dès qu'elle arrive (cohérence éventuelle). La revue reste possible **sans** OCR (l'humain a toujours l'URL présignée — DO-1).
- **⚠️ Pièce superseded (re-upload).** Un ré-upload crée un **nouveau** `documentId` (STORY-040) ⇒ **nouvelle** assistance ; l'ancienne (documentId retiré du dossier `SUBMITTED`) devient **orpheline** — **tolérée** : le détail ne liste que les pièces courantes, la jointure `Map.get(documentId)` ne renvoie que l'assistance pertinente. Pas de purge en v1 (inerte, keyé `documentId`).
- **⚠️ Assistance pour un `documentId` inconnu.** Impossible en pratique (kyc est la source du documentId), mais **défensivement** la projection **ne rejette pas** : elle upsert quand même (keyé `documentId`) ; une assistance sans pièce correspondante est simplement **jamais jointe** (inerte). Ne **jamais** transformer en poison-pill.
- **⚠️ `unreadable` ≠ poison-pill.** Une pièce illisible (`flags.unreadable=true`) est **projetée** normalement (l'assistance **signale** l'illisibilité). Seule l'**enveloppe structurellement invalide** est ignorée (offset avancé, `warn`).
- **⚠️ `minimize:false` (leçon STORY-043/044).** Le read-model stocke `extracted`/`declared` en `Object` — le `minimize` **par défaut** de Mongoose **supprimerait** `extracted:{}`/`declared:{}` (cas dégradé) et **amputerait** l'assistance affichée. `@Schema({ minimize:false })` **impératif** + test de régression.
- **`eventId` déjà dérivé.** L'`eventId` de `document.extrait` (`${sourceEventId}:extrait`, STORY-043) est **déterministe** : le marqueur `ProcessedEvent` + cette dérivation garantissent l'exactement-une-fois même en cas de double livraison Kafka.
- **Ordre par partition `orgId`.** L'état absolu (`$set`) + l'ordre garanti par partition `orgId` rendent la projection **rejouable** sans dépendance à l'ordre inter-org.

---

## Dependencies

**Stories prérequises :**
- **STORY-043** (`document-service` : **producteur `document.extrait` v1**) : **le contrat consommé ici** — *done* (contrat livré + vérifié docker).
- **STORY-044** (`document-service` : persistance `DocumentExtraction` + GET) : complète le flux B producteur — *done* (l'assistance existe et est fiable).
- **STORY-042** (`document-service` : consumer `kyc.document.uploaded` + OCR + extraction) — *done*.
- **STORY-040** (`kyc-service` : producteur `kyc.document.uploaded` + outbox) : le **KafkaModule** (client + producteur) réutilisé ici — *done*.
- **STORY-013** (`kyc-service` : revue KYC admin globale — `KycAdminService.getDetail`, `AdminKycDetailDto`/`AdminKycDocumentDto`, URLs présignées, `approve`/`reject`) : **le dossier enrichi ici** — *done*.
- **STORY-030** (`kyc-service` *relying party* RS256/JWKS) — *done*.
- **STORY-036** (`bilan-service` : read-model idempotent — `*Consumer` bootstrap + `ProcessedEvent` + projection transactionnelle) : **patron consommateur** à dupliquer/adapter — *done*.

**Stories bloquées (débloquées par celle-ci) :**
- **STORY-047** (`admin-panel` : vue agrégée orgs — identité + **KYC** + entitlements) : **lira** l'enrichissement exposé ici via l'API admin `kyc-service`.
- **STORY-048** (`admin-panel` : actions proxifiées — revue KYC + grant) : portera l'approbation par-dessus le dossier enrichi.
- **STORY-049** (e2e chaîne KYC complète docker) : **jalon Module 0** — dépend STORY-045 + STORY-048.

**Dépendances externes :** Kafka + Mongo (compose racine) ; `document-service` **émettant** `document.extrait` (déjà en place, STORY-043/044). **Aucune** nouvelle dépendance système.

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche **`MNV-045`** (branchée depuis `dev`, **rebasée sur `origin/dev`** avant de coder — repo `prospera-kyc-service`).
- [ ] Tests unitaires écrits et verts (seuils Jest **65/90/90/90**) :
  - [ ] **Projection** : `markProcessedAndProject` crée marqueur **et** `DocumentExtractionAssist` **dans la même tx** ; E11000 (rejeu) → aucun des deux ; ré-livraison à jour → **remplace** l'état (absolu) ; `extracted:{}` **conservé** (`minimize:false`, test de régression).
  - [ ] **Consommateur** : enveloppe valide → projeté ; malformée (non-objet / champ requis manquant) → ignorée (offset avancé) ; illisible (`unreadable=true`) → projeté.
  - [ ] **DO-1** : consommer un `document.extrait` (illisible + écarts) **ne modifie pas** `TenantKycProfile.status` ; aucun appel à `KycStatusService`.
  - [ ] **Enrichissement admin** : jointure par `documentId` (bonne assistance sur la bonne pièce) ; pièce sans assistance → `extraction: undefined` ; `ocrSummary` (`hasDiscrepancies`/`anyUnreadable`/`anyExpired`/`extractedCount`) correct.
  - [ ] **Non-régression STORY-013** : `getDetail`/`approve`/`reject`/404/409/RBAC inchangés.
- [ ] Tests e2e / docker verts :
  - [ ] `register`/`verify`/`login` → dépôt RCCM+CFE → `document-service` publie 2 `document.extrait` → `kyc-service` **projette** 2 assistances → `GET /admin/kyc/:orgId` **montre** 2 pièces enrichies (`extraction` + `ocrSummary`).
  - [ ] Rejeu (`fromBeginning`/restart) → **aucune** double projection.
  - [ ] **Statut KYC inchangé** par l'OCR (bascule uniquement par `approve`/`reject` humain).
- [ ] ESLint **0 warning** ; build image `runtime` OK.
- [ ] **Vérification docker bout-en-bout** réalisée et consignée en §Revue & validation (stack auth+kyc+document ; assistance projetée ; détail admin enrichi ; idempotence par rejeu ; **DO-1 : statut inchangé**).
- [ ] CI verte (matrice services ; nouveau code couvert en unitaire, broker non requis en CI).
- [ ] `/code-review` passé (constats traités ou tracés).
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR **`MNV-045(kyc-service): …`** ouverte puis intégrée sur `dev` en **« Rebase and merge »** ; branche supprimée après merge.
- [ ] `sprint-status.yaml` mis à jour (STORY-045 → done, note de vérification + `completed_date`).

---

## Story Points Breakdown

- **Consommateur idempotent (premier de `kyc-service`) + marqueur `ProcessedEvent` :** 1,5 point (contrat consommé dupliqué + `DocumentExtraitConsumer` bootstrap tolérant panne groupe `kyc-document-extract` + pré-contrôle + garde-fous poison-pill — duplication guidée du patron `bilan-service`/`document-service`).
- **Read-model « assistance » (projection état absolu transactionnelle, `minimize:false`) :** 0,5 point (schéma keyé `documentId` + `markProcessedAndProject` marqueur+upsert dans une tx + read-model `findByOrg`).
- **Enrichissement de la revue admin (jointure + DTO + `ocrSummary`) :** 0,5 point (extension `getDetail` sans réécriture + `AdminKycExtractionDto`/`AdminKycOcrSummaryDto`).
- **Frontend :** 0 point.
- **Testing :** 0,5 point (unit projection/consommateur/DO-1/enrichissement + e2e docker chaîne réelle + non-régression STORY-013).
- **Total :** 3 points.

**Rationale :** les **patrons** (read-model idempotent `bilan-service`/`document-service`, revue admin `kyc-service` STORY-013) sont **déjà éprouvés** et le `KafkaModule` (client + producteur) est **posé** (STORY-040) — la valeur ajoutée est le **premier consommateur** du service (bootstrap + idempotence entrante), une **projection simple** (état absolu keyé `documentId`) et une **jointure de lecture** dans un endpoint existant. Le cœur n'est pas la complexité technique mais la **discipline DO-1** (rapatrier et afficher sans jamais décider).

---

## Additional Notes

- **Invariant DO-1 (cœur de cette story).** STORY-045 **rapatrie et affiche** des signaux (écarts, drapeaux) ; elle ne **décide** rien. La consommation de `document.extrait` **n'écrit jamais** le statut KYC et ne déclenche **aucune** transition. Le statut ne bascule **que** par l'acte humain `approve`/`reject` (STORY-013). C'est l'aboutissement de la chaîne EPIC-015 : l'OCR **assiste** la revue, il ne l'**approuve** jamais.
- **Évolution assumée du « producteur pur ».** `architecture-kyc-service` §Point de coordination `declared` posait que « `kyc-service` reste producteur pur ». STORY-045 **fait évoluer** ce point : `kyc-service` devient **aussi consommateur** — mais **uniquement pour afficher** l'assistance, **jamais** pour décider (DO-1 préservé). À consigner dans une note d'architecture (`architecture-kyc-service`, §`kyc.document.uploaded`) lors de l'implémentation.
- **Découplage par événement (pas d'appel synchrone).** L'assistance arrive par **`document.extrait`** (read-model local), et **non** par un appel HTTP synchrone au `GET /documents/:documentId/extraction` de `document-service` (STORY-044) : zéro appel réseau par requête de revue, cohérence éventuelle, résilience si `document-service` est momentanément indisponible. Le `GET` de `document-service` reste une consultation directe (audit/debug).
- **État absolu partout (C7/P9).** Read-model d'assistance (`$set` keyé `documentId`) : rejouable, ordre garanti par partition `orgId`, cohérence éventuelle assumée. Compatible avec la ré-émission en état absolu de `document.extrait` (STORY-043).
- **Extension, pas réécriture.** `KycAdminService.getDetail` est **étendu** d'une jointure ; la machine à états, l'outbox producteur et le flux d'upload sont **conservés**. Le `KafkaModule` réutilise le `KAFKA_CLIENT` existant.
- **Duplication assumée (K4).** Contrat `document.extrait` consommé, `ProcessedEvent`, bootstrap consommateur, `isDuplicateKeyError` sont **copiés** (pas de lib partagée en phase 1) ; `schemaVersion` + docs d'architecture bornent la dérive. Factorisation différée (règle « au 3ᵉ usage »).
- **Extensibilité (différée).** Projeter un **compteur de signaux** dans `GET /admin/kyc/pending` (`hasOcrSignals` par item), historiser l'assistance par `version`, ou trier la file de revue par « écarts d'abord » — tous **ajoutables** sur la jointure déjà posée, **sans** rupture du contrat consommé.

---

## Progress Tracking

**Status History :**
- 2026-07-15 : Créée par Scrum Master (BMAD create-story)
- 2026-07-15 : Implémentée + vérifiée docker + `/code-review` (0 bug) + intégrée sur `dev` par Claude (BMAD dev-story)

**Actual Effort :** ~3 points (conforme à l'estimation)

---

## Revue & validation

### Implémentation

`kyc-service` — jusqu'ici **producteur pur** — devient **consommateur** (premier flux entrant), en calquant le patron read-model idempotent de `document-service` (STORY-043) / `bilan-service` (STORY-036).

- **Contrat consommé** : `src/kafka/events/document-extrait-events.ts` (`DOCUMENT_EXTRAIT_TOPIC` + `DocumentExtraitEventV1` + `DeclaredFields`/`FieldDiscrepancy`/`DocumentFlags`/`ExtractedFields`) — **copie fidèle** du contrat produit (K4), aucune dépendance vers `document-service`.
- **Module `document-extract/`** : `DocumentExtraitConsumer` (bootstrap Kafka group `kyc-document-extract`, tolérant panne, `fromBeginning`, validation d'enveloppe → poison-pill ignoré) + `DocumentExtractionAssistProjectionService` (`markProcessedAndProject` : marqueur `ProcessedEvent` **+** upsert **état absolu** keyé `documentId` **dans une seule transaction**, E11000 → skip) + `DocumentExtractionAssistReadModel` (`findByOrg` → `Map<documentId, assist>`) + schémas (`DocumentExtractionAssist` **`minimize:false`**, `ProcessedEvent` collection dédiée `inbound_processed_events`) + `duplicate-key.util`.
- **Enrichissement revue** : `KycAdminService.getDetail` étendu (jointure `findByOrg` par `documentId` → `AdminKycDocumentDto.extraction?` + `AdminKycOcrSummaryDto`) ; `AdminKycExtractionDto`/`AdminKycOcrSummaryDto` (structurés, sans PII brute). **DO-1** : aucune écriture de statut.
- **Config** : `KAFKA_DOCUMENT_EXTRACT_GROUP_ID` (déf `kyc-document-extract`) + bloc compose racine. `KafkaModule` réutilise le `KAFKA_CLIENT` existant.

### Qualité

- **ESLint** : 0 warning. **175 unit / 30 suites** + **39 e2e / 4 suites** ; nouveaux fichiers couverts (seuils 65/90/90/90 tenus).
- Couvre : projection (idempotence marqueur+upsert dans la tx, E11000 skip, erreur propagée, `extracted:{}`/`declared:{}` préservés, DO-1 = simple projection sans transition), read-model (`findByOrg` map / `orgId` malformé / défauts sûrs), consommateur (enveloppe valide / illisible projeté / poison-pills ignorés / topic étranger), enrichissement admin (jointure, pièce sans assistance → `undefined`, `ocrSummary`, DO-1 = pas d'appel statut), DTO (`fromAssist`/`summarize`), e2e admin (pièces enrichies + `ocrSummary` + non-régression STORY-013).

### /code-review (high)

`/code-review` (high) → **0 bug de correctness** ; **2 constats LOW** tracés/différés :
1. **(reuse, LOW)** `duplicate-key.util.isDuplicateKeyError` recoupe le contrôle E11000 **inline** de `kyc-documents.service.ts:175` — factorisation possible (K4 assumé : copié de `document-service`, pas de lib partagée en phase 1).
2. **(correctness, LOW)** `parseEnvelope` caste `payload.type` sans valider `RCCM|CFE` — sans impact (le `type` affiché à la revue vient du `KycDocument`, pas de l'assistance ; le producteur envoie toujours un type valide).

### Vérification docker bout-en-bout (2026-07-15)

Stack `mongo` (rs0) + `kafka` + `minio` + `mailhog` + `auth-service:3001` + `kyc-service:3002` + `document-service:3006` :

- **Consommateur** : `kyc-service` rejoint le group `kyc-document-extract` (partition `document.extrait[0]`) après un retry transitoire au boot — **tolérance panne** (boot HTTP non bloqué).
- **Pipeline nominal** : `register` (`cabinetName='OCR ASSIST SARL …'`, pays `CI`) → e-mail vérifié → `login` → **upload RCCM + CFE** (`:3002`, `201×2`) → `document-service` publie **2 `document.extrait`** → `kyc-service` **projette 2 `DocumentExtractionAssist`** (keyées `documentId`) : `extracted:{}` **PRÉSERVÉ** (`minimize:false`), `declared` résolu `{denomination:'OCR ASSIST SARL …', country:'CI'}`, `discrepancies:[{denomination, missing_read}]`, `flags:{unreadable:true, expired:false}`, `confidence:90`.
- **API enrichie** : `GET /admin/kyc/:orgId` (token `PLATFORM_ADMIN`) → **2 pièces enrichies** (`extraction` complète) + `ocrSummary:{hasDiscrepancies:true, anyUnreadable:true, anyExpired:false, extractedCount:2}`.
- **Idempotence / rejeu** : offset `kyc-document-extract` **remis à `earliest`** + redémarrage → **9** `document.extrait` re-livrés, **tous** « déjà traité » (pré-contrôle), **aucune** double projection (`document_extraction_assists` 9→9, `inbound_processed_events` 9→9).
- **Invariant DO-1** : le statut du dossier est resté **`UNDER_REVIEW`** de bout en bout — l'OCR (illisible + écart) **n'a jamais** changé le statut.

### Intégration

Repo **`prospera-kyc-service`** (branche `MNV-045` depuis `dev`, rebasée sur `origin/dev`). PR **#3 `MNV-045(kyc-service): …` → `dev` en « Rebase and merge »** (HEAD `9268877`), branche supprimée. *(Le bloc `kyc-service` du `docker-compose.yml` racine reçoit `KAFKA_DOCUMENT_EXTRACT_GROUP_ID` — orchestration locale hors repo service ; sans impact, défaut fourni.)*

### Points d'attention

- **`extracted:{}` en vérif docker** : `sample.png` n'est pas une vraie pièce RCCM/CFE → aucun champ reconnu (best-effort correct) ; l'exactitude du parsing/comparaison est portée par `document-service` (STORY-042/043) et couverte par ses tests. Ici, l'assistance affiche fidèlement `unreadable:true` + `missing_read`.
- **Dégradation gracieuse** (pièce sans assistance, OCR pas encore passé → `extraction: undefined`) : prouvée par les tests unit + e2e (en docker, les 2 pièces avaient leur OCR).

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
