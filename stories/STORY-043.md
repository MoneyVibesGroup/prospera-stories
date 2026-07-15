# STORY-043 : `document-service` — **comparaison déclaré vs lu** + détection **expiré / illisible** → producteur **`document.extrait`** (outbox)

**Epic :** EPIC-015 — Chaîne KYC / OCR (`document-service`) : l'OCR **assiste** la revue, il ne **décide** jamais (invariant **DO-1**)
**Réf. architecture :** `tech-spec-document-service-2026-07-10.md` (v1.0, §Exigences « Comparaison déclaré vs lu… », §Modèle de données `DocumentExtraction`, §Contrats d'événements `document.extrait`, **ST-DOC-3**) · `architecture-auth-service-2026-07-04.md` §« Contrat d'événements `identity.*` (v1) — source de vérité » (read-model d'identité) · `architecture-kyc-service-2026-07-03.md` §« Point de coordination — `declared` (comparaison OCR) » (résolution en aval via read-model `identity.*`) · `architecture-prospera-ecosystem-2026-07-04.md` §Orchestration / §Contrats d'événements (Kafka, outbox transactionnel, état absolu) · **patron outbox transactionnel** `kyc-service` STORY-040 / `platform-catalog-service` STORY-034 (`OutboxEvent` + `OutboxService.enqueue(session)` + `OutboxRelayService`) · **patron read-model idempotent** `bilan-service` STORY-036 (`*Consumer` bootstrap + `ProcessedEvent` + projection transactionnelle) · décisions programme **AD-2** (chaîne KYC en 2 flux) + **DO-1** (l'OCR propose, l'humain décide)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-15. Étend `ExtractionService` (STORY-042) : read-model `identity.*` local (résout le déclaré) → comparaison déclaré↔lu (`IdentityComparator`, écarts) + drapeaux `expired`/`unreadable` (`DocumentFlags`) → **producteur `document.extrait` v1** via **outbox transactionnel** (`enqueue` **dans la tx** du marqueur `ProcessedEvent` — marqueur+émission atomiques). Dégradation gracieuse si org non projetée ; **DO-1** strict (aucune écriture de statut KYC). lint 0, **173 unit (31 suites) cov 98.98/91.54/98.44/98.89 + 14 e2e**. `/code-review` (high) : **1 bug corrigé** (`OutboxEvent` `minimize:false` — le `minimize` Mongoose amputait `extracted:{}`/`declared:{}` du contrat, découvert en vérif docker) + test de régression ; 3 constats LOW différés. Intégré : PR #3 **`MNV-043(document-service)` mergée « Rebase and merge » sur `dev`** (HEAD `336ed35`), branche supprimée. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-15
**Sprint :** 9
**Service :** document-service (`:3006`, base `document_service`) — *relying party* pur (STORY-041), consommateur idempotent (STORY-042)
**Couvre :** aucun FR fonctionnel direct (capacité transverse d'OCR au service du KYC ; décisions **AD-2 / DO-1**) — **troisième maillon métier** du pipeline EPIC-015 (STORY-042 → **043** → 044 → 045) : c'est la story qui **produit l'assistance à la revue** (`document.extrait`) que `kyc-service` consommera (STORY-045).

> **Troisième story de la chaîne EPIC-015 (flux B du Module 0).** STORY-041 a posé le **scaffold** (relying party, `OcrProvider`, `DocumentStorageReader` MinIO lecture, `KafkaModule` **client de santé** seulement). STORY-042 a branché le **pipeline d'ingestion** : consommateur idempotent de `kyc.document.uploaded` → lecture pièce (MinIO) → OCR → **extraction structurée RCCM/CFE** (`ExtractedDocument` **en mémoire**, tracé, non émis, non persisté ; transaction = **marqueur `ProcessedEvent` seul**). STORY-043 **ferme la boucle métier** : elle **résout le déclaré** (read-model `identity.*` local, projeté depuis `auth-service`), **compare** déclaré ↔ lu (écarts), **calcule les drapeaux** « expiré / illisible » (seuils de confiance), puis **publie `document.extrait` v1** via **outbox transactionnel** — **dans la même transaction que le marqueur `ProcessedEvent`** (marqueur + émission **atomiques**, exactement-une-fois effective). **Invariant DO-1 strict :** `document-service` **n'écrit jamais** le statut KYC — il émet une **assistance** que l'humain lira (via `kyc-service` STORY-045 → `admin-panel` flux A). La **persistance** `DocumentExtraction` (base `document_service`) reste **STORY-044**.

---

## User Story

En tant que **plateforme PROSPERA (chaîne KYC assistée par OCR)**,
je veux que `document-service`, une fois une pièce lue et extraite (STORY-042), **compare les champs lus aux valeurs déclarées à l'inscription** (résolues via un read-model d'identité local), **détecte les pièces expirées ou illisibles** (seuils de confiance), puis **publie de façon fiable un événement `document.extrait`** portant le lu, le déclaré, les écarts et les drapeaux,
afin que la **revue humaine du KYC** (côté `kyc-service` STORY-045, affichée par `admin-panel`) dispose, à chaque justificatif déposé, d'une **assistance tracée, rejouable et sans doublon** — l'OCR **enrichit le dossier**, il **ne l'approuve jamais** (invariant DO-1).

---

## Description

### Contexte

La chaîne KYC de PROSPERA est structurée en **deux flux** (décision **AD-2**) : le **flux A** (revue humaine via `admin-panel`, EPIC-016) et le **flux B** (assistance OCR via `document-service`, EPIC-015 — *cet épic*). L'invariant **DO-1** est strict : **l'OCR propose, l'humain décide**. STORY-042 a livré le **cœur du traitement** (ingestion + reconnaissance), en s'arrêtant **volontairement** juste avant la comparaison et l'émission : elle **trace** un `ExtractedDocument` en mémoire, persiste **uniquement** le marqueur `ProcessedEvent`, et **n'émet rien**. La transaction de `markProcessed` a été **explicitement conçue pour être étendue** (commentaire de code STORY-042 : « 043/044 y ajouteront l'enqueue outbox `document.extrait` et la persistance `DocumentExtraction` »).

STORY-043 **branche les trois briques manquantes** de ST-DOC-3 (tech-spec), sans réécrire STORY-042 :

1. **Résolution du déclaré.** Le contrat `kyc.document.uploaded` v1 **ne porte pas** l'identité déclarée : depuis le cutover *relying party* (STORY-030), `kyc-service` **ne possède plus l'identité** (propriété d'`auth-service`) et son payload est explicitement **sans donnée déclarée** (`architecture-kyc-service` §Point de coordination). La résolution « déclaré ↔ lu » est donc **en aval**, portée par `document-service` via un **read-model d'identité local** projeté depuis les événements **`identity.*`** d'`auth-service` (source de vérité `architecture-auth-service` §Contrat `identity.*`). STORY-043 **câble** ce read-model (`identity.org.created` / `identity.org.updated` → collection `org_identities` keyée `orgId`), en **calquant le patron read-model idempotent** de `bilan-service` STORY-036.
2. **Comparaison + drapeaux.** Un **comparateur** confronte les champs **lus** (`ExtractedFields`, STORY-042) aux champs **déclarés** (read-model) et produit une liste d'**écarts** (`discrepancies`). Un calculateur de **drapeaux** dérive `unreadable` (confiance OCR sous seuil / aucun champ reconnu) et `expired` (date de pièce échue, best-effort). **Aucun jugement** : ce sont des **signaux** pour la revue humaine (DO-1).
3. **Producteur `document.extrait` (outbox transactionnel).** `document-service` devient **producteur** : il publie `document.extrait` v1 (état **absolu** : lu + déclaré + écarts + drapeaux + confiance) via le **patron outbox** déjà éprouvé dans l'écosystème (`kyc-service` STORY-040, `platform-catalog-service` STORY-034 : `OutboxEvent` `PENDING` créé **en transaction**, relais qui publie puis marque `PUBLISHED`). L'**enqueue** se fait **dans la transaction de `markProcessed`** → « pas de marqueur sans événement, pas d'événement sans marqueur » (aucune fuite, aucune perte, exactement-une-fois effective).

L'EPIC-015 se découpe en 5 stories : **STORY-041** (scaffold — *done*), **STORY-042** (consumer idempotent + OCR + extraction RCCM/CFE — *done*), **STORY-043** (comparaison déclaré/lu + expiré/illisible → producteur `document.extrait` — *cette story*), **STORY-044** (persistance `DocumentExtraction` keyée `orgId` + GET consultation), **STORY-045** (`kyc-service` consomme `document.extrait` → enrichit le dossier de revue). STORY-043 est la story qui **rend le flux B utile** : c'est elle qui **émet l'assistance** consommée en 045.

### Périmètre

**Dans le périmètre**

- **Read-model d'identité local (`identity.*`)** : nouveau `modules/read-models/` (calque `bilan-service` STORY-036) — contrat consommé **dupliqué** (`kafka/events/identity-events.ts` : `IdentityTopic.ORG_CREATED`/`ORG_UPDATED` + interfaces `IdentityOrgCreatedV1`/`IdentityOrgUpdatedV1`, copie fidèle de `auth-service/src/kafka/outbox/identity-events.ts`, **sans dépendance de code** vers `auth-service`, décision **K4**), consommateur bootstrap tolérant à la panne `IdentityConsumer` (groupe **dédié `document-identity`**, `subscribe([ORG_CREATED, ORG_UPDATED], fromBeginning:true)`), projection transactionnelle idempotente `OrgIdentityProjectionService` (marqueur `ProcessedEvent` **partagé** + upsert **état absolu** `$set` keyé `organizationId`), schéma `OrgIdentity { organizationId (unique), denomination (= org name), country?, status, updatedAt }`. **v1 volontairement minimal** : seule l'**organisation** est projetée (l'identité déclarée pertinente = **dénomination / raison sociale** + pays) ; `identity.user.*` / `identity.membership.*` **hors périmètre** (aucun besoin de comparaison au niveau utilisateur en v1).
- **Résolution du `declared`** : `OrgIdentityReadModel.findByOrg(orgId)` → `DeclaredFields { denomination?, country? }` (undefined si l'org n'est pas encore projetée — **dégradation gracieuse**, cf. §Cas limites).
- **Comparateur déclaré ↔ lu** : `IdentityComparator.compare(declared, extracted, type)` → `FieldDiscrepancy[]`. Normalisation robuste au bruit OCR (casse, accents, espaces multiples, ponctuation) **avant** comparaison. Chaque écart porte `{ field, declared?, read?, kind }` avec `kind ∈ { 'mismatch' | 'missing_declared' | 'missing_read' }`. **v1** : compare la **dénomination** (déclarée vs lue) — champ le plus fiable présent des deux côtés ; extensible (pays, n° si un jour déclaré). **Aucun** écart **fabriqué** quand le déclaré est indisponible (read-model non encore peuplé) → `discrepancies: []` + drapeau/marqueur `declaredUnavailable` (voir §Technical Notes).
- **Calculateur de drapeaux** : `DocumentFlags.evaluate(extracted, confidence, now)` → `{ expired: boolean, unreadable: boolean }`.
  - `unreadable = confidence < ocr.minConfidence` **OU** `Object.keys(fields).length === 0` (pièce techniquement lue mais **aucun** champ reconnu). Seuil configurable `OCR_MIN_CONFIDENCE` (défaut **40** sur l'échelle Tesseract 0–100).
  - `expired = documentDate reconnue ET échue` selon la règle de validité du type (best-effort ; **par défaut `false`** faute de date/échéance déterminable — RCCM/CFE n'ont pas d'échéance stricte en v1 : la règle est **paramétrable et extensible**, jamais une fausse alerte). Documenté §Cas limites.
- **Contrat produit `document.extrait` v1 (dupliqué localement)** : `kafka/events/document-events.ts` — `DOCUMENT_EXTRAIT_TOPIC = 'document.extrait'` + interface `DocumentExtraitEventV1` (**état absolu**, compat **BACKWARD** P9) : `{ schemaVersion:1, eventId, orgId, documentId, type, extracted, declared, discrepancies, flags:{expired,unreadable}, confidence, ocrProvider, occurredAt }`. **Clé de partition = `orgId`** (ordre garanti par organisation, cohérent avec `kyc.document.uploaded`). L'`eventId` de `document.extrait` est **dérivé de façon déterministe** de l'`eventId` entrant (`${incomingEventId}:extrait`) — ceinture-et-bretelles pour la déduplication en aval (STORY-045), en plus de l'exactement-une-fois garantie par le marqueur.
- **Outbox transactionnel (producteur)** : nouveau `kafka/outbox/` (calque `kyc-service` STORY-040 / `catalog` STORY-034) — `OutboxEvent` schéma (`{ eventId (unique), topic, partitionKey, schemaVersion, payload, status: PENDING|PUBLISHED, attempts, createdAt }`), `OutboxService.enqueue(params, session)` (**exige une session** : l'événement n'existe qu'**à l'intérieur** de la transaction du marqueur), `OutboxRelayService` (poller `setInterval().unref()` tolérant à la panne : lit les `PENDING`, publie via le **producteur Kafka**, marque `PUBLISHED` ; back-off sur échec ; `disconnect` propre). **KafkaModule** étendu d'un **producteur** (STORY-041 ne fournissait qu'un **client de santé** ; STORY-043 introduit le **premier producteur** de `document-service`).
- **Extension de `ExtractionService` (pas de réécriture)** : après la construction de l'`ExtractedDocument` (STORY-042), résoudre `declared` (read-model) → comparer → drapeaux → construire le payload `DocumentExtraitEventV1` → `markProcessedAndEmit(eventId, payload)` : **une seule transaction** insérant `ProcessedEvent{eventId}` **puis** `OutboxService.enqueue(document.extrait)` (E11000 sur le marqueur → abort → skip, aucune émission). Le pré-contrôle d'idempotence + le hors-transaction OCR/lecture de STORY-042 sont **conservés tels quels**.
- **Câblage & configuration** : `ReadModelsModule` + `OutboxModule` importés dans `app.module.ts` ; `ExtractionModule` reçoit `OutboxService` + `OrgIdentityReadModel` + comparateur/drapeaux ; `configuration.ts`/`env.validation.ts` étendus (`OCR_MIN_CONFIDENCE` défaut 40, `KAFKA_IDENTITY_GROUP_ID` défaut `document-identity`, `OUTBOX_RELAY_INTERVAL_MS` défaut 2000) ; bloc `document-service` du `docker-compose.yml` **racine** + override + `.env.example` reçoivent ces variables. **Aucun** nouveau service d'infra (Mongo/Kafka/MinIO déjà présents). `/health` reste inchangé (mongo + kafka + minio).
- **Tests** : unitaires (projection identité idempotente ; comparateur — normalisation + 3 `kind` d'écart + dégradation déclaré absent ; drapeaux — seuils `unreadable`, `expired` best-effort ; enqueue outbox **dans** la tx du marqueur ; dérivation `eventId` ; skip émission au rejeu) + e2e docker (chaîne réelle : `identity.*` peuple le read-model → dépôt RCCM/CFE → `document.extrait` **émis** avec écarts + drapeaux ; rejeu **sans** double émission ; déclaré absent → émission **dégradée** sans écart fabriqué). Seuils Jest standard (**65/90/90/90**).

**Hors périmètre (stories suivantes ou décisions figées)**

- **Persistance `DocumentExtraction`** (base `document_service`, keyée `orgId`, avec `extracted`/`declared`/`discrepancies`/`flags`) + éventuel `GET /documents/:documentId/extraction` → **STORY-044**. STORY-043 **n'ajoute aucune** collection de domaine : elle persiste le **marqueur `ProcessedEvent`** (idempotence, existant) + l'**`OutboxEvent`** (fiabilité d'émission) ; le contenu métier vit **dans le payload de l'événement** (repris et persisté en 044, même transaction étendue).
- **Consommation de `document.extrait`** côté `kyc-service` (enrichir le dossier de revue) → **STORY-045**.
- **Projection `identity.user.*` / `identity.membership.*`** dans le read-model → **différée** (v1 ne compare qu'au niveau **organisation** : dénomination/pays). Le patron reste ouvert (ajouter un handler).
- **Toute écriture du statut KYC** — invariant **DO-1** strict : `document-service` n'appelle **jamais** `kyc-service` pour changer un statut ; `document.extrait` est une **assistance**, pas une décision.
- **Règles d'échéance riches** (validité par type de pièce, alertes de péremption) → best-effort minimal en v1 (extensible sans changement de contrat, `flags.expired` étant déjà au payload).
- **Extensions** (factures fournisseurs, dossiers de Crédit, OCR Atelier Balance EPIC-018/020) → différées (mêmes patrons : nouveaux parseurs + comparateurs).

### Flux (mise en route)

1. Stack docker complète (`mongo` rs0, `kafka`, `minio`, `auth-service:3001`, `kyc-service:3002`, `document-service:3006`). Au boot, `document-service` ouvre **deux consommateurs** : `document-ocr` (`kyc.document.uploaded`, STORY-042) et **`document-identity`** (`identity.org.created`/`identity.org.updated`, **nouveau**), et démarre le **relais outbox**. Broker indisponible → boot HTTP **quand même** OK, re-tentatives en tâche de fond.
2. Un cabinet s'inscrit sur `auth-service` (`register`) → `auth-service` émet `identity.org.created` (nom, pays, statut). `document-service` **projette** l'org dans `org_identities` (read-model d'identité). Une mise à jour de profil → `identity.org.updated` (état absolu) rafraîchit la projection.
3. Le cabinet dépose une pièce (`POST :3002/kyc/documents`, RCCM puis CFE). `kyc-service` publie `kyc.document.uploaded` (outbox, STORY-040).
4. `document-service` **consomme** le message (STORY-042) : valide l'enveloppe → pré-contrôle `ProcessedEvent` → lecture MinIO → OCR → parsing → `ExtractedDocument`. **Puis (STORY-043)** : `findByOrg(orgId)` (déclaré) → `compare` (écarts) → `evaluate` (drapeaux) → **transaction** : `ProcessedEvent{eventId}` + `OutboxService.enqueue(document.extrait)` → commit. Le **relais** publie l'`OutboxEvent` `PENDING` sur Kafka (clé `orgId`) puis le marque `PUBLISHED`.
5. **Rejeu** (même `eventId` re-livré) → pré-contrôle **ou** E11000 sur le marqueur ⇒ **ignoré**, **aucune** ré-émission (exactement-une-fois effective ; l'`eventId` `document.extrait` dérivé garantit en plus une dédup en aval).
6. **Déclaré absent** (org pas encore projetée : course register→upload) → `declared` vide, `discrepancies: []` (aucun écart fabriqué), `document.extrait` **émis** en mode **dégradé** (l'assistance reste utile : le lu + les drapeaux). La cohérence se rétablit d'elle-même (rejeu manuel ou revue humaine ; pas d'auto-décision — DO-1).
7. **Message malformé** (enveloppe invalide) → **ignoré** (offset avancé, `warn`), **partition non bloquée** (garde-fous STORY-042 conservés).
8. **Aucun** statut KYC touché (DO-1). `kyc-service` **consommera** `document.extrait` en **STORY-045**.

---

## Acceptance Criteria

- [ ] **Read-model d'identité `identity.*` (câblé, idempotent)** : `document-service` **consomme** `identity.org.created` / `identity.org.updated` (groupe **dédié `document-identity`**, `fromBeginning:true`, bootstrap **tolérant à la panne** — broker indisponible au boot ne fait **jamais** échouer le démarrage HTTP) et **projette** l'organisation dans `org_identities` (`{ organizationId (unique), denomination, country?, status, updatedAt }`) en **état absolu** (`$set`, upsert keyé `organizationId`), **idempotent** (marqueur `ProcessedEvent{eventId}` transactionnel, rejeu ignoré via E11000). Contrat consommé **dupliqué fidèlement** (`identity-events.ts`), **aucune** dépendance de code vers `auth-service`. **Test** : `identity.org.created` puis `identity.org.updated` (nom changé) ⇒ projection à jour ; rejeu même `eventId` ⇒ pas de double effet.
- [ ] **Résolution du déclaré + dégradation gracieuse** : le pipeline résout `declared = OrgIdentityReadModel.findByOrg(orgId)` avant la comparaison. Si l'org **n'est pas encore projetée**, `declared` est vide, **aucun écart n'est fabriqué** (`discrepancies: []`), et le traitement **continue** (émission dégradée, jamais d'exception, jamais de blocage). **Test** : org absente du read-model ⇒ `document.extrait` émis avec `declared` vide et `discrepancies` vide.
- [ ] **Comparaison déclaré ↔ lu** : `IdentityComparator` **normalise** (casse, accents, espaces, ponctuation) puis compare la **dénomination** déclarée à la dénomination lue et produit `FieldDiscrepancy[]` avec `kind ∈ {'mismatch','missing_declared','missing_read'}`. Valeurs **équivalentes après normalisation** ⇒ **aucun** écart. Valeurs **différentes** ⇒ `mismatch`. Déclaré présent / lu absent ⇒ `missing_read` ; l'inverse ⇒ `missing_declared`. **Test** : les 4 cas (égal / différent / lu absent / déclaré absent) produisent le bon résultat ; le bruit OCR (accents, casse) ne crée **pas** de faux écart.
- [ ] **Drapeaux `expired` / `unreadable`** : `unreadable = confidence < OCR_MIN_CONFIDENCE (défaut 40) OU aucun champ reconnu` ; `expired` best-effort (`documentDate` échue selon règle du type ; **défaut `false`** faute d'échéance déterminable — **jamais** de fausse alerte). **Test** : confiance sous seuil ⇒ `unreadable=true` ; `fields = {}` ⇒ `unreadable=true` ; confiance ≥ seuil + champs reconnus ⇒ `unreadable=false` ; `expired` reste `false` en l'absence d'échéance.
- [ ] **Contrat `document.extrait` v1 produit** : `DOCUMENT_EXTRAIT_TOPIC='document.extrait'` + `DocumentExtraitEventV1 { schemaVersion:1, eventId, orgId, documentId, type, extracted, declared, discrepancies, flags:{expired,unreadable}, confidence, ocrProvider, occurredAt }`, **clé de partition `orgId`**, **état absolu** (compat BACKWARD, P9). L'`eventId` de sortie est **dérivé déterministiquement** de l'`eventId` entrant (`${eventId}:extrait`). **Aucune** PII inutile ni binaire dans le payload (champs structurés uniquement). **Test** : le payload émis respecte la forme et l'`eventId` dérivé attendu.
- [ ] **Producteur outbox transactionnel** : `OutboxEvent{eventId unique, topic, partitionKey, schemaVersion, payload, status, attempts}` est créé **PENDING dans la même transaction** que le marqueur `ProcessedEvent` (`OutboxService.enqueue(params, session)`). Le **relais** (`OutboxRelayService`, tolérant à la panne) publie les `PENDING` via le **producteur Kafka** (clé `orgId`) puis marque `PUBLISHED` (back-off/attempts sur échec). **Aucun** événement sans marqueur, **aucun** marqueur sans événement. **Test** : un `commit` crée marqueur **et** `OutboxEvent`; un `abort` (E11000 rejeu) n'en crée **aucun**.
- [ ] **Exactement-une-fois effective (émission)** : un **rejeu** du même `kyc.document.uploaded` (même `eventId`) ⇒ **aucune** ré-extraction **et aucune** ré-émission (pré-contrôle + E11000). **Un seul** `document.extrait` par pièce. **Test** : deux livraisons du même `eventId` ⇒ un seul `OutboxEvent`, un seul marqueur.
- [ ] **Extension sans réécriture + DO-1 préservé** : `ExtractionService` de STORY-042 est **étendu** (résolution déclaré + comparaison + drapeaux + `markProcessedAndEmit`), pas réécrit ; le hors-transaction OCR/lecture et les garde-fous poison-pill sont **conservés**. **Aucune** écriture de statut KYC, **aucun** appel sortant vers `kyc-service`. **Test** : le handler n'appelle jamais `kyc-service` ; seul `document.extrait` est émis.
- [ ] **Robustesse (non-blocage de partition)** : une pièce **illisible** (faible confiance / aucun champ) **n'est pas** un poison-pill → elle produit un `document.extrait` avec `unreadable=true` (l'assistance signale, l'humain décide). Une erreur **transitoire** (OCR/MinIO/réseau/Kafka publish) **se propage** ou est **réessayée** (relais) — jamais de perte silencieuse. Un objet **définitivement absent** (`NoSuchKey`) reste ignoré (STORY-042). **Test** : illisible ⇒ émission avec drapeau ; transitoire ⇒ rejeu/relais.
- [ ] **Câblage & configuration** : `ReadModelsModule` + `OutboxModule` importés ; `KafkaModule` fournit un **producteur** ; `OCR_MIN_CONFIDENCE` / `KAFKA_IDENTITY_GROUP_ID` / `OUTBOX_RELAY_INTERVAL_MS` validés (défauts fournis, non requis au boot) ; bloc compose racine `document-service` + override + `.env.example` mis à jour. **Aucun** nouveau service d'infra ; `/health` inchangé.
- [ ] **CI** verte (matrice 6 services inchangée ; nouveau code métier couvert en **unitaire** avec Kafka/Mongo **mockés** — aucun broker réel requis en CI ; les consommateurs/relais réels sont éprouvés en **vérif docker**). Lint **0 warning**, seuils Jest tenus.
- [ ] **Vérification docker bout-en-bout** : stack `mongo`+`kafka`+`minio`+`auth`+`kyc`+`document` ; `register` (auth) ⇒ `identity.org.created` **projeté** (read-model peuplé) → **dépôt RCCM puis CFE** (kyc) → `document-service` **consomme**, **compare** (écarts si dénomination lue ≠ déclarée), **calcule les drapeaux**, et **publie 2 `document.extrait`** (topic `document.extrait`, clé `orgId`, `OutboxEvent` `PUBLISHED`). **Rejeu** ⇒ **aucune** double émission. **Déclaré absent** (upload avant projection) ⇒ émission **dégradée** (`declared` vide, `discrepancies` vide). **Aucun** statut KYC touché.

---

## Technical Notes

### Composants

- **Backend :** `document-service` (`:3006`, base `document_service`) — ajout d'un `modules/read-models/` (identité), extension de `modules/extraction/` (comparateur + drapeaux + émission), ajout d'un `kafka/outbox/` (producteur fiable), extension du `KafkaModule` (producteur).
- **Frontend :** aucun (la revue = `admin-panel`, flux A / EPIC-016, qui lira l'assistance **via `kyc-service`** une fois 045 livrée).
- **Base de données :** Mongo `document_service` — **2 collections ajoutées** : `org_identities` (read-model d'identité) et `outbox_events` (émission fiable). `processed_events` (STORY-042) **partagée** entre les consommateurs (eventId global unique). **Pas** de collection `DocumentExtraction` (STORY-044).
- **Bus :** Kafka — **consomme** `kyc.document.uploaded` (groupe `document-ocr`, STORY-042) **+ `identity.org.created`/`identity.org.updated`** (nouveau groupe `document-identity`) ; **produit `document.extrait`** (premier producteur, via outbox).
- **Stockage :** MinIO **lecture seule** (inchangé, STORY-042).

### Arborescence (ajouts sur STORY-042)

```
document-service/src/
├── kafka/
│   ├── kafka.module.ts                       # + producteur (STORY-041 = client santé seul)
│   ├── events/
│   │   ├── kyc-document-events.ts            # inchangé (STORY-042)
│   │   ├── identity-events.ts               # NEW — IdentityTopic.ORG_* + IdentityOrg*V1 (copie contrat identity.* v1)
│   │   └── document-events.ts               # NEW — DOCUMENT_EXTRAIT_TOPIC + DocumentExtraitEventV1 (contrat produit v1)
│   └── outbox/
│       ├── outbox-event.schema.ts           # NEW — OutboxEvent (dup kyc/catalog : eventId unique, status, attempts)
│       ├── outbox.service.ts                # NEW — enqueue(params, session) (exige la session de la tx)
│       ├── outbox-relay.service.ts          # NEW — poller tolérant à la panne : PENDING → produce → PUBLISHED
│       └── outbox.module.ts                 # NEW — schéma + service + relais + producteur
├── modules/read-models/
│   ├── read-models.module.ts                # NEW — consumer + projection + OrgIdentity + ProcessedEvent (partagé)
│   ├── identity-consumer.bootstrap.ts       # NEW — bootstrap Kafka (calque bilan) — EXCLU couverture
│   ├── org-identity.projection.service.ts   # NEW — upsert absolu keyé organizationId, idempotent
│   ├── org-identity.read-model.ts           # NEW — findByOrg(orgId) → DeclaredFields
│   └── schemas/
│       └── org-identity.schema.ts           # NEW — { organizationId unique, denomination, country?, status, updatedAt }
├── modules/extraction/
│   ├── extraction.service.ts                # EXT — + resolve declared + compare + flags + markProcessedAndEmit
│   ├── comparison/
│   │   ├── identity.comparator.ts           # NEW — declared vs extracted → FieldDiscrepancy[]
│   │   └── document-flags.ts                # NEW — evaluate(fields, confidence, now) → {expired, unreadable}
│   ├── types/
│   │   ├── extracted-document.ts            # inchangé (STORY-042)
│   │   └── document-extrait.ts              # NEW — DeclaredFields, FieldDiscrepancy, DocumentExtraitResult
│   ├── extraction.module.ts                 # EXT — importe OutboxModule + ReadModelsModule (exports)
│   └── schemas/processed-event.schema.ts    # inchangé (partagé)
└── config/
    ├── configuration.ts                     # + ocr.minConfidence, kafka.identityGroupId, outbox.relayIntervalMs
    └── env.validation.ts                    # + OCR_MIN_CONFIDENCE / KAFKA_IDENTITY_GROUP_ID / OUTBOX_RELAY_INTERVAL_MS (optionnels)
```

> `storage/`, `ocr/`, les parseurs (STORY-041/042) sont **réutilisés tels quels**. STORY-044 ajoutera le schéma `DocumentExtraction` et **persistera** le résultat **dans la même transaction** que le marqueur + l'outbox.

### Read-model `identity.*` (calque `bilan-service` STORY-036)

`bilan-service` fournit le **modèle exact** (`kyc-status-consumer.bootstrap.ts` + `kyc-status.projection.service.ts` + `schemas/org-kyc-status.schema.ts` + `ProcessedEvent`) : bootstrap tolérant à la panne (retry `setInterval().unref()`, `disconnect` en `onModuleDestroy`, I/O seul → exclu de couverture `*consumer*`/`*bootstrap*`) ; projection transactionnelle **marqueur d'abord puis upsert absolu** (`$set` keyé `organizationId`, rejouable, ordre garanti par partition `orgId`). Ici la projection écoute **deux** types (`ORG_CREATED`, `ORG_UPDATED`) et mappe `name → denomination`. `identity.org.updated` porte `name?` (optionnel, état absolu) : n'écraser la dénomination que si `name` est présent.

### Contrat produit `document.extrait` v1 (`document-events.ts`)

```ts
export const DOCUMENT_EXTRAIT_TOPIC = 'document.extrait';

/** Champs déclarés résolus via le read-model identity.* (best-effort, partiels possibles). */
export interface DeclaredFields {
  denomination?: string;
  country?: string;
}

export type DiscrepancyKind = 'mismatch' | 'missing_declared' | 'missing_read';
export interface FieldDiscrepancy {
  field: string;          // ex. 'denomination'
  declared?: string;      // valeur déclarée (read-model)
  read?: string;          // valeur lue (OCR)
  kind: DiscrepancyKind;
}

/** Contrat produit v1 — état ABSOLU (P9 BACKWARD). Clé de partition = orgId. */
export interface DocumentExtraitEventV1 {
  schemaVersion: 1;
  eventId: string;        // dérivé : `${incomingEventId}:extrait` (dédup aval STORY-045)
  orgId: string;          // ObjectId hex — clé de partition
  documentId: string;     // ObjectId hex du KycDocument
  type: KycDocumentType;  // RCCM | CFE
  extracted: ExtractedFields;   // le « lu » (STORY-042)
  declared: DeclaredFields;     // le « déclaré » (read-model identity ; {} si indisponible)
  discrepancies: FieldDiscrepancy[]; // écarts (vide si déclaré indisponible — jamais fabriqués)
  flags: { expired: boolean; unreadable: boolean };
  confidence: number;     // confiance OCR globale (0–100)
  ocrProvider: string;    // provider ayant produit le texte (ex. 'tesseract')
  occurredAt: string;     // ISO-8601 UTC
}
```

> **`declaredUnavailable`.** Choix v1 : ne **pas** ajouter de champ dédié au contrat (compat BACKWARD) ; l'indisponibilité du déclaré se lit du fait que `declared` est vide **et** `discrepancies` vide. Si un besoin explicite émerge (STORY-045), un booléen optionnel `declaredResolved?` pourra être ajouté (ajout rétro-compatible).

### Outbox transactionnel (calque `kyc-service` STORY-040 / `catalog` STORY-034)

`OutboxService.enqueue(params, session)` **exige** la session de la transaction du marqueur — l'`OutboxEvent` `PENDING` est créé **dans** la transaction (rollback ⇒ pas d'événement ; commit ⇒ marqueur + événement atomiques). Le `OutboxRelayService` (poller tolérant à la panne, calque des relais existants) lit les `PENDING` (ordonnés `createdAt`), publie via le **producteur Kafka** (`key = partitionKey = orgId`, header `eventId`/`schemaVersion`), passe à `PUBLISHED` ; échec ⇒ `attempts++` + back-off, l'événement reste `PENDING` (re-tenté). **Idempotence de publication** garantie côté consommateur (STORY-045) par l'`eventId` dérivé.

### Extension de `ExtractionService.process` (séquence)

```
alreadyProcessed(eventId) ? → skip                     (STORY-042, conservé)
buffer = readPiece(storageKey)                          (STORY-042)
ocr = OcrProvider.extract(buffer)                       (STORY-042)
fields = parsers.parse(type, ocr.text)                  (STORY-042)
extracted = { … }                                       (STORY-042)
--- STORY-043 ---
declared = orgIdentityReadModel.findByOrg(orgId) ?? {}
discrepancies = comparator.compare(declared, fields, type)
flags = documentFlags.evaluate(fields, ocr.confidence, now)
payload = buildDocumentExtrait(eventId, extracted, declared, discrepancies, flags)
markProcessedAndEmit(eventId, payload):                 // UNE transaction
  session.startTransaction()
    processedModel.create([{ eventId }], { session })   // E11000 → abort → return false (skip)
    outbox.enqueue({ eventId: `${eventId}:extrait`, topic: DOCUMENT_EXTRAIT_TOPIC,
                     partitionKey: orgId, schemaVersion: 1, payload }, session)
  commit
logExtraction(extracted)                                // trace sans PII (STORY-042)
```

> STORY-044 insérera `DocumentExtraction` **dans cette même transaction** (marqueur + outbox + persistance atomiques).

### Configuration

- `configuration.ts` : `ocr.minConfidence = Number(process.env.OCR_MIN_CONFIDENCE ?? 40)` ; `kafka.identityGroupId = process.env.KAFKA_IDENTITY_GROUP_ID ?? 'document-identity'` ; `outbox.relayIntervalMs = Number(process.env.OUTBOX_RELAY_INTERVAL_MS ?? 2000)`. `env.validation.ts` : optionnels (défauts fournis).
- Groupe **`document-identity`** distinct de `document-ocr` (rejeu maîtrisé, `fromBeginning:true` au 1er démarrage).
- Compose racine + override + `.env.example` : ajouter `OCR_MIN_CONFIDENCE`, `KAFKA_IDENTITY_GROUP_ID`, `OUTBOX_RELAY_INTERVAL_MS` au bloc `document-service` (⚠️ édition `.env*` bloquée en sandbox — cf. STORY-041/042 : le compose fournit tout via `environment:`, impact nul, à tracer).

### Sécurité

- **DO-1** : `document.extrait` est une **assistance** (signaux : écarts, drapeaux) ; **aucune** écriture de statut KYC, **aucun** appel sortant vers `kyc-service`. Le statut reste piloté par l'humain (kyc-service).
- **PII** : le payload porte des champs **structurés** (dénomination, n° RCCM/CFE lus) nécessaires à la revue — c'est **assumé** (destinataire = `kyc-service`, propriétaire du dossier). Les **logs** restent sans PII (résumé de clés, STORY-042) ; le **binaire** et le **texte OCR intégral** ne sont **jamais** émis ni journalisés.
- **Isolation `orgId`** : read-model, comparaison et clé de partition sont tous keyés `orgId` (event-driven, hors requête JWT).
- **Read-model d'identité** : `identity.*` ne transporte **aucun secret** (source : `auth-service`, jamais de `passwordHash`/token) ; on ne projette que dénomination/pays/statut.

### Cas limites / points d'attention

- **⚠️ Ordre inter-topics (déclaré pas encore projeté).** `identity.org.created` et `kyc.document.uploaded` sont sur des **topics distincts** (donc **pas** d'ordre garanti entre eux, même pour un `orgId` donné). Une pièce peut arriver **avant** la projection de l'org (course register→upload). **Décision v1** : **dégradation gracieuse** — `declared` vide, `discrepancies: []` (jamais fabriqués), `document.extrait` **émis quand même** (le lu + les drapeaux restent utiles). **Ne pas** bloquer/attendre la projection (risque d'inter-blocage, DO-1 : l'humain tranche). Documenter comme **cohérence éventuelle** (la revue humaine dispose du lu ; une ré-émission ou une lecture ultérieure affinera les écarts).
- **⚠️ `expired` best-effort.** RCCM/CFE n'ont pas d'échéance stricte en v1 ; `flags.expired` est **paramétrable** et **par défaut `false`** (jamais de fausse alerte). Le champ existe au contrat (extensible sans rupture) ; la règle de validité par type est à affiner sur pièces réelles.
- **⚠️ `unreadable` ≠ poison-pill.** Une pièce lue mais illisible (confiance sous seuil) **produit** un `document.extrait` (`unreadable=true`) — elle **n'est jamais** transformée en message ignoré. Seule l'**enveloppe structurellement invalide** est ignorée (STORY-042).
- **Normalisation de comparaison.** La dénomination lue par OCR est **bruitée** (accents, casse, espaces, ponctuation, forme juridique accolée « SARL »). Le comparateur **normalise agressivement** avant égalité pour éviter les **faux `mismatch`** ; en cas de doute, préférer **ne pas** signaler d'écart (l'humain relira) plutôt qu'une fausse alerte. Comparaison **exacte après normalisation** en v1 (pas de fuzzy/Levenshtein — extensible).
- **`eventId` dérivé.** L'`eventId` de `document.extrait` (`${incomingEventId}:extrait`) est **déterministe** : même si (cas de course rarissime) deux enqueues survenaient, l'unicité de `OutboxEvent.eventId` + la dédup aval (STORY-045) préviennent tout double effet.
- **Relais outbox au boot.** Broker indisponible ⇒ le relais **re-tente** (les `PENDING` s'accumulent, publiés au retour du broker) — aucune perte, tolérance à la panne prouvée en docker.

---

## Dependencies

**Stories prérequises :**
- **STORY-042** (`document-service` : consumer idempotent `kyc.document.uploaded` + OCR + extraction RCCM/CFE ; `ExtractionService` conçu pour extension) : **le socle étendu ici** — *done*.
- **STORY-041** (scaffold `document-service` : `KafkaModule`, base `document_service`, MinIO lecture) — *done*.
- **STORY-040** (`kyc-service` émet `kyc.document.uploaded` v1) — *done*.
- **Contrat `identity.*` v1 d'`auth-service`** (`identity.org.created`/`identity.org.updated` — source de vérité `architecture-auth-service`, producteur `identity-events.service`) : **le read-model d'identité consommé** — *disponible* (émis par `auth-service`).
- **STORY-036** (`bilan-service` : read-model idempotent — `*Consumer` bootstrap + `ProcessedEvent` + projection transactionnelle) : **patron read-model** à dupliquer/adapter — *done*.
- **STORY-040 / STORY-034** (outbox transactionnel `kyc-service` / `catalog` : `OutboxEvent` + `OutboxService.enqueue(session)` + `OutboxRelayService`) : **patron outbox producteur** à dupliquer — *done*.

**Stories bloquées (débloquées par celle-ci) :**
- **STORY-044** (persistance `DocumentExtraction` keyée `orgId` + GET consultation) — persiste le résultat **dans la transaction étendue** ici (marqueur + outbox + `DocumentExtraction`).
- **STORY-045** (`kyc-service` consomme `document.extrait` → enrichit le dossier de revue) — **consomme le contrat produit ici**.
- Chaîne KYC complète e2e docker (STORY-049) + revue `admin-panel` (flux A).

**Dépendances externes :** Kafka + MinIO + Mongo (compose racine) ; `auth-service` **émettant** `identity.*` (déjà en place) ; **Tesseract** (STORY-041) — **aucune** nouvelle dépendance système.

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche **`MNV-043`** (branchée depuis `dev`, **rebasée sur `origin/dev`** avant de coder — repo `prospera-ocr-service`).
- [ ] Tests unitaires écrits et verts (seuils Jest **65/90/90/90**) :
  - [ ] **Read-model identité** : `org.created` puis `org.updated` (nom changé) → projection à jour ; rejeu même `eventId` → ignoré ; `updated` sans `name` → dénomination conservée.
  - [ ] **Comparateur** : égal (aucun écart) / différent (`mismatch`) / lu absent (`missing_read`) / déclaré absent (`missing_declared`) ; normalisation (accents/casse/espaces) ne crée pas de faux écart ; déclaré indisponible → `discrepancies: []`.
  - [ ] **Drapeaux** : `unreadable` (confiance < seuil / aucun champ) ; `expired` (défaut `false` ; vrai si date échue selon règle).
  - [ ] **Émission outbox** : `markProcessedAndEmit` crée marqueur **et** `OutboxEvent` **dans la même tx** ; E11000 (rejeu) → aucun des deux ; `eventId` de sortie dérivé attendu ; payload conforme.
  - [ ] **Relais** : `PENDING` → publié → `PUBLISHED` ; échec de publication → `attempts++`, reste `PENDING`.
- [ ] Tests e2e / docker verts :
  - [ ] `register` (auth) → `identity.org.created` projeté → dépôt RCCM+CFE (kyc) → **2 `document.extrait`** émis (écarts + drapeaux) ; `OutboxEvent` `PUBLISHED` ; **aucun** statut KYC touché.
  - [ ] Rejeu (`fromBeginning` / restart) → **aucune** double émission.
  - [ ] Déclaré absent (upload avant projection) → émission **dégradée** (`declared` vide, `discrepancies` vide).
- [ ] ESLint **0 warning** ; build image `runtime` OK.
- [ ] **Vérification docker bout-en-bout** réalisée et consignée en §Revue & validation (stack auth+kyc+document ; read-model identité peuplé ; `document.extrait` émis avec écarts/drapeaux ; idempotence prouvée par rejeu ; dégradation déclaré-absent).
- [ ] CI verte (matrice 6 services ; nouveau code couvert en unitaire, broker/minio non requis en CI).
- [ ] `/code-review` passé (constats traités ou tracés pour 044/045).
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR **`MNV-043(document-service): …`** ouverte puis intégrée sur `dev` en **« Rebase and merge »** ; branche supprimée après merge.
- [ ] `sprint-status.yaml` mis à jour (STORY-043 → done, note de vérification + `completed_date`).

---

## Story Points Breakdown

- **Read-model d'identité (`identity.*`) :** 1,5 point (contrat dupliqué + consumer bootstrap groupe `document-identity` + projection transactionnelle idempotente `org.created`/`org.updated` — duplication guidée du patron `bilan-service`).
- **Comparaison + drapeaux :** 1,5 point (comparateur avec normalisation robuste au bruit OCR + 3 `kind` d'écart + dégradation déclaré-absent ; calculateur `expired`/`unreadable` + seuils).
- **Producteur `document.extrait` (outbox) :** 1,5 point (contrat produit v1 + `OutboxEvent`/`OutboxService`/`OutboxRelayService` dupliqués + **producteur Kafka** (premier de `document-service`) + enqueue **dans la tx** du marqueur).
- **Frontend :** 0 point.
- **Testing :** 0,5 point (unit comparateur/drapeaux/projection/émission + e2e docker chaîne réelle).
- **Total :** 5 points.

**Rationale :** les **patrons** (read-model idempotent `bilan-service`, outbox transactionnel `kyc`/`catalog`) sont **déjà éprouvés** et le pipeline d'extraction est **posé** (STORY-042) — la valeur ajoutée est le **branchement du déclaré** (read-model `identity.*` local), la **logique de comparaison/drapeaux** (nouveau code métier, cœur de DO-1 : signaler sans décider) et la **fiabilité d'émission** (premier producteur, atomicité marqueur+outbox). La persistance du résultat est reportée sur STORY-044.

---

## Additional Notes

- **Invariant DO-1 (cœur de cette story).** STORY-043 **produit des signaux** (écarts, drapeaux) ; elle ne **décide** rien. `document.extrait` **enrichit** le dossier ; l'approbation reste **humaine** (kyc-service + admin-panel). Aucune écriture de statut, aucun appel sortant vers `kyc-service`.
- **Résolution du `declared` — décision figée.** Conformément à `architecture-kyc-service` §Point de coordination : le déclaré est résolu **en aval**, dans `document-service`, via un **read-model `identity.*` local** (et non via le payload `kyc.document.uploaded`, qui ne le porte pas). v1 compare au niveau **organisation** (dénomination/pays) — le niveau le plus fiable et le plus utile à la revue ; l'extension user/membership est différée.
- **État absolu partout (C7/P9).** Read-model d'identité (`$set`), contrat `document.extrait` (état absolu, BACKWARD) : rejouables, ordre garanti par partition `orgId`, cohérence éventuelle assumée.
- **Extension, pas réécriture.** `ExtractionService`, les parseurs et le consumer de STORY-042 sont **conservés** ; STORY-043 **greffe** la résolution/comparaison/émission sur la transaction existante. STORY-044 **greffera** la persistance sur la **même** transaction (marqueur + outbox + `DocumentExtraction` atomiques).
- **Duplication assumée (K4).** Contrat `identity.*` consommé, contrat `document.extrait` produit, `OutboxEvent`/`OutboxService`/relais, `ProcessedEvent`, `isDuplicateKeyError` sont **copiés** (pas de lib partagée en phase 1) ; `schemaVersion` + docs d'architecture bornent la dérive. Factorisation différée (règle « au 3ᵉ usage »).
- **Extensibilité.** Le comparateur et les drapeaux sont la **fondation** du contrôle OCR PROSPERA : nouveaux champs comparés (pays, n°), règles d'échéance par type, comparaison fuzzy — tous ajoutables **sans** rupture de contrat (`document.extrait` en état absolu, BACKWARD).

---

## Progress Tracking

**Status History :**
- 2026-07-15 : Créée par Scrum Master (BMAD create-story)
- 2026-07-15 : Implémentée + vérifiée docker + `/code-review` (1 bug corrigé) + intégrée sur `dev` par Claude (BMAD dev-story)

**Actual Effort :** ~5 points (conforme à l'estimation)

---

## Revue & validation

### Implémentation

Extension de `ExtractionService` (STORY-042) **sans réécriture**, en calquant le patron read-model idempotent de `bilan-service` (STORY-036) et le patron outbox transactionnel de `kyc-service` (STORY-040).

- **Read-model d'identité** : `kafka/events/identity-events.ts` (contrat `identity.org.created`/`updated` dupliqué, K4) + `modules/read-models/` (`IdentityConsumer` bootstrap group `document-identity` + `OrgIdentityProjectionService` transactionnelle idempotente + `OrgIdentity` schéma keyé `organizationId` + `OrgIdentityReadModel.findDeclared`). `ProcessedEvent` **partagé** (collection `processed_events`).
- **Comparaison + drapeaux** : `modules/extraction/comparison/` — `IdentityComparator` (normalisation NFD/casse/ponctuation → écarts `mismatch`/`missing_read`/`missing_declared`, v1 = dénomination) + `DocumentFlags` (`unreadable` = confiance < `OCR_MIN_CONFIDENCE` (déf 40) ou aucun champ ; `expired` best-effort via `OCR_DOCUMENT_VALIDITY_MONTHS`, déf `0` = off).
- **Producteur `document.extrait`** : `kafka/events/document-events.ts` (contrat v1 état absolu) + `kafka/outbox/` (`OutboxEvent`/`OutboxService.enqueue(session)`/`OutboxRelayService`) + `KafkaProducerService` (**1er producteur** du service, ajouté à `KafkaModule`). `ExtractionService.markProcessedAndEmit` : marqueur `ProcessedEvent` **+** `enqueue(document.extrait)` **dans une seule transaction** (atomiques, exactement-une-fois). `eventId` dérivé `${eventId}:extrait`.
- **Dégradation gracieuse** : org non projetée → `declared {}`, `discrepancies []` (aucun écart fabriqué). **DO-1** : aucune écriture de statut KYC.

### Qualité

- **ESLint** : 0 warning. **173 unit / 31 suites** ; couverture **98.98 stmts / 91.54 branches / 98.44 funcs / 98.89 lines** (seuils 65/90/90/90 tenus). **14 e2e / 4 suites**.
- Couvre : projection identité (idempotence, `org.updated` sans `name` ne remplace pas), comparateur (4 `kind` + normalisation anti-bruit + dégradation), drapeaux (seuils `unreadable`/`expired`), outbox (`enqueue` dans la tx, relais publish/SENT/retry/FAILED, ordre par partition), producteur, émission `document.extrait` (payload/`eventId` dérivé, skip au rejeu), **régression `minimize:false`**.

### /code-review (high) & corrections

`/code-review` (high) → **1 bug corrigé** + 3 constats LOW différés :
1. **(correctness, HIGH)** Schéma `OutboxEvent` : le `minimize` **par défaut** de Mongoose **supprimait les sous-objets vides** (`extracted:{}` quand l'OCR ne reconnaît rien ; `declared:{}` en dégradé) du `payload` Mixed → `document.extrait` **amputé de champs requis** au contrat. **Découvert en vérif docker** (payload publié sans `extracted`). **Corrigé** : `@Schema({ …, minimize: false })` + **test de régression** (`OutboxEventSchema.get('minimize') === false`).
2. **(correctness, LOW, différé)** `normalizeForComparison` supprime les lettres non décomposables en NFD (`ß`, `ø`) comme ponctuation → écart `mismatch` possiblement spécieux (best-effort v1, signal, DO-1).
3. **(correctness, LOW, différé)** `DocumentFlags.isExpired` : `setUTCMonth(+validity)` déborde sur les fins de mois — inerte par défaut (`validity=0`).
4. **(reuse, LOW, différé)** `read-models/duplicate-key.util.ts` duplique celui d'`extraction` (K4 assumé, évite un cycle d'import).

### Vérification docker bout-en-bout (2026-07-15)

Stack `mongo` (rs0) + `kafka` + `minio` + `mailhog` + `auth-service:3001` + `kyc-service:3002` + `document-service:3006` (override `base`, hot-reload) :

- **/health** = 200 (mongo + kafka + minio `kyc-documents`). Les **deux** consommateurs (`document-identity` → `identity.org.*` ; `document-ocr` → `kyc.document.uploaded`) **rejoignent leurs groupes** après un retry transitoire au boot (broker indisponible → boot HTTP non bloqué — tolérance panne prouvée).
- **Read-model** : `register` (auth, `cabinetName='PROSPERA VERIF SARL'`, pays `CI`) → `identity.org.created` → `org_identities` **projeté** `{ denomination:'PROSPERA VERIF SARL', country:'CI', status:'ACTIVE' }`.
- **Pipeline nominal** : `verify` (Mailhog) → `login` (aud incl. `kyc-service`+`document-service`) → `POST /kyc/documents` RCCM + CFE (201×2) → `document-service` consomme : OCR **réel** tesseract (confidence 90) → **résolution du déclaré** → **2 `document.extrait` émis** via outbox (`status: SENT`, clé `orgId`, `eventId` `…:extrait`) portant `declared` résolu + `discrepancies:[{denomination, missing_read}]` + `flags:{unreadable:true,expired:false}` + `extracted:{}`. **Aucun** statut KYC touché.
- **Bug `minimize` vérifié en réel** : le payload publié **avant** correction **omettait** `extracted` (et aurait omis `declared:{}`) ; **après** `minimize:false` + redémarrage, un dépôt frais émet le payload **complet** (`extracted` présent).
- **Dégradé (déclaré absent)** : événement `kyc.document.uploaded` synthétique pour un `orgId` **non projeté** (clé valide, storageKey réel) → `document.extrait` émis **dégradé** : `declared:{}`, `discrepancies:[]` (`écarts=0`, aucun écart fabriqué), `extracted` présent.
- **Idempotence** : re-publication du **même** `eventId` → pré-contrôle « déjà traité », **aucune** double émission (`outbox_events` 5 → 5).

### Intégration

Repo **`prospera-ocr-service`** (branche `MNV-043` depuis `dev`, rebasée sur `origin/dev`). PR **#3 `MNV-043(document-service): …` → `dev` en « Rebase and merge »** (HEAD `336ed35`), branche supprimée. *(Le bloc `document-service` du `docker-compose.yml` racine reçoit `KAFKA_IDENTITY_GROUP_ID`/`OUTBOX_RELAY_*`/`OCR_MIN_CONFIDENCE`/`OCR_DOCUMENT_VALIDITY_MONTHS` — orchestration locale hors repo service ; sans impact, tous ont un défaut.)*

### Points d'attention

- **`extracted:{}` en vérif docker** : `sample.png` (asset de smoke) n'est pas une vraie pièce RCCM/CFE → aucun champ reconnu (best-effort correct). L'exactitude du parsing + de la comparaison sur de vrais libellés est couverte par les **tests unitaires** (`identity.comparator.spec`, parseurs STORY-042).
- **Ordre inter-topics** (`identity.org.*` vs `kyc.document.uploaded`, topics distincts) : cohérence éventuelle, dégradation gracieuse si l'org n'est pas encore projetée (prouvé en docker).
- **`expired`** désactivé par défaut (v1) — extensible via `OCR_DOCUMENT_VALIDITY_MONTHS` sans rupture de contrat.

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
