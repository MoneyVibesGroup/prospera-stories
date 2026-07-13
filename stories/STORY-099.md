# STORY-099 : Contrat de sortie & handoff balance normalisée → bilan-service

**Epic :** EPIC-024 — Simulation & conseil fiscal + contrôles & handoff bilan-service  
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § Épics AB-08 (contrôles & livraison) ; `sprint-plan-atelier-balance-2026-07-12.md` § Coordination balance/bilan  
**Priorité :** Must Have  
**Story Points :** 3  
**Statut :** ready-for-dev  
**Assigné à :** null  
**Créée le :** 2026-07-12  
**Sprint :** 10 (CORE)  
**Service :** `balance-service` (:3007) → `bilan-service` (:3004)  
**Couvre :** FR-A28 (contrat de sortie & handoff), architecturale (liaison 2 services)

> **Pont entre Atelier Balance et Bilan — le handoff du module amont.** La balance-service produit une `BalanceCanonique` (D13 contrat). Le `bilan-service` (EPIC-009→014, sprints 11-14) devra la **consommer** pour rendre la liasse DSF. Cette story livre le **côté PRODUCTEUR du contrat de sortie** : l'API de consultation read-only + l'événement `balance.created` + la documentation du contrat. Le schéma est stable (identique au D13 contrat) — **aucune transformation** entre les deux services.
>
> **⚠️ Séquencement (important).** Au **sprint 10, le consumer `bilan-service` n'existe pas encore** (EPIC-009 = sprints 11-14). Cette story livre donc **uniquement le producteur** (exposer + émettre + documenter), vérifié par un **consumer de test** (round-trip Kafka + lecture API). L'**e2e d'intégration réel balance→bilan** est **différé** à l'arrivée du consumer côté `bilan-service` (EPIC-009, où il devient une story/critère de ce module).

---

## User Story

En tant que **développeur du `bilan-service`** (aval),  
je veux que **balance-service expose clairement sa balance normalisée** via une API/événement **stable et prédictible**,  
afin que le `bilan-service` la **consomme sans risque de breaking change** et l'utilise pour **produire la liasse DSF**.

---

## Description

### Contexte

Le split D14 (balance avant bilan) détermine qu'une **balance doit être stockée et prête AVANT le `bilan-service` la consomme**. Le contrat de sortie est le **pont** entre les deux : balance-service **produit**, bilan-service **consomme**. Les deux doivent **convenir d'un schéma**. Ce story ne **change rien au contrat** (D13 `BalanceCanonique` = le contrat final) — il **l'expose clairement** et **teste l'interop**.

### Périmètre

**Inclus :**

- **API d'exposition (read-only)** de balance-service :
  - `GET /api/v1/balance/:orgId/:exercice/:source` (authentifié, gate `@RequiresBalanceAccess`) → retourne `BalanceCanonique` complète (brouillon ou validée).
  - `GET /api/v1/balance/:orgId/:exercice/:source/latest` → dernière version non-rejetée (pour brouillons en mutation).
  - Erreurs : 404 si pas trouvée, 403 si orga pas accessible (isolation tenant).

- **Événement `balance.created`** (Kafka) :
  - Producteur : balance-service (après validation STORY-101, ou après finalization contrôles).
  - Payload : `{ eventId, occurredAt, balance: BalanceCanonique, sourceSystem: 'balance-service' }`
  - Topic : `balance.created` (analogue à `kyc.status.changed`, `entitlement.changed`).
  - Consumer : prévu pour `bilan-service` EPIC-009 (lecteur aval).

- **BalanceOutputPort** (interface de contrat) :
  ```typescript
  interface BalanceOutput {
    balance: BalanceCanonique;           // le contrat D13
    status: 'BROUILLON' | 'VALIDÉE';    // cycle de vie
    createdAt: Date;
    lastModifiedAt: Date;
    readModel?: {
      kycStatus: string;                 // ref org_profile (STORY-077)
      tablePassage: string;              // referentiel utilisé
    };
  }
  ```

- **Tests (côté producteur, sprint 10)** :
  - e2e docker : balance-service produit une balance → émet `balance.created` → un **consumer de test** (dans la suite balance-service) reçoit l'événement et **valide le payload** (round-trip Kafka).
  - API : `GET /api/v1/balance/:exercice/:source` retourne la `BalanceCanonique` stockée (auth + gate).
  - Contrats de version : schéma Kafka + API versionnés (`/api/v1/…` = V1, futur `/v2` = breaking).
  - **Différé (EPIC-009)** : l'e2e réel `balance-service → bilan-service` (le vrai consumer lit et rend la liasse) est une story/critère du **module Bilan** (sprints 11-14), pas du sprint 10.

- **Documentation du contrat** :
  - Swagger de l'API d'exposition
  - Schéma événement `balance.created` (Avro ou JSON Schema, si appliqué)
  - README `INTEGRATION.md` en `balance-service/` (« Comment consommer la balance »)

**Hors périmètre :**

- **Logique de bilan** — consommation + rendu liasse → `bilan-service` EPIC-009 (STORY-050+).
- **Versioning/migration de schéma** (si évolution du contrat) → future story (préparation faite ici).
- **SLA / métriques d'interop** (latence Kafka, etc.) → future story (monitoring).

### Flux (mise en route interop)

1. **Balance-service** produit une balance (STORY-101+) :
   - Appel `POST /api/v1/balance/import/sage` (STORY-086)
   - Ou ingestion directe `balance.submitted` (STORY-102)
   - Ou construction cahiers/OCR (STORY-082-085)
   - → Balance normalisée en `balances` collection (STORY-101)

