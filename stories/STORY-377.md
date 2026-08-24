# STORY-377 : La console compte les cabinets « bloqués avant dépôt » **à la main, sur une page** — aucun filtre ni compteur ne les expose

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF) · *volet `auth-service`*
**Réf. :** **STORY-186** *(qui a exposé `ownerEmailVerified` et a explicitement laissé ce filtre hors périmètre : « à ouvrir seulement si l'écran le demande »)* · **STORY-175** *(le MÊME manque, sur `kycStatus` — même route, même raisonnement)* · **AP-19** *(le consommateur front, qui vient de le demander)* · **AP-07** *(le contrat de tuile à trois états)*
**Découverte par :** **AP-19**, livrée le 2026-08-20 — sa septième tuile n'a aucune source à interroger
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** low
**Statut :** review
**Créée le :** 2026-08-20
**Service :** `auth-service` (`:3001`) + `admin-panel` BFF (`:3010`)

> **Le trou, en une phrase :** la tuile « Bloqués avant dépôt » de la console compte les organisations
> non vérifiées **en lisant les lignes d'une page d'annuaire**, parce qu'aucune route ne sait ni les
> filtrer ni les compter. Au-delà de 100 organisations, elle affiche `≥ n` — et le tableau de bord fait
> payer au BFF une jointure à trois services pour un chiffre qu'une requête Mongo rendrait.

---

## ⚠️ Ce n'est pas une reprise de STORY-186, c'est la suite qu'elle avait prévue

STORY-186 a livré **l'état** (`ownerEmailVerified`, `ownerEmailVerifiedAt` sur la liste et le détail) et
**l'acte** (`POST /admin/organizations/:id/resend-verification`). Son § *Hors périmètre* dit, mot pour
mot :

> Un filtre « non vérifiées » sur la liste — il appellerait la même question que `STORY-175` pour le
> KYC *(un filtre serveur, pas un tri client)*. **À ouvrir seulement si l'écran le demande.**

L'écran le demande depuis le 2026-08-20. Ce ticket est l'ouverture annoncée, pas un oubli constaté.

---

## Le constat — mesuré, pas supposé

`ListOrgsQueryDto` (BFF) porte `page`, `limit` (max **100**), `status` *(identité)* et `q`. Rien d'autre.
`GET /admin/organizations` (auth) porte les mêmes. **Aucune des deux ne connaît `ownerEmailVerified`.**

Ce que la console fait donc aujourd'hui, faute de mieux *(`useDashboard.ts`, `SCAN_PAGE_SIZE = 100`)* :

| Ce qu'elle demande | Ce qu'elle en fait | Ce que ça coûte |
|---|---|---|
| `GET /admin/orgs?page=1&limit=100` | filtre les lignes en mémoire sur `ownerEmailVerified === false` | une **jointure à trois services sur 100 organisations**, à chaque ouverture du tableau de bord, pour rendre **un entier** |
| — | `total > items.length` ⇒ la tuile passe en `partial` | au-delà de 100 organisations, le chiffre devient un **minorant** et le dit (`≥ n`) |

⚡ **Le `≥ n` n'est pas un défaut de l'écran, c'est son honnêteté.** Mais il plafonne : la base de
développement portait **20 comptes non vérifiés sur 60** au 2026-08-06 (33 %). À 300 organisations, la
tuile annoncera `≥` un nombre qui ne dira plus rien de la cohorte réelle — et c'est précisément la
cohorte que cette chaîne de stories existe pour rendre visible.

---

## Périmètre

**Inclus — `auth-service` :**

- `GET /admin/organizations` accepte **`ownerEmailVerified=true|false`**, appliqué **en base**, pagination
  et `total` cohérents avec le filtre.
  ⚠️ Le filtre porte sur le **propriétaire résolu** (`resolvePendingAdmin`/`selectPrincipalAdmin`,
  STORY-144 factorisée par STORY-186), pas sur « un membre quelconque » — la définition est **déjà
  écrite et partagée**, il ne faut pas en produire une seconde.
- ⚠️ **Le repli conservateur de STORY-186 doit valoir aussi pour le filtre** : une organisation sans
  aucun administrateur actif est `ownerEmailVerified: false` dans la projection. Elle doit donc
  apparaître dans `ownerEmailVerified=false`, sinon la liste et la fiche se contrediraient sur la même
  organisation.

**Inclus — BFF `admin-panel` :**

- `ListOrgsQueryDto` déclare le paramètre et le **relaie tel quel** (le BFF ne repagine rien).
  ⚠️ Il valide en `forbidNonWhitelisted` : un paramètre non déclaré ferait **400**, pas un filtre ignoré.

**Hors périmètre :**

- Le compteur d'agrégat (`GET /admin/dashboard`) — c'est **STORY-047**, et il n'a pas à naître ici. Avec
  le filtre, la console obtient son chiffre exact en demandant `limit=1` et en lisant `total` : une
  requête, une jointure d'une ligne, un entier juste.

---

## Critères d'acceptation

- [ ] `GET /admin/organizations?ownerEmailVerified=false` ne rend que les organisations dont le
      propriétaire résolu n'a pas d'`emailVerifiedAt` ; `total` compte le **filtré**, pas le parc.
- [ ] `ownerEmailVerified=true` rend le complément exact : la somme des deux `total` égale le `total` sans
      filtre. *(C'est l'assertion qui attrape un filtre qui « oublie » les organisations sans admin actif.)*
- [ ] Une organisation **sans administrateur actif** apparaît dans `false` — cohérente avec la projection
      de STORY-186, qui la rend `false`.
- [ ] Le filtre est **combinable** avec `status`, `q` et la pagination, sans casser `total` ni sauter de
      lignes en page 2.
- [ ] Le BFF déclare et relaie le paramètre ; contrat publié à l'OpenAPI *(pas un `Record<string, never>` —
      cf. `STORY-181`)*.
