# STORY-357 : `bilan-service` se scope sur le dossier — la liasse cesse d'appartenir au cabinet

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **F** · décision **D5** *(et sa nuance : on ne re-scope que ce qui porte de la donnée de dossier)*
**Priorité :** Must Have
**Story Points :** 5
**Statut :** 📋 À faire
**Complexité :** medium
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `bilan-service`

---

## Le constat

Les dix familles de routes du Bilan lisent l'`orgId` du jeton : `bilan/consultation`, `bilan/etats`,
`bilan/exercices`, `bilan/comparaison`, `bilan/previsionnel`, `bilan/hypotheses`,
`bilan/mapping-overrides`, `bilan/export`, `bilan/audit`, `bilan` *(diagnostics)*.

Tant qu'une organisation valait une société, c'était juste. Avec N dossiers, ces routes rendent **la
liasse d'un client au hasard** — et surtout, la **comparaison inter-exercices** (STORY-074) mélangerait
deux sociétés différentes en croyant comparer deux années. Elle ne planterait pas : elle rendrait un
tableau plausible et faux. C'est le pire mode de panne du produit.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **que la liasse, les états et les comparatifs portent sur le dossier que j'ai ouvert**,
afin de **ne jamais produire la liasse d'un client avec les chiffres d'un autre**.

---

## Ce que la story livre

- **`dossierId` obligatoire** sur toutes les familles listées ci-dessus, porté par le **chemin**
  (`/dossiers/:dossierId/bilan/...`) et non par un paramètre optionnel : un scope facultatif est un
  scope qu'on oublie.
- **Read-model `Dossier`** local, alimenté par `dossier.cree` / `dossier.modifie` /
  `dossier.archive` : nom, statut, type d'entité, référentiel effectif, portée d'affectation.
  Aucun appel REST à `dossier-service` (invariant #2).
- **Portée héritée** : un `TENANT_USER` qui demande un dossier qui ne lui est pas affecté → **404**,
  jamais **403**. La règle est celle de STORY-353, appliquée ici via le read-model — pas réinventée.
- **Refus d'écriture sur dossier archivé** → **409 `DOSSIER_ARCHIVE`** (figer une liasse sur un dossier
  archivé n'a pas de sens).
- **Garde d'homogénéité renforcée** sur la comparaison inter-exercices : STORY-074 vérifiait déjà
  l'homogénéité du **référentiel** ; elle vérifie désormais d'abord que les exercices comparés
  appartiennent **au même dossier** — sinon **409 `COMPARAISON_INTER_DOSSIERS`**.
- **Snapshots de liasse** : `dossierId` est ajouté au `SnapshotLiasse` **sans toucher aux montants**.
  La collection est append-only et jamais migrée : les snapshots anciens portent le `dossierId` posé
  par STORY-356, et leur checksum ne bouge pas.

## Hors périmètre

- Le **moteur** de liasse, les gabarits, les référentiels : rien de comptable ne change ici. Seule la
  clé de lecture change.
- `balance-service` → **STORY-236**. `document-service` → **STORY-358**.
- Les familles **hors dossier** : rien dans `bilan-service` n'est de niveau cabinet, les dix familles
  y passent toutes. *(C'est l'application de la nuance D5 : on a vérifié, pas supposé.)*

---

## Acceptance Criteria

- [ ] Les **dix** familles de routes exigent `dossierId` dans le chemin. Une route sans `dossierId`
      n'existe plus — un test parcourt les contrôleurs et **échoue** s'il en reste une.
- [ ] `GET /dossiers/:dossierId/bilan/consultation` sur un dossier d'une **autre organisation** →
      **404** ; sur un dossier **non affecté** au collaborateur → **404** identique, corps
      **strictement** le même (anti-énumération).
- [ ] Deux dossiers de la même organisation, chacun avec sa liasse 2024 : chaque appel rend **sa**
      liasse. *(Test qui échoue si le scope retombe sur `orgId`.)*
- [ ] `bilan/comparaison` sur deux exercices de **dossiers différents** → **409
      `COMPARAISON_INTER_DOSSIERS`**, avant même le contrôle d'homogénéité de référentiel.
- [ ] Figer une liasse sur un dossier archivé → **409 `DOSSIER_ARCHIVE`** ; la **lecture** reste **200**.
- [ ] Les **checksums** des snapshots figés avant migration sont **inchangés** après cette story.
- [ ] Le read-model `Dossier` converge après consommation des événements ; un dossier archivé côté
      `dossier-service` est archivé côté Bilan **sans redémarrage**.
- [ ] Non-régression : la suite e2e du Bilan (STORY-065 → 074) passe, réécrite sur le nouveau chemin.

---

## Notes techniques

- **Ordre des routes Nest** : `/dossiers/:dossierId/bilan/exercices` introduit un segment paramétré en
  tête. Les routes littérales de chaque famille doivent rester déclarées **avant** leurs routes
  paramétrées — le piège documenté en STORY-123 (`@Patch('me')` avant `@Patch(':id')`) se rejoue ici à
  dix endroits. Un test d'ordre par famille, pas un seul global.
- Le `dossierId` du chemin est **confronté** au read-model et à la portée de l'appelant **avant** toute
  lecture métier ; le filtre Mongo porte `{ orgId, dossierId }`, jamais l'un sans l'autre.
- `TenantScopedRepository` devient `DossierScopedRepository` : la classe force **les deux** clés. Un
  service qui n'aurait migré que la moitié de ses repositories serait invisible à la revue — d'où le
  test qui parcourt les contrôleurs.

---

## Dépendances

**Prérequises :** **STORY-356** *(la donnée porte déjà `dossierId`)* · **STORY-353** *(portée)* ·
**STORY-355** *(cycle de vie de l'exercice)*.
**Liée :** **STORY-236** *(même mouvement côté balance — les deux doivent atterrir dans le même
sprint, sinon le handoff balance → bilan casse)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : deux dossiers avec deux liasses distinctes, 404 anti-énumération, 409 comparaison
      inter-dossiers, 409 archivé, ordre des routes par famille.
- [ ] Vérification docker : parcours complet **balance validée → liasse figée** sur un dossier client
      **et** sur « Mon cabinet », dans la même organisation, sans interférence.
- [ ] `/code-review` + `/security-review` (changement de frontière d'isolation).

---

## Story Points Breakdown

- Read-model `Dossier` + consumer + convergence : 1 pt
- Re-scopage des 10 familles + `DossierScopedRepository` : 2 pts
- Gardes : portée, archivage, comparaison inter-dossiers : 1 pt
- Tests d'ordre de routes + non-régression e2e réécrite : 0,5 pt
- Vérification docker à deux dossiers : 0,5 pt
- **Total : 5 points**
