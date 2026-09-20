# STORY-514 : Primes acquises ≠ primes émises — la provision pour primes non acquises

Status: done

**Complexité :** high

**Épic :** EPIC-129 — Contrats, primes et quittances
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-513** (la période couverte est portée)
**Origine :** revue de l'artefact, 2026-08-27 — écart relevé dans `cima-assurances@1.0`.

---

## Le fait, mesuré dans l'artefact

`RP1` mappe le compte `70` — **primes ÉMISES**. Et `RT` (résultat technique) vaut, dans la table de
passage packagée :

```
RT = +RP1 +RP3 +RP5 −RC1 −RC5 −…
```

**Aucune variation de provision pour primes non acquises n'y figure.**

Or une prime annuelle émise le **1ᵉʳ octobre** couvre trois mois de l'exercice et neuf du suivant.
La comptabiliser entièrement en produit de l'exercice **surestime le résultat de 75 % de cette
prime**. Sur un portefeuille dont les échéances ne sont pas uniformément réparties dans l'année —
c'est-à-dire tous les portefeuilles — l'erreur est structurelle, pas marginale.

⚠️ **Et elle est invisible** : la balance reste équilibrée, `CAT = CPT`, tous les contrôles passent.

## Cadrage mesuré avant de coder (2026-09-20)

⛔⛔ **Le Code CIMA a été dépouillé — 608 pages, texte intégral — et il déplace la story sur trois
points, dont son NOM.**

### M1 — ⚡⚡ « Primes non acquises » n'existe pas dans le Code CIMA. Zéro occurrence.

Le concept y porte un **autre nom**, et le Code le définit deux fois :

> **Art. 334-8, 2°** — « **provision pour risques en cours** : provision destinée à couvrir les risques
> et les frais généraux afférents, pour chacun des contrats à prime payable d'avance, à la période
> comprise entre la date de l'inventaire et la prochaine échéance de prime, ou à défaut, le terme fixé
> par le contrat. »

« Primes non acquises » est le vocabulaire **français / européen** (PPNA). Le régulateur de la zone,
lui, dit **« provision pour risques en cours »** — 13 occurrences, un titre de section (`I - Provision
pour risques en cours`), trois articles (334-9, 334-10, 334-11).

⛔ **C'est exactement le patron de STORY-503** : un brief qui **nomme** les champs crée un **second nom**
pour un concept déjà publié par ailleurs. Ici le publieur est le **régulateur**, et l'écart se paierait
à chaque état réglementaire et à chaque contrôle.

### M2 — ⛔⛔ La méthode de base est un FORFAIT de 36 %. Le prorata temporis est une FACULTÉ.

> **Art. 334-10** — « Le montant **minimal** de la provision pour risques en cours s'obtient en
> multipliant par le pourcentage de **36 %** les primes ou cotisations de l'exercice inventorié, **non
> annulées** à la date de l'inventaire, et déterminées comme suit : 1°) primes à échéance **annuelle**
> émises au cours de l'exercice ; 2°) à échéance **semestrielle** émises au cours du **deuxième
> semestre** ; 3°) à échéance **trimestrielle** émises au cours du **dernier trimestre** ; 4°) à
> échéance **mensuelle** émises au cours du **mois de décembre**. Les primes à **terme échu** sont
> **exclues** du calcul. Les primes payables d'avance s'entendent **y compris les accessoires et coûts
> des polices**. »
>
> « **En cas d'inégale répartition des échéances** de primes ou fractions de primes au cours de
> l'exercice, le calcul de la provision pour risques en cours **PEUT** être effectué par une **méthode
> de prorata temporis**. »

⇒ **L'AC-1 impose la méthode que le Code n'autorise qu'en dérogation**, et sous une condition nommée.

⚡ **Et pourtant l'énoncé de la story a raison sur le fond** : il écrit « sur un portefeuille dont les
échéances ne sont pas uniformément réparties dans l'année — c'est-à-dire tous les portefeuilles ». Or
« inégale répartition des échéances » est **exactement** la condition que l'art. 334-10 pose pour
ouvrir le prorata. Le raisonnement tient ; ce qui ne tient pas, c'est d'en faire la **seule** méthode.

