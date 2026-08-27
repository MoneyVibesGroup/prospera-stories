# STORY-455 : Le report déficitaire n'est jamais constaté — le même franc est imputable à chaque exercice, indéfiniment

Status: ready-for-dev

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal`
**Points :** 5 · **Sprint :** S20
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
