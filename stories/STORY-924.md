# STORY-924 : la fiche du dossier, surface 2 — la complétude (`GET /dossiers/{id}/completude`)

Status: done

**Complexité :** faible (une fonction pure, une route de lecture, un DTO)

**Ticket :** `tickets/TICKET-BACKEND-fiche-dossier-trois-surfaces-annoncees-inexistantes.md` — surface **2** (les surfaces 1 et 3 ont été
livrées par STORY-916, dossier-service #53)
**Service :** `dossier-service` (`prospera-dossier-service`, :3009) — rien d'autre
**Plage :** groupe A, lot 3, n° 5 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2). Fiche écrite avant de coder.

---

## Constat avant de coder

- Le ticket demande : « ce qui manque à **ce dossier** pour la DSF », en **lecture, jamais en garde** (la saisie progressive est un choix produit,
  STORY-079), qu'un dossier **sans NIF** le dise et n'empêche rien, que le hors-portée rende **404** jamais 403.
- Le seul `/completude` existant est `balance-service GET /profil-societe/completude` : **org-keyed**, donc faux pour un dossier (c'est le cabinet
  qu'il décrirait). Il n'est pas branché ici ; en revanche **sa règle** est la source : STORY-079 (« ce qui **bloque** la DSF vs ce qui est
  **optionnel** ») et `profil-societe.regles.ts` (`CHAMPS_BLOQUANTS_DSF`, `CHAMPS_OPTIONNELS_DSF`, `estRenseigne`). Le dossier a repris l'identité
  de ce profil (STORY-356) : les mêmes champs, sous les noms du dossier (`nifSociete` pour `nif`).
- `dirigeants-requis.util.ts` dit où vit le contrôle de dirigeant : « La complétude bloquante pour la DSF est le lieu de ce contrôle, pas la
  création » — et que `EI`/`AUTRE` n'en exigent pas.
- Le service n'a pas de route de lecture d'un sous-ensemble ; la lecture d'un dossier passe par `trouverParId(id, portee)` (404 hors portée,
  dossier archivé lisible). La complétude suit ce motif ; elle ne lit aucun autre service.

## Ce que la story livre

`GET /api/v1/dossiers/{id}/completude` → 200 :

```
{ dossierId, version, complet, pretPourDsf,
  champsManquants[], champsBloquantsManquants[], champsOptionnelsManquants[] }
```

- **Bloquants** (absence ⇒ `pretPourDsf: false`) : `raisonSociale`, `formeJuridique`, `nifSociete`, `rccm`, `dateCreation`, `pays`, `devise`,
  `objetSocial`, `capitalSocial`, `adresse`, et `dirigeants` **si la forme juridique en exige un** (SA, SAS, SARL, SUARL — `exigeUnDirigeant`).
- **Optionnels** (absence ⇒ `complet: false`, pas de blocage) : `sigle`, `numeroCnss`, `codeNaema`, `secteur`, `email`, `telephone`,
  `actionnaires`, et `dirigeants` quand la forme n'en exige pas.
- `champsManquants` = bloquants puis optionnels (contrat de STORY-079). `complet` = aucun manquant ; `pretPourDsf` = aucun bloquant manquant.
- « Renseigné » = comme `estRenseigne` de `balance-service` : texte non vide après `trim`, nombre fini (un capital de `0` est renseigné), date,
  tableau dont un élément désigne quelqu'un (`[{ nom: "  " }]` ne compte pas).
- Mêmes gardes que `GET /dossiers/{id}` : `@RequiresDossierAccess` de classe, **portée du jeton dans la requête** (collaborateur : ses dossiers ;
  « Mon cabinet » : 404 pour lui ; autre cabinet : 404), pas de `@Roles` (tout membre dans sa portée). Un dossier **archivé** reste lisible
  (D9). **Une lecture : aucune écriture, aucun journal, aucune garde** ; la lecture seule d'abonnement ne la touche pas.
- Route déclarée **après** `GET :id` (un segment de plus, pas de collision) ; documentée à l'OpenAPI (200, 404, 403 de gate).

## Décisions (retenues par défaut, contestables)

- **D-924-1 — `dirigeants` est bloquant seulement pour les formes qui l'exigent.** Le ticket ne fixe pas la liste ; la source la plus précise est
  `dirigeants-requis.util.ts` (EI/AUTRE fail-open assumé). Bloquer l'entrepreneur individuel sur un dirigeant qui n'existe pas rendrait le dossier
  le plus fréquent « jamais prêt ». Pour une EI, `dirigeants` tombe donc dans les optionnels.
- **D-924-2 — La complétude porte sur l'identité du dossier, pas sur l'état du travail.** Ni balance, ni axes, ni exercice, ni mandat (surface 3,
  déjà au journal) ne sont comptés : ils vivent dans d'autres services ou d'autres routes (`/axes`, `/exercices`), et ce service ne lit pas leur
  état pour cette route. L'écran les affiche par leurs propres lectures. Si le PO veut « prêt pour la DSF » au sens large, c'est une story d'agrégat
  à part.
