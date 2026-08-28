# STORY-527 : Plan d'amortissement — les dotations se calculent, avec leur formule, et le prorata temporis n'est pas optionnel

Status: ready-for-dev

**Épic :** EPIC-135 — Immobilisations et amortissements
**Service :** module `immobilisations`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-526** (le registre)
**Origine :** §6.2 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

Un plan d'amortissement se calcule à partir de six données — valeur d'origine, valeur résiduelle,
date de mise en service, durée d'utilité, mode, et **durée de l'exercice**. La sixième est celle
qu'on oublie, et elle vient d'être trouvée manquante ailleurs (STORY-532) : **un exercice de 18 ou
de 6 mois ne porte pas une dotation de 12 mois**.

Deux règles que le SYSCOHADA impose et qu'un moteur naïf rate :

1. **Le prorata temporis la première année**, calculé depuis la **mise en service** — pas une année
   pleine, pas une demi-année forfaitaire.
2. **La dotation est plafonnée par la valeur nette restante** : le cumul des amortissements ne
   dépasse jamais la valeur amortissable. ⚡ C'est exactement la garde métier « amort ≤ brut » déjà
   appliquée aux maquettes — ici elle devient un invariant de calcul.

## Critères d'acceptation

- [ ] AC-1 — Modes **linéaire** et **dégressif** (avec son coefficient, publié par le référentiel ou
      le paquet fiscal, jamais codé). Un mode non supporté est **refusé**, pas approximé.
- [ ] AC-2 — **Prorata temporis** depuis la date de mise en service, sur la **durée réelle de
      l'exercice** (STORY-532). ⛔ Test : un exercice de 6 mois produit la moitié d'une dotation
      annuelle. S'il produit une dotation pleine, tout le plan est faux.
- [ ] AC-3 — ⛔ **Chaque dotation porte sa formule** — base × taux × prorata — comme chaque écriture
      d'impôt du moteur fiscal. Un montant sans sa formule est un chiffre qu'il faut croire.
- [ ] AC-4 — **Invariant : cumul des amortissements ≤ valeur amortissable**, vérifié à chaque
      dotation, jamais seulement à l'affichage.
- [ ] AC-5 — Une **cession** ou une **mise au rebut** en cours d'exercice produit une dotation
      **jusqu'à la date de sortie**, puis la sortie du bien : valeur nette comptable, prix de
      cession, plus ou moins-value. ⚠️ La plus-value est un **produit de cession**, pas une reprise
      d'amortissement.
- [ ] AC-6 — Le plan se **rejoue à l'identique** : recalculer l'exercice 2024 en 2026 rend les mêmes
      dotations.

## Notes

- Voir [[STORY-526]], [[STORY-528]], [[STORY-532]] (la durée de l'exercice — prérequis réel).
