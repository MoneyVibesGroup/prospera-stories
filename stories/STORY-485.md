# STORY-485 : Un seul taux de croissance pour les trois exercices — aucun profil n'est exprimable

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Complexité :** high · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
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

---

## Arbitrages de cadrage (2026-09-09, avant la première ligne)

### D-485-1 — un champ FRÈRE, pas une union de types sur le même champ

AC-1 écrit « `croissanceProduitsPct` accepte **soit** un nombre, **soit** un tableau de trois taux ».
La ventilation retenue est un **champ frère** — `croissanceProduitsPctParExercice` — sur le patron
**mot pour mot** des cinq couples « montant récurrent + échéancier » que ce dépôt porte déjà
(`investissements`, `financement`, `remboursements`, `chargesFixesAnnuelles`, `empruntsNouveaux`).

Motifs, dans l'ordre de poids :

1. **`hypotheses` est un chemin Mongoose `Mixed`.** Une union `number | number[]` s'y relit sans
   erreur sous n'importe quelle forme, et chacun des neuf lecteurs devrait alors la discriminer
   lui-même. Le champ frère laisse le type du champ historique **inchangé**.
2. **`serieExercices` résout déjà exactement ce couple**, et `parametresDivergents` sait déjà
   comparer un montant récurrent à son échéancier — deux mécanismes acquis, zéro invention.
3. **Le contrat publié.** Une union se publie en `oneOf`, que beaucoup de clients générés typent mal.
   Le patron frère publie deux champs, chacun avec son type et ses bornes.

⇒ **AC-1 est tenu au fond** — un nombre reste valide, aucune migration, et un profil à trois taux
devient exprimable — mais **la surface diffère de sa lettre**, et c'est écrit ici plutôt que tu.

### D-485-2 — ⛔⛔ le vrai risque n'est PAS la saisie, ce sont les NEUF LECTEURS

Le taux ne se lit pas au seul endroit qui le fait varier. Il est lu par
`projection-annuelle.service.ts` (4 fois), `bfr.ts` (2 fois), `projection-mensuelle.service.ts` et
`forme-hypotheses.ts`. Chacun reçoit `hypotheses` **entier** et lit `hypotheses.tauxMargePct`.

⛔ **Ajouter un tableau et n'adapter que la boucle annuelle laisserait le BFR normatif calculer avec
le taux de marge de la PREMIÈRE année sur les trois exercices** — silencieusement, sans qu'aucun
contrôle ne s'allume, et le déséquilibre ne se verrait nulle part puisque le BFR n'entre pas dans
l'équilibre du bilan. C'est le défaut « garde posée sur un seul des N chemins » transposé à la
**lecture**, et ce dépôt l'a payé cinq fois.

⇒ **Une seule fonction, `hypothesesDeLExercice(hypotheses, rang)`**, rend une copie où les trois taux
sont **déjà résolus** en scalaires pour ce rang. Les neuf lecteurs continuent de lire
`hypotheses.tauxMargePct` **sans changer d'une ligne**, et deviennent corrects par construction.
Aucun d'eux n'apprend à lire un tableau : c'est précisément ce qui empêche qu'on en oublie un.

### D-485-3 — les TROIS taux appliqués sont publiés, pas seulement la croissance

AC-4 ne nomme que `compteResultat.croissanceAppliquee`. Mais AC-2 rend **trois** taux variables, et
son propre argument — « un plan à taux variables qui ne dit pas lequel a servi n'est pas vérifiable
à la main » — vaut identiquement pour la marge et les charges. N'en publier qu'un sur trois
livrerait un compte de résultat dont **deux tiers** des taux restent indevinables.

⇒ `croissanceAppliquee`, `tauxMargeApplique` et `tauxChargesApplique`, sur chaque exercice projeté.

### D-485-4 — un taux n'est PAS un montant : ni `CHAMPS_ECHEANCIER`, ni `echeancierExploitable`

La tentation est d'ajouter les trois tableaux à `CHAMPS_ECHEANCIER`. ⛔ **`echeancierExploitable`
exige des entiers `≥ 0`** — or un taux est **signé** (une décroissance de −20 % est un plan
légitime, la borne du DTO est `-100`) et **fractionnaire** (7,5 %). Réutiliser cette garde
refuserait des jeux parfaitement valides, et le message parlerait de « montants ».

⇒ une liste et une garde **séparées**, `CHAMPS_TAUX_PAR_EXERCICE` et `tauxExploitables`, avec leur
propre message. La **normalisation d'écriture**, elle, est commune : un tableau non saisi ne doit
pas se persister en `null`, quelle que soit sa nature (défaut mesuré en docker en STORY-460).

### D-485-5 — la SECONDE liste de couples, celle qui vit dans un autre fichier

`COUPLES_ECHEANCIER` de `parametres-divergents.ts` gagne **trois** couples. C'est le point de recopie
que STORY-483 a manqué — il porte un autre nom, dans un autre fichier, et rien ne le relie à
`CHAMPS_ECHEANCIER`. Sans lui, deux scénarios exprimant **le même plan** (un taux récurrent d'un
côté, le même répété trois fois de l'autre) seraient signalés **divergents** sur l'écran dont la
raison d'être est d'expliquer l'écart.

### D-485-6 — AC-5 : le mensuel lit le taux de SON exercice

`projection-mensuelle.service.ts` calcule sa marge brute avec `hypotheses.tauxMargePct`. Il connaît
son rang depuis STORY-481 : il reçoit les hypothèses **de cet exercice**, comme l'annuel.

⚠️ Sans cela, un plan à marge croissante donnerait un mensuel de N+3 calculé à la marge de N+1, et
`ecartArticulation` — l'identité que STORY-460 et STORY-467 ont payée — cesserait d'être nulle.

### Hors périmètre, nommé

- **L'écran de FE-035** : la fiche le dit elle-même, la forme du formulaire change et c'est un
  travail de front.
- **Les autres paramètres** (délais de BFR, taux d'intérêt, taux de TVA) : la story nomme trois taux,
  elle en livre trois. Le patron est posé pour les suivants s'ils sont demandés.
- **`tauxDecouvertPct`** : il se replie sur `tauxInteretPct`, et rendre variable l'un sans l'autre
  ferait diverger le repli. Les deux ensemble, ou aucun.
