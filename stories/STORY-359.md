# STORY-359 : Le portefeuille se lit — pagination, recherche, compteurs et prochaine échéance

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — blocs **K** et **P** · décisions **D6**, **D15**, **D16** · question **Q11** *(tranchée)*
**Priorité :** Must Have
**Story Points :** 8 → **12** *(amendée le 2026-08-20)* → **13 réels** *(cf. § « Ce que le cadrage disait de faux »)*
**Statut :** ✅ **CLÔTURÉE le 2026-08-20** — trois PR rebase-mergées sur `dev`, **sauf AC-A2 et AC-A5** *(cf. § « Ce que l'amendement demande et qui N'EST PAS livré »)*
**Complexité :** high
**Créée le :** 2026-08-09
**Recadrée le :** 2026-08-19 *(deux prémisses vérifiées fausses — cf. § « Ce que le cadrage disait de faux »)*
**Sprint :** 20
**Service :** `dossier-service` + `balance-service` + `bilan-service` *(depuis l'amendement du 2026-08-20)*

---

## ⚡ Amendement du 2026-08-20 — le GRAIN, et deux producteurs qui n'existent pas

> **Rien n'est encore écrit** (`📋 À faire`). Les deux points ci-dessous ne coûtent presque rien
> maintenant et deviennent coûteux dès la première ligne de code : l'un demanderait de **re-keyer un
> read-model et de rejouer les événements**, l'autre de découvrir en cours de route que la story
> consomme du vide.

### A. Les read-models sont keyés par DOSSIER ; il leur faut le grain de l'EXERCICE

`EtatBalanceDossier` et `EtatLiasseDossier` sont pensés pour **une ligne de portefeuille par
dossier**. C'est le bon besoin — mais ce n'est pas le seul, et l'autre est déjà tombé :

⛔ **FE-066 a dû renoncer à un élément de son périmètre faute de cette donnée.** Son §1 demandait
« l'**état de la balance et de la liasse par exercice** » dans l'onglet Exercices.
`ExerciceResponseDto` ne publie rien de tel, et le reconstituer côté client coûtait deux dépendances
qu'aucun AC ne demandait — dont `balance-service`, **derrière `@RequiresBalanceAccess`** : un cabinet
sans entitlement Atelier aurait vu un onglet **d'exercices** en erreur. L'écart a été transmis ici.

⇒ **Keyer les deux read-models `(dossierId, exercice)`** et faire de la ligne de portefeuille une
**projection de l'exercice ouvert**, pas l'inverse. Le sens compte : descendre du grain fin vers
l'agrégat est une lecture ; remonter de l'agrégat vers le grain fin est une reprise de données.

⚡ **La clé de jointure existe déjà, il n'y a rien à inventer** : `BalanceSoumiseV1` porte
`exercice: { debut, fin }`, `dossier-service` ramène ses bornes à **minuit UTC** avant de les écrire,
et son index unique `(orgId, dossierId, bornes.debut, bornes.fin)` garantit qu'un couple de bornes
désigne au plus un exercice.

⚠️ **Ne pas keyer par `exerciceId`** : les événements de balance ne le portent pas — ils portent les
bornes. Un `exerciceId` obligerait `balance-service` à connaître les identifiants de
`dossier-service`, c'est-à-dire à recréer le couplage que D5 vient de défaire.

### B. `balance.validee` et `liasse.figee` n'existent pas — cette story les crée

Le périmètre initial disait « alimentée par les read-models locaux (`balance.validee`, `liasse.figee`,
`dossier.exercice.*`) ». Vérifié le 2026-08-20 :

| Topic attendu | Réalité |
| --- | --- |
| `dossier.exercice.*` | ✅ existe — `EXERCICE_TOPICS`, produit par STORY-355 |
| `balance.validee` | ⛔ **n'existe pas** — `balance-service` émet `balance.submitted` et `balance.rejected` |
| `liasse.figee` | ⛔ **n'existe pas** — `bilan-service/src/kafka/events/` n'a **aucun** topic de liasse |

**Décision PO du 2026-08-20 : les deux producteurs sont repliés DANS cette story.** Elle passe donc
de **8 à 12 points** et devient **cross-service** (`dossier-service` + `balance-service` +
`bilan-service`).

⚠️ **Conséquence à assumer dès le découpage** : la story ne peut plus être mergée d'un bloc. L'ordre
imposé est **producteurs d'abord, consommateur ensuite** — brancher les projections sur des topics
vides ferait démarrer les read-models sur un portefeuille intégralement « à configurer », c'est-à-dire
l'alerte généralisée que STORY-303/FE-061 a déjà payée une fois.

⚠️ **`balance.validee` n'est pas `balance.submitted` renommé.** *Soumise* et *validée* sont deux faits
distincts (FE-058 : la validation est un acte explicite, avec ses contrôles bloquants). Émettre le
mauvais ferait afficher « balance validée » sur une balance déposée mais jamais contrôlée — plausible,
faux, et invisible.

### Ce que l'amendement ajoute aux Acceptance Criteria

- [ ] **AC-A1** — `EtatBalanceDossier` et `EtatLiasseDossier` sont keyés `(dossierId, exercice)` ; un
      dossier à 3 exercices porte **3 lignes** de chaque, et la ligne de portefeuille en **dérive**
      (exercice ouvert), sans requête supplémentaire.
- [ ] **AC-A2** — L'état par exercice est **lisible** : il rejoint `ExerciceResponseDto` (ou un champ
      frère de `GET /dossiers/{id}/exercices`), **sans appel sortant** et **sans dépendre de
      l'entitlement Atelier** — c'est tout l'intérêt de le servir depuis `dossier-service`.
