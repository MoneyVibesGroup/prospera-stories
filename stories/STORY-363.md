# STORY-363 : `dossier-service` exige un KYC approuvé — le gate qui manque au seul service sans gate

Status: done

**Epic :** EPIC-043 — Le dossier client, entité de premier rang
**Points :** 3 · **Sprint :** 20 (backend) · **Service :** `prospera-dossier-service` (`:3009`)
⚠️ *Port corrigé le 2026-08-19 : la fiche annonçait `:3013`. Le service écoute bien sur **3009** (`.env.example:9`, `docker compose ps`, et l'OpenAPI vivant `:3009/api/docs-json`). Un port faux envoie à un service qui ne répond pas, et l'échec ne ressemble pas à une erreur de fiche.*
**Origine :** **AD-8** de `architecture/architecture-dossier-service-2026-08-15/ARCHITECTURE-SPINE.md`, arbitrée par le PO le 2026-08-15
**Dépendances :** aucune côté backend. ⚠️ **Contrainte d'ORDRE avec le frontend — voir §Ordre.**

---

## Pourquoi cette story existe

La spine rétroactive de `dossier-service` (2026-08-15) a relevé que le service est **le seul service
métier du programme sans gate d'accès**. Ses guards sont `jwt-auth`, `roles`, `permissions`,
`email-verified`, `ip-throttler` — et il ne consomme que `identity.org.created` et
`identity.membership.changed`. **Ni `kyc.status.changed`, ni `entitlement.changed`.**

Tous les autres portent un `@Requires…Access` (`emailVerified` + KYC `APPROVED` + entitlement
`ACTIVE`). Il fallait savoir si c'était délibéré ou un oubli. **Le PO a tranché le 2026-08-15 :**

> **`emailVerified` + KYC `APPROVED`. Pas d'entitlement.**
>
> Un cabinet doit être **vérifié** pour constituer un portefeuille de sociétés clientes — c'est une
> responsabilité, pas une fonctionnalité. Mais **le dossier n'est pas un module qu'on achète** : le
> gater sur un entitlement supposerait un « module dossier » au catalogue, qui n'existe pas et n'a pas
> de raison d'exister.

## Périmètre

1. **Read-model `OrgKycStatus`** alimenté par `kyc.status.changed`, avec son consumer group isolé et sa
   projection idempotente. ⚡ **Le patron existe à l'identique dans `bilan-service` et
   `balance-service`** (`kyc-status.projection.service.ts` + `kyc-status-consumer.bootstrap.ts`) : il
   est à **copier**, pas à concevoir.
2. **Guard `@RequiresDossierAccess`** = `emailVerified` + KYC `APPROVED`. **Aucune vérification
   d'entitlement.**
3. Application du guard sur les routes **appelées par un humain** — et sur elles seules.

## Critères d'acceptation

- **Étant donné** un cabinet dont le KYC n'est pas `APPROVED` **quand** il appelle `GET /dossiers`
  **alors** le service refuse avec le code machine **`KYC_NOT_APPROVED`**, jamais un `403` nu.
- **Étant donné** un cabinet dont le KYC est `APPROVED` **quand** il crée un dossier **alors** rien ne
  change par rapport à aujourd'hui.
- **Étant donné** un utilisateur dont l'e-mail n'est pas vérifié **quand** il appelle une route de
  dossier **alors** le refus porte `EMAIL_NOT_VERIFIED`, distinct de `KYC_NOT_APPROVED`. ⚠️ Les deux
  motifs doivent être **distinguables par le client** : les confondre reproduirait le défaut relevé en
  FE-017, où « Identifiants invalides » recouvrait tout `ApiError` — un `429` s'y lisait comme un
  mauvais mot de passe.
- ⚠️ **Étant donné** une organisation qui vient d'être créée (`identity.org.created`) **quand** le
  dossier « Mon cabinet » est auto-créé (D1) **alors** la création aboutit **sans passer par le gate**.
  ⛔ **C'est le piège central de cette story** : le KYC n'est jamais `APPROVED` à l'instant de la
  création de l'organisation. Gater ce chemin ferait qu'**aucune organisation ne naîtrait plus jamais
  avec son dossier propre** — et l'échec serait asynchrone, donc silencieux.
- **Étant donné** un `kyc.status.changed` rejoué **quand** la projection s'applique **alors** elle est
  idempotente (marqueur `ProcessedEvent` inséré dans la même transaction).
- **Étant donné** un cabinet approuvé puis **repassé** hors `APPROVED` **quand** il rappelle une route
  **alors** l'accès est refusé — la projection est un **état absolu**, pas un drapeau qui ne monte que.

## ⛔ Ordre — cette story ne peut pas arriver après le sprint 10 frontend

Le **S10 frontend** (FE-059a, FE-060, FE-061, FE-062, FE-066) fait ouvrir un portefeuille et créer des
dossiers. Avec ce gate, **il faut un KYC approuvé pour que ces écrans fonctionnent**.

- ⇒ **À livrer AVANT ou AVEC le S10.** Livrée après, elle casse des écrans qui marchaient : c'est
  exactement le motif d'AP-26 — `kyc-service` a rendu `If-Match` obligatoire sans que la console suive,
  et **toutes les décisions KYC ont rendu `428` pendant une semaine**.
- ⇒ Le **semis de développement** et l'e2e **FE-069** doivent **approuver le KYC avant d'ouvrir un
  dossier**. À répercuter dans `frontend-sprint-status.yaml`.

## Definition of Done

- [ ] Un cabinet non approuvé ne peut créer aucun dossier, et le sait par un code machine stable.
- [ ] « Mon cabinet » naît toujours à la création de l'organisation — **prouvé par un test**, pas
      supposé.
- [ ] Le frontend est prévenu **dans la même livraison** : la story n'est pas `done` tant que le S10
      n'a pas de quoi approuver un KYC dans son parcours.

---

## Progress Tracking

**Statut :** `review` → `done` le 2026-08-20 · **Dépôt :** `prospera-dossier-service`, branche `MNV-363`

### Ce qui a été livré

| Fichier | Rôle |
|---|---|
| `src/common/enums/kyc-status.enum.ts` | miroir de l'enum possédée par `kyc-service` (socle dupliqué, comme dans les 2 jumeaux) |
| `src/modules/acces/events/kyc-events.ts` | contrat `kyc.status.changed` v1 côté **consommateur** |
| `src/modules/acces/schemas/org-kyc-status.schema.ts` | read-model `orgkycstatuses`, index unique `{organizationId}` |
| `src/modules/acces/schemas/processed-kyc-event.schema.ts` | marqueur d'idempotence `processed_kyc_events`, TTL 30 j |
| `src/modules/acces/kyc-enveloppe.util.ts` | validation d'enveloppe — **dans un fichier couvert**, pas dans le bootstrap |
| `src/modules/acces/kyc-status.projection.service.ts` | projection transactionnelle (marqueur **puis** `$set` absolu) |
| `src/modules/acces/kyc-status-consumer.bootstrap.ts` | I/O Kafka pure, group `dossier-kyc`, démarrage dégradé |
| `src/modules/acces/guards/dossier-access.guard.ts` | le gate : `emailVerified` → KYC `APPROVED`, **pas d'entitlement** |
| `src/common/decorators/requires-dossier-access.decorator.ts` | `@RequiresDossierAccess()` (métadonnée pure) |
| `src/modules/acces/acces.module.ts` | module dédié ; `AppModule` câble le guard en **6ᵉ** `APP_GUARD` |
| 5 contrôleurs (`dossiers`, `exercices`, `axes`, `journal`, `activite`) | décorateur posé **au niveau de la classe** + 403 documenté en Swagger |
| `config/configuration.ts`, `config/env.validation.ts`, `.env.example` | `KAFKA_KYC_GROUP_ID` (défaut `dossier-kyc`) |

### 4 décisions, dont 3 écarts assumés vs la rédaction

1. **Le décorateur est posé au niveau de la CLASSE, jamais route par route.** La story dit
   « sur les routes appelées par un humain » ; les 15 routes métier le sont toutes, et
   `/health` est le seul contrôleur hors gate (`@Public()`). Une pose par handler laisserait
   la route **suivante** ouverte en silence — la forme exacte du défaut que cette story répare.
   Un test structurel (`dossier-access.invariant.spec.ts`) refuse le contrôleur n°6 non gardé.
2. **⚠️ Un statut KYC inconnu de l'enum est ACCEPTÉ et projeté tel quel** — l'inverse du choix
   fait pour `identity.membership.changed`, où un statut inconnu fait rejeter le message.
   Ici, rejeter serait **fail-open** : le jour où `kyc-service` ajoute un état (`SUSPENDED`…),
   ignorer le message laisserait l'`APPROVED` précédent en place et l'organisation garderait
   son accès **après** avoir été suspendue. Le guard comparant **strictement** à `APPROVED`,
   accepter la valeur **ferme** la porte. *Ignorer bruyamment n'est le bon défaut que quand
   ignorer refuse.*
3. **Pas de garde de fraîcheur `occurredAt`**, contrairement à `EtatsAmontProjectionService`.
   Vérifié dans le code du producteur : `kyc-service` publie avec `partitionKey = orgId`
   (`kyc-events.service.ts:74`) et son relais d'outbox **bloque la clé** dès qu'un envoi échoue
   (`outbox-relay.service.ts:109`) — l'ordre par organisation est garanti de bout en bout, et
   les deux relying parties qui consomment déjà ce topic s'en passent.
4. **Le booléen de retour de la projection a été retiré après la table de mutations.** La
   version initiale avait un `persister(): Promise<boolean>` dont le seul effet observable était
   une ligne de journal : **la mutation qui inversait ce booléen restait VERTE**, donc aucun
   test ne pouvait garder cette branche. Le refus de rejeu est désormais journalisé là où il est
   décidé, et la mutation rejouée vire au rouge.

### Portes DoD

- **Lint** 0 warning · **build** OK
- **971 tests unitaires** (75 suites), dont **44 neufs** sur `modules/acces`
- **214 tests e2e** (6 suites), dont **11 neufs** (`test/acces-kyc.e2e-spec.ts`)
- **Couverture** 99,23 statements / 93,20 branches / 96,42 functions / 99,25 lines
  (seuils 65/90/90/90) — `modules/acces` et `modules/acces/guards` à **100 %**

### Table de mutations — 18 mutations, 18 rouges (14 au dev + 4 en revue)

| # | Mutation | Spec qui vire au rouge |
|---|---|---|
| M1 | `@RequiresDossierAccess()` retiré de `dossiers.controller.ts` | invariant + e2e |
| M2 | idem sur `activite.controller.ts` | invariant |
| M3 | décorateur déplacé **après** `@Controller(...)` (pose route par route) | invariant |
| M4 | guard fail-**OPEN** quand aucune ligne KYC n'existe | guard + e2e |
| M5 | guard renvoyant le **même code** pour les deux motifs | guard + e2e |
| M6 | garde `ObjectId.isValid` retirée (500 au lieu de 403) | guard |
| M7 | no-op retiré (le gate s'applique sans métadonnée ⇒ `/health` fermé) | guard |
| M8 | `error: 'Forbidden'` retiré (le corps passerait à « FORBIDDEN ») | guard |
| M9 | `session` retirée de l'upsert (projection **hors** transaction) | projection |
| M10 | marqueur écrit **après** le read-model | projection (ordre) |
| M11 | rejeu non ignoré (on poursuit malgré le doublon) | projection |
| M12 | `orgId` non contraint à un `ObjectId` | enveloppe |
| M13 | statut inconnu **rejeté** (le réflexe fail-open de la décision 2) | enveloppe |
| M14 | le gate contamine le chemin Kafka (`identity` connaît `OrgKycStatus`) | invariant |

### Vérification docker — stack NEUVE (`down -v`), producteur RÉEL

Chaîne complète : `auth-service` → `kyc-service` (outbox) → Kafka → `dossier-service`.

1. **Démarrage dégradé** : les 4 consommateurs échouent au boot (`This server does not host this
   topic-partition`), le HTTP reste `up`, et le group `dossier-kyc` rejoint 8 s plus tard avec
   `memberAssignment: {"kyc.status.changed":[0]}`.
2. **⛔ D1 hors gate, prouvé en réel** : `POST /auth/register` crée l'organisation
   `6a86fff6…` ; `dossiers` contient déjà « Cabinet Gate 363 » (`estLeCabinet: true`) alors que
   `orgkycstatuses.countDocuments({}) === 0`. **Le dossier naît pendant que la porte est fermée.**
3. **Porte fermée sans KYC** : `GET /dossiers` et `GET /activite` → `403`, corps
   `{"error":"Forbidden","code":"KYC_NOT_APPROVED"}` — jamais un 403 nu, et `error` vaut bien
   « Forbidden » et non « FORBIDDEN ».
4. **Round-trip réel** : `POST /admin/kyc/{orgId}/approve` (avec `If-Match`) → une ligne
   `orgkycstatuses` `APPROVED` + un marqueur `processed_kyc_events` ⇒ `GET /dossiers` → **200**.
5. **État absolu** : `reject` → la **même** ligne (`_id` identique) bascule `APPROVED → REJECTED`,
   `GET /dossiers` → **403**. Le read-model n'est pas un drapeau qui ne monte que.
6. **Rejeu réel du topic** : offsets du group remis à `--to-earliest`, service redémarré,
   `CURRENT-OFFSET 0 → 2` (les 2 messages **ont** été relus) — et le read-model **n'a pas bougé** :
   `updatedAt` identique à la milliseconde, 2 marqueurs, 1 ligne, statut resté `REJECTED`
   (convergence, pas de retour à `APPROVED`).
7. **⚡ Atomicité prouvée par un échec PROVOQUÉ** : un `collMod` pose un validateur qui refuse
   toute écriture sur `orgkycstatuses`, puis un nouvel `approve` est émis. La projection échoue
   (`MongoServerError: Document failed validation`), Kafka rejoue en boucle — et pendant tout ce
   temps **le marqueur n'est PAS écrit** (2, pas 3) et le statut reste `REJECTED` : **zéro
   orphelin**. Validateur levé ⇒ le rejeu aboutit, marqueur à 3, statut `APPROVED`, porte rouverte.
8. **Les 2 motifs sont distinguables** : e-mail dévérifié + KYC `APPROVED` ⇒
   `code: EMAIL_NOT_VERIFIED` (et non `KYC_NOT_APPROVED`).
9. **`/health` sans jeton** → `200`. **Swagger** : les **15** routes métier documentent
   `KYC_NOT_APPROVED` dans leur `403`, `/health` seule ne le fait pas.

⚠️ **`nest --watch` n'a PAS recompilé** la dernière retouche de `activite.controller.ts` (aucun
« File change detected » ; le fichier était pourtant bien à jour **dans** le conteneur). Le piège
du hot-reload trompeur, une fois de plus : les points 3 à 9 ont été **rejoués après un
`docker compose restart`**, sur l'état final.

### Revue de code — 3 constats, 3 corrigés (commit dédié `MNV-363(revue)`)

1. **⛔ BLOQUANT — le gate s'appropriait un refus qui ne lui appartenait pas.** Un jeton sans
   organisation (`PLATFORM_ADMIN`) recevait `403 KYC_NOT_APPROVED`, ce qui **remplaçait en silence**
   le `400 ORGANISATION_REQUISE` d'`exigerTenant` — code publié dans Swagger, branché côté front — et
   le rendait **inatteignable** sur les 5 contrôleurs. Le motif était en outre **faux** : un opérateur
   plateforme n'a aucune organisation, donc aucun KYC à approuver. ⚡ **Et trois e2e existants
   (`dossiers`, `journal`, `axes`) auraient continué de certifier une réponse morte, en restant
   verts : ils ne câblent pas ce guard.** Le refus est désormais **délégué à `exigerTenant`**, seule
   source du code, du message et du statut ; l'e2e du gate, lui, câble le guard et assère le 400.
   ⤷ `exigerTenant` valide au passage la **forme** de l'identifiant : tous ses appelants la
   convertissent en `ObjectId`, un `tenantId` non convertible produisait un **500** là où le refus est
   la même règle métier.
2. **L'assertion qui verrouillait `fromBeginning: true` était VACANTE.** Le littéral vit aussi dans le
   commentaire qui l'explique, trois lignes plus haut ⇒ `toContain` restait **vert** sur
   `fromBeginning: false`. *Une garde que sa propre documentation satisfait ne garde rien.* Ancrée sur
   la ligne de code (`toMatch(/^\s*fromBeginning: true,$/m)`).
3. **Rien ne vérifiait que le gate est BRANCHÉ.** Retirer son `APP_GUARD` d'`AppModule` laissait lint,
   build, 971 unitaires et 214 e2e **au vert** — aucun test ne monte `AppModule`, les 6 e2e recâblent
   leur chaîne à la main. Le service redevenait « le seul service métier sans gate », en silence
   (motif STORY-173). Trois assertions structurelles couvrent l'`APP_GUARD`, l'import d'`AccesModule`
   et la position en dernier maillon. Au passage, le balayage « aucun consommateur Kafka ne connaît le
   gate » couvre désormais **tous** les modules et non trois (`portefeuille` en hébergeait un).

**4 mutations de vérification, 4 rouges** (M15 gate s'appropriant le 400 · M16 `fromBeginning: false` ·
M17 `APP_GUARD` retiré · M18 `AccesModule` retiré des imports).

### Revue de sécurité — 0 vulnérabilité, 2 commentaires rectifiés

**Aucun constat de confiance ≥ 80.** Vérifié : les 6 contrôleurs recensés (5 gardés au niveau classe,
`health` seul `@Public()`), aucun handler ne surcharge la métadonnée, toutes les branches du guard sont
**fermantes** (user absent, `emailVerified` falsy, `tenantId` invalide, read-model absent, Mongo down,
statut hors enum), `orgId`/`tenantId` n'atteignent un filtre Mongo qu'après `isValid` + conversion (aucun
opérateur ne transite), l'`eventId` est un UUID v4 du producteur (pas de collision provoquable), poison
pill et croissance bornés, et les refus ne fuient ni identifiant ni état interne.

Deux **affirmations trop fortes** dans mes commentaires, corrigées sans changer le comportement :

- **`fromBeginning: true` ne rattrape que ce que le log CONTIENT ENCORE.** « Depuis le début » = depuis
  le plus ancien offset **retenu** : avec la rétention Kafka par défaut (7 j, aucune `retention.ms` au
  compose), une approbation plus ancienne n'existe plus ⇒ le cabinet n'aura **aucune ligne** et sera
  refusé. C'est **fail-closed, jamais une faille**, mais c'est un **risque d'indisponibilité au
  cutover**, partagé avec `bilan-service` et `balance-service`. ⇒ au déploiement : vérifier que la
  fenêtre de rétention couvre l'historique des approbations, sinon amorcer le read-model avant
  d'ouvrir le service.
- **Le fail-closed sur statut inconnu repose sur un DÉFAUT de Mongoose** : `updateOne` n'exécute pas
  les validateurs, donc `enum:` documente sans filtrer. Activer `runValidators` globalement
  transformerait ce fail-closed en **rejeu infini** — écriture en échec à chaque tentative, partition
  bloquée, porte figée pour **toutes** les organisations. Contrainte désormais écrite dans le schéma.

### Vérification docker REJOUÉE sur l'état final (après les 2 commits de revue)

Le correctif n°1 change une branche du guard déjà vérifiée : la vérification a donc été rejouée après
`docker compose restart` (⚠️ `nest --watch` ne recompile pas de façon fiable ici).

- ① cabinet `APPROVED` → `GET /dossiers` **200** ;
- ② **`PLATFORM_ADMIN` (`org: null`) → `400` `ORGANISATION_REQUISE`** — le refus d'origine est bien
  préservé, le gate ne se l'approprie plus (sur `/activite`, le `RolesGuard` refuse avant : 403 sans
  code, comportement pré-existant inchangé) ;
