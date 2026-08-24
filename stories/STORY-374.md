# STORY-374 : le dossier fait foi *aussi* sur le chemin d'écriture — les gardes d'exercice lisent le read-model

Status: review

**Epic :** EPIC-043 — Le dossier client devient l'unité de travail du cabinet
**Points :** 5 · **Complexité :** medium · **Sprint :** 20 (backend) · **Services :** `balance-service`
(`:3007`) + `bilan-service` (`:3004`)
**Origine :** écart relevé à la livraison de **FE-066** (2026-08-20) — la story frontend a voulu
prouver « l'Atelier refuse d'écrire sur l'exercice clos » et a découvert qu'**aucun code ne le fait**
**Backend d'appui :** **STORY-355** *(l'exercice appartient au dossier — producteur d'événements)*
**Décisions PO :** 2026-08-20 — *exercice inconnu ⇒ permissif* · *`POST /dossiers/:id/balances`
rejoint les gardes*

---

## Le constat

**Q6 est tranché, projeté, et appliqué nulle part.**

STORY-355 a fait du dossier la source de vérité du cycle de vie de l'exercice, et les deux services
avals ont bien reçu leur projection : `ExerciceProjectionService` consomme
`dossier.exercice.ouvert|clos|rouvert` et écrit la collection `exercices_dossier`, dans
`balance-service` **comme** dans `bilan-service`.

⛔ **Personne ne la lit.** Mesuré le 2026-08-20 :

```
balance-service : grep -rn "ExerciceDossier" src --include="*.ts" | grep -v read-models/  →  0
bilan-service   : idem                                                                    →  0
```

Les gardes existent pourtant. Elles lisent simplement **l'autre modèle** :

| Service | Garde | Source réellement lue |
| --- | --- | --- |
| `balance-service` | `exercices.estClos()` × 6 appels *(voir table ci-dessous)* | `exercices_atelier` — le modèle **hérité** |
| `bilan-service` | `jeu-etats.service.ts:342` (`statut === CLOS`) | `bilan/exercice/` — son **propre** modèle |

⚡ **`exercices_atelier` est exactement le modèle que Q6 devait détrôner** : son `statut` ne bouge
qu'en **effet de bord** de la reprise d'à-nouveaux — aucune route ne permet de l'y clore. C'est la
contradiction que STORY-355 existe pour fermer, et elle est restée active sur tout le chemin
d'écriture.

Le docstring de `exercice-dossier.schema.ts` porte la promesse non tenue, mot pour mot :

> *« ⚠️ HOOK INERTE À CE STADE, ET C'EST DÉLIBÉRÉ : rien dans `balance-service` ne lit encore cette
> collection. […] **STORY-236** rebranche la logique de saisie dessus. »*

**STORY-236 est `Done`** — son AC-8 rebranche `dossiers_dossier` *(l'existence et la portée du
dossier)*, **pas** `exercices_dossier`. Aucune story ne porte ce travail. Cette story le porte.

---

## Ce que ça produit aujourd'hui, en base

**① Clore un exercice dans `dossier-service` ne verrouille rien.** Les six familles gardées —
cahiers *(agrégation, dépenses, recettes)*, rapprochement, trésorerie, contexte fiscal — continuent
d'accepter les écritures.

**② Et c'est pire qu'un verrou en retard.** `estClos` rend `false` quand l'exercice est introuvable,
sur une prémisse écrite dans son propre commentaire :

> *« `false` s'il n'existe pas (jamais ouvert ⇒ jamais verrouillé) »*

Or **un dossier dont les exercices sont ouverts par FE-066 n'a aucune ligne dans
`exercices_atelier`** — il n'y a plus de chemin qui l'y écrive. Pour tout dossier piloté par l'écran
livré hier, les six gardes sont donc **ouvertes en permanence**, et elles le seront de plus en plus à
mesure que le portefeuille se remplit.

