# STORY-420 : La balance rend le libellé de la RACINE — deux comptes différents y portent le même nom

Status: in_progress

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/referentiel/libelle-compte.ts`, `modules/cahiers/agregation`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-046**, à la revue « expert-comptable venant de Sage » demandée par le PO.

---

## Le fait, relevé à la source

Le libellé d'une ligne de balance est résolu par **le plus long préfixe du plan** :

```ts
// libelle-compte.ts — libelleDuCompte
for (const entree of referentiel.planDeComptes) {
  if (compte.startsWith(entree.numero) && (meilleur === null || entree.numero.length > meilleur.numero.length)) {
    meilleur = entree;
  }
}
return meilleur?.libelle ?? compte;
```

Le repli est **juste** — un plan normalisé ne liste pas les subdivisions, et l'exiger laisserait
la plupart des lignes sans libellé. Mais le plan packagé `syscohada-revise@2.1` compte
**174 comptes**, essentiellement des **têtes**. Vérifié sur l'artefact :

| compte réellement mouvementé | présent au plan ? | libellé rendu |
|---|---|---|
| `6051` (Électricité CEET) | **non** | `Autres achats` (de `605`) |
| `6055` (Carburant motos) | **non** | `Autres achats` (de `605`) |
| `6581` (Amendes & pénalités) | **non** | `Autres charges` (de `65`) |
| `622` (Loyer boutique) | **non** | `Services extérieurs A` (de `62`) |
| `571` (Caisse) | **non** | `Caisse` (de `57`) — celui-là passe |

⇒ **Deux lignes de la balance, de montants différents, portent le libellé « Autres achats ».**

---

## Ce que ça coûte, concrètement

C'est la balance que le cabinet **relit, valide et remet au client**, et c'est la seule pièce du
chemin cahiers qu'un tiers lira. Le comptable y cherche « Électricité » et trouve deux
« Autres achats » qu'il doit **rapprocher de mémoire** de ses propres catégories. Sur un dossier
de vingt catégories, c'est le moment où l'outil se fait contourner.

**Et le bon libellé existe déjà, à un jointure près** : chaque ligne de dépense porte sa
**catégorie** (STORY-083), et la catégorie porte à la fois `libelle` (« Électricité CEET »,
le langage du cabinet) et `compteCharge` (`6051`).

```ts
// types/cahier-depenses.ts — CategorieDepense
libelle: string;        // « le langage du cabinet »
compteCharge: string;   // classe 6, validé contre le plan
```

L'agrégation **lit ces lignes** pour ventiler ; elle jette le libellé de la catégorie et
redemande un libellé au plan.

⚠️ **Asymétrie à assumer** : côté **recettes**, il n'y a pas de catégorie — le compte est porté
directement par la ligne. Le libellé de la racine y reste donc le seul disponible, et c'est
acceptable : la classe 7 du plan descend au niveau `701`…`707`, là où la classe 6 s'arrête
souvent à deux chiffres.

---

## Ce qui est demandé

1. **Reporter le libellé de la catégorie sur la ligne de balance** quand toutes les écritures
   d'un compte viennent d'une **même** catégorie de dépense.
2. **Quand plusieurs catégories tombent sur le même compte** (parfaitement légitime), ne pas
   choisir : garder le libellé du plan et publier les catégories contributrices à côté —
   `libelleSource: 'PLAN' | 'CATEGORIE'` + `categories: string[]`. **Inventer un libellé
   composite serait pire que le générique** : il paraîtrait faire autorité.
3. Le champ `libelle` existant **ne change pas de sens** pour les lignes de recettes ni pour les
   balances des deux autres adaptateurs (Sage, saisie directe) — sinon un même compte
   changerait de nom selon la source, exactement l'incohérence que `libelleDuCompte` a été
   écrite pour empêcher.

---

## Critères d'acceptation

1. Une balance construite depuis les cahiers rend, pour `6051`, le libellé de la catégorie
   quand elle est unique, et `libelleSource: 'CATEGORIE'`.
2. Deux catégories sur un même compte ⇒ `libelleSource: 'PLAN'` + les deux libellés dans
   `categories`. Aucun libellé composite n'est fabriqué.
3. Les balances importées (Sage, STORY-086) et saisies (STORY-102) sont **inchangées** — testé.
4. Les lignes de **recettes** restent au libellé du plan, et c'est explicite dans le contrat.
5. OpenAPI régénéré.

---

## Notes

- ⚠️ **Ne pas confondre avec « enrichir le plan packagé »** : ajouter `6051` à
  `syscohada-revise-2.1.json` reviendrait à inventer une nomenclature de cabinet dans un
  référentiel normalisé, et le checksum de l'artefact vit dans **deux dépôts** (D-078-2). Le
  libellé qui manque n'est pas comptable, il est **propre au cabinet** — sa place est du côté
  de la catégorie, pas du référentiel.
- Voir [[FE-046]] (maquette), `stories/STORY-083.md` (les catégories), `stories/STORY-085.md`.

---

## Progress Tracking

**Statut : `in_progress`** — démarrée le **2026-08-31**, branches `MNV-420` sur `docs/` et
`balance-service`. PR module **#77**. **Un seul dépôt** : le plan packagé n'est pas touché (cf. les
Notes de la story — son checksum vit dans **deux** dépôts).

### Conception

| Décision | Ce qu'elle tranche |
|---|---|
| **D-420-1** | ⛔ **Aucun libellé COMPOSITE.** Plusieurs catégories sur un compte est une situation **légitime** ; « Électricité CEET / Carburant motos » **paraîtrait faire autorité**. Le plan reprend la main (`PLAN`) et les contributrices sont publiées **à côté** — ce qui dit ce que le compte agrège **sans prétendre le nommer**. |
| **D-420-2** | ⛔ **Les deux champs ne sont PAS au `SubmitBalanceDto`** : ils passent par un **paramètre explicite** de `submit`/`dryRun`/`buildCanonique`. C'est **mot pour mot la doctrine déjà écrite dans ce fichier** pour `origine` et `exerciceId` — « ce que l'APPELANT déclare » contre « ce que le SERVEUR constate ». Au DTO, un import Sage pourrait estampiller ses lignes « libellé de catégorie » **sans qu'aucune catégorie n'existe**, et la balance porterait ce mensonge jusqu'au client. |
| **D-420-3** | ⚠️ **CINQ points de recopie explicite** ont dû être étendus : le type, le schéma Mongoose, `versLigne` (relecture d'une balance **persistée**), `buildCanonique` (persistance) et `fusionnerParCompte` (socle ⊕ mouvements). **En manquer un rendait le livrable inerte sur un chemin** — le champ n'existerait qu'en `dryRun`, ou disparaîtrait **dès qu'un socle d'à-nouveaux existe**, c'est-à-dire sur tous les dossiers en année N+1. |
| **D-420-4** | `fusionnerParCompte` ne conserve la provenance qu'au **contributeur unique** — exactement la règle de `sources` (STORY-370). Un compte alimenté par le socle **et** par les mouvements n'est plus « le compte de cette catégorie » : la taire vaut mieux que l'affirmer sur une ligne qu'elle ne décrit plus qu'en partie. |
| **D-420-5** | Les comptes de **contrepartie** sont exclus du nommage, même si une catégorie mal paramétrée en désignait un : la caisse d'un dossier n'est pas « Loyer boutique ». Le cas est théorique (classe 6 contre classe 4/5) — le rendre **impossible** coûte une ligne, l'inverse coûterait un nom faux sur une ligne de trésorerie. |
| **D-420-6** | Une catégorie **supprimée** depuis la saisie laisse le compte **au plan**. Écrire « catégorie supprimée » serait pire que le générique. |
| **D-420-7** | `categories` porte **`default: undefined`** au schéma. Sans lui, Mongoose applique un défaut **implicite `[]`** à tout chemin de type tableau, et une recette se persisterait avec `categories: []` — « aucune catégorie ne contribue » **affirmé**, là où la vérité est « ce compte ne relève pas des catégories ». Le piège de STORY-370, à l'identique, atteint par la même porte. |

### Portes DoD

lint **0 warning** · build OK · **3 403** unitaires · **851** e2e (26 suites) · couverture
**99,14 / 92,32 / 98,62 / 99,25**.

### Passe de mutation — 11 mutations, 11 rouges, 11 compilent… après **deux vertes**

| # | Mutation | Verdict |
|---|---|---|
| M1 | un libellé **composite** fabriqué à plusieurs catégories | 🔴 |
| M2 | les `categories` ne sont plus **triées** | 🔴 |
| M3′ | les **contreparties** ne sont plus exclues | 🔴 |
| M4 | une catégorie supprimée reçoit un libellé **inventé** | 🔴 |
| M5 | `libelleSource` jamais servi sur les recettes (AC-4) | 🔴 |
| M6′ | la recopie de `versLigne` supprimée | 🔴 |
| M7″ | la recopie de `buildCanonique` neutralisée | 🔴 |
| M8′ | la fusion abandonne la provenance **même** à contributeur unique | 🔴 |
| M9′ | la fusion **garde** la provenance à plusieurs contributeurs | 🔴 |
| M10 | `buildCanonique` **invente** une provenance sur toutes les lignes | 🔴 |

⚡⚡ **Deux mutations sont d'abord restées VERTES, et les deux accusaient mes tests — pas les
mutations.**

1. **Mon test de fusion passait pour l'ORDRE des contributeurs, pas pour leur NOMBRE.** Le cumul est
   initialisé sur le **premier** contributeur ; en plaçant le socle (sans provenance) en premier,
   `libelleSource` restait `undefined` et rien n'était émis — **même sans la garde**
   `contributeurs === 1`. Le test décrivait donc une propriété que le code ne devait pas au filet
   qu'il prétendait éprouver. Corrigé en faisant venir **en premier** la ligne qui **porte** la
   provenance : la garde est alors seule à empêcher la fuite.
2. **L'unitaire ET l'e2e de l'agrégation MOCKENT `BalanceService`**, et le mock rend `{...dto}` —
   donc **plus permissif que le vrai service**. Neutraliser la recopie de `buildCanonique` ne
   cassait rien, alors que c'est le point où le champ serait **jeté avant la base**. ⇒ deux tests
   ajoutés sur le **service réel** (`balance.service.spec.ts`), et les mutations rougissent.

⚠️ **La leçon commune** : un test peut passer *parce qu'un mock est plus généreux que la
production*, ou *parce que l'ordre des données masque la garde*. Dans les deux cas il décrit le
banc d'essai, pas le code. Trois mutations ont par ailleurs été **rejetées** pour non-compilation
(`noUnusedLocals`) et rejouées sous forme compilable — une mutation qui ne compile pas ne prouve
rien.

### Vérification docker — le défaut fermé, et la persistance prouvée sur le document réel

Stack réelle, tenant réel, **deux catégories** et **trois dépenses** créées **par l'API**.

```
COMPTE   LIBELLE                      SOURCE      CATEGORIES
571      Caisse                       PLAN        —
6051     Électricité CEET             CATEGORIE   ["Électricité CEET"]
6055     Carburant motos              CATEGORIE   ["Carburant motos"]
706      Services vendus              PLAN        —
```

⚡ **`6051` et `6055` cessent d'être « Autres achats »** — le titre de la story, servi par le
contrat. Les recettes et la contrepartie restent au plan, **et le disent** (AC-4).

**AC-2, sur la machine** : une **troisième** catégorie posée sur `6051` le fait basculer à
`libelle: "Autres achats"`, `libelleSource: 'PLAN'`, `categories: ["Groupe electrogene",
"Électricité CEET"]` — **aucun composite**.

**Persistance, relue en `mongosh` sur le document réel** : les quatre lignes portent
`libelleSource`, `6051`/`6055` portent `categories`… et **`571` et `706` n'ont AUCUNE clé
`categories`**. ⇒ le défaut **implicite `[]`** de Mongoose n'a pas frappé (D-420-7) — vérifié là où
il se voit, c'est-à-dire **pas** dans un test unitaire, qui mocke Mongoose.
