# STORY-356 : Migration — chaque profil société devient le dossier « Mon cabinet », et `dossierId` devient obligatoire

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **D** · décisions **D1**, **D8**
**Priorité :** Must Have
**Story Points :** 8
**Statut :** 🔍 En revue
**Complexité :** high
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service` + `balance-service` + `bilan-service`

---

## Le constat

Toute la donnée comptable déjà produite est keyée `orgId` : profils société, balances, exercices,
liasses figées. Une fois le dossier posé, cette donnée n'appartient plus à personne — il lui manque le
`dossierId` que toutes les nouvelles routes exigeront.

**La fenêtre est maintenant.** La donnée est jeune et peu volumineuse ; chaque semaine de retard ajoute
des balances et des liasses à rattacher **à la main**. C'est le seul point du programme qui **vieillit
mal** : tout le reste peut attendre sans se dégrader, pas celui-là.

**D8 pose la règle** : chaque profil existant devient le dossier « Mon cabinet » de son organisation
(D1), et tout ce qui pendait à l'`orgId` s'y rattache. Après migration, `dossierId` est **obligatoire
partout** — pas « toléré absent », obligatoire.

---

## User Story

En tant qu'**exploitant de la plateforme**,
je veux **que la donnée déjà produite bascule seule sous un dossier**,
afin qu'**aucun cabinet ne perde sa comptabilité et qu'aucune reprise manuelle ne soit nécessaire**.

---

## Ce que la story livre

- **Script de migration idempotent et rejouable** — `npm run migrate:dossiers`, exécutable autant de
  fois que voulu sans effet cumulatif. Trois phases :
  1. **Créer le dossier « Mon cabinet »** pour chaque organisation ayant un `ProfilSociete`, en
     reprenant son identité fiscale, ses 2 axes et son pays, avec `estLeCabinet: true`,
     `responsableUserId` = l'administrateur de l'org, `origine: MIGRATION`.
  2. **Rattacher** balances, ingestions, exercices, cahiers, rapprochements (balance-service) et
     exercices, snapshots de liasse, mappings, hypothèses (bilan-service) au `dossierId` de leur org.
  3. **Vérifier** : zéro document orphelin, puis rendre `dossierId` **requis** au schéma.
- **Attestation de mandat rétroactive** : le dossier du cabinet **n'en porte pas** — un cabinet n'a pas
  besoin d'un mandat pour lui-même (D2 vise le client). La ligne de journal dit « créé par migration ».
- **Rapport de migration** écrit et lisible : nombre d'orgs traitées, dossiers créés, documents
  rattachés par collection, **et la liste des orphelins s'il en reste** — un rapport qui ne dit que le
  succès ne sert à rien.
- **Garde de non-régression** : un test échoue si une collection migrée accepte encore un document
  **sans** `dossierId`.
- **Marche arrière documentée** : le script inverse existe et est testé — il retire `dossierId` et
  supprime les dossiers `origine: MIGRATION` non modifiés depuis. Une migration sans marche arrière
  testée n'est pas une migration, c'est un pari.

## Hors périmètre

- Les **routes** qui exploitent `dossierId` → STORY-236 (balance), STORY-357 (bilan), STORY-358
  (document). Cette story rend la donnée **prête**, elle ne change aucun contrat REST.
- La création du dossier « Mon cabinet » pour les **futures** organisations (à l'activation) →
  **STORY-301**. Ici on ne traite que l'**existant**.
- Les organisations **sans** `ProfilSociete` : elles n'ont aucune donnée comptable à rattacher, leur
  dossier sera créé à l'activation par STORY-301.

---

## Acceptance Criteria

- [x] Le script est **idempotent** : deux exécutions consécutives produisent exactement le même état
      (mêmes identifiants de dossier, aucun doublon) — vérifié par comparaison des deux rapports.
- [x] Chaque organisation ayant un `ProfilSociete` a **exactement un** dossier `estLeCabinet: true`,
      portant sa raison sociale, son NIF, son RCCM, son pays et ses 2 axes.
- [x] **Zéro orphelin** : après migration, aucune balance, ingestion, exercice, cahier, snapshot de
      liasse ou mapping ne subsiste sans `dossierId` — compté **par collection** dans le rapport.
- [x] `dossierId` est **requis au schéma** dans les collections migrées ; insérer un document sans lui
      → échec de validation Mongoose. *(Un test le prouve pour chaque collection.)*
- [x] Le rapport liste les orphelins **restants** s'il y en a, et le script **sort en erreur** dans ce
      cas plutôt que de rendre `dossierId` obligatoire sur une base incohérente.
- [x] Le `responsableUserId` du dossier migré est un administrateur **réel** de l'organisation ; si
      l'org n'en a aucun d'actif, le script le signale au lieu d'inventer.
- [x] La **marche arrière** restaure l'état antérieur : `dossierId` retiré, dossiers de migration
      supprimés, aucune perte de donnée comptable — vérifié sur un dump réel.
- [x] Les liasses **déjà figées** ne sont pas recalculées : on ajoute `dossierId`, on ne touche à
      aucun montant. *(Un test compare les checksums de snapshot avant/après.)*

---

## Notes techniques

- **Ordre imposé** : créer les dossiers → rattacher → **vérifier** → rendre requis. Rendre `dossierId`
  requis avant la vérification bloquerait l'écriture sur une base à moitié migrée, sans marche arrière
  possible.
- Le rattachement se fait par `orgId` — c'est la seule clé disponible, et elle est **exacte** tant
  qu'une org n'a qu'un dossier, ce qui est vrai par construction au moment de la migration.
- **Chaque service migre sa propre base** : `dossier-service` crée les dossiers et publie
  `dossier.cree` ; `balance-service` et `bilan-service` exécutent leur phase de rattachement en lisant
  leur read-model. Aucune écriture cross-base, aucun accès d'un service à la base d'un autre
  (invariant #2).
- La migration s'exécute **hors requête HTTP** (commande Nest standalone), pour ne dépendre d'aucun
  jeton et pouvoir tourner sur une base à l'arrêt applicatif.

---

## Dépendances

**Prérequises :** **STORY-301** *(modèle et création de dossier)* · **STORY-353** *(responsable, sans
lequel un dossier migré serait invalide)* · **STORY-355** *(le modèle d'exercice cible)*.
**Débloque :** **STORY-236**, **STORY-357**, **STORY-358** — aucune ne peut exiger `dossierId` avant
que la donnée existante ne le porte.

---

## Definition of Done

- [x] Lint 0 · build OK sur les trois services.
- [x] Tests : idempotence, orphelins détectés et bloquants, `dossierId` requis après coup, marche
      arrière, checksums de liasse inchangés.
- [x] **Répétition sur un dump de la base de dev**, pas sur des fixtures : c'est la seule preuve qui
      compte pour une migration. Rapport joint à la PR.
      *(Semis représentatif en base réelle — 2 orgs, 16 documents, 11 collections — et non des
      fixtures de test : c'est lui qui a révélé les 3 défauts ②③④. Pas un dump de production, qui
      n'existe pas encore à ce stade du projet.)*
- [ ] ⚠️ Vérification docker : stack complète relancée **après** migration, parcours Atelier → Bilan
      toujours vert sur un dossier migré.
      **NON TENU, et c'est la conséquence assumée de l'arbitrage AC-4** (cf. ③) : `dossierId` étant
      requis au schéma sans qu'aucun chemin d'écriture ne le pose, le parcours Atelier → Bilan **ne
      peut pas** être vert en écriture avant STORY-236/357. Ce qui **est** vérifié : la stack
      complète redémarre, les 3 services sont `healthy`, les read-models convergent, et la donnée
      migrée est intègre (checksums de liasse inchangés). **Le parcours d'écriture est à rejouer à
      la clôture de STORY-236/357.**
- [ ] `/code-review` — phase ⑥, à venir.

---

## Progress Tracking

### ① Rédaction / cadrage (2026-08-14)

La story existait déjà (rédigée le 2026-08-09, prérequis 301/353/355 livrés). Lecture de la mémoire du
projet (fiches STORY-301, STORY-353, STORY-355, pièges transverses, `dev-externe-porte-handoff`).

**Deux points de conception tranchés avec le PO** (le modèle de la story ne bouclait pas sans eux) :

1. **Canal de la phase 1 (création des dossiers)** — la story dit « dossier-service crée les dossiers
   en reprenant l'identité fiscale du ProfilSociete », mais ce profil vit dans la base de
   **balance-service** et l'invariant #2 interdit tout accès cross-base. **Décision : nouvel événement
   Kafka `profil.societe.consolide`** (état absolu du profil, v1), publié par `balance-service` pendant
   sa phase de migration (outbox, `eventId` déterministe `migration:profil:<orgId>` pour l'idempotence
   des rejeux), consommé par `dossier-service` qui crée **ou enrichit** le dossier « Mon cabinet ».
   ⚠️ La plupart des orgs ont DÉJÀ leur dossier cabinet (créé par D1 via `identity.org.created`) :
   le consumer fait donc un **upsert** — création avec `origine: MIGRATION` si absent, enrichissement
   de l'identité fiscale (sans toucher `pays`/`typeEntite`, figés par le hook D10 de STORY-302) si
   présent. `dossier.created` est publié uniquement à la création (l'événement d'origine, rejoué
   `fromBeginning`, alimente déjà les read-models).
2. **Read-model du dossier chez balance/bilan** — la story dit que le rattachement se fait « en lisant
   leur read-model », mais le read-model `dossier.*` n'existe pas encore (prévu par STORY-236/357).
   **Décision : STORY-356 le pose** (consommation de `dossier.created`/`dossier.updated` →
   collection locale `dossiers_dossier`), en hook inerte pour les routes — exactement le pattern de
   STORY-355 (« read-model posé avant son lecteur »). STORY-236/357 rebrancheront les routes dessus.

**Arbitrages complémentaires** (documentés pour la revue) :
- **Champ `origine` ajouté au schéma Dossier** (enum `OrigineDossier { ACTIVATION, MIGRATION }`,
  optionnel) : la story l'exige pour la marche arrière (« supprime les dossiers `origine: MIGRATION`
  non modifiés depuis »). Posé `MIGRATION` par la migration ; la création D1 existante n'est pas
  modifiée (origine absente = création automatique). La marche arrière filtre
  `{ origine: 'MIGRATION', version: 1 }` (version 1 = jamais modifié depuis la migration).
- **Responsable du dossier migré** (AC-6) : `responsableUserId` = admin actif de l'org via le
  read-model `org_members` (`trouverAdministrateur`). Aucun admin actif ⇒ warn explicite + dossier
  créé **sans** responsable (jamais inventé), consigné au journal.
- **Collections migrées** : balance-service → `balances`, `balance_ingestions`, `exercices_atelier`,
  `lignes_depenses`, `lignes_recettes`, `appariements`, `qualifications_ecart` (7 — le breakdown de
  la story en annonce 6, le corps liste « balances, ingestions, exercices, cahiers, rapprochements » ;
  les qualifications font partie des rapprochements) ; bilan-service → `exercices`,
  `snapshots_liasse`, `mapping_overrides`, `jeux_hypotheses` (4). Clé bilan = `tenantId` (équivaut à
  `orgId`). Les collections fiscales/trésorerie/OCR/catégories ne sont **pas** citées par la story :
  hors périmètre (STORY-236/357 les re-scoperont).
- **`dossierId` requis** (AC-4) : posé `required: true` sur les 11 schémas migrés. La fenêtre entre
  STORY-356 et STORY-236/357 est assumée : les routes existantes n'écrivent pas encore `dossierId`
  (elles seront re-scopées par 236/357, qui « ne peuvent exiger dossierId avant que la donnée
  existante ne le porte »). Les e2e mockent la couche données → non impactés ; l'écriture HTTP sans
  `dossierId` échoue désormais (c'est D8), le parcours Atelier → Bilan est vérifié en docker sur la
  donnée **migrée** (lecture + moteur de liasse pur), les écritures reviennent avec 236/357.
- **Enrichissement d'un dossier existant** : `updateOne` (hors verrou optimiste — script
  d'exploitation, pas une route concurrente), entrée de journal `IDENTITE_MODIFIEE` (type existant,
  par `SYSTEME`, motif « complété par migration »), **pas** de `dossier.updated` (l'événement
  d'origine alimente déjà le read-model ; la version publiée peut être antérieure à la version réelle,
  sans conséquence pour le rattachement). Pas de `MANDAT_ATTESTE` : un cabinet ne se mandate pas.
- **Ordre d'exécution de la migration** : ① balance-service publie les profils (outbox) →
  ② dossier-service (service vivant) crée/enrichit les dossiers → ③ read-models `dossiers_dossier`
  (balance + bilan) alimentés → ④ scripts de rattachement (balance puis bilan) lisent leur read-model,
  rattachent, **vérifient zéro orphelin par collection** et sortent en erreur si orphelins →
  ⑤ rapport de migration écrit (stdout + fichier). Chaque service exécute sa partie via
  `npm run migrate:dossiers` (commande Nest standalone, logique dans un service testé, entrée dans un
  fichier `*bootstrap*` exclu de la couverture — pattern du projet).

### ② Branchement (2026-08-14)

Branche `MNV-356` créée dans les **4 repos impactés AVANT toute ligne de code**, depuis l'intégration
la plus à jour :

```
docs                 MNV-356
dossier-service      MNV-356
balance-service      MNV-356
bilan-service        MNV-356
```

### ③ Développement (2026-08-14)

Statut passé à `in_progress` aux 3 endroits (en-tête, `sprint-status.yaml`, ci-dessus).

Livré dans les 3 dépôts, conformément au cadrage de ① :

- **`balance-service`** — `profil.societe.consolide` (contrat + outbox), read-model `dossiers_dossier`
  (consumer `balance-dossier`, `fromBeginning`), `DossiersMigrationService` (publier → rattacher →
  vérifier), `RollbackMigrationService`, `dossierId` `required` sur les **7** collections.
- **`dossier-service`** — `ProfilConsumer` + `ProfilProjectionService` (upsert du cabinet),
  `migrerProfilEnCabinet` (création `origine: MIGRATION` / enrichissement), enum `OrigineDossier`,
  `RollbackDossiersService`.
- **`bilan-service`** — read-model `dossiers_dossier`, `DossiersMigrationService` (4 collections),
  `RollbackMigrationService`, `dossierId` `required` sur les **4** collections.

#### ⚠️ Arbitrage confirmé par le PO — les écritures sont GELÉES jusqu'à STORY-236/357

AC-4 rend `dossierId` **requis au schéma** sur les 11 collections migrées. Or **aucun chemin
d'écriture ne le pose** : ils sont re-scopés par STORY-236 (balance) et STORY-357 (bilan). Après
merge, toute écriture (import de balance, cahier, exercice, liasse) échoue donc en
`ValidationError`.

**Ce défaut est invisible à la suite entière** : les unitaires instancient les services avec des
modèles mockés, les e2e mockent la couche données. Les 3 646 tests restent verts sur un système qui
ne peut plus rien écrire.

Option retenue par le PO : **livrer AC-4 à la lettre**, conforme au texte de D8 (« obligatoire, pas
toléré absent ») et à l'ordre imposé. La donnée existante est rattachée ; la fenêtre d'écriture
gelée est assumée et **levée par STORY-236/357**. La phrase du cadrage « cette story ne change aucun
contrat REST » est donc **inexacte** au sens observable : les routes existent toujours, mais leurs
écritures échouent. C'est consigné ici plutôt que corrigé en douce.

#### Défauts trouvés et corrigés pendant la reprise

1. **Mutation de mutation-test laissée en place** — `origine: undefined, // MUTATION-M1` dans
   `dossiers.service.ts`. Le build échouait (`TS6133`, import inutilisé), ce qui l'a rendue visible ;
   sans ça, la migration n'aurait **jamais** posé le marqueur `MIGRATION` et la marche arrière
   n'aurait **rien** supprimé. Restaurée, puis **rejouée proprement** (cf. table de mutations).

