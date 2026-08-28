# STORY-506 : PAR 30/90/180 et taux de recouvrement, par agence et par produit

Status: ready-for-dev

**Épic :** EPIC-125 — Indicateurs de portefeuille
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-503** (le classement dérivé)
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Le **portefeuille à risque** est le chiffre qu'un directeur d'IMF regarde tous les lundis, et celui
qu'un bailleur demande avant tout le reste. Sans lui, le produit est un livre de comptes, pas un
outil de pilotage — et c'est l'écart entre « nous tenons votre comptabilité » et « nous vous aidons
à piloter ».

⚠️ **La définition du PAR n'est pas universelle.** PAR 30 = encours des crédits ayant au moins une
échéance impayée depuis plus de 30 jours, **rapporté à l'encours total** — mais le numérateur
prend-il **tout** l'encours du crédit en retard, ou seulement la part échue ? Les deux conventions
existent, elles donnent des chiffres très différents, et un ratio dont la convention n'est pas
publiée n'est comparable à rien.

## Critères d'acceptation

- [ ] AC-1 — PAR 30, PAR 90, PAR 180 à une date d'arrêté, **avec leur convention publiée** (numérateur
      et dénominateur explicités dans la réponse). ⛔ Pas de ratio sans sa définition.
- [ ] AC-2 — Taux de recouvrement, encours total, encours en souffrance, nombre de crédits actifs et
      encours moyen.
- [ ] AC-3 — Ventilation par **agence** et par **produit de crédit**, et la somme des ventilations
      **égale** le total. Un total qui ne se recompose pas est une erreur qu'aucun contrôle ne voit.
- [ ] AC-4 — Chaque indicateur porte **sa date d'arrêté** et se **rejoue à l'identique** — corollaire
      direct d'AD-2.
- [ ] AC-5 — ⚠️ Les crédits **restructurés** apparaissent séparément dans tous les indicateurs
      (STORY-505 AC-3) : les noyer dans « sain » est précisément ce qui rend un PAR flatteur.

## Notes

- Voir [[STORY-503]], [[STORY-505]], [[STORY-510]] (les ratios prudentiels, qui sont autre chose).
