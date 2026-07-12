# STORY-101 — Contrat de balance canonique (pièce maîtresse D13)

**Story ID:** STORY-101  
**Epic:** EPIC-017 (Socle balance-service + contrat de balance canonique)  
**Service:** `balance-service` (:3007)  
**Sprint:** 10 (2026-11-05 → 2026-11-19)  
**Points:** 5  
**Status:** ready-for-dev  
**Précédences:** STORY-076 (scaffold), STORY-077 (read-models/gate)  
**Dépendances aval:** STORY-086 (import Sage), STORY-102 (ingestion IMF), STORY-082-085 (cahiers/OCR)  
**Criticité:** ⚡ **MAXIMALE** — Keystone du hub multi-source D13. Rend cabinet/IMF/distributeur interchangeables.

---

## 0. Vue d'ensemble — Pourquoi cette story est critère de succès

Cette story défini le **contrat de balance standard** que toutes les sources (Sage, IMF, cahiers/OCR) doivent normaliser. C'est l'**API stable** qui découple les adaptateurs de la persistance et des contrôles. Sans ce contrat bien défini, les 3 adaptateurs divergent, le hub D13 échoue, et le Bilan n'a rien à consommer.

**Décision D13 (user 2026-07-12):** `balance-service` = hub canonique multi-source alimenté par 3 adaptateurs :
- **#1 Ingestion directe `balance.submitted`** (STORY-102, verticaux intégrés IMF/distributeur) — **préféré** (toujours à jour)
- **#2 Import fichier Sage** (STORY-086, externe)
- **#3 Construction cahiers/OCR** (STORY-082-085, PME informelle)

Tous trois convergeront vers **le même contrat canonique** défini ici. Cette story pose ce contrat.

---

## 1. Exigences (User Story)

**En tant que** développeur d'adaptateur (Sage, IMF, OCR)  
**Je veux** un schéma de données stable définissant la « balance canonique »  
**Afin que** je puisse normaliser ma source vers ce contrat sans risquer de breaking changes, et que le bilan-service la consomme de façon prédictible.

### Acceptance Criteria (BDD)

**AC1 — Schéma TypeScript du contrat est défini et exporté**
```gherkin
Étant donné que je suis un développeur d'adaptateur
Quand je regarde src/balance/domain/balance-canonique.ts
Alors je vois une interface BalanceCanonique avec tous les champs requis
  And le type est exporté comme principal du module
  And il y a des docs JSDoc pour chaque champ
  And tous les champs ont des valeurs par défaut ou sont marqués ?/!
```

**AC2 — Le schéma porte traçabilité & audit**
```gherkin
Quand j'inspects une balance stockée
Alors elle contient :
  - orgId (tenant key)
  - exercice { début, fin } (clôture officielle)
  - source ("sage" | "direct" | "ocr")
  - referentiel ("SN" | "SMT" | "SFD-BCEAO")
  - version (idempotence)
  - horodatage + auteur + checksum (immutabilité)
  And tous les champs sont NON MUTABLES une fois persistés
  And chaque ligne porte niveauPreuve ("fichier" | "ocr" | "estimé" | "saisie")
  And la balance elle-même a un statutPreuve global
```

**AC3 — Idempotence & versioning**
```gherkin
Quand je soumets la même balance (orgId + exercice + source + version=N)
Alors :
  - Si version=N n'existe pas → créer + status=BROUILLON
  - Si version=N existe → NOP silencieuse (doublon ignoré)
  - Si je re-soumets version=N+1 → remplace N (mutation tracée)
  And l'ancienne version est archivée (jamais supprimée)
  And une piste d'audit trace qui a muté, quand, pourquoi
```

**AC4 — Contrôles d'intégrité passent avant persistance**
```gherkin
Quand une balance est soumise pour stockage
Alors elle est validée :
  - totalDébiteur === totalCréditeur (FR-A25, équilibre obligatoire)
  - Pas de doublon de compte
  - Comptes respectent le format alphanum SYSCOHADA (ex: 5211BOA0)
  - Montants ≥ 0, format XOF (2 décimales max)
  - niveauPreuve ∈ {fichier, ocr, estimé, saisie}
  And si validation échoue → rejeter avec erreur détaillée (pas de mutation partielle)
  And si validation passe → persister atomiquement
```

