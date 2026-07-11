# Technical Specification : document-service v1 (OCR KYC)

**Date :** 2026-07-10
**Auteur :** vivian
**Version :** 1.0
**Type de projet :** API (micro-service NestJS)
**Niveau de projet :** 1 (tech-spec courte)
**Statut :** Draft
**Écosystème :** PROSPERA / Money Vibes — Module 0 (chaîne KYC), flux B (AD-2, DO-1)

---

## Vue d'ensemble

`document-service` v1 est la capacité d'**OCR au service du KYC**. Il consomme l'événement de dépôt de pièce, **extrait** les données des documents RCCM/CFE (Tesseract derrière une abstraction `OcrProvider`), **compare le déclaré au lu**, détecte les pièces **expirées/illisibles**, puis publie `document.extrait` qui **enrichit le profil de revue**. **L'OCR assiste la revue humaine — il n'approuve jamais** (invariant DO-1).

**Documents liés :** PLAN FINAL `docs/synthese-services-prospera-2026-07-10.md` (Module 0, décisions AD-2 / DO-1) ; `docs/architecture-kyc-service-2026-07-03.md` (propriétaire du KYC et des pièces) ; `docs/architecture-prospera-ecosystem-2026-07-04.md` (moule : relying party, read-models, outbox — rev 1.3). Périmètre déjà cadré → tech-spec courte.

---

## Problème & solution

### Problème
Lors de la revue KYC, l'agent lit manuellement les pièces (RCCM, CFE) et vérifie qu'elles correspondent aux informations déclarées à l'inscription. C'est lent, manuel et non tracé. Il faut **assister** cette revue sans jamais **décider** à la place de l'humain.

### Solution
Un service qui, à chaque pièce déposée, exécute l'OCR via un **`OcrProvider`** (implémentation Tesseract en v1, remplaçable par un OCR managé sans toucher au métier), en extrait les champs clés (n° RCCM/CFE, raison sociale, dates), **compare** au déclaré, signale les écarts / la péremption / l'illisibilité, et publie le résultat pour l'enrichissement du dossier de revue.

---

## Exigences

