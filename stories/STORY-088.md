# STORY-088 : Profil d'import & mapping de colonnes réutilisable

**Epic :** EPIC-021 — Hub multi-source (D13) : adaptateur #2 (import fichier)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A14 · STORY-086 (import Sage — amorce la structure `SageImportProfile`)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 17 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A14 (profil d'import & mapping de colonnes)

> **Ce qui rend l'import fichier utilisable au-delà du seul format Sage standard.** STORY-086 sait lire l'export « Balance des comptes » de **Sage 100**. Mais un cabinet gère des clients avec des exports **hétérogènes** : autres logiciels, versions anciennes, colonnes renommées, fichiers Excel bricolés. Plutôt que d'écrire un parser par format (dette sans fin), cette story rend le mapping **configurable et mémorisable** : le comptable **désigne une fois** quelle colonne est le compte, laquelle est le débit — et le **profil est réutilisé** aux imports suivants.

---

## User Story

En tant que **cabinet comptable** important des balances de **provenances variées**,
je veux **désigner une fois** la correspondance entre les colonnes de mon fichier et les champs attendus, puis **enregistrer ce mapping**,
afin que **les imports suivants du même format soient automatiques**, sans redemander le mapping ni écrire un parser dédié.

---

## Description

### Contexte

L'import Sage (STORY-086) suppose un fichier **conforme** au format « Balance des comptes » de Sage 100 (colonnes : *Numéro compte*, *Intitulé*, mouvements N-1, mouvements période, **soldes cumulés** D/C). Dans la réalité d'un cabinet :

- un client exporte depuis un **autre logiciel** (colonnes différentes) ;
- un autre a **renommé** ou **réordonné** les colonnes ;
- un troisième fournit un **Excel retravaillé** à la main.

Écrire un parser par cas est intenable. La solution standard : un **profil d'import** = un mapping `colonne du fichier → champ du contrat`, **nommé, mémorisé, réutilisable**, avec **détection automatique** quand le format est reconnu.

> **Le mapping ne dispense d'aucun contrôle.** Une fois les colonnes mappées, le fichier passe **exactement** les mêmes validations que tout le reste (équilibre FR-A25, doublons, format de compte — `BalanceValidator`, STORY-101). Un mapping ne « force » jamais une balance à passer.

### Périmètre

**Inclus :**

- **Modèle `ProfilImport`** (collection `profils_import`, keyée `orgId`) :
  - `nom` (« Sage 100 standard », « Export client Kossi »), `formatFichier` (`XLSX` | `CSV`), `separateur?` (`,` / `;`), `encodage?`, `ligneEntete` (n° de ligne des en-têtes), `ligneDebutDonnees`.
  - **`mappingColonnes`** : `{ compte, libelle, debiteur?, crediteur?, soldeNet?, ... }` → chaque champ pointe vers un **nom de colonne** ou un **index**.
  - `signature` : empreinte des en-têtes (permet la **détection automatique** au prochain import).
  - `actif`, `derniereUtilisation`.
