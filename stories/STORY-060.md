# STORY-060 : Compte de résultat (charges / produits + résultat net) — colonnes N/N-1 + cohérence résultat CR = résultat du Bilan — FR-010

**Epic :** EPIC-011 — États financiers (liasse OHADA : Bilan, CR, TFT/TAFIRE, annexes) — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** `docs/prd-bilan-service-2026-07-10.md` §FR-010 (Compte de résultat : charges/produits, soldes intermédiaires, résultat net, colonnes N/N-1 ; **cohérence : résultat net du CR = résultat repris au passif du Bilan**)
**Réf. logique métier :** `docs/rapport-bilan-logique-metier-2026-07-12.md` (liasse GUIDEF/DSF Togo — Compte de résultat en cascade, produits/charges, soldes intermédiaires de gestion)
**Réf. architecture :** `docs/architecture-bilan-service-2026-07-07.md` §Interface de référentiel (**invariant P7** : moteur **paramétré** par `ReferentielPackage`, jamais de règle comptable codée en dur) ; CLAUDE.md §Definition of Done, §Anti-énumération, §« ne devine jamais une API »
**Réf. code livré :** STORY-059 (`BilanProductionService` **pur** référentiel-agnostique : agrégation pilotée par la `regle`, dont `PRODUIT`/`CHARGE` → `resultatNet` ; endpoint gardé `POST /bilan/etats/bilan/dry-run` ; `BilanEngineService.produireBilan` ; DTO `LigneSoldeDto`, `MontantHorsBornesError`) · STORY-055 (`TableDePassageService.mapComptes` **pur**) · STORY-056/057 (référentiels packagés `syscohada-revise@2.1`, `sfd-bceao@1.0` : postes `etat='COMPTE_RESULTAT'`, règles `PRODUIT`/`CHARGE`, sous-totaux `FORMULE`) · STORY-058 (surcharges VALIDATED prioritaires) · STORY-037/054 (gate `@RequiresBilanAccess` + garde ACTIVE) · STORY-101 balance-service (contrat `BalanceCanonique` : **unités mineures XOF entières**, bornes `Number.isSafeInteger`)
**Priorité :** Must Have
**Story Points :** 5
**Statut :** done ✅ (implémentée + vérifiée docker réelle + revue + intégrée dans `dev` le 2026-07-19 — PR bilan-service, MNV-060 rebase-merge)
**Assigné à :** vivian
**Créée :** 2026-07-19
**Sprint :** 12

---

## User Story

**En tant que** gestionnaire comptable d'une organisation (cabinet / entreprise),
**je veux** générer le **Compte de résultat** de mon exercice (produits, charges, **résultat net**) à partir des soldes de mes comptes rattachés au référentiel, avec le **comparatif N-1**,
**afin de** disposer de l'état de performance de l'exercice, **articulé avec mon Bilan** (le résultat net du CR = le résultat reporté au passif du Bilan) et prêt à intégrer la liasse OHADA.

---

## Description

### Contexte & re-cadrage (⚠️ lire AVANT de coder)

STORY-060 est la **2ᵉ story d'EPIC-011**, dans le prolongement direct de STORY-059 (Bilan, FR-009). Elle **réutilise l'acquis 059** — mêmes conventions et mêmes garde-fous, **re-cadrés contre la réalité du service et des référentiels**, exactement comme 059 (précédents 055/099) :

