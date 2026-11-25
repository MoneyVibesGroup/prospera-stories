# Story PRA-01 : Le squelette de la coque : un dépôt neuf, l'arbre de la spine, les règles qui rougissent

Status: done — 🏁 **2026-11-25** : `MoneyVibesGroup/prospera-app` **#1** (`dev` `8d19099`) ; tsc 0, lint 0, Vitest 23/23, build `standalone` vert, budget `/accueil` 138 293 octets gzip (budget 152 123), CI GitHub verte sur Node 24 ; huit mutations rouges. Voir « Livraison » en bas de fiche. *(Créée le 2026-11-24, plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`.)*

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

---

## Livraison (2026-11-25)

**Code :** `MoneyVibesGroup/prospera-app` **#1** fusionnée en Rebase and merge (`headRefOid` `9636a06`, `mergedAt` 2026-11-25T01:59:26Z) ; `dev` = `8d19099`. CI de la PR verte (lint, tsc, Vitest, build, budget) ; CI de `dev` relancée par la fusion.

**Branches (choix de A).** Dépôt vide : premier commit `63a1fbb` (README, `.gitignore`, `.gitattributes` LF) poussé sur `main` ; `dev` créée depuis lui et **posée branche par défaut** ; code sur la branche `pra-01` (PR vers `dev`). `main` ne porte donc que le premier commit : elle recevra `dev` à la livraison, comme dans les autres dépôts. ⚠️ La **protection de `main` n'est pas posée** : le dépôt est privé sur une offre gratuite et l'API répond 403 (« Upgrade to GitHub Pro or make this repository public »). À poser par l'utilisateur (réglages du dépôt) ou en passant l'organisation à l'offre payante.

**Ce qui est copié de l'app expert-comptable** (`git -c core.autocrlf=false archive origin/dev`, `8ca3acd`) : `package.json` et verrou, `tsconfig`, PostCSS, Prettier, `components.json`, `globals.css` (jetons du design system, tel quel), les 12 composants shadcn/ui (déplacés sous `src/coque/ui/`, alias de `components.json` suivis), les cales jsdom de Vitest, la config Playwright (port :3200). **Versions de l'app du jour** : Next 16.2.10, React 19.2.4, TanStack Query 5.101+, next-intl 4.13+, Vitest 4.1, en retrait de la Stack de la spine (Next 16.4.x, React 19.3.x, Query 5.107.x, next-intl 4.14.x). La fiche demande « celles de l'app du jour » : la montée de version est une story à part (écart nommé, non bloquant). Retirés : `openapi-typescript` et `scripts/gen-api.mjs` (PRA-05 copie le contrat, ne le génère pas), tout `features/`, `lib/api`, `lib/auth`, `app/api/auth/*`, `env.ts`.

