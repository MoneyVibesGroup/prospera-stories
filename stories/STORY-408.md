# STORY-408 : Le vocabulaire mobile money ne se paramètre qu'en se trompant d'abord

Status: review

**Épic :** EPIC-021 — Profils d'import & mapping réutilisable
**Service :** `balance-service` (`:3007`) — `modules/balance/imports`
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium
**Origine :** relevée le **2026-08-25** en dessinant l'écran de profil de relevé de **FE-049** —
en cherchant d'où l'écran pouvait bien tirer la liste des valeurs à classer.

---

## Le fait, relevé à la source

Un relevé de **banque** porte deux colonnes `débit` / `crédit` : l'heuristique du serveur les
trouve seule. Un export **TMoney / Flooz** porte un montant toujours positif et une colonne
« Type » — et le serveur exige alors, à juste titre, les **deux** listes de vocabulaire :

```ts
// mapping-releve.regles.ts — manquantsConventionC
// « Une seule liste suffirait techniquement […] C'est précisément ce qu'on refuse :
//   la valeur inattendue (« Frais », « Annulation », une casse nouvelle) tomberait
//   alors dans le sens par défaut et fausserait la trésorerie sans aucun signal. »
```

⛔ **Mais rien ne publie ces valeurs.** `POST /dossiers/{id}/imports/analyser` rend
`colonnesDetectees`, `mappingPropose`, `manquants`… et un `apercu` de **cinq lignes**. Les valeurs
distinctes de la colonne de sens ne figurent nulle part — et cinq lignes ne les contiennent pas.

---

## Ce que ça coûte, concrètement

Le comptable ne peut pas finir son profil en un passage. Le parcours réel est :

1. il classe ce que les 5 lignes d'aperçu montrent (« Dépôt », « Retrait ») ;
2. il importe en aperçu → **`SENS_INDETERMINE` sur « Paiement marchand »** ;
3. il rouvre le profil, ajoute la valeur, revient, réimporte ;
4. …et recommence à la valeur rare suivante (« Frais », « Annulation »).

⚠️ **Le comportement du serveur est SAIN** : la ligne est rejetée, jamais devinée. Ce n'est donc
pas un bug — c'est un **contrat incomplet** qui transforme un paramétrage de trente secondes en
va-et-vient, sur le canal le plus courant de la PME togolaise.

⚡ **Et le coût monte avec le volume** : chaque aller-retour rejoue l'analyse d'un fichier entier
pour découvrir **une** chaîne de caractères que le serveur a déjà lue.

---

## Périmètre

**Inclus**

- `AnalyseFichierResponseDto` publie, pour les colonnes **candidates au sens**, leurs **valeurs
  distinctes** — lues sur tout le fichier, pas sur l'aperçu.
- La liste est **plafonnée** et le dit (même discipline que `rejets` / `MAX_DIAGNOSTIC`) : une
  colonne mal désignée — un libellé, une référence — porterait autant de valeurs distinctes que de
  lignes. Le plafond n'est pas un confort : c'est la borne qui empêche l'analyse d'un fichier de
  50 Mo de rendre une réponse proportionnelle au fichier, sur un service **mutualisé entre
  tenants** (CWE-770, leçon STORY-089).
- Un **compte exact** de valeurs distinctes à côté de la liste tronquée : « 47 valeurs, 20
  affichées » se lit ; une liste tronquée en silence ferait croire le classement complet.
- Quelles colonnes sont « candidates » est **une décision à écrire** : toutes celles dont le
  nombre de valeurs distinctes reste sous le plafond est le critère le plus simple, et il
  désigne naturellement les colonnes de type sans les nommer.

**Hors périmètre**

- Deviner le sens d'une valeur. « Cash-in » est une entrée pour un humain, pas pour une
  heuristique — et une heuristique qui se tromperait ferait entrer une sortie en entrée à
  confiance haute. Le classement reste humain, c'est la matière qu'on lui donne.
- Le format des relevés eux-mêmes : aucun parser par opérateur, la règle de STORY-089 tient.

---

## Conception — écrite AVANT le code

Le périmètre pose une question explicitement laissée ouverte (« quelles colonnes sont candidates
est une décision à écrire ») et une tension que le code doit trancher : le troisième point du
périmètre décrit une **liste tronquée avec compte exact**, le quatrième fait du **plafond le
critère de candidature**. Les deux ne peuvent pas tenir ensemble — si une colonne n'est retenue
que sous le plafond, sa liste n'est jamais tronquée.

