# Story PRA-05 : L'état publié lu, une seule fois, jamais recalculé

Status: done — 🏁 **2026-11-25** : `MoneyVibesGroup/prospera-app` **#5** (`dev` `25452ca`) ; tsc 0, lint 0, Vitest 19 fichiers / 179 tests, build vert, budget 148 637 / 152 123 octets gzip, CI verte ; 14 mutations rouges ; AC-9 joué sur la pile réelle. AC-1 → AC-9 prouvés SANS écran (écart : aucune maquette validée). Voir « Livraison » en bas de fiche. *(Créée le 2026-11-24, plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`.)*

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A · **Semaine visée :** S4 (fin **04/12**) · **Points :** 5
**Dépôt :** `prospera-app` (dossiers `src/coque/etat-publie/`, `contrat/`, `outils/`)
**API :** `platform-catalog-service` — `GET /api/instance/v1/etat-publie/{organisationId}` (STORY-936), contrat figé
`contrat/etat-publie.openapi.json` 1.0.0 (STORY-932), matrice `contrat/matrice-etats.json` (`versionMatrice: 1`)
**Spine :** AD-5, AD-6, AD-10 (espace lu ≠ configuration), AD-15, AD-23 (amendée, voir ci-dessous)
**Dépend de :** PRA-04. **Débloque :** PRA-06, PRA-07, PRA-08.

---

## User Story

**En tant que** coque,
**je veux** lire l'état publié de mon organisation à un seul endroit et le traduire par une seule table,
**afin que** deux écrans n'affichent jamais deux états différents, et qu'un échec de lecture n'ouvre jamais un module.

## Ce qui change par rapport à la spine (AD-23)

La spine prévoyait une **doublure serveur** de l'état publié jusqu'au premier gate, parce que le moteur ne servait
pas la route. **Il la sert depuis STORY-936.** Retenu par défaut (contestable dans le journal de A) :

- le développement se fait sur **la vraie route**, derrière le Traefik de PRA-02 ;
- la « doublure » se réduit à **des jeux de lecture**, un par état publié (les neuf de la matrice), générés depuis
  `contrat/matrice-etats.json` et `contrat/etat-publie.openapi.json` dans `outils/jeux-etat-publie/`, pour les tests
  Vitest et Playwright. Aucun serveur de doublure ; rien n'entre dans l'image.

## Périmètre

**DANS le périmètre :**

1. **Copies gardées** des deux fichiers de contrat dans `contrat/`, avec un test qui les compare à la source
   (`platform-catalog-service` sur `origin/dev`, empreinte notée dans un `ORIGINE.json`, comme les copies du
   catalogue). Types générés par `openapi-typescript`.
2. **La lecture** sous la clé `['coque', 'etat-publie']` : toutes les **30 s** onglet visible
   (`refetchIntervalInBackground: false`), au retour sur l'onglet, à la connexion, et sur demande de PRA-04 après un
   refus nommé. Une seule lecture en vol.
3. **L'échec** : le dernier état connu reste affiché ; sans état connu, rien n'est ouvert et l'écran « service
   momentanément indisponible » s'affiche.
4. **La table unique** « état publié → ouvert, écriture, bandeau, destinataire », **générée depuis la matrice** (pas
   recopiée à la main). Un état inconnu se lit `NON_INSTALLE`. Une `versionMatrice` inconnue **ferme tout**.
5. **Les crochets** : `useModule(code)` → `{ ouvert, peutEcrire, sante, interrupteur(nom) }` (un nom inconnu rend
   éteint) ; `useDroit('<code>:<objet>:<action>')`, seule voie vers `utilisateur.droitsEffectifs`. La coque ne lit
   jamais `perms[]` du jeton.
6. **« Maintenant »** = `instance.heureDeReference` + temps écoulé depuis la lecture (`performance.now()`), exposé
   par `useMaintenant()`. Jamais `Date.now()` (la règle de PRA-01 le garde).
7. **La purge** : quand un module quitte l'ensemble ouvert, ses requêtes `['<code>', …]` sont retirées du cache.
8. **L'espace** : si `instance.espace` de la lecture diffère de `espace` de `/coque/config`, la coque affiche une
   erreur de déploiement et n'ouvre rien (AD-10).
