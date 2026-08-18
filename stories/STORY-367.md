# STORY-367 : L'Atelier cesse d'être mono-société — le gel, les cahiers et l'exercice se scopent au dossier

Status: done

**Epic :** EPIC-043 — Dossier client
**Points :** 5 · **Sprint :** 20 (backend) · **Service :** `balance-service` (`:3007`)
**Complexité :** high *(contrat d'événement inter-services, read-model, frontière `dossier-service`)*
**Décision :** **AD-P13** et **AD-P14** — `architecture-prospera-ecosystem` v1.4 · **AD-10** de
`architecture-balance-service-2026-08-15`
**Dépendances :** ⛔ **STORY-356** *(migration — elle rattache les 6 collections)* · ⛔ **STORY-236**
*(le contrat de balance porte `dossierId` — **EN COURS**)*
**Bloque :** **`EPIC-081`** *(`stock-service`, 1ᵉʳ contributeur externe portant `dossierId` de bout en
bout)*

---

## ⚠️ Frontière avec STORY-236, à confirmer avec la personne qui la fait

**`STORY-236` porte LE CONTRAT** : `dossierId` sur `Balance`, la clé unique, les routes.

**Cette story porte LA PORTÉE EFFECTIVE** — tout ce qui, autour de la balance, reste keyé `orgId` et
maintient l'Atelier mono-société même une fois le contrat corrigé.

> ⛔ **Aucune ligne de cette story ne touche le schéma `Balance` ni sa clé unique.** Si `STORY-236`
> couvre déjà l'un des points ci-dessous, il en sort — la frontière se règle à l'ouverture, pas à la
> revue.

## ⚡ RÉANCRÉ le 2026-08-15 après la clôture de STORY-356

> ⚠️ **La première rédaction de cette story disait « `dossierId` n'apparaît que dans le read-model
> d'exercice ». C'EST PÉRIMÉ.** `STORY-356` a été livrée le même jour, sur 3 dépôts.

**Ce que STORY-356 a livré** (vérifié dans `balance-service@dev`) : `dossierId` est porté par
**9 schémas** du service, **`required: true` au schéma**, plus les read-models `dossiers_dossier` et un
script de migration idempotent avec marche arrière.

> ⛔ **ET C'EST PRÉCISÉMENT CE QUI REND CETTE STORY URGENTE.** L'arbitrage PO d'`AC-4` a été livré **à
> la lettre** : le schéma **exige** `dossierId`, et **aucun chemin d'écriture ne le pose** ⇒
> **LES ÉCRITURES DE L'ATELIER SONT GELÉES** jusqu'à la clôture de **`STORY-236`** et de celle-ci.
>
> ⇒ **Cette story ne prépare plus une amélioration : elle DÉGÈLE le service.**

⚠️ **Et la DoD de STORY-356 est laissée volontairement DÉCOCHÉE sur un point** : le parcours
Atelier→Bilan **en écriture** est *« NON VÉRIFIABLE »* là-bas — *« invisible aux 3646 tests, qui mockent
TOUS la couche données »*. **Il est à rejouer ici**, en réel.

## Le constat, re-vérifié dans `balance-service@dev` le 2026-08-15

Le champ existe partout ; **rien ne s'en sert**. Autour de la balance, trois mécanismes restent keyés
`orgId` — **les trois index et filtres sont INCHANGÉS par STORY-356** :

| Mécanisme | État vérifié dans `@dev` | Ce que ça impose |
| --- | --- | --- |
| `ExerciceAtelierSchema.index({ orgId, bornes }, { unique: true })` | **inchangé** | ⛔ **Un seul exercice d'Atelier pour tout le cabinet**, pas un par client |
| `existeBalanceValidee(orgId, exercice, source)` | **inchangé** — sert au **gel du cahier** | ⛔ Valider la balance d'un client **gèle les cahiers de tous les autres** |
| Dépôts cahiers / ventilation / rapprochement | **inchangés**, `orgId` toujours au filtre, `dossierId` jamais | ⛔ Recettes et dépenses de **tous les clients dans un seul seau** |

⚠️ **La distinction à tenir** : `STORY-356` a rempli **la donnée** ; elle n'a touché **ni un index, ni
un filtre**. *Rattacher sans filtrer ne change rien de visible* — c'est exactement le partage de
périmètre annoncé, et c'est ce qui reste à faire.

> ⚡ **Corriger le contrat de balance sans corriger ceci laisse l'Atelier mono-société.** La balance
> saurait de quel dossier elle parle, et tout ce qui l'entoure continuerait de l'ignorer — **le vertical
> cabinet est en production**.

## ⚡⚡ RÉANCRAGE À L'OUVERTURE, le 2026-08-18 — `STORY-236` a été clôturée entre-temps

> ⚠️ **Le tableau du constat ci-dessus est PÉRIMÉ sur deux lignes des trois.** Il a été écrit le
> 2026-08-15 ; `STORY-236` a été **clôturée le 2026-08-16** (PR `prospera-balance-service#38`, feature +
> 4 commits de revue + 1 de tests, **deux tours de revue**). Re-vérifié dans `balance-service@dev` avant
> d'écrire la première ligne :

| Point du constat | État réel dans `@dev` le 2026-08-18 | Verdict |
| --- | --- | --- |
| `ExerciceAtelierSchema.index({ orgId, bornes }, unique)` | **déjà corrigé** — l'index est `{ dossierId, exercice.debut, exercice.fin }` unique, et le dépôt filtre sur `(orgId, dossierId)` | **livré par 236** |
| `existeBalanceValidee(orgId, exercice, source)` | **déjà corrigé** — signature `(orgId, dossierId, exercice, source)`, exclusion `A_NOUVEAUX` intacte | **livré par 236** |
| Dépôts cahiers / ventilation / catégories / surcharges / rapprochement | **déjà corrigés** — les 6 collections filtrent sur `(orgId, dossierId)`, 22 contrôleurs nichés sous `/dossiers/:dossierId` + `DossierScopeGuard` (404, jamais 403) + test structurel d'invariant | **livré par 236** |
| Marche arrière `migrate:dossiers:rollback` de `balance-service` | **retirée** par 236 (`MigrationModule` le documente) ; celle de `bilan-service` a été **bornée** par STORY-372/373 (simulation par défaut + borne temporelle) | **tranché** |

⛔ **Ce qui ferme le périmètre plutôt que de l'ouvrir** : ② et ③ ci-dessous sont **déjà livrés**. Les
ré-implémenter serait de la redite ; les déclarer « faits par cette story » serait un mensonge de
clôture. Cette story **vérifie** qu'ils tiennent (dont le mutation-test du gel, que 236 n'a pas posé) et
livre **ce qui reste** :

