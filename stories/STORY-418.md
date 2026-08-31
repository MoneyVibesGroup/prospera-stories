# STORY-418 : La provenance d'un compte proposé est une phrase en français — l'écran ne peut ni la trier, ni la traduire

Status: done

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/rattachement`
**Points :** 2 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-046** (rattachement au plan comptable), à la revue « expert-comptable venant de Sage » demandée par le PO.

---

## Le fait, relevé à la source

`GET /dossiers/{id}/rattachement/proposition` rend trois champs, et trois seulement :

```ts
// surcharge-rattachement.dto.ts — PropositionRattachementDto
compte!: string;    // '706'
motif!: string;     // 'libellé de la ligne (« prestation »)'
surcharge!: boolean; // vrai si la proposition vient d'une règle de l'organisation
```

Or le moteur (`rattachement.regles.ts` + `cahiers-recettes.regles.ts`) connaît **quatre**
provenances bien distinctes, et il les écrit **en prose** :

| provenance | motif produit | ce que ça vaut pour le comptable |
|---|---|---|
| règle du dossier | `règle de l'organisation sur le libellé « … »` | **décidé par un humain**, tracé, daté — rien à relire |
| mot-clé du libellé | `libellé de la ligne (« vente »)` | plausible, **à confirmer** |
| activité de l'org | `activité de l'organisation (« service »)` | plus faible encore — la ligne, elle, ne disait rien |
| **défaut** | `aucun indice dans la ligne ni dans l'activité — défaut « ventes de marchandises »` | **ce n'est pas un choix** : `COMPTE_PAR_DEFAUT = '701'` |

`surcharge` sépare la première des trois autres. **Rien ne sépare les trois autres entre
elles** — sauf à faire de l'analyse de texte français sur `motif`.

---

## Ce que ça coûte, concrètement

Le quatrième cas est le seul qui compte, et c'est le seul qu'on ne peut pas isoler.

```ts
// cahiers-recettes.regles.ts
const COMPTE_PAR_DEFAUT = '701';
```

Une ligne dont le libellé ne dit rien au moteur (« Facture n° 12 », « Règlement »,
« Versement ») part en **701 Ventes de marchandises**. Pour une entreprise de services, c'est
faux ; pour un commerçant, c'est juste par coïncidence. Dans les deux cas :

- la ligne est **acceptée** (701 est bien de classe 7 et bien au plan) ;
- la balance produite est **parfaitement équilibrée** ;
- **le chiffre d'affaires est mal ventilé**, et rien ne l'indique.

⇒ Un écran qui veut dire « ces 14 lignes-là méritent un coup d'œil » doit aujourd'hui
**chercher une sous-chaîne française dans `motif`**. C'est fragile (un mot changé côté serveur
casse le tri sans casser un test), et c'est **intraduisible** : le front est i18n, le motif ne
l'est pas.

---

## Ce qui est demandé

Ajouter un champ **typé** à `PropositionRattachementDto`, à côté du motif (qui reste — c'est
lui qui rend la proposition contestable) :

```ts
@ApiProperty({ enum: ORIGINES_PROPOSITION, example: 'MOT_CLE' })
origine!: OriginePropositon; // 'REGLE' | 'MOT_CLE' | 'ACTIVITE' | 'DEFAUT'
```

1. **Enum OpenAPI**, pas une chaîne libre : un cas ajouté doit **casser la compilation** du
   client, pas tomber en silence (règle déjà posée par STORY-375).
2. `surcharge` **reste** — le retirer casserait les clients existants ; `origine === 'REGLE'`
   lui est équivalent et le rendra déprécié à terme.
3. La donnée existe déjà : `proposerRattachement` sait dans quelle branche il est. C'est un
   champ à **poser**, pas un calcul à écrire.
4. ⚠️ **Même exigence sur la pré-proposition des lots OCR** si elle porte le même motif
   (`LignePreProposeeDto`) — un écran ne doit pas avoir deux façons de lire la même idée.

---

## Critères d'acceptation

