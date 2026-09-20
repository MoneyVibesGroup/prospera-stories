# STORY-514 : Primes acquises ≠ primes émises — la provision pour primes non acquises

Status: in_progress

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

## Décisions de cadrage du 2026-09-20 — à relire en revue

| # | Décision | Pourquoi |
|---|---|---|
| **D-514-1** | ⛔ Le concept se nomme **« provision pour risques en cours »** partout — code, contrat HTTP, artefact | C'est le nom du **régulateur** (art. 334-8 2°). « Primes non acquises » n'apparaît **pas une fois** dans les 608 pages. Patron STORY-503 : un second nom pour un concept publié se paie à chaque état réglementaire. ⚠️ La story garde son titre d'origine — on ne réécrit pas un énoncé — mais le **livrable** emploie le vocabulaire du Code |
| **D-514-2** | La **méthode est portée par l'évaluation**, et il y en a **deux** : `FORFAIT_REGLEMENTAIRE` (art. 334-10, défaut) et `PRORATA_TEMPORIS` (faculté) | AD-2 : une provision est une évaluation **datée, versionnée, avec sa méthode et son auteur**. Imposer le prorata seul rendrait le module inutilisable par un assureur conforme au **minimum** réglementaire — et inventerait une obligation que le texte ne pose pas |
| **D-514-3** | Le **taux est une donnée de l'évaluation**, initialisée à 36 % | « La Commission peut prescrire […] un pourcentage **plus élevé** ». Un `36` en dur se périme au premier assureur sous surveillance, et l'en sortir coûterait une story par lecteur |
| **D-514-4** | Le module publie un **minimum calculé**, et l'évaluation peut porter un montant **retenu supérieur** | Art. 334-9 : le montant légal est un **minimum** assorti d'une obligation de **suffisance**. Un modèle à une seule valeur ferait du minimum un maximum |
| **D-514-5** | ⛔ Calcul **séparé par branche** (art. 328), jamais un total | Le texte l'impose en propre. Et c'est la même doctrine que l'étanchéité Vie/Non-Vie d'AD-3 |
| **D-514-6** | ⛔ **Aucun calcul actuariel inventé** (AD-12) — et il n'y en a pas à inventer | Les deux méthodes sont **prescrites par le texte**, avec leur assiette. Ce que le module fait est une **transcription**, pas une évaluation |

## Critères d'acceptation

- [ ] AC-1 — La **provision pour primes non acquises** est calculée **au prorata temporis** de la
      période couverte de chaque quittance, à la date d'arrêté. Méthode déclarée, pas supposée.
- [ ] AC-2 — Un poste de **variation** de cette provision entre au compte de résultat, et `RT`
      l'intègre. ⇒ La table de passage `cima-assurances` évolue — **nouvelle version du paquet**,
      avec son checksum et son statut.
- [ ] AC-3 — La provision est une **évaluation datée et versionnée** (AD-2, STORY-517) : elle porte sa
      méthode, sa date et son auteur.
- [ ] AC-4 — ⛔ **La prime acquise est publiée à côté de la prime émise, jamais à sa place.** Les deux
      chiffres existent, l'assureur les lit tous les deux, et confondre l'un pour l'autre est l'erreur
      que la story sert à empêcher.
- [ ] AC-5 — Test de non-régression sur un portefeuille dont **toutes** les échéances tombent au
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
- Le **poste de variation** au compte de résultat et son entrée dans `RT` — **nouvelle version du
  paquet** `cima-assurances`, recopiée dans les **trois** dépôts dans le même lot de PR.

### Hors périmètre

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
| M8 | Retirer le poste de variation de la formule de `RT` | **AC-2** |
| M9 | Rendre la méthode implicite (une seule, non portée par l'évaluation) | **AD-2 / D-514-2** |
| M10 | Autoriser l'écrasement d'une évaluation existante | l'append-only de l'évaluation |
| M11 | Un portefeuille dont **toutes** les échéances tombent au 1ᵉʳ janvier | **AC-5** : primes acquises = primes émises, variation nulle |

## Definition of Done

- [ ] Statut synchronisé dans ce document, `sprint-status.yaml` et le présent Progress Tracking.
- [ ] Lint 0 warning, build, couverture ≥ 65/90/90/90, unit + e2e verts ; **lecture PAR FICHIER**.
- [ ] M1 à M11 appliquées une par une sur l'état **final**, prouvées rouges, puis restaurées.
- [ ] ⛔ **Vérification docker réelle** : la story écrit en base. Documents, invariants, liens, aucun
      orphelin après échec — et l'**atomicité mesurée par un compteur**, comme en STORY-513.
- [ ] ⛔ **Byte-identité de l'artefact** rétablie dans les **trois** dépôts après la montée de version,
      et les PR intégrées **ensemble**.
- [ ] Version du paquet **vérifiée avant de coder** (STORY-671 et STORY-672 en demandent une aussi).
- [ ] Revue de code et revue de sécurité sans constat ouvert.
- [ ] PR module(s) vers `dev`, PR docs vers `main`, rebase-merge, branches supprimées.

## Progress Tracking

- **Statut courant :** `in_progress` — ouverte le **2026-09-20**.
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

## Notes

- Voir [[STORY-513]] (qui livre la période couverte), [[STORY-517]], [[STORY-518]] (les variations au
  CR), [[STORY-521]] (l'étanchéité Vie/Non-Vie), [[STORY-671]] et [[STORY-672]] (qui se disputent la
  même version du paquet), spine AD-1, AD-2, AD-3, AD-12.
- Source officielle : *Code CIMA 2019*, art. **334-8 2°** (définition), **334-9** (minimum et
  suffisance), **334-10** (méthode, assiette, provision spéciale, prorata en faculté, calcul par
  branche), **334-11** (réassurance — hors périmètre).
  https://cima-afrique.org/wp-content/uploads/2023/06/CODE-CIMA-2019.pdf
