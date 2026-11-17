# STORY-961 : le plan de journaux

Status: in-progress

**Complexité :** moyenne (première donnée déclarée par référentiel, première numérotation légale : sans trou ni
doublon sous la concurrence, par `series-v1`)

**Épic :** EPIC-112 (journaux et pièces), d'`epics-comptabilite-2026-08-27.md`
**Dépôt :** `MoneyVibesGroup/prospera-comptabilite-service`
**Plage :** groupe B, n° 6 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §3, ligne 961).
**Dépend de :** STORY-959 (les exercices et la tenue, `dev` `a8784cb`).
**Débloque :** STORY-962 (l'écriture en brouillard : elle prend son numéro dans le journal de sa pièce).

---

## Pourquoi

EPIC-112 : « Le plan de journaux n'est pas universel : il vient du paquet, comme le plan de comptes. Le coder en dur
recréerait le défaut STORY-422 sur un autre objet. » Et l'AUDCIF impose une numérotation **continue, sans blanc** :
c'est le premier invariant d'un livre légal, avant toute écriture (962) et toute validation (964).

## Ce qui doit être vrai à la fin (plan du lot 3, §3, ligne 961)

| Exigence | Fait |
|---|---|
| Journaux déclarés par le référentiel du dossier : achats, ventes, banque, caisse, OD, à-nouveaux | `plans-de-journaux@1`, un plan par référentiel (SN, SMT, SFD-BCEAO, CIMA), validé au démarrage (D-961-1) ; le plan du référentiel de l'exercice est **arrêté** à l'ouverture au journal (D-961-2) |
| Seul un exercice tenu au JOURNAL a des journaux | `CAHIERS` : 409 `EXERCICE_TENU_AUX_CAHIERS` ; pas ouvert : 404 `EXERCICE_NON_OUVERT` (D-961-3) |
| Numérotation continue par journal et par exercice | une série `series-v1` par (organisation, dossier, exercice, journal) (D-961-4) |
| Par `series-v1` | `prospera-plateforme/series/src/index.ts` copié à l'octet à l'étiquette (`src/vendor/series/`, empreinte gardée) |
| Ni trou ni doublon sous la concurrence | le numéro s'émet DANS la transaction de l'acte qui le porte : un acte abandonné rend son numéro (D-961-5) ; prouvé sur MongoDB 8.0 en jeu de répliques, mutation à l'appui |
| `docker compose up` sain | module Nest neuf (`JournauxModule`) : pile `grp-b` |

## Décisions (prises par défaut, contestables)

- **D-961-1 : le plan de journaux est une DONNÉE déclarée par référentiel, tenue par la comptabilité.** Les paquets
  de référentiel (`balance-service`, groupe A) portent le plan de comptes, pas de plan de journaux, et la
  comptabilité est le seul consommateur d'un plan de journaux. Le service porte donc `plans-de-journaux@1`
  (`src/journaux/plans-de-journaux.json`) : un plan par référentiel servi (`SN`, `SMT`, `SFD-BCEAO`, `CIMA`), chacun
  avec sa version et ses journaux (code, libellé, nature). Le code ne nomme aucun référentiel ni aucun journal : il
  lit la déclaration du référentiel résolu. Validé au chargement (démarrage refusé sinon) : chaque référentiel servi a
  son plan ; chaque plan déclare **au moins une fois chacune des six natures** (`ACHATS`, `VENTES`, `BANQUE`,
  `CAISSE`, `OPERATIONS_DIVERSES`, `A_NOUVEAUX`) ; codes uniques, de 2 à 4 majuscules. Le jour où un paquet porte le
  plan, seul le chargeur change. Information à A (journal de B), rien n'est demandé.
- **D-961-2 : le plan est ARRÊTÉ pour l'exercice à son ouverture au journal, dans la même transaction.** Le
  référentiel d'un exercice se relit chez dossier-service (axe daté `systemeComptable`) et pourrait changer ; un livre
  légal ne change pas de journaux en cours d'exercice. À l'ouverture `JOURNAL` (959), la comptabilité écrit, dans la
  transaction de la tenue et de sa piste, le plan du référentiel résolu (`plans_de_journaux`, un par exercice, index
  unique, append-only) et amorce à 0 la série de chaque journal. L'entrée `EXERCICE_OUVERT` reçoit
  `donnees.referentiel` et `donnees.planDeJournaux` (`<référentiel>@<version>`). Aucun geste ni droit de plus :
  ouvrir au journal, c'est ouvrir ses journaux. `comptabilite:journal:administrer` reste pour ajouter un journal au
  plan arrêté (un second compte bancaire), à venir.
- **D-961-3 : un exercice tenu aux CAHIERS n'a pas de journaux.** Rien n'est arrêté à l'ouverture `CAHIERS` ; lire
  ses journaux ou y numéroter rend 409 `EXERCICE_TENU_AUX_CAHIERS` (`details.tenue`). 409 et pas 404 : l'exercice est
  bien ouvert à la comptabilité, c'est sa tenue qui exclut le journal (Q1, D-L3-4). Changer de tenue, c'est changer
  d'exercice (D-959-2). Un exercice tenu au journal sans plan arrêté (ouvert avant 961 : aucun en dehors des tests,
  le service n'est déployé nulle part) rend 409 `PLAN_DE_JOURNAUX_ABSENT`.
- **D-961-4 : une série `series-v1` par journal ET par exercice.** Nom de série :
  `journal:<organisationId>:<dossierId>:<exerciceId>:<code>` ; numéro mis en forme `<code>-000001`. La copie est
  `src/vendor/series/series.ts` (étiquette `series-v1`, `e0cb763`, sha256 `ef5105b7…bad2`), avec `ORIGINE.json` et un
  test d'empreinte, comme la garde partagée. Le dossier `series/` est à D : la comptabilité le consomme sans le
  modifier.
- **D-961-5 : un numéro ne s'émet que dans la transaction de l'acte qui le porte.** `series-v1` garantit des
  numéros consécutifs et jamais réémis : un numéro émis puis abandonné serait un TROU, que la loi interdit dans un
  journal. `NumerotationDesJournaux.numeroter(portee, journal, session)` exige une session en transaction (sinon
  `NumerotationHorsTransaction`, faute de programmation) et passe la session à `depotMongo` : si l'acte échoue, son
  numéro est rendu avec lui. Deux transactions concurrentes sur un même journal se heurtent sur le document de la
  série ; `withTransaction` rejoue la perdante (erreur transitoire). Le premier appelant est la saisie (962).
- **D-961-6 : la lecture du plan est ouverte à tout membre dont la portée couvre le dossier** (D-958-9) :
  `GET …/exercices/{e}/journaux`, en lecture seule au manifeste. Elle donne, par journal, le dernier numéro émis.
- **D-961-7 : la garde des droits lit `droits ∪ droitsHorsJeton`.** Depuis STORY-960, tout droit de tenant neuf
  (dont `comptabilite:*`, à attribuer) est servi par `/moi/droits` dans `droitsHorsJeton` (contrat 1.1.0). La source
  des droits rend l'union ; `droitsHorsJeton` absent vaut `[]` ; présent mais hors contrat : 503
  `DROITS_INDISPONIBLES`.

## Contrat touché (annoncé dans « ⚠ Contrats » du journal de B AVANT la fusion du code)

- Route neuve `GET /api/v1/dossiers/{dossierId}/exercices/{exerciceId}/journaux` → `{ dossierId, exerciceId,
  referentiel, versionDuPlan, arreteLe, journaux: [{ code, libelle, nature, dernierNumero }] }`.
- Refus nommés neufs : 409 `EXERCICE_TENU_AUX_CAHIERS`, 409 `PLAN_DE_JOURNAUX_ABSENT`, 404 `JOURNAL_INCONNU`
  (numérotation, pour 962).
- `EXERCICE_OUVERT` (piste) : `donnees.referentiel`, `donnees.planDeJournaux` ajoutés à l'ouverture au journal.
- Manifeste : la route entre dans `routesLectureSeule` ; commentaires des droits et des familles mis à jour.
- Lu chez B (auth) : `droitsHorsJeton` de `GET /moi/droits` (contrat 1.1.0).
- Aucun topic, aucun schéma au registre.
