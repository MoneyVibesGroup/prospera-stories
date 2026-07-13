# STORY-080 : Détermination des 2 axes (système comptable SN/SMT + régime fiscal) proposée selon pays + objet + CA

**Epic :** EPIC-018 — Profil société & régime
**Réf. architecture :** `prd-atelier-balance-2026-07-12.md` § FR-A03 · `rapport-bilan-logique-metier-2026-07-12.md` §2 (correction : SN/SMT et réel/TPU sont **orthogonaux**) · `referentiels/paquet-fiscal-togo-2026.json` (seuils de régime) · CGI Togo 2026, Chap. V (régime de l'entreprenant / **TPU**)
**Priorité :** Must Have
**Story Points :** 3
**Statut :** ready-for-dev
**Assigné à :** null
**Créée le :** 2026-07-12
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

| Axe | Valeurs | Conditionne |
|---|---|---|
| **Comptable (OHADA)** | `SN` / `SMT` | Plan de comptes (STORY-078), gabarit de liasse (`bilan-service`), niveau de détail exigé |
| **Fiscal (CGI national)** | `REEL` / `SYNTHETIQUE` (TPU) | Mode de calcul : **IS = max(MFP, IS)** + 4 acomptes (STORY-092) **vs** **TPU forfaitaire** (STORY-095) |

**Ils sont indépendants** : une entreprise peut être au **réel** tout en tenant une comptabilité **SMT** (petite structure au réel), ou être au **synthétique** avec une compta **SN** (choix volontaire de rigueur). Le système **propose la combinaison la plus probable** et **autorise chaque axe à être réglé séparément**.

Les **seuils** ne sont **pas** en dur : ils viennent du **paquet fiscal `(pays, année)`** (STORY-078). Pour le **Togo 2026**, le CGI (Chap. V, art. 128-135) fixe le régime de l'**entreprenant / TPU** sous un seuil de CA (**~30 M FCFA** — valeur exacte à confirmer dans le paquet, cf. question ouverte).

> **Le système propose, l'humain dispose.** Un régime fiscal a des conséquences légales. La proposition est **motivée** (quel seuil, quelle source) et **toujours modifiable** ; la décision est **tracée** (qui, quand, sur quelle base) — NFR-A07.

### Périmètre

**Inclus :**

- **`RegimeService.proposer(orgId, exercice)`** :
  - Entrées : `pays` + `objetSocial`/`codeNaema` (du **profil société**, STORY-079) + **CA de l'exercice** (de la balance si elle existe — comptes classe 7 — sinon **CA déclaré** saisi par le cabinet).
  - Lit les **seuils** depuis le **paquet fiscal** `(pays, année)` (STORY-078) : `seuilsRegime.syntheticCaMax`, seuils OHADA SN/SMT.
  - Retourne une **proposition motivée** :
    ```json
    {
      "systemeComptable": { "valeur": "SN", "motif": "CA 45 000 000 XOF > seuil SMT (…)", "source": "OHADA / paquet TG@2026" },
      "regimeFiscal":     { "valeur": "REEL", "motif": "CA 45 000 000 XOF > seuil TPU 30 000 000", "source": "CGI TG 2026, art. 128-135" },
      "confiance": "HAUTE",
      "avertissements": []
    }
    ```
  - **Cas d'incertitude** : CA absent/estimé, activité hors nomenclature, CA proche du seuil (± 10 %) → `confiance: 'BASSE'` + avertissement explicite (« CA proche du seuil — vérifier »).
- **`POST /api/v1/profil-societe/regime`** (`@RequiresBalanceAccess`) — **confirmation humaine** :
  - Body : `{ systemeComptable: 'SN'|'SMT', regimeFiscal: 'REEL'|'SYNTHETIQUE', motifSurcharge? }`.
  - **Les deux axes sont réglables indépendamment** (aucune déduction automatique de l'un vers l'autre).
  - Si la valeur retenue **diverge** de la proposition → `motifSurcharge` **obligatoire** (tracé).
  - Écrit `systemeComptable` / `regimeFiscal` sur le `ProfilSociete` (STORY-079) + **entrée d'audit** (proposition, décision, auteur, date, motif).
- **`GET /api/v1/profil-societe/regime`** → régime en vigueur + proposition courante + historique des changements.
- **Effets aval (câblage, pas calcul)** : le `systemeComptable` retenu devient le **tag `referentiel`** (`SN`/`SMT`) des balances de l'exercice (contrat STORY-101) ; le `regimeFiscal` **aiguille** le moteur fiscal (S18 : `REEL` → STORY-091/092 ; `SYNTHETIQUE` → STORY-095).
- **Tests** : proposition SN/REEL au-dessus du seuil ; SMT/SYNTHETIQUE en dessous ; **combinaison mixte** (SMT + REEL) acceptée ; CA absent → `confiance: BASSE` ; CA proche du seuil → avertissement ; surcharge sans motif → **400** ; changement de régime **tracé**.

**Hors périmètre :**

- **Calcul de l'impôt** (IS, MFP, TPU) → **STORY-091→095** (S18). Ici on ne fait qu'**aiguiller**.
- **Chargement des seuils** → **STORY-078** (on les **consomme**).
- **Changement de régime en cours d'exercice** (bascule réel ↔ synthétique en N) : hors v1 → le régime vaut **pour l'exercice** ; un changement s'applique à l'exercice suivant (avertissement si tentative).
- **Complétion des tranches TPU** → dépend du paquet fiscal (question ouverte PRD §13) ; STORY-095.

### Flux

1. Le cabinet a saisi le **profil société** (STORY-079) : `pays = TG`, `objetSocial = commerce de détail`.
2. Il demande une proposition : `GET /api/v1/profil-societe/regime`.
3. `RegimeService` lit le **CA** (balance de l'exercice, comptes 7 — ou CA déclaré si aucune balance encore) : **45 000 000 XOF**.
4. Il charge les **seuils** du paquet **`TG@2026`** (STORY-078) : seuil TPU **30 000 000**.
5. Proposition : **SN** (comptable) + **REEL** (fiscal), `confiance: HAUTE`, motifs cités.
6. Le cabinet **confirme** : `POST /regime` → écrit sur le profil + **audit**.
7. *(Variante)* Le cabinet estime que la compta doit rester **SMT** malgré le réel → il règle **l'axe comptable seul** (`SMT` + `REEL`) avec un **motif de surcharge** → accepté et **tracé**.
8. Les balances de l'exercice porteront `referentiel = SMT` ; le moteur fiscal (S18) appliquera le **réel** (IS/MFP).

---

## Acceptance Criteria

- [ ] **`RegimeService.proposer()`** retourne une proposition **par axe** (`systemeComptable`, `regimeFiscal`), chacune avec **`valeur`, `motif`, `source`**, plus un niveau de **`confiance`**.
- [ ] Les **seuils sont lus du paquet fiscal** `(pays, année)` (STORY-078) — **aucun seuil en dur** dans le code (NFR-A06).
- [ ] **Les 2 axes sont indépendants** : une combinaison **mixte** (ex. `SMT` + `REEL`) est **acceptée** ; le système ne déduit **jamais** un axe de l'autre (test dédié).
- [ ] **CA absent ou estimé** → `confiance: 'BASSE'` + avertissement ; **CA à ± 10 % du seuil** → avertissement explicite (« proche du seuil »).
- [ ] **`POST /profil-societe/regime`** : confirmation humaine **obligatoire** pour qu'un régime soit en vigueur (une proposition **seule** n'engage rien).
- [ ] **Surcharge divergente de la proposition** sans `motifSurcharge` → **400** ; avec motif → acceptée et **tracée**.
- [ ] **Traçabilité (NFR-A07)** : chaque décision de régime écrit un audit (proposition, valeur retenue, auteur, date, motif) ; l'historique est consultable.
- [ ] **Aiguillage aval** : le `systemeComptable` retenu devient le tag `referentiel` (`SN`/`SMT`) des balances de l'exercice ; le `regimeFiscal` est exposé au moteur fiscal (S18).
- [ ] **Changement de régime en cours d'exercice** : refusé/averti (le régime vaut pour l'exercice).
- [ ] **Tests** : proposition au-dessus/en dessous du seuil, combinaison mixte, CA absent, CA limite, surcharge sans motif (400), audit. **Coverage ≥ 90 %.**
- [ ] **Swagger** + **CI verte**.

