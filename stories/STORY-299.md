---
baseline_commit: f48c62cbb139258dad9fde8e5c20f4e3b567173e
---

# STORY-299 : Journal d'audit chaîné par périmètre et outbox transactionnelle

Status: done

**Complexité :** high

**Épic :** EPIC-027 — Socle `fiscal-service` et gouvernance du paquet fiscal  
**Service :** `fiscal-service` (dépôt `prospera-fiscal-service`, base `origin/dev`)  
**Points :** 8 · **Sprint :** S23 du tracker ; S3 (23/11 → 27/11) de l'amendement du 14/11  
**Assigné à :** Dev B  
**Prérequis :** STORY-295 (`done`, bases cloisonnées), STORY-681 (`done`, outbox), STORY-538 (`done`, registre des dépôts)  
**Origine :** `epics-fiscalite-2026-08-03.md` — AR-07, AR-08 ; spine fiscal AD-10, AD-19, règle « Mutation d'état ».

---

## User Story

En tant qu'**expert-comptable**, je veux pouvoir démontrer qu'aucune trace n'a disparu, afin que la
piste d'audit tienne devant un contrôle.

## Décisions confrontées au code réel (2026-11-14)

- **L'outbox existe déjà.** STORY-681 a posé `outbox_events`, `OutboxService.enqueue(params, session)`
  (session OBLIGATOIRE) et le relais. Cette story ne recrée rien : elle ajoute le journal et le fait
  commiter **dans la même transaction** que l'état métier et l'outbox.
- **Le journal vit dans `fiscal_service_audit`, l'outbox dans `fiscal_service`.** Une transaction
  MongoDB peut couvrir deux bases d'un même réplica set, **à condition de passer par le même
  client**. Or STORY-295 a monté deux connexions Mongoose, donc deux `MongoClient`. ⇒ l'écriture du
  journal passe par le **client de la connexion métier** (`connexion.getClient().db(BASE_AUDIT)`),
  avec la session de la transaction. C'est le même compte `fiscal_app` (vérifié au boot par
  `verifierMemeDeploiement`) : ses droits sur l'audit restent `find` + `insert`. La connexion
  `CONNEXION_AUDIT` reste celle de la santé et des lectures.
- **Le compte applicatif ne peut créer ni collection ni index sur l'audit** (`find` + `insert`
  exactement, verrouillé par la conformité de 295). La collection `journal_audit`, son validateur et
  l'index unique `(perimetre, seq)` sont donc posés par le **provisionnement** (`mongo/provisionner-comptes.mongosh.js`,
  exécuté à chaque démarrage, idempotent : `createCollection` si absente, sinon `collMod` ;
  `createIndex` est idempotent). Le service n'en dépend pas pour démarrer, mais une insertion sans
  index ne serait plus protégée contre la fourche : la conformité le prouve par le comportement.
- **Pilote native, pas Mongoose, pour le journal** : un modèle Mongoose sur `useDb` tenterait
  `createCollection` / `createIndex` au boot (code 13). L'adaptateur écrit par
  `collection.insertOne(doc, { session })` et lit par `find`.
- **Aucune obligation n'existe encore** (elles arrivent avec STORY-305). Le périmètre est donc une
  chaîne générique `"<type>:<id>"`. Le **premier consommateur réel** est le registre des dépôts
  (STORY-538/681) : chaque transition d'un dépôt écrit son entrée dans le périmètre `depot:<id>`.
  Sans ce branchement le journal serait du code mort.
- **Donnée personnelle de tiers** (AD-21, STORY-681 AC-3) : le journal est ineffaçable pendant dix
  ans. Il n'y copie **jamais** le signataire ni un motif libre : il porte l'acte, le statut, la date
  du fait, l'auteur (identifiant du jeton) et l'**empreinte sha256** du contenu de la transition.

## Périmètre inclus

