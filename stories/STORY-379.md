# STORY-379 : Un plan **inclut** des utilisateurs au lieu de les plafonner — et **aucun plan ne limite les bilans**

**Epic :** EPIC-004 — Abonnement & facturation (`expert-comptable`)
**Réf. :** **STORY-015** *(catalogue de plans, `GET /billing/plans`)* · **FE-011** *(l'écran qui l'affiche)* · **FR-008**
**Découverte par :** revue PO de la maquette FE-011, le **2026-08-21**
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** low
**Statut :** review *(branche `story-379` — 22 tests billing verts, migration vérifiée sur la base de dev)*
**Service :** `expert-comptable` (:3000), module `billing`

> **La décision, en une phrase :** un cabinet qui dépasse le nombre d'utilisateurs de sa
> formule **n'est pas obligé de monter de formule** — il ajoute des utilisateurs au prix
> unitaire du plan ; et **le nombre de bilans n'est limité par rien**.

---

## Ce qui n'allait pas

Le catalogue servait `limits: { maxUsers, maxBilans }`, un dictionnaire de **plafonds**. Deux
conséquences, dites par le PO devant la maquette :

1. **Le plafond d'utilisateurs était un mur.** Un cabinet de 3 personnes qui en recrute 3
   autres n'avait, à l'écran, qu'une seule issue : passer au plan supérieur. Or ce n'est pas
   la règle commerciale — on **ajoute des utilisateurs**, à un prix unitaire. Et surtout :
   **ce prix n'était visible nulle part**, donc la question « ça me coûte combien ? » n'avait
   aucune réponse dans le produit.
2. **`maxBilans` n'aurait jamais dû exister.** Produire des bilans est l'objet même de
   Prospera ; aucun plan ne le limite.

⚠️ **Ni l'un ni l'autre n'était appliqué** : `grep maxUsers|maxBilans` ne trouve **aucune
garde** dans le service — c'était de l'affichage. Le défaut n'était donc pas un blocage
technique, c'était une **promesse fausse faite à l'écran**, ce qui est pire : elle décide
d'un achat.

## Le contrat, après

| Champ | Sens |
|---|---|
| `amount` | prix de la période, `includedUsers` utilisateurs compris |
| `includedUsers` | utilisateurs **inclus** — **jamais un plafond** |
| `extraUserAmount` | prix d'**un** utilisateur au-delà, **même devise, même période**. `0` = sans surcoût |
| `limits` | dictionnaire ouvert **sans `maxUsers` ni `maxBilans`** |

Le total pour *n* utilisateurs se calcule donc côté client, à partir de champs servis :
`amount + max(0, n − includedUsers) × extraUserAmount`. **Aucun plafond d'utilisateurs
supplémentaires** n'est publié : s'il en faut un, il s'ajoutera à `limits`, qui existe pour ça.

### Valeurs de travail du seed *(tarification définitive = question ouverte n°1 du PRD)*

| `code` | `amount` | `includedUsers` | `extraUserAmount` |
|---|---|---|---|
| `starter-mensuel` | 15 000 | 3 | 5 000 / mois |
| `pro-mensuel` | 35 000 | 10 | 3 500 / mois |
| `pro-annuel` | 350 000 | 10 | 35 000 / an |

⚠️ Posées pour que la comparaison reste **lisible** : à **7 utilisateurs**, `starter-mensuel`
(15 000 + 4 × 5 000 = 35 000) **rejoint exactement** `pro-mensuel`, qui en inclut 10. C'est le
point de bascule que l'écran doit savoir montrer — et à égalité parfaite, FE-011 **ne désigne
personne** : nommer un gagnant inventerait un écart qui n'existe pas.

---

## ⛔ Le piège de cette story n'est pas le contrat, c'est la BASE DÉJÀ AMORCÉE

`seedDefaults` pose ses valeurs en **`$setOnInsert`** — délibérément, pour ne jamais écraser un
plan qu'un `PLATFORM_ADMIN` a ajusté. **Conséquence directe : sur un environnement déjà amorcé,
les nouveaux champs ne seraient JAMAIS arrivés.** Le catalogue aurait servi des plans sans
tarification d'utilisateur supplémentaire, et l'écran n'aurait rien eu à afficher — sans qu'une
seule ligne ne rougisse.

Le seeder porte donc **deux compléments explicites**, tous deux **conditionnés à l'état du
document** (jamais un `$set` aveugle) :

- `$set { includedUsers, extraUserAmount }` **uniquement** si l'un des deux est absent ;
- `$unset { 'limits.maxBilans', 'limits.maxUsers' }` sur les documents qui les portent encore.

⚡ **Le `$unset` de `maxUsers` n'est pas un ménage, c'est une correction de sens.** La valeur
`3` reste la même, mais elle est passée de « **au maximum** 3 » à « 3 **inclus** ». La laisser
dans `limits` afficherait le **même nombre avec le sens inverse** — un champ faux est pire
qu'un champ manquant.

`PlanResponseDto.from` retombe par ailleurs sur `includedUsers: 1` / `extraUserAmount: 0` : un
plan créé à la main avant la migration ne doit **jamais** faire répondre `undefined`.

---

## Critères d'acceptation

- [x] `PlanResponseDto` publie `includedUsers` et `extraUserAmount` ; `GET /billing/plans` les sert.
- [x] `CreatePlanDto` les valide (`@IsInt`, `includedUsers ≥ 1`, `extraUserAmount ≥ 0`) ; `UpdatePlanDto` en hérite (partiel).
- [x] Le seed ne contient plus **aucun** `maxBilans` ni `maxUsers`.
- [x] Un environnement **déjà amorcé** est complété au démarrage, sans écraser une valeur ajustée.
- [x] Un document antérieur ne produit jamais `undefined` dans la réponse.
- [x] `jest src/modules/billing` vert — **22 tests**, 4 suites.
- [x] OpenAPI régénéré côté front (`npm run gen:api`) ; FE-011 consomme les types générés.

## Vérifié, pas déduit *(2026-08-22, stack docker)*

- `PlanResponseDto` de l'OpenAPI **servie** porte `includedUsers` / `extraUserAmount`.
- **La migration a bien mordu sur une base déjà amorcée** — c'était tout l'enjeu :

```
db.plans.find({}, {code:1, amount:1, includedUsers:1, extraUserAmount:1, limits:1})
starter-mensuel  15000   includedUsers: 3   extraUserAmount: 5000   limits: {}
pro-mensuel      35000   includedUsers: 10  extraUserAmount: 3500   limits: {}
pro-annuel      350000   includedUsers: 10  extraUserAmount: 35000  limits: {}
```

`limits` est **vide** : `maxUsers` et `maxBilans` ont bien été retirés des documents existants,
et non seulement du seed.

⚠️ **Un défaut attrapé par le typage, et c'est exactement son rôle** : `admin-plans.controller.spec.ts`
fabriquait encore un `CreatePlanDto` d'avant STORY-379 → `TS2739`, suite non compilée. Corrigé
(commit `c06c331`).
