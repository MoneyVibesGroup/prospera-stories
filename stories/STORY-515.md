# STORY-515 : Sinistres — déclaration, évaluation, règlement, recours et sauvetages

Status: ready-for-dev

**Épic :** EPIC-130 — Sinistres et règlements
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

Le sinistre est l'autre moitié du cycle inversé : il **survient**, il est **déclaré**, il est
**évalué**, il est **réglé** — quatre dates, souvent quatre exercices différents.

⚠️ **La date qui compte comptablement est celle de la SURVENANCE, pas celle du règlement.** Un
sinistre survenu en 2025 et payé en 2027 est une charge de **2025**. C'est précisément ce qui rend
la PSAP nécessaire (STORY-517), et c'est ce que le plan CIMA packagé ne sait pas encore exprimer :
`RC1` mappe le compte `60` — les **prestations payées**.

## Critères d'acceptation

- [ ] AC-1 — Un sinistre porte **quatre dates distinctes** : survenance, déclaration, évaluation,
      règlement. Aucune n'est déduite d'une autre.
- [ ] AC-2 — L'**évaluation** du sinistre (l'estimation de ce qu'il coûtera) est un **événement
      daté et versionné** : elle change dans le temps, et chaque révision est conservée. Écraser
      l'évaluation précédente effacerait la matière de la cadence (STORY-516).
- [ ] AC-3 — Les **recours** (contre un tiers responsable) et les **sauvetages** (récupération d'un
      bien) sont tenus **séparément** et viennent en **atténuation** de la charge de sinistre —
      jamais en produit.
- [ ] AC-4 — Un sinistre est rattaché à son **contrat** et donc à sa **catégorie Vie / Non-Vie**
      (AD-3) : la ventilation ne se reconstitue pas après coup.
- [ ] AC-5 — Un sinistre **rouvert** après clôture est exprimable et tracé. C'est un cas courant, et
      un modèle qui ne le prévoit pas force à créer un second sinistre — ce qui fausse tous les
      comptages.
- [ ] AC-6 — ⚠️ Périmètre : ce module **enregistre** un sinistre, il ne le **gère** pas (pas
      d'expertise, pas de workflow de gestion) — Q1 de la spine.

## Notes

- Voir [[STORY-516]], [[STORY-517]], [[STORY-520]] (la part des réassureurs).