- Domaine pur `src/domain/audit/chaine-audit.ts` : empreinte canonique (JSON à clés triées, sha256,
  préfixe `sha256:`), entrée suivante (`seq = dernier + 1`, `empreintePrecedente = dernier.empreinte`
  ou la constante `GENESE`), vérification d'une chaîne qui **nomme** la première rupture.
- Port `JournalAudit` (`src/ports/journal-audit.ts`) : `ajouter(entree, session)`,
  `chaine(orgId, perimetre)` ; adaptateur Mongo natif sur `fiscal_service_audit.journal_audit`.
- Unité de travail transactionnelle (`src/adapters/mongo/unite-de-travail.ts` ou équivalent) :
  ouvre la session sur la connexion métier, exécute l'écriture métier + l'audit + l'outbox, commit ;
  abort gardé en cas d'échec (patron de `MongoRegistreDepots.transitionner`).
- Course sur un même périmètre : le serveur rejette la seconde écriture au même `seq`
  (`WriteConflict` 112 tant que la première n'a pas commité, `11000` sur l'index sinon). L'unité de
  travail (`session.withTransaction`) **rejoue la transaction entière** sur `WriteConflict` : le
  dernier `seq` ET la condition métier sont relus — la course finit en séquence (n+1, n+2) ou en refus
  métier, jamais en fourche. Un `11000` sur l'index devient `AUDIT_CHAINE_CONCURRENTE` (409). Les
  autres erreurs transitoires remontent telles quelles (règle C4 de 681).
- Branchement du registre des dépôts : `inserer` (TRANSMISE) et `transitionner` (ACCEPTEE, REJETEE)
  écrivent leur entrée d'audit dans la transaction. Le chemin sans événement devient lui aussi
  transactionnel (dépôt + audit = deux documents).
- Route de vérification gatée `GET /v1/depots/:id/audit` (Swagger) :
  `{ perimetre, intacte, nombreEntrees, rupture?, entrees }`, avec la portée du dépôt lui-même
  (`DepotsService.consulter` : autre organisation ou dossier hors portée = 404 `DEPOT_INTROUVABLE`).
  Une route générique par type de périmètre attendra les obligations (sa portée dépend du type).
- Provisionnement : collection, validateur `$jsonSchema` (champs obligatoires et types), index unique.

## Hors périmètre

- Obligations, leur machine à états et leur journal (STORY-305 et suivantes : elles réutiliseront
  ce port tel quel).
- Purge de rétention et sauvegarde séparée (AD-19, exploitation).
- Ancrage externe de la chaîne (horodatage qualifié), signature des entrées.
- Rejeu automatique sur course perdue : le refus est rendu, l'appelant réessaie.
- Journalisation des refus d'habilitation : STORY-300 l'appuiera sur ce port.

## Critères d'acceptation

- [x] **AC-1 — Chaînes indépendantes.** Deux transitions concurrentes sur **deux périmètres
  différents** réussissent toutes deux (Mongo réel, `Promise.all`) ; chacune a son `seq` 1.
- [x] **AC-2 — Pas de fourche.** Deux sessions sur le **même** périmètre visant le même `seq` :
  le serveur rejette la seconde (`WriteConflict`), la chaîne compte un document par `seq` et reste
  intacte ; un doublon commité est refusé `11000` par l'index nommé. Par l'unité de travail, N
  écritures concurrentes se sérialisent en `seq` 1..N, chaîne intacte. Prouvé sur Mongo réel.
- [x] **AC-3 — Vérification nommée.** `verifierChaine` rend `intacte: true` sur une chaîne saine, et
  nomme la première rupture : `SEQ_MANQUANTE`, `SEQ_DUPLIQUEE`, `EMPREINTE_PRECEDENTE_ROMPUE`,
  `EMPREINTE_ALTEREE`, avec le `seq` concerné. La route HTTP rend la même chose.
