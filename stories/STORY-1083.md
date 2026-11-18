# STORY-1083 : le dossier de financement existe

Status: done

**Complexité :** moyenne (5 pts ; un module neuf dans un service existant : garde, droits hors du jeton, états,
versions, piste d'audit ; un droit de plus au catalogue d'auth)

**Épic :** EPIC-266 (le dossier de financement bancaire, `financement`, M49), lot F1 — FR-1 du PRD
`prds/prd-services-cabinet-2026-11-18/prd.md` (§2.3 droits, §4.1, NFR-1 → NFR-5, D-SC-1 → D-SC-3)
**Dépôts :** `MoneyVibesGroup/prospera-bilan-service` (dossier `src/modules/financement/`) ;
`MoneyVibesGroup/prospera-auth-service` (les trois droits au catalogue de tenant, PR séparée, D-1083-4) ;
`prospera-stories` (`manifestes/financement.manifest.ts`, M49)
**Plage :** reçue de A (STORY-1080 → 1084, 1093 ; plan du lot 4 §3, ligne 3). Identifiant réservé par A le 18/11
(`STORY-1083 → STORY-1092`).
**Plan :** `coordination/PLAN-4-SESSIONS-LOT-4-2026-11-18.md` §3, ligne 3 : **Docker : non** (D-L4-3).
**Dépend de :** rien (AP-50, le référentiel des exigences bancaires, n'est pas un prérequis : la banque cible garde
un code et une version facultative, D-1083-12).
**Débloque :** STORY-1084 (emprunts et échéancier, même module), FE-140 (l'onglet « Financement »).
**Suivante :** STORY-1084.

**Sources lues :** plan du lot 4 (§0, §1 D-L4-1 → 3, §3, §7, §8) ; `REGLES-DES-GROUPES.md` ; journaux de A (passation
D-L4-1, « Pièges rencontrés », pièges 923 → 929), de B, C, D ; épic STORY-1083 (AC-1 → AC-5) ; PRD des services du
cabinet (FR-1, FR-2, FR-5, §2.3, §5, §9). Code relu sur `origin/dev` de bilan `1651d33` : la garde d'accès
(`bilan-access.guard.ts`, état publié seul depuis 918), la projection de l'état publié (`etat-publie.*`), la garde
partagée copiée (`src/vendor/garde-etat-publie`), la portée du dossier (`DossierScopeGuard`, portefeuille du
collaborateur, STORY-683), `DossierScopedRepository`, la piste d'audit (`AuditService`, `AuditType`), le plan
d'effacement C13 (928) et ses invariants, `app-cablage.invariant.spec.ts`. Comptabilité (B) : la lecture des droits
hors du jeton (`src/droits/`, STORY-959, 962). Auth `682bba4` : `droits-hors-jeton.ts`, `table-d-acces-cabinet.ts`.

**Ce qui existait déjà (relu avant la fiche) :** rien du dossier de financement (`git grep financement` : seuls le
« besoin de financement » du prévisionnel et le tableau des flux). Aucune lecture de `GET /moi/droits` dans bilan :
toutes ses routes ne décident que par le rôle du jeton (`TENANT_ADMIN`, `TENANT_USER`) et la garde `bilan`. La
projection de l'état publié ne garde que le module `bilan` (une ligne par organisation).

**Passation constatée (D-L4-1) :** `origin/dev` de bilan est à **`1651d33`** (STORY-928), le commit nommé par A :
rien n'a bougé depuis la passation. Le checkout du poste était 13 commits derrière (`3f8e235`) avec des dépendances du
15/11 : branche partie d'`origin/dev`, `npm ci --ignore-scripts`. Les deux brouillons non suivis du 15/11
(`cr-map.txt`, `cr-postes.txt`) restent hors de tout commit.

---

## Ce qui doit être vrai à la fin

| AC (épic) | Fait |
|---|---|
| AC-1 — manifeste C1 `financement` (cabinet, dépend de `bilan`), garde `FINANCEMENT_NOT_ENTITLED`, trois droits déclarés et attribués | manifeste M49 dans `prospera-stories`, copié à l'octet dans bilan ; garde par l'état publié du module `financement` (garde partagée, matrice figée) ; droits lus par `GET /moi/droits` ; attribués dans auth (`CAB_ASSOCIE` les trois, `CAB_COLLABORATEUR` préparer et consulter) |
| AC-2 — `POST/GET/PATCH …/dossiers/{id}/financements` | sept routes (D-1083-6) ; objet, montant, durée, différé, type, banque cible (code, version lue), garanties, exercice de référence |
| AC-3 — la table de FR-1 exactement ; toute autre transition 409 `TRANSITION_INTERDITE` ; `PRET` → `REMIS` refusé `VERSION_FIGEE_ABSENTE` | une table, une route de transition, chaque ligne éprouvée (permise et interdite, 6 × 6) ; mutation sur la garde |
| AC-4 — un dossier `REMIS` est immuable ; corriger crée la version n+1, la précédente reste lisible | `PATCH` refusé hors `BROUILLON` ; `POST …/versions` sur un `REMIS` archive la version n et ouvre n+1 |
| AC-5 — cloisonnement (portefeuille, 404), piste d'audit, mutation sur la garde de transition | portée du dossier (`DossierScopeGuard`) ; quatre types d'audit neufs ; historique des transitions sur le dossier |

## Décisions retenues par défaut (contestables)

- **D-1083-1 — Un module Nest neuf, sans Docker.** `FinancementModule` (`src/modules/financement/`), importé par
  `AppModule`. La story est « Docker : non » (D-L4-3) : la preuve du démarrage est le câblage du module racine
  (`app-cablage.invariant.spec.ts`, `NestFactory.create(AppModule, { preview: true })`, binding de Confluent doublé
  sous Node 25), qui rougit si le module ne résout pas son graphe, et des e2e qui montent le vrai contrôleur derrière
  les vraies gardes. **Le démarrage réel sera prouvé à la première story Docker qui lève bilan (1082, au plus tard
  1080)** : écrit dans le journal.
- **D-1083-2 — La garde `FINANCEMENT_NOT_ENTITLED` lit l'état publié du module `financement`.** Le même topic
  `etat-publie.changed.<espace>`, une projection de plus (collection `etats_publies_financement`, même règle
  `(epoque, numero)`), décidée par la garde partagée copiée (`garde-etat-publie-v1`, inchangée) selon la sorte de la
  requête : inconnu ⇒ refus ; `LECTURE_SEULE` ⇒ les lectures passent, les écritures 403 `ABONNEMENT_EXPIRE`. La garde
  ne relit pas l'état de `bilan` : la dépendance est tenue par le moteur à l'installation (C1). Le fichier de schéma
  de l'état publié de `bilan` (copié à l'identique dans balance) n'est pas touché. Ordre : e-mail vérifié, KYC
  approuvé, état publié, puis le droit, **avant** la portée du dossier (un module fermé ne dit rien du dossier).
