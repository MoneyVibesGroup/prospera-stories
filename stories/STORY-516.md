# STORY-516 : Les cadences de règlement — la matière première de la PSAP, et rien d'autre ne la produit

Status: in_progress

**Complexité :** high

**Épic :** EPIC-130 — Sinistres et règlements
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-515** (les quatre dates, les deux chaînes d'évaluations, et les exercices
de survenance / d'opération **persistés**)
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

Une **cadence de règlement** dit, par exercice de survenance, comment les paiements se répartissent
dans le temps : tant la première année, tant la deuxième, tant la troisième. C'est la matière à
partir de laquelle une provision pour sinistres à payer se calcule — et **aucune autre donnée ne la
remplace**.

⚡ **C'est la raison pour laquelle cette story est au palier 1 alors que la PSAP est au palier 2.**
La cadence se **constitue par accumulation** : elle demande plusieurs exercices d'historique. Si le
module ne la collecte pas dès le premier jour, le palier 2 devra attendre trois ans **après** son
développement pour être utilisable.

⇒ **Collecter maintenant ce dont on aura besoin plus tard est ici une décision d'architecture, pas
une anticipation gratuite.**

## Cadrage mesuré avant de coder (2026-09-21)

⛔⛔ **Le Code CIMA a été dépouillé, et il déplace la story sur son NOM comme sur sa forme.** Le
dépouillement a été relu sur la source officielle (`cima-afrique.org`, art. 422 et circulaire
CRCA 00230/2005) **et** sur le Code intégral (361 p., texte extrait localement, 19 972 lignes).

### M1 — ⚡⚡ « Cadence de règlement » n'existe pas dans le Code CIMA. Zéro occurrence.

Mesuré : `cadence` rend **0 occurrence** sur le Code intégral. Le mot n'apparaît que dans les
**circulaires CRCA annexées**, et il y désigne autre chose :

> **Circulaire n° 00230/CIMA/CRCA/PDT/2005** — « […] la Commission a décidé de retenir **la méthode
> de la cadence des déclarations des tardifs**. Cette méthode repose sur la construction de cadences
> de déclarations tardives à partir des données **du tableau C de l'état C10b** du code des
> assurances. »

⇒ La seule « cadence » que le régulateur nomme est une cadence de **DÉCLARATION**, pas de
**règlement**, et elle sert à estimer les **tardifs** — un calcul du palier 2 (STORY-519), pas celui
de cette story. ⚠️ Le mot « règlement » n'est **jamais** accolé à « cadence » dans le corpus.

### M2 — ⚡⚡ Ce que le régulateur publie, c'est un ÉTAT, et il a un nom : C10b

> **Art. 422** — « **C10b Paiements et provisions pour sinistres, par exercice (assurances
> terrestres)** ; **C10c Paiements et provisions pour sinistre, par exercice (transport)** ».

Et l'état modèle en donne la **structure exacte** — c'est le triangle que l'AC-1 décrit, en plus
précis :

> **ÉTAT C10 b — SINISTRES ET PROVISIONS POUR SINISTRES A PAYER**
>
> **C — NOMBRE DE SINISTRES PAYÉS OU A PAYER**, *Détail par exercice de survenance* :
> a) « Considérés comme **terminés** au 31 décembre précédent » · b) « **Réouverts** au cours de
> l'exercice (à déduire) » · c) « **Terminés** au cours de l'exercice » · d) « **Restant à payer** » ·
> « Dont **déclarés** au cours de l'exercice écoulé ». *(note 1)* « a − b − c de l'année précédente. »
>
> **D — SINISTRES, PAIEMENTS ET PROVISIONS**, *Détail par exercice de survenance, des opérations
> effectuées au cours de l'exercice écoulé* : « **Paiement de l'exercice (6020 et 6026)** » ·
> « Provision au 31 décembre » · « Provision au 31 décembre **précédent** ».
>
> **E — RECOURS ET SAUVETAGES**, *Montant, par exercice de survenance des sinistres, des recours et
> sauvetages **encaissés et prévus*** : « Recours encaissés pendant l'exercice (6029) » ·
> « **Estimation des recours restant à encaisser** » · « Report de l'estimation au 31 décembre
> précédent ».
>
> **F — COÛT MOYEN ET POURCENTAGES PAR EXERCICE**, *Détail par exercice **en cours de liquidation*** :
> paiements cumulés des exercices antérieurs · paiements de l'exercice · provision au 31 décembre ·
> cumul des recours encaissés · estimation des recours restant à encaisser · **charge nette de
> recours** · nombre de sinistres · **coût moyen net de recours** · primes acquises · rapport des
> sinistres nets de recours aux primes.
>
> Colonnes, dans tous les tableaux : `20… ET ANTÉRIEURS | 20… | 20… | 20… | 20… | EXERCICE INVENTORIÉ
> | TOTAL`.