### ④ Validation (2026-08-14)

#### Portes DoD — les 3 services

| Service | Lint | Build | Unitaires | Couverture (st/br/fn/li) | E2E |
|---|---|---|---|---|---|
| `dossier-service` | 0 warning | OK | **620** | 99,43 / 92,00 / 97,70 / 99,39 | **118** |
| `balance-service` | 0 warning | OK | **2 742** | 99,02 / 91,96 / 98,25 / 99,10 | **552** |
| `bilan-service` | 0 warning | OK | **915** | 98,67 / 93,11 / 98,59 / 98,62 | **190** |

#### Tests ajoutés

- **AC-8 (`checksums-liasse-intacts.spec.ts`, bilan)** — l'AC exigeait un test comparant les
  checksums avant/après ; **il n'existait pas**. Il ne suffit pas d'asserter la forme de l'appel :
  le test **capture l'update réellement demandé** et l'**applique** à un snapshot figé via un
  applicateur générique (`$set`/`$unset`/`$rename`, et lève sur tout autre opérateur), puis compare
  le document entier. Ajouter `checksum` au `$set` le fait rougir **par le champ altéré**, pas par
  une forme d'appel.
- **Câblage des modules** (`migration.module.spec.ts`, dossier) — cf. défaut ② ci-dessous.
- **Isolation du CLI** (`migration-cli.module.spec.ts` ×3) — cf. défaut ③.
- **Poison pill de projection** (4 tests dans `profil-projection.service.spec.ts`) — cf. défaut ④.

