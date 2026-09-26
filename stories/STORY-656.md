# STORY-656 : La TPE au Système Minimal de Trésorerie ne peut pas liquider sa TPU — le marqueur de chiffre d'affaires désigne UN poste, le formulaire SMT en a deux

Status: review

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `bilan-service` (artefact `smt-togo@1.0`, marqueur au `tableDePassage`) + `balance-service`
(`etablirChiffreAffairesSource`, liquidation de l'IS et moteur TPU) — **contrat d'artefact, donc 2 dépôts**
**Points :** 5 · **Complexité :** high · **Sprint :** S20
**Origine :** dette **déclarée à la clôture de STORY-494** (2026-09-09) et **remesurée le 2026-09-12** à la
clôture de [[STORY-493]].

> ⚠️ **Numérotée 656, pas 652.** Le numéro suivant libre sur `main` était 652, et il est **déjà pris par une
> branche distante non fusionnée** (`origin/docs-652`) — comme 653, 654 et 655. C'est le mode de collision
> que `sprint-status.yaml` décrit lui-même : la marque se cale sur un **balayage de toutes les branches
> distantes**, jamais sur `main` seul.

---

## Le fait

`smt-togo@1.0` a été packagé par STORY-494 pour servir la **TPE**, persona la plus nombreuse du portefeuille.
Son régime fiscal est la **Taxe Professionnelle Unique**. Et la liquidation de la TPU d'un dossier SMT
répond **`409 CA_NON_SOURCE`** : « Le référentiel `smt-togo@1.0` ne désigne aucun poste de chiffre
d'affaires ». Le seul régime que ce référentiel serve est donc le seul qu'il ne permette pas de calculer.

**Mesuré le 2026-09-12, pas supposé :**

| Constat | Mesure |
|---|---|
| aucun marqueur `chiffreAffaires` dans `smt-togo-1.0.json` | et aucun non plus dans `cima-assurances@1.0` ni `sfd-bceao@1.0/@2.0` — **seuls** `syscohada-revise@2.1` et `zone-franche-togo@1.0` en portent un |
| le refus est explicite et volontaire | `ChiffreAffairesNonSourceException` → **409**, avec « un chiffre d'affaires absent n'est **pas** un chiffre d'affaires nul » |
| le mécanisme désigne **un seul** poste | `etablirChiffreAffairesSource` appelle `resoudrePosteChiffreAffaires`, qui rend **un** `{poste, etat}` ; `ChiffreAffairesSource` porte un `poste` au singulier |

⚡⚡ **Et c'est là que ce n'est pas « ajouter un marqueur ».** Le compte de résultat du formulaire SMT
sépare les recettes en **trois** lignes, et son total les additionne toutes les trois :

| Code | Libellé | Est-ce le chiffre d'affaires ? |
|---|---|---|
| `CR1` | Recettes sur ventes | une **part** seulement |
| `CR2` | Recettes sur prestations de services | une **part** seulement |
| `CR3` | Autres recettes sur activités | **non** — hors chiffre d'affaires |
| `CRA` | TOTAL DES RECETTES | **non** — il inclut `CR3` |

Marquer `CRA` **surestime** le chiffre d'affaires et gonfle la base de la TPU comme celle du minimum
forfaitaire. Marquer `CR1` **ou** `CR2` seul le **sous-estime**. Le chiffre d'affaires du SMT est
`CR1 + CR2`, et **aucune forme du marqueur actuel ne sait l'exprimer.**

⚠️ Le défaut n'est donc pas dans l'artefact seul : il est dans le **contrat du marqueur**, qui suppose qu'un
référentiel désigne son chiffre d'affaires par **un** poste. Le supposer était vrai des deux référentiels
qui en portaient un — c'est la forme de défaut de [[story-426-marqueur-placement-pas-mesure]] et de
[[story-292-cima-contrat-balance]] : une règle qui tient par accident tant qu'un seul cas l'éprouve.

## Critères d'acceptation

- [x] AC-1 — Le marqueur de chiffre d'affaires **peut désigner plusieurs postes**, et le chiffre d'affaires
      est leur **somme**. Le contrat publié dit lequel ou lesquels ont servi : `ChiffreAffairesSource`
      expose la **liste** des postes retenus, pas un poste unique. Un consommateur doit pouvoir recomposer
      le montant depuis les lignes qu'il reçoit.
- [x] AC-2 — `syscohada-revise@2.1` et `zone-franche-togo@1.0` rendent **exactement le même montant
      qu'aujourd'hui**, au franc près, sur une balance réelle. Un marqueur à un seul poste reste un cas
      valide du nouveau contrat — la généralisation ne renomme rien et ne déplace rien.
- [x] AC-3 — `smt-togo@1.0` marque `CR1` **et** `CR2`, avec leur **source** (le formulaire officiel), et
      **jamais** `CRA` ni `CR3`. Une garde d'artefact rougit si `CRA` ou `CR3` est marqué : ce n'est pas une
      préférence de packaging, c'est la différence entre une assiette juste et une assiette gonflée des
      autres recettes.
- [x] AC-4 — La liquidation de la TPU d'un dossier SMT **aboutit** : plus de `409 CA_NON_SOURCE`. Prouvé
      par une **vérification docker** sur une balance SMT réelle, avec le montant confronté à
      `CR1 + CR2` recalculé depuis les comptes, et **non** à une valeur écrite en dur dans le test.
- [x] AC-5 — `cima-assurances@1.0` et `sfd-bceao@1.0/@2.0` continuent de rendre **`409 CA_NON_SOURCE`**.
      Un plan bancaire ou assurantiel n'a pas de poste de chiffre d'affaires au sens de la TPU, et le
      refus est la bonne réponse — un marqueur ajouté « pour faire passer » y serait un chiffre inventé.
      ⚠️ Ce critère est le **contrôle négatif** de la story : sans lui, AC-1 pourrait être livré par un
      repli qui invente un CA pour tout le monde.
- [x] AC-6 — Le mécanisme reste **fail-closed** : un référentiel qui ne marque rien refuse, un référentiel
      qui marque un poste inexistant **refuse en le nommant**, et aucun chemin ne retombe sur `0`. Un
      chiffre d'affaires nul rend le minimum forfaitaire nul, donc l'impôt d'une entreprise déficitaire
      nul, et la TPU nulle sur un chiffre d'affaires bien réel. Faux, et crédible.

## Périmètre

**Inclus**
- `bilan-service` — forme du marqueur au `tableDePassage`, marquage de `CR1`/`CR2` sur `smt-togo@1.0`,
  garde d'artefact d'AC-3, régénération et digests épinglés.
- `balance-service` — `etablirChiffreAffairesSource` et le contrat `ChiffreAffairesSource` publiés par la
  liquidation de l'IS **et** par le moteur TPU (une seule définition du CA, jamais deux).

**Hors périmètre**
- ⚠️ **Les quatre notes du formulaire SMT**, également déclarées non livrées à la clôture de STORY-494 :
  trou distinct, story à part.
- ⚠️ **Le paquet fiscal embarqué par `bilan-service`**, qui échappe au schéma et au vocabulaire de
  [[STORY-493]] : le prévisionnel calcule depuis une **amorce** sans publier aucun signal. Trou nommé à la
  clôture de STORY-493, story à part.
- La dette `cles()` de STORY-494 est **en cours de résorption** et non close : `cles()` est désormais lue
  par quatre gardes de `bilan-service` et, depuis STORY-493, par le pendant **fiscal** de
  `balance-service`. Ce qui reste à convertir se traite garde par garde, pas ici.

**🪝 Hooks inertes documentés**
- Un référentiel qui marque **un** poste reste servi à l'identique : la liste à un élément est le cas
  nominal, pas un cas dégradé.

## Definition of Done

Seuils inchangés (65 / 90 / 90 / 90), lint 0 warning, unit + e2e verts, **table de mutations** (un marqueur
retiré, `CRA` marqué, un poste inexistant marqué, la somme remplacée par le premier poste), et
**vérification docker** sur une balance SMT réelle. Un changement de contrat d'artefact touche **2 dépôts**
(`bilan-service` producteur, `balance-service` consommateur) : deux branches `MNV-0XX`, deux PR, intégrées
**ensemble**.

## Progress Tracking

**Statut : `review`** — implémenté, validé, vérifié en docker le **2026-09-26**. Branches `MNV-656` dans
les **3** dépôts (`docs`, `bilan-service`, `balance-service`).

### Ce qui a été livré

**`bilan-service`** (`639647d`) — le **contrat du marqueur**, généralisé :

- `MappingRule.chiffreAffaires` passe à la cardinalité du marqueur `bfr` : **plusieurs postes, sommés**.
  `margeBrute` reste à **un** poste et le dit désormais explicitement (son JSDoc renvoyait à la règle du CA,
  qui n'est plus la même).
- `build.mjs` : `exigerUnSeulChiffreAffaires` devient **`exigerChiffreAffairesSansDoubleCompte`**. Il ne
  compte plus les postes, il mesure ce qui rendrait la somme fausse — deux postes marqués dont les
  **racines de comptes se recouvrent**, directement (`70` et `701`) ou parce que l'un **contient** l'autre
  par ses opérandes (`CRA` et `CR1`). Le recouvrement se mesure **par préfixe**, comme le moteur rattache.
- source `table-de-passage-smt.json` : `chiffre_affaires` sur `CR1` **et** `CR2`, avec le dépouillement du
  formulaire officiel **ligne à ligne** dans le commentaire du paquet.
- artefact `smt-togo@1.0` régénéré : `c4d0318a…` → **`00335c03…`**, **seul octet touché** (4 lignes de diff,
  le champ est additif). Checksum recopié au manifeste et aux **deux** specs qui l'épinglent.
- `CompteResultatProductionService.valeurDuPosteMarque` → `valeurDesPostesMarques` : **somme**, et `null`
  dès qu'**un** des postes marqués n'est pas mesuré (doctrine du marqueur `bfr` — une somme amputée d'une
  composante est fausse et crédible).

**`balance-service`** (`8456404`) — le **consommateur**, et deux causes distinctes fermées :

- ⚠️ **le marqueur n'atteignait AUCUN calcul** : la liste blanche du parse
  (`referentiel-loader.service.ts`) l'écartait **en silence** depuis STORY-457. Le moteur résolvait le poste
  de CA par le **libellé** ou par `regles.POSTE_CHIFFRE_AFFAIRES` — le formulaire SMT n'a ni l'un ni
  l'autre (« Recettes sur ventes », « Recettes sur prestations de services »). Sans la ligne ajoutée à cette
  liste, tout le reste aurait compilé, démarré, et laissé la TPE en `409`.
- `resoudrePosteChiffreAffaires` → **`resoudrePostesChiffreAffaires`** : le **marqueur d'abord** (plusieurs
  postes), puis `regles.POSTE_CHIFFRE_AFFAIRES`, puis le libellé. Le marqueur passe devant parce qu'il est
  la **seule** des trois voies gardée à la génération contre le double comptage.
- `ChiffreAffairesSource.postes[]` remplace `poste`/`etat` : chaque poste publie **sa** part et **ses**
  comptes, et `Σ postes[].montant === montant`. Idem dans les **deux** DTO publiés (liquidation de l'IS et
  TPU).
- **AC-6** : un poste désigné qui ne rattache **aucun** compte est **refusé en le nommant**
  (`{ refus }` → `ChiffreAffairesNonSourceException(cle, motif)`, motif dans `message` **et** `details` — une
  clé de premier niveau serait supprimée en silence par la liste blanche du filtre). C'est le chemin qui
  retombait sur `0` sans le dire : `calculerChiffreAffaires` rend `0` sur une liste de comptes vide.

### Portes de qualité

| Dépôt | Lint | Build | Couverture (seuils 65/90/90/90) | Unit | e2e |
|---|---|---|---|---|---|
| `bilan-service` | 0 warning | OK | **99,13 / 95,63 / 99,41 / 99,22** | 4 241 ✅ | 888 ✅ |
| `balance-service` | 0 warning | OK | **99,20 / 93,03 / 98,74 / 99,31** | 4 713 ✅ | 1 238 ✅ |

### Table de mutations (exécutée, puis restaurée)

| # | Mutation | Ce qui rougit |
|---|---|---|
| 1 | `CRA` marqué en plus de `CR1`/`CR2` (source SMT) | le **générateur LÈVE** : *« les postes COMPTE_RESULTAT/CR1 et COMPTE_RESULTAT/CRA portent tous deux `chiffre_affaires` et retiennent des comptes qui se recouvrent (701 / 701) »* |
| 2 | la somme réduite au **premier** poste (`marques.slice(0, 1)`) | 2 tests : CA **1 000** au lieu de 3 000, et **4 200** au lieu de `null` |
| 3 | marqueur de **`CR2` retiré** de l'artefact | CA **1 200 000** au lieu de 3 200 000, **+** le loader rejette le checksum, **+** la spec de manifeste |
| 4 | un poste **sans compte** (`CRD`, variations de stocks) marqué | **refus nommé** ⇒ `CA non établi`, 2 tests rouges |
| 5 | le marqueur **retiré de la liste blanche** du loader | le test de liste blanche **et** le test de bout en bout (octets → loader → résolution) |

### Vérification docker — 2026-09-26, stack NEUVE (`down -v`), **26 verdicts OK / 0 KO**

Scripts et journal : `PROSPERA/tmp/verif-docker-story-656/` (`donnees656.py`, `p1_comptes.py`,
`p2_catalogue.py`, `p3_dossiers_balances.py`, `p4_tpu.py`, `journal.log`, `verdicts.log`).

Le code exécuté est bien celui de la branche : `Found 0 errors. Watching for file changes.`, et le
conteneur voit `["CR1","CR2"]` marqués dans l'artefact monté, sha `00335c03…`.

⛔ **Le montant publié est confronté à un RECALCUL INDÉPENDANT**, jamais à une valeur écrite en dur :
les lignes sont relues **dans MongoDB** (`balance_service.balances`, pas dans la réponse HTTP), les postes
marqués et leurs racines **dans l'artefact livré**, et le rattachement (préfixe le plus long, net
créditeur) est réimplémenté en Python. Le compte `701` est mouvementé **des deux côtés** (un avoir au
débit) : une somme de colonnes séparées serait fausse.

