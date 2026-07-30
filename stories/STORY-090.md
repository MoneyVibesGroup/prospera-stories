# STORY-090 : Rapprochement (relevés ↔ cahiers) + état de rapprochement + situation de compte

**Epic :** EPIC-022 — Rapprochement bancaire
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A16, FR-A17 · `rapport-bilan-logique-metier-2026-07-12.md` §4 (hiérarchie de preuve ; règle « tout dépôt = une entrée ») · STORY-089 (relevés), STORY-082/083 (cahiers)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
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
  − Encaissements non encore comptabilisés ......   − 120 000
  + Décaissements non encore comptabilisés ......   +  45 000
  = Solde comptable théorique ...................  1 225 000
  Solde du compte 521 en comptabilité ...........  1 225 000
  ÉCART .........................................          0  ✔
  ```
  ⚠️ **Sens des en-cours corrigé au cadrage technique (D-090-6).** Un encaissement présent au relevé et **absent du cahier** n'a produit aucune écriture : il n'est **pas** dans le solde du compte `521`, qui est donc **plus bas** que le relevé — on le **retranche** pour retrouver la comptabilité. Le signe inverse (esquisse initiale) faisait ressortir un écart de **2 × en-cours** sur un dossier pourtant parfaitement rapproché : l'outil aurait crié au faux écart exactement là où il devait se taire.
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
7. **État de rapprochement** : solde relevé **1 300 000** − en-cours crédit + en-cours débit = **solde comptable théorique 1 225 000** = compte `521` → **écart 0** ✔ → l'état est la **pièce justificative** de la clôture.
8. La balance (STORY-085) est régénérée avec les recettes ajoutées → contrôles (STORY-098) → handoff (STORY-099).

---

## Décisions de conception

### D-090-1 — Un module `rapprochement/` à part, jamais dans `tresorerie/`

`TresorerieModule` (STORY-089) est une **feuille** : « aucune dépendance vers les cahiers ni vers `BalanceService`, et c'est **structurel** ». Loger le rapprochement dedans y câblerait précisément les deux dépendances que 089 s'interdit — et rendrait possible, au premier correctif pressé, la création automatique d'une ligne de cahier depuis un flux. Le nouveau module `src/modules/rapprochement/` **importe** `TresorerieModule`, `CahiersModule`, `BalanceModule` et `RepriseModule` ; aucun d'eux ne l'importe. C'est exactement le montage d'`AgregationModule` vis-à-vis de `CahiersModule`.

### D-090-2 — Un canal explicitement incompatible exclut le candidat (appariement **automatique** seulement)

Une recette saisie `moyenPaiement: 'ESPECES'` ne peut pas être passée par un relevé **bancaire** : la retenir comme candidate fabriquerait un faux positif à haute confiance. Correspondance : `BANQUE → BANQUE`, `MOBILE_MONEY → MOBILE_MONEY`, `CAISSE → ESPECES`. Une ligne **sans** `moyenPaiement` reste candidate — l'absence d'information n'est pas une information.

⚠️ Le filtre ne s'applique **jamais** à l'appariement **manuel** : le comptable qui relie explicitement un virement à une recette saisie « espèces » corrige justement une erreur de saisie. Lui refuser serait faire primer une donnée douteuse sur une décision humaine.

### D-090-3 — Montant **exact**, aucune tolérance

Les montants sont des **entiers en unités mineures XOF** des deux côtés. Une tolérance de 1 XOF (= 100 unités mineures) laisserait apparier un encaissement de 249 500 avec une recette de 250 000 : les 500 XOF de frais bancaires — une **charge réelle, non déclarée** — seraient absorbés par l'appariement au lieu de ressortir. Un montant qui ne tombe pas juste doit devenir un **écart visible**, pas un rapprochement approximatif. `TOLERANCE_EQUILIBRE` (100) existe pour l'équilibre d'une balance agrégée, jamais pour identifier un paiement.

### D-090-4 — Écarts **dérivés**, qualifications **persistées**

Un écart n'est pas un fait : c'est l'**absence** d'appariement à un instant donné. Le persister figerait un cliché qui devient faux dès que le comptable saisit la recette manquante (STORY-082) — l'écran continuerait d'accuser une recette non déclarée déjà déclarée. `GET /ecarts` **recalcule** donc à chaque appel ; seule la **décision humaine** est stockée (`qualifications_ecart`, clé unique `(orgId, cible, ligneId)`).

Corollaire : les écarts **côté cahier** se calculent contre **tous** les appariements de l'organisation, jamais du seul compte interrogé. Une recette encaissée sur TMoney ne doit pas ressortir « sans encaissement » parce qu'on rapproche le compte BOA.

### D-090-5 — Un appariement est **N↔M**, et l'index unique est le vrai filet

Le document `Appariement` porte `lignesReleve[]` **et** `lignesCahier[]` : un même modèle couvre le 1↔1, la remise globale (1 relevé ↔ N recettes) et le règlement fractionné (N relevés ↔ 1 dépense). Deux index **uniques partiels** (`statut: 'CONFIRME'`) sur `lignesReleve` et sur `lignesCahier.ligneId` garantissent qu'**aucune ligne n'est appariée deux fois**, même sur confirmations concurrentes — un pré-contrôle applicatif ne le garantirait pas (leçon D-089-5). L'`E11000` est traduit en **409 explicite**, jamais en 500.

### D-090-6 — Sens des en-cours de l'état de rapprochement, **corrigé**

Voir le bloc de la § *Périmètre* : `théorique = soldeReleve − enCoursCredit + enCoursDebit`. L'esquisse initiale inversait les signes, ce qui affichait `2 × en-cours` d'écart sur un dossier correctement rapproché.

### D-090-7 — Le `niveauPreuve` monte **à la confirmation**, et le niveau d'origine est **stocké dans l'appariement**

`niveauPreuveOrigine` est copié dans le document d'appariement au moment de la confirmation. Le recalculer au dé-rapprochement (« c'était sûrement `saisie` ») écraserait le niveau réel d'une ligne issue de l'OCR — la trace de la lecture machine disparaîtrait, et avec elle la seule preuve qu'il y a eu relecture (même rationnel que `SurchargeDeductibilite`, D-083-6). Élévation et redescente écrivent **plus d'un document** ⇒ **transaction**.

### D-090-8 — `POST /lancer` applique les **exacts**, propose le reste, et **remplace** ses propositions

Les propositions `PROPOSE` d'un `(compte, exercice)` sont **supprimées puis reconstruites** à chaque lancement : une proposition est une suggestion volatile, pas un fait. Les accumuler ferait grossir la liste à chaque relance avec des doublons que personne ne saurait départager. Les appariements **`CONFIRME` ne sont jamais touchés**.

### D-090-9 — La recherche de groupes est **bornée**, et le dit

Le rapprochement groupé explore les sous-ensembles de `2..4` lignes parmi **au plus 12** candidats de même sens dans la fenêtre de dates (≈ 750 combinaisons au pire). Sans borne, un relevé de 200 lignes face à un cahier de 400 produirait une explosion combinatoire sur un service **mutualisé entre tenants** — le CWE-770 exact rencontré en 089 sur le diagnostic d'import. Au-delà du plafond, la recherche groupée est **annoncée comme non exhaustive** dans les avertissements, jamais silencieusement tronquée.

### D-090-10 — `statutRapprochement` de la ligne de relevé : 3 valeurs, 3 causes

`RAPPROCHE` ← un appariement **CONFIRMÉ** la porte · `ECARTE` ← son écart a été qualifié **`JUSTIFIE`** (apport en compte courant, virement interne…) · `NON_RAPPROCHE` ← tout le reste, y compris le retour en arrière. Les lignes `ECARTE` sortent du vivier d'appariement automatique — l'humain a tranché — mais **restent listées** dans les écarts avec leur qualification : disparaître de l'écran ferait perdre la trace de la décision.

Les lignes de cahier, elles, **ne gagnent aucun champ de statut** : « déjà appariée » se lit dans la collection `appariements`. Un drapeau dupliqué dans deux collections finit toujours par diverger.

### D-090-11 — Exercice **CLOS** : lecture oui, écriture non

`lancer`, `apparier`, `confirmer`, `annuler`, `qualifier` refusent un exercice clos (409, cohérence D-089-6). `ecarts`, `etat`, `situation` restent **lisibles** : un état de rapprochement sert justement à défendre un exercice clos devant l'OTR.

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
      c.montant === r.montant &&                                     // EXACT (D-090-3)
      sensCoherent(r.sens, c.type) &&
      canalCompatible(compte.type, c.moyenPaiement) &&               // D-090-2
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

  // ⚠️ D-090-6 — un encaissement absent du cahier n'a produit AUCUNE écriture :
  // il n'est pas dans le 521, qu'il faut donc RETRANCHER du relevé pour y revenir.
  const theorique = soldeReleve - enCoursCredit + enCoursDebit;
  return {
    soldeReleve, enCoursCredit, enCoursDebit,
    soldeComptableTheorique: theorique,
    soldeComptable,
    ecart: theorique - soldeComptable,   // ⚠️ AFFICHÉ tel quel — jamais absorbé par une ligne d'ajustement
  };
}
```

