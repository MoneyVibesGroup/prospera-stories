# STORY-014: TenantStateGuard (read-models KYC + identité) + re-soumission

**Epic:** EPIC-003 (KYC & matrice d'accès — FR-005 / FR-007)
**Priority:** Must Have
**Story Points:** 5
**Status:** Done
**Assigned To:** Unassigned
**Created:** 2026-07-10
**Sprint:** 6

---

## User Story

En tant que **plateforme PROSPERA (et cabinet utilisateur)**,
je veux que **l'accès aux capacités du vertical soit ouvert progressivement selon l'état réel du tenant (identité non suspendue → KYC approuvé → abonnement actif), et qu'un cabinet rejeté puisse re-soumettre ses documents**,
afin que **les modules métier ne soient jamais servis à un tenant non validé, sans dupliquer cette logique dans chaque endpoint, et qu'un rejet KYC ne soit pas définitif**.

---

## Description

### Contexte
Au cutover *relying party* (STORY-030), `expert-comptable` a introduit l'`IdentitySuspensionGuard` — 5ᵉ maillon de la chaîne de guards globaux — qui coupe l'accès (**403**) lorsqu'une org ou un utilisateur est **explicitement suspendu** dans les read-models d'identité (`identity.*`, STORY-029). Ce guard porte déjà en commentaire sa propre limite : *« Ne couvre que la suspension d'identité. La matrice complète (KYC + abonnement) est le TenantStateGuard de STORY-014, qui prendra place ici. »*

FR-007 exige une **matrice d'accès progressive** appliquée par un **guard global déclaratif**, lisant des **read-models locaux** (aucun appel réseau synchrone à `kyc-service` ni à l'IdP — chemin chaud autonome) :
- **e-mail vérifié** → gestion du compte (déjà porté par `EmailVerifiedGuard`) ;
- **+ KYC approuvé** → accès au paiement / checkout ;
- **+ abonnement actif** → modules métier.

Le read-model KYC est déjà en place : `OrgProfile.kycStatus` (`org_profiles`), réalimenté par le consommateur de `kyc.status.changed` (STORY-021). Cette story **fait entrer le KYC dans la matrice** en promouvant l'`IdentitySuspensionGuard` en **`TenantStateGuard`** déclaratif.

En parallèle, la machine à états KYC de `kyc-service` déclare déjà la transition de reprise `REJECTED → UNDER_REVIEW` (voir `ALLOWED_TRANSITIONS`), et le versioning documentaire (`SUPERSEDED` + `version`) existe depuis STORY-011 — **mais rien ne déclenche cette transition** : `onDocumentSubmitted` ne bascule qu'au départ de `PENDING_DOCUMENTS`. Un cabinet rejeté reste donc bloqué en `REJECTED`. Cette story **branche la re-soumission** (FR-005, dernier critère).

### Portée

**Inclus (`expert-comptable`) :**
- `TenantStateGuard` : évolution de l'`IdentitySuspensionGuard` (suspension identité conservée) **+ verrou KYC** lisant `OrgProfile.kycStatus`.
- **Décorateur déclaratif** exigeant un niveau de la matrice sur un handler/contrôleur (ex. `@RequiresKycApproved()`), avec **codes d'erreur explicites** (`KYC_NOT_APPROVED`).
- **État effectif d'accès** exposé au frontend (e-mail vérifié / KYC / abonnement) via un endpoint de lecture.
- Palier **abonnement** : *préparé* dans la matrice (constante de niveau + code `SUBSCRIPTION_REQUIRED`) mais **non applicable tant qu'aucun read-model d'abonnement n'existe** — l'enforcement réel est câblé en EPIC-004 (Module 2). Aucun faux positif : par défaut, aucun endpoint n'exige le palier abonnement.

