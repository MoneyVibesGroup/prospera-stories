# STORY-012 : Statut KYC + machine à états + notifications

**Epic :** EPIC-003 — KYC & validation du cabinet
**Réf. architecture :** S3.2
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Completed
**Assigné à :** vivian
**Créée le :** 2026-07-03
**Terminée le :** 2026-07-03
**Sprint :** 2
**Couvre :** FR-005

> **Note 2026-07-03 — code migré et adapté.** Cette story a été livrée **dans `expert-comptable`**, puis son code a été **déplacé vers le micro-service `kyc-service`** lors de l'extraction de l'EPIC-003 (voir STORY-020/021 et `docs/architecture-kyc-service-2026-07-03.md`). Adaptations : `KycStatusService` pilote désormais la collection locale `TenantKycProfile` (au lieu de `TenantsService`) et **publie** un événement `kyc-events` à chaque transition ; l'e-mail de soumission n'est plus envoyé par ce service mais par le consommateur d'événements côté `expert-comptable` (STORY-021). La story reste **Completed** (points acquis au Sprint 2).

---

## User Story

En tant que **super-admin de compte (`TENANT_ADMIN`)**,
je veux **suivre l'état de validation KYC de mon cabinet et être notifié quand mon dossier part en revue**,
afin de **savoir ce qu'il me reste à faire pour être validé**.

---

## Description

### Contexte

STORY-011 a posé l'**upload validé** des justificatifs (`KycDocument` : RCCM/CFE, stockés dans MinIO, métadonnées en base, statut `SUBMITTED`/`SUPERSEDED`). Mais le cabinet n'a **aucune visibilité** sur l'avancement, et rien ne fait avancer le `Tenant.kycStatus` (toujours `PENDING_DOCUMENTS` depuis l'inscription). STORY-012 apporte la **machine à états** et la **transparence** :

> Dès que le cabinet a déposé **RCCM et CFE**, son `kycStatus` passe automatiquement de `PENDING_DOCUMENTS` à `UNDER_REVIEW` et un **e-mail de confirmation de soumission** part au cabinet. À tout moment, `GET /kyc/status` renvoie l'**état courant** (statut, documents déposés, motif de rejet éventuel) — le cabinet sait précisément où il en est.

Trois propriétés sont critiques :

- **Machine à états contrôlée** : les transitions de `kycStatus` suivent un graphe **explicite** — `PENDING_DOCUMENTS → UNDER_REVIEW → APPROVED | REJECTED` (et, plus tard, `REJECTED → UNDER_REVIEW` en re-soumission — STORY-014). Une transition hors graphe est **refusée** (erreur interne, jamais un état incohérent). STORY-012 **implémente le graphe** et **applique** la transition `PENDING_DOCUMENTS → UNDER_REVIEW` ; STORY-013 (approve/reject) et STORY-014 (re-soumission) **réutiliseront** la même machine.
- **Transition automatique idempotente** : le passage en `UNDER_REVIEW` ne se déclenche **que** depuis `PENDING_DOCUMENTS`, **quand les deux** types (RCCM **et** CFE) ont un document `SUBMITTED`. Un ré-upload ultérieur (supersede, STORY-011) alors que le cabinet est déjà `UNDER_REVIEW` **ne re-déclenche ni transition ni e-mail** → **exactement un** e-mail de soumission par dossier.
- **Statut isolé par tenant** : `GET /kyc/status` et la transition lisent/écrivent **le tenant courant** (`tenantId` du contexte) ; jamais un autre cabinet.

Cette story **étend le `KycModule`** (nouveau `KycStatusService` — machine à états + `getStatus` + hook post-upload ; `GET /kyc/status`), **greffe un hook** dans `KycDocumentsService.upload` (STORY-011), **réutilise `TenantsService`** (lecture/mise à jour de `Tenant.kycStatus`) et **réutilise le `MailModule`** (nouveau job `SEND_KYC_SUBMITTED_EMAIL`, template `kyc-submitted.hbs`, handler dans `MailProcessor`).

### Périmètre

