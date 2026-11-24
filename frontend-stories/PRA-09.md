# Story PRA-09 : L'Administration, première partie : bilan d'installation, rôles, données, essai

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** C · **Semaine visée :** S5-S6 · **Points :** 5
**Dépôt :** `prospera-app` (dossier `src/modules/instance/`, pages `src/app/(app)/m/instance/`)
**API :** `platform-catalog-service` (`/api/instance/v1/…` : état publié, `essais/{organisationId}`,
`mises-en-service/{organisationId}`) ; `auth-service` (`/api/auth/v1/…` : rôles et droits de l'organisation) ; les
`actionsHorsGarde` des modules ouverts
**Spine :** AD-3, AD-6, AD-7, AD-14
**Dépend de :** PRA-06, PRA-07. **Débloque :** l'Administration, deuxième partie (PRA-15, nommée, sans fiche).

---

## User Story

**En tant qu'**administrateur ou DG d'une organisation cliente (ou prospect en essai),
**je veux** voir ce qui est installé et dans quel état, donner les rôles, et récupérer les données de chaque module
même quand il est suspendu,
**afin de** gérer mon instance sans appeler Money Vibes.

## Périmètre

**DANS le périmètre** (l'inventaire d'AD-14, sans ce qui attend l'agent et la centrale) :

0. **Maquette d'abord** : les quatre écrans ci-dessous ajoutés au prototype de la coque, republiés et **validés par
   l'utilisateur**. Critère « parcours facile » : un geste principal par écran.
1. **Le module d'écran `instance`** : dossier, `ecran.ts`, inscription au registre ; `instance` est toujours
   `EN_SERVICE` ; chaque entrée exige son droit `instance:*` (hors intersection).
2. **Bilan d'installation** : modules, état publié, santé, date de passage de chaque état, depuis la lecture et
   `mises-en-service/{organisationId}`.
3. **Rôles et droits** : les membres de l'organisation, leurs rôles, et l'attribution d'un droit. L'écran ne propose
   **que** les droits que la lecture déclare (`modules[].droits` des modules ouverts, et `instance:*`). Le refus
   `CONSENTEMENT_RESERVE_AU_DG` s'affiche par son message traduit.
4. **Données** : l'export et les états réglementaires **de chaque module** (ses `actionsHorsGarde`), dans tous les
   états que FR-43 ouvre (tous sauf `NON_INSTALLE`), `SUSPENDU` et `DESINSTALLE` compris.
5. **Pour le prospect** : le compte à rebours de l'essai et l'export pendant `ESSAI_TERMINE` (`essais/{organisationId}`).
6. **Renvoi vers la Reprise** : une entrée qui mène au module d'écran `reprise` (`/m/reprise/…`) par `lienVers`,
   absente tant que `reprise` n'est pas ouvert.
7. Les entrées sans objet sur la plateforme (planifier, revenir, fichier, support) **n'apparaissent pas** quand
   `instance.hebergement` vaut `PLATEFORME`.

**HORS périmètre** (PRA-15, quand l'agent et la centrale servent leurs routes) : mises à jour, dépôt de fichier,
tunnel de support, consentement, interrupteurs.

## Avant de coder

- Relever dans `auth-service` (`origin/dev`) les routes de rôles et de droits de tenant réellement servies et leur
  OpenAPI ; générer les types. Si l'attribution d'un droit `<code>:…` de tenant n'est pas servie, **ticket backend**
  au groupe qui tient `auth` (B), et l'écran rend l'attribution « bientôt » sans la simuler.

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-0 | Maquette publiée et validée | lien + journal |
| AC-1 | Un utilisateur sans droit `instance:*` ne voit pas l'Administration au menu, et `/m/instance` rend « accès non accordé » | Playwright |
| AC-2 | Le bilan d'installation montre l'état de chaque module tel que la lecture le rend | Playwright sur la vraie pile |
| AC-3 | L'écran des rôles ne propose aucun droit d'un module fermé | Vitest |
| AC-4 | L'export d'un module `SUSPENDU` reste atteignable depuis l'Administration ; celui d'un module `NON_INSTALLE` non | Vitest + Playwright |
| AC-5 | En `ESSAI_TERMINE`, le prospect voit la date d'effacement et peut exporter | Playwright |
| AC-6 | Sur la plateforme (`PLATEFORME`), les entrées planifier, revenir, fichier, support sont absentes | Vitest |
| AC-7 | `axe` sans erreur sur chaque entrée ; Integration Gate sur le vrai backend, sans mock | Playwright + axe |

## Fini quand

AC-0 → AC-7 prouvés, PR fusionnée, fiche à `done`, journal de C à jour (tickets ouverts nommés).
