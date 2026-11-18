# STORY-1081 : le collaborateur modifie l'identité d'un dossier de son portefeuille, par le BFF

Status: done

**Complexité :** faible (3 pts ; une garde levée dans chaque service, une relecture mise sous portée)

**Origine :** D-923-1 **renversée par l'utilisateur le 2026-11-18** (journal de A, « État », lot 4, réponse 3 : « le
relais BFF `PATCH /dossiers/{id}` s'ouvre au collaborateur, comme le plan du lot 3 le disait ») ; D-916-1 (« l'ouverture
aux collaborateurs (D12) demandera un `409` muet pour eux : suite à tracer »).
**Dépôts :** `MoneyVibesGroup/prospera-dossier-service` (`src/modules/dossiers/`) ; `MoneyVibesGroup/prospera-admin-panel-service`
(BFF de la console, `src/dossiers/`).
**Plage :** reçue de A (STORY-1080 → 1084, 1093 ; plan du lot 4 §3, ligne 5). Identifiant réservé par A le 18/11.
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 5 : **Docker : non** (D-L4-3). Fini quand : le
collaborateur modifie l'identité d'un dossier de son portefeuille ; le 409 de version reste muet (D12) ; D-923-1
renversée par l'utilisateur.
**Débloque :** l'onglet Identité de la fiche dossier pour le collaborateur (FE-061, D12 : « le collaborateur PEUT
modifier »).
**Suivante :** STORY-976 (première story de B avec une pile).

**Sources lues :** plan du lot 4 (§0, §1, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journal de B (état, passations,
pièges, « ⚠ Contrats ») ; journal de A (« Pièges rencontrés », pièges de 923, réponses du 18/11, passation à B) ;
journaux de C et D (aucune demande neuve à B depuis 1084) ; entrée du tracker (« prérequis à vérifier au rituel : le
409 de version muet (D12) côté dossier-service ») ; fiches STORY-916, STORY-923 ; FE-061 (D12, notes techniques) ;
FE-068 (D12 et le fil d'activité).

---

## Passation constatée (première story de B sur ces deux dépôts, D-L4-1)

- **BFF** (`prospera-admin-panel-service`) : `origin/dev` = **`18a9893`** (STORY-923), le commit nommé par A ; **rien n'a
  bougé depuis**. Le checkout du poste (`admin-panel`) était sur `dev` à `b10fedd`, 4 commits derrière (dont le
  passage à Node 24, `package.json` et `Dockerfile` changés) : branche partie d'`origin/dev`, `npm ci --ignore-scripts`.
- **dossier** (`prospera-dossier-service`) : `origin/dev` = **`768a4aa`** (STORY-924), le commit nommé par A ; **rien n'a
  bougé depuis**. Le checkout était sur `dev`, 8 commits derrière, `package.json` changé (client Kafka de Confluent) :
  avance rapide de `dev`, branche partie d'`origin/dev`, `npm ci --ignore-scripts`.

## Ce qui existait déjà (relu avant la fiche)

- **dossier-service** : `PATCH /dossiers/:id` (STORY-916) porte `@Roles(TENANT_ADMIN)` (D-916-1). Le reste est déjà
  prêt pour le collaborateur : le service lit le dossier par `trouverParId(id, porteeDeLAppelant(jeton))`, dont la
  **portée est dans la requête Mongo** (`filtrePortee` : `TENANT_ADMIN` ⇒ tout le cabinet ; sinon
  `estLeCabinet ≠ true` et `responsableUserId` ou `contributeursUserIds` = le porteur) ⇒ hors portée ou « Mon cabinet »
  : `404 DOSSIER_INTROUVABLE`, jamais `403`. Le verrou de version rend `409 CONFLIT_CONCURRENT` **sans `details`**
  (déjà muet). L'acte est journalisé `IDENTITE_MODIFIEE` à son auteur et compté dans le fil d'activité de
  l'administratrice (STORY-360 : tous types, sauf ses propres actes) : c'est la traçabilité que D12 exige.
- **Le seul défaut d'une ouverture telle quelle** : le `409 DOSSIER_NIF_DEJA_UTILISE` relit le dossier en conflit par
  `trouverParNifNormalise(orgId, pays, nif)`, **sans portée**, et le nomme (`details.dossierId`,
  `details.raisonSociale`) : un collaborateur qui saisirait le NIF d'un client d'un collègue, ou celui de « Mon
  cabinet », apprendrait son identifiant et sa raison sociale (D6/D11). Le commentaire du service le disait : « une
  future route ouverte aux `TENANT_USER` devra revérifier ce point ».
- **Qui contrôle le portefeuille** : **`dossier-service` seul**. Les affectations (responsable, contributeurs) ne vivent
  que chez lui ; le BFF n'a ni ces données ni de raison de les relire. Le BFF ne contrôle que le **rôle** (un membre de
  cabinet), et relaie le jeton tel quel (`aud` porte déjà `dossier-service`).
- **BFF** : `@Roles(TENANT_ADMIN)` sur le contrôleur (D-923-1) ; les refus amont traversent par **code seulement**, liste
  fermée de 11 (D-923-2) : `details` et `message` amont ne traversent jamais. Par le BFF, le 409 du NIF est donc déjà
  muet, mais `dossier-service` est aussi appelé directement par le front du cabinet : la règle doit tenir chez lui.

## Ce que la story livre

1. **dossier-service** : `PATCH /api/v1/dossiers/{id}` **sans `@Roles`** ; ouvert à tout membre du cabinet, dans sa
   portée. Documentation OpenAPI de la route mise à jour (qui peut, `404` hors portée, `409` du NIF nommé seulement dans
   la portée).
2. **dossier-service** : la relecture du dossier en conflit de NIF se fait **dans la portée de l'appelant**
   (`trouverParNifNormalise(orgId, pays, nif, portee)`, filtre de portée dans l'objet de requête ; une clé d'un autre
   cabinet que celui du jeton ne lit rien). Hors portée ⇒ `409 DOSSIER_NIF_DEJA_UTILISE` **sans `details`**, message
   sans invitation à ouvrir le dossier. `ecrireModification` reçoit la portée de l'appelant (paramètre exigé ; `null`
   pour l'écriture du système, la retombée d'un collaborateur parti : refus muet, sans relecture).
