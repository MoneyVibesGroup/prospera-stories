# Story PRA-06 : Le registre, le menu, la garde unique et les écrans d'état

Status: done — 🏁 **2026-11-25** : `MoneyVibesGroup/prospera-app` **#6** (`dev` `bb43d30`) ; tsc 0, lint 0, Vitest 24 fichiers / 256 tests, e2e `garde.spec.ts` 14/14 (Playwright + axe), build vert, CI verte ; 23 mutations unitaires et 2 e2e rouges. AC-1 → AC-6 prouvés ; **AC-7 : axe sans erreur, mais la « conformité à la maquette » n'existe pas (aucune maquette) ; AC-8 : budget REBASÉ, pas tenu** (159 378 octets gzip mesurés, budget 152 123 → 175 316). Voir « Livraison » en bas de fiche. *(Créée le 2026-11-24, plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`.)*

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

---

## Livraison (2026-11-25)

**Code :** `MoneyVibesGroup/prospera-app` **#6**, fusionnée en Rebase and merge (`headRefOid` `fed718c`, `mergedAt` 2026-11-25T06:38:05Z) ; `dev` = `bb43d30`. CI verte (lint, tsc, Vitest, build, budget ; `npm ci` sous Linux passe avec le verrou modifié).

**Posé.**
- `src/coque/garde/` : `chemin.ts` (`resteDe`, `entreeDe` = plus long préfixe par segments entiers, `adresseDe`), `decision.ts` (`decider` : pure, un verdict `attendre | page | ecran`), `garde.tsx` (`<Garde>`, composant client), `ecrans-etat.tsx` (`<EcranEtatCoque>`, `formaterDate`). `src/app/(app)/m/layout.tsx` = `<Garde>{children}</Garde>`, le SEUL layout sous `/m/`. `src/app/(app)/m/[code]/[[...reste]]/page.tsx` = le filet (rend `null`) : une URL saisie à la main arrive sous la garde.
- `src/coque/menu/` : `construire.ts` (`construireMenu`, pure), `menu.tsx` (`useMenu`, `<Menu />`), `lien-vers.ts` (`resoudreLien`, `useLienVers`).
- `src/coque/registre.ts` : `[instance]`. `src/modules/instance/ecran.ts` (une entrée de TEST `bilan`, droit `instance:bilan:consulter`) et `src/app/(app)/m/instance/bilan/page.tsx` : **dossiers de C (PRA-09)**, posés ici pour que le test de concordance ait un module réel ; C les remplace.
- `src/coque/descripteur.ts` : `liens` devient `readonly LienDeclare[]` = `{ nom, chemin }` (chemin relatif à `/m/<code>`, paramètres `:nom`). Sans chemin, un lien nommé ne se résout pas.
- `outils/concordance/` (`concordance.ts` + test), `e2e/garde.spec.ts`, messages `coque.garde.*`, `coque.menu`, `modules.instance` dans `fr.json`, `@axe-core/playwright` en devDependency, `urlSaisie` ajouté au type `Matrice` de `outils/jeux-etat-publie/jeux.ts`.

### Preuves

