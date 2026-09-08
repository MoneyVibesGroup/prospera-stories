# STORY-478 : Le plan de trésorerie 12 mois ne porte aucune ligne de TVA — il fait circuler du HT

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 8 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en confrontant `projection-mensuelle.service.ts` au taux de TVA du paquet fiscal du dépôt (`referentiels/paquet-fiscal-togo-2026.json`).

---

## Le fait

Dans `ProjectionMensuelleService`, les encaissements clients valent la partition des **produits** et
les décaissements fournisseurs celle du **coût des ventes** — deux agrégats **hors taxes**.

Or un client règle **TTC**. Le paquet fiscal du dépôt publie le taux unique : **18 %**
(`tva.tauxStandard`, Art. 195 CGI, assiette « chiffre d'affaires HT »).

Sur le scénario prudent du dossier de démonstration, en N+1 :

| | Montant |
|---|---|
| Encaissements publiés par le plan (HT) | 17 193 750 |
| Encaissements réels (TTC, 18 %) | **20 288 625** |
| TVA collectée | 3 094 875 |
| TVA à reverser (collectée − déductible sur le coût des ventes) | ≈ **557 078 / an**, soit ≈ **46 423 / mois** |

**Aucune de ces lignes n'existe dans le plan.** Sur douze mois les deux erreurs se compensent
approximativement ; **à l'intérieur d'un mois, non** — et c'est précisément ce qu'un plan mensuel sert
à voir. Une entreprise qui encaisse la TVA de ses clients avant de la reverser dispose d'une
**trésorerie de portage** que le modèle ignore, et une entreprise en crédit de TVA subit un décalage
que le modèle ignore aussi.

⚠️ Distinct de **STORY-469**, qui porte sur le **montant** du BFR (créances et dettes calculées HT).
Ici c'est l'**absence d'une ligne** dans le plan de trésorerie.

## Critères d'acceptation

- [x] AC-1 — `PeriodeMensuelle` porte `tvaCollectee`, `tvaDeductible` et `tvaReversee` — trois lignes
      publiées, puisque `fluxNet` est par contrat **exactement** la somme des lignes publiées.
- [x] AC-2 — Les encaissements et décaissements sont **TTC** ; le contrat le dit dans le nom ou dans
      la documentation du champ, jamais implicitement.
- [x] AC-3 — La périodicité et l'échéance du reversement viennent du **paquet fiscal du dossier**.
      ⚠️ Le paquet ne les publie **pas aujourd'hui** (il ne porte que les 4 acomptes d'IS) : la story
      dépend d'un ajout au référentiel, à tracer séparément — même angle mort que les « dates de dépôt
      DSF » que le `_meta` annonce sans les porter (relevé en FE-034).
- [x] AC-4 — Un dossier **non assujetti** (sous le seuil, ou exonéré Art. 180) rend les trois lignes à
      `0` **motivé**, jamais absentes.
- [x] AC-5 — `MODELE_PROJECTION_VERSION` passe à `1.1.0` (ou au-delà) : les montants changent à
      hypothèses inchangées.

## Conséquences ailleurs

- L'articulation `Σ mensuel = annuel` doit rester une **identité** : l'annuel doit donc porter la même
  TVA, ou la story doit expliciter pourquoi elle s'annule sur l'exercice.

---

## Décisions de cadrage

- **D-478-1 — les trois lignes de TVA ENTRENT dans `fluxNet`, et `encaissementsClients` reste
  HORS TAXES.** AC-1 fonde les trois lignes sur l'invariant « `fluxNet` est exactement la somme
  des lignes publiées » : fondre la TVA dans `encaissementsClients` la rendrait invisible, la
  publier *en plus* d'un encaissement déjà TTC la compterait deux fois. AC-2 est donc servi par
  sa propre seconde branche — « le contrat le dit dans le nom **ou dans la documentation du
  champ** » : `encaissementsClients` et `decaissementsFournisseurs` sont documentés HT, et le
  contrat publie que le mouvement réel vaut la somme des deux lignes.