1. `GET …/rattachement/proposition` publie `origine`, typée en enum, sur les 4 branches.
2. Les 4 valeurs sont couvertes par des tests **qui rougissent** si une branche rend la
   mauvaise origine (mutable-testable, pas un simple `toBeDefined`).
3. `motif` est **inchangé** — aucun client existant ne casse.
4. OpenAPI régénéré ; l'enum apparaît dans les types générés du front.

---

## Notes

- Jumelle de **STORY-375** (les codes de refus deviennent un enum) : même patron, même raison —
  une information que le serveur possède, publiée sous une forme que le client doit deviner.
- Voir [[FE-046]] (maquette), `stories/STORY-085.md` (le moteur), `stories/STORY-394.md`
  (l'énumération du plan, qui a levé l'autre moitié du problème).

---

## Progress Tracking

**Statut : `done`** — clôturée le **2026-08-31**. PR **#75** (`balance-service`) rebase-mergée sur
`dev`, branche supprimée. **Un seul dépôt module.**

### ⚠️ Une prémisse de la story vérifiée, et FAUSSE

> « **Même exigence sur la pré-proposition des lots OCR** si elle porte le même motif
> (`LignePreProposeeDto`). »

**Elle ne le porte pas.** `LignePreProposeeDto` n'a **ni compte ni motif de rattachement** : son
champ `motif` est celui de `DoublonProbableDto` — le motif du **doublon probable**, tout autre
chose. Vérifié sur le DTO, le schéma Mongoose et le presenter. **Rien à faire de ce côté**, et
c'est la bonne réponse : y ajouter une `origine` aurait été inventer un besoin.

### Conception

| Décision | Ce qu'elle tranche |
|---|---|
| **D-418-1** | `PropositionCompte.origine` est typé **`Exclude<OrigineProposition, 'REGLE'>`**. Ce moteur-là (`proposerCompteProduit`) ne connaît pas les règles de l'organisation — c'est `proposerRattachement` qui les résout **avant** de l'appeler. Le **type** l'interdit plutôt que de compter sur la discipline : sans lui, une proposition de mot-clé pourrait un jour sortir estampillée « décidée par un humain », soit l'inverse exact de ce que l'écran doit dire. |
| **D-418-2** | ⛔ **`origine` vient du moteur et n'est JAMAIS réécrite** par `proposerRattachement`. Le piège serait de poser `REGLE` dès qu'une surcharge **existe** : une règle **ignorée** (compte hors plan depuis un changement de référentiel) retombe sur le moteur, et l'écran croirait qu'un humain a tranché là où la machine a deviné. Garde dédiée, mutation **M5**. |
| **D-418-3** | `enumName: 'OrigineProposition'` — l'énumération est **extraite en schéma nommé**, comme `OrigineBalance` (STORY-388). Sans lui, l'enum reste **inline** et le client généré obtient un type anonyme par site d'usage, là où l'AC-4 demande qu'elle apparaisse dans les types du front. |
| **D-418-4** | `MOT_CLE`, et non `LIBELLE` : le moteur cherche ses mots-clés dans le libellé **et** le tiers concaténés. Une correspondance trouvée sur le **tiers** sort donc aujourd'hui sous le motif « libellé de la ligne » — **la prose est déjà imprécise**, l'origine ne l'est pas. C'est exactement l'argument de la story contre le tri par sous-chaîne. ⚠️ Corriger ce motif est **hors périmètre** (AC-3 : `motif` inchangé). |
| **D-418-5** | `surcharge` **reste**, requis, et un test interdit à `surcharge` et `origine === 'REGLE'` de **diverger** : le livrable est additif, et le champ hérité ne doit pas devenir une seconde vérité. |

### Implémentation