| Lecture | Montant (unités mineures) | |
|---|---|---|
| `CR1` seul | 1 840 000 000 | assiette **sous-estimée** |
| **`CR1 + CR2`** | **3 090 000 000** | ← publié par la liquidation |
| `CRA` (avec `CR3`) | 3 905 000 000 | assiette **gonflée** des autres recettes |

Garde de **non-vacance** : les trois lectures divergent strictement — une mesure qui les confondrait ne
pourrait pas passer.

- **AC-4** : `GET /dossiers/:id/fiscal/tpu` → **200**, `chiffreAffaires.postes = [CR1 1 840 000 000,
  CR2 1 250 000 000]`, `montant = 3 090 000 000` = le recalcul, `Σ parts === montant`, TPU due
  `247 200 000 = round(0,08 × 3 090 000 000)` (taux du paquet `togo@2026`). Vérifié **deux fois** : sur
  balance `BROUILLON` **et** sur balance `VALIDÉE` (scellée) — mêmes valeurs.
- **AC-5** : le dossier de microfinance, servi par `sfd-bceao@2.0`, rend **`409 CA_NON_SOURCE`** sur la
  liquidation de l'IS — *« Le référentiel sfd-bceao@2.0 ne désigne aucun poste de chiffre d'affaires »*.
  C'est la **même fonction** (`etablirChiffreAffairesSource`, extraite en STORY-095) qui sert les deux
  surfaces : le contrôle négatif porte donc sur le code réellement livré.
