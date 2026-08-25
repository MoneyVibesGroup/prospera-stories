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
**Status :** `ready-for-dev`

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
