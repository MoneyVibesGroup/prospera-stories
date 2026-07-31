# STORY-089 : Import des relevés bancaires (banque + mobile money TMoney / Flooz)

**Epic :** EPIC-022 — Rapprochement bancaire
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A15 · `rapport-bilan-logique-metier-2026-07-12.md` §O3 (balance Sage réelle : présence de **TMONEY** en trésorerie) · hiérarchie de preuve (bancaire > facture normalisée > reçu/OCR > estimation)
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** high
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
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

## Décisions de conception

### D-089-1 — `ProfilImport` gagne une **cible** (`BALANCE` | `RELEVE`), il ne se dédouble pas

Le périmètre exige de **réutiliser le `ProfilImport`** de STORY-088. Or son
`mappingColonnes` décrit une **balance** (`compte`, `debiteur`/`crediteur`/`soldeNet`) :
un relevé n'a ni compte ni solde débiteur, il a une date, un libellé et un sens.

Créer un second magasin de profils aurait dupliqué tout le mécanisme utile — signature
d'en-têtes, séparateur, encodage, ligne d'en-tête, détection automatique, désactivation
— et garanti la divergence au premier correctif. On ajoute donc **un discriminant
`cible`** au profil existant (défaut `BALANCE`, ce qui laisse les profils déjà
enregistrés strictement inchangés), et le mapping devient une **union** dont la forme
est dictée par `cible`.

⚠️ Corollaire non négociable : la **détection automatique par signature est filtrée
sur `cible`**. Deux formats peuvent porter les mêmes en-têtes ; reconnaître un profil
de balance en analysant un relevé proposerait un mapping structurellement inapplicable,
et — pire — l'inverse ferait lire un relevé comme une balance.

### D-089-2 — Trois conventions de montants, dont une **propre au mobile money**

Un relevé bancaire classique porte `Débit | Crédit`. Un export simplifié porte un
**montant signé**. Un export d'opérateur mobile money porte un **montant positif** plus
une **colonne de type** (« Dépôt », « Retrait », « Paiement marchand »). Les trois sont
supportées **de plein droit** :

| Convention | Colonnes | Sens |
|---|---|---|
| **A** | `debit` / `credit` | la colonne renseignée donne le sens |
| **B** | `montant` **signé** | `> 0` ⇒ `CREDIT` (entrée), `< 0` ⇒ `DEBIT` (sortie) |
| **C** | `montant` **positif** + `sens` + `valeursCredit[]` / `valeursDebit[]` | la valeur de la colonne de type, comparée aux deux listes |

En **C**, les **deux** listes sont obligatoires et une valeur qui ne correspond à
aucune des deux **rejette la ligne** (`SENS_INDETERMINE`, listée). Un défaut implicite
« tout ce qui n'est pas un retrait est un encaissement » suffirait à transformer des
frais d'opérateur en recettes, sans le moindre signal.

⚠️ La convention **B** porte un risque d'**inversion globale du relevé** : certains
exports signent en sens inverse. Un relevé inversé reste parfaitement plausible et
casserait STORY-090 en silence. Le **contrôle de continuité des soldes** est ce qui le
détecte — c'est sa seconde raison d'être, au-delà de la troncature.

### D-089-3 — Le `checksumLigne` porte un **rang d'occurrence** — sinon il supprime des flux réels

`hash(date, montant, sens, libelle)` seul est **faux dans un cas fréquent** : deux
paiements TMoney de 5 000 XOF au même marchand le même jour produisent la **même**
empreinte. La seconde ligne serait comptée « déjà présente » et **jamais importée** —
la trésorerie serait minorée, et l'écart apparaîtrait au rapprochement comme une
dépense non justifiée. Exactement le symptôme que `LigneRecette` refuse déjà en
n'ayant **aucun** index unique (STORY-082).

L'empreinte inclut donc le **rang d'occurrence du tuple dans le fichier** :

```
checksumLigne = sha256(dateJour | montant | sens | libelleNormalisé | rang)
```

Le rang est le n-ième exemplaire de ce **tuple exact** dans le fichier importé. La date
faisant partie du tuple, la portée du rang est naturellement **par jour** — ce qui rend
le calcul **stable au ré-import chevauchant** : un fichier janvier→mars renumérote les
lignes de mars à l'identique de ce que l'import de mars seul avait produit, donc les
doublons restent détectés et les vrais jumeaux restent distincts.

### D-089-4 — Un relevé **n'invente pas** son compte comptable

