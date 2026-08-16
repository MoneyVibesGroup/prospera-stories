# STORY-236 : Le contrat de balance canonique porte le `dossierId` — re-scopage `balance-service`

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **E** (§4.2), décision **D5**
**Priorité :** Must Have
**Story Points :** 8
**Statut :** Done
**Complexité :** high
**Créée le :** 2026-08-15
**Sprint :** 20
**Service :** `balance-service`

---

## Le constat

Toute la donnée de `balance-service` est aujourd'hui keyée `orgId` — vérifié dans le code le
2026-08-03 : zéro occurrence de `societeId`, `entiteId` ou `implantation`. C'était exact tant qu'une
organisation portait implicitement **un seul** dossier. Ce n'est plus vrai : **STORY-301/353** ont
posé le dossier comme unité de travail (un cabinet porte **N dossiers**, « Mon cabinet » **et** ses
dossiers clients), et **STORY-356** a migré la donnée existante en la rattachant au dossier « Mon
cabinet » — mais a **volontairement gelé les écritures** : `dossierId` est `required: true` au schéma
sur 7 collections alors qu'**aucun chemin d'écriture ne le pose encore**. Depuis le 2026-08-15,
soumettre une balance, ouvrir un exercice, saisir un cahier ou qualifier un écart échoue en
`ValidationError`. Cette story lève ce gel.

**Ce que le re-scopage révèle, au-delà du simple ajout d'un champ** — vérifié dans les schémas le
2026-08-15 : **quatre index uniques supposent silencieusement « un par organisation »**, une hypothèse
qui datait de l'époque à un seul dossier implicite et que rien n'a mise à jour :

| Collection | Index actuel | Ce qu'il empêche à tort dès 2 dossiers |
|---|---|---|
| `balances` | `{orgId, exercice.debut, exercice.fin, source, version}` unique | Deux dossiers du même cabinet avec le **même exercice civil + même source + version 1** (le cas le plus commun) : le second `submit` est traité comme un **doublon idempotent** du premier — **silencieux**, pas d'erreur, la balance du 2ᵉ dossier n'est **jamais écrite** |
| `exercices_atelier` | `{orgId, exercice.debut, exercice.fin}` unique — *« un exercice, une ligne par organisation »* | Un 2ᵉ dossier ne peut **jamais** ouvrir le même exercice civil que « Mon cabinet » ou un autre dossier client — `E11000` sur l'ouverture, mode de panne garanti dès le 2ᵉ dossier actif |
| `comptes_ventilation` | `{orgId}` unique | Une seule configuration de ventilation pour **tout le cabinet** — deux dossiers de référentiels différents (D7) partageraient la même table de passage, ou le 2ᵉ ne pourrait jamais en créer une |
| `qualifications_ecart` | `{orgId, cible, ligneId}` unique | Sans risque immédiat (`ligneId` est déjà unique par nature), mais la clé doit tout de même porter `dossierId` pour rester correcte une fois `orgId` seul insuffisant à isoler un dossier |
| `appariements` (×2, partiels) | `{orgId, lignesReleve}` / `{orgId, 'lignesCahier.ligneId'}` unique sur `statut: CONFIRME` | Idem — `lignesReleve`/`ligneId` sont déjà des clés naturelles, mais l'intention de l'index (« un seul appariement confirmé par cabinet ») doit devenir « par dossier » |

Une bascule qui se contenterait de **poser** `dossierId` sans **migrer ces index** produirait le pire
mode de panne possible : **pas d'erreur visible**, une perte de données silencieuse sur le cas
d'usage le plus commun (deux dossiers, même exercice civil, même source).

**Deuxième point, à préciser plutôt qu'à supposer** : `balance.created` (STORY-099/101) ne porte pas
`dossierId` — vérifié dans `balance-events.ts`. Sa docstring le désigne comme « sortie du hub vers
`bilan-service` », mais **vérification faite le 2026-08-15 : aucun consommateur de ce topic n'existe
dans `bilan-service`** (ni Kafka ni appel synchrone à `GET /balances`) — c'est un **hook inerte**, pas
un couplage actif. Le moteur de `bilan-service` fonctionne aujourd'hui **sur des soldes fournis par
l'appelant** (dry-run), pas par une lecture automatique de `balance-service`. Ajouter `dossierId` à
l'événement reste **peu coûteux et cohérent** (champ additif, aucune rupture), mais ce n'est **pas**
un blocage de coordination avec STORY-357 au sens où l'entend la règle « un changement de contrat
touche 2 dépôts » — il n'y a, à ce jour, rien côté `bilan-service` à intégrer en face.

---

## User Story

En tant que **collaborateur d'un cabinet qui gère plusieurs dossiers clients**,
je veux **que chaque balance, cahier, exercice, rapprochement et calcul fiscal que je saisis
appartienne au dossier sur lequel je travaille**,
afin que **la comptabilité d'un client ne se mélange jamais avec celle d'un autre, ni avec celle du
cabinet lui-même**.

---

## Ce que la story livre

### Mécanisme commun

- **Toutes les routes concernées** (§4.2 du ticket, liste ci-dessous) sont nichées sous
  `/dossiers/:dossierId/...` — même convention que **STORY-357** (`bilan-service`), pour que le
  sélecteur de dossier actif du frontend (bloc I) s'applique identiquement aux deux services.
