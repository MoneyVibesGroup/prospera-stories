# STORY-1036 : La publication de `reseau.portee.changed@1`

Status: done

**Complexité :** élevée (un contrat neuf, attendu par d'autres groupes ; son défaut ouvrirait des données)

**Épic :** EPIC-050 (la portée est publiée, et elle fait foi chez les consommateurs)
**Dépôt :** `MoneyVibesGroup/reseau-service`
**Plage :** groupe D, n° 7 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). **Jalon du 27/11**, livré
le 16/11. Attendu par C-1004, puis par 223, 227, 238.

---

## Pourquoi

La portée voyage par **read-model**, jamais par le jeton (AD-5) : `reseau-service` publie l'état absolu de la portée de
chaque utilisateur, et chaque consommateur filtre ses propres données avec. Le contrat doit être figé, au registre, et
fail-closed par construction.

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 7)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **État absolu**, clé `(organisationId, userId)` : `<organisationId>:<userId>` | intégration ; recette (clé lue sur Kafka) |
| AC-2 | **Par l'outbox**, dans la transaction qui change la portée — et quand l'arbre change la résolution (nœud créé sous un nœud hérité, déplacement) | intégration (révisions 1 → 4) |
| AC-3 | **Schéma au registre en BACKWARD** : `contrat/schemas/reseau.portee.changed.json`, sujet `reseau.portee.changed-value` | Karapace réel : enregistrement, compatibilité, 4 tests (ajout facultatif compatible ; requis ajouté, type changé, propriété retirée refusés) |
| AC-4 | **Annoncé dans « ⚠ Contrats » de D** avant la fusion | prospera-stories#536, fusionnée avant reseau-service#7 |
| AC-5 | Chaque fait produit est valide pour le schéma ; le schéma refuse ce qu'il interdit | test de contrat (Ajv) ; recette : 3 faits validés contre le schéma lu au registre |

## Décisions retenues par défaut (contestables)

- **D-1036-1 — Le fait porte la portée RÉSOLUE** (la liste des nœuds, héritage et exclusions appliqués) : les
  consommateurs n'ont pas l'arbre. `TOTALE` reste une valeur (`{ totale: true }`).
- **D-1036-2 — Une portée retirée se publie `RETIREE` et VIDE**, même si elle était totale : fail-closed par
  construction.
- **D-1036-3 — `revision` croissante par clé** (en plus de `version`, la portée déclarée) : chaque publication
  l'incrémente ; le consommateur garde la plus haute. Une republication par l'arbre ne change pas `version`.
- **D-1036-4 — L'écriture résolue est bornée par la lecture résolue** (AD-7), y compris quand l'arbre change après
  l'attribution (un nœud d'écriture déplacé hors de la lecture) : du côté fermé. Défaut de modèle trouvé par la preuve.
- **D-1036-5 — Topic sans suffixe** : `reseau.portee.changed` (D-1031-4).
- **D-1036-6 — Karapace dans le compose du dépôt** (profil `registre`, sans port publié) et un **émetteur de jetons de
  recette** (profil `recette`) pour jouer le parcours HTTP sur la pile sans `auth-service`.
- **D-1036-7 — La lecture seule à l'échéance n'arrête pas la publication** (manifeste) : un retrait se propage toujours.

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **45 suites, 423 tests** unitaires (dont le contrat) ; **13 e2e** ; build.
- MongoDB réel : **67** tests d'intégration (dont 5 de publication : attribution, nœud sous un nœud hérité, nœud hors
  portée, déplacement, retrait).
- Karapace 6.2 réel : sujet créé (id 1), compatible BACKWARD, 4 tests du registre.
- Recette sur la pile `grp-d` avec un vrai jeton RS256 : droit, KYC et identité publiés sur Kafka et projetés ; zones
  créées, portée attribuée, nœud ajouté sous Lomé, portée retirée ; **3 faits lus sur `reseau.portee.changed`**,
  révisions 1, 2, 3, lecture 2 → 3 nœuds puis `RETIREE` vide, **tous valides contre le schéma enregistré**.
- Recette depuis `origin/dev` (91b7f63, volumes neufs) : `healthy`, 71/71.
- PR reseau-service#7, `dev` 17dcf14.
