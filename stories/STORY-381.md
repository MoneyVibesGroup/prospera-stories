# STORY-381 : La liasse déclare la balance dont elle sort — et le serveur refuse celles qui ne peuvent pas la porter

**Epic :** EPIC-043 — Le dossier client, unité de travail du cabinet
**Service :** `bilan-service` **et** `balance-service` ⬆️ *(2026-08-25 : le second n'était plus
seulement lu, il doit publier — voir §« La seconde moitié du même trou »)*
**Sprint :** 20 · **Story Points :** 5 → **7** ⬆️ *(2026-08-25)* · **Complexité :** medium
**Priorité :** Must Have
**Ticket d'origine :** `tickets/TICKET-BACKEND-bilan-ne-reference-pas-sa-balance-source.md`
**Découverte par :** **FE-028** *(module Bilan — shell, gate, choix de la balance source)*, le 2026-08-22
**Élargie par :** ⬆️ **FE-031** *(Bilan actif/passif N/N-1)*, le **2026-08-25** — en cherchant comment
désigner l'exercice comparatif, et en constatant que **rien ne relie une balance à un exercice du
dossier**. Absorbé ici plutôt que fiché à part : c'est le même trou, vu par l'autre bout.
**Réf. :** **STORY-099** *(handoff `balance.created`, producteur livré)* · **STORY-101** *(contrat de
balance canonique)* · **STORY-064/065** *(jeu d'états, snapshot immuable)* · **STORY-357** *(le Bilan
se scope sur le dossier)* · **STORY-375** *(les codes de refus deviennent un enum OpenAPI)*
**Status :** `in_progress` *(2026-08-25 — arbitrage rendu : voie A′)*

> ### Pourquoi ce numéro
> `STORY-379` est prise (fiche créée par la revue PO de la maquette FE-011, le 2026-08-21) et
> `STORY-380` est **brûlée** — attribuée puis supprimée le 2026-08-22 avec l'annulation d'AP-11, elle
> vit encore dans `git log`. Le `story_id_high_water_mark` disait « 378 » : il ne voit pas les
> numéros pris par un **fichier** d'une autre session. Vérifier `ls stories/` avant d'attribuer.

---

## Le constat

`POST /api/v1/dossiers/{dossierId}/bilan/etats` crée une liasse à partir d'un **tableau de soldes
bruts** :

```ts
class CreerJeuEtatsDto {
  exercice!: string;          // libellé libre, ex. "2025"
  soldesN!: LigneSoldeDto[];  // ← détachés de leur origine
  soldesN1?: LigneSoldeDto[];
}
```

**Aucun `balanceId` n'existe dans `bilan-service`** — `grep -rn "balanceId" src` rend 0 résultat hors
specs. Aucun read-model de balance, aucun consumer : `src/modules/read-models/` porte `dossier`,
`entitlement`, `exercice`, `kyc-status`, et rien d'autre.

### ⚡ Ce n'était pas un oubli : c'était un report, et le report est mort avec son épic

**STORY-099** a livré le **producteur** le 2026-07-17 — `balance-service` émet `balance.created` par
outbox transactionnelle. Sa fiche décrit le consommateur, au futur :

> **[Différé EPIC-009]** `bilan-service` consomme `balance.created` (group `bilan-balance`),
> déduplique par `eventId`, puis relit la balance complète via `GET /balances/:balanceId`.

**EPIC-009 est `superseded` depuis D14, le 2026-07-12** — *cinq jours avant* cette livraison. Tout ce
qui y était « différé » est parti avec lui, sans être re-slotté. L'événement part, l'outbox le marque
`SENT`, **personne ne l'écoute**.

C'est **STORY-374 à l'envers, avec le même mécanisme** : là-bas un read-model écrit et lu par
personne ; ici un événement émis et consommé par personne. Dans les deux cas, un commentaire
renvoyait à une story qui ne l'a jamais fait, et **rien ne rougit**.

⇒ **Règle, déjà écrite par STORY-374 et confirmée ici : un hook inerte doit NOMMER la story qui le
branche, et cette story doit porter un AC qui le dit.** Un renvoi vers un épic est trop gros pour
survivre : un épic peut être `superseded`, une story non commencée reste visible au sprint-planning.

---

## Les trois conséquences, aujourd'hui

1. **La liasse ne peut pas dire d'où elle vient.** Le snapshot (STORY-064/065) fige `soldesN` — donc
   les *chiffres*, jamais leur **provenance**. Pour un livrable **opposable**, « sur quelle balance
   cette liasse a-t-elle été établie ? » n'a aucune réponse dans les données.
2. **Le serveur ne refuse rien.** « Seule une balance `VALIDÉE` peut porter une liasse » est une règle
   que **seul l'écran** applique (FE-028). Un appel direct avec les soldes d'un brouillon passe. Et
   rien n'empêche de poster dans le dossier A les soldes lus dans le dossier B : le `DossierGate` de
   STORY-357 garde le dossier de la **requête**, pas l'origine des **nombres**.
