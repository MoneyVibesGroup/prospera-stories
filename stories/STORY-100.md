# STORY-100 : e2e Atelier (docker) — cahiers/OCR + Sage → balance → fiscal → handoff bilan-service

**Epic :** EPIC-024 — Simulation & conseil fiscal + contrôles & livraison
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § AB-08 (contrôles & livraison) · `sprint-plan-atelier-balance-2026-07-12.md` § Coordination balance/bilan · patron e2e docker STORY-049 (chaîne KYC complète)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 19 (EXTENDED)
**Service :** `balance-service` (:3007) — orchestration multi-services (document-service :3006, bilan-service :3004)
**Couvre :** jalon Module 1-bis (Atelier Balance livré) — vérification bout-en-bout des FR-A01→A28

> **Le jalon de livraison de l'Atelier Balance.** Toutes les briques (076→099, 101, 102) sont livrées ; cette story **prouve qu'elles s'enchaînent réellement**, en docker, sur les **deux profils clients** cibles : la **PME informelle** (cahiers + OCR) et le **cabinet structuré** (import Sage). Une balance est **construite**, **contrôlée**, passée au **moteur fiscal** (résultat fiscal, IS=max(MFP,IS), TVA, TPU), enrichie du **conseil légal** (scénarios + dossier de justification), puis **remise** au `bilan-service` — le tout **avec son statut de preuve**. C'est le test qui dit « le module tient debout, de bout en bout ».
>
> **⚠️ Garde-fous de conformité (NFR-A04) — non négociables dans l'e2e.** Le scénario de conseil fiscal **doit** vérifier qu'aucun levier proposé n'est une **minoration non justifiée** : chaque optimisation est **traçable**, adossée à une **base légale**, **plafonnée** (plancher MFP respecté), et le **comparatif « déposé vs optimisé »** conserve les **deux** versions (immutabilité). Optimiser légalement, **jamais frauder** : l'e2e échoue si un levier réduit l'impôt sans justification tracée.

---

## User Story

En tant que **responsable produit / release manager**,
je veux un **test e2e docker** qui déroule l'Atelier Balance de bout en bout sur les **deux profils clients** (cahiers/OCR **et** Sage),
afin de **valider le jalon Module 1-bis** : construire une balance, la contrôler, calculer le fiscal, produire le conseil **avec garde-fous**, et la **remettre** au `bilan-service`.

---

## Description

### Contexte

L'Atelier Balance est un **hub multi-source** (D13) qui alimente le `bilan-service` (D14, split CORE/EXTENDED). Les stories individuelles sont testées unitairement et en e2e local ; **cette story assemble la chaîne complète en docker**, sur des données réalistes, pour les **deux parcours** que le PRD cible :

- **Parcours PME informelle** : profil société (OCR Statuts/CFE) → cahiers recettes/dépenses + OCR pièces → rattachement plan comptable → balance reconstituée → rapprochement bancaire → fiscal + conseil → handoff.
- **Parcours cabinet structuré** : import balance Sage 100 → reprise à-nouveaux → contrôles → fiscal + conseil → handoff.

C'est l'équivalent, pour le module Atelier, de **STORY-049** (e2e chaîne KYC) : un **jalon** qui échoue si une seule couture casse.

### Périmètre

**Inclus :**

- **Suite e2e docker** (`balance-service/test/atelier.e2e-spec.ts` ou script `test/e2e-atelier-docker.sh`) exécutée contre le **stack racine** (auth-service :3001 + document-service :3006 + balance-service :3007 + bilan-service :3004 + mongo rs0 + kafka + minio + mailhog).
- **Scénario A — PME informelle (cahiers/OCR)** :
  1. Register org (IdP) → verify → login → JWT RS256 ; KYC APPROVED (pré-requis gate `@RequiresBalanceAccess`, STORY-077).
  2. **Profil société** créé/pré-rempli par **OCR Statuts + CFE** (STORY-081 → document-service) puis validé (STORY-079) ; **2 axes** déterminés (système SN/SMT + régime fiscal, STORY-080).
  3. **Référentiel** SN/SMT + paquet fiscal pays **chargés** (loader/checksum/cache, STORY-078).
  4. **Cahier de recettes** (STORY-082) + **cahier de dépenses** (STORY-083) saisis ; **OCR captures/factures** (STORY-084 → document-service) ; **rattachement au plan comptable** (STORY-085).
  5. → **BalanceCanonique** construite et stockée (contrat D13, STORY-101), tagée `source: ocr`, `niveauPreuve` par ligne.
  6. **Rapprochement bancaire** (relevés + mobile money, STORY-089/090) → lignes rapprochées passent en `fichier`.
