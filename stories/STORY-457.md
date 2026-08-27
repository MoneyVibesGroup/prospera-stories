# STORY-457 : La piste d'audit et le snapshot ne nomment personne — `userId` et `validePar` sont des `ObjectId` nus

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`AuditEventResponseDto` publie `userId: string` — un `ObjectId` de 24 caractères. `SnapshotSommaireDto`
publie `validePar: string`, de même. **Aucune route de `bilan-service` ne résout un utilisateur en nom**,
et l'écran de la piste d'audit est précisément celui où l'identité **est** l'information.

Conséquence directe : l'**AC-4 de FE-034** — « journal d'audit : action, **auteur**, horodatage, cible » —
est **inapplicable**. Trois des quatre colonnes sont servies. Le front ne peut afficher que
`68a1f3…4c31`, et un journal dont l'auteur est un identifiant opaque n'est pas une piste d'audit :
c'est une liste d'horodatages.

Même remarque pour l'**AC-2** (« statut VALIDÉ + horodatage/**validateur** affichés »).

## Critères d'acceptation

- [ ] AC-1 — `AuditEventResponseDto` publie `auteur: { id, nom, email, role }` en plus de `userId`
      (rétrocompatible : `userId` reste).
- [ ] AC-2 — `SnapshotSommaireDto.validePar` gagne la même enveloppe (`validePar` reste un id ;
      `validateur: { id, nom, email, role }` s'ajoute).
- [ ] AC-3 — La résolution passe par un **read-model local** alimenté par les événements
      `auth-service` (le patron déjà utilisé pour les entitlements), **jamais** par un appel
      synchrone dans la boucle de lecture du journal.
- [ ] AC-4 — Un utilisateur **supprimé ou désactivé** garde son nom dans le journal : c'est un
      **fait daté**, pas une jointure vivante. Le read-model ne supprime jamais une ligne.
- [ ] AC-5 — Un auteur non résolu (événement antérieur au read-model) rend
      `auteur: null` — et **jamais** un nom inventé ou un « Utilisateur inconnu » qui se lirait
      comme un compte réel.

## Conséquences ailleurs

- **Bloque FE-034** : c'est le seul écart de la série qui rend un critère d'acceptation
  inapplicable, pas seulement dégradé. La maquette affiche donc l'identifiant **tel quel**,
  nom et rôle marqués en pointillé (« reconstitué »), pour ne pas laisser croire l'écart réglé.
- Même patron que l'affichage des dossiers affectés (STORY-136) : le nom d'un collaborateur
  est déjà une donnée que le front doit résoudre ailleurs.
