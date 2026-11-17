# STORY-957 : la supervision Kafka corrigée dans notification, paiement et le catalogue ; la passation de notification à D

Status: done

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
| Un consommateur neuf à chaque relance, dans les trois services | oui : notification et paiement (`renouveler()`), catalogue (`DemarrageAvecRelance`, les quatre consommateurs) ; l'ancien n'est plus attendu (D-957-2) |
| `/health` borné à 5 s : il répond même si Kafka ne répond pas | oui : `DELAI_SANTE_KAFKA_MS = 5_000` et un seul client admin (D-957-6) ; Kafka arrêté, 3,2 à 5,3 s en régime (7,5 s au plus pendant la rafale de relances d'un redémarrage) |
| Preuve sous `docker compose up`, pour chaque service : Kafka arrêté, service redémarré, Kafka relancé, `/health` 200, un message consommé après la relance | oui : pile `grp-b`, `/health` 200 en 21 à 22 s après la relance de Kafka, message consommé par les trois services (offset 2/2, retard 0) ; témoin `dev` : notification et paiement restent hors de leur groupe |
| Tests unitaires et mutations sur la relance et sur la borne de 5 s | oui : Node 24 vert dans les trois services ; 30 mutations sur 30 rougissent sur une assertion |
| Passation de `prospera-notification-service` à D dans le journal de B, à la fusion (SHA rejoué sur `dev`) ; ligne « → D » qui débloque D-1051 | oui : dernier commit de B sur `dev` `5e6c553` (notification #89) ; « → D » au journal de B |

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
- **D-957-6 : le contrôle Kafka de `/health` garde un seul client admin** (écart au patron de A, trouvé sur la pile).
  La borne de A ne suffisait pas : Kafka arrêté, `/health` répondait en 6,2 à 6,4 s (et jusqu'à 10,4 s au
  redémarrage), le contrôle Kafka disant pourtant « broker muet après 5000 ms ». Mesuré dans le conteneur de
  paiement : la fermeture d'un client admin du client de Confluent est **synchrone** (destruction librdkafka) et prend
  **0,45 à 3,8 s**, sur le chemin de la réponse, à chaque contrôle. Le client est désormais créé une fois et
  réutilisé (librdkafka reprend seul la connexion), recréé seulement si sa connexion échoue (le fautif est fermé hors
  de la réponse, par `setImmediate`), fermé à l'arrêt du module. **À signaler à A** : balance et bilan ont la même
  fermeture par contrôle.
- **D-957-7 : les gardes qui bornent les minuteries reçoivent une exception nommée, pas une dérogation muette.**
  notification (AC-5, `aucune-minuterie.spec.ts`) inventorie `health/indicators/kafka.health.ts` avec son motif ;
  paiement (AD-12, `ecriture-argent.invariant.spec.ts`) gagne la liste `BORNES_DE_SONDE`. La borne est un délai de
  réponse d'une sonde : elle ne porte aucun fait daté. Au catalogue, la garde de STORY-940 (« les topics sont assurés
  avant l'abonnement ») lit désormais `demarrage-avec-relance.ts`, le seul endroit où l'ordre existe.

## Ce qui a été livré

Trois PR fusionnées en « Rebase and merge » le 17/11. Sur `dev`, les arbres sont identiques à ceux éprouvés.

| Dépôt | PR | Commits rejoués sur `dev` (le dernier en tête) |
|---|---|---|
| `prospera-notification-service` | #89 | `83759e9`, `5fa64ae`, `1307ed6`, **`5e6c553`** |
| `prospera-paiement-service` | #121 | `fc5c92f`, `6afb916`, `e233ba5`, **`1e90517`** |
| `prospera-platform-catalog-service` | #59 | `82cad72`, `4a2fc54`, `ec43a58`, **`5004cc5`** |

- **notification, paiement** : `supervision-consommateur.util.ts`, où une relance prend un consommateur neuf et
  déconnecte l'ancien sans l'attendre ; `kafka.health.ts`, borné à 5 s avec un seul client admin ; une exception
  nommée dans la garde des minuteries (AC-5 pour notification, AD-12 pour paiement).
- **catalogue** : `src/kafka/demarrage-avec-relance.ts`, branché sur les quatre consommateurs ; `kafka.health.ts`,
  borné à 5 s avec un seul client admin ; la garde de STORY-940 qui lit le démarrage commun.
- **Aucun contrat ne change** : ni topic, ni groupe, ni route, ni forme de `/health`. Seul le texte du message `down`
  est nouveau (« broker muet après 5000 ms (connexion ou métadonnées) »).

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive`, une suite à la
  fois) :
  - notification : 276 suites, 3 846 passés, 1 sauté ;
  - paiement : paquets 130/130, service 336 suites, 4 518 passés, 2 sautés ;
  - catalogue : 100 suites, 1 530/1 530.
  Le premier passage a fait rougir trois gardes, corrigées par D-957-7 : AC-5 (notification), AD-12 (paiement), et
  la garde de STORY-940 (catalogue).
- **Lint** des fichiers touchés et **`tsc`** verts dans les trois dépôts.
- **Mutations : 30 sur 30 rougissent sur une assertion** (script rejoué après le dernier commit) :
  - notification et paiement, 9 chacun : relance sur le même consommateur, relance qui attend la fermeture,
    configuration perdue, borne à 4 s, borne à 6 s, client admin non gardé, client fautif gardé, fermeture sur le
    chemin de la réponse, arrêt sans fermeture ;
  - catalogue, 12 : les quatre de la santé, la borne à 4 s et à 6 s, et six sur le démarrage (même consommateur,
    relance qui attend la fermeture, recul qui ne double plus, recul non plafonné, compteur jamais remis à zéro,
    relance après l'arrêt).
  Trois mutations rougissaient d'abord par compilation ou par délai dépassé ; les mutations ou les tests ont été
  réécrits jusqu'à rougir sur une assertion.
- **Pile `grp-b`** (compose racine, images des branches, volumes neufs, verrou Docker pris de façon atomique) :
  1. pile saine : les trois `/health` à 200 ;
  2. Kafka arrêté, puis les trois services redémarrés. Trois contrôles de `/health` par service, tous à 503
     `kafka down` :
     - catalogue : 3,2 à 3,8 s ;
     - notification : 4,2 à 4,6 s, et 7,5 s au premier contrôle, pendant la rafale de relances qui suit le
       redémarrage ;
     - paiement : 5,2 à 5,3 s (la borne, plus les autres contrôles).
     Pendant un contrôle, `/live` répond en 8 ms. Les relances sont journalisées (« relance n°2 dans 2000 ms ») ;
  3. Kafka relancé, sain en 20 s : les trois `/health` repassent à **200 en 21 à 22 s**, tous les groupes
     « démarré » ou « abonné à » ;
  4. **un message publié après la relance est consommé par les trois services** (`identity.org.created`) :
     - au catalogue, « Message écarté sur identity.org.created[0]@1 : VERSION_INCONNUE » ;
     - à paiement et à notification, « ignoré — eventId absent » ;
     - les groupes `platform-catalog-identite`, `paiement-identity` et `notification-identity-org` sont à l'offset
       2/2, retard 0, chacun avec un consommateur actif.
- **D-957-6 trouvé sur la pile** : avant lui, le même scénario donnait `/health` à 6,2–6,4 s (et 7,8 à 10,4 s au
  redémarrage). La mesure dans le conteneur, Kafka arrêté, donne une fermeture synchrone du client admin de 3 842,
  452 et 848 ms.
- **Témoin `origin/dev`** (images reconstruites depuis `dev`, même pile, même scénario) :
  - notification et paiement relancent dans le vide : « démarrage en échec (Connect has already been called
    elsewhere) ». Leur `/health` reste à **503 « Consommateur(s) hors de leur groupe »** (six groupes chacun) 178 s
    et 345 s après le retour de Kafka. Le message n'est **pas consommé** : offset 2/3, retard 1, aucun consommateur ;
  - le catalogue de `dev` se rétablit (il recréait déjà son consommateur), mais son `/health` met **7,8 à 8,0 s**
    quand Kafka est arrêté.
- Pile descendue avec ses volumes (`down -v`), verrou rendu.

## Pour la suite

- **→ A** : D-957-6 vaut aussi pour balance et bilan. Leur `kafka.health.ts`, corrigé en 908, ferme un client admin
  à chaque contrôle : c'est une fermeture synchrone, qui coûte de 0,45 à 3,8 s Kafka arrêté. C (sinistres,
  assurance, document-service, liaison-assureur) et D (assureur-fictif) ont reçu la même demande de A. Le patron
  complet est dans les trois dépôts de B.
- **Catalogue, hors périmètre (D-957-4)** : `/health` ne dit pas qu'un consommateur est hors de son groupe, comme
  notification et paiement le font depuis STORY-703. C'est une remplaçante possible.
- **Résidu mesuré** : juste après un redémarrage sans Kafka, la rafale de relances (chaque consommateur neuf est une
  création librdkafka synchrone) a porté un contrôle de notification à 7,5 s. Ensuite, tous les contrôles restent
  sous 5,3 s.
- **Passation** : `prospera-notification-service` passe à D à la fusion (D-L3-3), dernier commit de B sur `dev` :
  `5e6c553`. Voir le journal de B, « Passations ».
