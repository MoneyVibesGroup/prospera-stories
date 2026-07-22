# Story FE-INT-4 : Inscription cabinet sur le contrat réel (`organizationName` → `cabinetName`)

Status: review — **PR #11 `fe-int-4` → `dev`** (2026-07-21)

> ✅ **Livrée et VÉRIFIÉE EN NAVIGATEUR** le 2026-07-21 (STORY-109/CORS étant livrée, cf. `MNV-109` sur les 5 relying-parties) :
> `POST /api/v1/auth/register` avec `cabinetName` → **201** depuis `http://localhost:3100`, zéro erreur CORS,
> puis `verify-email` → **« Adresse e-mail vérifiée »** → login → **stepper d'onboarding rendu** (E-mail vérifié ✓, KYC en attente).
> C'est la **première démo navigateur complète du gate client** — FE-INT-1/2/3 n'étaient jusque-là vérifiées qu'au curl.
>
> **Deux écarts supplémentaires corrigés dans la même story** (découverts en pilotant le navigateur) :
> 1. **Port de l'app 3000 → 3100** (`dev`/`start` + `playwright.config.ts`). `:3000` est occupé par **expert-comptable** dans le stack docker racine, et `:3100` est l'origine autorisée par `CORS_ALLOWED_ORIGINS` (STORY-109). Effet de bord grave levé : avec le stack up, le `reuseExistingServer` de Playwright prenait le **backend** pour le serveur de test.
> 2. **Bug du chemin nominal de FE-006** : `verifyEmail` résolvait `undefined` → TanStack Query v5 met la query **en ERREUR** → l'écran affichait « Lien invalide ou expiré » alors que l'IdP répondait **200**. Corrigé (la fonction renvoie toujours un objet) + test de non-régression sur la **queryFn réelle** — le test existant mockait le hook entier, d'où l'angle mort. Écart backend tracé : l'OpenAPI de l'IdP déclare `content: never` sur le 200 de `verify-email` alors que la réponse porte un corps `{ message }`.

**Epic :** FE-EPIC-001 — Authentification & comptes (retrofit de **FE-004**, dans l'esprit de l'Integration Gate FE-EPIC-002)
**Points :** 1 · **Sprint :** Integration Gate (S3) · **App :** `prospera-frontend-expert-comptable`
**API :** **auth-service (:3001)** `POST /api/v1/auth/register` (route publique, sans Bearer)
**Backend d'appui :** STORY-004/023 (register cabinet), STORY-075 (stack dev)
**Réf. plan :** retrofit de **FE-004** · découvert à la vérif LIVE de FE-INT-3 (2026-07-19)
**Dépendances :** FE-INT-0 (client multi-base). Indépendante de STORY-109 (CORS) mais **les deux** sont requises pour un parcours navigateur complet register → onboarding.

---

## Convention Git

- Branche `fe-int-4`, commits `FE-INT-4 …` ; branche depuis `dev` + rebase avant de coder ; PR vers `dev`.

---

## User Story

En tant que **futur super-admin de cabinet**,
je veux **que mon inscription aboutisse contre l'IdP réel**,
afin que **la création du cabinet ne soit pas rejetée en 400 à cause d'un nom de champ erroné.**

---

## Contexte

FE-004 envoie une charge utile `{ organizationName, country, firstName, lastName, email, password }` à `POST /auth/register`. Le contrat **réel** de l'IdP (auth-service) attend **`cabinetName`**, pas `organizationName`. Vérifié à la vérif LIVE de FE-INT-3 (2026-07-19) :

```
POST http://localhost:3001/api/v1/auth/register  { "organizationName": "…", … }
→ 400 : ["property organizationName should not exist",
         "cabinetName must be shorter than or equal to 200 characters",
         "cabinetName should not be empty", "cabinetName must be a string"]
```

Avec `cabinetName`, la même requête renvoie **201** (`{ organizationId, slug, userId, email, message }`). Le reste de la charge utile (`country` enum UEMOA, `firstName`, `lastName`, `email`, `password`) est **déjà conforme** (round-trip register → verify-email → login → `/tenant/state` prouvé bout-en-bout au curl).

C'est le **premier appel du parcours** : tant qu'il échoue, aucun cabinet ne peut être créé par l'UI, et tout le gate d'onboarding (FE-INT-2/3) est indémontrable depuis un compte neuf.

---

## Périmètre

**Inclus :**
- `src/features/auth/schemas/register.schema.ts` : renommer la propriété **`organizationName` → `cabinetName`** (garder `.trim().min(1)`). `RegisterInput`/`RegisterValues` suivent le renommage.
- `src/features/auth/components/register-form.tsx` : `defaultValues`, le `name="organizationName"` du `FormField`, et le mapping de `onSubmit` → **`cabinetName`**. Les libellés i18n (`register.orgLabel` « Raison sociale du cabinet », placeholder) **restent** (ils décrivent le champ à l'utilisateur, indépendamment du nom technique).
- `src/features/auth/api/register.ts` : inchangé si la charge utile est dérivée du type (vérifier qu'aucune clé n'est codée en dur).
- Idéalement, **remplacer le type de charge utile par le DTO généré** de l'OpenAPI auth-service (`src/types/api/auth.ts`, `RegisterDto`/équivalent) plutôt qu'un type feature-local — même discipline que FE-INT-0/1/2 (zéro type manuel là où l'OpenAPI existe). Si le DTO généré n'expose pas encore ce champ, régénérer (`npm run gen:api`) contre le stack STORY-075.
- Tests : `register.schema.test.ts` et `register-form.test.tsx` (les deux référencent `organizationName`) → mis à jour vers `cabinetName`.

**Hors périmètre :**
- La politique CORS des services (→ **STORY-109**, backend) : sans elle, `POST /auth/register` reste bloqué **au préflight** dans le navigateur (l'appel est client-side direct, `auth:false`). FE-INT-4 corrige le **contrat**, STORY-109 débloque le **transport navigateur** — les deux sont nécessaires pour un register réussi en navigateur.
- Login/refresh (transitent par le BFF, contrat déjà bon).

---

## Critères d'acceptation

1. Le formulaire d'inscription envoie `cabinetName` (plus aucune occurrence de `organizationName` dans `src/features/auth/`).
2. `POST /auth/register` avec un cabinet neuf → **201** contre le stack STORY-075 (au curl **et**, une fois STORY-109 livrée, en navigateur sans erreur CORS ni 400).
3. Validation client inchangée (nom requis, e-mail valide, mot de passe ≥ 8, confirmation) ; libellés FR inchangés.
4. Types générés (auth) si disponibles ; tests verts (typecheck / lint / test / build).

---

## Integration Gate

Contrat supposé `organizationName` **confronté et corrigé** en `cabinetName` (400 → 201 prouvé). Aligne l'inscription sur le même principe « vérité du contrat, zéro supposition » que FE-INT-0..3.

---

## Notes

- Découvert le 2026-07-19 en pilotant le vrai backend (Playwright/curl) pour FE-INT-3 ; consigné en mémoire projet `frontend-cors-blocker` (§ gap connexe). FE-004 n'était pas dans le lot retrofité par l'Integration Gate (epic auth), d'où la survivance du champ supposé.
