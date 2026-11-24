# Story PRA-06 : Le registre, le menu, la garde unique et les écrans d'état

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A · **Semaine visée :** S5 · **Points :** 5
**Dépôt :** `prospera-app` (dossiers `src/coque/registre.ts`, `src/coque/menu/`, `src/coque/garde/`, `src/app/(app)/m/layout.tsx`)
**Spine :** AD-3, AD-4, AD-6, AD-21
**Dépend de :** PRA-05 ; maquette des écrans d'état validée en PRA-03. **Débloque :** PRA-08, PRA-09, PRA-10.

---

## User Story

**En tant qu'**utilisateur,
**je veux** un menu qui ne montre que les modules installés et ouverts pour moi, et un écran clair quand j'arrive sur
un module fermé,
**afin de** ne jamais tomber sur un écran cassé, même par une URL saisie à la main.

## Périmètre

**DANS le périmètre :**

1. **Le descripteur `ecran.ts`** (AD-3) : type TypeScript de `code`, `entrees`, `actionsHorsGarde`, `liens`,
   `emplacements`, `contributions`, `interrupteurs`, `routesPubliques`. Donnée pure : un test rougit si un
   `ecran.ts` importe un composant autrement que par `() => import(…)`.
2. **Le registre** `src/coque/registre.ts`, qui importe chaque `ecran.ts` explicitement. Premier module inscrit :
   `instance` (l'Administration, PRA-09), avec une entrée de test.
3. **Le test de concordance** : `src/modules/*`, le registre et `src/app/(app)/m/*` coïncident ; aucun `chemin` ne
   sort de son préfixe ; chaque droit commence par `<code>:`.
4. **Le menu** : une entrée par module **ouvert** (AD-5) dont au moins une entrée a un droit présent (AD-6). Libellé
   de premier niveau = `libelle` du module dans la lecture ; s'il manque, `modules['<code>'].titre`.
5. **La garde unique** `src/app/(app)/m/layout.tsx` (AD-4) : composant client, `useSelectedLayoutSegment` pour le
   code, l'entrée au **plus long préfixe** de l'URL pour le droit. Ouvert et droit présent ⇒ la page ; sinon l'écran
   d'état. Un code absent du registre ⇒ `NON_INSTALLE`.
6. **Les écrans d'état** (maquette validée en PRA-03) : non installé, en cours d'installation, suspendu (« voir votre
   administrateur »), essai terminé (« effacement le … », date affichée au fuseau de l'organisation), accès non
   accordé, service momentanément indisponible.
7. **`lienVers(code, nomDuLien, params)`** : rend `null` si la cible est fermée ou si le lien n'est pas déclaré.
8. **La matrice jouée** : un test de concordance menu/garde joue les neuf états de la matrice (jeux de PRA-05) et
   vérifie, pour chacun, ce que le menu montre et ce que la garde rend.

**HORS périmètre :** les bandeaux et `<Ecriture>` (PRA-07), l'accueil (PRA-08).

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | Le test de concordance rougit sur un dossier `src/modules/x/` absent du registre, et sur un droit `y:…` dans le module `x` | Vitest |
| AC-2 | La matrice jouée : pour chacun des neuf états, menu et garde rendent ce que la matrice dit | Vitest |
| AC-3 | `/m/inconnu/abc` saisi à la main rend « non installé », sans erreur | Playwright |
| AC-4 | `/m/instance/<page>/<id>` hérite du droit de l'entrée `<page>` | Vitest |
| AC-5 | Un module ouvert sans aucun droit de l'utilisateur n'apparaît pas au menu, et la garde rend « accès non accordé » | Vitest |
| AC-6 | `lienVers` vers un module fermé rend `null` ; aucun `/m/<autre>` écrit à la main dans `src/modules/` (test de recherche) | Vitest |
| AC-7 | Les écrans d'état sont conformes à la maquette et passent `axe` sans erreur | Playwright + axe |
| AC-8 | Le budget de `/accueil` (PRA-01) tient | CI |

## Fini quand

AC-1 → AC-8 prouvés, PR fusionnée, fiche à `done`, journal de A à jour ; prévenir C (PRA-08, PRA-09 débloquées).
