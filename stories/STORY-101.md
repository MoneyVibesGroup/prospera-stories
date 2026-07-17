# STORY-101 : Contrat de balance canonique (multi-source, tagué référentiel) — pièce maîtresse D13

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique  
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A01/A25/A27/A28 ; `sprint-plan-atelier-balance-2026-07-12.md` § D13 hub multi-source  
**Priorité :** Must Have  
**Story Points :** 5  
**Statut :** done ✅ (implémentée + vérifiée docker + revue + intégrée dans `dev` le 2026-07-17)  
**Assigné à :** Claude (BMAD dev-story)  
**Créée le :** 2026-07-12  
**Sprint :** 10 (CORE)  
**Service :** `balance-service` (:3007)  
**Couvre :** FR-A01/A02/A12/A13/A14/A25/A27/A28 (contrat, stockage, idempotence, immutabilité)  
**Criticité :** ⚡ **MAXIMALE** — Keystone du hub multi-source (D13). Rend cabinet/IMF/distributeur interchangeables.

> **Pièce maîtresse du hub multi-source.** C'est le contrat de données que **tous les adaptateurs convergeront vers** (Sage, IMF direct, cahiers/OCR). D13 décide que le `balance-service` reçoit des balances de 3 sources, les normalise vers UN SEUL contrat stable, les stocke, les contrôle, et les cède au `bilan-service` pour produire la liasse. Cette story **pose ce contrat** : schéma TypeScript, stockage MongoDB idempotent, versioning, immutabilité après validation. C'est l'**API stable** qui découple les adaptateurs (086, 102, 082-085) de la persistance et des contrôles. Sans ce contrat bien défini, les 3 adaptateurs divergent, le hub échoue, et le Bilan n'a rien à consommer.

---

## User Story

En tant que **développeur d'adaptateur** (import Sage, ingestion IMF, construction cahiers/OCR),  
je veux **un schéma de données stable définissant la « balance canonique »**,  
afin que je **normalise ma source vers ce contrat sans risquer de breaking changes**, et que **le bilan-service la consomme de façon prédictible**.

---

## Description

### Contexte

La **balance-service** reçoit les balances de 3 adaptateurs (D13 décision) :
1. **Ingestion directe `balance.submitted`** (STORY-102, verticaux intégrés IMF/distributeur) — **préféré** (toujours à jour)
2. **Import fichier Sage** (STORY-086, externe, cabinet migrant)
3. **Construction cahiers/OCR** (STORY-082-085, PME informelle)

Tous trois doivent **converger vers le même contrat canonique**. C'est l'**API stable** qui découple les adaptateurs de la persistance. Sans ce contrat, chaque adaptateur bâtit son schéma ad-hoc → divergence, perte d'interchangeabilité (cabinet/IMF/distributeur ne sont plus substituables). Cette story **pose ce contrat** : schéma TypeScript complet, règles critiques (idempotence, immutabilité, audit), tests de validation.

### Périmètre

**Inclus :**

- **Schéma TypeScript `BalanceCanonique`** (complet, exporté, JSDoc) :
  - Identifiants & versioning : `orgId`, `exercice` (dates de clôture), `source` ("sage"|"direct"|"ocr"), `referentiel` ("SN"|"SMT"|"SFD-BCEAO"), `version` (idempotence).
  - Traçabilité & audit : `horodatage`, `auteur`, `checksum` SHA256.
  - Lignes : `LigneBalance[]` (compte alphanum, libellé, débits/crédits XOF, `niveauPreuve`).
  - Sommaire : totaux, équilibre (FR-A25), écart.
  - Statut de preuve (FR-A27) : `justifiée` / `partiellement_estimée` / `majorite_estimée`.
  - Métadonnées : état (BROUILLON/VALIDÉE/REJETÉE), horodatage validation, historique mutations.

- **`BalanceCanonique` + types secondaires** :
  ```typescript
  export type SourceBalance = 'sage' | 'direct' | 'ocr';
  export type ReferentielBalance = 'SN' | 'SMT' | 'SFD-BCEAO';
  export type NiveauPreuveBalance = 'fichier' | 'ocr' | 'estimé' | 'saisie';
  export type StatutPreuveBalance = 'justifiée' | 'partiellement_estimée' | 'majorite_estimée';
  export interface BalanceCanonique { … }
  export interface LigneBalance { … }
  export interface BalanceSubmittedEventV1 { … }  // Kafka
  ```

