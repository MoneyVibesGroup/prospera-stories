---
baseline_commit: b9ebd8a11752ea475fc659f911b8913dbd7cef25
---

# STORY-361 : Scaffold `fiscal-service` (:3012), socle transverse et point de santé

Status: done

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

- [x] **AC-1 — Boot réel.** `docker compose up` à la racine démarre `fiscal-service` sur `:3012` ;
      `GET /api/v1/health` répond `200` quand Mongo/rs0, Kafka et Redis sont disponibles.
- [x] **AC-2 — Démarrage dégradé Kafka.** Kafka absent au boot ne tue pas le processus HTTP ; le
      health expose `kafka: down` et redevient sain après reconnexion.
- [x] **AC-3 — RS256/JWKS local.** Un JWT RS256 valide, d'issuer attendu et destiné à
      `fiscal-service`, atteint la route protégée. HS256, audience/issuer erronés et signature altérée
      rendent `401`. Aucune requête à l'IdP n'est faite après résolution de la clé cachée.
- [x] **AC-4 — Pureté du domaine.** Un balayage exécutable de `src/domain/**/*.ts` échoue si un import
      `@nestjs/*` ou `mongoose` y apparaît.
- [x] **AC-5 — Correspondance HTTP fixe.** Les cinq familles d'erreur produisent exactement les
      statuts `400/404/409/422/502` prévus, via une seule fonction partagée.
- [x] **AC-6 — Chaîne de guards réelle.** Un test interroge le vrai `AppModule` et protège présence
      et ordre de la chaîne globale. Un e2e prouve qu'une route non publique est refusée sans jeton.
- [x] **AC-7 — Configuration fail-fast et CORS.** Toute variable requise est validée au boot ; une
      allowlist vide n'active pas CORS, une origine listée seule est acceptée et `*` n'est jamais un
      joker.
- [x] **AC-8 — Aucun métier anticipé.** Le service ne contient aucun schéma d'obligation,
      déclaration, audit, read-model ou paquet ; aucun topic métier n'est consommé ou produit.

## Tâches / Sous-tâches

- [x] **T1 — Créer et brancher le dépôt** (AC-1, AC-8)
  - [x] Créer `prospera-fiscal-service`, initialiser `main`, `dev`, puis `MNV-361` avant le code.
  - [x] Poser l'identité Git `vivianMoneyVibesGroupes` et protéger `.env` dès le premier commit.
- [x] **T2 — Poser le runtime NestJS commun** (AC-1, AC-7, AC-8)
  - [x] Config, logger, bootstrap, Swagger, ValidationPipe, CORS, Dockerfile et tests de bootstrap.
  - [x] DatabaseModule Mongo `fiscal_service`, sans schéma métier.
- [x] **T3 — Poser l'authentification relying-party** (AC-3, AC-6)
  - [x] Stratégie RS256/JWKS cachée et guards globaux dans l'ordre imposé.
  - [x] Route technique protégée et e2e négatifs/positifs.
- [x] **T4 — Poser Kafka, Redis et health** (AC-1, AC-2)
  - [x] Connexions tolérantes au démarrage et indicateurs Mongo/rs0, Kafka, Redis.
  - [x] Tests de panne, reconnexion et arrêt propre.
- [x] **T5 — Poser la frontière hexagonale minimale** (AC-4, AC-5, AC-8)
  - [x] Dossier `domain/` sans framework et invariant de balayage.
  - [x] Correspondance HTTP partagée, exacte et testée.
- [x] **T6 — Intégrer à la stack locale** (AC-1, AC-7)
  - [x] Bloc compose `:3012`, override watch, healthcheck, audience IdP et CORS.
  - [x] Vérifier sur volumes neufs, puis arrêter la stack.
- [x] **T7 — Prouver la DoD** (AC-1 à AC-8)
  - [x] Lint 0, build, test:cov, test:e2e dans une porte unique.
  - [x] Rejouer toutes les mutations ci-dessous, chacune rouge par assertion, puis restaurer.

