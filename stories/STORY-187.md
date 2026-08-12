# STORY-187 : La file de revue KYC **n'est pas paginée** — elle rend tout, et joint tout

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. :** **AP-03** *(la file)* · **AP-07** *(la tuile « Dossiers KYC en attente » la compte)* · **STORY-107** *(la route à amender)* · **STORY-047** *(le patron : `PaginatedAdminOrgsDto`, déjà paginé)*
**Découverte par :** audit des filtres et de la pagination de la console, 2026-08-06
**Priorité :** Should Have — **rien ne casse aujourd'hui**, tout casse à l'échelle
**Story Points :** 3
**Statut :** done
**Complexité :** medium
**Créée le :** 2026-08-06
**Sprint :** 20
**Service :** `admin-panel` BFF (`:3010`) **+ `kyc-service` (`:3002`)** — cf. « Deux dépôts » ci-dessous

---

## Le constat

`GET /admin/kyc-reviews` rend une enveloppe **incomplète** :

```
GET /admin/orgs          → { items, total, page, limit, sources }   ✅
GET /admin/kyc-reviews   → { items, total,             sources }   ⚠️ ni page ni limit
```

Mesuré sur le stack, 2026-08-06 : `items: 2 · total: 2`. **La route rend la totalité de la file**, et
`total` n'est que le compte de ce qu'elle vient de renvoyer. Son `ListKycReviewsQueryDto` ne porte
qu'un `status` — aucun paramètre de page.

## Pourquoi ça compte, alors que rien ne casse

**Chaque ligne de cette file est une jointure à trois services.** C'est la raison d'être du BFF :
`kyc-service` ne rend qu'un `orgId`, et une file d'identifiants n'est pas exploitable par un humain —
le BFF y joint la raison sociale. À deux dossiers c'est gratuit. À cinq cents, chaque ouverture de
l'écran de revue déclenche cinq cents jointures, **avant le premier pixel**.

⚡ **Et le jour où quelqu'un bornera la route pour s'en protéger, le compteur mentira en silence.**
La tuile « Dossiers KYC en attente » d'AP-07 compte `queue.length` — le nombre de lignes *rendues*.
Une borne posée sans pagination la ferait plafonner à la taille de page sans qu'aucun écran ne le
signale : « 50 dossiers en attente » pour toujours, quel que soit le réel. C'est le pire des deux
mondes, et c'est l'ordre naturel des choses si cette story n'est pas faite **avant** la borne.

⚠️ La console a déjà payé ce type d'erreur : `fetchOrgs` documente que filtrer côté client casse la
pagination *(« `total` deviendrait faux et la page 2 sauterait des lignes »)*. Ici c'est le symétrique.

---

## ⚡ Deux dépôts — établi à l'ouverture (2026-08-12), non écrit au cadrage

La story est cadrée « `admin-panel` », mais **`total` réel et pagination sont impossibles au seul BFF**.
`kyc GET /admin/kyc` rend `AdminKycReviewItemDto[]` — la file **entière**, sans enveloppe. Paginer dans le
BFF sur une liste déjà intégralement rapatriée paierait le coût sans le bénéfice : c'est exactement ce que
`ListKycReviewsQueryDto` documente aujourd'hui pour justifier son absence de `page`. La tâche « paginer la
requête **amont** » l'admettait déjà à demi-mot ; on l'écrit ici.

**`kyc-service`** : `AdminKycQueryDto` reçoit `page`/`limit`, et `GET /admin/kyc` passe d'un tableau nu à
`{ items, total, page, limit }` — `total` compté séparément (`countDocuments`), jamais `items.length`.
**`admin-panel`** : consomme la nouvelle enveloppe et la traverse. Deux branches `MNV-187`, deux PR, mergées
**ensemble** (le BFF est le **seul** consommateur de cette route — vérifié : `kyc-service` n'est pas exposé).

### 🪤 Piège nº1 — la même route sert AUSSI d'index, et le tronquer serait invisible

`getReviewQueue` a **deux appelants** dans le BFF : la file (`listKycReviews`) et **`buildKycStatusIndex`**,
qui lit la file **complète, sans filtre**, pour poser la colonne `kycStatus` de `GET /admin/orgs`. Paginer
l'amont sans traiter cet appelant-là ferait disparaître le statut KYC de toute org hors de la première page
amont — **une colonne vide, aucune erreur, `sources.kyc: 'ok'`**. C'est le motif même de la story (« le
compteur mentira en silence »), déplacé d'un écran à l'autre. L'index doit donc **parcourir les pages**,
comme `buildOrgNameIndex` le fait déjà côté noms, plafond de boucle compris.

### 🪤 Piège nº2 — le tri actuel n'est PAS un ordre total