- **Règles critiques d'implémentation** :
  - **Idempotence** : clé unique `(orgId, exercice, source, version)` → re-soumission de v=N = NOP silencieuse (doublon ignoré) — **pas d'erreur**, pas de mutation partielle.
  - **Immutabilité** : une fois `etat=VALIDÉE`, aucune mutation possible (l'outil n'implémente pas de mécanisme de minoration non justifiée → défense légale garantie).
  - **Versioning** : re-soumission avec `version=N+1` → remplace `N` (mutation tracée), ancienne version archivée (append-only).
  - **Atomicité** : validation + persistance dans **la même transaction** MongoDB (pas de mutation partielle).

- **MongoDB schéma + indexes** :
  - Collection `balances` avec validation JSON Schema (`estEquilibre: true`, types strictes).
  - Index unique `(orgId, exercice.debut, exercice.fin, source, version)`.
  - Index pour requêtes aval : `(orgId, etat)`, `(etat, horodatageValidation)`.

- **`BalanceRepository`** (service de persistance) :
  - `findByKey(orgId, exercice, source, version)` → détection doublon.
  - `findLatest(orgId, exercice, source)` → dernière version.
  - `insert(balance)` → atomique (ou rollback).
  - `updateStateAtomic(balance)` → mutation + archivage.
  - `listByOrg(orgId, filter?)` → paginé, pour requête bilan-service.

- **Validation intégrité** (`BalanceValidator`) :
  - Équilibre Actif=Passif (FR-A25) : `totalDebiteur === totalCrediteur` (tolérance < 1 XOF).
  - Pas de doublon de compte.
  - Comptes format SYSCOHADA alphanum (3-7 char).
  - Montants ≥ 0, format XOF (2 décimales max).
  - `niveauPreuve` ∈ {fichier, ocr, estimé, saisie}.
  - `referentiel` ∈ {SN, SMT, SFD-BCEAO}.
  - Checksum SHA256 récalculé et comparé.
  - `statutPreuve` global cohérent avec ligne.

- **Calcul `statutPreuve` (FR-A27)** :
  - `justifiée` : >80% lignes avec `niveauPreuve='fichier'` (source fiable).
  - `partiellement_estimée` : 20-80% fichier.
  - `majorite_estimée` : <20% fichier OU >50% ocr/estimé (source peu fiable).

- **Tests complets** :
  - Unit : chaque validation (équilibre fail, doublon, format compte, checksum, statutPreuve).
  - Unit : idempotence (soumettez (v1, v1, v2, v1, v2, v2) → vérif 3 lignes en DB : v1, v2).
  - Unit : immutabilité (validée → tentative mutation = rejétée avec erreur).
  - Integration : persistance transactionnelle (commit/rollback).
  - e2e : créer balance → archiver version → requête `GET /api/v1/balance/:id` retourne bien.

**Hors périmètre :**

- **Logique de balance** — construction, import, contrôles détaillés → adaptateurs (086, 102, 082-085) et contrôles (STORY-098).
- **Simulation/conseil fiscal** → STORY-096/097.
- **Rendu liasse** → `bilan-service` EPIC-009+.

### Flux (mise en route)

1. Adaptateur (STORY-086, 102, ou 082-085) produit `BalanceCanonique`.
2. Appel `BalanceService.submitBalance(balance)` :
   - `BalanceValidator.validate(balance)` → erreur si invalide (reject avec msg, pas de mutation partielle).
   - `BalanceRepository.findByKey(…)` → si version existe = NOP (idempotence).
   - `BalanceRepository.insert(balance)` → atomique (transaction).
   - Émettre événement Kafka `balance.created` (STORY-099).
3. `bilan-service` consomme `balance.created` ou fait `GET /api/v1/balance/…` (STORY-099) → liasse produite (EPIC-009+).

---

## Acceptance Criteria

- [ ] **Schéma TypeScript `BalanceCanonique`** : interface complète, exportée, 0 `any`, JSDoc pour chaque champ.
- [ ] **Types secondaires** (`SourceBalance`, `ReferentielBalance`, `NiveauPreuveBalance`, `StatutPreuveBalance`, `LigneBalance`) : déclarés, testables.
- [ ] **Validation 100%** : tous les cas testés (équilibre fail, doublon, format SYSCOHADA, checksum, statutPreuve, montants).
- [ ] **Idempotence prouvée** : test qui soumets (v1, v1, v2, v1, v2, v2) → vérif 3 lignes en DB (v1, v2, pas de v1 duplicata).
- [ ] **Immutabilité** : une fois `etat=VALIDÉE`, tentative mutation = exception `AlreadyValidatedBalanceException`.
- [ ] **Événement Kafka `BalanceSubmittedEventV1`** : structure définie, type Kafka.
- [ ] **BalanceRepository** : findByKey, findLatest, insert, updateStateAtomic, listByOrg — tous testés.
- [ ] **Contrôles d'intégrité (FR-A25)** : équilibre, pas doublon, format compte, checksum — **tous passent** (taux 100%).
- [ ] **Calcul `statutPreuve` (FR-A27)** : justifiée/partiellement_estimée/majorite_estimée selon % niveauPreuve.
- [ ] **Coverage ≥ 90%** : validation, persistance, orchestration.
- [ ] **Zéro flaking tests** : run suite 10×, 0 flake.
- [ ] **Guides adaptateurs** : ex code pour normaliser Sage → `BalanceCanonique` (aide futurs stories).
- [ ] **MongoDB schéma** : validation JSON Schema, index unique, tests.

