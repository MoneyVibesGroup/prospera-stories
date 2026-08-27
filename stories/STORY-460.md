# STORY-460 : Investissement, financement et remboursement sont des montants RÉCURRENTS — et rien dans le contrat ne le dit

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant la docstring de `ProjectionAnnuelleService.projeter`, qui l'énonce — et le DTO, qui ne l'énonce pas.

---

## Le fait

La docstring du moteur est explicite : *« Les montants d'investissement/financement/remboursement sont
des montants **annuels récurrents** (appliqués à chaque exercice projeté) »*. Le code fait exactement
cela : `fluxInvestissement = -hypotheses.investissements` **à chaque tour de boucle**.

Cette information n'existe **nulle part ailleurs** :

- `HypothesesDto.investissements` dit *« Investissements (unités mineures XOF) »* — rien sur la
  récurrence ;
- `Hypotheses` (schéma) dit *« investissements »* ;
- aucune réponse d'API ne l'échoue.

Un comptable qui saisit le prix d'**un** camion obtient le prix de **trois**. Sur la maquette FE-035,
le scénario « Optimiste » — meilleure croissance, meilleure marge — finit à **−2 087 764** de
trésorerie en N+3 pour cette **seule** raison : 3 000 000 saisis, **9 000 000** décaissés.

Le hook est annoncé dans `projection.types.ts` (« échéancier non uniforme »), il n'est pas livré.

## Critères d'acceptation

- [ ] AC-1 — Les trois montants deviennent un **échéancier par exercice** :
      `investissements: [n1, n2, n3]` (ou `{ rang, montant }[]`), avec repli sur la valeur scalaire
      actuelle pour ne pas casser les jeux existants.
- [ ] AC-2 — La **migration** est explicite : un jeu existant portant `investissements: 1 200 000`
      continue de produire exactement les mêmes chiffres qu'aujourd'hui (test de non-régression sur un
      jeu réel).
- [ ] AC-3 — À défaut d'échéancier (arbitrage PO de report), **AC-1 est remplacée par** : le DTO, le
      schéma et la réponse portent le mot « annuel récurrent » — le contrat doit dire ce que le code
      fait, et c'est le minimum non négociable de cette story.
- [ ] AC-4 — `MODELE_PROJECTION_VERSION` incrémentée si l'échéancier est livré.

## Conséquences ailleurs

- FR-020 (trésorerie mensuelle) a le même besoin, en plus fin : un investissement a un **mois**.
- La maquette FE-035 porte l'avertissement sur les trois champs et sur le verdict du scénario
  « Optimiste » — c'est aujourd'hui la seule protection de l'utilisateur.
