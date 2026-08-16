# STORY-357 : `bilan-service` se scope sur le dossier — la liasse cesse d'appartenir au cabinet

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **F** (§4.2),
décision **D5**
**Priorité :** Must Have
**Story Points :** 5
**Statut :** Not Started
**Complexité :** high
**Créée le :** 2026-08-15
**Sprint :** 20
**Service :** `bilan-service`

---

## Le constat

Comme `balance-service` (**STORY-236**, même sprint), `bilan-service` a été migré par **STORY-356** :
4 collections (`exercices`, `snapshots_liasse`, `mapping_overrides`, `jeux_hypotheses`) portent
`dossierId` **requis au schéma**, sans qu'aucune route n'écrive encore ce champ — les écritures sont
**gelées** depuis le 2026-08-15. Cette story lève ce gel côté `bilan-service`.

**Ce que le re-scopage révèle, vérifié dans le code le 2026-08-15** :

**1. `jeux_etats` — le premier agrégat réellement persisté — ne porte `dossierId` NULLE PART**, ni
schéma ni migration. Son index unique est `{tenantId, exercice}` — *« au plus un jeu d'états par
exercice »*, lu tel quel dans son propre docstring. Dès qu'un cabinet a 2 dossiers, un jeu d'états
« 2025 » pour « Mon cabinet » et un jeu d'états « 2025 » pour un dossier client **se percutent** :
`E11000` sur la création du second, alors qu'ils n'ont **rien** en commun. C'est l'agrégat central du
service (le Bilan/CR/TFT en dérivent) et il n'a même pas reçu le hook inerte que STORY-356 a posé
ailleurs — cette story doit d'abord lui **ajouter** `dossierId`, pas seulement le re-scoper.

**2. `mapping_overrides` a déjà `dossierId` (posé par STORY-356) mais son index unique partiel reste
`{tenantId, compte}` sur `statut: VALIDATED`.** Une surcharge validée pour le compte `601000` dans le
dossier A **bloquerait** toute validation d'une surcharge sur le même compte dans le dossier B du même
cabinet — exactement le même mode de panne que `comptes_ventilation` dans `balance-service`.

**3. `versions_hypotheses` ne porte `dossierId` nulle part** (absent des 4 collections migrées par
STORY-356) — à corriger pour rester cohérent avec `jeux_hypotheses` qu'il versionne.

**4. Le risque le plus sérieux du service, déjà identifié par le PO au réancrage** : la
**comparaison inter-exercices** (`GET /bilan/comparaison/exercices?exercices=2023,2024,2025`,
STORY-074) résout aujourd'hui chaque exercice **par libellé seul, dans `jeux_etats`, tenant-scopé** —
vérifié dans `comparaison-exercices.service.ts` (`this.jeux.findOne({ exercice: libelle })`, filtré
uniquement par le repository tenant-scoped). Sans `dossierId` sur `jeux_etats` ni garde
supplémentaire, comparer « 2023, 2024, 2025 » mélangerait silencieusement les exercices de **deux
dossiers différents du même cabinet** — un tableau **plausible et faux**, le pire mode de panne
possible : pas d'erreur, un résultat cru exact qui compare deux sociétés. **Le vrai risque n'est pas
le plantage.**

---

## User Story

En tant que **collaborateur d'un cabinet qui gère plusieurs dossiers clients**,
je veux **que chaque état financier, liasse figée, jeu d'hypothèses et surcharge de mapping que je
produis appartienne strictement au dossier sur lequel je travaille**,
afin qu'**aucun rapport ne compare, n'agrège ni ne confonde jamais deux sociétés différentes**.

---

## Ce que la story livre

### Mécanisme commun

- **Même patron que STORY-236** : toutes les routes des 11 familles du §4.2 (bloc F) nichées sous
  `/dossiers/:dossierId/bilan/...`, résolution/garde **factorisée** (idéalement le **même**
  mécanisme que `balance-service`, dupliqué faute de librairie partagée entre services — décision K4
  du projet), lisant le read-model local `dossiers_dossier` (hook inerte posé par STORY-356).
- `dossierId` absent, ou d'une autre organisation que le JWT → **404** (anti-énumération). Dossier
  `ARCHIVE` → lecture `200`, écriture `409 DOSSIER_ARCHIVE` (D9).
