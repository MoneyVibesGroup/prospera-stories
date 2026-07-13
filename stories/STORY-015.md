# STORY-015: Catalogue de plans d'abonnement

**Epic:** EPIC-004 (Abonnement & paiement FedaPay — FR-008)
**Priority:** Must Have
**Story Points:** 2
**Status:** Done
**Assigned To:** Unassigned
**Created:** 2026-07-13
**Sprint:** 6

---

## User Story

En tant que **super-admin d'un cabinet (et plateforme PROSPERA)**,
je veux **consulter les plans d'abonnement proposés (montant, périodicité, limites) et pouvoir les faire évoluer sans redéploiement**,
afin de **choisir en connaissance de cause le plan à souscrire, la tarification restant modifiable par la plateforme sans livrer une nouvelle version**.

---

## Description

### Contexte
Le PRD (**FR-008**) exige un **catalogue de plans d'abonnement** consultable par les tenants, seedé en base et **modifiable sans redéploiement** (aucun plan codé en dur). C'est la première brique de l'**EPIC-004** et le préalable au parcours de paiement (P3 : choix d'un plan → checkout FedaPay → abonnement actif).

Depuis le re-cadrage **PA-1** (`architecture-prospera-ecosystem-2026-07-04.md`), l'EPIC-004 a été scindé : **checkout, webhooks et cycle de vie de l'abonnement** (FR-009 → FR-011) partent dans le futur **`paiement-service`** (Module 2, sprint 15), tandis que **plans & abonnement restent la propriété du vertical `expert-comptable`**. Cette story livre donc **uniquement le catalogue** — le côté lecture (source de vérité des plans), sans aucune logique de paiement.

Le socle est en place : `expert-comptable` est un micro-service NestJS/Mongoose *relying party* (validation JWKS, read-models), avec les décorateurs d'accès (`@Roles(PLATFORM_ADMIN)`, `@AllowUnverified`) et la matrice `TenantStateGuard` (STORY-014). Le placeholder d'abonnement existe déjà côté lecture (`GET /tenant/state` renvoie `subscriptionActive: false`) : cette story **ne** branche **pas** encore ce palier, elle pose la donnée qu'il consommera plus tard.

### Portée

