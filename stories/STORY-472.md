# STORY-472 : Aucune charge n'est fixe : le résultat croît exactement au taux de croissance, et le point mort est inexprimable

Status: ready-for-dev

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