- **Scénario B — cabinet structuré (Sage)** :
  1. Login + KYC APPROVED.
  2. **Import balance Sage 100** (Excel/CSV, STORY-086) → **BalanceCanonique** `source: sage`.
  3. **Reprise à-nouveaux / balance d'ouverture** (STORY-087) + profil d'import réutilisable (STORY-088).
- **Chaîne fiscale commune (sur la balance produite)** :
  - **Résultat fiscal** (réintégrations/déductions, codes DSF — STORY-091).
  - **Liquidation IS = max(MFP, IS)** + 4 acomptes (STORY-092) **ou** **TPU** si régime synthétique (STORY-095).
  - **TVA** (collectée/déductible/due) + taxes (STORY-093) ; **provisions fiscales** intégrées à la balance (comptes 44/89 — STORY-094).
- **Conseil fiscal + garde-fous (NFR-A04)** :
  - **Scénarios d'optimisation légale** (leviers → impact IS, **plancher MFP respecté** — STORY-096).
  - **Comparatif « déposé vs optimisé »** + **dossier de justification** (base légale + pièce) + **garde-fous conformité** (STORY-097) : l'e2e **assert** que chaque levier est **tracé**, **justifié**, **plafonné**, et que les **deux versions sont conservées** (immutabilité, NFR-A04).
- **Contrôles + statut de preuve** (STORY-098) : intégrité (équilibre bloquant), cohérence (Actif=Passif, articulation résultat/CA/TVA), **statut de preuve pondéré par les montants** ; **validation refusée (409) si bloquant** ; balance `majorite_estimée` **livrable mais annotée**.
- **Handoff bilan-service** (STORY-099) : après validation → immuable → **émission `balance.created`** + API `GET /api/v1/balance/…` → un **consumer** (bilan-service ou consumer de test) reçoit la balance **avec son statut de preuve**.
- **Assertions transverses** : isolation tenant (403 hors org), gate `@RequiresBalanceAccess` (KYC non APPROVED → refus), **idempotence** (ré-ingestion `orgId+exercice+source` ne duplique pas), **non-régression** des suites existantes.

**Hors périmètre :**

