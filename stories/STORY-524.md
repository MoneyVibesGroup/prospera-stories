# STORY-524 : Marge de solvabilité et représentation des engagements réglementés

Status: in_progress

**Épic :** EPIC-134 — États annuels CIMA et marge de solvabilité
**Service :** `bilan-service` — ⚠️ **corrigé le 2026-09-22** (D-524-1) ; l'en-tête disait `assurance-service`
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-517** (provisions hébergées) · **STORY-520** (réassurance) · **STORY-521** (Vie/Non-Vie) · **STORY-523** (catalogue des états) — tous `done`
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

Deux contrôles réglementaires que le CIMA impose, et qui sont à l'assureur ce que les ratios
prudentiels sont à l'IMF :

1. **La marge de solvabilité** — l'assureur dispose-t-il de fonds propres suffisants au regard de
   son volume d'affaires et de ses engagements ?
2. **La représentation des engagements réglementés** — les provisions techniques sont-elles
   **couvertes par des actifs admis**, dans les limites de dispersion fixées ?

⚡ **Le second est le plus mal compris et le plus structurant :** il ne suffit pas d'avoir provisionné,
il faut que le passif provisionné soit **représenté à l'actif** par des placements que la
réglementation admet, catégorie par catégorie et dans des plafonds. Un assureur peut être
correctement provisionné et **en infraction** sur la représentation.

---

# Cadrage sur le texte — fait AVANT toute ligne de code

Source : recueil officiel **CODE CIMA 2019** (cima-afrique.org, une page par article). Articles lus
verbatim : **300, 326, 334, 334-2, 334-11, 335, 335-1, 335-2, 335-3, 335-4, 335-5, 337, 337-1,
337-2, 337-3, 337-4**, croisés avec le catalogue `etats-cima@1.0` livré par [[STORY-523]] et le plan
`cima-assurances@5.0` livré par [[STORY-522]].

> ⚠️ Un texte réglementaire est republié sans préavis. Le relevé porte sa date ; un relecteur
> **recompare**, il ne se fie pas à cette page.

## Les constats mesurés

### M1 — ⛔ Le TITRE de l'article 335-2 est FAUX dans le recueil officiel

`<title>` et `data-hnd-title` de la page annoncent « entreprises visées au **2°)** de l'article
300 » — **mot pour mot le titre de l'article 335-1**. Le corps de l'article dit « entreprises visées
au **1°)** de l'article 300 » et vise les **branches 20 à 23** (vie et capitalisation), là où 335-1
vise les **branches 1 à 18** (dommages).

⇒ Se fier au titre applique les règles **vie** à un assureur **non-vie**, et inversement. **La clé de
sélection est la branche, jamais l'intitulé.** Récidive exacte du motif de [[STORY-510]] (« même
intitulé, deux compositions ») et de [[STORY-509]] (« un document officiel qui présente le même état
deux fois peut se contredire »).

### M2 — L'article 335-2 n'est pas une seconde liste : c'est 335-1 **plus deux écarts**

> « Les règles fixées à l'article 335-1 **sont applicables** aux engagements réglementés des
> entreprises réalisant des opérations dans les branches 20 à 23 de l'article 328, le plafond fixé à
> l'article 335-1 6°) étant **ramené à 35 %** pour ces branches. »

Et deux catégories **en plus** : les **avances sur contrats** et les **primes ou cotisations restant
à recouvrer de trois mois de date au plus**, « dans les limites respectives de **30 %** et **5 %**
des **provisions mathématiques** ».

⇒ Transcrire 335-2 comme une liste autonome dupliquerait six catégories et ferait diverger les deux
copies à la première correction.

### M3 — ⚡⚡ Deux catégories portent un **MINIMUM**, et l'AC-3 ne les voyait pas

| Catégorie | Texte |
|---|---|
| **1°)** valeurs d'État et assimilées | « dans la limite globale de **50 %** et avec un **minimum de 15 %** » |
| **6°)** comptes bancaires | « pour un montant **minimal de 10 %** et dans la limite de **40 %** » (35 % en vie) |

⇒ **Un modèle « engagements / actifs admis / plafond / dépassement » publie `CONFORME` sur une
insuffisance qui est une infraction.** Une catégorie se contrôle dans **les deux sens**, et les deux
sens n'existent pas partout : 2°), 3°), 4°), 5°) n'ont qu'un plafond.

### M4 — ⚡⚡ Les limites n'ont pas toutes la même **BASE** — il y en a au moins quatre