- **D-924-3 — Même liste que le profil de société, aucune invention.** Les champs sont ceux de `CHAMPS_BLOQUANTS_DSF` / `CHAMPS_OPTIONNELS_DSF`
  (STORY-079) ; `nif` y devient `nifSociete`. Pas de pondération en pourcentage : le ticket demande des manquants **nommés**, pas un score.
- **D-924-4 — Les noms de champs sont des identifiants machine**, comme dans le profil de société ; c'est l'écran qui les libelle (le service ne
  fournit aucun texte, comme pour les refus).
- **D-924-5 — `version` et `dossierId` sont publiés** pour que l'écran sache sur quelle version de l'identité la complétude a été calculée
  (la modification d'identité, STORY-916, est sous verrou optimiste par cette même version).

## Critères d'acceptation

- **AC-1** : dossier complet (tous champs, SARL avec dirigeant) ⇒ `complet: true`, `pretPourDsf: true`, trois listes vides.
- **AC-2** : dossier partiel (sans NIF, RCCM, adresse, dirigeants d'une SARL…) ⇒ `pretPourDsf: false`, manquants **nommés** (`nifSociete` y est) ;
  un dossier sans NIF se crée et se lit toujours (rien n'est empêché).
- **AC-3** : dossier sans champ optionnel mais avec tous les bloquants ⇒ `pretPourDsf: true`, `complet: false`.
- **AC-4** : EI sans dirigeant ⇒ `dirigeants` en optionnel, pas en bloquant ; SARL sans dirigeant ⇒ bloquant.
- **AC-5** : chaîne blanche, dirigeant au nom blanc ⇒ non renseignés ; capital `0` ⇒ renseigné.
- **AC-6** : dossier d'un autre cabinet, hors portée du collaborateur, identifiant malformé ⇒ **404** (jamais 403, jamais de fuite) ; dossier
  archivé ⇒ 200.
- **AC-7** : la route figure à l'OpenAPI ; aucune écriture n'est faite (ni dossier, ni journal).
- **AC-8** : mutation (un bloquant retiré de la liste, ou `dirigeants` jamais bloquant) ⇒ test rouge **sur l'assertion**.

## Contrat et mise en service

- **Ajout seul** (§1.8) : une route et un DTO nouveaux ; aucun champ ni route existant ne change. Annoncé dans « ⚠ Contrats » du journal de A
  **avant** la fusion du code (PR de docs d'annonce, fusionnée d'abord).
- Pas de module, provider, dépendance ni Dockerfile touchés : un contrôleur existant gagne une route, un service existant une méthode ⇒ **pas de
  Docker** (§1.5).
- **Suite à prévoir (non faite ici) :** le BFF (`admin-panel`) ne relaie pas encore cette route ; l'onglet « complétude » de la fiche dossier (D) en
  aura besoin : une story de relais BFF (calquée sur STORY-923, en lecture : `GET /api/v1/dossiers/{id}/completude`, tout membre).

## Definition of Done

- [x] `tsc`/build, unitaires et e2e concernés (par chemin), lint des fichiers touchés.
- [x] Mutation rouge sur l'assertion.
- [x] PR code fusionnée (rebase), SHA sur `dev` noté.
- [x] PR de docs : tracker `done`, ticket fermé, journal (924 DONE, suite 925).

## Livraison (2026-11-17)

DONE : dossier-service #55 (dev `768a4aa`). `GET /api/v1/dossiers/{id}/completude`, fonction pure `calculerCompletudeDossier` (`completude.util.ts`), DTO
`CompletudeDossierResponseDto`. `tsc` vert ; unitaires des deux suites touchées 49/49 (dont 23 pour la complétude) ; e2e `dossiers.e2e-spec.ts` 157/157 (10 neufs :
complet, partiel sans NIF avec manquants nommés, prêt sans être complet, EI, archivé, autre cabinet 404, collaborateur non affecté 404 puis affecté 200,
identifiant malformé 404, sans jeton 401, aucune écriture) ; lint des fichiers touchés propre.
Mutations rouges sur l'assertion : (1) `nifSociete` retiré des bloquants ⇒ 2 unitaires + 1 e2e rouges ; (2) `dirigeants` jamais bloquant ⇒ 5 unitaires rouges (l'e2e ne peut pas
l'éprouver : la création refuse déjà une SARL sans dirigeant, DIRIGEANT_REQUIS).
Docker non requis : un contrôleur existant gagne une route, aucun module, provider, dépendance ni Dockerfile.
Suite à prévoir : relais BFF (`GET /api/v1/dossiers/{id}/completude`, lecture, tout membre) avant l'onglet de la fiche dossier côté D.
