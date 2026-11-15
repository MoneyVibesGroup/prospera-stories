# STORY-930 : Le catalogue sur le socle du moteur

Status: done

**Complexité :** moyenne (un service, un changement de client Kafka, un registre neuf dans la pile)

**Épic :** EPIC-155 (le socle technique du moteur : client Kafka de Confluent, Node 24, registre de schémas)
**Services :** `platform-catalog-service` ; `prospera-recette` (pile de développement)
**Plage :** groupe B, n° 1 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4). Faite par la session
qui a tenu le lot de A, sur consigne de l'utilisateur (A, puis B, puis le seed du catalogue).

---

## Pourquoi

La spine du moteur (`spine-moteur-installation`, 42 AD) adopte **dès maintenant** le client Kafka de Confluent et un
registre de schémas : `kafkajs` n'est plus maintenu, et le contrat d'état publié (STORY-932) doit être vérifiable
par un registre avant d'être figé (jalon du 11/12). Le catalogue est le premier : il produit `entitlement.changed`,
que tous les services lisent.

## Ce qui doit être vrai à la fin (plan §4, n° 1)

| Exigence | Fait |
|---|---|
| `kafkajs` remplacé par `@confluentinc/kafka-javascript` 1.11, interface de `KafkaProducerService` inchangée | oui — couche KafkaJS du client ; `send(topic, messages)` inchangé |
| Node 24 | oui — images `base` et `runtime`, `engines: 24.x` |
| Karapace 6.2 et `@confluentinc/schemaregistry` dans la pile de développement | oui — `prospera-recette/docker-compose.socle.yml` (profil `socle`, :8081) ; client dans `scripts/schemas/registre.mjs` |
| Le schéma de `entitlement.changed` enregistré, compatibilité BACKWARD vérifiée « en CI » | oui, avec un écart nommé (D-930-4) : aucun dépôt n'a de CI ; la vérification est le script `schemas:compatibilite`, qui sort en échec |
| `docker compose up` vert | oui — healthy, Mongo et Kafka `up` |

## Ce qui a été livré

1. **Le client** (`kafka.module.ts`) : `new KafkaJS.Kafka({ kafkaJS: { clientId, brokers } })`.
2. **Le producteur** (`kafka-producer.service.ts`) : mêmes méthodes, mêmes garanties (connexion paresseuse).
3. **Les consommateurs** (identité, abonnements) : `fromBeginning` passe à la création du consommateur. La couche de
   Confluent n'a ni `CRASH` ni `GROUP_JOIN` : librdkafka reprend seul la connexion et le rééquilibrage. Seul
   **l'échec de démarrage** (connexion, abonnement) se relance, avec le même recul exponentiel qu'avant.
4. **La santé** (`kafka.health.ts`) : `listTopics` (borné à 3 s) remplace `describeCluster`, absent de la couche.
5. **Le contrat** `contrat/schemas/entitlement.changed.json` : le payload v2, **modèle fermé**
   (`additionalProperties: false`). Un test (`entitlement-changed.schema.spec.ts`) le confronte aux événements que
   fabrique le **vrai** `EntitlementEventsService` : un champ ajouté à l'événement sans l'être au schéma rougit.
6. **Le registre** : `npm run schemas:enregistrer` (compatibilité BACKWARD par sujet, puis enregistrement) et
   `npm run schemas:compatibilite` (vérifie, n'écrit rien, **sort en code 1** sur une incompatibilité). Sujet
   `entitlement.changed-value` (stratégie TopicNameStrategy). `npm run test:schemas` joue les règles sur Karapace.
7. **La pile** : `docker-compose.socle.yml` dans `prospera-recette` (à part du profil de recette, car Karapace porte un
   état : le topic `_schemas`) ; section du README.
8. **Le Dockerfile** : un stage `verification` (le binding natif se teste sous Node 24, pas sur un poste en Node 25).

## Décisions

- **D-930-1 — Le format sur le fil ne change pas.** Le registre sert le **contrat** (enregistrement, compatibilité),
  pas la sérialisation : JSON nu, clé = `orgId`, **aucun en-tête de registre**. Aucun consommateur n'a donc à changer,
  et aucune annonce de contrat n'est due (section « ⚠ Contrats » du journal de B).
- **D-930-2 — Pas de relance sur un « crash » du consommateur.** La couche de Confluent ne l'expose pas, et
  librdkafka reprend seul. Garder une relance maison aurait doublé la reprise.
- **D-930-3 — Le délai sur un topic créé après l'abonnement est celui de `kafkajs`.** Un consommateur abonné à un
  topic absent le découvre à la relecture des métadonnées : environ 5 minutes (mesuré : 3 min 35 s, sans perte,
  offset 0). `kafkajs` avait le même défaut (`metadataMaxAge` de 300 000 ms). Rien n'est changé ; à revoir si un
  environnement neuf doit consommer plus vite.
- **D-930-4 — « Vérifiée en CI » = un script qui sort en échec.** Aucun dépôt Prospera n'a de CI (pas de
  `.github/workflows`). Créer l'infrastructure de CI n'est pas l'objet de la story. `schemas:compatibilite` est la
  vérification à brancher le jour où une CI existera ; sa mutation est prouvée (schéma rendu incompatible ⇒ code 1).
- **D-930-5 — `test:schemas` interroge l'API REST du registre**, pas le client : `@confluentinc/schemaregistry` tire
  des dépendances ESM que Jest (CommonJS) ne charge pas. Le client est exercé par le script.

## Preuves (2026-11-15)

- Image `verification` (Node 24.22) : **1050/1050** tests unitaires, lint des fichiers touchés, `tsc --noEmit` et
  build verts.
- `docker compose -p grp-b … up --build platform-catalog-service karapace` : catalogue et Karapace **healthy** ;
  `/api/v1/health` : MongoDB et Kafka `up`. Les deux consommateurs s'abonnent (journaux).
- **Producteur** : un événement d'outbox `PENDING` passe `SENT` ; relu sur `entitlement.changed` avec la clé `orgId`
  et le JSON nu.
- **Consommateur** : un message illisible publié sur `identity.org.created` (topic absent à l'abonnement) est consommé
  et écarté (`JSON_ILLISIBLE`), sans perte.
- **Registre** : `schemas:compatibilite` sur registre vide ⇒ nouveau sujet ; `schemas:enregistrer` ⇒ id 1 ;
  `schemas:compatibilite` ⇒ compatible BACKWARD ; **mutation** (propriété requise ajoutée) ⇒ INCOMPATIBLE, **code 1**.
  `test:schemas` : 4/4 (ajout facultatif accepté ; requis ajouté, type changé, propriété retirée refusés).
- Pile descendue (`down -v`).

## PR

- `prospera-platform-catalog-service` **#43** (dev `55bf016`)
- `prospera-recette` **#17** (dev `85d54b8`)