| Fichier | Ce qui change |
|---|---|
| `rattachement/types/rattachement.ts` | `ORIGINES_PROPOSITION` + `OrigineProposition` · `PropositionRattachement.origine` |
| `cahiers-recettes.regles.ts` | `PropositionCompte.origine` (type **excluant** `REGLE`) posée sur les **3** branches du moteur |
| `rattachement/rattachement.regles.ts` | `origine: 'REGLE'` sur la branche surcharge ; l'origine du moteur **traverse** intacte |
| `dto/surcharge-rattachement.dto.ts` | `@ApiProperty({ enum, enumName })` + description ordonnée du plus fort au plus faible |
| `test/openapi-contract.e2e-spec.ts` | ⛔ **le seul filet possible** : `*.dto.ts` est hors `collectCoverageFrom`, donc retirer l'`enum` ne ferait bouger **aucun** chiffre de couverture |

### Portes DoD

lint **0 warning** · build OK · **3 364** unitaires · **840** e2e (26 suites) · couverture
**99,13 / 92,29 / 98,61 / 99,23** — `rattachement.regles.ts` à **100 / 100 / 100 / 100**.

### Passe de mutation — 8 mutations, 8 rouges, 8 compilent… après **une verte**

| # | Mutation | Verdict |
|---|---|---|
| M1 | mot-clé du libellé étiqueté `DEFAUT` | 🔴 |
| M2 | activité étiquetée `MOT_CLE` | 🔴 |
| M3 | le `DEFAUT` étiqueté `ACTIVITE` — le cas qui compte devient invisible | 🔴 |
| M4 | la règle de l'organisation étiquetée `MOT_CLE` | 🔴 |
| M5 | `REGLE` posée dès qu'une surcharge **existe**, même ignorée | 🔴 |
| M6 | `enumName` retiré — l'enum redevient anonyme côté client | 🔴 |
| M7 | l'enum publie **3 valeurs sur 4** (`DEFAUT` tombe) | 🔴 |
| M8 | `origine!` → `origine?` en TypeScript | ⚠️ **VERTE** |
| M8′ | `@ApiProperty` → `@ApiPropertyOptional` | 🔴 |

⚡ **M8 verte est le vrai enseignement de la passe** : rendre le champ optionnel **en TypeScript** ne
change **rien** au document OpenAPI — `@ApiProperty()` force `required` quelle qu'en soit
l'optionalité TS. Ma mutation ne mutait donc pas ce que je croyais. Le geste qui rend réellement
`origine` facultative au contrat est `@ApiPropertyOptional`, et **celui-là rougit**. Une mutation
verte n'accuse pas toujours le test : ici elle accusait **la mutation**, et il fallait la refaire au
bon endroit pour savoir lequel des deux était en cause.

### Vérification docker — les 4 provenances servies par la route réelle

Stack réelle (`mongo` + `auth-service` + `balance-service`), tenant réel, dossier `ACTIF`, règle de
rattachement créée **par l'API** (`PUT …/rattachement/surcharges` → 200).

| Entrée | `origine` | compte | motif servi |
|---|---|---|---|
| `tiers=SODIGAZ` (règle du cabinet) | **`REGLE`** | 706 | règle de l'organisation sur le tiers « SODIGAZ » |
| `libelle=vente de ciment` | **`MOT_CLE`** | 701 | libellé de la ligne (« vente ») |
| `libelle=Cabinet de conseil` | **`MOT_CLE`** | 706 | libellé de la ligne (« conseil ») |
| `libelle=Facture n° 12` | **`DEFAUT`** | 701 | aucun indice dans la ligne ni dans l'activité |
| `libelle=Règlement` | **`DEFAUT`** | 701 | aucun indice dans la ligne ni dans l'activité |

⚡ **Et le contrôle DISCRIMINE** : après avoir seulement posé un `profil_societe` portant
`objetSocial: "prestation de service aux entreprises"`, **la même entrée** `libelle=Facture n° 12`
bascule de `DEFAUT`/701 à **`ACTIVITE`/706**. Ce n'est pas « la route répond » : c'est la preuve que
les quatre étiquettes suivent réellement la branche empruntée.

Contrat publié (`/api/docs-json`) : `OrigineProposition` = `['REGLE','MOT_CLE','ACTIVITE','DEFAUT']`,
`PropositionRattachementDto.origine` en `$ref` vers ce schéma nommé, et
`required: ['compte','motif','origine','surcharge']`.