- **Résolution et garde communes** (`RequiresDossierScope` ou équivalent, factorisé — pas un copié-
  collé par contrôleur) :
  1. `dossierId` (param d'URL) validé comme `ObjectId` — sinon `400`.
  2. Recherché dans le read-model local `dossiers_dossier` (posé en hook inerte par STORY-356),
     filtré par `{ dossierId, orgId: user.tenantId }` — **jamais** par `dossierId` seul.
  3. **Absent, ou appartenant à une autre organisation → 404** (anti-énumération, jamais 403 — règle
     du projet, cohérent avec le traitement déjà appliqué aux ressources d'une autre org).
  4. **Dossier archivé (`statut: ARCHIVE`)** : les **lectures** restent autorisées (D9 — « reste
     consultable ») ; toute **écriture** est refusée par un `409 DOSSIER_ARCHIVE`.
- `orgId` et `auteur` restent dérivés du JWT (inchangé) ; `dossierId` est désormais dérivé du **param
  d'URL validé**, jamais du corps.

### Contrat de balance canonique (`balances`, `balance/rejets`, `imports`, `balance/import` Sage)

- `POST /dossiers/:dossierId/balances` (et ses routes sœurs `GET`, `GET :id`, `POST :id/valider`,
  `POST :id/rejeter`) écrivent et lisent `dossierId`.
- **Index unique de `balances` migré** de `{orgId, exercice.debut, exercice.fin, source, version}` à
  `{dossierId, exercice.debut, exercice.fin, source, version}` — l'idempotence reste entière (deux
  soumissions identiques du **même** dossier restent un NOP), mais deux dossiers ne se percutent plus.
- Les collections d'ingestion/rejet (`balance_ingestions`) et le module Sage héritent du même
  `dossierId`.
- **`profils_import` (STORY-088)** : reste keyé `orgId` par défaut — un profil de mapping colonnes est
  une **configuration réutilisable**, pas une donnée de dossier ; **point ouvert ci-dessous** si le PO
  souhaite le rendre dossier-spécifique.

### Exercices (`exercices`, `balance` — reprise)

- `POST/GET /dossiers/:dossierId/exercices`, reprise à-nouveaux.
- **Index unique de `exercices_atelier` migré** de `{orgId, exercice.debut, exercice.fin}` à
  `{dossierId, exercice.debut, exercice.fin}` — c'est la garde qui, aujourd'hui, empêcherait
  physiquement un 2ᵉ dossier d'ouvrir le même exercice civil.

### Cahiers (`cahiers/depenses`, `cahiers/recettes`, `cahiers/categories`, agrégation,
`balance/comptes-ventilation`)

- Les 4 contrôleurs de cahiers + agrégation nichés sous `/dossiers/:dossierId/...`.
- **`cahiers/categories` passe en scope `dossierId`** — Q1 du ticket tranchée le 09/08 : « propre au
  dossier », pas une configuration de cabinet réutilisable. Index unique
  `{orgId, libelle}` → `{dossierId, libelle}`.
- **Index unique de `comptes_ventilation` migré** de `{orgId}` à `{dossierId}` — une table de passage
  par dossier (cohérent avec D7 : chaque dossier peut avoir un référentiel comptable différent).

### Rapprochement (`rattachement`, appariements, qualifications d'écart)

- `POST/GET /dossiers/:dossierId/rattachement/...`.
- Index uniques d'`appariements` (×2, partiels sur `statut: CONFIRME`) et de `qualifications_ecart`
  préfixés `dossierId` au lieu d'`orgId`.

### Pièces / OCR

- `pieces/ocr` niché sous `/dossiers/:dossierId/pieces/ocr` — `lots_pieces` et
  `lignes_pre_proposees` portent désormais `dossierId`.

### Fiscal (7 contrôleurs sous `fiscal`)

- `fiscal.controller.ts`, `liquidation.controller.ts`, `moteur-fiscal.controller.ts`,
  `provisions.controller.ts`, `taxes.controller.ts`, `tpu.controller.ts`, `tva.controller.ts` — tous
  nichés sous `/dossiers/:dossierId/fiscal/...`. Les schémas `fiscal/schemas/*.schema.ts`
  (retraitement, acompte provisionnel, TPU, déficit reportable, crédit TVA antérieur, crédit d'impôt,
  taxe fiscale) reçoivent `dossierId`, et leurs index `{orgId, exercice...}` deviennent
  `{dossierId, exercice...}`.

### `profil-societe/regime`

- Route conservée en `dossierId` (les 2 axes systemeComptable/regimeFiscal sont désormais portés par
  le **dossier**, cf. STORY-302/303) — sans dupliquer ce que STORY-303 (à venir, même epic) traitera
  pour la datation par exercice.

### Contrat d'événement `balance.created`

- **`BalanceCreatedEventV1` gagne le champ `dossierId`** (`schemaVersion` inchangé — champ additif,
  pas de rupture). **Pas un blocage de coordination avec STORY-357** : le topic n'a aujourd'hui
  **aucun consommateur** côté `bilan-service` (vérifié le 2026-08-15, cf. « Le constat ») — ce n'est
  pas le canal par lequel ces deux stories communiquent. Fait pour rester cohérent avec le reste du
  contrat, pas pour lever un couplage actif.

## Hors périmètre

- **`profil-societe` (module entier de `balance-service`)** : le ticket le liste en §4.2 comme
  « migre vers le nouveau service », mais l'identité fiscale, le pays, le type d'entité et les 2 axes
  sont **déjà** portés par `dossier-service` (STORY-301/302/304). Le module `profil-societe` de
  `balance-service` semble donc **déjà superflu** pour toute donnée neuve — sa dépréciation/retrait
  est un sujet **séparé**, à trancher avec le PO, pas un re-scopage `dossierId`.
- **`tresorerie` (relevés bancaires/mobile money, STORY-089), `suggestion` (STORY-139),
  `referentiel`** : **absents du §4.2 du ticket**. `tresorerie` semble pourtant porter de la donnée de
  dossier au même titre que les cahiers — **point à trancher avec le PO avant dev-story**, pas une
  omission qu'il faut deviner ici.
