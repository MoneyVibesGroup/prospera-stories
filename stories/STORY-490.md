# STORY-490 : La devise s'arrête à la balance — la liasse, le prévisionnel, le fiscal et l'export la perdent

Status: ready-for-dev

**Épic :** EPIC-107 — Devise, unités et arrondis (socle d'internationalisation)
**Service :** `bilan-service` + `balance-service` (`modules/fiscal`)
**Points :** 5 · **Sprint :** S20
**Prérequis :** **STORY-489** (la devise entre au contrat canonique).
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27.

---

## Le fait

Une fois la devise portée par la balance, elle doit **traverser** tout ce qui en descend. Aujourd'hui
aucun des quatre consommateurs ne la porte :

| Consommateur | Ce qu'il rend | Ce qui manque |
|---|---|---|
| Liasse (`JeuEtats`) | postes, totaux, cascade | la devise du jeu d'états |
| Prévisionnel / projection | 3 exercices, plan 12 mois | la devise des hypothèses **et** des résultats |
| Fiscal (IS, MFP, TVA, TPU, taxes) | montants et formules | la devise des **seuils du paquet fiscal** |
| Export (FE-038) | PDF / Excel | l'en-tête de devise, obligatoire sur un état financier |

⚡ **Le cas qui rend l'omission grave n'est pas l'affichage, c'est le fiscal.** Un plancher de MFP ou
un plafond de TPU sont des **montants libellés dans la monnaie du pays**. Comparer un chiffre
d'affaires exprimé dans une devise à un seuil exprimé dans une autre ne produit pas une erreur : ça
produit un régime fiscal faux, avec une formule juste et une provenance impeccable. C'est
exactement le patron de STORY-412 (« la provenance rend l'erreur plus difficile à mettre en doute
qu'un chiffre sans provenance »).

## Critères d'acceptation

- [ ] AC-1 — `JeuEtats` porte la devise de sa balance source et la rend à chaque lecture, versions
      figées comprises. Une version figée rend **la devise qui était la sienne**, jamais celle du
      dossier à l'instant de la lecture.
- [ ] AC-2 — Les hypothèses de prévisionnel et la projection portent la devise ; elle est **héritée**
      de la balance d'ancrage, non saisie. Un plan à trois ans dans une monnaie autre que la balance
      qui l'ancre n'a pas de sens et doit être impossible à exprimer.
- [ ] AC-3 — Le moteur fiscal **refuse** (`409 DEVISE_PAQUET_INCOHERENTE`) quand la devise de la
      balance diffère de celle du paquet fiscal appliqué. ⛔ **Il ne convertit pas** : convertir
      demanderait un taux, un taux demande une date et une source, et aucune des deux n'est décidée.
      Refuser est la seule conduite honnête tant que STORY-495 n'est pas rendue.
- [ ] AC-4 — L'export porte la devise **en en-tête de chaque état**, comme l'exige la présentation
      d'états financiers. Un bilan sans mention de monnaie n'est pas un bilan opposable.
- [ ] AC-5 — Aucune conversion nulle part dans cette story. Un test le prouve : aucun taux, aucun
      arrondi de change, aucune multiplication entre deux montants de devises différentes.

## Conséquences ailleurs

- **FE-082** consomme la devise servie plutôt que d'écrire « F CFA ».
- ⚠️ Le prototype affiche « F CFA » 60 fois et « unités mineures XOF » dans son texte de contrat :
  les deux doivent tomber en même temps que cette story, sinon l'écran contredit le service.

## Notes

- Voir [[STORY-489]], [[STORY-493]] (les montants du paquet fiscal), [[STORY-495]] (le change).
