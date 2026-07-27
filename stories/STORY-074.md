# STORY-074 : Comparaison inter-exercices (évolution des postes sur ≥ 2 exercices validés) — FR-024

**Epic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (relying party, :3004, base `bilan_service`)
**Réf. PRD :** [`docs/prd-bilan-service-2026-07-10.md`](../prd-bilan-service-2026-07-10.md) §FR-024 (« Restitution de l'**évolution des postes** sur plusieurs exercices **validés**, au-delà du simple N/N-1 » — AC : « Sélection de ≥ 2 exercices validés ; **tableau d'évolution par poste** ») ; **priorité Could Have** ; dépend **FR-016, FR-022**
**Réf. contrat front :** [`docs/frontend-stories/FE-037.md`](../frontend-stories/FE-037.md) — la story cliente attend `/bilan/comparaison` en plus de `/bilan/consultation`, et note explicitement que **FR-024 est la partie la moins prioritaire du lot**.
**Réf. code livré (réutilisé, jamais réécrit) :** **STORY-065** (`SnapshotLiasse` append-only versionné, `SnapshotLiasseRepository.dernier/trouverVersion`, `liasse` figée + `referentiel` + `checksum` + `moteurVersion`) · **STORY-066/067** (`Exercice`, index unique `(tenantId, libelle)`, chaînage N/N-1) · **STORY-072** (index par exercice = union `exercices` ∪ `jeux_etats` — la **fondation de sélection** de cette story) · **STORY-071** (forme de réponse « référence + méta d'homogénéité », patron d'**ordre des contrôles** et de **préfixe de route distinct**) · **STORY-059/060/111/112** (types de postes : `PosteActif`, `PostePassif`, `PosteSousTotal`, `PosteResultat`, `PosteSig`) · **STORY-037** (gate `@RequiresBilanAccess`)
**Dépend de :** STORY-065 ✅ · STORY-066 ✅ · STORY-067 ✅ · STORY-072 ✅ · STORY-037 ✅ — **toutes livrées, aucun blocage**
**Ne dépend PAS de :** STORY-071 (comparaison de **scénarios** — axe différent, cf. §*Trois comparaisons à ne pas confondre*) · STORY-073 (export — 074 n'est **pas** exportable dans ce périmètre) · STORY-120/121/122 (référentiels additionnels : la comparaison est **agnostique**, elle les servira sans modification) · balance-service
**Débloque / alimente :** front **FE-037** (dernier verrou back du lot FR-022/024) — **clôt EPIC-014**
**Priorité :** Could Have
**Story Points :** 3
**Complexité :** high
**Statut :** review
**Assigné à :** vivianMoneyVibesGroupes
**Créée :** 2026-07-25
**Sprint :** 16

> **Pourquoi `Complexité : high` pour 3 points ?** La charge de code est faible (lecture + diff, aucune
> écriture, aucun calcul comptable nouveau). Le risque, lui, est maximal : la sortie est un **tableau
> financier pluriannuel remis à un comptable**. Un poste absent valorisé à `0`, une colonne N-1 réutilisée
> comme valeur d'un autre exercice, ou deux référentiels différents alignés sur le même code de poste
> produisent une **évolution fausse sous un libellé crédible** — exactement la classe de bug relevée en
> revue de STORY-073 (total de passif faux sous libellé mensonger, « à compléter » = zéro). Le palier est
> un plancher, pas un plafond : cette story se développe en `opus`.

---

## User Story

**En tant que** dirigeant/comptable d'une organisation,
**je veux** confronter les postes de mes liasses **validées** sur plusieurs exercices (2023, 2024, 2025…) dans un **tableau d'évolution unique**,
**afin de** lire une tendance pluriannuelle — et non deux colonnes N/N-1 isolées — **sans jamais qu'un poste manquant ou un référentiel différent ne me soit présenté comme un chiffre comparable**.

---

## Description

### Contexte — ce qui existe déjà, et le trou qu'il laisse

Le lot EPIC-012/014 a livré tout le socle nécessaire :

- **STORY-065** fige chaque validation en un `SnapshotLiasse` **immuable et versionné**, qui porte la liasse
  produite **et** son référentiel effectif (`{code, version}` + `checksum` + `moteurVersion`). C'est la
  seule source légitime d'un chiffre « validé ».
- **STORY-072** publie l'**index par exercice** (union `exercices` ∪ `jeux_etats`, tri décroissant, avec
  `nombreVersions`) : le sélecteur dont cette story a besoin.
- Chaque liasse porte déjà une colonne **N-1** (`netN1`, `montantN1`, `valeurN1`) — mais **au sein d'un seul
  exercice**, et cette colonne est une **image comparative recalculée** à partir des soldes N-1 fournis, pas
  la liasse validée de l'exercice précédent.

