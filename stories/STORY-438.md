# STORY-438 : Seule la colonne « Net » franchit la frontière du moteur — les notes annexes et les sous-totaux du Bilan perdent le brut et les amortissements

Status: done

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

- [x] AC-1 — `PosteNote` porte `brutN`, `amortN`, `netN` (et leurs pendants N-1) pour un poste
      d'actif ; `montantN` reste pour le passif et le compte de résultat. Le champ existant n'est
      pas retiré : il vaut le net, comme aujourd'hui.
- [x] AC-2 — `NoteAnnexe` porte `totalBrutN` / `totalAmortN` / `totalNetN` quand **tous** ses
      postes contributeurs sont d'actif ; sinon `null` (jamais une somme hétérogène).
- [x] AC-3 — `SousTotalBilan` porte `brutN` / `amortN` en plus de `valeurN`, quand le sous-total
      ne porte que des postes d'actif. Le champ `valeurN` ne change pas de sens.
- [x] AC-4 — La ventilation par compte d'une note `VENTILATION` distingue les comptes de
      **dépréciation** (`39`, `49`, `59`, `29`) des comptes de position : c'est la ligne
      « Dépréciations des stocks / des comptes clients » du formulaire.
- [x] AC-5 — Invariant conservé : `Σ ventilation(net) = montantN(poste)`, et le nouvel invariant
      `Σ ventilation(brut) − Σ ventilation(dépréciations) = net`.
- [x] AC-6 — Agnosticisme P7 : un référentiel dont les postes d'actif n'ont pas de règle
      `NET_ACTIF` rend `brutN = netN` et `amortN = 0`, sans cas particulier.

## Conséquences ailleurs

- **STORY-434** (voie A) a besoin d'AC-1/AC-3 pour que les opérandes du TFT puissent lire le brut.
- **STORY-439** : le contrôle « note 3A brut = brut du Bilan » n'est **calculable** qu'après celle-ci.
- **FE-033** annonce les trois symptômes à l'écran, chacun avec ce numéro.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker rejouée sur
l'état final**, PR `bilan-service` **#69** (3 commits) rebase-mergée sur `dev` le 2026-09-02.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-1 | `PosteNote` porte `brutN`/`amortN`/`netN` + pendants N-1, **pour un poste d'actif seulement**. `montantN` ne change pas de sens ; `netN` le redouble à dessein, pour que les trois colonnes se lisent **ensemble** comme sur l'imprimé. |
| AC-2 | Trois totaux par note, **`null` dès qu'un seul poste contributeur n'est pas d'actif** — jamais une somme hétérogène. |
| AC-3 | `PosteSousTotal` porte ses colonnes brute et d'amortissement. **Deux passes de plus sur le MÊME évaluateur** : la colonne brute est la même formule sur une autre colonne, donc elle suit exactement la cascade du net, sans une ligne d'arithmétique en double. |
| AC-4 | La ventilation distingue position et dépréciation — voir l'écart ci-dessous. |
| AC-5 | Les deux invariants tiennent ensemble, mesurés sur la ventilation. |
| AC-6 | Sans compte créditeur rattaché : `amortN = 0`, `brutN = netN`, **par le calcul même du Bilan** et non par une branche dédiée. |

`MOTEUR_VERSION` 1.10.0 → **1.11.0**.

### ⚡⚡ L'écart assumé de l'AC-4 — et pourquoi il est le seul tenable

La fiche nomme les préfixes `39`, `49`, `59`, `29`. **Les coder aurait cassé l'invariant P7 ET l'AC-6
de la même story.** Le Bilan applique déjà la règle agnostique depuis STORY-059 — **Brut = Σ débit,
Dépréciation = Σ crédit** — et la ventilation reprend exactement celle-là, donc elle **ne peut pas
diverger** du poste qu'elle détaille. Une ligne à `brutN: 0` et `amortN > 0` **est** la ligne
« Dépréciations » du formulaire.

⚠️ La revue de code l'a confirmé par la mesure : **coder les préfixes n'aurait rien changé non plus**,
ces comptes n'atteignant jamais la ventilation faute de rattachement.

### ⛔ La dépendance référentiel, mesurée — à connaître avant de câbler l'écran

| artefact | notes déclarées | compte d'amortissement rattaché à un poste d'actif |
|---|---|---|
| `syscohada-revise@2.1` | 11 | **aucun** (0 préfixe en `28`/`29`/`39`/`49`/`59` sur 59 rattachés) |
| `zone-franche-togo@1.0` | 11 | **aucun** |
| `cima-assurances@1.0` | — | `28` → `CA1`, `39` → `CA2` |
| `sfd-bceao@2.0` | — | `29` → `BA2` |

