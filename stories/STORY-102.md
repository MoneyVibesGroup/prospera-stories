# STORY-102 : Adaptateur #1 — ingestion DIRECTE `balance.submitted` (verticaux intégrés IMF / distributeur)

**Epic :** EPIC-021 — Hub multi-source (D13)
**Réf. architecture :** `sprint-plan-atelier-balance-2026-07-12.md` §0 (D13, tableau des 3 adaptateurs) · `rapport-bilan-logique-metier-2026-07-12.md` §D13 · `prd-atelier-balance-2026-07-12.md` § FR-A25 (contrôle d'équilibre) · `architecture-prospera-ecosystem-2026-07-04.md` (bus Kafka, outbox transactionnel)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 17 (EXTENDED)
**Service :** `balance-service` (:3007) — consomme les événements des **verticaux intégrés**
**Couvre :** D13 adaptateur #1 (ingestion directe) — la **voie préférée** du hub

> **La voie royale du hub — celle qui rend cabinet, IMF et distributeur interchangeables.** Les deux autres adaptateurs partent d'un **fichier** (Sage, STORY-086) ou de **pièces** (cahiers/OCR, STORY-082-085) : ils supposent un **geste humain d'export**. Un vertical **intégré** (IMF, distributeur) n'a pas ce problème : son **module de comptabilité vit déjà sur le bus PROSPERA**. Il **pousse** sa balance via `balance.submitted` — **toujours à jour, sans export manuel, sans parser**. C'est **l'adaptateur préféré (D13)**.
>
> **Et surtout :** l'écart Actif/Passif observé dans le module compta de **prospera-IMF** n'est pas un problème *de l'IMF* — c'est exactement ce que le **contrôle d'équilibre (FR-A25)** du hub doit rattraper. Quelle que soit la source, **`balance-service` est le garde-qualité unique**.

---

## User Story

En tant que **vertical intégré** (module de comptabilité d'une **IMF** ou d'un **distributeur**),
je veux **pousser ma balance sur le bus** (`balance.submitted`) au format canonique,
afin qu'elle soit **contrôlée, stockée et transmise au Bilan** **sans export de fichier**, et qu'elle reste **toujours à jour**.

---

## Description

### Contexte

**D13** pose que `balance-service` est un **hub canonique multi-source** alimenté par **3 adaptateurs**, tous convergeant vers le **même contrat** (`BalanceCanonique`, STORY-101) :

| # | Adaptateur | Story | Source | Préférence |
|---|---|---|---|---|
| **1** | **Ingestion directe `balance.submitted`** | **STORY-102 (ici)** | Verticaux **intégrés** (IMF, distributeur) | **✅ Préféré** — toujours à jour, sans export, sans parser |
| 2 | Import fichier | STORY-086 (CORE) | **Sage** (externe, hors bus) | Repli pour l'existant |
| 3 | Construction cahiers/OCR | STORY-082-085 | **PME informelle** (aucun système) | Dernier recours |

Le module compta d'une IMF est la **matérialisation par vertical** du `comptabilite-service` (décision **FI-2**, `deferred_foundations`) : il tient une comptabilité en partie double et sait produire une balance, **taguée `SFD-BCEAO`** (référentiel déjà planifié — `bilan-service` STORY-057).

**Ce que cette story change :** au lieu de demander à l'IMF d'**exporter** un fichier que `balance-service` **parserait**, l'IMF **émet** directement une `BalanceCanonique` sur le bus. Aucun parser, aucun format propriétaire, aucune dérive.

> **Le point clé (et la raison d'être du hub) :** une balance poussée par l'IMF passe **exactement les mêmes contrôles** qu'une balance Sage ou qu'une balance issue de cahiers — **équilibre Actif=Passif (FR-A25)**, doublons, format de compte, niveau de preuve. **Les contrôles sont écrits une fois, pas trois.**

### Périmètre

**Inclus :**

- **Contrat d'événement `BalanceSubmittedEventV1`** (défini en STORY-101, **implémenté et documenté ici** en tant que **contrat d'entrée public** du hub) :
  - Topic **`balance.submitted`** ; payload = `{ eventId, occurredAt, sourceSystem, balance: BalanceCanonique, metadata? }`.
  - `sourceSystem` : `ComptabiliteServiceIMF` | `ComptabiliteServiceDistributeur` | … (identifie le vertical émetteur).
  - La `balance` porte `source: 'direct'` et son **`referentiel`** (`SFD-BCEAO` pour une IMF, `SN`/`SMT` pour un distributeur).
- **Consumer `balance.submitted`** (groupe `balance-service-ingestion`) :
  - **Idempotent** : `ProcessedEvent` (`eventId` unique) — patron STORY-077. Rejeu du même événement → **NOP silencieuse**.
  - **Transactionnel** : validation + persistance + marqueur `ProcessedEvent` dans **la même session Mongo** (aucune mutation partielle).
  - **Validation identique aux autres sources** : délègue à **`BalanceValidator`** (STORY-101) — **équilibre `Σ D = Σ C` (FR-A25)**, pas de doublon de compte, format SYSCOHADA/SFD, `referentiel` connu, checksum.
  - **Persistance** : via `BalanceRepository.submitBalance` (STORY-101) — **idempotence par `(orgId, exercice, source, version)`**, versioning `N+1`, archivage de l'ancienne version.
- **Gestion du rejet (essentiel)** — une balance déséquilibrée **ne peut pas** être avalée en silence :
  - Balance invalide → **non persistée**, `etat: 'REJETÉE'` **enregistré** avec le **motif détaillé** (ex. `ECART_EQUILIBRE: 1 250 000 XOF`).
  - Émission d'un événement **`balance.rejected`** (topic) → le vertical émetteur **sait** que sa balance a été refusée et **pourquoi** (boucle de retour indispensable : sinon l'IMF croit avoir transmis).
  - `GET /api/v1/balance/rejets?exercice=…` (gate) → liste des rejets et motifs, pour diagnostic.
