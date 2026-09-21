# STORY-518 : `RT` cesse d'être un résultat de trésorerie — les variations de provisions techniques entrent au compte de résultat

Status: done

**Complexité :** high

**Épic :** EPIC-131 — Provisions techniques ⚠️ **PALIER 2**
**Service :** `assurance-service` + référentiel `cima-assurances`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-514** (primes non acquises) · **STORY-517** (les provisions hébergées)
**Origine :** revue de l'artefact, 2026-08-27 — **AD-1** de la spine.

---

## Le fait, mesuré dans l'artefact

```
RT = +RP1 +RP3 +RP5 −RC1 −RC5 −…
```

`RP1` = primes **émises** (compte `70`). `RC1` = prestations **payées** (compte `60`). **Aucune
variation de provision technique.**

⇒ **`RT` est aujourd'hui un résultat d'encaissements et de décaissements, sous un libellé qui dit
« résultat technique ».** Un assureur dont les primes croissent verra un `RT` flatteur : les primes
entrent tout de suite, les sinistres se paient plus tard. **C'est structurellement le contraire de
ce qu'un compte technique doit montrer.**

À porter au crédit de l'auteur de l'amorce : le libellé du poste **le dit** — *« amorce, hors
variations de provisions techniques et séparation Vie/Non-Vie »*. Cette story est la levée de cette
réserve, et elle est **la raison d'être du palier 2**.

## Le résultat technique, tel qu'il doit se calculer

```
  primes acquises            = primes émises ± Δ provision pour primes non acquises
− charges de sinistres       = prestations payées ± Δ PSAP
− Δ autres provisions techniques (risques en cours, mathématiques vie)
± part des réassureurs (STORY-520)
− commissions et frais imputables au technique
= RÉSULTAT TECHNIQUE
```

## Cadrage mesuré avant de coder (2026-09-21)

⛔⛔ **Le Code CIMA a été dépouillé sur ce point précis, et il déplace la story : les postes de
variation du compte d'exploitation générale ne sont PAS des comptes de charges ou de produits — ce
sont des comptes de la CLASSE 3.** Source : PDF officiel consolidé *CODE CIMA 2019* (608 p.,
`cima-afrique.org/wp-content/uploads/2023/06/CODE-CIMA-2019.pdf`, sha… md5 `2e61c61e2a58…`, texte
extrait localement) et page officielle de l'article 431 (`Article431Listedescomptes.html`).

### M1 — ⚡⚡ L'article 432 ÉNUMÈRE les postes du compte 80, et il les alimente par la classe 3

> **Art. 432, « 80. Exploitation générale »** — « Le compte 80 fait apparaître les résultats de
> l'exercice […]. Le compte 80 est établi conformément au modèle prévu à la section IV. **Les comptes
> constituant les postes du compte 80 sont indiqués dans les listes ci-après.** »
>
> *80. Exploitation générale (comptes spéciaux aux entreprises de toute nature)*
> « Prestations et frais payés : 602, 604, 605, 606, 6902, 6904, 6905 et (cessions) 609, 6909.
> **Provisions de sinistres : 325, 355, 3825, 3855 et (cessions) 3925, 3955, 39825, 39855.**
> Primes : 702, 704, 705, 706, 7902, 7904, 7905 et (cessions) 709, 7909.
> **Provisions de primes : 320, 340, 350, 360, 3820, 3840, 3850 et (cessions) 3920, 3940, 3950,
> 39820, 39840, 39850.** »
>
> *80. Exploitation générale (comptes spéciaux aux sociétés vie et capitalisation)*
> « **Provisions mathématiques : 310, 340, 3810, 3840 et (cessions) 3910, 3930, 3940, 3960, 39810,
> 39840.** »

⇒ **Le régulateur nomme TROIS postes de variation** — *provisions mathématiques* (Vie), *provisions
de sinistres*, *provisions de primes* — et **aucun** n'est alimenté par un compte de gestion.

