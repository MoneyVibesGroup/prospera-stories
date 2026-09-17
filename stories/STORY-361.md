# STORY-361 : Scaffold `fiscal-service` (:3012), socle transverse et point de santé

Status: ready-for-dev

**Complexité :** high

**Épic :** EPIC-027 — Socle `fiscal-service` et gouvernance du paquet fiscal
**Service :** `fiscal-service` (nouveau)
**Points :** 5 · **Sprint :** S22
**Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** `epics-fiscalite-2026-08-03.md` — AR-01, AR-05, AR-10 ; spine fiscale AD-1 à AD-21.

---

## User Story

En tant qu'**équipe plateforme**, je veux un `fiscal-service` déployé et authentifié, afin que les
capacités fiscales disposent d'un hôte conforme aux invariants de l'écosystème PROSPERA.

## Le fait mesuré

Le service, son dépôt GitHub et sa base n'existent pas encore. Le port `3012` est réservé dans
l'architecture fiscale. Le socle doit être posé avant STORY-295 (base d'audit), STORY-296
(read-models et gate fiscal), STORY-297 (chargeur de paquet) et STORY-536 (paquets de dépôt).

Le précédent de scaffold le plus récent est `microfinance-service`, mais STORY-497 a aussi livré
des read-models, un gate métier et un référentiel. Ces éléments sont **hors de cette story** : les
copier ici anticiperait trois stories distinctes.

## Périmètre inclus

- Projet NestJS 11 / Node 20 / TypeScript strict dans un nouveau dépôt
  `MoneyVibesGroup/prospera-fiscal-service`, avec branches `main`, `dev` et `MNV-361`.
- Port `3012`, préfixe `/api/v1`, Swagger `/api/docs`, Helmet, validation stricte, pino et
  filtres/intercepteurs du socle commun.
- Base Mongo dédiée `fiscal_service`, connectée au replica set `rs0`. Aucun schéma métier.
- Validation locale des JWT RS256 par JWKS caché : issuer et audience `fiscal-service` obligatoires,
  algorithme RS256 imposé, aucune émission de jeton et aucun appel à `auth-service` sur le chemin
  chaud.
- Chaîne globale `Throttler → JwtAuth → EmailVerified → Roles`, mesurée depuis le vrai `AppModule`.
  Une route technique protégée permet de prouver l'authentification sans introduire de métier.
- Client Kafka avec démarrage dégradé : Kafka absent ne tue jamais le processus ; son état est publié
  dans `/api/v1/health`.
- Client Redis utilisé uniquement comme dépendance de santé dans cette story : aucune file BullMQ et
  aucun canal inter-services Redis.
- Health public couvrant Mongo **et l'état du replica set**, Kafka et Redis.
- CORS piloté par `CORS_ALLOWED_ORIGINS`, allowlist explicite, valeur vide = CORS désactivé, jamais `*`.
- Correspondance HTTP centralisée et testée : `400` validation, `404` ressource hors organisation,
  `409` transition interdite, `422` règle métier, `502` intégrité d'artefact.
- Intégration locale au `docker-compose.yml` et à son override : service, hot-reload, healthcheck,
  audience IdP et variables avec défauts. La racine PROSPERA n'étant pas versionnée, ces changements
  sont consignés comme état local non poussé.

## Hors périmètre

- Deuxième base `fiscal_audit`, comptes Mongo et rôles restreints : STORY-295.
- Consumers `identity.*`, `kyc.status.changed`, `entitlement.changed`, read-models et
  `@RequiresFiscalAccess` : STORY-296.
- `ReferentielVersion`, chargement par `artifactUri`, checksum et cache du paquet fiscal : STORY-297.
- Obligations, déclarations, calculs fiscaux, transmission, accusés et paquets de dépôt.
- Outbox et événements `fiscal.*` : ils arrivent avec le premier fait métier persistant.
- Redis/BullMQ pour travaux récurrents : aucune tâche interne ne le justifie dans ce socle.

## Critères d'acceptation

- [ ] **AC-1 — Boot réel.** `docker compose up` à la racine démarre `fiscal-service` sur `:3012` ;
      `GET /api/v1/health` répond `200` quand Mongo/rs0, Kafka et Redis sont disponibles.
- [ ] **AC-2 — Démarrage dégradé Kafka.** Kafka absent au boot ne tue pas le processus HTTP ; le
      health expose `kafka: down` et redevient sain après reconnexion.
- [ ] **AC-3 — RS256/JWKS local.** Un JWT RS256 valide, d'issuer attendu et destiné à
      `fiscal-service`, atteint la route protégée. HS256, audience/issuer erronés et signature altérée
      rendent `401`. Aucune requête à l'IdP n'est faite après résolution de la clé cachée.
- [ ] **AC-4 — Pureté du domaine.** Un balayage exécutable de `src/domain/**/*.ts` échoue si un import
      `@nestjs/*` ou `mongoose` y apparaît.
- [ ] **AC-5 — Correspondance HTTP fixe.** Les cinq familles d'erreur produisent exactement les
      statuts `400/404/409/422/502` prévus, via une seule fonction partagée.