- [ ] **AC-A3** — `balance.validee` est émis par `balance-service` **à la validation** (jamais à la
      soumission) et `liasse.figee` par `bilan-service` **au figeage**, tous deux portant
      `dossierId` **et** `exercice { debut, fin }`.
- [ ] **AC-A4** — Un exercice **sans** balance et **sans** liasse rend un état **absent**, jamais un
      état « vide » ou « en cours ». *(Même règle que `prochaineEcheance` : ne pas inventer une
      donnée qu'on n'a pas — un « 0 % » se lit comme un fait mesuré.)*
- [ ] **AC-A5** — Vérification docker : valider une balance sur 2024, figer la liasse 2024, ouvrir
      2025 ⇒ l'onglet Exercices distingue les deux années. ⚠️ **Attendre une CONDITION, jamais un
      délai.**

### Ce que l'amendement ajoute au découpage de points

- Grain `(dossierId, exercice)` sur les deux read-models + dérivation de la ligne : **+1 pt**
- Producteur `balance.validee` (`balance-service`) : **+1,5 pt**
- Producteur `liasse.figee` (`bilan-service`) : **+1,5 pt**

---

## Le constat

La maquette FE-D00 montre un portefeuille avec trois compteurs, une recherche, un tri, un filtre
actifs/archivés, et sur chaque carte : le statut d'avancement et **la prochaine échéance**. Aucune de
ces informations n'a de source aujourd'hui.

Deux difficultés distinctes s'y cachent :

1. **L'agrégation.** Une ligne du portefeuille mêle trois services — statut de balance
   (`balance-service`), liasse figée (`bilan-service`), échéance (paquet fiscal). Aucune route ne les
   réunit, et un fan-out par dossier serait un N+1 sur 500 dossiers.
2. **L'échéance.** La donnée **existe** — `paquet-fiscal-togo-2026.json` porte une clé `echeances` —
   mais `grep echeance` sur les contrôleurs de `balance-service/src/modules/fiscal/` ne rend **rien**.
   Le calendrier complet appartient au module Fiscalité (STORY-315/316, sprint 25), soit six sprints
   plus tard. **Q11 a tranché** : on sert ici une **échéance minimale**, délibérément jetable.

---

## ⛔ Ce que l'amendement demande et qui N'EST PAS livré

L'amendement du 2026-08-20 a été écrit **pendant** que la story était développée, et les deux dépôts
ont convergé sans se voir : il conclut aux mêmes deux points que le recadrage du 2026-08-19 (grain
par exercice, producteurs repliés). Le code livré les satisfait — **sauf deux critères** :

| AC | État | Détail |
|---|---|---|
| **AC-A1** — read-models keyés `(dossierId, exercice)`, ligne de portefeuille **dérivée** | ✅ **livré** | Index unique `{dossierId, exercice}` sur les deux collections, la ligne dérive de l'exercice **ouvert**, sans requête supplémentaire (1 seule opération Mongo par page, mesurée au profileur). |
| **AC-A2** — l'état par exercice est **lisible** (`ExerciceResponseDto` ou champ frère) | ⛔ **NON livré** | Les read-models portent bien le grain, mais **aucune route ne l'expose** : `GET /dossiers/:id/exercices` est inchangé. **FE-066 reste donc bloquée** sur l'écart qu'elle a transmis. |
| **AC-A3** — émis **à la validation**, jamais à la soumission, avec `dossierId` **et** bornes d'exercice | ✅ **livré**, ⚠️ **sous d'autres noms** | Voir ci-dessous. |
| **AC-A4** — un exercice sans balance ni liasse rend un état **absent** | ✅ **livré** | Aucune ligne ⇒ champ absent, jamais « vide » ni « en cours ». |
| **AC-A5** — vérif docker distinguant **deux années** dans l'onglet Exercices | ⛔ **NON livré** | La vérification docker a porté sur **un** exercice par dossier. Elle n'a pas pu couvrir l'onglet, faute d'AC-A2. |

### ⚠️ Les topics ne portent pas les noms de l'AC-A3, et c'est délibéré

| Nom demandé | Nom livré | Pourquoi |
|---|---|---|
| `balance.validee` | **`balance.etat.change`** | `marquerEtat` porte **deux** transitions et `REJETÉE → VALIDÉE` reste permis (STORY-145 § D). Un topic nommé d'après une seule valeur n'a aucun endroit où publier l'autre. |
| `liasse.figee` | **`liasse.etat.change`** | Un jeu validé peut être **rouvert**. Prouvé en docker : la réouverture publie `BROUILLON` en conservant le numéro de version. Sous le nom `liasse.figee`, le portefeuille aurait affiché « déposée » indéfiniment. |