### M3 — Ce n'est pas un montant, c'est un MINIMUM assorti d'une obligation de suffisance

> **Art. 334-9** — « Le montant **minimal** […] doit être calculé conformément aux articles 334-10 et
> 334-11. Cette provision doit être, **en outre, suffisante** pour couvrir les risques et les frais
> généraux afférents, pour chacun des contrats à prime payable d'avance, à la période comprise entre la
> date de l'inventaire et la prochaine échéance. »

⇒ Le module ne peut pas publier « la » provision : il publie un **minimum réglementaire calculé** que
l'entreprise peut — et parfois doit — **dépasser**. Un modèle qui n'admet qu'une valeur ferait du
minimum un maximum.

### M4 — Trois règles d'assiette que la story ne mentionne pas

1. **Provision spéciale pour les contrats pluriannuels** : « afférente aux contrats dont les primes sont
   payables d'avance pour **plus d'une année** […] Pour l'année en cours, le taux est celui prévu
   ci-dessus ; **pour les années suivantes il est égal à 100 %** des primes. »
2. ⛔ **Calcul séparé par BRANCHE** : « La provision pour risques en cours doit être calculée
   **séparément dans chacune des branches** mentionnées à l'article 328. » Jamais un total.
3. **Le taux n'est pas une constante** : « la Commission peut prescrire à une entreprise d'appliquer un
   pourcentage **plus élevé** que celui fixé à cet article. » Un `36` en dur se périmerait au premier
   assureur sous surveillance.

### M5 — La liasse packagée n'a aucun poste de variation, et `RT` ne l'intègre pas

Mesuré sur `cima-assurances@1.0` : `RT = +RP1 +RP3 +RP5 −RC1 −RC5 −RC8`. Les provisions techniques
brutes ont un poste de **bilan** (`CP3`, alimenté par `31`/`32`/`34`/`35`/`38`) mais **aucun poste de
variation au compte de résultat**. L'AC-2 a donc bien son objet.

⚠️ **Et trois stories se disputent la même version du paquet** : STORY-514 (ce poste de variation),
**STORY-671** (transcription des 1 052 comptes) et **STORY-672** (routage des 11 comptes de gestion
orphelins, dont `73` et `82`). Celle qui livre en premier prend la version ; les autres s'alignent.

### M6 — ⛔⛔ L'AC-2 est BLOQUÉE par STORY-671, et la livrer quand même serait PIRE que de ne pas la livrer

L'**article 432** nomme les comptes qui portent la variation, dans sa description du compte `80`
« Exploitation générale (comptes spéciaux aux entreprises de toute nature) » :

> « **Provisions de primes : 320, 340, 350, 360, 3820, 3840, 3850** et (cessions) 3920, 3940, 3950,
> 39820, 39840, 39850. »

Et l'**article 431** montre où ils vivent — **à trois et quatre chiffres** :

```
32.   Provisions techniques des opérations d'assurance directe dommages, RC et risques divers
  320.  Primes
    3200. Pour risques en cours : primes émises par anticipation
    3201. Pour risques en cours : autres primes
    3205. Pour risques croissants          3206. Pour égalisation
    3208. Pour ristournes à payer          3209. Pour annulations de primes
  325.  Sinistres
    3250. Pour sinistres à payer           3254. Provisions mathématiques
```

⛔ **`320` (Primes) et `325` (Sinistres) sont FRÈRES sous la même racine `32`.** Le plan packagé
`cima-assurances@1.0` ne porte que les **racines à 2 chiffres** (mesuré en STORY-512 : 80 sur 1 052).
Router un poste de variation sur `32` capterait donc **aussi les provisions de sinistres**, les
provisions mathématiques, l'égalisation et les ristournes à payer.

⇒ **`RT` passerait de « ignore les provisions » à « les compte toutes, en bloc ».** C'est une erreur
**plus grave** que celle que la story sert à corriger, et elle serait **invisible** : la balance reste
équilibrée, `CAT = CPT` reste vrai, et le chiffre est plausible.