- **Autorisation service-à-service** : l'événement est **produit par un service** (pas un utilisateur). L'`orgId` porté par l'événement est **vérifié contre le read-model `entitlements`** (STORY-077) : un vertical ne peut pousser une balance **que pour une org qui lui est rattachée** → sinon **rejet** (`ORG_NON_AUTORISEE`). *(Dépend de la décision **C8** — auth M2M ; à défaut, restriction par `sourceSystem` déclaré + audit.)*
- **Traçabilité (NFR-A07)** : chaque ingestion trace `eventId`, `sourceSystem`, `occurredAt`, `checksum`, version créée, résultat (accepté/rejeté + motif).
- **Émission aval** : une balance acceptée émet **`balance.created`** (STORY-099) → consommée par `bilan-service`.
- **Tests** : ingestion nominale (IMF, `SFD-BCEAO`) → balance persistée + `balance.created` émis ; **idempotence** (même `eventId` ×3 → 1 seule balance) ; **balance déséquilibrée → rejet + `balance.rejected` + motif** ; org non autorisée → rejet ; re-soumission → `version: N+1` + archivage ; **contrôles identiques à ceux de STORY-086** (test croisé : même balance via fichier et via événement → **même résultat**).

**Hors périmètre :**

- **Le module compta de l'IMF lui-même** (production de la balance côté vertical) → **projet `prospera-IMF`** / `comptabilite-service` (FI-2). Ici on **reçoit**, on ne produit pas.
- **Référentiel SFD-BCEAO** (plan de comptes, table de passage) → **`bilan-service` STORY-057** (déjà planifié) ; `balance-service` ne fait que **valider le tag**.
- **Import fichier** → STORY-086 · **cahiers/OCR** → STORY-082-085.
- **Rendu de la liasse** → `bilan-service`.
- **Auth M2M définitive** → décision **C8** (`platform-catalog` STORY-034) ; ici on s'appuie dessus si disponible, sinon repli documenté.

### Flux

1. Le module compta de l'**IMF** clôture sa période et produit sa balance (partie double, référentiel **SFD-BCEAO**).
2. Il émet **`balance.submitted`** sur Kafka (via son **outbox transactionnel** — patron STORY-027) :
   ```json
   { "eventId": "…", "sourceSystem": "ComptabiliteServiceIMF",
     "balance": { "orgId": "…", "exercice": {...}, "source": "direct",
                  "referentiel": "SFD-BCEAO", "version": 1, "lignes": [...], "checksum": "…" } }
   ```
3. `balance-service` consomme (groupe `balance-service-ingestion`), **idempotent**.
4. **Autorisation** : l'`orgId` est-il rattaché à ce vertical (read-model `entitlements`) ? ✔
5. **Validation** (`BalanceValidator`, STORY-101) : **`Σ débit = Σ crédit` ?**
   - **✔ Équilibrée** → persistée (`version: 1`, `etat: BROUILLON`) → **`balance.created`** émis → `bilan-service` peut rendre la liasse.
   - **✘ Écart de 1 250 000 XOF** (le cas observé dans prospera-IMF) → **rejetée**, `etat: REJETÉE`, motif enregistré → **`balance.rejected`** émis → **l'IMF est notifiée** et corrige à la source.
