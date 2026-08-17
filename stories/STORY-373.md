# STORY-373 : deux gardes de `bilan-service` qui ne gardent pas — le DTO nu et la marche arrière périmée

Status: done

**Epic :** EPIC-043 — Le dossier client devient l'unité de travail du cabinet
**Points :** 3 · **Complexité :** medium · **Sprint :** 20 (backend) · **Service :** `bilan-service`
(`:3004`)
**Origine :** deux écarts relevés par les revues de **STORY-372** (2026-08-17)
**Assigné à :** vivianMoneyVibesGroupes

---

## Pourquoi les deux sont dans la même story

Même service, **même passe de vérification**, 3 points au total. Les séparer coûterait deux branches,
deux PR et **deux vérifications docker** sur le même service, pour deux correctifs d'une dizaine de
lignes chacun.

Et ils ont la même forme : **une garde qui a l'air de garder et qui ne garde pas.** L'une laisse
passer ce qu'elle prétend valider, l'autre détruirait ce qu'elle prétend restaurer.

---

## Défaut ① — `@ValidateNested()` seul ne dit RIEN d'un champ ABSENT

Un objet imbriqué **manquant** traverse la validation et va mourir sur Mongoose : **500** au lieu de
**400**.

**Mesuré** (STORY-372, vérification docker) :

```
POST /api/v1/bilan/hypotheses   {"nom":"x","baseJeuEtatsId":"…"}      → 500
  ValidationError: JeuHypotheses validation failed: hypotheses: Path `hypotheses` is required.
```

⚠️ **Trois DTO sont nus, pas un** — c'est la correction à la racine :

| DTO | Champ | Route |
| --- | --- | --- |
| `creer-hypotheses.dto.ts:35` | `hypotheses` | `POST /bilan/hypotheses` |
| `editer-hypotheses.dto.ts:12` | `hypotheses` | `PUT /bilan/hypotheses/:id` |
| `proposer-surcharge.dto.ts:44` | `cible` | `POST /bilan/mapping-overrides` |

⚡ **Les `@ValidateNested({ each: true })` ne sont PAS concernés** : ils sont tous précédés d'un
`@IsArray()` (parfois `@ArrayNotEmpty()`), qui attrape déjà l'absence. Le trou est **spécifique aux
objets imbriqués nus**.

> C'est exactement le piège de **STORY-185** : *« `@ValidateNested` seul ne dit RIEN d'un champ
> ABSENT »*. Il se reproduit ici parce que rien ne l'empêche à l'écriture d'un DTO.

## Défaut ② — la marche arrière de migration détruirait ce qu'elle prétend restaurer

`RollbackMigrationService` retire le `dossierId` de **tout** document qui en porte un. Sa prémisse
est écrite dans son propre docblock :

> *« aujourd'hui aucun chemin d'écriture ne pose `dossierId`, donc tout `dossierId` présent vient
> forcément de la migration »* — et *« cela cesse d'être vrai avec **STORY-357** »*.

⛔ **C'est STORY-372 qui l'a rendue fausse, une story plus tôt qu'annoncé.** Depuis, **tout**
exercice, mapping, snapshot ou jeu d'hypothèses créé porte un `dossierId` **légitime** que ce script
détacherait sans distinction — et le schéma le déclarant `required`, ces documents ne seraient plus
ré-écrivables sans repasser par la migration.

⚠️ **STORY-356 avait prévu ce moment**, et c'est sa consigne qu'on exécute ici :

> *« Le borner maintenant serait spéculatif, le retirer priverait la story de sa marche arrière ⇒
> documenté à l'endroit où on le lira, avec **consigne explicite de retirer ou borner le script à la
> clôture de 236/357** ».*

**On borne, on ne retire pas** : `[x] La marche arrière restaure l'état antérieur` est un **AC d'une
story close** (STORY-356) ; la supprimer contredirait une story `done`.

### Comment borner, sans toucher un seul schéma

⚡ **L'`_id` porte déjà sa date de création.** Un `ObjectId` Mongo embarque un horodatage à la
seconde : `_id < ObjectId.createFromTime(t)` sélectionne exactement les documents créés **avant**
`t`. Aucun champ à ajouter, aucune migration — et c'est nécessaire, parce que **`snapshots_liasse`
n'a pas `timestamps: true`** : `createdAt` n'existe pas sur les 4 collections, l'`_id` si.

La marche arrière **exige** donc désormais l'horodatage d'exécution de la migration (que celle-ci
imprime dans son rapport, champ `executeeLe`) et ne détache que les documents antérieurs.

## Ce que la story livre