⇒ **L'AC-2 n'est pas réalisable à la profondeur actuelle du plan.** Elle attend **STORY-671**, qui rend
`3200`/`3201` routables. Ce n'est pas un report de confort : c'est la différence entre un poste juste et
un poste faux.

## Décisions de cadrage du 2026-09-20 — à relire en revue

| # | Décision | Pourquoi |
|---|---|---|
| **D-514-1** | ⛔ Le concept se nomme **« provision pour risques en cours »** partout — code, contrat HTTP, artefact | C'est le nom du **régulateur** (art. 334-8 2°). « Primes non acquises » n'apparaît **pas une fois** dans les 608 pages. Patron STORY-503 : un second nom pour un concept publié se paie à chaque état réglementaire. ⚠️ La story garde son titre d'origine — on ne réécrit pas un énoncé — mais le **livrable** emploie le vocabulaire du Code |
| **D-514-2** | La **méthode est portée par l'évaluation**, et il y en a **deux** : `FORFAIT_REGLEMENTAIRE` (art. 334-10, défaut) et `PRORATA_TEMPORIS` (faculté) | AD-2 : une provision est une évaluation **datée, versionnée, avec sa méthode et son auteur**. Imposer le prorata seul rendrait le module inutilisable par un assureur conforme au **minimum** réglementaire — et inventerait une obligation que le texte ne pose pas |
| **D-514-3** | Le **taux est une donnée de l'évaluation**, initialisée à 36 % | « La Commission peut prescrire […] un pourcentage **plus élevé** ». Un `36` en dur se périme au premier assureur sous surveillance, et l'en sortir coûterait une story par lecteur |
| **D-514-4** | Le module publie un **minimum calculé**, et l'évaluation peut porter un montant **retenu supérieur** | Art. 334-9 : le montant légal est un **minimum** assorti d'une obligation de **suffisance**. Un modèle à une seule valeur ferait du minimum un maximum |
| **D-514-5** | ⛔ Calcul **séparé par branche** (art. 328), jamais un total | Le texte l'impose en propre. Et c'est la même doctrine que l'étanchéité Vie/Non-Vie d'AD-3 |
| **D-514-6** | ⛔ **Aucun calcul actuariel inventé** (AD-12) — et il n'y en a pas à inventer | Les deux méthodes sont **prescrites par le texte**, avec leur assiette. Ce que le module fait est une **transcription**, pas une évaluation |
| **D-514-7** ⛔⛔ | **L'AC-2 est REPORTÉE en attente de STORY-671**, et la story livre tout le reste | La provision pour risques en cours vit à **4 chiffres** (`3200`, `3201`) sous `320`, dont le **frère** `325` porte les sinistres. Le plan packagé s'arrêtant à 2 chiffres, un poste de variation câblé sur `32` capterait **toutes** les provisions techniques. `RT` passerait de « les ignore » à « les compte toutes » — **pire**, et **invisible**. On ne livre pas un poste faux pour cocher un AC |

## Critères d'acceptation

- [x] AC-1 — La **provision pour primes non acquises** est calculée **au prorata temporis** de la
      période couverte de chaque quittance, à la date d'arrêté. Méthode déclarée, pas supposée.
- [⏸] AC-2 — ⛔ **REPORTÉ, D-514-7 — bloqué par la profondeur du plan, pas par le temps.**
      Un poste de **variation** de cette provision entre au compte de résultat, et `RT`
      l'intègre. ⇒ La table de passage `cima-assurances` évolue — **nouvelle version du paquet**,
      avec son checksum et son statut.
- [x] AC-3 — La provision est une **évaluation datée et versionnée** (AD-2, STORY-517) : elle porte sa
      méthode, sa date et son auteur.
- [x] AC-4 — ⛔ **La prime acquise est publiée à côté de la prime émise, jamais à sa place.** Les deux
      chiffres existent, l'assureur les lit tous les deux, et confondre l'un pour l'autre est l'erreur
      que la story sert à empêcher.
- [x] AC-5 — Test de non-régression sur un portefeuille dont **toutes** les échéances tombent au
      1ᵉʳ janvier : primes acquises = primes émises, variation nulle. Un cas où le nouveau calcul ne
      change rien prouve qu'il ne casse rien.

