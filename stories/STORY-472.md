# STORY-472 : Aucune charge n'est fixe : le résultat croît exactement au taux de croissance, et le point mort est inexprimable

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé par la passe expert-comptable sur l'écran FE-035 fini, en lisant le tableau d'aperçu ligne à ligne.

---

## Le fait

Le modèle n'a que des charges **proportionnelles** :

```
margeBrute          = produits × tauxMargePct
chargesExploitation = produits × tauxChargesPct
resultatNet         = margeBrute − chargesExploitation
```

Il n'existe **aucune charge de structure** — ni loyer, ni masse salariale, ni assurance, ni honoraires.
Conséquence mécanique, lisible dans le tableau d'aperçu de la maquette FE-035 : quand les produits
croissent de **8 %**, le résultat croît de **8 %**. Exactement. Toujours. Quel que soit le scénario.

Or c'est **l'inverse** de ce qu'un prévisionnel sert à démontrer. L'intérêt d'un plan à trois ans est
de montrer qu'au-delà d'un **point mort**, la croissance profite **plus que proportionnellement**,
parce que les charges fixes sont absorbées. Un modèle sans charges fixes :

- n'a **pas de point mort** ;
- n'a **pas de seuil de rentabilité** ;
- ne peut pas répondre à « à partir de quel chiffre d'affaires je gagne de l'argent ? ».

Ce sont les deux ou trois nombres qu'un analyste crédit cherche en premier, et le module n'en publie
aucun.

⚠️ Au Togo, la charge la plus rigide est la **masse salariale** : cotisations CNSS **17,5 %**
employeur, un effectif qui ne s'ajuste pas au mois. La modéliser comme un pourcentage du chiffre
d'affaires est doublement faux.

## Critères d'acceptation

- [ ] AC-1 — Les charges d'exploitation se scindent en **variables** (% des produits) et **fixes**
      (montant annuel, échéancier si **STORY-460** est livrée). Le repli sur `tauxChargesPct` seul doit
      reproduire les chiffres actuels — test de non-régression.
- [ ] AC-2 — La réponse publie le **point mort** : `seuilRentabilite = chargesFixes / tauxMargeSurCoutVariable`,
      par exercice projeté, et le **nombre de jours** de CA correspondant.
- [ ] AC-3 — La masse salariale est exprimable comme une charge fixe **distincte** (elle a un régime
      social et fiscal propre : CNSS, IRPP retenu à la source), même si aucun calcul social n'est fait
      ici.
- [ ] AC-4 — Un test exerce le **levier** : à charges fixes non nulles, une croissance de 8 % des
      produits doit produire une croissance du résultat **strictement supérieure** à 8 %. C'est
      l'invariant que le modèle actuel ne peut pas satisfaire.
- [ ] AC-5 — `MODELE_PROJECTION_VERSION` incrémentée.

## Conséquences ailleurs

- C'est la story la plus structurante du lot : elle change la **forme** du compte de résultat
  prévisionnel, donc l'écran FE-036 (projection) autant que FE-035 (hypothèses).
- Elle rend **STORY-459** (dotations) plus naturelle : une dotation est une charge fixe par excellence.


---

## Progress Tracking

**Statut : in_progress** — ouvert le 2026-09-08, branche `MNV-472`.

### Prémisses vérifiées dans le code AVANT d'écrire

Contrairement aux deux stories précédentes du lot, **la fiche est exacte** :

| Affirmation de la fiche | Vérifié |
|---|---|
| `chargesExploitation = produits × tauxChargesPct` | ✅ `projection-annuelle.service.ts:216` |
| Aucune charge de structure | ✅ aucun champ de `Hypotheses` n'en porte |
| STORY-460 (échéanciers) livrée | ✅ `investissementsParExercice` & co. existent, le patron est réutilisable |
| `MODELE_PROJECTION_VERSION` à incrémenter | ✅ vaut `1.6.0`, passera à **`1.7.0`** |

### Décisions de conception

- **D-472-1 — Trois champs, pas un.** `chargesFixesAnnuelles` (montant récurrent),
  `chargesFixesParExercice` (échéancier `[N+1, N+2, N+3]`, même patron que STORY-460) et
  `masseSalarialeAnnuelle` **distincte** (AC-3). La masse salariale n'est pas un sous-cas
  décoratif : elle a un régime propre (CNSS 17,5 % employeur, IRPP retenu à la source) que
  des stories fiscales ultérieures liront, et la noyer dans un total la rendrait
  irrécupérable. **Aucun calcul social n'est fait ici** — l'AC-3 demande qu'elle soit
  *exprimable*, pas *cotisée*.
- **D-472-2 — Tous FACULTATIFS, et le repli reproduit les chiffres actuels** (AC-1). Absent
  vaut **0**, jamais `NaN` : contrairement à `tauxInteretPct` (STORY-467), un défaut à zéro
  n'affirme rien de faux ici — il dit « ce plan n'a pas de charges de structure saisies »,
  ce qui est exactement l'état de tous les jeux existants. Aucune garde de forme bloquante
  n'est donc ajoutée, et aucun jeu déjà en base n'est refusé de plus.
- **D-472-3 — Le point mort retient TOUTES les charges fixes, pas seulement celles saisies.**
  Une dotation aux amortissements et une charge d'intérêts **sont** des charges fixes : les
  omettre publierait un seuil de rentabilité **trop bas**, c'est-à-dire le mensonge le plus
  dangereux qu'un document remis à un banquier puisse porter. Le dénominateur est donc
  `chargesFixesExploitation + masseSalariale + dotations + chargesFinancières`, et la
  réponse **publie sa décomposition** — sans elle, l'analyste ne peut pas vérifier le
  chiffre, ce que la fiche reproche précisément au module.
- **D-472-4 — `seuilRentabilite` vaut `null` quand il n'a pas de sens**, jamais un nombre
  inventé : taux de marge sur coût variable **négatif ou nul** (le modèle perd de l'argent
  sur chaque unité vendue, donc aucun volume ne rend rentable) ou produits nuls. Le motif
  est publié à côté, comme les refus d'impôt de STORY-458.
- **D-472-5 — Le point mort en JOURS se calcule sur le CHIFFRE D'AFFAIRES, et vaut `null`
  quand il est inconnu.** ⚡⚡ STORY-457 a établi que le CA n'est **pas** le total des
  produits, et que `chiffreAffaires` est `null` sur un jeu dont la base ne le distingue pas.
  Diviser par `produits` en appelant le résultat « jours de CA » rejouerait exactement la
  confusion que cette story-là a corrigée. Sur 360 jours (`JOURS_ANNEE_COMMERCIALE`, déjà
  partagé avec le BFR), jamais 365.
- **D-472-6 — `MODELE_PROJECTION_VERSION` passe à `1.7.0`, et cette version DÉPLACE des
  montants** — mais seulement pour un jeu qui saisit des charges fixes. Un jeu existant rend
  les mêmes chiffres au centime : c'est l'objet du test de non-régression de l'AC-1.