## Table de mutations obligatoire

| ID | Mutation volontaire | Test qui doit rougir |
|---|---|---|
| M1 | autoriser `HS256` dans la stratégie | options exactes `['RS256']` + e2e rejette le jeton symétrique |
| M2 | retirer la vérification d'audience | e2e audience étrangère |
| M3 | retirer `JwtAuthGuard` du vrai `AppModule` | invariant de câblage + e2e sans jeton |
| M4 | permuter `409` et `422` | spec de correspondance HTTP exacte |
| M5 | importer `@nestjs/common` dans `src/domain/` | balayage de pureté du domaine |
| M6 | propager l'échec Kafka hors du bootstrap | spec de démarrage dégradé |
| M7 | considérer Mongo `up` sans vérifier `rs0` | spec de l'indicateur Mongo |
| M8 | traiter `*` comme origine CORS universelle | spec de l'allowlist CORS |

## Definition of Done

- [x] Dépôt, branches et PR vers `dev` conformes au flux Git PROSPERA.
- [x] `./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0` vert.
- [x] `npm run build`, `npm run test:cov`, `npm run test:e2e` verts ; seuils 65/90/90/90 tenus.
- [x] M1 à M8 réellement rouges puis restaurées.
- [x] Stack Docker neuve : port, health complet, RS256, CORS et démarrage Kafka dégradé prouvés.
- [x] Aucun secret ni `.env` réel lu, affiché ou committé.
- [x] Revue de code, revue de sécurité, re-vérification Docker, rebase-merge et clôture réalisées.

## Notes techniques

- Prendre `microfinance-service` comme source pour le socle récent, mais retirer tout ce qui appartient
  aux stories 295 à 300 et au métier microfinance.
- `Kafka ≠ Redis` : Kafka est le bus inter-services ; Redis n'est ici qu'une dépendance de santé.
- La connexion Kafka doit être relancée en arrière-plan sans rendre le boot fatal.
- La racine `/PROSPERA` n'est pas un dépôt : les ajouts compose/override sont nécessaires à la preuve,
  mais ne peuvent pas entrer dans la PR du service.

## Progress Tracking

**Statut : `done` (2026-09-18).** Story recadrée depuis l'architecture réelle : le périmètre
s'arrête strictement avant les bases d'audit, read-models, gate fiscal et chargeur de paquet. Dépôt
privé `MoneyVibesGroup/prospera-fiscal-service` créé ; `main`, `dev`, puis `MNV-361` ont été créées et
poussées avant toute écriture de code. Les branches `docs/MNV-361` et `fiscal-service/MNV-361` sont
alignées.

- 2026-09-17 : socle NestJS livré dans `fiscal-service/MNV-361` : port `3012`, Mongo
  `fiscal_service`/`rs0`, JWT RS256/JWKS caché, chaîne globale de guards mesurée depuis le vrai
  `AppModule`, Kafka tolérant au boot, Redis limité à la santé, CORS explicite, point de santé et
  frontière de domaine sans schéma ni contrat métier anticipé. L'intégration racine
  `docker-compose.yml`, override et CI est locale, la racine PROSPERA n'étant pas versionnée.
- 2026-09-17 : porte unique Portly verte — eslint 0 avertissement, build, **237 tests unitaires**,
  **10 e2e** ; couverture : statements **99,23 %**, branches **90,4 %**, fonctions **98,64 %**,
  lignes **99,15 %**.
- 2026-09-17 : mutations **M1 à M8 réellement jouées**. Chacune a rendu rouge son assertion dédiée
  (options JWT exactes, audience, métadonnées du vrai `AppModule`, statuts 409/422, balayage du
  domaine, boot Kafka, replica set Mongo, wildcard CORS), puis le code a été restauré et la porte
  unique a été rejouée verte.
