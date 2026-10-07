# STORY-702 : document-service, kyc-service et expert-comptable gardent un consommateur Kafka que kafkajs peut abandonner en silence

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** document-service, kyc-service, expert-comptable (7 consommateurs)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** découpage de STORY-693 (décision user du 2026-10-07) — relevé AC-4 de STORY-684.

---

## Le fait

kafkajs **2.2.4** : quand l'adhésion au groupe échoue, `consumer.run()` se **résout** quand même, et
`KafkaJSGroupCoordinatorNotFound` est non-retriable (`Crash` puis `Stopped`, jamais relancé). Un bootstrap
qui pose `started = true` après `await run()` perd son consommateur **en silence**, `/health` restant `up`.

## Périmètre

**Inclus** — les consommateurs du relevé de STORY-684 :
`document-service` (read-models dossier et identity, piece-extraction cahier-piece, extraction
kyc-document-uploaded), `kyc-service` (document-extract), `expert-comptable` (identity, kyc-events).

**Hors périmètre** — les autres services (STORY-693, STORY-703).

## Critères d'acceptation

- [ ] AC-1 — Chaque consommateur listé passe par `SupervisionConsommateur` + `EtatConsommateursService` : état tiré des événements kafkajs, relance d'un crash non relancé à délai croissant borné, journalisée.
- [ ] AC-2 — `/health` rend `kafka: down` tant qu'un groupe attendu n'a pas rejoint.
- [ ] AC-3 — Test d'invariant par service (balayage des bootstraps consommateurs) ; une mutation qui
      retire la relance vire au rouge.
- [ ] AC-4 — Vérification docker par service : broker absent au boot ⇒ relances ⇒ adhésion.

## Notes

- Patron de référence : `SupervisionConsommateur` + `EtatConsommateursService` de `dossier-service`
  (STORY-684), tel que recopié par STORY-693.

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-07).** Créée par le découpage de STORY-693.