Le trou : **rien ne confronte deux liasses validées entre elles**. Un utilisateur qui veut lire l'évolution
de son poste « Clients » sur 3 ans doit ouvrir 3 exercices et recopier à la main.

### Le vrai risque de cette story : produire un chiffre *comparable en apparence seulement*

Une comparaison inter-exercices n'a de sens que si les valeurs confrontées **dénotent la même chose**.
Trois façons de le trahir, toutes silencieuses :

1. **Référentiels différents.** Le poste `AZ` en SYSCOHADA et le poste `AZ` en SFD-BCEAO ne désignent pas le
   même agrégat. Les aligner sur la seule égalité du code produit une ligne d'évolution **absurde** que rien
   dans la réponse ne signale. → **bloquant** (D2).
2. **Poste absent d'un exercice valorisé à zéro.** Un poste introduit en @2.0 n'existe pas dans la liasse
   @1.0 : afficher `0` fait lire une **disparition de valeur** là où il n'y a qu'une **absence de poste**.
   → `null`, jamais `0` (D3).
3. **Réutilisation de la colonne N-1.** Il est tentant de remplir l'exercice 2024 avec le `netN1` du
   snapshot 2025. C'est faux : le N-1 de 2025 est une **projection comparative** sur les soldes fournis à
   l'époque, alors que 2024 possède sa **propre** liasse validée, possiblement re-validée depuis (v2). Les
   deux peuvent diverger — et c'est la liasse validée de 2024 qui fait foi. → interdit (D4).

C'est sur ces trois points que la story doit être **prouvée par mutation**, pas seulement testée.

### Trois comparaisons à ne pas confondre

| Story | Compare | Axe | Source |
|---|---|---|---|
| **STORY-071** (✅ livrée) | 2 à 5 **jeux d'hypothèses** | **scénarios** sur **une même** base validée | projections dérivées (069/070) |
| **STORY-072** (✅ livrée) | rien — elle **restitue** | un exercice à la fois (N/N-1 interne) | liasse déléguée (064/065) |
| **STORY-074** (celle-ci) | 2 à 5 **exercices validés** | **le temps** | `SnapshotLiasse` figés (065) |

Aucune dépendance de code entre 071 et 074. On en reprend en revanche le **patron** : préfixe de route
distinct, méta d'homogénéité nuancée, ordre des contrôles imposé.

### Contrat de sortie (forme)

`GET /api/v1/bilan/comparaison/exercices?exercices=2023,2024,2025`

```jsonc
{
  "referentielHomogene": true,          // false ⇒ même code, versions différentes (non bloquant)
  "referentielsEnPresence": [           // toujours publié, même homogène
    { "code": "syscohada-revise", "version": "2.1", "checksum": "cb8a…" }
  ],
  "exercices": [                        // ORDRE CHRONOLOGIQUE CROISSANT — l'axe de lecture
    { "exercice": "2023", "jeuEtatsId": "…", "snapshotId": "…", "version": 1,
      "valideAt": "2024-03-11T…", "referentiel": { "code": "…", "version": "…" }, "checksum": "…",
      "moteurVersion": "1.0.0" },
    { "exercice": "2024", … },
    { "exercice": "2025", … }
  ],
  "etats": {
    "bilanActif":      [ /* LigneEvolution */ ],
    "bilanPassif":     [ /* … */ ],
    "bilanSousTotaux": [ /* … */ ],
    "compteResultat":  [ /* … (porte `sens`) */ ],
    "sig":             [ /* … */ ]
  }
}
```

Une **`LigneEvolution`** :

```jsonc
{
  "etat": "BILAN_ACTIF",
  "poste": "AZ",
  "libelle": "Total actif immobilisé",
  "sens": null,                          // 'PRODUIT' | 'CHARGE' pour le CR, null ailleurs
  "valeurs":    [1200000, null, 1450000],           // aligné 1:1 sur `exercices` ; null = poste ABSENT
  "variations": [null, null, null]                  // variations[i] = valeurs[i] − valeurs[i−1]
}
```

Une **variation** non nulle : `{ "absolue": 250000, "pourcentage": 20.83 }` — `pourcentage` à `null` si le
dénominateur est `0` (jamais `Infinity`, jamais `NaN`).

---

## Scope

### Inclus

- Endpoint **`GET /bilan/comparaison/exercices`** (préfixe **`bilan/comparaison`** dédié, aucune route
  paramétrée sur ce préfixe), gate `@RequiresBilanAccess` + `@Roles(TENANT_ADMIN, TENANT_USER)`.
