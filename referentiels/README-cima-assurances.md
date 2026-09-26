# Référence CIMA-assurances (extraite du Code CIMA officiel)

**Source :** *Code des assurances CIMA — Livre IV « Règles comptables applicables aux organismes
d'assurance », Chapitre III : « Plan comptable particulier à l'assurance et à la capitalisation »*
(Conférence Interafricaine des Marchés d'Assurances). Dernière modification structurante : décision du
Conseil des Ministres du 2 avril 2008.

> 📋 **Dossier de validation** (STORY-540) : [`validation-cima/`](validation-cima/README.md) — l'artefact
> `@5.0` soumis octet pour octet, sa structure écrite en clair, les six questions reposées sur le texte
> et le registre des réserves.

> ⚠️ **Corrigé le 2026-09-11 (revue de code de STORY-491).** Ce README écrivait « Livre III, Titre IV,
> Chapitre III ». Sur cima-afrique.org, le Livre IV se divise directement en chapitres, le Chapitre III
> y est le plan comptable, et le Titre IV du Livre III s'intitule « Dispositions transitoires ».
> L'erreur a failli être scellée dans la `normeSource` de `cima-assurances@1.0`, servie par la route
> catalogue — une référence recopiée d'un README n'est pas une référence vérifiée.
> - Livre IV : https://cima-afrique.org/wp-content/code-cima/fr/LIVREIVREGLESCOMPTABLESAPPLICABL.html
> - Chapitre III : https://cima-afrique.org/wp-content/code-cima/fr/CHAPITREIIIPLANCOMPTABLEPARTICUL.html
- Liste des comptes (art. 431) : https://cima-afrique.org/wp-content/code-cima/fr/Article431Listedescomptes.html
- États modèles (art. 433) : https://cima-afrique.org/wp-content/code-cima/fr/Article433Etatsmodeles.html
- Terminologie / fonctionnement (art. 432) : https://cima-afrique.org/wp-content/code-cima/fr/Article432Terminologieexplicativ.html
- PDF consolidé : http://www.droit-afrique.com/upload/doc/cima/CIMA-Plan-comptable-assurances.pdf

> ⚠️ Le secteur **assurances est EXCLU du SYSCOHADA** (comme les banques/PCB et les SFD/RCSFD). Une
> entreprise d'assurance agréée CIMA tient sa comptabilité selon **ce** plan, pas selon SYSCOHADA.
> Codification (**art. 430**, verbatim) : classes **1 à 8 et 0** ; comptes principaux à 2 chiffres,
> divisionnaires à 3, sous-comptes à 4.

> ⚠️ **Corrigé le 2026-09-20 (STORY-512).** Cette ligne décrivait le **cadre** (art. 430) et laissait
> croire qu'elle décrivait la **liste**. Mesuré sur la page officielle de l'art. 431 : **1 052 comptes
> énumérés sur QUATRE niveaux** — 79 à 2 chiffres, 345 à 3, **499 à 4** et **129 à 5** (`01010`,
> `20480`, `69091`…). ⛔ **L'article 431 dépasse donc le cadre de l'article 430**, qui s'arrête aux
> sous-comptes à 4 chiffres et ne comporte **aucune clause d'ouverture** — contrairement au RCSFD
> BCEAO (« les autres chiffres décrivent de façon plus détaillée la nature des opérations »). La seule
> latitude du Code est nominative : « Ce compte [`08`] est subdivisé, **selon les besoins**… »
> (art. 432).
> ⛔⛔ **Et l'art. 432, classe 4, porte une CLAUSE D'OUVERTURE qui nomme SIX chiffres** — corrigé le
> 2026-09-20 par la revue de code de STORY-512, après que la première rédaction eut affirmé le
> contraire : « l'entreprise ouvre à cet effet les comptes 4002, 4003…, jusqu'à 4038 et 4039 ; **si le
> nombre des comptes ainsi disponible est insuffisant, il sera créé des comptes à cinq chiffres (de
> 40020 et 40021 à 40398 et 40399) ou à six chiffres.** […] Les comptes 404 à 408 fonctionnent de
> manière analogue. » La clause est plus explicite que celle du RCSFD — elle **énumère** les paliers.
> ⇒ `longueurCompteDetail` vaut **6** pour `cima-assurances` (STORY-512, D-512-1). Déclarer 4
> refuserait `20480`, déclarer 5 refuserait `400200` : deux comptes que le texte prévoit.
> ⛔ **6 est un plafond** : les 608 pages du Code consolidé 2019 ne portent que **trois** énoncés de
> profondeur, aucun au-delà de six, et l'**art. 412** ferme le reste (« …doivent utiliser les
> sous-comptes définis au chapitre III du présent titre, avec leur numéro et intitulé »).
> ⚠️ **Le paquet packagé ne porte que les 79 racines à 2 chiffres (+ `05`, déduit).** La transcription
> des 972 comptes manquants et le rétablissement de **26 libellés abrégés** relèvent de **STORY-671**.
> ⚠️ Deux coquilles de la page officielle, relevées le 2026-09-20 : `6126. Frais accessoires` doit se
> lire **`6026`** (l'art. 432 le cite trois fois), et **`6905` est imprimé sans son point** — un
> parseur sur `^\d+\.` le perd en silence.
> ⚠️ Le PDF consolidé `droit-afrique.com/upload/doc/cima/CIMA-Plan-comptable-assurances.pdf` cité plus
> haut était **injoignable** le 2026-09-20.

## Plan de comptes — comptes principaux à 2 chiffres (art. 431)

> ⚠️ **« verbatim » retiré le 2026-09-20 (STORY-512)** : **26 des 79 libellés ci-dessous sont abrégés**
> par rapport au texte, et plusieurs perdent la restriction « dans le pays concerné » — qui oppose le
> national à l'étranger (`28`, `159`, `517`). Rétablissement en **STORY-671**.

### CLASSE 1 — Comptes de capitaux permanents
- 10 Capital · 11 Réserves · 12 Report à nouveau · 13 Réserves réglementaires
- 14 Subventions d'équipement reçues · 15 Provisions pour pertes et charges
- 16 Emprunts et autres dettes à plus d'un an · 17 Comptes de liaison des établissements et succursales
- 18 Dettes pour espèces remises par les cessionnaires et rétrocessionnaires
- 19 Provision pour dépréciation des immobilisations et titres

### CLASSE 2 — Comptes de valeurs immobilisées
- 20 Frais d'établissement et de développement dans le pays concerné
- 21 Immobilisations dans le pays concerné · 22 Immobilisations en cours dans le pays concerné
- 23 Valeurs mobilières et titres assimilés (affectables à la représentation)
- 24 Prêts et effets assimilés (affectables à la représentation) · 25 Titres de participation
- 26 Dépôts et cautionnement · 27 Valeurs garantissant les engagements
- 28 Valeurs immobilisées à l'étranger

### CLASSE 3 — Comptes de provisions techniques
- 31 Provisions techniques opérations d'assurance directe vie
- 32 Provisions techniques opérations assurance directe dommages, RC et risques divers
- 34 Provisions techniques acceptations vie · 35 Provisions techniques acceptations dommages, RC et risques divers
- 38 Provisions techniques à l'étranger · 39 Part des cessionnaires et rétrocessionnaires

### CLASSE 4 — Comptes de tiers
- 40 Réassureurs, cédants, coassureurs · 41 Assurés et courtiers, agents généraux et autres producteurs
- 42 Personnel · 43 État · 44 Actionnaires (ou sociétaires) · 45 Filiales (ou société mère)
- 46 Débiteurs et créditeurs divers · 47 Comptes de régularisation, passif
- 48 Comptes de régularisation, actif · 49 Comptes d'attente à régulariser

### CLASSE 5 — Comptes financiers
- 50 Emprunts à moins d'un an · 51 Prêts non affectables à la représentation
- 52 Effets à payer · 53 Effets à recevoir · 54 Chèques et coupons à encaisser
- 55 Titres de placement · 56 Banques et chèques postaux · 57 Caisse · 59 Virements internes

### CLASSE 6 — Comptes de charges par nature
- 60 Prestations dans le pays concerné · 61 Frais de personnel dans le pays concerné
- 62 Impôts et taxes dans le pays concerné · 63 Travaux, fournitures et services extérieurs
- 64 Transports et déplacements · 65 Commissions dans le pays concerné
- 66 Frais divers de gestion · 67 Frais financiers · 68 Dotations aux amortissements et provisions
- 69 Charges par nature à l'étranger

### CLASSE 7 — Comptes de produits par nature
- 70 Primes ou cotisations dans le pays concerné · 71 Subventions d'exploitation reçues
- 73 Réductions et ristournes de primes · 74 Ristournes, rabais et remises obtenus
- 75 Commissions et participations reçues des réassureurs · 76 Produits accessoires
- 77 Produits financiers · 78 Travaux faits par l'entreprise pour elle-même · 79 Produits par nature à l'étranger

### CLASSE 8 — Comptes de résultats
- 80 Exploitation générale · 82 Pertes et profits sur exercices antérieurs
- 83 Dotation aux provisions exceptionnelles et réserves réglementaires · 84 Pertes et profits exceptionnels
- 85 Impôts sur les bénéfices · 86 Produits de prestations de services échangés
- 87 Compte général de pertes et profits · 88 Résultats en instance d'affectation · 89 Bilan

### CLASSE 0 — Comptes spéciaux (engagements / hors-bilan)
- 00 Engagements en faveur de l'entreprise · 01 Engagements à la charge de l'entreprise
- 03 Autres charges envers des tiers · 05 Plan d'investissement
- 06 Valeurs reçues en nantissement des cessionnaires et rétrocessionnaires
- 07 Valeurs appartenant à des institutions de prévoyance · 08 Valeurs remises par les organismes réassurés
- 09 Autres valeurs détenues par l'entreprise

## États de synthèse CIMA (art. 433)
- **Bilan (compte 89)** — ACTIF : valeurs immobilisées, part des réassureurs dans les provisions techniques,
  créances (assurés/intermédiaires, réassureurs, État…), comptes financiers. PASSIF : capitaux propres,
  provisions pour risques et charges, **provisions techniques brutes**, dettes.
- **Compte d'exploitation générale (compte 80)** — le **résultat technique**, présenté **séparément
  Vie/Capitalisation et Non-Vie** : au crédit primes / produits de placements / autres produits ; au débit
  charges de prestations (sinistres), variations de provisions techniques, commissions, frais, charges de placements.
- **Compte général de pertes et profits (compte 87)** — réconcilie le résultat technique avec le **résultat
  net final** : produits & charges non techniques, éléments exceptionnels (84/82), impôts sur les bénéfices (85).
- **Affectation des résultats (compte 88)** — répartition de l'excédent/déficit.
- États annexes détaillés **C1..C25** (ex. C9 antériorité des primes, C10 cadence des sinistres,
  C20/C21 mouvements de contrats, C25 participation des assurés) — hors périmètre de l'amorce v1.

## Particularités structurantes (≠ SYSCOHADA / SFD)
1. **Provisions techniques (classe 3)** : cœur du passif d'un assureur (provisions pour primes non acquises,
   sinistres à payer, provisions mathématiques vie…) — n'existent pas en SYSCOHADA/SFD.
