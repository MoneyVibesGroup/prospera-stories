# STORY-416 : La grille de la liasse est calculée, affichée — et impossible à emporter

Status: done

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-050**, au moment de
répondre à la question qui suit immédiatement la grille : *« et maintenant, je la mets où ? »*

---

## Le fait, relevé à la source

`ResultatFiscalResponseDto.postesDsf` est **la grille complète de la liasse** — tous les
codes du paquet, à 0 quand rien ne les alimente, plus les postes hors grille. C'est
exactement ce qu'un cabinet recopie sur la DSF au moment du dépôt.

⛔ **Et il n'existe aucune manière de l'emporter.** Vérifié contrôleur par contrôleur :
`fiscal.controller.ts` sert du JSON et rien d'autre — pas de `Accept: text/csv`, pas de
route `…/resultat-fiscal/export`, pas de génération de document. La seule sortie
fichier du produit est **l'export du Bilan** (FE-038), qui porte les états financiers et
**pas les retraitements** : ce n'est pas le même objet.

---

## Ce que ça coûte, concrètement

Le dépôt de la DSF est **manuel, case par case**, dans le formulaire de l'OTR ou dans la
liasse GUIDEF. La grille est à l'écran ; la saisie se fait ailleurs. Entre les deux, il y
a un humain qui recopie une vingtaine de nombres.

- **Ce n'est pas un confort.** Le produit passe son temps à empêcher un montant faux
  d'entrer dans l'assiette — fail-closed sur les codes, refus plutôt que repli sur les
  classes de gestion, motif publié plutôt que zéro muet — puis **rend la ventilation
  finale à la recopie manuelle**, c'est-à-dire au seul endroit où il ne contrôle rien.
- **Le cas le plus coûteux est silencieux** : un chiffre recopié dans la case d'à côté.
  Le total déposé reste juste, la ventilation ne l'est plus, et **aucun contrôle du
  produit ne peut s'en apercevoir** — la faute est née hors de lui.
- **Et la grille est faite pour être recopiée** : elle publie délibérément les cases à
  zéro (D-091-11) pour qu'on puisse la parcourir sans se demander ce qui manque. Publier
  vingt lignes destinées à la recopie, puis ne pas les rendre recopiables, est une
  décision incomplète, pas une décision.

---

## Périmètre

**Inclus**

- Une sortie **fichier** de la grille de la liasse pour un exercice donné : les postes
  de `postesDsf` dans l'ordre du paquet, avec `code`, `sens`, `montant`, `origine`, et
  le motif quand le poste n'a pas de code.
- Le fichier porte **l'empreinte du calcul** — exercice, balance retenue (id, version,
  état), paquet fiscal (pays, année, checksum). Une grille exportée sans savoir de
  quelle balance elle sort ne vaut pas plus qu'un chiffre sans provenance, et ces quatre
  informations sont **déjà** dans la réponse.
- **Les postes sans case y figurent**, comme à l'écran : ce sont eux qui devront être
  ventilés à la main, et les omettre ferait un fichier qui ne totalise pas l'assiette.

**Hors périmètre**

- **Pré-remplir un formulaire officiel OTR ou un fichier GUIDEF.** C'est un autre sujet,
  qui suppose un gabarit versionné par année, et il ne se décide pas dans cette story.
- **Un PDF mis en page.** Le besoin est de *transporter des chiffres*, pas d'éditer un
  document — un CSV/XLSX répond entièrement, un PDF ajoute une maquette à maintenir.
- Le format exact (CSV séparateur `;` vs XLSX) : **à trancher avec le PO**, cf. Notes.

---

## Critères d'acceptation

1. Une route de lecture rend la grille de la liasse d'un exercice sous forme de fichier,
   soumise aux **mêmes gates** que le reste de l'Atelier (`@RequiresBalanceAccess`,
   `@RequiresDossierScope`, `@RequiresRegime(REEL)`).
2. Le contenu du fichier est **exactement** `postesDsf` — même ordre, mêmes montants,
   mêmes postes. Un test le vérifie sur la **même source**, pas sur deux constructions
   parallèles : deux grilles qui divergent seraient pires qu'une seule non exportable.