**Inclus :**
- **`KycStatusService`** (dans `KycModule`) : **machine à états** (graphe des transitions autorisées + `assertTransition(from, to)`), `getStatus()` (statut du tenant courant + documents `SUBMITTED` + motif de rejet éventuel), et `onDocumentSubmitted(userId)` (hook appelé après un upload réussi).
- **Transition automatique** `PENDING_DOCUMENTS → UNDER_REVIEW` : déclenchée par `onDocumentSubmitted` **quand** RCCM **et** CFE ont un document `SUBMITTED` **et** que le tenant est `PENDING_DOCUMENTS` ; met à jour `Tenant.kycStatus` (via la machine) puis **enfile** l'e-mail de soumission.
- **`GET /api/v1/kyc/status`** (`@Roles(TENANT_ADMIN, TENANT_USER)`) : renvoie `KycStatusResponseDto { kycStatus, documents[], rejectionReason?, reviewedAt? }` pour le **tenant courant**.
- **Hook dans `KycDocumentsService.upload`** (STORY-011) : après persistance du document, appelle `KycStatusService.onDocumentSubmitted(userId)`.
- **`TenantsService`** : + `updateKycStatus(tenantId, patch)` (mise à jour contrôlée du `kycStatus`, éventuellement `kycReviewedAt`/`kycRejectionReason` remis à zéro sur nouvelle soumission). `TenantsModule` importé par `KycModule`.
- **`MailModule`** : `sendKycSubmittedEmail(to, { firstName })`, template `kyc-submitted.hbs`, job `SEND_KYC_SUBMITTED_EMAIL { userId }`, handler dans `MailProcessor` (aiguillage par nom de job).
- **Producteur/consommateur anti-cycle** : `KycModule` enregistre `BullModule.registerQueue({ name: MAIL_QUEUE })` (**producteur**) ; le **consommateur** `MailProcessor` (MailModule) résout le destinataire via `UsersService` (déjà disponible).
- **Tests** unitaires (`KycStatusService` : machine à états, `onDocumentSubmitted` cas passant/no-op, `getStatus` ; `TenantsService.updateKycStatus` ; `MailerService.sendKycSubmittedEmail` ; handler `MailProcessor`) + e2e (upload RCCM seul → reste `PENDING` ; + CFE → `UNDER_REVIEW` + e-mail Mailhog ; `GET /kyc/status` 200/401/403 ; supersede sans re-transition).

**Hors périmètre :**
- **Revue admin global** (file d'attente `UNDER_REVIEW`, **URLs présignées** de consultation, `approve`/`reject` motivé, e-mails d'approbation/rejet) → **STORY-013**. STORY-012 pose la machine à états et l'état `UNDER_REVIEW` **que STORY-013 consommera**, mais **n'expose aucun** endpoint admin ni transition `APPROVED`/`REJECTED`.
- **Re-soumission après rejet** (`REJECTED → UNDER_REVIEW`, nouvelle version) → **STORY-014**. Le graphe **déclare** cette arête, mais STORY-012 ne la **déclenche pas** (le hook ne transite que depuis `PENDING_DOCUMENTS`).
- **`TenantStateGuard`** (blocage des modules métier selon `kycStatus`) → **STORY-014**.
- **Consultation/téléchargement des documents** (le cabinet ne récupère pas le binaire ; `GET /kyc/status` liste seulement les **métadonnées**) — la lecture par URL présignée est réservée à la revue admin (STORY-013).
- **Notifications d'approbation/rejet** → **STORY-013** (STORY-012 ne notifie **que** la soumission).

### Flux (utilisateur)

1. Un `TENANT_ADMIN` dépose son **RCCM** (`POST /kyc/documents`, STORY-011). `onDocumentSubmitted` s'exécute : un seul type présent → **pas** de transition. `GET /kyc/status` → `PENDING_DOCUMENTS`, 1 document.
2. Il dépose sa **carte CFE**. `onDocumentSubmitted` : **RCCM et CFE** présents **et** tenant `PENDING_DOCUMENTS` → transition **`UNDER_REVIEW`** + job `SEND_KYC_SUBMITTED_EMAIL` enfilé.
3. Le **`MailProcessor`** consomme le job : résout le destinataire (`userId` → e-mail/prénom via `UsersService`) et **envoie** l'e-mail « dossier reçu, en cours d'examen » (visible dans Mailhog).
4. `GET /kyc/status` → **`UNDER_REVIEW`**, 2 documents. Le cabinet sait qu'il n'a plus qu'à attendre la revue.
5. *(STORY-013)* Un admin global approuve/rejette → `APPROVED`/`REJECTED` (+ motif visible ici via `rejectionReason`). *(STORY-014)* Après rejet, une re-soumission repasse en `UNDER_REVIEW`.

