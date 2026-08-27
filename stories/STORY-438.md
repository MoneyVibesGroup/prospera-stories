# STORY-438 : Seule la colonne « Net » franchit la frontière du moteur — les notes annexes et les sous-totaux du Bilan perdent le brut et les amortissements

Status: ready-for-dev

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/notes-annexes-production.service.ts`, `etats/bilan.types.ts`, `dto/bilan-response.dto.ts`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuilles *« NOTE 6 »*, *« NOTE 7 »*, *« TABLEAU immo note 3A »*, *« BILAN ACTIF »*.

---

## Le fait — un seul défaut, trois symptômes

`PosteNote.montantN` reprend, pour un poste d'actif, **`netN`** :

```ts
// actif → netN ; passif/CR → montantN
```

Et `BilanProduit.sousTotaux` est une liste de `{poste, valeurN, valeurN1}` — **une** valeur.

### ① La note 3 totalise du net sous des colonnes en brut

La trame déclarée est « *Valeurs brutes à l'ouverture / Augmentations / Diminutions / Valeurs
brutes à la clôture* ». Le total produit vaut **3 500 000** (le net). Le brut des trois postes
contributeurs vaut **7 225 000**. Les colonnes et le total ne parlent pas de la même grandeur.

### ② Les notes 6 et 7 déposées ont un TOTAL BRUT, une ligne « Dépréciations », un TOTAL NET

C'est la structure exacte des feuilles *« NOTE 6 »* et *« NOTE 7 »* de la DSF. Le produit n'en
rend que la **dernière ligne**, parce que le poste `BB` (`règle NET_ACTIF`) est déjà net des
comptes 39. La ventilation par compte hérite du même biais.

### ③ Les sous-totaux du Bilan n'ont ni brut ni amortissements

`AZ`, `BG`, `BK`, `BT`, `BZ` ne publient qu'une valeur. Le formulaire déposé **totalise les
trois colonnes**. La maquette FE-033 affiche donc « — » dans les colonnes Brut et Amort. des
lignes de sous-total — honnête, mais ce n'est pas le formulaire.

⚡ **Même racine que STORY-434** (le TFT double-compte les dotations parce que ses opérandes ne
voient que le net). Les corriger séparément, c'est traverser deux fois la même frontière.

## Critères d'acceptation

- [ ] AC-1 — `PosteNote` porte `brutN`, `amortN`, `netN` (et leurs pendants N-1) pour un poste
      d'actif ; `montantN` reste pour le passif et le compte de résultat. Le champ existant n'est
      pas retiré : il vaut le net, comme aujourd'hui.
- [ ] AC-2 — `NoteAnnexe` porte `totalBrutN` / `totalAmortN` / `totalNetN` quand **tous** ses
      postes contributeurs sont d'actif ; sinon `null` (jamais une somme hétérogène).
- [ ] AC-3 — `SousTotalBilan` porte `brutN` / `amortN` en plus de `valeurN`, quand le sous-total
      ne porte que des postes d'actif. Le champ `valeurN` ne change pas de sens.
- [ ] AC-4 — La ventilation par compte d'une note `VENTILATION` distingue les comptes de
      **dépréciation** (`39`, `49`, `59`, `29`) des comptes de position : c'est la ligne
      « Dépréciations des stocks / des comptes clients » du formulaire.
- [ ] AC-5 — Invariant conservé : `Σ ventilation(net) = montantN(poste)`, et le nouvel invariant
      `Σ ventilation(brut) − Σ ventilation(dépréciations) = net`.
- [ ] AC-6 — Agnosticisme P7 : un référentiel dont les postes d'actif n'ont pas de règle
      `NET_ACTIF` rend `brutN = netN` et `amortN = 0`, sans cas particulier.

## Conséquences ailleurs

- **STORY-434** (voie A) a besoin d'AC-1/AC-3 pour que les opérandes du TFT puissent lire le brut.
- **STORY-439** : le contrôle « note 3A brut = brut du Bilan » n'est **calculable** qu'après celle-ci.
- **FE-033** annonce les trois symptômes à l'écran, chacun avec ce numéro.
