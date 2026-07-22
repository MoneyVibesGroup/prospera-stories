# STORY-078 : Chargement du référentiel comptable (SN/SMT) + paquet fiscal pays — loader, checksum, cache

**Epic :** EPIC-017 (socle balance-service) / EPIC-019 (référentiels étendus & paramétrage pays, D12)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A04/FR-A05/FR-A06/FR-A07 + NFR-A06 ; `sprint-plan-atelier-balance-2026-07-12.md` § 6 (packaging catalog) ; `architecture-catalog-service-2026-07-07.md` (packaging des référentiels, C3) ; `architecture-bilan-service-2026-07-07.md` §ReferentielLoader (patron d'origine, STORY-038)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée, vérifiée docker, revue code + sécurité, intégrée dans `dev` le 2026-07-22)
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-12 · **révisée le** 2026-07-22 (cadrage aligné sur le code réellement livrable)
**Sprint :** 16 (EXTENDED, D14) — *le cadrage initial du 2026-07-12 la plaçait au sprint 15 ; `sprint-status.yaml` fait foi*
**Service :** `balance-service` (:3007)
**Couvre :** FR-A04 (référentiel comptable versionné + checksum), FR-A05 (paquet fiscal `pays×année`), NFR-A06 (multi-pays sans fork), amorce FR-A07
**Criticité :** ⚙️ **Socle** — sans référentiel chargé, aucune validation de compte, aucun calcul fiscal, aucun paramétrage pays. Tout l'EXTENDED (079-081, 085, 091-098) s'y branche.

> **NFR-A06 est l'enjeu réel : « le code ne contient aucun taux ni gabarit en dur ».** Cette story installe dans `balance-service` la **seule** porte d'entrée des données de paramétrage — plan de comptes, règles, taux fiscaux — sous forme d'**artefacts versionnés, vérifiés par sha256 et mis en cache**. Ajouter un pays ou une année fiscale doit coûter **une ligne de manifeste + un artefact**, jamais une ligne de code métier.

---

## User Story

En tant que **PME/cabinet togolais utilisant l'Atelier Balance**,
je veux que le service **charge le référentiel comptable de mon organisation et le paquet fiscal de mon pays pour l'année de l'exercice**,
afin que **mes comptes soient reconnus et mes impôts calculés sur les taux réellement en vigueur** — et que **changer d'année fiscale ou de pays ne demande aucune livraison de code**.

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

`balance-service` sait aujourd'hui **stocker et céder** une balance canonique (STORY-101/086/099) mais il ne sait **rien** du référentiel qu'elle porte : le champ `BalanceCanonique.referentiel` est un simple **tag** (`'SN' | 'SMT' | 'SFD-BCEAO'`, cf. `types/balance-canonique.ts`) — aucune donnée derrière. Le read-model `OrgBalanceEntitlement` projette déjà `referentiel: { code, version }` **sans lecteur**, avec une note qui désigne nommément cette story :

> « `versionCode`/`referentiel`/`config` sont projetés dès maintenant […] mais **aucun lecteur** ne les exploite avant les stories du domaine (STORY-101+ / **paquet fiscal STORY-078**). » — `read-models/schemas/org-balance-entitlement.schema.ts`

078 **branche ce lecteur**. Le patron existe déjà, éprouvé et documenté : `bilan-service` STORY-038 (port `ArtifactSource` → registre `code@version → {locator, checksum}` → `ReferentielLoader` fetch/sha256/parse/cache single-flight → erreurs typées → mapper HTTP). 078 le **transpose** à `balance-service` en le généralisant à **deux axes d'artefacts** (comptable *et* fiscal).

### Décisions de cadrage

**D-078-1 — Deux axes d'artefacts, deux registres, un socle générique.**
Le référentiel comptable (`syscohada-revise@2.1`) et le paquet fiscal (`togo@2026`) sont **orthogonaux** : la loi de finances change tous les ans, le plan de comptes non. Le paquet fiscal est donc chargé comme un **artefact à part entière**, clé `pays@année`, par le **même** socle générique (fetch → sha256 → parse → cache). Le champ `ReferentielPackage.paquetFiscal` embarqué dans l'artefact SYSCOHADA reste **ignoré** par `balance-service` (il sert la liasse côté bilan) : la source de vérité fiscale de l'Atelier Balance est le **registre fiscal**, jamais le référentiel. C'est ce qui permet de basculer 2026→2027 sans re-publier le référentiel comptable.

**D-078-2 — Les octets embarqués sont *identiques* à ceux de `bilan-service`.**
Un artefact = un checksum = **un** contenu, quel que soit le service qui le lit. Les assets `syscohada-revise-2.1.json` / `sfd-bceao-2.0.json` sont **copiés à l'octet près** depuis `bilan-service/src/modules/bilan/referentiel/assets/` (générés par `bilan-service/scripts/referentiels/build.mjs`, source de vérité) et leurs checksums repris **tels quels** dans le manifeste. Une spec verrouille cette égalité. `balance-service` ne consomme qu'un **sous-ensemble** du paquet (`meta`, `regles`, `planDeComptes`) et **tolère** les champs qu'il ignore (`postes`, `tableDePassage`, `notes`, `paquetFiscal`) — le contrat TS local est volontairement **permissif en lecture**, sinon tout enrichissement B8 casserait le chargement.

**D-078-3 — SMT est *résolu* mais **pas** packagé : refus explicite, jamais d'invention.**
L'amorce `docs/referentiels/postes-smt-togo.json` porte la structure de liasse SMT mais sa `tableDePassage` est un **placeholder** (`{statut, note}`) et **aucun plan de comptes SMT** n'est sourcé. Packager SMT reviendrait à **inventer du comptable** — interdit. 078 livre donc : le tag `'SMT'` **reconnu** par le pont tag→référentiel, résolu vers `smt-togo@1.0`, et un refus **typé et explicite** (`ReferentielNonPackageError` → **409 `REFERENTIEL_NON_PACKAGE`**) tant que l'artefact n'est pas publié. L'agnosticisme est **prouvé par test** (un référentiel factice ajouté par une seule ligne de manifeste se charge sans une ligne de code). Le packaging SMT réel est un **blocker MV** (voir §Blockers) à traiter comme l'ont été 120-122 : sources officielles + validation experte.

**D-078-4 — Duplication assumée du socle, pas de librairie partagée.**
Il n'existe aucun paquet npm partagé entre services (chaque service porte son `common/`, son `kafka/`, son `outbox/` — patron maison). 078 **ne crée pas** de dépendance `balance-service → bilan-service`. La divergence potentielle des deux copies est couverte par la spec d'égalité d'octets (D-078-2) et tracée en finding.

**D-078-5 — L'année vient de l'exercice, le pays d'une valeur par défaut *documentée comme temporaire*.**
Le profil société (STORY-079) et les 2 axes système/régime (STORY-080) n'existent pas encore, mais l'**exercice** est déjà porté par la balance canonique. La résolution est donc scindée :
- **année = année de clôture de l'exercice** quand l'appelant en tient un ⇒ **immutabilité par exercice** : un exercice 2026 reste calculé avec `togo@2026` même après publication de `togo@2027`. Une loi de finances postérieure ne réécrit pas un exercice clos — c'est ce qui rend une liasse **rejouable à l'identique** des années plus tard ;
- **pays = `PAQUET_FISCAL_PAR_DEFAUT`** (env, défaut `togo@2026`), en attendant le profil.

Le tout dans **un seul point** (`ReferentielResolver.resoudrePaquetFiscal`) — STORY-080 y branchera le profil sans toucher aux loaders, aux registres ni au contrôleur.

### Ce que 078 livre

1. Le **socle de chargement d'artefacts** générique : port `ArtifactSource` + implémentation embarquée, registres pilotés par données, vérification sha256 **obligatoire**, cache + single-flight, erreurs typées, mapper HTTP.
2. Le **référentiel comptable** de l'org, résolu depuis le read-model d'entitlement, chargé et vérifié (SN + SFD-BCEAO packagés).
3. Le **paquet fiscal `pays×année`** chargé et vérifié par le même socle (Togo 2026 packagé).
4. Les **tampons effectifs** (`{code, version, checksum}` et `{pays, annee, checksum}`) — **inertes**, contrat figé pour que 091+ estampille toute base de calcul fiscal.
5. Un **endpoint de diagnostic gardé** qui prouve la chaîne de bout en bout (résolution → intégrité → cache), sur le modèle de `GET /bilan/referentiel`.

### Ce que 078 ne fait PAS (frontière nette)

- ❌ **Aucun *branchement* de la validation de compte.** 078 livre le **prédicat** `isCompteValide(compte)` (rattachement **par préfixe** au plan chargé — indispensable car une balance réelle porte `5211BOA0`/`411FACTURE` là où le plan normalisé déclare `521`/`411`), mais ne l'applique **nulle part** : ni dans `BalanceValidator`, ni à l'import Sage. L'arbitrage des comptes non reconnus et les surcharges `(orgId, compte) → poste` sont **FR-A07** ; le branchement est **STORY-085**.
- ❌ **Aucun calcul fiscal** (IS, MFP, TPU, acomptes) → EPIC-021 / STORY-091+. 078 charge les taux, ne les utilise pas.
- ❌ **Aucune surcharge locale** `(orgId, compte) → poste` → FR-A07 (Should), story ultérieure.
- ❌ **Aucun gabarit de liasse admin** (upload/gestion GUIDEF) → FR-A06 / admin-panel, D12.
- ❌ **Aucun registre distant** (MinIO/OCI) : la source embarquée reste ; le port `ArtifactSource` **est** le seam documenté.
- ❌ **Aucune modification** du contrat de balance, du stockage, du handoff `balance.created`, ni du tag `referentiel` existant.
- ❌ **Aucun packaging SMT** (D-078-3).

---

## Scope

**Inclus**

- `src/modules/referentiel/` : `artifact-source.ts` (port + jeton), `bundled-artifact-source.ts`, `referentiel-registry.ts`, `paquet-fiscal-registry.ts`, `artifact-loader.ts` (socle générique fetch/vérif/cache/single-flight), `referentiel-loader.service.ts`, `paquet-fiscal-loader.service.ts`, `referentiel-resolver.service.ts` (org → ref), `referentiel.errors.ts`, `referentiel-http.mapper.ts`, `stamps.ts`, `referentiel.module.ts`.
- `src/modules/referentiel/assets/` : `syscohada-revise-2.1.json`, `sfd-bceao-2.0.json` (octets identiques bilan), `paquet-fiscal-togo-2026.json`.
- `nest-cli.json` : entrée `assets` pour embarquer les `.json` dans `dist/`.
- `src/config/` : `PAQUET_FISCAL_PAR_DEFAUT` (validation + typage).
- `referentiel.controller.ts` + DTO de diagnostic (`GET /api/v1/referentiels/actifs`).
- Specs unitaires + spec de cohérence d'octets/checksums + e2e du diagnostic.

**Exclu** — tout le §« Ce que 078 ne fait PAS ».

---

## User Flow

1. Un `TENANT_ADMIN`/`TENANT_USER` d'une org habilitée `balance` appelle `GET /api/v1/referentiels/actifs`.
2. La gate `@RequiresBalanceAccess` valide email vérifié + KYC `APPROVED` + entitlement `balance` `ACTIVE` (read-models locaux, STORY-077).
3. `ReferentielResolver` lit `OrgBalanceEntitlement.referentiel` → `{code, version}` ; absent ⇒ **409 `REFERENTIEL_UNRESOLVED`**.
4. `ReferentielLoader.load()` : cache **hit** ⇒ retour immédiat ; **miss** ⇒ `ArtifactSource.fetch(locator)` → sha256 → comparaison au manifeste → parse → mise en cache (**uniquement** si vérifié).
5. `PaquetFiscalLoader.load()` fait de même pour `pays@année` (résolu par `PAQUET_FISCAL_PAR_DEFAUT`, hook 080).
6. Réponse **200** : `{ referentiel, checksum, stamp, libelle, planCount, integrity: 'verified', cache: 'hit'|'miss', paquetFiscal: { pays, annee, checksum, stamp, statut, cache } }`.
7. Toute anomalie sort en **erreur typée mappée** (403/409/500/502/503) — jamais un 500 nu, jamais le contenu de l'artefact dans les logs.

---

## Acceptance Criteria

- [ ] **AC-1** — `GET /api/v1/referentiels/actifs` renvoie **200** avec le référentiel effectif de l'org, son sha256 **vérifié**, le nombre de comptes du plan et `integrity: 'verified'`.
- [ ] **AC-2** — Un artefact dont le sha256 **diffère** du manifeste est **refusé** : rien n'est parsé, **rien n'est mis en cache**, `ReferentielIntegrityError` → **502 `REFERENTIEL_INTEGRITY`**. Le log ne contient que des **hash**, jamais le contenu.
- [ ] **AC-3** — Le **cache** fonctionne : 2ᵉ appel ⇒ `cache: 'hit'`, **sans** re-fetch ni re-hash (prouvé par un espion sur `ArtifactSource.fetch`). Deux `load` **concurrents** de la même clé partagent **un seul** fetch (single-flight).
- [ ] **AC-4** — Le paquet fiscal `togo@2026` est chargé **par son propre registre** (clé `pays@année`), vérifié par checksum, mis en cache, et sa réponse expose `pays`, `annee`, `checksum` et le `statut` du paquet. Le champ `paquetFiscal` **embarqué dans le référentiel** n'est **jamais** lu (D-078-1, prouvé par test).
- [ ] **AC-5** — **Octets identiques bilan** : le sha256 recalculé des assets `syscohada-revise-2.1.json` et `sfd-bceao-2.0.json` est **exactement** `01b892c0…67b` et `ee9bf014…11fe` (constantes du manifeste `bilan-service`). Spec dédiée, échec bloquant.
- [ ] **AC-6** — **Agnosticisme prouvé (NFR-A06)** : ajouter un référentiel = **une ligne** de manifeste + un artefact, **zéro ligne de code métier** — démontré par un test qui charge un référentiel factice via un registre surchargé. Aucun code de compte, poste ou taux **en dur** dans le code (grep de non-régression sur les taux du paquet fiscal).
- [ ] **AC-7** — Org **sans référentiel** attribué ⇒ **409 `REFERENTIEL_UNRESOLVED`** ; référentiel **non packagé** (ex. `smt-togo@1.0`) ⇒ **409 `REFERENTIEL_NON_PACKAGE`** avec un message explicite ; entitlement non `ACTIVE` ⇒ **403 générique** (défense en profondeur de la gate) ; artefact illisible ⇒ **500** ; source indisponible ⇒ **503 retryable**.
- [ ] **AC-8** — Un référentiel **déjà en cache** reste servi même si la source devient indisponible (cache-first, pendant de NFR-009 AC-2 côté bilan).
- [ ] **AC-9** — Le **pont tag ↔ référentiel** est déclaratif : `'SN' → syscohada-revise@2.1`, `'SMT' → smt-togo@1.0`, `'SFD-BCEAO' → sfd-bceao@2.0`, exhaustif sur `REFERENTIELS_BALANCE` (test de complétude : tout tag ajouté au contrat canonique **doit** être résolu).
- [ ] **AC-10** — Les **tampons effectifs** (`EffectiveReferentielStamp`, `EffectifPaquetFiscalStamp`) sont produits par des fonctions **pures**, exposés par le diagnostic, et **inertes** (aucun consommateur en 078) — contrat figé pour 091+.
- [ ] **AC-11** — `PAQUET_FISCAL_PAR_DEFAUT` est **validé au boot** (format `pays@AAAA`) : une valeur malformée **empêche le démarrage** ; l'absence de valeur retombe sur le défaut `togo@2026`.
- [ ] **AC-12** — **Non-régression totale** : aucun changement de comportement sur `POST /balances`, le handoff `balance.created`, l'import Sage ni les read-models. Suites existantes vertes sans modification.
- [ ] **AC-13** — Swagger documente l'endpoint et **tous** ses codes d'erreur ; lint 0 warning ; couverture ≥ seuils projet.
- [ ] **AC-14** *(repris du cadrage 2026-07-12)* — **Immutabilité par exercice** : une balance d'exercice **2026** résout **`togo@2026`** même si `togo@2027` a été publié entre-temps. L'année vient de la **clôture** de l'exercice (lue en UTC), jamais de l'année courante.
- [ ] **AC-15** *(repris du cadrage 2026-07-12)* — **`isCompteValide(compte)`** reconnaît les comptes SYSCOHADA **subdivisés** d'une balance réelle (`5211BOA0`, `411FACTURE`, `6031`) par **rattachement au préfixe** du plan chargé, et rejette un compte hors plan. **Fail-closed** : un paquet sans plan ne reconnaît **aucun** compte (jamais « tout accepter »).
- [ ] **AC-16** *(repris du cadrage 2026-07-12)* — **Aucune valeur par défaut silencieuse** : artefact indisponible ⇒ erreur explicite. Un taux d'impôt deviné est un redressement — le chargement s'arrête, il ne suppose pas.

---

## Technical Notes

### Composants (arborescence cible)

```
balance-service/src/modules/referentiel/
├── artifact-source.ts               # port + Symbol('ARTIFACT_SOURCE')
├── bundled-artifact-source.ts       # readFile assets/ + garde anti-traversée
├── artifact-loader.ts               # socle générique : fetch → sha256 → parse<T> → cache + inflight
├── referentiel-registry.ts          # manifeste code@version → {locator, checksum} + pont tag→ref
├── paquet-fiscal-registry.ts        # manifeste pays@année → {locator, checksum}
├── referentiel-loader.service.ts    # ReferentielPackageBalance (sous-ensemble tolérant)
├── paquet-fiscal-loader.service.ts  # PaquetFiscalPackage
├── referentiel-resolver.service.ts  # org → ReferentielRef (read-model) ; hook 080 pour le fiscal
├── referentiel.errors.ts            # erreurs typées
├── referentiel-http.mapper.ts       # erreurs → HTTP explicites
├── stamps.ts                        # tampons effectifs (fonctions pures)
├── types/referentiel-package.ts     # contrat TS **permissif en lecture**
├── dto/referentiel-diagnostic.dto.ts
├── referentiel.controller.ts
├── referentiel.module.ts
└── assets/{syscohada-revise-2.1,sfd-bceao-2.0,paquet-fiscal-togo-2026}.json
```

### Manifestes (valeurs à livrer)

| Clé | Locator | sha256 attendu | Tag balance |
|---|---|---|---|
| `syscohada-revise@2.1` | `syscohada-revise-2.1.json` | `01b892c057fa3d5647f5dc975003f6eb6e305f096268315842a40c14eb59c67b` | `SN` |
| `sfd-bceao@2.0` | `sfd-bceao-2.0.json` | `ee9bf014aa21e06d611ed1d964093f234efe24a66d099df7408f1dfa60dd11fe` | `SFD-BCEAO` |
| `smt-togo@1.0` | — (**non packagé**, D-078-3) | — | `SMT` |
| `togo@2026` (fiscal) | `paquet-fiscal-togo-2026.json` | *calculé au dev, imprimé par le script de copie* | — |

⚠️ Le checksum doit être le **vrai** sha256 de l'artefact embarqué. Un placeholder ferait échouer **tout** chargement (utile en test négatif, jamais en valeur livrée).

### Contrat TS local — permissif en lecture (D-078-2)

```ts
export interface ReferentielPackageBalance {
  meta: { code: string; version: string; libelle: string; checksum: string; date?: string };
  regles: Record<string, string>;
  planDeComptes: CompteReferentiel[];   // ?? [] — tolérant
  // postes / tableDePassage / notes / paquetFiscal : présents dans l'artefact, **non typés ici, non lus**
}
export interface PaquetFiscalPackage {
  meta: { pays: string; annee: number; devise: string; statut: string; checksum: string };
  [rubrique: string]: unknown;          // tva, is, irpp, mfp… — données pures, non interprétées en 078
}
```

Le parse **refuse** un artefact dont `meta.code@version` (resp. `pays@annee`) **ne correspond pas** à la clé demandée — garde-fou contre un locator mal câblé. Le `meta.checksum` est **injecté par le loader** après vérification (un artefact ne peut pas contenir son propre hash) ; pour le paquet fiscal, `pays`/`annee` sont lus depuis `_meta` de la source.

### Erreurs → HTTP

| Erreur | HTTP | Code |
|---|---|---|
| `ReferentielEntitlementInactiveError` | 403 | `BALANCE_NOT_ENTITLED` (générique, aligné gate) |
| `ReferentielUnresolvedError` | 409 | `REFERENTIEL_UNRESOLVED` |
| `ReferentielNonPackageError` | 409 | `REFERENTIEL_NON_PACKAGE` |
| `ArtefactIntegrityError` | 502 | `REFERENTIEL_INTEGRITY` / `PAQUET_FISCAL_INTEGRITY` |
| `ArtefactUnavailableError` | 503 | `..._UNAVAILABLE_TRANSIENT` (retryable) |
| `ArtefactNotFoundError` / `ArtefactParseError` | 500 | `..._UNAVAILABLE` (lacune de configuration serveur) |

### Configuration

```env
PAQUET_FISCAL_PAR_DEFAUT=togo@2026   # optionnel ; format ^[a-z0-9-]+@\d{4}$ ; défaut togo@2026
```
Validé par `class-validator` dans `env.validation.ts` (**le boot échoue** si malformé) et typé dans `configuration.ts`. Documenté comme **temporaire** : STORY-080 le remplace par la résolution profil (pays + régime + année d'exercice).

### Sécurité / robustesse

- Locator restreint à `^[A-Za-z0-9._-]+$` **et** chemin résolu contraint au répertoire `assets` (défense en profondeur, même si le registre est source de confiance).
- **Intégrité d'abord** : aucun objet n'est parsé, mis en cache ni renvoyé sans sha256 conforme.
- Journalisation **par hash et par clé** — jamais le contenu d'artefact (les taux sont publics, mais la règle « ne jamais logger de payload » reste).
- Cache **non borné** volontairement (poignée d'artefacts) et ne contenant **que** du vérifié.
- Endpoint derrière `Throttler → JwtAuth → EmailVerified → Roles` + `@RequiresBalanceAccess` ; org d'un autre tenant : rien à croiser (résolution keyée par le `org` du JWT).

### Edge cases

- Deux `load` concurrents, même clé → **un** fetch (inflight partagé), clé libérée **en cas d'échec aussi** (ne jamais geler la clé).
- Org migrant de référentiel (`2.1` → `2.2`) : les deux versions **coexistent** en cache (clés distinctes) — aucune invalidation nécessaire.
- Artefact présent mais JSON invalide / structure inattendue → `ParseError` (500), pas de crash process.
- `PAQUET_FISCAL_PAR_DEFAUT` pointant une année non packagée → **409** explicite (`PAQUET_FISCAL_NON_PACKAGE`), pas un 500.
- Champs additifs futurs du paquet SYSCOHADA (B8/B9) → **ignorés silencieusement**, le chargement reste vert (contrat permissif).

---

## Dependencies

**Prérequis (tous ✅ done)**
- STORY-076 — scaffold `balance-service` (guards, config, health, Kafka dégradé).
- STORY-077 — read-models `OrgBalanceEntitlement` (**porte `referentiel`**) + gate `@RequiresBalanceAccess`.
- STORY-101 — contrat de balance canonique (tag `REFERENTIELS_BALANCE`).
- STORY-032/033 (catalog) — `ReferentielVersion` publiée `{artifactUri, checksum}` (C3 : le catalog ne stocke que le pointeur).
- STORY-038/056/120 (bilan) — **artefacts source de vérité** + générateur déterministe `build.mjs`.

**Cette story débloque**
- STORY-080 — 2 axes système/régime : remplace `PAQUET_FISCAL_PAR_DEFAUT` par la résolution profil.
- STORY-085/087 — rattachement compte→plan comptable, comptes hors plan (FR-A07).
- STORY-091+ (EPIC-021) — moteur fiscal : consomme le paquet fiscal **et** son tampon.
- STORY-096-098 — DSF/déclarations : mêmes taux, même traçabilité.

**Externes** — aucune (source embarquée ; MinIO/OCI différé, le port est le seam).

---

## Definition of Done

- [ ] Lint **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0`, binaire local).
- [ ] `npm run build` OK — **vérifier que `dist/` contient bien les `assets/*.json`** (entrée `nest-cli.json`).
- [ ] `npm run test:cov` ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (seuils **jamais** abaissés).
- [ ] `npm run test:e2e` vert (diagnostic 200 + chaque code d'erreur).
- [ ] Non-régression : suites `balance`, `sage`, `read-models`, `outbox` **inchangées** et vertes.
- [ ] Swagger `/api/docs` : endpoint + tous les codes documentés.
- [ ] **Vérification docker réelle** (stack neuve `docker compose down -v && up --build`) consignée dans *Progress Tracking* :
  1. jeton tenant habilité `balance` (seed admin → org → entitlement `balance` ACTIVE avec `referentiel: syscohada-revise@2.1`) ;
  2. `GET /api/v1/referentiels/actifs` → **200**, checksum renvoyé **égal** à `01b892c0…67b`, `cache: 'miss'` puis `'hit'` au 2ᵉ appel ;
  3. **preuve d'intégrité** : altérer un octet de l'asset **dans le conteneur** puis redémarrer le service (cache vidé) → **502 `REFERENTIEL_INTEGRITY`**, et aucun paquet servi ; restaurer → 200 ;
  4. `docker exec` sur le conteneur pour montrer que `dist/modules/referentiel/assets/` est bien peuplé ;
  5. org **sans** référentiel projeté → **409 `REFERENTIEL_UNRESOLVED`**.
- [ ] Aucun secret/donnée sensible journalisé ; aucun taux en dur dans le code.
- [ ] Statut synchronisé aux **3 endroits** (en-tête, `sprint-status.yaml` + commentaire daté, *Progress Tracking*) + `completed_date` à la clôture.

---

## Story Points Breakdown

| Lot | Points |
|---|---|
| Socle générique (port, source embarquée, loader cache/single-flight, erreurs, mapper) | 2 |
| Deux registres + artefacts embarqués + specs de cohérence d'octets | 1 |
| Résolution org (read-model) + pont tag↔ref + config fiscale par défaut + tampons | 1 |
| Endpoint diagnostic + DTO + e2e + vérification docker | 1 |
| **Total** | **5** |

**Rationale :** aucune inconnue d'architecture (patron STORY-038 éprouvé, artefacts déjà générés), mais surface réelle : 2 axes d'artefacts, 7 chemins d'erreur, cache concurrent et une exigence de **byte-identité inter-services** à verrouiller par test.

---

## Risques & Blockers

| # | Risque | Mitigation |
|---|---|---|
| R1 | **Dérive des octets** entre les copies bilan/balance d'un même artefact | Spec d'égalité de checksum (AC-5), échec bloquant ; source de vérité unique = `build.mjs` du bilan ; finding F-078-1 pour le passage au registre distant |
| R2 | Deux sources de vérité fiscales (`paquetFiscal` du référentiel *vs* registre fiscal) | D-078-1 : le champ embarqué n'est **jamais** lu côté balance ; test négatif dédié (AC-4) |
| R3 | Taux fiscaux togolais **non validés** par un professionnel (`statut` du paquet le dit) | Le `statut` est **exposé** par le diagnostic ; blocker MV ci-dessous ; 078 ne calcule rien |
| R4 | Cache non borné | Assumé (poignée d'artefacts) et documenté, comme côté bilan |

**Blockers MV (hors code, à porter à l'utilisateur)**
- **B1 — Packaging SMT** : plan de comptes + table de passage SMT absents des sources (D-078-3). Nécessite des sources officielles + validation experte avant packaging.
- **B2 — Validation fiscaliste** du `paquet-fiscal-togo-2026` (statut « COMPLET, reste la VALIDATION par un expert-comptable/fiscaliste togolais »).
- **B3 — Année fiscale cible** : confirmer la loi de finances en vigueur pour l'exercice (l'édition OTR 2025 consolide jusqu'à la LF 2023).

---

## Additional Notes

- **Cette story a été *révisée*, pas créée de zéro.** Un cadrage existait depuis le 2026-07-12 (`ready-for-dev`, commit `a0f8883`). La révision du 2026-07-22 en conserve les exigences (immutabilité par exercice, `isCompteValide`, endpoint `referentiels/actifs`, interdiction de toute valeur par défaut) et **corrige** ce qui n'était pas livrable en l'état :
  - le **paquet fiscal est chargé depuis son propre registre**, pas depuis le champ embarqué dans l'artefact comptable (D-078-1) — l'original ne tranchait pas, et le champ embarqué s'est révélé **périmé** (F-078-1) ;
  - **SMT n'est pas packagé** : l'original supposait « deux plans distincts, chargés du même artefact », or **aucun plan SMT n'est sourcé** (D-078-3) ;
  - le **gabarit de liasse** (FR-A06) reste hors périmètre : `balance-service` n'en a aucun usage avant le rendu, qui appartient au `bilan-service` ;
  - le chargement passe par la **source embarquée**, pas par un appel HTTP au catalog : l'original prévoyait déjà ce repli (« à défaut, loader depuis un artefact local packagé derrière la même interface ») — c'est exactement le rôle du port `ArtifactSource`.
- **Ordre de sprint** : 078 appartient au sprint 16 (EXTENDED) alors que le sprint 15 porte encore 120-122 `in_progress`. Développée **en avance** à la demande — aucune dépendance arrière, elle ne bloque ni ne dépend de 120-122.
- **Seam registre distant** : le jour où le catalog sert `artifactUri` + `checksum` depuis MinIO/OCI, seule une **nouvelle implémentation d'`ArtifactSource`** est liée au jeton — loader, registres, moteur et contrôleur restent **inchangés**. À tracer en finding.
- **Zone franche / CIMA** (`zone-franche-togo@1.0`, `cima-assurances@1.0`) : hors périmètre 078 (aucun tag balance correspondant aujourd'hui) — une ligne de manifeste suffira le jour venu, ce qui est précisément ce que prouve AC-6.

---

## Progress Tracking

**Historique des statuts**
- 2026-07-12 : cadrée (`ready-for-dev`) avec le lot EXTENDED S15-S16 (commit `a0f8883`).
- 2026-07-22 : révisée (cadrage aligné sur le livrable réel — voir *Additional Notes*).
- 2026-07-22 : implémentée (`in_progress` → `review`) — branche `MNV-078`.
- 2026-07-22 : `/code-review` — 3 défauts corrigés (voir ci-dessous), couverture de branches remontée de 90.00 % (pile sur le seuil) à 90.54 %.
- 2026-07-22 : `/security-review` — **aucune vulnérabilité exploitable** (path traversal, intégrité sha256, cache inter-tenant, isolation, fuite d'information, journalisation, injection NoSQL, désérialisation).
- 2026-07-22 : **rebase-mergée dans `dev`** (balance-service #6) et `main` (docs #33) — `review` → `done`.

**Effort réel :** 5 points (conforme à l'estimation).

### Ce qui a été livré

`balance-service/src/modules/referentiel/` — socle générique `ArtefactLoader` (fetch → sha256 →
parse → cache + single-flight) spécialisé en **deux** loaders (`ReferentielLoader`,
`PaquetFiscalLoader`), port `ArtifactSource` + `BundledArtifactSource`, deux registres
(`ReferentielRegistry` avec pont tag exhaustif, `PaquetFiscalRegistry`), `ReferentielResolver`
(read-model → références, **immutabilité par exercice**, + hook 080), erreurs typées + mapper HTTP,
tampons effectifs, prédicat **`isCompteValide`** (rattachement par préfixe),
façade `ReferentielService`, endpoint `GET /api/v1/referentiels/actifs`.
Artefacts embarqués : `syscohada-revise-2.1.json`, `sfd-bceao-2.0.json` (octets identiques bilan),
`paquet-fiscal-togo-2026.json` (produit par `scripts/referentiels/build.mjs`, sha256
`49eae01315d93531d72d7443f0e94a18bb261837904228bc88fe490bc5dda85e`).
Câblage : `nest-cli.json` (assets → `dist/`), `PAQUET_FISCAL_PAR_DEFAUT` (env validé + config),
`AppModule`, et `docker-compose.yml` (`BALANCE_PAQUET_FISCAL_PAR_DEFAUT:-togo@2026`).

### Qualité

| Contrôle | Résultat |
|---|---|
| Lint (`eslint --max-warnings 0`) | **0 warning** |
| Build (`nest build`) | OK — `dist/modules/referentiel/assets/` peuplé (3 fichiers) |
| Unitaires + couverture | **379 tests / 45 suites** verts — **98.93 st / 90.54 br / 99.08 fn / 99.16 li** (seuils 65/90/90/90) ; module `referentiel` **100 / 93.9 / 100 / 100** |
| E2E | **58 tests / 6 suites** verts, dont 12 nouveaux sur `GET /api/v1/referentiels/actifs` |
| Non-régression | suites `balance`, `sage`, `read-models`, `outbox`, `health` inchangées et vertes |

### Vérification docker réelle (stack neuve `down -v && up --build`, 2026-07-22)

Org de test `6a60a2d47af9f0d42a29c263` (`Cabinet Test 078`), entitlement `balance` octroyé au
`platform-catalog-service` puis **projeté par la vraie chaîne Kafka** — le champ `referentiel`
du read-model, projeté sans lecteur depuis STORY-077, est arrivé intact :
`{ code: 'syscohada-revise', version: '2.1' }`. *(Le read-model KYC a été semé directement en base :
sa chaîne Kafka relève de la vérification de STORY-077, pas de 078, qui ne fait que franchir la gate.)*

| # | Contrôle | Résultat |
|---|---|---|
| 1 | Résolution depuis le read-model réel | ✅ référentiel de l'org lu, aucun appel réseau au catalog |
| 2 | `GET /api/v1/referentiels/actifs` | ✅ **200** — checksum `01b892c0…67b` (= manifeste bilan), `planCount: 174`, `reglesCount: 5`, `integrity: verified`, `cache: miss` puis **`hit`** au 2ᵉ appel (idem fiscal) |
| 2-bis | Paquet fiscal | ✅ `togo@2026`, checksum `49eae013…85e`, **15 rubriques**, devise `XOF`, statut « COMPLET … reste la VALIDATION par un expert-comptable/fiscaliste » **exposé** |
| 3 | Intégrité — artefact altéré d'**un octet** dans le conteneur (`ee9bf014…` → `5c16d431…`) | ✅ **502 `REFERENTIEL_INTEGRITY`**, rien servi ; journal serveur = `référentiel sfd-bceao@2.0 rejeté (checksum non conforme)` — **clé seule, aucun contenu** ; après restauration → **200** avec `ee9bf014…` |
| 4 | Assets embarqués dans l'image | ✅ `dist/modules/referentiel/assets/` : 3 artefacts (90 650 / 31 736 / 17 506 octets) |
| 5 | Org habilitée **sans** référentiel projeté | ✅ **409 `REFERENTIEL_UNRESOLVED`** |
| 5-bis | Référentiel **SMT** (déclaré, non packagé) | ✅ **409 `REFERENTIEL_NON_PACKAGE`** avec le motif complet (sources non disponibles) |

⚠️ **Le premier essai du contrôle 3 a produit un faux succès** et a été refait : altérer `dist/` **puis**
redémarrer déclenche le rebuild `nest start --watch` (override dev, `src/` monté), qui **régénère
l'artefact** — la réponse était un `200` sur un fichier redevenu sain. Séquence correcte retenue :
redémarrer d'abord (cache vide), **puis** altérer `dist/`, **puis** appeler — et choisir un référentiel
**pas encore chargé** dans le process, sinon le cache-first le sert légitimement. Contrôle avant/après
du sha256 à chaque étape (cf. mémoire « vérifier sur stack docker neuve »).

### Findings

- **F-078-1 — le paquet fiscal embarqué dans l'artefact comptable est périmé.** L'artefact
  `syscohada-revise@2.1` fige un `paquetFiscal` au statut **AMORCE** (il sert la présentation de la
  liasse côté bilan) alors que l'artefact fiscal autonome est **COMPLET** et porte **6 rubriques de
  plus** (barème IRPP, CNSS, retenues à la source, TAF, TCA, droits d'accises). C'est la
  **justification factuelle** de D-078-1, verrouillée par une spec dédiée. À porter à l'attention du
  `bilan-service` s'il venait à consommer ce champ pour autre chose que de la présentation.
- **F-078-2 — dérive possible des artefacts entre services.** Les octets sont dupliqués
  (`bilan-service` = source de vérité). Mitigé par la spec d'égalité de checksum, mais la vraie
  sortie est le **registre distant** (C3, MinIO/OCI servi par le catalog) : le port `ArtifactSource`
  est le seam, une seule liaison à changer.
- **F-078-3 — `PAQUET_FISCAL_PAR_DEFAUT` est un pis-aller.** Une org d'un autre pays recevrait
  aujourd'hui le paquet togolais. Sans conséquence en 078 (rien n'est calculé), **bloquant** dès
  EPIC-021 → STORY-080 doit livrer la résolution par profil **avant** tout calcul fiscal.

### Blockers MV (hors code)

- **B1 — packaging SMT** : plan de comptes + table de passage non sourcés (D-078-3).
- **B2 — validation fiscaliste** du paquet Togo 2026 (le statut le dit lui-même).
- **B3 — année de loi de finances cible** à confirmer (édition OTR 2025 consolidée jusqu'à la LF 2023).

---

*Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning).*

---

## Revue (2026-07-22)

### `/code-review` — 3 défauts corrigés

1. **Le paquet fiscal ne vérifiait que l'ANNÉE.** Le parse comparait `meta.annee` à la demande puis renvoyait `pays: ref.pays` — le pays **demandé**, jamais celui déclaré par l'artefact. Une entrée de manifeste mal câblée (`benin@2026` → artefact togolais) franchissait checksum **et** année : le service aurait servi des **taux étrangers sous le bon libellé**, sans qu'aucun contrôle ne bronche. Le code ISO attendu est désormais déclaré au manifeste (`EntreePaquetFiscal.paysSource`) et vérifié au parse.
2. **Tri mort + commentaire faux dans `isCompteValide`.** Le tri des racines n'avait aucun effet sur un `.some()` booléen, et son commentaire promettait une sémantique de spécificité que le code n'implémente pas — piège pour la story qui devra renvoyer la racine rattachée (FR-A07). Remplacé par un `Set` ; l'implémentation devient la **fonction pure exportée** `estCompteRattachable`, la méthode n'en étant qu'une liaison (un paquet chargé n'est donc pas sérialisable — désormais documenté au lieu d'être contredit par l'en-tête « données pures »).
3. **Couverture de branches à exactement 90.00 %**, soit pile sur le seuil : la PR suivante cassait la CI. Deux tests sur des gardes réelles (locator `..`/`.` arrêté par la borne de répertoire, entrée de manifeste disparue entre fetch et parse) → **90.54 %**.

### `/security-review` — aucune vulnérabilité exploitable

Axes couverts : authentification, autorisation, injection, web, fichiers, cryptographie, infrastructure, logique métier, NestJS.

- **Path traversal** : le `locator` ne provient jamais du client (constante de manifeste) ; les deux gardes sont chacune nécessaire — `..` et `.` franchissent le filtre de caractères et sont arrêtés par la borne de répertoire.
- **Intégrité sha256** : comparaison **avant** `JSON.parse` et **avant** mise en cache ; ni `has()`, ni le single-flight, ni le `finally` de libération de clé n'ouvrent de brèche.
- **Cache inter-tenant** : aucune donnée tenant n'y transite ; l'unique voie d'écriture exige un artefact conforme au manifeste ; une clé inconnue lève sans rien mettre en cache.
- **Isolation** : `organizationId` exclusivement issu du claim `org` du JWT, aucun identifiant adressable (donc pas d'IDOR), contrôle d'entitlement rejoué en défense en profondeur.
- **Fuite d'information** : hash (502) et chemins de fichiers (503) ne quittent jamais le serveur.

Observations écartées : le paquet fiscal identique pour toutes les orgs (justesse métier, F-078-3) et le motif du 409 SMT (divulgation négligeable, volontaire).
