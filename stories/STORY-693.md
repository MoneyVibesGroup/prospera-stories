# STORY-693 : Les autres services gardent un consommateur Kafka que kafkajs peut abandonner en silence

Status: in_progress

**Épic :** EPIC-012
**Service :** assurance-service, balance-service, bilan-service, microfinance-service (25 consommateurs)
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
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

## Périmètre (découpage du 2026-10-07, décision user)

**Inclus** — les 4 services qui portent les consommateurs `kyc-status` et `entitlement` (porte d'accès
fail-closed), **tous** leurs consommateurs listés au relevé de STORY-684 :

| Service | Consommateurs |
|---|---|
| `assurance-service` | kyc-status, entitlement, exercice, dossier (4) |
| `balance-service` | axes, exercice, entitlement, dossier, kyc-status, ingestion, profil-ocr, pieces-ocr (8) |
| `bilan-service` | immobilisations, exercice, kyc-status, entitlement, identity, dossier, perimetre, balance, declaration-deposee (9) |
| `microfinance-service` | kyc-status, entitlement, exercice, dossier (4) |

**Hors périmètre** — `document-service`, `kyc-service`, `expert-comptable` ⇒ **STORY-702** ;
classes de base de `fiscal-service`, `paiement-service`, `notification-service` ⇒ **STORY-703**.
Le consommateur **éphémère** de la sonde `/health` de `balance-service` (`src/kafka/kafka-bootstrap.service.ts`)
n'est pas concerné (borné par un délai qui rend `down`, cf. relevé 684).

Le patron (`SupervisionConsommateur`, `EtatConsommateursService`, indicateur `/health`, invariant de
balayage) est **recopié** de `dossier-service` dans chaque service : aucune bibliothèque partagée entre
dépôts (une base, un dépôt, un déploiement par service).

## Critères d'acceptation

- [ ] AC-1 — Chaque consommateur listé passe par la supervision de STORY-684 (`SupervisionConsommateur` +
      `EtatConsommateursService`, relue dans `dossier-service`) : état tiré des événements kafkajs, relance
      d'un crash non relancé à délai croissant borné, journalisée.
- [ ] AC-2 — `/health` de chaque service rend `kafka: down` tant qu'un groupe attendu n'a pas rejoint.
- [ ] AC-3 — Un test d'invariant par service (balayage des `*-consumer.bootstrap.ts`, patron 684) ; une
      mutation qui retire la relance vire au rouge.
- [ ] AC-4 — Vérification docker par service touché : broker absent au boot ⇒ relances ⇒ adhésion.

## Notes

- Découpage appliqué le 2026-10-07 : 693 (4 services), 702 (document, kyc, expert-comptable), 703 (classes
  de base fiscal/paiement/notification).
- Voir [[STORY-684]].

## Progress Tracking

**Statut : `in_progress` (2026-10-07).** Découpée sur 4 services (décision user), suites STORY-702 et 703.

Historique : `ready-for-dev` (2026-10-02). Créée à la clôture du lot 683-685 (AC-4 de STORY-684).
