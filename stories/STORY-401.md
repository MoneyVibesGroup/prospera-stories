# STORY-401 : Aucun contrôle bloquant ne regarde les comptes non affectés — le hook de FR-006 n'a jamais été posé

Status: done

**Épic :** EPIC-010 — Référentiels & table de passage (FR-005..FR-008) · *atterrit dans le
code d'EPIC-011 (batterie de contrôles) et s'applique par le gate d'EPIC-012*
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `modules/bilan/jeu-etats`
**Points :** 3 · **Sprint :** S20
**Origine :** remontée le **2026-08-24** par **FE-030**, en écrivant le bandeau de garde
que son AC-4 exigeait — et en découvrant que la phrase demandée était fausse.

---

## Le fait, relevé à la source

La batterie bloquante compte **quatre** contrôles, et pas un ne regarde les comptes non
affectés :

```ts
// controles-coherence.types.ts
export type CodeControle =
  | 'EQUILIBRE_BILAN'
  | 'COHERENCE_RESULTAT'
  | 'VARIATION_TRESORERIE'
  | 'ARTICULATION_NOTES';
```

Et la validation n'exige rien d'autre que leur drapeau :

```ts
// jeu-etats.service.ts — valider()
if (!liasse.controles.valide) { /* 422 */ }
```

Le service **le dit lui-même**, dans le commentaire de son propre contrat :

> `nonMappes` est le signal qu'**EPIC-011** consommera pour bloquer la validation sur des
> comptes **significatifs** (la « significativité » = solde, indisponible ici → hook).

⛔ **Le hook n'a jamais été posé.** EPIC-011 est clôturé, EPIC-012 aussi, et
`nonMappes` n'apparaît dans aucun des deux.

---

## Ce que ça coûte, concrètement

Un compte non affecté n'est pas ignoré au sens du rattachement — il est bien listé — mais
son **solde est écarté de tous les états** : `BilanProductionService.agreger` n'itère que
sur `rattachement.mappes`. Une liasse peut donc être **produite et validée** en laissant
plusieurs millions de francs hors des totaux, sans qu'aucun contrôle ne le dise.

⚠️ **Ce n'est pas invisible pour autant, et c'est ce qui rend la story utile plutôt
qu'urgente** : comme le débit et le crédit écartés ne se compensent pas, l'omission
déséquilibre ce qui reste, et `EQUILIBRE_BILAN` finit par échouer. Le refus arrive donc —
mais **il désigne la mauvaise cause**. « L'actif ne correspond pas au passif » envoie
chercher une erreur d'écriture ; la cause réelle est ailleurs, et elle est nommable.