| Règle | Base de la limite |
|---|---|
| 335-1, 1°) → 6°) | montant total des **engagements réglementés** |
| 335-2 (avances, primes à recouvrer) | **provisions mathématiques** |
| 335-3 | **provision pour risques en cours** (br. 1-18 hors 4-7, 11, 12) / **provisions techniques** (br. 4-7, 11, 12) |
| 335-5 al. 2 | **provisions techniques** des br. 4-7, 11, 12 |
| 335-4 | engagements réglementés, mais **par émetteur / par immeuble** |

⇒ Un moteur à base unique calcule des dépassements faux **sans que rien ne le signale**. La base fait
partie de la règle, donc de l'**artefact** (AC-1), jamais du code.
⇒ Et **« la somme des catégories égale le total » ne peut pas tenir** : 335-3 et 335-5 sont des
dérogations qui **se superposent** aux catégories de 335-1. L'AC-3 est reformulée en conséquence.

### M5 — ⛔ L'AC-5 est **tranchée par le texte** : ce n'est pas un choix à déclarer

Article 334, dernier alinéa :

> « Les provisions techniques mentionnées au 1°) du présent article sont calculées, **sans déduction
> des réassurances cédées** à des entreprises agréées ou non […] »

⇒ L'assiette de la **représentation** est **BRUTE**. La cession n'allège pas l'assiette : elle
apparaît à l'**actif**, et l'art. 335-5 la borne (les provisions des affaires cédées « ne doivent
être représentées que par des dépôts en espèce à concurrence du montant garanti » ; créances sur
réassureurs admises « dans la limite de **20 %** » pour les branches 4-7, 11, 12).

⇒ À l'inverse, la **marge** (337-2, 337-3) intègre explicitement la réassurance par un **ratio
net/brut**. **Les deux contrôles n'ont pas la même base**, et c'est précisément l'erreur que l'AC-5
redoutait. L'artefact déclare donc la base **par contrôle**, avec la valeur que le Code impose — il
ne l'offre pas au choix.

### M6 — Deux planchers différents : jamais une constante unique

- **337-2** (dommages) — ratio sinistres nets/bruts, « sans que ce rapport puisse être inférieur à
  **50 %** », sur **les deux méthodes** ;
- **337-3** (vie) — ratio provisions mathématiques nettes/brutes, « sans que ce rapport puisse être
  inférieur à **85 %** ».

### M7 — L'article 337-3 ne prend **pas** toutes les provisions vie

> « […] calculé par rapport aux provisions mathématiques mentionnées aux **1° et 3°** de l'article
> 334-2 […] égal à **5 %** de la somme des provisions mentionnées aux 1° et 3° […] »

Soit la **provision mathématique** (1°) et la **provision de gestion** (3°). **Exclues** : la
participation aux excédents (2°), le risque d'exigibilité (4°), les autres provisions fixées par la
Commission (5°). Prendre « toutes les provisions vie » **surestime** la marge à constituer.

⇒ L'énumération des cinq postes de l'art. 334-2 est **déjà livrée par [[STORY-517]]** : elle est
réutilisée, pas redéclarée ([[STORY-503]] — « un brief qui nomme les champs a créé un second nom pour
un concept publié »).

### M8 — La deuxième méthode de l'art. 337-2 exige **TROIS exercices**

Sinistres payés des **trois derniers exercices**, recours encaissés des **trois derniers exercices**,
PSAP « constituées à la **fin du dernier exercice** » **et** « au **commencement du deuxième exercice
précédant** le dernier exercice ». Puis « un pourcentage de **25 %** au **tiers** du montant ainsi
obtenu ».

⇒ Le montant minimal est « **le plus élevé des résultats** obtenus par application des deux
méthodes ». **Une seule méthode calculable ne borne donc rien** : sans l'historique, le résultat est
`INDETERMINABLE`, jamais la première méthode servie seule.

### M9 — La marge **disponible** (337-1) n'est pas dérivable d'une seule balance

Huit éléments constitutifs, **« après déduction des pertes, des amortissements restant à réaliser sur
commissions, des frais d'établissement ou de développement et des autres actifs incorporels »**. Deux
verrous :

- **7°)** titres et emprunts subordonnés : admis « jusqu'à concurrence de **50 %** de la marge de
  solvabilité **prévue au présent article** », et **25 %** pour ceux à durée déterminée — un plafond
  **auto-référent**, qui porte sur le total dont l'élément plafonné fait partie ;