**③ Trois endroits peuvent clore un exercice, un seul émet un événement.** `bilan-service` expose
toujours un CRUD d'exercice **entièrement inscriptible** — et sans le moindre marqueur de
dépréciation :

```
bilan-service/src/modules/bilan/exercice/exercice.controller.ts
  76: @Post()              creer
 127: @Post(':id/clore')   clore
 143: @Post(':id/rouvrir') rouvrir
```

Clore par cette porte laisse `dossier-service` — l'autorité — dans l'ignorance. La question
« l'exercice 2023 est-il clos ? » a donc toujours **trois réponses possibles**, ce qui est *une de
plus* qu'avant STORY-355.

---

## User Story

En tant que **comptable de cabinet**,
je veux **qu'un exercice que j'ai clos refuse réellement les écritures dans l'Atelier et le Bilan**,
afin que **la clôture soit un acte opposable, et pas seulement un mot affiché sur un écran**.

---

## Décisions PO du 2026-08-20 *(elles bornent le périmètre — les relire avant d'élargir)*

**D-374-1 — Exercice inconnu du read-model ⇒ `false` (permissif).** La garde ne mord que sur un
exercice **connu ET clos**.

⚡ **Ce n'est pas de la prudence, c'est une contrainte de contrat.** Les écritures d'Atelier portent
des **bornes libres dans le corps** — la saisie directe propose l'année civile *modifiable*, jamais
un `exerciceId`. « Exercice inconnu » est donc un état **fréquent et normal** aujourd'hui, pas un cas
limite : répondre `true` refuserait la quasi-totalité de l'existant, et transformerait tout retard de
propagation en refus d'écrire.

⇒ L'effet net est **strictement additif** : le verrou apparaît là où il manquait *(dossiers pilotés
par FE-066)*, et rien ne change ailleurs.

⛔ **Hors périmètre, et c'est une décision, pas un oubli** : exiger que l'exercice **existe** sur le
dossier avant toute écriture (`EXERCICE_NON_OUVERT`). C'est la règle que Q6 implique vraiment, mais
c'est un **changement de contrat sur des routes livrées** doublé d'une migration — il lui faut sa
propre story et son propre arbitrage.

**D-374-2 — `POST /dossiers/:dossierId/balances` rejoint les gardes.** Saisie directe **et** import
Sage. C'est la seule écriture d'Atelier dotée d'un écran, et soumettre une balance sur un exercice
clos est précisément ce qu'il faut refuser. Combiné à D-374-1, l'ajout ne mord que sur un exercice
connu et clos : aucune régression sur l'existant.

---

## Ce que la story livre

### `balance-service`

- **`ExercicesRepository.estClos()` bascule sur `exercices_dossier`** — la clé de jointure existe déjà
  et n'a pas à être inventée : le read-model porte les bornes, `dossier-service` les **ramène à
  minuit UTC** avant de les écrire, et son index unique `(orgId, dossierId, bornes.debut, bornes.fin)`
  garantit qu'un couple de bornes désigne au plus un exercice.
- Les **6 appels existants ne changent pas d'une ligne** — c'est le point de la story : la garde est
  déjà au bon endroit, elle interroge la mauvaise collection.

  | Fichier | Ligne |
  | --- | --- |
  | `modules/cahiers/agregation/agregation.service.ts` | 114 |
  | `modules/cahiers/cahiers-depenses.service.ts` | 1086 |
  | `modules/cahiers/cahiers-recettes.service.ts` | 790 |
  | `modules/fiscal/contexte-fiscal.service.ts` | 162 |
  | `modules/rapprochement/rapprochement.service.ts` | 1165 |
  | `modules/tresorerie/releves.service.ts` | 130 |

- **7ᵉ garde : `BalanceService.submit()`** (`balance.service.ts:145`) — `409 EXERCICE_CLOS`, **avant**
  le calcul du checksum et avant toute écriture. ⚠️ Le refus doit précéder l'**idempotence** : une
  soumission rejouée sur un exercice clos ne doit pas rendre `200 déjà présente`, sinon la garde est
  contournable par répétition.
