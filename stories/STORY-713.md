# STORY-713 : Retirer un contact d'une liste

Status: done

**Épic :** EPIC-061 — Envoi de masse : listes, lots avec reprise et garde-fous
**Service :** `notification-service`
**Points :** 2 · **Sprint :** rail F, bloc F4
**Prérequis :** **STORY-591** (la liste), **STORY-592** (instantané à la préparation)
**Origine :** rail F · point ouvert de STORY-591.

---

## Le récit

En tant que **gestionnaire de campagne**, je veux retirer d'une liste un contact ajouté par erreur,
sans défaire la campagne déjà préparée sur cette liste.

## Le fait

⛔ **Une liste s'alimente et ne se vide jamais.** `POST /listes/:id/contacts` ajoute ; aucune route ne
retire. La seule façon de sortir un contact d'une liste est de recréer la liste entière.

⚡ **L'instantané de STORY-592 est ce qui rend le retrait sans danger** : une campagne préparée a figé
ses destinataires. Retirer un membre de la liste ne doit **pas** le retirer de l'envoi en cours —
sinon la préparation cesserait de vouloir dire quelque chose.

## Critères d'acceptation

- [x] AC-1 — `DELETE /listes/:id/contacts` retire un lot d'identifiants ; idempotent (retirer un
      absent n'est pas une erreur, le compte rendu le dit).
- [x] AC-2 — ⛔ Un envoi de masse **déjà préparé** sur la liste garde ses destinataires.
- [x] AC-3 — `nombreDeMembres` est recalculé par comptage, jamais décrémenté à l'aveugle.
- [x] AC-4 — ⛔ Un contact ou une liste d'une autre organisation est **introuvable**, pas interdit.
- [x] AC-5 — Gardée par le droit qui garde l'alimentation (`notification:envoi-de-masse:executer`).

---

## Livré le 2026-10-24 — branche `MNV-713` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 501/3 501 (261 suites) · `npm run test:e2e` 251/251 · lint 0 · build vert.

- ⚠️ **Écart de forme assumé sur AC-1 : `POST /listes/:id/contacts/retrait`, pas `DELETE`.** Un lot de
  cinq mille identifiants ne tient pas dans une adresse, et beaucoup de mandataires retirent le corps d'un
  `DELETE` : l'appel partirait vide et rendrait « rien retiré ». C'est le parti de l'annulation d'envoi
  (STORY-637).
- Idempotent : le compte rendu rend `retires`, `absents` (jamais membres, déjà retirés, mal formés ou
  d'une autre organisation — confondus exprès, sans quoi le retrait testerait le carnet d'un voisin) et
  `nombreDeMembres`.
- ⛔⛔ **AC-2 tient par une ABSENCE D'INJECTION** : l'instantané d'un envoi préparé (STORY-592) est une
  autre collection, copiée à la préparation, et `ListesService` ne peut pas la nommer — garde dans la
  suite (aucune mention de `LigneInstantane`, trois dépendances exactement).
- AC-3 : `nombreDeMembres` recompté après le retrait. Le retrait ne touche **que** cette liste (test : le
  même contact reste dans une autre).
- AC-5 : gardée par `notification:envoi-de-masse:executer`, comme l'alimentation (e2e).
- Les doubles de collection (unitaire et e2e) gagnent un `deleteMany` qui honore son filtre et rend
  `deletedCount`.
