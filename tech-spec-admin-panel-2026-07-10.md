# Technical Specification : admin-panel v1 (BFF)

**Date :** 2026-07-10
**Auteur :** vivian
**Version :** 1.0
**Type de projet :** API / BFF (micro-service NestJS)
**Niveau de projet :** 1 (tech-spec courte)
**Statut :** Draft
**Écosystème :** PROSPERA / Money Vibes — Module 0 (chaîne KYC), flux A (AD-2)

---

## Vue d'ensemble

`admin-panel` est le **Backend-For-Frontend d'administration** de la plateforme. Il offre à un `PLATFORM_ADMIN` une **vue agrégée des organisations** (identité + KYC + entitlements) et les **actions de revue/validation KYC** et d'**octroi d'entitlement**, en **proxifiant** ces opérations vers les services propriétaires. **Il ne possède aucune donnée** (pas de base) : il compose et relaie.

**Documents liés :** PLAN FINAL `docs/synthese-services-prospera-2026-07-10.md` (Module 0, décision AD-2) ; `docs/architecture-prospera-ecosystem-2026-07-04.md` (P8 : admin-panel BFF résout FR-012 ; rev 1.3). Périmètre déjà cadré → cette tech-spec courte suffit (pas de PRD dédié).

---

## Problème & solution

### Problème
Le parcours KYC (inscription → upload → OCR → **revue** → approbation) doit être testable de bout en bout avant toute ouverture externe. La **revue admin** et l'**octroi d'entitlement** existent aujourd'hui comme endpoints épars dans trois services (auth, kyc, catalog) ; aucun point d'entrée admin unifié ne croise identité + KYC + entitlements pour une org.

### Solution
Un BFF mince qui, pour un `PLATFORM_ADMIN` authentifié :
1. **Agrège** en lecture, par org, l'identité (auth-service), le statut/pièces KYC (kyc-service) et les entitlements (platform-catalog-service).
2. **Proxifie** les actions : approuver/rejeter un KYC (→ kyc-service), octroyer/révoquer un entitlement (→ platform-catalog-service).
Le BFF **ne stocke rien** : il valide le jeton, applique le rôle, et **relaie le jeton de l'admin** aux services amont (qui appliquent déjà `PLATFORM_ADMIN`).

---

## Exigences

### À construire
- **BFF relying party** RS256/JWKS, garde `PLATFORM_ADMIN` sur toutes les routes, **aucune base de données**.
- **Vue agrégée des orgs** : liste (filtres statut KYC / entitlement) et détail (identité + KYC + entitlements composés à la volée depuis les 3 services).
- **Actions proxifiées** : revue KYC (approve/reject) → kyc-service ; grant/revoke entitlement → platform-catalog-service.
- **Résilience de composition** : si un service amont est indisponible, la vue se dégrade proprement (section marquée « indisponible ») plutôt que d'échouer en bloc.

### Hors périmètre
- **Aucune donnée propre** (pas de read-model persistant en v1 ; composition à la volée).
- Aucun front-end (UI) — c'est le **backend** du panneau ; le front est un consommateur.
- OCR / extraction de documents → `document-service` (flux B, DO-1).
- Auth service-à-service **M2M** (décision C8) : non requis en v1 (voir Approche § auth inter-services).
- Édition du catalogue de modules/référentiels → platform-catalog-service.

---

## Approche technique

### Stack
Socle PROSPERA (NestJS 11 / Node 20 / TS strict / `passport-jwt` / `kafkajs` non requis en v1) + `common/` dupliqué (JwtStrategy validate-only RS256/JWKS, `RolesGuard`, throttler). **Client HTTP** (axios/`@nestjs/axios`) vers les services amont. **Pas de Mongoose** (aucune base). Port `:3010`.

### Aperçu d'architecture
```
PLATFORM_ADMIN (JWT RS256)
      │
      ▼
  admin-panel (BFF, :3010)  ──lit──►  auth-service      (orgs, users, memberships — endpoints admin STORY-026/027)
   JwtAuth+Roles(PLATFORM_ADMIN)  ──lit/agit─►  kyc-service       (statut/pièces + revue approve/reject — STORY-013)
   compose + proxy (relaie le JWT)  ──lit/agit─►  platform-catalog-service (entitlements grant/revoke — STORY-032/033)
```
- **Composition à la volée** : un appel « détail org » fan-out vers les 3 services (en parallèle) et fusionne. Timeouts courts + dégradation partielle.
- **Réutilisation** : les endpoints amont existent déjà (STORY-007 squelette admin, 013 revue KYC, 026/027 admin orgs auth, 032/033 entitlements catalog) → l'essentiel du travail est la **composition + le proxy**, d'où ~1 sprint.

