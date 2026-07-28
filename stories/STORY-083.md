# STORY-083 : Cahier de dépenses (catégories éditables + rattachement aux charges, classe 6)

**Epic :** EPIC-020 — Adaptateur #3 : construction de balance, chemin A (cahiers + OCR)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A09 · `rapport-bilan-logique-metier-2026-07-12.md` §3 (chemin A) · `referentiels/` (plan de comptes SYSCOHADA, classe 6)
**Priorité :** Must Have
**Story Points :** 5
**Complexité :** high
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12
**Clôturée le :** 2026-07-28
**Sprint :** 16 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A09 (cahier de dépenses)

> **Le second cahier — symétrique des recettes, mais plus piégeux.** Une dépense mal catégorisée, c'est une **charge non déductible** qui passe en déduction (redressement), ou une charge déductible oubliée (impôt payé en trop). Cette story permet de saisir les dépenses avec des **catégories éditables** (achats, loyer, électricité/CEET, salaires, transport…), rattachées aux **comptes de charges (classe 6)**, et marque dès la saisie ce qui est **déductible ou non** — information que le **moteur fiscal (STORY-091)** exploitera pour les **réintégrations**. Avec le cahier de recettes (STORY-082), il alimente la balance canonique.

---

## User Story

En tant que **cabinet comptable** traitant une **PME sans logiciel comptable**,
je veux **saisir les dépenses du client par catégories que je peux adapter**, rattachées aux comptes de charges,
afin de **reconstituer les charges de l'exercice** et de **préparer les réintégrations fiscales** sans ressaisir un plan comptable complet.

---

## Description

### Contexte

Symétrique de STORY-082, avec deux différences de fond :

1. **Les catégories sont métier, pas comptables.** Le cabinet raisonne en « loyer », « électricité CEET », « carburant », « salaires » — pas en `6132` / `6051` / `6041`. On lui donne des **catégories éditables** (ajout/retrait/renommage), chacune **mappée** vers un compte de classe 6. C'est ce mapping qui fait le pont entre le langage du terrain et le plan SYSCOHADA.

2. **Toute charge n'est pas déductible.** Le CGI (Togo 2026) liste des charges **réintégrables** : amendes, pénalités, cadeaux au-delà d'un plafond, charges non justifiées, rémunérations excessives… Marquer la **déductibilité dès la saisie** (avec le **code de réintégration** du paquet fiscal) évite de refaire l'analyse en fin d'exercice. Le moteur fiscal (**STORY-091**) n'aura qu'à **agréger**.

