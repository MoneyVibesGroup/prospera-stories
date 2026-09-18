---
baseline_commit: f953e8e7fc510f13603ced859a56f6686b958496
---

# STORY-295 : Deux bases MongoDB authentifiées et journal techniquement ineffaçable

Status: defined

**Complexité :** high

**Épic :** EPIC-027 — Socle `fiscal-service` et gouvernance du paquet fiscal
**Service :** `fiscal-service`
**Points :** 5 · **Sprint :** S22
**Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** STORY-361 (`done`)
**Origine :** `epics-fiscalite-2026-08-03.md` — AR-02 ; spine fiscale AD-10, AD-19.

---

## User Story

En tant qu'**expert-comptable**, je veux que le futur journal de preuve soit techniquement
ineffaçable, afin qu'aucune évolution future du code ne puisse en supprimer ou réécrire une trace.

## Le fait mesuré et l'arbitrage imposé par le réel

Le Mongo `rs0` mutualisé de la stack n'active aucune authentification. Il n'y existe donc aucun
privilège à restreindre : `update` et `remove` passent pour n'importe quel client. Activer `--auth`
sur cette instance casserait les services existants, dont plusieurs obtiennent leur URI depuis un
`.env` local non versionné.

STORY-238 (`paiement-service`) et STORY-571 (`notification-service`) ont déjà tranché exactement ce
conflit : une **instance dédiée et authentifiée**, portant les deux bases sur un même replica set.
Cette story applique ce patron à `fiscal-service` : `mongo-fiscal`, replica set `rs-fiscal`, bases
`fiscal_service` et `fiscal_service_audit`. Le suffixe `_service` conserve la convention réellement
déployée et la base du scaffold STORY-361 ; les noms `fiscal` / `fiscal_audit` de la spine n'avaient
jamais été confrontés au compose.

Les privilèges MongoDB sont additifs et sans `deny`. Une collection d'audit placée dans
`fiscal_service` hériterait du rôle `readWrite`, donc de `remove`, même si un rôle plus faible était
également déclaré. La séparation de **base** est le contrôle ; une garde applicative ne l'est pas.

## Périmètre inclus

- Instance Docker `mongo-fiscal` dédiée, authentifiée, sur `rs-fiscal`, sans fenêtre anonyme
  joignable depuis le réseau compose.
- Base métier `fiscal_service` en `readWrite` et base protégée `fiscal_service_audit` en
  `find` + `insert` uniquement, pour le même compte applicatif `fiscal_app`.
- Compte de maintenance `fiscal_audit_maint`, `dbOwner` de l'audit, provisionné côté serveur mais
  absent de toute configuration lue par `fiscal-service`.
- Provisionnement idempotent : chaque démarrage remet rôle et comptes à la définition versionnée.
- Deux URI exigées au boot, deux connexions Mongoose, base d'audit sans `autoCreate` ni `autoIndex`.
- Validation fail-fast des noms de bases, du même déploiement et du même compte applicatif.
- Health public couvrant la connexion d'audit et l'égalité du replica set avec la base métier.
- Suite `test:conformite` contre le vrai serveur authentifié ; preuve du refus MongoDB code `13`.

## Hors périmètre

- Schéma, chaîne d'empreintes, index `(perimetre, seq)` et écriture du journal : story AR-07 dédiée.
- Collections métier, obligations, déclarations et read-models : stories suivantes.
- Politique de purge après dix ans : exploitation différée ; aucun job de purge dans le service.
- Secret de production : seuls des défauts de développement explicites vivent dans le compose.
- Modification de l'authentification du Mongo partagé ou migration de ses autres services.

## Critères d'acceptation

- [ ] **AC-1 — Refus serveur.** Avec le compte applicatif, `updateOne`, `deleteOne`, `deleteMany` et
      `drop` sur une collection de `fiscal_service_audit` échouent avec l'erreur MongoDB
      `Unauthorized` code `13`, sans garde applicative.
- [ ] **AC-2 — Droits utiles exacts.** Le même compte lit et insère dans `fiscal_service_audit`, et
      dispose du CRUD complet dans `fiscal_service`. Ses privilèges d'audit sont exactement
      `find` + `insert`, sans `update`, `remove`, `dropCollection` ni `dropDatabase`.
- [ ] **AC-3 — Environnement conforme.** `test:conformite` vérifie un compte réellement authentifié,
      les deux bases sur le même replica set et les droits exacts. Une instance anonyme, un rôle
      élargi ou deux déploiements distincts rendent la suite rouge.