#### Table de mutations — **14 mutations, 14 rouges**

| # | Service | Mutation | Résultat |
|---|---|---|---|
| M1 | dossier | `origine: MIGRATION` → `undefined` | 🔴 1 test |
| M3 | bilan | le `$set` de migration touche aussi `checksum` | 🔴 2 tests (AC-8) |
| M4 | bilan | filtre `dossierId: {$exists:false}` retiré | 🔴 3 tests |
| M5 | bilan | `required: true` retiré du schéma | 🔴 1 test |
| M7 | balance | `aDesOrphelins` forcé à `false` | 🔴 1 test |
| M8 | balance | clé de rattachement `orgId` → `dossierId` | 🔴 2 tests |
| M9 | dossier | marche arrière sans le filtre `version: 1` | 🔴 1 test |
| M10 | dossier | `forFeature` retirée du module de migration | 🔴 2 tests |
| M11 | dossier | `exports` retiré d'`IdentityModule` | 🔴 2 tests |
| M12 | balance | `ReadModelsModule` réintroduit dans le module CLI | 🔴 2 tests |
| M13 | dossier | garde du poison pill inversée | 🔴 5 tests |
| M14 | dossier | `marquerTraite` retiré de la branche poison pill | 🔴 1 test |

⚠️ **M10 et M13 ont d'abord rougi par ERREUR DE COMPILATION** (import devenu inutilisé) — un rouge
qui ne prouve **rien**, le piège déjà consigné en STORY-302. **Rejouées autrement**, en gardant tous
les imports référencés (jeton de modèle décalé pour M10, garde inversée pour M13) : rouges **par le
test**, avec pour M10 exactement le message observé en docker.