- **`balance.submitted` (adaptateur #1 du hub multi-vertical, STORY-102)** : entrée **externe** (un
  IMF/distributeur pousse sa balance) qui ne connaît pas la notion `dossierId` de PROSPERA. Comment ce
  flux se rattache à un dossier (« Mon cabinet » par défaut ? refusé tant qu'ambigu ?) est un **point
  ouvert**, non tranché par le ticket.
- **`profils_import` (STORY-088)** : laissé keyé `orgId` (configuration réutilisable) — cf. note
  ci-dessus ; à confirmer avec le PO.
- **D6 (visibilité collaborateur = ses dossiers affectés)** : le read-model local `dossiers_dossier`
  (STORY-356) ne porte **ni responsable ni contributeurs** — seulement `dossierId, orgId, statut,
  estLeCabinet, raisonSociale, pays, typeEntite, version`. Cette story garantit la frontière **stricte
  par organisation** (le cœur de la sécurité) mais **pas** l'affinement « un `TENANT_USER` ne voit que
  les dossiers qui lui sont affectés » — cette dernière exigerait un read-model d'affectation
  supplémentaire, hors périmètre ici. **Dette explicite, transmise à une story de portefeuille**
  (candidate : STORY-359, déjà notée dépendante de ce type d'agrégation).
- **D11 (« Mon cabinet » invisible au collaborateur)** : même limite que ci-dessus — non appliqué au
  niveau `balance-service` par cette story.
- **Frontend** (bloc I du ticket — sélecteur de dossier actif, re-scopage des écrans) : hors service,
  autre dépôt.
- **STORY-303** (datation des 2 axes par exercice, même epic) : cette story pose la lecture actuelle du
  dossier, pas sa version datée.

---

## Acceptance Criteria

- [x] **AC-1** — Toute route des familles listées ci-dessus exige `dossierId` en tête de chemin
      (`/dossiers/:dossierId/...`) ; l'ancienne route sans `dossierId` (`/balances`, `/exercices`,
      `/cahiers/depenses`…) **n'existe plus**.
- [x] **AC-2** — Un `dossierId` qui n'existe pas, ou qui appartient à une **autre** organisation que
      celle du JWT appelant, renvoie **404** — jamais 403, jamais 400. *(Un test par famille de route,
      avec deux organisations réelles.)*
- [x] **AC-3** — Un `dossierId` valide de l'organisation appelante mais dont le statut est `ARCHIVE`
      refuse toute **écriture** (`409 DOSSIER_ARCHIVE`) et autorise toute **lecture** (`200`).
- [x] **AC-4** — Chaque route d'écriture persiste le `dossierId` résolu sur le document créé (balance,
      ingestion, exercice atelier, ligne de dépense/recette, catégorie, ventilation, appariement,
      qualification, lot de pièces, ligne fiscale…) — **plus aucune** `ValidationError` sur ces
      chemins (lève le gel posé par STORY-356/AC-4).
- [x] **AC-5** — Les 4 index uniques identifiés (`balances`, `exercices_atelier`,
      `comptes_ventilation`, `qualifications_ecart`) et les 2 index partiels d'`appariements` sont
      migrés d'un préfixe `orgId` à un préfixe `dossierId`. *(Preuve par balayage : deux dossiers de
      la même organisation, même exercice civil, même source, version 1 → **deux** balances écrites,
      **deux** exercices ouverts simultanément — pas d'`E11000`, pas de NOP silencieux.)*
- [x] **AC-6** — `cahiers/categories` est re-scopé `dossierId` (Q1) ; deux dossiers de la même
      organisation peuvent définir une catégorie de même libellé sans collision.
- [x] **AC-7** — `BalanceCreatedEventV1` porte `dossierId` ; un test le prouve, et la valeur publiée
      correspond exactement au `dossierId` de la balance persistée dans la **même transaction
      outbox**. *(Champ additif de cohérence — aucun consommateur ne le lit à ce jour, cf. « Le
      constat ».)*