`compteComptable` est **facultatif à la création** : omis, il est repris du paramétrage
de **ventilation** (STORY-085) selon le type (`BANQUE` → `banque`, `MOBILE_MONEY` →
`mobileMoney`, `CAISSE` → `caisse`). C'est ce qui donne corps à « une seule source de
vérité » : le défaut n'est **jamais recopié en base**, il se relit à chaque fois.

Fourni, il est **validé contre le plan de comptes** de l'organisation (STORY-078) — un
second compte bancaire (BOA *et* Ecobank) est un cas légitime que le paramétrage
mono-compte de STORY-085 ne sait pas exprimer.

⚠️ Ce que cette story **ne fait pas** : rendre la ventilation multi-comptes. STORY-085
continue de résoudre sa contrepartie sur le seul `moyenPaiement`. Le rapprochement
(STORY-090) est le premier consommateur qui saura, lui, désigner **quel** compte de
trésorerie est concerné.

### D-089-5 — Écriture en **transaction**, l'index unique restant le vrai filet

Un import persiste **plus d'un document** : `insertMany` s'exécute dans une transaction
(`.agents/rules/transactions-mongo.md`). Un échec au milieu ne laisse jamais un relevé à
moitié importé — un relevé tronqué **par accident d'écriture** serait indiscernable d'un
relevé tronqué à la source, et le contrôle de continuité l'attribuerait à la banque.

Deux imports concurrents du même fichier se soldent par un `E11000` sur l'index unique
`(orgId, compteTresorerieId, checksumLigne)` → **409 explicite** invitant à rejouer (le
rejeu verra les lignes comme déjà présentes). Le pré-comptage des doublons est un
**confort d'aperçu**, jamais la garantie.

### D-089-6 — Un exercice **CLOS** refuse l'import

Cohérence avec STORY-087 (D-087-5) et les cahiers : une fois N-1 clos, plus rien ne
s'écrit dessus. Importer un relevé dans un exercice verrouillé donnerait à STORY-090 de
quoi rapprocher une période que personne n'assume plus.

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
  compteComptable?: string;               // D-089-4 : omis ⇒ défaut de ventilation (085) ;
                                          // fourni ⇒ validé contre le plan (078)
  devise: string;                         // 'XOF'
  actif: boolean;
}

export interface LigneReleve {
  orgId: string;
  compteTresorerieId: string;
  exercice: { debut: Date; fin: Date };

  date: Date;
  libelle: string;                        // brut du relevé (sert au matching STORY-090)
  montant: number;                        // unités mineures XOF, entier > 0
  sens: 'CREDIT' | 'DEBIT';               // CREDIT = entrée ; DEBIT = sortie
  reference?: string;
  soldeApres?: number;                    // unités mineures signées ; si fourni → continuité

  checksumLigne: string;                  // D-089-3 : … | rang d'occurrence → anti-doublon
  statutRapprochement: 'NON_RAPPROCHE' | 'RAPPROCHE' | 'ECARTE';  // piloté par STORY-090
}