1. **①** — le statut de l'exercice est **lu dans `exercices_dossier`**, jamais plus décidé par le seul
   `ExerciceAtelier`. C'est là que se referme la double écriture, et c'est intégralement à faire :
   `grep` le confirme, **rien** ne lit encore ce read-model.
2. **④** — `balance.submitted` **porte `dossierId`**, et son absence est un **rejet**. Aujourd'hui le
   hub fait exactement ce que le point ④ interdit : il **résout « Mon cabinet »** (`estLeCabinet: true`)
   et y rattache la balance. C'est l'arbitrage transitoire assumé de 236 — *« le rattachement propre de
   `balance.submitted` reste un point ouvert du ticket »* —, et la fenêtre se referme ici.
3. Les **cases de DoD** que 356 puis 236 ont laissées ouvertes : dégel du parcours Atelier→Bilan **en
   écriture réelle** (docker), sort de la marche arrière, `AD-10` de la spine.

## Ce que la story livre

### ① `ExerciceAtelier` se rebranche sur le read-model

- ⚡ **`AD-P14` l'exige** : `balance-service` **cesse d'être source de vérité sur le statut** de
  l'exercice et lit `exercices_dossier`, alimenté par `dossier.exercice.ouvert|clos|rouvert`.
- ⚠️ **C'est ici que la double écriture se referme.** Tant que ce n'est pas fait, *« il existe deux
  écritures possibles pour un même fait »* — l'écart que le réancrage qualifie de **plus dangereux du
  système à cette date**.
- ⛔ **La projection décide d'après le champ `statut`, jamais d'après le nom du topic.** Oublier
  `rouvert` — le plus récent des trois — figerait le read-model sur `CLOS`, et **l'Atelier refuserait
  une saisie pourtant autorisée**. Le piège est **déjà documenté** dans
  `bilan-service/src/kafka/events/exercice-events.ts` ; le reproduire ici serait impardonnable.
- ⛔ **`ExerciceAtelier` n'est pas SUPPRIMÉ, il est rebranché.** Le supprimer laisserait le service
  aveugle entre deux stories — ce qu'`AD-P14` interdit explicitement.

### ② Le gel du cahier ne franchit plus le dossier — ✅ **livré par 236, à ÉPROUVER ici**

> ⚠️ Le code est en place ; **ce que la DoD exige est la preuve qu'il tient**. `existeBalanceValidee`
> est scopée et l'exclusion `A_NOUVEAUX` est là — reste à établir, **par mutation** (remise en portée
> `orgId`), qu'un test vire au rouge, et à en écrire un si aucun ne le fait.

