# STORY-372 : `bilan-service` réécrit — la garde `dossierId` avait été posée sans son écrivain

Status: done

**Epic :** EPIC-043 — Le dossier client devient l'unité de travail du cabinet
**Points :** 3 · **Complexité :** medium · **Sprint :** 20 (backend) · **Service :** `bilan-service`
(`:3004`)
**Origine :** défaut trouvé par la **vérification docker de STORY-368** (2026-08-17), introduit par
**`MNV-356`** (STORY-356)
**Décision :** **D8** *(le dossier est l'unité de travail)*
**Assigné à :** vivianMoneyVibesGroupes

---

## Le défaut

`MNV-356` a posé `dossierId` en **`required: true`** au schéma des **quatre** collections qu'elle
migrait — et **aucun chemin d'écriture ne le renseigne**. Le commentaire du schéma l'assume et
renvoie à STORY-357 :

> *« les chemins d'écriture existants ne portent pas encore `dossierId` ; ils seront re-scopés par
> STORY-357. Le type permissif laisse ces services compiler ; le schéma les fait échouer à
> l'écriture, ce qui est exactement la garde. »*

⛔ **Sauf que « échouer à l'écriture » ne veut pas dire « refuser proprement » : ça veut dire 500.**
Et ça ne touche pas un chemin, mais **quatre**.

| Collection | Schéma | Route d'écriture | Mesuré sur stack neuve |
| --- | --- | --- | --- |
| `exercices` | `exercice.schema.ts` | `POST /api/v1/bilan/exercices` | ⛔ **500** — `Exercice validation failed: dossierId: Path 'dossierId' is required.` |
| `mapping_overrides` | `mapping-override.schema.ts` | `POST /api/v1/bilan/mapping-overrides` | ⛔ **500** — `MappingOverride validation failed: …` |
| `snapshots_liasse` | `snapshot-liasse.schema.ts` | `POST /api/v1/bilan/etats/:id/valider` | ⛔ **500** — `SnapshotLiasse validation failed: …` |
| `jeux_hypotheses` | `hypotheses.schema.ts` | `POST /api/v1/bilan/hypotheses` | ⛔ même garde ; **transitivement inatteignable** (exige un `baseJeuEtatsId`, donc un jeu **validé**) |

> ⚡ **Conséquence réelle : `bilan-service` ne peut plus rien écrire.** Ouvrir un exercice, proposer
> une surcharge de mapping, valider une liasse — les trois rendent 500. Le service **lit**
> parfaitement (la liasse se calcule, le référentiel se sert) ; c'est **l'écriture entière** qui est
> morte. Aucun test ne le voyait : les unitaires mockent le modèle Mongoose, et les e2e mockent la
> couche données — **exactement l'angle mort que la DoD du projet nomme**.

## Pourquoi ce n'est PAS STORY-357

STORY-357 fait *« la liasse cesse d'appartenir au cabinet »* : elle **choisit** un dossier, re-scope
les **lectures**, et ferme le risque nommé dans son cadrage (la comparaison inter-exercices qui
mélangerait deux sociétés). C'est un travail de périmètre, pas un correctif.

Cette story-ci ne fait **qu'une** chose : **redonner un écrivain à la garde que 356 a posée**, avec
la valeur que 356 a elle-même choisie pour l'existant — le dossier **« Mon cabinet »** de
l'organisation. Après elle, l'état est cohérent : ce que la migration a rattaché et ce que le service
écrit désignent **le même dossier**. STORY-357 reste entière.

## Ce que la story livre

1. **Un résolveur unique** `orgId → dossierId du cabinet`, lu du read-model local `dossiers_dossier`
   (`{ estLeCabinet: true }`) — **la même résolution que le script de migration**, pas une seconde.
2. Les **quatre** chemins d'écriture le consomment. ⛔ Un correctif par site aurait laissé le
   cinquième écrivain futur retomber dans le même trou.
3. ⛔ **Fail-closed et EXPLICITE** : si l'organisation n'a pas encore son dossier « Mon cabinet »
   (read-model non convergé), l'écriture est **refusée avec un code métier**, jamais un 500, et
   jamais un document orphelin. ⚠️ *Le service dépend désormais de la convergence des dossiers — c'est
   D8, et c'était déjà vrai du script de migration, qui sort en erreur s'il reste des orphelins.*

## Critères d'acceptation

- **Étant donné** une organisation dont le dossier « Mon cabinet » est connu **quand** elle ouvre un
  exercice, propose une surcharge, ou valide une liasse **alors** l'écriture **réussit** et le
  document persisté porte le **`dossierId` de ce dossier**.
- **Étant donné** une organisation dont le read-model **ne connaît aucun** dossier de cabinet
  **quand** elle tente l'une de ces écritures **alors** elle reçoit un **refus métier explicite**
  (jamais 500), et **aucun document n'est écrit**.
- **Étant donné** le snapshot de liasse **quand** il est figé **alors** son `dossierId` est posé
  **dans la transaction** de validation — l'atomicité reste entière.
- ⛔ **Étant donné** le résolveur **quand** on le retire d'un seul des quatre sites **alors** un test
  vire au **rouge** pour ce site. ⚡ C'est ce qui empêche la correction d'être partielle.

## Ce que cette story ne fait PAS

- ⛔ Elle ne **choisit** pas de dossier : tout va au dossier « Mon cabinet », comme la migration l'a
  décidé pour l'existant. Le choix d'un dossier client est **STORY-357**.
- ⛔ Elle ne re-scope **aucune lecture** : les requêtes restent keyées `tenantId`. STORY-357.
- ⛔ Elle ne relâche **jamais** `required: true` — ce serait supprimer la garde de 356 au lieu de lui
  donner son écrivain, et rouvrir le risque d'orphelin silencieux.

## Definition of Done

- [x] Les **4** chemins d'écriture posent `dossierId` ; **un seul** résolveur.
- [x] Refus **explicite** (pas 500, pas d'orphelin) quand aucun dossier de cabinet n'est connu.
- [x] **Mutation-test** : retirer le résolveur d'un site fait virer un test au rouge, **site par site**.
- [x] **Vérification docker réelle** : les 3 routes mesurées à 500 rendent 2xx, et `mongosh` montre le
      `dossierId` **réellement écrit** ; le refus explicite mesuré aussi.
- [x] Seuils 65/90/90/90 tenus, lint 0, build OK, unit + e2e verts.

---

## Progress Tracking

### La correction est posée LÀ OÙ TOUTES LES ÉCRITURES PASSENT DÉJÀ

Le point de passage commun **existait** : `TenantScopedRepository.create()`, qui force déjà le
`tenantId`. Les 4 collections écrivent toutes à travers lui. La correction s'y greffe :

| Fichier | Rôle |
| --- | --- |
| `common/database/dossier-cabinet.resolver.ts` **(neuf)** | `orgId → dossier « Mon cabinet »`, lu de `dossiers_dossier`. **Même filtre que `migrate:dossiers`** — deux résolutions distinctes auraient fait diverger ce que la migration rattache et ce que le service écrit. Refuse en **409 `DOSSIER_CABINET_INCONNU`**. |
| `common/database/dossier-scoped.repository.ts` **(neuf)** | `DossierScopedRepository extends TenantScopedRepository` : `create()` force `dossierId` **comme** `tenantId`. |
| les **4** repositories | changent de classe de base + injectent le résolveur |
| `tenant-scoped.repository.ts` | `currentTenantId()` passe `private` → `protected` |

⚡ **Un correctif par site aurait laissé le cinquième écrivain retomber dans le trou.** Ici, une
future collection rattachée au dossier hérite de la garde en changeant sa classe de base.

⚠️ **Le chemin transactionnel fait exception, et c'est explicite** : `SnapshotLiasseRepository.creer()`
ne **peut pas** passer par `create()` (celui-ci n'accepte pas de `session` ; une insertion hors
transaction romprait l'atomicité de la validation). Il résout donc le dossier lui-même, **avant
d'insérer**.

> ⚠️ **Formulation rectifiée en revue** : la résolution a lieu **dans** la transaction (ouverte en
> `jeu-etats.service.ts:187`), pas avant elle. Sans conséquence, et vérifié : au moment du refus seul
> un `countDocuments` a eu lieu, le `catch` fait `abortTransaction`, le `finally` fait `endSession`
> ⇒ **ni document partiel, ni session fuitée**. Ce qui compte est que la résolution précède
> l'**insertion**, ce que le test de refus transactionnel épingle désormais.

### 🧹 Une duplication supprimée au passage

`SnapshotLiasseRepository` portait sa **propre copie** de la résolution fail-closed du `tenantId`,
uniquement parce que celle de la classe de base était `private`. La passer en `protected` supprime la
copie : **une seule** implémentation de cette garde, au lieu de deux qui pouvaient diverger.

### Mutation-test — SITE PAR SITE, comme l'AC l'exige

| # | Mutation | Attendu | Observé |
| --- | --- | --- | --- |
| **M1** | le stampage de `DossierScopedRepository.create()` est retiré | les 3 sites non transactionnels rouges | ✅ **exercice + hypothèses + mapping rouges**, snapshot **VERT** — les deux mécanismes sont bien **indépendants** |
| **M2** | le `dossierId` est retiré de l'écriture **transactionnelle** du snapshot | seul le snapshot rouge | ✅ **1 seul rouge**, le bon |
| **M3** | le `code` métier disparaît du 409 | le test de refus rouge | ✅ rouge |
| **M4** | le filtre `estLeCabinet` est retiré | le test du filtre rouge | ✅ rouge |

> ⚠️ **M3 a d'abord été NON PROBANT** : la première mutation (supprimer le `throw`) faisait échouer la
> suite par **erreur de compilation** (`TS6133`), pas par assertion — *une mutation rouge par erreur de
> compilation ne prouve rien*. Rejouée en gardant le code compilable.

### Vérification docker réelle — stack docker, 2026-08-17

| # | Contrôle | Résultat mesuré |
| --- | --- | --- |
| 1 | **read-model NON convergé** — `POST /bilan/exercices` et `/mapping-overrides` | ✅ **409 `DOSSIER_CABINET_INCONNU`** avec message actionnable — **le 500 a disparu** |
| 2 | read-model convergé — les **3** routes qui rendaient 500 | ✅ **201 / 201 / 200** |
| 3 | `POST /bilan/hypotheses` (4ᵉ site, redevenu **atteignable** puisqu'un jeu peut enfin être validé) | ✅ **201** |
| 4 | `mongosh` sur les **4** collections | ✅ `exercices` **1**, `mapping_overrides` **1**, `snapshots_liasse` **1**, `jeux_hypotheses` **1** — **tous** au `dossierId` du cabinet, **ORPHELINS = 0** |
| 5 | le snapshot figé **dans la transaction** | ✅ porte `dossierId` **et** `tenantId` **et** le checksum `8b7b29d8…` de STORY-368 |

⚠️ **Ce que la vérification discrimine** : le contrôle 1 échouerait à l'identique avant le correctif
(c'était un 500, pas un 409) et les contrôles 2-5 étaient **impossibles** — aucune écriture ne
passait. Le contrôle 4 est celui qui compte : il prouve la valeur **réellement écrite**, pas
seulement un code HTTP.

### ⛔ Défaut PRÉ-EXISTANT rencontré, non corrigé (hors périmètre)

`POST /api/v1/bilan/hypotheses` **sans le champ `hypotheses`** rend **500** au lieu de **400** :

```
ValidationError: JeuHypotheses validation failed: hypotheses: Path `hypotheses` is required.
```

`CreerHypothesesDto` porte `@ValidateNested()` + `@Type()` **sans** `@IsDefined()`/`@IsObject()` — et
⚡ **`@ValidateNested` seul ne dit RIEN d'un champ ABSENT** : le corps traverse la validation et va
mourir sur Mongoose. **C'est exactement le piège de STORY-185.** Racine différente de celle de cette
story (validation de DTO, pas garde `dossierId`) ⇒ **signalé, pas corrigé**.

### Revue de code — 5 constats, 5 traités, 0 bloquant

Le relecteur a **rejoué** la table de mutations et **recalculé** les portes (chiffres confirmés). Deux
constats portent sur des **affirmations fausses du diff lui-même** — le genre que cette story existe
précisément pour ne plus laisser passer.

| # | Constat | Conf. | Traitement |
| --- | --- | --- | --- |
| **C1** | ⚡ **6 commentaires devenus faux**, dont les **4 schémas** qui portaient encore mot pour mot *« le schéma les fait échouer à l'écriture, ce qui est exactement la garde »* — **la phrase qui EST la cause du défaut** — et le read-model annoncé *« HOOK INERTE »* alors qu'il est désormais lu à **chaque écriture** | 95 | **corrigé** — le read-model est déclaré **load-bearing** (le désactiver éteint l'écriture du service) |
| **C2** | ⚡ *« il n'y en a plus qu'une »* était **faux** : `VersionHypothesesRepository` portait une **3ᵉ copie octet pour octet** de la garde fail-closed | 95 | **corrigé** — copie supprimée, l'affirmation est devenue vraie |
| **C3** | ⚡ l'invariant *« valeur entrante ignorée »* n'était gardé par **rien** pour `dossierId` : inverser l'ordre du spread laissait **921 tests verts** | 95 | **corrigé** — test symétrique à celui du `tenantId` ; mutation **M5** rejouée ⇒ rouge |
| **C4** | la story écrivait *« avant la transaction »* ; la résolution a lieu **dans** la transaction (sans conséquence — `abort` + `endSession` vérifiés) | 95 | **formulation rectifiée** |
| **C5** | l'AC de refus n'était démontrée que sur **2 des 4** routes — pas sur le chemin **transactionnel**, le seul où le refus survient session ouverte | 90 | **corrigé** — test dédié ; mutation **M6** rejouée ⇒ rouge |

> ⚠️ **M6 a d'abord été NON PROBANTE DEUX FOIS** : la 1ʳᵉ tentative ne s'est **pas appliquée** (motif
> introuvable) et s'est lue « verte » — *le symétrique exact du piège de la mutation qui échoue à la
> compilation, et plus sournois : une mutation qui ne s'applique pas fait conclure que le test ne
> détecte rien*. La 2ᵉ est morte en `TS18004`. Seule la 3ᵉ, **assertée appliquée** et compilable, prouve
> quelque chose. ⇒ **toujours vérifier qu'une mutation a bien été écrite avant de lire son résultat.**

**Écartés** (doutes levés par vérification) : transaction laissée ouverte / snapshot orphelin — non
(`abortTransaction` + `endSession`, seul un `countDocuments` précède le refus) ; 409 avalé par un
`catch` — non, vérifié sur les 3 services et le mapper HTTP ; inversion de couche
`common/database` → `modules/read-models/schemas` — réelle mais **sans cycle** ; `as Partial<T>`
supposé masquer un typage — **le cast n'existe pas** dans le code.

### Revue de sécurité — **aucune vulnérabilité**, et deux angles tranchés par la mesure

Scan `opus` (jamais de downgrade), synthèse en session. **0 constat à confiance ≥ 80.** Les deux
points qui n'allaient **pas** de soi ont été vérifiés, pas supposés :

**⚡ `private` → `protected` sur une garde d'isolation multi-tenant N'ÉLARGIT RIEN.** `model` et
`tenantContext` étaient **déjà** `protected` : une sous-classe pouvait donc déjà écrire
`new Types.ObjectId(this.tenantContext.tenantId)` — c'est exactement ce que faisaient les 2 copies
supprimées. La méthode **ne prend aucun paramètre** (elle lit le contexte, elle ne permet pas de
*forger* un tenant), et `scope()` + les 5 `*For()` restent `private`. ⇒ **le changement RÉDUIT la
surface** : une implémentation fail-closed au lieu de trois.

**Pas de cross-org, pas d'injection NoSQL.** `resoudre()` n'a qu'un appelant, qui lui passe
**toujours** le tenant du contexte JWT — aucun DTO ni contrôleur n'expose `orgId` ou `dossierId`
(0 occurrence sur toute la surface HTTP), et `whitelist` + `forbidNonWhitelisted` rejetteraient un
`dossierId` glissé dans un corps. Injection d'opérateur **vérifiée empiriquement** :
`new Types.ObjectId({$ne:null})` lève `BSONError`. Le 409 ne peut décrire que **l'org de
l'appelant** ⇒ aucun oracle d'énumération. Transaction : `abortTransaction` gardé par
`inTransaction()` + `endSession()` en `finally` ⇒ **aucune session fuitée** même quand le 409 part
session ouverte.

### ⛔ Point relayé par la revue de sécurité, **corrigé** : une prémisse devenue fausse UNE STORY TROP TÔT

`RollbackMigrationService` documente une limite assumée — *« aujourd'hui aucun chemin d'écriture ne
pose `dossierId`, donc tout `dossierId` présent vient forcément de la migration »* — et annonce que
**« cela cesse d'être vrai avec STORY-357 »**.

⚡ **C'est cette story-ci qui l'a rendu faux.** Depuis, tout document créé porte un `dossierId`
**légitime** que la marche arrière détacherait **sans distinction** — et le schéma le déclarant
`required`, ces documents ne seraient plus ré-écrivables sans repasser par la migration. Le
commentaire est corrigé et l'outil déclaré **non sûr en l'état**. ⚠️ *Exactement la classe de défaut
que cette story répare : une prémisse écrite qui cesse d'être vraie sans que rien ne le dise.*

### Portes de qualité

lint **0 warning** · build ✅ · **921** unitaires (94 suites) · **190** e2e (20 suites) ·
couverture **98,68 / 93,11 / 98,60 / 98,63** — les 2 fichiers neufs à **100 %** sur les 4 axes.

⚠️ **7 batteries e2e** ont dû recevoir le résolveur stubé : ajouter une dépendance au constructeur
d'un repository oblige à mettre à jour **tous** les modules de test qui l'instancient, sinon
`Nest can't resolve dependencies` tue la suite entière.

### Clôture — 2026-08-17

PR [`prospera-bilan-service#43`](https://github.com/MoneyVibesGroup/prospera-bilan-service/pull/43)
**rebase-mergée** sur `dev` (`8f5fca6` → `a8a81df`), branche supprimée.

⚠️ **STORY-357 hérite d'un point d'application, pas d'une dette** : elle remplacera la *résolution*
(« Mon cabinet » → dossier client choisi) sans toucher à *l'endroit* où le `dossierId` est posé. Et
elle devra **borner ou retirer** `RollbackMigrationService`, dont la prémisse est tombée ici.