db.lignes_releve.createIndex({ orgId: 1, compteTresorerieId: 1, checksumLigne: 1 }, { unique: true }); // anti-doublon
db.lignes_releve.createIndex({ orgId: 1, compteTresorerieId: 1, date: 1 });
```

**Unités** : montants en **unités mineures XOF entières** (× 100), comme partout dans
`balance-service` (cahiers STORY-082/083, normalizer STORY-086). Un relevé lu en
décimaux se comparerait mal aux cahiers au rapprochement.

### Anti-doublon — le chevauchement est le cas normal

```typescript
async importer(orgId, compteId, lignes: LigneReleve[], dryRun: boolean) {
  // Le rang d'occurrence (D-089-3) est posé par le parser, AVANT ce point : sans lui,
  // deux paiements identiques du même jour n'en feraient qu'un.
  const existants = new Set(await this.releveRepo.checksums(orgId, compteId));

  const nouvelles = lignes.filter(l => !existants.has(l.checksumLigne));
  const ignorees  = lignes.length - nouvelles.length;   // ← chevauchement : NORMAL, pas une erreur

  if (dryRun) {
    return { statut: 200, nouvelles: nouvelles.length, ignorees, apercu: nouvelles.slice(0, 5) };
  }
  // Plus d'un document ⇒ transaction (D-089-5). L'index unique reste le vrai filet
  // contre deux imports concurrents : E11000 → 409, jamais un doublon persisté.
  await this.releveRepo.insererPlusieurs(nouvelles, session);
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

## Progress Tracking

**Statut : `done`** — livrée le **2026-07-30** (PR #21 `balance-service`, `MNV-089` → `dev`,
« Rebase and merge », branche supprimée).

| Phase | État |
|---|---|
| Cadrage + décisions D-089-1..6 | ✅ |
| Implémentation | ✅ |
| Portes DoD (lint / build / unit / e2e / couverture) | ✅ |
| Mutation-tests | ✅ 32/32 |
| Vérification docker (persistance réelle, atomicité, isolation) | ✅ 24/24 |
| Revue de code | ✅ 1 bloquant + 3 mineurs corrigés |
| Revue de sécurité | ✅ 1 vulnérabilité corrigée |

### Ce qui a été livré

- **`ProfilImport` gagne une cible** (D-089-1) : `cible: BALANCE | RELEVE` (défaut `BALANCE`,
  les profils de STORY-088 sont inchangés), mapping en union, aiguillage centralisé dans
  `imports/cible.regles.ts`, détection automatique keyée `(orgId, cible, signature)`, refus
  `MAPPING_HORS_CIBLE` d'un champ de l'autre cible et `PROFIL_MAUVAISE_CIBLE` à l'import.
  Règles de relevé pures dans `imports/mapping-releve.regles.ts` (3 conventions de montants,
  parsing de date `JJ/MM` et ISO).
- **Module `src/modules/tresorerie/`** : `CompteTresorerie` (`comptes_tresorerie`) + CRUD gardé,
  `LigneReleve` (`lignes_releve`) + import `POST /tresorerie/:compteId/releves`
  (dry-run 200 / persist 201) et consultation `GET` (lignes, totaux, solde de fin),
  parser par profil rejetant **ligne à ligne** plutôt que devinant.
- **Aucune dépendance vers les cahiers ni `BalanceService`** : l'invariant « un relevé ne crée
  aucune écriture » est structurel, pas déclaratif.

### Portes de qualité

Lint **0 warning** · build OK · **1639 unitaires + 354 e2e** verts ·
couverture globale **98,9 / 91,96 / 98,1 / 98,9** (module `tresorerie` 98,6 / 84,2 / 96,6 / 98,8 ;
`imports` 98,3 / 91,3 / 100 / 98,5) — tous au-dessus des seuils 65/90/90/90.

**Mutation-tests : 32/32 rouges.** Notamment : checksum sans rang d'occurrence, rang compté par
fichier au lieu du tuple, libellé non normalisé, tolérance de continuité élargie, `soldeFin`
reconstitué par cumul, convention C à une seule liste, sens inconnu tombant dans un défaut,
date lue en `MM/JJ`, date inexistante décalée, filtre `cible` retiré de la détection, insertion
hors transaction, tri sans `_id`, garde PDF/exercice clos/compte inactif retirée, borne `au`
exclusive, `dryRun` booléen naïf, 201 systématique, `orgId` retiré d'un filtre.

⚠️ **Un mutation-test a d'abord échoué à filtrer** : « `chargerPourImport` n'exige plus la bonne
cible » restait vert, parce que l'e2e vérifiait le **double** de `ProfilsImportService` et non le
vrai service — exactement la fausse assurance que la discipline cherche. Corrigé par trois tests
unitaires sur le vrai service (mutation désormais rouge) ; l'e2e porte maintenant un commentaire
disant explicitement qu'il ne prouve que la **forme HTTP** du refus.

### Vérification docker — stack NEUVE (`down -v`), 24/24

Deux organisations **réelles** amorcées sur l'IdP, gates ouvertes (KYC `APPROVED` + entitlement
`balance` `ACTIVE` / `syscohada-revise@2.1`).

