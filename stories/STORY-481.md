# STORY-481 : Le plan de trésorerie s'arrête à N+1 alors que la projection va à N+3 — le pire mois est hors du plan

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-036** (projection 3 ans, trésorerie 12 mois, scénarios comparés), 2026-08-27.
Relevé en mettant côte à côte les deux horizons de la maquette : le plan mensuel et la projection annuelle.

---

## Le fait

`ProjectionMensuelleService` projette **12 mois**, ceux de N+1. `ProjectionAnnuelleService` projette
**trois exercices**. Le pire moment du prévisionnel se trouve donc, structurellement, **hors du plan de
trésorerie**.

Sur le scénario prudent du dossier de démonstration :

| | Trésorerie de clôture |
|---|---|
| Fin N+1 — dernier mois du plan mensuel | −804 945 |
| Fin N+2 | −2 452 637 |
| Fin N+3 — dernier exercice projeté | **−4 092 714** |

Un banquier à qui l'on remet ce document lit un découvert de 800 000 F là où le **même modèle** en
annonce **cinq fois plus** deux ans plus tard. Le plan mensuel — le document le plus regardé des trois
— est celui qui couvre la plus petite partie de l'horizon.

## Critères d'acceptation

- [ ] AC-1 — `GET …/:id/projection-mensuelle` accepte `?exercice=1|2|3` (défaut `1`, comportement
      actuel inchangé) et projette les 12 mois de l'exercice demandé.
- [ ] AC-2 — L'ancre d'ouverture de l'exercice `n` est la **clôture annuelle** de l'exercice `n-1`, et
      l'articulation `Σ mensuel = flux net annuel de l'exercice n` reste une **identité**.
- [ ] AC-3 — L'encours d'ouverture des créances et des dettes est le **BFR normatif de l'exercice
      précédent**, pas celui de la base — sans quoi l'échéancier de N+2 rejouerait l'apurement de 2025.
- [ ] AC-4 — La réponse porte `exercice` et `annee` : un plan mensuel qui ne dit pas de quelle année il
      parle est illisible dès qu'il y en a trois.
- [ ] AC-5 — La comparaison (**STORY-473**) publie ses indicateurs mensuels **par exercice**, pas
      seulement pour N+1.
