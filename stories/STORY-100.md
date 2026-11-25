# STORY-100 : e2e Atelier (docker) — cahiers/OCR + Sage → balance → fiscal → handoff bilan-service

**Epic :** EPIC-024 — Simulation & conseil fiscal + contrôles & livraison
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § AB-08 (contrôles & livraison) · `sprint-plan-atelier-balance-2026-07-12.md` § Coordination balance/bilan · patron e2e docker STORY-049 (chaîne KYC complète)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** Terminée (2026-11-14) — jalon Atelier PRONONÇABLE (réserves levées, défaut corrigé) ; correctif du
2026-11-25 (le module `conseil` octroyé au cabinet, en fin de fiche)
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

- [x] **Stack docker racine** démarre `healthy` (auth + document + balance + bilan + mongo rs0 + kafka + minio + mailhog).
- [x] **Scénario A (PME/cahiers-OCR)** vert de bout en bout : profil OCR → 2 axes → référentiel → cahiers/OCR → rattachement → balance stockée → rapprochement → fiscal → conseil → contrôles → validation → handoff.
- [x] **Scénario B (cabinet/Sage)** vert de bout en bout : import Sage → reprise à-nouveaux → contrôles → fiscal → conseil → validation → handoff.
- [x] **Moteur fiscal** vérifié : **IS = max(MFP, IS)** (assertion sur les deux termes), TVA due, **TPU** pour le régime synthétique, provisions intégrées (44/89).
- [x] **⚠️ Garde-fous NFR-A04 assertés** : chaque levier d'optimisation est **tracé + base légale + plafonné** ; **plancher MFP respecté** ; **comparatif déposé/optimisé conserve les deux versions** (immutabilité) ; **l'e2e échoue si un levier minore l'impôt sans justification**.
- [x] **Contrôles** : équilibre bloquant → validation **409** ; Actif=Passif ; articulation résultat/CA/TVA ; **statut de preuve** transporté jusqu'au handoff ; `majorite_estimée` **livrable mais annotée**.
- [x] **Handoff** : `balance.created` émis et **consommé** (round-trip Kafka) + `GET /api/v1/balance/…` retourne la `BalanceCanonique` **avec statut de preuve**.
- [x] **Isolation tenant** (403 hors org) et **gate** (`@RequiresBalanceAccess` refuse si KYC ≠ APPROVED) vérifiées.
- [x] **Idempotence** : ré-ingestion `orgId+exercice+source` ne crée pas de doublon.
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

- [x] Suite e2e docker (scénarios A **et** B) implémentée et **verte** contre le stack racine
- [x] IS = max(MFP, IS), TVA, TPU, provisions **vérifiés** par assertions
- [x] **Garde-fous NFR-A04 assertés** (base légale + traçabilité + plancher MFP + double version conservée)
- [x] Contrôles + statut de preuve + validation 409-si-bloquant vérifiés
- [x] Handoff `balance.created` (round-trip Kafka) + API GET **avec statut de preuve**
- [x] Isolation tenant, gate KYC, idempotence vérifiées
- [ ] Non-régression : suites des services touchés vertes ; **CI verte**
- [x] Jalon **Module 1-bis (Atelier Balance) livré** prononçable

---

**Status:** ready-for-dev
**Created:** 2026-07-12
**Dependencies:** STORY-078 (référentiel/paquet fiscal), 079/080/081 (profil & axes & OCR), 082/083/084/085 (cahiers/OCR/rattachement), 086/087/088 (Sage + reprise), 089/090 (rapprochement), 091/092/093/094/095 (moteur fiscal), 096/097 (conseil + garde-fous NFR-A04), 098 (contrôles + statut de preuve), 099 (handoff), 101 (contrat), 102 (ingestion directe). **Toutes les stories de l'Atelier doivent être livrées.**
**Reference:** `prd-atelier-balance-2026-07-12.md` § AB-08 · patron e2e docker STORY-049 (chaîne KYC)

---

## Suivi — 2026-11-14 (recette verte, fusionnée ; jalon prononçable SOUS RÉSERVE)

**PR :** MoneyVibesGroup/prospera-recette#14 (sur `dev`). Le fichier est
`paquets/recette-croisee/recette/atelier-balance.recette.ts`.

### Résultat

Jouée sur une pile construite depuis `origin/dev` de chaque service : **50 étapes vertes, 3 `it.todo`
nommés, 0 échec**, en environ 3 min.
- Le cabinet est inscrit, vérifié par Mailhog et approuvé par les vraies routes.
- Les dossiers viennent de `dossier-service`.
- Aucun état n'est posé en base.

Les cases cochées ci-dessus sont celles que la recette **asserte**. Les autres restent ouvertes, pour les raisons qui suivent.