### D-408-1 — Le plafond est le **critère de candidature**, et une colonne qui le dépasse n'est pas tronquée : elle est **écartée, et l'écart est dit**

Tronquer un vocabulaire serait **pire que ne rien publier**. Le comptable qui voit « 20 des
47 valeurs » classe les 20, enregistre son profil, importe — et retrouve exactement le
`SENS_INDETERMINE` que cette story existe pour supprimer, en croyant cette fois avoir tout classé.
Le va-et-vient reviendrait par la porte que la story ferme, avec en plus une fausse assurance.

Donc : une colonne dont le nombre de valeurs distinctes **dépasse** `MAX_VALEURS_COLONNE` est
publiée **avec une liste vide et un drapeau `plafondDepasse: true`** — jamais tronquée, jamais
omise en silence. C'est le sens réel de l'AC-2 : la réponse **dit** qu'elle plafonne, colonne par
colonne, et publie en plus la borne appliquée (`valeursPlafond`) pour que le front puisse écrire
« plus de 50 valeurs distinctes — ce n'est pas votre colonne de type » plutôt qu'un « trop » muet.

⚠️ Une colonne écartée n'est pas une erreur : c'est le libellé, la référence ou le montant. Le
plafond **désigne les colonnes de type sans les nommer**, exactement comme le périmètre l'annonce.

### D-408-2 — Le **compte exact** est la longueur de la liste, et il n'y a pas de champ parallèle

L'AC-1 demande « les valeurs distinctes avec leur compte exact ». Puisqu'une colonne publiée l'est
**intégralement** (D-408-1), le compte exact **est** `valeurs.length`. Un champ `nombre` séparé ne
pourrait rien ajouter — seulement diverger un jour, et publier un compte qui contredit la liste
qu'il accompagne. Le contrat porte donc la liste, le drapeau et la borne, et rien de redondant.

### D-408-3 — Dédupliquer sur la forme **normalisée**, publier la forme **brute**

`resoudreMappingReleve` normalise les valeurs configurées (`normaliserValeurs`) **et** la cellule
lue (`normaliserEntete`) : pour le serveur, « Dépôt », « DEPOT » et « depot » sont **une seule**
valeur de vocabulaire. Publier trois entrées ferait classer trois fois la même chose et
consommerait trois places sous le plafond.

La clé de déduplication est donc `normaliserEntete(cellule)`, et la valeur publiée est la
**première forme brute rencontrée** — ce que le comptable reconnaît dans son fichier. Le compte
publié est ainsi exactement **le nombre de gestes de classement qu'il lui reste à faire**.

Les cellules **vides** sont exclues : une valeur vide n'est pas classable, et
`lireMontantEtSens` ne pourrait de toute façon jamais l'apparier (`normaliserValeurs` filtre les
chaînes vides côté profil).

### D-408-4 — Mémoire bornée par **abandon anticipé**, jamais par le nombre de lignes

Un `Set` de clés normalisées par colonne, **libéré dès la valeur qui dépasse le plafond** : au-delà,
la colonne ne mémorise plus rien et ses cellules ne sont même plus normalisées. Le pic mémoire est
donc `nbColonnes × (plafond + 1)` entrées, **indépendant du nombre de lignes** — c'est ce qui rend
l'analyse d'un fichier de 50 Mo non proportionnelle au fichier (CWE-770, leçon STORY-089).

⚠️ Le volume **publié** est lui aussi borné par la matière du fichier : une colonne publiée porte au
plus `plafond` valeurs alors qu'elle a consommé au moins autant de lignes (dès que le fichier en
compte autant), et chaque valeur est bornée par `extraitBorne` (80 caractères, helper existant).
Les octets publiés restent donc **inférieurs aux octets de cellules lus** — la réponse n'amplifie
jamais l'entrée.

### D-408-5 — Seule la cible `RELEVE` publie des valeurs

Une balance n'a **pas** de colonne de sens : aucun champ de `CHAMPS_MAPPING.BALANCE` ne consomme un
vocabulaire. Scanner l'intégralité d'une balance de 10 000 comptes pour publier des valeurs que
personne ne lit serait du volume et du CPU sans consommateur, sur le chemin d'import **le plus
volumineux du service**. Pour `cible: BALANCE`, `valeursDistinctes` est donc **une liste vide**, et
le contrat le dit.

### D-408-6 — La lecture reste **unique**