- **6°)** plus-values latentes : admises « **sur demande et justification de l'entreprise et avec
  l'accord de la Commission de Contrôle** » ⇒ **donnée décisionnelle externe**, qu'aucune balance ne
  porte et qu'aucun moteur ne peut inventer.

### M10 — ⛔ L'article 337-4 (sociétés mixtes) vise un régime transitoire **éteint**

337-4 ouvre par « conformément aux dispositions du **dernier alinéa de l'article 326** ». Or ce
dernier alinéa dit :

> « Les sociétés qui **à la date d'application du présent Code** pratiquent à la fois les opérations
> définies aux 1°) et 2°) de l'article 300 ont un délai de **trois ans** pour se mettre en conformité
> […] »

L'alinéa **précédent** pose l'interdiction sèche — celle qui fonde [[STORY-521]]. Le Code s'applique
depuis 1995 : le délai est échu depuis ~1998, et **337-4 est un article sans population**.

⇒ Une balance dérivée `INCOMPATIBLE_ART_326` ne doit **pas** produire la somme silencieuse des deux
marges : `INDETERMINABLE`, motif nommant **326** et **337-4**.

### M11 — ⛔⛔ **La prémisse de la story est fausse** : le plan ventile déjà les placements

La story écrivait que « `CA1` (*Valeurs immobilisées — placements et immobilisations*) du plan
packagé est insuffisant en l'état : la représentation exige une ventilation des placements par
catégorie admise, que la racine seule ne donne pas ».

Or **l'article 431 porte la ventilation — et il la porte avec le vocabulaire même de la
représentation** :

| Compte | Libellé (art. 431) |
|---|---|
| **23** | Valeurs mobilières et titres assimilés **(affectables à la représentation)** |
| **24** | Prêts et effets assimilés **(affectables à la représentation)** |
| **51** | Prêts **NON affectables à la représentation** |
| 21 / 28 | Immobilisations **dans le pays concerné** / Valeurs immobilisées **à l'étranger** |
| 26 · 27 | Dépôts et cautionnement · Valeurs garantissant les engagements |
| 55 · 56 · 57 | Titres de placement · Banques et chèques postaux · Caisse |

⇒ **Le régulateur a inscrit l'affectabilité à la représentation dans le libellé du compte lui-même.**
Ce n'est pas une lacune du paquet : c'est une distinction posée au niveau du compte principal.
⇒ `CA1` est un **poste d'état**, pas une racine de plan. La story confondait le poste de restitution
avec le plan de comptes qui l'alimente.
⇒ Et l'opposition *« dans le pays concerné » / « à l'étranger »* porte le contrôle de **localisation**
de l'art. 335 — il n'est pas hors d'atteinte, il est dans la structure du plan (hors périmètre ici,
cf. hooks inertes).

### M12 — ⚠️ Mais dériver l'admissibilité d'un **LIBELLÉ** serait bâtir sur du sable

`README-cima-assurances.md` ([[STORY-512]]) mesure que **26 des 79 libellés packagés sont abrégés**
par rapport au texte, et que « plusieurs perdent la restriction *dans le pays concerné* (`28`, `159`,
`517`) » — rétablissement **planifié en [[STORY-671]]**.

⇒ Lire « (affectables à la représentation) » dans un libellé packagé ferait dépendre un verdict
réglementaire d'une chaîne dont la correction est **déjà prévue ailleurs**. Récidive du motif de
[[STORY-521]] : « un test sur le nom cesserait de garder le jour où un référentiel se renomme ».
⇒ **Le rattachement compte → catégorie de l'art. 335-1 se déclare par NUMÉRO, dans l'artefact,
sourcé article par article.**

### M13 — ⚠️ Et un numéro de compte ne qualifie rien **hors de son plan**

[[STORY-521]] l'a payé : `syscohada-revise@2.1` déclare exactement les mêmes numéros que CIMA. La
table de rattachement est **propre au paquet `cima-assurances`**, et le code vérifie qu'il travaille
sur un paquet CIMA par une **propriété structurelle** du paquet — jamais par `meta.code`, qui cesse
de garder le jour où un référentiel se renomme.

### M14 — Le pont avec le catalogue de [[STORY-523]] est **déjà posé**, et il tranche la forme

| État | Libellé au catalogue `etats-cima@1.0` | Gabarit | Ce que cela impose |
|---|---|---|---|
| **C4** | « Engagements réglementés et actifs représentant ces engagements » | **`IMPOSE`**, 139 lignes | la présentation **ne s'invente pas** |
| **C11** | « Marge de solvabilité » | **`LIBRE`**, `normeContenu` = 337-1 à 337-4 | la forme est à nous — **l'AC-2 est une décision légitime** |

