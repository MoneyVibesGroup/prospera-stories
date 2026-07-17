# STORY-107 : admin-panel — route de file de revue KYC (proxy `GET /admin/kyc?status=`) enrichie du nom d'organisation

**Epic :** EPIC-016 — Chaîne KYC complète (admin-panel)
**Service :** `admin-panel` (BFF, :3010)
**Points :** 3
**Sprint :** 10 (à tirer **avec STORY-106** — même dépôt, même famille de contrôleurs)
**Statut :** not_started
**Demandeur :** frontend — **prérequis de AP-03** (revue KYC), frontend sprint 4
**Origine :** audit des 7 dépôts backend du 2026-07-17

---

## Pourquoi cette story existe

Le frontend **AP-03** doit afficher **la file de revue KYC** : « les dossiers en attente d'instruction ».
Aujourd'hui, le BFF ne peut pas la servir, et **la contourner côté front serait faux**.

### Ce qui existe déjà (vérifié dans le code, ne pas re-livrer)

- `kyc-service` **sait déjà filtrer sa file** : `GET /admin/kyc?status=UNDER_REVIEW`
  (`AdminKycQueryDto.status`, validé par enum ; « absent → tous les dossiers »).
- Le BFF **consomme déjà** cette file : `KycServiceClient.listReviewQueue()` → `GET /admin/kyc`…
  **mais sans le paramètre `status`**, car il s'en sert pour construire un *index* d'enrichissement
  (`buildKycStatusIndex` → `Map<orgId, status>`), pas pour servir une file.
- La liste d'orgs enrichit bien chaque ligne d'un `kycStatus` (`AdminOrgListItemDto.kycStatus`).

### Pourquoi la liste d'orgs ne peut PAS servir de file de revue

`OrgAggregationService.listOrgs` est explicite : **la page est pilotée par `auth`**
(`fetchOrganizationsPage` → `auth.listOrganizations(query)`), puis enrichie du KYC *après coup*. Et
`ListOrgsQueryDto.status` porte sur l'**identité** (`IDENTITY_STATUSES = ACTIVE | SUSPENDED`), pas sur le KYC.

Conséquence : le `kycStatus` est un enrichissement **post-pagination**. Deux contournements, tous deux mauvais :

1. **Filtrer côté front à travers la pagination** — faux par construction : une page de 20 orgs peut ne
   contenir aucun dossier `UNDER_REVIEW` alors que la file n'est pas vide. L'agent croirait avoir tout traité.
2. **Ajouter `kycStatus` à `ListOrgsQueryDto`** — ⚠️ **c'était ma demande initiale, et c'est la mauvaise
   forme** : filtrer sur un champ enrichi *après* une pagination déléguée à `auth` obligerait le BFF à
   rapatrier **toutes** les orgs, fusionner, filtrer, puis re-paginer lui-même — ce qui **inverse la source
   de vérité de la pagination** et casse l'invariant « `auth` pilote la page ». Un correctif d'architecture
   pour un besoin de lecture : disproportionné.

**La bonne forme est l'inverse** : pour une file de revue, c'est le **KYC qui pilote la liste** — et
`kyc-service` sait déjà le faire. Il ne reste qu'à l'exposer.

---

## Portée

- **Nouvelle route de lecture** dans le BFF (nom à arbitrer à la rédaction, p. ex.
  `GET /api/v1/admin/kyc-reviews?status=`) qui **relaie** `GET /admin/kyc?status=` de `kyc-service`.
- **Permission** : `@RequirePermissions(Permission.ORG_READ)` — cohérent avec `KycAdminController`
  amont (STORY-105) et avec la lecture d'orgs. ⚠️ Dépend de **STORY-106** pour les guards par permission
  du BFF ; à tirer ensemble.
- **Enrichissement du nom d'org** : `KycReviewItem` ne porte que `{ orgId, status, submittedAt,
  reviewedAt, updatedAt }` — un agent ne peut pas travailler sur des `orgId` opaques. Joindre la raison
  sociale depuis `auth`. **Dégradation** : si `auth` est indisponible, servir la file **sans** les noms
  (`sources` le signale) plutôt que de tomber — patron de dégradation partielle déjà posé par STORY-047.
- **Le BFF ne décide/valide/persiste RIEN** (invariant AD-2) : il relaie et joint.

### Questions à trancher à la rédaction

1. **Pagination** : la file amont n'est **pas** paginée (`AdminKycReviewItemDto[]` complet). Le BFF
   pagine-t-il ? Volume actuel faible (~74 orgs) → acceptable de servir la liste complète en v1, **à
   condition de le documenter** comme dette assumée, pas de le découvrir plus tard.
2. **Enrichissement du nom** : N+1 borné par la taille de la file, ou un appel de liste `auth` unique
   puis jointure en mémoire ? (`buildEntitlementCounts` assume déjà un N+1 borné à la page — précédent.)
3. **Nom de la route** : `/admin/kyc-reviews` vs `/admin/orgs?view=kyc-queue`. Préférence : une route
   distincte, parce que la **source de pagination diffère** (kyc vs auth) — la confondre avec la liste
   d'orgs rejouerait exactement l'ambiguïté que cette story corrige.

---

## Critères d'acceptation

1. `GET …?status=UNDER_REVIEW` renvoie **exactement** les dossiers en attente de revue (aucun dossier
   d'un autre statut), quel que soit le volume — **sans** filtrage côté client.
2. Sans `status`, la file complète est renvoyée (miroir du contrat amont).
3. Un `status` hors enum → **400** (validation au bord, miroir de `AdminKycQueryDto`).
4. Chaque item porte la **raison sociale** de l'org en plus de l'`orgId`.
5. **Dégradation** : `auth` down → la file est servie sans les noms, `sources` le signale ; **jamais** un 5xx
   pour un enrichissement manquant. `kyc-service` down → **503** (source primaire de cette vue).
6. **Permissions** : un porteur de `org:read` accède ; sans la permission → **403** ; sans token → **401**.
7. Aucune donnée persistée, aucune décision KYC prise par le BFF (invariant DO-1/AD-2).
8. **VÉRIF DOCKER** : org en `UNDER_REVIEW` → présente dans la file ; après `approve` (STORY-048) → **elle
   en sort** et apparaît sous `?status=APPROVED`.

---

## Impact frontend

Débloque **AP-03** (frontend sprint 4) pour de bon. Sans cette story, AP-03 reste livrable — le **détail**
d'un dossier est déjà entièrement servi par `GET /admin/orgs/:orgId` (pièces + URLs présignées + OCR
`extraction`/`ocrSummary`) — mais **la file serait fausse dès que le volume dépasse une page**, ce qui est
précisément le moment où un agent KYC en a besoin.
