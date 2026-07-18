# STORY-055 : Table de passage comptes → postes d'états **appliquée** (longest-prefix) + comptes non mappés + traçabilité — FR-006

**Epic :** EPIC-010 — Référentiels & table de passage (bilan-service)
**Réf. architecture / PRD :** `architecture-bilan-service-2026-07-07.md` (§BilanModule (moteur) [moteur paramétré par référentiel] · §Risques #2 [interface de référentiel ⊥ moteur] · **P7/D10**) · `prd-bilan-service-2026-07-10.md` **FR-006** (table de passage comptes→postes + comptes non mappés) — dépend **FR-005**
**Priorité :** Must Have
**Story Points :** 5
**Statut :** Done
**Assigné à :** Claude (BMAD dev-story)
**Créée le :** 2026-07-18
**Sprint :** 11
**Service :** bilan-service (`:3004`) — base Mongo dédiée `bilan_service`
**Couvre :** **FR-006** — AC-1 (chaque compte mappé à un poste **ou** explicitement « non mappé ») + AC-3 (mapping traçable : compte → poste → référentiel). **AC-2** (la liasse ne peut être validée tant que des comptes **significatifs** restent non mappés) = **hook inerte documenté** (aucune liasse produite avant EPIC-011). **Dépend STORY-054/038** (référentiel résolu + `ReferentielPackage.tableDePassage` chargé).

---

## ⚠️ Cadrage — ce que 055 fait, et ce qu'elle ne peut pas encore faire

STORY-038 charge la **table de passage** dans `ReferentielPackage.tableDePassage` mais la laisse **« chargée et exposée, pas exécutée »** (cf. STORY-038 §Hors périmètre → FR-006/STORY-055). STORY-055 livre l'**application** de cette table.

**Contrainte réelle vérifiée dans le code** : `bilan-service` **ne possède aucune balance** aujourd'hui — pas de read-model balance, pas de consumer `balance.created`, pas d'import (le handoff `balance.created` de STORY-099 est **producteur seul** ; le consumer bilan + l'interop e2e sont **différés à EPIC-009**). FR-006 dit « chaque compte **de la balance** » : la balance n'arrivera qu'avec EPIC-009 (import) / le consumer du handoff.

> **Conséquence de périmètre.** STORY-055 livre le **moteur de rattachement** — une fonction **pure** qui, pour un **ensemble de comptes** (numéros de comptes, tels qu'ils arriveront de la balance) + un `ReferentielPackage`, produit le **rattachement compte → poste(s)** par **longest-prefix match**, la **liste des comptes non mappés**, et la **traçabilité** (compte → poste → référentiel `code@version`). La **source** des comptes (balance importée / handoff) et le **consommateur** (validation de liasse, AC-2) sont **hors périmètre** (EPIC-009 / EPIC-011). Prouvé de bout en bout par un **endpoint diagnostic gardé** (dry-run prenant une liste de comptes), comme `GET /bilan/referentiel` prouve le loader — **provisoire**, remplacé par le mapping piloté par la vraie balance en EPIC-009/011.

### Sémantique de rattachement (vérifiée sur l'artefact réel `syscohada-revise@2.1`)

- `MappingRule.comptesSyscohada` = **préfixes** de comptes SYSCOHADA (longueurs 2 à 4 : `"21"`, `"211"`, `"231"`…). 99 règles, 163 postes.
- Un compte de balance (`"211000"`, `"6011"`…) est rattaché à la (aux) règle(s) dont **le compte commence par le préfixe**, en retenant le **préfixe le plus long** (le plus spécifique). `"2110"` commence par `"21"` **et** `"211"` → retient `"211"`.
- **Classes 4/5** : un même compte de tiers/trésorerie peut correspondre à **deux** postes candidats (un ACTIF, un PASSIF) — la **ventilation débit/crédit au solde** est une règle de **calcul** (`regle` : `NET_ACTIF`/`SOLDE_CREDITEUR`/`classes_4_5`), **appliquée à la production des états (EPIC-011)**, PAS au rattachement. STORY-055 retourne donc, par compte, **la liste** des rattachements candidats partageant le préfixe le plus long (1 en général, 2 pour les classes 4/5) ; elle **ne calcule aucun solde**.
- **Non mappé** : un compte ne commençant par **aucun** préfixe du référentiel → listé explicitement (AC-1).
- L'`_meta.statut` de l'amorce le dit : mapping « **au niveau préfixe** ; à affiner (sous-comptes, ventilation débit/crédit classes 4/5) » → l'affinement fin relève du **tech-spec Bilan B8** / EPIC-011, pas de cette story.

---

## User Story

En tant que **moteur Bilan de `bilan-service`**,
je veux **rattacher chaque compte** d'un jeu de comptes **au(x) poste(s) d'états** défini(s) par la **table de passage** du référentiel effectif de l'org (par correspondance de **préfixe le plus long**), **lister explicitement les comptes non reconnus**, et **tracer** chaque rattachement (compte → poste → référentiel),
afin que la production ultérieure de la liasse (EPIC-011) reçoive un **rattachement déterministe et auditable** et qu'**aucun compte ne soit silencieusement ignoré** (FR-006).

---

## Description

### Périmètre

**Dans le périmètre**

- **`TableDePassageService`** (`src/modules/bilan/table-de-passage/table-de-passage.service.ts`) — **pur** (aucune I/O, aucune dépendance Mongo) :
  - `mapComptes(comptes: string[], pkg: ReferentielPackage): RattachementResult` ;
  - **index préfixe → règle(s)** construit depuis `pkg.tableDePassage` (une passe) ;
  - pour chaque compte : **longest-prefix match** → rattachement(s) au(x) poste(s) partageant le préfixe le plus long ; sinon **non mappé** ;
  - normalisation d'entrée (trim ; comptes vides/non numériques → **rejetés** en entrée invalide, pas « non mappés » silencieux) ; **dédoublonnage** des comptes en entrée (résultat par compte distinct).
- **Contrat de résultat** (`table-de-passage/table-de-passage.types.ts`) :
  - `RattachementCompte = { compte: string; rattachements: PosteRattache[] }` ;
  - `PosteRattache = { etat: string; poste: string; libelle: string; type: 'detail' | 'total'; regle: string; prefixe: string }` (le **préfixe retenu** = traçabilité fine) ;
  - `RattachementResult = { referentiel: { code; version }; mappes: RattachementCompte[]; nonMappes: string[]; totalComptes: number; totalNonMappes: number }` — **traçabilité AC-3** (référentiel effectif porté dans le résultat).
- **Câblage moteur** : `BilanEngineService` gagne `rattacherComptes(orgId, comptes)` = `resolveReferentielForOrg` (STORY-054, garde `ACTIVE`) **puis** `TableDePassageService.mapComptes(comptes, pkg)`. Réutilise la résolution/garde existante (aucune duplication).
- **Endpoint diagnostic gardé provisoire** `POST /api/v1/bilan/table-de-passage/dry-run` (`@RequiresBilanAccess` + `@Roles(TENANT_*)`) : corps `{ comptes: string[] }` (DTO validé : non vide, chaînes) → `RattachementResult`. **Provisoire** (comme `GET /bilan/referentiel`) : remplacé par le mapping piloté par la balance réelle en EPIC-009/011.
- **Hook AC-2 (inerte, documenté)** : le résultat porte `nonMappes` ; un helper/commentaire indique que **la validation de liasse (EPIC-011)** bloquera sur des comptes **significatifs** non mappés. **Aucune notion de « significatif » codée ici** (dépend de la balance/soldes, EPIC-011) → pas de code mort.
- **Tests** unit + e2e (voir *Testing Strategy*) ; seuils DoD tenus.

**Hors périmètre (stories suivantes / autres services)**

- **Source des comptes** : import de balance (FR-001, **EPIC-009**), consumer du handoff `balance.created` (**EPIC-009**). Ici l'entrée est une **liste de comptes** (diagnostic) ou fournie par l'appelant.
- **Calcul des soldes / ventilation débit-crédit classes 4/5 / production des états** → **EPIC-011**. 055 rattache, ne calcule pas.
- **Validation de liasse bloquée sur non-mappés significatifs (AC-2)** → **EPIC-011** (aucune liasse avant). Hook inerte ici.
- **Surcharges de mapping par org (FR-008)** → **STORY-058** (le rattachement de base ne consulte aucune surcharge ; hook à documenter).
- **Second référentiel `sfd-bceao`** → **STORY-057** (le moteur est agnostique du référentiel ; il s'applique à tout `ReferentielPackage`).
- **Affinement fin du mapping** (sous-comptes, cas particuliers) → tech-spec **B8**.

---

## User Flow

1. Un appelant (diagnostic, plus tard EPIC-009/011) fournit `orgId` + une liste de comptes.
2. `BilanEngineService.rattacherComptes` résout le référentiel de l'org (garde `ACTIVE`, STORY-054) et charge le `ReferentielPackage`.
3. `TableDePassageService.mapComptes` construit l'index préfixe→règle, puis pour chaque compte applique le **longest-prefix match**.
4. Retour : `mappes` (compte → poste(s) + préfixe retenu + référentiel), `nonMappes` (comptes sans correspondance), compteurs.

---

## Acceptance Criteria

- [ ] **AC-1** — Chaque compte fourni est soit **rattaché** à au moins un poste, soit présent dans **`nonMappes`** (jamais ignoré silencieusement).
- [ ] **Longest-prefix** — un compte correspondant à plusieurs préfixes est rattaché au(x) poste(s) du **préfixe le plus long** ; `"2110"` (préfixes `"21"` et `"211"`) → règle(s) `"211"`.
- [ ] **Classes 4/5** — un compte matchant deux règles (ACTIF + PASSIF) au même préfixe retenu renvoie **deux** rattachements ; **aucun solde n'est calculé**.
- [ ] **AC-3 (traçabilité)** — chaque rattachement porte `etat, poste, libelle, type, regle, prefixe` et le résultat porte le **référentiel effectif** `code@version`.
- [ ] **Entrée invalide** — comptes vides/non numériques → **400** (DTO), pas « non mappé » silencieux ; comptes en doublon **dédoublonnés**.
- [ ] **Garde d'accès** — le rattachement passe par `resolveReferentielForOrg` (garde `ACTIVE` de STORY-054) ; un entitlement non `ACTIVE` → refus (pas de mapping).
- [ ] **AC-2 (hook)** — le résultat expose `nonMappes` ; documenté comme le signal qu'**EPIC-011** consommera pour bloquer la validation de liasse sur comptes **significatifs** (aucune logique de « significatif » ici).
- [ ] `POST /bilan/table-de-passage/dry-run` : 200 `RattachementResult` sur org habilitée ; 403 gate ; 400 entrée invalide.
- [ ] **Périmètre respecté** : aucun calcul de solde, aucune production d'états, aucune surcharge org, aucun `sfd-bceao`, aucune modification d'un autre service.
- [ ] **DoD** : lint 0 · build OK · unit + e2e verts · couverture ≥ **65/90/90/90** · Swagger à jour.

---

## Technical Notes

### Composants (bilan-service uniquement)

- `modules/bilan/table-de-passage/table-de-passage.types.ts` *(nouveau)* — `PosteRattache`, `RattachementCompte`, `RattachementResult`.
- `modules/bilan/table-de-passage/table-de-passage.service.ts` *(nouveau)* — `mapComptes` **pur** + construction d'index préfixe→règles.
- `modules/bilan/bilan-engine.service.ts` — `rattacherComptes(orgId, comptes)` (réutilise `resolveReferentielForOrg`).
- `modules/bilan/dto/rattachement-request.dto.ts` + `dto/rattachement-result.dto.ts` *(nouveaux)* — validation entrée + Swagger sortie.
- `modules/bilan/bilan-diagnostics.controller.ts` — `POST table-de-passage/dry-run`.
- `modules/bilan/bilan.module.ts` — enregistre `TableDePassageService`.

### Points d'attention

- **Longest-prefix déterministe** : indexer les préfixes ; pour un compte, tester ses préfixes du plus long au plus court (ou trier les préfixes candidats). Complexité linéaire par compte (longueur bornée à 4).
- **Multi-poste au même préfixe** (classes 4/5) : conserver **toutes** les règles portant le préfixe retenu → liste `rattachements`. Ne pas dédupliquer par poste (actif+passif distincts).
- **Pureté** : `TableDePassageService` sans Mongo/Kafka → testable isolément, réutilisable par EPIC-011.
- **Aucune ventilation de solde** : `regle` est **transportée** (traçabilité), **pas appliquée**.
- **Anti-fuite / garde** : réutiliser la garde `ACTIVE` de STORY-054 (pas de nouveau chemin d'accès).

---

## Dependencies

**Prérequises :** STORY-054 (résolution + garde `ACTIVE` + `ReferentielPackage`) · STORY-038 (loader + `tableDePassage` chargée).
**Débloque :** EPIC-011 (production d'états consomme le rattachement + le tampon effectif de 054) ; STORY-058 (surcharges org se branchent sur ce rattachement) ; FR-007/STORY-057 (le moteur s'applique tel quel à `sfd-bceao`).
**Externes :** aucune (référentiel embarqué).

---

## Definition of Done

- [ ] Branche `MNV-055` (base `dev`, rebase).
- [ ] Lint 0 · build OK.
- [ ] Unit : longest-prefix (chevauchements), classes 4/5 (2 postes), non mappé, entrée invalide/doublon, index construit une fois, service pur.
- [ ] E2e : `POST dry-run` 200 (rattachements + nonMappes) · 403 gate · 400 entrée invalide.
- [ ] Couverture ≥ 65/90/90/90 (jamais baissée).
- [ ] Swagger à jour (DTO entrée/sortie).
- [ ] **Vérif docker réelle** (voir *Progress Tracking*) : dry-run sur org habilitée avec des comptes réels (dont classes 4/5 + un compte inexistant) → rattachements corrects + `nonMappes` non vide + référentiel tracé, sur stack vivante avec JWT RS256 réel.
- [ ] Statut synchronisé aux 3 endroits ; `/code-review` ; PR `MNV-055` **Rebase and merge** + `--delete-branch` ; docs sur base `main`.

---

## Story Points Breakdown

- **Backend :** 3,5 pts (moteur de rattachement pur + longest-prefix + multi-poste + engine wiring + DTO/endpoint).
- **Tests :** 1,5 pt (unit couvrant les cas de préfixe/classes 4-5/non-mappé + e2e).
- **Total : 5 pts.** Conforme au sprint-plan (EPIC-010).

**Rationale :** cœur fonctionnel de FR-006 — l'**application** de la table de passage, laissée « non exécutée » par STORY-038. La valeur/risque est dans la **correction du rattachement** (longest-prefix, classes 4/5 multi-poste, non-mappés explicites) et sa **traçabilité**, sur une entrée **liste de comptes** (la balance réelle = EPIC-009). Aucun calcul comptable (EPIC-011). Estimation pleine (5 pts), contrairement à 054 (finalisation 2 pts).

---

## Additional Notes

- **AC-2 réellement fermé en EPIC-011** : la « significativité » d'un compte non mappé dépend de son **solde** (balance), indisponible ici. 055 fournit `nonMappes` ; EPIC-011 décidera du seuil bloquant.
- **Agnosticité référentiel (P7)** : `mapComptes` opère sur n'importe quel `ReferentielPackage` → `sfd-bceao` (STORY-057) fonctionnera sans code additionnel.

---

## Progress Tracking

**Status History :**
- 2026-07-18 : Créée (`/bmad:create-story`) — re-cadrée en **moteur de rattachement** (bilan-service n'a pas encore de balance ; source = EPIC-009). Statut → **defined**.
- 2026-07-18 : Développée (`/bmad:dev-story`) sur `MNV-055`. Lint 0 · build OK · **149 unit** (24 suites) + **28 e2e** (4 suites) verts · couverture **98.73 / 86.07 / 98.14 / 98.6** > seuils ; `table-de-passage.service.ts` **100 %** (branches incl.), `bilan-engine.service.ts` 100 %. `/code-review high` → constats mineurs (voir ci-dessous). PR #6 `MNV-055` → `dev` **Rebase and merge** + branche supprimée. Statut → **done**.

**Raffinement acté à la rédaction du code** : la story disait « comptes non numériques → rejetés ». **Corrigé** : les comptes sont **alphanumériques** (contrat balance STORY-101/086 ; comptes de tiers Sage `411FACTURE`). Le DTO valide `^\d[0-9A-Za-z]{1,19}$` (chiffre de classe + alphanumérique) au lieu de « numérique strict » — refuser l'alphanumérique aurait exclu à tort les comptes tiers.

**Vérification docker réelle — 2026-07-18 (stack vivante, bilan-service redémarré pour recharger l'endpoint après un `EADDRINUSE` du watcher ; JWT RS256 réel de l'IdP, org `6a5b…0620` ACTIVE+APPROVED, référentiel réel `syscohada-revise@2.1`).**
- [x] **200** — `POST /bilan/table-de-passage/dry-run` `{comptes:["211000","411FACTURE","401000","999999"]}` → `211000`→BILAN_ACTIF **AE** (préfixe 211, NET_ACTIF), `411FACTURE` (**tiers Sage alphanumérique**)→BILAN_ACTIF **BI** (préfixe 411), `401000`→BILAN_PASSIF **DJ** (préfixe 401, SOLDE_CREDITEUR), `999999`→**nonMappes** ; `referentiel:{syscohada-revise,2.1}` tracé, `totalComptes:4`, `totalNonMappes:1`.
- [x] **400** entrée invalide (`"bad!compte"`) ; **400** liste vide.
- [x] **403 BILAN_NOT_ENTITLED** sur entitlement REVOKED (gate ; mapping jamais exécuté).
- [x] **Non-régression** : `/health` **200** sur auth/kyc/catalog/bilan/balance ; services applicatifs healthy.

**Actual Effort :** 5 pts (conforme).

**Notes d'implémentation :**
- `table-de-passage/table-de-passage.service.ts` — `mapComptes` **pur** : index `préfixe → règle(s)` (une passe) + **longest-prefix** (préfixes du compte du plus long au plus court) ; multi-règles au préfixe retenu = classes 4/5 (liste de rattachements). Aucun calcul de solde.
- `table-de-passage/table-de-passage.types.ts` — `PosteRattache` (avec `prefixe` retenu), `RattachementCompte`, `RattachementResult` (référentiel tracé + compteurs).
- `bilan-engine.service.ts` — `rattacherComptes(orgId, comptes)` = `resolveReferentielForOrg` (garde ACTIVE de STORY-054) + `mapComptes` ; injecte `TableDePassageService`.
- `bilan-diagnostics.controller.ts` — `POST table-de-passage/dry-run` (`@HttpCode(200)`), garde tenant **extraite** (`tenantObjectId`, réutilisée par les 2 endpoints), mapping d'erreurs partagé. DTOs entrée (validée) + sortie (Swagger).
- Hooks documentés : **AC-2** (validation liasse sur non-mappés significatifs) = EPIC-011 (dépend des soldes) ; **surcharges org** (FR-008/058) se brancheront sur ce rattachement.

---

**Story créée avec BMAD Method v6 — Phase 4. Application de la table de passage (FR-006), source de comptes = liste (balance réelle différée à EPIC-009).**
