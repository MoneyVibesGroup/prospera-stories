---
stepsCompleted: [1]
inputDocuments:
  - prospera-stories/stories/STORY-531.md (arbitrage PO du 2026-08-28 : niveau ③)
  - prospera-stories/stories/STORY-529.md, STORY-530.md (multi-société et périmètre daté)
  - prospera-stories/analyse-scalabilite-multireferentiel-2026-08-27.md §6.3
  - prospera-stories/sprint-status.yaml (reserved_ranges, relevé le 2026-08-28)
---

# Consolidation SYSCOHADA (niveau ③) — Découpage en épics

> **Arbitrage PO du 2026-08-28 :** *« Je veux la partie 3. »* — la **consolidation complète**, et
> non l'agrégation ni l'agrégation avec éliminations.

## Vue d'ensemble

**Série retenue : épics EPIC-137 → EPIC-141.** Dernier épic attribué : **EPIC-136** (multi-société et
périmètre, pris le 2026-08-27). **Stories : STORY-541 → STORY-548 (8 stories, 94 pts), toutes S20.**

---

## Ce que le niveau ③ ajoute, et pourquoi ce n'est pas une story

Le niveau ① (agrégation) additionne. Le niveau ② y ajoute les éliminations. **Le niveau ③ ajoute sept
traitements dont aucun ne se déduit des balances** — chacun demande une donnée que le produit ne
possède pas encore, ou un jugement qu'il doit héberger sans le produire.

| Épic | Stories | Ce qui rend le traitement irréductible |
|---|---|---|
| **EPIC-137** Homogénéisation et éliminations | **541** · **542** | Il faut un **référentiel de méthodes du groupe**, et distinguer les réciproques (sans effet résultat) des **résultats internes** (avec effet) |
| **EPIC-138** Écarts d'acquisition et minoritaires | **543** · **544** | L'affectation des **écarts d'évaluation** est une évaluation, pas un calcul ; les minoritaires se prennent sur le **% d'intérêt**, pas de contrôle |
| **EPIC-139** Impôts différés et mise en équivalence | **545** · **546** | Chaque retraitement déplace du résultat sans déplacer l'impôt ; la mise en équivalence ne reprend **qu'une ligne** |
| **EPIC-140** Conversion des entités étrangères | **547** | **Trois taux**, et l'écart va **en capitaux propres, jamais au résultat** |
| **EPIC-141** États consolidés et notes | **548** | Les notes de **périmètre** et de **variation de périmètre** sont l'essentiel de la valeur probante |

---

## Les cinq pièges, nommés une fois pour toutes

1. ⛔ **Tout mettre en écart d'acquisition.** Le réflexe évite d'affecter les écarts d'évaluation aux
   actifs identifiables — donc d'amortir ceux qui portent sur des biens amortissables — et
   **surévalue le résultat de tous les exercices suivants**. *(STORY-543)*
2. ⛔ **Appliquer la règle IFRS au goodwill.** En **SYSCOHADA, l'écart d'acquisition positif
   s'AMORTIT** ; il ne fait pas l'objet d'un simple test de dépréciation. *(STORY-543 AC-4)*
3. ⛔ **N'éliminer que les opérations réciproques.** Les états paraissent propres et **le résultat est
   surévalué**, parce que les marges internes sur stocks n'ont pas été retirées. *(STORY-542)*
4. ⛔ **Calculer un impôt différé sur une élimination réciproque ou sur un goodwill.** Ni l'une ni
   l'autre n'a de différence temporelle : on fabrique un impôt qui n'existe pas. *(STORY-545)*
5. ⛔ **Passer l'écart de conversion au résultat.** Il ressemble à une différence de change ; il n'en
   est pas une. Le passer au résultat le ferait varier au gré des cours **sans qu'aucune opération
   n'ait eu lieu**. *(STORY-547)*

---

## ⛔ Ce que le niveau ③ exige et que le programme n'a pas encore

| Prérequis | Story | Sans lui |
|---|---|---|
| Plusieurs sociétés par organisation | **529** | aucun groupe n'existe |
| Périmètre daté, % contrôle **et** % intérêt, méthodes | **530** | les minoritaires sont incalculables |
| **Devise au contrat de balance** | **489** | ⛔ deux balances de monnaies différentes s'additionnent **sans qu'aucun contrôle ne le voie** — le pire mode de panne possible dans un module de consolidation |
| Bornes et durée d'exercice | **532** | une filiale peut clôturer à une autre date que la mère |
| Cours de change et leur source | **495** | rien à convertir |

⚡ **STORY-489 est le blocage dur.** Tant que le contrat de balance ne porte pas de devise, EPIC-140
ne peut pas exister — et un groupe multi-pays est précisément ce que la trajectoire CEDEAO promet.

---

## Ce que ce module NE fait pas

- Il **ne combine** pas (comptes combinés d'entités sans lien capitalistique) — cas prévu par
  l'AUDCIF, hors périmètre, et **nommé** plutôt que passé sous silence.
- Il **ne produit pas** les seuils légaux d'obligation de consolider : c'est un conseil, pas un
  calcul.
- Il **ne consolide pas** en IFRS. Le référentiel de consolidation est **SYSCOHADA**, comme le reste
  du produit — la question IFRS se pose avec la phase 2 CEDEAO, pas ici.