3. **Le front porte un contexte que le serveur ignore.** FE-028 retient la balance source dans l'URL
   et le stockage local, faute de pouvoir la déclarer. Tenable pour un écran ; intenable pour
   FE-031 → FE-038, qui renvoient les soldes à chaque recalcul.

---

## User Story

**En tant que** cabinet qui dépose une liasse opposable,
**je veux** que chaque jeu d'états déclare la balance dont il sort et que le serveur refuse celles qui
ne peuvent pas la porter,
**afin de** pouvoir prouver, un an plus tard, sur quels chiffres la liasse a été établie — et de ne pas
dépendre d'un écran pour l'empêcher.

---

## Arbitrage d'architecture DÛ avant dev-story

Deux voies, et elles n'ont pas le même coût. **Le PO / l'architecte tranche ; la story ne présume pas.**

| | **A — `bilan-service` relit la balance** | **B — le client envoie soldes + référence** |
|---|---|---|
| Mécanisme | consumer `balance.created` (group `bilan-balance`) + read-model, puis relecture `GET /dossiers/:id/balances/:balanceId` | `CreerJeuEtatsDto` gagne `balanceId` + `balanceChecksum` ; le serveur vérifie la concordance |
| Ce que ça vaut | c'est le plan d'origine de STORY-099 ; le serveur devient **autonome** sur la source | additif, pas de Kafka, livrable en un sprint |
| Ce que ça coûte | appel service-à-service (ou read-model complet des lignes) — `bilan-service` n'a **aucun client HTTP sortant** aujourd'hui | le serveur **fait confiance** aux nombres reçus ; il vérifie une empreinte, pas une origine |
| Piège | 🕳️ un consumer qui meurt dans un conteneur `healthy` (poison-pill, cf. `document-service`) | 🕳️ un checksum recalculé côté client diverge du scellé serveur (STORY-147, `checksumVersion`) |

⚠️ **Quelle que soit la voie, l'AC-2 et l'AC-3 ne changent pas** : la liasse porte la référence, et le
serveur refuse. Seule la façon de **connaître** la balance diffère.

---

## ⚖️ ARBITRAGE RENDU — **voie A′** (PO, le 2026-08-25, avant dev-story)

**Ni A ni B tels que fichés : `A′` — read-model de MÉTADONNÉES alimenté par Kafka, sans client HTTP
sortant.** Le tableau ci-dessus a été instruit sur le code réel des deux dépôts avant l'arbitrage, et
deux constats en ont déplacé les termes.

### ⚡ Constat 1 — la voie B ne peut PAS tenir l'AC-3, et ce n'est pas une question d'effort

La voie B fait vérifier au serveur une **empreinte que le client lui fournit lui-même**. Or l'AC-3
exige de refuser une balance `BROUILLON`/`REJETÉE` et une balance d'**un autre dossier** : deux faits
que `bilan-service` ne détient pas et que le corps de la requête ne peut pas prouver. Retenir B
supposait donc d'assouplir l'AC-3 — que la story déclare intangible. **Écartée.**

### ⚡ Constat 2 — `balance.etat.change` porte l'état de l'EXERCICE, pas celui du DOCUMENT

Le contrat existant (`balance-etat-events.ts`, STORY-359) l'écrit noir sur blanc, et **interdit**
explicitement d'indexer un read-model sur son `balanceId` :

> *« `etat` est l'état de L'EXERCICE, pas celui du document `balanceId` […] Un consommateur qui
> indexerait son read-model sur `balanceId` reconstruirait précisément le défaut que ce contrat
> ferme. »*

⇒ **Un consumer branché sur les topics d'aujourd'hui ne peut pas répondre « CETTE balance est-elle
validée ? »** — ce que l'AC-3 demande. La voie A telle que fichée le contourne par une **relecture
HTTP**, qui donnerait à `bilan-service` son **premier client sortant** et un couplage synchrone sur
le chemin chaud. Coût réel, pour une donnée qui tient en dix champs.

⛔ **Et le trou n'est pas comblable par un simple champ additif sur `balance.etat.change`** :
`publierEtatExercice` **s'abstient de publier** sur `origine: A_NOUVEAUX` (délibérément — un socle
d'à-nouveaux n'est pas la balance de travail de l'exercice). Greffer l'état du document sur ce
message-là lui ferait hériter de ce silence, et le read-model d'aval croirait `BROUILLON` une balance
validée — sans que rien ne rougisse. Le canal « état du document » a donc **son propre topic**.

### ✅ Ce que A′ pose

