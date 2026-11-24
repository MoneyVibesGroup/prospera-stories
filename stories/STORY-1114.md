# STORY-1114 : le BFF relaie le métier (`vertical`) dans la liste et la fiche des organisations — lu, filtré, changé

Status: in-progress

**Complexité :** petite (un champ de plus dans deux vues, un filtre, deux relais typés ; aucun autre dépôt)

**Épic :** AP-EPIC-001 côté console (AP-59) ; backend d'appui STORY-171 (le métier de l'organisation, dans auth).
**Dépôt :** `MoneyVibesGroup/prospera-admin-panel-service` (le BFF) seul. Auth sert déjà tout ce qu'il faut (D-1114-1).
**Lot 6 :** ligne n° 4 de B au §5 de `PLAN-LOT-6-2026-11-23.md` (« Docker : non ; Fini quand : AP-59 débloquée »).
Identifiant réservé par le plan (§8). AP-59 est sortie du lot 6 de A par l'amendement du 24/11 (§3) : elle revient au
lot 7, « à mesure que B livre 1114 ». Le déblocage se prouve ici par les routes servies et relayées (appel réel au BFF
contre une doublure HTTP qui rend les corps réels d'auth) et par la ligne « → A » du journal de B.
**Demande servie :** journal de A, « Lot 6 », → B (24/11) : « STORY-1114 : `vertical` (code du service) dans `GET
/admin/orgs`, `GET /admin/orgs/{id}` et un filtre `vertical` sur la liste ; relais de `GET /admin/verticaux` et `PATCH
/admin/organizations/{id}/vertical` (corps `vertical`, `reason` facultatif ; refus `VERTICAL_ROLES_INCOMPATIBLES` 409 et
`VERTICAL_INCONNU` 400 transmis avec leur code) » ; et la demande du 19/11 (tri du bloc C d'AP-54) : « le champ
`vertical` dans `/admin/orgs` (AP-59) ».

**Sources lues :** plan du lot 6 (§0 → §8, amendement du 24/11) ; `REGLES-DES-GROUPES.md` ; journal de B (état, pièges
dont D-1113-10, ⚠ Contrats de 1112 et 1113) ; journaux de A, C, D ; fiches STORY-1112 et STORY-1113 ; fiche AP-59
(AC-1 → 5, « Routes servies ») et sa maquette validée le 24/11 (`frontend-admin-panel/docs/mockups/ap-02-organisations.html`
sur `origin/dev` `980901f` : colonne et filtre « Métier », « Changer de métier » sur la fiche, les métiers lus par `GET
/admin/verticaux`, refus `VERTICAL_ROLES_INCOMPATIBLES`, `VERTICAL_INCONNU`, 403, 503 dits en phrase) ;
`frontend-admin-panel/src/lib/api/services.ts` (le préfixe `/admin` va au BFF ; `/auth-admin` se réécrit en
`/admin/organizations` d'auth : `GET /admin/verticaux` d'auth n'est **pas** joignable par la console sans le BFF).
Code relu sur `origin/dev` : auth `b49d8ab` (`AdminVerticauxController`, `AdminVerticauxService`, `VerticauxService`,
`VERTICAUX_SOCLE`, `ListOrganizationsQueryDto`, `AdminOrganizationsService.list` et `buildDetail`, `AllExceptionsFilter`) ;
BFF `dcd76df` (`AdminOrgsController`, `OrgAggregationService`, `ListOrgsQueryDto`, `AdminOrgListItemDto`,
`OrganizationDetailDto`, `AuthServiceClient`, `AdminOrgActionsController`, `OrgActionsService`, `AdminRolesController`,
`PlatformRbacService`, `upstream-error.ts`, la garde des noms de schéma).

**Ce qui existait déjà (relu avant la fiche) :**
- **Auth sert tout** (STORY-171) : `vertical` (facultatif : « absent seulement avant migration ») dans chaque ligne de
  `GET /admin/organizations` et dans `GET /admin/organizations/{id}` ; le filtre `?vertical=` (validé contre le
  référentiel avant la liste : 400 `VERTICAL_INCONNU`, 400 `VERTICAL_REQUIS` si vide) ; `GET /admin/verticaux` (`org:read`
  ou `entitlement:grant` ; `code`, `libelle`, `statut` `actif` | `a_venir`, `inscriptionOuverte`, `description?`, trié par
  code ; le socle : `assurance-cima`, `cabinet`, `distributeur`, `imf-sfd`, `plateforme`) ; `PATCH
  /admin/organizations/{id}/vertical` (`entitlement:grant`, corps `{ vertical, reason? }`, journalisé
  `ORG_VERTICAL_CHANGED` ; même métier : aucun effet ; rend le détail de l'organisation ; 409
  `VERTICAL_ROLES_INCOMPATIBLES` avec `roles` à côté du code ; 404 sans code).
- **Au BFF** : la fiche (`GET /admin/orgs/{id}`) recopie l'identité d'auth **telle quelle** : `vertical` y arrive déjà,
  mais l'OpenAPI ne le publie pas (A ne peut pas le typer). La liste projette champ par champ et **le perd**. Le filtre
  n'existe pas (`forbidNonWhitelisted` : `?vertical=` rend 400). Aucun relais des verticaux, ni du changement. Un 400
  d'auth sur la liste deviendrait un 503 (`mapPrimaryError`).

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | `GET /api/v1/admin/orgs` : chaque ligne porte `vertical` (code du service, facultatif : absent si auth ne l'a pas) ; `GET /api/v1/admin/orgs/{orgId}` : `identity.vertical`, publié à l'OpenAPI | unitaires ; e2e (doublure HTTP aux corps réels d'auth) ; contrat OpenAPI |
| AC-2 | `?vertical=<code>` filtre la liste **en base chez auth** (pagination et `total` d'auth), seul ou avec `status`, `q`, `ownerEmailVerified`, `kycStatus` ; un métier inconnu rend 400 `VERTICAL_INCONNU` (vide : `VERTICAL_REQUIS`), pas 503 | unitaires ; e2e (la requête qui arrive à la doublure) |
| AC-3 | `GET /api/v1/admin/verticaux` (`org:read`) rend les métiers d'auth, projetés champ par champ (`VerticauxDto`) | unitaires ; e2e ; contrat |
| AC-4 | `PATCH /api/v1/admin/orgs/{orgId}/vertical` (`entitlement:grant`, corps `{ vertical, reason? }`) change le métier chez auth et rend l'identité projetée (`OrganizationDetailDto`) ; refus par leur code, précisions dans `details` (`details.roles`) | unitaires ; e2e avec la vraie enveloppe d'erreur ; mutations |
| AC-5 | Aucun module, contrôleur, fournisseur, dépendance ni Dockerfile neuf (Docker : non) ; noms de schéma uniques (garde) ; câblage du module racine vert | garde ; câblage ; diff |

## Décisions (recommandations appliquées, contestables)

- **D-1114-1 — Le BFF seul change.** Auth sert déjà le métier dans la liste, la fiche, le filtre, le référentiel et le
  changement (STORY-171, relu sur `origin/dev` `b49d8ab`) : aucune story d'auth, aucun autre dépôt. Le catalogue et
  les naissances ne servent pas le métier de l'annuaire : la naissance porte le `vertical` d'un prospect ou d'un client
  né par le moteur (1112, 1113), qui devient celui de l'organisation chez auth.
- **D-1114-2 — L'annuaire est celui du réel.** `GET /admin/orgs` lit l'auth du réel (`AUTH_SERVICE_URL`), et le
  métier se change au réel. Le métier d'un prospect en essai est déjà servi par `GET /admin/essais` (`prospect.vertical`,
  1112) ; il n'y a pas de second espace à couvrir ici (`AUTH_ESSAI_SERVICE_URL` n'est pas lu par cette story).
- **D-1114-3 — Les chemins du BFF.** `GET /api/v1/admin/verticaux` (le chemin d'auth, celui que demande A) et **`PATCH
  /api/v1/admin/orgs/{orgId}/vertical`** : au BFF, les actions sur une organisation vivent sous `admin/orgs/{orgId}/…`
  (`kyc/approve`, `entitlements/{module}`, `resend-verification`) et `admin/organizations` n'existe pas. La console garde
  un seul préfixe (`/admin`, le BFF). Le changement rend le **bloc identité de la fiche** (`OrganizationDetailDto`,
  `vertical` compris) : l'écran remplace l'identité sans relire la fiche.
- **D-1114-4 — Aucun contrôleur ni fournisseur neuf (Docker : non, plan §5).** `GET /admin/verticaux` est portée par le
  contrôleur déjà monté sur `admin/` (`AdminRolesController`), avec son propre droit `org:read` (le droit de la route
  gagne sur le plancher de classe) et `PlatformRbacService` (les référentiels d'auth) ; `PATCH …/vertical` par
  `AdminOrgActionsController` et `OrgActionsService` (les actions sur une organisation). Les DTO et la projection vivent
  dans des fichiers neufs (`src/admin/orgs/dto/vertical.dto.ts`, `src/admin/orgs/metier.ts`), sans module. Le câblage
  du module racine reste vert ; aucun `docker compose up` n'est donc exigé (§1.5).
- **D-1114-5 — Les métiers, projetés.** `VerticauxDto { verticaux: VerticalDto[] }`, `VerticalDto` = `code`, `libelle`,
  `statut` (`actif` | `a_venir`), `inscriptionOuverte`, `description?` ; dans l'ordre d'auth (par code). Un corps qui
  n'est pas une liste rend 503 ; une entrée hors contrat (code mal formé, libellé absent, statut inconnu) est **écartée**
  (l'écran ne propose pas un métier dont il ne sait pas l'état) ; `plateforme` traverse (l'organisation de Money Vibes
  en porte le mot ; la console ne le propose pas au changement, réponse 5 de la maquette). Le mot court (« Cabinet »)
  reste une table de l'écran, indexée par le code.
- **D-1114-6 — Les refus traversent par leur code, les précisions dans `details`** (D-1113-10). Liste fermée : 400
  `VERTICAL_INCONNU`, `VERTICAL_REQUIS` (liste et changement) ; 409 `VERTICAL_ROLES_INCOMPATIBLES` avec
  **`details.roles`** (les rôles de tenant en cause, noms validés, au plus 100 : l'écran dit « changez d'abord leurs
  rôles »). Le message reste celui du BFF, la phrase est écrite par la console. Le reste passe par la traduction
  générique de toujours (`rethrowUpstreamError` : 403, 404 sans code, 503). Sur la liste, un 400 d'auth porteur d'un de
  ces deux codes est relayé à son statut au lieu du 503 de la dépendance dure.
- **D-1114-7 — Validation au bord.** Le filtre `?vertical=` : `@IsString` seul, jugé par auth contre le référentiel (même
  raison que `kycStatus`, STORY-175 : un 400 du pipe n'a pas de `code`). Le corps du changement : `vertical` (`@IsString`,
  non vide, 40 caractères au plus, comme auth) et `reason` facultatif (500 au plus, comme auth) ; seuls ces deux champs
  partent (`forbidNonWhitelisted`).
- **D-1114-8 — Le retour du changement est projeté** (patron de 1112 et 1113) : identité champ par champ, membres avec
  les seuls champs publiés (`id`, `email`, `firstName`, `lastName`, `role`, `status`, `lastLoginAt?`) ; un corps sans
  identité lisible, ou d'une autre organisation que l'URL, rend 503. La fiche (`GET /admin/orgs/{orgId}`) garde sa
  recopie d'aujourd'hui (aucune forme existante ne change, §1.8) : seul `vertical` y est publié.
- **D-1114-9 — La preuve, sans Docker.** e2e du BFF avec le **vrai `AuthServiceClient`** (HTTP réel) contre une
  **doublure HTTP locale** qui rend les corps **produits par le code d'auth** `origin/dev` `b49d8ab` (son filtre
  d'erreurs, `AdminVerticauxService`, `VerticauxService` sur le socle semé, ses DTO), capturés par un script de la
  session et versionnés en fixtures (`test/fixtures/auth-metier/`) ; la doublure vérifie la requête reçue (chemin,
  filtre, corps, jeton relayé). Les trois routes d'auth sont vérifiées présentes sur `origin/dev`.

## Contrats touchés (annoncés avant la fusion, journal de B, « ⚠ Contrats »)

- BFF, OpenAPI : `AdminOrgListItemDto.vertical?`, `OrganizationDetailDto.vertical?` (ajouts facultatifs) ; paramètre
  `vertical` de `GET /api/v1/admin/orgs` ; `GET /api/v1/admin/verticaux` (`VerticauxDto`, `VerticalDto`) ; `PATCH
  /api/v1/admin/orgs/{orgId}/vertical` (`ChangerDeMetierRequestDto`, réponse `OrganizationDetailDto`). Refus :
  `VERTICAL_INCONNU`, `VERTICAL_REQUIS` (400), `VERTICAL_ROLES_INCOMPATIBLES` (409, `details.roles`). Aucune route ni
  aucun champ existant ne change de forme.