9. **Le branchement de PRA-04** : `surRefusDeDroit` déclenche la relecture.

**HORS périmètre :** le menu, la garde et les écrans d'état (PRA-06), les bandeaux (PRA-07).

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | Le test de copie rougit si `contrat/etat-publie.openapi.json` ou `contrat/matrice-etats.json` diffère de la source | Vitest |
| AC-2 | Les neuf jeux de lecture sont générés et la table rend, pour chacun, l'ouverture et l'écriture que la matrice dit | Vitest (table jouée sur les neuf états) |
| AC-3 | Un état `INCONNU_XYZ` ⇒ `NON_INSTALLE` ; `versionMatrice: 2` ⇒ aucun module ouvert | Vitest |
| AC-4 | Échec de lecture après un succès : l'ancien état reste ; échec sans succès préalable : écran « indisponible », rien d'ouvert | Vitest |
| AC-5 | Onglet caché : aucune lecture ; retour sur l'onglet : une lecture | Vitest (visibilité simulée) |
| AC-6 | `useDroit` rend faux pour un droit absent de `droitsEffectifs`, même s'il est dans le jeton | Vitest |
| AC-7 | Un module qui passe de `EN_SERVICE` à `DESINSTALLE` voit ses requêtes retirées du cache | Vitest |
| AC-8 | `useMaintenant()` suit `heureDeReference`, pas l'horloge du navigateur (horloge du navigateur décalée d'un jour dans le test) | Vitest |
| AC-9 | Lecture réelle par `:8080` après connexion : la coque obtient l'état publié de son organisation | Playwright sur la vraie pile |

## Fini quand

AC-1 → AC-9 prouvés, PR fusionnée, fiche à `done`, journal de A à jour (avec l'amendement d'AD-23 dans les
décisions), story suivante PRA-06.

## Livraison (2026-11-25)

**Code :** `MoneyVibesGroup/prospera-app` **#5**, fusionnée en Rebase and merge (`headRefOid` `cbc5ad2`, `mergedAt` 2026-11-25T05:15:48Z) ; `dev` = `25452ca`. CI verte (lint, tsc, Vitest, build, budget).