| | |
|---|---|
| `balance-service` | ① `Balance.exerciceId` **résolu serveur** au dépôt, depuis `exercices_dossier`, par la **même clé exacte `{orgId, dossierId, debut, fin}` qu'`estClos`** — une seule règle de rapprochement dans le service, jamais deux · ② `BalanceResponseDto.exerciceId` (**AC-8**) · ③ `balance.created` gagne `exerciceId` + `checksumVersion` (additifs, `schemaVersion` inchangé — comme `dossierId` en STORY-236) · ④ **nouveau topic `balance.etat.document.change`**, publié **inconditionnellement** dans la transaction de `marquerEtat`, `A_NOUVEAUX` compris |
| `bilan-service` | ⑤ read-model `balances_balance` keyé `balanceId` (métadonnées seules — **aucune ligne de balance dupliquée**), consumer group `bilan-balance`, `fromBeginning` · ⑥ les **soldes continuent d'être envoyés par le client**, exactement comme aujourd'hui · ⑦ les gardes AC-3/AC-5 lisent ce read-model, scopé `{orgId, dossierId}` |

**Ce que ça coûte, dit franchement** : la provenance est **déclarée puis vérifiée** (`balanceId`
existe, appartient au dossier gardé, est `VALIDÉE`), elle n'est pas **recalculée** — `bilan-service`
ne re-scelle pas les soldes reçus. Recalculer le checksum côté consommateur, c'est précisément le
piège que la story prête à la voie B (`checksumVersion`, STORY-147) : deux algorithmes qui divergent
sans que personne ne le voie. Le `balanceChecksum` figé au snapshot est donc **celui que
`balance-service` a scellé**, relu du read-model — jamais un calcul local.

**AC-7 s'applique** (la voie retenue est événementielle) : garde-fou d'enveloppe + `estObjectId`
dans un fichier **couvert**, consumer réduit à un tuyau, rejeu prouvé en docker.

---

## ⬆️ La seconde moitié du même trou (relevée par FE-031, le 2026-08-25)

Le constat ci-dessus dit que **la liasse ne nomme pas sa balance**. En câblant le Bilan
actif/passif, FE-031 a buté sur le symétrique : **la balance ne nomme pas son exercice** — pas
celui du dossier, en tout cas, qui est pourtant le seul qui fasse foi.

### Ce que chacun publie

```ts
// balance-service — BalanceResponseDto
exercice: { debut: string; fin: string };   // ⛔ ANONYME : ni id, ni libellé

// dossier-service — ExerciceResponseDto (l'AUTORITÉ, depuis Q6)
{ id, dossierId, libelle, debut, fin, statut, origine, etatBalance?, etatLiasse?, … }
```

⛔ **Le read-model ne référence pas l'autorité.** `STORY-355` a retiré à `bilan-service` et à
`balance-service` le dernier mot sur les exercices — *« ils cessent d'être la source de vérité sur
le statut »* — mais leur vue n'a jamais reçu la clé qui pointe vers celui qui l'a pris.
Rapprocher une balance de l'exercice du dossier se fait donc **par comparaison de dates**, côté
client, sur deux bornes qui n'ont aucune raison contractuelle de coïncider au jour près.

### ⚡ Et le `libellé libre` déjà relevé plus haut devient une CLÉ D'ADRESSAGE

Le constat d'origine notait, sans en tirer de conséquence :

```ts
class CreerJeuEtatsDto {
  exercice!: string;          // libellé libre, ex. "2025"
```

Or `GET /dossiers/{id}/bilan/comparaison/exercices` (**FR-024**) adresse les exercices **par ce
libellé** :

> *« Libellés des exercices (2 à 5, séparés par des virgules). […] réponse triée par libellé
> croissant. »* — et `404 EXERCICE_NON_COMPARABLE` sur ce qu'il ne retrouve pas.

⇒ **Deux liasses du même exercice créées avec `"2025"` et `"Exercice 2025"` sont deux exercices
différents pour la comparaison.** Un libellé libre n'est pas un défaut d'ergonomie : c'est une clé
primaire de fait, saisie à la main, sur une route qui refuse ce qu'elle ne reconnaît pas. Le
dossier, lui, porte déjà un `libelle` unique et opposable.

### Ce que ça coûte aujourd'hui, concrètement

- **FE-031 (livrée)** : le comparatif N-1 se **désigne à la main**, par dates, parce que rien ne
  dit qu'une balance est le N-1 d'une autre. C'est honnête — l'écran ne devine rien — mais c'est un
  rapprochement que l'utilisateur fait à la place du système.
- **FE-076 (`blocked`)** : appellera `…/comparaison/exercices` avec des **libellés**. S'ils
  divergent de ceux du dossier, la route rendra `404` sur des exercices qui existent.
- **Le lien manquant est le même dans les deux cas**, ce qui est la raison d'absorber ici plutôt
  que de ficher une story voisine qui marcherait sur les mêmes DTO.

---

## Critères d'acceptation

- [ ] **AC-1 — La création de liasse NOMME sa balance.** `POST …/bilan/etats` accepte (voie B) ou
      résout (voie A) un `balanceId` du **dossier gardé**. Le champ est **requis** : une liasse sans
      provenance ne doit plus pouvoir être créée.
