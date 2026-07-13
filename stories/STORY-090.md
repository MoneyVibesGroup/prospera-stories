# STORY-090 : Rapprochement (relevés ↔ cahiers) + état de rapprochement + situation de compte

**Epic :** EPIC-022 — Rapprochement bancaire
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A16, FR-A17 · `rapport-bilan-logique-metier-2026-07-12.md` §4 (hiérarchie de preuve ; règle « tout dépôt = une entrée ») · STORY-089 (relevés), STORY-082/083 (cahiers)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 17 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A16 (rapprochement), FR-A17 (état de rapprochement + situation de compte)

> **Le contrôle qui transforme une balance déclarative en balance défendable.** Les cahiers disent ce que le client **déclare** ; les relevés disent ce qui s'est **réellement passé**. Cette story les **confronte** : chaque ligne de relevé est appariée à une ligne de cahier — et **ce qui ne s'apparie pas est exactement ce qui compte** :
> - un **encaissement sans recette déclarée** → **recette non déclarée** (risque de redressement) ;
> - une **dépense déclarée sans décaissement** → **charge fictive** (risque de fraude) ;
> - un **décaissement sans dépense déclarée** → **charge oubliée** (impôt payé en trop).
>
> Le rapprochement **élève aussi le niveau de preuve** : une recette confirmée par un relevé passe de `saisie` à **`fichier`** — et améliore le `statutPreuve` de la balance (FR-A27). C'est le mécanisme qui rend l'Atelier **crédible face à l'OTR**.

---

## User Story

En tant que **cabinet comptable**,
je veux **confronter les relevés bancaires et mobile money aux cahiers** du client, apparier ce qui correspond et **voir clairement ce qui ne correspond pas**,
afin de **détecter les recettes non déclarées et les charges non justifiées**, et de produire un **état de rapprochement** défendable.

---

## Description

### Contexte

La règle métier posée au cadrage est brutale et juste : **« tout dépôt est une entrée »**. Un encaissement sur le compte qui n'a **aucune recette correspondante** dans le cahier est, par défaut, un **produit non déclaré** — jusqu'à preuve du contraire (apport en compte courant, remboursement, virement interne…). C'est **au comptable de qualifier**, mais le système doit **le lui montrer**.

Symétriquement, une **dépense déclarée** sans décaissement correspondant est suspecte : soit elle a été payée en **espèces** (donc hors relevé — normal), soit elle n'existe pas (**charge fictive**).

Le rapprochement produit donc **trois sorties** :

| Sortie | Contenu | Usage |
|---|---|---|
| **Appariements** | Relevé ↔ cahier (auto + manuels) | Élève le `niveauPreuve` → `fichier` |
| **Écarts** | Non appariés, des deux côtés, **qualifiés** | Détection recettes non déclarées / charges fictives |
| **État de rapprochement** | Solde comptable ↔ solde bancaire, réconciliés | Pièce justificative (FR-A17) |

> **Le système propose, il ne qualifie pas.** L'appariement automatique **propose** ; un écart est **signalé**, pas interprété. Créer une recette d'office depuis un encaissement inexpliqué serait une **écriture inventée** — interdit (NFR-A04).

### Périmètre

**Inclus :**

- **Moteur d'appariement** (`RapprochementService.apparier(orgId, compteId, periode)`) :
  - **Règle 1 — exacte** : même `montant` + `date` à ±J jours (paramétrable, défaut **3**) + `sens` cohérent (CREDIT relevé ↔ recette ; DEBIT relevé ↔ dépense) → **appariement automatique**, confiance **HAUTE**.
  - **Règle 2 — floue** : même montant, date plus éloignée, **ou** similarité de libellé/tiers → **appariement proposé**, confiance **MOYENNE** → **confirmation humaine requise**.
  - **Règle 3 — groupée** : un encaissement unique correspondant à **plusieurs recettes** (remise de chèques, versement global) ou l'inverse → **appariement N↔1 / 1↔N** proposé si `Σ montants` correspond.
  - **Aucun appariement forcé** : en cas d'ambiguïté (2 candidats identiques), **les deux sont proposés**, aucun choisi.