1. Les **3** DTO à objet imbriqué nu reçoivent la garde qui manque ⇒ **400**, plus **500**.
2. `RollbackMigrationService` **exige** l'horodatage de la migration et **borne** son `$unset` aux
   documents créés avant. Sans horodatage : **refus**, jamais un détachement total.
3. Le rapport dit **ce qu'il a laissé attaché** parce que postérieur — jamais de troncature muette.

## Critères d'acceptation

- **Étant donné** un corps sans son objet imbriqué **quand** il est posté sur l'une des 3 routes
  **alors** la réponse est **400** et nomme le champ manquant — ⛔ jamais 500.
- **Étant donné** la marche arrière **quand** elle est lancée **sans** horodatage de migration
  **alors** elle **refuse** et ne modifie **aucun** document.
- **Étant donné** une base portant des documents **antérieurs** et **postérieurs** à la migration
  **quand** la marche arrière s'exécute avec l'horodatage **alors** seuls les **antérieurs** sont
  détachés, et le rapport **compte** ceux qui ont été laissés.
- ⛔ **Étant donné** chaque garde **quand** on la retire **alors** un test vire au **rouge**.

## Ce que cette story ne fait PAS

- ⛔ Elle ne **retire** pas la marche arrière — c'est un AC de STORY-356, close.
- ⛔ Elle ne touche pas aux `@ValidateNested({ each: true })` : leur `@IsArray()` couvre déjà
  l'absence. Les décorer en plus serait du bruit.
- ⛔ Elle ne change **aucun schéma** : le bornage passe par l'`_id`, précisément pour ça.

## Definition of Done

- [x] Les 3 routes rendent **400** sur objet imbriqué absent, **mesuré en docker**.
- [x] La marche arrière refuse sans horodatage et borne avec — **prouvé sur une base mixte**
      (documents avant **et** après la migration).
- [x] **Mutation-test** pour chaque garde.
- [x] Seuils 65/90/90/90 tenus, lint 0, build OK, unit + e2e verts.

---

## Progress Tracking

### ① Les 3 DTO nus reçoivent `@IsDefined()`

Une batterie dédiée — `src/modules/bilan/dto/objets-imbriques-requis.spec.ts` — rejoue la **vraie
chaîne** `plainToInstance` + `validateSync` (celle du `ValidationPipe` global) sur les 3 DTO, avec
4 cas chacun : corps complet accepté · champ **absent** refusé et **nommé** · champ à `null` refusé ·
objet **présent mais invalide** toujours refusé (non-régression).

### ② La marche arrière est bornée par l'`_id`, sans toucher un schéma

`RollbackMigrationService.executer(migrationExecuteeLe)` :

- **exige** l'horodatage ⇒ sans lui (ou illisible), `BorneRollbackRequiseError`, **avant toute
  écriture** ;
- ne détache que `{ dossierId: { $exists: true }, _id: { $lt: ObjectId.createFromTime(t) } }` ;
- **compte** ce qu'il laisse attaché (`laissesAttaches`) — un rapport qui ne compterait que les
  détachements laisserait croire à une marche arrière complète. ⚠️ *Ces avertissements passaient
  d'abord par le `Logger` du service, où ils étaient **inertes** ; ils sont émis par le bootstrap sur
  `stderr` — cf. la revue de sécurité ci-dessous.*

⚡ **Le bornage passe par l'`_id` et pas par `createdAt`, et c'est une nécessité, pas un raffinement** :
`snapshots_liasse` n'a **pas** `timestamps: true`. `createdAt` n'existe donc pas sur les 4
collections — l'`_id`, si, puisqu'un `ObjectId` embarque son horodatage. Zéro schéma modifié, zéro
migration.

### Mutation-test

| # | Mutation | Attendu | Observé |
| --- | --- | --- | --- |
| **M1** ×3 | `@IsDefined()` retiré, **un DTO à la fois** | 1 rouge par site | ✅ **exactement 1 rouge** pour chacun des 3 |
| **M2** | le bornage `_id` retiré (retour au « tout détacher ») | rouge | ✅ rouge |
| **M3** | le refus fail-closed devient un repli silencieux | rouges | ✅ **4 rouges** |

> ⚠️ **M1 a d'abord été NON PROBANTE** : retirer les 3 `@IsDefined()` d'un coup laissait les imports
> inutilisés ⇒ **échec de compilation** (`TS6133`), pas d'assertion. Rejouée **site par site**, en
> retirant aussi l'import — ce qui la rend **plus** discriminante : elle prouve que chaque DTO porte
> sa propre garde.

### Vérification docker réelle — 2026-08-17

**① le 500 est devenu 400, sur les 3 routes**

