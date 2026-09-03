# STORY-594 : Garde-fous : plafond par période, fenêtre horaire et validation par un rôle habilité

Status: ready-for-dev

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous 🏁
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-593** (préparation) · ⛔ **STORY-582** (registre de consentement, S42)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-13.

---

## Le fait

⚡ **Le plafond et la fenêtre s'évaluent par lot.** Un envoi qui atteint le bord de la fenêtre
**suspend** et reprend à l'ouverture suivante — conséquence directe du curseur, **aucun mécanisme
dédié**.

⛔ **Cette story porte FR-N48, et c'est la raison de l'ordre des sprints.** Le consentement est
vérifié **deux fois** : à la préparation pour le compte rendu, et **à l'instant de la remise** pour
l'opposabilité. C'est la seule façon qu'un désabonnement éteigne un envoi **déjà en cours
d'exécution**. Sans EPIC-059 (S42), la seconde vérification n'a rien à interroger.

## Critères d'acceptation

- [ ] AC-1 — Plafond d'envois par période et **fenêtre horaire autorisée**, par organisation (FR-N33),
      évalués **par lot**.
- [ ] AC-2 — Un envoi qui atteint le bord de la fenêtre **suspend** et **reprend** à l'ouverture
      suivante, sans perdre ni doubler personne.
- [ ] AC-3 — ⛔ **FR-N48 prouvé en conditions réelles** : désabonner une personne **pendant**
      l'exécution d'un envoi de masse qui la contient, et vérifier qu'elle **ne reçoit pas**. La
      vérification a lieu à l'instant de la remise, pas seulement à la préparation.
- [ ] AC-4 — La validation préalable par un rôle habilité (FR-N34), **activable par organisation**,
      bloque le passage de `prepare` à l'exécution — **jamais un lot au milieu**. Erreur nommée
      `VALIDATION_REQUISE`.
- [ ] AC-5 — Un dépassement de plafond rend `PLAFOND_ENVOI_ATTEINT` ; un envoi hors fenêtre rend
      `HORS_FENETRE_AUTORISEE`. Codes nommés et stables.
- [ ] AC-6 — ⚠️ La fenêtre horaire se calcule dans le fuseau **déclaré de l'organisation** —
      *[ASSUMPTION A4 : UTC+0 pour le Togo]*, à revoir au premier client hors fuseau.

## Notes

🏁 Clôt EPIC-061.
