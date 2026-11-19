# STORY-1093 : la comptabilité branchée au hub et à la recette

Status: in-progress

**Complexité :** faible à moyenne (un défaut de configuration dans balance ; un service neuf dans le profil de recette,
l'audience de l'IdP, une garde étendue ; une suite de recette sans doublure)

**Épic :** EPIC-111 (le socle de la comptabilité), EPIC-114 (grand livre et balance dérivée : la 5e origine du hub)
**Dépôts :** `MoneyVibesGroup/prospera-balance-service` ; `MoneyVibesGroup/prospera-recette`
**Plage :** reçue de A (STORY-1080 → 1084, 1093 ; plan du lot 4 §3, ligne 9). Identifiant réservé par le plan.
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 9 : **Docker : recette** (pas la recette
croisée complète : elle est jouée une seule fois, à 1080). Fini quand : `comptabilite-service` dans le défaut
d'`INGESTION_SOURCE_SYSTEMS` (balance) ; le service dans `docker-compose.recette.yml` (port 3420, MongoDB en jeu de
répliques, Kafka, `AUTH_*`, `DOSSIER_SERVICE_URL`, `DOCUMENT_SERVICE_URL`) et dans l'`AUTH_AUDIENCE` de l'IdP ; une
balance d'origine `comptabilite` est ingérée.
**Dépend de :** STORY-975 (livrée). **Débloque :** STORY-1080.
**Sources de la demande :** les deux demandes de B à A du 17/11 (STORY-967, « Pour la suite » ; D-967-11), reprises
par A au point 4 (a) et (b) de son ordre du lot 4, puis par ce plan.

**Sources lues :** plan du lot 4 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état, passations,
pièges, D-975-11) ; journaux de A (passation, pièges du lot 3 : CRLF, `git archive`, recette sans `--build`), C et D
(aucune demande neuve à B qui passe avant ; les informations de D visent 1080 et la remplaçante `comptes`) ; fiches
STORY-921 (D-921-1 → 6), 929 (D-929-2, D-929-3, pièges `COMPOSE_PARALLEL_LIMIT=2`, mémoire, `ECONNRESET`), 958
(D-958-1 port 3420, D-958-8), 967 (D-967-11, preuve sur pile), 975, 1082 (D-1082-8, `DOSSIER_SERVICE_URL` dans
balance) ; code sur `origin/dev` : balance `d43fbe4` (`config/configuration.ts`, `env.validation.ts`,
`INTEGRATION.md`), recette `f7944dc` (profil, garde du profil, `cabinet-moteur`, `atelier-balance`, `zone-franche`,
`docker-compose.fiscal.yml`), comptabilité `ddc9fa5` (`docker-compose.yml`, `.env.example`, routes : ouverture,
écritures, validation, publications ; `source-des-pieces.ts`), document-service `da4ddf2` (`POST /piece-extractions`,
`GET /dossiers/{d}/pieces?pieceId=`) ; le compose racine du poste (non versionné).

---

## Passation constatée (première story de B sur la recette, D-L4-1)

- **recette** (`prospera-recette`) : `origin/dev` = **`f7944dc`** (STORY-929), le commit nommé par A ; **rien n'a
  bougé depuis**. Le checkout du poste était sur `dev` à `2daea0e`, 8 commits derrière, propre : avance rapide, branche
  `MNV-1093` partie d'`origin/dev`.

## Ce qui existait déjà (relu avant la fiche)

- **balance** : l'origine `comptabilite` est servie depuis STORY-921 ; l'allowlist des émetteurs
  (`INGESTION_SOURCE_SYSTEMS`, repli de C8) a pour défaut `ComptabiliteServiceIMF,ComptabiliteServiceDistributeur,
  microfinance-service` : **sans `comptabilite-service`**, le nom sous lequel la comptabilité publie (D-967-11). Une
  pile qui ne pose pas la variable rejette donc toute balance du grand livre `SOURCE_SYSTEM_INCONNU`. Aucun test ne
  fige ce défaut.
- **Le compose racine du poste** (non versionné) pose lui-même la variable sur balance,
  `${BALANCE_INGESTION_SOURCE_SYSTEMS:-ComptabiliteServiceIMF,ComptabiliteServiceDistributeur}` : sur la pile de
  recette, le défaut du service n'est donc **jamais** lu. Il pose aussi l'`AUTH_AUDIENCE` de l'IdP (dix audiences, sans
  la comptabilité) et ne déclare pas `comptabilite-service`. Son MongoDB `mongo` est déjà en jeu de répliques (`rs0`).
- **recette** : le profil ne pose que des réglages, gardé par `profil-de-recette.spec.ts` (aucun volume, aucun script
  ni client de base de données, liste fermée des services). `fiscal-service` vit à part (`docker-compose.fiscal.yml`,
  chargé par `RECETTE_SURCOUCHES` APRÈS le profil), avec son MongoDB dédié et une audience d'IdP redéfinie.
