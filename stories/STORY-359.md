# STORY-359 : Le portefeuille se lit — pagination, recherche, compteurs et prochaine échéance

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — blocs **K** et **P** · décisions **D6**, **D15**, **D16** · question **Q11** *(tranchée)*
**Priorité :** Must Have
**Story Points :** 8
**Statut :** 📋 À faire
**Complexité :** high
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

La maquette FE-D00 montre un portefeuille avec trois compteurs, une recherche, un tri, un filtre
actifs/archivés, et sur chaque carte : le statut d'avancement et **la prochaine échéance**. Aucune de
ces informations n'a de source aujourd'hui.

Deux difficultés distinctes s'y cachent :

1. **L'agrégation.** Une ligne du portefeuille mêle trois services — statut de balance
   (`balance-service`), liasse figée (`bilan-service`), échéance (paquet fiscal). Aucune route ne les
   réunit, et un fan-out par dossier serait un N+1 sur 500 dossiers.
2. **L'échéance.** La donnée **existe** — `paquet-fiscal-togo-2026.json` porte une clé `echeances` —
   mais `grep echeance` sur les contrôleurs de `balance-service/src/modules/fiscal/` ne rend **rien**.
   Le calendrier complet appartient au module Fiscalité (STORY-315/316, sprint 25), soit six sprints
   plus tard. **Q11 a tranché** : on sert ici une **échéance minimale**, délibérément jetable.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **voir mon portefeuille en une page, chercher un dossier et savoir ce qui presse**,
afin de **piloter cinquante dossiers sans en ouvrir un seul**.

---

## Ce que la story livre

- **`GET /dossiers`** paginé, trié, recherché — **côté serveur** :
  `?page&size&tri=nom|activite|etat&q=&statut=actifs|archives`. `size` plafonné serveur (défaut 25,
  max 100). La **portée reste dérivée du jeton** (STORY-353) : `q` filtre, il n'élargit jamais.
- **Recherche** sur raison sociale, NIF et RCCM, **insensible à la casse et aux accents**, sur le NIF
  normalisé de STORY-354 (« 1000 745 307 » trouve « 1000745307 »).
- **Ligne de portefeuille agrégée**, servie sans N+1 : statut du dossier, exercice ouvert, état de la
  balance, état de la liasse, responsable, prochaine échéance. Alimentée par les **read-models locaux**
  (`balance.validee`, `liasse.figee`, `dossier.exercice.*`) — aucun appel REST sortant, aucune
  jointure cross-base.
- **Trois compteurs** calculés **sur la portée de l'appelant**, pas sur l'organisation : `dossiers`,
  `aConfigurer`, `bilansEnCours`. ⚡ Un collaborateur qui lirait « 5 dossiers » alors qu'il en voit 2
  conclurait qu'on lui en cache — un compteur hors périmètre est pire qu'un compteur absent.
- **Échéance minimale (Q11)** : `prochaineEcheance { code, libelle, date, joursRestants }`, dérivée du
  **paquet fiscal déjà chargé** pour le pays et le régime du dossier, et de son exercice ouvert.
  Le champ porte `source: 'PAQUET_MINIMAL'` — pour que le jour où STORY-316 sert le vrai calendrier,
  le remplacement soit **repérable et sans ambiguïté** au lieu d'être deviné.
- **Filtre `statut`** : un dossier archivé **ne remonte jamais** dans la vue « actifs », **même
  cherché par son nom** — sinon « archiver » ne veut plus rien dire (D9).

## Hors périmètre

- Le **calendrier fiscal complet**, ses filtres, ses reports administratifs et ses alertes →
  **STORY-315 / 316 / 317 / 318** (module Fiscalité, sprints 25-26). Cette story ne les remplace pas,
  elle **tient jusqu'à** elles.
- Les **obligations sociales** dans l'échéance → STORY-349.
- L'export du portefeuille (CSV/Excel) → non planifié, aucun besoin exprimé.

---

## Acceptance Criteria

- [ ] `GET /dossiers?page=2&size=10` rend la bonne tranche, avec `total`, `page`, `size` ; `size=500`
      est **plafonné à 100** côté serveur sans erreur.