⇒ **Le livrable porte le nom de l'état**, pas celui de l'énoncé (patron D-514-1 / STORY-503). La
story garde son titre — on ne réécrit pas un énoncé — mais le chemin d'URL, les DTO et le code
disent **« paiements et provisions par exercice de survenance »**, et publient le code `C10b`.

### M3 — ⚡ La colonne « ET ANTÉRIEURS » EST l'aveu d'incomplétude que l'AC-5 demande

L'AC-5 exige que le triangle « indique explicitement sa profondeur d'historique et son caractère
incomplet ». Le régulateur a tranché la même question : ses tableaux ouvrent sur une colonne
**« 20… ET ANTÉRIEURS »** qui agrège tout ce qui précède la fenêtre, et le tableau F ne détaille que
les exercices **« en cours de liquidation »**.

⇒ La profondeur n'est pas une métadonnée décorative : c'est une **colonne**, et ce qui déborde y est
**agrégé au lieu d'être perdu**. Un triangle qui tronquerait sans le dire ferait croire qu'un
exercice ancien n'a rien payé.

### M4 — ⛔ Le chargement de gestion est EXCLU de cet état

> « Les provisions pour sinistres à payer considérées aux états C10b s'entendent **chargement de
> gestion non compris**. »

⇒ Le module publie les **évaluations brutes** de STORY-515, sans y ajouter les 5 % de l'art. 334-13.
C'est cohérent avec D-515-8 : le chargement est un agrégat d'inventaire, pas un fait de dossier.

### M5 — ⛔⛔ L'axe « branche » de l'AC-2 n'existe nulle part dans ce dépôt

L'AC-2 demande un calcul « par catégorie Vie / Non-Vie **et par branche** ». La **branche** de
l'art. 328 — vingt-trois branches d'agrément — **n'est portée par aucun document de ce service** :
constat déjà mesuré et écrit en STORY-514, qui en a tiré la même conséquence.

⇒ Le triangle est calculé **par catégorie**, il le **publie comme tel**, et il nomme ce qui manque.
Livrer un axe « branche » à deux valeurs reviendrait à revendiquer exactement le total que
l'article interdit — l'erreur que la revue de STORY-514 a corrigée.

### M6 — ⚠️ Et il y a un SECOND état, pour les transports, que ce module ne peut pas distinguer

