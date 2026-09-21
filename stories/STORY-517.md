# STORY-517 : Une provision technique est une évaluation datée, versionnée, avec sa méthode et son auteur — jamais un solde

Status: done

**Complexité :** high

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-513** (le contrat, qui porte la catégorie et la monnaie)
**Origine :** découpage `epics-assurance-2026-08-27.md`, **AD-2** de la spine.

---

## Le fait

Les provisions techniques représentent **l'essentiel du passif** d'un assureur. Le plan CIMA leur
donne un poste dédié : `CP3` — *« Provisions techniques brutes »*, mappé aux comptes `31`, `32`,
`34`, `35`, `38`. *(Lu dans l'artefact le 2026-08-27.)*

⚡ **Ce qui distingue une provision technique d'un solde ordinaire, c'est qu'elle n'est pas
constatée : elle est ÉVALUÉE.** Deux actuaires, deux méthodes, deux montants — tous deux
défendables. Le montant seul ne prouve rien ; ce qu'un contrôle CIMA demande, c'est **la méthode**.

⇒ **Le modèle ne peut donc pas être un champ « montant » que l'on met à jour.** C'est ce qui rend
cette story structurelle et non cosmétique : le mauvais modèle ici ne se rattrape pas, parce qu'il
détruit l'historique des évaluations à mesure qu'il les écrase.

## Cadrage mesuré avant de coder (2026-09-21)

⛔⛔ **Le Code CIMA a été dépouillé, et il AUGMENTE l'AC-1 sur un point structurant : il n'y a pas
UNE liste de provisions techniques, il y en a DEUX — et le TYPE dépend de la CATÉGORIE.** Les
citations ont été relues sur la source officielle (`cima-afrique.org`, une page par article) **et**
confrontées au Code intégral (361 p., texte extrait localement).

### M1 — ⚡⚡ DEUX listes, et elles ne se recouvrent presque pas

> **Art. 334-2** *(modifié 2016 et 2018)* — « Les provisions techniques correspondant aux opérations
> d'assurance **sur la vie** et aux opérations de **capitalisation** sont les suivantes :
> 1°) **provision mathématique** […] ; 2°) **provision pour participation aux excédents** […] ;
> 3°) **provision de gestion** […] ; 4°) **provision pour risque d'exigibilité des engagements
> techniques** […] ; 5°) toutes autres provisions techniques qui peuvent être fixées par la
> Commission de Contrôle des Assurances. »

> **Art. 334-8** *(modifié 2006 et 2016)* — « Les provisions techniques correspondant aux **autres
> opérations** d'assurance sont les suivantes : 1°) **provision mathématique des rentes** […] ;
> 2°) **provision pour risques en cours** […] ; 3°) **provision pour sinistres à payer** […] ;
> 4°) **provision pour risques croissants** […] ; 5°) **provision pour égalisation** […] ;
> 6°) **provision mathématique des réassurances** […] ; 7°) **provision pour annulation de primes**
> […] ; 8°) **provision pour risque d'exigibilité des engagements techniques** […] ; 9°) toutes
> autres provisions techniques […]. »

⇒ **Une « provision de gestion » n'existe qu'en Vie ; une « provision pour risques en cours »
n'existe qu'en Non-Vie.** Le modèle doit donc **refuser un type incompatible avec la catégorie** —
c'est une règle **transcrite**, pas inventée.

⚠️ **Une seule figure dans les deux listes** : la provision pour **risque d'exigibilité** (334-2 4°
et 334-8 8°).

⚠️ **Et « primes non acquises » de l'AC-1 n'existe toujours pas** : le concept s'appelle
**« provision pour risques en cours »** (leçon D-514-1, mesurée sur les 608 pages).

### M2 — ⚠️ PIÈGE DE VERSION, et il est daté

L'édition **2014** du Code ne compte que **8** postes en Non-Vie et **3** en Vie. Les décisions du
Conseil des Ministres du **08/04/2016** et du **12/04/2018** ont ajouté la **provision pour risque
d'exigibilité** et la **provision de gestion**. ⇒ Un module calé sur un PDF pré-2016 **omet deux
postes**, et l'omission ne se voit qu'au premier contrôle.

### M3 — ⛔⛔ La part des réassureurs : le texte l'impose, et un article la VERROUILLE