- **comptabilité** : sa pile propre (`docker-compose.yml` du dépôt) pose `NODE_ENV`, `PORT`, `MONGODB_URI`
  (jeu de répliques requis), `KAFKA_BROKERS`, `KAFKA_ESPACE` (sa variable d'espace), `AUTH_JWKS_URI`, `AUTH_ISSUER`,
  `AUTH_AUDIENCE`, `AUTH_SERVICE_URL` (`/moi/droits`), `DOSSIER_SERVICE_URL`, `DOCUMENT_SERVICE_URL` (préfixe `/api/v1`
  compris), la sonde `/api/v1/health`. Toute écriture cite une pièce que `document-service` sert dans le dossier
  (`PIECE_JUSTIFICATIVE_INCONNUE` sinon) : la preuve sans doublure doit en déposer une vraie.

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|---|---|---|
| AC-1 | balance : `comptabilite-service` est dans le défaut de l'allowlist ; une variable posée le remplace (inchangé), vide ⇒ aucun émetteur | unitaires (valeur attendue écrite dans le test), mutation |
| AC-2 | recette : `comptabilite-service` déclaré au profil, réglages seulement : port 3420, MongoDB en jeu de répliques (celui de la pile), Kafka, `AUTH_*`, `DOSSIER_SERVICE_URL`, `DOCUMENT_SERVICE_URL`, espace de la pile | garde du profil étendue, mutations ; `docker compose up` sain |
| AC-3 | l'IdP de la recette émet l'audience `comptabilite-service`, avec ou sans la surcouche fiscale | garde ; jeton lu par la recette |
| AC-4 | une balance d'origine `comptabilite`, publiée par le vrai `comptabilite-service`, est **ingérée** par le vrai `balance-service` sur la pile de recette, sans doublure ; rejouée, rien de doublé | suite `comptabilite.recette.ts` sur pile `grp-b` |

## Décisions (recommandations appliquées, contestables)

- **D-1093-1 — `comptabilite-service` s'AJOUTE au défaut, rien n'en sort.** Les trois émetteurs existants restent
  (aucun n'est renommé) ; une variable posée remplace le défaut comme avant (fail-closed si vide). Un test fige les
  trois cas, valeurs écrites dans le test.
- **D-1093-2 — Le JSON Schema `balance.submitted.v1` n'est pas touché.** Ajouter `comptabilite-service` à ses
  `examples` serait documentaire, mais la comptabilité en garde une copie à l'octet
  (`test/fixtures/balance-service/`, `ORIGINE.json`) qui deviendrait en retard. `INTEGRATION.md` §1 ter le dit.
- **D-1093-3 — La comptabilité entre DANS le profil (`docker-compose.recette.yml`), comme le plan l'écrit, et non
  dans une surcouche à part comme fiscal.** Elle n'apporte aucun état : sa base `comptabilite_service` loge dans le
  MongoDB de la pile, déjà en jeu de répliques — aucun MongoDB dédié (il faudrait un volume et un `rs.initiate` par
  `mongosh`, que la garde interdit, à juste titre). La garde ne disparaît pas : elle admet ce service avec ses clés,
  ses variables et ses dépendances exactes.
- **D-1093-4 — Levée à la demande (profil `recette`).** La pile de base reste à cinq services (`convention.ts`
  inchangée) ; la suite qui la joue fait `up -d comptabilite-service`, comme `cabinet-moteur` pour balance et bilan.
- **D-1093-5 — L'audience de l'IdP : le profil reprend la liste du compose racine et ajoute `comptabilite-service` ;
  la surcouche fiscale, chargée après, la reprend entière avec `fiscal-service`.** Une garde exige « fiscale = profil +
  `fiscal-service` » : sinon, charger la surcouche fiscale retirerait la comptabilité de l'IdP sans un mot.
- **D-1093-6 — balance garde les émetteurs de SON défaut : le profil RETIRE la variable du compose racine
  (`INGESTION_SOURCE_SYSTEMS: !reset null`), il ne la redéfinit pas.** On recette ce qui est livré (le défaut de
  STORY-1093), pas une liste du poste ; une garde interdit toute autre valeur. Exige Compose 2.24 ou plus (`!reset`
  par clé, vérifié par `docker compose config`, Compose 5.7 sur ce poste).
- **D-1093-7 — Port 3420 publié sur la boucle locale** (`127.0.0.1:3420:3420`), comme la pile du dépôt (D-958-1).
- **D-1093-8 — Le cabinet installe `balance` et `comptabilite` par le `PUT` de la console** (plan `CONSOLE_PUT`, qui
  diffère une vérification sans adresse), comme `cabinet-moteur` : `POST /installations` attend D-975-11 et
  `INSTALLATION_SERVICES` (STORY-1080).
- **D-1093-9 — Une suite neuve, `comptabilite.recette.ts`**, et non un ajout à `cabinet-moteur` (que 1080 réécrit) :
  inscription d'un associé, KYC, installation, dossier SARL, exercice 2026 puis axes SN, ouverture au journal, une
  pièce déposée chez le vrai `document-service` (`POST /piece-extractions`), une écriture BQ saisie et validée,
  publication, verdict du hub, lecture au hub, rejeu.
- **D-1093-10 — Images de la preuve depuis `git -c core.autocrlf=false archive`** (D-929-3) : `origin/dev` pour les
  huit services (dont ceux de C et D, sans toucher leurs checkouts), la branche pour balance ; surcouche de contextes
  hors dépôt ; `COMPOSE_PARALLEL_LIMIT=2`.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **balance** : le **défaut** de l'allowlist d'ingestion nomme `comptabilite-service` (comportement : une balance de
  la comptabilité est acceptée sur toute pile qui ne pose pas la variable). Ni route, ni topic, ni schéma changés.
- **recette** (pile partagée par les quatre groupes) : un service de plus au profil (`comptabilite-service`, profil
  `recette`, levé à la demande, port 3420 en boucle locale) ; l'IdP émet une audience de plus ; balance-service ne
  reçoit plus la liste d'émetteurs du compose racine (il lit son défaut) ; `docker-compose.fiscal.yml` reprend
  l'audience. Une pile levée avant ce changement doit être descendue et relancée.

## Preuves

(à compléter)

## Livraison

(à compléter)
