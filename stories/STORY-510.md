# STORY-510 : Ratios prudentiels — capitalisation, liquidité, limitation des risques

Status: in_progress

**Complexité :** high
**Épic :** EPIC-127 — États périodiques et ratios prudentiels BCEAO
**Service :** `bilan-service` — ⚠️ **et non `microfinance-service`** (D-510-A, arbitrage user du 2026-09-19)
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-498** (le paquet prudentiel) · **STORY-508** (les engagements) · **STORY-659** (les
seuils transcrits) · **STORY-509** (les états DIMF et leur mécanique de concordance)
**Assigné :** `vivianMoneyVibesGroupes`
**Origine :** découpage `epics-microfinance-2026-08-27.md`, spine AD-10.

---

## Le fait

Les ratios prudentiels ne sont **pas** les indicateurs de portefeuille de STORY-506. Le PAR est un
outil de **pilotage** ; un ratio prudentiel est une **norme opposable** : le franchir met
l'institution en situation d'infraction, et la Commission Bancaire le constate.

L'ébauche d'épic disait qu'ils se calculent « à partir de trois matières que le module possède
déjà ». **La mesure du 2026-09-19 dit le contraire, et c'est la décision structurante de cette
story** : les assiettes que l'Instruction n°010-08-2010 écrit ne sont pas faites de crédits, elles
sont faites de **postes de balance** — `A12`, `B2D`, `L01`, `G10`, `D1E`. Le portefeuille n'en
fournit qu'une part.

## Cadrage mesuré avant de coder (2026-09-19)

Texte source relu intégralement : *Recueil des textes légaux et réglementaires régissant les SFD de
l'UMOA* (BCEAO, 176 p., sha256 `23ac4caa…a8fba844` **vérifié**), annexes I à IX de l'Instruction
n°010-08-2010, pages imprimées 95-112. Pages contrôlées **en image** là où l'extraction pouvait
mentir.

