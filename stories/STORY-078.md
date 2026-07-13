# STORY-078 : Chargement référentiel comptable (SN/SMT) + paquet fiscal pays (loader + checksum + cache)

**Epic :** EPIC-017 — Socle balance-service + contrat de balance canonique (volet référentiels) · recoupe **EPIC-019** (référentiels étendus & paramétrage pays)
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A04/A05/A06 · `architecture-catalog-service-2026-07-07.md` (packaging des référentiels versionnés) · `referentiels/README.md` (artefacts amorcés)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 15 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A04 (référentiel comptable SN+SMT), FR-A05 (paquet fiscal `pays × année`), FR-A06 (consommation du gabarit de liasse géré en admin — D12)

> **Le service devient multi-pays sans une seule ligne de code par pays.** Jusqu'ici (CORE S10), `balance-service` sait stocker une balance taguée `referentiel` (`SN`/`SMT`/`SFD-BCEAO`) — mais il ne sait pas encore *ce que ces tags signifient* : quel plan de comptes, quels taux d'impôt, quel gabarit de liasse. Cette story branche les **loaders d'artefacts versionnés** (référentiel comptable, paquet fiscal, gabarit de liasse) que l'**admin** publie via `platform-catalog-service`. **NFR-A06 : aucun taux, aucun plan de comptes, aucun gabarit en dur dans le code.** C'est le prérequis de tout le moteur fiscal (S18) et de la détermination de régime (STORY-080).

---

## User Story

En tant que **`balance-service`** (et, derrière lui, le cabinet qui traite un dossier togolais puis, demain, ivoirien),
je veux **charger le référentiel comptable et le paquet fiscal du pays × année depuis un artefact versionné** (publié en admin),
afin de **calculer et restituer selon les règles du bon pays** sans redéploiement de code ni fork par pays.

---

## Description

### Contexte

Le programme a acté (**D8, D12**) que le multi-pays passe par des **données versionnées**, pas par du code :

| Artefact | Contenu | Publié par | Consommé par |
|---|---|---|---|
| **Référentiel comptable** | Plan de comptes SYSCOHADA (**Système Normal** *et* **SMT**) | admin → `platform-catalog-service` | `balance-service` (ici), `bilan-service` |
| **Paquet fiscal `pays × année`** | Taux (IS, MFP, TVA, TPU), seuils de régime, règles réintégrations/déductions, calendrier d'acomptes | admin → `platform-catalog-service` | `balance-service` (moteur fiscal S18) |
| **Gabarit de liasse (GUIDEF)** | Postes officiels de la DSF du pays | admin (D12) | `bilan-service` (rendu) — `balance-service` ne fait que **référencer** son identifiant |

Les **amorces existent déjà** dans `referentiels/` (produites le 2026-07-12) :
- `table-de-passage-syscohada.json` — compte SYSCOHADA → poste GUIDEF (**validée 100 %** sur les 50 comptes réels de la balance Sage ETS RELAXED) ;
- `paquet-fiscal-togo-2026.json` — IS **27 %**, **MFP 1 % du CA HT** (impôt = `max(MFP, IS)`), TVA **18 %**, **4 acomptes**, régimes réel/synthétique-TPU ;
- `postes-syscohada-guidef-togo.json` — **163 postes** officiels (Bilan, CR, TFT, résultat fiscal, liquidation IS).

Cette story les transforme en **artefacts chargeables, versionnés et vérifiés** (checksum), mis en cache, et expose une API interne (`ReferentielProvider`, `PaquetFiscalProvider`) que les stories aval consomment.

