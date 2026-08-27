# STORY-470 : Un brouillon créé par erreur ne s'annule pas — aucune route de suppression, et l'exercice est un libellé saisi

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`JeuEtatsController` expose `POST /`, `GET /`, `GET /:id`, `POST /:id/recalculer`,
`POST /:id/valider`, `POST /:id/rouvrir`, `GET /:id/versions`, `GET /:id/versions/:version`.
**Aucune suppression, aucun abandon.**

Or `CreerJeuEtatsDto.exercice` est une **chaîne saisie**, et l'index est unique sur
`(tenantId, exercice)`. Une frappe — « 2O25 », « Exercice 2025 », « 2025 » avec une espace finale —
crée un jeu **définitif**, qui restera dans `GET …/bilan/etats` à côté du vrai, pour toujours.
C'est un incident de tous les jours en cabinet, et le produit n'a rien à lui opposer.

L'immuabilité s'applique aux **versions figées**, pas aux brouillons : confondre les deux fait payer
à l'utilisateur une garantie qui ne le protège de rien.

## Critères d'acceptation

- [ ] AC-1 — `DELETE …/bilan/etats/:id` **n'accepte qu'un `BROUILLON` n'ayant jamais été validé**
      (aucun snapshot) → sinon `409 JEU_A_DES_VERSIONS`.
- [ ] AC-2 — Un jeu `VALIDE` n'est **jamais** supprimable, ni ses snapshots : c'est l'invariant.
- [ ] AC-3 — La suppression est **journalisée** (`AuditType.JEU_SUPPRIME`, avec le libellé
      d'exercice dans la cible) — supprimer est un acte, il se trace.
- [ ] AC-4 — `@Roles(TENANT_ADMIN)` (cohérent avec **STORY-463**).
- [ ] AC-5 — L'événement `liasse.etat.change` publie la disparition, sans quoi le portefeuille
      resterait à « bilan en cours » pour un jeu qui n'existe plus (même famille que STORY-461).
- [ ] AC-6 — ⚠️ **Ne corrige pas la cause** : l'exercice reste un libellé libre tant que
      **STORY-381 AC-9** n'est pas livrée. Cette story rend l'erreur réparable, pas impossible.

## Conséquences ailleurs

- Nommée à l'écran par la maquette FE-034.
- À instruire avec **STORY-381** (le libellé d'exercice vient de `dossier-service`) : livrer les
  deux supprime le problème au lieu de le rendre réparable.
