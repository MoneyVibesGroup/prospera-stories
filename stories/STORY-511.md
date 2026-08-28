# STORY-511 : Socle `assurance-service` — et l'amorce est publiée comme telle, partout

Status: ready-for-dev

**Épic :** EPIC-128 — Socle vertical CIMA
**Service :** `assurance-service` (nouveau)
**Points :** 13 · **Sprint :** S20
**Prérequis :** ⛔ **STORY-488** (CIMA entre au contrat canonique de balance) · **STORY-533** · **STORY-422**
**Origine :** découpage `epics-assurance-2026-08-27.md`, spine AD-6/AD-7/AD-8/AD-10.

---

## Le fait

`cima-assurances@1.0` est packagé et fonctionne : 80 comptes de l'article 431 (2 chiffres, libellés
verbatim), 25 postes, 25 mappings, 4 agrégats en `FORMULE` (`CAT`, `CPT`, `RT`, `RN`) avec leurs
`role`. *(Lu dans l'artefact le 2026-08-27.)*

Et il est une **amorce**, ce que son auteur a écrit **dans les libellés eux-mêmes** :
> `RT` — *« Résultat technique (amorce — hors variations de provisions techniques et séparation
> Vie/Non-Vie) »*

⛔ **C'est le point le plus important de tout ce vertical : un résultat technique faux publié SANS
son statut serait le pire livrable du programme.** Un assureur lit « résultat technique » et agit.

## Critères d'acceptation

- [ ] AC-1 — Scaffold sur le moule commun (NestJS, config, Swagger, health, docker, outbox), gate
      `@RequiresAssuranceAccess` dans l'ordre e-mail → KYC → entitlement, habilitation exigeant
      `cima-assurances` (STORY-533 AC-3).
- [ ] AC-2 — Dossier (AD-6) et exercice du dossier (AD-7). Hors portée ⇒ **`404`, jamais `403`**.
      La garde d'exercice clos interroge `exercices_dossier`, **pas** `exercices_atelier`.
- [ ] AC-3 — Le référentiel résolu est celui du **dossier** (AD-8). ⛔ Sans STORY-488, l'axe `CIMA`
      existe au dossier et pas au contrat de balance ⇒ `500` : cette story ne démarre pas avant.
- [ ] AC-4 — ⛔ **Le statut d'amorce est publié partout où le référentiel est servi** : au contrat,
      dans l'enveloppe de réponse, et à l'écran. Un test vérifie qu'aucune route ne rend un poste
      `RT` sans son statut.
- [ ] AC-5 — ⚠️ **Aucune constante `XOF`** : la zone CIMA couvre 14 États, dont des pays hors franc
      CFA. La devise vient du contrat canonique (STORY-489).
- [ ] AC-6 — ⛔ **Aucun calcul actuariel n'est écrit dans cette story** (AD-12) : le socle héberge, il
      ne produit pas.

## Notes

- Voir la spine `architecture/architecture-assurance-service-2026-08-27/ARCHITECTURE-SPINE.md`.