⚠️ `soldeReleve` **n'est jamais reconstitué par cumul** (discipline de STORY-089) : c'est le `soldeApres` de la dernière ligne qui en porte un, ou `null`. Sans solde d'ouverture, un cumul de mouvements produirait un nombre qui **ressemble** à un solde bancaire — et l'écart calculé dessus serait une pure fiction. `soldeReleve === null` ⇒ `soldeComptableTheorique` et `ecart` sont `null`, avec un motif explicite. De même, **aucune balance** pour l'exercice ⇒ `soldeComptable: null` : un zéro par défaut ferait passer une absence de comptabilité pour un compte à zéro.

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

## Progress Tracking

- **2026-07-30 — `in_progress`.** Cadrage technique relu contre le code livré de STORY-089/082/083/085 : 11 décisions posées (D-090-1 → D-090-11), dont **deux corrections du cadrage initial** — le sens des en-cours de l'état de rapprochement (D-090-6) et la tolérance de montant (D-090-3). Module `src/modules/rapprochement/` à part, `TresorerieModule` reste une feuille.

- **2026-07-30 — développement.** Module `src/modules/rapprochement/` : moteur pur (`rapprochement.regles.ts`), deux collections (`appariements`, `qualifications_ecart`), 9 routes sous `/api/v1/rapprochement`. `RelevesRepository` gagne `listerParOrg` / `trouverUneParOrg` / `trouverParIds` / `marquerStatut` ; les deux dépôts de cahiers gagnent `trouverParIds` / `majNiveauPreuve` (bulkWrite, **un niveau par ligne**) ; `BalanceRepository` gagne `trouverDerniereToutesSources`.