| Mesure | État constaté | Conséquence pour STORY-510 |
|---|---|---|
| Nature des assiettes | Listes de **postes du RCSFD** avec leur libellé verbatim, jamais des comptes du plan ni des crédits | Une assiette est une liste de termes `{poste, signe}`, résolue comme la concordance DIMF |
| Où vivent ces postes | 17 des 20 postes témoins figurent dans `etats-dimf-sfd-bceao@1.0` (382 postes distincts), packagé dans `bilan-service` | Le moteur se chaîne sur STORY-509, dans `bilan-service` |
| Ce que `microfinance-service` détient | Portefeuille, dépôts, parts sociales, membres, engagements, arrêtés de provision. **Aucun grand livre** ; sa contribution canonique est partielle par décision D-507-D (« ni parts sociales, ni dépôts, ni décaissements, ni trésorerie ») | Le service du sprint ne peut pas porter le calcul sans ingérer une balance qu'il ne possède pas |
| Seuils | Les 11 seuils sont déjà transcrits et sourcés dans `prudentiel-sfd-bceao@1.1` et `@1.2` (STORY-659) | Rien à retranscrire : seules les **assiettes** manquent |
| Fonds propres | Le texte donne **cinq fois la même liste**, mot pour mot : 15 postes ajoutés, 7 déduits. Sert aux annexes III, IV, VIII, IX | Une assiette nommée, définie une fois, citée par quatre ratios |
| `L70` / `L80` | Cités **des deux côtés** de cette liste : ajoutés si positifs, déduits si négatifs | Le **signe du solde** décide du côté — jamais le code, sous peine de double comptage |
| Agrégat « risques portés par une institution » | Même intitulé, **deux compositions** : annexe I = 13 postes (dont `A2A`), annexe VI = 12 (sans `A2A`). Confirmé en image, l. 200 et 636 du texte brut | Deux assiettes distinctes, jamais mutualisées |
| Annexes III, IV, VI (numérateurs) | « *obtenu à partir des tableaux annexés aux états financiers* » — **aucun compte, aucun poste** | Donnée déclarative : non dérivable d'une balance |
| Annexe VIII (dénominateur) | « **Total actif de fin de période en montants nets (B)** », puis le texte s'arrête. Et `E90 TOTAL DE L'ACTIF` porte **0 terme de concordance** dans l'artefact DIMF (STORY-509 : aucun total supposé) | Le dénominateur de la capitalisation n'existe nulle part — il ne sera pas fabriqué |
| Annexes II et V | L'assiette est la **fraction de durée résiduelle** (> 12 mois ; ≤ 3 mois), pas le solde du poste — et certaines lignes sont écrites **sans** qualificatif de durée | Aucune balance ne porte de ventilation par durée résiduelle |
| Postes hors bilan | Les annexes I, V et VI citent `N1A`, `N1J`, `N2A`, `N2J`, `N3A`, `Q1A`, `N1H`, `N1K`, `N2H`, `N2M`. L'artefact DIMF n'en porte **aucun** (préfixes présents : A…H, K, L, R, S, T, V, W, X) | La part hors bilan des trois ratios est hors d'atteinte ici |
| Annexe VII | Ni « Numérateur », ni « Dénominateur », ni `A/B x 100` : une **base** (`L80` + report déficitaire `L70`) et un **taux** (15 % minimum) | Ce n'est pas un ratio, et le produit ne le présentera pas comme tel |
| Liquidité | **Un seul** numérateur, **un seul** dénominateur, **trois** normes selon la catégorie du SFD (100 / 80 / 60 %) | Une assiette, trois seuils — et la catégorie n'est déclarée nulle part dans le produit |
| Entrée en vigueur | « *Elle entre en vigueur le 30 août 2010* » (art. 6, verbatim) | La date d'applicabilité du paquet est écrite, pas supposée |

## Décisions de cadrage du 2026-09-19 — à relire en revue

- **D-510-A — le moteur vit dans `bilan-service`.** Décision user du 2026-09-19, sur mesure et non
  sur intuition : les assiettes sont des postes de balance, et `microfinance-service` ne tient aucun
  grand livre. C'est le **même arbitrage que STORY-509**, dans le **même épic** — l'y placer aurait
  obligé à ingérer une balance étrangère (contre l'invariant « une base Mongo par service ») ou à
  publier presque tout en `INDETERMINABLE`. `sprint-status.yaml` est corrigé en conséquence.
- **D-510-B — un artefact DISJOINT, `ratios-prudentiels-sfd-bceao@1.0`.** ⛔ Aucun seuil, aucun
  poste, aucun signe dans le code. Les assiettes ne rejoignent **pas** le paquet de
  `microfinance-service` : elles viennent d'un **autre texte** (l'Instruction n°010-08-2010, quand le
  provisionnement vient du RCSFD compte 29), et ce service n'utilise aucune de ses rubriques de
  provisionnement. C'est exactement la doctrine de `etats-dimf-sfd-bceao@1.0`, manifeste disjoint du
  comptable, dans ce même service. `prudentiel-sfd-bceao@1.0/1.1/1.2` restent **aux octets** et
  `microfinance-service` n'est **pas modifié** ; ses 11 seuils y sont aujourd'hui **morts** (aucun
  code ne les lit) et le README dit lequel des deux artefacts fait foi pour un ratio.
- **D-510-C — un ratio est une fonction des états DIMF produits, pas de la balance brute.** Chaque
  terme d'assiette désigne un **poste** ; sa valeur est le montant que STORY-509 produit déjà pour ce
  poste à partir de la balance. La mécanique de concordance n'est ni recopiée ni réécrite : elle est
  **appelée**. Conséquence mesurée et voulue : `E90 TOTAL DE L'ACTIF` portant 0 terme de concordance,
  le dénominateur de la capitalisation devient `INDETERMINABLE` **par construction**, sans cas
  particulier dans le code. Chaque terme porte sa source ; un terme sans source est refusé au build.
- **D-510-C bis — un poste absent du jeu de soldes vaut zéro ; un poste hors artefact est inconnu.**
  Les deux se confondraient en un `0` silencieux. Mesure : sur les 79 postes cités par les annexes,
  **69 existent** dans `etats-dimf-sfd-bceao@1.0` et les **10 absents sont exactement les postes hors
  bilan** `N1A`, `N1H`, `N1J`, `N1K`, `N2A`, `N2H`, `N2J`, `N2M`, `N3A`, `Q1A`. Ces dix-là sont
  déclarés dans l'artefact avec leur origine `HORS_BILAN_NON_TRANSCRIT` : ils ne valent pas zéro, ils
  rendent leur assiette incomplète et leur ratio `INDETERMINABLE`.
