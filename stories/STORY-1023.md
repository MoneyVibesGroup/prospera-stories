# STORY-1023 : les contrats de la balance complétés — le dossier déclaré partout, la lecture inter-organisations

Status: in_progress

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

## Livraison

*(à remplir à la fusion)*

## Ce qui reste

*(à remplir à la fusion)*
