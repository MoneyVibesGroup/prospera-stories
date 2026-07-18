# STORY-054 : Finalisation FR-005 — résolution de référentiel **liée à l'entitlement `ACTIVE`** + tampon « référentiel effectif » (hook EPIC-011) + résilience cache (NFR-009)

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service)
**Réf. architecture / PRD :** `architecture-bilan-service-2026-07-07.md` (§ReferentielLoader · §BilanModule (moteur) · §Décisions **B2/B5** · §Risques #2 [interface de référentiel à stabiliser] & #3 [intégrité/disponibilité de l'artefact]) · `prd-bilan-service-2026-07-10.md` **FR-005** (chargement du référentiel actif) & **NFR-009** (intégrité + cache tolérant à une indisponibilité transitoire) · décision **P7/D10** (moteur ⊥ référentiel)
**Priorité :** Must Have
**Story Points :** **2** (⬇️ **révisé 5 → 2 à la rédaction**, 2026-07-18 — voir *Cadrage* : le **mécanisme** FR-005 a déjà été livré par STORY-038 ; cette story n'en **finalise** que le delta honnête, pas un moteur complet)
**Statut :** Done
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-18
**Sprint :** 11
**Service :** bilan-service (`:3004`) — base Mongo dédiée `bilan_service`
**Couvre :** **FR-005** (AC-1 lien `ACTIVE`, AC-3 référentiel effectif estampillé — *hook inerte* tant qu'aucun état n'est produit) + **NFR-009** (AC-2 cache tolérant à une panne registre transitoire). **Dépend de STORY-038** (fournit `ReferentielLoader`, `ReferentielPackage`, `BilanEngineService`, registre, source embarquée, endpoint diagnostic).

---

## ⚠️ Cadrage — pourquoi cette story est **mince** (à lire avant tout)

STORY-054 était titrée *« Interface de référentiel + chargement via ReferentielLoader (résolution depuis read-model entitlement) — FR-005 »* et estimée **5 pts** dans le sprint-plan. **La lecture du code réel montre que STORY-038 (clôture EPIC-008) a déjà livré ce mécanisme.** Constat vérifié dans `bilan-service/src/modules/bilan/` :

| Attendu FR-005 / NFR-009 | Livré par STORY-038 ? | Reste pour STORY-054 |
|---|---|---|
| Résolution `(code,version)` depuis `OrgBilanEntitlement.referentiel` | ✅ `BilanEngineService.resolveReferentielForOrg` | — |
| Interface `ReferentielPackage` (data-only, découplage P7) | ✅ `referentiel-package.interface.ts` | — |
| Fetch artefact + **checksum sha256** + refus si altéré (AC-2 / B5) | ✅ `ReferentielLoader` + `ReferentielIntegrityError` | — |
| Cache + single-flight | ✅ `ReferentielLoader` (`Map` + `inflight`) | — |
| Registre multi-référentiel *ready* + source embarquée | ✅ `ReferentielRegistry` + `BundledArtifactSource` | — |
| Preuve bout-en-bout gardée | ✅ `GET /bilan/referentiel` (`@RequiresBilanAccess`) | — |
| **AC-1** — référentiel = celui de l'entitlement **`ACTIVE`** | ⚠️ **partiel** — l'engine lit `entitlement.referentiel` **sans vérifier `status`** ; il s'appuie sur le gate en amont | **① durcir l'engine** (invariant de domaine, pas seulement HTTP) |
| **AC-3** — référentiel effectif **enregistré dans chaque jeu d'états produit** | ❌ **bloqué** — aucun état produit avant EPIC-011 | **② poser le tampon en hook inerte** + l'exposer pour prouver le contrat |
| **NFR-009 AC-2** — cache tolérant à une **indisponibilité transitoire** du registre | ⚠️ **implicite** — le cache-first sert déjà un HIT sans I/O, mais **non prouvé** et une panne de `fetch` sur un MISS retombe en 500 opaque | **③ prouver + typer** la panne transitoire |

Le rôle que STORY-038 assignait à 054 (« *concrétise/étend `ReferentielPackage`* ») est **bloqué** : l'enrichissement de la sémantique comptable relève du **tech-spec Bilan (B8)**, qui **n'existe pas encore**. Le **portage du checksum via `entitlement.changed`** (loader lisant le checksum attendu depuis le read-model) exige une **évolution du producteur `platform-catalog-service`** → **cross-service, hors périmètre bilan-service**. Ces deux points restent en *Open questions*, comme dans STORY-038.

> **Conséquence assumée :** STORY-054 = **finalisation de 3 gaps réels**, pas une réécriture. C'est le sens de la révision **5 → 2 pts**. Le prochain vrai morceau de valeur d'EPIC-010 est **STORY-055** (FR-006, table de passage **appliquée** — que 038 a explicitement laissée « chargée mais non exécutée »).

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux que le **moteur** `bilan-service` **refuse de résoudre un référentiel pour une org dont l'entitlement `bilan` n'est pas `ACTIVE`** (invariant de domaine, indépendant du gate HTTP), qu'il **expose le référentiel effectif `(code, version, checksum)` sous une forme figée** destinée à estampiller chaque jeu d'états (EPIC-011), et qu'il **continue de servir un référentiel déjà chargé si le registre d'artefacts devient temporairement indisponible**,
afin qu'**aucun calcul ne s'appuie jamais sur un droit gelé/révoqué** (FR-005 AC-1), que **la traçabilité du référentiel utilisé soit garantie dès sa conception** (FR-005 AC-3) et qu'une **panne transitoire du registre ne bloque pas les orgs déjà servies** (NFR-009 AC-2).

---

## Description

### Contexte

STORY-038 a posé le **cœur du découplage P7** : le référentiel est une **donnée** (`ReferentielPackage`) résolue **par tenant** depuis le read-model d'entitlement, chargée + vérifiée (sha256) + mise en cache par le `ReferentielLoader`. Le `BilanEngineService.resolveReferentielForOrg(orgId)` orchestre déjà *résoudre + charger*. **Trois finitions** manquent pour que FR-005/NFR-009 soient tenues sans dépendre du seul chemin HTTP :

1. **Invariant `ACTIVE` dans le moteur (AC-1).** Aujourd'hui `resolveReferentielForOrg` lit `entitlement?.referentiel` **quel que soit** `entitlement.status`. Le gate `@RequiresBilanAccess` (STORY-037) bloque bien un accès HTTP non-`ACTIVE`, **mais** :
   - le read-model `OrgBilanEntitlement` **conserve** le champ `referentiel` même quand le statut passe `SUSPENDED`/`REVOKED` (état absolu : la projection ne fait `$unset referentiel` **que** si l'événement n'en porte pas — jamais sur une simple révocation) → un `resolveReferentielForOrg` appelé sur une org **révoquée** renverrait aujourd'hui un référentiel ;
   - EPIC-011 appellera le moteur depuis des chemins qui **ne doivent pas re-dériver le gate** (jobs, ré-génération). L'invariant FR-005 (« le référentiel utilisé est celui de l'entitlement **`ACTIVE`** ») doit donc être porté par **le moteur lui-même**, en **défense en profondeur**.

2. **Tampon « référentiel effectif » (AC-3) — hook inerte.** FR-005 AC-3 exige que « le référentiel effectif (code+version) soit **enregistré dans chaque jeu d'états produit** ». Aucun jeu d'états n'est produit avant EPIC-011. On **fige dès maintenant le contrat** du tampon (`{ code, version, checksum }`) et un **helper pur** qui le dérive du résultat de résolution, pour qu'EPIC-011 n'ait qu'à l'**incorporer** — sans code mort ni schéma prématuré. On l'**expose** sur le DTO diagnostic pour prouver le contrat de bout en bout **dès cette story**.

3. **Résilience du cache (NFR-009 AC-2).** Le `ReferentielLoader` sert déjà un **HIT** sans toucher la source (donc une org **déjà servie** survit à une panne du registre) — mais ce comportement n'est **pas prouvé par un test** et une panne de `ArtifactSource.fetch` sur un **MISS** (référentiel froid) remonte aujourd'hui en **500 opaque** (`BundledArtifactSource` lève un `Error` nu, non typé). On **type** l'indisponibilité transitoire (`ReferentielUnavailableError`) pour la distinguer d'un artefact *illisible*/*introuvable* et la mapper en réponse **retryable (503)**, et on **verrouille par test** la tolérance du cache.

### Frontière (rappel B8 / EPIC-011)

Cette story **ne touche pas** au domaine comptable. Elle **n'implémente ni n'étend** : la **sémantique** de `ReferentielPackage` (bloquée B8), l'**application** de la table de passage (FR-006 → STORY-055), la **production d'états** (EPIC-011), les **surcharges org** (FR-008 → STORY-058), le second référentiel **`sfd-bceao`** (STORY-057), le **portage du checksum via `entitlement.changed`** (évolution `catalog`, cross-service).

### Périmètre

**Dans le périmètre**

- **① Invariant `ACTIVE` dans `BilanEngineService.resolveReferentielForOrg` :**
  - après le `findOne`, **refuser** si `entitlement.status !== EntitlementStatus.ACTIVE` (org absente, `SUSPENDED` ou `REVOKED`) via une nouvelle erreur typée `ReferentielEntitlementInactiveError(organizationId, status?)` (extends `ReferentielError`) ;
  - l'ordre de contrôle reste : *statut `ACTIVE`* → *référentiel présent* (`ReferentielUnresolvedError`) → *chargement*. Aucune fuite de données d'une autre org (org inconnue traitée comme non-`ACTIVE`).
- **② Tampon référentiel effectif (hook inerte) :**
  - type `EffectiveReferentielStamp = { code: string; version: string; checksum: string }` (nouveau fichier `referentiel/referentiel-stamp.ts` **ou** exporté depuis l'interface, à trancher à l'implémentation) ;
  - helper **pur** `toEffectiveStamp(resolved: ResolvedReferentiel): EffectiveReferentielStamp` (aucune I/O) ;
  - `resolveReferentielForOrg` continue de renvoyer `ResolvedReferentiel` ; le `stamp` est **dérivable** de ce résultat. **Hook documenté** : EPIC-011 incorpore ce tampon dans chaque snapshot d'états (FR-005 AC-3). **Aucun schéma de snapshot créé ici.**
- **③ Résilience registre (NFR-009 AC-2) :**
  - `ReferentielUnavailableError(key, cause)` (extends `ReferentielError`) — indisponibilité **transitoire** de la source (distincte de `NotFound`/`Parse`/`Integrity`) ;
  - `BundledArtifactSource.fetch` (et le contrat du port `ArtifactSource`) : une **erreur d'I/O** de récupération est enveloppée en `ReferentielUnavailableError` (le loader la propage sans mise en cache) — un locator **invalide/hors périmètre** reste une erreur de programmation distincte ;
  - garantie **cache-first** conservée et **prouvée** : un référentiel **déjà en cache** est servi **sans** appeler la source, même si celle-ci échoue désormais.
- **Diagnostic gardé `GET /bilan/referentiel` (mise à jour minimale) :**
  - le DTO expose le **tampon effectif** (`stamp: { code, version, checksum }`) — preuve du contrat AC-3 ;
  - `toHttp` mappe les **deux** nouvelles erreurs : `ReferentielEntitlementInactiveError` → **403** `{ code: 'BILAN_NOT_ENTITLED' }` (aligné sur le vocabulaire du gate — défense en profondeur du **même** invariant) ; `ReferentielUnavailableError` → **503** `{ code: 'REFERENTIEL_UNAVAILABLE_TRANSIENT' }` (retryable). Les mappings existants (`Unresolved`→409, `Integrity`→502, `NotFound`/`Parse`→500) sont **inchangés**.
- **Tests** unitaires + e2e couvrant les 3 finitions (voir *Testing Strategy*) — seuils DoD tenus, **sans baisser** les seuils.
- **Doc** : commentaires de code (invariant `ACTIVE`, hook AC-3, seam AC-2) + Swagger du DTO.

**Hors périmètre (stories suivantes / autres services)**

- **Application** de la table de passage (compte→poste réel, comptes non mappés, traçabilité) → **FR-006 / STORY-055**.
- **Production d'états** & **incorporation réelle** du tampon dans un snapshot → **EPIC-011**. Ici : contrat + helper **inertes**.
- **Surcharges de mapping par org** → **FR-008 / STORY-058**.
- **Paquet `sfd-bceao`** → **STORY-057** (registre déjà *ready*).
- **Enrichissement sémantique de `ReferentielPackage`** → **tech-spec Bilan B8** (inexistant).
- **Portage `artifactUri`/`checksum` via `entitlement.changed`** (loader lisant le checksum depuis le read-model) → **cross-service `catalog`, différé** (seam déjà préservé par `ReferentielRegistry` + port `ArtifactSource`).
- **Registre distant réel (MinIO/OCI)** → différé (seam via `ArtifactSource`).

---

## User Flow

1. Un job/opération EPIC-011 (ou l'endpoint diagnostic) appelle `resolveReferentielForOrg(orgId)`.
2. Le moteur lit `OrgBilanEntitlement` de l'org.
   - **Pas d'entitlement / statut ≠ `ACTIVE`** → `ReferentielEntitlementInactiveError` → **403 BILAN_NOT_ENTITLED** (défense en profondeur). *Aucun référentiel résolu.*
   - **`ACTIVE` sans référentiel** → `ReferentielUnresolvedError` → **409 REFERENTIEL_UNRESOLVED** (inchangé).
   - **`ACTIVE` avec référentiel** → chargement via `ReferentielLoader`.
3. Chargement :
   - **HIT cache** → paquet vérifié servi **sans** I/O source (survit à une panne registre).
   - **MISS** → fetch → sha256 → cache. Fetch **en échec transitoire** → `ReferentielUnavailableError` → **503 retryable** ; hash non conforme → `ReferentielIntegrityError` → **502** (inchangé).
4. Le moteur dérive le **tampon effectif** `{ code, version, checksum }` — qu'EPIC-011 estampillera dans le jeu d'états produit (AC-3).

---

## Acceptance Criteria

- [ ] **FR-005 AC-1 —** `resolveReferentielForOrg` **refuse** de résoudre un référentiel si l'entitlement de l'org n'est pas `ACTIVE` (`SUSPENDED`, `REVOKED` ou absent), via `ReferentielEntitlementInactiveError`, **indépendamment** du gate HTTP.
- [ ] Un read-model `REVOKED` **conservant** un champ `referentiel` (état absolu) **ne produit aucun référentiel** (le gap réel est fermé).
- [ ] L'ordre de contrôle est : `ACTIVE` → référentiel présent → chargement ; une org inconnue est traitée comme non-`ACTIVE` (aucune fuite inter-org).
- [ ] **FR-005 AC-2 —** un paquet au checksum invalide reste refusé (`ReferentielIntegrityError`, **non-régression** de 038).
- [ ] **FR-005 AC-3 (hook) —** le **tampon effectif** `{ code, version, checksum }` est **dérivable** du résultat de résolution via un helper **pur**, **exposé** sur le DTO diagnostic ; le contrat est documenté comme *à incorporer par EPIC-011 dans chaque jeu d'états* (aucun schéma de snapshot créé ici).
- [ ] **NFR-009 AC-2 —** un référentiel **déjà chargé** est servi **sans** appeler `ArtifactSource` même quand celle-ci échoue ensuite (tolérance à une indisponibilité transitoire), **prouvé par test**.
- [ ] Une panne **transitoire** de `ArtifactSource.fetch` sur un référentiel froid remonte en `ReferentielUnavailableError` → **503** (retryable), **distincte** d'un artefact illisible/introuvable (500) ou altéré (502).
- [ ] `GET /bilan/referentiel` : 403 `BILAN_NOT_ENTITLED` sur entitlement non-`ACTIVE` ; 503 `REFERENTIEL_UNAVAILABLE_TRANSIENT` sur panne registre ; corps `stamp` présent en 200.
- [ ] **Périmètre respecté** : aucun calcul comptable, aucune table de passage appliquée, aucun schéma de snapshot, aucun paquet `sfd-bceao`, aucune modification de `platform-catalog-service`.
- [ ] **DoD** : lint 0 warning · build OK · unit + e2e verts · couverture ≥ **65/90/90/90** (jamais baissée) · Swagger à jour · endpoints documentés.

---

## Technical Notes

### Composants touchés (bilan-service uniquement)

- `modules/bilan/bilan-engine.service.ts` — **① garde `ACTIVE`** en tête de `resolveReferentielForOrg` ; **② helper `toEffectiveStamp`** (ou l'exposer près de `ResolvedReferentiel`).
- `modules/bilan/referentiel/referentiel.errors.ts` — **+ `ReferentielEntitlementInactiveError`**, **+ `ReferentielUnavailableError`** (extends `ReferentielError`).
- `modules/bilan/referentiel/referentiel-stamp.ts` *(nouveau, optionnel)* — type `EffectiveReferentielStamp` + `toEffectiveStamp`.
- `modules/bilan/referentiel/bundled-artifact-source.ts` — **③** enveloppe l'erreur d'I/O `readFile` en `ReferentielUnavailableError` (locator invalide/hors périmètre reste distinct).
- `modules/bilan/bilan-diagnostics.controller.ts` — `toHttp` mappe les 2 nouvelles erreurs (403 / 503) ; renvoie `stamp`.
- `modules/bilan/dto/referentiel-diagnostic.dto.ts` — **+ champ `stamp`** (`ApiProperty`).
- `modules/bilan/referentiel/referentiel-loader.service.ts` — **inchangé** (le cache-first sert déjà l'AC-2 ; on ne fait que le **prouver** et laisser remonter `ReferentielUnavailableError`).

### Points d'attention

- **Défense en profondeur, pas duplication du gate.** Le gate reste la **1ʳᵉ** barrière (HTTP) ; l'invariant moteur couvre les **autres** appelants (EPIC-011) et la **course** read-model `ACTIVE`-au-gate puis `REVOKED`-à-la-résolution. Ne pas retirer le gate.
- **État absolu du read-model.** Rappel : la projection (`entitlement.projection.service.ts`) ne `$unset` `referentiel` **que** si l'événement n'en porte pas → un `REVOKED` garde `referentiel`. C'est **pourquoi** la garde `status` est nécessaire côté moteur.
- **Anti-fuite.** Org inconnue = non-`ACTIVE` : même traitement, pas de distinction observable (aligné anti-énumération).
- **Sécurité de journalisation.** Les erreurs ne journalisent **jamais** le contenu de l'artefact (seulement `key`/hash), comportement 038 conservé.
- **Aucune transaction, aucune écriture** : lectures `findOne` + assets. `rs0` non requis.

### API (diagnostic, provisoire — inchangé sauf enrichissement)

- `GET /api/v1/bilan/referentiel` (`@RequiresBilanAccess` + `@Roles(TENANT_*)`) — **200** enrichi de `stamp: { code, version, checksum }` ; **403** `BILAN_NOT_ENTITLED` (non-`ACTIVE`) ; **503** `REFERENTIEL_UNAVAILABLE_TRANSIENT` (panne registre) ; 409/502/500 inchangés.

---

## Dependencies

**Stories prérequises :**
- **STORY-038** (EPIC-008) — fournit `ReferentielLoader`, `ReferentielPackage`, `BilanEngineService`, `ReferentielRegistry`, `BundledArtifactSource`, endpoint diagnostic. **Toute cette story en est la finalisation.**
- STORY-036 (read-model `OrgBilanEntitlement`) · STORY-037 (gate `@RequiresBilanAccess`).

**Débloque :**
- **STORY-055** (FR-006, table de passage appliquée) consomme le référentiel résolu **fiable** (`ACTIVE`) et le tampon effectif.
- **EPIC-011** incorpore le tampon effectif dans chaque jeu d'états (ferme réellement AC-3).

**Dépendances externes :** aucune (artefacts embarqués ; MinIO/registre distant différés).

---

## Definition of Done

- [ ] Code implémenté sur branche `MNV-054` (base `dev`, rebase — jamais merge).
- [ ] **Lint 0 warning** (`eslint … --max-warnings 0`) · **build OK** (`nest build`).
- [ ] Tests unitaires : garde `ACTIVE` (ACTIVE/SUSPENDED/REVOKED/absent), helper `toEffectiveStamp`, tolérance cache à une source défaillante, mapping des 2 nouvelles erreurs.
- [ ] Tests e2e : `GET /bilan/referentiel` → 200 (`stamp` présent) · 403 non-`ACTIVE` · 503 panne registre.
- [ ] **Couverture ≥ 65/90/90/90** (seuils **jamais** baissés).
- [ ] **Non-régression** : AC-2 checksum (038), résolution nominale, hit/miss cache.
- [ ] Swagger `/api/docs` à jour (DTO `stamp`, réponses 403/503).
- [ ] Statut synchronisé **aux 3 endroits** (en-tête story · `sprint-status.yaml` · *Progress Tracking*).
- [ ] **Vérif docker réelle** (voir *Progress Tracking*) : le service écrit peu, mais l'invariant `ACTIVE` doit être **prouvé sur stack vivante** (octroi `ACTIVE` → 200 ; révocation `entitlement.changed` → 403 sans passer par le gate seul) — pas seulement en mock.
- [ ] `/code-review` passé ; PR `MNV-054` intégrée à `dev` en **Rebase and merge** + `--delete-branch`.

---

## Story Points Breakdown

- **Backend :** 1,5 pt (garde `ACTIVE` + 2 erreurs typées + helper tampon + enveloppe I/O source + mapping controller/DTO).
- **Tests :** 0,5 pt (unit + e2e des 3 finitions ; le socle 038 est déjà couvert).
- **Total : 2 pts.**

**Rationale :** le **mécanisme** FR-005 (résolution + fetch + checksum + cache + interface + diagnostic) a été **livré par STORY-038**. Cette story ne finalise que **3 gaps réels et bornés** — un **invariant de domaine** (`ACTIVE`, la seule vraie valeur/risque), un **hook inerte** (tampon AC-3, bloqué par EPIC-011) et une **finition de robustesse** (NFR-009 AC-2). Rien à réécrire, aucun domaine comptable. D'où **5 → 2**. *(Ce mouvement à la baisse est l'exact symétrique des révisions 5→8 des stories RBAC : estimer **à la lecture du code**, pas au plan — ici le code avait déjà fait le gros.)*

---

## Additional Notes

- **Open questions (héritées de 038, toujours ouvertes) :** (a) portage `artifactUri`/`checksum` dans `entitlement.changed` → le loader lira le checksum attendu depuis le read-model (évolution `platform-catalog-service`, cross-service) ; (b) enrichissement sémantique de `ReferentielPackage` par le **tech-spec Bilan B8** (inexistant). Les **deux** restent hors périmètre ; les seams (port `ArtifactSource`, `ReferentielRegistry`, interface data-only) sont déjà en place.
- **Non-optionnalité de l'AC-1.** Sans la garde `ACTIVE` côté moteur, une org **révoquée** conserverait un référentiel exploitable dès qu'un appelant EPIC-011 court-circuite le gate — c'est le **vrai** gap que ferme cette story ; les deux autres items sont un hook et une finition.

---

## Progress Tracking

**Status History :**
- 2026-07-18 : Créée (`/bmad:create-story`) par vivian — re-cadrée **5 → 2 pts** après lecture du code réel (STORY-038 a déjà livré le mécanisme FR-005). Statut → **defined**.
- 2026-07-18 : Développée (`/bmad:dev-story`) sur branche `MNV-054`. Lint 0 · build OK · **136 unit** (23 suites) + **24 e2e** (4 suites) verts · couverture globale **98.63 / 85.62 / 98 / 98.51** > seuils 65/90/90/90 ; module `modules/bilan` 100 % (branches incl.), `referentiel-stamp.ts`/`referentiel.errors.ts` 100 %.
- 2026-07-18 : `/code-review high` (1 constat *plausible/low* accepté : 503 pour artefact embarqué manquant = seam registre distant documenté) → **PR #5** `MNV-054` → `dev` **Rebase and merge** + branche supprimée. Statut → **done**.

**Vérification docker réelle — faite le 2026-07-18 (stack repartie de ZÉRO : `down -v` → `up -d`, 8/8 services healthy, mongodb+kafka up).**
Protocole : org réelle créée sur l'IdP (`register` + `emailVerifiedAt` + `login` → **JWT RS256 réel**, `org=6a5b…0620`, `emailVerified:true`, `aud` contient `bilan-service`) ; read-models `bilan_service` semés directement (`orgkycstatuses` APPROVED + `orgbilanentitlements` ACTIVE, référentiel `syscohada-revise@2.1`).
- [x] **200 + stamp** : `GET /bilan/referentiel` → 200, corps `stamp:{code:"syscohada-revise",version:"2.1",checksum:"4ced8658…ef042"}` == `checksum` du paquet (sha256 **réel** de l'artefact embarqué), `postesCount:163`, `mappingCount:99`, `integrity:"verified"`, `cache:"miss"` puis **`hit`** au 2ᵉ appel (FR-005 AC-3 + AC-2 cache).
- [x] **REVOKED → 403** : passage `status:REVOKED` **en conservant le champ `referentiel`** (vérifié en base : « ref encore présent ? true » — le gap réel) → **403 `BILAN_NOT_ENTITLED`**. ⚠️ **Honnêteté** : à ce niveau **HTTP**, c'est **le gate** `@RequiresBilanAccess` qui rend le 403 (message « …n'a pas d'entitlement Bilan actif »), **avant** le moteur. L'**invariant moteur** (STORY-054, pour les appelants **hors HTTP** d'EPIC-011) est prouvé par les **tests unitaires** `bilan-engine.service.spec.ts` (REVOKED/SUSPENDED/absent avec `referentiel` présent → `ReferentielEntitlementInactiveError`, aucun `load`), non masquables par le gate.
- [x] **SUSPENDED → 403** ; **retour ACTIVE → 200** (bascule d'état vivante).
- [x] **NFR-009 AC-2 tolérance cache** (preuve live) : artefact **supprimé du conteneur** (`mv …/assets/syscohada-revise-2.1.json .bak`) → appel suivant **toujours 200 `cache:hit`** (le référentiel déjà chargé survit à l'indisponibilité du registre) ; artefact restauré. *(Le chemin **froid → 503** est prouvé par e2e `bilan-referentiel.e2e-spec.ts` « registre indisponible → 503 » + unit loader ; non rejoué en docker car proportionné.)*
- [x] **Non-régression** : `/health` **200 up** sur auth/kyc/catalog/bilan/balance ; 8/8 conteneurs healthy simultanément. Checksum falsifié → refus (AC-2 038, non-régression couverte par le loader spec).

**Actual Effort :** 2 pts (conforme à l'estimation révisée).

**Notes d'implémentation :**
- **①** `BilanEngineService.resolveReferentielForOrg` : garde `status === ACTIVE` **avant** la résolution → `ReferentielEntitlementInactiveError` (org absente/SUSPENDED/REVOKED). Défense en profondeur du gate ; le vrai bénéficiaire est EPIC-011 (appels hors HTTP).
- **②** `referentiel/referentiel-stamp.ts` : type `EffectiveReferentielStamp` + helper **pur** `toEffectiveStamp` (hook FR-005 AC-3) ; exposé sur le DTO diagnostic. Aucun schéma de snapshot (EPIC-011).
- **③** `ReferentielUnavailableError` : `BundledArtifactSource` enveloppe une **panne d'I/O** de récupération (distincte du locator invalide → `Error` nu/500) → contrôleur **503 `REFERENTIEL_UNAVAILABLE_TRANSIENT`**. Loader **inchangé** (cache-first sert déjà l'AC-2, désormais **prouvé** par test).
- Fichiers : `referentiel.errors.ts` (+2 erreurs), `referentiel-stamp.ts` (nouveau), `bilan-engine.service.ts`, `bundled-artifact-source.ts`, `bilan-diagnostics.controller.ts`, `dto/referentiel-diagnostic.dto.ts` + specs (engine/controller/bundled/loader/stamp) + e2e.

---

**Story créée avec BMAD Method v6 — Phase 4 (Implementation Planning). Re-cadrage honnête : finalisation d'un mécanisme déjà livré (STORY-038), pas une réimplémentation.**