**Ce que l'AC-A3 exige sur le fond est tenu** : émission **à la validation** et jamais à la
soumission, `dossierId` **et** bornes d'exercice portés. Seul le **nom** diffère, et il diffère pour
que l'état publié puisse rester **absolu** — l'exigence de `.agents/rules/kafka-evenements.md`.

⚡ **Le contrat va même plus loin que l'amendement ne le demandait** : `balance.etat.change` publie
l'état de **l'exercice**, pas celui d'un document. Ce domaine autorise plusieurs balances par
`(dossier, exercice)` ; publier l'état d'un document faisait écraser « la balance Sage est validée »
par « l'import OCR concurrent vient d'être rejeté ». Le consommateur ne pouvait pas le rattraper.

⇒ **AC-A2 et AC-A5 sont à reprendre dans une story de suite** (voir le § de clôture).

---

## ⚠️ Ce que le cadrage disait de faux — vérifié dans le code le 2026-08-19

Deux prémisses du cadrage initial ne tiennent pas contre le code réel. Elles ne changent pas ce que la
story doit livrer ; elles changent **combien de dépôts** elle touche, et c'est ce qui a été arbitré.

**① `balance.validee` et `liasse.figee` n'existent nulle part.** Les deux noms n'apparaissent que dans
cette story. Vérifié :

- `balance-service` n'émet que `balance.created` (à la **création** d'une balance, donc `BROUILLON`) et
  `balance.rejected` (rejet d'**ingestion** de l'adaptateur #1 — rien à voir avec l'état d'une balance
  persistée). `BalanceService.marquerEtat`, la transition `BROUILLON → VALIDÉE|REJETÉE` livrée par
  **STORY-145**, n'émet **aucun** événement ;
- `bilan-service` **n'a ni outbox, ni relais, ni producteur** : il ne publie **aucun** événement, tout
  court. `src/kafka/` n'y porte que des contrats **entrants** (`kyc.status.changed`,
  `entitlement.changed`).

La ligne « Consomme : les événements de STORY-236 et STORY-357 » est donc sans objet : ces deux stories
ont **re-scopé** leurs services au `dossierId`, elles n'ont ajouté aucun producteur.

⇒ **Les deux producteurs font partie de cette story.** Poser les consommateurs seuls rejouerait
exactement le défaut de STORY-372 (« une garde posée sans son écrivain ») et de STORY-373 : un
read-model que personne n'alimente est vert en test et vide en production.

**② La clé `echeances` n'est pas au niveau du paquet.** Elle vit à `acomptesProvisionnels.echeances`, et
vaut `["31-01", "31-05", "31-07", "31-10"]` — les quatre acomptes d'IS (Art. 114-116 CGI). C'est la
**seule** donnée datée et structurée du paquet : `tva.declaration` publie une périodicité, jamais une
date, et sort déjà marquée `A_CONFIRMER`. Conséquence directe absente du cadrage : ces acomptes sont
**libératoires pour le régime synthétique (TPU)** — un dossier au TPU n'a donc **aucune** échéance à
servir, et c'est exactement le cas d'absence que l'AC interdit d'inventer.

De plus, `dossier-service` **n'embarque aucun paquet fiscal** : le chargeur, le manifeste et l'artefact
vivent dans `balance-service`. Le paquet y est donc **embarqué à l'identique** (mêmes octets, même
checksum, garde de byte-identité — patron STORY-368), comme `bilan-service` le fait déjà pour ses
propres artefacts. Aucun appel REST sortant n'est introduit.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **voir mon portefeuille en une page, chercher un dossier et savoir ce qui presse**,
afin de **piloter cinquante dossiers sans en ouvrir un seul**.

---

## Ce que la story livre

### Dans `dossier-service` — la route et sa lecture

- **`GET /dossiers`** paginé, trié, recherché — **côté serveur** :
  `?page&size&tri=nom|activite|etat&q=&statut=actifs|archives&affectation=moi`. `size` plafonné serveur
  (défaut 25, max 100). La **portée reste dérivée du jeton** (STORY-353) : `q` filtre, il n'élargit
  jamais.
- **Recherche** sur raison sociale, sigle, NIF et RCCM, **insensible à la casse et aux accents**, sur le
  NIF normalisé de STORY-354 (« 1000 745 307 » trouve « 1000745307 »).
- **Ligne de portefeuille agrégée**, servie sans N+1 : statut du dossier, exercice ouvert, avancement,
  état de la balance, état de la liasse, responsable, prochaine échéance. Alimentée par les
  **read-models locaux** et les collections locales — aucun appel REST sortant, aucune jointure
  cross-base.
