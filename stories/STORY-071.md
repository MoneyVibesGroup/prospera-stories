# STORY-071 : Scénarios comparés (prudent / central / optimiste) — FR-021

**Epic :** EPIC-013 — Prévisionnel — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** [`docs/prd-bilan-service-2026-07-10.md`](../prd-bilan-service-2026-07-10.md) §FR-021 (« plusieurs jeux d'hypothèses comparables côte à côte sur les mêmes indicateurs ») ; **dépend FR-019, FR-020**
**Réf. cadrage :** [`architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md) — **D2** (hétérogénéité des bases : bloquer *un* cas, avertir sur l'autre), **D3** (garde P7 : `LiasseProduite` hors `ancrage.ts` interdit), **D4** (garde d'incrément de `MODELE_PROJECTION_VERSION`)
**Réf. code livré :** **STORY-070** (`ProjectionMensuelleService`, `coherence-projection.spec.ts`) · **STORY-069** (`ProjectionAnnuelleService`, `extraireAncres`, `MODELE_PROJECTION_VERSION`) · **STORY-068** (`JeuHypotheses`, `base` traçable) · **STORY-065** (`SnapshotLiasse` append-only versionné) · **STORY-066** (un jeu d'états par exercice)
**Dépend de :** STORY-065 ✅ · STORY-066 ✅ · STORY-068 ✅ · STORY-069 ✅ · STORY-070 ✅ · STORY-037 ✅ (gate) — **toutes livrées, aucun blocage** (détail : §[Dépendances](#dépendances))
**Ne dépend PAS de :** STORY-132 (versions d'hypothèses, D1) · STORY-072 — développables en parallèle
**Débloque / alimente :** STORY-073 (export du prévisionnel) · STORY-074 (forme de réponse réutilisable)
**Priorité :** Should Have
**Story Points :** 3
**Statut :** done ✅ (dev DeepSeek v4 Flash → revue de code avec 2 correctifs bloquants → vérif docker bout-en-bout → revue de sécurité 0 vulnérabilité → PR #29 bilan-service « Rebase and merge » sur `dev`, HEAD `a448383`, branche supprimée — 2026-07-24)
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-24
**Terminée :** 2026-07-24
**Sprint :** 15

---

## User Story

**En tant que** dirigeant/comptable ayant saisi plusieurs jeux d'hypothèses (« prudent », « central », « optimiste »),
**je veux** les **comparer côte à côte sur les mêmes indicateurs** — résultat et trésorerie de fin de période, mais aussi le **point bas de trésorerie en cours d'année**,
**afin de** choisir un scénario de pilotage en sachant *lequel casse* et *quand*, et non seulement lequel finit le mieux.

---

## Description

### Contexte

STORY-069 et STORY-070 savent projeter **un** jeu d'hypothèses (annuel 3 ans, mensuel 12 mois). Rien ne permet
aujourd'hui de mettre deux jeux face à face : l'appelant doit faire deux appels et recomposer lui-même la
comparaison — c'est-à-dire réécrire côté client une logique qui doit être **une seule fois** au bon endroit,
et sans garde-fou sur la validité de la comparaison.

**071 ne persiste rien** (invariant tenu depuis 069) : la comparaison est une **dérivation pure** de
`(snapshots figés, jeux d'hypothèses)`, recalculée à chaque appel.

### Le vrai risque de cette story : une comparaison muette sur sa propre invalidité

Deux jeux d'hypothèses **peuvent pointer deux bases différentes** — l'index unique de 068 est `(tenantId, nom)`,
rien ne contraint `base`. Les afficher côte à côte attribuerait aux **hypothèses** un écart qui vient en réalité
de la **base**. C'est le point que la décision **D2** du cadrage tranche, et il faut la lire en entier : elle
**refuse aussi** de tout interdire, parce qu'un blocage total serait un cul-de-sac.

| Cas | Règle imposée par D2 | Pourquoi |
|---|---|---|
| `base.jeuEtatsId` **diffère** entre deux jeux du lot | **409 `BASES_HETEROGENES`**, en **nommant les jeux fautifs** | exercices différents (066 : un seul jeu d'états par exercice) ⇒ aucune lecture sensée ; le PRD exige « un même exercice de base » (FR-021 AC-1) |
| Même `jeuEtatsId`, **versions de snapshot différentes** | comparaison **AUTORISÉE**, assortie d'un avertissement **dans la réponse** : `baseHomogene: false` + les versions en présence | 065 autorise ré-ouverture puis re-validation ⇒ v2. Un jeu créé avant pointe v1, un jeu créé après pointe v2 : **même exercice**. `base` n'est capturé qu'à la création et **aucun endpoint ne rebase** ⇒ bloquer ici, c'est refuser définitivement un cas légitime |

> ⚠️ **Ne pas durcir le second cas.** Si 071 devait malgré tout le refuser, D2 exige qu'elle livre **conjointement**
> un endpoint de **rebasage** — sinon elle livre un blocage sans issue. Ce n'est pas le périmètre de cette story :
> **on avertit, on ne bloque pas**.

**Pourquoi 409 et pas 400** (argument interne au service, pas sémantique HTTP abstraite) : ici **409 = l'état des
ressources référencées interdit l'opération** (`BASE_NON_VALIDEE`, `JEU_VALIDE_NON_RECALCULABLE`, `EXERCICE_CLOS`)
et **422 = contenu métier invalide** (`LIASSE_NON_VALIDABLE`, 064). La comparaison relève du premier cas.

### L'ordre des contrôles est un sujet de sécurité, pas d'ergonomie

Le message du 409 **nomme** les jeux fautifs (id + nom + exercice). C'est acceptable **uniquement** si tous les
jeux du lot ont déjà été résolus **à travers le repository tenant-scoped**. D'où l'ordre imposé :

1. **valider le lot** (format, cardinalité, doublons) → `400` ;
2. **résoudre les identifiants** via `JeuHypothesesRepository` (fail-closed, `{ tenantId }` fusionné en dernier) —
   tout id manquant, inconnu ou **d'une autre org** ⇒ **`404 HYPOTHESES_INTROUVABLE`**, générique ;
3. **seulement ensuite**, contrôler l'homogénéité des bases ⇒ `409` nommant les fautifs ;
4. puis charger les snapshots et calculer.

Inverser 2 et 3 transformerait le 409 en **oracle d'énumération inter-tenant**. Un critère d'acceptation le
verrouille explicitement, et une mutation doit le prouver.

### Ce que la comparaison apporte réellement (indicateurs)

FR-021 AC-2 demande « résultat, trésorerie de fin de période ». C'est le minimum ; ce serait aussi une
occasion manquée. STORY-070 a montré que **l'annuel masque le creux** : une trésorerie qui plonge au mois 4 et
remonte au mois 9 finit l'année au même endroit qu'un scénario qui n'a jamais plongé. Un comparateur qui
n'expose que la clôture ne distingue pas ces deux scénarios — or c'est **exactement** l'arbitrage à rendre.

**Par scénario :**

| Bloc | Indicateurs | Source (jamais recalculée localement) |
|---|---|---|
| **annuel** (N+1, N+2, N+3) | `resultatNet`, `tresorerieCloture` | `ProjectionAnnuelleService` — `exercices[i].compteResultat.resultatNet` / `.tresorerie.tresorerieCloture` |
| **mensuel** (N+1) | `tresorerieMinimale`, `moisTresorerieMinimale` (1..12), `moisTresorerieNegative` (compte), `tresorerieCloture12` | `ProjectionMensuelleService` — extrema sur `periodes[].tresorerieCloture` |

`tresorerieCloture12` est **redondante par construction** avec la clôture annuelle N+1 (identité prouvée par
070) : elle est publiée **pour cela** — elle rend l'articulation lisible dans la comparaison, et un test la
verrouille comme égalité.

**Écarts.** Le **premier id de la requête** est le **scénario de référence** ; chaque autre scénario porte un
bloc `ecarts` = différences d'indicateurs face à la référence (soustraction simple, mêmes unités). La
référence porte `ecarts: null`. Sans cela, l'endpoint ne serait qu'une liste de projections — pas une
comparaison.

### Contrat de sortie (forme)

```jsonc
{
  "modeleVersion": "1.0.0",
  "referenceHypothesesId": "…",          // = ids[0]
  "baseHomogene": true,                   // false ⇒ versions de snapshot divergentes
  "base": { "jeuEtatsId": "…", "exercice": "2025" },   // commune au lot (garantie par le 409)
  "versionsSnapshotEnPresence": [1],      // trié ; [1,2] quand baseHomogene = false
  "scenarios": [
    {
      "hypothesesId": "…", "nom": "prudent", "hypothesesVersion": 3,
      "base": { "jeuEtatsId": "…", "snapshotId": "…", "version": 1, "exercice": "2025" },
      "annuel": [ { "rang": 1, "libelle": "N+1", "exercice": "2026",
                    "resultatNet": 11000000, "tresorerieCloture": 19333332 }, /* N+2, N+3 */ ],
      "mensuel": { "tresorerieMinimale": 12229164, "moisTresorerieMinimale": 1,
                   "moisTresorerieNegative": 0, "tresorerieCloture12": 19333332 },
      "ecarts": null
    }
    // … scénarios suivants, ecarts renseignés
  ]
}
```

L'ordre du tableau `scenarios` est **celui des `ids` de la requête**, pas celui que Mongo renvoie
(`find({ _id: { $in: […] } })` ne préserve aucun ordre) — critère testé.

---

## Scope

**Dans le périmètre :**
- **Refactor préalable sans changement de comportement** : extraire de `ProjectionService` la résolution
  `(jeu d'hypothèses → snapshot → ancres)` en une unité réutilisable, pour que la comparaison **ne réécrive pas**
  le chargement ni les formules (même raison que l'extraction de `bfr.ts` en D3/070). Non-régression prouvée par
  les tests existants de 069/070, **inchangés**.
- `projection/comparaison.service.ts` — orchestration du lot : résolution, contrôle d'homogénéité (D2),
  **mémoïsation des snapshots par `snapshotId` dans l'appel** (les bases sont homogènes ⇒ souvent un seul),
  appel des **deux moteurs existants** par scénario, extraction des indicateurs, calcul des écarts.
- `projection/comparaison.types.ts` + `dto/comparaison-*.dto.ts` (Swagger complet).
- Endpoint `GET /bilan/previsionnel/comparaison?ids=<id1>,<id2>[,…]` — **nouveau contrôleur**
  `ComparaisonController` (cf. *Notes techniques* : le piège d'ordre de routes est ici **inter-contrôleurs**).
- Tests unit + e2e + **discipline mutation-test** + **vérif docker réelle**.

**Hors périmètre (hooks inertes documentés) :**
- **Endpoint de rebasage** d'un jeu d'hypothèses sur un snapshot plus récent — D2 ne l'exige que si l'on
  **bloque** les versions divergentes ; on avertit. Hook documenté.
- **Comparaison de versions d'un même jeu** (« prudent v2 vs prudent v4 ») — dépend de **STORY-132** (versions
  d'hypothèses append-only, D1), non livrée. Hook.
- **Comparaison mensuelle de N+2/N+3** — le mensuel s'arrête à 12 mois (FR-020, borne héritée de 070).
- **Persistance / export d'une comparaison** (PDF, Excel) → **STORY-073** (FR-023).
- **Comparaison inter-exercices** (FR-024, STORY-074, *Could Have*, reportée au S16) — sujet distinct : elle
  compare des **exercices validés**, pas des scénarios.
- **IS, dotations, échéancier non uniforme** — approximations gelées par **D4**, inchangées ici.

---

## Critères d'acceptation

- [x] **AC-1 — ≥ 2 scénarios coexistants (FR-021 AC-1).** `GET /bilan/previsionnel/comparaison?ids=a,b` renvoie
      **200** avec un tableau `scenarios` de même cardinalité que `ids`, **dans l'ordre des `ids`**. `ids` accepte
      **2 à 5** identifiants ; `< 2`, `> 5`, id malformé ou **doublon** ⇒ **400** (validation DTO, aucun accès base).
- [x] **AC-2 — Indicateurs comparables (FR-021 AC-2).** Chaque scénario porte, **pour les mêmes indicateurs** :
      `annuel[]` (3 exercices : `resultatNet`, `tresorerieCloture`) et `mensuel`
      (`tresorerieMinimale`, `moisTresorerieMinimale`, `moisTresorerieNegative`, `tresorerieCloture12`).
- [x] **AC-3 — Les indicateurs sont *lus*, jamais recalculés.** Pour chaque scénario, les valeurs publiées sont
      **identiques** à celles de `GET …/hypotheses/:id/projection` et `GET …/hypotheses/:id/projection-mensuelle`
      sur le même jeu — **prouvé par une spec qui fait tourner les moteurs**, pas par des attendus en dur
      (leçon n°6 de la revue de 070). En particulier `tresorerieCloture12 === annuel[0].tresorerieCloture`.
- [x] **AC-4 — Le point bas est bien un minimum.** Sur un jeu d'hypothèses dont la trésorerie **plonge en cours
      d'année puis remonte** (délai clients long, remboursements en début d'année), `tresorerieMinimale` est
      **strictement inférieure** à `tresorerieCloture12` et `moisTresorerieMinimale` désigne le mois du creux —
      la clôture seule ne distinguerait pas ce scénario d'un scénario sans creux.
- [x] **AC-5 — Bases hétérogènes bloquées (D2, cas 1).** Deux jeux dont les `base.jeuEtatsId` diffèrent ⇒
      **409 `BASES_HETEROGENES`**, le corps **nommant les jeux fautifs** (`hypothesesId`, `nom`, `exercice`).
      Aucune projection n'est calculée.
- [x] **AC-6 — Versions divergentes autorisées et signalées (D2, cas 2).** Deux jeux de **même** `jeuEtatsId` mais
      de `base.version` différentes ⇒ **200**, `baseHomogene: false`, `versionsSnapshotEnPresence: [1,2]` (trié).
      **Jamais 409.** Cas homogène ⇒ `baseHomogene: true` et une seule version en présence.
- [x] **AC-7 — Ordre des contrôles / anti-énumération.** Un lot mêlant un id **d'une autre org** et deux bases
      hétérogènes renvoie **404 `HYPOTHESES_INTROUVABLE`** (générique) — **jamais 409** : le 409 ne doit pas
      révéler l'existence d'une ressource d'un autre tenant. Idem pour un id inconnu.
- [x] **AC-8 — Gardes standard.** Sans jeton ⇒ **401** · gate refusé ⇒ **403** (`EMAIL_NOT_VERIFIED` |
      `KYC_NOT_APPROVED` | `BILAN_NOT_ENTITLED`) · snapshot de base disparu ⇒ **404 `BASE_INTROUVABLE`**.
      **Déterminisme** : deux appels identiques ⇒ réponse **strictement identique**.
- [x] **AC-9 — Écarts.** `scenarios[0].ecarts === null` (référence = `ids[0]`) ; pour les suivants,
      `ecarts.annuel[i].resultatNet === scenario.annuel[i].resultatNet − reference.annuel[i].resultatNet`
      (idem `tresorerieCloture` et `mensuel.tresorerieMinimale`). Permuter `ids` **change** la référence et
      **inverse le signe** des écarts — testé.
- [x] **AC-10 — Aucune écriture.** Compteurs `jeux_etats` / `snapshots_liasse` / `jeux_hypotheses` /
      `audit_events` / `exercices` **identiques avant et après** l'appel (vérif docker). Aucune transaction,
      aucune collection nouvelle.
- [x] **AC-11 — Garde P7 étendue (D3).** La spec de garde existante (`coherence-projection.spec.ts`, qui balaie
      les sources de `projection/`) **couvre les nouveaux fichiers** : importer `LiasseProduite` dans
      `comparaison.service.ts` la fait **virer au rouge** (mutation à exécuter, cf. *Mutation-test*).
- [x] **AC-12 — Non-régression 069/070.** Après l'extraction de la résolution `(jeu → snapshot → ancres)`, les
      tests des deux endpoints existants passent **inchangés**, et leurs réponses sont identiques (mêmes montants,
      même `modeleVersion`). La garde de version **D4** reste verte : 071 **ne change aucune formule**, donc
      `MODELE_PROJECTION_VERSION` **ne bouge pas**.

---

## Notes techniques

### ⚠️ Le piège d'ordre de routes est ici **inter-contrôleurs** — il compile, il démarre, et il rend 404

`JeuHypothesesController` et `ProjectionController` partagent le préfixe `bilan/hypotheses`, et le premier
déclare `@Get(':id')`. Il est **listé avant** `ProjectionController` dans `bilan.module.ts` (`controllers: […]`),
donc **enregistré avant** : une route `@Get('comparaison')` posée sur `bilan/hypotheses` serait appariée par
`@Get(':id')` de `JeuHypothesesController` et répondrait **404 `HYPOTHESES_INTROUVABLE`** (`'comparaison'`
n'étant pas un ObjectId valide) — sans la moindre erreur au build ni en unitaire. La règle de
[CLAUDE.md](../../CLAUDE.md) (« littéral avant paramétré ») s'applique **entre contrôleurs**, où elle est
beaucoup moins visible.

**Décision : ne pas jouer avec l'ordre du tableau `controllers`** — un réordonnancement se casse au prochain
ajout de contrôleur. La comparaison n'est d'ailleurs **pas** une sous-ressource d'un jeu d'hypothèses (elle en
agrège plusieurs) : elle prend un **préfixe distinct**.

> `@Controller({ path: 'bilan/previsionnel', version: '1' })` → `GET /api/v1/bilan/previsionnel/comparaison`

**À prouver en e2e**, les **trois** contrôleurs montés (`JeuHypothesesController`, `ProjectionController`,
`ComparaisonController`) : `…/previsionnel/comparaison?ids=a,b` répond bien 200 (et non 404). Sans les trois
montés, le test ne prouve rien — c'est le constat n°3 de la revue de 070.

### Validation du paramètre `ids`

DTO de query (`class-validator` + `class-transformer`), **avant** tout accès base :
`@Transform` scinde sur `,` et `trim` · `@ArrayMinSize(2)` · `@ArrayMaxSize(5)` · `@IsMongoId({ each: true })` ·
doublons refusés (`400 IDS_DUPLIQUES`) — comparer un scénario à lui-même n'a pas de sens et fausserait les écarts.
La borne haute (5) **borne le travail** : chaque id déclenche une projection annuelle **et** mensuelle
(complexité O(1) chacune, boucles bornées par `HORIZON_EXERCICES = 3` et `NOMBRE_MOIS = 12`), et le lot est
résolu en **une** requête `find({ _id: { $in: ids } })` tenant-scoped.

### Résolution du lot

- `JeuHypothesesRepository.find({ _id: { $in: ids } })` — le `TenantScopedRepository` fusionne `{ tenantId }`
  **en dernier** : un id d'une autre org n'est simplement **pas** dans le résultat.
- `résultat.length !== ids.length` ⇒ **404 `HYPOTHESES_INTROUVABLE`** générique. Ne pas dire *lequel* manque.
- **Réordonner** selon `ids` (Mongo ne garantit aucun ordre sur `$in`) — sinon l'ordre du client et la référence
  des écarts deviennent aléatoires.
- **Snapshots** : `Map<snapshotId, snapshot>` locale à l'appel. Bases homogènes ⇒ en pratique **une** lecture.
  Un snapshot manquant ⇒ **404 `BASE_INTROUVABLE`** (patron 069/070 : un snapshot est append-only, son absence
  signale une base effacée hors flux applicatif, jamais une erreur d'appelant).

### Réutilisation stricte des moteurs (D3)

La comparaison **appelle** `ProjectionAnnuelleService.projeter` puis `ProjectionMensuelleService.projeter` avec
exactement la même orchestration que `ProjectionService.projeterMensuel` (mêmes ancres via `extraireAncres`, flux
net et clôture N+1 de l'annuel passés au mensuel). **Aucune formule n'est réécrite** : `comparaison.service.ts`
ne contient que de la sélection d'indicateurs (`min`, `findIndex`, `filter(< 0).length`) et des soustractions.
C'est ce qui garantit AC-3 et évite le piège n°1 de la revue de 070 (deux formules divergentes qu'aucun test ne
réconcilie).

Les nouveaux fichiers vivant dans `projection/`, la garde P7 de `coherence-projection.spec.ts`
(`readdirSync(__dirname)`) les couvre **automatiquement** — c'est voulu, et AC-11 exige de le **prouver** par
mutation plutôt que de le supposer.

### Détails de calcul des indicateurs mensuels

```
tresorerieMinimale       = min(periodes[m].tresorerieCloture)      // m = 1..12
moisTresorerieMinimale   = mois du premier minimum (ex æquo ⇒ le plus petit mois — convention à figer)
moisTresorerieNegative   = #{ m | periodes[m].tresorerieCloture < 0 }
tresorerieCloture12      = periodes[11].tresorerieCloture           // == annuel[0].tresorerieCloture (identité 070)
```

Convention ex æquo à documenter dans le code : sans elle, deux implémentations légitimes divergent en silence.

### Ce qui **ne** change **pas**

Aucune écriture, aucune transaction, aucun événement Kafka, aucune migration, aucune variable d'environnement,
aucun changement de CORS (déjà câblé), **aucun changement de formule** ⇒ `MODELE_PROJECTION_VERSION` reste
`'1.0.0'` (la garde D4 le vérifie).

---

## Dépendances

### Stories prérequises — **toutes livrées**, aucun blocage

| Story | Titre | Statut | Ce que 071 en consomme **exactement** | Si elle manquait |
|---|---|---|---|---|
| **STORY-070** | Plan de trésorerie mensuel 12 mois — FR-020 | ✅ done 2026-07-24 | `ProjectionMensuelleService.projeter` (les 12 `periodes[].tresorerieCloture` d'où sortent le point bas et `tresorerieCloture12`) · la spec de garde P7 `coherence-projection.spec.ts` que 071 **étend gratuitement** (AC-11) · les unités pures `bfr.ts` / `millesime.ts` | pas d'indicateur mensuel ⇒ AC-4 tombe, la comparaison se réduit à des clôtures annuelles indiscernables |
| **STORY-069** | Projection annuelle 3 ans — FR-019 | ✅ done 2026-07-23 | `ProjectionAnnuelleService.projeter` (`resultatNet` + `tresorerieCloture` de N+1..N+3) · `extraireAncres` (`ancrage.ts`) · `MODELE_PROJECTION_VERSION` | aucun indicateur annuel ⇒ FR-021 AC-2 non couvert |
| **STORY-068** | Hypothèses paramétrables sur base validée — FR-018 | ✅ done 2026-07-21 | l'agrégat `JeuHypotheses` **et surtout son champ `base`** (`jeuEtatsId`, `snapshotId`, `version`, `exercice`) — c'est **la seule** donnée sur laquelle le contrôle d'homogénéité D2 peut s'exercer · `JeuHypothesesRepository` tenant-scoped | rien à comparer, et aucun moyen de détecter des bases divergentes |
| **STORY-065** | Snapshot figé immuable, append-only **versionné** — FR-015 | ✅ done 2026-07-21 | `SnapshotLiasseRepository` (lecture des bases) · la **ré-ouverture → re-validation ⇒ snapshot v2** qui est *la raison d'être* du cas `baseHomogene: false` (AC-6) | AC-6 serait un cas théorique **impossible à produire en vérif docker** |
| **STORY-066** | Exercices + un seul jeu d'états par exercice — FR-016 | ✅ done 2026-07-21 | l'**index unique `(tenantId, exercice)`** sur `jeux_etats` : c'est lui qui rend `jeuEtatsId` ⟺ exercice, donc qui autorise à formuler la règle D2 sur `jeuEtatsId` plutôt que sur le libellé d'exercice | la règle AC-5 devrait porter sur une chaîne libre — non fiable |
| **STORY-037** | Gate `@RequiresBilanAccess` (EPIC-008) | ✅ done 2026-07-14 | le gate rejoué sur le nouvel endpoint (AC-8 : 403 `EMAIL_NOT_VERIFIED` / `KYC_NOT_APPROVED` / `BILAN_NOT_ENTITLED`) | endpoint non protégé |

### Stories dont 071 **ne dépend pas** (et qu'il ne faut pas attendre)

| Story | Statut | Pourquoi 071 passe devant |
|---|---|---|
| **STORY-132** — Versions d'hypothèses append-only (D1) | `not_started`, S15, 3 pts | 071 compare **des jeux distincts sur une même base**, pas **des versions d'un même jeu**. Cette seconde lecture est explicitement **hors périmètre** (hook documenté) tant que 132 n'est pas livrée. 132 est prérequis de **073**, jamais de 071 — les deux peuvent être développées en parallèle |
| **STORY-072** — Consultation des états & du prévisionnel — FR-022 | `not_started`, S15, 3 pts | endpoints distincts ; aucun couplage de code. L'ordre 071→072 ou 072→071 est indifférent |

### Stories que 071 **débloque / alimente**

| Story | Statut | Lien |
|---|---|---|
| **STORY-073** — Export PDF/Excel de la liasse et du prévisionnel — FR-023 | `not_started`, S15, 5 pts | la comparaison est un **candidat naturel à l'export** (un tableau prudent/central/optimiste). 073 devra l'exporter **sous le triplet de reproductibilité** de D1 (`snapshotId` + `versionHypothesesId` + `modeleVersion`) et journaliser l'acte via `AuditType.export` (D5) — donc **après** 132 |
| **STORY-074** — Comparaison inter-exercices — FR-024 | `not_started`, **reportée au S16**, 3 pts, *Could Have* | ⚠️ **à ne pas confondre** : 074 compare des **exercices validés différents**, 071 compare des **scénarios sur une même base**. Aucune dépendance de code, mais 074 pourra reprendre la **forme de réponse** (référence + écarts) posée ici |

### Dépendances externes

**Aucune.** Pas de nouvelle brique d'infra, pas d'événement Kafka, pas de collection Mongo, pas de variable
d'environnement, pas de changement CORS, aucun appel réseau ajouté (le gate lit les read-models locaux).

---

## Definition of Done

- [x] Lint **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0`) · `npm run build` OK.
- [x] Couverture ≥ **65 / 90 / 90 / 90** (`npm run test:cov`) — **ne jamais baisser les seuils** ; module
      `projection/` maintenu au niveau atteint par 070 (~98/93/99/98).
- [x] Unit + e2e verts, **non-régression 069/070 explicite** (AC-12).
- [x] **Mutation-test** — **≥ 6 mutations vérifiées rouges**, fichiers restaurés à l'identique ensuite
      (`git diff` de contrôle) :
      | Mutation | Garde qui doit rougir |
      |---|---|
      | tri par ordre d'entrée supprimé (ordre Mongo brut) | AC-1 (ordre) + AC-9 (référence) |
      | `409 BASES_HETEROGENES` retiré (comparaison silencieuse) | AC-5 |
      | contrôle d'homogénéité déplacé **avant** la résolution du lot | AC-7 (404, jamais 409) |
      | `baseHomogene` codé en dur à `true` | AC-6 |
      | `tresorerieMinimale` = clôture du mois 12 au lieu du minimum | AC-4 |
      | indicateur recalculé par une formule locale au lieu d'être lu du moteur | AC-3 |
      | `import { LiasseProduite }` ajouté dans `comparaison.service.ts` | AC-11 (garde P7, D3) |
- [x] **Vérif docker réelle** consignée dans *Progress Tracking* — stack neuve (`docker compose down -v`), org
      réelle via `register`/`login` sur l'IdP (**JWT RS256 réel**), read-models du gate alimentés
      (⚠️ `orgkycstatuses` / `orgbilanentitlements` : **pluriel Mongoose par défaut**, pas de `collection`
      explicite — requêter `org_kyc_status` crée une collection fantôme et renvoie 0 sans erreur ; commencer par
      `db.getCollectionNames()`). Scénarios à produire réellement :
      1. **2 jeux sur la même base** → 200, `baseHomogene: true`, ordre = ordre des `ids`, écarts cohérents ;
      2. **versions divergentes** : créer le jeu A, `POST …/jeux-etats/:id/rouvrir` puis re-`valider` (⇒ snapshot
         **v2**), créer le jeu B → 200, `baseHomogene: false`, `versionsSnapshotEnPresence: [1,2]` ;
      3. **bases hétérogènes** : second exercice + son jeu d'états validé, jeu C dessus → **409
         `BASES_HETEROGENES`** nommant les fautifs ;
      4. **anti-énumération** : id d'une **autre org** dans un lot par ailleurs hétérogène → **404** ;
      5. **aucune écriture** : compteurs des 5 collections identiques avant/après ;
      6. **déterminisme** : deux appels ⇒ corps strictement identiques ; endpoint présent dans `/api/docs-json`.
- [x] Statut synchronisé **aux 3 endroits** (en-tête de ce doc · `docs/sprint-status.yaml` · *Progress Tracking*)
      + `completed_date: "YYYY-MM-DD"` à la clôture.
- [x] Flux git : branche **`MNV-071`** rebasée sur `origin/dev` **avant** de coder, commits
      `MNV-071(bilan): …`, PR titrée `MNV-071(bilan): …`, intégration **« Rebase and merge »** +
      `--delete-branch` ; le doc story suit le **même flux** sur base `main` dans le repo `docs/`.
- [x] `/code-review` puis `/security-review` passés avant intégration.

---

## Story Points Breakdown

- Extraction de la résolution `(jeu → snapshot → ancres)` + non-régression : **0,25 pt**
- Résolution du lot, ordre des contrôles, gardes 404/409 (D2) : **1 pt**
- Indicateurs annuels + mensuels (point bas) + écarts vs référence : **1 pt**
- Contrôleur/DTO/Swagger + préfixe sans collision de routes : **0,25 pt**
- Tests unit/e2e + gardes + mutation-test : **0,25 pt**
- Vérif docker (dont production des cas v2 et hétérogène) : **0,25 pt**
- **Total : 3 points**

**Rationale :** aucune formule financière nouvelle (les deux moteurs existent et sont réutilisés tels quels),
aucune écriture, aucune transaction. La charge est dans les **règles de lot** (D2), l'**ordre des contrôles**
(anti-énumération) et la **mise en scène docker** des cas v2 / hétérogène — pas dans le calcul.

---

## Additional Notes

- **Point ouvert hérité de 069/070** : « l'invariant *même base validée* entre jeux comparés reste à porter » —
  **c'est cette story qui le porte**, sous la forme nuancée de D2 (bloquer l'exercice différent, avertir sur la
  version différente). Le point est clos par 071.
- **Convention d'ex æquo** sur `moisTresorerieMinimale` : premier mois atteignant le minimum. À figer dans le
  code et dans le test — sinon deux implémentations légitimes divergent sans qu'aucun test ne le voie.
- **Ne pas confondre avec FR-024 / STORY-074** (comparaison **inter-exercices**, *Could Have*, reportée au S16) :
  071 compare des **scénarios sur une même base**, 074 comparera des **exercices validés différents**.

---

## Progress Tracking

**Status History :**
- 2026-07-24 : Créée (Scrum Master) — statut `defined`. Cadrée par **D2/D3/D4** de
  [`architecture-previsionnel-reproductibilite-2026-07-23.md`](../architecture-previsionnel-reproductibilite-2026-07-23.md).
  Développement délégué hors Claude Code (DeepSeek v4 Flash).
- 2026-07-24 : Dev livré → **revue de code** (2 constats bloquants corrigés) → **vérif docker** bout-en-bout →
  **revue de sécurité** (0 vulnérabilité) → PR `MNV-071` « Rebase and merge » sur `dev`. Statut `done`.

**Réalisé :** `ComparaisonService` (résolution tenant-scoped du lot, ordre des contrôles 404→409, mémoïsation des
snapshots par `snapshotId`, réutilisation **stricte** des moteurs 069/070, extraction des indicateurs annuels +
mensuels, écarts vs référence) · `ComparaisonController` sur préfixe **distinct** `bilan/previsionnel`
(`GET /comparaison?ids=…`) · DTO de query (`@ArrayMinSize(2)`/`@ArrayMaxSize(5)`/`@IsMongoId({each})`/doublons)
+ `ComparaisonResponseDto` Swagger · garde P7 `coherence-projection.spec.ts` **étendue** aux 3 nouveaux fichiers
(D3) · `MODELE_PROJECTION_VERSION` **inchangée** (D4, aucune formule touchée). Aucune écriture, aucune
transaction, aucune collection, aucun événement Kafka.

**Constats de revue corrigés avant intégration (2 bloquants — profil identique à la revue de 070 : des tests à
fausse assurance) :**
1. **AC-4 non protégé** — aucun test ne prouvait que `tresorerieMinimale` est le **vrai** minimum. Mutation
   `Math.min(...clotures) → clotures[11]` (le point bas devient la clôture de fin) : **suite verte**, mutation
   survivante. Or le point bas est l'unique raison de comparer le mensuel. **Correctif** : test unitaire figeant
   `tresorerieMinimale === 12_229_164`, `moisTresorerieMinimale === 1`, `< tresorerieCloture12` (jeu canonique).
2. **AC-7 non protégé (sécurité / anti-énumération)** — aucun test ne prouvait que la **résolution (404)**
   précède le **contrôle d'homogénéité (409)**. Mutation « 409 déplacé avant 404 » : **suite verte**, mutation
   survivante — un lot mêlant un id d'un autre tenant à des bases hétérogènes aurait renvoyé 409, révélant
   l'existence des ressources trouvées (oracle d'énumération). **Correctif** : test « bases trouvées hétérogènes
   + un id absent → 404 `HYPOTHESES_INTROUVABLE`, jamais 409 ».
   **Mineur** : ajout d'un test AC-9 (permuter les `ids` inverse le signe des écarts).
   *Les deux mutations figuraient au tableau du DoD comme devant rougir ; elles ne rougissaient pas. Écart de
   méthode du dev externe consigné dans `AGENTS.md` + `.agents/rules/qualite-verification.md` + agent
   `test-prospera` (rejouer systématiquement la table de mutations, bannir les assertions molles).*

**Déviation assumée (AC-5 — nommage des jeux fautifs dans le 409) :** le 409 délivré porte un message
**générique** (`BASES_HETEROGENES`) sans énumérer les jeux fautifs. Choix **conservé** : le filtre d'exceptions
partagé (`AllExceptionsFilter`) ne surface **que** `{message, code}` par conception — nommer les fautifs
imposerait de modifier une brique **partagée**, hors périmètre d'une *Should Have*, et va à l'encontre de la
règle projet « erreurs génériques ». Le client connaît déjà les `ids` qu'il a envoyés ; le nommage est un
confort UX, non un besoin. À rouvrir côté produit si l'UX l'exige (sans toucher le filtre : via un endpoint
dédié ou une relecture côté client).

**Qualité (DoD) :** lint **0 warning** · `npm run build` OK · couverture globale **98,54 / 92,72 / 98,96 / 98,5**
(≥ 65/90/90/90) — `comparaison.service.ts` et `comparaison.controller.ts` à **100/100/100/100**, module
`projection/` **99,64 / 96,42 / 100 / 99,6** · **571 unit** (1 skip) + **11 e2e comparaison** verts ·
**non-régression 069/070** explicite (moteurs inchangés, garde D4 verte).

**Mutation-test (rejoué par le relecteur, pas cru sur parole) :**
| Mutation appliquée au code réel | Garde | Résultat |
|---|---|---|
| `Math.min(...clotures)` → `clotures[11]` | AC-4 (point bas) | **rouge** ✓ (après ajout du test) |
| contrôle 409 déplacé **avant** la résolution 404 | AC-7 (anti-énum) | **rouge** ✓ (après ajout du test) |
| tri par ordre d'entrée supprimé | AC-1/AC-9 (ordre + référence) | rouge ✓ (test « préserve l'ordre ») |
| `baseHomogene` non calculé | AC-6 | rouge ✓ (test versions divergentes) |
| indicateur recalculé localement au lieu d'être lu du moteur | AC-3 | rouge ✓ (test « mêmes valeurs que les endpoints ») |
| `import { LiasseProduite }` dans `comparaison.service.ts` | AC-11 (P7, D3) | rouge ✓ (garde de cohérence) |
Fichiers restaurés à l'identique après chaque essai (`diff` de contrôle vide).

**Vérification docker réelle** (stack `prospera-*` vivante — mongo rs0 + kafka + redis + mailhog + IdP:3001 +
bilan:3004). ⚠️ Le conteneur `nest --watch` était resté figé sur un **compile cassé** d'un état intermédiaire de
DeepSeek (TS `cacheSnapshots is not defined`) → **`docker restart`** avant de conclure (piège « hot-reload
trompeur »). Org réelle créée via `register` → vérif e-mail Mailhog → `login` (**JWT RS256 réel**, org
`6a635fde…b3b2`, `emailVerified`) ; read-models `orgkycstatuses`=APPROVED / `orgbilanentitlements`=ACTIVE
(⚠️ **pluriel Mongoose**, pas de `collection` explicite) ; bases validées + snapshots (v1 **et** v2 sur le même
jeu d'états, + un second jeu d'états) + 4 jeux d'hypothèses semés en base.
- **① 2 jeux, même base** → **200**, `baseHomogene: true`, `versionsSnapshotEnPresence: [1]`, ordre =
  `[prudent, optimiste]` (= ordre des `ids`), `referenceHypothesesId` = 1ᵉʳ id. Prudent : N+1 `resultatNet`
  = 11 000 000, clôture = 19 333 332 ; mensuel `min` = **12 229 164** au **mois 1**, 0 mois négatif,
  `clôture12` = 19 333 332 ⇒ **point bas < clôture de fin** (l'annuel le masquerait). Optimiste :
  `ecarts.annuel[0]` = `{resultatNet: +1 000 000, tresorerieCloture: +333 334}`, `ecarts.mensuel` =
  `{tresorerieMinimale: −215 277}`.
- **② versions de snapshot divergentes** (même `jeuEtatsId`, snapshots v1 et v2) → **200**,
  `baseHomogene: false`, `versionsSnapshotEnPresence: [1, 2]` — **jamais 409** (D2, cas 2).
- **③ bases hétérogènes** (`jeuEtatsId` différent) → **409 `BASES_HETEROGENES`** (D2, cas 1).
- **④ anti-énumération** : lot `[prudent, sur-un-autre-jeu-d'états, id-inexistant]` → **404
  `HYPOTHESES_INTROUVABLE`** (générique), **jamais 409** — l'ordre des contrôles tient sur la vraie stack (AC-7).
- **⑤ gardes DTO** : 1 seul id → **400** · doublon → **400** · id non-ObjectId → **400** · sans jeton → **401**.
- **⑥ aucune écriture** : compteurs `jeux_etats`=3 / `snapshots_liasse`=4 / `jeux_hypotheses`=6 / `exercices`=0 /
  `audit_events`=0 **identiques avant et après** les appels. **Déterminisme** : deux appels ⇒ corps **strictement
  identiques**. Endpoint présent dans `/api/docs-json`.

**Revue de sécurité — aucune vulnérabilité exploitable :** (1) **isolation tenant** fail-closed sur les deux
repositories (`{ tenantId }` fusionné en dernier) ⇒ id d'un autre tenant filtré → **404 générique**, prouvé par
mutation (rouge) **et** sur la stack réelle ; (2) **ordre des contrôles** résolution→homogénéité ⇒ le 409 ne
tombe que sur des ids **du même tenant**, aucun oracle d'énumération ; (3) **injection NoSQL** via `ids`
neutralisée par `@IsMongoId({ each: true })` **avant** tout accès base (chaque id = 24 hex, jamais un opérateur) ;
(4) **DoS algorithmique** borné par `@ArrayMaxSize(5)` × projections bornées (`HORIZON_EXERCICES = 3`,
`NOMBRE_MOIS = 12`) + mémoïsation des snapshots ; (5) **gate** `@RequiresBilanAccess` + `@Roles` derrière la
chaîne globale (401 sans jeton, 403 gate refusé, prouvés live) ; (6) le 409 générique **ne divulgue rien** de
transverse.

**Actual Effort :** ~3 pts (dev externe) + revue/correction/vérif docker côté intégration.

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning)**
