# STORY-061 : Tableau des flux de trésorerie (TFT/TAFIRE) — squelette du référentiel + contrôle de variation de trésorerie (TFT = Bilan N/N-1) — FR-011

**Epic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-011 (TFT/TAFIRE : flux exploitation/investissement/financement **selon le référentiel** ; **contrôle : variation de trésorerie du TFT = variation de trésorerie du Bilan N vs N-1**)
**Réf. logique métier :** `docs/rapport-bilan-logique-metier-2026-07-12.md` (liasse GUIDEF/DSF Togo — TAFIRE/TFT SYSCOHADA en cascade ; sections **Trésorerie-Actif** / **Trésorerie-Passif** du Bilan)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de règle comptable codée en dur ; contrat « minimal et extensible » — **champs additifs sans casser le loader**) ; §« tech-spec Bilan **B8** à rédiger » ; CLAUDE.md §Definition of Done, §Anti-énumération, §« ne devine jamais une API »
**Réf. code livré :** STORY-059 (`BilanProductionService` **pur** → `BilanProduit { actif: PosteActif[], passif: PostePassif[], controle }` ; postes d'actif portent `netN`/`netN1`, de passif `montantN`/`montantN1` ; endpoint gardé `POST /bilan/etats/bilan/dry-run` ; `MontantHorsBornesError`) · STORY-060 (`CompteResultatProductionService` + `coherenceResultat` : **précédent exact du hook de cohérence inter-états** ; endpoint jumeau `compte-resultat/dry-run` ; corps `BilanDryRunRequestDto` réutilisé) · STORY-055 (`TableDePassageService`) · STORY-056/057 (référentiels packagés `syscohada-revise@2.1`, `sfd-bceao@1.0` : postes `etat='TFT'` **SYSCOHADA uniquement** ; générateur `scripts/referentiels/build.mjs` + manifeste `ReferentielRegistry`) · STORY-058 (surcharges VALIDATED) · STORY-037/054 (gate `@RequiresBilanAccess` + garde ACTIVE) · STORY-101 balance-service (`BalanceCanonique` : **unités mineures XOF entières**, bornes `Number.isSafeInteger`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker réelle + intégrée dans `dev` le 2026-07-19 — PR #12 bilan-service, MNV-061 rebase-merge ; doc PR #15 prospera-stories)
**Assigné à :** vivian
**Créée :** 2026-07-19
**Sprint :** 12

---

## User Story

**En tant que** gestionnaire comptable d'une organisation (cabinet / entreprise),
**je veux** produire le **Tableau des flux de trésorerie (TFT/TAFIRE)** de mon exercice dans la structure de mon référentiel, avec la **variation de trésorerie de la période** contrôlée contre celle de mon Bilan (N vs N-1),
**afin de** disposer de l'état de trésorerie de la liasse OHADA, **articulé et vérifié** contre mon Bilan, en sachant explicitement quelles lignes restent **à compléter**.

---

## Description

### Contexte & re-cadrage (⚠️ lire AVANT de coder)

STORY-061 est la **3ᵉ story d'EPIC-011**, dans le prolongement de STORY-059 (Bilan, FR-009) et STORY-060 (CR, FR-010). Comme ses deux prédécesseures, elle **réutilise l'acquis** et **re-cadre le périmètre contre la réalité du service et des référentiels** — mais le TFT impose un re-cadrage **plus tranché** que 060, qui a été **lu dans les deux paquets** et **arbitré avec le PO** (décision périmètre confirmée le 2026-07-19) :

1. **bilan-service n'a PAS de balance** (EPIC-009 `superseded`) ⇒ TFT **produit à partir de soldes fournis** via un **endpoint diagnostic `dry-run` gardé**, jumeau de `bilan/dry-run` (059) et `compte-resultat/dry-run` (060). Corps `BilanDryRunRequestDto` **réutilisé**.
2. **Le comparatif N-1** est fourni comme **second jeu de soldes optionnel** — et ici il est **structurellement nécessaire** : la variation de trésorerie n'a de sens qu'entre N et N-1. N-1 absent ⇒ ouverture/variation **indéterminables** (jamais inventées).
3. **⚠️ Invariant P7 maintenu**, mais avec une **découverte structurante décisive** (ci-dessous) : le TFT **n'est PAS agrégeable par la `regle`** — contrairement au Bilan et au CR.

### Découverte structurante — le TFT n'est pas agrégeable par `regle` (lecture des deux paquets)

Lecture de `referentiel/assets/*.json`, `postes[]` **et** `tableDePassage[]` :

- **La `tableDePassage` (le mapping machine-exploitable poste→comptes+`regle`) a `0` entrée `etat='TFT'`** dans **les deux** référentiels. Les **26 postes `TFT` de SYSCOHADA** ne sont qu'un **squelette d'affichage** (`{ etat, code, libelle, note }`, **aucune `regle`, aucun compte rattaché**). Leurs formules vivent **uniquement dans le texte du libellé** : « Flux de trésorerie provenant des activités opérationnelles **(somme FA à FE)** », « VARIATION DE LA TRESORERIE NETTE **( B+C+F)** », « Trésorerie nette au 31 Décembre **(G+A)** », « Trésorerie nette au 1er janvier **(Trésorerie actif N-1 - Trésorerie passif N-1)** ».
- **SFD-BCEAO n'a AUCUN poste `TFT`** (0 poste, 0 mapping) — et ses comptes de classe 5 vont même en « Provisions, fonds propres » (BP4). Toute structure TFT SYSCOHADA **codée en dur** serait **vide et sémantiquement fausse** pour SFD ⇒ **violerait P7**.
- Les lignes de détail (FA « CAFG », FB « Actif circulant HAO », FC « Variation des stocks », FD « Variation des créances », FK « Augmentation de capital », FO « Emprunts »…) exigent des **retraitements comptables** (CAFG dérivée du CR, **variations N/N-1 par poste**, classification exploitation/investissement/financement) **non dérivables d'une agrégation de soldes par `regle`**.

⇒ C'est **exactement la classe de problème** déjà écartée en 059 (sous-totaux `FORMULE`) et 060 (SIG XA..XI), mais **poussée à l'extrême** : le TFT est **intégralement** formule/retraitement, **sans aucune tranche calculable par `regle`**. Les retraitements détaillés relèvent donc de la **tech-spec Bilan B8** (encore **à rédiger** — même parking que 059/060).

### Ce que 061 livre malgré tout — le SEUL calcul machine-exploitable et agnostique de FR-011

FR-011 exige **explicitement** (AC-2) un **contrôle** : *« variation de trésorerie du TFT = variation de trésorerie du Bilan (N vs N-1) »*. C'est **la seule** quantité du TFT calculable de façon **machine-exploitable** et **référentiel-agnostique** — à une condition : **identifier la trésorerie** dans le Bilan. Or le référentiel n'a **aujourd'hui aucun marqueur** de trésorerie, et coder « classe 5 » ou « postes BQ/BS » **en dur violerait P7** (et serait faux pour SFD).

**Décision périmètre (arbitrée avec le PO le 2026-07-19) — enrichir les paquets d'un marqueur trésorerie minimal et sourcé, puis livrer le contrôle.** 061 est donc, dans l'esprit 059/060, la **« tranche calculable »** du TFT :

1. **Enrichir le référentiel** (1ʳᵉ fois que l'épic touche les paquets) d'un **marqueur trésorerie** additif, **sourcé de la liasse** (sections **Trésorerie-Actif** / **Trésorerie-Passif** du Bilan DSF), **agnostique** : chaque référentiel déclare ses postes de trésorerie, **ou aucun**.
2. **Émettre le squelette TFT** du référentiel (postes `etat='TFT'` ordonnés, `code`+`libelle`), avec un **statut par ligne** : `CALCULE` pour les **ancres de trésorerie** calculables, `A_COMPLETER` pour tout le reste (retraitements → hook B8).
3. **Calculer les ancres de trésorerie** depuis le **Bilan produit** (059) sur les mêmes soldes :
   - **Trésorerie nette N** = Σ (`netN` des postes d'actif marqués trésorerie) − Σ (`montantN` des postes de passif marqués trésorerie).
   - **Trésorerie nette N-1** = idem sur les colonnes N-1 (`netN1`/`montantN1`).
   - **Ouverture** (poste TFT « au 1ᵉʳ janvier », ex. ZA) = **trésorerie N-1** ; **Clôture** (« au 31 décembre », ex. ZH) = **trésorerie N** ; **Variation de la période** (ex. ZG) = clôture − ouverture.
4. **Contrôle FR-011 AC-2** exposé comme `controleTresorerie = { variationTft, variationBilan, ecart, coherent }`, où `variationTft = clôture − ouverture` et `variationBilan = trésorerieBilanN − trésorerieBilanN-1`. **Nul par construction** (les deux dérivent des **mêmes** postes de trésorerie du **même** Bilan) — **précédent exact** de `coherenceResultat` (060). Sert de **hook** à l'articulation inter-états 063.

### Le marqueur trésorerie — additif, sourcé, agnostique (pas une règle devinée)

- **Champ additif** `MappingRule.tresorerie?: 'ACTIF' | 'PASSIF'` sur les entrées `tableDePassage` de **postes de Bilan** (le contrat référentiel autorise **explicitement** les champs additifs sans casser le loader). Le générateur `build.mjs` (`normMapping`) le **propage** ; les **sources** (`scripts/referentiels/sources/table-de-passage-*.json`) le **portent**.
- **SYSCOHADA** : marquer les postes de la liasse **Trésorerie-Actif** (BQ « Titres de placement », BR « Valeurs à encaisser », BS « Banques, chèques postaux, caisse ») `ACTIF` et **Trésorerie-Passif** (DQ « Banques, crédits d'escompte », DR « Banques, ets financiers et crédits de trésorerie ») `PASSIF`. **Transcription fidèle de la liasse** (le libellé ZA du TFT référence lui-même « Trésorerie actif − Trésorerie passif ») — **pas une règle inventée**, même provenance que les `comptesSyscohada` existants.
- **SFD-BCEAO** : **aucun** poste marqué (pas de section trésorerie identifiée dans sa liasse allégée ; pas de TFT) → TFT **vide**, contrôle **non applicable** — **preuve d'agnosticisme**.
- **Coût assumé (accepté PO)** : marquer les entrées SYSCOHADA change les octets de l'artefact ⇒ **régénérer** `syscohada-revise-2.1.json` via `build.mjs` et **mettre à jour son checksum** dans `ReferentielRegistry`. **SFD inchangé** (source non touchée → checksum `0509a034…` conservé).

### Unités & bornes

Montants en **unités mineures XOF entières** (aligné `BalanceCanonique`, STORY-101). Le Bilan sous-jacent (059) borne déjà chaque agrégation (`Number.isSafeInteger` → `MontantHorsBornesError` → 400) ; les sommes de trésorerie du TFT sont **bornées de la même façon** (réutilise `MontantHorsBornesError`).

---

## Scope

**Dans le périmètre :**

- **Enrichissement référentiel (marqueur trésorerie)** :
  - Champ additif `MappingRule.tresorerie?: 'ACTIF' | 'PASSIF'` (`referentiel-package.interface.ts`), propagé par `normMapping` (`build.mjs`).
  - Sources SYSCOHADA (`table-de-passage-syscohada.json`) : marquer BQ/BR/BS `ACTIF`, DQ/DR `PASSIF` (sourcé liasse). SFD **non touché**.
  - **Régénérer** `syscohada-revise-2.1.json` (`node scripts/referentiels/build.mjs`) + **mettre à jour le checksum SYSCOHADA** dans `ReferentielRegistry` (SFD inchangé).
- **`TftProductionService` (pur, aucune I/O)** — dépend du `BilanProduit` (059) + du `ReferentielPackage` :
  - Émet le **squelette TFT** : postes `etat='TFT'` **ordonnés selon le référentiel** (`pkg.postes`), chacun `{ etat:'TFT', code, libelle, note, montantN, statut }`, en **ignorant la ligne d'en-tête** (`code='Réf'`/libellé de colonne).
  - **Ancres de trésorerie calculées** (`statut='CALCULE'`, `montantN` renseigné) : ouverture (« 1ᵉʳ janvier »), clôture (« 31 décembre »), variation de la période — **identifiées par le rôle de trésorerie**, pas par un code TFT en dur (voir *Technical Notes* pour la résolution robuste des ancres).
  - **Toutes les autres lignes** (flux opérationnels/investissement/financement + détails FA..FQ) : `statut='A_COMPLETER'`, `montantN=null` (**hook B8**, jamais inventé).
  - **Trésorerie nette** N et N-1 dérivées du Bilan produit (postes marqués trésorerie).
- **Contrôle de variation de trésorerie (FR-011 AC-2)** : `controleTresorerie = { trStorNetteN, tresorerieNetteN1, variationTft, variationBilan, ecart, coherent }` ; `coherent` vrai ⟺ `ecart === 0` (nul par construction). N-1 absent ⇒ **`statut: 'INDETERMINABLE'`** (variation non calculable, jamais 0 arbitraire).
- **Endpoint diagnostic gardé** `POST /bilan/etats/tft/dry-run` (`@RequiresBilanAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)`), **200** (lecture, aucune persistance) :
  - Corps `BilanDryRunRequestDto` **réutilisé** (`{ soldesN, soldesN1? }`).
  - `orgId` **du JWT**. Résout le référentiel (garde ACTIVE 054) + surcharges VALIDATED, produit le Bilan (059), puis le TFT.
  - Réponse `TftDto` : `{ referentiel, stamp, postes: PosteTftDto[], tresorerieOuvertureN, tresorerieClotureN, variationTresorerieN, controleTresorerie }`.
- **`BilanEngineService.produireTft(orgId, soldesN, soldesN1?)`** = résout référentiel + surcharges → `BilanProductionService.produire(...)` → `TftProductionService.produire(pkg, bilan)`. Propage `toHttpFromReferentielError` ; `MontantHorsBornesError` → 400.
- **Non-régression** : `BilanProductionService` (059), `CompteResultatProductionService` (060), `TableDePassageService` (055), `mapping-override` (058), endpoints `bilan/dry-run`, `compte-resultat/dry-run`, `table-de-passage/dry-run` **inchangés**. L'ajout du champ `tresorerie` est **additif** (loader/moteurs existants indifférents).
- **Provisoire** (comme les jumeaux) : harnais de preuve e2e + docker tant que le consumer balance réel n'existe pas.
- Endpoint **documenté Swagger**.

**Hors périmètre (hooks inertes documentés — NE PAS déborder) :**

- **Retraitements TFT détaillés** — flux d'exploitation/investissement/financement et lignes FA..FQ (**CAFG** dérivée du CR, **variations N/N-1 par poste** de stocks/créances/dettes, classification par nature de flux), + **sous-totaux** ZB/ZC/ZD/ZE/ZF (sommes officielles). Formules **non exploitables par machine** (texte de libellé) et **spécifiques au référentiel** (absentes du SFD) → **tech-spec B8** / story d'extension de référentiel (spécification de formule/retraitement : opérandes/opérateurs + classification par poste). **FR-011 AC-1 livré en squelette « à compléter »**, pas calculé.
- **Placement du résultat / miroir amort** (059), **SIG** (060), **consumer réel `balance.created`** (EPIC-009 interop), **persistance / snapshot / validation** (EPIC-012), **articulation Bilan↔CR↔TFT** (063, consomme `controleTresorerie`), **annexes** (062), **export** (EPIC-014).

---

## User Flow

1. Le gestionnaire (org `bilan` `ACTIVE`, e-mail vérifié, KYC `APPROVED`) appelle `POST /bilan/etats/tft/dry-run` avec les soldes N (**+ N-1 pour la variation**).
2. Le service **résout** le référentiel de l'org — gate + garde ACTIVE + surcharges VALIDATED.
3. Il **produit le Bilan** (059) sur les mêmes soldes (postes actif/passif N + N-1).
4. Il **identifie la trésorerie** via le **marqueur** du référentiel → trésorerie nette N et N-1.
5. Il **émet le squelette TFT** du référentiel, **remplit les ancres** (ouverture = tréso N-1, clôture = tréso N, variation), marque le reste **« à compléter »**.
6. Il **contrôle** : `variationTft` vs `variationBilan` → `controleTresorerie` (ecart nul par construction ; `INDETERMINABLE` si N-1 absent).
7. Il renvoie le **TFT structuré** (+ tampon référentiel), **sans rien persister**. Pour une org **SFD** (sans TFT), la réponse est **vide** (`postes:[]`, contrôle non applicable).

---

## Acceptance Criteria

- [ ] `POST /bilan/etats/tft/dry-run` renvoie **200** avec un TFT structuré (`postes[]` du référentiel, ancres de trésorerie, `controleTresorerie`) pour un jeu de soldes N (+ N-1) valide (SYSCOHADA).
- [ ] **Squelette TFT selon le référentiel** (FR-011 AC-1, **en squelette**) : postes `etat='TFT'` avec code officiel + libellé du référentiel, **ordonnés**, ligne d'en-tête exclue ; chaque ligne porte un `statut` (`CALCULE` | `A_COMPLETER`). Les lignes de retraitement (flux exploitation/investissement/financement, FA..FQ, sous-totaux ZB/ZC/ZD/ZE/ZF) sont **`A_COMPLETER`** (`montantN=null`), **jamais inventées** (hook B8).
- [ ] **Contrôle de variation de trésorerie** (FR-011 AC-2) : `controleTresorerie` expose `variationTft`, `variationBilan`, `ecart`, `coherent` ; sur un même jeu de soldes N/N-1, `ecart=0` / `coherent=true` (variation TFT = variation de trésorerie du Bilan).
- [ ] **Ancres calculées** : ouverture = trésorerie nette **N-1**, clôture = trésorerie nette **N**, variation = clôture − ouverture — dérivées des **postes du Bilan marqués trésorerie** (059), en **unités mineures XOF**.
- [ ] **Marqueur trésorerie agnostique** : SYSCOHADA marque BQ/BR/BS (actif) + DQ/DR (passif) ; **SFD-BCEAO ne marque rien et n'a pas de TFT** → réponse `postes:[]`, `controleTresorerie.statut='NON_APPLICABLE'`, **aucune structure SYSCOHADA en dur**.
- [ ] **N-1 absent** ⇒ ouverture/variation `null`, `controleTresorerie.statut='INDETERMINABLE'` (clôture = trésorerie N reste calculée) ; jamais de variation arbitraire à 0.
- [ ] **Unités mineures XOF entières** ; agrégation hors `Number.isSafeInteger` → **400** (`MONTANT_HORS_BORNES`).
- [ ] Compte au format invalide / corps mal formé → **400** (jamais 500).
- [ ] Sans jeton → **401** ; gate refusé → **403** `{ code }` (`EMAIL_NOT_VERIFIED` | `KYC_NOT_APPROVED` | `BILAN_NOT_ENTITLED`) ; org d'un autre tenant non exposée. Référentiel non résolu/indisponible → 409/500/503 via `toHttpFromReferentielError`.
- [ ] **Intégrité référentiel** : `syscohada-revise-2.1.json` régénéré, **checksum mis à jour** dans `ReferentielRegistry` → chargement `verified` (pas de `ReferentielIntegrityError`). **SFD checksum inchangé**.
- [ ] **Non-régression** : `bilan/dry-run` (059), `compte-resultat/dry-run` (060), `table-de-passage/dry-run` (055) inchangés ; le champ `tresorerie` additif ne modifie aucun état produit existant.

---

## Technical Notes

### Composants

- **Modifié (additif)** : `referentiel/referentiel-package.interface.ts` → `MappingRule.tresorerie?: 'ACTIF' | 'PASSIF'`. `scripts/referentiels/build.mjs` → `normMapping` propage `tresorerie` (`...(r.tresorerie ? { tresorerie: r.tresorerie } : {})`, ordre de clés figé pour le déterminisme). `scripts/referentiels/sources/table-de-passage-syscohada.json` → `tresorerie` sur BQ/BR/BS/DQ/DR.
- **Régénéré** : `referentiel/assets/syscohada-revise-2.1.json` (via `build.mjs`). **Mis à jour** : `referentiel/referentiel-registry.ts` (checksum SYSCOHADA = nouveau sha256 imprimé par le générateur).
- **Nouveau** : `src/modules/bilan/etats/tft-production.service.ts` (**pur**) + `.spec.ts` ; `src/modules/bilan/etats/tft.types.ts` (`PosteTft`, `StatutLigneTft`, `ControleTresorerie`, `TftProduit`).
- **Nouveau** : `dto/tft-response.dto.ts` (`PosteTftDto`, `ControleTresorerieDto`, `TftDto`). **Corps** = `BilanDryRunRequestDto` réutilisé.
- **Étendu** : `bilan-engine.service.ts` → `produireTft(...)` ; `bilan-diagnostics.controller.ts` → `POST /bilan/etats/tft/dry-run` (mêmes gardes + mapper d'erreurs + `toEffectiveStamp`) ; `bilan.module.ts` → provider `TftProductionService`.
- **Réutilisés inchangés** : `BilanProductionService`, `ReferentielLoader`, `MappingOverrideRepository`, `toHttpFromReferentielError`, `toEffectiveStamp`, `MontantHorsBornesError`, `@RequiresBilanAccess`, `LigneSoldeDto`.

### Algorithme (`TftProductionService.produire(pkg, bilan)`)

1. **Trésorerie du Bilan** : construire `actifTreso = { poste codes | tableDePassage.tresorerie === 'ACTIF' }`, `passifTreso = { … === 'PASSIF' }`. `tresorerieN = Σ bilan.actif[p∈actifTreso].netN − Σ bilan.passif[p∈passifTreso].montantN` ; `tresorerieN1` idem sur `netN1`/`montantN1` (⇒ `null` si N-1 absent). Bornes `Number.isSafeInteger` (`MontantHorsBornesError`).
2. **Squelette** : `pkg.postes.filter(etat==='TFT')`, exclure l'en-tête (`code==='Réf'`/`'Réf.'`). Ordre = ordre du référentiel.
3. **Résolution des ancres** (robuste, référentiel-agnostique — **ne pas coder `ZA`/`ZG`/`ZH` en dur** : SFD n'en a pas, et un futur référentiel aurait d'autres codes) : reconnaître les 3 ancres par **normalisation du libellé** (ouverture ⊃ « au 1er janvier » / « ouverture » ; clôture ⊃ « au 31 décembre » / « clôture » ; variation ⊃ « variation de la trésorerie »). Renseigner `montantN` (ouverture=`tresorerieN1`, clôture=`tresorerieN`, variation=`clôture−ouverture`) + `statut='CALCULE'`. Fallback documenté si aucune ancre reconnue (référentiel sans ancre) → toutes lignes `A_COMPLETER`, contrôle `NON_APPLICABLE`.
4. Toute autre ligne : `montantN=null`, `statut='A_COMPLETER'`.
5. **Contrôle** : `variationTft = clôtureMontant − ouvertureMontant` ; `variationBilan = tresorerieN − tresorerieN1` ; `ecart = variationTft − variationBilan` ; `coherent = ecart===0`. Si `tresorerieN1===null` → `statut='INDETERMINABLE'`. Si `postes` vide (SFD) → `statut='NON_APPLICABLE'`.

### Sécurité / robustesse

- `orgId` **exclusivement du JWT** ; corps = soldes uniquement (validation `whitelist` + `forbidNonWhitelisted`, `D`/`C` entiers ≥ 0, `@Max(MAX_SAFE_INTEGER)`, `ArrayMaxSize` — hérité de `BilanDryRunRequestDto`).
- Aucune écriture en base (dry-run) → **pas de transaction Mongo**.
- Anti-500 : entrées non-tableau / types erronés → 400 (précédent 055/059/060).

### Edge cases

- **N-1 absent** → ouverture/variation `null`, contrôle `INDETERMINABLE` ; clôture (tréso N) calculée.
- **SFD-BCEAO** (0 TFT, 0 marqueur) → `postes:[]`, contrôle `NON_APPLICABLE`, agnosticisme prouvé.
- **Poste marqué trésorerie absent du Bilan produit** (aucun compte rattaché sur ce jeu) → contribue 0 (jamais d'erreur).
- **Ligne d'en-tête TFT** (`code='Réf'`) → exclue.
- **Trésorerie N-1 renseignée mais ancre ouverture non reconnue** → fallback (contrôle `NON_APPLICABLE`), tracé.
- **Agrégation trésorerie hors bornes** → `MontantHorsBornesError` → 400.

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** STORY-059 (Bilan produit + postes `netN`/`montantN` + N-1 + `MontantHorsBornesError`), STORY-060 (précédent du hook de cohérence inter-états + endpoint jumeau + corps réutilisé), STORY-055 (mapping), STORY-056/057 (référentiels packagés + `build.mjs` + `ReferentielRegistry`), STORY-058 (surcharges), STORY-037/054 (gate + garde ACTIVE).

**Dépendance périmée (documentée) :** ~~STORY-052 (N-1)~~ — EPIC-009 `superseded` ; N-1 = 2ᵉ jeu de soldes.

**Stories débloquées :** STORY-063 (articulation Bilan↔CR↔TFT — consomme `controleTresorerie`), STORY-062 (annexes), STORY-064/065 (validation + snapshot). **Tech-spec B8** (retraitements TFT + spécification de formule référentiel) — prérequis à la story d'extension qui remplira les lignes `A_COMPLETER`.

**Dépendances externes :** aucune (référentiels embarqués ; JWT RS256 de l'IdP).

---

## Definition of Done

- [ ] Code implémenté (français) ; `TftProductionService` **pur** et **référentiel-agnostique** ; marqueur trésorerie **additif** (sourcé liasse, jamais une règle devinée).
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (module `etats` visé 100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : trésorerie N/N-1 depuis le Bilan marqué, ancres (ouverture=tréso N-1, clôture=tréso N, variation), `coherent` (ecart 0), lignes retraitement `A_COMPLETER` (`montantN=null`), N-1 absent ⇒ `INDETERMINABLE`, SFD ⇒ `postes:[]` + `NON_APPLICABLE`, en-tête exclue, bornes safe-integer — **sur les deux référentiels**.
- [ ] Test **intégrité référentiel** : checksum SYSCOHADA régénéré = celui du manifeste (chargement `verified`) ; **SFD inchangé** ; `build.mjs` reste **déterministe** (ré-exécution ⇒ même octet).
- [ ] Tests **e2e** (contrat HTTP, données mockées) : 200 nominal, 400 (compte invalide / bornes), 401 (sans jeton), 403 (gate), N-1 optionnel.
- [ ] **Vérification docker réelle obligatoire** (la story n'écrit pas en base ⇒ preuve = **calcul de bout en bout sur stack vivante**, JWT RS256 réel de l'IdP, read-models entitlement semés) : sur un même jeu N/N-1, TFT `variationTft` **égale** `variationBilan` (`coherent=true`, `ecart=0`) et **égale** la variation des postes de trésorerie de `bilan/dry-run` (059) ; lignes retraitement `A_COMPLETER` ; **SYSCOHADA ET SFD** (SFD → `postes:[]`, `NON_APPLICABLE`) ; N-1 absent → `INDETERMINABLE` ; borne → 400 ; sans jeton → 401 ; entitlement REVOKED → 403 ; **non-régression** `/health` 200 sur 8 services + `bilan/dry-run` (059) & `compte-resultat/dry-run` (060) inchangés ; **checksum SYSCOHADA vérifié en conteneur**. Consigné dans *Progress Tracking*.
- [ ] Endpoint documenté dans **Swagger** (`/api/docs`).
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Enrichissement référentiel (marqueur trésorerie additif + sources + `build.mjs` + régénération checksum + manifeste) :** 1 point
- **Moteur `TftProductionService` (squelette + trésorerie N/N-1 + ancres + statut + contrôle) :** 2 points
- **Endpoint + DTO + câblage engine + Swagger :** 1 point
- **Tests (unit + e2e + intégrité, 2 référentiels) + vérif docker :** 1 point
- **Total :** 5 points

**Rationale :** cœur comptable réel (état de trésorerie + contrôle d'articulation FR-011 AC-2) sur les rails de 059/060 (Bilan produit, gardes, corps réutilisé, précédent `coherenceResultat`). Le risque « deviner des règles OHADA » est **circonscrit** : (a) le marqueur trésorerie est une **transcription sourcée** de la liasse, pas une formule ; (b) tous les **retraitements** (FA..FQ, CAFG, sous-totaux, flux détaillés) sont **explicitement hors périmètre** (hook B8), car non exploitables par machine et absents du SFD — les coder violerait P7. FR-011 AC-1 est livré **en squelette « à compléter »** assumé.

---

## Additional Notes

- **Précédents de re-cadrage assumés** : 059 (sous-totaux `FORMULE`) et 060 (SIG XA..XI) ont déjà écarté les formules non exploitables → B8. 061 pousse le raisonnement à son terme : le TFT est **intégralement** de cette nature, d'où le choix « squelette + contrôle de trésorerie » plutôt que d'inventer des retraitements.
- **Cohérence par construction** : `variationTft` et `variationBilan` dérivent des **mêmes** postes de trésorerie du **même** Bilan → écart nul par construction. `controleTresorerie` **matérialise** FR-011 AC-2 de bout en bout et sert de **hook** à l'articulation inter-états 063 (qui comparera des états produits séparément).
- **1ʳᵉ modification des paquets référentiels de l'épic** : décision périmètre arbitrée avec le PO (2026-07-19). Le marqueur est **additif** et **agnostique** (SFD n'en déclare aucun) ; le coût = régénération du checksum SYSCOHADA (déterministe). Ne PAS toucher SFD (préserver son checksum).
- **Question ouverte (héritée 059/060)** : format exact des soldes du futur handoff `balance.created` — le DTO (`{ soldeDebiteur, soldeCrediteur }`) s'aligne sur `BalanceCanonique` (101).

---

## Progress Tracking

**Status History :**
- 2026-07-19 : Créée (Scrum Master) — re-cadrée après lecture des deux paquets (0 mapping TFT ; SFD sans TFT ; formules texte-only) ; décision périmètre **enrichir les paquets + livrer le contrôle de trésorerie** arbitrée avec le PO ; retraitements FA..FQ/CAFG/sous-totaux différés en tech-spec B8 (même parking que 059/060).
- 2026-07-19 : Implémentée + vérifiée docker réelle (en attente `/code-review` + intégration `dev`).

**Implémentation (dev-story, 2026-07-19) :**
- **Enrichissement référentiel (marqueur trésorerie)** : champ additif `MappingRule.tresorerie?: 'ACTIF' | 'PASSIF'` (`referentiel-package.interface.ts`), propagé par `normMapping` (`build.mjs`, en dernière clé → non-régression octet des lignes non-trésorerie). Sources SYSCOHADA (`table-de-passage-syscohada.json`) : BQ/BR/BS `ACTIF`, DQ/DR `PASSIF` (transcription liasse Trésorerie-Actif/Passif, **pas une règle**). Artefact `syscohada-revise-2.1.json` **régénéré** ; checksum `ReferentielRegistry` `e9370b14…` → **`cb8a7e116f9de80001a805ae074b2a7a03a0851c04e18cf980ddfb5e20f9a691`**. **SFD inchangé** (`0509a034…`, aucun marqueur — agnostique).
- **`TftProductionService`** (pur, aucune I/O) : squelette TFT ordonné (en-tête `Réf` exclue) + statut par ligne (`CALCULE`/`A_COMPLETER`) ; **ancres** ouverture=tréso N-1, clôture=tréso N, variation=clôture−ouverture, dérivées du **Bilan produit** (059) via les postes marqués trésorerie (actif `netN` − passif `montantN`) ; **résolution d'ancre par libellé** (janvier/décembre/variation+trésorerie), référentiel-agnostique (jamais `ZA`/`ZH` en dur) ; bornes safe-integer (`MontantHorsBornesError` → 400).
- **`controleTresorerie` { statut, tresorerieNetteN/N1, variationTft, variationBilan, ecart, coherent }** matérialise FR-011 AC-2 (ecart 0 **par construction** : mêmes postes du même Bilan). `INDETERMINABLE` si N-1 absent ; `NON_APPLICABLE` si pas de TFT/marqueur (SFD). `BilanEngineService.produireTft` (résout référentiel + garde ACTIVE + surcharges VALIDATED → Bilan → TFT) ; endpoint gardé `POST /bilan/etats/tft/dry-run` (corps `BilanDryRunRequestDto` réutilisé ; tampon référentiel `toEffectiveStamp`).
- **Retraitements FA..FQ / CAFG / sous-totaux ZB..ZF** = `A_COMPLETER` (hook **tech-spec B8**), jamais inventés.
- **Qualité** : lint **0** · build OK · **264 unit** (+11 TFT service, +2 engine, +4 marqueur intégrité) + **57 e2e** (+7 TFT) **verts** · module `etats` **100/97.12/100/100** (`tft-production.service.ts` 100/96.15/100/100 — 2 branches `?? 0` défensives inatteignables vu le contrat Bilan, cf. lignes 138/126 de 059/060) · **global 98.58/92.28/98.39/98.45** > seuils 65/90/90/90. Services 055/058/059/060 **inchangés** (champ `tresorerie` additif ; non-régression e2e verte). SYSCOHADA conserve 26 postes TFT / 163 postes / 99 mappings.

**Vérification docker RÉELLE** (stack vivante 8 services healthy — **bilan-service redémarré** pour purger le cache référentiel en mémoire et charger l'artefact régénéré ; JWT RS256 réel de l'IdP — register+login org `6a5cbdcd…`, e-mail vérifié ; read-models `orgkycstatuses`/`orgbilanentitlements` semés via mongosh) :
1. **Intégrité** : `GET /bilan/referentiel` → checksum **`cb8a7e11…`**, `integrity: verified`, cache miss→hit (artefact régénéré chargé, manifeste synchronisé).
2. **TFT nominal SYSCOHADA** (tréso : BS 500 000 débit ; DR 200 000 crédit ; N-1 BS 350 000) → ouverture **150 000**, clôture **300 000**, variation **150 000** ; `controleTresorerie = { statut:'CALCULE', tresorerieNetteN:300 000, tresorerieNetteN1:150 000, variationTft:150 000, variationBilan:150 000, ecart:0, coherent:true }` ; ZA/ZG/ZH `CALCULE`, **22/25 lignes `A_COMPLETER`**, en-tête `Réf` exclue ; stamp `cb8a7e11…`.
3. **Cohérence prouvée par cross-check** `bilan/dry-run` (059) sur mêmes soldes : Bilan BS `netN`=500 000/`netN1`=350 000, DR `montantN`=200 000/`montantN1`=200 000 → trésorerie Bilan **300 000 / 150 000** = celle du TFT (contrôle **indépendant**).
4. **N-1 absent** → `controleTresorerie.statut='INDETERMINABLE'`, `coherent:false`, clôture 300 000, ouverture `null`.
5. **RÉFÉRENTIEL-AGNOSTIQUE** — bascule org → `sfd-bceao@1.0` (0 TFT, 0 marqueur) : `postes:[]`, `controleTresorerie.statut='NON_APPLICABLE'`, trésorerie `null`, `coherent:true`. **Preuve que la structure SYSCOHADA n'est pas codée en dur.**
6. Agrégation hors bornes → **400** ; sans jeton → **401** ; entitlement `REVOKED` → **403 BILAN_NOT_ENTITLED**.
7. **Non-régression** : `compte-resultat/dry-run` (060) → 200 intact ; `/health` **200 sur les 8 services** (balance-service `healthy`).

**Effort réel :** 5 points (conforme).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implémentation).**
