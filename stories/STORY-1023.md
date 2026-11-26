# STORY-1023 : les contrats de la balance complétés — le dossier déclaré partout, la lecture inter-organisations

Status: done

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §3, amendement du 2026-11-25, n° **0e** (« contrats propres avant le
gel du 11/12 ») ; ligne d'origine : `PLAN-LOT-6-2026-11-23.md` §4, amendement D-L6-5, n° 12 — « aucune famille de réponse
sans dossier ; la plateforme lit sans écrire ». **Dépôt :** `prospera-balance-service` (tenu par C ; `origin/dev` au
départ : `d5878be`, STORY-1022) · **Plage :** groupe C, 1023 (réservée au tracker) · **Ordre de C :** 1020 ✅ → 1019 ✅ →
1021 ✅ → 564 ✅ → 1022 ✅ → **1023** → 317.
**Sources :** `tickets/TICKET-BACKEND-balance-ne-declare-pas-son-dossier.md` (FE-063 ; servi pour la balance seule par
STORY-906, D-906-3 : « les autres familles — imports, cahiers, rejets, rapprochement — le recevront avec leurs propres
stories ») ; `architecture/architecture-balance-service-2026-08-15/ARCHITECTURE-SPINE.md` (« ⛔ Pas de route
`@PlatformReadOnly` ici — écart ouvert », § Non couvert) ; `architecture-prospera-ecosystem-2026-07-04.md`, **AD-P16**
(routes de lecture plateforme : `PLATFORM_ADMIN`, `orgId` en paramètre explicite jamais tiré du jeton, lecture seule, une
organisation à la fois, journalisées avec leur motif ; précisé le 11/11 : jamais pour l'apprentissage, sur site seulement
dans un tunnel ouvert) ; `architecture-catalogue-produits-service-2026-08-15` **AD-15** (la seule forme écrite d'une route
plateforme : sa garde propre `@PlatformReadOnly`, et rien d'autre du service ne l'emploie). Précédents dans le dépôt :
STORY-906 (`BalanceResponseDto.dossierId`, lu sur le document), STORY-402 (`CompteTresorerieResponseDto.dossierId`,
`ConsultationReleveResponseDto.dossierId`). Côté `bilan-service` et `dossier-service` (lus, jamais touchés) : aucune route
plateforme n'existe encore (`PLATFORM_ADMIN` y est refusé en amont, `exigerTenant` de dossier : « la console administre
des organisations, pas des dossiers ») ; balance est donc le **premier** service métier à servir AD-P16, et la forme
retenue ici est écrite pour que les autres la suivent.
**Rituel (2026-11-25) :** les demandes à C des journaux de A, B et D sont celles déjà placées par la session de groupe ;
aucune ne porte sur cette story. Verrou Docker : rendu par D à 23:30.

## Ce qui existait déjà

- **Le dossier déclaré** : `BalanceResponseDto` et `BalanceResumeDto` (906, 1117), `CompteTresorerieResponseDto`,
  `ConsultationReleveResponseDto`, `ListeImportsReleveResponseDto` (402) le portent. **Aucune autre** réponse JSON des
  routes `/dossiers/{dossierId}/…` des familles de la balance : relevé sur le document OpenAPI d'`origin/dev`, **37
  schémas de réponse** sans `dossierId`, deux de plus pour la mémoire des choix (dont le contrôleur manque au document
  sous test) (imports et profils, rejets, reprise et import Sage, agrégation et provenance,
  comptes de ventilation, cahiers de recettes et de dépenses, catégories, pièces OCR, rattachement, mémoire des choix,
  rapprochement, import de relevé, contrôles, balance de référence). Les collections portent toutes `dossierId`
  (requis au schéma depuis STORY-236), sauf `profils_import` : **un profil d'import est de l'organisation** (STORY-088 ;
  le dossier de la route garde l'accès, il ne filtre pas).
- **La lecture plateforme** : aucune. `PLATFORM_ADMIN` passe le jeton (`jwt.strategy.ts`, `tenantId: null`) mais
  n'apparaît dans aucun `@Roles` ; toute route métier le refuse (rôles tenant, puis garde d'accès sans organisation).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|---|---|---|
