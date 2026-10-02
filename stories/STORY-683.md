# STORY-683 : bilan-service sert les liasses d'un dossier à tout collaborateur de l'organisation, affecté ou non

Status: ready-for-dev

**Épic :** EPIC-012
**Service :** `bilan-service` (`DossierScopeGuard`, read-model du dossier)
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de sécurité de STORY-538 (2026-09-25) — constat **pré-existant**, hors périmètre de 538.

---

## Le fait, mesuré dans le code (`bilan-service` `dev` `8bb2e54`)

`src/modules/read-models/guards/dossier-scope.guard.ts:116` : `findOne({ dossierId, orgId })` — la
« portée de dossier » de bilan-service **ne filtre que par organisation**. Son read-model du dossier ne
porte ni le responsable ni les contributeurs. `dossier-service`, lui, applique la portée par
collaborateur (`porteeDeLAppelant` : un collaborateur non affecté reçoit `404`).

⇒ Un `TENANT_USER` non affecté à un dossier lit chez bilan-service ses liasses, versions figées,
contrôles, piste d'audit — tout ce que dossier-service lui refuse. STORY-538 a dû contourner le trou
(portée re-vérifiée chez dossier-service) ; STORY-537 le fait aussi.

## Critères d'acceptation

- [x] AC-1 — La portée par collaborateur est appliquée par `bilan-service` lui-même, **localement**
      (read-model des affectations alimenté par événement — invariant 2 : aucun appel synchrone sur le
      chemin chaud), fail-closed.
- [x] AC-2 — Un collaborateur non affecté reçoit `404` sur **toutes** les routes `dossiers/:dossierId/…`,
      jamais `403` ; un `TENANT_ADMIN` garde l'accès à tous les dossiers de l'organisation (règle
      d'affectation de dossier-service, relue — jamais supposée).
- [x] AC-3 — e2e avec jeton `TENANT_USER` non affecté sur chaque famille de routes, **mutation** de la garde.
- [x] AC-4 — Relever les autres relying parties qui reprennent le même garde (balance-service…) et le
      dire, sans les corriger ici.

## Cadrage — décisions

- **D-683-1 — Contrat `dossier.*` : ajout ADDITIF côté `dossier-service`, `schemaVersion` inchangé**
  (convention `devise` STORY-499 / STORY-529). `responsableUserId?: string` — **absent** (jamais
  `null`) quand le dossier n'en a pas (« Mon cabinet », D11) ; `contributeursUserIds: string[]` —
  **toujours présent** (`[]` au besoin) : sa présence signe un message postérieur à STORY-683. Des
  `ObjectId` hexadécimaux, aucune donnée d'identité. Lus **nommément** (`affectationPubliee`,
  `Array.from` ⇒ tableau natif), jamais par spread (getters Mongoose).
  Relevé : les **deux** voies qui modifient l'affectation — `PATCH /dossiers/:id/affectation`
  (`modifierAffectation`) et la retombée d'un partant (`reaffecterDossiersDuMembre`, projection
  `identity.membership.changed`) — passent par `ecrireModification`, qui publie `dossier.updated`
  **dans la transaction** (outbox). Aucune autre écriture ne touche l'affectation
  (`enrichirCabinet` : identité seule ; `rollback-dossiers` : suppression CLI). Rien à corriger.
- **D-683-2 — Read-model `dossiers_dossier` (base `bilan_service`)** : `responsableUserId` et
  `contributeursUserIds` déclarés au schéma avec `default: undefined` (pièges Mongoose ① `$unset`
  d'un chemin non déclaré retiré en silence, ② défaut implicite `[]`). La projection
  (`miseAJourDossier`) pose l'état en `$set` et l'affectation en `$set` **ou** `$unset` — un
  responsable absent du message est effacé, jamais conservé. Pas de garde de version : même choix
  que le consommateur existant (ordre par partition `orgId` + marqueur `ProcessedEvent`).
- **D-683-3 — Fail-closed sur l'affectation inconnue.** Message sans `contributeursUserIds`
  (antérieur à STORY-683) ⇒ affectation **inconnue** ⇒ les deux champs `$unset` ⇒ aucun
  `TENANT_USER` n'accède au dossier jusqu'au prochain `dossier.updated` ; l'admin, si.
  Affectation **mal formée** (identifiant non hexadécimal-24, nombre, `null`, non-tableau) ⇒ le
  message est projeté **sans** affectation et journalisé (`warn`) — **pas** de poison pill : écarter
  le message laisserait l'affectation PRÉCÉDENTE en place (un collaborateur retiré garderait l'accès).
