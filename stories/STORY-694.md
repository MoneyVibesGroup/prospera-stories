# STORY-694 : balance-service applique la portee par collaborateur du contrat dossier.*

Status: done

**Épic :** EPIC-012
**Service :** `balance-service`
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

- **D-694-1** — Le contrat `dossier.*` lu par `balance-service` reçoit l'affectation (`responsableUserId`,
  `contributeursUserIds`) — consommateur seulement, le producteur la publie depuis STORY-683.
- **D-694-2** — Projection *fail-closed*, calque de `bilan-service` : affectation absente (message antérieur)
  ou mal formée ⇒ **inconnue** (les deux clés effacées), message consommé et journalisé — jamais bloquant.
  Champs déclarés au schéma avec `default: undefined`.
- **D-694-3** — Le garde de portée applique `filtrePortee` **dans le filtre de requête** : administrateur ⇒
  toute l'organisation ; tout autre porteur ⇒ responsable ou contributeur, jamais « Mon cabinet » ;
  identifiant de porteur non conforme ⇒ aucun dossier. Refus unique : le 404 existant, corps identique à un
  dossier inexistant.
- **D-694-4** — Une seule fabrique de ce 404, partagée par le garde et le service de portée.
- **D-694-5** — Les routes qui travaillent sur « Mon cabinet » hors du chemin `dossiers/:dossierId`
  (profil de la société, OCR historique, suggestion de comptes, vue du régime) sont réservées à
  l'administrateur par un garde dédié, vérifié en base ; le dossier de rattachement fourni par le corps
  de la requête OCR est confronté à la même portée (défense en profondeur).
- **D-694-6** — La lecture des référentiels utilisés par l'organisation est restreinte, dans la requête,
  aux dossiers de la portée de l'appelant.
- **D-694-7** — Deux invariants : tout contrôleur hors chemin `dossiers/:dossierId` porte le garde dédié ou
  une raison écrite ; tout fichier qui lit « Mon cabinet » est recensé avec sa raison (revue de code).

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-683 (AC-4).

**2026-10-03 — ✅ `done`. `prospera-balance-service#126` rebase-mergée sur `dev` (`4eeb012`).**

- **Dev** : sous-agents `opus` en worktree (une reprise après une limite de session : le travail partiel
  protégé par un commit d'étape, replié ensuite en commits propres), puis critique de complétude :
  « complet ».
- **Revue de code (⑥)** — 0 bloquant ; 2 non-bloquants corrigés (`c607693`) : le contrôle du dossier de
  rattachement OCR, inatteignable tant que la garde de classe est posée, est documenté comme défense en
  profondeur (Swagger ne promet plus un refus qu'il ne rend pas) ; l'invariant de lecture du cabinet
  recense désormais chaque lecteur avec sa raison (2 mutants rouges).
- **Revue de sécurité (⑦)** — **0 constat**.
- **Portes sur l'état final** (rejouées en session) : lint 0, build OK, 4 978 unitaires
  (99,32 / 93,32 / 99,13 / 99,44), 1 785 e2e. Mutations : 14 (dev) + 2 (revue), toutes rouges.
- **Vérification docker** (stack neuve, code servi prouvé par un marqueur lu sur le port) : **125 OK / 0 KO**
  — projection par de vrais PATCH, garde route par route avec témoins positifs sur la même route, routes
  « Mon cabinet », messages antérieur et mal formés injectés dans Kafka. Audit sceptique : 3 compléments
  **rejoués en session** sur une seconde stack neuve (mise en place 44 OK, compléments **19 OK / 0 KO**) :
  branche « responsable » exercée par un collaborateur, exclusion de « Mon cabinet » éprouvée sur une
  balance réelle, message porteur d'un responsable sans contributeurs ⇒ affectation inconnue.
- ⚠️ Mise en production : [[STORY-696]] (republication de l'affectation des dossiers existants).