### Ce qui n'est PAS prouvé

1. **TPU (STORY-095)** : `GET …/fiscal/tpu` rend 409 `BAREME_TPU_INDISPONIBLE`. Le paquet fiscal
   togo@2026 ne publie pas le barème forfaitaire (CGI art. 130-131). Même refus sur les provisions
   d'un dossier synthétique. ⇒ La case « Moteur fiscal » reste ouverte. **C'est la réserve du jalon.**
2. **409 `CONTROLES_BLOQUANTS` à la validation** : aucune route publique ne laisse entrer une balance
   dont un contrôle bloquant échoue (400 hors plan, 422 déséquilibre, refusés en amont). Seule une
   écriture en base le produirait, et la recette se l'interdit. Le 409 `DEJA_VALIDEE`, lui, est asserté.
3. **Non-régression / CI** : la story ne modifie aucun service, donc aucune suite de service n'a été rejouée.

### ⚠️ Défaut probable trouvé : à ouvrir en story

Côté `balance-service`, sur un même dossier, deux balances 2026 `source: sage` sont VALIDÉE en
**version 3**, numérotées de deux façons :
- celle des provisions (`origine: PROVISIONS_FISCALES`) est numérotée sur toute la source ;
- l'import de clôture (`origine` nulle) est numéroté sur sa seule origine.

L'index unique inclut `origine`, donc rien n'est violé, mais « la balance sage v3 de 2026 » désigne
deux balances validées différentes. Il faut trancher : une suite de versions par source, ou par source et origine.

### Précisions de lecture

- **Le socle d'à-nouveaux porte les SOLDES de clôture** (sans mouvements, STORY-147). Les colonnes
  `aNouveau*` se constatent sur les balances de N soumises après le socle (STORY-423), pas sur le
  socle lui-même. Un premier jet de la recette attendait l'inverse ; il a été corrigé.
- ⚠️ La mise en route de la recette fait un `compose up` (reconstruction et rééquilibrage Kafka). Il ne faut pas la
  lancer en même temps qu'une autre suite lourde : on obtient sinon de faux « injoignable ».

---

## Suivi — 2026-11-14 (soir) : réserves LEVÉES, défaut CORRIGÉ — jalon prononçable

Décision PO du même jour : corriger le défaut et intégrer les deux réserves **dans STORY-100**, sans ouvrir de story.

**PR :**
- MoneyVibesGroup/prospera-balance-service#141, fusionnée sur `dev` ;
- MoneyVibesGroup/prospera-recette#15, fusionnée sur `dev`.

### 1. Défaut des versions : corrigé

`nextVersion` ne comptait que les balances sans origine. La balance provisionnée (`PROVISIONS_FISCALES`) et l'import de clôture portaient donc tous deux la v3.
- **Correctif** : il compte désormais toute la lignée (`derniereVersionDeLaLignee`, la lecture de STORY-528).
- **Recette** : les versions sage 2026 sont `4, 3, 2, 1`, sans doublon.

### 2. TPU forfaitaire : barème intégré au paquet, calcul éprouvé

**CGI Art. 135-5°** : activités commerciales et prestations non artisanales, CA ≤ 30 M, 7 tranches. Le barème est relevé à l'identique dans l'édition OTR 2025 (p. 75) et dans « CGI et LPF 2026 » (p. 77).
- **Paquet** : il entre dans `togo@2026` (sha256 `a2238ad7…`) et se lit fail-closed. La règle **R10** du build refuse un barème à trou ou à chevauchement.
- **Calcul**
  - le tarif est celui de la tranche ;
  - `taux: null` ;
  - aucun plancher de 20 000, qui est propre au déclaratif ;
  - l'exonération de l'Art. 128 s'applique ;
  - l'avertissement `TARIF_SPECIFIQUE_A_VERIFIER` est émis.
- **Hors calcul** : les autres tarifs de l'art. 135 (transporteurs, artisans, éleveurs, ambulants) dépendent d'une assiette qu'aucune balance ne porte. Ils sont nommés au paquet et le calcul avertit.
- **Écriture de provision** : elle cite désormais la base de sa composante (elle disait « déclarative » dans tous les cas).
- **Recette** : CA 1 000 000 FCFA ⇒ tranche n°1 ⇒ 10 000 FCFA. Le tarif attendu est recalculé depuis le texte du CGI, pas depuis le service. Les provisions passent en 641 / 441.

### 3. 409 `CONTROLES_BLOQUANTS` : éprouvé par une route publique

Les contrôles d'intégrité sont refusés dès le dépôt ; seul `EQUILIBRE_ACTIF_PASSIF` peut échouer à la validation, et il est réel sous **CIMA**.