1. **bilan-service n'a PAS de balance** (EPIC-009 `superseded`, D14 ; consumer réel `balance.created` **différé** — EPIC-009 interop). ⇒ STORY-060 **ne lit aucune balance** : elle **produit le CR à partir de soldes fournis** via un **endpoint diagnostic `dry-run` gardé**, jumeau de `POST /bilan/etats/bilan/dry-run` (059). Même contrat d'entrée (`LigneSoldeDto` réutilisé).
2. **Le comparatif N-1** est fourni comme **second jeu de soldes optionnel** dans la même requête (la dépendance historique « STORY-052 » appartenait à l'EPIC-009 superseded). N-1 absent ⇒ colonne comparative **vide** (jamais inventée — FR-003 AC).
3. **⚠️ Le calcul reste RÉFÉRENTIEL-AGNOSTIQUE (invariant P7).** Le moteur agrège **par la `regle` du poste** (`PRODUIT`/`CHARGE`), jamais par des préfixes de comptes ou une structure de CR codés en dur. Vérifié en lisant les deux paquets (voir *Découverte structurante* ci-dessous).

### Le résultat net est DÉJÀ calculé — 060 ajoute la restitution détaillée du CR

`BilanProductionService` (059) agrège déjà les comptes de règle `PRODUIT`/`CHARGE` dans un scalaire `resultatNet` (= Σ `crédit − débit`), reporté au **côté passif de l'équation** du contrôle actif=passif. Le delta 060 n'est **pas** de recalculer ce résultat, mais de **restituer le Compte de résultat en tant qu'état** :

- **détailler les postes** de produits et de charges (chaque poste `etat='COMPTE_RESULTAT'` de la table de passage, avec son code officiel + libellé du référentiel, alimenté par ses comptes rattachés — 055) ;
- exposer le **résultat net** de l'état (produits − charges), **identique par construction** au `resultatNet` du Bilan calculé sur les mêmes soldes ;
- rendre la **cohérence FR-010 AC-2 explicite et testable** : `résultat net du CR = résultat repris au passif du Bilan`.

### Contrat de calcul — agrégation pilotée par la `regle` (référentiel-agnostique)

Le CR ne consomme que les postes `etat='COMPTE_RESULTAT'` de la table de passage. Chaque compte mappé (`D`=`soldeDebiteur`, `C`=`soldeCrediteur`, unités mineures XOF) contribue **selon la `regle` de son poste** :

| `regle` | Sens | Montant présenté du poste | Contribution au résultat net |
|---|---|---|---|
| `PRODUIT` | Produit | **montant** += `C − D` (positif pour un produit normal) | `résultatNet` += `C − D` |
| `CHARGE` | Charge | **montant** += `D − C` (positif pour une charge normale) | `résultatNet` += `C − D` (une charge, à débit, **réduit** le résultat) |
| `FORMULE` / `type='total'` | — | **ignoré** (soldes intermédiaires officiels non calculés — voir *Hors périmètre*) | — |
| autres (`NET_ACTIF`, `SOLDE_*`…) | — | **non concernés** (postes de Bilan, autre `etat`) | — |

- **Résultat net** = `Σ (montant des produits) − Σ (montant des charges)` = `Σ_CR (C − D)`. C'est **exactement** la quantité que 059 porte au passif du contrôle d'équilibre → **cohérence garantie par construction** (même agrégation, mêmes soldes, même référentiel).
- **Pas de ventilation classes 4/5 au CR** : celle-ci ne concerne que les comptes de tiers/trésorerie (Bilan). Les postes CR portent des règles `PRODUIT`/`CHARGE` sur des comptes de classes 6/7/8 sans ambiguïté de côté.
- **Postes ordonnés selon le référentiel** (`pkg.postes` filtrés `etat='COMPTE_RESULTAT'`), comme les postes de Bilan (059).

### Découverte structurante — pourquoi les soldes intermédiaires (SIG) restent un hook

Lecture des deux paquets embarqués (`referentiel/assets/*.json`), `etat='COMPTE_RESULTAT'` :

- **SYSCOHADA révisé** : 33 postes `detail` (`PRODUIT`/`CHARGE`) **+ 9 postes `total` / `FORMULE`** = les soldes intermédiaires de gestion (**XA** Marge commerciale, **XB** Chiffre d'affaires, **XC** Valeur ajoutée, **XD** EBE, **XE** Résultat d'exploitation, **XF** Résultat financier, **XG** Résultat des activités ordinaires, **XH** Résultat HAO, **XI** Résultat net). Leur **formule n'existe que dans le libellé en texte** (« MARGE COMMERCIALE (Somme TA à RB) », « CHIFFRE D'AFFAIRES (A+B+C+D) »…) ; leur `comptesSyscohada` est **vide** : aucune formule **exploitable par machine**.
- **SFD-BCEAO** : 14 postes `detail` (`PRODUIT`/`CHARGE`) et **0 poste `FORMULE`** — le référentiel n'a **aucun** solde intermédiaire.

