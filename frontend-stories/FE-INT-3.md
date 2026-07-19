# Story FE-INT-3 : Brancher l'onboarding sur `GET /tenant/state` (EC relying party)

Status: review  <!-- 2026-07-19 : implémentée sur branche `fe-int-3` (depuis origin/dev = top FE-INT-0) ; gates typecheck/lint/tests(onboarding 16)/build verts. Clôt l'Integration Gate FE-EPIC-002. -->

## Dev Agent Record (FE-INT-3)

- **Agent** : claude-opus-4-8 (Claude Code) · branche `fe-int-3` (base `origin/dev`) · commit `FE-INT-3 — Onboarding sur GET /tenant/state réel (Integration Gate)`.
- **Contrat confronté** : `GET /ec/tenant` (supposé) → **`GET /ec/tenant/state`** (réel ; préfixe `/ec` retiré par le routeur FE-INT-0 → `:3000/api/v1/tenant/state`). Type miroir remplacé par le DTO généré **`AccessStateDto`** (`src/types/api/ec.ts`) : forme **aplatie** `kycStatus`/`kycRejectionReason`/`subscriptionActive` (au lieu de `kyc:{…}`/`subscription:{…}`).
- **Abonnement dégradé (AC 3)** : `subscriptionActive` `false` en dur (paiement = Module 2, non livré) → étape stepper **`pending`** (« activation manuelle à venir »), **jamais bloquante**. `complete = emailVerified && kycApproved` (sinon la section ne se masquerait jamais) — FE-011/012 réintégreront l'abonnement à la condition de complétude.
- **`kycStatus` nullable** (compte sans org / PLATFORM_ADMIN) traité comme non approuvé (bannière `kyc-pending`).
- **403 conservés (AC hors-scope UI)** : `accessErrorTarget`/`useAccessErrorRedirect` inchangés (mapping `KYC_NOT_APPROVED`→`/kyc`, `SUBSCRIPTION_REQUIRED`→`/billing`).
- **Invalidation croisée FE-INT-2** : `use-upload-document` invalide déjà `onboardingKeys.all` (présent depuis FE-010) → l'activation se rafraîchit après upload KYC.
- **Fichiers** : `src/features/onboarding/{api/types.ts,api/get-tenant.ts,lib/activation.ts,components/activation-stepper.tsx}` + tests `lib/activation.test.ts` & `components/onboarding-section.test.tsx` + i18n `src/i18n/messages/fr.json` (étape abonnement « à venir »).
- **⚠️ Reste** : vérification LIVE contre le stack docker STORY-075 (AC 1/2/4 bout-en-bout) non exécutée dans cet environnement — à confirmer au démarrage du stack. Nettoyage annexe : 3 barrels `index.ts` parasites générés par l'IDE (kyc/api, kyc/hooks, users/schemas — ce dernier cassé) supprimés (non suivis, absents d'origin/dev).

**Epic :** FE-EPIC-003 — KYC & onboarding (retrofit de FE-010, dans l'Integration Gate FE-EPIC-002)
**Points :** 2 · **Sprint :** Integration Gate (avant Sprint 3) · **App :** `prospera-frontend-expert-comptable`
**API :** **expert-comptable (:3000)** `GET /api/tenant/state`
**Backend d'appui :** STORY-014 (`AccessStateController` + `TenantStateGuard`), STORY-029 (read-models), STORY-075 (stack dev)
**Réf. plan :** retrofit de **FE-010** · audit d'intégration 2026-07-12
**Dépendances :** FE-INT-0 (client multi-base), FE-INT-2 (le statut KYC alimente l'agrégat)

---

## Convention Git

- Branche `fe-int-3`, commits `FE-INT-3 …` ; branche depuis `dev` + rebase avant de coder ; PR vers `dev`.

---

## User Story

En tant que **super-admin de cabinet**,
je veux **voir mon avancement d'activation calculé depuis l'état réel du tenant**,
afin que **le stepper et le bandeau d'onboarding reflètent l'e-mail vérifié, le statut KYC et l'abonnement tels que le backend les connaît.**

---

## Contexte

FE-010 a supposé `GET /ec/tenant` → `{ emailVerified, kyc:{status}, subscription:{status} }`. L'endpoint **réel existe** (EC relying party, STORY-014) mais diffère :
- **`GET /api/tenant/state`** (`@Controller('tenant')` + `@Get('state')`) → `{ emailVerified, kycStatus, kycRejectionReason?, subscriptionActive }`.
- **Forme aplatie** : `kycStatus` (pas `kyc:{status}`), et **`subscriptionActive: false` en dur** — le backend abonnement n'existe pas encore (paiement-service = Module 2, déc. 2026).
- La coupure d'accès est backend (`TenantStateGuard` → 403 `KYC_NOT_APPROVED` / `SUBSCRIPTION_REQUIRED`, et suspension org/user).

---

## Périmètre

**Inclus :**
- `src/features/onboarding/api/get-tenant.ts` : `GET /ec/tenant` → **`GET /tenant/state`** (préfixe logique `/ec` → EC :3000 via FE-INT-0). Adapter le type `TenantState` à la **forme aplatie** réelle (types générés FE-INT-0).
- Adapter `deriveActivation` (fonction pure) : étapes **e-mail → KYC → abonnement** à partir de `emailVerified` / `kycStatus` / `subscriptionActive`. Le motif de rejet vient de `kycRejectionReason`.
- **Étape abonnement dégradée** : `subscriptionActive` toujours `false` → afficher l'étape comme **« activation manuelle (à venir) »** plutôt que bloquante, cohérent avec le dogfooding (l'entitlement est accordé à la main via admin-panel). Documenter que FE-7 (paiement) la réactivera.
- Conserver le mapping des 403 (`accessErrorTarget` / `useAccessErrorRedirect`) sur les codes réels du `TenantStateGuard`.
- Invalidation croisée avec FE-INT-2 (upload KYC → `onboardingKeys.all`).

**Hors périmètre :**
- Le paiement / catalogue d'abonnement → FE-7 (Module 2).
- La logique de garde d'accès elle-même (backend).

---

## Critères d'acceptation

1. Le stepper et le bandeau lisent `GET /api/tenant/state` réel (EC :3000) contre le stack STORY-075.
2. Parcours vérifié : e-mail non vérifié → étape 1 ; après vérif + upload KYC → étape KYC `UNDER_REVIEW` puis `APPROVED` ; rejet → motif (`kycRejectionReason`) + CTA re-soumission (FE-INT-2).
3. Étape abonnement affichée en mode « manuel/à venir » (non bloquante), `subscriptionActive=false` géré sans casser le stepper.
4. Suspension org → `/tenant/state` 403 → orientation correcte. Types générés, mock `/ec/tenant` retiré. Tests verts.

---

## Integration Gate

Contrat supposé `GET /ec/tenant` **confronté et corrigé** en `GET /api/tenant/state` (forme aplatie, abonnement absent → dégradé). Zéro mock : l'onboarding tape EC réel. **Clôt l'Integration Gate de FE-EPIC-002** → feu vert Sprint 3.