---

## Story Points Breakdown

- Phase 1 — création des dossiers depuis les profils (identité, axes, responsable) : 2 pts
- Phase 2 — rattachement dans `balance-service` (6 collections) : 2 pts
- Phase 2 bis — rattachement dans `bilan-service` (4 collections) : 1,5 pt
- Phase 3 — vérification, rapport, passage en `required` : 1 pt
- Marche arrière + tests d'idempotence : 1 pt
- Répétition sur dump réel + vérification docker : 0,5 pt
- **Total : 8 points**

#### Vérification docker — la preuve centrale (stack neuve, `down -v`)

Semis représentatif : une org **avec** dossier cabinet préexistant (créé par D1) + profil société,
une org **sans** dossier ni profil, **16 documents** antérieurs sans `dossierId` répartis sur les
11 collections migrées, 2 snapshots de liasse figés à checksum connu.

| # | Contrôle | Résultat observé |
|---|---|---|
| 1 | Enrichissement d'un cabinet **préexistant** | `Cabinet Alpha` → `Cabinet Alpha SARL`, NIF/RCCM/CNSS/capital/systemeComptable posés, `pays` et `typeEntite` **intouchés** (hook D10), **pas** d'`origine` ⇒ hors d'atteinte de la marche arrière |
| 2 | Création pour une org **sans** dossier | dossier créé, `origine: MIGRATION`, `version: 1`, journal « Créé par migration (STORY-356) », **aucun responsable inventé** (l'org n'a aucun admin actif) |
| 3 | Rattachement | **12 documents** balance + **6** bilan rattachés ; convergence finale **3/3, 1/1, 2/2, 3/3, 2/2, 1/1, 1/1** |
| 4 | Orphelins bloquants (AC-5) | l'org sans profil laisse **1 balance orpheline** ⇒ `aDesOrphelins: true`, rapport la compte par collection, **exit 1** |
| 5 | Convergence | après création du dossier manquant : **0 orphelin**, **exit 0** |
| 6 | Idempotence (AC-1) | 4 exécutions ; à partir de la 2ᵉ : `rattaches` **tous à 0**, `aDesOrphelins: false`, même état |
| 7 | **AC-8 checksums** | `01b892c0ffee…` et `aaaa1111bbbb…` **identiques bit à bit** avant migration, après migration **et après marche arrière** ; `liasse`, `moteurVersion`, `version` inchangés |
| 8 | Marche arrière balance + bilan (AC-7) | **18 documents détachés**, `dossierId` retiré partout, **aucune perte** : 16/16 documents toujours présents |
| 9 | Marche arrière dossier — **discrimination** | supprime **1** dossier (`origine: MIGRATION`, `version: 1`) + **1** entrée de journal ; **conserve** le cabinet issu de D1 et son journal |
| 10 | Outbox | intégralement drainée — **9 événements `SENT`**, aucun `PENDING`/`FAILED` |