- **`exercices_atelier` cesse d'être une autorité** et reste ce qu'il est réellement — le support du
  **socle d'à-nouveaux** (`balanceANouveauxId`, `exerciceSource`). Sa lecture de statut est retirée ;
  son écriture par la reprise ne change pas.

### `bilan-service`

- **`jeu-etats.service.ts:342` bascule sur `exercices_dossier`**, même règle permissive.
- **Le CRUD d'exercice cesse d'écrire** : `POST /bilan/exercices`, `POST :id/clore` et
  `POST :id/rouvrir` rendent **`409 EXERCICE_NON_INSCRIPTIBLE_ICI`**, en nommant la route qui fait
  foi (`POST /dossiers/{dossierId}/exercices…` de `dossier-service`). Les `GET` restent.

  ⚡ **Rendre un refus NOMMÉ plutôt que supprimer les routes**, et rendre `409` plutôt que `404` :
  un `404` se lit « mauvaise URL » et fait chercher une faute de frappe ; un `410 Gone` dit « ça
  n'existe plus » sans dire où aller. Le `409` avec le chemin de remplacement dans le message est le
  seul qui envoie au bon endroit.

  ⚠️ **Aucun consommateur à casser, vérifié** : le front n'a **ni `NEXT_PUBLIC_BILAN_URL` ni types
  générés** pour `bilan-service`, et FE-029 — la seule story qui visait ce CRUD — est **superseded**
  depuis le 2026-08-14.

---

## Acceptance Criteria

- [ ] **AC-1** — Un exercice **clos dans `dossier-service`** fait rendre `409 EXERCICE_CLOS` aux **7**
      écritures de `balance-service` *(6 existantes + `submit`)*, sur un dossier dont
      `exercices_atelier` est **vide**. *(C'est le cas nominal depuis FE-066, et celui qui ne
      marchait pas.)*
- [ ] **AC-2** — Le même exercice **rouvert** fait repasser les 7 écritures à leur comportement
      normal, sans redémarrage ni purge de cache.
- [ ] **AC-3 (D-374-1)** — Une écriture sur des **bornes inconnues** du read-model est **acceptée**.
      *(Mutation-test : si `estClos` rend `true` par défaut, un test rougit — c'est la garde de la
      décision PO, pas un test de confort.)*
- [ ] **AC-4** — `exercices_atelier` **n'est plus lu pour un statut** nulle part :
      `grep -rn "statut.*CLOS" modules/balance/reprise/` ne rend plus de lecture d'autorité. Un
      exercice `CLOS` dans `exercices_atelier` mais `OUVERT` dans `exercices_dossier` est **écrivable**
      — c'est la preuve par l'inverse que la source a changé.
- [ ] **AC-5** — `submit` refuse **avant** l'idempotence : deux `POST` identiques sur un exercice clos
      rendent **deux `409`**, jamais un `409` puis un `200 déjà présente`.
- [ ] **AC-6** — `bilan-service` : `jeu-etats` refuse la validation sur un exercice clos **du
      dossier**, et le CRUD d'exercice rend `409 EXERCICE_NON_INSCRIPTIBLE_ICI` sur ses 3 écritures.
      Les `GET` répondent toujours.
- [ ] **AC-7** — **Vérification docker, bout en bout, sur les deux services** : ouvrir un exercice via
      `dossier-service`, écrire *(cahier + balance)*, **clore**, constater les `409`, **rouvrir**,
      constater le retour à la normale. ⚠️ **Attendre une CONDITION, jamais un délai** *(leçon
      STORY-303/355)* : la projection est asynchrone, un `sleep` fabrique un test qui passe sur cette
      machine et rougit en CI.

---

## Notes techniques