### À construire
- **Consommateur** de `kyc.document.uploaded` (kyc-service) → récupère la pièce (MinIO) → OCR **idempotent** (marqueur `eventId`).
- **Abstraction `OcrProvider`** (interface) + implémentation **Tesseract** ; extraction des champs RCCM/CFE.
- **Comparaison déclaré vs lu** (valeurs d'inscription vs valeurs OCR) + **détection pièce expirée / illisible** (score de confiance / seuils).
- **Producteur** de `document.extrait` (outbox transactionnel, patron STORY-027/021) : résultat d'extraction + écarts + drapeaux, keyé `orgId`/`documentId`.
- **Persistance** de l'extraction (base `document_service`), keyée `orgId`.

### Hors périmètre (v1)
- **Toute décision d'approbation** — l'humain valide (invariant DO-1) ; le service ne change jamais le statut KYC.
- **Extensions** (factures fournisseurs, dossiers de Crédit) → différées (mêmes patrons, nouveaux types de documents).
- Front de revue → `admin-panel` (flux A).
- Stockage des pièces sources → reste chez **kyc-service** (MinIO) ; document-service **lit**, ne possède pas la pièce.

---

## Approche technique

### Stack
Socle PROSPERA (NestJS 11 / Node 20 / TS strict / MongoDB 7 (`document_service`) / `kafkajs` / `passport-jwt`) + `common/` dupliqué + **outbox** (OutboxEvent/Relay, patron existant). **Spécifique :** `OcrProvider` (Tesseract via `tesseract.js` ou binaire `tesseract` conteneurisé), accès **MinIO** en lecture aux pièces. Port `:3006`.

### Aperçu d'architecture
```
kyc-service ──(Kafka) kyc.document.uploaded──►  document-service (:3006)
                                                   │  1. lit la pièce (MinIO)
   MinIO (pièces, propriété kyc) ◄────lecture──────┤  2. OcrProvider.extract() [Tesseract]
                                                   │  3. compare déclaré vs lu + flags (expiré/illisible)
                                                   │  4. persiste l'extraction (Mongo document_service)
   kyc-service ◄──(Kafka) document.extrait─────────┘  5. publie via outbox → enrichit le profil de revue
        (consomme document.extrait pour enrichir le dossier KYC ; admin-panel le voit via kyc-service)
```

### Modèle de données
- **`DocumentExtraction`** (base `document_service`, keyé `orgId`) : `{ organizationId, documentId, type: RCCM|CFE, extracted: {...champs}, declared: {...champs}, discrepancies: [...], flags: { expired, unreadable }, confidence, ocrProvider, processedAt }`.
- **`ProcessedEvent { eventId }`** — idempotence de consommation.
- **`OutboxEvent`** — publication fiable de `document.extrait`.

### Design d'API
Principalement **event-driven** (peu ou pas d'API HTTP publique en v1). Éventuel `GET /documents/:documentId/extraction` (relying party, `@Roles` restreint) pour consultation directe ; sinon l'extraction est vue via kyc-service/admin-panel.

### Contrats d'événements
- **Consomme** `kyc.document.uploaded` v1 (producteur kyc-service) : `{ eventId, orgId, documentId, type, storageRef, declared:{...} }`.
- **Produit** `document.extrait` v1 : état absolu de l'extraction (champs lus, écarts, flags, confidence), keyé `orgId`, `eventId`/`schemaVersion` (compatibilité BACKWARD, P9).

---

## Plan d'implémentation

### Stories (≈1 sprint)
1. **ST-DOC-1 — Scaffold** : relying party RS256/JWKS, base `document_service`, health, Kafka, **abstraction `OcrProvider` + impl Tesseract**, accès MinIO lecture.
2. **ST-DOC-2 — Consumer + OCR** : consommateur `kyc.document.uploaded` (idempotent) → lecture pièce → extraction RCCM/CFE → persistance `DocumentExtraction`.
3. **ST-DOC-3 — Comparaison + événement** : comparaison déclaré vs lu, détection expiré/illisible, **producteur `document.extrait`** (outbox).
4. **ST-DOC-4 (optionnel) — e2e docker** : upload pièce (kyc) → OCR → `document.extrait` → dossier de revue enrichi.

### Phases
Scaffold + provider → consumer + extraction → comparaison + publication → e2e chaîne KYC.

---

## Critères d'acceptation
- Une pièce déposée déclenche une **extraction** (RCCM/CFE) tracée, keyée `orgId`, **idempotente** (rejeu sans doublon).
- Les **écarts déclaré vs lu** et les **drapeaux** (expiré/illisible) sont produits et disponibles pour la revue.
- **Aucune** approbation automatique : le statut KYC reste piloté par l'humain (kyc-service).
- Basculer `OcrProvider` (Tesseract → autre) ne modifie **pas** le code métier (extraction/comparaison).

---

## Exigences non fonctionnelles
- **Performance :** OCR asynchrone (hors chemin requête) ; traitement d'une pièce en temps raisonnable ; retry sur échec transitoire.
- **Sécurité :** relying party RS256/JWKS ; accès MinIO en **lecture seule** aux pièces ; isolation `orgId` ; ne journalise pas le contenu des pièces.
- **Autre :** idempotence (`eventId`) ; outbox transactionnel ; Swagger si API exposée ; seuils Jest 65/90/90/90 ; e2e docker.

---

## Dépendances
- **kyc-service** — doit **émettre `kyc.document.uploaded`** et laisser lire la pièce (MinIO). ⚠️ **À vérifier** : STORY-020/021 émettent `kyc.status.changed` ; si `kyc.document.uploaded` n'est pas encore publié, prévoir une **petite story productrice côté kyc-service** (prérequis DO-1).
- **kyc-service (consumer)** — consomme `document.extrait` pour enrichir le dossier de revue (ownership du KYC préservé ; admin-panel lit via kyc-service).
- **MinIO** — registre des pièces (propriété kyc-service).
- **auth-service (IdP)** — `document-service` dans `AUTH_AUDIENCE` (si API exposée).
- **Kafka** — `kyc.document.uploaded` (in), `document.extrait` (out).

---

## Risques & mitigation
- **Qualité OCR Tesseract** sur pièces réelles (scans médiocres) → seuils de confiance ; drapeau « illisible » plutôt que fausse extraction ; `OcrProvider` remplaçable par un OCR managé (DO-1).
- **Événement source manquant** (`kyc.document.uploaded`) → vérifier/ajouter la publication côté kyc-service (prérequis).
- **Confusion des rôles** (OCR qui « valide ») → invariant strict : propose, ne décide pas ; le statut KYC reste chez kyc-service + humain.
- **Données sensibles** (pièces d'identité d'entreprise) → lecture seule, pas de log de contenu, isolation `orgId`.

---

## Timeline
**Cible :** sept. 2026 (Module 0, livré en 2 flux avec admin-panel).
**Jalons :** scaffold + provider → OCR → comparaison + `document.extrait` → e2e chaîne KYC complète (upload → OCR → revue admin-panel → approbation).

---

## Approbation
- [ ] vivian (auteur)
- [ ] Tech lead
- [ ] Product Owner

---

## Prochaines étapes
`/bmad:sprint-planning` (ou `/bmad:create-story`) pour ST-DOC-1…4 à la fenêtre S7 (sept. 2026) ; en amont, confirmer l'émission de `kyc.document.uploaded` par kyc-service.

**Document créé avec BMAD Method v6 — Phase 2 (Planning) — tech-spec courte (AD-2 / DO-1).**