STORY-523 renvoie d'ailleurs nommément « le **calcul** du C11 (art. 337-1 à 337-4) » à *« EPIC-134
qui le porte en propre »*. C'est cette story.

⇒ La transcription **ligne à ligne** des états reste le lot de stories dédiées (D-523-2, champ
`lignes` délibérément absent de `@1.0`). **STORY-524 livre les contrôles, pas les états.**
⇒ `produitPar` est `null` dans l'artefact et le statut de production est **dérivé** du moteur
(D-523-5) : **rien à modifier dans `etats-cima@1.0`**.

### M15 — Règles de bord à ne pas perdre

- **335-1 in fine** — « les intérêts échus et/ou courus des placements énumérés ci-dessus sont
  **assimilés** auxdits placements » ;
- **335-1 6°)** — « les dettes nées des dépôts de garanties remboursables à moins d'un an doivent
  être **intégralement** représentées par des dépôts bancaires ou des espèces » (une règle à 100 %,
  pas un plafond) ;
- **335-1 in fine** — un sinistre dont le coût excède **5 %** des primes émises qui ramène le 6°)
  sous 10 % ouvre une **régularisation sous trois mois** : le minimum n'est pas instantanément
  opposable ;
- **335-4** — dispersion : **5 %** par organisme, pouvant aller à **10 %** « à condition que la
  valeur des titres de l'ensemble des émetteurs dont les émissions sont admises au-delà du ratio de
  5 % n'excède pas **40 %** » ; **15 %** par immeuble ou société immobilière ; **2 %** pour les
  valeurs du d) du 2°) ; et « une entreprise d'assurance ne peut affecter à la représentation de ses
  engagements réglementés plus de **50 % des actions émises par une même société** » ;
- **335** — couverture, **localisation**, congruence : actifs localisés dans l'État de souscription,
  quotité maximale **50 %** dans les autres États membres.

---

## Les décisions

**D-524-1 — Le moteur va dans `bilan-service`, pas dans `assurance-service`.** M11 et M17 du cadrage
le mesurent : **tous** les termes des deux contrôles sont des **postes de balance** CIMA — capital
(10), réserves (11, 13), report à nouveau (12), emprunts (16), frais d'établissement (20) pour la
marge disponible ; provisions techniques (31, 32, 34, 35, 38) pour les engagements réglementés ;
comptes 23, 24, 21, 26, 27, 28, 55, 56, 57 pour les actifs représentatifs. C'est l'arbitrage de
[[STORY-510]] (D-510-A), et la story le disait elle-même : « *voir STORY-510, les ratios prudentiels
IMF, **même forme*** ». S'ajoute que la **dérivation de l'agrément** qui choisit entre 337-2 et 337-3
est déjà dans le moteur ([[STORY-521]]), et que C4 et C11 sont des états de l'art. 433.
⚠️ **Et `assurance-service` ne reçoit rien.** Le paquet `etats-cima@1.0` y avait été recopié parce
que ce service PRODUIT un état du catalogue (le C10b) ; ici, aucun consommateur n'existe hors du
moteur — `ratios-prudentiels-sfd-bceao` n'est d'ailleurs recopié dans aucun autre dépôt non plus.
Recopier par symétrie aurait créé une empreinte à maintenir pour personne.

**D-524-2 — Les exigences, taux, plafonds, planchers ET bases sont packagés et sourcés.** Un nouvel
artefact `solvabilite-cima`, généré comme `etats-cima@1.0`, dont **chaque** règle porte son article.
La **base** (M4) et le **sens** du contrôle — plafond, plancher, ou les deux (M3) — sont des champs de
la règle, pas des branches du code.

**D-524-3 — Une catégorie se contrôle dans les deux sens.** Le contrat publie `plafond` et
`plancher`, l'un ou l'autre pouvant être absent, et le verdict nomme le sens franchi. Un modèle qui
ne connaît que le dépassement est refusé par le générateur.

**D-524-4 — L'article 335-2 est transcrit comme un DELTA de 335-1**, conformément à son texte (M2) :
un écart de plafond sur le 6°) et deux catégories supplémentaires. Aucune duplication des six
catégories.

**D-524-5 — La base de chaque contrôle est celle que le Code impose (M5), et l'artefact la déclare.**
Représentation : **brute** de réassurance (art. 334). Marge : **ratio net/brut** avec son plancher
propre (50 % dommages, 85 % vie). L'AC-5 devient une exigence de **transcription**, pas d'option.

