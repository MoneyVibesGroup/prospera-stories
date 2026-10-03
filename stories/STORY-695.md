# STORY-695 : microfinance, assurance et document-service appliquent la portee par collaborateur du contrat dossier.*

Status: ready-for-dev

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

- [ ] AC-1 — Le read-model `dossier` du service porte l'affectation (champs déclarés au schéma,
      `default: undefined`, projetés en `$set`/`$unset` — patron `miseAJourDossier` de bilan-service),
      fail-closed sur un message antérieur ou mal formé (D-683-3).
- [ ] AC-2 — Le garde de portée applique la règle de `filtrePortee` **dans le filtre de requête** ; refus =
      le 404 existant du garde, corps identique à un dossier inexistant.
- [ ] AC-3 — e2e par balayage des routes du garde, jeton `TENANT_USER` non affecté ; mutation de la garde ⇒
      rouge (patron `bilan-dossier-portee-collaborateur.e2e-spec.ts`).
- [ ] AC-4 — Toute route qui lit les données d'un AUTRE dossier que `:dossierId` est relevée et couverte
      (leçon D-683-7).
- [ ] AC-5 — Vérification docker, dont un message `dossier.updated` antérieur injecté dans Kafka (patron
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

<!-- À compléter par la session. -->

## Progress Tracking

**2026-10-03** — statut laissé à `ready-for-dev` (en-tête et `sprint-status.yaml` à synchroniser par la session). microfinance-service et assurance-service : dev terminé, portes
vertes, mutations rouges ; branches non poussées. Vérification docker (AC-5) **non faite** : scénario
écrit, à rejouer en session. document-service : voir sa section.

**2026-10-02** — `ready-for-dev`. Créée à la clôture de STORY-683 (AC-4). Découpage par service possible.
