# STORY-1030 : Le squelette de `reseau-service` sur la pile du moteur

Status: done

**Complexité :** moyenne (un service neuf : socle, un module, gate, profil, câblage)

**Épic :** EPIC-044 (socle `reseau-service`, capacité partagée et cloisonnement)
**Dépôt :** `MoneyVibesGroup/reseau-service` (existant, privé, **vide** au 2026-11-16)
**Plage :** groupe D, n° 1 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5).

---

## Pourquoi

`reseau` répond à « où l'entreprise est présente, qui y répond, et jusqu'où va son autorité ». Sa publication de la
portée (`reseau.portee.changed@1`, jalon du 27/11) est attendue par C-1004, puis par le distributeur. Les onze stories
suivantes de D se posent sur ce dépôt : il doit naître **sur la pile du moteur** (pas de migration à refaire),
**gardé dès le premier commit**, et capable de **démarrer sans le bus**.

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 1)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | `main` (premier commit : README) et `dev` partie de `main` ; le code arrive sur `dev` par une PR « Rebase and merge » | `main` dc44bbf, `dev` 80a4a29, PR #1 |
| AC-2 | Pile du moteur : Node 24, NestJS 11, Mongoose 8, MongoDB 8.0 en jeu de répliques, `@confluentinc/kafka-javascript` ~1.11, aucun `kafkajs` | `pile-du-moteur.invariant.spec.ts` |
| AC-3 | Un module `reseau` sous `src/modules/reseau/`, manifeste **copié à l'octet** depuis `manifestes/reseau.manifest.ts`, empreinte notée et gardée | garde d'empreinte ; mutation d'un octet ⇒ rouge |
| AC-4 | Gate du module (C2) : sans droit `ACTIVE`, **403 `RESEAU_NOT_ENTITLED`** sans donnée (absent, `SUSPENDED`, `REVOKED`, autre organisation, jeton sans organisation, droit d'un autre module) ; échéance passée ⇒ lecture seule | unitaires de la garde, e2e |
| AC-5 | Profil (C10) : le service porte `profiles: ['reseau']`, le socle n'en a pas ; `docker compose --profile reseau up` sain | pile `grp-d` réelle |
| AC-6 | **Démarrage dégradé sans Kafka** : le HTTP répond, la santé nomme Kafka ; le retour du broker rend la santé verte sans redémarrage | pile réelle, Kafka arrêté |
| AC-7 | Port fixé : **3419** | compose, configuration, invariant |
| AC-8 | Garde de câblage : `AppModule` se résout entier ; chaîne d'`APP_GUARD` assertée en présence et en ordre | deux invariants |

## Décisions retenues par défaut (contestables)

- **D-1030-1 — Le socle de `prospera-sinistres-service` est le gabarit**, comme le plan le demande (pile de
  référence). Repris tel quel : configuration validée, contexte de requête, journal, limite de débit, santé, client
  Kafka de Confluent (création du topic avant l'abonnement, `metadataMaxAge` 10 s), relying party RS256/JWKS, filtre
  d'exceptions, refus nommés, horloge. Retiré : les deux modules de C, et l'invariant « un module n'importe pas un
  autre » (`reseau` est seul dans son dépôt).
- **D-1030-2 — La garde lit l'état du module par le port `EtatDesModules`, alimenté par `entitlement.changed`**,
  comme sinistres (D-980-2). La garde partagée de l'état publié (`garde-etat-publie-v1`) est en double lecture dans
  les services du cabinet (EPIC-159, chez A) ; la bascule de `reseau` changera l'adaptateur du port, pas la garde.
- **D-1030-3 — La garde du module est posée ici ; le KYC y entre avec STORY-1031.** La spine (AD-10) veut
  `emailVerified` + KYC `APPROVED` + droit `ACTIVE`. Le droit est le patron éprouvé de sinistres : le reprendre ici
  plutôt que de livrer un squelette sans garde. Le KYC demande son read-model (`kyc.status.changed`) : il arrive avec
  le reste des read-models en 1031.
- **D-1030-4 — Un compose dans le dépôt**, projet `grp-d`, socle sans profil, seul le port du service publié. L'entrée
  du service dans la pile de recette sera une demande à A quand une recette croisée en aura besoin.
- **D-1030-5 — Pas d'outbox dans le squelette** : elle arrive avec 1031 (« outbox transactionnelle »), en même temps
  que le premier écrivain qui s'en sert.
- **D-1030-6 — L'état des modules est une donnée du socle** (`socle_etat_des_modules`, `socle_evenements_traites`).
- **D-1030-7 — Une route sans donnée métier** : `GET /api/v1/reseau/module` rend `{ module, version, organisationId,
  lectureSeule }`. Elle prouve la garde de bout en bout. Aucune autre route avant les stories qui les portent.
- **D-1030-8 — Port 3419.** Pris : 3401 → 3418 (centrale, apprentissage, agent, reprise, connecteurs, IMF, cœur SFD,
  cœur fictif, sinistres, liaison-assureur, assureur fictif, les cinq services du distributeur, IA, centrale IA).
  3419 est le premier libre ; le plan le proposait.
- **D-1030-9 — Le nom du dépôt reste `reseau-service`** (D-L2-4), et c'est aussi le nom du paquet, du client Kafka et
  de l'audience attendue.

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **30 suites, 281 tests** unitaires ; **10 e2e** ; build.
- Pile `grp-d` : trois conteneurs `healthy`, `/api/v1/health` 200, route gardée sans jeton 401.
- Démarrage dégradé : Kafka arrêté, service redémarré ⇒ HTTP 503 `kafka: Local: Broker transport failure`, route
  gardée 401 ; Kafka relancé ⇒ 200 en ~8 s.
- Un `entitlement.changed` publié sur la pile apparaît dans `socle_etat_des_modules` en ~1 s.
- Mutation : un octet ajouté au manifeste ⇒ `pile-du-moteur.invariant.spec.ts` 1 en échec sur 11.
- Recette sur image reconstruite depuis `origin/dev` (80a4a29), volumes neufs : `healthy`, santé 200.

## Ce qui reste hors de cette story

- KYC, read-model `identity.*`, cloisonnement par `orgId` du jeton dans les dépôts, outbox : **STORY-1031**.
- « Rebase and merge » seul sur le dépôt : **geste de l'utilisateur** (la fusion par squash et par commit de fusion
  est encore permise au 2026-11-16) ; la session ne fusionne qu'en `--rebase`.
