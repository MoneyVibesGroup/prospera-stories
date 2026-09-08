# STORY-481 : Le plan de trésorerie s'arrête à N+1 alors que la projection va à N+3 — le pire mois est hors du plan

Status: done

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en mettant côte à côte les deux horizons de la maquette : le plan mensuel et la projection annuelle.

---

## Le fait

`ProjectionMensuelleService` projette **12 mois**, ceux de N+1. `ProjectionAnnuelleService` projette
**trois exercices**. Le pire moment du prévisionnel se trouve donc, structurellement, **hors du plan de
trésorerie**.

Sur le scénario prudent du dossier de démonstration :

| | Trésorerie de clôture |
|---|---|
| Fin N+1 — dernier mois du plan mensuel | −804 945 |
| Fin N+2 | −2 452 637 |
| Fin N+3 — dernier exercice projeté | **−4 092 714** |

Un banquier à qui l'on remet ce document lit un découvert de 800 000 F là où le **même modèle** en
annonce **cinq fois plus** deux ans plus tard. Le plan mensuel — le document le plus regardé des trois
— est celui qui couvre la plus petite partie de l'horizon.

## Critères d'acceptation

- [x] AC-1 — `GET …/:id/projection-mensuelle` accepte `?exercice=1|2|3` (défaut `1`, comportement
      actuel inchangé) et projette les 12 mois de l'exercice demandé.
