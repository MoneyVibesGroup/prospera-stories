# STORY-236 : Le contrat de balance canonique porte le `dossierId` — re-scopage `balance-service`

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **E** (§4.2), décision **D5**
**Priorité :** Must Have
**Story Points :** 8
**Statut :** Not Started
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

- [ ] **AC-1** — Toute route des familles listées ci-dessus exige `dossierId` en tête de chemin
      (`/dossiers/:dossierId/...`) ; l'ancienne route sans `dossierId` (`/balances`, `/exercices`,
      `/cahiers/depenses`…) **n'existe plus**.
- [ ] **AC-2** — Un `dossierId` qui n'existe pas, ou qui appartient à une **autre** organisation que
      celle du JWT appelant, renvoie **404** — jamais 403, jamais 400. *(Un test par famille de route,
      avec deux organisations réelles.)*
- [ ] **AC-3** — Un `dossierId` valide de l'organisation appelante mais dont le statut est `ARCHIVE`
      refuse toute **écriture** (`409 DOSSIER_ARCHIVE`) et autorise toute **lecture** (`200`).
- [ ] **AC-4** — Chaque route d'écriture persiste le `dossierId` résolu sur le document créé (balance,
      ingestion, exercice atelier, ligne de dépense/recette, catégorie, ventilation, appariement,
      qualification, lot de pièces, ligne fiscale…) — **plus aucune** `ValidationError` sur ces
      chemins (lève le gel posé par STORY-356/AC-4).
- [ ] **AC-5** — Les 4 index uniques identifiés (`balances`, `exercices_atelier`,
      `comptes_ventilation`, `qualifications_ecart`) et les 2 index partiels d'`appariements` sont
      migrés d'un préfixe `orgId` à un préfixe `dossierId`. *(Preuve par balayage : deux dossiers de
      la même organisation, même exercice civil, même source, version 1 → **deux** balances écrites,
      **deux** exercices ouverts simultanément — pas d'`E11000`, pas de NOP silencieux.)*
- [ ] **AC-6** — `cahiers/categories` est re-scopé `dossierId` (Q1) ; deux dossiers de la même
      organisation peuvent définir une catégorie de même libellé sans collision.
- [ ] **AC-7** — `BalanceCreatedEventV1` porte `dossierId` ; un test le prouve, et la valeur publiée
      correspond exactement au `dossierId` de la balance persistée dans la **même transaction
      outbox**. *(Champ additif de cohérence — aucun consommateur ne le lit à ce jour, cf. « Le
      constat ».)*
- [ ] **AC-8** — Le read-model `dossiers_dossier` (jusqu'ici hook inerte, STORY-356) est effectivement
      **lu** par le mécanisme de résolution — un test fait varier son contenu et observe le
      comportement des routes changer en conséquence (pas un simple "ne plante pas").
- [ ] **AC-9** — Non-régression : toute route déjà couverte par un e2e existant reste testée, adaptée
      au nouveau chemin `/dossiers/:dossierId/...` — aucun test simplement supprimé pour faire passer
      la story.
- [ ] **AC-10** — Vérification docker : parcours **Atelier → Bilan en écriture** (balance soumise,
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

- [ ] Lint 0 warning · build OK.
- [ ] Unit + e2e verts, couverture ≥ seuils du projet (65/90/90/90) — **jamais abaissés**.
- [ ] Les 10 AC ci-dessus prouvées par test, pas affirmées.
- [ ] **Mutation-test** sur chaque garde annoncée : au minimum, l'anti-énumération (AC-2), l'archivage
      (AC-3) et chacun des 4+2 index migrés (AC-5) — la preuve est la mutation qui **vire au rouge**,
      pas le test vert.
- [ ] **Vérification docker réelle** (stack neuve `down -v`) : AC-5 rejouée en base (deux dossiers,
      même exercice, écriture des deux), AC-7 (événement observé avec `dossierId`), AC-10 (parcours
      Atelier → Bilan en écriture).
- [ ] Revue de code ⑥ et revue de sécurité ⑦ (session `opus`) — attention particulière à
      l'anti-énumération et à la frontière `orgId` dans le mécanisme de résolution commun.
- [ ] Endpoints documentés dans Swagger (nouveau segment `:dossierId`, codes `404`/`409` ajoutés).
- [ ] Cohérence du patron de route avec STORY-357 consignée (même convention
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