- [ ] **AC-2 — La provenance est FIGÉE dans le snapshot.** `SnapshotResponseDto` porte
      `balanceId`, `balanceVersion` et `balanceChecksum` (+ `checksumVersion`, STORY-147). Prouvé en
      base : revalider après une nouvelle version de balance ne réécrit pas le snapshot antérieur.
- [ ] **AC-3 — Le serveur refuse ce que l'écran refusait seul**, avec des `code` **distincts** :
      - balance `BROUILLON` ou `REJETÉE` → **409 `BALANCE_NON_VALIDEE`** ;
      - balance d'un **autre dossier** → **404** (jamais 403 : l'anti-énumération de STORY-357 ne se
        rouvre pas ici) ;
      - balance introuvable → **404**, réponse **identique** à la précédente.
- [ ] **AC-4 — Les codes sont PUBLIÉS, pas documentés en prose.** Enum OpenAPI, dans la forme posée
      par **STORY-375** : `openapi-typescript` ne fait qu'un commentaire d'une `description`, et un
      client ne peut alors écrire qu'un `Record<string, …>` qui accepte tout et n'exige rien.
      *Vérification par mutation : retirer un code doit CASSER la compilation du client.*
- [ ] **AC-5 — Le recalcul conserve la provenance.** `POST …/etats/:id/recalculer` ne peut pas
      changer de balance en silence : soit il exige la même, soit il exige un `balanceId` explicite et
      **journalise** le changement (`AuditType`, STORY-067).
- [ ] **AC-6 — La comparaison inter-exercices reste scopée.** Aucun chemin nouveau ne doit permettre
      d'atteindre un `jeuEtatsId` ou un `balanceId` hors du dossier gardé (invariant STORY-357,
      AC-7 : deux dossiers du même cabinet, aucune valeur en commun).