2. **Cycle inversé** : primes encaissées d'avance, charges (sinistres) constatées plus tard → le **résultat
   technique** n'est pas un simple « produits − charges » mais intègre les **variations de provisions techniques**.
3. **Réassurance** : comptes de cessionnaires/rétrocessionnaires (18, 39, 40, 75) omniprésents.
4. **Séparation Vie / Non-Vie** obligatoire pour le compte d'exploitation générale.
5. **Aucun TFT/TAFIRE** au sens SYSCOHADA dans les états modèles CIMA de base.
6. ⛔ **La classe 8 n'est PAS entièrement de la gestion** (STORY-369) — c'est la particularité la plus
   coûteuse, et elle est invisible à l'œil nu. Elle mêle :
   - de la **gestion réelle** : `80`, `82`, `83`, `84`, `85`, `86` ;
   - **trois comptes de REGROUPEMENT** : `87` *Compte général de pertes et profits*, `88` *Résultats en
     instance d'affectation*, `89` *Bilan*. Ils **récapitulent** un résultat déjà porté par les comptes de
     gestion — les sommer avec eux le compte ⚡ **exactement deux fois**.

   ⚡ **Mesuré** : sur une balance CIMA dont le résultat de 140 M est porté par `88`, un moteur appliquant
   `[6,7,8]` rend **280 M** — la base imposable est doublée, **sans aucun signal** (le contrôle
   d'articulation est inapplicable : ce plan n'a pas de compte de résultat net en classe 1).

   ⇒ L'artefact publie donc `racinesDeGestion: ["6","7","80","82","83","84","85","86"]` — des **racines**,
   pas des numéros de classe, précisément parce qu'une déclaration au niveau de la classe ne saurait pas
   exclure `87`/`88`/`89`. ⚠️ Pour SYSCOHADA la classe 8 est, elle, **entièrement** HAO/gestion (`81`→`89`) :
   l'en retirer y produirait un résultat *avant* HAO et *avant* impôt (**D-091-3**). La règle appartient au
   référentiel **dans les deux sens**.

