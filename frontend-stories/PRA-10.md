# Story PRA-10 : Le module d'écran `reseau` : agences, zones et commerciaux, pour la démo du 15/01

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` (modules d'écran métier) · **Groupe :** A · **Semaine visée :** S6 · **Points :** 5
**Dépôt :** `prospera-app` (dossier `src/modules/reseau/`, pages `src/app/(app)/m/reseau/`)
**API :** `reseau-service` (`/api/reseau/v1/…`) : `module`, `noeuds`, `noeuds/{id}`, `zones`, `agences`,
`hierarchie/configuration`, `couverture`, `commerciaux`, `affectations`, `portees`, `journal` (EPIC-044 → 053,
groupe D, STORY-1030 → 1064)
**Droits du manifeste :** `reseau:noeud:consulter`, `reseau:noeud:modifier`, `reseau:affectation:modifier`,
`reseau:decoupage:modifier`, `reseau:portee:attribuer`
**Spine :** AD-2, AD-3, AD-6, AD-7, AD-16, AD-17, convention « fini » d'un module d'écran
**Dépend de :** PRA-06, PRA-07 (et PRA-08 pour la tuile d'accueil). **Débloque :** PRA-11.

---

## User Story

**En tant que** responsable commercial d'un distributeur (en essai ou en réel),
**je veux** voir et organiser mon réseau (zones, agences, commerciaux et leurs affectations) dans la coque,
**afin de** montrer au prospect, le 15/01, un module **installé** et non déployé à la main, avec une agence et une
zone réelles.

## Périmètre

**DANS le périmètre** (le parcours de démo du plan de février §4.1, ligne « Distributeur ») :

0. **Maquette d'abord** : les écrans ci-dessous ajoutés au prototype de la coque, avec des données générées depuis le
   jeu de démonstration du distributeur, republiés et **validés par l'utilisateur**.
1. **Le module d'écran** : `src/modules/reseau/`, `ecran.ts` (entrées, droits, interrupteurs du manifeste, tuile
   d'accueil), inscription au registre, types générés depuis l'OpenAPI de `reseau-service` (`/api/docs`).
2. **L'arbre du réseau** : zones et agences (`noeuds`), avec le détail d'un nœud ; créer une zone, une agence, les
   modifier, sous `<Ecriture>` et `reseau:noeud:modifier`.
3. **Les commerciaux et leurs affectations** : liste, création, affectation à un nœud, sous
   `reseau:affectation:modifier`.
4. **La couverture** : les lieux rattachés par zone et par type ; un type dont le module n'est pas installé se lit
   « non installé », **jamais 0** (règle de STORY-1040).
5. **Le journal** du réseau, en lecture.
6. **La tuile d'accueil** (taille M) : nombre d'agences et de commerciaux.

**HORS périmètre** (stories suivantes si le PO les veut pour février) : découpages (scissions, fusions, transferts),
portées, import, conformité des consommateurs.

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-0 | Maquette publiée et validée | lien + journal |
| AC-1 | Le module est au registre ; le test de concordance (PRA-06) est vert ; aucun import d'un autre module | CI |
| AC-2 | Garde : avec `reseau` `NON_INSTALLE`, `/m/reseau` rend l'écran d'état ; installé depuis la console, le menu le montre en moins d'une minute | Playwright sur la vraie pile |
| AC-3 | En `LECTURE_SEULE`, aucune action d'écriture n'est offerte ; la liste et le détail restent lisibles | Playwright |
| AC-4 | Sans `reseau:noeud:modifier`, créer une zone n'est pas proposé | Vitest |
| AC-5 | Une zone et une agence créées dans la coque se relisent dans `reseau-service` | Playwright sur la vraie pile |
| AC-6 | La couverture affiche « non installé » pour un type dont le module est absent | Playwright |
| AC-7 | Désinstallé puis réinstallé : le cache `['reseau', …]` est purgé, les données se relisent sans perte | Playwright |
| AC-8 | `axe` sans erreur sur chaque entrée ; budget de `/accueil` tenu ; Integration Gate sans mock | CI + Playwright |

## Fini quand

AC-0 → AC-8 prouvés, PR fusionnée, fiche à `done`, journal de A à jour avec PRA-11.