- [x] AC-2 — L'ancre d'ouverture de l'exercice `n` est la **clôture annuelle** de l'exercice `n-1`, et
      l'articulation `Σ mensuel = flux net annuel de l'exercice n` reste une **identité**.
- [x] AC-3 — L'encours d'ouverture des créances et des dettes est le **BFR normatif de l'exercice
      précédent**, pas celui de la base — sans quoi l'échéancier de N+2 rejouerait l'apurement de 2025.
- [x] AC-4 — La réponse porte `exercice` et `annee` : un plan mensuel qui ne dit pas de quelle année il
      parle est illisible dès qu'il y en a trois.
- [x] AC-5 — La comparaison (**STORY-473**) publie ses indicateurs mensuels **par exercice**, pas
      seulement pour N+1.

---

## ⚡⚡ LE CHIFFRAGE DE LA FICHE NE SE REPRODUIT PAS — et le « fait » non plus

Rejoué le 2026-09-08 sur les ancres et les hypothèses que la fiche cite (`produitsBase
16 375 000`, croissance 5 %, marge 30 %, charges 20 %, délais 60/60/30) :

| | Fiche | **Moteur (v1.10.0)** |
|---|---|---|
| Fin N+1 | −804 945 | **13 159 076** |
| Fin N+2 | −2 452 637 | **14 376 108** |
| Fin N+3 | −4 092 714 | **15 653 989** |

⛔ **Les trois montants sont faux, et le signe aussi.** La trésorerie ne se dégrade pas : elle
**s'améliore** de 12 000 000 à 15 653 989 sur l'horizon.

⛔ **Les ancres, elles, sont les bonnes** : les **produits** correspondent au franc près
(17 193 750 / 18 053 438 / 18 956 110), et `bfrBaseHt.creancesClients` vaut **2 729 167** —
exactement l'encours que STORY-480 cite. Une recherche exhaustive sur 58 000 projections
(charges fixes × investissements × taux d'intérêt) n'a trouvé **aucun** jeu produisant les
chiffres de la fiche. Aucune des quatre stories intervenues depuis sa rédaction ne les explique :
STORY-469 ne déplace la trésorerie annuelle que de ~23 000 F sur trois ans, et 478/479/480 ne
touchent **que** le moteur mensuel, par construction.

⛔ **Conséquence sur le « fait » lui-même** : sur les paramètres cités, le pire mois est le
**mois 2 de N+1**, c'est-à-dire **DANS** le plan d'avant la story. « Le pire mois est hors du
plan » n'est pas vrai de ce scénario.

## ⛔ Ce que cela ne remet PAS en cause

Les cinq critères sont justifiés **structurellement**, indépendamment du chiffrage :

- le plan mensuel couvrait bien **un tiers** de l'horizon annuel ;
- l'ancrage sur `ancres.produitsBase` aurait bien fait **apurer en janvier 2027 les créances de
  2025** — mesuré : sans AC-3, l'apurement du mois 1 vaut `909 723` pour les **trois** exercices,
  au lieu de `909 723 / 955 209 / 1 002 969` ;
- toutes les grandeurs nécessaires étaient **déjà publiées** par l'annuel.

⚠️ **Le motif chiffré de la fiche est à refaire avec le PO** avant d'être cité ailleurs. Un essai
du dépôt fige désormais l'écart, pour que personne ne recite ces montants sans les avoir rejoués.

## Décisions de cadrage

- **D-481-1 — le mensuel ne DÉRIVE plus ses agrégats, il les REÇOIT de l'annuel.** Il calculait
  `produitsBase × (1 + croissance)` et recomposait les charges à partir des taux. Pour un exercice
  de rang `n`, chacune de ces formules serait une **seconde source de vérité** pour un montant que
  l'annuel publie déjà, et la première divergence d'arrondi casserait `ecartArticulation`. C'est
  le piège de STORY-460, 467 et 468 — et STORY-472 l'a payé une fois de plus, l'écart valant alors
  **exactement** les charges fixes. Un type `AncrageExercice` et une fonction `ancrerExercice`
  partagée par les deux appelants remplacent les quatre paramètres `*N1`.

- **D-481-2 — trois `serieExercices(...)[0]` devenaient faux.** Les investissements, le
  financement et les remboursements étaient lus au rang `0` en dur : un plan de N+3 aurait
  décaissé les investissements de **N+1**. ⚠️ Ce défaut **n'était gardé par rien** : la mutation
  qui rétablit le `[0]` restait verte tant que les fixtures employaient un montant récurrent,
  identique sur les trois exercices. Un essai à échéanciers **échelonnés** la fait rougir.

- **D-481-3 — `exercice` est publié À CÔTÉ de `annee`, pas à sa place.** `annee` vaut `null` quand
  la base ne porte pas de millésime exploitable : le lecteur perdrait alors son seul repère.

- **D-481-4 — AC-5 rompt le contrat de `mensuel`**, qui passe de scalaire à tableau. Publier un
  scalaire à côté d'un `annuel[]` déjà tabulaire était l'incohérence même que l'AC ferme.

## Revue de sécurité — 0 vulnérabilité

Les sept axes instruits, la plupart **par mesure** : une sonde montant l'application Nest réelle
avec les options exactes du service, et un banc CPU.

### Le 500 redouté n'est pas atteignable

**31 formes de `?exercice` mesurées** contre le vrai `ValidationPipe` : toutes rendent 200 dans les
bornes ou 400. Y compris le cas le plus subtil, le **paramètre répété** `?exercice=1&exercice=2` :
Express en fait un tableau, la conversion donne `NaN`, et les trois contraintes tombent. Le
contrôleur ne reçoit **jamais** de tableau.

### Le coût d'AC-5 est chiffré, pas supposé

**Aucune I/O multipliée** : la boucle ajoutée est *à l'intérieur* du parcours synchrone des
scénarios, **après** les caches de snapshot et de paquet fiscal. Le compte d'appels au dépôt est
**identique à avant**.

| | ms / requête |
|---|---|
| Avant — 5 scénarios × 1 mensuel | 0,237 |
| Après — 5 scénarios × 3 mensuels | 0,330 |
| Facteur réel | **×1,39**, pas ×3 — le moteur annuel, inchangé, domine |

Au plafond du limiteur de débit, une adresse consomme au pire **33 ms de processeur par minute**.
Taille de réponse : **+2,9 Ko au pire**, facteur constant borné par les cinq scénarios maximum.

### ⚡⚡ D-1 — le filet du nouveau paramètre n'était mesuré NULLE PART

`grep "exercice=" test/` ne rendait **aucun résultat**. Le seul essai construisait l'objet de
requête **à la main**, ce qui court-circuite le `ValidationPipe` : il ne mesurait ni `@IsInt`, ni
`@Min`, ni `@Max`, ni `@Type`. Et `collectCoverageFrom` exclut les `*.dto.ts`.

⛔ **Retirer le `@Max` laissait toute la suite verte** — unitaires, e2e, couverture — tout en
ouvrant un **500** sur `?exercice=4`. Une vulnérabilité à **une ligne de distance**, sans aucun
test pour la retenir. Troisième occurrence du même angle mort après STORY-479 et STORY-480.

### D-2 — la garde de `ancrerExercice` n'était pas dans la PR

Elle vivait dans l'arbre de travail au moment de la revue. Committée depuis.

### Un écart fonctionnel relevé, hors périmètre sécurité

**L'export prévisionnel reste figé sur l'exercice 1** : le document remis à un banquier ne montrera
jamais N+2 ni N+3, alors que c'est précisément le manque que la story ferme côté API.

## ⚠️ Un hook inerte assumé — l'export reste figé sur l'exercice 1

Relevé par la revue de sécurité, hors de son périmètre, et tranché ici.

⛔ **Le manque est réel** : la route mensuelle sert désormais les trois exercices, mais le document
remis à un banquier ne montrera jamais N+2 ni N+3 — précisément le manque que la story ferme
**côté API**. Un lecteur du PDF y verra douze mois sans savoir qu'il en existe vingt-quatre de
plus.

⛔ **Et il n'est pas comblable dans cette story**, parce que la question n'est pas technique mais
**éditoriale**, et que la fiche ne la tranche pas : trois sections de plan mensuel à la suite ? un
paramètre d'export ? une seule section, sur l'exercice choisi ? Chacune change la **forme du
document**, donc ce que le cabinet remet à un tiers. Trancher ici serait décider à la place du PO.

⚠️ Le troisième argument de `projeterMensuel` est **volontairement omis** au point d'appel, avec le
raisonnement écrit sur place : le défaut du service vaut `1`, donc l'export rend **exactement** le
document d'avant la story, et la story qui ouvrira l'export n'aura qu'un argument à passer.

## Revue de code — 6 constats, aucun bloquant

La revue a **mesuré** plutôt que raisonné : ~12 400 plans balayés contre `dist/`, dont les
extrêmes (délais jusqu'à 1 080 jours, croissance de −90 % à +200 %, marge de −200 % à +99,9 %,
échéanciers échelonnés, profils de saisonnalité et d'antériorité combinés). **Zéro échec** sur les
trois invariants : articulation nulle, clôture du mois 12 égale à celle de l'annuel, ouverture du
mois 1 égale à la clôture de `n−1`.

**AC-1 prouvé numériquement sur 25 920 combinaisons** : les produits, les charges d'exploitation et
la trésorerie d'ouverture que l'annuel publie sont **exactement** ceux que le mensuel dérivait. Et
les onze migrations de tests sont des changements de signature **purs** : aucun attendu numérique
modifié, aucun `toEqual` dégradé, aucun essai supprimé.

### ⚡⚡ C-1 à C-3 — trois descriptions publiées disaient encore « N+1 »

`decaissementsChargesFinancieres` annonçait « la charge annuelle **de N+1** ». Mesuré sur un
dossier endetté : la ligne somme 810 000 au rang 1, **2 430 000** au rang 2, **4 050 000** au
rang 3. Un intégrateur qui suit la description et confronte le plan de N+3 aux charges de N+1
trouve 3 240 000 d'écart et ouvre un ticket « le moteur décaisse cinq fois trop d'intérêts ». **Le
chiffre servi est juste ; c'est le texte qui ment.** Même défaut sur `moisReversement` et sur le
paragraphe de version 1.3.0, qui décrit encore l'échéancier comme figé sur N+1 — précisément ce que
la story change.

### ⚡ C-2 et C-4 — deux NOMS de champ devenus faux deux fois sur trois

`tvaNetteN1` vaut 921 095 / 967 153 / **1 015 509** selon le rang ; `resultatAnnuelN1` porte le
flux net et la clôture de l'exercice **demandé**.

⚖️ **Non renommés, et c'est un arbitrage assumé.** Renommer romprait le contrat pour un gain
**cosmétique** qu'aucun critère n'exige, alors que la story rompt déjà `mensuel` — rupture-là
justifiée par AC-5. Les deux descriptions disent désormais que le nom est un **héritage du modèle
mono-exercice** et que la valeur, elle, suit `?exercice`. Renommage **tracé à part**.

### ⚡ C-5 — `bfrBase` ne désigne plus la même chose sur les deux routes

Sur la mensuelle il vaut désormais le BFR de l'exercice **précédent** (3 220 417 / 3 381 438 /
3 550 509) ; sur l'annuelle il reste celui de la base. Un écran qui affichait « BFR de départ » en
lisant le même nom sur les deux routes montrait deux valeurs pour le même dossier, sans qu'aucun
texte n'explique laquelle est laquelle.

### ⚡ C-6 — une égalité du contrat est tombée sans un mot

`ancres.tresorerieBase === periodes[0].tresorerieOuverture` était vrai jusqu'ici. Dès le rang 2, le
plan s'ouvre sur la clôture annuelle de `n−1` : 12 000 000 contre 14 376 108. La description
d'`ancres` le dit maintenant, et renvoie au champ à lire.

### ⚡⚡ L'export ne DISAIT PAS quel exercice ses douze mois couvrent

Le document porte un compte de résultat et un bilan sur **trois** exercices, et un plan de
trésorerie de **douze mois**. Avant la story, l'ambiguïté était sans conséquence : il n'y avait
qu'un plan possible. Depuis, il en existe trois, et un banquier lit douze mois **en croyant voir
l'horizon**.

⛔ Les deux sections mensuelles portent désormais leur exercice et son millésime en clair. On
**nomme** ce que le document contient déjà — servir N+2 et N+3 reste la décision éditoriale du PO,
tracée à part.

### La rupture d'AC-5 est bien documentée là où un intégrateur la lit

Elle passe dans le schéma OpenAPI (`type: [ComparaisonMensuelDto]`), donc tout client généré la
voit, et la phrase qui l'annonce est dans une `description` **publiée**, pas seulement en
commentaire. Réserve levée : le texte ne citait que `mensuel`, alors que `ecarts.mensuel` casse
aussi. **Aucun consommateur externe** : la rupture est contenue au dépôt.

## Progress Tracking

**Statut : `done`** — clôturée le 2026-09-08. PR `bilan-service` **#113** rebase-mergée sur `dev`.
`MODELE_PROJECTION_VERSION` **1.10.0**.

### Les cinq critères d'acceptation

Les cinq sont livrés. AC-1 est prouvé **numériquement sur 25 920 combinaisons** : les produits, les
charges d'exploitation et la trésorerie d'ouverture que l'annuel publie sont exactement ceux que le
mensuel dérive. AC-5 rompt le contrat de `mensuel` (scalaire → tableau) et la rupture passe dans le
schéma OpenAPI, donc tout client généré la voit.

### Portes, rejouées sur l'état final

Mesurées **après** le dernier octet écrit, correctifs de revue compris — la leçon de STORY-478, où
une porte mesurée trop tôt avait produit une déclaration fausse deux fois.

| Porte | Résultat |
|---|---|
| Lint | 0 warning |
| Build | OK |
| Unitaires | 2 399 passés, 1 ignoré |
| e2e | 757 passés, 23 suites |
| Couverture | 99,05 st. · 94,97 br. · 99,33 fn. · 99,11 li. |

### Vérification par balayage

~12 400 plans confrontés à `dist/`, aux extrêmes du domaine : délais jusqu'à 1 080 jours, croissance
de −90 % à +200 %, marge de −200 % à +99,9 %, profils de saisonnalité et d'antériorité combinés.
**Zéro échec** sur les trois invariants — articulation nulle, clôture du mois 12 égale à celle de
l'annuel, ouverture du mois 1 égale à la clôture de `n−1`.

### Revues

**Sécurité** : 0 vulnérabilité. **Code** : 6 constats, aucun bloquant, tous appliqués — voir la
section dédiée. Les onze migrations de tests sont des changements de signature **purs** : aucun
attendu numérique modifié, aucun essai supprimé.

### Ce qui est tracé comme suite, et non fait ici

1. Renommer `tvaNetteN1` et `resultatAnnuelN1` — noms hérités du modèle mono-exercice, faux deux
   fois sur trois. Rupture de contrat pour un gain cosmétique : refusée ici, décrite dans le contrat.
2. Ouvrir l'export à N+2 et N+3 — le hook est posé et inerte, la décision est éditoriale.
3. Verser `tva.declaration` au paquet fiscal de `bilan-service` (dette héritée de STORY-478).
