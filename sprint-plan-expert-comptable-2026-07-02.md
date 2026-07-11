# Plan de Sprint : Micro-service ExpertComptable

**Date :** 2026-07-02 *(révisé 2026-07-03 : extraction kyc-service ; 2026-07-04 : re-cadrage écosystème + IdP auth-service ; 2026-07-07 : capacités partagées P7/P8 — catalog-service + bilan-service)*
**Scrum Master :** vivian (BMAD)
**Niveau de projet :** 3
**Total stories :** 39
**Total points :** 196
**Sprints planifiés :** 9
**Équipe :** 1 développeur + assistance IA (BMAD) — capacité ~34 pts/sprint, vélocité observée 33/23
**Cadence :** sprints de 2 semaines

---

## Résumé exécutif

Ce plan décompose les 5 epics du PRD (EPIC-000 → EPIC-004) en 21 stories estimées, réparties sur 4 sprints de 2 semaines. Le découpage suit les frontières d'epics (un domaine terminé avant de passer au suivant), ce qui convient à un travail solo : Sprint 1 pose les fondations et l'authentification, Sprint 2 livre la gestion des utilisateurs et le socle KYC, Sprint 3 extrait le KYC dans le micro-service `kyc-service`, Sprint 4 concentre l'abonnement FedaPay. Les sprints 1 et 2 sont chargés (~97 %) mais portent du code bien compris et accéléré par l'IA (scaffolding, CRUD, DTOs) ; les sprints 3 et 4 sont volontairement plus légers (68 %) pour absorber, respectivement, le risque d'orchestration multi-services (extraction) et d'intégration FedaPay (webhooks, idempotence).