⚠️ **Mesuré, et contre-intuitif : il n'existe AUCUN compte de charge ou de produit de variation de
provision technique dans le plan CIMA.** Recherche du mot « variation » dans toute la liste de
l'article 431 : **deux** occurrences seulement, et ni l'une ni l'autre n'est une provision technique
du passif — `655. Variation de commissions sur primes acquises et non émises` et `7024. Variation de
la provision de primes acquises et non émises`. La classe 6 s'arrête à des prestations **payées ou
échues** (`601`, `602`, `604`, `605`, `609`) ; la classe 7 à des primes **émises** (`701`, `702`,
`704`, `705`, `709`). ⇒ **Chercher un compte 6/7 de variation, c'est chercher ce que le texte ne
contient pas.** Patron [[story-512-recherche-negative-prouve-le-vocabulaire]], appliqué à l'endroit
où il fallait : la recherche négative prouve ici une **absence structurelle**, pas un défaut de
vocabulaire.

### M2 — ⛔ Au niveau de détail RÉELLEMENT servi, les trois postes ne sont pas séparables

Les comptes cités par l'article 432 sont à **3, 4 et 5 chiffres** (`320`, `325`, `3820`, `39825`…).
Le plan packagé de `cima-assurances@1.0` porte **80 racines à 2 chiffres** et rien d'autre
(STORY-512 F1 : l'article 431 en énumère 1 052 sur quatre niveaux, **972 manquent**, et leur
transcription est **STORY-671**, `ready-for-dev`).

⛔ **Et ce n'est pas seulement une question de rattachement** : `longueurCompteDetail: 6` étant
déclaré depuis STORY-512 (D-512-6), `ramenerAuPlan` **ramène toute ligne de balance à son compte de
plan** — `3250` (sinistres à payer) et `3200` (risques en cours) **fusionnent tous deux sur `32`**, et
leurs soldes sont sommés. Les trois postes du compte 80 sont donc **indiscernables** tant que
STORY-671 n'a pas transcrit le plan, quelle que soit la table de passage écrite ici.

⇒ **Ce qui reste séparable, et que le texte impose de séparer, c'est le BRUT et les CESSIONS** :
`31/32/34/35/38` au passif (poste `CP3`) contre `39` à l'actif (poste `CA2`). L'article **334-11**
en fait une interdiction, pas une présentation : « La provision […] relative aux cessions en
réassurance […] **ne doit en aucun cas être portée au passif du bilan pour un montant inférieur à
celui pour lequel la part du réassureur […] figure à l'actif.** » Deux postes, jamais une différence
— même règle que l'AC-5 de STORY-517.

### M3 — ⚠️ Six des 27 comptes cités par l'article 432 n'existent pas à l'article 431

Vérifié un par un contre la page officielle : `360`, `3910`, `3930`, `3950`, `3955`, `3960` sont
**cités par le compte 80 et absents de la liste des comptes**. Le Code se contredit ici comme il se
contredit sur la profondeur (STORY-512 F5) et sur `6126`/`6026` (F6). ⇒ **À reporter tel quel dans
STORY-671**, qui transcrira la liste : une transcription qui « complète » l'article 431 avec les six
comptes du 432 inventerait une liste que le régulateur n'a pas publiée.

### M4 — ⛔⛔ Aucun montant calculé par `assurance-service` ne peut atteindre la liasse aujourd'hui

C'est la mesure qui tranche **M5 de STORY-517** (« c'est STORY-518 qui dira laquelle des deux
sources — *calculée* (STORY-514) ou *hébergée* (STORY-517) — entre au compte de résultat »).

| Voie | État mesuré |
|---|---|
| Adaptateur de balance (AD-5) | **N'existe pas.** `assurance-service/src/kafka/outbox/outbox.module.ts` : « ⛔ **Aucun producteur n'écrit dans cette outbox aujourd'hui, et c'est une décision, pas un oubli** » — D-511-I réserve la publication d'une balance canonique à une story dédiée |
| Entrée du compte de résultat | `CompteResultatProductionService.produire(pkg, soldesN, soldesN1?, surcharges?)` — **trois entrées seulement** : deux jeux de soldes et les **surcharges de rattachement** d'organisation (STORY-058, `compte → poste`). Aucune n'accepte un montant |

⇒ **La réponse est : NI l'une NI l'autre, aujourd'hui.** Ce qui entre au compte de résultat, c'est la
**balance** — et le registre (STORY-517) comme le calcul (STORY-514) restent la matière de
l'adaptateur AD-5, nommés en **hook inerte documenté**. Inventer ici un canal registre → liasse
serait construire AD-5 en marge de la story qui le cadre.