- Persistance relue en `mongosh` : `tpu_parametrages` = 1 document (`PRESTATIONS_SERVICES`, exercice 2026),
  balance servie `{referentiel: 'SMT', version: 1, etat: 'VALIDÉE'}`.

### Revue de code ⑥ — 8 constats, **tous traités** (1 bloquant)

Scan `prospera-code-review` (`opus`) + seconde lentille `ponytail-review` (over-engineering :
*« rien à retrancher »*). Correctifs dans un commit **dédié** par dépôt (`003ce59`, `31e0140`).

| # | Constat | Traitement |
|---|---|---|
| ① **BLOQUANT** | **AC-6 n'était gardé par AUCUN test au-delà de la fonction pure.** Mesuré : retirer l'argument `motif` aux **deux** sites d'appel laissait **205 unitaires et 85 e2e VERTS**. Le comptable recevait alors « ce référentiel **ne désigne aucun** poste de chiffre d'affaires » — le message **faux** que la story existe pour supprimer — sur un référentiel qui en désigne un | un test par service assert le code, `COMPTE_RESULTAT/ZZ` dans `message` **et** `details.motif`, et l'**absence** du message « ne désigne aucun poste ». **Mutation rejouée après correctif : les 2 tests rougissent** |
| ② | `docs/referentiels/README-smt-togo.md` — la doc de référence du paquet affirmait encore « **aucun marqueur de chiffre d'affaires** […] la liquidation TPU répond `CA_NON_SOURCE` […] **à ouvrir en story** » | section réécrite : dette **levée**, avec le pourquoi (le constat était juste, c'est le *contrat* du marqueur qui était la limite) |
| ③ | **Sept** emplacements affirmaient encore l'ancienne cardinalité (`bfr`, `marge_brute`, `dettes_financieres` se **définissaient par contraste** avec `chiffre_affaires`) ou citaient `exigerUnSeulChiffreAffaires` / `valeurDuPosteMarque`, supprimés | les 7 corrigés — la prochaine story qui décide d'une cardinalité lisait le contraire du contrat |
| ④ | La « **doctrine du marqueur `bfr`** » invoquée pour justifier le `null` n'est **pas** celle que `bfrReel` implémente (lui cumule ce qui est émis) | le précédent cité est désormais la règle « complet ou absent » du **générateur** ; sinon la prochaine story implémenterait une somme partielle en croyant faire l'inverse |
| ⑤ | **Les deux lecteurs du même marqueur divergent** : filtre d'état, et critère de refus. Un paquet marquant `CR1` **et** une ligne sans compte (le SMT en porte trois : `CRD`/`CRE`/`CRF`) ⇒ la liasse publie `CR1 + 0`, la TPU répond `409`, sur le même dossier | **fermé au générateur** : un poste marqué doit résoudre **au moins une racine** (mutation : `CRD` marqué ⇒ le build lève en le nommant). Le filtre d'état, lui, est **documenté des deux côtés** — aucun paquet livré n'en pose hors du compte de résultat |
| ⑥ | Le test de non-recouvrement **ne pouvait pas rougir seul**, et l'en-tête avait **retiré** la mise en garde qui le disait | mise en garde restaurée **et** prédicat désormais gardé : un paquet **synthétique** marquant `70` et `701` doit être détecté — sans ce cas la boucle était inexerçable |
| ⑦ | `le(s) poste(s) … sont désignés` dans un message lu par un comptable | accord au singulier dans le cas nominal, des deux côtés (moteur **et** générateur) |
| ⑧ | **Rupture de contrat** non nommée, avec `FE-051` en `ready-for-dev` sur ces deux écrans | nommée dans les **deux** DTO : `poste`/`etat` disparaissent du premier niveau (aucune valeur juste quand deux postes ont servi), le client lit `chiffreAffaires.postes[].poste` |

