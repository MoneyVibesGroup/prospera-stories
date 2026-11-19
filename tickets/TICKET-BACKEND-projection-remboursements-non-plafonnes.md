# TICKET backend : la projection laisse rembourser plus que la dette due — dettes financières négatives

**Type :** résultat faux, plausible. **Dépôt :** `bilan-service` (module prévisionnel / projection), tenu par B au lot 4.
**Découvert par :** le rejeu du moteur pour le prototype cabinet (groupe A, 2026-11-18, passe 5, moteur 1.13.0).
**Statut :** ouvert, accepté par l'utilisateur le 2026-11-19.

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