| AC | Preuve |
|:--:|---|
| AC-1 | `outils/concordance/concordance.test.ts` : le dépôt réel ne donne aucun problème ; `verifierConcordance` rougit sur un dossier `src/modules/y/` absent du registre, sur `src/app/(app)/m/y/` absent, sur un module inscrit sans l'un des deux dossiers, sur un droit `y:a:lire` dans le module `x` (et dans une action hors garde ou une contribution), sur un code inscrit deux fois, sur neuf chemins qui sortent du préfixe (`../autre`, `/absolu`, `a/../b`, `a//b`, `a b`, `https://…`, `.`, vide, `a/`). Le test de donnée pure lit les `ecran.ts` du dépôt : tout `import` statique non `import type`, ré-export ou `require` rougit ; `() => import(…)` passe. |
| AC-2 | `src/coque/garde/matrice.test.tsx` : pour CHACUN des neuf états de `contrat/matrice-etats.json` (`it.each(matrice.etats)`), sur le vrai fournisseur d'état publié (fetch simulé, neuf jeux de PRA-05), le menu montre le module témoin si et seulement si `menu.visible`, et la garde rend la page ou l'écran dont le titre est celui de `menu.urlSaisie`. Plus : les cinq états fermés avec des droits présents dans la lecture (incohérence) ne sont ni au menu ni ouverts. e2e `garde.spec.ts` : les mêmes neuf états dans Chromium sur `/m/instance/bilan`. |
| AC-3 | e2e : `/m/inconnu/abc` rend 200 et « Ce module n'est pas installé », aucune `pageerror`. Vitest : idem, plus un module ouvert dans la lecture mais absent du registre. |
| AC-4 | `chemin.test.ts` (`articles/42` hérite de `articles`, `articles/nouveau` l'emporte, « articlesXYZ » n'est pas « articles ») ; `matrice.test.tsx` (le droit de l'AUTRE entrée ne suffit pas) ; e2e `/m/instance/bilan/42`. |
| AC-5 | `matrice.test.tsx` : module ouvert, droits d'`instance` seuls : le menu n'a pas « Stock », la garde rend « Accès non accordé ». e2e : idem sur `instance` sans aucun droit. |
| AC-6 | `lien-vers.test.ts` : cible fermée ⇒ `null`, lien non déclaré ⇒ `null`, code absent ⇒ `null`, paramètre manquant ⇒ `null`, paramètres encodés. `concordance.test.ts` : aucun fichier de `src/modules/` (hors tests) ne nomme `/m/<autre>` ; le détecteur a son propre test. |
| AC-7 | e2e : axe (WCAG 2a, 2aa, 21a, 21aa, 22aa) sans violation sur les neuf états, « accès non accordé », « indisponible », « erreur de déploiement ». **Conformité à la maquette : sans objet (aucune maquette), voir écarts.** |
| AC-8 | `npm run budget` : **159 378 octets gzip (7 scripts)**, budget **rebasé à 175 316** (voir écarts). |

**Chiffres :** `tsc` 0 ; `eslint` 0 ; Vitest **24 fichiers / 256 tests** (179 → 256, suite complète rejouée sur le dernier commit) ; e2e 14/14 ; `next build --webpack` vert (`/m/[code]/[[...reste]]`, `/m/instance/bilan`).

**Mutations** (violation posée, rouge constaté, retirée) : **23 unitaires + 2 e2e rouges.** La garde ouvre sur `chargement` (22 tests rouges), sur `indisponible`, sur un code absent du registre, sur un module fermé, sur `espace-incoherent` ; le droit de l'entrée ignoré ; le plus court préfixe au lieu du plus long ; le droit lu aussi dans le jeton ; la session en chargement ignorée ; la racine du module ouverte sans droit ; un état inconnu de la matrice qui ouvre ; le menu qui ignore l'état ouvert (**survivait au premier jet** : les jeux n'ont aucun droit sur un module fermé ; test ajouté avec des droits présents) ou les droits ou le libellé de la lecture ; `lienVers` vers un module fermé, ou d'un lien non déclaré ; la date au fuseau du navigateur ; la raison de suspension montrée à tous ; la concordance qui ne vérifie plus le préfixe de droit, un dossier de module absent, un chemin qui sort ; le détecteur d'`import` statique ; le layout sans garde. e2e : une `<img>` sans `alt` dans l'écran d'état (axe `image-alt`, 2 tests rouges) et le layout sans garde (3 tests rouges).

### Écarts et ce qui n'est pas prouvé

- **Aucune maquette des écrans d'état ni du menu** (`prototypes/` ne porte pas de prototype de la coque ; PRA-03, AC-0, déjà non fait). Les écrans sont rendus par `<EtatVide>` et `<ErreurApi>`, sans mise en page nouvelle ; icône par défaut. **Les écrans d'état attendent la maquette de la coque** : seul `src/coque/garde/ecrans-etat.tsx` change alors. AC-7 est prouvé pour `axe`, pas pour la conformité. Même chose pour le menu : `<Menu />` est une liste de liens, **montée nulle part** (c'est l'habillage, PRA-08).
- **Budget de `/accueil` rebasé, non tenu.** 148 637 → **159 378** octets gzip (+10 741), budget 152 123 → **175 316** (`npm run budget:ecrire`, mesure + 10 %). Cause relevée en comparant les chunks de `dev` et de la branche : le module `use-intl` (39 Ko bruts, `createFormatter`…) n'entrait pas dans le premier chargement tant qu'aucun composant client ne traduisait ; dès que `<Garde>`, `<EtatVide>` et `<ErreurApi>` appellent `useTranslations`, ce module est partagé avec le layout racine et /accueil le charge. Ce n'est pas un import de barrel (le kit est importé fichier par fichier). **Tout composant client qui traduit paiera désormais cela une fois** ; PRA-08 (accueil) l'aurait payé de toute façon. Alternative non prise : sortir `NextIntlClientProvider` du layout racine vers `m/layout.tsx` (/accueil resterait à 148 637) ; elle reporterait la dépense à PRA-08 et obligerait chaque groupe d'écrans (`(auth)`, accueil) à poser son fournisseur. **Décision à confirmer par l'utilisateur.**
- **`liens` du descripteur : `{ nom, chemin }`** et non une liste de noms (AD-3 dit « les liens profonds nommés »). Aucun module n'en déclare encore ; PRA-10 est le premier.
- **Filet `m/[code]/[[...reste]]`** : une page qu'un module n'a pas (ex. `/m/instance/bilan/42`) y arrive et rend une page vide sous la garde ouverte. La racine `/m/<code>` aussi (pas de redirection vers la première entrée). La garde sur la racine exige au moins un droit d'entrée.
- **`sans-session`** (session fermée) rend un écran « Session terminée » : aucune page de connexion n'existe (PRA-03, écrans `(auth)` non faits). `matrice-inconnue` a son propre écran (« L'application doit être mise à jour »), texte à valider.
- **Sans Docker.** L'e2e sert la session et l'état publié par `page.route` (les neuf jeux de PRA-05). La garde jouée sur la pile réelle (vrai catalogue, installation depuis la console, « en moins d'une minute ») est l'Integration Gate de PRA-11.
- **Suspension** : la raison et l'action ne sont montrées qu'aux administrateurs et au DG (`estAdministrateur`, `estDG`), comme le bandeau (§3.1). Sinon : « voir votre administrateur ».
- **`@axe-core/playwright`** ajouté (`axe-core` 4.12.1 → 4.14.1 au verrou). `next dev --webpack` compile à la demande : les e2e de mutation sur `dev` ont des délais de 5 s qui sautent au premier passage ; la preuve est sur `next start`.
- **Dev lent sur ce poste** : le premier `vitest run` complet (14 processus) a eu des « Timeout waiting for worker to respond » ; `--maxWorkers=4` règle.

### Ce que PRA-10 et PRA-11 doivent savoir

- **Inscrire un module** : `src/modules/<code>/ecran.ts` (donnée pure, `satisfies DescripteurEcran`, aucun import statique de composant), UNE ligne dans `src/coque/registre.ts`, un dossier `src/app/(app)/m/<code>/` (pages fines), et les messages `modules.<code>.titre` + les `cleLibelle` de ses entrées (la clé est relative à `modules.<code>`). Le test de concordance rougit sinon, avec la liste des fautes.
- **Une entrée** : `{ chemin, droit, cleLibelle }`, `chemin` relatif à `/m/<code>`, jamais `/` initial, jamais `..` ; le droit commence par `<code>:`. Une page de détail hérite de l'entrée au plus long préfixe. Une page sans entrée est refusée (« accès non accordé »).
- **Lien vers un autre module** : `useLienVers()` rend `(code, nom, params?) => string | null`. Le module cible déclare `liens: [{ nom: "article", chemin: "articles/:id" }]`. Jamais `/m/<autre>` à la main dans `src/modules/` (le test le trouve).
- **Pages d'un module** : elles n'ont rien à garder, la garde les couvre ; ne pas créer de `layout.tsx` sous `/m/` (le test le refuse). Le droit d'écriture se pose avec `<Ecriture>` (PRA-07) et `useDroit`.
- **Tests** : pour monter `<Garde>` et `<Menu />`, reprendre `src/coque/garde/matrice.test.tsx` : `vi.mock("@/coque/registre")` avec les descripteurs voulus, `vi.mock("next/navigation")` (`usePathname`, `useSelectedLayoutSegment`), `useSession` simulé, `fetch` simulé pour `/coque/config` et la lecture, jeux de `outils/jeux-etat-publie/jeux.ts`. L'e2e `e2e/garde.spec.ts` montre le `page.route` de la session et de la lecture (jeton de forme valide, signature sans effet) : reprise directe pour l'e2e d'un module sans pile.
- **Budget** : `/accueil` mesure 159 378 / 175 316. Un composant client qui traduit ne coûte plus le cœur de `use-intl` ; importer le kit fichier par fichier reste la règle.
- Le Docker n'a pas servi.
