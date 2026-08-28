# STORY-544 : Intérêts minoritaires — ce qui appartient au groupe et ce qui ne lui appartient pas

Status: ready-for-dev

**Épic :** EPIC-138 — Écarts d'acquisition et intérêts minoritaires
**Service :** `bilan-service` — module `consolidation`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-542** (éliminations) · **STORY-543** (écarts)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

L'intégration globale reprend **100 %** des actifs et des dettes d'une filiale détenue à 60 %. Il
faut donc **isoler les 40 % qui n'appartiennent pas au groupe** : les **intérêts minoritaires** (ou
« participations ne donnant pas le contrôle »).

Ils apparaissent à **deux endroits, et l'un des deux est celui qu'on oublie** :

| Où | Quoi |
|---|---|
| Au **passif** | quote-part minoritaire des **capitaux propres** consolidés |
| Au **compte de résultat** | quote-part minoritaire du **résultat** — ⚠️ le « résultat net part du groupe » se lit **après** cette déduction |

⛔ **Le nombre que lit un banquier, un actionnaire ou un analyste est le résultat PART DU GROUPE.**
Publier le résultat consolidé total sous le libellé « résultat net » sur un groupe à minoritaires
significatifs est un contresens — et rien, dans l'équilibre du bilan, ne le signale.

## Critères d'acceptation

- [ ] AC-1 — Les intérêts minoritaires sont calculés sur le **pourcentage d'intérêt** (STORY-530
      AC-1), **pas** sur le pourcentage de contrôle. ⚠️ Les deux diffèrent en cascade, et c'est
      exactement là que l'erreur se produit.
- [ ] AC-2 — Ils portent sur les capitaux propres **retraités et après éliminations** — donc **après**
      STORY-541, 542 et 543, jamais sur les comptes individuels.
- [ ] AC-3 — ⚡ **La part minoritaire des RÉSULTATS INTERNES éliminés leur revient aussi.** Éliminer
      100 % d'une marge interne réalisée par une filiale à 60 % et n'en imputer aucune part aux
      minoritaires fausse les deux lignes à la fois.
- [ ] AC-4 — Le compte de résultat publie **trois lignes distinctes** : résultat consolidé total,
      **part des minoritaires**, **part du groupe**. Et leur somme se vérifie.
- [ ] AC-5 — Un groupe **sans minoritaires** (filiales à 100 %) publie une part minoritaire **nulle
      et visible**, pas absente. ⚡ Doctrine constante du produit : *un état qui disparaît fait
      chercher ce qu'on a cassé*.
- [ ] AC-6 — Une quote-part minoritaire **négative** (filiale déficitaire) est traitée selon la règle
      déclarée par le référentiel, **jamais bornée à zéro en silence**.

## Notes

- Voir [[STORY-530]], [[STORY-542]], [[STORY-543]], [[STORY-548]].