## `cima-assurances@2.0` — les variations de provisions techniques entrent au résultat (STORY-518)

⚠️ **Deux versions coexistent, comme `sfd-bceao@1.0` et `@2.0`.** `@1.0` reste packagée et **intacte**
(`9ca429c8…`) : son résultat technique a été servi à des organisations, et on ne réécrit pas un
chiffre déjà publié. `@2.0` (`e779903a…`) est la version **servie** depuis STORY-518.

### Ce que `@2.0` change, et pourquoi

`@1.0` publiait `RT = +RP1 +RP3 +RP5 −RC1 −RC5 −RC8` : des primes **émises** (compte `70`) contre des
prestations **payées** (compte `60`). C'est un résultat d'encaissements et de décaissements sous un
libellé qui dit « résultat technique » — et le libellé du poste le **disait** déjà.

⚡⚡ **Le Code CIMA n'a AUCUN compte de gestion pour la variation d'une provision technique.**
L'**article 432** énumère les comptes constituant les postes du compte 80 « Exploitation générale »,
et les prend en **classe 3** :

> « **Provisions de sinistres : 325, 355, 3825, 3855** et (cessions) 3925, 3955, 39825, 39855. »
> « **Provisions de primes : 320, 340, 350, 360, 3820, 3840, 3850** et (cessions) … »
> « **Provisions mathématiques : 310, 340, 3810, 3840** et (cessions) … » *(sociétés vie)*

Le mot « variation » ne paraît que **deux fois** dans toute la liste de l'article 431 — `655`
« Variation de commissions sur primes acquises et non émises » et `7024` « Variation de la provision
de primes acquises et non émises » — et **jamais** pour une provision technique du passif.

⇒ La variation se lit donc **entre deux arrêtés**, sur un poste de **bilan**, par une opérande
`mode: 'VARIATION'`.

### Les deux postes, et pourquoi deux et non trois

| Poste | Libellé | Source |
|---|---|---|
| `RV1` | Variation des provisions techniques **brutes** | `VARIATION` de `CP3` (`BILAN_PASSIF`) |
| `RV2` | Variation de la **part des cessionnaires** | `VARIATION` de `CA2` (`BILAN_ACTIF`) |

`RT = +RP1 +RP3 +RP5 −RC1 −RC5 −RC8 −RV1 +RV2`.

