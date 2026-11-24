# Story PRA-05 : L'état publié lu, une seule fois, jamais recalculé

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

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
