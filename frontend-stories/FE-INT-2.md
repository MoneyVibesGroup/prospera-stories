# Story FE-INT-2 : Remodeler le KYC sur kyc-service (`GET /kyc/status`)

Status: backlog

**Epic :** FE-EPIC-003 — KYC (retrofit de FE-009, dans l'Integration Gate FE-EPIC-002)
**Points :** 3 · **Sprint :** Integration Gate (avant Sprint 3) · **App :** `prospera-frontend-expert-comptable`
**API :** **kyc-service (:3002)** `GET /api/kyc/status`, `POST /api/kyc/documents`
**Backend d'appui :** STORY-020/021 (extraction kyc-service + events), STORY-011/012, STORY-075 (stack dev)
**Réf. plan :** retrofit de **FE-009** · audit d'intégration 2026-07-12
**Dépendances :** FE-INT-0 (client multi-base + types générés)

---

## Convention Git

- Branche `fe-int-2`, commits `FE-INT-2 …` ; branche depuis `dev` + rebase avant de coder ; PR vers `dev`.

---

## User Story

En tant que **super-admin de cabinet**,
je veux **déposer mes justificatifs KYC et voir leur statut réel contre kyc-service**,
afin que **l'état affiché (en attente / en revue / approuvé / rejeté + motif) provienne du backend et non d'un modèle miroir.**

---

## Contexte

FE-009 a supposé un `GET /kyc/documents` → `{ documents: KycDocument[] }`. Le contrat **réel** (kyc-service :3002, relying party RS256) est différent :
- **`GET /api/kyc/status`** → `KycStatusResponseDto { kycStatus, documents: KycDocumentResponseDto[], rejectionReason?, reviewedAt? }` — **la liste des documents est imbriquée dans le statut**, il n'existe pas d'endpoint `/kyc/documents` en GET.
- **`POST /api/kyc/documents`** (multipart `type` + fichier) — upload inchangé dans l'esprit (XHR progress conservé).
- Enums réels : `KycDocumentType` = **{RCCM, CFE}** (l'hypothèse front était correcte) ; statut par document = `KycDocumentStatus` (à mapper aux états UI absent/uploading/review/approved/rejected) ; statut global = `KycStatus`.

---

## Périmètre

**Inclus :**
- Remplacer `src/features/kyc/api/get-kyc-documents.ts` : `GET /kyc/documents` → **`GET /kyc/status`** (préfixe logique `/kyc` → kyc-service via FE-INT-0), lire `.documents` + `.kycStatus` + `.rejectionReason`.
- `upload-document.ts` : cibler `NEXT_PUBLIC_KYC_URL` + `/api/kyc/documents` (déjà refactoré en FE-INT-0) ; conserver la validation client (≤10 Mo, pdf/jpg/png, non-autoritative).
- Mapper `KycDocumentStatus` réel → états visuels de `DocumentUpload` (absent / uploading / review / approved / rejected + motif + re-soumission).
- Remplacer les types feature-local par les types **générés** (FE-INT-0). Retirer tout mock `documents[]`.
- Invalidation : après upload, invalider `kyc` **et** `onboardingKeys.all` (le statut alimente `/tenant/state`, cf. FE-INT-3).

**Hors périmètre :**
- Revue admin KYC (côté admin-panel / backend).
- Nouvelle UI (les 2 zones RCCM/CFE de FE-009 restent).

---

## Critères d'acceptation

1. La vue KYC lit l'état depuis `GET /api/kyc/status` (kyc-service :3002) : statut global + par-document + motif de rejet réels contre le stack STORY-075.
2. L'upload `POST /api/kyc/documents` (RCCM puis CFE) passe (201, magic-bytes côté backend) et fait transiter le statut vers `UNDER_REVIEW` (visible après invalidation).
3. Rejet admin → `REJECTED` + motif affiché → re-soumission possible → retour `UNDER_REVIEW`, motif purgé.
4. Le token RS256 (login IdP) est accepté par kyc-service ; token forgé → 401. Types générés, mocks retirés. Tests verts.

---

## Integration Gate

Contrat supposé `GET /kyc/documents` **confronté et corrigé** en `GET /kyc/status` (documents imbriqués). docType `{RCCM,CFE}` validé. Zéro mock : la feature KYC tape kyc-service réel. Écarts de mapping de statut → tracés.