- [ ] Tests : filtre seul, filtre combiné, complémentarité des deux totaux, cas sans admin actif,
      pagination.

---

## ⚡ Ce que ça débloque, et ce qu'il faudra rebrancher côté front

Le jour où cette story sort, **une seule ligne change** côté console : `useDashboard.ts` redescend à
`pageSize: 1` avec le filtre, et `countBlocked` cède la place à un `total`. Ni `aggregate.ts` ni l'écran
ne bougent — le contrat de tuile à trois états d'AP-07 reste le même, `partial` disparaît simplement de
cette tuile.

⚠️ **Cette bascule ne se fera pas toute seule** : une story backend livrée ne déclenche rien tant qu'une
story frontend ne la nomme pas *(trois occurrences en une semaine, cf. le journal des écarts)*. Ouvrir la
story frontend correspondante **en même temps que celle-ci**, ou l'inscrire au périmètre d'AP-21, qui
porte déjà le rebranchement du filtre `kycStatus` de STORY-175 sur la même route.

---

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List


---

## Progress Tracking

### ① `auth-service` — le filtre s'applique **en base**, avant la pagination

`GET /admin/organizations?ownerEmailVerified=true|false`. Les étapes de résolution du propriétaire
(`$lookup` memberships `TENANT_ADMIN`/`ACTIVE` triées par ancienneté → choix du principal → `$lookup`
users → `ownerVerifie`) sont insérées **avant** `$sort/$skip/$limit`, et `total` passe par une seconde
agrégation `$count` sur le **même** filtre.

| Décision | Pourquoi elle n'est pas cosmétique |
|---|---|
| Résolution **avant** `$skip` | après, on filtrerait **la page** : la page 1 rendrait 3 lignes sur 20 demandées, la page 2 en sauterait, `total` serait sans rapport |
| `total` par `$count`, jamais `countDocuments` | sinon un chiffre juste dans `items` et **faux** dans `total` — et une pagination qui promet des pages vides |
| `false` **inclut** les organisations sans admin actif | c'est le repli conservateur de STORY-186 : les exclure ferait se contredire **la liste et la fiche** sur la même organisation |

⚠️ **La règle du « propriétaire résolu » est reproduite en agrégation — même règle, autre langage, pas
une seconde définition.** Deux implémentations peuvent diverger en silence : c'est la vérification
docker qui prouve leur concordance, organisation par organisation (⑤).

### ② `admin-panel` — déclaré, relayé, jamais réinterprété

`ListOrgsQueryDto.ownerEmailVerified` + sérialisation amont. Le BFF ne repagine ni ne recompte.

🪤 **Le piège attrapé par un test** : `if (query.ownerEmailVerified)` au lieu de `!== undefined`
**perd le `false`** — or `false` est exactement la valeur que la tuile demande. La mutation fait rougir
le test de sérialisation.

