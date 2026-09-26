# STORY-685 : Les écritures passées pour la seule loi fiscale restent dans les comptes consolidés

Status: ready-for-dev

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation`
**Points :** 8 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-541** (le journal des retraitements, leur report, leur effet d'impôt)
**Origine :** cadrage de STORY-541 (2026-09-26), constat M2 — relecture intégrale de l'art. 86 de l'AUDCIF.

---

## Le fait

*« La consolidation impose : […] 3°) l'élimination de l'incidence sur les comptes des écritures passées
pour la seule application des législations fiscales »* (AUDCIF, art. 86 3°).

Les **amortissements dérogatoires** et les **provisions réglementées** (comptes `15x`, dotations et
reprises HAO en SYSCOHADA) n'existent dans les comptes individuels que parce que la loi fiscale les
autorise ou les impose. Le groupe n'en reprend pas l'incidence : additionnées telles quelles, elles
minorent les capitaux propres et le résultat consolidés d'un montant qui ne décrit aucune dépréciation
économique.

⛔ Ni le découpage du 2026-08-28 (STORY-541 → 548) ni la liste fermée des traitements (D-531-9) ne
fichaient cette opération : l'état aurait pu s'appeler « consolidé » sans elle. STORY-541 l'a nommée
`ECRITURES_FISCALES`, `NON_TRAITE`, requise.

## Critères d'acceptation

- [ ] AC-1 — L'élimination est une écriture du journal de consolidation, identifiée, motivée,
      réversible, rattachée à la société d'origine — le patron des retraitements de STORY-541.
- [ ] AC-2 — ⚠️ **Elle a un effet d'impôt** (art. 92 : impositions différées des retraitements de
      l'art. 86) : déclaré sur l'écriture, comme en STORY-541 AC-4.
- [ ] AC-3 — Son cumul se **reporte** d'un exercice à l'autre (l'amortissement dérogatoire se cumule
      au passif), exactement comme les retraitements d'homogénéisation (D-541-8).
- [ ] AC-4 — Cadrer AVANT de coder ce qui peut être **PROPOSÉ** : les comptes de provisions
      réglementées se reconnaissent par le paquet de référentiel (à vérifier, référentiel par
      référentiel — jamais par le premier chiffre), le montant se lit dans la liasse ; un proposé n'a
      aucun effet tant qu'il n'est pas confirmé.
- [ ] AC-5 — Le traitement `ECRITURES_FISCALES` passe `APPLIQUE` selon une règle écrite et testée ;
      un groupe sans écriture fiscale produit zéro écriture (non-régression, patron STORY-541 AC-6).

## Notes

- Voir [[STORY-541]] (D-541-13), [[STORY-545]] (impôts différés).
- Dernier alinéa de l'art. 86 : l'opération peut être omise si son incidence est **négligeable** —
  une omission motivée, comme en STORY-541 (D-541-6), jamais un silence.

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-26).** Créée par le cadrage de STORY-541 (D-541-13).