⚠️ **Et il existe un cas où rien ne le dit du tout** : si les montants écartés se
compensent (autant au débit qu'au crédit), la liasse est **équilibrée, validable, et
fausse** — un total d'actif et un total de passif tous deux minorés du même montant.

⇒ **Contournement en place (FE-030), et il a exigé de réécrire l'AC-4** : l'écran
n'annonce **pas** que la validation sera bloquée — elle ne l'est pas, et le serveur
l'aurait démenti au premier essai. Il annonce ce qui est **calculable et démontrable** :
les montants écartés au débit et au crédit, l'écart qui en résulte, et le fait que la
balance retenue étant équilibrée, ce qui en reste ne peut plus l'être. Un montant et une
conséquence, pas une menace.

---

## Périmètre

**Inclus**

- Un **cinquième contrôle** dans la batterie — `COMPTES_NON_AFFECTES` — porté par la même
  mécanique que les quatre autres (`categorie`, `statut`, `ecart`, `elements`).
- **Définir la significativité, et la définir par une valeur, pas par un adjectif.** La
  définition la plus défendable, et celle que le front applique déjà : *un compte non
  affecté est significatif si son solde est non nul*. Un seuil en francs est possible mais
  demande un arbitrage PO — et un seuil non tranché vaut moins qu'une règle nette.
- `BLOQUANT` ou `INFORMATIF` : **à trancher explicitement**, et le choix se justifie dans
  la story. `BLOQUANT` ferme le cas silencieux (montants qui se compensent) ; `INFORMATIF`
  laisse valider une liasse dont on sait qu'elle écarte des montants.
- Les `elements` de l'anomalie nomment **les comptes concernés et leur solde** — c'est
  tout l'intérêt par rapport à `EQUILIBRE_BILAN`, qui ne peut désigner que des totaux
  (« jamais un compte deviné », dit son propre contrat).

**Hors périmètre**

- **Affecter automatiquement** un compte non reconnu : l'automatisation propose, l'humain
  arbitre (invariant programme). Ce contrôle **signale**, il ne corrige pas.
- Le seuil de significativité en francs, s'il devait être autre chose que « solde ≠ 0 » :
  c'est une **décision PO**, à poser avant, pas à improviser dans le code.

---

## Critères d'acceptation

1. `CodeControle` compte un cinquième membre, et l'ajout **casse la compilation** de tout
   exhaustif qui ne le traite pas (patron STORY-375).
2. Une liasse produite sur des soldes dont un compte non affecté porte un solde non nul
   fait apparaître le contrôle en `ANOMALIE`, avec **les comptes** et **leurs soldes** en
   `elements`.
3. Les comptes non affectés **à solde nul** ne déclenchent rien — ils ne déplacent aucun
   total, et une alerte généralisée est pire que pas d'alerte.
4. Le cas **silencieux** est couvert par un test dédié : des montants écartés qui se
   compensent exactement produisent une liasse `EQUILIBRE_BILAN = OK` **et** ce contrôle
   en `ANOMALIE`.
5. La catégorie retenue (`BLOQUANT` / `INFORMATIF`) est **écrite et justifiée**, et le
   comportement de `valider()` s'y conforme.

---

## Notes

- ⚠️ **La story ne rouvre pas EPIC-011/012** : le hook qu'elle pose est déclaré par
  **FR-006** (`table-de-passage.types.ts`), c'est-à-dire par EPIC-010. Elle atterrit
  simplement dans le code des deux épics clôturés.
- ⚠️ **Conséquence frontend à ne pas oublier** : le jour où ce contrôle existe, le bandeau
  de FE-030 peut redevenir la phrase que la fiche demandait au départ — et **FE-034** peut
  lister ce blocage parmi les autres. Consommateurs nommés : **FE-030**, **FE-034**.
- ⚠️ **Écart de même famille que STORY-386** (« un champ de réponse dont l'échec est
  refusé en amont n'est pas un verdict ») : ici, c'est l'inverse exact — un verdict que la
  fiche annonçait et que **rien** ne produit. Dans les deux cas, la fiche décrivait un
  comportement que le service n'a pas.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
rejouée sur l'état final**, mergée en rebase sur `dev`. Clôturée le **2026-08-27**.

**PR** : `prospera-bilan-service` **#54**, 3 commits — feature (`c7accc1`), revue de code
(`03b2222`), revue de sécurité (`d7f70bd`). Branche `MNV-401` ouverte sur `bilan-service`
**et** sur `docs`. **Un seul dépôt de code** : aucun contrat d'événement Kafka n'est touché
(le contrôle est produit, jamais publié en événement).

### Les deux arbitrages que la story laissait ouverts

**① `BLOQUANT`, et le motif n'est pas « c'est plus prudent ».** C'est le **cas silencieux**
qui tranche : quand les soldes écartés se compensent, la liasse est équilibrée, validable et
fausse — actif et passif tous deux minorés du même montant. `INFORMATIF` laisserait passer
**ce cas-là précisément**, le seul qu'aucun autre contrôle ne peut dire. Dans tous les
autres, `EQUILIBRE_BILAN` finit par échouer, mais en **désignant la mauvaise cause** :
mesuré en docker, il rend « écart −4 500 000 » sur `totalActifN`/`totalPassifN` là où la
cause nommable est « le compte 999999 porte 4 500 000 et n'entre nulle part ».

⚠️ **La porte de sortie est nommée, sinon `BLOQUANT` serait un cul-de-sac** : rattacher le
compte par une **surcharge d'organisation** (FR-008). Le contrôle **signale**, il n'affecte
jamais d'office — l'automatisation propose, l'humain arbitre.

**② `ecart` = somme des VALEURS ABSOLUES, et le statut ne s'en déduit PAS.** Seul contrôle
de la batterie dans ce cas, et c'est structurel : la somme **signée** vaut `0` dans le cas
exact que ce contrôle existe pour attraper. Un `statut: ecart === 0 ? 'OK' : 'ANOMALIE'` —
le patron des quatre autres, celui qu'on écrit sans y penser — y rendrait le verdict
**muet**. Le statut se déduit du **nombre** de comptes significatifs. Mutation **M3**.

### AC-1 — la compilation, pas la vigilance

`CODES_CONTROLE` (patron STORY-375) + `Record<CodeControle, ControleArticulation>` dans
`produire()` : un code ajouté à l'inventaire **sans son constructeur** fait échouer `tsc`
(mutation **M1**, mesurée). L'ordre rendu suit l'**inventaire** (`CODES_CONTROLE.map`), pas
l'ordre du littéral — donc il ne peut pas diverger de l'`enum` publiée.

⚠️ **Et il a fallu publier le contrat pour que l'AC ait un sens côté client** : `controles`
sortait en `items: { type: 'string' }` (défaut STORY-398 — une **interface** n'a pas de type
d'élément), donc le code du 5ᵉ contrôle n'avait **nulle part où apparaître**. Publié :
`ControleArticulationDto` / `ControleElementDto` + `CodeControle`, `CategorieControle`,
`StatutControle` en énumérations nommées, **dérivées des constantes du service**. Les
objets opaques restants de ce DTO (`referentiel`, `stamp`) sont laissés à leur inventaire
figé — dette fichée ailleurs, consommateurs non livrés.

### Portes DoD

| Porte | Résultat |
|---|---|
| lint | **0 erreur, 0 warning** (`eslint --max-warnings 0`) |
| build | `nest build` **OK** |
| unitaires | **114 suites, 1206 passés**, 1 skippé |
| couverture | **98.71 st / 93.69 br / 98.42 fn / 98.66 li** — seuils 65/90/90/90 ; `controles-coherence-production.service.ts` et `bilan-production.service.ts` à **100 %** lignes et fonctions |
| e2e | **22 suites, 343 tests** verts |

### Table de mutations — chaque garde vérifiée non-vacante

| # | Mutation appliquée | Attendu | Mesuré |
|---|---|---|---|
| M1 | `COMPTES_NON_AFFECTES` retiré du `Record` exhaustif (AC-1) | rouge | **`tsc` TS2741** |
| M2 | `ecart` = somme **signée** (`Math.abs` retiré) | rouge | **1 rouge** |
| M3 | statut déduit d'une somme signée nulle (l'implémentation naïve) | rouge | **1 rouge** |
| M4 | significativité retirée (tout compte non affecté compte, même à solde nul) | rouge | **2 rouges** |
| M5 | `categorie: INFORMATIF` au lieu de `BLOQUANT` (AC-5) | rouge | **4 rouges** |
| M6 | `elements: []` (les comptes ne sont plus nommés, AC-2) | rouge | **2 rouges** |
| M7 | `comptesNonMappes` n'est plus **dérivé** (les 2 listes divergent) | rouge | **3 rouges** |
| M8 | solde net remplacé par le seul débit | rouge | **3 rouges** |
| M9 | `type: [ControleArticulationDto]` retiré du contrat | rouge | **4 rouges** (e2e contrat) |
| M10′ | l'`enum` publiée amputée du 5ᵉ code | rouge | **2 rouges** (e2e contrat) |
| M11 | `MOTEUR_VERSION` remise à `1.0.0` alors que la forme a changé | rouge | **1 rouge** |
| M12′ | un 6ᵉ contrôle ajouté au moteur **sans** bump de version | rouge | **1 rouge** |

⚠️ **M10 et M12 ont d'abord échoué par ERREUR DE COMPILATION** (import devenu inutilisé,
champ retiré cassant `BilanDto implements BilanProduit`) : une suite qui ne **tourne pas** ne
prouve rien. Rejouées sous une forme qui compile — c'est la seule façon d'obtenir un rouge
qui soit un rouge de **test**.

### Vérification docker — stack NEUVE (`down -v`), Mongo réel, référentiel réel

`mongo` + `auth-service` + `bilan-service`, organisation créée par `register`/`login` réels
(JWT RS256), read-models `orgkycstatuses` / `orgbilanentitlements` / `dossiers_dossier` /
`exercices_dossier` / `balances_balance` semés en `mongosh`, référentiel effectif
`syscohada-revise@2.1`.

| Mesure | Résultat |
|---|---|
| balance globalement équilibrée + `999999` (4,5 M écartés) | `EQUILIBRE_BILAN` **ANOMALIE** (écart −4 500 000, **mauvaise cause**) **et** `COMPTES_NON_AFFECTES` **ANOMALIE** nommant `999999` |
| **cas silencieux** — `999999` (+1 M) et `999998` (−1 M) | `EQUILIBRE_BILAN` **OK, écart 0** ; `COMPTES_NON_AFFECTES` **ANOMALIE, écart 2 000 000** ; `valide=false` |
| non affectés à solde **nul** (`D = C = 700 000`) | tout `OK`, `valide=true` — AC-3 sur le référentiel réel |
| `POST …/valider` sur le cas silencieux | **422 `LIASSE_NON_VALIDABLE`**, message `COMPTES_NON_AFFECTES : ANOMALIE (écart 2000000)` **et aucune ligne `EQUILIBRE_BILAN`** — le refus vient bien du seul contrôle neuf |
| état après le refus | `jeux_etats` **`BROUILLON`**, `validePar: null` · `snapshots_liasse` **0 doc** · `outbox_events` **0 doc** — aucun orphelin, aucun événement publié sans transition |
| validation d'une liasse saine | snapshot **v1** figé, **5 contrôles** persistés, `soldesComptesNonMappes` persisté, `liasse.etat.change` **`SENT`** |

### Vérification docker REJOUÉE sur l'état final

Les deux commits de revue touchent `src/` — dont des **descriptions publiées en OpenAPI** et
`MOTEUR_VERSION`, qui est **figé dans chaque snapshot**. La vérification a donc été refaite
après eux, service redémarré :

- **la preuve que le code exécuté est bien le code final** : `rouvrir` + `re-valider` scelle
  un snapshot **v2** portant `bilan-engine@1.1.0`, quand **v1 garde `1.0.0`** — la collection
  est append-only, aucune réécriture (2 documents) ;
- les **trois** cas du contrôle rendent **exactement** les mêmes verdicts et les mêmes écarts
  qu'à la première mesure ;
- le contrat publié porte `CodeControle` en énumération des **5** codes, `controles.items`
  et `soldesComptesNonMappes.items` en `$ref` (jamais `type: string`), et les **bornes
  ajoutées par la revue** sont bien dans les descriptions servies (« exercice N seul »,
  « Brut et Amort »).

⚠️ **Atomicité : rien de neuf à prouver, et le dire vaut mieux que l'affirmer.** Cette story
n'ouvre aucune transaction ; celle de `valider()` (snapshot + jeu, 2 documents) est celle de
STORY-065. Ce qui est vérifié ici, c'est le **chemin d'échec** : le 422 est levé **avant**
`startSession()`, donc ni snapshot orphelin ni ligne d'outbox — mesuré, pas déduit.

### Revue de code — 4 constats, les 4 traités (commit `03b2222`)

1. **La portée était écrite à l'universel, la garantie est l'exercice `N`** (confiance 92).
   Un compte non affecté du seul `N-1` minore toute la colonne comparative et se lit dans
   `ecartN1`/`equilibreN1`, pas ici. Borne **nommée** aux 3 endroits ; étendre la batterie à
   `N-1` reste un écart distinct, hors périmètre.
2. **« un compte à `D = C` ne déplace rien » était plus fort que le code** (confiance 82).
   Son solde net est nul — mais rattaché à un poste d'actif, il aurait alimenté la colonne
   **Brut** *et* la colonne **Amort**. Les deux colonnes DSF restent donc minorées. La
   définition retenue (solde net) ne change pas ; **sa borne est écrite plutôt que tue**.
3. **Le commentaire de portée décrivait l'angle mort trop étroitement** (confiance 90) —
   voir la section suivante.
4. **`ControlesCoherenceDto` n'`implements` pas son produit** (confiance 85) : le contrôleur
   répond par **spread**, qui échappe au contrôle des propriétés excédentaires. Un champ
   ajouté partirait dans la réponse sans entrer au contrat — ce que `BilanDto`, lui, vient
   d'attraper à la compilation pour `soldesComptesNonMappes`.

⚠️ **Piège rencontré en écrivant le JSDoc** : `**Brut**/**Amort**` contient la séquence `*/`
et **ferme le bloc de commentaire** — 90 erreurs de compilation pour deux astérisques.

### Revue de sécurité — 2 constats (commit `d7f70bd`)

**① `MOTEUR_VERSION` non incrémentée — corrigé ici (confiance 85, CWE-345, A08:2021).**
`moteur-version.ts` porte sa propre consigne (« à bumper manuellement dès qu'une évolution du
moteur change la valeur produite ») et cette PR change la valeur produite. Deux snapshots
**opposables** figés de part et d'autre du déploiement auraient porté le **même** tampon pour
un contenu différent ; et l'**empreinte** d'un export du **jeu courant** — journalisée à
l'audit — change alors pour des données inchangées sous une version identique : un
vérificateur qui compare conclut à une altération que rien n'explique. `1.0.0 → 1.1.0`, et
`moteur-version.spec.ts` fige désormais la **forme** de la sortie dans le **même littéral**
que la constante (mutations M11/M12′). Sa borne est écrite : il garde la **forme**, pas les
valeurs.

**② Contournement par une surcharge visant un poste sans règle exploitable — NON corrigé
ici, fiché en STORY-486 (confiance 95, CWE-693, A04:2021).** Un compte **rattaché** à un
poste dont la `regle` n'est pas exploitable est dans `mappes`, donc **invisible à ce
contrôle**, alors que `choisirRattachement` l'écarte tout autant : deux surcharges de ce
genre qui se compensent **rejouent à l'identique** le cas silencieux que cette story ferme —
avec une aggravation, le compte **paraît affecté** à l'écran.

⛔ **Pourquoi ne pas le corriger dans cette PR** — trois raisons, et la troisième est
décisive : il est **pré-existant** (la porte existe depuis FR-008), cette PR ne le rend **pas
nouvellement exploitable**, et surtout **le correctif minimal ne le fermerait pas** : refuser
à la source laisse passer toutes les surcharges **déjà `VALIDATED` en base**. L'ajouter ici
aurait donc élargi le périmètre *sans* fermer le risque — et vidé de moitié la story qui doit
le traiter. ⇒ **STORY-486**, avec sa mesure, et **nommée dans le JSDoc du contrôle** pour que
la borne du gate soit lue là où le gate est écrit.

### Hors périmètre, tenu

- **Aucune affectation automatique** d'un compte non reconnu : le contrôle signale, il ne
  corrige pas (invariant programme).
- **Aucun seuil en francs** : « solde net ≠ 0 » est la règle nette retenue ; un seuil reste
  une **décision PO**.
- **EPIC-011/012 ne sont pas rouverts** : le hook est déclaré par FR-006 (EPIC-010), la story
  atterrit seulement dans le code de deux épics clôturés.

### Ce que la story ouvre pour la suite

- **STORY-486** (créée par cette revue, 3 pts, S20) — la seconde porte de sortie d'un solde.
- **FE-030** peut redonner à son bandeau la phrase d'origine : le blocage existe désormais,
  et le serveur ne la démentira plus. **FE-034** peut lister ce blocage parmi les autres —
  le code est publié en énumération, les comptes et leurs soldes sont dans `elements`.
- ⚠️ **Ce que le 422 ne dit pas** : le message de refus porte `CODE : STATUT (écart N)`, il
  **n'énumère pas les comptes**. Ils sont dans la liasse (`elements`), que l'écran relit par
  `GET`. Enrichir le refus lui-même exigerait de borner l'énumération — non traité ici.
