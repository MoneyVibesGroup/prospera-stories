# Plan Frontend : App Cabinet `prospera-frontend-expert-comptable`

**Date :** 2026-07-08
**Scrum Master :** vivian (BMAD)
**Type de projet :** Frontend web (Next.js 16 / App Router)
**Périmètre :** Application **cabinet** (personas `TENANT_ADMIN` / `TENANT_USER`)
**Statut :** Cartographie + backlog (Phase 4 — préalable à `create-story` par story)

> ⚠️ **Révisé le 2026-07-12 — voir l'[Addendum v2](#addendum-v2-2026-07-12--programme-multi-frontend) en bas de document.** Ce plan initial couvrait 2 sprints (auth + KYC + paiement) sur l'ancien périmètre vertical. L'addendum v2 réaligne le frontend sur le PLAN FINAL backend (2026-07-10) : programme **multi-frontend** piloté par l'admin-panel Money Vibes, ajout du **module Bilan** (FE-EPIC-005) et de l'**accès modules/entitlements** (FE-EPIC-006), **re-séquencement du paiement**, et découpage des sprints **FE-3 → FE-7** inséré après FE-010.

> **But de ce document.** Dériver, depuis les stories et exigences **backend** existantes (`docs/stories/`, `docs/prd-expert-comptable-2026-07-02.md`, `docs/architecture-*`), la **structure des stories frontend** de l'app cabinet : epics, story map, traçabilité FR → écran, décisions d'architecture frontend et découpage en sprints. Il joue pour le frontend le rôle que `sprint-plan-expert-comptable-2026-07-02.md` joue pour le backend. Les fichiers stories détaillés (`docs/frontend-stories/FE-xxx.md`) seront produits **une par une** via `create-story`, avec ce plan comme ancre.

---

## Périmètre & non-périmètre

**Inclus (parcours cabinet P1 & P2 du PRD)** — l'app sert les personas `TENANT_ADMIN` (gérant) et `TENANT_USER` (collaborateur) :
- Inscription cabinet, vérification e-mail, login / session (FR-001, FR-002, FR-003)
- Gestion des utilisateurs + acceptation d'invitation (FR-004)
- Soumission KYC (RCCM/CFE) + affichage de l'état d'onboarding (FR-005, FR-007)
- Catalogue de plans, checkout FedaPay, abonnement & historique (FR-008, FR-009, FR-011)

**Hors périmètre (autre application)** — persona `PLATFORM_ADMIN`, parcours P3 :
- Revue KYC admin globale (FR-006) et dashboard super-admin plateforme (FR-012) → **`admin-panel`** (BFF + front séparé), conforme à l'architecture programme (`docs/architecture-prospera-ecosystem-2026-07-04.md`, décision P8). **Non couvert par cette app.**
- Webhooks FedaPay (FR-010) : purement backend, aucun écran.

> **Note écosystème.** Suite au re-cadrage (addendum PRD 1.2), l'identité (FR-001→004) est servie par **`auth-service`** (IdP, JWT **RS256/JWKS**), le KYC (FR-005) par **`kyc-service`**, la facturation (FR-008→011) par **`expert-comptable`**. **Décision actée : le frontend consomme ces services exclusivement via la gateway (Traefik)** — point d'entrée **unique**, routage par préfixe (`/auth`, `/ec`, `/kyc`), validation JWT fail-fast à l'edge (`docs/architecture-gateway-2026-07-07.md`). Une **seule URL de base** côté client ; les domaines fonctionnels se distinguent par le préfixe de chemin, pas par l'hôte.

---

## Décisions d'architecture frontend