## Périmètre

### Livré

- L'agrégat **provision pour risques en cours** — une **évaluation datée, versionnée, avec sa méthode,
  son taux et son auteur** (AD-2). Append-only : une révision est une **nouvelle évaluation**, jamais
  un montant qu'on écrase.
- Les **deux méthodes prescrites**, calculées sur les quittances livrées par STORY-513 :
  `FORFAIT_REGLEMENTAIRE` (art. 334-10, quatre catégories d'assiette, terme échu exclu, accessoires et
  taxes inclus) et `PRORATA_TEMPORIS` (faculté, sur la **période couverte** de chaque quittance).
- La **provision spéciale** des contrats pluriannuels : taux de l'exercice pour l'année en cours,
  **100 %** pour les suivantes.
- Le calcul **séparé par branche** (art. 328), jamais un total.
- ⛔ **La prime acquise publiée À CÔTÉ de la prime émise, jamais à sa place** (AC-4) : les deux chiffres
  existent, l'assureur lit les deux.
- La **variation** de la provision entre deux arrêtés, **calculée et publiée par le service** — c'est
  le chiffre que le poste de liasse consommera le jour où il pourra exister.

### Hors périmètre

- ⛔⛔ **Le poste de variation dans la liasse et son entrée dans `RT` (AC-2) — REPORTÉ, D-514-7.**
  Techniquement impossible à faire **juste** tant que le plan packagé s'arrête à 2 chiffres : la
  provision pour risques en cours est à `3200`/`3201`, sous un `320` dont le frère `325` porte les
  sinistres. **STORY-671** le débloque. ⚠️ La story livre **tout le reste**, y compris la variation
  elle-même — seule sa **présentation en liasse** attend.
- ⛔ Les **autres provisions techniques** : sinistres à payer (art. 334-12), mathématiques des rentes,
  risque d'exigibilité (art. 334-14) → EPIC-131, STORY-515 à STORY-518.
- ⛔ La **réassurance** (art. 334-11 : la part du réassureur au bilan, les abandons de primes) →
  EPIC-132. Cette story calcule la provision **brute**.
- L'**étanchéité Vie/Non-Vie** au sens des deux comptes techniques → STORY-521. Le calcul par branche
  livré ici lui donne sa matière.
- Toute **validation actuarielle** de la méthode (AD-12) : les deux méthodes sont **transcrites** du
  texte, pas évaluées.
- Le routage des comptes `73`/`82` → STORY-672 ; la transcription du plan → STORY-671.

## Table de mutations obligatoire

⚠️ À remplir **pendant** le dev. Une mutation qui ne compile pas est « 0 test », jamais un rouge
(STORY-505). ⚠️ Et une mutation doit être posée sur le chemin qui **exerce** la règle, pas sur le plus
simple à instrumenter (leçon B3 de STORY-513).

