# STORY-1042 : Le socle de `prospera-ventes-service`

Status: done

**Épic :** EPIC-222 · **Dépôt :** `MoneyVibesGroup/prospera-ventes-service` (créé par l'utilisateur, vide au 16/11) ·
**Plage :** groupe D, n° 13 du lot 2.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | Modules **`commande`, `facturation`, `entrepot`, `approvisionnement`, chacun sa gate** (`<CODE>_NOT_ENTITLED`), son profil compose, son manifeste copié à l'octet | e2e, invariants, pile réelle (4 profils `healthy`) |
| AC-2 | **Le lint « aucun import croisé »** | `modules-isoles.invariant.spec.ts` ; mutation (commande importe facturation) ⇒ rouge |
| AC-3 | **Piste d'audit chaînée** (AD-21) : par module, en ajout seul ; une ligne modifiée ou supprimée est détectée et nommée | 4 tests sur MongoDB réel |
| AC-4 | **Chaque module s'installe et se désinstalle seul** : sa garde, son profil, ses collections préfixées (`<code>_audit`) | e2e (le droit d'un module n'ouvre pas l'autre) ; une collection par module |

## Décisions retenues par défaut (contestables)

- **D-1042-1 — Le socle de `prospera-sinistres-service` est le gabarit** (multi-module, gate par module, D-980-1 → 6),
  port **3412** (spine distributeur), piles `grp-d`.
- **D-1042-2 — La piste d'audit est une bibliothèque du socle** (`src/socle/audit/`) liée à une collection par module ;
  chaque ligne scelle son contenu et l'empreinte de la précédente (JSON canonique, sha256) ; `GET /<code>/piste` rend
  l'intégrité et la tête (ce que l'agent recevra chaque jour).
- **D-1042-3 — Les bibliothèques de la plateforme** (`vocabulaires/`, `contrats/distributeur/`) ne sont **pas** livrées
  ici : le squelette n'en consomme aucune, et le catalogue des faits d'AD-20 demande d'être relu avec la spine.
  **Reste à faire** (noté au journal) avec la bibliothèque `series` (STORY-1044) ou par Dev A.
- **D-1042-4 — Le dépôt accepte encore squash et commit de fusion** : « Rebase and merge » seul reste à poser par
  l'utilisateur ; la session ne fusionne qu'en rebase.

## Preuves

Node 24 : **296** unitaires ; **11** e2e ; lint ; build. Pile réelle (`commande`, `facturation`, `approvisionnement`,
`entrepot`) : `healthy`, santé 200. MongoDB réel : **4** tests de la piste. Mutation de l'isolement ⇒ rouge. Recette
depuis `origin/dev` (80c2cfb) : santé 200. PR prospera-ventes-service#1 ; `main` bfcca83.