| Route | Avant | Après |
| --- | --- | --- |
| `POST /bilan/hypotheses` sans `hypotheses` | ⛔ 500 | ✅ **400** `hypotheses should not be null or undefined` |
| `PUT /bilan/hypotheses/:id` sans `hypotheses` | ⛔ 500 | ✅ **400** `hypotheses should not be null or undefined` |
| `POST /bilan/mapping-overrides` sans `cible` | ⛔ 500 | ✅ **400** `cible should not be null or undefined` |

**② la marche arrière, sur une base MIXTE** — documents créés avant **et** après la borne :

| Étape | Résultat mesuré |
| --- | --- |
| sans horodatage | ✅ **refus** (`code de sortie : 1`), message nommant `executeeLe` et la commande — et l'état en base **strictement inchangé** (2/1/2/1) |
| bornée à `T` | ✅ `detaches: {exercices:1, snapshots_liasse:2, mapping_overrides:1, jeux_hypotheses:1}` · `laissesAttaches: {exercices:1}` |
| **discrimination** | ✅ l'exercice **`2028`** (`_id` daté `16:55:13`, **après** la borne `16:55:11`) **survit** ; l'exercice **`2027`** (`15:33:03`) est détaché |

⚠️ **Ce que la vérif discrimine** : **2 secondes** d'écart suffisent à séparer les deux documents — la
résolution à la seconde de l'`ObjectId` est adéquate pour cet usage. Et le contrôle « sans
horodatage » vérifie l'**état en base**, pas seulement le code de sortie : c'est ce qui prouve que le
refus précède toute écriture.

### Revue de code — 4 constats, 4 traités, dont **un majeur qui a changé le correctif**

Le relecteur a rejoué la table de mutations **et en a ajouté deux** (arrondi `floor`/`ceil`, borne
calculée après la 1ʳᵉ écriture) : les deux rouges. Il a aussi confirmé qu'il n'existe **pas de 4ᵉ DTO
nu** — les 6 autres `@ValidateNested` sont tous `{ each: true }` derrière un `@IsArray()`.

| # | Constat | Gravité | Traitement |
| --- | --- | --- | --- |
| **F1** | ⚡⚡ **le « tout détacher » restait atteignable** : la borne n'était validée que *parsable*. L'opérateur qui n'a plus le rapport et passe **la date du jour** borne dans le présent ⇒ tout est détaché, `laissesAttaches` vaut **0 partout**, l'avertissement ne se déclenche pas — **le rapport se lit comme une marche arrière propre** | **majeure** | **corrigé — et le correctif a changé de nature** (ci-dessous) |
| **F2** | le docblock de classe disait encore *« n'est plus un outil sûr, ne pas l'exécuter en l'état »* — alors que **cette PR est ce bornage** | moyenne | **corrigé** |
| **F3** | la troncature à la seconde laisse survivre un document **migré** dans la même seconde, rangé dans `laissesAttaches` dont le libellé annonce des écritures **postérieures** | faible | **corrigé** — le rapport publie la **borne effective** à côté de la saisie |
| **F4** | *« Publié plutôt que **tu** »* → `tû` (participe de *taire*), dans un contrat public | cosmétique | **corrigé** |

#### ⚡ F1 a invalidé ma première correction — et c'est le vrai enseignement

Premier réflexe : **valider l'horodatage** (refuser futur et pré-epoch). Le test l'a démenti
immédiatement — `new Date().toISOString()` **n'est pas dans le futur**. ⛔ **La date du jour est
parfaitement plausible** : dans le passé, postérieure à 1970. **Aucune validation d'entrée ne peut
la distinguer de la date de migration**, et c'est elle le scénario dangereux.

⇒ **La protection ne pouvait pas être une garde sur l'entrée. Elle est un changement de défaut :**
la marche arrière **simule** désormais, et n'écrit que sur `--appliquer`. Les comptes s'impriment
**avant** qu'un octet ne soit écrit — l'opérateur voit `detaches: 47` et `laissesAttaches: 0` et
s'arrête. Les gardes futur/pré-epoch sont **conservées** (elles attrapent le non-sens, dont le
pré-epoch qui produit une borne en **2105** par débordement **non signé**), mais elles ne sont plus
présentées comme la protection.

| Mutation ajoutée après revue | Observé |
| --- | --- |
| **M4** — la simulation cesse d'être le défaut (`appliquer = true`) | ✅ **2 rouges** |
| **M5** — la garde « futur » retirée | ✅ 1 rouge |

**Vérification docker rejouée sur l'état final** (le contrat CLI ayant changé) :

| Étape | Mesuré |
| --- | --- |
| simulation (défaut) | ✅ rapport complet, `applique: false` — **base strictement inchangée** (2 → 2) |
| `--appliquer` | ✅ `applique: true`, 2 → **1**, et l'exercice **`2028`** (postérieur à la borne) **survit** |
| horodatage futur | ✅ **refus**, `code de sortie : 1` |

