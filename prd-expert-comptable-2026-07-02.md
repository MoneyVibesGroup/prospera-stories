# Product Requirements Document : Micro-service ExpertComptable

**Date :** 2026-07-02
**Auteur :** vivian
**Version :** 1.2
**Type de projet :** API (micro-service NestJS)
**Niveau de projet :** 3 (12–40 stories)
**Statut :** Draft

> **Addendum 1.2 (2026-07-07) — écosystème PROSPERA : ce PRD devient partiellement historique.** Depuis sa rédaction, le programme a été re-cadré (**source de vérité : `docs/architecture-prospera-ecosystem-2026-07-04.md`**). Ce PRD **reste** l'ancre de traçabilité des identifiants **FR-001 → FR-012 / NFR-001 → NFR-006** et la source de vérité de la **facturation FedaPay** (EPIC-004), mais plusieurs exigences ont **changé de service propriétaire** — **critères d'acceptation inchangés**, seule la *localisation* change (même principe que l'addendum 1.1 KYC) :
>
> - **FR-001, FR-002, FR-003, FR-004** (inscription, vérif e-mail, login/refresh/logout, gestion des utilisateurs) → **`auth-service`** (IdP dédié, décision **D9**). L'identité (Users, Organizations, Memberships) quitte `expert-comptable` ; jetons en **RS256/JWKS** ; `Tenant` devient `Organization` partagée possédée par l'IdP.
> - **FR-005, FR-006** (KYC) → **`kyc-service`** (déjà acté par l'addendum 1.1).
> - **FR-007** (matrice d'accès / `TenantStateGuard`) → **reste un pattern de relying party**. Pour le **Bilan devenu service partagé** (ci-dessous), le gate est **rejoué dans `bilan-service`** (read-models KYC + entitlement), et non plus hérité d'un guard interne à `expert-comptable`.
> - **FR-008 → FR-011** (plans, checkout, webhooks, cycle de vie de l'abonnement) → **restent dans `expert-comptable`** (monétisation du vertical, EPIC-004). **Toujours la source de vérité.**
> - **FR-012** (dashboard super-admin global) → **`admin-panel` (BFF)** agrégeant identité + KYC + entitlements (décision **P8**), et non plus un `AdminModule` interne.
> - **Module métier Bilan** → **`bilan-service`** (capacité partagée entre verticaux, décisions **P7 / D10**), avec **référentiel comptable versionné par organisation** (SYSCOHADA révisé, SFD-BCEAO…) ; l'**entitlement** (quel module/version pour quelle org) appartient à **`catalog-service`** (**P8**), pas à la souscription du vertical.
>
> **Périmètre résiduel réel d'`expert-comptable`** : facturation FedaPay (EPIC-004) + socle *relying party* (validation JWKS + read-models identité/KYC/entitlement). **Restent valables tels quels** : personas, parcours P1–P3, NFR-001 → 006, hypothèses et hors-périmètre. Les passages ci-dessous décrivant `expert-comptable` comme **propriétaire de l'identité** ou le **Bilan comme module interne** sont désormais **historiques** — se référer à l'architecture programme pour l'état cible.

---

## Vue d'ensemble du document

Ce PRD définit les exigences fonctionnelles et non fonctionnelles de la **phase 1** du micro-service **ExpertComptable** : gestion des comptes multi-tenant, vérification e-mail, validation KYC et abonnement via FedaPay. Il constitue la source de vérité de ce qui sera construit et assure la traçabilité exigences → epics → stories.

**Documents liés :**
- Environnement technique : `Environnement-Module-Expert-Comptable.docx`
- Architecture : `docs/architecture-expert-comptable-2026-07-02.md` (reprend les mêmes identifiants FR/NFR)

---

## Résumé exécutif

ExpertComptable est un micro-service SaaS multi-tenant destiné aux cabinets comptables de la zone UEMOA (Togo, Bénin en priorité). Avant de livrer le premier module métier (**Bilan**), la phase 1 met en place les fondations : un cabinet crée son compte (tenant) et son créateur en devient le super-admin ; il gère ses utilisateurs, dont chacun doit vérifier son adresse e-mail ; le cabinet soumet ses justificatifs légaux (**RCCM** et **carte CFE**) qui sont examinés par le super-admin global de la plateforme ; enfin, il souscrit un abonnement payé via **FedaPay** (Mobile Money et carte bancaire). L'accès aux modules métier n'est ouvert qu'aux tenants dont l'e-mail est vérifié, le KYC approuvé et l'abonnement actif.

---

## Objectifs produit

### Objectifs business

1. **Poser des fondations SaaS réutilisables** (tenancy, KYC, facturation) sur lesquelles tous les modules métier — à commencer par le Bilan — seront livrés sans retravailler la sécurité ni la monétisation.
2. **Garantir la conformité d'entrée** : seuls des cabinets légalement constitués (RCCM + CFE vérifiés manuellement) accèdent à la plateforme, condition de crédibilité du produit auprès de l'écosystème comptable OHADA.
3. **Monétiser dès le premier jour** avec des moyens de paiement réellement utilisés dans la zone (Mobile Money d'abord, carte ensuite) et un encaissement fiable (zéro double activation, zéro paiement perdu).

### Métriques de succès

- Parcours complet **inscription → e-mail vérifié → KYC soumis** réalisable en < 15 minutes côté cabinet
- Délai de revue KYC par l'admin plateforme < 48 h ouvrées (outillage : file d'attente dédiée)
- **100 %** des webhooks de paiement traités exactement une fois (0 double activation, 0 perte) — vérifié par réconciliation avec le dashboard FedaPay
- Taux de conversion paiement sandbox → live sans modification de code (bascule par variable d'environnement)
- Couverture de tests ≥ 80 % sur les modules auth, kyc, billing

---

## Exigences fonctionnelles

Les identifiants FR-001 → FR-012 sont partagés avec le document d'architecture.

---

### FR-001 : Création d'un compte tenant

**Priorité :** Must Have

**Description :**
Un visiteur crée un compte cabinet en fournissant la raison sociale, le pays, son identité (prénom, nom), son e-mail et un mot de passe. Le système crée le tenant et un utilisateur avec le rôle **super-admin du compte** (`TENANT_ADMIN`).

**Critères d'acceptation :**
- [ ] `POST /auth/register` crée un Tenant et un User `TENANT_ADMIN` liés, en une opération atomique (aucun tenant orphelin ni user orphelin en cas d'échec partiel)
- [ ] L'e-mail est unique globalement ; une tentative avec un e-mail existant renvoie une erreur explicite sans révéler d'information sur le compte existant
- [ ] Le mot de passe respecte une politique minimale (≥ 8 caractères, vérifiée côté serveur) et n'est jamais stocké en clair (bcrypt)
- [ ] Le tenant est créé avec `kycStatus = PENDING_DOCUMENTS` et sans abonnement
- [ ] Un e-mail de vérification est envoyé automatiquement à l'issue de l'inscription

**Dépendances :** —

---

### FR-002 : Vérification de l'adresse e-mail

**Priorité :** Must Have

**Description :**
Chaque utilisateur (créateur du compte ou invité) doit valider son adresse e-mail via un lien de confirmation avant d'accéder à la plateforme.

**Critères d'acceptation :**
- [ ] Le lien contient un token aléatoire à usage unique, valable 24 h, stocké hashé en base
- [ ] `GET /auth/verify-email?token=` marque `emailVerifiedAt` et invalide le token
- [ ] Un token expiré ou déjà consommé renvoie une erreur claire avec possibilité de renvoyer un lien
- [ ] `POST /auth/resend-verification` est limité à 3 envois/heure par utilisateur
- [ ] Tout endpoint authentifié (hors verify/resend/logout) est refusé tant que l'e-mail n'est pas vérifié

**Dépendances :** FR-001

---

### FR-003 : Authentification

**Priorité :** Must Have

**Description :**
Les utilisateurs se connectent par e-mail + mot de passe et obtiennent un access token JWT court et un refresh token rotatif.

**Critères d'acceptation :**
- [ ] `POST /auth/login` renvoie `{ accessToken (15 min), refreshToken (7 j) }` pour des identifiants valides
- [ ] Identifiants invalides → 401 avec message générique (pas de distinction e-mail inconnu / mot de passe erroné)
- [ ] `POST /auth/refresh` fait tourner le refresh token ; la réutilisation d'un refresh token déjà consommé invalide la session
- [ ] `POST /auth/logout` révoque le refresh token
- [ ] Le login est limité à 5 tentatives/minute par IP
- [ ] Un utilisateur `SUSPENDED` ou d'un tenant `SUSPENDED` ne peut pas se connecter

**Dépendances :** FR-001

---

### FR-004 : Gestion des utilisateurs du tenant

**Priorité :** Must Have

**Description :**
Le super-admin du compte invite, liste, modifie, suspend et supprime les utilisateurs de son cabinet, et leur attribue un rôle (`TENANT_ADMIN` ou `TENANT_USER`).

**Critères d'acceptation :**
- [ ] `POST /users` envoie une invitation par e-mail ; l'invité définit son mot de passe via un lien (token à usage unique, 72 h) et son e-mail est considéré vérifié à l'acceptation
- [ ] Liste paginée des utilisateurs du tenant uniquement (jamais ceux d'un autre tenant)
- [ ] Changement de rôle et suspension/réactivation par le super-admin du compte
- [ ] Impossible de supprimer ou rétrograder le **dernier** `TENANT_ADMIN` actif du tenant
- [ ] Un `TENANT_USER` ne peut accéder à aucun endpoint de gestion d'utilisateurs (403)

**Dépendances :** FR-002, FR-003

---

### FR-005 : Soumission des documents KYC

**Priorité :** Must Have

**Description :**
Le super-admin du compte téléverse les deux justificatifs obligatoires : **RCCM** et **carte CFE** (PDF, JPEG ou PNG, ≤ 10 Mo chacun).

**Critères d'acceptation :**
- [ ] `POST /kyc/documents` accepte `type ∈ {RCCM, CFE}` + fichier multipart ; type MIME vérifié par contenu réel (magic bytes), pas seulement l'extension
- [ ] Fichier > 10 Mo ou format non supporté → 422 avec message explicite
- [ ] Quand les deux types de documents sont présents, le tenant passe automatiquement à `kycStatus = UNDER_REVIEW`
- [ ] Après un rejet, la re-soumission d'un document crée une nouvelle version (l'ancienne passe à `SUPERSEDED`) et repasse le tenant en `UNDER_REVIEW`
- [ ] Les fichiers sont stockés dans un bucket privé ; aucune URL publique permanente n'existe

**Dépendances :** FR-002

---

### FR-006 : Revue KYC par le super-admin global

**Priorité :** Must Have

**Description :**
Le super-admin global de la plateforme examine les dossiers KYC depuis son dashboard et approuve ou rejette chaque demande, avec motif obligatoire en cas de rejet.

**Critères d'acceptation :**
- [ ] `GET /admin/kyc/pending` liste les tenants en `UNDER_REVIEW`, triés du plus ancien au plus récent
- [ ] L'admin consulte chaque document via une URL présignée à durée courte (≤ 5 min)
- [ ] `approve` passe le tenant à `kycStatus = APPROVED` et enregistre le réviseur et la date
- [ ] `reject` exige un motif ; le tenant passe à `REJECTED` et le motif est visible côté cabinet
- [ ] Le cabinet est notifié par e-mail à l'approbation comme au rejet (motif inclus)
- [ ] Ces endpoints sont réservés au rôle `PLATFORM_ADMIN` (403 pour tout autre rôle)

**Dépendances :** FR-005

---

### FR-007 : Restriction d'accès selon l'état du tenant

**Priorité :** Must Have

**Description :**
Tant que le tenant n'est pas pleinement validé, ses accès sont restreints selon une matrice progressive : gestion du compte dès l'e-mail vérifié ; paiement après KYC approuvé ; modules métier (Bilan…) uniquement avec e-mail vérifié + KYC approuvé + abonnement actif.

**Critères d'acceptation :**
- [ ] Un tenant `PENDING_DOCUMENTS`/`UNDER_REVIEW`/`REJECTED` peut gérer son profil, ses utilisateurs et son KYC, mais pas créer de checkout (403 avec code d'erreur explicite `KYC_NOT_APPROVED`)
- [ ] Un tenant KYC approuvé sans abonnement actif ne peut pas accéder aux modules métier (403 `SUBSCRIPTION_REQUIRED`)
- [ ] La restriction est appliquée par un guard global déclaratif : un nouveau module métier est protégé par simple décorateur, sans logique dupliquée
- [ ] `GET /tenant` expose l'état effectif (e-mail, KYC, abonnement) pour que le frontend affiche les étapes restantes
- [ ] Un tenant suspendu manuellement par l'admin plateforme perd tout accès (401/403 sur tout endpoint)

**Dépendances :** FR-002, FR-006, FR-010

---

### FR-008 : Catalogue de plans d'abonnement

**Priorité :** Must Have

**Description :**
La plateforme propose des plans d'abonnement (montant en XOF, périodicité mensuelle ou annuelle, limites associées) consultables par les tenants.

**Critères d'acceptation :**
- [ ] `GET /billing/plans` renvoie les plans actifs (code, nom, montant, devise, périodicité, limites)
- [ ] Les plans sont seedés en base et modifiables sans redéploiement (pas de plans codés en dur)
- [ ] Un plan désactivé n'apparaît plus et ne peut plus être souscrit, sans affecter les abonnements en cours

**Dépendances :** —

---

### FR-009 : Souscription et paiement via FedaPay

**Priorité :** Must Have

**Description :**
Un super-admin de compte dont le KYC est approuvé choisit un plan et paie via FedaPay (Mobile Money ou carte bancaire), en sandbox comme en production.

**Critères d'acceptation :**
- [ ] `POST /billing/checkout` crée une transaction FedaPay et renvoie l'URL de paiement
- [ ] Une souscription `PENDING_PAYMENT` est créée localement, liée au plan et au tenant
- [ ] La bascule sandbox/live se fait uniquement par variables d'environnement (`FEDAPAY_ENVIRONMENT`)
- [ ] Un tenant avec un abonnement déjà actif ne peut pas créer un second checkout pour la même période (409)
- [ ] L'échec ou l'abandon du paiement laisse le tenant dans un état cohérent, avec possibilité de relancer un checkout

**Dépendances :** FR-007, FR-008

---

### FR-010 : Traitement des webhooks de paiement

**Priorité :** Must Have

**Description :**
Le système reçoit les webhooks FedaPay, vérifie leur signature, et active/renouvelle l'abonnement de façon fiable et idempotente.

**Critères d'acceptation :**
- [ ] Signature HMAC vérifiée (comparaison à temps constant) ; signature invalide → 401, événement non traité
- [ ] Chaque événement est journalisé ; un événement déjà reçu (même clé) est ignoré sans effet de bord
- [ ] Le traitement est asynchrone (file avec retry) ; l'endpoint répond 200 immédiatement après journalisation
- [ ] Avant activation, le statut de la transaction est **re-vérifié via l'API FedaPay** (le webhook seul ne fait pas foi)
- [ ] Rejouer le même webhook 2 fois, ou 2 webhooks concurrents pour la même transaction, ne produit qu'**une seule** activation (test automatisé exigé)
- [ ] Paiement approuvé → souscription `ACTIVE` avec période courante calculée selon la périodicité du plan ; transaction enregistrée

**Dépendances :** FR-009

---

### FR-011 : Historique des transactions et cycle de vie de l'abonnement

**Priorité :** Should Have

**Description :**
Le tenant consulte son abonnement courant et l'historique de ses transactions ; le système gère l'expiration des abonnements et les relances.

**Critères d'acceptation :**
- [ ] `GET /billing/subscription` renvoie le plan, le statut et la période courante
- [ ] `GET /billing/transactions` renvoie l'historique paginé (montant, méthode, statut, date)
- [ ] Un job quotidien passe les abonnements échus à `EXPIRED` ; l'accès aux modules métier est alors coupé (cf. FR-007)
- [ ] E-mails de relance envoyés à J-7 et J-1 avant échéance

**Dépendances :** FR-010

---

### FR-012 : Dashboard du super-admin global

**Priorité :** Must Have

**Description :**
Le super-admin global dispose d'une vue d'ensemble des tenants : recherche, statuts (e-mail, KYC, abonnement), détail d'un tenant et suspension manuelle.

**Critères d'acceptation :**
- [ ] `GET /admin/tenants` : liste paginée avec filtres (kycStatus, statut d'abonnement) et recherche par nom
- [ ] `GET /admin/tenants/:id` : détail (profil, utilisateurs, documents KYC, abonnement, transactions)
- [ ] `POST /admin/tenants/:id/suspend` coupe immédiatement tout accès du tenant ; opération réversible
- [ ] Le compte `PLATFORM_ADMIN` est créé par script de seed, jamais via l'API publique

**Dépendances :** FR-001, FR-006

---

## Exigences non fonctionnelles

---

### NFR-001 : Sécurité

**Priorité :** Must Have

**Description :**
Le service protège des données de cabinets comptables et des documents d'identité d'entreprise, conformément aux bonnes pratiques OWASP API Top 10.

**Critères d'acceptation :**
- [ ] Mots de passe hashés bcrypt (cost ≥ 12) ; aucun secret en clair dans le code ou les logs
- [ ] JWT access ≤ 15 min ; refresh rotatif révocable, détection de réutilisation
- [ ] Rate limiting : global 100 req/min/IP ; login 5/min ; renvoi de vérification 3/h
- [ ] Fichiers KYC accessibles uniquement par URLs présignées ≤ 5 min, bucket privé
- [ ] Validation stricte de toutes les entrées (`whitelist` + `forbidNonWhitelisted`)
- [ ] Démarrage refusé si une variable d'environnement obligatoire est absente ou invalide

**Justification :** données sensibles + paiements ; une fuite ou un contournement KYC détruirait la confiance dans la plateforme.

---

### NFR-002 : Isolation multi-tenant

**Priorité :** Must Have

**Description :**
Aucune donnée d'un tenant ne doit être lisible ou modifiable par un utilisateur d'un autre tenant, quelle que soit la requête.

**Critères d'acceptation :**
- [ ] Le filtre `tenantId` est injecté par l'infrastructure (repository de base), jamais fourni par le client
- [ ] Tests e2e systématiques : user du tenant A → ressource du tenant B → 404 (jamais 403 révélant l'existence)
- [ ] La suite de tests d'isolation est bloquante en CI

**Justification :** c'est le contrat fondamental d'un SaaS multi-tenant ; une seule fuite inter-cabinets est rédhibitoire.

---

### NFR-003 : Fiabilité et idempotence des paiements

**Priorité :** Must Have

**Description :**
Aucun paiement ne doit être perdu ni appliqué deux fois, y compris en cas de webhooks dupliqués, concurrents, ou d'indisponibilité temporaire du service.

**Critères d'acceptation :**
- [ ] Webhook journalisé avant traitement ; traitement en file avec ≥ 5 tentatives (backoff exponentiel) ; échecs définitifs tracés et alertables
- [ ] Idempotence garantie par contrainte d'unicité en base (ID transaction FedaPay), pas seulement par logique applicative
- [ ] Réconciliation possible a posteriori : payload brut + snapshot de la réponse API FedaPay conservés

**Justification :** un double débit ou un abonnement payé non activé sont les deux incidents les plus destructeurs de confiance.

---

### NFR-004 : Performance

**Priorité :** Should Have

**Description :**
Les endpoints CRUD répondent en moins de 300 ms au p95 (hors upload de fichiers), pour une charge initiale de ~50 tenants et ~500 utilisateurs.

**Critères d'acceptation :**
- [ ] p95 < 300 ms mesuré sur login, liste des utilisateurs et statut KYC
- [ ] Pagination par défaut (limit 20, max 100) sur toutes les listes
- [ ] Aucun travail lourd (e-mail, appel FedaPay) exécuté de façon synchrone dans une requête HTTP

**Justification :** confort d'usage ; la volumétrie initiale est faible, l'architecture ne doit juste pas l'empêcher de croître.

---

### NFR-005 : Observabilité

**Priorité :** Must Have

**Description :**
Tout incident de paiement ou de KYC doit être diagnosticable a posteriori à partir des logs et journaux.

**Critères d'acceptation :**
- [ ] Logs structurés (JSON) avec `requestId` et `tenantId` sur chaque requête
- [ ] Journal des webhooks conservé avec statut de traitement (RECEIVED/PROCESSED/FAILED/IGNORED)
- [ ] `GET /health` vérifie MongoDB et Redis (utilisable par l'orchestrateur)

**Justification :** les litiges de paiement se résolvent avec des preuves, pas des suppositions.

---

### NFR-006 : Documentation et testabilité

**Priorité :** Must Have

**Description :**
L'API est auto-documentée et le code des modules critiques est couvert par des tests automatisés.

**Critères d'acceptation :**
- [ ] Swagger complet sur `/api/docs` (DTO, codes d'erreur, auth Bearer)
- [ ] Couverture ≥ 80 % sur `auth`, `kyc`, `billing` ; seuil bloquant en CI
- [ ] Tests e2e des parcours : inscription → vérification → KYC → paiement → accès

**Justification :** le frontend et les futurs modules (Bilan) consommeront cette API ; la documentation est le contrat.

---

## Epics

---

### EPIC-000 : Fondations techniques

**Description :** Scaffolding NestJS, docker-compose (MongoDB, Redis, MinIO, Mailhog), configuration validée, logging, CI. Livre un service déployable avec health check.

**Exigences fonctionnelles :** — (support des NFR-001, 005, 006)
**Estimation :** 3 stories
**Priorité :** Must Have
**Valeur business :** rien d'autre ne peut être livré sans ces fondations ; la CI et l'observabilité posées dès le départ évitent la dette.

---

### EPIC-001 : Comptes & authentification

**Description :** Inscription tenant + super-admin de compte, vérification e-mail, login/refresh/logout, seed du super-admin global.

**Exigences fonctionnelles :** FR-001, FR-002, FR-003
**Estimation :** 4 stories
**Priorité :** Must Have
**Valeur business :** porte d'entrée du produit ; conditionne tous les autres epics.

---

### EPIC-002 : Utilisateurs du tenant

**Description :** Invitations, CRUD utilisateurs, rôles, garde-fous, tests d'isolation multi-tenant.

**Exigences fonctionnelles :** FR-004
**Estimation :** 3 stories
**Priorité :** Must Have
**Valeur business :** permet aux cabinets de travailler à plusieurs — cas d'usage réel d'un cabinet comptable.

---

### EPIC-003 : KYC

**Description :** Upload RCCM/CFE, machine à états KYC, revue par l'admin plateforme, matrice de restriction d'accès.

**Exigences fonctionnelles :** FR-005, FR-006, FR-007
**Estimation :** 4 stories
**Priorité :** Must Have
**Valeur business :** conformité et crédibilité ; verrou d'accès sur lequel repose la confiance dans la plateforme.

> **Addendum 2026-07-03 — Le KYC devient un micro-service (`kyc-service`).** Le KYC est extrait dans un micro-service autonome, car la vérification d'identité d'un cabinet est une capacité **transverse** appelée à être réutilisée par plusieurs services PROSPERA (le module Bilan à venir, puis d'autres), et non une fonction propre à `expert-comptable`. Répartition des exigences :
> - **FR-005** (soumission RCCM/CFE) et **FR-006** (revue admin globale) sont désormais **portés par `kyc-service`** (documents, stockage privé, machine à états, revue).
> - **FR-007** (matrice de restriction d'accès) **reste dans `expert-comptable`** : le `TenantStateGuard` protège les endpoints de ce service et mêle KYC **et** abonnement (EPIC-004). Il lit une **copie locale** (read-model) du statut KYC.
> - **Communication** : `kyc-service` publie chaque changement de statut sur une file d'événements (`kyc-events`) ; `expert-comptable` la consomme pour tenir son read-model à jour et envoyer les e-mails (soumission / approbation / rejet) — il reste propriétaire des `User` et du `MailerService`.
> - **Critères d'acceptation inchangés** : les critères de FR-005/FR-006/FR-007 restent valables tels quels ; seule change leur **localisation** (le service qui les sert). Les URLs de test passent de `:3000` à `:3001` pour les endpoints `/kyc/*` et `/admin/kyc/*`.
> - **Impact planning** : re-découpage en STORY-020 (scaffold + migration), STORY-021 (événements + read-model + e-mails), STORY-013 (revue, re-scopée dans kyc-service), STORY-014 (guard, inchangé sur le fond). Détail : `docs/sprint-plan-expert-comptable-2026-07-02.md` et `docs/architecture-kyc-service-2026-07-03.md`.

---

### EPIC-004 : Abonnement & paiement FedaPay

**Description :** Plans, checkout FedaPay, webhooks signés et idempotents, historique, cycle de vie de l'abonnement, dashboard admin global.

**Exigences fonctionnelles :** FR-008, FR-009, FR-010, FR-011, FR-012
**Estimation :** 5 stories
**Priorité :** Must Have (FR-011 : Should Have)
**Valeur business :** la monétisation ; sans cet epic, pas de revenus.

---

## User stories (haut niveau)

Exemples par epic — le détail sera produit en Phase 4 (`/bmad:sprint-planning`, `/bmad:create-story`).

- **EPIC-001 :** « En tant que gérant de cabinet, je veux créer le compte de mon cabinet et devenir son administrateur, afin de démarrer sur la plateforme. »
- **EPIC-001 :** « En tant qu'utilisateur inscrit, je veux valider mon adresse e-mail via un lien, afin de prouver que je contrôle cette adresse. »
- **EPIC-002 :** « En tant que super-admin de compte, je veux inviter mes collaborateurs par e-mail et leur attribuer un rôle, afin qu'ils travaillent sur nos dossiers. »
- **EPIC-003 :** « En tant que super-admin de compte, je veux téléverser notre RCCM et notre carte CFE, afin de faire valider notre cabinet. »
- **EPIC-003 :** « En tant que super-admin global, je veux examiner les justificatifs et approuver ou rejeter avec motif, afin de n'admettre que des cabinets légitimes. »
- **EPIC-004 :** « En tant que super-admin de compte validé, je veux payer mon abonnement par Mobile Money, afin d'activer l'accès aux modules métier. »

---

## Personas

**1. Le gérant de cabinet (super-admin de compte — `TENANT_ADMIN`)**
Expert-comptable dirigeant un cabinet de 2 à 20 personnes au Togo ou au Bénin. À l'aise avec le Mobile Money, moins avec les process SaaS longs : le parcours d'activation doit être guidé et court. C'est lui qui paie.

**2. Le collaborateur comptable (`TENANT_USER`)**
Employé du cabinet, invité par le gérant. Utilisera surtout les modules métier (Bilan). N'a aucun droit d'administration.

**3. L'administrateur plateforme (`PLATFORM_ADMIN`)**
Opérateur de PROSPERA. Examine les dossiers KYC, surveille les tenants et les paiements, suspend les comptes problématiques. A besoin d'une file de travail claire et de preuves consultables (documents, journaux de transactions).

---

## Parcours utilisateur clés

**P1 — Activation d'un cabinet (parcours critique) :**
Inscription → e-mail de vérification → clic sur le lien → upload RCCM + CFE → passage automatique en revue → approbation par l'admin plateforme (notification e-mail) → choix d'un plan → paiement FedaPay (Mobile Money/carte) → webhook → abonnement actif → accès complet.

**P2 — Onboarding d'un collaborateur :**
Le super-admin invite par e-mail → l'invité clique, définit son mot de passe → accède à la plateforme avec les droits `TENANT_USER` et l'état d'accès courant du tenant.

**P3 — Revue KYC côté plateforme :**
L'admin ouvre la file des dossiers en attente → consulte RCCM et CFE (URLs présignées) → approuve, ou rejette avec motif → le cabinet est notifié et peut re-soumettre.

---

## Dépendances

### Dépendances internes

- **`kyc-service`** (depuis l'addendum 2026-07-03) : `expert-comptable` consomme les événements `kyc-events` de ce micro-service pour son read-model KYC et les e-mails associés ; les endpoints `/kyc/*` et `/admin/kyc/*` sont servis par `kyc-service`. Contrat : `docs/architecture-kyc-service-2026-07-03.md`.
- Le futur module **Bilan** dépendra des guards et de l'état du tenant livrés ici, et pourra lui aussi consommer `kyc-service`.

### Dépendances externes

- **FedaPay** : compte sandbox + clés API ; disponibilité de l'API et des webhooks ; documentation du format de signature
- **SMTP** : fournisseur d'envoi d'e-mails transactionnels (Mailhog en dev)
- **MongoDB Atlas ou Docker**, **Redis**, **stockage S3-compatible** (MinIO en dev)
- **ngrok** en développement pour recevoir les webhooks

---

## Hypothèses

1. Un e-mail = un utilisateur = un tenant (pas de multi-appartenance en phase 1).
2. La revue KYC est **manuelle** (pas d'OCR ni de vérification automatique en phase 1 ; l'OCR est une piste ultérieure mentionnée dans le document d'environnement).
3. Le renouvellement d'abonnement est un paiement **manuel** à échéance (pas de prélèvement récurrent automatique en phase 1).
4. La devise unique est le **XOF** ; marchés cibles initiaux : Togo et Bénin.
5. Les montants et le nombre de plans seront fixés avant la mise en production (seedés, modifiables sans redéploiement).
6. Un seul frontend consommera l'API en phase 1 (l'app web PROSPERA), plus le dashboard admin.

---

## Hors périmètre (phase 1)

- Le module métier **Bilan** (phase 2 — objet d'un PRD/tech-spec dédié)
- OCR et vérification automatique des documents KYC — **planifié pour une phase ultérieure** (la phase 1 fait une revue manuelle ; l'architecture est prête : jobs Bull + stockage S3 réutilisables par un futur service OCR)
- Prélèvement récurrent automatique FedaPay ; essais gratuits ; codes promo
- Multi-devise, multi-langue de l'API
- Intégrations PayGate Global / CinetPay / PayDunya (l'abstraction `PaymentProvider` les rend possibles plus tard)
- Authentification 2FA/MFA (envisageable en durcissement ultérieur)
- Facturation PDF / reçus fiscaux

---

## Questions ouvertes

1. **Tarification** : montants des plans, périodicités proposées, essai gratuit ou non ? (bloquant pour la mise en production, pas pour le développement)
2. **Signature des webhooks FedaPay** : format exact (header, algorithme) à confirmer dans la doc officielle lors de la story concernée
3. **Rétention des documents KYC** : durée légale de conservation et procédure d'effacement à confirmer avec le métier
4. **SLA de revue KYC** : l'objectif < 48 h est-il tenable avec l'équipe actuelle ?

---

## Approbation

### Parties prenantes

- **Product Owner / porteur du projet :** vivian
- **Super-admin plateforme :** équipe PROSPERA
- **Développement :** équipe PROSPERA (méthode BMAD, assistée par IA)

### Statut d'approbation

- [ ] Product Owner
- [ ] Engineering Lead
- [ ] QA Lead

---

## Historique des révisions

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2026-07-02 | vivian | PRD initial (phase 1 : comptes, KYC, abonnement) |
| 1.1 | 2026-07-03 | vivian | Addendum EPIC-003 : extraction du KYC en micro-service `kyc-service` (FR-005/FR-006 portés par kyc-service, FR-007 conservé) ; dépendance interne ajoutée |
| 1.2 | 2026-07-07 | vivian | Addendum écosystème (D9/P7/P8) : FR-001–004 → `auth-service` (IdP RS256/JWKS), FR-012 → `admin-panel` (BFF), module Bilan → `bilan-service` (capacité partagée), entitlement → `catalog-service`. FR-008–011 (FedaPay) restent dans `expert-comptable`. Ce PRD reste l'ancre de traçabilité FR/NFR ; source de vérité programme : `docs/architecture-prospera-ecosystem-2026-07-04.md` |

---

## Prochaines étapes

### Phase 3 : Architecture — ✅ déjà réalisée

`docs/architecture-expert-comptable-2026-07-02.md` couvre l'intégralité des FR/NFR de ce PRD (mêmes identifiants). Optionnel : `/bmad:solutioning-gate-check` pour valider formellement l'alignement PRD ↔ architecture.

### Phase 4 : Sprint planning

Lancer `/bmad:sprint-planning` pour détailler les stories des epics 000 → 004 et démarrer l'implémentation.

---

**Document créé avec BMAD Method v6 — Phase 2 (Planning)**

---

## Annexe A : Matrice de traçabilité

| Epic | Nom | Exigences fonctionnelles | Stories (est.) |
|------|-----|--------------------------|----------------|
| EPIC-000 | Fondations techniques | — (NFR-001, 005, 006) | 3 |
| EPIC-001 | Comptes & authentification | FR-001, FR-002, FR-003 | 4 |
| EPIC-002 | Utilisateurs du tenant | FR-004 | 3 |
| EPIC-003 | KYC | FR-005, FR-006, FR-007 | 4 |
| EPIC-004 | Abonnement & paiement FedaPay | FR-008, FR-009, FR-010, FR-011, FR-012 | 5 |
| **Total** | | **12 FR / 6 NFR** | **~19 stories** |

---

## Annexe B : Synthèse de priorisation

**Exigences fonctionnelles :** 11 Must Have, 1 Should Have (FR-011 — historique/relances : un tenant peut fonctionner sans, l'activation via webhook restant Must), 0 Could Have.

**Exigences non fonctionnelles :** 5 Must Have, 1 Should Have (NFR-004 — performance : la volumétrie initiale est faible ; l'exigence devient Must avant l'ouverture large).

**Lecture :** la phase 1 est volontairement resserrée — presque tout est Must Have parce que chaque epic est un prérequis du suivant (comptes → KYC → paiement → modules métier). La marge d'ajustement se trouve dans le périmètre exclu (OCR, récurrence automatique, 2FA), pas dans les FR listés.