### Modèle de données
**Aucun** (le BFF ne possède pas de base). DTO de composition uniquement (en mémoire, par requête).

### Design d'API (indicatif)
- `GET /admin/orgs` — liste agrégée (filtres : `kycStatus`, `entitlement`, recherche).
- `GET /admin/orgs/:orgId` — détail composé (identité + KYC + entitlements + extraction OCR si présente côté kyc).
- `POST /admin/orgs/:orgId/kyc/approve` · `POST /admin/orgs/:orgId/kyc/reject` — proxy → kyc-service.
- `POST /admin/orgs/:orgId/entitlements` · `DELETE …/:moduleCode` — proxy → platform-catalog-service.
Toutes sous `@Roles(PLATFORM_ADMIN)`.

### Auth inter-services (v1, sans M2M)
Le BFF **relaie le bearer JWT de l'admin** aux services amont, qui appliquent déjà `PLATFORM_ADMIN` sur leurs endpoints admin. → **pas besoin de C8 (M2M)** en v1. C8 ne devient nécessaire que pour des appels *système* sans acteur humain (hors périmètre Module 0).

---

## Plan d'implémentation

### Stories (≈1 sprint)
1. **ST-ADMIN-1 — Scaffold BFF** : relying party RS256/JWKS, `RolesGuard` PLATFORM_ADMIN, health, config des URLs amont, client HTTP + timeouts. (Sans base.)
2. **ST-ADMIN-2 — Vue agrégée** : `GET /admin/orgs` + `GET /admin/orgs/:id` (composition fan-out identité+KYC+entitlements, dégradation partielle).
3. **ST-ADMIN-3 — Actions proxifiées** : revue KYC approve/reject → kyc-service ; grant/revoke entitlement → platform-catalog-service (relais du JWT admin).
4. **ST-ADMIN-4 (optionnel) — e2e cross-service** : parcours admin de bout en bout en docker (voir chaîne KYC complète).

### Phases
Scaffold → composition (lecture) → actions (écriture proxifiée) → e2e.

---

## Critères d'acceptation
- Un `PLATFORM_ADMIN` liste les orgs et ouvre une org avec identité + KYC + entitlements **agrégés** en une vue.
- Approuver/rejeter un KYC depuis admin-panel **modifie l'état dans kyc-service** (propriétaire), pas dans admin-panel.
- Octroyer/révoquer un entitlement depuis admin-panel **modifie l'état dans platform-catalog-service**.
- Un non-`PLATFORM_ADMIN` est refusé (403) ; anti-énumération inter-org.
- Si un service amont est down, la vue se dégrade (section « indisponible ») sans planter.

---

## Exigences non fonctionnelles
- **Sécurité :** RS256/JWKS ; `PLATFORM_ADMIN` obligatoire ; relais de jeton sécurisé (pas de log du bearer) ; throttler.
- **Performance :** composition fan-out **en parallèle** ; timeouts courts par amont ; pas de N+1.
- **Autre :** aucune donnée persistée (surface d'attaque réduite) ; Swagger `/api/docs` ; seuils Jest 65/90/90/90.

---

## Dépendances
- **auth-service** — endpoints admin orgs/users (STORY-026/027).
- **kyc-service** — statut/pièces + endpoints de revue (STORY-013 ; *si non terminée, prérequis*).
- **platform-catalog-service** — entitlements grant/revoke (STORY-032/033 ; service `not_started` → **admin-panel ne peut proxifier les entitlements qu'une fois catalog livré** ; la vue agrégée identité+KYC reste livrable avant).
- **auth-service (IdP)** — `admin-panel` doit figurer dans `AUTH_AUDIENCE`.

---

## Risques & mitigation
- **Dépendance à des endpoints amont non finis** (catalog `not_started`, KYC revue 013) → livrer la **vue identité+KYC** d'abord ; brancher le proxy entitlements quand catalog existe.
- **Couplage aux contrats amont** → passer par des clients typés isolés ; tolérer l'indisponibilité (dégradation).
- **Fuite de jeton** en relais → ne jamais journaliser le bearer ; portée minimale.

---

## Timeline
**Cible :** sept. 2026 (Module 0, livré en 2 flux avec document-service).
**Jalons :** scaffold → vue agrégée → actions proxifiées → e2e chaîne KYC complète.

---

## Approbation
- [ ] vivian (auteur)
- [ ] Tech lead
- [ ] Product Owner

---

## Prochaines étapes
`/bmad:sprint-planning` (ou `/bmad:create-story` par story) pour ST-ADMIN-1…4, à la fenêtre S7 (sept. 2026).

**Document créé avec BMAD Method v6 — Phase 2 (Planning) — tech-spec courte (AD-2).**