| ID | Mutation à appliquer | Ce qui doit virer au rouge |
|---|---|---|
| M1 | Taux forfaitaire codé en dur au lieu d'être lu sur l'évaluation | **D-514-3** |
| M2 | Inclure les primes à **terme échu** dans l'assiette | art. 334-10 |
| M3 | Exclure les accessoires et taxes de l'assiette | art. 334-10 |
| M4 | Prendre les primes **semestrielles** de tout l'exercice au lieu du 2ᵉ semestre | art. 334-10, 2°) |
| M5 | Appliquer 36 % aux années suivantes d'un contrat pluriannuel au lieu de 100 % | la provision spéciale |
| M6 | Sommer les branches au lieu de les séparer | **D-514-5**, art. 328 |
| M7 | Publier la prime acquise **à la place** de la prime émise | **AC-4** |
| M8 | *(sans objet — l'AC-2 est reportée, D-514-7 : il n'y a pas de poste à muter)* | — |
| M9 | Rendre la méthode implicite (une seule, non portée par l'évaluation) | **AD-2 / D-514-2** |
| M10 | Autoriser l'écrasement d'une évaluation existante | l'append-only de l'évaluation |
| M11 | Un portefeuille dont **toutes** les échéances tombent au 1ᵉʳ janvier | **AC-5** : primes acquises = primes émises, variation nulle |

## Definition of Done

- [x] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [x] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts ; **lecture PAR FICHIER**.
- [x] Mutations appliquées sur l'état **final**, prouvées rouges, puis restaurées (9 à la passe de correction, après les premières).
- [x] ⛔ **Vérification docker réelle** : la story écrit en base. Documents, invariants, liens, aucun
      orphelin après échec — et l'**atomicité mesurée par un compteur**, comme en STORY-513.
- [x] ⛔ **Aucun octet de `cima-assurances-1.0.json` touché** (D-514-7) : le checksum reste `9ca429c8…`
      dans les trois dépôts. La montée de version attend STORY-671.
- [x] STORY-671 amendée : elle porte désormais le déblocage de l'AC-2 de cette story.
- [x] Revue de code et revue de sécurité sans constat ouvert.
- [x] PR module(s) vers `dev`, PR docs vers `main`, rebase-merge, branches supprimées.

## Progress Tracking

- **Statut courant :** `done` — ouverte et clôturée le **2026-09-20**.
- **2026-09-20 — cadrage mesuré :** branche `MNV-514` sur `docs`. Prérequis STORY-513 `done` le jour
  même (la **période couverte** est portée). ⛔⛔ **Le Code CIMA dépouillé en entier déplace la story
  sur trois points** : (1) « primes non acquises » **n'y apparaît pas une seule fois** — le concept
  s'appelle **« provision pour risques en cours »** (art. 334-8 2°) ; (2) la méthode de base est un
  **forfait de 36 %** (art. 334-10), le **prorata temporis n'étant qu'une faculté** ouverte « en cas
  d'inégale répartition des échéances » — condition que l'énoncé de la story décrit d'ailleurs
  exactement ; (3) le montant légal est un **minimum** assorti d'une obligation de **suffisance**
  (art. 334-9). Trois règles d'assiette manquaient à l'énoncé : provision spéciale pluriannuelle à
  **100 %**, calcul **séparé par branche** (art. 328), et taux **relevable par la Commission**.
  Six décisions : D-514-1 à D-514-6.
- **2026-09-20 — revue de sécurité ⑦ : 3 constats, TOUS CORRIGÉS.**
  - ⛔⛔ **C2 — un double-clic pouvait murer une branche définitivement.** La tête de chaîne
    se lisait par `sort({dateArrete: -1, _id: -1})`, en justifiant le second critère par
    « à date égale, en ordre d'insertion ». **`_id` n'est pas l'ordre d'insertion** : il est
    généré **avant** la transaction, **réutilisé à chaque rejeu**, et sa partie aléatoire
    est **fixe par processus**. Chaîne `R → B → A` avec `_id(A) < _id(B)` ⇒ le tri rend `B`,
    qui a déjà un successeur ⇒ l'index refuse tout insert, **indéfiniment**, sur une
    collection append-only qu'aucune route ne répare. ⇒ **Rang attribué dans la
    transaction**, index unique, lecture par rang. ⚠️ La doublure du harnais reproduisait
    le mauvais critère **des deux côtés** : aucun test n'aurait pu le voir.
  - ⛔ **C1 — la borne ne bornait pas le travail.** `limit(2001)` bornait les documents
    **rendus**, pas **examinés** : l'index ne pouvait pas servir le tri, d'où un `SORT`
    bloquant. Mesuré : **60 000 documents examinés pour 2 001 rendus**, en transaction, sur
    une base partagée par tous les tenants. Index posé.
  - ⛔ **C3 — aucun plafond d'évaluations**, sur une collection append-only. Exactement le
    défaut corrigé en STORY-513 sur les encaissements. Borne nommée, comptée sous la
    transaction.
- **2026-09-20 — revue de code ⑥ : ⛔⛔ 10 CONSTATS, ET LA STORY N'EST PAS MERGEABLE EN
  L'ÉTAT.** Le relecteur a relu les articles **en ligne**, pas les JSDoc. Quatre constats
  sont des **erreurs de transcription réglementaire**, et deux demandent un arbitrage qui
  dépasse cette story.

  | # | Constat | Suite |
  |---|---|---|
  | 1 | Tête de chaîne sur `_id` pré-généré | ✅ **corrigé** (= C2 de la revue de sécurité) |
  | 2 | `primeAcquise = primeEmise − montantRetenu` **ignore la provision d'ouverture** ; l'identité est `primeEmise − variation`. Dès le 2ᵉ arrêté, les deux chiffres de la **même réponse** divergent. ⚠️ **Et un test verrouille la valeur fausse** | ✅ **corrigé** |
  | 3 | La **provision spéciale disparaît à l'exercice suivant** : la lecture filtre sur `exerciceDebut` en égalité, or une prime pluriannuelle n'est émise **qu'une fois**. Une reprise de 944 234 passerait en produit alors que deux tiers du risque restent à courir | ✅ **corrigé** |
  | 4 | L'assiette filtre sur `periode.debut` là où l'art. 334-10 dit **« émises »**. ⚠️ Le correctif propre exige de **persister `dateEmission`** — donc de toucher le schéma de **STORY-513, déjà mergée** | ✅ **tranché** (voir ci-dessous) |
  | 5 | La fenêtre est indexée sur le fractionnement du **contrat**, appliquée à la période de la **quittance**, et rien ne lie les deux | ✅ corrigé |
  | 6 | Le **second déclencheur** de la provision spéciale (« ou pour une durée différente ») est **élidé de la citation** et absent du code. Une police de 4 mois serait provisionnée à **53 %** du minimum légal | ✅ **corrigé** |
  | 7 | `BrancheAssurance` publie **Vie / Non-Vie** sous le nom « branche (art. 328) ». L'art. 328 énumère une vingtaine de branches d'agrément : une évaluation `NON_VIE` est **exactement le total interdit**. **D-514-5 n'est pas tenue** | ✅ **tranché** (voir ci-dessous) |
  | 8 | `primeEmise` inclut les **taxes**, que l'article ne nomme pas (« y compris les accessoires et coûts des polices »). Écart mesuré : **+18 %** sur le chiffre même de l'AC-4 | ✅ **tranché** (voir ci-dessous) |
  | 9 | L'**arithmétique exacte n'est mesurée par aucun test** : le relecteur a substitué l'implémentation naïve et **les huit entrées assertées passent** | ✅ corrigé |
  | 10 | Un test annonce une règle que sa fonction ne peut pas exercer (la coupure ne dépend pas du jour d'arrêté — la fonction ne prend pas de date d'arrêté) | ✅ corrigé |

  ⚡⚡ **Le constat 2 est la RÉCIDIVE EXACTE de la leçon de STORY-513** : un test qui
  **verrouille** une valeur fausse. Et le constat 9 celle de M5 : le critère du test est
  rendu par un **autre chemin** que celui qu'il prétend garder.

- **2026-09-20 — les trois arbitrages, tranchés DANS LE SENS DU TEXTE (décision user) :**

  | # | Décision | Motif |
  |---|---|---|
  | **D-514-8** | **`dateEmission` est PERSISTÉE**, y compris sur le schéma de STORY-513 **déjà mergée** | L'art. 334-10 classe l'assiette sur la date d'**émission**. Sans ce champ, l'assiette reste fausse **pour toujours** — exactement le raisonnement de D-513-5 sur la période couverte. ⚠️ `emiseLe` ne la remplaçait pas : c'est l'horodatage d'**insertion**, et la vérif docker les montre distinctes (01/09 déclarée, 20/09 insérée) |
  | **D-514-9** | **`branche` devient `categorie`**, et toute revendication « art. 328 » tombe | L'article classe les opérations en **vingt-trois** branches d'agrément. Publier Vie/Non-Vie sous ce nom revendiquait **exactement le total que l'article interdit** — au niveau immédiatement supérieur à celui où le module refuse de sommer. Ce qui manque est désormais un hook qui **nomme** ce qu'il n'a pas |
  | **D-514-10** | **Les taxes sortent** de l'assiette et de la prime émise | Le texte énumère « les accessoires et coûts des polices » et s'arrête là. Les taxes sont encaissées **pour le compte de l'État**, jamais un produit. Mesuré : 100 000 de taxes ne franchissent plus l'assiette (370 000, pas 470 000) |

- **2026-09-20 — les dix constats traités.** Quatre étaient des **erreurs de transcription
  réglementaire** :
  - ⛔ `primeAcquise` ignorait la provision d'**ouverture** — l'identité est
    `primeEmise − variation`. ⚠️ **Et un test verrouillait la valeur fausse** : récidive
    exacte de la leçon de STORY-513. Mesuré sur le réel : la 2ᵉ évaluation rend **133 200**
    là où l'ancienne formule rendait **0**.
  - ⛔ La **provision spéciale disparaissait à l'exercice suivant** (une prime pluriannuelle
    n'est émise qu'une fois, et la lecture filtrait le rattachement en égalité) : une
    **reprise massive** passait en produit alors que le risque courait encore. Seconde
    lecture par **chevauchement de période**, avec son index.
  - ⛔ Le **second déclencheur** de la provision spéciale — « ou pour une durée différente
    de celle indiquée aux 1°) à 4°) » — était **élidé de la citation** et absent du code :
    une police de 4 mois était provisionnée à **53 % du minimum légal**.
  - ⛔ L'assiette filtrait sur le début de couverture là où l'article dit « **émises** ».
  ⚡ **Et l'arithmétique exacte n'était mesurée par aucun test** : le relecteur avait
  substitué l'implémentation naïve, **les huit entrées assertées passaient**. Les deux
  contre-exemples sont figés, **revérifiés en sémantique JS** — dont un où le naïf passe
  **sous** la valeur exacte, c'est-à-dire sous le minimum de l'art. 334-9.