⚠️ **La propagation reste asynchrone, et cette story ne la rend pas synchrone.** Entre la clôture et
le refus, il s'écoule le temps d'un aller-retour Kafka. C'est acceptable **parce que la fenêtre
s'ouvre dans le sens permissif** (on accepte encore quelques écritures), jamais dans le sens qui
bloquerait un travail légitime. L'inverse — refuser pendant la propagation — aurait été le mauvais
compromis.

⚠️ **L'ordre intra-partition est déjà garanti** : le producteur partitionne par `dossierId`, donc
`clos(2024)` ne peut pas doubler `ouvert(2024)`. Aucune garde de version à ajouter — et le docstring
de `ExerciceProjectionService` explique pourquoi en ajouter une **créerait** un piège (`$lt` sur un
`upsert` ⇒ `E11000` sur un message normal).

⚠️ **Ne pas « profiter » de cette story pour supprimer `exercices_atelier`.** Elle porte le socle
d'à-nouveaux (`balanceANouveauxId`, `exerciceSource`) que rien d'autre ne détient : la reprise
(STORY-087) s'y appuie. On lui retire son rôle d'**autorité de statut**, pas son existence.

⚡ **Ce que cette story débloque côté frontend** : la moitié de l'AC-8 de FE-066 déclarée injouable —
« l'Atelier refuse d'écrire sur l'exercice clos ». Grâce à D-374-2 elle devient jouable **depuis la
saisie directe**, donc **dans FE-066 même**, sans attendre FE-047.

---

## Dépendances

**Prérequises :** **STORY-355** *(producteur `dossier.exercice.*` — `done`)* · **STORY-356**
*(migration `dossierId` — `done`)* · **STORY-236** *(re-scopage `balance-service` — `done`)* ·
**STORY-357** *(re-scopage `bilan-service` — `done`)*.
**Débloque :** **FE-066** *(AC-8, moitié « refus d'écriture »)* · **FE-047** *(reprise d'à-nouveaux)*.

---

## Definition of Done

- [ ] Lint 0 · build OK · couverture ≥ seuils, **sur les deux services**.
- [ ] Tests unitaires : les 3 branches de `estClos` *(connu-clos / connu-ouvert / inconnu)*, le refus
      de `submit` avant idempotence, les 3 refus du CRUD `bilan`.
- [ ] e2e : AC-1 → AC-6.
- [ ] **Vérification docker** (AC-7) — la seule qui prouve la projection ; les e2e mockent la couche
      données et ne disent **rien** de la convergence.
