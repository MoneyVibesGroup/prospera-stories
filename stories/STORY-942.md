# STORY-942 : auth-service sur le socle ; le rôle métier effectif dans la liste des membres

Status: done

**Complexité :** moyenne (migration du client Kafka, six schémas, une règle partagée entre le jeton et deux listes)

**Épics :** EPIC-155 (le socle partout), EPIC-264 (droits et rôles)
**Dépôt :** `MoneyVibesGroup/prospera-auth-service` (tenu par B depuis la passation de A, `456035f`)
**Plage :** groupe B, n° 2 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

1. **Le socle.** auth-service était le dernier service du moteur sur `kafkajs` (plus maintenu), Node 20 et BullMQ 5.
   Le catalogue (STORY-930), paiement (937) et les services de C (981, 982) sont passés au client de Confluent sous
   Node 24 ; auth-service produit les six événements `identity.*` que lisent tous les autres, sans schéma au
   registre.
2. **Le rôle métier.** Depuis STORY-902, un membre sans `tenantRole` reçoit, dans son jeton, le rôle par défaut de
   son vertical (au cabinet, `TENANT_ADMIN` donne `CAB_ASSOCIE`). La liste des membres ne publiait que `role` (le
   rôle socle) : aucun écran ne pouvait dire qui peut déposer, et la console affichait « sans rôle métier » à un
   associé (ticket `TICKET-BACKEND-role-metier-absent-de-la-reponse-des-membres`, demande de A, bloque FE-115).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 2)

| Exigence | Fait |
|---|---|
| Node 24 | oui : images `base` et `runtime`, `engines`, étage `verification` du Dockerfile |
| Client de Confluent | oui : `@confluentinc/kafka-javascript` ~1.11 par sa couche KafkaJS ; `kafkajs` retiré ; `KafkaProducerService` garde son interface |
| BullMQ 6 | oui : 6.7 ; aucun identifiant de tâche ni `queue.client` dans le code, rien d'autre à changer |
| Schémas `identity.*` au registre, BACKWARD | oui : six schémas fermés, `schemas:enregistrer`, `schemas:compatibilite`, `test:schemas` sur Karapace |
| `identity.org.created` garde son format sur le fil | oui : JSON nu, même clé ; un test confronte au schéma ce que fabrique le vrai `IdentityEventsService` |
| L'API des membres rend le rôle effectif (ticket de A) | oui : `roleMetier` dans `GET /users` et dans le détail d'organisation de la console |

## Ce qui a été livré

1. **Kafka** (`src/kafka/`, `src/health/`, `src/main.ts`) :
   - `new KafkaJS.Kafka({ kafkaJS: { clientId, brokers } })` ;
   - santé : `listTopics` borné à 3 s, parce que `describeCluster` n'existe pas dans la couche KafkaJS ;
   - le round-trip de santé déclare `fromBeginning` et `metadataMaxAge: 10_000` dans la configuration du
     consommateur, et crée son topic **s'il manque** (`listTopics`), avant l'abonnement (règles §1.9) ;
   - la garde des rejets non interceptés reste juste : les erreurs du client de Confluent gardent le préfixe
     `KafkaJS` (`KafkaJSError`, `KafkaJSConnectionError`…).
2. **Schémas** (`contrat/schemas/identity.*.json`) : draft-07, objets fermés, `schemaVersion` = 1. Champs facultatifs :
   `createdByUserId` et `origine` (STORY-938), `vertical`, `logoStorageKey`, `brandColor`.
   - `scripts/schemas/registre.mjs` est la copie du script du catalogue : chaque topic a son sujet `<topic>-value`.
   - `test/schemas.registre-spec.ts` enregistre les six schémas sur des sujets jetables. Sur `identity.org.created`, il
     accepte un ajout facultatif et refuse un champ requis ajouté, `createdByUserId` redevenu requis, un type changé
     et une propriété retirée.