- 2026-09-17 : vérification Docker sur volumes neufs (`down -v` préalable) verte. Après redémarrage
  du conteneur fiscal : `GET /api/v1/health` → **200**, Mongo `{ setName: "rs0",
  isWritablePrimary: true }`, Kafka/Redis `up`, et `fiscal_service` ne contient **aucune collection**.
  CORS : `http://localhost:3100` reçoit l'en-tête attendu ; une origine étrangère n'en reçoit aucun.
- 2026-09-17 : preuve IdP réelle sans exposer de secret : register **201**, e-mail présent dans
  Mailhog, verify-email **200**, login **200** ; access token `alg=RS256`, audience comprenant
  `fiscal-service`, `emailVerified=true`, puis route technique protégée **200** avec rôle
  `TENANT_ADMIN`. Les e2e rejettent aussi HS256, issuer/audience erronés et signature altérée, et
  prouvent le cache JWKS sans second appel IdP.
- 2026-09-17 : Kafka arrêté puis `fiscal-service` redémarré : processus HTTP vivant et health
  **503** avec `kafka.status=down`, Mongo/Redis restant `up`. Après reprise de Kafka, health revenu
  à **200** avec les trois dépendances `up`. La stack, son réseau et ses volumes de vérification ont
  ensuite été arrêtés et supprimés via Portly.
- 2026-09-17 : commit initial du socle `b666845` poussé sur `fiscal-service/MNV-361` ; PR
  `MoneyVibesGroup/prospera-fiscal-service#1` ouverte vers `dev`. Statut synchronisé à `review` en
  attente des revues APEX de code et de sécurité.
- 2026-09-18 : revue de code Codex `gpt-6-astra` en raisonnement `ultra` : **7 constats majeurs et
  4 mineurs**. Revue de sécurité indépendante, même modèle/effort : **1 constat majeur**, recoupant
  le défaut du stockage natif de `@nestjs/throttler` 6.5.0. Tous les constats sont corrigés : stockage
  par clé de STORY-658, journalisation après fermeture de la réponse de STORY-657, client Redis de
  santé borné sans file hors ligne, audience exactement `fiscal-service`, health e2e avec le vrai
  filtre, invariant AST du domaine, altération binaire réelle de la signature JWT, écoute e2e unique
  sur `127.0.0.1`, hooks d'arrêt et démarrage Compose sans dépendance dure à Kafka.
- 2026-09-18 : table **M1 à M8 rejouée intégralement après revue**, chaque mutation rouge puis
  restaurée. Quatre mutations de correction supplémentaires sont aussi rouges : suppression du
  stockage throttler réel, réactivation de la file Redis, journalisation d'erreur avant le filtre et
  relâchement de l'audience. Porte unique finale verte : eslint 0 avertissement, build, **253 tests
  unitaires**, **10 e2e** ; couverture statements **98,84 %**, branches **91,17 %**, fonctions
  **98,78 %**, lignes **98,74 %**.
- 2026-09-18 : re-vérification Docker sur volumes neufs. Démarrage à froid de Mongo + Redis +
  `fiscal-service` **sans conteneur Kafka** : processus HTTP vivant, health **503** avec Kafka down et
  les deux autres dépendances up ; après ajout du broker, le même conteneur revient à **200**. Redis
  coupé : health **503 en 23 ms**, puis récupération **200 en 22 ms** ; arrêt du service Redis absent
  en **1,15 s**. CORS : origine autorisée **204 avec en-tête**, origine étrangère **204 sans
  en-tête**. Preuve IdP réelle : inscription, e-mail Mailhog, vérification, login, JWT `RS256` avec
  `kid` et audience fiscale, route protégée **200** avec organisation/rôles concordants. Mongo
  confirme `rs0`, zéro collection et zéro document dans `fiscal_service`. La pile, son réseau et ses
  volumes ont ensuite été supprimés via Portly.
- 2026-09-18 : PR `MoneyVibesGroup/prospera-fiscal-service#1` rebase-mergée sur `dev` au commit
  `f953e8e7fc510f13603ced859a56f6686b958496`. Story clôturée et statut synchronisé aux trois
  emplacements BMAD.
