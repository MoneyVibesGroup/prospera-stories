# STORY-497 : Socle `microfinance-service` — le portefeuille naît dans un dossier, sur le référentiel du dossier

Status: done

**Complexité :** high

**Épic :** EPIC-121 — Socle vertical SFD
**Service :** `microfinance-service` (nouveau)
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-533** (N référentiels par organisation) · **STORY-422** (le plan suit le dossier)
**Origine :** découpage `epics-microfinance-2026-08-27.md`, spine AD-6/AD-7/AD-8.

---

## Le fait

Le service n'existe pas. Ce qui existe, et qu'il ne faut pas refaire : `sfd-bceao@2.0` est packagé,
sourcé et **complet** — 372 comptes du RCSFD, `BAT`/`BPT` en `FORMULE` avec leurs `role`
`TOTAL_ACTIF`/`TOTAL_PASSIF`, cascade `RSA → RSG` des soldes intermédiaires DIMF 2080. *(Vérifié dans
l'artefact le 2026-08-27.)*

⚡ **Le socle n'a jamais été compté dans un PRD de ce programme** — quatre fois d'affilée (`reseau`,
`catalogue-produits`, `stock`, `pdv`). Il l'est ici dès le découpage, et c'est pour cela que la
story vaut 13 et non 5.

## Critères d'acceptation

- [x] AC-1 — Scaffold sur le moule commun : NestJS, config, Swagger, health, docker-compose,
      Mongo replica set, outbox Kafka. Aucun écart au moule.
- [x] AC-2 — Gate `@RequiresMicrofinanceAccess` : e-mail → KYC → entitlement, **dans cet ordre**,
      comme les modules existants. L'habilitation exige `sfd-bceao` dans la liste de l'organisation
      (STORY-533 AC-3).
- [x] AC-3 — **Tout agrégat appartient à un dossier** (AD-6). Un accès hors portée répond
      **`404`, jamais `403`** : un `403` révèle l'existence de la ressource.
- [x] AC-4 — Read-model `exercices_dossier` (AD-P14). Aucune écriture sur un exercice clos.
      ⚠️ La garde interroge `exercices_dossier`, **pas** `exercices_atelier` — c'est exactement le
      piège de STORY-374, et `estClos` rendant `false` sur un exercice introuvable, s'y tromper
      laisse la garde **ouverte en permanence**.
- [x] AC-5 — ⛔ **Le référentiel résolu est celui du DOSSIER** (AD-8). Un test de mutation le prouve :
      un compte `57…` d'une IMF est son **capital social** en SFD et la **Caisse** en SYSCOHADA — le
      valider contre SYSCOHADA ne rate jamais et donne des états faux.
- [x] AC-6 — ⚠️ **Aucune constante `XOF` dans ce service** (AD-11) : la devise vient du contrat
      canonique (STORY-489). Vérifié par un test de présence, pas par relecture.

## Mesuré le 2026-09-13 — story REPORTÉE, et trois arbitrages tranchés

▶️ **REPRISE le 2026-09-13** (le report de la matinée est levé, décision user) : le dépôt
**`MoneyVibesGroup/prospera-microfinance-service` est créé**, `main` et `dev` poussées, le socle est
en cours sur `MNV-497`. **Port 3011** (3005 et 3008 restent libres), base Mongo `microfinance_service`,
audience JWT `microfinance-service`.

⛔ **TROU MESURÉ LE 2026-09-13 — AD-9 n'a aucun compte où se poser.** La spine exige que le service
tienne les **engagements hors bilan** (crédits accordés non décaissés, garanties reçues), qui comptent
pour le prudentiel. Or le plan de comptes de `sfd-bceao@2.0` s'arrête à la **classe 7** : son README
écrit que la **classe 8 est « hors amorce »**, parce qu'elle n'entre ni au bilan ni au compte de
résultat. Deux voies, à trancher **avant** la story des engagements : étendre `sfd-bceao` — donc le
republier, recalculer les checksums et invalider les snapshots, précisément le coût qu'AD-3 veut
éviter — ou loger la classe 8 dans un artefact séparé. **Hors périmètre du socle.**

Les prérequis, eux, sont **vérifiés dans le code** : STORY-533 (`entitlement.schema.ts` porte
`referentiels?: {code,version}[]`, publié sur `entitlement.changed`), STORY-422
(`resoudreReferentielDuDossier`) et STORY-489 (devise au contrat canonique) sont bien livrées.

**Décisions user du 2026-09-13, à appliquer à la reprise :**

- **D-497-A — le dépôt reste à créer** : `MoneyVibesGroup/prospera-microfinance-service` (convention
  observée : un dépôt par service). ⚠️ La racine du workspace **n'est pas un dépôt git** :
  `docker-compose.yml`, l'override et `.github/workflows/ci.yml` ne sont versionnés nulle part —
  leurs ajouts sont locaux, et ce point doit être tranché séparément.
- **D-497-B — un NOUVEAU module `microfinance` au catalogue** ouvre le service (pas de réutilisation
  de `credit` ni de `conformite-bceao`). ⛔ À corriger dans le même geste : le pack `imf-sfd`
  (`packs.seed-data.ts:66`) cite **`sfd-bceao@1.3`**, version qui **n'existe pas** (le registre ne
  connaît que `1.0` et `2.0`) — or l'habilitation compare `code@version`, donc un client abonné au
  pack n'obtiendrait **jamais** l'accès. PR supplémentaire dans `platform-catalog-service`.