---

## Progress Tracking — clôture

### Revue de code — **0 constat**

Le relecteur a instruit les quatre axes et passé **sa propre** campagne de 8 mutations en bac à
sable (copie du service, `node_modules` en lien symbolique — le dépôt n'a jamais été touché),
chacune précédée d'un `tsc --noEmit` pour écarter les faux rouges par erreur de compilation :
`depuis` qui perd `origine`, moteur qui cesse de lire le tiers, retombée qui écrase l'origine,
`enumName` retiré, `enum` retiré, enum tronqué à 3 valeurs, tuple réordonné. **7 rouges sur 7
compilables.**

⚡ **Les deux tests que je lui avais demandé de suspecter tiennent** : « les QUATRE valeurs sont
réellement produites » n'est pas vacant (le `Set` est construit en **rejouant** le moteur : une
branche mal étiquetée fait tomber le cardinal à 3, et une valeur ajoutée à l'énumération sans cas
rougit aussi) ; « le cas `DEFAUT` s'isole » non plus (le filtre rend 3 lignes sur 4, donc il rougit
**dans les deux sens** — si `DEFAUT` disparaît comme s'il déborde).

### Revue de sécurité — **0 vulnérabilité**

⚡ **L'argument qui referme le sujet** : `origine` est un **sous-ensemble strict** de ce que `motif`
publiait **déjà**. Le motif divulgue *davantage* — la valeur saisie de la règle et le mot-clé qui a
matché. La PR remplace une phrase par une étiquette plus **grossière**. Et l'oracle « existe-t-il une
règle pour ce couple ? » est **déjà offert en clair au même rôle** par `GET …/rattachement/surcharges`.
Aucun signal cross-tenant : sur un `dossierId` étranger la liste est vide et l'origine retombe sur
`MOT_CLE`/`ACTIVITE`/`DEFAUT`, **indistinguable** d'un dossier légitime sans règle.

⚡ **Deux vérifications que je n'avais pas faites, et qui auraient pu faire mentir l'étiquette** :
① `activite` est construit par la **même expression** (`[codeNaema, secteur, objetSocial]
.filter(...).join(' ')`) dans le service de **proposition** et dans le service de **saisie** — donc
l'origine affichée correspond bien à ce que l'écriture appliquerait ; ② `enumName:
'OrigineProposition'` n'entre en **collision** avec aucun des 39 autres `enumName` du service : un
schéma nommé écrasé par un jeu de valeurs étranger aurait été un défaut invisible au test.

### Suites documentées — hors périmètre, et volontairement

- ⚠️ **L'origine est jetée sur le chemin d'écriture.** `cahiers-recettes.service.ts` ne garde que
  `proposerRattachement(...).compte` : une ligne **créée** sur un compte `DEFAUT` ne porte donc
  **aucun signal en base**. Cette story vise l'endpoint de **proposition** ; persister la provenance
  sur la ligne est le prolongement naturel — et une story à part entière (elle touche le schéma, la
  migration des lignes existantes et le contrat des deux cahiers).
- `ORIGINES_SUGGESTION` (STORY-139) nomme **`SURCHARGE`** ce que `ORIGINES_PROPOSITION` nomme
  **`REGLE`** : deux contrats publics du même service, même concept, deux mots. Divergence réelle,
  dictée par les énoncés respectifs, à trancher quand l'un des deux bougera.
- `SuggestionCompteDto.origine` publie son enum **sans `enumName`** — donc anonyme côté client, là
  où celui-ci est nommé. Pré-existant, non touché.

### Portes DoD finales

lint **0 warning** · build OK · **3 364** unitaires · **840** e2e (26 suites) · couverture
**99,13 / 92,29 / 98,61 / 99,23** — `rattachement.regles.ts` à **100 %** sur les quatre axes.
**8 mutations de développement + 8 de revue, toutes rouges** sur les variantes compilables.