**Inclus (`kyc-service`) :**
- **Re-soumission après rejet** : un ré-upload alors que le tenant est `REJECTED` bascule `REJECTED → UNDER_REVIEW` (transition atomique + événement `kyc.status.changed` via l'outbox, motif de rejet purgé). Le versioning documentaire (`SUPERSEDED`/`version`) existant est réutilisé, pas réécrit.

**Hors périmètre :**
- Palier abonnement **applicable** (création de checkout, statut de souscription) → EPIC-004 / Module 2.
- Gate KYC **rejoué dans `bilan-service`** (relying party partagé) → hors de ce vertical (architecture P7/P8).
- Toute revalidation OCR automatique de la re-soumission → `document-service` (Module 0, EPIC-015).

### User Flow

**A — Accès verrouillé par le KYC (expert-comptable) :**
1. Un utilisateur d'un tenant `PENDING_DOCUMENTS` / `UNDER_REVIEW` / `REJECTED` appelle un endpoint annoté `@RequiresKycApproved()`.
2. Le `TenantStateGuard` lit `OrgProfile.kycStatus` (read-model local) → ≠ `APPROVED`.
3. **403** avec code `KYC_NOT_APPROVED`.
4. Le même utilisateur peut toujours gérer son compte / consulter son KYC (endpoints non annotés).
5. Après approbation admin (STORY-013 → événement → read-model `APPROVED`), le même appel passe (**200**).

**B — Re-soumission après rejet (kyc-service) :**
1. Le tenant est `REJECTED` (motif visible côté cabinet).
2. Le super-admin du compte re-téléverse un document (RCCM ou CFE) via `POST /kyc/documents`.
3. Le document courant du type passe `SUPERSEDED`, le nouveau devient `SUBMITTED` (`version` incrémentée) — comportement STORY-011 inchangé.
4. Les deux types requis étant à nouveau présents, le tenant bascule `REJECTED → UNDER_REVIEW`, le motif de rejet est purgé.
5. `kyc.status.changed` est émis via l'outbox → read-model EC repasse `UNDER_REVIEW`, e-mail de soumission ; le dossier réapparaît dans la file admin (STORY-013).

---

## Acceptance Criteria

### TenantStateGuard — matrice d'accès (expert-comptable, FR-007)
- [ ] Le `TenantStateGuard` remplace l'`IdentitySuspensionGuard` **à la même position** de la chaîne (`Throttler → Jwt → EmailVerified → Roles → TenantState`) et **conserve** la coupure de suspension identité (org/user `SUSPENDED` → 403), fail-open sur read-model absent.
- [ ] Un endpoint annoté du décorateur de niveau **KYC approuvé** renvoie **403** `{ code: 'KYC_NOT_APPROVED' }` pour un tenant `PENDING_DOCUMENTS` / `UNDER_REVIEW` / `REJECTED`, et **passe** dès `kycStatus = APPROVED` (lu depuis `OrgProfile`, read-model local — **aucun** appel réseau à `kyc-service`).
- [ ] Un endpoint **non annoté** reste accessible quel que soit le `kycStatus` (gestion de compte / consultation KYC ouvertes dès l'e-mail vérifié) — non-régression.
- [ ] Le verrou est **déclaratif** : protéger un futur endpoint métier ne demande que le décorateur, sans logique dupliquée dans le contrôleur.
- [ ] Les routes `@Public()` et le préflight restent exempts ; l'ordre relatif aux autres guards est inchangé.
- [ ] Palier **abonnement** : le niveau et le code `SUBSCRIPTION_REQUIRED` existent dans la matrice mais **aucun endpoint ne l'exige** dans ce vertical à ce stade (enforcement différé EPIC-004) — documenté, testé comme extension point, **pas** de faux 403.

### État effectif d'accès (FR-007)
- [ ] Un endpoint de lecture (relying party) expose l'**état effectif** : `emailVerified` (claim JWT), `kycStatus` (read-model), `kycRejectionReason` le cas échéant, et un palier abonnement (placeholder tant qu'EPIC-004 n'est pas livré), pour que le frontend affiche les étapes restantes.
- [ ] Un tenant suspendu (org **ou** user) reçoit **403** sur cet endpoint comme sur tout endpoint protégé (non-régression suspension).

### Re-soumission KYC (kyc-service, FR-005)
- [ ] Alors que le tenant est `REJECTED`, un ré-upload rendant les deux types requis (`RCCM` + `CFE`) à nouveau `SUBMITTED` bascule `REJECTED → UNDER_REVIEW`.
- [ ] La transition est **atomique** (patron `runTransition`) : profil mis à jour **et** `kyc.status.changed` enfilé dans l'outbox dans une même transaction Mongo ; `rejectionReason` purgé (`$unset`).
- [ ] Le versioning documentaire STORY-011 est réutilisé sans régression : l'ancien document du type passe `SUPERSEDED`, le nouveau `SUBMITTED` avec `version` incrémentée.
- [ ] Aucun double-événement : un ré-upload d'**un seul** des deux types (l'autre déjà `SUPERSEDED`/absent) ne déclenche pas la transition ; un ré-upload alors que le tenant est déjà `UNDER_REVIEW` est un no-op (pas d'événement).
- [ ] Côté consommateur (`expert-comptable`), le read-model `OrgProfile` repasse `UNDER_REVIEW` et l'e-mail de soumission est enfilé (chaîne STORY-021 inchangée).

### Qualité / DoD PROSPERA
- [ ] Tests unitaires guard (matrice complète : suspendu / KYC non approuvé / approuvé / non annoté / public / abonnement placeholder) + re-soumission (kyc-status.service).
- [ ] Tests e2e : accès 403 `KYC_NOT_APPROVED` puis 200 après approbation ; flux rejet → re-soumission → `UNDER_REVIEW`.
- [ ] **Vérification docker bout-en-bout** (standard PROSPERA) sur la stack racine.
- [ ] Lint 0 warning ; seuils Jest (65/90/90/90) tenus sur les deux services.

---

## Technical Notes

### Composants
- **`expert-comptable`**
  - `src/common/guards/identity-suspension.guard.ts` → renommé/évolué en `tenant-state.guard.ts` (`TenantStateGuard`). Position inchangée dans `app.module.ts` (`APP_GUARD`, 5ᵉ maillon).
  - Nouveau décorateur de niveau, ex. `src/common/decorators/requires-tenant-state.decorator.ts` (`@RequiresKycApproved()` / `@RequiresTenantState(TenantAccessLevel.KYC_APPROVED)`), lu par le guard via `Reflector.getAllAndOverride`.
  - Lecture KYC : `OrgProfileService.findByOrgId(orgId)` → `kycStatus` (déjà exposé, `org-profile.service.ts`). `orgId = user.tenantId` (claim `org`).
  - Endpoint d'état effectif : relying party (module `auth`/`identity`) — soit extension de `GET /auth/me`, soit `GET /tenant/state`. Agrège claim `emailVerified` + `OrgProfile` (kyc) + placeholder abonnement.
- **`kyc-service`**
  - `src/modules/kyc/kyc-status.service.ts::onDocumentSubmitted` — étendre pour gérer la reprise depuis `REJECTED` (aujourd'hui `return` si `status !== PENDING_DOCUMENTS`). La transition `REJECTED → UNDER_REVIEW` est **déjà autorisée** (`ALLOWED_TRANSITIONS`).
  - `runTransition` réutilisé tel quel (atomicité + outbox) ; purge `rejectionReason` via `extra` (`$unset` au niveau repo `TenantKycProfileRepository.transition`).

### Matrice d'accès (référence FR-007)
| Niveau requis | Condition (read-models locaux) | Refus |
|---|---|---|
| (défaut) e-mail vérifié | claim `emailVerified` (EmailVerifiedGuard) + non suspendu | 403 suspension |
| **KYC approuvé** | `OrgProfile.kycStatus === APPROVED` | **403 `KYC_NOT_APPROVED`** |
| Abonnement actif | *(read-model abonnement — EPIC-004)* | 403 `SUBSCRIPTION_REQUIRED` *(préparé, non appliqué)* |

- **Aucun appel réseau** : la décision est prise sur les read-models locaux (`OrgProfile`, `organization/user read-models`). Cohérence événementielle assumée (fail-open sur absence, comme la suspension).
- **Ordre** : le KYC est évalué **après** RolesGuard (un `PLATFORM_ADMIN` n'a pas de `tenantId` → les endpoints admin restent non concernés par le palier KYC ; vérifier qu'un `user` sans `tenantId` ne provoque pas de faux refus).

### Transition de re-soumission (kyc-service)
```
onDocumentSubmitted(actorUserId):
  profile = getOrCreate(orgId)
  si profile.status == PENDING_DOCUMENTS et (RCCM+CFE SUBMITTED)  → runTransition(PENDING_DOCUMENTS → UNDER_REVIEW)   # STORY-011 (existant)
  si profile.status == REJECTED         et (RCCM+CFE SUBMITTED)  → runTransition(REJECTED → UNDER_REVIEW, purge rejectionReason)  # STORY-014 (nouveau)
  sinon no-op
```
- **Idempotence / concurrence** : `runTransition` renvoie `false` (aucun événement) si un acteur concurrent a déjà appliqué la transition — comportement inchangé.
- **Événement** : `kyc.status.changed { previousStatus: REJECTED, status: UNDER_REVIEW, actorUserId }` (contrat v1, pas de nouveau champ).

### Sécurité / cohérence
- Ne jamais faire dépendre la décision d'un appel synchrone inter-services (couplage temporel interdit — architecture).
- Codes d'erreur **stables** (`KYC_NOT_APPROVED`, `SUBSCRIPTION_REQUIRED`) : contrat frontend.
- Non-régression de la suspension identité : les tests existants de l'`IdentitySuspensionGuard` doivent être portés sur le `TenantStateGuard`.

### Edge cases
- `user` sans `tenantId` (PLATFORM_ADMIN) sur endpoint annoté KYC → pas de tenant à évaluer : décision explicite (exempter ou 403 ciblé) à tester.
- `OrgProfile` pas encore provisionné (latence `identity.org.created`) sur endpoint KYC → fail-open **ou** `KYC_NOT_APPROVED` ? Retenu : cohérent avec la suspension (fail-open sur absence de read-model) **mais** le KYC exige une preuve positive `APPROVED` → **absence ⇒ 403 `KYC_NOT_APPROVED`** (deny-by-default sur le palier KYC, contrairement à la suspension qui est deny-on-positive).
- Re-soumission d'un seul type après rejet → reste `REJECTED` (pas de bascule tant que les deux ne sont pas `SUBMITTED`).

---

## Dependencies

**Prerequisite Stories (toutes done) :**
- STORY-030 : `IdentitySuspensionGuard` + chaîne de guards relying party (point d'insertion).
- STORY-029 : read-models identité (`organization/user/membership`) + `IdentityReadModelService`.
- STORY-021 : consommateur `kyc.status.changed` → read-model `OrgProfile.kycStatus` (source du verrou KYC).
- STORY-013 : revue admin (approve/reject) — produit les transitions consommées ici ; la re-soumission ré-alimente sa file.
- STORY-011 : upload + versioning documentaire (`SUPERSEDED`/`version`) réutilisé par la re-soumission.

**Blocked / débloque :**
- Débloque l'enforcement du palier **abonnement** (EPIC-004, Module 2) : la matrice et le décorateur sont posés, il ne restera qu'à brancher le read-model d'abonnement.
- Débloque la protection déclarative de tout futur endpoint métier du vertical.

**Dépendances externes :** aucune.

---

## Definition of Done

- [ ] `TenantStateGuard` implémenté (suspension + KYC) et câblé en `APP_GUARD` à la place de l'`IdentitySuspensionGuard`
- [ ] Décorateur de niveau + codes d'erreur (`KYC_NOT_APPROVED`, `SUBSCRIPTION_REQUIRED`) livrés et documentés
- [ ] Endpoint d'état effectif d'accès exposé
- [ ] Re-soumission `REJECTED → UNDER_REVIEW` branchée dans `kyc-service` (atomique + outbox, motif purgé)
- [ ] Tests unitaires (matrice guard + re-soumission) et e2e (403→200 KYC ; rejet→re-soumission→UNDER_REVIEW)
- [ ] Lint 0 warning ; seuils Jest 65/90/90/90 sur `expert-comptable` **et** `kyc-service`
- [ ] **Vérification docker bout-en-bout** réalisée sur la stack racine (IdP + EC + kyc-service + mongo/kafka/minio/mailhog)
- [ ] Critères d'acceptation validés ; `sprint-status.yaml` mis à jour
- [ ] `/code-review` formel passé
- [ ] Commit/push branche `STORY-014` **sur demande explicite** (une branche par story)

---

## Story Points Breakdown

- **expert-comptable (TenantStateGuard + décorateur + endpoint d'état) :** 3 points
- **kyc-service (re-soumission REJECTED→UNDER_REVIEW) :** 1 point
- **Tests unit + e2e + vérif docker :** 1 point
- **Total :** 5 points

**Rationale :** l'essentiel de l'infrastructure existe déjà (guard de suspension à faire évoluer, read-model KYC alimenté, versioning documentaire et transition `REJECTED→UNDER_REVIEW` déjà déclarée). Le travail est surtout de la **composition déclarative** + branchement de la transition de reprise, pas de nouveau sous-système. Le palier abonnement est *préparé* (non appliqué) → pas de coût EPIC-004 ici.

---

## Additional Notes

- **Traçabilité :** FR-007 (matrice d'accès / `TenantStateGuard`) + FR-005 (re-soumission). FR-007 reste, pour le Bilan, **rejoué dans `bilan-service`** (relying party partagé) — hors de cette story.
- Clôt l'essentiel de l'**EPIC-003** côté vertical (KYC event-driven de bout en bout : soumission → revue → matrice d'accès → reprise). Restera STORY-015 (catalogue de plans, EPIC-004) pour terminer le sprint 6.
- Le palier abonnement n'est **pas** simulé par un faux read-model : mieux vaut un extension point honnête qu'un 403 trompeur.

---

## Progress Tracking

**Status History:**
- 2026-07-10 : Créée par vivian (Scrum Master)
- 2026-07-10 : Implémentée + vérifiée docker bout-en-bout (Developer)

**Actual Effort:** 5 points (conforme à l'estimation)

**Implementation Notes:**
- **EC** : `IdentitySuspensionGuard` → `TenantStateGuard` (`src/common/guards/tenant-state.guard.ts`), même position `APP_GUARD`. Ajouts : `TenantAccessLevel` (enum), `@RequiresTenantState`/`@RequiresKycApproved` (décorateur, `TENANT_STATE_KEY`), codes `KYC_NOT_APPROVED`/`SUBSCRIPTION_REQUIRED`. Endpoint `GET /tenant/state` (`AccessStateController` + `AccessStateDto`, `@AllowUnverified`).
- **Palier KYC** = deny-by-default (preuve positive `APPROVED` ; profil absent / `tenantId` null → 403). **Palier abonnement** préparé mais non appliqué (extension point EPIC-004).
- **kyc-service** : `onDocumentSubmitted` gère `REJECTED → UNDER_REVIEW` ; `TenantKycProfileRepository.transition` étendu d'un `$unset` (purge motif/revue) ; versioning `SUPERSEDED` (STORY-011) réutilisé ; outbox atomique.
- **Tests** : EC lint 0, 140 unit + 24 e2e (dont `tenant-state.e2e`) ; kyc-service lint 0, 135 unit + 35 e2e (dont re-soumission). Couverture OK sur les deux (seuils 65/90/90/90).
- **Vérif docker** : register→verify→login→`/tenant/state` PENDING ; upload→UNDER_REVIEW (Kafka→read-model EC) ; rejet admin→REJECTED+motif ; ré-upload→UNDER_REVIEW motif purgé ; suspension org→403 (non-régression).
- **Reste** : `/code-review` formel + commit/push branche `STORY-014`.

---

**This story was created using BMAD Method v6 - Phase 4 (Implementation Planning)**
