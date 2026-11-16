# STORY-1043 : Les quatre autres services du distributeur

Status: done

**Épic :** EPIC-222 · **Dépôts :** `prospera-terrain-service`, `prospera-recouvrement-service`,
`prospera-pilotage-service`, `prospera-croissance-service` (créés par l'utilisateur, vides au 16/11) ·
**Plage :** groupe D, n° 14 du lot 2. Dépend de 1042.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Les quatre démarrent par `docker compose up`** (tous leurs profils) et leur santé répond | pile réelle de chacun, puis recette depuis `origin/dev` |
| AC-2 | **Manifestes copiés** à l'octet (empreinte gardée) | `pile-du-moteur.invariant.spec.ts` de chacun |
| AC-3 | **Gates et audit repris de 1042** : une garde par module, la piste chaînée par module, aucun import croisé | e2e, invariants, 4 tests de piste sur MongoDB réel par service |

| Service | Port | Modules | `dev` |
|---|---|---|---|
| terrain | 3413 | `terrain`, `conquete-objectifs` | 0d194cc |
| recouvrement | 3414 | `recouvrement` | dfdffb1 |
| pilotage | 3415 | `dashboard`, `equipe`, `controle-gestion`, `finance-transactions` | f35f023 |
| croissance | 3416 | `marketing`, `studio-social`, `support-client` | 345303d |

## Décisions retenues par défaut (contestables)

- **D-1043-1 — Les quatre sont générés depuis le socle de ventes** par un script (noms, ports, modules, manifestes et
  leurs empreintes, tests adaptés), puis prouvés un à un : le gabarit est éprouvé une fois, les écarts se voient.
- **D-1043-2 — Un code de module à tiret** donne un refus `CONQUETE_OBJECTIFS_NOT_ENTITLED` et une collection
  `conquete_objectifs_audit`.
- **D-1043-3 — `automatisations`** reste porté par `assistant-service` (spine), hors de ce lot.
- Les quatre dépôts acceptent encore squash et commit de fusion : « Rebase and merge » seul reste à poser.

## Preuves

Pour chaque service : Node 24 (lint, ~290 unitaires, 10–11 e2e, build), pile réelle `healthy`, 4 tests d'intégration.
Écarts du gabarit attrapés et corrigés avant fusion : e2e sans piste fournie, attentes d'un second module (recouvrement),
ordre de tri (croissance). Recette depuis `origin/dev` : santé 200 pour les quatre. PR #1 de chaque dépôt.
