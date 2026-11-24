# STORY-1112 : le BFF relaie les essais d'un prospect à la console (ouvrir, prolonger, suivre)

Status: in-progress (rouverte le 2026-11-24 pour sa suite : « Suite du 2026-11-24 », en fin de fiche)

**Complexité :** moyenne (deux lectures de plus au catalogue, huit relais typés au BFF, une ouverture en un geste)

**Épic :** EPIC-147 (le prospect essaie avant de signer, montré le 15/01)
**Dépôts :** `MoneyVibesGroup/prospera-admin-panel-service` (le BFF) ; `MoneyVibesGroup/prospera-platform-catalog-service`
(deux lectures de plus, D-1112-1, même solution que D-1080-14).
**Lot 6 :** ligne n° 2 de B au §5 de `PLAN-LOT-6-2026-11-23.md` (« Docker : 1 pile ; Fini quand : AP-57 débloquée »).
Identifiant réservé par le plan (§8). AP-57 est sortie du lot 6 de A par l'amendement du 24/11 (§3) : elle revient au
lot 7, « à mesure que B livre 1112 ». Le déblocage se prouve ici par la route servie et relayée (appel réel au BFF).
**Demande servie :** journal de A, « Lot 6 », → B (24/11) : « STORY-1112 : relayer `POST /essais`, `GET /essais/{org}`,
`POST …/prolongation`, `…/signature`, `…/jeu-demonstration`, `POST/GET …/effacement` (corps et codes de refus du
catalogue, tels quels), et ajouter une liste des essais ; recommandé aussi : `POST /admin/essais` qui enchaîne la
naissance du prospect puis l'ouverture, avec le jeu choisi par le BFF selon le métier ».

