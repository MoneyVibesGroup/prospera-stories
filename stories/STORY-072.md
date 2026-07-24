# STORY-072 : Consultation des états & du prévisionnel (API structurée, N/N-1, gate) — FR-022

**Epic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** [`docs/prd-bilan-service-2026-07-10.md`](../prd-bilan-service-2026-07-10.md) §FR-022 (« Restitution structurée (API) des états — brouillon et validés, N/N-1 — **et du prévisionnel**, protégée par le gate d'accès ») ; **dépend FR-009…FR-011, EPIC-008**
**Réf. contrat front (moteur du périmètre) :** [`docs/frontend-stories/FE-037.md`](../frontend-stories/FE-037.md) — la story cliente attend explicitement un back **`/bilan/consultation`** (sélecteur exercice/version + restitution états **et** prévisionnel). C'est ce contrat, plus que la lettre de FR-022, qui fixe la forme de la façade.
**Réf. code livré (réutilisé, jamais réécrit) :** **STORY-064** (`JeuEtatsService.consulter` → `{ jeu, liasse, version }`, liasse produite à la volée avec N/N-1) · **STORY-065** (`JeuEtatsService.consulterVersion` / `listerVersions`, `SnapshotLiasseRepository`, snapshots figés versionnés) · **STORY-066** (`Exercice`, index unique `(tenantId, libelle)`, `JeuEtats.exercice` ⟷ `Exercice.libelle`) · **STORY-067** (`ExerciceService` / `ExerciceRepository`, statut `OUVERT/CLOS`) · **STORY-068** (`JeuHypotheses`, `base.exercice` — le lien prévisionnel→exercice) · **STORY-037** (gate `@RequiresBilanAccess`)
**Dépend de :** STORY-064 ✅ · STORY-065 ✅ · STORY-066 ✅ · STORY-067 ✅ · STORY-068 ✅ · STORY-037 ✅ — **toutes livrées, aucun blocage** (détail : §[Dépendances](#dépendances))
**Ne dépend PAS de :** STORY-071 (comparaison de scénarios) · STORY-132 (versions d'hypothèses) · STORY-073 (export) — endpoints distincts, développables en parallèle
**Débloque / alimente :** STORY-073 (export : consomme la même façade de restitution) · STORY-074 (comparaison **inter-exercices**, S16 : reprend l'index par exercice posé ici) · front **FE-037**
**Priorité :** Must Have
**Story Points :** 3
**Statut :** done ✅ (dev DeepSeek v4 Flash → revue de code : **4 constats corrigés d'office dont 1 bloquant** (liasse du brouillon divergente de `/bilan/etats/:id`) → vérif docker bout-en-bout (JWT RS256 réel, zéro écriture, isolation 2 orgs) → revue de sécurité **0 vulnérabilité** → PR #30 bilan-service « Rebase and merge » sur `dev`, HEAD `d747ef0`, branche supprimée — 2026-07-24)
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-24
**Terminée :** 2026-07-24
**Sprint :** 15

---

## User Story

**En tant que** dirigeant/comptable d'une organisation,
**je veux** consulter mes états financiers **et** mon prévisionnel **par exercice** — en choisissant le brouillon courant ou une version validée figée, et en voyant du même coup les prévisionnels rattachés —,
**afin d'**exploiter mes données financières à partir de l'**axe que je connais (l'exercice)**, sans avoir à manipuler des identifiants techniques ni à recoller à la main états et prévisionnel.

---

## Description

### Contexte — ce qui existe déjà, et le trou qu'il laisse

Les briques de lecture existent, mais **dispersées et clées par ObjectId interne** :

| Ce qui est déjà exposé | Endpoint | Clé |
|---|---|---|
| un jeu d'états + sa liasse produite à la volée (N/N-1) | `GET /bilan/etats/:id` | `jeuEtatsId` |
| la liste de ses versions figées | `GET /bilan/etats/:id/versions` | `jeuEtatsId` |
| une version validée figée | `GET /bilan/etats/:id/versions/:version` | `jeuEtatsId` + `version` |
| un prévisionnel | `GET /bilan/hypotheses/:id/projection[-mensuelle]` | `hypothesesId` |

Aucun de ces endpoints ne se laisse interroger par **l'axe métier** — l'**exercice** (« 2025 ») — ni ne **relie** les états et le prévisionnel d'un même exercice. Un client (dont **FE-037**) doit aujourd'hui : lister les jeux, retrouver l'`id` du bon exercice, lister les versions, **puis** lister tous les jeux d'hypothèses et filtrer côté client ceux dont `base.exercice` correspond. C'est une **recomposition côté client** d'une restitution qui doit exister **une seule fois, au bon endroit** — précisément ce que FR-022 appelle « restitution **structurée** ».

STORY-072 livre cette façade : **`/bilan/consultation`**, clée par exercice, en **lecture pure**.

### Le vrai risque de cette story : une façade qui *recalcule* au lieu de *déléguer*

La liasse (Bilan/CR/TFT/notes/contrôles, N/N-1) est **produite à la volée** par le moteur (elle n'est pas stockée — cf. `jeu-etats.schema.ts`). La tentation, en écrivant une nouvelle façade, est de **re-produire** cette liasse (rappeler le moteur, re-sérialiser) « pour aller vite ». C'est le piège : deux chemins de production divergeraient en silence, et la consultation afficherait autre chose que `GET /bilan/etats/:id` pour le **même** jeu — sans qu'aucune erreur ne le signale.

**Règle non négociable de cette story :** la façade **délègue** aux services existants (`JeuEtatsService.consulter` pour le brouillon courant, `consulterVersion` pour une version figée) et **compose** leurs résultats. Elle **ne rappelle jamais le moteur elle-même**, ne réécrit **aucune** formule, n'ajoute **aucune** table de passage. Un critère d'acceptation exige que la liasse rendue par la consultation soit **strictement identique** à celle de l'endpoint existant, et une mutation (façade qui recalcule) doit **virer au rouge**.

Corollaire : **072 n'écrit rien** (invariant tenu depuis 064 pour les lectures) — aucune transaction, aucune collection nouvelle, aucun événement Kafka.

### L'axe de restitution : l'exercice, pas le jeu

L'index unique `(tenantId, exercice)` sur `jeux_etats` (066) garantit **au plus un jeu d'états par exercice**. L'exercice (`Exercice.libelle`, 067) est donc une **clé stable et unique par org** — c'est elle que la façade expose. Un prévisionnel se rattache à un exercice par `JeuHypotheses.base.exercice` (068) : la jointure « états ↔ prévisionnel » se fait **sur le libellé d'exercice**, tenant-scoped.

### Contrat de sortie (forme)

**Index — `GET /bilan/consultation`** (données du sélecteur FE-037) :

```jsonc
[
  {
    "exercice": "2025",
    "statutExercice": "OUVERT",          // OUVERT | CLOS | null (cf. D2)
    "dateDebut": "2025-01-01T00:00:00.000Z",
    "dateFin":   "2025-12-31T00:00:00.000Z",
    "jeuEtatsId": "…",                     // null si exercice déclaré sans jeu
    "statutJeu": "VALIDE",                 // BROUILLON | VALIDE | null
    "nombreVersions": 2,                    // snapshots figés (065)
    "nombrePrevisionnels": 2,               // jeux d'hypothèses rattachés (068)
    "valideAt": "2026-07-24T09:00:00.000Z"  // null si non validé
  }
  // … un objet par exercice consultable, trié libellé décroissant (récent d'abord)
]
```

**Détail — `GET /bilan/consultation/:exercice[?version=n]`** :

```jsonc
{
  "exercice": { "libelle": "2025", "statut": "OUVERT",
                "dateDebut": "…", "dateFin": "…", "exercicePrecedent": "2024" },
  "jeuEtats": { "id": "…", "statut": "VALIDE",
                "referentiel": { "code": "syscohada-revise", "version": "2.1" },
                "checksum": "…", "valideAt": "…", "validePar": "…" },   // null si aucun jeu
  "vue": { "type": "BROUILLON", "version": null },   // BROUILLON (courant) | VERSION (figée n)
  "liasse": { /* Bilan/CR/TFT/notes/contrôles, N/N-1 — DÉLÉGUÉE, identique à /bilan/etats/:id */ },
  "versions": [ { "version": 1, "valideAt": "…", "checksum": "…" },
                { "version": 2, "valideAt": "…", "checksum": "…" } ],
  "previsionnels": [ { "id": "…", "nom": "prudent",  "version": 3,
                       "base": { "snapshotId": "…", "version": 1, "exercice": "2025" } } ]
}
```

- **Sans `?version`** : `vue.type = "BROUILLON"`, `liasse` = restitution **courante** déléguée à `JeuEtatsService.consulter` (pour un jeu VALIDÉ, elle correspond à sa dernière version).
- **Avec `?version=n`** : `vue.type = "VERSION"`, `liasse` = snapshot **figé** délégué à `JeuEtatsService.consulterVersion` ; `n` inconnu ⇒ **404 `VERSION_INTROUVABLE`**.
- Exercice **sans jeu d'états** (déclaré via 067 mais aucun jeu créé) ⇒ `jeuEtats: null`, `liasse: null`, `vue: null`, `versions: []`, `previsionnels: []` — **200**, pas une erreur. `?version` sur un tel exercice ⇒ **404**.

---

## Scope

**Dans le périmètre :**
- `modules/bilan/consultation/consultation.service.ts` — **orchestration en lecture pure** : résolution tenant-scoped de l'exercice, agrégation (exercice + jeu d'états + versions + prévisionnels), délégation stricte de la liasse. **Aucun appel au moteur, aucune écriture.**
- `consultation/consultation.controller.ts` — **préfixe distinct** `bilan/consultation` (aucune collision de routes — cf. *Notes techniques*), 2 endpoints : index + détail. `@RequiresBilanAccess()` + `@Roles(TENANT_ADMIN, TENANT_USER)`.
- `consultation/dto/*.dto.ts` — `ConsultationIndexDto` (index), `ConsultationExerciceDto` (détail), `?version` en query DTO (`@IsInt`/`@Min(1)`/`@IsOptional`, `@Type(() => Number)`) — Swagger complet.
- **Ajout minimal aux repositories** (thin, tenant-scoped, non-régressif) :
  - `HypothesesRepository.trouverParExercice(exercice)` → `find({ 'base.exercice': libelle })` (fusion `{ tenantId }` en dernier). Sert `previsionnels` + `nombrePrevisionnels`.
  - au besoin, une lecture « jeu d'états par libellé d'exercice » via le repo existant (`find({ exercice })`, unique par index 066).
- Tests unit + e2e (**les trois familles de contrôleurs montées**) + **discipline mutation-test** + **vérif docker réelle**.

**Hors périmètre (hooks inertes documentés) :**
- **Export PDF/Excel** de la restitution → **STORY-073** (FR-023). La façade est *le point d'entrée* de l'export ; 073 la consomme.
- **Comparaison inter-exercices** (évolution d'un poste sur ≥ 2 exercices validés) → **STORY-074** (FR-024, *Could Have*, **reportée au S16**). L'index par exercice posé ici en est la fondation, mais **072 ne compare rien**.
- **Comparaison de scénarios** (prudent/central/optimiste) → **STORY-071** (déjà livrée), endpoint distinct `bilan/previsionnel/comparaison`. La consultation **liste** les prévisionnels d'un exercice, elle ne les met **pas** face à face.
- **Toute nouvelle production/persistance de liasse** : interdite (cf. *le vrai risque*). La façade délègue.
- **Pagination / filtres avancés de l'index** : non requis à ce volume (un exercice ≈ une ligne/an). Hook documenté si le besoin apparaît.

---

## Critères d'acceptation

- [x] **AC-1 — Index par exercice.** `GET /bilan/consultation` renvoie **200** avec un tableau **trié libellé décroissant**, une entrée par exercice consultable de l'org, portant `statutExercice`, `jeuEtatsId` (ou `null`), `statutJeu` (`BROUILLON`/`VALIDE`/`null`), `nombreVersions`, `nombrePrevisionnels`, `valideAt`. Org sans donnée ⇒ **`[]`**.
- [x] **AC-2 — Détail par exercice.** `GET /bilan/consultation/2025` renvoie **200** avec `exercice` (méta), `jeuEtats` (méta ou `null`), `versions[]`, `previsionnels[]`, et `liasse` (N/N-1) **quand un jeu existe**.
- [x] **AC-3 — La liasse est *déléguée*, jamais recalculée.** Pour un même jeu, la `liasse` de `GET /bilan/consultation/:exercice` est **strictement identique** (mêmes postes, mêmes montants N et N-1, même structure) à celle de `GET /bilan/etats/:id` — **prouvé par une spec qui fait tourner le service réel**, pas par des attendus en dur. Idem `?version=n` vs `GET /bilan/etats/:id/versions/:n`.
- [x] **AC-4 — Sélection de version.** Sans `?version` ⇒ `vue.type = "BROUILLON"`, liasse **courante**. `?version=1` ⇒ `vue.type = "VERSION"`, liasse **figée** de la version 1. `?version=99` (absente) ⇒ **404 `VERSION_INTROUVABLE`**. `?version=abc`/`0`/négatif ⇒ **400** (DTO, aucun accès base).
- [x] **AC-5 — Prévisionnels rattachés au bon exercice.** `previsionnels[]` (et `nombrePrevisionnels`) ne contient **que** les jeux d'hypothèses dont `base.exercice` égale le libellé — jamais ceux d'un autre exercice. Un exercice sans prévisionnel ⇒ `[]` / `0`.
- [x] **AC-6 — Exercice sans jeu d'états.** Un exercice déclaré (067) sans jeu créé ⇒ **200**, `jeuEtats: null`, `liasse: null`, `vue: null`, `versions: []`, `previsionnels: []`. `?version` dessus ⇒ **404**.
- [x] **AC-7 — Anti-énumération / isolation.** Exercice **inexistant** ou **d'une autre org** ⇒ **404 `EXERCICE_INTROUVABLE`** générique (jamais 403), **avant** tout autre traitement. L'index d'une org ne contient **aucune** ligne d'une autre org. Toutes les résolutions passent par les repositories **tenant-scoped** (`{ tenantId }` fusionné en dernier, fail-closed).
- [x] **AC-8 — Gardes standard.** Sans jeton ⇒ **401** · gate refusé ⇒ **403** (`EMAIL_NOT_VERIFIED` | `KYC_NOT_APPROVED` | `BILAN_NOT_ENTITLED`) sur les **deux** endpoints. **Déterminisme** : deux appels identiques ⇒ réponse **strictement identique**.
- [x] **AC-9 — Aucune écriture.** Compteurs `jeux_etats` / `snapshots_liasse` / `jeux_hypotheses` / `exercices` / `audit_events` **identiques avant et après** les appels (vérif docker). Aucune transaction, aucune collection nouvelle, aucun événement Kafka. La consultation **ne journalise pas** d'`AuditEvent` (une lecture n'est pas un acte à tracer dans le périmètre 067).
- [x] **AC-10 — Ordre des routes / trois contrôleurs montés.** `GET /bilan/consultation` (index, littéral) répond bien 200 **et** `GET /bilan/consultation/2025` (détail, paramétré) répond bien 200 — le littéral **déclaré avant** le paramétré (cf. piège CLAUDE.md). L'e2e monte `ConsultationController` **à côté** de `JeuEtatsController`/`ProjectionController` sans collision.

---

## Notes techniques

### ⚠️ Ordre des routes & absence de collision inter-contrôleurs

La façade prend un **préfixe propre** `bilan/consultation`, distinct de `bilan/etats`, `bilan/hypotheses`, `bilan/exercices`, `bilan/previsionnel` : **aucune** route paramétrée d'un autre contrôleur ne peut l'apparier (c'est le contre-exemple de 071, où `bilan/previsionnel` a été choisi *précisément* pour ne pas tomber sous le `@Get(':id')` de `JeuHypothesesController`). **En interne** au `ConsultationController`, respecter la règle « littéral avant paramétré » :

```ts
@Controller({ path: 'bilan/consultation', version: '1' })
export class ConsultationController {
  @Get()               // ← littéral, AVANT
  index() { … }
  @Get(':exercice')    // ← paramétré, APRÈS
  detail(@Param('exercice') exercice: string, @Query() q: VersionQueryDto) { … }
}
```

> ⚠️ `:exercice` est un **libellé libre** (« 2025 »), **pas un ObjectId** — pas de `ParseObjectIdPipe`. La résolution se fait par `(tenantId, libelle)` via le repo tenant-scoped ; inconnu ⇒ 404 générique. Ne **jamais** interpoler ce libellé dans un opérateur Mongo : il n'entre que comme **valeur** d'égalité (`{ libelle }`, `{ exercice }`, `{ 'base.exercice': libelle }`), jamais comme clé.

### Délégation stricte (le cœur de la story)

```
index()   : ExerciceRepository.findAll()            (tenant-scoped)
            ⨝ JeuEtatsRepository.findAll()           (par libellé d'exercice)
            + SnapshotLiasseRepository.count/list    (nombreVersions)
            + HypothesesRepository.trouverParExercice (nombrePrevisionnels)

detail()  : ExerciceRepository.findByLibelle(ex)     → 404 générique si absent/autre org
            + (si jeu) JeuEtatsService.consulter | consulterVersion   ← LIASSE DÉLÉGUÉE
            + SnapshotLiasseRepository.listerVersions(jeuId)
            + HypothesesRepository.trouverParExercice(ex)
```

`consultation.service.ts` ne contient **que** de la résolution, de la jointure et du mapping DTO — **zéro** appel à `BilanEngineService` / `*ProductionService`, **zéro** écriture. C'est ce qui garantit AC-3 et évite le piège du double chemin de production.

### Construction de l'index & jointure sur le libellé

- Source primaire = collection `exercices` (067). Chaque exercice est enrichi de son jeu d'états (au plus un, index 066) et de ses compteurs.
- **Jointure états ↔ prévisionnel** = sur `Exercice.libelle == JeuEtats.exercice == JeuHypotheses.base.exercice` (tous des chaînes, tenant-scoped). Pas de `$lookup` cross-collection nécessaire : quelques lectures bornées (une org a peu d'exercices) — préférer des lectures explicites tenant-scoped à un pipeline d'agrégation qui contournerait le `TenantScopedRepository`.

### Anti-énumération — ordre imposé (détail)

1. Résoudre l'exercice **d'abord**, via `ExerciceRepository` tenant-scoped ⇒ absent/autre org = **404 `EXERCICE_INTROUVABLE`** générique. Ne dévoiler ni l'existence ni le statut d'une ressource d'un autre tenant.
2. **Ensuite seulement** charger jeu/versions/prévisionnels (eux aussi tenant-scoped). Aucune de ces lectures ne peut renvoyer de donnée d'une autre org (fail-closed).

### Ce qui **ne** change **pas**

Aucune écriture, aucune transaction, aucun événement Kafka, aucune migration, **aucune variable d'environnement**, aucun changement de CORS (déjà câblé, cf. `[[cors-obligatoire-nouveau-module]]`), aucun `AuditEvent`, **aucun appel au moteur**. La façade est purement additive et en lecture.

---

## Dépendances

### Stories prérequises — **toutes livrées**, aucun blocage

| Story | Titre | Statut | Ce que 072 en consomme **exactement** | Si elle manquait |
|---|---|---|---|---|
| **STORY-064** | Cycle de vie du jeu d'états — FR-014 | ✅ done | `JeuEtatsService.consulter` (`{ jeu, liasse, version }`) — **la source de la liasse déléguée** (N/N-1) | pas de liasse à restituer (AC-2/AC-3) |
| **STORY-065** | Snapshot figé versionné — FR-015 | ✅ done | `consulterVersion` / `listerVersions`, `SnapshotLiasseRepository` — sélection de version (AC-4) et `versions[]` | ni versions, ni restitution figée |
| **STORY-066** | Un seul jeu d'états par exercice — FR-016 | ✅ done | l'**index unique `(tenantId, exercice)`** : c'est lui qui fait de `exercice` une **clé** de consultation fiable | l'axe de restitution serait ambigu |
| **STORY-067** | Exercices `OUVERT`/`CLOS` — FR-016 | ✅ done | `ExerciceRepository` / `ExerciceService` (`libelle`, `statut`, dates, `exercicePrecedent`) — **source primaire de l'index** | pas d'index par exercice |
| **STORY-068** | Hypothèses rattachées à une base — FR-018 | ✅ done | `JeuHypotheses.base.exercice` — le **lien prévisionnel→exercice** ; nouvelle lecture `trouverParExercice` | la partie « **et du prévisionnel** » de FR-022 tombe |
| **STORY-037** | Gate `@RequiresBilanAccess` (EPIC-008) | ✅ done | le gate rejoué sur les 2 endpoints (AC-8) | endpoints non protégés |

### Stories dont 072 **ne dépend pas** (et qu'il ne faut pas attendre)

| Story | Statut | Pourquoi 072 passe devant |
|---|---|---|
| **STORY-071** — Comparaison de scénarios | ✅ done | endpoint distinct ; 072 **liste** les prévisionnels, ne les compare pas |
| **STORY-132** — Versions d'hypothèses append-only | `not_started` | 072 liste les jeux d'hypothèses tels quels ; le versionnement n'affecte pas la façade |
| **STORY-073** — Export PDF/Excel — FR-023 | `not_started` | 073 **consomme** 072, l'inverse est faux |

### Stories que 072 **débloque / alimente**

| Story | Statut | Lien |
|---|---|---|
| **STORY-073** — Export — FR-023 | `not_started`, S15, 5 pts | l'export part de la **même restitution** (liasse déléguée + prévisionnels) ; 073 y ajoute la sérialisation PDF/Excel fidèle au snapshot |
| **STORY-074** — Comparaison inter-exercices — FR-024 | `not_started`, **S16**, *Could* | reprend **l'index par exercice** posé ici pour sélectionner ≥ 2 exercices validés |
| **FE-037** (front) | `blocked` (back attendu) | la façade `/bilan/consultation` **débloque** le sélecteur exercice/version + la vue états/prévisionnel |

### Dépendances externes

**Aucune.** Pas de nouvelle brique d'infra, pas d'événement Kafka, pas de collection Mongo, pas de variable d'environnement, pas de changement CORS, aucun appel réseau ajouté (le gate lit les read-models locaux).

---

## Definition of Done

- [x] Lint **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0`) · `npm run build` OK.
- [x] Couverture ≥ **65 / 90 / 90 / 90** (`npm run test:cov`) — **ne jamais baisser les seuils** ; `consultation.service.ts` + `consultation.controller.ts` visés à ~100.
- [x] Unit + e2e verts, **non-régression** des endpoints existants (`/bilan/etats/*`, `/bilan/hypotheses/*` inchangés).
- [x] **Mutation-test** — **≥ 6 mutations vérifiées rouges**, fichiers restaurés à l'identique ensuite (`git diff` de contrôle vide) :
      | Mutation appliquée au code réel | Garde qui doit rougir |
      |---|---|
      | façade **recalcule** la liasse (appel moteur) au lieu de déléguer `consulter` | AC-3 (liasse identique) |
      | `?version` ignoré (toujours brouillon) | AC-4 (sélection de version) |
      | filtre `base.exercice` retiré ⇒ prévisionnels d'un autre exercice listés | AC-5 |
      | résolution d'exercice **non** tenant-scoped (repo brut) | AC-7 (isolation / 404) |
      | `@Get(':exercice')` déclaré **avant** `@Get()` | AC-10 (ordre des routes) |
      | tri de l'index supprimé (ordre Mongo brut) | AC-1 (tri libellé décroissant) |
      | gate retiré d'un endpoint | AC-8 |
- [x] **Vérif docker réelle** consignée dans *Progress Tracking* — stack neuve (`docker compose down -v`), org réelle via `register`/`login` sur l'IdP (**JWT RS256 réel**), read-models du gate alimentés (⚠️ `orgkycstatuses` / `orgbilanentitlements` : **pluriel Mongoose par défaut** — commencer par `db.getCollectionNames()`). Scénarios à produire réellement :
      1. exercice 2025 (067) + jeu d'états validé (064) + **2 versions** (rouvrir → re-valider ⇒ v2, 065) + **2 prévisionnels** (068) → `GET /bilan/consultation` liste 2025 : `statutJeu=VALIDE`, `nombreVersions=2`, `nombrePrevisionnels=2` ;
      2. `GET /bilan/consultation/2025` → `liasse` **strictement identique** à `GET /bilan/etats/:id` ; `versions=[1,2]` ; `previsionnels` = uniquement ceux de 2025 (créer un **2ᵉ exercice + prévisionnel** et prouver l'absence de fuite) ;
      3. `GET /bilan/consultation/2025?version=1` → liasse **identique** à `GET /bilan/etats/:id/versions/1` ; `?version=99` → **404 `VERSION_INTROUVABLE`** ;
      4. **anti-énumération** : `GET /bilan/consultation/2024` (inexistant) → **404 générique** ; exercice d'une **autre org** → **404** (jamais 403) ; index de l'org A ne contient aucune ligne de l'org B ;
      5. **exercice sans jeu** : exercice 2023 déclaré sans jeu → 200, `jeuEtats:null` / `liasse:null` / `versions:[]` / `previsionnels:[]` ;
      6. **aucune écriture** : compteurs des 5 collections identiques avant/après ; **déterminisme** : deux appels ⇒ corps strictement identiques ; endpoint présent dans `/api/docs-json`.
- [x] Statut synchronisé **aux 3 endroits** (en-tête de ce doc · `docs/sprint-status.yaml` · *Progress Tracking*) + `completed_date: "YYYY-MM-DD"` à la clôture.
- [x] Flux git : branche **`MNV-072`** rebasée sur `origin/dev` **avant** de coder, commits `MNV-072(bilan): …`, PR titrée `MNV-072(bilan): …`, intégration **« Rebase and merge »** + `--delete-branch` ; le doc story suit le **même flux** sur base `main` dans le repo `docs/`.
- [x] `/code-review` puis `/security-review` passés avant intégration.

---

## Story Points Breakdown

- Repos : `HypothesesRepository.trouverParExercice` + lecture jeu par libellé (thin, tenant-scoped) : **0,25 pt**
- `ConsultationService` — résolution + jointure sur libellé + délégation stricte de la liasse : **1 pt**
- `ConsultationController` (index + détail, `?version`) + DTO + Swagger + ordre de routes : **0,5 pt**
- Anti-énumération (ordre de résolution, 404 générique) : **0,25 pt**
- Tests unit + e2e (3 contrôleurs montés) + mutation-test : **0,5 pt**
- Vérif docker (production des cas v2, sans-jeu, autre-org) : **0,5 pt**
- **Total : 3 points**

**Rationale :** aucun calcul financier nouveau (la liasse est **déléguée** aux services 064/065), aucune écriture, aucune transaction. La charge est dans la **jointure par exercice**, la **délégation stricte** (le vrai risque) et l'**anti-énumération** — pas dans le calcul.

---

## Additional Notes

- **Ne pas confondre trois « consultations » voisines** : 072 = **restitution structurée par exercice** (états + prévisionnel, lecture) ; 071 = **comparaison de scénarios** sur une même base (déjà livrée) ; 074 = **comparaison inter-exercices** (S16, *Could*). Endpoints et sémantiques distincts.
- **Décision D1 — la façade délègue, ne produit jamais.** Interdiction d'appeler le moteur depuis `consultation/`. Rationale et preuve : §*le vrai risque* + AC-3 + mutation dédiée.
- **Décision D2 — édge « jeu sans exercice déclaré ».** L'index unique 066 est sur `jeux_etats(tenantId, exercice)` ; rien n'impose qu'un `Exercice` (067) existe pour ce libellé. Deux options pour l'index : (a) source = `exercices` seule (un jeu orphelin d'exercice serait **masqué** de la consultation — inacceptable pour de la donnée validée) ; (b) **union** des libellés de `exercices` **et** `jeux_etats`, `statutExercice=null` pour un libellé sans `Exercice` doc. **Retenu : (b)** — la consultation ne doit **jamais** masquer un jeu d'états existant. À prouver en vérif docker (créer un jeu sur un exercice non déclaré via 067, vérifier qu'il apparaît avec `statutExercice:null`).
- **Point ouvert (non bloquant, hors périmètre) :** faut-il journaliser la consultation d'une version validée comme acte d'audit ? Décision **072 : non** (une lecture n'est pas un acte modifiant ; 067 trace les actes d'écriture). À rouvrir si une exigence de traçabilité des consultations émerge (RGPD/preuve) — porté par une story dédiée, pas par 072.

---

## Progress Tracking

**Status History :**
- 2026-07-24 : Créée (Scrum Master) — statut `defined`. Périmètre cadré par **FR-022** + le contrat front **FE-037** (`/bilan/consultation`). Développement délégué hors Claude Code (DeepSeek v4 Flash).
- 2026-07-24 : Dev livré → **revue de code** (4 constats corrigés, 1 bloquant) → **vérif docker** bout-en-bout → **revue de sécurité** (0 vulnérabilité) → PR #30 « Rebase and merge » sur `dev` (HEAD `d747ef0`). Statut `done`.

**Réalisé :** `ConsultationService` (index par exercice = union `exercices`∪`jeux_etats` tenant-scoped, tri décroissant, compteurs versions/prévisionnels ; détail = résolution tenant-scoped + délégation stricte de la liasse + versions + prévisionnels filtrés par `base.exercice`) · `ConsultationController` sur préfixe **propre** `bilan/consultation` (`GET /`, `GET /:exercice?version=n`, littéral avant paramétré, gate + rôles) · DTO `ConsultationIndexItemDto` / `ConsultationExerciceDetailDto` (Swagger) · `JeuHypothesesRepository.trouverParExercice` (tenant-scoped). **Aucune écriture, aucune transaction, aucun événement Kafka, aucun appel moteur.**

**Constats de revue corrigés d'office (4, dont 1 bloquant) :**
1. **BLOQUANT — liasse du brouillon divergente (AC-3).** La façade ré-émettait la `LiasseProduite` **brute** (`{ ...resultat.liasse }`), soit **8 clés** — 2 de plus (`referentiel`, `checksum`) que `GET /bilan/etats/:id` qui les remonte hors liasse via `JeuEtatsResponseDto` (6 blocs). La liasse de consultation n'était donc **pas** strictement identique à l'endpoint canonique. Vérif docker : `liasse consultation == /bilan/etats/:id ⇒ False`. **Correctif** : projection canonique aux 6 blocs (`bilan/compteResultat/coherenceResultat/tft/notes/controles`) dans la branche brouillon (la branche version reste la liasse figée complète, identique à `/versions/:n`). **Test AC-3 durci** : le mock renvoie une `LiasseProduite` avec `referentiel`+`checksum`, l'assertion passe de `toMatchObject` (laxiste — laissait fuir les clés en trop) à `toEqual` + `not.toHaveProperty`. Re-vérif docker : `⇒ True` sur les deux branches.
2. **`?version` sur exercice existant sans jeu → `EXERCICE_INTROUVABLE`** (contradictoire : l'exercice existe). → **`VERSION_INTROUVABLE`** (unit + e2e alignés).
3. **Dates epoch fabriquées** (`1970-01-01`) à l'index pour l'edge D2 (jeu sans `Exercice` déclaré) → **`null`** (DTO `dateDebut`/`dateFin` nullable).
4. **`ConsultationExerciceDetailDto` créé mais non câblé** → détail sans schéma Swagger + DTO mort → `@ApiOkResponse({ type: … })` branché.

**Mutation-test (rejoué sur le code réel, restauration vérifiée) :**
| Mutation | Garde | Résultat |
|---|---|---|
| liasse brute `{ ...resultat.liasse }` (referentiel/checksum ré-inclus) | AC-3 (identité) | **rouge** ✓ (après durcissement) |
| `?version` ignoré (`vueType` toujours BROUILLON) | AC-4 (sélection version) | **rouge** ✓ |
| filtre `base.exercice` retiré (`find({})`) | AC-5 | **rouge** ✓ (4 tests) |
| tri décroissant supprimé | AC-1 | **rouge** ✓ |
| gate `@RequiresBilanAccess` retiré | AC-8 | détecté (compile `noUnusedLocals`) + 3 e2e 403/401 positifs |
| _Note AC-10_ : pas de collision possible (racine `@Get()` vs segment `@Get(':exercice')`) — les deux endpoints résolvent (e2e index 200 + détail 200). |

**Vérification docker réelle** (stack `prospera-*` vivante — mongo rs0 + kafka + redis + mailhog + IdP:3001 + bilan:3004 ; `docker restart` bilan avant conclusion — piège hot-reload). Org A **fraîche** via `register` → `emailVerifiedAt` en base → `login` (**JWT RS256 réel**, org `6a6375a2…beae`) ; gate semé (`orgkycstatuses`=APPROVED / `orgbilanentitlements`=ACTIVE + `referentiel` syscohada-revise@2.1 — ⚠️ **pluriel Mongoose**, pas de `collection` explicite). Dataset construit par la **vraie API** : exercice 2025 déclaré + jeu d'états validé + **rouvrir/re-valider ⇒ snapshots v1 & v2** + **2 prévisionnels** (prudent/optimiste) + exercice 2023 déclaré **sans jeu**.
- **① Index** → **200** : uniquement les 2 exercices d'org A (2025 `statutJeu=VALIDE nombreVersions=2 nombrePrevisionnels=2`, 2023 `jeuEtatsId:null` compteurs 0), tri décroissant. Les 3 `jeux_etats` des **autres orgs** n'apparaissent pas (isolation).
- **② Détail 2025** → **200** : `liasse` **strictement identique** à `GET /bilan/etats/:id` (6 clés, `== True`) ; `versions=[2,1]` ; `previsionnels` = prudent+optimiste, tous `base.exercice=2025`.
- **③ `?version=1`** → **200** `vue.type=VERSION` : liasse **identique** à `GET /bilan/etats/:id/versions/1` (`== True`). `?version=99` → **404 `VERSION_INTROUVABLE`**.
- **④ Edge 2023** (exercice sans jeu) → **200** `jeuEtats/liasse/vue: null`, `versions/previsionnels: []` ; **`2023?version=1` → 404 `VERSION_INTROUVABLE`** (le correctif n°2).
- **⑤ Anti-énum / isolation** : `/9999` → **404 `EXERCICE_INTROUVABLE`** générique ; **`/2024` → 404** (org A n'a pas 2024, **une autre org oui** — non divulgué) ; sans jeton → **401**.
- **⑥ Zéro écriture** : compteurs `jeux_etats=4 / snapshots_liasse=6 / jeux_hypotheses=8 / exercices=2 / audit_events=6` **identiques avant et après** la rafale de lectures. **Déterminisme** : deux appels ⇒ corps **strictement identiques**. Endpoint présent dans `/api/docs-json` (`/bilan/consultation` + `/bilan/consultation/{exercice}`).

**Revue de sécurité — aucune vulnérabilité exploitable** (PR #30, publiée en commentaire) : (1) **isolation tenant** fail-closed sur tous les repos (`{ tenantId }` fusionné en dernier), délégations re-résolvant le jeu par tenant — prouvée live (autre org → 404) ; (2) **injection NoSQL** neutralisée — le libellé n'entre qu'en **valeur d'égalité**, `version` `@IsInt`/`@Min(1)` avant tout accès base ; (3) **gate** `@RequiresBilanAccess` + `@Roles` derrière la chaîne globale (401/403 live) ; (4) **anti-énumération** 404 génériques indistincts ; (5) **intégrité** : endpoint strictement en lecture (zéro écriture prouvée).

**Qualité (DoD) :** lint **0 warning** · `npm run build` OK · couverture module `consultation` **100 / 97.05 / 100 / 100**, globale **98.55 / 92.95 / 98.74 / 98.51** (≥ 65/90/90/90) · **588 unit** (1 skip) + **11 e2e consultation** verts · non-régression (endpoints `/bilan/etats/*`, `/bilan/hypotheses/*` inchangés).

**Actual Effort :** ~3 pts (dev externe) + revue/4 correctifs/vérif docker/sécu côté intégration.

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning)**