| # | Contrôle | Résultat |
|---|---|---|
| 1 | Stack neuve, `/health` `mongodb: up`, `kafka: up` | ✅ |
| 2 | Déclaration `BANQUE`/`MOBILE_MONEY`/`CAISSE`, compte comptable repris de la ventilation | ✅ `521` / `551` / `571` |
| 3 | `POST /imports/analyser` avec `cible=RELEVE` → mapping complet proposé, `manquants: []` | ✅ |
| 4 | Signature identique **analyse ↔ profil enregistré** | ✅ `c1f2deb8…` |
| 5 | Champ de l'autre cible refusé | ✅ 400 `MAPPING_HORS_CIBLE` `{champs:["debiteur"]}` |
| 6 | **Dry-run par défaut** → 200, `lignes_releve` reste à **0** | ✅ |
| 7 | `dryRun=false` → 201, documents réels (unités mineures, `sens`, `soldeApres`, `NON_RAPPROCHE`, `parUserId`) | ✅ 2 documents |
| 8 | **Ré-import chevauchant** (janvier→mars sur mars déjà importé) | ✅ 3 lues / **1 nouvelle** / 2 ignorées → **3 lignes, pas 5** |
| 9 | Ré-import **intégral** | ✅ HTTP **200** (pas 201), 0 création |
| 10 | **Jumelles** (2 paiements identiques le même jour) | ✅ **2 lignes**, 2 empreintes ; ré-import → 0 nouveauté (rangs stables) |
| 11 | Mobile money convention C | ✅ `Dépôt`→CREDIT, `Paiement marchand`→DEBIT, `Frais de service` → **`SENS_INDETERMINE` listé** |
| 12 | Index réellement en base | ✅ `(orgId,compteTresorerieId,checksumLigne)` UNIQUE, `(orgId,libelle)` UNIQUE, `(orgId,cible,signature)` |
| 13 | **Atomicité** (index unique partiel temporaire, échec en milieu de lot) | ✅ 409, **7 avant / 7 après, 0 orphelin** — la ligne qui précédait l'échec est annulée aussi |
| 14 | **Aucune écriture comptable** après 5 imports | ✅ `lignes_recettes`=0, `lignes_depenses`=0, `balances`=0, `outbox_events`=0 |
| 15 | Rupture de la chaîne des soldes | ✅ avertissement daté, **non bloquant** (2 lignes créées) |
| 16 | PDF | ✅ 400 `RELEVE_PDF_NON_SUPPORTE`, message aiguillant vers CSV/Excel et l'OCR de capture |
| 17 | **Isolation** : détail / PATCH / DELETE / import / consultation du compte d'une autre org | ✅ **404** partout (jamais 403) |
| 18 | Isolation : liste de l'org B vide, compte et lignes de l'org A **intacts** ; même libellé possible dans deux orgs | ✅ |
| 19 | Consultation `du`/`au` — le **dernier jour est inclus** | ✅ 2 lignes du 1ᵉʳ au 5 mars, `soldeFin` 130 000 000 |
| 20 | **D-089-4** : correction du paramétrage de ventilation (`521`→`5211`) | ✅ le compte **suit** ; champ `compteComptable` **ABSENT** en base |
| 21 | Compte comptable **fixé** insensible à la correction ; compte hors plan refusé | ✅ `5215` inchangé ; 400 `COMPTE_COMPTABLE_INCONNU` |
| 22 | **D-089-1** croisé : profil `BALANCE` sur un relevé ; profil sans `cible` | ✅ 409 `PROFIL_MAUVAISE_CIBLE` ; défaut `BALANCE` |
| 23 | **D-089-6** exercice CLOS ; compte désactivé/réactivé ; `?actif=false` ; suppression gardée | ✅ 409 + 0 écriture ; 409 puis 200 ; liste correcte ; 409 `{lignes:7}` puis 204 |
| 24 | **Non-régression 086/088** : `/balance/import/sage` 200→201, `/balance/import` générique 201 avec `profilImportId` tracé, ligne « Totaux » écartée (2 lignes), payload `balance.created` **sans fuite** de traçabilité | ✅ |

⚠️ **Piège rencontré pendant la vérification elle-même** — le premier contrôle « exercice clos »
a été inséré dans `exerciceatelier` (pluriel Mongoose deviné) au lieu de **`exercices_atelier`** :
`estClos` renvoyait `false`, l'import passait, et le contrôle **paraissait échouer côté code**
alors que c'était la vérification qui écrivait au mauvais endroit. Le contrôle rejoué sur la
bonne collection est vert. C'est le piège documenté dans `CLAUDE.md`, payé une fois de plus.

### Risque résiduel assumé

Toute erreur `E11000` levée pendant la transaction d'import est traduite en
`IMPORT_RELEVE_CONCURRENT`. Le message est exact en production — l'unique index unique de
`lignes_releve` est celui du `checksumLigne` — mais il serait trompeur si un futur index unique
était ajouté à la collection sans revoir ce mapping.

---

**Status:** done
**Dependencies:** STORY-078 (plan de comptes — validation du compte comptable), **STORY-088** (`ProfilImport` — mapping de colonnes réutilisé), STORY-085 (partage du mapping trésorerie pour la ventilation) · **alimente** **STORY-090** (rapprochement)
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A15 · hiérarchie de preuve (bancaire = niveau le plus élevé)
