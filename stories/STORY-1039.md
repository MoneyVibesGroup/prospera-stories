# STORY-1039 : Le rattachement lieux ↔ zones et la résolution

Status: done

**Épic :** EPIC-051 · **Dépôt :** `MoneyVibesGroup/reseau-service` · **Plage :** groupe D, n° 10 du lot 2. Dépend de 1038.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Rattachement principal ou secours**, plusieurs à plusieurs ; un lieu détenu ailleurs est une référence (AD-12) | intégration (un entrepôt principal à NORD, secours à SUD) |
| AC-2 | Chaque rattachement garde la **version de découpage** de son début (AD-4) ; il se termine, jamais effacé ; il retient la fermeture de sa zone, nommé | intégration |
| AC-3 | **Une adresse inconnue rend « non résolu », jamais une zone approchante** ; le **chemin utilisé** est dans la réponse (AD-11) | intégration (INCONNUE, AMBIGU, HORS_EMPRISE, frontière commune AMBIGU) |
| AC-4 | La résolution par la géométrie quand une emprise est déclarée (amendement microfinance : « une position GPS est rattachée à la zone dont le polygone la contient ») | unitaires (rayon, trous, bords), intégration |

## Décisions retenues par défaut (contestables)

- **D-1039-1 — Types de lieu** : `POINT_DE_VENTE`, `ENTREPOT`, `MAGASIN`, `AGENCE` ; un lieu n'est rattaché qu'une fois, à la
  fois, à une même zone (`RATTACHEMENT_EXISTANT`) ; changer son rôle = terminer puis rattacher.
- **D-1039-2 — Emprise facultative** : polygone GeoJSON (anneaux fermés, trous permis), sur la zone (`EMPRISE_INVALIDE`).
- **D-1039-3 — Localité** : égalité exacte sans casse ni accents (« Agoè » = « AGOE », « Agoè-Nyivé » ≠ « Agoè »).
- **D-1039-4 — Plusieurs candidates rendent `NON_RESOLU` (`AMBIGU`), les zones nommées** : le consommateur décide ; un
  point sur une frontière commune est ambigu, jamais attribué au hasard.
- **D-1039-5 — Un lieu se résout par ses rattachements** : son principal s'il en a un seul, sinon `AMBIGU`.
- **D-1039-6 — `GET /resolution` est un service de référentiel**, jamais sur le chemin de lecture d'un consommateur (AD-9).
- Le fait `pdv.point-de-vente.changed@1` (rattachement automatique) attend que pdv existe ; d'ici là, rattachement par API.

## Preuves

Node 24 : **440** unitaires ; **13** e2e. MongoDB réel : **91** tests d'intégration (12 de rattachement et résolution).
Recette depuis `origin/dev` (98ed21c) : 95/95. PR reseau-service#10, `dev` 9117794.
