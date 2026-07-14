# STORY-038 : `ReferentielLoader` (artefact + checksum sha256 + cache) + interface de référentiel + moteur squelette — clôture EPIC-008

**Epic :** EPIC-008 — bilan-service (squelette d'intégration : scaffold + read-models entitlement/KYC + gate `@RequiresBilanAccess` + **`ReferentielLoader`/moteur**)
**Réf. architecture :** `architecture-bilan-service-2026-07-07.md` (v1.0, §Composants → **BilanModule (moteur)** [BilanEngineService paramétré + **interface de référentiel**] · **§ReferentielLoader** [résout `(code, version)` → télécharge artefact → **vérifie checksum sha256** → **cache** ; refuse si hash invalide — **B5**] · §Flux principal points 4-6 · §Architecture des données [«Paquet de données du référentiel → registre d'artefacts → téléchargé + vérifié, jamais édité»] · §Décisions **B2** [version de code ⊥ référentiel], **B5** [référentiel téléchargé + vérifié] · §Risques 2-3 [interface de référentiel à stabiliser ; intégrité/disponibilité de l'artefact]) · `prd-bilan-service-2026-07-10.md` **FR-005** (chargement du référentiel actif) & **NFR-009** (intégrité des artefacts, checksum sha256) · décision **P7/D10** (moteur paramétré par référentiel, 2 axes orthogonaux)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ✅ Done — implémentée + **vérifiée docker bout-en-bout** 2026-07-14. `BilanModule` : `ReferentielLoader` (résout `(code,version)` depuis `OrgBilanEntitlement` → artefact embarqué → **sha256** → cache/single-flight → **refus si hash invalide**, B5/NFR-009) + interface `ReferentielPackage` (data-only, découplage P7, extensible B8) + `BilanEngineService` **squelette** (résout+charge, **aucun calcul comptable**) + endpoint diagnostic gardé provisoire `GET /bilan/referentiel` (`@RequiresBilanAccess`). Source d'artefact **embarquée** (amorces consolidées → `syscohada-revise@2.1`, 163 postes / 99 mappings) ; MinIO différé (seam via port `ArtifactSource`). lint 0, **128 unit (cov 98.6/85.4/97.9/98.4) + 23 e2e** verts. Vérif docker via **pipeline catalog→bilan réel**. **CLÔT EPIC-008.** Voir §Revue & validation.
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-14
**Sprint :** 8
**Service :** bilan-service (`:3004`) — base Mongo dédiée `bilan_service`
**Couvre :** **FR-005** (chargement du référentiel actif de l'org) au **niveau squelette** + **NFR-009** (intégrité checksum sha256) + **B2/B5** — pose le **cœur du découplage P7** (le référentiel est une **donnée injectée**, pas une branche de code) sans implémenter le domaine comptable (états financiers, calculs = EPIC-009+ / tech-spec Bilan **B8**).

> **4ᵉ et dernière story d'EPIC-008 — elle CLÔT le squelette d'intégration de `bilan-service`.** STORY-035 a livré un service démarrable (relying party RS256/JWKS, `/health`, `whoami`). STORY-036 a livré les **read-models** (`OrgBilanEntitlement` ← `entitlement.changed`, `OrgKycStatus` ← `kyc.status.changed`). STORY-037 a livré le **gate** `@RequiresBilanAccess` (emailVerified + KYC APPROVED + entitlement ACTIVE). Cette story pose le **dernier maillon du squelette** : le **`ReferentielLoader`** (résout le référentiel `(code, version)` de l'org depuis le read-model d'entitlement → récupère l'**artefact** → **vérifie son checksum sha256** → le **met en cache** → **refuse** un paquet altéré), une **interface de référentiel** (`ReferentielPackage`) qui découple le moteur du référentiel concret, et un **`BilanEngineService` squelette** paramétré par le référentiel chargé. **Le domaine comptable reste hors périmètre** (aucun calcul d'état financier, aucune table de passage *appliquée*, aucun import de balance) : cette story livre **le mécanisme de chargement + le contrat d'interface + le moteur vide**, prouvés par un **endpoint diagnostic gardé provisoire** — comme `whoami`/`bilan-access` prouvent leurs câblages respectifs. À l'issue de STORY-038, EPIC-008 est **clos** et EPIC-009 (import de balance, FR-001) peut démarrer sur un socle complet.

---

## User Story

En tant qu'**équipe plateforme PROSPERA**,
je veux que `bilan-service` **résolve** le référentiel comptable attribué à une organisation (`syscohada-revise@x.y` / `sfd-bceao@x.y`, lu dans le read-model d'entitlement), **télécharge** le paquet de référentiel correspondant, **vérifie son intégrité par checksum sha256**, le **mette en cache** et l'**expose au moteur** via une **interface stable** — en **refusant** tout paquet dont le hash ne correspond pas,
afin que le **moteur de calcul** (à venir, EPIC-009+) puisse être **paramétré par référentiel sans fork de code** (une même version de code servant SYSCOHADA révisé et SFD-BCEAO par tenant — décision **P7**), et qu'**aucun état financier ne soit jamais produit sur un référentiel non intègre** (**NFR-009/B5**).

---

## Description

### Contexte

L'architecture de `bilan-service` repose sur **deux axes orthogonaux** (décision **P7/D10**) : la **version de code** (le moteur, en semver) et le **référentiel comptable** (le *paquet de données* : plan de comptes, table de passage comptes→postes, règles de présentation — SYSCOHADA révisé, SFD-BCEAO…). Une **même** version de code sert **plusieurs** référentiels, **chargés par tenant** depuis le read-model d'entitlement : une IMF sur `sfd-bceao@1.3` et un cabinet sur `syscohada-revise@2.1` tournent sur la **même** instance `bilan-v2`, **sans fork** (**B2**).

Pour que cela fonctionne, il faut un composant qui, pour une org donnée :

1. **résout** le couple `(code, version)` du référentiel actif de l'org (lu dans le read-model **`OrgBilanEntitlement.referentiel`**, alimenté par `entitlement.changed`, STORY-036) ;
2. **récupère** l'**artefact** du référentiel (le paquet de données) auprès d'un **registre d'artefacts** (le paquet **n'est pas** dupliqué dans `catalog-service` ni édité par `bilan-service` — il est **téléchargé + vérifié**, décision **B5**) ;
3. **vérifie l'intégrité** de l'artefact par **checksum sha256** — un paquet altéré fausserait **tous** les états financiers (**NFR-009**) — et **refuse** tout hash non conforme ;
4. **met en cache** le paquet parsé (chemin chaud : le moteur le charge à chaque calcul ; **recharge** seulement si le référentiel de l'org **change**) ;
5. **expose** le paquet au moteur via une **interface de référentiel** (`ReferentielPackage`) qui **découple** le moteur du référentiel concret — c'est le **cœur du découplage P7** que l'architecture demande de **stabiliser tôt** (§Risques #2).

C'est l'objet du **`ReferentielLoader`**, du contrat **`ReferentielPackage`**, et d'un **`BilanEngineService` squelette** (le moteur réel — calcul des états — relève d'EPIC-011 / tech-spec Bilan, **B8**).

> **Frontière squelette ↔ domaine (rappel B8).** Cette story pose le **mécanisme** (charger + vérifier + cacher + interface + moteur vide). Elle **n'implémente aucun** : calcul d'état financier (Bilan/Compte de résultat/TFT/notes — EPIC-011), **application** de la table de passage comptes→postes (FR-006 — EPIC-010/STORY-055), import de balance (FR-001 — EPIC-009), surcharge de mapping par org (FR-008 — EPIC-010/STORY-058). Le contrat `ReferentielPackage` est **façonné d'après les amorces** (`docs/referentiels/`) mais **volontairement minimal et extensible** ; sa sémantique comptable fine sera figée par le tech-spec Bilan (**B8**), qui pourra l'enrichir sans casser le loader.

### Périmètre

**Dans le périmètre**

- **Nouveau `BilanModule`** (`src/modules/bilan/`) hébergeant le moteur squelette, le loader, le registre, la source d'artefacts et l'interface de référentiel. Importe les exports Mongoose de `ReadModelsModule` (lecture de `OrgBilanEntitlement`).
- **Interface de référentiel `ReferentielPackage`** (`modules/bilan/referentiel/referentiel-package.interface.ts`) — contrat **stable** découplant le moteur du référentiel concret. Façonné d'après les amorces (`docs/referentiels/`) :
  - `meta: { code: string; version: string; libelle: string; checksum: string; date?: string }` ;
  - `postes: PosteEtat[]` — structure des états (`{ etat, code, libelle, note? }`) ;
  - `tableDePassage: MappingRule[]` — règles de rattachement (`{ etat, poste, libelle, type: 'detail' | 'total', regle, comptesSyscohada: string[] }`) ;
  - `regles: Record<string, string>` — règles de présentation/calcul (`NET_ACTIF`, `SOLDE_CREDITEUR`, `CHARGE`, `PRODUIT`, ventilation classes 4/5…) ;
  - `paquetFiscal?: Record<string, unknown>` — **optionnel** (taux/règles fiscales, non requis par le moteur d'états).
  - **Aucune logique** dans l'interface : ce sont des **données**. Le contrat est documenté comme *stabilisé au niveau squelette*, extensible par B8.
- **Port `ArtifactSource`** (`modules/bilan/referentiel/artifact-source.ts`) — abstraction du **registre d'artefacts** : `fetch(locator: string): Promise<Buffer>`. Calqué sur le patron d'abstraction `OcrProvider` de `document-service` (STORY-041). **Implémentation `BundledArtifactSource`** pour le squelette : lit les artefacts **embarqués** dans l'image (`assets/referentiels/*.json`, copiés de `docs/referentiels/`). **MinIO/OCI différé** (voir *Décision de conception : source d'artefact*).
- **`ReferentielRegistry`** (`modules/bilan/referentiel/referentiel-registry.ts`) — **manifeste embarqué** des paquets disponibles : `code@version → { locator, checksum: sha256Attendu }`. Méthode `resolve(code, version): RegistryEntry | null`. **Seul `syscohada-revise` est packagé** dans cette story (référentiel **pilote** MV) ; l'ajout de `sfd-bceao` est **STORY-057** (EPIC-010). Le registre est **piloté par données** → multi-référentiel *ready* sans code additionnel.
- **`ReferentielLoader`** (`modules/bilan/referentiel/referentiel-loader.service.ts`) — orchestration :
  1. `resolve(code, version)` via `ReferentielRegistry` → introuvable ⇒ `ReferentielNotFoundError` ;
  2. `ArtifactSource.fetch(locator)` → bytes bruts ;
  3. **calcul sha256** des bytes (`crypto.createHash('sha256')`) et **comparaison** au `checksum` attendu du registre → non conforme ⇒ **`ReferentielIntegrityError`** (refus, **B5/NFR-009**) ;
  4. **parse** JSON → `ReferentielPackage` (avec `meta.checksum` = hash vérifié) ;
  5. **cache** en mémoire keyé `code@version` (Map) ; **hit** ⇒ retour immédiat sans re-fetch/re-vérif ; **recharge** si la clé change (nouveau référentiel de l'org). **Single-flight** : deux chargements concurrents de la même clé ne dédoublent pas le fetch (partage de la Promise en cours).
- **`BilanEngineService` squelette** (`modules/bilan/bilan-engine.service.ts`) — `resolveReferentielForOrg(orgId): Promise<ResolvedReferentiel>` : lit `OrgBilanEntitlement` de l'org (read-model) → si `referentiel` présent, appelle `ReferentielLoader.load({ code, version })` → renvoie `{ referentiel: { code, version }, package, cache: 'hit' | 'miss' }`. **Aucun calcul comptable** : le moteur ne fait que *résoudre + charger*. Un entitlement **sans** `referentiel` ⇒ `ReferentielUnresolvedError` (état explicite, pas un 500).
- **Endpoint diagnostic gardé provisoire** — `GET /bilan/referentiel` (contrôleur `bilan/bilan-diagnostics.controller.ts`), décoré `@RequiresBilanAccess()` **+** `@Roles(TENANT_ADMIN, TENANT_USER)` : résout+charge le référentiel de l'org appelante et renvoie **200** `{ referentiel: { code, version }, checksum, libelle, postesCount, mappingCount, integrity: 'verified', cache: 'hit' | 'miss' }`. **Provisoire** (comme `whoami`/`bilan-access`) : remplacé par les vrais contrôleurs Bilan (EPIC-009+). Cible **e2e + docker** prouvant le loader de bout en bout (résolution → intégrité → cache) **derrière le gate** STORY-037.
- **Artefacts embarqués** — copie des amorces (`postes-syscohada-guidef-togo.json`, `table-de-passage-syscohada.json`, `paquet-fiscal-togo-2026.json`) dans `assets/referentiels/` du service, incluses dans le build (`nest-cli.json` `assets` + `Dockerfile`). Leur **sha256 est enregistré** dans le manifeste du `ReferentielRegistry`.
- **Tests unitaires exhaustifs** du loader/registre/moteur (checksum OK, **mismatch → refus**, cache **hit/miss**, **recharge** sur changement de référentiel, single-flight, référentiel introuvable, entitlement sans référentiel) + **e2e** de l'endpoint diagnostic (200 avec méta + 403 gardé) + **vérif docker bout-en-bout**.

**Hors périmètre (stories suivantes / autres services)**

- **Calcul des états financiers** (Bilan actif/passif, Compte de résultat, TFT/TAFIRE, notes annexes) → **EPIC-011** (FR-009→013), tech-spec Bilan **B8**. Le moteur reste **squelette** : il charge le référentiel, il ne l'**applique** pas.
- **Application** de la table de passage (rattachement réel compte→poste, comptes non reconnus, traçabilité) → **FR-006 / EPIC-010** (STORY-055). Ici la table de passage est **chargée et exposée**, pas exécutée.
- **Import de balance** (Excel/CSV, contrôle d'équilibre, comparatif N-1) → **EPIC-009** (FR-001→004, STORY-050→053).
- **Second référentiel `sfd-bceao`** → **STORY-057** (EPIC-010). Le registre est *ready*, seul `syscohada-revise` est packagé.
- **Surcharges de mapping par org** (`(orgId, compte) → poste`) → **FR-008 / STORY-058**.
- **Registre d'artefacts distant réel** (MinIO/OCI) + **portage du checksum dans l'événement/read-model d'entitlement** (producteur `catalog`) → **différé** (voir *Décision de conception*). Le squelette utilise une **source embarquée** + un **checksum de manifeste**, avec un **seam** prévu pour bascule sans refonte.
- **Maintien des read-models** (consumers/projections) : déjà livré **STORY-036** — cette story **lit** `OrgBilanEntitlement`, ne l'écrit pas.

### Flux (résolution → intégrité → cache d'un référentiel)

1. Une org `O` possède un entitlement `bilan` `ACTIVE` avec `referentiel = { code: "syscohada-revise", version: "2.1" }` (projeté par STORY-036 depuis `entitlement.changed`).
2. Un utilisateur de `O` (`TENANT_ADMIN`, JWT RS256) appelle `GET /bilan/referentiel`. La **chaîne de guards** (STORY-035/037) passe : `Jwt → EmailVerified → Roles → BilanAccess` (KYC APPROVED + entitlement ACTIVE) ✓.
3. `BilanEngineService.resolveReferentielForOrg(O)` lit `OrgBilanEntitlement` → `referentiel = syscohada-revise@2.1`.
4. `ReferentielLoader.load({ code: "syscohada-revise", version: "2.1" })` : `ReferentielRegistry.resolve` → `{ locator, checksum }` ✓ → `ArtifactSource.fetch(locator)` → bytes → **sha256 recalculé == checksum attendu** ✓ → parse → `ReferentielPackage` → **mis en cache** (`syscohada-revise@2.1`), `cache: 'miss'`.
5. Réponse **200** `{ referentiel: {code:"syscohada-revise", version:"2.1"}, checksum, postesCount: N, mappingCount: M, integrity: 'verified', cache: 'miss' }`.
6. **Deuxième appel** de `O` : `ReferentielLoader` trouve la clé en cache → **`cache: 'hit'`**, aucun re-fetch/re-vérif.
7. **Intégrité violée** (test/injection) : l'artefact ne correspond pas au `checksum` du manifeste → **`ReferentielIntegrityError`** → **aucun `ReferentielPackage` retourné**, aucun calcul possible (**refus B5**), mappé en **502/500 explicite** (« référentiel non intègre »).
8. **Changement de référentiel** : `O` migre sur `syscohada-revise@3.0` (nouvel `entitlement.changed` → read-model) → l'appel suivant **rate** la clé `2.1`, charge et cache `3.0` (les deux clés coexistent en cache).
9. **Entitlement sans référentiel** : `OrgBilanEntitlement.referentiel` absent → `ReferentielUnresolvedError` → réponse explicite (« aucun référentiel attribué »), jamais un 500 non géré.

---

## Acceptance Criteria

- [ ] **Interface `ReferentielPackage`** (`modules/bilan/referentiel/referentiel-package.interface.ts`) : types `ReferentielPackage`, `PosteEtat`, `MappingRule`, `ReferentielRef ({ code, version })` exportés. **Données pures** (aucune méthode). Champs : `meta { code, version, libelle, checksum, date? }`, `postes[]`, `tableDePassage[]`, `regles`, `paquetFiscal?`. Documentée « stabilisée au niveau squelette, extensible par tech-spec Bilan (B8) ».
- [ ] **Port `ArtifactSource`** : interface `fetch(locator: string): Promise<Buffer>`. **`BundledArtifactSource`** lit les artefacts embarqués (`assets/referentiels/`) ; un `locator` inconnu ⇒ erreur (pas de `Buffer` vide silencieux).
- [ ] **`ReferentielRegistry`** : manifeste embarqué `code@version → { locator, checksum }`. `resolve(code, version)` renvoie l'entrée ou `null`. **`syscohada-revise@<version pilote>`** présent (postes + table de passage + paquet fiscal), `sfd-bceao` **absent** (STORY-057). Le `checksum` du manifeste = **sha256 réel** des artefacts embarqués (calculé au build/commit, non un placeholder).
- [ ] **`ReferentielLoader.load(ref)`** :
  - résout via le registre ; **introuvable ⇒ `ReferentielNotFoundError`** (typée) ;
  - `fetch` l'artefact ; **calcule sha256** et **compare** au checksum attendu ; **mismatch ⇒ `ReferentielIntegrityError`** (typée) — **aucun `ReferentielPackage` retourné** ;
  - parse en `ReferentielPackage` avec `meta.checksum` = hash vérifié ;
  - **cache** keyé `code@version` : 2ᵉ `load` de la même clé ⇒ **hit** (aucun `fetch`, aucun re-hash) ; clé différente ⇒ **miss** + chargement ; les clés coexistent.
  - **single-flight** : deux `load` concurrents de la même clé ⇒ **un seul** `fetch` (Promise partagée).
- [ ] **Refus d'un paquet altéré (B5/NFR-009)** : un artefact dont le sha256 ne correspond pas au manifeste **n'est jamais** parsé/mis en cache/retourné ; l'erreur est **typée et journalisée** (sans fuiter le contenu).
- [ ] **`BilanEngineService.resolveReferentielForOrg(orgId)`** : lit `OrgBilanEntitlement` (read-model) → `referentiel` présent ⇒ `load` + `{ referentiel, package, cache }` ; `referentiel` **absent** ⇒ **`ReferentielUnresolvedError`** (jamais un throw non géré / 500). **Aucun calcul comptable** (le moteur ne fait que résoudre+charger).
- [ ] **Endpoint diagnostic gardé** `GET /bilan/referentiel` : `@RequiresBilanAccess()` + `@Roles(TENANT_ADMIN, TENANT_USER)` ⇒ **200** `{ referentiel: { code, version }, checksum, libelle, postesCount, mappingCount, integrity: 'verified', cache: 'hit' | 'miss' }` pour une org dûment habilitée. Documenté Swagger (`@ApiOkResponse` + `@ApiForbiddenResponse`). **Provisoire** (remplacé par les contrôleurs Bilan réels).
- [ ] **Gate respecté** : sans KYC `APPROVED` ou sans entitlement `ACTIVE` ⇒ **403** (`KYC_NOT_APPROVED` / `BILAN_NOT_ENTITLED`, STORY-037), l'endpoint ne charge **pas** le référentiel.
- [ ] **`BilanModule`** enregistré dans `AppModule`, importe les exports Mongoose de `ReadModelsModule` (lecture `OrgBilanEntitlement`) — **aucun cycle**, **aucune ré-`forFeature`** des read-models.
- [ ] **Aucune écriture Mongo, aucun événement Kafka** produit/consommé par cette story (le moteur **lit** un read-model ; le loader lit des **artefacts**). **`/health` inchangé** (200 ; mongo+kafka, **ni** minio **ni** redis ajoutés).
- [ ] **Config** : `REFERENTIEL_SOURCE` (défaut `bundled`) + éventuel `REFERENTIEL_CACHE_MAX` — **optionnels**, valeurs par défaut sûres, validés (`env.validation.ts`) ; documentés `.env.example`. Aucune variable **obligatoire** nouvelle.
- [ ] **Artefacts embarqués** inclus dans le build (`nest-cli.json` `assets` + copie `Dockerfile`) ; l'image `runtime` contient bien `assets/referentiels/*.json` (vérifié au démarrage docker).
- [ ] **Tests unitaires** (seuils Jest 90/65/90/90 tenus) : registre resolve/niet ; loader checksum **OK** → package ; checksum **mismatch** → `ReferentielIntegrityError` (rien en cache) ; **hit/miss** ; **recharge** sur changement de clé ; **single-flight** (un seul fetch concurrent, ex. `jest.fn` source comptée) ; introuvable → `ReferentielNotFoundError` ; moteur : entitlement avec/sans référentiel ; parsing d'un artefact réel (amorce) → structure conforme à `ReferentielPackage`.
- [ ] **Tests e2e** (`test/bilan-referentiel.e2e-spec.ts`, fixture RS256 + Mongo de test + read-models semés) : org habilitée → **200** + méta référentiel + `integrity: 'verified'` ; **2ᵉ appel** → `cache: 'hit'` ; entitlement `ACTIVE` **sans référentiel** → erreur explicite (pas 500) ; sans entitlement → **403 `BILAN_NOT_ENTITLED`** ; sans token → **401**.
- [ ] **ESLint 0 warning**, build image `runtime` OK, CI verte (matrice 5 services + base `bilan_service_test`).
- [ ] **Vérification docker bout-en-bout** : stack `auth:3001` + `catalog:3003` + `kyc:3002` + `bilan:3004` + `mongo` rs0 + `kafka`. Pour une org habilitée (KYC APPROVED + entitlement `bilan` `ACTIVE` avec `referentiel = syscohada-revise@x.y`, via le **vrai** pipeline catalog→bilan) : `GET /bilan/referentiel` = **200** `integrity: 'verified'`, `postesCount`/`mappingCount` cohérents avec l'amorce ; 2ᵉ appel `cache: 'hit'` ; org sans entitlement → **403**. Consignée en §Revue & validation.

---

## Technical Notes

### Composants

- **Backend :** `bilan-service` — nouveau `modules/bilan/` : `referentiel/referentiel-package.interface.ts` (contrat), `referentiel/artifact-source.ts` (port + `BundledArtifactSource`), `referentiel/referentiel-registry.ts` (manifeste), `referentiel/referentiel-loader.service.ts` (fetch+sha256+cache), `referentiel/errors.ts` (erreurs typées), `bilan-engine.service.ts` (squelette), `bilan-diagnostics.controller.ts` (endpoint provisoire), `bilan.module.ts`. Enregistrement dans `app.module.ts`. Assets : `assets/referentiels/*.json`.
- **Base de données :** `bilan_service` — **lecture seule** sur `orgbilanentitlements` (STORY-036). **Aucune** collection, **aucune** écriture.
- **Bus :** **aucun** (ni producteur ni consommateur).
- **Infra :** **aucune nouvelle** (source d'artefact **embarquée**). MinIO **différé** (voir ci-dessous).

### Décision de conception : source d'artefact (MinIO différé, seam préservé)

L'architecture cible un **registre d'artefacts** MinIO/OCI (§Déploiement) d'où le référentiel est **téléchargé + vérifié** (**B5**). Or (a) le scaffold STORY-035 n'a **pas** câblé MinIO (`/health` = mongo+kafka), (b) cette story est le **squelette** du moteur, (c) **aucun** paquet de référentiel « officiel » n'est encore publié dans un registre. Deux options :

| Option | Source d'artefact | Verdict |
|---|---|---|
| **A (retenue)** | **`BundledArtifactSource`** : artefacts (amorces `docs/referentiels/`) **embarqués** dans l'image, `checksum` attendu figé dans le **manifeste** `ReferentielRegistry`. Port `ArtifactSource` = **seam** pour une future `MinioArtifactSource`. | ✅ auto-suffisant, testable, **prouve intégralement** le mécanisme (résolution → **sha256** → cache → refus) sans provisionner d'infra ni bloquer sur la publication du registre. Fidèle à **B5/NFR-009** (le checksum est **réellement** vérifié). |
| B | Câbler **MinIO** maintenant (dép. client + bucket compose + upload amorces + portage `artifactUri`/`checksum` dans `entitlement.changed`) | ❌ tire de l'infra + un **changement de producteur `catalog`** (hors service) pour un squelette ; le registre distant a du sens quand de **vrais** paquets versionnés existent (EPIC-010). |

> **Option A.** Le **port `ArtifactSource`** isole la provenance : basculer vers MinIO plus tard = **une** implémentation + un binding de module, **sans toucher** loader/registre/moteur/interface. **Seam checksum** : aujourd'hui le checksum attendu vient du **manifeste embarqué** ; quand le registre distant + le producteur `catalog` porteront `artifactUri`/`checksum` dans `entitlement.changed` (et donc dans `OrgBilanEntitlement`), le loader lira le checksum attendu depuis le **read-model** au lieu du manifeste — **même algorithme de vérification**. Ce portage est **explicitement hors périmètre** (nécessite une évolution `catalog`) et **noté** en *Open questions*. **B5 reste honoré** : le hash est vérifié pour de vrai dès cette story.

### Interface de référentiel (esquisse)

```typescript
// modules/bilan/referentiel/referentiel-package.interface.ts (résumé)
export interface ReferentielRef { code: string; version: string; }

export interface PosteEtat {
  etat: string;        // "BILAN_ACTIF" | "BILAN_PASSIF" | "COMPTE_RESULTAT" | "TFT" | ...
  code: string;        // "AE", "AF", ...
  libelle: string;
  note?: string | null;
}

export interface MappingRule {
  etat: string;
  poste: string;                 // code poste cible
  libelle: string;
  type: 'detail' | 'total';
  regle: string;                 // "NET_ACTIF" | "SOLDE_CREDITEUR" | "CHARGE" | "PRODUIT" | ...
  comptesSyscohada: string[];    // préfixes/numéros de comptes source
}

/** Contrat stable découplant le moteur du référentiel concret (P7). Données pures.
 *  Stabilisé au niveau squelette ; extensible par le tech-spec Bilan (B8) sans casser le loader. */
export interface ReferentielPackage {
  meta: { code: string; version: string; libelle: string; checksum: string; date?: string };
  postes: PosteEtat[];
  tableDePassage: MappingRule[];
  regles: Record<string, string>;
  paquetFiscal?: Record<string, unknown>;
}
```

> Le contrat est **façonné d'après** `docs/referentiels/postes-syscohada-guidef-togo.json` et `table-de-passage-syscohada.json` (le `_meta` de l'amorce alimente `meta`/`regles`). Il reste **minimal** : le moteur réel (EPIC-011) pourra ajouter des champs (règles de calcul détaillées, ordre de présentation, notes) **rétro-compatiblement**.

### ReferentielLoader (esquisse)

```typescript
// modules/bilan/referentiel/referentiel-loader.service.ts (résumé)
@Injectable()
export class ReferentielLoader {
  private readonly cache = new Map<string, ReferentielPackage>();
  private readonly inflight = new Map<string, Promise<ReferentielPackage>>();

  constructor(
    private readonly registry: ReferentielRegistry,
    @Inject(ARTIFACT_SOURCE) private readonly source: ArtifactSource,
  ) {}

  async load(ref: ReferentielRef): Promise<ReferentielPackage> {
    const key = `${ref.code}@${ref.version}`;
    const cached = this.cache.get(key);
    if (cached) return cached;                                   // HIT
    const pending = this.inflight.get(key);
    if (pending) return pending;                                 // single-flight

    const p = this.fetchVerifyParse(key, ref).finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }

  private async fetchVerifyParse(key: string, ref: ReferentielRef): Promise<ReferentielPackage> {
    const entry = this.registry.resolve(ref.code, ref.version);
    if (!entry) throw new ReferentielNotFoundError(key);
    const bytes = await this.source.fetch(entry.locator);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== entry.checksum) throw new ReferentielIntegrityError(key, entry.checksum, digest); // B5
    const pkg = this.parse(bytes, ref, digest);                 // JSON → ReferentielPackage
    this.cache.set(key, pkg);                                    // MISS → cache
    return pkg;
  }
}
```

- **`.finally`** retire l'entrée in-flight en cas de succès **comme** d'échec (une intégrité invalide ne doit pas geler la clé).
- **Cache non borné** volontairement (poignée de référentiels/versions) ; `REFERENTIEL_CACHE_MAX` prévu si besoin (éviction LRU) — non requis au squelette.
- **Journalisation** : `miss`/`hit`, `integrity ok/violée` (sans logguer le contenu de l'artefact).

### Moteur squelette (esquisse)

```typescript
// modules/bilan/bilan-engine.service.ts (résumé)
@Injectable()
export class BilanEngineService {
  constructor(
    @InjectModel(OrgBilanEntitlement.name) private readonly ent: Model<OrgBilanEntitlementDocument>,
    private readonly loader: ReferentielLoader,
  ) {}

  async resolveReferentielForOrg(orgId: Types.ObjectId): Promise<ResolvedReferentiel> {
    const ent = await this.ent.findOne({ organizationId: orgId }).lean();
    const ref = ent?.referentiel;
    if (!ref?.code || !ref?.version) throw new ReferentielUnresolvedError(orgId.toHexString());
    const before = this.loader.has(`${ref.code}@${ref.version}`);      // pour exposer hit/miss
    const pkg = await this.loader.load(ref);
    return { referentiel: ref, package: pkg, cache: before ? 'hit' : 'miss' };
  }
  // AUCUN calcul d'état financier ici — EPIC-011 (B8).
}
```

> Le gate `@RequiresBilanAccess` garantit déjà `entitlement ACTIVE` **avant** d'atteindre le moteur ; `resolveReferentielForOrg` gère malgré tout le cas `referentiel` absent (entitlement actif mais sans paquet attribué) en **erreur typée**, jamais en 500.

### Endpoint diagnostic gardé (provisoire)

```typescript
// modules/bilan/bilan-diagnostics.controller.ts (résumé)
@Controller('bilan')
export class BilanDiagnosticsController {
  constructor(private readonly engine: BilanEngineService) {}

  @Get('referentiel')
  @Roles(Role.TENANT_ADMIN, Role.TENANT_USER)
  @RequiresBilanAccess()
  @ApiOkResponse({ type: ReferentielDiagnosticDto })
  @ApiForbiddenResponse({ description: 'KYC_NOT_APPROVED | BILAN_NOT_ENTITLED' })
  async referentiel(@CurrentUser() user: AuthenticatedUser): Promise<ReferentielDiagnosticDto> {
    const r = await this.engine.resolveReferentielForOrg(new Types.ObjectId(user.tenantId));
    return {
      referentiel: r.referentiel,
      checksum: r.package.meta.checksum,
      libelle: r.package.meta.libelle,
      postesCount: r.package.postes.length,
      mappingCount: r.package.tableDePassage.length,
      integrity: 'verified',
      cache: r.cache,
    };
  }
}
```

Comme `whoami`/`bilan-access`, **diagnostic et provisoire** : preuve bout-en-bout du loader tant qu'aucun contrôleur Bilan réel n'existe (EPIC-009+). À supprimer/remplacer à l'arrivée du domaine.

### Sécurité & intégrité

- **Intégrité obligatoire (NFR-009/B5)** : **aucun** `ReferentielPackage` n'est retourné/mis en cache sans **sha256 conforme**. Un référentiel altéré fausserait **tous** les états financiers → **refus dur**, pas de dégradation silencieuse.
- **Fail-safe** : un artefact injoignable / illisible / non-JSON ⇒ erreur typée (`ReferentielNotFoundError` / erreur de parse) → **jamais** un package partiel. Le cache **ne conserve** que des packages **vérifiés**.
- **Pas de fuite** : les erreurs d'intégrité journalisent la **clé** et les **hash** (attendu/obtenu), **pas** le contenu de l'artefact.
- **Entrée de confiance** : `(code, version)` provient du **read-model** (alimenté par les événements signés des sources de vérité, STORY-036), pas d'un paramètre client ; `orgId` du **claim JWT** signé.
- **Zéro appel réseau sur le chemin d'autorisation** : le gate (STORY-037) reste local ; le loader lit des **artefacts embarqués** (pas d'I/O réseau au squelette). Quand MinIO arrivera, le **cache** amortit la (re)charge et tolère une indisponibilité transitoire (§Risques #3 archi).

### Cas limites / points d'attention

- **⚠️ Interface à stabiliser (archi §Risques #2).** `ReferentielPackage` est le **cœur du découplage P7** : le garder **minimal et data-only**, documenté extensible (B8), pour éviter un refacto coûteux quand le moteur réel arrivera.
- **Entitlement `ACTIVE` sans `referentiel`.** Possible (octroi sans champ référentiel) ⇒ `ReferentielUnresolvedError` explicite, **pas** un 500.
- **Cohérence éventuelle.** Le référentiel de l'org peut changer (nouvel `entitlement.changed`) — le loader **recharge** à la nouvelle clé ; l'ancienne reste en cache (inoffensif). Aucune invalidation active requise au squelette.
- **Single-flight.** Deux requêtes concurrentes d'une org fraîche ne doivent pas dédoubler le fetch/hash → Promise partagée (testé).
- **Assets dans l'image.** Piège classique NestJS : les `.json` non-TS **ne sont pas** copiés par défaut → **`nest-cli.json` `compilerOptions.assets`** + `COPY` explicite au `Dockerfile`. Vérifié au démarrage docker (sinon le loader échouerait à `fetch`).
- **Checksum réel, pas placeholder.** Le manifeste doit contenir le **vrai** sha256 des artefacts embarqués (script de calcul au commit) ; un placeholder ferait échouer **tout** chargement (utile comme test négatif, pas comme valeur livrée).
- **Pas de nouvelle dépendance runtime.** `crypto` (Node natif) pour sha256 ; `@nestjs/mongoose` déjà présent. Aucune lib ajoutée.

### Open questions (à trancher à l'implémentation / stories suivantes)

- **Portage du checksum dans l'événement d'entitlement.** À terme (EPIC-010 + évolution producteur `catalog`), `artifactUri`/`checksum` transiteront par `entitlement.changed` → `OrgBilanEntitlement`, et le loader lira le checksum attendu depuis le **read-model** (pas le manifeste). **Hors périmètre** ici (changement `catalog`), seam préservé par le port `ArtifactSource` + `ReferentielRegistry`.
- **Version pilote packagée.** Aligner la `version` du paquet `syscohada-revise` embarqué sur celle utilisée par les tests docker d'entitlement (STORY-037 utilisait `syscohada-revise@2.1`) — à confirmer avec le manifeste catalog.

---

## Dependencies

**Stories prérequises :**
- **STORY-035** (scaffold `bilan-service` : `AppModule`, chaîne de guards, `AuthenticatedUser`, `Role`, config/env, Dockerfile/nest-cli) — **done**.
- **STORY-036** (read-model `OrgBilanEntitlement` avec `referentiel { code, version }`, exporté par `ReadModelsModule`) — **done**. **Source de résolution** du référentiel.
- **STORY-037** (gate `@RequiresBilanAccess` : garantit `entitlement ACTIVE` avant le moteur ; décorateur + guard) — **done**. Protège l'endpoint diagnostic.
- **Amorces de référentiel** (`docs/referentiels/` : postes + table de passage + paquet fiscal, validées à 100 % pour la table de passage) — **disponibles** (contenu embarqué).

**Stories bloquées (débloquées par celle-ci) :**
- **EPIC-009** (import de balance, STORY-050→053) — démarre sur un squelette **complet** (EPIC-008 clos).
- **EPIC-010** — **STORY-054** (interface de référentiel + loader : *concrétise/étend* `ReferentielPackage`), **STORY-055** (table de passage **appliquée**, FR-006), **STORY-057** (paquet `sfd-bceao`, via le registre *ready*), **STORY-058** (surcharges FR-008).
- **EPIC-011** (états financiers, FR-009→013) — le moteur réel **remplace** le squelette, **paramétré** par `ReferentielPackage`.
- **FE-B00** (shell UI Bilan) — s'appuiera sur le référentiel effectif exposé.

**Dépendances externes :** aucune (artefacts **embarqués** ; MinIO **différé**). `rs0` **non requis** ici (aucune transaction ; uniquement `findOne` + lecture d'assets).

---

## Definition of Done

- [ ] Code implémenté et committé sur une branche **`MNV-038`** (branchée depuis `dev`, **rebasée sur `origin/dev` avant** de coder).
- [ ] `BilanModule` : interface `ReferentielPackage` + port `ArtifactSource` (`BundledArtifactSource`) + `ReferentielRegistry` (manifeste, `syscohada-revise` packagé) + `ReferentielLoader` (fetch + **sha256** + cache + single-flight + refus) + `BilanEngineService` squelette + endpoint diagnostic `GET /bilan/referentiel` + erreurs typées + assets embarqués (nest-cli + Dockerfile).
- [ ] Enregistré dans `AppModule` (import des exports `ReadModelsModule`) ; **aucun cycle** ; `/health` inchangé (200) ; **aucune** infra/dépendance runtime nouvelle.
- [ ] Tests unitaires écrits et verts (seuils Jest 90/65/90/90) :
  - [ ] registre resolve / null ; loader **checksum OK** → package ; **mismatch** → `ReferentielIntegrityError` (rien mis en cache) ; **hit/miss** ; **recharge** sur nouvelle clé ; **single-flight** ; introuvable → `ReferentielNotFoundError`.
  - [ ] moteur : entitlement **avec** référentiel → `{ referentiel, package, cache }` ; **sans** référentiel → `ReferentielUnresolvedError`.
  - [ ] parse d'un artefact réel (amorce) → `ReferentielPackage` conforme (postes/table de passage non vides).
- [ ] Tests e2e verts (fixture RS256 + Mongo de test + read-models semés) : **200** + méta + `integrity: 'verified'` ; 2ᵉ appel `cache: 'hit'` ; entitlement sans référentiel → erreur explicite (pas 500) ; sans entitlement → **403 `BILAN_NOT_ENTITLED`** ; sans token → **401**.
- [ ] ESLint **0 warning**, build image `runtime` OK (assets `referentiels/*.json` présents dans l'image).
- [ ] **Vérification docker bout-en-bout** réalisée (org habilitée via vrai pipeline catalog→bilan → `GET /bilan/referentiel` 200 `integrity: 'verified'` + comptes cohérents ; 2ᵉ appel `hit` ; org sans entitlement → 403) et consignée en §Revue & validation.
- [ ] CI verte (matrice 5 services + `bilan_service_test`).
- [ ] `/code-review` passé.
- [ ] Critères d'acceptation validés (tous ✓).
- [ ] PR `MNV-038(bilan-service): …` ouverte puis intégrée sur `dev` en **Rebase and merge** (branche supprimée après merge).
- [ ] `sprint-status.yaml` mis à jour (STORY-038 → done + note de vérification) ; **EPIC-008 marqué clos** ; statut `bilan-service` mis à jour.

---

## Story Points Breakdown

- **Backend :** 4 points (interface `ReferentielPackage` + port `ArtifactSource`/`BundledArtifactSource` + `ReferentielRegistry` manifeste + `ReferentielLoader` fetch/**sha256**/cache/single-flight/refus + `BilanEngineService` squelette + `BilanModule` + endpoint diagnostic + erreurs typées + embarquement des assets [nest-cli/Dockerfile] + calcul des checksums réels).
- **Frontend :** 0 point.
- **Testing :** 1 point (unitaires exhaustifs loader/registre/moteur [checksum ok/mismatch, hit/miss, recharge, single-flight, introuvable, sans référentiel] + e2e endpoint gardé + parse d'amorce réelle + vérif docker).
- **Total :** 5 points.

**Rationale :** la valeur et le risque sont dans le **mécanisme de chargement vérifié** (sha256 obligatoire — **B5/NFR-009**), le **cache** (hit/miss/recharge/single-flight) et surtout la **stabilisation de l'interface de référentiel** (cœur du découplage **P7**, §Risques #2 de l'archi). Le moteur reste **squelette** (aucun calcul comptable, **B8**), ce qui **contient** la complexité malgré la surface (nouveau module + port + registre + loader + moteur + diagnostic). Le choix **source embarquée** (MinIO différé) évite de tirer de l'infra tout en **prouvant réellement** l'intégrité. Conforme à l'estimation du sprint-plan (5 pts). **Clôt EPIC-008.**

---

## Additional Notes

- **Clôture d'EPIC-008.** Avec STORY-035 (scaffold), 036 (read-models), 037 (gate) et **038 (loader + interface + moteur squelette)**, le **squelette d'intégration** de `bilan-service` est **complet** : le service démarre en relying party, projette entitlement/KYC, garde ses opérations, et **charge un référentiel vérifié** pour l'org. EPIC-009 (import de balance) démarre sur ce socle.
- **P7 concrétisé, sans fork.** Le référentiel est une **donnée** (`ReferentielPackage`) **injectée** dans le moteur, résolue **par tenant** depuis le read-model d'entitlement — SYSCOHADA/SFD cohabiteront sur la **même** version de code (**B2**). Cette story pose l'interface ; les paquets multiples arrivent en EPIC-010.
- **Intégrité d'abord.** `bilan-service` **refuse** de calculer sur un référentiel non intègre (**NFR-009/B5**) — le sha256 est vérifié **pour de vrai** dès le squelette, pas « plus tard ».
- **Provisoire assumé.** `GET /bilan/referentiel` est un **harnais de preuve** (comme `whoami`/`bilan-access`) ; il disparaîtra avec les contrôleurs Bilan réels (EPIC-009+), où le moteur sera **appelé par les opérations métier** et non par un endpoint diagnostic.
- **Alignement architecture.** Noms (`ReferentielLoader`, `ReferentielPackage`, `BilanEngineService`), responsabilités (résolution `(code,version)` → artefact → **checksum** → cache) et décisions (**B2/B5**, §ReferentielLoader, §BilanModule) **repris tels quels** de `architecture-bilan-service-2026-07-07.md` — pas de dérive de contrat. Le **seul** écart assumé et documenté : source **embarquée** au lieu de MinIO (différé, seam préservé).

---

## Progress Tracking

**Status History :**
- 2026-07-14 : Créée par Scrum Master (BMAD create-story)

**Actual Effort :** ~5 points (conforme à l'estimation).

---

## Revue & validation

### Implémentation

`BilanModule` (`src/modules/bilan/`) — dernier maillon du squelette EPIC-008, conforme à l'architecture (§ReferentielLoader, §BilanModule, B2/B5) :

- **Interface `ReferentielPackage`** (`referentiel/referentiel-package.interface.ts`) — contrat **data-only** (`meta`/`regles`/`postes`/`tableDePassage`/`paquetFiscal?`) découplant le moteur du référentiel (P7), façonné d'après les amorces, documenté extensible (B8).
- **Port `ArtifactSource`** (`referentiel/artifact-source.ts`, jeton `ARTIFACT_SOURCE`) + **`BundledArtifactSource`** — artefacts **embarqués** (`assets/*.json`), garde-fou anti-traversée sur le locator. **MinIO différé** (seam).
- **`ReferentielRegistry`** (`referentiel/referentiel-registry.ts`) — manifeste `code@version → { locator, checksum }`, `syscohada-revise@2.1` packagé (checksum réel `4ced8658…3ef042`), `sfd-bceao` absent (STORY-057).
- **`ReferentielLoader`** (`referentiel/referentiel-loader.service.ts`) — résout → `fetch` → **sha256** (comparé au manifeste, `ReferentielIntegrityError` si écart, **B5/NFR-009**) → parse (garde-fous structure + méta `code@version`) → **cache** keyé `code@version` (hit/miss, versions coexistantes) + **single-flight** (une seule I/O concurrente). `meta.checksum` = hash vérifié injecté.
- **`BilanEngineService`** squelette (`bilan-engine.service.ts`) — `resolveReferentielForOrg` lit `OrgBilanEntitlement` (read-model STORY-036) → `load` ; entitlement **sans** référentiel ⇒ `ReferentielUnresolvedError`. **Aucun calcul comptable** (EPIC-011, B8).
- **Endpoint diagnostic gardé provisoire** `GET /api/v1/bilan/referentiel` (`@RequiresBilanAccess` + `@Roles(TENANT_*)`) → `200 { referentiel, checksum, libelle, postesCount, mappingCount, integrity:'verified', cache }`. Erreurs typées mappées : `ReferentielUnresolvedError`→**409** `REFERENTIEL_UNRESOLVED`, `ReferentielIntegrityError`→**502** `REFERENTIEL_INTEGRITY`, `NotFound`/`Parse`→**500** `REFERENTIEL_UNAVAILABLE`.
- **Générateur reproductible** `scripts/referentiels/build.mjs` — consolide les amorces (`scripts/referentiels/sources/`) → artefact déterministe + sha256 (checksum réel, pas placeholder). **Assets bundelisés** via `nest-cli.json` (`assets` glob) → présents dans l'image (vérifié docker).
- Config `REFERENTIEL_SOURCE` (défaut `bundled`, `IsIn(['bundled'])`) ; `BilanModule` enregistré dans `AppModule` (import `ReadModelsModule`). **Aucune** écriture Mongo, **aucun** événement Kafka, **aucune** infra nouvelle ; `/health` inchangé.

### Qualité

- **ESLint** : 0 warning (`--max-warnings 0`). **Build** `nest build` OK ; asset copié dans `dist/modules/bilan/referentiel/assets/` (sha256 identique au manifeste).
- **Tests unitaires** : **128** tests / 22 suites verts (30 nouveaux : registry, bundled source, loader — checksum ok/mismatch/hit/miss/recharge/single-flight/introuvable/parse/méta — moteur, contrôleur error-mapping, + chargement de l'**artefact réel** 163 postes/99 mappings). Couverture **globale 98.6/85.4/97.9/98.4** (seuils 90/65/90/90 tenus) ; `bilan-engine`/`referentiel.errors`/`registry` 100 %.
- **E2E** (`test/bilan-referentiel.e2e-spec.ts`) : **23** tests / 4 suites. Chaîne réelle `Jwt→EmailVerified→Roles→BilanAccess` + loader réel (registre + source embarquée) : 200 (méta + `integrity:'verified'` + miss→hit), 409 sans référentiel, 403 sans entitlement, 401 sans jeton.

### Vérification docker bout-en-bout (2026-07-14)

Stack `auth:3001` + `platform-catalog-service:3003` + `kyc:3002` + `bilan:3004` + `mongo` (rs0) + `kafka` (`bilan-service` redémarré sur `MNV-038`, asset embarqué présent dans `dist`, route `GET /api/v1/bilan/referentiel` mappée). Org tenant fraîche register → verify (Mailhog) → login RS256 (`emailVerified=true`, `aud` incl. `bilan-service`) ; `PLATFORM_ADMIN` réel (`platformRole` + membership retirée) :

- **(E)** KYC `APPROVED` (read-model semé — pipeline `kyc.status.changed` prouvé STORY-036) + `PUT /catalog/entitlements/{org}/bilan` (`2.0` + `syscohada-revise@2.1`) **201** → `entitlement.changed` (outbox catalog) → projection `OrgBilanEntitlement ACTIVE|syscohada-revise@2.1` (~1 s) → `GET /bilan/referentiel` = **200** `{ referentiel: syscohada-revise@2.1, checksum: 4ced8658…3ef042, postesCount: 163, mappingCount: 99, integrity: 'verified', cache: 'miss' }`.
- **(F)** 2ᵉ appel → **`cache: 'hit'`** (aucun re-fetch/re-hash).
- **(I)** `PUT` entitlement **sans** référentiel (pipeline réel) → projection `ACTIVE|NO-REF` → `GET` = **409 `REFERENTIEL_UNRESOLVED`** (pas de 500).
- **(G)** Org sans KYC/entitlement → **403** (gate, référentiel jamais chargé). **(H)** Sans jeton → **401**.

Le référentiel effectif transite par le **vrai pipeline** `catalog → outbox → Kafka → projection bilan` ; le loader le résout, **vérifie son sha256** (identique à l'artefact committé) et le met en cache. Intégrité honorée **pour de vrai** dès le squelette.

### Points d'attention

- **Interface à stabiliser (archi §Risques #2)** : `ReferentielPackage` gardé **minimal & data-only**, documenté extensible (B8) ; le moteur réel (EPIC-011) l'enrichira sans casser le loader.
- **MinIO différé (assumé)** : source **embarquée** au lieu du registre distant ; seam préservé par le port `ArtifactSource` + le seam checksum (à terme porté par `entitlement.changed`/read-model — *Open questions*). **B5 honoré** (sha256 vérifié).
- **Cache persistant** : la loader-cache est un singleton du conteneur ; le miss→hit se lit sur deux appels consécutifs (démontré). Non borné (poignée de référentiels) ; `REFERENTIEL_CACHE_MAX` non requis au squelette.
- **Aucune régression** : ajout d'un module + endpoint diagnostic ; read-models en **lecture seule**, `/health` inchangé, pas de dépendance runtime nouvelle, `rs0` non requis (aucune transaction).

---

**Cette story a été créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).**