**D-524-6 — Tout terme non calculable rend `INDETERMINABLE` avec un motif qui le nomme**, jamais zéro
et jamais conforme, et l'indétermination **remonte** : un terme indéterminé rend le contrôle
indéterminé. Cas nommés : agrément `INDETERMINABLE` ou `INCOMPATIBLE_ART_326` (M10), historique de
trois exercices absent (M8), plus-values du 337-1 6°) non justifiées (M9), ventilation des placements
absente de la balance.

**D-524-7 — `INDETERMINABLE` est l'issue attendue sur une balance CIMA ordinaire, et c'est un
résultat.** Comme les 11 normes de [[STORY-510]] qui n'en rendent aucune sur une balance réelle : le
produit **mesure ce qu'il ne peut pas conclure**, il ne fabrique pas un verdict pour avoir l'air de
répondre.

**D-524-8 — Aucune route n'expose les contrôles dans cette story**, comme STORY-509 et STORY-510. Le
moteur les calcule et la liasse les porte ; l'exposition HTTP est une story d'UI.

**D-524-9 — ⚠️ Un CONTRÔLE n'est pas un ÉTAT, et les deux états ne se traitent pas pareil.** Le C11 a
un gabarit `LIBRE` : produire son **contenu** (les deux termes de la marge) **est** le produire, il
n'y a aucun modèle à transcrire. Le C4 a un gabarit `IMPOSE` de **139 lignes** : produire le
**contrôle** de représentation ne produit **pas** l'état, dont la transcription reste au lot
(D-523-2). Cette story livre **les deux contrôles**, et **aucun des deux états**.

**D-524-10 — `etats-cima@1.0` n'est PAS modifié.** Y basculer `produitPar` imposerait une version
`@1.1` — les versions publiées sont **intactes octet pour octet** ([[STORY-522]]) — et la
répercussion d'un checksum dans deux dépôts, pour un état que cette story ne produit pas (D-524-9).
Le rattachement existe déjà par `normeContenu` (337-1 à 337-4) et il suffit. Le champ `produitPar`
du C11 se renseignera dans la story qui publiera l'état.

## Critères d'acceptation

- [ ] **AC-1** — Les **exigences, taux, plafonds, planchers et bases** viennent d'un artefact
      **packagé et sourcé** (article du Code CIMA), jamais du code. ⛔ Test de mutation : changer un
      plafond doit changer le verdict.
- [ ] **AC-2** — La marge de solvabilité est rendue avec **ses deux termes** — marge **disponible**
      (337-1) et marge **à constituer** (337-2 / 337-3) — et non un seul verdict. Un ratio sans ses
      termes n'est pas vérifiable à la main.
- [ ] **AC-3** — ⚠️ **Reformulée (M3, M4)** — La représentation est rendue **catégorie par
      catégorie** : engagements à représenter, actifs admis, **limite avec sa base et son sens**
      (plafond, plancher, ou les deux), et l'écart **signé**. ⛔ Une **insuffisance** sur le 1°) ou le
      6°) est une infraction au même titre qu'un dépassement. La somme des catégories **de 335-1**
      égale le total ; les **dérogations** (335-3, 335-5, 335-2) sont publiées **à part**, parce
      qu'elles se superposent.
- [ ] **AC-4** — Un contrôle **non calculable** rend `INDETERMINABLE` avec un **motif nommé**,
      **jamais zéro et jamais conforme**, et l'indétermination **remonte** aux agrégats qui en
      dépendent. ⚡ 5ᵉ occurrence du patron : un booléen de conformité se lit toujours avec son statut.
- [ ] **AC-5** — ⚠️ **Reformulée (M5)** — La base de chaque contrôle est celle que **le texte
      impose** : **brute** pour la représentation (art. 334), **ratio net/brut** avec son plancher
      propre pour la marge (337-2 : 50 %, 337-3 : 85 %). L'artefact la **déclare et la source** ; le
      code ne la décide pas, et ne l'offre pas au choix.
- [ ] **AC-6** — Les deux contrôles se **rejouent** à une date d'arrêté passée, avec la **version
      d'artefact qui s'appliquait alors**.
- [ ] **AC-7** — ⚡ **Ajouté (M11, M12, M13)** — Le rattachement compte → catégorie admise se fait par
      **numéro de compte**, déclaré dans l'artefact, **jamais par lecture d'un libellé** ; et le
      moteur vérifie qu'il travaille sur un paquet CIMA par une **propriété structurelle**, jamais
      par `meta.code`.

