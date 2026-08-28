# STORY-501 : Un crédit est la somme de ses événements — jamais un encours qu'on corrige

Status: ready-for-dev

**Épic :** EPIC-123 — Portefeuille de crédits
**Service :** `microfinance-service`
**Points :** 13 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-1** de la spine.

---

## Le fait

Un encours restant dû n'est **pas un compteur**. C'est le résultat d'une suite d'événements :
octroi, décaissement (parfois en plusieurs tranches), remboursements, rééchelonnement,
passage en perte. Un module qui stocke l'encours et le met à jour ne sait pas répondre à
*« pourquoi 1 240 000 et pas 1 500 000 ? »* — et c'est la question que pose le premier contrôle.

⚡ **C'est le même invariant que `stock-service`** (AD-1/AD-2 de sa spine) : la propriété n'est pas
comptable, elle est structurelle, et tout le reste — le classement, le provisionnement, l'audit, le
portefeuille à une date passée — en découle.

## Critères d'acceptation

- [ ] AC-1 — Les événements de crédit sont **append-only** : le schéma le refuse, pas seulement la
      convention. Une correction est un **événement de correction**, pas une mise à jour.
- [ ] AC-2 — L'encours restant dû, le capital remboursé et les intérêts perçus sont **dérivés** à
      une date d'arrêté. Points d'arrêt et rejeu, comme la dérivation de `stock-service`.
- [ ] AC-3 — Un crédit porte : montant octroyé, taux, durée, périodicité, différé éventuel,
      garanties, **agence** et **produit de crédit**.
- [ ] AC-4 — Le **décaissement en plusieurs tranches** est supporté : un crédit octroyé et non
      décaissé n'est **pas** un encours — c'est un **engagement hors bilan** (AD-9, STORY-508).
- [ ] AC-5 — ⛔ **Le module ne décide aucun octroi** (AD-12) : ni scoring, ni analyse de risque. Il
      enregistre une décision prise ailleurs, avec son auteur et sa date.
- [ ] AC-6 — Le portefeuille à une date passée se rejoue à l'identique, en désordre et après
      redémarrage. C'est ce test qui fait de la story « terminé », pas la recette fonctionnelle.

## Notes

- Voir [[STORY-502]] (l'échéancier), [[STORY-503]] (le classement dérivé), spine AD-1.