- [ ] Les trois tris rendent un ordre **déterministe** (départage par `_id` en cas d'égalité) — deux
      appels identiques rendent la même page.
- [ ] `q=kossi`, `q=1000 745 307` et `q=TG-LOM-2019` trouvent tous les trois « Ets Kossi
      Distribution » ; `q=KOSSI` aussi (casse) ; `q=épargne` trouve « Mutuelle d'Épargne Bè » (accents).
- [ ] **Portée** : le même appel, joué par l'admin et par un collaborateur, rend des ensembles
      différents ; `q` ne fait **jamais** apparaître un dossier hors portée. *(Mutation-test : si `q`
      est appliqué avant le filtre de portée, un test rougit.)*
- [ ] Les trois compteurs correspondent **exactement** aux lignes que l'appelant peut voir, filtre
      `statut` compris. *(Test : admin = 5/2/2 ; collaborateur = 2/1/1 sur le même jeu.)*
- [ ] Un dossier archivé n'apparaît **pas** avec `statut=actifs`, **même** en le cherchant par son nom
      exact ; il apparaît avec `statut=archives`.
- [ ] **Aucun N+1** : servir une page de 25 dossiers exécute un **nombre constant** de requêtes Mongo,
      mesuré et asserté — pas « ça a l'air rapide ».
- [ ] **NFR** : sur un jeu de **500 dossiers** semé, la première page rend en **< 2 s** et un
      changement de filtre en **< 500 ms** (aligné sur NFR-F13 du PRD Fiscalité).
- [ ] `prochaineEcheance` porte `source: 'PAQUET_MINIMAL'` et est **absente** (pas nulle, pas zéro)
      quand le paquet du pays n'en fournit pas — un dossier sans échéance connue ne doit pas afficher
      une date inventée.

---

## Notes techniques

- **Read-models locaux dans `dossier-service`** : `EtatBalanceDossier` et `EtatLiasseDossier`,
  alimentés par les événements de `balance-service` et `bilan-service`. C'est ce qui permet la lecture
  en une requête — et c'est aussi ce qui rend le portefeuille **résilient** : si un service amont est
  indisponible, le portefeuille s'affiche avec un état daté, il ne tombe pas.
- Index de lecture : `{ orgId: 1, statut: 1, raisonSociale: 1 }`, `{ orgId: 1, statut: 1, majLe: -1 }`
  et un index **texte** sur `(raisonSociale, nifNormalise, rccm)` — les trois tris et la recherche
  doivent tous être servis par un index, sinon le NFR des 500 dossiers tombe au premier tri.
- L'échéance minimale se calcule à la **lecture**, depuis le paquet déjà en cache
  (`chargerPaquetFiscal`, STORY-078) : aucune persistance, donc aucune donnée à migrer le jour où
  STORY-316 la remplace. C'est ce qui rend l'avance jetable **sans dette**.

---

## Dépendances

**Prérequises :** **STORY-301** *(dossier)* · **STORY-353** *(portée — c'est elle qui définit ce que
compte un compteur)* · **STORY-355** *(exercice ouvert)*.
**Consomme :** les événements de **STORY-236** *(balance)* et **STORY-357** *(liasse)*.
**Sera remplacée en partie par :** **STORY-315 / 316** *(calendrier fiscal complet, sprint 25)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : pagination, plafond de `size`, trois tris déterministes, recherche accents/casse/NIF
      normalisé, portée admin vs collaborateur, compteurs exacts, archivés exclus de la recherche.
- [ ] **Test de charge léger** : 500 dossiers semés, mesure de la première page et d'un changement de
      filtre, chiffres consignés dans la PR.
- [ ] Assertion **explicite** du nombre de requêtes Mongo par page (anti-N+1).
- [ ] Vérification docker : portefeuille servi avec des états venus de deux services distincts, puis
      **un service amont arrêté** — le portefeuille répond toujours, avec un état daté.
- [ ] `/code-review` + `/security-review` (la portée est une frontière).

---

## Story Points Breakdown

- `GET /dossiers` paginé/trié/recherché + index + déterminisme : 2 pts
- Read-models `EtatBalanceDossier` / `EtatLiasseDossier` + consumers : 2,5 pts
- Compteurs scopés + filtre actifs/archivés : 1 pt
- Échéance minimale depuis le paquet fiscal (+ `source`, + absence assumée) : 1,5 pt
- Tests NFR 500 dossiers, anti-N+1, résilience amont : 1 pt
- **Total : 8 points**
