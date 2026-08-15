---
name: 'dossier-service'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'modules NestJS sur le moule commun Prospera, en relying-party de l''IdP — producteur d''événements, consommateur d''identité'
scope: 'micro-service dossier-service — le Dossier (société cliente d''un cabinet) et son Exercice : identité, pays et type d''entité, deux axes, portée du portefeuille, archivage, attestation de mandat, cycle de vie de l''exercice'
status: 'rétroactive — le service est LIVRÉ, cette spine consigne ce qui a été décidé et nomme ce qui ne l''a pas été'
created: '2026-08-15'
updated: '2026-08-15'
binds:
  - 'TICKET-BACKEND-dossier-client-entite-de-premier-rang.md — 16 blocs A→P, décisions D1→D16, questions Q1→Q12'
  - 'EPIC-043 — STORY-301, 353, 354, 304, 302, 355 (livrées) · 356, 236, 357, 358, 303, 359, 360 (à venir)'
sources:
  - 'prospera-dossier-service/src (code livré — source de vérité de cette spine)'
  - 'prospera-stories/architecture-prospera-ecosystem-2026-07-04.md (v1.4, AD-P13 / AD-P14)'
  - 'prospera-stories/stories/STORY-301.md, 353, 354, 304, 302, 355'
companions:
  - 'prospera-stories/tickets/TICKET-BACKEND-dossier-client-entite-de-premier-rang.md'
---

# Architecture Spine — dossier-service

> ⚠️ **Spine RÉTROACTIVE.** Le service est en production depuis le 2026-08-13. Ce document ne propose
> rien : il **consigne** les décisions déjà prises dans le code et les stories, et **nomme
> explicitement celles qui n'ont jamais été prises**. Un point non tranché est marqué `[À TRANCHER]` —
> il ne doit pas être lu comme un choix.
>
> Elle est écrite parce que `dossier-service` est devenu **la racine de l'espace comptable** (AD-P13) :
> le Bilan, l'Atelier et toute la fiscalité en dépendent désormais, et il n'avait pas une ligne
> d'architecture. C'est le défaut que `balance-service` traîne encore.

## Design Paradigm

**Modules NestJS sur le moule commun Prospera** — délibérément **pas** l'hexagonal de
`fiscal-service`. Le service n'a ni moteur de calcul ni adaptateurs interchangeables : il possède un
agrégat, en garde les invariants, et publie des faits. Un noyau pur n'aurait rien à isoler.

| Couche | Répertoire | Contenu |
| --- | --- | --- |
| Entrée | `src/modules/*/` `*.controller.ts` | Contrôleurs NestJS, DTO, guards |
| Application | `src/modules/*/` `*.service.ts` | Cas d'usage, transactions, invariants |
| Persistance | `src/modules/*/schemas/`, `*.repository.ts` | Schémas Mongoose, index, requêtes portées |
| Événements | `src/kafka/`, `src/kafka/outbox/` | Contrats de topics, outbox transactionnelle, relais |
| Read-model entrant | `src/modules/identity/` | Consommation `identity.*`, `org-member` |
| Transverse | `src/common/` | Guards, RBAC, contexte, filtres, décorateurs |

## Inherited Invariants

**Lecture seule.** Un choix local qui les contredirait est un conflit à remonter, pas une dérogation.

| Hérité | Source | Ce qu'il contraint ici |
| --- | --- | --- |
| Relying-party / JWKS | `architecture-prospera-ecosystem` | Validation locale du JWT RS256, aucun appel réseau à `auth-service` sur le chemin chaud |
| `orgId` du jeton signé | `architecture-prospera-ecosystem` | L'isolation ne vient **jamais** du corps de requête ni d'un paramètre d'URL |
| Database-per-service | `architecture-prospera-ecosystem` | `dossier-service` ne lit aucune base d'un autre service |
| Read-models par événements | `architecture-prospera-ecosystem` | L'identité et les rôles sont répliqués localement, jamais interrogés à chaud |
| Carte de propriété | `architecture-prospera-ecosystem` v1.4 | `Dossier` et `Exercice` sont possédés **ici** ; rien d'autre ne l'est |
| **AD-P13** — le dossier est l'unité de travail | `architecture-prospera-ecosystem` v1.4 | Le JWT porte l'organisation, **jamais** le dossier |
| **AD-P14** — l'exercice appartient au dossier | `architecture-prospera-ecosystem` v1.4 | `balance-service` et `bilan-service` en sont des read-models |
| Outbox transactionnelle | STORY-099 | L'événement est publié dans la transaction qui produit le fait |