6. Le cabinet consulte `GET /balance/rejets` et voit le motif exact.
7. L'IMF corrige, re-pousse → **`version: 2`**, l'ancienne est **archivée** (immutabilité, STORY-101).

---

## Acceptance Criteria

- [ ] **Consumer `balance.submitted`** (groupe `balance-service-ingestion`) : **idempotent** (même `eventId` rejoué ×3 → **une seule** balance) et **transactionnel** (validation + persistance + `ProcessedEvent` dans la même session).
- [ ] **Contrat d'entrée** `BalanceSubmittedEventV1` **implémenté et documenté** (schéma publié — c'est le contrat public du hub pour les verticaux).
- [ ] **Mêmes contrôles que les autres sources** : la validation délègue à **`BalanceValidator`** (STORY-101) — **équilibre FR-A25**, doublons, format de compte, `referentiel` connu, checksum. **Test croisé** : la même balance ingérée **par fichier (086)** et **par événement (102)** produit **le même résultat**.
- [ ] **Balance déséquilibrée → REJETÉE, non persistée en BROUILLON** : `etat: 'REJETÉE'` + **motif détaillé** (ex. `ECART_EQUILIBRE: 1 250 000 XOF`).
- [ ] **Boucle de retour** : émission de **`balance.rejected`** (topic) → le vertical émetteur **sait** que sa balance est refusée **et pourquoi** (jamais de rejet silencieux).
- [ ] **`GET /api/v1/balance/rejets`** (gate) : liste des rejets + motifs pour diagnostic.
- [ ] **Autorisation** : l'`orgId` de l'événement est **vérifié** contre le read-model `entitlements` (STORY-077) ; un vertical poussant pour une org non rattachée → **rejet `ORG_NON_AUTORISEE`** (+ audit).
- [ ] **Versioning** : re-soumission d'un exercice déjà ingéré → **`version: N+1`**, ancienne version **archivée** (jamais écrasée — STORY-101).
- [ ] **Référentiel `SFD-BCEAO`** accepté comme tag valide (aux côtés de `SN`/`SMT`) — la balance d'une IMF est ingérable **sans code spécifique**.
- [ ] **Balance acceptée → `balance.created` émis** (STORY-099) → consommable par `bilan-service`.
- [ ] **Traçabilité (NFR-A07)** : `eventId`, `sourceSystem`, `occurredAt`, `checksum`, version, résultat (accepté/rejeté + motif) tracés.
- [ ] **Aucun parser, aucun format propriétaire** : l'événement porte directement le contrat canonique.
- [ ] **Tests** : nominal IMF/SFD-BCEAO, idempotence ×3, déséquilibre → rejet + `balance.rejected`, org non autorisée, re-soumission → v2 + archivage, **test croisé fichier vs événement**. **Coverage ≥ 90 %.**
- [ ] **Documentation d'intégration** (`INTEGRATION.md`, cf. STORY-099) : **« Comment un vertical pousse sa balance »** (schéma d'événement, idempotence, motifs de rejet).
- [ ] **CI verte**.

---

## Technical Notes

### Contrat d'entrée (public — c'est ce que les verticaux implémentent)

```typescript
export interface BalanceSubmittedEventV1 {
  eventId: string;                 // UUID — clé d'idempotence
  occurredAt: Date;
  sourceSystem:
    | 'ComptabiliteServiceIMF'
    | 'ComptabiliteServiceDistributeur'
    | string;                      // extensible par vertical
  balance: BalanceCanonique;       // ← LE contrat (STORY-101) : source='direct', referentiel='SFD-BCEAO'|'SN'|'SMT'
  metadata?: { periode?: string; tentative?: number };
}

// Topic Kafka : balance.submitted   (entrée du hub)
// Topic Kafka : balance.rejected    (boucle de retour — INDISPENSABLE)
// Topic Kafka : balance.created     (sortie du hub → bilan-service, STORY-099)
```

### Le consumer — mêmes contrôles pour tout le monde