`C10c` couvre les transports, dont les sinistres se rattachent à l'**exercice de souscription** et
non de survenance (note 1 de l'état, et art. 415). Même cause que M5 : sans la branche, le module ne
sait pas reconnaître un contrat de transport. Il produit donc le **C10b** et le dit (D-515-7).

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-516-1** ⚡⚡ | Le livrable s'appelle **« paiements et provisions pour sinistres, par exercice de survenance »** (état **C10b**), jamais « cadence de règlement » | `cadence` : **0 occurrence** dans le Code. La seule cadence que le régulateur nomme est celle des **déclarations tardives**, et elle sert un calcul du palier 2. Publier un second nom pour un état que le régulateur nomme déjà se paierait à chaque contrôle (patron D-514-1) |
| **D-516-2** | Le triangle croise **exercice de survenance × exercice d'opération**, lus sur les champs **persistés** par STORY-515 | Aucune re-résolution à la lecture : c'est ce qui rend l'état **reproductible** (AC-3). Un exercice redécoupé après coup ne doit pas déplacer une ligne déjà publiée |
| **D-516-3** | La fenêtre porte une colonne **« antérieurs »** qui **agrège** ce qui déborde | C'est la forme du régulateur, et elle répond à l'AC-5 : la profondeur est une **donnée publiée**, et rien n'est tronqué en silence |
| **D-516-4** | ⛔ **Aucune extrapolation, aucun coût moyen, aucun rapport S/P** (AC-4, AD-12) | Le tableau F suppose les **primes acquises par sous-catégorie** — un croisement avec STORY-514 que cette story ne cadre pas. Et chain-ladder exige un actuaire (STORY-519) |
| **D-516-5** | **Lecture pure** : aucune collection, aucune écriture, aucun producteur Kafka | L'AC-1 le dit — « dérivé des événements de STORY-515, **jamais saisi** ». Un état stocké se périmerait dès le premier événement enregistré ensuite |
| **D-516-6** | Le calcul est **par catégorie**, et la **branche manquante est nommée** | M5 : la branche de l'art. 328 n'existe nulle part dans ce dépôt. Même conduite que STORY-514, validée en revue |
| **D-516-7** | Les provisions publiées sont **brutes de chargement** | Le texte de l'état C10b l'écrit en propre (M4) |

## Critères d'acceptation

- [ ] AC-1 — Un triangle de liquidation : par **exercice de survenance** × **exercice de règlement**,
      les montants payés et les évaluations restantes. Dérivé des événements de STORY-515, jamais
      saisi.
      ⚡ **C'est le tableau D de l'état C10b** (M2), en plus précis : « Paiement de l'exercice
      (`6020` et `6026`) » et « Provision au 31 décembre », *détail par exercice de survenance*.
- [ ] AC-2 — Le triangle est calculé **par catégorie Vie / Non-Vie** et par branche — agréger toutes
      branches confondues produit une cadence qui ne décrit aucun risque réel.
      ⚠️ **AJUSTÉ (M5, D-516-6)** : la **branche** de l'art. 328 n'existe **nulle part dans ce
      dépôt** — constat déjà mesuré en STORY-514. Le triangle est calculé **par catégorie**, il le
      **publie comme tel**, et il **nomme** ce qui manque. Livrer un axe « branche » à deux valeurs
      revendiquerait exactement le total que l'article interdit.
- [ ] AC-3 — Le triangle porte sa **date d'arrêté** et se **rejoue à l'identique**.
      ⚡ Rendu possible par **D-515-4** : les deux exercices sont **persistés** par STORY-515, jamais
      re-résolus à la lecture.
- [ ] AC-4 — ⛔ **Aucune extrapolation, aucune méthode de projection dans cette story** (AD-12) : on
      restitue ce qui s'est passé. Chain-ladder et consorts sont du palier 2, et ils exigent un
      actuaire.
- [ ] AC-5 — Le triangle indique **explicitement sa profondeur d'historique** et son caractère
      incomplet. ⚠️ Une cadence sur un seul exercice n'est pas une cadence, et l'afficher comme telle
      inviterait à s'en servir.
      ⚡ **Le régulateur a tranché la même question (M3)** : ses tableaux ouvrent sur une colonne
      **« … ET ANTÉRIEURS »** qui **agrège** ce qui déborde de la fenêtre, au lieu de le perdre.

## Périmètre

### Livré

- L'état **C10b**, tableaux **C**, **D** et **E**, par **exercice de survenance** :
  - **D** — les **paiements** de chaque exercice d'opération (principal + frais accessoires) et la
    **provision** en vigueur à la date d'arrêté ;
  - **E** — les **recours et sauvetages encaissés**, et l'**estimation des recours restant à
    encaisser** (la chaîne `SOMMES_A_RECOUVRER` de STORY-515) ;
  - **C** — les **nombres** de dossiers : terminés, réouverts, restant à payer.
- La colonne **« antérieurs »**, qui agrège ce qui déborde de la fenêtre publiée.
- La **profondeur d'historique** et le caractère **incomplet**, publiés en propre.
- ⚡ **Lecture pure** : aucune collection, aucune écriture, aucun événement Kafka.

### Hors périmètre

- ⛔ **Le tableau A** (primes acquises à l'exercice) → **STORY-514**, qui le calcule déjà.
- ⛔ **Le tableau F** (coût moyen, rapport sinistres / primes) : il suppose les **primes acquises par
  sous-catégorie**, un croisement que cette story ne cadre pas.
- ⛔ **L'état C10c** (transports, rattachement à l'exercice de **souscription**) — M6 : la branche
  n'existe pas dans ce dépôt.
- ⛔ **Toute extrapolation** — tardifs, chain-ladder, coût moyen projeté → **STORY-519**.
- ⛔ **Le chargement de gestion de 5 %** (art. 334-13) : le texte de l'état l'**exclut** en propre.
- ⛔ **Tout numéro de compte et tout poste de liasse** (D-513-1).

## Progress Tracking

**Statut : `in_progress`** — cadrage réglementaire mesuré le 2026-09-21, sur la source officielle
(`cima-afrique.org` art. 422 et circulaire CRCA n° 00230/2005) **et** sur le Code intégral (361 p.,
texte extrait localement : `cadence` → **0 occurrence**, et l'état modèle C10b lu tableau par
tableau).

Branches créées **avant** la première ligne de code :

```
docs               MNV-516
assurance-service  MNV-516
```

- **2026-09-21 — cadrage mesuré, et il déplace le NOM du livrable.** `cadence` rend **zéro
  occurrence** sur le Code intégral ; le mot n'apparaît que dans les circulaires annexées, où il
  désigne les **déclarations tardives**. Ce que le régulateur publie est l'**état C10b** (art. 422),
  dont le **tableau D** est exactement le triangle de l'AC-1. Sept décisions : D-516-1 à D-516-7.
- **2026-09-21 — développement.** Un module de **lecture pure** : aucune collection, aucune
  écriture, aucun producteur Kafka. L'agrégation est faite de **fonctions pures** — ni état, ni
  horloge — et l'horloge n'intervient qu'une fois, pour refuser un arrêté **futur**.
- **2026-09-21 — passe de mutation : 10 mutations, 9 rouges du premier coup, ⛔ 1 TROU.**
  « un événement orphelin de sa catégorie est ignoré » restait **vert** sous une mutation qui
  supprimait la garde. ⚠️ **La mutation était ÉQUIVALENTE dans le cas testé, pas inoffensive** :
  sans ligne « antérieurs », un cumul orphelin est perdu de toute façon, puisque le résultat se
  construit à partir des **lignes** et non des cumuls. Elle change tout dès que la fenêtre est
  dépassée : l'événement d'une **autre catégorie** se déverse alors dans « antérieurs », et le total
  d'un compte technique est gonflé par la sinistralité de l'autre — alors que leur étanchéité est
  **réglementaire** (AD-3). ⇒ Test manquant écrit, combinant les deux conditions. Leçon STORY-511 :
  « une mutation qui survit n'est pas toujours un trou de test — vérifier laquelle des deux ».
- **2026-09-21 — ⚡⚡ vérification docker : l'AC-3 prouvé par DEUX arrêtés sur le MÊME dossier.**
  Sur les données réelles de STORY-515 (sinistre survenu le 28/12/2025, déclaré le 15/01/2026) :

  | Arrêté | Ce que l'état publie |
  |---|---|
  | **2026-09-21** | ligne **survenance 2025** × colonne **opération 2026** — le triangle ; paiements `3 000 000 + 125 000` (le règlement du 10/09) ; ⛔ `recoursEncaisses: 0` — **le recours du 01/10 est postérieur** ; provision `4 500 000` et recours à encaisser `800 000` **côte à côte** |
  | **2026-06-01** | provision **`3 800 000`** — la **première** évaluation (31/03), **pas** la révision du 30/06 |

  ⇒ **La tête de chaîne est bien « la dernière version ANTÉRIEURE à l'arrêté »**, jamais la dernière
  tout court. Et la garde d'arrêté futur a rendu `400` sur un arrêté au 31/12/2026 — nous étions le
  21/09.
  - **Étanchéité vérifiée** : l'état `VIE` rend **zéro ligne** là où `NON_VIE` en rend une.
  - **Requête sans catégorie : `400`** — jamais d'état toutes catégories confondues.
  - ⛔ **Aucune écriture** : 13 collections, **aucune** créée par l'état, `outbox_events` à **0**, et
    le registre de STORY-515 **inchangé** (1 sinistre, 6 événements).
- **2026-09-21 — portes de qualité :** lint **0 warning**, build OK, **1 509 unit + 93 e2e verts**,
  couverture **99,55 / 93,70 / 99,16 / 99,62** (seuils 65/90/90/90), module `etat-sinistres` à
  **100 %** lignes et fonctions.

## Notes

- Voir [[STORY-515]] (qui pose la matière : exercice de **survenance** sur le dossier, exercice
  d'**opération** sur chaque événement), [[STORY-517]], [[STORY-519]] (ce qui se calcule, et à quelle
  condition), spine AD-12.
- Sources officielles : *Code CIMA*, art. **422** (liste des états — « C10b Paiements et provisions
  pour sinistres, par exercice (assurances terrestres) »), l'**état modèle C10b** (tableaux A à F),
  et la **circulaire CRCA n° 00230/CIMA/CRCA/PDT/2005** (la seule « cadence » du corpus : celle des
  **déclarations tardives**).
  https://cima-afrique.org/wp-content/code-cima/fr/Article422Etatscomptables.html
