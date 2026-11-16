# STORY-1040 : La couverture, les zones blanches, les candidats

Status: done

**Épic :** EPIC-052 · **Dépôt :** `MoneyVibesGroup/reseau-service` · **Plage :** groupe D, n° 11 du lot 2. Dépend de 1039.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Couverture comptée sans jugement** : par zone, les lieux rattachés actifs, par type (`GET /couverture`) | intégration |
| AC-2 | Un type dont le module n'est pas installé est **`NON_INSTALLE`, jamais 0** ; sans aucun module qui rattache, une zone n'est pas « blanche » (manifeste, C4) | intégration (sans pdv ni stock, puis stock installé) |
| AC-3 | **Zones blanches listables** (`?blanches=true`) ; la carte se dit non exhaustive (AD-13) | intégration |
| AC-4 | **Fournisseur de candidats** (FR-R34) : zones blanches, nœuds sans responsable, agences fermées avec rattachements actifs — des faits ; la contre-métrique **CM-1** instrumentée | intégration |

## Décisions retenues par défaut (contestables)

- **D-1040-1 — La projection des droits suit aussi les modules qui enrichissent `reseau`** (`pdv`, `stock`, `freelance`,
  manifeste `enrichiPar`) pour savoir s'ils sont installés ; ils n'ouvrent aucune garde.
- **D-1040-2 — Le module d'un type de lieu** : point de vente → `pdv`, entrepôt et magasin → `stock`, agence → `reseau`.
- **D-1040-3 — États** : `COUVERTE` (au moins un lieu), `BLANCHE` (aucun, alors qu'un module qui rattache est installé),
  `NON_INSTALLE` (aucun module qui rattache).
- **D-1040-4 — CM-1** : zones blanches créées depuis plus de 30 jours (horloge du service).
- **D-1040-5 — Les candidats se lisent par `GET /couverture?forme=candidats`** : la route est celle du manifeste ; aucune
  route nouvelle à déclarer.

## Preuves

Node 24 : **441** unitaires ; **13** e2e. MongoDB réel : **95** tests d'intégration (4 de couverture). La garde de
câblage a attrapé une dépendance manquante (`EtatDesModules` non importé par `ReseauModule`), corrigée avant fusion ;
démarrage réel sain. Recette depuis `origin/dev` (98ed21c) : 95/95. PR reseau-service#11.
