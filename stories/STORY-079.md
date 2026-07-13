# STORY-079 : Profil société — modèle + CRUD (NIF, RCCM, CNSS, actionnaires, forme juridique, gérant) keyé `orgId`

**Epic :** EPIC-018 — Profil société & régime
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A01 · `rapport-bilan-logique-metier-2026-07-12.md` §12 (fiches d'identification de la GUIDEF) · GUIDEF Togo (`1000745307_2025_Definitif.xlsx`, feuilles « Page de garde » / « Identification » / « Dirigeants »)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
**Sprint :** 15 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A01 (profil société)

> **L'identité fiscale du dossier — sans laquelle rien ne se calcule.** Le pays détermine le paquet fiscal (STORY-078), l'objet et le CA déterminent le régime (STORY-080), le NIF/RCCM/CNSS remplissent la **page de garde de la DSF**. Cette story pose le **modèle de profil société** et son CRUD, keyé `orgId`. Les champs sont ceux **réellement exigés par la GUIDEF** (fiches d'identification, dirigeants, actionnaires) — pas une invention. Le **pré-remplissage par OCR** des Statuts et de la carte CFE vient juste après (STORY-081) ; ici, la saisie est **manuelle et complète**.

---

## User Story

En tant que **cabinet comptable** (ou distributeur) traitant un dossier client,
je veux **saisir et maintenir l'identité fiscale complète de la société** (NIF, RCCM, CNSS, forme juridique, capital, objet/activité, dirigeants, actionnaires),
afin que le système **détermine le bon régime**, **applique le bon paquet fiscal**, et **remplisse la page de garde de la DSF** sans ressaisie.

---

## Description

### Contexte

La **DSF (GUIDEF)** s'ouvre sur des fiches d'identification que le comptable remplit aujourd'hui à la main, chaque année : raison sociale, sigle, **NIF**, **RCCM**, **CNSS**, forme juridique, capital, date de création, **activité (code NAEMA)**, adresse, dirigeants, actionnaires et leurs parts. Ces mêmes données conditionnent **le calcul** :

- **`pays`** → quel **paquet fiscal** charger (STORY-078 : `TG@2026`) ;
- **`activité` + `chiffre d'affaires`** → quel **régime** proposer (STORY-080 : réel vs synthétique/TPU ; SN vs SMT) ;
- **`forme juridique`** → assujettissement IS vs IRPP ;
- **`capital` / `actionnaires`** → notes annexes de la liasse.

Le profil est donc **une donnée de calcul**, pas seulement de l'état civil. Il est **keyé `orgId`** (multi-tenant, NFR-A02) et **versionné dans le temps** (une société change d'adresse, de gérant, de capital — et la DSF de 2026 doit refléter l'état **de 2026**).

> **Ownership (question ouverte PRD §13, tranchée ici).** `auth-service` possède l'**identité de compte** (`Organization`: nom, statut). `balance-service` possède le **profil fiscal métier** (NIF, RCCM, CNSS, capital, dirigeants…) — il **ne duplique pas** le nom/statut, il **référence** l'`orgId`. Le read-model d'identité (STORY-077) fournit le reste. À reconfirmer si `auth-service` devait un jour porter ces champs.

### Périmètre

**Inclus :**

- **Modèle `ProfilSociete`** (collection `profils_societe`, clé unique `orgId`), champs alignés sur la GUIDEF :
  - **Identification** : `raisonSociale`, `sigle?`, `formeJuridique` (SA/SARL/SAS/SUARL/EI…), `nif`, `rccm`, `numeroCnss?`, `dateCreation`, `pays` (ISO-2, ex. `TG`), `devise` (`XOF`).
  - **Activité** : `objetSocial` (texte), `codeNaema?` (nomenclature d'activité), `secteur?`.
  - **Capital & actionnariat** : `capitalSocial` (XOF), `actionnaires: [{ nom, parts, pourcentage, type: PHYSIQUE|MORALE }]` (somme des % contrôlée ≈ 100).
  - **Contacts / dirigeants** : `adresse`, `email`, `telephone`, `dirigeants: [{ nom, fonction, nif? }]` (au moins un gérant/DG).
  - **Régime** (rempli par **STORY-080**, pas ici) : `systemeComptable?: 'SN'|'SMT'`, `regimeFiscal?: 'REEL'|'SYNTHETIQUE'`.
- **CRUD** (`@RequiresBalanceAccess`, isolation `orgId` stricte) :
  - `POST /api/v1/profil-societe` → **201** (crée ; 409 si déjà existant pour l'org).
  - `GET /api/v1/profil-societe` → **200** (profil de **l'org du JWT** — jamais d'`orgId` en paramètre, cf. risque data-leak).
  - `PATCH /api/v1/profil-societe` → **200** (mise à jour partielle, validée).
  - Pas de `DELETE` dur (un profil se **désactive**, il ne s'efface pas — piste d'audit NFR-A07).
- **Validation** (DTO stricte, `ValidationPipe`) :
  - `nif`, `rccm` : format **paramétrable par pays** (le format togolais ≠ ivoirien) → règle lue depuis le **paquet pays** (STORY-078) ou, à défaut, validation de longueur/charset + **avertissement non bloquant**.
  - `pays` ∈ pays supportés (paquet fiscal disponible) ; sinon **400** explicite.
  - Somme des `pourcentage` des actionnaires ≈ **100 %** (tolérance 0,01) → sinon **avertissement** (pas bloquant : un profil peut être incomplet en cours de saisie).
  - `capitalSocial ≥ 0`, `dateCreation` passée.
- **Complétude** : `GET /api/v1/profil-societe/completude` → `{ complet: bool, champsManquants: string[] }` — indique ce qui **bloque** la production de la DSF (ex. NIF absent) vs ce qui est **optionnel**.
- **Historisation** : toute modification écrit une entrée d'audit (`qui`, `quand`, `champ`, `avant`, `après`) — append-only (NFR-A07). Le profil « en vigueur à la clôture N » est reconstituable.
- **Tests** : CRUD + isolation org (l'org A ne lit jamais le profil de l'org B) ; validations ; complétude ; historisation ; 409 sur doublon.

**Hors périmètre :**

- **Pré-remplissage OCR** (Statuts + carte CFE) → **STORY-081** (même sprint). Ici, saisie **manuelle**.
- **Détermination du régime** (2 axes SN/SMT × réel/TPU) → **STORY-080** (consomme `pays`, `objetSocial`, CA).
- **Rendu des fiches d'identification dans la liasse** → `bilan-service` (EPIC-011), qui **lira** ce profil.
- **Gestion des utilisateurs/rôles de l'org** → `auth-service` (déjà livré).

### Flux

1. Le cabinet crée un dossier client → `POST /api/v1/profil-societe` avec les champs connus (raison sociale, forme juridique, pays…).
2. Validation : `pays = TG` supporté (paquet `TG@2026` disponible — STORY-078) ✔ ; NIF au bon format ✔ ; actionnaires ≈ 100 % ✔.
3. **201 Created**. `GET /completude` → `{ complet: false, champsManquants: ['numeroCnss', 'codeNaema'] }`.
4. Le cabinet complète au fil de l'eau (`PATCH`) ; chaque modification est **historisée**.
5. **STORY-080** lit `pays` + `objetSocial` + CA (de la balance) → **propose** le régime ; le cabinet **confirme**.
6. **STORY-078** utilise `pays` + l'exercice pour résoudre le **paquet fiscal**.
7. À la production de la liasse, `bilan-service` lit le profil pour la **page de garde** de la DSF.

---

## Acceptance Criteria

- [ ] **Modèle `ProfilSociete`** persisté (collection `profils_societe`), **clé unique `orgId`**, avec tous les champs GUIDEF listés (identification, activité, capital/actionnaires, contacts/dirigeants).
- [ ] **CRUD** protégé par `@RequiresBalanceAccess` : `POST` **201** (409 si doublon), `GET` **200**, `PATCH` **200**. **Pas de suppression dure.**
- [ ] **Isolation multi-tenant stricte (NFR-A02)** : l'`orgId` provient **du JWT**, **jamais** d'un paramètre client → un utilisateur de l'org A ne peut **pas** lire/modifier le profil de l'org B (test e2e dédié : **404/403**, pas de fuite).
- [ ] **Validations** : `pays` supporté (sinon **400** explicite) ; `capitalSocial ≥ 0` ; `dateCreation` passée ; somme des parts actionnaires ≈ 100 % (**avertissement**, non bloquant) ; formats NIF/RCCM **paramétrés par pays** (avertissement si non conforme).
- [ ] **`GET /completude`** retourne `{ complet, champsManquants[] }` en distinguant les champs **bloquants** pour la DSF des champs optionnels.
- [ ] **Historisation** : chaque `PATCH` écrit une entrée d'audit **append-only** (`qui/quand/champ/avant/après`) ; le profil « en vigueur » à une date est reconstituable.
- [ ] **Aucun champ d'identité dupliqué** depuis `auth-service` (pas de `name`/`status` de l'`Organization` recopiés — seul l'`orgId` est référencé).
- [ ] **Tests** : CRUD, 409 doublon, isolation org (e2e), validations, complétude, historisation. **Coverage ≥ 90 %.**
- [ ] **Swagger** documenté (201/200/400/403/409) ; **CI verte**.

---

## Technical Notes

### Schéma

```typescript
export interface ProfilSociete {
  orgId: string;                     // clé unique — vient du JWT, jamais du client

  // Identification (GUIDEF — page de garde)
  raisonSociale: string;
  sigle?: string;
  formeJuridique: 'SA' | 'SARL' | 'SAS' | 'SUARL' | 'EI' | 'AUTRE';
  nif: string;
  rccm: string;
  numeroCnss?: string;
  dateCreation: Date;
  pays: string;                      // ISO-2 — 'TG' ; conditionne le paquet fiscal (STORY-078)
  devise: string;                    // 'XOF' (v1 : mono-devise)

  // Activité
  objetSocial: string;
  codeNaema?: string;
  secteur?: string;

  // Capital & actionnariat
  capitalSocial: number;             // XOF
  actionnaires: Array<{
    nom: string;
    type: 'PHYSIQUE' | 'MORALE';
    parts: number;
    pourcentage: number;             // Σ ≈ 100
  }>;

  // Contacts & dirigeants
  adresse: string;
  email?: string;
  telephone?: string;
  dirigeants: Array<{ nom: string; fonction: string; nif?: string }>;

  // Régime — rempli par STORY-080 (2 axes orthogonaux)
  systemeComptable?: 'SN' | 'SMT';
  regimeFiscal?: 'REEL' | 'SYNTHETIQUE';

  actif: boolean;                    // désactivation, pas de suppression dure
  createdAt: Date;
  updatedAt: Date;
}

db.profils_societe.createIndex({ orgId: 1 }, { unique: true });
```

### Isolation — le piège à éviter

```typescript
// ❌ JAMAIS : l'orgId ne vient pas du client
@Get('/profil-societe/:orgId')
async get(@Param('orgId') orgId: string) { /* data leak */ }

// ✅ TOUJOURS : l'orgId vient du JWT validé (TenantContext)
@Get('/profil-societe')
@RequiresBalanceAccess()
async get(@TenantContext() orgId: string) {
  return this.profilService.getByOrg(orgId);
}
```

### Historisation (append-only)

```typescript
interface ProfilSocieteAudit {
  orgId: string;
  champ: string;          // 'capitalSocial'
  avant: unknown;
  apres: unknown;
  parUserId: string;
  le: Date;
}
// Jamais d'UPDATE/DELETE sur cette collection (NFR-A07).
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Fuite inter-org** (orgId pris du client) | `orgId` **toujours** issu du JWT/`TenantContext` ; test e2e d'isolation obligatoire |
| Duplication de l'identité `auth-service` | Ne stocker **que** le profil fiscal métier ; référencer l'`orgId` ; nom/statut lus du read-model (STORY-077) |
| Formats NIF/RCCM variables par pays | Règle **paramétrée** (paquet pays) ; à défaut, **avertissement** non bloquant plutôt qu'un rejet arbitraire |
| Profil incomplet bloque tout | `GET /completude` distingue **bloquant** (NIF) et **optionnel** ; la saisie reste progressive |
| Profil modifié après clôture → DSF N incohérente | **Historisation append-only** : l'état « en vigueur à la clôture » est reconstituable |

---

## Definition of Done

- [ ] Modèle `ProfilSociete` + index unique `orgId`
- [ ] CRUD (POST 201 / GET 200 / PATCH 200 ; 409 doublon ; pas de DELETE dur)
- [ ] Isolation multi-tenant prouvée par **e2e** (org A ≠ org B)
- [ ] Validations (pays supporté, capital, dates, parts ≈ 100 %, formats NIF/RCCM par pays)
- [ ] `GET /completude` (bloquant vs optionnel)
- [ ] Historisation append-only + test de reconstitution
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : CORE S10 e2e verts

---

**Status:** ready-for-dev
**Dependencies:** STORY-076 (scaffold), STORY-077 (gate + read-model identité) · **alimente** STORY-080 (régime), STORY-078 (résolution `pays`), STORY-081 (pré-remplissage OCR), `bilan-service` EPIC-011 (page de garde DSF)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A01 · GUIDEF Togo (fiches d'identification)