---

## Invariants & Rules

### AD-1 — Le dossier est l'unité de travail ; l'organisation reste l'unité d'isolation

Deux clés coexistent et **ne doivent jamais être confondues** :

- **`orgId`** — clé d'**isolation** multi-tenant. Vient du **jeton signé**, jamais d'ailleurs.
- **`dossierId`** — clé de **portée** de travail. Vient de l'**URL**, et est **vérifiée contre la
  portée serveur** à chaque appel.

- **Rule:** ne **jamais** dériver le dossier du jeton. L'y mettre ramènerait « une organisation = une
  société » par la porte de derrière — l'invariante que tout ce service démonte.
- **Rule:** toute requête de lecture passe par `filtrePortee()`. Aucun filtrage applicatif après
  chargement : la portée est **dans la requête Mongo**, pas dans une boucle.

### AD-2 — La portée distingue l'administratrice du collaborateur, et le serveur seul l'arbitre

`porteeDepuisJeton()` produit une portée à partir des rôles :

| Rôle | Voit |
| --- | --- |
| `TENANT_ADMIN` | tout le portefeuille actif, **« Mon cabinet » compris** |
| `TENANT_USER` | **uniquement** les dossiers dont il est responsable ou contributeur ; **« Mon cabinet » lui est invisible** (D11) |

- **Rule:** la route de liste **n'a pas de `@Roles`**, et c'est délibéré : y mettre `TENANT_ADMIN`
  rendrait STORY-353 sans objet. **C'est la portée qui distingue, pas le rôle.**
