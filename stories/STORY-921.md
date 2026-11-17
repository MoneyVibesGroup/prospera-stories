# STORY-921 : le hub de balance accepte la 5e origine `comptabilite`

Status: done

**Complexité :** faible (un symbole d'enum, trois gardes, une publication de contrat)

**Source :** `coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2 ligne 921 et §3 ligne 967 (B-967 attend A-921) ;
EPIC-114 (grand livre et balance dérivée, « 5e origine du hub ») ; `INTEGRATION.md` du service, §1 et §1 bis.
**Dépôt :** `balance-service` (tenu par A). Une seule story = ce seul service.
**Plage :** groupe A, n° 2 du lot 3. Fiche écrite juste avant de coder.

---

## Pourquoi

Le module de comptabilité du cabinet (`prospera-comptabilite-service`, groupe B) publiera sa balance dérivée du grand
livre sur `balance.submitted`. Le hub ne sait aujourd'hui poser que `PORTEFEUILLE_SFD` par ingestion directe : toute autre
origine est rejetée (`PAYLOAD_INVALIDE`). Sans cette story, B-967 n'a aucun endroit où poser sa balance.

## Ce que le code dit aujourd'hui (constat)

- Les **sources** (voie d'entrée) sont `sage`, `direct`, `ocr` (`SOURCES_BALANCE`). Un producteur métier n'ouvre **pas**
  cette liste (INTEGRATION.md §1 bis : « `source` reste `direct` »).
- Les **origines** (`ORIGINES_BALANCE`) : `A_NOUVEAUX`, `PROVISIONS_FISCALES`, `PORTEFEUILLE_SFD`, `AMORTISSEMENTS`,
  `INVENTAIRE`. Seule `PORTEFEUILLE_SFD` est publiable par ingestion directe. La liste est gardée par un verrou
  d'inventaire (`creances-dettes-devises.mono-devise.spec.ts`, « toute sixième doit faire rougir ce test ») et par l'e2e
  `openapi-contract`.
- Le plan parle de « 4 origines, la 5e `comptabilite` » : le compte du plan ne correspond à aucune des deux listes
  (3 sources, 5 origines). Seule lecture cohérente avec le plan (« balance d'origine `comptabilite` », « liste fermée des
  origines ») et avec `INTEGRATION.md` : **un nouveau symbole de `ORIGINES_BALANCE`**, publié sur `source: direct`.

## Décisions (mes recommandations, appliquées ; contestables)

- **D-921-1 — Une origine, pas une source.** `comptabilite` entre dans `ORIGINES_BALANCE` (en minuscules, comme le plan
  l'écrit ; les autres valeurs sont en capitales : l'écart est voulu par le plan, on n'en renomme aucune). `SOURCES_BALANCE`
  ne bouge pas : `balance.created` (source) est inchangé.
- **D-921-2 — Une balance GÉNÉRALE, pas une contribution partielle.** Le grand livre est la comptabilité entière : la
  balance `comptabilite` n'entre ni dans `ORIGINES_HORS_BALANCE_COMPLETE` ni dans `ORIGINES_HORS_BASE_FISCALE`. Elle
  est donc une balance complète, une base de calcul fiscal, gèle la saisie des cahiers, et peut servir de clôture.
- **D-921-3 — Référentiel facultatif.** Comme `PORTEFEUILLE_SFD`, le producteur peut l'omettre : le hub le résout depuis
  l'axe daté du dossier ; déclaré, il doit être identique (sinon `CONTENU_INVALIDE`). Le `referentiel` reste scellé dans le
  `checksum` (le producteur scelle le tag que le hub résoudra).
- **D-921-4 — `origine` reste hors sceau** et entre dans la clé d'idempotence : `(dossier, exercice, source, origine,
  version)`. La lignée `comptabilite` a donc ses propres versions, distinctes de celles de `direct` sans origine.
- **D-921-5 — Contrat annoncé avant le code.** Le schéma publié `balance.submitted.v1.schema.json` (`origine.enum`)
  reçoit `comptabilite` : ajout seul, compatible (aucun registre Avro/Karapace dans ce service : le contrat est un JSON
  Schema documentaire + la validation du hub). Annonce dans le journal de A (« ⚠ Contrats ») par **une PR de docs
  fusionnée AVANT le code** ; la PR de docs de clôture suit.
- **D-921-6 — Le verrou d'inventaire est mis à jour avec décision nommée** (D-921-1), il ne disparaît pas : il rougit
  toujours pour une origine non décidée.

## Critères d'acceptation

- **AC-1** : `comptabilite` ∈ `ORIGINES_BALANCE` ; schéma Mongo, DTO de réponse, filtre `?origine=`, OpenAPI et JSON Schema
  la portent.
- **AC-2** : un événement `balance.submitted` d'origine `comptabilite`, `checksum` correct, est ingéré (`balance.created`
  émis) ; un `checksum` faux est rejeté `CONTENU_INVALIDE`.
- **AC-3** : une origine inconnue (`GRAND_LIVRE`) et une origine interne (`A_NOUVEAUX`) restent refusées, nommées dans le motif.
- **AC-4** : la balance `comptabilite` n'est exclue d'aucune lecture « complète » (listes d'exclusion inchangées).
- **AC-5** : mutation : retirer `comptabilite` de la liste fait rougir les tests sur l'assertion.

## Definition of Done

- [x] Suites unitaires et e2e concernées vertes (lecture de `Test Suites: … failed`) ; lint des fichiers touchés ; `tsc`/build.
- [x] Mutation rouge sur l'assertion, puis remise.
- [x] PR code fusionnée sur dev ; PR de docs de clôture fusionnée ; B prévenu (B-967) avec le SHA sur dev et la forme attendue.
- [x] Pas de module Nest ni de dépendance changés : Docker non requis.

## Livraison (2026-11-17)

🏁 **DONE** — balance-service **#152** (dev `9dfd60e`) ; contrat annoncé avant le code (stories #588).

- Code : `ORIGINES_BALANCE` + `ORIGINE_COMPTABILITE` + `ORIGINES_PUBLIABLES_PAR_INGESTION` (`balance-canonique.ts`), lecture de l'ingestion directe (`ingestion.regles.ts`), schéma `balance.submitted.v1`, `INTEGRATION.md` §1 ter, OpenAPI `OrigineBalance`.
- Preuves : suites touchées vertes (ingestion, validateur, verrou d'inventaire, créances/dettes : 11 suites, 337 tests ; balance/contrôles : 410 tests, `Test Suites: 1 failed` = module.spec, écart d'environnement ci-dessous), e2e OpenAPI 221/221, `tsc` propre, lint des 8 fichiers TS propre. Mutation 1 (retrait de `comptabilite` des origines publiables) : 8 tests rouges sur l'assertion (`ok` attendu `true`, motif sans « comptabilite »). Mutation 2 (retrait de `ORIGINES_BALANCE`) : le verrou d'inventaire rougit sur l'assertion ; le type `OrigineBalance` rougit en plus à la compilation (garde de type).
- Docker : non requis (ni module Nest ni dépendance changés).
- Écart d'environnement (hors story) : sur ce poste (Node 25), les suites `*.module.spec.ts` qui chargent le client Kafka natif échouent (« Cannot find module 'bindings' ») ; identique avant la story, elles se jouent sous Node 24 dans l'image.