> **Révision 2026-07-03 :** extraction de l'EPIC-003 (KYC) dans un micro-service `kyc-service`.
>
> **Révision 2026-07-04 — re-cadrage écosystème (majeure).** PROSPERA devient un **écosystème multi-vertical** avec un **fournisseur d'identité `auth-service` (IdP)** partagé et un **bus Apache Kafka**. Source de vérité : `docs/architecture-prospera-ecosystem-2026-07-04.md` et `docs/architecture-auth-service-2026-07-04.md`. Impact planning : ajout de **EPIC-005** (extraction auth-service, racine) et **EPIC-006** (expert-comptable → relying party) ; le kyc (EPIC-003 restant) est **rebasé** (Kafka + validation JWKS) et **ré-ordonné après l'auth**. Nouvelle séquence : **auth-service → relying-party → kyc-service → FedaPay**. Total 102 → **159 pts**, 4 → **7 sprints**.
>
> **Révision 2026-07-07 — capacités partagées P7/P8 (catalog + bilan).** Ajout de deux capacités plateforme **après** le MVP vertical (FedaPay) : **EPIC-007 `catalog-service`** (`:3003`) — catalogue Module/ModuleVersion/ReferentielVersion + **entitlements** (source de vérité « quel droit / quelle version pour quelle org », **P8**) + topic `entitlement.changed` — et **EPIC-008 `bilan-service`** (`:3004`, **squelette** d'intégration : read-models + gate rejoué + `ReferentielLoader` pluggable ; le **moteur comptable réel = EPIC-009**, en attente du **PRD/tech-spec Bilan** dédié, décision B8). Séquence complète : **auth → EC relying party → kyc rebasé → FedaPay (fin MVP vertical) → catalog → bilan → verticaux futurs**. **Intégration clé (C5) :** le paiement d'un vertical **déclenche** l'octroi d'entitlement sur catalog (service-à-service, **décision C8**) → **STORY-039** (côté appelant `expert-comptable`) ajoutée. Sources de vérité : `docs/architecture-catalog-service-2026-07-07.md`, `docs/architecture-bilan-service-2026-07-07.md`, `docs/architecture-prospera-ecosystem-2026-07-04.md` (P7-P10). Total 159 → **196 pts**, 7 → **9 sprints**.

**Métriques clés :**
- Total stories : 39 | Total points : 196 (56 livrés : sprints 1-2 ; 24 livrés : sprint 3 auth-service)
- Sprints : 9 (18 semaines) | Capacité : ~34 pts/sprint (charge prudente ~16-24 sur les sprints d'extraction / capacités partagées)
- Couverture : 12/12 FR, 6/6 NFR (FR-001→004 portés par auth-service) ; EPIC-007/008 = capacités plateforme **au-delà** des FR d'origine (entitlements P8, squelette Bilan ; fonctionnel Bilan → EPIC-009 / PRD Bilan à venir)
- Fin cible : **2026-11-05** (fin du Sprint 9)

---

## Inventaire des stories

> Chaque story référence son code d'architecture (Sx.y) et les FR/NFR couverts. Les notes techniques renvoient aux composants du document d'architecture.

### EPIC-000 — Fondations techniques

---

#### STORY-001 : Scaffolding NestJS + configuration + Swagger + health
**Epic :** EPIC-000 · **Réf. archi :** S0.1 · **Priorité :** Must Have · **Points :** 5

**User story :** En tant que développeur, je veux un squelette NestJS configuré (config typée, validation du .env, versioning, Swagger, health check) afin de démarrer chaque module sur une base saine et documentée.

**Critères d'acceptation :**
- [ ] Projet NestJS 11 / Node 20, TypeScript strict, ESLint + Prettier
- [ ] `@nestjs/config` avec schéma de validation du `.env` : l'app refuse de démarrer si une variable obligatoire manque (NFR-001)
- [ ] Préfixe global `/api/v1` + versioning URI
- [ ] `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`)
- [ ] Swagger exposé sur `/api/docs`
- [ ] `GET /api/v1/health` (Terminus) répond 200

**Notes techniques :** `main.ts` (helmet, pipes, swagger, versioning) ; modules `config/`, `health/`. Base des NFR-001/005/006.
**Dépendances :** — (première story)

---

#### STORY-002 : Infrastructure locale (docker-compose) + connexions Mongoose & Bull
**Epic :** EPIC-000 · **Réf. archi :** S0.2 · **Priorité :** Must Have · **Points :** 3

**User story :** En tant que développeur, je veux démarrer tout le projet via Docker (`docker compose up`) — l'app NestJS **et** MongoDB, Redis, MinIO, Mailhog — afin d'avoir un environnement complet et reproductible en une commande, sans installer Node localement.

**Critères d'acceptation :**
- [ ] `Dockerfile` multi-stage (build → runtime Node 20 slim) pour l'app ; `.dockerignore`
- [ ] `docker-compose.yml` : **service `app` (NestJS)** + MongoDB en replica set single-node (transactions dispo) + Redis + MinIO + Mailhog
- [ ] `docker-compose.override.yml` (dev) : source montée en volume pour hot-reload, ports exposés
- [ ] `docker compose up` suffit à lancer un service opérationnel (`/health` vert), sans `npm run` hors conteneur
- [ ] `MongooseModule.forRootAsync` connecté (vérifié par le health check) ; `BullModule` connecté à Redis (une file de test traite un job)
- [ ] Bucket MinIO créé au démarrage ; `.env.example` aligné sur le schéma de config (STORY-001) et le docx d'environnement
- [ ] README de démarrage documentant la commande unique Docker

**Notes techniques :** démarrage **exclusivement via Docker** (l'app est un service du compose). Cf. décisions D4 (replica set en dev) et D6 (MinIO).
**Dépendances :** STORY-001

---

#### STORY-003 : Socle transverse (logging, exceptions, TenantContext) + CI
**Epic :** EPIC-000 · **Réf. archi :** S0.3 · **Priorité :** Must Have · **Points :** 5

**User story :** En tant que développeur, je veux un socle transverse (logs structurés, filtre d'exceptions uniforme, contexte de tenant request-scoped) et une CI, afin que tous les modules partagent les mêmes conventions et soient testés automatiquement.

**Critères d'acceptation :**
- [ ] Logging pino structuré (JSON) avec `requestId` + `tenantId` par requête (NFR-005)
- [ ] Filtre d'exceptions global : format d'erreur uniforme `{ statusCode, error, message, requestId }`
- [ ] `CommonModule` : `TenantContext` request-scoped, décorateurs `@Public`, `@CurrentUser` (squelette)
- [ ] Intercepteur de logging des requêtes
- [ ] CI GitHub Actions : lint → tests unitaires → build image Docker ; seuil de couverture configuré (NFR-006)

**Notes techniques :** `common/` (guards à venir, décorateurs, filtres, interceptors, database/). La CI monte Mongo/Redis en services conteneurisés.
**Dépendances :** STORY-001

---

### EPIC-001 — Comptes & authentification

---

#### STORY-004 : Inscription tenant + super-admin de compte
**Epic :** EPIC-001 · **Réf. archi :** S1.1 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-001

**User story :** En tant que gérant de cabinet, je veux créer le compte de mon cabinet et en devenir l'administrateur, afin de démarrer sur la plateforme.

**Critères d'acceptation :**
- [ ] `POST /auth/register` crée Tenant + User `TENANT_ADMIN` de façon atomique (aucun orphelin en cas d'échec partiel — transaction Mongo)
- [ ] E-mail unique globalement ; doublon → erreur sans divulgation
- [ ] Mot de passe ≥ 8 caractères validé côté serveur, hashé bcrypt (cost 12)
- [ ] Tenant créé en `kycStatus = PENDING_DOCUMENTS`, sans abonnement
- [ ] Déclenche l'envoi de l'e-mail de vérification (dépend de STORY-006 pour l'envoi effectif ; ici : point d'accroche + job mis en file)

**Notes techniques :** schémas `Tenant` + `User`, `slug` unique dérivé du nom. AuthModule, TenantsModule, UsersModule.
**Dépendances :** STORY-003

---

#### STORY-005 : Authentification — login / refresh rotatif / logout + guards
**Epic :** EPIC-001 · **Réf. archi :** S1.2 · **Priorité :** Must Have · **Points :** 8 · **Couvre :** FR-003

**User story :** En tant qu'utilisateur, je veux me connecter et rester authentifié de façon sécurisée, afin d'accéder à mon espace sans me reconnecter en permanence.

**Critères d'acceptation :**
- [ ] `POST /auth/login` → `{ accessToken (15 min), refreshToken (7 j) }` ; identifiants invalides → 401 générique
- [ ] `POST /auth/refresh` fait tourner le refresh token ; réutilisation d'un token consommé → invalidation de la session (détection de réutilisation)
- [ ] `POST /auth/logout` révoque le refresh token
- [ ] `JwtAuthGuard` global (routes `@Public()` exemptées) + `RolesGuard` (`@Roles`)
- [ ] Rate limit login 5/min/IP (NFR-001) ; user/tenant `SUSPENDED` → connexion refusée
- [ ] Payload JWT `{ sub, tenantId, role, emailVerified }` ; refresh hashé en base

**Notes techniques :** passport-jwt, `@nestjs/throttler`. Chaîne de guards (ordre : Jwt → EmailVerified → Roles → TenantState) posée ici pour Jwt + Roles.
**Dépendances :** STORY-004

---

#### STORY-006 : Vérification de l'adresse e-mail
**Epic :** EPIC-001 · **Réf. archi :** S1.3 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-002

**User story :** En tant qu'utilisateur inscrit, je veux valider mon adresse e-mail via un lien, afin de prouver que je contrôle cette adresse et d'accéder à la plateforme.

**Critères d'acceptation :**
- [ ] Token aléatoire à usage unique, TTL 24 h, stocké hashé (sha256) en base
- [ ] `GET /auth/verify-email?token=` renseigne `emailVerifiedAt` et invalide le token
- [ ] Token expiré/consommé → erreur claire + possibilité de renvoi
- [ ] `POST /auth/resend-verification` limité à 3/h par utilisateur
- [ ] `EmailVerifiedGuard` global bloque les endpoints authentifiés tant que l'e-mail n'est pas vérifié (`@AllowUnverified()` pour resend/logout)
- [ ] Envoi via `MailModule` (worker Bull, retry ×5) ; e-mail visible dans Mailhog

**Notes techniques :** `MailModule` (producteur/consommateur Bull `mail`, templates Handlebars). Complète l'accroche de STORY-004.
**Dépendances :** STORY-004, STORY-005

---

#### STORY-007 : Seed du super-admin plateforme + squelette AdminModule
**Epic :** EPIC-001 · **Réf. archi :** S1.4 · **Priorité :** Must Have · **Points :** 2 · **Couvre :** FR-012 (amorce)

**User story :** En tant qu'opérateur de la plateforme, je veux qu'un compte super-admin global existe (créé par script, hors API publique), afin de pouvoir administrer les tenants.

**Critères d'acceptation :**
- [ ] Script de seed créant un `User` `PLATFORM_ADMIN` (`tenantId: null`) à partir de variables d'environnement
- [ ] Impossible de créer un `PLATFORM_ADMIN` via une route publique
- [ ] `AdminModule` amorcé + `RolesGuard` vérifie l'accès `PLATFORM_ADMIN` (403 sinon)
- [ ] Le PLATFORM_ADMIN peut se connecter et atteindre un endpoint admin protégé de test

**Notes techniques :** `seeds/`. Débloque STORY-013 (revue KYC) et STORY-019 (dashboard).
**Dépendances :** STORY-004

---

### EPIC-002 — Utilisateurs du tenant

---

#### STORY-008 : Invitation d'utilisateur + acceptation
**Epic :** EPIC-002 · **Réf. archi :** S2.1 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-004

**User story :** En tant que super-admin de compte, je veux inviter des collaborateurs par e-mail, afin qu'ils rejoignent l'espace de mon cabinet.

**Critères d'acceptation :**
- [ ] `POST /users` crée un User `INVITED` et envoie un e-mail d'invitation (token usage unique, 72 h)
- [ ] `POST /auth/accept-invitation` : l'invité définit son mot de passe ; e-mail considéré vérifié à l'acceptation ; statut → `ACTIVE`
- [ ] Rôle attribuable à l'invitation (`TENANT_ADMIN` | `TENANT_USER`)
- [ ] Un `TENANT_USER` ne peut pas inviter (403)

**Notes techniques :** réutilise `MailModule`. UsersModule.
**Dépendances :** STORY-006

---

#### STORY-009 : CRUD utilisateurs — rôles, suspension, garde-fous
**Epic :** EPIC-002 · **Réf. archi :** S2.2 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-004

**User story :** En tant que super-admin de compte, je veux gérer mes utilisateurs (lister, modifier le rôle, suspendre, supprimer), afin de contrôler les accès de mon cabinet.

**Critères d'acceptation :**
- [ ] `GET /users` liste paginée des utilisateurs **du tenant uniquement**
- [ ] `PATCH /users/:id` : changement de rôle, suspension/réactivation
- [ ] `DELETE /users/:id` : suppression (soft delete)
- [ ] Impossible de supprimer/rétrograder le **dernier** `TENANT_ADMIN` actif
- [ ] Endpoints réservés à `TENANT_ADMIN` (403 pour `TENANT_USER`)

**Notes techniques :** UsersModule. S'appuie sur le TenantScopedRepository (STORY-010).
**Dépendances :** STORY-008, STORY-010

---

#### STORY-010 : Isolation multi-tenant (TenantScopedRepository) + tests
**Epic :** EPIC-002 · **Réf. archi :** S2.3 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** NFR-002

**User story :** En tant que responsable de la plateforme, je veux que les données d'un cabinet soient inaccessibles aux autres cabinets, afin de garantir la confidentialité contractuelle du SaaS.

**Critères d'acceptation :**
- [ ] `TenantScopedRepository` de base injecte `{ tenantId }` depuis le `TenantContext` dans chaque requête
- [ ] Un client ne peut jamais fournir `tenantId` via un DTO (ignoré / rejeté)
- [ ] Suite de tests e2e d'isolation : user tenant A → ressource tenant B → 404 (jamais 403 révélateur)
- [ ] La suite d'isolation est **bloquante en CI**

**Notes techniques :** `common/database/tenant-scoped.repository.ts`. Story infrastructurelle : tirée tôt car les modules KYC/Billing en dépendent.
**Dépendances :** STORY-003, STORY-004

---

### EPIC-003 — KYC

> **Révision 2026-07-03 — Extraction en micro-service `kyc-service`.** STORY-011 et STORY-012 ont été livrées **dans `expert-comptable`** (module interne). L'EPIC-003 est désormais extrait dans un micro-service autonome `kyc-service` (réutilisable par les futurs services PROSPERA). Le re-découpage ajoute **STORY-020** (scaffold + migration du code livré) et **STORY-021** (événements + read-model + e-mails), re-scope **STORY-013** (revue admin déplacée dans kyc-service) et laisse **STORY-014** quasi inchangée (guard côté expert-comptable lisant le read-model). Ces 4 stories forment le **Sprint 3 « Extraction kyc-service »** ; l'EPIC-004 (FedaPay) glisse en Sprint 4. Détail : `docs/architecture-kyc-service-2026-07-03.md`. EPIC-003 passe de 18 à **31 points** (les 8 pts de S011+S012 restent acquis ; +13 pts = coût de l'extraction).
>
> **Révision 2026-07-04 — Re-cadrage écosystème (re-planifié).** Le kyc (EPIC-003 restant) est désormais **rebasé** et **ré-ordonné après l'auth** : il est *relying party* d'`auth-service` (validation **RS256/JWKS**) et publie sur le **topic Kafka `kyc.status.changed`** (remplace l'ancienne « file BullMQ `kyc-events` » ; BullMQ ne sert plus qu'aux e-mails internes). Allocation : **STORY-020 en Sprint 5**, **STORY-021/013/014 en Sprint 6** (voir § Allocation). Les cartes ci-dessous sont à lire avec cette bascule de transport (topic Kafka) et de dépendance (auth-service via JWKS). Source de vérité : `docs/architecture-prospera-ecosystem-2026-07-04.md`.

---

#### STORY-011 : Stockage S3/MinIO + upload RCCM/CFE validé
**Epic :** EPIC-003 · **Réf. archi :** S3.1 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-005

**User story :** En tant que super-admin de compte, je veux téléverser notre RCCM et notre carte CFE, afin de fournir les justificatifs de validation du cabinet.

**Critères d'acceptation :**
- [ ] `StorageService` abstrait (S3-compatible), implémentation MinIO en dev, bucket privé
- [ ] `POST /kyc/documents` (multipart) : `type ∈ {RCCM, CFE}`, ≤ 10 Mo, MIME vérifié par magic bytes (pas l'extension)
- [ ] Nom de fichier régénéré (UUID) ; jamais le nom client dans la clé de stockage
- [ ] Fichier > 10 Mo ou format non supporté → 422 explicite
- [ ] Métadonnées `KycDocument` persistées (type, storageKey, mime, taille, version)

**Notes techniques :** KycModule, schéma `KycDocument`. Chiffrement côté serveur (SSE) en prod.
**Dépendances :** STORY-010

---

#### STORY-012 : Statut KYC + machine à états + notifications
**Epic :** EPIC-003 · **Réf. archi :** S3.2 · **Priorité :** Must Have · **Points :** 3 · **Couvre :** FR-005

**User story :** En tant que super-admin de compte, je veux suivre l'état de validation de mon cabinet, afin de savoir ce qu'il me reste à faire.

**Critères d'acceptation :**
- [ ] `GET /kyc/status` : statut KYC + documents + motifs éventuels
- [ ] Passage automatique en `UNDER_REVIEW` quand RCCM **et** CFE sont présents
- [ ] Transitions `kycStatus` contrôlées : PENDING_DOCUMENTS → UNDER_REVIEW → APPROVED | REJECTED
- [ ] E-mail de confirmation de soumission au cabinet

**Notes techniques :** machine à états sur `Tenant.kycStatus`. Réutilise MailModule.
**Dépendances :** STORY-011

---

#### STORY-013 : Revue KYC par le super-admin global *(re-scopée dans kyc-service — 2026-07-03)*
**Epic :** EPIC-003 · **Réf. archi :** S3.3 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-006 · **Service :** kyc-service

**User story :** En tant que super-admin global, je veux examiner les justificatifs et approuver ou rejeter avec motif, afin de n'admettre que des cabinets légitimes.

**Critères d'acceptation :**
- [ ] `GET /admin/kyc/pending` (sur **kyc-service `:3001`**) : file des cabinets `UNDER_REVIEW`, plus anciens d'abord (tri `submittedAt` asc)
- [ ] Consultation des documents via URL présignée ≤ 5 min (`StorageService.getPresignedUrl`)
- [ ] `approve` → transition `UNDER_REVIEW → APPROVED` du `TenantKycProfile` + réviseur + date, **publie** `kyc.status.changed`
- [ ] `reject` exige un motif → `UNDER_REVIEW → REJECTED`, **publie** l'événement (motif inclus)
- [ ] E-mail au cabinet à l'approbation comme au rejet : déclenché côté **expert-comptable** par le consommateur d'événements (pipeline STORY-021), pas par kyc-service
- [ ] Endpoints réservés `PLATFORM_ADMIN` (JWT `tenantId: null` validé nativement par kyc-service)

**Notes techniques :** `AdminKycController` dans kyc-service ; lecture cross-tenant des documents via `forTenant(tenantId)` ; URLs présignées via `StorageService`. Aucun code d'e-mail ici (délégué aux événements).
**Dépendances :** STORY-007 (seed admin), STORY-020, STORY-021

---

#### STORY-014 : TenantStateGuard + matrice d'accès + re-soumission *(réparti sur les 2 services — 2026-07-03)*
**Epic :** EPIC-003 · **Réf. archi :** S3.4 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-007 · **Service :** expert-comptable (guard) + kyc-service (re-soumission)

**User story :** En tant que responsable plateforme, je veux que l'accès aux fonctionnalités dépende de l'état du tenant (e-mail / KYC / abonnement), afin de protéger les modules métier et guider l'activation.

**Critères d'acceptation :**
- [ ] `TenantStateGuard` global (**expert-comptable**) + décorateur `@RequiresTenantState(...)` appliquant la matrice d'accès du PRD, lisant le **read-model local** `tenant.kycStatus`
- [ ] KYC non approuvé → checkout refusé (403 `KYC_NOT_APPROVED`) ; sans abonnement actif → modules métier refusés (403 `SUBSCRIPTION_REQUIRED`)
- [ ] Re-soumission après rejet (**kyc-service**) : `REJECTED → UNDER_REVIEW`, nouvelle version du document (ancienne `SUPERSEDED`), purge du motif, **publie** l'événement (le read-model repasse en `UNDER_REVIEW`, e-mail de soumission renvoyé)
- [ ] `GET /tenant` (expert-comptable) expose l'état effectif (e-mail, KYC read-model, abonnement)
- [ ] Tenant suspendu → tout accès refusé

**Notes techniques :** 4ᵉ maillon de la chaîne de guards (expert-comptable). État KYC lu dans le read-model local (jamais dans le JWT, jamais par appel réseau synchrone). ⚠️ Cohérence éventuelle : latence événementielle upload → read-model de quelques secondes, acceptable.
**Dépendances :** STORY-020, STORY-021, STORY-013

---

#### STORY-020 : Scaffold `kyc-service` + compose racine + migration upload/statut *(nouvelle — 2026-07-03)*
**Epic :** EPIC-003 · **Réf. archi :** kyc-service §1–4 · **Priorité :** Must Have · **Points :** 8 · **Couvre :** FR-005 (re-livraison S3.1+S3.2) · **Service :** kyc-service (+ retraits expert-comptable)

**User story :** En tant qu'équipe plateforme, je veux que la capacité KYC vive dans un micro-service autonome démarrable via le compose racine, afin qu'elle soit réutilisable par les futurs services PROSPERA sans dépendre du code d'`expert-comptable`.

**Critères d'acceptation :**
- [ ] Nouveau projet `kyc-service/` (NestJS 11 / Node 20, conventions calquées sur expert-comptable : Dockerfile multi-stage, Swagger « PROSPERA — KYC Service », seuils Jest 65/90/90/90, ESLint 0 warning)
- [ ] Socle transverse dupliqué (`common/` : `TenantContext`, `TenantScopedRepository`, guards Jwt/EmailVerified/Roles, décorateurs, `file-signature.util`, `Role` enum, `AccessTokenPayload`) + `jwt.strategy` validate-only (secret `JWT_ACCESS_SECRET` partagé, aucun endpoint d'auth)
- [ ] `StorageModule` (MinIO) **déplacé** depuis expert-comptable ; base Mongo dédiée `kyc_service`
- [ ] Module KYC déplacé (upload RCCM/CFE magic-bytes, supersede, `GET /kyc/status`) et **adapté** : nouvelle collection `TenantKycProfile` (création lazy par upsert, index unique `tenantId`) remplaçant `Tenant.kycStatus` comme source de vérité ; la machine à états (`assertTransition`) pilote le profil local
- [ ] `docker-compose.yml` **racine** (`PROSPERA/`) orchestrant `expert-comptable` (`:3000`), `kyc-service` (`:3001`) + mongo/redis/minio/mailhog partagés (+ override hot-reload) ; suppression des composes internes à `expert-comptable/` ; `docker compose up` depuis la racine
- [ ] Retraits d'`expert-comptable` : `modules/kyc/`, `storage/`, `file-signature.util`, imports dans `app.module.ts`, `MinioConfig` ; e2e KYC déplacés dans `kyc-service/test/` (JWT signés directement en test). **Non touchés** : champs `kyc*` du schéma Tenant (deviennent read-model), enum `KycStatus`, template `kyc-submitted.hbs`, case KYC de `mail.processor` (utilisés en STORY-021)
- [ ] CI en matrice `service: [expert-comptable, kyc-service]` (lint → tests → build par service)
- [ ] Parité fonctionnelle vérifiée : upload RCCM+CFE sur `:3001` → `GET /kyc/status` = `UNDER_REVIEW` (comportement STORY-011/012 préservé au sein de kyc-service)

**Notes techniques :** ⚠️ le changement de projet compose (racine) recrée des volumes vides → perte des données de dev locales (acceptable). ⚠️ Sans STORY-021, le read-model d'expert-comptable est figé et l'e-mail de soumission muet (régression temporaire) → STORY-021 livrée immédiatement derrière.
**Dépendances :** STORY-011, STORY-012 (code source migré)

---

#### STORY-021 : Événements `kyc-events` + read-model + e-mails *(nouvelle — 2026-07-03)*
**Epic :** EPIC-003 · **Réf. archi :** kyc-service §5 (contrat d'événements) · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-005/FR-006 (notifications) · **Service :** les deux

**User story :** En tant qu'`expert-comptable`, je veux être notifié des changements de statut KYC de mes cabinets, afin de tenir à jour mon état d'accès et d'envoyer les e-mails, sans interroger kyc-service à chaque requête.

**Critères d'acceptation :**
- [ ] **kyc-service** : `KycEventsPublisher` unique publie `kyc.status.changed` (contrat v1 : `eventId`, `tenantId`, `previousStatus`, `status` absolu, `rejectionReason?`, `reviewedBy?`, `actorUserId?`, `occurredAt`) sur la file `kyc-events`, **après** persistance de la transition ; échec de publication journalisé (rattrapé à la transition suivante), non bloquant
- [ ] **expert-comptable** : `KycEventsProcessor` consomme `kyc-events` et applique le **read-model** (`$set` absolu de `kycStatus`/`kycReviewedAt`/`kycReviewedBy`, `$unset kycRejectionReason` si absent) ; idempotent (marqueur `ProcessedKycEvent`, `eventId` unique, TTL 30 j)
- [ ] E-mails déclenchés par le consommateur, jobId déterministe `${eventId}:${jobName}` : `UNDER_REVIEW` → soumission (template existant) ; `APPROVED` → nouveau template vers les `TENANT_ADMIN` du cabinet ; `REJECTED` → nouveau template avec motif
- [ ] Rejouer le même événement 2× ne produit ni double écriture du read-model ni double e-mail (**test automatisé exigé**)
- [ ] Isolation : l'événement d'un cabinet n'affecte que son read-model

**Notes techniques :** réutilise le patron producteur/consommateur BullMQ (anti-cycle) déjà éprouvé (STORY-008/012). `TenantsService.updateKycStatus` étendu en `applyKycStatusChange`. Résolution des destinataires via `forTenant(tenantId)`. Caveat work-queue (fan-out futur) encapsulé dans le publisher.
**Dépendances :** STORY-020

---

### EPIC-004 — Abonnement & paiement FedaPay

---

#### STORY-015 : Catalogue de plans
**Epic :** EPIC-004 · **Réf. archi :** S4.1 · **Priorité :** Must Have · **Points :** 2 · **Couvre :** FR-008

**User story :** En tant que super-admin de compte, je veux consulter les plans d'abonnement disponibles, afin de choisir celui qui convient à mon cabinet.

**Critères d'acceptation :**
- [ ] Schéma `Plan` + script de seed (plans modifiables sans redéploiement)
- [ ] `GET /billing/plans` renvoie les plans actifs (code, nom, montant XOF, périodicité, limites)
- [ ] Un plan désactivé n'apparaît plus et n'est plus souscriptible, sans impact sur les abonnements en cours

**Notes techniques :** BillingModule. Montants à fixer avant prod (question ouverte PRD).
**Dépendances :** STORY-003

---

#### STORY-016 : Checkout FedaPay
**Epic :** EPIC-004 · **Réf. archi :** S4.2 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-009

**User story :** En tant que super-admin de compte validé (KYC approuvé), je veux payer mon abonnement par Mobile Money ou carte, afin d'activer l'accès aux modules métier.

**Critères d'acceptation :**
- [ ] `POST /billing/checkout` crée une transaction FedaPay et renvoie l'URL de paiement
- [ ] Souscription `PENDING_PAYMENT` créée localement (liée plan + tenant)
- [ ] Bascule sandbox/live uniquement par `FEDAPAY_ENVIRONMENT`
- [ ] Abonnement déjà actif pour la période → 409
- [ ] Abstraction `PaymentProvider` (FedaPay = implémentation) pour permettre d'autres providers plus tard

**Notes techniques :** SDK `fedapay`. Réservé aux tenants KYC approuvé (TenantStateGuard).
**Dépendances :** STORY-014, STORY-015

---

#### STORY-017 : Webhook FedaPay — signature, idempotence, activation
**Epic :** EPIC-004 · **Réf. archi :** S4.3 · **Priorité :** Must Have · **Points :** 8 · **Couvre :** FR-010

**User story :** En tant que responsable plateforme, je veux que les confirmations de paiement soient traitées de façon fiable et exactement une fois, afin de ne jamais perdre ni doubler une activation d'abonnement.

**Critères d'acceptation :**
- [ ] `POST /webhooks/fedapay` (public, hors JWT/préfixe tenant) vérifie la signature HMAC (temps constant) ; signature invalide → 401
- [ ] Événement journalisé (`WebhookEvent`, `eventKey` unique) ; doublon → ignoré sans effet de bord
- [ ] Réponse 200 immédiate après journalisation ; traitement en file Bull (retry ×5, backoff, dead-letter tracée)
- [ ] Le worker **re-lit la transaction via l'API FedaPay** avant activation (source de vérité)
- [ ] Activation idempotente : index unique `fedapayTransactionId` + transition conditionnelle → une seule activation même sur webhooks rejoués/concurrents (**test automatisé exigé**)
- [ ] Paiement approuvé → souscription `ACTIVE`, période calculée selon le plan ; transaction enregistrée

**Notes techniques :** cœur du NFR-003 (défense en profondeur, décision D5). Point le plus risqué du projet.
**Dépendances :** STORY-016

---

#### STORY-018 : Historique des transactions + cycle de vie de l'abonnement
**Epic :** EPIC-004 · **Réf. archi :** S4.4 · **Priorité :** Should Have · **Points :** 3 · **Couvre :** FR-011

**User story :** En tant que super-admin de compte, je veux consulter mon abonnement et mes transactions, et être prévenu avant échéance, afin de gérer mon renouvellement.

**Critères d'acceptation :**
- [ ] `GET /billing/subscription` (plan, statut, période) et `GET /billing/transactions` (historique paginé)
- [ ] Job quotidien passant les abonnements échus à `EXPIRED` (coupe l'accès métier via FR-007)
- [ ] E-mails de relance J-7 et J-1 avant échéance

**Notes techniques :** job planifié. BillingModule.
**Dépendances :** STORY-017

---

#### STORY-019 : Dashboard super-admin global + tests e2e du parcours complet
**Epic :** EPIC-004 · **Réf. archi :** S4.5 · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-012

**User story :** En tant que super-admin global, je veux une vue d'ensemble des tenants et de leurs statuts, afin de piloter la plateforme et suspendre les comptes problématiques.

**Critères d'acceptation :**
- [ ] `GET /admin/tenants` : liste paginée, filtres (kycStatus, statut abonnement), recherche par nom
- [ ] `GET /admin/tenants/:id` : détail (profil, utilisateurs, documents KYC, abonnement, transactions)
- [ ] `POST /admin/tenants/:id/suspend` coupe l'accès (réversible)
- [ ] Test e2e du parcours complet : inscription → vérification e-mail → KYC → paiement → accès métier (NFR-006)

**Notes techniques :** AdminModule (volet abonnement + agrégation). Le volet identité (liste/détail/suspension d'organisations) est servi par **auth-service** (EPIC-005) ; le dashboard agrégé croise identité (auth-service) + KYC (kyc-service) + abonnement (local). Le test e2e valide l'intégration de tout l'écosystème.
**Dépendances :** STORY-013, STORY-017, STORY-027 (admin identité)

---

### EPIC-005 — Extraction `auth-service` (fournisseur d'identité / IdP) *(nouveau — 2026-07-04)*

> Extraction **racine** : re-héberger l'identité (Users, Organisations, Memberships, credentials, vérif e-mail, invitations, rôles) dans un micro-service dédié `auth-service` (`:3001`), émetteur des JWT en **RS256/JWKS**, producteur des événements `identity.*` (Kafka). Consommé par tous les verticaux. Détail : `docs/architecture-auth-service-2026-07-04.md`. **39 pts.** L'essentiel est du code déjà livré (EPIC-001 + users d'EPIC-002) **re-hébergé**, pas réécrit ; le neuf = RS256/JWKS, `Membership`, événements, Kafka.

---

#### STORY-022 : Scaffold `auth-service` + compose racine + Kafka (KRaft)
**Epic :** EPIC-005 · **Réf. archi :** auth-service §Migration · **Priorité :** Must Have · **Points :** 8 · **Service :** auth-service

**User story :** En tant qu'équipe plateforme, je veux un micro-service `auth-service` démarrable via le compose racine, avec le bus Kafka, afin d'accueillir l'identité mutualisée de l'écosystème.

**Critères d'acceptation :**
- [ ] Nouveau projet `auth-service/` (NestJS 11 / Node 20, conventions calquées : Dockerfile, Swagger « PROSPERA — Auth Service », seuils Jest 65/90/90/90, ESLint 0 warning), base Mongo dédiée `auth_service`
- [ ] Socle transverse dupliqué (`common/` : TenantContext, TenantScopedRepository, guards, décorateurs, filtres) + `PasswordService`
- [ ] **`docker-compose.yml` racine** (`PROSPERA/`) orchestrant `expert-comptable` (`:3000`), `auth-service` (`:3001`) + `mongo` (rs0), **`kafka` (KRaft mono-nœud)**, `redis`, `mailhog`, `minio` ; override hot-reload ; suppression des composes internes à `expert-comptable/`
- [ ] Client Kafka opérationnel (`kafkajs` ou transport `@nestjs/microservices`) : un topic de test produit/consommé au démarrage
- [ ] CI en matrice `service: [expert-comptable, auth-service]`

**Notes techniques :** ⚠️ nouveau projet compose racine → volumes recréés (perte des données dev, acceptable). Redis conservé pour la file mail interne + cache JWKS.
**Dépendances :** — (démarre l'extraction)

---

#### STORY-023 : Modèle d'identité — Organizations + Users + Memberships + register atomique
**Epic :** EPIC-005 · **Réf. archi :** auth-service §Données · **Priorité :** Must Have · **Points :** 8 · **Couvre :** FR-001 · **Service :** auth-service

**User story :** En tant que gérant de cabinet, je veux créer mon organisation et mon compte administrateur sur l'IdP, afin de disposer d'une identité utilisable par tous les produits PROSPERA.

**Critères d'acceptation :**
- [ ] Schémas `Organization` (ex-`Tenant` : name/slug/country/status), `User` (allégé, sans tenantId/role), **`Membership`** (user↔org↔rôle↔statut, index unique `{userId, organizationId}`)
- [ ] `POST /auth/register` crée `Organization` + `User` `TENANT_ADMIN` + `Membership` **atomiquement** (transaction) ; e-mail unique global ; anti-énumération
- [ ] Garde-fou « dernier `TENANT_ADMIN` actif » exprimé au niveau membership
- [ ] Migration de re-hébergement depuis `expert-comptable` (schémas Tenant/User, slug unique) ; **dev repart de zéro** (script de migration de données = souci de prod différé, documenté)

**Notes techniques :** normalisation `User.tenantId+role` → `Membership`. Phase 1 : un membership actif par user.
**Dépendances :** STORY-022

---

#### STORY-024 : Auth RS256 + JWKS + login/refresh/logout
**Epic :** EPIC-005 · **Réf. archi :** auth-service §Jetons · **Priorité :** Must Have · **Points :** 8 · **Couvre :** FR-003 · **Service :** auth-service

**User story :** En tant qu'utilisateur, je veux m'authentifier et obtenir des jetons vérifiables par tous les services, afin d'accéder à l'écosystème sans secret partagé.

**Critères d'acceptation :**
- [ ] Schéma `SigningKey` (kid, clé publique/privée, statut) + amorçage d'une clé au boot (PEM d'env en dev) + rotation par `kid`
- [ ] `TokenService` émet l'access token en **RS256** (claims `iss, aud, sub, org, roles[], emailVerified`) ; refresh rotatif + hash + détection de réutilisation (repris de l'existant)
- [ ] `GET /.well-known/jwks.json` publie les clés `ACTIVE`/`RETIRING`
- [ ] `POST /auth/login | /auth/refresh | /auth/logout` ; `JwtStrategy` RS256 locale ; login 5/min ; user/org suspendu → refus
- [ ] Anti-énumération (401 générique)

**Notes techniques :** cœur du modèle de jetons (architecture programme §Modèle de jetons). Réutilise `AuthService`/`TokenService` migrés, passage HS256 → RS256.
**Dépendances :** STORY-023

---

#### STORY-025 : Vérification e-mail + invitations + file mail interne
**Epic :** EPIC-005 · **Réf. archi :** auth-service §Périmètre · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-002, FR-004 (invitations) · **Service :** auth-service

**User story :** En tant qu'utilisateur, je veux vérifier mon e-mail et pouvoir être invité, afin d'activer et de rejoindre une organisation.

**Critères d'acceptation :**
- [ ] Vérification e-mail (token usage unique TTL 24 h, hash), `GET /auth/verify-email`, `POST /auth/resend-verification` (3/h/utilisateur)
- [ ] Invitations : `POST /users` (invite), `POST /auth/accept-invitation` (définit le mot de passe, crée le membership, ouvre session)
- [ ] File **interne** BullMQ/Redis `MAIL_QUEUE` + templates d'identité (vérification, invitation) ; e-mails visibles dans Mailhog
- [ ] `EmailVerifiedGuard` (claim `emailVerified`)

**Notes techniques :** re-héberge STORY-006 + STORY-008. Les e-mails **d'identité** vivent dans auth-service ; e-mails **métier** restent dans chaque vertical.
**Dépendances :** STORY-024

---

#### STORY-026 : Gestion utilisateurs + rôles + memberships + seed PLATFORM_ADMIN
**Epic :** EPIC-005 · **Réf. archi :** auth-service §API · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-004 · **Service :** auth-service

**User story :** En tant que super-admin de compte, je veux gérer les membres de mon organisation et leurs rôles ; en tant qu'opérateur, je veux un PLATFORM_ADMIN seedé.

**Critères d'acceptation :**
- [ ] `GET/POST/PATCH/DELETE /users`, `POST /users/:id/resend-invitation`, `GET /users/me`, `GET/PATCH /organizations/me` (org-scopés au membership, `[TENANT_ADMIN]`)
- [ ] Garde-fou : impossible de supprimer/rétrograder le dernier `TENANT_ADMIN` actif d'une organisation
- [ ] Seed `PLATFORM_ADMIN` (script, hors API publique) ; `RolesGuard` RBAC
- [ ] Anti-énumération, isolation par `orgId`

**Notes techniques :** re-héberge STORY-009 + le squelette admin (STORY-007). Rôles `PLATFORM_ADMIN`/`TENANT_ADMIN`/`TENANT_USER` conservés.
**Dépendances :** STORY-023, STORY-024

---

#### STORY-027 : Événements `identity.*` (producteur Kafka + outbox) + admin organisations
**Epic :** EPIC-005 · **Réf. archi :** auth-service §Contrat `identity.*` · **Priorité :** Must Have · **Points :** 5 · **Couvre :** FR-012 (volet identité) · **Service :** auth-service

**User story :** En tant que service consommateur, je veux être notifié des changements d'identité, afin de tenir mes read-models à jour ; en tant qu'opérateur, je veux administrer les organisations.

**Critères d'acceptation :**
- [ ] Producteur Kafka des topics `identity.org.created/updated`, `identity.user.registered`, `identity.membership.changed`, `identity.user.suspended` (payloads du doc auth-service, état absolu, `eventId`, clé `orgId`)
- [ ] Publication **après** persistance via **transactional outbox** (collection `outbox` + relais) — ou publish-after-commit documenté comme démarrage
- [ ] `GET /admin/organizations`, `GET /admin/organizations/:id`, `POST /admin/organizations/:id/suspend` (`[PLATFORM_ADMIN]`) → émet `identity.org.updated`
- [ ] Test : rejouer un événement ne casse pas les consommateurs (idempotence contractuelle)

**Notes techniques :** premier producteur Kafka de l'écosystème. Le fan-out multi-consommateurs est natif (consumer groups).
**Dépendances :** STORY-023, STORY-024

---

### EPIC-006 — `expert-comptable` devient relying party *(nouveau — 2026-07-04)*

> Bascule `expert-comptable` du statut d'émetteur de jetons à celui de **relying party** de l'IdP : validation via JWKS, read-models d'identité alimentés par `identity.*` (Kafka), retrait des modules d'identité possédés, cutover. Détail : `docs/architecture-expert-comptable-2026-07-02.md` (rév. 1.2). **18 pts.**

---

#### STORY-028 : `expert-comptable` valide via JWKS (bascule HS256 → RS256)
**Epic :** EPIC-006 · **Priorité :** Must Have · **Points :** 5 · **Service :** expert-comptable

**User story :** En tant qu'`expert-comptable`, je veux valider les JWT émis par l'IdP via sa clé publique, afin de ne plus détenir de secret de signature.

**Critères d'acceptation :**
- [ ] `JwtStrategy` bascule HS256 (secret) → **RS256/JWKS** par configuration (cache JWKS, rafraîchissement / `kid` inconnu)
- [ ] Vérification `iss`/`aud` ; claims `org` (=`tenantId`), `roles[]`, `emailVerified` mappés vers `request.user`/`TenantContext`
- [ ] Chaîne de guards inchangée fonctionnellement ; suites e2e existantes vertes avec des JWT RS256 signés en test
- [ ] Bascule réversible (feature flag/config) le temps de la transition

**Notes techniques :** aucune émission de token ne subsiste côté expert-comptable après cutover (STORY-030).
**Dépendances :** STORY-024

---

#### STORY-029 : Read-models identité + consumer `identity.*` (Kafka) + provisioning
**Epic :** EPIC-006 · **Priorité :** Must Have · **Points :** 8 · **Service :** expert-comptable

**User story :** En tant qu'`expert-comptable`, je veux répliquer localement l'identité (organisation, utilisateurs, rôles) dont j'ai besoin, afin de fonctionner sans appeler l'IdP sur le chemin chaud.

**Critères d'acceptation :**
- [ ] Consumer group Kafka sur `identity.*` ; read-models locaux `Organization`/`User`/`Membership` (idempotents, marqueur d'événement traité)
- [ ] Provisioning : à `identity.org.created`, création du read-model d'org (+ profil métier vide) ; `identity.user.suspended`/`org.suspended` coupent l'accès
- [ ] Les écrans et résolutions (destinataires d'e-mails métier, dernier admin) lisent le **read-model local** (plus `UsersService`/`TenantsService` propriétaires)
- [ ] Isolation : un événement d'une org n'affecte que son read-model ; rejeu sans effet de bord (test)

**Notes techniques :** premier consumer Kafka de l'écosystème côté vertical. `tenant.kycStatus` (read-model KYC) coexiste avec les read-models d'identité.
**Dépendances :** STORY-027, STORY-028

---

#### STORY-030 : Retrait des modules d'identité + cutover + e2e cross-service
**Epic :** EPIC-006 · **Priorité :** Must Have · **Points :** 5 · **Service :** expert-comptable

**User story :** En tant qu'équipe, je veux qu'`expert-comptable` cesse de posséder l'identité, afin que l'IdP soit l'unique source de vérité.

**Critères d'acceptation :**
- [ ] Retrait (ou réduction au read-model) d'`AuthModule`/`UsersModule`/`TenantsModule` d'`expert-comptable` ; `register`/`login` ne sont plus servis ici (→ auth-service)
- [ ] Cutover : `expert-comptable` en mode relying party pur (validation JWKS, identité en read-model)
- [ ] **e2e cross-service** (docker racine) : `register`/`login` sur `auth-service` (`:3001`) → JWT RS256 → appel d'un endpoint d'`expert-comptable` (`:3000`) validé via JWKS → événement `identity.*` → read-model à jour
- [ ] Non-régression des suites e2e restantes d'expert-comptable

**Notes techniques :** fin de l'inversion de dépendance. `PasswordService` et logique d'auth vivent désormais dans auth-service uniquement.
**Dépendances :** STORY-029

---

### EPIC-007 — `catalog-service` (catalogue + entitlements) *(nouveau — 2026-07-07)*

> Capacité **plateforme** (P8) : **source de vérité des entitlements** (`org × module` → version + référentiel) et du **catalogue** (`Module`/`ModuleVersion`/`ReferentielVersion`). Relying party RS256/JWKS (`:3003`), producteur du topic Kafka **`entitlement.changed`**. **Séparation abonnement ≠ entitlement (C5)** : le paiement reste au vertical, le droit/version vit ici ; le paiement **déclenche** l'octroi (service-à-service, **C8**). Détail : `docs/architecture-catalog-service-2026-07-07.md`. **21 pts.**

---

#### STORY-031 : Scaffold `catalog-service` (base + relying party JWKS + health)
**Epic :** EPIC-007 · **Réf. archi :** catalog-service §Architecture · **Priorité :** Must Have · **Points :** 3 · **Service :** catalog-service

**User story :** En tant qu'équipe plateforme, je veux un `catalog-service` démarrable via le compose racine et validant les JWT via JWKS, afin d'accueillir le catalogue et les entitlements.

**Critères d'acceptation :**
- [ ] Nouveau projet `catalog-service/` (`:3003`, base Mongo dédiée `catalog_service`, conventions calquées : Dockerfile, Swagger « PROSPERA — Catalog Service », seuils Jest 65/90/90/90, ESLint 0 warning)
- [ ] Socle `common/` + `jwt.strategy` **validate-only** (RS256/JWKS, aucun endpoint d'auth) ; `orgId` opaque issu du claim
- [ ] Service ajouté au `docker-compose.yml` racine (+ override) ; `GET /api/v1/health`

**Notes techniques :** relying party pur (ne possède ni identité, ni KYC, ni paiement). **Dépendances :** STORY-024 (JWKS)

---

#### STORY-032 : Catalogue — Module / ModuleVersion / ReferentielVersion + admin CRUD + garde-fou N/N-1
**Epic :** EPIC-007 · **Réf. archi :** catalog-service §Catalogue (C3) · **Priorité :** Must Have · **Points :** 5 · **Service :** catalog-service

**User story :** En tant que `PLATFORM_ADMIN`, je veux administrer le catalogue des modules, de leurs versions de code et des versions de référentiel, afin de définir ce qui est offrable aux organisations.

**Critères d'acceptation :**
- [ ] Schémas `Module`, `ModuleVersion` (semver, statut `ACTIVE`/`RETIRED`), `ReferentielVersion` (`code`+`version`, **pointeur + checksum** de l'artefact, C3)
- [ ] CRUD admin réservé `[PLATFORM_ADMIN]` ; validation de cohérence (versions, référentiels)
- [ ] **Garde-fou N/N-1** : conserver au moins la version courante et la précédente actives (pas de retrait cassant les orgs entitled dessus)

**Notes techniques :** versioning à deux axes orthogonaux (code ⊥ référentiel, P7). **Dépendances :** STORY-031

---

#### STORY-033 : Entitlements — schéma (org × module) + grant/update/revoke + GET réconciliation
**Epic :** EPIC-007 · **Réf. archi :** catalog-service §Entitlements (P8) · **Priorité :** Must Have · **Points :** 5 · **Service :** catalog-service

**User story :** En tant que plateforme, je veux enregistrer quel droit (version + référentiel) chaque organisation possède sur chaque module, afin d'être la source de vérité des droits d'usage.

**Critères d'acceptation :**
- [ ] Schéma `Entitlement` (`orgId × moduleCode` → `versionCode`, `referentiel {code, version}`, `config`, `status`, `source`)
- [ ] `PUT /entitlements/:orgId/:moduleCode` (octroi/màj), `DELETE …` (révocation), `GET /entitlements/:orgId` (**snapshot de réconciliation**, hors chemin chaud)
- [ ] Écriture réservée `[PLATFORM_ADMIN]` **ou** identité de service (C8, câblée en STORY-034) ; lecture `:orgId` restreinte à l'org du JWT ou `PLATFORM_ADMIN`
- [ ] **Validation catalogue** : refuser l'octroi vers une `ModuleVersion`/`ReferentielVersion` inexistante ou `RETIRED`

**Notes techniques :** le JWT ne porte **jamais** l'entitlement (règle d'or) ; les consommateurs lisent des read-models alimentés par événement. **Dépendances :** STORY-032

---

#### STORY-034 : Événements `entitlement.changed` (Kafka + outbox) + auth service-à-service (C8)
**Epic :** EPIC-007 · **Réf. archi :** catalog-service §Contrat d'événements · **Priorité :** Must Have · **Points :** 5 · **Service :** catalog-service

**User story :** En tant que service consommateur (ex. `bilan-service`), je veux être notifié des changements d'entitlement, afin de tenir mon read-model à jour sans appeler catalog sur le chemin chaud.

**Critères d'acceptation :**
- [ ] Producteur `entitlement.changed` (état **absolu**, `eventId`, `schemaVersion`, clé `orgId`), **publish-after-persist** via **transactional outbox**
- [ ] **Auth service-à-service (C8) tranchée et câblée** : l'octroi par un vertical (billing) s'authentifie (jeton de service client-credentials émis par l'IdP *recommandé* ; mTLS/rôle technique en alternative)
- [ ] Idempotence contractuelle : rejouer un événement ne casse pas les consommateurs (**test exigé**)

**Notes techniques :** premier producteur Kafka **hors** identité/KYC. **Dépendances :** STORY-033 · **Décision préalable : C8** (auth service-à-service)

---

#### STORY-039 : `expert-comptable` — octroi d'entitlement catalog à l'activation d'abonnement (C8) *(intégration billing→catalog — 2026-07-07)*
**Epic :** EPIC-007 · **Réf. archi :** catalog-service §C5/C8 · expert-comptable §EPIC-004 (D10) · **Priorité :** Must Have · **Points :** 3 · **Service :** expert-comptable

**User story :** En tant qu'`expert-comptable`, à l'activation d'un abonnement payé, je veux octroyer l'entitlement correspondant sur `catalog-service`, afin que catalog soit la source de vérité du droit d'usage (séparation abonnement/entitlement, C5).

**Critères d'acceptation :**
- [ ] À l'activation d'un paiement (prolonge STORY-017), le billing appelle `catalog` `PUT /entitlements/:orgId/:moduleCode` en **service-à-service** (jeton de service, C8)
- [ ] **Idempotent** : rejouer/concurrencer l'activation n'octroie l'entitlement **qu'une fois** ; échec d'octroi **journalisé + retry** (n'invalide pas le paiement déjà encaissé)
- [ ] Révocation/expiration : l'expiration ou la suspension d'abonnement **révoque** (ou laisse expirer) l'entitlement — comportement documenté (cf. cascade C9)
- [ ] Le gate d'accès du vertical peut **basculer** sur l'entitlement (read-model) ou rester sur l'abonnement local en transition (feature flag) — pas de double source de vérité en cible

**Notes techniques :** matérialise **C5** côté **appelant** (le maillon manquant du re-cadrage P8). ⚠️ **C8 doit être tranchée avant.** **Dépendances :** STORY-017 (activation), STORY-034 (endpoint d'octroi + C8)

---

### EPIC-008 — `bilan-service` (squelette d'intégration) *(nouveau — 2026-07-07)*

> Capacité **partagée** (P7) : états financiers, **moteur pluggable par référentiel**. EPIC-008 livre le **squelette d'intégration** — extraction (`:3004`), read-models (`entitlement` + `KYC`), gate `@RequiresBilanAccess` **rejoué**, `ReferentielLoader` pluggable. Le **moteur de calcul comptable réel = EPIC-009**, en attente du **PRD/tech-spec Bilan** dédié (décision **B8**). Détail : `docs/architecture-bilan-service-2026-07-07.md`. **16 pts.**

---

#### STORY-035 : Scaffold `bilan-service` (base + relying party JWKS + health)
**Epic :** EPIC-008 · **Réf. archi :** bilan-service §Architecture · **Priorité :** Must Have · **Points :** 3 · **Service :** bilan-service

**User story :** En tant qu'équipe plateforme, je veux un `bilan-service` démarrable via le compose racine et relying party JWKS, afin d'accueillir le moteur d'états financiers.

**Critères d'acceptation :**
- [ ] Nouveau projet `bilan-service/` (`:3004`, base `bilan_service`, conventions calquées, Swagger « PROSPERA — Bilan Service », seuils/lint standard)
- [ ] Socle `common/` + `jwt.strategy` validate-only (RS256/JWKS) ; service dans le compose racine ; `GET /api/v1/health`

**Notes techniques :** relying party pur. **Dépendances :** STORY-024 (JWKS)

---

#### STORY-036 : Read-models + consumers Kafka (`entitlement.changed` + `kyc.status.changed`) + idempotence
**Epic :** EPIC-008 · **Réf. archi :** bilan-service §Read-models · **Priorité :** Must Have · **Points :** 5 · **Service :** bilan-service

**User story :** En tant que `bilan-service`, je veux répliquer localement l'entitlement et le statut KYC des organisations, afin de décider de l'accès sans appel réseau synchrone.

**Critères d'acceptation :**
- [ ] Consumers Kafka `entitlement.changed` (de catalog) **et** `kyc.status.changed` (de kyc-service) → read-models locaux
- [ ] **Idempotents** (marqueur `ProcessedEvent`, `eventId` unique) ; rejeu sans effet de bord (**test exigé**)
- [ ] Isolation : un événement d'une org n'affecte que son read-model

**Notes techniques :** consommateur multi-topics ; état absolu. **Dépendances :** STORY-034 (entitlement.changed), STORY-021 (kyc.status.changed), STORY-035

---

#### STORY-037 : Gate `@RequiresBilanAccess` (emailVerified + KYC + entitlement, read-models locaux)
**Epic :** EPIC-008 · **Réf. archi :** bilan-service §Gate (B) · **Priorité :** Must Have · **Points :** 3 · **Service :** bilan-service

**User story :** En tant que plateforme, je veux que l'accès au Bilan exige e-mail vérifié **+** KYC approuvé **+** entitlement actif, afin de ne servir que les organisations en règle.

**Critères d'acceptation :**
- [ ] Décorateur/guard `@RequiresBilanAccess` combinant `emailVerified` (claim JWT) + **read-model KYC** + **read-model entitlement** (locaux, jamais d'appel synchrone)
- [ ] Refus explicites et distincts (`EMAIL_NOT_VERIFIED` / `KYC_NOT_APPROVED` / `ENTITLEMENT_REQUIRED`) ; org suspendue → refus
- [ ] Tests unitaires de la matrice d'accès

**Notes techniques :** rejoue le patron `TenantStateGuard` (STORY-014) sur read-models locaux. **Dépendances :** STORY-036

---

#### STORY-038 : `ReferentielLoader` (artefact + checksum + cache) + interface de référentiel + moteur squelette
**Epic :** EPIC-008 · **Réf. archi :** bilan-service §ReferentielLoader (B) · **Priorité :** Must Have · **Points :** 5 · **Service :** bilan-service

**User story :** En tant que `bilan-service`, je veux charger le paquet de référentiel comptable (ex. `syscohada-revise@2.1`) désigné par l'entitlement, afin que le moteur soit paramétré par données versionnées (P7).

**Critères d'acceptation :**
- [ ] `ReferentielLoader` : télécharge l'artefact désigné (pointeur du read-model entitlement), **vérifie le checksum** (C3), met en cache ; échec de checksum → refus
- [ ] Interface `Referentiel` (contrat pluggable) + **moteur squelette** paramétré par le référentiel chargé (déploiement multi-version)
- [ ] **Hors périmètre EPIC-008** : le calcul comptable réel (formules, états) = **EPIC-009** (PRD Bilan à venir, B8)

**Notes techniques :** point d'extension du moteur ; pas de logique comptable ici. **Dépendances :** STORY-036

---

## Allocation en sprints

### Sprint 1 (semaines 1–2) — 33 / 34 pts

**Objectif :** Poser le socle technique et la CI, permettre à un cabinet de s'inscrire, de vérifier son e-mail et de s'authentifier ; disposer d'un compte super-admin plateforme.

| Story | Titre | Pts | Priorité |
|-------|-------|-----|----------|
| STORY-001 | Scaffolding NestJS + config + Swagger + health | 5 | Must |
| STORY-002 | Infra docker-compose + Mongoose/Bull | 3 | Must |
| STORY-003 | Socle transverse (logs, exceptions, contexte) + CI | 5 | Must |
| STORY-004 | Inscription tenant + super-admin | 5 | Must |
| STORY-005 | Auth login/refresh/logout + guards | 8 | Must |
| STORY-006 | Vérification e-mail | 5 | Must |
| STORY-007 | Seed PLATFORM_ADMIN + squelette Admin | 2 | Must |

**Total :** 33 pts (97 %) · **Livrable démontrable :** inscription + login + e-mail vérifié de bout en bout.
**Risques :** utilisation élevée, mais code standard fortement accéléré par l'IA (scaffolding, DTOs).

---

### Sprint 2 (semaines 3–4) — 23 / 34 pts *(re-négocié 2026-07-03)*

**Objectif :** Livrer la gestion complète des utilisateurs d'un cabinet avec isolation multi-tenant testée, et le socle KYC (soumission + statut) **au sein d'`expert-comptable`**.

| Story | Titre | Pts | Priorité | Statut |
|-------|-------|-----|----------|--------|
| STORY-010 | Isolation multi-tenant + tests | 5 | Must | ✅ terminée |
| STORY-008 | Invitation + acceptation | 5 | Must | ✅ terminée |
| STORY-009 | CRUD utilisateurs + garde-fous | 5 | Must | ✅ terminée |
| STORY-011 | Stockage S3/MinIO + upload RCCM/CFE | 5 | Must | ✅ terminée |
| STORY-012 | Statut KYC + machine à états + notifications | 3 | Must | ✅ terminée |

**Total livré :** 23 pts · **Vélocité Sprint 2 : 23.** **Livrable démontrable :** un cabinet invite des collaborateurs, soumet son KYC (RCCM+CFE) et suit son statut.
**Re-négociation (2026-07-03) :** la décision d'extraire le KYC en micro-service (voir révision EPIC-003) est intervenue après la livraison de STORY-011/012. **STORY-013 et STORY-014 sont dé-committées du Sprint 2** et re-planifiées dans le Sprint 3 « Extraction kyc-service » (elles y sont re-scopées et précédées de STORY-020/021). Le Sprint 2 se clôture donc à 23/33 pts committés.
**Risques :** STORY-010 (isolation) tirée en tête car KYC en dépend.

---

> **Sprints 3-7 re-séquencés le 2026-07-04** (re-cadrage écosystème). Séquence imposée par le graphe de dépendances : **auth-service (racine) → expert-comptable relying party → kyc-service (rebasé) → FedaPay**. Charge volontairement prudente (17-24 pts/sprint, ~50-70 % de la capacité) : trois nouveautés à absorber — première extraction de service, Kafka, RS256/JWKS.

### Sprint 3 (2026-07-30 → 08-13) — 24 / 34 pts — auth-service (IdP) partie 1

**Objectif :** `auth-service` émet des JWT RS256 en standalone.

| Story | Titre | Pts | Service |
|-------|-------|-----|---------|
| STORY-022 | Scaffold auth-service + compose racine + Kafka (KRaft) | 8 | auth-service |
| STORY-023 | Modèle d'identité : Organizations + Users + Memberships + register | 8 | auth-service |
| STORY-024 | Auth RS256 + JWKS + login/refresh/logout | 8 | auth-service |

**Livrable démontrable :** `register`/`login` sur `auth-service` (`:3001`) → JWT RS256 vérifiable via `/.well-known/jwks.json`. `expert-comptable` continue de tourner en émetteur HS256 (transition).
**Ordre :** STORY-022 → 023 → 024.

---

### Sprint 4 (2026-08-13 → 08-27) — 20 / 34 pts — auth-service complet + bascule JWKS

**Objectif :** IdP complet (e-mail, invitations, users, événements) ; `expert-comptable` valide via JWKS.

| Story | Titre | Pts | Service |
|-------|-------|-----|---------|
| STORY-025 | Vérification e-mail + invitations + file mail interne | 5 | auth-service |
| STORY-026 | Gestion users + rôles + memberships + seed PLATFORM_ADMIN | 5 | auth-service |
| STORY-027 | Événements identity.* (Kafka + outbox) + admin organisations | 5 | auth-service |
| STORY-028 | expert-comptable valide via JWKS (bascule RS256) | 5 | expert-comptable |

**Livrable démontrable :** IdP feature-complet (identité + `identity.*` sur Kafka) ; `expert-comptable` accepte les JWT RS256 de l'IdP.

---

### Sprint 5 (2026-08-27 → 09-10) — 21 / 34 pts — relying party (cutover) + kyc scaffold

**Objectif :** `expert-comptable` pleinement relying party ; `kyc-service` scaffoldé.

| Story | Titre | Pts | Service |
|-------|-------|-----|---------|
| STORY-029 | Read-models identité + consumer identity.* (Kafka) + provisioning | 8 | expert-comptable |
| STORY-030 | Retrait des modules d'identité + cutover + e2e cross-service | 5 | expert-comptable |
| STORY-020 | Scaffold kyc-service (compose racine) + migration upload/statut + JWKS | 8 | kyc-service |

**Livrable démontrable :** parcours identité de bout en bout (register/login sur auth-service → read-model d'expert-comptable via `identity.*`) ; `kyc-service` démarré et validant les JWT via JWKS.
**Ordre :** STORY-029 → 030 (cutover), puis STORY-020.

---

### Sprint 6 (2026-09-10 → 09-24) — 17 / 34 pts — KYC de bout en bout + plans FedaPay

**Objectif :** KYC extrait complet (Kafka, revue admin, guard) ; catalogue de plans.

| Story | Titre | Pts | Service |
|-------|-------|-----|---------|
| STORY-021 | Topic kyc.status.changed (Kafka) + consumer read-model + e-mails | 5 | les deux |
| STORY-013 | Revue KYC admin global (kyc-service) | 5 | kyc-service |
| STORY-014 | TenantStateGuard (read-models KYC + identité) + re-soumission | 5 | expert-comptable + kyc-service |
| STORY-015 | Catalogue de plans | 2 | expert-comptable |

**Livrable démontrable :** upload KYC sur `:3002` → topic Kafka → read-model d'expert-comptable + e-mail ; revue admin ; `TenantStateGuard` régule le checkout.
**Ordre :** STORY-020 (sprint 5) → STORY-021 → 013 → 014.

---

### Sprint 7 (2026-09-24 → 10-08) — 21 / 34 pts — Abonnement FedaPay

**Objectif :** Abonnement FedaPay complet + dashboard admin ; parcours complet validé e2e.

| Story | Titre | Pts | Priorité |
|-------|-------|-----|----------|
| STORY-016 | Checkout FedaPay | 5 | Must |
| STORY-017 | Webhook signé + idempotent + activation | 8 | Must |
| STORY-018 | Historique + expiration + relances | 3 | Should |
| STORY-019 | Dashboard admin + e2e parcours complet | 5 | Must |

**Livrable démontrable :** paiement Mobile Money sandbox → abonnement actif → accès métier ouvert ; e2e inscription (auth-service) → KYC (kyc-service) → paiement (expert-comptable).
**Rationale de la sous-charge :** buffer pour le risque d'intégration FedaPay (STORY-017 : signature webhook, concurrence).

---

> **Sprints 8-9 ajoutés le 2026-07-07** (capacités partagées P7/P8). Introduits **après** le MVP vertical (fin Sprint 7) : `catalog-service` (entitlements, source de vérité des droits) puis `bilan-service` (squelette). Charge prudente (~16-21 pts) : deux nouveaux services relying-party + un nouveau producteur/consommateur Kafka (`entitlement.changed`) et l'intégration billing→catalog (C8).

### Sprint 8 (2026-10-08 → 10-22) — 21 / 34 pts — `catalog-service` (catalogue + entitlements)

**Objectif :** `catalog-service` devient la **source de vérité des entitlements** (P8) ; le paiement d'`expert-comptable` octroie un entitlement (service-à-service, C8).

| Story | Titre | Pts | Service |
|-------|-------|-----|---------|
| STORY-031 | Scaffold catalog-service (base + relying party JWKS + health) | 3 | catalog-service |
| STORY-032 | Catalogue Module/ModuleVersion/ReferentielVersion + admin CRUD + garde-fou N/N-1 | 5 | catalog-service |
| STORY-033 | Entitlements : schéma (org × module) + grant/update/revoke + GET réconciliation | 5 | catalog-service |
| STORY-034 | Événements entitlement.changed (Kafka + outbox) + auth service-à-service (C8) | 5 | catalog-service |
| STORY-039 | expert-comptable : octroi d'entitlement catalog à l'activation d'abonnement (C8) | 3 | expert-comptable |

**Livrable démontrable :** un `PLATFORM_ADMIN` publie un module + ses versions ; un paiement sur `expert-comptable` (`:3000`) **octroie** l'entitlement sur `catalog` (`:3003`) → `entitlement.changed` émis sur Kafka.
**Ordre :** STORY-031 → 032 → 033 → 034 → 039. **⚠️ Décision C8 (auth service-à-service) à trancher avant STORY-034/039.**

---

### Sprint 9 (2026-10-22 → 11-05) — 16 / 34 pts — `bilan-service` (squelette d'intégration)

**Objectif :** `bilan-service` scaffoldé et **intégré** (read-models entitlement + KYC, gate rejoué, référentiel pluggable), **prêt à recevoir le moteur comptable** (EPIC-009 / PRD Bilan à venir).

| Story | Titre | Pts | Service |
|-------|-------|-----|---------|
| STORY-035 | Scaffold bilan-service (base + relying party JWKS + health) | 3 | bilan-service |
| STORY-036 | Read-models + consumers Kafka (entitlement.changed + kyc.status.changed) + idempotence | 5 | bilan-service |
| STORY-037 | Gate @RequiresBilanAccess (emailVerified + KYC + entitlement, read-models locaux) | 3 | bilan-service |
| STORY-038 | ReferentielLoader (artefact + checksum + cache) + interface référentiel + moteur squelette | 5 | bilan-service |

**Livrable démontrable :** `bilan-service` (`:3004`) refuse/accepte l'accès selon e-mail vérifié + KYC approuvé + entitlement actif (read-models locaux alimentés par Kafka) et charge le paquet de référentiel désigné (checksum vérifié). **Aucun calcul comptable** (EPIC-009).
**Ordre :** STORY-035 → 036 → 037 → 038.

---

## Traçabilité des epics

| Epic | Nom | Stories | Points | Sprint |
|------|-----|---------|--------|--------|
| EPIC-000 | Fondations techniques | STORY-001, 002, 003 | 13 | 1 |
| EPIC-001 | Comptes & authentification *(→ migre vers auth-service)* | STORY-004, 005, 006, 007 | 20 | 1 |
| EPIC-002 | Utilisateurs du tenant | STORY-008, 009, 010 | 15 | 2 |
| EPIC-003 | KYC *(extrait en kyc-service, rebasé écosystème)* | STORY-011, 012, 020, 021, 013, 014 | 31 | 2, 5–6 |
| EPIC-005 | Extraction auth-service (IdP) *(2026-07-04)* | STORY-022, 023, 024, 025, 026, 027 | 39 | 3–4 |
| EPIC-006 | expert-comptable → relying party *(2026-07-04)* | STORY-028, 029, 030 | 18 | 4–5 |
| EPIC-004 | Abonnement & paiement FedaPay | STORY-015, 016, 017, 018, 019 | 23 | 6–7 |
| EPIC-007 | catalog-service (catalogue + entitlements) *(2026-07-07)* | STORY-031, 032, 033, 034, 039 | 21 | 8 |
| EPIC-008 | bilan-service (squelette d'intégration) *(2026-07-07)* | STORY-035, 036, 037, 038 | 16 | 9 |
| **Total** | | **39 stories** | **196** | **9 sprints** |

> **Rappel de la séquence :** EPIC-005 (auth-service, racine) → EPIC-006 (relying party) → EPIC-003 restant (kyc rebasé) → EPIC-004 (FedaPay, **fin MVP vertical**) → **EPIC-007 (catalog/entitlements, P8)** → **EPIC-008 (bilan squelette, P7)**. EPIC-001 (identité) est **re-hébergé** dans auth-service par EPIC-005 (code déjà livré au Sprint 1, relocalisé — pas re-facturé ; les 39 pts d'EPIC-005 couvrent la relocalisation + RS256/JWKS/Membership/événements/Kafka).

---

## Couverture des exigences

> Les FR d'identité (FR-001→004) ont été **livrés au Sprint 1-2 dans expert-comptable**, puis **re-hébergés dans auth-service** au Sprint 3-4 (colonne « re-hébergé »). Les stories d'origine restent la trace de la première livraison.

| FR | Story d'origine | Sprint | Re-hébergé (auth-service) | Sprint |
|----|-------|--------|-----------|--------|
| FR-001 Inscription | STORY-004 | 1 | STORY-023 | 3 |
| FR-002 Vérif e-mail | STORY-006 | 1 | STORY-025 | 4 |
| FR-003 Auth login/refresh | STORY-005 | 1 | STORY-024 | 3 |
| FR-004 Gestion users | STORY-008, 009 | 2 | STORY-025, 026 | 4 |
| FR-005 Soumission KYC | STORY-011, 012 | 2 | STORY-020, 021 (kyc-service) | 5–6 |
| FR-006 Revue KYC | — | — | STORY-013, 021 (kyc-service) | 6 |
| FR-007 Restriction d'accès | — | — | STORY-014 (guard read-model) | 6 |
| FR-008 Plans | — | — | STORY-015 | 6 |
| FR-009 Checkout FedaPay | — | — | STORY-016 | 7 |
| FR-010 Webhook idempotent | — | — | STORY-017 | 7 |
| FR-011 Historique/relances | — | — | STORY-018 | 7 |
| FR-012 Dashboard admin | STORY-007 (amorce) | 1 | STORY-027 (identité), 019 (agrégé) | 4, 7 |

| NFR | Story(ies) | Sprint |
|-----|-----------|--------|
| NFR-001 Sécurité | STORY-005/006/011 + STORY-024 (RS256/JWKS) | 1–2, 3 |
| NFR-002 Isolation | STORY-010 + read-models (STORY-029) | 2, 5 |
| NFR-003 Fiabilité paiement | STORY-017 | 7 |
| NFR-004 Performance | STORY-001, 003 (index/pagination) | 1 |
| NFR-005 Observabilité | STORY-003 ; événements Kafka (STORY-027, 021) | 1, 4, 6 |
| NFR-006 Docs + tests | STORY-001, 010, 030 (e2e cross-service), 019 | 1–7 |

**Couverture : 12/12 FR, 6/6 NFR — aucune exigence orpheline.**

> **EPIC-007/008 (catalog + bilan) — au-delà des FR d'origine.** Ces capacités plateforme (P7/P8, ajoutées le 2026-07-07) ne mappent pas les 12 FR du PRD `expert-comptable` : elles servent l'**écosystème** (entitlements comme source de vérité des droits d'usage ; squelette Bilan pluggable par référentiel). Leurs exigences propres vivent dans `architecture-catalog-service-2026-07-07.md` (décisions C1-C9) et `architecture-bilan-service-2026-07-07.md` (B1-B9). Le **fonctionnel comptable du Bilan** (formules, états) relève d'**EPIC-009**, non planifié ici (en attente du **PRD/tech-spec Bilan**, décision B8).

---

## Risques et mitigation

**Élevé**
- **Intégration FedaPay (STORY-017)** — format exact de la signature webhook à confirmer dans la doc officielle ; risque de concurrence/rejeu. *Mitigation : Sprint 3 sous-chargé (buffer), abstraction `PaymentProvider` isolant le détail, tests de rejeu/concurrence obligatoires, ngrok pour tester en local.*
- **Charge des sprints 1–2 (97 %)** — peu de marge. *Mitigation : STORY-018 (Should Have) est la variable d'ajustement ; en cas de dérapage, elle glisse en fin de Sprint 3 ou en sprint tampon sans compromettre le parcours d'activation.*

**Moyen**
- **Atomicité de l'inscription (STORY-004)** dépend du replica set Mongo (transactions). *Mitigation : replica set single-node fourni dès STORY-002.*
- **Fiabilité e-mail** (vérification, invitations, notifications KYC). *Mitigation : Mailhog en dev, worker Bull avec retry ×5.*

**Faible**
- **Décisions d'exploitation non tranchées** (hébergement, sauvegarde, alerting — R1/R2/R3 du gate check). *Mitigation : à traiter pendant/avant la fin du Sprint 3, non bloquant pour le dev.*

---

## Dépendances

**Externes :** compte FedaPay sandbox + clés API (avant Sprint 4) ; documentation de la signature webhook ; fournisseur SMTP pour la prod (Mailhog en dev) ; ngrok pour les webhooks locaux.
**Internes :** `kyc-service` ↔ `expert-comptable` (événements `kyc-events`) à partir du Sprint 3. Le futur module Bilan consommera les guards livrés ici et pourra consommer `kyc-service`.
**Ordonnancement critique (après re-cadrage 2026-07-04) :** Sprints 1-2 livrés (fondations, auth, users, socle KYC dans expert-comptable). Puis **EPIC-005 (auth-service, racine)** : STORY-022 → 023 → 024 → 025/026/027. Puis **EPIC-006 (relying party)** : STORY-028 (JWKS) → 029 (read-models) → 030 (cutover). Puis **EPIC-003 rebasé** : STORY-020 → 021 → 013 → 014. Puis **EPIC-004** : STORY-015 → 016 → 017 → 018 → 019. Puis **EPIC-007 (catalog)** : STORY-031 → 032 → 033 → 034 → **039** (intégration billing→catalog). Puis **EPIC-008 (bilan)** : STORY-035 → 036 → 037 → 038. Contraintes : STORY-024 (JWKS) précède STORY-028 ; STORY-027 (identity.*) précède STORY-029 (consumer) ; le cutover (030) précède l'extraction kyc (020) ; **STORY-034 (`entitlement.changed`) précède STORY-036 (consumer bilan)** ; **STORY-017 (activation FedaPay) + STORY-034 précèdent STORY-039** ; **décision C8 tranchée avant STORY-034/039**.

---

## Definition of Done

Une story est terminée quand :
- [ ] Code implémenté et commité
- [ ] Tests unitaires écrits et passants (≥ 80 % sur auth/kyc/billing)
- [ ] Tests d'intégration/e2e pertinents passants
- [ ] Endpoints documentés dans Swagger
- [ ] Revue de code effectuée (`/code-review`)
- [ ] Critères d'acceptation validés
- [ ] CI verte (lint + tests + build)

---

## Prochaines étapes

**Immédiat (au 2026-07-07) :** Sprints 1-2 **livrés** ; **Sprint 3 terminé** (auth-service IdP : STORY-022/023/024 `done`, vérifiés docker bout-en-bout). En cours : **Sprint 4** — STORY-025 `defined` (vérif e-mail + invitations + file mail).

- `/bmad:create-story STORY-026` — prochaine story à documenter (gestion users + rôles + seed), puis STORY-027, puis
- `/bmad:dev-story STORY-025` — implémenter la story courante (le stack docker tourne, Mailhog dispo pour la vérif)

**Cadence :** sprints de 2 semaines · revue + rétro en fin de semaine 2 de chaque sprint.

**Suivi :** `docs/sprint-status.yaml` (source de vérité de l'avancement, sprints 1-9) · `/bmad:workflow-status` pour l'avancement global.

**⚠️ Décision à trancher avant le Sprint 8 :** **C8** (auth service-à-service billing→catalog) — bloquante pour STORY-034/039 (octroi automatique après paiement).

**Architecture de référence :** `docs/architecture-prospera-ecosystem-2026-07-04.md` (programme, P1-P10) · `architecture-auth-service-2026-07-04.md` · `architecture-kyc-service-2026-07-03.md` · `architecture-expert-comptable-2026-07-02.md` · `architecture-catalog-service-2026-07-07.md` · `architecture-bilan-service-2026-07-07.md` · `architecture-gateway-2026-07-07.md`.

---

**Plan créé avec BMAD Method v6 — Phase 4 (Implementation Planning)**
