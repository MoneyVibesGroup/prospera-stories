# STORY-421 : Un moyen de paiement oublié devient une créance client — la balance tombe juste et le bilan porte un actif qui n'existe pas

Status: done

**Épic :** EPIC-020 — Cahiers & rattachement (Atelier Balance)
**Service :** `balance-service` (`:3007`) — `modules/cahiers/agregation`
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-046**, à la revue « expert-comptable venant de Sage » demandée par le PO.

---

## Le fait, relevé à la source

La contrepartie d'une transaction est déduite du **moyen de paiement**, et à défaut, du **tiers** :

```ts
// ventilation.regles.ts — resoudreContrepartie
switch (entree.moyenPaiement) {
  case 'ESPECES':       return comptes.caisse;
  case 'BANQUE':        return comptes.banque;
  case 'MOBILE_MONEY':  return comptes.mobileMoney;
  default:
    if (entree.tiers == null || entree.tiers.trim() === '') return null;
    return sens === 'RECETTE' ? comptes.clients : comptes.fournisseurs;
}
```

Il n'existe **aucun état « à crédit »**. L'absence de moyen de paiement **est** le signal du
crédit. Or ce n'est pas la même chose :

| ce que la donnée dit | ce que le système en conclut |
|---|---|
| « vendu à crédit à SODIFAB » | créance `411` — **correct** |
| « vendu à SODIFAB, j'ai oublié de cocher espèces » | créance `411` — **faux** |

Les deux sont **indiscernables au contrat** : `moyenPaiement` est optionnel, et son absence
n'est jamais rapportée.

---

## Ce que ça coûte, concrètement

C'est le seul défaut de ce lot qui **passe dans les états financiers**, et il est invisible à
tous les contrôles existants :

- la ventilation reste **équilibrée** (`411` au débit, `701` au crédit) ⇒ les deux contrôles
  d'équilibre tombent juste ;
- la transaction n'est **pas écartée** (`resoudreContrepartie` rend un compte) ⇒ elle
  n'apparaît pas dans `nonVentilables` ;
- `avertissements[]` n'en dit rien — il ne porte que l'inventaire, le socle d'à-nouveaux et le
  compte des non ventilables (`agregation.service.ts`, `D-085-9`).

