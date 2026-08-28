# STORY-516 : Les cadences de règlement — la matière première de la PSAP, et rien d'autre ne la produit

Status: ready-for-dev

**Épic :** EPIC-130 — Sinistres et règlements
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-515** (les quatre dates et les évaluations versionnées)
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

Une **cadence de règlement** dit, par exercice de survenance, comment les paiements se répartissent
dans le temps : tant la première année, tant la deuxième, tant la troisième. C'est la matière à
partir de laquelle une provision pour sinistres à payer se calcule — et **aucune autre donnée ne la
remplace**.

⚡ **C'est la raison pour laquelle cette story est au palier 1 alors que la PSAP est au palier 2.**
La cadence se **constitue par accumulation** : elle demande plusieurs exercices d'historique. Si le
module ne la collecte pas dès le premier jour, le palier 2 devra attendre trois ans **après** son
développement pour être utilisable.

⇒ **Collecter maintenant ce dont on aura besoin plus tard est ici une décision d'architecture, pas
une anticipation gratuite.**

## Critères d'acceptation

- [ ] AC-1 — Un triangle de liquidation : par **exercice de survenance** × **exercice de règlement**,
      les montants payés et les évaluations restantes. Dérivé des événements de STORY-515, jamais
      saisi.
- [ ] AC-2 — Le triangle est calculé **par catégorie Vie / Non-Vie** et par branche — agréger toutes
      branches confondues produit une cadence qui ne décrit aucun risque réel.
- [ ] AC-3 — Le triangle porte sa **date d'arrêté** et se **rejoue à l'identique**.
- [ ] AC-4 — ⛔ **Aucune extrapolation, aucune méthode de projection dans cette story** (AD-12) : on
      restitue ce qui s'est passé. Chain-ladder et consorts sont du palier 2, et ils exigent un
      actuaire.
- [ ] AC-5 — Le triangle indique **explicitement sa profondeur d'historique** et son caractère
      incomplet. ⚠️ Une cadence sur un seul exercice n'est pas une cadence, et l'afficher comme telle
      inviterait à s'en servir.

## Notes

- Voir [[STORY-515]], [[STORY-517]], [[STORY-519]], spine AD-12.
