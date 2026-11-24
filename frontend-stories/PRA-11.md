# Story PRA-11 : L'Integration Gate de la coque sur le vrai moteur, et son image

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A · **Semaine visée :** S6 (vert au plus tard le **18/12**) · **Points :** 3
**Dépôts :** `prospera-app` ; `prospera-recette` (parcours de recette de la coque)
**Spine :** AD-15, AD-20, AD-21, AD-22, AD-23 (fin de la dette), Environnements, convention « fini » d'un module d'écran
**Dépend de :** PRA-01 → PRA-10. **Débloque :** les modules `pdv`, `catalogue`, `stock` (PRA-12 → 14) et la démo du 15/01.

---

## User Story

**En tant que** PO,
**je veux** voir la coque tourner en image de production, derrière Traefik, sur le vrai moteur et les vrais services,
installer un module depuis la console et le voir apparaître,
**afin de** savoir avant la pause qu'elle tiendra la démo du 15/01.

## Périmètre

**DANS le périmètre :**

1. **L'image** : `next build --webpack`, `output: 'standalone'`, Node 24, journaux JSON sur la sortie standard,
   `/coque/sante` pour la supervision. Elle se construit depuis `git archive origin/dev`, jamais depuis un checkout
   de travail. Elle porte le **numéro de version de plateforme** (AD-20) et ne contient aucun jeu de test.
2. **Le profil `coque` de PRA-02** routé vers l'image (et non plus vers `next dev`).
3. **Le parcours de recette** dans `prospera-recette` (essai d'un prospect distributeur) :
   - ouvrir l'essai, se connecter sur `essai.localhost:8080`, voir la marque d'essai ;
   - `reseau` non installé ⇒ écran d'état ; installer `reseau` depuis la console ⇒ menu en moins d'une minute ;
   - créer une zone et une agence ⇒ relues dans `reseau-service` ;
   - passer le module en `LECTURE_SEULE` ⇒ plus d'écriture, export atteignable depuis l'Administration ;
   - désinstaller puis réinstaller ⇒ aucune perte, cache purgé ;
   - la matrice des neuf états jouée sur la vraie lecture quand le moteur sait les produire, sinon sur les jeux de
     PRA-05, en le disant.
4. **`axe`** sur chaque entrée ; **budget** de `/accueil` tenu sur l'image.
5. **La fin de la doublure** : aucune trace des jeux de lecture dans l'image ; l'amendement d'AD-23 (PRA-05) est
   écrit dans la spine de la coque, section des amendements.

**HORS périmètre :** la recette croisée des deux hébergements (EPIC-148, S10) ; les modules `pdv`, `catalogue`,
`stock`.

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | L'image se construit depuis `git archive origin/dev`, démarre `healthy` derrière Traefik, `/coque/sante` vert | sortie de `docker compose ps` + `curl` |
| AC-2 | Le parcours de recette est vert de bout en bout, **sans aucun mock** | sortie de la recette |
| AC-3 | `reseau` installé depuis la console apparaît au menu en moins d'une minute | mesure dans la recette |
| AC-4 | `axe` sans erreur sur toutes les entrées ; budget tenu sur l'image | sortie de Playwright + CI |
| AC-5 | L'image ne contient ni `outils/`, ni jeux de lecture, ni variable `NEXT_PUBLIC_*` propre à une instance | inspection de l'image |
| AC-6 | La spine de la coque porte l'amendement d'AD-23 | PR de docs |

## Notes pour le développeur

- Verrou Docker du poste principal, pile `grp-a`, `down -v` à la fin ; les images se reconstruisent depuis
  `origin/dev` après chaque fusion (jamais « équivalent à l'octet près »).
- Seul `docker compose up` voit les `UnknownDependenciesException` d'un service : un service rouge au démarrage est un
  ticket au groupe qui le tient, pas un mock.

## Fini quand

AC-1 → AC-6 prouvés, PR fusionnées (code et recette), fiche à `done`, journal de A à jour ; la suite (PRA-12 → 15)
s'écrit quand leur backend est sur `dev`.