- **Trois compteurs** calculés **sur la portée de l'appelant**, pas sur l'organisation : `dossiers`,
  `aConfigurer`, `bilansEnCours`. ⚡ Un collaborateur qui lirait « 5 dossiers » alors qu'il en voit 2
  conclurait qu'on lui en cache — un compteur hors périmètre est pire qu'un compteur absent.
- **Échéance minimale (Q11)** : `prochaineEcheance { code, libelle, date, joursRestants, source }`,
  dérivée du paquet fiscal **embarqué** pour le pays du dossier, du **régime en vigueur** et de son
  exercice ouvert. Le champ porte `source: 'PAQUET_MINIMAL'` — pour que le jour où STORY-316 sert le
  vrai calendrier, le remplacement soit **repérable et sans ambiguïté** au lieu d'être deviné.
- **Filtre `statut`** : un dossier archivé **ne remonte jamais** dans la vue « actifs », **même
  cherché par son nom** — sinon « archiver » ne veut plus rien dire (D9).
- **Filtre `affectation=moi`** *(arbitrage PO du 2026-08-19, ticket
  `TICKET-BACKEND-filtre-mes-dossiers-au-portefeuille.md`, GAP fermé par cette story)* : appliqué
  **APRÈS** la portée du jeton, jamais à sa place. `TENANT_ADMIN` → restreint à `responsableUserId` ∪
  `contributeursUserIds` ; `TENANT_USER` → **sans effet, et surtout pas une erreur** (sa portée est déjà
  celle-là) ; absent → inchangé. Traité **ici** et pas après : la route change de signature une fois,
  pas deux — et FE-059a ne peut pas l'implémenter honnêtement côté client, la pagination serveur
  D16 ne filtrant alors que la page courante.
- **Deux read-models locaux** `etats_balance_dossier` et `etats_liasse_dossier`, alimentés par les deux
  producteurs ci-dessous via des consumers **idempotents** (`ProcessedEvent`). C'est ce qui rend le
  portefeuille **résilient** : un service amont arrêté n'empêche pas la page de s'afficher, elle sert un
  état **daté**.

### Dans `balance-service` — le producteur qui manquait

- Nouveau topic **`balance.etat.change`**, émis **dans la transaction** de
  `BalanceService.marquerEtat` via l'outbox existante. Contrat à **état absolu** (`VALIDÉE` ou
  `REJETÉE`), jamais un delta — règle `.agents/rules/kafka-evenements.md`.
- ⚠️ Le nom `balance.validee` du cadrage est **écarté** : `marquerEtat` porte **deux** transitions, et
  `REJETÉE → VALIDÉE` reste permis. Un topic qui ne nomme qu'une des deux valeurs oblige à en créer un
  second au premier rejet, ou à publier une valeur que son nom dément.
- ⚠️ `BROUILLON` n'est **pas** publié : aucun écran ne distingue « balance en brouillon » de « pas de
  balance », et `balance.created` existe déjà pour le handoff vers `bilan-service` — le détourner
  donnerait deux topics pour un seul read-model.

### Dans `bilan-service` — le socle producteur qui n'existait pas

- **Outbox transactionnelle + relais**, calqués sur `dossier-service` (mêmes schéma, mêmes garanties) :
  le service ne publiait **rien** jusqu'ici.
- Nouveau topic **`liasse.figee`**, émis **dans la transaction** qui écrit le `SnapshotLiasse` —
  jamais de liasse figée sans événement, jamais d'événement sans snapshot.

## Hors périmètre

- Le **calendrier fiscal complet**, ses filtres, ses reports administratifs et ses alertes →
  **STORY-315 / 316 / 317 / 318** (module Fiscalité, sprints 25-26). Cette story ne les remplace pas,
  elle **tient jusqu'à** elles.
- Les **obligations sociales** dans l'échéance → STORY-349.
- L'export du portefeuille (CSV/Excel) → non planifié, aucun besoin exprimé.
- La **persistance de l'échéance** : elle se calcule à la lecture, donc il n'y a **rien à migrer** le
  jour du remplacement. C'est ce qui rend l'avance jetable *sans dette*.
- Le **re-scopage `dossierId` des collections encore org-keyed** de `balance-service`
  (`tresorerie`, `suggestion`, `referentiel`, `profils_import`) et la dette D6/D11 qui va avec : ouverte
  par STORY-236, elle reste ouverte — cette story lit un état, elle ne change aucune frontière d'accès.

---

## Acceptance Criteria

- [ ] `GET /dossiers?page=2&size=10` rend la bonne tranche, avec `total`, `page`, `size` ; `size=500`
      est **plafonné à 100** côté serveur sans erreur.
