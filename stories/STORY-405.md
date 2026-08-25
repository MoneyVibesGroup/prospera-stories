# STORY-405 : `@IsMongoId()` laisse passer `0x…`, et le 400 attendu sort en 500

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet *(transverse : 8 dépôts concernés)*
**Réf. :** **STORY-404** *(qui l'a trouvé, et l'a laissé hors de son périmètre)* · règle `securite.md`
**Priorité :** Should Have
**Story Points :** 3
**Statut :** `done`
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

- [x] `0x` + 22 hex sur un champ d'identifiant rend **400**, avec un code stable, et **jamais 500**.
- [x] `0h` + 22 hex, une chaîne de **12 caractères**, un nombre et un tableau rendent **400** eux aussi.
- [x] Un identifiant valide en **MAJUSCULES** reste **accepté** *(non-régression STORY-404)*.
- [x] Un `BSONError` qui remonterait malgré tout sort en **400 générique**, pas en 500 — vérifié en
      neutralisant le décorateur sur une route.
- [x] Les 7 dépôts sont traités, chacun avec sa branche et sa PR ; aucun ne reste avec `@IsMongoId()` sur
      un champ ensuite converti en `ObjectId`.

## Definition of Done

- [x] Lint 0 · build OK · couverture ≥ seuils, **par dépôt**.
- [x] e2e : `0x…` → 400 sur au moins une route de chaque dépôt.
- [x] **Mutation** : revenir à `@IsMongoId()` fait rougir le test `0x…` ; retirer le filtre d'exception
      fait rougir le test de repli.
- [x] `/code-review` + `/security-review`.

## Story Points Breakdown

- Décorateur + filtre d'exception + tests, sur `dossier-service` : 1,5 pt
- Propagation aux 6 autres dépôts (mécanique, mais 6 PR) : 1 pt
- Inventaire des `@Param('id')` non validés : 0,5 pt
- **Total : 3 points**

---

## Décisions de dev (D-405-x)

### D-405-1 — Deux prémisses de la story étaient fausses, la mesure les corrige

Le tableau *« Forme retenue »* avance qu'`Types.ObjectId.isValid()` **accepte les chaînes de 12
caractères**. C'était vrai avant `bson` 5 ; avec le `bson` embarqué par `mongoose` 8.24 du dépôt,
c'est **faux** :

```
"abcdefghijkl"            isValid = false     new Types.ObjectId(…) → BSONError
"../autre-org"            isValid = false
12          (un nombre)   isValid = true      new Types.ObjectId(12) → 0000000cedfc1d172cb485ab
```