- **`existeBalanceValidee` devient scopée au dossier.** Sinon la validation d'**une** balance bloque la
  saisie de **tout le portefeuille**.
- ⚠️ **L'exclusion `A_NOUVEAUX` reste en place** (`AD-2`, `D-082-3`) : *un socle d'ouverture n'est pas
  « la balance que le cahier justifie »*, et le laisser geler l'exercice qu'il vient d'ouvrir rendrait
  la saisie impossible **dès le premier jour**. La scoper au dossier ne doit pas la faire disparaître.

### ③ Les dépôts filtrent sur `(orgId, dossierId)` — ✅ **livré par 236, à CONSTATER ici**

- Cahiers de recettes et de dépenses, comptes de ventilation, catégories, surcharges de rattachement,
  rapprochements.
- ⚠️ **`STORY-356` RATTACHE les 6 collections ; celle-ci FILTRE dessus.** Les deux sont nécessaires :
  **rattacher sans filtrer ne change rien de visible**, et c'est précisément le genre de demi-livraison
  qui se déclare faite.
- ⛔ **Un `dossierId` hors portée rend `404`, jamais `403`** — le service refuse de révéler l'existence
  du dossier (`AD-P13`).

### ④ Le hub refuse une soumission sans dossier, et ne devine jamais

- Un `balance.submitted` **sans `dossierId`** est **rejeté avec un `motifCode` stable**, tracé au
  journal d'ingestion — qui journalise **les deux issues** (`AD-9`).
- ⛔ **JAMAIS de repli sur « Mon cabinet ».** Un défaut implicite rattacherait la balance d'un client au
  dossier du cabinet : **un chiffre juste, sur la mauvaise société**, et rien ne le signalerait.
- ⚡ **`stock-service` est le premier contributeur externe concerné** : il porte `dossierId` de bout en
  bout (`AD-6`) et publiera au hub (`AD-7`). **`EPIC-081` suppose ce refus en place.**

## Critères d'acceptation

- **Étant donné** une balance **validée** sur le dossier A **quand** un collaborateur saisit au cahier
  du dossier B **alors** **la saisie reste possible**. ⚡ C'est le cœur de la story.
- **Étant donné** deux dossiers d'un même cabinet **quand** chacun ouvre son exercice **alors** **les
  deux coexistent** — il n'y a plus « un exercice d'Atelier par organisation ».
- **Étant donné** un exercice **rouvert** dans `dossier-service` **quand** l'Atelier consulte son statut
  **alors** il le voit **rouvert**, et le test porte **sur le topic `rouvert`**, pas seulement sur
  `ouvert`/`clos`.
- **Étant donné** un `dossierId` **hors portée** **quand** l'appelant demande un cahier ou un exercice
  **alors** la réponse est **`404`**, jamais `403`.
- **Étant donné** un socle d'à-nouveaux **quand** il est déposé **alors** il **ne gèle toujours pas** le
  cahier de son propre dossier — l'exclusion `A_NOUVEAUX` survit au changement de portée.
- **Étant donné** un `balance.submitted` **sans `dossierId`** **quand** le hub le traite **alors** il
  est **rejeté et journalisé**, et ⛔ **jamais rattaché à « Mon cabinet »**.

## Ce que cette story ne fait PAS

- ⛔ Elle **ne touche pas au schéma `Balance` ni à sa clé unique** — c'est **`STORY-236`**, **en cours**.
- ⛔ Elle **ne migre aucune donnée** : `STORY-356` rattache, elle exploite. Filtrer sur un champ que la
  migration n'a pas rempli produirait des `404` sur tout l'historique.
- ⛔ Elle ne scope ni `bilan-service` (`STORY-357`) ni `document-service` (`STORY-358`).
- ⛔ Elle ne supprime pas `ExerciceAtelier`.

## Décisions tranchées à l'ouverture (2026-08-18), avant la première ligne

### D-367-1 — le read-model **fait foi quand il connaît l'exercice**, `ExerciceAtelier` reste le repli

`AD-P14` dit *« cesse d'être source de vérité »*, et ⛔ interdit de supprimer `ExerciceAtelier`. Les deux
tiennent ensemble d'une seule façon : **`exercices_dossier` décide dès qu'il porte une ligne aux mêmes
bornes pour ce dossier ; à défaut seulement, `ExerciceAtelier.statut` répond.**

