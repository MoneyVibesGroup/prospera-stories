# TICKET-BACKEND — la liasse ne référence pas la balance dont elle sort

> ✅ **RÉSOLU par [STORY-381](../stories/STORY-381.md), clôturée le 2026-08-25** — PR
> `prospera-balance-service`#55 + `prospera-bilan-service`#50 rebase-mergées **ensemble** sur `dev`
> (changement de contrat d'événement ⇒ 2 dépôts).
>
> Les trois conséquences décrites plus bas sont fermées : la liasse **déclare** sa balance
> (`balanceId` requis, figé au snapshot avec `balanceVersion`/`balanceChecksum`), le serveur **refuse**
> ce que seul l'écran refusait (`409 BALANCE_NON_VALIDEE`, `404 BALANCE_INTROUVABLE` sur un autre
> dossier), et le libellé d'exercice **cesse d'être libre** (résolu depuis l'exercice du dossier).
>
> ⚠️ **Une limite subsiste, nommée dans la story** : la provenance est *déclarée puis vérifiée*, jamais
> *recalculée* — le sceau prouve **quelle balance a été déclarée**, pas que les soldes en sortent. Le
> rapprochement réel demande un `soldesChecksum` publié par `balance-service` : story à ficher.
>
> ➡️ **REPRIS le 2026-08-22** par cette même story. Ce fichier est conservé pour tracer l'origine et ne
> se modifie plus.

**Cible :** backend (`bilan-service`, accessoirement `balance-service`)
**Ouvert par :** **FE-028** (module Bilan — shell, gate et choix de la balance source),
barry thierno alhassane, le **2026-08-22**
**Découvert :** à la conception de l'écran de choix de la balance source, en lisant le contrat réel de
`:3004` (`/api/docs-json`, stack docker `origin/dev`).

---

## Le constat

`POST /api/v1/dossiers/{dossierId}/bilan/etats` — la route qui crée une liasse — attend un
**tableau de `soldesN` bruts** :

```ts
class CreerJeuEtatsDto {
  exercice!: string;          // libellé libre, ex. "2025"
  soldesN!: LigneSoldeDto[];  // ← les soldes, détachés de leur origine
  soldesN1?: LigneSoldeDto[];
}
```

**Il n'existe aucun `balanceId` dans tout `bilan-service`** (`grep -rn "balanceId" src` → 0 résultat
hors specs). Le service ne tient aucun read-model de balance, et n'a aucun consumer :
`src/modules/read-models/` porte `dossier`, `entitlement`, `exercice`, `kyc-status` — **pas
`balance`**.

## Ce n'était pas un oubli, c'était un report — et le report s'est perdu

**STORY-099** (livrée le 2026-07-17) a posé le producteur : `balance-service` émet `balance.created`
par outbox transactionnelle, avec un payload allégé `{ orgId, balanceId, exercice, source,
referentiel, version, checksum, statutPreuve }`. Sa propre fiche décrit le consommateur, au futur :

> **[Différé EPIC-009]** `bilan-service` consomme `balance.created` (group `bilan-balance`),
> déduplique par `eventId`, puis **relit la balance complète** via `GET /balances/:balanceId` → table
> de passage (STORY-055) → liasse (STORY-059+) → DSF (STORY-073).

**EPIC-009 est `superseded` depuis D14 (2026-07-12)** — cinq jours *avant* la livraison de STORY-099.
La production de la balance a quitté `bilan-service` pour devenir le CORE de `balance-service`, et
avec elle **tout ce qui était « différé EPIC-009 »**, dont ce consommateur. Il n'a été re-slotté
nulle part.

⚡ **C'est le motif inverse de STORY-374, et le même mécanisme.** Là-bas, un read-model était écrit et
lu par personne. Ici, un **événement est émis et consommé par personne** — et dans les deux cas, un
commentaire renvoyait à une story qui ne l'a jamais fait. Rien ne rougit : `balance.created` part,
l'outbox le marque `SENT`, et il tombe dans le vide.

## Trois conséquences, aujourd'hui, en production

1. **La liasse ne peut pas dire d'où elle vient.** Ni `balanceId`, ni `version`, ni `checksum`. Un
   snapshot validé (STORY-064/065) fige `soldesN`, donc les *chiffres* — jamais leur **provenance**.
   Pour un livrable **opposable**, c'est le maillon manquant de la piste d'audit : « sur quelle
   balance cette liasse a-t-elle été établie ? » n'a pas de réponse dans les données.
2. **Le serveur ne peut refuser aucune balance.** « Seule une balance `VALIDÉE` peut porter une
   liasse » est une règle que **seul l'écran** applique (FE-028). Un appel direct avec les soldes
   d'un brouillon passe. Pire : rien n'empêche de poster dans le dossier A des soldes lus dans le
   dossier B — le `DossierGate` de STORY-357 vérifie le dossier de la *requête*, pas l'origine des
   *nombres*.
3. **Le front porte un contexte que le serveur ignore.** FE-028 retient la balance source dans l'URL
   et le stockage local, faute de pouvoir la déclarer. Ça marche pour un écran ; ça ne survivra pas à
   FE-031 → FE-038, qui doivent renvoyer les soldes eux-mêmes à chaque recalcul.

## Ce qui est demandé (esquisse — la story tranche)

- Un **`balanceId` porté par le jeu d'états**, posé à la création et **figé dans le snapshot** avec
  la version et le checksum de la balance — la traçabilité, pas seulement le chiffre.
- Un **refus serveur** quand la balance nommée n'est pas `VALIDÉE`, ou n'appartient pas au dossier
  gardé, avec un `code` stable et **déclaré à l'OpenAPI** (STORY-375 : documenter un code en prose ne
  le publie pas).
- La **source des soldes** : soit `bilan-service` relit la balance (consumer `balance.created` +
  read-model, comme STORY-099 le prévoyait), soit le client continue de les envoyer **avec** la
  référence, et le serveur vérifie la concordance par le checksum. **Arbitrage d'architecture dû.**

## Ce que ce ticket ne demande PAS

- Aucun changement d'écran. FE-028 est livrée et reste valable : la balance retenue devient un lien
  serveur au lieu d'un contexte client, sans que la maquette bouge.
- Aucune reprise de données : aucune liasse n'est produite à ce jour depuis un écran.
