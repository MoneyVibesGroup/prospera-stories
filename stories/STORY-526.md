# STORY-526 : Registre des immobilisations — le produit RESTITUE Brut/Amort/Net sans que rien ne le CALCULE

Status: ready-for-dev

**Épic :** EPIC-135 — Immobilisations et amortissements
**Service :** `balance-service` / module `immobilisations` (nouveau) — **à confirmer au cadrage**
**Points :** 13 · **Sprint :** S20
**Origine :** §6.2 de `analyse-scalabilite-multireferentiel-2026-08-27.md` ; `cadrage-immobilisations-2026-08-16.md`.

---

## Le fait, déjà établi par le cadrage du 2026-08-16

L'audit de couverture du 16/08 a trouvé le module **entièrement absent de la documentation** — ni
PRD, ni spine, ni épics, ni story — **seul de la vague 2 dans ce cas**. Et son constat central n'est
pas confortable :

> **Ce qui existe déjà RESTITUE l'amortissement sans que rien ne le CALCULE.**
> `STORY-059` produit le bilan avec ses colonnes **Brut / Amort / Net**. `STORY-062` produit les
> notes d'immobilisations. Les valeurs viennent **de la balance**.

⇒ Si le client ne les a pas calculées ailleurs — dans Sage, ou dans un tableur — **elles n'existent
pas**. Le produit affiche trois colonnes dont il ne produit aucune.

⚡ **Pour un expert-comptable, c'est le manque le plus visible après les tiers et le lettrage** : une
dotation aux amortissements est un **calcul d'arrêté**, pas une donnée reprise. C'est ce qu'on fait
en décembre, et le produit ne sait pas le faire.

⚠️ Le module concerne **les quatre verticales** (ExpCo, Distributeur, IMF, Assurance) — un
distributeur amortit ses véhicules, une IMF ses agences, un assureur ses immeubles de placement.

## Critères d'acceptation

- [ ] AC-1 — Une immobilisation : désignation, **compte du référentiel du dossier** (AD-8 de la
      doctrine STORY-422), date d'acquisition, **date de mise en service**, valeur d'origine,
      **valeur résiduelle**, durée d'utilité, mode d'amortissement.
- [ ] AC-2 — ⚠️ **La date de mise en service, pas la date d'acquisition**, ouvre l'amortissement.
      Les confondre est l'erreur la plus fréquente et elle décale toute la première dotation.
- [ ] AC-3 — Le registre appartient à un **dossier** et à un **exercice** ; aucune écriture sur
      exercice clos.
- [ ] AC-4 — Les **mouvements** sont des événements (acquisition, mise en service, cession, mise au
      rebut, réévaluation) : le registre est **append-only**, comme le portefeuille et le stock.
- [ ] AC-5 — La devise vient du contrat canonique (STORY-489) — **aucune constante XOF**.
- [ ] AC-6 — ⛔ Le registre **ne publie encore rien** en balance : c'est STORY-528. Le livrer sans
      articulation serait un second endroit où l'amortissement existe sans se rejoindre.

## Notes

- Voir `cadrage-immobilisations-2026-08-16.md`, [[STORY-527]], [[STORY-528]], [[STORY-062]].
