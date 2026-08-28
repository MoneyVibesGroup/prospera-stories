# STORY-498 : Le paquet prudentiel BCEAO devient un artefact packagé, séparé du paquet comptable

Status: ready-for-dev

**Épic :** EPIC-121 — Socle vertical SFD
**Service :** `microfinance-service` + `scripts/referentiels/`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-3** de la spine — Q2 tranchée.

---

## Le fait

Les tranches d'ancienneté de retard, les taux de provision par tranche et les seuils de ratios
prudentiels sont **du droit**, pas du code. Ils viennent des instructions de la BCEAO et de la
Commission Bancaire de l'UMOA.

**Pourquoi un paquet SÉPARÉ du paquet comptable** (AD-3) : le RCSFD et la norme prudentielle évoluent
par des **textes différents**, à des **rythmes différents**. Les fusionner obligerait à republier
`sfd-bceao@2.0` — donc à **recalculer tous les checksums de liasse et invalider les snapshots** — à
chaque instruction prudentielle nouvelle. C'est le coût que STORY-368 a déjà payé une fois.

## Critères d'acceptation

- [ ] AC-1 — Un artefact `prudentiel-sfd-bceao@1.0` : tranches d'ancienneté (bornes en jours), taux
      de provision par tranche, règles de déclassement, seuils des ratios. Versionné, **vérifié par
      checksum**, chargé par le même mécanisme que les référentiels comptables.
- [ ] AC-2 — ⛔ **Chaque valeur porte sa référence** (instruction, article, année). Une valeur sans
      référence **fait échouer le build** — même garde que STORY-493 AC-2 pour le fiscal.
- [ ] AC-3 — `_meta` renseigné comme un référentiel (STORY-491) : zone `BCEAO-SFD`, les 8 pays
      UEMOA, devise, norme source, statut. ⚠️ **Statut `a-valider-par-expert` tant qu'un praticien
      SFD ne l'a pas relu** — les taux de provision sont ce qui décide de la conformité d'une IMF.
- [ ] AC-4 — Le paquet comptable `sfd-bceao@2.0` reste **inchangé, à l'octet**. Non-régression
      prouvée sur ses 372 comptes / 31 postes / 31 mappings.
- [ ] AC-5 — Une route publie le paquet prudentiel actif, avec sa version et son checksum. C'est ce
      que l'écran affichera à côté de chaque montant provisionné.

## Notes

- Voir [[STORY-491]] (le manifeste déclaré), [[STORY-493]] (la même garde côté fiscal), [[STORY-368]]
  (ce que coûte une republication d'artefact).
