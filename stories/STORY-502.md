# STORY-502 : L'échéancier — la pièce contre laquelle le retard se calcule

Status: ready-for-dev

**Épic :** EPIC-123 — Portefeuille de crédits
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

**Le retard ne se calcule pas contre une date de fin, il se calcule contre un échéancier.** Un
crédit à 12 échéances mensuelles dont la 3ᵉ n'est pas payée est en retard **dès le 4ᵉ mois**, même
si sa date de fin est dans neuf mois. Sans échéancier, le classement (STORY-503) n'a rien à
interroger, et le provisionnement (STORY-504) n'a pas d'assiette.

C'est pour cela que l'échéancier est une story à part, avant le classement : **c'est la pièce
maîtresse du portefeuille**, pas un détail de présentation.

## Critères d'acceptation

- [ ] AC-1 — L'échéancier est **généré à l'octroi** depuis (montant, taux, durée, périodicité,
      différé), et **figé** : c'est le contrat. Il porte, par échéance, le capital, l'intérêt et le
      total dus, et leur date.
- [ ] AC-2 — Un remboursement s'**impute** sur les échéances selon un ordre **déclaré et non
      supposé** (intérêts, puis capital, puis pénalités — ou l'ordre que le produit de crédit
      déclare). ⚠️ L'ordre change le capital restant dû, donc le provisionnement : le laisser
      implicite rend deux IMF incomparables.
- [ ] AC-3 — Un **rééchelonnement** produit un **nouvel échéancier** et conserve l'ancien. Écraser
      l'échéancier d'origine effacerait la preuve du retard qui l'a motivé.
- [ ] AC-4 — L'**échéance la plus ancienne impayée** et le **nombre de jours de retard** sont
      dérivés à une date d'arrêté, et publiés. C'est l'unique entrée de STORY-503.
- [ ] AC-5 — Un remboursement **anticipé** et un remboursement **partiel** sont tous deux
      exprimables, et se distinguent dans la dérivation.

## Notes

- Voir [[STORY-501]], [[STORY-503]], [[STORY-505]] (rééchelonnements et contagion).
