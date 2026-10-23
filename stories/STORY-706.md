# STORY-706 : La période de consommation se clôt d'elle-même

Status: done

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

- [x] AC-1 — Une planification BullMQ à clé fixe déclenche, chaque mois, la clôture de la période
      **précédente** pour **toute organisation ayant au moins un compteur** sur cette période.
- [x] AC-2 — ⚡ La clôture automatique appelle **le même `clore`** que la route : même arrêté, même
      idempotence (un rejeu du travail, ou une clôture manuelle déjà faite, rend l'arrêté d'origine).
- [x] AC-3 — ⛔ Une organisation en échec n'arrête pas les autres ; l'échec est compté et nommé dans le
      compte rendu du travail.
- [x] AC-4 — ⚠️ La planification qui échoue (Redis injoignable) **ne fait pas tomber le service**.
- [x] AC-5 — ⛔ Aucune facturation, aucun quota : `aucune-facturation.spec.ts` reste verte.
- [x] AC-6 — Une garde d'inventaire (`setInterval`/minuteries, STORY-578) reste verte : aucune
      minuterie de plus.

---

## Livré le 2026-10-23 — branche `MNV-706` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 388/3 388 (254 suites) · `npm run test:e2e` 246/246 · lint 0 · build vert.

- `CloturePlanifieeService` (patron de `PurgePlanifieeService`) : planification à clé fixe
  `notification:cloture-consommation`, **le 2 de chaque mois à 04 h 00 UTC**.
  ⚡ **Le 2, pas le 1ᵉʳ** : un message remis le 31 à 23 h 50 reçoit son accusé dans les heures qui
  suivent ; clore à minuit aurait rangé ces accusés dans le mois suivant pour quelques minutes
  d'avance. Après la purge de 03 h 00, pour ne pas charger la base à la même minute.
- `ClotureService.cloreToutes(periode)` : les organisations se lisent dans les **compteurs de la
  période** (`distinct`) — une organisation sans consommation n'a pas d'arrêté vide. Le même `clore` que
  la route : un arrêté posé à la main **reste celui d'origine** (`dejaCloses`). Une organisation en
  échec est **nommée par sa cause** (code de refus ou nom d'erreur, jamais le message) et n'arrête pas
  les autres. Auteur nommé : `plateforme:cloture-automatique`.
- ⚡ La période se calcule **à l'exécution** (`periodePrecedente`, dérivée de `periodeMensuelle`, la seule
  définition du mois) ; un mois oublié se rattrape par un travail imposant sa `periode`.
- ⚠️ Le double de `cloture.service.spec.ts` ignore ses filtres : les tests de 706 en ont un qui les
  honore, sans quoi une clôture « de tout le monde sur les compteurs de tout le monde » serait passée.

⛔ **Ouvert** : aucune conformité contre un vrai Redis (le comportement du planificateur est prouvé sur
ses options, comme la purge).