## Hors périmètre — hooks inertes documentés

- **Le contrôle de localisation et de congruence de l'art. 335** (actifs localisés dans l'État de
  souscription, quotité de 50 % dans les autres États membres). Le plan le rend **dicible** (comptes
  `21` vs `28`, M11), mais aucun AC ne le couvre et les libellés qui le portent sont en attente de
  [[STORY-671]] (M12). Le contrat d'artefact prévoit la place, vide.
- **La transcription ligne à ligne des états C4 et C11** : lot de stories dédiées (D-523-2).
- **L'exposition HTTP** des deux contrôles (D-524-8).
- **Les modalités d'évaluation des actifs** (art. 335-12, 335-13) : la balance porte les valeurs, le
  moteur ne les recalcule pas.
- **La solvabilité ajustée** (art. 337-5 à 337-5-6) : régime de groupe, hors EPIC-134.

## Notes

- Voir [[STORY-510]] (les ratios prudentiels IMF, même forme), [[STORY-517]], [[STORY-520]],
  [[STORY-521]], [[STORY-523]].

## Progress Tracking

- 2026-09-22 — branche `MNV-524` ouverte sur `docs/`.
- 2026-09-22 — **cadrage sur le texte fait avant tout code** : 15 constats M1-M15 relevés sur le
  recueil officiel CODE CIMA 2019. **Deux critères d'acceptation reformulés** (AC-3, AC-5), **un
  ajouté** (AC-7), **la prémisse de la story renversée** (M11), **le service corrigé** (D-524-1).

- 2026-09-22 — branche `MNV-524` ouverte sur `bilan-service`. ⚠️ La branche ouverte sur
  `assurance-service` a été **retirée** : le moteur et l'artefact vivent dans `bilan-service`, et
  aucun consommateur n'existe ailleurs (le patron `ratios-prudentiels-sfd-bceao` n'est recopié
  dans aucun autre dépôt non plus). **Deux dépôts touchés**, pas trois.

- 2026-09-22 — **DÉVELOPPÉE ET VALIDÉE**, PR `bilan-service#132` ouverte.

### Ce qui est livré

| Fichier | Rôle |
|---|---|
| `scripts/referentiels/sources/solvabilite-cima.json` | la transcription curée (source de vérité des octets) |
| `scripts/referentiels/build-solvabilite-cima.mjs` | le générateur et ses portes |
| `src/modules/bilan/referentiel/assets/solvabilite-cima-1.0.json` | l'artefact — sha256 `41c2b17f…` |
| `…/referentiel/solvabilite-cima.types.ts` | contrat de l'artefact |
| `…/referentiel/solvabilite-cima-registry.ts` | **4ᵉ manifeste**, disjoint, avec `pourReferentielALaDate` (AC-6) |
| `…/referentiel/solvabilite-cima-loader.service.ts` | chargeur fail-closed, checksum vérifié avant parse |
| `…/etats/solvabilite-cima.types.ts` | contrat de sortie (`VerdictControle`, `MotifIndeterminableSolvabilite`) |
| `…/etats/solvabilite-cima-production.service.ts` | le moteur, **pur** |
| 5 fichiers `*.spec.ts` | 97 tests |

**17 contrôles, 19 assiettes, 8 termes, 26 éléments sans compte.**

### ⛔⛔ Le fait mesuré — AUCUN contrôle ne rend de verdict

Sur `cima-assurances@5.0`, les 17 contrôles sortent `INDETERMINABLE` ou `NON_APPLICABLE`. **Ce
n'est pas un défaut de transcription, c'est le grain du plan** — et c'est ce que la story
mesure de plus utile :