2. **Balance-service** émet `balance.created` sur Kafka :
   - Event contient la `BalanceCanonique` complète
   - Topic `balance.created` (créé automatiquement, `KAFKA_AUTO_CREATE_TOPICS_ENABLE`)

3. **Bilan-service** (futur, EPIC-009) consomme `balance.created` :
   - Consumer groupe `bilan-service-balance`
   - Stocke en read-model local (replica de la balance)
   - Peut aussi faire `GET /api/v1/balance/:orgId/:exercice/:source` si besoin de re-synch

4. **Bilan-service** rend la liasse :
   - Utilise la balance stockée (depuis l'événement ou API GET)
   - Exécute la table de passage (compte → poste GUIDEF, STORY-055)
   - Produit Bilan Actif/Passif, Compte de résultat (STORY-059-062)
   - Export DSF (STORY-073)

---

## Acceptance Criteria

- [ ] **API d'exposition** (`GET /api/v1/balance/…`) : retourne `BalanceCanonique` brouillon ou validée, authentifié + gate passe.
- [ ] **Événement `balance.created`** émis sur Kafka avec payload `{ eventId, occurredAt, balance, sourceSystem }`.
- [ ] **Contrat BalanceOutput** défini (TypeScript interface) : balance + status + metadata.
- [ ] **e2e producteur docker** : balance-service produit → `balance.created` émis → **consumer de test** reçoit et valide le payload (round-trip Kafka). *(Le vrai consumer `bilan-service` = EPIC-009, sprints 11-14 — hors sprint 10.)*
- [ ] **Swagger documenté** : endpoint GET + codes (200/404/403).
- [ ] **INTEGRATION.md** explique comment consommer la balance (API GET ou Kafka événement).
- [ ] **Schéma événement** documenté (JSON Schema ou Avro).
- [ ] **Tests** : unit (production événement OK), e2e (round-trip Kafka), non-régression.

---

## Technical Notes

### API

```typescript
@Controller('balance')
@UseGuards(TenantStateGuard)
export class BalanceController {
  @Get(':exercice/:source')
  async getBalance(
    @Param('exercice') exercice: string,
    @Param('source') source: 'sage' | 'direct' | 'ocr',
    @TenantContext() org: string
  ): Promise<BalanceOutput> {
    const balance = await this.balanceService.findLatest(org, exercice, source);
    if (!balance) throw new NotFoundException();
    return {
      balance,
      status: balance.etat,
      createdAt: balance.horodatage,
      lastModifiedAt: balance.historiqueMutations?.[0]?.horodatage || balance.horodatage,
      readModel: {
        kycStatus: (await this.orgProfiles.findOne({orgId: org}))?.kycStatus,
        tablePassage: balance.referentiel
      }
    };
  }
}
```

### Événement Kafka

```typescript
interface BalanceCreatedEventV1 {
  eventId: string;           // UUID
  occurredAt: Date;
  sourceSystem: 'balance-service';
  balance: BalanceCanonique; // contrat D13 complet
  metadata?: {
    origin: 'sage' | 'direct' | 'ocr';
    version: number;
  };
}

// Topic: balance.created
```

### Documentation (INTEGRATION.md)

```markdown
# Consommer la Balance depuis balance-service

## API synchrone

GET /api/v1/balance/:exercice/:source
- Returns: BalanceOutput (balance + status + métadata)
- Auth: RS256 JWT
- Gate: @RequiresBalanceAccess

## Événement Kafka (asynchrone)

Topic: balance.created
Payload: BalanceCreatedEventV1 (cf. schéma.json)

Consumer: bilan-service (group: bilan-service-balance)

Le schéma est stable (v1). Tout changement → nouvelle version.
```

---

## Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| Événement `balance.created` ne fait pas l'aller-retour Kafka | Tester e2e docker : émettre + consommer, vérifier round-trip |
| Schéma change (breaking) | Versioning explicite (v1 en prod) ; futur changement → v2 nouveau topic |
| Bilan-service attend schema qui n'existe pas | Contrat écrit avant EPIC-009 ; validation cross-team |
| API `/balance` exposée alors qu'elle ne devrait pas l'être | Reste `@RequiresBalanceAccess` protégée ; audit avant prod |

---

## Definition of Done

- [ ] API GET `/api/v1/balance/…` implémentée + testée
- [ ] Événement `balance.created` émis sur Kafka
- [ ] BalanceOutput interface définie
- [ ] Swagger documenté
- [ ] INTEGRATION.md écrite (comment consommer)
- [ ] Tests : unit + e2e (Kafka round-trip)
- [ ] Non-régression : balance-service e2e toujours vert
- [ ] Prêt pour consumption par `bilan-service` EPIC-009

---

**Status:** ready-for-dev  
**Created:** 2026-07-12  
**Dependencies:** STORY-076 (scaffold), STORY-101 (contrat + validation d'équilibre), STORY-077 (gate/auth). *(Les contrôles enrichis STORY-098 en S19 raffineront la balance mais ne bloquent PAS le handoff CORE : l'émission se fait après la validation d'équilibre de STORY-101.)*  
**Consommateur:** `bilan-service` EPIC-009 (STORY-050+, sprints 11-14)  
**Reference:** `prd-atelier-balance-2026-07-12.md` § AB-08 (contrôles & livraison)
