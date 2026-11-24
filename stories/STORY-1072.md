# STORY-1072 : le cabinet prévenu par e-mail du renvoi de son dossier KYC — il lit le mot de l'opérateur et le motif de chaque pièce

Status: done (2026-11-24)

**Demande de :** groupe B, STORY-1103 (prospera-stories #805 ; journal de B, « Demandes aux autres groupes » : « → D
(2026-11-24, STORY-1103) : consommer `kyc.correction.requested@1` pour prévenir le cabinet ») · **Dépôts :**
`prospera-notification-service` (tenu par D depuis le lot 3, D-L3-3), `prospera-expert-comptable` (sans titulaire ; D le
porte le temps de cette story, Q-D-13, choix par défaut) · **Plage :** groupe D, placée au lot 6 amendé
(`PLAN-LOT-6-2026-11-23.md` §6, amendement du 24/11 soir : « D'abord STORY-1072 »), avant 1076 → 1075 (bilan).
**Dépend de :** STORY-1103 (B : `kyc.correction.requested@1` publié par l'outbox de `kyc-service`, kyc #29, `dev`
`9cef9cb`), STORY-590 (les trois e-mails KYC partent par la route directe de `notification`), STORY-021 (le consommateur
de `kyc.status.changed` dans `expert-comptable`), STORY-702 (la supervision des consommateurs).
**Ne touche pas :** `kyc-service` (dépôt de B) : il est lu sur `origin/dev` et son image est construite par `git
archive` pour la preuve, son checkout n'est pas touché.

**Sources :** fiche `stories/STORY-1103.md` (§3 « Le cabinet est prévenu », AC-5, D-1103-1, D-1103-4, D-1103-5) ; schéma
`kyc-service/contrat/schemas/kyc.correction.requested.json` (`origin/dev`) ; `expert-comptable`
`src/modules/kyc-events/` et `src/modules/notification/` (STORY-021, STORY-590) ; `notification`
`src/modules/modeles/socle/` et `src/domain/envoi/appelants-de-service.ts` (STORY-590, AD-2 amendé par STORY-610).

## « Fini quand » (D-1072-1)

Le plan ne le fixe pas (la story est placée au journal de D). Retenu : **quand `kyc-service` renvoie un dossier pour
correction, chaque administrateur actif du cabinet reçoit un e-mail « Votre dossier KYC vous est renvoyé pour
correction » qui contient, mot pour mot, le `texte` composé par kyc (le mot de l'opérateur, puis une ligne `— <libellé> :
<motif>` ou `— <libellé>` par pièce renvoyée) et le lien vers la page KYC de son espace ; un rejeu du même fait n'envoie
rien de plus. Prouvé par les unitaires des deux services et, pour l'AC-5 de 1103, dans mailhog, sur une pile `grp-d`
(kyc d'`origin/dev`, notification, expert-comptable, Kafka, mailhog) : le renvoi joué par la vraie route de kyc,
l'e-mail lu dans l'API de mailhog.**

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant la fusion du code (« ⚠ Contrats » du journal de D) : la clé neuve du socle et ses variables, le périmètre d'`expert-comptable`, le topic lu, la variable d'environnement neuve | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | `notification` sert le modèle système **`kyc-dossier-renvoi-correction`** (e-mail, `fr` et `en`), variables **`texte`** et **`lienEspace`** ; `expert-comptable` peut le faire partir par la route directe, aucun autre appelant | unitaires du socle (inventaire, contrat de variables, périmètres, secrets) |
| AC-3 | `expert-comptable` lit `kyc.correction.requested` (groupe `expert-comptable-kyc`) et demande l'e-mail pour chaque administrateur actif du cabinet, avec le `texte` reçu, sans le recomposer | unitaires de la projection et du worker |
| AC-4 | Un fait illisible ou hors contrat est écarté sans bloquer le consommateur ; un rejeu (même `eventId`) n'envoie rien de plus ; une panne de la file fait rejouer Kafka | unitaires ; mutations |
| AC-5 (de 1103) | L'e-mail reçu par le cabinet contient exactement les lignes attendues, vu dans mailhog | pile `grp-d`, pilote versionné |
| AC-6 | Aucune régression des trois e-mails KYC existants (`kyc-dossier-recu`, `-approuve`, `-a-corriger`) | suites existantes vertes ; pile : le renvoi émet aussi `kyc.status.changed` (`PENDING_DOCUMENTS`), qui n'envoie rien (D-1103-4) |

## Décisions retenues par défaut (contestables)

- **D-1072-1 — « Fini quand »** : ci-dessus.
- **D-1072-2 — La variable du lien s'appelle `lienEspace`, pas `lien`.** Dans `notification`, `lien` est le nom de rôle
  d'un **secret** (`VARIABLES_SECRETES` : un lien à usage unique, la preuve d'identité). La garde de STORY-589 exige que
  tout modèle système qui déclare `lien` soit inscrit porteur de secret, et celle de STORY-590 qu'**aucun message KYC ne
  déclare de secret**. Le lien de l'espace du cabinet n'est pas un secret (aucun jeton : la page `/kyc` de l'app, derrière
  la connexion). L'appeler `lien` l'aurait soit rangé parmi les secrets (valeur retirée du journal des variables, rejeu
  refusé `SECRET_NON_CONSERVE`), soit fait tomber la garde. `lienEspace` garde les deux gardes vraies. (La demande
  écrite au journal de D disait « `texte`, `lien` » : c'est cette décision qui la précise.)
- **D-1072-3 — Le modèle vit dans la famille KYC du socle**, juste après `kyc-dossier-a-corriger` (l'ordre du cycle de
  revue : reçu, approuvé, à corriger, renvoyé pour correction). `CLES_MESSAGES_KYC` passe à quatre : le périmètre
  d'`expert-comptable` (qui est cette liste) gagne la clé, aucun autre appelant. E-mail seulement (comme les trois autres :
  une cloche serait un comportement de plus), `fr` et `en` (le socle sert toutes ses clés dans les mêmes langues).
  Les trois textes existants ne changent pas d'un octet.
- **D-1072-4 — Le texte de kyc est recopié tel quel** (D-1103-5 : composé une fois, figé dans le fait et le journal) :
  l'e-mail l'encadre d'une phrase d'ouverture et d'une phrase de fin, il ne le recompose pas. Un fait sans `texte` est
  écarté (le schéma l'exige, `minLength: 1`) ; un travail de file sans `texte` est arrêté (`UnrecoverableError`), comme un
  rejet sans motif (590).
- **D-1072-5 — Le même consommateur lit les deux topics** (`KycEventsConsumer`, groupe `expert-comptable-kyc`,
  `fromBeginning`), patron du consommateur d'identité qui lit six topics : pas de groupe de plus à superviser, la même
  santé. Le message est aiguillé par son topic ; `kyc.status.changed` ne change pas d'une ligne.
- **D-1072-6 — L'enveloppe est jugée avant la projection** : corps JSON lisible, `eventId` (en-tête ou corps),
  `schemaVersion` 1, `orgId` de 24 caractères hexadécimaux, `texte` non vide, `occurredAt` valide. Sinon le fait est
  écarté et journalisé (un rejeu échouerait indéfiniment), comme pour `kyc.status.changed`.
- **D-1072-7 — Ordre et idempotence : la file d'abord, le marqueur ensuite, et une panne de la file fait rejouer Kafka.**
  Le renvoi n'écrit aucun read-model (le statut `PENDING_DOCUMENTS` arrive par `kyc.status.changed`, D-1103-4) : l'e-mail
  est **tout** l'effet du fait. Là où les trois e-mails de statut tiennent la mise en file pour « non bloquante » (après le
  commit du read-model), un échec ici aurait perdu le seul effet. Le fait déjà marqué (`processed_kyc_events`, même
  collection, `eventId` uuid) est ignoré ; sinon le travail est enfilé sous un identifiant déterministe
  (`<eventId>__kyc-dossier-renvoi-correction`), puis le marqueur est posé. Un échec de la file remonte (Kafka rejoue) ;
  un échec après la mise en file rejoue un travail que BullMQ, puis la clé d'idempotence de `notification` (une par
  destinataire, `<jobId>__<empreinte de l'adresse>`, AD-3), dédoublonnent.
- **D-1072-8 — Les destinataires sont les administrateurs actifs du cabinet** (`resolveOrgAdminEmails`, le read-model
  d'identité), comme pour l'approbation et le rejet : une demande par adresse. Aucun administrateur répliqué : rien n'est
  demandé, c'est journalisé.
- **D-1072-9 — Le lien vient d'une variable neuve d'`expert-comptable`, `ESPACE_KYC_URL`, facultative** (URL avec
  protocole ; `.env.example` : `http://localhost:3100/kyc`, la page KYC de l'app du cabinet). **Absente, le renvoi n'est
  pas envoyé** : le travail s'arrête sur une erreur nommée, visible dans la file, plutôt qu'un lien bâti sur un hôte au
  hasard (même règle que le repli vide de `NOTIFICATION_BASE_URL`, 590). Les trois e-mails existants n'en dépendent pas.
- **D-1072-10 — Le contrat lu est épinglé côté consommateur** : copie à l'octet du schéma de kyc
  (`test/fixtures/kyc-contrat/kyc.correction.requested.json`, blob d'`origin/dev` de `kyc-service`, origine écrite) et un
  test qui vérifie que chaque champ lu par `expert-comptable` y est exigé, avec son type : si B rend `texte` facultatif,
  la suite rougit ici. Aucune dépendance neuve (pas d'ajv dans ce service).
- **D-1072-11 — La preuve de l'AC-5** : pile `grp-d` versionnée dans `expert-comptable` (`scripts/recette/1072/`) : kyc
  (image d'`origin/dev` de B, par `git archive`), notification et expert-comptable (images des branches), Kafka, deux
  MongoDB en jeu de répliques, Redis, MinIO, mailhog, un faux JWKS. Le dossier est celui de démonstration que kyc sème
  (STORY-180, `UNDER_REVIEW`) ; l'opérateur (jeton RS256 du faux JWKS, `PLATFORM_ADMIN`) rejette le RCCM avec un motif,
  puis renvoie le dossier avec un mot. Les administrateurs du cabinet entrent par des faits `identity.*` publiés sur
  Kafka (comme le ferait l'IdP), jamais par la base.

## Contrat annoncé avant le code

Voir « ⚠ Contrats » du journal de D (2026-11-24, STORY-1072).

## Où en est-on

**Livrée le 2026-11-24.** Code fusionné en rebase sur `dev` ; docs : cette PR.

## Décision ajoutée en cours de route

- **D-1072-12 — Le journal d'une remise de `notification` rejoue sa transaction sur un conflit transitoire.** Relevé
  au premier passage du pilote (31/35) : le premier administrateur recevait l'e-mail **deux fois**. Cause mesurée dans
  la pile (flux d'événements BullMQ de la file `transactionnel`) : la remise du premier envoi, **déjà acceptée par le
  relais**, passait en `delayed` aussitôt après, puis repartait 2 s plus tard ; le journal de la remise
  (`JournalRemiseService.dansUneTransaction`, transaction écrite à la main) perdait sa transaction sur un conflit
  d'écriture avec la préparation du second envoi (même compteur de période, `TransientTransactionError`), l'exécutant
  échouait et BullMQ rejouait la remise. La préparation rejouait déjà ce conflit (`withTransaction`, mesuré le
  2026-10-24) ; le journal, non. Corrigé à la cause : la transaction du journal (remise, échec, écart) est rejouée
  entière sur l'étiquette `TransientTransactionError` (`errorLabels` ou `hasErrorLabel`), cinq essais au plus ; toute
  autre erreur remonte comme avant. Annoncé avant la fusion (prospera-stories #832). Le défaut valait pour tous les
  appelants à plusieurs destinataires (les trois e-mails KYC, le paiement, l'assurance).

## Ce qui a été livré

- **prospera-notification-service #92** (`dev` `7a11331`, `749b3cd` ; branche `91b6efb`, `2339228`, arbre identique) :
  - modèle système **`kyc-dossier-renvoi-correction`** (e-mail, `fr` et `en`) dans la famille KYC du socle, après
    `kyc-dossier-a-corriger` ; variables `texte` (recopié tel quel) et `lienEspace` (D-1072-2) ; `CLES_MESSAGES_KYC` à
    quatre clés, seul `expert-comptable` le fait partir ; inventaire écrit en toutes lettres (31) ; spec neuve
    `src/modules/modeles/socle/kyc-renvoi-correction.spec.ts` ;
  - D-1072-12 : `src/modules/envois/journal-remise.service.ts` (rejeu du conflit transitoire), quatre tests neufs.
- **prospera-expert-comptable #11** (`dev` `4154038`, `b540904` ; branche `d1b0847`, `7ad3184`, arbre identique) :
  - `kyc.correction.requested` lu par le groupe `expert-comptable-kyc` (`kyc-events-consumer.bootstrap.ts`, aiguillage
    par topic) ; `events/lire-correction-demandee.ts` (enveloppe, pure) ; `KycEventsProjectionService.signalerCorrection`
    (la file d'abord, le marqueur ensuite) ; le travail `kyc-dossier-renvoi-correction` du worker (admins actifs, `texte`
    tel quel, `lienEspace`) ;
  - `ESPACE_KYC_URL` (facultative, `@IsUrl` avec protocole ; `.env.example`) ;
  - le schéma de kyc copié à l'octet (`test/fixtures/kyc-contrat/`, blob `a1875d5` de `kyc-service` `9cef9cb`, vérifié
    par le test) ;
  - recette versionnée `scripts/recette/1072/` (pile, pilote, README ; la clé de l'opérateur reste hors du dépôt).
- Aucun module, contrôleur, dépendance ni Dockerfile neuf ; `kyc-service` non touché.

## Preuves

| AC | Preuve |
|---|---|
| AC-1 | « ⚠ Contrats » du journal de D : #816 (`main` af601d7) avant le code, complément D-1072-12 #832 (`main` a61893c) avant la fusion de #92 |
| AC-2 | `kyc-renvoi-correction.spec.ts` (contrat, canaux, périmètre : expert-comptable seul, clé normalisée ; rendu fr/en mot pour mot ; refus sans `texte` ou sans `lienEspace` ; un texte qui contient `{{lienEspace}}` reste du texte) ; gardes du socle (inventaire, tranche KYC, secrets) |
| AC-3 | `notification.processor.spec.ts` (une demande par admin, variables exactes, clé d'idempotence par destinataire, texte tel quel espaces compris) ; pile : deux e-mails, un par administrateur, aucun au collaborateur |
| AC-4 | `lire-correction-demandee.spec.ts` (23 cas écartés), `kyc-events.projection.correction.spec.ts` (ordre file → marqueur, rejeu, panne de file qui remonte), `kyc-events-consumer.aiguillage.spec.ts` (les deux topics, aiguillage, en-tête `eventId`) ; pile : rejeu du même fait muet, fait sans `texte` écarté et journalisé |
| AC-5 (de 1103) | pile `grp-d`, **pilote 35/35** : le renvoi joué par les vraies routes de kyc (RCCM rejeté avec motif, Carte CFE sans motif, `request-correction` avec `If-Match`), les deux e-mails lus dans l'API de mailhog 2,2 s après : objet exact, le bloc `Merci de reprendre ces pièces avant vendredi.` / `— RCCM : <motif>` / `— Carte CFE` mot pour mot, le lien `/kyc` ; le texte du fait sur Kafka est celui de l'e-mail |
| AC-6 | suites existantes vertes ; pile : `kyc.status.changed` (`PENDING_DOCUMENTS`) émis, aucun e-mail de plus |

- **expert-comptable** (Node 25, kafkajs sans binding natif) : 40/40 suites, **390 tests** ; lint des fichiers
  touchés 0 (le seul écart du dépôt est dans `main.ts`, non touché) ; `nest build` 0 ; **mutations 18/18** tuées sur une
  assertion (deux reprises après une compilation, trois tests renforcés après trois survivantes : texte rogné en
  projection et au worker, `ESPACE_KYC_URL` non lue).
- **notification** (Node 24, étage `verification` de `2339228`) : **288/288 suites, 4233 tests** (1 ignoré), lint 0,
  build 0 ; mutations 4/4 sur le socle (la cinquième, un canal in-app, rougit au chargement par la garde de cohérence)
  et **5/5** sur le rejeu du journal.
- **Pile `grp-d`** : kyc (image d'`origin/dev` `9cef9cb` par `git archive`), notification (`2339228`) et
  expert-comptable (`d1b0847`, `src` identique à `dev`), Kafka, deux MongoDB, Redis, MinIO, mailhog, faux JWKS ;
  `docker compose up` sain ; premier passage 31/35 (doublon D-1072-12, décodage d'objet du pilote), **35/35** après
  correction (aucun travail rejoué au flux BullMQ, deux remises, deux messages). Les arbres fusionnés sur `dev` sont
  ceux des images (`git diff` vide). Pile descendue avec ses volumes.

## Ce qui reste

- Aucune suite de la story. Une pile qui veut cet e-mail pose `ESPACE_KYC_URL` (information à B, journal de D).