- ⛔ **Le repli n'est pas une politesse, il est obligatoire** : l'Atelier ouvre et clôt lui-même des
  exercices (`RepriseService`, STORY-087 — `ouvrir` N, `clore` N-1) **sans rien publier**. Lire
  uniquement le read-model rendrait `estClos` **faux en sens fail-open** sur exactement ces exercices-là :
  le N-1 verrouillé par la reprise (D-087-5) redeviendrait saisissable, et le cahier divergerait de la
  balance de clôture qui a produit les à-nouveaux. On ne remplace pas une double écriture par une
  régression d'intégrité.
- ⚡ **Le read-model l'emporte, y compris CONTRE un `CLOS` local** : c'est le cas `rouvert`. Un exercice
  clos dans l'Atelier puis **rouvert** par `dossier-service` doit redevenir saisissable — l'inverse
  (`ExerciceAtelier` gagnant) figerait la saisie sur un fait périmé, et il n'y a aucun chemin par lequel
  l'Atelier apprendrait la réouverture.
- **Un seul point d'entrée** : `ExercicesRepository.estClos(...)`, déjà l'unique porte des **6**
  appelants (cahiers ×2, agrégation, rapprochement, trésorerie, fiscal). L'arbitrage y vit, donc le
  7ᵉ appelant l'hérite **par défaut** — un rebranchement dispersé sur 6 modules serait un fail-open en
  attente.
- **La comparaison de statut est `CLOS`/non-`CLOS`, jamais une liste de valeurs autorisées.** Le
  vocabulaire appartient au producteur (le read-model type `statut` en `string`, délibérément) : un enum
  local ferait rejeter une valeur qu'il ajouterait.

### D-367-2 — `dossierId` entre dans le contrat `balance.submitted`, **sans repli et sans devinette**