> **Art. 334** — « Les provisions techniques mentionnées au 1°) du présent article sont calculées,
> **sans déduction des réassurances cédées** à des entreprises agréées ou non […]. »

> **Art. 334-11 — Réassurance** — « La provision […] relative aux cessions en réassurance ou
> rétrocessions **ne doit en aucun cas être portée au passif du bilan pour un montant inférieur à
> celui pour lequel la part du réassureur ou du rétrocessionnaire […] figure à l'actif.** »

Et le plan comptable le traduit en **deux endroits** : le **brut au passif** (comptes `31` à `38`,
poste `CP3`), la **part cédée à l'actif** (compte `39`, poste `CA2`). Mesuré dans l'artefact
`cima-assurances@1.0` : `CP3 ← [31, 32, 34, 35, 38]` et `CA2 ← [39]`.

⇒ **AC-5 confirmé par le texte** : deux champs, jamais une différence. La compensation n'est pas
une préférence de présentation, elle est **interdite**.

### M4 — L'AUTEUR : ce que ce service peut savoir, et ce qu'il ne peut pas

L'AC-4 exige que « l'auteur soit une personne identifiée, et son rôle porté », en citant le défaut
de STORY-441 — *publier un `ObjectId` nu sur l'écran où l'identité **est** l'information*.

⛔ **Le jeton de cet écosystème ne porte ni nom ni e-mail** (`sub`, `org`, `roles`,
`emailVerified`), et ce service n'a **aucun read-model d'identité** : STORY-441 a résolu le même
problème par un read-model alimenté par `identity.*`, ce qui déborde très largement de cette story.

⇒ **L'évaluation porte l'auteur DÉCLARÉ — nom et qualité — EN PLUS du `userId` de l'opérateur.** Et
ce n'est pas un pis-aller : *une provision technique engage **celui qui la signe***, qui n'est pas
forcément un utilisateur de la plateforme — un actuaire externe signe le rapport sans avoir de
compte. Le nom est donc **publié**, simplement **déclaré** et non résolu, et le hook vers un
read-model d'identité est **nommé**.

### M5 — ⚠️ Deux registres pour un même type, et il faut le dire

Le module `provisions` de **STORY-514 CALCULE** la provision pour risques en cours (art. 334-9 et
334-10). Ce registre-ci **HÉBERGE** des évaluations **déclarées**, de toute nature. Pour le type
`RISQUES_EN_COURS`, deux sources coexistent donc.

⇒ Les deux restent **distincts** — *calculée* contre *hébergée* —, et c'est **STORY-518** qui dira
laquelle entre au compte de résultat. Hook inerte documenté, conformément au périmètre BMAD.

### M6 — ⛔ Le chargement et les méthodes prescrites ne sont PAS ici