- [x] **AC-4 — Atomicité.** Une transition métier qui échoue après l'écriture de l'audit (ou de
  l'outbox) annule tout : ni entrée d'audit, ni message d'outbox, ni changement d'état. Prouvé sur
  Mongo réel en faisant échouer l'étape suivante.
- [x] **AC-5 — Premier consommateur.** Transmettre puis accepter un dépôt produit deux entrées
  `depot:<id>` (seq 1 et 2), chaînées, sans signataire ni motif en clair, et l'événement
  `fiscal.declaration.deposee` dans la même transaction que l'acceptation.
- [x] **AC-6 — Ineffaçable.** Le compte applicatif reste à `find` + `insert` sur l'audit (conformité
  295 inchangée et verte) ; l'index unique est prouvé par un doublon refusé `11000`.
- [x] **AC-7 — Cloisonnement.** La route de vérification d'un périmètre d'une autre organisation
  rend 404 ; elle est derrière `@RequiresFiscalAccess`.

## Tâches

- [x] T1 — Domaine `chaine-audit.ts` + tests unitaires exhaustifs (empreinte stable à l'ordre des
  clés, genèse, chaque nature de rupture).
- [x] T2 — Port `JournalAudit`, adaptateur natif, unité de travail, traduction de la course.
- [x] T3 — Provisionnement : collection, validateur, index ; idempotent sur volume existant.
- [x] T4 — Branchement du registre des dépôts ; double mémoire des tests mis à jour.
- [x] T5 — Module, contrôleur de vérification, DTO Swagger, e2e (mémoire).
- [x] T6 — Conformité Mongo réel : AC-1, AC-2, AC-4, AC-6 dans `test/*.conformite-spec.ts`.
- [x] T7 — Mutations, porte qualité, Docker réel, docs.

## Table de mutations obligatoire

| ID | Mutation volontaire | Témoin rouge attendu |
|---|---|---|
| M1 | retirer l'index unique du provisionnement | conformité AC-2 : deux `seq` identiques acceptés |
| M2 | écrire l'audit hors session | conformité AC-4 : entrée survivante après abort |
| M3 | ignorer `empreintePrecedente` dans l'empreinte | unitaire AC-3 : `EMPREINTE_PRECEDENTE_ROMPUE` non détectée |
| M4 | trier les clés différemment / ne pas canonicaliser | unitaire : empreinte instable |
| M5 | traduire toute erreur étiquetée en course perdue | unitaire : seule 112 est un conflit |
| M6 | copier le signataire dans l'entrée | unitaire AC-5 : donnée personnelle absente |
| M7 | ne pas filtrer la lecture du journal par `orgId` | unitaire adaptateur : filtre `orgId` |
| M7s | lire la piste sans passer par `consulter` (portée) | unitaire service : `DEPOT_INTROUVABLE` |
| M8 | retirer la trace de la transition d'un dépôt | unitaire registre : ordre `transition, audit, commit` |

## Exigences techniques et garde-fous

- `src/domain/` n'importe ni `@nestjs/*` ni `mongoose` (invariant testé par STORY-361) ;
  `node:crypto` est admis (déjà employé hors domaine ; si l'invariant l'interdit, injecter la
  fonction de hachage).
- Entrée : `{ perimetre, seq, orgId, acte, acteur, survenuLe, enregistreLe, contenu: { …champs non
  personnels }, empreinteContenu?, empreintePrecedente, empreinte }`. `empreinte` couvre **tous** les
  champs sauf elle-même. `GENESE = 'sha256:' + '0'.repeat(64)`.
- Lecture du dernier `seq` **dans la transaction** (`find({perimetre}).sort({seq:-1}).limit(1)` avec
  la session). L'index unique tranche la course ; aucune verrou applicatif.
- Ne pas toucher à `ACTIONS_AUDIT_AUTORISEES` : la conformité 295 doit rester verte telle quelle.
- `estConflitEcriture` existe déjà dans `mongo-registre-depots.ts` : le déplacer dans un utilitaire
  partagé plutôt que le dupliquer.

## Tests

