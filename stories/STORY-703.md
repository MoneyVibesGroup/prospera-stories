# STORY-703 : Les classes de base des read-models de fiscal, paiement et notification concluent démarré à la résolution de run()

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** fiscal-service, paiement-service, notification-service (13 consommateurs via 3 classes de base)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** découpage de STORY-693 (décision user du 2026-10-07) — relevé AC-4 de STORY-684.

---

## Le fait

kafkajs **2.2.4** : quand l'adhésion au groupe échoue, `consumer.run()` se **résout** quand même, et
`KafkaJSGroupCoordinatorNotFound` est non-retriable (`Crash` puis `Stopped`, jamais relancé). Un bootstrap
qui pose `started = true` après `await run()` perd son consommateur **en silence**, `/health` restant `up`.

## Périmètre

**Inclus** — la classe de base de chaque service : `fiscal-service`
`src/modules/read-models/consumer-read-model.bootstrap.ts` (5 sous-classes), `paiement-service` et
`notification-service` `src/modules/read-models/consommateur-read-model.bootstrap.ts` (3 et 5 sous-classes).

**Hors périmètre** — les autres services (STORY-693, STORY-702).

## Critères d'acceptation

- [ ] AC-1 — La classe de base de chaque service délègue à `SupervisionConsommateur` + `EtatConsommateursService` : toutes ses sous-classes en héritent (état tiré des événements kafkajs, relance bornée, journalisée).
- [ ] AC-2 — `/health` rend `kafka: down` tant qu'un groupe attendu n'a pas rejoint.
- [ ] AC-3 — Test d'invariant par service (balayage des bootstraps consommateurs) ; une mutation qui
      retire la relance vire au rouge.
- [ ] AC-4 — Vérification docker par service : broker absent au boot ⇒ relances ⇒ adhésion.

## Notes

- Patron de référence : `SupervisionConsommateur` + `EtatConsommateursService` de `dossier-service`
  (STORY-684), tel que recopié par STORY-693.

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-07).** Créée par le découpage de STORY-693.