⚡ **Et l'AC-5 est honorée sur le fond, pas contournée** : la variation se lit sur les **deux colonnes
d'arrêté** (`soldesN` et `soldesN1`), c'est-à-dire sur la provision **telle qu'arrêtée à chaque date**
— jamais sur une réévaluation postérieure. C'est exactement ce que `enVigueurALaDate`
(`provisions-techniques.repository.ts`) garantit côté registre : `dateEvaluation: { $lte: dateArrete }`.

### M5 — ⚡ La mécanique de variation existe déjà, mais pas dans le contexte du compte de résultat

L'AC-1 dit « la mécanique existe déjà (`EvaluateurFormule`) ». Vérifié : `Operande` porte
`mode?: 'VALEUR' | 'VARIATION' | 'VALEUR_N_1' | 'VARIATION_BRUT'` et `etatSource?`, et `VARIATION`
(`N − N-1`) est **exercée en production** par le TFT SYSCOHADA (8 opérandes `VARIATION`, 26 opérandes
`etatSource: BILAN_PASSIF`).

⛔ **Mais le contexte d'évaluation du compte de résultat ne contient QUE les postes de détail du CR**
(`contexteDetailCR`, `compte-resultat-production.service.ts`) : une opérande visant
`BILAN_PASSIF:CP3` lève `OperandeNonResolueError`. Le TFT, lui, construit un `contexteMultiEtats`
parce que **lui** reçoit le bilan déjà produit.

⇒ **La table de passage ne suffit donc pas** — contrairement à ce que l'AC-1 supposait. Il faut, en
plus, que la passe d'agrégation du CR **sème aussi les postes de bilan**, qu'elle calcule déjà sur la
même balance (`agreger()` parcourt toute la balance et connaît toute la table de passage). Aucune
entrée nouvelle, aucun endpoint nouveau, aucune donnée inter-services.

### M6 — ⛔⛔ Le poste terminal des SIG est comparé au résultat de la balance : `RN` ne peut pas bouger