- **Appariement manuel** (`POST /api/v1/rapprochement/apparier`) : le comptable relie explicitement `ligneReleveId ↔ [ligneCahierIds]` → statut `RAPPROCHE` des deux côtés, **tracé**.
- **Élévation du niveau de preuve (essentiel)** : une ligne de cahier **rapprochée** d'un relevé passe à **`niveauPreuve: 'fichier'`** (preuve d'un tiers) → **remonte** au `statutPreuve` de la balance (FR-A27, STORY-085/101). *(Le dé-rapprochement la fait redescendre — la preuve n'est pas acquise à vie.)*
- **Qualification des écarts** (`GET /api/v1/rapprochement/ecarts`) — le cœur de la valeur :
  - **`ENCAISSEMENT_NON_DECLARE`** : ligne de relevé au **CRÉDIT**, non appariée → **recette potentiellement non déclarée** ⚠️ (le plus important).
  - **`DECAISSEMENT_NON_DECLARE`** : ligne de relevé au **DÉBIT**, non appariée → charge oubliée (impôt payé en trop).
  - **`RECETTE_SANS_ENCAISSEMENT`** : recette déclarée, aucun encaissement → normal si **espèces** ou **créance client** (`411`) ; sinon **suspect**.
  - **`DEPENSE_SANS_DECAISSEMENT`** : dépense déclarée, aucun décaissement → normal si **espèces** ou **dette fournisseur** (`401`) ; sinon **charge potentiellement fictive** ⚠️.
  - Chaque écart est **qualifiable par l'humain** : `JUSTIFIE` (+ motif : apport en compte courant, virement interne, paiement espèces…) | `A_CORRIGER` | `EN_ATTENTE`. **Tracé** (NFR-A07).
- **État de rapprochement (FR-A17)** — `GET /api/v1/rapprochement/etat?compteId=&au=` :
  ```
  Solde du relevé au 31/12/2026 .................  1 300 000
  + Encaissements non encore comptabilisés ......   + 120 000
  − Décaissements non encore comptabilisés ......   −  45 000
  = Solde comptable théorique ...................  1 375 000
  Solde du compte 521 en comptabilité ...........  1 375 000
  ÉCART .........................................          0  ✔
  ```
  Un **écart non nul** est **affiché**, jamais absorbé.
- **Situation de compte (FR-A17)** — `GET /api/v1/rapprochement/situation?compteId=&au=` : solde d'ouverture, total entrées, total sorties, solde de clôture, **nb de lignes non rapprochées** — la vue « où en est ce compte ».
- **Tests** : appariement exact (montant + date ±3j) ; appariement flou → **proposé**, non appliqué ; **ambiguïté (2 candidats) → aucun choisi automatiquement** ; appariement groupé (N↔1) ; appariement manuel ; **élévation du niveau de preuve → `fichier`** et **redescente au dé-rapprochement** ; **encaissement non déclaré détecté** (test central) ; dépense sans décaissement (espèces) → écart **justifiable** ; état de rapprochement **équilibré** ; écart non nul **affiché** ; **aucune écriture créée automatiquement** (test explicite) ; isolation `orgId`.

**Hors périmètre :**

- **Import des relevés** → **STORY-089** (prérequis).
- **Saisie des cahiers** → STORY-082/083 · **OCR** → STORY-084.
- **Création automatique de lignes** depuis un écart → **interdit** (NFR-A04) : le comptable **crée** la recette manquante via STORY-082 s'il le décide.
- **Lettrage clients/fournisseurs** (rapprochement des factures et règlements par tiers) → **hors v1** (relève d'un `comptabilite-service` complet, FI-2).
- **Rapprochement de la caisse espèces** : par nature **sans relevé** → hors périmètre ; les flux espèces expliquent légitimement une partie des écarts (qualification `JUSTIFIE`).

### Flux

1. Les relevés (banque + TMoney) sont importés (**STORY-089**) ; les cahiers sont saisis (**STORY-082/083**).
2. Le cabinet lance : `POST /api/v1/rapprochement/lancer?compteId=…&periode=2026-03`.
3. **Appariement automatique** : sur 84 lignes de relevé → **71 appariées** (exact), **6 proposées** (flou, à confirmer), **7 non appariées**.
4. Le comptable **confirme** les 6 propositions floues, en **rejette une** (faux positif).
5. **Écarts** (`GET /rapprochement/ecarts`) :
   - **3 `ENCAISSEMENT_NON_DECLARE`** (dépôts de 250 000, 180 000, 90 000) ⚠️ → le comptable interroge le client : 2 sont des **ventes oubliées** → il **crée** les recettes manquantes (STORY-082) ; 1 est un **apport du gérant** → qualifié **`JUSTIFIE`** (motif : apport en compte courant → compte `462`).
   - **1 `DEPENSE_SANS_DECAISSEMENT`** → payée en **espèces** → qualifiée `JUSTIFIE`.
6. **Élévation de preuve** : les 71 + 5 lignes de cahier rapprochées passent en **`niveauPreuve: 'fichier'`** → le `statutPreuve` de la balance s'améliore (FR-A27).
7. **État de rapprochement** : solde relevé **1 300 000** + en-cours = **solde comptable 1 375 000** = compte `521` → **écart 0** ✔ → l'état est la **pièce justificative** de la clôture.
8. La balance (STORY-085) est régénérée avec les recettes ajoutées → contrôles (STORY-098) → handoff (STORY-099).

---

## Acceptance Criteria

- [ ] **Appariement automatique exact** : même `montant`, `date` à **±J jours** (paramétrable, défaut 3), `sens` cohérent → statut `RAPPROCHE` des deux côtés, confiance **HAUTE**.
- [ ] **Appariement flou** (date éloignée / similarité de libellé) → **proposé** avec confiance **MOYENNE**, **jamais appliqué sans confirmation humaine**.
- [ ] **Ambiguïté** (≥ 2 candidats équivalents) → **tous proposés, aucun choisi automatiquement**.
- [ ] **Appariement groupé** N↔1 / 1↔N (remise globale) proposé si `Σ montants` correspond.
- [ ] **Appariement manuel** (`POST /rapprochement/apparier`) : relie explicitement relevé ↔ cahier(s), **tracé** (NFR-A07).
- [ ] **⚠️ Élévation du niveau de preuve** : une ligne de cahier rapprochée passe à **`niveauPreuve: 'fichier'`** → **remonte** au `statutPreuve` de la balance (FR-A27). Le **dé-rapprochement la fait redescendre** (test dédié).
- [ ] **Qualification des écarts** — les 4 types détectés et listés :
  - **`ENCAISSEMENT_NON_DECLARE`** (crédit non apparié) → **recette potentiellement non déclarée** *(test central)*
  - `DECAISSEMENT_NON_DECLARE` (débit non apparié)
  - `RECETTE_SANS_ENCAISSEMENT` (normal si espèces / créance `411`)
  - **`DEPENSE_SANS_DECAISSEMENT`** (normal si espèces / dette `401` ; sinon **charge potentiellement fictive**)
- [ ] Chaque écart est **qualifiable** par l'humain (`JUSTIFIE` + motif | `A_CORRIGER` | `EN_ATTENTE`) et **tracé**.
- [ ] **⚠️ Aucune écriture créée automatiquement** depuis un écart (test explicite) — NFR-A04 : le comptable crée la recette manquante lui-même (STORY-082).
- [ ] **État de rapprochement (FR-A17)** : solde relevé ± en-cours = **solde comptable** ; un **écart non nul est AFFICHÉ**, **jamais absorbé** par une ligne d'ajustement.
- [ ] **Situation de compte (FR-A17)** : solde d'ouverture, entrées, sorties, solde de clôture, **nb non rapprochés**.
- [ ] **Isolation `orgId`** (JWT) — test e2e.
- [ ] **Tests** : exact, flou (proposé), ambiguïté (aucun choisi), groupé, manuel, **élévation + redescente de preuve**, **encaissement non déclaré détecté**, écart justifiable (espèces), état équilibré, **écart non nul affiché**, aucune écriture auto. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Appariement — proposer, jamais forcer

```typescript
async apparier(orgId: string, compteId: string, periode: DateRange): Promise<ResultatRapprochement> {
  const releve  = await this.releveRepo.nonRapproches(orgId, compteId, periode);
  const cahiers = await this.cahierRepo.nonRapproches(orgId, periode);

  const auto: Appariement[] = [];
  const proposes: Appariement[] = [];

  for (const r of releve) {
    const candidats = cahiers.filter(c =>
      Math.abs(c.montant - r.montant) <= 1 &&                       // tolérance 1 XOF
      sensCoherent(r.sens, c.type) &&
      joursEntre(r.date, c.date) <= this.cfg.toleranceJours          // défaut 3
    );

    if (candidats.length === 1) {
      auto.push({ releve: r, cahiers: [candidats[0]], confiance: 'HAUTE' });
    } else if (candidats.length > 1) {
      // ⚠️ AMBIGUÏTÉ : on propose TOUS les candidats, on n'en choisit AUCUN
      proposes.push(...candidats.map(c => ({ releve: r, cahiers: [c], confiance: 'MOYENNE' as const })));
    }
    // 0 candidat → écart (qualifié plus bas)
  }

  return { auto, proposes, ecarts: this.qualifierEcarts(releve, cahiers, auto) };
}
```

### Élévation (et redescente) du niveau de preuve

```typescript
async confirmerAppariement(a: Appariement, user: User) {
  await this.releveRepo.marquer(a.releve.id, 'RAPPROCHE');

  for (const c of a.cahiers) {
    // Un relevé est une preuve TIERCE → le niveau monte
    await this.cahierRepo.majNiveauPreuve(c.id, 'fichier');   // → améliore le statutPreuve (FR-A27)
  }
  await this.audit.tracer('APPARIEMENT', { a, parUserId: user.id });
}

async annulerAppariement(a: Appariement, user: User) {
  // La preuve n'est PAS acquise à vie : on redescend au niveau d'origine
  for (const c of a.cahiers) {
    await this.cahierRepo.majNiveauPreuve(c.id, c.niveauPreuveOrigine);  // 'saisie' | 'ocr' | 'estimé'
  }
  await this.releveRepo.marquer(a.releve.id, 'NON_RAPPROCHE');
  await this.audit.tracer('DESAPPARIEMENT', { a, parUserId: user.id });
}
```

### Écarts — signaler, jamais inventer

```typescript
qualifierEcarts(releve: LigneReleve[], cahiers: LigneCahier[], apparies: Appariement[]): Ecart[] {
  const ecarts: Ecart[] = [];

  for (const r of nonApparies(releve, apparies)) {
    ecarts.push({
      type: r.sens === 'CREDIT'
        ? 'ENCAISSEMENT_NON_DECLARE'      // ⚠️ « tout dépôt est une entrée » — recette potentiellement non déclarée
        : 'DECAISSEMENT_NON_DECLARE',
      ligneReleve: r, statut: 'EN_ATTENTE',
    });
  }

  for (const c of nonApparies(cahiers, apparies)) {
    ecarts.push({
      type: c.type === 'RECETTE' ? 'RECETTE_SANS_ENCAISSEMENT' : 'DEPENSE_SANS_DECAISSEMENT',
      ligneCahier: c, statut: 'EN_ATTENTE',
      // Légitime si espèces (571) ou créance/dette (411/401) — mais c'est à l'HUMAIN de le dire.
    });
  }

  return ecarts;   // ❌ AUCUNE écriture créée ici (NFR-A04)
}
```

### État de rapprochement — l'écart ne s'absorbe pas

```typescript
async etatDeRapprochement(orgId, compteId, au: Date): Promise<EtatRapprochement> {
  const soldeReleve   = await this.releveRepo.soldeAu(orgId, compteId, au);
  const enCoursCredit = await this.ecartsRepo.total(orgId, compteId, 'ENCAISSEMENT_NON_DECLARE', au);
  const enCoursDebit  = await this.ecartsRepo.total(orgId, compteId, 'DECAISSEMENT_NON_DECLARE', au);
  const soldeComptable = await this.balanceRepo.soldeCompte(orgId, compteComptable, au);

  const theorique = soldeReleve + enCoursCredit - enCoursDebit;
  return {
    soldeReleve, enCoursCredit, enCoursDebit,
    soldeComptableTheorique: theorique,
    soldeComptable,
    ecart: theorique - soldeComptable,   // ⚠️ AFFICHÉ tel quel — jamais absorbé par une ligne d'ajustement
  };
}
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Recette non déclarée non détectée** → redressement | Écart **`ENCAISSEMENT_NON_DECLARE`** systématiquement remonté (règle « tout dépôt = une entrée ») — **test central** |
| Appariement automatique **faux positif** (2 montants identiques) | **Ambiguïté → tous proposés, aucun choisi** ; le flou exige une **confirmation humaine** |
| Le système **invente** une recette pour combler un écart | **Interdit (NFR-A04)** : aucune écriture créée automatiquement (test explicite) — le comptable crée via STORY-082 |
| Écart d'état absorbé par une ligne d'ajustement | **L'écart est AFFICHÉ** ; aucune ligne d'ajustement automatique |
| Preuve « acquise à vie » après un appariement erroné | Le **dé-rapprochement fait redescendre** le `niveauPreuve` (test dédié) |
| Flux espèces → écarts massifs et illisibles | Écarts **qualifiables** (`JUSTIFIE` + motif « paiement espèces ») ; la caisse est **hors rapprochement** (sans relevé) |
| Balance déclarative jamais confrontée | L'**état de rapprochement** devient la **pièce justificative** attendue en contrôle |

---

## Definition of Done

- [ ] Appariement **exact** (montant + date ±J + sens) — automatique
- [ ] Appariement **flou** proposé (confirmation humaine) ; **ambiguïté → aucun choisi**
- [ ] Appariement **groupé** (N↔1 / 1↔N) ; appariement **manuel** tracé
- [ ] **Élévation du `niveauPreuve` → `fichier`** + **redescente au dé-rapprochement**
- [ ] **4 types d'écarts** détectés, dont **`ENCAISSEMENT_NON_DECLARE`** (test central) ; qualification humaine tracée
- [ ] **Aucune écriture créée automatiquement** (test explicite)
- [ ] **État de rapprochement** (FR-A17) — écart **affiché**, jamais absorbé
- [ ] **Situation de compte** (FR-A17)
- [ ] Isolation `orgId` (e2e) ; Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-089 (relevés), STORY-082/083 (cahiers), STORY-085 (agrégation) verts

---

**Status:** ready-for-dev
**Dependencies:** **STORY-089** (relevés importés), **STORY-082/083** (cahiers), STORY-085 (agrégation — le `niveauPreuve` élevé remonte à la balance), STORY-101 (`statutPreuve`, FR-A27)
**Ferme** EPIC-022 · **alimente** STORY-098 (contrôles & statut de preuve) et la défense de la liasse (STORY-097)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A16/A17, NFR-A04 · règle « tout dépôt est une entrée »
