# STORY-513 : Contrats et quittances — émettre n'est pas encaisser

Status: ready-for-dev

**Épic :** EPIC-129 — Contrats, primes et quittances
**Service :** `assurance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

En assurance, le **cycle est inversé** : l'assureur encaisse d'abord et paie ensuite, parfois des
années après. Toute la comptabilité du secteur découle de là, et la première conséquence est
comptable : **une prime émise n'est pas une prime encaissée, et ni l'une ni l'autre n'est une prime
acquise** (STORY-514).

Trois objets, trois moments :

| Objet | Moment | Effet |
|---|---|---|
| **Contrat** | souscription | crée l'engagement, aucun produit |
| **Quittance** | émission | crée une **créance** sur l'assuré et un **produit** (compte `70`) |
| **Encaissement** | règlement | solde la créance, **aucun produit** |

⚠️ Le compte `70` (« Primes ou cotisations ») du plan CIMA est mappé au poste `RP1`. C'est
l'**émission** qui l'alimente, pas l'encaissement — s'y tromper décale tout le résultat.

## Critères d'acceptation

- [ ] AC-1 — Contrat : souscripteur, catégorie (**Vie / Non-Vie**, structurant — AD-3), dates
      d'effet et d'échéance, périodicité, **fractionnement**, intermédiaire.
- [ ] AC-2 — Quittance : période couverte, montant, accessoires et taxes, état (émise, encaissée,
      annulée, impayée). Les quittances sont **append-only** : une annulation est une quittance
      d'annulation, pas une suppression.
- [ ] AC-3 — ⛔ **L'émission et l'encaissement sont deux événements distincts**, et un test le
      prouve : émettre sans encaisser crée une créance et un produit ; encaisser ne crée aucun
      produit.
- [ ] AC-4 — Les **ristournes** et les annulations de l'exercice se distinguent de celles portant sur
      des exercices antérieurs — elles ne s'imputent pas au même endroit.
- [ ] AC-5 — La **période couverte** par la quittance est portée : c'est elle, et non la date
      d'émission, qui alimentera la provision pour primes non acquises (STORY-514).
- [ ] AC-6 — ⚠️ Périmètre : **la comptabilité de l'assurance, pas l'assurance** (Q1). Ni tarification,
      ni souscription au guichet, ni gestion commerciale.

## Notes

- Voir [[STORY-514]], [[STORY-521]] (l'étanchéité Vie/Non-Vie), spine AD-1.