- Sélection de **2 à 5 exercices** par **libellé** (`?exercices=2023,2024`), sans doublon.
- Résolution **tenant-scoped** exercice → `JeuEtats` → **dernier `SnapshotLiasse`** (version la plus élevée).
- Contrôle d'**homogénéité de référentiel** : code différent ⇒ **409** ; version différente ⇒ **200 nuancé**.
- Construction du **tableau d'évolution par poste** sur les 5 familles portées par la liasse figée :
  Bilan actif (`netN`), Bilan passif (`montantN`), sous-totaux du Bilan (`valeurN`), Compte de résultat
  (produits + charges, `montantN`, avec `sens`), SIG (`valeurN`).
- **Variations pas-à-pas** (absolue + pourcentage), `null` dès qu'une des deux bornes est absente.
- Anti-énumération : 404 **générique et indistinct** (inexistant / non validé / autre org).
- Swagger complet (DTO typés), tests unitaires + e2e, mutation-test, vérif docker.

### Exclus (hooks inertes, documentés — ne pas déborder)

| Hors périmètre | Renvoi |
|---|---|
| **Export** PDF/Excel de la comparaison | STORY-073 est livrée et **agnostique** ; brancher la comparaison à l'export est une story dédiée (le modèle d'export n'est **pas** modifié ici) |
| **Épinglage d'une version précise** par exercice (`2024@v1`) | par défaut = **dernière** version validée ; la sélection fine relève d'une évolution (`?versions=` corrélé) — hook inerte, non implémenté |
| Comparaison des colonnes **brut / amortissement** de l'actif | seule la colonne **`netN`** (présentation DSF) est comparée ; le détail 3 colonnes est une extension |
| Comparaison **TFT** et **notes annexes** | structures à lignes typées/tables (statut par ligne, ventilation) dont la sémantique d'évolution n'est pas triviale — hors AC de FR-024 (« tableau d'évolution par poste ») |
| Comparaison **inter-organisations** ou **inter-référentiels** | interdit par construction (cloisonnement tenant ; D2 bloque l'hétérogénéité) |
| **Audit** de la consultation comparée | aligné sur la décision de STORY-072 : une **lecture** n'est pas un acte à journaliser |
| Écriture, transaction, événement Kafka, appel moteur | **aucun** — endpoint strictement dérivé de snapshots figés |

---

## Critères d'acceptation

- **AC-1** — `GET /bilan/comparaison/exercices?exercices=2023,2024,2025` renvoie **200** avec les exercices en
  **ordre chronologique croissant** (tri sur le libellé), **quel que soit l'ordre de saisie** ; `valeurs` est
  aligné **index par index** sur `exercices`.
- **AC-2** — Chaque valeur provient **exclusivement de la colonne N du propre snapshot validé** de son
  exercice. La colonne **N-1** d'un snapshot n'est **jamais** utilisée comme valeur d'un autre exercice (D4).
- **AC-3** — La source est le **dernier `SnapshotLiasse`** (version la plus élevée) de chaque exercice ; le
  **brouillon n'est jamais** comparé. `snapshotId` + `version` + `valideAt` sont publiés par exercice.
- **AC-4** — Un exercice **inexistant**, **sans jeu d'états**, ou **jamais validé** (aucun snapshot) →
  **404 `EXERCICE_NON_COMPARABLE`**, message **générique et identique** dans les trois cas (aucun oracle).
- **AC-5** — Exercice d'une **autre organisation** → **404**, corps **strictement identique** à AC-4 (jamais
  403, jamais de fuite d'existence).
- **AC-6** — **Codes de référentiel différents** entre les exercices sélectionnés → **409
  `REFERENTIELS_HETEROGENES`** ; aucun tableau n'est produit (D2).
- **AC-7** — **Même code, versions différentes** → **200** avec `referentielHomogene: false` et
  `referentielsEnPresence` listant les versions en présence ; la comparaison **n'est jamais bloquée** (D2).
- **AC-8** — Un poste **absent** de la liasse d'un exercice vaut **`null`**, **jamais `0`** ; l'union des
  postes couvre **tous** les exercices (aucun poste silencieusement écarté) (D3).
- **AC-9** — `variations[i] = valeurs[i] − valeurs[i−1]` ; `variations[0]` est **toujours `null`** ; toute
  variation dont l'une des deux bornes est `null` vaut **`null`** (pas de `0`, pas de valeur brute) (D3).
- **AC-10** — `pourcentage` = `null` si la borne précédente vaut `0` — **jamais `Infinity`, jamais `NaN`**,
  ni dans le JSON ni après sérialisation (D3).
- **AC-11** — **Ordre des postes déterministe** : ordre du référentiel de l'exercice **le plus récent**,
  puis postes présents uniquement dans des exercices antérieurs, ajoutés ensuite dans leur ordre d'origine.
  Deux appels identiques ⇒ corps **strictement identiques**.
- **AC-12** — Gardes de saisie → **400** : moins de 2 exercices, plus de 5, libellés dupliqués, libellé hors
  charset autorisé (`^[A-Za-z0-9 _/-]{1,32}$`), opérateur NoSQL injecté en query.
- **AC-13** — **Ordre des contrôles imposé** : validation DTO (400) → résolution tenant-scoped (404) →
  homogénéité de référentiel (409) → construction du tableau. Un 409 ne doit **jamais** précéder un 404
  (sinon il devient un oracle d'existence inter-org).
- **AC-14** — Endpoint **strictement en lecture** : compteurs de **toutes** les collections identiques avant
  et après (prouvé en docker) ; aucun appel au moteur, aucune transaction, aucun événement.
- **AC-15** — Gate et rôles appliqués : sans jeton → **401** ; gate refusé → **403**
  (`EMAIL_NOT_VERIFIED` / `KYC_NOT_APPROVED` / `BILAN_NOT_ENTITLED`) ; endpoint documenté dans `/api/docs`.

---

## Notes techniques

### Préfixe de route — pas de collision possible

`bilan/comparaison` est un préfixe **neuf**, et le seul handler qui y vit est `@Get('exercices')`
(littéral). Aucune route paramétrée n'y est déclarée ⇒ le piège d'ordre de déclaration (AGENTS.md) est
**structurellement absent**, comme pour `bilan/previsionnel` en 071. Ne **pas** greffer l'endpoint sous
`bilan/consultation`, qui porte déjà `@Get(':exercice')`.

### Résolution & anti-énumération (détail)

```
DTO (400) → pour chaque libellé : JeuEtatsRepository.findOne({ exercice }) tenant-scoped
          → SnapshotLiasseRepository.dernier(jeu._id)      // tenant-scoped
          → si l'un des deux manque, pour n'importe quel libellé : 404 UNIQUE et générique
          → homogénéité des `referentiel.code` (409)
          → construction du tableau (pur, en mémoire)
```

**La résolution ne lit PAS la collection `exercices`** : elle part de `jeux_etats`. Conformément à la
décision **D2 de STORY-072**, un jeu d'états peut exister sans document `Exercice` déclaré (l'index unique
de 066 porte sur `jeux_etats(tenantId, exercice)`, rien n'impose un `Exercice` en regard) — et de la donnée
**validée** ne doit jamais être masquée. Toutes les métadonnées publiées (`valideAt`, `referentiel`,
`checksum`, `moteurVersion`) viennent du **snapshot**, qui les fige : lire `exercices` n'apporterait rien
et pourrait faire disparaître un exercice validé du tableau.

Le 404 est levé **une seule fois**, sans nommer le libellé fautif ni distinguer la cause : c'est ce qui rend
« exercice d'une autre org » indistinguable de « exercice inexistant » **et** de « exercice non validé ».

### Extraction des postes (référentiel-agnostique — invariant P7)

Les cinq familles sont lues **génériquement** dans `snapshot.liasse`, par leur **clé de structure**, jamais
par une liste de codes de postes en dur :

| Famille | Chemin dans la liasse figée | Colonne comparée |
|---|---|---|
| `bilanActif` | `liasse.bilan.actif[]` | `netN` |
| `bilanPassif` | `liasse.bilan.passif[]` | `montantN` |
| `bilanSousTotaux` | `liasse.bilan.sousTotaux[]` | `valeurN` |
| `compteResultat` | `liasse.compteResultat.produits[]` + `.charges[]` | `montantN` (+ `sens`) |
| `sig` | `liasse.compteResultat.sig[]` | `valeurN` |

Un référentiel sans sous-totaux ni SIG (SFD-BCEAO @1.0) produit simplement des familles **vides** — aucune
branche spécifique, aucun code de poste cité dans le moteur de comparaison.

### Unités et arrondis

Les montants restent en **unités mineures XOF entières** (jamais reformatés ici — c'est le rôle du rendu).
Seul le `pourcentage` est un décimal, arrondi à **2 décimales** (`Math.round(x * 100) / 100`), calculé sur
`(v[i] − v[i−1]) / |v[i−1]| × 100` — la valeur absolue au dénominateur évite qu'une base négative inverse le
signe de l'évolution.

### Ce qui **ne** change **pas**

Aucun fichier de `etats/`, `jeu-etats/`, `consultation/`, `projection/`, `export/` n'est modifié : la story
**ajoute** un dossier `comparaison-exercices/` et le câble dans `BilanModule`. La non-régression des
endpoints existants est un critère de sortie.

---

## Dépendances

### Stories prérequises — **toutes livrées**

| Story | Ce qu'elle fournit | Statut |
|---|---|---|
| **STORY-065** | `SnapshotLiasse` (liasse figée + référentiel + checksum + moteurVersion), `SnapshotLiasseRepository.dernier` | ✅ done |
| **STORY-066/067** | `Exercice` (libellé unique par tenant), statut `OUVERT/CLOS` | ✅ done |
| **STORY-072** | index par exercice (fondation de sélection) + patron d'anti-énumération | ✅ done |
| **STORY-037** | gate `@RequiresBilanAccess` | ✅ done |
| **STORY-059/060/111/112** | types de postes de la liasse (actif/passif/sous-totaux/CR/SIG) | ✅ done |

### Stories dont 074 **ne dépend pas**

**STORY-071** (comparaison de scénarios) — axe différent, aucun code partagé ; on en reprend le **patron**
de réponse et d'ordre des contrôles, pas le code. **STORY-073** (export) — la comparaison n'est pas
exportable dans ce périmètre. **STORY-120/121/122** (référentiels) — l'endpoint est agnostique.

### Dépendances externes

Aucune. Pas de Kafka, pas de Redis, pas de MinIO, pas d'appel inter-services.

---

## Definition of Done

- [x] Lint **0 warning** (`./node_modules/.bin/eslint "{src,test}/**/*.ts" --max-warnings 0`) · `npm run build` OK.
- [x] Couverture ≥ **65 / 90 / 90 / 90** (`npm run test:cov`) — **ne jamais baisser les seuils**. ⚠️ **Le
      dossier neuf `comparaison-exercices/` doit être vérifié FICHIER PAR FICHIER** (`--collectCoverageFrom`
      ciblé) : un fichier neuf à 0 % reste invisible derrière une couverture globale à 98 % — 3ᵉ récidive
      constatée en revue de STORY-073.
- [x] Unit + **e2e** verts (l'e2e est obligatoire : il est le seul à prouver l'ordre des contrôles et les
      codes HTTP), **non-régression** de `/bilan/consultation/*`, `/bilan/etats/*`, `/bilan/previsionnel/*`.
- [x] **Mutation-test** — **≥ 8 mutations vérifiées rouges**, code restauré à l'identique ensuite
      (`git diff` de contrôle vide) :
      | Mutation appliquée au code réel | Garde qui doit rougir |
      |---|---|
      | poste absent renvoyé **`0`** au lieu de `null` | AC-8 |
      | variation calculée malgré une borne `null` | AC-9 |
      | `pourcentage` calculé sans garde de dénominateur nul (⇒ `Infinity`) | AC-10 |
      | valeur d'un exercice lue dans le **`netN1`** du snapshot suivant | AC-2 |
      | source = liasse **brouillon** (`JeuEtatsService.consulter`) au lieu du snapshot | AC-3 |
      | contrôle d'homogénéité (409) **déplacé avant** la résolution 404 | AC-13 (oracle d'énumération) |
      | codes de référentiel différents **acceptés** (contrôle retiré) | AC-6 |
      | tri chronologique supprimé (ordre de saisie conservé) | AC-1 |
      | résolution du snapshot **non** tenant-scoped (modèle brut) | AC-5 |
      | gate `@RequiresBilanAccess` retiré | AC-15 |
- [x] **Vérif docker réelle** consignée dans *Progress Tracking* — stack neuve, org réelle via
      `register`/`login` sur l'IdP (**JWT RS256 réel**), read-models du gate alimentés (⚠️
      `orgkycstatuses` / `orgbilanentitlements` — **pluriel Mongoose par défaut**, commencer par
      `db.getCollectionNames()`), `docker restart` du service avant de conclure (piège hot-reload).
      Scénarios à produire **réellement** :
      1. **3 exercices validés** (2023/2024/2025) construits par la **vraie API** → tableau d'évolution
         complet, ordre chronologique, variations cohérentes recalculées à la main depuis `mongosh` ;
      2. **poste absent** d'un exercice (valeurs de balance divergentes) → `null` en base **et** dans la
         réponse, variation adjacente `null` — **jamais `0`** ;
      3. **dénominateur nul** (poste à `0` en N-1 puis non nul) → `pourcentage: null`, aucun `NaN`/`Infinity`
         dans le corps brut (`grep` sur la réponse) ;
      4. **versions de référentiel divergentes** (SFD @1.0 vs @2.0) → **200**, `referentielHomogene:false`,
         versions listées ; **codes divergents** (syscohada vs sfd) → **409 `REFERENTIELS_HETEROGENES`** ;
      5. **anti-énumération** : exercice inexistant, exercice **non validé** (brouillon seul), exercice d'une
         **autre org** → **404 au corps strictement identique** (diff binaire des 3 réponses) ;
      6. **exercice re-validé (v2)** → la comparaison prend **v2**, pas v1 (prouvé par le `snapshotId`) ;
      7. **zéro écriture** : compteurs de toutes les collections identiques avant/après ; **déterminisme** :
         deux appels ⇒ corps identiques ; endpoint présent dans `/api/docs-json`.
- [x] Statut synchronisé **aux 3 endroits** (en-tête de ce doc · `docs/sprint-status.yaml` · *Progress
      Tracking*) + `completed_date: "YYYY-MM-DD"` à la clôture.
- [x] Flux git : branche **`MNV-074`** rebasée sur `origin/dev` **avant** de coder, commits
      `MNV-074(bilan): …`, PR titrée `MNV-074(bilan): …`, intégration **« Rebase and merge »** +
      `--delete-branch` ; le doc story suit le **même flux** sur base `main` dans le repo `docs/`.
- [x] `/code-review` puis `/security-review` passés avant intégration.

---

## Story Points Breakdown

- `ComparaisonExercicesService` — résolution tenant-scoped + snapshot le plus récent + contrôle
  d'homogénéité : **0,75 pt**
- Construction du tableau (union de postes ordonnée, valeurs `null`-safe, variations + pourcentage) : **1 pt**
- Contrôleur + DTO query (charset, 2..5, doublons) + DTO réponse + Swagger : **0,5 pt**
- Tests unit + e2e + **mutation-test (10 mutations)** : **0,5 pt**
- Vérif docker (production de 3 exercices validés + cas divergents) : **0,25 pt**
- **Total : 3 points**

**Rationale :** aucun calcul comptable nouveau, aucune écriture, aucune transaction. La charge est
intégralement dans les **invariants de comparabilité** (D2/D3/D4) et leur preuve par mutation — pas dans le
volume de code.

---

## Additional Notes

- **Décision D1 — la source est le snapshot figé, jamais le brouillon.** FR-024 dit « exercices **validés** ».
  Comparer un brouillon (recalculé à chaque appel, mutable) à une liasse figée produirait une évolution non
  reproductible. Par défaut = **dernière** version validée ; l'épinglage d'une version précise est un hook.
- **Décision D2 — homogénéité de référentiel : bloquante sur le *code*, nuancée sur la *version*.**
  *Codes* différents (syscohada vs sfd) ⇒ **409** : les codes de postes ne dénotent pas la même chose, aucun
  tableau honnête n'est possible. *Versions* différentes d'un même code (SFD @1.0 → @2.0, additif par
  construction — STORY-120) ⇒ **200 + `referentielHomogene:false`** : la comparaison reste licite, les postes
  nouveaux apparaissent simplement en `null` sur les exercices antérieurs. Forme reprise de la décision D2 de
  STORY-071 (bloquer le franchement incomparable, signaler le nuancé sans jamais bloquer).
- **Décision D3 — `null` est une valeur de premier ordre.** Absence de poste, variation à borne manquante,
  pourcentage à dénominateur nul : `null` partout, jamais `0`, jamais `Infinity`, jamais `NaN`. C'est la
  leçon directe des constats n°2 et n°3 de la revue de STORY-073.
- **Décision D4 — chaque exercice tire sa valeur de sa propre colonne N.** La colonne N-1 d'un snapshot est
  une image comparative produite à l'époque sur les soldes alors fournis ; la liasse validée de l'exercice
  précédent (éventuellement re-validée en v2 depuis) est la seule qui fasse foi. Interdiction absolue de
  substituer l'une à l'autre — mutation dédiée.
- **Décision D5 — variation *pas-à-pas*, et non écart vs une référence.** STORY-071 annonçait que 074
  pourrait reprendre sa forme « référence + écarts ». **Déviation assumée** : 071 compare des scénarios
  *concurrents* (une référence, des alternatives), là où 074 lit une **série temporelle** — un comptable y
  lit l'évolution d'une année sur l'autre, pas l'écart de 2023 à 2025. On garde en revanche la méta
  d'homogénéité et l'ordre des contrôles de 071.
- **Point ouvert (non bloquant) :** faut-il exporter la comparaison en PDF/Excel ? **074 : non** (hors
  périmètre, cf. Scope). Le modèle d'export de 073 est en 2 étages (modèle pur → rendus) et accueillerait la
  comparaison sans modification structurelle — à ouvrir en story dédiée si FE-037 le demande.
- **Blocker MV inchangé (hérité de 073/F2)** : la mise en page des restitutions n'a pas été validée par un
  expert-comptable face à la trame officielle DSF/CERFA. Ne concerne pas l'API JSON de cette story.

---

## Progress Tracking

**Status History :**
- 2026-07-23 : Reportée du Sprint 15 au Sprint 16 (arbitrage de capacité — seule *Could Have* du lot).
- 2026-07-25 : Créée (Scrum Master, escalade `opus` — conception des invariants de comparabilité) — statut `defined`, `Complexité : high`.
- 2026-07-25 : Développée (`opus`, `Complexité : high`), portes DoD franchies, **12/12 mutations rouges**, **vérif docker bout-en-bout** — statut `review`.

**Réalisé :** dossier neuf `src/modules/bilan/comparaison-exercices/` — `evolution.ts` (moteur **PUR**, sans injection : extraction des 5 familles par clé de structure, union ordonnée des postes, valeurs `null`-safe, variations pas-à-pas) · `comparaison-exercices.service.ts` (résolution tenant-scoped exercice → jeu → **dernier snapshot figé**, contrôle d'homogénéité, anti-énumération) · `comparaison-exercices.controller.ts` (préfixe dédié `bilan/comparaison`, `@Get('exercices')`, gate + rôles) · DTO query (charset, 2..5, doublons) et DTO réponse Swagger · câblage `BilanModule`. **Aucune écriture, aucune transaction, aucun événement Kafka, aucun appel moteur, aucune collection propre.**

**Écart de résolution assumé (vs le pseudo-code des *Notes techniques*)** : la résolution passe par
`jeux_etats` **seul**, sans lire `exercices`. Conforme à la décision **D2 de STORY-072** — un jeu d'états
peut exister sans document `Exercice` déclaré, et de la donnée **validée** ne doit jamais être masquée.
Lire `exercices` en plus n'aurait rien ajouté (les métadonnées publiées viennent toutes du snapshot) et
aurait pu **cacher** un exercice validé sans déclaration.

**Qualité (DoD) :** lint **0 warning** · `npm run build` OK · dossier neuf `comparaison-exercices/`
**100 / 100 / 100 / 100**, vérifié **fichier par fichier** (l'angle mort qui a masqué 3 fois un fichier neuf
à 0 % derrière une couverture globale verte) · global **98,44 / 92,16 / 98,51 / 98,41** (≥ 65/90/90/90) ·
**745 unit** (1 skip) + **187 e2e** (19 suites) verts · non-régression complète.

**⚠️ Build de `dev` réparé (commit séparé, hors périmètre fonctionnel).** `npm run build` échouait sur
`dev` avec **31 erreurs TS2307** avant toute ligne de cette story : 11 barrels `index.ts` auto-générés
réexportent des modules **inexistants** (`./comparaison`, `./projection-mensuelle`, `./export`…), avec des
lignes dupliquées jusqu'à 5 fois. Le hotfix `be720dd` les avait déjà supprimés ; le commit `b8e37d7`
« update module dev frontend » les a réintroduits. Aucun consommateur (tous les imports du service sont
explicites) ⇒ suppression, dans un **commit distinct** du contenu de la story pour rester révocable seul.

**Mutation-test — 12/12 ROUGES**, code restauré à l'identique (`diff -r` vs instantané : vide) :

| # | Mutation appliquée au code réel | Garde | Résultat |
|---|---|---|---|
| M1 | poste absent renvoyé **`0`** au lieu de `null` | AC-8 | **rouge** ✓ |
| M2 | variation calculée malgré une borne `null` | AC-9 | **rouge** ✓ |
| M3 | `pourcentage` sans garde de dénominateur nul (⇒ `Infinity`) | AC-10 | **rouge** ✓ |
| M4 | valeur lue dans **`netN1`** au lieu de `netN` | AC-2 | **rouge** ✓ |
| M5 | ordre des postes pris du plus **ancien** (libellé périmé) | AC-11 | **rouge** ✓ |
| M6 | tri chronologique supprimé | AC-1 | **rouge** ✓ |
| M7 | contrôle d'homogénéité de référentiel retiré | AC-6 | **rouge** ✓ |
| M8 | source = version 1 au lieu du **dernier** snapshot | AC-3 | **rouge** ✓ |
| M9 | homogénéité contrôlée **avant** la résolution (oracle) | AC-13 | **rouge** ✓ |
| M10 | gate `@RequiresBilanAccess` retiré | AC-15 | **rouge** ✓ |
| M11 | garde de doublons neutralisée | AC-12 | **rouge** ✓ |
| M12 | charset des libellés ouvert à `.*` | AC-12 | **rouge** ✓ |

**Vérification docker réelle** (stack `prospera-*` : mongo rs0 + kafka + redis + mailhog + IdP:3001 +
bilan:3004 ; ⚠️ `docker restart` des services applicatifs **requis** — leurs conteneurs avaient démarré
avant mongo et avaient mis en cache un `ENOTFOUND mongo`). Deux orgs **fraîches** via `register`/`login`
sur l'IdP (**JWT RS256 réel**), gate semé dans `orgkycstatuses`/`orgbilanentitlements` (⚠️ **pluriel
Mongoose**, et la clé est **`organizationId`**, pas `orgId` — les collections `org_kyc_status` /
`org_bilan_entitlements` sont **mortes**). Dataset construit par la **vraie API** : 2023/2024/2025 validés
(2024 introduit le compte `218`, absent de 2023), 2022 laissé **en brouillon**, org B portant un 2030 validé.

- **① Tableau d'évolution** → **200**, ordre chronologique `['2023','2024','2025']` **quel que soit
  l'ordre de saisie** (`?exercices=2025,2023,2024`), `referentielHomogene: true`, un seul référentiel en
  présence. Valeurs et variations recalculées à la main et concordantes :
  `AE  [1 000 000, 1 500 000, 1 800 000]` → `[null, (+500 000, +50 %), (+300 000, +20 %)]` ·
  `CA  [1 000 000, 2 200 000, 2 700 000]` → `[null, (+1 200 000, +120 %), (+500 000, +22,73 %)]`.
- **② Poste absent ⇒ `null`, jamais `0`** : `AH [null, 700 000, 900 000]`, variations
  `[null, null, (+200 000, +28,57 %)]` — la variation **adjacente au `null` est bien `null`**, et non
  `+700 000` (qui aurait fait lire une création de valeur ex nihilo).
- **③ Dénominateur nul** : les sous-totaux (`AZ`, `BG`, `BK`, `BT`, `BZ`) valent `0` sur ce jeu d'essai et
  produisent `{absolue: 0, pourcentage: null}` — **jamais `Infinity`/`NaN`**. Contrôle renforcé : aucun
  littéral `NaN`/`Infinity` dans le JSON brut **et** aucun nombre non fini après parsing (le seul contrôle
  qui prouve quelque chose : `JSON.stringify` transforme `NaN` en `null` et masque la fuite).
- **④ Anti-énumération** — les **trois** cas renvoient un corps **strictement identique** (`requestId`
  exclu) : inexistant (2099), **non validé** (2022, brouillon seul), **exercice d'une autre org** (2030) →
  **404 `EXERCICE_NON_COMPARABLE`**, jamais 403, aucun oracle.
- **⑤ Homogénéité** : codes différents (`sfd-bceao` vs `syscohada-revise`) → **409
  `REFERENTIELS_HETEROGENES`** ; **ordre des contrôles prouvé** — hétérogène **+** exercice inexistant →
  **404**, jamais 409 (sinon le conflit révélerait l'existence de l'autre exercice). Versions divergentes
  (`2.0` vs `2.1`) → **200**, `referentielHomogene: false`, les deux versions listées : **jamais bloqué**.
- **⑥ Re-validation** : `rouvrir` + `valider` sur 2025 ⇒ snapshots `v1, v2` en base ; la comparaison
  retient **v2** (la plus récente), prouvé par le `version` publié.
- **⑦ Gardes** : 1 seul exercice / 6 exercices / doublons / `{"$ne":null}` en libellé / libellé de 40
  caractères / opérateur NoSQL `exercices[$ne]` / paramètre inconnu (whitelist) → **400** ; sans jeton →
  **401**.
- **⑧ Déterminisme** : `?exercices=2024,2025` et `?exercices=2025,2024` ⇒ corps **strictement identiques**.
- **⑨ ZÉRO ÉCRITURE (mesuré isolément)** : **16 appels** de comparaison (8 × 200 + 8 × 404) encadrés par un
  relevé des **12 collections** de `bilan_service` ⇒ **écarts : AUCUN**. (Le relevé global du scénario
  complet montrait `+1 snapshots_liasse` et `+2 audit_events`, imputables à la re-validation volontaire du
  point ⑥ — d'où cette mesure dédiée.)
- **⑩ Swagger** : `/api/v1/bilan/comparaison/exercices` présent dans `/api/docs-json`, **distinct** de
  `/api/v1/bilan/previsionnel/comparaison` (STORY-071) — aucune collision de route.

**Observation (hors périmètre, non bloquante)** — sur le jeu d'essai, les sous-totaux du Bilan (`AZ`…`BZ`)
ressortent à `0` alors que les postes de détail sont valorisés : c'est le **finding F1 déjà tracé**
(cascade `AMORCE` ne couvrant pas les postes fins du référentiel), **pas** un défaut de cette story — la
comparaison restitue fidèlement ce que le snapshot contient. Effet secondaire utile : ce sont ces `0` qui
ont fourni le cas réel de **dénominateur nul** du point ③.

---

**Story créée avec la méthode BMAD v6 — Phase 4 (Implementation Planning)**