- Le champ est porté par `balance.dossierId` (à côté d'`orgId`), **requis**. Absent, non hexadécimal, ou
  **hors de l'organisation émettrice** ⇒ rejet `DOSSIER_ABSENT` / `DOSSIER_INCONNU`, tracé au journal
  d'ingestion **et** notifié par `balance.rejected` dans la même transaction.
- ⛔ **`DOSSIER_CABINET_INDISPONIBLE` disparaît du chemin nominal** : il n'existait que pour dire que le
  repli « Mon cabinet » avait échoué. Le **code reste déclaré** (contrat public, un émetteur peut l'avoir
  programmé) mais plus rien ne l'émet — noté comme tel dans le contrat.
- ⚠️ **Le dossier est vérifié dans `dossiers_dossier`, pas cru sur parole.** Sans cette lecture, un
  émetteur compromis écrirait la balance d'un client **sur le dossier d'un autre tenant** : le hub est
  hors chaîne de guards HTTP, `DossierScopeGuard` ne le protège pas.
- **Contrat public ⇒ 2 documents à jour dans le même diff** :
  `balance-service/docs/schemas/balance.submitted.v1.schema.json` et le § *« Comment un vertical pousse
  sa balance »* d'`INTEGRATION.md`. ⚠️ **Aucun producteur de `balance.submitted` n'existe dans
  l'écosystème à ce jour** — balayage des 9 dépôts + racine : les seules occurrences de la chaîne vivent
  dans `balance-service` (consommateur, et éditeur de son propre contrat). Le changement ne casse donc
  **aucun émetteur vivant**, et `stock-service` (EPIC-081) naîtra avec. C'est ce qui autorise à durcir
  `v1` plutôt qu'à ouvrir un `v2` — un `schemaVersion: 2` pour zéro émetteur serait de la cérémonie.

## Definition of Done

- [x] **Mutation-test du gel** : remettre `existeBalanceValidee` en portée organisation ⇒ le test « le
      cahier du dossier B reste saisissable » **vire au rouge**. Sans lui, la règle centrale n'est
      tenue par rien.
- [x] Deux dossiers portent **deux exercices d'Atelier distincts** aux mêmes bornes.
- [x] La projection d'exercice est vérifiée **sur les trois topics**, `rouvert` compris.
- [x] Aucun dépôt de cahier, de ventilation ou de rapprochement n'accepte une requête **sans
      `dossierId`**.
- [x] Un `balance.submitted` sans dossier laisse **une trace de rejet motivée**.
- [x] ⚡ **Les écritures sont DÉGELÉES** : un parcours Atelier→Bilan **en écriture réelle** passe de bout
      en bout. ⚠️ C'est la case que `STORY-356` a **laissée décochée** parce qu'elle n'était pas
      vérifiable chez elle — *« invisible aux 3646 tests, qui mockent TOUS la couche données »*. ⛔ Elle
      se coche **en docker**, pas en test unitaire.
- [x] ⚠️ **Le sort de la marche arrière est tranché.** `STORY-356` documente une limite qu'elle n'a pas
      corrigée : *« la marche arrière balance/bilan détache TOUT `dossierId` sans discriminer son
      origine — correct dans la fenêtre de migration, **à RETIRER OU BORNER à la clôture de
      236/357** »*. La fenêtre se referme ici : **retirer, borner, ou dire pourquoi on la garde.**
- [x] ⚠️ **`AD-10` de la spine `balance-service` est mise à jour** : elle décrit la bascule comme
      *« posée et NON terminée »*. Un document ne doit pas survivre à sa propre péremption.

---

## Progress Tracking

- **2026-08-18** — statut `not_started` → `in_progress`. Branches `MNV-367` ouvertes sur `docs/` (base
  `main`) et `balance-service` (base `dev`), **avant** la première ligne de code.
- **2026-08-18** — ⚡⚡ **réancrage à l'ouverture** : `STORY-236` ayant été clôturée le 2026-08-16, ② et
  ③ sont **déjà livrés** et le constat du 15/08 est périmé sur 3 lignes sur 4. Périmètre effectif
  ramené à ① (rebranchement du statut), ④ (`dossierId` dans `balance.submitted`) et aux cases de DoD
  laissées ouvertes par 356/236. Détail au § *Réancrage à l'ouverture*, écrit **avant** de coder.
- **2026-08-18** — décisions **D-367-1** (read-model prioritaire, `ExerciceAtelier` en repli) et
  **D-367-2** (`dossierId` requis au contrat, aucun repli « Mon cabinet ») tranchées et motivées avant
  implémentation.

### Implémentation (commit `b1a16df`)

**①** `ExercicesRepository.estClos` — seul point de passage des **6** appelants (cahiers ×2, agrégation,
rapprochement, trésorerie, fiscal) — lit `exercices_dossier` **avant** `ExerciceAtelier`. Read-model
présent ⇒ il décide (`statut === 'CLOS'`, jamais une liste blanche) ; absent ⇒ repli local. `ExerciceDossier`
est déclaré par `MongooseModule.forFeature` dans `RepriseModule` plutôt que par un `import` de
`ReadModelsModule` — celui-ci provisionne aussi 4 consommateurs Kafka, et on ne veut ici qu'un modèle.

**④** `balance.dossierId` **requis** au contrat entrant. `lireSoumission` contrôle la forme
(`typeof === 'string'` **puis** 24 hexadécimaux — `Types.ObjectId.isValid(42)` rend `true`), puis
`resoudreDossier` vérifie `{ dossierId, orgId }` dans `dossiers_dossier` et refuse un dossier archivé.
Trois codes stables : `DOSSIER_ABSENT`, `DOSSIER_INCONNU` (motif muet sur le *pourquoi*),
`DOSSIER_ARCHIVE` (parité avec le `409` de `DossierScopeGuard`). Le dossier **revendiqué mais non résolu**
n'est jamais consigné au journal : ce serait un canal d'écriture cross-tenant dans une collection d'audit.
Le littéral `'ARCHIVE'` est factorisé (`STATUT_DOSSIER_ARCHIVE`) — porte HTTP et porte Kafka refusent
désormais sur **la même** valeur.

⚠️ **Deux ajouts assumés, hors énoncé strict, tous deux dans le contrat public que la story modifie** :
`DOSSIER_ARCHIVE` (le bus ne doit pas être une porte plus faible que l'HTTP — même argument que le rejeu
de KYC/entitlement dans `autoriser()`), et la **correction d'une divergence antérieure** du schéma publié,
qui décrivait encore 2 colonnes de montant (`debit`/`credit`) là où le hub en exige **4** depuis
STORY-147 : un émetteur qui suivait la doc était rejeté.

### Portes DoD

lint 0 warning · build OK · **2871 unitaires + 672 e2e** verts · couverture **99,01 / 91,82 / 98,21 /
99,09** (seuils 65/90/90/90).

**9 mutations, 9 rouges PAR ASSERTION** — les 4 qui ne compilaient pas d'abord ont été reformulées en
variantes compilables (un rouge par `TS6133` ne prouve rien, leçon STORY-179) :

| # | Mutation | Test qui vire au rouge |
|---|---|---|
| M1 | `existeBalanceValidee` remise en **portée organisation** | ⚡ « le cahier du dossier B reste SAISISSABLE » |
| M2 | le read-model est **ignoré** (retour au seul `ExerciceAtelier`) | « CLOS au read-model ⇒ clos » + « OUVERT ⇒ non clos (`rouvert`) » |
| M3 | le **repli local supprimé** (read-model seul) | « read-model muet ⇒ repli » + 2 autres |
| M4 | liste blanche `!== 'OUVERT'` au lieu de `=== 'CLOS'` | « un statut INCONNU du hub n'est pas traité comme clos » |
| M5 | dossier **non vérifié comme appartenant à l'org** (`orgId` hors du filtre) | « vérifié sur (dossierId, orgId) » |
| M6 | rejet `DOSSIER_INCONNU` **supprimé** (le hub retombe sur un défaut) | « dossier INCONNU ⇒ DOSSIER_INCONNU » + « jamais consigné » |
| M7 | dossier **revendiqué** consigné au journal malgré le refus | « le dossier REVENDIQUÉ n'est JAMAIS consigné » |
| M8 | `dossierId` **absent toléré** | « SANS dossierId ⇒ DOSSIER_ABSENT » (×2 suites) |
| M9 | contrôle de **type retiré** (`isValid` seul) | « refuse un dossierId qui n'est pas 24 hexadécimaux » (`dossierId: 42`) |

⚠️ **Une affirmation écrite puis corrigée avant commit** : le commentaire justifiant la regex disait que
`Types.ObjectId.isValid` accepte les chaînes de 12 caractères. **Faux en Mongoose 8** (`isValid('douze-carac.')`
⇒ `false`). Le vrai piège est ailleurs et il est pire : `isValid(42)` ⇒ **`true`**, un nombre y étant lu comme
un horodatage. Commentaire et test réalignés sur ce qui est vérifiable.

### ⚡ Vérification docker — stack **neuve** (`down -v`), Mongo `rs0`, Kafka up, 3 services

`auth-service` + `dossier-service` + `balance-service`, code de la branche (volume `src/`,
`Found 0 errors. Watching for file changes.`). Org réelle créée par `register`, jeton RS256 réel,
KYC `APPROVED` + entitlement `ACTIVE` posés dans les read-models. **Deux dossiers** : « Mon cabinet »
(`…3b55`, créé par la projection `dossier.created`) et « Client B SARL » (`…3ba9`, créé par API).

**① Les écritures sont DÉGELÉES** *(la case que STORY-356 a laissée décochée)* :

| Écriture réelle | Résultat |
|---|---|
| `POST /dossiers/:id/cahiers/depenses` sur **A** puis **B** | `201` / `201` — 2 documents écrits |
| `categories_depenses` semées à la 1ʳᵉ lecture | **38** = 19 par dossier — **pas un seau commun** |
| `POST /dossiers/A/balances` (`ocr`) + `/valider` | `201` puis `200`, `etat: VALIDÉE` |
| Documents **sans `dossierId`** — 4 collections | **0** |

**② Le gel ne franchit pas le dossier** — le cœur de la story, prouvé contre un vrai Mongo :

| Après validation de la balance de A | Résultat |
|---|---|
| saisie au cahier de **A** | **`409 BALANCE_VALIDEE_IMMUABLE`** |
| saisie au cahier de **B** | ⚡ **`201`** — le portefeuille n'est pas gelé |

**③ Les trois topics, en conditions réelles** — `exercices_atelier` est resté **VIDE** pendant tout le
parcours : la décision vient donc bien du read-model, et de rien d'autre.

| Séquence sur le dossier B | Read-model | Saisie au cahier |
|---|---|---|
| `dossier.exercice.ouvert` | `OUVERT` (v1) | `201` |
| `dossier.exercice.clos` | `CLOS` (v2) | **`409 EXERCICE_CLOS`** |
| `dossier.exercice.rouvert` | `OUVERT` (v3), `closPar`/`closLe` **retirés** | ⚡ **`201`** |

**Deux exercices aux mêmes bornes, un par dossier** : `exercices_dossier` porte les deux lignes
`2026-01-01 → 2026-12-31`, une par `dossierId` ; l'index unique réel de `exercices_atelier` est bien
`{dossierId, exercice.debut, exercice.fin}` (relu par `getIndexes()`).

**④ Le hub — 4 `balance.submitted` publiés sur Kafka** (producteur console, réseau docker) :

| `eventId` | `balance.dossierId` | `etat` / `motifCode` | `dossierId` consigné |
|---|---|---|---|
| `evt-367-sans-dossier` | *(absent)* | `REJETÉE` / **`DOSSIER_ABSENT`** | marqueur `orgId` |
| `evt-367-dossier-inconnu` | `…439099` (autre) | `REJETÉE` / **`DOSSIER_INCONNU`** | marqueur `orgId` — ⛔ **jamais** le dossier revendiqué |
| `evt-367-archive` | B, archivé entre-temps | `REJETÉE` / **`DOSSIER_ARCHIVE`** | marqueur `orgId` |
| `evt-367-ok` | **B** | `BROUILLON` | ⚡ **`…3ba9` = Client B**, *pas* le cabinet |

⛔ **C'est la démonstration du défaut corrigé** : avant cette story, `evt-367-ok` aurait été rattaché à
« Mon cabinet » (`…3b55`) — les chiffres de Client B sur la société du comptable.

**Atomicité et boucle de retour** : `rejets consignés = 3` et `balance.rejected` émis = **3** (aucun rejet
muet) ; **0** balance créée par les événements rejetés (aucun orphelin) ; `outbox_events` = 5, tous `SENT`.

### Ce que 236 avait déjà livré — **constaté**, pas re-livré

Les 6 collections filtrent sur `(orgId, dossierId)`, les 22 contrôleurs nichés portent
`@RequiresDossierScope()` (404 jamais 403) sous un test structurel d'invariant, et la **marche arrière** de
`balance-service` a été **retirée** par 236 (celle de `bilan-service` **bornée** par 372/373 : simulation
par défaut + borne temporelle). ⇒ **La case « sort de la marche arrière » est cochée par constat**, la
fenêtre de migration est fermée des deux côtés.

## ⑥ Revue de code — 6 constats, dont **1 bloquant** (commit `10984d5`)

⚡⚡ **Le bloquant était une RÉGRESSION introduite par le commit de feature, invisible à la vérification
docker.** `estClos` faisait gagner le read-model **dès qu'il connaissait l'exercice** — or **deux écrivains
coexistent** : `dossier-service` publie, et `RepriseService` clôt N-1 dans `exercices_atelier` **sans rien
publier** (D-087-5 ; `AD-P14` interdit de supprimer ce modèle avant la fin de la bascule).

Les deux causes d'un conflit **se lisent à l'identique** — read-model `OUVERT`, local `CLOS` — et appellent
l'inverse : une réouverture doit rouvrir, une clôture de reprise doit verrouiller. Ce qui les sépare est
**l'ordre des faits** ⇒ arbitrage à la date de la dernière transition, fail-closed sans horodatage.

> ⚠️ **Pourquoi la vérif docker ne pouvait pas l'attraper** : `exercices_atelier` est resté **vide** pendant
> tout le parcours (la reprise n'a pas été exercée), donc le conflit ne s'est jamais produit. Un parcours
> vert ne prouve que ce qu'il traverse.

| # | Constat | Traitement |
|---|---|---|
| F1 | ⛔ **bloquant** — le `CLOS` posé par la reprise était écrasé par un read-model qui l'ignore ⇒ cahier N-1 saisissable alors que ses à-nouveaux sont déjà tirés | **corrigé** — arbitrage à la date de transition + 3 tests + M10/M11 |
| F2 | sur `DOSSIER_ARCHIVE` le dossier **est** résolu (il existe, il est à l'org) mais n'était pas consigné ⇒ rejet introuvable dans `GET …/balance/rejets`, lecture que le guard autorise pourtant sur un dossier archivé | **corrigé** + M12 |
| F4 | l'affirmation « `DOSSIER_CABINET_INDISPONIBLE` reste **déclaré** au contrat » était **fausse** : le schéma publié ne l'a **jamais** portée (écart de 236) | **corrigé** — commentaire réaligné ; le code n'est **pas** ajouté au schéma (publier une valeur que rien n'émettra serait l'inverse du même défaut) |
| F6 | le motif du `forFeature` local dans `RepriseModule` était faux (les modules Nest sont des singletons ; importer `ReadModelsModule` ne réinstancierait aucun consommateur) | **corrigé** — vrai motif : la portée de la dépendance |
| F3 | les rejets **de forme** (`PAYLOAD_INVALIDE`, `SOURCE_SYSTEM_INCONNU`) ne sont plus visibles dans `GET /dossiers/:dossierId/balance/rejets` — ils portaient avant le dossier du cabinet | **retenu comme conséquence assumée** — ils n'ont, par construction, **aucun dossier résolu**, et consigner un identifiant revendiqué non vérifié est précisément ce que la story interdit. Reste joignable par `balance.rejected` et le journal. ⚠️ **dette ouverte**, à traiter si l'écran de diagnostic en souffre |
| F5 | `AD-10` de la spine non mise à jour (case de DoD) | **corrigé** — cf. § suivant |

## ⑦ Revue de sécurité — **0 vulnérabilité**, mais un défaut d'intégrité versé à la revue (commit `efc3b23`)

**Aucun constat de confiance ≥ 80.** La revue relève même que la PR **améliore** la posture multi-tenant :
avant elle, un émetteur allowlisté revendiquant l'`orgId` d'un tiers voyait sa balance rattachée
**automatiquement** au dossier « Mon cabinet » de cette organisation, **sans avoir à connaître le moindre
identifiant** ; désormais il doit désigner un `dossierId` vérifié sur `{ dossierId, orgId }` — un ObjectId
non devinable. Vérifiés puis écartés : injection d'opérateur Mongo dans le filtre (le contrôle de type la
ferme), sonde d'énumération par différence de code de rejet (`DOSSIER_INCONNU` ne distingue jamais
« inexistant » d'« autre org »), écriture d'audit cross-tenant, empoisonnement du read-model, fuite dans les
motifs et les logs.

⚡ **Ce qu'elle a trouvé hors de son périmètre, et qui était réel** : le correctif F1 comparait
`projete.updatedAt` — posé par `timestamps: true` **au moment de la projection** — à `local.closLe`, un
horodatage **métier**. **Deux horloges différentes.** Un rejeu du topic `dossier.exercice.*` (marqueur
`ProcessedEvent` purgé au TTL de 30 jours, ou reset d'offsets du consumer group) réécrit `updatedAt` à
*maintenant* et **lève le verrou comptable** sans qu'aucune transition n'ait eu lieu.

⇒ Le read-model porte désormais l'`occurredAt` **métier** de l'événement, soumis au même `$unset` que les
autres optionnels (l'état projeté reste **absolu**). Rejoué, il vaut la **même** valeur : l'arbitrage est
rejouable comme l'état qu'il lit. Absent (documents projetés avant cette story) ⇒ **fail-closed**.

**14 mutations au total, 14 rouges par assertion** (M10 → M14 pour les correctifs de revue).
Portes rejouées après correctifs : lint 0 · build OK · **2875 unitaires + 672 e2e** · **99,01 / 91,84 /
98,21 / 99,09**.

## ⑧ Vérification docker **rejouée sur l'état final** (`docker restart`, `Found 0 errors`)

Les correctifs touchent un artefact déjà vérifié (le read-model gagne un champ, l'arbitrage change) — la
vérification est donc **rejouée**, jamais reportée depuis la mesure d'avant.

| Rejeu | Résultat |
|---|---|
| État **hérité** de l'ancien code (`occurredAt` absent, exercice `OUVERT`) | saisie `201` — la compatibilité ascendante tient |
| Clôture par `dossier-service` | `statut: CLOS`, **`occurredAt` projeté** (v4) ⇒ saisie **`409`** |
| Réouverture | `statut: OUVERT` (v5), `occurredAt` **réécrit**, `closLe` **retiré** ⇒ saisie **`201`** |
| ⚡ Correctif F2, avant/après sur la **même** base | `evt-367-archive` (ancien code) : `dossierId` = marqueur `orgId` · `evt-367-archive-bis` (code final) : `dossierId` = **le dossier résolu** |
| Journal | 5 ingestions, **4 rejets = 4 `balance.rejected` émis**, **0 orphelin** sur 4 collections, **0** balance créée par un rejet |

## ⑨ Clôture

- **2026-08-18** — ✅ **CLÔTURÉE** : PR `prospera-balance-service#42` rebase-mergée sur `dev`
  (3 commits : feature `b1a16df`, revue de code `10984d5`, revue de sécurité `efc3b23`). Statut aligné aux
  3 endroits, `completed_date` posée, `AD-10` de la spine réécrite.
- ⚡ **Ce que cette story change vraiment** : l'écart que le réancrage du 15/08 qualifiait de **plus
  dangereux du système** — deux écritures possibles pour un même fait — est refermé **côté lecture** dans
  `balance-service`. Il reste ouvert côté `bilan-service` (`POST /bilan/exercices`, STORY-357).
- **Dette ouverte, transmise :**
  - ⚠️ les rejets **de forme** du hub (`PAYLOAD_INVALIDE`, `SOURCE_SYSTEM_INCONNU`) ne sont plus visibles
    dans `GET /dossiers/:dossierId/balance/rejets` — ils n'ont aucun dossier résolu, par construction
    (constat F3 de la revue, retenu comme conséquence assumée) ;
  - ⚠️ **deux écrivains de l'exercice subsistent** tant que STORY-357 n'a pas retiré
    `POST /bilan/exercices` : l'arbitrage par date de transition est une **béquille de transition**, pas
    une architecture cible ;
  - ⚠️ les **bornes d'exercice non normalisées** envoyées en clair (`exerciceDebut`/`exerciceFin` à un
    instant autre que minuit UTC) ne matchent pas le read-model et retombent sur le repli local. Le
    raccourci `?exercice=AAAA` produit bien minuit UTC. Fragilité **antérieure**, rendue plus visible par
    le nouveau couplage — à traiter si un client l'exerce.