- **D-510-D — deux assiettes pour « risques portés par une institution ».** `RISQUES_ANNEXE_I`
  (13 postes) et `RISQUES_ANNEXE_VI` (12, sans `A2A`). Le texte les donne sous le **même** intitulé
  avec deux compositions ; les mutualiser élargirait un dénominateur réglementaire et rendrait
  **conforme à tort** un SFD qui ne l'est pas.
- **D-510-E — `L70` et `L80` sont pris d'un seul côté, décidé par le signe du solde.** La liste des
  fonds propres les cite en ajout (report/résultat positif) **et** en déduction (négatif). Les sommer
  des deux côtés compte deux fois un report déficitaire. ⚡ Même famille de faute que le signe de
  concordance appliqué en multiplicateur de STORY-509 : le signe se lit, il ne se rejoue pas.
- **D-510-F — ce que le texte ne donne pas n'est pas fabriqué.** Quatre lacunes, portées par
  l'artefact et publiées telles quelles, chacune avec un motif qui la **nomme** :
  `NUMERATEUR_DECLARATIF_HORS_BALANCE` (annexes III, IV, VI) ·
  `TOTAL_ACTIF_SANS_FORMULE` (annexe VIII) ·
  `VENTILATION_PAR_DUREE_RESIDUELLE_ABSENTE` (annexes II, V) ·
  `POSTES_HORS_BILAN_ABSENTS_DE_L_ARTEFACT` (annexes I, V, VI).
- **D-510-G — l'annexe VII est une norme de dotation, pas un ratio.** Elle est transcrite comme
  telle (base + taux) et **n'est pas évaluée** : le verdict exigerait la dotation réellement
  constatée, que cette story ne détient pas. ⛔ La convention de signe du report déficitaire
  (« + Report à nouveau déficitaire » dans la formule, « après **imputation** » dans le chapeau)
  **n'est écrite nulle part dans l'instruction** : elle n'est pas tranchée ici, elle est consignée.
- **D-510-H — une assiette de liquidité, trois seuils, aucune catégorie déclarée.** Le ratio est
  calculé et publié avec ses deux termes et **les trois seuils candidats**, verdict
  `INDETERMINABLE`, motif `CATEGORIE_PRUDENTIELLE_NON_DECLAREE`. ⛔ La catégorie ne se **dérive
  jamais** des données (un SFD sans dépôt enregistré n'est pas un SFD « qui ne collecte pas de
  dépôts ») et ne se prend **jamais** en paramètre de requête : laisser l'appelant choisir son seuil
  est un trou de conformité, pas une commodité. Sa déclaration est un **hook inerte documenté**.
- **D-510-I — signalé, jamais corrigé.** Un dépassement produit un verdict `NON_CONFORME` et rien
  d'autre : aucune mesure de redressement, aucune écriture, aucun événement. Le produit constate.
- **D-510-J — le rejeu se fait sur la version applicable à la date.** L'artefact porte
  `_meta.applicableDepuis: "2010-08-30"` — verbatim de l'article 6 : « *Elle entre en vigueur le
  30 août 2010* ». Une date d'arrêté antérieure à toute version applicable rend `INDETERMINABLE` /
  `AUCUN_ARTEFACT_APPLICABLE_A_CETTE_DATE`, jamais un verdict. Une version sans `applicableDepuis`
  n'est **pas** sélectionnable par date : l'absence ne vaut pas « depuis toujours ».
- **D-510-K — un verdict porte toujours de quoi le refaire à la main.** Chaque ratio publie son
  numérateur et son dénominateur **avec le détail de leurs termes** (poste, libellé, signe, solde
  retenu), le seuil, l'opérateur, la valeur et la source. Un ratio sans ses deux termes n'est pas
  vérifiable — même exigence que « chaque écriture porte sa formule » du moteur fiscal.
- **D-510-L — la capacité, pas la route.** STORY-509 a livré les états DIMF sans les exposer, et le
  module le dit noir sur blanc. Cette story fait de même : le moteur est câblé, testé et atteignable
  par le pont du registre, aucune route ne le rend. Poser une route ici supposerait de trancher d'où
  vient la balance d'un arrêté passé — question qui n'appartient pas à cette story.

## Périmètre

### Livré

- L'artefact `ratios-prudentiels-sfd-bceao@1.0` : les 11 normes, leurs assiettes en postes, l'assiette
  commune des fonds propres, les conditions d'applicabilité, les lacunes du texte marquées, chaque
  élément avec sa source verbatim et `applicableDepuis`, packagé dans `bilan-service`.