### Revue de sécurité — 2 constats, 2 corrigés

⛔ **F1 — les garde-fous anti-destruction étaient TOTALEMENT INERTES.** Le CLI boote avec
`logger: false` (réglage voulu : le rapport JSON sort seul sur `stdout` et reste pipeable). Ce
réglage rend **muet** tout `logger.warn()` du service — **les deux alarmes que cette story
présentait comme le correctif n'atteignaient personne**, et aucun test ne l'assertait.

> ⚡ **Exactement le motif de STORY-173** : un livrable mergé et totalement inerte. *Un garde-fou
> inerte est pire que pas de garde-fou* — on croit le sujet couvert.

**Corrigé** : les avertissements sont **dérivés du rapport** et écrits sur `stderr` par le bootstrap
(canal déjà utilisé par les refus, lui non filtré), avec leur propre batterie. **Mesuré en docker**,
ils sortent réellement :

```
⚠️  SIMULATION — rien n'a été écrit. 1 document(s) SERAIENT détachés. Relisez ce compte : si la
    borne était la date du jour au lieu de celle de la migration, il inclurait des dossierId LÉGITIMES.
⚠️  1 document(s) portent un dossierId posé APRÈS la borne : … PAS un retour complet à l'état pré-migration.
```

⛔ **F2 — un tableau VIDE traversait les deux gardes que la story venait de poser.** `@IsDefined()`
accepte `[]`, et `@ValidateNested()` **sans `each`** valide *zéro* élément ⇒ `hypotheses: []` passait
**et se persistait** (`@Prop({ type: Object })` est un chemin `Mixed`, dont le `required` Mongoose
accepte `[]`). Effet mesuré en aval : `produits * (1 + undefined/100)` ⇒ **`NaN` en cascade**,
sérialisé en `null`, **sans qu'aucune erreur ne soit levée** — un prévisionnel financier qui rend des
montants nuls **en silence**.

Préexistant, mais **c'est la racine que cette story prétend fermer** : `@IsObject()` sur les 3 sites.
**Mesuré en docker** : `400 hypotheses must be an object` · `400 cible must be an object`.

| Mutation ajoutée | Observé |
| --- | --- |
| **M6** — `@IsObject()` retiré d'**un** DTO | ✅ 1 rouge, le bon site |
| **M7** — la condition de l'avertissement de simulation inversée | ✅ 2 rouges |

> ⚠️ **M7 a d'abord été non probante** (`TS6133` sur une variable devenue inutilisée). Rejouée en
> **inversant** la condition plutôt qu'en supprimant le bloc — même intention, code compilable.

**Écartés après vérification** (matrices exécutées par le relecteur) : le passage 500 → 400 n'est
**ni** une fuite **ni** un vecteur d'énumération (les guards Nest s'exécutent **avant** les pipes ⇒
anonyme = **401**, le pipe n'est jamais atteint) — et il **améliore** l'anti-énumération, le 400
tombant désormais **avant** tout lookup de base ; `@IsDefined()` n'affaiblit ni `@ValidateNested` ni
`forbidNonWhitelisted` (22 cas : champ surnuméraire, `$ne`, types inattendus ⇒ tous 400) ; **aucune
pollution de prototype** ; **injection NoSQL structurellement impossible** (la borne est *toujours*
un `ObjectId` produit par `createFromTime`, jamais une valeur d'entrée — 24 entrées exotiques
refusées) ; parsing des drapeaux **fail-safe** quel que soit l'ordre ; le CLI **ne vole aucun message
Kafka** (`MigrationCliModule` n'importe ni `KafkaModule` ni `ReadModelsModule`).

### Portes de qualité

lint **0 warning** · build ✅ · **941** unitaires (95 suites) · **190** e2e (20 suites) ·
couverture **98,68 / 93,11 / 98,60 / 98,64** — `rollback-migration.service.ts` à **100 %**.

### Clôture — 2026-08-17

PR [`prospera-bilan-service#44`](https://github.com/MoneyVibesGroup/prospera-bilan-service/pull/44)
**rebase-mergée** sur `dev` (`a530f20` → `89b31cd`), branche supprimée.

⚡ **Ce que cette story aura surtout appris** : ses **deux** correctifs ont été **invalidés par leur
propre revue** avant d'être justes — la validation d'horodatage (démentie par son test : la date du
jour n'est pas dans le futur) puis les avertissements (inertes sous `logger: false`). Aucun des deux
n'aurait été détecté par les tests écrits en même temps qu'eux.
