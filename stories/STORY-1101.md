# STORY-1101 : Les douze mois déclarés sur dimana face à la liasse — le rapprochement que le contrôleur fait en premier

Status: ready-for-dev — **créée le 2026-11-19** depuis la salle des cabinets (point V4 de
`salle-cabinets-validations-2026-11-19.md`). Non slottée : à placer au prochain plan.

**Service :** `prospera-fiscal-service` (lecture des liasses figées de `bilan-service`) · **Points :** 5
**Dépend de :** STORY-322 (triplet calculé, déclaré, payé), STORY-326 (contrôles intra-période), STORY-328
(anomalies : gravité, blocage, levée motivée), STORY-563 (deux redevables) · **Écran :** à rattacher à FE-081

---

## Pourquoi

Ndeye, ancienne inspectrice des impôts, en séance du 19/11 : « Quand je contrôlais un dossier, je n'ouvrais pas
d'abord le bilan. Je prenais les douze déclarations de TVA mensuelles et je les comparais au chiffre d'affaires de la
liasse. L'écart, c'est le premier redressement. Ensuite, les retenues sur salaires face aux comptes 66. »

STORY-326 rapproche **une** déclaration du chiffre d'affaires comptabilisé **sur sa période**. Elle ne voit pas
l'écart qui n'apparaît qu'à la fin de l'exercice : la somme des douze mois déclarés ne colle pas à la liasse. C'est
pourtant l'écart que l'administration voit en premier, parce qu'elle a les deux côtés en main. Le produit les a aussi.

## Ce qui est attendu

Avant que la liasse passe « À déposer », un tableau de rapprochement pour l'exercice, une ligne par couple :

| Côté déclaré (cumul des périodes de l'exercice) | Côté liasse (jeu d'états figé) |
|---|---|
| Bases de TVA déclarées (ventes taxables + exonérées) | Chiffre d'affaires (comptes 70, poste du compte de résultat) |
| TVA collectée déclarée | TVA facturée (4431 et suivants, mouvements de l'exercice) |
| Retenues sur salaires déclarées (IRPP retenu à la source) | Charges de personnel (comptes 66) et dettes sociales et fiscales (42, 447) |
| Acomptes d'impôt sur les sociétés ou minimum de perception versés | Impôt de la liasse (89) et solde du compte 441 |

Chaque ligne a quatre valeurs : déclaré, liasse, écart, tolérance. La tolérance et la liste des couples viennent du
**paquet fiscal** (pays × année), jamais du code. Un pays qui n'a pas de couple déclaré n'affiche rien, et le dit.

Une période non déclarée dans l'exercice est nommée (« mars non déclaré »), jamais comptée pour zéro.

## Critères d'acceptation

- **AC-1** : pour un exercice dont les douze déclarations de TVA sont déposées et la liasse figée, le tableau
  rend, par couple du paquet, le cumul déclaré, la valeur de la liasse, l'écart et la tolérance ; les montants sont
  des entiers en FCFA.
- **AC-2** : un écart au-delà de la tolérance lève une anomalie STORY-328 qui nomme le couple, les deux montants, les
  périodes concernées et l'action attendue, en une phrase sans jargon.
- **AC-3** : une période manquante est nommée ; elle n'est jamais additionnée comme zéro (test : onze mois déposés,
  le douzième absent ⇒ l'anomalie le nomme).
- **AC-4** : la liasse ne passe pas « À déposer » tant qu'une anomalie de rapprochement bloquante n'est pas traitée,
  soit corrigée, soit levée avec un motif journalisé ; le motif figure au dossier de contrôle (STORY-336).
- **AC-5** : les couples et les tolérances se lisent dans le paquet fiscal Togo 2026 ; un paquet sans couple rend
  « rapprochement non défini pour ce pays » et ne bloque rien.
- **AC-6** : le dirigeant redevable (STORY-563) a son propre rapprochement : il n'est jamais mélangé avec celui de
  l'entreprise.
- **AC-7** : aucun écran ni aucun libellé ne dit « garanti », « sans redressement » ou « conforme à 100 % ». On écrit :
  « Écarts entre vos déclarations et la liasse ». C'est une règle de Ndeye : le produit promet zéro rejet de format,
  jamais zéro redressement.

## Hors périmètre (nommé pour plus tard)

- Le rapprochement avec les données que l'administration détient seule (factures normalisées des tiers, DAS).
- La correction automatique d'une déclaration passée : une correction reste une rectificative (STORY-325).