**Ce qui est posé.** L'arbre du Structural Seed en entier (un `README.md` d'une ligne par dossier vide), `src/coque/descripteur.ts` (le type `DescripteurEcran`, AD-3) et `src/coque/registre.ts` (`registre: readonly DescripteurEcran[] = []`) ; le kit `src/coque/ui/` (12 composants shadcn + `<Liste>`, `<EtatVide>`, `<ErreurApi>`, `<Confirmer>`, `index.ts`) ; `/accueil` (titre « Accueil », rien d'autre ; `/` y redirige) ; `src/coque/i18n/` (une locale `fr`, messages `coque`, `accueil`, `ui`) ; `outils/lint/regles.mjs` (UNE source des règles, lue par `eslint.config.mjs` et par le test), `outils/fixtures-lint/`, `outils/anti-verticale/`, `outils/budget/` ; `.github/workflows/ci.yml` (Node 24).

**Dossiers de C.** `src/coque/{bandeaux,emplacements,habillage,espace}/` : un `README.md` d'une ligne qui dit « Squelette. Dossier de C ». **`src/modules/instance/` n'est PAS créé** (l'arbre de la fiche ne le liste pas ; `src/modules/` porte un README) : C le crée avec PRA-09.

### Preuves

| AC | Preuve |
|:--:|---|
| AC-1 | `npm run dev` sert `http://localhost:3200/accueil` : `curl` rend 200 avec `<h1>Accueil</h1>` et `<title>Prospera</title>` ; `/` rend 307 vers `/accueil` ; capture à 360 px (titre seul) ; e2e Playwright `e2e/accueil.spec.ts` vert. |
| AC-2 | `outils/lint/regles.test.ts` lance la VRAIE `eslint.config.mjs` sur `outils/fixtures-lint/` (cwd et `ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH` posés) : `modules/a/x.ts` important `modules/b` rougit (`boundaries/dependencies`) ; l'import de `src/coque/` et celui de son propre module passent ; `coque/vers-module.ts` et `coque/menu/profond.ts` (profondeur) rougissent ; `coque/registre.ts` passe. |
| AC-3 | `radix-ui`, `lucide-react`, `sonner` importés dans un module rougissent (`no-restricted-imports`) ; `radix-ui` dans `coque/ui/` passe ; le FICHIER `coque/ui/sonner` du kit n'est pas pris pour la bibliothèque. |
| AC-4 | `Date.now()` et `new Date()` rougissent dans `modules/` et `coque/etat-publie/` ; `new Date('2026-01-01')` et `performance.now()` passent. |
| AC-5 | `outils/anti-verticale/anti-verticale.test.ts` : 12 variantes rougissent (`===`, `!==`, `==`, ordre inverse, `switch`, `['a','b'].includes(verticale)`, `codeVerticale`, `organisation.vertical`…), 4 cas permis (affectation, commentaire, argument de fonction) passent ; le même test balaie `src/` et attend zéro occurrence. |
| AC-6 | `outils/budget/budget-chargement.json` : mesure 138 293 octets gzip (6 scripts, 469 476 bruts), **budget 152 123 (= mesure + 10 %)** ; en CI sous Linux la mesure est 138 272. `npm run budget` sort en 1 au-dessus du budget (mutation 8). |
| AC-7 | CI GitHub de la PR #1 verte sur Node 24 (Install, Lint, Typecheck, Test, Build, Budget) ; `dev` relancée à la fusion. |

**Chiffres (poste Node 25.2.1 ; CI Node 24) :** `tsc --noEmit` 0 erreur ; `eslint` 0 ; Vitest 4 fichiers / 23 tests ; `next build --webpack` vert (`/`, `/accueil`, `/_not-found`) ; budget tenu.

**Mutations (violation posée, rouge constatée, violation retirée) :**

1. `src/modules/a/x.ts` important `@/modules/b/y` : `boundaries/dependencies` rouge ; avec `@/coque/ui/utils` et `./y` : vert.
2. `radix-ui` dans un module : `no-restricted-imports` rouge.
3. `Date.now()` dans un module : rouge ; `new Date()` dans `coque/etat-publie/` : rouge ; `new Date("2026-01-01")` : vert.
4. `dangerouslySetInnerHTML` dans `coque/habillage/` : `react/no-danger` rouge.
5. `src/coque/menu/m.ts` important un module (alias `@/`) : rouge.
6. `if (verticale === 'assurance')` posé dans `src/coque/habillage/v.ts` : le test anti-verticale rougit (« src/ ne compare jamais une verticale »).
7. Règle elle-même cassée (sélecteur de `Date.now` remplacé) : `regles.test.ts` rougit sur `date-now.ts` des deux dossiers ; restaurée.
8. Budget : `layout.tsx` importe le barrel `@/coque/ui` au lieu des fichiers : build vert mais `npm run budget` répond « BUDGET DÉPASSÉ. 237 212 octets gzip pour un budget de 152 123 », sortie 1 ; restauré.

### Écarts et ce qui n'est pas prouvé

- **Le rouge du budget n'est pas rejoué dans la CI GitHub** : prouvé en local par la mutation 8 (même commande que la CI), pas par une exécution rouge sur GitHub. Idem pour les mutations de lint 1 à 5 : rejouées sur le poste ; la CI ne rejoue que les fixtures.
- **Protection de `main` non posée** (403 de l'API, offre gratuite) : GitHub n'impose donc pas la CI verte avant fusion, c'est la discipline des sessions.
- **Versions en retrait de la spine** (voir plus haut). `@types/node` monté à ^24 (`engines` >=24) ; le poste tourne en Node 25.2.1, la CI Node 24 est la référence.
- **Pas de job e2e en CI** (la fiche n'en demande pas) ; `npm run e2e` (Chromium) passe en local.
- **Le barrel du kit coûte 99 Ko gzip** à la première page : `src/app/layout.tsx` importe `@/coque/ui/theme-provider` et `@/coque/ui/sonner` fichier par fichier. À garder pour toute importation de la coque (le test de budget le rattrape).
- **Constats à retenir :** (1) `no-restricted-imports` sans ancre : le motif `sonner` attrapait `@/coque/ui/sonner` (expressions régulières ancrées désormais) ; (2) `boundaries/dependencies` (v7.4.4) s'écrit `policies` avec `from: { element: { type } }` : la forme `rules` / `from.type` de la doc v6 est silencieuse ; (3) il classe depuis `process.cwd()` : variable `ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH` pour un test sur des fixtures ; (4) l'option `mode` des éléments est dépréciée ; (5) le verrou écrit sous Windows manque `@emnapi/core` et `@emnapi/runtime` : `npm ci` échoue sous Linux (« Missing: @emnapi/runtime from lock file »), corrigé par deux devDependencies explicites.

### Ce que PRA-03 doit savoir

- La session va dans `src/app/coque/` (route handlers `session/*`, `config`, `sante`) et `src/coque/securite/` ; `src/app/(auth)/` est prêt. Aucun `proxy.ts` ni BFF n'existe : `/api/auth/*` n'a pas été copié.
- `layout.tsx` ne monte ni `QueryClientProvider` ni session : PRA-03/04 les ajoutent, **en important les fichiers du kit un par un** (le budget).
- `src/coque/descripteur.ts` et `registre.ts` existent (types AD-3) : PRA-06 les complète sans les recréer.
- Dépendances déjà installées : `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, `next-intl`. Absentes : `openapi-typescript`, `tus-js-client`.
- `npm run build` exige Internet (polices Google : Inter, Geist Mono) ; `NEXT_DEV_ORIGINS` pour servir à un autre poste.
- `regles.test.ts` prend ~12 s ; ESLint seul ~15 s à froid sur ce poste chargé.
- Le générateur de barrels de l'IDE recrée des `index.ts` vides partout : les purger avant `tsc`, build et commit ; le seul `index.ts` voulu est `src/coque/ui/index.ts`.
- Docker n'a pas servi.