- [ ] ⬆️ **AC-8 — La balance NOMME son exercice du dossier.** `BalanceResponseDto` porte un
      `exerciceId` (et, à défaut de résolution serveur, le `libelle` de l'exercice) pointant vers
      `ExerciceResponseDto` de `dossier-service` — l'autorité posée par Q6 / STORY-355. ⛔ **Le
      couple `{debut, fin}` seul ne suffit pas** : deux bornes égales au jour près ne sont pas une
      référence, et rapprocher par dates fait décider au client ce que le serveur ne dit pas.
      *Vérification : deux exercices adjacents du même dossier, chacun avec sa balance — chaque
      balance rend l'`exerciceId` de la sienne, sans qu'aucune date ne soit comparée.*
- [ ] ⬆️ **AC-9 — Le libellé d'exercice d'une liasse CESSE D'ÊTRE LIBRE.** `CreerJeuEtatsDto.exercice`
      est résolu depuis l'exercice du dossier (ou validé contre lui), et non plus saisi. ⚡ **C'est
      une clé d'adressage, pas un intitulé** : `GET …/bilan/comparaison/exercices` retrouve les
      exercices **par ce libellé** et rend `404 EXERCICE_NON_COMPARABLE` sur ce qu'il ne reconnaît
      pas — `"2025"` et `"Exercice 2025"` y sont deux exercices distincts.
      *Vérification : créer deux liasses du même exercice par deux chemins, puis les confronter via
      `…/comparaison/exercices` — elles doivent être vues comme le MÊME exercice.*
- [ ] **AC-7 — Voie A seulement — le consumer est PROUVÉ VIVANT.** Poison-pill : un message à
      `balanceId` malformé ne doit pas bloquer la partition. Garde-fou `Types.ObjectId.isValid` dans
      l'enveloppe, comme STORY-036, et rejeu vérifié en docker.
      *(Un consommateur peut mourir définitivement dans un conteneur `healthy` — 22 messages bloqués
      4 jours sur `document-service`.)*

---

## Hors périmètre

- **Tout écran.** FE-028 est livrée et reste valable : la balance retenue passe de contexte client à
  lien serveur **sans que la maquette bouge**.
  ⚠️ ⬆️ **CORRECTION (2026-08-25) — cette ligne disait que FE-030/FE-031 « créent la première
  liasse ». C'est FAUX, et les deux sont livrées.** Les deux appellent des **`dry-run`**, qui ne
  persistent rien : `…/table-de-passage/dry-run` et `…/etats/bilan/dry-run`. **Aucune story
  frontend ne crée encore de liasse** — la persistance est STORY-064/065, sans consommateur
  frontend fiché. ⇒ Le volet « envoyer `balanceId`, lire les refus » appartient donc à **la story
  qui livrera la création d'une liasse**, laquelle **reste à ficher**. Ne pas la supposer couverte.
- ⬆️ **La refonte du modèle d'exercice** (`dossier-service`) : AC-8/AC-9 demandent de **référencer**
  l'autorité, pas de la déplacer. Q6 n'est pas rouverte.
- **Reprise de données** : aucune liasse n'est produite depuis un écran à ce jour.
- Le calcul comptable lui-même (EPIC-011/011B, `done`).

---

## Definition of Done

- [ ] AC validés ; **vérifié docker bout-en-bout**, pas seulement en test.
- [ ] `lint` / `build` / unit / e2e verts, seuils de couverture tenus.
- [ ] OpenAPI régénéré et **relu** : les nouveaux codes sortent en `enum`, pas en commentaire.
- [ ] Ticket d'origine stampé « résolu par STORY-381 ».
- [ ] Trackers à jour (`sprint-status.yaml`, `tickets/README.md`).
- [ ] **Renvoi au frontend** : signaler que `balanceId` devient requis — une story backend livrée ne
      déclenche rien tant qu'une story frontend ne la nomme pas. ⬆️ **(2026-08-25)** Destinataires
      corrigés : **FE-031** *(livrée — sa clé de cache porte le `balanceId` PARCE QUE le serveur ne
      le connaît pas ; l'AC-8 lui permettra de DÉSIGNER le comparatif au lieu de le faire désigner
      par l'utilisateur)*, **FE-076** *(`blocked` — appellera `…/comparaison/exercices` par
      libellés, que l'AC-9 rend fiables)*, et **la story de création de liasse, qui reste à
      ficher**.

---

## Progress Tracking

- **2026-08-25** — arbitrage d'architecture rendu par le PO **avant** dev-story : **voie A′**
  (read-model de métadonnées alimenté par Kafka, sans client HTTP sortant). Voies A et B écartées,
  motifs consignés au § *ARBITRAGE RENDU*. Branches `MNV-381` ouvertes sur `docs/` (base `main`),
  `bilan-service` et `balance-service` (base `dev`).

### Dev — voie A′ livrée sur 2 dépôts (2026-08-25)

**`balance-service`** — `Balance.exerciceId` résolu **serveur** au dépôt depuis `exercices_dossier`, sur la
**même clé exacte `{orgId, dossierId, debut, fin}` qu'`estClos`** (une seule règle de rapprochement dans le
service) · `BalanceResponseDto.exerciceId` · `balance.created` gagne `exerciceId` + `checksumVersion`
(additifs, `schemaVersion` inchangé) · **nouveau topic `balance.etat.document.change`**, publié
**inconditionnellement** dans la transaction de `marquerEtat`, pré-créé au boot.

**`bilan-service`** — read-model `balances_balance` (métadonnées seules, **aucune ligne dupliquée**),
consumer group dédié `bilan-balance`, `fromBeginning`, validation d'enveloppe dans un fichier **couvert**
(`balance-payload.util.ts`, jamais dans le `*bootstrap*`) · `BalancesDossierRepository` scopé
`{orgId, dossierId}` · `CreerJeuEtatsDto` : `balanceId` **requis**, `exercice` **supprimé** ·
`RecalculerJeuEtatsDto.balanceId` requis et **identique** · provenance figée sur le jeu **et** le snapshot ·
`CODES_REFUS_JEU_ETATS` publié en `enum` OpenAPI (`enumName: CodeRefusJeuEtats`, forme STORY-375).

#### ⚡⚡ Le point de conception qui a décidé de tout : `balance.created` n'ÉCRASE PAS l'état

Deux topics alimentent **une même clé** de read-model, et l'un d'eux porte un état de **naissance**. Posé par
un `$set` ordinaire, un **rejeu** de la création — marqueur `ProcessedEvent` purgé au TTL, reset d'offsets,
`fromBeginning` sur un group neuf — **dé-validerait** une balance déjà validée, et `bilan-service` refuserait
alors `409 BALANCE_NON_VALIDEE` une liasse parfaitement légitime, **sans qu'aucune erreur ne soit levée nulle
part**. D'où `$setOnInsert` pour l'état de naissance et `$max` pour `occurredAt` (l'horloge métier ne recule
pas). *Prouvé en docker ci-dessous.*

### Portes de qualité

| | `bilan-service` | `balance-service` |
|---|---|---|
| lint | 0 warning | 0 warning |
| build | OK | OK |
| unit | **1 131** verts (1 skipped) | **3 044** verts |
| e2e | **284** verts (21 suites) | **714** verts (26 suites) |
| couverture | 98,69 st / 93,68 br / 98,39 fn / 98,64 li | 98,98 st / 91,84 br / 98,18 fn / 99,06 li |

### 🪤 Mutation-testing — 10 mutations, chacune vérifiée ROUGE puis restaurée

| # | Mutation | Test qui rougit |
|---|---|---|
| M1 | `etatDocumentChange` hérite du silence `A_NOUVEAUX` | `⚡ publie QUAND MÊME l'état du DOCUMENT pour un socle d'à-nouveaux` |
| M2 | l'`exerciceId` résolu n'atteint plus `buildCanonique` | `⚡ résout l'exercice…` + `⚡ le handoff porte la balance ESTAMPILLÉE` |
| M3 | `exerciceId` retiré de la **liste blanche** de `repo.insert` | `insert construit le document…` |
| M4 | `$setOnInsert` → `$set` sur l'état de naissance | `⚡ balance.created pose BROUILLON en $setOnInsert` |
| M5 | `dossierId` retiré du filtre de `BalancesDossierRepository` | `filtre sur (org, dossier, balance)` |
| M6 | la garde d'état `VALIDÉE` désarmée | 3 unitaires + 2 e2e `BALANCE_NON_VALIDEE` |
| M7 | la garde de provenance passe **après** la production de la liasse | `⛔ ne produit même PAS la liasse quand la provenance est refusée` |
| M8 | `balanceId` retiré du payload de `snapshots.creer` | 1 unitaire + 1 e2e `AC-2` |
| M9 | `refuserSiAutreBalance` désarmée | 1 unitaire + 1 e2e `BALANCE_DIFFERENTE` |
| M10 | `estObjectId` → `Types.ObjectId.isValid` | `⚡ refuse un balanceId NUMÉRIQUE` |

⚠️ **Deux premières tentatives de M1/M2 écartées** : elles rendaient `Tests: 0 total` — un **échec de
compilation**, qui ne prouve rien (leçon STORY-179/STORY-385). Reformulées pour compiler et n'altérer que
le comportement.

### ✅ Vérification docker — stack NEUVE (`down -v`), bout en bout, 2026-08-25

Chaîne réelle : `auth-service` → `dossier-service` (dossier + exercice) → `balance-service` (dépôt +
validation) → Kafka → `bilan-service` (read-model + liasse). KYC/entitlements amorcés en base.

| Preuve | Résultat mesuré |
|---|---|
| **AC-8** — la balance nomme son exercice | `balances.exerciceId = ObjectId('6a8e13ae…45a6')` = l'`_id` de l'exercice ouvert dans `dossier-service`. **Aucune date comparée.** |
| **Round-trip `balance.created`** | `bilan_service.balances_balance` : `{balanceId, dossierId, exerciceId, etat:'BROUILLON', version:1, checksum, checksumVersion:'v2', source:'direct'}` — le consommateur que STORY-099 annonçait et qu'EPIC-009 avait emporté |
| **AC-3a** — balance `BROUILLON` | `409 BALANCE_NON_VALIDEE` (l'écran n'est plus seul à refuser) |
| **Nouveau topic `balance.etat.document.change`** | après `POST /balances/:id/valider` → read-model `etat:'VALIDÉE'`, `occurredAt` avancé de `22:15:15` à `22:15:50` |
| **AC-1 + AC-9** | liasse créée : `exercice:'2025'` **résolu du dossier** (jamais saisi), `exerciceId`, `balanceId`, `balanceVersion:1`, `balanceChecksumVersion:'v2'` |
| **AC-6** — balance d'un **autre dossier** | `404 BALANCE_INTROUVABLE`, corps **identique** à celui d'une balance inexistante (`requestId` mis à part) |
| **AC-5** — recalcul sur une autre balance | `409 BALANCE_DIFFERENTE` |
| **AC-2** — provenance figée | `snapshots_liasse` v1 : `balanceId`, `balanceVersion:1`, `balanceChecksum:'68c59940…'`, `balanceChecksumVersion:'v2'`, `exerciceId` — **distinct** du `checksum` du paquet de référentiel (`d7d96063…`) |
| **AC-2 — immutabilité** | balance **v2** déposée, puis jeu rouvert + re-validé ⇒ snapshots `[v1, v2]`, **tous deux** sur `balanceVersion: 1`. Le snapshot v1 est **inchangé** ; la v2 de la balance ne s'est pas substituée en silence |
| **AC-7 — poison-pill** | 2 messages empoisonnés publiés sur le topic (`balanceId` malformé, puis JSON illisible) → `WARN … ignoré` ×2, `balances_balance = 2` (aucun fantôme), `processed_events{eventId:'poison-381'} = 0`. Le message **valide publié APRÈS** a été consommé ⇒ **la partition n'était pas bloquée** |
| ⚡⚡ **Rejeu de `balance.created` sur une balance DÉJÀ VALIDÉE** | `eventId` neuf (= marqueur purgé) : `etat` reste **`VALIDÉE`** et `occurredAt` **ne recule pas** (`22:15:50`, pas `22:15:15`). C'est la preuve du `$setOnInsert` + `$max` — en `$set`, la balance aurait été dé-validée |

Stack arrêtée (`docker compose stop`) après consignation.

### ⚠️ Conséquence assumée de l'option retenue pour l'AC-5 — à ficher

L'AC-5 offrait deux formes : *« soit il exige la même [balance], soit il exige un `balanceId` explicite et
**journalise** le changement »*. **La première a été retenue** — la plus simple, et celle qui ne peut pas
mentir sur la provenance. Il faut nommer ce qu'elle ferme, plutôt que de le laisser se découvrir en
production :

> **Une liasse est liée à sa balance de façon définitive.** `recalculer` refuse une autre balance
> (`409 BALANCE_DIFFERENTE`), l'index unique `(tenantId, dossierId, exercice)` refuse une seconde liasse
> sur le même exercice (`409 EXERCICE_A_DEJA_UN_JEU`), et **aucune route ne supprime un jeu d'états**
> (`grep -n "@Delete" jeu-etats.controller.ts` ⇒ 0). ⇒ **La première balance qui produit une liasse pour un
> exercice la produit pour toujours** : déposer une balance corrigée (v2) puis vouloir en tirer la liasse
> n'a aucun chemin.

⚠️ **Le contournement apparent est pire que le blocage** : `recalculer` accepte n'importe quels `soldesN`
tant que le `balanceId` ne bouge pas. On peut donc y coller les chiffres de la v2 — et la liasse porterait
alors une provenance qui **dément** ses propres nombres. C'est le seul cas où la provenance figée par
l'AC-2 deviendrait fausse, et il vient de là.

⇒ **Story à ficher (numéro non attribué ici — le PO tranche) : « une liasse peut suivre une nouvelle version
de sa balance »**, dans la seconde forme de l'AC-5 : `recalculer` accepte un `balanceId` différent **s'il
désigne une balance `VALIDÉE` du même dossier ET du même `exerciceId`**, met à jour la provenance et
**journalise** le changement (`AuditType`, STORY-067). Un `balanceId` d'un autre exercice doit rester refusé
— sinon le libellé du jeu, et l'index d'unicité qui porte dessus, deviendraient faux.

Rien n'est bloqué **aujourd'hui** : *Hors périmètre* le rappelle, aucune story frontend ne crée encore de
liasse. Ce n'est donc pas un correctif à empiler ici, c'est un manque à **ficher avant** la story qui livrera
la création d'une liasse depuis un écran.

### ⑥⑦ Revues de code et de sécurité — 9 constats, 7 corrigés, 2 fichés

Scans délégués (`prospera-code-review` ⑥ + `prospera-security-review` ⑦), **fusion, filtrage, correctifs et
décision de merge conduits en session `opus`**.

#### Corrigés — commit de revue dédié

| # | Constat | Ce qu'il cassait | Correctif |
|---|---|---|---|
| **S2** ⛔ | `required: true` sur 4 champs de `SnapshotLiasse` | `SnapshotLiasseRepository.creer` passe par `model.create()`, **qui exécute les validateurs**. Un jeu d'états créé AVANT la story ne porte aucune provenance ⇒ `POST …/etats/:id/valider` rendait **500**, **définitivement**, sur **tout jeu déjà en base** — sur le chemin même qui produit le livrable comptable | `@Prop()` optionnels (le vrai filet est sur `JeuEtats`, écrit à chaque création) + `snapshot-liasse.schema.spec.ts` qui éprouve le **vrai** schéma Mongoose |
| **C1** ⛔ | `refuserSiAutreBalance` comparait `jeu.balanceId.toString()` à la chaîne brute du corps | `ObjectId.toString()` rend **toujours** des minuscules ; `@EstObjectId()` accepte **délibérément** les MAJUSCULES (STORY-405). La **même** balance recopiée d'un export était refusée `409 BALANCE_DIFFERENTE`, avec un geste qui aurait créé un doublon | `.equals()` + test unitaire **et** e2e sur un identifiant en majuscules |
| **C2** ⛔ | `CODES_REFUS_JEU_ETATS` s'annonçait exhaustif et omettait **7 codes** atteignables (`DOSSIER_ID_INVALIDE`, `DOSSIER_INTROUVABLE`, `DOSSIER_ARCHIVE`, les 4 `REFERENTIEL_*`) | Le contrat **déclarait** fermé ce qui ne l'était pas : un client écrivant `Record<CodeRefusJeuEtats, string>` recevait des valeurs hors de son union — le défaut exact que l'AC-4 existe pour fermer | inventaire complété **et** `jeu-etats.codes.exhaustivite.spec.ts` qui **balaie les sources** et rougit sur tout code émis non inscrit (l'angle mort des codes posés par constante y est **déclaré**, pas subi) |
| **C7** | `BALANCE_SANS_EXERCICE` fondait deux causes | Pour la seconde — la balance NOMME un exercice que ce service n'a pas encore projeté — le geste « ouvrir l'exercice, puis re-déposer » est **faux** : l'exercice est déjà ouvert, le rouvrir est un no-op | code distinct **`EXERCICE_NON_PROJETE`** (geste : réessayer) |
| **C4** | `valider` ne revérifiait pas la provenance, `recalculer` si | asymétrie non expliquée sur le chemin qui rend la liasse **opposable** | garde ajoutée à `valider` — et ⚠️ **les deux commentaires corrigés** : `VALIDÉE` est **terminal** chez le producteur (mesuré : `409 BALANCE_DEJA_VALIDEE`), ces gardes sont **défensives**, pas vivantes. Le motif écrit d'abord (« elle a pu être REJETÉE entre-temps ») était faux |
| **C5** | « Lu dans la session » alors que `resoudreExerciceId` n'accepte aucune `session` | affirmation fausse qui se lit comme une garantie | commentaire corrigé (lecture hors session, et pourquoi c'est légitime) |
| **C6** | `recalculer` pouvait rendre `404 BALANCE_INTROUVABLE` non déclaré | le client n'a pas de branche pour un read-model en rattrapage | `@ApiNotFoundResponse` + descriptions complétées sur `creer`, `recalculer` **et** `valider` |
| **S1** | La prose disait « SHA-256 de la balance source » | Le sceau prouve **quelle balance a été déclarée**, pas **que les soldes en sortent** — dans la voie A′ les soldes viennent du corps de la requête. Sur un artefact dit « opposable », l'écart compte | `MENTION_PORTEE_DU_SCEAU`, publiée dans le contrat OpenAPI et reprise dans les docstrings |

