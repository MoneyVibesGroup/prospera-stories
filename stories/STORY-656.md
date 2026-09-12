# STORY-656 : La TPE au Système Minimal de Trésorerie ne peut pas liquider sa TPU — le marqueur de chiffre d'affaires désigne UN poste, le formulaire SMT en a deux

Status: ready-for-dev

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

- [ ] AC-1 — Le marqueur de chiffre d'affaires **peut désigner plusieurs postes**, et le chiffre d'affaires
      est leur **somme**. Le contrat publié dit lequel ou lesquels ont servi : `ChiffreAffairesSource`
      expose la **liste** des postes retenus, pas un poste unique. Un consommateur doit pouvoir recomposer
      le montant depuis les lignes qu'il reçoit.
- [ ] AC-2 — `syscohada-revise@2.1` et `zone-franche-togo@1.0` rendent **exactement le même montant
      qu'aujourd'hui**, au franc près, sur une balance réelle. Un marqueur à un seul poste reste un cas
      valide du nouveau contrat — la généralisation ne renomme rien et ne déplace rien.
- [ ] AC-3 — `smt-togo@1.0` marque `CR1` **et** `CR2`, avec leur **source** (le formulaire officiel), et
      **jamais** `CRA` ni `CR3`. Une garde d'artefact rougit si `CRA` ou `CR3` est marqué : ce n'est pas une
      préférence de packaging, c'est la différence entre une assiette juste et une assiette gonflée des
      autres recettes.
- [ ] AC-4 — La liquidation de la TPU d'un dossier SMT **aboutit** : plus de `409 CA_NON_SOURCE`. Prouvé
      par une **vérification docker** sur une balance SMT réelle, avec le montant confronté à
      `CR1 + CR2` recalculé depuis les comptes, et **non** à une valeur écrite en dur dans le test.
- [ ] AC-5 — `cima-assurances@1.0` et `sfd-bceao@1.0/@2.0` continuent de rendre **`409 CA_NON_SOURCE`**.
      Un plan bancaire ou assurantiel n'a pas de poste de chiffre d'affaires au sens de la TPU, et le
      refus est la bonne réponse — un marqueur ajouté « pour faire passer » y serait un chiffre inventé.
      ⚠️ Ce critère est le **contrôle négatif** de la story : sans lui, AC-1 pourrait être livré par un
      repli qui invente un CA pour tout le monde.
- [ ] AC-6 — Le mécanisme reste **fail-closed** : un référentiel qui ne marque rien refuse, un référentiel
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

## Notes

- Voir [[STORY-494]] (packaging de `smt-togo@1.0` et déclaration de cette dette), [[STORY-493]] (schéma et
  garde du paquet fiscal), [[STORY-457]] (le marqueur `chiffreAffaires` et sa pose sur le seul poste `XB`),
  [[STORY-095]] (le CA extrait plutôt que recopié, pour que l'IS et la TPU lisent le même).
- La règle projet qui s'applique ici : **les chiffres d'une maquette fiscale se prennent dans le paquet,
  jamais dans le vraisemblable** — et le libellé d'un poste ne suffit pas à décider qu'il porte le chiffre
  d'affaires. `CRA` s'appelle « TOTAL DES RECETTES », et ce n'est pas le chiffre d'affaires.
