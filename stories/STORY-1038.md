# STORY-1038 : Le redécoupage ne réécrit pas le passé

Status: done

**Complexité :** moyenne (versions de découpage, trois opérations, restitution datée)

**Épic :** EPIC-047 (le redécoupage ne réécrit pas le passé) · **Dépôt :** `MoneyVibesGroup/reseau-service`
**Plage :** groupe D, n° 9 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). Précède STORY-1039.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | Scission, fusion, transfert **datés et tracés** | intégration (versions 2, 3, 4 ; journal `DECOUPAGE_*`) |
| AC-2 | **La version de découpage dans chaque événement** (`reseau.noeud.*@1`, responsable, portée, `reseau.decoupage.versionne@1`) | intégration (7 faits de la scission en version 2) |
| AC-3 | **Une période passée se restitue avec sa version** (`GET /noeuds?forme=arbre&aLaDate=…`) | intégration (février : version 1, Lomé entière ; avril : version 2) |
| AC-4 | Une zone remplacée se ferme par la fermeture ordinaire : une affectation active la retient, nommée ; une répartition incomplète est refusée, nommée | intégration |

## Décisions retenues par défaut (contestables)

- **D-1038-1 — Une version = une période** (`reseau_decoupages`) : à la naissance de la suivante, la version close garde
  l'**instantané** du réseau de la fin de sa période ; la version courante, c'est l'arbre vivant. La version 1 de départ
  s'instantane au premier redécoupage.
- **D-1038-2 — La version s'ouvre avant les écritures** de l'opération : chaque fait de l'opération porte la nouvelle.
- **D-1038-3 — Scission** : la zone se ferme, chaque enfant ouvert va dans une part et une seule (`REPARTITION_*`) ;
  **fusion** : zones de même parent (`FUSION_PARENTS_DIFFERENTS`), localités réunies par défaut ; **transfert** : des
  nœuds et leur descendance sous un autre parent (anti-cycle, profondeur).
- **D-1038-4 — Un redécoupage prend effet maintenant** (horloge du service) : jamais rétroactif.
- **D-1038-5 — La naissance d'un nœud suit l'horloge du service** (`creeLe`), plus l'horodatage technique de Mongoose :
  défaut trouvé par la preuve (une restitution datée lisait l'heure du système).
- **D-1038-6 — Les opérations exigent `reseau:decoupage:modifier`** ; la liste des versions se lira par le journal
  étendu (STORY-1041).

## Preuves

- Node 24 : lint 0 ; **434** unitaires ; **13** e2e ; build. MongoDB réel : **79** tests d'intégration (8 de redécoupage).
- Recette depuis `origin/dev` (a8a047a, volumes neufs) : `healthy`, 79/79. PR reseau-service#9.