---

## Acceptance Criteria

- [x] `GET /api/v1/kyc/status` (**membre du cabinet** : `TENANT_ADMIN` ou `TENANT_USER`) renvoie **200** avec `{ kycStatus, documents[], rejectionReason?, reviewedAt? }` pour le **tenant courant** ; `documents` liste les métadonnées des documents `SUBMITTED` (jamais le binaire ni la `storageKey`). Sans token → **401** ; `PLATFORM_ADMIN` → **403**. *(Vérifié e2e + docker.)*
- [x] Quand **RCCM et CFE** ont chacun un document `SUBMITTED` **et** que le tenant est `PENDING_DOCUMENTS`, le `kycStatus` passe **automatiquement** en **`UNDER_REVIEW`** à l'upload (déclenché par le hook post-upload de STORY-011). *(Vérifié unitaire + e2e + docker + invariant Mongo.)*
- [x] Un upload d'un **seul** type (RCCM sans CFE, ou l'inverse) **ne transite pas** : le tenant reste `PENDING_DOCUMENTS` et **aucun** e-mail n'est envoyé. *(Vérifié e2e + docker.)*
- [x] La transition en `UNDER_REVIEW` **n'a lieu qu'une fois** : un ré-upload (supersede) alors que le tenant est déjà `UNDER_REVIEW` **ne re-déclenche ni transition ni e-mail** (idempotence). *(Vérifié e2e + docker : un seul e-mail Mailhog après un ré-upload.)*
- [x] Les transitions de `kycStatus` sont **contrôlées par une machine à états** : seules `PENDING_DOCUMENTS → UNDER_REVIEW`, `UNDER_REVIEW → APPROVED`, `UNDER_REVIEW → REJECTED` et `REJECTED → UNDER_REVIEW` sont autorisées ; une transition hors graphe est **refusée** (erreur interne, jamais un état incohérent). STORY-012 **applique** `PENDING_DOCUMENTS → UNDER_REVIEW` ; les autres arêtes sont **déclarées** pour STORY-013/014. *(Vérifié unitaire : arêtes autorisées OK, hors graphe rejeté.)*
- [x] Un **e-mail de confirmation de soumission** est envoyé **au cabinet** (via le worker Bull `mail`, retry ×5) et **apparaît dans Mailhog** lorsqu'un dossier passe en `UNDER_REVIEW` — **exactement un** par soumission. *(Vérifié docker : 1 e-mail Mailhog, toujours 1 après ré-upload.)*
- [x] **Isolation** : `GET /kyc/status` et la transition ne concernent que le **tenant courant** ; le statut/les documents d'un autre cabinet ne fuient jamais. *(Vérifié e2e + docker : tenant B reste `PENDING_DOCUMENTS` après la transition de A.)*
- [x] `docker compose up` : parcours vérifiable (upload RCCM → `PENDING` ; + CFE → `UNDER_REVIEW` + e-mail Mailhog ; `GET /kyc/status` cohérent) — **12/0** ; tests des stories précédentes **verts** ; **lint 0 warning** ; **couverture** ≥ seuils (90/65/90/90).

---

## Technical Notes

### Composants / fichiers
```
src/modules/kyc/kyc-status.service.ts             # machine à états + getStatus + onDocumentSubmitted (nouveau)
src/modules/kyc/kyc-status.service.spec.ts        # (nouveau)
src/modules/kyc/kyc.controller.ts                 # + GET /kyc/status
src/modules/kyc/kyc-documents.service.ts          # + appel onDocumentSubmitted après persistance (hook)
src/modules/kyc/kyc.module.ts                     # + KycStatusService, import TenantsModule, registerQueue(MAIL_QUEUE)
src/modules/kyc/dto/kyc-status-response.dto.ts     # { kycStatus, documents[], rejectionReason?, reviewedAt? } (nouveau)

src/modules/tenants/tenants.service.ts            # + updateKycStatus(tenantId, patch)
src/modules/tenants/tenants.module.ts             # (exporte déjà TenantsService)

src/modules/mail/mail.constants.ts                # + SEND_KYC_SUBMITTED_EMAIL_JOB, KycSubmittedEmailJobData
src/modules/mail/mailer.service.ts                # + sendKycSubmittedEmail
src/modules/mail/templates/kyc-submitted.hbs       # template e-mail de soumission (nouveau)
src/modules/mail/mail.processor.ts                # + handler SEND_KYC_SUBMITTED_EMAIL (dispatch par job.name)
```