Ce qu'`isValid()` accepte réellement de trop, ce sont les **nombres**. La conclusion de la story tient
donc — `isValid()` seul ne suffit pas — mais **pas pour la raison écrite**, et un aller-retour
`toHexString() === v.toLowerCase()` **lèverait** sur un nombre avant de pouvoir le refuser
(`v.toLowerCase` n'existe pas sur un `number`).

**Forme retenue** : un motif, `^[0-9a-fA-F]{24}$`, appliqué à une valeur dont on a d'abord vérifié
qu'elle est une **chaîne**. Équivalent à l'aller-retour sur une chaîne, mais il ne dépend d'aucune
brique Mongo — ce qui est **obligatoire** pour `admin-panel`, BFF sans base, qui n'a ni `mongoose` ni
`bson` en dépendance. `document-service` portait déjà exactement ce motif dans `DossierGate` : il
n'en porte plus qu'une définition, importée du validateur commun.

### D-405-2 — Le filet doit reconnaître DEUX exceptions, pas une

La story ne nomme que `BSONError`. La mesure montre qu'un identifiant mal formé emprunte **deux**
chemins distincts, qui ne lèvent pas la même chose :

| Chemin | Exception |
|---|---|
| `new Types.ObjectId('0x…')` — conversion explicite | `BSONError` |
| `find({ _id: '0x…' })` — la valeur part en **filtre** | `CastError`, `kind: 'ObjectId'` |

Le second est celui des `@Param('id')` non validés — c'est-à-dire précisément la classe de chemin que
le filet doit couvrir. Ne mapper que `BSONError` l'aurait troué là où il sert le plus.

⚠️ **Restreint à `kind === 'ObjectId'`** : un `CastError` sur un champ `Number` ou `Date` reste un
`500`. Ces champs sont typés par les DTO ; un échec de cast y signale une incohérence interne, pas une
saisie. Élargir le filet à tous les `kind` masquerait ces bugs-là derrière un `400`.

⚠️ **Reconnaissance par `name`, pas par `instanceof`** : `bson` est une dépendance *transitive* de
`mongoose`, l'importer la déclarerait de fait, et un `instanceof` casse dès que deux copies du paquet
coexistent. `BSONTypeError` (nom d'avant `bson` 5) est reconnu aussi.

### D-405-3 — Le validateur n'est PAS un `*.decorator.ts`

`collectCoverageFrom` exclut `!**/*.decorator.ts` dans les **7** dépôts. Y placer la règle l'aurait
rendue invisible aux seuils — l'angle mort qui a caché trois bugs en STORY-076/108. Le fichier est
`src/common/validation/identifiant-mongo.ts`, et il est couvert à **100 %** partout.

### D-405-4 — « un code stable » : ce qui est livré, et ce qui ne l'est pas

- **Chemin décorateur** (le champ est couvert par un DTO) : `400` porté par le `ValidationPipe`, avec
  le message *« <champ> doit être un identifiant Mongo (24 caractères hexadécimaux) »* — il **nomme le
  champ fautif**, ce que le filet ne peut pas faire.
- **Chemin filet** (aucun DTO ne couvre la valeur) : `400` générique portant
  `code: "IDENTIFIANT_MALFORME"`.

⛔ **Un `code` sur les 400 du `ValidationPipe` n'est PAS livré** : il exigerait un `exceptionFactory`
global, qui changerait le corps de **toutes** les réponses 400 de validation des 7 services. Hors
périmètre, et à traiter comme une story à part si le front en a besoin.

### D-405-5 — Inventaire des `@Param` : le filet, pas 60 signatures

Les identifiants passés en `@Param` n'ont aucun DTO. L'inventaire montre qu'ils sont **déjà** couverts
sur le chemin dominant :

| Dépôt | Ce qui garde les `@Param` d'identifiant aujourd'hui |
|---|---|
| tous (6 avec base) | `TenantScopedRepository.findByIdFor` : `if (!Types.ObjectId.isValid(id)) return null` ⇒ **404**, jamais 500 |
| `dossier-service` | + `exigerTenant` (STORY-363) sur l'`org` du jeton, + `DossiersRepository.trouverParId`, `axes`/`journal`/`exercices.repository` |
| `document-service` | + `DossierGate` (motif strict, désormais `estObjectId`) |

⇒ **Aucun chemin `@Param` atteignable ne rend 500 aujourd'hui.** Poser un `ParseObjectIdPipe` sur
~60 signatures de contrôleur aurait été du bruit ; le filet couvre les chemins **futurs** qui
oublieraient la garde, ce qu'un inventaire figé ne fait pas.

### D-405-6 — `admin-panel` : le décorateur seul, jamais le filet

Le BFF n'a ni `mongoose` ni `bson` : il ne convertit aucun identifiant, il les **relaie**. Un
`BSONError` ne peut pas y naître, la branche du filtre y serait du **code mort**. Le validateur y est
donc livré **amputé du filet**, et les e2e assertent `not.toHaveBeenCalled()` sur le client amont —
un `expect(400)` nu resterait vert si l'amont était appelé et répondait 400, c'est-à-dire dans le cas
exact que la story élimine.

---

## Progress Tracking

**Statut : `review`** — 7 dépôts, 7 branches `MNV-405`, 7 PR.

### Portes DoD, par dépôt

| Dépôt | Lint | Build | Couverture (br/fn/li/st) | Unitaires | e2e |
|---|---|---|---|---|---|
| `dossier-service` | 0 | ✅ | 93,59 / 96,64 / 99,29 / 99,27 | 1 059 | 229 |
| `document-service` | 0 | ✅ | 92,40 / 98,16 / 99,14 / 99,10 | 627 | 95 |
| `balance-service` | 0 | ✅ | 91,78 / 98,17 / 99,05 / 98,97 | 3 016 | 714 |
| `bilan-service` | 0 | ✅ | 93,20 / 98,36 / 98,55 / 98,60 | 1 071 | 275 |
| `platform-catalog-service` | 0 | ✅ | 96,19 / 100 / 99,84 / 99,78 | 639 | 191 |
| `auth-service` | 0 | ✅ | 90,80 / 97,94 / 97,89 / 97,79 | 867 | 218 |
| `admin-panel` | 0 | ✅ | 93,25 / 100 / 99,66 / 99,69 | 469 | 214 |

`identifiant-mongo.ts` est à **100 / 100 / 100 / 100** dans les 7.

### Mutations — ce qui prouve que les tests filtrent

| # | Mutation | Attendu | Mesuré |
|---|---|---|---|
| A | `@EstObjectId()` → `@IsMongoId()` (`dossier-service`) | e2e `0x/0X/0h` rouges | 🔴 3 échecs |
| B | branche du filet retirée de `AllExceptionsFilter` | spec du filtre rouge | 🔴 2 échecs *(1er essai : rouge par `TS6192`, **ne prouvait rien** — refait en retirant AUSSI l'import)* |
| C | filet élargi à **tous** les `kind` de `CastError` | « un `CastError` d'un autre type reste un 500 » rouge | 🔴 2 échecs |
| D | idem A sur `document-service` | 3 rouges | 🔴 |
| E | idem A sur `balance-service` | 3 rouges | 🔴 *(1er essai rouge par erreur de compilation — refait)* |
| F | idem A sur `auth-service` | 3 rouges | 🔴 |
| G | idem A sur `platform-catalog-service` | 3 rouges | 🔴 |
| H | idem A sur `admin-panel` | 4 rouges | 🔴 |
| I | idem A sur `bilan-service` | 4 rouges | 🟢 **puis 🔴 après renforcement** |

⚡⚡ **La mutation I est le résultat le plus instructif de la story.** Elle est restée **verte** : les
e2e de `bilan-service` montent le filtre global, si bien que `0x…` traversait `@IsMongoId()`, levait
un `BSONError` dans `ComparaisonService`, et **le filet rendait 400** — le même statut que le
décorateur. Le test ne discriminait donc rien. Il assertait le **statut** ; il asserte désormais le
**message de validation**, seul élément qui dit *lequel des deux rideaux a répondu*.

⚠️ **Corollaire mesuré et non prévu** : les e2e de `dossier-service` **ne montent PAS**
`AllExceptionsFilter` (leur `Test.createTestingModule` ne déclare pas `CommonModule` ni `APP_FILTER`).
Toute affirmation « 400 plutôt que 500 » lue dans ces e2e-là ne reflète que le gestionnaire par défaut
de Nest — c'est pourquoi le filet a dû être prouvé en docker, et pas seulement en e2e.

### Vérification docker — stack réelle, `dossier-service` + `auth-service` + Mongo/Kafka/Redis

Parcours : `register` → e-mail vérifié en base → `login` → KYC `APPROVED` posé dans
`orgkycstatuses` → `POST /dossiers` (201) → `PATCH /dossiers/:id/affectation`.

**Les trois états, mesurés sur le même dossier :**

| État du code | `0x` + 22 hex |
|---|---|
| **Avant la story** — `@IsMongoId()`, pas de filet | **`500`** `{"message":"Une erreur interne est survenue."}` |
| **Filet seul** — décorateur retiré | **`400`** `{"code":"IDENTIFIANT_MALFORME"}` ← **AC-4 prouvé** |
| **Livré** — décorateur + filet | **`400`** `["responsableUserId doit être un identifiant Mongo (24 caractères hexadécimaux)"]` |

**AC-1/AC-2 — les 7 formes, toutes en `400`, aucune en `500`** : `0x`+22hex · `0X`+22hex · `0h`+22hex ·
12 caractères · un nombre · un tableau · `0x` **dans** `contributeursUserIds` (message
`each value in contributeursUserIds …`).

**AC-3 — non-régression STORY-404** : l'identifiant d'un membre actif en **MAJUSCULES** rend `200`, et
la base porte la forme **canonique minuscule** (`ObjectId('6a8d7ce84006c108ea6be59a')`).

**Rien n'a été écrit par les refus** : `version` du dossier = 3 (création + 2 affectations légitimes),
4 entrées de journal, `contributeursUserIds: []`. Et sur toute la collection :
`dossiers à responsableUserId NON canonique = 0` — ce qui confirme le *hors périmètre* de la story :
aucune valeur invalide n'a jamais pu être **écrite**, la levée précède l'écriture.

⚠️ **Piège rencontré, et payé** : le premier passage de la mutation en docker a rendu le message du
**nouveau** décorateur alors que le `dist/` du conteneur portait déjà `IsMongoId`. `nest --watch` avait
recompilé (`Found 0 errors`) **sans redémarrer le process**. Chaque état ci-dessus a donc été mesuré
après un `docker compose restart` explicite et un `/health` à 200 — jamais sur la foi du seul
« Found 0 errors » (leçon `hot-reload-ment-verif-docker`).

---

## Revue de code (⑥) et revue de sécurité (⑦)

**8 constats en revue de code (0 bloquant) · 1 constat en revue de sécurité (Low, confiance 85).** Tous
traités : aucun laissé de côté.

### Revue de code — ce qui a été corrigé, et pourquoi

| # | Constat | Traitement |
|---|---|---|
| ① | ⚡⚡ **Le seul test qui gardait le placement du filet était VACANT.** Il déguisait une `NotFoundException` en `CastError` **sans poser `kind`** : le prédicat rendait `false` de toute façon, si bien que déplacer le filet AVANT la branche `HttpException` laissait la suite **entièrement verte**. Le commentaire de production défendait pourtant cette décision d'ordre. | Le déguisement est rendu **efficace**, et le test l'**assert lui-même** (`expect(estErreurIdentifiantMalforme(refus)).toBe(true)`) avant de conclure — sans quoi il pourrait redevenir vacant en silence. |
| ② | **Le filet n'était éprouvé que dans 1 dépôt sur 6.** Mesuré à la couverture : la ligne `return { statusCode: 400 … }` était **non couverte** dans les 5 autres. Le retirer n'y faisait rougir personne. | Le bloc de tests du filtre est posé dans les **6**. |
| ③ | **Un commentaire d'e2e affirmait une propriété que le harnais rend impossible** (« si la garde disparaissait, le filet prendrait le relais et ce test resterait vert »). | Corrigé : le `TestingModule` de `dossiers.e2e-spec` n'importe pas `CommonModule` et ne pose aucun `APP_FILTER` — le filtre global **n'y est pas monté**. |
| ④ | `document-service` affirmait **A et ¬A à deux fichiers d'écart** : la story corrigeait la prémisse « `isValid()` accepte toute chaîne de 12 caractères » dans `dossier.gate.ts` et la laissait dans `dossier.gate.spec.ts`, dont elle avait pourtant édité le même bloc. | Corrigé, avec la mesure. |
| ⑤ | **JSDoc orpheline** : les 26 lignes qui documentaient `OBJECT_ID_STRICT` flottaient après la suppression de la constante. | Devient la note d'import d'`estObjectId`. |
| ⑥ | **Le message rendu au client était mi-anglais dès `{ each: true }`** : `buildMessage` de `class-validator` préfixe le littéral `'each value in '`. La règle projet « tout en français » porte explicitement sur les messages. | Message construit à la main, préfixe **« chaque valeur de »**. Asserté — aucun test ne le faisait, c'est ainsi qu'il avait échappé. |
| ⑦ | `BSONError` reconnu **en bloc** là où `CastError` est restreint. | ⇒ **fusionné avec le constat de sécurité**, voir ci-dessous. |
| ⑧ | Un **troisième chemin** existe — le cast à l'**écriture**, dont le `CastError` est enfoui dans une `ValidationError` mongoose que le prédicat ne reconnaît pas. | **Documenté comme limite assumée, pas couvert** : aucune route vivante n'y mène, et l'élargir serait exactement ce que la revue de sécurité reproche par ailleurs au filet. Le bon geste, le jour venu, est d'appeler `estObjectId` **avant** l'écriture. |

### Revue de sécurité — le constat, et ce qu'il a changé

**`name === 'BSONError'` ne veut pas dire « identifiant mal formé »** (Low · confiance 85 · CWE-778 ·
A09:2021). `BSONError` est la **classe de base** de `bson` : **126 sites de levée** la portent, dont
quatre seulement concernent un `ObjectId`. Mesuré avec le `bson` du dépôt :

```
new Types.ObjectId('0x…')       BSONError | input must be a 24 character hex string, …
ObjectId.createFromHexString    BSONError | hex string must be 24 characters
serialize({ 'a\0b': 1 })        BSONError | key a b must not contain null bytes
serialize({ $gt: 1 })           BSONError | key $gt must not start with '$'
serialize(circulaire)           BSONError | Cannot convert circular structure to BSON
```

Les trois derniers sont des **défauts serveur** — dont les **garde-fous de dernier rideau de `bson`
contre l'injection de clés de document**. Le filet les requalifiait en `400`, ce qui les sortait du
budget d'erreur 5xx ; et comme le filtre ne journalisait la pile qu'au-delà de 500, il ne restait plus
qu'un `warn` portant un message **constant** : aucune trace de ce qui avait réellement échoué.

⚡ **Le scénario exhibé est reproductible** : `PUT /catalog/entitlements/:orgId/:moduleCode` accepte un
`config?: Record<string, unknown>` dont **les clés sont choisies par l'appelant**. Une clé portant un
octet NUL fait lever `bson` à l'écriture.

**Deux gestes, indépendants, tous deux livrés :**

1. **La branche `BSONError` est resserrée comme `CastError` l'était déjà**, aux deux seuls messages que
   la lecture d'un ObjectId produit. Le code posait déjà ce principe pour `kind === 'ObjectId'` — il ne
   l'appliquait qu'à une branche sur deux. ⚠️ Filtrer sur un message est fragile, **et c'est assumé** :
   une reformulation de `bson` ferait retomber sur le `500` d'avant la story, **jamais** sur un faux
   `400`, et le spec — qui produit un **vrai** `BSONError` — virerait au rouge.
2. **Le niveau de log suit désormais la NATURE de l'exception, plus son statut.** Une exception qui
   n'était pas une `HttpException` reste journalisée en `error`, **avec sa pile**, même requalifiée
   en 400.

### Mutations sur les correctifs

| Mutation | Attendu | Mesuré |
|---|---|---|
| Filet placé **avant** la branche `HttpException` | le test d'ordre rougit | 🔴 2 échecs |
| `BSONError` reconnu **en bloc** (état pré-sécurité) | « un BSONError de sérialisation reste un 500 » rougit | 🔴 3 échecs |
| Niveau de log **recouplé** au statut | « journalise en erreur, avec la pile » rougit | 🔴 1 échec |
| `buildMessage` restauré (préfixe anglais) | « le message de *each* est en français » rougit | 🔴 1 échec |

### Vérification docker REJOUÉE sur l'état final

Le correctif de sécurité touche le filet, déjà mesuré en phase ④ : la vérification a donc été **rejouée**
sur l'état final (stack redémarrée, `/health` à 200 avant chaque mesure).

| Cas | Résultat |
|---|---|
| `0x` · `0h` · un nombre | `400`, message nommant `responsableUserId` |
| `0x` **dans** `contributeursUserIds` | `400`, **« chaque valeur de contributeursUserIds… »** — le préfixe anglais a bien disparu |
| identifiant valide en **MAJUSCULES** | `200` (non-régression STORY-404) |
| **filet seul** (décorateur neutralisé), après resserrement | `400 IDENTIFIANT_MALFORME` — le resserrement **n'a pas cassé le filet** |
| **la trace**, sur ce même appel | `ERROR` + `BSONError: input must be a 24 character hex string, …` — là où l'état précédent ne laissait qu'un `warn` sans pile |

Base inchangée par les refus : `version = 4` (création + 3 affectations légitimes), `contributeursUserIds: []`,
et **0 dossier à `responsableUserId` non canonique** sur toute la collection.

### Commits par dépôt

| Dépôt | feature | revue | securite |
|---|---|---|---|
| `dossier-service` | 2 (dont les commentaires) | 1 | 1 |
| `document-service` · `balance-service` · `bilan-service` · `platform-catalog-service` · `auth-service` | 1 | 1 | 1 |
| `admin-panel` | 1 | 1 | **aucun** — son validateur est amputé du filet (ni `mongoose` ni `bson`), le constat de sécurité y est **sans objet** |

---

## Clôture

**Statut `done` — 2026-08-25.** 7 dépôts, 7 branches `MNV-405`, **7 PR rebase-mergées sur `dev`**,
branches supprimées :

| Dépôt | PR |
|---|---|
| `dossier-service` | [#16](https://github.com/MoneyVibesGroup/prospera-dossier-service/pull/16) |
| `document-service` | [#15](https://github.com/MoneyVibesGroup/prospera-ocr-service/pull/15) |
| `balance-service` | [#54](https://github.com/MoneyVibesGroup/prospera-balance-service/pull/54) |
| `bilan-service` | [#49](https://github.com/MoneyVibesGroup/prospera-bilan-service/pull/49) |
| `platform-catalog-service` | [#16](https://github.com/MoneyVibesGroup/prospera-platform-catalog-service/pull/16) |
| `auth-service` | [#25](https://github.com/MoneyVibesGroup/prospera-auth-service/pull/25) |
| `admin-panel` | [#24](https://github.com/MoneyVibesGroup/prospera-admin-panel-service/pull/24) |

### Ce que la story laisse derrière elle

- ⛔ **Aucun `code` applicatif sur les 400 du `ValidationPipe`** (D-405-4) : il exigerait un
  `exceptionFactory` global qui changerait le corps de **toutes** les réponses 400 de validation des 7
  services. À traiter comme une story à part si le front en a besoin.
- ⛔ **Le troisième chemin du filet** — cast à l'écriture, `CastError` enfoui dans une `ValidationError`
  mongoose — reste **non couvert et documenté comme tel** (D-405-2, constat ⑧). Le bon geste, le jour où
  une route l'atteint, est d'appeler `estObjectId` **avant** l'écriture.
- ⚠️ **Les e2e de `dossier-service` ne montent pas `AllExceptionsFilter`** (constat ③) : toute lecture
  « 400 plutôt que 500 » dans ces suites-là ne reflète que le gestionnaire par défaut de Nest. Vaut pour
  toute story future qui voudrait y prouver un comportement de filtre global.
