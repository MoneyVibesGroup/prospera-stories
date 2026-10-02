# STORY-700 : Les ecritures fiscales des associees et des referentiels SFD et SMT ne sont pas eliminees

Status: ready-for-dev

**Épic :** EPIC-137
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-685** (élimination des écritures fiscales)
**Origine :** D-685-13 de STORY-685 (2026-10-02).

---

## Le fait

STORY-685 élimine les écritures fiscales des sociétés **intégrées** sous les trois référentiels
SYSCOHADA. Restent hors périmètre (D-685-13) :

- les **associées** mises en équivalence (STORY-546) : leur quote-part de capitaux propres et de résultat
  inclut l'incidence des provisions réglementées ;
- le **SFD** (provisions réglementées en `52`, dotations `668`, reprises `768` — le `15` y est de la
  trésorerie) et le **SMT** (`15` rattaché à aucun poste), pour lesquels aucun paquet de règles de
  consolidation n'existe : le cabinet ne peut que déclarer son écriture ou motiver son omission.

## Critères d'acceptation

- [ ] AC-1 — Cadrer le traitement des associées (retraitement de la quote-part, cohérent avec STORY-546).
- [ ] AC-2 — Règles du SFD et du SMT, référentiel par référentiel, jamais par le premier chiffre ;
      ponts du registre testés par le vrai chargeur.
- [ ] AC-3 — Non-régression des groupes SYSCOHADA de STORY-685.

## Notes

- Voir [[STORY-685]] (C2, D-685-13), [[STORY-546]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-685.
