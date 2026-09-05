# STORY-485 : Un seul taux de croissance pour les trois exercices — aucun profil n'est exprimable

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en regardant les trois colonnes de la projection annuelle côte à côte : elles croissent toutes exactement au même taux.

---

## Le fait

`ProjectionAnnuelleService.projeter()` applique le **même** `croissanceProduitsPct` à chaque itération :

```ts
produits = arrondir(produits * (1 + hypotheses.croissanceProduitsPct / 100));
```

Sur le scénario prudent, les produits font donc **17 193 750 → 18 053 438 → 18 956 110** — soit
×1,05 exactement, deux fois de suite.

Aucun profil n'est exprimable : ni un lancement qui démarre fort puis se normalise, ni une montée en
charge progressive, ni le rattrapage d'une mauvaise année. Or c'est **la** forme d'un plan à trois
ans : personne ne croît au même rythme trois années de suite, et un plan qui l'affirme n'est pas
crédible devant un financeur.

⚠️ Ce manque est **invisible sur le formulaire de FE-035** — il n'y a qu'un champ, et il a l'air
normal. Il n'apparaît qu'à la restitution, quand les trois exercices sont en ligne.

⚠️ Distinct de **STORY-460** (les montants d'investissement, de financement et de remboursement sont
récurrents sans le dire) : là il s'agit de **montants**, ici d'un **taux**.

> ⚠️ **Renommage du 2026-09-05 (STORY-457)** : le champ s'appelait `croissanceCaPct` quand cette
> fiche a été écrite. Il s'applique au **total des produits** et porte désormais ce nom-là —
> rupture de contrat assumée et arbitrée par le PO. Les extraits ci-dessus ont été réalignés :
> la fiche décrit le code tel qu'il est, pas tel qu'il était.

## Critères d'acceptation

- [ ] AC-1 — `croissanceProduitsPct` accepte soit un nombre (comportement actuel, appliqué aux trois
      exercices), soit un **tableau de trois taux**. Un nombre reste valide : aucune migration.
- [ ] AC-2 — Même traitement pour `tauxMargePct` et `tauxChargesPct` — une entreprise qui monte en
      charge voit sa structure de coûts bouger, et laisser le seul taux de croissance variable
      décrirait une entreprise qui n'existe pas.
- [ ] AC-3 — Les bornes du DTO s'appliquent **par élément** (`[-100, 10 000]`), et la longueur du
      tableau est exactement `HORIZON_EXERCICES`.
- [ ] AC-4 — La réponse échoue le taux **retenu par exercice** (`compteResultat.croissanceAppliquee`) :
      un plan à taux variables qui ne dit pas lequel a servi n'est pas vérifiable à la main.
- [ ] AC-5 — Le mensuel consomme le taux de **son** exercice — cohérent avec **STORY-481**.

## Conséquences ailleurs

- L'écran de FE-035 change de forme : trois champs (ou un champ dépliable) au lieu d'un. C'est un
  arbitrage d'ergonomie à rendre avec le PO, pas une conséquence mécanique.
