# STORY-464 : Aucune route ne compare deux versions figées — alors que les deux liasses complètes sont stockées

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`SnapshotLiasse` stocke la **liasse entière** (`liasse`), les **soldes sources** (`soldesN`,
`soldesN1`) et le tampon référentiel — pour **chaque** version. Il existe `GET …/versions` (la
liste) et `GET …/versions/:version` (une version). **Il n'existe rien pour les comparer.**

Or la question vient immédiatement après la première réouverture : *« qu'est-ce qui a changé entre
la version que j'ai remise au client et celle-ci ? »*. C'est aussi la question à laquelle il faut
répondre devant un contrôle, et celle qui justifie la réouverture.

Aujourd'hui l'écran ne peut que **soustraire deux totaux** — c'est-à-dire refaire un calcul,
exactement ce que la règle « pas de second arbitre » interdit (FE-030/FE-031).

## Critères d'acceptation

- [ ] AC-1 — `GET …/etats/:id/versions/comparaison?de=1&a=2` rend, **poste par poste**, les seuls
      postes dont la valeur diffère : `{ etat, code, libelle, avant, apres, ecart }`.
- [ ] AC-2 — Le **référentiel** des deux versions est comparé et publié : deux versions produites
      sous des versions de paquet différentes ne dénotent pas tout à fait les mêmes agrégats —
      même garde que `referentielHomogene` (FE-076).
- [ ] AC-3 — La différence des **soldes sources** est résumée (comptes ajoutés / retirés / modifiés
      avec leur écart), sans rendre les deux balances entières.
- [ ] AC-4 — `de` et `a` doivent exister et être **distinctes** → `404 VERSION_INTROUVABLE` /
      `400`. L'ordre est libre ; l'`ecart` est signé `apres − avant`.
- [ ] AC-5 — **Aucun recalcul** : la comparaison lit deux snapshots figés. Une liasse re-produite
      pour l'occasion ne serait plus la version qui fait foi.

## Conséquences ailleurs

- L'écran vit dans l'onglet **Validation** de FE-034 (bouton « Comparer v1 et v2 », désactivé dans
  la maquette et nommant cette story).
- Se combine à **STORY-460** : le motif de la réouverture explique *pourquoi*, la comparaison
  montre *quoi*. Les deux ensemble constituent le dossier de justification d'une correction.
