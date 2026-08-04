# STORY-181 : Le BFF admin ne décrit **aucun champ** — ni sur la fiche d'organisation, ni sur les trois routes RBAC

**Epic :** EPIC-016 — Chaîne KYC complète (admin-panel)
**Réf. :** ticket §C · **AP-02** *(fiche détail)* · **AP-08** *(RBAC plateforme — son AC nº 12 exige des types générés)* · **STORY-047** *(vue agrégée des organisations)* · **STORY-104/106** *(catalogue de permissions, rôles, invitation org-less)* · **STORY-132** *(le même symptôme sur `SessionResponseDto`)*
**Découverte par :** AP-INT-1, en auditant les types générés de la console — **§B élargi le 2026-08-04**
**Priorité :** Should Have
**Story Points :** 3 *(⬆️ 2→3 le 2026-08-04, voir §B)*
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 20
**Service :** `prospera-admin-panel-service` (`:3010`)

---

## A. Le constat d'origine — la fiche d'organisation

Les trois blocs de la fiche détail sont déclarés en `type: Object` :

```ts
// admin-panel/src/admin/orgs/dto/admin-org-detail.dto.ts:18-39
@ApiProperty({ description: 'Identité + membres (auth). Toujours présente.', type: Object })
identity!: OrganizationDetail;          // ⚠️ le type TS est juste ; le Swagger ne le voit pas
```

`openapi-typescript` en tire donc, pour les trois, un `Record<string, never>` — un type qui
n'autorise **aucune** propriété *(`frontend-admin-panel/src/types/api/admin.ts:413-421)*.

**Conséquence :** `npm run gen:api` produit, pour cet endpoint précis, des types **inutilisables**.
Le client les recaste à la main :

```ts
// frontend-admin-panel/src/features/orgs/api/orgs-client.ts
const identity = dto.identity as { orgId?: string; name?: string; country?: string; … } | undefined;
```

Et toute la valeur du contrat généré — **qu'un renommage amont casse la compilation du front** —
disparaît sur **le seul écran qui agrège trois services**, c'est-à-dire celui qui a le plus de
raisons de bouger.

> ⚡ **Troisième occurrence du même motif dans ce dépôt.** `STORY-132` traite exactement ça sur
> `SessionResponseDto` *(`userAgent`/`ip` réfléchis en `Object`)*, et FE-024 l'avait relevé sur
> `paquetFiscal`/`stamp`. Ce n'est pas un oubli isolé, c'est un **patron de décorateur** à connaître :
> dès que le type TS n'est pas une classe que Nest peut réfléchir, le Swagger publie un objet informe.

---

## B. ⚡ Élargissement du 2026-08-04 — les trois routes RBAC sont **pires** que la fiche

En préparant AP-08, le même audit a été passé sur les routes RBAC du **même service**. Elles ne
souffrent pas du `type: Object` — elles souffrent de **rien du tout** :

```ts
// frontend-admin-panel/src/types/api/admin.ts — 200 des trois routes
AdminRolesController_getPermissionCatalog_v1: { responses: { 200: { content?: never } } };
AdminRolesController_listRoles_v1:            { responses: { 200: { content?: never } } };
AdminUsersController_listUsers_v1:            { responses: { 200: { content?: never } } };
```

`content?: never` ne veut pas dire « objet informe », il veut dire **« cette route ne renvoie
rien »**. C'est un cran au-dessous du §A : là où `Record<string, never>` force un cast, `never`
force le front à **écrire le type à la main**, c'est-à-dire à revenir exactement à ce que
l'Integration Gate a mis un sprint à supprimer.

**⚠️ Le grep de la DoD ne les aurait pas trouvées.** `grep 'type: Object'` cherche un décorateur
*mal renseigné* ; ici il n'y a **aucun `@ApiResponse({ type: … })`** sur les 200. Deux symptômes,
deux recherches — c'est précisément pour ça que l'élargissement est écrit plutôt que laissé à
l'audit.

**Ce que ça bloque, nommément :** l'**AC nº 12 d'AP-08** exige que « le contrat consommé soit
**généré depuis l'OpenAPI**, pas écrit à la main ». Avec ces trois routes muettes, AP-08 est
**infaisable dans les règles qu'elle se donne** — et c'est la story qui porte les rôles internes
Comptable / Marketing / DG demandés par le PO.

> 🪤 Ironie à consigner : STORY-104 a exposé les 8 permissions **avec leurs libellés** en écrivant
> noir sur blanc que « le panel a besoin des libellés, pas d'un `string[]` nu ». Ces libellés sont
> bien servis — et **invisibles du contrat**. La donnée a été soignée, sa description a été oubliée.

---

## Périmètre

### A. Fiche d'organisation

Typer les trois propriétés d'`AdminOrgDetailDto` avec de vrais `@ApiProperty({ type: … })` :

