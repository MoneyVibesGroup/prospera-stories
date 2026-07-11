# Rapport de Solutioning Gate Check

**Date :** 2026-07-02
**Projet :** expert-comptable (micro-service NestJS, niveau 3)
**Réviseur :** System Architect (BMAD)
**Documents examinés :**
- PRD : `docs/prd-expert-comptable-2026-07-02.md` (v1.0)
- Architecture : `docs/architecture-expert-comptable-2026-07-02.md` (v1.0)

---

## Résumé exécutif

**Décision : ✅ PASS** (avec 4 recommandations à traiter avant la mise en production, non bloquantes pour le développement)

L'architecture couvre la totalité des exigences du PRD avec une traçabilité directe (identifiants FR/NFR partagés entre les deux documents, vérifiés mécaniquement). Les décisions structurantes sont justifiées avec compromis explicites (journal D1–D6). Les points faibles sont concentrés sur l'exploitation en production : hébergement cible non décidé, stratégie de sauvegarde/restauration absente, alerting non spécifié. Aucun de ces points ne bloque le démarrage des epics 000–004 ; tous doivent être tranchés avant la mise en production (au plus tard pendant l'EPIC-004).

**Constats clés :**
- Couverture FR : 12/12 (100 %) — chaque FR est assigné à des composants nommés
- Couverture NFR : 6/6 (100 %) — chaque NFR a une solution spécifique et un moyen de validation
- Qualité : 33/39 points de contrôle applicables (85 %)
- Aucun bloqueur ; 4 écarts de niveau « exploitation » documentés ci-dessous

---

## Couverture des exigences fonctionnelles

**Total : 12 — Couvertes : 12 (100 %) — Manquantes : 0**

| FR | Exigence | Composants assignés | Évaluation |
|----|----------|--------------------|------------|
| FR-001 | Création compte tenant + super-admin | AuthModule, TenantsModule, UsersModule | ✓ Complète — atomicité traitée (D4 : replica set dev, invariants par index) |
| FR-002 | Vérification e-mail | AuthModule, MailModule (Bull) | ✓ Complète — token hashé, TTL, rate limit, EmailVerifiedGuard |
| FR-003 | Authentification JWT | AuthModule | ✓ Complète — refresh rotatif avec détection de réutilisation |
| FR-004 | Gestion utilisateurs du tenant | UsersModule, MailModule | ✓ Complète — invitations, garde-fou dernier admin |
| FR-005 | Soumission KYC (RCCM + CFE) | KycModule, StorageService | ✓ Complète — magic bytes, versionnage, bucket privé |
| FR-006 | Revue KYC admin global | KycModule, AdminModule | ✓ Complète — file d'attente, URLs présignées, motif obligatoire |
| FR-007 | Restriction d'accès par état | TenantStateGuard, TenantsModule | ✓ Complète — matrice d'accès explicite, extensible au module Bilan par décorateur |
| FR-008 | Catalogue de plans | BillingModule (Plan) | ✓ Complète — seed, désactivation sans impact sur abonnements en cours |
| FR-009 | Checkout FedaPay | BillingModule (PaymentProvider) | ✓ Complète — abstraction provider, sandbox/live par env |
| FR-010 | Webhooks signés + idempotence | BillingModule, Bull, WebhookEvent | ✓ Complète — conception la plus détaillée du document (D5) |
| FR-011 | Historique + cycle de vie abonnement | BillingModule (Transaction) | ✓ Complète — job quotidien d'expiration, relances J-7/J-1 |
| FR-012 | Dashboard super-admin global | AdminModule | ✓ Complète — seed du PLATFORM_ADMIN hors API publique |

**FRs partiellement couvertes :** aucune.

---

## Couverture des exigences non fonctionnelles

**Total : 6 — Pleinement traitées : 6 (100 %) — Partielles : 0 — Manquantes : 0**

| NFR | Exigence | Solution architecture | Qualité de la solution |
|-----|----------|----------------------|------------------------|
| NFR-001 | Sécurité OWASP | bcrypt 12, JWT 15 min + refresh rotatif, throttler différencié, URLs présignées, HMAC temps constant, validation .env au boot | **Bonne** — spécifique et mesurable ; validation prévue (e2e + security-review) |
| NFR-002 | Isolation multi-tenant | TenantScopedRepository (filtre imposé par l'infrastructure), tests d'isolation bloquants en CI | **Bonne** — le point fort du document : l'isolation ne dépend pas de la discipline du développeur |
| NFR-003 | Fiabilité paiements | WebhookEvent unique + Bull retry ×5 + re-lecture API FedaPay + index unique fedapayTransactionId + transition conditionnelle | **Bonne** — défense en profondeur ; tests d'idempotence exigés |
| NFR-004 | Performance p95 < 300 ms | Index sur tous les chemins de requête, pagination, travail lourd asynchrone | **Correcte** — proportionnée à la volumétrie annoncée (~50 tenants) |
| NFR-005 | Observabilité | pino structuré (requestId/tenantId), journal WebhookEvent, providerSnapshot, /health Terminus | **Correcte** — voir recommandation R3 (alerting) |
| NFR-006 | Docs + tests ≥ 80 % | Swagger généré des DTO, Jest + mongodb-memory-server, e2e supertest, seuil CI | **Bonne** |

---

## Contrôle qualité de l'architecture

**Score : 33/39 points applicables (85 %)** — 3 points N/A exclus (frontend : service API pur, le choix frontend est hors périmètre de ce micro-service).

### Points validés (sélection)

- Pattern énoncé et justifié (monolithe modulaire, réversibilité argumentée)
- 8 composants avec responsabilités, interfaces, dépendances et FR couverts
- Choix technologiques justifiés **avec compromis** (D1–D6 : discriminateur vs DB-par-tenant, index uniques vs transactions, S3 vs GridFS, e-mail unique global…)
- Modèle de données complet : 7 schémas Mongoose avec index nommés, machines à états explicites, index partiel unique pour « une souscription active par tenant »
- API REST versionnée, ~30 endpoints listés, chaîne d'auth en 4 guards ordonnés, matrice d'accès
- Sécurité : authn/authz/chiffrement/uploads traités spécifiquement
- Organisation du code, stratégie de tests, CI/CD, environnements (dev/staging/prod) définis
- Traçabilité FR et NFR présente ; risques et points ouverts listés (4)

### Points en écart

| # | Contrôle | Constat | Gravité |
|---|----------|---------|---------|
| E1 | Infrastructure de production définie | Docker et compose de dev précis ; **hébergement cible prod non décidé** (VPS, PaaS, K8s ?) — « reverse-proxy » et « orchestrateur » mentionnés sans choix | Majeure (avant prod) |
| E2 | Stratégie de sauvegarde / DR | **Absente** : pas de fréquence de backup MongoDB, pas de RPO/RTO, pas de procédure de restauration — sensible pour des documents KYC et des transactions | Majeure (avant prod) |
| E3 | Monitoring : alerting | Logs et health check définis, mais **aucun canal d'alerte** (échec définitif d'un job de paiement → qui est prévenu, comment ?) | Modérée |
| E4 | Haute disponibilité / load balancing | Non traités — implicitement mono-instance | Mineure (volumétrie phase 1 : acceptable, à documenter comme choix assumé) |
| E5 | Infrastructure as Code | Non traitée (compose de dev seulement) | Mineure |
| E6 | Capacity planning / estimation de coûts | Annexes du template non renseignées | Mineure |

---

## Problèmes critiques

**Bloqueurs : aucun.**

Aucun écart n'empêche de démarrer l'implémentation : les epics 000–003 ne dépendent d'aucun des points E1–E6, et l'EPIC-004 (paiement) n'en dépend que pour sa mise en production.

---

## Recommandations

- **R1 (avant fin EPIC-004)** — Décider de l'hébergement de production (recommandation par défaut pour cette phase : un PaaS ou VPS unique + MongoDB Atlas M2/M5 + Redis managé ; K8s est surdimensionné) et l'ajouter au document d'architecture (E1).
- **R2 (avant mise en production)** — Définir la politique de sauvegarde : snapshots Atlas quotidiens + rétention 30 j minimum, versioning du bucket KYC, RPO/RTO cibles et test de restauration documenté (E2).
- **R3 (pendant EPIC-004, story S4.3)** — Ajouter un canal d'alerte pour les jobs en échec définitif (dead-letter Bull → e-mail ou Slack admin) ; c'est le complément naturel de NFR-003 (E3).
- **R4 (documentation, 15 min)** — Acter dans le journal de décisions que la phase 1 est mono-instance sans HA, avec les conditions de passage à N instances (sessions déjà stateless via JWT : le chemin est ouvert) (E4).

---

## Décision de gate

**Décision : ✅ PASS**

**Critères appliqués :**
- Couverture FR ≥ 90 % → **100 %** ✓
- Couverture NFR ≥ 90 % → **100 %** ✓
- Contrôles qualité ≥ 80 % → **85 %** ✓
- Aucun bloqueur critique → **confirmé** ✓

**Justification :** la couverture des exigences est totale et les solutions sont spécifiques (pas de généralités : chaque NFR a un mécanisme nommé et un moyen de validation). Les écarts identifiés relèvent tous de l'exploitation en production, pas de la conception du service, et disposent d'une échéance claire (R1–R4). Un CONDITIONAL PASS aurait été excessif : aucun écart ne conditionne le travail des sprints 1 à 3.

---

## Prochaines étapes

Phase 4 — Implémentation :

1. `/bmad:sprint-planning` — détailler les stories des epics 000 → 004 (~19 stories, 4 sprints)
2. Traiter R1–R3 comme tâches rattachées à l'EPIC-004 ; R4 = mise à jour documentaire immédiate possible
3. `/bmad:create-story` puis `/bmad:dev-story` pour dérouler l'EPIC-000

Documentation de planification complète : PRD ✓ · Architecture ✓ · Gate check ✓

---

**Rapport généré avec BMAD Method v6 — Phase 3 (Solutioning Gate)**
