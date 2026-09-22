# TICKET FRONTEND — le catalogue des états CIMA de l'art. 433 (STORY-523)

**Service :** `bilan-service` · **Route existante, enrichie :**
`POST /api/v1/dossiers/:dossierId/bilan/etats/resultat-cima/dry-run`
**Statut back :** livré · **Artefact :** `etats-cima@1.0`

---

## Ce qui change

La réponse des états de résultat CIMA (STORY-521) gagne un champ **`catalogue`** : les **46 états
modèles** de l'article 433, chacun avec son statut de production.

```jsonc
{
  "agrement": "VIE_CAPITALISATION",
  "compte80Vie":         { "...": "inchangé" },
  "compte80TouteNature": { "...": "inchangé" },
  "compte87":            { "...": "inchangé" },
  "articulation":        { "...": "inchangé" },
  "catalogue": [
    {
      "code": "C20",
      "libelle": "Mouvement au cours de l'exercice inventorié des polices, capitaux ou rentes assurés",
      "rythme": "ANNUEL",
      "regime": "ENTREPRISE",
      "gabarit": "IMPOSE",
      "perimetre": "VIE_CAPITALISATION",
      "statut": "NON_PRODUIT",
      "produitPar": null,
      "postesPublies": 0,
      "lignesGabarit": 96,
      "reference": "Article 433 — « L'état C20 est établi par les entreprises d'assurances sur la vie »",
      "motif": "Non produit par la plateforme à ce jour — à établir hors produit. Gabarit relevé à l'Article 433."
    }
  ]
}
```

## ⛔ La règle d'affichage, et elle n'est pas négociable

**Aucun état ne se masque.** Un assureur doit savoir ce qu'il devra produire ailleurs : c'est
l'AC-3, et c'est la doctrine FE-073 transposée. Filtrer la liste sur `statut === "PRODUIT"`
**annulerait le livrable**.

| `statut` | Ce que l'écran doit montrer |
|---|---|
| `PRODUIT` | l'état, avec `postesPublies` / `lignesGabarit` visibles côte à côte |
| `PRODUIT_AILLEURS` | l'état, **avec le nom du service** (`produitPar`) — « disponible dans *assurance-service* » |
| `NON_PRODUIT` | l'état, **avec son code**, et son `motif` — « à établir hors produit » |
| `NON_APPLICABLE` | l'état, **grisé mais présent**, avec son `motif` qui cite le texte |

⚠️ `motif` est **toujours renseigné** et déjà rédigé en français : l'afficher tel quel suffit, il
n'y a pas de table de traduction à tenir côté front.

## Deux nombres, aucun verdict

`postesPublies` et `lignesGabarit` se présentent **côte à côte**, jamais fondus en un pourcentage
ni en une barre de complétion. Le back n'invente aucun seuil, et le front ne doit pas en inventer
un non plus : un état à `5 / 172` n'est pas « à 3 % », il est *« 5 postes publiés, gabarit officiel
de 172 lignes »*. Une jauge transformerait une mesure en promesse.

## Groupes et périodicités

- `regime: "GROUPE"` (12 états) : art. 422-1, réservés aux entreprises qui établissent des comptes
  **consolidés ou combinés**. Un assureur mono-entité n'en dépose aucun — une section repliée
  convient, **pas** un filtre qui les retire.
- `rythme` vaut `ANNUEL` (37), `SEMESTRIEL` (7) ou `TRIMESTRIEL` (2). Un groupement par rythme est
  le découpage naturel de l'écran.

## Le cas particulier de l'état C11

`C11` est le **seul** état dont `gabarit` vaut `LIBRE` : le Code délègue sa présentation à
l'entreprise. Il porte à la place `normeContenu` — les articles 337-1 à 337-4, qui en fixent le
contenu. L'afficher comme « gabarit manquant » serait faux ; c'est « forme libre, contenu normé ».

## Hors zone CIMA

`catalogue` est un **tableau vide** pour un dossier dont le référentiel n'est pas
`cima-assurances@*`. Le champ est toujours présent : pas de `undefined` à gérer.
