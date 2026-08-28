# STORY-546 : Mise en équivalence — une ligne au bilan, une ligne au résultat, et rien d'autre

Status: ready-for-dev

**Épic :** EPIC-139 — Impôts différés et mise en équivalence
**Service :** `bilan-service` — module `consolidation`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-530** (le périmètre porte la méthode)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

La mise en équivalence est la méthode des **entreprises associées** — celles sur lesquelles le groupe
exerce une **influence notable** sans les contrôler. Et c'est la méthode **la plus simple des trois**,
à condition de ne pas la traiter comme les deux autres :

| Ce qu'on NE fait PAS | Ce qu'on fait |
|---|---|
| reprendre les actifs et dettes | **une seule ligne à l'actif** : quote-part de capitaux propres |
| reprendre les charges et produits | **une seule ligne au résultat** : quote-part de résultat |
| éliminer les réciproques | *(sans objet — rien n'est repris)* |
| calculer des minoritaires | *(sans objet)* |

⚠️ **Le piège est de la traiter comme une intégration proportionnelle.** Les deux « prennent un
pourcentage », et elles n'ont rien à voir : l'intégration proportionnelle reprend **ligne à ligne**
au pourcentage, la mise en équivalence reprend **une ligne**. Les confondre gonfle le bilan
consolidé de tous les actifs et dettes d'une entité que le groupe ne contrôle pas.

## Critères d'acceptation

- [ ] AC-1 — La valeur d'équivalence = quote-part de **capitaux propres retraités** (STORY-541) de
      l'entité, **à la date de clôture**, sur le **pourcentage d'intérêt**.
- [ ] AC-2 — La quote-part de résultat apparaît sur **une ligne distincte** du compte de résultat, et
      **jamais fondue** dans le résultat d'exploitation.
- [ ] AC-3 — ⛔ **Aucun actif, aucune dette, aucune charge, aucun produit de l'entité mise en
      équivalence n'entre dans les états consolidés.** Test de non-régression explicite : basculer
      une entité d'intégration globale à mise en équivalence doit **retirer** ses lignes, pas les
      réduire.
- [ ] AC-4 — Un **écart d'acquisition** sur une entité mise en équivalence est **inclus dans la
      valeur d'équivalence**, pas présenté séparément à l'actif.
- [ ] AC-5 — Une quote-part de capitaux propres devenue **négative** est traitée selon la règle du
      référentiel (arrêt à zéro sauf engagement), et **le fait est signalé**, jamais silencieux.
- [ ] AC-6 — Les **résultats internes** avec une entité mise en équivalence sont éliminés **à hauteur
      du pourcentage détenu** seulement. ⚠️ Cas rare, souvent oublié, et il fausse la ligne unique.

## Notes

- Voir [[STORY-530]] (la méthode est déclarée, jamais déduite du %), [[STORY-541]], [[STORY-543]].
