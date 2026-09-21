# STORY-515 : Sinistres — déclaration, évaluation, règlement, recours et sauvetages

Status: done

**Complexité :** high

**Épic :** EPIC-130 — Sinistres et règlements
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-513** (le contrat, qui porte la catégorie et la monnaie)
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

Le sinistre est l'autre moitié du cycle inversé : il **survient**, il est **déclaré**, il est
**évalué**, il est **réglé** — quatre dates, souvent quatre exercices différents.

⚠️ **La date qui compte comptablement est celle de la SURVENANCE, pas celle du règlement.** Un
sinistre survenu en 2025 et payé en 2027 est une charge de **2025**. C'est précisément ce qui rend
la PSAP nécessaire (STORY-517), et c'est ce que le plan CIMA packagé ne sait pas encore exprimer :
`RC1` mappe le compte `60` — les **prestations payées**.

## Cadrage mesuré avant de coder (2026-09-21)

⛔⛔ **Le Code CIMA a été dépouillé, et il ne contredit pas l'énoncé : il le PRÉCISE, et il
l'AUGMENTE sur deux points structurants.** Toutes les citations ci-dessous ont été relues sur la
source officielle `cima-afrique.org` (une page HTML par article) **et** sur l'édition intégrale du
Code (361 p., texte extrait localement) — pas sur un résumé.

### M1 — ⚡⚡ L'article 415 EST cette story, et il énumère ce qu'un registre de sinistres doit porter

> **Art. 415 — Enregistrement des sinistres** — « Sauf pour les opérations d'assurance **maladie** et
> **marchandises transportées**, les événements, les sinistres faisant jouer ou susceptibles de faire
> jouer au moins une des garanties prévues au contrat, ou les sorties sont enregistrés **dès qu'ils
> sont connus** sous un numérotage continu pouvant comprendre plusieurs séries. **Cet enregistrement
> est effectué par exercice de survenance ou, en transports, par exercice de souscription.** Il
> comporte les renseignements suivants : date et numéro de l'enregistrement, numéro de police, nom de
> l'assuré, **date de l'événement**. […]
>
> Par ailleurs, les informations suivantes doivent être portées sur un document pouvant être
> facilement consulté : numéro de l'enregistrement, numéro de la police […], nom de l'assuré, **date
> de survenance de l'événement**, catégories ou sous-catégories de la garantie ou des garanties mises
> en jeu, **nature de l'événement ou du sinistre** ou motif de la sortie, désignation des victimes,
> bénéficiaires ou adversaires, **monnaie dans laquelle est libellé le contrat**, **première
> estimation et, sauf dans le cas où la société est réglementairement dispensée de la méthode dossier
> par dossier, évaluations successives des sommes à payer**, mention des réclamations en justice,
> **date et montant des paiements effectués (les sommes payées étant ventilées en principal et en
> frais accessoires)**, **date et montant des recours et sauvetages perçus, évaluations successives
> des sommes à recouvrer**. »