---

## Technical Notes

### Les 2 axes — modèle

```typescript
export type SystemeComptable = 'SN' | 'SMT';        // OHADA
export type RegimeFiscal    = 'REEL' | 'SYNTHETIQUE'; // CGI national (SYNTHETIQUE = entreprenant / TPU)

export interface PropositionAxe<T> {
  valeur: T;
  motif: string;      // « CA 45 000 000 > seuil TPU 30 000 000 »
  source: string;     // « CGI TG 2026, art. 128-135 » / « OHADA »
}

export interface PropositionRegime {
  systemeComptable: PropositionAxe<SystemeComptable>;
  regimeFiscal: PropositionAxe<RegimeFiscal>;
  confiance: 'HAUTE' | 'BASSE';
  avertissements: string[];
}
```

### Proposition (les seuils viennent du paquet — jamais en dur)

```typescript
async proposer(orgId: string, exercice: DateRange): Promise<PropositionRegime> {
  const profil = await this.profilSociete.get(orgId);              // STORY-079
  const paquet = await this.paquetFiscal.get(profil.pays, exercice.fin.getFullYear()); // STORY-078
  const ca     = await this.resoudreCA(orgId, exercice);           // balance (classe 7) ou CA déclaré

  const avertissements: string[] = [];
  let confiance: 'HAUTE' | 'BASSE' = 'HAUTE';

  if (ca == null)      { confiance = 'BASSE'; avertissements.push('CA inconnu — proposition indicative'); }
  const seuilTpu = paquet.seuilsRegime.syntheticCaMax;
  if (ca != null && Math.abs(ca - seuilTpu) / seuilTpu <= 0.10) {
    confiance = 'BASSE';
    avertissements.push(`CA proche du seuil TPU (${seuilTpu}) — vérifier`);
  }

  // ⚠️ Les 2 axes sont évalués SÉPARÉMENT — on ne déduit pas l'un de l'autre.
  const regimeFiscal    = this.evaluerAxeFiscal(ca, paquet);       // REEL | SYNTHETIQUE
  const systemeComptable = this.evaluerAxeComptable(ca, paquet);   // SN | SMT

  return { systemeComptable, regimeFiscal, confiance, avertissements };
}
```

