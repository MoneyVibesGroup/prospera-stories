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

## ⛔ Deux contraintes portées par STORY-437 — à lire AVANT d'écrire le contrôle

### ① Les notes `3A` et `3C` n'existent pas encore

Le tableau ci-dessus rapproche les **notes 3A et 3C**. Le paquet `syscohada-revise@2.1` ne déclare
que la note **`3`** : ses sous-notes n'ont **ni `NoteMeta`, ni titre**. Elles arrivent avec
**STORY-437 AC-2** (les 35 numéros / 45 feuilles, titres relevés sur le GUIDEF).

⇒ Les rapprochements ① et ② ne sont pas seulement bloqués par le brut (STORY-438) : ils sont
bloqués par **l'absence de la note qu'ils citent**. Les rapprochements ③ (note `7` → `BI`) et ④
(note `11` → `BS`) sont, eux, calculables **aujourd'hui**.

### ② `note` est un renvoi DOCUMENTAIRE — jamais un rapprochement chiffré

⚡ **C'est le piège qui rendrait ce contrôle faux, et il est silencieux.** La tentation est de
dériver les rapprochements du champ `postes[].note` : « le poste porte `27`, donc total(note 27) =
montant(poste) ». **Faux, et mesuré sur la liasse déposée :**

| Renvoi du formulaire | Ce que la dérivation calculerait | Pourquoi c'est faux |
|---|---|---|
| `RK → 27` (*Charges de personnel*) | total(`27A`) **+** total(`27B`) | La **`27B`** est un état d'**effectifs, masse salariale et personnel extérieur**. Elle ne s'additionne à rien — l'additionner aux charges de personnel produit un écart qui n'a aucun sens comptable. |
| `RL → 3C&28` (*Dotations*) | total(`3C`) **+** total(`28`) | Deux **familles** distinctes, pas une somme. La ligne symétrique `TJ` (*Reprises*) ne porte que `28` — le formulaire lui-même le dit. |
| `AI → 3` (*Immobilisations corporelles*) | total(note `3`) | La feuille `BILAN ACTIF` n'a **qu'une colonne « Note » pour trois colonnes de montants** (BRUT / AMORT / NET). Le renvoi `3` vaut pour la **ligne entière** : le brut se justifie en `3A`, l'amortissement en `3C`, les cessions en `3D`. |

⇒ **Le renvoi dit *où lire*, pas *quoi égaler*.** Un poste qui porte une note n'en est pas le total.

**AC-7 en conséquence** : les rapprochements de `ARTICULATION_NOTES` sont **déclarés
explicitement** — comme le tableau de cette story les écrit —, jamais dérivés de `postes[].note`.
Un test le fige : ajouter un renvoi au paquet **ne doit créer aucun rapprochement**.

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
- [ ] **AC-7** — Les rapprochements sont **déclarés explicitement**, **jamais dérivés** de
      `postes[].note` (voir §② ci-dessus). Un test le fige : **ajouter un renvoi au paquet ne crée
      aucun rapprochement**. ⚠️ Cet AC survit au changement de contrat de **STORY-437 AC-8**
      (`note: string | string[]`) : une liste ne se somme pas davantage qu'une chaîne.

## Conséquences ailleurs

- **Ordonnancement** : AC-1 n'est complet qu'après **STORY-438**. Livrer d'abord les
  rapprochements calculables (notes 7, 8, 9, 10, 11, 5, 6), puis les bruts.
- ⛔ **Dépendance dure sur STORY-437 (AC-2)** : les rapprochements ① *Immobilisations brutes*
  (note `3A`) et ② *Amortissements* (note `3C`) citent des notes que le paquet **ne déclare pas
  encore**. Ils ne peuvent pas être livrés avant. Les rapprochements ③ et ④ le peuvent.
- **FE-033** liste ce manque parmi les « angles morts » du panneau de contrôles.
