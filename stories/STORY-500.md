# STORY-500 : Dépôts de la clientèle — à vue, à terme, et les intérêts que l'institution DOIT

Status: ready-for-dev

**Épic :** EPIC-122 — Membres et comptes de dépôts
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Les dépôts sont **au passif** d'une IMF : ce sont des dettes envers les membres. C'est le point où
un module conçu pour une entreprise commerciale se trompe le plus vite — l'argent qui entre à la
caisse d'une IMF n'est pas un produit, c'est une **dette**.

Et les dépôts à terme portent **des intérêts que l'institution doit** : ils se rattachent à
l'exercice qui les a courus, pas à celui qui les paie.

## Critères d'acceptation

- [ ] AC-1 — Comptes de dépôt à vue et à terme, par membre. Les mouvements sont **append-only**
      (AD-1) : le solde d'un compte est la somme de ses opérations, à une **date d'arrêté**.
- [ ] AC-2 — Un dépôt à terme porte son **taux**, sa **date d'échéance** et sa **périodicité**
      d'intérêts.
- [ ] AC-3 — ⚡ **Les intérêts courus non échus sont calculés à la date d'arrêté** et constatés en
      charge à payer. Les ignorer sous-évalue les charges de l'exercice — et le déficit qui en
      résulterait n'apparaîtrait qu'au paiement, dans l'exercice suivant.
- [ ] AC-4 — Un blocage de compte (nantissement d'un dépôt en garantie d'un crédit) est **tracé et
      visible** : c'est une information de portefeuille autant que de dépôt.
- [ ] AC-5 — Le solde d'un compte à une **date passée** se recalcule à l'identique. Test de rejeu.

## Notes

- Voir [[STORY-499]], [[STORY-507]] (publication en balance), spine AD-1.
