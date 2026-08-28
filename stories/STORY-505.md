# STORY-505 : Déclassement en cascade et rééchelonnements — les deux façons de sortir d'un retard, et une seule est honnête

Status: ready-for-dev

**Épic :** EPIC-124 — Classement et provisionnement réglementaire
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Deux règles que le classement par échéance seul ne couvre pas, et qui décident du provisionnement :

1. **La contagion par débiteur.** Un membre qui a trois crédits et qui en laisse un en souffrance
   fait basculer les autres — la norme prudentielle regarde le **débiteur**, pas la ligne. Classer
   crédit par crédit, sans cette règle, **sous-provisionne systématiquement** les meilleurs clients
   de l'institution.
2. **Le rééchelonnement remet le compteur à zéro — et c'est là que le chiffre se maquille.** Un
   crédit en retard rééchelonné redevient « sain » du seul fait de son nouvel échéancier. La norme
   traite le crédit restructuré à part, et le produit doit le **montrer**, pas le laisser disparaître
   dans la masse des sains.

⚠️ **C'est le seul endroit de ce module où un chiffre juste peut être trompeur.** Le classement est
correct, la formule est correcte, et le portefeuille paraît meilleur qu'il n'est.

## Critères d'acceptation

- [ ] AC-1 — Le classement s'applique **au débiteur** : la règle de contagion vient du paquet
      prudentiel (activée ou non, avec son seuil), jamais du code.
- [ ] AC-2 — Un crédit **rééchelonné** porte un marqueur permanent, avec la date et le motif du
      rééchelonnement, et le **nombre de rééchelonnements successifs**.
- [ ] AC-3 — Les indicateurs et les états distinguent **sain**, **restructuré** et **en souffrance**.
      ⛔ Un crédit restructuré ne se compte **jamais** dans « sain » sans être nommé.
- [ ] AC-4 — Les **abandons de créance** (passage en perte) sont des événements (AD-1), et le crédit
      abandonné reste lisible : une créance passée en perte peut être recouvrée plus tard.
- [ ] AC-5 — ⚠️ Un rééchelonnement **ne libère pas** la provision automatiquement. Sa reprise est
      une décision, au même titre que sa dotation (STORY-504 AC-4).

## Notes

- Voir [[STORY-503]], [[STORY-504]], [[STORY-506]].