⇒ Les SIG sont **spécifiques à chaque référentiel** et **non sourcés de façon exploitable**. Les **coder en dur** (« XA = TA − RA − RB », etc.) **violerait P7** (structure SYSCOHADA en dur) **et** produirait **zéro** sortie pour SFD. Comme les sous-totaux `FORMULE` du Bilan (059), ils **restent un hook** : leur calcul exige d'**enrichir le référentiel** d'une spécification de formule exploitable (marqueurs d'opérandes/opérateur sur les postes `total`) → **tech-spec B8** / story d'extension de référentiel. **Non deviné ici.**

### Unités & bornes

Montants en **unités mineures XOF entières** (× 100), **aligné sur `BalanceCanonique`** (STORY-101) — sommation **exacte**, futur handoff `balance.created` branchable sans conversion. Bornes `Number.isSafeInteger` par ligne **et** par total agrégé (réutilise `MontantHorsBornesError` de 059) → dépassement = `400`.

---

## Scope

**Dans le périmètre :**

- **`CompteResultatProductionService` (pur, aucune I/O, aucune dépendance Mongo/Kafka)**, dépend de `TableDePassageService` (055) — réutilisable tel quel par les opérations métier (EPIC-009 interop, EPIC-012, articulation 063) :
  - Entrée : `ReferentielPackage` + surcharges VALIDATED (via l'engine) + `LigneSolde[]` pour **N** + `LigneSolde[]` optionnel pour **N-1**.
  - **Agrégation pilotée par la `regle`** (`PRODUIT`/`CHARGE`), **référentiel-agnostique** (SYSCOHADA **et** SFD).
  - **Postes `etat='COMPTE_RESULTAT'`** ordonnés selon le référentiel, chacun avec `code`, `libelle`, `sens` (`PRODUIT`|`CHARGE`), `montantN`, `montantN1` (`null` si N-1 absent).
  - **Résultat net** N (et N-1) = `Σ produits − Σ charges`.
  - **Totaux** : `totalProduitsN`, `totalChargesN`, `resultatNetN` (idem N-1).
  - **Comptes non mappés** (classe résultat) remontés explicitement.
  - Sous-totaux `FORMULE`/`type='total'` **ignorés** (hook — *Hors périmètre*).
- **Cohérence résultat (FR-010 AC-2)** exposée comme contrôle explicite : sur les **mêmes soldes**, le service produit aussi le résultat net « côté Bilan » (via `BilanProductionService` déjà câblé) et renvoie `coherenceResultat = { resultatNetCR, resultatNetBilan, ecart, coherent }` avec `ecart = resultatNetCR − resultatNetBilan` (nul par construction ; le champ rend l'invariant **vérifiable de bout en bout** et sert de hook à l'articulation 063).
- **Endpoint diagnostic gardé** `POST /bilan/etats/compte-resultat/dry-run` (`@RequiresBilanAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)`), **200** (lecture, aucune persistance) :
  - Corps : `{ soldesN: LigneSolde[], soldesN1?: LigneSolde[] }` — **`LigneSoldeDto` réutilisé** de 059 (compte `^\d[0-9A-Za-z]{1,19}$`, `D`,`C` entiers ≥ 0, `@Max(MAX_SAFE_INTEGER)`).
  - `orgId` **du JWT** (jamais du corps). Résout le référentiel (garde ACTIVE 054) + surcharges VALIDATED via `BilanEngineService`, puis les services purs.
  - Réponse `CompteResultatDto` : `{ referentiel, stamp, produits: PosteResultatDto[], charges: PosteResultatDto[], totalProduitsN, totalChargesN, resultatNetN, resultatNetN1, coherenceResultat, comptesNonMappes }`.
- **`BilanEngineService.produireCompteResultat(orgId, soldesN, soldesN1?)`** = `resolveReferentielForOrg` + `overrides.chargerSurchargesActives()` + `CompteResultatProductionService.produire(...)` + calcul du résultat Bilan pour la cohérence. Propage les erreurs de résolution/chargement (`toHttpFromReferentielError`) ; lève `MontantHorsBornesError` → 400.
- **Non-régression** : `BilanProductionService` (059), `TableDePassageService` (055), `mapping-override` (058), artefacts de référentiel (056/057), endpoints `bilan/dry-run` (059), `table-de-passage/dry-run` (055) **inchangés**. Le service pur nouveau se **branche en aval**.
- **Provisoire** (comme `bilan/dry-run`) : harnais de preuve e2e + docker tant que le consumer balance réel n'existe pas.
- Endpoints **documentés Swagger**.

**Hors périmètre (hooks inertes documentés — NE PAS déborder) :**

- **Soldes intermédiaires de gestion (SIG / postes `FORMULE` : XA..XI)** → formules **non exploitables par machine** (texte du libellé, `comptesSyscohada` vide) et **spécifiques au référentiel** (absentes du SFD). Les calculer exige d'**enrichir le référentiel** d'une spécification de formule (opérandes/opérateurs sur les postes `total`, sourcée OHADA) = **tech-spec B8** / story d'extension. **Non deviné ici** (P7).
- **Placement du résultat net dans un poste passif du Bilan** (CJ pour SYSCOHADA) → déjà **différé** en 059 (spécifique référentiel).
- **Consumer réel `balance.created`** → EPIC-009 interop. **Persistance / snapshot / validation** → EPIC-012. **TFT** (061), **annexes** (062), **articulation Bilan↔CR↔TFT** (063), **export** (EPIC-014), **fiscalité / résultat fiscal / liquidation IS** (`etat='RESULTAT_FISCAL'`/`LIQUIDATION_IS`, hors CR — balance-service EPIC-023/024).

---

## User Flow

1. Le gestionnaire (org `bilan` `ACTIVE`, e-mail vérifié, KYC `APPROVED`) appelle `POST /bilan/etats/compte-resultat/dry-run` avec les soldes cumulés (D/C) de ses comptes pour N (+ éventuellement N-1).
2. Le service **résout** le référentiel de l'org (SYSCOHADA révisé ou SFD-BCEAO) — gate + garde ACTIVE.
3. Il **rattache** chaque compte (surcharges org VALIDATED prioritaires — 058).
4. Il **agrège** les postes `etat='COMPTE_RESULTAT'` **selon la `regle`** : produits (`C − D`), charges (`D − C`), résultat net (produits − charges), pour N et N-1.
5. Il **contrôle la cohérence** : produit aussi le résultat « côté Bilan » sur les mêmes soldes → `coherenceResultat` (ecart nul par construction).
6. Il renvoie le **CR structuré** (postes + montants N/N-1 + totaux + résultat net + cohérence + comptes non mappés + tampon référentiel), **sans rien persister**.

---

## Acceptance Criteria

- [ ] `POST /bilan/etats/compte-resultat/dry-run` renvoie **200** avec un CR structuré (`produits[]`, `charges[]`, `resultatNetN`) pour un jeu de soldes N valide.
- [ ] **Produits, charges et résultat net calculés selon le référentiel** (FR-010 AC-1) : chaque poste `etat='COMPTE_RESULTAT'` porte son code officiel + libellé du référentiel, alimenté par ses comptes rattachés (055) **selon sa `regle`** (`PRODUIT`/`CHARGE`), sans structure de CR codée en dur.
- [ ] **Résultat net** N = `Σ montant(produits) − Σ montant(charges)`, exposé avec `totalProduitsN` et `totalChargesN`.
- [ ] **Cohérence CR ↔ Bilan** (FR-010 AC-2) : `coherenceResultat` expose `resultatNetCR`, `resultatNetBilan`, `ecart` et `coherent` ; sur un même jeu de soldes, `ecart = 0` / `coherent = true` (résultat du CR = résultat reporté au passif du Bilan).
- [ ] **Colonnes N / N-1 présentes** (FR-010 AC-3) : `montantN1` par poste + `resultatNetN1` ; N-1 absent ⇒ colonnes N-1 **nulles** (jamais inventées).
- [ ] **Sous-totaux `FORMULE`/`type='total'` (SIG) ignorés** — absents de la réponse (hook documenté), y compris quand le référentiel en déclare (SYSCOHADA XA..XI).
- [ ] Comptes **non mappés** (classe résultat) remontés explicitement (jamais ignorés).
- [ ] **Unités mineures XOF entières** ; ligne ou total hors `Number.isSafeInteger` → **400** (`MONTANT_HORS_BORNES`).
- [ ] Compte au format invalide / corps mal formé → **400** (jamais 500).
- [ ] Sans jeton → **401** ; gate refusé → **403** `{ code }` (`EMAIL_NOT_VERIFIED` | `KYC_NOT_APPROVED` | `BILAN_NOT_ENTITLED`) ; org d'un autre tenant non exposée. Référentiel non résolu/indisponible → 409/500/503 via `toHttpFromReferentielError`.
- [ ] Fonctionne **RÉFÉRENTIEL-AGNOSTIQUE** : SYSCOHADA révisé **et** SFD-BCEAO (14 postes `detail`, 0 SIG).
- [ ] **Non-régression** : `bilan/dry-run` (059), `table-de-passage/dry-run` (055), `mapping-overrides` (058), artefacts (056/057) inchangés.

---

## Technical Notes

### Composants

- **Nouveau** : `src/modules/bilan/etats/compte-resultat-production.service.ts` (**pur**, dépend `TableDePassageService`) + `.spec.ts` ; types CR ajoutés à `src/modules/bilan/etats/compte-resultat.types.ts` (`PosteResultat`, `CoherenceResultat`, `CompteResultatProduit`) — ou étendre `bilan.types.ts`.
- **Nouveau** : DTO `dto/compte-resultat-response.dto.ts` (`PosteResultatDto`, `CoherenceResultatDto`, `CompteResultatDto`). **Corps de requête** = `BilanDryRunRequestDto` réutilisé (input identique) ou alias mince `CompteResultatDryRunRequestDto` réutilisant `LigneSoldeDto`.
- **Étendu** : `bilan-engine.service.ts` → `produireCompteResultat(...)` (composition ; réutilise `resolveReferentielForOrg` + `chargerSurchargesActives` ; calcule le résultat Bilan via `BilanProductionService` déjà injecté, pour la cohérence).
- **Étendu** : `bilan-diagnostics.controller.ts` → `POST /bilan/etats/compte-resultat/dry-run` (mêmes gardes + mapper d'erreurs + tampon `toEffectiveStamp`).
- **Étendu** : `bilan.module.ts` → provider `CompteResultatProductionService`.
- **Réutilisés inchangés** : `TableDePassageService`, `BilanProductionService`, `ReferentielLoader`, `MappingOverrideRepository`, `toHttpFromReferentielError`, `toEffectiveStamp`, `MontantHorsBornesError`, `@RequiresBilanAccess`, `LigneSoldeDto`.

### Algorithme (par jeu de soldes)

1. Cumuler `D`/`C` par compte (fusion des lignes doublons, comme 059).
2. `mapComptes(comptes, pkg, surcharges)` → rattachements (055).
3. Pour chaque compte mappé, retenir le rattachement de règle `PRODUIT`/`CHARGE` (`etat='COMPTE_RESULTAT'`) ; ignorer les postes `total`/`FORMULE` et les postes de Bilan. Accumuler par **poste** : produit → `montant += C − D` ; charge → `montant += D − C`.
4. `resultatNet = Σ montant(produits) − Σ montant(charges)`.
5. Émettre `produits[]` et `charges[]` ordonnés selon `pkg.postes` (`etat='COMPTE_RESULTAT'`).
6. N-1 : même passe sur `soldesN1` (colonne `montantN1` + `resultatNetN1`).
7. Cohérence : `resultatNetBilan` = `BilanProductionService.produire(...).controle.resultatNetN` sur les mêmes soldes N ; `ecart = resultatNetCR − resultatNetBilan` ; `coherent = ecart === 0`.
8. Bornes `Number.isSafeInteger` à chaque agrégation → dépassement = `MontantHorsBornesError` → **400**.

### Sécurité / robustesse

- `orgId` **exclusivement du JWT** ; corps = soldes uniquement.
- Validation stricte (`ValidationPipe` `whitelist` + `forbidNonWhitelisted`) ; `D`,`C` entiers ≥ 0 ; `ArrayMaxSize` comme 059.
- Aucune écriture en base (dry-run) → **pas de transaction Mongo**.
- Anti-500 : entrées non-tableau / types erronés → 400 (précédent 055/059).

### Edge cases

- N-1 absent → colonnes N-1 nulles.
- Compte présent en N pas en N-1 (et inversement) → montant 0 sur le jeu absent.
- Compte de classe résultat non mappé → `comptesNonMappes` (jamais silencieusement ignoré).
- Poste `type='total'`/`FORMULE` (SIG SYSCOHADA XA..XI) → **ignoré** (hook).
- Référentiel **sans aucun poste CR `detail`** mappé (jeu ne touchant que le Bilan) → `produits=[]`, `charges=[]`, `resultatNet=0`, `coherent=true`.
- SFD-BCEAO (0 SIG) → produits/charges détaillés, aucun sous-total → cohérent avec l'agnosticisme.

---

## Dependencies

**Stories prérequises (toutes ✅ done) :** STORY-059 (moteur + résultat net + engine + endpoint jumeau), STORY-055 (mapping), STORY-056/057 (référentiels packagés, postes CR + règles `PRODUIT`/`CHARGE`), STORY-058 (surcharges), STORY-037/054 (gate + garde ACTIVE).

**Dépendance périmée (documentée) :** ~~STORY-052 (N-1)~~ — EPIC-009 `superseded` (D14) ; N-1 = 2ᵉ jeu de soldes.

**Stories débloquées :** STORY-061 (TFT — a besoin du CR + Bilan N/N-1), STORY-063 (articulation Bilan↔CR↔TFT — consomme `coherenceResultat`), STORY-062 (annexes), STORY-064/065 (validation + snapshot).

**Dépendances externes :** aucune (référentiels embarqués ; JWT RS256 de l'IdP).

---

## Definition of Done

- [ ] Code implémenté (français) ; `CompteResultatProductionService` **pur** et **référentiel-agnostique**.
- [ ] Lint **0 warning** · `npm run build` OK.
- [ ] Couverture ≥ **65 branches / 90 fonctions / 90 lignes / 90 statements** (module `etats` visé 100 %). Seuils jamais baissés.
- [ ] Tests **unitaires** : agrégation `PRODUIT` (montant = C−D), `CHARGE` (montant = D−C), résultat net = produits − charges, cohérence CR = résultat Bilan (ecart 0), N-1 absent ⇒ colonnes nulles, sous-totaux `FORMULE` ignorés, comptes non mappés remontés, bornes safe-integer — **sur les deux référentiels** (SYSCOHADA avec SIG ignorés ; SFD sans SIG).
- [ ] Tests **e2e** (contrat HTTP, données mockées) : 200 nominal, 400 (compte invalide / bornes), 401 (sans jeton), 403 (gate), N-1 optionnel.
- [ ] **Vérification docker réelle obligatoire** (la story n'écrit pas en base ⇒ preuve = **calcul de bout en bout sur stack vivante**, JWT RS256 réel de l'IdP, read-models entitlement semés) : sur un même jeu de soldes, `compte-resultat/dry-run` → `resultatNetN` **égal** à `resultatNetN` de `bilan/dry-run` (`coherent=true`, `ecart=0`) ; produits/charges détaillés cohérents ; SIG SYSCOHADA (XA..XI) **absents** de la réponse ; N-1 renseigné ; **SYSCOHADA ET SFD-BCEAO** ; comptes non mappés remontés ; borne → 400 ; sans jeton → 401 ; entitlement REVOKED → 403 ; **non-régression** `/health` 200 sur 8 services + `bilan/dry-run` (059) inchangé. Consigné dans *Progress Tracking*.
- [ ] Endpoints documentés dans **Swagger** (`/api/docs`).
- [ ] `/code-review` passé ; constats de correction traités.
- [ ] Statut synchronisé aux **3 endroits** (en-tête doc, `docs/sprint-status.yaml`, *Progress Tracking*) ; `completed_date` à la clôture.

---

## Story Points Breakdown

- **Moteur `CompteResultatProductionService` (agrégation `PRODUIT`/`CHARGE` par poste, résultat net, N/N-1) :** 2 points
- **Cohérence CR↔Bilan + endpoint + DTO + câblage engine + Swagger :** 2 points
- **Tests (unit + e2e, 2 référentiels) + vérif docker :** 1 point
- **Total :** 5 points

**Rationale :** cœur comptable réel (Compte de résultat complet + contrôle de cohérence articulé au Bilan) mais **sur les rails de 059** : réutilise l'engine, les gardes, le contrat d'entrée et le résultat net déjà calculé — d'où un 5 « léger ». Le risque « deviner des règles OHADA » est **éliminé** par le choix référentiel-agnostique (agrégation par `regle`) : les soldes intermédiaires de gestion (`FORMULE`) sont **explicitement hors périmètre** (hook/tech-spec B8), car non exploitables par machine et spécifiques au référentiel (absents du SFD).

---

## Additional Notes

- **Précédent de re-cadrage** : STORY-059 (mêmes conventions) — la mise à l'écart des SIG codés en dur est **assumée et tracée** : elle **violerait P7** et serait **fausse/absente pour SFD-BCEAO** (découvert en lisant les deux paquets : SYSCOHADA a 9 SIG en texte non exploitable, SFD n'en a aucun). Le design retenu est **piloté par le référentiel**.
- **Cohérence par construction** : le résultat net du CR et le résultat reporté au passif du Bilan sont la **même** agrégation `Σ_CR (C − D)` sur les mêmes soldes → l'écart est nul par construction. Le champ `coherenceResultat` **matérialise et prouve** l'invariant FR-010 AC-2 de bout en bout, et sert de **hook** au contrôle d'articulation inter-états de STORY-063 (qui, lui, comparera des états produits séparément).
- **Question ouverte à confirmer à l'intégration** (héritée de 059) : format exact des soldes du futur handoff `balance.created` (D/C cumulés vs solde net) — le DTO (`{ soldeDebiteur, soldeCrediteur }`) s'aligne sur `BalanceCanonique` (101) et couvre les deux.

---

## Progress Tracking

**Status History :**
- 2026-07-19 : Créée (Scrum Master) — re-cadrée contre l'état réel de bilan-service (pas de balance ; N-1 = 2ᵉ jeu) et contre la structure réelle des référentiels (SIG `FORMULE` non exploitables et spécifiques → hook, comme les sous-totaux Bilan de 059).
- 2026-07-19 : Implémentée + vérifiée docker réelle + revue + intégrée dans `dev` (MNV-060).

**Implémentation (dev-story, 2026-07-19) :**
- `CompteResultatProductionService` (pur, dépend `TableDePassageService`) : agrégation pilotée par la `regle` (`PRODUIT` → montant `C−D` ; `CHARGE` → montant `D−C`), résultat net = `Σ produits − Σ charges` = `Σ_CR (C−D)`, postes `produits[]`/`charges[]` ordonnés selon le référentiel, colonne N-1, bornes safe-integer (`MontantHorsBornesError` → 400). **SIG / postes `FORMULE`/`total` ignorés** (hook tech-spec B8).
- `BilanEngineService.produireCompteResultat` (résout référentiel + garde ACTIVE + surcharges VALIDATED) produit aussi le résultat « côté Bilan » (via `BilanProductionService`) → **`coherenceResultat` { resultatNetCR, resultatNetBilan, ecart, coherent }** matérialise FR-010 AC-2 (ecart 0 par construction). Endpoint gardé `POST /bilan/etats/compte-resultat/dry-run` (200, tampon référentiel) ; corps `BilanDryRunRequestDto` réutilisé (compte `^\d[0-9A-Za-z]{1,19}$`, D/C entiers ≥ 0, `@Max(MAX_SAFE_INTEGER)`).
- **Qualité** : lint 0 · build OK · **247 unit + 50 e2e verts** · couverture module `etats` (`compte-resultat-production.service.ts` 100/97/100/100, ligne non couverte = repli défensif inatteignable) ; `bilan-engine.service.ts` 100 % (test `produireBilan` ajouté) ; global **99.15/91.9/98.81/99.08** > seuils 65/90/90/90. Artefacts 056/057 + services 055/058/059 **inchangés** (non-régression e2e verte).

**Vérification docker RÉELLE (stack vivante, 8 services healthy, JWT RS256 réel de l'IdP — register+login org `6a5ca2b7…`, e-mail vérifié ; read-models `orgkycstatuses`/`orgbilanentitlements` semés via mongosh) :**
1. **CR nominal SYSCOHADA** (211 5M actif ; 101 3M + 401 1,5M passif ; 701 2M produit ; 601 1,2M + 66 0,3M charges) → produits `TA=2 000 000` ; charges `RA=1 200 000`, `RK=300 000` ; `totalProduitsN=2 000 000`, `totalChargesN=1 500 000`, `resultatNetN=500 000` ; `nonMappes=[]`.
2. **Cohérence CR ↔ Bilan prouvée par les DEUX endpoints** sur les mêmes soldes : `coherenceResultat = { resultatNetCR:500 000, resultatNetBilan:500 000, ecart:0, coherent:true }` ; `bilan/dry-run` → `resultatNetN=500 000` (totalActif 5M / totalPassif 4,5M / `ecartN=0`, `equilibreN=true`).
3. **SIG (postes `FORMULE` XA..XI) absents** de la réponse CR (aucun poste commençant par `X`).
4. **N-1** fourni → `TA montantN1=1 800 000`, `resultatNetN1` calculé.
5. **RÉFÉRENTIEL-AGNOSTIQUE** — bascule org → `sfd-bceao@1.0` (0 SIG) : produits `RP1=800 000`, charges `RC1=500 000`, `resultatNetN=300 000`, `coherent=true`. **Preuve que la structure SYSCOHADA n'est pas codée en dur.**
6. Compte invalide → **400** ; agrégation hors bornes → **400 MONTANT_HORS_BORNES** ; sans jeton → **401** ; entitlement REVOKED → **403 BILAN_NOT_ENTITLED**.
7. **Non-régression** : `bilan/dry-run` (059) → 200 intact ; `/health` **200 sur les 8 services** (balance-service `healthy`).

**Effort réel :** 5 points (conforme).

---

**Story créée avec BMAD Method v6 — Phase 4 (Implémentation).**
