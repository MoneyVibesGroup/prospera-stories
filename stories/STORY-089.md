# STORY-089 : Import des relevés bancaires (banque + mobile money TMoney / Flooz)

**Epic :** EPIC-022 — Rapprochement bancaire
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A15 · `rapport-bilan-logique-metier-2026-07-12.md` §O3 (balance Sage réelle : présence de **TMONEY** en trésorerie) · hiérarchie de preuve (bancaire > facture normalisée > reçu/OCR > estimation)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 17 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A15 (import des relevés bancaires et mobile money)

> **La source de preuve la plus forte que l'Atelier puisse obtenir.** Dans la hiérarchie de preuve, le **relevé bancaire** est au sommet : il vient d'un **tiers** (la banque, l'opérateur mobile), il n'est pas rédigé par le client. Cette story importe les relevés — **bancaires classiques ET mobile money (TMoney / Flooz)** — pour permettre le **rapprochement** (STORY-090), qui confrontera les cahiers à la réalité des flux. Le mobile money n'est **pas** un cas exotique : la balance Sage réelle analysée (ETS RELAXED) porte un compte **TMONEY** en trésorerie.

---

## User Story

En tant que **cabinet comptable**,
je veux **importer les relevés bancaires et mobile money** d'un client,
afin de disposer de la **réalité des encaissements et décaissements** et de pouvoir **confronter les cahiers** à cette source de preuve.

---

## Description

### Contexte

Le **chemin A** repose sur des cahiers **déclaratifs** : le client dit ce qu'il a encaissé et dépensé. Sans contre-mesure, une recette peut être **oubliée** (redressement) et une dépense **inventée** (fraude). Le relevé bancaire est le **contrepoids** : il vient d'un tiers.

En Afrique de l'Ouest, la trésorerie d'une PME est **hybride** :

| Canal | Réalité terrain | Format de relevé |
|---|---|---|
| **Banque** (BOA, Ecobank, UTB…) | Compte principal | PDF, **CSV/Excel** (parfois) |
| **Mobile money** (**TMoney**, **Flooz**) | **Flux quotidien majeur** — encaissements clients, paiements fournisseurs | Export CSV, **captures d'écran**, SMS |
| **Caisse** (espèces) | Reste important | **Aucun relevé** (d'où la fragilité de preuve) |

Cette story couvre l'**import** ; le **rapprochement** (matching relevé ↔ cahiers, détection des écarts) est **STORY-090**.

> **Point important :** un relevé importé **ne crée pas d'écritures**. Il constitue un **référentiel de flux réels** contre lequel on **compare**. Créer automatiquement des lignes de cahier depuis un relevé serait tentant — mais ce serait supposer la **nature comptable** d'un flux (un virement reçu est-il une vente ? un apport ? un remboursement ?). **C'est au comptable de qualifier** (STORY-090 propose, l'humain tranche).

### Périmètre

**Inclus :**

- **Modèle `CompteTresorerie`** (collection `comptes_tresorerie`, keyée `orgId`) :
  - `libelle` (« BOA — compte courant », « TMoney gérant »), `type` : `BANQUE` | `MOBILE_MONEY` | `CAISSE`, `numero?` (IBAN/n° de compte/n° de téléphone), `compteComptable` (`52x` banque / `5xx` mobile money / `57x` caisse — **validé** contre le plan de comptes, STORY-078), `devise` (`XOF`), `actif`.
  - Ce **mapping vers le compte comptable** est celui qu'utilise la **ventilation** (STORY-085) — une seule source de vérité.
- **Modèle `LigneReleve`** (collection `lignes_releve`, keyée `orgId` + `compteTresorerieId` + `exercice`) :
  - `date`, `libelle` (brut du relevé), `montant`, `sens` : `CREDIT` (entrée) | `DEBIT` (sortie), `reference?`, `soldeApres?`.
  - `checksumLigne` — empreinte `(date, montant, sens, libelle)` → **détection de doublon** à la ré-importation.
  - `statutRapprochement` : `NON_RAPPROCHE` (défaut) | `RAPPROCHE` | `ECARTE` — **piloté par STORY-090**.
- **Import** (`POST /api/v1/tresorerie/:compteId/releves`, `@RequiresBalanceAccess`) :
  - Formats : **CSV / Excel** (prioritaires) ; **PDF** → renvoi explicite vers un export CSV/Excel (pas d'OCR de relevé en v1) ; **capture d'écran mobile money** → **déléguée à l'OCR** (STORY-084, type `CAPTURE_TRANSACTION`) et non traitée ici.
  - **Réutilise le `ProfilImport`** (STORY-088) pour le mapping de colonnes — **aucun parser dédié par banque**. C'est le même mécanisme, appliqué aux relevés.
  - Sémantique **alignée sur STORY-086/088** : **dry-run (défaut) → 200** (aperçu + doublons détectés, aucune persistance) ; **`dryRun=false` → 201** (persiste).
- **Détection de doublon (essentielle)** : ré-importer un relevé qui **chevauche** une période déjà importée est le cas **normal** (le client renvoie 3 mois au lieu d'un). Les lignes déjà présentes (même `checksumLigne`) sont **ignorées** (comptées, listées) — **jamais dupliquées**.
- **Contrôle de continuité** : si le relevé porte un **solde après opération**, vérifier la **chaîne des soldes** (`soldeApres[n-1] + montant[n] = soldeApres[n]`) → une rupture = **relevé tronqué ou altéré** → **avertissement explicite**.
- **Consultation** : `GET /api/v1/tresorerie/:compteId/releves?du=…&au=…` → lignes + totaux (entrées/sorties) + **solde de fin de période**.
- **Tests** : import CSV banque ; import CSV **mobile money** ; **ré-import chevauchant → doublons ignorés, non dupliqués** ; rupture de chaîne de soldes → avertissement ; PDF → message explicite (pas d'OCR de relevé) ; mapping via `ProfilImport` (STORY-088) ; **aucune écriture comptable créée** (test explicite) ; isolation `orgId` ; dry-run **200** sans persistance / **201** avec.

**Hors périmètre :**

- **Rapprochement** (matching relevé ↔ cahiers, écarts, état de rapprochement) → **STORY-090** (même sprint).
- **Connexion bancaire automatique** (API bancaire, agrégateur type PSD2) → **hors v1** (n'existe pas en UEMOA de façon standardisée) ; import de fichier uniquement.
- **OCR de relevé PDF** → hors v1 (renvoi vers export CSV/Excel). Les **captures** mobile money passent par **STORY-084**.
- **Création automatique de lignes de cahier depuis un relevé** → **interdit** (la qualification comptable d'un flux est une décision — STORY-090 **propose**).

### Flux

1. Le cabinet déclare les comptes de trésorerie du client : « BOA — courant » (`521`), « **TMoney gérant** » (`5xx`), « Caisse » (`571`).
2. Il importe le **relevé BOA de mars** (CSV) → `POST /tresorerie/:id/releves` (**dry-run**) → **200** : 84 lignes, 0 doublon, chaîne de soldes cohérente ✔.
3. Confirmation (`dryRun=false`) → **201** : 84 `LigneReleve` persistées, toutes `NON_RAPPROCHE`.
4. Il importe le **relevé TMoney** (CSV de l'opérateur) via un **`ProfilImport`** (STORY-088) créé une fois → 213 lignes.
5. **Le client renvoie par erreur janvier→mars** (chevauchement) : ré-import → **dry-run 200** : « 84 lignes déjà présentes (ignorées), 156 nouvelles » → **aucun doublon créé**.
6. Un relevé présente une **rupture de chaîne de soldes** → **avertissement** : « relevé possiblement tronqué entre le 12 et le 15 mars » → le cabinet redemande le relevé complet.
7. `GET /tresorerie/:id/releves` → entrées 6 400 000 · sorties 5 100 000 · solde de fin 1 300 000.
8. **STORY-090** prend le relais : confronter ces flux aux **cahiers** (recettes/dépenses) → **écarts** → recettes non déclarées, dépenses non justifiées.

---

## Acceptance Criteria

- [ ] **`CompteTresorerie`** : CRUD (gate), types **`BANQUE`**, **`MOBILE_MONEY`**, **`CAISSE`** ; `compteComptable` **validé** contre le plan de comptes (STORY-078) ; **le mapping est celui utilisé par la ventilation (STORY-085)** — une seule source de vérité.
- [ ] **Import de relevé** (`POST /tresorerie/:compteId/releves`) : **CSV / Excel** ; **dry-run (défaut) → 200** (aperçu + doublons, aucune persistance) ; **`dryRun=false` → 201** (persiste). *(Sémantique identique à STORY-086/088.)*
- [ ] **Mapping de colonnes via `ProfilImport`** (STORY-088) — **aucun parser dédié par banque**.
- [ ] **Mobile money supporté de plein droit** (TMoney/Flooz) — pas un cas particulier bricolé (confirmé par la balance Sage réelle : compte **TMONEY** en trésorerie).
- [ ] **Détection de doublon** : ré-import **chevauchant** → lignes déjà présentes (`checksumLigne`) **ignorées**, **comptées et listées**, **jamais dupliquées** (test obligatoire — le chevauchement est le cas *normal*).
- [ ] **Contrôle de continuité des soldes** : rupture dans la chaîne `soldeApres` → **avertissement explicite** (« relevé possiblement tronqué ») ; **non bloquant**.
- [ ] **⚠️ Aucune écriture comptable créée** depuis un relevé (test explicite) : un relevé est un **référentiel de flux**, la qualification comptable relève de STORY-090 (proposition) + décision humaine.
- [ ] **PDF** → message explicite renvoyant vers un export CSV/Excel (pas d'OCR de relevé en v1) ; les **captures** mobile money passent par **STORY-084**.
- [ ] **Consultation** `GET /tresorerie/:compteId/releves?du=&au=` → lignes + totaux entrées/sorties + **solde de fin**.
- [ ] **Isolation `orgId`** (JWT) — test e2e inter-org.
- [ ] **Tests** : import banque, import mobile money, ré-import chevauchant (doublons ignorés), rupture de soldes, PDF refusé proprement, mapping via profil, aucune écriture créée, dry-run/persist, isolation. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Modèles

```typescript
export interface CompteTresorerie {
  orgId: string;
  libelle: string;                        // « TMoney gérant »
  type: 'BANQUE' | 'MOBILE_MONEY' | 'CAISSE';
  numero?: string;                        // IBAN / n° compte / n° téléphone
  compteComptable: string;                // 52x | 5xx (mobile money) | 57x — validé (STORY-078)
  devise: string;                         // 'XOF'
  actif: boolean;
}

export interface LigneReleve {
  orgId: string;
  compteTresorerieId: string;
  exercice: { debut: Date; fin: Date };

  date: Date;
  libelle: string;                        // brut du relevé (sert au matching STORY-090)
  montant: number;                        // XOF, positif
  sens: 'CREDIT' | 'DEBIT';               // CREDIT = entrée ; DEBIT = sortie
  reference?: string;
  soldeApres?: number;                    // si fourni → contrôle de continuité

  checksumLigne: string;                  // hash(date, montant, sens, libelle) → anti-doublon
  statutRapprochement: 'NON_RAPPROCHE' | 'RAPPROCHE' | 'ECARTE';  // piloté par STORY-090
}

db.lignes_releve.createIndex({ orgId: 1, compteTresorerieId: 1, checksumLigne: 1 }, { unique: true }); // anti-doublon
db.lignes_releve.createIndex({ orgId: 1, compteTresorerieId: 1, date: 1 });
```

### Anti-doublon — le chevauchement est le cas normal

```typescript
async importer(orgId, compteId, lignes: LigneReleve[], dryRun: boolean) {
  const existants = new Set(await this.releveRepo.checksums(orgId, compteId));

  const nouvelles = lignes.filter(l => !existants.has(l.checksumLigne));
  const ignorees  = lignes.length - nouvelles.length;   // ← chevauchement : NORMAL, pas une erreur

  if (dryRun) {
    return { statut: 200, nouvelles: nouvelles.length, ignorees, apercu: nouvelles.slice(0, 5) };
  }
  await this.releveRepo.insertMany(nouvelles);          // l'index unique garantit l'absence de doublon
  return { statut: 201, crees: nouvelles.length, ignorees };
}
```

### Contrôle de continuité

```typescript
verifierChaineSoldes(lignes: LigneReleve[]): string[] {
  const avert: string[] = [];
  for (let i = 1; i < lignes.length; i++) {
    const p = lignes[i - 1], c = lignes[i];
    if (p.soldeApres == null || c.soldeApres == null) continue;
    const delta = c.sens === 'CREDIT' ? c.montant : -c.montant;
    if (Math.abs(p.soldeApres + delta - c.soldeApres) > 1) {   // tolérance 1 XOF
      avert.push(`Rupture de solde entre le ${fmt(p.date)} et le ${fmt(c.date)} — relevé possiblement tronqué`);
    }
  }
  return avert;   // avertissement, jamais bloquant
}
```

### La règle : un relevé ne crée pas d'écriture

```typescript
// ❌ INTERDIT — deviner la nature comptable d'un flux
if (ligne.sens === 'CREDIT') await this.cahierRecettes.creer({ montant: ligne.montant }); // NON

// ✅ Le relevé est un RÉFÉRENTIEL. STORY-090 propose un rapprochement ; l'humain qualifie.
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Ré-import → doublons** → trésorerie gonflée | `checksumLigne` + **index unique** ; le chevauchement est **attendu** et géré (lignes ignorées, comptées) |
| Relevé **tronqué** → écarts inexplicables au rapprochement | **Contrôle de continuité des soldes** → avertissement « relevé possiblement tronqué » |
| Création automatique d'écritures depuis un relevé | **Interdit** (test explicite) : la qualification comptable est une **décision humaine** (STORY-090) |
| Un parser par banque → dette sans fin | **Réutilisation du `ProfilImport`** (STORY-088) : mapping configuré une fois, réutilisé |
| Mobile money traité comme un cas marginal | Type **`MOBILE_MONEY`** de premier plan (TMoney/Flooz), confirmé par la balance Sage réelle |
| Relevé PDF non exploitable | Message explicite → export CSV/Excel ; les **captures** passent par l'OCR (STORY-084) |
| Fuite inter-org | `orgId` du JWT ; test e2e |

---

## Definition of Done

- [ ] `CompteTresorerie` (BANQUE / MOBILE_MONEY / CAISSE) + mapping vers compte comptable **validé** et **partagé avec la ventilation (STORY-085)**
- [ ] Import CSV/Excel via `ProfilImport` ; dry-run **200** / persist **201**
- [ ] **Anti-doublon** au ré-import chevauchant (test obligatoire)
- [ ] Contrôle de continuité des soldes (avertissement)
- [ ] **Aucune écriture comptable créée** (test explicite)
- [ ] PDF refusé proprement (renvoi CSV/Excel) ; captures → STORY-084
- [ ] Consultation (lignes, totaux, solde de fin) ; isolation e2e
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-086/088 (imports) verts

---

**Status:** ready-for-dev
**Dependencies:** STORY-078 (plan de comptes — validation du compte comptable), **STORY-088** (`ProfilImport` — mapping de colonnes réutilisé), STORY-085 (partage du mapping trésorerie pour la ventilation) · **alimente** **STORY-090** (rapprochement)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A15 · hiérarchie de preuve (bancaire = niveau le plus élevé)