**AC5 — Tag référentiel permet réécriture**
```gherkin
Quand une balance est tagée SN (Système Normal)
Alors elle peut être re-tagée SMT ou SFD-BCEAO (même les lignes, mapping interne)
  And les conversions sont prédictibles (pas de perte de précision)
  And le bilan-service consomme le tag pour choisir la table de passage
  And l'historique du tag est tracé (pas d'écrasement)
```

**AC6 — Niveau de preuve FR-A27**
```gherkin
Quand je consulte une balance stockée
Alors elle porte un statutPreuve global ∈ {justifiée, partiellement_estimée, majorite_estimée}
  And chaque ligne porte niveauPreuve explicite
  And le statut reflète la majorité des lignes (eg. >50% OCR → majorite_estimée)
  And une fois que le bilan-service la valide, le statut devient IMMUABLE
```

---

## 2. Contexte métier (Décisions D13/D14)

### D13 — Hub multi-source (rend cabinet/IMF/distributeur interchangeables)

Le hub reçoit la balance de 3 sources :

| # | Source | Adaptateur | Cas d'usage | Niveau de preuve |
|---|--------|-----------|-----------|-----------------|
| 1 | **Ingestion directe `balance.submitted`** | STORY-102 (S17) | **Verticaux intégrés** : module compta IMF/distributeur pousse sa balance | **Fichier** (préféré : toujours à jour, pas d'export) |
| 2 | **Import fichier** | STORY-086 (S10 CORE) | **Externe Sage** : export manuel, offline | **Fichier** (fiable quand frais) |
| 3 | **Construction cahiers/OCR** | STORY-082-085 (S16) | **PME informelle** : aucun logiciel, saisie manuelle + OCR | **OCR/estimé** (qualité minimale) |

**Tous convergeant vers le même BalanceCanonique.**

### D14 — Split CORE/EXTENDED

- **CORE sprint 10** : contrat + stockage + import Sage + saisie manuelle + handoff → **la balance est stockée d'abord**
- **Bilan sprints 11-14** → **consomme la balance stockée** (EPIC-010+)
- **EXTENDED sprints 15-19** : profil OCR, cahiers/OCR, rapprochement, fiscal, conseil

=> La balance est le **socle du pipeline**, le Bilan en est un client.

### Référentiels (déjà amorces)

- **Table de passage SYSCOHADA → postes GUIDEF** : validée 100% sur les 50 comptes réels (voir `referentiels/table-de-passage-syscohada.json`)
- **Paquet fiscal Togo 2026** : IS 27%, MFP 1%, TVA 18%, 4 acomptes (voir `referentiels/paquet-fiscal-togo-2026.json`)
- **163 postes officiels** GUIDEF : Bilan, CR, TFT, fiscal (voir `referentiels/postes-syscohada-guidef-togo.json`)

=> Le contrat ne duplique **pas** ces mappings ; il les **référence**.

---

## 3. Schéma du contrat BalanceCanonique (TypeScript)

**Fichier à créer :** `src/balance/domain/balance-canonique.ts`

```typescript
/**
 * BalanceCanonique — Contrat stable multi-source (D13).
 * 
 * Alimenté par 3 adaptateurs (Sage, IMF direct, cahiers/OCR).
 * Rend cabinet/IMF/distributeur interchangeables.
 * Tagué référentiel (SN/SMT/SFD-BCEAO).
 * Immuable après validation bilan-service.
 */

export type SourceBalance = 'sage' | 'direct' | 'ocr';
export type ReferentielBalance = 'SN' | 'SMT' | 'SFD-BCEAO';
export type NiveauPreuveBalance = 'fichier' | 'ocr' | 'estimé' | 'saisie';
export type StatutPreuveBalance = 'justifiée' | 'partiellement_estimée' | 'majorite_estimée';

export interface DateClotureExercice {
  debut: Date;      // ISO 2026-01-01
  fin: Date;        // ISO 2026-12-31
}

export interface LigneBalance {
  /**
   * Compte SYSCOHADA — alphanum (ex: "5211BOA0", "103", "411FACTURE").
   * Format : 3-4 chiffres + optionnellement 3 char alphanumériques (code tiers).
   */
  compte: string;

  /** Libellé court du compte (ex: "Banque BOA"). */
  libelle: string;

  /** Solde débiteur (XOF, 0-2 décimales). Jamais négatif. */
  debiteur?: number;

  /** Solde créditeur (XOF, 0-2 décimales). Jamais négatif. */
  crediteur?: number;

  /** Niveau de preuve de cette ligne. */
  niveauPreuve: NiveauPreuveBalance;

  /**
   * Traçabilité — optionnel mais recommandé.
   * Ex: "facture 2026-07-001", "OCR scan 2026-07-05 confiance 87%", "saisie manuelle".
   */
  traçabilité?: string;
}

export interface SommaireBalance {
  /** Total des débits (somme des debiteur > 0). */
  totalDebiteur: number;

  /** Total des crédits (somme des crediteur > 0). */
  totalCrediteur: number;

  /**
   * Équilibre (FR-A25) : totalDebiteur === totalCrediteur.
   * OBLIGATOIRE pour la persistance. Si false, rejeter avec erreur.
   */
  estEquilibre: boolean;

  /**
   * Écart d'équilibre si ≠ 0 (pour info/audit, jamais pour calcul).
   * Doit être < 1 XOF en valeur abs (arrondi).
   */
  ecartEquilibre?: number;
}

export interface BalanceCanonique {
  // ─── Identifiants & versioning (immutables après création) ───

  /** Clé tenant — associe la balance à une org MV. */
  orgId: string;

  /** Exercice comptable (dates de clôture officielles). */
  exercice: DateClotureExercice;

  /** Source d'origine : "sage" | "direct" | "ocr". */
  source: SourceBalance;

  /**
   * Référentiel comptable (D13).
   * "SN" = Système Normal SYSCOHADA
   * "SMT" = Système Minimal de Trésorerie SYSCOHADA
   * "SFD-BCEAO" = Directives BCEAO (format pour IMF/banques)
   */
  referentiel: ReferentielBalance;

  /**
   * Version — permet l'idempotence (D13).
   * (orgId, exercice, source, version) = clé unique.
   * Re-soumission de version=N → NOP.
   * Soumission de version=N+1 → remplace, archive ancien.
   */
  version: number; // démarrer à 1

  // ─── Traçabilité & audit (immutables) ───

  /** Horodatage création (ISO UTC). */
  horodatage: Date;

  /** Auteur (userId + org). */
  auteur: {
    userId: string;
    orgId: string;
    role: string;
  };

  /**
   * Checksum (SHA256 des lignes triées).
   * Permet de détecter les mutations silencieuses.
   */
  checksum: string;

  // ─── Lignes comptables ───

  /**
   * Array de lignes de balance (une par compte actif).
   * Pas de doublons de compte (validé à la persistance).
   * Peut être vide (cas extrême : balance à zéro).
   */
  lignes: LigneBalance[];

  // ─── Sommaire & contrôles ───

  sommaire: SommaireBalance;

  // ─── Statut de preuve (FR-A27) ───

  /**
   * Statut global de preuve de la balance.
   * "justifiée" : >80% niveauPreuve ∈ {fichier}
   * "partiellement_estimée" : 20-80% {fichier}
   * "majorite_estimée" : <20% {fichier} ou >50% {ocr/estimé}
   */
  statutPreuve: StatutPreuveBalance;

  /**
   * Annotation de risque (optionnel).
   * Ex: "Nombreuses estimations — à revoir avec cabinet".
   * Affiché à l'utilisateur avant validation bilan-service.
   */
  annotationRisque?: string;

  // ─── Métadonnées (calculées après persistance) ───

  /**
   * État du cycle de vie :
   * "BROUILLON" → après création/soumission
   * "VALIDÉE" → après validation bilan-service (puis IMMUABLE)
   * "REJETÉE" → si contrôle échoue (motif en erreur)
   */
  etat?: 'BROUILLON' | 'VALIDÉE' | 'REJETÉE';

  /**
   * Horodatage de validation bilan-service (si VALIDÉE).
   * Après ce point, la balance ne peut plus être mutée.
   */
  horodatageValidation?: Date;

  /**
   * Chemin historique des mutations (append-only).
   * [ { version: 1, horodatage, auteur, motif }, ... ]
   */
  historiqueMutations?: Array<{
    version: number;
    horodatage: Date;
    auteur: string;
    motif: string;
  }>;
}

/**
 * Événement bus (Kafka) pour le hub multi-source.
 * Producteur : adaptateurs (Sage parser, module compta IMF, constructeur cahiers/OCR).
 * Consommateur : BalanceService (persistance + contrôles).
 */
export interface BalanceSubmittedEventV1 {
  eventId: string;           // UUID unique
  occurredAt: Date;
  sourceSystem: 'sage' | 'BalanceService' | 'ComptabiliteServiceIMF' | 'AtelierCahiers';
  balance: BalanceCanonique;
  // Payload optionnel pour traçabilité :
  metadata?: {
    fichierSource?: string;  // ex: "Balance_2026.xlsx"
    sessionId?: string;      // session utilisateur
    tentative?: number;      // numéro de tentative (pour replay)
  };
}
```

---

## 4. Règles critiques d'implémentation (NFR-A04, NFR-A07)

### Idempotence (D13)

```typescript
// Clé unique pour la détection de doublon :
type BalanceKey = { orgId, exercice, source, version };

// À la réception d'une BalanceSubmittedEvent :
async function onBalanceSubmitted(event: BalanceSubmittedEventV1) {
  const { balance } = event;
  const key: BalanceKey = {
    orgId: balance.orgId,
    exercice: balance.exercice,
    source: balance.source,
    version: balance.version,
  };

  const existing = await balanceRepo.findByKey(key);

  if (existing) {
    // Idempotence : doublon silencieux, NOP
    logger.info(`Balance ${key} déjà existante, NOP`, { eventId: event.eventId });
    return;
  }

  // Nouvelle version → valider + persister atomiquement
  await validateBalanceIntegrity(balance); // lance si erreur
  await balanceRepo.insert(balance);       // atomique, ou rollback
  
  // Émettre événement aval (consommé par bilan-service)
  await eventBus.emit('balance.created', { orgId, exercice, source, version });
}
```

### Immutabilité après validation (NFR-A07)

```typescript
async function validateAndLockBalance(orgId: string, exercice, source: string) {
  const balance = await balanceRepo.findLatest(orgId, exercice, source);

  if (balance.etat === 'VALIDÉE') {
    throw new Error('Balance validée — immuable');
  }

  // Validation bilan-service : tous contrôles passent (Actif=Passif, cohérence, etc.)
  balance.etat = 'VALIDÉE';
  balance.horodatageValidation = new Date();
  
  // Persister EN TANT QUE SNAPSHOT immuable (append-only) :
  await balanceRepo.updateStateAtomic(balance);
  
  // Archiver version précédente (si version > 1) :
  if (balance.version > 1) {
    await balanceRepo.archiveVersion(orgId, exercice, source, balance.version - 1);
  }
}
```

### Schéma BD (MongoDB)

```javascript
db.createCollection("balances", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orgId", "exercice", "source", "referentiel", "version", "horodatage", "sommaire", "etat"],
      properties: {
        _id: { bsonType: "objectId" },
        
        orgId: { bsonType: "string" },
        exercice: {
          bsonType: "object",
          properties: {
            debut: { bsonType: "date" },
            fin: { bsonType: "date" }
          }
        },
        source: { enum: ["sage", "direct", "ocr"] },
        referentiel: { enum: ["SN", "SMT", "SFD-BCEAO"] },
        version: { bsonType: "int", minimum: 1 },
        
        horodatage: { bsonType: "date" },
        checksum: { bsonType: "string" },
        etat: { enum: ["BROUILLON", "VALIDÉE", "REJETÉE"] },
        
        lignes: { bsonType: "array" },
        sommaire: { bsonType: "object" },
        
        // Indexes
        "orgId,exercice.fin,source": { unique: true, partialFilterExpression: { version: 1 } }
      }
    }
  }
});

// Index unique pour idempotence
db.balances.createIndex(
  { orgId: 1, "exercice.debut": 1, "exercice.fin": 1, source: 1, version: 1 },
  { unique: true }
);

// Index pour requêtes bilan-service
db.balances.createIndex({ orgId: 1, etat: 1 });
db.balances.createIndex({ etat: 1, horodatageValidation: -1 });
```

---

## 5. Dépendances

### Entrantes (ce qu'on consomme)

- **STORY-076 (scaffold balance-service)** : le service `balance-service` doit exister
- **STORY-077 (read-models/gate)** : les read-models de KYC/entitlement doivent être disponibles
- **platform-catalog-service** : pour charger les référentiels (table de passage, paquet fiscal, gabarit liasse)
- **mongodb** : base de données persistance (via Mongoose)
- **Kafka** : bus d'événements pour `balance.submitted` amont et `balance.created` aval

### Sortantes (ce qu'on produit)

- **Événement Kafka `balance.created`** : consommé par bilan-service (EPIC-010+)
- **Collection MongoDB `balances`** : persistance, queryable par bilan-service
- **API REST STORY-101** : endpoint `POST /balance` (ingestion directe) ou consommation d'événement interne

### Dépendances aval (immédiatement aval du hub)

- **STORY-086 (import Sage)** : produit BalanceCanonique à partir d'export Sage
- **STORY-102 (ingestion IMF)** : consomme `balance.submitted`, produit BalanceCanonique
- **STORY-082-085 (cahiers/OCR)** : produit BalanceCanonique à partir de cahiers + OCR
- **EPIC-010+ (bilan-service)** : consomme la balance stockée pour produire la liasse

---

## 6. Tâches d'implémentation (Dev checklist)

### Phase 1 : Modèle de données & validation (2-3 jours)

- [ ] Créer `src/balance/domain/balance-canonique.ts` (schéma TypeScript + interfaces exportées)
- [ ] Créer `src/balance/domain/balance.errors.ts` (erreurs spécialisées : BalanceNotEquilibredException, etc.)
- [ ] Créer `src/balance/validation/balance-validator.ts` :
  - [ ] Valider équilibre (FR-A25)
  - [ ] Valider pas de doublon de compte
  - [ ] Valider format compte SYSCOHADA (alphanum 3-7 char)
  - [ ] Valider montants (≥0, XOF 2 décimales)
  - [ ] Valider niveauPreuve ∈ {fichier, ocr, estimé, saisie}
  - [ ] Valider referentiel ∈ {SN, SMT, SFD-BCEAO}
  - [ ] Calculer checksum SHA256
  - [ ] Calculer statutPreuve global (justifiée/partiellement_estimée/majorite_estimée)

### Phase 2 : Persistance & idempotence (2-3 jours)

- [ ] Créer `src/balance/persistence/balance.repository.ts` (MongoDB Mongoose) :
  - [ ] `findByKey(orgId, exercice, source, version)` → détection doublon
  - [ ] `findLatest(orgId, exercice, source)` → dernière version
  - [ ] `insert(balance)` → atomique
  - [ ] `updateStateAtomic(balance)` → mutation + archivage ancien
  - [ ] `listByOrg(orgId, filter?)` → paginated
- [ ] Schéma MongoDB avec validation + index d'idempotence
- [ ] Test idempotence : re-soumettez même balance 5×, vérifier NOP

### Phase 3 : API & événements (1-2 jours)

- [ ] Créer `src/balance/application/balance-service.ts` :
  - [ ] `onBalanceSubmitted(event)` → orchestration validation + persistance + événement aval
  - [ ] `validateAndLockBalance(orgId, exercice, source)` → validation bilan-service
- [ ] Créer `src/balance/presentation/balance.controller.ts` :
  - [ ] `POST /balance/validate` → validation sans persistance (dry-run)
  - [ ] `GET /balance/:orgId/:exercice/:source` → consultation brouillon
  - [ ] `GET /balance/:orgId/:exercice/:source/validated` → consultation validée
- [ ] Intégrer Kafka consumer `balance.submitted` (topic réception événements amont)
- [ ] Intégrer Kafka producer `balance.created` (topic émission aval vers bilan-service)

### Phase 4 : Tests (2-3 jours)

- [ ] **Unit tests validation** : chaque cas (équilibre fail, doublon, format compte invalide, checksum, etc.)
- [ ] **Unit tests idempotence** : soumettez (1, 1, 2, 1, 2, 2) → vérifiez état DB
- [ ] **Integration tests persistance** : MongoDB atomicité (commit/rollback)
- [ ] **e2e Kafka** : émettre BalanceSubmittedEvent → vérifier balance.created reçu en aval
- [ ] **Regression tests** : vérifier que les 3 adaptateurs (STORY-086, 102, 082-085) **peuvent normaliser vers ce contrat** (dry-run, pas d'adaptation codée ici)

### Phase 5 : Documentation (1 jour)

- [ ] JSDoc complet sur tous les types/interfaces
- [ ] README `src/balance/domain/README.md` expliquant le contrat (pour les adaptateurs)
- [ ] Exemples concrets : balance Sage normalisée, balance IMF, balance OCR
- [ ] Swagger/OpenAPI des endpoints

---

## 7. Critères d'acceptation technique

✅ **Done quand :**

1. **Schéma TypeScript** : `BalanceCanonique` + types déclarés, 0 `any`, JSDoc complet
2. **Validation 100%** : tous les cas testés (équilibre, doublon, format, niveauPreuve, checksum, statutPreuve)
3. **Idempotence prouvée** : test auto qui soumets (1, 1, 2, 1, 2, 2), vérife 3 lignes en DB (v1, v2)
4. **Immutabilité** : une fois `etat=VALIDÉE`, toute tentative de mutation est rejetée (test)
5. **Événements Kafka round-trip** : émettre BalanceSubmittedEvent → vérifier balance.created émis en aval
6. **Coverage ≥ 90%** : validation, persistance, orchestration
7. **Guides adaptateurs** : ex code pour normalisez Sage → BalanceCanonique (aide les prochaines stories)
8. **Zéro flaking tests** : run suite 10×, 0 flake

---

## 8. Risques & garde-fous

| Risque | Mitigation |
|--------|-----------|
| Les 3 adaptateurs normalisent différemment (divergence) | Schéma strict + exemples concrets dans la story |
| Doublon silencieux passe (régression) | Test e2e : soumets 2×, vérif que 1 ligne en DB |
| Mutation post-validation échappe | Vérif que `etat=VALIDÉE` + tentative mutation → exception |
| Checksum se désynchronise après mutation | Test : muter balance, recalculer checksum, vérif ≠ ancien |
| Référentiel manquant fait péter l'import | Valider que referentiel ∈ {SN, SMT, SFD-BCEAO} avant persistance |
| Montants perdent précision (float) | Utiliser Decimal/BigDecimal, stocker en centimes XOF int |

---

## 9. Contexte du projet

- **Décision D13** : hub multi-source rend cabinet/IMF/distributeur interchangeables
- **Décision D14** : balance AVANT bilan (CORE sprint 10, avant Bilan sprints 11-14)
- **Référentiels amorces** : table de passage validée, paquet fiscal, 163 postes GUIDEF (voir `referentiels/`)
- **PRD Atelier Balance** : `prd-atelier-balance-2026-07-12.md` (28 FR, 10 NFR, complet)
- **Plan d'intégration** : `sprint-plan-atelier-balance-2026-07-12.md` (3 adaptateurs, coordinations)
- **Mémoire STORY-101 keystone** : `memory/story-101-keystone.md` (conception détaillée)

---

## 10. Prochaines étapes (après STORY-101)

1. **STORY-086 (import Sage)** → parser Sage 100 → normalise vers BalanceCanonique
2. **STORY-102 (ingestion IMF)** → consomme `balance.submitted` → normalise
3. **STORY-082-085 (cahiers/OCR)** → cahiers + OCR → normalise
4. **STORY-099 (handoff bilan)** → bilan-service consomme balance.created

**Tous reposent sur le contrat bien défini ici.**

---

**Status:** ready-for-dev  
**Créé :** 2026-07-12  
**Par :** Claude (AI)  
**Prochaine action :** `bmad-dev-story STORY-101.md`