`CompteResultatProductionService` publie `coherenceSig = { resultatNetSig, resultatNetDirect, ecart,
coherent }`, où `resultatNetSig` est la valeur du **dernier** poste `FORMULE` du CR (aujourd'hui `RN`)
et `resultatNetDirect` vaut `Σ_CR (crédit − débit)` sur toute la balance. Le contrôle
`COHERENCE_RESULTAT` et l'articulation `RN == bilan.controle.resultatNetN` en dépendent, et la
liasse CIMA les asserte déjà (`cima-assurances-liasse.spec.ts`, AC-9/AC-10).

⛔ Faire cascader la variation jusqu'à `RN` rendrait `ecart` égal à la variation et **ferait passer
tout dossier CIMA en `ANOMALIE`**, sur une balance pourtant parfaitement équilibrée. Et ce serait
arithmétiquement inévitable : une balance est équilibrée, donc `totalActif − totalPassif = Σ_CR
(crédit − débit)` **par construction** — le résultat qui ferme `CAT = CPT` est celui des classes 6/7,
quoi que vaille la classe 3.

⇒ **`RT` prend les variations ; `RN` reste ancré à la balance**, et cesse pour cela de cascader depuis
`RT` : il énumère ses opérandes de détail. Leur écart n'est pas une incohérence, c'est **l'écriture
d'inventaire que les livres ne portent pas encore** — le plan CIMA la passe contre le **compte 80**,
qu'**aucun poste du CR ne réclame** (classe 8 déclarée en `racinesDeGestion` et rattachée à rien :
c'est **STORY-522**). Le libellé de `RN` le dit, et le contrôle reste vert.

## Décisions de cadrage du 2026-09-21

| # | Décision | Pourquoi |
|---|---|---|
| **D-518-1** | La source de la variation est **la BALANCE** (colonnes d'arrêté `N` et `N-1`), ni le registre hébergé (517) ni le calcul (514) | **Mesuré (M4)** : aucun canal ne porte un montant d'`assurance-service` jusqu'à la liasse, et D-511-I **réserve** l'adaptateur AD-5 à sa propre story. Tranche M5 de STORY-517, et pose le **hook inerte** |
| **D-518-2** | **Deux** postes de variation — `RV1` provisions techniques **brutes** (← `CP3`) et `RV2` **part des cessionnaires** (← `CA2`) — et **non les trois** du compte 80 | **Mesuré (M2)** : à 2 chiffres, `ramenerAuPlan` fusionne `3200` et `3250` sur `32` ; les trois postes sont indiscernables jusqu'à **STORY-671**. Le brut/cessions, lui, est séparable **et interdit de compensation** (art. 334-11) |
| **D-518-3** | `RT` **perd** la réserve « hors variations de provisions techniques » et **garde** « hors séparation Vie/Non-Vie » | L'AC-3 dit « perd sa mention *amorce* **uniquement quand les variations sont effectivement calculées** ». Le même libellé réserve **deux** choses ; la seconde est **STORY-521**. La retirer ici serait le même mensonge sur l'autre moitié |
| **D-518-4** | La passe d'agrégation du CR **sème aussi les postes de bilan** dans le contexte d'évaluation | **Mesuré (M5)** : sans cela l'opérande `etatSource: BILAN_PASSIF` lève `OperandeNonResolueError`. `agreger()` parcourt **déjà** toute la balance avec **toute** la table de passage : le semis ne coûte aucune entrée nouvelle. Patron du `contexteMultiEtats` du TFT |
| **D-518-5** | `RN` **cesse de cascader depuis `RT`** et énumère ses opérandes de détail ; son libellé dit pourquoi | **Mesuré (M6)** : le poste terminal est confronté à `Σ_CR (crédit − débit)`. Laisser la variation y entrer ferait passer **tout** dossier CIMA en `ANOMALIE` sur une balance équilibrée. L'écart `RT`/`RN` est l'**écriture d'inventaire** que le compte 80 porte et qu'aucun poste ne réclame ⇒ **STORY-522** |
| **D-518-6** | `cima-assurances@2.0` devient la version **SERVIE** (`REFERENTIEL_SERVI`, `PONT_TAG['CIMA']`), `@1.0` reste **packagée et intacte** | Publier `@2.0` sans la servir livrerait un paquet **inerte** — le défaut mesuré de [[story-173-cors-bff-admin]]. ⚠️ `estHabiliteParmi` compare le couple **exact** : une organisation habilitée au seul `cima-assurances@1.0` sera refusée tant que le catalogue ne lui octroie pas `@2.0`. **Migration = souci de prod, différé** (CLAUDE.md) |
| **D-518-7** | Les six comptes cités par l'art. 432 et absents de l'art. 431 (`360`, `3910`, `3930`, `3950`, `3955`, `3960`) sont **consignés ici**, pas « complétés » | **Mesuré (M3)**. Une transcription qui comble la contradiction du Code inventerait une liste que le régulateur n'a pas publiée. Matière pour **STORY-671** |

## Périmètre

### Livré

- Sources `postes-cima-v2.json` et `table-de-passage-cima-v2.json`, entrée `cima-assurances@2.0` dans
  `build.mjs`, artefact `cima-assurances-2.0.json` généré — **`@1.0` intact, octet pour octet**.
- Deux postes de variation `RV1` / `RV2` au `COMPTE_RESULTAT`, en `FORMULE`, opérande unique
  `mode: 'VARIATION'` + `etatSource` visant `CP3` / `CA2`.
- `RT` = ancienne formule **−`RV1` +`RV2`**, libellé amendé (D-518-3) ; `RN` en opérandes de détail
  (D-518-5), libellé amendé.
- `CompteResultatProductionService` : semis des postes de **bilan** (N et N-1) dans le contexte
  d'évaluation des SIG.
- Artefact recopié **byte-identique** dans `balance-service` et `assurance-service`, manifestes,
  digests épinglés, snapshot du catalogue, et bascule de la version servie (D-518-6).
- Hook inerte documenté : registre (517) / calcul (514) → adaptateur de balance AD-5.

### Hors périmètre

- ⛔ **L'adaptateur de balance AD-5** — réservé par D-511-I à sa propre story.
- ⛔ **La séparation Vie / Non-Vie** des comptes techniques → **STORY-521**.
- ⛔ **Le rattachement de la classe 8** (dont le compte `80`, qui porte l'écriture d'inventaire) →
  **STORY-522**.
- ⛔ **La transcription du plan à 3/4/5 chiffres**, qui seule rendra séparables les trois postes du
  compte 80 → **STORY-671**.
- ⛔ **La part des réassureurs dans les prestations** au CR → **STORY-520**.

## Critères d'acceptation

- [x] AC-1 — De nouveaux postes de **variation** entrent au compte de résultat CIMA, et `RT` les
      intègre en `FORMULE` avec **opérandes signées**. ⚠️ **Amendé par M5** : la table de passage ne
      suffit pas — le contexte d'évaluation du CR doit aussi porter les postes de **bilan**
      (D-518-4), sans quoi l'opérande lève `OperandeNonResolueError`.
- [x] AC-2 — Nouvelle **version du paquet** `cima-assurances@2.0`, avec son checksum, **byte-identique
      entre les trois dépôts** (`bilan-service` source des octets, `balance-service`,
      `assurance-service` — règle AD-6 / STORY-368). ⚠️ `@1.0` reste packagé et **intact** : les
      versions coexistent, comme `sfd-bceao@1.0` et `@2.0`. ⚡ Et elle est **servie** (D-518-6), sinon
      le livrable est inerte.
- [x] AC-3 — ⛔ Le libellé de `RT` **perd la réserve « hors variations de provisions techniques »** —
      et **garde** « hors séparation Vie/Non-Vie », qui est STORY-521 (D-518-3). Le retirer en entier
      serait le mensonge le plus coûteux du programme, simplement déplacé sur l'autre moitié.
- [x] AC-4 — Un test compare `RT` **avec** et **sans** variations sur un jeu où les provisions
      **bougent d'un arrêté à l'autre** : l'écart doit être significatif. ⚡ Un test où les deux
      donnent le même chiffre ne prouve rien — c'est ce que la version actuelle produit déjà.
- [x] AC-5 — Les provisions consommées sont **celles arrêtées à la date d'arrêté**, jamais une
      réévaluation postérieure : la variation se lit sur les deux colonnes `soldesN` / `soldesN1`
      (D-518-1), et **jamais** sur la dernière valeur connue.
- [x] AC-6 — ⛔ **Aucune régression sur les contrôles** : `EQUILIBRE_BILAN` et `COHERENCE_RESULTAT`
      restent `OK` sur une balance CIMA équilibrée, et l'articulation `RN == bilan.controle.resultatNetN`
      tient (M6). Un dossier `@1.0` produit **exactement** les mêmes états qu'avant.
- [x] AC-7 — La **variation indéterminée** (aucun jeu `N-1` fourni) ne devient **jamais `0`** : `RT`
      ressort indéterminé, jamais un chiffre faux présenté comme juste.

## Notes

- Voir [[STORY-514]], [[STORY-517]], [[STORY-520]], [[STORY-521]], [[STORY-522]], [[STORY-671]],
  spine AD-1/AD-10.
- Sources officielles dépouillées le 2026-09-21 : *Code CIMA 2019* (PDF consolidé, 608 p.),
  art. **432** (« 80. Exploitation générale », listes des comptes constituant les postes),
  art. **431** (liste des comptes, page officielle), art. **334-11** (compensation interdite).

## Progress Tracking

**Statut : `done` le 2026-09-21.** Quatre dépôts, quatre branches `MNV-518`, quatre PR
rebase-mergées sur `dev` : `bilan-service#127` · `balance-service#110` · `assurance-service#8` ·
`platform-catalog-service#22`.

### Ce qui est livré

| Dépôt | Contenu |
|---|---|
| `bilan-service` | sources `postes-cima-v2.json` / `table-de-passage-cima-v2.json`, entrée `@2.0` dans `build.mjs`, artefact `cima-assurances-2.0.json` (`e779903a…`), manifeste, **et le semis des postes de Bilan dans le contexte d'évaluation du CR** |
| `balance-service` | artefact recopié byte-identique, manifeste, `PONT_TAG['CIMA'] → @2.0` |
| `assurance-service` | artefact recopié byte-identique, manifeste, `REFERENTIEL_SERVI → @2.0`, garde de byte-identité passée à deux artefacts |
| `platform-catalog-service` | snapshot des paquets, pack `assurance-cima → @2.0`, écart au front déclaré **avec sa garde de version nommée** |

⛔ **`cima-assurances@1.0` n'a pas bougé d'un octet** : `9ca429c8ae8a1ae1c7f64310dc0e09b0c6da4c9031aff171b721d1d9728c8d04`
dans les trois dépôts et dans les trois conteneurs. Le résultat technique de `@1.0` ayant été
attribué à des organisations, le corriger en place aurait réécrit un chiffre déjà servi.

### Le défaut trouvé pendant le développement, par le test de l'AC-7

`EvaluateurFormuleService` réinjectait un agrégat **indéterminé** sous la forme d'un `0` dans le
contexte de cascade (`valeurN: valeurN ?? 0`, avec un commentaire qui l'assumait). Conséquence
mesurée : **sans jeu N-1, `RT` ressortait à 22 000** — c'est-à-dire *exactement* le résultat de
trésorerie de `@1.0`, republié sous le libellé du résultat technique corrigé. L'indétermination se
propage désormais, et l'agrégat n'est **pas émis** plutôt que publié à zéro.

⚡ Ce défaut était **latent depuis STORY-110** : aucun paquet ne portait d'opérande `VARIATION` au
compte de résultat, donc la branche n'était pas atteignable. C'est CIMA `@2.0` qui l'a rendue
atteignable, et c'est l'AC-7 qui l'a attrapée.

### Table de mutations — `bilan-service` (committé avant de muter)

| # | Mutation | Verdict |
|---|---|---|
| M1 | `RT` : le signe de `RV1` passe de `-` à `+` | **4 rouges** / 17 |
| M2 | `RV1` : `mode: VARIATION` retiré (retombe sur `VALEUR` = le **stock**) | **7 rouges** / 17 |
| M3 | `RN` cascade de nouveau depuis `RT` (l'ancienne formule) | **5 rouges** / 17 |
| M4 | évaluateur : retour du `?? 0` à la réinjection en cascade | **3 rouges** / 77 |
| M5 | `choisirPosteBilan` : suppression de l'arbitrage par le sens du solde | ⛔ **NE COMPILE PAS** (paramètre inutilisé) |
| M5 bis | `choisirPosteBilan` : **inversion** de l'arbitrage (actif ⇄ passif) | **2 rouges** / 60 |
| M6 | `semerPostesBilan` : le semis ne sème plus rien | **29 rouges** / 77 |

⚠️ M5 rappelle la leçon de STORY-517 : **une mutation qui ne compile pas ne mesure rien.** Retirer
l'arbitrage rendait le paramètre `solde` inutilisé, `tsc` refusait, jest rendait « 0 test ».
Reformulée en **inversion**, elle rougit.

### Table de mutations — `platform-catalog-service`

| # | Mutation | Verdict |
|---|---|---|
| MC2 | le couple du front **remplacé** au lieu d'être servi | **1 rouge** |
| MC3 | une **famille étrangère** ajoutée au pack | **1 rouge** |
| MC4 | `@2.0` octroyée mais **absente** du snapshot des paquets | **1 rouge** |
| MC5 | écart déclaré, mais le pack retombé sur `@1.0` | **2 rouges** |
| MC6 | la charnière : une clé ajoutée **sans** sa garde de version | **1 rouge** |

⛔ **Une première passe de mutations n'a rien mesuré** et il faut le dire : le harnais restaurait
depuis `HEAD` alors que le travail n'était **pas encore committé**, donc MC3 et MC4 s'exécutaient
contre un pack inchangé et « survivaient » sans rien prouver. Committer **avant** de muter, toujours
— [[git-checkout-efface-le-travail-non-committe]], pour la seconde fois.

### Vérification docker — stack réelle, `docker compose up`

Aucune écriture en base n'est faite par cette story ; ce qui est vérifié ici, c'est que le paquet est
**réellement servi** et que le chiffre **change réellement**.

| # | Vérification | Résultat mesuré |
|---|---|---|
| V1 | `GET /api/v1/referentiels` sur `bilan-service` | **7 paquets**, dont `cima-assurances@2.0`, checksum `e779903a…`, `statut: amorce` |
| V2 | `sha256sum` de l'artefact **DANS les trois conteneurs** (règle AD-6) | `e779903a…` identique partout ; `@1.0` à `9ca429c8…` partout |
| V3 | `POST /dossiers/:id/bilan/etats/compte-resultat/dry-run`, org habilitée `@2.0` | `RV1 = 1 500 000` · `RV2 = 500 000` · **`RT = 1 200 000`** · `RN = 1 000 000` |
| V4 | `coherenceSig` sur le même appel | `{ resultatNetSig: 1 000 000, resultatNetDirect: 1 000 000, ecart: 0, coherent: true }` |
| V5 | **même balance**, organisation restée sur `@1.0` | **`RT = 2 200 000`** — l'écart de `1 000 000` est la variation, et rien d'autre |
| V6 | **même appel sans colonne N-1** | `sig = ['RN']` — **`RT` absent**, ni `0`, ni `2 200 000` |

⚡ V5 est l'AC-4 mesurée **sur la stack**, pas en unitaire : 2 200 000 contre 1 200 000 sur la même
balance, **45 % d'écart**. Un test où les deux donneraient le même chiffre n'aurait rien prouvé.

### Portes de qualité

| Dépôt | Lint | Build | Unitaires | e2e | Couverture |
|---|---|---|---|---|---|
| `bilan-service` | 0 warning | OK | **2 975** | **822** | 99,2 / 95,3 / 99,4 / 99,3 |
| `balance-service` | 0 warning | OK | **4 177** | **1 077** | seuils tenus |
| `assurance-service` | 0 warning | OK | **1 706** | **161** | 99,6 / 94,2 / 99,2 / 99,6 |
| `platform-catalog-service` | 0 warning | OK | **740** | **200** | seuils tenus |

⚠️ Quatre e2e de `balance-service` ont rougi **pendant que la stack docker tournait**, puis sont
repassées vertes une par une et suite complète une fois la stack arrêtée : saturation de la VM, pas
une régression — le piège déjà consigné dans [[montage-fichier-unique-inode-git]].

### Revue de code et revue de sécurité — 2026-09-21

Les deux revues ont tourné **en parallèle sur le même diff**, et elles ont **convergé sur le même
constat bloquant** — comme en STORY-517, où quatre constats identiques étaient sortis des deux côtés.

#### ⛔⛔ Le constat des deux revues : un comparatif **vide** n'est pas un comparatif

`const aggN1 = soldesN1 ? …` — `[]` est ***truthy***. Une passe N-1 était donc construite sur un jeu
vide, le semis la remplissait de **zéros**, et l'opérande `mode: 'VARIATION'` publiait le **stock
entier** des provisions techniques comme s'il était la variation de la période.

| `soldesN1` | `RT` publié |
|---|---|
| absent | **absent** (correct : indéterminé) |
| `[]` | **`−3 800 000`** ⛔ publié comme **mesuré** |
| arrêté N-1 réel | `+1 200 000` |

Le résultat technique **changeait de signe**, et les **sept contrôles de cohérence restaient verts** :
`coherenceSig` confronte `RN`, qui depuis D-518-5 ne cascade plus depuis `RT`. ⇒ **C'est exactement
le défaut que cette story supprime, réintroduit par la porte du tableau vide** — et la porte est
**neuve** : avant `@2.0`, aucun agrégat de la colonne N ne dépendait du comparatif.

⚠️ **Le piège `[]` est déjà nommé dans ce dépôt** : `SOLDES_N2_SANS_N1` (STORY-433) teste `?.length`
pour cette raison exacte, et son commentaire renvoie au « piège `[]` de STORY-430/409 ». La garde
existait **au contrôleur**, pas dans les deux services de production — c'est là qu'elle est posée,
parce que c'est le seul point que les appelants **hors HTTP** traversent aussi (jobs, recalcul d'un
jeu persisté portant déjà `[]`).

#### Les huit autres constats, tous traités

| # | Constat | Traitement |
|---|---|---|
| ② | La propagation de l'indétermination change la sortie de **SYSCOHADA** (TFT `ZB`/`ZG`/`ZH` : chiffre → `null` sans N-1), **hors périmètre CIMA et sans test** | **Gardé** — le contrôle de trésorerie disait déjà `INDETERMINABLE` pendant que les sous-totaux sortaient chiffrés ; les deux se contredisaient. Pinné par un test, et le commentaire qui énonçait l'inverse du code est rectifié |
| ③ | La garde de conformité au front avait été **relâchée au-delà du besoin** (`Set` + `toContainEqual`), laissant franchir la configuration que le fichier de données interdit 40 lignes plus haut | Comparaison **stricte restaurée** |
| ④ | Le JSDoc **promettait plus qu'il ne tenait** : les deux lectures d'un poste divergent sur le poste marqué `RESULTAT_BILAN` (mesuré : `6 000 000` contre `7 000 000`) | Promesse ramenée à ce qu'elle tient, **et la porte fermée à la source** |
| ⑤ | La garde CI ne suivait pas la règle de semis : une opérande vers `BILAN:CPT` levait un **500 sur toute la liasse**, CI verte | Règle ajoutée à `verifierOperandes`, avec ses fixtures |
| ⑥ | Le poste **terminal** des SIG se lisait sur la sortie **filtrée** : `sig.at(-1)` pouvait désigner un autre poste, et le contrôle aurait comparé la mauvaise grandeur | Terminal lu sur les formules **déclarées** ; non mesuré ⇒ non applicable, jamais reporté sur le voisin |
| ⑦ | Un commentaire du catalogue **contredisait les deux autres dépôts du même commit** (« servie sans erreur en attendant » — faux pour `balance` 409 et `assurance` 403) | Rectifié |
| ⑧ | Deux JSDoc nommaient encore `@1.0`, dont un faux depuis STORY-512 | Rectifiés |
| ⑨ | `REFS` énumérée à la main : `@2.0` absente, donc CC1/CC2/CC4 non rejoués sur le seul paquet à opérandes inter-états | Ajoutée |

⛔⛔ **Et ⑨ a révélé un défaut latent du fichier de garde lui-même** : son index de paquets était clé
par **`code` seul**. Deux versions d'un même référentiel dans `REFS`, et la seconde écrasait la
première — `CC3` confrontait alors le checksum de `@1.0` aux **octets de `@2.0`**. Latent depuis
l'origine parce que `REFS` n'avait jamais porté deux versions d'un même code ; révélé **en
rougissant**, ce qui est le bon comportement. Re-clé par `code@version`.

#### Mutations de la passe de revue

| # | Mutation | Verdict |
|---|---|---|
| M9 | retour de la simple présence à la place de `?.length` | **1 rouge** |
| M10 | retour du `?? 0` dans l'évaluateur (le TFT doit rougir) | **1 rouge** |
| M11 | règle de semis inter-états **supprimée** | ⛔ **NE COMPILE PAS** |
| M11 bis | règle visant un préfixe d'état inexistant (mutation de **valeur**) | **2 rouges** |
| M12 | terminal relu sur la sortie filtrée (`sig.at(-1)`) | **1 rouge** |
| M13 | index des paquets re-clé par `code` seul | **7 rouges** |

⛔ **Et le `git checkout --` de restauration a effacé le correctif non committé** — la fiche
[[git-checkout-efface-le-travail-non-committe]] a frappé une **troisième** fois dans cette story,
alors même que la section précédente la citait. **Committer avant de muter n'est pas une précaution,
c'est une étape du protocole.**

#### Vérification docker REJOUÉE sur l'état final

Les correctifs touchent le moteur : la phase ④ est rejouée, jamais reportée depuis une mesure
antérieure.

| # | Cas | Résultat |
|---|---|---|
| V3 | comparatif **réel** | `RV1 = 1 500 000` · `RV2 = 500 000` · **`RT = 1 200 000`** · `RN = 1 000 000` |
| V5 | même balance, organisation restée sur **`@1.0`** | **`RT = 2 200 000`**, `ecart = 0` — aucune régression |
| V6 | comparatif **absent** | `sig = ['RN']` — `RT` **absent** |
| V7 | comparatif **`[]`** *(le constat de sécurité)* | `sig = ['RN']` — `RT` **absent**, là où il sortait à `−3 800 000` |

`coherenceSig.ecart = 0` et `coherent = true` dans les quatre cas.

### Ce qui reste ouvert, et qui n'est pas dans cette story

- ⚠️ **Le front déclare encore `cima-assurances@1.0`** dans `vertical-packs.ts` (dépôt frontend, hors
  périmètre). L'écart est **déclaré** côté catalogue et **compensé par une garde qui nomme la
  version attendue** — ticket ouvert : `TICKET-FRONTEND-referentiel-cima-2-0-story-518.md`.
- ⚠️ **Migration de données différée** : une organisation déjà octroyée à `@1.0` continue d'être
  servie sans erreur par `bilan-service`, mais doit voir son octroi rejoué pour recevoir `@2.0`.
  ⛔ Et il ne faut **pas** lui octroyer les deux : `resolveReferentielForOrg` lève
  `ReferentielAmbiguError` dès qu'une organisation en porte plus d'un (STORY-422, « on refuse au
  lieu de choisir »). C'est la vérification docker qui a attrapé cette erreur de conception, après
  qu'elle eut été écrite et committée.
