# STORY-695 : microfinance, assurance et document-service appliquent la portee par collaborateur du contrat dossier.*

Status: done

**Épic :** EPIC-012
**Service :** `microfinance-service`, `assurance-service`, `document-service`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** AC-4 de STORY-683 (2026-10-02).

---

## Le fait

STORY-683 a fait appliquer par `bilan-service` la **portée par collaborateur** de `dossier-service`
(`filtrePortee` : admin = toute l'organisation ; collaborateur = responsable ou contributeur, jamais
« Mon cabinet »), localement, à partir de l'affectation désormais publiée sur `dossier.*`
(`responsableUserId`, `contributeursUserIds`, D-683-1..5). Ce service doit s'aligner sur la même règle.

🔒 Le relevé technique (fichiers, routes concernées) n'est **pas** publié dans ce dépôt public : il est
tenu en local par l'équipe (`PROSPERA/tmp/securite-683-suites/`).

## Critères d'acceptation

- [x] AC-1 — Le read-model `dossier` du service porte l'affectation (champs déclarés au schéma,
      `default: undefined`, projetés en `$set`/`$unset` — patron `miseAJourDossier` de bilan-service),
      fail-closed sur un message antérieur ou mal formé (D-683-3).
- [x] AC-2 — Le garde de portée applique la règle de `filtrePortee` **dans le filtre de requête** ; refus =
      le 404 existant du garde, corps identique à un dossier inexistant.
- [x] AC-3 — e2e par balayage des routes du garde, jeton `TENANT_USER` non affecté ; mutation de la garde ⇒
      rouge (patron `bilan-dossier-portee-collaborateur.e2e-spec.ts`).
- [x] AC-4 — Toute route qui lit les données d'un AUTRE dossier que `:dossierId` est relevée et couverte
      (leçon D-683-7).
- [x] AC-5 — Vérification docker, dont un message `dossier.updated` antérieur injecté dans Kafka (patron
      `tmp/verif-docker-683/p7_projection.py`).

## Notes

- Mise en production : voir [[STORY-696]] (republication de l'affectation des dossiers existants).
- Voir [[STORY-683]].

## Décisions

- **D-695-1** — Le read-model `dossiers_dossier` de microfinance-service et d'assurance-service réplique
  l'affectation publiée sur `dossier.*` (`responsableUserId`, `contributeursUserIds`), champs déclarés au
  schéma avec `default: undefined`, projetés en `$set`/`$unset` (calque de `miseAJourDossier`).
- **D-695-2** — Affectation absente (message antérieur) ou mal formée ⇒ projetée comme **inconnue**
  (clés effacées), message consommé et journalisé (`warn`) : *fail-closed*, jamais de message bloquant.
- **D-695-3** — Le garde de portée applique la règle `filtrePortee` de `dossier-service` **dans le filtre de
  requête** : `TENANT_ADMIN` (lu dans `roles`, comme `dossier-service`) ⇒ toute l'organisation ; tout autre
  porteur ⇒ responsable ou contributeur, jamais « Mon cabinet » ; identifiant de porteur non conforme ⇒
  aucun dossier. Refus = le 404 existant, corps identique à un dossier inexistant.
- **D-695-4** — e2e par balayage des contrôleurs gardés, routes découvertes par métadonnées, témoin de
  traversée en fin de chaîne, compteurs exacts.
- **D-695-5** — AC-4 : relevé des routes susceptibles de lire un autre dossier que celui du chemin ;
  rendu opposable par un test d'invariant (handler par handler, DTO d'entrée, lecteurs du read-model).
- **D-695-6** — document-service : la porte de dossier applique la même règle ; le **rejeu** d'un dépôt,
  qui rend une pièce existante, revérifie la portée sur le dossier DE LA PIÈCE (patron D-683-7).
- **D-695-7** — document-service : le rattachement d'une pièce déjà rattachée garde sa réponse 409 (écriture
  atomique, aucune donnée d'un autre dossier n'est rendue ni modifiée) — choix assumé en revue, plutôt qu'un
  404 qui obligerait à relire la pièce hors de l'écriture atomique.

## microfinance-service

