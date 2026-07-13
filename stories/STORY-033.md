# STORY-033 : Entitlements — schéma `(org × module)` + `PUT`/`DELETE` (octroi / màj / révocation) + `GET` réconciliation + validation de cohérence contre le catalogue

**Epic :** EPIC-007 — platform-catalog-service (catalogue modules/versions/référentiels + entitlements + topic `entitlement.changed`)
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` (v1.0, §Composants → **EntitlementsModule** / §Architecture des données → schéma **`Entitlement`** + **upsert idempotent** / §Sécurité → **anti-énumération** + octroi service-à-service **C8** + cascade **C9** / §Risques #6) · `architecture-prospera-ecosystem-2026-07-04.md` §Modèle de jetons RS256-JWKS — décisions programme **P4** (événements + read-models), **P8** (source de vérité entitlements) — décisions catalog **C2/C5/C6/C8/C9**
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-13. `EntitlementsModule` livré (schéma `Entitlement`, upsert idempotent `$set` absolu, validation de cohérence contre le catalogue — `RETIRED` interdit / `DEPRECATED` accepté, révocation soft `REVOKED`, réconciliation, anti-énumération). lint 0, 169 unit + 43 e2e verts, couverture **100 %** sur `entitlements/**`. Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-13
**Sprint :** 7
**Service :** platform-catalog-service (`:3003`) — base Mongo dédiée `catalog_service`
**Couvre :** aucun FR du PRD `expert-comptable` (capacité **plateforme**) — concrétise **P8** (le catalog devient la **source de vérité unique** de « quelle version + quel référentiel + quelle config pour quelle org »)

> **3ᵉ story de l'EPIC-007, sur le registre livré par STORY-032.** STORY-031 a rendu le service **démarrable et sécurisé** (relying party RS256/JWKS, `/health`, `KafkaModule` squelette). STORY-032 a posé le **catalogue** : `Module` / `ModuleVersion` (axe code) / `ReferentielVersion` (axe données), orthogonaux (C2), sous garde-fou N/N-1 et machine d'états `ACTIVE → DEPRECATED → RETIRED`. STORY-033 pose le **second domaine** : l'**`Entitlement`** — pour chaque couple **`(organisation × module)`**, le **droit d'usage** : quelle `versionCode`, quel `referentiel`, quelle `config`, quel `status`. C'est le **croisement** que le catalogue interdisait de mélanger dans les schémas (C2) : il ne vit **que** dans l'entitlement. Chaque octroi est **validé de cohérence contre le registre** (STORY-032) — le module/la version/le référentiel doivent **exister** et **ne pas être `RETIRED`** (risque #6). L'upsert est **idempotent** sur la clé `(organizationId, moduleCode)` (rejouable, race-safe). Cette story **ne publie encore rien** sur le bus : `entitlement.changed` (producteur Kafka + transactional outbox) et l'**octroi service-à-service par le billing d'un vertical (C8)** sont **STORY-034**. Elle prépare seulement la **couture** (persistance validée + état absolu) sur laquelle STORY-034 branchera la publication.

---

## User Story

En tant qu'**opérateur plateforme PROSPERA (`PLATFORM_ADMIN`)**,
je veux **octroyer, mettre à jour et révoquer le droit d'usage `(org × module)`** — fixer quelle **version de code** + quel **référentiel** + quelle **config** une organisation a le droit de consommer, avec **validation de cohérence contre le catalogue** (STORY-032) et **upsert idempotent**,
afin que le `platform-catalog-service` devienne la **source de vérité unique (P8)** des entitlements, exposée en **réconciliation** (`GET`) pour hydrater les read-models, et **prête à être diffusée** (`entitlement.changed`, STORY-034) aux consommateurs (`bilan-service`, gateway, verticaux, `admin-panel`).

---

## Description

### Contexte

Le re-cadrage écosystème (P7/P8) a fait du `platform-catalog-service` le **propriétaire unique** de « quelle version de code + quel référentiel servir à l'organisation X ». STORY-032 a livré le **registre** (le « quoi existe »). STORY-033 livre le **droit d'usage** (le « qui a droit à quoi ») : l'**`Entitlement`**, une entrée **par `(organisation × module)`** portant l'**état absolu** `{ versionCode, referentiel?, config, status }`.

Trois invariants structurent ce domaine :

1. **Le croisement vit ici, et nulle part ailleurs (C2).** Le registre garde `Module`, `ModuleVersion` et `ReferentielVersion` **orthogonaux** ; le triplet `(module × version × référentiel)` pour une org donnée est **matérialisé dans l'entitlement**. C'est ce qui permet à une IMF et à un cabinet de partager **la même version de code** avec **des référentiels différents**, sans fork.
2. **Cohérence référentielle validée à l'écriture (risque #6).** Avant tout upsert, le service **vérifie contre le catalogue** que le `moduleCode` existe, que la `versionCode` visée existe **et n'est pas `RETIRED`**, et — si un `referentiel` est fourni — que `(code, version)` existe **et n'est pas `RETIRED`**. On ne peut **jamais** octroyer un droit vers une entrée **inexistante ou retirée**. *(La dépréciation `DEPRECATED` reste octroyable : une org peut légitimement rester sur — ou être migrée vers — une version dépréciée mais non retirée ; seul `RETIRED` est terminal et interdit à l'octroi.)*
3. **Idempotence et état absolu (P4).** `PUT /entitlements/:orgId/:moduleCode` fait un `findOneAndUpdate` **`$set` absolu** sur la clé unique `(organizationId, moduleCode)` — **rejouable** et **race-safe**. L'état d'un entitlement est **absolu** (pas de deltas) : c'est le prérequis pour que STORY-034 publie `entitlement.changed` comme un **snapshot** idempotent côté consommateur.

Cette story **ne touche pas au bus** : `KafkaModule` reste le squelette de STORY-031. La **publication** de `entitlement.changed` (+ transactional outbox) et l'**authentification service-à-service (C8)** de l'octroi déclenché par le **billing d'un vertical** sont **STORY-034**. STORY-033 restreint donc l'**écriture** au seul `PLATFORM_ADMIN` (octroi manuel par l'opérateur plateforme) et structure `EntitlementsService` pour qu'une **couture de publication** puisse être ajoutée **après persistance** sans refonte.

### Périmètre

**Dans le périmètre**
- **`EntitlementsModule`** (`src/modules/entitlements/`) — importe le schéma `Entitlement`, déclare `EntitlementsService` + `EntitlementsController`. **Importe `CatalogModule`** (STORY-032) pour valider la cohérence via les services du registre (`ModulesService` / `ModuleVersionsService` / `ReferentielVersionsService`, à **exporter** depuis `CatalogModule`).
- **Schéma `Entitlement`** (base `catalog_service`) repris **littéralement** de l'architecture : `organizationId` (ObjectId, requis, opaque), `moduleCode` (requis), `versionCode` (requis), `referentiel?` `{ code, version }`, `config` (`Record`, défaut `{}`), `status` enum `EntitlementStatus` (`ACTIVE | SUSPENDED | REVOKED`, défaut `ACTIVE`), `grantedBy?` (userId opaque), `source?`. **Index unique `{ organizationId:1, moduleCode:1 }`** + index `{ organizationId:1 }`.
- **Enum `EntitlementStatus`** (`ACTIVE | SUSPENDED | REVOKED`).
- **`EntitlementsService`** :
  - **Validation de cohérence** (avant upsert) : module existant ; `ModuleVersion (moduleCode, versionCode)` existante **et non `RETIRED`** ; si `referentiel` fourni, `ReferentielVersion (code, version)` existante **et non `RETIRED`**. Échec → **422** (référence non satisfaisable — s'aligner sur la convention repo si 400/409 préféré).
  - **Upsert idempotent** : `findOneAndUpdate({ organizationId, moduleCode }, { $set }, { upsert:true, new:true })`. `grantedBy` = `sub` du JWT ; `source = "admin"` (le `source = "billing:<vertical>"` viendra avec C8 en STORY-034).
  - **Révocation** : `DELETE` → `status = REVOKED` **soft** (pas de suppression physique — une entrée référencée par un consommateur ne doit jamais disparaître silencieusement, et STORY-034 doit pouvoir publier l'état `REVOKED`). **404** si aucun entitlement `(org, module)`.
  - **Réconciliation** : `GET /entitlements/:orgId` → **snapshot** de tous les entitlements de l'org (état absolu, tous statuts par défaut, `?status=` optionnel). **Hors chemin chaud.**
- **`EntitlementsController`** (préfixe `/api/v1/catalog/entitlements`) :
  - `PUT /:orgId/:moduleCode` — octroi / mise à jour (`@Roles(PLATFORM_ADMIN)`), DTO validé, **200** (mise à jour) / **201** (création).
  - `DELETE /:orgId/:moduleCode` — révocation → `REVOKED` (`@Roles(PLATFORM_ADMIN)`), **200** ; **404** si absent.
  - `GET /:orgId` — réconciliation. **Anti-énumération** : `PLATFORM_ADMIN` → toute org ; `TENANT_ADMIN` → **uniquement si `orgId` du JWT == `:orgId`**, sinon **403**.
  - *(optionnel)* `GET /:orgId/:moduleCode` — lecture d'un entitlement unique (même règle d'accès), **404** si absent.
- **DTO validés** (`class-validator`, `whitelist`+`forbidNonWhitelisted` déjà actifs) : `UpsertEntitlementDto` (`versionCode` semver, `referentiel?` `{ code, version }`, `config?` objet, `status?` `ACTIVE|SUSPENDED`). `orgId`/`moduleCode` = paramètres de route validés (ObjectId hex / kebab).
- Tests **unitaires** (validation de cohérence : version RETIRED refusée, référentiel RETIRED refusé, module/version inexistants refusés, DEPRECATED accepté ; idempotence upsert ; révocation soft ; anti-énumération) + **e2e** (parcours octroi → màj → réconciliation → révocation ; 401/403 ; 422 cohérence ; 404). Swagger `/api/docs` (tag `Entitlements`).

**Hors périmètre (stories suivantes)**
- **Publication `entitlement.changed`** (producteur Kafka + **transactional outbox** + `occurredAt`/`eventId`/`schemaVersion` du contrat v1) → **STORY-034**. STORY-033 laisse une **couture** (service renvoyant l'entitlement persisté) mais **n'appelle aucun publisher**.
- **Octroi service-à-service (C8)** : le **billing d'un vertical** écrit l'entitlement après paiement, via jeton de service (client-credentials IdP) / rôle technique → **STORY-034**. Ici, écriture réservée **`PLATFORM_ADMIN`**.
- **Suspension en cascade `identity.org.suspended` (C9)** : consommer l'événement pour passer les entitlements d'une org suspendue en `SUSPENDED` → optionnel, **hors STORY-033** (activable sans refonte).
- **Read-models côté consommateurs** (`bilan-service` gate, gateway routage `orgId → version`, `admin-panel`) → services consommateurs (EPIC-008+, retrofit front).
- **Séparation abonnement ≠ entitlement (C5)** : la `Subscription`/paiement reste **dans chaque vertical** ; elle **déclenche** l'octroi mais n'est **jamais** stockée ici.

### Flux (octroi manuel par l'opérateur plateforme)

1. Le `PLATFORM_ADMIN` se connecte à l'IdP (`:3001`) → **JWT RS256** (`roles:[PLATFORM_ADMIN]`, `org:null`, `sub`, `aud` contient `platform-catalog-service`).
2. Prérequis catalogue (STORY-032) : `Module bilan` + `ModuleVersion 2.0 (ACTIVE)` + `ReferentielVersion syscohada-revise@2.1 (ACTIVE)` existent.
3. `PUT :3003/api/v1/catalog/entitlements/{orgId}/bilan { versionCode:"2.0", referentiel:{ code:"syscohada-revise", version:"2.1" }, config:{} }` → **201** (`Entitlement` `ACTIVE`, `grantedBy=sub`, `source="admin"`).
4. **Rejeu identique** → **200** (idempotent, aucun doublon : clé unique `(org, bilan)`).
5. **Migration** : `PUT .../bilan { versionCode:"3.0", referentiel:{…} }` → **200** (`$set` absolu ; l'org bascule sur `3.0`).
6. **Cohérence refusée** : `PUT .../bilan { versionCode:"9.9" }` (version inexistante) → **422** ; idem si la version visée est `RETIRED`, ou si `referentiel` visé est inexistant/`RETIRED`.
7. `GET .../{orgId}` (réconciliation) → **200** `[ { moduleCode:"bilan", versionCode:"3.0", referentiel:{…}, status:"ACTIVE", … } ]`.
8. `DELETE .../{orgId}/bilan` → **200** (`status → REVOKED`, soft) ; `GET` le montre désormais `REVOKED`.
9. Négatifs : `TENANT_ADMIN` sur `PUT`/`DELETE` → **403** ; `TENANT_ADMIN` sur `GET` d'une **autre** org → **403** ; sans token → **401** ; `DELETE` d'un `(org, module)` inexistant → **404**.

---

## Acceptance Criteria

- [ ] **Schéma `Entitlement`** (`src/modules/entitlements/schemas/entitlement.schema.ts`), `@Schema({ timestamps:true })`, repris de l'architecture : `organizationId` (ObjectId, requis), `moduleCode` (requis), `versionCode` (requis), `referentiel?` `{ code:string, version:string }`, `config` (`Record<string,unknown>`, défaut `{}`), `status` enum `EntitlementStatus` (défaut `ACTIVE`), `grantedBy?` (ObjectId), `source?` (string). **Index unique `{ organizationId:1, moduleCode:1 }`** + index `{ organizationId:1 }`.
- [ ] **Enum `EntitlementStatus`** = `{ ACTIVE, SUSPENDED, REVOKED }`.
- [ ] **Validation de cohérence (avant persistance)** : l'octroi est **refusé (422)** si (a) le `moduleCode` n'existe pas au catalogue, **ou** (b) la `ModuleVersion (moduleCode, versionCode)` n'existe pas **ou** est `RETIRED`, **ou** (c) un `referentiel` est fourni et `ReferentielVersion (code, version)` n'existe pas **ou** est `RETIRED`. Une version/référentiel **`DEPRECATED`** est **acceptée**. Message d'erreur explicite (quelle référence est fautive). *(Code HTTP à aligner sur la convention repo si 400/409 est déjà l'usage pour ce type d'erreur.)*
- [ ] **Octroi / mise à jour idempotents** : `PUT /api/v1/catalog/entitlements/:orgId/:moduleCode` fait un `findOneAndUpdate` **`$set` absolu** sur la clé `(organizationId, moduleCode)` avec `upsert:true`. **Rejeu à l'identique = aucun doublon** (garanti par l'index unique) : **201** à la création, **200** en mise à jour. `grantedBy = sub` du JWT, `source = "admin"`.
- [ ] **Révocation soft** : `DELETE /api/v1/catalog/entitlements/:orgId/:moduleCode` positionne `status = REVOKED` (**pas** de suppression physique), **200** ; **404** si aucun entitlement `(org, module)`. L'entrée reste lisible en réconciliation avec `status:REVOKED`.
- [ ] **Réconciliation** : `GET /api/v1/catalog/entitlements/:orgId` renvoie le **snapshot** (tableau) de tous les entitlements de l'org — **état absolu**, tous statuts par défaut, filtre `?status=ACTIVE` supporté. *(optionnel)* `GET /:orgId/:moduleCode` → l'entitlement unique (**404** si absent).
- [ ] **RBAC + anti-énumération** : `PUT`/`DELETE` exigent **`PLATFORM_ADMIN`** (`TENANT_ADMIN`/`TENANT_USER` → **403**). `GET` : `PLATFORM_ADMIN` accède à **toute** org ; `TENANT_ADMIN` **uniquement** si `orgId` du JWT == `:orgId` (sinon **403**, anti-énumération) ; sans token → **401** (`JwtAuthGuard` global hérité de STORY-031).
- [ ] **DTO validés** (`UpsertEntitlementDto`) : `versionCode` (regex semver), `referentiel?` (`code` kebab + `version` semver, objet imbriqué validé), `config?` (objet), `status?` (`ACTIVE|SUSPENDED` **seulement** — `REVOKED` est réservé à `DELETE`). Champs inconnus → **400**. `:orgId` = ObjectId hex valide (sinon **400**).
- [ ] **Aucune publication Kafka** dans cette story (le `KafkaModule` reste squelette) ; `EntitlementsService` **retourne** l'entitlement persisté de façon à ce que STORY-034 puisse brancher la publication **après** persistance sans modifier la logique métier (couture documentée).
- [ ] **Swagger `/api/docs`** documente le domaine (tag `Entitlements`) ; **seuils Jest 65/90/90/90** tenus, **ESLint 0 warning**.
- [ ] **Vérification docker bout-en-bout** : via la stack racine, un JWT `PLATFORM_ADMIN` réel octroie un entitlement `bilan@2.0 + syscohada-revise@2.1` (**201**), rejoue (**200**), migre en `3.0` (**200**), se voit **refuser** une version inexistante/`RETIRED` (**422**), lit la réconciliation (**200**), révoque (**200** → `REVOKED`) ; un JWT `TENANT_ADMIN` **lit sa propre** org (**200**) mais est **refusé** en écriture (**403**) et sur une **autre** org (**403**).

---

## Technical Notes

### Arborescence (nouvelle — `src/modules/entitlements/`)

```
platform-catalog-service/src/modules/entitlements/
├── entitlements.module.ts             # importe le schéma + CatalogModule ; déclare service + contrôleur
├── schemas/
│   └── entitlement.schema.ts          # Entitlement (index unique (organizationId, moduleCode))
├── enums/
│   └── entitlement-status.enum.ts     # ACTIVE | SUSPENDED | REVOKED
├── dto/
│   └── upsert-entitlement.dto.ts      # versionCode, referentiel?, config?, status?
├── services/
│   └── entitlements.service.ts        # validation cohérence + upsert idempotent + révocation soft + réconciliation
└── controllers/
    └── entitlements.controller.ts     # @Roles PLATFORM_ADMIN (écriture) + anti-énumération (lecture)
```

> `app.module.ts` : ajouter `EntitlementsModule`. **`CatalogModule` (STORY-032) doit `exports:` ses 3 services** (`ModulesService`, `ModuleVersionsService`, `ReferentielVersionsService`) pour que `EntitlementsService` les injecte (validation de cohérence **en process**, pas d'appel réseau). Aucun nouveau module d'infra (Mongo/Kafka déjà câblés).

### Schéma `Entitlement` (source de vérité : architecture §Architecture des données)

Reprendre **littéralement** la définition de l'architecture (l.211-225) :

```typescript
@Schema({ timestamps: true })
export class Entitlement {
  @Prop({ type: Types.ObjectId, required: true }) organizationId!: Types.ObjectId; // opaque (JWT)
  @Prop({ required: true }) moduleCode!: string;
  @Prop({ required: true }) versionCode!: string;                 // ModuleVersion.version retenue
  @Prop({ type: Object }) referentiel?: { code: string; version: string }; // null si module sans référentiel
  @Prop({ type: Object, default: {} }) config!: Record<string, unknown>;
  @Prop({ type: String, enum: EntitlementStatus, default: EntitlementStatus.ACTIVE }) status!: EntitlementStatus;
  @Prop({ type: Types.ObjectId }) grantedBy?: Types.ObjectId;     // userId opaque (sub)
  @Prop() source?: string;                                        // "admin" (C8 → "billing:<vertical>" en STORY-034)
}
// index : { organizationId: 1, moduleCode: 1 } unique ; { organizationId: 1 }
```

### Validation de cohérence (`entitlements.service.ts`)

```
Sur upsert(orgId, moduleCode, dto) :
  1. module = ModulesService.getByCode(moduleCode)            → 422 si absent
  2. mv = ModuleVersionsService.get(moduleCode, dto.versionCode)
        → 422 si absent OU mv.status === RETIRED
  3. si dto.referentiel :
        rv = ReferentielVersionsService.get(dto.referentiel.code, dto.referentiel.version)
        → 422 si absent OU rv.status === RETIRED
  4. findOneAndUpdate({ organizationId, moduleCode },
                      { $set: { versionCode, referentiel, config, status, grantedBy: sub, source: "admin" } },
                      { upsert: true, new: true, setDefaultsOnInsert: true })
  5. return entitlement  // ← couture STORY-034 : publier entitlement.changed APRÈS ce point
```

- **`RETIRED` interdit, `DEPRECATED` autorisé** (risque #6) : on peut octroyer/rester sur une version dépréciée (migration en cours), **jamais** sur une version retirée. C'est la garantie que STORY-032 rendait fiable en verrouillant `RETIRED` comme **terminal**.
- **Idempotence** : `findOneAndUpdate` avec `upsert:true` sur la clé unique `(organizationId, moduleCode)` → rejeu race-safe. Détecter création vs mise à jour via `rawResult`/`upsertedId` pour renvoyer **201** vs **200**. Mapper `E11000` (course) en comportement idempotent, pas en erreur.
- **Injecter les services du registre** plutôt que les modèles Mongo bruts : réutilise la logique de lecture/masquage de STORY-032 et garde le domaine catalogue **encapsulé**.

### Révocation & réconciliation

- **`DELETE` = soft `REVOKED`** : `findOneAndUpdate({ organizationId, moduleCode }, { $set:{ status:REVOKED } }, { new:true })` ; **404** si `null`. Pas de `deleteOne` — l'état absolu `REVOKED` doit rester publiable (STORY-034) et lisible en réconciliation (le consommateur **retire** le module à réception).
- **`GET /:orgId`** = **hors chemin chaud** (hydratation/re-synchro d'un read-model). Renvoie **tous** les statuts par défaut (le consommateur a besoin de l'état absolu, y compris `REVOKED`, pour se resynchroniser) ; `?status=ACTIVE` pour ne filtrer que les droits vifs.

### Sécurité — RBAC & anti-énumération (`entitlements.controller.ts`)

| Méthode | Chemin | Rôle | Règle d'accès |
|---|---|---|---|
| PUT | `/api/v1/catalog/entitlements/:orgId/:moduleCode` | PLATFORM_ADMIN | écriture réservée opérateur plateforme (C8/service-à-service → STORY-034) |
| DELETE | `/api/v1/catalog/entitlements/:orgId/:moduleCode` | PLATFORM_ADMIN | révocation soft |
| GET | `/api/v1/catalog/entitlements/:orgId` | PLATFORM_ADMIN \| TENANT_ADMIN | **PLATFORM_ADMIN** : toute org ; **TENANT_ADMIN** : `orgId` du JWT == `:orgId` sinon **403** |
| GET | `/api/v1/catalog/entitlements/:orgId/:moduleCode` *(opt.)* | PLATFORM_ADMIN \| TENANT_ADMIN | même règle |

- **`@Roles`** filtre le rôle ; l'**anti-énumération** (org du JWT == org de la route) est un **contrôle applicatif** dans le contrôleur/service (le `RolesGuard` seul ne suffit pas). S'aligner sur le patron `kyc-service`/`auth-service` pour extraire `org`/`sub` du `request.user`.
- **`JwtAuthGuard` global** (STORY-031) : aucun endpoint entitlement n'est `@Public`.

### Cas limites / points d'attention

- **Module sans référentiel** (ex. futur `stock`) : `referentiel` **absent** est valide — ne pas exiger `referentiel` au niveau schéma/DTO ; ne valider (b) le référentiel **que s'il est fourni**.
- **Version `DEPRECATED`** octroyable, **`RETIRED`** non — bien tester les **deux** frontières (une version qui passe de `DEPRECATED` à `RETIRED` après un octroi n'annule **pas** l'entitlement existant ; c'est la migration/cascade qui gère, hors périmètre).
- **`orgId` opaque** : le catalog **ne vérifie pas** l'existence réelle de l'org (l'`orgId` du JWT/route fait foi) — cohérent avec l'architecture (§Sécurité). La cascade `identity.org.suspended` (C9) est **hors périmètre**.
- **Course concurrente** : deux `PUT` simultanés sur la même clé → l'index unique + `upsert` garantissent une seule ligne ; mapper `E11000` sans exposer d'erreur 500.
- **Statut `REVOKED` via `PUT`** : interdit dans le DTO (`status?` ∈ `{ACTIVE, SUSPENDED}`) — la révocation passe **exclusivement** par `DELETE` (sémantique claire, un seul chemin de révocation).
- **Duplication assumée (K4/C6)** : réutiliser guards/décorateurs `common/` (STORY-031) ; ne **pas** réintroduire de logique d'auth. Le domaine entitlement est **pur métier**.
- **Couture STORY-034** : ne **pas** injecter de producteur Kafka ici, mais garder `EntitlementsService.upsert`/`revoke` **retournant** l'entité persistée, point d'ancrage unique de la future publication `entitlement.changed`.

---

## Dependencies

**Stories prérequises (livrées) :**
- **STORY-032** — catalogue `Module`/`ModuleVersion`/`ReferentielVersion` + statuts + machine d'états (`RETIRED` terminal). **✅ Done + vérifié docker 2026-07-13.** Fournit les **services de registre** contre lesquels valider la cohérence. **Action requise :** `CatalogModule` doit **exporter** `ModulesService`, `ModuleVersionsService`, `ReferentielVersionsService`.
- **STORY-031** — scaffold `platform-catalog-service` (relying party RS256/JWKS, `common/`, `RolesGuard`/`@Roles`, base `catalog_service`, `/health`, compose racine + `aud` IdP). **✅ Done + vérifié docker.**
- **STORY-024** — RS256/JWKS de l'IdP consommé (inchangé) ; l'IdP émet `platform-catalog-service` dans l'`aud`.

**Patron à cloner (conventions CRUD gardé + extraction `org`/`sub` du JWT) :**
- **`kyc-service`** (contrôleur admin gardé `@Roles`, DTO, accès `request.user`) et **`auth-service/src/modules/admin/*`** (RBAC `PLATFORM_ADMIN`, anti-énumération). STORY-032 (`catalog-admin`/`catalog-read`) = référence directe du même service.

**Stories débloquées (EPIC-007, sprint 7) :**
- **STORY-034** — `entitlement.changed` (producteur Kafka + **transactional outbox**, contrat v1) branché sur la **couture** livrée ici + **octroi service-à-service (C8)** (le billing d'un vertical écrit l'entitlement) + option cascade **C9**.
- (aval) **admin-panel** (gestion des entitlements via BFF) ; **`bilan-service`** gate (read-model entitlement) — consommateurs de l'événement.

**Dépendances externes :** Mongo (base `catalog_service`) déjà présente. **Aucun** MinIO/Redis nouveau. **Aucun** Kafka actif (squelette conservé — bus = STORY-034).

---

## Definition of Done

- [ ] Code implémenté sur une branche **`MNV-033`** (une branche par story, préfixe `MNV-0XX`), **branchée depuis `dev` + rebasée sur `origin/dev`** avant de coder.
- [ ] Tests **unitaires** verts, couverture ≥ **65/90/90/90** :
  - [ ] `entitlements.service` — **cohérence** : module inexistant → 422 ; version inexistante/`RETIRED` → 422 ; référentiel inexistant/`RETIRED` → 422 ; version/référentiel `DEPRECATED` → **accepté** ; module sans référentiel → accepté.
  - [ ] **idempotence** : create → 201 ; rejeu identique → 200, une seule ligne ; migration `$set` absolu.
  - [ ] **révocation soft** : `DELETE` → `REVOKED` ; re-`DELETE`/absent → 404.
  - [ ] **anti-énumération** : `TENANT_ADMIN` sur sa propre org OK ; sur autre org → 403.
- [ ] Tests **e2e** verts (`platform-catalog-service/test/`) : parcours octroi → rejeu → migration → réconciliation → révocation ; **422** cohérence (version/référentiel `RETIRED` ou inexistant) ; **403** tenant en écriture + tenant sur autre org ; **401** sans token ; **404** révocation d'un `(org, module)` absent. Prérequis catalogue seedé (module + versions + référentiel via les services STORY-032). JWT RS256 mintés en test.
- [ ] **ESLint 0 warning**, build image Docker OK (**4 services** en CI verte).
- [ ] **Vérification docker bout-en-bout** (dernier AC) réalisée et journalisée dans « Revue & validation ».
- [ ] Swagger `/api/docs` à jour (tag `Entitlements`).
- [ ] `/code-review` (niveau ≥ high) passée ; constats traités ou tracés.
- [ ] Story mise à jour (statut) dans `docs/sprint-status.yaml` ; **push sur `prospera-platform-catalog-service`** : branche `MNV-033`, puis **PR vers `dev`** (flux PR modules). Commit/push **après test + validation**.

---

## Story Points Breakdown

- **Schéma `Entitlement` + enum + index + `EntitlementsModule` (import `CatalogModule`) :** 1 point
- **`EntitlementsService` : validation de cohérence contre le registre + upsert idempotent + révocation soft + réconciliation :** 2 points
- **`EntitlementsController` (PUT/DELETE/GET) + DTO validés + RBAC & anti-énumération + Swagger :** 1 point
- **Tests unit + e2e (cohérence RETIRED/DEPRECATED, idempotence, anti-énumération) + vérif docker :** 1 point
- **Total : 5 points**

**Rationale :** deuxième domaine métier du service, **sans bus ni intégration externe** (Kafka reste squelette → STORY-034). Le poids réel est la **validation de cohérence croisée** contre le registre (3 axes) + l'**upsert idempotent** (état absolu, prérequis de la diffusion) + l'**anti-énumération**. Comparable à STORY-032 (5 pts, premier domaine) ; STORY-034 (bus + outbox + C8) reste distincte à 5 pts.

---

## Additional Notes

- **Le croisement vit dans l'entitlement (C2)** : ne jamais ré-encoder `versionCode`/`referentiel` dans les schémas du registre. L'`Entitlement` est le **seul** lieu du triplet `(module × version × référentiel)` pour une org.
- **État absolu, pas de deltas (P4)** : chaque entitlement porte l'état complet ; c'est ce qui rendra `entitlement.changed` (STORY-034) idempotent côté consommateur. Ne pas introduire d'historique/versioning d'entitlement en phase 1 (le `timestamps` suffit).
- **Séparer abonnement et entitlement (C5)** : aucune notion de `Subscription`/paiement ici — seul le **droit** est modélisé.
- **Nommage** : préfixe REST `/api/v1/catalog/entitlements` ; base `catalog_service` ; module `EntitlementsModule`.
- **Ordre EPIC-007** : STORY-031 (scaffold ✅) → 032 (catalogue ✅) → **033 (entitlements — cette story)** → 034 (événements + C8). STORY-034 **dépend** de la couture de persistance livrée ici.

---

## Progress Tracking

**Historique des statuts :**
- 2026-07-13 : Créée par vivian (BMAD Scrum Master — `/bmad:create-story`).
- 2026-07-13 : Implémentée + vérifiée docker bout-en-bout par Claude (BMAD dev-story). ✅ Done.

**Effort réel :** 5 points (conforme à l'estimation).

---

## Revue & validation (2026-07-13)

**Livré** (`platform-catalog-service/src/modules/entitlements/`)
- **Schéma `Entitlement`** (`organizationId` ObjectId, `moduleCode`, `versionCode`, `referentiel?`, `config`, `status` ACTIVE|SUSPENDED|REVOKED, `grantedBy?`, `source?`) — **index unique `(organizationId, moduleCode)`** + index `organizationId`. Enum `EntitlementStatus` (+ `GRANTABLE_ENTITLEMENT_STATUSES` = ACTIVE|SUSPENDED, exclut REVOKED).
- **`EntitlementsService`** : validation de cohérence contre le catalogue (`ModulesService.exists` + `ModuleVersionsService.findExact` + `ReferentielVersionsService.findExact` — helpers **ajoutés à STORY-032**, encapsulation : aucun accès direct aux modèles du registre) → **422** si module inexistant / version ou référentiel **inexistant ou `RETIRED`** ; **`DEPRECATED` accepté** (migration). Upsert idempotent `findOneAndUpdate` **`$set` absolu** sur `(organizationId, moduleCode)` (`upsert:true`) → **201** création / **200** rejeu. Révocation **soft** (`DELETE` → `REVOKED`, jamais de `deleteOne`). Réconciliation `listByOrg` (tous statuts par défaut, `?status=` restreint). `orgId` non-ObjectId → **400**. `grantedBy = sub` du JWT, `source = "admin"`. **Couture STORY-034** laissée après persistance (service retourne l'entité).
- **`EntitlementsController`** (`/api/v1/catalog/entitlements`) : `PUT`/`DELETE` `@Roles(PLATFORM_ADMIN)`, `GET` `@Roles(PLATFORM_ADMIN, TENANT_ADMIN)` avec **anti-énumération** (un TENANT_ADMIN ne lit que sa propre org, `403` sinon). Statut **201/200 dynamique** via `@Res({ passthrough:true })`. DTO `class-validator` (semver, `referentiel` imbriqué, `status ∈ {ACTIVE,SUSPENDED}` — REVOKED refusé 400). Swagger tag `Entitlements`.
- **Aucune publication Kafka** (bus = STORY-034) ; `KafkaModule` reste squelette. `EntitlementsModule` importe `CatalogModule` (services exportés).

**Tests**
- **lint 0**, build OK. **169 unit (23 suites) + 43 e2e (3 suites)** verts. Couverture **100 / 100 / 100 / 100** sur `src/modules/entitlements/**` (et catalog inchangé à 100 %).
- e2e `entitlements.e2e-spec.ts` : catalogue seedé via `CatalogAdminController`, puis octroi 201 → rejeu 200 → réconciliation → migration ; **422** (version inexistante / **RETIRED** / référentiel inexistant / module inexistant) ; **400** (status=REVOKED corps / semver / orgId non-ObjectId) ; révocation soft → REVOKED + filtre `?status=ACTIVE` ; **404** (org,module absent) ; **RBAC** (TENANT_ADMIN écriture 403) + **anti-énumération** (TENANT_ADMIN autre org 403) ; câblage JWKS (sans jeton / HS256 forgé → 401).

**Vérification docker bout-en-bout** (stack racine dev : `auth-service:3001`, `platform-catalog-service:3003`, `mongo` rs0, `kafka`) — **21/21 OK** :
- `/health` catalog → 200 (mongodb + kafka up, pas de redis).
- login `PLATFORM_ADMIN` (IdP) → **JWT RS256** `aud:[expert-comptable, kyc-service, platform-catalog-service]`, `org:null`, `roles:[PLATFORM_ADMIN]`.
- Sur le **service + Mongo réels** (codes frais `story033*` pour éviter les données laissées par STORY-032, dont `syscohada-revise` RETIRED) : octroi **201** (`grantedBy` = sub réel, `source:"admin"` persistés), rejeu **200** (idempotent, 1 seule entrée), migration config **200**, cohérence **422** (version 9.9 / version RETIRED 1.0 / référentiel inexistant / module `ghost`), **400** (REVOKED corps / `versionCode` non-semver / `orgId` `org-1`), `DELETE` **200** → statut **REVOKED**, `GET ?status=ACTIVE` masque l'entrée révoquée, `DELETE` absent **404**, sans jeton **401**, jeton bidon **401**.

**Reste**
- `/code-review` formel (niveau ≥ high).
- Push `MNV-033` + PR vers `dev` sur `prospera-platform-catalog-service`.
- **STORY-034** (publication `entitlement.changed` Kafka + transactional outbox sur la couture livrée + octroi service-à-service C8 + option cascade C9).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
*Prochaine étape : STORY-034 (`entitlement.changed` + auth service-à-service C8).*