- **Piège d'ordre de routes, à tester FAMILLE PAR FAMILLE** : `bilan/consultation` porte déjà
  `@Get()` (littéral) déclaré avant `@Get(':exercice')` (paramétré) — l'ajout du préfixe
  `/dossiers/:dossierId/` ne change pas cet ordre interne, mais chaque contrôleur qui mélange une
  route littérale et une route paramétrée au même niveau doit être vérifié individuellement, pas
  supposé correct par analogie.

### `jeux_etats` — ajout du champ, pas un simple re-scopage

- `dossierId: Types.ObjectId` ajouté au schéma (`required: true`, même asymétrie délibérée
  schéma/type TS que les 4 collections déjà migrées, le temps que les routes existantes soient
  corrigées **dans cette même story** — pas de fenêtre de gel supplémentaire ici, contrairement à
  STORY-356 qui gelait en attendant STORY-357).
- **Index unique migré** de `{tenantId, exercice}` à `{tenantId, dossierId, exercice}` — deux
  dossiers du même cabinet peuvent désormais avoir chacun un exercice « 2025 ».
- `jeu-etats.controller.ts` (`POST`, `GET`, `GET :id`, `POST :id/recalculer`, `POST :id/valider`,
  `POST :id/rouvrir`, `GET :id/versions[/:version]`) niché sous `/dossiers/:dossierId/bilan/etats`.

### `mapping_overrides`

- Index unique partiel migré de `{tenantId, compte}` à `{tenantId, dossierId, compte}` (toujours
  filtré `statut: VALIDATED`) — une surcharge validée par dossier, pas par cabinet.

### `versions_hypotheses`

- `dossierId` ajouté (cohérence avec `jeux_hypotheses`), reporté depuis le `JeuHypotheses` parent à
  chaque version créée.

### Comparaison inter-exercices (STORY-074) — le garde-fou central de la story

- `GET /dossiers/:dossierId/bilan/comparaison/exercices?exercices=...` : la résolution passe
  désormais par `{dossierId, exercice: libelle}` sur `jeux_etats` — **structurellement incapable**
  de résoudre un exercice d'un autre dossier, plus besoin d'un contrôle après-coup.
- **Le 409 `COMPARAISON_INTER_DOSSIERS`** annoncé au cadrage du sprint devient **surabondant** une
  fois la résolution elle-même scopée dossier — noté comme **point à trancher en dev-story** : soit
  la scoping seule suffit (aucune route ne permet plus de désigner un exercice hors du dossier), soit
  un garde-fou explicite reste utile en défense en profondeur si un futur endpoint acceptait un
  `jeuEtatsId` brut plutôt qu'un libellé. **Ne pas décider ici par confort** — documenter le choix et
  son test en Progress Tracking.

### Autres familles du §4.2 (bloc F)

`bilan/audit`, `bilan` (diagnostics — `table-de-passage`, `etats/*/dry-run`), `bilan/consultation`,
`bilan/export`, `bilan/hypotheses`, `bilan/previsionnel`, `bilan/mapping-overrides` (déjà couvert
ci-dessus) — nichés sous `/dossiers/:dossierId/...`, sans changement fonctionnel au-delà du chemin et
du champ persisté.

## Hors périmètre

- **Le moteur de calcul lui-même** (Bilan/CR/TFT, contrôles, table de passage) : agnostique du
  dossier par construction (« sur soldes fournis ») — rien à y changer.
- **Consommation Kafka de `balance.created`** : **n'existe pas** dans `bilan-service` aujourd'hui
  (vérifié le 2026-08-15, cf. STORY-236) — le moteur fonctionne sur des soldes fournis par
  l'appelant, pas par une lecture automatique de `balance-service`. Rien à coordonner ici sur ce
  canal ; le lien entre les deux services, côté livrable, se limite au **patron de route identique**
  et au **read-model `dossiers_dossier`**.
- **D6/D11 (affectation, visibilité collaborateur)** : même limite que STORY-236 — le read-model
  `dossiers_dossier` ne porte pas l'affectation. Frontière stricte par organisation garantie ici,
  pas l'affinement par collaborateur.
- **Frontend** : sélecteur de dossier actif, re-scopage des écrans — autre dépôt (bloc I).
- **STORY-303** (datation des 2 axes par exercice) : hors périmètre, même limite que STORY-236.