L'art. 334-12 (dossier par dossier, tardifs) et l'art. 334-13 (chargement ≥ 5 %) décrivent
**comment calculer** une PSAP. L'AC-6 l'exclut en propre — « aucun calcul n'est fait ici » — et
AD-12 interdit d'inventer une méthode actuarielle. Le module **héberge** l'évaluation et sa
méthode ; **STORY-519** dira ce qui se calcule, et à quelle condition.

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-517-1** ⚡⚡ | Le **type** de provision est **contraint par la CATÉGORIE** : un type de l'art. 334-2 n'est acceptable qu'en Vie, un type de l'art. 334-8 qu'en Non-Vie | Le Code publie **deux listes**, et elles ne se recouvrent presque pas. Accepter une « provision de gestion » en Non-Vie ferait entrer au bilan un poste que le texte n'y prévoit pas — et personne ne le verrait, puisque le montant resterait plausible |
| **D-517-2** | L'**énumération transcrit les deux articles**, dans leur version **en vigueur** (modifiée 2016 et 2018) | Un module calé sur une édition pré-2016 omet la **provision pour risque d'exigibilité** et la **provision de gestion** — deux postes sur quatorze |
| **D-517-3** ⛔⛔ | Le **brut** et la **part des réassureurs** sont **deux champs**, jamais une différence | Art. 334 : « calculées **sans déduction des réassurances cédées** » ; art. 334-11 : la part cédée « ne doit **en aucun cas** » être inférieure à ce qui figure à l'actif. Le plan le traduit en deux endroits : `CP3` au passif (comptes 31-38), `CA2` à l'actif (compte 39). La compensation est **interdite**, pas déconseillée |
| **D-517-4** | **Append-only et chaîné par rang**, comme les deux registres voisins | AD-2 : « une évaluation datée et versionnée, jamais un solde qu'on écrase ». Le chaînage porte sur le triplet **(catégorie, type, exercice)** : chaque provision a sa propre suite de versions |
| **D-517-5** ⚡ | La provision **retenue à une date d'arrêté** est la **dernière version antérieure** à cette date | AC-3. Même règle que l'état C10b de STORY-516, et même piège : un arrêté 2025 qui consommerait une réévaluation de 2026 publierait un chiffre que personne ne pouvait connaître à la date affichée |
| **D-517-6** | L'**auteur est DÉCLARÉ** — nom et qualité — **en plus** du `userId` de l'opérateur | M4. Une provision technique engage **celui qui la signe**, qui n'est pas forcément un utilisateur de la plateforme. Le nom est **publié**, simplement déclaré et non résolu ; 🪝 le hook vers un read-model d'identité (patron STORY-441) est **nommé** |
| **D-517-7** | La **méthode** est un **texte structuré libre**, accompagné de ses **paramètres** | AC-1. Le Code ne prescrit aucune nomenclature de méthodes pour l'ensemble des provisions — en inventer une imposerait à chaque assureur le vocabulaire d'un autre. ⚠️ Ce que le texte prescrit (forfait de 36 %, prorata) vit déjà dans le module **calculé** de STORY-514 |
| **D-517-8** | ⛔ **Aucun calcul** (AC-6, AD-12) : ni tardifs, ni chargement de 5 %, ni méthode prescrite | Art. 334-12 et 334-13 décrivent **comment calculer** une PSAP ; **STORY-519** dira ce qui se calcule et à quelle condition. Ce module **héberge** |
| **D-517-9** | Les **deux registres coexistent** — celui **calculé** de STORY-514 et celui **hébergé** ici — et la story le **dit** | M5. C'est **STORY-518** qui tranchera lequel entre au compte de résultat. Hook inerte documenté |
| **D-517-10** | ⛔ **Aucun numéro de compte, aucun poste de liasse, aucun producteur Kafka** | D-513-1. `CP3` et `CA2` existent dans le paquet, mais l'imputation appartient à l'adaptateur de balance (AD-5) |

## Critères d'acceptation

- [ ] AC-1 — Une provision technique porte : **type** (PSAP, primes non acquises, risques en cours,
      mathématique vie, autres), **catégorie Vie/Non-Vie**, **exercice**, **date d'évaluation**,
      **montant**, **méthode** (texte structuré), **paramètres** utilisés, **auteur**, et
      **version**.
      ⚡⚡ **AUGMENTÉ par le texte (M1, D-517-1)** : les types ne sont pas libres — le Code en
      publie **deux listes**, l'une pour la Vie (art. 334-2, cinq postes), l'autre pour les autres
      opérations (art. 334-8, neuf postes), et **le type dépend de la catégorie**. ⚠️ « primes non
      acquises » **n'existe pas** : le concept s'appelle **« provision pour risques en cours »**
      (D-514-1).
- [ ] AC-2 — ⛔ **Append-only** : une réévaluation crée une **nouvelle version**, l'ancienne reste
      lisible. Le schéma le refuse, pas seulement la convention — même invariant que le journal
      d'audit.
- [ ] AC-3 — La provision **retenue à une date d'arrêté** est la dernière version antérieure à cette
      date. Un arrêté 2025 ne doit **jamais** consommer une réévaluation faite en 2026.
- [ ] AC-4 — L'**auteur** est une personne identifiée, et son rôle est porté. ⚠️ Une provision
      technique engage celui qui la signe ; publier un `ObjectId` nu reproduirait le défaut de
      STORY-441 sur l'écran où l'identité **est** l'information.
      ⚡ **Précisé (M4, D-517-6)** : le jeton ne porte ni nom ni e-mail et ce service n'a aucun
      read-model d'identité. L'auteur est donc **déclaré** — nom et qualité — **en plus** du
      `userId`, et le hook vers le read-model est nommé.
- [ ] AC-5 — La **part des réassureurs** dans chaque provision est portée **séparément** du brut
      (AD-4) : `CP3` est le brut, `CA2` est la part des cessionnaires. Les compenser est interdit.
      ⚡ **Confirmé par le texte (M3)** : l'art. 334 impose le calcul « sans déduction des
      réassurances cédées », et l'art. 334-11 verrouille la part cédée en propre.