**Recette** : un dossier d'assurance porte un solde net sur un compte d'engagements (`000`, classe 0). La balance est équilibrée, donc acceptée au dépôt. Sa validation est refusée en 409 `EQUILIBRE_ACTIF_PASSIF`, et elle reste BROUILLON.

### Résultat

**Recette croisée : 51/51, plus aucun `todo`**, avec balance-service reconstruit depuis la branche du correctif.

⚠️ La préparation de la recette fait un `up` sans `--build` : après un changement de service, il faut reconstruire son image.

---

## Correctif du 2026-11-25 — l'Atelier octroie `conseil` au cabinet (groupe B, lot 7, ordre « d »)

**Demande :** C, « → B (2026-11-25, STORY-1019) : la recette `atelier-balance` doit octroyer `conseil` au cabinet »
(journal de C, « Demandes », et « ⚠ Contrats », STORY-1019) ; placée par la session de groupe en ordre « d » du lot 7
de B, avant STORY-1119 (D-L7B-8). **Aucun identifiant neuf.** **Dépôt :** `prospera-recette`, branche
`MNV-100-conseil`, commits `MNV-100(recette): …` · **Exécutée par :** groupe B.

**Pourquoi :** depuis balance-service **#166** (`ab4e468` sur `dev`, STORY-1019), les 8 routes des scénarios et de la
justification (`dossiers/{dossierId}/fiscal/scenarios…`, `…/fiscal/dossier-justification`) exigent l'état publié du
module **`conseil`**, vendu à part de `balance`. La garde passe avant la portée du dossier ; une organisation qui a
`balance` sans `conseil` reçoit **403 `CONSEIL_NOT_ENTITLED`**. Le cabinet de l'Atelier ne recevait que `balance` et
`bilan` (`octroyer`, écrit ici le 14/11, `0874cff` ; remis dans l'ordre des dépendances par STORY-917, `2debafe`). La
chaîne commune rougissait donc à l'étape « conseil », sur ses deux profils.

### Où en est-on

- [x] Rituel : plan du lot 7, journaux de A, B, C, D (la demande de C du 25/11, placée en « d ») ; la recette était en
  HEAD détachée sur `origin/dev` (**`cd62296`**), propre ; branche `MNV-100-conseil` partie d'`origin/dev`.
- [x] Code relu avant d'écrire : la recette (toutes les suites), le profil de recette, la garde de balance
  (`conseil-access.guard.ts`, `ab4e468`), le manifeste `conseil` 1.0.0 au catalogue (`copies.json`, `66a4f6c`).
- [x] Code ; paquet de recette : `tsc`, `prettier`, unitaires 159/159 (16 suites).
- [x] Recette sur pile neuve (`grp-b-recette`, images depuis `origin/dev`, balance `ab4e468`) : rouge sur `dev`, vert
  sur la branche ; `cabinet-moteur` rejouée.
- [x] PR de code fusionnée en rebase : `prospera-recette` **#33** (`dev` **`9ca8abc`**, `mergedAt`
  `2026-11-25T21:15:55Z`, `headRefOid` `39d3bfb` = le commit testé, arbre identique).
- [x] PR de docs (fiche, tracker, journal de B). Verrou rendu.

### Décisions retenues par défaut (contestables)

- **D-100-1 — Le correctif se rattache à STORY-100.** C'est elle qui a écrit `octroyer` et l'octroi des droits du
  cabinet dans `atelier-balance` (`0874cff`, recette #14) ; STORY-917 (`2debafe`) n'a fait que remettre `balance`
  avant `bilan` pour le point de décision unique (STORY-945), sans rien décider des modules du cabinet. La suite est
  celle de STORY-100, et C la nomme ainsi.
- **D-100-2 — `conseil` au seul cabinet de l'Atelier, avec le référentiel de `balance`, et la porte attendue.**
  `octroyer(cabinet, 'conseil', [SYSCOHADA])`, après `balance` (dépendance dure du manifeste) : `syscohada-revise` est
  dans les `referentielFamilies` de `conseil`, comme pour `balance` et `bilan`. L'état publié arrive par Kafka
  (`etats_publies_conseil`) : le premier test attend que la porte du conseil s'ouvre, comme il attend déjà celle de
  `balance` et les dossiers, pour que la chaîne commune ne lise pas un `403` de course.
- **D-100-3 — Le voisin éprouve la porte.** Il a `balance` et `bilan`, pas `conseil` : un test neuf de « Transverse »
  exige `403 CONSEIL_NOT_ENTITLED` sur `GET …/fiscal/scenarios`, `POST …/fiscal/scenarios` (corps vide : la garde
  passe avant la validation) et `GET …/fiscal/dossier-justification`. Sans lui, la recette ne prouverait que le cas
  ouvert ; le refus est ce que STORY-1019 a changé.
- **D-100-4 — `conseil` n'entre pas dans `INSTALLATION_SERVICES` (option facultative de C, non retenue ici).**
  Lui donner une adresse change deux autres suites : `cabinet-moteur` (FR-6 prend `conseil` pour le module « sans
  adresse », à remplacer par `declarations`) et `abonnement` (le moteur installe `conseil` dans le pack : ses deux
  vérifications seraient alors jouées). C'est une autre preuve, plus lourde (trois suites, une pile), qui revient à
  **STORY-1129** (n° 11, « le cabinet sur le moteur ») : nommée dans son plan, pas faite ici.
- **D-100-5 — `INSTANCE_ESPACE=ESSAI` sur le balance de l'essai : déjà vrai, rien à changer.** La recette n'a qu'un
  `balance-service`, qui suit l'espace de la pile (`INSTANCE_ESPACE: ${RECETTE_ESPACE:-REEL}`, STORY-929, gardé par
  `profil-de-recette.spec.ts`) ; l'espace d'essai de la pile ne porte qu'`auth-essai` et `catalogue-essai` (STORY-1115).
  Une pile levée en `RECETTE_ESPACE=ESSAI` a donc déjà un balance « essai » ; aucun KYC à semer pour lui.