⇒ Le module **transcrit** cet article. Il n'invente aucun champ, et il n'en retranche aucun de ceux
qui relèvent de la comptabilité (la désignation des victimes et les réclamations en justice relèvent
de la **gestion**, que l'AC-6 exclut).

### M2 — ⚡⚡ Il y a DEUX chaînes d'évaluations successives, pas une

L'art. 415 en exige **deux**, et l'art. 334-12 dit pourquoi :

> **Art. 334-12** — « La provision pour sinistres à payer doit toujours être calculée pour son
> **montant brut, sans tenir compte des recours à exercer** ; **les recours à recevoir font l'objet
> d'une évaluation distincte**. »

⇒ « évaluations successives des **sommes à payer** » et « évaluations successives des **sommes à
recouvrer** » sont **deux suites versionnées**, que le texte interdit de compenser. L'AC-2 n'en
prévoyait qu'une : le livrable en porte **deux**, discriminées par leur nature, et la compensation
devient **structurellement impossible** — il n'y a pas un champ où elle pourrait s'écrire.

⚠️ **Et cela ne contredit pas l'AC-3.** L'atténuation existe bel et bien, mais **au compte
d'exploitation**, pas dans la provision : l'état C1 porte « **A déduire : recours (6029)** » au débit,
et le bilan « **Moins : prévisions de recours à encaisser (3259)** ». Atténuation de la **charge**,
jamais déduction de la **provision** — deux endroits, deux règles, et les confondre sous-provisionne.

### M3 — ⚡⚡ Un paiement se ventile en PRINCIPAL et en FRAIS ACCESSOIRES

L'art. 415 l'écrit (« les sommes payées étant ventilées en principal et en frais accessoires »), le
plan comptable leur donne **deux comptes** (`6020` « Sinistres en principal » et `6026` « Frais
accessoires »), et l'état C10b les additionne explicitement : « **Paiement de l'exercice (6020 et
6026)** ».

⇒ Un champ `montant` unique aurait perdu une ventilation que le texte exige **et** que l'état
réglementaire additionne — irrattrapable après coup, comme l'était la période couverte de
STORY-513 pour STORY-514.

### M4 — L'évaluation dossier par dossier est IMPOSÉE, et le chargement de gestion a un plancher

> **Art. 334-12** — « La provision pour sinistres à payer est calculée **exercice par exercice**. Sans
> préjudice de l'application des règles spécifiques à certaines branches prévues à la présente
> section, **l'évaluation des sinistres connus est effectuée dossier par dossier**, le coût d'un
> dossier comprenant **toutes les charges externes individualisables** ; elle est **augmentée d'une
> estimation du coût des sinistres survenus mais non déclarés**. […] Par dérogation […] l'entreprise
> peut, **avec l'accord de la Commission de Contrôle des Assurances**, utiliser des **méthodes
> statistiques** pour l'estimation des sinistres survenus au cours des **deux derniers exercices**. »

> **Art. 334-13 — Chargement de gestion** — « La provision pour sinistres à payer calculée conformément
> à l'article 334-12 est complétée, **à titre de chargement, par une évaluation des charges de
> gestion** qui […] **ne peut être inférieure à 5 %**. »

⇒ **Le « dossier par dossier » est le mode d'emploi de cette story** : c'est lui qui fait de
l'évaluation un fait **par sinistre**, et non un chiffre global. ⛔ **Les tardifs et le chargement de
5 % ne sont PAS livrés ici** : ce sont des **agrégats** d'inventaire, qui relèvent de STORY-517 (le
registre des provisions) et de STORY-519 (ce qu'on calcule). Ce module fournit leur matière.

### M5 — ⛔ Le mot « sauvetage » n'a AUCUN compte au plan comptable CIMA

Mesuré sur la liste de l'art. 431 : les comptes sont `6029` « **Recours en principal** » et `3259`
« **Prévisions de recours à encaisser** ». **Aucun compte ne porte le mot « sauvetage ».** Le texte
les nomme pourtant, toujours **accolés aux recours et traités en parallèle** :

> **Art. 416** — « **Les recours ou sauvetages donnent lieu à un traitement parallèle.** »
> **État C10b, tableau E** — « **RECOURS ET SAUVETAGES** — Montant, par exercice de survenance des
> sinistres, des recours et sauvetages **encaissés et prévus** ».

⇒ Le registre garde les **deux natures distinctes** (l'AC-3 l'exige, et l'art. 415 les nomme toutes
deux), et la story **dit** que le plan comptable les agrège : c'est l'adaptateur de balance (AD-5) qui
tranchera l'imputation, pas ce module (D-513-1).

### M6 — ⚠️ Le rattachement à la survenance n'est PAS universel, et le module ne peut pas le savoir

L'art. 415 exclut « maladie et marchandises transportées », et les transports se rattachent à
l'**exercice de souscription** — le Code leur consacre un état séparé (`C10c`, « transport »), là où
le `C10b` couvre les « assurances terrestres ». Note 1 de l'état C10c : « Pour les sous-catégories
pour lesquelles **les sinistres sont rattachés à l'exercice de souscription**. »

⛔ **Ce module ne peut pas distinguer les deux**, parce que la **branche** de l'art. 328 n'existe
**nulle part dans ce dépôt** — constat déjà mesuré et écrit en STORY-514 : `contrats` ne porte que la
**catégorie** Vie / Non-Vie, et aucun événement ni référentiel ne publie la branche d'agrément.

⇒ Le module rattache à la **survenance**, **le publie comme tel**, et nomme l'exception. Il ne
prétend pas couvrir les transports ni la maladie. *On ne livre pas une règle fausse pour couvrir un
cas qu'on ne sait pas reconnaître.*

### M7 — La réouverture : le Code la prévoit, mais dans un ÉTAT, jamais dans un article

Aucun article — 334-12, 415, 416 compris — ne mentionne la réouverture d'un sinistre. Elle n'existe
que dans l'état modèle, et sa mécanique y est entièrement décrite :

> **État C10b, tableau C — NOMBRE DE SINISTRES PAYÉS OU A PAYER**, *Détail par exercice de survenance*
> a) « **Considérés comme terminés** au 31 décembre précédent » · b) « **Réouverts au cours de
> l'exercice (à déduire)** » · c) « **Terminés au cours de l'exercice** » · d) « **Restant à payer** »
> *(note 1)* « **a − b − c de l'année précédente.** »

