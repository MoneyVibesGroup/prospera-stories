# STORY-062 : Notes annexes de la liasse — synthèse calculable des renvois (note → postes des états) + zones « à compléter » — FR-012

**Epic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-012 (Notes annexes : **produire les tableaux annexes calculables depuis la balance/liasse ; identifier comme « à compléter » les zones non déductibles de la balance**)
**Réf. logique métier :** `docs/rapport-bilan-logique-metier-2026-07-12.md` (liasse GUIDEF/DSF Togo — notes annexes numérotées ; **renvois de note** portés par les postes du Bilan/CR)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de structure OHADA codée en dur) ; §« tech-spec Bilan **B8** à rédiger » ; CLAUDE.md §Definition of Done, §Anti-énumération, §« ne devine jamais une API »
**Réf. code livré :** STORY-059 (`BilanProductionService` → `BilanProduit { actif: PosteActif[](netN/netN1), passif: PostePassif[](montantN/montantN1) }`) · STORY-060 (`CompteResultatProductionService` → `CompteResultatProduit { produits/charges: PosteResultat[](montantN/montantN1) }`) · STORY-061 (**patron `CALCULE`/`A_COMPLETER` + endpoint jumeau + `PosteEtat.note`** ; `MontantHorsBornesError`) · STORY-055/056/057/058 (mapping, référentiels packagés, surcharges) · STORY-037/054 (gate + garde ACTIVE) · STORY-101 (`BalanceCanonique` : unités mineures XOF, bornes safe-integer)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker réelle + intégrée dans `dev` le 2026-07-19 — PR #13 bilan-service, MNV-062 rebase-merge)
**Assigné à :** vivian
**Créée :** 2026-07-19
**Sprint :** 12

---

## User Story

**En tant que** gestionnaire comptable d'une organisation (cabinet / entreprise),
**je veux** obtenir les **notes annexes** de ma liasse, avec les **tableaux calculables** alimentés automatiquement depuis mes états produits (Bilan/CR) et les **zones non dérivables de la balance clairement marquées « à compléter »**,
**afin de** disposer d'une base d'annexes cohérente avec mes états, sans jamais confondre un chiffre calculé avec une zone qu'il me reste à renseigner à la main.

---

## Description

### Contexte & re-cadrage (⚠️ lire AVANT de coder)

STORY-062 est la **4ᵉ story d'EPIC-011**, dans le prolongement de 059 (Bilan), 060 (CR) et 061 (TFT). Elle **réutilise l'acquis** et **re-cadre le périmètre contre la réalité des référentiels**, exactement comme ses prédécesseures — et FR-012 **cadre elle-même** le compromis : *« tableaux calculables générés ; zones non déductibles identifiées comme à compléter »*. C'est **le patron 061** (statut `CALCULE`/`A_COMPLETER`, agnostique), transposé aux annexes.

1. **bilan-service n'a PAS de balance** (EPIC-009 `superseded`) ⇒ notes produites **à partir de soldes fournis** via un **endpoint diagnostic `dry-run` gardé**, jumeau de `bilan/dry-run` (059), `compte-resultat/dry-run` (060), `tft/dry-run` (061). Corps `BilanDryRunRequestDto` **réutilisé**.
2. **⚠️ Invariant P7 maintenu**, avec la **découverte structurante décisive** (ci-dessous).

### Découverte structurante — le référentiel ne déclare que des *renvois de note*, aucune *table d'annexe*

Lecture des deux paquets (`postes[]`, `tableDePassage[]`, clés de haut niveau) :