| Motif | Contrôles | Ce qui manque |
|---|---|---|
| `ELEMENT_SANS_COMPTE_AU_PLAN` | 10 | 3 des 4 composantes des engagements réglementés (art. 334, 2°/3°/4°) et 5 des 8 éléments de la marge disponible |
| `VENTILATION_PAR_CATEGORIE_ADMISE_ABSENTE` | 5 | le compte **23** porte les catégories 1°) *et* 2°) (plafonds 50 % et 40 %) ; le **24** les 4°) et 5°) (20 % et 10 %) |
| `DETAIL_PAR_EMETTEUR_HORS_BALANCE` | 3 | l'art. 335-4 raisonne par émetteur et par immeuble |
| `ANTERIORITE_DES_CREANCES_HORS_BALANCE` | 2 | « trois mois de date », « un an de date » : le compte 41 n'a pas d'axe d'antériorité |
| `VENTILATION_PAR_BRANCHE_HORS_BALANCE` | 2 | les branches 4 à 7, 11 et 12 des art. 335-3 al. 2 et 335-5 al. 2 |
| `PROVISIONS_PAR_TYPE_HORS_BALANCE` | 1 | la provision pour risques en cours, agrégée dans le compte 32 |
| `LOCALISATION_HORS_BALANCE` | 1 | le 6°) exige l'État de souscription de l'établissement |
| `ACCORD_DE_LA_COMMISSION_REQUIS` · `FRACTION_VERSEE_DU_CAPITAL_NON_ISOLEE` · `PLAFOND_AUTO_REFERENT` · `PART_DES_CESSIONNAIRES_…` · `HISTORIQUE_TRIENNAL_…` · `METHODE_INDETERMINABLE` | 1 chacun | les six lacunes de la marge dommages |

⇒ **C'est un résultat, pas un échec** : la table dit exactement ce qu'un plan affiné
([[STORY-671]]) devrait isoler. Un verdict rendu aujourd'hui sur une assiette amputée serait
faux **dans le sens qui rassure**. Un test verrouille ce fait et **rougira le jour où l'un
d'eux rendra un verdict**.

### ⛔ Deux défauts que les tests ont attrapés pendant l'écriture

1. **Le rapport réducteur était compté 100 fois trop grand.** Les points de base (`÷ 10 000`) et
   les pourcentages (`÷ 100`) sont deux échelles ; les confondre surévaluait la marge à
   constituer d'un facteur 100 — c'est-à-dire déclarait `NON_CONFORME` un assureur qui ne l'est
   pas. Attrapé parce que l'attendu du test avait été **calculé à la main**, pas recopié de la
   sortie.
2. **⚡⚡ Le signe du compte 73, nié deux fois.** « Réductions et ristournes de primes » est un
   compte de la **classe 7 (produits) mais de sens débiteur** : lu selon la règle `PRODUIT`
   (crédit − débit), il rend **spontanément** une valeur négative. Lui appliquer en plus le
   « − » du texte le niait deux fois et **gonflait** les primes de leurs annulations, donc la
   marge à constituer, donc la sévérité du verdict. Même mode de panne que [[STORY-509]] : *un
   signe réglementaire appliqué comme multiplicateur à un solde déjà signé*.

### ⚠️ Et une fausse lacune, qui rendait indéterminable une assiette calculable

L'assiette des primes portait une note « pour mémoire » rangée parmi les `elementsSansCompte` —
alors que le compte 70 agrège directes et acceptations, ce qui est **exactement** ce que
l'art. 337-2 a) demande. Une note rangée au mauvais endroit rendait `null` le **seul terme
calculable de toute la marge**. Le générateur refuse désormais tout motif déclaré au
vocabulaire et employé nulle part.

### Table de mutations — 27 mutations, 27 rouges

| # | Mutation | Résultat |
|---|---|---|
| 1 | verdict de limite forcé à `CONFORME` | ✅ 4 rouges |
| 2 | `>=` → `>` dans le verdict de marge | ❌ **SURVIVANTE** → test ajouté → ✅ |
| 3 / 4 | `floor`→`round` (plafond), `ceil`→`round` (plancher) | ✅ |
| 5 / 13 | plancher du rapport neutralisé / figé à 50 % | ✅ |
| 6 | `LE_PLUS_ELEVE` retient la plus petite | ✅ |
| 7 | `some`→`every` sur les méthodes indéterminables | ✅ |
| 8 | valeur absolue retirée de `retenuSi` | ✅ |
| 9 | `elementsSansCompte` ignoré | ✅ 3 rouges |
| 10 | plafond vie appliqué au mauvais agrément | ✅ |
| 11 | motif `AGREMENT_NON_DERIVABLE` non posé | ✅ |
| 12 | `NON_APPLICABLE` → `CONFORME` | ✅ 5 rouges |
| 14 | borne de date `>` → `>=` | ✅ |
| 15 | `PRODUIT` retiré de la lecture créditrice | ✅ 9 rouges |
| 17 | insuffisance jamais détectée | ✅ |
| 18 / 20 | plafond 50 %→60 %, plancher vie 85 %→50 % | ✅ **refusés AU BUILD** |
| 19 | plancher du 1°) supprimé | ✅ |
| 21 | signe du compte 73 remis à `−` | ✅ |
| 22 | compte 39 déduit de l'assiette brute | ✅ |
| 23 | une catégorie de l'art. 335-1 retirée | ✅ **refusé AU BUILD** |
| 24 | règle de lecture inversée | ✅ |
| 25 | compte inexistant au plan | ✅ **refusé AU BUILD** |
| 26 / 27 | provider retiré des `providers` / des `exports` | ✅ |