- **Rule:** les compteurs de portefeuille sont **calculés par le serveur**, jamais par le client sur la
  page courante — un collaborateur qui lirait 5 dossiers alors qu'il n'en voit que 2 conclurait qu'on
  lui en cache. *(Porté par STORY-359, non livrée : `GET /dossiers` rend aujourd'hui un tableau simple.)*

### AD-3 — Un dossier hors portée rend `404`, jamais `403`

- **Rule:** le service refuse **délibérément de révéler l'existence** du dossier. Un `403` dirait « il
  existe, mais pas pour vous » — information que le modèle de portée ne veut pas donner.
- **Rule:** l'UI ne doit pas compenser en affichant « accès refusé » : cela déferait le choix côté
  serveur.

### AD-4 — « Mon cabinet » est un dossier comme les autres, sauf sur trois actes

Le cabinet est lui-même une société : il a une balance et un bilan. Il est donc **un dossier**,
auto-créé à la création de l'organisation (D1), porté par un booléen dédié posé **uniquement par le
service**.

- **Rule:** il n'est **ni affectable, ni archivable**, et **invisible d'un collaborateur**.
- **Rule:** ces trois règles vivent dans la **portée serveur**. L'UI ne les compense pas.

### AD-5 — Deux dossiers ne peuvent pas porter le même NIF de société, par index et non par requête

- **Rule:** unicité par **index unique partiel** sur le NIF normalisé, **portée au cabinet**. Un
  `findOne` avant `insert` laisse passer deux créations concurrentes ; l'index ne laisse rien passer.
- **Rule:** le NIF reste **facultatif** (saisie progressive) — d'où le `partialFilterExpression` et un
  champ normalisé qui **n'existe que pour porter l'index**.
- **Rule:** le `409 NIF_DEJA_UTILISE` doit **nommer le dossier existant**. Un 409 générique ferait
  ressaisir quatre étapes à quelqu'un qui a simplement oublié qu'il avait déjà ce client.

### AD-6 — Un seul exercice ouvert par dossier, tenu par un index partiel

- **Rule:** index unique **partiel sur `statut: OUVERT`**. Un index unique **plein** sur `{ dossierId }`
  interdirait le deuxième exercice d'un dossier — l'erreur exacte que le partiel évite.
- **Rule:** l'invariant est **serveur**. L'UI **ne pré-contrôle pas** : elle rend le
  `409 EXERCICE_DEJA_OUVERT` en **nommant** l'exercice bloquant.
- **Rule:** **reprise sur `WriteConflict`** obligatoire — sans elle, deux ouvertures simultanées
  rendent `201` + `500` au lieu de `201` + `409`, sur le seul scénario qui motive l'invariant.
- **Rule:** bornes **libres**. Aucune règle de calendrier inventée : un contrôle « 12 mois » rendrait
  impossible le premier exercice d'une société créée en mars.
- **Rule:** `libelle` et `dureeEnJours` sont **dérivés**, jamais saisissables — whitelist stricte, `400`.

### AD-7 — Un exercice repris en `MIGRATION` naît `CLOS` et ne se rouvre pas

- **Rule:** `dossier-service` **n'a pas à savoir ce qu'est une écriture comptable**. Toute saisie exige
  un exercice ouvert ⇒ **refuser la réouverture suffit**, sans importer de vocabulaire comptable.
- **Rule:** un exercice repris **ne consomme pas la place de l'exercice courant** — sans quoi reprendre
  trois exercices antérieurs empêcherait d'ouvrir l'exercice en cours.

### AD-8 — `[À TRANCHER]` Le service n'a **aucun** gate d'entitlement ni de KYC

**Constat de code, pas décision.** Les guards présents sont `jwt-auth`, `roles`, `permissions`,
`email-verified`, `ip-throttler`. Le service consomme `identity.org.created` et
`identity.membership.changed` — **ni `kyc.status.changed`, ni `entitlement.changed`**.

Tous les autres services métier portent un `@Requires…Access` (`emailVerified` + KYC `APPROVED` +
entitlement `ACTIVE`). C'est **le seul point où `dossier-service` s'écarte du moule commun**.

Deux lectures, et aucune n'est écrite nulle part :

1. **Délibéré** — le dossier est **en amont de tout module** ; le gater fermerait la porte d'entrée
   avant que le cabinet ait pu constituer son portefeuille. Le gate appartiendrait alors aux modules
   consommateurs (`@RequiresBalanceAccess`, `@RequiresBilanAccess`), pas ici.
2. **Oubli** — le service a été écrit vite, sur six stories en deux jours, et le gate n'a pas suivi.

- **Rule provisoire:** ne **rien** ajouter avant l'arbitrage. Poser un gate maintenant fermerait
  peut-être la seule porte par laquelle un cabinet non encore approuvé constitue son dossier.
- **⚠️ À confirmer par le PO.** C'est la question ouverte la plus structurante de ce service.

### AD-9 — `[À TRANCHER]` Le verrou optimiste existe en base et n'est exposé par aucune route

Le schéma porte `version` (« entier monotone — verrou optimiste et ordre citable ») et le repository
sait faire un `updateOne` conditionné à la version lue, avec `$inc`. **Mais aucun contrôleur n'expose
`If-Match`**, et aucune route n'exige de précondition.

- **⚠️ Précédent coûteux :** `kyc-service` a rendu `If-Match` **obligatoire** (STORY-182) sans que le
  client suive ⇒ **toutes les décisions KYC ont rendu `428` pendant une semaine**, sans que rien ne le
  signale. La mécanique est ici **à moitié posée** : le durcir plus tard rejouerait exactement ce
  scénario si le front n'est pas prévenu **dans la même story**.
- **Rule:** si la précondition est adoptée, elle l'est **avec son consommateur nommé**, jamais seule.

### AD-10 — Les événements sont publiés par outbox transactionnelle, partitionnés par `dossierId`

- **Rule:** `partitionKey = dossierId`, **jamais `orgId`** : `orgId` n'ajoute aucune discrimination et
  casserait l'ordre intra-dossier, dont dépendent les projections.
- **Rule:** l'écriture de l'événement est **dans la transaction** qui produit le fait. Aucun publish
  direct depuis un service applicatif.

### AD-11 — `ExerciceTopic` est une énumération SÉPARÉE de `DossierTopic`

- **Rule:** les consommateurs s'abonnent par `Object.values(<Enum>)`. Fusionner les deux abonnerait
  **automatiquement** tout consommateur de `dossier.*` à une charge utile qui n'a pas la forme de
  `DossierEtatV1` ⇒ un read-model de dossier écrit depuis un exercice, `statut` valant `OUVERT` au lieu
  d'`ACTIF`, et **un portefeuille faux mais parfaitement plausible**.
- **Rule:** tout nouveau flux d'événement de ce service **crée sa propre énumération** plutôt que
  d'étendre une existante.

### AD-12 — Aucune garde de version dans les projections consommatrices, et c'est délibéré

Le contrat porte `version`, mais les projections de `balance-service` et `bilan-service` **ne
filtrent pas dessus**.

- **Rule:** les deux voies par lesquelles un message ancien arriverait après un récent sont déjà
  fermées — **ordre intra-partition** (AD-10) et **marqueur d'idempotence** au rejeu.
- **Rule:** ajouter `version: { $lt: … }` sur un `upsert` créerait un **piège réel** : le filtre ne
  matcherait pas, l'upsert tenterait une **insertion**, et l'index unique sur `exerciceId` rendrait un
  `E11000` sur un message parfaitement normal.

### AD-13 — Le journal du dossier est append-only et n'a aucune route de lecture

`dossiers_journal` est écrit sans `timestamps` automatiques (l'horodatage est **porté par la donnée**,
pas par Mongoose).

- **⚠️ TROISIÈME OCCURRENCE DU MÊME DÉFAUT DANS LE PROGRAMME.** `admin_audit_logs` (STORY-144) puis
  `profils_societe_audit` (STORY-079) ont été écrits sans lecture, et sont restés invisibles jusqu'à ce
  qu'un audit les rattrape — au prix d'une story chacun (STORY-294, STORY-360).
- **Rule:** **une écriture sans lecture ne se signale nulle part.** Toute nouvelle collection d'audit
  de ce service **nomme son consommateur dans la même story**. *(STORY-360 + FE-068 le font ; c'est le
  correctif du patron, pas une exception.)*

---

## Consistency Conventions

| Sujet | Convention |
| --- | --- |
| Collections | `dossiers`, `dossiers_journal`, `exercices` — **`snake_case` explicite**, jamais le pluriel implicite de Mongoose |
| Erreurs métier | Code machine stable (`NIF_DEJA_UTILISE`, `EXERCICE_DEJA_OUVERT`, `DOSSIER_ARCHIVE`) **plus** un message traduit. Le client s'appuie sur le code, jamais sur le message |
| Dates | Bornes normalisées à **minuit UTC**. Aucune borne locale persistée |
| Absence hors portée | `404`, jamais `403` (AD-3) |
| Champs dérivés | Rejetés en écriture par whitelist stricte ⇒ `400` |
| Concurrence | Reprise sur `WriteConflict` sur tout chemin protégé par un index unique |

## Stack

NestJS · MongoDB (base propre, `database-per-service`) · Kafka (producteur `dossier.*` /
`dossier.exercice.*`, consommateur `identity.*`) · JWT RS256 en relying-party via JWKS.
Pas de Redis, pas de stockage objet, **pas de producteur d'e-mail** : ce service ne notifie personne.

## Structural Seed

### Entités

| Entité | Clé | Notes |
| --- | --- | --- |
| `Dossier` | `_id`, portée `orgId` | raison sociale, forme juridique, NIF (facultatif) + NIF normalisé (index), RCCM, CNSS, pays, type d'entité, devise, objet social, capital, `actionnaires[]`, **`dirigeants[]`** (`nom`, `fonction`, `nif`), 2 axes (système comptable, régime fiscal), `responsableUserId`, `contributeursUserIds[]`, statut, archivage, `version` |
| `Exercice` | `_id`, `dossierId` | bornes (minuit UTC), `statut`, `origine` (`NORMAL` \| `MIGRATION`), clôture/réouverture attribuées |
| `DossierJournalEntry` | append-only | acteur, action, date portée par la donnée, charge utile |
| `OrgMember` | read-model | alimenté par `identity.membership.changed` |
| `OutboxEvent` | — | publication transactionnelle, relais séparé |

⚠️ **`dirigeants[]` est de la donnée d'identité, jamais un contribuable.** Voir
`TICKET-BACKEND-dirigeants-et-associes-hors-regime-salarial.md` : le module fiscal fonde sa base de
rémunération « par salarié », et un gérant majoritaire n'en est pas un. Le dirigeant est **connu du
système ici**, et **jamais calculé** là-bas.

### Surface HTTP

```
GET    /api/v1/dossiers                              portée par le jeton, actifs seulement
POST   /api/v1/dossiers                              TENANT_ADMIN
GET    /api/v1/dossiers/:id                          y compris archivé
PATCH  /api/v1/dossiers/:id/affectation              TENANT_ADMIN
POST   /api/v1/dossiers/:id/archiver | /reactiver
GET    /api/v1/dossiers/:dossierId/exercices
POST   /api/v1/dossiers/:dossierId/exercices
POST   /api/v1/dossiers/:dossierId/exercices/:exId/clore
POST   /api/v1/dossiers/:dossierId/exercices/:exId/rouvrir    TENANT_ADMIN, motif obligatoire
```

⚠️ Les routes d'exercice sont montées sous `dossiers/:dossierId/exercices` **précisément pour ne pas
entrer en collision** avec le `@Get(':id')` des dossiers.

## Capability → Architecture Map

| Capacité | Où | AD |
| --- | --- | --- |
| Portefeuille et portée | `modules/dossiers` + `portee.util` | AD-1, AD-2, AD-3, AD-4 |
| Création, identité, 2 axes, mandat | `modules/dossiers` | AD-5 |
| Cycle de vie de l'exercice | `modules/exercices` | AD-6, AD-7 |
| Propagation vers balance / bilan | `kafka/outbox` | AD-10, AD-11, AD-12 |
| Traçabilité | `dossiers_journal` | AD-13 |
| Accès | `common/guards` | **AD-8 `[À TRANCHER]`** |
| Concurrence | `dossiers.repository` | **AD-9 `[À TRANCHER]`** |

## Deferred

| Différé | Pourquoi | Où il revient |
| --- | --- | --- |
| Pagination et compteurs servis | Le portefeuille rend un tableau simple ; `GET /dossiers` le déclare dans son `@ApiOperation` | STORY-359 · FE-059b |
| Multi-implantation (N pays par dossier) | v1 **mono-pays**, durci volontairement | Module Fiscalité |
| Rattachement des pièces au dossier | `dossierId` **optionnel** : les pièces KYC du cabinet n'appartiennent à aucun dossier | STORY-358 · FE-064 |
| Axes datés par exercice | Un changement de régime rétroactif réécrirait une liasse validée | STORY-303 · FE-065 |
| Lecture du journal | Écrit, non exposé (AD-13) | STORY-360 · FE-068 |
| Migration de `profil-societe` depuis `balance-service` | Deux propriétaires déclarés tant qu'elle n'est pas faite | STORY-356 / 357 |

## ⛔ Le risque ouvert le plus sérieux, à cette date

**La bascule de l'exercice n'est pas terminée.** Les read-models sont posés chez `balance-service` et
`bilan-service`, et **rien ne les lit encore** — délibérément : la projection doit converger *avant*
que STORY-236 et STORY-357 en dépendent, sinon elles démarreraient sur un read-model vide pour tous
les dossiers antérieurs.

Mais dans l'intervalle, **`bilan-service` expose toujours `POST /bilan/exercices`** et
`balance-service` garde son `ExerciceAtelier`. **Il existe donc deux écritures possibles pour un même
fait**, et la question « l'exercice 2023 est-il clos ? » peut encore recevoir deux réponses.

⇒ Tant que **STORY-356 / 236 / 357** ne sont pas livrées, aucun écran neuf ne doit écrire un exercice
ailleurs qu'ici.