- **Aucun `etat='ANNEXE'`/`NOTE`, aucune table d'annexe** dans les paquets (clés : `meta`, `regles`, `planDeComptes`, `postes`, `tableDePassage`, `paquetFiscal` — rien de « note »). Le seul élément d'annexe **machine-lisible** est le **renvoi de note** : le champ `PosteEtat.note` (déjà dans le contrat depuis STORY-038) porte, sur certains postes, le **numéro** de la note annexe à laquelle le poste renvoie.
- **SYSCOHADA** : **13 renvois** (notes `3`,`4`,`5`,`6`,`7`,`8`,`9`,`10`,`11`,`12`,`17`), tous sur des postes `BILAN_ACTIF` (Immobilisations, Actif circulant HAO, Stocks, Clients, Autres créances, Titres, Valeurs à encaisser, Banques, Écart de conversion…). **Le numéro seul** est stocké — **jamais le titre de la note ni le contenu détaillé**.
- **SFD-BCEAO** : **0 renvoi** → pas d'annexe déclarée → réponse **vide** (agnostique, comme le TFT).
- Les **tables détaillées** OHADA (mouvements d'immobilisations : valeur brute/acquisitions/cessions/amortissements ; antériorité des créances ; ventilations ; engagements hors bilan ; narratif) **ne sont pas dérivables des soldes** et ne sont **pas** dans les paquets.

⇒ Comme le TFT (061), les **tableaux d'annexe détaillés** relèvent de la **tech-spec B8** (autorat de structures de note dans le référentiel). Ce que 062 peut produire de **machine-exploitable et référentiel-agnostique** = la **synthèse des renvois** : pour chaque note déclarée, **les postes qui la renvoient et leur montant calculé** (repris des états produits 059/060), avec un **total**. C'est le **« tableau annexe calculable depuis la liasse »** de FR-012 AC-1 ; le **détail** (mouvements/narratif) est la **« zone à compléter »** de FR-012 AC-2.

### Ce que 062 livre — la synthèse calculable des renvois + les zones « à compléter »

1. **Indexer les renvois** : parcourir `pkg.postes`, regrouper par `note` (ignorer `note` absente et l'en-tête `note='NOTE'`).
2. Pour chaque note (ordonnée selon le référentiel), **collecter ses postes contributeurs** avec leur **montant calculé** repris des **états produits** sur les mêmes soldes :
   - poste `BILAN_ACTIF` → `netN`/`netN1` (059) ;
   - poste `BILAN_PASSIF` → `montantN`/`montantN1` (059) ;
   - poste `COMPTE_RESULTAT` → `montantN`/`montantN1` (060, produits ou charges).
   - Poste **déclaré mais absent des états** (aucun compte mappé) → montant **0** (jamais inventé).
3. **Total de la note** = Σ des montants contributeurs (N et N-1), borné safe-integer.
4. **`statut`** de la note = `CALCULE` (le total est dérivé des états). Le **détail** (mouvements, ventilation, narratif) est marqué **à compléter** (`detailACompleter: true`, **hook B8**).
5. **`libelle` de la note = `null`** : le référentiel **ne stocke pas** le titre → **jamais inventé** (P7 ; « à compléter »). Seuls les **libellés des postes contributeurs** (présents dans le référentiel) sont exposés.
6. **Agnostique** : SFD (0 renvoi) → `notes: []`, `statut: 'NON_APPLICABLE'`.

**Pas de nouveau contrôle de cohérence ici** : l'**articulation** notes ↔ Bilan/CR (rapprochement des totaux) relève de **STORY-063** (FR-013). 062 se limite à **produire** la synthèse calculable et à **baliser** les zones à compléter.

### Unités & bornes

Montants repris des états (**unités mineures XOF entières**, aligné `BalanceCanonique` 101). Sommation des totaux de note bornée `Number.isSafeInteger` (réutilise `MontantHorsBornesError` → 400).

---

## Scope

**Dans le périmètre :**

- **`NotesAnnexesProductionService` (pur, aucune I/O)** — dépend du `BilanProduit` (059) + `CompteResultatProduit` (060) + `ReferentielPackage` :
  - Index `note → postes` depuis `pkg.postes` (renvoi `PosteEtat.note`, en-tête `'NOTE'` et `note` absente ignorés).
  - Pour chaque note (ordonnée selon le référentiel) : `postes: PosteNote[] { etat, code, libelle, montantN, montantN1 }` (montant repris des états produits par `etat`+`code` ; 0 si le poste n'est pas produit), `totalN`, `totalN1`, `statut: 'CALCULE'`, `detailACompleter: true`, `libelle: null` (titre non fourni).
  - **Agnostique** : aucun renvoi → `notes: []`, `statut: 'NON_APPLICABLE'`.
  - Bornes safe-integer (`MontantHorsBornesError`).
- **Endpoint diagnostic gardé** `POST /bilan/etats/notes-annexes/dry-run` (`@RequiresBilanAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)`), **200** :
  - Corps `BilanDryRunRequestDto` **réutilisé** (`{ soldesN, soldesN1? }`).
  - `orgId` **du JWT**. Résout le référentiel (garde ACTIVE 054) + surcharges VALIDATED, **produit Bilan (059) + CR (060)** sur les mêmes soldes, puis les notes.
  - Réponse `NotesAnnexesDto` : `{ referentiel, stamp, notes: NoteAnnexeDto[], statut }`.
- **`BilanEngineService.produireNotesAnnexes(orgId, soldesN, soldesN1?)`** = résout référentiel + surcharges → `BilanProductionService.produire(...)` + `CompteResultatProductionService.produire(...)` → `NotesAnnexesProductionService.produire(pkg, bilan, cr)`. Propage `toHttpFromReferentielError` ; `MontantHorsBornesError` → 400.
- **Non-régression** : `BilanProductionService` (059), `CompteResultatProductionService` (060), `TftProductionService` (061), mapping/surcharges (055/058), endpoints existants **inchangés**. **Aucune modification de référentiel** (le renvoi `note` existe déjà — contrairement à 061).
- **Provisoire** (comme les jumeaux) : harnais de preuve e2e + docker.
- Endpoint **documenté Swagger**.

**Hors périmètre (hooks inertes documentés — NE PAS déborder) :**

- **Tables d'annexe détaillées** — mouvements d'immobilisations (valeur brute/acquisitions/cessions/amortissements), antériorité des créances, ventilations fines, engagements hors bilan, **narratif**, **titres de notes**. Non dérivables des soldes **et** non déclarés dans les paquets → **tech-spec B8** (autorat de structures de note dans le référentiel). **FR-012 AC-2 (« à compléter ») matérialisé** par `detailACompleter` + `libelle: null`.
- **Articulation / rapprochement notes ↔ Bilan/CR** (les totaux de note tiennent-ils aux totaux des états) → **STORY-063** (FR-013).
- **Consumer réel `balance.created`** (EPIC-009 interop), **persistance / snapshot / validation** (EPIC-012), **export** (EPIC-014).

---

## User Flow

1. Le gestionnaire (org `bilan` `ACTIVE`, e-mail vérifié, KYC `APPROVED`) appelle `POST /bilan/etats/notes-annexes/dry-run` avec ses soldes (N + N-1 optionnel).
2. Le service **résout** le référentiel — gate + garde ACTIVE + surcharges VALIDATED.
3. Il **produit le Bilan (059) et le CR (060)** sur les mêmes soldes.
4. Il **indexe les renvois de note** du référentiel et, pour chaque note, **collecte les postes contributeurs + leurs montants** repris des états, calcule le **total**, marque le **détail « à compléter »**.
5. Il renvoie les **notes structurées** (+ tampon référentiel), **sans rien persister**. Pour une org **SFD** (0 renvoi), la réponse est **vide** (`notes:[]`, `NON_APPLICABLE`).

---

## Acceptance Criteria

- [ ] `POST /bilan/etats/notes-annexes/dry-run` renvoie **200** avec les notes structurées (`notes[]`, chaque note = postes contributeurs + total) pour un jeu de soldes valide (SYSCOHADA).
- [ ] **Tableaux calculables générés** (FR-012 AC-1) : pour chaque renvoi `note` du référentiel, la note liste ses **postes contributeurs** (code + libellé du référentiel) avec leur **montant repris des états produits** (Bilan/CR, N et N-1) et un **`totalN`/`totalN1`** ; `statut='CALCULE'`.
- [ ] **Zones à compléter identifiées** (FR-012 AC-2) : le **détail** de chaque note (mouvements/ventilation/narratif) est marqué **`detailACompleter: true`** et le **`libelle`** de la note est **`null`** (titre non fourni par le référentiel — jamais inventé).
- [ ] **Montants repris fidèlement des états** : poste actif → `netN`, passif → `montantN`, CR → `montantN` (060) ; poste déclaré mais non produit → **0** (jamais ignoré, jamais inventé).
- [ ] **Colonnes N/N-1** : `montantN1` par poste + `totalN1` ; N-1 absent ⇒ colonnes N-1 **nulles**.
- [ ] **Agnostique** : **SFD-BCEAO** (0 renvoi) → `notes:[]`, `statut='NON_APPLICABLE'` ; **aucune structure OHADA en dur**, **aucun titre de note inventé**.
- [ ] **Unités mineures XOF** ; total de note hors `Number.isSafeInteger` → **400** (`MONTANT_HORS_BORNES`).
- [ ] Compte au format invalide / corps mal formé → **400** (jamais 500).
- [ ] Sans jeton → **401** ; gate refusé → **403** `{ code }` (`EMAIL_NOT_VERIFIED` | `KYC_NOT_APPROVED` | `BILAN_NOT_ENTITLED`). Référentiel non résolu/indisponible → 409/500/503 via `toHttpFromReferentielError`.
- [ ] **Non-régression** : `bilan/dry-run` (059), `compte-resultat/dry-run` (060), `tft/dry-run` (061) inchangés ; **aucune modification de référentiel** (checksums 056/057 inchangés).

---

## Technical Notes

### Composants

- **Nouveau** : `src/modules/bilan/etats/notes-annexes-production.service.ts` (**pur**) + `.spec.ts` ; `src/modules/bilan/etats/notes-annexes.types.ts` (`PosteNote`, `NoteAnnexe`, `StatutNote`, `StatutNotesAnnexes`, `NotesAnnexesProduit`).
- **Nouveau** : `dto/notes-annexes-response.dto.ts` (`PosteNoteDto`, `NoteAnnexeDto`, `NotesAnnexesDto`). **Corps** = `BilanDryRunRequestDto` réutilisé.
- **Étendu** : `bilan-engine.service.ts` → `produireNotesAnnexes(...)` (produit Bilan + CR, puis notes) ; `bilan-diagnostics.controller.ts` → `POST /bilan/etats/notes-annexes/dry-run` (mêmes gardes + mapper d'erreurs + `toEffectiveStamp`) ; `bilan.module.ts` → provider `NotesAnnexesProductionService`.
- **Réutilisés inchangés** : `BilanProductionService`, `CompteResultatProductionService`, `ReferentielLoader`, `MappingOverrideRepository`, `toHttpFromReferentielError`, `toEffectiveStamp`, `MontantHorsBornesError`, `@RequiresBilanAccess`, `LigneSoldeDto`, `PosteEtat.note`.

### Algorithme (`NotesAnnexesProductionService.produire(pkg, bilan, cr)`)

1. Construire un **index des montants produits** : `('BILAN_ACTIF'|code) → netN/netN1`, `('BILAN_PASSIF'|code) → montantN/montantN1`, `('COMPTE_RESULTAT'|code) → montantN/montantN1` (produits **et** charges).
2. Parcourir `pkg.postes`, filtrer ceux avec `note` significative (≠ absente, ≠ `'NOTE'`). Regrouper par `note`, **ordre = première apparition dans le référentiel**.
3. Pour chaque note : `postes = [{ etat, code, libelle, montantN, montantN1 }]` (montant = index produit, **0** si absent) ; `totalN`/`totalN1` = Σ (borné) ; `statut='CALCULE'` ; `detailACompleter=true` ; `libelle=null`.
4. `notes` vide → `statut='NON_APPLICABLE'` ; sinon `statut='CALCULE'`.

### Sécurité / robustesse

- `orgId` **exclusivement du JWT** ; corps = soldes uniquement (validation `whitelist` + `forbidNonWhitelisted`, hérité de `BilanDryRunRequestDto`).
- Aucune écriture en base (dry-run) → **pas de transaction Mongo**.
- Anti-500 : entrées non-tableau / types erronés → 400 (précédent 055/059/060/061).

### Edge cases

- **N-1 absent** → `montantN1`/`totalN1` **nuls**.
- **Poste déclaré avec renvoi mais non produit** (aucun compte mappé) → montant **0**, présent dans la note (jamais silencieusement retiré).
- **SFD-BCEAO** (0 renvoi) → `notes:[]`, `NON_APPLICABLE`.
- **Plusieurs postes → même note** → agrégés dans la même `NoteAnnexe` (cas nominal SYSCOHADA : note 3 = AD+AI+AP).
- **Total de note hors bornes** → `MontantHorsBornesError` → 400.

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** STORY-059 (Bilan produit + `PosteActif`/`PostePassif`), STORY-060 (CR produit + `PosteResultat`), STORY-061 (patron `CALCULE`/`A_COMPLETER` + endpoint jumeau + `PosteEtat.note`), STORY-055/056/057/058 (mapping + référentiels + surcharges), STORY-037/054 (gate + garde ACTIVE).

**Dépendance périmée (documentée) :** ~~STORY-052 (N-1)~~ — EPIC-009 `superseded` ; N-1 = 2ᵉ jeu de soldes.

**Stories débloquées :** STORY-063 (articulation Bilan↔CR↔TFT↔notes — rapprochera les totaux de note aux états), STORY-064/065 (validation + snapshot). **Tech-spec B8** (structures de note détaillées) — prérequis à la story d'extension qui remplira les zones « à compléter ».

**Dépendances externes :** aucune (référentiels embarqués ; JWT RS256 de l'IdP).

---

## Definition of Done

- [ ] Code implémenté (français) ; `NotesAnnexesProductionService` **pur** et **référentiel-agnostique** ; **aucun titre de note ni table inventés** (P7).
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (module `etats` visé 100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : index des renvois, note = postes contributeurs + total (N et N-1), montant repris par `etat` (actif/passif/CR), poste déclaré non produit → 0, `libelle` null + `detailACompleter` true, plusieurs postes → même note, N-1 absent ⇒ colonnes nulles, SFD → `notes:[]` `NON_APPLICABLE`, bornes safe-integer — **sur les deux référentiels**.
- [ ] Tests **e2e** (contrat HTTP, données mockées) : 200 nominal, 400 (compte invalide / bornes), 401 (sans jeton), 403 (gate), N-1 optionnel.
- [ ] **Vérification docker réelle obligatoire** (la story n'écrit pas en base ⇒ preuve = **calcul de bout en bout sur stack vivante**, JWT RS256 réel de l'IdP, read-models entitlement semés) : notes SYSCOHADA générées avec postes contributeurs + totaux **repris fidèlement** de `bilan/dry-run` (059) sur les mêmes soldes (rapprochement manuel) ; `detailACompleter=true` + `libelle=null` ; **SFD → `notes:[]` `NON_APPLICABLE`** ; N-1 renseigné ; borne → 400 ; sans jeton → 401 ; entitlement REVOKED → 403 ; **non-régression** `/health` 200 sur 8 services + `bilan`/`compte-resultat`/`tft` dry-run inchangés. Consigné dans *Progress Tracking*.
- [ ] Endpoint documenté dans **Swagger** (`/api/docs`).
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Moteur `NotesAnnexesProductionService` (index renvois + collecte postes + totaux N/N-1 + statut) :** 2 points
- **Endpoint + DTO + câblage engine (Bilan + CR) + Swagger :** 1,5 point
- **Tests (unit + e2e, 2 référentiels) + vérif docker :** 1,5 point
- **Total :** 5 points

**Rationale :** état réel de la liasse (notes annexes) mais sur les rails de 059/060/061 (états produits, gardes, corps réutilisé, patron `CALCULE`/`A_COMPLETER`). Le risque « deviner des règles OHADA » est **éliminé** : on ne produit que la **synthèse des renvois déjà déclarés** (numéro + postes + montants repris des états) ; **titres de notes, tables détaillées et mouvements** sont **explicitement hors périmètre** (hook B8) car non déclarés dans les paquets et non dérivables des soldes (et absents du SFD → agnosticisme).

---

## Additional Notes

- **Précédents de re-cadrage assumés** : 059 (`FORMULE`), 060 (SIG), 061 (retraitements TFT) ont déjà écarté ce qui n'est ni machine-exploitable ni agnostique → B8. 062 applique le **même principe** : la synthèse des renvois est calculable et agnostique ; le contenu détaillé des notes ne l'est pas → « à compléter ».
- **FR-012 est Should Have** et **cadre elle-même** le compromis (« calculable généré / non déductible à compléter ») : la story livre exactement cela, sans sur-ingénierie.
- **Aucune modification de référentiel** (contrairement à 061) : le renvoi `note` existe déjà dans le contrat (`PosteEtat.note`, STORY-038) → **checksums 056/057 inchangés**.
- **Hook articulation (063)** : les totaux de note fournis ici seront **rapprochés** des totaux d'états par STORY-063 (FR-013) ; 062 ne fait que **produire**, pas contrôler.

---

## Progress Tracking

**Status History :**
- 2026-07-19 : Créée (Scrum Master) — re-cadrée après lecture des deux paquets (aucune table d'annexe ; seuls des **renvois de note** `PosteEtat.note` ; SYSCOHADA 13 renvois BILAN_ACTIF, SFD 0). Périmètre = **synthèse calculable des renvois + zones à compléter** (patron 061), tables détaillées différées en tech-spec B8. Aucun fork P7 (pas de modif de paquet, pas de titre inventé) → cadré sans question.
- 2026-07-19 : Implémentée + vérifiée docker réelle + intégrée dans `dev` (MNV-062, PR #13 bilan-service).

**Implémentation (dev-story, 2026-07-19) :**
- `NotesAnnexesProductionService` (pur, aucune I/O) : indexe `note → postes` depuis `PosteEtat.note` (en-tête `'NOTE'` et postes sans note ignorés, ordre du référentiel), reprend le **montant produit** par `etat|code` (Bilan actif `netN`, passif `montantN`, CR `montantN`, N/N-1), calcule le **total par note** (borné safe-integer). `libelle: null` (titre non fourni → **jamais inventé, P7**) + `detailACompleter: true` (détail/mouvements/narratif = **hook B8**). Poste déclaré avec renvoi mais **non produit** → montant **0**. `notes:[]` + `statut='NON_APPLICABLE'` si aucun renvoi (SFD).
- `BilanEngineService.produireNotesAnnexes` (résout référentiel + garde ACTIVE + surcharges VALIDATED → **produit Bilan 059 + CR 060** → notes) ; endpoint gardé `POST /bilan/etats/notes-annexes/dry-run` (corps `BilanDryRunRequestDto` réutilisé ; tampon `toEffectiveStamp`).
- **Aucune modification de référentiel** (le renvoi `note` existe déjà dans le contrat `PosteEtat.note`) → **checksums 056/057 inchangés** (contrairement à 061). Articulation notes↔états = STORY-063.
- **Qualité** : lint **0** · build OK · **275 unit + 64 e2e verts** · `notes-annexes-production.service.ts` **100 %** (tous critères) · global **98.04/92.43/97.95/97.86** > seuils 65/90/90/90. Services 059/060/061 + mapping/surcharges **inchangés** (non-régression e2e verte).

**Vérification docker RÉELLE** (stack vivante 8 services healthy — bilan-service redémarré pour charger le nouvel endpoint ; JWT RS256 réel de l'IdP org `6a5cbdcd…`, read-models semés) :
1. **Notes nominal SYSCOHADA** (BI/Clients note 7 = 500 000 ; BS/Banques note 11 = 300 000) → `statut='CALCULE'`, **11 notes** (tous les renvois 3-12,17 déclarés), note 7 `totalN=500 000`/`totalN1=400 000`, note 11 `totalN=300 000` ; **toutes `libelle:null` + `detailACompleter:true`** ; stamp `cb8a7e11…`.
2. **Cross-check** `bilan/dry-run` (059) sur mêmes soldes : BI `netN=500 000`, BS `netN=300 000` = totaux des notes (**rapprochement indépendant**).
3. **RÉFÉRENTIEL-AGNOSTIQUE** — bascule org → `sfd-bceao@1.0` (0 renvoi) : `notes:[]`, `statut='NON_APPLICABLE'`. **Aucune structure OHADA en dur, aucun titre de note inventé.**
4. Total de note hors bornes → **400** ; sans jeton → **401** ; entitlement `REVOKED` → **403 BILAN_NOT_ENTITLED**.
5. **Non-régression** : `bilan`/`compte-resultat`/`tft` dry-run (059/060/061) → 200 ; `/health` **200 sur les 8 services**.

**Effort réel :** 5 points (conforme).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implémentation).**