---

## Technical Notes

### Schéma TypeScript (synthèse)

```typescript
export interface BalanceCanonique {
  orgId: string;
  exercice: { debut: Date; fin: Date };
  source: SourceBalance;
  referentiel: ReferentielBalance;
  version: number;
  horodatage: Date;
  auteur: { userId: string; orgId: string; role: string };
  checksum: string;
  lignes: LigneBalance[];
  sommaire: { totalDebiteur: number; totalCrediteur: number; estEquilibre: boolean; ecartEquilibre?: number };
  statutPreuve: StatutPreuveBalance;
  annotationRisque?: string;
  etat?: 'BROUILLON' | 'VALIDÉE' | 'REJETÉE';
  horodatageValidation?: Date;
  historiqueMutations?: Array<{ version, horodatage, auteur, motif }>;
}
```

### Idempotence pattern

```typescript
async submitBalance(balance: BalanceCanonique): Promise<BalanceOutput> {
  const key = { orgId: balance.orgId, exercice: balance.exercice, source: balance.source, version: balance.version };
  
  // Vérif doublon
  const existing = await this.balanceRepo.findByKey(key);
  if (existing) {
    logger.info(`Balance ${key} déjà existante, NOP`, { eventId: balance.checksum });
    return { balance: existing, status: 'BROUILLON' };
  }

  // Validation atomique + persistance
  const session = await this.mongoConnection.startSession();
  try {
    await session.withTransaction(async () => {
      // Valider
      await this.balanceValidator.validate(balance);

      // Persister
      await this.balanceRepo.insert(balance, { session });
    });
  } finally {
    await session.endSession();
  }

  // Événement aval
  await this.eventBus.emit('balance.created', { balance });
  return { balance, status: 'BROUILLON' };
}
```

### MongoDB validation schema

```javascript
db.balances.createIndex(
  { orgId: 1, "exercice.debut": 1, "exercice.fin": 1, source: 1, version: 1 },
  { unique: true }
);
db.balances.createIndex({ orgId: 1, etat: 1 });
db.balances.createIndex({ etat: 1, horodatageValidation: -1 });
```

---

## Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| Les 3 adaptateurs normalisent différemment (divergence) | Schéma strict + exemples concrets dans la story (guide adaptateurs) |
| Doublon silencieux passe (régression) | Test e2e : soumets 2×, vérif que 1 ligne en DB (idempotence) |
| Mutation post-validation échappe | Vérif que `etat=VALIDÉE` + tentative mutation → exception (immutabilité test) |
| Checksum se désynchronise | Test : mutez balance post-checksum, recalculez, vérif ≠ ancien |
| Référentiel manquant fait péter | Valider `referentiel ∈ {SN, SMT, SFD-BCEAO}` avant persistance |
| Montants perdent précision (float) | Utiliser Decimal/BigDecimal, stocker en centimes XOF int |

---

## Definition of Done

- [ ] Schéma TypeScript complet, 0 `any`, JSDoc exporté
- [ ] Validation 100% tous les cas (unit tests)
- [ ] Idempotence prouvée (test (v1,v1,v2,v1,v2,v2) → 3 lignes DB)
- [ ] Immutabilité testée (VALIDÉE → tentative mutation échoue)
- [ ] BalanceRepository implémenté + testé
- [ ] MongoDB schéma + indexes créés
- [ ] Événement Kafka `BalanceSubmittedEventV1` structuré
- [ ] Coverage ≥ 90%
- [ ] Zéro flaking tests
- [ ] Guide adaptateurs exemple Sage → contrat
- [ ] CI lint/build/test vert

---

## Prochaines étapes

**Immédiatement après :** STORY-077 (read-models + gate), STORY-086 (import Sage), STORY-099 (handoff) — les 5 forment le CORE sprint 10.

