# STORY-706 : La période de consommation se clôt d'elle-même

Status: ready-for-dev

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** rail F, bloc F2
**Prérequis :** **STORY-639** (clôture et arrêté), **STORY-586** (patron de la purge planifiée)
**Origine :** rail F (`RAIL-F-NOTIFICATION-11-STORIES-2026-10-23.md`) · point ouvert du rail D · prérequis de STORY-647.

---

## Le récit

En tant que **plateforme**, je veux que chaque mois terminé soit arrêté sans que personne n'ait à y
penser, afin que le pont vers la facturation (STORY-647) lise un arrêté qui existe.

## Le fait

⛔ **La clôture existe, mais elle est MANUELLE.** `ClotureService.clore` n'a qu'un appelant :
`POST /consommation/periodes/:periode/cloture`, une organisation à la fois, sur geste humain. Une
organisation qui n'y pense pas n'a **jamais** d'arrêté — et un fait tardif continue d'imputer une
période que rien ne fige.

⚡ **Le patron est connu : un travail de FILE, jamais une minuterie** (STORY-586). La planification vit
dans Redis sous une clé fixe — N répliques programment UNE clôture, et un redémarrage à l'heure dite
ne la fait pas sauter.

## Critères d'acceptation

- [ ] AC-1 — Une planification BullMQ à clé fixe déclenche, chaque mois, la clôture de la période
      **précédente** pour **toute organisation ayant au moins un compteur** sur cette période.
- [ ] AC-2 — ⚡ La clôture automatique appelle **le même `clore`** que la route : même arrêté, même
      idempotence (un rejeu du travail, ou une clôture manuelle déjà faite, rend l'arrêté d'origine).
- [ ] AC-3 — ⛔ Une organisation en échec n'arrête pas les autres ; l'échec est compté et nommé dans le
      compte rendu du travail.
- [ ] AC-4 — ⚠️ La planification qui échoue (Redis injoignable) **ne fait pas tomber le service**.
- [ ] AC-5 — ⛔ Aucune facturation, aucun quota : `aucune-facturation.spec.ts` reste verte.
- [ ] AC-6 — Une garde d'inventaire (`setInterval`/minuteries, STORY-578) reste verte : aucune
      minuterie de plus.
