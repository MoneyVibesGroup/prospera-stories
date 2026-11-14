---
baseline_commit: 08ded31 (prospera-fiscal-service, STORY-305 incluse)
---

# STORY-306 : Activation et désactivation manuelle d'une obligation

Status: done

**Complexité :** low

**Épic :** EPIC-028 — Implantations multiples et catalogue d'obligations dérivé  
**Service :** `fiscal-service` (base `origin/dev`)  
**Points :** 3 · **Sprint :** S24 du tracker ; groupe B du plan du 14/11  
**Assigné à :** Dev B  
**Prérequis :** STORY-305 (obligations dérivées), STORY-299 (journal chaîné), STORY-300 (droits)  
**Origine :** FR-F08 — « le référentiel propose, le professionnel décide ».

---

## User Story

En tant qu'**expert-comptable**, je veux écarter une obligation qui ne s'applique pas à mon client,
afin que le référentiel propose sans décider à ma place.

## Décisions confrontées au code réel (2026-11-14)

- **`active` est un champ HUMAIN** de l'obligation (comme statut, responsable, déclarations) : posé
  à `true` par `$setOnInsert` à la création, **jamais** touché par une re-dérivation — c'est ce qui
  garantit qu'une obligation désactivée n'est pas réactivée automatiquement (AD-17). Les
  obligations créées par STORY-305 n'ont pas le champ : son absence vaut `true` (lecture et filtre
  `active: { $ne: false }`), aucune migration.
- **Désactiver / réactiver** : un motif obligatoire (400 sinon), écriture conditionnelle (on ne
  désactive qu'une obligation active, 409 `OBLIGATION_DEJA_DESACTIVEE` / `…_DEJA_ACTIVE`), trace
  `OBLIGATION_DESACTIVEE` / `OBLIGATION_REACTIVEE` au journal chaîné `obligation:<id>` dans la même
  transaction, motif par son **empreinte** (journal ineffaçable) ; le motif en clair, l'auteur et la
  date restent sur l'obligation (`desactivation`) pour l'écran.
- **Le calendrier** (`GET …/obligations`) n'affiche plus une obligation désactivée ;
  `?inclureDesactivees=true` la montre (historique) — rien n'est supprimé.
- **Droit** : `valider` (STORY-300) — écarter une obligation engage le professionnel.
- **Portée** : l'obligation de l'organisation, dans la portée de dossier de l'appelant (`dossier-service`),
  sinon 404 `OBLIGATION_INTROUVABLE`.

## Critères d'acceptation

- [x] **AC-1** — Désactiver sans motif ⇒ 400.
- [x] **AC-2** — Une désactivation motivée est journalisée ; l'obligation disparaît du calendrier
  sans être supprimée (visible avec `inclureDesactivees`).
- [x] **AC-3** — Une re-dérivation ne la réactive pas (Mongo réel).
- [x] **AC-4** — La réactivation est explicite, motivée, journalisée.
- [x] **AC-5** — Obligation d'une autre organisation ou hors portée ⇒ 404 ; droit `valider` exigé.

## Definition of Done

- [x] Branche `MNV-306` depuis `origin/dev`, PR vers `dev` fusionnée en rebase ; fiche et tracker
  par PR sur `main`.
- [x] Porte qualité verte ; conformité Mongo réel ; mutations rouges.

## Progress Tracking

**2026-11-14 — fiche écrite** (bmad-create-story) juste avant de coder.

**2026-11-14 — implémentation.** `active` et `desactivation` champs humains de l'obligation
(`$setOnInsert` à la création, absents ⇒ active) ; `RegistreObligations.trouver` /
`changerActivation` (écriture conditionnelle sur l'état inverse + trace
`OBLIGATION_DESACTIVEE|REACTIVEE`, motif par empreinte, dans la transaction) ;
`ActivationObligationsService` (portée via `dossier-service`, 404 `OBLIGATION_INTROUVABLE`, 409
`OBLIGATION_DEJA_DESACTIVEE|ACTIVE`) ; `POST /v1/obligations/:id/desactivation|reactivation`
(droit `valider`, motif 3..500) ; `GET …/obligations?inclureDesactivees=true`.

**2026-11-14 — preuves.** Conformité MongoDB réel 35/35 dont : écartée puis re-dérivée ⇒ reste
écartée, hors calendrier, rétablie, chaîne `DERIVEE → DESACTIVEE → REACTIVEE` intacte ; obligation
antérieure sans le champ ⇒ au calendrier. E2E 7/7 (motif exigé, calendrier / historique, 409, 403
sans `valider`, 404 hors portée). Mutations M1 (+Mongo réel : la suite entière tombe), M2, M3, M4
rouges puis restaurées.

**2026-11-14 — clôture.** Lint sans erreur, build vert, unitaires 2076/2076 (`-w 2`), e2e 160/160.
Code `81c6f67` → PR `prospera-fiscal-service#27` rebase-mergée sur `dev` (`53941d3`).

