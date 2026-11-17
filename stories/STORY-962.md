# STORY-962 : l'écriture en brouillard

Status: done

**Complexité :** moyenne (première écriture comptable : équilibre par pièce, montants exacts, contrôle d'exercice et de
date, pièce justificative vérifiée chez un autre service, numéro et piste dans une transaction, cache des droits)

**Épic :** EPIC-113 (écriture et brouillard), d'`epics-comptabilite-2026-08-27.md` ; Q2 (D-L3-4)
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service`
**Plage :** groupe B, n° 7 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 962).
**Dépend de :** STORY-961 (le plan de journaux, `dev` `acafd6f`).
**Débloque :** STORY-964 (la validation inaltérable : brouillard → définitif, contre-passation).

---

## Pourquoi

EPIC-113 : « L'équilibre par pièce est le seul contrôle qui attrape une imputation oubliée ; l'équilibre par journal la
laisse passer. » C'est la première écriture du module : Prospera cesse de justifier une balance, il **enregistre**
(« une écriture comptable est un acte, pas une donnée »). Q2 : l'inaltérabilité ne s'applique pas au brouillard (il se
corrige), mais il faut une frontière visible entre les deux mondes, et le brouillard est validé avant toute balance
publiée (D-L3-4).

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 962)

| Exigence | Fait |
|---|---|
| L'équilibre se vérifie **par pièce** | `verifierPiece` : chaque ligne a un seul sens, débits = crédits de la pièce, en `bigint` ; 422 `PIECE_DESEQUILIBREE` (`details.totalDebit`, `totalCredit`, `ecart`) (D-962-2) |
| Montants exacts, jamais en flottant | entiers en unité mineure (`Number.isSafeInteger`), comme `balance-service` et `paiement-service` ; devise XOF ou XAF (D-962-3) |
| L'exercice est contrôlé | OUVERT chez dossier-service (`EXERCICE_CLOS`), tenu au JOURNAL (`EXERCICE_TENU_AUX_CAHIERS`, `EXERCICE_NON_OUVERT`), journal au plan arrêté (`JOURNAL_INCONNU`) (D-962-7) |
| La date est contrôlée | jour civil dans les bornes inclusives de l'exercice ; 422 `DATE_HORS_EXERCICE` (`details.date`, `debut`, `fin`) (D-962-7) |
| Une pièce justificative est rattachée (`pieceId`) | requise ; vérifiée dans le dossier chez `document-service` à la saisie, appel borné et fermé (D-962-4) |
| Numérotation | numéro PROVISOIRE continu par journal et par exercice (`VE-BR-000001`), dans la transaction de la saisie ; le définitif vient à la validation (D-962-1) |
| Piste d'audit avec `provenance` | `ECRITURE_SAISIE`, dans la transaction de l'écriture (Q3, D-962-9) |
| Le cache des droits | `(membre, organisation, dv)`, 60 s au plus (D-962-5) |
| Preuves sur un vrai MongoDB en jeu de répliques ; mutation ; `docker compose up` sain | `test:socle`, mutations, pile `grp-b` (module Nest neuf : `EcrituresModule`) |

## Décisions (prises par défaut, contestables)

- **D-962-1 : un brouillard reçoit un numéro PROVISOIRE ; le numéro définitif s'émet à la validation (STORY-964).**
  - Pourquoi : un brouillard se corrige et peut être abandonné (Q2). Un numéro définitif donné à la saisie laisserait
    un trou dans le journal à chaque brouillard abandonné, ou obligerait à garder des pièces mortes. Il placerait
    aussi les numéros dans l'ordre de saisie, alors que l'ordre légal est celui de l'enregistrement définitif.
  - Comment : une seconde série `series-v1` par journal et par exercice, `brouillard:<org>:<dossier>:<exercice>:<code>`,
    amorcée à 0 avec la série définitive quand le plan est arrêté (D-961-2). Le brouillard prend son numéro par
    `NumerotationDesJournaux.numeroterBrouillard(portee, code, session)`, **dans la transaction qui l'écrit** (mêmes
    gardes que `numeroter` : session en transaction, journal au plan). Forme : `VE-BR-000001`, qui ne se confond avec
    aucun numéro définitif (`VE-000001`).
  - Pour 964 : la validation appelle `numeroter(portee, code, session)` dans SA transaction (D-961-5) ; la série
    définitive n'a donc ni trou ni doublon, et suit l'ordre des validations. Le numéro provisoire reste sur l'écriture
    (traçabilité du brouillard), l'index unique `(portée, journal, rangProvisoire)` aussi.
- **D-962-2 : une pièce, c'est une écriture ; l'équilibre se vérifie par pièce.** 2 à 500 lignes. Chaque ligne porte
  un débit OU un crédit strictement positif (422 `LIGNE_SANS_MONTANT`, `LIGNE_DEBIT_ET_CREDIT`, `details.ligne` et
  `compte`). La somme des débits égale la somme des crédits (422 `PIECE_DESEQUILIBREE`). Les règles sont pures
  (`src/ecritures/piece.ts`), éprouvées seules et par mutation.
- **D-962-3 : un montant est un entier en unité mineure, jamais un flottant.** C'est la convention du dépôt :
  `balance.submitted` v1 (« montants entiers en unités mineures de `devise` », la forme que B-967 publiera) et
  `paiement-service` (`Number.isSafeInteger`, « le XOF n'a pas de décimale »). Le DTO refuse un flottant, un négatif ou
  un texte (400) ; les sommes se font en `bigint` ; un total au-delà de 2^53 − 1 est refusé (422 `PIECE_HORS_BORNE`).
  La pièce porte sa `devise`, requise : **XOF ou XAF**, les monnaies de tenue de la zone OHADA, sans décimale.
  Une autre devise (et les écarts de conversion) attendra un dossier qui la demande.
- **D-962-4 : la comptabilité VÉRIFIE la pièce justificative, par un appel borné, à la saisie.**
  - Le contrat lu (dépôt de C, **non modifié**) : `GET /api/v1/dossiers/{dossierId}/pieces?pieceId=<id>` de
    `document-service` (STORY-358, 392). Le filtre restreint, il n'élargit jamais : un `pieceId` inconnu, d'un autre
    dossier ou d'une autre organisation rend une liste vide. Le `pieceId` est l'identifiant opaque de la pièce
    (`IDENTIFIANT_OPAQUE`, 128 caractères au plus), celui qui répond à « quelle image justifie CETTE écriture ? ».
  - Jeton du membre relayé tel quel (portée de document-service). Délai `DOCUMENT_SERVICE_DELAI_MS` (3 s par défaut).
  - Trouvée : la pièce de la liste qui porte exactement ce `pieceId`. L'écriture garde `pieceJustificative`
    (`pieceId`, `documentId` = l'`id` du document, `type`, `verifieeLe`).
  - Liste sans elle, ou 404 : 422 `PIECE_JUSTIFICATIVE_INCONNUE` (`details.pieceId`).
  - Délai, réseau, autre statut, réponse hors contrat : 503 `DOCUMENTS_INDISPONIBLES` (fermé).
  - Pourquoi vérifier plutôt que garder la seule référence : l'AUDCIF veut une écriture appuyée sur une pièce
    justificative. Une référence jamais vérifiée deviendrait, à la validation (964), un justificatif inaltérable qui
    ne justifie rien. Le coût : la saisie dépend de document-service, de façon bornée et fermée, comme elle dépend déjà
    de dossier-service.
  - L'appel se fait hors transaction (un appel réseau n'allonge pas une transaction), après les contrôles locaux : une
    pièce déséquilibrée ou hors exercice ne coûte aucun appel.
  - Variable neuve, requise : `DOCUMENT_SERVICE_URL`. `document-service` doit figurer dans l'`AUTH_AUDIENCE` de
    l'IdP (c'est déjà le cas du compose racine).
  - Rien n'est demandé à C ; information dans le journal de B (« → C »).
- **D-962-5 : le cache des droits est posé, sous la clé `(membre, organisation, dv)`, 60 s au plus.** La saisie est
  fréquente (D-959-4).
  - `CacheDesDroits` se pose devant l'adaptateur HTTP, derrière le même port `SOURCE_DES_DROITS`. Le jeton projette
    désormais `dv` (claim de STORY-949). Un jeton au `dv` plus grand ne trouve pas l'entrée et relit.
  - Sans `dv` (ou `dv` non entier), aucun cache. Un échec (`DROITS_INDISPONIBLES`) ne se garde pas.
  - Borné à 10 000 membres, le plus ancien sort d'abord.
  - **Pas d'invalidation par `identity.droits.changed@1`** dans cette story : la clé `dv` et la durée bornent l'écart
    à une minute. Le consommateur viendra si une minute est jugée trop longue. Contestable.
- **D-962-6 : le compte est contrôlé dans sa forme, pas contre le plan de comptes.** Des chiffres, la classe (1 à 9)
  en tête, 2 à 20 chiffres. Le plan de comptes est dans le paquet du référentiel, chez A (`balance-service`) ; le lire
  ici serait une dépendance de plus à la saisie. À poser avec le grand livre (966) ou les comptes de tiers (968).
  Contestable.
- **D-962-7 : le contrôle d'exercice et de date.**
  - Ordre : portée (dossier et exercice, par dossier-service) ; exercice OUVERT chez dossier-service (409
    `EXERCICE_CLOS`, `details.statut`) ; tenue et plan (409 `EXERCICE_TENU_AUX_CAHIERS`, 404 `EXERCICE_NON_OUVERT`) ;
    journal au plan arrêté (404 `JOURNAL_INCONNU`) ; date ; équilibre ; pièce justificative.
  - La date est un jour civil `AAAA-MM-JJ` qui existe (`2026-02-30` : 400). Elle est comparée aux bornes de
    dossier-service, inclusives (elles sont normalisées à minuit UTC, fin incluse), en jour civil UTC.
  - Une date future dans l'exercice est admise (une échéance, une facture datée).
- **D-962-8 : le brouillard n'est pas append-only (Q2), mais cette story n'ouvre ni correction ni suppression.**
  - La collection `ecritures` accepte une mise à jour, pour que 964 puisse valider un brouillard et qu'une correction
    tracée vienne ensuite.
  - Question de D-959-2 (annuler une tenue choisie par erreur avant toute écriture) : **pas d'annulation**. Si le
    besoin vient, ce sera un acte `TENUE_ANNULEE` tracé, refusé dès qu'une écriture existe dans l'exercice.
- **D-962-9 : la piste dit la saisie, avec sa provenance.**
  - Acte `ECRITURE_SAISIE`, objet `ecriture`, auteur le membre, dans la transaction de l'écriture et de son numéro.
  - `donnees` : `statut`, `journal`, `numeroProvisoire`, `dateEcriture`, `pieceId`, `documentId`, `devise`,
    `totalDebit`, `totalCredit`, `lignes` (nombre).
  - La provenance se déduit de la proposition citée (`choixDuGeste`, D-959-9) : une imputation proposée par la
    machine (EPIC-117) et acceptée telle quelle ⇒ « proposé par la machine ». L'écriture garde la même provenance.
- **D-962-10 : les lectures sont ouvertes à tout membre dont la portée couvre le dossier** (D-958-9) :
  `GET …/ecritures?journal=` (200 au plus, par journal puis par numéro) et `GET …/ecritures/{ecritureId}`
  (404 `ECRITURE_INTROUVABLE` hors de l'exercice). Au manifeste en `routesLectureSeule`.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- **Route neuve** `POST /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/ecritures`, droit
  `comptabilite:ecriture:saisir`. Corps : `{ journal, dateEcriture, libelle, pieceId, devise: XOF|XAF, lignes: [{
  compte, libelle?, debit, credit }], proposition? }`. 201 → `{ id, dossierId, exerciceId, journal, statut:
  BROUILLARD, numeroProvisoire, dateEcriture, libelle, devise, lignes, totalDebit, totalCredit, pieceJustificative: {
  pieceId, documentId, type, verifieeLe }, saisiePar, saisieLe, provenance }`.
- **Routes neuves de lecture** : `GET …/ecritures?journal=`, `GET …/ecritures/{ecritureId}`.
- **Refus nommés neufs** : 422 `PIECE_DESEQUILIBREE`, `LIGNE_SANS_MONTANT`, `LIGNE_DEBIT_ET_CREDIT`,
  `PIECE_HORS_BORNE`, `DATE_HORS_EXERCICE`, `PIECE_JUSTIFICATIVE_INCONNUE` ; 404 `ECRITURE_INTROUVABLE` ; 503
  `DOCUMENTS_INDISPONIBLES`. Le `details` d'un refus peut porter des nombres (ajout).
- **Piste** : acte neuf `ECRITURE_SAISIE`.
- **Manifeste** : les deux lectures entrent dans `routesLectureSeule` ; commentaire des droits et de la pièce
  justificative.
- **Lu chez C** (sans rien changer) : `GET /api/v1/dossiers/{dossierId}/pieces?pieceId=` de `document-service`.
- **Lu chez B (auth)** : le claim `dv` du jeton (STORY-949), qui clé le cache des droits.
- Variable neuve, requise : `DOCUMENT_SERVICE_URL` (et `DOCUMENT_SERVICE_DELAI_MS`, facultative).
- Aucun topic, aucun schéma au registre.

## Ce qui a été livré

Deux PR fusionnées en « Rebase and merge » le 17/11, l'annonce d'abord.

| Dépôt | PR | Sur la branche |
|---|---|---|
| `prospera-stories` | #623 (fiche, tracker, manifeste amendé, annonce du contrat, AVANT le code) | `main` `b8ca29b` |
| `prospera-comptabilite-service` | #4 | `dev` **`ce22d81`** (rejoué de `59455cc` ; arbre identique) |

- `src/ecritures/` :
  - `piece.ts` : les règles pures (équilibre par pièce en `bigint`, sens des lignes, borne 2^53 − 1, date dans
    l'exercice, jour civil) ;
  - `ecriture.schema.ts` : collection `ecritures`, index unique `un_numero_provisoire_par_journal`, montants
    validés entiers ;
  - `source-des-pieces.ts` : port `SourceDesPieces` et son adaptateur HTTP de `document-service` (borné, fermé) ;
  - `brouillard.service.ts` : saisie (numéro provisoire, écriture, piste dans UNE transaction), lecture, liste ;
  - `ecritures.controller.ts`, `ecritures.dto.ts`, `ecritures.module.ts`.
- `src/journaux/` : `serieDuBrouillard`, `prefixeDuBrouillard`, `numeroterBrouillard` ; la série des brouillards est
  amorcée avec la définitive quand le plan est arrêté.
- `src/droits/cache-des-droits.ts` : le cache `(membre, organisation, dv)`, posé devant `SourceDesDroitsHttp`
  (`SOURCE_DES_DROITS_HTTP`) ; la garde passe le membre et son `dv` ; `JwtStrategy` projette `dv`.
- `src/common/refus.ts` : huit refus nommés neufs ; `details` admet des nombres.
- `DOCUMENT_SERVICE_URL` (requise) et `DOCUMENT_SERVICE_DELAI_MS` : configuration, compose, `.env.example`, README.
- `src/module.manifest.ts` recopié à l'octet depuis `main` (`git -c core.autocrlf=false show`).
- `test/socle/ecritures.socle-spec.ts` : suite neuve ; les trois suites existantes posent `DOCUMENT_SERVICE_URL`.

## Preuves

- **Node 24** (étage `verification`, image construite depuis `git -c core.autocrlf=false archive` du commit poussé) :
  **29 suites, 358 passés, 3 sautés** (les comparaisons à `prospera-plateforme` et `prospera-stories`, absents du
  conteneur) ; `npm run lint`, `tsc --noEmit` et `npm run build` verts.
- **`npm run test:socle`** (vrai MongoDB 8.0 `rs0`, vrai Kafka, doublures HTTP d'auth, de dossier-service et de
  document-service) : **69/69**, dont 19 neufs.
  - Pièce équilibrée : 201, `VE-BR-000001`, pièce justificative (`documentId`, `type`) ; document-service lu une fois,
    avec le jeton du membre, pour ce dossier et ce `pieceId`. La piste porte `ECRITURE_SAISIE` et sa provenance.
  - Imputation proposée et acceptée : « proposé par la machine », proposition citée.
  - Le brouillard ne consomme aucun numéro définitif : VE reste à 0 au plan de journaux, la série des brouillards à 2.
  - Droit seulement dans `droitsHorsJeton` : 201. Lecture par id et par journal sans droit d'écriture ; une écriture
    lue sous un autre exercice : 404 `ECRITURE_INTROUVABLE`.
  - **Refus nommés, et rien d'écrit ni de numéroté** (écritures, piste et tête de la série relues avant et après
    chaque refus) :
    - **pièce déséquilibrée : 422 `PIECE_DESEQUILIBREE`** (118 000 / 100 000, écart 18 000) ;
    - **date hors de l'exercice : 422 `DATE_HORS_EXERCICE`** (31/12/2025 et 01/01/2027, bornes 2026-01-01 →
      2026-12-31) ;
    - `LIGNE_SANS_MONTANT`, `LIGNE_DEBIT_ET_CREDIT` ;
    - montant flottant, négatif ou en texte : 400 ; une seule ligne, `2026-02-30`, `EUR`, `../x`, champ en trop,
      `pieceId` absent : 400 ;
    - pièce inconnue (liste vide, ou 404) : 422 `PIECE_JUSTIFICATIVE_INCONNUE` ;
    - document-service lent : 503 `DOCUMENTS_INDISPONIBLES` en moins de 1,8 s (borne 800 ms) ;
    - exercice aux CAHIERS : 409 ; non ouvert : 404 ; clos chez dossier-service : 409 `EXERCICE_CLOS` ; journal `PA` :
      404 `JOURNAL_INCONNU` ;
    - sans le droit : 403 `DROIT_INSUFFISANT`, document-service n'est pas appelé.
  - **Cache** : trois saisies du même membre au même `dv` ⇒ une seule lecture de `/moi/droits` ; `dv` + 1 ⇒ relecture.
  - **20 saisies concurrentes dans AC** : `AC-BR-000001` → `000020`, rangs 1 → 20 en base, tête de série à 20,
    20 entrées de piste.
- **Mutations : 31/31 unitaires et 5/5 sur le socle rougissent sur une assertion** (script joué dans l'image de
  vérification ; « rouge » = `Tests: … failed` et aucun `TS\d{4}`). Elles portent sur :
  - les règles : équilibre neutralisé, bornes de date (début, fin, début exclusif), ligne sans montant, ligne à deux
    sens, borne 2^53, signe de l'écart, flottant admis ;
  - la pièce justificative : pièce approchée, 404 pris pour une panne, pièce absente admise, hors contrat ;
  - le service : exercice clos admis, date non contrôlée, équilibre non vérifié, numéro définitif au lieu du
    provisoire, écriture hors transaction, journal hors plan, acte de piste ;
  - l'index unique ; la série des brouillards (nom, préfixe, amorce) ;
  - le cache : `dv` hors de la clé, durée, cache sans `dv`, borne ; `dv` passé par la garde, projeté entier ;
    `DOCUMENT_SERVICE_URL` requise ;
  - **sur le socle** : équilibre neutralisé, date non contrôlée, numéro définitif, pièce absente admise, débit
    flottant admis par le DTO.
- **Pile `grp-b`** (compose du dépôt, image runtime du commit, volumes neufs, verrou Docker pris de façon atomique) :
  `docker compose up` sain (quatre conteneurs `healthy`), `/api/v1/health` 200 (`rs0`, primaire ; Kafka up),
  `EcrituresController` mappé, les deux chemins dans l'OpenAPI, `POST …/ecritures` sans jeton : 401. Descendue avec ses
  volumes, verrou rendu.

## Pour la suite

- **STORY-964** (la validation inaltérable) : valider = `numeroter(portee, code, session)` dans la transaction de la
  validation (D-962-1), statut `VALIDEE`, écriture fermée à toute modification (contre-passation seulement), piste
  chaînée. La pièce justificative est déjà vérifiée et figée sur l'écriture.
- **Corriger et abandonner un brouillard** (Q2) : actes tracés, à placer avec 964 ou juste après. Une saisie rejouée
  (réseau) crée aujourd'hui un second brouillard : une clé d'idempotence (`Idempotency-Key`, déjà admise par le CORS)
  viendra avec.
- **Q2, l'échéance du brouillard** : la balance dérivée (967) ne se publie pas tant qu'un brouillard reste dans la
  période.
- **Le plan de comptes** (D-962-6) : contrôler le compte contre le paquet du référentiel, avec 966 ou 968.
- **`comptabilite:*` à attribuer** aux rôles du cabinet dans auth-service (hors du jeton, D-959-4), avant B-967 : en
  réel, la saisie rend 403 `DROIT_INSUFFISANT` jusque-là.
