# STORY-547 : Conversion des comptes d'une filiale étrangère — trois taux, et l'écart va en capitaux propres

Status: ready-for-dev

**Épic :** EPIC-140 — Conversion des comptes des entités étrangères
**Service :** `bilan-service` — module `consolidation`
**Points :** 13 · **Sprint :** S20
**Prérequis :** ⛔ **STORY-489** (la devise au contrat de balance) · **STORY-490** · **STORY-495** (les cours et leur source)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

C'est la story qui **relie la consolidation à toute la trajectoire internationale** : dès qu'une
filiale tient ses comptes dans une autre monnaie — Guinée en GNF, Ghana en GHS, Nigeria en NGN, une
holding en EUR — ses états doivent être **convertis** avant d'être agrégés.

⛔ **Et elle est structurellement bloquée aujourd'hui** : le contrat canonique de balance **ne porte
aucune devise** ([[STORY-489]]). Deux balances de monnaies différentes y sont **additionnables sans
qu'aucun contrôle ne s'en aperçoive** — ce qui, dans un module de consolidation, est le mode de panne
le plus coûteux imaginable.

## La méthode du cours de clôture — trois taux, pas un

| Élément | Taux |
|---|---|
| Actifs et passifs | **cours de clôture** |
| Charges et produits | **cours moyen de la période** |
| Capitaux propres | **cours historique** (celui de leur constitution) |

⇒ **Le bilan converti ne s'équilibre plus.** L'écart n'est ni un gain ni une perte : c'est un
**écart de conversion**, qui va **en capitaux propres** et **ne passe jamais par le résultat** tant
que la filiale reste au périmètre.

⚡ **C'est le point le plus contre-intuitif de la story** — et le passer au résultat, réflexe naturel
puisque l'écart ressemble à une différence de change, ferait varier le résultat consolidé au gré des
cours sans qu'aucune opération n'ait eu lieu.

## Critères d'acceptation

- [ ] AC-1 — La devise de chaque entité vient du **contrat de balance** (STORY-489), jamais d'un
      paramètre d'écran. ⛔ Une entité sans devise déclarée **bloque la consolidation**, elle ne
      prend pas celle du groupe par défaut.
- [ ] AC-2 — Les **trois taux** sont appliqués selon la nature de l'élément. Un seul taux appliqué
      partout est refusé par un test.
- [ ] AC-3 — Les cours sont **saisis avec leur source et leur date** ([[STORY-495]] AC-2). ⚡ Le
      produit ne s'abonne à aucune source de taux : *un cours automatique sans source opposable
      aurait l'air juste*.
- [ ] AC-4 — ⛔ **L'écart de conversion va en capitaux propres, sur une ligne dédiée, et JAMAIS au
      résultat.** Test explicite : faire varier le cours de clôture ne doit **pas** changer le
      résultat consolidé.
- [ ] AC-5 — La **part minoritaire de l'écart de conversion** revient aux minoritaires
      ([[STORY-544]]).
- [ ] AC-6 — La méthode du **cours historique** (filiale non autonome, prolongement de l'activité de
      la mère) est **déclarée par entité**, pas déduite. ⚠️ Elle donne un résultat différent, et le
      choix appartient au groupe.
- [ ] AC-7 — Un groupe **mono-devise ne change pas d'un octet** : aucune conversion, aucune ligne
      d'écart. Non-régression obligatoire.

## Notes

- Voir [[STORY-489]] (le blocage réel), [[STORY-495]], [[STORY-544]], [[STORY-492]].
