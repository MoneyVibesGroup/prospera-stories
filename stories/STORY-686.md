# STORY-686 : L'impôt sur les distributions prévues entre sociétés du groupe n'est constaté nulle part

Status: ready-for-dev

**Épic :** EPIC-139 — Impôts différés et mise en équivalence
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-541** (le journal), **STORY-545** (les taux d'impôt par entité)
**Origine :** cadrage de STORY-541 (2026-09-26), constat M2 — relecture intégrale de l'art. 86 de l'AUDCIF.

---

## Le fait

*« La consolidation impose : […] 5°) la constatation de charges, lorsque les impositions afférentes à
certaines distributions prévues entre des entités consolidées par intégration ne sont pas récupérables,
ainsi que la prise en compte des réductions d'impôts, lorsque des distributions prévues en font
bénéficier des entités consolidées par intégration »* (AUDCIF, art. 86 5°).

Une filiale qui distribuera ses réserves à la mère subira une retenue à la source (IRVM) que le groupe ne
récupère pas toujours : la charge existe **pour le groupe** dès que la distribution est prévue, et
aucune liasse individuelle ne la porte. À l'inverse, un régime mère-fille peut procurer une réduction.

⛔ Comme le 3°, cette opération n'était fichée nulle part ; STORY-541 l'a nommée
`IMPOSITIONS_SUR_DISTRIBUTIONS`, `NON_TRAITE`, requise.

## Critères d'acceptation

- [ ] AC-1 — Une distribution **prévue** est déclarée (société distributrice, bénéficiaire, montant,
      exercice) — un jugement du cabinet, hébergé, jamais deviné.
- [ ] AC-2 — La charge d'impôt non récupérable (ou la réduction) est une écriture du journal de
      consolidation, au taux de la juridiction **de la distributrice** (lien avec STORY-492/493 et
      STORY-545 AC-2), jamais un taux groupe.
- [ ] AC-3 — Aucune distribution prévue ⇒ aucune écriture ; le traitement passe `APPLIQUE` selon une
      règle écrite et testée.

## Notes

- Voir [[STORY-541]] (D-541-13), [[STORY-545]], [[STORY-492]], [[STORY-493]].
- Cadrer d'abord ce que « prévue » veut dire (décision d'assemblée, politique de distribution) : c'est
  la donnée que le produit ne possède pas.

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-26).** Créée par le cadrage de STORY-541 (D-541-13).