### Machine à états (`KycStatusService`)
- Graphe **déclaratif** des transitions autorisées :
  ```
  PENDING_DOCUMENTS → { UNDER_REVIEW }
  UNDER_REVIEW      → { APPROVED, REJECTED }
  REJECTED          → { UNDER_REVIEW }
  APPROVED          → {}            (état terminal en phase 1)
  ```
- `assertTransition(from, to)` : lève si `to ∉ allowed[from]` — **erreur interne** (remonte en 500 générique), car c'est un bug de logique, jamais une entrée client.
- `onDocumentSubmitted(userId)` :
  1. lit le tenant courant (`TenantsService.findById(tenantContext.tenantId)`) ;
  2. si `kycStatus !== PENDING_DOCUMENTS` → **no-op** (re-soumission = STORY-014 ; déjà en revue/approuvé = rien à faire) ;
  3. vérifie la présence d'un `SUBMITTED` pour **chaque** type via le repository scoping (`exists({ type, status: SUBMITTED })` pour RCCM et CFE) ;
  4. si les deux présents → `assertTransition(PENDING_DOCUMENTS, UNDER_REVIEW)` puis `TenantsService.updateKycStatus(tenantId, { kycStatus: UNDER_REVIEW })` puis **enfile** `SEND_KYC_SUBMITTED_EMAIL { userId }`.
- `getStatus()` : lit le tenant courant + les documents `SUBMITTED` (repository scoping) → `KycStatusResponseDto`.

### Endpoint
- `GET /api/v1/kyc/status` → **200** `KycStatusResponseDto`. `@Roles(TENANT_ADMIN, TENANT_USER)` (surcharge le `@Roles(TENANT_ADMIN)` du contrôleur : la **lecture** du statut est ouverte à tout membre ; l'**upload** reste `TENANT_ADMIN`).
- `KycStatusResponseDto` réutilise `KycDocumentResponseDto.fromDocument` pour le tableau `documents`.

### E-mail de soumission (réutilise `MailModule`)
- **Job** `SEND_KYC_SUBMITTED_EMAIL` avec `KycSubmittedEmailJobData { userId }` — le job ne porte **que** l'id du destinataire (cohérent avec les autres jobs). Le **`MailProcessor`** résout `email`/`firstName` via `UsersService.findById` (déjà injecté) et appelle `sendKycSubmittedEmail`. Aucun token, aucun lien secret : e-mail **purement informatif** (« dossier reçu, en cours d'examen »).
- **Anti-cycle** : `KycModule` est **producteur** (`BullModule.registerQueue({ name: MAIL_QUEUE })`, comme `UsersModule`) — il **n'importe pas** `MailModule`. Le consommateur reste `MailProcessor` (MailModule), qui **n'importe pas** `KycModule` (il n'a besoin que de `userId` → `UsersService`). Pas de cycle `Kyc ↔ Mail`.

### Sécurité / cohérence
- **Isolation** : lecture des documents via `KycDocumentsRepository` scoping ; lecture/écriture du tenant via `TenantsService.findById(tenantContext.tenantId)` (le tenant est keyé par son propre `_id` = `tenantId` du contexte).
- **Idempotence de l'e-mail** : la transition (et donc l'enfilage) ne se produit **que** depuis `PENDING_DOCUMENTS` → un seul e-mail par soumission, même en cas de ré-upload.
- **Pas de secret exposé** : `GET /kyc/status` renvoie des métadonnées (via `KycDocumentResponseDto`) — jamais `storageKey`, binaire ou URL.
- **Ordre dans `upload`** : le hook `onDocumentSubmitted` s'exécute **après** la persistance réussie du document (STORY-011) ; un échec de transition (rare) n'invalide pas l'upload — le prochain upload ré-évaluera l'état.