- **Assistant de mapping** (`POST /api/v1/imports/analyser`) :
  - Upload d'un fichier → **200** `{ colonnesDetectees: [...], apercu: [5 lignes], mappingPropose, profilReconnu? }`.
  - **Détection automatique** : si la `signature` des en-têtes correspond à un profil existant → **profil proposé** (l'humain confirme).
  - **Proposition heuristique** sinon : reconnaissance par mots-clés (« compte », « n° compte », « débit », « crédit », « solde », « intitulé », « libellé ») — **toujours modifiable**.
- **CRUD des profils** (`@RequiresBalanceAccess`, isolation `orgId`) :
  - `POST /api/v1/imports/profils` → **201** ; `GET` (liste) ; `PATCH` ; **désactivation** (pas de suppression dure si des balances en dépendent — traçabilité).
- **Import via profil** — **extension de STORY-086** :
  - `POST /api/v1/balance/import` accepte désormais `profilImportId?` (à défaut : format Sage standard, comportement actuel **inchangé**).
  - Sémantique **inchangée** : **dry-run (défaut) → 200** (aperçu + warnings, aucune persistance) ; **`dryRun=false` → 201** (persiste via `BalanceRepository`).
- **Deux conventions de montants supportées** :
  - **Débit/Crédit séparés** (2 colonnes) — cas Sage ;
  - **Solde net signé** (1 colonne : positif = débiteur, négatif = créditeur) — cas fréquent des exports simplifiés → converti en `debiteur`/`crediteur` à la normalisation.
- **Validation du mapping** : un mapping **incomplet** (pas de colonne « compte », ni montant exploitable) → **400** explicite (`MAPPING_INCOMPLET`, champs manquants listés).
- **Traçabilité (NFR-A07)** : chaque balance importée conserve le **`profilImportId`** et la **`signature`** du fichier → on sait **comment** elle a été lue.
- **Tests** : analyse d'un fichier → colonnes détectées + mapping proposé ; **détection automatique** d'un profil déjà enregistré (signature) ; mapping manuel → import correct ; **solde net signé** → conversion D/C correcte ; mapping incomplet → **400** ; profil réutilisé au 2ᵉ import (aucune ressaisie) ; isolation `orgId` (un profil n'est **jamais** visible d'une autre org) ; **les contrôles FR-A25 s'appliquent quel que soit le profil**.

**Hors périmètre :**

- **Parser Sage standard** → **STORY-086** (CORE) : cette story l'**étend**, elle ne le remplace pas.
- **OCR d'un PDF** → hors périmètre (STORY-086 renvoie vers un export Excel/CSV).
- **Partage de profils entre organisations** (bibliothèque globale de formats) → **hors v1** ; un profil est **propre à l'org** (isolation). *(Une bibliothèque partagée gérée en admin serait une évolution naturelle.)*
- **Mapping des cahiers/OCR** → STORY-084/085 (autre mécanique).

### Flux

1. Le cabinet reçoit un export d'un **logiciel inconnu** (colonnes : *Cpte*, *Désignation*, *Solde*).
2. `POST /imports/analyser` → **200** : colonnes détectées, aperçu de 5 lignes, **mapping proposé** par heuristique (`Cpte → compte`, `Désignation → libelle`, `Solde → soldeNet`), **aucun profil reconnu**.
3. Le comptable **ajuste** (rien à corriger ici) et **enregistre** le profil : « Export client Kossi » → **201**.
4. Il lance l'import avec `profilImportId` → **dry-run 200** : aperçu, `Σ D = Σ C` ✔, 2 avertissements (comptes sans libellé).
5. Il confirme (`dryRun=false`) → **201** : balance persistée (STORY-101), avec `profilImportId` **tracé**.
6. **L'année suivante**, même fichier : `POST /imports/analyser` **reconnaît la signature** → profil « Export client Kossi » **proposé automatiquement** → import en **un clic**.

---

## Acceptance Criteria

- [ ] **`ProfilImport`** persisté (keyé `orgId`) : nom, format, séparateur/encodage, lignes d'en-tête/données, **`mappingColonnes`**, **`signature`**.
- [ ] **`POST /imports/analyser`** → **200** `{ colonnesDetectees, apercu, mappingPropose, profilReconnu? }` — **aucune persistance**.
- [ ] **Détection automatique** : si la **signature** des en-têtes correspond à un profil existant de l'org → **profil proposé** (confirmation humaine requise, jamais appliqué en silence).
- [ ] **Proposition heuristique** par mots-clés (compte / libellé / débit / crédit / solde) — **toujours modifiable**.
- [ ] **CRUD profils** (gate) : `POST` **201**, `GET`, `PATCH`, **désactivation** (pas de suppression dure si des balances y référent).
- [ ] **Import via profil** : `POST /balance/import` accepte `profilImportId?` ; **sans profil → comportement Sage standard inchangé** (non-régression STORY-086).
- [ ] **Sémantique HTTP inchangée** : dry-run (défaut) → **200** (aucune persistance) ; `dryRun=false` → **201** (persiste).
- [ ] **Deux conventions de montants** : **débit/crédit séparés** **et** **solde net signé** (positif = débiteur, négatif = créditeur) → converties correctement.
- [ ] **Mapping incomplet** (pas de compte ou pas de montant exploitable) → **400** `MAPPING_INCOMPLET` avec les champs manquants.
- [ ] **Les contrôles s'appliquent quel que soit le profil** : `BalanceValidator` (équilibre FR-A25, doublons, format de compte) — un mapping ne « force » **jamais** une balance à passer (test dédié : mapping valide + balance déséquilibrée → **rejet**).
- [ ] **Isolation** : un profil d'import n'est **jamais** visible d'une autre organisation (test e2e).
- [ ] **Traçabilité** : la balance importée conserve `profilImportId` + `signature` du fichier.
- [ ] **Réutilisation** : au 2ᵉ import du même format, **aucune ressaisie** du mapping (test).
- [ ] **Tests** : analyse, détection par signature, mapping manuel, solde net signé, mapping incomplet (400), contrôles appliqués, isolation, réutilisation. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Modèle

```typescript
export interface ProfilImport {
  orgId: string;                       // isolation stricte — jamais partagé entre orgs (v1)
  nom: string;                         // « Export client Kossi »
  formatFichier: 'XLSX' | 'CSV';
  separateur?: ',' | ';';
  encodage?: 'utf-8' | 'latin1';
  ligneEntete: number;                 // 1-based
  ligneDebutDonnees: number;

  mappingColonnes: {
    compte: string | number;           // nom de colonne OU index
    libelle?: string | number;
    // Convention A : débit/crédit séparés (Sage)
    debiteur?: string | number;
    crediteur?: string | number;
    // Convention B : solde net signé (positif = débiteur, négatif = créditeur)
    soldeNet?: string | number;
  };

  signature: string;                   // hash des en-têtes → détection auto
  actif: boolean;
  derniereUtilisation?: Date;
}

db.profils_import.createIndex({ orgId: 1, nom: 1 }, { unique: true });
db.profils_import.createIndex({ orgId: 1, signature: 1 });
```

### Normalisation — les deux conventions de montants

```typescript
normaliserMontants(row: Record<string, unknown>, m: MappingColonnes): { debiteur?: number; crediteur?: number } {
  // Convention A — colonnes séparées (Sage)
  if (m.debiteur != null || m.crediteur != null) {
    const d = toXof(row[m.debiteur as string]);
    const c = toXof(row[m.crediteur as string]);
    return { debiteur: d || undefined, crediteur: c || undefined };
  }

  // Convention B — solde net signé
  if (m.soldeNet != null) {
    const net = toXof(row[m.soldeNet as string]);
    return net >= 0 ? { debiteur: net } : { crediteur: Math.abs(net) };
  }

  throw new BadRequestException({ code: 'MAPPING_INCOMPLET', manquants: ['debiteur/crediteur ou soldeNet'] });
}
```

### Un mapping ne force jamais une balance à passer

```typescript
// Après application du mapping, on passe par le MÊME validateur que toutes les sources.
const balance = this.normalizer.normalize(lignes, profil);
await this.balanceValidator.validate(balance);   // FR-A25 : Σ D = Σ C — non négociable
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| Un mapping erroné produit une balance fausse **mais équilibrée** | L'**aperçu (dry-run 200)** est obligatoire avant persistance ; le comptable **voit** les 5 premières lignes mappées |
| Détection automatique appliquée en silence | Le profil reconnu est **proposé**, jamais appliqué sans confirmation |
| Mapping incomplet → import silencieusement partiel | **400 `MAPPING_INCOMPLET`** avec les champs manquants listés |
| Un mapping « contourne » les contrôles | **Impossible** : `BalanceValidator` s'applique **après** le mapping, identique pour toutes les sources (test dédié) |
| Fuite de profils entre organisations | Isolation `orgId` stricte (test e2e) ; pas de bibliothèque partagée en v1 |
| Suppression d'un profil utilisé → balance non explicable | **Désactivation** au lieu de suppression ; `profilImportId` conservé sur la balance |
| Séparateur/encodage FR (`;`, latin1) mal détecté | Paramétrables dans le profil ; détection proposée, corrigeable |

---

## Definition of Done

- [ ] Modèle `ProfilImport` + index (orgId+nom unique, orgId+signature)
- [ ] `POST /imports/analyser` (colonnes, aperçu, mapping proposé, profil reconnu)
- [ ] Détection automatique par **signature** (proposée, jamais imposée)
- [ ] CRUD profils + désactivation (pas de suppression si référencé)
- [ ] Import via `profilImportId` ; **sans profil → Sage standard inchangé** (non-régression 086)
- [ ] Deux conventions de montants (D/C séparés **et** solde net signé)
- [ ] `MAPPING_INCOMPLET` → 400 explicite
- [ ] **Contrôles FR-A25 appliqués quel que soit le profil** (test : mapping valide + balance déséquilibrée → rejet)
- [ ] Isolation inter-org (e2e) ; traçabilité (`profilImportId` + `signature` sur la balance)
- [ ] Réutilisation sans ressaisie au 2ᵉ import
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte

---

**Status:** ready-for-dev
**Dependencies:** **STORY-086** (import Sage — cette story l'étend), **STORY-101** (`BalanceValidator`, persistance) · **complète** l'adaptateur #2 du hub (D13)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A14
