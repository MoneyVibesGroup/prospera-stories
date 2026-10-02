# STORY-697 : L elimination fiscale ignore la part du 151 deja eliminee par l ecart de premiere consolidation

Status: ready-for-dev

**Épic :** EPIC-137
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-685** (élimination des écritures fiscales)
**Origine :** revue de code de STORY-685 (2026-10-02), constat n°1 — non bloquant pour le périmètre écrit, non vu par le cadrage (C7).

---

## Le fait

STORY-543 élimine les capitaux propres acquis **compte par compte**, au pourcentage d'intérêt, sur les
comptes de la fille (`ecarts-premiere-consolidation.regles.ts`, `pousser('DETENTEUR', s, cp.compte, …)`).
Le `151` étant un capital propre, il peut figurer dans ces lignes. Le résiduel fiscal de STORY-685
(`ecritures-fiscales.regles.ts`, `residuels`) ne lit que la liasse, l'écriture fiscale de l'exercice et
les reports : il **ignore** la colonne `ecartsPremiereConsolidation`.

**Scénario chiffré** — fille acquise à 80 %, capitaux propres d'entrée déclarés avec `151000 : 500` ;
STORY-543 passe `Dr 151 400`. En 2024, la liasse porte `151 C 500` sans mouvement : résiduel −500,
proposition `Dr 151 500 / Cr réserves 500`. Confirmée, le `151` consolidé vaut 500 − 400 − 500 =
**−400, à l'actif** ; le poste CM sort négatif, les réserves de la fille gagnent 400 de réserves
**antérieures à l'acquisition** — et `ECRITURES_FISCALES` passe pourtant `APPLIQUE`.

## Critères d'acceptation

- [ ] AC-1 — Cadrer AVANT de coder l'articulation 541/543/685 : l'élimination fiscale doit-elle
      précéder (homogénéisation des capitaux propres d'entrée) ou tenir compte des lignes d'écart de
      première consolidation ? Décision écrite, appuyée sur le D4C.
- [ ] AC-2 — Le scénario chiffré ci-dessus ne produit ni `151` négatif ni réserves d'avant
      l'acquisition ; test unitaire tiré de la décision, mutation rouge.
- [ ] AC-3 — Non-régression : un groupe sans capitaux propres d'entrée sur `15` ne change pas.

## Notes

- Voir [[STORY-685]] (C7, D-685-3), [[STORY-543]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-685.
