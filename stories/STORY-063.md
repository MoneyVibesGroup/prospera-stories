# STORY-063 : Contrôles de cohérence de la liasse — batterie d'articulation Bilan ↔ CR ↔ TFT ↔ notes (liste d'anomalies + drapeau de validabilité) — FR-013

**Epic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-013 (Contrôles de cohérence : **batterie de contrôles d'articulation entre états, restituée comme liste d'anomalies avant validation** ; articulation Bilan ↔ CR ↔ TFT ; anomalies listées avec le poste/compte concerné ; **validation possible seulement si les contrôles bloquants passent**)
**Réf. logique métier :** `docs/rapport-bilan-logique-metier-2026-07-12.md` (identités d'articulation de la liasse : actif = passif + résultat ; résultat CR = résultat reporté au passif ; variation de trésorerie TFT = variation de trésorerie Bilan)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de structure OHADA codée en dur) ; §« tech-spec Bilan **B8** à rédiger » ; CLAUDE.md §Definition of Done, §Anti-énumération, §« ne devine jamais une API »
**Réf. code livré :** STORY-059 (`BilanProduit.controle: ControleEquilibre` — actif=passif + résultat au passif, FR-009 AC-2) · STORY-060 (`CoherenceResultat` — résultat CR = résultat reporté au passif du Bilan, FR-010 AC-2, calculée au niveau engine) · STORY-061 (`TftProduit.controleTresorerie: ControleTresorerie` — variation TFT = variation Bilan, FR-011 AC-2 ; statuts `CALCULE`/`INDETERMINABLE`/`NON_APPLICABLE`) · STORY-062 (`NotesAnnexesProduit` — totaux de note repris des états) · STORY-055/056/057/058 (mapping, référentiels packagés, surcharges) · STORY-037/054 (gate + garde ACTIVE) · STORY-101 (`BalanceCanonique` : unités mineures XOF, bornes safe-integer) · `MontantHorsBornesError`, `toEffectiveStamp`, `toHttpFromReferentielError`, `BilanDryRunRequestDto`
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done ✅ (implémentée + vérifiée docker réelle + intégrée dans `dev` le 2026-07-19 — PR #14 bilan-service, MNV-063 rebase-merge ; **clôt EPIC-011**)
**Assigné à :** vivian
**Créée :** 2026-07-19
**Sprint :** 12

---

## User Story

**En tant que** gestionnaire comptable d'une organisation (cabinet / entreprise),
**je veux** obtenir une **batterie de contrôles de cohérence** de ma liasse — l'**articulation** Bilan ↔ CR ↔ TFT ↔ notes vérifiée et restituée comme **liste d'anomalies** avec le **poste concerné** et un **drapeau de validabilité** (la liasse est-elle validable ?),
**afin de** savoir, **avant validation**, si mes états s'articulent correctement (actif = passif ; résultat ; variation de trésorerie) et de **ne pas pouvoir valider** tant qu'un contrôle **bloquant** échoue.

---

## Description

### Contexte & cadrage (⚠️ lire AVANT de coder)

STORY-063 est la **5ᵉ et dernière story d'EPIC-011**. Elle **consomme** l'acquis des quatre précédentes et **ne calcule presque rien de neuf** : chaque état produit **porte déjà son propre contrôle d'articulation, calculé par construction** sur les mêmes soldes et le même moteur. 063 **consolide** ces contrôles en une **batterie unique**, les **classe** (bloquant / non bloquant), en **liste les anomalies** et en **déduit un drapeau `valide`** (la liasse est-elle validable ?). C'est **exactement** ce que cadre FR-013 (« batterie de contrôles d'articulation … restituée comme liste d'anomalies avant validation »).

1. **bilan-service n'a PAS de balance** (EPIC-009 `superseded`) ⇒ les contrôles s'exécutent **à partir de soldes fournis** via un **endpoint diagnostic `dry-run` gardé**, jumeau de `bilan/dry-run` (059), `compte-resultat/dry-run` (060), `tft/dry-run` (061), `notes-annexes/dry-run` (062). Corps `BilanDryRunRequestDto` **réutilisé**.
2. **⚠️ Invariant P7 — rien à décider ni à coder en dur.** Les trois contrôles d'articulation **existent déjà** et sont **référentiel-agnostiques** : `BilanProduit.controle` (059), `CoherenceResultat` (060), `TftProduit.controleTresorerie` (061). 063 **ne touche aucun référentiel** et **n'introduit aucune convention comptable** : il **lit** des contrôles déjà agnostiques et les **agrège**.

### Ce que 063 livre — la batterie d'articulation, classée et gatée

Une **liste ordonnée de contrôles d'articulation**, chacun avec un `code` figé, un `libelle`, une **catégorie** (bloquant / informatif), un **statut**, l'**écart** et les **éléments concernés** (postes/totaux mis en cause), plus un **drapeau global de validabilité** :

| Code | Articulation vérifiée | Source (déjà calculée) | Catégorie | Statut possible |
|---|---|---|---|---|
| `EQUILIBRE_BILAN` | **actif = passif + résultat** (FR-009 AC-2) | `BilanProduit.controle.equilibreN` / `ecartN` | **BLOQUANT** | `OK` \| `ANOMALIE` |
| `COHERENCE_RESULTAT` | **résultat net CR = résultat reporté au passif** (FR-010 AC-2) | `CoherenceResultat` (060) | **BLOQUANT** | `OK` \| `ANOMALIE` |
| `VARIATION_TRESORERIE` | **variation TFT = variation Bilan** (FR-011 AC-2) | `TftProduit.controleTresorerie` (061) | Informatif | `OK` \| `ANOMALIE` \| `INDETERMINABLE` \| `NON_APPLICABLE` |
| `ARTICULATION_NOTES` | **Σ postes contributeurs = total de chaque note** (062) | `NotesAnnexesProduit` (062) | Informatif | `OK` \| `ANOMALIE` \| `NON_APPLICABLE` |

- **Statut d'un contrôle** : `OK` (écart nul), `ANOMALIE` (écart non nul → anomalie listée avec les éléments concernés), `INDETERMINABLE` (contrôle non vérifiable, ex. variation de trésorerie sans N-1 — repris de `ControleTresorerie`), `NON_APPLICABLE` (le référentiel ne porte pas la structure requise, ex. SFD-BCEAO sans TFT → aucune anomalie).
- **`EQUILIBRE_BILAN` est le seul contrôle qui peut réellement échouer** sur une balance déséquilibrée (prouvé en 059 : « VRAI déséquilibre → ecart 100000 »). Les autres sont **cohérents par construction** (même agrégation, mêmes soldes, même moteur) ⇒ `ecart = 0` — mais **exposés et vérifiés** par la batterie (filet contre une régression future du moteur, et **réels** dès qu'une balance externe / des soldes indépendants seront branchés en EPIC-009).
- **Drapeau global `valide`** (FR-013 AC-2 + prépare FR-014) : `valide = true` **⟺ tous les contrôles `BLOQUANT` sont `OK`**. Un contrôle informatif en `ANOMALIE`/`INDETERMINABLE` **n'empêche pas** la validabilité (il est **listé** mais non bloquant). 063 **produit** ce drapeau ; le **gate de validation** qui l'**applique** (passage brouillon→validé) est **STORY-064** (EPIC-012) — hook.
- **Anomalies avec le poste/compte concerné** (FR-013 AC-2) : chaque contrôle en `ANOMALIE` expose ses **`elements`** — les **totaux/postes d'états** mis en cause (ex. `EQUILIBRE_BILAN` → `totalActifN`, `totalPassifN`, `resultatNetN`, `ecartN`). Le **traçage jusqu'au compte fautif** individuel (quel compte casse l'équilibre) **n'est pas dérivable** des seuls totaux d'états → **hook B8** (pas d'invention).

### Colonnes N/N-1

Les contrôles portent sur l'exercice **N** ; l'**équilibre N-1** est exposé quand N-1 est fourni (`equilibreN1` déjà dans `ControleEquilibre`). La **variation de trésorerie** est par nature N vs N-1 → `INDETERMINABLE` sans N-1 (repris tel quel de `ControleTresorerie`).

### Unités & bornes

Aucune nouvelle sommation « métier » : les écarts sont des **différences** entre montants déjà bornés (unités mineures XOF entières). Le service **propage** `MontantHorsBornesError` levée en amont par la production des états → 400 (précédent 059/060/061/062).

---

## Scope

**Dans le périmètre :**

- **`ControlesCoherenceProductionService` (pur, aucune I/O)** — consomme le `BilanProduit` (059), la `CoherenceResultat` (060), le `TftProduit` (061) et le `NotesAnnexesProduit` (062) **déjà produits** sur les mêmes soldes, et émet la **batterie** :
  - `EQUILIBRE_BILAN` (bloquant) depuis `bilan.controle` : `OK` si `equilibreN`, sinon `ANOMALIE` avec `ecartN` + `elements` (totaux actif/passif/résultat) ;
  - `COHERENCE_RESULTAT` (bloquant) depuis `CoherenceResultat` : `OK` si `coherent`, sinon `ANOMALIE` avec `ecart` + `elements` (résultat CR / résultat Bilan) ;
  - `VARIATION_TRESORERIE` (informatif) depuis `controleTresorerie` : **reprise fidèle** de son `statut` (`CALCULE`→`OK`/`ANOMALIE` selon `coherent`, `INDETERMINABLE`, `NON_APPLICABLE`) + `elements` (variations TFT/Bilan) ;
  - `ARTICULATION_NOTES` (informatif) depuis `NotesAnnexesProduit` : pour chaque note, **re-vérifie** `Σ postes.montantN == totalN` (et N-1) → `OK`/`ANOMALIE` (note + postes concernés) ; `notes:[]` → `NON_APPLICABLE`.
  - **Drapeau `valide`** = tous les contrôles `BLOQUANT` en `OK`.
  - **100 % référentiel-agnostique** : SFD-BCEAO → `EQUILIBRE_BILAN`/`COHERENCE_RESULTAT` applicables (actif/passif + produits/charges), `VARIATION_TRESORERIE`/`ARTICULATION_NOTES` → `NON_APPLICABLE`. **Aucune structure OHADA en dur.**
- **`BilanEngineService.produireControlesCoherence(orgId, soldesN, soldesN1?)`** = résout référentiel + garde ACTIVE + surcharges VALIDATED → **produit Bilan (059) + CR (060) + `CoherenceResultat` + TFT (061) + notes (062)** sur les **mêmes** soldes → délègue au `ControlesCoherenceProductionService`. Renvoie `{ controles, checksum }`. Propage les erreurs de résolution/chargement ; `MontantHorsBornesError` → 400.
- **Endpoint diagnostic gardé** `POST /bilan/etats/controles/dry-run` (`@RequiresBilanAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)`), **200** : corps `BilanDryRunRequestDto` **réutilisé** ; `orgId` **du JWT** ; réponse `ControlesCoherenceDto` `{ referentiel, stamp, controles: ControleArticulationDto[], valide }`.
- **Non-régression** : `BilanProductionService` (059), `CompteResultatProductionService` (060), `TftProductionService` (061), `NotesAnnexesProductionService` (062), mapping/surcharges (055/058), endpoints existants **inchangés**. **Aucune modification de référentiel** (checksums 056/057 inchangés).
- **Provisoire** (comme les jumeaux) : harnais de preuve e2e + docker.
- Endpoint **documenté Swagger**.

**Hors périmètre (hooks inertes documentés — NE PAS déborder) :**

- **Gate de validation qui applique le drapeau** (bloquer le passage brouillon→validé si `valide=false`, enregistrer auteur + horodatage) → **STORY-064 / FR-014** (EPIC-012). 063 **produit** `valide` ; il ne persiste ni ne valide rien.
- **Traçage de l'anomalie jusqu'au compte fautif** (quel compte individuel casse l'équilibre / quel retraitement manque) → non dérivable des totaux d'états → **tech-spec B8**. 063 liste les **totaux/postes** concernés, pas les comptes.
- **Contrôles au-delà de l'articulation inter-états** — contrôles réglementaires DSF détaillés, seuils fiscaux, cohérences intra-note profondes (mouvements d'immobilisations, antériorité), retraitements TFT (FA..FQ/CAFG) → **tech-spec B8** (non dérivables / spécifiques référentiel, comme 061/062).
- **Consumer réel `balance.created`** (EPIC-009 interop), **persistance / snapshot / immutabilité** (EPIC-012), **export** (EPIC-014).

---

## User Flow

1. Le gestionnaire (org `bilan` `ACTIVE`, e-mail vérifié, KYC `APPROVED`) appelle `POST /bilan/etats/controles/dry-run` avec ses soldes (N + N-1 optionnel).
2. Le service **résout** le référentiel — gate + garde ACTIVE + surcharges VALIDATED.
3. Il **produit** Bilan (059), CR + `CoherenceResultat` (060), TFT (061) et notes (062) sur les **mêmes** soldes.
4. Il **exécute la batterie** : lit les contrôles portés par chaque état, les **classe** (bloquant/informatif), **liste les anomalies** (avec les éléments concernés) et **déduit `valide`**.
5. Il renvoie la **liste de contrôles + le drapeau `valide`** (+ tampon référentiel), **sans rien persister**. Pour une org **SFD**, `EQUILIBRE_BILAN`/`COHERENCE_RESULTAT` restent évalués ; `VARIATION_TRESORERIE`/`ARTICULATION_NOTES` → `NON_APPLICABLE`.

---

## Acceptance Criteria

- [ ] `POST /bilan/etats/controles/dry-run` renvoie **200** avec la **batterie de contrôles** (`controles[]`) et le **drapeau `valide`** pour un jeu de soldes valide (SYSCOHADA).
- [ ] **Articulation Bilan ↔ CR ↔ TFT vérifiée** (FR-013 AC-1) : la batterie contient au moins `EQUILIBRE_BILAN` (actif=passif + résultat), `COHERENCE_RESULTAT` (résultat CR = résultat au passif) et `VARIATION_TRESORERIE` (variation TFT = variation Bilan), chacun avec `statut` et `ecart`.
- [ ] **Anomalies listées avec le poste concerné** (FR-013 AC-2) : sur balance **déséquilibrée**, `EQUILIBRE_BILAN` = `ANOMALIE` avec `ecart` ≠ 0 et `elements` exposant les **totaux mis en cause** (`totalActifN`, `totalPassifN`, `resultatNetN`).
- [ ] **Drapeau de validabilité** (FR-013 AC-2) : `valide = true` **⟺** tous les contrôles `BLOQUANT` sont `OK` ; un contrôle **informatif** en `ANOMALIE`/`INDETERMINABLE` **n'affecte pas** `valide`. Balance équilibrée → `valide=true` ; balance déséquilibrée → `valide=false`.
- [ ] **Cohérents par construction exposés** : sur balance équilibrée, `COHERENCE_RESULTAT` et `ARTICULATION_NOTES` = `OK` (`ecart=0`) ; `VARIATION_TRESORERIE` = `OK` si N-1 fourni, `INDETERMINABLE` sinon.
- [ ] **Colonnes N/N-1** : équilibre N-1 exposé quand N-1 fourni ; variation de trésorerie `INDETERMINABLE` sans N-1.
- [ ] **Agnostique** : **SFD-BCEAO** → `EQUILIBRE_BILAN`/`COHERENCE_RESULTAT` évalués ; `VARIATION_TRESORERIE`/`ARTICULATION_NOTES` → `NON_APPLICABLE` (jamais bloquants) ; **aucune structure OHADA en dur**.
- [ ] **Unités mineures XOF** ; dépassement d'entier sûr en amont (production d'un état) → **400** (`MONTANT_HORS_BORNES`), propagé sans 500.
- [ ] Compte au format invalide / corps mal formé → **400** (jamais 500).
- [ ] Sans jeton → **401** ; gate refusé → **403** `{ code }` (`EMAIL_NOT_VERIFIED` | `KYC_NOT_APPROVED` | `BILAN_NOT_ENTITLED`). Référentiel non résolu/indisponible → 409/500/503 via `toHttpFromReferentielError`.
- [ ] **Non-régression** : `bilan/dry-run` (059), `compte-resultat/dry-run` (060), `tft/dry-run` (061), `notes-annexes/dry-run` (062) inchangés ; **aucune modification de référentiel** (checksums 056/057 inchangés).

---

## Technical Notes

### Composants

- **Nouveau** : `src/modules/bilan/etats/controles-coherence-production.service.ts` (**pur**) + `.spec.ts` ; `src/modules/bilan/etats/controles-coherence.types.ts` (`ControleArticulation`, `CodeControle`, `CategorieControle`, `StatutControle`, `ControleElement`, `ControlesCoherenceProduit`).
- **Nouveau** : `dto/controles-coherence-response.dto.ts` (`ControleArticulationDto`, `ControlesCoherenceDto`). **Corps** = `BilanDryRunRequestDto` réutilisé.
- **Étendu** : `bilan-engine.service.ts` → `produireControlesCoherence(...)` (produit Bilan + CR + `CoherenceResultat` + TFT + notes, puis batterie) ; `bilan-diagnostics.controller.ts` → `POST /bilan/etats/controles/dry-run` (mêmes gardes + mapper d'erreurs + `toEffectiveStamp`) ; `bilan.module.ts` → provider `ControlesCoherenceProductionService`.
- **Réutilisés inchangés** : `BilanProductionService`, `CompteResultatProductionService`, `TftProductionService`, `NotesAnnexesProductionService`, `ReferentielLoader`, `MappingOverrideRepository`, `toHttpFromReferentielError`, `toEffectiveStamp`, `MontantHorsBornesError`, `@RequiresBilanAccess`, `BilanDryRunRequestDto`.

### Contrats (types)

```ts
export type CodeControle =
  | 'EQUILIBRE_BILAN' | 'COHERENCE_RESULTAT'
  | 'VARIATION_TRESORERIE' | 'ARTICULATION_NOTES';
export type CategorieControle = 'BLOQUANT' | 'INFORMATIF';
export type StatutControle = 'OK' | 'ANOMALIE' | 'INDETERMINABLE' | 'NON_APPLICABLE';

/** Élément d'état mis en cause par une anomalie (jamais un compte deviné — hook B8). */
export interface ControleElement { ref: string; valeur: number | null; }

export interface ControleArticulation {
  code: CodeControle;
  libelle: string;
  categorie: CategorieControle;
  statut: StatutControle;
  ecart: number | null;          // null si INDETERMINABLE / NON_APPLICABLE
  elements: ControleElement[];   // totaux/postes concernés (vide si OK trivial)
}

export interface ControlesCoherenceProduit {
  referentiel: { code: string; version: string };
  controles: ControleArticulation[];
  /** true ⟺ tous les contrôles BLOQUANT sont OK (FR-013 AC-2 ; appliqué par FR-014/064). */
  valide: boolean;
}
```

### Algorithme (`ControlesCoherenceProductionService.produire(bilan, coherence, tft, notes)`)

1. **`EQUILIBRE_BILAN`** (bloquant) : `statut = bilan.controle.equilibreN ? 'OK' : 'ANOMALIE'` ; `ecart = bilan.controle.ecartN` ; si anomalie, `elements = [totalActifN, totalPassifN, resultatNetN]`.
2. **`COHERENCE_RESULTAT`** (bloquant) : `statut = coherence.coherent ? 'OK' : 'ANOMALIE'` ; `ecart = coherence.ecart` ; `elements = [resultatNetCR, resultatNetBilan]` si anomalie.
3. **`VARIATION_TRESORERIE`** (informatif) : mappe `controleTresorerie.statut` → `CALCULE`⇒(`coherent?'OK':'ANOMALIE'`), `INDETERMINABLE`, `NON_APPLICABLE` ; `ecart = controleTresorerie.ecart` ; `elements = [variationTft, variationBilan]`.
4. **`ARTICULATION_NOTES`** (informatif) : `notes.statut==='NON_APPLICABLE'`⇒`NON_APPLICABLE` ; sinon pour chaque note vérifier `Σ postes.montantN === totalN` (idem N-1) ⇒ `OK`/`ANOMALIE` (note + postes en `elements`).
5. **`valide`** = `controles.filter(c => c.categorie==='BLOQUANT').every(c => c.statut==='OK')`.

### Sécurité / robustesse

- `orgId` **exclusivement du JWT** ; corps = soldes uniquement (validation `whitelist` + `forbidNonWhitelisted`, héritée de `BilanDryRunRequestDto`).
- Aucune écriture en base (dry-run) → **pas de transaction Mongo**.
- Anti-500 : entrées non conformes → 400 (précédent 055/059/060/061/062) ; `MontantHorsBornesError` levée par la production amont → 400.

### Edge cases

- **Balance déséquilibrée** → `EQUILIBRE_BILAN`=`ANOMALIE`, `valide=false`.
- **N-1 absent** → `VARIATION_TRESORERIE`=`INDETERMINABLE` (non bloquant, `valide` inchangé) ; équilibre N-1 non exposé.
- **SFD-BCEAO** → `VARIATION_TRESORERIE`/`ARTICULATION_NOTES`=`NON_APPLICABLE` ; `valide` déterminé par les 2 contrôles bloquants applicables.
- **Note dont un poste n'est pas produit** (062 le met à 0) → `Σ` reste cohérent avec `totalN` ⇒ `OK` (pas de fausse anomalie).
- **Dépassement d'entier sûr** en amont → 400 (propagé, pas de contrôle produit).

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** STORY-059 (`ControleEquilibre`), STORY-060 (`CoherenceResultat`), STORY-061 (`ControleTresorerie`), STORY-062 (`NotesAnnexesProduit`), STORY-055/056/057/058 (mapping + référentiels + surcharges), STORY-037/054 (gate + garde ACTIVE).

**Stories débloquées :** STORY-064 (FR-014 — cycle brouillon→validé : **applique** le drapeau `valide` comme gate bloquant), STORY-065 (FR-015 — snapshot figé). **Tech-spec B8** (traçage compte fautif + contrôles réglementaires détaillés).

**Dépendances externes :** aucune (référentiels embarqués ; JWT RS256 de l'IdP).

---

## Definition of Done

- [ ] Code implémenté (français) ; `ControlesCoherenceProductionService` **pur** et **référentiel-agnostique** ; **aucune structure OHADA ni compte fautif inventés** (P7).
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (module `etats` visé 100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : batterie complète sur balance équilibrée (tous `OK`, `valide=true`) ; balance déséquilibrée (`EQUILIBRE_BILAN`=`ANOMALIE` + éléments, `valide=false`) ; N-1 absent (`VARIATION_TRESORERIE`=`INDETERMINABLE`, `valide` inchangé) ; SFD (`VARIATION_TRESORERIE`/`ARTICULATION_NOTES`=`NON_APPLICABLE`) ; contrôle informatif en anomalie n'affecte pas `valide` ; note incohérente → `ARTICULATION_NOTES`=`ANOMALIE` — **sur les deux référentiels**.
- [ ] Tests **e2e** (contrat HTTP, données mockées) : 200 nominal (`valide=true`), 200 déséquilibré (`valide=false`), 400 (compte invalide / bornes), 401 (sans jeton), 403 (gate), N-1 optionnel.
- [ ] **Vérification docker réelle obligatoire** (la story n'écrit pas en base ⇒ preuve = **calcul de bout en bout sur stack vivante**, JWT RS256 réel de l'IdP, read-models entitlement semés) : batterie SYSCOHADA sur balance équilibrée → tous les bloquants `OK`, `valide=true`, cross-check des écarts avec `bilan`/`compte-resultat`/`tft` dry-run (059/060/061) sur les mêmes soldes ; balance **déséquilibrée** → `EQUILIBRE_BILAN`=`ANOMALIE` (ecart ≠ 0), `valide=false` ; **SFD → `NON_APPLICABLE`** sur tréso/notes ; N-1 absent → `INDETERMINABLE` ; borne → 400 ; sans jeton → 401 ; entitlement REVOKED → 403 ; **non-régression** `/health` 200 sur 8 services + dry-run 059/060/061/062 inchangés. Consigné dans *Progress Tracking*.
- [ ] Endpoint documenté dans **Swagger** (`/api/docs`).
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture. **EPIC-011 clôturé** (dernière story).

---

## Story Points Breakdown

- **`ControlesCoherenceProductionService` (batterie + classement + drapeau `valide`) :** 1 point
- **Endpoint + DTO + câblage engine (produit les 4 états puis batterie) + Swagger :** 1 point
- **Tests (unit + e2e, 2 référentiels) + vérif docker :** 1 point
- **Total :** 3 points

**Rationale :** aucune règle métier neuve — les trois contrôles d'articulation **existent déjà** (calculés par construction dans 059/060/061) et les totaux de note dans 062 ; 063 les **consolide, classe et gate**. Le risque « deviner des règles OHADA » est **nul** (on lit des contrôles déjà agnostiques). Le petit effort réel = définir la structure de la batterie, le classement bloquant/informatif, le drapeau `valide` et la re-vérification légère des notes.

---

## Additional Notes

- **Clôt EPIC-011.** Après 063, la liasse complète (Bilan + CR + TFT + notes) dispose d'une **batterie de contrôles d'articulation** et d'un **drapeau de validabilité** — pivot vers EPIC-012 (validation & immutabilité).
- **Contrôles cohérents par construction ≠ contrôles inutiles** : exposés dans la batterie, ils constituent (a) un **filet anti-régression** du moteur et (b) des contrôles **réels** dès qu'une **balance externe** (EPIC-009 interop) ou des soldes N/N-1 **indépendants** seront branchés — cas où l'écart peut cesser d'être nul.
- **Séparation nette 063 vs 064** : 063 **produit** `valide` (diagnostic, aucune persistance) ; 064 (FR-014) **applique** `valide` comme **gate bloquant** du passage brouillon→validé et enregistre auteur + horodatage. Pas de débordement.
- **Aucune modification de référentiel** (comme 062) : la batterie ne lit que des contrôles déjà portés par les états → **checksums 056/057 inchangés**.

---

## Progress Tracking

**Status History :**
- 2026-07-19 : Créée (Scrum Master) — **dernière story d'EPIC-011**. Cadrée sans fork P7 : les trois contrôles d'articulation existent déjà (059 `ControleEquilibre`, 060 `CoherenceResultat`, 061 `ControleTresorerie`) + totaux de note (062), tous **référentiel-agnostiques** ; 063 = **consolidation en batterie + classement bloquant/informatif + drapeau `valide`** + liste d'anomalies. Aucune modif de référentiel, aucun compte fautif deviné (traçage = hook B8), gate d'application = STORY-064.
- 2026-07-19 : Implémentée + vérifiée docker réelle + intégrée dans `dev` (MNV-063, PR #14 bilan-service, rebase-merge, branche supprimée). **Clôt EPIC-011.**

**Implémentation (dev-story, 2026-07-19) :**
- `ControlesCoherenceProductionService` (pur, aucune I/O, `src/modules/bilan/etats/`) : consomme les états **déjà produits** sur les mêmes soldes et émet la **batterie** ordonnée `[EQUILIBRE_BILAN, COHERENCE_RESULTAT, VARIATION_TRESORERIE, ARTICULATION_NOTES]`. Chaque contrôle = `{ code, libelle, categorie (BLOQUANT|INFORMATIF), statut (OK|ANOMALIE|INDETERMINABLE|NON_APPLICABLE), ecart, elements[] }`. `EQUILIBRE_BILAN` (bloquant) depuis `bilan.controle` (seul réellement faillible → anomalie expose `totalActifN`/`totalPassifN`/`resultatNetN`) ; `COHERENCE_RESULTAT` (bloquant) depuis `CoherenceResultat` ; `VARIATION_TRESORERIE` (informatif) **reprend fidèlement** le statut de `controleTresorerie` (`CALCULE`→OK/ANOMALIE, `INDETERMINABLE`, `NON_APPLICABLE`) ; `ARTICULATION_NOTES` (informatif) re-vérifie `Σ postes = totalN` (0 par construction ; `NON_APPLICABLE` si aucun renvoi). **Drapeau `valide`** = tous les contrôles BLOQUANT en `OK`. **100 % référentiel-agnostique** (aucune structure OHADA en dur).
- `BilanEngineService.produireControlesCoherence` (résout référentiel + garde ACTIVE + surcharges VALIDATED → **produit Bilan 059 + CR 060 + cohérence + TFT 061 + notes 062** sur les mêmes soldes → batterie). Facteur commun `coherenceResultat(bilan, cr)` extrait (réutilisé par `produireCompteResultat` 060 — pas de duplication). Endpoint gardé `POST /bilan/etats/controles/dry-run` (corps `BilanDryRunRequestDto` réutilisé ; tampon `toEffectiveStamp` ; `MontantHorsBornesError`→400).
- **Aucune modification de référentiel** (la batterie ne lit que des contrôles déjà portés par les états) → **checksums 056/057 inchangés** (comme 062). Services 059/060/061/062 + mapping/surcharges **inchangés** (non-régression e2e verte). DTO `ControlesCoherenceDto` documenté Swagger.
- **Qualité** : lint **0** · build OK · **300 unit + 71 e2e verts** · `controles-coherence-production.service.ts` **100/100/100/100** · global **98.13/92.81/98.06/97.96** > seuils 65/90/90/90.

**Vérification docker RÉELLE** (stack vivante 8 services healthy — bilan-service **redémarré** pour enregistrer le nouvel endpoint ; JWT RS256 **réel** de l'IdP org `6a5cd6a1…`, TENANT_ADMIN, e-mail vérifié, read-models entitlement/KYC semés `mongosh`) :
1. **Balance équilibrée SYSCOHADA** → 4 contrôles émis, `EQUILIBRE_BILAN`=OK ecart 0, `COHERENCE_RESULTAT`=OK, `VARIATION_TRESORERIE`=INDETERMINABLE (N-1 absent), `ARTICULATION_NOTES`=OK, **`valide=true`**, stamp `cb8a7e11…`. **Cross-check** `bilan/dry-run` (059) mêmes soldes : `totalActifN=1 800 000`, `totalPassifN=1 400 000`, `resultatNetN=400 000`, `ecartN=0`, `equilibreN=true` (rapprochement indépendant).
2. **Balance déséquilibrée** (101000 → 900 000) → `EQUILIBRE_BILAN`=**ANOMALIE** `ecart=100 000` + `elements` (`totalActifN=1 800 000`, `totalPassifN=1 300 000`, `resultatNetN=400 000`), **`valide=false`**.
3. **Avec N-1** → `VARIATION_TRESORERIE`=**CALCULE→OK** `ecart=0`.
4. **RÉFÉRENTIEL-AGNOSTIQUE** — bascule org → `sfd-bceao@1.0` : `EQUILIBRE_BILAN`/`COHERENCE_RESULTAT` évalués (OK), `VARIATION_TRESORERIE`/`ARTICULATION_NOTES`=**NON_APPLICABLE**. **Aucune structure OHADA en dur.**
5. Bornes → **400 MONTANT_HORS_BORNES** ; sans jeton → **401** ; entitlement `REVOKED` → **403 BILAN_NOT_ENTITLED**.
6. **Non-régression** : `bilan`/`compte-resultat`/`tft`/`notes-annexes` dry-run (059/060/061/062) → **200** ; `/health` **200 sur les 8 services**.

**Effort réel :** 3 points (conforme).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implémentation).**