- ③ read-model forcé hors `APPROVED` → **403 `KYC_NOT_APPROVED`** ;
- ④ **statut `SUSPENDED` (inconnu de l'enum) écrit tel quel en base et refermant la porte (403)** — le
  choix fail-closed vérifié dans le vrai Mongo, et pas seulement raisonné ;
- ⑤ `/health` sans jeton → **200**.

### Dettes ouvertes / hors périmètre

- **Aucun entitlement** — décision PO explicite, pas un oubli : il n'existe pas de « module
  dossier » au catalogue.
- **`KAFKA_KYC_GROUP_ID` n'est pas déclarée dans le `docker-compose.yml` racine** (dépôt non
  versionné). Rendue **inoffensive** par le défaut `dossier-kyc` porté par le code — leçon
  STORY-173, appliquée à l'avance.
- **Kafka tourne en `PLAINTEXT` sans ACL** dans le compose racine (`KAFKA_AUTO_CREATE_TOPICS_ENABLE:
  true`, aucun port hôte) : un pied dans le réseau docker permet de forger un `kyc.status.changed` et
  de passer n'importe quelle organisation en `APPROVED`. **Défaut pré-existant**, identique pour
  `bilan-service` et `balance-service` — cette PR en étend le rayon, elle ne l'introduit pas.
- **Rétention Kafka au cutover** (cf. revue de sécurité ci-dessus) : à contrôler au déploiement.
- **Le frontend est prévenu dans la même livraison** : la note de FE-069 dit désormais que le
  parcours doit **approuver le KYC avant d'ouvrir un dossier**, et rappelle que « Mon cabinet »
  naît hors gate. FE-060 avait déjà anticipé le code machine (son AC-10).