| Sujet | Décision | Justification |
|---|---|---|
| Framework | **Next.js 16 (App Router, `src/`)** — déjà scaffoldé | Choix acté ; SSR/SSG dispo, routing par fichiers, RSC. |
| Langage | **TypeScript strict** | Aligné backend ; contrats d'API typés. |
| Styling | **Tailwind CSS** (déjà installé) + **shadcn/ui** | Composants accessibles non-opinionés sur Tailwind ; pas de design system lourd. |
| Data-fetching / cache serveur | **TanStack Query** | Cache, invalidation, retries, statut de requête ; évite un state global manuel pour les données serveur. |
| Formulaires & validation | **React Hook Form + Zod** | Validation typée partagée (mêmes règles que les DTO backend : mot de passe ≥ 8, e-mail, types de fichiers KYC). |
| Point d'entrée API | **Gateway unique (Traefik)** — une seule URL de base, routage par préfixe (`/auth`, `/ec`, `/kyc`) | Décision actée. Point d'entrée unique, fail-fast JWT à l'edge, pas de CORS multi-hôtes côté navigateur. **Dev :** la gateway n'étant pas requise en dev (services sur ports directs `:3000`-`:3002`), l'URL de base est pilotée par env (`NEXT_PUBLIC_API_BASE_URL`) pour basculer gateway ↔ direct sans changer le code. |
| Contrats d'API (types TS) | **Générés depuis l'OpenAPI de la gateway** | Décision actée. Types client dérivés du Swagger agrégé (ex. `openapi-typescript`) → un seul contrat, aligné sur ce qui est réellement exposé à l'edge ; pas de types écrits à la main qui dérivent. |
| Client HTTP | **Wrapper `fetch` typé** (base = gateway) + refresh silencieux via BFF | Un seul point pour Bearer token, gestion 401 (→ refresh puis retry, sinon re-login) et 403 (codes `KYC_NOT_APPROVED`/`SUBSCRIPTION_REQUIRED` de FR-007 → redirection onboarding). |
| Stockage tokens & session | **Refresh token en cookie httpOnly** (Secure, SameSite=Strict/Lax) détenu par une **couche BFF Next.js (Route Handlers `src/app/api/auth/*`)** ; **access token en mémoire** uniquement | Décision actée (sécurité). Le refresh token n'est **jamais** exposé au JS du navigateur (immunité XSS) ; le cookie vit sur l'**origine du frontend** (pas de cookie cross-site → pas de casse-tête CORS). Le BFF capte le `refreshToken` de la réponse JSON de l'IdP et le pose en cookie **lui-même** → **aucune modif du contrat backend requise**. Le refresh silencieux (avant expiration 15 min) passe par `POST /api/auth/refresh` (Route Handler) qui lit le cookie et appelle l'IdP côté serveur. |
| i18n | **next-intl** (FR par défaut) | `document_output_language` = français ; marchés Togo/Bénin. Prêt pour d'autres locales. |
| État applicatif léger | React Context (session, thème) — pas de Redux | Volumétrie d'état faible ; TanStack Query couvre les données serveur. |
| Tests | **Vitest + Testing Library** (unit/intégration), **Playwright** (e2e parcours) | Couvre P1 (activation) et P2 (onboarding collaborateur) de bout en bout. |
| Qualité | ESLint + Prettier + CI (lint → typecheck → test → build) | Miroir de la discipline backend (NFR-006). |

**Structure cible (`src/`) :**
```
src/
  app/                      # App Router : routes + layouts
    (auth)/                 #   inscription, login, verify-email, accept-invitation
    (app)/                  #   espace cabinet authentifié (users, kyc, billing)
    api/                    #   BFF Next.js (Route Handlers) — gère le cookie httpOnly
      auth/                 #     login, refresh, logout : pose/lit le refresh cookie
    layout.tsx, page.tsx
  components/               # shadcn/ui + composants partagés
  features/                 # logique par domaine (auth, users, kyc, billing)
    <domaine>/{api,hooks,components,schemas}
  lib/                      # client API (base = gateway), session, query-client, utils
  i18n/                     # next-intl (messages FR)
  types/                    # contrats d'API générés depuis l'OpenAPI de la gateway
```

---

## Epics frontend & traçabilité FR

| Epic FE | Nom | Dérive de (backend) | FR couverts | Écrans clés |
|---|---|---|---|---|
| **FE-EPIC-000** | Fondations frontend | EPIC-000 | — (socle NFR) | Setup, client API, layout |
| **FE-EPIC-001** | Authentification & comptes | EPIC-001 / EPIC-005 (auth-service) | FR-001, FR-002, FR-003 | Inscription, login, vérif e-mail |
| **FE-EPIC-002** | Utilisateurs du cabinet | EPIC-002 / EPIC-005 | FR-004 | Invitations, gestion users |
| **FE-EPIC-003** | KYC & onboarding | EPIC-003 (kyc-service) | FR-005, FR-007 | Upload RCCM/CFE, bandeau d'état |
| **FE-EPIC-004** | Abonnement & paiement | EPIC-004 (expert-comptable) | FR-008, FR-009, FR-011 | Plans, checkout FedaPay, historique |