⚠️ **La vérification docker n'est PAS rejouée, et c'est mesuré** : une garde n'émet rien, donc
`smt-togo@1.0` reproduit `00335c03…` à l'identique après les correctifs — l'artefact vérifié en
④ est le même octet. Portes rejouées : lint 0 warning, build OK, couverture **99,13/95,63/99,41/99,22**
et **99,20/93,05/98,74/99,31**, 4 243 + 4 715 unitaires et 888 + 1 238 e2e verts.

**Écarté** (pré-existant, hors périmètre, signalé) : `profil-societe/regime/regime.regles.ts`
calcule un **second** chiffre d'affaires sur le préfixe `'70'` **codé en dur** (donc `708`/`709`
compris) pour *proposer* l'axe de régime — une estimation que l'humain confirme, antérieure à
cette story, mais qui nuance la formule « une seule définition du CA, jamais deux ». Et
`bfrReel` publie un BFR amputé quand une seule de ses trois composantes n'est pas émise.

### Revue de sécurité ⑦ — **0 vulnérabilité**

Scan `prospera-security-review` (`opus`, aucun downgrade). Vérifié et jugé sain : le `motif` du
refus ne porte **que** des couples `état/poste` d'un artefact vérifié par sha256 (zéro donnée de
tenant, et le référentiel était **déjà** nommé dans le message) ; l'assiette fiscale n'est pas
manipulable par une ligne de balance (racines `701`–`704` et `705`–`707` disjointes, venues de
l'artefact et non de la requête ; `@IsInt() @Min(0)` sur les soldes) ; aucun artefact n'atteint
le runtime sans checksum conforme ; le marqueur n'est accepté que sur `true` **strict** aux deux
bouts ; ni pollution de prototype ni injection d'opérateur Mongo (la valeur n'entre dans aucun
filtre) ; **zéro** guard, décorateur, DTO d'entrée, requête Mongo, variable d'env ou secret
touché ; coût runtime **strictement identique** à l'avant-story (`4n + 3n` contre `7n`), le
second facteur borné par l'artefact — pas de DoS (les deux dettes STORY-537/528 ne se rejouent
pas).

