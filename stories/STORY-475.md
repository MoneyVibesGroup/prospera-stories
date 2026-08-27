# STORY-475 : La comparaison se limite à deux mesures annuelles — ni produits, ni marge, ni BFR, ni CAF

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en confrontant `ComparaisonAnnuel` à ce qu'un dirigeant lit dans une comparaison de plans d'affaires.

---

## Le fait

`ComparaisonAnnuel` porte `resultatNet` et `tresorerieCloture`. Rien d'autre.

Sur le dossier de démonstration, « Optimiste 2026 » et « Prudent 2026 » diffèrent de **5 948 219 F de
produits en N+3** — près d'un tiers du chiffre — et **la comparaison ne le montre pas**. Comparer deux
plans d'affaires sans comparer l'activité qui les produit n'a pas de sens : c'est la ligne qu'on lit en
premier.

Manquent aussi, et pour la même raison : la **marge brute** (l'écart de structure entre deux
scénarios), le **BFR** (ce que la croissance immobilise) et la **CAF** (ce qui rembourse).

Second manque, plus discret : **aucun cumul**. Un arbitrage entre scénarios se fait sur le résultat
**cumulé** de l'horizon, pas exercice par exercice. Sur ce dossier le classement s'inverse selon la
mesure — « Optimiste » dégage **2 288 704** de résultat cumulé contre **975 659** à « Prudent », et
c'est pourtant « Prudent » qui finit le plus bas en trésorerie. **La rentabilité et la trésorerie ne
classent pas les scénarios dans le même ordre**, et c'est exactement ce qu'une comparaison doit rendre
lisible.

## Critères d'acceptation

- [ ] AC-1 — `ComparaisonAnnuel` porte `produits`, `margeBrute`, `bfr` et `capaciteAutofinancement`
      en plus des deux mesures actuelles.
- [ ] AC-2 — `ComparaisonScenario.cumul` porte `{ resultatNet, produits, investissements }` sur
      l'horizon complet, et les écarts vs référence sont calculés dessus comme sur le reste.
- [ ] AC-3 — Les écarts (`ComparaisonEcartsAnnuel`) couvrent **toutes** les mesures publiées : un
      champ comparé sans son écart oblige le client à refaire la soustraction, et deux soustractions
      divergent tôt ou tard.

## Conséquences ailleurs

- Ces mesures sont **déjà calculées** par `ProjectionAnnuelleService` : la story est une projection de
  champs, pas un calcul neuf.
