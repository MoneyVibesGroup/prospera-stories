# STORY-508 : Les engagements hors bilan sont tenus — et n'entrent jamais au bilan

Status: ready-for-dev

**Épic :** EPIC-126 — Articulation portefeuille → balance
**Service :** `microfinance-service`
**Points :** 5 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-9** de la spine.

---

## Le fait

Un crédit **octroyé et non décaissé** n'est pas un encours : c'est un **engagement**. Une **garantie
reçue** d'un membre n'est pas un actif de l'institution. Les deux vivent en **classe 8** du RCSFD, et
l'analyse du 2026-07-21 l'a explicitement mis **hors amorce** : *« classe 8 (hors-bilan /
engagements) : hors états DIMF 2000/2080 »*.

⇒ **Cette story ne conteste pas cette décision : elle la rend applicable.** Les engagements sont
tenus par le module, ils comptent pour le **prudentiel** (les ratios de limitation des risques les
regardent), et ils **n'entrent pas** dans la balance publiée par STORY-507.

⛔ **Le risque exact à éviter :** faire entrer un crédit octroyé non décaissé dans l'encours
gonflerait l'actif et le produit d'intérêts, sans qu'aucun déséquilibre n'apparaisse.

## Critères d'acceptation

- [ ] AC-1 — Les engagements donnés (crédits accordés non décaissés, cautions) et reçus (garanties,
      nantissements) sont tenus par événements, avec leur montant et leur date d'effet.
- [ ] AC-2 — ⛔ **Test de non-régression : aucun engagement ne figure dans la balance publiée.** Il
      vire au rouge si un engagement y apparaît — c'est le seul contrôle qui attrape l'erreur, parce
      que la balance resterait équilibrée.
- [ ] AC-3 — Un engagement **se dénoue** : le décaissement d'une tranche transforme l'engagement en
      encours, et le module trace la bascule sans la dupliquer.
- [ ] AC-4 — Les engagements sont **restitués séparément**, avec leur total, et **alimentent
      STORY-510** (ratios de limitation des risques).
- [ ] AC-5 — ⚠️ Les **garanties admises en déduction du provisionnement** (STORY-504 AC-5) se lisent
      ici : une garantie n'est déductible que si le paquet prudentiel la déclare admise.

## Notes

- Voir `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §1.2, [[STORY-504]], [[STORY-507]].
