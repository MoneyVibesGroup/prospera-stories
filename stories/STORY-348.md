# STORY-348 : Calcul des cotisations et des retenues, aiguillé sur le type de bénéficiaire

Status: not_started

**Epic :** EPIC-034 — Base de rémunération et obligations sociales
**Points :** 5 · **Sprint :** 28 (backend) · **Service :** `fiscal-service` (`:3012`)
**FR :** `FR-F30` *(amendé le 2026-08-15)* · **`FR-F79`** · `FR-F11` / `FR-F12` *(familles et
modificateurs)*
**Décision :** **AD-4** *(une famille sans stratégie refuse, elle n'approxime jamais)* · **AD-20**
**Origine :** **arbitrage PO du 2026-08-15** — *« IRPP oui, CNSS différée »*
**Dépendances :** ⛔ **STORY-345** *(la base porte le type)* · ⛔ **STORY-364** *(le refus sourcé —
sans elle, cet aiguillage rend zéro ou le régime salarié)*

> ⚠️ **Ce fichier est créé le 2026-08-16**, pour la même raison que `STORY-345.md` : l'amendement du
> 15/08 ne vivait que dans un commentaire de `sprint-status.yaml`.

---

## Ce que l'amendement change — et ce qu'il ne change pas

⚡ **Rien de nouveau n'entre dans le moteur.** L'aiguillage emploie le modificateur **`AIGUILLAGE`**
**déjà déclaré en `FR-F12`** — celui qui sert au **RSH 3 / 5 / 20 % selon l'état du tiers**. Le type de
bénéficiaire est **un critère d'aiguillage de plus**, ⛔ **pas une seconde famille de calcul**.

**Périmètre v1, coupé au sourcing et non au bénéficiaire :**

| Volet | v1 | Pourquoi |
| --- | --- | --- |
| IRPP salariés (Art. 74) | ✅ | barème `BAREME_TRANCHES`, 8 tranches jusqu'à 35 % |
| IRPP gérants et associés (**Art. 75**) | ✅ | **même barème** ⇒ un aiguillage, pas un moteur |
| CNSS **salariés** — parts 17,5 % / 4 % | ✅ | taux et assiette sourcés au paquet |
| CNSS salariés — **plancher SMIG** | ⛔ **bloqué** | **la valeur du SMIG n'existe pas** *(voir ci-dessous)* |
| CNSS **des gérants** (affiliation) | ⏸️ | **non sourcé** — `cnss.aCompleter` |
| Revenus distribués (**Art. 79**) | ⏸️ | **non sourcé** |

## ⛔ Le plancher SMIG n'est pas calculable — constat du 2026-08-16

L'AC d'origine disait : *« une assiette inférieure au salaire minimum ⇒ **le plancher du paquet
s'applique** »*. **Ce plancher n'existe pas comme valeur.**

`referentiels/paquet-fiscal-togo-2026.json` déclare la **règle** —
*« l'assiette ne peut être inférieure au SMIG en vigueur »* — puis déclare **son propre trou** :

> `cnss.aCompleter` : *« plafond éventuel de cotisation, ventilation par branche (prestations
> familiales / risques professionnels / pensions), **valeur SMIG à jour** »*

⚠️ **Vérifié le 2026-08-16 : le mot « SMIG » n'apparaît dans aucun référentiel avec une valeur
numérique.** Il n'est cité que dans trois formulations en toutes lettres, toutes des renvois.

> ⚡ **Cet AC était donc intenable — et c'est une bonne nouvelle.** Le comportement correct est **déjà
> spécifié** par `FR-F80` et `AD-20` : obligation **bloquée et motivée**. Il ne manque **aucune ligne de
> code**, il manque **une donnée au référentiel** (`GAP-smig-togo-sans-valeur`). Le jour où elle y
> entre, **le déblocage se fait sans livraison** — c'est exactement ce que `NFR-F04` promet.

⚠️ **La même règle vaut pour le PLAFOND.** Le paquet dit *« plafond **éventuel** »* : ce n'est ni « il
n'y en a pas », ni une valeur. **Calculer sans plafond, c'est trancher en dur une question que le
référentiel déclare ouverte** — et le montant sortirait *juste-en-apparence* pour les hauts salaires.

## Critères d'acceptation

- **Étant donné** une base de rémunération **quand** le calcul s'exécute **alors** les parts employeur
  et salarié sortent des **taux du paquet** (`cnss.tauxEmployeur`, `cnss.tauxSalarie`), ⛔ jamais d'une
  constante du code *(`NFR-F04`)*.
- **Étant donné** un bénéficiaire `DIRIGEANT` **quand** l'**IRPP** est calculé **alors** il aboutit
  normalement, **au même barème** que l'Art. 74.
- **Étant donné** ce même bénéficiaire **quand** la **cotisation CNSS** est calculée **alors** elle sort
  **`BLOQUÉE`**, ⛔ **jamais chiffrée** *(délégué à `STORY-364`)*.
- ⛔ **Étant donné** une assiette **inférieure au SMIG** **quand** le calcul s'exécute **alors**
  l'obligation sort **`BLOQUÉE`** avec le motif **« valeur du SMIG absente du paquet »** — **et non avec
  un plancher appliqué**.
- ⛔ **Étant donné** une assiette **élevée** **quand** le calcul s'exécute **alors** le service **ne
  suppose pas l'absence de plafond** : tant que `plafond` est déclaré « éventuel », le comportement est
  celui décidé à l'ouverture de la story et **écrit**, pas déduit du code.
- **Étant donné** un revenu salarial **quand** la retenue d'impôt est calculée **alors** elle suit le
  **barème par tranches** du paquet, et un changement de tranche **ne demande aucune livraison**.
- **Étant donné** la **part patronale** **quand** le résultat fiscal est établi **alors** elle est
  traitée comme **charge déductible**, conformément à `cnss.deductibiliteFiscale`.
- **Étant donné** un dossier **100 % `SALARIE`** **quand** le calcul s'exécute **alors** le résultat est
  **identique à l'état antérieur** — aucune régression sur le chemin nominal.

## Ce que cette story ne fait PAS

- ⛔ Elle **ne constitue pas la base** — c'est **STORY-345**.
- ⛔ Elle **n'écrit pas le mécanisme de blocage** — `FR-F25` l'a déjà, et **STORY-364** le câble au
  volet social. Cette story **s'y branche**.
- ⛔ Elle **n'invente aucun taux, plancher ni règle d'affiliation.** *(`NFR-F04`, `AD-1` : le noyau ne
  calcule aucun impôt qu'il ne lise dans le paquet.)*
- ⛔ Elle ne porte ni le calendrier social (**STORY-349**) ni le rapprochement (**STORY-350**).

## Definition of Done

- [ ] **Mutation-test de l'aiguillage** : forcer le régime salarié pour un `DIRIGEANT` ⇒ le test
      « la CNSS du dirigeant sort bloquée » **vire au rouge**.
- [ ] **Mutation-test du sourcing** : remplacer `cnss.tauxEmployeur` par `0.175` en dur ⇒ un test
      **doit** échouer. Sans lui, `NFR-F04` n'est tenu par rien.
- [ ] Le calcul est **rejoué deux fois à des dates différentes** sur la même version de paquet et rend
      **le même résultat** *(`NFR-F03`, déterminisme)*.
- [ ] Les montants sont manipulés en **unités mineures entières** — ⚠️ **le XOF a zéro décimale**, un
      arrondi flottant y est invisible en test et faux en production *(`NFR-F09`)*.
- [ ] Le **cas SMIG** produit une obligation bloquée **dont le motif nomme le champ manquant du
      paquet**, ⛔ pas une erreur technique.
- [ ] ⚠️ **Le sort du plafond est TRANCHÉ ET ÉCRIT** dans la story avant de coder — *« éventuel »* n'est
      pas une spécification, et la décision ne se déduit pas du diff.