> **Frontière rappelée.** La **table de passage compte → poste** reste utilisée par le **`bilan-service`** (STORY-055) pour rendre la liasse. `balance-service` en charge le **plan de comptes** (pour valider/rattacher les comptes) et le **paquet fiscal** (pour calculer l'impôt). Pas de duplication du moteur de liasse.

### Périmètre

**Inclus :**

- **`ReferentielLoader`** (patron repris de `bilan-service` STORY-038) :
  - Résout l'artefact à charger depuis le **read-model `entitlements`** (STORY-077) et/ou le tag `referentiel` de la balance : `(referentielId, version)`.
  - Récupère l'artefact **packagé** (via `platform-catalog-service`, EPIC-007) ; **vérifie le checksum** (SHA256) ; rejette si altéré.
  - **Cache en mémoire** (clé `referentielId@version`), invalidé sur `referentiel.published` / redémarrage.
- **`ReferentielProvider`** (API interne) :
  - `getPlanDeComptes(referentielId, version)` → liste des comptes valides (préfixes SYSCOHADA, classes 1-8) + libellés.
  - `isCompteValide(compte)` → validation du format/existence (consommé par `BalanceValidator` STORY-101 et le rattachement STORY-085).
  - **Deux systèmes** : `SN` (Système Normal) **et** `SMT` (Système Minimal de Trésorerie) — plans distincts, chargés du même artefact.
- **`PaquetFiscalLoader` + `PaquetFiscalProvider`** :
  - Clé **`(pays, année)`** — ex. `TG@2026` → `paquet-fiscal-togo-2026`.
  - `getTaux(code)` → IS, MFP, TVA, TPU… ; `getSeuilsRegime()` ; `getReglesRetraitement()` (codes réintégrations/déductions) ; `getCalendrierAcomptes()`.
  - **Versionné et immuable** : un exercice clos garde le paquet de **son** année (un changement de loi 2027 ne réécrit pas 2026).
- **Résolution du couple (pays, exercice)** : dérivée du **profil société** (STORY-079, même sprint) + des dates d'exercice de la balance.
- **Endpoint d'introspection (admin/debug)** : `GET /api/v1/referentiels/actifs` (`@RequiresBalanceAccess`) → `{ referentiel: {id, version, checksum}, paquetFiscal: {pays, annee, version, checksum} }` — permet de **prouver** quel artefact a servi à un calcul (piste d'audit NFR-A07).
- **Dégradation contrôlée** : artefact absent/injoignable → **erreur explicite** (`REFERENTIEL_INDISPONIBLE`), **jamais** de valeur par défaut silencieuse (un taux d'impôt deviné est un bug fiscal).
- **Tests** : chargement + checksum OK/KO ; cache (2ᵉ appel ne refetch pas) ; SN vs SMT ; paquet `TG@2026` (valeurs du CGI : IS 27 %, MFP 1 %, TVA 18 %) ; artefact absent → erreur explicite ; immutabilité (exercice 2026 garde son paquet même si 2027 publié).

**Hors périmètre :**

- **Publication/édition** des artefacts (upload GUIDEF, saisie des taux) → **admin-panel + `platform-catalog-service`** (EPIC-007/016, D12). Ici on **consomme** seulement.
- **Table de passage compte → poste** et **rendu de la liasse** → `bilan-service` (STORY-055, EPIC-011).
- **Calcul fiscal** (résultat fiscal, IS, TVA) → **STORY-091→095** (S18). Ici on ne fait que **fournir les taux**.
- **Détermination du régime** → **STORY-080** (consomme `getSeuilsRegime()`).
- **Référentiel IFRS anglophone** et **multi-devises** (Guinée) → hors v1 (D8).

### Flux

1. Un cabinet ouvre un dossier ; le **profil société** (STORY-079) donne `pays = TG` ; la balance porte `exercice 2026-01-01 → 2026-12-31` et `referentiel = SN`.
2. `balance-service` résout : référentiel **`syscohada-sn@v1`**, paquet fiscal **`TG@2026`**.
3. `ReferentielLoader` récupère l'artefact via `platform-catalog-service`, **vérifie le checksum**, le met en cache.
4. `PaquetFiscalLoader` fait de même pour `TG@2026` (IS 27 %, MFP 1 %, TVA 18 %, 4 acomptes).
5. Les stories aval consomment : `BalanceValidator` (compte valide ?), STORY-080 (seuils de régime), STORY-091→095 (taux fiscaux).
6. `GET /api/v1/referentiels/actifs` permet de **prouver** en audit quel artefact a servi.
7. *(Artefact absent)* → `REFERENTIEL_INDISPONIBLE` : le calcul **s'arrête**, aucune valeur devinée.

---

## Acceptance Criteria

- [ ] **`ReferentielLoader`** charge un artefact `(referentielId, version)`, **vérifie le checksum SHA256**, et **rejette** un artefact altéré (`CHECKSUM_INVALIDE`).
- [ ] **Cache** : un 2ᵉ appel sur le même `referentielId@version` **ne refait pas** l'appel réseau (prouvé par compteur/mock).
- [ ] **`ReferentielProvider`** expose le **plan de comptes** pour les **deux systèmes** : `SN` **et** `SMT` (plans distincts, chargés du même artefact).
- [ ] **`isCompteValide(compte)`** valide les comptes SYSCOHADA (y compris **alphanumériques** : `5211BOA0`, `411FACTURE`) et rejette un compte inconnu.
- [ ] **`PaquetFiscalProvider`** charge `(pays, année)` et expose, pour **`TG@2026`**, les valeurs du CGI : **IS 27 %**, **MFP 1 % du CA HT**, **TVA 18 %**, **4 acomptes**, seuils de régime, codes de réintégration/déduction.
- [ ] **Immutabilité par exercice** : une balance d'exercice **2026** résout **`TG@2026`** même si `TG@2027` a été publié entre-temps.
- [ ] **Aucun taux / plan / gabarit en dur** dans le code (NFR-A06) — vérifié par revue + grep (aucune constante `0.27`, `0.18`… hors fixtures de test).
- [ ] **Artefact indisponible** → **erreur explicite `REFERENTIEL_INDISPONIBLE`** (400/503), **jamais** de valeur par défaut silencieuse.
- [ ] **`GET /api/v1/referentiels/actifs`** (gate) retourne `{referentiel, paquetFiscal}` avec **id, version, checksum** (traçabilité NFR-A07).
- [ ] **Tests** : checksum OK/KO, cache, SN vs SMT, valeurs `TG@2026`, immutabilité d'exercice, artefact absent. **Coverage ≥ 90 %** sur les loaders/providers.
- [ ] **CI vert** : lint, build, test(+cov) pour `balance-service`.

---

## Technical Notes

### Interfaces

```typescript
export interface ArtefactRef {
  id: string;        // ex: 'syscohada-sn'
  version: string;   // ex: 'v1'
  checksum: string;  // SHA256 attendu
}

export interface PlanDeComptes {
  systeme: 'SN' | 'SMT';
  comptes: Array<{ prefixe: string; libelle: string; classe: number }>;
}

export interface PaquetFiscal {
  pays: string;                 // 'TG'
  annee: number;                // 2026
  devise: string;               // 'XOF'
  taux: {
    is: number;                 // 0.27
    mfp: number;                // 0.01 (du CA HT)
    tva: number;                // 0.18
    tpu?: Array<{ trancheMin: number; trancheMax: number; taux: number }>; // à compléter
  };
  seuilsRegime: { syntheticCaMax: number; /* … */ };
  reglesRetraitement: Array<{ code: string; libelle: string; sens: 'REINTEGRATION' | 'DEDUCTION' }>;
  calendrierAcomptes: Array<{ echeance: string; quotePart: number }>; // 4 × 1/4
  source: string;               // 'CGI et LPF 2026 (Togo)'
}

export interface ReferentielProvider {
  getPlanDeComptes(ref: ArtefactRef): Promise<PlanDeComptes>;
  isCompteValide(compte: string, ref: ArtefactRef): Promise<boolean>;
}

export interface PaquetFiscalProvider {
  get(pays: string, annee: number): Promise<PaquetFiscal>;   // lève REFERENTIEL_INDISPONIBLE si absent
}
```

### Résolution (pays, année)

```typescript
// Le pays vient du profil société (STORY-079) ; l'année, de l'exercice de la balance.
const pays  = (await this.profilSociete.get(orgId)).pays;          // 'TG'
const annee = balance.exercice.fin.getFullYear();                  // 2026
const paquet = await this.paquetFiscal.get(pays, annee);           // TG@2026 — immuable pour cet exercice
```

### Garde-fou NFR-A06

> **Aucune valeur fiscale ou comptable en dur.** Si un taux manque dans le paquet, on **lève** — on ne « suppose » pas. Un IS deviné à 25 % au lieu de 27 % est un redressement.

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| `platform-catalog-service` (EPIC-007) pas encore livré au S15 | Il l'est : **sprint 7** (STORY-031→034) — bien avant. À défaut, loader depuis un artefact **local packagé** (`referentiels/`) derrière la même interface |
| Artefact altéré / corrompu | **Checksum SHA256 obligatoire** ; rejet explicite `CHECKSUM_INVALIDE` |
| Un changement de loi réécrit un exercice clos | Clé **`(pays, année)`** + immutabilité : un exercice garde **son** paquet |
| Taux manquant → valeur devinée | **Interdit** : lever `REFERENTIEL_INDISPONIBLE` (NFR-A06) |
| Paquet Togo incomplet (TPU par tranche, CNSS) | **Question ouverte connue** (PRD §13) : le paquet expose ce qu'il a ; STORY-095 (TPU) dépend de sa complétion — signalé, non bloquant pour cette story |

---

## Definition of Done

- [ ] `ReferentielLoader` + `ReferentielProvider` (SN **et** SMT) implémentés + testés
- [ ] `PaquetFiscalLoader` + `PaquetFiscalProvider` (`pays × année`) implémentés + testés
- [ ] Checksum vérifié ; artefact altéré rejeté
- [ ] Cache opérationnel (pas de refetch)
- [ ] `TG@2026` charge les vraies valeurs du CGI (IS 27 %, MFP 1 %, TVA 18 %, 4 acomptes)
- [ ] Immutabilité par exercice prouvée par test
- [ ] `GET /api/v1/referentiels/actifs` (traçabilité) + Swagger
- [ ] Aucun taux/plan en dur (revue + grep)
- [ ] Coverage ≥ 90 % sur loaders/providers ; CI verte
- [ ] Non-régression : CORE S10 (076/077/101/086/099) e2e toujours verts

---

**Status:** ready-for-dev
**Dependencies:** STORY-076 (scaffold), STORY-077 (read-models/gate) · **consomme** `platform-catalog-service` (EPIC-007, sprint 7) · **alimente** STORY-080 (seuils de régime), STORY-085 (rattachement), STORY-091→095 (moteur fiscal)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A04/A05/A06, NFR-A06 · `referentiels/README.md`
