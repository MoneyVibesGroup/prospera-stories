---
baseline_commit: ab79274d76a42acea4bd74318903a5a79f58d0b1
---

# STORY-298 : Statut de validation des éléments et rattachement version ↔ exercice

Status: done

**Complexité :** medium

**Épic :** EPIC-027 — Socle `fiscal-service` et gouvernance du paquet fiscal  
**Service :** `fiscal-service` (dépôt `prospera-fiscal-service`, base `origin/dev`)  
**Points :** 5 · **Sprint :** S23 du tracker ; S3 (23/11 → 27/11) de l'amendement du 14/11  
**Assigné à :** Dev B  
**Prérequis :** STORY-297 (`done`, chargeur de paquet), STORY-299 (`done`, journal d'audit chaîné), STORY-539 (`done`, read-model des exercices)  
**Origine :** `epics-fiscalite-2026-08-03.md` — FR-F69, FR-F70 ; PRD fiscalité §7.13 et risque « Périmètre de la validation experte ».

---

## User Story

En tant qu'**expert-comptable**, je veux savoir si un montant repose sur une donnée validée par un
expert, afin de ne pas déposer sur la foi d'une amorce.

## Décisions confrontées au code réel (2026-11-14)

- **Le paquet n'a aujourd'hui qu'un statut GLOBAL et en texte libre** : `_meta.statut =
  "a-valider-par-expert"`, plus quelques `statut` épars (`a_confirmer`, `COMPLET (…)`). Aucun
  valideur, aucune date. FR-F69 exige « à valider / validé par expert, daté ». ⇒ **convention
  structurée** dans l'artefact : `_meta.validations = [{ chemin, statut: "VALIDE", par, le }]`.
  Un élément est validé si lui-même ou un de ses ancêtres porte une entrée `VALIDE` **complète**
  (valideur et date) ; tout le reste est `A_VALIDER` — fail-closed. Les `statut` en texte libre ne
  valident rien : ils sont rendus comme `mention`. Le paquet actuel n'est pas modifié : il n'a
  aucune validation, il est donc entièrement `A_VALIDER`, ce qui est exact. Basculer des éléments
  en `VALIDE` est une **action de données** (nouvelle version publiée, FR-F68), pas du code.
- **Aucune obligation n'existe encore** (STORY-305). Le « signalement visible sur l'obligation »
  est livré comme fonction du domaine `signalementsNonValides(paquet, chemins)` que la dérivation
  appellera, et exposé dès maintenant par une route de lecture.
- **Le read-model des droits ne garde que la version courante** : une publication 2026.2 remplace
  2026.1 dans `org_fiscal_entitlements`. Le rattachement doit donc **mémoriser la version
  elle-même** (`code`, `version`, `checksum`, `artifactUri`) : l'objet MinIO est immuable, le
  paquet de l'exercice reste chargeable et vérifiable après le remplacement.
- **Moment du rattachement** : à la projection d'un exercice nouveau et `OUVERT` (c'est l'ouverture
  vue par ce service), dans la transaction de la projection, s'il existe une version unique
  octroyée ; sinon à la première résolution du paquet de l'exercice. Année du paquet = année UTC
  de la `fin` de l'exercice. Type de paquet = `typeEntite` du dossier en minuscules
  (`ENTREPRISE` → `entreprise`, code `fiscal-tg-entreprise`).
- **Recalcul** : action explicite, motivée, tracée au journal de STORY-299 (périmètre
  `exercice:<id>`, motif par son empreinte). Il re-rattache l'exercice à la version courante.
  Refusé `RECALCUL_DECLARATION_DEPOSEE` (409) si une liasse de cet exercice est déposée : un dépôt
  `ACCEPTEE` du dossier dont le jeu d'états (`bilan-service`, champ `exerciceId` déjà exposé) est
  cet exercice. Un jeu sans `exerciceId` compte comme déposé pour l'exercice (doute ⇒ refus).

## Périmètre inclus

- Domaine `domain/paquet-fiscal/validation-paquet.ts` : lecture de `_meta.validations` (entrées
  mal formées ignorées et nommées), `statutElement`, `signalementsNonValides`.
- Domaine `domain/paquet-fiscal/selection-version.ts` : choix de la référence octroyée unique
  (extrait de `PaquetsService.charger`, comportement inchangé) et code du paquet d'un dossier.
- `PaquetsService` : chargement par référence explicite (`chargerReference`) réutilisé par
  l'exercice ; la route existante ajoute un résumé `validation` à sa réponse.
- `GET /v1/paquets-fiscaux/:type/:pays/:annee/validation?chemins=a.b,c` : statut de chaque élément.
- Collection `rattachements_paquet_exercice` (unique par `exerciceId`), service de rattachement,
  appel à la projection d'exercice, audit `PAQUET_RATTACHE`.
- `GET /v1/exercices/:exerciceId/paquet-fiscal` : la version rattachée, son contenu vérifié, et la
  version courante si elle diffère (information, jamais appliquée).
- `POST /v1/exercices/:exerciceId/paquet-fiscal/recalcul` `{ motif }` (TENANT_ADMIN) :
  re-rattachement tracé, `RECALCUL_DECLARATION_DEPOSEE`, `RECALCUL_SANS_OBJET`, portée du dossier.
- `JeuDepose.exerciceId` lu chez `bilan-service` ; `RegistreDepots.acceptesDuDossier`.

## Hors périmètre

- Bascule des éléments du paquet Togo 2026 en `VALIDE` (action de données du PO, nouvelle version).
- Recalcul des montants : il n'existe aucun montant calculé dans ce service avant EPIC-029.
- Écran : la console fiscale du cabinet consommera ces routes plus tard.

## Critères d'acceptation

- [x] **AC-1 — Statut par élément.** Un élément sans validation complète (lui ou un ancêtre) est
  `A_VALIDER` ; validé ⇒ `VALIDE` avec valideur et date ; une entrée sans valideur ou sans date ne
  valide rien.
- [x] **AC-2 — Signalement nommé.** `signalementsNonValides` rend, pour les éléments utilisés,
  chaque élément non validé avec son chemin ; la route `…/validation` rend la même chose.
- [x] **AC-3 — Rattachement à l'ouverture.** Un exercice nouveau `OUVERT` est rattaché à la
  version octroyée à ce moment ; l'entrée d'audit `PAQUET_RATTACHE` est écrite dans la même
  transaction.
- [x] **AC-4 — Pas d'effet rétroactif.** Après publication d'une version plus récente, l'exercice
  se résout toujours sur sa version rattachée (même empreinte), la plus récente n'est qu'affichée ;
  aucun recalcul automatique.
- [x] **AC-5 — Recalcul explicite et tracé.** Le recalcul exige un motif (400 sinon), re-rattache à
  la version courante et écrit `PAQUET_RECALCULE` (motif par empreinte).
- [x] **AC-6 — Refus sur déclaration déposée.** Une liasse acceptée de l'exercice (ou d'exerciceId
  inconnu) ⇒ 409 `RECALCUL_DECLARATION_DEPOSEE`, rien n'est écrit.
- [x] **AC-7 — Portée.** Exercice d'une autre organisation ou dossier hors portée ⇒ 404
  `EXERCICE_INTROUVABLE`.

## Table de mutations obligatoire

| ID | Mutation volontaire | Témoin rouge attendu |
|---|---|---|
| M1 | une entrée `VALIDE` sans date valide l'élément | unitaire AC-1 |
| M2 | ne pas hériter de la validation d'un ancêtre | unitaire AC-1 |
| M3 | résoudre l'exercice par la version COURANTE | unitaire AC-4 |
| M4 | ne pas consulter les dépôts acceptés avant recalcul | unitaire AC-6 |
| M5 | traiter un jeu sans `exerciceId` comme non déposé | unitaire AC-6 |
| M6 | écraser un rattachement existant à la projection | unitaire AC-3 (`$setOnInsert`) |
| M7 | motif en clair dans l'entrée d'audit | unitaire AC-5 |
| M8 | rattacher à chaque événement d'exercice, pas au seul nouveau | unitaire projection |

## Tests

- Unitaires (domaine, services, adaptateurs), e2e (routes, gardes, 404), conformité Mongo réel si
  la transaction projection + rattachement + audit l'exige.
- Porte : lint, build, couverture, e2e (`-w 2` sur ce poste).

## Definition of Done

- [x] Branche `MNV-298` depuis `origin/dev`, PR vers `dev` fusionnée en rebase ; fiche et tracker
  par PR sur `main` fusionnée en rebase.
- [x] Porte qualité verte ; mutations rouges puis restaurées.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder, confrontée à `origin/dev`
`ab79274` (STORY-299 incluse).

**2026-11-14 — implémentation.**
- Domaine `domain/paquet-fiscal/` : `validation-paquet.ts` (convention `_meta.validations`,
  héritage par l'ancêtre le plus proche, entrées incomplètes ignorées et nommées, `ABSENT` pour un
  élément inexistant, `signalementsNonValides` pour STORY-305), `selection-version.ts` (extrait de
  `PaquetsService`, comportement inchangé), `audit-rattachement.ts` (`PAQUET_RATTACHE`,
  `PAQUET_RECALCULE` avec le motif par son empreinte).
- `PaquetsService` : `referenceCourante`, `chargerReference` (même cache, mêmes contrôles), résumé
  `validation` dans la réponse, `statutsElements` ; route `…/:annee/validation?chemins=`.
- Collection `rattachements_paquet_exercice` (`SchemaTypes.ObjectId`, unique par exercice),
  `MongoRattachementsPaquet` (`$setOnInsert` + trace dans la transaction ; recalcul conditionnel
  sur la version attendue + `$push` à l'historique + trace) ; course perdue d'une première
  résolution = relecture du gagnant, jamais un 500.
- Projection d'exercice : nouveau et `OUVERT` ⇒ rattaché dans la même transaction.
- `GET /v1/exercices/:exerciceId/paquet-fiscal`, `POST …/paquet-fiscal/recalcul` (TENANT_ADMIN) ;
  `JeuDepose.exerciceId` lu chez `bilan-service` ; `RegistreDepots.acceptesDuDossier`.

**2026-11-14 — preuves.**
- Conformité MongoDB réel (`mongo:7`, `rs-fiscal`, volume neuf) : **24/24** (5 nouveaux :
  rattachement unique et tracé, pas de déplacement après publication, deux ouvertures concurrentes
  ⇒ un rattachement et une trace — stable sur 3 passages —, recalcul conditionnel historisé et
  tracé sans motif en clair, recalcul d'une autre organisation sans effet).
- E2E : paquets + exercices 16/16 (dont AC-4 par la route, AC-6 409, AC-7 404 identiques).
- Mutations M1 à M8 rouges puis restaurées (M1 réécrite une fois : la première forme ne compilait
  pas).

**2026-11-14 — clôture.** Lint sans erreur, build vert, unitaires 1947/1947 (`-w 2`), e2e 140/140.
Code `551831f` → PR `prospera-fiscal-service#23` rebase-mergée sur `dev` (`5963420`). Docker de
conformité arrêté.