**L'intersection est vide.** Sur les deux seuls paquets qui déclarent des notes, `amortN` vaut donc
**structurellement 0** et `brutN === netN` : le chiffre de la fiche (brut **7 225 000** contre net
**3 500 000**) **n'est pas atteignable sur le paquet livré**. Le maillon manquant est le rattachement
des `28xx`/`39xx` — la « convention miroir » que `BilanProductionService` déclare **hors périmètre
depuis STORY-059** (« exigerait d'étendre le référentiel → jamais deviné ici »).

Le contrat publie désormais cette dépendance, avec sa mesure. **Les colonnes ne sont pas mortes pour
autant** : elles sont prouvées vivantes sur CIMA en docker.

### ⛔ La sonde de forme ne voyait ni les sous-totaux ni les notes

**Cinquième récidive de la famille.** Elle figeait la ligne d'actif et la ligne de passif, **jamais le
sous-total** — alors que le JSDoc de STORY-434 affirmait que « les trois formes de ligne du Bilan y
entrent maintenant » — et les notes étaient écrites **en littéral**, ce que `moteur-version.ts`
nommait lui-même « **le dernier trou connu** ». Les deux sont refermés : les notes y sont désormais
**produites**, et quatre formes de ligne y sont figées.

### ⛔ Revue de code — 6 constats, dont un bloquant et une RÉGRESSION

**Le bloquant** : le **contrat publié** affirmait un défaut « refermé » qui ne l'est pas en
production. Un intégrateur aurait conclu à un bug du moteur. La description porte maintenant la
dépendance référentiel et ses deux paquets vivants.

**La régression, que j'avais introduite** : `evaluerColonne` ne rejouait pas le placement du
résultat, alors que c'est le **seul** endroit qui crée l'entrée de contexte d'un poste receveur absent
du semis. Deux scénarios reproduits — un paquet posant `role='RESULTAT_BILAN'` sur une ligne **non
`type:'detail'`** faisait lever `OperandeNonResolueError`, soit **500 sur toute la liasse** là où le
commit parent produisait le bilan sans erreur ; et un marqueur posé sur un poste d'actif publiait
`brutN − amortN ≠ valeurN` sans rien qui le signale. Le poste receveur est désormais semé dans les
deux passes — **sans le montant du résultat**, qui n'a ni brut ni amortissement — et tout sous-total
qui le somme est **exclu** de la qualification.

Les quatre autres, tous mesurés : le cumul **multi-postes** d'une note n'était gardé par rien (une
affectation à la place des trois additions laissait **1 101 tests verts**, alors que la note 3 réelle
a **trois** contributeurs) · toute la **colonne N-1** était publiée sans être mesurée (la câbler à
`null`, ou **permuter brut et amortissement**, laissait 1 101 tests verts) · la garde « aucune colonne
sous un poste non-actif » n'était prouvée que sur le **poste**, jamais sur la **ligne** (l'étendre au
passif laissait 357 tests verts) · deux couples d'`example` OpenAPI **mutuellement impossibles** pour
des paires garanties égales.

### Revue de sécurité — aucun constat, deux réserves nommées

Le diff ne touche ni contrôleur, ni guard, ni schéma, ni requête, ni journalisation. Quatre angles
instruits **par la mesure** :

- **Épuisement** : les deux passes sont **indépendantes de `soldesN`**. Au plafond du DTO (5 000 +
  5 000 soldes) : `produire()` **24,3 ms**, les trois passes de sous-totaux **0,344 ms** — les deux
  passes neuves ajoutent **< 1 %**. Ni récursion, ni boucle non bornée, ni superlinéarité.
- **Bornes** : tous les nouveaux cumuls passent par une addition bornée.
- **Document opposable** : invariants vérifiés sur les **4 paquets réels**, **40 balances
  pseudo-aléatoires chacun**, colonnes N et N-1 — **zéro divergence**. `modele-liasse.ts` sélectionne
  ses champs **nommément** : un snapshot figé sous 1.10.0 rend un document identique, **empreinte
  sha256 comprise**.
- **Fuite** : les nouveaux champs sont des projections du corps que l'appelant a fourni. Le montant du
  résultat n'est **pas** déductible — tout sous-total qui le somme est exclu.

🪝 **Réserves non traitées** : (R1) une somme de **brut** peut dépasser les bornes là où le net tenait
— mappé en **400, jamais 500**, fail-closed et souhaitable ; (R2) un snapshot antérieur ne porte pas
les nouveaux champs, coût intrinsèque d'un champ additif que `MOTEUR_VERSION` discrimine.

### Vérification

Lint 0 warning · build OK · **1 507** unitaires + **410** e2e verts · couverture
**98,74 / 93,75 / 98,69 / 98,74**.

**12 mutations**, chacune rouge sur l'assertion visée. Deux méritent d'être nommées : le **cumul en
affectation** et la **permutation brut/amortissement en N-1** laissaient toutes deux **1 101 tests
verts** avant les correctifs de revue.

**Vérification docker — rejouée sur l'état FINAL**, sur `cima-assurances@1.0`, le paquet où la colonne
est vivante :

| ligne | brut | amort | net | `brut − amort = net` |
|---|---|---|---|---|
| poste `CA1` | 5 000 000 | 1 200 000 | 3 800 000 | ✅ |
| poste `CA2` (**purement créditeur**) | 0 | 300 000 | −300 000 | ✅ |
| sous-total `CAT` | 5 000 000 | 1 500 000 | 3 500 000 | ✅ |
| sous-total `CPT` (passif) | `null` | `null` | 0 | — la contagion prouvée |

Sur SYSCOHADA : la note 11 sert ses trois colonnes et sa ventilation les deux côtés de la balance.

### Hooks et dettes nommés

- ⛔ **Le rattachement des `28xx`/`39xx` aux postes d'actif SYSCOHADA** est le maillon qui rend les
  colonnes utiles sur le référentiel par défaut. Hors périmètre depuis STORY-059 (« convention
  miroir ») ; c'est une **évolution de paquet**, pas de moteur.
- **STORY-434** (voie A) peut maintenant lire le brut d'un sous-total, comme ses AC-1/AC-3 l'attendaient.
- **STORY-439** : le contrôle « note 3A brut = brut du Bilan » devient calculable — mais il ne
  mesurera rien tant que le rattachement ci-dessus n'est pas fait.