**Sources lues :** plan du lot 6 (§0 → §8, amendement du 24/11) ; `REGLES-DES-GROUPES.md` ; journal de B (état, pièges,
⚠ Contrats de 951 → 953, 1080) ; journaux de A, C, D ; fiche STORY-1080 (D-1080-14 → 17) ; fiche AP-57 (AC-1 → 5) et la
maquette validée le 24/11 (`frontend-admin-panel/docs/mockups/ap-02-organisations.html`, écran « Essais » : la liste et
la prochaine action par ligne, « Ouvrir un essai » avec le nom, le métier, le courriel de l'administrateur, le jeu coché
d'avance, « Suivi par vous ») ; contrat `contrat/essai-prospect.openapi.json` et `contrat/naissance.openapi.json` du
catalogue. Code relu sur `origin/dev` : catalogue `b75e34b` (`EssaiProspectController`, `EssaiProspectService`,
`EffacementDEssaiService`, `RegistreDesJeux`, `NaissanceController`), BFF `7c85076` (`AdminInstallationsController`,
`InstallationProxyService`, `etat-publie.ts`, `decision-du-moteur.ts`, `upstream-error.ts`, `CatalogServiceClient`,
coupe-circuit de 903), auth `c0f6243` (`verticaux-socle.ts` : `cabinet`, `distributeur`, `imf-sfd`, `assurance-cima`).

**Ce qui existait déjà (relu avant la fiche) :** le catalogue sert `POST /essais`, `GET /essais/{org}`, la
prolongation, la signature, le rejeu du jeu, `POST`/`GET …/effacement` (STORY-952, 953 ; écrire : `entitlement:grant`,
lire : `org:read`), et `POST /naissances` (STORY-948). Le BFF n'en relaie **aucun** (`git grep essais` vide hors de
l'état publié). Le catalogue **ne liste pas** les essais (lecture par organisation seulement) et **n'expose pas** les
jeux de démonstration chargés (le registre est lu au démarrage, sans route). Le jeton de l'opérateur ne porte pas son
adresse (`sub`, `org`, `roles`, `perms`).

---

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | Le catalogue sert `GET /api/v1/essais` (liste, `org:read`, filtre `statut` facultatif, par fin croissante, 200 au plus, `tronquee`) : chaque essai à la forme publique de `GET /essais/{org}`, plus `prospect { nom, vertical, pays? }` lu dans sa naissance de l'espace d'essai | unitaires (Ajv contre le contrat) ; e2e de la chaîne de gardes ; pile |
| AC-2 | Le catalogue sert `GET /api/v1/jeux-demonstration` (`org:read`) : les jeux chargés, `{ code, version, verticale, titre, parts[{ module, enregistrements }] }`, triés | unitaires ; e2e ; pile |
| AC-3 | Le BFF relaie sous `/api/v1/admin/essais` : `GET` (liste), `GET /{orgId}`, `POST /{orgId}/prolongation`, `/signature`, `/jeu-demonstration`, `POST` et `GET /{orgId}/effacement` ; chaque réponse **projetée champ par champ** (anti-fuite, STORY-378) en DTO typés publiés à l'OpenAPI ; un corps hors contrat, ou d'une autre organisation que l'URL, rend 503 | unitaires ; OpenAPI ; pile |
| AC-4 | `POST /api/v1/admin/essais` ouvre l'essai en un geste : jeu choisi selon le métier (sauf `avecJeu: false`), naissance du prospect dans l'espace d'essai (idempotente), puis ouverture ; 201 à la première ouverture, 200 au rejeu ; aucun jeu pour ce métier ⇒ 422 `JEU_DEMONSTRATION_ABSENT` avant toute écriture | unitaires ; pile |
| AC-5 | Les refus du catalogue traversent **par leur code** (liste fermée, message du BFF), jamais avec le corps amont ; tout autre échec suit la traduction générique ; les lectures passent par le coupe-circuit de 903, les écritures jamais | unitaires ; mutations |
| AC-6 | Preuve réelle : appel au BFF contre le vrai catalogue (espace d'essai) et le vrai auth sur une pile `grp-b` : ouvrir (prospect né, jeu choisi), rejouer (200), lister, prolonger, refus relayés par leur code, signer | « Preuves » |

## Décisions (recommandations appliquées, contestables)

- **D-1112-1 — Le catalogue sert deux lectures de plus, pas le BFF** (même solution que D-1080-14 : le catalogue manque
  d'une lecture pour la console, il la sert, le BFF la relaie). (1) **`GET /api/v1/essais`** : la liste. Le BFF ne
  peut pas la reconstruire (il ne sait pas quelles organisations ont un essai) ; une boucle sur l'annuaire ferait
  autant d'appels que d'organisations. Filtre `statut` (`OUVERT`, `SIGNE`, `EFFACE`), tri par `finLe` croissante (ce
  qui finit d'abord en tête, comme la maquette), **200 au plus** et `tronquee` (la démo du 15/01 en tient cinq). Chaque
  ligne porte `prospect { nom, vertical, pays? }`, lu dans la naissance de l'espace d'essai : un prospect né pour
  l'essai n'est pas forcément dans l'annuaire du réel, et la console doit l'afficher par son nom (AC-2 d'AP-57).
  (2) **`GET /api/v1/jeux-demonstration`** : les jeux chargés par le registre (le catalogue « attend un code et une
  version, sans route pour les lister », maquette). Sans `generateur` ni fichiers : le nombre d'enregistrements par
  part suffit à la console. Les deux en `org:read` (le droit de `GET /essais/{org}`), aucune vérification d'espace
  (dans le réel : liste vide). Contrat `contrat/essai-prospect.openapi.json` **1.0.0 → 1.1.0** (ajouts seuls).
- **D-1112-2 — Le BFF relaie sous `/api/v1/admin/essais`**, un préfixe distinct d'`admin/orgs` (l'écran « Essais » est
  une entrée à part de la console). Droits : ceux du catalogue (lire `org:read`, écrire `entitlement:grant`), posés aussi
  au BFF ; le catalogue reste juge. **Tout est projeté** : `EssaiDto` (dates, statut, prolongations, destinataires,
  jeu et ses parts, `avisEnvoyes` décomposés en `{ fin, echeanceLe, role }` au lieu de la clé interne
  `<fin>|<échéance>|<rôle>`), `EffacementDto` (plan, propriétaires, certificat : `jws`, `kid`, `numero`,
  `certificatDeCle` ; la console télécharge le certificat, AC-4 d'AP-57 ; `declenchePar` devient `declenchement`
  `AUTOMATIQUE` | `REPRISE` | `OPERATEUR`, sans l'identifiant de l'opérateur). Le `detail` libre d'une part ou d'un
  propriétaire ne traverse pas (il peut nommer une adresse interne) : la `raison`, énumérée, suffit. Une valeur hors de
  son énumération est écartée (un statut d'essai inconnu rend 503 : on ne devine pas un état).
- **D-1112-3 — `POST /api/v1/admin/essais` enchaîne la naissance et l'ouverture** (recommandation de A ; question 1 de
  la maquette, « créer le prospect dans le même geste », réponse par défaut retenue). Corps : `organisationId`
  (24 hexadécimaux, **choisi une fois par la console**, FR-42 : le même identifiant dans chaque espace ; un prospect de
  l'annuaire garde le sien), `nom`, `vertical`, `pays?`, `administrateur`, `commercial`, `langue?`, `avecJeu?` (vrai
  par défaut). `commercial` est exigé : le jeton de l'opérateur ne porte pas son adresse, la console la connaît
  (« Suivi par vous »). Ordre : (1) le jeu est choisi (lecture), (2) `POST /naissances` (idempotente : un prospect déjà
  né rend 200 ; un autre nom rend 409 `NAISSANCE_DIVERGENTE`), (3) `POST /essais`. Un échec à l'étape 3 laisse le
  prospect né : le même ordre reprend (les deux étapes sont idempotentes). La naissance n'est pas relayée seule ici
  (STORY-1113, AP-56).
- **D-1112-4 — Le jeu se choisit par le métier, dans le BFF** : table du vocabulaire d'auth vers celui de
  `jeu-demonstration@1` (`cabinet` → `CABINET`, `distributeur` → `DISTRIBUTEUR`, `imf-sfd` → `MICROFINANCE`,
  `assurance-cima` → `ASSURANCE`) ; parmi les jeux chargés de cette verticale, le premier par code, puis la plus haute
  version (`grossiste-golfe` avant `grossiste-golfe-grand` et `-petit`). Aucun jeu ⇒ 422 `JEU_DEMONSTRATION_ABSENT`
  avant toute écriture (la case cochée ne s'ouvre jamais à blanc en silence) ; `avecJeu: false` ⇒ essai à blanc.
  Le jeu choisi se lit dans la réponse (`jeu.code`, `jeu.version`).
- **D-1112-5 — Les codes traversent par une liste fermée** (patron de `rethrowDecisionDuMoteur`, 917) : 404
  `ESSAI_INCONNU`, `ORGANISATION_INCONNUE`, `EFFACEMENT_INCONNU` ; 409 `ESSAI_DIVERGENT`, `NAISSANCE_EN_COURS`,
  `ESSAI_HORS_ESPACE_D_ESSAI`, `ESSAI_DEJA_PROLONGE`, `ESSAI_TERMINE`, `ESSAI_SIGNE`, `DELAI_DE_SIGNATURE_ECOULE`,
  `ESSAI_SANS_JEU`, `ESSAI_EFFACE`, `EFFACEMENT_PREMATURE`, `NAISSANCE_DIVERGENTE` ; 422
  `PROLONGATION_AU_DELA_DE_60_JOURS`, `JEU_DEMONSTRATION_INCONNU`, `NAISSANCE_REFUSEE` ; 503 `HORLOGE_INDISPONIBLE`,
  `AUTH_INJOIGNABLE` (« rien n'a été changé » ou « rejouer l'ordre »). Le message reste celui du BFF ; la phrase est
  écrite par la console (table de la maquette). Un code hors liste suit la traduction générique.
- **D-1112-6 — Un seul catalogue** (`CATALOG_SERVICE_URL`) : le BFF de la console des essais est déployé face au
  catalogue de l'espace d'essai (un espace par pile, D-929-2) ; face au réel, le catalogue répond 409
  `ESSAI_HORS_ESPACE_D_ESSAI`, relayé par son code. La console qui parle aux deux espaces à la fois (mise en service,
  `invites` de 974) est l'affaire de STORY-1113.
- **D-1112-7 — Les écritures d'essai ont leur délai** : l'ouverture importe le jeu (routes C13 des modules) et
  l'effacement appelle chaque propriétaire, dans la requête ; le délai court des lectures (3 s) les couperait en 503
  alors que l'essai s'ouvre. Variable neuve facultative **`UPSTREAM_ESSAI_TIMEOUT_MS`** (30 000 par défaut) pour
  `POST /essais`, `POST …/jeu-demonstration`, `POST …/effacement` et `POST /naissances` (auth derrière). Un délai
  dépassé reste un 503 ; le même ordre rejoué rend l'essai (200).
- **D-1112-8 — Le garde des noms de schéma uniques entre au BFF** (piège de 1084 : Swagger garde une classe par nom,
  sans rien dire ; « à poser par la prochaine story de B qui touche leur OpenAPI ») : le document de toutes les routes
  du BFF, aucun nom deux fois. Le catalogue publie un contrat écrit (`contrat/*.json`), pas des DTO : rien à garder ici.
- **D-1112-9 — La preuve** : pile `grp-b` (auth, catalogue en espace d'essai avec les jeux de la plateforme montés,
  BFF, et leur infrastructure), images construites depuis `git -c core.autocrlf=false archive` des branches de la
  story (auth depuis `origin/dev`) ; balance et bilan ne sont pas levés : l'import du jeu s'arrête `NON_IMPORTE`
  (raison visible) et se rejoue par le relais, ce qui suffit au relais (l'import réel est éprouvé par 953 et 1082).
  Un module Nest ne change pas au catalogue (deux contrôleurs dans `EssaiModule`), aucune dépendance ni Dockerfile ;
  au BFF, un contrôleur et un service de plus dans `AdminModule`, une variable facultative : le démarrage est prouvé par
  la pile.

## Contrats touchés (annoncés avant la fusion, journal de B, « ⚠ Contrats »)

- Catalogue, `contrat/essai-prospect.openapi.json` 1.1.0 : `GET /api/v1/essais`, `GET /api/v1/jeux-demonstration`
  (ajouts).
- BFF, OpenAPI : `/api/v1/admin/essais…` (huit routes), schémas `EssaiDto`, `EssaisDto`, `EffacementDto` et leurs
  parties, `OuvrirEssaiRequestDto`, `ProlongerEssaiRequestDto` ; variable `UPSTREAM_ESSAI_TIMEOUT_MS`. Aucune route
  existante ne change.

## Livré

- **catalogue #70** (`706f1b8` sur `dev`) : `GET /api/v1/essais`, `GET /api/v1/jeux-demonstration`, contrat
  `essai-prospect` 1.1.0.
- **BFF #39** (`3071886` sur `dev`) : `/api/v1/admin/essais` (huit routes), DTO publiés, garde des noms de schéma.
- Annonce avant la fusion du code : prospera-stories #786 (journal de B, « ⚠ Contrats », 24/11).

## Preuves

- **Catalogue** (Node 25) : `src/essai/liste-des-essais.spec.ts` 10/10 (chaque réponse validée par Ajv contre le
  contrat 1.1.0 ; tri par fin, filtre, 200 / 201 essais et `tronquee`, naissance de l'ESSAI seule, une requête ; jeux
  par code puis version en nombres, enregistrements sommés) ; `test/essais-console.e2e-spec.ts` 4/4 (vraie chaîne de
  gardes : `org:read` 200, sans lui ou membre d'une organisation 403, 401, filtre inconnu ou paramètre de trop 400) ;
  `src/essai` 102 tests verts ; unitaire complet **1 607 passés** (3 suites rouges connues : binding de Confluent sous
  Node 25) ; e2e : 5 suites rouges à l'identique sur `origin/dev` (172, fournisseurs absents de leurs modules de test) ;
  `tsc`, lint ; **mutations 7/7** rouges sur une assertion.
- **BFF** (Node 25) : `src/admin/essais/essais.spec.ts` 53/53 (projection champ par champ, anti-fuite, 503 hors
  contrat, choix du jeu, refus par leur code à leur statut, ordre jeu → naissance → essai, droits de chaque route),
  `test/admin-essais.e2e-spec.ts` 6/6 (chaîne de gardes et validation au bord), `test/openapi-contract.e2e-spec.ts`
  21/21 (3 neufs : huit opérations, `EssaiDto`, `EffacementDto`, l'ordre d'ouverture), garde des noms 3/3 ;
  unitaires **604/604** (46 suites), e2e **247/247** (14 suites) ; `tsc`, lint ; **mutations 13/13** rouges (dont le
  garde : une seconde classe `EssaiDto` le fait rougir, `EssaiDto ×2`).
- **Pile `grp-b`, appel réel au BFF contre le vrai catalogue et le vrai auth** (espace d'ESSAI ; images construites
  depuis `git -c core.autocrlf=false archive` : auth `origin/dev` `c0f6243`, catalogue et BFF des branches de la
  story ; jeux de la plateforme `50c12a6` montés, six chargés) : **38/38 contrôles** —
  - jeux lus (`cabinet-demo-togo`, trois `grossiste-golfe@1.2.0`, assurance, témoin) ; sans jeton 401 ;
  - `POST /admin/essais` d'un cabinet : **201 en 8,2 s** (la naissance chez auth, puis l'import du jeu dans la
    requête : D-1112-7 tenue, le délai court de 3 s l'aurait coupé), `OUVERT`, J0 → J+30, effacement à J+60, jeu
    `cabinet-demo-togo` choisi par le BFF, prospect rendu, aucun `detail` ni `ouvertPar` ; naissance `NEE` dans
    l'espace d'essai, organisation présente chez auth ; rejoué 200 (même `debutLe`) ; autre administrateur 409
    `ESSAI_DIVERGENT` ; autre nom 409 `NAISSANCE_DIVERGENTE` ; essai à blanc 201 sans jeu ; `imf-sfd` 422
    `JEU_DEMONSTRATION_ABSENT` **sans naissance écrite** (404) ; ordre mal formé 400 ;
  - liste : 2 essais, chacun avec son prospect, par fin croissante ; un essai 200 ; un inconnu 404 `ESSAI_INCONNU` ;
  - prolonger de 10 jours : 200, `prolongations` 1, fin + 10 j, effacement suivi ; une seconde 409
    `ESSAI_DEJA_PROLONGE` ; 31 jours 400 au bord ;
  - reprendre l'import 200 (3,9 s ; `balance` `NON_IMPORTE` `SERVICE_INJOIGNABLE`, balance n'est pas levée :
    D-1112-9) ; essai à blanc 409 `ESSAI_SANS_JEU` ; effacer trop tôt 409 `EFFACEMENT_PREMATURE` ; aucun plan 404
    `EFFACEMENT_INCONNU` ;
  - signer 200 `SIGNE`, rejoué 200 (même `signeLe`) ; prolonger un essai signé 409 ; liste `?statut=SIGNE` ;
    effacer un essai signé 409 `ESSAI_SIGNE`.
  Aucun journal d'erreur au BFF. Verrou pris à 09:58 (après D-1066), rendu à 10:07 ; `down -v`, aucun conteneur,
  volume ni réseau `grp-b` ne reste. Script : `scripts1112/preuve.mjs` de la session (non versionné : il appelle les
  ports publiés d'une pile levée à la main).

## Ce qui reste

- **Pour A (AP-57, lot 7)** : l'écran, ses types régénérés depuis l'OpenAPI du BFF, et son gate réel.
- **STORY-1113** : la naissance et la mise en service relayées seules (AP-56) ; la console à deux espaces (D-1112-6).
- L'effacement de bout en bout (certificat signé) n'est pas rejoué ici : il demande l'échéance passée (horloge de
  recette) et les modules levés ; éprouvé par 953 au catalogue, et à rejouer par la recette de **STORY-1115**.

---

## Suite du 2026-11-24 : le premier membre d'un essai

**Ticket servi :** `tickets/TICKET-BACKEND-premier-membre-d-un-essai.md` (ouvert par B le 24/11 dans STORY-1115,
D-1115-6) : une organisation née par le moteur dans l'espace d'essai n'a aucun membre, et aucune route n'y fait entrer
son administrateur. Personne ne peut donc entrer dans l'essai d'un prospect : ni sous son nom, ni « en tant que » un
compte du jeu (FR-21 exige d'être membre).
**Pourquoi 1112 et pas une story neuve :** ouvrir un essai par la console (1112) ne sert que si quelqu'un peut y entrer.
Aucun identifiant neuf : branches `MNV-1112-premier-membre` (auth, catalogue, admin-panel, recette), commits
`MNV-1112(auth|catalogue|admin-panel|recette): …`, docs `docs-1112-premier-membre`. Le tracker rouvre l'entrée de 1112
(`in-progress`) le temps de la suite et la referme (`done`) dans la PR de docs finale, comme pour la suite de 979.
**Place :** décidée par la session du groupe B, **avant STORY-1116** (1116 ouvre cinq essais simultanés : il faut pouvoir
y entrer par de vraies routes) et avant la démo du 15/01.
**Sources lues :** le ticket ; fiches STORY-938 (D-938-1 → 5), 948 (D-948-5 → 8), 951 (D-951-1), 972 (D-972-5 → 9), 974
(D-974-1 → 11), 1112 (D-1112-1 → 9), 1113 (D-1113-1 → 10), 1115 (D-1115-1 → 12) ; journal de B (état, pièges,
« ⚠ Contrats » de 1113 et 1115). Code relu sur `origin/dev` : auth `b49d8ab` (`InvitationsAuReelController`,
`EspaceReelGuard`, `InvitationsAuReelService`, `InvitationService`, `MailProcessor`, `NotificationClient`,
`messages-de-compte.ts`, `MembershipsService`), catalogue `45971cf` (`EssaiProspectService`, `OrdreDOuvertureDto`,
`essaiPublie`, `SortiesDEssai`, `sorties-d-essai.ts`, `InvitationsDAuthParHttp`, `MiseEnServiceModule`, `EssaiModule`,
contrat `essai-prospect.openapi.json` 1.1.0), BFF `c451b17` (`EssaisProxyService`, `projection.ts`, `essai.dto.ts`,
`CatalogueDeLEssaiClient`), recette `b38b268` (`essai-mise-en-service.recette.ts`, `profil-de-recette.spec.ts`,
`agregateur-sms.ts`, `courrier.ts`, profil).

**Ce qui existait déjà (relu avant le code) :**
- auth sert déjà, sous l'identité du moteur, `PUT /interne/organisations/{id}/invitations` (974) : un membre neuf sous un
  identifiant donné, `INVITED`, `TENANT_ADMIN` ou `TENANT_USER`, son rôle métier proposé au métier, ses événements dans la
  transaction, son e-mail après elle, idempotent par membre. Dans l'essai, sa garde rend 403 `ESPACE_D_ESSAI_REFUSE`
  avant le corps (D-974-2). L'e-mail part par la notification de l'espace de l'auth (`NOTIFICATION_BASE_URL`) : dans
  l'essai, celle de l'essai.
- Le catalogue appelle déjà cette route (mise en service, `InvitationsDAuthParHttp`, même secret et même adresse que la
  naissance) et tient la règle des sorties de l'essai (`SortiesDEssai.verifier` : liste blanche, journal des
  interceptions, `ECRITURE_REELLE_DEPUIS_ESSAI`). L'ordre d'ouverture ne porte que l'adresse de l'administrateur
  (`administrateur`), sans son nom ; elle sert aux avis de fin d'essai.
- Le BFF relaie l'ouverture (`POST /admin/essais`, 1112) et les sorties de l'essai (`/admin/sorties-essai`, 1113).
- La recette pose le premier membre dans `auth_essai` par `mongosh` (D-1115-6) ; l'essai de la pile n'a aucune sortie
  de messages (D-1115-5) ; la garde du profil ne lit que le profil, pas les recettes.

| Exigence (critères du ticket) | Fait |
|---|---|
| Un prospect dont l'essai vient d'ouvrir reçoit (par la sortie de l'essai) un lien, choisit son mot de passe, se connecte à l'essai, invite un collègue par `POST /users`, et se connecte « en tant que » un compte du jeu | catalogue : invitation à l'ouverture ; auth : la route du moteur ouverte à l'essai pour ce cas ; recette : le parcours de bout en bout, le lien lu à la sortie de l'essai |
| Aucun message ne part au réel depuis l'essai (NFR-3) | l'e-mail part par la sortie de l'essai, après la liste blanche de l'essai ; hors liste : intercepté, journalisé, rien ne part ; recette : rien dans Mailhog (le réel) |
| La recette `essai-mise-en-service` n'écrit plus rien en base | la pose en base disparaît ; garde `src/recettes-sans-base.spec.ts` |
| D-974-2 ne s'ouvre que pour ce cas, avec un test qui garde le reste fermé | un membre, `TENANT_ADMIN`, aucun autre administrateur actif ; tout le reste 403 avant le corps (tests) |

### Décisions (prises par défaut, contestables)

- **D-1112-10 — Une suite de 1112, pas une story neuve**, placée par la session du groupe B avant 1116 (ci-dessus).
  L'entrée du tracker est rouverte puis refermée ; la marque haute ne bouge pas.
- **D-1112-11 — auth : la route d'invitation du moteur s'ouvre à l'essai pour le premier administrateur, et pour lui
  seul** (point 1 du ticket ; pas de route sœur). `PUT /api/v1/interne/organisations/{id}/invitations` fait déjà tout ce
  qu'il faut (identifiant donné, `INVITED`, rôle et rôle métier, événements, e-mail au nom de l'organisation, idempotence
  par membre, refus nommés) : une route sœur en recopierait 280 lignes. Dans l'espace d'essai, la garde
  (`EspaceReelGuard`) reconnaît sur le **corps brut**, avant toute validation, la seule forme admise : **un membre,
  `TENANT_ADMIN`** ; toute autre forme reste 403 `ESPACE_D_ESSAI_REFUSE` avant la lecture du corps (D-974-2 intact pour
  elles). Le service vérifie ensuite que l'organisation **n'a pas d'autre administrateur actif** (403
  `ESPACE_D_ESSAI_REFUSE` sinon, rien d'écrit) : un administrateur rejoué est `EXISTANT` (200). Les refus du réel valent
  (`ORGANISATION_INCONNUE`, `COMPTE_DU_JEU_HORS_DU_REEL`, `TENANT_ROLE_INCONNU`, `TENANT_ROLE_NON_PROPOSE`,
  `MEMBRE_EN_CONFLIT`). Le jeton du moteur reste exigé. **Rien ne change dans le réel.** Aucune route, aucun champ,
  aucun module ni fournisseur neuf ; ni la garde des droits ni `permission.enum.ts` (copié à l'octet, MNV-650) ne sont
  touchés : la route est `@Public` sous `JetonDuMoteurGuard`, sans droit. Les membres suivants entrent par la console de
  cet administrateur (`POST /users`), comme le disait D-948-8.
- **D-1112-12 — catalogue : l'essai invite son premier administrateur à l'ouverture, sous l'identité du moteur** (point 2
  du ticket, même patron que la naissance et que l'invitation au réel de 974). Après l'ouverture (le fait, l'état publié,
  les avis, le jeu importé), `PremierAdministrateurDeLEssai` : (1) demande la sortie de son courriel à la liste blanche
  de l'essai (D-1112-13) ; (2) l'invite chez l'auth de l'essai (`InvitationsDAuthParHttp`, `TENANT_ADMIN`) ; (3) écrit
  l'issue dans l'essai, `invitationAdministrateur { userId, etat, le?, code?, motif?, interceptionId? }`, sans adresse ni
  nom (l'adresse est déjà dans `destinataires`). États : `ENVOYEE`, `INTERCEPTEE`, `A_REPRENDRE` (auth injoignable,
  `motif`), `REFUSEE` (refus d'auth, `code`) — la règle de D-974-9. **L'essai est ouvert quoi qu'il arrive** (c'est un
  fait) ; **l'ordre d'ouverture rejoué** (200, mêmes destinataires) **reprend l'invitation tant qu'elle n'est pas
  `ENVOYEE`** (et sur un essai ouvert avant cette suite, qui n'en a pas) ; un essai effacé n'invite plus. Une panne de
  base pendant l'invitation remonte (500) : le même ordre reprend. `MiseEnServiceModule` exporte `SortiesDEssai` et
  `INVITATIONS_D_AUTH`, qu'`EssaiModule` importe (un fournisseur neuf).
- **D-1112-13 — La liste blanche de l'essai décide de la sortie du courriel** (« l'e-mail part par la sortie de l'essai,
  liste blanche, 951/1113 »). La partie A de l'essai demande `SortiesDEssai.verifier` (la règle n'existe qu'une fois,
  D-951-1) sous l'identité du moteur limitée à l'organisation, module `essai`, destination `COURRIEL` = l'adresse de
  l'administrateur. Hors liste : `INTERCEPTEE`, l'interception est au journal (`demandeePar: service:moteur`), **auth
  n'est pas appelée, aucun membre n'est écrit, rien ne part**. La console met l'adresse (ou `*@domaine` du prospect) en
  liste blanche (`POST /admin/sorties-essai/liste-blanche`, 1113), puis rejoue l'ouverture. **Pas de liste blanche
  implicite** : on ferme, on n'ouvre pas ; l'ajout reste un geste de l'opérateur, journalisé. ⚠️ Les autres messages de
  compte de l'auth d'essai (l'invitation d'un collègue par `POST /users`, une réinitialisation) ne passent pas par la
  liste blanche : auth n'est pas un module C13 qui intercepte ; ils partent par la notification de l'essai (« Ce qui
  reste »).
- **D-1112-14 — L'identifiant du premier administrateur est tiré de l'organisation** : les 24 premiers caractères
  hexadécimaux de `sha256("prospera:essai:premier-administrateur:<organisationId>")`. Le même à chaque reprise (auth est
  idempotente par membre : rejouer ne double rien, et une réponse perdue ne fait pas naître un second administrateur),
  sans état à écrire avant l'appel ; c'est sous lui que l'administrateur entre au réel à la mise en service (FR-42), comme
  les comptes du jeu sous `identifiantDuJeu` (D-972-5).
- **D-1112-15 — Le nom de l'administrateur : facultatif dans l'ordre, avec un défaut.** `identiteAdministrateur {
  prenom, nom, roleMetier? }` (1 à 100 caractères ; `roleMetier` au format d'auth) au catalogue (contrat `essai-prospect`
  1.1.0 → **1.2.0**) et au BFF. Absent : prénom « Administrateur », nom du prospect né dans l'essai, aucun rôle métier
  inventé ; l'administrateur corrige son profil. Le rendre obligatoire casserait l'ordre de 1112 (et la maquette
  validée d'AP-57 ne le demande pas) : **→ A** (AP-57, lot 7) — nommer l'administrateur à l'ouverture et montrer l'issue
  de son invitation.
- **D-1112-16 — BFF : aucune route neuve** (point 3 du ticket : l'ouverture suffit, la reprise est le même ordre rejoué).
  `POST /admin/essais` relaie `identiteAdministrateur` champ par champ ; `EssaiDto.invitationAdministrateur` est projeté
  (état dans une liste fermée, identifiant et interception au format d'un ObjectId, code et motif au format d'un code ;
  une forme hors contrat est écartée, l'essai traverse). Noms de schéma uniques : `EssaiIdentiteAdministrateurDto`,
  `EssaiInvitationAdministrateurDto`, `EtatDInvitationDeLAdministrateurDEssai`.
- **D-1112-17 — Recette : la sortie de messages de l'essai est tenue par la recette ; plus rien en base** (point 4 du
  ticket ; D-1115-5 amendée). En déploiement, l'auth de l'essai remet ses messages à la notification de l'espace d'essai.
  La pile n'en lève pas : une notification d'essai demanderait sa base, son Kafka et son Redis sur la VM de 8 Go, et ses
  bases ont des noms fixes (`notification_service`, `…_preuves`) : partager `mongo-notification` mêlerait les espaces.
  La recette tient donc le point de remise (`src/sortie-de-l-essai.ts`, le contrat `POST /api/v1/service/envois` de
  notification-service, accusé `{ id }`), comme elle tient le faux agrégateur SMS ; `auth-essai` y est branchée par
  `NOTIFICATION_BASE_URL: http://host.docker.internal:${RECETTE_SORTIE_ESSAI_PORT:-18026}`,
  `NOTIFICATION_JETON_SERVICE` interpolé, `extra_hosts: host-gateway`. Le catalogue de l'essai n'a toujours aucune
  sortie. Le parcours : ouverture hors liste blanche ⇒ `INTERCEPTEE`, interception lue par la console, rien à la sortie ;
  domaine du prospect en liste blanche, ouverture rejouée ⇒ `ENVOYEE`, l'administratrice membre `INVITED`
  `TENANT_ADMIN` `CAB_ASSOCIE` de l'essai, son lien à la sortie de l'essai, **rien dans Mailhog** (le réel) ; elle entre
  par ce lien ; le reste comme en 1115. **Garde neuve** `src/recettes-sans-base.spec.ts` : aucune recette n'a de client
  de base ni d'écriture Mongo, hors de l'entorse nommée (`delegation`, STORY-651, point 2) ; `essai-mise-en-service`
  n'exécute rien dans un conteneur.
- **D-1112-18 — Docker.** Le catalogue change de module (un fournisseur et un import neufs) : `docker compose up` du
  catalogue (les deux espaces) prouvé par la pile de recette. Auth et le BFF ne changent ni de module, ni de fournisseur,
  ni de dépendance, ni de Dockerfile ; ils sont reconstruits et levés par la même pile. La recette se joue sur des images
  reconstruites depuis `origin/dev` après la fusion, volumes neufs, puis la recette croisée complète.

### Contrats touchés (annoncés avant la fusion, journal de B, « ⚠ Contrats »)

- **auth** — `PUT /api/v1/interne/organisations/{id}/invitations` : dans l'espace d'**essai**, la demande du premier
  administrateur (un membre `TENANT_ADMIN`, aucun autre administrateur actif) est servie (201 / 200) ; tout le reste y
  reste 403 `ESPACE_D_ESSAI_REFUSE`. Le réel ne change pas. Route, corps, réponse et codes inchangés.
- **catalogue** — `contrat/essai-prospect.openapi.json` **1.2.0** (ajouts facultatifs) : `OrdreDOuverture.identiteAdministrateur`,
  `EssaiProspect.invitationAdministrateur`. Le journal des interceptions de l'essai peut porter des entrées `module:
  essai`, `demandeePar: service:moteur`.
- **BFF (OpenAPI, A génère ses types)** — `OuvrirEssaiRequestDto.identiteAdministrateur` (`EssaiIdentiteAdministrateurDto`,
  facultatif) ; `EssaiDto.invitationAdministrateur` (`EssaiInvitationAdministrateurDto`, énumération
  `EtatDInvitationDeLAdministrateurDEssai`), facultatif, rendu par toutes les routes qui rendent un essai.
- **recette (profil)** — `auth-essai` : `NOTIFICATION_BASE_URL`, `NOTIFICATION_JETON_SERVICE`, `extra_hosts` ; variables
  facultatives `RECETTE_SORTIE_ESSAI_PORT` (18026, doit être libre sur le poste) et `RECETTE_SORTIE_ESSAI_JETON` ; garde
  neuve `recettes-sans-base`.