- **D-1083-3 — Les droits hors du jeton, lus par `GET /moi/droits` (patron de la comptabilité, STORY-959).** Une
  route déclare son droit (`@DroitFinancement`) ; une route sans droit déclaré est fermée (500, faute de
  programmation) ; le droit absent ⇒ 403 `DROIT_INSUFFISANT` (`details.droit`) ; auth injoignable, lent (3 s) ou hors
  contrat ⇒ 503 `DROITS_INDISPONIBLES` (fermé ; un 403 d'auth = aucun droit). Le jeton du membre est relayé tel quel.
  **Sans cache** : la clé du cache de la comptabilité porte `dv`, que bilan ne projette pas du jeton ; les gestes du
  dossier de financement sont rares. URL : `AUTH_SERVICE_URL` **facultative**, dérivée par défaut d'`AUTH_JWKS_URI`
  (son origine + `/api/v1`, soit `http://auth-service:3001/api/v1` dans les piles) : aucun compose à changer.
- **D-1083-4 — Les droits au catalogue d'auth, par une PR séparée d'auth (auth est à B).** `financement:dossier:preparer`,
  `:valider`, `:consulter` dans `DROITS_HORS_JETON` (section `financement`), jamais dans le jeton ; attribués par la
  table d'accès du cabinet : préparer et consulter à tous (associé, collaborateur), valider à l'associé (PRD §2.3).
  Les rôles du socle `TENANT_ADMIN` / `TENANT_USER` en dérivent (associé / collaborateur par défaut du vertical).
- **D-1083-5 — Le manifeste M49 dans `prospera-stories`, copié à l'octet dans bilan.** `manifestes/financement.manifest.ts`
  (annoncé avec cette fiche), copié depuis le blob de `origin/main` dans `src/vendor/manifestes/` (hors lint, comme la
  garde partagée), gardé par son empreinte ; les droits que le service accepte sont ceux de la copie. **Le catalogue
  ne recopie pas le manifeste dans cette story** (sa copie est déjà en retard, `manifestes:garde` rouge, STORY-977) :
  à faire par la prochaine story de B qui touche le catalogue (975). D'ici là, aucun état n'est publié pour
  `financement` : toutes les routes répondent 403 `FINANCEMENT_NOT_ENTITLED` (fermé, voulu).
- **D-1083-6 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements`, contrôleur au chemin littéral,
  `@RequiresDossierScope()`, rôles `TENANT_ADMIN` et `TENANT_USER`) :

  | Route | Droit | Effet |
  |---|---|---|
  | `POST /` | préparer | crée un dossier `BROUILLON`, version 1 (201) |
  | `GET /` | consulter | les dossiers de financement du client, le plus récent d'abord |
  | `GET /{financementId}` | consulter | le dossier, version courante |
  | `PATCH /{financementId}` | préparer | modifie un `BROUILLON` en place (200) ; sinon 409 `DOSSIER_FINANCEMENT_NON_MODIFIABLE` |
  | `POST /{financementId}/transitions` | valider | change l'état selon FR-1 (200) |
  | `POST /{financementId}/versions` | valider | corrige un `REMIS` : archive la version n, ouvre n+1 en `BROUILLON` (201) |
  | `GET /{financementId}/versions` | consulter | les versions (archivées et courante) |
  | `GET /{financementId}/versions/{version}` | consulter | une version, lisible telle qu'elle était |

  Un dossier de financement d'un autre dossier client, ou inconnu : 404 `DOSSIER_FINANCEMENT_INTROUVABLE` ; une
  version inconnue : 404 `VERSION_INTROUVABLE`.
- **D-1083-7 — Une route de transition, la table de FR-1 en une constante.** `vers` + les conditions de la ligne.
  Toute transition exige `valider` (toutes les lignes de FR-1 le disent ; la création seule est `préparer`). Hors de
  la table (dont un état vers lui-même) : 409 `TRANSITION_INTERDITE`, `details: { depuis, vers }`. Condition de la
  ligne absente : 422 `TRANSITION_INCOMPLETE`, `details: { vers, champs }`. Ordre : dossier (404), table (409),
  conditions (422), version figée (409), écriture (409 `CONFLIT_CONCURRENT`). Conditions : `PRET` → `BROUILLON`,
  `REMIS` → `REFUSE`, → `ABANDONNE` : `motif` (10 à 500 caractères, publié dans la piste) ; `PRET` → `REMIS` :
  `dateRemise` (date) ; `REMIS` → `ACCORDE` : `montantAccorde` (entier FCFA), `tauxAnnuelPct` (0 à 100, quatre
  décimales au plus), `dureeAccordeeMois` (1 à 360). Les champs d'une autre ligne sont ignorés (rien n'est gardé).
- **D-1083-8 — `BROUILLON` → `PRET` sans condition jusqu'à STORY-1085**, qui y posera `EXIGENCES_BANCAIRES_INCOMPLETES`
  (FR-2).
- **D-1083-9 — `PRET` → `REMIS` refusé `409 VERSION_FIGEE_ABSENTE` jusqu'à STORY-1086.** Un port `VersionsFigees`
  répond « aucune » ; 1086 le remplace par la lecture des versions figées. `REMIS`, `ACCORDE` et `REFUSE` ne sont donc
  pas atteignables par l'API dans cette story : les e2e les sèment en base (comme 1086 les produira) pour éprouver
  leurs lignes.
- **D-1083-10 — Les versions.** `BROUILLON` se modifie en place (aucune version). `PRET` ne se modifie pas : on le
  repasse en `BROUILLON` (droit valider, motif). `ACCORDE`, `REFUSE`, `ABANDONNE` sont finaux : rien ne se modifie.
  `REMIS` : `PATCH` refusé ; la correction (`POST …/versions`, valider, `motif` + les champs corrigés) archive la
  version n telle quelle (état `REMIS`, date de remise, transitions) et ouvre la version n+1 en `BROUILLON` : le
  contenu corrigé n'a pas été remis, il repassera `PRET` puis `REMIS` avec sa propre version figée. La version n
  reste lisible (`GET …/versions/{n}`). Ce n'est pas une transition `REMIS` → `BROUILLON` de la version n (interdite
  par la table) : c'est une version de plus.
- **D-1083-11 — Sans transaction, l'archive d'abord.** Chaque écriture est une mise à jour conditionnelle sur l'état
  et la version lus ; la perdante reçoit 409 `CONFLIT_CONCURRENT` (relire). La correction écrit l'archive de la version
  n (upsert sur `(financementId, version)`) **avant** d'ouvrir n+1 : une panne entre les deux laisse une archive de
  la version COURANTE, que les lectures ignorent (une archive ne compte que sous la version courante) et que la
  correction suivante réécrit. Aucun client ne porte de jeton de concurrence.
- **D-1083-12 — La banque cible :** `banque.code` (le code du référentiel `exigences-bancaires-uemoa`, `[A-Z0-9_-]`,
  2 à 40) et `banque.versionReferentiel` (facultative, `null` tant que l'écran ne l'a pas lue : AP-50 n'est pas livré).
  Gardées telles quelles ; la lecture du référentiel, la banque générique UEMOA par défaut et « une nouvelle version
  ne change pas un dossier créé » viennent avec 1085.
- **D-1083-13 — L'exercice de référence est une ANNÉE** (`exerciceReference`, 2000 → 2100), pas un identifiant
  d'exercice : un dossier se crée avant que la balance soit dans Prospera (FR-2 : un exercice absent est « manquant »,
  il ne bloque pas la création). 1085 lira les jeux d'états validés de cette année et des précédentes.
- **D-1083-14 — Les champs** : `objet` (3 à 500), `montant` (entier FCFA, 1 → 10¹²), `dureeMois` (1 → 360),
  `differeMois` (0 → durée − 1, 0 par défaut ; sinon 400 `DIFFERE_INVALIDE`, jugé sur la durée en place quand elle
  ne change pas), `type` (`INVESTISSEMENT` | `TRESORERIE` | `CREDIT_BAIL`), `banque`,
  `garanties` (texte, 2 000 au plus, facultatif), `exerciceReference`. Aucun flottant pour un montant (NFR-3).
- **D-1083-15 — La piste d'audit :** quatre types neufs d'`AuditType` (`FINANCEMENT_CREE`, `FINANCEMENT_MODIFIE`,
  `FINANCEMENT_ETAT_CHANGE` avec `depuis`, `vers`, `version`, `motif` ; `FINANCEMENT_VERSION_OUVERTE` avec
  `version`, `motif`), lus par `GET /dossiers/{id}/bilan/audit` (ajouts à l'énumération du filtre `type`). Comme
  `journaliser` n'est pas étanche (son échec est avalé), le dossier porte aussi l'historique de ses transitions
  (`transitions[]` : depuis, vers, par, le, motif) et son auteur (`creePar`, `modifiePar`).
- **D-1083-16 — Portée et rôles :** comme le reste de bilan, `@Roles(TENANT_ADMIN, TENANT_USER)` et la portée du
  dossier (`DossierScopeGuard`) : un collaborateur hors de son portefeuille, « Mon cabinet », un dossier d'un autre
  cabinet ⇒ 404 ; dossier archivé : lecture permise, écriture 409 (D9). Le droit dit QUEL geste, la portée QUEL dossier.
- **D-1083-17 — Effacement C13 :** les deux collections neuves (`dossiers_financement`,
  `versions_dossier_financement`, champ `tenantId`) entrent dans le plan d'effacement de bilan (l'invariant 928
  l'exige) ; la projection `etats_publies_financement` (champ `organizationId`) aussi. Routes d'instance propres à
  `financement` : à créer (manifeste).

## Hors de cette story

Emprunts, échéancier, indicateurs de dette, scénario retenu (1084) ; exigences de la banque et complétude (1085) ;
document figé et version figée (1086) ; le manifeste au catalogue (975) ; les écrans (FE-140) ; le relais BFF
(aucun : l'app du cabinet parle à bilan directement, comme pour le prévisionnel).

## Livraison

- **bilan #180** — `36c22fa` sur `dev` (branche `MNV-1083`, tête `8846d7a`, rejouée en rebase) : module `financement`,
  36 fichiers.
- **auth #47** — `96f8ab3` sur `dev` (tête `28b3ce9`) : trois droits au catalogue de tenant, table d'accès du cabinet.
- **Annonce avant le code** : stories #692 (fiche, manifeste M49, « ⚠ Contrats »), amendement #693 (`DIFFERE_INVALIDE`).

## Preuves

Node 25.2.1 du poste, **sans Docker** (D-L4-3) ; `npm ci --ignore-scripts` (binding de Confluent absent).

- **bilan, e2e `test/financement.e2e-spec.ts` : 82/82.** Le vrai contrôleur derrière les vraies gardes dans l'ordre
  d'`AppModule` (JWT RS256 → e-mail → rôles → garde du module → `DossierScopeGuard` réel), le VRAI adaptateur de
  `GET /moi/droits` (fetch doublé : droits par membre, panne). AC-1 : état publié inconnu ⇒ 403
  `FINANCEMENT_NOT_ENTITLED` même sur le dossier d'un autre cabinet (rien n'est dit du dossier), `NON_INSTALLE`,
  `LECTURE_SEULE` (GET 200, POST `ABONNEMENT_EXPIRE`), KYC, collaborateur sans `valider` (403 `DROIT_INSUFFISANT`,
  `details.droit`), membre sans droit, auth en panne (503). AC-2 : création (201, BROUILLON v1, champs), version du
  référentiel facultative, 7 corps refusés (400), `DIFFERE_INVALIDE`, liste, lecture, `PATCH` d'un brouillon, `PATCH`
  refusé dans les 5 autres états. AC-3 : **les 36 couples (6 × 6) éprouvés** contre la table recopiée du PRD (8
  permises, `PRET` → `REMIS` refusé `VERSION_FIGEE_ABSENTE`, 28 `TRANSITION_INTERDITE` avec `details`), accord gardé,
  5 conditions manquantes (422, champs nommés), aller-retour avec motif et piste. AC-4 : correction d'un REMIS (v1
  archivée REMIS, v2 BROUILLON, `GET …/versions`, `…/versions/1` telle qu'elle était, `…/versions/3` 404), archive
  orpheline ignorée puis réécrite, correction refusée dans les 5 autres états, motif et droit exigés. AC-5 :
  collaborateur hors portefeuille 404 (et 201 sur son dossier), autre cabinet 404, dossier de financement d'un autre
  dossier client 404 en lecture et en écriture, dossier archivé (lecture 200, écriture 409 `DOSSIER_ARCHIVE`),
  identifiant mal formé 404. OpenAPI : 5 chemins, 8 opérations, `EtatFinancement` en énumération nommée.
- **bilan, unitaires neufs : 130 passés** (14 suites des chemins touchés ; table des transitions 6 × 6 recopiée du
  PRD, garde du module, adaptateur `/moi/droits` fermé à 7 pannes, dépôts conditionnels et cloisonnés, service,
  projection de l'état publié de `financement`, copie du manifeste par empreinte, `urlDeLApiAuth`, plan
  d'effacement C13, invariant de portée 29 contrôleurs / 25 nichés).
- **bilan, suite complète** : 332 suites, 11 738 passés ; 18 suites rouges, dont **16 rouges à l'identique sur
  `origin/dev`** (témoin dans un worktree détaché de `1651d33` : binding de Confluent sous Node 25, et
  `dossier-scope.invariant` « segment `:dossierId` déclaré » qui lit un décorateur en CRLF) ; les deux autres
  (`export.service`, `homogeneisation.regles`, sensibles à la charge) **vertes relancées seules** (91/91).
- **Câblage du module racine** (`app-cablage.invariant.spec.ts`, `NestFactory.create(AppModule, { preview: true })`)
  **vert** avec le client de Confluent doublé (`moduleNameMapper`), **rouge** si `FinancementModule` n'exporte plus la
  source des droits (« Nest can't resolve dependencies of the FinancementAccessGuard … SourceDesDroits »).
- **Mutations bilan : 14/15 rouges sur l'assertion**, une **équivalente** : retirer une ligne de la table, ne plus
  regarder l'état d'arrivée, « rien ne manque », ne plus exiger la version figée, ne plus lire la table, écriture
  sans l'état lu, sans la version lue, droit non exigé, état publié inconnu qui ouvre, état de `bilan` projeté dans
  `financement`, version n non archivée, archive de la version courante comptée, correction d'un non-REMIS,
  modification d'un non-BROUILLON — toutes rouges. **Équivalente** : passer `bilan` au lieu de `financement` à la
  garde partagée ne change que le libellé de son code, que la garde du module n'emploie pas (elle répond
  `FINANCEMENT_NOT_ENTITLED` elle-même). Lint des fichiers touchés, `tsc`, `nest build` verts.
- **auth** : suites des droits 23/23 (385 tests) ; suite complète 102 suites, 1 429 passés, 4 rouges connues (binding
  de Confluent : `app-cablage`, trois `kafka/*`, comme 977) ; **mutations 5/5 rouges** (valider retiré, valider au
  collaborateur, consulter retiré au collaborateur, libellé changé, ordre du catalogue) ; lint, `tsc`, build verts.
- **Docker : non** (D-L4-3). **Le démarrage réel de bilan avec le module neuf reste à prouver** par la première story
  qui lève bilan sur une pile (1082 si elle le lève, au plus tard 1080, recette complète) : `docker compose up` de
  bilan sain, route `GET /api/v1/dossiers/{id}/financements` mappée, 403 `FINANCEMENT_NOT_ENTITLED` tant que le
  catalogue n'a pas le manifeste.

## Pour la suite

- **STORY-1084** (même module) : les emprunts s'ajoutent au dossier de financement (une sous-ressource, ou un champ
  de la version : le contenu archivé par `POST …/versions` doit les porter) ; le scénario retenu (jeu d'hypothèses).
  Un dossier `REMIS` ne se modifie pas : ses emprunts non plus.
- **STORY-1085** : poser `EXIGENCES_BANCAIRES_INCOMPLETES` dans la ligne `BROUILLON` → `PRET` (aujourd'hui sans
  condition, D-1083-8) ; lire le référentiel `exigences-bancaires-uemoa` et fixer `banque.versionReferentiel`.
- **STORY-1086** : remplacer `AucuneVersionFigee` (port `VersionsFigees`) par la lecture des versions figées ; `PRET`
  → `REMIS` s'ouvre alors (le test unitaire « avec une version figée » le prouve déjà).
- **Catalogue (975)** : recopier les manifestes (`npm run manifestes:copier`), `financement` compris, pour que le
  moteur installe le module et publie son état ; sans cela, FE-140 ne peut rien afficher en réel.
- Routes C13 propres à `financement` (`instance/financement/…`) : à créer ; l'effacement de bilan efface déjà ses
  collections.