| AC-1 | Le contrat est annoncé avant le code (« ⚠ Contrats » du journal de C), routes, en-tête, codes et familles compris | PR de docs d'annonce, fusionnée avant le code |
| AC-2 | Toute réponse JSON 2xx d'une route `/dossiers/{dossierId}/…` des familles **balance, imports, rejets, reprise, cahiers, pièces OCR, rattachement, mémoire des choix, rapprochement, trésorerie** déclare `dossierId` **requis** au niveau du corps (sur chaque élément quand le corps est une liste) | balayage du document OpenAPI (e2e `openapi-contract`) : chaque chemin `/dossiers/…` est classé, couvert ou écarté **avec sa raison** ; un chemin neuf non classé rougit |
| AC-3 | La valeur est celle de la **donnée** quand le corps est une ressource d'un dossier (ligne, catégorie, surcharge, lot, rejet, appariement, qualification, comptes de ventilation, import de relevé, mémoire), celle du **dossier de la route** sinon (listes, synthèses, totaux, rapports, aperçus, états, analyse, profils d'import) | unitaires des projections ; e2e des familles |
| AC-4 | **Le contrat est tenu par ce que le service sert vraiment** (leçon de 1022) : dans les e2e de chaque famille, des corps réels sont validés par Ajv contre le schéma OpenAPI publié de leur route, et portent le dossier de l'URL | e2e (helper `contrat-openapi`) |
| AC-5 | Rien n'est renommé ni retiré, aucun champ de requête ne change, aucun code de refus ne bouge ; un écart trouvé par Ajv entre le document et le corps réel se corrige **en déclarant** ce qui est servi | diff des DTO ; e2e `openapi-contract` vert |
| AC-6 | Trois routes de lecture plateforme (AD-P16) répondent : la liste des balances d'un dossier d'une organisation (résumés), une balance, et le journal des lectures de l'organisation | e2e `lecture-plateforme` |
| AC-7 | Elles exigent `PLATFORM_ADMIN` **et rien d'autre** (un rôle de cabinet ⇒ 403 ; l'identité de service ⇒ 403 `IDENTITE_DE_SERVICE_REFUSEE`), prennent l'organisation et le dossier **du chemin** (jamais du jeton), **un motif** (`X-Motif-Lecture`, 10 à 500 caractères ⇒ sinon 400 `MOTIF_LECTURE_REQUIS`) et des identifiants bien formés (400 `IDENTIFIANT_INVALIDE`) | e2e ; unitaires de la garde |
| AC-8 | Chaque lecture est **journalisée avant d'être servie** (opérateur, organisation, dossier, route, ressource, motif, date) ; si le journal ne s'écrit pas, rien n'est lu | unitaires de la garde ; e2e ; mutations |
| AC-9 | Lecture seule, une organisation à la fois : toutes les routes `plateforme/` sont des `GET` sous `@PlatformReadOnly()` ; le décorateur n'est employé nulle part ailleurs ; `PLATFORM_ADMIN` n'apparaît dans aucun autre `@Roles` | invariant `lecture-plateforme.invariant.spec.ts` |
| AC-10 | Les invariants du dépôt restent verts : portée du cabinet (STORY-694), scope du dossier, plan d'effacement et d'export C13 (le journal y est **exclu avec sa raison**), routes sans écriture | suite unitaire complète, Node 24 |

## Le contrat (annoncé)

### 1. Le dossier déclaré

