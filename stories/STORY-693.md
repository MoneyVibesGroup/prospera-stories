# STORY-693 : Les autres services gardent un consommateur Kafka que kafkajs peut abandonner en silence

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** transverse — 10 services (assurance, balance, bilan, document, kyc, microfinance, expert-comptable, fiscal, paiement, notification)
**Points :** 8 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** AC-4 de STORY-684 (2026-10-02) — relevé en lecture seule, non corrigé par 684.

---

## Le fait, mesuré

STORY-684 a établi la cause racine sur kafkajs **2.2.4** : quand l'adhésion au groupe échoue,
`consumer.run()` se **résout** quand même (l'erreur part dans `onCrash`), et
`KafkaJSGroupCoordinatorNotFound` est **non-retriable** — kafkajs journalise `Crash` puis `Stopped` et n'y
revient jamais. Tout bootstrap qui conclut « démarré » à la résolution de `run()` peut donc perdre un
consommateur **en silence**, `/health` restant `up`.

Le relevé de STORY-684 (§ *AC-4*, fichier:ligne par service) compte **45 consommateurs dans 10 services**
au même motif (`await consumer.run(...)` puis `started = true`, sans écoute de `CRASH`/`GROUP_JOIN`).
Les plus critiques par effet : les `kyc-status` (porte d'accès fail-closed : assurance, balance, bilan,
microfinance) et les `entitlement`. fiscal, paiement et notification passent par une **classe de base**.

## Critères d'acceptation

- [ ] AC-1 — Chaque consommateur listé passe par la supervision de STORY-684 (`SupervisionConsommateur` +
      `EtatConsommateursService`, relue dans `dossier-service`) : état tiré des événements kafkajs, relance
      d'un crash non relancé à délai croissant borné, journalisée.
- [ ] AC-2 — `/health` de chaque service rend `kafka: down` tant qu'un groupe attendu n'a pas rejoint.
- [ ] AC-3 — Un test d'invariant par service (balayage des `*-consumer.bootstrap.ts`, patron 684) ; une
      mutation qui retire la relance vire au rouge.
- [ ] AC-4 — Vérification docker par service touché : broker absent au boot ⇒ relances ⇒ adhésion.

## Notes

- Découpage possible : une story par service ; fiscal/paiement/notification se corrigent dans leur
  classe de base. Commencer par les consommateurs `kyc-status` et `entitlement`.
- Voir [[STORY-684]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture du lot 683-685 (AC-4 de STORY-684).
