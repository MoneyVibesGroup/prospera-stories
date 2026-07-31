# STORY-142 : `platform-catalog-service` — index inverse des entitlements : quelles organisations utilisent un module, et dans quelle version

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` · **STORY-032** (catalogue) · **STORY-033** (entitlements + index `{organizationId, moduleCode}`) · **STORY-140** (`catalog:read`)
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** medium
**Statut :** done
**Clôturée le :** 2026-07-29
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-28
**Sprint :** 18
**Service :** `platform-catalog-service` (:3003) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-142`

> **Arbitrage pris au lancement (2026-07-29), avant tout code — la permission de garde.**
>
> Le périmètre demandait `catalog:read` sur les deux nouvelles routes. **Retenu : `org:read`.**
>
> La donnée renvoyée — *quelles organisations détiennent quel module, dans quelle version, avec quel
> statut* — **est** de la donnée d'organisation, pas du catalogue. Or le **sens direct** de la même
> information (`GET /entitlements/:orgId`) est gardé par **`org:read`** via `assertCanReadOrg`. Garder
> le sens inverse par `catalog:read` aurait créé une **asymétrie d'autorisation sur une donnée
> identique** : un porteur de `catalog:read` **sans** `org:read` aurait pu énumérer le parc client
> module par module — précisément ce que le sens direct lui refuse. Un attaquant emprunte toujours la
> porte la plus faible ; il ne doit pas y en avoir deux.
>
> **Le besoin du PO n'en souffre pas** : les 3 rôles métier seedés par STORY-140
> (`PLATFORM_ACCOUNTANT`, `PLATFORM_MARKETING`, `PLATFORM_EXECUTIVE`) portent **tous** `org:read`, tout
> comme `PLATFORM_SUPPORT`, `PLATFORM_AUDITOR` et `PLATFORM_KYC_OFFICER`. Aucun persona existant ne
> perd l'accès visé.

---

## Contexte

Le PO veut, **depuis un module du catalogue**, ouvrir la liste des organisations qui l'utilisent et
voir **quelle version** chacune utilise.

**Ce qui manque, vérifié sur `origin/dev` (`89d6eb9`).** Les entitlements ne se lisent aujourd'hui
que **par organisation** :

| Route existante | Sens |
|---|---|
| `GET /entitlements/:orgId` | tous les modules d'**une org** |
| `GET /entitlements/:orgId/:moduleCode` | un couple précis |

Et les index confirment que c'est délibéré :
```
EntitlementSchema.index({ organizationId: 1, moduleCode: 1 }, { unique: true });
EntitlementSchema.index({ organizationId: 1 });
```
**Aucun index sur `moduleCode` seul.** Interroger « toutes les orgs qui ont le module `bilan` »
provoquerait aujourd'hui un **collection scan**. La lecture inverse n'a jamais été un cas d'usage —
elle le devient avec AP-10.

---

## Périmètre

