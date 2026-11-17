# STORY-962 : l'écriture en brouillard

Status: in-progress

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

À remplir à la fusion.

## Preuves

À remplir à la fusion.

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
