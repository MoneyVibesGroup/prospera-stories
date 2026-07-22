# STORY-131 : CORS pour `bilan-service` et `balance-service` — parité avec le patron STORY-109

**Epic :** EPIC-024 — Frontend & intégration (topologie Option B)
**Réf. :** STORY-109 (patron CORS Option B, allowlist explicite pilotée par env)
**Priorité :** Should Have
**Story Points :** 2
**Statut :** done ✅
**Sprint :** 16
**Créée le :** 2026-07-22
**Clôturée le :** 2026-07-22
**Assignée à :** vivianMoneyVibesGroupes
**Services :** `bilan-service` (:3004), `balance-service` (:3007)

> **Le trou, en une phrase :** STORY-109 a câblé le CORS sur 5 services (auth, EC, kyc, catalog,
> document) ; **`bilan-service` et `balance-service` sont restés sans CORS** — un front navigateur
> ne peut pas les appeler en direct.

---

## User Story

En tant que **frontend navigateur d'un vertical PROSPERA** (servi sur une origine `http://localhost:31xx`),
je veux **appeler `bilan-service` et `balance-service` en direct**,
afin de **consulter la liasse et les balances sans être bloqué par la politique du navigateur (CORS).**

---

## Description

### Constat

`grep enableCors` sur les 8 services : présent sur `auth-service`, `expert-comptable`, `kyc-service`,
`platform-catalog-service`, `document-service` (STORY-109) ; **absent** sur `bilan-service`,
`balance-service` (et `admin-panel`, **exclu à dessein** — BFF same-origin). Dans la topologie
**Option B** (le navigateur charge l'app depuis une origine et appelle N services sur N ports = N
origines), tout appel navigateur direct vers bilan/balance est refusé par la politique CORS.

### Ce que la story change

Applique **à l'identique** le patron STORY-109 aux deux services manquants : `enableCors` piloté par
`CORS_ALLOWED_ORIGINS` (allowlist explicite, jamais `*`, vide ⇒ CORS désactivé = non-régression
server-to-server), avec la même liste de méthodes/headers et `credentials: false` (jetons portés par
l'en-tête `Authorization`, pas de cookie).

En parallèle (hors dépôts, à la racine non versionnée), le **défaut compose** de `CORS_ALLOWED_ORIGINS`
est élargi de `http://localhost:3100` à la **plage `3100`→`3120`** pour les 7 services concernés.

---

## Scope

**Inclus**

- `bilan-service` + `balance-service` : `CorsConfig` (configuration typée), `CORS_ALLOWED_ORIGINS`
  (env optionnelle validée), bloc `app.enableCors(...)` dans `main.ts` — copie conforme de STORY-109.
- `.env.example` des deux services : entrée `CORS_ALLOWED_ORIGINS` documentée.
- Compose racine : ligne `CORS_ALLOWED_ORIGINS` pour bilan + balance ; défaut des 7 services élargi à
  la plage 3100-3120.

**Hors périmètre**

- `admin-panel` : reste **sans CORS** (BFF same-origin, décision STORY-109).
- Toute logique métier, endpoint, ou changement d'authentification.

---

## Acceptance Criteria

- **AC-01** — `bilan-service` et `balance-service` répondent à un préflight `OPTIONS` avec
  `Access-Control-Allow-Origin` **égal à l'origine autorisée** (jamais `*`) et exposent `GET`,
  `Authorization`.
- **AC-02** — une origine **non listée** ne reçoit **aucun** `Access-Control-Allow-Origin` (refus).
- **AC-03** — `CORS_ALLOWED_ORIGINS` vide/absente ⇒ CORS **désactivé** (non-régression
  server-to-server ; le boot ne change pas).
- **AC-04** — le défaut compose autorise l'ensemble de la plage `3100`→`3120` pour les 7 services CORS.

---

## Technical Notes

- Réutiliser **mot pour mot** le patron STORY-109 (`kyc-service` = référence) : aucune divergence de
  méthodes/headers entre services (surface CORS uniforme).
- `CORS_ALLOWED_ORIGINS` est **optionnelle** dans `env.validation` (`@IsOptional() @IsString()`) : les
  configs existantes sans la variable démarrent inchangées.
- `main.ts`/`configuration.ts` sont **exclus de la couverture** (`collectCoverageFrom`) ; ne pas
  chercher à les couvrir — la garantie est la **vérification docker** (préflight réel).

---

## Dependencies

- **Patron** : STORY-109 (CORS Option B). Aucun prérequis de données.

---

## Definition of Done

- 4 AC vérifiés, dont **AC-01/02/03 en préflight docker réel** sur les deux services.
- Lint 0 warning · build OK · unit + e2e verts · couverture ≥ seuils sur les deux services.
- Deux PR `MNV-131` (bilan + balance) sur `dev`, revue + revue de sécurité, Rebase and merge.

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée + développée + vérifiée + intégrée (vivianMoneyVibesGroupes) — **done**.

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