- Branche `MNV-695` (non poussée) : `feb5ab9`, `00af29b`, `b1efa89`.
- AC-1 / AC-2 : alignement de la portée livré (read-model, projection, garde).
- AC-3 : balayage de 9 contrôleurs, **52 routes** (49 ouvertes aux collaborateurs, 3 réservées à
  l'administrateur), 4 cas par route — 209 tests.
- AC-4 : aucune route ne sert un autre dossier que celui du chemin ; invariant opposable en place.
- Portes : lint 0 warning · build OK · `test:cov` 141 suites, 2 787 tests verts (1 ignoré, préexistant) ·
  couverture 99,39 % lignes / 95,67 % branches / 98,47 % fonctions / 99,36 % statements · `test:e2e`
  15 suites, 593 verts (83 ignorés : suites Mongo réel sans URI, préexistant).
- Mutations : 12 mutations de contrôle, toutes rouges.

## assurance-service

- Branche `MNV-695` (non poussée) : `33d6f7e`, `7d0a79e`.
- AC-1 / AC-2 : alignement de la portée livré (read-model, projection, garde).
- AC-3 : balayage de 7 contrôleurs, **34 routes** (toutes ouvertes aux collaborateurs), 4 cas par route —
  137 tests.
- AC-4 : aucune route ne sert un autre dossier que celui du chemin ; deux routes de catalogue
  réglementaire, sans paramètre, nommées comme exceptions dans l'invariant.
- Portes : lint 0 warning · build OK · `test:cov` 108 suites, 2 081 tests verts · couverture 99,66 % lignes
  / 94,69 % branches / 99,19 % fonctions / 99,61 % statements · `test:e2e` 9 suites, 339 verts.
- Mutations : 13 mutations de contrôle, toutes rouges.

## document-service

- Branche `MNV-695` (dépôt `prospera-ocr-service`) : `5b9e6e5`, `4854139`, `8bcbdc1`, `302283c` (revue).
- AC-1 / AC-2 : alignement de la portée livré (read-model, projection, porte de dossier).
- AC-3 : e2e de portée route par route — 61 tests ; témoin de traversée.
- AC-4 : le rejeu d'un dépôt est revérifié sur le dossier de la pièce (D-695-6).
- Portes : lint 0 warning · build OK · `test:cov` 75 suites, 821 tests verts · couverture 99,09 % statements /
  93,84 % branches / 98,28 % fonctions / 99,12 % lignes · `test:e2e` 11 suites, 181 verts.
- Mutations : 11 mutations de contrôle rouges (+ 1 de revue).

## Progress Tracking

**2026-10-03** — statut laissé à `ready-for-dev` (en-tête et `sprint-status.yaml` à synchroniser par la session). microfinance-service et assurance-service : dev terminé, portes
vertes, mutations rouges ; branches non poussées. Vérification docker (AC-5) **non faite** : scénario
écrit, à rejouer en session. document-service : voir sa section.

**2026-10-02** — `ready-for-dev`. Créée à la clôture de STORY-683 (AC-4). Découpage par service possible.

**2026-10-03 — ✅ `done`. Intégrées : `prospera-microfinance-service#16` (`1a18747`),
`prospera-assurance-service#14` (`26b01f9`), `prospera-ocr-service#20` (`ef7eaf0`).**

- **Dev** : sous-agents `opus` en worktrees (reprise après une limite de session, commits d'étape repliés),
  puis critique de complétude.
- **Revue de code (⑥)** — 0 bloquant ; corrigés : un mutant survivant sur le rejeu (test renforcé,
  `302283c`) ; le double de filtre des e2e de microfinance et d'assurance ne prend plus en charge un
  opérateur qu'aucun garde n'émet (`1d6932e`, `b806e09`). D-695-7 tranché en revue.
- **Revue de sécurité (⑦)** — **0 constat**.
- **Portes sur l'état final** (rejouées en session) : microfinance 2 787 unitaires / 593 e2e, assurance
  2 081 / 339, document 821 / 181 — seuils tenus, toutes vertes.
- **Vérification docker** (stack neuve, code servi prouvé dans les trois conteneurs) : **264 OK / 0 KO** —
  projection, porte route par route avec témoins positifs, « Mon cabinet », rejeu d'un autre dossier, messages
  antérieur et mal formés injectés dans Kafka, invariants. Audit sceptique : compléments **rejoués en
  session** (**53 OK** ; 2 KO de mon script — filtre au mauvais type sur document-service, qui stocke ses
  identifiants en chaîne — repris avec les mêmes attentes) : branche « responsable » exercée par un
  collaborateur dans les trois services, message porteur d'un responsable sans contributeurs ⇒ affectation
  inconnue, rejeu d'une pièce de son propre dossier par un collaborateur ⇒ même extraction, aucune création.
- ⚠️ Mise en production : [[STORY-696]] (republication de l'affectation des dossiers existants).