---

## Acceptance Criteria

- [ ] **AC-1** — Toute route des 11 familles du §4.2 exige `dossierId` en tête de chemin ; les
      anciennes routes sans `dossierId` n'existent plus.
- [ ] **AC-2** — `dossierId` inexistant ou d'une autre organisation → **404** sur chaque famille.
      *(Deux organisations réelles, un test par famille — pas un seul test générique.)*
- [ ] **AC-3** — Dossier `ARCHIVE` : lecture `200`, écriture `409 DOSSIER_ARCHIVE`.
- [ ] **AC-4** — `jeux_etats` porte `dossierId` requis au schéma ; son index unique est
      `{tenantId, dossierId, exercice}` — deux dossiers du même cabinet ouvrent chacun un exercice
      de même libellé sans collision. *(Preuve par balayage, pas par jeu d'essai unique.)*
- [ ] **AC-5** — `mapping_overrides` : deux dossiers du même cabinet valident chacun une surcharge
      sur le **même** numéro de compte sans collision (`E11000`).
- [ ] **AC-6** — `versions_hypotheses` porte `dossierId`, reporté depuis le `JeuHypotheses` parent.
- [ ] **AC-7** — La comparaison inter-exercices (`bilan/comparaison/exercices`) ne peut **pas**
      confronter un exercice du dossier appelé avec un exercice d'un **autre** dossier de la même
      organisation. *(Test positif : deux dossiers, chacun un exercice « 2025 » validé, aux valeurs
      différentes — la comparaison scopée au dossier A ne retourne jamais les valeurs du dossier B.)*
- [ ] **AC-8** — Toute route d'écriture persiste `dossierId` — plus aucune `ValidationError` sur les
      4 collections déjà gardées par STORY-356/AC-4 (lève le gel).
- [ ] **AC-9** — Le read-model `dossiers_dossier` (hook inerte STORY-356) est effectivement lu — un
      test fait varier son contenu et observe le comportement des routes changer en conséquence.
- [ ] **AC-10** — Non-régression : chaque e2e existant adapté au chemin `/dossiers/:dossierId/...`,
      aucun supprimé pour faire passer la story.
- [ ] **AC-11** — Vérification docker : parcours **Atelier → Bilan en écriture** rejoué de bout en
      bout sur un dossier réel — la case laissée décochée par STORY-356 est cochée ici (conjointement
      avec STORY-236, qui couvre le côté `balance-service` du même parcours).

---

## Notes techniques

- **Ordre imposé, comme STORY-236** : migrer les index uniques **avant** ou **dans le même commit**
  que le câblage des routes. `jeux_etats` demande une étape supplémentaire (ajout du champ, absent
  de STORY-356) — traiter cette collection **en premier**, c'est elle qui porte le risque le plus
  concret (AC-4, AC-7).
- **AC-7 est le cœur de la story** : c'est la ligne du sprint-status qui l'a motivée (« rendrait un
  tableau plausible et FAUX — le pire mode de panne du produit »). Un test qui vérifie seulement
  « 404 sur un dossierId d'une autre org » ne suffit **pas** à couvrir AC-7 : le risque n'est pas un
  accès refusé, c'est une **lecture silencieusement fausse** entre deux dossiers de la **même**
  organisation, donc autorisés l'un comme l'autre par le JWT.
- **Facteur commun avec STORY-236** : même patron de garde/route, développé indépendamment (pas de
  librairie partagée entre services, décision K4) — vérifier après coup que les deux implémentations
  ne divergent pas sur l'anti-énumération ou le traitement de l'archivage.
- **Marche arrière de migration (dette de STORY-356)** : comme pour `balance-service`, la marche
  arrière de `bilan-service` détache aujourd'hui `dossierId` de tout document qui en porte un — à
  retirer ou borner ici, avant qu'elle ne détache des `dossierId` légitimes posés par les nouvelles
  routes.
- **Migration de données différée** : les 4 collections déjà migrées par STORY-356 portent déjà le
  bon `dossierId` sur l'existant. **`jeux_etats` n'a en revanche reçu aucun `dossierId` par STORY-356**
  (elle n'était pas dans son périmètre) : les documents `jeux_etats` antérieurs à cette story restent
  sans `dossierId` tant qu'un backfill n'est pas exécuté. Décider ici si un petit script de
  rattachement (par `tenantId` → dossier « Mon cabinet », même patron que STORY-356) est nécessaire
  avant de rendre le champ `required`, ou si la base de dev repart de zéro (règle du projet : «
  migration de données = souci de prod, différé »).

---

## Dépendances

**Prérequises :** **STORY-301** (modèle Dossier) · **STORY-356** (migration + read-model
`dossiers_dossier`, hook inerte, 4 collections).
**Concomitante :** **STORY-236** (`balance-service`) — même sprint, même patron de route, même
read-model. **Pas de contrat d'événement partagé** (cf. Hors périmètre).
**Débloque :** la levée complète de la dette « écritures gelées » notée à la clôture de STORY-356 ;
STORY-359 (portefeuille, agrégation par dossier).

---

## Definition of Done

- [ ] Lint 0 warning · build OK.
- [ ] Unit + e2e verts, couverture ≥ seuils du projet (65/90/90/90) — jamais abaissés.
- [ ] Les 11 AC ci-dessus prouvées par test.
- [ ] **Mutation-test** sur chaque garde annoncée, en particulier AC-4 (index `jeux_etats`) et AC-7
      (comparaison inter-dossiers) — la preuve est la mutation qui vire au rouge.
- [ ] **Vérification docker réelle** (stack neuve `down -v`) : AC-4 et AC-5 rejouées en base (deux
      dossiers, écritures concurrentes sans collision), AC-7 observée avec deux dossiers réels et
      deux jeux d'états validés, AC-11 (parcours Atelier → Bilan, conjointement avec STORY-236).
- [ ] Revue de code ⑥ et revue de sécurité ⑦ (session `opus`).
- [ ] Endpoints documentés dans Swagger (segment `:dossierId`, codes `404`/`409` ajoutés).
- [ ] Décision sur le backfill de `jeux_etats` consignée (script ou base repartie de zéro).

---

## Story Points Breakdown

- Mécanisme commun de résolution/garde `dossierId` (parallèle à STORY-236) : 1 pt
- `jeux_etats` : ajout du champ + migration d'index + re-scopage du contrôleur (le plus gros risque) : 1,5 pt
- Comparaison inter-exercices (AC-7, garde-fou + tests) : 1 pt
- `mapping_overrides` + `versions_hypotheses` (index + champ) : 0,5 pt
- Re-scopage des familles restantes (audit, diagnostics, consultation, export, hypothèses,
  prévisionnel) : 0,5 pt
- Vérification docker + mutation-test + revue : 0,5 pt
- **Total : 5 points**

---

## Progress Tracking

### ① Rédaction / cadrage (2026-08-15)

Story réancrée le 2026-08-09 dans `sprint-status.yaml` (EPIC-043, sprint 20) — document rédigé
maintenant, sans dev, dans la foulée de STORY-236 (même sprint, même epic).

Grounding effectué directement dans le code de `bilan-service` et le ticket
`TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` (bloc F, §4.2) :

- Confirmé les **4 collections déjà gardées** par STORY-356/AC-4 : `exercices`, `snapshots_liasse`,
  `mapping_overrides`, `jeux_hypotheses`.
- **Découvert que `jeux_etats` — l'agrégat central du service — n'a reçu ni `dossierId` ni hook par
  STORY-356**, alors que son index unique `{tenantId, exercice}` porte exactement le même risque de
  collision silencieuse entre dossiers que celui identifié dans `balance-service` (STORY-236). C'est
  le point technique le plus significatif de cette story.
- **Confirmé dans le code le mécanisme exact du risque déjà pressenti par le PO** (note de
  réancrage) : `comparaison-exercices.service.ts` résout un exercice par libellé seul, tenant-scopé,
  sans aucune notion de dossier — la comparaison inter-exercices mélangerait aujourd'hui deux
  dossiers du même cabinet sans erreur ni avertissement.
- **Vérifié qu'aucun consommateur de `balance.created` n'existe dans `bilan-service`** — corrige une
  hypothèse de couplage fort avec STORY-236 (via cet événement) qui aurait été fausse ; le lien réel
  entre les deux stories est le patron de route et le read-model, pas un contrat Kafka partagé.
- Statut laissé à `Not Started` — le dev n'a pas commencé.