> **Garde-fou (NFR-A04).** Une charge sans pièce justificative est **saisissable** (le terrain l'exige) mais **marquée** (`niveauPreuve: estimé`, `justifiee: false`) — et le moteur fiscal la traitera comme **réintégrable** (charge non justifiée). L'outil n'invente pas de charges déductibles : il **documente** ce qui existe et **signale** ce qui est fragile.

### Périmètre

**Inclus :**

- **Modèle `CategorieDepense`** (collection `categories_depenses`, keyée `orgId`) — **éditable par le cabinet** :
  - `libelle` (« Loyer », « Électricité CEET »), `compteCharge` (classe 6, validé contre le plan de comptes — STORY-078), `deductibleParDefaut: boolean`, `codeReintegration?` (du **paquet fiscal**, STORY-078), `actif`.
  - **Jeu par défaut** pré-provisionné à la création du dossier (achats, loyer, énergie, transport, salaires, honoraires, impôts & taxes, frais bancaires…) — **modifiable** (ajout/retrait/renommage) : le cabinet reste maître de sa nomenclature.
- **Modèle `LigneDepense`** (collection `lignes_depenses`, keyée `orgId` + `exercice`) :
  - `date` (→ mois), `libelle`, `montant` (XOF), `fournisseur?`, `moyenPaiement?` (espèces / banque / **mobile money**), `pieceRef?`.
  - `categorieId` → **hérite** `compteCharge` (surchargeable ligne à ligne).
  - `compteCharge` — classe **6** obligatoire (validé) ; **hors classe 6 → 400**.
  - `tva?` — `{ deductible: bool, taux, montantHT, montantTVA }` (taux du **paquet fiscal**) → alimentera la **TVA déductible** (STORY-093).
  - **Fiscalité** : `justifiee: boolean` (pièce à l'appui ?), `deductible: boolean`, `codeReintegration?` (si non déductible) — **proposés** depuis la catégorie, **modifiables**, **motif** requis en cas de surcharge.
  - `niveauPreuve` : `fichier` | `ocr` | `saisie` | `estimé` · `origine` : `MANUELLE` | `OCR` | `IMPORT`.
- **CRUD & saisie de masse** (`@RequiresBalanceAccess`, isolation `orgId`) :
  - `POST /api/v1/cahiers/depenses` → **201** ; `POST /api/v1/cahiers/depenses/lot` → **201** + **rapport de rejet partiel**.
  - `GET /api/v1/cahiers/depenses?mois=2026-03` ; `PATCH` / `DELETE` — **refusés (409) si la balance de l'exercice est VALIDÉE**.
  - CRUD des **catégories** : `GET/POST/PATCH /api/v1/cahiers/categories` (une catégorie **utilisée** ne se supprime pas → désactivation).
- **Synthèse** : `GET /api/v1/cahiers/depenses/synthese?exercice=2026` → `{ parMois: [...], parCategorie: [...], totalCharges, totalNonDeductible }` — le `totalNonDeductible` **préfigure les réintégrations** (STORY-091).
- **Totaux par compte de classe 6** exposés pour l'agrégation en balance (STORY-085).
- **Tests** : CRUD catégories + lignes ; lot avec rejet partiel ; refus hors classe 6 ; héritage catégorie → compte/déductibilité ; surcharge de déductibilité **sans motif → 400** ; charge non justifiée → `deductible: false` + `codeReintegration` ; synthèse (par mois, par catégorie, non déductible) ; isolation ; édition post-validation refusée.

**Hors périmètre :**

- **Cahier de recettes** → **STORY-082** (symétrique).
- **OCR des factures** → **STORY-084** (alimente `origine: OCR`, `niveauPreuve: ocr`).
- **Moteur de rattachement générique** (transaction → compte) → **STORY-085**.
- **Calcul des réintégrations et du résultat fiscal** → **STORY-091** (S18) : ici on **marque**, là-bas on **agrège et calcule**.
- **TVA due** (collectée − déductible) → **STORY-093**.
- **Rapprochement bancaire** → **STORY-089/090**.

### Flux

1. À l'ouverture du dossier, un **jeu de catégories par défaut** est créé (loyer, énergie, achats, salaires…), chacune mappée à un compte de classe 6.
2. Le cabinet **adapte** : il renomme « Énergie » en « Électricité CEET », ajoute « Carburant motos », supprime une catégorie inutile.
3. Il saisit les dépenses de **mars 2026** en lot (48 lignes). Chaque ligne **hérite** de sa catégorie : compte de charge + déductibilité par défaut.
4. Une ligne « Amende de circulation — 25 000 » : la catégorie « Amendes & pénalités » porte `deductibleParDefaut: false` + `codeReintegration` (du paquet **`TG@2026`**) → la ligne est **marquée non déductible** automatiquement.
5. Une ligne « Achat fournitures — 40 000, **sans facture** » → `justifiee: false` → le système **propose** `deductible: false` (charge non justifiée) ; le comptable **confirme** (ou surcharge **avec motif**, tracé).
6. `GET /depenses/synthese` → `totalCharges = 4 320 000`, dont **`totalNonDeductible = 65 000`** → ce sont les **futures réintégrations** (STORY-091).
7. Avec les recettes (STORY-082), l'agrégation (STORY-085) produit la **balance canonique** (STORY-101).

---

## Acceptance Criteria

- [ ] **`CategorieDepense`** : CRUD (`@RequiresBalanceAccess`), **jeu par défaut** provisionné à l'ouverture du dossier, **éditable** (ajout/retrait/renommage) ; une catégorie **utilisée** n'est pas supprimable (**désactivation**).
- [ ] Chaque catégorie porte `compteCharge` (**classe 6**, validé contre le plan de comptes — STORY-078), `deductibleParDefaut`, `codeReintegration?` (issu du **paquet fiscal**).
- [ ] **`LigneDepense`** : CRUD + **saisie en lot** avec **rapport de rejet partiel** (jamais silencieux).
- [ ] **Rattachement classe 6** : compte **hérité** de la catégorie, **surchargeable** ; **compte hors classe 6 → 400** ; compte inconnu du plan → **400**.
- [ ] **Déductibilité** : `justifiee`, `deductible`, `codeReintegration` **proposés** depuis la catégorie ; **surcharge sans motif → 400** ; surcharge **tracée** (audit NFR-A07).
- [ ] **Charge non justifiée** (`justifiee: false`) → `deductible: false` **proposé** avec le code de réintégration adéquat (l'humain confirme).
- [ ] **TVA déductible** : taux lu du **paquet fiscal** (jamais en dur) ; ventilation HT/TVA modifiable ; TVA non déductible marquable.
- [ ] **Synthèse** `GET /depenses/synthese` : totaux **par mois**, **par catégorie**, `totalCharges`, **`totalNonDeductible`** (préfigure les réintégrations) — exacts au XOF.
- [ ] **Immutabilité** : `PATCH`/`DELETE` refusés (**409**) si la balance de l'exercice est **VALIDÉE**.
- [ ] **Isolation multi-tenant** : `orgId` du JWT ; test e2e inter-org.
- [ ] **Totaux par compte de classe 6** exposés pour l'agrégation (STORY-085).
- [ ] **Tests** : catégories, lot + rejet partiel, hors classe 6, héritage, surcharge sans motif (400), non justifiée → réintégrable, synthèse, immutabilité, isolation. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Modèles

```typescript
export interface CategorieDepense {
  orgId: string;
  libelle: string;                 // « Électricité CEET » — langage du cabinet
  compteCharge: string;            // classe 6 (validé via ReferentielProvider)
  deductibleParDefaut: boolean;
  codeReintegration?: string;      // code du paquet fiscal si non déductible (STORY-078)
  actif: boolean;                  // désactivation, pas de suppression si utilisée
}

export interface LigneDepense {
  orgId: string;
  exercice: { debut: Date; fin: Date };

  date: Date;                      // → mois
  libelle: string;
  montant: number;                 // XOF
  fournisseur?: string;
  moyenPaiement?: 'ESPECES' | 'BANQUE' | 'MOBILE_MONEY';
  pieceRef?: string;

  categorieId: string;
  compteCharge: string;            // classe 6 — hérité, surchargeable

  tva?: { deductible: boolean; taux: number; montantHT: number; montantTVA: number };

  // Fiscalité — préparée ICI, agrégée par STORY-091
  justifiee: boolean;              // pièce à l'appui ?
  deductible: boolean;
  codeReintegration?: string;
  motifSurcharge?: string;         // obligatoire si on diverge de la proposition

  niveauPreuve: 'fichier' | 'ocr' | 'saisie' | 'estimé';
  origine: 'MANUELLE' | 'OCR' | 'IMPORT';
}

db.lignes_depenses.createIndex({ orgId: 1, 'exercice.debut': 1, date: 1 });
db.categories_depenses.createIndex({ orgId: 1, libelle: 1 }, { unique: true });
```

### La règle fiscale posée dès la saisie

```typescript
proposerDeductibilite(ligne: LigneDepense, cat: CategorieDepense, paquet: PaquetFiscal) {
  // 1) Charge non justifiée → réintégrable (CGI : charges non justifiées)
  if (!ligne.justifiee) {
    return { deductible: false, codeReintegration: paquet.codeChargeNonJustifiee };
  }
  // 2) Sinon, on suit la catégorie (amendes, cadeaux… → non déductibles)
  return { deductible: cat.deductibleParDefaut, codeReintegration: cat.codeReintegration };
}

// Surcharge humaine possible — mais JAMAIS silencieuse
if (dto.deductible !== proposition.deductible && !dto.motifSurcharge) {
  throw new BadRequestException('MOTIF_SURCHARGE_REQUIS'); // NFR-A04
}
```

> ⚠️ **`paquet.codeChargeNonJustifiee` n'existe pas** dans le paquet fiscal réel (`togo@2026`) : la
> rubrique `resultatFiscal` ne publie qu'une **liste plate de codes sans libellés**
> (`reintegrations_codes: ["10","11","12","15","20",…]`). Le pseudo-code ci-dessus est donc corrigé par
> la décision **D-083-3** : le **motif** de réintégration est un enum métier stable, le **code fiscal**
> reste une donnée du paquet — jamais deviné.

---

## Décisions de conception (arrêtées au dev)

### D-083-1 — Les primitives communes aux deux cahiers sont **factorisées**, pas dupliquées

Résolution d'exercice (D-082-2), `moisDe`/`bornesDuMois` en **UTC**, classe d'un compte, extraction du
taux de TVA du paquet, ventilation TTC → HT + TVA **par différence**, normalisation de texte : identiques
pour les recettes et pour les dépenses. Elles migrent dans `cahiers-communs.regles.ts` ;
`cahiers-recettes.regles.ts` les **réexporte** (aucun import de STORY-082 ne bouge, sa suite de tests sert
de filet de non-régression). Dupliquer aurait garanti la dérive : deux `resoudreExercice` qui divergent,
ce sont des recettes et des dépenses rangées dans deux exercices différents.

Sont **repris tels quels** : montants en **unités mineures XOF** (D-082-1) · gel sur l'existence d'une
balance **de source `ocr`** à l'état `VALIDÉE` (D-082-3, y compris sur la **création**) · assujettissement
TVA dérivé du **régime fiscal** (D-082-4) · taux du paquet de l'**année de clôture** de l'exercice.

### D-083-2 — Le montant imputé au compte de charge est **HT si la TVA est déductible, TTC sinon**

C'est **le** piège comptable de cette story, et il n'est pas le symétrique de 082. Pour une recette, la
TVA collectée est toujours une dette (classe 4) : le compte de classe 7 reçoit **toujours** le HT. Pour
une charge, la TVA **non déductible** n'est récupérable auprès de personne : elle fait partie du **coût**
et s'impute **avec** la charge, en classe 6.

Conséquence directe : `totauxParCompte` cumule `montantImpute` — `montantHT` quand `tva.deductible`, le
`montant` TTC sinon (et le TTC aussi quand l'organisation n'est **pas assujettie**, cas de la PME au
régime synthétique, où la TVA supportée est un coût pur). Imputer systématiquement le HT minorerait les
charges de la TVA non récupérable, donc **majorerait le résultat imposable** — un impôt payé en trop, en
silence.

### D-083-3 — Le **code de réintégration** vient du paquet fiscal ; le **motif**, lui, est du code

Le paquet `togo@2026` publie `resultatFiscal.reintegrations_codes` : douze codes **sans libellés**. Rien
n'y désigne « charges non justifiées ». Écrire `codeReintegration: '30'` dans le code serait exactement ce
que NFR-A06 interdit — et produirait une **liasse fausse** au premier code qui bouge.

Donc, deux champs distincts :

- **`motifNonDeductible`** — enum **métier stable**, porté par le code :
  `CHARGE_NON_JUSTIFIEE` | `CATEGORIE_NON_DEDUCTIBLE` | `DECISION_HUMAINE`. Il encode une règle
  structurelle du CGI (« une charge non justifiée n'est pas déductible »), pas un paramètre annuel.
- **`codeReintegration`** — **donnée** du paquet fiscal, optionnelle. Fournie par la catégorie ou par la
  ligne, elle est **validée** contre `reintegrations_codes` du paquet de l'exercice → sinon **400
  `CODE_REINTEGRATION_INCONNU`**. Le paquet peut publier une correspondance `reintegrations_parMotif`
  (additive, absente aujourd'hui) ; tant qu'elle manque, la proposition automatique sort **sans code**,
  avec son motif.

**STORY-091 agrège sur le `motifNonDeductible`** (toujours présent) et cite le `codeReintegration` quand
il existe. Une charge marquée non déductible sans code reste donc réintégrée : ce qui manque, c'est la
case de la liasse, pas la réintégration.

### D-083-4 — Le jeu de catégories par défaut est **provisionné paresseusement**, et **filtré par le plan de comptes**

« À la création du dossier » : ce moment n'existe pas dans `balance-service` (aucun événement d'ouverture
de dossier, aucun consommateur). Le jeu par défaut est donc semé **au premier accès aux catégories de
l'organisation**, de façon **idempotente** (un `insertMany` en `ordered: false` sur l'index unique
`(orgId, libelle)` — deux requêtes concurrentes ne créent pas de doublons).

Chaque catégorie par défaut est **validée contre le plan de comptes de l'organisation** avant d'être
semée : `sfd-bceao@2.0` n'a pas les mêmes comptes de classe 6 que `syscohada-revise@2.1`. Une catégorie
dont le compte n'est pas rattachable au référentiel de l'org est **omise** — semer un compte inconnu
créerait une catégorie qui **refuserait toutes ses lignes** (400 `COMPTE_INCONNU`) sans que personne ne
comprenne pourquoi.

Le jeu par défaut est une **nomenclature de départ éditable**, pas un paramètre fiscal : le poser dans le
code est cohérent avec la table de rattachement de 082, et NFR-A06 n'est pas en cause (aucun taux, aucun
seuil, aucun code fiscal).

### D-083-5 — Une catégorie utilisée renvoie **409** sur `DELETE` ; la désactivation est un acte explicite

La story dit « une catégorie utilisée ne se supprime pas → désactivation ». Transformer silencieusement un
`DELETE` en désactivation ferait croire à une suppression : le client afficherait « supprimée » sur une
catégorie toujours en base. `DELETE` supprime donc **réellement** une catégorie **inutilisée**, et renvoie
**409 `CATEGORIE_UTILISEE`** dès qu'au moins une ligne la référence — le client désactive alors par
`PATCH { actif: false }`, ce qui est la décision qu'il voulait prendre.

Une catégorie **désactivée** ne peut plus être **choisie** par une nouvelle ligne (400), mais les lignes
existantes qui la portent restent parfaitement valides : désactiver n'est pas réécrire l'histoire.

### D-083-6 — La surcharge de déductibilité est tracée **avec ce dont elle diverge**

`motifSurcharge` seul ne dit pas de quoi l'humain s'est écarté. La ligne porte donc un sous-document
`surcharge: { motif, proposeDeductible, proposeMotifNonDeductible?, proposeCodeReintegration?, parUserId, le }`.
Un contrôle fiscal lit alors la trace complète : ce que le système proposait, ce que l'humain a décidé,
qui et quand. Sans le « proposé », la trace ne prouve rien — la proposition se recalcule depuis une
catégorie qui a pu être renommée ou remappée depuis.

Le motif est exigé **uniquement** quand `deductible` diverge de la proposition (NFR-A04) : imposer un
motif sur une confirmation conforme transformerait la garantie en formalité qu'on remplit au hasard.

### D-083-8 — Une charge non déductible **ne récupère pas sa TVA** *(constat de la vérification docker)*

Décision **ajoutée après coup** : elle n'a pas été vue à la conception, la vérification docker l'a
imposée. Une **amende** — charge non déductible par nature — sortait ventilée
`HT 2 118 644 + TVA 381 356 « récupérable »` : la ligne n'était réintégrée que pour son **HT**, et le
solde ouvrait un **crédit de TVA fictif** sur une dépense qui n'en porte pas.

La cause était un **ordre d'opérations** : la ventilation TVA précédait la proposition de déductibilité,
donc ignorait le sort de la charge. La déductibilité se décide désormais **avant** la ventilation et la
pilote. Le comptable garde la main : un `tva.deductible: true` **explicite** reste honoré, pour le cas
rare d'une charge non déductible dont la TVA l'est — la règle protège du défaut silencieux, elle
n'interdit pas la décision.

### D-083-7 — `totalNonDeductible` cumule le **montant imputé**, pas le TTC

Cohérence stricte avec D-083-2 : ce qui sera réintégré en STORY-091, c'est ce qui a été **passé en
charge**. Cumuler le TTC sur une ligne dont la TVA est déductible gonflerait la réintégration future de
18 % — l'erreur exacte que la story cherche à éviter, prise par l'autre bout.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Charge non déductible passée en déduction** → redressement | Déductibilité **proposée dès la saisie** depuis la catégorie + code de réintégration du paquet ; surcharge **motivée et tracée** |
| Charge sans pièce traitée comme déductible | `justifiee: false` → `deductible: false` **proposé** automatiquement (charge non justifiée) |
| Catégories rigides → le cabinet contourne l'outil | Catégories **entièrement éditables** (le mapping vers la classe 6 reste validé) |
| Mauvaise classe (produit au lieu de charge) | **Refus** de tout compte hors classe 6 |
| Suppression d'une catégorie utilisée → lignes orphelines | **Désactivation** au lieu de suppression |
| Modification après clôture | **409** si balance VALIDÉE (immutabilité NFR-A07) |
| Taux TVA en dur | Taux **du paquet fiscal** (test anti-hardcode) |

---

## Definition of Done

- [ ] `CategorieDepense` : CRUD, jeu par défaut, édition libre, désactivation si utilisée
- [ ] `LigneDepense` : CRUD + lot avec rapport de rejet partiel
- [ ] Rattachement **classe 6** validé (hors classe 6 → 400) ; héritage catégorie → compte
- [ ] Déductibilité proposée (`justifiee` → réintégrable) ; surcharge **motivée** (400 sinon) et **tracée**
- [ ] TVA déductible au taux du **paquet fiscal**
- [ ] Synthèse : par mois, par catégorie, `totalCharges`, **`totalNonDeductible`**
- [ ] Immutabilité (409 si balance VALIDÉE) ; isolation multi-tenant (e2e)
- [ ] Totaux par compte classe 6 exposés (pour STORY-085)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-082 (recettes) vert

---

## Progress Tracking

| Étape | État | Date |
|---|---|---|
| Conception arrêtée (D-083-1..8) | ✅ | 2026-07-28 |
| Implémentation (module `cahiers`, volet dépenses) | ✅ | 2026-07-28 |
| Portes DoD (lint / build / couverture / unit / e2e) | ✅ | 2026-07-28 |
| Vérification docker (persistance réelle) | ✅ | 2026-07-28 |
| Revue de code | ✅ | 2026-07-28 |
| Revue de sécurité | ✅ | 2026-07-28 |
| Merge sur `dev` | ✅ | 2026-07-28 |

### Revue de code — deux constats bloquants, corrigés avant le merge

1. **Le crédit de TVA fictif revenait par le chemin `PATCH`.** D-083-8 avait fermé la porte à la création,
   pas à la modification : la ventilation était reconduite telle quelle dès lors que le patch ne touchait
   ni la TVA, ni le montant, ni le justificatif. **Reclasser** une facture vers « Amendes et pénalités »
   rendait donc la charge non déductible **tout en gardant une TVA récupérable** — la ligne s'imputait pour
   son seul HT et le solde rouvrait exactement le crédit qu'on venait de fermer. `categorieId` et
   `deductible` déclenchent désormais la reventilation. *Corollaire du même constat* : reclasser ne
   réhéritait pas le compte de la nouvelle catégorie — la synthèse rangeait la ligne sous « Amendes »
   pendant que la balance la portait encore en « Achats de marchandises ».
2. **Bombe à retardement datée sur la validation des codes de réintégration.** La validation fabriquait un
   exercice sur l'**année civile courante**, donc résolvait `togo@<année en cours>`. Au 1ᵉʳ janvier suivant
   la dernière loi de finances publiée, toute création de catégorie **portant un code** serait partie en
   **500** — invisible en test jusqu'à l'échéance. Une catégorie n'étant rattachée à aucun exercice, le
   paquet de référence est désormais celui **configuré par défaut**, qui existe toujours.

Vérification docker **rejouée sur l'état final** après ces correctifs (reclassement ⇒ compte `6581`,
imputé `11 800 000` TTC, TVA `0` non déductible).

### Revue de sécurité — une vulnérabilité, corrigée avant le merge

**La trace de surcharge attribuait la décision à la mauvaise personne** (Medium, confiance 95,
CWE-778/CWE-282, OWASP A09). Sur un `PATCH`, `surcharge.parUserId` reprenait le `parUserId` **de la ligne**
— son auteur d'origine — au lieu de l'identité du JWT courant. La piste d'audit exigée par NFR-A07 sur une
**décision fiscale** désignait donc un utilisateur qui ne l'avait pas prise, et l'auteur réel pouvait la
répudier. Aucune élévation de privilège n'était requise : `TENANT_USER` suffisait, sur le chemin nominal.
`construireEtat` distingue désormais l'auteur de la ligne (conservé) de l'auteur de la décision.

Aucune autre vulnérabilité exploitable : `orgId` toujours issu du JWT et posé **après** l'état, filtre org
sur chaque requête, IDOR fermé sur `categorieId` (résolu dans le seul périmètre de l'organisation), patchs
construits champ par champ sans spread du DTO (pas d'injection d'opérateur Mongo), lignes de lot
revalidées en whitelist stricte, gel lu sur l'exercice **de la ligne en base**, `origine`/`parUserId` non
patchables, 404 générique anti-énumération.

### Portes DoD

Lint **0 warning** · build OK · **937 unitaires + 207 e2e** verts · couverture
**98,92 / 91,32 / 99,06 / 99,01** (seuils 65/90/90/90).

**Mutation-test** — sept mutations volontaires, chacune vérifiée **rouge**, puis restaurées. Un critère
qu'un code bugué franchit ne prouve rien ; c'est la mutation qui montre qu'il filtre :

| Mutation | Effet |
|---|---|
| `montantImpute` toujours en HT (la TVA non déductible cesse de s'imputer) | **4 rouges** |
| le refus hors classe 6 ne se déclenche plus | 9 unitaires + 3 e2e rouges |
| le gel après validation ne bloque plus | 4 rouges |
| le motif de surcharge n'est plus exigé | 1 unitaire + 1 e2e rouges |
| `estCodeReintegrationAdmis` en fail-**open** | 6 unitaires + 2 e2e rouges |
| `lister` sans le filtre `orgId` (fuite cross-tenant) | 1 rouge |
| taux de TVA en dur (18 %) au lieu du paquet fiscal | 1 unitaire + 1 e2e rouges |
| le semis ne filtre plus par le plan de comptes | 1 rouge |
| *témoin neutre* (réécriture sans effet) | **vert** — le harnais n'est pas rouge par construction |

⚠️ La première mutation n'a d'abord fait rougir **qu'un seul** test : les cas de synthèse utilisaient des
lignes non déductibles dont le `montantHT` valait déjà le TTC, si bien que les deux imputations donnaient
le même chiffre. Les jeux d'essai ont été corrigés (HT **strictement** inférieur au TTC) avant de rejouer
la mutation.

### Vérification docker (obligatoire — les e2e mockent la couche données)

Stack **neuve** (`docker compose down -v`), puis `mongo`/`kafka`/`redis`/`auth-service`/`balance-service`.
`/api/v1/health` : `mongodb: up`, `kafka: up`. **Deux organisations réelles** créées via l'IdP
(register → e-mail vérifié → login RS256), read-models `orgkycstatuses`/`orgbalanceentitlements` projetés
à APPROVED/ACTIVE, référentiel `syscohada-revise@2.1` attaché à l'entitlement, régime `REEL`.

1. **Semis paresseux réel** — le premier `GET /cahiers/categories` crée **19** catégories dans
   **`categories_depenses`** (nom explicite en snake_case, vérifié par `db.getCollectionNames()`), toutes
   validées contre le plan de comptes de l'org. Index `orgId_1_libelle_1` **UNIQUE** posé.
   **Idempotence prouvée** : second appel ⇒ 19 documents, inchangé.
2. **Le piège des charges (D-083-2), sur base réelle** — TTC `11 800 000` justifié ⇒ imputé **10 000 000**
   (HT) ; la même dépense **sans pièce** ⇒ imputée **4 000 000** (TTC), `CHARGE_NON_JUSTIFIEE`, TVA non
   déductible.
3. **🔴 Défaut trouvé ici, et corrigé** — une **amende** (catégorie non déductible) sortait ventilée
   `HT 2 118 644 + TVA 381 356 « récupérable »` : elle n'était réintégrée que pour son HT, le solde
   ouvrant un **crédit de TVA fictif**. Cause : la ventilation précédait la proposition de déductibilité.
   Après correctif (**D-083-8**), la même amende sort `imputé 2 500 000`, `TVA 0`, `deductible: false`.
   Vérification **rejouée sur l'état final**, service redémarré.
4. **Aucun taux ni code inventé** — `togo@2026` ⇒ `0,18` (`11 800 000` = `10 000 000 + 1 800 000`, HT + TVA
   = TTC à l'unité) ; code `30` **accepté** car publié, code `999` **refusé** (`CODE_REINTEGRATION_INCONNU`).
5. **Surcharge motivée et tracée** — sans motif ⇒ **400 `MOTIF_SURCHARGE_REQUIS`** ; avec motif ⇒ 201 et la
   trace embarque la proposition dont elle diverge (`proposeDeductible: false`,
   `proposeMotifNonDeductible: CATEGORIE_NON_DEDUCTIBLE`) + auteur + horodatage.
6. **Rejet partiel du lot** — 6 lignes soumises ⇒ **2 créées, 4 rejetées** avec motifs distincts
   (`COMPTE_HORS_CLASSE_6`, `DATE_HORS_EXERCICE`, `LIGNE_INVALIDE`, `CATEGORIE_INTROUVABLE`) ; comptage
   réel **5 → 7**.
7. **Atomicité du lot, prouvée par un échec provoqué** — index unique temporaire sur `(orgId, pieceRef)`
   (`partialFilterExpression`), puis lot de 3 lignes **toutes valides** dont deux en collision. Comptage
   **7 → 7**, et **0 ligne écrite, y compris la troisième**. La transaction avorte bien en bloc.
8. **Immutabilité, et sa frontière** — une balance **`sage`** VALIDÉE laisse le cahier ouvert
   (`POST` → 201) ; une balance **`ocr`** VALIDÉE le gèle : `POST`, `PATCH`, `DELETE` → **409
   `BALANCE_VALIDEE_IMMUABLE`**, base inchangée, ligne intacte. Le piège **append-only** est couvert : une
   version 2 `BROUILLON` posée après la version 1 `VALIDÉE` ne rouvre **pas** la saisie.
9. **Cycle de vie des catégories** — catégorie **inutilisée** supprimée (204) ; catégorie **utilisée** ⇒
   **409 `CATEGORIE_UTILISEE`** (« porte 6 ligne(s) »), toujours en base — aucune suppression déguisée ;
   libellé en doublon ⇒ **409 `CATEGORIE_EXISTE`** (l'index unique fait foi) ; désactivée ⇒ **400
   `CATEGORIE_INACTIVE`** sur une nouvelle ligne, et `?actif=false` la retrouve (filtre corrigé).
10. **Cohérence des agrégats** — Σ charges par mois = Σ par catégorie = total de l'exercice = Σ des débits
    par compte = **20 532 204** (unités mineures), à l'unité près. `dontNonDeductible` ventilé par compte
    (`6051` : 4 100 000 · `6581` : 2 500 000).
11. **Isolation multi-tenant, sur deux organisations réelles** — l'org B voit **0 ligne** et des totaux à
    zéro ; `PATCH` sur une ligne de A ⇒ **404 `LIGNE_DEPENSE_INTROUVABLE`**, **exactement** la réponse d'un
    identifiant inexistant (anti-énumération) ; rattacher une ligne à une **catégorie de A** ⇒ **404
    `CATEGORIE_INTROUVABLE`** ; les 8 lignes de A intactes, **aucun** document sans `orgId`.

**Observation hors périmètre** — un exercice sans paquet fiscal publié (2027) remonte en **500
`REFERENTIEL_UNAVAILABLE`** au lieu d'un 4xx explicite. Comportement **identique côté recettes** : il vient
du mapper d'erreurs de STORY-078, pas de cette story. Signalé, non corrigé (périmètre).

**Fragilité de test signalée** — le `GET ?mois=` du cahier de **recettes** (STORY-082) est rouge ~1 fois
sur 6 **en suite complète**, jamais en lançant son fichier seul. Ses `POST` de préparation n'asséraient
pas leur propre succès : l'échec était avalé et l'assertion finale accusait le filtre mensuel. Les
assertions ont été ajoutées (la prochaine occurrence nommera la vraie cause) ; **la cause racine n'est pas
identifiée** et le correctif ne prétend pas la supprimer.

---

**Status:** done
**Dependencies:** STORY-078 (plan de comptes, taux TVA, codes de réintégration), STORY-079/080 (profil, régime), STORY-101 (contrat, immutabilité) · **alimenté par** STORY-084 (OCR factures) · **agrégé par** STORY-085 · **exploité par** STORY-091 (réintégrations) et STORY-093 (TVA déductible)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A09, NFR-A04 · CGI Togo 2026 (charges réintégrables)
