# STORY-694 : balance-service applique la portee par collaborateur du contrat dossier.*

Status: ready-for-dev

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

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-683 (AC-4).
