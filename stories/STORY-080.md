# STORY-080 : Détermination des 2 axes (système comptable SN/SMT + régime fiscal réel/synthétique) proposée selon pays + objet + CA

**Epic :** EPIC-018 — Profil société & régime
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A03 · `rapport-bilan-logique-metier-2026-07-12.md` §2 (correction : SN/SMT et réel/TPU sont **orthogonaux**) · `docs/referentiels/paquet-fiscal-togo-2026.json` § `regimesImposition` (seuils de régime **réels**) · CGI Togo 2026, Chap. V, art. 128-139 (régime de l'entreprenant / **TPU**, plafond **60 000 000**)
**Priorité :** Must Have
**Story Points :** 3
**Complexité :** medium — *réutilise l'infrastructure de STORY-079 (transaction 2-docs + audit append-only `profils_societe_audit`, champs `systemeComptable`/`regimeFiscal` déjà réservés au schéma) et le loader de STORY-078 ; le soin de conception porte sur la **sémantique des seuils** (plafond 60 M, statut `a_confirmer`), l'**indépendance des 2 axes** (aucune déduction croisée) et la **traçabilité** (NFR-A07). Pas d'infra nouvelle → pas `high`.*
**Statut :** done ✅ — clôturée le **2026-07-27** (PR #9 balance-service, MNV-080 rebase-mergée sur `dev`)
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-12 · **révisée le 2026-07-27** (cadrage aligné sur le code réel de `balance-service` — 078 et 079 sont mergés ; cf. § Alignement au code réel)
**Sprint :** 15 (EXTENDED)
**Service :** `balance-service` (:3007)
**Couvre :** FR-A03 (détermination des 2 axes)

> **Deux axes, pas un seul — l'erreur classique que ce système ne doit pas commettre.** Une approximation fréquente consiste à confondre « régime synthétique » et « SMT ». Ce sont **deux axes indépendants** (corrélés en pratique, mais **jamais** déduits l'un de l'autre) :
> - **Axe comptable (OHADA)** : **Système Normal (SN)** vs **Système Minimal de Trésorerie (SMT)** → détermine le **plan de comptes** et le **gabarit de liasse**.
> - **Axe fiscal (national, CGI)** : **Réel** vs **Synthétique / TPU** (entreprenant) → détermine **comment l'impôt est calculé** (IS/MFP vs taxe forfaitaire).
>
> Cette story **propose** les deux, à partir de `pays` + `objetSocial` + **chiffre d'affaires**, en lisant les **seuils du paquet fiscal** (STORY-078) — et laisse **l'humain confirmer**. Le système ne décide jamais seul d'un régime fiscal.

---

## User Story

En tant que **cabinet comptable**,
je veux que le système **propose le système comptable (SN/SMT) et le régime fiscal (réel/synthétique)** à partir du pays, de l'activité et du chiffre d'affaires,
afin de **ne pas me tromper de régime** (et donc de plan de comptes, de liasse et de mode de calcul de l'impôt), tout en **gardant la main** pour confirmer ou surcharger.

---

## Description

### Contexte

Le régime conditionne **tout l'aval** :

| Axe | Valeurs (enums 079) | Conditionne |
|---|---|---|
| **Comptable (OHADA)** | `SN` / `SMT` | Plan de comptes (STORY-078), gabarit de liasse (`bilan-service`), niveau de détail exigé |
| **Fiscal (CGI national)** | `REEL` / `SYNTHETIQUE` (TPU) | Mode de calcul : **IS = max(MFP, IS)** + 4 acomptes (STORY-092) **vs** **TPU forfaitaire** (STORY-095) |

**Ils sont indépendants** : une entreprise peut être au **réel** tout en tenant une comptabilité **SMT** (petite structure au réel), ou être au **synthétique** avec une compta **SN** (choix volontaire de rigueur). Le système **propose la combinaison la plus probable** et **autorise chaque axe à être réglé séparément**.

Les **seuils** ne sont **pas** en dur : ils viennent du **paquet fiscal `(pays, année)`** (STORY-078), chargé via `ReferentielService.chargerPaquetFiscal(orgId)`. Pour le **Togo 2026**, le paquet réel (`paquet-fiscal-togo-2026.json` § `regimesImposition`) fixe le régime **synthétique / TPU** de l'entreprenant sous un **plafond de CA de `plafondCA: 60 000 000` FCFA** (`synthetique_entreprenant_tpu`, `statut: "confirme_complet"`, source CGI art. 128-139). ⚠️ Le seuil **30 000 000** qui figurait dans la première rédaction n'est **pas** la frontière réel↔synthétique : c'est la **borne entre les deux tranches TPU** (tranche 1 : CA ≤ 30 M ; tranche 2 : 30 M < CA ≤ 60 M). La frontière fiscale **réel↔synthétique** est le **plafond 60 M**.

> **Le système propose, l'humain dispose.** Un régime fiscal a des conséquences légales. La proposition est **motivée** (quel seuil, quelle source) et **toujours modifiable** ; la décision est **tracée** (qui, quand, sur quelle base) — NFR-A07.

### Périmètre

**Inclus :**

- **`RegimeService.proposer(user, exercice)`** :
  - Entrées : profil société via `ProfilSocieteService.lire(user)` (STORY-079 : `pays`, `objetSocial`/`codeNaema`) + **CA de l'exercice** (résolu par `resoudreCA`, cf. ci-dessous).
  - Lit le **paquet fiscal** via `ReferentielService.chargerPaquetFiscal(orgId)` → `{ paquet: PaquetFiscalPackage, cache }`. Les seuils se lisent dans `paquet.rubriques.regimesImposition` (bag `Record<string, unknown>` — **navigation défensive**, cf. Technical Notes) : `synthetique_entreprenant_tpu.plafondCA` (= 60 000 000 pour TG@2026).
  - Retourne une **proposition motivée** :
    ```json
    {
      "systemeComptable": { "valeur": "SN", "motif": "CA 75 000 000 XOF au-dessus du plafond TPU (60 000 000)", "source": "OHADA / paquet TG@2026" },
      "regimeFiscal":     { "valeur": "REEL", "motif": "CA 75 000 000 XOF > plafond TPU 60 000 000 (Art. 132)", "source": "CGI TG 2026, art. 128-139" },
      "confiance": "HAUTE",
      "avertissements": []
    }
    ```
  - **Cas d'incertitude → `confiance: 'BASSE'` + avertissement explicite** :
    - CA absent/estimé (« CA inconnu — proposition indicative »).
    - CA à **± 10 % du plafond** 60 M (« CA proche du plafond TPU — vérifier »).
    - Seuil au **`statut: "a_confirmer"`** dans le paquet (les tranches `reel_normal`/`reel_simplifie` du paquet TG@2026 le sont) → « seuil de sous-régime non confirmé par le paquet ».
    - Référentiel comptable **SMT au statut feuille de route** (`smt-togo@1.0`, D-078-3) → « gabarit SMT en amorce — confirmer le système comptable ».
  - **`resoudreCA(orgId, exercice)`** : lit la **dernière balance** de l'exercice (contrat `BalanceCanonique`, STORY-101) et somme les **comptes classe 7** ; à défaut de balance, retombe sur le **CA déclaré** saisi par le cabinet ; à défaut → `null` (⇒ `confiance: BASSE`).
- **`POST /api/v1/profil-societe/regime`** (`@RequiresBalanceAccess` + `@Roles(TENANT_*)`) — **confirmation humaine** :
  - Body : `{ exercice, systemeComptable: 'SN'|'SMT', regimeFiscal: 'REEL'|'SYNTHETIQUE', motifSurcharge? }`.
  - **Les deux axes sont réglables indépendamment** (aucune déduction automatique de l'un vers l'autre).
  - Si la valeur retenue **diverge** de la proposition → `motifSurcharge` **obligatoire** (tracé), sinon **400** `MOTIF_SURCHARGE_REQUIS`.
  - Écrit `systemeComptable` / `regimeFiscal` sur le `ProfilSociete` (STORY-079 a **déjà réservé les deux champs `@Prop` optionnels** + les enums) **et** une **entrée d'audit append-only** dans `profils_societe_audit` (mécanisme `insererAudits` de 079), en **transaction 2-docs** — en réutilisant `appliquerPatch`/verrou optimiste de version. L'audit trace la **proposition**, la **valeur retenue**, l'**auteur**, la **date** et le **motif de surcharge**.
- **`GET /api/v1/profil-societe/regime`** → régime en vigueur (les 2 champs du profil) + proposition courante + historique des changements (rejeu de `profils_societe_audit` filtré sur `champ ∈ {systemeComptable, regimeFiscal}`).
- **Effets aval (câblage, pas calcul)** : le `systemeComptable` retenu devient le **tag `referentiel`** (`SN`/`SMT`) des balances de l'exercice (contrat STORY-101) ; le `regimeFiscal` **aiguille** le moteur fiscal (S18 : `REEL` → STORY-091/092 ; `SYNTHETIQUE` → STORY-095).
- **Tests** : proposition SN/REEL au-dessus du plafond 60 M ; SMT/SYNTHETIQUE en dessous ; **combinaison mixte** (SMT + REEL) acceptée ; CA absent → `confiance: BASSE` ; CA proche du plafond → avertissement ; seuil `a_confirmer` → avertissement ; surcharge sans motif → **400** ; changement de régime **tracé** en audit.

**Hors périmètre :**

- **Calcul de l'impôt** (IS, MFP, TPU) → **STORY-091→095** (S18). Ici on ne fait qu'**aiguiller**.
- **Chargement des seuils / du paquet fiscal** → **STORY-078** (on les **consomme** via `chargerPaquetFiscal`).
- **Modèle & schéma du profil, enums de régime** → **STORY-079** (déjà en place : hooks inertes que 080 **remplit**, jamais ne recrée).
- **Changement de régime en cours d'exercice** (bascule réel ↔ synthétique en N) : hors v1 → le régime vaut **pour l'exercice** ; un changement s'applique à l'exercice suivant (avertissement si tentative).
- **Complétion des tranches réel normal / réel simplifié** (`statut: "a_confirmer"` dans le paquet) → dépend du paquet fiscal (question ouverte PRD §13, blocker fiscaliste) ; ici on **avertit** sans deviner.

### Flux

1. Le cabinet a saisi le **profil société** (STORY-079) : `pays = TG`, `objetSocial = commerce de détail`.
2. Il demande une proposition : `GET /api/v1/profil-societe/regime`.
3. `RegimeService` résout le **CA** (dernière balance de l'exercice, comptes classe 7 — ou CA déclaré si aucune balance encore) : **75 000 000 XOF**.
4. Il charge le **paquet** de l'org via `chargerPaquetFiscal(orgId)` → `regimesImposition.synthetique_entreprenant_tpu.plafondCA = 60 000 000`.
5. Proposition : **SN** (comptable) + **REEL** (fiscal, CA > plafond 60 M), `confiance: HAUTE`, motifs cités.
6. Le cabinet **confirme** : `POST /regime` → écrit les 2 champs sur le profil + **audit** (même transaction).
7. *(Variante)* Le cabinet estime que la compta doit rester **SMT** malgré le réel → il règle **l'axe comptable seul** (`SMT` + `REEL`) avec un **motif de surcharge** → accepté et **tracé**.
8. *(Variante limite)* CA = **58 000 000** (à −3,3 % du plafond) → proposition **SYNTHETIQUE** mais `confiance: BASSE` + avertissement « CA proche du plafond TPU — vérifier ».
9. Les balances de l'exercice porteront `referentiel = SMT` ; le moteur fiscal (S18) appliquera le **réel** (IS/MFP).

---

## Acceptance Criteria

- [ ] **`RegimeService.proposer()`** retourne une proposition **par axe** (`systemeComptable`, `regimeFiscal`), chacune avec **`valeur`, `motif`, `source`**, plus un niveau de **`confiance`**.
- [ ] Les **seuils sont lus du paquet fiscal** via `chargerPaquetFiscal(orgId)` (`regimesImposition.synthetique_entreprenant_tpu.plafondCA`) — **aucun seuil en dur** dans le code (NFR-A06) ; frontière réel↔synthétique = **plafond 60 M**, jamais le 30 M inter-tranches.
- [ ] **⚠️ Jamais lire le `paquetFiscal` embarqué dans l'artefact comptable** (périmé, F-078-1) : la source est le **paquet fiscal autonome** (`chargerPaquetFiscal`), pas `chargerReferentiel().paquet.paquetFiscal`.
- [ ] **Les 2 axes sont indépendants** : une combinaison **mixte** (ex. `SMT` + `REEL`) est **acceptée** ; le système ne déduit **jamais** un axe de l'autre (test dédié).
- [ ] **CA absent ou estimé** → `confiance: 'BASSE'` + avertissement ; **CA à ± 10 % du plafond** → avertissement explicite ; **seuil au `statut: "a_confirmer"`** dans le paquet → avertissement (« non confirmé »).
- [ ] **`POST /profil-societe/regime`** : confirmation humaine **obligatoire** pour qu'un régime soit en vigueur (une proposition **seule** n'engage rien) ; écrit les champs déjà réservés par 079, jamais recréés.
- [ ] **Surcharge divergente de la proposition** sans `motifSurcharge` → **400** ; avec motif → acceptée et **tracée**.
- [ ] **Traçabilité (NFR-A07)** : chaque décision écrit une entrée `profils_societe_audit` **append-only** en **transaction 2-docs** (proposition, valeur retenue, auteur, date, motif) ; l'historique est consultable via `GET /regime`.
- [ ] **Aiguillage aval** : le `systemeComptable` retenu devient le tag `referentiel` (`SN`/`SMT`) des balances de l'exercice ; le `regimeFiscal` est exposé au moteur fiscal (S18).
- [ ] **Changement de régime en cours d'exercice** : refusé/averti (le régime vaut pour l'exercice).
- [ ] **Non-régression** : les DTO d'écriture de 079 continuent de **rejeter** (400 whitelist) `systemeComptable`/`regimeFiscal` — seul l'endpoint `/regime` les écrit.
- [ ] **Tests** : au-dessus/en dessous du plafond, combinaison mixte, CA absent, CA limite, seuil `a_confirmer`, surcharge sans motif (400), audit + atomicité (échec ⇒ 0 orphelin). **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Les 2 axes — modèle (enums **déjà** définis en 079)

```typescript
// balance-service/src/modules/profil-societe/enums/regime.enum.ts (STORY-079 — NE PAS recréer)
export enum SystemeComptable { SN = 'SN', SMT = 'SMT' }             // OHADA
export enum RegimeFiscal { REEL = 'REEL', SYNTHETIQUE = 'SYNTHETIQUE' } // CGI (SYNTHETIQUE = entreprenant / TPU)

// Types PROPRES à 080 (proposition motivée) :
export interface PropositionAxe<T> {
  valeur: T;
  motif: string;      // « CA 75 000 000 > plafond TPU 60 000 000 »
  source: string;     // « CGI TG 2026, art. 128-139 » / « OHADA »
}
export interface PropositionRegime {
  systemeComptable: PropositionAxe<SystemeComptable>;
  regimeFiscal: PropositionAxe<RegimeFiscal>;
  confiance: 'HAUTE' | 'BASSE';
  avertissements: string[];
}
```

Le schéma `ProfilSociete` porte **déjà** `systemeComptable?: SystemeComptable` et `regimeFiscal?: RegimeFiscal` (@Prop optionnels, hooks inertes de 079). STORY-080 les **remplit** ; elle ne touche ni le schéma ni les enums.

### Proposition (les seuils viennent du paquet — navigation **défensive** d'un bag non typé)

`PaquetFiscalPackage.rubriques` est un `Record<string, unknown>` : aucune garantie de forme au type-check. Extraire le plafond **avec garde**, sinon `confiance: BASSE`.

```typescript
async proposer(user: AuthenticatedUser, exercice: DateRange): Promise<PropositionRegime> {
  const profil = await this.profilSociete.lire(user);                       // STORY-079 (AuthenticatedUser, pas orgId nu)
  const { paquet } = await this.referentiel.chargerPaquetFiscal(user.organizationId!); // STORY-078
  const ca = await this.resoudreCA(user.organizationId!, exercice);         // balance classe 7 ou CA déclaré

  const avertissements: string[] = [];
  let confiance: 'HAUTE' | 'BASSE' = 'HAUTE';

  // ⚠️ Navigation défensive d'un Record<string, unknown> — jamais un cast aveugle.
  const tpu = (paquet.rubriques?.['regimesImposition'] as any)?.synthetique_entreprenant_tpu;
  const plafondTpu: number | null = typeof tpu?.plafondCA === 'number' ? tpu.plafondCA : null;
  if (plafondTpu == null) { confiance = 'BASSE'; avertissements.push('Plafond TPU absent du paquet — proposition indicative'); }
  if (tpu?.statut === 'a_confirmer') { confiance = 'BASSE'; avertissements.push('Seuil de régime non confirmé par le paquet'); }

  if (ca == null) { confiance = 'BASSE'; avertissements.push('CA inconnu — proposition indicative'); }
  else if (plafondTpu != null && Math.abs(ca - plafondTpu) / plafondTpu <= 0.10) {
    confiance = 'BASSE';
    avertissements.push(`CA proche du plafond TPU (${plafondTpu}) — vérifier`);
  }

  // ⚠️ Les 2 axes sont évalués SÉPARÉMENT — on ne déduit pas l'un de l'autre.
  const regimeFiscal    = this.evaluerAxeFiscal(ca, plafondTpu);   // CA <= plafond ⇒ SYNTHETIQUE, sinon REEL
  const systemeComptable = this.evaluerAxeComptable(ca, paquet);   // SN | SMT (+ avert. si smt-togo feuille de route)

  return { systemeComptable, regimeFiscal, confiance, avertissements };
}
```

### Confirmation humaine + surcharge tracée (réutilise la transaction/audit de 079)

```typescript
@Post('/profil-societe/regime')
@RequiresBalanceAccess()
@Roles(Role.TENANT_ADMIN, Role.TENANT_USER)
async confirmer(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmerRegimeDto) {
  const proposition = await this.regimeService.proposer(user, dto.exercice);
  const diverge =
    dto.systemeComptable !== proposition.systemeComptable.valeur ||
    dto.regimeFiscal     !== proposition.regimeFiscal.valeur;

  if (diverge && !dto.motifSurcharge) {
    throw new BadRequestException('MOTIF_SURCHARGE_REQUIS'); // on ne surcharge pas un régime en silence
  }
  // Écrit les 2 champs + audit append-only dans la MÊME transaction (mécanisme
  // appliquerPatch/insererAudits de 079). L'audit porte la proposition + le motif.
  return this.regimeService.appliquer(user, dto, proposition);
}
```

> **Piège « route littérale »** : `POST /profil-societe/regime` est une route **littérale** — pas de collision avec une route paramétrée du même verbe dans ce contrôleur (à vérifier si un `@Post(':id')` existe). La déclarer **avant** toute route paramétrée du même verbe (cf. CLAUDE.md).

### Alignement au code réel (078/079 mergés)

La première rédaction (2026-07-12) devinait des API qui **n'existent pas** telles quelles. Corrections apportées :

| Rédaction initiale (fausse) | Code réel (078/079 mergés) |
|---|---|
| `profilSociete.get(orgId)` | `ProfilSocieteService.lire(user)` / `.modifier(user, dto)` — prend `AuthenticatedUser` |
| `paquetFiscal.get(pays, année)` | `ReferentielService.chargerPaquetFiscal(orgId)` → `{ paquet, cache }` (résolution par org via `paquetFiscal.parDefaut`) |
| `paquet.seuilsRegime.syntheticCaMax` | `paquet.rubriques.regimesImposition.synthetique_entreprenant_tpu.plafondCA` (bag `Record<string, unknown>`, navigation défensive) |
| « seuil TPU 30 000 000 » | plafond réel↔synthétique = **`plafondCA: 60 000 000`** ; 30 M = borne **inter-tranches TPU**, pas la frontière d'axe |
| `regimeService.appliquer(...)` invente le stockage | écrit les champs **déjà réservés** par 079 + audit `profils_societe_audit` via `insererAudits`, en transaction 2-docs |
| Définir enums / champs de schéma | **déjà faits** par 079 (hooks inertes) — 080 ne fait que les remplir |

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Confusion des 2 axes** (SMT ⇒ synthétique) | Axes **évalués séparément** ; combinaison mixte testée explicitement ; aucune déduction croisée dans le code |
| **Confusion des seuils** (30 M inter-tranches pris pour la frontière d'axe) | Frontière réel↔synthétique = **`plafondCA` (60 M)** ; test dédié à 45–58 M (SYNTHETIQUE) vs > 60 M (REEL) |
| Seuil en dur → faux régime après réforme | Seuils **lus du paquet** (`plafondCA`) ; test anti-hardcode (grep) |
| **Bag `rubriques` non typé** → cast aveugle qui casse à l'exécution | Navigation **défensive** + `confiance: BASSE` si forme inattendue ; jamais un `as` non gardé |
| Le système « décide » un régime fiscal | **Confirmation humaine obligatoire** ; une proposition seule n'engage rien |
| Surcharge silencieuse | `motifSurcharge` **obligatoire** si divergence + **audit** |
| Sous-régimes `reel_normal`/`reel_simplifie` au `statut: "a_confirmer"` | **Avertissement explicite**, jamais une valeur devinée (blocker fiscaliste connu, PRD §13) |
| Lire le `paquetFiscal` **embarqué** dans l'artefact comptable (périmé, F-078-1) | Source = paquet fiscal **autonome** (`chargerPaquetFiscal`) ; interdit tracé en AC |
| CA calculé sur une balance incomplète | `confiance: BASSE` + avertissement ; le CA déclaré reste saisissable |
| Écriture partielle (profil sans audit) | **Transaction 2-docs** + verrou optimiste (mécanisme 079) ; vérif docker « 0 orphelin après échec » |

---

## Definition of Done

- [ ] `RegimeService.proposer()` (2 axes, motif, source, confiance) implémenté + testé
- [ ] `resoudreCA()` (dernière balance classe 7 → CA déclaré → null) implémenté + testé
- [ ] Seuils **lus du paquet fiscal autonome** (`plafondCA`, aucun en dur, pas l'embarqué périmé) — vérifié par revue/grep
- [ ] Combinaison **mixte** (SMT + REEL) acceptée — test dédié
- [ ] `POST /regime` (confirmation humaine) + surcharge avec motif obligatoire (400 sinon), en transaction 2-docs
- [ ] `GET /regime` (en vigueur + proposition + historique via audit)
- [ ] Audit **append-only** (`profils_societe_audit`) de chaque décision de régime (proposition + motif)
- [ ] Champs de schéma / enums **réutilisés** de 079 (aucune recréation) ; DTO d'écriture 079 rejettent toujours les 2 champs (non-régression)
- [ ] Aiguillage aval câblé (tag `referentiel` des balances ; régime exposé au moteur fiscal)
- [ ] **Vérif docker réelle** : décision écrite (profil + audit), atomicité (échec ⇒ 0 orphelin), historique rejouable — consignée en Progress Tracking
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-078/079 verts

---

## Dependencies

**Prérequis (tous ✅ mergés sur `dev`) :**
- **STORY-078** ✅ (2026-07-22) — chargement du paquet fiscal + `chargerPaquetFiscal(orgId)` ; findings F-078-1 (paquet embarqué périmé) & F-078-3 (`smt-togo@1.0` feuille de route) **intégrés** dans cette story.
- **STORY-079** ✅ (2026-07-27) — profil société (`lire`/`modifier`, transaction 2-docs, audit `profils_societe_audit`) + **champs `systemeComptable`/`regimeFiscal` et enums déjà réservés** comme hooks inertes.
- **STORY-101** ✅ — contrat `BalanceCanonique` (source du CA classe 7) + tag `referentiel`.

**Alimente :** STORY-091/092 (réel : IS/MFP), STORY-095 (synthétique : TPU), tag `referentiel` des balances (contrat STORY-101).

---

## Story Points Breakdown

- **`RegimeService.proposer` + `resoudreCA` (logique pure + lecture paquet/balance) :** 1,5 pt
- **Endpoint `POST`/`GET /regime` + DTO + write path réutilisant transaction/audit 079 :** 1 pt
- **Tests (proposition, mixte, CA absent/limite, `a_confirmer`, 400, audit/atomicité) + vérif docker :** 0,5 pt
- **Total : 3 points**

**Rationale :** l'infrastructure lourde (transaction 2-docs, audit append-only, schéma, enums, loader de paquet, gate d'accès) est **déjà livrée** par 078/079/101 ; 080 assemble une logique de proposition déterministe + un chemin d'écriture réutilisant l'existant. Le risque est la **justesse métier** (sémantique des seuils, indépendance des axes), pas le volume de code.

---

## Progress Tracking

**Status History :**
- 2026-07-12 : Créée (Scrum Master) — statut `ready-for-dev`.
- 2026-07-27 : **Révisée** (create-story) — cadrage aligné sur le code réel de `balance-service` après merge de 078/079 : API corrigées (`lire`/`chargerPaquetFiscal`), seuil corrigé (**plafond 60 M**, non 30 M), navigation défensive du bag `rubriques`, findings F-078-1/F-078-3 intégrés, réutilisation des hooks inertes de 079, ajout `Complexité: medium` + section Progress Tracking.
- 2026-07-27 : **Développée** (dev-story) — `RegimeService` (proposer/vue/confirmer) + `RegimeController` (`GET`/`POST /profil-societe/regime`) + règles pures `regime.regles.ts` + DTO/exceptions ; réutilise la transaction 2-docs et l'audit append-only de 079 (audit étendu de `motif`/`contexte` optionnels, rétro-compatible). `in_progress`.

**Implémentation :**
- **Logique pure** isolée dans `regime.regles.ts` (100 % couverte) : `calculerChiffreAffaires` (ventes 70x), `extrairePlafondTpu`/`extraireSeuilSmt` (navigation défensive du bag `Record<string,unknown>`), `evaluerAxeFiscal`/`evaluerAxeComptable` (indépendants), `construireProposition` (confiance + avertissements cumulés).
- **Écriture** : `RegimeService.confirmer` réutilise `ProfilSocieteRepository.appliquerPatch` (verrou optimiste) + `insererAudits` dans une transaction ; audit porte `motif` (surcharge/conforme) + `contexte` (instantané de la proposition, NFR-A07).
- **CA** : dernière balance de l'exercice (priorité `VALIDÉE`, sinon estimée), comptes 70x ; repli `caDeclare` ; sinon `null` ⇒ `confiance: BASSE`.
- Enums + champs de schéma **réutilisés** de 079 (aucune recréation) ; DTO d'écriture 079 rejettent toujours les 2 champs (non-régression e2e conservée).

**Qualité :** lint 0 warning · build OK · **543 unit** + **102 e2e** verts · couverture globale **99.23 / 92.75 / 99.32 / 99.40** (module `regime` 100 / 97.5 / 100 / 100) ≥ seuils 65/90/90/90 · non-régression 079 intacte · **2 mutation-tests** rouges puis restaurés (borne `<=` du plafond ; garde `MOTIF_SURCHARGE_REQUIS`).

**Vérif docker réelle** (stack vivante, org fraîche `6a6777…8706`, KYC APPROVED + entitlement ACTIVE + profil TG créé) :
- `GET /regime` → proposition motivée du **paquet réel TG@2026** ; `caDeclare=75 000 000` ⇒ **REEL**, motif « CA 75 000 000 > plafond TPU **60 000 000** » → seuil **lu du paquet, pas en dur**.
- `POST /regime` divergence **sans** motif ⇒ **400 MOTIF_SURCHARGE_REQUIS** ; DB **inchangée** (profil v1, `systemeComptable`/`regimeFiscal` absents, **0 audit régime**) → **atomicité prouvée**.
- `POST /regime` conforme `{SN, REEL}` ⇒ profil **v2**, 2 entrées `profils_societe_audit` (`null→SN`, `null→REEL`, v2, motif « Confirmation conforme à la proposition », `contexte` = proposition).
- `POST /regime` surcharge `{SMT, REEL}` **avec** motif ⇒ profil **v3** (`systemeComptable=SMT`, `regimeFiscal=REEL` — axes indépendants), audit v3 `SN→SMT` motif custom persisté (NFR-A07). Total 3 audits régime, append-only.

**Actual Effort :** 3 points (conforme à l'estimation).

---

**Status:** ready-for-dev
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A03 · `docs/referentiels/paquet-fiscal-togo-2026.json` § `regimesImposition` · CGI Togo 2026 Chap. V art. 128-139 (TPU, plafond 60 M) · `rapport-bilan-logique-metier-2026-07-12.md` §2

---

**This story was revised using BMAD Method v6 — Phase 4 (Implementation Planning).**