- [ ] Les trois tris rendent un ordre **déterministe** (départage par `_id` en cas d'égalité) — deux
      appels identiques rendent la même page.
- [ ] `q=kossi`, `q=1000 745 307` et `q=TG-LOM-2019` trouvent tous les trois « Ets Kossi
      Distribution » ; `q=KOSSI` aussi (casse) ; `q=épargne` trouve « Mutuelle d'Épargne Bè » (accents).
- [ ] **Portée** : le même appel, joué par l'admin et par un collaborateur, rend des ensembles
      différents ; `q` ne fait **jamais** apparaître un dossier hors portée. *(Mutation-test : si `q`
      est appliqué avant le filtre de portée, un test rougit.)*
- [ ] **`affectation=moi`** restreint le portefeuille d'un `TENANT_ADMIN` à ses seules affectations,
      **reste sans effet et sans erreur** pour un `TENANT_USER`, et n'ajoute **jamais** un dossier que
      la portée du jeton n'accordait pas. *(Mutation-test : appliqué à la place de la portée plutôt
      qu'après elle, un test rougit.)*
- [ ] Les trois compteurs correspondent **exactement** aux lignes que l'appelant peut voir, **tous
      filtres compris** (`statut`, `q`, `affectation`) et **sur l'ensemble filtré, pas sur la page** —
      `dossiers` est donc égal au `total` de la pagination.
- [ ] Un dossier archivé n'apparaît **pas** avec `statut=actifs`, **même** en le cherchant par son nom
      exact ; il apparaît avec `statut=archives`.
- [ ] **Aucun N+1** : servir une page de 25 dossiers exécute un **nombre constant** de requêtes Mongo,
      mesuré et asserté — pas « ça a l'air rapide ».
- [ ] **NFR** : sur un jeu de **500 dossiers** semé, la première page rend en **< 2 s** et un
      changement de filtre en **< 500 ms** (aligné sur NFR-F13 du PRD Fiscalité).
- [ ] `prochaineEcheance` porte `source: 'PAQUET_MINIMAL'` et est **absente** (pas nulle, pas zéro)
      quand le paquet du pays n'en fournit pas — un dossier sans échéance connue ne doit pas afficher
      une date inventée. **Cas nommés** : dossier au régime `SYNTHETIQUE` (TPU, libératoire de l'IS) ;
      dossier sans exercice ouvert ; pays sans paquet embarqué.
- [ ] **`balance.etat.change`** est émis **dans la transaction** de `marquerEtat` — une balance validée
      sans événement en outbox, ou l'inverse, fait rougir un test.
- [ ] **`liasse.figee`** est émis **dans la transaction** qui écrit le `SnapshotLiasse`.
- [ ] Les deux consumers sont **idempotents** : rejouer le même `eventId` ne modifie pas le read-model,
      et un événement **plus ancien** que l'état déjà projeté est **ignoré**.

---

## Notes techniques

- **Read-models locaux dans `dossier-service`** : `EtatBalanceDossier` et `EtatLiasseDossier`, clés
  `(orgId, dossierId, exercice.debut, exercice.fin)`, portant l'état **et son horodatage** — c'est
  l'horodatage qui permet d'afficher un état *daté* quand l'amont est tombé, au lieu de mentir ou de
  faire tomber la page.
- **Une seule requête Mongo par page**, et c'est l'assertion anti-N+1 : `$match` (portée + statut +
  recherche + affectation) → `$sort` servi par index → `$lookup` (exercice ouvert, décision d'axes en
  vigueur, état de balance, état de liasse) → `$addFields` (avancement) → `$facet` { lignes paginées,
  compteurs }. Les compteurs sortent **du même pipeline** que les lignes : deux requêtes séparées
  peuvent diverger sous écriture concurrente, et un compteur qui contredit la liste est pire qu'absent.
- **Avancement**, dérivé et jamais stocké : `A_CONFIGURER` (aucun exercice ouvert **ou** aucune décision
  d'axes en vigueur à l'ouverture de cet exercice) · `BALANCE_ATTENDUE` (configuré, aucune balance
  validée) · `BILAN_EN_COURS` (balance validée, liasse non figée) · `LIASSE_FIGEE`. Les compteurs
  `aConfigurer` et `bilansEnCours` comptent respectivement le premier et le troisième — `BALANCE_ATTENDUE`
  n'entre dans aucun des deux, et c'est délibéré : la maquette ne lui donne pas de compteur, l'inventer
  ferait mentir la somme.
- **Recherche** : champ dérivé `rechercheNormalisee` (minuscules, accents dépliés NFD, espaces
  normalisés — raison sociale + sigle + RCCM), écrit par des **hooks de schéma** comme
  `nifSocieteNormalise` l'est déjà (STORY-354) : le dériver dans le service laisserait ouverts tous les
  autres chemins d'écriture. La requête est un `$or` entre un motif sur `rechercheNormalisee` et, si `q`
  porte des chiffres, un motif sur `nifSocieteNormalise` — c'est ce second terme qui fait que
  « 1000 745 307 » trouve « 1000745307 » là où un index **texte** échouerait (il découperait la saisie
  en trois jetons dont aucun n'est le NIF).
  ⚠️ Le motif est **échappé** avant d'entrer dans la requête : une saisie utilisateur qui arrive telle
  quelle dans un `$regex` est à la fois une injection et un ReDoS.
- **Index de lecture** : `{ orgId, statut, raisonSociale, _id }`, `{ orgId, statut, updatedAt, _id }`,
  `{ orgId, statut, rechercheNormalisee }`. ⚠️ **Ce que le troisième fait, et ce qu'il ne fait pas** :
  un motif **non ancré** ne permet aucun *seek*, mais Mongo peut balayer l'index restreint à
  `(orgId, statut)` et y filtrer **sans aller lire les documents**. C'est un balayage d'index, pas une
  recherche indexée — le dire autrement ferait croire à une garantie qui n'existe pas.
- **L'échéance minimale se calcule à la lecture**, depuis le paquet fiscal **embarqué à l'identique**
  dans `dossier-service` (mêmes octets, même checksum que celui de `balance-service` — garde de
  byte-identité, patron STORY-368). Aucune persistance, donc **aucune donnée à migrer** le jour où
  STORY-316 la remplace.
- **Contrats d'événement** : `état absolu`, `eventId` (idempotence), `schemaVersion`, publication
  **après persistance** par outbox, clé de partition `orgId`.

---

## Dépendances

**Prérequises :** **STORY-301** *(dossier)* · **STORY-353** *(portée — c'est elle qui définit ce que
compte un compteur)* · **STORY-355** *(exercice ouvert)* · **STORY-303** *(décision d'axes datée)* ·
**STORY-145** *(transition d'état de balance — le point d'émission)* · **STORY-065** *(snapshot de
liasse — le second point d'émission)*.
**Consomme :** `dossier.exercice.*` de **STORY-355**. ⚠️ **Et PRODUIT elle-même** les deux topics
d'état d'amont — ni STORY-236 ni STORY-357 ne les émettaient *(vérifié indépendamment le 2026-08-19
et le 2026-08-20)*, ils sont repliés dans cette story par la décision PO du jour. Ordre imposé :
**producteurs d'abord, consommateur ensuite** — respecté au merge.
**Ferme le GAP :** `GAP-filtre-mes-dossiers-portefeuille` *(ticket
`TICKET-BACKEND-filtre-mes-dossiers-au-portefeuille.md`)*.
**Débloque :** **FE-071** *(filtre « mes dossiers »)* · **FE-059**. ⚠️ **FE-066 reste bloquée** sur
l'AC-A2, non livré — voir le § dédié.
**Sera remplacée en partie par :** **STORY-315 / 316** *(calendrier fiscal complet, sprint 25)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils, **sur les trois dépôts**.
- [ ] e2e : pagination, plafond de `size`, trois tris déterministes, recherche accents/casse/NIF
      normalisé, portée admin vs collaborateur, `affectation=moi`, compteurs exacts, archivés exclus de
      la recherche.
- [ ] **Test de charge léger** : 500 dossiers semés, mesure de la première page et d'un changement de
      filtre, chiffres consignés dans la PR.
- [ ] Assertion **explicite** du nombre de requêtes Mongo par page (anti-N+1).
- [ ] **Mutation-test** sur les gardes de la story : `q`/`affectation` appliqués avant la portée,
      plafond de `size` retiré, tri privé de son départage par `_id`, garde de fraîcheur du consumer
      retirée — chacune doit faire **rougir** un test nommé.
- [ ] Vérification docker : portefeuille servi avec des états venus de **deux services distincts**, puis
      **un service amont arrêté** — le portefeuille répond toujours, avec un état daté.
- [ ] `/code-review` + `/security-review` (la portée est une frontière).
- [ ] **Trois PR ouvertes et intégrées ensemble** — un contrat d'événement à moitié livré fait diverger
      le read-model en silence.

---

## Story Points Breakdown

- `GET /dossiers` paginé/trié/recherché + `affectation=moi` + index + déterminisme : 2 pts
- Read-models `EtatBalanceDossier` / `EtatLiasseDossier` + consumers idempotents : 2,5 pts
- Compteurs scopés + filtre actifs/archivés + avancement dérivé : 1 pt
- Échéance minimale depuis le paquet fiscal embarqué (+ `source`, + absence assumée) : 1,5 pt
- Tests NFR 500 dossiers, anti-N+1, résilience amont : 1 pt
- **Total initial : 8 points**
- ⚠️ **+5 pts de recadrage** *(2026-08-19)* : producteur `balance.etat.change` dans `balance-service`
  (1 pt — l'outbox y existe déjà) et **socle outbox + relais + producteur `liasse.figee`** dans
  `bilan-service` (4 pts — le service ne publiait rien). **Total réel : 13 points, 3 dépôts.**

---

## Progress Tracking

**Statut :** 🚧 En cours — dev terminé, portes DoD franchies, vérification docker consignée ci-dessous.

### Ce qui a été livré, par dépôt

| Dépôt | Branche | Contenu |
|---|---|---|
| `dossier-service` | `MNV-359` | route paginée/triée/recherchée + `affectation=moi`, compteurs, avancement dérivé, échéance minimale, 2 read-models + consumer idempotent, 3 index de lecture, champ dérivé `rechercheNormalisee` |
| `balance-service` | `MNV-359` | topic **`balance.etat.change`** émis dans la transaction de `marquerEtat` |
| `bilan-service` | `MNV-359` | **socle outbox + relais + producteur** (le service ne publiait rien) et topic **`liasse.etat.change`** |

### Portes de qualité

| | `dossier-service` | `balance-service` | `bilan-service` |
|---|---|---|---|
| lint | 0 warning | 0 warning | 0 warning |
| build | OK | OK | OK |
| unitaires | 813 | 2 933 | 1 028 (+1 ignoré) |
| e2e | 172 | — | — |
| couverture | 99,09 / 92,09 / 96,17 / 99,17 | seuils tenus (sortie 0) | 98,65 / 93,28 / 98,33 / 98,60 |

### Mutation-testing — 21 mutations, 20 rouges **par assertion**

Aucune n'a rougi par erreur de compilation (leçon STORY-179 : une mutation qui ne
compile pas ne prouve rien — trois tentatives ont été réécrites pour cette raison).

| # | Mutation | Effet |
|:--:|---|---|
| M1 | recherche/affectation posées **à la racine** au lieu de `$and` (le `$or` écrase la portée) | 1 e2e rouge |
| M2 | plafond de `size` relevé | 1 rouge |
| M3 | tri privé de son départage par `_id` | 2 rouges |
| M4 | échappement du motif de recherche neutralisé | 6 rouges |
| M5 | garde de fraîcheur sortie du filtre d'upsert | 1 rouge |
| M6 | version figée effacée au retour au brouillon | 1 rouge |
| M7 | garde `$ne [debut, null]` retirée du rapprochement des axes | 1 rouge |
| M8 | régime **non décidé** se voit servir une échéance | 1 rouge |
| M9 | garde de débordement de date retirée (31 février → 3 mars) | 6 rouges |
| M10 | hook de recherche **décâblé** du schéma | 1 rouge |
| M11 | hook de recherche décâblé de la mise à jour par requête | 1 rouge |
| M12 | index de recherche retiré | 1 rouge |
| M13 | émission `balance.etat.change` déplacée **avant** les gardes | 2 rouges |
| M14 | émission `balance.etat.change` retirée | 2 rouges |
| M15 | émission `liasse.etat.change` retirée de `valider` | 2 rouges |
| M16 | réouverture cesse d'être transactionnelle | 1 rouge |
| M17 | `dossierId` du contexte remplacé par la chaîne vide | 1 rouge |
| M18 | une balance **REJETÉE** comptée comme un bilan en cours | 1 rouge |
| M20 | porteur non identifiable retombe sur « pas de filtre » (*fail-open*) | 1 rouge |
| M21 | compteurs calculés sur **la page** au lieu de l'ensemble filtré | 1 rouge |
| M22 | clause NIF appliquée à toute saisie | 3 rouges |

⚠️ **M19 a survécu, et c'est une mutation ÉQUIVALENTE, pas un trou de test** :
appliquer la clause `affectation=moi` **aussi** à un `TENANT_USER` produit
l'ensemble **exactement identique** — sa portée est déjà `responsable ∪
contributeur`, la clause n'est que redondante. Aucun test ne peut distinguer les
deux, et il n'y aurait rien à distinguer. Le `return []` reste, pour ne pas
payer une seconde clause pour rien.

### Vérification docker — stack neuve (`down -v`), 4 services, 2 cabinets d'événements

**⚡ Le round-trip Kafka entier, sur DEUX producteurs distincts.**
Balance soumise puis **validée** dans `balance-service` → `balance.etat.change`
en outbox (`PENDING` → `SENT`) → consommé par `dossier-service` → ligne
`etats_balance_dossier` avec le libellé **dérivé** `2026`. Jeu d'états créé puis
**validé** dans `bilan-service` → `liasse.etat.change` → `etats_liasse_dossier`.
La même ligne de portefeuille porte alors les deux états, **venus de deux
services** : `avancement: LIASSE_FIGEE`.

**⚡ L'état absolu prouvé par la RÉOUVERTURE.** Jeu rouvert → second
`liasse.etat.change` à `etat: BROUILLON`, **`version: 1` conservée**, avancement
retombé à `BILAN_EN_COURS`. Un topic nommé `liasse.figee` — celui du cadrage —
n'aurait eu **aucun endroit où publier ce retour** : le portefeuille aurait
affiché « déposée » indéfiniment.

**⚡ Une balance REJETÉE ne compte pas.** Balance de « Pharmacie du Golfe »
soumise puis rejetée → la ligne existe dans le read-model, l'avancement reste
`BALANCE_ATTENDUE` et `bilansEnCours` vaut toujours 1. C'est la branche
`$eq VALIDÉE`, pas « une ligne existe » (mutation M18).

**⚡⚡ La garde de FRAÎCHEUR prouvée là où l'`eventId` ne peut rien.** Un
événement **périmé** (`etat: REJETÉE`, `occurredAt: 2020`) republié avec un
`eventId` **neuf** — donc invisible à la table d'idempotence — a bien été livré
et **n'a pas écrasé** l'état : `VALIDÉE` intact, log
`balance.etat.change … périmé — ignoré`. Puis, séparément, **idempotence par
`eventId`** : le même `payload.eventId` rejoué ne crée aucune ligne ni aucun
marqueur supplémentaire (2 lignes / 5 marqueurs, inchangés).

**⚡ Résilience amont.** `balance-service` **et** `bilan-service` arrêtés
(`HTTP 000` sur leur `/health`) : le portefeuille répond en **190 ms**, avec les
deux états **datés** (`depuis: 2026-08-19T22:18:04Z` / `22:22:00Z`). C'est la
raison d'être des read-models locaux.

**Recherche, sur vraie base.** `kossi`, `KOSSI`, `1000 745 307` (NIF espacé),
`TG-LOM-2019` (RCCM) trouvent tous « Ets Kossi Distribution » ; `épargne` trouve
« Mutuelle d'Épargne Bè ». `.*`, `(a+)+$` et `^ets` rendent **0** — le motif est
échappé, l'injection et le ReDoS sont fermés.

**Portée et filtres**, admin *vs* collaborateur réels (JWT RS256, `TENANT_USER`
responsable d'un dossier et contributeur d'un autre) : admin 5 dossiers
(5/3/1), collaborateur 2 (2/0/1) — **les compteurs sont exactement ce que
chacun voit**. `q=menuiserie` et `q=cabinet` : 1 pour l'admin, **0** pour le
collaborateur — `q` ne révèle rien hors portée, « Mon cabinet » compris (D11).
`affectation=moi` : admin 5 → 3, collaborateur 2 → 2 (**sans effet, sans
erreur**).

**Archivage.** Dossier archivé : `total=0` en « actifs » **même cherché par son
nom exact**, `total=1` en « archivés ». Les compteurs suivent le filtre.

**Échéance minimale.** « Ets Kossi Distribution » (régime `REEL`, exercice 2026
ouvert) → `2026-10-31`, `source: PAQUET_MINIMAL` — le 3ᵉ acompte, le prochain
au 19/08. « Pharmacie du Golfe » (régime `SYNTHETIQUE`, TPU) → **champ absent**,
l'IS lui étant libératoire. Les 500 dossiers semés sans exercice → absent aussi.

### Anti-N+1 et NFR — mesurés sur **505 dossiers**

**Nombre de requêtes Mongo par page, relevé au profileur (`profilingLevel: 2`) :**

| taille de page | opérations Mongo |
|:--:|:--:|
| 1 | **1** |
| 25 | **1** |
| 100 | **1** |

*(La seule autre opération vue au profileur est le sondage 2 s du relais d'outbox,
étranger à la requête.)*

**⚡ Un défaut de performance trouvé par cette mesure, et corrigé.** La première
implémentation joignait les quatre sources par `$lookup` **à sous-pipeline
corrélé** — forme correcte, mais qui s'exécute **une fois par document
d'entrée** : 505 dossiers × 4 = 2 020 exécutions. Mesuré en base réelle sur le
même jeu : `$match`+`$sort`+`$facet` seuls = **10 ms** ; + 4 sous-pipelines =
**302 ms** ; + 4 jointures `localField`/`foreignField` = **139 ms**. Le NFR de la
story (**changement de filtre < 500 ms**) **tombait** avec la première forme —
médianes relevées : `tri=activite` 491 ms, `affectation=moi` **922 ms**. Réécrit
en jointures indexées + `$filter`/`$sortArray` dans le document.

| requête (médiane sur 5, 505 dossiers) | avant | après |
|---|--:|--:|
| 1re page (défaut) | 682 ms | **165 ms** |
| `tri=activite` | 491 ms | **289 ms** |
| `tri=etat` | 887 ms | **248 ms** |
| `q=boulangerie` | 157 ms | **38 ms** |
| `affectation=moi` | 922 ms | **187 ms** |
| `page=20&size=25` | 391 ms | **205 ms** |
| `size=100` | 685 ms | **244 ms** |
| `statut=archives` | 9 ms | **12 ms** |

**NFR tenu** : 1re page **165 ms** (seuil 2 s) ; changement de filtre **12 à
289 ms** de médiane, **482 ms au pire** (seuil 500 ms). Plancher de la chaîne
HTTP mesuré à 17 ms (`/health`), lecture unitaire `GET /dossiers/:id` à 12 ms.

⚠️ **La limite à connaître** : la jointure ramène **toutes** les lignes liées du
dossier, et c'est `$filter` qui choisit ensuite. Les volumes le permettent (un
dossier porte quelques exercices, quelques décisions d'axes, et **au plus une**
ligne d'état par exercice — index unique). Un dossier qui les ferait exploser
exigerait de revenir à une jointure bornée : c'est écrit dans le pipeline, pas
laissé à découvrir.

**Le plan est bien celui qu'on croit** : `explain("executionStats")` montre un
`IXSCAN` sur `{orgId, statut, raisonSociale, _id}`, **505 clés pour 505
documents**, et **aucune étape `SORT`** — l'index porte l'ordre, il n'est pas
décoratif.