Le balayage se fait sur la matrice **déjà lue** par `lireMatriceAvecReglages`, dans
`ProfilParserService.analyser` — là où `apercu` est déjà découpé. Aucune seconde lecture du
fichier : deux lectures pourraient diverger, et c'est la leçon que `ProfilParseResult.entetes`
porte déjà en commentaire depuis STORY-088.

---

## Critères d'acceptation

1. L'analyse d'un export mobile money rend les valeurs distinctes de la colonne de type, avec leur
   compte exact.
2. La liste est plafonnée, et la réponse dit qu'elle l'est.
3. Un profil de convention C peut être **complété en un seul passage**, sans import préalable —
   c'est le critère qui dit que la story a servi à quelque chose.

---

## Notes

- ⚠️ **Le rejet reste le filet, il ne devient pas le chemin.** Même une fois cette story livrée,
  une valeur nouvelle apparaîtra un jour dans un export : `SENS_INDETERMINE` doit continuer
  d'exister, et FE-049 continue de l'afficher avec le geste qui le lève.
- FE-049 assume le va-et-vient à l'écran plutôt que de le masquer : le bandeau de l'aperçu dit que
  les valeurs rares se découvrent aux rejets, et renvoie au profil.
- Consommateur nommé : **FE-049**.

---

## Progress Tracking

**2026-08-29 — conception écrite avant le code, statut `in_progress`.**
Branche `MNV-408` ouverte sur `docs/` (base `main`) et sur `balance-service` (base `dev`, après
`git fetch` — `origin/dev` porte bien les commits de STORY-407).
Décisions **D-408-1 à D-408-6** posées avant la première ligne de code. La plus structurante est
**D-408-1** : le périmètre décrivait à la fois une *liste tronquée avec compte exact* et un
*plafond comme critère de candidature* — les deux ne tiennent pas ensemble, et c'est la troncature
qui saute, parce qu'un vocabulaire tronqué **reproduit** le va-et-vient que la story supprime, avec
en plus la fausse assurance d'avoir tout classé.
Statut aligné aux 3 endroits (en-tête, `sprint-status.yaml`, cette section).

**2026-08-29 — développée, validée, vérifiée sur stack docker neuve. Statut `review`.**

Branche `MNV-408` sur `balance-service`, commit `3242e6b`.

### Portes de qualité

Lint **0 warning** · build OK · **3189 unitaires verts** (176 suites) · **798 e2e verts** (26 suites) ·
couverture **99,14 % stmts / 92,04 % branches / 98,64 % fonctions / 99,24 % lignes**
(seuils 65/90/90/90). `fichier-tabulaire.ts` : **100 % stmts / 97,33 % branches**.

⚠️ **Portly indisponible** pendant toute la passe (`portly status` ⇒ « Portly is not running and
could not be launched »), comme en STORY-411 : lint, build, tests, mutations et vérification docker
ont été lancés **directement**, hors Portly, contrairement à la règle du poste.

### Passe de mutation — 11 mutations, 11 rouges, toutes restaurées

| # | Mutation | Ce qui vire au rouge |
|---|---|---|
| **M1** | la colonne au-delà du plafond est **tronquée** au lieu d'être écartée (`valeurs[i] = []` retiré) | `fichier-tabulaire.spec` — 2 rouges (frontière + `+3`) |
| **M2** | déduplication sur la forme **brute** (`cle = brut`) | 3 rouges — fusion casse/accents, AC-1 parser |
| **M3** | off-by-one de la garde d'abandon (`>` au lieu de `===`) | **1 seul rouge : la frontière `plafond + 1`** |
| **M4** | la forme **normalisée** est publiée à la place de celle du fichier | 6 rouges (unitaires + AC-1/AC-3) |
| **M5** | le balayage ne lit que l'**aperçu** (le défaut que la story ferme) | 3 unitaires + 2 e2e |
| **M6** | la cible **BALANCE** balaie aussi (D-408-5 retiré) | 1 unitaire + 1 e2e |
| **M7** | la borne publiée est décalée de 1 | 1 unitaire + 2 e2e |
| **M8** | `valeursDistinctes` devient **facultatif** au contrat | `openapi-contract` — 1 rouge |
| **M9** | la description cesse de dire « vide, et non tronquée » | `openapi-contract` — 1 rouge |
| **M10** | les cellules **vides** entrent dans le vocabulaire | 3 rouges |
| **M11** | la colonne abandonnée **se remet à collecter** | 1 rouge (`+3` seulement) |