⛔ **Le Code en nomme trois** (provisions mathématiques, de sinistres, de primes), et `@2.0` n'en
porte que deux. La raison est mesurée, pas choisie : le plan packagé s'arrête à **2 chiffres**, et
`ramenerAuPlan` fusionne `3200` (risques en cours) et `3250` (sinistres à payer) sur `32`. Les trois
postes sont **indiscernables** tant que **STORY-671** n'a pas transcrit le plan. Le **brut** contre
les **cessions**, lui, est séparable — et l'**article 334-11** en fait une interdiction, pas une
présentation : la part cédée ne peut « en aucun cas » être compensée avec le brut.

### Ce que `@2.0` ne change PAS

- ⛔ `RN` **ne cascade plus depuis `RT`** et énumère ses 13 opérandes de détail. Il est le poste
  terminal, confronté à `Σ_CR (crédit − débit)` par `coherenceSig` ; une balance équilibrée impose
  cette égalité **par construction**. Y faire entrer la variation aurait fait passer **tout** dossier
  CIMA en `ANOMALIE` sur une balance pourtant juste. L'écart `RT`/`RN` est **l'écriture d'inventaire**
  que le plan CIMA passe contre le compte `80` — déclaré en `racinesDeGestion` et rattaché à **aucun**
  poste (**STORY-522**).
- Le **statut reste `amorce`** : la réserve levée est celle des variations, **pas** celle de la
  séparation Vie/Non-Vie (**STORY-521**) ni celle des états C1..C25 (**STORY-523**). Le libellé de
  `RT` le dit : « Résultat technique (amorce — hors séparation Vie/Non-Vie) ».
- Le **plan de comptes est identique** — 80 racines à 2 chiffres, `longueurCompteDetail: 6`.

### ⚠️ Sans colonne N-1, `RT` n'est pas publié

Une variation ne se lit pas dans un solde : sans `soldesN1`, `RV1`, `RV2` et `RT` sont **indéterminés**
et **absents** de la réponse — jamais rendus `0`, et surtout jamais repliés sur la valeur de `@1.0`.
Seul `RN`, qui ne dépend d'aucune variation, reste mesuré.

## `cima-assurances@3.0` — les cessions en réassurance entrent au résultat (STORY-520)

⚠️ **Trois versions coexistent désormais.** `@1.0` (`9ca429c8…`) et `@2.0` (`e779903a…`) restent
packagées et **intactes** : toutes deux ont été servies à des organisations, et on ne réécrit pas un
chiffre déjà publié. `@3.0` (`dbfae17a…`) est la version **servie** depuis STORY-520.

### ⛔⛔ Ce que `@3.0` défait n'est pas un manque : c'est une COMPENSATION

La spine écrivait « **Rien** dans le CR pour la part des réassureurs dans les sinistres ». **C'est
faux, et ce qui est vrai est pire.** L'article 431 porte les deux comptes, nommément :

> `609.` **Part des réassureurs dans les prestations et frais**
> `709.` **Part des réassureurs dans les primes**

et l'article 432 les désigne comme les **cessions** des postes du compte 80 :

> « Prestations et frais payés : 602, 604, 605, 606, 6902, 6904, 6905 et **(cessions) 609, 6909.** »
> « Primes : 702, 704, 705, 706, 7902, 7904, 7905 et **(cessions) 709, 7909.** »

Le plan de `@1.0`/`@2.0` s'arrêtant à **2 chiffres**, la résolution au **plus long préfixe** rabattait
`609` sur `60` — donc sur `RC1` — et `709` sur `70` — donc sur `RP1`. Le compte de résultat servi
**n'omettait pas** les cessions : il les **compensait**, et aucun libellé ne le disait. ⚡ Une
omission se voit ; une compensation ne se voit pas — et l'**art. 334-11** l'interdit au bilan.

### Le plan gagne EXACTEMENT deux comptes — les premiers à trois chiffres

| Compte | Libellé (art. 431, verbatim) | Classe |
|---|---|---|
| `609` | Part des réassureurs dans les prestations et frais | 6 |
| `709` | Part des réassureurs dans les primes | 7 |

⛔ **Ce n'est PAS la transcription du plan** (**STORY-671**, 972 comptes manquants) : ce sont les deux
seuls comptes que l'article 432 nomme lui-même « (cessions) » pour les deux postes séparés ici. Sans
eux, les préfixes de la table de passage seraient **orphelins** (garde CC2) et la séparation serait
décorative. `longueurCompteDetail` reste **6**, sourcé aux mêmes articles 430/432.

### Les deux postes, et pourquoi leur signe n'est pas choisi

| Poste | Libellé | Règle | Compte |
|---|---|---|---|
| `RP6` | Part des réassureurs dans les primes | `PRODUIT` | `709` |
| `RC9` | Part des réassureurs dans les prestations et frais | `CHARGE` | `609` |

⚡ `709` est un compte de **produit** qui se **débite** ; `609` une **charge** qui se **crédite**.
Sous les règles `PRODUIT` (`crédit − débit`) et `CHARGE` (`débit − crédit`), les deux ressortent donc
**négatifs** : la « charge de cession » est ce **produit négatif**, jamais un poste de classe 6
inventé, et l'atténuation est cette **charge négative** retranchée. Le sens vient du compte.

`RT = +RP1 +RP6 +RP3 +RP5 −RC1 −RC9 −RC5 −RC8 −RV1 +RV2`.

⛔ **`RN` les reçoit AUSSI**, et c'est la condition de non-régression : il est le poste **terminal**
confronté à `Σ_CR (crédit − débit)`. Extraire `709` de l'assiette de `RP1` laisse la somme inchangée
**à la seule condition** qu'il les énumère ; les oublier ne lèverait **rien** et ferait passer tout
dossier CIMA en `ANOMALIE` sur une balance pourtant juste.

