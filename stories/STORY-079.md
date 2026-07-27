# STORY-079 : Profil société — modèle + CRUD (NIF, RCCM, CNSS, actionnaires, forme juridique, gérant) keyé `orgId`

**Epic :** EPIC-018 — Profil société & régime
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A01 · `rapport-bilan-logique-metier-2026-07-12.md` §12 (fiches d'identification de la GUIDEF) · GUIDEF Togo (`1000745307_2025_Definitif.xlsx`, feuilles « Page de garde » / « Identification » / « Dirigeants »)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high — *isolation multi-tenant fail-closed (NFR-A02) + écriture **multi-documents** (profil + audit append-only) exigeant une transaction Mongo.*
**Statut :** done ✅ — clôturée le **2026-07-27** (PR #8 rebase-mergée sur `dev`)
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12 · **révisée le** 2026-07-27 (cadrage aligné sur le code réel de `balance-service` — cf. § Écarts de rédaction)
**Sprint :** 15 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A01 (profil société)

> **L'identité fiscale du dossier — sans laquelle rien ne se calcule.** Le pays détermine le paquet fiscal (STORY-078), l'objet et le CA déterminent le régime (STORY-080), le NIF/RCCM/CNSS remplissent la **page de garde de la DSF**. Cette story pose le **modèle de profil société** et son CRUD, keyé `orgId`. Les champs sont ceux **réellement exigés par la GUIDEF** (fiches d'identification, dirigeants, actionnaires) — pas une invention. Le **pré-remplissage par OCR** des Statuts et de la carte CFE vient juste après (STORY-081) ; ici, la saisie est **manuelle et complète**.

---

## User Story

En tant que **cabinet comptable** (ou distributeur) traitant un dossier client,
je veux **saisir et maintenir l'identité fiscale complète de la société** (NIF, RCCM, CNSS, forme juridique, capital, objet/activité, dirigeants, actionnaires),
afin que le système **détermine le bon régime**, **applique le bon paquet fiscal**, et **remplisse la page de garde de la DSF** sans ressaisie.

---

## Description

### Contexte

La **DSF (GUIDEF)** s'ouvre sur des fiches d'identification que le comptable remplit aujourd'hui à la main, chaque année : raison sociale, sigle, **NIF**, **RCCM**, **CNSS**, forme juridique, capital, date de création, **activité (code NAEMA)**, adresse, dirigeants, actionnaires et leurs parts. Ces mêmes données conditionnent **le calcul** :

- **`pays`** → quel **paquet fiscal** charger (STORY-078 : `TG@2026`) ;
- **`activité` + `chiffre d'affaires`** → quel **régime** proposer (STORY-080 : réel vs synthétique/TPU ; SN vs SMT) ;
- **`forme juridique`** → assujettissement IS vs IRPP ;
- **`capital` / `actionnaires`** → notes annexes de la liasse.

Le profil est donc **une donnée de calcul**, pas seulement de l'état civil. Il est **keyé `orgId`** (multi-tenant, NFR-A02) et **versionné dans le temps** (une société change d'adresse, de gérant, de capital — et la DSF de 2026 doit refléter l'état **de 2026**).

> **Ownership (question ouverte PRD §13, tranchée ici).** `auth-service` possède l'**identité de compte** (`Organization`: nom, statut). `balance-service` possède le **profil fiscal métier** (NIF, RCCM, CNSS, capital, dirigeants…) — il **ne duplique pas** le nom/statut, il **référence** l'`orgId`. Le read-model d'identité (STORY-077) fournit le reste. À reconfirmer si `auth-service` devait un jour porter ces champs.

### Périmètre

**Inclus :**

- **Modèle `ProfilSociete`** (collection `profils_societe`, clé unique `orgId`), champs alignés sur la GUIDEF :
  - **Identification** : `raisonSociale`, `sigle?`, `formeJuridique` (SA/SARL/SAS/SUARL/EI…), `nif`, `rccm`, `numeroCnss?`, `dateCreation`, `pays` (ISO-2, ex. `TG`), `devise` (`XOF`).
  - **Activité** : `objetSocial` (texte), `codeNaema?` (nomenclature d'activité), `secteur?`.
  - **Capital & actionnariat** : `capitalSocial` (XOF), `actionnaires: [{ nom, parts, pourcentage, type: PHYSIQUE|MORALE }]` (somme des % contrôlée ≈ 100).
  - **Contacts / dirigeants** : `adresse`, `email`, `telephone`, `dirigeants: [{ nom, fonction, nif? }]` (au moins un gérant/DG).
  - **Régime** (rempli par **STORY-080**, pas ici) : `systemeComptable?: 'SN'|'SMT'`, `regimeFiscal?: 'REEL'|'SYNTHETIQUE'`.
- **CRUD** (`@RequiresBalanceAccess`, isolation `orgId` stricte) :
  - `POST /api/v1/profil-societe` → **201** (crée ; 409 si déjà existant pour l'org).
  - `GET /api/v1/profil-societe` → **200** (profil de **l'org du JWT** — jamais d'`orgId` en paramètre, cf. risque data-leak).
  - `PATCH /api/v1/profil-societe` → **200** (mise à jour partielle, validée).
  - Pas de `DELETE` dur (un profil se **désactive**, il ne s'efface pas — piste d'audit NFR-A07).
- **Validation** (DTO stricte, `ValidationPipe`) :
  - `nif`, `rccm` : format **paramétrable par pays** (le format togolais ≠ ivoirien) → règle lue depuis le **paquet pays** (STORY-078) ou, à défaut, validation de longueur/charset + **avertissement non bloquant**.
  - `pays` ∈ pays supportés (paquet fiscal disponible) ; sinon **400** explicite. ⚠️ Le manifeste de STORY-078 est keyé `togo@2026` (nom en minuscules), pas ISO-2 : la correspondance passe par le champ **`paysSource`** (`TG`) déjà porté par chaque entrée. Ajout minimal `PaquetFiscalRegistry.paysSupportes(): string[]` (codes ISO-2 distincts, dérivés du manifeste) — **lecture seule, aucun taux, aucune ligne de code par pays** (NFR-A06).
  - Somme des `pourcentage` des actionnaires ≈ **100 %** (tolérance 0,01) → sinon **avertissement** (pas bloquant : un profil peut être incomplet en cours de saisie).
  - `capitalSocial ≥ 0`, `dateCreation` passée.
- **Complétude** : `GET /api/v1/profil-societe/completude` → `{ complet: bool, champsManquants: string[] }` — indique ce qui **bloque** la production de la DSF (ex. NIF absent) vs ce qui est **optionnel**.
- **Historisation** : toute modification écrit une entrée d'audit (`qui`, `quand`, `champ`, `avant`, `après`) — append-only (NFR-A07). Le profil « en vigueur à la clôture N » est reconstituable.
- **Tests** : CRUD + isolation org (l'org A ne lit jamais le profil de l'org B) ; validations ; complétude ; historisation ; 409 sur doublon.

**Hors périmètre :**

- **Pré-remplissage OCR** (Statuts + carte CFE) → **STORY-081** (même sprint). Ici, saisie **manuelle**.
- **Détermination du régime** (2 axes SN/SMT × réel/TPU) → **STORY-080** (consomme `pays`, `objetSocial`, CA).
- **Rendu des fiches d'identification dans la liasse** → `bilan-service` (EPIC-011), qui **lira** ce profil.
- **Gestion des utilisateurs/rôles de l'org** → `auth-service` (déjà livré).
- **Branchement du `pays` du profil sur `ReferentielResolver.resoudrePaquetFiscal()`** → **STORY-080**. Le hook est déjà posé et documenté par STORY-078 (le pays vient encore de `PAQUET_FISCAL_PAR_DEFAUT`). **079 ne touche pas ce corps** : elle produit la donnée, 080 la consomme. Y toucher ici serait un débordement de périmètre.
- **Publication d'un événement Kafka** (`profil.societe.*`) : aucun consommateur n'existe. Pas d'outbox dans cette story.

### Flux

1. Le cabinet crée un dossier client → `POST /api/v1/profil-societe` avec les champs connus (raison sociale, forme juridique, pays…).
2. Validation : `pays = TG` supporté (paquet `TG@2026` disponible — STORY-078) ✔ ; NIF au bon format ✔ ; actionnaires ≈ 100 % ✔.
3. **201 Created**. `GET /completude` → `{ complet: false, champsManquants: ['numeroCnss', 'codeNaema'] }`.
4. Le cabinet complète au fil de l'eau (`PATCH`) ; chaque modification est **historisée**.
5. **STORY-080** lit `pays` + `objetSocial` + CA (de la balance) → **propose** le régime ; le cabinet **confirme**.
6. **STORY-078** utilise `pays` + l'exercice pour résoudre le **paquet fiscal**.
7. À la production de la liasse, `bilan-service` lit le profil pour la **page de garde** de la DSF.

---

## Acceptance Criteria

- [ ] **Modèle `ProfilSociete`** persisté (collection `profils_societe`), **clé unique `orgId`**, avec tous les champs GUIDEF listés (identification, activité, capital/actionnaires, contacts/dirigeants).
- [ ] **CRUD** protégé par `@RequiresBalanceAccess` : `POST` **201** (409 si doublon), `GET` **200**, `PATCH` **200**. **Pas de suppression dure.**
- [ ] **Isolation multi-tenant stricte (NFR-A02)** : l'`orgId` provient **du JWT**, **jamais** d'un paramètre client → un utilisateur de l'org A ne peut **pas** lire/modifier le profil de l'org B (test e2e dédié : **404/403**, pas de fuite).
- [ ] **Validations** : `pays` supporté (sinon **400** explicite) ; `capitalSocial ≥ 0` ; `dateCreation` passée ; somme des parts actionnaires ≈ 100 % (**avertissement**, non bloquant) ; formats NIF/RCCM **paramétrés par pays** (**avertissement non bloquant** si non conforme — jamais un rejet).
- [ ] **`GET /completude`** retourne `{ complet, champsManquants[] }` en distinguant les champs **bloquants** pour la DSF des champs optionnels.
- [ ] **Historisation** : chaque `PATCH` écrit une entrée d'audit **append-only** (`qui/quand/champ/avant/après`) **et incrémente `version`**, dans la **même transaction** que la mise à jour du profil ; le profil « en vigueur » à une date est reconstituable.
- [ ] **Aucun statut de compte dupliqué** depuis `auth-service` : le `status` de l'`Organization` n'est **jamais** recopié, seul l'`orgId` est référencé. `raisonSociale` **n'est pas** un doublon du `name` de compte — c'est la **dénomination légale déclarée à la DSF**, possédée par `balance-service`, ni synchronisée ni écrasée depuis `identity.*`.
- [ ] **Tests** : CRUD, 409 doublon, isolation org (e2e), validations, complétude, historisation. **Coverage ≥ 90 %.**
- [ ] **Swagger** documenté (201/200/400/403/409) ; **CI verte**.

---

## Technical Notes

### Schéma

```typescript
export interface ProfilSociete {
  orgId: Types.ObjectId;             // clé unique — vient du JWT, jamais du client
                                     // (ObjectId, comme `Balance.orgId` — cohérence de service)

  // Identification (GUIDEF — page de garde)
  raisonSociale: string;
  sigle?: string;
  formeJuridique: 'SA' | 'SARL' | 'SAS' | 'SUARL' | 'EI' | 'AUTRE';
  nif: string;
  rccm: string;
  numeroCnss?: string;
  dateCreation: Date;
  pays: string;                      // ISO-2 — 'TG' ; conditionne le paquet fiscal (STORY-078)
  devise: string;                    // 'XOF' (v1 : mono-devise)

  // Activité
  objetSocial: string;
  codeNaema?: string;
  secteur?: string;

  // Capital & actionnariat
  capitalSocial: number;             // XOF
  actionnaires: Array<{
    nom: string;
    type: 'PHYSIQUE' | 'MORALE';
    parts: number;
    pourcentage: number;             // Σ ≈ 100
  }>;

  // Contacts & dirigeants
  adresse: string;
  email?: string;
  telephone?: string;
  dirigeants: Array<{ nom: string; fonction: string; nif?: string }>;

  // Régime — rempli par STORY-080 (2 axes orthogonaux)
  systemeComptable?: 'SN' | 'SMT';
  regimeFiscal?: 'REEL' | 'SYNTHETIQUE';

  actif: boolean;                    // désactivation, pas de suppression dure
  version: number;                   // monotone, incrémenté À CHAQUE PATCH dans la transaction
                                     // d'audit. `updatedAt` ne suffit pas : il ne donne pas de
                                     // discriminant d'ordre citable. C'est ce champ que le
                                     // `SnapshotLiasse` de bilan-service (EPIC-012) devra citer
                                     // pour figer « le profil en vigueur à la clôture N », et
                                     // qui fera de l'événement futur un état absolu versionné.
                                     // Un champ aujourd'hui = une migration évitée demain.
  createdAt: Date;
  updatedAt: Date;
}

db.profils_societe.createIndex({ orgId: 1 }, { unique: true });
```

> **Une organisation = une société.** L'unicité `orgId` en fait une **porte à sens unique**, assumée : elle
> est cohérente avec tout l'existant du service (`balances` est unique sur `(orgId, exercice, source,
> version)` — aucune notion de « dossier »). Un cabinet qui gère 20 clients aura **20 organisations**.
> La prose « dossier client » de cette story désigne donc l'org du JWT, **pas** un sous-agrégat à inventer.

### Isolation — le piège à éviter

```typescript
// ❌ JAMAIS : l'orgId ne vient pas du client
@Get('/profil-societe/:orgId')
async get(@Param('orgId') orgId: string) { /* data leak */ }

// ✅ TOUJOURS : l'orgId vient du JWT validé.
// ⚠️ `@TenantContext()` (décorateur de paramètre) N'EXISTE PAS dans balance-service :
// `TenantContext` y est un *service* injectable (cls). Le décorateur réellement
// disponible est `@CurrentUser` — même patron que `BalanceController`.
@Get('/profil-societe')
@Roles(Role.TENANT_ADMIN, Role.TENANT_USER)
@RequiresBalanceAccess()
async get(@CurrentUser() user: AuthenticatedUser) {
  return this.profilService.getByOrg(user.tenantId);  // `tenantId` null ⇒ refus fail-closed
}
```

`tenantId` est **`null` pour un `PLATFORM_ADMIN`** : le service doit refuser explicitement
(pas de `findOne({ orgId: null })` qui renverrait un document au hasard). Fail-closed.

### Historisation (append-only) — écriture **multi-documents** ⇒ transaction

```typescript
interface ProfilSocieteAudit {
  orgId: Types.ObjectId;
  champ: string;          // 'capitalSocial'
  avant: unknown;
  apres: unknown;
  parUserId: string;
  le: Date;
}
// Jamais d'UPDATE/DELETE sur cette collection (NFR-A07).
```

Un `PATCH` écrit **≥ 2 documents** (le profil + 1..n entrées d'audit) : c'est exactement le
cas que `.agents/rules/transactions-mongo.md` couvre → `session.withTransaction`, ObjectId
pré-générés, abort gardé. Un profil modifié **sans** son audit (ou l'inverse) casserait la
reconstitution « état en vigueur à la clôture N » — l'invariant même de l'AC d'historisation.
**À prouver en vérif docker**, pas au mock e2e.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Fuite inter-org** (orgId pris du client) | `orgId` **toujours** issu du JWT/`TenantContext` ; test e2e d'isolation obligatoire |
| Duplication de l'identité `auth-service` | Ne stocker **que** le profil fiscal métier ; référencer l'`orgId`. ⚠️ **Il n'existe aucun read-model d'identité dans `balance-service`** (STORY-077 n'a projeté que KYC + entitlement) : ne **pas** en inventer un ici, et surtout ne **pas** combler par un appel REST à l'IdP (invariant 3). `raisonSociale` est une donnée propre, pas une réplication |
| Formats NIF/RCCM variables par pays | Règle **paramétrée** (paquet pays) ; à défaut, **avertissement** non bloquant plutôt qu'un rejet arbitraire |
| Profil incomplet bloque tout | `GET /completude` distingue **bloquant** (NIF) et **optionnel** ; la saisie reste progressive |
| Profil modifié après clôture → DSF N incohérente | **Historisation append-only** : l'état « en vigueur à la clôture » est reconstituable |

---

## Definition of Done

- [ ] Modèle `ProfilSociete` + index unique `orgId`
- [ ] CRUD (POST 201 / GET 200 / PATCH 200 ; 409 doublon ; pas de DELETE dur)
- [ ] Isolation multi-tenant prouvée par **e2e** (org A ≠ org B)
- [ ] Validations (pays supporté, capital, dates, parts ≈ 100 %, formats NIF/RCCM par pays)
- [ ] `GET /completude` (bloquant vs optionnel)
- [ ] Historisation append-only + `version` monotone + test de reconstitution
- [ ] **Écriture profil + audit atomique** (transaction Mongo) — **prouvée en vérif docker**, pas au mock
- [ ] Aucun `status` d'`Organization` recopié ; aucun appel réseau à `auth-service` (grep de non-régression)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : CORE S10 e2e verts

---

## Écarts de rédaction (révision 2026-07-27)

Le cadrage du 2026-07-12 précédait la livraison de STORY-077/078. Quatre points recalés sur le code réel,
**sans changer le périmètre** :

| Rédaction initiale | Code réel | Décision |
|---|---|---|
| `@TenantContext() orgId: string` | `TenantContext` est un **service** cls ; le décorateur de paramètre est `@CurrentUser` | Snippet corrigé ; `tenantId` `null` (PLATFORM_ADMIN) ⇒ refus fail-closed explicite |
| `orgId: string` | `Balance.orgId` est un `Types.ObjectId` | `ObjectId`, par cohérence de service |
| « `pays` ∈ pays supportés » | Le manifeste est keyé `togo@2026`, pas ISO-2 ; le code ISO vit dans `paysSource` | Ajout `PaquetFiscalRegistry.paysSupportes()` (lecture seule) |
| Historisation présentée comme un simple `insert` | `PATCH` = profil + audit = **2 documents** | Transaction Mongo explicitée + portée en DoD et en vérif docker |
| « nom/statut lus du read-model (STORY-077) » | **Aucun read-model d'identité n'existe** dans `balance-service` : 077 n'a projeté que KYC + entitlement | AC reformulé — `raisonSociale` est une **donnée propre** (dénomination DSF), pas une réplication. Interdit maintenu : recopier le `status` d'`Organization`, ou combler par un appel REST à l'IdP |
| Aucun discriminant d'ordre | `updatedAt` seul ne se cite pas | Champ **`version`** monotone ajouté — requis par le `SnapshotLiasse` de `bilan-service` (EPIC-012) |

Le hook `ReferentielResolver.resoudrePaquetFiscal()` (pays encore lu de `PAQUET_FISCAL_PAR_DEFAUT`)
reste **inerte** : il appartient à STORY-080.

---

## Progress Tracking

| Phase | Statut | Note |
|---|---|---|
| Cadrage (révision) | ✅ 2026-07-27 | Branche `MNV-079` sur `docs/` ; 4 écarts recalés ; `Complexité : high` |
| Développement | ✅ 2026-07-27 | Module `src/modules/profil-societe/` + `PaquetFiscalRegistry.paysSupportes()` |
| Validation (lint/build/tests) | ✅ 2026-07-27 | lint 0 warning · build OK · **469 unitaires** + **86 e2e** verts · couverture module **100 / 97.14 / 100 / 100** |
| Vérification docker (persistance + atomicité) | ✅ 2026-07-27 | stack neuve (`down -v`) — voir ci-dessous |
| Revue de code | ✅ 2026-07-27 | Fan-out persistance/NestJS/tests — **aucun bloquant** ; 5 constats corrigés + 2 documentations rectifiées (voir ci-dessous) |
| Revue de sécurité | ✅ 2026-07-27 | **0 vulnérabilité** — isolation tenant, anti-énumération, mass assignment, logs, RBAC, throttler tous verts |
| Intégration `dev` | ✅ 2026-07-27 | **PR #8** rebase-mergée, branche supprimée |

### Vérification docker — 2026-07-27 (stack neuve, `docker compose down -v`)

Deux organisations réelles créées via l'IdP (`register` + `login`, jetons RS256 distincts), read-models
`orgkycstatuses`/`orgbalanceentitlements` semés pour ouvrir la gate. Requêtes `mongosh` directes sur
`balance_service`.

| Invariant | Preuve mesurée |
|---|---|
| Persistance réelle | `db.profils_societe.findOne()` → document complet ; collections `profils_societe` + `profils_societe_audit` bien en **snake_case** |
| Index unique `orgId` | `getIndexes()` → `{"k":{"orgId":1},"u":true}` |
| 409 sur doublon | 2ᵉ `POST` org A → **409** |
| **Isolation multi-tenant** | org B lit `GET /profil-societe` → **404** (`PROFIL_SOCIETE_INTROUVABLE`), **jamais** le profil de l'org A. Aucun `orgId` client accepté |
| `pays` non supporté | `pays: "FR"` → **400** `PAYS_NON_SUPPORTE` (« supportés : TG ») — dérivé de `paysSource`, pas codé en dur |
| Avertissements non bloquants | parts 70+20 = 90 % + NIF/RCCM hors format → **201** avec 3 avertissements, aucun rejet |
| Historisation + `version` | `PATCH` de 2 champs → `version 1→2`, **2** entrées d'audit (`champ/avant/après/parUserId/le`), valeurs exactes |
| **Atomicité (mutation-test)** | `throw` injecté **dans** la transaction, **après** l'écriture du profil ET l'insert des audits → `500` générique, puis en base : `version` **reste 2**, capital **inchangé**, `numeroCnss` **vide**, **0 audit orphelin**. Mutation retirée, `git diff` vide, `PATCH` suivant → `version 3` + 3ᵉ audit ✅ |

Le rollback porte sur les **deux** collections : c'est la transaction qui le produit, pas un hasard d'ordre
d'écriture — l'échec est déclenché **après** que les deux écritures ont eu lieu.

---

### Revue de code — 2026-07-27 (fan-out persistance / conventions NestJS / tests)

**Aucun constat bloquant.** Les trois axes confirment que l'ossature est saine : `orgId` toujours issu du
JWT (aucun `@Param`/`@Query` dans le module), fail-closed sur `PLATFORM_ADMIN`, verrou optimiste réellement
atomique (`findOneAndUpdate` conditionné, pas un read-then-write), collections en `snake_case` explicite,
index unique réel avec `E11000` mappé, transaction propageant la session à **toutes** les écritures.

**Cinq constats corrigés :**

| # | Constat | Pourquoi ça comptait |
|---|---|---|
| 1 | **L'append-only n'était qu'un JSDoc.** Le modèle étant enregistré via `forFeature`, tout futur module (purge RGPD, reprise OCR de 081) pouvait l'injecter et appeler `deleteMany` sans que rien ne rougisse | Effacer une entrée casse **silencieusement** la reconstitution « état en vigueur à la clôture N » : le profil garde sa `version`, mais l'audit qui permettait d'y revenir a disparu, et le `SnapshotLiasse` d'EPIC-012 cite un `(orgId, version)` non reconstituable. Des hooks `pre()` refusent désormais `UPDATE`/`DELETE`, **gardés par une spec dédiée** |
| 2 | `findOneAndUpdate` **sans `runValidators`** | `min`/`enum`/bornes du schéma étaient morts sur tout le chemin `PATCH`. Sans effet via HTTP (les DTO couvrent), mais le service est `exports`é : un appelant interne (STORY-080) passait à travers |
| 3 | **Asymétrie `actif`** : il entre dans le diff d'audit mais sortait de la projection d'état | Un profil désactivé ressortait de `reconstituerALaDate` avec `actif: undefined`, qu'un consommateur lit comme « actif ». Écrire et relire doivent porter sur le même jeu de champs |
| 4 | `reconstituerALaDate` à une date **antérieure à la création** rendait un profil complet | La version 1 n'étant pas historisée, l'état courant était rejoué tel quel : un `SnapshotLiasse` de l'exercice N-1 aurait figé une page de garde **qui n'a jamais existé**. → 404 |
| 5 | **Index d'audit incomplet** : `listerAudits` trie sur `(le, version)` alors que la clé s'arrêtait à `(orgId, le)` | Tri **en mémoire** (stage `SORT`) sur un dossier suivi plusieurs exercices. `version` ajoutée à la clé |

**Deux documentations rectifiées plutôt que « corrigées »** — le projet interdit les affirmations qu'aucun
mécanisme ne soutient :
- le JSDoc du contrôleur invoquait le piège « route littérale avant route paramétrée » alors que ce
  contrôleur n'a **aucune** route paramétrée : inverser les deux déclarations ne fait rougir aucun test
  (vérifié). Le commentaire dit désormais que la discipline est préventive, pas qu'elle garde un risque réel ;
- le `409` de verrou optimiste est en pratique **rare** : sous transaction réelle, deux `PATCH` concurrents
  produisent un `WriteConflict` que le driver rejoue sur un snapshot frais, et le client reçoit un `200`.

**Mutation-tests des correctifs** (rouges puis restaurés) : hook append-only rendu décoratif → **8 ✕** ;
garde `createdAt > date` retirée → **1 ✕** ; `actif` retiré de la projection → **1 ✕** ; `runValidators`
retiré → **1 ✕** (le test assère l'objet d'options exact).

### Vérification docker **rejouée après les correctifs** — 2026-07-27

Les correctifs touchent la persistance (index, hooks de schéma, `runValidators`) : la vérification d'avant
ne vaut plus, elle est donc **refaite en entier** sur le code final. Aucun résultat n'est reporté.

| Invariant | Preuve mesurée |
|---|---|
| Nouvel index créé | `profils_societe_audit` → `{"orgId":1,"le":-1,"version":-1}` ✅ (l'ancien `{orgId,le}` subsiste sur le volume de dev, sans effet — une stack neuve ne crée que le nouveau) |
| `PATCH` 2 champs sous `runValidators` | `version 1 → 2`, 2 entrées d'audit portant **le même horodatage** (`14:37:40.546Z`) ⇒ une seule unité d'écriture |
| Aucun orphelin | `audit sans profil = 0` |
| `actif` historisé | `PATCH { actif: false }` → `version 3`, audit `true → false (v3)` — la symétrie corrigée porte sur un champ réellement audité |
| Isolation multi-tenant | org B lit `GET /profil-societe` → **404 `PROFIL_SOCIETE_INTROUVABLE`**, jamais le profil de l'org A |

⚠️ La porte append-only agit à la couche **Mongoose** : elle arrête le code applicatif, pas un `deleteMany`
lancé directement en `mongosh`. C'est le bon niveau (la menace est une future story qui injecterait le
modèle), mais il ne faut pas la lire comme une protection base de données.

### Revue de sécurité — 2026-07-27 : **0 vulnérabilité**

Isolation multi-tenant (aucun canal d'entrée pour un `orgId` client — pas un seul `@Param`/`@Query` dans le
module), anti-énumération (profil inexistant et profil d'une autre org indiscernables, `E11000` mappé sur le
même 409 générique), mass assignment (`whitelist` + `forbidNonWhitelisted` actifs, **plus** une allowlist de
reconstruction qui n'itère jamais sur les clés client ⇒ ni opérateur Mongo ni `__proto__` ne peut atteindre
le `$set`), divulgation (mapping explicite, aucune stacktrace, **aucun NIF/CNSS/nom journalisé**), RBAC et
throttler effectifs sur les 4 routes.

---

**Status:** done
**Dependencies:** STORY-076 (scaffold), STORY-077 (gate `@RequiresBalanceAccess` + read-models **KYC/entitlement** — *pas* d'identité), **STORY-078** (`PaquetFiscalRegistry`, dont dérive la liste des pays supportés) · **alimente** STORY-080 (régime), STORY-078 (résolution `pays`), STORY-081 (pré-remplissage OCR), `bilan-service` EPIC-011 (page de garde DSF)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A01 · GUIDEF Togo (fiches d'identification)