### Cas limites
- **Deux fois le même type** (2× RCCM, pas de CFE) → un seul type distinct présent → **pas** de transition.
- **CFE déposé en premier, puis RCCM** → transition au 2ᵉ upload (ordre indifférent).
- **Ré-upload après passage en `UNDER_REVIEW`** → supersede (STORY-011), mais **no-op** côté statut (déjà `UNDER_REVIEW`).
- **`GET /kyc/status` avant tout upload** → `PENDING_DOCUMENTS`, `documents: []`.
- **Tenant `REJECTED`** (posé par STORY-013) → `getStatus` renvoie le `rejectionReason` ; le hook reste **no-op** (re-soumission = STORY-014).

---

## Dependencies

**Stories prérequises :**
- **STORY-011** ✅ (`KycModule`, `KycDocument` `SUBMITTED`/`SUPERSEDED`, `KycDocumentsRepository` scoping, `KycDocumentsService.upload` — point de greffe du hook, `KycDocumentResponseDto`).
- **STORY-004** ✅ (schéma `Tenant` avec `kycStatus`/`kycReviewedAt`/`kycRejectionReason`, `TenantsService`, `TenantsModule`).
- **STORY-006/008** ✅ (`MailModule` : `MailerService`, `MailProcessor` dispatch multi-job, `UsersService` pour résoudre le destinataire, Bull retry ×5 ; patron producteur/consommateur anti-cycle).