- **2026-09-20 — vérification docker sur stack NEUVE** (`down -v` : les noms d'index uniques
  ont changé). Taxes exclues de l'assiette, prime acquise chaînée, `dateEmission` distincte
  de `emiseLe`, rang de chaîne à 1 puis 2, plus aucun champ `branche` en base, `variation`
  et `primeAcquise` **absentes** (dérivées), trois nouveaux index construits, `outbox` à 0.
- **2026-09-20 — portes finales :** lint 0 warning, build OK, **1 245 unit + 51 e2e verts**,
  couverture **99,49 / 93,90 / 98,91 / 99,50**, **9 mutations** rouges sur l'état final.
- **2026-09-20 — ⛔⛔ L'AC-2 EST BLOQUÉE, et c'est la mesure qui le dit.** L'art. 432 nomme les comptes
  qui portent la variation (« Provisions de primes : **320**, 340, 350, 360, 3820… ») et l'art. 431
  montre qu'ils vivent à **trois et quatre chiffres** : `3200` « Pour risques en cours : primes émises
  par anticipation » et `3201` « …autres primes », sous `320` **dont le frère `325` porte les
  sinistres**. Le plan packagé n'ayant que les racines à 2 chiffres (80 sur 1 052, mesuré en
  STORY-512), un poste câblé sur `32` capterait **toutes** les provisions techniques — sinistres,
  provisions mathématiques, égalisation, ristournes à payer comprises.
  ⇒ `RT` passerait de « ignore les provisions » à « les compte toutes, en bloc » : **pire** que le
  défaut d'origine, et **invisible** (`CAT = CPT` reste vrai). **D-514-7** : l'AC-2 attend STORY-671.
  On ne livre pas un poste faux pour cocher un AC.

## Notes

- Voir [[STORY-513]] (qui livre la période couverte), [[STORY-517]], [[STORY-518]] (les variations au
  CR), [[STORY-521]] (l'étanchéité Vie/Non-Vie), [[STORY-671]] et [[STORY-672]] (qui se disputent la
  même version du paquet), spine AD-1, AD-2, AD-3, AD-12.
- Source officielle : *Code CIMA 2019*, art. **334-8 2°** (définition), **334-9** (minimum et
  suffisance), **334-10** (méthode, assiette, provision spéciale, prorata en faculté, calcul par
  branche), **334-11** (réassurance — hors périmètre).
  https://cima-afrique.org/wp-content/uploads/2023/06/CODE-CIMA-2019.pdf