3. Le fichier porte l'exercice, la balance retenue et le checksum du paquet.
4. Les mêmes refus que le calcul (`404 BALANCE_INTROUVABLE`, `409 PAQUET_FISCAL_NON_PACKAGE`,
   `409 CLASSES_GESTION_NON_SOURCEES`) — jamais un fichier vide en guise de refus.

---

## Notes

- ⚠️ **Question à trancher avant de chiffrer : le séparateur et l'encodage.** Un cabinet
  togolais ouvre un CSV dans Excel en locale française — séparateur `;`, et un BOM UTF-8
  sans lequel les accents des libellés sortent illisibles. Le produit a déjà payé cette
  leçon ailleurs (les artefacts invalidés par CRLF). ⇒ **le format se décide avec le PO,
  pas au moment du code.**
- ⚠️ **Voisin, mais distinct** : `postesDsf` est la feuille « Détail réintégrations /
  déductions ». La feuille « Résultat fiscal » (cases **D** à **L**) est publiée par
  `LiquidationResponseDto` (STORY-092). Si le besoin réel est « déposer la liasse », les
  **deux** grilles sont concernées ⇒ le PO doit dire s'il veut un export par écran ou un
  export de la liasse.
- ⚠️ **Ne pas confondre avec l'export du Bilan (FE-038)** : même geste, autre objet. Les
  fusionner ferait sortir des retraitements d'un état financier.
- L'écran FE-050 dessine le bouton **désactivé**, avec la mention « non servi par l'API » :
  on montre la cible, on n'invente pas le geste.
- Consommateur nommé : **FE-050**.

---

## Progress Tracking

**Statut : `done`** — clôturée le **2026-08-30**. PR **#73** (`balance-service`) rebase-mergée sur
`dev`, branche supprimée.
**Un seul dépôt module** : aucun octet du paquet fiscal ne change.

### Les deux questions que la story réservait au PO — tranchées le 2026-08-30

| Question | Réponse du PO | Ce qu'elle évite |
|---|---|---|
| **Format** (« se décide avec le PO, pas au moment du code ») | **CSV, séparateur `;`, BOM UTF-8** | un cabinet togolais ouvre le fichier dans Excel en **locale française** : avec une virgule il obtient une seule colonne, sans BOM il relit « Amendes et pÃ©nalitÃ©s » — sur un document destiné à être **recopié sur une déclaration**. XLSX écarté : une dépendance et un gabarit à maintenir pour transporter vingt nombres. |
| **Périmètre** (« un export par écran ou un export de la liasse ? ») | **`postesDsf` seul**, conforme aux AC | la feuille « Résultat fiscal » (cases `D`→`L`, `LiquidationResponseDto`) fera une **story jumelle** : l'inclure ici aurait débordé les critères d'acceptation écrits et doublé la story (deux sources, deux calculs, deux jeux de refus). |

### Conception

| Décision | Ce qu'elle tranche |
|---|---|
| **D-416-1** | ⛔ **Une seule source, et c'est `calculer()`.** Le service d'export **appelle le calcul** et met en forme son `postesDsf` — jamais une seconde construction à partir des mêmes dépôts. Conséquence directe et **voulue** : les refus du calcul sont les refus de l'export (AC-4), jamais un fichier vide qu'un comptable déposerait sans s'apercevoir de rien. |
| **D-416-2** | ⚡ **Les montants sortent en UNITÉS MONÉTAIRES, pas en unités mineures.** Le contrat JSON publie partout des entiers × 100 ; ce fichier existe pour être recopié sur une déclaration. Y porter `1 200 000` là où le comptable doit écrire `12 000` serait une erreur d'un **facteur cent**, silencieuse et opposable — la faute naîtrait hors du produit, exactement le mode de panne que la story décrit. La **devise est nommée en en-tête de colonne** (`Montant (XOF)`), jamais supposée. |
| **D-416-3** | `montantPourTableur` **ne réutilise pas** `formaterMontantMineur` : celle-ci groupe par espaces, ce qui est juste dans une phrase de refus et illisible dans une cellule (un tableur y voit du texte). Le module qui la porte l'écrit lui-même : « ces fonctions ne servent **jamais** à produire une donnée ». ⚠️ Mais le **facteur d'échelle est le même symbole importé**, et un test l'assert des deux côtés : ils ne peuvent pas diverger sur la valeur. |
| **D-416-4** | `CRLF` (RFC 4180) et échappement complet des champs. Un libellé contenant un `;` — le paquet peut parfaitement en publier un — décalerait **toutes** les colonnes suivantes sans que rien ne le signale. |
| **D-416-5** | Le nom de fichier ne porte **aucune donnée du dossier** : ni raison sociale, ni identifiant. Un nom de fichier voyage dans les journaux de proxy, les corbeilles et les pièces jointes ; la date de clôture suffit à le ranger. |

