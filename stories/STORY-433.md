# STORY-433 : Le tableau des flux ne publie qu'une seule colonne — `PosteTft` n'a pas de `montantN1`, alors que le formulaire déposé en a deux

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/tft.types.ts`, `dto/tft-response.dto.ts`, `etats/tft-production.service.ts`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« TFT »*.

---

## Le fait

```ts
export interface PosteTft {
  etat: 'TFT'; code: string; libelle: string; note: string | null;
  montantN: number | null;      // ← et rien d'autre
  statut: StatutLigneTft;
}
```

La feuille *« TFT »* de la liasse déposée porte **`EXERCICE 2025` et `EXERCICE 2024`**, comme
le Bilan et le compte de résultat. Sur l'entité examinée, la colonne N-1 est **alimentée**
(`ZA` 427 364, `FA` −1 557 920, `FC` 3 500 000, `ZB` 369 000, `ZG` 369 000, `ZH` 796 364).

Ce n'est pas un manque de données : `POST …/bilan/etats/tft/dry-run` reçoit **déjà**
`soldesN1` dans son corps, `contexteMultiEtats` peuple **déjà** la colonne N-1 de tout le
contexte (« *les colonnes N-1 sont peuplées partout : les modes `VARIATION`/`VALEUR_N_1` en
dépendent* »), et `EvaluateurFormuleService` rend **déjà** un `valeurN1`. Le service le
**calcule** puis le **jette** : `MONTANT.set(r.poste, r.valeurN)`.

⚠️ Un flux N-1 n'est pas la variation N-1 → N-2 recalculée à la volée : il faut **trois**
jeux de soldes pour le produire honnêtement, ou bien accepter que la colonne N-1 du TFT ne
soit servie **que** lorsque `soldesN2` est fourni. **C'est la question à trancher**, et elle
doit l'être avant de coder : publier un `montantN1` faux serait pire que ne rien publier.

## Critères d'acceptation

- [ ] AC-1 — `PosteTft` porte `montantN1: number | null`. `null` = « non produit » ; `0` =
      « produit, et il vaut zéro » (convention FE-031, inchangée).
- [ ] AC-2 — Les lignes dont la valeur N-1 **est** dérivable des seuls `soldesN`/`soldesN1`
      (ancres `ZA`, et toute ligne sans mode `VARIATION`) la publient. Les lignes en mode
      `VARIATION` rendent `montantN1: null` **tant que** `soldesN2` n'est pas fourni — jamais 0.
- [ ] AC-3 — `BilanDryRunRequestDto` accepte un `soldesN2` **optionnel**. Fourni, il alimente
      la colonne N-1 complète ; absent, AC-2 s'applique. Aucun comportement existant ne change.
- [ ] AC-4 — `tresorerieOuvertureN1` / `tresorerieClotureN1` suivent la même règle.
- [ ] AC-5 — Test : sans `soldesN2`, `postes.every(p => p.montantN1 === null || modeNonVariation)` ;
      avec `soldesN2`, `ZG(N-1)` est calculé et `ZH(N-1) = ZG(N-1) + ZA(N-1)`.
- [ ] AC-6 — Non-régression `sfd-bceao@2.0` : `postes: []`, rien ne change.

## Conséquences ailleurs

- **FE-033** dessine la colonne et l'annonce **non servie** : c'est le seul écart de la maquette
  qui se voit d'un coup d'œil (une colonne entière de « — »).
- Même famille que **STORY-427** (le compte de résultat ne permet pas de rendre la liasse légale)
  et **STORY-430** (le comparatif n'est ni ordonné, ni daté, ni duré) : sans STORY-430, un
  `soldesN2` non identifié aggraverait le problème au lieu de le résoudre. **Les instruire ensemble.**

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker réelle
rejouée sur l'état final**, PR `bilan-service` **#64** (3 commits) rebase-mergée sur `dev` le
2026-09-02.

### ⛔ La question ouverte de la fiche, tranchée sur MESURE — et l'AC-2 se trompait

Inventaire des **21 lignes `FORMULE`** du TFT de `syscohada-revise@2.1` :

| mode | lignes | N-1 dérivable de `soldesN`/`soldesN1` seuls ? |
|---|---|---|
| `VALEUR_N_1` | 1 — `ZA` | ❌ **non** |
| `VARIATION` | 11 — `FB FC FD FE FF FG FH FK FL FO FP` | ❌ non |
| `VALEUR` | 9 — `FA FI ZB ZC ZD ZE ZF ZG ZH` | ⚠️ **seulement `FA` et `FI`** |

L'AC-2 écrivait « (ancres `ZA`, et toute ligne sans mode `VARIATION`) ». **Faux deux fois.** `ZA`
est en mode `VALEUR_N_1` — sa colonne N-1 est la trésorerie de clôture **N-2**, donc la *moins*
dérivable de toutes. Et les sept **Z-sous-totaux**, bien qu'en mode `VALEUR`, agrègent des lignes
`VARIATION`.

**Le critère n'est pas le mode de la ligne mais la PROPAGATION** — et le moteur la fait déjà :
`sommeSignee` rend `null` dès qu'une opérande le rend, et la réinjection en cascade conserve ce
`null`. `r.valeurN1` implémente donc l'AC-2 **exactement**, sans une ligne de règle en plus.
Mesuré en docker : **2** lignes servies sans `soldesN2`, **21** avec.

### Ce qui est livré

- **AC-1/AC-2** — `PosteTft.montantN1`. `null` = non produit, `0` = produit et vaut zéro.
- **AC-3** — `soldesN2` optionnel. Fourni, la colonne N-1 est produite en **rejouant la chaîne**
  sur (`soldesN1`, `soldesN2`) et en prenant sa colonne **N** : un flux est une *variation*, pas un
  solde. La colonne N est **prouvée inchangée** par son ajout.
- **AC-4** — ancres N-1, **dissymétriques à dessein** : la clôture N-1 est un solde (connue de
  `soldesN1`), l'ouverture N-1 est la clôture N-2 (exige `soldesN2`).
- **AC-5/AC-6** — `ZH(N-1) = ZG(N-1) + ZA(N-1)` mesuré ; `sfd-bceao@2.0` strictement inchangé,
  **même avec `soldesN2`**.
- **Vigilance** — `exerciceN2` entre au corps **et à la garde de chronologie** ; `soldesN2` sans
  `soldesN1` rend **400 `SOLDES_N2_SANS_N1`** plutôt qu'un tableau ignoré en silence.

### ⚡⚡ Deux défauts de contrat refermés, sans quoi la story n'aurait RIEN livré

1. **`TftDto.postes` était publié `items: {type: 'string'}`** — le défaut STORY-427 à l'identique,
   **mesuré sur le document produit**. Un client généré typait la liste `string[]` et **ne pouvait
   lire aucun champ**, `montantN` compris. `PosteTftDto` publie les sept, `statut` en énumération
   nommée. ⚠️ **L'`example` n'y était pour rien** — la première version de mon JSDoc l'accusait, ce
   que le header du fichier e2e mesure et dément depuis STORY-398 (constat de revue).
2. **Les trois ancres de trésorerie étaient des `object` opaques**, faute de `type: Number` sur un
   `number | null` (précédent STORY-426). Les six sont typées.

### ⚡⚡ La sonde de forme ne voyait pas le TFT

`moteur-version.spec.ts` construisait son TFT en **littéral `as TftProduit`** : elle mesurait la
forme que le *test* déclare, pas celle que le *service* rend. Les champs de cette story seraient
entrés dans les **snapshots opposables** sans rien faire rougir — même trou que STORY-426 sur
`controle` et STORY-431 sur la racine du CR, **un état plus loin à chaque fois**. Le TFT y est
maintenant produit ; la sonde a d'ailleurs **attrapé `etatBalanceN1`** ajouté en revue.
`MOTEUR_VERSION` 1.5.0 → **1.6.0**. ⚠️ Reste hors de la sonde, dit franchement : les **notes
annexes**, encore en littéral.

### ⚡⚡ Le défaut le plus grave, trouvé par la REVUE : la colonne N-1 s'effondre en silence

La colonne N-1 est produite en rejouant la chaîne sur (`soldesN1`, `soldesN2`). Or le comparatif
qu'un cabinet fournit est **typiquement la balance définitive de N-1**, donc **après détermination
du résultat** — et STORY-432 a établi que le compte de résultat sort alors **entièrement à zéro**.
La CAFG `FA` le lit.

**Mesuré**, même réalité économique, deux formes de la même balance N-1 :

| | `soldesN1` avant clôture | `soldesN1` après détermination |
|---|---|---|
| `FA` / `ZB` / `ZG` (N-1) | 40 000 | **0** |
| `ZH` (N-1) | 100 000 | **60 000** |
| `tresorerieClotureN1` | 100 000 | **100 000** |
| `controleTresorerie` | — | **identique** (il ne couvre que N) |

`ZH(N-1)` cesse de s'articuler avec la clôture N-1 **dans la même réponse**, statuts `CALCULE`,
aucun drapeau. ⛔ Le signal **existait et était jeté** : `precedent.bilan.controle.etatBalance`.
Publié en **`etatBalanceN1`**, recopié de la passe précédente (un seul écrivain, patron 426).

### ⚡⚡ Deux grandeurs de nature différente sous des noms symétriques

`variationTresorerieN` est la ligne `ZG` **portante** de la cascade ; `variationTresorerieN1` était
la **différence d'ancres**. Mesuré : **70 000 contre 30 000** sur la même production — FE-033 les
aurait rendues côte à côte. N-1 prend la même définition. ⛔ Et la description publiée de
`variationTresorerieN` était **fausse** (« = clôture − ouverture ») : les confondre effacerait
`controleTresorerie.ecart`, qui est précisément leur écart.

### Constat de la revue de SÉCURITÉ — intégrité comptable, pas une faille

- **`tresorerieOuvertureN1` publiait `0` là où la vérité est 60 000.** `emettreActif` construit la
  liste des postes **depuis la colonne N** de sa passe : un compte de trésorerie **soldé** cette
  année-là n'y figure pas du tout, et la somme des postes marqués ne trouve **rien**. Publier `0`
  affirme alors « produit, et il vaut zéro » là où la vérité est « non mesurable ».
  `tresorerieNette` distingue désormais les deux. ⚠️ La colonne **N** garde son `0` historique —
  `controleTresorerie` en dépend depuis STORY-061, le corriger déborderait.
- **`soldesN1: []` est *truthy*** et traversait les deux gardes : la seconde passe s'exécutait sur
  une colonne N **vide** et la colonne N-1 sortait toute à `0`. Les gardes testent la **longueur**
  (piège `[]` de STORY-430/409, à un champ de distance).

⛔ **Ce que la correction ne couvre PAS, mesuré plutôt qu'affirmé** : la ligne `ZA` vient de la
**cascade**, dont le contexte sème à `0` tout poste non émis (patron 111/112). Elle rend donc `0` —
comportement **antérieur et symétrique sur la colonne N**, prouvé par un témoin dans la batterie.
Écart distinct.

### Les sept autres constats de revue

**Un refus rendu par cinq routes et documenté par aucune** (`SOLDES_N2_SANS_N1`), la cause publiée
d'`EXERCICES_NON_ORDONNES` devenue incomplète — corrigés, et **la garde de contrat de STORY-430 est
étendue** : elle exigeait *un* code, elle exige désormais **tous** ceux que la route rend.
**JSDoc détaché ×2** (récidives **8 et 9** : `interface Cascade` et `type StatutLigneTft` laissés
sans documentation). Deux affirmations devenues fausses. Une assertion décorative
(`p.montantN1 !== undefined` est vrai de toute valeur que le type autorise). Un titre promettant
« moteur NON appelé » sans le mesurer. Un **hook inerte documenté** sur l'export, qui reste
mono-colonne.

### Écarts nommés, laissés au PO

- **`exerciceN2` reste facultative** même quand `soldesN2` est fourni — patron de STORY-430 AC-5,
  non-régression assumée. Un `soldesN2` non daté produit donc toute la colonne sans qu'aucune donnée
  ne dise de quelle période il s'agit.
- **`TftDto` ne publie aucune identité d'exercice** : il a désormais deux colonnes et ne les
  étiquette pas.
- **L'export (Excel/PDF) reste mono-colonne** : hook documenté dans `modele-liasse.ts`. L'y ajouter
  changerait l'`empreinteDocument` de tout document réédité, donc la chaîne de non-répudiation.

### Vérification docker réelle — rejouée sur l'état FINAL

| Mesure | Résultat |
|---|---|
| TFT **sans** `soldesN2` | **2** lignes servies : `FA`, `FI`. `ZA`/`ZG`/`ZH` = `null` |
| TFT **avec** `soldesN2` | **21** lignes. `ZA` 60 000, `ZG` 40 000, `ZH` 100 000 = ZG + ZA |
| ancres N-1 | sans : `null` / 100 000 / `null` — avec : 60 000 / 100 000 / 40 000 |
| colonne N et `controleTresorerie` | **identiques** dans les deux cas |
| balance N-1 **définitive** | `etatBalanceN1: APRES_DETERMINATION`, `FA/ZB/ZG` à 0, `ZH` 60 000 vs clôture 100 000 |
| refus | `SOLDES_N2_SANS_N1` (y compris sur `soldesN1: []`) et `EXERCICES_NON_ORDONNES` nommant **N-2** |
| contrat servi | `PosteTftDto` 7 propriétés **toutes requises**, `postes` en `$ref`, 6 ancres `number`/nullable, `etatBalanceN1` en `$ref` vers `EtatBalance`, **5/5** routes documentant les trois codes de refus |
| snapshots | v1 @1.4.0 et v2 @1.5.0 **sans** les champs et **intacts** ; v3 @1.6.0 avec |

### Portes

lint **0 warning** · build OK · **1389 unitaires** + **401 e2e** verts · couverture
**98,75 / 93,69 / 98,63 / 98,74** · **14 mutations, 14 rouges par assertion**.

⚠️ **Flake e2e pré-existant, identifié et fiché** : la suite complète échoue par intermittence sur
une suite **différente à chaque exécution** (`bilan-dossier-scope`, `bilan-comparaison-exercices`,
`bilan-referentiel`, `bilan-jeu-etats`), en parallèle **comme** en `--runInBand`, toujours sur un
refus d'authentification. Chaque suite passe en isolation. Sans rapport avec ce diff — piste : la
résolution JWKS du harnais de test. **À ficher en dette.**
