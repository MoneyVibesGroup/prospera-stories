# STORY-910 : dossier-service et kyc-service sur le socle du moteur

Status: done

**Complexité :** petite à moyenne (le patron de STORY-908, sur deux services)

**Épic :** EPIC-155 (les services sur le socle du moteur)
**Services :** `dossier-service` (`prospera-dossier-service`), `kyc-service` (`prospera-kyc-service`)
**Plage :** groupe A, n° 6 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Fiche écrite **avant** de
coder.

---

## Pourquoi

Les deux services tournent encore sous Node 20 et `kafkajs`, avec la supervision copiée à l'octet de celle de
notification avant 950 — la même base que balance, bilan et fiscal avant 908 et 909.

## Ce que la story livre (patron de STORY-908)

1. **Node 24** (base, runtime), étage `verification`, `engines`, `@types/node` 24, `test/` dans le contexte Docker.
2. **Le client de Confluent** (`~1.11`), `kafkajs` retiré : `KafkaModule`, producteur non attendu à l'amorçage, santé par
   `listTopics` bornée à 5 s, supervision de 908 (topics créés avant `subscribe`, `metadataMaxAge` 10 s, un
   consommateur neuf à chaque relance).

## Critères d'acceptation

- **AC-1** : dossier et kyc démarrent `healthy` sous Node 24, sans `kafkajs` dans l'image.
- **AC-2** : sur Kafka neuf, chaque consommateur rejoint son groupe ; un événement sur un topic jamais écrit est
  projeté en secondes (mesuré).
- **AC-3** : Kafka arrêté, HTTP répond et `/health` dit `kafka down` en quelques secondes ; Kafka revenu, les groupes
  reviennent sans redémarrage.
- **AC-4** : unitaires verts dans l'étage `verification`.
- **AC-5** : recettes `pile` et `zone-franche` vertes depuis `dev` (couvrent aussi 909).

## Definition of Done

- [x] Étage `verification` (Node 24.22) : dossier **113/113** suites (1798 tests), kyc **50/50** (503) ; lint et `tsc` verts.
- [x] Pile `grp-a-910` (volumes neufs, images des branches) : Node 24.22, aucun `kafkajs`, `healthy` ; AC-2 : un
  `kyc.status.changed` sur un topic jamais écrit est projeté par dossier en **3,2 s** ; AC-3 : Kafka arrêté, `/health`
  503 en **3,1 s**, HTTP en 5-7 s après redémarrage, `/health` 200 en **8 s** au retour, aucun « Connect has already
  been called ».
- [x] Recettes `pile` + `zone-franche` + `atelier-balance` **63/63** depuis `dev` (gate de 911, MongoDB 8.0).
- [x] PR code fusionnées : dossier #49 (`2e7e0dc`), kyc #28 (`d4932c6`).