### Confirmation humaine + surcharge tracée

```typescript
@Post('/profil-societe/regime')
@RequiresBalanceAccess()
async confirmer(@TenantContext() orgId: string, @Body() dto: ConfirmerRegimeDto, @CurrentUser() user) {
  const proposition = await this.regimeService.proposer(orgId, dto.exercice);
  const diverge =
    dto.systemeComptable !== proposition.systemeComptable.valeur ||
    dto.regimeFiscal     !== proposition.regimeFiscal.valeur;

  if (diverge && !dto.motifSurcharge) {
    throw new BadRequestException('MOTIF_SURCHARGE_REQUIS'); // on ne surcharge pas un régime en silence
  }
  return this.regimeService.appliquer(orgId, dto, proposition, user); // + audit append-only
}
```

---

## Risques & Mitigation

| Risque | Mitigation |
|---|---|
| **Confusion des 2 axes** (SMT ⇒ synthétique) | Axes **évalués séparément** ; combinaison mixte testée explicitement ; aucune déduction croisée dans le code |
| Seuil en dur → faux régime après réforme | Seuils **lus du paquet `(pays, année)`** (NFR-A06) ; test anti-hardcode |
| Le système « décide » un régime fiscal | **Confirmation humaine obligatoire** ; une proposition seule n'engage rien |
| Surcharge silencieuse | `motifSurcharge` **obligatoire** si divergence + **audit** |
| Seuil TPU exact non confirmé (paquet incomplet) | **Question ouverte connue** (PRD §13) : le seuil vient du paquet ; si absent → `confiance: BASSE` + avertissement, jamais une valeur devinée |
| CA calculé sur une balance incomplète | `confiance: BASSE` + avertissement ; le CA déclaré reste saisissable |

---

## Definition of Done

- [ ] `RegimeService.proposer()` (2 axes, motif, source, confiance) implémenté + testé
- [ ] Seuils **lus du paquet fiscal** (aucun en dur) — vérifié par revue/grep
- [ ] Combinaison **mixte** (SMT + REEL) acceptée — test dédié
- [ ] `POST /regime` (confirmation humaine) + surcharge avec motif obligatoire (400 sinon)
- [ ] `GET /regime` (en vigueur + proposition + historique)
- [ ] Audit append-only de chaque décision de régime
- [ ] Aiguillage aval câblé (tag `referentiel` des balances ; régime exposé au moteur fiscal)
- [ ] Coverage ≥ 90 % ; Swagger ; CI verte
- [ ] Non-régression : STORY-078/079 verts

---

**Status:** ready-for-dev
**Dependencies:** STORY-078 (seuils du paquet fiscal), STORY-079 (profil société : pays, objet, CA) · **alimente** STORY-091/092 (réel : IS/MFP), STORY-095 (synthétique : TPU), tag `referentiel` du contrat STORY-101
**Reference:** `prd-atelier-balance-2026-07-12.md` § FR-A03 · CGI Togo 2026 Chap. V (TPU) · `rapport-bilan-logique-metier-2026-07-12.md` §2
