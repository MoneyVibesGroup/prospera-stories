# TICKET backend : la projection laisse rembourser plus que la dette due — dettes financières négatives

**Type :** résultat faux, plausible. **Dépôt :** `bilan-service` (module prévisionnel / projection), tenu par B au lot 4.
**Découvert par :** le rejeu du moteur pour le prototype cabinet (groupe A, 2026-11-18, passe 5, moteur 1.13.0).
**Statut :** ouvert, accepté par l'utilisateur le 2026-11-19.

> **✅ FERMÉ le 2026-11-24 par le groupe B** : correctif de STORY-483, **bilan #184** (`d98b7c4` sur `dev`, branche
> `MNV-483-remboursements`) ; annonce « ⚠ Contrats » avant la fusion : stories #802. Voir « Résolution » en bas.

## Le constat

Dans le jeu de démo d'Ets Kossi Distribution, la dette financière de la base vaut 700 000 (DA + DB). Les hypothèses
déclarent des remboursements de 600 000 par an. Le moteur les applique sans les **plafonner à l'encours restant** :
dès N+2, les dettes financières deviennent **négatives**. Le ratio d'endettement est alors indisponible
(`DETTES_FINANCIERES_NEGATIVES`), et l'autonomie financière dépasse 1.

## Ce qui est attendu (à trancher par le groupe qui tient le service)

- Soit refuser l'hypothèse : un remboursement cumulé supérieur à l'encours (base + emprunts nouveaux) rend un refus
  nommé, qui cite l'encours et l'exercice.
- Soit plafonner, et le dire dans la réponse : l'avertissement porte l'excédent non remboursé.
- Dans les deux cas, un test reprend le jeu ci-dessus : base 700 000, 600 000 par an sur trois exercices.

## Résolution (2026-11-24, groupe B)

- **Plafonner, et le dire** (D-483-8) : le remboursement retenu de chaque exercice vaut `min(saisi, encours restant)`,
  l'encours étant la dette de la base + les emprunts nouveaux jusqu'à cet exercice − le déjà remboursé. La réponse
  porte `avertissements` : un `REMBOURSEMENT_PLAFONNE` par exercice écrêté, avec `exercice`, `remboursementSaisi`,
  `encoursAvantRemboursement`, `remboursementRetenu` et **`excedentNonRembourse`**. Le refus n'a pas été retenu : il
  bloquait une saisie courante sans rien apprendre de plus que l'avertissement.
- **Le jeu du ticket**, en test (`remboursements-plafonnes.spec.ts`, et en HTTP dans `bilan-projection.e2e-spec.ts`) :
  base 700 000, 600 000 par an → remboursés 600 000, 100 000, 0 ; dette 100 000, 0, 0 ; avertissements en N+2
  (excédent 500 000) et N+3 (excédent 600 000) ; `DETTES_FINANCIERES_NEGATIVES` ne sort plus ; autonomie ≤ 1 ;
  équilibre et articulation mensuelle nuls.
- Aucun plafond quand l'encours n'est pas connu (dette de la base non ancrée, ventilation indéterminée, D-483-9) ni sur
  le chemin du dossier de financement (échéanciers de STORY-1084, D-483-10 ; l'échéancier des emprunts ne change pas).
- Modèle **1.14.0** ; comparaison : `REMBOURSEMENTS_PLAFONNES` ; export : métadonnée « Remboursements ».
- **Pour A** : `npm run gen:api -- bilan` (champ facultatif `avertissements`, schéma `AvertissementProjectionDto`) ;
  l'écran du prévisionnel peut afficher `avertissements[].message` tel quel.