- Champ **`dossierId`** (chaîne, ObjectId hexadécimal), **requis**, au niveau du corps de chaque réponse JSON 2xx des
  routes couvertes (sur chaque élément d'une réponse en liste). Description publiée : « Dossier auquel la réponse se
  rapporte : à confronter au dossier affiché. »
- **Familles couvertes** (préfixes sous `/api/v1/dossiers/{dossierId}/`) : `balances`, `balance` (rejets, à-nouveaux,
  affectation du résultat, import et import Sage, agrégation des cahiers, provenance d'une ligne, comptes de
  ventilation), `exercices`, `imports`, `cahiers` (recettes, dépenses, catégories, mémoire des choix), `pieces/ocr`,
  `rattachement`, `rapprochement`, `tresorerie`.
- **Écartées, avec leur raison** (le ticket reste ouvert pour elles) : `fiscal`, `immobilisations`, `inventaire`,
  `devises` — hors du périmètre nommé par le plan (imports, cahiers, rejets, rapprochement), chacune à sa story ;
  `profil-societe` — en migration vers `dossier-service` (STORY-356/357, deux propriétaires déclarés) ; `referentiels`
  — un référentiel n'est pas une donnée de dossier (son dossier et sa famille sont déjà déclarés, STORY-925).
- Schémas de réponse neufs, **ajoutés sans renommer** : `MemoireCahiersDuDossierDto` (la vue de la mémoire servie sous
  le dossier, `dossierId` requis ; `MemoireCahiersDto` reste tel quel pour la mémoire du cabinet, où il est facultatif).
- Hors du sceau : `dossierId` n'entre dans aucun checksum (ni `checksum`, ni `soldesChecksum`).

### 2. La lecture plateforme (AD-P16)

| Route | Réponse |
|---|---|
| `GET /api/v1/plateforme/balance/organisations/{orgId}/dossiers/{dossierId}/balances` | `BalanceResumeDto[]` (filtres et bornes de `GET …/balances` : `etat`, `source`, `origine`, `limit` ≤ 200, `skip`) |
| `GET /api/v1/plateforme/balance/organisations/{orgId}/dossiers/{dossierId}/balances/{id}` | `BalanceResponseDto` ; 404 si la balance n'est pas de ce dossier de cette organisation |
| `GET /api/v1/plateforme/balance/organisations/{orgId}/lectures` | `LecturePlateformeDto[]` : le journal des lectures de l'organisation, le plus récent d'abord (`limit` ≤ 200, `skip`) |

- **Garde `@PlatformReadOnly()`** : `@Roles(PLATFORM_ADMIN)` seul ; ni la garde d'accès du module ni celle du dossier
  (un opérateur n'a ni organisation, ni KYC, ni droit) ; `orgId` et `dossierId` **du chemin**.
- **En-tête `X-Motif-Lecture`** obligatoire (10 à 500 caractères après suppression des espaces de bord) ; absent ou hors
  bornes ⇒ **400 `MOTIF_LECTURE_REQUIS`** ; identifiant mal formé ⇒ **400 `IDENTIFIANT_INVALIDE`** ; rôle de cabinet ⇒
  **403** (refus de rôle existant) ; identité de service ⇒ **403 `IDENTITE_DE_SERVICE_REFUSEE`**.
- **Journal `journal_lectures_plateforme`**, écrit **avant** la lecture : `operateurId`, `orgId`, `dossierId?`,
  `route` (méthode et gabarit), `ressourceId?`, `motif`, `lueLe`. Une écriture du journal qui échoue ⇒ la lecture n'a
  pas lieu (500). Le journal **survit** à l'effacement C13 de l'organisation (exclu du plan, avec sa raison : c'est la
  trace de la plateforme, pas une donnée du cabinet) et n'est pas exporté au titre du module.
- `Cache-Control: no-store` sur les trois routes.
- **Ce qui ne change pas** : aucune route existante, le manifeste `balance` (une route plateforme n'est pas une route du
  module), les topics.

## Décisions retenues par défaut (contestables)

- **D-1023-1 — La donnée d'abord, la route ensuite.** Le ticket demande une propriété *de la donnée* : une ressource
  persistée d'un dossier rend **son** `dossierId` (lu sur le document, comme 906 et 402 : une requête qui perdrait son
  filtre de dossier se verrait ligne par ligne) ; un corps calculé (liste, synthèse, état, aperçu) n'a pas d'autre dossier
  que celui de la route, qui l'a déjà filtré : il rend celui-là. Une seule règle de lecture pour le client : « le dossier
  auquel la réponse se rapporte ».
- **D-1023-2 — Le profil d'import rend le dossier de la route.** Il est de l'organisation (STORY-088) ; lui inventer un
  dossier propre serait faux, ne rien déclarer laisserait la famille `imports` sans contrôle. La description publiée le dit.
- **D-1023-3 — Le périmètre est celui du plan, et il est balayé.** Les familles nommées (imports, cahiers, rejets,
  rapprochement) et leurs voisines de la balance (reprise, import Sage, contrôles, référence, trésorerie) sont couvertes ;
  les autres sont **écartées par une liste fermée**, raison écrite, dans le balayage : une famille neuve sous
  `/dossiers` rougit tant que personne ne l'a classée. Le ticket reste ouvert pour les écartées.
- **D-1023-4 — Ajv sur les corps réels**, pas seulement le document : 1022 a montré un schéma publié en retard sur les
  messages réels. Un helper d'e2e construit le document OpenAPI des contrôleurs de la suite et valide le corps reçu contre
  le schéma de sa route ; un écart trouvé se corrige en déclarant ce qui est servi (AD-27).
- **D-1023-5 — Une organisation ET un dossier dans le chemin.** AD-P16 borne à une organisation à la fois ; le dépôt de
  la balance lit par `(orgId, dossierId)`, et la plateforme connaît les dossiers par `dossier-service` (propriétaire).
  Aucune route ne liste les dossiers d'une organisation ici : ce serait dupliquer la donnée d'un autre service.
- **D-1023-6 — Le motif dans un en-tête**, pas dans l'URL : un motif dans la chaîne de requête finirait dans les journaux
  d'accès et les caches. `X-Motif-Lecture`, borné (10 à 500).
- **D-1023-7 — Journaliser dans la garde, avant le contrôleur.** Aucune route plateforme ne peut oublier son journal ; un
  journal qui ne s'écrit pas ferme la lecture (« un accès sans motif n'est pas un accès autorisé » ; un accès sans trace
  non plus). Une lecture refusée ensuite (404) reste journalisée : la tentative est l'information.