- [ ] AC-6 — ⛔ **Aucun calcul n'est fait ici** (AD-12) : le module **héberge** l'évaluation et sa
      méthode. C'est STORY-519 qui dit ce qui sera calculé, et à quelle condition.

## Périmètre

### Livré

- L'agrégat **provision technique** : type **contraint par la catégorie** (D-517-1), exercice
  résolu sur `exercices_dossier`, date d'évaluation, **montant brut**, **part des réassureurs**
  portée séparément, méthode et paramètres, **auteur déclaré** (nom et qualité) et opérateur.
- **Append-only, chaîné par rang** sur le triplet (catégorie, type, exercice) : une réévaluation
  est une **nouvelle version**, et la précédente reste lisible.
- La lecture **à une date d'arrêté** : la dernière version **antérieure** à cette date.
- La **variation** entre deux versions, **dérivée** et jamais stockée.

### Hors périmètre

- ⛔ **Tout calcul** (AC-6, AD-12) : tardifs (art. 334-12), chargement de gestion de 5 %
  (art. 334-13), méthodes prescrites de la provision pour risques en cours (art. 334-9 et 334-10,
  déjà livrées **calculées** par STORY-514) → **STORY-519**.
- ⛔ **L'entrée au compte de résultat** des variations → **STORY-518**, qui tranchera aussi lequel
  des deux registres — calculé ou hébergé — l'alimente (D-517-9).
- ⛔ **La modélisation de la réassurance à la cession** (traités, cessions, commissions) → EPIC-132,
  **STORY-520**. Cette story porte la **part des réassureurs dans la provision**, rien de plus.
- ⛔ **La résolution de l'auteur en identité** (read-model `identity.*`, patron STORY-441) : hors
  périmètre, et **nommée** comme telle.
- ⛔ **Tout numéro de compte et tout poste de liasse** (D-517-10).

## Progress Tracking

