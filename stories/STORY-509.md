# STORY-509 : États DIMF 2000 et 2080 — et le jalon `format confirmé` avant d'écrire une ligne

Status: ready-for-dev

**Épic :** EPIC-127 — États périodiques et ratios prudentiels BCEAO
**Service :** `microfinance-service` + `bilan-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-10** de la spine.

---

## Le fait

`sfd-bceao@2.0` produit **déjà** la matière : ses postes de bilan (`BA1..BA4` / `BP1..BP4`, totaux
`BAT`/`BPT`) et son compte de résultat (`RC1..RC8` / `RP1..RP6`, cascade `RSA → RSG`) sont
**dérivés des états DIMF 2000 et 2080**. *(Vérifié dans l'artefact le 2026-08-27.)*

Ce qui manque n'est pas le calcul : c'est **le format de dépôt**. Un état réglementaire n'est pas un
tableau à l'écran — c'est un gabarit attendu par la Commission Bancaire, avec ses codes de ligne,
son ordre, son support et son canal.

## ⛔ Jalon `format confirmé` — même garde qu'EPIC-032 pour le dépôt fiscal

**Aucune ligne de code avant d'avoir en main le gabarit officiel.** Le programme a déjà payé cette
leçon deux fois : les échéances d'acomptes posées en trimestriel au lieu des dates réelles, et le
RSL à 10 % au lieu de 8,75 % — deux erreurs **plausibles**, donc invisibles à la relecture.
⇒ *Les chiffres et les formats d'un état réglementaire se prennent dans la source officielle, jamais
dans le vraisemblable.*

## ✅ TRANCHÉ PAR LE PO — 2026-08-28 : **VOIE A**, le produit dépose

La doctrine est posée par [[STORY-525]] et vaut pour les trois verticaux. Cette story produit donc
**le fichier déposable**, pas seulement l'état imprimable — et elle hérite du contrat commun de
[[STORY-536]] (paquet de dépôt) et de [[STORY-538]] (transmission, accusé, rejet).

⛔ **Le jalon `format confirmé` reste entier** : aucun développement avant que le gabarit officiel
de la Commission Bancaire ne soit au dépôt, sourcé et daté.

---

## Ce qui devait être tranché — conservé pour la traçabilité

**Q1 — Prospera produit-il le fichier déposable, ou l'état imprimable que l'IMF dépose elle-même ?**
La seconde réponse est parfaitement défendable et divise le coût. ⚠️ **C'est la même question que
STORY-525 pose pour le dépôt fiscal, et elle mérite la même réponse** — deux doctrines de dépôt
dans un même produit seraient incompréhensibles pour le cabinet.

## Critères d'acceptation *(applicables une fois Q1 tranchée)*

- [ ] AC-1 — Le gabarit officiel est **sourcé et référencé** (instruction, année, version) avant tout
      développement, et versé au dépôt.
- [ ] AC-2 — L'état est produit **depuis la liasse SFD déjà calculée**, jamais recalculé en parallèle.
      Deux moteurs sur le même nombre divergeraient en silence.
- [ ] AC-3 — L'état porte **sa période, sa date d'arrêté et la version du gabarit**.
- [ ] AC-4 — ⚠️ Une périodicité **infra-annuelle** (les états DIMF sont périodiques, pas seulement
      annuels) suppose des arrêtés intermédiaires : vérifier que l'exercice du dossier le permet
      **avant** de promettre le mensuel ou le trimestriel.

## Notes

- Voir [[STORY-525]] (la même question, côté fiscal), [[STORY-510]], spine AD-10.