- [ ] **AC-6 — Chaîne de guards réelle.** Un test interroge le vrai `AppModule` et protège présence
      et ordre de la chaîne globale. Un e2e prouve qu'une route non publique est refusée sans jeton.
- [ ] **AC-7 — Configuration fail-fast et CORS.** Toute variable requise est validée au boot ; une
      allowlist vide n'active pas CORS, une origine listée seule est acceptée et `*` n'est jamais un
      joker.
- [ ] **AC-8 — Aucun métier anticipé.** Le service ne contient aucun schéma d'obligation,
      déclaration, audit, read-model ou paquet ; aucun topic métier n'est consommé ou produit.

## Tâches / Sous-tâches

- [ ] **T1 — Créer et brancher le dépôt** (AC-1, AC-8)
  - [ ] Créer `prospera-fiscal-service`, initialiser `main`, `dev`, puis `MNV-361` avant le code.
  - [ ] Poser l'identité Git `vivianMoneyVibesGroupes` et protéger `.env` dès le premier commit.
- [ ] **T2 — Poser le runtime NestJS commun** (AC-1, AC-7, AC-8)
  - [ ] Config, logger, bootstrap, Swagger, ValidationPipe, CORS, Dockerfile et tests de bootstrap.
  - [ ] DatabaseModule Mongo `fiscal_service`, sans schéma métier.
- [ ] **T3 — Poser l'authentification relying-party** (AC-3, AC-6)
  - [ ] Stratégie RS256/JWKS cachée et guards globaux dans l'ordre imposé.
  - [ ] Route technique protégée et e2e négatifs/positifs.
- [ ] **T4 — Poser Kafka, Redis et health** (AC-1, AC-2)
  - [ ] Connexions tolérantes au démarrage et indicateurs Mongo/rs0, Kafka, Redis.
  - [ ] Tests de panne, reconnexion et arrêt propre.
- [ ] **T5 — Poser la frontière hexagonale minimale** (AC-4, AC-5, AC-8)
  - [ ] Dossier `domain/` sans framework et invariant de balayage.
  - [ ] Correspondance HTTP partagée, exacte et testée.
- [ ] **T6 — Intégrer à la stack locale** (AC-1, AC-7)
  - [ ] Bloc compose `:3012`, override watch, healthcheck, audience IdP et CORS.
  - [ ] Vérifier sur volumes neufs, puis arrêter la stack.
- [ ] **T7 — Prouver la DoD** (AC-1 à AC-8)
  - [ ] Lint 0, build, test:cov, test:e2e dans une porte unique.
  - [ ] Rejouer toutes les mutations ci-dessous, chacune rouge par assertion, puis restaurer.

## Table de mutations obligatoire

| ID | Mutation volontaire | Test qui doit rougir |
|---|---|---|
| M1 | autoriser `HS256` dans la stratégie | e2e rejette le jeton symétrique |
| M2 | retirer la vérification d'audience | e2e audience étrangère |
| M3 | retirer `JwtAuthGuard` du vrai `AppModule` | invariant de câblage + e2e sans jeton |
| M4 | permuter `409` et `422` | spec de correspondance HTTP exacte |
| M5 | importer `@nestjs/common` dans `src/domain/` | balayage de pureté du domaine |
| M6 | propager l'échec Kafka hors du bootstrap | spec de démarrage dégradé |
| M7 | considérer Mongo `up` sans vérifier `rs0` | spec de l'indicateur Mongo |
| M8 | traiter `*` comme origine CORS universelle | spec de l'allowlist CORS |

## Definition of Done

- [ ] Dépôt, branches et PR vers `dev` conformes au flux Git PROSPERA.
- [ ] `./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0` vert.
- [ ] `npm run build`, `npm run test:cov`, `npm run test:e2e` verts ; seuils 65/90/90/90 tenus.
- [ ] M1 à M8 réellement rouges puis restaurées.
- [ ] Stack Docker neuve : port, health complet, RS256, CORS et démarrage Kafka dégradé prouvés.
- [ ] Aucun secret ni `.env` réel lu, affiché ou committé.
- [ ] Revue de code, revue de sécurité, re-vérification Docker, rebase-merge et clôture réalisées.

## Notes techniques

- Prendre `microfinance-service` comme source pour le socle récent, mais retirer tout ce qui appartient
  aux stories 295 à 300 et au métier microfinance.
- `Kafka ≠ Redis` : Kafka est le bus inter-services ; Redis n'est ici qu'une dépendance de santé.
- La connexion Kafka doit être relancée en arrière-plan sans rendre le boot fatal.
- La racine `/PROSPERA` n'est pas un dépôt : les ajouts compose/override sont nécessaires à la preuve,
  mais ne peuvent pas entrer dans la PR du service.

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-17).** Story recadrée depuis l'architecture réelle : le dépôt et le
service sont absents ; le périmètre s'arrête strictement avant les bases d'audit, read-models, gate
fiscal et chargeur de paquet. Branche docs `MNV-361` créée avant toute écriture de code.