- **2026-07-30 — qualité.** Lint 0 warning · build OK · **1779 unitaires + 381 e2e** verts · couverture **98,95 / 91,08 / 98,31 / 98,99** (seuils 65/90/90/90).
  **29 mutation-tests, 29 rouges** — sens toujours cohérent, tolérance de montant réintroduite, ambiguïté tranchée, unicité vérifiée d'un seul côté, signes de l'état inversés, `null` remplacé par 0, groupe d'une seule ligne, canal non filtré, écart crédit/débit inversé, plafond de propositions retiré, preuve jamais élevée, redescente recalculée, motif non exigé, écarts non filtrés, montants différents acceptés, propositions non remplacées, confirmation sans garde de statut, motif orphelin conservé, `marquerStatut` non borné, gate d'accès retirée (unit + e2e), ordre des routes inversé, qualification survivant à l'appariement (unit + e2e), `preuvesElevees` annonçant la liste, suppression non org-scopée, plafond d'entrée retiré, dossier tronqué au lieu d'être refusé, bornes `du`/`au` ignorées.

- **2026-07-30 — VÉRIFICATION DOCKER** (stack **neuve**, `down -v`, 2 organisations réelles créées via l'IdP).
  - **Appariement** : relevé BOA de mars importé par le vrai chemin STORY-089 (5 lignes) + 6 recettes et 1 dépense saisies par l'API. `lancer` ⇒ **2 exacts appliqués**, **2 propositions d'ambiguïté** (aucune choisie), **1 groupe** 6 M + 4 M = 10 M.
  - **Persistance** : collection `appariements` (2 CONFIRME + 3 PROPOSE), `lignes_releve` 2 RAPPROCHE / 3 NON_RAPPROCHE, `lignes_recettes` 1 `fichier`, `lignes_depenses` 1 `fichier`. **Invariants : 0 ligne RAPPROCHE orpheline, 0 ligne `fichier` orpheline, 0 appariement déséquilibré.**
  - **Index uniques partiels présents en base** (`orgId_1_lignesReleve_1` et `orgId_1_lignesCahier.ligneId_1`, `partialFilterExpression: { statut: 'CONFIRME' }`) : la confirmation du **second** candidat d'une ambiguïté est refusée **par l'index** ⇒ **409 `LIGNE_DEJA_APPARIEE`**.
  - **Élévation / redescente** : une recette portée à `ocr` passe à `fichier` à la confirmation (origine `ocr` **gravée** dans l'appariement) et **revient à `ocr`** — pas à `saisie` — au dé-rapprochement.
  - **Aucune écriture créée** : `lignes_recettes` = 6, `lignes_depenses` = 1, `balances` = 0, `outbox_events` = 0, inchangés de bout en bout ; `qualifier` renvoie `ecritureCreee: false`.
  - **Écarts** : `ENCAISSEMENT_NON_DECLARE` (dépôt de 180 000 sans recette) + 2 `RECETTE_SANS_ENCAISSEMENT`, totaux par type exacts. `JUSTIFIE` sans motif ⇒ **400** ; avec motif ⇒ persisté dans `qualifications_ecart` (index unique `(orgId, cible, ligneId)`), ligne passée à `ECARTE`, écart **toujours listé** avec sa décision.
  - **État de rapprochement** : solde relevé 56 000 000 − en-cours crédit 18 000 000 = **38 000 000** ; balance à 38 000 000 ⇒ **écart 0** ; balance à 35 000 000 ⇒ **écart 3 000 000 AFFICHÉ**. Sans balance ⇒ `soldeComptable: null`, `ecart: null` + motif. Un écart **justifié** compte **toujours** dans les en-cours.
  - **Isolation** : compte/appariement/ligne d'une autre organisation ⇒ **404** dans les deux sens, jamais 403 ; la victime reste intacte.
  - **Exercice CLOS** : `lancer` ⇒ **409**, `GET /ecarts` et `GET /etat` ⇒ **200** (D-090-11).
  - **ATOMICITÉ prouvée** par index unique **partiel temporaire** sur `lignes_recettes` : l'élévation échoue au milieu de la transaction ⇒ **0 appariement, 0 ligne marquée, 0 preuve élevée** après l'échec ; la relance nominale repart proprement.
  - **Non-régression STORY-089** : ré-import du même relevé ⇒ 5 lues / **0 nouvelle** / 5 ignorées, 5 lignes en base (aucun doublon) ; consultation du relevé et des cahiers ⇒ 200.

- **2026-07-30 — revue de code (`opus`, en session).** 5 constats, tous corrigés avant le merge. **Bloquant** : une qualification d'écart **survivait à l'appariement** de sa ligne — le code ne tenait pas la promesse de son propre commentaire (`QualificationLigneApparieeException`), et au dé-rapprochement la ligne revenait à la fois `NON_RAPPROCHE` **et** « justifiée ». `engager` efface désormais les qualifications des lignes engagées, dans la même transaction. Aussi : `preuvesElevees` comptait la liste envoyée et non les mutations réelles ; `totauxParType` référençait `TotalEcartDto` par un `$ref` que Swagger n'émettait pas (**contrat OpenAPI menteur**) ; références de cahier dédoublonnées ; Swagger de `nonRapprochees` précisé. **Vérification docker rejouée** sur l'état final : qualifier → apparier (qualification effacée) → dé-rapprocher → écart `EN_ATTENTE` **sans explication héritée**.

- **2026-07-30 — revue de sécurité (`opus`, en session, non allégée).** **1 vulnérabilité trouvée et corrigée : CWE-770 / CWE-400, déni de service par appariement quadratique.** Le moteur balayait tout le cahier pour **chaque** ligne de relevé — produit cartésien — et re-parsait deux dates en chaîne ISO à chaque comparaison. **Mesuré** : 1 000 × 1 000 lignes bloquaient l'event loop **9,8 s**, 3 000 × 3 000 **82 s**, 6 000 × 6 000 **311 s**. Node étant mono-thread et `balance-service` **mutualisé entre tous les tenants**, une seule requête **authentifiée et nominale** figeait le service pour tout le monde, et rien n'empêchait de la rejouer. Correctifs : index par **montant** (jointure d'égalité), fenêtre de dates par **recherche dichotomique**, écart de jours par **arithmétique pure**. **Re-mesuré** : 130 ms / 0,9 s / 5,8 s (**75× / 89× / 53×**). Le terme quadratique résiduel est borné par `MAX_LIGNES_RAPPROCHEMENT = 5 000` par côté, qui **refuse** (`400 RAPPROCHEMENT_TROP_VOLUMINEUX`) au lieu de tronquer — rapprocher silencieusement une partie du dossier ferait lire « rien à justifier » sur un dossier non examiné —, refus rendu **actionnable** par les bornes `du`/`au` ajoutées à `lancer`. Vérifié en docker : refus au-delà du plafond **sans aucune écriture**, rapprochement mois par mois fonctionnel. Aucun autre constat (isolation multi-tenant, IDOR, injection NoSQL, intégrité comptable, période comptable, secrets).

- **2026-07-30 — `done`.** PR #22 `MNV-090` → `dev` (**Rebase and merge**, branche supprimée). PR `docs/` `MNV-090` → `main`.

### Risques résiduels assumés

- **Le plafond de 5 000 lignes par côté est un compromis** : un dossier plus volumineux exige un rapprochement mois par mois. Le rendre configurable relèverait d'un réglage d'exploitation, hors périmètre.
- **La recherche groupée n'est pas exhaustive** (12 candidats, 4 lignes par groupe, 3 groupes par ligne) ; elle **le dit** dans les avertissements. Les remises globales restantes s'apparient à la main.
- **Le seuil de similarité de libellé ne fait qu'ordonner** les propositions floues : il n'en applique aucune, donc un mauvais score ne peut produire qu'un mauvais **ordre**, jamais un mauvais appariement.

---

**Status:** done
**completed_date:** 2026-07-30
**Dependencies:** **STORY-089** (relevés importés), **STORY-082/083** (cahiers), STORY-085 (agrégation — le `niveauPreuve` élevé remonte à la balance), STORY-101 (`statutPreuve`, FR-A27)
**Ferme** EPIC-022 · **alimente** STORY-098 (contrôles & statut de preuve) et la défense de la liasse (STORY-097)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A16/A17, NFR-A04 · règle « tout dépôt est une entrée »