- Son générateur (`build-ratios-prudentiels.mjs`, source → artefact déterministe + sha256 imprimé) et
  son entrée au manifeste, sur le patron exact de `etats-dimf-sfd-bceao@1.0`.
- Le moteur de ratios : résolution d'une assiette en postes **depuis les états DIMF produits**, somme
  signée sous garde d'entier sûr, quotient × 100, comparaison au seuil, verdict — ou `INDETERMINABLE`
  avec un motif nommé.
- Le résultat produit pour chaque ratio : ses deux termes détaillés, son seuil, sa source, et le
  `{code, version, checksum}` de l'artefact qui l'a produit.
- Le rejeu à une date d'arrêté passée sur la version applicable à cette date.

### Hors périmètre

- Toute **écriture** : ni collection, ni événement Kafka, ni dotation, ni mesure de redressement (D-510-I).
- **L'exposition HTTP** : comme STORY-509 dans le même épic, la story livre la **capacité** et son
  artefact, pas sa route. Hook inerte documenté, câblé et testé, pour que le branchement ne soit plus
  qu'un contrôleur (D-510-L).
- La **déclaration de la catégorie prudentielle** du SFD — hook inerte documenté (D-510-H).
- Les **données déclaratives** des annexes III, IV et VI, et le **total de l'actif** de l'annexe VIII :
  elles n'existent dans aucun artefact et ne seront pas inventées (D-510-F).
- La **ventilation par durée résiduelle** des postes (annexes II et V).
- Les **postes hors bilan** `N*` / `Q*` : ils supposeraient d'étendre `etats-dimf-sfd-bceao@1.0`,
  ce que cette story ne fait pas.
- La **convention de signe** du report déficitaire de l'annexe VII (D-510-G).
- Le **12ᵉ ratio** de l'Instruction n°016-12-2010 (financement des immobilisations, ≤ 100 %) : autre
  texte, hors de l'Instruction n°010-08-2010.
- `microfinance-service` n'est **pas** modifié ; aucune republication de `sfd-bceao@2.0` ni de
  `etats-dimf-sfd-bceao@1.0`.

## Critères d'acceptation

- [x] **AC-1 — Tout vient du paquet.** Les ratios, leurs **assiettes** et leurs **seuils** viennent
      **intégralement de l'artefact packagé**. ⛔ Aucun seuil, aucun poste, aucun signe dans le code.
      Test de mutation : changer un seuil **ou un poste d'assiette** à l'artefact change le verdict.
- [x] **AC-2 — Un ratio porte ses deux termes.** Chaque ratio est rendu avec son **numérateur**, son
      **dénominateur**, son **seuil** et son **verdict**, numérateur et dénominateur détaillés terme
      par terme (poste, libellé, signe, solde retenu) et exactement recomposables (D-510-K).
- [x] **AC-3 — Non calculable ⇒ `INDETERMINABLE`.** Un ratio dont une donnée manque rend le statut
      `INDETERMINABLE` avec un **motif qui nomme la lacune**, **jamais zéro et jamais un verdict**.
      ⚡ 4ᵉ occurrence du patron : un booléen de conformité se lit toujours avec son statut. La part
      calculable est publiée quand même — un numérateur connu et un dénominateur absent se disent.
- [x] **AC-4 — Signalé, jamais corrigé.** Un dépassement de seuil est signalé et rien d'autre : le
      produit constate, il ne décide d'aucune mesure de redressement et n'écrit rien.
- [x] **AC-5 — Rejeu daté.** Les ratios se rejouent à une date d'arrêté passée avec la **version du
      paquet applicable alors**, publiée avec son checksum. Un seuil révisé en 2026 ne rend pas non
      conforme un arrêté 2024 ; une date antérieure à toute version applicable rend `INDETERMINABLE`.
- [x] **AC-6 — Les deux compositions de « risques » restent distinctes.** Le dénominateur de
      l'annexe VI ne contient pas `A2A` ; celui de l'annexe I le contient. Un test vire au rouge si
      les deux assiettes sont mutualisées (D-510-D).
- [x] **AC-7 — `L70` / `L80` comptés une seule fois.** Un report à nouveau déficitaire est **déduit**
      des fonds propres, jamais ajouté puis déduit. Un test mesure les fonds propres d'un jeu où
      `L70 < 0` et `L80 < 0` et rougit au moindre double comptage (D-510-E).