⚠️ `RP1` et `RC1` **nomment désormais leur caractère brut** (« brutes de cessions », « brutes de la
part des réassureurs ») : sans cela, le même libellé désignerait une assiette **nette** en `@2.0` et
**brute** en `@3.0`.

### ⚡⚡ Le test d'exhaustivité que `@2.0` annonçait n'existait pas

Le commentaire de `table-de-passage-cima-v2.json` écrivait : *« Ajouter un poste de détail au CR sans
l'ajouter ici casserait l'égalité en silence : c'est ce que garde le test d'exhaustivité. »* — et
**aucune suite des trois dépôts** ne confrontait les opérandes du terminal à l'assiette du compte de
résultat. STORY-520 l'écrit (`cima-resultat-net-exhaustivite.spec.ts`), par **expansion transitive**
des formules : une garde littérale serait fausse sur `@1.0`, dont le `RN` cascade depuis `RT`.

### Ce que `@3.0` ne change PAS

- Le **statut reste `amorce`**. Les réserves levées sont celles de la réassurance au compte de
  résultat, **pas** la séparation Vie/Non-Vie (**STORY-521**), ni les états C1..C25 (**STORY-523**),
  ni le niveau de détail du plan (**STORY-671**).
- ⛔ **Les cessions « étranger » restent dehors** : `7909` est cité par l'art. 432 et **absent** de
  l'art. 431 — même contradiction que D-518-7 —, et `69` / `79` ne sont rattachés à **aucun** poste
  de la table de passage. Rattacher `6909` accrocherait un fragment d'une classe dont le tout est
  libre.
- ⛔ **La rétrocession** est nommée et non traitée : le compte `39` s'intitule « Part des
  cessionnaires **et rétrocessionnaires** », mais `assurance-service` ne modélise que la **cession**.
- ⛔ **Les plafonds de l'art. 308** (cessions hors zone CIMA : plafonds par branche, branches non
  cessibles, autorisation ministérielle au-delà de 50 %) sont **cités et non appliqués** — le module
  ne porte ni la branche d'agrément de l'art. 328, ni le territoire du réassureur.

## Cadrage de l'amorce `cima-assurances@1.0`
- Plan de comptes = **liste officielle art. 431** (comptes à 2 chiffres, verbatim).
- Postes / table de passage = **proposition STRUCTURELLEMENT cohérente** (plan ⊇ préfixes de la table),
  statut **« à valider par un expert-comptable assurance / actuaire »** — suffisante pour prouver le
  **multi-référentiel** (4ᵉ référentiel pluggable, même code, invariant P7) et amorcer le vertical `assurance`
  déjà prévu en admin-panel. La **ventilation fine** (Vie/Non-Vie, variations de provisions techniques,
  parts réassureurs poste par poste) et les **états C1..C25** sont hors amorce → stories dédiées.
  ⚡ **Les variations de provisions techniques ne le sont plus depuis `@2.0`** (STORY-518, section
  ci-dessus) ; la ventilation Vie/Non-Vie et les états C1..C25 le restent.
- Résultat technique / résultat net encodés en postes `FORMULE` (opérandes signées, moteur B8 agnostique).

## `cima-assurances@4.0` — Vie et Non-Vie deviennent étanches (STORY-521)

⚠️ **Quatre versions coexistent désormais.** `@1.0` (`9ca429c8…`), `@2.0` (`e779903a…`) et `@3.0`
(`dbfae17a…`) restent packagées et **intactes** : toutes ont été servies à des organisations, et on
ne réécrit pas un chiffre déjà publié. `@4.0` (`021992b5…`) est la version **servie** depuis
STORY-521.

### ⛔⛔ Ce que la lecture du Code a défait : la prémisse de la story

La story écrivait : *« un assureur agréé pour les deux doit présenter les deux comptes »*. **C'est
faux en zone CIMA**, et c'est l'article 326 qui le dit, à la lettre :

> « **Toute entreprise réalisant des opérations définies au 1°) de l'article 300 ne peut pratiquer
> en même temps les opérations définies au 2°) du même article.** »
> *(alinéa 4 : les sociétés qui pratiquaient les deux à l'entrée en vigueur du Code avaient **trois
> ans** pour se mettre en conformité — délai expiré depuis 1998.)*

et l'**article 300** sépare les deux ensembles :

> « **1°)** les entreprises qui contractent des engagements dont l'exécution dépend de la durée de la
> vie humaine ou qui font appel à l'épargne en vue de la capitalisation […] ;
> **2°)** les entreprises d'assurance de toute nature […] **autres que celles visées au 1°)**. »

⇒ **La spécialisation EST l'étanchéité.** Le Code ne demande jamais deux comptes techniques dans une
même liasse : il publie **deux modèles alternatifs**, et l'entreprise établit celui de son agrément.

⚡ Confirmation par un article que la story ne citait pas : le **seul** régime mixte pérenne du Code
est la **microassurance** (art. 715, non-vie + temporaire décès), et l'**art. 723** en tranche la
conséquence comptable — « **le mode de gestion de la branche 11 est assimilé dans ce cas à celui de
l'IARD** ». Même là, **un seul compte 80**. L'art. 337-4 (sociétés mixtes héritées) va dans le même
sens pour la marge de solvabilité : calcul **séparé puis sommé**, jamais une base agrégée.