### Implémentation

| Fichier | Ce qui change |
|---|---|
| `export-liasse.regles.ts` **(neuf)** | module **pur** : échappement CSV, montant pour tableur, construction du fichier, nom de fichier |
| `export-liasse.regles.spec.ts` **(neuf)** | 17 tests — **100 %** de couverture sur les 4 axes |
| `resultat-fiscal.service.ts` | `exporterResultatFiscal` : appelle `calculer()`, relit le paquet pour sa **seule** `devise` (lecture postérieure, donc **aucun** chemin de refus ajouté) |
| `fiscal.controller.ts` | `GET …/fiscal/resultat-fiscal/export` — chemin **littéral**, `StreamableFile`, `text/csv; charset=utf-8`, `Content-Disposition: attachment` |

### Portes DoD

lint 0 warning · build OK · **3 295** unitaires · **823** e2e · couverture
**99,12 / 92,13 / 98,60 / 99,23** — `export-liasse.regles.ts` à **100 / 100 / 100 / 100**.

⚠️ Deux suites Jest lancées **en parallèle** (une en tâche de fond, une au premier plan) se sont
disputé les ports et ont produit des échecs qui **ne se reproduisent pas** en exécution seule
(3 295/3 295 et 823/823 sur des runs propres). Cause d'environnement, pas de code — consignée pour
que le prochain qui la voit ne la cherche pas dans le diff.

### Vérification docker — le fichier réel, octet par octet

```
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="liasse-resultat-fiscal-2026-12-31.csv"

00000000: efbb bf45 7865 7263   ...Exerc      ← le BOM, présent
```

```
Exercice;2026-01-01;2026-12-31␍␊
Balance retenue;6a944ef1…;v1;sage;BROUILLON␍␊
Paquet fiscal;togo;2026;4c1c7342…␍␊
␍␊
Code;Libellé;Sens;Montant (XOF);Origine;Motif␍␊
10;BENEFICE NET COMPTABLE ou PERTE NETTE COMPTABLE;REINTEGRATION;0;AUTO_CAHIERS;␍␊
25;Amendes et pénalités de toute nature;REINTEGRATION;12000;MANUEL;␍␊
```