- **D-100-6 — Aucune autre suite n'appelle ces routes ; aucun contrat ne change.** Inventaire de la recette :
  seules les étapes de `atelier-balance` appellent les 8 routes. `cabinet-moteur` n'appelle que les vérifications de
  bilan (`…/instance/bilan/…/verifications/gate-conseil`) et installe `balance` et `bilan` ; `abonnement` octroie
  `conseil` sans appeler balance. Rien d'annoncé dans « ⚠ Contrats » : seule une suite de recette change.

### Livré

- **prospera-recette #33** (`9ca8abc` sur `dev`) — `paquets/recette-croisee/recette/atelier-balance.recette.ts` :
  - `octroyer(cabinet, 'conseil', [SYSCOHADA])` après les droits `balance` et `bilan` des trois cabinets ;
  - le premier test attend la porte du conseil (`GET …/fiscal/scenarios` sans `CONSEIL_NOT_ENTITLED`) ;
  - test neuf « ⛔ gate — `balance` sans `conseil` » (D-100-3) ; en-tête de la suite à jour.

### Preuves

- **Paquet de recette (Node 25)** : `tsc --noEmit`, `prettier --check` verts ; unitaires **159/159** (16 suites).
- **Pile `grp-b-recette` neuve** (volumes neufs), images construites depuis `git -c core.autocrlf=false archive
  origin/dev` : auth `d69e34c`, kyc `9cef9cb`, catalogue `66a4f6c`, notification `749b3cd`, paiement `e2be149`,
  dossier `645a699`, **balance `ab4e468`** (la garde `conseil-access.guard.js` vue dans l'image), bilan `4317dd2`,
  document `0716a58`, BFF `0dfcf43`.
- **Rouge sur `dev`** (recette `cd62296`) : `npm run recette -- atelier-balance` : **10 échecs, 41 passés** (403 s).
  Les cinq étapes du conseil, sur les deux profils (A et B) : « ⛔ NFR-A04 » (400 attendu, 403 reçu), scénario,
  simulation, comparatif, dossier de justification. Toutes en `403 CONSEIL_NOT_ENTITLED` (« Accès refusé : le module de
  conseil fiscal n'est pas ouvert pour l'organisation. »). C'est aussi la mutation de l'octroi : sans lui, la suite
  rougit.
- **Vert sur la branche** (`39d3bfb`), même pile : `npm run recette -- atelier-balance cabinet-moteur` : **2/2 suites,
  61 passés, 2 sautés**, 461 s. `atelier-balance` **52/52**, dont le test neuf du voisin (`403 CONSEIL_NOT_ENTITLED` sur
  les trois routes) ; 409 `CONTROLES_BLOQUANTS` toujours éprouvé. `cabinet-moteur` **9 passés**, FR-6 compris
  (`conseil` toujours « sans adresse », `SERVICE_NON_CONFIGURE`). Les 2 sautés sont la démonstration C13, jouée
  seulement en `RECETTE_ESPACE=ESSAI`, comme avant.
- **Verrou** : pris à 20:56, rendu à 21:15 après `down -v` (profil `recette`) ; aucun conteneur, volume ni réseau
  `grp-b` ne reste.

### Ce qui reste

- **STORY-1129** (n° 11) : donner une adresse à `conseil` dans `INSTALLATION_SERVICES` et changer le module « sans
  adresse » de FR-6 (`declarations`), avec `cabinet-moteur` et `abonnement` rejouées (D-100-4).