`listByStatus` trie `{ submittedAt: 1 }`, et **`submittedAt` est optionnel** : tout dossier
`PENDING_DOCUMENTS` jamais soumis le laisse `undefined`. Sur un tri non-total, Mongo ne garantit **aucun**
ordre entre ex æquo d'une requête à l'autre — sans pagination ça ne se voyait pas (une seule requête), avec
pagination ça **duplique et saute** des lignes, ce que l'AC nº4 interdit. Il faut un départage
déterministe (`_id`) et l'index compound aligné dessus.

### 📐 Direction du tri — ambiguïté de l'AC nº4, tranchée

L'AC nº4 dit « ancienneté **décroissante** », le périmètre dit « le tri par ancienneté **reste** serveur ».
L'existant est `submittedAt: 1` — **le plus ancien d'abord**, ce qui est l'ordre FIFO d'une file de revue.
Retenu : **on ne change pas la direction** (« reste » l'emporte, et inverser une file de revue serait un
changement de comportement qu'aucune ligne de la story ne demande). L'AC nº4 est lu comme portant sur la
**stabilité**, qui est son objet réel.

---

## Périmètre

**Inclus :**

- **`kyc-service`** : `page`/`limit` sur `AdminKycQueryDto`, enveloppe paginée en réponse, `total` compté
  séparément, tri départagé par `_id` + index compound aligné.
- **`admin-panel`** : `ListKycReviewsQueryDto` : `page` (défaut 1) et `limit` (défaut, **plafonné** — cf.
  `MAX_PAGE_SIZE` de `module-organizations-query.dto.ts`, valeur supérieure ramenée au plafond sans erreur).
- **`buildKycStatusIndex` parcourt les pages** (non-régression du piège nº1) — pas une extension de
  périmètre : sans cela la story *casse* `GET /admin/orgs`.
- `KycReviewQueueDto` : `page` et `limit` s'ajoutent à `items · total · sources`. **`total` devient le
  total RÉEL**, pas le compte de la page.
- **Le tri par ancienneté reste serveur.** Ce n'est pas un défaut d'affichage : c'est ce qui fait
  d'une liste une FILE. Paginer un tri client rendrait la page 2 incohérente.

**Hors périmètre :**

- Un filtre par ancienneté ou par agent — personne ne l'a demandé.
- La consommation côté console : c'est un ticket frontend à ouvrir **quand** cette story sort.

---

## Critères d'acceptation

- [ ] `GET /admin/kyc-reviews?page=&limit=` rend `{ items, total, page, limit, sources }`.
- [ ] `total` est le **total réel** de la file, indépendant de la taille de page — vérifié par un test
      qui sème plus de dossiers qu'une page n'en contient.
- [ ] `limit` est **plafonné** ; une valeur supérieure est ramenée au plafond **sans erreur**.
- [ ] Le tri par ancienneté décroissante est **stable à travers les pages** : aucun dossier vu deux
      fois, aucun sauté.
- [ ] `sources` reste servi et conserve son sens *(dégradation par source)*.
- [ ] Défauts rétro-compatibles : un appel **sans** paramètre continue de fonctionner.
- [ ] OpenAPI à jour ; tests : pagination, plafond, total réel, stabilité du tri.

---

## Tâches

- [ ] Étendre le query DTO + le DTO de réponse (AC 1, 3)
- [ ] Paginer la requête amont **et** compter séparément (AC 2)
- [ ] Garantir la stabilité du tri (AC 4)
- [ ] OpenAPI + tests (AC 7)

---

## ⚠️ Note de capacité

Le S20 passe de **72 à 75 points pour 34 de capacité**. Le slot est celui qui a été demandé.
Ordre de décalage défendable : garder **179 + 180**, décaler **181 · 185 · 186 · 187 · 188** au S21.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 5 — session unique (aucune délégation hors PR).

### Progress Tracking

**Statut : `done` le 2026-08-12** — développé + validé + vérifié en docker + revue de code
(3 constats, tous corrigés) + revue de sécurité (0 vulnérabilité). PR
[`kyc-service#18`](https://github.com/MoneyVibesGroup/prospera-kyc-service/pull/18) et
[`admin-panel#20`](https://github.com/MoneyVibesGroup/prospera-admin-panel-service/pull/20)
rebase-mergées sur `dev`, branches supprimées.

#### Portes de qualité

| | `kyc-service` | `admin-panel` |
|---|---|---|
| Lint | 0 warning | 0 warning |
| Build | OK | OK |
| Unitaires | 453 | 431 |
| E2E | 99 | 195 |
| Couverture | 94,84 / 92,17 / 94,71 / 94,81 | 99,68 / 93,02 / 100 / 99,65 |

#### Vérification docker — stack neuve (`down -v` puis `up --build`), 2026-08-12

Base `kyc_service`, collection **`tenantkycprofiles`** (⚠️ pluriel Mongoose, **pas** snake_case).
Semis : **151** dossiers `UNDER_REVIEW` au `submittedAt` **strictement identique** + **30**
`PENDING_DOCUMENTS` **sans** `submittedAt` — soit 181 documents dont **tous** sont ex æquo au tri.
Jeton `PLATFORM_ADMIN` réel (`seed:admin` + login sur l'IdP).

| # | Ce qui est prouvé | Mesure |
|---|---|---|
| ① | **AC nº2 — total réel** (amont) | `page=1&limit=10` → `items=10`, **`total=151`** |
| ② | **AC nº2 — total réel** (BFF) | idem à travers `/admin/kyc-reviews`, `sources.identity="ok"` |
| ③ | **AC nº3 — plafond sans erreur** | `limit=5000` → **HTTP 200**, `limit=100`, `items=100`, `total=181` |
| ④ | **AC nº4 — aucun doublon, aucun saut** | 16 pages × 10 → **151 vues / 151 distinctes**, 0 doublon, 0 sauté |
| ⑤ | **AC nº4 — ordre reproductible** | page 7 relue 5× → **1 seul ordre**, malgré 151 `submittedAt` identiques |
| ⑥ | Idem sur clé **ABSENTE** | 30 `PENDING_DOCUMENTS` sans `submittedAt` → 30/30, 0 doublon |
| ⑦ | **Index servant le tri** | plan `["LIMIT","FETCH","SKIP","IXSCAN"]` sur `status_1_submittedAt_1__id_1`, **aucun stage `SORT`**, 10 docs examinés pour 10 rendus |
| ⑨ | **Non-régression `GET /admin/orgs`** | 3 orgs de **rang 176-178** (page amont 2) → `kycStatus=UNDER_REVIEW` pour les 3, `sources.kyc="ok"` |

**⑧ — La contre-épreuve qui justifie le départage par `_id`.** Le même parcours paginé,
**sans** `_id` au tri, sur la file **non filtrée** (plan `COLLSCAN + SORT` en mémoire) :

```
AVEC _id  → vues=181  distinctes=181  doublons=0   sautés=0
SANS _id  → vues=181  distinctes=126  doublons=55  sautés=55
```

**55 dossiers perdus sur 181.** Ce n'est pas un risque théorique : c'est exactement le chemin
qu'emprunte `buildKycStatusIndex` (aucun filtre de statut, paginé). À noter — avec le filtre
`status`, le défaut **ne se manifeste pas** : Mongo sert alors l'index compound dont `_id` est
déjà la clé de queue, donc l'ordre y est total *par accident de plan*, pas par contrat. C'est
précisément pourquoi la garde est écrite dans le `sort` et non déléguée à l'index.

#### ⚡ Écart trouvé PAR la vérification docker (hors cadrage, corrigé)

L'index `{status, submittedAt, _id}` ne sert que la file **filtrée**. Sans filtre de statut,
`status` cesse d'être un préfixe utilisable et Mongo retombe sur `["SKIP","SORT","COLLSCAN"]` —
181 documents examinés pour en rendre 10. Or c'est le chemin de `buildKycStatusIndex`, **jusqu'à
20 pages d'affilée**, et un tri en mémoire est **plafonné à 32 Mo** : passé ce volume la requête
n'est pas lente, elle **échoue**. Un second index `{submittedAt, _id}` a été ajouté ; le même
appel repasse en `["LIMIT","FETCH","SKIP","IXSCAN"]` avec 10 documents examinés. Création par le
service au boot **vérifiée** après `docker restart`.

Stack arrêtée (`docker compose stop`) une fois la vérification consignée.

#### Revue de code — 3 constats, tous corrigés (commit dédié par dépôt)

1. **(97) `kyc-service` — commentaire mensonger.** Le JSDoc d'`AdminKycQueryDto` affirmait que la
   conversion implicite n'est pas activée sur ce service ; `main.ts:117` pose pourtant
   `enableImplicitConversion: true`. Le DTO d'aujourd'hui fonctionne (il porte `@Type` explicite) —
   le risque est le DTO écrit demain sur la foi du commentaire, qui compterait sur un `400` qui ne
   viendra pas. Raison du `@Type` réécrite : la conversion doit précéder le `@Transform` du plafond.
2. **(90) `admin-panel` — mauvais étalon d'incomplétude.** La boucle de `buildKycStatusIndex`
   jugeait « page incomplète » sur sa **constante locale**, copie du plafond de l'autre dépôt, au
   lieu du `queue.limit` **réellement appliqué** par l'amont. Si `kyc-service` abaissait son plafond
   à 50 — tuning légitime, tout le design du plafonnement silencieux dit que l'appelant n'a pas à
   s'en soucier — le BFF lirait « 50 < 100, donc dernière page » sur une page **pleine** et
   s'arrêterait au premier tour. Couplage invisible : tous les doubles rendaient `limit: 100` en dur.
3. **(88) `admin-panel` — le plafond de boucle rendait un index tronqué en `ok`.** Le `catch` vide
   l'index et dégrade la source, en expliquant pourquoi (un `kycStatus` absent se lit « pas de
   dossier »). La sortie par épuisement des 20 pages faisait l'inverse — et ce chemin est **neuf** :
   avant la pagination, l'appel unique ramenait toujours tout. Le motif que la story ferme s'y était
   réinstallé, déplacé de 100 à 2 000. Désormais fail-closed. Le test qui figeait l'ancien
   comportement a été retourné.

Les deux correctifs de code sont **mutation-vérifiés rouges** (mutations compilantes).

#### Revue de sécurité — 0 vulnérabilité

Axes examinés et écartés **sur mesure, pas au raisonnement** : `page` sans borne supérieure
(`skip` de 2,5·10²¹ mesuré contre un Mongo 7 réel → `0` document en 7 ms, le coût est borné par la
taille de la collection, jamais par la valeur demandée) · contournement du plafond `limit`
(13 vecteurs testés contre le DTO réel dans les deux modes de conversion : négatif, flottant,
notation exponentielle, `NaN`, `Infinity`, chaîne vide, tableau → tous `400` ou ramenés) · injection
NoSQL par `status`/`page`/`limit` (`$ne`, tableau, clé imbriquée → `400` par `IsIn`/`IsEnum` +
`forbidNonWhitelisted`, et Express 5 ne construit pas les objets imbriqués) · amplification 1 → 20
appels de `buildKycStatusIndex` (non pilotable par l'appelant — elle dépend du volume en base, pas
d'un paramètre ; throttler câblé des deux côtés à 100 req/60 s/IP ; **et la PR réduit l'exposition
antérieure**, le pire cas passant d'illimité à 2 000 lignes) · fuite via `total` (strictement moins
informatif que la liste intégrale servie auparavant aux mêmes rôles) · RBAC, IDOR, isolation tenant,
relais du bearer, neutralisation des corps d'erreur amont.

⚠️ Un fichier jetable du sous-agent de revue (`tmpcheck/ct-test.ts`) avait été happé par un
`git add -A` : retiré de la branche avant merge, aucun secret dedans.

### Completion Notes List

- **La story se joue sur deux dépôts**, ce que le cadrage ne disait pas : `total` réel et
  pagination sont impossibles au seul BFF, l'amont rendant un tableau nu.
- **Direction du tri** : l'AC nº4 dit « décroissante », le périmètre dit « reste » — FIFO conservé
  (`submittedAt: 1`), l'AC lu comme portant sur la stabilité. À confirmer si l'intention était autre.
- **Un e2e pinnait l'absence de pagination** (`?page=2 → 400` au titre de la whitelist stricte) ;
  repointé sur un paramètre réellement inconnu.
- Le double e2e du `Model` **mélange les ex æquo** avant de trier : sans cela il ne prouvait rien
  de l'AC nº4 (`Array.sort` de V8 est stable, donc le test restait vert sur le code bugué).
- **Hook inerte** posé, hors périmètre : la file étant bornée à ≤ 100 lignes, l'index des **noms**
  n'a plus besoin de lire 2 000 organisations pour en résoudre 20 — un `?ids=` en lot côté `auth`
  (patron STORY-143) serait désormais le bon choix.

### File List

**`kyc-service`** — `dto/admin-kyc-query.dto.ts` · `dto/admin-kyc-review-item.dto.ts` ·
`kyc-admin.controller.ts` · `kyc-admin.service.ts` · `tenant-kyc-profile.repository.ts` ·
`schemas/tenant-kyc-profile.schema.ts` (+ specs, `test/kyc-admin.e2e-spec.ts`)

**`admin-panel`** — `upstream/contracts/kyc.contract.ts` · `upstream/kyc-service.client.ts` ·
`admin/orgs/dto/list-kyc-reviews-query.dto.ts` · `admin/orgs/dto/kyc-review-list-item.dto.ts` ·
`admin/orgs/admin-kyc-reviews.controller.ts` · `admin/orgs/org-aggregation.service.ts`
(+ specs, `test/admin-kyc-reviews.e2e-spec.ts`, `test/admin-orgs.e2e-spec.ts`)
