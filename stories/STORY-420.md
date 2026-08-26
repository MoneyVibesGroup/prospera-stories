# STORY-420 : La balance rend le libellé de la RACINE — deux comptes différents y portent le même nom

Status: ready-for-dev

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
