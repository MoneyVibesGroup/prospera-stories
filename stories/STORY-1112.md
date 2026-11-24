# STORY-1112 : le BFF relaie les essais d'un prospect à la console (ouvrir, prolonger, suivre)

Status: done

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
