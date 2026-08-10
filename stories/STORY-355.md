# STORY-355 : L'exercice appartient au dossier — un seul ouvert, un cycle de vie qui fait foi

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **J** · questions **Q6**, **Q7**, **Q8** *(tranchées)* · **STORY-066** *(le cycle de vie livré côté Bilan)* · **STORY-087** *(`ExerciceAtelier`)*
**Priorité :** Must Have
**Story Points :** 8
**Statut :** 📋 À faire
**Complexité :** high
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service` *(+ read-model dans `balance-service` et `bilan-service`)*

---

## Le constat

Il existe **deux modèles d'exercice**, livrés, qui ne racontent pas la même chose :

| | `ExerciceAtelier` (`balance-service`, STORY-087) | `Exercice` (`bilan-service`, STORY-066 ✅) |
|---|---|---|
| Statuts | `OUVERT` \| `CLOS` — **`CLOS` est terminal** | ouvert / clos **+ `POST :id/rouvrir`** |
| Clôture | **effet de bord** de la reprise d'à-nouveaux, aucune route dédiée | route explicite |
| Lecture | ⚡ **aucune** — le contrôleur n'expose que `POST :exercice/ouvrir` | `GET` liste + `GET :id` |

« L'exercice 2023 est-il clos ? » a donc **deux réponses** selon le service interrogé. Rouvrir une
liasse côté Bilan laisserait la balance verrouillée côté Atelier — panne silencieuse, découverte au
pire moment.

**Q6 tranche : le dossier porte le cycle de vie de l'exercice.** Les deux modèles existants deviennent
des **projections**. **Q8 tranche : un seul exercice ouvert à la fois** — il faut clore pour ouvrir.
**Q7 tranche : les exercices antérieurs à l'entrée en portefeuille sont listables**, en consultation,
avec leur contenu.

---

## User Story

En tant que **collaborateur de cabinet**,
je veux **voir tous les exercices d'un dossier et savoir lequel est ouvert**,
afin de **travailler sur le bon, et de consulter les anciens sans risquer de les modifier**.

---

## Ce que la story livre

- **`Exercice` porté par le dossier** : `dossierId`, `libelle`, `bornes { debut, fin }`,
  `statut ∈ OUVERT | CLOS`, `origine ∈ ATELIER | MIGRATION`, `ouvertPar/Le`, `closPar/Le`.
  Les bornes restent **libres** — un premier exercice de 9,5 mois est normal (société créée en cours
  d'année) : `ExerciceAtelier.bornes` le permettait déjà, on ne régresse pas.
- **`GET /dossiers/:id/exercices`** — la lecture qui **n'existe nulle part aujourd'hui**. Rend chaque
  exercice avec ses bornes, son statut, son origine et ses horodatages d'ouverture/clôture.
- **`POST /dossiers/:id/exercices`** — ouverture. ⚡ **`409 EXERCICE_DEJA_OUVERT` si un exercice
  `OUVERT` existe déjà** (Q8). L'invariant est porté par un **index unique partiel**, pas par un
  pré-contrôle : deux ouvertures concurrentes ne doivent pas passer toutes les deux.
- **`POST /dossiers/:id/exercices/:exId/clore`** — clôture **explicite**, avec auteur et horodatage.
  Elle cesse d'être un effet de bord de la reprise d'à-nouveaux.
- **`POST /dossiers/:id/exercices/:exId/rouvrir`** — réservé à `TENANT_ADMIN`, motif obligatoire,
  journalisé. C'est la route qui **réconcilie** les deux modèles : rouvrir devient un acte unique,
  visible des deux côtés.
- **Q7 — exercices repris** : un exercice `origine: MIGRATION` peut être ajouté **rétroactivement**
  (antérieur à l'entrée en portefeuille), en consultation seule, sans liasse Prospera. Il est listé
  comme les autres et alimente les comparatifs N-1.
- **Événements `dossier.exercice.ouvert` / `.clos` / `.rouvert`** (outbox transactionnelle) :
  `balance-service` et `bilan-service` en tiennent chacun un **read-model** et cessent d'être la
  source de vérité sur le statut.

## Hors périmètre

- La **reprise des à-nouveaux** elle-même (calcul, affectation du résultat) → reste dans
  `balance-service` (STORY-087/088), qui **consomme** désormais le statut au lieu de le produire.
- Le **contenu** de l'exercice (balance, liasse, déclarations) → STORY-236, 357, et le module Fiscalité.
- La **ligne consolidée** de la maquette (balance validée + liasse figée + impôt dû par exercice) →
  **STORY-359**, qui agrège les read-models.

---

## Acceptance Criteria

- [ ] `GET /dossiers/:id/exercices` rend la liste, du plus récent au plus ancien, avec bornes, statut,
      origine, `ouvertPar/Le` et `closPar/Le`. Dossier d'une autre organisation → **404**.
- [ ] **Q8** : ouvrir un exercice alors qu'un autre est `OUVERT` → **409 `EXERCICE_DEJA_OUVERT`**,
      corps nommant l'exercice ouvert. Clore puis ouvrir → **201**.
- [ ] L'invariant « un seul ouvert » tient sous **concurrence** : deux `POST` simultanés rendent un
      **201** et un **409** — vérifié par un test, l'unicité venant de l'**index**.
- [ ] La clôture est une **route explicite** : après `POST .../clore`, `closPar` et `closLe` sont
      peuplés, et aucune reprise d'à-nouveaux n'a été nécessaire pour l'obtenir.
- [ ] `POST .../rouvrir` — `TENANT_ADMIN` → **200** avec motif obligatoire (`400` sans motif) ;
      `TENANT_USER` → **403**. Une entrée de journal porte l'acte, son auteur et son motif.
- [ ] **Q7** : un exercice `origine: MIGRATION` daté avant l'entrée en portefeuille est créable,
      listable, et **refuse toute écriture comptable** (`409`) — il est là pour être lu.
- [ ] Un exercice à **bornes irrégulières** (9,5 mois) est accepté ; la durée calculée est exposée.
- [ ] Les événements `dossier.exercice.*` sont émis **dans la transaction** (outbox), avec
      `partitionKey = dossierId` — deux exercices d'un même dossier ne peuvent pas être traités dans
      le désordre par un consommateur.
- [ ] Ouvrir ou clore un exercice sur un dossier **archivé** → **409 `DOSSIER_ARCHIVE`** (STORY-353).

---

## Notes techniques

```ts
ExerciceSchema.index({ orgId: 1, dossierId: 1, 'bornes.debut': 1, 'bornes.fin': 1 }, { unique: true });
// Q8 — au plus UN exercice ouvert par dossier : c'est l'index qui l'impose.
ExerciceSchema.index(
  { dossierId: 1 },
  { unique: true, partialFilterExpression: { statut: 'OUVERT' } },
);
```

- **Migration des deux modèles existants** : `ExerciceAtelier` et `Exercice` (bilan) deviennent des
  read-models alimentés par les événements. Leur schéma n'est **pas** supprimé par cette story —
  STORY-356 (migration) les remplit, STORY-357 et STORY-236 les rebranchent. Supprimer d'abord
  laisserait les deux services aveugles entre deux stories.
- ⚠️ **Le sens de `CLOS` diverge entre les deux services** : terminal côté Atelier, réouvrable côté
  Bilan. La story tranche pour **réouvrable, sous autorisation admin et motif** — le comportement le
  plus permissif des deux, encadré. Le verrouillage de saisie de l'Atelier devient une conséquence du
  statut lu, pas une règle locale.
- Le `libelle` (« 2024 ») est **dérivé des bornes** et non saisi : deux exercices nommés « 2024 » avec
  des bornes différentes rendraient la comparaison N/N-1 ininterprétable.

---

## Dépendances

**Prérequises :** **STORY-301** *(dossier)* · **STORY-353** *(portée, archivage)*.
**Réancre :** **STORY-066** ✅ *(cycle de vie livré côté Bilan)* · **STORY-087** ✅ *(`ExerciceAtelier`)*.
**Débloque :** **STORY-236** *(la balance se scope sur dossier + exercice)* · **STORY-357**
*(bilan-service)* · **STORY-359** *(ligne consolidée du portefeuille)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils.
- [ ] e2e : lecture, un seul ouvert (dont concurrence), clôture explicite, réouverture motivée et
      réservée, exercice repris en consultation, bornes irrégulières, refus sur dossier archivé.
- [ ] Vérification docker : les **deux index** sont en base ; les événements `dossier.exercice.*`
      sont dans l'outbox en `SENT` avec la bonne clé de partition ; le read-model de `balance-service`
      converge après consommation.
- [ ] `/code-review` + `/security-review`.

---

## Story Points Breakdown

- Modèle `Exercice` + les deux index (dont le partiel « un seul ouvert ») : 1,5 pt
- Routes lecture / ouverture / clôture / réouverture + gardes de rôle et de motif : 2 pts
- Exercices repris (Q7) : création rétroactive, lecture seule : 1 pt
- Événements + outbox transactionnelle + read-models amont : 2 pts
- Tests (concurrence, irrégularité, archivage) + vérification docker : 1,5 pt
- **Total : 8 points**
