# STORY-472 : Aucune charge n'est fixe : le résultat croît exactement au taux de croissance, et le point mort est inexprimable

Status: done

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

**Statut : done** — clôturée le 2026-09-08. PR `bilan-service` #104 rebase-mergée sur `dev`.

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

### Livré

| Fichier | Ce qui change |
|---|---|
| `hypotheses.schema.ts` + son DTO | `chargesFixesAnnuelles?`, `chargesFixesParExercice?`, `masseSalarialeAnnuelle?` — tous facultatifs |
| `projection/point-mort.ts` (neuf) | unité **pure** : seuil, motif, base, jours, taux de MCV, décomposition |
| `projection-annuelle.service.ts` | scission variables/fixes, point mort par exercice |
| `projection-mensuelle.service.ts` | **la même scission** — sans elle l'articulation était rompue |
| `echeancier.ts` | `chargesFixesParExercice` entre dans `CHAMPS_ECHEANCIER` |
| `projection.types.ts` + 3 DTO | `MODELE_PROJECTION_VERSION` **1.7.0**, publié partout où l'historique l'est |

### Portes

Lint 0 · build OK · **154** suites unitaires / **2 265** essais · **23** suites e2e / **689** essais ·
**9 mutations volontaires, 9 rouges**.

### ⚡⚡ Revue de code — 3 constats, dont 2 bloquants

**Le moteur MENSUEL avait été oublié.** Il re-dérive ses agrégats sous un commentaire disant
« mêmes formules que le moteur annuel », ce qui n'était **plus vrai** : il ne retranchait que les
charges variables alors que le flux annuel auquel il s'articule retranche le total. L'écart valait
**exactement** les charges fixes, sur un invariant que le service documente comme une **identité
pour tout jeu**. Trois surfaces en dépendaient, dont la **comparaison de scénarios**, qui en tire
son compteur de mois négatifs — donc **faussement rassurant**.

> **Et la garde de cohérence était VACANTE.** Son balayage fait varier produits, délais et
> croissance sur **plus de mille** combinaisons — **jamais les charges fixes**. Les mille
> combinaisons restaient vertes pendant que l'articulation était rompue. *Un balayage ne couvre
> que les axes qu'il énumère : ajouter une dimension au modèle oblige à l'ajouter là.*

**Le point mort était un seuil de PRODUITS publié comme un CHIFFRE D'AFFAIRES.** Le taux de marge
sur coût variable était rapporté aux produits, le seuil obtenu divisé par le CA pour donner des
jours : deux bases mélangées. Sur un jeu dont le CA vaut 60 % des produits, **trois exercices
bénéficiaires** recevaient un point mort **supérieur à leur chiffre d'affaires** et **plus de 360
jours** — « ce plan n'atteint pas son point mort dans l'année », juste à côté d'un résultat net
positif. C'est la confusion produits ≠ CA de STORY-457, que D-472-5 ne refermait qu'au
dénominateur. Le taux se rapporte désormais à la base sur laquelle le seuil est **exprimé**, et la
réponse **publie cette base**.

> **Et le test qui aurait dû le voir CONFIRMAIT le défaut** : son attendu était tiré du même modèle
> mental que le code. Dé-tautologisé, plus un invariant neuf — *un exercice bénéficiaire ne peut
> pas avoir un point mort au-dessus de son CA* — avec une fixture choisie pour **discriminer** (une
> première version passait les deux calculs et ne mesurait rien).

### Revue de sécurité — 0 vulnérabilité, et un écart contrat/code

Les cinq axes sont instruits et écartés avec mesure : aucune entrée admissible ne produit `Infinity`
ni `NaN`, le mode de panne « plan plausible et faux » est fermé (absent vaut 0, et l'ajout à
`CHAMPS_ECHEANCIER` met le tableau sous la garde de forme), aucun champ n'entre dans un filtre, la
masse salariale republiée l'était déjà par la même route, aucune route ni garde n'est modifiée.

⚡ Elle relève en revanche un écart contrat/code **créé par mon propre correctif** de revue de code.
Corrigé **plus loin que le constat** : le champ s'appelait `joursChiffreAffaires`, et ce **nom**
mentait dès que la base vaut les produits. *Un nom de champ se lit comme une affirmation* — le
défaut que STORY-440 a payé. Renommé `jours`, l'unité étant déclarée par `base`.

### Vérification docker — rejouée sur l'état final

| Fait mesuré | Résultat |
|---|---|
| **AC-4, le levier** | produits +8 % → résultat **+14,61 %** avec structure, **+8,00 %** sans |
| **AC-1, non-régression** sur un jeu antérieur | total **inchangé**, part fixe nulle |
| **Bloquant 1 fermé** | articulation **écart 0** avec structure, clôtures identiques ; l'écart de trésorerie vaut exactement les charges fixes |
| **Bloquant 2 fermé** | sur 3 exercices bénéficiaires, seuil **sous le CA** et **sous 360 jours** (163, 151, 140) |
| **D-472-3** vérifié en réel | un jeu sans charge saisie a un point mort dû à ses **dotations** |
| Champ non saisi persisté à la valeur nulle | **0** |

### Non livré, à dessein

- **L'export PDF ne publie ni la scission ni le point mort** : l'AC-2 porte sur « la réponse », et
  l'export reste **arithmétiquement juste** puisqu'il sert le total. L'étendre aurait débordé.
- **Aucun calcul social sur la masse salariale** (AC-3 demande qu'elle soit *exprimable*, pas
  *cotisée*) : publier des cotisations sans les calculer serait pire que de ne rien dire.