---

## Story map

> Estimations en points (échelle backend, vélocité observée ~24-27/sprint). Chaque story cite la story backend d'appui et le service d'API consommé.

### FE-EPIC-000 — Fondations frontend

**FE-001 — Socle projet (shadcn/ui, structure, i18n FR, qualité)** · 3 pts
Init shadcn/ui sur le Tailwind existant ; structure `features/` + `lib/` ; validation d'env (`.env` typé) ; next-intl (messages FR) ; ESLint/Prettier ; CI lint+typecheck+build.
*Backend d'appui :* STORY-001/003 (conventions, config validée, CI). *API :* —

**FE-002 — Client API (gateway) + BFF cookie httpOnly + refresh silencieux** · 5 pts
Wrapper `fetch` typé sur **URL de base unique = gateway** (`NEXT_PUBLIC_API_BASE_URL`, bascule gateway↔direct en dev) ; injection Bearer (access en mémoire) ; génération des types depuis l'**OpenAPI de la gateway**. **BFF Route Handlers `src/app/api/auth/*`** : `login`/`refresh`/`logout` posent et lisent le **cookie httpOnly** (Secure, SameSite) du refresh token — le refresh **rotatif** (FR-003) se fait côté serveur, invisible du JS. Refresh silencieux avant expiration (15 min) ; mapping erreurs (401 → refresh puis retry, sinon re-login ; 403 `KYC_NOT_APPROVED`/`SUBSCRIPTION_REQUIRED` → redirection onboarding) ; `QueryClient` TanStack + provider.
*Backend d'appui :* STORY-005/024/028 (login/refresh, RS256/JWKS). *API :* auth-service via gateway (`/auth/*`).

**FE-003 — Layout applicatif + navigation + design system de base** · 3 pts
App shell (header, nav latérale, zone contenu) ; thème shadcn ; toasts/feedback ; états de chargement/erreur réutilisables ; garde de layout authentifié vs public.
*Backend d'appui :* — *API :* —

### FE-EPIC-001 — Authentification & comptes

**FE-004 — Inscription cabinet** · 3 pts
Formulaire register (raison sociale, pays, prénom/nom, e-mail, mot de passe) ; validation Zod (miroir DTO : e-mail unique côté serveur, mot de passe ≥ 8) ; `POST /auth/register` ; message post-inscription « e-mail de vérification envoyé » ; gestion doublon e-mail (message générique, FR-001).
*Backend d'appui :* STORY-004/023. *API :* auth-service.

**FE-005 — Login + session + protection des routes** · 5 pts
Formulaire login ; 401 générique (FR-003) ; établissement de session (tokens) ; refresh silencieux au montage/à l'expiration ; logout (révocation refresh) ; guard des routes `(app)/*` (redirection vers login si non authentifié) ; blocage compte `SUSPENDED`.
*Backend d'appui :* STORY-005/024. *API :* auth-service.