### ⚠️ Deux constats de la vérification — des gardes du produit, consignés

1. **`PUT /fiscal/tpu/parametrage` répond `409 BALANCE_VALIDEE_IMMUABLE`** dès qu'une balance de l'exercice
   est validée (« le cahier qui la justifie n'est plus modifiable »). La nature d'activité se déclare donc
   **avant** le scellement — ordre respecté par la vérification, et c'est l'ordre d'un dossier réel.
2. ⚠️ **Un dossier de microfinance ne peut pas être mis au régime `SYNTHETIQUE` par l'API.** La cascade est
   `axes.systemeComptable ?? profil ?? typeEntite` et le vocabulaire des axes ne connaît que `SN | SMT` :
   décider `SN` sur un dossier de microfinance le fait résoudre `syscohada-revise@2.2` (mesuré :
   `409 REFERENTIEL_NON_HABILITE`), et la famille `SFD-BCEAO` ne s'obtient donc **que sans décision
   d'axes** — où le régime que la TPU exige n'a aucun endroit pour se déclarer (`profils_societe.regimeFiscal`
   n'est plus écrit par personne). Sur la surface TPU, le refus tombe donc sur `REGIME_INCOMPATIBLE`
   **avant** d'atteindre le chiffre d'affaires. C'est pourquoi le contrôle négatif d'AC-5 est pris sur la
   **surface du régime réel** (liquidation de l'IS), qui appelle la même fonction. **Hors périmètre de
   cette story, à ficher.**

## Notes

- Voir [[STORY-494]] (packaging de `smt-togo@1.0` et déclaration de cette dette), [[STORY-493]] (schéma et
  garde du paquet fiscal), [[STORY-457]] (le marqueur `chiffreAffaires` et sa pose sur le seul poste `XB`),
  [[STORY-095]] (le CA extrait plutôt que recopié, pour que l'IS et la TPU lisent le même).
- La règle projet qui s'applique ici : **les chiffres d'une maquette fiscale se prennent dans le paquet,
  jamais dans le vraisemblable** — et le libellé d'un poste ne suffit pas à décider qu'il porte le chiffre
  d'affaires. `CRA` s'appelle « TOTAL DES RECETTES », et ce n'est pas le chiffre d'affaires.