**Inclus :**
- **Index** `EntitlementSchema.index({ moduleCode: 1 })`.
- **Endpoint** `GET /entitlements/by-module/:moduleCode`, permission **`org:read`** (voir l'arbitrage
  en tête : `catalog:read` aurait été plus faible que le sens direct sur la même donnée) :
  - **paginé** (`page`, `pageSize`, défaut 25, plafond 100) — un module populaire concernera des
    milliers d'organisations ;
  - filtre optionnel `?status=ACTIVE|SUSPENDED|REVOKED`, défaut **toutes** (l'admin veut voir les
    révocations, c'est le signal intéressant) ;
  - réponse : `{ items: [{ organizationId, versionCode, referentiel?, status, updatedAt }], total, page, pageSize }`.
- **Agrégat de répartition** `GET /entitlements/by-module/:moduleCode/summary` : `{ total, byVersion: [{version, count}], byStatus: [{status, count}] }` — c'est ce qui alimente la colonne « versions utilisées » d'AP-04 sans charger la liste entière.

**Hors périmètre :**
- Le **nom** des organisations. `organizationId` est **opaque** ici (décision STORY-033, jamais de
  jointure vers `auth-service`). La résolution des noms est le travail du BFF → **STORY-143**.
- L'UI → **AP-10**.

---

## Le point à trancher : la place de la résolution des noms

Renvoyer `organizationId` nu oblige le front à N appels pour afficher N noms. Trois options :

- **(a) `platform-catalog` appelle `auth-service`** — rompt l'opacité posée par STORY-033 et crée un
  couplage synchrone entre deux services qui n'en avaient pas. **Refusé.**
- **(b) Le BFF compose** — il parle déjà aux deux amont, c'est sa raison d'être (patron STORY-047).
  **Retenu**, porté par STORY-143.
- **(c) Dénormaliser le nom dans `Entitlement`** — crée une copie à réconcilier à chaque renommage
  d'organisation. **Refusé** pour un besoin d'affichage.

---

## Critères d'acceptation

- [ ] `GET /entitlements/by-module/bilan` renvoie les organisations concernées avec `versionCode` et `status`.
- [ ] La réponse est paginée ; `pageSize > 100` est plafonné à 100.
- [ ] `?status=ACTIVE` filtre correctement ; sans filtre, les `REVOKED` sont **inclus**.
- [ ] Un `moduleCode` inexistant au catalogue → **404** (et non une liste vide, qui masquerait une faute de frappe).
- [ ] `/summary` renvoie la répartition par version et par statut, cohérente avec la liste.
- [ ] L'index `{ moduleCode: 1 }` existe ; un `explain()` sur la requête montre un **IXSCAN**, pas un COLLSCAN — tracé dans la PR.
- [ ] Un acteur sans `org:read` → **403** (arbitrage en tête de story). En particulier : un porteur de
      `catalog:read` **seul** est refusé, et un `TENANT_ADMIN` aussi — sinon il énumérerait le parc
      client, ce que le sens direct lui refuse déjà.
- [ ] Aucune donnée d'organisation autre que l'`organizationId` n'est renvoyée.
- [ ] **Mutation-test de l'ordre des routes** : déplacer `by-module/:moduleCode` **après** `:orgId`
      doit faire virer au rouge le test dédié — sinon ce test ne protège rien.

---

## Notes techniques

| Élément | Fichier | Nature |
|---|---|---|
| Index | `src/modules/entitlements/schemas/entitlement.schema.ts` | Modifié |
| Service | `src/modules/entitlements/services/entitlements.service.ts` | Modifié |
| Contrôleur | `src/modules/entitlements/controllers/entitlements.controller.ts` | Modifié |

**Vigilance :**
- **Ordre des routes Nest** : `by-module/:moduleCode` doit être déclaré **avant** `:orgId`, sinon
  `by-module` sera capté comme un `orgId`. Piège classique, à couvrir par un test.
- L'index supplémentaire coûte en écriture sur une collection à fort volume d'upsert
  (`PUT /:orgId/:moduleCode` est idempotent et rejoué) — acceptable, mais à noter.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts.
- [ ] `lint` / `typecheck` / `test` / `build` verts.
- [ ] OpenAPI à jour.
- [ ] Preuve `explain()` (IXSCAN) tracée.
- [ ] Branche `MNV-142`, PR vers `dev`.

---

## Progress Tracking

| Phase | État |
|---|---|
| ① Story cadrée (garde `org:read`) | ✅ |
| ③ Développement | ✅ |
| ④ Portes DoD + 4 mutation-tests + vérif docker | ✅ |
| ⑥ Revue de code | ✅ aucun défaut de correctness ; 2 vérifications manquantes ajoutées |
| ⑦ Revue de sécurité | ✅ aucune vulnérabilité |
| ⑧ Rebase-merge | ✅ PR #9, branche supprimée |

### ③ Choix d'implémentation

**Index `{ moduleCode: 1, status: 1 }`, et non `{ moduleCode: 1 }`.** Le filtre `?status=` est le cas
courant de l'écran AP-10, et la **règle du préfixe gauche** laisse le même index servir aussi les
requêtes sur `moduleCode` seul : **un** index couvre les deux, là où deux index doubleraient le coût
d'écriture sur une collection à fort volume d'upsert rejoué.

**Tri total `{ updatedAt: -1, organizationId: 1 }`.** `updatedAt` seul n'est pas unique — un lot
d'octrois partage la même milliseconde, et deux pages successives pourraient alors **répéter ou
sauter** une ligne. Prouvé en docker : 10 pages de 25 sur 250 lignes → 250 distinctes, aucun doublon,
couverture complète.

**Projection étroite.** Ni `config` (feature flags et quotas négociés d'un client), ni `grantedBy`, ni
`source` : « quelles organisations utilisent ce module » n'a aucune raison de les révéler.

### ④ Portes DoD

Lint 0 warning · build ✅ · couverture **99,86 L / 100 F / 93,78 B** — `entitlements.service.ts` et
`entitlements.controller.ts` à **100 %** · 251 unitaires + 75 e2e ✅

### ④ Mutation-tests

| # | Mutation appliquée | Résultat |
|---|---|---|
| M1 | `by-module/:moduleCode` déclaré **après** `:orgId` | 🔴 **10 e2e** — la route est captée comme un `orgId` |
| M2 | `@RequirePermissions(ORG_READ)` retiré des 2 handlers | 🔴 1 unitaire + 3 e2e — un `TENANT_USER` lit alors le parc client |
| M3 | Décalage de pagination (`page × pageSize`) | 🔴 2 unitaires |
| M4 | Repli `?? 0` retiré sur un `$count` vide | 🔴 2 unitaires |

### ④ Vérification docker — Mongo réel, 250 entitlements sur `bilan`

**Preuve 1 — l'index existe vraiment** (`mongosh catalog_service`, `db.entitlements.getIndexes()`) :

```
{"organizationId":1,"moduleCode":1}  unique=true
{"organizationId":1}
{"moduleCode":1,"status":1}          ← STORY-142
```

**Preuve 2 — `explain("executionStats")` : IXSCAN, pas COLLSCAN** (le critère de la story) :

| Requête | Étapes | Index retenu |
|---|---|---|
| `{ moduleCode: 'bilan' }` | `SORT ← FETCH ← IXSCAN` | `moduleCode_1_status_1` |
| `{ moduleCode: 'bilan', status: 'ACTIVE' }` | `SORT ← FETCH ← IXSCAN` | `moduleCode_1_status_1` |

⚠️ **Observation mesurée, tracée volontairement : le `SORT` est bloquant.** Aucun index ne couvre le
tri `updatedAt`, donc les lignes du module sont triées **en mémoire** après l'`IXSCAN`. L'`IXSCAN`
joue quand même son rôle — il restreint aux lignes **de ce module** au lieu de balayer toute la
collection — mais le tri, lui, porte sur l'ensemble du module.
Vérifié sur le serveur : `allowDiskUseByDefault: true` et
`internalQueryMaxBlockingSortMemoryUsageBytes = 104857600` (100 Mo) → au-delà, le tri **déborde sur
disque**, il n'échoue pas. C'est donc une **dégradation**, pas une panne.
**Seuil de déclenchement** : si un module dépasse quelques dizaines de milliers d'organisations,
ajouter `{ moduleCode: 1, updatedAt: -1 }` (le tri devient servi par l'index) — non fait ici, ce
serait un 3ᵉ index posé sur une hypothèse de volume qu'aucune donnée n'appuie aujourd'hui.

**Preuve 3 — les endpoints, contre Mongo réel** (250 lignes : 200 en `2.0`, 50 en `3.0` ; 240
`ACTIVE`, 10 `REVOKED`) :

| Requête | Résultat |
|---|---|
| `GET by-module/bilan` | `total: 250`, `page: 1`, `pageSize: 25`, 25 items |
| clés d'un item | exactement `organizationId`, `versionCode`, `status`, `updatedAt` — **ni** `config`, **ni** `grantedBy`, **ni** `source` |
| `?pageSize=5000` | `pageSize: 100` — **plafonné**, pas rejeté |
| `?page=0` | **400** |
| `?status=ACTIVE` / `?status=REVOKED` | 240 / 10 |
| sans filtre | **250** — les `REVOKED` sont bien **inclus** |
| `?page=99` | 0 item, `total: 250` (pas d'erreur) |
| `by-module/bilans` | **404** « Le module « bilans » n'existe pas au catalogue. » |
| `by-module/bilans/summary` | **404** |

**Preuve 4 — `/summary` concorde avec le compte en base**, vérifié par agrégation `mongosh`
indépendante : `total: 250`, `byVersion: [2.0 → 200, 3.0 → 50]`, `byStatus: [ACTIVE → 240,
REVOKED → 10]`. Les deux répartitions somment au total.

**Preuve 5 — pagination sans recouvrement ni perte** : 10 pages de 25 parcourues → **250 lignes, 250
distinctes, couverture complète**. C'est ce que le tri total garantit.

**Preuve 6 — la garde `org:read`, sur jetons réels :**

| Porteur | `roles` / `perms` | `by-module` | `summary` |
|---|---|---|---|
| `PLATFORM_ACCOUNTANT` | `["PLATFORM_ACCOUNTANT"]` / `["org:read","catalog:read"]` | **200** | **200** |
| `TENANT_USER` | `["TENANT_USER"]` / `[]` | **403** | — |
| aucun jeton | — | **401** | — |

Le refus est générique (« Accès refusé : permission insuffisante. ») — il n'indique pas quelle
permission manque.

### ⑥ Revue de code

**Aucun défaut de correctness.** Ce que la revue a bien produit : deux vérifications que la phase ④
n'avait pas faites, et qui manquaient à la Definition of Done.

**Preuve 7 — `/summary` aussi passe par l'index.** L'`explain()` de ④ ne couvrait que les `find()` ;
or `/summary` est la requête la plus lourde des deux (elle balaye tout le module). Vérifié sur le
pipeline réel : **`IXSCAN` présent, `COLLSCAN` absent**, index `moduleCode_1_status_1` — le `$match`
en tête de pipeline sait bien l'employer.

**Preuve 8 — OpenAPI réellement à jour** (`GET /api/docs-json` sur le service qui tourne) : les deux
routes sont publiées, avec leurs paramètres (`moduleCode` requis en chemin ; `status`, `page`,
`pageSize` optionnels en requête), les réponses **200 / 401 / 403 / 404**, et les 5 schémas
(`EntitlementsByModulePageDto`, `EntitlementByModuleItemDto`, `EntitlementsByModuleSummaryDto`,
`VersionCountDto`, `StatusCountDto`).

**Points examinés sans suite** (vérifiés, pas des défauts) :
- `ModulesService.exists` ne filtre pas sur le statut : un module `DEPRECATED` reste consultable —
  **correct** pour une vue d'administration, qui doit justement voir qui reste sur un module déprécié.
- `page` n'a pas de borne haute. Le travail du serveur est borné par le nombre de lignes **du
  module**, quelle que soit la page demandée : `?page=999999999999` renvoie une page vide (200) sans
  coûter plus que `page=1`. Aucune amplification, donc aucune borne artificielle ajoutée.
- Le tri bloquant est traité plus haut, avec sa mesure et son seuil.

### ⑦ Revue de sécurité — aucune vulnérabilité

Publiée sur la PR. Points **vérifiés en exécution** contre le service réel, la story ajoutant deux
lectures **inter-organisations** :

- **Isolation multi-tenant** : `TENANT_ADMIN` → **403** sur `by-module`, **200** sur sa propre
  organisation (aucune régression) ; `TENANT_USER` → **403** ; sans jeton → **401**.
- **Pas d'oracle d'existence de module** : le guard s'exécutant avant le handler, un appelant sans
  `org:read` reçoit **403** aussi bien sur un module réel que sur un module inexistant — réponses
  strictement identiques. Le `404` n'est jamais atteint sans la permission.
- **Injection NoSQL** : `?status[$ne]=`, `?status[$gt]=`, `?page[$ne]=`, `?pageSize[$ne]=` et tout
  paramètre inconnu → **400**. `moduleCode` est un paramètre de **chemin**, donc toujours une chaîne :
  la valeur qui atteint le `$match` de l'agrégat ne peut pas être un objet.
- **Aucun élargissement de privilège** : `org:read` autorisait déjà la lecture des entitlements de
  n'importe quelle organisation ; l'index inverse rend l'information commode sans ouvrir de classe de
  donnée nouvelle à ce porteur.
- **DoS** : `pageSize` plafonné au bord ; `page` invalide → 400 ; `page` non borné mais **non
  amplifiant** ; throttler actif sur ces routes (constaté : **429** pendant l'amorçage du jeu d'essai).