**Posé.** `contrat/etat-publie.openapi.json` + `contrat/matrice-etats.json` (copies à l'octet de `platform-catalog-service` `origin/dev` `1aa17ae`, empreintes dans `contrat/ORIGINE.json` ; `npm run contrats:catalogue` les recopie) ; types générés `src/coque/api/types/instance.ts` (`npm run contrats -- instance`) ; `src/coque/etat-publie/` : `table.generee.ts` (GÉNÉRÉE par `npm run table-etat-publie`), `modele.ts` (fonctions pures), `fournisseur.tsx` (contexte, monté dans `src/app/layout.tsx`), `lecteur.tsx` (la requête, chargée à la demande), `crochets.ts` (`useModule`, `useDroit`, `useMaintenant`, `useEtatPublie`) ; `outils/jeux-etat-publie/jeux.ts` (neuf jeux générés) ; `e2e/etat-publie.spec.ts`.

### Preuves

| AC | Preuve |
|:--:|---|
| AC-1 | `outils/contrats/copie-catalogue.test.ts` : chaque copie a l'empreinte de `ORIGINE.json` ; si `../platform-catalog-service` est là, chaque copie est identique à l'octet au fichier de la source au commit noté. Mutation : un espace ajouté à `matrice-etats.json` ⇒ 2 tests rouges. |
| AC-2 | `modele.test.ts` : la table jouée sur les neuf jeux (ouverture, écriture, bandeau, destinataire = matrice) ; `outils/etat-publie/table.test.ts` : le fichier commité est la sortie du générateur à l'octet, `ouvert` = `garde.lecture` ouverte à `UTILISATEUR` = `droitsEffectifs`. Mutation : `LECTURE_SEULE` écrit à la main ⇒ 4 rouges. |
| AC-3 | `INCONNU_XYZ` ⇒ `NON_INSTALLE` fermé ; `versionMatrice: 2` (et `0`) ⇒ statut `matrice-inconnue`, aucun module ouvert, ni écriture, ni droit, ni interrupteur (fonctions pures et fournisseur monté). |
| AC-4 | `fournisseur.test.tsx` : après un succès, un 503 garde l'ancien état (`pret`, `enEchec`) ; sans succès (503, panne réseau, 404) : `indisponible`, rien d'ouvert, aucun droit. |
| AC-5 | Visibilité simulée : onglet caché 120 s ⇒ 0 lecture ; retour ⇒ +1 ; 30 s visible ⇒ +1 ; reconnexion ⇒ +1 ; refus nommé (`demanderRelectureEtat`) ⇒ +1, pas de seconde dans la rafale de 5 s. |
| AC-6 | `useDroit` faux pour un droit dans `perms[]` du jeton mais absent de `droitsEffectifs` ; vrai dans le sens inverse. |
| AC-7 | `EN_SERVICE` → `DESINSTALLE` : `['stock', …]` retirées, `['instance', …]` gardées ; réinstallé ⇒ pas de cache périmé ; un échec de lecture ne purge rien ; une matrice inconnue purge tout. |
| AC-8 | Navigateur décalé d'un jour (`vi.setSystemTime`), `performance.now()` simulée : `useMaintenant()` = `heureDeReference` + 60 s, jamais l'horloge du poste. |
| AC-9 | **Pile réelle** (`grp-a`, verrou « A PRA-05 », `up --no-build`, images existantes) : inscription, connexion par `/coque/session/ouvrir`, rechargement, la coque lit `GET /api/instance/v1/etat-publie/{org}` par `:8080` avec le jeton de la session : 200, `organisationId` = `org` du jeton, `versionMatrice` 1, `instance.espace` = `/coque/config`, module `instance` `EN_SERVICE`, **une seule** lecture en 3 s. `PRA05_PILE=1 npx playwright test e2e/etat-publie.spec.ts` : 1/1. `down -v` fait, verrou retiré. |

**Chiffres :** tsc 0 ; eslint 0 ; Vitest **19 fichiers / 179 tests** (suite complète sur `cbc5ad2`) ; build vert ; budget **148 637 / 152 123** octets gzip (+1 582 : le lecteur est chargé à la demande ; chargé en tête il aurait coûté 153 452 et dépassé le budget).

**Mutations** (violation posée, rouge constaté, retirée) : 1 l'écran recalcule l'état depuis les dates (1 rouge) ; 2 une seconde lecture (7) ; 3 version de matrice inconnue acceptée (4) ; 4 lecture en arrière-plan (1) ; 5 pas de purge (4) ; 6 un échec efface l'ancien état (3) ; 7 « maintenant » = horloge du navigateur (1) ; 8 droit lu aussi dans le jeton (28, voir écarts) ; 9 espace non vérifié (2) ; 10 table écrite à la main (4) ; 11 copie de la matrice altérée (2) ; 12 un état inconnu ouvre (2) ; 13 un interrupteur sans liste allumé (1, après ajout d'un test : la mutation passait au vert) ; 14 refus de droit non branché (1). **14/14 rouges.**

### Écarts et ce qui n'est pas prouvé