- **D-478-2 — la TVA nette est reversée EN ENTIER dans les douze mois.** La fiche offre deux
  branches (« l'annuel porte la même TVA » **ou** « expliciter pourquoi elle s'annule sur
  l'exercice ») : c'est la seconde qui est retenue. `Σ collectée − Σ déductible − Σ reversée = 0`
  exactement, donc le flux annuel ne bouge pas d'une unité et `ecartArticulation` reste nul.
  Conséquence assumée : la **dernière déclaration est soldée au mois 12** au lieu de déborder au
  mois 13. La laisser déborder laisserait une dette de TVA au 31/12 que ni le BFR ni le bilan
  prévisionnel ne portent — le plan afficherait alors une trésorerie que l'entreprise ne détient
  pas, et un contrôle publié comme **identité** deviendrait faux.

- **D-478-3 — AC-3 lit le vocabulaire DÉJÀ écrit par `balance-service`, il n'en invente pas un
  second.** `balance-service` publie depuis STORY-093, sur le **même** paquet fiscal togolais,
  `tva.declaration.periodicites[].moisParPeriode` + `tva.declaration.periodiciteParDefaut`.
  `bilan-service` lit exactement ces champs, avec la même règle *fail-closed* (défaut qui ne
  désigne aucune périodicité publiée ⇒ `null`, jamais une mensuelle implicite). Écrire ici un
  `tva.declaration.echeances: ["JJ-MM"]` — la convention des acomptes d'IS — aurait fait dire la
  même chose sous deux noms et obligé la future story de référentiel à en casser un.

- **D-478-4 — l'ajout au référentiel reste HORS PÉRIMÈTRE, comme la fiche le demande.** Le bloc
  `tva.declaration` existe dans les sources de `balance-service` mais **pas** dans
  `paquet-fiscal-togo-2026.json` de `bilan-service`, ni dans l'artefact `syscohada-revise@2.1`
  qu'il embarque. L'ajouter obligerait, dans la même story, à régénérer l'artefact, réaligner le
  checksum du registre, ré-épingler 5 digests **et recopier l'artefact à l'octet dans
  `balance-service`** avec ses propres digests — le patron STORY-428, sur deux dépôts. Le plan
  publie donc le manque (`tva.calendrierPublie: false`) au lieu de le combler.

- **D-478-5 — `variationTvaBfr` (STORY-469) SURVIT et ne fait pas double emploi.** Elle est
  l'effet de **stock** — la taxe immobilisée dans les créances et les dettes, que l'annuel
  retranche déjà de la CAF. Les trois nouvelles lignes sont l'effet de **flux** et somment à zéro
  sur l'exercice : elles ne déplacent pas le total annuel, seulement son calendrier.

## Progress Tracking

### Périmètre

**Inclus** — `bilan-service` uniquement, un seul dépôt.

**Hors périmètre, déclaré** — l'ajout de `tva.declaration` au paquet fiscal embarqué par
`bilan-service` (D-478-4) et la position nette de TVA au bilan (`tvaNetteNonPortee` reste `true`,
et son contrat dit désormais pourquoi).

### Défaut préexistant trouvé et fermé

⚡⚡ **`variationTvaBfr` entrait dans `fluxNet` sans jamais être exportée.** STORY-469 a ajouté la
ligne au modèle et au contrat HTTP, mais **pas** à la feuille « Plan de trésorerie mensuel —
exploitation » : un lecteur qui additionnait les colonnes de l'export tombait à côté du flux net
**tous les mois** dès que le taux était non nul. La garde de recomposition de
`modele-previsionnel.spec.ts` restait **VERTE** parce que sa fixture fixait `variationTvaBfr: 0`
— exactement le piège que STORY-467 avait déjà dû corriger sur les charges financières, et
STORY-458 avant elle sur l'impôt. **Troisième occurrence du même angle mort.** La colonne est
ajoutée et la fixture porte désormais un montant non nul, sans quoi la garde resterait vacante
pour les trois nouvelles lignes de TVA aussi.

### Portes de qualité

| Porte | Résultat |
|---|---|
| Lint (`eslint --max-warnings 0`) | 0 warning **après correctif de revue** — cf. C-1 |
| Build (`nest build`) | OK |
| Unitaires + couverture (`test:cov`) | 2 329 verts, 1 ignoré — seuils 65/90/90/90 tenus |
| End-to-end (`test:e2e`) | 709 verts sur 23 suites |

### Table de mutations — 17 sur 17 ROUGES

Chaque mutation est appliquée au code de production, la batterie ciblée est relancée, puis le
code est restauré. Une mutation qui reste **verte** signale un test qui ne mesure rien.

| # | Mutation | Verdict |
|---|---|---|
| M1 | la TVA est assise sur la production, pas sur les encaissements | ROUGE (9) |
| M2 | le dernier reversement déborde au mois 13 (clamp retiré) | ROUGE (5) |
| M3 | la période finale incomplète n'est jamais soldée | ROUGE |
| M4 | `tvaReversee` retirée de `fluxNet` | ROUGE |
| M5 | `tvaCollectee` retirée de `fluxNet` | ROUGE |
| M6 | `tvaDeductible` retirée de `fluxNet` | ROUGE |
| M7 | fail-closed levé : on prend la 1re périodicité au lieu du défaut | ROUGE |
| M8 | borne `1..12` du `moisParPeriode` retirée | ROUGE |
| M9 | périodicité lue APRÈS la sortie d'exonération | ROUGE |
| M10 | `calendrierPublie` forcé à `true` | ROUGE |
| M11 | colonne « Var. TVA sur BFR » retirée de l'export | ROUGE |
| M12 | colonne « TVA collectée » retirée de l'export | ROUGE |
| M13 | colonne « TVA reversée » retirée de l'export | ROUGE |
| M14 | `partTva` rend un montant même à taux 0 | ROUGE (5) |
| M15 | le net réparti est recalculé sur les agrégats (double arrondi) | ROUGE |
| M16 | colonne « TVA déductible » retirée de l'export | ROUGE |
| M17 | la valeur `tvaReversee` n'est plus servie à la ligne d'export | ROUGE (3) |

⚡⚡ **M11 à M13 et M16 SURVIVAIENT au premier tour.** La garde de recomposition de l'export lit
les **cellules** d'une ligne, jamais les **colonnes** de la section : retirer un
`colonneMontant(...)` la laissait verte alors que la feuille remise au banquier perdait la
colonne entière. Une garde de colonnes **exhaustive et ordonnée** (clés *et* libellés) a été
ajoutée — c'est le seul endroit du dépôt qui exige qu'une composante ajoutée au flux soit aussi
**exportée**.

### Vérification sur le référentiel RÉEL

⚠️ **Cette story n'écrit RIEN en base** : la projection est calculée à la lecture, il n'y a ni
document, ni transaction, ni collection à contrôler. La vérification qui vaut ici porte donc sur
l'**artefact de référentiel embarqué**, celui que le service sert vraiment — et non sur un paquet
mocké, qui n'aurait prouvé que la forme du test.

Le moteur compilé (`dist/`) a été exécuté sur
`src/modules/bilan/referentiel/assets/syscohada-revise-2.1.json`, l'artefact réel :

| Mesure | Valeur |
|---|---|
| Bloc `tva` du paquet réel | `{"tauxStandard":0.18,"type":"taux unique","base":"chiffre d'affaires HT","source":"Art. 195 CGI 2026"}` |
| Résolution | `tauxTvaPct: 18` · `motifTva: TAUX_PUBLIE` · `moisParPeriodeTva: null` |
| Plan publié | `calendrierPublie: false` · `moisReversement: [1..12]` · `tvaNetteN1: 5 925 000` |
| Σ collectée | 19 575 000 |
| Σ déductible | 13 650 000 |
| Σ reversée | 5 925 000 |
| **Identité Σ(c − d − r)** | **0** |
| **`ecartArticulation`** | **0**, `articule: true` |
| Mois 1 | encaissements HT 6 250 000 · TVA collectée **1 125 000** (exactement 18 %) · TTC **7 375 000** · reversée 493 750 |
| `fluxNet` recomposable sur les 12 mois | oui |

⛔ **La mesure confirme AC-3 par le manque** : le paquet réel ne publie **aucun** bloc
`tva.declaration`, donc `moisParPeriodeTva` sort à `null` et le plan **déclare** son repli au
lieu de le taire. C'est la dépendance au référentiel que la fiche annonçait, mesurée plutôt que
supposée.

### Vérification docker — le contrat servi par le conteneur

Stack relancée (`mongo` + `redis` + `kafka` + `bilan-service`), `/api/v1/health` :
`{"status":"ok","info":{"mongodb":{"status":"up"},"kafka":{"status":"up"}}}`.

Contrat lu sur `/api/docs-json` du conteneur, **pas** sur le code :

| Contrôle | Résultat |
|---|---|
| `PeriodeMensuelleDto` publie les 3 lignes | `tvaCollectee`, `tvaDeductible`, `tvaReversee` — `number`, chacune avec sa description |
| `variationTvaBfr` publiée et décrite | oui |
| `PlanTvaMensuelDto` | `tauxPct`, `source`, `tvaNetteNonPortee`, `moisReversement`, `calendrierPublie`, `tvaNetteN1` |
| `moisReversement` | `array` de `number` — **pas un `object` opaque** |
| `FiscaliteProjectionDto.moisParPeriodeTva` | `number`, `nullable: true` |
| La réponse mensuelle porte `tva` | oui |
| Version annoncée | `1.8.0` |

## Revue de code — 8 constats, 1 bloquant

### ⚡⚡ C-1 (BLOQUANT) — la fiche déclarait une porte qui n'était plus franchie

`eslint --max-warnings 0` échouait sur **5 fichiers**, dont le code de production
(`projection-mensuelle.service.ts:214`, une ligne à 86 colonnes). Or la section *Portes de
qualité* ci-dessus annonçait « 0 warning ».

⛔ **La mesure était vraie quand je l'ai prise, et fausse quand je l'ai écrite.** J'avais lancé le
lint **avant** d'ajouter la garde de colonnes de l'export, les essais e2e de la story et le champ
`moisParPeriodeTva` de l'attendu exhaustif. Une porte se rejoue **après** le dernier octet écrit,
sinon elle ne certifie qu'un état qui n'existe plus. La CI aurait rougi au premier job.

### ⚡⚡ C-2 — l'invariant de somme ne voit PAS un décalage de frontière de période

Aucune assertion ne pinçait le **montant** reversé à une échéance donnée. La revue l'a démontré
par mutation : en faisant mordre la première période d'un mois sur la deuxième, le profil de
portage est décalé de tout un mois sur l'année et **511 essais restent verts**. La somme reste
juste, la liste `moisReversement` reste juste, les mois muets restent muets — parce que **la
dernière déclaration absorbe le reliquat**. Une assertion par échéance a été ajoutée, avec ses
attendus calculés à part.

### ⚡⚡ C-3 — ma docstring nommait le vocabulaire que D-478-3 avait REJETÉ

`tva.ts` décrivait `calendrierPublie` comme venant de `tva.declaration.echeances` — la convention
des acomptes d'IS, celle que D-478-3 écarte **par écrit cinq fichiers plus loin**. C'est le seul
endroit du dépôt qui décrit le contrat attendu du paquet **à côté du champ concerné** : la story
de référentiel annoncée par AC-3 aurait enrichi l'artefact sous le mauvais nom, et
`moisParPeriodeTva` serait resté `null` en silence par fail-closed. Un référentiel enrichi **sans
aucun effet**, sans erreur nulle part.

### ⚡ C-4 — un titre de test devenu faux dans un fichier pourtant modifié par la story

`bfr-ttc.spec.ts` : « le plan mensuel est IDENTIQUE avec ou sans TVA » et « c'est ce que
STORY-478 remplacera par un vrai flux ». Le test ne comparait que deux lignes de règlement ; le
titre en promettait davantage, et il est faux depuis cette story. Six autres renvois de STORY-469
vers 478 avaient été repris, celui-ci avait été oublié **quarante lignes au-dessus** d'une de mes
modifications. Le titre est corrigé et une assertion affirme désormais que le flux net, lui,
**diffère**.

### ⚡ C-5 — deux formules publiées oubliaient le `/100` — le facteur cent de STORY-414/416

Le contrat publiait « `tvaCollectee = encaissementsClients × tva.tauxPct` » alors que `tauxPct`
est publié **en points** (`18`). Un client qui recompose comme le contrat le dit obtient
`112 500 000` au lieu de `1 125 000`. Dans une description **faite pour être recopiée**.

### ⚡ C-6 — les paragraphes 1.7.0 et 1.8.0 collés, dans les TROIS contrats

Le fragment 1.7.0 se terminait sans espace : le texte servi sur `/api/docs-json` disait
`…(seuilRentabilite).⚡⚡ **1.8.0…`. Aucune garde ne regarde la phrase — classe de défaut de
STORY-400.

### ⚡⚡ C-7 — la TVA est assise sur le TOTAL DES PRODUITS, pas sur le chiffre d'affaires

Le paquet fiscal écrit lui-même son assiette : « chiffre d'affaires HT » (Art. 195 CGI). Le
modèle, lui, assied la TVA sur les **produits**. Mesuré sur le scénario canonique où le
référentiel ancre le CA à 60 % des produits : Σ `tvaCollectee` = **19 575 000** au lieu de
≈ 11 745 000 — la TVA publiée, et toute l'amplitude du portage, sont **~67 % trop grandes**.

⚖️ **Non corrigé, et c'est un arbitrage.** Les encaissements clients valaient déjà la répartition
des produits **avant** la story, et le BFR en TTC (STORY-469) applique déjà le taux aux produits :
basculer la seule TVA de flux ferait cohabiter **deux assiettes** sur la même taxe. La story ne
crée pas l'écart, elle en **dérive un montant fiscal publié**. Le contrat publie donc désormais
`tva.assietteTva: 'TOTAL_PRODUITS'`, sur le précédent du minimum forfaitaire de perception
(`impot.assietteRetenue`, D-458-1) : la limite s'apprend du contrat au lieu de se deviner.
**À trancher par le PO** — la mise en cohérence touche `bfr.ts` et le moteur annuel.

### ⚡⚡ C-8 — ma justification publiée disait l'INVERSE du modèle

Le contrat affirmait : « le modèle reverse sur les douze mois EXACTEMENT ce qu'il collecte — il ne
reste donc, par construction, aucune dette ni aucun crédit de TVA au 31/12 **que le BFR devrait
porter** ».

Deux erreurs. Le modèle reverse sa TVA **nette** (collectée **moins** déductible), pas ce qu'il
collecte. Et surtout la conclusion est retournée : c'est **parce que** le BFR ne porte aucune
dette de TVA que `CAF (hors taxes) − ΔBFR (TTC)` sous-estime la trésorerie de `t × ΔBFR`. Mesuré :
clôture du mois 12 à `19 363 332` à taux 0 contre `19 348 332` à 18 %, un écart de **15 000** égal
à `Σ variationTvaBfr`, alors que le modèle de TVA publié implique `0`.

⛔ **La cause est ANTÉRIEURE à la story** (convention de STORY-469) et le mensuel **doit** garder
`variationTvaBfr` pour que `ecartArticulation` reste nul. Ce qui relevait de STORY-478, et qui est
corrigé, c'est la **phrase publiée** : elle dit maintenant que deux conventions cohabitent, que la
part fiscale du BFR grève la trésorerie sans être reversée à personne, et que leur mise en
cohérence touche le moteur **annuel** et se trace à part.

## Revue de sécurité — 0 vulnérabilité

Les six axes instruits, les deux plus prometteurs **mesurés sur le code compilé**. La PR ne touche
aucun contrôleur, aucun guard, aucun décorateur de rôle, aucun DTO d'entrée, aucune route.

⚡⚡ **Un durcissement retenu, trouvé indépendamment par ma propre mesure et par la revue.**
`moisReversementTva(0)` faisait `fin += 0`, donc `mois.push(1)` à l'infini : **épuisement mémoire
en 3 secondes** ; `-1` faisait décroître `fin`, la condition `fin <= 12` restant vraie à jamais.

⛔ **Inatteignable aujourd'hui** — `resoudreFiscalite` filtre déjà `Number.isInteger && 1..12`, et
la chaîne d'approvisionnement est fermée (artefact embarqué, sha256 épinglé, aucune donnée client
n'atteint ce paramètre). Mais la fonction est **exportée** et la garde vivait dans un **autre
fichier**, à trois cents lignes de la boucle : le patron exact des constats STORY-445 et
STORY-457. Le jour où une story rend la périodicité saisissable — la suite naturelle d'AC-3 — un
`0` traversant un `@IsInt()` sans `@Min(1)` tuerait le process de tous les tenants.

⚡ **Et la garde ne suffisait pas là où je l'avais posée** : ma propre mutation M21 est restée
**VERTE**. `fluxTva` décidait son repli sur le seul `=== null`, donc une périodicité fractionnaire
empruntait la branche de répartition, où `for (let m = debut; ...)` avec `debut = 1.5` lit
`nettesM[1.5]` — `undefined` — et **empoisonne la série de `NaN`** sans exception ni message.
Troisième occurrence dans ce dépôt d'une garde posée sur un seul des chemins.

## Table de mutations — 22 sur 22 ROUGES

Cinq mutations ajoutées après les revues :

| # | Mutation | Verdict |
|---|---|---|
| M18 | frontière de la 1re période décalée d'un mois | ROUGE |
| M19 | garde d'intégrité du domaine retirée (`1.5` accepté) | ROUGE |
| M20 | borne haute du domaine retirée (`13` accepté) | ROUGE |
| M21 | garde posée sur `moisReversementTva` mais **pas** sur `fluxTva` | ROUGE *(VERTE au premier tour)* |
| M22 | le flux net redevient identique avec ou sans TVA | ROUGE |

## Vérification REJOUÉE sur l'état final (après correctifs de revue)

⛔ Les correctifs C-5, C-6, C-7 et C-8 ont changé le **contrat publié** : la mesure d'avant ne
vaut donc plus rien. Elle est rejouée intégralement.

**Sur l'artefact de référentiel réel** (`syscohada-revise-2.1.json`, moteur compilé) :

| Mesure | Valeur |
|---|---|
| Résolution | `tauxTvaPct: 18` · `motifTva: TAUX_PUBLIE` · `moisParPeriodeTva: null` |
| Plan publié | `assietteTva: TOTAL_PRODUITS` · `calendrierPublie: false` · `moisReversement: [1..12]` · `tvaNetteN1: 5 925 000` |
| **Identité Σ(c − d − r)** | **0** |
| **`ecartArticulation`** | **0**, `articule: true` |
| Mois 1 | HT 6 250 000 · TVA 1 125 000 · TTC 7 375 000 |

**Sur le contrat servi par le conteneur** (`/api/docs-json`, pas le code) :

| Contrôle | Résultat |
|---|---|
| `PlanTvaMensuelDto` | `tauxPct`, `source`, `tvaNetteNonPortee`, `moisReversement`, `assietteTva`, `calendrierPublie`, `tvaNetteN1` |
| `assietteTva` | `enum: ["TOTAL_PRODUITS"]`, décrite — **C-7 servi** |
| Formules `tvaCollectee` / `tvaDeductible` | portent le `/ 100` — **C-5 servi** |
| Séparateur entre 1.7.0 et 1.8.0 | présent — **C-6 servi** |
| Justification `tvaNetteNonPortee` | recalée — **C-8 servi** |
| `object` opaques dans `PlanTvaMensuelDto` | **aucun** |

### Portes rejouées sur l'état final

| Porte | Résultat |
|---|---|
| Lint | **0 warning** (`CODE_LINT=0`) |
| Build | OK |
| Unitaires + couverture | 2 332 verts, seuils 65/90/90/90 tenus |
| End-to-end | 709 verts sur 23 suites |
| Mutations | **22 sur 22 rouges** |

⚠️ Un échec transitoire de `rendu-excel.spec.ts` a été observé pendant un tour de couverture
lancé alors que le conteneur recompilait : le fichier passe seul en 57 s, c'est une **expiration
sous charge**, pas une régression. Le tour rejoué machine libre est vert.