- Unitaires Jest (domaine, adaptateur avec doubles, service), e2e Jest (`test:e2e`, registre mémoire).
- Conformité contre `mongo-fiscal` réel (`npm run test:conformite`, port 27020, `rs-fiscal`). Le
  bloc compose `mongo-fiscal` n'est plus dans le `docker-compose.yml` racine (non versionné) : le
  relancer par `docker run` sur `mongo:7` avec les scripts de `mongo/`, comme STORY-295.
- Porte : `npm run lint && npm run build && npm run test:cov && npm run test:e2e`.

## Definition of Done

- [x] Branche `MNV-299` depuis `origin/dev`, PR vers `dev` ; fiche et tracker par PR sur `main`.
- [x] Porte qualité verte ; conformité réelle verte ; M1 à M8 rouges puis restaurées.
- [x] Docker arrêté après le gate.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, confrontée au code
d'`origin/dev` `f48c62c`.

**2026-11-14 — implémentation.**
- Domaine `domain/audit/chaine-audit.ts` (forme canonique à clés triées, empreinte sha256 couvrant
  tous les champs dont la précédente, `GENESE`, vérification qui nomme la première rupture parmi
  `SEQ_MANQUANTE`, `SEQ_DUPLIQUEE`, `EMPREINTE_PRECEDENTE_ROMPUE`, `EMPREINTE_ALTEREE`,
  `PERIMETRE_MELANGE`) ; `domain/depot/audit-depot.ts` (fait audité d'une transition : signataire
  par sa seule présence, motif par son empreinte).
- `adapters/mongo/mongo-journal-audit.ts` (pilote natif, client de la connexion MÉTIER, `insertOne`
  + `find` seulement) ; `adapters/mongo/transaction-mongo.ts` (unité de travail `withTransaction`,
  `estConflitEcriture` déplacé ici, `estDoublon`) ; `MongoRegistreDepots` : insertion et transitions
  tracées dans la transaction, l'outbox d'`ACCEPTEE` dans la même.
- `GET /v1/depots/:id/audit` (`AuditDepotsService`, `PisteAuditResponseDto`).
- Provisionnement : collection `journal_audit`, validateur `$jsonSchema` (`additionalProperties:
  false`, empreintes `^sha256:[0-9a-f]{64}$`, `seq ≥ 1`), index unique `chaine_par_perimetre` ;
  idempotent (2ᵉ démarrage : « remise en conformité » par `collMod`). Un test relie les noms du
  script mongosh aux constantes du service.

**2026-11-14 — preuves.**
- Conformité sur MongoDB réel (`mongo:7`, `rs-fiscal`, comptes provisionnés par les scripts du
  dépôt, volume neuf) : **19/19** (9 de STORY-295 + 10 nouveaux : AC-1, AC-2 ×3, AC-4 ×2, AC-6 ×2,
  AC-5 registre réel ×2 dont la course de deux transmissions → une seule passe, `DEPOT_EN_COURS`,
  aucune trace orpheline).
- Mutations M1 à M8 rouges puis restaurées à l'octet (M1 sur volume neuf : sans l'index, 3 tests de
  fourche rougissent). Deux mutations ne compilaient pas au premier essai (« 0 test ») : réécrites
  pour compiler, puis rouges.
- ⚠️ Poste : `core.autocrlf=true` sort les JSON des paquets de dépôt en CRLF et casse leurs
  empreintes (`PAQUET_DEPOT_INTEGRITE` au chargement de l'e2e) ; remis en LF dans l'arbre de travail
  seulement, rien de commité. Le générateur de « barrels » de l'IDE recrée des `index.ts` à chaque
  fichier neuf : supprimés avant chaque porte, jamais indexés.

**2026-11-14 — clôture.** Suite unitaire complète en `-w 2` : **1882/1882** (en parallèle complet,
4 suites xlsx/livrable de STORY-537, sensibles au temps, rougissent sous la charge de ce poste et
sont vertes isolées : 141/141). Lint sans erreur, build vert, couverture 100 % sur chaque fichier
neuf, e2e 128/128. Code `189f8cb` → PR `prospera-fiscal-service#22` rebase-mergée sur `dev`
(`ab79274`). Docker de conformité arrêté.

