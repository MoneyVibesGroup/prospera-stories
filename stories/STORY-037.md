# STORY-037 : Gate d'accès `@RequiresBilanAccess` (emailVerified + KYC APPROVED + entitlement ACTIVE, read-models locaux) + tests

**Epic :** EPIC-008 — bilan-service (squelette d'intégration : scaffold + read-models entitlement/KYC + gate `@RequiresBilanAccess` + `ReferentielLoader`)
**Réf. architecture :** `architecture-bilan-service-2026-07-07.md` (v1.0, §Gate d'accès — FR-007 rejoué en relying party [contrat 3 checks + codes] · §AccessGate `@RequiresBilanAccess` · §Modules [`CommonModule` + `@RequiresBilanAccess`] · §Architecture des données [read-models `OrgBilanEntitlement` + `OrgKycStatus`]) · `architecture-expert-comptable-2026-07-02.md` §FR-007 / décision **D10** (origine du `TenantStateGuard`) · décisions **P4** (autonomie de fonctionnement), **B3** (gate **zéro appel réseau**), **B4/C5** (séparation abonnement ↔ entitlement)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-14. `BilanAccessGuard` (5ᵉ `APP_GUARD`, no-op hors routes `@RequiresBilanAccess`) rejoue FR-007 : `emailVerified` (claim) + `OrgKycStatus == APPROVED` + `OrgBilanEntitlement == ACTIVE` (read-models STORY-036), zéro appel réseau, fail-closed, codes 403 `EMAIL_NOT_VERIFIED`/`KYC_NOT_APPROVED`/`BILAN_NOT_ENTITLED` (propagés par `AllExceptionsFilter`). lint 0, **98 unit (guard 100 % cov) + 17 e2e** verts. `/code-review` (high) : 0 bug, 3 constats mineurs/par-conception. PR #3 (`MNV-037→dev`) mergée « Rebase and merge » (dev HEAD `93d574b`). Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-14
**Sprint :** 8
**Service :** bilan-service (`:3004`) — base Mongo dédiée `bilan_service`
**Couvre :** **FR-007 rejoué** (capacité **partagée**, décision **D10/P7**) — l'ancien `TenantStateGuard` d'`expert-comptable` (e-mail + KYC + **abonnement**) reconstruit **en relying party** dans `bilan-service` sous forme d'un gate `emailVerified` + **KYC** + **entitlement** (l'abonnement devient l'**entitlement `ACTIVE`** maintenu par le vertical, **B4/C5**).

> **3ᵉ story d'EPIC-008 — la porte d'accès au domaine Bilan.** STORY-035 a livré un `bilan-service` démarrable (relying party RS256/JWKS, `/health`, endpoint diagnostic `whoami`). STORY-036 a livré les **read-models locaux** (`OrgBilanEntitlement` ← `entitlement.changed`, `OrgKycStatus` ← `kyc.status.changed`) maintenus de façon idempotente et **exportés** par `ReadModelsModule`. Cette story branche par-dessus **le gate d'accès** `@RequiresBilanAccess` : un guard qui, sur une opération Bilan, exige `emailVerified` (claim JWT) **+** KYC `APPROVED` (read-model) **+** entitlement `bilan` `ACTIVE` (read-model), **sans aucun appel réseau** à `auth`/`kyc`/`catalog` (décisions **P4/B3**). En **échec**, il renvoie **403** avec un **code d'erreur explicite** (`EMAIL_NOT_VERIFIED` / `KYC_NOT_APPROVED` / `BILAN_NOT_ENTITLED`). Le **domaine comptable** (endpoints Bilan réels) reste hors périmètre (EPIC-009+, PRD/tech-spec Bilan, **B8**) : cette story livre **le mécanisme + les tests**, et l'attache à un **endpoint diagnostic gardé provisoire** pour la preuve bout-en-bout, comme `whoami` prouve le câblage JWKS.

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux que `bilan-service` **refuse** toute opération Bilan tant que l'organisation appelante n'a pas `emailVerified` **ET** un KYC `APPROVED` **ET** un entitlement `bilan` `ACTIVE`, en s'appuyant **uniquement** sur des **read-models locaux** (aucun appel réseau),
afin que l'accès au module Bilan rejoue **FR-007** de manière **résiliente et sans latence d'autorisation** — une révocation d'entitlement ou un KYC non approuvé ferme l'accès en quelques secondes, et le service reste opérant même si `auth`/`kyc`/`catalog` sont momentanément indisponibles.

---

## Description

### Contexte

Dans le vertical `expert-comptable`, l'accès à une ressource protégée passait par un `TenantStateGuard` (**FR-007**) qui mêlait **e-mail vérifié + KYC + abonnement**. Le Bilan a été **extrait** en capacité **partagée** (décision **D10/P7**) : `bilan-service` ne **possède** ni l'identité, ni le KYC, ni l'entitlement, ni l'abonnement. Il ne les connaît que par :

- le **claim `emailVerified`** de l'access token RS256 (instantané émis par l'IdP, projeté sur `request.user`) ;
- le **read-model `OrgKycStatus`** (alimenté par `kyc.status.changed`, STORY-036) ;
- le **read-model `OrgBilanEntitlement`** (alimenté par `entitlement.changed` filtré `moduleCode == "bilan"`, STORY-036).

Le gate est donc **rejoué en relying party** (architecture §Gate d'accès, lignes 218-229) :

```
@RequiresBilanAccess :
  emailVerified (claim JWT)                 → sinon 403 EMAIL_NOT_VERIFIED
  OrgKycStatus.status == APPROVED (read-model) → sinon 403 KYC_NOT_APPROVED
  OrgBilanEntitlement.status == ACTIVE (read-model) → sinon 403 BILAN_NOT_ENTITLED
```

**L'abonnement disparaît du gate** : `bilan-service` ne connaît pas FedaPay (**B4/C5**). C'est le **vertical** qui maintient l'entitlement `ACTIVE` en phase avec le paiement (octroi/révocation via `catalog-service` → `entitlement.changed`). Le gate se contente de lire l'entitlement **absolu** projeté localement.

**Tout est local** (claim + deux `findOne` Mongo) → **aucune latence d'autorisation**, **aucun appel réseau** sur le chemin chaud (**B3**), et **résilience** : un JWT valide + des read-models à jour suffisent même si `auth`/`kyc`/`catalog` sont down. Contrepartie assumée : **cohérence éventuelle** — une approbation KYC / un octroi d'entitlement ouvre l'accès en quelques secondes, une révocation le ferme tout aussi vite (statut **absolu** dans l'événement, STORY-036).

### Périmètre

**Dans le périmètre**

- **Décorateur `@RequiresBilanAccess()`** (`common/decorators/requires-bilan-access.decorator.ts`) : pose une métadonnée `REQUIRES_BILAN_ACCESS_KEY` sur un handler/contrôleur. **Métadonnée pure** (aucune dépendance à Mongo) → reste dans `common` comme les autres décorateurs.
- **Guard `BilanAccessGuard`** : lit la métadonnée ; **si absente → laisse passer** (patron `RolesGuard` : no-op hors des routes décorées). Si présente : applique les **trois checks** dans l'ordre `emailVerified → KYC → entitlement` (premier échec gagne, avec **son** code) via `request.user.emailVerified` + deux `findOne` **en lecture seule** sur `OrgKycStatus` et `OrgBilanEntitlement` keyés `organizationId = user.tenantId`. **Zéro appel réseau.**
- **Enregistrement global** en **5ᵉ maillon** de la chaîne de guards (`Throttler → Jwt → EmailVerified → Roles → BilanAccess`) : `{ provide: APP_GUARD, useClass: BilanAccessGuard }` dans `AppModule`, après `RolesGuard`. Le guard peut injecter les modèles Mongoose des read-models car `ReadModelsModule` (importé par `AppModule`) **exporte** `MongooseModule.forFeature([OrgBilanEntitlement, OrgKycStatus, …])`.
- **Codes d'erreur explicites** : `ForbiddenException` portant `{ message, code }` avec `code ∈ { EMAIL_NOT_VERIFIED, KYC_NOT_APPROVED, BILAN_NOT_ENTITLED }`. Constantes messages+codes exportées (patron `EMAIL_NOT_VERIFIED_MESSAGE` de `EmailVerifiedGuard`), pour réutilisation dans les tests.
- **Endpoint diagnostic gardé provisoire** : `GET /whoami/bilan-access` (module `diagnostics`), décoré `@RequiresBilanAccess()` **+** `@Roles(TENANT_ADMIN, TENANT_USER)`, renvoie **200 `{ access: 'granted', org }`** quand les trois checks passent. **Provisoire** (comme `whoami`) : remplacé par les vrais contrôleurs Bilan dès l'arrivée du domaine (EPIC-009+). Sert de **cible e2e + docker** pour prouver le gate de bout en bout.
- **Tests unitaires exhaustifs du guard** (mock `Reflector` + `ExecutionContext` + modèles `findOne`) : sans métadonnée → passe ; `emailVerified` faux → 403 `EMAIL_NOT_VERIFIED` ; KYC absent / non-`APPROVED` → 403 `KYC_NOT_APPROVED` ; entitlement absent / non-`ACTIVE` (`SUSPENDED`/`REVOKED`) → 403 `BILAN_NOT_ENTITLED` ; les trois OK → passe ; `tenantId` null (PLATFORM_ADMIN) → 403 `BILAN_NOT_ENTITLED` ; **ordre de priorité** des codes ; **aucun appel réseau** (seulement `findOne` locaux).
- **Tests e2e** (`bilan-access.e2e-spec.ts`, fixture RS256 + Mongo de test) : JWT forgé + read-models **semés** → `200 granted` ; e-mail non vérifié → `403 EMAIL_NOT_VERIFIED` ; KYC `UNDER_REVIEW`/absent → `403 KYC_NOT_APPROVED` ; entitlement `REVOKED`/absent → `403 BILAN_NOT_ENTITLED` ; `PLATFORM_ADMIN` (org null) → **403** (bloqué par `@Roles` **ou** gate) ; sans token → `401`.

**Hors périmètre (stories suivantes / autres services)**

- **`ReferentielLoader`** (résolution `(code, version)` depuis `OrgBilanEntitlement` → téléchargement d'artefact + checksum + cache) + **moteur squelette** → **STORY-038**.
- **Endpoints métier Bilan** et **schémas du domaine comptable** (écritures, états financiers) → **EPIC-009+** (PRD/tech-spec Bilan, **B8**). Le gate y sera **rattaché** (`@RequiresBilanAccess` sur les opérations réelles) à leur création ; ici il n'orne qu'un **endpoint diagnostic provisoire**.
- **Maintien des read-models** (consumers/projections) : déjà livré par **STORY-036** — cette story les **lit**, ne les écrit pas.
- **Routage multi-version au gateway** (`orgId → bilan-v1/v2`) : edge/ops, hors service.
- **Abonnement / paiement** : hors `bilan-service` par conception (**B4/C5**) — le gate lit l'entitlement, pas l'abonnement.

### Flux (une opération Bilan gardée)

1. L'utilisateur (org `O`, `TENANT_ADMIN`) appelle une opération Bilan avec son access token RS256.
2. Chaîne de guards globale : `Throttler` OK → `JwtAuthGuard` valide le jeton via JWKS et peuple `request.user` (`{ userId, tenantId: O, role, emailVerified }`) → `EmailVerifiedGuard` (e-mail vérifié) → `RolesGuard` (`@Roles(TENANT_ADMIN, TENANT_USER)` OK).
3. **`BilanAccessGuard`** lit la métadonnée `@RequiresBilanAccess` (présente) → check 1 : `user.emailVerified === true` ✓ → check 2 : `OrgKycStatus.findOne({ organizationId: O }).status === APPROVED` ✓ → check 3 : `OrgBilanEntitlement.findOne({ organizationId: O }).status === ACTIVE` ✓ → **laisse passer** (200).
4. **Refus KYC** : le read-model `OrgKycStatus` de `O` vaut `UNDER_REVIEW` (ou est absent) → **403 `{ code: KYC_NOT_APPROVED }`**, le domaine n'est jamais atteint.
5. **Refus entitlement** : `kyc-service` a approuvé le KYC mais l'org n'a **pas** payé → aucun `entitlement.changed(ACTIVE)`, `OrgBilanEntitlement` absent (ou `REVOKED`/`SUSPENDED`) → **403 `{ code: BILAN_NOT_ENTITLED }`**.
6. **Révocation à chaud** : impayé → le vertical révoque l'entitlement sur `catalog` → `entitlement.changed(REVOKED)` → STORY-036 projette `OrgBilanEntitlement.status = REVOKED` en ~secondes → l'appel suivant est **403 `BILAN_NOT_ENTITLED`** (fermeture rapide, **B3**).

---

## Acceptance Criteria

- [ ] **Décorateur `@RequiresBilanAccess()`** dans `common/decorators/requires-bilan-access.decorator.ts` : exporte `REQUIRES_BILAN_ACCESS_KEY` et `RequiresBilanAccess = () => SetMetadata(REQUIRES_BILAN_ACCESS_KEY, true)`. **Métadonnée pure**, aucune dépendance Mongo (calqué sur `@AllowUnverified` / `@Roles`).
- [ ] **`BilanAccessGuard`** implémente `CanActivate` :
  - lit `REQUIRES_BILAN_ACCESS_KEY` via `reflector.getAllAndOverride([getHandler(), getClass()])` ; **métadonnée absente → `return true`** (no-op, patron `RolesGuard`) ;
  - récupère `request.user` (`AuthenticatedUser`) ; **check 1** `user?.emailVerified === true` sinon `403 EMAIL_NOT_VERIFIED` ;
  - **check 2** : `user.tenantId` présent **et** `OrgKycStatus.findOne({ organizationId })` existe **et** `status === KycStatus.APPROVED`, sinon `403 KYC_NOT_APPROVED` ;
  - **check 3** : `OrgBilanEntitlement.findOne({ organizationId })` existe **et** `status === EntitlementStatus.ACTIVE`, sinon `403 BILAN_NOT_ENTITLED` ;
  - **les trois passent → `true`**.
- [ ] **Ordre de priorité strict** `emailVerified → KYC → entitlement` : le **premier** check en échec détermine le code retourné (ex. e-mail non vérifié **et** entitlement révoqué ⇒ `EMAIL_NOT_VERIFIED`).
- [ ] **Fail-closed sur read-model absent** : un `OrgKycStatus`/`OrgBilanEntitlement` **introuvable** (cohérence éventuelle : événement pas encore projeté) est traité comme **refus** (`KYC_NOT_APPROVED` / `BILAN_NOT_ENTITLED`), **jamais** comme un succès.
- [ ] **`tenantId` null (PLATFORM_ADMIN)** : aucune org ⇒ aucun read-model ⇒ **403 `BILAN_NOT_ENTITLED`** (défensif). *En pratique déjà bloqué en amont par `@Roles(TENANT_ADMIN, TENANT_USER)`* ; le gate ne doit **jamais** lever d'exception non gérée sur `tenantId` null.
- [ ] **Codes d'erreur explicites** dans le corps `403` : la `ForbiddenException` porte `{ message, code }` (`code ∈ EMAIL_NOT_VERIFIED | KYC_NOT_APPROVED | BILAN_NOT_ENTITLED`) et ce `code` est **présent dans la réponse JSON** (vérifié que `AllExceptionsFilter` ne l'écrase pas). Messages+codes exposés en **constantes** exportées.
- [ ] **Zéro appel réseau** : le guard n'utilise **que** le claim `emailVerified` et **deux `findOne` locaux** (Mongo). Aucun `HttpService`/fetch vers `auth`/`kyc`/`catalog`.
- [ ] **Enregistrement global** : `BilanAccessGuard` ajouté comme **5ᵉ** `APP_GUARD` dans `AppModule` **après** `RolesGuard` (ordre : `Throttler → Jwt → EmailVerified → Roles → BilanAccess`). Le commentaire de la chaîne de guards est mis à jour. Le guard injecte les modèles via les exports de `ReadModelsModule` (ni cycle, ni ré-`forFeature`).
- [ ] **Endpoint diagnostic gardé** `GET /whoami/bilan-access` (module `diagnostics`) : `@RequiresBilanAccess()` + `@Roles(TENANT_ADMIN, TENANT_USER)`, réponse **200 `{ access: 'granted', org }`** quand le gate passe ; documenté Swagger (`@ApiForbiddenResponse`). **Provisoire** (remplacé par les vrais contrôleurs Bilan).
- [ ] **Tests unitaires** (seuils Jest 90/65/90/90 tenus) : sans métadonnée → passe ; `emailVerified` faux → `EMAIL_NOT_VERIFIED` ; KYC absent → `KYC_NOT_APPROVED` ; KYC `UNDER_REVIEW`/`REJECTED`/`PENDING_DOCUMENTS` → `KYC_NOT_APPROVED` ; entitlement absent → `BILAN_NOT_ENTITLED` ; entitlement `SUSPENDED`/`REVOKED` → `BILAN_NOT_ENTITLED` ; trois OK → passe ; `tenantId` null → `BILAN_NOT_ENTITLED` (sans throw non géré) ; **ordre de priorité** des codes ; **`findOne` non court-circuité par un réseau**.
- [ ] **Tests e2e** (`test/bilan-access.e2e-spec.ts`, fixture `startRs256Fixture` + Mongo de test) : semis des read-models + JWT forgé → **200 `granted`** ; e-mail non vérifié → **403** (bloqué par `EmailVerifiedGuard` **ou** gate — code documenté) ; KYC `UNDER_REVIEW`/absent → **403 `KYC_NOT_APPROVED`** ; entitlement `REVOKED`/absent → **403 `BILAN_NOT_ENTITLED`** ; `PLATFORM_ADMIN` (org null) → **403** ; sans token → **401**.
- [ ] **`/health` inchangé** (200), **aucun** autre endpoint métier ajouté (le diagnostic `bilan-access` est explicitement provisoire).
- [ ] **ESLint 0 warning**, build image `runtime` OK, CI verte (matrice 5 services + base `bilan_service_test`).
- [ ] **Vérification docker bout-en-bout** : stack `auth:3001` + `catalog:3003` + `kyc:3002` + `bilan:3004` + `mongo` rs0 + `kafka`. Pour une org : (a) sans KYC `APPROVED` → `GET /whoami/bilan-access` = **403 `KYC_NOT_APPROVED`** ; (b) après approbation KYC (kyc) mais sans entitlement → **403 `BILAN_NOT_ENTITLED`** ; (c) après octroi entitlement `bilan` `ACTIVE` (catalog) → **200 `granted`** ; (d) après révocation (catalog `DELETE`) → **403 `BILAN_NOT_ENTITLED`** en ~secondes. Consignée en §Revue & validation.

---

## Technical Notes

### Composants

- **Backend :** `bilan-service` — `common/decorators/requires-bilan-access.decorator.ts` (métadonnée pure), `BilanAccessGuard` (lecture read-models), enregistrement `APP_GUARD` dans `app.module.ts`, endpoint diagnostic `whoami/bilan-access` (module `diagnostics`).
- **Base de données :** `bilan_service` — **lecture seule** sur `orgkycstatuses` et `orgbilanentitlements` (collections créées par STORY-036). **Aucune** nouvelle collection, **aucune** écriture.
- **Bus :** **aucun** (le gate ne consomme ni ne produit d'événement ; il lit les read-models déjà alimentés).

### Emplacement du guard (décision de conception)

Les guards « purs » (`JwtAuthGuard`, `EmailVerifiedGuard`, `RolesGuard`) vivent dans `common/guards` et ne touchent pas la base. `BilanAccessGuard` **lit des read-models** → il dépend des modèles Mongoose exportés par `ReadModelsModule`. Deux options ont été pesées :

| Option | Emplacement guard | Enregistrement | Verdict |
|---|---|---|---|
| **A (retenue)** | `modules/read-models/guards/bilan-access.guard.ts` (co-localisé avec les read-models qu'il interroge) ; **décorateur** dans `common/decorators` (pur) | **global** `APP_GUARD` dans `AppModule` (5ᵉ), no-op sans métadonnée (patron `RolesGuard`) | ✅ cohérent avec la chaîne existante, ordre déterministe, `common` reste pur |
| B | `common/guards` + `@UseGuards` route-level via `applyDecorators` | route-level | ❌ forcerait `common` à dépendre des modèles read-models (couplage) |

> **Option A.** Le **décorateur** `@RequiresBilanAccess` reste dans `common` (métadonnée sans dépendance) comme l'annonce l'architecture (§Modules : « `CommonModule` : … guards … + `@RequiresBilanAccess` »). Le **guard** est co-localisé avec les read-models (sa source de données) et **exporté** pour être enregistré en `APP_GUARD` dans `AppModule` (`ReadModelsModule` étant importé par `AppModule` et exportant `MongooseModule.forFeature`, les modèles sont résolus dans le contexte d'`AppModule`). Aucun cycle : `AppModule → ReadModelsModule`, le guard ne dépend que des modèles.

### Guard (esquisse)

```typescript
// modules/read-models/guards/bilan-access.guard.ts (résumé)
export const BILAN_ACCESS_CODES = {
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  KYC_NOT_APPROVED: 'KYC_NOT_APPROVED',
  BILAN_NOT_ENTITLED: 'BILAN_NOT_ENTITLED',
} as const;

@Injectable()
export class BilanAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(OrgKycStatus.name) private readonly kyc: Model<OrgKycStatusDocument>,
    @InjectModel(OrgBilanEntitlement.name) private readonly ent: Model<OrgBilanEntitlementDocument>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_BILAN_ACCESS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required) return true;                              // no-op hors routes gardées (patron RolesGuard)

    const { user } = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();

    // 1) e-mail (claim) — premier échec gagne
    if (!user?.emailVerified) throw this.deny(EMAIL_NOT_VERIFIED_MESSAGE, 'EMAIL_NOT_VERIFIED');

    // 2) KYC APPROVED (read-model local) — absent = refus (fail-closed)
    const orgId = user.tenantId ? new Types.ObjectId(user.tenantId) : null;
    const kyc = orgId ? await this.kyc.findOne({ organizationId: orgId }).lean() : null;
    if (kyc?.status !== KycStatus.APPROVED) throw this.deny(KYC_NOT_APPROVED_MESSAGE, 'KYC_NOT_APPROVED');

    // 3) entitlement bilan ACTIVE (read-model local) — absent = refus
    const ent = await this.ent.findOne({ organizationId: orgId }).lean();
    if (ent?.status !== EntitlementStatus.ACTIVE) throw this.deny(BILAN_NOT_ENTITLED_MESSAGE, 'BILAN_NOT_ENTITLED');

    return true;
  }

  private deny(message: string, code: string): ForbiddenException {
    return new ForbiddenException({ message, code });       // { code } présent dans le corps 403
  }
}
```

- **`.lean()`** : lecture brute, pas d'hydratation Mongoose (chemin chaud, lecture seule).
- **`user.tenantId` null** (PLATFORM_ADMIN) : `orgId = null` ⇒ `findOne` non exécuté ⇒ `kyc = null` ⇒ `KYC_NOT_APPROVED`. *Note :* le contrat AC exige `BILAN_NOT_ENTITLED` pour un PLATFORM_ADMIN ; deux lectures possibles — soit court-circuiter en `BILAN_NOT_ENTITLED` explicite avant les checks (un principal sans org n'a pas d'accès Bilan), soit laisser tomber sur `KYC_NOT_APPROVED`. **Recommandation** : traiter `tenantId` null en **`BILAN_NOT_ENTITLED`** dédié (message « aucune organisation ») en tête de méthode, car c'est l'absence d'org (pas le KYC) qui motive le refus. À trancher à l'implémentation ; l'essentiel (AC) est **403 sans throw non géré**. *En pratique le `@Roles` bloque avant.*

### Décorateur

```typescript
// common/decorators/requires-bilan-access.decorator.ts
export const REQUIRES_BILAN_ACCESS_KEY = 'requiresBilanAccess';
/** Exige un accès Bilan complet (emailVerified + KYC APPROVED + entitlement ACTIVE), lu en read-models locaux. */
export const RequiresBilanAccess = (): CustomDecorator =>
  SetMetadata(REQUIRES_BILAN_ACCESS_KEY, true);
```

### Chaîne de guards (app.module.ts)

```
1) ThrottlerGuard      (plafonne même le non-authentifié)
2) JwtAuthGuard        (RS256/JWKS, exempte @Public)
3) EmailVerifiedGuard  (exige e-mail vérifié, exempte @AllowUnverified)
4) RolesGuard          (RBAC @Roles)
5) BilanAccessGuard    (NOUVEAU — gate @RequiresBilanAccess : KYC + entitlement, no-op sinon)
```

> **Redondance assumée du check e-mail.** `EmailVerifiedGuard` (4→ non, 3ᵉ) 403 déjà un e-mail non vérifié **en amont** du gate ; le check `emailVerified` du `BilanAccessGuard` est donc normalement **couvert** pour une route standard. Il est **conservé** pour (a) rejouer FR-007 **intégralement** dans un seul guard auto-suffisant et **testable isolément**, (b) fournir le **code explicite** `EMAIL_NOT_VERIFIED`, (c) la **défense en profondeur** si une route future portait `@RequiresBilanAccess` sans passer par `EmailVerifiedGuard`. En e2e sur `/whoami/bilan-access`, un e-mail non vérifié sera intercepté par `EmailVerifiedGuard` (message générique) — **documenté** dans le test.

### Endpoint diagnostic gardé (provisoire)

```typescript
// diagnostics/whoami.controller.ts (ajout)
@Roles(Role.TENANT_ADMIN, Role.TENANT_USER)
@RequiresBilanAccess()
@Get('bilan-access')
@ApiOkResponse({ type: BilanAccessResponseDto })
@ApiForbiddenResponse({ description: 'EMAIL_NOT_VERIFIED | KYC_NOT_APPROVED | BILAN_NOT_ENTITLED' })
bilanAccess(@CurrentUser() user: AuthenticatedUser): BilanAccessResponseDto {
  return { access: 'granted', org: user.tenantId };
}
```

Comme `whoami`, cet endpoint est **diagnostic et provisoire** : il prouve le gate de bout en bout (e2e + docker) tant qu'aucun contrôleur Bilan réel n'existe (EPIC-009+). À supprimer/remplacer quand le domaine arrive.

### Sécurité

- **Fail-closed** : toute incertitude (read-model absent, `tenantId` null, statut inattendu) ⇒ **refus**, jamais accès. L'absence de projection (cohérence éventuelle) ferme l'accès plutôt que de l'ouvrir.
- **Aucune confiance en une entrée arbitraire** : `organizationId` provient du **claim `org` signé** (JWT RS256 validé JWKS), pas d'un paramètre client. Les read-models ne sont alimentés que par des événements des **sources de vérité** (STORY-036).
- **Zéro appel réseau** (**B3**) : pas de dépendance disponibilité sur `auth`/`kyc`/`catalog` au moment de l'autorisation ; surface d'attaque et latence minimales.
- **Pas de fuite** : les 403 renvoient un **code** stable, pas de détail interne (statut KYC exact, version d'entitlement…).

### Cas limites / points d'attention

- **⚠️ Cohérence éventuelle.** Un KYC approuvé / entitlement octroyé « à l'instant » peut ne pas être encore projeté ⇒ **403 transitoire** légitime (fenêtre de quelques secondes, STORY-036). Idem, une révocation ferme l'accès en ~secondes (fraîcheur des read-models à **surveiller** — métrique de lag conso, cf. archi §Risques point 4).
- **`ObjectId` invalide.** `user.tenantId` provient d'un claim signé (toujours un ObjectId valide côté IdP) ; par prudence, ne pas laisser `new Types.ObjectId(tenantId)` lever — garder `tenantId` null/invalide en **refus** (jamais un 500). Aligné sur le garde-fou poison-pill de STORY-036 (#1).
- **Ordre des checks = ordre des codes.** Les tests **verrouillent** la priorité `EMAIL → KYC → ENTITLEMENT` pour éviter toute dérive (un refacto qui inverserait les codes casserait un contrat d'API).
- **`AllExceptionsFilter`.** Vérifier que le filtre propage `{ code }` de la `ForbiddenException` dans le corps JSON (ne pas le remplacer par le seul `message`). Sinon, adapter le filtre **a minima** pour préserver le `code` (sans changer le format des autres erreurs).
- **Pas de nouvelle dépendance.** Aucune lib ajoutée ; le guard réutilise `@nestjs/mongoose` (déjà présent) et les modèles STORY-036.

---

## Dependencies

**Stories prérequises :**
- **STORY-035** (scaffold `bilan-service` : chaîne de guards, `AuthenticatedUser`, `Role`, module `diagnostics`) — **done**.
- **STORY-036** (read-models `OrgKycStatus` + `OrgBilanEntitlement` + enums `KycStatus`/`EntitlementStatus`, exportés par `ReadModelsModule`) — **done**. **Source de données** du gate.

**Stories bloquées (débloquées par celle-ci) :**
- **Endpoints métier Bilan** (EPIC-009+) — porteront `@RequiresBilanAccess` sur leurs opérations.
- **FE-B00** (shell UI module Bilan) — l'UI s'appuie sur le gate (états `KYC_NOT_APPROVED` / `BILAN_NOT_ENTITLED` → écrans dédiés).

**Dépendances externes :** aucune (lit des read-models Mongo déjà alimentés ; `rs0` non requis ici — aucune transaction, uniquement des `findOne`).

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche **`MNV-037`** (branchée depuis `dev`, **rebasée sur `origin/dev` avant** de coder).
- [ ] `@RequiresBilanAccess()` (décorateur, `common`) + `BilanAccessGuard` (read-models) + enregistrement `APP_GUARD` (5ᵉ) + endpoint diagnostic `GET /whoami/bilan-access`.
- [ ] Tests unitaires écrits et verts (seuils Jest 90/65/90/90) :
  - [ ] sans métadonnée → passe ; `emailVerified` faux → `EMAIL_NOT_VERIFIED`.
  - [ ] KYC absent / `UNDER_REVIEW` / `REJECTED` / `PENDING_DOCUMENTS` → `KYC_NOT_APPROVED` ; KYC `APPROVED` → check franchi.
  - [ ] entitlement absent / `SUSPENDED` / `REVOKED` → `BILAN_NOT_ENTITLED` ; `ACTIVE` → passe.
  - [ ] `tenantId` null → 403 (sans throw non géré) ; ordre de priorité des codes.
- [ ] Tests e2e verts (fixture RS256 + Mongo de test) : `200 granted` (tout OK) ; `403 KYC_NOT_APPROVED` ; `403 BILAN_NOT_ENTITLED` ; `PLATFORM_ADMIN` → 403 ; sans token → 401.
- [ ] ESLint **0 warning**, build image `runtime` OK, `/health` toujours 200.
- [ ] **Vérification docker bout-en-bout** réalisée (403 KYC → approbation → 403 entitlement → octroi → 200 → révocation → 403, via kyc/catalog réels) et consignée en §Revue & validation.
- [ ] CI verte (matrice 5 services + `bilan_service_test`).
- [ ] `/code-review` passé.
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR `MNV-037(bilan-service): …` ouverte puis intégrée sur `dev` en **Rebase and merge**.
- [ ] `sprint-status.yaml` mis à jour (STORY-037 → done, note de vérification) ; statut `bilan-service` mis à jour.

---

## Story Points Breakdown

- **Backend :** 2 points (décorateur métadonnée + guard 3-checks lisant 2 read-models + enregistrement chaîne de guards + endpoint diagnostic gardé + constantes codes).
- **Frontend :** 0 point.
- **Testing :** 1 point (unitaires exhaustifs du guard — tous les codes/ordre/fail-closed — + e2e HTTP forgé + semis read-models + vérif docker).
- **Total :** 3 points.

**Rationale :** logique **concentrée et déterministe** (trois checks locaux, aucune I/O réseau, aucune écriture), s'appuyant sur des read-models **déjà** livrés (STORY-036) ; la valeur est dans la **rigueur du contrat** (codes explicites, ordre de priorité, fail-closed, `tenantId` null) et sa **couverture de tests**. Conforme à l'estimation du sprint-plan (3 pts). La complexité suivante (chargement de référentiel, moteur) est portée par STORY-038.

---

## Additional Notes

- **FR-007 rejoué, pas réinventé.** Le contrat (emailVerified + KYC + entitlement, codes, zéro appel réseau) est **repris tel quel** de `architecture-bilan-service-2026-07-07.md` §Gate d'accès (lignes 218-229) et §AccessGate. La seule substitution vs `expert-comptable` : **abonnement → entitlement `ACTIVE`** (**B4/C5**).
- **Cohérent avec le RBAC existant.** Le gate **complète** `@Roles` sans le remplacer : `@Roles` filtre le **rôle**, `@RequiresBilanAccess` filtre l'**état de l'org** (KYC/entitlement). Les deux se cumulent sur les opérations Bilan.
- **Provisoire assumé.** L'endpoint `bilan-access` est un **harnais de preuve** (comme `whoami`) ; il disparaîtra avec l'arrivée des contrôleurs Bilan réels (EPIC-009+), où `@RequiresBilanAccess` ornera les vraies opérations.
- **Alignement architecture.** Codes (`EMAIL_NOT_VERIFIED`/`KYC_NOT_APPROVED`/`BILAN_NOT_ENTITLED`), noms de read-models et statuts requis (`APPROVED`/`ACTIVE`) **repris tels quels** de la doc d'archi — pas de dérive de contrat.

---

## Progress Tracking

**Status History :**
- 2026-07-14 : Créée par Scrum Master (BMAD create-story)

**Actual Effort :** TBD (renseigné pendant/après l'implémentation)

---

## Revue & validation

### Implémentation

FR-007 **rejoué en relying party**, conforme à l'architecture (§Gate d'accès) :

- **`@RequiresBilanAccess()`** (`common/decorators/requires-bilan-access.decorator.ts`) — métadonnée pure (`REQUIRES_BILAN_ACCESS_KEY`), aucune dépendance Mongo.
- **`BilanAccessGuard`** (`modules/read-models/guards/bilan-access.guard.ts`, co-localisé avec les read-models) — **5ᵉ `APP_GUARD`** (`Throttler → Jwt → EmailVerified → Roles → **BilanAccess**`), **no-op** hors des routes décorées (patron `RolesGuard`). Trois checks **ordonnés** (premier échec = code renvoyé) : `emailVerified` (claim) → `OrgKycStatus.status == APPROVED` → `OrgBilanEntitlement.status == ACTIVE`, lus via `findOne().lean()` — **zéro appel réseau** (P4/B3). **Fail-closed** : read-model absent = refus. `tenantId` null/invalide (`PLATFORM_ADMIN`, `org` null) → `BILAN_NOT_ENTITLED` sans throw non géré. Codes `ForbiddenException({ message, code })`.
- **`AllExceptionsFilter`** — propage désormais `{ code }` dans le corps 403 (ajout **rétro-compatible** : `code` omis si absent, format des autres erreurs inchangé).
- **Endpoint diagnostic gardé provisoire** `GET /whoami/bilan-access` (`@Roles(TENANT_ADMIN, TENANT_USER)` + `@RequiresBilanAccess()`) → `200 { access: 'granted', org }`. Sonde du gate (comme `whoami`), retirée à l'arrivée des contrôleurs Bilan (EPIC-009+).

Le guard s'instancie dans le contexte d'`AppModule` (modèles résolus via les exports `MongooseModule` de `ReadModelsModule`) — aucun cycle.

### Qualité

- **ESLint** : 0 warning (`--max-warnings 0`). **Build** `nest build` OK.
- **Tests unitaires** : **98** tests / 17 suites verts (16 nouveaux pour le guard). Couverture `bilan-access.guard.ts` = **100 %** (stmts/branches/funcs/lines) ; seuils globaux 90/65/90/90 tenus. Cas : no-op sans métadonnée, 3 checks OK, chaque code d'échec, **ordre de priorité** (e-mail non vérifié gagne sur entitlement révoqué), `tenantId` null/non-ObjectId → `BILAN_NOT_ENTITLED`, fail-closed sur read-model absent, court-circuit KYC avant entitlement, corps `{ message, code }`.
- **E2E** (`test/bilan-access.e2e-spec.ts`) : **17** tests / 3 suites verts. Chaîne réelle `Jwt → EmailVerified → Roles → BilanAccess` + `JwtStrategy` RS256/JWKS (fixture) + `AllExceptionsFilter` monté (prouve que le **`code`** survit au filtre). Cas : 200 `granted` (TENANT_ADMIN + TENANT_USER), 403 `KYC_NOT_APPROVED` (UNDER_REVIEW/absent), 403 `BILAN_NOT_ENTITLED` (REVOKED/absent), e-mail non vérifié → 403 (EmailVerifiedGuard amont), PLATFORM_ADMIN → 403 (RolesGuard amont), sans jeton → 401.

### Vérification docker bout-en-bout (2026-07-14)

Stack `auth:3001` + `platform-catalog-service:3003` + `kyc:3002` + `bilan:3004` + `mongo` (rs0) + `kafka` (`bilan-service` rebâti sur `MNV-037` ; route `GET /api/v1/whoami/bilan-access` mappée). Org tenant fraîche (register → verify Mailhog → login RS256, `emailVerified=true`, `aud` incl. `bilan-service`) :

- **(a)** sans KYC (org absente des read-models) → **403 `KYC_NOT_APPROVED`** (fail-closed).
- **(b)** read-model KYC semé `APPROVED` (pipeline `kyc.status.changed` déjà prouvé bout-en-bout en STORY-036) → **403 `BILAN_NOT_ENTITLED`** (KYC ok, entitlement absent).
- **(c)** `PUT /catalog/entitlements/{org}/bilan` (PLATFORM_ADMIN, `2.0` + `syscohada-revise@2.1`) → `entitlement.changed` (outbox catalog) → projection `OrgBilanEntitlement ACTIVE` (~1 s) → **200 `{ access: 'granted' }`**.
- **(d)** `DELETE /catalog/entitlements/{org}/bilan` → `entitlement.changed(REVOKED)` → projection `REVOKED` (~2 s) → **403 `BILAN_NOT_ENTITLED`**.

Les transitions `ACTIVE`↔`REVOKED` passent par le **vrai pipeline Kafka** (catalog outbox → consumer bilan STORY-036) : le gate ouvre/ferme l'accès en quelques secondes (fraîcheur B3), `code` présent dans chaque 403 (`AllExceptionsFilter`).

### `/code-review` (high) — 3 constats, 0 bug de correction

- **#1 (par conception) — `emailVerified` masqué** : `EmailVerifiedGuard` (3ᵉ) 403 avant `BilanAccessGuard` (5ᵉ) sur toute route non `@AllowUnverified` ⇒ la branche `EMAIL_NOT_VERIFIED` du gate n'est atteignable qu'en `@RequiresBilanAccess` + `@AllowUnverified` (aucune aujourd'hui). **Conservé** : rejeu FR-007 auto-suffisant + défense en profondeur + testable isolément (documenté §Notes techniques).
- **#2 (accepté) — `EMAIL_NOT_VERIFIED_MESSAGE` dupliqué** entre `email-verified.guard.ts` et `bilan-access.guard.ts` (textes volontairement distincts). Constantes module-locales ; factorisation non justifiée (K4).
- **#3 (accepté, théorique) — `Types.ObjectId.isValid`** laxiste (12 car. quelconques passent) : un `tenantId` de 12 car. non-hex construirait un ObjectId non-matchant → `403 BILAN_NOT_ENTITLED` (**fail-closed**, non exploitable). L'`org` vient d'un claim JWT signé (toujours 24-hex).

### Points d'attention

- **Cohérence éventuelle** : une approbation KYC / un octroi d'entitlement « à l'instant » peut ne pas être encore projeté ⇒ 403 transitoire légitime (fenêtre ~secondes) ; révocation fermée tout aussi vite. Fraîcheur des read-models à surveiller (lag conso, archi §Risques #4).
- **Aucune régression** : ajout d'un guard global no-op hors routes décorées + endpoint diagnostic ; `/health` inchangé (200), read-models non modifiés (lecture seule), pas de nouvelle dépendance, `rs0` non requis par le gate (aucune transaction).
- **Cadre provisoire** : `@RequiresBilanAccess` n'orne qu'un endpoint diagnostic tant que le domaine Bilan n'existe pas ; il sera posé sur les opérations réelles en EPIC-009+.

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