### ⛔ Et le vocabulaire de la story n'est pas celui du régulateur

Dépouillement des **940 pages** de l'édition officielle « CODE CIMA 2019 » :

| Expression | Occurrences | Ce qu'elle désigne réellement |
|---|---|---|
| « comptes techniques » | **1** | art. 432, classe 7 : « En dehors des **comptes techniques (comptes 70, 73, 75 et 79)**, les produits comprennent… » — **quatre comptes de la classe 7**, pas un état |
| « non technique » | **1** | art. 432, compte 82 : « …sur les **postes non techniques** » — un **adjectif** |
| « compte d'exploitation générale » | **19** | ← le terme du régulateur |
| « compte général de pertes et profits » | **22** | ← le terme du régulateur |

⇒ Les trois états portent donc le **numéro de compte du Code**, qui ne se confond avec rien :

| État publié | Intitulé verbatim de l'art. 433 |
|---|---|
| `COMPTE_80_VIE_CAPITALISATION` | « Compte 80 - **Vie / Capitalisation** » |
| `COMPTE_80_TOUTE_NATURE` | « Compte 80 - **Assurances de toute nature** » |
| `COMPTE_87_PERTES_ET_PROFITS` | « COMPTE 87 - COMPTE GENERAL DE PERTES ET PROFITS » |

⚠️ « Assurances de toute nature » **est** le non-vie : l'art. 300 2°) le définit comme « autres que
celles visées au 1°) ». Le périmètre est exact, seul le mot surprend. Et « NON VIE » existe bien dans
le Code — mais pour les **états de réassurance** (`ETAT RS2 VIE` / `ETAT RS2 NON VIE`). Une recherche
négative n'aurait donc prouvé que l'absence du **vocabulaire cherché**, jamais celle du concept.

### Le plan gagne EXACTEMENT huit comptes — et pas un de plus

Les classes 6 et 7 ne portent **aucun** axe vie/dommages à deux chiffres : `60 Prestations dans le
pays concerné`, `70 Primes ou cotisations dans le pays concerné`. L'axe vit au **3ᵉ chiffre**, et
l'art. 431 est régulier :

| Compte | Libellé verbatim (art. 431) |
|---|---|
| `601` | Prestations échues (**affaires directes vie**) |
| `602` | Prestations et frais payés (**affaires directes dommages, RC et risques divers**) |
| `604` | Prestations échues (**acceptations vie**) |
| `605` | Prestations et frais (**acceptations d'affaires dommages, RC et risques divers**) |
| `701` | Primes (**affaires directes vie**) |
| `702` | Primes (**affaires directes dommages, RC et risques divers**) |
| `704` | Primes (**acceptations vie**) |
| `705` | Primes (**acceptations dommages, RC et risques divers**) |

**Ce qui ne descend PAS, et pourquoi c'est mesuré :**

- les **cessions** restent entières — l'art. 432 cite `609` et `709` **à trois chiffres dans les deux
  listes**, chaque modèle prenant la totalité du compte de cession puisqu'un seul s'applique. `RC9` /
  `RP6` livrés par STORY-520 traversent `@4.0` **inchangés** ;
- la **classe 3** porte déjà l'axe **dès deux chiffres** (`31`/`34` vie, `32`/`35` dommages, `38`
  étranger) : aucun compte à ajouter. ⚡ Et la **spécialisation** rend `CP3` correct pour le modèle
  servi **sans le scinder** — une société vie ne porte aucun `32`/`35`. Le bilan ne bouge pas ;
- `603`, `606`, `703` et `706` sont **cités par l'art. 432 et absents de l'art. 431** — même
  contradiction que `7909` (D-518-7, D-520-5). Ils restent dehors.

### ⛔⛔ Ce que `@4.0` ne change PAS — et c'est le cœur de la version

`COMPTE_RESULTAT`, `RT` et `RN` sont **inchangés**. Seul le libellé de `RT` perd sa réserve « hors
séparation Vie/Non-Vie », qui vient d'être levée.

Et surtout : **`RC1` et `RP1` ÉNUMÈRENT les huit nouveaux comptes** en plus de `60`/`70`. Sans cela,
`6010` se résoudrait au plus long préfixe sur `601` — dont le seul rattachement serait le poste du
modèle Vie — et **quitterait l'assiette de `RC1`, donc `Σ_CR`, donc `RN`**. Le compte de résultat, le
résultat porté au passif et `COHERENCE_RESULTAT` seraient alors faux **ensemble**, donc cohérents,
donc **verts**. C'est le piège de M4 de STORY-520 pris dans l'autre sens : là il fallait **extraire**
`609` de `RC1` ; ici il faut impérativement **y maintenir** les huit.

### L'agrément se DÉRIVE de la balance, et jamais d'un paramètre

La liasse est produite depuis une balance, qui ne porte aucun axe de catégorie. `@4.0` la dérive des
**affaires directes** présentes — `601`/`701` ⇒ vie, `602`/`702` ⇒ toute nature — et publie les
comptes relevés qui **justifient** la dérivation.

