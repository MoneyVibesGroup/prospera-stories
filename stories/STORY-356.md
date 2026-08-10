# STORY-356 : Migration — chaque profil société devient le dossier « Mon cabinet », et `dossierId` devient obligatoire

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **D** · décisions **D1**, **D8**
**Priorité :** Must Have
**Story Points :** 8
**Statut :** 📋 À faire
**Complexité :** high
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service` + `balance-service` + `bilan-service`

---

## Le constat

Toute la donnée comptable déjà produite est keyée `orgId` : profils société, balances, exercices,
liasses figées. Une fois le dossier posé, cette donnée n'appartient plus à personne — il lui manque le
`dossierId` que toutes les nouvelles routes exigeront.

**La fenêtre est maintenant.** La donnée est jeune et peu volumineuse ; chaque semaine de retard ajoute
des balances et des liasses à rattacher **à la main**. C'est le seul point du programme qui **vieillit
mal** : tout le reste peut attendre sans se dégrader, pas celui-là.

**D8 pose la règle** : chaque profil existant devient le dossier « Mon cabinet » de son organisation
(D1), et tout ce qui pendait à l'`orgId` s'y rattache. Après migration, `dossierId` est **obligatoire
partout** — pas « toléré absent », obligatoire.

---

## User Story

En tant qu'**exploitant de la plateforme**,
je veux **que la donnée déjà produite bascule seule sous un dossier**,
afin qu'**aucun cabinet ne perde sa comptabilité et qu'aucune reprise manuelle ne soit nécessaire**.

---

## Ce que la story livre

- **Script de migration idempotent et rejouable** — `npm run migrate:dossiers`, exécutable autant de
  fois que voulu sans effet cumulatif. Trois phases :
  1. **Créer le dossier « Mon cabinet »** pour chaque organisation ayant un `ProfilSociete`, en
     reprenant son identité fiscale, ses 2 axes et son pays, avec `estLeCabinet: true`,
     `responsableUserId` = l'administrateur de l'org, `origine: MIGRATION`.
  2. **Rattacher** balances, ingestions, exercices, cahiers, rapprochements (balance-service) et
     exercices, snapshots de liasse, mappings, hypothèses (bilan-service) au `dossierId` de leur org.
  3. **Vérifier** : zéro document orphelin, puis rendre `dossierId` **requis** au schéma.
- **Attestation de mandat rétroactive** : le dossier du cabinet **n'en porte pas** — un cabinet n'a pas
  besoin d'un mandat pour lui-même (D2 vise le client). La ligne de journal dit « créé par migration ».
- **Rapport de migration** écrit et lisible : nombre d'orgs traitées, dossiers créés, documents
  rattachés par collection, **et la liste des orphelins s'il en reste** — un rapport qui ne dit que le
  succès ne sert à rien.
- **Garde de non-régression** : un test échoue si une collection migrée accepte encore un document
  **sans** `dossierId`.
- **Marche arrière documentée** : le script inverse existe et est testé — il retire `dossierId` et
  supprime les dossiers `origine: MIGRATION` non modifiés depuis. Une migration sans marche arrière
  testée n'est pas une migration, c'est un pari.

## Hors périmètre

- Les **routes** qui exploitent `dossierId` → STORY-236 (balance), STORY-357 (bilan), STORY-358
  (document). Cette story rend la donnée **prête**, elle ne change aucun contrat REST.
- La création du dossier « Mon cabinet » pour les **futures** organisations (à l'activation) →
  **STORY-301**. Ici on ne traite que l'**existant**.
- Les organisations **sans** `ProfilSociete` : elles n'ont aucune donnée comptable à rattacher, leur
  dossier sera créé à l'activation par STORY-301.

---

## Acceptance Criteria

- [ ] Le script est **idempotent** : deux exécutions consécutives produisent exactement le même état
      (mêmes identifiants de dossier, aucun doublon) — vérifié par comparaison des deux rapports.
- [ ] Chaque organisation ayant un `ProfilSociete` a **exactement un** dossier `estLeCabinet: true`,
      portant sa raison sociale, son NIF, son RCCM, son pays et ses 2 axes.
- [ ] **Zéro orphelin** : après migration, aucune balance, ingestion, exercice, cahier, snapshot de
      liasse ou mapping ne subsiste sans `dossierId` — compté **par collection** dans le rapport.
- [ ] `dossierId` est **requis au schéma** dans les collections migrées ; insérer un document sans lui
      → échec de validation Mongoose. *(Un test le prouve pour chaque collection.)*
- [ ] Le rapport liste les orphelins **restants** s'il y en a, et le script **sort en erreur** dans ce
      cas plutôt que de rendre `dossierId` obligatoire sur une base incohérente.
- [ ] Le `responsableUserId` du dossier migré est un administrateur **réel** de l'organisation ; si
      l'org n'en a aucun d'actif, le script le signale au lieu d'inventer.
- [ ] La **marche arrière** restaure l'état antérieur : `dossierId` retiré, dossiers de migration
      supprimés, aucune perte de donnée comptable — vérifié sur un dump réel.
- [ ] Les liasses **déjà figées** ne sont pas recalculées : on ajoute `dossierId`, on ne touche à
      aucun montant. *(Un test compare les checksums de snapshot avant/après.)*

---

## Notes techniques

- **Ordre imposé** : créer les dossiers → rattacher → **vérifier** → rendre requis. Rendre `dossierId`
  requis avant la vérification bloquerait l'écriture sur une base à moitié migrée, sans marche arrière
  possible.
- Le rattachement se fait par `orgId` — c'est la seule clé disponible, et elle est **exacte** tant
  qu'une org n'a qu'un dossier, ce qui est vrai par construction au moment de la migration.
- **Chaque service migre sa propre base** : `dossier-service` crée les dossiers et publie
  `dossier.cree` ; `balance-service` et `bilan-service` exécutent leur phase de rattachement en lisant
  leur read-model. Aucune écriture cross-base, aucun accès d'un service à la base d'un autre
  (invariant #2).
- La migration s'exécute **hors requête HTTP** (commande Nest standalone), pour ne dépendre d'aucun
  jeton et pouvoir tourner sur une base à l'arrêt applicatif.

---

## Dépendances

**Prérequises :** **STORY-301** *(modèle et création de dossier)* · **STORY-353** *(responsable, sans
lequel un dossier migré serait invalide)* · **STORY-355** *(le modèle d'exercice cible)*.
**Débloque :** **STORY-236**, **STORY-357**, **STORY-358** — aucune ne peut exiger `dossierId` avant
que la donnée existante ne le porte.

---

## Definition of Done

- [ ] Lint 0 · build OK sur les trois services.
- [ ] Tests : idempotence, orphelins détectés et bloquants, `dossierId` requis après coup, marche
      arrière, checksums de liasse inchangés.
- [ ] **Répétition sur un dump de la base de dev**, pas sur des fixtures : c'est la seule preuve qui
      compte pour une migration. Rapport joint à la PR.
- [ ] Vérification docker : stack complète relancée **après** migration, parcours Atelier → Bilan
      toujours vert sur un dossier migré.
- [ ] `/code-review`.

---

## Story Points Breakdown

- Phase 1 — création des dossiers depuis les profils (identité, axes, responsable) : 2 pts
- Phase 2 — rattachement dans `balance-service` (6 collections) : 2 pts
- Phase 2 bis — rattachement dans `bilan-service` (4 collections) : 1,5 pt
- Phase 3 — vérification, rapport, passage en `required` : 1 pt
- Marche arrière + tests d'idempotence : 1 pt
- Répétition sur dump réel + vérification docker : 0,5 pt
- **Total : 8 points**
