# Story PRA-08 : L'habillage, l'accueil et le contrat des emplacements

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** C · **Semaine visée :** S5 · **Points :** 3
**Dépôt :** `prospera-app` (dossiers `src/coque/habillage/`, `src/coque/emplacements/`, `src/app/(app)/accueil/`)
**Spine :** AD-13, AD-16
**Dépend de :** PRA-06. **Débloque :** les tuiles d'accueil de PRA-10 et des modules suivants.

---

## User Story

**En tant qu'**organisation cliente,
**je veux** retrouver ma marque (nom, logo, couleurs, langue) et un tableau de bord où chaque module installé dépose
ses tuiles,
**afin que** la coque soit la mienne sans qu'une ligne de code ne dépende de ma verticale.

## Périmètre

**DANS le périmètre :**

0. **Maquette d'abord** : l'accueil (vide, puis avec deux tuiles fictives de tailles S et M) ajouté au prototype de
   la coque (`prototypes/prospera-app-prototype.html`, créé en PRA-03), republié et **validé par l'utilisateur**.
1. **L'habillage** depuis `accueil` de la lecture : `marque`, `logoUrl` (même origine seulement), `couleurs`
   (`primaire`, `secondaire`, validées par un schéma zod hexadécimal), `langue`. Les couleurs ne se posent **que** sur
   les jetons sémantiques du design system. Avant la connexion : marque Prospera (et marque d'essai si `ESSAI`).
2. **Le contrat d'emplacement** (AD-16) : l'hôte déclare l'emplacement et le type de ses props (des identifiants
   seulement) ; la coque rend chaque contribution dans une frontière d'erreur et un `Suspense`, triée par `ordre`,
   filtrée par son droit et par l'ouverture de son module ; sans contribution ouverte, `<EmplacementVide raison>`,
   distinct de tout « 0 ».
3. **L'accueil** `/accueil` = l'emplacement `accueil`, où chaque module ouvert dépose ses tuiles (`taille` S, M ou
   L), sur une grille qui tient dès 360 px.

**HORS périmètre :** les tuiles métier elles-mêmes (chaque module les apporte).

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | Une couleur invalide (`red`, `#12`, `url(...)`) est ignorée, la couleur Prospera reste | Vitest |
| AC-2 | Un `logoUrl` d'une autre origine n'est pas chargé | Vitest |
| AC-3 | Une contribution qui lève une erreur n'empêche pas les autres tuiles de s'afficher | Testing Library |
| AC-4 | Une contribution d'un module fermé, ou sans le droit de l'utilisateur, n'est pas rendue | Vitest |
| AC-5 | Sans aucune contribution ouverte, l'accueil rend `<EmplacementVide>` avec sa raison | Testing Library |
| AC-6 | L'accueil tient à 360 px sans défilement horizontal, conforme à la maquette, `axe` sans erreur | Playwright + axe |
| AC-7 | Le test anti-verticale de PRA-01 reste vert | CI |

## Fini quand

AC-0 → AC-7 prouvés, PR fusionnée, fiche à `done`, journal de C à jour.
