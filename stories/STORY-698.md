# STORY-698 : Dans un groupe multi-devise, l elimination fiscale envoie un ecart de change en reserves

Status: ready-for-dev

**Épic :** EPIC-137
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-685** (élimination des écritures fiscales)
**Origine :** revue de code de STORY-685 (2026-10-02), constat n°2.

---

## Le fait

STORY-547 oblige à convertir le `15` au **cours historique**, alors que le `851` l'est au **cours moyen**.
La proposition de STORY-685 (`ecritures-fiscales.regles.ts`, `proposer`), appliquée aux soldes convertis,
lit le déséquilibre qui en résulte comme « la part des exercices antérieurs » et l'envoie en réserves.

**Scénario chiffré** — fille en GNF : `151 C 700 / 851 D 700` (pure dotation de l'exercice), cours
historique 100, cours moyen 95 ⇒ résiduel `151 = −70 000`, `851 = +66 500` ⇒ proposition
`Dr 151 70 000 / Cr 851 66 500 / Cr réserves 3 500`. Sans compte de réserves : 409
`COMPTE_RESERVES_NON_DECLARE` alors qu'il n'y a aucune part antérieure ; avec : 3 500 en réserves alors
que STORY-547 garde la contrepartie en écart de conversion. Un cumul sur plusieurs exercices ne se
convertit pas à un seul cours historique : le résiduel ne retombe plus à zéro, la société reste
`A_ELIMINER` pour toujours.

Sans effet pour XOF/XAF (parité fixe) ; le cas réel concerne les pays SYSCOHADA à devise flottante
(GNF, CDF).

## Critères d'acceptation

- [ ] AC-1 — Cadrer la conversion de l'élimination fiscale (cours de chaque composante, sort de l'écart)
      en cohérence avec STORY-547.
- [ ] AC-2 — Le scénario chiffré ne produit aucune ligne de réserves ; un cumul pluri-annuel converti
      revient à un résiduel nul après élimination.
- [ ] AC-3 — Tests combinant écriture fiscale et conversion (aucun n'existe aujourd'hui) ; mutation rouge.

## Notes

- Voir [[STORY-685]], [[STORY-547]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-685.
