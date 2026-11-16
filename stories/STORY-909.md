# STORY-909 : fiscal-service sur le socle du moteur

Status: done

**Complexité :** petite à moyenne (le patron de STORY-908, sur un service)

**Épic :** EPIC-155 (les services sur le socle du moteur)
**Service :** `prospera-fiscal-service`
**Plage :** groupe A, n° 5 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Fiche écrite **avant** de
coder.

---

## Pourquoi

fiscal-service tourne encore sous Node 20 et `kafkajs`. Sa supervision des consommateurs est la copie à l'octet de
celle de notification avant 950 (comme balance et bilan avant 908), et sa classe de base `ConsumerReadModel` porte les
six consommateurs de read-models.

## Ce que la story livre (patron de STORY-908)

1. **Node 24** (base, runtime), étage `verification`, `engines`, `@types/node` 24, `test/` dans le contexte Docker.
2. **Le client de Confluent** (`~1.11`), `kafkajs` retiré : `KafkaModule`, producteur non attendu à l'amorçage, santé par
   `listTopics` **bornée à 5 s** (D-908-2), supervision de 908 (topics créés avant `subscribe`, `metadataMaxAge` 10 s,
   **un consommateur neuf à chaque relance**, D-908-1).
3. **La garde de pureté du domaine** interdit aussi `@confluentinc/kafka-javascript` dans `src/domain`.

## Critères d'acceptation

- **AC-1** : fiscal démarre `healthy` sous Node 24 (`docker compose up`), sans `kafkajs` dans l'image.
- **AC-2** : sur Kafka neuf, chaque consommateur rejoint son groupe ; un événement sur un topic jamais écrit est
  projeté en secondes (mesuré).
- **AC-3** : Kafka arrêté, HTTP répond et `/health` dit `kafka down` en quelques secondes ; Kafka revenu, les groupes
  reviennent sans redémarrage.
- **AC-4** : unitaires verts dans l'étage `verification` ; `test:conformite` vert sous Node 24 (rs-fiscal).
- **AC-5** : recette `zone-franche` (qui fait dériver les obligations par fiscal) verte depuis `dev`.

## Definition of Done

- [x] Étage `verification` (Node 24.22) : suite unitaire 167/168, la suite en échec (`consommateurs-groupes`, forme de
  la configuration du client) corrigée puis rejouée avec Kafka, read-models, santé et domaine : 1020/1020 ; lint et
  `tsc` verts ; `test:conformite` **65/65 sous Node 24** (rs-fiscal jetable sur un réseau Docker).
- [x] Mutation : la supervision est la copie à l'octet de celle de 908, où « relance sans consommateur neuf » rougit
  (STORY-908) ; le test est présent ici à l'identique.
- [x] Pile `grp-a-909` (volumes neufs, image de la branche) : `healthy`, Node 24.22, aucun `kafkajs` ; AC-2 : un
  `kyc.status.changed` sur un topic jamais écrit est projeté en **6,6 s** ; AC-3 : Kafka arrêté, `/health` 503 en
  **6,8 s** ; redémarré sans Kafka, HTTP en **25 s** ; Kafka revenu, `/health` 200 en **16 s**.
- [ ] Recette depuis `dev` : jouée au gate de STORY-910 (même pile, mêmes recettes).
- [x] PR code fusionnée : fiscal #48 (`a552d77`).