- **D-1023-8 — Le journal se relit par la même story** (leçon du programme, catalogue AD-7 : « l'écriture sans lecture
  payée trois fois ») : `GET …/organisations/{orgId}/lectures`, lui-même sous la garde (sa lecture est journalisée).
- **D-1023-9 — Le journal survit à l'effacement C13.** Effacer la trace des lectures de la plateforme avec les données du
  cabinet ôterait le seul garde-fou d'AD-P16 ; il est exclu du plan d'effacement avec sa raison, comme le registre des
  effacements (D-928-6).
- **D-1023-10 — Le tunnel sur site (AD-20) n'est pas tenu ici** : balance ne sait pas si un tunnel est ouvert ; c'est la
  passerelle de l'instance qui ferme `plateforme/` hors tunnel. Écrit dans « Ce qui reste ».
- **D-1023-11 — L'observation des e2e vérifie le dossier ; Ajv complet là où le corps est celui du vrai service.**
  Chaque e2e des familles couvertes observe TOUT corps JSON 2xx qu'il reçoit (intercepteur Express posé avant
  `app.init()`, `test/utils/contrat-openapi.ts`) et exige, en dernier test, le dossier de l'URL et `dossierId` requis
  au contrat de la route. La conformité complète au schéma (Ajv) n'y est pas exigée : plusieurs suites doublent leurs
  services par des objets partiels, que le schéma refuse à bon droit (import Sage). Elle est exigée sur les corps du vrai
  service : rejets, balance de référence, contrôles, les trois routes de la plateforme.
- **D-1023-12 — Le contrat aligné sur ce que le service sert, en déclarant** (AC-5, AD-27) : `POST /balances` publie
  aussi son 200 (rejeu idempotent, `res.status`), et les trois POST de reprise (`a-nouveaux`, `affectation-resultat`,
  `exercices/{exercice}/ouvrir`) leur 201 (POST sans `@HttpCode`) — le document ne publiait que l'autre code. Rien ne
  change dans ce que le service répond.
- **D-1023-13 — Quand la projection ne porte plus le dossier, celui de la route** : la règle de rattachement
  (`SurchargeEvaluee`, type du domaine) et le paramétrage de ventilation (défauts sans document) rendent le dossier de la
  route qui les a filtrés ; la mémoire servie sous le dossier rend le sien, et celui de la route pour un document
  antérieur qui ne le porterait pas.

## Livraison

**prospera-balance-service #170**, fusionnée en rebase : **`dev` `75179cf`** (branche `b9e178f`, arbre identique).
Annonce avant le code : prospera-stories #930 (`main` `28dc047`). **Conforme à l'annonce**, avec deux ajouts écrits :
D-1023-12 (les codes 200/201 que le contrat taisait) et le code `LECTURE_PLATEFORME_REFUSEE` (403 de la garde, en défense
en profondeur derrière `@Roles` : un rôle de cabinet est refusé avant, par le refus de rôle existant).

- `src/common/decorators/dossier-declare.decorator.ts` : `ApiDossierDeclare()` (description commune, requis) et
  `SansDossierDeclare<T>` (le corps d'un service avant que le contrôleur n'y pose le dossier de la route).
- 39 schémas de réponse : la donnée d'abord (`String(doc.dossierId)` : rejets, lignes de recettes et de dépenses,
  catégories, lots OCR, appariements), la route sinon (`exigerDossierId(dossier)` dans le contrôleur ou le service).
  `MemoireCahiersDuDossierDto` (`OmitType` : la vue du cabinet reste intacte).