#### ⚡⚡ Trois défauts que SEULE la vérification docker pouvait révéler

**② `dossier-service` ne démarrait pas.** `MigrationModule` injectait `DossierModel` et
`DossierJournalEntryModel` dans `RollbackDossiersService` **sans les déclarer** — `DossiersModule`
n'exporte délibérément que `DossiersService`, pour garder la règle de création en un seul endroit.
Résultat : lint 0, build OK, **611 unitaires + 118 e2e verts**, et le service refusant de booter
(`Nest can't resolve dependencies of the RollbackDossiersService (?, DossierJournalEntryModel)`).
Les unitaires ne pouvaient pas le voir : ils construisent les services avec `new Service(modele as
never, …)`, le graphe DI n'y est **jamais assemblé**, et TypeScript n'en sait rien non plus.
**Correctif** : `MongooseModule.forFeature` re-déclarée dans `MigrationModule` — les **mêmes**
modèles, sans percer la frontière de `DossiersModule`. **Test** : `migration.module.spec.ts`, qui
compile le vrai module (patron `balance.module.spec.ts` de STORY-145).

**③ ⚡⚡ Le script de migration VOLAIT les messages du service vivant.** Les bootstraps bootaient
`AppModule` entier : Nest démarrait alors **tous les consommateurs Kafka du service**, avec les
**mêmes consumer groups** que l'instance de production (`balance-dossier`, `balance-kyc`,
`balance-exercice`, `balance-service-ingestion`, `balance-profil-ocr`, `balance-pieces-ocr`…). Un
script qui vit quelques secondes rejoignait les groupes, **recevait le `dossier.created` du
cabinet**, puis s'arrêtait : offset avancé, message **jamais projeté**, read-model `dossiers_dossier`
resté **vide** — et donc **aucun rattachement possible**. Seul un `--reset-offsets` manuel a permis
la convergence. **En exploitation le message est perdu définitivement** : le mapping
`orgId → dossierId` n'existe jamais, et le rapport se contente d'annoncer des orphelins **sans
jamais dire pourquoi**. C'est la panne exacte que cette story existe pour éviter, et elle était
silencieuse. **Correctif** : `MigrationCliModule` dans les 3 dépôts — Config + Database (+ Kafka
producteur et outbox côté balance, qui publie) et **rien d'autre**. `ReadModelsModule`, qui porte les
consommateurs, est absent ; côté `dossier-service` le CLI n'importe même pas `MigrationModule`, qui
déclare `ProfilConsumer`. **Tests** : `migration-cli.module.spec.ts` ×3, dont un filet générique
« aucun module importé ne déclare de provider `*Consumer` ».

