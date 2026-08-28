# STORY-548 : Les états consolidés et leurs notes — et le mot qui figure en tête est « consolidé » ou « agrégé », jamais le plus vendeur

Status: ready-for-dev

**Épic :** EPIC-141 — États consolidés et notes
**Service :** `bilan-service` — module `consolidation`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-541 → 547** (tous les retraitements)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

Les états consolidés ne sont **pas** les états individuels avec d'autres chiffres. Ils portent des
lignes qui n'existent nulle part ailleurs, et des notes qui sont **l'essentiel de leur valeur
probante** :

| Ligne / note | Pourquoi elle n'existe que là |
|---|---|
| **Écart d'acquisition** à l'actif | né de la consolidation ([[STORY-543]]) |
| **Intérêts minoritaires** au passif | la part qui n'appartient pas au groupe ([[STORY-544]]) |
| **Écart de conversion** en capitaux propres | né des filiales étrangères ([[STORY-547]]) |
| **Résultat part du groupe** au CR | le nombre que tout lecteur cherche |
| **Note de périmètre** | qui est consolidé, à quel %, par quelle méthode, depuis quand |
| **Note de variation du périmètre** | entrées et sorties de l'exercice — sans elle, aucune comparaison N/N-1 n'a de sens |
| **Preuve d'impôt** | le rapprochement qui rend les impôts différés vérifiables ([[STORY-545]]) |

⚡ **La note de variation du périmètre est celle qu'on oublie, et elle invalide le comparatif.** Un
groupe qui acquiert une filiale en juin voit son chiffre d'affaires bondir : sans la note, la
croissance est attribuée à l'activité.

## Critères d'acceptation

- [ ] AC-1 — Bilan, compte de résultat et TFT consolidés, avec les lignes propres à la
      consolidation, et un **comparatif N-1** qui porte **son propre périmètre**.
- [ ] AC-2 — ⛔ **L'état porte le mot exact de ce qui a été fait** : « **consolidé** » si les
      retraitements ont tourné, « **agrégé** » si seule l'agrégation a tourné. **Jamais le mot le
      plus vendeur** — c'est la reprise directe de STORY-531 AC-5, au niveau de l'état déposé.
- [ ] AC-3 — Les **notes de périmètre et de variation de périmètre** sont produites depuis
      [[STORY-530]], jamais saisies.
- [ ] AC-4 — Un **contrôle de recomposition** est publié : la somme des contributions par entité
      **égale** chaque total consolidé. ⚡ C'est le seul contrôle qui attrape un retraitement appliqué
      deux fois — et l'équilibre du bilan, lui, ne le verrait pas.
- [ ] AC-5 — ⛔ **Ce qui n'est pas produit est NOMMÉ à l'écran**, avec sa raison. Doctrine FE-073 :
      *dire ce qu'on ne fait pas est une information ; laisser croire qu'on le fait est une
      promesse.*
- [ ] AC-6 — Les états consolidés se **figent** comme une liasse individuelle : version, empreinte,
      piste d'audit. ⚠️ Ils citent **les versions de balance de chaque entité** qui les ont produits —
      un état consolidé dont on ne peut pas retrouver les sources n'est pas auditable.
- [ ] AC-7 — Un contrôle **d'homogénéité** refuse la production si deux entités du périmètre n'ont ni
      le même référentiel ni la même devise sans conversion (STORY-531 AC-2, STORY-547).

## Notes

- Voir [[STORY-531]] et [[STORY-541]] → [[STORY-547]], [[FE-073]].
