# STORY-1129 : Le cabinet sur le moteur (EPIC-144, 159) — le `PUT` d'octroi n'installe plus ce que le moteur sait installer ; les recettes croisées installent par le moteur

Status: in-progress — fiche écrite le 2026-11-26 par la session du groupe B juste avant de coder (lot 7, n° 11 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 11 ; identifiant réservé D-L7B-1).
**Date dure : fusionnée au plus tard le 18/12** (jalon « cabinet sur le moteur », plan §3, D-L7B-5).

**Dépôts :** `platform-catalog-service` (la partie A du moteur), `admin-panel` (le BFF, `prospera-admin-panel-service`),
`prospera-recette` · **Points :** 5 · **Dépend de :** STORY-944 (le plan d'installation), STORY-945 (la bascule : le `PUT`
passe par un plan `CONSOLE_PUT`), STORY-1080 (le cabinet installé par `POST /installations`, balance et bilan servent leurs
vérifications), STORY-1019 de C (`conseil` sert ses deux vérifications), AP-55 de A (la console installe par l'offre et le
plan) · **Suite :** STORY-1131 (n° 13, restes d'EPIC-145 → 147), STORY-1135 (n° 17, `module.interrupteurs`), lot 8
(désinstaller et réinstaller, FR-39)
**Sources :** plan du lot 7 de B §1 (n° 11 : « les chemins d'octroi retirés après AP-55 (A), `PUT …/entitlements` gardé pour la
sanction seule, recettes croisées réécrites ») et §3 ; `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (« 144 : retrait des
quatre chemins d'octroi et recettes croisées réécrites », « 🎯 18/12 : cabinet sur le moteur (EPIC-159) ») ;
`epics-moteur-installation-2026-11-11.md` (EPIC-144 « Bascule », EPIC-159) ; fiches STORY-945, 1080, 100 (D-100-4), 1128
(« Inventaire », EPIC-144 et EPIC-159) ; journal de A (AP-55 livrée, `a18dda1`) ; journal de B (« Suivante : STORY-1129 »).

---

## Pourquoi

« Tout octroi passe par le moteur » (PRD FR-4). STORY-945 a retiré trois des quatre chemins qui posaient `ACTIVE` hors du
moteur (l'échéance soldée note un acquis, le vertical n'ouvre rien, la propagation des packs est retirée) et a fait passer
le quatrième, le `PUT /catalog/entitlements/{org}/{module}` de la console, **par un plan** (`origine: CONSOLE_PUT`), avec
une vérification « différée » pour un module dont le service ne sert pas encore ses vérifications. Ce `PUT` est resté une
**seconde porte d'installation**, à côté de l'offre et de `POST /installations`, en attendant que la console migre (AP-55).
AP-55 est livrée. Le jalon du 18/12 veut le cabinet **installé par le moteur** : ses modules qui servent leurs vérifications
(`balance`, `bilan`, `comptabilite`, et `conseil` depuis STORY-1019) ne doivent plus s'ouvrir que par l'offre et le plan, et
les recettes croisées doivent le prouver.

## Ce qui est déjà livré (relu dans le code le 26/11 : catalogue `origin/dev` `e35d6a0`, BFF `81817fe`, recette `3ca9907`)

- **Catalogue** — `ConsoleEntitlementsController` (`PUT /api/v1/catalog/entitlements/{org}/{module}`, `entitlement:grant`)
  appelle `PassageParLeMoteur.octroyerParLaConsole` :
  - la cohérence du catalogue d'abord (422, `400 REFERENTIEL_REQUIRED`) ;
  - statut autre qu'`ACTIVE` (sanction, chemin 5) : écrit sans plan ;
  - module **installé** (axe 2 `INSTALLE`) et droit existant : le moteur réécrit le droit (version, référentiels,
    configuration, levée d'une sanction), source `moteur:<plan>`, 200 ;
  - sinon : module noté acquis (source `console`), puis un plan `CONSOLE_PUT` joué avant la réponse, 201 ; une vérification
    `SERVICE_NON_CONFIGURE` y est **différée** (`verificationDifferee`, l'exécuteur), tout autre échec reste un échec.
  - `POST /api/v1/installations` (FR-6) ne diffère jamais rien ; `INSTALLATION_SERVICES` donne l'adresse du service de chaque
    module qui sert ses vérifications.
- **Les quatre chemins d'EPIC-144** : chemins 2 (échéance), vertical, propagation, `rattrapage-packs` retirés par 945 ; garde
  statique `aucun-active-hors-du-moteur` ; réamorçage par le moteur (`migrate:reamorcage-moteur`). **Reste le `PUT`.**
- **Manifestes** (`copies.json`, 48) : tous déclarent des vérifications, sauf `instance` et `financement`. Seuls les services
  de `balance`, `bilan`, `comptabilite` et `conseil` (balance-service, `instance-conseil.controller.ts`, STORY-1019) les
  servent sur `dev` ; `assureur-fictif`, `commande`, `terrain` dans l'espace d'essai (`.env.essai.example`).
- **BFF** — `PUT /api/v1/admin/orgs/{orgId}/entitlements/{moduleCode}` (`entitlement:grant`, **déprécié** depuis STORY-917)
  relaie le `PUT` du catalogue ; ses échecs passent par `rethrowUpstreamError` : **aucun code du moteur ne traverse** (un 409
  `INSTALLATION_EN_COURS` ou un 422 `MODULE_DEPENDANCE_MANQUANTE` y rendent un message générique sans code). Les routes du
  moteur (`…/offre`, `…/installations`) projettent leurs refus par `rethrowDecisionDuMoteur` (liste fermée `CODES_DU_MOTEUR`).
- **Recette** — `INSTALLATION_SERVICES` de la pile : `balance`, `bilan`, `comptabilite` (pas `conseil`, D-100-4).
  `cabinet-moteur` installe `balance` et `bilan` par `POST /installations` (catalogue et BFF), sanctionne et lève par le
  `PUT`, et prouve FR-6 sur `conseil` « sans adresse ». **Installent encore par le `PUT`** : `atelier-balance` (balance, bilan,
  conseil ; assurance), `zone-franche` (balance, bilan ; declarations), `referentiel-par-dossier` (balance, bilan ; reseau,
  microfinance, assurance), `comptabilite` (balance, comptabilite), `abonnement` (balance, bilan, conseil, declarations ;
  microfinance, assurance), `archives` (ged, par le BFF), `delegation` et `Accueil.octroyerLeModule` (paiement, notification).

## Ce que les fronts appellent (relu le 26/11, lecture seule)

- **Console** (`frontend-admin-panel`, `origin/dev` `25dc9cb`) : AP-55 (`a18dda1`) installe par `PUT|GET /admin/orgs/{id}/offre`
  et `POST|GET /admin/orgs/{id}/installations…` (`features/installation`). Le **panneau des droits** d'AP-05
  (`features/entitlements`, monté dans la fiche d'une organisation, `org-detail.tsx`) appelle **directement le catalogue**
  (`/catalog/entitlements/…`, routage « direct-par-service ») : `GET`, `PUT` (octroi, mise à jour, sanction), `DELETE`. Il
  **n'appelle pas** le `PUT` du BFF. Un code de refus inconnu y rend la phrase générique (`grant-errors.ts`), jamais le
  message du service. `installation-client.ts` n'envoie **pas encore** `Idempotency-Key` (le CORS du BFF l'accepte depuis le
  correctif de STORY-917, BFF #44) : le geste et le gate d'AP-55 restent à A.
- **App du cabinet** (`prospera-frontend-expert-comptable`, `origin/dev` `2d6836f`) : `GET /catalog/entitlements/{orgId}`
  seulement (`features/modules`) ; aucune écriture.
- **Services de C et D** : aucun n'appelle le `PUT` (relu par grep sur `origin/dev` de balance, bilan, comptabilité, fiscal,
  réseau, notification, assurance, sinistres). Le seul autre appelant est l'amorçage de `paiement` (`paiement`,
  `notification` : sans adresse, inchangé).

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| 1 | Le `PUT` du catalogue, `status: ACTIVE`, sur un module **pas installé que le moteur sait vérifier** rend **409 `INSTALLATION_PAR_LE_MOTEUR`** (`module`), et n'écrit rien : ni acquis, ni plan, ni droit | unitaires de `PassageParLeMoteur`, mutation ; recette `cabinet-moteur` |
| 2 | La sanction (`SUSPENDED`), sa levée et la réécriture d'un module **installé** sont inchangées ; un module que le moteur ne sait pas vérifier garde le passage transitoire (plan `CONSOLE_PUT`, vérifications différées), dit déprécié | unitaires (cas existants verts) ; recettes `cabinet-moteur`, `zone-franche`, `archives` non touchée |
| 3 | « Le moteur sait vérifier » = le manifeste ne déclare aucune vérification, ou `INSTALLATION_SERVICES` donne une adresse au module ; lu à chaque `PUT`, aucune liste dans le code | unitaires de la règle pure, mutations |
| 4 | Le `PUT` du BFF relaie les refus du moteur avec leur code (`INSTALLATION_PAR_LE_MOTEUR`, `MODULE_DEPENDANCE_MANQUANTE` et ses refus, `INSTALLATION_EN_COURS`, `INSTALLATION_INACHEVEE` et son plan) ; OpenAPI du BFF et du catalogue à jour | unitaires et e2e du BFF ; recette `cabinet-moteur` par le BFF |
| 5 | `conseil=http://balance-service:3007` dans `INSTALLATION_SERVICES` (pile de recette ; `.env.essai.example` du catalogue) ; FR-6 de `cabinet-moteur` éprouvé sur `declarations` | gardes `profil-de-recette.spec`, `espace-essai.spec` ; recette |
| 6 | Les recettes installent `balance`, `bilan`, `comptabilite`, `conseil` **par l'offre et `POST /installations`** (une aide partagée) ; le `PUT` n'y sert plus qu'aux modules sans adresse et à la sanction | unitaires de l'aide ; `cabinet-moteur`, `atelier-balance`, `zone-franche`, `referentiel-par-dossier`, `comptabilite`, `abonnement` vertes sur pile neuve depuis `origin/dev` |

## Contrat annoncé avant le code (2026-11-26)

- **Catalogue** (`PUT /api/v1/catalog/entitlements/{orgId}/{moduleCode}`) : un refus neuf, **409
  `INSTALLATION_PAR_LE_MOTEUR`**, corps `{ statusCode, error: 'Conflict', message, code, module }`, quand le corps demande
  `ACTIVE` (ou omet `status`) pour un module pas installé que le moteur sait vérifier. Succès, autres refus, sanction,
  levée, réécriture : inchangés. OpenAPI : description et réponse 409 à jour ; la route reste servie.
- **BFF** (`PUT /api/v1/admin/orgs/{orgId}/entitlements/{moduleCode}`, toujours `deprecated`) : ses 404, 409 et 422 portant
  un code du moteur gardent ce code et ses précisions (`details.modules`, `details.refus`, `details.planId`), comme les
  routes `…/installations` ; `CODES_DU_MOTEUR` gagne `INSTALLATION_PAR_LE_MOTEUR` (il peut donc aussi traverser les routes
  du moteur, qui ne le rendent jamais). Les autres codes (422 de cohérence : `REFERENTIEL_*`, `MODULE_NON_OCTROYABLE`)
  restent traduits comme avant. OpenAPI : description et réponse 409.
- **Réglage** : `INSTALLATION_SERVICES` de la pile de recette et de `.env.essai.example` gagne `conseil=http://balance-service:3007`.
- **Inchangés** : `entitlement.changed`, l'état publié, `POST /installations`, l'offre, `DELETE`, auth, manifestes.
- **→ A** : (1) le panneau des droits (AP-05) peut ajouter `INSTALLATION_PAR_LE_MOTEUR` à `GRANT_REFUSAL_CODES` avec une
  phrase (« Ce module s'installe par l'offre : “Installer l'offre” ») ; sans cela il rend la phrase générique, rien ne
  casse ; son « Octroyer » ne vaut plus que pour les modules sans vérifications servies, sa sanction et sa levée restent ;
  (2) types à régénérer depuis l'OpenAPI du BFF si vous lisez le 409 ; (3) rappel : `Idempotency-Key` dans
  `installation-client.ts` et le gate d'AP-55 rejoué (servi par BFF #44). **→ C et D** : une recette qui installait
  `balance`, `bilan`, `comptabilite` ou `conseil` par le `PUT` reçoit 409 : elle passe par l'offre et le plan (aide
  `installerParLeMoteur` de `prospera-recette`) ; vos services ne sont pas touchés.

## Décisions

- **D-1129-1 — AP-55 est livrée : on retire, on ne garde pas derrière un drapeau.** AP-55 est sur `dev` de A (`a18dda1`), et
  la console installe par l'offre et le plan. Le seul écran qui écrit encore par le `PUT` est le panneau des droits d'AP-05,
  qui appelle le catalogue directement (pas le BFF) : sur un module que le moteur sait vérifier, il recevra le 409 et dira sa
  phrase générique ; sa sanction, sa levée et sa révocation ne bougent pas. Ce n'est pas casser l'écran : le geste refusé a
  un remplaçant sur le même écran (« Installer l'offre »). Ce qui reste à A est écrit au journal de B (`→ A`).
- **D-1129-2 — Le `PUT` n'installe plus ce que le moteur sait installer ; il n'est pas retiré pour tous les modules.** Sur 48
  manifestes, 46 déclarent des vérifications, et seuls quatre services du cabinet les servent sur `dev`. Retirer
  l'installation par le `PUT` pour tous rendrait impossibles à ouvrir, en production comme en recette, `declarations`,
  `ged`, `paiement`, `notification`, `reseau`… : FR-6 interdit au moteur d'ouvrir un module dont les vérifications ne
  répondent pas, et la vérification différée n'existe que pour le `PUT` (D-945-2). La porte se ferme donc **module par
  module** : un module la quitte le jour où son service sert ses vérifications et reçoit son adresse, sans changement du
  catalogue. Pour le cabinet, c'est fait aujourd'hui : `balance`, `bilan`, `comptabilite`, `conseil`.
- **D-1129-3 — « Le moteur sait vérifier » se lit, il ne s'écrit pas** : le manifeste en vigueur ne déclare aucune
  vérification (`instance`, `financement`), ou `INSTALLATION_SERVICES` donne une adresse au module. Une liste de modules dans
  le code divergerait du réglage de chaque espace ; le réglage est déjà ce que lit l'exécuteur. Un module sans manifeste
  garde son refus d'avant (`MODULE_INCONNU`, par le plan).
- **D-1129-4 — Le module installé garde son `PUT`** (version, référentiels, configuration, levée d'une sanction `SUSPENDED`
  ou `REVOKED`) : ce n'est pas un octroi, rien ne s'installe ; et aucune route du moteur ne change encore les référentiels
  ou la configuration d'un module installé (les interrupteurs, EPIC-151, STORY-1135 ; FR-39, lot 8). « Gardé pour la sanction
  seule » se lit ainsi : plus aucune installation des modules que le moteur sait vérifier.
- **D-1129-5 — 409, pas 422** : la demande est bien formée et cohérente au catalogue ; c'est la porte qui n'est plus la
  bonne (comme `INSTALLATION_EN_COURS`). L'énumération exhaustive des 422 du contrôleur ne change pas. Le corps nomme le
  module et la voie (« choisir l'offre, puis `POST /api/v1/installations` »).
- **D-1129-6 — Le refus tombe avant tout effet** : après la cohérence et la lecture de l'axe 2, avant `noterAcquis` et le
  plan ; un module déjà `EN_INSTALLATION` reçoit le même refus (il se reprend par son plan).
- **D-1129-7 — Le BFF relaie les refus du moteur sur son `PUT`** (`rethrowDecisionDuMoteur`) : depuis 945 ce `PUT` est une
  route du moteur, et sans code la recette des archives comme la console liraient « Conflict » sans savoir quoi faire. Pas de
  `Sunset` ni de date de retrait sur la route : elle reste la route de la sanction.
- **D-1129-8 — `conseil` reçoit son adresse** (`balance-service:3007`, la route de STORY-1019) dans la pile de recette et dans
  `.env.essai.example` (le balance de l'essai sert les mêmes routes) ; FR-6 de `cabinet-moteur` passe sur `declarations`
  (dépend de `bilan`, installé ; `fiscal-service` ne sert pas ses vérifications) : D-100-4 refermée.
- **D-1129-9 — Une aide partagée de la recette** (`src/moteur.ts`, `installerParLeMoteur`) : compléter l'offre des modules qui
  n'y sont pas (souscrits = offre et acquis, jamais une offre qui retire), lancer le plan, l'attendre, exiger `TERMINE` en
  nommant l'étape en échec ; par le catalogue ou par le BFF. `cabinet-moteur` y passe aussi. Les modules que la pile sait
  vérifier sont nommés une fois (`MODULES_VERIFIES_PAR_LA_PILE`), et un test les confronte à `INSTALLATION_SERVICES` du profil.
- **D-1129-10 — Recettes rejouées** : `cabinet-moteur`, `atelier-balance`, `zone-franche` (surcouche fiscale),
  `referentiel-par-dossier`, `comptabilite`, `abonnement`. **Non rejouées** : `archives` (le `PUT` de `ged` par le BFF suit la
  branche transitoire, inchangée ; seul le relais des refus change, éprouvé par `cabinet-moteur`), `delegation`,
  `distributeur`, `facturation`, `renvoi-du-lien` (`paiement`, `notification` : sans adresse), les suites de l'essai (déjà
  par `POST /installations`).

## Hors de cette story

- Faire servir leurs vérifications aux autres modules (`declarations` chez C et D, `ged` chez B, `paiement`, `notification`…) :
  chacun quitte alors le `PUT` par son adresse, sans code au catalogue.
- Le retrait des consommateurs de `entitlement.changed` (inventaire de STORY-1128, EPIC-159) ; l'app du cabinet sur l'état
  publié par la vraie route (A) ; le panneau des droits d'AP-05 (A).
- Désinstaller et réinstaller (FR-39, lot 8) ; les interrupteurs (EPIC-151, STORY-1135).