3. **Le rôle métier effectif** :
   - `resoudreRoleMetier(membership, vertical)` (`rbac/tenant-system-roles.ts`) est **la** règle : le rôle attribué,
     sinon le rôle par défaut du vertical, sinon aucun. Le jeton (`AuthService`) et les listes la lisent toutes deux.
   - `TenantRolesService.rolesMetierEffectifs(org, vertical, membres)` rend, pour chaque membre :
     - `{ code, libelle, origine: ATTRIBUE | PAR_DEFAUT, droits }`, avec les droits de `permissionsFor` (socle,
       surcharge de l'organisation, rôle personnalisé de **cette** organisation, comme le jeton) ;
     - `null` si le membre n'a pas de rôle métier.

     Chaque rôle distinct n'est lu qu'une fois.
   - `GET /users` et `GET /admin/organizations/{id}` publient `roleMetier`, décoré pour l'OpenAPI
     (`RoleMetierEffectifDto`). `tenantRole` reste inchangé dans la console.

## Preuves

Code : **auth #39**, `08fc1a0` sur `dev`.

- **Node 24** (étage `verification`, export du commit par `git archive`) :
  - **94/94 suites, 1289/1289** ; `tsc` et build verts ; lint des fichiers touchés vert ;
  - une erreur de lint préexistante dans `permission-catalog.ts`, sur `dev` et dans un fichier que la story ne touche
    pas, n'a pas été corrigée ;
  - au premier passage, `sm-1.invariant.spec.ts` ne trouvait ni `test/` ni `.env.example` dans l'image : le
    `.dockerignore` excluait `test/` (même piège que paiement au lot 1). Les deux sont maintenant dans l'étage.
- **`docker compose up`** (projet `grp-b-942`, pile neuve, image `runtime` de la branche) :
  - `healthy`, avec `mongodb`, `redis` et `kafka` `up` ;
  - le round-trip Kafka de santé passe en environ 6 s ;
  - MinIO n'a pas été levé : `minio/minio` n'est plus servi par Docker Hub (voir « Pièges »). auth-service démarre
    sans, le bucket du logo est best-effort.
- **En direct** (`GET /users`, compte de démonstration) :
  - critère 1 : l'associé sans `tenantRole` sort `CAB_ASSOCIE`, `PAR_DEFAUT`, avec les droits de son jeton ;
  - critère 2 : un collaborateur invité, puis `CAB_ASSOCIE` attribué, sort `ATTRIBUE` ;
  - critère 3 : après la surcharge qui retire `deposer` à `CAB_ASSOCIE`, `deposer` n'est plus dans les droits publiés
    des deux membres ;
  - le détail d'organisation de la console publie le même `roleMetier`, alors que `tenantRole` est absent pour
    l'associé.
- **Le fil** : les cinq messages réels (`identity.org.created` d'une inscription, `user.registered`,
  `membership.changed`) ont la même forme qu'avant et sont **conformes** aux schémas (Ajv).
- **Karapace 6.2** :
  - `schemas:enregistrer` : six sujets créés (ids 1 → 6) ;
  - `schemas:compatibilite` : code 0 ;
  - `test:schemas` : **12/12**.
- **Mutations**, chacune rougit sur l'assertion :
  - le repli « par défaut » retiré de `resoudreRoleMetier` ⇒ 6 tests rouges, dont le critère 1 ;
  - la surcharge ignorée (droits pris dans le socle) ⇒ le critère 3 rouge ;
  - `createdByUserId` rendu requis au schéma ⇒ 2 tests rouges.

## Décisions

- **D-942-1 — Tous les droits de tenant, pas seulement `fiscalite:*`.** Le ticket demande les droits `fiscalite:*`
  « si possible ». Publier tous les droits effectifs, ceux que porte le jeton, sert aussi le distributeur et les
  rôles composés. L'écran filtre.
- **D-942-2 — `roleMetier: null` plutôt qu'absent.** Un membre sans rôle métier est un état que l'écran doit
  afficher. Le champ est absent seulement là où la liste ne le calcule pas : l'invitation (`POST /users`) et la mise
  à jour (`PATCH /users/:id`).
- **D-942-3 — Une seule règle, lue par le jeton et par la liste.** Une deuxième copie de la règle aurait recréé
  l'écart que le ticket décrit.
- **D-942-4 — Le round-trip de santé est gardé.** Il reste un diagnostic en tâche de fond qui ne bloque jamais le
  démarrage ; il est migré et non supprimé. Le supprimer reste une décision ouverte depuis STORY-022.
- **D-942-6 — Karapace ne garde pas tout.** Karapace 6.2 tient pour compatible BACKWARD un schéma qui rend
  requis un champ facultatif déjà déclaré (constaté au gate). Pour `createdByUserId`, la garde est donc le test
  unitaire. Le test du registre documente la limite au lieu de la cacher.
- **D-942-5 — Les schémas décrivent le fil tel qu'il est.** Aucun champ n'est renommé ni ajouté au payload. Les
  objets sont fermés : un champ ajouté au code sans l'être au schéma fait rougir `identity-events.schema.spec.ts`.

## Suite

- STORY-948 : la naissance d'une organisation et l'identité de la Reprise (catalogue, auth).
- STORY-949 : les droits hors du jeton, étapes 1 et 2 (`GET /moi/droits`). Elle s'appuiera sur
  `rolesMetierEffectifs`.
