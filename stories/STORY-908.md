# STORY-908 : Balance et bilan sur le socle du moteur

Status: done

**Complexité :** moyenne (une migration de client Kafka déjà faite quatre fois ; deux services)

**Épic :** EPIC-155 (les services sur le socle du moteur)
**Services :** `balance-service`, `bilan-service`
**Plage :** groupe A, n° 4 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §2). Fiche écrite **avant** de
coder.

---

## Pourquoi

Le socle du moteur (spine, AD-27) fixe Node 24 et le client Kafka de Confluent (`@confluentinc/kafka-javascript`,
couche compatible KafkaJS). Le catalogue (930), paiement (937), notification (950) et les services de C y sont déjà.
Balance et bilan tournent encore sous Node 20 et `kafkajs` ; leur supervision des consommateurs est **la copie à
l'octet** de celle de notification avant 950.

Deux pièges payés ailleurs s'appliquent tels quels (`REGLES-DES-GROUPES.md` §1.9) :

- le client de Confluent **ne crée pas** un topic en s'y abonnant : sur une pile neuve, un groupe abonné à un topic
  jamais écrit ne naît pas ⇒ créer les topics abonnés absents **avant** `subscribe` ;
- il ne voit un topic neuf qu'au rafraîchissement des métadonnées (5 min) ⇒ `metadataMaxAge: 10_000`.

## Ce que la story livre (patron de STORY-950, sans la garde)

1. **Node 24** : `node:24-slim` (base et runtime), étage `verification` (tests unitaires sur Node 24, le client est un
   binding natif), `engines`, `@types/node` 24 ; `test/` entre dans le contexte Docker.
2. **Le client de Confluent** (`~1.11`), `kafkajs` retiré :
   - `KafkaModule` instancie `KafkaJS.Kafka` ;
   - la supervision est reprise de notification (950) : démarrage réussi = groupe rejoint, relance avec recul, blocage
     compté par partition, **topics créés avant l'abonnement**, `metadataMaxAge` 10 s ;
   - chaque consommateur adapte son abonnement (`topics`, `fromBeginning` déclaré à la création) ;
   - le producteur ne retient plus l'amorçage (D-950-5) ;
   - la santé lit `listTopics` (pas de `describeCluster` dans la couche KafkaJS).
3. **Les schémas des événements produits au registre (Karapace), compatibilité BACKWARD** : script
   `schemas:enregistrer`, comme le catalogue (930) — si le temps manque, il passe en remplaçante nommée.
4. **Recettes `atelier-balance` et `zone-franche` vertes à froid depuis `dev`** (images reconstruites, volumes neufs).

## Critères d'acceptation

- **AC-1** : balance et bilan démarrent `healthy` sous Node 24 (`docker compose up`), sans `kafkajs` dans
  l'arbre de dépendances de production.
- **AC-2** : sur une pile neuve, chaque consommateur rejoint son groupe même si son topic n'a jamais été écrit ; un
  topic créé après l'abonnement est vu en secondes, pas en minutes (mesuré).
- **AC-3** : Kafka arrêté, le service répond en HTTP et `/health` dit `kafka down` (démarrage dégradé conservé ;
  balance et bilan n'ont pas de route `/health/live`).
- **AC-4** : suites unitaires vertes dans l'étage `verification` (Node 24).
- **AC-5** : recettes `atelier-balance` et `zone-franche` vertes depuis `dev`.

## Definition of Done

- [x] Étage `verification` (Node 24.22) : balance **269/269** suites, bilan **323/323** ; specs Kafka et santé rejouées
  après les deux correctifs (92/92, 78/78) ; lint et `tsc` verts.
- [x] Mutations rouges : topics non créés avant `subscribe` (2 tests) ; `metadataMaxAge` retiré (1) ; relance sans
  consommateur neuf (1).
- [x] Pile `grp-a-908` (volumes neufs, images des branches) : `healthy`, aucun `kafkajs` dans l'image ; AC-2 : un
  `kyc.status.changed` sur un topic jamais écrit est projeté en **3,4 s** (balance) et **4,3 s** (bilan) ; topic
  supprimé puis recréé après l'abonnement : **3,2 s / 4,2 s** ; AC-3 : Kafka arrêté, `/health` 503 `kafka down` en
  **3,1 s**, HTTP en **8 s** après redémarrage ; Kafka revenu, groupes rejoints en **8 s**.
- [x] Recettes `zone-franche` + `atelier-balance` **56/56** depuis `dev` (pile `grp-a-908r`, images reconstruites,
  artefacts JSON réextraits en LF).
- [x] PR code fusionnées : balance #148 (`985e8d1`), bilan #174 (`982c2db`).

## Trouvé au gate (corrigé dans la story)

- **D-908-1 — une relance prend un consommateur neuf.** Le client de Confluent quitte l'état `INIT` au premier
  `connect()` et n'y revient jamais : la supervision de 950 rappelait `connect()` sur le même consommateur, en vain
  (« Connect has already been called elsewhere », relance n°17, Kafka revenu). Démarré sans Kafka, un service ne
  retrouvait jamais ses groupes. Signalé à B et C.
- **D-908-2 — `/health` borne son contrôle Kafka à 5 s.** Broker absent, `admin.connect()` ne rejetait qu'au bout de
  ~30 s : la sonde du compose expirait. Signalé à B et C.
- **D-908-3 — le schéma des événements au registre (AC « schémas au registre en BACKWARD » du plan) n'est pas fait
  ici** : balance et bilan n'ont pas encore de script `schemas:enregistrer`. Remplaçante nommée, à reprendre avec 912
  (projection de `etat-publie.changed`), où le registre est déjà lu.
