# STORY-439 : `ARTICULATION_NOTES` est nul par construction — le contrôle qui compte, note ↔ poste d'état, n'existe pas

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/controles-coherence-production.service.ts`, `etats/controles-coherence.types.ts`
**Points :** 3 · **Complexité :** high · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
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

- [x] AC-1 — `ARTICULATION_NOTES` compare, pour chaque note, le total **re-dérivé de son
      DÉTAIL** (la ventilation par compte, issue de la **balance**) au **montant des postes
      d'état** qu'elle justifie (issu de l'**agrégation** du Bilan/CR) — deux chemins de
      calcul et **deux entrées** distincts — et non le total à sa propre somme.
      Comparaison sur **N et N-1**.
- [x] AC-2 — Une note dont le détail n'est **pas dérivable** rend `INDETERMINABLE` pour ce
      rapprochement, **jamais** `OK`. Un contrôle non fait ne se peint pas en vert — et le
      contrôle global ne rend `OK` que si **aucune** note n'est restée indéterminable.
- [x] AC-3 — `elements[]` nomme la note **et** le poste
      (`{ref: 'note 8 (détail de BILAN_ACTIF|BJ)'}`, `{ref: 'BILAN_ACTIF|BJ'}`), pas
      seulement l'écart.
- [x] AC-4 — Le filet anti-régression actuel (Σ postes = total) **reste**, sous un code
      distinct (`INTEGRITE_NOTES`, `INFORMATIF`) : il a une valeur, ce n'est simplement pas
      un contrôle métier.
- [x] AC-5 — Agnosticisme P7 : `NON_APPLICABLE` si le référentiel ne déclare aucun renvoi.
- [x] AC-6 — Un test qui **falsifie** le détail d'une note et vérifie que le contrôle rougit
      — le test que le contrôle actuel ne peut pas avoir. Et un test qui rejoue le cas
      **réellement atteignable** en production (ci-dessous).
- [x] **AC-7** — Les rapprochements sont **déclarés explicitement**, **jamais dérivés** de
      `postes[].note` (voir §② ci-dessus). Un test le fige : **ajouter un renvoi au paquet ne crée
      aucun rapprochement**. ⚠️ Cet AC survit au changement de contrat de **STORY-437 AC-8**
      (`note: string | string[]`) : une liste ne se somme pas davantage qu'une chaîne.

## ⚡⚡ Cadrage ajusté avant dev — deux lectures littérales qui refaisaient la tautologie

**① « Total de la note ↔ montant du poste » est DÉJÀ tautologique.** `NoteAnnexe.totalN` **est**
`Σ postes.montantN` (STORY-062), et sur `syscohada-revise@2.1` **dix notes sur onze n'ont qu'un
seul poste contributeur** (la note 3 en a trois : `AD`, `AI`, `AP`). Comparer le total au poste
aurait reproduit **exactement** le voyant que cette story existe pour supprimer. Le seul second
chemin qui existe dans le produit est le **détail** de la note : la ventilation par compte, bâtie
depuis les **lignes de balance** et non depuis les postes d'état.

**② `detailACompleter: true` n'est pas le bon critère.** Depuis STORY-436, une note `TRAME`
**renseignée** porte `detailACompleter: false` — et son détail reste **non dérivable** : les
cellules sont des chaînes libres (`string[][]`), et le paquet ne déclare **ni le type ni le rôle**
de ses colonnes. Choisir « Valeurs brutes à la clôture » reviendrait à déduire une règle d'un
**libellé**, ce que le projet s'interdit partout (cf. le JSDoc de `ComplementPoste`). Appliqué
littéralement, l'AC-2 aurait comparé **0** au poste et rendu une **fausse `ANOMALIE`** sur toute
liasse dont la trame est saisie. Le critère retenu est donc « détail **dérivable** », dont
`detailACompleter` n'est qu'un cas.

### Le cas qui rend le contrôle réellement faillible — mesuré sur le paquet

Trois préfixes de comptes portent **à la fois** un candidat d'actif et un candidat de passif, et
l'actif est un **poste de note** :

| préfixe | candidat actif | candidat passif |
|---|---|---|
| `45`, `46`, `47` | `BILAN_ACTIF\|BJ` — « Autres créances », **note 8** (`VENTILATION`) | `BILAN_PASSIF\|DM` |

`NotesAnnexesProductionService.ventilerParCompte` choisit le poste **sur le solde N** puis calcule
`montantN1` **sur ce même poste** ; `BilanProductionService` refait son choix **sur le solde N-1**.
Un compte `47…` **créditeur en N-1** et **débiteur en N** part donc en `DM` au Bilan N-1 et reste
sous `BJ` dans la ventilation N-1 : la colonne comparative de la note 8 **ne se rapproche plus** du
Bilan. ⚠️ Le JSDoc de `ventilerParCompte` justifie ce raccourci par « les postes de notes v1 sont
non ambigus » — **c'est faux sur le paquet livré**, `BJ` l'est.

⇒ Sur la colonne **N**, l'écart reste nul par construction (même agrégation, deux implémentations
miroir) ; sur la colonne **N-1**, il est **atteignable en production**. C'est ce qui distingue ce
contrôle du précédent.

## ⛔ Hors périmètre, motivé et tracé — les deux rapprochements de la trame

Les lignes 1 et 3 du tableau ci-dessus (note 3A brut ↔ colonne Brut du Bilan, note 7 brut ↔ `BI`)
**ne sont pas livrées**. STORY-438 a bien fait franchir le brut au moteur, mais il manque **l'autre
moitié** : le paquet doit déclarer **quelle colonne de trame se rapproche de quelle colonne
d'état**. Ni `NoteMeta` ni `renvois` ne le portent, et l'inventer serait inventer une donnée
fiscale (même refus qu'à l'AC-5 de STORY-434). Chemin de reprise : `NoteMeta` gagne un
`rapprochement { colonne, cible }`, sourcé de l'imprimé — deux artefacts à régénérer, donc
**deux dépôts** (patron STORY-428). À ficher comme story de suivi.

## Conséquences ailleurs

- **Ordonnancement** : AC-1 n'est complet qu'après **STORY-438**. Livrer d'abord les
  rapprochements calculables (notes 7, 8, 9, 10, 11, 5, 6), puis les bruts.
- ⛔ **Dépendance dure sur STORY-437 (AC-2)** : les rapprochements ① *Immobilisations brutes*
  (note `3A`) et ② *Amortissements* (note `3C`) citent des notes que le paquet **ne déclare pas
  encore**. Ils ne peuvent pas être livrés avant. Les rapprochements ③ et ④ le peuvent.
- **FE-033** liste ce manque parmi les « angles morts » du panneau de contrôles.

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité) **deux fois**, **vérification
docker rejouée sur l'état final**, PR `bilan-service` **#70** (5 commits) puis **#71** (2 commits,
l'AC-7 arrivé en cours de route) rebase-mergées sur `dev` le 2026-09-03.

Branches créées **avant** la première ligne de code :

```
docs             MNV-439
bilan-service    MNV-439
```

⚠️ **Un seul dépôt de module** : aucun artefact de référentiel n'est régénéré (cf. § *Hors périmètre*),
donc pas de recopie byte-identique vers `balance-service`.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-1 | `ARTICULATION_NOTES` rapproche le **détail** d'une note — sa ventilation par compte, bâtie depuis les **lignes de balance** — des **postes d'état** qu'elle justifie, issus de l'**agrégation** du Bilan/CR. Sur **N et N-1**. |
| AC-2 | Détail non dérivable ⇒ `INDETERMINABLE`. Le contrôle global ne rend `OK` que si **tous** ses rapprochements ont été faits, et il **liste les non faits** avec `valeur: null` — y compris quand un autre est en anomalie. |
| AC-3 | `elements[]` nomme la note **et** le poste — une **paire par poste en écart** : `note 8 (détail de BILAN_ACTIF|BJ)` puis `BILAN_ACTIF|BJ`, suffixées `(N-1)` sur la colonne comparative. |
| AC-4 | Le filet de 062 reste, sous `INTEGRITE_NOTES` (`INFORMATIF`) — **durci au passage** : somme des valeurs absolues, statut déduit du **nombre** de notes en écart. |
| AC-5 | `NON_APPLICABLE` sans renvoi de note. Aucun code OHADA écrit dans le contrôle (invariant P7). |
| AC-6 | Deux tests qui falsifient, dont un **sur l'artefact réel** où le rouge sort du moteur, pas d'un littéral. |
| AC-7 | La mesure est au **poste**, jamais à la note : *le renvoi dit où lire, pas quoi égaler*. Voir la section dédiée. |

`MOTEUR_VERSION` 1.11.0 → **1.12.0** : la batterie passe de 6 à 7 lignes **et** `ARTICULATION_NOTES`
change de libellé, de statut et d'écart sous le même code. Deux raisons indépendantes.

### ⚡⚡ Deux lectures littérales de la fiche refaisaient la tautologie qu'elle ferme

**① « Total de la note ↔ montant du poste » est DÉJÀ tautologique.** `NoteAnnexe.totalN` **est**
`Σ postes.montantN` (STORY-062), et sur `syscohada-revise@2.1` **dix notes sur onze n'ont qu'un seul
poste contributeur** (la note 3 en a trois : `AD`, `AI`, `AP`). Le seul second chemin qui existe dans
le produit est le **détail**.

**② `detailACompleter: true` n'est pas le bon critère.** Depuis STORY-436, une note `TRAME`
**renseignée** porte `detailACompleter: false`, et son détail reste **non dérivable** : cellules libres,
colonnes ni typées ni qualifiées par le paquet. Appliqué à la lettre, l'AC-2 aurait comparé **0** au
poste ⇒ **fausse `ANOMALIE`** sur toute liasse dont la trame est saisie.

### Le cas qui rend le contrôle réellement faillible — mesuré, puis reproduit en docker

Trois préfixes portent **à la fois** un candidat d'actif et un candidat de passif, et l'actif est un
poste de note : `45`, `46`, `47` → `BILAN_ACTIF|BJ` (« Autres créances », **note 8**, `VENTILATION`)
**ou** `BILAN_PASSIF|DM`. `ventilerParCompte` choisit le poste **sur le solde N** puis calcule sa
colonne N-1 sur ce même poste ; le Bilan refait son choix **sur le solde N-1**. Un compte `47…`
créditeur en N-1 et débiteur en N part en `DM` au Bilan et reste sous `BJ` dans la note.

⚠️ Le JSDoc de `ventilerParCompte` justifiait ce raccourci par « les postes de notes v1 sont non
ambigus » — **c'est faux sur le paquet livré**. Corrigé, sans changer le calcul : le rapprochement le
**signale** ; le corriger changerait la valeur produite d'une note et relève de son propre arbitrage.

⇒ Sur la colonne **N** l'écart reste nul par construction (deux implémentations miroir de la même
agrégation) ; sur **N-1** il est **atteignable en production**.

### ⛔ Hors périmètre, motivé et tracé — les deux rapprochements de la trame

Note 3A brut ↔ colonne Brut du Bilan, note 7 brut ↔ `BI`. STORY-438 a fait franchir le brut au moteur,
mais il manque **l'autre moitié** : le paquet doit déclarer **quelle colonne de trame se rapproche de
quelle colonne d'état**. Ni `NoteMeta` ni `renvois` ne le portent, et l'inventer serait inventer une
donnée fiscale (même refus qu'à l'AC-5 de STORY-434). Chemin de reprise : `NoteMeta` gagne un
`rapprochement { colonne, cible }`, sourcé de l'imprimé — deux artefacts, donc **deux dépôts** (patron
STORY-428). **À ficher comme story de suivi.**

### ⚡⚡ Revue de code — 5 constats, aucun bloquant, deux gardes qui ne gardaient rien

1. **Le durcissement d'`INTEGRITE_NOTES` n'était mesuré par RIEN** : rétablir la somme signée et le
   statut déduit de l'écart laissait **1 121 tests VERTS**, alors que deux totaux faux en sens
   contraire s'annulaient et rendaient le voyant vert.
2. **« Un rapprochement non fait reste visible » n'était prouvé que HORS anomalie** : filtrer
   `elements` sur `valeur !== null` dans la branche `ANOMALIE` laissait les mêmes 1 121 tests verts,
   en effaçant du contrat les trois trames non rapprochées — l'écran aurait affiché « 1 anomalie » et
   laissé croire les huit autres notes rapprochées.
3. **Le cadre de 063 affirmait encore « ne calcule aucune règle métier neuve »** — faux depuis cette
   story, et le piège est nommé : déplacer la mesure vers le service d'état amont y ouvrirait un
   **second chemin de calcul du détail**, exactement le motif que la batterie existe pour attraper.
   (« les **quatre** contrôles d'articulation » devenait faux aussi.)
4. **Trois JSDoc disaient `elements` vide hors anomalie**, contredits par la description Swagger du
   **même document**.
5. Le JSDoc de `noteVentilee` décrivait un **tuple qui n'a jamais existé**, masquant les deux champs
   qui portent le cas central de la story.

**Lentille over-engineering** (`ponytail-review`) : le test AC-5 recopiait tout le pipeline de
production au lieu de réutiliser le helper du fichier (−12 lignes nettes). Rien d'autre à couper.

### ⚡ Revue de sécurité — aucune vulnérabilité, une garde rendue structurelle

Aucun constat de confiance ≥ 80. Écartés par la mesure : le gate `valide` (`bloquantSatisfait` dérive
de `categorie`, jamais d'une liste de codes — un 7ᵉ code ne peut pas le déplacer, et le refus **422**
filtre avec le **même** prédicat) ; la fuite de numéros de comptes (`rapprocherNote` lit les montants
de la ventilation, **jamais** `ligne.compte` ; `modele-liasse` ne projette pas `elements`) ;
l'épuisement de ressources (boucle linéaire bornée par le paquet et le plafond de 5 000 soldes) ; et la
**non-répudiation**, où le bump 1.12.0 couvre les deux changements observables.

⛔ **Un point signalé a été traité** : la précondition « les appelants passent toujours `soldesN` »
n'était tenue que par un **JSDoc**. `construireNote` posait `ventilation: []` sur toute note
`VENTILATION`, et le contrôle neuf lit la **présence** de ce champ comme preuve de dérivabilité — un
appelant qui omettrait les soldes aurait produit une **fausse anomalie égale au total de chaque note
ventilée**. C'est désormais une garde de code, et `detailACompleter` reste piloté par le **mode**
déclaré : les deux ne disent pas la même chose.

### ⚡⚡ AC-7 est arrivé PENDANT le développement — et il a changé le livrable

L'AC-7 a été ajouté à cette fiche par un autre développeur (commit `docs` `1de058c`) **entre**
l'ouverture de la PR `bilan-service` **#70** et son merge. Il interdit de dériver un rapprochement
**chiffré** du champ `postes[].note` : *« le renvoi dit **où lire**, pas **quoi égaler** »*, avec
trois contre-exemples relevés sur le formulaire déposé — `RK → 27` mettrait la note **27B**
(effectifs et masse salariale) dans les charges de personnel ; `RL → 3C&28` sommerait deux
**familles** distinctes, quand la ligne symétrique `TJ` ne porte que `28` ; `AI → 3` égalerait une
note à une ligne qui porte **trois** colonnes de montants.

⚠️ **Le livrable de #70 ne commettait aucune de ces trois erreurs** — il ne comparait jamais le
*contenu* d'une note à un poste, mais le *détail* d'une note aux postes qu'elle détaille. Il gardait
pourtant **une** porte ouverte : il **sommait les postes d'une note** avant de comparer. Deux
conséquences, l'une et l'autre mesurées :

- deux postes d'une même note dont les écarts **se compensent** étaient déclarés cohérents ;
- une note groupant des postes de **deux états** produisait une **somme hétérogène** actif +
  passif — le refus même que STORY-438 a opposé à `NoteAnnexe.totalBrutN`.

⇒ **PR `bilan-service` #71** (« suite ») descend la mesure au **poste** : chacun se rapproche de
**son propre détail**, et la note ne sert plus qu'à **nommer l'endroit où lire**. Les repères
publiés deviennent `note <n> (détail de <état>|<poste>)`.

⛔ **La lecture LITTÉRALE d'AC-7 reste ouverte** : « les rapprochements sont **déclarés
explicitement** » demanderait que le **paquet de référentiel** déclare les couples note ↔ poste — les
coder dans le moteur violerait l'**invariant P7**. C'est un changement d'artefact sur **deux dépôts**
(patron STORY-428), de la même famille que le hors périmètre ci-dessus. **À arbitrer.**

⚠️ **Ce que la revue de #71 a repris** : mon premier test AC-7 sur l'artefact réel était **vacant** —
accroché à la note 11 sur une balance où rien n'est en écart, il rendait le **même objet** sur les
deux implémentations, et son JSDoc affirmait pourtant qu'il attrapait la somme hétérogène. Reposé sur
la note 8 et la balance à sens inversé, il publie `note 8 (détail) (N-1) = 640 000` sur l'ancienne
version — l'actif et le passif agglomérés — avec `BILAN_PASSIF|CA` dans les éléments d'une anomalie
qui ne le concerne pas. Et la description OpenAPI d'`elements`, **écrite par #70**, décrivait déjà la
forme d'avant.

⚠️ **`MOTEUR_VERSION` reste à 1.12.0**, et c'est un raisonnement, pas un oubli : `statut` et `ecart`
d'`ARTICULATION_NOTES` changent bien, donc l'empreinte d'export aussi — mais 1.12.0 est **né** dans
#70 et n'a encore rien figé. *Vérifié en base : `snapshots_liasse` ne porte que 1.4.0 … 1.9.0.* Il
faudra **1.13.0** si un environnement a déjà produit une liasse sous 1.12.0.

### Vérification

Lint 0 warning · build OK · **1 526** unitaires + **410** e2e verts · couverture
**98,75 / 93,84 / 98,69 / 98,75**.

**15 mutations, toutes rouges par assertion** — sauf celle du retrait du code de `CODES_CONTROLE`, qui
casse la compilation, ce qui **est** le mécanisme d'exhaustivité déclaré depuis STORY-401.

⚠️ **Deux pièges rencontrés, tous deux fichés** : `git checkout -- <fichier>` pendant la passe de
mutation a **effacé la garde structurelle non committée**, qui a dû être reposée (fiche
`git-checkout-efface-le-travail-non-committe`) ; et le **hot-reload a menti** — le conteneur servait
encore l'ancien format de repère en annonçant « Found 0 errors », il a fallu `docker restart` (fiche
`hot-reload-ment-verif-docker`).

**Vérification docker — rejouée sur l'état FINAL**, par la route réelle
`POST /dossiers/:id/bilan/etats/controles/dry-run`, sur `syscohada-revise@2.1` :

| balance | `ARTICULATION_NOTES` | `INTEGRITE_NOTES` |
|---|---|---|
| N-1 à **sens inversé** sur `47…` | **`ANOMALIE`**, écart 120 000 — `note 8 (détail de BILAN_ACTIF|BJ) (N-1) = −120 000` contre `BILAN_ACTIF|BJ (N-1) = 0`, **et les trois trames toujours listées** | `OK` — **aveugle au défaut** |
| N-1 de **même sens** | **`INDETERMINABLE`**, les notes 3, 4 et 7 nommées — jamais `OK` | `OK` |

7 contrôles servis, `valide` inchangé (les deux sont `INFORMATIF`), et le `/api/docs-json` du conteneur
publie `INTEGRITE_NOTES` dans l'`enum` `CodeControle`.

⚠️ **Conséquence produit à connaître** : sur `syscohada-revise@2.1`, `ARTICULATION_NOTES` rendra
`INDETERMINABLE` sur **toute liasse réelle** tant que les trames 3/4/7 ne sont pas rapprochables. C'est
le comportement voulu — un contrôle non fait ne se peint pas en vert — et c'est ce qui rend le hors
périmètre ci-dessus visible à l'écran plutôt que silencieux.

⚠️ **Flake e2e pré-existant** de `bilan-service` (fiche `flake-e2e-bilan-service`) : deux suites sont
tombées sur une exécution complète, vertes à la relancée immédiate et en isolation. Sans rapport avec
ce diff.
