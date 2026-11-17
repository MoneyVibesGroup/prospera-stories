# STORY-957 : la supervision Kafka corrigée dans notification, paiement et le catalogue ; la passation de notification à D

Status: in-progress

**Complexité :** moyenne (un même défaut dans trois services, une preuve sur pile par service, une passation)

**Épic :** EPIC-155 (la supervision du socle)
**Dépôts :** `MoneyVibesGroup/prospera-notification-service`, `MoneyVibesGroup/prospera-paiement-service`,
`MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 2 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 957 ; D-L3-3).
**Débloque :** D-1051 (prévenir l'assuré, dans `notification`), par la passation écrite à la fusion.

---

## Pourquoi

A a trouvé deux défauts du patron de supervision de STORY-950 sur la pile de STORY-908 (balance, bilan), les a
corrigés chez lui (balance #148, bilan #174) et a demandé à B et à C de les vérifier (journal de A, « → B et C,
2026-11-16 ») :

1. **Une relance ne peut pas réussir.** La supervision rappelle `connect()` sur **le même** consommateur. Le client de
   Confluent (1.11, `lib/kafkajs/_consumer.js`) quitte l'état `INIT` au premier `connect()` et n'y revient jamais : le
   second appel rejette « Connect has already been called elsewhere ». Un service démarré **sans Kafka** relance donc
   dans le vide, sans fin, même Kafka revenu.
2. **`/health` attend environ 30 s un broker absent** : `admin.connect()` n'est pas borné, et la sonde expire avant
   la réponse.

Relevé sur `origin/dev` au rituel :

- **notification et paiement** : `src/kafka/supervision-consommateur.util.ts` est la copie d'avant le correctif de A,
  octet pour octet. Les deux défauts y sont.
- **catalogue** : quatre consommateurs (abonnements, organisations, droits, feux verts) ont chacun leur boucle de
  relance. Chacune crée déjà un consommateur neuf, mais **attend le `disconnect()` de l'ancien** avant de relancer.
  Si l'ancien a joint le broker puis perdu son abonnement, librdkafka peut retenir cette fermeture, et la relance
  attend avec elle. Le `/health` du catalogue a le défaut 2.

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 2)

| Exigence | Fait |
|---|---|
| Un consommateur neuf à chaque relance, dans les trois services | à prouver |
| `/health` borné à 5 s : il répond même si Kafka ne répond pas | à prouver |
| Preuve sous `docker compose up`, pour chaque service : Kafka arrêté, service redémarré, Kafka relancé, `/health` 200, un message consommé après la relance | à prouver |
| Tests unitaires et mutations sur la relance et sur la borne de 5 s | à prouver |
| Passation de `prospera-notification-service` à D dans le journal de B, à la fusion (SHA rejoué sur `dev`) ; ligne « → D » qui débloque D-1051 | à faire |

## Décisions (prises par défaut, contestables)

- **D-957-1 : le correctif de A est repris tel quel dans notification et paiement** (`renouveler()`, test « chaque
  relance prend un consommateur NEUF », `DELAI_SANTE_KAFKA_MS = 5_000`). Les trois copies (balance, notification,
  paiement) restent alignées, ce qui facilite une future mise en commun.
- **D-957-2 : l'ancien consommateur est déconnecté sans être attendu.** Chez A, `renouveler()` attend
  `ancien.disconnect()` avant de planifier la relance. Après un `connect()` raté, la fermeture rend tout de suite
  (`DISCONNECTED`). Après un `connect()` réussi suivi d'un `subscribe` ou d'un `run` raté, elle passe par
  librdkafka, broker peut-être perdu, et peut retenir la relance. La relance ne dépend donc plus de cette fermeture.
  Écart au patron de A, signalé à A dans le journal de B.
- **D-957-3 : le catalogue met ses quatre boucles de relance en commun** (`src/kafka/demarrage-avec-relance.ts`) :
  un consommateur neuf par tentative, recul exponentiel de 1 s à 30 s, ancien déconnecté sans attente. Une seule
  logique testée et mutée, plutôt que quatre copies. Les messages du journal gardent leur sens ; les groupes, les
  topics et `fromBeginning` ne changent pas.
- **D-957-4 : le `/health` du catalogue ne lit toujours pas l'état de ses consommateurs.** Il ne fait que se borner à
  5 s. Rendre `down` un consommateur hors de son groupe (comme notification et paiement depuis STORY-703) est un
  changement de comportement de la sonde. Il reste hors du périmètre et figure dans « Pour la suite ».
- **D-957-5 : le contrôle Kafka est borné, pas `/health` entier.** Les autres contrôles (MongoDB, Redis) gardent
  leurs propres délais. La story vise Kafka, et la preuve mesure `/health` entier, Kafka arrêté.

## Ce qui a été livré

À écrire à la fusion.

## Preuves

À écrire.

## Pour la suite

À écrire.