**FE-006 — Vérification e-mail (landing + renvoi + garde)** · 3 pts
Page `/verify-email?token=` (succès / expiré / déjà consommé, FR-002) ; bouton renvoyer (limite 3/h côté serveur, feedback UI) ; garde « e-mail non vérifié » (bannière + restriction d'accès aux écrans authentifiés hors verify/logout).
*Backend d'appui :* STORY-006/025. *API :* auth-service.

### FE-EPIC-002 — Utilisateurs du cabinet

**FE-007 — Acceptation d'invitation** · 2 pts
Page `/accept-invitation?token=` ; définition du mot de passe ; e-mail réputé vérifié à l'acceptation ; token 72 h (expiré → message + contact admin) ; connexion automatique ou redirection login.
*Backend d'appui :* STORY-008/025. *API :* auth-service.

**FE-008 — Gestion des utilisateurs (liste, rôles, invitation, suspension)** · 5 pts
Liste paginée (users du tenant, FR-004) ; inviter (e-mail + rôle) ; changer rôle ; suspendre/réactiver ; supprimer ; **garde-fous UI** (interdire retrait/rétrogradation du dernier `TENANT_ADMIN` — désactivation + explication) ; écrans réservés `TENANT_ADMIN` (masquage + 403 géré).
*Backend d'appui :* STORY-008/009/026. *API :* auth-service.

### FE-EPIC-003 — KYC & onboarding

**FE-009 — Upload documents KYC (RCCM / CFE)** · 5 pts
Sélecteur de fichiers (PDF/JPEG/PNG ≤ 10 Mo, FR-005) ; validation client (taille + type par extension, message si non conforme — la vérif magic bytes reste serveur) ; upload multipart avec progression ; re-soumission après rejet (nouvelle version) ; états par document.
*Backend d'appui :* STORY-011/012, STORY-020/021 (kyc-service). *API :* kyc-service.

**FE-010 — Bandeau d'onboarding + statut KYC** · 3 pts
Lecture de l'état effectif (`GET /tenant` : e-mail, KYC, abonnement — FR-007) ; **stepper d'activation** (e-mail vérifié → KYC approuvé → abonnement actif) ; affichage du motif de rejet KYC ; CTA contextuel vers l'étape suivante ; états `PENDING_DOCUMENTS`/`UNDER_REVIEW`/`REJECTED`/`APPROVED`.
*Backend d'appui :* STORY-012/029 (read-model état tenant). *API :* expert-comptable.

### FE-EPIC-004 — Abonnement & paiement

**FE-011 — Catalogue de plans** · 2 pts
`GET /billing/plans` (plans actifs : nom, montant XOF, périodicité, limites — FR-008) ; sélection d'un plan ; garde « KYC non approuvé » (CTA désactivé + explication `KYC_NOT_APPROVED`).
*Backend d'appui :* STORY-015. *API :* expert-comptable.

**FE-012 — Checkout FedaPay + retour de paiement** · 5 pts
`POST /billing/checkout` → redirection vers l'URL FedaPay (FR-009) ; page de retour (succès/échec/abandon) ; polling/affichage du statut d'abonnement post-webhook (l'activation réelle est asynchrone côté backend, FR-010) ; relance possible d'un checkout ; gestion 409 (abonnement déjà actif).
*Backend d'appui :* STORY-016/017. *API :* expert-comptable.

**FE-013 — Abonnement courant + historique des transactions** · 3 pts
`GET /billing/subscription` (plan, statut, période — FR-011) ; `GET /billing/transactions` (historique paginé : montant, méthode, statut, date) ; état `EXPIRED` (accès modules coupé) ; rappels d'échéance affichés.
*Backend d'appui :* STORY-018. *API :* expert-comptable.

---

## Découpage en sprints (proposé)

**Sprint FE-1 — Socle + Authentification (24 pts)**
Objectif : un cabinet peut s'inscrire, vérifier son e-mail, se connecter, et un invité peut accepter son invitation. App shell + client API + session fonctionnels.
`FE-001`(3) · `FE-002`(5) · `FE-003`(3) · `FE-004`(3) · `FE-005`(5) · `FE-006`(3) · `FE-007`(2)

**Sprint FE-2 — Utilisateurs + KYC + Abonnement (23 pts)**
Objectif : parcours d'activation P1 complet côté UI (gestion users, upload KYC + onboarding, plans → paiement FedaPay → abonnement/historique).
`FE-008`(5) · `FE-009`(5) · `FE-010`(3) · `FE-011`(2) · `FE-012`(5) · `FE-013`(3)

**Total : 13 stories · 47 points · 2 sprints.**

---

## Dépendances transverses

- **Contrats d'API (acté).** Types TS **générés depuis l'OpenAPI de la gateway** (Swagger agrégé). Un seul contrat source ; à régénérer quand un endpoint change. Cadré en FE-002.
- **Refresh RS256 + BFF cookie (acté).** FE-002 conditionne toutes les stories authentifiées (FE-005+). À livrer en premier. Le refresh token vit en **cookie httpOnly** posé par le BFF Next.js ; l'access token reste en mémoire.
- **État tenant (FR-007).** FE-010 lit `GET /tenant` (via `/ec/tenant`) ; les gardes `KYC_NOT_APPROVED` / `SUBSCRIPTION_REQUIRED` (FE-002, FE-011) reposent sur les codes d'erreur backend.
- **Point d'entrée gateway (acté).** URL de base **unique** via la gateway Traefik (`docs/architecture-gateway-2026-07-07.md`). Préfixes : `/auth/*` (public : login/register/refresh), `/ec/*` (expert-comptable), `/kyc/*`. **En dev**, la gateway n'est pas requise — `NEXT_PUBLIC_API_BASE_URL` permet de pointer les ports directs.

---

## Décisions verrouillées (2026-07-09)

- **Point d'entrée : gateway unique** (Traefik) — routage par préfixe, une seule URL de base côté client.
- **Contrats d'API : générés depuis l'OpenAPI de la gateway** (pas de types manuels).
- **Refresh token : cookie httpOnly** (Secure/SameSite) détenu par un **BFF Next.js** (Route Handlers `src/app/api/auth/*`) ; access token en mémoire uniquement.

## Prochaines étapes

1. ~~Valider ce plan~~ ✅ Périmètre, découpage, stack et décisions transverses validés.
2. Créer le premier fichier story détaillé : `create-story FE-001` (puis enchaîner).
3. Backlog trackable : `docs/frontend-sprint-status.yaml` (créé avec ce plan).

---

---

## Addendum v2 (2026-07-12) — Programme multi-frontend

> Cet addendum **complète et re-séquence** le plan ci-dessus sans le contredire sur les fondations (stack, gateway, BFF cookie, contrats OpenAPI restent valides). Il l'aligne sur le **PLAN FINAL backend** (`docs/synthese-services-prospera-2026-07-10.md`, `docs/sprint-status.yaml`) et sur les décisions de topologie prises avec le PO le 2026-07-12.

### 1. Le frontend est un programme, pas une app

PROSPERA/Money Vibes est un **écosystème multi-vertical**. Côté frontend, cela donne **trois familles d'interfaces** :

| Interface | Persona | Rôle | Hébergement | Artefacts de suivi |
|---|---|---|---|---|
| **admin-panel** (Money Vibes) | `PLATFORM_ADMIN` | **Tour de contrôle interne** : orgs, revue KYC, entitlements, catalogue, dashboard, **provisioning des verticaux** | Hébergé par MV | `frontend-sprint-plan-admin-panel-2026-07-12.md` + `frontend-sprint-status.yaml` |
| **app cliente** (ce plan) | `TENANT_ADMIN` / `TENANT_USER` | App **config-driven** d'un vertical ; affiche ses modules selon le type de vertical + les **entitlements**. Vertical pilote = **cabinet**. | MV **ou** cloud du client | `frontend-sprint-plan-expert-comptable-*.md` + `frontend-sprint-status.yaml` |
| **verticaux futurs** (IMF, distributeurs, assurances) | idem | **Mêmes** app cliente et code, déployés en instances isolées + config propre | cloud du client (souvent) | `vertical_backlog` du tracker (placeholder, JIT) |

### 2. Topologie retenue — Option B : « 1 code / N déploiements isolés »

- **Une seule base de code cliente**, configurable : elle n'affiche que les modules du vertical courant + entitlements `ACTIVE`. Un **nouveau vertical = de la configuration + quelques modules**, pas un nouveau projet.
- **Déploiement isolé par client** : même image **Docker**, paramétrée par **variables d'environnement** (`NEXT_PUBLIC_API_BASE_URL` = gateway de l'instance, `NEXT_PUBLIC_VERTICAL`, branding, locale). L'instance MV/cabinet est hébergée par MV ; une instance externe (ex. IMF) est déployable **sur le cloud du client**.
- **Contraintes socle** (à garantir dès FE-001/002/003) : app **containerisée**, **100 % configurable par env** (aucune URL ni branding en dur), **modules pilotés par entitlements lus au runtime**, cloud-agnostique.
- **Résidence des données** (IMF/BCEAO) : le choix du cloud devient celui du client ; l'app reste portable. La question stack **dédiée-vs-mutualisée** par vertical est tranchée **JIT** à l'ouverture du vertical.

### 3. Nouveaux epics frontend

| Epic FE | Nom | Dérive de (backend) | FR / périmètre |
|---|---|---|---|
| **FE-EPIC-006** | Accès modules & entitlements | EPIC-007 (`platform-catalog-service`) + `TenantStateGuard` | Home des modules ; le vertical n'affiche que les modules `ACTIVE` ; gates KYC/abonnement/entitlement. **(FE-014)** |
| **FE-EPIC-005** | Bilan & Prévisionnel | EPIC-009→014 (`bilan-service`, PRD `docs/prd-bilan-service-2026-07-10.md`) | FR-001→FR-024 : import balance → table de passage → liasse OHADA → validation/immutabilité → prévisionnel → consultation/export. **(FE-B00→FE-B15)** |

### 4. Re-séquencement du paiement (PA-1 + DG-1)

- Le checkout/webhooks passent au **`paiement-service`** (Module 2, ~déc. 2026) ; les plans restent au vertical (`STORY-015`).
- Sous **dogfooding (DG-1)**, l'entitlement est octroyé **manuellement via l'admin-panel** avant tout paiement → le parcours paiement n'est **pas** prioritaire.
- ⇒ **FE-011/012/013 sortent de FE-2 et rejoignent le sprint FE-7 (JIT)**, aligné sur `paiement-service`. FE-012 devient « Checkout PI SPI BCEAO + FedaPay ».

### 5. Découpage des sprints — inséré **après FE-010** (le frontend suit la dispo backend ~1 sprint)

| Sprint FE | Objectif | Stories | Pts | Backend requis |
|---|---|---|---|---|
| **FE-1** | Socle + Auth | FE-001→007 | 24 | auth-service ✅ (livré) |
| **FE-2** | Users + KYC + Onboarding + **accès modules** | FE-008, FE-009, FE-010, **FE-014** | 18 | kyc-service ✅, `/tenant/state` ✅ |
| **FE-3** | **Bilan** : exercices + import de balance | FE-B00→FE-B05 | 20 | EPIC-008 (S8) + EPIC-009 (S10) |
| **FE-4** | **Bilan** : référentiels/mapping + liasse (Bilan, CR, TFT) | FE-B06→FE-B09 | 18 | EPIC-010/011 (S11-12) |
| **FE-5** | **Bilan** : validation/immutabilité + prévisionnel | FE-B10→FE-B12 | 18 | EPIC-012/013 (S13-14) |
| **FE-6** | **Bilan** : consultation + export PDF/Excel + durcissement 🏁 | FE-B13→FE-B15 | 13 | EPIC-014 (S14) |
| **FE-7 (JIT)** | Abonnement & paiement *(différé)* | FE-011, FE-012, FE-013 | 10 | paiement-service (S15) |

Détail des stories (titres, FR, backend_ref, API) : `docs/frontend-sprint-status.yaml` (mis à jour v2).

**Total app cliente : 7 sprints · ~30 stories · ~121 pts.** (dont Bilan = 16 stories / ~59 pts — le gros du chantier, absent du plan initial.)

### 6. Note sur « expert-comptable sans intégration API sérieuse »

L'app cabinet existante (`prospera-frontend-expert-comptable`) est scaffoldée mais **pas réellement câblée aux APIs**. Le socle (FE-001/002/003) **est** justement cette mise à niveau : client API unique sur la gateway, types générés depuis l'**OpenAPI**, BFF cookie httpOnly, refresh RS256, shell **config-driven**. Aucun mock ne doit subsister à la sortie de FE-2 : toutes les données passent par la gateway.

### 7. Piste admin-panel (séparée)

L'admin-panel Money Vibes fait l'objet de **son propre plan** : `frontend-sprint-plan-admin-panel-2026-07-12.md`. Périmètre v1 : **Orgs + revue KYC**, **Entitlements + catalogue**, **Dashboard + provisioning des verticaux**. (Plans/abonnements → plus tard, avec le Module 2.) C'est **depuis là** que sont configurés les modules/entitlements que l'app cliente lit.

---

**Document créé avec la méthode BMAD v6 — dérivé des artefacts backend PROSPERA (cabinet expert-comptable). Addendum v2 : programme multi-frontend aligné PLAN FINAL 2026-07-10.**