⇒ Un sinistre réouvert **sort du stock des terminés et réintègre les restant à payer de son exercice
de survenance d'origine** : il ne crée **pas** un sinistre neuf sur l'exercice de réouverture. C'est
exactement ce que l'AC-5 demande, et le texte en donne la formule.

⚠️ **Le vocabulaire du régulateur est « terminé », pas « clos »** — et il y a une seconde raison de le
suivre : dans un service où « clos » qualifie déjà un **exercice** (`EXERCICE_CLOS`, verrou d'écriture
d'AD-7), appeler « clôture » la fin d'un dossier de sinistre créerait une ambiguïté dans les messages
de refus, les journaux et le contrat HTTP.

### M8 — Deux coquilles du plan comptable, relevées au passage — pour STORY-671

Sans incidence ici (aucun numéro de compte n'est écrit dans ce module, D-513-1), mais elles piègeront
la transcription des 1 052 comptes :

- l'art. 431 imprime « **6126.** Frais accessoires » sous le compte `60`, alors que le commentaire du
  plan (« …sont comptabilisés au **compte 6026** ») et **tous** les états modèles disent `6026`. Un
  référentiel qui recopie littéralement l'article créera un `6126` orphelin en classe 6 — où `61` est
  « frais de personnel » — et **aucun** `6026`, alors que tous les états y renvoient ;
- l'art. 431 imprime « **6029.** Taxe sur les excédents de provisions pour sinistres » sous le compte
  `620`, en collision avec `6029` « Recours en principal ». Lire `6209`.

## Décisions de cadrage du 2026-09-21 — à relire en revue

| # | Décision | Pourquoi |
|---|---|---|
| **D-515-1** ⚡⚡ | **Deux chaînes d'évaluations versionnées**, discriminées par leur nature : `SOMMES_A_PAYER` et `SOMMES_A_RECOUVRER` | Art. 415 (« évaluations successives des sommes **à payer** » / « **à recouvrer** ») et art. 334-12 (« la PSAP est calculée pour son montant **brut**, sans tenir compte des recours ; les recours à recevoir font l'objet d'une **évaluation distincte** »). Deux chaînes rendent la compensation **structurellement impossible** : il n'existe aucun champ où elle pourrait s'écrire |
| **D-515-2** ⚡⚡ | Un règlement porte **`principal` ET `fraisAccessoires`**, jamais un montant unique | Art. 415 : « les sommes payées étant **ventilées en principal et en frais accessoires** ». Comptes `6020` et `6026`, que l'état C10b **additionne** (« Paiement de l'exercice (6020 et 6026) »). Un champ unique perdrait une ventilation exigée par le texte, et rien ne la reconstituerait |
| **D-515-3** | Le vocabulaire de la fin d'un dossier est **`TERMINE`**, jamais « clos » | Le régulateur dit « considérés comme **terminés** » / « **Terminés** au cours de l'exercice » (C10b, tableau C). Et « clos » est **déjà pris** dans ce service par le verrou d'exercice (`EXERCICE_CLOS`, AD-7) : le réutiliser rendrait deux refus indiscernables dans les journaux |
| **D-515-4** ⛔⛔ | Le sinistre porte les bornes de son **exercice de survenance**, chaque mouvement celles de **l'exercice de l'opération** | C'est la matière de **STORY-516** : lignes (survenance) × colonnes (exercice de l'opération) de l'état C10b. Les re-résoudre à la lecture rendrait l'état non reproductible et le ferait changer au premier exercice redécoupé. Même leçon que `periodeDebut/Fin` de STORY-513 pour STORY-514 : **irrattrapable** après coup |
| **D-515-5** | L'exercice de **survenance** peut être **CLOS** ; c'est celui de **l'opération** qui doit être ouvert | Un sinistre survenu en 2025 et déclaré en 2026 est la situation **normale** — c'est même ce qui rend la PSAP nécessaire. Exiger un exercice de survenance ouvert refuserait la déclaration tardive, c'est-à-dire le cas que ce module existe pour enregistrer. ⚠️ Un exercice **introuvable** reste un refus, jamais un « ouvert » (AD-7) |
| **D-515-6** | **Recours et sauvetages restent deux natures distinctes** dans le registre, et la story **dit** que le plan les agrège | L'art. 415 les nomme tous deux, l'art. 416 les traite « en parallèle », l'état C10b les regroupe — mais **aucun compte ne porte le mot « sauvetage »** (`6029` = « Recours en principal »). Les fusionner ici détruirait une distinction que le texte fait ; prétendre qu'elle est comptable serait faux (D-513-1 : l'imputation appartient à AD-5) |
| **D-515-7** | Le **rattachement est à la survenance**, l'exception transports / maladie est **nommée et non couverte** | L'art. 415 l'exclut explicitement, et la **branche** de l'art. 328 n'existe nulle part dans ce dépôt (constat mesuré en STORY-514). Le module ne peut pas reconnaître un contrat de transport ; il rattache à la survenance et le publie. On ne livre pas une règle fausse pour un cas qu'on ne sait pas distinguer |
| **D-515-8** | ⛔ **Ni tardifs, ni chargement de 5 %, ni provision agrégée** | Art. 334-12 (tardifs, sur circulaire CCA) et 334-13 (chargement ≥ 5 %) portent sur un **agrégat d'inventaire**, pas sur un dossier. AD-12 interdit d'inventer le calcul, et STORY-517 / STORY-519 en sont propriétaires. Ce module **fournit la matière**, dossier par dossier, comme l'art. 334-12 l'impose |
| **D-515-9** | ⛔ **Aucun numéro de compte, aucun poste de liasse, aucun producteur Kafka** | D-513-1. `RC1` mappe la racine `60` et le plan packagé s'arrête à deux chiffres : ni `6020`/`6026`/`6029` ni `3250`/`3259` ne sont routables avant **STORY-671**. L'outbox reste inerte : aucun AC ne demande d'événement inter-services, et STORY-516 lit ces données **dans le même service** |
| **D-515-10** ⚡⚡ | Le **sinistre est l'agrégat**, et il porte un **verrou logique** (`sinistres.revision`) incrémenté en **première écriture** de toute transaction | Patron `contrats.revision` (STORY-513). Sans lui, deux terminaisons concurrentes lisent toutes deux « en cours » et passent toutes deux : le dossier serait compté **deux fois** terminé au tableau C de l'état C10b, et la ligne `a − b − c` deviendrait fausse pour toujours sur une collection append-only |
| **D-515-11** | **Deux collections d'événements**, pas une : `evaluations_sinistre` (chaînée) et `evenements_sinistre` (plate) | L'index unique de succession indexe la clé `null` de **chaque** document sans prédécesseur. Sur une collection commune, le premier règlement entrerait en collision avec la racine des évaluations — leçon STORY-501 (« un index unique sur un champ absent indexe `null` »). Argument mesuré, pas une préférence de rangement |
| **D-515-12** | L'**état** (`EN_COURS`/`TERMINE`) se dérive d'un **COMPTE**, jamais d'un tri : `TERMINE` ssi `nbTerminaisons > nbRéouvertures` | Compter est **commutatif** : l'état ne dépend donc d'aucun ordre de lecture. Un tri sur `_id` désignerait un « dernier » événement arbitraire — `_id` est généré avant la transaction, réutilisé à chaque rejeu, et sa partie aléatoire est fixe par processus (constat de revue de sécurité de STORY-514) |

## Critères d'acceptation

- [x] AC-1 — Un sinistre porte **quatre dates distinctes** : survenance, déclaration, évaluation,
      règlement. Aucune n'est déduite d'une autre.
      ⚡ **Précisé par le texte (M1)** : deux de ces dates vivent sur le dossier (survenance,
      déclaration), deux sont portées par des **événements** (chaque évaluation a sa date, chaque
      règlement la sienne) — un sinistre a **zéro, une ou dix** dates de règlement, et un champ
      unique aurait imposé d'en écraser neuf.
- [x] AC-2 — L'**évaluation** du sinistre (l'estimation de ce qu'il coûtera) est un **événement
      daté et versionné** : elle change dans le temps, et chaque révision est conservée. Écraser
      l'évaluation précédente effacerait la matière de la cadence (STORY-516).
      ⚡⚡ **Augmenté par le texte (M2, D-515-1)** : il y a **deux** suites d'évaluations
      successives — les **sommes à payer** et les **sommes à recouvrer** —, et le Code interdit de
      les compenser.
- [x] AC-3 — Les **recours** (contre un tiers responsable) et les **sauvetages** (récupération d'un
      bien) sont tenus **séparément** et viennent en **atténuation** de la charge de sinistre —
      jamais en produit.
      ⚡ **Précisé (M2, M5)** : l'atténuation est celle de la **charge** (état C1 : « A déduire :
      recours (6029) »), **jamais** une déduction de la **provision**, que l'art. 334-12 exige
      **brute**. Et « sauvetage » n'a **aucun compte** au plan CIMA : la distinction est tenue dans
      le registre, l'imputation appartient à AD-5.
