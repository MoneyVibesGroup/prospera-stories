# STORY-439 : `ARTICULATION_NOTES` est nul par construction — le contrôle qui compte, note ↔ poste d'état, n'existe pas

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/controles-coherence-production.service.ts`, `etats/controles-coherence.types.ts`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`.

---

## Le fait

```ts
// « Re-vérification légère (filet anti-régression) : l'écart est **nul par construction**
//   (062 bâtit le total depuis ces mêmes postes) »
const sommeN = note.postes.reduce((acc, p) => acc + p.montantN, 0);
const diff = note.totalN - sommeN;   // toujours 0
```

Le service **l'écrit lui-même**. Comme filet anti-régression c'est légitime ; comme **contrôle
de cohérence de la liasse**, c'est un voyant qui ne peut pas rougir — **troisième occurrence** du
motif après `coherenceResultat` (STORY-426) et le commentaire périmé de `controleTresorerie`
(STORY-434).

Les contrôles qu'un réviseur fait **en premier**, et qu'aucun code ne fait :

| Rapprochement | État A | État B |
|---|---|---|
| Immobilisations brutes | total « valeurs brutes à la clôture » de la **note 3A** | colonne **Brut** du Bilan (`AD` + `AI` + `AP`) |
| Amortissements | total de la **note 3C** | colonne **Amort. / Dépréc.** du Bilan |
| Créances clients | total brut de la **note 7** | poste `BI` |
| Trésorerie | total de la **note 11** | poste `BS` |

⚠️ Le premier n'est **pas calculable aujourd'hui** : le brut ne franchit pas la frontière du
moteur (**STORY-438**). Le quatrième l'est déjà.

## Critères d'acceptation

- [ ] AC-1 — `ARTICULATION_NOTES` compare, pour chaque note, le **total de la note** au
      **montant du poste d'état** qu'elle justifie — deux chemins de calcul distincts — et non
      le total à sa propre somme.
- [ ] AC-2 — Une note dont le détail n'est **pas** dérivable (`detailACompleter: true`) rend
      `INDETERMINABLE` pour ce rapprochement, **jamais** `OK`. Un contrôle non fait ne se peint
      pas en vert.
- [ ] AC-3 — `elements[]` nomme la note **et** le poste (`{ref: 'note 7'}`, `{ref: 'BILAN_ACTIF|BI'}`),
      pas seulement l'écart.
- [ ] AC-4 — Le filet anti-régression actuel (Σ postes = total) **reste**, sous un code distinct
      (`INTEGRITE_NOTES`, `INFORMATIF`) : il a une valeur, ce n'est simplement pas un contrôle métier.
- [ ] AC-5 — Agnosticisme P7 : `NON_APPLICABLE` si le référentiel ne déclare aucun renvoi.
- [ ] AC-6 — Un test qui **falsifie** un total de note et vérifie que le contrôle rougit — le test
      que le contrôle actuel ne peut pas avoir.

## Conséquences ailleurs

- **Ordonnancement** : AC-1 n'est complet qu'après **STORY-438**. Livrer d'abord les
  rapprochements calculables (notes 7, 8, 9, 10, 11, 5, 6), puis les bruts.
- **FE-033** liste ce manque parmi les « angles morts » du panneau de contrôles.
