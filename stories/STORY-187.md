# STORY-187 : La file de revue KYC **n'est pas paginée** — elle rend tout, et joint tout

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. :** **AP-03** *(la file)* · **AP-07** *(la tuile « Dossiers KYC en attente » la compte)* · **STORY-107** *(la route à amender)* · **STORY-047** *(le patron : `PaginatedAdminOrgsDto`, déjà paginé)*
**Découverte par :** audit des filtres et de la pagination de la console, 2026-08-06
**Priorité :** Should Have — **rien ne casse aujourd'hui**, tout casse à l'échelle
**Story Points :** 3
**Statut :** in_progress
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

### Debug Log References

### Completion Notes List

### File List
