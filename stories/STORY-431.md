# STORY-431 : Les comptes écartés ne sont relevés que sur N — la colonne N-1 peut être minorée sans qu'aucun avertissement ne le dise

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/compte-resultat-production.service.ts`,
`etats/bilan-production.service.ts`
**Points :** 2 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27.

---

## Le fait

Les deux moteurs agrègent **deux jeux de soldes** et **jettent la moitié du diagnostic** :

```ts
const aggN  = this.agreger(pkg, soldesN,  surcharges);
const aggN1 = soldesN1 ? this.agreger(pkg, soldesN1, surcharges) : undefined;
…
comptesNonMappes: aggN.nonMappes,      // ← aggN1.nonMappes n'est jamais lu
```

`aggN1` calcule ses propres `nonMappes` — puis ils disparaissent.

## Ce que ça produit

Un compte présent **uniquement en N-1** et rattaché à aucun poste (un compte que le cabinet a
soldé et cessé d'utiliser, un compte d'attente de l'exercice précédent, un compte dont la
surcharge de rattachement a été créée **après** la clôture N-1) :

- son solde **n'entre pas** dans les colonnes N-1 ;
- il **n'apparaît dans aucune liste** ;
- la variation N/N-1 affichée est donc fausse, **et l'écran l'annonce comme un fait**.

⚠️ Et l'avertissement existant dit le contraire de ce qui se passe : l'écran affiche
« *aucun compte écarté* » sur la foi de `comptesNonMappes: []` — vrai pour N, muet sur N-1.

C'est la **même famille de défaut** que celui relevé par FE-030 sur la compensation
(« *autant de débit que de crédit écartés se compensent : l'équation tombe juste et la liasse
est fausse* ») : un contrôle qui ne couvre qu'une partie du périmètre est **plus dangereux**
qu'un contrôle absent, parce qu'il rassure.

---

## Critères d'acceptation

- [ ] AC-1 — `BilanDto` et `CompteResultatDto` publient `comptesNonMappesN1: string[] | null`
      (`null` si aucun jeu N-1 n'a été produit — **jamais `[]`**, qui voudrait dire
      « produit, et aucun écarté »).
- [ ] AC-2 — Le champ existant `comptesNonMappes` **ne change pas de sens** (il reste N) ; le
      renommer casserait STORY-059/060 et leurs tests.
- [ ] AC-3 — Test : un compte non mappé présent **seulement** dans `soldesN1` ⇒
      `comptesNonMappes: []` **et** `comptesNonMappesN1: ['<compte>']`. C'est la preuve du
      manque actuel.
- [ ] AC-4 — Sans `soldesN1` : `comptesNonMappesN1: null`.

## Vigilance

- ⚠️ Ne **pas fusionner** les deux listes. Un compte écarté en N-1 mais rattaché en N est une
  information différente d'un compte écarté dans les deux : les fondre reproduirait, à l'envers,
  le défaut que STORY-427 corrige sur les postes.
- ⚠️ La même remarque vaut pour le **TFT** (`tft-production.service.ts`) et les **contrôles de
  cohérence** (`controles-coherence-production.service.ts`) s'ils lisent `aggN` seul :
  à vérifier au passage, et à ficher séparément le cas échéant.

## Conséquences ailleurs

- **FE-032** affiche déjà l'avertissement dans l'état « Comptes écartés » et **le dit
  explicitement** : « ce contrôle ne porte que sur N ».

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker réelle**,
PR `bilan-service` **#61** (3 commits) rebase-mergée sur `dev` le 2026-09-02.

### Ce qui est livré

- **AC-1** — `comptesNonMappesN1: string[] | null` publié par `BilanDto` **et** `CompteResultatDto`.
  `null` — **jamais `[]`** — sans jeu N-1. Les deux affirmations diffèrent (« pas de colonne
  comparative » vs « colonne produite, et rien d'écarté »), et c'est l'écran qui doit les rendre.
- **AC-2** — `comptesNonMappes` ne change pas de sens : il reste l'exercice N. Aucun test de
  STORY-059/060 touché.
- **AC-3 / AC-4** — couverts en unitaire sur les **deux** moteurs et **au contrat OpenAPI** : la
  réponse RÉELLE confrontée au schéma publié, dans les deux branches (avec et sans `soldesN1`).
- **Vigilance** — listes **séparées**, jamais fusionnées : un compte écarté en N-1 mais rattaché en
  N croise un compte écarté en N mais rattaché en N-1, et chaque liste ne porte que sa colonne.

### Écart relevé au passage — TFT et contrôles de cohérence

La Vigilance demandait de vérifier `tft-production.service.ts` et
`controles-coherence-production.service.ts`. **Ni l'un ni l'autre n'agrège de soldes** : leurs
signatures sont `produire(pkg, bilan, cr)` et `produire(bilan, coherence, tft, notes, coherenceSig)`
— ils travaillent sur les **états déjà produits**. Il n'y a donc **pas** de passe `aggN1` à
récupérer chez eux, et **rien à ficher** de ce côté.

Le seul point de contact est `controleComptesNonAffectes`, qui lit `bilan.soldesComptesNonMappes`,
c'est-à-dire **N seul**. Étendre la **batterie** à `N-1` reste un écart distinct, délibérément hors
périmètre : ce champ **rapporte**, il ne fait basculer aucun statut. Le mesurer a en revanche livré
la borne exacte du silence (ci-dessous), et elle est plus étroite que la fiche ne le supposait.

### ⚡⚡ Le défaut le plus grave de cette story était DANS MON CORRECTIF

Après la vérif docker, j'ai réécrit **deux JSDoc** (`bilan.types.ts` sur `soldesComptesNonMappes`,
et `controleComptesNonAffectes`) pour affirmer que l'équilibre `N-1` **« ne dit rien »** d'un compte
écarté du seul `N-1` — et j'ai verrouillé cette affirmation par un test. **Les deux étaient faux**,
et c'est la **revue de code** qui l'a pris (constat bloquant, confiance 96).

La fixture — et la vérification docker bâtie sur la **même** entrée — ajoutait à un jeu `N-1`
équilibré une **ligne de débit seule** de 4 500 000. Le déséquilibre injecté valait **exactement**
le solde exclu : les deux s'annulaient. `ecartN1 = 0` sortait de la **construction de la fixture**,
pas du mécanisme d'exclusion. J'ai mesuré une coïncidence et j'en ai tiré un théorème — le piège
« échantillon vs théorème » de STORY-417, à ceci près qu'ici l'échantillon **n'était même pas une
balance**.

Sur une balance `N-1` **réelle** (contrepartie présente) :

```
ecart = totalActif − (totalPassif + résultat) = Σ_mappés (D − C) = −Σ_écartés (D − C)
```

Mesuré : `999999` à 4 500 000 dans une `N-1` équilibrée ⇒ `ecartN1 = -4 500 000`,
`equilibreN1 = false`. **L'équilibre rougit**, et du montant exact.

**La borne vraie est plus étroite — et elle suffit à fonder la story.** L'équilibre porte le
**montant** sorti des états, **jamais le nom** du compte ; et il est **totalement muet** dans deux
cas : les soldes écartés qui **se compensent** (mesuré : 9 000 000 sortis, `ecartN1 = 0`,
`equilibreN1 = true`, `COMPTES_NON_AFFECTES = OK`, `valide = true` — le cas FE-030 à une colonne de
distance) et un écarté de **solde net nul**. ⛔ Le JSDoc de `controleComptesNonAffectes` énonçait
déjà ce mécanisme **trente lignes plus haut** : ma « correction » le contredisait **dans le même
bloc de commentaire**.

Les deux JSDoc sont rétablis et **complétés** (les deux cas muets nommés), et le fait est borné
**dans les deux sens** par deux tests — celui qui rougit et celui qui reste vert.

### ⚡ Un garde-fou qui ne gardait que la moitié de ce qu'il annonçait

La sonde `moteur-version.spec.ts` fige la **forme** produite à côté de `MOTEUR_VERSION` pour que le
bump ne soit pas oubliable. Elle regardait `Object.keys(bilan)`, `bilan.controle`, une **ligne** de
CR et une ligne de SIG — **jamais la racine du compte de résultat**. Un champ ajouté à
`CompteResultatProduit` (exactement ce que cette story fait, des deux côtés) changeait la forme
figée dans les snapshots **sans rien faire rougir** : la moitié du bump serait passée inaperçue.
Même famille que le trou refermé par STORY-426 sur `controle`. La sonde regarde désormais aussi
`Object.keys(cr)` — inventaire de 13 champs. **`MOTEUR_VERSION` 1.4.0 → 1.5.0.**

### Une garde vacante retirée

`compte-resultat-production.service.spec.ts` portait un test « la liste N-1 est une **COPIE** de la
passe N-1 ». `agreger()` est appelé **deux fois** et alloue son propre tableau à chaque passe : les
deux listes sont déjà des objets distincts. Le test passait **avec ou sans** la copie — mesuré :
retirer le spread le laissait vert. Test supprimé, spread retiré (le CR s'aligne sur le Bilan, un
seul style). Deux `not.toBeNull()` redondants retirés au passage : `toEqual([])` échoue déjà sur
`null`.

### Vérification docker réelle

Stack neuve (`down -v`), `auth-service` + `bilan-service`, référentiel `syscohada-revise@2.1`,
compte `999999` (absent du plan, donc rattaché à rien).

| Mesure | Résultat |
|---|---|
| `bilan/dry-run`, 999999 au seul N-1 | `comptesNonMappes: []`, `comptesNonMappesN1: ["999999"]` |
| `compte-resultat/dry-run`, même corps | idem |
| sans `soldesN1`, les deux routes | clé **présente**, valeur `null` (jamais absente) |
| snapshot **v1** (moteur `1.4.0`) | champ **absent**, et **intact** après redéploiement |
| snapshot **v2** (moteur `1.5.0`) | `["999999"]` des deux côtés |

Append-only prouvé sur le **même** jeu d'états (créer → valider → rouvrir → revalider) :
2 `snapshots_liasse`, 4 `audit_events` cohérents (`JEU_CREE`, `JEU_VALIDE`, `JEU_ROUVERT`,
`JEU_VALIDE`), 1 `jeux_etats`, aucun orphelin. ⚠️ **Le hot-reload a menti une fois** : « Found 0
errors » annoncé en servant encore l'ancien code — piège maison confirmé, `docker restart` avant
chaque mesure.

### Revue de sécurité — aucun constat

Instruits et écartés avec démonstration : la liste est un **sous-ensemble strict de l'entrée de
l'appelant** (aucune donnée d'un autre tenant — les deux chemins passent par
`DossierScopedRepository`, fail-closed) ; XSS et injection de formule tableur **structurellement
impossibles** (`@Matches(/^\d[0-9A-Za-z]{1,19}$/)` sur `LigneSoldeDto.compte` : ni `=`, ni `+`, ni
`@`, ni `<`, 20 caractères max) ; non-répudiation intacte (l'export d'une version figée reprend
`snapshot.moteurVersion`, **pas** la constante, et `empreinteDocument` ne voit pas le nouveau
champ) ; DoS écarté (`.map()` sur un tableau **déjà calculé**, borné par `@ArrayMaxSize(5000)`).

### Portes

lint **0 warning** · build OK · **1369 unitaires** + **377 e2e** verts · couverture
**98,67 / 93,63 / 98,63 / 98,64** · **9 mutations, 9 rouges par assertion** (mauvaise colonne des
deux côtés, `null` → `[]` des deux côtés, fusion des listes, `@ApiProperty` retirée, `nullable`
retiré, `MOTEUR_VERSION` non bumpée, liste N-1 vidée).

⚠️ **Signalé honnêtement** : un passage e2e complet a montré **1 échec isolé**, non reproduit sur
les **trois** passages complets suivants (377/377 à chaque fois) et dont la suite n'a pas pu être
identifiée, la sortie n'ayant pas été capturée. Flakiness à surveiller, aucune corrélation établie
avec ce diff.

### Dettes nommées, hors périmètre

- `LiasseDto.bilan` / `.compteResultat` restent publiés en `object` **opaque**
  (`jeu-etats-response.dto.ts`) : le nouveau champ n'y est donc pas lisible par un client généré.
  Dette pré-existante (famille STORY-376/427/430).
- `soldesN1: []` (tableau vide accepté) rend `comptesNonMappesN1: []` et non `null` — cohérent avec
  `totalActifN1: 0` et tous les autres champs N-1 depuis STORY-059. Comportement **pré-existant**.