⚠️ **M21 et M22 rejouées avec le checksum RÉALIGNÉ** : sans cela elles rougissaient d'abord par
l'empreinte épinglée (20 tests), ce qui aurait masqué si le test métier discrimine. Réalignées,
elles font rougir **2 tests métier chacune** — c'est là la preuve.

⚠️ **Une mutation ÉQUIVALENTE, dite comme telle** (M16) : comparer à la borne arrondie rend le
même verdict que le produit en croix, parce que `actifs` est entier et l'arrondi un plancher
(`actifs > floor(x)` ⟺ `actifs > x`). Ajouter un test pour « la couvrir » n'aurait rien
discriminé. L'équivalence est commentée dans le code, avec sa condition de validité.

### ⛔⛔ Une branche MORTE retirée, et une garde d'injection ajoutée

- Aucun terme ne peut rendre de contribution `null` : un compte absent vaut **réellement** zéro
  et figure dans `comptesAbsents`. La branche qui le guettait ne gardait rien — **code en
  moins**, et le contrat dit maintenant la vérité (`montant: number`).
- ⛔ **AUCUN test de `bilan-service` ne boote `AppModule`** (constat déjà relevé par
  [[STORY-510]]). Les trois providers ajoutés n'étaient donc vérifiés par aucun test
  d'instanciation — exactement le mode de panne de [[STORY-517]], où un service ne démarrait
  pas avec 1 677 unitaires verts. `bilan.module.solvabilite.spec.ts` ferme **cet** angle mort,
  en **dérivant** la liste des providers des métadonnées du module, jamais d'une liste recopiée.
  ⚠️ La garde d'exhaustivité de `AppModule` reste manquante dans ce dépôt : hors périmètre.

### Vérification docker — stack neuve

⚠️ La story **ne persiste rien** : il n'y a pas de document à compter. Ce qui se vérifie, et qui
n'est vérifiable que là, c'est que **le processus démarre et charge l'artefact**.

| Mesure | Résultat |
|---|---|
| `docker compose down -v` puis stack neuve (mongo, kafka, redis, bilan-service) | mongo + kafka `Healthy` |
| Démarrage du service **avec les 3 nouveaux providers** | `Nest application successfully started` — le graphe d'injection se résout en conditions réelles |
| `/api/v1/health` | `{"status":"ok","mongodb":"up","kafka":"up"}` |
| sha256 de l'artefact **dans le conteneur** | `41c2b17f…` = celui épinglé au registre |
| Artefact chargé **par le processus** (loader compilé de `dist/`) | `17 contrôles, 19 assiettes, applicable depuis 2016-04-08`, checksum vérifié |
| Production sur balance réelle | `13 INDETERMINABLE + 4 NON_APPLICABLE` — identique aux tests |
| Primes nettes d'annulations | **5 010 000** (5 100 000 − 90 000) — le signe du compte 73 est juste **en conditions réelles** |
| Engagements réglementés | terme brut **7 000 000**, sans déduction du compte 39 ; assiette `null` (3 composantes sans compte) |

Docker **arrêté** après vérification.

### Portes finales

Lint **0 warning** · build OK · **3 258 unitaires** + **827 e2e** verts (196 + 26 suites) ·
couverture **99 / 94,8 / 99,29 / 99,1** pour des seuils de 65/90/90/90 · moteur de solvabilité
à **100 % de lignes**.

### ⚠️ Constat annexe, hors périmètre

**Cinq comptes de gestion du plan `cima-assurances@5.0` ne sont routés vers aucun poste** de la
table de passage : `69` (charges à l'étranger), **`73` (réductions et ristournes de primes)**,
`74` (ristournes obtenues), `78` (travaux faits par l'entreprise), `79` (produits à l'étranger).
Le compte 73 est une **réduction de produit** : non routé, il laisse les primes du compte de
résultat **surévaluées de leurs annulations**. Ce n'est pas un défaut introduit par cette story
— le moteur de solvabilité lit la balance et non les états, il n'est donc pas affecté — mais il
touche la liasse CIMA et mérite sa propre story.