⚠️ **Les acceptations (`604`, `605`, `704`, `705`) en sont exclues, et ce n'est pas un oubli.**
L'art. 432 les cite dans les **deux** listes, parce que l'**art. 326 alinéa 1** exempte les
acceptations d'agrément : *« Toutefois, en ce qui concerne les opérations d'acceptation en
réassurance, cet agrément n'est pas exigé. »* Une société de toute nature peut donc porter un `604`
en toute régularité — en conclure « vie » serait faux.

Quatre issues, et **aucune n'est un repli silencieux** :

| Balance | Agrément | Les deux états |
|---|---|---|
| `601`/`701` | `VIE_CAPITALISATION` | Vie **calculé**, toute nature `NON_APPLICABLE` |
| `602`/`702` | `TOUTE_NATURE` | la symétrie exacte |
| les deux familles | `INCOMPATIBLE_ART_326` | **aucun** calculé — la balance décrit une entreprise que le Code interdit |
| ni l'une ni l'autre (plan à 2 chiffres) | `INDETERMINABLE` | **aucun** calculé — le cas de **toutes** les balances CIMA antérieures |

⇒ Le modèle qui ne s'applique pas est servi **vide et non omis**, squelette compris, `null` partout et
jamais `0` — patron du TFT absent du référentiel SFD. *Un état qui disparaît fait chercher ce qu'on a
cassé.*

⚡⚡ **Et calculer les deux aurait été pire que ne rien publier.** Les charges communes — frais de
personnel, impôts, commissions, frais divers — sont rattachées aux **deux** modèles (art. 432, liste
« comptes communs à toutes les entreprises »). Le modèle non applicable sortirait donc garni de tout
**sauf de ses primes et de ses prestations** : un état à qui il ne manque que le métier a l'air d'un
état.

### L'articulation publiée est celle qui est VRAIE

La story annonçait `RN = résultat Vie + résultat Non-Vie + résultat non technique`. **Cette égalité ne
peut pas tenir** : `RN` est le poste **terminal**, confronté à `Σ_CR (crédit − débit)`, tandis que le
solde du compte 80 intègre les **variations de provisions techniques**, lues sur des postes de
**bilan** (classe 3) et donc **hors** de cette somme. L'y faire entrer ferait passer tout dossier CIMA
en `ANOMALIE` sur une balance pourtant juste — le défaut que D-518-5 et M4 de STORY-520 ont déjà
évité deux fois.

L'identité contrôlée **nomme donc la variation** :

> `solde du compte 80 servi` = `RN` − `variation des provisions brutes` + `variation de la part des
> cessionnaires`

⚠️ Et le **solde du compte 80 diffère de `RT`** : `RT` n'énumère que huit postes et laisse dehors les
frais de personnel, les impôts, les travaux et fournitures, les frais divers, les subventions et les
produits accessoires — que l'art. 432 range pourtant **nommément** dans le compte 80. Le chiffre du
Code est le solde ; `RT` reste servi tel quel, avec son libellé d'amorce.

### Le compte 87 est publié en SQUELETTE, et c'est le périmètre qui le veut

Ses lignes sont nourries par les comptes `82` à `86`, qui ne sont routés vers **aucun** poste du
paquet : c'est le sujet de **STORY-672** (« onze comptes de gestion CIMA ne mènent à aucun poste »).
L'état existe, ses lignes existent, et chacune dit `A_COMPLETER`.

### Ce que `@4.0` ne couvre pas

- Le **statut reste `amorce`** : la réserve levée est celle de la séparation Vie/Non-Vie, **pas**
  celle des états C1..C25 (**STORY-523**), ni celle du niveau de détail du plan (**STORY-671**), ni
  celle des onze comptes de gestion non routés (**STORY-672**).
- ⛔ **La clé de répartition de l'art. 433 n'est pas convoquée.** Elle existe — « les produits
  financiers sont, à défaut d'une étude plus poussée, ventilés par catégorie ou sous-catégorie au
  prorata des provisions techniques nettes de réassurance », avec des plafonds durs de **10 %**
  (transports) et **2,5 %** (acceptations) sur les frais de gestion — mais elle ventile **entre les
  23 catégories de l'art. 411**, pour l'**état C1**, et elle est **supplétive**. Elle appartient à
  STORY-523.
