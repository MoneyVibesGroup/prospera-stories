# STORY-518 : `RT` cesse d'être un résultat de trésorerie — les variations de provisions techniques entrent au compte de résultat

Status: in_progress

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

- [ ] AC-1 — De nouveaux postes de **variation** entrent au compte de résultat CIMA, et `RT` les
      intègre en `FORMULE` avec **opérandes signées**. ⚠️ **Amendé par M5** : la table de passage ne
      suffit pas — le contexte d'évaluation du CR doit aussi porter les postes de **bilan**
      (D-518-4), sans quoi l'opérande lève `OperandeNonResolueError`.
- [ ] AC-2 — Nouvelle **version du paquet** `cima-assurances@2.0`, avec son checksum, **byte-identique
      entre les trois dépôts** (`bilan-service` source des octets, `balance-service`,
      `assurance-service` — règle AD-6 / STORY-368). ⚠️ `@1.0` reste packagé et **intact** : les
      versions coexistent, comme `sfd-bceao@1.0` et `@2.0`. ⚡ Et elle est **servie** (D-518-6), sinon
      le livrable est inerte.
- [ ] AC-3 — ⛔ Le libellé de `RT` **perd la réserve « hors variations de provisions techniques »** —
      et **garde** « hors séparation Vie/Non-Vie », qui est STORY-521 (D-518-3). Le retirer en entier
      serait le mensonge le plus coûteux du programme, simplement déplacé sur l'autre moitié.
- [ ] AC-4 — Un test compare `RT` **avec** et **sans** variations sur un jeu où les provisions
      **bougent d'un arrêté à l'autre** : l'écart doit être significatif. ⚡ Un test où les deux
      donnent le même chiffre ne prouve rien — c'est ce que la version actuelle produit déjà.
- [ ] AC-5 — Les provisions consommées sont **celles arrêtées à la date d'arrêté**, jamais une
      réévaluation postérieure : la variation se lit sur les deux colonnes `soldesN` / `soldesN1`
      (D-518-1), et **jamais** sur la dernière valeur connue.
- [ ] AC-6 — ⛔ **Aucune régression sur les contrôles** : `EQUILIBRE_BILAN` et `COHERENCE_RESULTAT`
      restent `OK` sur une balance CIMA équilibrée, et l'articulation `RN == bilan.controle.resultatNetN`
      tient (M6). Un dossier `@1.0` produit **exactement** les mêmes états qu'avant.
- [ ] AC-7 — La **variation indéterminée** (aucun jeu `N-1` fourni) ne devient **jamais `0`** : `RT`
      ressort indéterminé, jamais un chiffre faux présenté comme juste.

## Notes

- Voir [[STORY-514]], [[STORY-517]], [[STORY-520]], [[STORY-521]], [[STORY-522]], [[STORY-671]],
  spine AD-1/AD-10.
- Sources officielles dépouillées le 2026-09-21 : *Code CIMA 2019* (PDF consolidé, 608 p.),
  art. **432** (« 80. Exploitation générale », listes des comptes constituant les postes),
  art. **431** (liste des comptes, page officielle), art. **334-11** (compensation interdite).

## Progress Tracking

<!-- rempli pendant le développement -->
