# STORY-455 : Le report déficitaire n'est jamais constaté — le même franc est imputable à chaque exercice, indéfiniment

Status: review

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal`
**Points :** 5 · **Complexité :** high · **Sprint :** S20
**Origine :** relevée le **2026-08-27** par la **passe expert-comptable de FE-050**, en écrivant le
code de l'écran — pas en lisant la fiche. La maquette du 26/08 ne pouvait pas la voir : elle montre
**un** exercice, et le défaut ne se manifeste qu'**au suivant**.

---

## Le fait, relevé à la source

`GET /dossiers/{id}/fiscal/resultat-fiscal` **impute** des déficits reportables et **n'écrit rien**.
C'est la décision **D-091-9**, et elle est juste : STORY-096 rejouera ce moteur sur des scénarios
d'optimisation, et un calcul qui consommerait le stock le corromprait à chaque simulation.

La même décision ajoute, en toutes lettres :

> *« Le stock consommé par les exercices antérieurs est donc une donnée **déclarée**
> (`montantDejaImpute`), pas un effet de bord de lecture ; **sa persistance à l'arrêté relève de
> STORY-092**. »*

**STORY-092 ne l'a jamais reprise.** Vérifié à la source sur `origin/dev` :

| | constat |
|---|---|
| Écritures de `montantDejaImpute` | **une seule** — `resultat-fiscal.service.ts:198`, à la **création** du déficit |
| `liquidation.service.ts` | **ne mentionne ni les déficits ni le stock** |
| Route de mise à jour | **aucune** — `POST /deficits`, `DELETE /deficits/:id`, et c'est tout |
| Consommateur / listener écrivant le stock | **aucun** (seuls `deficits.repository`, le schéma et `resultat-fiscal.service` touchent la collection) |
| Base de l'imputation | `restant = montant − montantDejaImpute`, où `montantDejaImpute` est **la valeur déclarée**, jamais recalculée (`fiscal.regles.ts:520`) |

⛔ **Le stock ne bouge donc jamais**, et chaque exercice réimpute depuis la même valeur.

### Ce que cela produit, sur le dossier de démonstration de FE-050

| exercice | stock lu (`restant`) | imputé par le calcul | stock après |
|---|---|---|---|
| 2024 | 8 000 000 | **5 195 000** | **8 000 000** *(inchangé)* |
| 2025 | **8 000 000** | jusqu'à 8 000 000 | 8 000 000 |
| 2026 | **8 000 000** | … | … |

**Le même report est imputable un nombre illimité de fois.** Chaque liasse est arithmétiquement
cohérente avec elle-même ; c'est leur **suite** qui est fausse. Aucun total ne rougit, sur aucun des
exercices — c'est précisément la famille de défaut que ce module existe pour empêcher.

### Et le contournement manuel est verrouillé au moment où il devient nécessaire

Le seul geste possible aujourd'hui serait *supprimer le déficit et le re-déclarer* avec un
`montantDejaImpute` majoré. Or `exigerStockModifiable` refuse dès qu'une balance **validée** porte un
exercice postérieur à l'origine (`balance.repository.ts:344` — `exercice.fin ≥ 1ᵉʳ janvier N+1`).

⇒ **Dès la première clôture qui suit l'origine du déficit, ni la déclaration ni la suppression ne
sont plus possibles**, et le `montantDejaImpute` est figé pour toujours à sa valeur initiale.

Le gel est **juste** dans son intention (il empêche de modifier rétroactivement une base déposée) ;
il devient une impasse parce que **rien, à l'intérieur du système, ne fait le travail qu'il
interdit de faire à la main**.

---

## ⚖️ AVIS D'EXPERT-COMPTABLE

### ① Le sens de l'erreur est le mauvais

Un report consommé deux fois **minore** la base imposable. Ce n'est pas un désagrément de
présentation : c'est le sens qui se **redresse**, avec intérêts et pénalités — quand une
sur-imposition, elle, se réclame. Entre deux défauts, celui-ci est le plus cher.

Et il grandit avec l'usage : plus le cabinet tient le dossier longtemps dans l'outil, plus le
nombre d'exercices ayant réimputé le même report augmente.

### ② Le stock de déficits n'est pas une donnée de confort, c'est une créance sur l'État

Un déficit reportable est un **actif fiscal**. En cabinet, il se suit d'une liasse à l'autre dans un
tableau dédié — le formulaire DSF lui consacre un cadre — précisément parce que **personne ne peut le
recalculer** à partir du seul exercice courant. Un produit qui affiche un stock qu'il ne met jamais à
jour ne rend pas ce tableau : il en donne l'apparence.

### ③ Ce que le déclaratif peut porter, et ce qu'il ne peut pas

`montantDejaImpute` **déclaré** est le bon choix pour la **reprise** : les exercices consommés avant
l'outil lui sont antérieurs, et les inventer serait pire. Mais ce raisonnement ne vaut que pour
l'**amorçage**. Dès que le produit calcule lui-même une imputation, il en est l'auteur — et un
système qui produit un fait sans le constater fabrique une divergence entre ce qu'il a déclaré à
l'administration et ce qu'il croit encore disponible.

### ④ Le moment du constat n'est pas anodin — et il est circulaire si on le choisit mal

⚠️ **Constater l'imputation *avant* l'arrêté est incohérent** : le calcul lit le stock. Écrire
« 5 195 000 consommés » pendant que l'exercice est encore ouvert ferait retomber le `restant` à
2 805 000, et le **calcul suivant imputerait moins** — le résultat fiscal changerait tout seul entre
deux affichages du même exercice. Le constat doit donc être **un effet de l'arrêté**, pas un geste
libre.

C'est exactement ce que D-091-9 avait prévu (« à l'arrêté »), et ce qui manque est la mise en œuvre.

---

## ⚠️ Une question à trancher à la rédaction (pas un blocage)

**Où le constat s'accroche-t-il ?** Deux voies, et la première est recommandée :

- **Voie A — à la validation de la balance de l'exercice** (`etat: VALIDÉE`, l'événement qui arme
  déjà le gel). L'exercice devient immuable **et** son imputation est constatée dans le même acte :
  les deux propriétés naissent ensemble, ce qui est la seule façon qu'elles ne divergent pas.
- **Voie B — au dépôt de la liasse** (`bilan-service`, EPIC-011/012). Plus proche de la vérité
  juridique — le report est consommé par la **déclaration déposée**, pas par une balance validée —
  mais elle traverse deux services, et l'état `DÉPOSÉ` **n'existe nulle part** aujourd'hui
  (STORY-446). ⇒ à retenir **seulement** si le PO veut lier le stock au dépôt réel.

⚠️ Dans les deux cas, la **reprise** reste déclarative : cette story ne touche pas à l'amorçage.

---

## Critères d'acceptation

1. **L'imputation d'un exercice est CONSTATÉE**, une fois, au moment retenu (voie A par défaut) :
   pour chaque déficit imputé, `montantDejaImpute` est augmenté du montant réellement imputé publié
   par `deficitsImputes`. Le calcul lui-même **reste pur** — c'est l'arrêté qui écrit, jamais le
   `GET` (D-091-9 conservée intégralement).
2. **Idempotence stricte.** Deux validations successives du même exercice ne consomment le report
   qu'**une** fois. Un `exerciceConstate` (ou une collection d'imputations constatées, clé
   `(dossierId, exerciceImputation, deficitId)`) porte cette garantie — **pas** un simple
   « on vient de le faire ». Sans elle, le défaut s'inverse en sur-imposition, ce qui n'est pas un
   progrès mais un autre redressement.
3. **Le constat est ATOMIQUE avec l'arrêté** : si l'un échoue, l'autre ne s'applique pas. Un
   exercice arrêté sans constat rejouerait exactement le défaut d'aujourd'hui, en pire — parce que
   le gel interdirait alors de le rattraper.
4. **Le gel cesse d'être une impasse.** `exigerStockModifiable` continue d'interdire les gestes
   **manuels** sur un stock figé ; il n'empêche pas le constat automatique de l'arrêté. Le motif est
   écrit au contrat : ce qui est interdit, c'est de **réviser** une base déposée, pas de **constater**
   ce qu'elle a consommé.
5. **La lecture publie l'histoire.** `GET /fiscal/deficits` distingue ce qui a été **déclaré à la
   reprise** de ce qui a été **constaté par le produit** — au minimum un `origineImputation:
   DECLAREE | CONSTATEE` par montant, ou la liste des exercices d'imputation. Un `montantDejaImpute`
   agrégé sans origine redonne, un an plus tard, le problème qu'on vient de résoudre : personne ne
   saura s'il est à jour.
6. **Une reprise d'exercice déjà arrêté avant cette story** n'est **jamais** rattrapée
   automatiquement : les stocks existants sont laissés tels quels et signalés
   (`imputationsNonConstatees: true` ou équivalent). Recalculer rétroactivement modifierait des bases
   déjà déposées — exactement ce que le gel protège.
7. **Tests** : ① 2024 impute 5 195 000 puis 2025 ne dispose plus que de 2 805 000 ; ② double
   validation ⇒ une seule consommation ; ③ échec du constat ⇒ exercice non arrêté ; ④ déficit
   entièrement consommé ⇒ `imputableSurExercice: false` l'exercice suivant, avec
   `motifNonImputation: AUCUN_DEFICIT_DISPONIBLE` ; ⑤ stock antérieur à la story ⇒ inchangé et
   signalé.

---

## Ce que cette story n'est PAS

⚠️ **Ce n'est pas STORY-417.** 417 demande s'il **faut** imputer quand le minimum forfaitaire
l'emporte — une question de **droit**, `needs-po-decision`. Celle-ci demande que ce qui **a été
imputé** soit **constaté**. Elles sont indépendantes : trancher 417 dans un sens ou dans l'autre
laisse ce défaut entier, et le corriger ne préjuge de rien sur 417.

⚠️ **Ce n'est pas un défaut de STORY-091.** 091 fait exactement ce que son cadrage demande, et son
cadrage **nomme** le manque en le déléguant. Même famille que STORY-417 : le défaut naît de la
**jonction**, et la délégation d'une décision à une story qui ne l'a jamais lue est un mode de panne
à part entière. ⇒ **Règle de rédaction : une décision qui délègue à une autre story doit être
reportée DANS cette story, pas seulement dans celle qui délègue.**

---

## Impact frontend

**Aucun changement d'écran n'est requis** : FE-050 affiche déjà `restant`, `montantDejaImpute` et ce
que le calcul a imputé, et il dit en toutes lettres que le calcul n'écrit rien. Le jour où le constat
existe, l'écran devient **vrai** sans qu'une ligne bouge. L'AC-5 (origine de l'imputation) est le seul
point qui pourra enrichir l'affichage — colonne « déclaré / constaté ».

---

## Progress Tracking

**Statut : `review`** — 2026-09-05, développement terminé, portes de qualité franchies,
vérification docker faite. Revues de code et de sécurité à suivre.

### La question de rédaction, tranchée : **voie A**

Le constat s'accroche à la **validation de la balance** (`BalanceService.marquerEtat` →
`VALIDÉE`), dans **sa** transaction. La voie B (au dépôt de la liasse) reste plus juste en
droit, mais elle traverse deux services et l'état `DÉPOSÉ` de `bilan-service` n'existait pas
au moment du cadrage. La voie A a un mérite propre : l'exercice devient immuable **et** son
imputation est constatée dans le **même acte**, donc les deux propriétés ne peuvent pas
diverger — c'est déjà l'événement qui arme le gel.

### Ce qui a été livré

**Le stock porte son propre historique.** `deficits_reportables` gagne un tableau
`imputations[]` — `{ exercice, montant, balanceId, parUserId, le }` — et **rien d'autre** :
pas de collection, pas de dépôt, pas d'index nouveaux. Ce seul tableau porte les trois
exigences : l'**idempotence** (un exercice n'y figure qu'une fois), l'**historique** de
l'AC-5, et le **signal** de l'AC-6. `montantDejaImpute` reste la grandeur que le moteur lit,
et sa part déclarée se **dérive** (`montantDejaImpute − Σ imputations`) plutôt que de
s'ajouter en champ — deux champs auraient pu diverger, une dérivation non.

**L'écriture est UNE opération**, `DeficitsRepository.constaterImputation` : `$inc` du stock
et `$push` de la ligne, sous un filtre qui est le vrai filet — `imputations.exercice: {$ne}`
pour l'idempotence, et un `$expr` comparant les **champs du document** (`montantDejaImpute +
montant ≤ montant`) plutôt qu'une borne lue avant, qui serait un instantané périmé.

**Deux temps, comme STORY-453.** `preparer` calcule **hors** transaction (le résultat fiscal,
c'est six lectures plus un artefact, rejoués à chaque retry de `withTransaction`) ;
`constater` **relit les déficits dans la session** et c'est cette relecture qui décide.

**Une seule source d'imputation.** `ResultatFiscalService.calculer` est **extrait** en
`calculerPour(orgId, dossierId, query)` — jamais recopié. Le constat enregistre donc
exactement ce que `GET /resultat-fiscal` publie ; une seconde implémentation aurait fabriqué,
à l'intérieur du produit, la divergence liasse/moteur que ce module existe pour empêcher.

**Le calcul reste PUR.** D-091-9 n'est pas contournée, elle est **complétée** : elle disait
« le calcul ne consomme rien » *et* « sa persistance à l'arrêté relève de STORY-092 » —
reprise que 092 n'a jamais faite. STORY-096 pourra toujours rejouer le moteur sur des
scénarios.

### ⚡⚡ La couture `BalanceModule` ↔ `FiscalModule` — et pourquoi elle est `@Global()`

`FiscalModule` **importe** `BalanceModule` (il lit les soldes et le gel). Un import en retour
fermait donc un cycle. Trois issues, une seule tenable :

| issue | pourquoi non |
|---|---|
| `forwardRef` des deux côtés | **absent de tout le dépôt**, et trois modules documentent l'avoir écarté (`tresorerie`, `rapprochement-data`, `comptes-ventilation`) |
| jeton fourni par `BalanceModule` (patron `VALIDATION_GATE`) | l'implémentation vivrait dans l'injecteur de `BalanceModule`, qui devrait alors importer `FiscalModule` : le cycle, avec une indirection de plus |
| `ConstatImputationModule`, `@Global()` | `BalanceService` **injecte sans importer**, comme `CommonModule`/`KafkaModule`/`OutboxModule` |

⛔ **Un module `@Global()` est un mode de panne que rien ne rattrape** — c'est la leçon de
STORY-425 (application qui ne démarre pas, 3 579 unitaires verts). D'où
`constat-imputation.module.spec.ts`, qui ferme les **deux** pannes distinctes : une **sonde
d'injection** (un module tiers qui n'importe rien et exige que le service lui parvienne par
la portée globale — `module.get()` trouverait un provider **non exporté**), et une assertion
sur les `imports` d'`AppModule`, sans laquelle le module correct ne serait monté nulle part.
Les deux mutations correspondantes rougissent (M22, M23). Boot réel confirmé :
`ConstatImputationModule dependencies initialized` puis `Nest application successfully started`.

### AC-4 — le gel cesse d'être une impasse, et le contrat le dit

Le gel (`exigerStockModifiable`) ferme les gestes **manuels** et **eux seuls** ; le constat
automatique ne passe pas par lui. Deux écarts de contrat fermés au passage, tous deux
**pré-existants** : `POST /deficits` levait `BALANCE_VALIDEE_IMMUABLE` sans l'annoncer, et
`DELETE /deficits/:id` n'annonçait **aucun** 409. La description publiée nomme désormais la
distinction — ce qui est interdit, c'est de **réviser** une base déposée, pas de **constater**
ce qu'elle a consommé. `openapi-contract.e2e-spec.ts` garde la **phrase**, pas seulement le
code : c'est le seul filet qui regarde une description (`*.dto.ts` est hors couverture).

### ⚠️ Vérification docker — la chaîne complète, sur la base réelle

Stack `docker compose`, tenant `6a9abdb4…9bcf`, dossier `6a9b41dd…c86e`. Un seul paquet
fiscal est publié (`togo@2026`) : l'exercice imputant est donc **2026**, et le déficit
d'origine **2022** (8 000 000). Bénéfice construit à 10 390 000 pour retrouver le chiffre de
la fiche — plafond légal 50 % ⇒ **5 195 000**.

| # | Mesure | Résultat |
|---|---|---|
| ① | Stock avant l'arrêté (`GET /fiscal/deficits?exercice=2026`) | `restant: 8 000 000`, `montantImputeConstate: 0`, `montantImputeDeclare: 0`, `exercicesImputation: []`, `imputationsNonConstatees: false` |
| ② | `GET /fiscal/resultat-fiscal` avant l'arrêté | `deficitsImputes: [{ montant: 5 195 000 }]` — **le chiffre exact de la fiche** |
| ③ | `POST /balances/:id/valider` | **200**, `etat: VALIDÉE`, `horodatageValidation: …06:55:59.178Z` |
| ④ | Le déficit **en base** | `montantDejaImpute: 0 → 5 195 000` ; `imputations: [{ exercice: 2026, montant: 5 195 000, balanceId, parUserId, le }]` — `le` **égal au horodatage de la transition**, à la milliseconde |
| ⑤ | Stock après l'arrêté | `restant: 2 805 000`, `montantImputeConstate: 5 195 000`, `exercicesImputation: [2026]` |
| ⑥ | ⚡ **Ce dont l'exercice suivant dispose** — `GET /resultat-fiscal` rejoué | `deficitsImputes: [{ montant: **2 805 000** }]` — **AC-7 ①** : avant la story, ce chiffre serait resté 5 195 000, indéfiniment |
| ⑦ | **Seconde validation du MÊME exercice** (2ᵉ balance, source `ocr`) | **200**, et le déficit **inchangé** : `montantDejaImpute: 5 195 000`, **1 seule** imputation, toujours attribuée à la **1ʳᵉ** balance — **AC-7 ②** |
| ⑧ | `DELETE /deficits/:id` et `POST /deficits` après l'arrêté | **409 `BALANCE_VALIDEE_IMMUABLE`** les deux — le geste manuel est bien fermé pendant que le constat automatique, lui, a fonctionné |
| ⑨ | Déficit **antérieur à la story** — document inséré **sans** le champ `imputations` | lu sans erreur, stock **intact** (`0` / `4 000 000`) et **signalé** `imputationsNonConstatees: true` — **AC-7 ⑤**, AC-6 |
| ⑩ | ⛔ **Arrêté dont le constat NE PEUT PAS être calculé** (exercice 2027, paquet non publié) | **409 `PAQUET_FISCAL_NON_PUBLIE`** ; balance restée `BROUILLON`, **aucun** `horodatageValidation`, **0** mutation, déficit à `0` / `0` imputation — **AC-7 ③** |
| ⑪ | Balayage d'invariants sur **toute** la collection | 0 stock négatif, 0 constaté > déclaré, 0 imputation sans auteur/balance/date, 0 exercice en doublon, 0 imputation antérieure ou égale à l'origine, 0 montant négatif |

⚠️ **Ce qui n'est PAS prouvé par docker, et dit comme tel** : l'abort sur *échec d'écriture
du constat* (stock modifié entre la préparation et la transaction) n'est pas forçable de
l'extérieur — c'est une course de quelques millisecondes. Il est couvert par les mutations
M8, M14 et M15. Le chemin de refus **calculable**, lui, est mesuré (⑩).

⚠️ **Le conteneur servait le module d'avant la story** au premier passage : `docker compose
restart balance-service` a suffi — piège déjà fiché en STORY-454, revu ici.

### 🪝 Deux plafonds assumés, tous deux MESURÉS et écrits dans le code

1. **La clé du constat est l'année de clôture**, pas les bornes de l'exercice. Deux exercices
   d'un même dossier clôturant la même année civile — exercice écourté — partagent une seule
   ligne, et le second est vu « déjà constaté ». C'est le modèle de **tout** le module
   (`listerAnterieurs`, `existeExerciceArreteApres`, `projeterDeficits` raisonnent en années) :
   une clé plus fine **ici seulement** ferait diverger le constat de l'imputation qu'il
   enregistre. Reprise : porter les bornes dans la clé **partout à la fois**.
2. **Un exercice dont le paquet fiscal n'est pas publié ne peut plus être arrêté dès que le
   dossier porte un déficit** (mesure ⑩). Conséquence directe et voulue de l'AC-3 : sans
   paquet, l'imputation n'est pas calculable, donc pas constatable. Un dossier **sans**
   déficit n'est pas concerné — le moteur n'est même pas appelé, précisément pour ne pas
   exiger un paramétrage fiscal sur le chemin le plus emprunté du service.

### Mutation-testing — 24 mutations valides, 24 rouges ciblées

⚠️ **Quatre mutations ont d'abord été écartées comme INVALIDES** : elles ne compilaient pas
(variable ou paramètre devenu inutilisé), et une mutation rouge par erreur de compilation ne
prouve rien. Elles ont été reformulées pour compiler.

| # | Mutation | Test qui rougit |
|---|---|---|
| M1 | `imputations.exercice: {$ne}` retiré du filtre | dépôt « le filtre EXCLUT l'exercice déjà constaté » |
| M2 | `$expr` de borne du stock retiré | même test |
| M3 | `modifiedCount === 1` → toujours vrai | dépôt « aucun document modifié ⇒ `false` » |
| M4 | Session non transmise à la relecture | dépôt « relit DANS la session » |
| M5 | Socle `A_NOUVEAUX` réintégré aux années arrêtées | dépôt « le MÊME prédicat que le gel » |
| M6 | Années arrêtées rendues brutes (ni dédoublonnées ni triées) | dépôt « déduplique et trie » |
| M7 | Constat déplacé **avant** la transition | service « le constat suit la transition » |
| M8 | Erreur de constat avalée (`.catch`) | service « un constat qui échoue fait ÉCHOUER la validation » |
| M9 | Un REJET prépare aussi le constat | service « un REJET ne prépare ni n'écrit aucun constat » |
| M10 | `parUserId` remplacé par une constante | service « avec l'auteur du JWT » |
| M11 | Garde `A_NOUVEAUX` neutralisée | constat « un socle d'à-nouveaux ne constate RIEN » |
| M12 | Court-circuit « déjà constaté » retiré | constat « AC-2 — ne relance ni le moteur ni l'écriture » |
| M13 | Lignes à zéro filtrées | constat « un déficit non imputé reçoit sa ligne, à ZÉRO » |
| M14 | Identité du stock relu non vérifiée | constat, **3 tests** (déclaré / supprimé / remplacé) |
| M15 | Refus d'écriture avalé | constat « l'écriture refusée fait REFUSER l'arrêté » |
| M16 | Course concurrente non détectée en session | constat « une validation CONCURRENTE a déjà tout écrit » |
| M17 | Signal AC-6 en `>=` au lieu de `>` | règle « un exercice antérieur OU ÉGAL ne signale rien » |
| M18 | « au moins un constat » au lieu de la comparaison par année | règle « un constat n'éteint QUE lui » |
| M19 | Part déclarée ignorant les constats | règle « déclaré et constaté coexistent » |
| M20 | Constat à zéro compté comme imputation | règle « un constat à ZÉRO n'y figure pas » |
| M21 | Exercices d'imputation non triés | règle « ordonnés » |
| M22 | `@Global()` retiré du module de couture | sonde « le service traverse la portée globale » |
| M23 | Module retiré des `imports` d'`AppModule` | sonde « est câblé dans AppModule » |
| M24 | `FiscalModule` cesse d'exporter `ResultatFiscalService` | sonde d'injection |
| M25→M29 | Les cinq descriptions/typages du contrat OpenAPI (409 déclaration, 409 suppression, phrase « réviser ≠ constater », `exercicesImputation` en `string[]`, 409 de `valider`) | `openapi-contract.e2e-spec.ts`, un test chacun |

### Portes de qualité

| Porte | `balance-service` |
|---|---|
| Lint (0 warning) | ✅ |
| Build | ✅ |
| Unitaires + couverture | ✅ **3 640** tests · 99,17 / 92,38 / 98,68 / 99,27 (seuils 65/90/90/90) |
| e2e | ✅ **891/891** |
| Boot réel docker | ✅ `Found 0 errors` puis `Nest application successfully started` |

### Ce qui n'a PAS été fait, et pourquoi

- **Aucun rattrapage rétroactif** (AC-6) : les stocks antérieurs sont laissés tels quels et
  signalés. Les recalculer modifierait des bases déjà déposées — ce que le gel protège.
- **`DeficitDeclareResponseDto` (réponse du `POST`) est inchangé** : un déficit qui vient
  d'être déclaré est intégralement « déclaré », il n'a aucun historique à publier.
- **La reprise reste déclarative** : cette story ne touche pas à l'amorçage, comme la fiche
  le pose.
- **STORY-417 n'est pas préjugée** : le bornage volontaire reste un paramètre de **lecture**,
  et le constat enregistre ce que le calcul **par défaut** impute.