3. **BFF** : `@Roles(TENANT_ADMIN, TENANT_USER)` ; un opérateur plateforme sans rôle de cabinet reste refusé `403` avant
   tout appel amont. OpenAPI du BFF mis à jour. Liste fermée des codes inchangée (D-923-2 tenue).

## Décisions (retenues par défaut, contestables)

- **D-1081-1 — La portée se contrôle dans `dossier-service` seul ; le BFF ne contrôle que le rôle.** Les affectations
  n'existent que dans `dossier-service`, où la portée est déjà écrite une seule fois, dans la requête (STORY-353).
  La rejouer dans le BFF ferait deux vérités qui divergeraient au premier changement (et un appel de lecture de plus
  par écriture). Le `404` amont traverse par son code.
- **D-1081-2 — Le `409` du NIF nomme le dossier en conflit s'il est dans la portée de l'appelant, sinon il part muet.**
  Plutôt que muet pour tout collaborateur : nommer un dossier qu'il voit déjà ne fuit rien, et lui évite de chercher le
  doublon à la main (raison d'être de D14). L'administratrice voit toujours le dossier nommé (sa portée est le cabinet).
- **D-1081-3 — Ce qu'un collaborateur apprend malgré tout : « un dossier du cabinet porte ce NIF ».** C'est la règle
  D14 elle-même (l'index refuse le doublon, quel que soit l'appelant) ; la cacher exigerait d'accepter des doublons.
  Retenu.
- **D-1081-4 — Le « 409 de version muet » de D12 est vérifié, pas réécrit.** `CONFLIT_CONCURRENT` ne portait déjà aucun
  `details` dans le service, et le BFF ne relaie que son code (`message` = le code, D-923-2). Des tests le figent
  désormais pour un collaborateur, au champ près dans le BFF.
- **D-1081-5 — `ecrireModification` exige la portée (pas de valeur par défaut).** Chaque écriture dit qui écrit ; une
  absence rend le refus muet (sens sûr). La création (`POST /dossiers`, réservée à `TENANT_ADMIN`) relit dans la
  portée de l'administratrice du cabinet, avec un avertissement : le jour où une création s'ouvre à un collaborateur,
  cette portée doit venir de son jeton.
- **D-1081-6 — D-923-2 reste en vigueur** (refus par code seulement) : l'administratrice qui passe par le BFF ne reçoit
  pas non plus le dossier nommé. L'élargir (relayer `details.dossierId` pour un `409` du NIF) est une ligne dans la
  liste du BFF, à demander par l'écran si besoin.
- **D-1081-7 — Sans Docker** (D-L4-3, ligne du plan) : aucun module Nest, aucune dépendance, aucun Dockerfile ne change
  (un décorateur retiré, un paramètre ajouté). Le round-trip réel BFF → `dossier-service` du collaborateur se jouera à
  la recette croisée de STORY-1080 (le parcours 923 de `cabinet-moteur` l'éprouve déjà pour l'administratrice).

## Critères d'acceptation

- **AC-1** : un `TENANT_USER` responsable ou contributeur d'un dossier en modifie l'identité (`200`, version + 1), l'acte
  `IDENTITE_MODIFIEE` est à son nom ; par le BFF, son jeton atteint l'amont tel quel.
- **AC-2** : hors de son portefeuille, ou sur « Mon cabinet » : `404 DOSSIER_INTROUVABLE`, rien n'est écrit.
- **AC-3** : version périmée : `409 CONFLIT_CONCURRENT`, sans `details` (service) ; par le BFF : `{ statusCode, error,
  message: code, code }` et rien d'autre.
- **AC-4** : NIF d'un dossier hors de sa portée : `409 DOSSIER_NIF_DEJA_UTILISE` sans `details` (ni identifiant ni
  raison sociale) ; dans sa portée : le dossier est nommé ; l'administratrice : nommé.
