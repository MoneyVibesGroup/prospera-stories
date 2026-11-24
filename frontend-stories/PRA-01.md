# Story PRA-01 : Le squelette de la coque : un dépôt neuf, l'arbre de la spine, les règles qui rougissent

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A · **Semaine visée :** S3 (fin 27/11) · **Points :** 5
**Dépôt :** `MoneyVibesGroup/prospera-app` (créé, **vide** : cette story pose le premier commit)
**Spine :** AD-1, AD-2, AD-3 (forme), AD-5 (règle `Date.now`), AD-13 (test anti-verticale), AD-21, Structural Seed, Stack
**Dépend de :** rien. **Débloque :** PRA-03 → PRA-11.

---

## User Story

**En tant que** développeur d'un module d'écran,
**je veux** un dépôt `prospera-app` qui a déjà la forme de la spine et dont la CI refuse ce que la spine interdit,
**afin de** n'écrire que mon module, sans pouvoir casser les frontières entre modules.

## Périmètre

**DANS le périmètre :**

1. **Copie de l'app expert-comptable** (décision D-10 de la spine) : `package.json`, configuration Next, Tailwind,
   shadcn/ui, jetons du design system, next-intl, TanStack Query, Vitest, Playwright, ESLint. Les versions sont
   **celles de l'app expert-comptable au jour de la copie** (Stack de la spine : Next 16.4.x, React 19.3.x, Node 24).
   On ne copie **aucun** écran, aucun BFF `/api/auth/*`, aucune route métier.
2. **L'arbre du Structural Seed**, avec des dossiers vides gardés par un `README.md` d'une ligne :
   `src/app/(auth)/`, `src/app/(app)/accueil/`, `src/app/(app)/m/`, `src/app/(public)/p/`, `src/app/coque/`,
   `src/coque/{api,etat-publie,menu,garde,bandeaux,emplacements,habillage,espace,securite,ui,i18n}/`,
   `src/coque/registre.ts` (registre vide, exporté typé), `src/modules/`, `contrat/`, `outils/`.
3. **Le kit `src/coque/ui/`** : réexport des composants shadcn/ui utilisés par l'app expert-comptable, plus
   `<Liste>`, `<EtatVide>`, `<ErreurApi>`, `<Confirmer>` en version minimale (AD-2).
4. **Les règles qui rougissent la CI** :
   - `eslint-plugin-boundaries` (règle `boundaries/dependencies`) : `src/modules/<a>/` n'importe que `src/coque/` et
     lui-même ; `src/coque/` n'importe aucun module sauf `registre.ts` ;
   - `no-restricted-imports` : pas de `radix-ui`, ni de bibliothèque d'interface, hors de `src/coque/ui/` ;
   - interdiction de `Date.now()` et de `new Date()` sans argument dans `src/modules/**` et `src/coque/etat-publie/`
     (AD-5) ;
   - interdiction de `dangerouslySetInnerHTML` hors du kit (AD-19) ;
   - un test Vitest qui cherche `verticale ===` (et ses variantes) dans `src/` et rougit s'il en trouve (AD-13).
5. **Une page `/accueil` vide** (titre, rien d'autre), servie par `next dev` sur **:3200** (`:3000` et `:3100` sont
   pris).
6. **Le budget de chargement** (AD-21) : la CI construit (`next build --webpack`, `output: 'standalone'`), mesure le
   JS du premier chargement de `/accueil`, et écrit le budget = **mesure + 10 %** dans un fichier versionné. Un
   dépassement rougit la CI.
7. **La CI GitHub Actions** : Node 24, `npm ci`, lint, `tsc`, Vitest, build, budget. Branche par défaut `dev`, `main`
   protégée comme dans les autres dépôts.

**HORS périmètre :** la session (PRA-03), le client d'API (PRA-04), l'état publié (PRA-05), toute page de module.

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | Le dépôt contient l'arbre du Structural Seed, et `npm run dev` sert `/accueil` sur :3200 | capture + `curl` |
| AC-2 | Un fichier de test `src/modules/a/x.ts` qui importe `src/modules/b/` fait **rougir** le lint ; l'import de `src/coque/` passe | test de la règle (fixture) |
| AC-3 | Un import de `radix-ui` hors de `src/coque/ui/` fait rougir le lint | fixture |
| AC-4 | `Date.now()` dans `src/modules/**` fait rougir le lint ; `new Date('2026-01-01')` passe | fixture |
| AC-5 | Le test anti-verticale rougit sur une chaîne `if (verticale === 'assurance')` posée en fixture | Vitest |
| AC-6 | Le budget de `/accueil` est écrit dans le dépôt et un dépassement artificiel rougit la CI | sortie de la CI |
| AC-7 | La CI est verte sur `dev` (lint, `tsc`, Vitest, build, budget) | lien de l'exécution |

## Notes pour le développeur

- Les fixtures des AC-2 → AC-5 vivent sous `outils/fixtures-lint/` et sont **exclues** du lint normal ; un test les
  lint explicitement et attend l'erreur. Sinon la CI serait toujours rouge.
- Purger les `index.ts` créés par le générateur de barrels de l'IDE avant chaque build et chaque commit
  (`git ls-files --others --exclude-standard`, jamais `find -delete`).
- Next 16 : `proxy.ts` et non `middleware.ts` ; `cookies()` est asynchrone ; build `--webpack`.
- Le premier commit va sur `main` (dépôt vide), puis `dev` se crée depuis lui ; la suite suit la convention
  `MNV`/`fe` des groupes : branche `PRA-01` depuis `dev`, PR vers `dev`, « Rebase and merge ».

## Fini quand

AC-1 → AC-7 prouvés, PR fusionnée sur `dev`, fiche passée à `done` dans la PR de docs, journal de A à jour avec la
story suivante (PRA-03).
