# STORY-543 : Écart de première consolidation — écarts d'évaluation d'abord, écart d'acquisition ensuite, et jamais l'inverse

Status: ready-for-dev

**Épic :** EPIC-138 — Écarts d'acquisition et intérêts minoritaires
**Service :** `bilan-service` — module `consolidation`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-530** (le périmètre, les % et les dates d'entrée)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

À l'entrée d'une filiale au périmètre, le **coût d'acquisition des titres** ne vaut presque jamais la
**quote-part de capitaux propres** acquise. La différence est l'**écart de première consolidation**,
et elle se décompose **dans cet ordre** :

```
Coût d'acquisition des titres
− quote-part de capitaux propres comptables acquis
= ÉCART DE PREMIÈRE CONSOLIDATION
      ├── ÉCARTS D'ÉVALUATION   → affectés aux actifs et passifs IDENTIFIABLES
      │                            (terrain sous-évalué, marque, provision omise…)
      │                            ⇒ ils SUIVENT le sort de l'élément qu'ils portent :
      │                              un écart sur un bien amortissable s'AMORTIT
      └── ÉCART D'ACQUISITION   → le résidu, non affectable
```

⛔ **L'ordre n'est pas une préférence.** Tout mettre en écart d'acquisition — le réflexe — évite
d'amortir les écarts d'évaluation portant sur des biens amortissables, et **surévalue le résultat
consolidé de tous les exercices suivants**.

⚠️ **Et en SYSCOHADA, l'écart d'acquisition positif s'AMORTIT** sur sa durée d'utilisation — ce n'est
pas IFRS, où il fait l'objet d'un test de dépréciation. Appliquer la règle IFRS ici produirait un
résultat consolidé faux, régulièrement, et de façon défendable en apparence.

## Critères d'acceptation

- [ ] AC-1 — L'écart de première consolidation est calculé **à la date d'entrée au périmètre**
      (STORY-530 AC-1), sur les capitaux propres **retraités** (STORY-541), jamais sur les comptes
      individuels bruts.
- [ ] AC-2 — Les **écarts d'évaluation sont saisis et affectés élément par élément**, avec leur
      justification. ⛔ Le produit **ne les devine pas** — c'est une évaluation, comme une provision
      technique : il **héberge** l'affectation et sa méthode.
- [ ] AC-3 — Un écart d'évaluation portant sur un bien **amortissable** génère un **amortissement
      complémentaire** chaque exercice, automatiquement, jusqu'à la sortie du bien.
- [ ] AC-4 — L'**écart d'acquisition positif** est **amorti** sur une durée déclarée — règle
      SYSCOHADA, publiée par le référentiel, **jamais codée**. ⛔ Test de mutation : changer la durée
      au référentiel doit changer la dotation.
- [ ] AC-5 — Un **écart d'acquisition négatif** est traité selon la règle du référentiel (reprise au
      résultat), et **il est signalé** : un écart négatif significatif traduit le plus souvent une
      **erreur d'affectation des écarts d'évaluation**, pas une bonne affaire.
- [ ] AC-6 — L'écart est **figé à la date d'entrée** : il ne se recalcule pas quand les capitaux
      propres de la filiale évoluent. Test de rejeu sur trois exercices.
- [ ] AC-7 — La **part des minoritaires** dans les écarts d'évaluation est traitée selon la méthode
      déclarée, et l'écart d'acquisition suit ([[STORY-544]]).

## Notes

- Voir [[STORY-530]], [[STORY-541]], [[STORY-544]], [[STORY-545]].