**Inclus (`expert-comptable`) :**
- **Modèle `Plan`** (collection possédée) : `code` unique, nom, montant (XOF), devise, **périodicité** (mensuelle/annuelle), **limites** associées, drapeau `active`, horodatages.
- **`GET /billing/plans`** : liste des plans **actifs** (code, nom, montant, devise, périodicité, limites), consultable par un tenant authentifié (`@AllowUnverified` — pricing visible dès l'inscription, avant KYC).
- **Gestion sans redéploiement** : CRUD réservé `PLATFORM_ADMIN` (`POST` / `PATCH` / **désactivation**) pour créer et faire évoluer les plans à chaud. Un plan est **désactivé** (soft), **jamais supprimé physiquement**, afin que toute souscription (future, `paiement-service`) conserve une référence valide.
- **Seed idempotent** : jeu de plans initial upserté par `code` (rejeu sans doublon ni écrasement des montants modifiés par l'admin), remplaçant tout plan codé en dur.

**Hors périmètre :**
- **Checkout / paiement FedaPay, webhooks, souscription, cycle de vie de l'abonnement** (FR-009 → FR-011) → `paiement-service` (Module 2, STORY-016 → 019).
- **Enforcement du palier abonnement** dans `TenantStateGuard` (`SUBSCRIPTION_REQUIRED`) — extension point posé en STORY-014, branché en Module 2.
- **Exposition des plans à `paiement-service`** (event `plan.changed` / read-model, ou lecture API) — concern d'intégration Module 2, à traiter avec le PRD paiement (noté en dépendance aval).
- Tarification définitive (montants, nombre de plans, essai gratuit) : décision produit **bloquante pour la mise en production, pas pour le développement** (question ouverte PRD #1). Le seed fournit des valeurs de travail.

### User Flow

**A — Consultation (tenant) :**
1. Un utilisateur authentifié d'un cabinet (e-mail vérifié ou non) appelle `GET /billing/plans`.
2. Le service renvoie les plans **actifs** avec montant, devise, périodicité et limites.
3. Le frontend affiche la grille tarifaire ; le tenant choisira un plan au moment du paiement (Module 2).

**B — Évolution du catalogue (PLATFORM_ADMIN) :**
1. Le super-admin plateforme crée un plan (`POST /admin/billing/plans`) ou modifie un plan existant (`PATCH …/:code` : montant, limites, nom).
2. Pour retirer une offre, il **désactive** le plan (`active = false`) — il disparaît immédiatement de `GET /billing/plans` sans être supprimé.
3. Aucun redéploiement n'est nécessaire ; les modifications sont effectives à chaud.

---

## Acceptance Criteria

### Catalogue & consultation (FR-008)
- [ ] `GET /billing/plans` renvoie **uniquement les plans actifs**, chacun exposant : `code`, `name`, `amount`, `currency`, `interval` (périodicité), `limits`.
- [ ] L'endpoint est accessible à un tenant **authentifié** et reste lisible **avant** vérification d'e-mail (`@AllowUnverified`) ; il n'exige **pas** le palier KYC (consulter ≠ payer). Sans token → 401 ; tenant suspendu → 403 (via `TenantStateGuard`, non-régression).
- [ ] Les plans sont **stockés en base** (collection `plans`) et **seedés** — **aucun plan codé en dur** dans le code applicatif.
- [ ] Le **seed est idempotent** : rejoué, il n'introduit pas de doublon (upsert par `code`) et **n'écrase pas** un montant/limite modifié entre-temps par l'admin (`$setOnInsert` pour les valeurs de bootstrap).

### Gestion sans redéploiement (PLATFORM_ADMIN)
- [ ] Un `PLATFORM_ADMIN` peut **créer** un plan (`POST /admin/billing/plans`) et **modifier** un plan existant (`PATCH /admin/billing/plans/:code`) — montant, nom, limites, périodicité — **sans redéploiement**. Rôle ≠ `PLATFORM_ADMIN` → 403 ; non authentifié → 401.
- [ ] Un plan **désactivé** (`active = false`) **n'apparaît plus** dans `GET /billing/plans` et n'est **jamais supprimé physiquement** (soft-deactivation) : la référence reste résoluble pour toute souscription passée/future (contrat « sans affecter les abonnements en cours »).
- [ ] `code` est **unique** : un `POST` avec un `code` existant → 409 (conflit) ; un plan inconnu en `PATCH` → 404.
- [ ] Validation des entrées : `amount` entier ≥ 0 (XOF, sans sous-unité), `currency` par défaut `XOF`, `interval ∈ {MONTHLY, ANNUAL}`, `code` normalisé (slug). Entrée invalide → 400.

### Qualité / DoD PROSPERA
- [ ] Tests unitaires : service catalogue (filtrage actifs, upsert idempotent, unicité/404/409, désactivation) + validation DTO.
- [ ] Tests e2e : `GET /billing/plans` (actifs seulement, `@AllowUnverified`, 401 sans token) ; CRUD admin (création, modification, désactivation → disparition de la liste, 403 non-admin, 409 doublon, 404 inconnu).
- [ ] **Vérification docker bout-en-bout** (standard PROSPERA) sur la stack racine : seed au démarrage → `GET /billing/plans` peuplé ; désactivation admin → plan retiré de la liste.
- [ ] Lint 0 warning ; seuils Jest (65/90/90/90) tenus.

---

## Technical Notes

### Composants (`expert-comptable`)
- **Nouveau module `billing`** : `src/modules/billing/` (déclaré dans `app.module.ts`, importé après `KycEventsModule`).
  - `schemas/plan.schema.ts` — `@Schema({ timestamps: true, collection: 'plans' })`, `code` `@Prop({ unique: true })` (calqué sur `OrgProfile`).
  - `plans.service.ts` — `listActive()`, `create(dto)`, `update(code, dto)`, `deactivate(code)`, `seed()` (upsert idempotent).
  - `plans.controller.ts` — `@Controller('billing')` : `@AllowUnverified() @Get('plans')` (consultation tenant).
  - `admin-plans.controller.ts` — `@Roles(Role.PLATFORM_ADMIN) @Controller('admin/billing/plans')` : `POST` / `PATCH :code` / `PATCH :code/deactivate` (patron `AdminController`).
  - `dto/` — `PlanResponseDto`, `CreatePlanDto`, `UpdatePlanDto` (class-validator, Swagger `@ApiProperty`).
  - `plans.seed.ts` — jeu initial (upsert `$setOnInsert` par `code`).
- **Enum** `BillingInterval` (`MONTHLY` | `ANNUAL`) : `src/common/enums/billing-interval.enum.ts`.

### Schéma `Plan` (indicatif)
```ts
@Schema({ timestamps: true, collection: 'plans' })
class Plan {
  @Prop({ required: true, unique: true }) code!: string;          // slug, ex. 'starter-monthly'
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, min: 0 }) amount!: number;             // XOF, entier (pas de sous-unité)
  @Prop({ default: 'XOF' }) currency!: string;
  @Prop({ type: String, enum: BillingInterval }) interval!: BillingInterval;
  @Prop({ type: Object, default: {} }) limits!: Record<string, number>; // ex. { maxUsers, maxBilans }
  @Prop({ default: true }) active!: boolean;
}
```

### Décisions & cohérence
- **Consultation ≠ paiement** : `GET /billing/plans` est **relying party** (`@AllowUnverified`, pas de `@RequiresKycApproved`) — la grille tarifaire doit être visible tôt. Le verrou KYC ne s'applique qu'au **checkout** (Module 2, `paiement-service`).
- **Monnaie XOF** : montant **entier** (le franc CFA n'a pas de sous-unité) — pas de conversion en centimes, contrairement aux intégrations EUR/USD habituelles. Documenter pour éviter un facteur ×100 erroné côté paiement.
- **Soft-deactivation, jamais de hard-delete** : un plan retiré reste en base (`active=false`) pour que toute souscription conserve une référence stable — c'est la traduction concrète du critère PRD « sans affecter les abonnements en cours ».
- **Seed vs source de vérité** : le seed **amorce** (`$setOnInsert`) mais l'admin **prime** (les montants réels seront fixés avant la prod — question ouverte #1). Ne jamais réécrire un plan existant au boot.
- **Propriété de la donnée** : `expert-comptable` est la **source de vérité** des plans (FR-008). Leur mise à disposition de `paiement-service` (event/read-model) est un point d'intégration **Module 2** — à cadrer au PRD paiement, hors de cette story.

### Edge cases
- `GET /billing/plans` alors qu'aucun plan actif n'existe → **200 + liste vide** (pas d'erreur).
- `PATCH …/:code/deactivate` sur un plan déjà inactif → **idempotent** (no-op, 200), pas de 409.
- Réactivation d'un plan désactivé (`PATCH …/:code` avec `active=true`) → réapparaît dans la liste (autorisé).
- Tentative de suppression physique → **non exposée** (aucun `DELETE`) : le contrat est la désactivation.
- Concurrence : upsert par `code` (index unique) — un rejeu de seed concurrent au démarrage ne crée pas de doublon (l'index unique tranche).

---

## Dependencies

**Prerequisite Stories (toutes done) :**
- STORY-030 : cutover *relying party* (chaîne de guards, `@Roles`, `@AllowUnverified`) — socle des contrôleurs.
- STORY-014 : `TenantStateGuard` + placeholder abonnement (`subscriptionActive: false`) que ce catalogue viendra alimenter en Module 2.
- STORY-007 : squelette module admin (`@Roles(PLATFORM_ADMIN)`) — patron du contrôleur d'administration des plans.

**Débloque :**
- **STORY-016 → 019** (`paiement-service`, Module 2) : le checkout consomme le catalogue de plans (choix d'un plan actif → transaction FedaPay).
- Enforcement du palier **abonnement** dans `TenantStateGuard` (`SUBSCRIPTION_REQUIRED`, EPIC-004/Module 2).

**Dépendance aval (à ne pas oublier) :** exposition des plans à `paiement-service` (event `plan.changed` / read-model ou lecture API) — à cadrer au **PRD paiement** (Module 2).

**Dépendances externes :** aucune pour cette story (FedaPay n'intervient qu'au checkout, Module 2). La **tarification définitive** (question ouverte PRD #1) est requise avant **mise en production**, pas avant développement.

---

## Definition of Done

- [ ] Modèle `Plan` + module `billing` implémentés (schéma, service, DTO, enum `BillingInterval`)
- [ ] `GET /billing/plans` (actifs, `@AllowUnverified`, pas de gate KYC) livré
- [ ] CRUD admin (`POST` / `PATCH` / désactivation, `@Roles(PLATFORM_ADMIN)`) livré — modification à chaud, sans redéploiement
- [ ] Seed idempotent (upsert par `code`, `$setOnInsert`) — aucun plan codé en dur
- [ ] Désactivation soft (jamais de hard-delete) : plan retiré de la liste, référence conservée
- [ ] Tests unitaires (service + DTO) et e2e (consultation + CRUD admin + RBAC 401/403/404/409)
- [ ] Lint 0 warning ; seuils Jest 65/90/90/90 tenus
- [ ] **Vérification docker bout-en-bout** réalisée sur la stack racine
- [ ] Critères d'acceptation validés ; `sprint-status.yaml` mis à jour
- [ ] `/code-review` formel passé
- [ ] Commit/push branche `MNV-015` **sur demande explicite** (une branche par story)

---

## Story Points Breakdown

- **Backend (schéma `Plan` + `GET /billing/plans` + seed idempotent) :** 1 point
- **Backend (CRUD admin + désactivation soft + validation) + tests + vérif docker :** 1 point
- **Total :** 2 points

**Rationale :** périmètre volontairement **mince** — une collection possédée, un endpoint de lecture et un CRUD admin simple, sans logique métier complexe (aucun paiement, aucun événement, aucune machine à états). Tout le lourd de l'EPIC-004 (checkout FedaPay, webhooks idempotents, cycle de vie) est parti en `paiement-service` (Module 2). Le coût réel est la mise en place du module + les tests, d'où l'estimation basse.

---

## Additional Notes

- **Traçabilité :** FR-008 (catalogue de plans). FR-009 → FR-011 (checkout/webhooks/cycle de vie) **restent la source de vérité d'`expert-comptable`** au niveau PRD, mais leur **implémentation** est déléguée à `paiement-service` (Module 2, PA-1).
- **Clôture sprint 6 :** STORY-021/013/014 (KYC event-driven de bout en bout) sont *done* ; cette story **termine le sprint 6** avant l'attaque du socle catalog (sprint 7, STORY-031).
- **Ne pas anticiper le paiement** : la tentation serait d'ajouter ici un embryon de souscription — à proscrire, la propriété est côté `paiement-service`. Cette story se limite à la **donnée « plan »** et à sa gouvernance.

---

## Progress Tracking

**Status History:**
- 2026-07-13 : Créée par vivian (Scrum Master)
- 2026-07-13 : Implémentée + vérifiée docker bout-en-bout (Developer)

**Actual Effort:** 2 points (conforme à l'estimation)

**Implementation Notes:**
- **Nouveau module `billing`** (`src/modules/billing/`, câblé dans `app.module.ts`) : collection possédée `Plan` (`plans`) — `code` unique, `name`, `amount` (XOF **entier**), `currency` (défaut `XOF`), `interval` (`BillingInterval` MONTHLY/ANNUAL), `limits` (`Record<string,number>`), `active`. Enum neutre `BillingInterval` dans `common/enums`.
- **Consultation** : `GET /billing/plans` (`PlansController`, `@AllowUnverified`, **pas** de `@RequiresKycApproved`) → plans **actifs** triés par montant, projetés via `PlanResponseDto.from` (aucun `_id`/`__v`).
- **Gestion admin** : `AdminPlansController` (`@Roles(PLATFORM_ADMIN)`, `/admin/billing/plans`) — `GET` (tous), `POST` (201 ; **409** sur doublon détecté via index unique `E11000`, sans course), `PATCH :code` (200/404), `PATCH :code/deactivate` (soft, 200/404, idempotent). **Aucun `DELETE`** — retrait = désactivation (référence stable).
- **Seed idempotent** : `PlansSeeder` (`OnApplicationBootstrap`, sous `seeds/` → exclu coverage) → `PlansService.seedDefaults` (upsert `$setOnInsert` par `code`). 3 plans d'amorce (valeurs de travail ; tarif définitif = question ouverte PRD #1).
- **Tests** : lint 0, build OK, **158 unit** (billing 100 % b/f/l/s : service, 2 controllers, DTO) + **38 e2e** (dont `billing-plans.e2e` : 401 / actifs projetés / `@AllowUnverified` / 403 RBAC / 201 / 409 / 400 validation+`forbidNonWhitelisted` / 404 / désactivation retire de la liste). Seuils Jest 65/90/90/90 tenus.
- **Vérif docker** (stack racine auth-service + EC + mongo rs0 + kafka + redis + mailhog) : bootstrap EC → « Catalogue de plans amorcé (3 plan(s)) » ; login `PLATFORM_ADMIN` (auth-service RS256, `aud=[expert-comptable,kyc-service]`) → `GET /billing/plans` = 3 plans seedés (montants XOF entiers) ; 401 sans token ; POST→201, doublon→409, montant<0→400, champ inconnu→400 ; deactivate→200 puis absent ; PATCH montant 15000→20000→200 ; PATCH inconnu→404 ; **restart EC → re-seed sans doublon (0 doublon) ET valeurs admin préservées** (`starter=20000` non réécrit, `pro-annuel` resté inactif) → idempotence `$setOnInsert` prouvée. Catalogue de dev restauré aux 3 plans canoniques.
- **Reste** : `/code-review` formel + commit/push branche `MNV-015` **sur demande explicite**.

---

**This story was created using BMAD Method v6 - Phase 4 (Implementation Planning)**
