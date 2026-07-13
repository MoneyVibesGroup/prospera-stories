# Plan Frontend : Admin-Panel Money Vibes (`prospera-admin-panel`)

**Date :** 2026-07-12
**Scrum Master :** vivian (BMAD)
**Type de projet :** Frontend web (Next.js 16 / App Router) — **BFF admin**
**Périmètre :** Console d'administration **interne Money Vibes** (persona `PLATFORM_ADMIN`)
**Statut :** Cartographie + backlog (préalable à `create-story` par story)

> **But de ce document.** Définir la **tour de contrôle** de l'écosystème PROSPERA : l'application que **Money Vibes exploite lui-même** pour piloter les organisations, la revue KYC, les **entitlements** (droits d'usage des modules), le **catalogue** (modules/versions/référentiels), le **dashboard** et le **provisioning des verticaux** (cabinet, IMF, distributeurs, assurances). C'est **depuis cette console** qu'est configuré ce que les apps clientes affichent. Pendant du plan de l'app cliente (`docs/frontend-sprint-plan-expert-comptable-2026-07-08.md`, addendum v2).

---

## Positionnement dans le programme

```
                       ┌──────────────────────────────────────────┐
                       │   ADMIN-PANEL Money Vibes (ce plan)       │
                       │   persona PLATFORM_ADMIN — hébergé par MV │
                       │   • Orgs + revue KYC                       │
                       │   • Entitlements (module × org × réf.)     │
                       │   • Catalogue (modules/versions/réf.)      │
                       │   • Dashboard + provisioning verticaux     │
                       └───────────────┬──────────────────────────┘
                        configure / octroie │ (entitlement.changed, KYC, catalogue)
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
   ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
   │ App cliente CABINET│        │ App cliente IMF   │  ...   │ App cliente ASSUR.│
   │ (vertical pilote)  │        │ (différé, JIT)    │        │ (différé, JIT)    │
   │ affiche ses modules│        │ instance isolée   │        │ instance isolée   │
   │ selon entitlements │        │ (cloud du client) │        │                   │
   └───────────────────┘        └───────────────────┘        └───────────────────┘
        MÊME base de code cliente config-driven — « 1 code / N déploiements isolés »
```

L'admin-panel **ne possède aucune donnée métier** : c'est un **BFF** (Backend-for-Frontend) qui agrège et proxifie les services amont (`auth-service`, `kyc-service`, `platform-catalog-service`) en relayant le **JWT admin**. Il reflète l'architecture backend du service `admin-panel` (décision **AD-2**, `docs/architecture-prospera-ecosystem-2026-07-04.md` P8, `docs/tech-spec-admin-panel-2026-07-10.md`).

---

## Périmètre & non-périmètre

**Inclus (v1) — persona `PLATFORM_ADMIN` :**
- **Orgs + revue KYC** : vue agrégée des organisations (identité `auth` + statut KYC `kyc` + entitlements `catalog`) ; file de revue KYC, détail + documents présignés, approve/reject + motif.
- **Entitlements + catalogue** : octroi/mise à jour/révocation d'entitlements (module × org × référentiel/version) ; gestion du catalogue (Module / ModuleVersion / ReferentielVersion, garde-fou N/N-1).
- **Dashboard + provisioning verticaux** : tableau de bord plateforme (orgs, usage, santé de la chaîne KYC) ; **provisioning/activation d'un vertical** pour une org (type de vertical + modules initiaux + référentiel) — ce qui « allume » les rayons de l'app cliente.

**Hors périmètre v1 (différé) :**
- **Plans & abonnements / paiements** : configuration tarifaire et suivi paiements → **plus tard**, avec `paiement-service` (Module 2, ~déc. 2026). En v1, l'octroi d'entitlement est **manuel** (dogfooding DG-1).
- **Édition fine des paquets de référentiel** (contenu des tables de passage) : le catalogue **référence** des versions ; l'édition du contenu comptable est hors console v1.
- **Gestion multi-instance à distance** (piloter une instance IMF isolée depuis MV) : à cadrer JIT quand un vertical externe s'ouvre.

---

## Décisions d'architecture frontend (admin-panel)

| Sujet | Décision | Justification |
|---|---|---|
| Framework | **Next.js 16 (App Router, `src/`)** | Cohérent avec l'app cliente ; socle partagé réutilisable. |
| Nature | **BFF** (Route Handlers) qui agrège/proxifie `auth`/`kyc`/`catalog` | Le backend `admin-panel` (AD-2) ne possède pas de base ; le front consomme un BFF qui relaie le JWT admin. |
| Point d'entrée API | **Gateway unique** (préfixes `/auth`, `/kyc`, `/catalog`, `/admin`) | Même contrat edge que l'app cliente ; types générés depuis l'**OpenAPI**. |
| Auth / session | Login `PLATFORM_ADMIN` (auth-service) ; **refresh cookie httpOnly via BFF** ; access en mémoire | Même patron de sécurité que l'app cliente (immunité XSS). |
| RBAC | **`PLATFORM_ADMIN` strict** ; toute action inter-org | Console interne MV ; aucune donnée de tenant exposée à un tenant. |
| Socle partagé | Réutilise **design system, client API, BFF, shell** communs à l'app cliente | « Écrire le socle une fois. » |
| Déploiement | **Hébergé par Money Vibes** (instance unique interne), containerisé | Tour de contrôle interne, non déployée chez les clients. |
| i18n | **next-intl** (FR) | Aligné programme. |
| Tests | Vitest + Testing Library + Playwright (e2e chaîne KYC bout-en-bout) | Miroir discipline backend. |

---

## Epics admin-panel & traçabilité backend

| Epic | Nom | Dérive de (backend) | Périmètre |
|---|---|---|---|
| **AP-EPIC-000** | Socle admin & sécurité | STORY-046 (scaffold BFF), EPIC-005 (auth admin) | Login PLATFORM_ADMIN, BFF, RBAC, layout console |
| **AP-EPIC-001** | Orgs & revue KYC | STORY-047 (vue agrégée), STORY-013/048 (revue KYC proxifiée) | Liste/détail orgs, file KYC, approve/reject |
| **AP-EPIC-002** | Entitlements & catalogue | EPIC-007 (STORY-032/033/034), STORY-048 (grant proxifié) | Catalogue modules/versions/réf., octroi/révocation entitlements |
| **AP-EPIC-003** | Dashboard & provisioning | STORY-047/049 (jalon Module 0), P8 provisioning | Tableau de bord plateforme, provisioning vertical, e2e chaîne KYC |

---

## Story map

> Estimations en points (échelle backend). Chaque story cite la story backend d'appui et le service consommé (via gateway).

### AP-EPIC-000 — Socle admin & sécurité

**AP-01 — Socle admin-panel (BFF, login PLATFORM_ADMIN, RBAC, layout console)** · 5 pts
Scaffold Next.js (socle partagé) ; BFF Route Handlers (cookie httpOnly, relais JWT admin) ; login `PLATFORM_ADMIN` (auth-service) ; garde RBAC stricte (403 pour non-admin) ; app shell console (nav : Orgs, KYC, Entitlements, Catalogue, Dashboard).
*Backend d'appui :* STORY-046, STORY-024/026. *API :* auth-service / admin-panel (BFF).

### AP-EPIC-001 — Orgs & revue KYC

**AP-02 — Vue agrégée des organisations (identité + KYC + entitlements)** · 5 pts
Liste paginée des orgs (raison sociale, pays, statut identité, statut KYC, entitlements actifs) ; détail d'une org (agrégat `auth` + `kyc` + `catalog`) ; **dégradation partielle** si une source amont est indisponible ; recherche/filtre.
*Backend d'appui :* STORY-047 (+ STORY-027 admin orgs, STORY-033 entitlements). *API :* admin-panel (BFF) → auth/kyc/catalog.

**AP-03 — Revue KYC (file, détail, documents présignés, approve/reject)** · 5 pts
File de revue par statut (`UNDER_REVIEW`) ; détail du dossier + **URLs présignées** des pièces (RCCM/CFE) téléchargeables ; actions **approve** / **reject + motif** (proxifiées, relais JWT admin) ; feedback temps réel (le read-model KYC se met à jour via Kafka côté backend) ; gestion 404/409 (re-décision).
*Backend d'appui :* STORY-013 (revue admin kyc-service), STORY-048 (actions proxifiées). *API :* admin-panel (BFF) → kyc-service.

### AP-EPIC-002 — Entitlements & catalogue

**AP-04 — Catalogue (modules / versions / référentiels)** · 5 pts
CRUD `Module` / `ModuleVersion` / `ReferentielVersion` (PLATFORM_ADMIN) ; affichage du **garde-fou N/N-1** (versions supportées) ; consultation checksum des paquets de référentiel.
*Backend d'appui :* STORY-032 (catalogue + admin CRUD). *API :* platform-catalog-service.

**AP-05 — Entitlements (octroi / mise à jour / révocation module × org × référentiel)** · 5 pts
Pour une org : **grant / update / revoke** d'un entitlement (module + version + référentiel) ; vue de réconciliation (état effectif) ; validation contre le catalogue ; c'est **l'action qui « allume » un module** dans l'app cliente de l'org (via `entitlement.changed`).
*Backend d'appui :* STORY-033 (entitlements), STORY-034 (event), STORY-048 (grant proxifié). *API :* platform-catalog-service (via BFF).

### AP-EPIC-003 — Dashboard & provisioning

**AP-06 — Provisioning d'un vertical pour une org** · 5 pts
Activer un **vertical** (cabinet / imf / distributeur / assurance) pour une org : type de vertical + modules initiaux + référentiel → séquence d'entitlements ; pré-requis (KYC approuvé) contrôlés ; trace de l'action. Prépare l'ouverture des verticaux (réutilise AP-05).
*Backend d'appui :* STORY-033/034 (+ provisioning P8). *API :* platform-catalog-service (via BFF).

**AP-07 — Dashboard plateforme + e2e chaîne KYC 🏁** · 5 pts
Tableau de bord (orgs par statut, dossiers KYC en attente, entitlements actifs, santé de la chaîne KYC/OCR) ; **e2e chaîne KYC complète** (inscription → upload → OCR → revue admin-panel → approbation), jalon Module 0.
*Backend d'appui :* STORY-049 (e2e chaîne KYC). *API :* admin-panel (BFF).

---

## Découpage en sprints (proposé — suit la dispo backend)

> Le backend `admin-panel`/`catalog` arrive aux **sprints backend 7 (catalog), 9 (scaffold admin-panel + vue orgs), 10 (actions proxifiées + jalon KYC)**. Le frontend admin suit ~1 sprint derrière. À planifier **en parallèle** de l'app cliente (arbitrage de capacité à faire — 1 dev).

| Sprint | Objectif | Stories | Pts | Backend requis |
|---|---|---|---|---|
| **AP-1** | Socle admin + vue des orgs | AP-01, AP-02 | 10 | STORY-046/047 (backend S9) |
| **AP-2** | Revue KYC + catalogue + entitlements | AP-03, AP-04, AP-05 | 15 | STORY-013/048 (S10), STORY-032/033/034 (S7) |
| **AP-3** | Provisioning + dashboard + e2e chaîne KYC 🏁 | AP-06, AP-07 | 10 | STORY-049 (S10) |

**Total admin-panel : 3 sprints · 7 stories · 35 points.**

---

## Dépendances transverses

- **Socle partagé** avec l'app cliente (design system, client API, BFF cookie, shell) — factorisé, pas dupliqué.
- **`platform-catalog-service` (EPIC-007, backend S7)** conditionne AP-04/05/06 (catalogue + entitlements). À livrer côté backend avant AP-2.
- **Revue KYC backend** : STORY-013 (kyc-service) + STORY-048 (proxy admin-panel) conditionnent AP-03.
- **Provisioning (P8)** : AP-06 réutilise l'octroi d'entitlement ; la gestion **multi-instance à distance** (verticaux isolés) est **hors v1**, cadrée JIT.
- **Ordre recommandé** : AP-1 peut démarrer dès le backend S9 ; AP-2 attend le catalog (S7 backend, déjà en avance) + les actions proxifiées (S10).

---

## Décisions verrouillées (2026-07-12)

- **admin-panel = console interne Money Vibes** (`PLATFORM_ADMIN`), **BFF sans base**, hébergée par MV.
- **Périmètre v1** : Orgs + revue KYC · Entitlements + catalogue · Dashboard + provisioning verticaux. **Plans/abonnements différés** (Module 2).
- **C'est la tour de contrôle** : l'octroi d'entitlement y est **manuel** (dogfooding) et pilote ce que l'app cliente affiche.
- **Topologie clients** : « 1 code / N déploiements isolés » (app cliente unique config-driven) — l'admin-panel provisionne, il ne duplique pas d'app.

## Prochaines étapes

1. Valider ce plan (périmètre v1, découpage AP-1→AP-3).
2. Arbitrer la capacité front (1 dev) entre **app cliente** (FE-1→) et **admin-panel** (AP-1→) — probablement en alternance selon la dispo backend.
3. `create-story AP-01` puis enchaîner ; tracker : `docs/frontend-sprint-status.yaml`.

---

**Document créé avec la méthode BMAD v6 — dérivé des artefacts backend PROSPERA (admin-panel AD-2 / catalog EPIC-007 / ecosystem P8).**