- **D-497-C — la devise sera publiée dans les événements `dossier.*`** (ajout optionnel au contrat,
  producteur + consommateurs, **2 PR intégrées ensemble**), au lieu de déclarer AC-6 non livré. Le
  test « aucune constante `XOF` » porte sur le **code du service**, pas sur le registre ISO des
  devises qu'il recopie (`devise.ts` porte des clés littérales `XOF` par nature).

**Corrections de la fiche, mesurées :**

- Le moule à copier pour le gate est **`balance-service`** (`balance-access.guard.ts:44-46`,
  e-mail → KYC → entitlement), **pas** `dossier-service` : `@RequiresDossierAccess` n'a
  volontairement **pas** d'entitlement.
- ⚠️ **AC-4, piège mesuré** : `estClos` de `balance-service` retombe sur `exercices_atelier` quand le
  read-model est vide (`exercices.repository.ts:106-140`). Le nouveau service **n'a pas d'Atelier** :
  sa garde doit **refuser** un exercice introuvable, jamais recopier ce repli — sinon elle reste
  ouverte en permanence, exactement le défaut de STORY-374.
- `sfd-bceao@2.0` vérifié : 372 comptes / 31 postes / 31 mappings, checksum conforme au registre,
  asset **identique à l'octet** entre `bilan-service` et `balance-service`. Le nouveau service en
  ferait une **3ᵉ copie** à garder identique à l'octet (précédent STORY-428). La clé de l'artefact
  est `meta`, **pas** `_meta` (contrairement au paquet fiscal).
- AC-5 confirmé : dans l'artefact SFD, `57` = **Capital social** ; dans `syscohada-revise@2.1`,
  `57` = **Caisse**.
- ⚠️ **13 points sous-estimés** : scaffold + CI/compose, gate + 2 consommateurs, read-models
  dossier/axes/exercices + garde 404, référentiel du dossier + 3ᵉ copie de l'artefact, devise et sa
  PR `dossier-service`. **Scission conseillée** : socle + gate + portée d'un côté, référentiel du
  dossier + devise de l'autre.

## Progress Tracking

**Statut : `done` (2026-09-13).** Deux PR intégrées **ensemble** en rebase-merge, catalogue d'abord (le module doit exister avant que le service ne l'exige) : : `microfinance-service` **#1**
(socle) et `platform-catalog-service` **#18** (module `microfinance` + version fantôme). Séparées, l'une
refuse tous les abonnés et l'autre ouvre une porte sur rien.

### Portes — rejouées en session

| Dépôt | lint | build | unitaires | e2e | couverture |
|---|---|---|---|---|---|
| `microfinance-service` | 0 warning | OK | **701** / 50 suites | **29** / 2 | 99,65 / 92,83 / 99,42 / 99,62 |
| `platform-catalog-service` | 0 warning | OK | **725** / 55 suites | **196** | 99,86 / 96,69 / 100 / 99,92 |

23 mutations au total (14 au dev, 9 en revue), **toutes rouges par assertion**.

### ⛔ Ce que la revue a trouvé — la chaîne de guards n'était gardée par rien

Retirer `MicrofinanceAccessGuard` **ou** `DossierScopeGuard` d'`AppModule` laissait **718 tests verts** :
le test censé les mesurer **recopiait** la liste des providers au lieu de démarrer l'application — son
propre commentaire affirmait pourtant mesurer `AppModule`. Un refacto perdant un provider aurait livré le
vertical **sans gate d'habilitation** ou **avec les dossiers d'autrui lisibles et modifiables**, sans un
seul rouge. Deux verrous depuis : un invariant qui interroge le **vrai** `AppModule` par réflexion
(présence *et* ordre, comparaison par objet classe) et une suite e2e dont le montage est **dérivé**
d'`AppModule`.

