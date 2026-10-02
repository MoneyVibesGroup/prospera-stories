# STORY-699 : Les subventions d investissement et les changements de methode passes pour raison fiscale ne sont pas retraites

Status: ready-for-dev

**Épic :** EPIC-137
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-685** (élimination des écritures fiscales)
**Origine :** D-685-13 de STORY-685 (2026-10-02) — nommés dans la `miseEnGarde` de `consolidation-audcif@1.5`, hors périmètre de 685.

---

## Le fait

Le D4C (ch. 3 § 2.2) range sous l'élimination de l'incidence des écritures fiscales, à côté des provisions
réglementées traitées par STORY-685 (§ 2.2.1), deux autres opérations que le produit ne traite pas :

- **§ 2.2.2** — le reclassement des subventions d'investissement ;
- **§ 2.2.3** — les changements de méthode comptable passés au résultat pour une raison fiscale.

Le paquet `consolidation-audcif@1.5` les nomme dans sa mise en garde ; aucune règle ne les porte.

## Critères d'acceptation

- [ ] AC-1 — Relire le D4C § 2.2.2 et § 2.2.3 (source officielle, page citée) et cadrer chacune : ce qui
      se reconnaît par le paquet, ce qui se déclare.
- [ ] AC-2 — Patron STORY-541/685 : écriture identifiée, motivée, réversible, effet d'impôt déclaré,
      report du cumul ; proposé sans effet tant que non confirmé.
- [ ] AC-3 — Un groupe qui n'en a pas ne produit aucune écriture (non-régression).

## Notes

- Voir [[STORY-685]] (D-685-13).

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-685.
