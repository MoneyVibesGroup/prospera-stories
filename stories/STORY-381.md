# STORY-381 : La liasse déclare la balance dont elle sort — et le serveur refuse celles qui ne peuvent pas la porter

**Epic :** EPIC-043 — Le dossier client, unité de travail du cabinet
**Service :** `bilan-service` *(lecture d'un contrat de `balance-service`)*
**Sprint :** 20 · **Story Points :** 5 · **Complexité :** medium
**Priorité :** Must Have
**Ticket d'origine :** `tickets/TICKET-BACKEND-bilan-ne-reference-pas-sa-balance-source.md`
**Découverte par :** **FE-028** *(module Bilan — shell, gate, choix de la balance source)*, le 2026-08-22
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
- [ ] **AC-7 — Voie A seulement — le consumer est PROUVÉ VIVANT.** Poison-pill : un message à
      `balanceId` malformé ne doit pas bloquer la partition. Garde-fou `Types.ObjectId.isValid` dans
      l'enveloppe, comme STORY-036, et rejeu vérifié en docker.
      *(Un consommateur peut mourir définitivement dans un conteneur `healthy` — 22 messages bloqués
      4 jours sur `document-service`.)*

---

## Hors périmètre

- **Tout écran.** FE-028 est livrée et reste valable : la balance retenue passe de contexte client à
  lien serveur **sans que la maquette bouge**. Le volet frontend (envoyer `balanceId`, lire les refus)
  appartient à **FE-030/FE-031**, qui créent la première liasse.
- **Reprise de données** : aucune liasse n'est produite depuis un écran à ce jour.
- Le calcul comptable lui-même (EPIC-011/011B, `done`).

---

## Definition of Done

- [ ] AC validés ; **vérifié docker bout-en-bout**, pas seulement en test.
- [ ] `lint` / `build` / unit / e2e verts, seuils de couverture tenus.
- [ ] OpenAPI régénéré et **relu** : les nouveaux codes sortent en `enum`, pas en commentaire.
- [ ] Ticket d'origine stampé « résolu par STORY-381 ».
- [ ] Trackers à jour (`sprint-status.yaml`, `tickets/README.md`).
- [ ] **Renvoi au frontend** : signaler à FE-030/FE-031 que `balanceId` devient requis — une story
      backend livrée ne déclenche rien tant qu'une story frontend ne la nomme pas.