- **Aucun écran** : « service momentanément indisponible » (AC-4) et l'erreur de déploiement (AD-10) sont des **statuts** (`useEtatPublie().statut` : `indisponible`, `espace-incoherent`, `matrice-inconnue`), non rendus : aucune maquette validée. À rendre par PRA-06 avec la maquette.
- **AD-23** : la route est réelle, la « doublure » se réduit aux neuf jeux de lecture (`outils/jeux-etat-publie/`), comme la fiche le retenait. Pas de serveur de doublure.
- **Lecteur chargé à la demande** (`React.lazy`, monté seulement session ouverte) : sans cela le budget de `/accueil` passait à 153 452 / 152 123. Conséquence : le premier rendu après connexion a un statut `chargement` un instant de plus.
- **La relecture après refus** garde le comportement par défaut de TanStack (`invalidateQueries` annule une lecture en vol et la relance) : une seule lecture en vol à la fois, mais la lecture partie avant le refus est abandonnée.
- **`interrupteur(nom)`** rend aussi faux quand le module est fermé (choix, non écrit dans la fiche). **`useMaintenant`** ne court pas quand l'horloge de référence est `HORLOGE_INDISPONIBLE` (AD-6 : aucune échéance ne tombe).
- **Mutation 8** : elle rougit 28 tests parce que `useSession` n'est pas dans l'arbre du test, pas pour la seule raison visée ; la preuve d'AC-6 est le test lui-même (droit du jeton, absent de la lecture ⇒ faux).
- **Le catalogue de la pile `grp-a` sert l'espace REEL** : avec une coque en `PROSPERA_ESPACE=ESSAI`, la lecture réelle donne `espace-incoherent` (AD-10 joué sur un vrai service). L'e2e se joue avec la coque lancée dans l'espace du catalogue (REEL).
- **L'e2e ne voit pas l'état dans l'interface** (aucun consommateur monté) : il prouve la lecture réelle et sa cardinalité, pas le statut `pret` à l'écran. L'adresse e-mail est marquée vérifiée en base par `docker exec` (pas de service de notification dans la pile).
- **Le test de copie contre la source** est sauté quand `../platform-catalog-service` est absent (CI) : seule l'empreinte de `ORIGINE.json` y est contrôlée. Une dérive de la source n'est vue que sur un poste qui a le dépôt.
- Les bandeaux transverses (`bandeauxTransverses` de la matrice) ne sont pas dans la table : ils relèvent de PRA-07.

### Ce que PRA-06, PRA-07 et PRA-08 doivent savoir

- `import { useModule, useDroit, useMaintenant, useEtatPublie } from "@/coque/etat-publie/crochets"` (fichier par fichier, pas de barrel). `useModule(code)` rend `{ ouvert, peutEcrire, sante, interrupteur(nom), etat, libelle, urlSaisie, bandeau, finLe, effacementLe, suspension }` : `urlSaisie` est le code de l'écran d'état de la matrice (`MODULE_NON_INSTALLE`, `ESSAI_TERMINE`, `MODULE_SUSPENDU`…), `bandeau` = `{ cle, destinataires, date: "finLe" | "effacementLe" | null }` (PRA-07 filtre par `destinataires` avec `estAdministrateur`/`estDG` de la lecture).
- `useEtatPublie()` : `statut` ∈ `chargement | pret | indisponible | matrice-inconnue | espace-incoherent | sans-session`. **La garde (PRA-06) n'ouvre que sur `pret` + `useModule().ouvert`** ; sur `indisponible` elle rend « service momentanément indisponible », sur `espace-incoherent` l'erreur de déploiement ; `chargement` = attendre, jamais ouvrir. `enEchec` dit que la dernière relecture a échoué (le dernier état reste).
- `useDroit('<code>:<objet>:<action>')` : seule voie vers `droitsEffectifs` ; `<Ecriture>` (PRA-07/08) combine `peutEcrire` et un droit nommé.
- `useMaintenant()` rend `Date | null` (null avant la première lecture), se rafraîchit chaque seconde ; pour les comptes à rebours et la fraîcheur des données. Jamais `Date.now()` ni `new Date()` sans argument dans `src/coque/etat-publie/` et `src/modules/` (ESLint).
- Les tests de PRA-06 : `jeuDeLecture(etat)` / `jeuxDeLecture()` de `outils/jeux-etat-publie/jeux.ts` (neuf états, module témoin `stock`, organisation `0123456789abcdef01234567`). Pour monter les crochets, simuler `useSession` (`vi.mock("@/coque/securite/fournisseur-session")`) comme `fournisseur.test.tsx`.
- Un module qui quitte l'ensemble ouvert perd ses requêtes `['<code>', …]` : les clés d'un module commencent par son code. `['coque', …]` est réservé (`etat-publie`, `config`).
- Pour une nouvelle version de la matrice ou du contrat : `npm run contrats:catalogue`, `npm run contrats -- instance`, `npm run table-etat-publie`, puis les tests (la table et les types sont régénérés, jamais édités). `versionMatrice` ≠ 1 ferme tout tant que `VERSION_MATRICE_CONNUE` n'est pas relevée.
- Gate avec la pile : la coque doit tourner dans l'espace du catalogue de la pile (REEL pour le compose racine) ; `PRA05_PILE=1 npx playwright test e2e/etat-publie.spec.ts`.
