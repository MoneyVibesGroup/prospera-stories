# STORY-059 : Bilan (actif / passif) — production des postes, colonnes Brut/Amort/Net + N/N-1, contrôle actif = passif — FR-009

**Epic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-009 (Bilan actif/passif selon le référentiel, colonnes N/N-1, à partir des soldes mappés ; contrôle **total actif = total passif** bloquant)
**Réf. logique métier :** `docs/rapport-bilan-logique-metier-2026-07-12.md` §O2 (liasse GUIDEF/DSF Togo — codes postes officiels AD/AE/…, colonnes **BRUT / AMORT-DÉPREC / NET**, N/N-1), §406 (l'exemplaire « Définitif » réel échoue Actif≠Passif → valeur du contrôle), §459-465 (« Soldes cumulés » = entrée principale du bilan)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de règle comptable codée en dur) ; CLAUDE.md §Definition of Done, §Anti-énumération, §« ne devine jamais une API »
**Réf. code livré :** STORY-055 (`TableDePassageService.mapComptes` **pur** ; `BilanEngineService.rattacherComptes(orgId, comptes)` **org-aware**, garde ACTIVE + surcharges) · STORY-056/057 (référentiels packagés `syscohada-revise@2.1`, `sfd-bceao@1.0` : `regles`, `postes`, `tableDePassage`) · STORY-058 (surcharges VALIDATED prioritaires) · STORY-037 (`@RequiresBilanAccess`) · STORY-101 balance-service (contrat `BalanceCanonique` : **unités mineures XOF entières**, bornes `Number.isSafeInteger`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker réelle + revue + intégrée dans `dev` le 2026-07-19 — PR #10 bilan-service, MNV-059 rebase-merge)
**Assigné à :** vivian
**Créée :** 2026-07-19
**Sprint :** 12

---

## User Story

**En tant que** gestionnaire comptable d'une organisation (cabinet / entreprise),
**je veux** générer le **Bilan (actif / passif)** de mon exercice à partir des soldes de mes comptes rattachés au référentiel, avec les **colonnes officielles (Brut / Amort-Dépréc / Net)** et le **comparatif N-1**,
**afin de** disposer d'un état financier structuré, **contrôlé (actif = passif)** et prêt à intégrer la liasse OHADA.

---

## Description

### Contexte & re-cadrage (⚠️ lire AVANT de coder)

STORY-059 **ouvre EPIC-011** (production des états financiers), juste après la clôture d'EPIC-010 (référentiels + table de passage, 2026-07-18). Comme STORY-055 (« moteur de rattachement pur ») et STORY-099 (« re-cadrée contre les API réelles »), **cette story est re-cadrée contre la réalité du service et du référentiel** — **trois** écarts avec le libellé du plan :

1. **bilan-service n'a PAS de balance.** Production + stockage de la balance ont quitté bilan-service (décision **D14**, 2026-07-12) pour **balance-service** (STORY-076/077/101/086/099). L'**EPIC-009** est **`superseded`** ; le **consumer réel** de `balance.created` reste **différé** (EPIC-009 interop). ⇒ STORY-059 **ne lit aucune balance** : elle **produit le Bilan à partir de soldes fournis** (mêmes comptes que `POST /bilan/table-de-passage/dry-run`, enrichis de leur solde), via un **endpoint diagnostic `dry-run` gardé** — prolongement direct du diagnostic 055.
2. **La dépendance « STORY-052 (N-1) » est PÉRIMÉE** (052 appartenait à l'EPIC-009 superseded). ⇒ le comparatif **N-1** est fourni comme **second jeu de soldes optionnel** dans la même requête. N-1 absent ⇒ colonne comparative **vide** (jamais inventée — FR-003 AC).
3. **⚠️ Le calcul doit rester RÉFÉRENTIEL-AGNOSTIQUE (invariant P7).** Découverte en lisant les deux paquets : les conventions sont **spécifiques à chaque référentiel** et **ne se codent pas en dur** :
   - SFD-BCEAO **n'a pas de compte 13 « résultat »** (son `13` est un compte d'**actif** BA1) et **pas** les comptes d'amortissement SYSCOHADA (son `59` = **fonds propres**, pas une dépréciation) ; il porte une règle `SOLDE_DEBITEUR` que SYSCOHADA n'a pas.
   - Coder la « convention miroir » d'amortissement SYSCOHADA (28→2, 29/39/49/59) **en dur** violerait P7 **et produirait un Bilan faux pour SFD**.
   ⇒ Le moteur agrège **par la `regle` du poste** (portée par le référentiel), jamais par des préfixes de comptes codés en dur.

Le delta 059 = un **`BilanProductionService` PUR** qui, à partir du **rattachement** (055, `RattachementResult`) et des **soldes par compte** (N + N-1 optionnel), **agrège** les montants des postes d'actif/passif **selon la règle de chaque poste**, présente les **colonnes Brut/Amort/Net + N/N-1** et **contrôle l'équilibre actif = passif**.

### Contrat de calcul — agrégation pilotée par la `regle` (référentiel-agnostique)

Chaque règle de la table de passage porte une `regle` ; le moteur l'applique **génériquement** aux comptes mappés (`D` = `soldeDebiteur`, `C` = `soldeCrediteur`, unités mineures XOF) :

| `regle` | Côté | Contribution d'un compte mappé |
|---|---|---|
| `NET_ACTIF` | ACTIF | **Brut** += `D`, **Amort/Dépréc** += `C`, **Net** = Brut − Amort |
| `SOLDE_DEBITEUR` (SFD) | ACTIF | idem NET_ACTIF (Brut/Amort/Net) |
| `SOLDE_CREDITEUR` | PASSIF | **Montant** += `C − D` |
| `PRODUIT` | Résultat | **résultatNet** += `C − D` |
| `CHARGE` | Résultat | **résultatNet** += `C − D` (une charge, à débit, **réduit** le résultat) |
| `FORMULE` / `type='total'` | — | **ignoré** (sous-totaux officiels non calculés — voir *Hors périmètre*) |

- **Colonnes Brut/Amort/Net référentiel-agnostiques** : dérivées du **débit/crédit des comptes réellement rattachés au poste**. Si le référentiel mappe un compte d'amortissement/dépréciation à un poste d'actif, sa part créditrice alimente **automatiquement** la colonne Amort (forward-compatible) ; sinon Amort = 0 et Net = Brut. **Aucune convention SYSCOHADA en dur.**
- **Ventilation classes 4/5 AU SOLDE** : un compte de tiers/trésorerie dont `mapComptes` retourne des candidats **actif ET passif** est affecté à l'**actif si `D − C ≥ 0`, au passif sinon** (ventilation au solde, FR-006/`pkg.regles.classes_4_5`). Candidat unique ⇒ ce côté.
- **Contrôle actif = passif (FR-009 AC-2) — équation exacte.** Sur une balance équilibrée (`Σ D = Σ C`), l'identité comptable donne `totalActifNet = totalPassif + résultatNet`. Le moteur pose donc :
  `ecart = totalActifNet − (totalPassif + résultatNet)` ; `equilibre = (ecart === 0)`.
  Le **résultat net** (produits − charges, via `PRODUIT`/`CHARGE`) est calculé **génériquement** et porté **au côté passif de l'équation** — **sans** présumer quel poste passif l'accueille (placement dans un poste = spécifique au référentiel, différé). Un `ecart ≠ 0` = balance **non équilibrée** ou comptes **non mappés significatifs** → anomalie signalée (bloquante à la **validation**, FR-014 / STORY-064, hook).

### Unités & bornes

Montants en **unités mineures XOF entières** (× 100), **aligné sur `BalanceCanonique`** (STORY-101) — arithmétique de sommation **exacte**, futur handoff `balance.created` branchable sans conversion. Bornes `Number.isSafeInteger` par ligne **et** par total agrégé (précédent 101) → dépassement = `400`.

---

## Scope

**Dans le périmètre :**

- **`BilanProductionService` (pur, aucune I/O, aucune dépendance Mongo/Kafka)**, dépend de `TableDePassageService` (055, pur) — réutilisable tel quel par les opérations métier (EPIC-009 interop, EPIC-012) :
  - Entrée : `ReferentielPackage` + surcharges VALIDATED (via l'engine) + `LigneSolde[]` pour **N** + `LigneSolde[]` optionnel pour **N-1**.
  - **Agrégation pilotée par la `regle`** (tableau ci-dessus), **référentiel-agnostique** (fonctionne pour SYSCOHADA **et** SFD, y c. `SOLDE_DEBITEUR`).
  - **Colonnes Brut/Amort/Net** (actif) et **Montant** (passif), pour **N** ; **Net** (actif) / **Montant** (passif) pour **N-1** (présentation DSF). N-1 absent ⇒ colonnes N-1 **nulles**.
  - **Ventilation classes 4/5 au solde**.
  - **Résultat net** (N, N-1) calculé via `PRODUIT`/`CHARGE`.
  - **Totaux + contrôle** : `totalActifN`, `totalPassifN`, `resultatNetN`, `ecartN`, `equilibreN` (idem N-1).
  - **Comptes non mappés** (classes bilan) remontés explicitement.
- **Endpoint diagnostic gardé** `POST /bilan/etats/bilan/dry-run` (`@RequiresBilanAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)`), **200** (lecture, aucune persistance) :
  - Corps : `{ soldesN: LigneSolde[], soldesN1?: LigneSolde[] }`, `LigneSolde = { compte, soldeDebiteur, soldeCrediteur }` (compte `^\d[0-9A-Za-z]{1,19}$` aligné 055/086 ; `D`,`C` entiers ≥ 0 unités mineures, `@Max(MAX_SAFE_INTEGER)`).
  - `orgId` **du JWT** (jamais du corps). Résout le référentiel (garde ACTIVE 054) + surcharges VALIDATED via `BilanEngineService`, puis `BilanProductionService`.
  - Réponse `BilanDto` : `{ referentiel, stamp, actif: PosteActifDto[], passif: PostePassifDto[], resultatNetN, resultatNetN1, controle, comptesNonMappes }`.
- **`BilanEngineService.produireBilan(orgId, soldesN, soldesN1?)`** = `resolveReferentielForOrg` + `overrides.chargerSurchargesActives()` + `BilanProductionService.produire(...)`. Propage les erreurs de résolution/chargement (`toHttpFromReferentielError`).
- **Provisoire** (comme `whoami`, `bilan-access`, `table-de-passage/dry-run`) : harnais de preuve e2e + docker tant que le consumer balance réel n'existe pas.
- **Non-régression** : `TableDePassageService` (055) et `mapping-override` (058) **inchangés** ; le service pur nouveau se **branche en aval**. **Artefacts de référentiel (056/057) NON modifiés.**
- Endpoints **documentés Swagger**.

**Hors périmètre (hooks inertes documentés — NE PAS déborder) :**

- **Compte de résultat détaillé** (postes `TA/RA/RB…`, soldes intermédiaires de gestion) → **STORY-060** (FR-010). 059 ne calcule que le **résultat net agrégé** nécessaire au contrôle du bilan (FR-009 AC-2).
- **Convention miroir amort SYSCOHADA** (rattacher les comptes `28xx`/dépréc `29/39/49/59` non mappés à leur poste d'immo) → nécessite d'**étendre le référentiel** (marqueur contra sur la table de passage, sourcé OHADA) = **tech-spec B8** / story d'extension référentiel. **Non deviné ici** (P7).
- **Placement du résultat net dans un poste passif** (CJ pour SYSCOHADA, fonds propres pour SFD) → spécifique au référentiel, requiert un marqueur « poste résultat » dans le paquet → **différé** (le résultat est porté à l'équation du contrôle, pas dans un poste).
- **Sous-totaux/agrégats officiels `FORMULE`** (`AZ, BG, BK, BT, BZ, CP…`, `comptesSyscohada` vide) → formules non sourcées → **hook**.
- **Consumer réel `balance.created`** → EPIC-009 interop. **Persistance / snapshot / validation** → EPIC-012. **TFT** (061), **annexes** (062), **articulation** (063), **export** (EPIC-014), **fiscalité** (balance-service EPIC-023/024).

---

## User Flow

1. Le gestionnaire (org `bilan` `ACTIVE`, e-mail vérifié, KYC `APPROVED`) appelle `POST /bilan/etats/bilan/dry-run` avec les soldes cumulés (D/C) de ses comptes pour N (+ éventuellement N-1).
2. Le service **résout** le référentiel de l'org (SYSCOHADA révisé ou SFD-BCEAO) — gate + garde ACTIVE.
3. Il **rattache** chaque compte (surcharges org VALIDATED prioritaires).
4. Il **agrège** par poste **selon la `regle`** : Brut/Amort/Net (actif), Montant (passif), ventilation 4/5 au solde, résultat net (produits − charges), pour N et N-1.
5. Il **contrôle** `actif = passif + résultat` (N et N-1) → `ecart`, `equilibre`.
6. Il renvoie le **Bilan structuré** (postes + colonnes + totaux + écart + comptes non mappés + tampon référentiel), **sans rien persister**.
7. Un `ecart ≠ 0` est **signalé** (anomalie non bloquante ici ; bloquante à la validation EPIC-012).

---

## Acceptance Criteria

- [ ] `POST /bilan/etats/bilan/dry-run` renvoie **200** avec un Bilan structuré (actif[], passif[], controle) pour un jeu de soldes N valide.
- [ ] **Postes calculés selon la table de passage** (FR-009 AC-1) : chaque poste porte son code officiel + libellé du référentiel, alimenté par les comptes rattachés (055) **selon sa `regle`**.
- [ ] **Colonnes Brut / Amort / Net** exposées côté actif (`Net = Brut − Amort`), dérivées du débit/crédit des comptes du poste — **sans convention codée en dur**.
- [ ] **Passif** : Montant = Σ (`C − D`) des comptes du poste (`SOLDE_CREDITEUR`).
- [ ] **Ventilation classes 4/5 au solde** : compte à candidats actif+passif → actif si `D − C ≥ 0`, passif sinon.
- [ ] **Résultat net** calculé via `PRODUIT`/`CHARGE` et porté au côté passif du contrôle.
- [ ] **Colonnes N / N-1 présentes** (FR-009 AC-3) ; N-1 absent ⇒ colonnes N-1 **nulles**.
- [ ] **Contrôle actif = passif** (FR-009 AC-2) : `ecart = totalActif − (totalPassif + résultat)` et `equilibre` exposés pour N (et N-1) ; balance équilibrée ⇒ `ecart = 0` ; déséquilibrée ⇒ `ecart` exact.
- [ ] Comptes **non mappés** (bilan) remontés explicitement (jamais ignorés).
- [ ] **Unités mineures XOF entières** ; ligne ou total hors `Number.isSafeInteger` → **400**.
- [ ] Compte au format invalide / corps mal formé → **400** (jamais 500).
- [ ] Gate refusé → **403** `{ code }` ; org d'un autre tenant non exposée. Référentiel non résolu/indisponible → 409/500/503 via `toHttpFromReferentielError`.
- [ ] Fonctionne **RÉFÉRENTIEL-AGNOSTIQUE** : SYSCOHADA révisé **et** SFD-BCEAO (dont règle `SOLDE_DEBITEUR`).
- [ ] **Non-régression** : `table-de-passage/dry-run` (055), `mapping-overrides` (058), artefacts (056/057) inchangés.

---

## Technical Notes

### Composants

- **Nouveau** : `src/modules/bilan/etats/bilan-production.service.ts` (**pur**, dépend `TableDePassageService`) + `.spec.ts` ; `src/modules/bilan/etats/bilan.types.ts` (`LigneSolde`, `PosteActif`, `PostePassif`, `ControleEquilibre`, `BilanProduit`).
- **Nouveau** : DTO `dto/bilan-dry-run-request.dto.ts` + `dto/bilan-response.dto.ts`.
- **Étendu** : `bilan-engine.service.ts` → `produireBilan(...)` (composition, aucune logique comptable dupliquée).
- **Étendu** : `bilan-diagnostics.controller.ts` → `POST /bilan/etats/bilan/dry-run` (mêmes gardes + mapper d'erreurs).
- **Étendu** : `bilan.module.ts` → provider `BilanProductionService`.
- **Réutilisés inchangés** : `TableDePassageService`, `ReferentielLoader`, `MappingOverrideRepository`, `toHttpFromReferentielError`, `toEffectiveStamp`, `@RequiresBilanAccess`.

### Algorithme (par jeu de soldes)

1. `mapComptes(comptes, pkg, surcharges)` → rattachements (055).
2. Pour chaque compte mappé, choisir le rattachement (ventilation 4/5 par signe si candidats multiples), puis **appliquer sa `regle`** (tableau *Contrat de calcul*) → accumuler par poste (actif Brut/Amort ; passif Montant) ou dans `résultatNet`.
3. Postes actif : `Net = Brut − Amort`. Totaux : `totalActif = Σ Net` ; `totalPassif = Σ Montant`.
4. Contrôle : `ecart = totalActif − (totalPassif + résultatNet)` ; `equilibre = ecart === 0`.
5. Bornes `Number.isSafeInteger` à chaque agrégation → dépassement = erreur typée → **400**.
6. N-1 : même passe sur `soldesN1` (colonnes Net/Montant seules).

### Sécurité / robustesse

- `orgId` **exclusivement du JWT** ; corps = soldes uniquement.
- Validation stricte (`ValidationPipe` `whitelist` + `forbidNonWhitelisted`) ; `D`,`C` entiers ≥ 0.
- Aucune écriture en base (dry-run) → **pas de transaction Mongo**.
- Anti-500 : entrées non-tableau / types erronés → 400 (précédent 055).

### Edge cases

- N-1 absent → colonnes N-1 nulles.
- Compte présent en N pas en N-1 (et inversement) → montant 0 sur le jeu absent.
- Compte bilan non mappé → `comptesNonMappes` (hors totaux) → contribue à l'`ecart` (signal correct).
- Poste `type='total'`/`FORMULE` → ignoré (hook).
- Déséquilibre volontaire (jeu de test) → `equilibre=false`, `ecart` exact (rapport §406).

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** STORY-055 (mapping), STORY-056/057 (référentiels packagés), STORY-058 (surcharges), STORY-037/054 (gate + garde ACTIVE).

**Dépendance périmée (documentée) :** ~~STORY-052 (N-1)~~ — EPIC-009 `superseded` (D14) ; N-1 = 2ᵉ jeu de soldes.

**Stories débloquées :** STORY-060 (Compte de résultat — réutilise `BilanProductionService` + règles CHARGE/PRODUIT), STORY-061 (TFT), STORY-063 (articulation), STORY-064/065 (validation + snapshot).

**Dépendances externes :** aucune (référentiels embarqués ; JWT RS256 de l'IdP).

---

## Definition of Done

- [ ] Code implémenté (français) ; `BilanProductionService` **pur** et **référentiel-agnostique**.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (module `etats` visé 100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : NET_ACTIF (Brut/Amort/Net), SOLDE_CREDITEUR, SOLDE_DEBITEUR (SFD), PRODUIT/CHARGE → résultat, ventilation 4/5, contrôle actif=passif (équilibré ⇒ ecart 0 ; déséquilibré ⇒ ecart exact), N-1 absent, bornes safe-integer — **sur les deux référentiels**.
- [ ] Tests **e2e** (contrat HTTP, données mockées) : 200 nominal, 400 (compte invalide / bornes), 403 (gate), N-1 optionnel.
- [ ] **Vérification docker réelle obligatoire** (la story n'écrit pas en base ⇒ preuve = **calcul de bout en bout sur stack vivante**, JWT RS256 réel de l'IdP, read-models entitlement semés) : `dry-run` jeu équilibré → `equilibre=true, ecart=0` ; jeu déséquilibré → `equilibre=false, ecart` exact ; Brut/Amort/Net cohérents ; ventilation 4/5 (compte tiers débiteur→actif, créditeur→passif) ; **SYSCOHADA ET SFD-BCEAO** ; comptes non mappés remontés ; **non-régression** `/health` 200 sur 8 services + `table-de-passage/dry-run` inchangé. Consigné dans *Progress Tracking*.
- [ ] Endpoints documentés dans **Swagger** (`/api/docs`).
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Moteur `BilanProductionService` (agrégation par règle, Brut/Amort/Net, ventilation 4/5, résultat, contrôle) :** 3 points
- **Endpoint + DTO + câblage engine + Swagger :** 1 point
- **Tests (unit + e2e, 2 référentiels) + vérif docker :** 1 point
- **Total :** 5 points

**Rationale :** cœur comptable réel (Brut/Amort/Net + contrôle d'équilibre) mais **borné** : service pur en aval d'acquis solides (055/058), aucune persistance, aucune I/O. Le risque « deviner des règles OHADA » est **éliminé** par le choix référentiel-agnostique (agrégation par `regle`) : amort miroir, placement du résultat et sous-totaux officiels sont **explicitement hors périmètre** (hooks/tech-spec B8).

---

## Additional Notes

- **Précédent de re-cadrage** : STORY-055 / STORY-099 — mêmes logiques. La divergence avec le libellé du plan (Option « convention miroir SYSCOHADA ») est **assumée et tracée** : elle **violerait P7** et serait **fausse pour SFD-BCEAO** (découvert en lisant les deux paquets). Le design retenu est **piloté par le référentiel**.
- **Question ouverte à confirmer à l'intégration** : format exact des soldes du futur handoff `balance.created` (D/C cumulés vs solde net) — le DTO (`{ soldeDebiteur, soldeCrediteur }`) s'aligne sur `BalanceCanonique` (101) et couvre les deux.

---

## Progress Tracking

**Status History :**
- 2026-07-19 : Créée (Scrum Master) — re-cadrée contre l'état réel de bilan-service (pas de balance ; N-1 = 2ᵉ jeu ; dépendance 052 périmée).
- 2026-07-19 : Re-cadrage **P7** en dev (lecture des paquets SYSCOHADA + SFD) : la « convention miroir SYSCOHADA » codée en dur violerait l'invariant référentiel et serait fausse pour SFD → design **agrégation pilotée par la `regle`** (référentiel-agnostique) ; amort miroir + placement du résultat + sous-totaux FORMULE = hors périmètre (hooks / tech-spec B8).

**Implémentation (dev-story, 2026-07-19) :**
- `BilanProductionService` (pur, dépend `TableDePassageService`) : agrégation pilotée par la `regle` (`NET_ACTIF`/`SOLDE_DEBITEUR` → actif Brut/Amort/Net ; `SOLDE_CREDITEUR` → passif ; `PRODUIT`/`CHARGE` → résultat), ventilation 4/5 au solde, contrôle `ecart = totalActif − (totalPassif + résultat)`, bornes safe-integer (`MontantHorsBornesError` → 400). Postes ordonnés selon le référentiel.
- `BilanEngineService.produireBilan` (résout référentiel + garde ACTIVE + surcharges VALIDATED) ; endpoint gardé `POST /bilan/etats/bilan/dry-run` (200, tampon référentiel) ; DTO `LigneSolde` (compte `^\d[0-9A-Za-z]{1,19}$`, D/C entiers ≥ 0, `@Max(MAX_SAFE_INTEGER)`).
- **Qualité** : lint 0 · build OK · **224 unit + 43 e2e verts** · couverture module `etats` **100/98/100/100** (ligne non couverte = repli défensif inatteignable) ; global 98.6/91/98/98.5 > seuils 65/90/90/90. Artefacts 056/057 + services 055/058 **inchangés** (non-régression e2e verte).

**Vérification docker RÉELLE (stack neuve `down -v` → `up --build`, 8 services healthy, JWT RS256 réel de l'IdP, read-models semés via mongosh) :**
1. **Équilibré SYSCOHADA** → `equilibreN=true, ecartN=0` ; totalActif 1 800 000 / totalPassif 1 400 000 / résultat 400 000 ; checksum `e9370b14…` (= artefact réel) ; postes AE/BI/BS (Brut/Amort/Net) + CA/DJ ; nonMappes=[].
2. **Vrai déséquilibre** (211 D1M, 101 C900k, sans résultat) → `equilibreN=false, ecartN=100000`.
3. **N-1** fourni → `netN1` renseigné (AE 900 000), `totalActifN1` calculé.
4. **RÉFÉRENTIEL-AGNOSTIQUE** — bascule org → `sfd-bceao@1.0` : balance équilibrée (BA1 NET_ACTIF, **BA3 SOLDE_DEBITEUR** — règle propre au SFD, absente de SYSCOHADA, BP2 passif) → `ecartN=0`. **Preuve que le codage en dur SYSCOHADA (Option A) aurait échoué.**
5. Compte invalide → **400** ; agrégation hors bornes → **400 MONTANT_HORS_BORNES** ; sans jeton → **401** ; entitlement REVOKED → **403 BILAN_NOT_ENTITLED**.
6. **Non-régression** : `table-de-passage/dry-run` (055) intact ; `/health` **200 sur les 8 services**.

**Effort réel :** 5 points (conforme).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implémentation).**