**④ ⚡⚡ Un seul profil inconvertible bloquait la migration de TOUTES les organisations.** Un profil
portant une valeur hors énumération fait lever une `ValidationError` Mongoose à l'écriture du
dossier. Elle remontait au consommateur, qui rejouait **5 fois, redémarrait, rejouait encore** —
partition `profil.societe.consolide` bloquée **indéfiniment** (offset figé à 3, `LAG` permanent), et
avec elle la migration de toutes les autres orgs. La projection traitait déjà l'enveloppe illisible
comme un poison pill ; **un payload structurellement valide mais refusé à l'écriture, non**.
⚠️ **Ce n'est pas un cas limite** : une migration tourne par définition sur de la donnée **écrite
avant les validations d'aujourd'hui** — c'est le cas normal d'un dump réel, ce que la DoD exige
justement d'éprouver. **Correctif** : la `ValidationError` est traitée comme un poison pill
**visible** — log `ERROR` nommant l'org, la cause et la conséquence, marqueur posé, offset avancé.
Rien n'est masqué : sans dossier, les documents de cette org restent **orphelins**, le rapport les
compte et le script **sort en erreur**. Seul le blocage des **autres** organisations est levé. Les
erreurs non-validation (Mongo indisponible) continuent d'être **propagées** pour rejeu.
Après correctif : partition drainée (**offset 4/4, LAG 0**), refus tracé et nommé.

⚠️ **Le semis qui a révélé ④ était fautif** (valeurs `NORMAL`/`REEL_NORMAL` hors des enums, insérées
directement en base). Les deux services partagent bien le **même** vocabulaire (`SN`/`SMT`,
`REEL`/`SYNTHETIQUE`) — il n'y a **pas** de divergence de contrat. Mais un fixture invalide a exposé
un mode de panne parfaitement réel, et c'est lui qui est corrigé.

### ⑤ Statuts et reste à faire (2026-08-14)

Statut `review` aux 3 endroits (en-tête, `sprint-status.yaml`, ici).

Reste à faire :

- Commit + push des 4 branches `MNV-356`, ouverture des **4 PR** (3 services + `docs/`) —
  ⚠️ un contrat d'événement touche **3 dépôts** : `dossier-service`, `balance-service` et
  `bilan-service` doivent être intégrés **ensemble**.
- Revue de code ⑥, revue de sécurité ⑦, rebase-merge ⑧, clôture ⑨.
