# STORY-058 : Surcharges de mapping par organisation (proposé → validé, tracé) + application prioritaire dans la résolution — FR-008

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service)
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-008 (ajustements de mapping par l'org : `(orgId, compte) → poste`, sans modifier le référentiel packagé, proposé/validé, journalisé)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel ; CLAUDE.md §Anti-énumération, §TenantScopedRepository, §Transactions Mongo
**Réf. code livré :** STORY-055 (`TableDePassageService.mapComptes` **pur** ; `BilanEngineService.rattacherComptes(orgId, comptes)` **org-aware**) · STORY-010/NFR-002 (`TenantScopedRepository` fail-closed) · STORY-037 (`@RequiresBilanAccess`)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done ✅ (implémentée + vérifiée docker mongosh + revue + intégrée dans `dev` le 2026-07-18 — PR #9 bilan-service, MNV-058 rebase-merge) — 🏁 **EPIC-010 CLOS**
**Assigné à :** vivian
**Créée :** 2026-07-18
**Sprint :** 11

---

## User Story

**En tant qu'**administrateur d'une organisation (cabinet / entreprise),
**je veux** pouvoir **surcharger localement** le rattachement d'un compte à un poste d'état (cas particulier propre à mon plan interne), via une **proposition validée par un humain** et **tracée**,
**afin que** la table de passage du référentiel packagé soit **respectée par défaut** mais **ajustable** au cas par cas, **sans jamais modifier le référentiel partagé**.

---

## Description

### Contexte & re-cadrage (⚠️ lire avant de coder)

STORY-058 est la **1ʳᵉ story d'EPIC-010 qui écrit en base** (056/057 = artefacts embarqués). Elle s'appuie sur deux acquis :

- `TableDePassageService.mapComptes(comptes, pkg)` (055) est **pur** (aucune I/O) et rattache par **longest-prefix** sur `pkg.tableDePassage`.
- `BilanEngineService.rattacherComptes(orgId, comptes)` (055) est **déjà org-aware** (il résout le référentiel de l'org, garde ACTIVE incluse) — c'est **le** point d'injection naturel des surcharges.

Le delta 058 = une **collection tenant-scoped de surcharges** `(orgId, compte) → poste` avec **workflow proposé → validé** et **journal d'audit**, **appliquée en priorité** sur la table de passage packagée lors de la résolution — le référentiel embarqué restant **immuable**.

### Problème résolu

La table de passage packagée est **générale** (préfixes SYSCOHADA standard). Une org peut avoir un compte au comportement **atypique** (un sous-compte tiers rattaché à un poste inhabituel). Sans surcharge, elle devrait attendre une nouvelle version de référentiel. FR-008 permet un ajustement **local, tracé et réversible**, sans polluer le paquet partagé (ni le fork de code).

### Modèle : proposé → validé (l'humain tranche)

Une surcharge naît **PROPOSED** (quiconque du tenant peut proposer) et n'est **appliquée** qu'une fois **VALIDATED** (un `TENANT_ADMIN` valide). Toute transition est **journalisée** (auteur, date, ancien poste → nouveau poste). Une surcharge peut être **REJECTED** ou **retirée** (soft). **Une seule** surcharge **VALIDATED active** par `(orgId, compte)` (l'index unique est le vrai filet — `E11000` → message générique).

---

## Scope

**Dans le périmètre :**

- Schéma Mongo **tenant-scoped** `MappingOverride` : `{ tenantId, compte, cible:{ etat, poste }, statut, proposePar, proposeAt, validePar?, valideAt?, ancienPoste?, motif? }`, keyé `tenantId` ; **index unique** `(tenantId, compte)` **parmi les actives** (une surcharge VALIDATED active max par compte).
- Repository via `TenantScopedRepository` (fail-closed, fusion `{ tenantId }`).
- Endpoints **gardés** (`@RequiresBilanAccess` + `@Roles`), sous `POST/GET /bilan/mapping-overrides` :
  - `POST /bilan/mapping-overrides` — **proposer** (statut `PROPOSED`) — `TENANT_ADMIN`/`TENANT_USER` — 201.
  - `POST /bilan/mapping-overrides/:id/valider` — **valider** (`PROPOSED → VALIDATED`, écrit `validePar/valideAt`, capture `ancienPoste` = rattachement référentiel courant) — `TENANT_ADMIN` — 200.
  - `POST /bilan/mapping-overrides/:id/rejeter` — **rejeter** (`PROPOSED → REJECTED`) — `TENANT_ADMIN` — 200.
  - `GET /bilan/mapping-overrides` — **lister** les surcharges de l'org (filtre `statut` optionnel) — 200.
- **Application prioritaire** : `TableDePassageService.mapComptes(comptes, pkg, surcharges?)` — pour chaque compte, une surcharge **VALIDATED** l'emporte sur la table packagée ; sinon longest-prefix inchangé. `BilanEngineService.rattacherComptes` charge les surcharges VALIDATED de l'org et les passe au service. **Traçabilité** : chaque rattachement porte sa `source` (`referentiel` | `surcharge`).
- **Validation de cohérence** : la `cible.poste` d'une surcharge doit **exister** dans les `postes` du référentiel de l'org (sinon 400/422 — on ne surcharge pas vers un poste inconnu).
- **Anti-énumération** : surcharge d'un autre tenant → **404** (jamais 403) ; `E11000` → message générique.
- **Docker `mongosh`** (persistance réelle — obligatoire).

**Hors périmètre (hooks inertes / autres) :**

- **Calcul de solde** / ventilation classes 4/5 (EPIC-011) : 058 rattache, ne calcule pas.
- **Application** des surcharges à la **production d'états** réelle (EPIC-011) : ici la preuve passe par le diagnostic `dry-run` (055) qui reflète déjà la résolution.
- Import de balance (EPIC-009), historique/versioning de surcharges au-delà du soft-reject, surcharges au niveau **référentiel** (c'est un ajustement **org**, jamais le paquet partagé — invariant FR-008).
- Événement Kafka (aucune diffusion inter-services d'une surcharge locale).

---

## User Flow

1. Un `TENANT_USER` **propose** une surcharge : `compte "476200" → { etat:"BILAN_PASSIF", poste:"DK" }` → `PROPOSED` (201).
2. Un `TENANT_ADMIN` **valide** : le service **capture l'ancien rattachement** (via la table packagée) comme `ancienPoste`, écrit `validePar/valideAt`, passe `VALIDATED` (200). L'index unique interdit une 2ᵉ VALIDATED active sur le même compte.
3. À la **résolution** (`dry-run` 055 ou EPIC-011), `mapComptes` applique la surcharge : `476200` est désormais rattaché à `BILAN_PASSIF/DK` avec `source:"surcharge"` ; les autres comptes suivent le référentiel (`source:"referentiel"`).
4. Le **journal** conserve auteur/date/ancien→nouveau. Une surcharge peut être **rejetée** (n'est plus appliquée).

---

## Acceptance Criteria

- [ ] **AC-1 — Proposer.** `POST /bilan/mapping-overrides` crée une surcharge `PROPOSED` scopée au tenant du JWT (jamais du corps) ; 201 ; `proposePar/proposeAt` renseignés.
- [ ] **AC-2 — Cohérence cible.** La `cible.poste` doit exister dans les `postes` du référentiel **ACTIVE** de l'org ; sinon **422** (`POSTE_INCONNU`), aucune écriture.
- [ ] **AC-3 — Valider (humain).** `POST /:id/valider` (TENANT_ADMIN) passe `PROPOSED → VALIDATED`, écrit `validePar/valideAt` **et** `ancienPoste` = rattachement référentiel courant du compte (traçabilité FR-008 AC-2) ; 200.
- [ ] **AC-4 — Unicité active.** Une 2ᵉ surcharge **VALIDATED** active sur le **même** `(tenantId, compte)` est refusée par **index unique** → `E11000` mappé en **409** générique (`SURCHARGE_EXISTE`), pas de fuite.
- [ ] **AC-5 — Rejeter.** `POST /:id/rejeter` (TENANT_ADMIN) passe `PROPOSED → REJECTED` ; une surcharge REJECTED **n'est jamais appliquée**.
- [ ] **AC-6 — Application prioritaire.** `TableDePassageService.mapComptes(comptes, pkg, surcharges)` : un compte avec surcharge VALIDATED est rattaché à **son** poste (`source:"surcharge"`) ; les autres suivent le référentiel (`source:"referentiel"`). Sans surcharge, le résultat est **identique** à 055 (non-régression).
- [ ] **AC-7 — Isolation tenant.** `GET /bilan/mapping-overrides` ne renvoie **que** les surcharges de l'org ; `valider/rejeter` l'`:id` d'un **autre** tenant → **404** (anti-énumération, jamais 403).
- [ ] **AC-8 — Le référentiel packagé n'est jamais modifié.** L'artefact/loader reste intact ; une surcharge est une donnée **org** distincte (FR-008 AC-1).
- [ ] **AC-9 — Journalisation.** Toute surcharge porte `proposePar/proposeAt` et, si validée, `validePar/valideAt` + `ancienPoste → cible.poste`.
- [ ] **AC-10 — Gate & RBAC.** Tous les endpoints derrière `@RequiresBilanAccess` (403 `{code}` : EMAIL_NOT_VERIFIED | KYC_NOT_APPROVED | BILAN_NOT_ENTITLED) ; `valider/rejeter` réservés `TENANT_ADMIN`.

---

## Technical Notes

### Schéma & repository

`src/modules/bilan/mapping-override/` (nouveau) :

```ts
enum SurchargeStatut { PROPOSED = 'PROPOSED', VALIDATED = 'VALIDATED', REJECTED = 'REJECTED' }

// MappingOverride (tenant-scoped)
{ tenantId: ObjectId; compte: string;               // ^\d[0-9A-Za-z]{1,19}$ (aligné 055/101)
  cible: { etat: string; poste: string };
  statut: SurchargeStatut;
  proposePar: ObjectId; proposeAt: Date;
  validePar?: ObjectId; valideAt?: Date;
  ancienPoste?: { etat: string; poste: string } | null;   // rattachement référentiel capturé à la validation
  motif?: string | null; }
```

- **Index unique partiel** `(tenantId, compte)` `where { statut: 'VALIDATED' }` → une seule surcharge active par compte (l'index est le vrai filet ; `E11000` → 409 générique).
- Repository **étend `TenantScopedRepository`** (fail-closed, force `tenantId`, cross-tenant impossible implicitement).

### Point d'injection (garder `mapComptes` pur)

Ne **pas** faire lire Mongo à `TableDePassageService` (il est **pur** — 055). Étendre sa signature : `mapComptes(comptes, pkg, surcharges?: Map<compte, PosteCible>)`. `surcharges` **absent/vide** ⇒ comportement **strictement** 055 (non-régression AC-6). `BilanEngineService.rattacherComptes(orgId, comptes)` charge les surcharges VALIDATED de l'org (repository), construit la `Map`, et l'injecte. La `source` (`referentiel`|`surcharge`) est ajoutée au type `PosteRattache`/`RattachementCompte` (traçabilité).

### Contrôleur

Nouveau `MappingOverrideController` (path `bilan`, version 1) **ou** extension du contrôleur bilan — **gardé** `@RequiresBilanAccess` + `@Roles`, `tenantObjectId(user)` (patron `bilan-diagnostics.controller.ts`), mapping erreurs typées → HTTP (jamais un 500 nu ; `E11000` → 409 générique ; autre tenant → `NotFoundException` 404).

### Transactions

La **validation** capture `ancienPoste` (lecture du référentiel) **puis** met à jour le statut : opération **mono-document** → pas de transaction multi-doc requise (cf. `transactions-mongo.md` : transaction obligatoire **dès que > 1 document** est écrit — ici 1 seul). La cohérence de l'unicité est portée par l'**index**, pas par une lecture-puis-écriture.

### Non-régression

- `TableDePassageService` (055) : signature étendue **rétro-compatible** (3ᵉ param optionnel) ; les tests 055 restent verts sans modification.
- `BilanDiagnosticsController` `dry-run` (055) : reflète désormais les surcharges VALIDATED (comportement voulu, à couvrir par un test dédié).

---

## Dependencies

**Prérequises (livrées) :** STORY-055 (mapping pur + `rattacherComptes` org-aware), STORY-054 (résolution référentiel + garde ACTIVE), STORY-010 (`TenantScopedRepository`), STORY-037 (`@RequiresBilanAccess`).
**Recommandée avant :** **STORY-056** mergée (postes du référentiel complets pour la validation de cible AC-2) — 058 branche sur `dev` à jour.
**Débloque :** EPIC-011 (production d'états respectant les surcharges).

---

## Definition of Done

- [ ] Code (branche `MNV-058`, rebasée sur `dev` à jour).
- [ ] **Lint 0 warning · build OK.**
- [ ] **Couverture ≥ 65 branches / 90 fonctions / 90 lignes / 90 statements** (schéma, repository, service, contrôleur, intégration mapping couverts).
- [ ] **Unit + e2e verts** (e2e = contrat HTTP mocké ; **ne prouve pas** la persistance).
- [ ] **AC-1 → AC-10** validés.
- [ ] **Non-régression** : tests 055 (mapping) verts sans modification ; `dry-run` sans surcharge = résultat 055.
- [ ] **Vérification docker RÉELLE `mongosh`** (obligatoire — 058 écrit en base) : proposer → doc `PROPOSED` en base (`bilan_service.mappingoverrides`, `tenantId` réel du JWT) ; valider → `VALIDATED` + `validePar/valideAt` + `ancienPoste` persistés ; 2ᵉ VALIDATED même compte → refus (**1 seul doc actif** en base, index unique présent) ; `dry-run` reflète la surcharge (`source:"surcharge"`) ; **isolation** : surcharge d'un tenant B invisible/inaccessible au tenant A (404) ; rejet → non appliqué ; aucun doc orphelin après refus 422/409. Consigné dans *Progress Tracking*.
- [ ] Endpoints documentés dans **Swagger** (`/api/docs`).
- [ ] Périmètre respecté (aucun calcul de solde, aucune modif du référentiel packagé, aucun événement Kafka).

---

## Story Points Breakdown

- **Backend (schéma + repository + workflow + endpoints) :** 1,5 pt.
- **Intégration mapping (injection surcharges, source, cohérence cible) :** 1 pt.
- **Tests (unit + e2e + docker `mongosh`) :** 0,5 pt.
- **Total : 3 points.**

**Rationale :** feature CRUD tenant-scoped avec workflow simple (mono-document, index comme filet) + point d'injection déjà préparé par 055 (`rattacherComptes` org-aware). Should Have — l'unicité et l'isolation sont les vrais risques, portés par l'index + `TenantScopedRepository`.

---

## Additional Notes

- **Clôture EPIC-010** : avec 056 (plan de comptes SYSCOHADA) + 057 (SFD-BCEAO) + 058 (surcharges org), l'epic « Référentiels & table de passage » est complet (FR-005 chargement ✓ 054, FR-006 mapping ✓ 055, FR-007 multi-référentiel ✓ 056/057, FR-008 surcharges ✓ 058) → **débloque EPIC-011** (production de la liasse). Ajouter le jalon 🏁 à la clôture.
- Résister à câbler la production d'états ici : 058 s'arrête à la **résolution** (rattachement), le calcul reste EPIC-011.

---

## Progress Tracking

**Status History :**
- 2026-07-18 : Créée (1ʳᵉ story EPIC-010 avec persistance) par vivian (Scrum Master).
- 2026-07-18 : Implémentée + livrée (branche `MNV-058`, PR #9) — `defined → done`. 🏁 EPIC-010 clos.

**Implémentation :** module `mapping-override` (schéma tenant-scoped `mapping_overrides` + repository `TenantScopedRepository`, service workflow PROPOSED→VALIDATED→REJECTED, contrôleur gardé, DTOs). `TableDePassageService.mapComptes(comptes, pkg, surcharges?)` — 3ᵉ param optionnel (service **pur**, non-régression 055) ; `PosteRattache.source` = `referentiel|surcharge` ; `BilanEngineService.rattacherComptes` injecte les VALIDATED. Index unique **partiel** `(tenantId,compte) where VALIDATED`. Mapping erreurs référentiel→HTTP extrait en `referentiel-http.mapper` (partagé, altitude). Garde `orNotFound` (revue).

**Vérification docker mongosh RÉELLE (org enregistrée + read-models semés) :**
- propose `521000 → BILAN_PASSIF/CA` → **201 PROPOSED** persisté (`tenantId`/`proposePar`/`cible`/`motif`) ; cible `ZZ` inconnue → **422 POSTE_INCONNU** (aucune écriture).
- valider → **200 VALIDATED** + `validePar`/`valideAt` + **`ancienPoste={BILAN_ACTIF/BS}`** (vrai rattachement référentiel de 521000 capturé).
- **dry-run applique** : `521000→BILAN_PASSIF/CA source=surcharge` (l'emporte sur le référentiel `BS`), `601000→source=referentiel`.
- **unicité** : 2ᵉ VALIDATED même compte → **409 SURCHARGE_EXISTE**, `count VALIDATED=1` (index partiel).
- **isolation** : org2 ne voit pas org1 (`[]`) ; valider l'id de org1 depuis org2 → **404** (anti-énum). reject → **REJECTED**.
- Référentiel packagé jamais modifié (surcharge = collection distincte).

**Revue** `/code-review high` : 1 constat (cast `updateOne` null → 500 possible) **corrigé** (garde `orNotFound` → 404) ; 1 note efficacité (requête surcharges systématique) acceptée.

**Qualité :** lint 0 · build OK · **198 unit (30 suites) + 35 e2e (5 suites)** · couverture 98.95/89.23/98.48/98.85 > seuils (module mapping-override **100 %**).

**Actual Effort :** 3 points (conforme).

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