- [x] AC-4 — Un sinistre est rattaché à son **contrat** et donc à sa **catégorie Vie / Non-Vie**
      (AD-3) : la ventilation ne se reconstitue pas après coup.
- [x] AC-5 — Un sinistre **rouvert** après clôture est exprimable et tracé. C'est un cas courant, et
      un modèle qui ne le prévoit pas force à créer un second sinistre — ce qui fausse tous les
      comptages.
      ⚡ **Confirmé par le texte (M7)**, qui en donne la formule : `a − b − c de l'année précédente`.
      Le dossier réouvert réintègre les « restant à payer » de son exercice de survenance
      **d'origine**. ⚠️ Vocabulaire du régulateur : **terminé**, pas « clos » (D-515-3).
- [x] AC-6 — ⚠️ Périmètre : ce module **enregistre** un sinistre, il ne le **gère** pas (pas
      d'expertise, pas de workflow de gestion) — Q1 de la spine.

## Périmètre

### Livré

- L'agrégat **sinistre** : contrat, catégorie **recopiée** (AD-3), référence unique par dossier,
  **nature de l'événement** (art. 415), dates de **survenance** et de **déclaration**, bornes de
  l'**exercice de survenance** (D-515-4), monnaie du contrat, auteur — et un **verrou logique**
  qui sérialise ses écritures concurrentes.
- **Deux chaînes d'évaluations versionnées** (D-515-1), append-only et chaînées par rang :
  `SOMMES_A_PAYER` et `SOMMES_A_RECOUVRER`. Une révision est une **nouvelle évaluation**.
- Les **mouvements** append-only : `REGLEMENT` (ventilé en **principal** et **frais accessoires**,
  D-515-2), `RECOURS` et `SAUVETAGE` encaissés, `TERMINAISON` et `REOUVERTURE`.
- L'**état dérivé** du dossier (`EN_COURS` / `TERMINE`) et sa **situation** : évaluation en vigueur
  des deux natures, cumuls réglés, recours et sauvetages encaissés, **charge nette de recours** —
  tous recalculés à la lecture, **aucun état stocké**.
- L'**effet économique typé** de chaque événement (patron STORY-513) : un règlement **augmente** la
  charge, un recours et un sauvetage la **diminuent**, et **aucun des trois ne touche un produit**.

### Hors périmètre

- ⛔ **L'estimation des sinistres survenus mais non déclarés** (art. 334-12, sur circulaire CCA) et
  le **chargement de gestion de 5 %** (art. 334-13) : ce sont des **agrégats d'inventaire**, pas des
  faits de dossier → STORY-517 les héberge, STORY-519 dit ce qui se calcule.
- ⛔ **Le triangle par exercice de survenance × exercice de règlement** → **STORY-516**. Cette story
  en **pose la matière** (D-515-4) et n'en publie aucun agrégat.
- ⛔ **La part des réassureurs** dans les sinistres et les recours (comptes `609`, `39251`, `39259`)
  → EPIC-132, STORY-520. Ce module enregistre le **brut**.
- ⛔ **Les transports et la maladie** (rattachement à l'exercice de souscription, état C10c) —
  D-515-7 : la branche de l'art. 328 n'existe nulle part dans ce dépôt.
- ⛔ **Tout élément de gestion** (AC-6) : expertise, victimes, adversaires, réclamations en justice,
  pièces, workflow. L'art. 415 les mentionne ; ils ne relèvent pas de la comptabilité.
- ⛔ **Tout numéro de compte et tout poste de liasse** (D-515-9, D-513-1) → adaptateur de balance
  (AD-5), après **STORY-671**.

## Progress Tracking

**Statut : `done`** — ouverte et clôturée le **2026-09-21**. Cadrage réglementaire mesuré (sources relues :
`cima-afrique.org` articles 334-2, 334-8, 334-12, 334-13, 415, 422 ; Code intégral 361 p. pour l'état
modèle C10b et le plan comptable de l'art. 431).

Branches créées **avant** la première ligne de code :

```
docs               MNV-515
assurance-service  MNV-515
```

- **2026-09-21 — cadrage mesuré, et il AUGMENTE la story.** L'article 415 **est** cette story : il
  énumère ce qu'un registre de sinistres doit porter. Deux de ses exigences n'étaient dans aucun
  critère d'acceptation — **deux chaînes d'évaluations successives** (sommes à payer / sommes à
  recouvrer, que l'art. 334-12 interdit de compenser) et un **paiement ventilé en principal et frais
  accessoires** (comptes `6020`/`6026`, que l'état C10b additionne). Trois autres constats déplacent
  le livrable : le vocabulaire du régulateur est **terminé**, jamais « clos » ; la réouverture
  n'existe dans **aucun article** mais l'état C10b en donne la formule (`a − b − c`) ; et le
  rattachement à la survenance **n'est pas universel** (l'art. 415 exclut maladie et transports, que
  ce dépôt ne sait pas reconnaître faute de porter la branche de l'art. 328). Neuf décisions :
  D-515-1 à D-515-9.
- **2026-09-21 — développement.** Trois collections (`sinistres`, `evaluations_sinistre`,
  `evenements_sinistre`), un **verrou logique** par dossier, l'effet économique **typé par
  composante**, l'état **dérivé d'un compte** (jamais d'un tri). ⚠️ Quatre codes de refus renommés
  pour rester **globalement uniques** — le dépôt l'exige et son test de non-doublon le tient.
- **2026-09-21 — ⚡ un trou de scan rebouché au passage.** Le motif qui vérifie qu'un repository
  append-only n'expose aucune réécriture **n'énumérait pas `findOneAndUpdate`** (hérité de STORY-513 /
  STORY-514). Inerte là où il était posé — aucun de ces repositories n'écrit —, mais il se présentait
  comme exhaustif : exactement le patron « une garde qui promet plus qu'elle ne tient » de STORY-512.
  Ici il **doit** tenir, puisque le verrou logique EST un `findOneAndUpdate`.
- **2026-09-21 — passe de mutation : 16 mutations, 15 rouges du premier coup, ⛔ 1 TROU.**
  « la tête de chaîne est lue par RANG décroissant » demandait la nature `SOMMES_A_PAYER` ; une
  mutation faisant **ignorer le paramètre** au profit d'un filtre en dur sur cette même valeur laissait
  **55 tests du service et 22 du repository au vert**. La fixture coïncidait avec la valeur mutée —
  le test ne mesurait plus le paramètre qu'il croyait mesurer (patron STORY-514, « un test qui ne
  diverge pas du naïf »). ⇒ Le test demande désormais la nature **non triviale**, et un second
  asserte la **différence** entre les deux appels.
- **2026-09-21 — ⚡⚡ vérification docker, avec un JETON RÉEL de l'IdP** (leçon STORY-511 : une vérif
  qui n'exerce que des routes publiques ne prouve rien).
  - **La chaîne d'accès est exercée** : inscription + connexion réelles, `aud` contrôlée
    (`assurance-service` y figure), et le premier appel rend **404 `DOSSIER_INTROUVABLE`** — pas
    401 : le JWT est **accepté** et la requête atteint la chaîne.
  - **Les 10 routes sont mappées**, `:sinistreId` en dernier, et les logs confirment que le code
    exécuté est celui de la branche (`Found 0 errors`, montage à chaud).
  - **Le cas canonique passe** : sinistre survenu le 28/12/2025 (exercice **CLOS**), déclaré le
    15/01/2026 (exercice ouvert) — bornes de survenance persistées `2025-01-01 → 2026-01-01`.
  - ⛔⛔ **Les DEUX chaînes coexistent** : `SOMMES_A_RECOUVRER` démarre au **rang 1** alors que
    `SOMMES_A_PAYER` est au rang 2, avec **deux racines `evaluationPrecedenteId: null`**. C'est la
    preuve que l'index unique de succession porte bien la **nature** — sans elle, la seconde racine
    aurait été refusée. ⚡ Et l'index **tient vraiment** : une seconde racine insérée directement en
    base est refusée en `E11000`.
  - ⚡⚡ **Atomicité prouvée par un COMPTEUR** (patron STORY-513) : `sinistres.revision` vaut
    **exactement 9** — les 9 écritures réussies sous verrou. Les **2 refus métier**
    (`SINISTRE_TERMINE`, `SINISTRE_DEJA_TERMINE`) ont **avorté leur transaction** : à 11, l'incrément
    d'un refus aurait survécu, donc rien n'aurait été atomique.
  - **Cycle de vie complet sur Mongo réel** : terminaison → règlement **refusé** → seconde
    terminaison **refusée** → réouverture → règlement **accepté**, sur le **même** dossier (aucun
    second sinistre créé, AC-5).
  - **Situation dérivée** : les deux évaluations publiées **côte à côte** (4 500 000 et 800 000), le
    net (3 700 000) **n'apparaît nulle part**, charge nette de recours `3 001 000 + 200 000 − 400 000
    − 50 000 = 2 751 000`.
  - **Aucun orphelin**, collections en snake_case explicite, **`outbox_events` à 0** (aucun
    producteur Kafka, D-515-9).
- **2026-09-21 — revue de code ⑥ : 2 bloquants, 6 non bloquants, TOUS TRAITÉS.**

  | # | Constat | Suite |
  |---|---|---|
  | 1 | ⛔⛔ La **borne d'événements** laisse passer l'événement de trop, puis **gèle le dossier définitivement** (= le constat de la revue de sécurité) | ✅ corrigé |
  | 2 | ⛔⛔ `reference` et `nature` **sans `@Transform`** : sous `enableImplicitConversion`, `nature: {a:1}` était **accepté** et persisté `"[object Object]"` — sur le champ que l'**art. 415 exige**, et qu'aucune route ne modifie. Effet miroir : `"  SIN-1  "` était **refusé** là où le cycle prime le rogne | ✅ corrigé |
  | 3 | Trois exports annonçaient des consommateurs **inexistants** (« la règle vit à un seul endroit », « les deux lisent cette liste ») | ✅ supprimés |
  | 4 | « Le DTO pose déjà la borne » : il ne la posait **pas** — `minimum`/`maximum` vivaient dans l'OpenAPI sans `@Min`/`@Max` | ✅ corrigé |
  | 5 | `terminaisons` / `reouvertures` publiaient `MONTANT_SINISTRE_INVALIDE`, **inatteignable** sur des routes sans montant | ✅ corrigé |
  | 6 | Cinq références à des décisions en **lettres** (brouillon), dont deux vers des décisions **absentes de la story** | ✅ alignées, et **D-515-10/11/12 ajoutées** (leçon STORY-511) |
  | 7 | « expose exactement **9** routes » pour dix, **sans assertion de compte** : l'intitulé ne pouvait pas rougir | ✅ corrigé |
  | 8 | Le tri `{nature: 1, rang: -1}` **n'est pas servi** par l'index (directions mixtes ⇒ `SORT` bloquant) alors que le commentaire l'affirmait | ✅ corrigé en `{nature: -1, rang: -1}` |

  ⚡ **Sur l'axe réglementaire : RIEN.** Le relecteur a relu les articles **en ligne** — art. 415,
  334-12, 334-13, état C10b — et les citations comme leur transcription sont fidèles.

- **2026-09-21 — revue de sécurité ⑦ : 1 constat ÉLEVÉ, corrigé.** ⛔⛔ **L'événement de trop murait
  le dossier pour toujours.** `exigerNombreDEvenements` servait **à la fois** la lecture et
  l'écriture avec un `>` strict, alors que le repository lit `limite + 1` : à 500 événements la
  lecture rendait 500, `500 > 500` était faux, et le **501ᵉ passait**. Dès lors, **toute** lecture
  rendait 501 et refusait — `GET /situation`, tous les `POST`. Les deux collections étant
  append-only, **aucune route ne défaisait l'état** : le chiffre réglementaire de l'état C10b
  devenait illisible **pour toujours**, sur une donnée comptable, atteignable par un `TENANT_USER`
  en six minutes sous le throttler. ⇒ **Deux seuils** : `>=` à l'écriture (refuse le document de
  trop), `>` en lecture (refuse un cumul calculé sur un ensemble tronqué, désormais inatteignable).
  ⚠️ **Et les trois tests existants figeaient le défaut** : ils montaient une doublure à `MAX + 1`,
  donc verts avec `>` comme avec `>=`. Le nouveau test exerce la **frontière** en trois assertions
  conjointes — à `MAX−1` l'écriture passe, à `MAX` elle est refusée, et à `MAX` **la situation répond
  encore**. Mutation « remettre `>` » : **rouge**.
- **2026-09-21 — ⚠️ la vérif docker a d'abord donné un FAUX VERT.** Après correctifs, le conteneur
  rendait encore l'**ancien** comportement (`nature: {a:1}` en 201) alors que le fichier monté
  portait bien le correctif : `nest --watch` n'avait pas recompilé. Leçon
  [[hot-reload-ment-verif-docker]], vérifiée une fois de plus. Après `restart` : `nature: {a:1}`
  → **400**, `"  SIN-2026-000222  "` → **201 persistée rognée**, `principal: -1` → **400** par le
  `@Min` du DTO. ⚡ Et la base gardait le `"[object Object]"` écrit **avant** le correctif —
  **irrécupérable par l'API**, ce qui est exactement la démonstration du constat.
- **2026-09-21 — portes finales :** lint **0 warning**, build OK, **1 444 unit + 79 e2e verts**,
  couverture **99,55 / 94,21 / 99,10 / 99,59** (seuils 65/90/90/90), **20 mutations** jouées.
- **2026-09-21 — clôture.** PR `assurance-service` **#5** (4 commits) rebase-mergée sur `dev`,
  branche supprimée. Les six critères d'acceptation sont tenus, et deux d'entre eux ont été
  **augmentés par le texte** : l'AC-2 porte désormais **deux** chaînes d'évaluations successives
  (art. 415 + 334-12), et l'AC-1 la **ventilation** principal / frais accessoires des paiements.

## Notes

- Voir [[STORY-513]] (le contrat, qui donne la catégorie et la monnaie), [[STORY-516]] (l'état C10b,
  dont cette story pose la matière : exercice de **survenance** sur le dossier, exercice
  d'**opération** sur chaque événement), [[STORY-517]] (les provisions techniques hébergées),
  [[STORY-519]] (les tardifs et le chargement de gestion, qui ne se calculent pas ici),
  [[STORY-520]] (la part des réassureurs), [[STORY-671]] (qui rendra `3250`/`3259` routables),
  spine AD-2, AD-3, AD-7, AD-12.
- Sources officielles : *Code CIMA*, art. **415** (enregistrement des sinistres — l'article que
  cette story transcrit), **416** (recours et sauvetages, « traitement parallèle »), **334-8 3°**
  (définition de la provision pour sinistres à payer), **334-12** (dossier par dossier, montant
  **brut**, recours en **évaluation distincte**), **334-13** (chargement ≥ 5 %), **422** et
  l'**état modèle C10b** (tableaux C, D, E, F), **431** (plan comptable).
  https://cima-afrique.org/wp-content/code-cima/fr/Article415Enregistrementdessinis.html