- [ ] `/code-review` + `/security-review` *(un verrou d'écriture est une frontière)*.
- [ ] Note portée à **FE-066** : la case « refus d'écriture sur exercice clos » redevient jouable.

---

## Story Points Breakdown

- `estClos` sur `exercices_dossier` + jointure par bornes + les 3 branches : 1,5 pt
- 7ᵉ garde sur `submit`, **avant** l'idempotence : 1 pt
- `bilan-service` : garde `jeu-etats` + neutralisation des 3 écritures du CRUD : 1,5 pt
- Vérification docker bout en bout sur deux services, par condition : 1 pt


---

## Progress Tracking

### ⓪ Ce que le code disait déjà — **une prémisse de la story était périmée**

⚡ **`balance-service` lisait DÉJÀ `exercices_dossier`.** La mesure du 2026-08-20 (`grep
"ExerciceDossier" | grep -v read-models/ → 0`) datait d'**avant STORY-367**, livrée le 2026-08-18 :
`ExercicesRepository.estClos` interroge le read-model **en premier** depuis `AD-P14` / **D-367-1**, et
ne retombe sur `exercices_atelier` que si le read-model est **muet** sur ces bornes. La moitié
« bascule d'`estClos` » du périmètre était donc **déjà faite**, et les 6 gardes déjà correctes.

⛔ **AC-4 est amendé, et c'est une décision, pas un oubli.** Il exige que `exercices_atelier` ne soit
« plus lu pour un statut nulle part ». Retirer ce repli **casserait D-367-1** : `RepriseService` clôt
N-1 dans `exercices_atelier` **sans rien publier** (STORY-087, D-087-5), et cette clôture est ce qui
protège N-1 après que ses à-nouveaux ont été tirés. Le repli est conservé **avec son arbitrage à la
date de transition** — le plus récent gagne. La **preuve par l'inverse** qu'AC-4 demande est rendue et
vérifiée en docker (⑦ ci-dessous) : atelier `CLOS` + dossier `OUVERT` **postérieur** ⇒ **écrivable**.
Côté `bilan-service`, où il n'y a **aucun second écrivain** une fois le CRUD neutralisé, le read-model
tranche **seul** dès qu'il connaît le libellé — AC-4 y est appliqué à la lettre.

### ① `balance-service` — la 7ᵉ garde (D-374-2)

| Livré | Détail |
|---|---|
| `BalanceService.submit` refuse `409 EXERCICE_CLOS` | **avant l'idempotence**, avant le référentiel, avant toute transaction |
| Portée réelle | `submit` est le point de passage de **5 appelants** : contrôleur (saisie directe), import Sage, reprise d'à-nouveaux, agrégation de cahiers, provisions fiscales |
| ⚠️ **PAS** sur `submitInSession` | c'est le chemin de l'**ingestion Kafka** : une `ConflictException` levée dans la transaction n'est codifiée par aucun `catch` de l'ingestion (elle ne traduit que 400/422 et **relance** le reste) ⇒ offset jamais commité, **partition rejouée indéfiniment**. Le verrou de la voie événementielle est un autre sujet, avec son propre chemin de rejet |
| `ExercicesModule` | `ExercicesRepository` + ses 2 schémas en sortent de `RepriseModule`, **qui importe `BalanceModule`** : l'injecter tel quel fermait un cycle, et réenregistrer les modèles dans `BalanceModule` aurait **dupliqué l'arbitrage à deux écrivains** — le seul endroit qui sait trancher. `RepriseModule` le ré-exporte : les 5 modules qui l'importaient ne changent pas |

### ② `bilan-service` — le statut se lit chez son propriétaire, le CRUD cesse d'écrire

| Livré | Détail |
|---|---|
| `refuserSiExerciceClos` | lit `exercices_dossier` sur `(orgId, dossierId, libelle)` **du document**, pas du contexte de requête |
| Le read-model connaît le libellé | il tranche **seul**, y compris pour dire « ouvert » (AC-4) |
| Il l'ignore | **repli** sur `exercices` local (l'existant de la migration STORY-356), puis permissif (D-374-1) |
| `POST` / `:id/clore` / `:id/rouvrir` | **`409 EXERCICE_NON_INSCRIPTIBLE_ICI`**, message nommant `POST /api/v1/dossiers/{dossierId}/exercices` |
| Les `GET` | intacts — l'existant reste consultable |
| Retiré au passage | `transitionner`, le corps de `creer`, l'`AuditService` du contrôleur : il n'y a plus d'acte d'exercice à journaliser ici, `dossier-service` le trace avec l'événement qui va avec |

### ③ Portes de qualité — **les deux services**

| | `balance-service` | `bilan-service` |
|---|---|---|
| Lint (`--max-warnings 0`) | ✅ 0 | ✅ 0 |
| Build | ✅ | ✅ |
| Unitaires | ✅ **2941** / 171 suites | ✅ **1030** / 104 suites |
| e2e | ✅ **668** / 25 suites | ✅ **270** / 21 suites |
| Couverture | **98,97 / 91,81 / 98,16 / 99,06** | **98,67 / 93,41 / 98,32 / 98,62** |

### ④ Mutation-test — ce qui prouve que les tests filtrent