- [x] **AC-8 — L'annexe VII n'est pas présentée comme un ratio.** Elle est publiée comme norme de
      dotation (base, taux), sans verdict, avec le motif qui dit pourquoi (D-510-G). Un test vérifie
      qu'aucun résultat ne lui porte de `numerateur`/`denominateur`.

## Table de mutations obligatoire

20 mutations **réellement appliquées** au code, à l'artefact ou à sa source, chacune prouvée rouge puis
restaurée. ⚠️ Deux d'entre elles ont d'abord **survécu** : elles ont révélé deux trous de test, comblés
avant de poursuivre (voir *Progress Tracking*).

| ID | Mutation appliquée | Ce qui vire au rouge |
|---|---|---|
| M1 | Le seuil du paquet ignoré dans la comparaison (`(seuil + 1) * d`) | 3 tests : opérateurs et bornes |
| M2 | Un poste d'assiette qui n'existe dans aucun état (`A12` → `Z99`) | **Le générateur refuse** : « le poste Z99 est déclaré dans les états mais absent de `etats-dimf-sfd-bceao@1.0` » |
| M3 | `A2A` ajouté à l'annexe VI — les deux assiettes de risques mutualisées | **Le générateur refuse** : « assiettes RISQUES_ANNEXE_I et RISQUES_ANNEXE_VI : compositions identiques — mutualisation interdite ». La mutation ne peut pas atteindre l'artefact servi ; l'assertion d'artefact reste le second filet, exercé par M11 |
| M4 | `retenuSi` ignoré — tous les termes retenus | 3 tests : report déficitaire compté deux fois |
| M5 | Signe inversé (`orientation`) | 21 tests |
| M6 | Assiette incomplète totalisée à `0` au lieu de `null` | 3 tests : AC-3 |
| M7 | Un poste sans formule n'annule plus la valeur du terme | 1 test — ⚠️ **a d'abord survécu** |
| M8 | Condition d'applicabilité ignorée — verdict de liquidité rendu | 12 tests |
| M9 | Terme réservé à l'infra-annuel retenu au 31 décembre | 1 test |
| M10 | Sélection par date qui ignore `applicableDepuis` | 3 tests du registre |
| M11 | Un octet de l'artefact modifié sans reporter son sha256 | 14 tests : le chargeur refuse |
| M12 | `source` retirée d'un terme de la transcription | **Le générateur refuse** : « source obligatoire » |
| M13 | L'annexe VII dotée d'un numérateur et d'un dénominateur | 2 tests : AC-8 |
| M14 | Garde d'entier sûr affaiblie (`isFinite` au lieu de `isSafeInteger`) | 1 test — ⚠️ **a d'abord survécu** |
| M15 | Verdict décidé sur la valeur arrondie au lieu du produit en croix | 1 test : la borne exacte |
| M16 | Les contributions d'une assiette à convention non écrite recomposent son total | 2 tests — le bloquant de revue |
| M17 | Garde de format de la date d'arrêté affaiblie (`/^.+$/`) | 2 tests : ISO complet et `JJ/MM/AAAA` |
| M18 | `d <= 0` ramené à `d === 0` dans la valeur publiée | 1 test : dénominateur négatif |
| M19 | Motif de netting non applicable ignoré | 3 tests |
| M20 | Vocabulaire de `usage` rouvert au générateur | **Le générateur refuse** : « usage « ETATS_INFRA_ANNUEL_SEULEMENT » hors vocabulaire » |

⚠️ **Trois mutations écartées parce qu'elles ne compilaient pas** — un code qui ne compile pas rend « 0 test »,
jamais un rouge : le seuil remplacé par une constante (`seuil` devenait inutilisé) et le signe comparé à une
valeur hors union. Reformulées en M1, M5 et M17, qui compilent et rougissent.

⚠️ **Le harnais de mutation a effacé les correctifs de revue une fois** : son `git checkout --` de
restauration rétablit le fichier depuis `HEAD`, et les correctifs n'y étaient pas encore. Réappliqués,
puis **committés avant** de reprendre les mutations. La règle tient en une phrase : ne jamais muter un
arbre de travail non committé.

## Definition of Done

