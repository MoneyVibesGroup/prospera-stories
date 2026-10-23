# STORY-708 : La liste des envois programmés à venir

Status: done

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service`
**Points :** 2 · **Sprint :** rail F, bloc F2
**Prérequis :** **STORY-637** (envoi programmé, annulable tant qu'il n'est pas parti)
**Origine :** rail F · point ouvert du rail D (« aucune surface ne liste les envois programmés à venir »).

---

## Le récit

En tant que **gestionnaire d'une organisation**, je veux voir ce qui va partir et quand, afin
d'annuler à temps le message que je n'aurais pas dû programmer.

## Le fait

⛔ **L'annulation existe ; ce qu'on annule ne se trouve pas.** STORY-637 a rendu un envoi programmé
annulable tant qu'il est en `prepare`, mais le journal ne sait filtrer que par période, canal, module et
statut : un envoi programmé pour lundi est noyé parmi les `prepare` immédiats de la minute, et aucun
tri ne le fait remonter. Annuler suppose de connaître l'identifiant.

## Critères d'acceptation

- [x] AC-1 — `GET /envois/programmes` rend les envois de l'organisation dont `remettreLe` est **dans le
      futur** et le statut `prepare`, **triés par date de remise croissante**, paginés.
- [x] AC-2 — ⚡ Un envoi dont la date est passée (il est en train de partir) n'y figure plus ; un envoi
      annulé (`ecarte`) non plus.
- [x] AC-3 — Le destinataire est **masqué**, comme au journal (NFR-7).
- [x] AC-4 — Gardée par `notification:journal:consulter`, comme l'annulation qu'elle sert.
- [x] AC-5 — ⛔ Déclarée **avant** `GET /envois/:id` (piège de l'ordre des routes, déjà payé trois fois).

---

## Livré le 2026-10-23 — branche `MNV-708` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 393/3 393 · `npm run test:e2e` 248/248 · lint 0 · build vert.

- `GET /api/v1/envois/programmes` (`EnvoisService.listerProgrammes`) : `statut: 'prepare'` **et**
  `remettreLe` **strictement** futur, à l'instant de la lecture ; tri `remettreLe` puis `_id` — deux
  envois programmés à la même seconde gardent un ordre stable d'une page à l'autre.
- Filtre optionnel par canal ; aucun filtre de statut ni de période : « à venir » est la définition de la
  liste, pas un choix de l'appelant.
- Index **partiel** `{ organizationId, remettreLe, _id }` sur les seuls envois programmés.
- ⚡ Le double de collection de `envois.service.spec.ts` ignorait `$gt` et le tri : il aurait prouvé
  l'ordre d'insertion. Il les honore désormais (aucun test existant n'a rougi). L'e2e prouve la route
  (une page, pas un `404` de `:id`) ; son double ignore les opérateurs, ce que le test dit.