| Mutation appliquée | Résultat attendu | Mesuré |
|---|---|---|
| Garde `submit` **déplacée après** le `findByKey` d'idempotence | AC-5 rougit | ✅ **1 rouge** — « refuse une RE-soumission… » |
| Garde `submit` neutralisée (`false &&`) | plusieurs rouges | ✅ **4 rouges** |
| `bilan` : repli local **reprend la main** (`\|\|` au lieu de la priorité au read-model) | AC-4 rougit | ✅ **1 rouge** — « CLOS en local mais OUVERT dans le dossier » |
| `bilan` : garde `if (clos)` neutralisée | plusieurs rouges | ✅ **3 rouges** |

### ⑤ Vérification docker — **stack neuve (`down -v`), bout en bout, sur les deux services** (AC-7)

`auth-service` + `dossier-service` + `balance-service` + `bilan-service` + `kyc` + `catalog`, Mongo
`rs0`, Kafka up. Org réelle créée par `register`, jeton RS256 réel, KYC `APPROVED` + entitlements
`ACTIVE` posés dans les read-models. Dossier « Cabinet 374 » (`…6f10`) créé par la projection
`dossier.created`. **Attente par CONDITION** (`until` sur le statut projeté), jamais un `sleep` —
leçon STORY-303/355.

⚡ **`exercices_atelier` est resté VIDE** et **`exercices` (local bilan) est resté VIDE** pendant tout
le parcours : les refus ne peuvent venir **que** du read-model. C'est la preuve que la source a changé.

**Exercice « 2026 » ouvert via `POST /dossiers/:id/exercices` → projeté (`v1`, `OUVERT`) dans les deux
services**, puis :

| Étape | `balance-service` | `bilan-service` |
|---|---|---|
| Exercice **OUVERT** | dépense `201` · balance v1 `201` | jeu d'états `201` |
| Exercice **CLOS** (projeté `v2`) | dépense **`409 EXERCICE_CLOS`** · balance v2 **`409`** | validation **`409 EXERCICE_CLOS`** |
| **AC-5** — balance v1 **re-soumise** (déjà en base) | **`409`**, jamais `200 déjà présente` | — |
| **AC-5** — 2ᵉ re-soumission identique | **`409`** — la garde n'est pas contournable par répétition | — |
| Documents écrits pendant la clôture | **0** (1 balance, 1 dépense, celles d'avant) | **0 snapshot** |
| Exercice **ROUVERT** (projeté) | dépense `201` · balance v2 `201` · balance v1 re-soumise **`200`** (idempotence rétablie) | validation **`200`** |

**AC-3 / D-374-1 — bornes inconnues ⇒ permissif** : balance sur l'exercice **2025**, absent du
read-model (`countDocuments → 0`) ⇒ **`201`**. L'effet de la story est bien **strictement additif**.

**AC-4 — la preuve par l'inverse, et l'arbitrage D-367-1 dans les deux sens** :

| `exercices_atelier` | `exercices_dossier` | Écriture |
|---|---|---|
| `CLOS`, `closLe` **antérieur** à la réouverture | `OUVERT` (`occurredAt` postérieur) | ⚡ **`201`** — le dossier a le dernier mot |
| `CLOS`, `closLe` **postérieur** | `OUVERT` | **`409`** — la clôture de reprise (D-367-1) tient |

**AC-6 — le CRUD d'exercice de `bilan-service`, en réel** :

| Route | Code | Corps |
|---|---|---|
| `POST /dossiers/:id/bilan/exercices` | **409** | `EXERCICE_NON_INSCRIPTIBLE_ICI` + `POST /api/v1/dossiers/{dossierId}/exercices` |
| `POST :id/clore` | **409** | idem |
| `POST :id/rouvrir` | **409** | idem |
| `GET /dossiers/:id/bilan/exercices` | **200** | `[]` — la lecture vit |

Stack arrêtée (`docker compose stop`) après consignation.