**Stories débloquées par celle-ci :**
- **STORY-013** (revue admin : consomme l'état `UNDER_REVIEW`, réutilise la machine pour `APPROVED`/`REJECTED`).
- **STORY-014** (re-soumission : réutilise l'arête `REJECTED → UNDER_REVIEW` du graphe + `TenantStateGuard` sur `kycStatus`).

**Dépendances externes :** aucune en dev (Mailhog fourni). Nouveau template `kyc-submitted.hbs` (asset `**/*.hbs` déjà copié vers `dist`). Aucune nouvelle dépendance npm.

---

## Definition of Done

- [x] Code implémenté (branche de travail locale, non commitée — voir note sous « Progress Tracking »).
- [x] Tests :
  - [x] Unitaire `KycStatusService` : machine à états (arêtes autorisées OK / hors graphe rejeté) ; `onDocumentSubmitted` (deux types + `PENDING` → transition + enfilage ; un seul type → no-op ; déjà `UNDER_REVIEW` → no-op ; tenant introuvable → no-op ; échec de mise en file → journalisé, non bloquant) ; `getStatus` (mappe tenant + documents `SUBMITTED` + motif de rejet ; tenant introuvable → erreur interne).
  - [x] Unitaire `TenantsService.updateKycStatus` (mise à jour du bon tenant).
  - [x] Unitaire `MailerService.sendKycSubmittedEmail` + handler `MailProcessor` (`SEND_KYC_SUBMITTED_EMAIL` : résout le destinataire, envoie ; utilisateur introuvable → no-op journalisé ; échec d'envoi → propagé).
  - [x] e2e : upload RCCM → `PENDING` ; + CFE → `UNDER_REVIEW` + e-mail enfilé ; supersede sans re-transition/re-enfilage ; `GET /kyc/status` 200 (statut + docs) / 401 / 403 (`PLATFORM_ADMIN`) ; **isolation** cross-tenant.
- [x] `npm run test:cov` respecte les seuils (90/65/90/90) ; `npm run test:e2e` vert.
- [x] Lint (`eslint --max-warnings 0`) et `nest build` OK ; tests précédents toujours verts.
- [x] `GET /kyc/status` documenté dans **Swagger** (tag `kyc`).
- [x] `docker compose up` : transition `PENDING → UNDER_REVIEW` vérifiée (RCCM + CFE), e-mail présent dans Mailhog (exactement 1, idempotent après ré-upload), `GET /kyc/status` cohérent, isolation confirmée, invariant Mongo (`Tenant.kycStatus`) confirmé.
- [ ] Revue de code (`/code-review`) — non lancée dans cette session ; à faire avant merge. Points d'attention : **idempotence** de la transition/e-mail, **câblage producteur/consommateur** (anti-cycle), **isolation**.
- [x] Tous les critères d'acceptation validés.

---

## Story Points Breakdown

- **`KycStatusService`** (machine à états + `getStatus` + `onDocumentSubmitted`) + hook dans `upload` : **1.5 pt**
- **`GET /kyc/status`** + `KycStatusResponseDto` + `TenantsService.updateKycStatus` : **0.5 pt**
- **`MailModule`** (`sendKycSubmittedEmail` + template + job + handler) + câblage producteur : **0.5 pt**
- **Tests** unitaires & e2e (transition, idempotence, Mailhog, isolation) : **0.5 pt**
- **Total : 3 points**

**Rationale :** la story **réutilise fortement** l'existant — `KycModule`/`KycDocument` (STORY-011), `Tenant.kycStatus` (déjà au schéma), `MailModule` et son patron producteur/consommateur (STORY-006/008). L'essentiel est une **machine à états** compacte + un **hook** + un **endpoint de lecture** + un **e-mail**. Surface de test modérée (idempotence, cas un-seul-type, isolation). Cohérent avec l'estimation initiale de 3 pts.

---

## Additional Notes

### Décisions ouvertes (à trancher à l'implémentation)

1. **Localisation de la machine à états** — **Recommandé :** `KycStatusService` **dans `KycModule`** (logique de domaine KYC), qui lit/écrit le tenant via `TenantsService`. *Alternative :* méthodes de transition dans `TenantsService` — écartée (mêle la logique KYC au service tenant générique).
2. **Rôle sur `GET /kyc/status`** — **Recommandé :** `@Roles(TENANT_ADMIN, TENANT_USER)` (tout membre peut consulter l'état — transparence). *Alternative :* `TENANT_ADMIN` seul (aligné au strict user story) — acceptable, mais moins utile aux collaborateurs.
3. **Destinataire de l'e-mail de soumission** — **Recommandé :** l'**auteur du dernier upload** (`userId` du job), un `TENANT_ADMIN`. *Alternative :* **tous** les `TENANT_ADMIN` actifs du cabinet — plus complet, mais surcoût (boucle d'envoi) ; repli si besoin produit.
4. **Contenu de l'e-mail** — **Recommandé :** informatif, **sans lien** (pas de front en phase 1 ; « votre dossier est en cours d'examen »). *Alternative :* lien vers un futur écran de statut (quand un front existera).
5. **`updateKycStatus` et champs de revue** — **Recommandé :** à la transition `PENDING → UNDER_REVIEW`, ne toucher **que** `kycStatus` (les champs `kycReviewed*`/`kycRejectionReason` sont gérés par STORY-013). *Note :* STORY-014 remettra `kycRejectionReason` à zéro lors d'une re-soumission.
6. **Comptage des types présents** — **Recommandé :** deux `exists({ type, status: SUBMITTED })` (RCCM, CFE) via le repository scoping — lisible et scoping. *Alternative :* une agrégation `distinct` — inutilement complexe pour 2 types.

### Notes diverses
- **Réutilisabilité** : la machine à états (`assertTransition`) est **le** point d'extension de l'EPIC-003 — STORY-013 l'appelle pour `APPROVED`/`REJECTED`, STORY-014 pour `REJECTED → UNDER_REVIEW`.
- **Producteur/consommateur** : `KycModule` enregistre `MAIL_QUEUE` (producteur), `MailProcessor` (MailModule) reste le consommateur — **évite le cycle `Kyc ↔ Mail`** (patron identique à `UsersModule`, STORY-008).
- **Aucun changement de schéma** : `Tenant.kycStatus` (+ `kycReviewedAt`/`kycReviewedBy`/`kycRejectionReason`) existent depuis STORY-004 ; `KycDocument` depuis STORY-011.

---

## Progress Tracking

**Historique de statut :**
- 2026-07-03 : Créée (Scrum Master, BMAD)
- 2026-07-03 : Implémentée, testée et vérifiée sur docker — ✅ Completed (Developer, BMAD)

**Effort réel :** 3 points (conforme à l'estimation).

---

## Notes d'implémentation

### Décisions ouvertes — tranchées
1. **Localisation de la machine à états** : `KycStatusService` dans `KycModule`, comme prévu — lit/écrit le tenant via `TenantsService.findById`/`updateKycStatus`.
2. **Rôle sur `GET /kyc/status`** : `@Roles(TENANT_ADMIN, TENANT_USER)` — ouvert à tout membre du cabinet (surcharge la restriction `TENANT_ADMIN` du contrôleur).
3. **Destinataire de l'e-mail de soumission** : l'auteur du dernier upload (`userId` passé au hook), comme prévu.
4. **Contenu de l'e-mail** : informatif, sans lien ni token (`kyc-submitted.hbs`).
5. **`updateKycStatus`** : simplifié par rapport au plan initial — accepte directement `(tenantId, kycStatus: KycStatus)` plutôt qu'un objet `patch` générique. STORY-012 n'a besoin de modifier que ce seul champ ; les champs `kycReviewedAt`/`kycReviewedBy`/`kycRejectionReason` seront ajoutés à la signature quand STORY-013 en aura réellement besoin (évite de construire une API pour un besoin hypothétique).
6. **Comptage des types présents** : deux `exists({ type, status: SUBMITTED })` (RCCM, CFE) via le repository scoping, exécutés en parallèle (`Promise.all`), comme prévu.

### Écarts / points notables vs. plan
- **Câblage anti-cycle** appliqué tel que prévu : `KycModule` enregistre `BullModule.registerQueue({ name: MAIL_QUEUE })` (**producteur**) → `KycStatusService` injecte la file (`@InjectQueue`) sans importer `MailModule`. Le **consommateur** `MailProcessor` (MailModule) aiguille désormais sur un 3ᵉ nom de job (`send-kyc-submitted-email`) et ne dépend que de `UsersService`/`MailerService` déjà injectés — aucune dépendance à `KycModule`.
- **Hook post-upload** : `KycDocumentsService` injecte directement `KycStatusService` (les deux services vivent dans le même module, pas de cycle : `KycStatusService` ne dépend que de `KycDocumentsRepository`, jamais de `KycDocumentsService`). Le hook s'exécute **après** la persistance du document — un échec de transition n'invalide jamais l'upload déjà réalisé.
- **Environnement docker** : lors de la vérification, le conteneur `minio` était sorti (`Exited`) suite à une interruption antérieure de session, indépendamment du code de cette story — un `docker compose up -d minio` puis `docker compose restart app` (pour laisser `StorageBootstrapService` re-confirmer le bucket) a résolu le problème avant de lancer le script de vérification.

### Fichiers clés
- **Kyc** : `kyc-status.service.ts` (machine à états, `getStatus`, `onDocumentSubmitted`), `kyc-documents.service.ts` (hook `onDocumentSubmitted` après persistance), `kyc.controller.ts` (`GET /kyc/status`), `kyc.module.ts` (producteur `MAIL_QUEUE`, import `TenantsModule`), `dto/kyc-status-response.dto.ts`.
- **Tenants** : `tenants.service.ts` (`updateKycStatus`).
- **Mail** : `mail.constants.ts` (`SEND_KYC_SUBMITTED_EMAIL_JOB`, `KycSubmittedEmailJobData`), `mailer.service.ts` (`sendKycSubmittedEmail`), `templates/kyc-submitted.hbs`, `mail.processor.ts` (dispatch 3ᵉ job).

### Résultats de vérification
- **Unitaires** : `39 suites / 254 tests` — verts. Couverture globale **99.43 % stmts / 89.17 % branches / 98.88 % fn / 99.4 % lignes** (seuils 90/65/90/90). `kyc-status.service.ts` : 100 % lignes/fn/stmts (87.5 % branches — une branche non couverte du ternary `error instanceof Error`, identique au gap déjà toléré dans `invitation.service.ts`).
- **e2e** : `11 suites / 83 tests` — verts (dont `kyc-status.e2e-spec.ts` : 8 tests — auth/rôle, état initial, transition, idempotence, isolation ; `kyc-documents.e2e-spec.ts` mis à jour pour la nouvelle dépendance `KycStatusService`).
- **Lint** : `0 warning`. **Build** `nest build` OK (asset `kyc-submitted.hbs` copié dans `dist`).
- **Docker (`docker compose up --build`) — 12/0** : upload RCCM seul → `PENDING_DOCUMENTS` (1 doc, 0 e-mail) ; + CFE → `UNDER_REVIEW` (2 docs, 1 e-mail Mailhog) ; ré-upload RCCM (supersede, version 2) → toujours `UNDER_REVIEW`, toujours 1 seul e-mail (idempotence confirmée) ; tenant B indépendant (`PENDING_DOCUMENTS`, 0 doc) ; sans token → 401.
- **Invariant Mongo** : `tenants.kycStatus` = `UNDER_REVIEW` pour le cabinet A (après RCCM+CFE), `PENDING_DOCUMENTS` pour le cabinet B — confirmé par requête directe.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning)**
