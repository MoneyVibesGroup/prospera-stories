# STORY-1113 : le BFF relaie la mise en service à la console — naissance au réel, mise en service, sorties de l'essai

Status: in-progress

**Complexité :** moyenne (la console parle aux deux espaces ; une lecture de plus au catalogue ; douze relais typés)

**Épic :** EPIC-146 (deux espaces : essayer, puis mettre en service)
**Dépôts :** `MoneyVibesGroup/prospera-admin-panel-service` (le BFF) ; `MoneyVibesGroup/prospera-platform-catalog-service`
(une route de plus pour la console, D-1113-6, même solution que D-1080-14 et D-1112-1).
**Lot 6 :** ligne n° 3 de B au §5 de `PLAN-LOT-6-2026-11-23.md` (« Docker : 1 pile ; Fini quand : AP-56 débloquée »).
Identifiant réservé par le plan (§8). AP-56 n'est dans aucun lot de A (non slottée, sans maquette : `frontend-sprint-
status.yaml`, « Dépend d'AP-55 et AP-57 ; maquette d'abord ») ; le déblocage se prouve ici par les routes servies et
relayées (appel réel au BFF), et par la ligne « → A » du journal de B.
**Demande servie :** journal de A, → B (19/11, tri du bloc C d'AP-54) : « relayer `mises-en-service`, `sorties-essai`,
`naissances` (AP-56) » ; et ce que STORY-1112 a renvoyé ici (D-1112-3, D-1112-6) : la naissance relayée seule, la
console qui parle aux deux espaces (les `invites` de STORY-974).

**Sources lues :** plan du lot 6 (§0 → §8, amendement du 24/11) ; `REGLES-DES-GROUPES.md` ; journal de B (état, pièges,
⚠ Contrats de 1112 et 974) ; journaux de A, C, D (aucune demande ouverte à B avant cette story) ; fiches STORY-1112
(D-1112-1 → 9), STORY-974 (D-974-1 → 11), STORY-948 (D-948-8), STORY-951 ; fiche AP-56 (AC-1 → 5) ; maquette de la
console (`frontend-admin-panel/docs/mockups/ap-02-organisations.html`, `origin/dev` `980901f` : après « Signer », « Étape
suivante : installer l'offre, puis la mise en service » ; aucun écran de mise en service encore) ; spine du moteur AD-15
(« une organisation, deux espaces », « aucun service d'un espace ne connaît l'adresse de l'autre ») ; contrats
`contrat/mise-en-service.openapi.json` (1.1.0) et `contrat/naissance.openapi.json` (1.0.0) du catalogue. Code relu sur
`origin/dev` : catalogue `de988b1` (`MiseEnServiceController`, `SortiesDEssaiController`, `MisesEnService`,
`deciderMiseEnService`, `SortiesDEssai`, `deciderSortie`, `NaissanceController`, `NaissanceService`,
`InvitationsDAuthParHttp`) ; BFF `3071886` (`CatalogServiceClient`, `AuthServiceClient`, `UpstreamClient`,
`EssaisProxyService`, `projection.ts`, coupe-circuit de 903, garde des noms de schéma) ; auth `b49d8ab`
(`GET /admin/organizations/{id}` : les membres, `id`, `email`, `firstName`, `lastName`, `role`, `tenantRole`, `status` ;
`DOMAINE_DES_COMPTES_DU_JEU` = `jeu-demonstration.invalid` ; `PUT /interne/organisations/{id}/invitations`, réel seul).

**Ce qui existait déjà (relu avant la fiche) :** le catalogue sert `POST`/`GET /mises-en-service/{org}` (951, 974 :
`invites` facultatif, bilan avec `invitations`), `GET`/`POST`/`DELETE /sorties-essai/liste-blanche`, `GET
/sorties-essai/{org}/interceptions`, `POST /sorties-essai/{org}/verifier` (identités de service seules : un module de
l'espace, jamais la console) et `POST`/`GET /naissances` (948). Le BFF n'en relaie **aucun** seul : `POST /naissances`
n'est appelé que par `POST /admin/essais` (1112). Le BFF a **un** catalogue (`CATALOG_SERVICE_URL`) et **un** auth
(`AUTH_SERVICE_URL`). Le catalogue du réel ne connaît pas l'essai (NFR-3) : la liste des invités vient de l'ordre de la
console (D-974-8), et rien ne la lui donne aujourd'hui.

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | Le BFF parle aux deux espaces : `CATALOG_SERVICE_URL` et `AUTH_SERVICE_URL` sont le réel ; `CATALOG_ESSAI_SERVICE_URL` et `AUTH_ESSAI_SERVICE_URL` (facultatives, défaut : celles du réel) sont l'essai. Les essais de 1112 vont à l'essai ; chaque catalogue a son coupe-circuit | unitaires (configuration, clients) ; pile à deux espaces |
| AC-2 | `POST /api/v1/admin/naissances` fait naître l'organisation dans le réel ; sans identité dans l'ordre, elle est reprise de sa naissance d'essai (rien à ressaisir) ; `GET /api/v1/admin/naissances/{orgId}` rend la naissance de chaque espace | unitaires ; pile |
| AC-3 | `POST /api/v1/admin/mises-en-service/{orgId}` met en service dans le réel en reprenant les membres de l'essai (lus chez l'auth de l'essai, sans les comptes du jeu) ; `GET …/{orgId}` rend les bilans, `GET …/{orgId}/invites` la liste qui partira ; le rejeu ne double rien | unitaires ; pile (invitations `ENVOYEES` chez l'auth du réel) |
| AC-4 | Les sorties de l'essai sont relayées (liste blanche : lire, ajouter, retirer, **vérifier** ; interceptions) ; le catalogue sert la vérification que la console n'avait pas (`POST /sorties-essai/liste-blanche/verification`, contrat `mise-en-service` 1.2.0) | unitaires catalogue (Ajv contre le contrat) et BFF ; e2e ; pile |
| AC-5 | Tout est projeté champ par champ en DTO typés publiés à l'OpenAPI (ni opérateur, ni `eventId`, ni `_id` interne) ; noms de schéma uniques (garde) ; refus relayés par leur code (liste fermée) avec la liste des modules en cause ; lectures par le coupe-circuit, écritures jamais | unitaires ; mutations ; garde |
| AC-6 | Preuve réelle sur une pile `grp-b` à **deux espaces** (deux auth, deux catalogues, le BFF) : un prospect ouvre son essai, signe, **sort de l'essai et naît dans le réel** sous le même identifiant, est mis en service, ses membres d'essai invités dans le réel ; rejeu 200 sans rien doubler ; refus par leur code ; sorties de l'essai | « Preuves » |

## Décisions (recommandations appliquées, contestables)

- **D-1113-1 — La console parle aux deux espaces par deux paires d'amont.** Le BFF garde `CATALOG_SERVICE_URL` et
  `AUTH_SERVICE_URL` pour le **réel** (l'annuaire, l'offre, l'installation, l'état publié : ce qu'il administrait
  déjà) et reçoit deux variables neuves **facultatives**, `CATALOG_ESSAI_SERVICE_URL` et `AUTH_ESSAI_SERVICE_URL`, pour
  l'**espace d'essai**. Absentes, elles valent celles du réel : une pile à un seul espace (la recette, la preuve de
  1112) se comporte comme avant. Deux clients de plus (`CatalogueDeLEssaiClient`, `AuthDeLEssaiClient`), mêmes méthodes
  que les clients du réel ; le catalogue de l'essai a **son propre coupe-circuit** (un essai en panne ne coupe pas les
  lectures du réel). Les essais de 1112 (`/admin/essais`, dont la naissance d'essai de `POST /admin/essais`) passent au
  catalogue de l'essai ; les sorties de l'essai aussi ; la mise en service et la naissance au réel vont au réel. Le BFF
  est la console, pas un service d'un espace : AD-15 (« aucun service d'un espace ne connaît l'adresse de l'autre »)
  reste vrai.
- **D-1113-2 — Le jeton de l'opérateur traverse tel quel vers les deux espaces** (le relais de toujours). C'est une
  **condition de déploiement**, pas du code : les services des deux espaces acceptent le jeton de l'opérateur de la
  console (même émetteur `AUTH_ISSUER`, même clé de vérification publiée). AD-15 interdit de partager entre espaces les
  **identités de service** (`MOTEUR_JETON_SERVICE` reste propre à chaque espace) ; l'opérateur de la console n'en est
  pas une. Question à l'architecte écrite au journal, avec ce choix par défaut ; sur la pile de preuve, les deux auth
  signent avec la même clé (D-1113-9).
- **D-1113-3 — La naissance au réel reprend l'identité de l'essai** (AP-56 : « rien à ressaisir »). `POST
  /api/v1/admin/naissances`, corps `{ organisationId, nom?, vertical?, pays? }`. Sans `nom` ni `vertical` : le BFF lit
  la naissance de l'organisation dans l'espace d'essai (`GET /naissances/{org}` du catalogue de l'essai, `espace` =
  `ESSAI` exigé) et ordonne la même identité au réel (FR-42 : le même identifiant dans chaque espace) ; aucune naissance
  d'essai ⇒ 422 `PROSPECT_SANS_NAISSANCE_D_ESSAI` avant toute écriture. Avec `nom` et `vertical` : l'identité de l'ordre
  (un client qui signe sans essai). L'un sans l'autre ⇒ 400. Une réponse du « réel » qui porte `espace: ESSAI` (le BFF
  mal branché) n'est pas une naissance au réel : 503, journalisé. `GET /api/v1/admin/naissances/{orgId}` rend
  `{ organisationId, essai?, reel? }` (404 `NAISSANCE_INCONNUE` si aucun espace ne la connaît) : où en est ce prospect
  dans chaque espace. Le BFF n'exige pas un essai signé : le catalogue reste juge, la console propose la naissance au
  réel après « Signer » (maquette d'AP-57).
- **D-1113-4 — La mise en service reprend les membres de l'essai** (D-974-8 : « lus par la console dans l'essai »).
  `POST /api/v1/admin/mises-en-service/{orgId}`, corps `{ modules, reprendreLesMembres? }` (vrai par défaut). Le BFF lit
  l'organisation chez l'**auth de l'essai** (`GET /admin/organizations/{id}`) et transmet `invites` : chaque membre
  `INVITED` ou `ACTIVE`, **sauf les comptes du jeu** (`@jeu-demonstration.invalid`, D-974-5 : ils ne vont jamais au
  réel) et les suspendus ; `userId` = son identifiant d'essai (FR-42), `role` `TENANT_ADMIN` ou `TENANT_USER` (autre :
  omis, auth met `TENANT_USER`), `roleMetier` = son `tenantRole` stocké (le rôle par défaut se recalcule au réel).
  Organisation inconnue de l'essai (404) ⇒ aucun invité (un client sans essai) ; auth de l'essai injoignable ⇒ 503
  **avant** l'ordre (rien n'a été changé ; `reprendreLesMembres: false` passe outre) ; plus de 200 invités ⇒ 422
  `TROP_DE_MEMBRES_A_INVITER` avant l'ordre (la borne de la route d'auth). `GET …/{orgId}/invites` rend la liste qui
  partirait (et le nombre écarté) : l'écran montre « les invités repris » avant le geste. Le rejeu rejoue l'invitation
  (auth est idempotente par membre) : relancer ne double rien. `GET …/{orgId}` rend les bilans, du plus ancien au plus
  récent.
- **D-1113-5 — Les sorties de l'essai vont au catalogue de l'essai** : `GET`/`POST /api/v1/admin/sorties-essai/liste-
  blanche`, `DELETE …/liste-blanche/{id}` (204), `POST …/liste-blanche/verification`, `GET /api/v1/admin/sorties-
  essai/{orgId}/interceptions`. La liste blanche est celle de l'espace d'essai, pas d'une organisation (le catalogue la
  tient ainsi). `POST /sorties-essai/{org}/verifier` n'est **pas** relayée : elle sert un module de l'espace sous son
  identité de service, et journalise un refus (une console qui demande n'est pas un module qui écrit).
- **D-1113-6 — Le catalogue sert une vérification pour la console** (même solution que D-1080-14 et D-1112-1 : la
  console manque d'une lecture, le catalogue la sert, le BFF la relaie). `POST /api/v1/sorties-essai/liste-blanche/
  verification`, `org:read`, corps `Destination` (`type`, `adresse`) : la décision de `deciderSortie` (la seule règle du
  programme, jamais recopiée au BFF) contre la liste de l'espace, **sans journal** ; réponse `{ autorisee: true, motif:
  REEL | LISTE_BLANCHE }` ou `{ autorisee: false, code: ECRITURE_REELLE_DEPUIS_ESSAI }`, toujours 200. Contrat
  `contrat/mise-en-service.openapi.json` **1.1.0 → 1.2.0** (ajout seul). Aucun module Nest neuf (une route de plus au
  contrôleur existant).
- **D-1113-7 — Tout est projeté, les refus traversent par leur code.** `MiseEnServiceDto` (`organisationId`,
  `modules`, `attendus[{ module, epoque, numero }]`, `faiteLe`, `invitations?` : `etat`, `demandes`, `invites?`,
  `existants?`, `code?`, `motif?`, `le?`) sans `_id`, `demandeePar` ni `eventId` ; `NaissanceDto` (`organisationId`,
  `espace`, `nom`, `vertical`, `pays?`, `statut`, `etapes[]`, `demandeeLe`, `neeLe?`) sans `_id` ni `demandeePar` ;
  `SortieDEssaiDto` (`id`, `type`, `adresse`, `motif`, `ajouteeLe?`) sans `ajouteePar` ; `InterceptionDEssaiDto`
  (`id`, `module`, `type`, `adresse`, `origine` `SERVICE` | `UTILISATEUR`, `intercepteeLe?`) sans l'identifiant de
  l'appelant. Un corps hors contrat, ou d'une autre organisation que l'URL, rend 503 ; une valeur facultative hors de son
  énumération est écartée. Liste fermée par statut : 404 `ORGANISATION_INCONNUE`, `NAISSANCE_INCONNUE`,
  `SORTIE_INCONNUE` ; 409 `MISE_EN_SERVICE_HORS_DU_REEL`, `MISE_EN_SERVICE_MODULE_NON_INSTALLE`,
  `MISE_EN_SERVICE_REPRISE_D_ABORD`, `MISE_EN_SERVICE_SANS_FEU_VERT`, `NAISSANCE_DIVERGENTE` ; 422 `NAISSANCE_REFUSEE`,
  `SORTIE_INVALIDE` ; 503 `VERIFICATION_DONNEES_IMPORTEES_NON_EXECUTEE`, `HORLOGE_INDISPONIBLE`, `AUTH_INJOIGNABLE`.
  Traversent aussi, validés : `modules` (les codes en cause, pour « ceux qui ne le sont pas disent pourquoi ») et
  `champs` (`NAISSANCE_DIVERGENTE`). Le message reste celui du BFF ; la phrase est écrite par la console.
- **D-1113-8 — Le délai des écritures longues.** La mise en service relit la Reprise et appelle l'auth du réel
  (invitations) dans la requête ; la naissance appelle auth. Elles prennent le délai des écritures d'essai,
  `UPSTREAM_ESSAI_TIMEOUT_MS` (30 s par défaut, D-1112-7), sans variable neuve ; le délai est mesuré sur la pile
  (« Preuves »). Noms de schéma : préfixés par leur objet (`MiseEnService…`, `Naissance…`, `…DEssai`), garde de 1112
  rejoué.
- **D-1113-9 — La preuve** : pile `grp-b` à deux espaces : l'infrastructure du compose racine (Mongo, Kafka, Redis,
  MinIO, MailHog) pour le réel, plus un Kafka et un Redis propres à l'essai (NFR-3 : un espace ne lit pas les
  événements de l'autre ; un Kafka partagé ferait connaître au catalogue du réel l'organisation née dans l'essai) ;
  `auth-service` (réel) et `auth-essai` (`INSTANCE_ESPACE=ESSAI`), bases distinctes, **même clé de signature** (D-1113-2)
  et secrets du moteur distincts ; `platform-catalog-service` (réel) et `catalogue-essai` (`ESSAI`, jeux de la
  plateforme montés) ; le BFF avec ses deux paires d'amont. Images depuis `git -c core.autocrlf=false archive` des
  branches de la story (auth depuis `origin/dev`). Balance et bilan ne sont pas levés : le module mis en service est
  `instance` (posé par la naissance, chemin 0, seul module installé sans service) ; le refus d'un module non installé
  se prouve avec `balance`. Le membre « collègue » de l'essai est posé dans la base de l'auth d'essai (la console n'a
  pas de route pour inviter dans une organisation sans administrateur : D-948-8), à côté des comptes du jeu.

## Contrats touchés (annoncés avant la fusion, journal de B, « ⚠ Contrats »)

- Catalogue, `contrat/mise-en-service.openapi.json` 1.2.0 : `POST /api/v1/sorties-essai/liste-blanche/verification`
  (ajout).
- BFF, OpenAPI : `/api/v1/admin/naissances` (2 routes), `/api/v1/admin/mises-en-service/{orgId}` (3),
  `/api/v1/admin/sorties-essai/…` (5) ; schémas `NaissanceDto`, `NaissancesDto`, `NaissanceEtapeDto`,
  `NaitreAuReelRequestDto`, `MiseEnServiceDto`, `MisesEnServiceDto`, `MiseEnServiceAttenduDto`,
  `MiseEnServiceInvitationsDto`, `MiseEnServiceInvitesDto`, `MiseEnServiceInviteDto`, `MettreEnServiceRequestDto`,
  `SortieDEssaiDto`, `SortiesDEssaiDto`, `AjouterSortieDEssaiRequestDto`, `DestinationDEssaiRequestDto`,
  `VerificationDeSortieDto`, `InterceptionDEssaiDto`, `InterceptionsDEssaiDto` ; variables `CATALOG_ESSAI_SERVICE_URL`
  et `AUTH_ESSAI_SERVICE_URL` (facultatives). Aucune route existante ne change de forme ; les routes `/admin/essais`
  vont au catalogue de l'essai quand il est configuré.