- **AC-5** : un opérateur plateforme sans rôle de cabinet est refusé `403` par le BFF, sans appel amont.
- **AC-6** : mutations (garde remise, portée retirée de la relecture, portée de l'administratrice substituée à celle de
  l'appelant, garde du BFF ramenée à `TENANT_ADMIN` ou vidée) ⇒ tests rouges sur l'assertion.

## Definition of Done

- [x] `tsc`, build, lint des fichiers touchés ; unitaires et e2e concernés relancés par chemin ; suites complètes.
- [x] Mutations sur la logique neuve.
- [x] Contrat annoncé dans « ⚠ Contrats » avant la fusion (stories #706) ; PR de code fusionnées en rebase ; PR de docs.

## Livraison (2026-11-18)

🏁 **DONE** — **dossier #56** (`82642d6` sur `dev`), **admin-panel #37** (`650ae23` sur `dev`) ; annonce du contrat
avant la fusion : stories #706. Chaque commit rejoué en rebase a le même arbre que la tête de sa PR
(`b0b2e89`, `e3e3e35`).

**Preuves (Node 25, sans Docker, D-L4-3) :**

- **dossier-service** : unitaires `dossiers.service.spec.ts` + `dossiers.repository.spec.ts` **177/177** (7 neufs) ;
  e2e `dossiers.e2e-spec.ts` **164/164** (8 neufs ; l'AC-3 de 916, « `TENANT_USER` ⇒ 403 », inversé) ; e2e complets
  9/9 suites (380). Le double du modèle Mongo de l'e2e simule désormais l'index du NIF **à la mise à jour** (même
  `E11000` qu'à la création, le dossier modifié ne se heurte pas à lui-même). Suite unitaire complète : 106 suites
  vertes, **7 rouges préexistantes, identiques sur `origin/dev`** (témoin par `git stash`) : binding de Confluent ×6,
  cohérence du registre des pays avec les dépôts voisins. `tsc`, `nest build`, lint des fichiers touchés verts.
- **BFF** : e2e `dossiers.e2e-spec.ts` **15/15** (4 neufs : collaborateur relayé avec son jeton, `409
  CONFLIT_CONCURRENT` muet au champ près, `409` du NIF sans le dossier nommé, `404` amont) ; e2e complets 13/13 suites
  (236) ; unitaires 43/43 suites (533). `tsc`, `nest build`, lint des fichiers touchés verts.
- **Mutations 7/7 rouges sur l'assertion** : garde `TENANT_ADMIN` remise dans le service (7 e2e) ; relecture sous la
  portée de l'administratrice au lieu de celle de l'appelant (1 unitaire, 1 e2e) ; filtre de portée retiré de la
  relecture (1, 1) ; clé d'un autre cabinet lue (1 unitaire) ; portée non transmise par `modifierIdentite` (2 e2e) ;
  garde du BFF ramenée à `TENANT_ADMIN` (4 e2e) ; garde du BFF vidée (1 e2e).

**Écart de forme :** le message du commit de dossier annonce « 5 neufs / 9 neufs » ; les chiffres exacts sont ceux
ci-dessus (la PR le dit). Le corriger aurait demandé de réécrire une branche poussée, refusé par le poste.

**Reste, sans story à ouvrir :** le round-trip réel BFF → `dossier-service` du collaborateur n'est pas joué (D-1081-7) :
la recette croisée de STORY-1080 le jouera (le parcours 923 de `cabinet-moteur` l'éprouve déjà pour l'administratrice ;
y ajouter le collaborateur est une ligne de cette recette).