**Dependencies aval :** STORY-102 (ingestion IMF), STORY-082-085 (cahiers/OCR), STORY-098 (contrôles), STORY-099 (handoff bilan).

---

## Progress Tracking

**Status History :**
- 2026-07-12 : Créée (Scrum Master).
- 2026-07-17 : Implémentée + revue + intégrée dans `dev` (BMAD dev-story, Claude) — PR #3 `balance-service` (branche `MNV-101`, Rebase and merge, branche supprimée).

**Décisions de mise en œuvre :**
- **Module** `src/modules/balance/` calqué sur `platform-catalog-service` (upsert transactionnel) et les patrons `balance-service` existants (read-models STORY-077).
- **Contrat** (`types/balance-canonique.ts`) : types + tables de valeurs `as const` exportés (pas d'enum), 0 `any`, JSDoc par champ.
- **Montants en unités mineures XOF entières** (× 100) — arithmétique exacte, zéro dérive flottante (cf. §Risques). Une source à 2 décimales se mappe 1:1.
- **Événement** `balance.created` (`BalanceCreatedEventV1`) : structure + mapper figés/testés ; le câblage outbox Kafka reste **STORY-099** (hook inerte documenté). Renommé depuis `BalanceSubmittedEventV1` de la story pour lever l'ambiguïté avec le topic **entrant** `balance.submitted` (STORY-102).
- **Immutabilité** : `marquerEtat` (+`findLatest`/`listByOrg`) = **hooks inertes documentés** — aucun endpoint HTTP de mutation en 101 (le workflow métier validation/rejet est le périmètre de 098/099) ; l'invariant est prouvé par les tests unitaires.
- **JSON Schema Mongo au niveau collection non ajouté** : le schéma Mongoose + `BalanceValidator` (app) + l'index unique portent tous les invariants ; un validateur `$jsonSchema` DB dupliquerait le contrat.

**Revue** `/code-review xhigh` — 3 constats :
- 🟠 **Corrigé** : le tri des lignes du checksum utilisait `localeCompare` (dépendant de la locale runtime) → tri par **point de code** ⇒ SHA-256 identique entre adaptateur et serveur quelle que soit la locale (comptes à casse mixte).
- 🟡 **Corrigé** : montants sans borne haute → `Number.isSafeInteger` par ligne **et** sur les totaux agrégés (`validerAgregats`) ⇒ refus 400 au-delà de 2^53 (sinon totaux/équilibre calculés faux).
- ⚪ **Laissé (défendable)** : `validerStatutPreuve` est redondant sur le POST (le serveur pose lui-même le statut) mais reste utile pour un appel direct du validateur par un adaptateur — défense en profondeur documentée.

**Validation :** lint 0 warning · build OK · **205 unit + 34 e2e** verts · couverture **module balance 100 %** (branches incluses) > seuils 65/90/90/90.

**Vérification docker réelle (bout-en-bout, 14/14)** — stack vivante, jeton RS256 réel de l'IdP + gate `@RequiresBalanceAccess` satisfaite (read-models KYC APPROVED + entitlement `balance` ACTIVE semés) :
- **Idempotence** : `POST` v1 → **201** ; v1 rejoué → **200** NOP (même `id`) ; v2 → **201**. `db.balances.countDocuments` = **2**, versions **{1,2}** (append-only, **aucun doublon v1**).
- **Index** : index **UNIQUE** `(orgId, exercice.debut, exercice.fin, source, version)` présent (`getIndexes()`).
- **Atomicité / FR-A25** : `POST` déséquilibrée → **422** et `count` **inchangé** (2) ⇒ rejet n'écrit **aucun** orphelin.
- **Intégrité** : checksum falsifié → **400**.
- **Anti-énumération / org-scoping** : `GET /:id` de l'org → **200** (bon `orgId`) ; `GET` d'un id inexistant → **404**.
- **Immutabilité** : prouvée par unit (`marquerEtat` sur balance `VALIDÉE` → `AlreadyValidatedBalanceException`) — sans surface HTTP en 101.

**Effort réel :** ~1 séance (implémentation + revue + vérif docker).

**Suite :** enchaînement immédiat **STORY-086** (adaptateur import Sage → contrat canonique).

---

**Status:** done ✅  
**Created:** 2026-07-12  
**Completed:** 2026-07-17  
**Criticité:** ⚡ MAXIMALE — Keystone  
**Reference:** `prd-atelier-balance-2026-07-12.md` § EPIC-017, `sprint-plan-atelier-balance-2026-07-12.md` § D13 hub multi-source