- **D-683-4 — `DossierScopeGuard` : la règle `filtrePortee` de dossier-service, relue et répliquée
  en FILTRE DE REQUÊTE** (`filtrePorteeDossier`) : `TENANT_ADMIN` ⇒ `{ dossierId, orgId }` (« Mon
  cabinet » compris) ; sinon ⇒ `{ dossierId, orgId, estLeCabinet: { $ne: true }, $or:
  [{ responsableUserId: moi }, { contributeursUserIds: moi }] }`. L'accès total exige
  `role === TENANT_ADMIN` (un `PLATFORM_ADMIN` porteur d'une org tombe dans la branche restreinte).
- **D-683-5 — Un seul refus : le `404 DOSSIER_INTROUVABLE` du garde.** Non affecté, « Mon
  cabinet » pour un collaborateur, affectation inconnue, `sub` non `ObjectId` : même corps qu'un
  dossier inexistant. (dossier-service rend `403 PORTEUR_NON_IDENTIFIABLE` pour un `sub`
  invalide ; ici le 404 unique évite un second code de refus.) Sur une route `@Roles(TENANT_ADMIN)`,
  un collaborateur reçoit le `403` du `RolesGuard`, **indépendant du dossier** (identique pour un
  dossier inexistant) : pas d'oracle.
- **D-683-6 — Fixture e2e** : le double du read-model évalue désormais le filtre **entier** avec la
  sémantique MongoDB (`test/utils/filtre-memoire.ts`, opérateur inconnu ⇒ lève). `DOSSIER_ACTIF`
  n'est plus « Mon cabinet » mais un dossier client affecté aux `sub` collaborateurs des batteries ;
  ajout de `DOSSIER_NON_AFFECTE`, `DOSSIER_CABINET`, `DOSSIER_SANS_AFFECTATION`. Deux jetons
  `TENANT_USER` de `bilan-referentiel.e2e-spec.ts` portaient un `sub` non `ObjectId` (`'u1'`,
  `'u2'`) : remplacés par un collaborateur affecté.
- **D-683-7 — La consolidation applique la portée au GROUPE entier (revue de sécurité S1,
  CWE-863).** Constat : un `TENANT_USER` affecté au seul dossier de la MÈRE lisait, via la
  consolidation, les liasses, soldes et raisons sociales des filiales qui ne lui sont pas
  affectées (`identitesDuPerimetre` → `raisonsSociales`, `LiassesGroupeRepository`, filtrés par
  organisation seulement). Décision utilisateur : un appelant non `TENANT_ADMIN` ne lit ni
  n'écrit RIEN dans la consolidation tant qu'une société du groupe est hors de sa portée au sens
  de `filtrePorteeDossier` ⇒ **le même `404 DOSSIER_INTROUVABLE`** que `DossierScopeGuard` (même
  fabrique `exceptionDossierIntrouvable()`, même corps). `TENANT_ADMIN` inchangé (aucune requête).
  - **Point de passage unique** : `PorteeGroupeGuard` (`bilan/consolidation/portee-groupe.guard.ts`),
    posé par `@PorteeGroupe()` sur la CLASSE des **9 contrôleurs** de consolidation (**40 routes**,
    39 ouvertes aux `TENANT_USER`). Il s'exécute après les gardes globaux (la mère est déjà gardée
    et posée dans le contexte) et AVANT le handler : aucune lecture de `LiassesGroupeRepository` ni
    de raison sociale pour un appelant refusé. Pourquoi un garde et non le chargement du périmètre
    dans les services : quatre services chargent le périmètre par six chemins (agrégat,
    rapprochement, déclarations, états et leur N-1, versions figées), et les routes de liste,
    d'appariement et de méthodes ne le chargent pas du tout — un contrôle dans les services en
    aurait oublié.
  - **Ensemble confronté (le plus large, fail-closed)** : toutes les sociétés que les arrêtés de
    la mère ont JAMAIS citées (retenues, exclues, en anomalie — toutes dates, toutes versions :
    `PerimetresArretesRepository.societesCitees`, agrégation en base) ∪ les sociétés des
    appariements de la mère, annulés compris (`AppariementsRepository.societesCitees`, `distinct`
    sous la cloison de la mère — un appariement peut viser tout dossier du cabinet) ∪ les sociétés
    DÉSIGNÉES par la requête (`:societeId`, `societeA/B.dossierId` d'un appariement déclaré ; une
    valeur mal formée est laissée au `400` de la validation, qui ne lit rien) ∪ la mère.
    Contrepartie assumée : un collaborateur doit être affecté à toute société ayant un jour fait
    partie du groupe, pas seulement à celles de l'exercice consulté (plus restrictif, jamais moins).
  - **Filtre de requête** : `DossiersDossierRepository.nombreDansLaPortee` COMPTE
    (`countDocuments`) les dossiers de l'ensemble qui satisfont `filtrePorteeDossiers` (la même
    règle que `filtrePorteeDossier`, critère `dossierId: { $in }`) ; le garde compare au nombre
    d'identifiants distincts. Absent du read-model, sans affectation connue, « Mon cabinet »,
    identifiant mal formé venu d'un read-model ⇒ refus.
  - **Preuve de couverture** : `portee-groupe.invariant.spec.ts` (balayage des contrôleurs du
    dossier `consolidation/` ET de tout contrôleur de `src/` dont le chemin contient
    `consolidation` : `GUARDS_METADATA` de classe ⊇ `PorteeGroupeGuard`) ;
    `test/consolidation-portee-groupe.e2e-spec.ts` (routes découvertes par métadonnées, services
    remplacés par un témoin `418` : un refus prouve qu'aucun service n'a été appelé).
  - Swagger : le `404` de chaque route de consolidation documente le refus de portée de groupe
    (`DESCRIPTION_404_PORTEE_GROUPE`).