### Vérification docker (2026-09-13, stack Portly `PROSPERA/stack`, 11 conteneurs `healthy`)

| Point | Verdict |
|---|---|
| Boot réel : `/api/v1/health` 200, `mongodb: up`, `kafka: up`, **0 erreur** de résolution d'injection, 18 modules, 4 consumers | **PROUVÉ** |
| Artefact `sfd-bceao@2.0` **dans l'image** (57 100 o), sha256 `91ca19e2…` **identique à l'octet** aux copies `bilan-service` et `balance-service`, checksum vérifié au chargement | **PROUVÉ** |
| Les **6 collections** en `snake_case` (contraste mesuré : `dossier_service` porte, lui, un `orgkycstatuses` au pluriel Mongoose) ; index uniques et TTL réels | **PROUVÉ** |
| Les **4 consumers** alimentés par des flux amont **réels** (inscriptions, dossiers, archivage, exercices ouvert/clos, entitlement via le catalogue) ; `LAG 0` sur les 4 groupes | **PROUVÉ** |
| **Idempotence** : rejeu du **même `eventId` avec une charge CONTRAIRE** (`REJECTED` sur un `APPROVED`) ⇒ `processed_events` inchangé, read-model inchangé | **PROUVÉ** |
| Gate, **ordre mesuré et non déduit** : ① `EMAIL_NOT_VERIFIED` → ② `KYC_NOT_APPROVED` → ③ `MICROFINANCE_NOT_ENTITLED` → ④ `REFERENTIEL_NON_HABILITE` (habilité `@1.0` au lieu de `@2.0`) → ✔ 200. Chaque palier **écrase** les suivants | **PROUVÉ** |
| Le blocage catalogue **reproduit** : `PUT` sans référentiel → **400 `REFERENTIEL_REQUIRED`**, avec `@2.0` non déposé → **422**. Levé par la voie **admin réelle**, jamais en base | **PROUVÉ** |
| Portée : dossier d'autrui et dossier inexistant rendent le **même corps à l'octet** (404 `DOSSIER_INTROUVABLE`), jamais 403 ; la garde de portée s'exécute **avant** le gate | **PROUVÉ** |
| Exercice : introuvable ⇒ **409 `EXERCICE_INTROUVABLE`** (jamais « ouvert »), clos ⇒ 409 — aucun repli vers un `exercices_atelier`, qui n'existe pas dans cette base | **PROUVÉ** |
| AC-5 sur les vrais octets : `571000` → **« Capital »** en SFD (et non « Caisse ») ; dossier ENTREPRISE ⇒ 409 `REFERENTIEL_DOSSIER_INDETERMINE` | **PROUVÉ** |
| AC-6 dans les deux sens : sur 8 dossiers issus d'événements réels, `devise` est **absente du document et du JSON** — aucun repli ; contre-épreuve, un `devise:"xof"` publié est projeté `"XOF"` et servi | **PROUVÉ** |

⚡ **Un dernier résidu de recopie trouvé là**, invisible aux tests : la docstring de `kyc-events.ts`
annonçait le consumer group **`balance-kyc`** quand le groupe réel est `microfinance-kyc`. Croire la
docstring et aligner le code aurait fait **partager un consumer group entre deux services**, qui se
voleraient leurs messages. Corrigé.

### NON PROUVÉ / NON ATTEINT — dit plutôt que supposé

- **Démarrage dégradé** (Kafka absent au boot ⇒ HTTP up) : exige un redémarrage, impossible pendant qu'un
  autre travail tournait sur la même stack.
- Branche « `tenantId` absent (PLATFORM_ADMIN) » du gate : `RolesGuard` répond **avant**.
- `dossier.exercice.rouvert` : abonné, **jamais exercé** (offset `-`).
- Le pack `imf-sfd` n'était pas semé dans cette stack : **D-497-B non mesuré ici**, mais son effet exact
  est reproduit par le palier ④.
- `kyc.status.changed` : `kyc-service` absent de ce run ⇒ message publié sur le bus réel **au format exact
  du producteur**. Seul point où l'amont est simulé — dit, pas contourné en base.
- Atomicité : **aucune écriture multi-document** dans le socle. `outbox_events` reste vide : aucun
  producteur, hook documenté.

## Notes

- Voir la spine `architecture/architecture-microfinance-service-2026-08-27/ARCHITECTURE-SPINE.md`.