- [ ] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [ ] `sprint-status.yaml` corrigé : `service: bilan-service` (D-510-A), avec la raison datée.
- [x] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts ; chaque fichier neuf couvert.
- [x] M1 à M20 appliquées une par une, prouvées rouges (ou refusées au build), puis restaurées.
- [x] Artefact produit par son générateur, sha256 reporté au manifeste, garde de complétude `assets/` ↔ manifeste verte.
- [x] ⚠️ Aucune écriture en base : la vérification docker porte sur le **démarrage réel** du service avec l'artefact embarqué (boot Nest, checksum dans le conteneur, 11 normes produites), pas sur une persistance.
- [ ] Revue de code et revue de sécurité sans constat ouvert.
- [ ] Branche `MNV-510`, commit français, PR vers `dev` ; PR docs vers `main` ; rebase-merge, branches supprimées.
- [x] `docs/referentiels/README-ratios-prudentiels-sfd-bceao.md` créé : provenance, pages, décisions, réserves du texte.

## Progress Tracking

- **Statut courant :** `in_progress` — ouverte le 2026-09-19.
- **2026-09-19 — cadrage mesuré :** branches `MNV-510` créées depuis `main` pour `docs/` et depuis
  `dev` pour `bilan-service`, rebasées sur leur origine. Texte officiel retéléchargé et **empreinte
  vérifiée** (`23ac4caa…`), annexes I à IX transcrites, pages sensibles relues **en image**. La
  mesure a déplacé la story de `microfinance-service` vers `bilan-service` (D-510-A, arbitrage user)
  et a révélé six pièges du texte lui-même : deux compositions pour un même agrégat, `L70`/`L80` des
  deux côtés des fonds propres, trois numérateurs déclaratifs, un dénominateur sans formule, des
  assiettes en durée résiduelle, une annexe qui n'est pas un ratio. Base de non-régression relevée
  avant toute écriture.
- **2026-09-19 — implémentation :** artefact disjoint `ratios-prudentiels-sfd-bceao@1.0` (11 normes,
  10 assiettes, 115 termes, chaque terme avec sa source verbatim), son générateur, son manifeste, son
  chargeur à checksum vérifié, et le moteur de production. Le moteur **consomme les états DIMF produits**
  au lieu de relire une balance : la concordance poste → comptes de STORY-509 n'est ni recopiée ni
  réécrite. Aucune route, aucune écriture, aucun événement — hook inerte documenté dans `bilan.module.ts`,
  comme STORY-509.
- **2026-09-19 — un constat trouvé par le test, pas par la revue :** le moteur tranchait en silence la
  convention de signe de l'annexe VII que D-510-G interdit de trancher — « + Report à nouveau déficitaire »
  appliqué littéralement rendait une base de **1 200 au lieu de 800** pour un report de −200, dans le sens
  qui **gonfle une dotation obligatoire**. Corrigé : l'assiette porte `conventionDeSigne`, le moteur publie
  ses termes et **refuse le total**.
- **2026-09-19 — porte de qualité :** lint 0 avertissement, build, **2 931 tests unitaires** (182 suites),
  couverture **99,19 % statements, 95,28 % branches, 99,41 % fonctions, 99,27 % lignes**, **822 e2e** verts.
  Base de non-régression avant la story : 2 730 tests dans `microfinance-service`, non touché.
- **2026-09-19 — mutations :** M1 à M15 appliquées une par une. ⚠️ **Deux ont survécu au premier passage** et
  ont révélé deux trous de test réels : (1) un terme écrit comme une somme de postes dont **un seul** est
  sans formule publiait la **somme partielle des autres** — aucune assertion ne portait sur le terme
  lui-même, toutes étant satisfaites par le motif de la norme ; (2) la garde d'entier sûr de l'addition
  était masquée par celle du produit en croix, qui lève **la même classe d'erreur** — le test comparait la
  classe, pas le contexte. Tests ajoutés, les deux mutations rougissent. Deux autres mutations ont été
  écartées pour non-compilation et reformulées.
- **2026-09-19 — vérification docker, sur volumes neufs :** `docker compose down -v` puis infra
  Mongo/Kafka/Redis **healthy**. `bilan-service` compile dans le conteneur (« Found 0 errors ») et
  **« Nest application successfully started »** — ⚡ c'est la seule preuve du câblage des trois providers :
  **aucun e2e de ce service ne boote `AppModule`**, contrairement à `microfinance-service`. `/health` rend
  `mongodb: up, kafka: up`. L'artefact est présent dans `dist/…/assets/` **dans le conteneur**, sha256
  `ea097779…` identique à celui du manifeste. Bout en bout sur l'artefact compilé : les 11 normes sortent,
  chacune avec ses motifs. Stack arrêtée après la preuve.