**Statut : `done`** (2026-09-21) — développée, validée, revue (code **et** sécurité) et intégrée en
rebase sur `dev` ([PR #7](https://github.com/MoneyVibesGroup/prospera-assurance-service/pull/7)).
Cadrage réglementaire mesuré le 2026-09-21 sur la source officielle
(`cima-afrique.org`, art. 334-2 et 334-8 dans leur version **en vigueur**) **et** sur le Code
intégral (art. 334 « sans déduction des réassurances cédées », art. 334-11, confrontés au texte
extrait localement).

Branches créées **avant** la première ligne de code :

```
docs               MNV-517
assurance-service  MNV-517
```

### Portes de qualité

| Porte | Mesure |
|---|---|
| lint | `eslint "{src,test}/**/*.ts" --max-warnings 0` — **0** |
| build | `nest build` — OK |
| couverture du module | **100 / 100 / 100 / 100** (branches / fonctions / lignes / statements) |
| couverture globale | **99,56 / 94,20 / 99,23 / 99,62** — seuils 65/90/90/90 |
| unitaires | **1 698** verts, 94 suites |
| e2e | **160** verts, dont **67** pour ce module |

### Table de mutations — 25 mutations, 25 ROUGES (18 au développement, 7 en revue)

Chaque règle qui protège d'une régression précise a été **volontairement cassée**, puis restaurée.

| # | Mutation | Test qui rougit |
|---|---|---|
| M1 | `typeAdmisDansLaCategorie` rendue toujours vraie | 14 |
| M2 | `DE_GESTION` ajoutée à la liste **Non-Vie** | 4 |
| M3 | `rang` figé à 1 | 1 |
| M4 | tête de chaîne triée par `_id` au lieu du **rang** | 1 |
| M5 | signe de `variationDuBrut` inversé | 8 |
| M6 | brut **compensé** de la part cédée (art. 334-11) | 4 |
| M7 | arrêté élargi de 100 jours dans l'agrégation | 1 |
| M8 | comparaison de chronologie inversée | 5 |
| M9 | l'exposant seul ne déclenche plus le refus de monnaie | 2 |
| M10 | borne de versions relâchée de `>=` en `>` | 1 |
| M11 | évaluation du jour même refusée (`>` → `>=`) | 1 |
| M12 | `Number.isSafeInteger` remplacé par `!isNaN` | 2 |
| M13 | borne de lecture « en vigueur » relâchée | 1 |
| M14 | portée tenant inversée (`orgId` ↔ `dossierId`) | 1 |
| M15 | `findOneAndUpdate` retiré des hooks append-only | 1 |
| M16 | chaînage rompu (`provisionPrecedenteId` toujours `null`) | 1 |
| M17 | garde d'identifiant malformé inversée | 3 |
| M18 | **routes permutées** (`en-vigueur` après `:provisionId`) | 2 unit **+ 9 e2e** |

⚠️ **Quatre mutations ont dû être reformulées** : leur forme naïve (`if (false)`, suppression d'un
paramètre devenu inutilisé) **ne compilait pas**, et une mutation qui ne compile pas rend « 0 test »,
jamais un rouge — elle ne mesure rien.

### ⛔⛔ Vérification docker — elle a trouvé un bug que RIEN d'autre ne voyait

**`ProvisionsTechniquesModule` ne fournissait pas `Horloge`**, que le service injecte pour refuser
une évaluation future. `UnknownDependenciesException` au boot : le service ne démarrait **pas**, et
le vertical entier tombait avec lui — alors que **lint 0, build OK, 1 677 unitaires et 149 e2e
étaient verts**.

Aucun niveau ne pouvait le voir : l'unitaire construit le service **à la main**, le harnais e2e
déclare ses providers **à plat** sans importer le module, et `app.module.invariant.spec.ts` lit la
**métadonnée** sans rien instancier — son propre commentaire nomme cet angle mort.

⚡ **L'angle mort est fermé** par `app.module.injection.spec.ts` : il double les seules **frontières
du process** (connexion Mongo, client Kafka, configuration) et laisse Nest résoudre tout le reste
**pour de vrai**, module métier par module métier, plus un second test qui garde la liste elle-même.
Vérifié par mutation : retirer le provider `Horloge` le fait rougir en 10 ms.

#### Ce qui a été mesuré sur Mongo réel (base `assurance_service`, replica set `rs0`)

| # | Vérification | Résultat |
|---|---|---|
| 1 | trois versions écrites, **six refus n'écrivent rien** | `total: 3` puis `total: 12` inchangé après 5 refus de plus |
| 2 | la chaîne en base : rangs, prédécesseurs, montants précédents | linéaire et cohérente |
| 3 | aucun champ `montantNet` nulle part | `avecNet: 0` |
| 4 | les **deux index uniques** existent | `unicite_succession_provision_technique`, `unicite_rang_provision_technique` |
| 5 | une **seconde racine** est refusée — la clé `null` **est** indexée | `E11000` sur l'index de succession |
| 6 | un **second successeur** du même maillon est refusé | `E11000` sur l'index de succession |
| 7 | un **second maillon au même rang** est refusé | `E11000` sur l'index de rang |
| 8 | ces trois tentatives n'ont rien écrit | `total: 3` |
| 9 | le comptage borné est **servi par un index** | `IXSCAN`, `docsExamined == nReturned` (3 = 3) |
| 10 | la tête de chaîne : **aucun `SORT` bloquant** | index `unicite_rang_provision_technique`, 1 examiné / 1 rendu |
| 11 | **dix écritures concurrentes** sur la même chaîne | 9 × `201`, 1 × `409` (retryable) |
| 12 | après concurrence : rangs 1→9 **tous uniques**, **une seule racine**, 9 prédécesseurs distincts | aucune bifurcation |
| 13 | chaque maillon pointe le rang immédiatement inférieur, aucun orphelin | `chainageCoherent: true` |
| 14 | le `409` de concurrence n'a **rien** écrit | `total: 12` = 3 + 9 |
| 15-16 | version d'un autre dossier / dossier d'une autre organisation | **404**, jamais 403 |
| 17 | identifiant malformé et identifiant inexistant | **même code, même message** |
| 18 | `PATCH` / `PUT` / `DELETE` sur une version | **404** — les routes n'existent pas |
| 19 | évaluation dans un exercice **clos** | `409 EXERCICE_CLOS` |
| 20 | évaluation datée **demain** | `400 DATE_EVALUATION_FUTURE`, détails `aujourdhui` |
| 21-22 | `1.5e-7` et `"1000"` en montant | **400** — la notation et la conversion implicite sont fermées |

#### ⚡⚡ AC-3 prouvé sur l'agrégation réelle — deux arrêtés, un seul dossier

La même chaîne, lue à deux dates, **ne rend pas la même version** :

| Arrêté | Version retenue | `totalBrut` |
|---|---|---|
| **2026-04-30** | rang **1** (évaluée le 31/03) | **12 000 000** |
| **2026-12-31** | rang **2** (évaluée le 30/06) + l'autre chaîne | **18 000 000** |

⛔ L'arrêté d'avril **ne consomme pas** la réévaluation de juin. Et la catégorie `VIE`, vide, ne
publie **aucune devise** — pas de monnaie inventée sur un ensemble vide (leçon STORY-489).

### ⑥⑦ Revue de code et revue de sécurité — **quatre constats bloquants communs**

Les deux revues (`opus`, sur le même diff) ont **convergé sur les quatre mêmes défauts**, tous
reproduits sur Mongo réel **avant** correction. Aucun n'était visible en lecture du code seul.

| # | Défaut | Mesuré avant correctif |
|---|---|---|
| 1 | les totaux additionnaient des **monnaies hétérogènes** — la garde ne tenait que DANS une chaîne, et une chaîne neuve n'a pas de précédente | `1 000 000` centimes d'euro ajoutés à `20 000 008` GNF, publiés sous l'étiquette `GNF` |
| 2 | aucun contrôle d'**entier exact** sur les cumuls — le JSDoc de la borne ne raisonnait que sur la *soustraction* | 11 versions à `999 999 999 999 999` ⇒ total faux **d'une unité**, en silence |
| 3 | le `$group` portait sur **(type, exercice)** : un type provisionné sur deux exercices comptait **deux fois** | `22 001 000` là où le poste `CP3` portait `12 001 000` |
| 4 | `devise` acceptée en **texte libre de 200 caractères** au lieu d'un code ISO 4217 | `PROVISION SOUS-EVALUEE — VOIR NOTE ACTUAIRE` accepté en `201`, **verrouillant la chaîne à vie** |

⛔⛔ **Le constat n° 3 disait déjà l'inverse du code dans sa propre documentation** : le résumé de
la route promettait « **pour chaque type**, la dernière version antérieure à cette date », et le
repository écrivait « une par **chaîne** ». **Aucun test ne l'exerçait** — le harnais e2e n'ouvrait
qu'un seul exercice, donc le cas était hors de portée de toute la suite.

⚡ Le tri porte désormais `(dateEvaluation, rang)` décroissants, et il lui **faut les deux** : le
rang est propre à **une** chaîne, donc deux chaînes du même type sur deux exercices portent toutes
deux un `rang: 1`, et un tri sur le seul rang en désignerait une **au hasard**.

#### Constats propres à la revue de code

| # | Défaut |
|---|---|
| 5 | ⛔⛔ **la « garde de la garde » du graphe d'injection ne gardait qu'une INCLUSION** (ci-dessous) |
| 6 | la **borne haute** des montants n'était éprouvée par **aucun** test — la relâcher d'un facteur 9 laissait **140 verts**, alors que c'est elle qui protège les cumuls du n° 2 |
| 7 | `LONGUEUR_MAX_AUTEUR` déclarée et **jamais importée** (récidive du patron STORY-516) |
| 8 | le commentaire `AD-3` d'`app.module.ts`, tronqué par la réécriture, laissait entendre que STORY-516 et STORY-517 **n'étaient pas livrées** — neuf lignes sous leur propre déclaration |
| 9 | aucune garde d'**arrêté futur**, alors que les deux lectures voisines la posent |

### ⛔⛔ Le correctif du matin portait lui-même le défaut qu'il venait fermer

`app.module.injection.spec.ts`, écrit une heure plus tôt pour fermer l'angle mort du graphe
d'injection, filtrait les imports d'`AppModule` **sur la liste qu'il était censé éprouver** :

```ts
.filter((m) => MODULES_METIER.some((connu) => connu === m))   // ⛔ jette les manquants
```

Ce filtre **jette précisément les modules absents** : l'assertion ne prouvait que
`MODULES_METIER ⊆ AppModule.imports`, jamais la réciproque — **alors que son JSDoc promettait
l'inverse**. `AppModule` importe **neuf** modules de `src/modules/` ; la liste n'en portait que
**six**. `AuthModule`, `ReadModelsModule` et `DiagnosticsModule` manquaient, et le test était
**VERT**.

⚡ **Le filtre porte désormais sur l'ORIGINE du module**, lue dans les `import` d'`app.module.ts` —
la seule source qui dise d'où vient une classe.

⚡⚡ **Mesuré des deux côtés, sur exactement le même oubli** : retirer un module de la liste fait
**rougir** le filtre corrigé et laisse **VERT** le filtre d'origine.

⚠️ Monter les neuf graphes a demandé d'ajouter `ClsModule` et `CommonModule` — `@Global()` et
déclarés par `AppModule`, ils font partie de l'**environnement réel** de chaque module — et de
servir au double de configuration les valeurs de développement de `.env.example`, sans quoi
`JwtStrategy` échouait au `super()` pour une raison de **fixture**, pas de graphe.

### Sept mutations de plus, toutes rouges

| # | Mutation | Test qui rougit |
|---|---|---|
| M21 | `‖` remplacé par `&&` dans la garde de monnaie unique | 2 |
| M22 | `Number.isSafeInteger` remplacé par `Number.isFinite` | 2 |
| M23 | groupement par `(type, exercice)` rétabli | 2 |
| M24 | tri sans la date | 1 |
| M25 | arrêté futur toléré d'un jour | 1 |
| M26 | `methode` retombée à la borne de 200 | 1 **e2e** |
| M27 | la garde d'exhaustivité se refiltre elle-même | 1 (avec un module retiré) |

⚠️ **M27 a d'abord survécu — et ce n'était pas un trou de test.** La mutation est **équivalente**
tant que la liste est complète : elle ne devient un défaut qu'au moment où un module est ajouté
sans l'être à la liste. ⇒ **Analyser POURQUOI une mutation survit** avant de conclure (leçon
STORY-516). La mutation décisive n'était pas « casser le filtre », c'était « **oublier un
module** ».

### ④bis Vérification docker REJOUÉE sur l'état final

Les correctifs touchent l'agrégation déjà vérifiée : la mesure est refaite sur un **dossier neuf**,
à deux exercices ouverts et à monnaie unique.

| Vérification | Avant | Après |
|---|---|---|
| le même type sur **deux exercices** | `22 500 000` (deux lignes) | **`12 500 000`** (une ligne, exercice 2026) |
| un type **non réévalué** depuis 2025 | — | **reste en vigueur**, avec son propre exercice |
| `totalPartDesReassureurs` | `5 000 000` | **`3 000 000`** — la part 2025 n'est plus comptée deux fois |
| **AC-3** toujours vrai — arrêté au 31/12/2025 | — | `10 500 000` : la réévaluation de mars 2026 **n'est pas consommée** |
| deux monnaies dans une catégorie | total faux publié | **`409 DEVISES_HETEROGENES_DANS_LES_PROVISIONS`** |
| arrêté au 31/12/2099 | `200` | **`400 DATE_ARRETE_PROVISIONS_FUTURE`** |
| `gnf`, `GN`, `GNFX`, `francs guinéens` | `201` | **`400`** sur les quatre |
| plans d'exécution | — | lecture bornée **et** agrégation servies par index, `docsExamined == nReturned`, **aucun `COLLSCAN`** |

## Notes

- Voir [[STORY-513]] (le contrat, qui porte la catégorie et la monnaie), [[STORY-514]] (la provision
  pour risques en cours, **calculée** — et le registre coexiste avec elle, D-517-9),
  [[STORY-515]] et [[STORY-516]] (les sinistres et leur état), [[STORY-518]] (les variations au CR),
  [[STORY-519]] (ce qui se calcule), [[STORY-520]] (la réassurance à la cession),
  [[STORY-441]] (le patron de résolution d'identité, non repris ici), spine AD-2, AD-3, AD-4, AD-12.
- Sources officielles : *Code CIMA*, art. **334** (« sans déduction des réassurances cédées »),
  **334-2** (provisions techniques vie et capitalisation, **cinq** postes depuis 2018), **334-8**
  (autres opérations, **neuf** postes depuis 2016), **334-11** (réassurance — le verrou
  anti-compensation), **334-14** (risque d'exigibilité), **431** (plan comptable : `31`-`38` au
  passif, `39` à l'actif).
  https://cima-afrique.org/wp-content/code-cima/fr/Article334-8Provisionstechniques.html
