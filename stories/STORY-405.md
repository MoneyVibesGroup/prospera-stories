# STORY-405 : `@IsMongoId()` laisse passer `0x…`, et le 400 attendu sort en 500

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet *(transverse : 8 dépôts concernés)*
**Réf. :** **STORY-404** *(qui l'a trouvé, et l'a laissé hors de son périmètre)* · règle `securite.md`
**Priorité :** Should Have
**Story Points :** 3
**Statut :** `ready-for-dev`
**Complexité :** medium
**Créée le :** 2026-08-25 — **par la revue de sécurité de STORY-404**
**Sprint :** 20
**Service :** transverse — `dossier-service` en tête, puis `document-service`, `balance-service`, `bilan-service`, `platform-catalog-service`, `auth-service`, `admin-panel`

---

## Le constat

`@IsMongoId()` ne teste **pas** 24 caractères hexadécimaux. Il teste
`isHexadecimal(v) && v.length === 24`, et `isHexadecimal` de `validator` vaut :

```js
/^(0x|0h)?[0-9A-F]+$/i
```

Le préfixe `0x` est donc **accepté**, et il compte dans la longueur. `0x` suivi de **22** caractères
hexadécimaux fait 24 caractères, franchit la validation — puis `new Types.ObjectId(valeur)` lève un
`BSONError`, qui n'est mappé nulle part et ressort en **500**.

**Mesuré** (`class-validator` + `mongoose` du dépôt, à la revue de sécurité de STORY-404) :

```
longueur 24 | isMongoId: true
ObjectId LÈVE : BSONError
```

## Pourquoi ça compte

Un **400 attendu rendu en 500**, sur une entrée que le contrat annonce comme validée. Trois
conséquences, par ordre de gravité :

1. **Le contrat ment.** Le client généré depuis l'OpenAPI voit un champ « identifiant Mongo » et une
   réponse 400 documentée ; il reçoit une erreur serveur. Aucun `catch` côté client ne la traite comme
   une saisie invalide.
2. **Le bruit d'exploitation.** Chaque appel produit une entrée d'erreur serveur : les 500 cessent de
   signifier « le service a un problème ».
3. **Surface d'abus authentifiée.** Un appelant légitime peut, à volonté et sans effort, faire lever une
   exception non gérée sur des dizaines de routes.

⚠️ **Ce n'est PAS une faille d'isolation** : la levée se produit *avant* toute lecture, rien n'est
divulgué, rien n'est écrit. C'est un **défaut de contrat**, pas une fuite — et c'est précisément
pourquoi la revue de sécurité de STORY-404 l'a écarté de son rapport (confiance haute, sévérité basse).

## Étendue mesurée

| Dépôt | Fichiers portant `@IsMongoId` |
|---|---|
| `document-service` | 10 |
| `dossier-service` | 4 |
| `balance-service` | 3 |
| `bilan-service` · `auth-service` · `platform-catalog-service` | 2 chacun |
| `admin-panel` | 1 |

⚠️ Le compte porte sur les **fichiers**, pas sur les champs : un DTO en porte souvent plusieurs. Et il ne
couvre **pas** les `@Param('id')` bruts, qui ne passent par aucun DTO — à instruire dans la story.

---

## Ce que la story livre

Un décorateur maison `@EstObjectId()` (nom à arrêter au dev), posé **là où** `@IsMongoId()` l'est
aujourd'hui, et qui valide ce que le code fait réellement ensuite : `Types.ObjectId.isValid(v) && new
Types.ObjectId(v).toHexString() === v.toLowerCase()`.

| Point | Décision attendue |
|---|---|
| Forme retenue | ⚠️ `Types.ObjectId.isValid()` **seul ne suffit pas** : il accepte aussi les chaînes de **12 caractères** (interprétées en octets bruts) et les nombres. L'aller-retour `toHexString()` est ce qui fige « 24 hex, et rien d'autre » |
| Casse | Les majuscules restent **acceptées** — STORY-404 a montré qu'un membre légitime peut être saisi en majuscules, et les refuser serait une régression |
| Où | Les DTO d'abord ; les `@Param('id')` ensuite, **à inventorier** — ils n'ont aujourd'hui aucune validation et lèvent de la même façon |
| Ordre de livraison | `dossier-service` en premier (le défaut y a été trouvé et mesuré), puis les 6 autres dépôts — **une branche `MNV-405` et une PR par dépôt** |

⚠️ **Le filet de sécurité manque aussi.** Même avec le décorateur, un `BSONError` qui remonte devrait
sortir en **400 générique**, jamais en 500 : un filtre d'exception le mappe, pour que le prochain chemin
oublié ne rende pas un 500 non plus.

## Hors périmètre

- ⛔ Remplacer `@IsMongoId()` par une validation **d'existence** en base : c'est une autre question, et
  elle rouvrirait un oracle d'énumération.
- ⛔ Toute revue des identifiants déjà stockés : aucune valeur invalide n'a pu être **écrite** — la levée
  précède l'écriture.

---

## Acceptance Criteria

- [ ] `0x` + 22 hex sur un champ d'identifiant rend **400**, avec un code stable, et **jamais 500**.
- [ ] `0h` + 22 hex, une chaîne de **12 caractères**, un nombre et un tableau rendent **400** eux aussi.
- [ ] Un identifiant valide en **MAJUSCULES** reste **accepté** *(non-régression STORY-404)*.
- [ ] Un `BSONError` qui remonterait malgré tout sort en **400 générique**, pas en 500 — vérifié en
      neutralisant le décorateur sur une route.
- [ ] Les 7 dépôts sont traités, chacun avec sa branche et sa PR ; aucun ne reste avec `@IsMongoId()` sur
      un champ ensuite converti en `ObjectId`.

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils, **par dépôt**.
- [ ] e2e : `0x…` → 400 sur au moins une route de chaque dépôt.
- [ ] **Mutation** : revenir à `@IsMongoId()` fait rougir le test `0x…` ; retirer le filtre d'exception
      fait rougir le test de repli.
- [ ] `/code-review` + `/security-review`.

## Story Points Breakdown

- Décorateur + filtre d'exception + tests, sur `dossier-service` : 1,5 pt
- Propagation aux 6 autres dépôts (mécanique, mais 6 PR) : 1 pt
- Inventaire des `@Param('id')` non validés : 0,5 pt
- **Total : 3 points**