- [ ] **AC-4 — Maintenance hors application.** `fiscal_audit_maint` existe côté serveur mais son nom
      ou son URI dans n'importe quelle variable d'environnement fait échouer le boot. Le service ne
      peut jamais s'authentifier avec ce compte.
- [ ] **AC-5 — Configuration fail-fast.** Les URI nomment exactement `fiscal_service` et
      `fiscal_service_audit`, avec les mêmes hôtes et le même compte. Même base, mauvais nom,
      mauvais hôte ou compte différent sont refusés avant toute écoute HTTP.
- [ ] **AC-6 — Deux connexions et santé.** La connexion d'audit est nommée `audit`, sans création de
      collection/index ; `/api/v1/health` expose `mongodb-audit` et ne le déclare `up` que si les
      deux connexions sont ouvertes sur le même replica set.
- [ ] **AC-7 — Aucun métier anticipé.** Aucune collection ou structure de journal fiscal n'est
      introduite. La collection employée par la conformité est uniquement technique et jetable avec
      le volume de preuve.

## Tâches / Sous-tâches

- [ ] **T1 — Versionner le contrat de cloisonnement** (AC-2, AC-4, AC-5)
  - [ ] Constantes de bases, connexion, comptes, rôle et actions autorisées/interdites.
  - [ ] Validation des noms, du même déploiement/compte et absence du compte de maintenance.
- [ ] **T2 — Câbler les deux connexions** (AC-5, AC-6)
  - [ ] `MONGODB_AUDIT_URI` requise, configuration et `DatabaseModule` à connexion nommée.
  - [ ] `autoCreate: false` et `autoIndex: false` sur l'audit.
- [ ] **T3 — Provisionner MongoDB** (AC-1 à AC-4)
  - [ ] Démarrage en deux phases : boucle locale anonyme, puis `--auth` + `rs-fiscal`.
  - [ ] Script idempotent `create/updateRole` et `create/updateUser`.
- [ ] **T4 — Étendre la santé** (AC-6)
  - [ ] Indicateur audit comparant les `setName` métier/audit.
  - [ ] Unitaires, contrôleur health et e2e mis à jour.
- [ ] **T5 — Prouver sur le serveur réel** (AC-1 à AC-7)
  - [ ] Suite Jest de conformité séparée, jamais mockée ni sautée.
  - [ ] Volumes neufs, rôles interrogés, refus réels, health et absence de schéma métier.

## Table de mutations obligatoire

| ID | Mutation volontaire | Test qui doit rougir |
|---|---|---|
| M1 | ajouter `remove` au rôle d'audit provisionné | conformité : privilèges exacts + suppressions refusées |
| M2 | pointer le service vers le Mongo partagé anonyme | conformité : compte authentifié obligatoire |
| M3 | faire nommer la même base aux deux URI | validation fail-fast des bases distinctes |
| M4 | remplacer le compte applicatif d'audit par le compte de maintenance | validation globale de l'environnement |
| M5 | autoriser `autoCreate` ou `autoIndex` sur la connexion d'audit | invariant du vrai `DatabaseModule` |
| M6 | accepter des hôtes ou comptes différents entre les deux URI | validation du même déploiement et même compte |
| M7 | considérer l'audit sain avec un `setName` différent | spec de l'indicateur `mongodb-audit` |
| M8 | retirer `mongodb-audit` du vrai contrôleur health | invariant/e2e du point de santé |

## Definition of Done

- [ ] Branche `MNV-295` issue de `dev`, PR vers `dev`, rebase-merge.
- [ ] Story synchronisée aux trois emplacements BMAD.
- [ ] Porte unique verte : eslint, build, test:cov, test:e2e.
- [ ] `npm run test:conformite` vert contre `mongo-fiscal` sur volume neuf.
- [ ] M1 à M8 réellement rouges puis restaurées.
- [ ] Revue de code, correctifs, re-vérification Docker et revue de sécurité réalisées.
- [ ] Aucun secret réel lu, affiché ou committé ; aucun identifiant de maintenance dans le service.

## Progress Tracking

**Statut : `defined` (2026-09-18).** Story créée depuis AR-02/AD-10 après clôture de STORY-361.
L'arbitrage déjà ratifié par STORY-238 et STORY-571 est repris : instance Mongo dédiée et
authentifiée, car le `rs0` partagé anonyme ne peut prouver aucun refus de privilège. Branches
`docs/MNV-295` et `fiscal-service/MNV-295` créées et poussées avant le code.