## Notes

- Voir [[STORY-538]] (revue de sécurité), [[STORY-537]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-538.

**2026-10-02 — développement terminé (sous-agent), en attente de vérification docker, revue de
code et revue de sécurité.** En-tête et `sprint-status.yaml` volontairement non modifiés (la
session principale synchronise les statuts). Rien n'est poussé.

### Livré (branches `MNV-683`, non poussées)

| Dépôt | Commit | Objet |
|---|---|---|
| `dossier-service` | `8e9f6d2` | l'affectation (responsable, contributeurs) est publiée sur `dossier.*` |
| `bilan-service` | `c4ba9f2` | un collaborateur non affecté reçoit 404 sur toutes les routes `dossiers/:dossierId` |
| `bilan-service` | `5a7a1a9` | identifiant d'affectation numérique refusé, commentaire rectifié (mutant survivant M8) |

⚠️ Changement de contrat ⇒ **les deux PR s'intègrent ensemble** (producteur puis consommateur).

### Portes (exécutées sur l'état final des branches, `--maxWorkers=2`)

| Dépôt | Lint | Build | Unitaires + couverture | e2e |
|---|---|---|---|---|
| `dossier-service` | 0 warning | OK | 106 suites, **1707** tests verts · St 99.45 / Br 94.63 / Fn 98.55 / Li 99.56 | 9 suites, **350** verts |
| `bilan-service` | 0 warning | OK | 297 suites, **10908** verts (2 skipped) · St 99.4 / Br 97.01 / Fn 99.59 / Li 99.51 | 37 suites, **2900** verts |

Fichiers neufs/modifiés à 100 % (lignes, branches) : `affectation-publiee.util.ts`,
`portee-collaborateur.util.ts`, `dossier-scope.guard.ts`, `dossier-payload.util.ts`,
`dossier.projection.service.ts`, `dossier-dossier.schema.ts`.

### AC-3 — e2e `test/bilan-dossier-portee-collaborateur.e2e-spec.ts`

Les routes sont **découvertes** (balayage de `src/`, contrôleurs porteurs de
`@RequiresDossierScope()`, verbe + chemin lus dans les métadonnées Nest) : **21 contrôleurs,
94 routes** (84 ouvertes aux `TENANT_USER`, 10 réservées `TENANT_ADMIN`). Chaîne réelle (JWT RS256,
e-mail, rôles, accès Bilan, `DossierScopeGuard`) suivie d'un garde-témoin qui répond `418` : seule
une requête qui a franchi toute la chaîne le déclenche. Par route : `TENANT_USER` non affecté ⇒
refus identique au dossier inexistant (404 `DOSSIER_INTROUVABLE`, ou le 403 de rôle) ; « Mon
cabinet » et affectation inconnue ⇒ même refus ; `TENANT_USER` affecté ⇒ franchit ; `TENANT_ADMIN`
⇒ franchit (non affecté, « Mon cabinet », sans affectation).

### Table des mutations (chaque ligne appliquée, exécutée, restaurée — `git status` propre ensuite)

| # | Dépôt | Mutant | Résultat |
|---|---|---|---|
| P1 | dossier | `affectationPubliee({ ...dossier })` (spread du document) | 🔴 7 unitaires (dont « PATCH …/affectation publie le NOUVEAU responsable… », « la retombée d'un partant publie… ») |
| P2 | dossier | affectation remplacée par `contributeursUserIds: []` constant | 🔴 7 unitaires |
| P3 | dossier | `responsableUserId: null` publié quand absent | 🔴 4 unitaires (« « Mon cabinet » : AUCUN responsable publié », `affectationPubliee` ×2, devise STORY-499 updated) |
| M1 | bilan | `filtrePorteeDossier` rend `{ dossierId, orgId }` pour tout porteur (restriction retirée) | 🔴 **168 e2e** (84 « TENANT_USER NON affecté ⇒ refus IDENTIQUE… » + 84 « Mon cabinet / sans affectation ») + 11 unitaires |
| M2 | bilan | `estLeCabinet: { $ne: true }` retiré du filtre | 🔴 84 e2e (« Mon cabinet ») + 4 unitaires |
| M3 | bilan | garde : `findOne({ dossierId, orgId })` (filtre calculé mais ignoré) | 🔴 168 e2e + 4 unitaires |
| M4 | bilan | `TENANT_ADMIN` privé de l'accès total | 🔴 95 e2e (94 « TENANT_ADMIN ⇒ passe… » + 1 de `bilan-dossier-scope`) + 8 unitaires |
| M5 | bilan | affectation inconnue ⇒ aucun `$unset` | 🔴 2 unitaires (projection + vrai schéma) |
| M6 | bilan | `@Prop` de `responsableUserId` retirée | 🔴 2 unitaires (schéma réel : `$unset` / cast retirés au casting) |
| M7 | bilan | défaut implicite `[]` rétabli sur `contributeursUserIds` | 🔴 1 unitaire (document hydraté) |
| M8 | bilan | `Types.ObjectId.isValid` au lieu de `estObjectId` | ⚠️ **SURVIVANT** au 1er passage (le commentaire prêtait à `isValid` l'acceptation des chaînes de 12 caractères — faux sur la version embarquée) ⇒ cas numériques ajoutés (`isValid(1234) === true`), commit `5a7a1a9` ⇒ 🔴 2 unitaires |
| M9 | bilan | affectation mal formée ⇒ message écarté (poison pill) | 🔴 5 unitaires |
| M10 | bilan | `sub` non `ObjectId` non refusé | 🔴 5 unitaires |

Deux mutants qui ne compilaient pas (« Tests: 0 total » / « Test suite failed to run ») ont été
réécrits en mutants compilables avant d'être comptés (P2, M8, M9).

### D-683-7 — portée du groupe consolidé (revue de sécurité S1, 2026-10-02)

Commits `bilan-service` (branche `MNV-683`, NON poussés) : `a95da26` `MNV-683(revue)` (commentaires
C1/C2/C3) · `842c648` `MNV-683(securite)` (garde de portée du groupe).

Tests ciblés (`--maxWorkers=1`, machine partagée avec la vérification docker) : unitaires
`src/modules/bilan/consolidation` + `src/modules/read-models` (92 suites) ⇒ seuls rouges hors
périmètre : deux tests de **durée** (`agregation.regles` < 3 s mesuré 6 s, `homogeneisation.regles`
< 500 ms mesuré 8,4 s) sous une charge système de ~90 — règles pures non touchées ; les 4 specs de
contrat OpenAPI de contrôleurs ont été corrigées (`overrideGuard`, rôle hors accents graves) puis
relancées : vertes. `bilan.module.*.spec` (DI réelle du garde) : 3 suites vertes. e2e
`consolidation|portee-collaborateur|openapi` : **12 suites, 2297 tests verts**, dont
`consolidation-portee-groupe` (129). Lint 0 warning, `nest build` OK. ⚠️ Couverture globale
(`test:cov`) et suite complète NON lancées (consigne : machine partagée).

Table des mutations (commit AVANT mutation ; chaque mutant appliqué, vérifié par `git diff`,
exécuté sur les 3 specs du garde/filtre + l'e2e `consolidation-portee-groupe`, restauré —
`git status` propre ensuite). Scripts : `PROSPERA/tmp/verif-683-mutations/`.

| # | Mutant | Résultat |
|---|---|---|
| G1 | garde : `if (utilisateur) return true` | ⚠️ non compilable (`Role` inutilisé, TS6133) — non compté, réécrit en G1b |
| G1b | garde : `role === TENANT_ADMIN \|\| utilisateur` ⇒ tout porteur passe | 🔴 8 unitaires + **46 e2e** (39 « affecté à la mère mais PAS à une filiale ⇒ 404 » + 7 de l'ensemble) |
| G2 | `@PorteeGroupe()` retiré de `ConsolidationController` | 🔴 1 unitaire (invariant de balayage) + **15 e2e** (ses 10 routes + 5 cas de l'ensemble sur l'agrégat) |
| G3 / G4 | sociétés des arrêtés / des appariements retirées de l'ensemble | ⚠️ non compilables (variable inutilisée) — réécrits en G3b / G4b |
| G3b | `...arretees.slice(0, 0)` | 🔴 2 unitaires + **41 e2e** |
| G4b | `...appariees.slice(0, 0)` | 🔴 1 unitaire + 1 e2e (« société citée par un seul APPARIEMENT ⇒ 404 ») |
| G5 | sociétés désignées par la requête (`:societeId`, corps) ignorées | 🔴 1 unitaire + 2 e2e (`:societeId` hors portée ; appariement vers société hors portée) |
| G6 | refus seulement si `dansLaPortee === 0` (au lieu de `!== total`) | 🔴 1 unitaire + **46 e2e** |
| G7 | `filtrePorteeDossiers` sans portée | ⚠️ non compilable (paramètre inutilisé) — réécrit en G7b |
| G7b | `filtrePorteeDossiers` ⇒ `{ dossierId: { $in }, orgId }` pour tout porteur | 🔴 3 unitaires + **43 e2e** |
| G8 | contrôle `estObjectId` des identifiants lus retiré | 🔴 1 unitaire (« identifiant mal formé venu d'un read-model ⇒ 404 sans compter ») — e2e verte (aucun double ne sert d'identifiant mal formé) |

### AC-4 — relying parties au garde de portée à `orgId` seul (lecture seule, NON corrigées)

Relevé sur les checkouts principaux (`dev`) :

| Service | Fichier:ligne | Constat |
|---|---|---|
| `balance-service` (`7a42a5c`) | `src/modules/read-models/guards/dossier-scope.guard.ts:109` | `findOne({ dossierId, orgId })` — 31 contrôleurs `@RequiresDossierScope()` |
| `microfinance-service` (`954d065`) | `src/modules/read-models/guards/dossier-scope.guard.ts:100` | idem — 9 contrôleurs |
| `assurance-service` (`c030b85`) | `src/modules/read-models/guards/dossier-scope.guard.ts:100` | idem — 7 contrôleurs |
| `document-service` (`4d93bb2`) | `src/modules/read-models/dossier.gate.ts:136` | `DossierGate` : `findOne({ dossierId, orgId })` ; son docstring (l. 84-86) dit déjà qu'un `TENANT_USER` non affecté passe |
| `fiscal-service` (`4cc14d2`) | `src/application/depots/depots.service.ts:367-392` | **pas** de read-model : portée relue chez `dossier-service` (`exigerPortee` → `dossiers.lire`) — correcte, mais par appel synchrone ; son commentaire l. 375-378 (« bilan-service ne filtre que par organisation ») deviendra **périmé** à l'intégration de 683 |

Le contrat publie désormais l'affectation : chacun de ces services peut répliquer
`filtrePorteeDossier` par un ajout local (stories à créer).

### Reste à faire — vérification docker (session principale)

Stack neuve (`down -v`), `dossier-service` + `bilan-service` + infra, code des branches `MNV-683`.
Collections réelles : **`dossier_service.dossiers`**, **`dossier_service.outbox_events`**,
**`bilan_service.dossiers_dossier`** (read-model, `@Schema({ collection: 'dossiers_dossier' })`),
`bilan_service.processed_events`.

1. Jetons : une admin `A` (`TENANT_ADMIN`) et deux collaborateurs `U1`, `U2` (`TENANT_USER`) du même
   cabinet, e-mails vérifiés ; KYC approuvé + entitlement `bilan` actif pour l'org.
2. `A` crée un dossier client `D` (`POST /api/v1/dossiers`) ⇒ `outbox_events` : `dossier.created`
   avec `payload.responsableUserId = A` et `payload.contributeursUserIds = []` ;
   `dossiers_dossier` : `{ dossierId: D, responsableUserId: ObjectId(A), contributeursUserIds: [] }`.
3. `GET /api/v1/dossiers/D/bilan/etats` (route ouverte aux `TENANT_USER`) : `U1` ⇒ **404**
   `DOSSIER_INTROUVABLE` (corps identique à celui d'un dossier inexistant, hors `requestId`) ;
   `A` ⇒ 200.
4. `PATCH /api/v1/dossiers/D/affectation` `{ "contributeursUserIds": ["<U1>"] }` par `A` ⇒
   `dossier.updated` ; attendre la projection ⇒ `dossiers_dossier.contributeursUserIds == [U1]` ;
   `U1` ⇒ 200 sur la même route, `U2` ⇒ 404.
5. `PATCH …/affectation` `{ "responsableUserId": "<U2>", "contributeursUserIds": [] }` ⇒ `U1` ⇒
   **404** (retrait effectif), `U2` ⇒ 200.
6. « Mon cabinet » de l'org : `U1`/`U2` ⇒ 404, `A` ⇒ 200 ; `dossiers_dossier` du cabinet : pas de
   `responsableUserId`, `contributeursUserIds: []`.
7. **État antérieur fabriqué** (une vérif sur document neuf est vacante pour la migration) :
   `db.dossiers_dossier.updateOne({dossierId: D}, {$unset: {responsableUserId: '', contributeursUserIds: ''}})`
   ⇒ `U2` ⇒ 404, `A` ⇒ 200 ; puis un `PATCH …/affectation` ⇒ les champs reviennent, `U2` ⇒ 200.
8. Départ de `U2` (membership `SUSPENDED`) ⇒ `dossier.updated` (retombée) ⇒ `responsableUserId == A`
   dans `dossiers_dossier`, `U2` absent des contributeurs.
9. Contrôles : `db.dossiers_dossier.find({contributeursUserIds: {$type: 'string'}}).count() == 0`
   (identifiants castés en `ObjectId`) ; aucun document `dossiers_dossier` avec `affectation`
   (clé hors schéma) ; `processed_events` porte un marqueur par `eventId` projeté.