```typescript
async onBalanceSubmitted(event: BalanceSubmittedEventV1) {
  const session = await this.mongo.startSession();
  try {
    await session.withTransaction(async () => {
      // 1) Idempotence (patron STORY-077)
      if (await this.processedEvents.exists(event.eventId, session)) return; // NOP

      // 2) Autorisation : ce vertical peut-il pousser pour cette org ?
      if (!(await this.entitlements.orgRattachee(event.balance.orgId, event.sourceSystem, session))) {
        await this.rejeter(event, 'ORG_NON_AUTORISEE', session);
        return;
      }

      // 3) MÊME validation que Sage (086) et que les cahiers (085) — un seul garde-qualité
      const verdict = await this.balanceValidator.validate(event.balance); // FR-A25 : Σ D = Σ C
      if (!verdict.valide) {
        await this.rejeter(event, verdict.motif, session);   // ex. ECART_EQUILIBRE: 1 250 000 XOF
        return;                                              // ⚠️ jamais persistée en BROUILLON
      }

      // 4) Persistance idempotente + versioning (STORY-101)
      await this.balanceRepo.submitBalance(event.balance, session);
      await this.processedEvents.marquer(event.eventId, session);
    });
  } finally { await session.endSession(); }

  // 5) Aval (hors transaction) : succès → balance.created ; échec → balance.rejected (déjà enfilé)
}

private async rejeter(event, motif: string, session) {
  await this.balanceRepo.enregistrerRejet(event.balance, motif, session); // etat: REJETÉE + motif
  await this.outbox.enqueue('balance.rejected', {                          // BOUCLE DE RETOUR
    eventId: event.eventId, orgId: event.balance.orgId, sourceSystem: event.sourceSystem, motif,
  }, session);
  await this.processedEvents.marquer(event.eventId, session);              // idempotent même en rejet
}
```

### Pourquoi le rejet doit être *émis*, pas seulement journalisé

> Si `balance-service` se contente de logger le rejet, **l'IMF croit avoir transmis sa balance** et découvrira le problème… au moment de produire la liasse. `balance.rejected` **ferme la boucle** : le vertical est notifié, avec le motif, et corrige **à la source**.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Balance déséquilibrée avalée en silence** (le cas prospera-IMF) | **Rejet explicite** (`etat: REJETÉE` + motif) + **`balance.rejected` émis** → l'émetteur est notifié |
| Le vertical ne sait pas que sa balance a été refusée | **Boucle de retour obligatoire** (topic `balance.rejected`) + `GET /balance/rejets` |
| Contrôles divergents selon la source | **Un seul `BalanceValidator`** (STORY-101) partagé par les 3 adaptateurs ; **test croisé fichier vs événement** |
| Rejeu d'événements (redémarrage, replay) → doublons | **Idempotence** par `eventId` (`ProcessedEvent`) + idempotence de persistance `(orgId, exercice, source, version)` |
| Un vertical pousse pour une org qui n'est pas la sienne | **Vérification `entitlements`** → `ORG_NON_AUTORISEE` + audit (dépend de **C8** ; repli documenté) |
| Écrasement d'une balance existante | **Versioning `N+1`** + **archivage** (immutabilité STORY-101) |
| Couplage fort avec le vertical | Contrat **événementiel public** et versionné (`V1`) ; aucun appel synchrone |

---

## Definition of Done

- [ ] Consumer `balance.submitted` idempotent + transactionnel
- [ ] Contrat `BalanceSubmittedEventV1` implémenté et **documenté publiquement**
- [ ] **Mêmes contrôles que 086/085** (`BalanceValidator` partagé) — **test croisé** fichier vs événement
- [ ] Déséquilibre → **REJETÉE + motif + `balance.rejected` émis** (boucle de retour)
- [ ] `GET /balance/rejets` (diagnostic)
- [ ] Autorisation `orgId` ↔ vertical (`entitlements`) ; `ORG_NON_AUTORISEE` tracé
- [ ] Versioning `N+1` + archivage à la re-soumission
- [ ] Tag `SFD-BCEAO` accepté sans code spécifique
- [ ] Balance acceptée → `balance.created` (STORY-099)
- [ ] `INTEGRATION.md` : « Comment un vertical pousse sa balance »
- [ ] Coverage ≥ 90 % ; CI verte
- [ ] Non-régression : STORY-086 (fichier) et STORY-085 (cahiers) verts

---

**Status:** ready-for-dev
**Dependencies:** **STORY-101** (contrat + `BalanceValidator` + `BalanceRepository`), STORY-077 (read-model `entitlements` + patron idempotence), STORY-099 (émission `balance.created`) · **décision C8** (auth M2M) · **côté émetteur** : `comptabilite-service` du vertical (projet `prospera-IMF`, FI-2)
**Ferme** l'adaptateur **#1** (préféré) du hub D13 — avec 086 (fichier) et 085 (cahiers), les **3 sources convergent au même contrat**
**Reference:** `sprint-plan-atelier-balance-2026-07-12.md` §0 (D13) · `prd-atelier-balance-2026-07-12.md` § FR-A25