Plus, de la lentille anti-sur-ingénierie : alias `ETAT_A_LA_NAISSANCE` (deux noms pour une valeur) et type
`BalanceTopic` (exporté, jamais lu) supprimés ; `balance-events.spec.ts` ajouté — il fige les **deux
littéraux de topic** et interdit `balance.etat.change` dans l'abonnement (le contrat à 2 dépôts n'a que ces
chaînes pour se tenir).

#### Écartés, motif consigné

- **Rapprochement réel soldes ↔ balance** (fond du constat S1) : exige un `soldesChecksum` publié par
  `balance-service` ⇒ **2 dépôts, un contrat d'événement de plus**. Hors périmètre de cette story ; à ficher
  avec le manque AC-5 ci-dessus.
- **`refuserSiExerciceClos` s'adresse encore par libellé** alors que `jeu.exerciceId` existe désormais :
  faiblesse **pré-existante** que cette story **réduit** (le libellé cesse d'être libre, donc la jointure ne
  peut plus rater) sans l'aggraver. Durcissement possible, pas un correctif dû ici.

#### Mutations supplémentaires (11 → 14), chacune vérifiée rouge puis restaurée

| # | Mutation | Test qui rougit |
|---|---|---|
| M11 | `required: true` remis sur `SnapshotLiasse.balanceId` | `⚡ accepte un snapshot SANS provenance` |
| M12 | retour à `toString() !== balanceId` | `⚡ recalcul sur la MÊME balance écrite en MAJUSCULES` |
| M13 | un code retiré de l'inventaire | `⚡ tout code émis par les sources figure dans l'inventaire` |
| M14 | garde de provenance retirée de `valider` | `⚡ balance REJETÉE depuis la création → 409` |

### ✅ Vérification docker REJOUÉE sur l'état final (les correctifs touchaient un chemin déjà mesuré)

⚠️ Le hot-reload peut annoncer « Found 0 errors » en exécutant l'ancien module : la première mesure prouve
donc que **le nouveau code tourne**.

| Preuve | Résultat |
|---|---|
| **AC-4 sur l'OpenAPI RÉEL** (pas la source) | `GET /api/docs-json` → `enum CodeRefusJeuEtats` = **26 codes**, dont `DOSSIER_ARCHIVE`, `REFERENTIEL_UNRESOLVED`, `EXERCICE_NON_PROJETE` |
| **Constat C1 fermé** | recalcul avec le **même** `balanceId` en MAJUSCULES → **200** (rendait `409 BALANCE_DIFFERENTE` avant) |
| **AC-3 rejoué** | balance `BROUILLON` → `409 BALANCE_NON_VALIDEE` |
| **AC-1 / AC-9 rejoués** | 2ᵉ dossier, exercice ouvert, balance déposée+validée → liasse créée, `exercice: '2025'` **résolu**, provenance publiée |
| **AC-2 rejoué sur le code final** | `valider` (qui revérifie désormais la provenance) → `200`, snapshot figé avec `balanceId`/`balanceVersion`/`balanceChecksumVersion`/`exerciceId` |
| **AC-6 au niveau des données** | les 3 snapshots des 2 dossiers ne partagent **aucune** valeur : `balanceId` et `exerciceId` distincts par dossier |
| ⚡ **Atteignabilité de la garde C4, mesurée** | `POST /balances/:id/rejeter` sur une balance `VALIDÉE` → **`409 BALANCE_DEJA_VALIDEE`** ⇒ `VALIDÉE` est **terminal**, la garde est **défensive**. Écrit tel quel dans le code, plutôt que de lui prêter une menace vivante |

Stack arrêtée après consignation.