- **Rendu de la liasse DSF / états financiers** → `bilan-service` (EPIC-010/011) : l'e2e Atelier s'arrête au **handoff** (la balance remise), pas au bilan produit. *(L'e2e interop réel balance→bilan reste côté `bilan-service`, cf. STORY-099.)*
- **Export PDF/Excel** → `bilan-service` (EPIC-014).
- **Nouveaux comportements** : cette story **ne code aucune feature** — elle **orchestre et vérifie** l'existant (078→099, 101, 102). Tout écart révélé → **bug** corrigé dans la story concernée.
- **Tests de charge / performance** → hors périmètre (fonctionnel bout-en-bout uniquement).

### Flux (scénario A résumé)

1. `docker compose up` (stack racine) → tous les services `healthy`.
2. Register/verify/login (IdP) → JWT RS256 ; KYC upload + approve admin → APPROVED.
3. OCR Statuts+CFE (document-service) → profil pré-rempli → validé ; 2 axes déterminés.
4. Référentiel + paquet fiscal chargés (checksum OK, cache).
5. Cahiers recettes/dépenses + OCR pièces → rattachement plan comptable → **BalanceCanonique** stockée.
6. Rapprochement bancaire → niveaux de preuve mis à jour.
7. Résultat fiscal → IS=max(MFP,IS) (ou TPU) → TVA/taxes → provisions intégrées.
8. Scénarios d'optimisation → comparatif déposé/optimisé + dossier de justification (**garde-fous assertés**).
9. Contrôles : aucun bloquant → **validation** → immuable.
10. **Handoff** : `balance.created` émis + API GET → consumer reçoit la balance **+ statut de preuve**.
11. Assertions finales : montants cohérents, isolation tenant, idempotence, garde-fous NFR-A04 respectés.

---

## Acceptance Criteria

- [ ] **Stack docker racine** démarre `healthy` (auth + document + balance + bilan + mongo rs0 + kafka + minio + mailhog).
- [ ] **Scénario A (PME/cahiers-OCR)** vert de bout en bout : profil OCR → 2 axes → référentiel → cahiers/OCR → rattachement → balance stockée → rapprochement → fiscal → conseil → contrôles → validation → handoff.
- [ ] **Scénario B (cabinet/Sage)** vert de bout en bout : import Sage → reprise à-nouveaux → contrôles → fiscal → conseil → validation → handoff.
- [ ] **Moteur fiscal** vérifié : **IS = max(MFP, IS)** (assertion sur les deux termes), TVA due, **TPU** pour le régime synthétique, provisions intégrées (44/89).
- [ ] **⚠️ Garde-fous NFR-A04 assertés** : chaque levier d'optimisation est **tracé + base légale + plafonné** ; **plancher MFP respecté** ; **comparatif déposé/optimisé conserve les deux versions** (immutabilité) ; **l'e2e échoue si un levier minore l'impôt sans justification**.
- [ ] **Contrôles** : équilibre bloquant → validation **409** ; Actif=Passif ; articulation résultat/CA/TVA ; **statut de preuve** transporté jusqu'au handoff ; `majorite_estimée` **livrable mais annotée**.
- [ ] **Handoff** : `balance.created` émis et **consommé** (round-trip Kafka) + `GET /api/v1/balance/…` retourne la `BalanceCanonique` **avec statut de preuve**.
- [ ] **Isolation tenant** (403 hors org) et **gate** (`@RequiresBalanceAccess` refuse si KYC ≠ APPROVED) vérifiées.
- [ ] **Idempotence** : ré-ingestion `orgId+exercice+source` ne crée pas de doublon.
- [ ] **Non-régression** : suites e2e des services touchés restent vertes ; **CI verte**.

---

## Technical Notes

### Orchestration (extrait, patron STORY-049)

```typescript
describe('e2e Atelier Balance (docker)', () => {
  it('Scénario A — PME informelle (cahiers/OCR) → handoff', async () => {
    const { token, orgId } = await bootstrapTenantApprouve(); // register→verify→login→KYC APPROVED

    // Profil société via OCR (document-service) + 2 axes
    await uploadStatutsEtCfe(orgId, token);                    // STORY-081 → document.extrait
    const profil = await validerProfil(orgId, token);          // STORY-079
    expect(profil.axes).toMatchObject({ systeme: 'SN', regime: expect.any(String) }); // STORY-080

    // Construction balance chemin A
    await chargerReferentiel(orgId, token);                    // STORY-078 (checksum/cache)
    await saisirCahiers(orgId, token);                         // STORY-082/083 (+ OCR 084)
    await rattacherPlanComptable(orgId, token);                // STORY-085
    const balance = await getBalance(orgId, '2026', 'ocr', token); // STORY-101
    await rapprocherBanque(orgId, token);                      // STORY-089/090 → niveauPreuve

    // Fiscal
    const fiscal = await calculerFiscal(orgId, '2026', token); // 091/092/093/094 (ou 095 TPU)
    expect(fiscal.is).toBe(Math.max(fiscal.mfp, fiscal.isTheorique)); // IS = max(MFP, IS)

    // Conseil + GARDE-FOUS NFR-A04
    const conseil = await simulerOptimisation(orgId, '2026', token); // STORY-096/097
    for (const levier of conseil.leviers) {
      expect(levier.baseLegale).toBeTruthy();      // jamais de minoration non justifiée
      expect(levier.tracabilite).toBeTruthy();
      expect(conseil.isOptimise).toBeGreaterThanOrEqual(fiscal.mfp); // plancher MFP
    }
    expect(conseil.depose).toBeDefined();
    expect(conseil.optimise).toBeDefined();         // les DEUX versions conservées (immutabilité)

    // Contrôles + validation + handoff
    const controles = await getControles(orgId, '2026', token); // STORY-098
    expect(controles.bloquants).toBe(0);
    await validerBalance(orgId, '2026', 'ocr', token);          // → immuable
    const evt = await attendreEvenement('balance.created');     // STORY-099 round-trip Kafka
    expect(evt.balance.statutPreuve).toBeDefined();             // le statut ACCOMPAGNE la balance
  });

  it('Scénario B — cabinet Sage → handoff', async () => { /* import 086 → reprise 087 → fiscal → handoff */ });
});
```

### Garde-fou de conformité (le test qui protège NFR-A04)

```typescript
// ✅ Un levier d'optimisation SANS base légale tracée doit faire ÉCHOUER l'e2e.
//    C'est la traduction opérationnelle de « optimiser légalement, jamais frauder ».
const leviersNonJustifies = conseil.leviers.filter(l => !l.baseLegale || !l.tracabilite);
expect(leviersNonJustifies).toHaveLength(0);
```

---

## Risques & Mitigation

| Risque | Mitigation |
|--------|-----------|
| L'e2e devient fragile (dépend de 20 stories) | Découpage clair scénario A / scénario B ; helpers réutilisables ; échec localisé à la story fautive |
| **Levier d'optimisation non justifié passe** (fraude silencieuse) | **Assertion NFR-A04 dédiée** : base légale + traçabilité + plancher MFP obligatoires, sinon e2e rouge |
| OCR non déterministe (document-service) | Fixtures Statuts/CFE contrôlées ; assertions tolérantes sur le texte, strictes sur les champs clés |
| Round-trip Kafka `balance.created` non reçu | Attente bornée + retry ; consumer de test dédié (patron STORY-099) |
| Statut de preuve perdu au handoff | Assertion explicite : `evt.balance.statutPreuve` présent (STORY-098 → STORY-099) |
| Rendu bilan attendu dans l'e2e | **Hors périmètre** : l'Atelier s'arrête au handoff ; l'interop réelle balance→bilan est côté `bilan-service` |

---

## Definition of Done

- [ ] Suite e2e docker (scénarios A **et** B) implémentée et **verte** contre le stack racine
- [ ] IS = max(MFP, IS), TVA, TPU, provisions **vérifiés** par assertions
- [ ] **Garde-fous NFR-A04 assertés** (base légale + traçabilité + plancher MFP + double version conservée)
- [ ] Contrôles + statut de preuve + validation 409-si-bloquant vérifiés
- [ ] Handoff `balance.created` (round-trip Kafka) + API GET **avec statut de preuve**
- [ ] Isolation tenant, gate KYC, idempotence vérifiées
- [ ] Non-régression : suites des services touchés vertes ; **CI verte**
- [ ] Jalon **Module 1-bis (Atelier Balance) livré** prononçable

---

**Status:** ready-for-dev
**Created:** 2026-07-12
**Dependencies:** STORY-078 (référentiel/paquet fiscal), 079/080/081 (profil & axes & OCR), 082/083/084/085 (cahiers/OCR/rattachement), 086/087/088 (Sage + reprise), 089/090 (rapprochement), 091/092/093/094/095 (moteur fiscal), 096/097 (conseil + garde-fous NFR-A04), 098 (contrôles + statut de preuve), 099 (handoff), 101 (contrat), 102 (ingestion directe). **Toutes les stories de l'Atelier doivent être livrées.**
**Reference:** `prd-atelier-balance-2026-07-12.md` § AB-08 · patron e2e docker STORY-049 (chaîne KYC)