- **2026-09-19 — revue de code :** rapport dense, obtenu en rejouant mes propres mutations, en
  régénérant l'artefact et en **exécutant le moteur sur l'artefact réel**. **Un constat bloquant que mes
  tests ne voyaient pas :** le total de la base de l'annexe VII était bien refusé, mais les
  **contributions publiées la recomposaient** — `+` appliqué à la valeur absolue d'un report de −200
  rendait +200, et leur somme redonnait **1 200 au lieu de 800**, exactement le chiffre que D-510-G
  interdit, dans le sens qui gonfle une dotation obligatoire. Mes assertions portaient sur `montant`,
  jamais sur `contribution`. Corrigé : une assiette à convention non écrite publie ses montants et
  **aucune contribution**. Six autres constats retenus et corrigés : (1) la date d'arrêté n'était ni
  validée ni normalisée — `2026-12-31T00:00:00.000Z` passait pour **infra-annuel** et faisait entrer `L75`
  à côté de `L80`, résultat compté deux fois, sans exception ni motif ; (2) la règle de netting « nets des
  provisions **et des dépôts de garantie** » était transcrite mais **inerte**, seule lacune du texte qui
  n'était pas nommée — elle aurait fait sortir `NON_CONFORME` un SFD conforme le jour où les postes hors
  bilan seront transcrits ; (3) `usage` était le seul vocabulaire non fermé du générateur, une faute de
  frappe produisait un artefact **accepté** ; (4) un dénominateur négatif publiait un quotient
  (« −4,55 % ») à côté d'un `INDETERMINABLE` ; (5) un seuil décimal aurait fait lever « montant hors
  bornes » ; (6) aucun test ne faisait tourner le moteur sur l'artefact réel — c'est précisément la sonde
  qui a révélé le bloquant, elle devient une suite. Une ligne **inerte** signalée (`total = null`, dont la
  neutralisation laissait 34 tests verts) supprimée plutôt que laissée en faux filet. Constat cosmétique
  écarté : aucun. Artefact régénéré, sha256 reporté au manifeste.
- **2026-09-19 — porte rejouée après correctifs :** lint 0, build, **2 944 tests unitaires** (183 suites),
  couverture **99,2 / 95,3 / 99,41 / 99,27**, **822 e2e**. Mutations M16 à M20 sur les correctifs : toutes
  rouges ou refusées au build.
- **2026-09-19 — vérification docker REJOUÉE sur l'état final :** l'artefact ayant changé, la première
  mesure ne valait plus rien. ⚠️ Au premier essai le conteneur servait encore l'**ancien** artefact
  (`ea097779…`) — le hot-reload n'avait pas recopié l'asset, et la boucle d'attente avait matché une ligne
  de log de la session précédente. Après `docker compose restart` et filtrage des logs par horodatage :
  « Found 0 errors », « Nest application successfully started », artefact `62f6a761…` **identique au
  manifeste** dans le conteneur, `/health` `mongodb: up, kafka: up`. Stack arrêtée.
- **2026-09-19 — revue de sécurité :** **aucune vulnérabilité exploitable**. Vérifié : le `locator` ne vient
  jamais de l'appelant (manifeste statique + confinement au répertoire d'assets), le sha256 est comparé
  **avant** tout parse et toute mise en cache, la clé `enVol` est libérée à l'échec, aucun secret ni chemin
  dans les journaux, aucune route, aucun accès base, aucune lecture non scopée. Un **durcissement** retenu :
  le générateur construit son chemin de sortie depuis `meta.code`/`meta.version` sans contraindre leur forme,
  là où son voisin `build-etats-dimf.mjs` fige le préfixe et impose `/^\d+\.\d+$/`.

## Notes

- Source : Instruction n°010-08-2010 du 30 août 2010, annexes I à IX, dans le *Recueil des textes
  légaux et réglementaires régissant les SFD de l'UMOA* (BCEAO, 176 p., sha256 `23ac4caa…a8fba844`),
  pages imprimées 95-112. Décalage page PDF = page imprimée + 2.
- Voir [[STORY-498]], [[STORY-503]], [[STORY-506]] (le pilotage, qui est autre chose), [[STORY-508]],
  [[STORY-509]] (les états DIMF, dont cette story reprend la mécanique de concordance), [[STORY-659]]
  (les seuils), et la spine `architecture-microfinance-service-2026-08-27` (AD-10).