### ③ ⚡ Ce que la mutation a corrigé dans **ma propre documentation**

J'avais écrit que la transformation devait lire `obj` **et pas** `value`, sous peine que
`enableImplicitConversion` livre un booléen déjà faussé. **La mutation `obj → value` n'a pas rougi.**

Sondé plutôt que supposé : `value` reçoit **`"false"`, `typeof string`** — la conversion implicite
n'a **pas** lieu avant un `@Transform`. Ce qui est vrai, et **mesuré** :

- **le `@Transform` est indispensable** — le retirer fait rougir **3 e2e** (`Boolean('false')` vaut
  `true`, et le filtre rendrait le complément exact de ce qu'il annonce) ;
- **`obj` vs `value` est indifférent ici** — `obj` est conservé par cohérence avec le patron du projet,
  et le commentaire le dit désormais ainsi.

⇒ Un commentaire qui promet plus que le code ne tient est une dette : la mutation est ce qui l'a
révélé, exactement comme elle révèle un test qui ne garde rien.

### ④ Mutation-test

| Mutation | Attendu | Mesuré |
|---|---|---|
| `$match` du propriétaire déplacé **après** `$skip` | rouge | ✅ 1 rouge |
| `total` recalculé par `countDocuments` | rouge | ✅ 2 rouges |
| `$match: { ownerVerifie: true }` en dur | rouge | ✅ 1 rouge |
| `if (query.ownerEmailVerified)` (le `false` est perdu) | rouge | ✅ 1 rouge |
| `@Transform` retiré du DTO | rouge | ✅ 3 rouges |
| `@Transform` lisant `value` au lieu d'`obj` | *(supposé rouge)* | ⚠️ **VERT** — voir ③ |

### ⑤ Vérification docker — la seule preuve du pipeline

Les unitaires mockent `model.aggregate` : ils gardent la **forme** du pipeline, pas son **résultat**
*(leçon STORY-359)*. Jeu de données réel de **5 organisations**, choisi pour couvrir ce que la règle du
propriétaire décide vraiment :

| Cas | Attendu | Rendu par l'API |
|---|---|---|
| **A** fondateur vérifié | `true` | ✅ `true` |
| **B** fondateur non vérifié | `false` | ✅ `false` |
| **C** fondateur **retiré** (`REVOKED`, non vérifié) + plus ancien admin actif vérifié | `true` | ✅ `true` — c'est le cas qui distingue « fondateur » de « plus ancien admin actif » |
| **D** **aucun** admin actif | `false` | ✅ `false` *(AC-3)* |
| **E** fondateur vérifié mais `TENANT_USER` + admin actif non vérifié | `false` | ✅ `false` |

| Critère | Mesure |
|---|---|
| **AC-2** complémentarité | sans filtre **7** · `true` **4** · `false` **3** · somme **7** ✅ |
| ⚡ **Concordance** pipeline ↔ projection | **7/7** organisations, **aucun écart** — chaque organisation apparaît dans **exactement une** des deux listes. C'est ce qui interdit aux deux implémentations de diverger |
| **AC-4** pagination `limit=2` | 3 lignes parcourues, 3 distinctes, `total` annoncé 3 — **ni doublon ni saut** |
| **AC-4** combiné `false` + `status` + `q` | `total=3`, les 3 attendues |
| **AC-1** valeur invalide | `400` — jamais un filtre deviné |

**Le gain, mesuré de bout en bout sur le BFF :**

| Geste | Lignes transportées | `total` |
|---|---|---|
| Aujourd'hui — `limit=100`, comptage **en mémoire** | **7** | 7 *(et `3` recompté côté client)* |
| ⚡ Avec le filtre — `limit=1` | **1** | **3**, exact |

Stack arrêtée (`docker compose stop`), jeu de données nettoyé.

### ⑥ Portes

| | `auth-service` | `admin-panel` |
|---|---|---|
| Lint / build | ✅ 0 / ✅ | ✅ 0 / ✅ |
| Unitaires | ✅ **834** / 65 suites | ✅ **435** / 37 suites |
| e2e | ✅ **210** / 14 suites | ✅ **201** / 11 suites |
| Couverture | **97,81 / 90,82 / 97,91 / 97,91** | **99,68 / 93,07 / 100 / 99,65** |
