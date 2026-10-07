# STORY-693 : Les autres services gardent un consommateur Kafka que kafkajs peut abandonner en silence

Status: done

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

- [x] AC-1 — Chaque consommateur listé passe par la supervision de STORY-684 (`SupervisionConsommateur` +
      `EtatConsommateursService`, relue dans `dossier-service`) : état tiré des événements kafkajs, relance
      d'un crash non relancé à délai croissant borné, journalisée.
- [x] AC-2 — `/health` de chaque service rend `kafka: down` tant qu'un groupe attendu n'a pas rejoint.
- [x] AC-3 — Un test d'invariant par service (balayage des `*-consumer.bootstrap.ts`, patron 684) ; une
      mutation qui retire la relance vire au rouge.
- [x] AC-4 — Vérification docker par service touché : broker absent au boot ⇒ relances ⇒ adhésion.

## Notes

- Découpage appliqué le 2026-10-07 : 693 (4 services), 702 (document, kyc, expert-comptable), 703 (classes
  de base fiscal/paiement/notification).
- Voir [[STORY-684]].

## Progress Tracking

**Statut : `done` (2026-10-07).** PR rebase-mergées sur `dev` : prospera-assurance-service#15,
prospera-microfinance-service#17, prospera-balance-service#127, prospera-bilan-service#162.

### Réalisation
- 25 bootstraps réécrits par script (`tmp/693/transformer.py`, hors dépôts) : abonnement, exécution et
  `groupId` reportés tels quels depuis l'ancien `tryStart` (comparaison mécanique ancien/nouveau rejouée par la
  revue : identiques, aucun commentaire ni logique perdus). `onApplicationBootstrap` n'attend plus la
  1re tentative (patron 684).
- `supervision-consommateur.util.ts` identique octet pour octet à `dossier-service` ;
  `etat-consommateurs.service.ts` ne diffère que par sa JSDoc.
- `/health` : `kafka: down` + `groupesHorsGroupe` tant qu'un groupe attendu n'a pas rejoint.
- Doubles d'infrastructure des specs de graphe d'injection complétés (`on`/`events`, vraie classe
  `EtatConsommateursService`) : assurance 1, balance 7, bilan 4 ; spec du consommateur `declaration-deposee`
  (bilan) adaptée au démarrage non attendu (relance à 1 s).

### Portes (AC-3)
| Service | Unit | Couverture (stmts/br/fn/lignes) | e2e |
|---|---|---|---|
| assurance | 2 116 | 99,61 / 94,76 / 99,21 / 99,66 | 340 |
| microfinance | 2 823 | 99,37 / 95,70 / 98,50 / 99,40 | 594 (83 skipped, pré-existants) |
| balance | 5 013 | 99,33 / 93,33 / 99,13 / 99,45 | 1 786 |
| bilan | 11 636 | 99,43 / 97,02 / 99,58 / 99,53 | 3 289 |

Lint 0 warning et build OK partout. Mutations (`tmp/693/mutations.py`) : **16/16 rouges** — relance d'un crash
non relancé retirée, relance d'un échec de démarrage retirée, `/health` ignorant les groupes, kyc-status ne
démarrant plus sa supervision — × 4 services. Après revue : abonnement tronqué (`{ topics }` sans
`fromBeginning`) et démarrage `await` → rouges.

### Vérification docker (AC-4) — stack neuve, `tmp/verif-docker-693/`
- **Broker absent au boot** : les 4 services répondent (HTTP up), `/health` 503 `kafka: down` ; relances
  journalisées (« démarrage en échec … relance n°1 dans 1000 ms ») : 21 / 24 / 37 / 45 lignes.
- **Kafka démarré** : groupes rejoints **4/4, 4/4, 8/8, 9/9** (noms relevés dans les journaux), `/health` 200.
- **Fenêtre d'adhésion (AC-2)** : service redémarré broker joignable ⇒ `/health` 503 « Consommateur(s) hors de
  leur groupe : assurance-dossier, assurance-entitlement, assurance-exercice, assurance-kyc » pendant ~3 s,
  puis 200.
- **Incident d'origine reproduit** : `assurance-dossier` arrêté par kafkajs **sans relance**
  (`KafkaJSNonRetriableError : Failed to find group coordinator`) ⇒ relancé par la supervision ⇒ groupe
  rejoint 16 s plus tard.
- **Panne de broker en cours de route** : `/health` 503, puis 200 au retour, tous groupes rejoints.

### Revue de code (⑥)
Retenus et corrigés (commit `MNV-693(revue)`) : la spec de supervision vérifie que groupe, abonnement et
exécution arrivent **tels quels** à kafkajs ; l'invariant exige `onApplicationBootstrap(): void` +
`void this.supervision.demarrer();` ; commentaire du test AC-2 de `/health` qui attribuait l'incident au
service. Écartés : (1) message toxique — une erreur de traitement permanente fait boucler crash/relance par
kafkajs et `/health` oscille, majoritairement `up` : comportement **antérieur**, commun au patron de
`dossier-service`, ⇒ **STORY-704** ; (2) aucune spec ne relie l'instance d'état lue par `/health` à celle
des consommateurs instanciés (scénario hypothétique d'un module qui redéclarerait le service) ; (3) le
balayage ne voit que les `*-consumer.bootstrap.ts` (seul autre consommateur : la sonde jetable de
`/health` de balance, hors périmètre). Ponytail : rien à couper.

### Revue de sécurité (⑦)
0 constat. `/health` n'expose que des identifiants de groupes issus de la configuration ; abonnements,
validation d'enveloppe et idempotence inchangés ; aucun `run()` concurrent (relance seulement sur
`restart: false`).

Historique : `in_progress` (2026-10-07), découpée sur 4 services (décision user), suites STORY-702 et 703 ;
`ready-for-dev` (2026-10-02), créée à la clôture du lot 683-685 (AC-4 de STORY-684).