| Ce qui est prouvé | Preuve |
|---|---|
| **D-416-2** — unités monétaires | le JSON publie `montant: 1200000` sur la case `25` ; le CSV publie **`12000`** |
| **AC-3** — empreinte | exercice, balance (**`BROUILLON`** — l'export le dit) et checksum du paquet |
| **AC-4** — refus | exercice **2019** (sans balance) ⇒ **404 `BALANCE_INTROUVABLE`** en `application/json`, **pas** un CSV vide |
| Les libellés | servis grâce à **STORY-415**, clôturée le même jour : sans elle, ce fichier n'aurait porté que des numéros |

---

## Progress Tracking — clôture

**Statut : `done`** — implémentée, validée, vérifiée sur stack docker, revue (**1 constat, corrigé**),
revue de sécurité (**0 vulnérabilité**, plus **un durcissement pris**). PR **#73** rebase-mergée sur
`dev` (3 commits).

Les 4 critères d'acceptation sont tenus.

### Revue de code — 1 constat (commit `428c606`)

**F-416-1 — `codeHorsPaquet` était le seul attribut sémantique de `postesDsf` que le fichier
laissait tomber, et il tombait en silence.**

Scénario : un retraitement saisi sous un code **valide au moment de la saisie**, un paquet republié
qui retire ce code. L'écran affiche la ligne signalée « case introuvable » — le comptable peut la
barrer, refuser le dépôt. Le CSV sortait `35;;REINTEGRATION;350000;MANUEL;` — **strictement
indiscernable** d'une case valide dont le paquet ne publie pas le libellé, cas que le contrat
documente comme **normal**. Le comptable recopiait alors un montant dans une case qui n'existe plus,
ou pire, dans celle qui porte désormais ce numéro : **mot pour mot** le « chiffre recopié dans la
case d'à côté » que cette story existe pour empêcher.

⚡ Et c'était **le seul chemin** par lequel le fichier différait de `postesDsf` sans qu'aucune
assertion ne bouge. Le test AC-2 du service compare désormais les **sept** colonnes : le trou ne
peut plus se rouvrir.

### Revue de sécurité — 0 vulnérabilité, et un durcissement pris (commit `ea8ed2a`)

L'injection de formule CSV (**CWE-1236**) a été instruite champ par champ, en remontant jusqu'aux
entrées HTTP. Conclusion : **non exploitable** — aucune des sept colonnes n'est du texte libre
(libellé du paquet **embarqué et sha256-vérifié**, énumérations fermées `sens`/`origine`/`motif`,
entier). Les champs réellement saisis (`justification`, `baseLegale`, `pieceRef`) sont **présents
dans les objets** mais **n'atteignent aucune cellule**.

⚡ **C'est précisément pourquoi le durcissement a été pris** : la sûreté reposait **entièrement**
sur cette circonstance. Le jour où une colonne `Justification` est ajoutée — demande naturelle pour
un fichier destiné au contrôle, et *ce* texte-là est saisi par le client — l'export deviendrait
injectable **sans qu'une seule ligne de l'échappement ait changé**. Les six amorces (`=`, `+`, `-`,
`@`, TAB, CR) sont désormais préfixées d'une apostrophe **sur les cellules de texte**.

⛔ **Jamais sur la colonne des montants** : un montant négatif commence par `-`, et le préfixer en
ferait du **texte** dans le tableur — une cellule qu'on ne peut plus additionner, sur un fichier
fait pour être relu chiffre par chiffre. Le remède serait pire que le mal, et le mal n'existe pas
là. Une mutation qui neutralise **aussi** cette colonne fait rougir le test qui le garde.

| Autre piste instruite | Pourquoi elle ne tient pas |
|---|---|
| Response splitting sur `Content-Disposition` | le nom vient de `toISOString().slice(0,10)` — alphabet `[0-9+-]` par spécification ; `@IsDateString()` en amont, et `res.setHeader` refuse les caractères de contrôle : **deux filets**. |
| Contrôle d'accès contourné par une route de fichier | la route ne porte **aucun** décorateur propre : elle hérite intégralement de la classe (`@Roles`, `@RequiresBalanceAccess`, `@RequiresDossierScope`, `@RequiresRegime`), et `getAllAndOverride([handler, class])` fait le reste. `@Res({ passthrough: true })` conserve intercepteurs et filtres — l'e2e le prouve par un 404 en `application/json`. |
| Fuite d'information | `balance.id`/`version`/`source`/`etat`, checksum, devise sont **déjà publiés à l'identique** par `GET /resultat-fiscal`, au même appelant, derrière les mêmes gardes. Le nom de fichier ne porte **rien** du dossier. |
| Épuisement de ressources | le fichier est borné **par construction** : 17 codes du paquet + postes sans code **groupés par motif** (≤ 3). Mille lignes de dépense produisent le même nombre de lignes CSV — l'agrégation est par code. |

### Passe de mutation — 9 mutations, 9 rouges **par assertion**

| Mutation | Effet |
|---|---|
| le BOM disparaît | rouge |
| séparateur `,` (locale anglaise) | **5 rouges** |
| les montants repassent en **unités mineures** (le facteur cent) | **5 rouges** |
| aucun échappement RFC 4180 | 3 rouges |
| `LF` au lieu de `CRLF` | rouge |
| le fichier **trie** les postes (la seconde grille qu'AC-2 interdit) | ⚡ rouge **des deux côtés** : module pur **et** service — la preuve que la source est unique |
| l'alerte « case introuvable » redevient muette | rouge (F-416-1) |
| la neutralisation de formule retirée | 2 rouges |
| la colonne des **montants** neutralisée elle aussi | rouge — le remède pire que le mal est gardé lui aussi |
