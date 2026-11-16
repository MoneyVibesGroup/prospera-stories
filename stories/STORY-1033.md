# STORY-1033 : La hiérarchie récursive à profondeur configurable

Status: done

**Complexité :** moyenne (arbre récursif, configuration, anti-cycle, déplacement en deux temps)

**Épic :** EPIC-046 (hiérarchie récursive, profondeur configurable)
**Dépôt :** `MoneyVibesGroup/reseau-service`
**Plage :** groupe D, n° 4 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5). Dépend de STORY-1032.

---

## Pourquoi

Les réseaux visés ont trois niveaux, mais pas tous, et pas pour toujours. La spine (AD-2) interdit de coder un nombre
de niveaux : la profondeur est une **règle**, jamais une structure. Un déplacement d'arbre change qui voit quoi : il se
fait sur **compte rendu préalable**, et l'anti-cycle se vérifie **à l'écriture**.

## Ce qui doit être vrai à la fin (plan lot 2, §5, n° 4)

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | Un seul agrégat récursif (`Noeud` + `parentId`) ; aucun niveau codé (schéma, type ou nom de champ) | code ; `Arbre` calcule niveau, hauteur, profondeur |
| AC-2 | **Passer de 3 à 4 niveaux par configuration**, sans schéma ni reprise : le 4e niveau refusé `PROFONDEUR_MAX_ATTEINTE`, puis accepté après `PUT /hierarchie/configuration` (NFR-4, SM-5 : « à prouver une fois, en vrai ») | intégration sur MongoDB réel |
| AC-3 | La profondeur ne redescend pas sous celle du réseau existant (`PROFONDEUR_INSUFFISANTE`) | intégration |
| AC-4 | **Cycle refusé** (`CYCLE_INTERDIT`) : sous lui-même ou sous un descendant ; deux déplacements croisés simultanés ne ferment jamais une boucle | intégration (course réelle) ; mutation |
| AC-5 | **Déplacement précédé d'un compte rendu** : ce qui bouge, niveaux avant et après, empreinte ; le déplacement exige l'empreinte, un compte rendu périmé est refusé (`COMPTE_RENDU_PERIME`) ; fait `reseau.noeud.moved@1` | intégration |
| AC-6 | Restitution de la hiérarchie complète et du chemin d'un nœud jusqu'à la racine, avec niveaux et libellés (FR-R15) | intégration |

## Décisions retenues par défaut (contestables)

- **D-1033-1 — Configuration par organisation** (`reseau_hierarchies` : `profondeurMax`, 3 par défaut, et
  `libellesDeNiveaux`, des libellés jamais des colonnes). Borne de bon sens : 10 niveaux.
- **D-1033-2 — Sérialisation par la hiérarchie de l'organisation** : chaque création et chaque déplacement incrémentent
  `revision` dans leur transaction ; deux changements concurrents entrent en conflit et l'un se rejoue sur l'arbre neuf.
- **D-1033-3 — Le compte rendu porte une empreinte** (sha256 de la révision, du nœud, du parent visé et des niveaux
  après) : tout changement de la hiérarchie entre le compte rendu et le déplacement le rend périmé.
- **D-1033-4 — Les routes** : `GET /noeuds/{id}/chemin` (manifeste), `GET /noeuds?forme=arbre` (la « hiérarchie
  complète » du manifeste), `PUT /hierarchie/configuration` (`reseau:decoupage:modifier`), `POST /noeuds/{id}/deplacement/
  compte-rendu` et `POST /noeuds/{id}/deplacement` (`reseau:noeud:modifier`).
- **D-1033-5 — Les portées qui changent** figurent au compte rendu ; elles sont calculées depuis STORY-1035 (la portée
  n'existait pas encore ici).
- **D-1033-6 — Un nœud fermé ne se déplace plus**, et l'on ne déplace rien sous un nœud fermé.

## Preuves

- Stage `verification` (Node 24) : lint 0 ; **41 suites, 387 tests** unitaires ; **13 e2e** ; build.
- MongoDB réel : **10 tests** HTTP de la hiérarchie (dont 3 → 4 niveaux, course de deux déplacements croisés) ;
  **39** au total.
- Mutation : anti-cycle neutralisé ⇒ `CYCLE_INTERDIT` rouge.
- Recette depuis `origin/dev` (b12a988, volumes neufs) : `healthy`, 62/62.
- PR reseau-service#4, `dev` 2ddbebd.
