# STORY-510 : Ratios prudentiels — capitalisation, liquidité, limitation des risques

Status: ready-for-dev

**Épic :** EPIC-127 — États périodiques et ratios prudentiels BCEAO
**Service :** `microfinance-service`
**Points :** 8 · **Sprint :** S20
**Prérequis :** **STORY-498** (le paquet prudentiel) · **STORY-508** (les engagements)
**Origine :** découpage `epics-microfinance-2026-08-27.md`.

---

## Le fait

Les ratios prudentiels ne sont **pas** les indicateurs de portefeuille de STORY-506. Le PAR est un
outil de **pilotage** ; un ratio prudentiel est une **norme opposable** : le franchir met
l'institution en situation d'infraction, et la Commission Bancaire le constate.

Ils se calculent à partir de trois matières que le module possède déjà : les **fonds propres**
(balance, référentiel SFD), le **portefeuille classé** (STORY-503), et les **engagements hors bilan**
(STORY-508).

## Critères d'acceptation

- [ ] AC-1 — Les ratios, leurs **assiettes** et leurs **seuils** viennent **intégralement du paquet
      prudentiel** (STORY-498). ⛔ Aucun seuil dans le code. Test de mutation : changer un seuil au
      paquet doit changer le verdict.
- [ ] AC-2 — Chaque ratio est rendu avec **son numérateur, son dénominateur, son seuil et son
      verdict**. ⚠️ Un ratio sans ses deux termes n'est pas vérifiable à la main — même exigence que
      « chaque écriture porte sa formule » du moteur fiscal.
- [ ] AC-3 — Un ratio **non calculable** (donnée manquante) rend un statut `INDETERMINABLE`, **jamais
      zéro et jamais un verdict**. ⚡ 4ᵉ occurrence du patron : `coherent: false` sur un `N-1` absent
      se lisait « anomalie » là où il n'y avait qu'une absence — **un booléen de conformité se lit
      toujours avec son statut**.
- [ ] AC-4 — Un dépassement de seuil est **signalé, jamais corrigé** : le produit constate, il ne
      décide pas d'une mesure de redressement.
- [ ] AC-5 — Les ratios se **rejouent** à une date d'arrêté passée, avec la **version du paquet qui
      s'appliquait alors**. Un seuil révisé en 2026 ne doit pas rendre non conforme un arrêté 2024.

## Notes

- Voir [[STORY-498]], [[STORY-503]], [[STORY-506]] (le pilotage, qui est autre chose), [[STORY-508]].