- Le **compte 88** (résultats en instance d'affectation), la rétrocession, les cessions « étranger »
  (`6909`, `7909`) et les plafonds de l'art. 308.

## `cima-assurances@5.0` — la classe 8 se lit par liste explicite (STORY-522)

⚠️ **Cinq versions coexistent.** `@1.0` (`9ca429c8…`), `@2.0` (`e779903a…`), `@3.0` (`dbfae17a…`) et
`@4.0` (`c541b92c…`) restent packagées et **intactes**. `@5.0` (`5234764a…`) est la version
**servie** depuis STORY-522.

### ⛔⛔ Ce que `@5.0` corrige est un chiffre FAUX, pas un manque

Les quatre versions précédentes publiaient :

```
racinesDeGestion: ['6', '7', '80', '82', '83', '84', '85', '86']
```

Or l'**article 432** dit, en une phrase :

> « **Le solde du compte 80 est viré, pour clôture des écritures, au compte 87.** »

La chaîne est donc `classes 6/7 → 80 → 87 → 88 → 89`. Le compte `80` **reprend par construction** ce
que les classes 6 et 7 portent déjà — c'est exactement la définition de compte de regroupement que
ce dépôt applique depuis STORY-369 pour exclure `87`, `88` et `89`. **`80` appartenait à la même
famille et était resté dedans.**

⚡ **Mesuré** en rejouant `calculerResultatComptable` sur une balance d'après inventaire — classes
6/7 encore soldées **et** compte 80 ayant reçu le virement de clôture :

| ligne | débit | crédit |
|---|---|---|
| `70` primes | — | 900 000 000 |
| `60` prestations | 760 000 000 | — |
| `80` exploitation générale | — | 140 000 000 |

```
résultat RÉEL de l'exercice      : 140 000 000
avec les racines de @4.0         : 280 000 000     ⇐ facteur exactement 2
avec @5.0                        : 140 000 000
```

⛔ **Et aucun filet ne pouvait le voir.** `resoudreCompteResultatNet` rend `null` pour CIMA — le
paquet ne publie pas `regles.COMPTE_RESULTAT_NET` et aucun compte de classe 1 ne s'intitule
« résultat net » (`13` = « Réserves réglementaires »). Le contrôle d'articulation ne s'exécute donc
**jamais** sur un dossier CIMA : le doublement était structurellement **silencieux**.

⚠️ **L'artefact le disait déjà de lui-même** : aucune des 65 lignes de sa table de passage ne
rattache le compte `80` à un poste, alors que les deux états `COMPTE_80_*` livrés par STORY-521 sont
alimentés **exclusivement** par des comptes des classes 6 et 7. Le paquet décrivait `80` comme une
récapitulation et le déclarait en même temps comme une source primaire.

### ⛔ Ce n'est pas la correction d'une racine : c'est une PORTE

Le plan marque désormais les **quatre** comptes de regroupement :

| compte | libellé | `nature` |
|---|---|---|
| `80` | Exploitation générale | `REGROUPEMENT` |
| `87` | Compte général de pertes et profits | `REGROUPEMENT` |
| `88` | Résultats en instance d'affectation | `REGROUPEMENT` |
| `89` | Bilan | `REGROUPEMENT` |

et le générateur **refuse d'empaqueter** tout référentiel dont une racine de gestion capterait l'un
d'eux, **en le nommant** :

```
cima-assurances@5.0 — racine de gestion captant un compte de REGROUPEMENT :
80 « Exploitation générale ». Un compte de regroupement reprend des montants déjà portés
par les comptes qu'il regroupe : le sommer avec eux double le résultat, en silence.
```

⇒ Corriger `80` une seule fois aurait laissé le défaut revenir — ici, ou sur un référentiel futur.
Le marqueur est **déclaré**, jamais déduit d'un numéro : `85 Impôts sur les bénéfices` et `87 Compte
général de pertes et profits` sont voisins et de natures opposées. Seul le texte tranche.

### ⚠️ Ce qui RESTE dans les racines, et pourquoi

`82` à `86` sont des comptes à **mouvements propres** — pertes et profits sur exercices antérieurs,
dotations hors exploitation, exceptionnel, impôts sur les bénéfices, prestations entre
établissements. L'art. 433 les fait recevoir au compte 87 **sans qu'ils regroupent** d'autres
comptes de gestion. Les retirer produirait un résultat *avant* HAO et *avant* impôt : la fausse
réparation symétrique de **D-091-3**.

### ⚡ Le défaut est PROPRE à CIMA — mesuré sur les cinq paquets

| paquet | racines | compte de regroupement capté |
|---|---|---|
| `syscohada-revise@2.1` | `['6','7','8']` | non |
| `zone-franche-togo@1.0` | `['6','7','8']` | non |
| `smt-togo@1.0` | `['6','7','8']` | non |
| `sfd-bceao@2.0` | `['6','7']` | non |
| `cima-assurances@4.0` | `['6','7','80',…]` | ⛔ **oui — `80`** |

Les trois plans SYSCOHADA/SMT/zone franche portent la **même** classe 8, intégralement de la
gestion : `81` valeurs comptables des cessions, `82` produits des cessions, `83`→`86` HAO, `87`
participation des travailleurs, `88` subventions d'équilibre, `89` impôts sur le résultat. **Aucun
compte de regroupement.** `sfd-bceao` n'a pas de classe 8.

⇒ CIMA est le seul plan **sectoriel** du dépôt, et le seul à mêler gestion et regroupement dans une
même classe. La réponse à « le défaut est-il ailleurs ? » est **non**, et c'est un résultat utile :
il dit où ne **pas** aller corriger.

### Ce que `@5.0` ne couvre pas

- ⛔ **La reprise de la charge d'impôt déjà comptabilisée.** `85 Impôts sur les bénéfices` **est**
  dans les racines, mais `resoudreCompteImpotResultat` rend `null` pour CIMA ⇒
  `chargeImpotComptabilisee = 0`, et la charge d'IS entre dans le résultat comptable **sans jamais
  être reprise** avant l'assiette. Défaut réel, distinct, **nommé et non corrigé ici**.
- ⛔ **L'absence de contrôle d'articulation** sur un dossier CIMA (`resoudreCompteResultatNet` rend
  `null`) — c'est ce qui rendait le doublement invisible, et cela reste vrai pour tout autre défaut
  du même chemin.
- Le **statut reste `amorce`** : les états C1..C25 (**STORY-523**), le niveau de détail du plan
  (**STORY-671**) et les onze comptes de gestion non routés (**STORY-672**) restent hors couverture.