| Propriété | Type à exposer |
|---|---|
| `identity` | `OrganizationDetailDto` *(identité + membres)* |
| `kyc` | `KycDetailDto`, `nullable` |
| `entitlements` | `EntitlementDto[]`, `nullable` |

### B. Routes RBAC

Déclarer le **type de réponse** des trois 200, avec des classes DTO décorées :

| Route | Type à exposer |
|---|---|
| `GET /admin/permissions` | `PlatformPermissionDto[]` — `{ value, description }`, les 12 entrées du catalogue |
| `GET /admin/roles` | `PlatformRoleDto[]` — `{ name, permissions[], description?, isSystem }` |
| `GET /admin/users` | `PaginatedPlatformUsersDto` — `{ items: PlatformUserDto[], total, page, limit }` |

⚠️ **`isSystem` doit figurer au contrat** : AP-08 en dépend pour rendre les rôles système en lecture
seule *(AC nº 5)*. Un champ que le front doit deviner est un champ qu'il finira par oublier.

⚠️ **Vérifier au passage que la fuite de champs internes Mongo est bien fermée.** STORY-104 avait
corrigé `_id` / `__v` / `createdAt` / `updatedAt` dans les réponses `/admin/roles` — un défaut
invisible en unitaire, trouvé en docker. Déclarer le DTO est l'occasion de **prouver** que la
sérialisation est propre, pas de le supposer.

⚠️ **Le BFF possède déjà toutes ces formes** — contrats amont
*(`src/upstream/contracts/*.contract.ts`)*. Il ne manque que leur **projection Swagger** : des classes
DTO décorées, pas de nouvelles données ni de nouvelle logique.

### Hors périmètre

Changer la **forme** servie. Cette story rend visible ce qui est déjà renvoyé ; elle ne renomme rien
et n'ajoute aucun champ. ⚠️ Si la projection révèle un écart entre le contrat amont et ce que le BFF
relaie réellement, **le tracer** — ne pas le corriger au passage.

⚠️ **Les routes d'écriture RBAC** (`POST /admin/roles`, `PATCH|DELETE /admin/roles/:name`,
`POST /admin/users`, `PATCH /admin/users/:id`) : leurs **corps de requête** sont déjà typés
*(`CreatePlatformRoleDto`, `InvitePlatformUserDto`…)*. Seules leurs **réponses** sont muettes — à
traiter **si et seulement si** c'est le même geste de décoration. Sinon, tracer.

---

## Critères d'acceptation

**A — fiche d'organisation**

1. `/api/docs-json` décrit les trois blocs avec leurs propriétés, plus aucun `Record<string, never>`.
2. `npm run gen:api` côté console produit des types **exploitables** pour `GET /admin/orgs/:orgId`.
3. Les `nullable` sont préservés : `kyc` et `entitlements` restent nullables *(la dégradation par
   source en dépend — `null` n'y est pas une erreur)*.

**B — routes RBAC**

4. `/api/docs-json` décrit le 200 des trois routes RBAC ; **plus aucun `content?: never`** sur une
   route de lecture du BFF.
5. Les types générés portent `PlatformPermissionDto.description` *(le libellé)* et
   `PlatformRoleDto.isSystem` — les deux champs dont AP-08 dépend et que rien ne déclarait.
6. `GET /admin/users` déclare son **enveloppe paginée** *(`items` / `total` / `page` / `limit`)*, pas
   un tableau nu — supposer un tableau est l'erreur exacte qui a produit un
   `.map is not a function` sur la file KYC en AP-INT-1.
7. ⚡ Aucun champ interne Mongo (`_id`, `__v`) n'apparaît dans les réponses **ni au contrat**,
   vérifié en docker et pas seulement en unitaire *(leçon STORY-104)*.

**Transverses**

8. Aucun changement de la réponse : un enregistrement avant/après est **identique octet pour octet**,
   sur les quatre routes.
9. ⚡ Vérification côté console : les casts manuels d'`orgs-client.ts` sont **supprimés**, et le
   typecheck passe sans eux — c'est la seule preuve que le contrat protège vraiment quelque chose.

---

## Definition of Done

- [ ] Les 9 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ Un **audit des DEUX motifs** sur tout `src/` du BFF, parce qu'ils ne se cherchent pas de la
      même façon : `grep 'type: Object'` *(§A — décorateur mal renseigné)* **et** un relevé des routes
      **sans `@ApiResponse({ type })`** sur leur code de succès *(§B — décorateur absent)*. Chaque
      occurrence restante est soit corrigée, soit justifiée par écrit.
- [ ] ⚡ **AP-08 est débloquée** : son AC nº 12 *(contrat généré, pas écrit à la main)* devient
      atteignable — c'est le signal que le §B est soldé
- [ ] Ticket de suivi côté console pour retirer les casts *(la story backend seule ne les enlève pas)*
- [ ] Branche `MNV-181`, PR rebase-mergée sur `dev`