⚡ **M3 est la mutation qui a payé.** Elle survivait à mes deux premiers tests : « exactement le
plafond » et « plafond + 3 » sont **tous deux verts** avec un `>` à la place du `===` — à `+3`,
l'abandon tombe simplement une ligne plus tard. Seule une colonne à **exactement `plafond + 1`**
sépare les deux, et c'est précisément le cas où un vocabulaire de 51 valeurs serait publié entier,
au-delà de la borne annoncée par le contrat. Le test de frontière a été écrit **pour** cette mutation.

⚠️ **M11 exige `+ 3` et non `+ 1`** : à `+1`, l'abandon tombe sur la dernière ligne et le chemin
« colonne déjà abandonnée » n'est **jamais emprunté** — la borne mémoire de D-408-4 resterait non
exercée. Les deux tests coexistent donc, chacun pour une mutation différente.

⚠️ **M7 d'abord écrite en constante littérale (`valeursPlafond: 20`) ne compilait pas** (TS6133 :
l'import de `MAX_VALEURS_COLONNE` devenait inutilisé). Un rouge par **erreur de compilation** ne
prouve rien (leçon STORY-179/407) : réécrite en `MAX_VALEURS_COLONNE - 1`.

### Vérification docker — stack neuve (`down -v`), Mongo `rs0`, parcours HTTP réel

Organisation `6a92…62f7`, dossier `6a92…0d6d`, comptes TMoney `6a92…c3f2` (A) et `6a92…` (B).
Service redémarré sur la branche (`Found 0 errors` compté dans les logs avant toute mesure).

**① AC-1 — l'analyse publie ce que l'aperçu ne contient pas**

Export TMoney de 8 lignes. `apercu` = **5 lignes**, et la colonne `Type` publie **5 valeurs** :
`Dépôt, Retrait, Paiement marchand, Frais, Annulation`. Les **trois dernières** sont aux lignes 6, 7
et 8 — **hors aperçu**. `DEPOT` (ligne 4) **ne fait pas une 6ᵉ entrée** : le serveur compare la
forme normalisée, la publier deux fois ferait classer deux fois la même chose.

**② ⚡⚡ AC-3 — LA mesure de la story, et sa contre-épreuve, mesurées en base**

| Profil de convention C bâti avec… | HTTP | `nouvelles` | `rejetsTotal` |
|---|---|---|---|
| **les seules valeurs publiées** par `/analyser` | **201** | **8** | **0** |
| **l'aperçu seul** — la seule matière d'avant la story | 201 | 5 | **3 `SENS_INDETERMINE`** |

Les trois rejets de la contre-épreuve nomment exactement les trois valeurs rares :
« Paiement marchand », « Frais », « Annulation ». En base : compte A = **8 lignes**
(4 `CREDIT` / 4 250 000 · 4 `DEBIT` / 1 530 000), compte B = **5 lignes**. C'est le va-et-vient,
mesuré : trois allers-retours de profil évités, sur un fichier de huit lignes.

**③ AC-2 — le plafond désigne la colonne de type sans la nommer**

Fichier de **200 lignes**, 3 types, 200 références et 200 libellés distincts :

| Colonne | valeurs distinctes réelles | publiée ? |
|---|---|---|
| `Type` | 3 | ✅ **3 valeurs** |
| `Date` | 28 | ✅ 28 valeurs (sous le plafond — honnête) |
| `Libellé` · `Montant` · `Référence` | 200 · 200 · 200 | ⛔ `plafondDepasse: true`, **liste vide** |

Aucune heuristique de nom n'intervient : c'est le seul plafond qui écarte les trois colonnes
inutilisables et retient le vocabulaire.

**④ ⚡ La borne CWE-770, mesurée et non supposée**

| Fichier | Lignes | Taille réponse | Temps |
|---|---|---|---|
| `releve-gros.csv` | 200 | **1 530 octets** | — |
| `releve-50k.csv` (**3,3 Mo**) | 50 000 | **1 655 octets** | 0,58 s |

**× 250 sur le fichier, + 8 % sur la réponse.** La réponse n'est **pas proportionnelle au fichier** —
c'est exactement ce que le périmètre exigeait, et l'abandon anticipé (D-408-4) en est la raison :
au-delà de 51 valeurs distinctes, une colonne cesse d'être normalisée **et** de mémoriser.

**⑤ `/analyser` n'écrit toujours rien**

Somme des documents de **toutes** les collections de `balance_service` **avant** et **après**
l'analyse du fichier de 200 lignes : **22 = 22**. La story n'ajoute aucune écriture, et le contrat
« 200, aucune persistance » tient.

Stack arrêtée (`docker compose stop`) à la fin de la passe.