- [x] **AC-8** — Le read-model `dossiers_dossier` (jusqu'ici hook inerte, STORY-356) est effectivement
      **lu** par le mécanisme de résolution — un test fait varier son contenu et observe le
      comportement des routes changer en conséquence (pas un simple "ne plante pas").
- [x] **AC-9** — Non-régression : toute route déjà couverte par un e2e existant reste testée, adaptée
      au nouveau chemin `/dossiers/:dossierId/...` — aucun test simplement supprimé pour faire passer
      la story.
- [x] **AC-10** — Vérification docker : parcours **Atelier → Bilan en écriture** (balance soumise,
      validée, `balance.created` publié) rejoué sur un dossier réel, dans une stack neuve —
      **la case laissée décochée par STORY-356 est cochée ici**.

---

## Notes techniques

- **Ordre imposé** : migrer les index uniques **avant** ou **dans le même commit** que le câblage des
  routes — poser `dossierId` sur les écritures sans avoir changé l'index reproduirait exactement le
  mode de panne silencieux décrit dans « Le constat ».
- **Factoriser la résolution `dossierId`**, ne pas la dupliquer par contrôleur (14+ contrôleurs
  touchés) — un garde/pipe commun, testé une fois, appliqué partout. Une divergence entre deux copies
  serait invisible jusqu'à ce qu'un test explicite les compare (leçon STORY-138/149).
- **`dossiers_dossier` n'a pas de jointure ni d'autorité** (docstring du schéma, STORY-356) : il sert
  à **résoudre** `dossierId → orgId`, jamais de source d'autorisation à lui seul — le JWT reste seul
  responsable de l'identité de l'appelant et de son rôle.
- **Chaque service migre son propre index** (invariant #2 — pas de vue cross-base) : cette story ne
  touche que les collections de `balance-service`.
- **Migration de données = différée** (règle du projet) : les documents déjà migrés par STORY-356
  portent déjà `dossierId` (celui de « Mon cabinet »), donc l'index migré ne casse **rien** sur
  l'existant — cette story ne nécessite **aucun** script de backfill supplémentaire.
- **STORY-357 est concomitante mais pas couplée par un contrat d'événement** — cf. correction
  ci-dessus : `balance.created` n'a aucun consommateur côté `bilan-service`. Ce qui **rapproche**
  vraiment les deux stories, c'est le **patron de route** (`/dossiers/:dossierId/...`, à garder
  identique pour le frontend) et le **read-model `dossiers_dossier`** posé par STORY-356 dans les deux
  services — pas une PR à merger en même transaction.
- **Marche arrière de migration (dette de STORY-356)** : la marche arrière de `balance-service`
  détache aujourd'hui `dossierId` de **tout** document qui en porte un. Cette story doit soit la
  **retirer**, soit la **borner** (ex. `origine: MIGRATION` uniquement) — la laisser telle quelle
  détacherait désormais des `dossierId` légitimes posés par les nouvelles routes d'écriture.

---

## Dépendances

**Prérequises :** **STORY-301** (modèle Dossier) · **STORY-356** (migration + read-model
`dossiers_dossier`, hook inerte) · **STORY-353** (affectation — non consommée ici, cf. Hors
périmètre).
**Concomitante :** **STORY-357** (`bilan-service`) — même sprint, même patron de route
`/dossiers/:dossierId/...`, même read-model `dossiers_dossier`. **Pas de couplage par contrat
d'événement** : `balance.created` n'a aucun consommateur côté `bilan-service` (vérifié 2026-08-15).
**Débloque :** **STORY-359** (portefeuille — agrégation par dossier), la levée complète de la dette
« écritures gelées » notée à la clôture de STORY-356.

---

## Definition of Done

- [x] Lint 0 warning · build OK.
- [x] Unit + e2e verts, couverture ≥ seuils du projet (65/90/90/90) — **jamais abaissés**.
- [x] Les 10 AC ci-dessus prouvées par test, pas affirmées.
- [x] **Mutation-test** sur chaque garde annoncée : au minimum, l'anti-énumération (AC-2), l'archivage
      (AC-3) et chacun des 4+2 index migrés (AC-5) — la preuve est la mutation qui **vire au rouge**,
      pas le test vert.
- [x] **Vérification docker réelle** (stack neuve `down -v`) : AC-5 rejouée en base (deux dossiers,
      même exercice, écriture des deux), AC-7 (événement observé avec `dossierId`), AC-10 (parcours
      Atelier → Bilan en écriture).
- [x] Revue de code ⑥ et revue de sécurité ⑦ (session `opus`) — attention particulière à
      l'anti-énumération et à la frontière `orgId` dans le mécanisme de résolution commun.
- [x] Endpoints documentés dans Swagger (nouveau segment `:dossierId`, codes `404`/`409` ajoutés).
- [x] Cohérence du patron de route avec STORY-357 consignée (même convention
      `/dossiers/:dossierId/...`, pas de PR à intégrer en même transaction — cf. Dépendances).

---

## Story Points Breakdown

- Mécanisme commun de résolution/garde `dossierId` (+ tests) : 1,5 pt
- Migration des 4 index uniques + 2 partiels (la partie qui, non faite, casse silencieusement) : 1,5 pt
- Re-scopage balance/ingestion/rejets/imports/Sage : 1,5 pt
- Re-scopage exercices/reprise : 0,5 pt
- Re-scopage cahiers (dépenses/recettes/catégories/agrégation/ventilation) : 1 pt
- Re-scopage rapprochement (rattachement/appariements/qualifications) : 0,5 pt
- Re-scopage pièces/OCR : 0,5 pt
- Re-scopage fiscal/* (7 contrôleurs) : 0,5 pt
- Contrat `balance.created` + `dossierId`, coordination STORY-357 : 0,5 pt
- Vérification docker + mutation-test + revue : 0,5 pt
- **Total : 8 points**

---

## Progress Tracking

### ① Rédaction / cadrage (2026-08-15)

Story réancrée le 2026-08-09 dans `sprint-status.yaml` (EPIC-043, sprint 20) — document rédigé
maintenant, sans dev.

Grounding effectué avant rédaction, directement dans le code de `balance-service` et le ticket
`TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` (bloc E, §4.2) :

- Confirmé les **7 collections déjà gardées** par STORY-356/AC-4 (`dossierId: required: true` au
  schéma, non encore posé par aucune route d'écriture) : `balances`, `balance_ingestions`,
  `exercices_atelier`, `lignes_depenses`, `lignes_recettes`, `appariements`, `qualifications_ecart`.
- Découvert et documenté le risque non cadré par le ticket ni par STORY-356 : **4 index uniques +
  2 partiels supposent « un par organisation »**, hypothèse fausse dès qu'un cabinet a 2 dossiers —
  détail en « Le constat » ci-dessus. C'est, à ce stade, le point technique le plus significatif de
  la story : sans lui, un re-scopage « naïf » (ajouter `dossierId` aux DTO/services sans toucher aux
  index) compilerait, passerait les tests unitaires existants (qui ne testent pas 2 dossiers
  concurrents) et **perdrait silencieusement des données réelles** en production dès le premier
  cabinet à 2 dossiers actifs.
- Vérifié que `BalanceCreatedEventV1` ne porte pas `dossierId`, **et** que sa docstring (« sortie du
  hub vers `bilan-service` ») est **aspirationnelle** : `grep` sur les deux dépôts ne trouve aucun
  consommateur réel du topic. Corrigé une première rédaction qui présentait ce champ comme un
  couplage de PR obligatoire avec STORY-357 — ce n'en est pas un.
- Recensé, contrôleur par contrôleur (`grep @Controller`), les 14 contrôleurs effectivement concernés
  par le §4.2 du ticket, et signalé en « Hors périmètre » les familles que le ticket **ne cite pas**
  (`tresorerie`, `suggestion`, `referentiel`, `profils_import`) plutôt que de deviner leur statut.
- Statut laissé à `Not Started` — le dev n'a pas commencé.

### ② Dev, revue et vérification docker (2026-08-16)

Dev repris en session sur la branche `MNV-236` (le travail était engagé mais
**non commité** : lint rouge à 334 erreurs, 91 unitaires rouges sur 16 suites, et
**les 25 fichiers e2e intacts** alors que toutes les routes avaient changé de
chemin — la suite e2e entière était rouge à 466 échecs).

**Ce que le re-scopage a exigé côté tests.** Les e2e montent chacun leur propre
`TestingModule` : le `DossierScopeGuard` devait y être câblé 25 fois. Plutôt que
25 copies, un harnais partagé (`test/utils/dossier-scope.ts`) monte le **guard
réel** avec un double du read-model qui **applique réellement le filtre reçu** —
un double qui répondrait « oui » quel que soit le filtre laisserait passer un
guard cherchant par `dossierId` seul, soit exactement la faille que l'AC-2
prétend fermer. Deux règles le rendent contraignant : un filtre sans `orgId`
exploitable ne résout rien, et le dossier « d'une autre organisation » n'est
résolvable que pour cette organisation-là. Le bloc de tests AC-2/AC-3/AC-8 est
factorisé (`decrireScopeDossier`) et appelé par **chaque famille de route**, avec
un garde-fou de garde-fou : un test vérifie que la route sondée **existe** —
sinon Nest répondrait 404 au *routage*, sans jamais atteindre le guard, et les
tests d'anti-énumération passeraient au vert sur une garde absente.

**⚡ DEUX TESTS POSÉS LÀ OÙ RIEN NE GARDAIT L'INVARIANT.** ① Les 6 index migrés
n'étaient **gardés par aucun test** : les remettre en préfixe `orgId` laissait
lint, build, 2765 unitaires et 666 e2e **entièrement au vert**. C'est précisément
le « test qu'un code bugué franchit » — la moitié la plus dangereuse de la story
n'avait aucun filet. ② Le guard est **opt-in** (`@RequiresDossierScope()`) : un
23ᵉ contrôleur ajouté demain sous `dossiers/:dossierId/...` sans le décorateur
compilerait, démarrerait, répondrait, et lirait `:dossierId` **sans vérifier
qu'il appartient à l'organisation appelante** — une écriture cross-tenant, par
simple absence (leçon STORY-148). Un test structurel balaie les sources et
**nomme** le fichier fautif.

**⚡ REVUE DE CODE — 3 constats, tous corrigés.**
① `exigerDossierId` existait en **dix copies privées** identiques, une par
service. Aucune ne divergeait — mais rien ne les en empêchait, et une seule
devenue permissive n'aurait fait rougir aucun test (leçon STORY-138/149) ⇒ une
seule implémentation, à côté du type `DossierScope`. ② Projection OCR :
`lot.dossierId!` était déréférencé sans garde. Le schéma le rend `required`, mais
un document mal formé aurait levé un `TypeError` — qui n'est **pas** une
`ValidationError`, donc **rejoué à l'infini** : la partition se fige sur un seul
document. C'est la panne fermée par STORY-356, atteinte par une **autre porte**
⇒ traité comme un lot absent (warn, offset avancé, aucun brouillon inventé).
③ La docstring de `dossiers_dossier` annonçait encore « HOOK INERTE À CE STADE »
alors que le guard le lit à chaque requête — une docstring qui ment sur une
frontière de sécurité est pire qu'absente.

**⚡ REVUE DE SÉCURITÉ — 1 constat, corrigé ; 0 vulnérabilité exploitable.**
`tresorerie` (hors §4.2, resté org-keyed) retombe sur le dossier « Mon cabinet »
via `?? orgId`. Ce repli **DÉSARME la garde d'exercice clos** : `estClos`
interroge alors un dossier inexistant, ne trouve rien, répond `false`, et
l'import passe **dans un exercice peut-être clos**. Ce n'est pas une fuite
cross-tenant (le filtre porte toujours l'`orgId` du JWT, et `{orgId: X,
dossierId: X}` ne matche rien), mais c'est un garde-fou qui cesse de garder en
silence. Repli **conservé** — un retard de read-model ne doit pas rendre la
trésorerie indisponible — mais il **alerte** désormais, et deux tests le
verrouillent (dont « n'alerte pas dans le cas normal »). Par ailleurs : le
`dossierId` est **toujours** dérivé du param d'URL validé comme `ObjectId`,
jamais du corps (aucun vecteur de mass-assignment, aucune injection NoSQL — la
valeur est castée avant toute requête) ; l'absence de tenant (`PLATFORM_ADMIN`)
rend **404**, jamais 403 ; le read-model n'est **jamais** une source
d'autorisation à lui seul, le JWT reste seul maître de l'identité.

**9 MUTATIONS, 9 ROUGES** — M1 filtre du guard sans `orgId` (2 unitaires + 61
e2e rouges) · M2 `estEcriture = false` (le 409 archivé tombe) · M3 validation
`ObjectId` retirée · M4 les 6 index remis en préfixe `orgId` (7 rouges, un par
index) · M5 garde du lot OCR retirée · M6 `@RequiresDossierScope()` retiré d'un
contrôleur (14 e2e rouges) · M7 le même oubli vu par l'invariant structurel, qui
**nomme le fichier** · ~~M8 `exigerDossierId` rendu fail-open (rouge sur de
nombreuses suites)~~ **⚠️ CONSTAT FAUX, corrigé au round ② ci-dessous : la
mutation ne rougit RIEN** · M9 alerte trésorerie supprimée.
⚠️ **M6 a d'abord rougi PAR ERREUR DE COMPILATION** (`TS6133`, import devenu
inutilisé) — ce qui ne prouve **rien** : rejouée en retirant aussi l'import, elle
est alors rouge **par les tests** (leçon STORY-302/179).
⚠️ **Un `git checkout` sur `tva.controller.ts` a détruit ses modifications de
story** (le fichier était modifié mais non commité, donc `HEAD` = état
*pré*-story). Détecté par le build (3 erreurs), reconstruit à l'identique du
patron de son jumeau `taxes.controller.ts`, diff relu ligne à ligne.

**VÉRIFICATION DOCKER (stack neuve `down -v`, JWT RS256 réels, 2 organisations
réelles, 2 dossiers réels).**
- **AC-5, la preuve centrale** : dossier « Mon cabinet » **et** dossier client
  « Client Alpha SARL » du même cabinet, **même exercice civil 2026, même source
  `sage`, même version 1** ⇒ **deux 201**, **deux balances en base**, chacune
  avec son `dossierId`. ⚡ **Contrôle décisif** : recréer l'ancien index unique
  `{orgId, exercice, source, version}` sur cette donnée **échoue en E11000** — il
  est *physiquement impossible*, ce qui prouve qu'avant la migration la seconde
  balance **n'aurait jamais existé**, sans erreur ni trace.
- **Idempotence intra-dossier préservée** : re-soumission identique sur le même
  dossier ⇒ **200 (NOP)**, toujours **2** documents.
- **Les 6 index uniques lus en base** sont tous préfixés `dossierId`, les 2
  partiels d'`appariements` conservant `partialFilterExpression {statut:
  CONFIRME}`.
- **AC-7** : les 2 `balance.created` de l'outbox portent le `dossierId` **exact**
  de la balance persistée, `schemaVersion` inchangée, **outbox intégralement
  drainée** (2 SENT, 0 en attente).
- **AC-2 avec DEUX ORGANISATIONS RÉELLES** : « Cabinet RIVAL » lisant le dossier
  de l'autre cabinet (qui **existe**) et lisant un dossier **inexistant**
  obtiennent des réponses **strictement identiques** — même statut 404, même code
  `DOSSIER_INTROUVABLE`, même message. Aucun oracle d'énumération.
- **AC-3** : dossier client archivé via `dossier-service`, archivage **projeté**
  dans le read-model (statut `ARCHIVE`, version 2) ⇒ `GET /balances` et
  `GET /cahiers/categories` **200**, `POST /balances` et
  `POST /cahiers/categories` **409 `DOSSIER_ARCHIVE`** — et **aucun orphelin**
  écrit après les refus.
- **AC-6** : la catégorie « Carburant motos » créée **sur les deux dossiers**
  (2×201, 2 documents distincts).
- **AC-10** : parcours Atelier en écriture rejoué de bout en bout — balance
  soumise, **validée** (`etat: VALIDÉE`, horodatage serveur), `balance.created`
  publié. **La case laissée décochée par STORY-356 est cochée.**
- **AC-1** : les 7 anciennes routes sans `dossierId` (`/balances`, `/exercices`,
  `/cahiers/depenses`, `/cahiers/categories`, `/fiscal/retraitements`,
  `/rapprochement/etat`, `/pieces/ocr`) répondent **404** — elles n'existent plus.
- **AC-8** : le read-model est bien **lu** — l'archivage, seul changement, a fait
  basculer le comportement des routes ; et les e2e le prouvent en vidant
  `dossiers_dossier` (404) puis en le rétablissant.

**Qualité** : lint 0 warning · build OK · **2765 unitaires + 666 e2e** ·
couverture **98,95 / 91,80 / 98,19 / 99,02** (seuils 65/90/90/90, jamais
abaissés).

⚠️ **Une instabilité e2e observée UNE fois** sur 4 passes complètes
(`tva-taxes` › « suppression par son organisation ⇒ 204 » rendant 404) ; non
reproduite en 3 passes complètes ni en 2 passes isolées de la suite. Signalée
plutôt que tue : non diagnostiquée, elle n'est pas imputée à cette story faute de
preuve.

**Dettes et points ouverts, inchangés par cette story** : `tresorerie`,
`suggestion`, `referentiel` et `profils_import` restent **org-keyed** (absents du
§4.2 — à trancher avec le PO) ; **D6/D11** (visibilité par affectation) ne sont
**pas** couverts, le read-model `dossiers_dossier` ne portant ni responsable ni
contributeurs ; `balance.submitted` (entrée externe du hub) reste un point ouvert.

### ③ Second tour de revue en session `opus` (2026-08-16)

Les revues ⑥/⑦ ont été **rejouées** par les skills scopés (`prospera-code-review`,
`prospera-security-review`), la synthèse restant en session. Elles ont trouvé, au-delà du
round ②, **cinq défauts réels dont trois d'intégrité** — et surtout **deux affirmations du
round ② qui ne se vérifient pas**. Le motif commun mérite d'être nommé : *une correction
annoncée n'est pas une correction vérifiée, et une mutation consignée n'est pas une mutation
rejouée*.

**⚡⚡ DEUX AFFIRMATIONS DU ROUND ② PRISES EN DÉFAUT.**
① La factorisation d'`exigerDossierId` (« dix copies privées ⇒ une seule implémentation »)
n'était appliquée **qu'à moitié** : une **onzième** copie subsistait dans
`contexte-fiscal.service.ts`, et c'est **elle** — pas la canonique — que les **6 services
`fiscal/*`** importaient. Le défaut que la correction prétendait fermer était toujours là,
au même endroit.
② **La mutation M8 ne se reproduit pas.** Rendre `exigerDossierId` fail-open (`return ''`)
laisse lint, build, **2765 unitaires et 666 e2e entièrement au vert**. Deux causes cumulées :
toutes les suites passent un dossier, et le fichier est un `*.decorator.ts`, donc **exclu de
`collectCoverageFrom`** — la couverture ne pouvait pas signaler le trou. C'est l'angle mort
documenté du projet (`*bootstrap*`, STORY-076/108) atteint par **une autre porte**. Spec
dédiée ajoutée ; la mutation rougit désormais **par assertion**.

**⚡⚡ LE SEGMENT `:dossierId` N'ÉTAIT DÉCLARÉ DANS AUCUN DOCUMENT OPENAPI.**
`@nestjs/swagger` ne dérive **jamais** un paramètre de chemin du gabarit d'URL (vérifié dans
`dist/explorers/api-parameters.explorer.js`) : il ne lit que les `@ApiParam` explicites et la
réflexion des `@Param()`. Or les 22 contrôleurs nichés n'ont **ni l'un ni l'autre** — le
dossier arrive par `@DossierScope()`, un `createParamDecorator` maison sans métadonnée
Swagger. `/api/docs-json` publiait donc `/dossiers/{dossierId}/…` **sans déclarer
`dossierId`** : document OpenAPI invalide, et un client généré dont les URL partent avec le
littéral `%7BdossierId%7D` — **400 sur toute la surface re-scopée**, c'est-à-dire sur
l'unique raison d'être de la story. Rien ne le voyait : les e2e construisent leurs URL à la
main (même famille de défaut qu'en STORY-294). Posé une seule fois sur
`@RequiresDossierScope()` — appliqué à une classe, `@ApiParam` descend sur chaque méthode —
avec les réponses 404/409 que la DoD réclamait aussi.

**⚡⚡ L'AC-5 ÉTAIT LUI-MÊME FAUTIF SUR UN DES SIX INDEX — la même ligne bancaire pouvait
être confirmée dans deux dossiers.** Trouvé **deux fois indépendamment** (revue de code et
revue de sécurité). L'AC mandatait de préfixer `dossierId` les 2 index partiels
d'`appariements`, au motif que « `lignesReleve`/`ligneId` sont déjà des clés naturelles ».
Vrai du côté **cahier** (dossier-scopé depuis cette story), **faux du côté relevé** :
`tresorerie` reste org-keyed (hors §4.2), donc un même relevé est visible depuis **tous** les
dossiers du cabinet. Descendre l'unicité au dossier supprimait la seule garde empêchant qu'un
mouvement bancaire unique justifie **deux comptabilités** : une dépense fictive dans le
dossier B, appariée à une ligne déjà confirmée dans A, ressortait au **niveau de preuve le
plus fort** et **quittait les « écarts inexpliqués »** — le seul écran qui l'aurait signalée.
Le commentaire du schéma promettait mot pour mot l'invariant que l'index ne tenait plus. Règle
retenue : **un index d'unicité ne protège une ligne que s'il porte sur la sphère où cette
ligne EXISTE** ⇒ côté relevé `{orgId, lignesReleve}`, côté cahier `{dossierId, ligneId}`,
`lignesConfirmees` scopant chaque côté de même. Le filet « aucun unique org-keyé » garde sa
force : l'exception est **nommée**, pas exclue en bloc.

**⚡ `balance.submitted` sans dossier « Mon cabinet » perdait la balance en silence.** La
branche consignait un rejet dont le `dossierId` porte l'`orgId` — donc **inatteignable** par
`GET /dossiers/:dossierId/balance/rejets` — et **sautait** `balanceEvents.rejected`, alors
que le docstring de cette méthode pose l'invariant « jamais de rejet consigné sans
notification ». Le `ProcessedEvent` étant commité, le rejeu était fermé : l'IMF croyait avoir
transmis, pour seule trace un `warn`. Notification émise dans la **même transaction**, sous un
code **distinct** (`DOSSIER_CABINET_INDISPONIBLE`) : confondre un retard de projection
(transitoire, à renvoyer) avec un refus de droits (définitif) ferait abandonner une balance
valide.

**⚡ `POST /dossiers/:dossierId/profil-societe/regime` écrit à l'échelle de l'ORGANISATION.**
`ProfilSociete` est keyé `{orgId}` unique : le régime confirmé depuis un dossier client
s'applique à **tous** les dossiers du cabinet — alors que la proposition est calculée sur le
CA du **seul dossier courant**. Confirmer depuis un petit dossier bascule le référentiel et le
paquet fiscal d'un gros. Le re-scopage du profil est **hors périmètre** (STORY-303 ; le module
est par ailleurs candidat au retrait, l'identité fiscale étant déjà portée par
`dossier-service`) — mais l'audit ne portait **pas** le dossier d'origine, donc rien ne
permettait de reconstituer la décision. `dossierId` ajouté au journal et au log, portée
org-wide énoncée dans Swagger : l'URL cesse de mentir en silence.

Également corrigé : `HEAD` était classé comme **écriture** par le guard, donc un `HEAD` sur un
dossier archivé rendait 409 au lieu de 200 — une lecture que D9 autorise.

**5 MUTATIONS DE CE TOUR, 5 ROUGES PAR ASSERTION** (aucune par erreur de compilation) :
`exigerDossierId` fail-open · `@ApiParam` retiré du décorateur (2 rouges) · côté relevé remis
en `dossierId` (2 rouges, index + pré-contrôle) · émission de `rejected` retirée ·
`dossierId` retiré de l'audit du régime.

**Qualité après correctifs** : lint 0 warning · build OK · **2781 unitaires + 666 e2e** · couverture
**99 / 91,81 / 98,19 / 99,08**.

**✅ BLOQUANT LEVÉ — LA COURSE QUI RENDAIT 25 À 40 % DES PASSES E2E ROUGES.** L'instabilité
signalée au round ② comme « observée une fois, non reproduite » était en réalité systématique :
mesurée **2 échecs sur 4 passes sur le commit de feature seul** (`0aca3c0`) — elle **préexistait**
donc au re-scopage. Un seul test rouge à chaque fois, **jamais le même ni dans la même suite**
(`tva-taxes`, `rapprochement`, `cahiers-depenses`, `liquidation`, `tresorerie-releves`,
`cahiers-recettes`, `tpu`), et **jamais** en isolation.

**Ce qui a permis de la trouver, c'est la FORME du corps de la réponse, pas son statut.** Une sonde
posée sur `supertest` a capturé les corps réels : le 404 anormal n'était ni celui du routage de Nest
(`{"statusCode":404,…,"message":"Cannot GET …"}`, **JSON**) ni celui du `DossierScopeGuard` (JSON
**codifié**), mais la page **HTML** par défaut d'Express — `<!DOCTYPE html>… Cannot GET …`. Or nos
applications répondent **toujours** en JSON. La réponse ne venait donc **pas de l'application
visée**.

**La cause.** Aucune suite ne mettait son serveur en écoute : `server = app.getHttpServer()` seul
laisse `supertest` ouvrir un port éphémère **par requête** puis le refermer — sa méthode
`serverAddress()` fait `if (!app.address()) this._server = app.listen(0)`, et son `end()` referme
ce serveur juste après. **Mesuré : 1032 requêtes ⇒ 1032 ports distincts**, sur 8 workers en
parallèle. Entre la réservation du port `P` et la connexion du client, l'OS peut avoir réattribué
`P` au listener d'un **autre worker** : la requête part vers l'application d'une **autre suite**,
qui ne connaît pas la route.

Tout s'explique alors, y compris ce qui résistait : jamais reproductible seule (il faut un
concurrent pour rafler le port) ; `--maxWorkers` réduit qui **raréfie** la fenêtre sans la fermer
(50 % échouait encore 1 fois sur 4) ; et une sonde écrivant sur disque à chaque réponse qui faisait
**disparaître** le symptôme — l'I/O synchrone déplaçait la course. C'est aussi pourquoi plafonner
les workers avait été **refusé** comme correctif : un flake rendu plus rare est plus dangereux
qu'un flake visible.

**Correctif** : `test/utils/serveur.ts#ecouter()` met le serveur en écoute **une fois** par suite ;
`app.address()` n'étant plus nul, supertest réutilise le listener et ne le referme jamais. Port
stable pour toute la suite, libéré par `app.close()`. Les **25 suites** l'utilisent. Un **invariant
structurel** (`src/common/serveur-e2e.invariant.spec.ts` — placé sous `src/` parce que c'est le seul
`rootDir` où les unitaires tournent) **nomme** le fichier qui l'oublierait : le coût d'un oubli est
payé par **toute** la suite e2e, et se manifeste **ailleurs** que là où il a été introduit.
Mutation : une suite remise en `getHttpServer()` direct ⇒ invariant **rouge**, nommant le fichier.

**Résultat : 15 passes complètes consécutives vertes** (8 en validation d'hypothèse, 7 après
correctif) contre ~40 % d'échec auparavant. La suite est par ailleurs plus rapide.

**✅ VÉRIFICATION DOCKER REJOUÉE SUR L'ÉTAT FINAL** (stack neuve `down -v`, JWT RS256 réels,
**deux cabinets réels** créés via l'IdP, **deux dossiers réels** du même cabinet). Elle était due :
le correctif de l'index d'`appariements` change un artefact que le round ② avait vérifié en base.

- **AC-5, la preuve centrale, refaite** : « Cabinet Alpha » (Mon cabinet) **et** « Client Alpha
  SARL », **même exercice civil 2026, même source `sage`, même version 1** ⇒ **deux 201**, **deux
  balances en base**, chacune avec son `dossierId`. ⚡ **Contrôle décisif rejoué** : recréer
  l'ancien index unique `{orgId, exercice, source, version}` sur cette donnée **échoue en
  E11000** — il est *physiquement impossible*, donc avant migration la seconde balance n'aurait
  **jamais existé**, sans erreur ni trace.
- **Idempotence intra-dossier préservée** : re-soumission identique ⇒ **200 (NOP)**, toujours **2**
  documents.
- **Les 6 index d'unicité lus en base**, avec **l'asymétrie voulue** : `balances`,
  `exercices_atelier`, `comptes_ventilation`, `categories_depenses`, `qualifications_ecart`
  préfixés `dossierId` ; `appariements` côté **cahier** `{dossierId, lignesCahier.ligneId}` et
  côté **relevé** `{orgId, lignesReleve}`, les deux conservant
  `partialFilterExpression {statut: CONFIRME}`.
- **AC-7** : les 2 `balance.created` de l'outbox portent le `dossierId` **exact** de leur balance
  (celui du cabinet pour l'une, celui du client pour l'autre), `schemaVersion` inchangée, **outbox
  intégralement drainée** (2 SENT, 0 en attente).
- **AC-2, avec DEUX ORGANISATIONS RÉELLES** : « Cabinet Rival » lisant le dossier d'Alpha (qui
  **existe**) et lisant un dossier **inexistant** obtiennent des réponses **strictement
  identiques** — même 404, même code `DOSSIER_INTROUVABLE`, même message, comparaison programmatique
  des deux corps. Aucun oracle d'énumération.
- **AC-3** : dossier client archivé via `dossier-service` (la source de vérité), archivage
  **projeté** dans le read-model ⇒ `GET` **200**, `POST` **409 `DOSSIER_ARCHIVE`**, et **aucun
  orphelin** écrit après le refus (2 balances avant, 2 après). ⚡ **`HEAD` ⇒ 200** : le correctif
  du round ③ vérifié contre un vrai serveur — il rendait 409 sur une lecture que D9 autorise.
- **AC-10** : parcours Atelier en écriture rejoué de bout en bout sur un **dossier client** —
  balance soumise, **validée** (`etat: VALIDÉE`), `balance.created` publié.
- **AC-1** : les 7 anciennes routes sans `dossierId` répondent **404**.
- ⚡⚡ **LE CORRECTIF SWAGGER VÉRIFIÉ SUR LE DOCUMENT RÉELLEMENT PUBLIÉ**, et c'est là qu'un dernier
  défaut est apparu : sur les **85 opérations nichées** de `/api/docs-json`, 84 portaient le schéma
  typé du décorateur et **une** un `schema` **vide** — `POST /dossiers/{dossierId}/balances`, seule
  route ayant gardé un `@ApiParam` local antérieur. `unionWith` de `@nestjs/swagger` retenant la
  **première** occurrence, c'est la déclaration locale qui gagnait : le client généré aurait eu,
  pour cette route et elle seule, un argument **non typé**. Déclaration locale retirée ⇒ **85/85
  uniformes**, re-vérifié après `docker restart` (🪤 le hot-reload sait mentir — leçon STORY-302).

**Constats laissés de côté, tracés** : deux index repointés `dossierId` ne servent plus la
requête qui les justifiait (`{dossierId, profilImportId}` face à `{orgId, profilImportId}` de
`compterBalancesReferentes` ; `{dossierId, lotId}` face à `{orgId, lotId}` de la projection
OCR) ⇒ COLLSCAN, dont un **dans une transaction sur le chemin chaud d'un consumer** ; le repli
`?? orgId` alerte dans `releves.service` mais reste **muet** dans `comptes-tresorerie` (même
racine, même conséquence, traitement incohérent) ; **7 des 22 contrôleurs** n'ont pas le bloc
e2e AC-2/AC-3/AC-8 que l'AC-2 demande « par famille de route » (dont `RattachementController`,
sans aucun e2e). **D6/D11** reste la dette majeure : la revue de sécurité la classe *Broken
Access Control horizontal* (CWE-639, conf. 88) — `dossier-service` restreint un `TENANT_USER`
à ses dossiers affectés et masque « Mon cabinet », `balance-service` ne réplique que `orgId` et
ouvre donc **en lecture ET en écriture** toute la matière comptable et fiscale de tous les
dossiers du cabinet. Dette **documentée** par la story et déférée à STORY-359 — mais une dette
documentée n'est pas une dette neutralisée : entre le merge et STORY-359, l'écart est
exploitable. **À arbitrer explicitement par le PO.**

### ④ Clôture (2026-08-16)

**PR `prospera-balance-service#38` rebase-mergée sur `dev`**, branche `MNV-236` supprimée : commit de
feature `0aca3c0`, quatre commits de revue (`762cf88` implémentation unique d'`exigerDossierId` +
sa spec · `9f3c9b9` segment `:dossierId` documenté et `HEAD` requalifié · `6dbc16c` unicité, boucle
de retour et portée rendues conformes · `7f4e39d` déclaration unique et typée du segment) et un
commit de tests (`da94322` un seul listener par suite e2e).

Statut synchronisé aux trois endroits (en-tête, `sprint-status.yaml` avec
`completed_date: "2026-08-16"`, ce *Progress Tracking*).

**Ce que ce second tour aura appris, au-delà de la story** : *une correction annoncée n'est pas une
correction vérifiée, et une mutation consignée n'est pas une mutation rejouée.* Deux affirmations du
premier tour — la factorisation d'`exigerDossierId` et la mutation M8 — se sont révélées fausses en
les rejouant, et c'est en les rejouant, pas en les relisant, qu'on l'a su. Le corollaire vaut pour
la suite : **rejouer les mutations d'une story reprise coûte peu et rend beaucoup.**

**⛔ Reste ouvert, à arbitrer par le PO** : **D6/D11**, que la revue de sécurité classe *Broken
Access Control horizontal* (CWE-639, confiance 88). `dossier-service` restreint un `TENANT_USER` à
ses dossiers affectés et lui masque « Mon cabinet » ; `balance-service` ne réplique que `orgId` et
ouvre donc **en lecture et en écriture** toute la matière comptable et fiscale de **tous** les
dossiers du cabinet. La story documente la dette et la défère à STORY-359 — mais entre ce merge et
STORY-359, l'écart est réel.
