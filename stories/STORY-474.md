# STORY-474 : La comparaison ne publie pas les hypothèses des scénarios comparés

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en essayant d'écrire la ligne « ce qui distingue ces trois scénarios » du tableau comparatif.

---

## Le fait

`ComparaisonScenario` porte `hypothesesId`, `nom`, `hypothesesVersion`, `base` et les résultats —
**aucun des neuf paramètres**. Le tableau comparatif peut donc afficher que « Prudent 2026 » finit à
−4 092 714 et « Optimiste 2026 » à −2 087 764, mais **pas pourquoi**.

C'est la première question de celui qui regarde deux colonnes côte à côte, et c'est la seule que la
réponse ne permet pas de traiter. L'écran doit émettre **2 à 5 appels** `GET …/bilan/hypotheses/:id`
supplémentaires pour pouvoir écrire « croissance 5 % contre 15 %, financement 0 contre 2 000 000/an ».

Le service **a** les jeux en main : `comparer()` les charge (`this.hypotheses.find({_id: {$in}})`),
lit `jeu.hypotheses` pour projeter, et ne les reporte pas dans la réponse.

## Critères d'acceptation

- [ ] AC-1 — `ComparaisonScenario.hypotheses` porte les neuf paramètres du jeu **dans la version
      utilisée pour la projection** (pas la version courante si elles diffèrent).
- [ ] AC-2 — La réponse porte aussi, au niveau racine, la **liste des paramètres qui diffèrent** entre
      les scénarios comparés (`parametresDivergents: string[]`) : c'est le seul calcul que le serveur
      peut faire mieux que le client, puisqu'il voit tous les jeux d'un coup.
- [ ] AC-3 — Aucun appel supplémentaire n'est nécessaire pour légender la comparaison : un test e2e
      compose la colonne « hypothèses » depuis **une seule** réponse.

## Conséquences ailleurs

- Avec **STORY-473**, ces deux ajouts ramènent la comparaison à **un** appel là où l'écran en fait
  aujourd'hui **1 + 2n**.