- `src/modules/lecture-plateforme/` : `PlatformReadOnly()`, `LecturePlateformeGuard`, `JournalLecturePlateforme`
  (`journal_lectures_plateforme`, index `{ orgId, lueLe }`), `LecturePlateformeController`, le module (dans `AppModule`).
  `EXCLUSIONS_JUSTIFIEES` du plan d'effacement : le journal (D-1023-9). `SANS_LECTURE_DE_DOSSIER` (invariant 694) : le
  contrôleur, avec sa raison.
- Gardes : `lecture-plateforme.invariant.spec.ts` (toute route `plateforme/` est un GET sous le décorateur, gardé,
  `PLATFORM_ADMIN` seul ; le décorateur nulle part ailleurs ; `PLATFORM_ADMIN` dans aucun autre `@Roles` ; ni la garde
  d'accès ni celle du dossier) ; `openapi-contract.e2e-spec.ts` (le balayage des familles, la mémoire et les lectures de
  la plateforme entrent au document).

## Preuves

| Preuve | Résultat |
|---|---|
| Node 24 (étage `verification`, archive du commit) — unitaires | **300/300 suites** (2 ignorées), **5764 tests** (21 ignorés) |
| Node 24 — e2e | **38/38 suites, 2324 tests** (dont `lecture-plateforme` neuf, et le dernier test de 12 suites de familles) |
| `npm run build` (Node 24), `tsc`, lint des fichiers touchés | verts |
| Node 25 — unitaires | 286 suites vertes ; rouges connues sous Node 25 seulement (client Kafka natif, `app-cablage`, `devise-paquet.exhaustivite` : séparateurs Windows) |
| Ajv sur les corps réels (AC-4) | rejets, balance de référence, contrôles, les trois routes de la plateforme : conformes |
| Observation des e2e (AC-4) | 12 suites : chaque corps servi des familles couvertes déclare le dossier de son URL |
| Mutations | **11/11 tuées sur une assertion** : borne basse du motif, journal en panne qui laisse lire, rôle non revérifié, organisation non vérifiée, décorateur sans la garde, `PLATFORM_ADMIN` sur une route du cabinet, journal de toutes les organisations, `dossierId` facultatif au contrat, rejet / ligne de recette / appariement au dossier faux |
| Pile `grp-c` (mongo rs0, Kafka 3.9.0, balance REEL depuis l'image de l'archive, IdP de test) | **17/17** : service sain avec le module neuf (§1.5) ; balance, référence, rejets, catégories, comptes de ventilation déclarent le dossier de l'URL (données en base) ; opérateur servi (résumés, `no-store` ; une balance et ses lignes) ; sans motif 400, organisation mal formée 400, membre 403, moteur 403, POST 404, l'opérateur n'ouvre aucune route du cabinet ; journal relu (3 lignes, la plus récente d'abord, rien des refus) et en base (3 lignes) |
| Docker | verrou pris à 01:08, rendu à 01:18 ; repris à 01:18, rendu à 01:20 (`trap EXIT`) ; aucun conteneur `grp-c` restant |

**Premier tour de pile, écrit** : 16/17, la catégorie attendue n'existait pas (le service ne sème ses catégories par
défaut que depuis le référentiel du dossier, que la pile ne sème pas) ; une catégorie semée en base, le second tour est
vert.

## Ce qui reste

- **Familles écartées** (le ticket reste ouvert pour elles) : `fiscal`, `immobilisations`, `inventaire`, `devises`,
  `profil-societe` (en migration vers `dossier-service`), `referentiels` — chacune à une story ; le balayage les nomme.
- **Écarts antérieurs relevés par Ajv, non corrigés ici** (ils changeraient la forme d'autres champs) : l'aperçu de
  l'agrégation des cahiers (`POST …/balance/depuis-cahiers`, 200) sert des lignes sans `aNouveauDebit`, `aNouveauCredit`,
  `comptesSources`, `sourcesTotal`, que le schéma déclare requis ; `GET …/rapprochement/ecarts` sert des écarts sans
  `devise`, déclarée requise. À traiter par une story de C (déclarer facultatif ce qui l'est, ou servir le champ).
- **Le tunnel sur site** (AD-20, D-1023-10) : la passerelle de l'instance ferme `plateforme/` hors tunnel ouvert.
- **→ B (information)** : la console de la plateforme peut lire la balance d'une organisation par ces trois routes ; la
  même forme (`@PlatformReadOnly()`, motif en en-tête, journal avant lecture) vaut pour les services qui suivront.
