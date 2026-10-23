# STORY-713 : Retirer un contact d'une liste

Status: ready-for-dev

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

- [ ] AC-1 — `DELETE /listes/:id/contacts` retire un lot d'identifiants ; idempotent (retirer un
      absent n'est pas une erreur, le compte rendu le dit).
- [ ] AC-2 — ⛔ Un envoi de masse **déjà préparé** sur la liste garde ses destinataires.
- [ ] AC-3 — `nombreDeMembres` est recalculé par comptage, jamais décrémenté à l'aveugle.
- [ ] AC-4 — ⛔ Un contact ou une liste d'une autre organisation est **introuvable**, pas interdit.
- [ ] AC-5 — Gardée par le droit qui garde l'alimentation (`notification:envoi-de-masse:executer`).