**Conséquence sur la liasse :** la trésorerie est **sous-évaluée** et le poste **Clients**
porte une créance sans débiteur. Au bilan suivant, cette créance ne s'apure jamais — elle
devient un actif douteux qu'aucun rapprochement ne peut expliquer, puisqu'aucun relevé ne la
contredit (l'argent, lui, est bien passé en caisse **sans écriture**).

⇒ Et c'est précisément la population concernée : le cahier papier d'un commerçant est le
support où le moyen de paiement est **le plus souvent** laissé vide, parce que « tout le monde
sait » que c'était du comptant.

---

## Ce qui est demandé

Ce n'est **pas** une story de correction du moteur : la règle de `resoudreContrepartie` est
défendable et la changer serait pire. C'est une story de **visibilité**.

1. **L'aperçu publie la répartition de ses contreparties.** Aujourd'hui `AgregationApercuDto`
   rend des lignes par compte : on voit le solde de `411`, on ne sait pas d'où il vient. Ajouter :

   ```ts
   @ApiProperty({ type: [ContrepartieApercuDto] })
   contreparties!: {
     compte: string;             // '411'
     motif: 'MOYEN_PAIEMENT' | 'TIERS_SANS_MOYEN_PAIEMENT';
     nbTransactions: number;
     montant: number;            // unités mineures XOF
   }[];
   ```

2. **Un avertissement typé** quand `TIERS_SANS_MOYEN_PAIEMENT` est non vide — dans
   `avertissements[]`, à côté de celui de l'inventaire :
   *« N transaction(s) sans moyen de paiement ont été portées en compte de tiers (créance /
   dette). Si elles ont été encaissées ou payées, la trésorerie est sous-évaluée d'autant. »*

3. ⚠️ **Ne PAS refuser**, ne pas écarter, ne pas deviner. Une vente à crédit est parfaitement
   régulière ; c'est au comptable de trancher, et il ne peut le faire que si on lui montre le
   chiffre.

---

## Critères d'acceptation

1. `POST …/balance/depuis-cahiers` (aperçu **et** persistance) publie `contreparties`, avec le
   motif par compte.
2. Une transaction avec `tiers` et **sans** `moyenPaiement` compte en
   `TIERS_SANS_MOYEN_PAIEMENT` — testé sur les **deux** sens (recette → `411`, dépense → `401`).
3. L'avertissement apparaît **si et seulement si** au moins une transaction est dans ce cas, et
   porte le nombre et le montant.
4. Aucune transaction n'est écartée ni refusée du fait de cette story — un test doit rougir si
   `nonVentilables` grossit.
5. OpenAPI régénéré ; types du front régénérés.

---

## Notes

- ⚠️ **Ce que cette story ne fait pas, et qui reste ouvert** : rendre le moyen de paiement
  **obligatoire à la saisie** quand la ligne est cochée « encaissée ». C'est une décision de
  produit (elle alourdit la saisie du seul utilisateur qui tient un cahier papier) ⇒ à poser au
  PO séparément. La visibilité, elle, n'a pas de contrepartie : elle ne coûte rien à personne.
- Voir [[FE-046]] (maquette, panneau « Contreparties »), `stories/STORY-085.md` (D-085-3 :
  aucun compte d'attente, aucune ligne d'écart).

---

## Progress Tracking

### Ce qui a été livré (`MNV-421`, `balance-service`)

**Story de visibilité, pas de correction du moteur.** `resoudreContrepartie` garde exactement
les mêmes comptes, les mêmes conditions et le même `null` : elle rend désormais le **couple**
`(compte, motif)` au lieu du seul compte.

| Pièce | Ce qu'elle fait |
|---|---|
| `MOTIFS_CONTREPARTIE` (`types/ventilation.ts`) | `MOYEN_PAIEMENT` (contrepartie **constatée**) · `TIERS_SANS_MOYEN_PAIEMENT` (contrepartie **déduite** d'une case vide) |
| `resoudreContrepartie` | rend `{ compte, motif }` — **règle inchangée** |
| `ventiler*` | portent la contrepartie **dans leur résultat** : le motif ne se recalcule nulle part ailleurs, donc pas de seconde source de vérité |
| `agregerContreparties` | répartition par **couple**, tri `compte` puis `motif` |
| `contreparties[]` | publié sur l'**aperçu ET la persistance** (AC-1) |
| avertissement typé | 2ᵉ position, avec **nombre et montant**, dans la **devise du dossier** (STORY-387/409), **sans requête de plus** — le profil est déjà lu par le `Promise.all` |

⚠️ **La clé d'agrégation est le COUPLE, pas le compte.** Les comptes de contrepartie sont
paramétrables (D-085-5) : rien n'interdit à un cabinet de désigner le même numéro pour `caisse`
et pour `clients`. Agrégé par compte seul, il faudrait choisir **un** motif pour deux
populations — c'est-à-dire publier une affirmation fausse sur le champ même dont toute la story
est de dire la vérité.

⚠️ **Les transactions écartées ne pèsent pas** dans la répartition (leçon **F-420-2**) : elles ne
produisent aucune écriture, donc aucun montant à rapprocher d'un solde.

⛔ **Hors périmètre, laissé ouvert** : rendre le moyen de paiement **obligatoire à la saisie**
quand la ligne est cochée encaissée — décision produit, à poser au PO séparément.

### Portes DoD

Lint 0 warning · build OK · **3 429 unitaires** verts · **859 e2e** verts · couverture globale
`99.14 / 92.28 / 98.63 / 99.25` (seuils 65/90/90/90, jamais abaissés).

### Passe de mutation — 8 mutations, toutes compilantes, toutes rouges

⚠️ Chacune a été vérifiée `tsc --noEmit` **exit 0** avant de compter : *une mutation rouge par
erreur de compilation ne prouve rien* (leçon STORY-411/412). Deux variantes ont été **rejetées**
à ce titre (`noUnusedLocals` sur `devise` puis sur `deviseDuProfil`) et rejouées sous forme
compilable.

| # | Mutation | Rouges |
|---|---|---|
| 1 | le motif du crédit devient `MOYEN_PAIEMENT` — **le défaut de la story, réintroduit** | 11 |
| 2 | la clé d'agrégation redevient le **compte seul** | 1 |
| 3 | le tri disparaît | 1 |
| 4 | l'avertissement devient inconditionnel (`>= 0`) | 1 |
| 5 | la persistance publie une liste vide | 1 unit + 1 e2e |
| 6 | `enumName` retiré du `motif` — l'enum redevient inline | 2 e2e OpenAPI |
| 7 | les transactions **écartées** entrent dans la répartition | 1 |
| 8 | la devise est figée au défaut au lieu de venir du dossier | 1 |

### Vérification docker — sur stack neuve, et elle **DISCRIMINE**

`docker compose down -v` puis stack réelle. Tenant réel, dossier réel, **4 transactions créées
par l'API** : 2 encaissées (banque 118 000, espèces 75 000) et **2 sans moyen de paiement** avec
tiers nommé (recette SODIFAB 50 000, dépense SODIGAZ 30 000).

```
contreparties (aperçu ET persistance, HTTP 201)
compte  motif                        montant     nbTransactions
401     TIERS_SANS_MOYEN_PAIEMENT     3 000 000        1
411     TIERS_SANS_MOYEN_PAIEMENT     5 000 000        1
521     MOYEN_PAIEMENT               11 800 000        1
571     MOYEN_PAIEMENT                7 500 000        1

avertissements[1] = « 2 transaction(s) sans moyen de paiement, soit 80 000 XOF, ont été
portées en compte de tiers (créance / dette). Si elles ont été encaissées ou payées, la
trésorerie est sous-évaluée d'autant. »

nonVentilables = []   ·   nbEcritures = 8   ·   estEquilibre = true
```

⚡ **AC-4 sur la machine** : `nonVentilables` reste **vide** et la balance reste équilibrée —
rien n'est écarté ni refusé du fait de la story.

⚡ **AC-3 « si et seulement si », prouvé par contre-épreuve** : on coche `ESPECES` sur les deux
lignes à crédit (`PATCH` × 2, HTTP 200) et on rejoue l'agrégation — `401` et `411` **disparaissent
de la répartition**, les trois encaissements espèces se regroupent sous `571` en
`nbTransactions: 3, montant: 15 500 000`, et **l'avertissement disparaît**. Le compteur n'est
donc pas décoratif : il suit la donnée dans les deux sens.

⚠️ **Le document persisté est INCHANGÉ**, relu en `mongosh` sur la balance réelle
(`db.balances`, v2, checksum `7ab8a61a…`) :

- clés racine : `__v, _id, annotationRisque, auteur, checksum, checksumVersion, createdAt,
  dossierId, etat, exercice, historiqueMutations, horodatage, lignes, orgId, referentiel,
  sommaire, source, statutPreuve, updatedAt, version` — **aucun `contreparties`** ;
- clés de ligne : `compte, libelle, libelleSource, mouvementCredit, mouvementDebit,
  niveauPreuve, soldeCrediteur, soldeDebiteur` — **aucun `motif`** ;
- `libelleSource` de STORY-420 toujours servi (`6132` = `CATEGORIE`, le reste = `PLAN`) ;
- `sommaire.estEquilibre = true`, `27 300 000` de chaque côté.

⇒ `contreparties` est un champ **dérivé de réponse**, jamais une seconde source de vérité en base
(même doctrine que D-085-6).

### AC-5 — OpenAPI et types du front

OpenAPI est généré au runtime depuis les décorateurs : `MotifContrepartie` (énumération **nommée**),
`ContrepartieApercuDto` (4 champs, tous `required`, `motif` en `$ref`) et `contreparties` sur les
**deux** DTO de réponse sont gardés par 4 tests neufs de `test/openapi-contract.e2e-spec.ts` —
⚠️ seul filet possible, `collectCoverageFrom` excluant les `*.dto.ts`.

⛔ **La régénération des types du front n'est pas faite ici** : ce dépôt n'a aucun droit de push
sur les dépôts frontend. Le contrat est publié et nommé, ce qui est la moitié dont
`balance-service` répond ; la régénération côté FE-046 reste à faire par le dev front.

---

## Progress Tracking — clôture

### Revue de code : 4 constats · Revue de sécurité : 0 vulnérabilité — tous traités

| # | Constat | Ce qu'il laissait passer |
|---|---|---|
| **F-421-1** (bloquant) | ⚡⚡ **Les deux motifs poussent la trésorerie en sens OPPOSÉS**, et l'avertissement les additionnait sous une **seule** direction. | Une recette encaissée dont la case n'est pas cochée porte l'argent en `411` au lieu de la caisse ⇒ trésorerie **SOUS**-évaluée. Une dépense payée dans le même oubli porte la sortie en `401` ⇒ la caisse garde un argent déjà sorti, trésorerie **SUR**-évaluée. Sur le cahier mixte du banc d'essai, « la trésorerie est sous-évaluée de **193 000 XOF** » était faux **deux fois** : aucun compte ne l'est de ce montant, et l'erreur nette est de 43 000 dans l'autre sens pour la moitié dépense. ⛔ **Un comptable qui « corrige » sur cette phrase creuse l'écart** — sur le livrable central de l'AC-3, et le test le **verrouillait**. Le tableau publié, lui, était juste : seule la phrase confondait `411` et `401`. |
| **F-421-2** | La garde du **tri** était **VACANTE**. | Le départage par `motif` n'est atteint que si deux entrées partagent un compte. Le test fournissait ses deux entrées **déjà dans l'ordre attendu** et `Array.prototype.sort` est **stable** : retirer entièrement le départage le laissait **vert**. Il gardait une **convention** (l'ordre d'insertion), pas la **portée** (l'indépendance à l'ordre de lecture des cahiers) — que son titre promettait. |
| **F-421-3** | `RepartitionContrepartie` **étendait** `ContrepartiePortee`. | Le `{ ...portee }` servait `sens` au client **sans qu'aucun `@ApiProperty` ne le déclare** : un champ hors contrat, élagué par les clients générés, et **invisible aux tests de contrat OpenAPI** — qui ne regardent que ce qui **est** déclaré. Plus deux affirmations de JSDoc devenues fausses, dont une qui portait une **instruction de maintenance**. |
| **F-421-4** | Second **appelant de production** de `deviseDuProfil`, contre **D-409-3**. | `BalanceService.deviseDuDossier` promet de suivre son re-scopage en `(orgId, dossierId)` « **sans changer d'appelants** » : cette seconde lecture, elle, ne suivrait pas. Après le re-scopage, un **refus de balance** citerait la devise du **dossier** et cet avertissement celle du **cabinet** — sur la **même réponse**. |
| *(revue de sécurité)* | Branche à `parts` vide si tous les montants étaient nuls. | Classée **hors sécurité** et corrigée quand même : la phrase sortait cassée (« … portées en compte de tiers : . Si elles… »). Le cas est fermé par `@Min(1)` et `min: 1` — mais **ailleurs**. Le tri se fait désormais sur la **présence** de transactions, ce qui le rend impossible **ici**. |

**Constat ponytail appliqué** : le comparateur de tri (11 lignes de ternaires imbriqués) supprimé au
profit d'un tri **sur la clé de regroupement elle-même** — `\u0000` étant strictement inférieur à tout
caractère de compte, l'ordre lexicographique de `compte\u0000motif` **est** l'ordre du couple. Un seul
endroit où dire ce qu'est le couple, au lieu de deux (−8 lignes).

### Revue de sécurité — 0 vulnérabilité, vérifiée axe par axe

PR strictement **additive et dérivée** : aucune route, aucun guard, aucun décorateur, aucun DTO
d'entrée, aucun champ persisté. Fuite transverse (les mêmes numéros de compte figurent **déjà** dans
`lignes[].compte` de la même réponse, aux mêmes rôles) · injection dans la phrase (n'interpole que des
entiers, des montants formatés et une `devise` en liste fermée — **aucune** donnée textuelle
utilisateur, **aucun** sink : ni log, ni Kafka, ni export) · devise scopée à l'`orgId` du JWT ·
fail-closed (aucune valeur nulle n'ouvre de chemin permissif) · throttler global couvrant la route ·
intégrité comptable (mêmes écritures, même checksum, `contrepartiesPortees` alimenté **après** le
`continue` des non ventilables).

### 4 mutations supplémentaires sur l'état corrigé — toutes compilantes, toutes rouges

| Mutation | Rouges |
|---|---|
| la conséquence redevient **univoque** (F-421-1 réintroduit) | 2 |
| le `sens` de la **dépense** devient `RECETTE` (inversion d'un cran) | 5 |
| le tri retombe sur le **compte seul** (départage par motif perdu) | 1 |
| le **spread** revient et `sens` **fuit** dans le contrat publié | 7 |

**12 mutations au total** sur la story. ⚠️ Trois variantes ont été **rejetées** pour non-compilation
(`noUnusedLocals` sur `devise`, sur `deviseDuProfil`, sur `MOTIFS_CONTREPARTIE`) et rejouées sous forme
compilable — *une mutation rouge par erreur de compilation ne prouve rien*.

### Vérification docker **rejouée sur l'état final** — et elle discrimine dans les TROIS directions

Les correctifs ont changé le texte de l'avertissement, artefact déjà mesuré en phase ④ : rejouée.

```
cahier MIXTE (4 encaissées + 1 créance + 1 dette)
compte  motif                        nbTransactions   montant
401     TIERS_SANS_MOYEN_PAIEMENT          1          7 500 000
411     TIERS_SANS_MOYEN_PAIEMENT          1         11 800 000
521     MOYEN_PAIEMENT                     1         11 800 000
571     MOYEN_PAIEMENT                     3         15 500 000

« 2 transaction(s) sans moyen de paiement ont été portées en compte de tiers :
  118 000 XOF en créance client (recettes) et 75 000 XOF en dette fournisseur
  (dépenses). Si elles ont en réalité été encaissées ou payées, la trésorerie est
  faussée d'autant : SOUS-évaluée par les créances, SUR-évaluée par les dettes. »
```

Les **deux cas mono-côté** ont été mesurés sur deux dossiers dédiés :

- créances seules ⇒ « … 50 000 XOF en créance client (recettes). … la trésorerie est **SOUS**-évaluée
  d'autant. » — la dette n'est **pas** citée ;
- dettes seules ⇒ « … 30 000 XOF en dette fournisseur (dépenses). … la trésorerie est **SUR**-évaluée
  d'autant. » — c'est exactement la phrase que la première rédaction disait **à l'envers**.

⚡ **F-421-3 prouvé sur la machine** : `Object.keys(contreparties[0])` rend
`compte, montant, motif, nbTransactions` — **quatre** champs, `sens` ne fuit pas.

⚠️ **Le document persisté reste INCHANGÉ** (`db.balances`, v3, checksum `696af80b…`) : aucun
`contreparties` à la racine, **aucun `motif` ni `sens` sur les lignes**, `libelleSource`/`categories`
de STORY-420 intacts, `sommaire.estEquilibre = true`. ⇒ `contreparties` est un champ **dérivé de
réponse**, jamais une seconde source de vérité en base.
