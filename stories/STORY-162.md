> # ⛔ STORY REMPLACÉE — NE PAS IMPLÉMENTER
>
> **Remplacée le 2026-08-03** (décision PO) par le re-découpage du Module 2 : **STORY-278, STORY-279**.
>
> Cette story appartenait au découpage `EPIC-004 (rescopé)` (18 stories, 104 pts). Le découpage en
> vigueur est **EPIC-035 → EPIC-042 / STORY-237 → STORY-290** (54 stories, 196 pts), sprints 31→38.
> Le contenu ci-dessous **reste une bonne source de contexte métier** — c'est pour cela qu'il n'est pas
> supprimé — mais **son périmètre, son estimation et son sprint ne font plus foi**.
>
> 📄 Découpage en vigueur : [`epics-paiement-2026-08-03.md`](../epics-paiement-2026-08-03.md)
> 📐 Architecture : [`ARCHITECTURE-SPINE.md`](../architecture/architecture-paiement-service-2026-08-03/ARCHITECTURE-SPINE.md) (AD-1 → AD-18)
> 🗂️ Motif détaillé : `superseded_stories` dans [`sprint-status.yaml`](../sprint-status.yaml)

---

# STORY-162 : Octroi d'entitlements à l'encaissement — **par événement**, sans identité de service (tranche C8)

**Epic :** EPIC-004 — `paiement-service` (PI-SPI & encaissement) · **traverse** EPIC-007 (`platform-catalog-service`)
**Réf. PRD :** [`prds/prd-paiement-service-2026-08-02/prd.md`](../prds/prd-paiement-service-2026-08-02/prd.md) §6 FR-P44 · §13 **Q9**
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` §Authentification inter-services **C8** *(point ouvert depuis 2026-07-07)* · `architecture-prospera-ecosystem-2026-07-04.md` §Contrats d'événements
**Réf. code livré :** **STORY-033** (`EntitlementsService.upsert` — **upsert idempotent, état absolu**, déjà écrit et testé) · **STORY-034** (outbox + topic `entitlement.changed`) · **STORY-021** (patron consumer Kafka `kyc-service`) · **STORY-150** (outbox `paiement-service`)
**Remplace :** `STORY-039` *(« expert-comptable : octroi d'entitlement catalog à l'activation d'abonnement (C8) », jamais rédigée — l'émetteur est désormais `paiement-service`, pas le vertical)*
**Dépend de :** STORY-161
**Débloque :** STORY-163 (la suspension révoque par le même chemin)
**Priorité :** Must Have
**Story Points :** 8
**Complexité :** high — **story à deux services**, et elle tranche une décision ouverte depuis 13 mois
**Statut :** ⛔ **superseded (2026-08-03)** — remplacée par STORY-278, STORY-279
**Assigné à :** null
**Créée le :** 2026-08-02
**Sprint :** ~~aucun~~ — retirée des sprints le 2026-08-03 (elle occupait le S31→S34)
**Service :** `paiement-service` (`:3005`) **+** `platform-catalog-service` (`:3003`)
**Couvre :** FR-P44 · **tranche C8**

---

## Contexte — la décision C8, enfin

`C8` — *« comment le billing d'un vertical authentifie-t-il son octroi d'entitlement auprès du
catalogue ? »* — est ouverte depuis le **2026-07-07**. `STORY-034` l'a différée avec un motif solide :

> *« L'IdP n'expose aucun grant `client_credentials`/M2M aujourd'hui, et le seul appelant réel est
> STORY-039. Implémenter un jeton de service maintenant serait **spéculatif** et **non vérifiable
> bout-en-bout**. »*

**Le motif tient toujours** : vérifié dans le code le 2026-08-02, aucune identité de service n'existe.
Dix stories le confirment — `STORY-047/048` relaient le bearer de l'administrateur humain,
`STORY-102` s'est rabattue sur un `sourceSystem` déclaré.

### La décision : option A — l'événement, pas l'appel

**`paiement-service` publie l'état absolu attendu ; le catalogue le consomme et l'applique.**

| Ce que ça exige | État |
|---|---|
| Un grant M2M dans l'IdP | ❌ **rien** |
| Un secret partagé | ❌ **rien** — l'invariant *« RS256/JWKS, pas de secret partagé »* est préservé |
| Un nouveau bus | ❌ **rien** — Kafka est déjà le seul bus inter-services |
| Un nouveau patron | ❌ **rien** — outbox transactionnel, livré 4 fois |

> ⚡ **Pourquoi c'est mieux qu'un appel synchrone, et pas seulement plus simple :** l'outbox rend
> l'octroi **atomique avec l'encaissement** et **rejouable**. Un appel REST ne garantit ni l'un ni
> l'autre — si l'appel échoue après que l'argent est encaissé, le client a payé et n'a rien.

**Le coût assumé :** l'octroi est **asynchrone**, quelques secondes. Personne ne paie un abonnement en
surveillant un chronomètre.

---

## User Story

**En tant que** client Prospera qui vient de payer son abonnement,
**je veux** que mes modules s'ouvrent sans que personne n'ait à cliquer,
**afin de** commencer à travailler.

**En tant qu'**équipe plateforme,
**je veux** que cet octroi ne dépende d'aucune capacité d'authentification que nous n'avons pas,
**afin de** ne pas construire un mécanisme spéculatif pour un seul appelant.

---

## Périmètre

### A. Côté `paiement-service` — publier l'état absolu

À l'encaissement d'une échéance, publication via l'**outbox transactionnel** (couture posée en
`STORY-150`) :

| Champ de l'événement | Note |
|---|---|
| `organizationId` | **Clé de partition** — même choix que `entitlement.changed` |
| `modules[]` | Avec `versionCode`, `referentiel`, `config` — **l'état absolu attendu** |
| Origine | Référence d'abonnement + référence d'encaissement |
| Horodatage, version de contrat | — |

> ⚡ **État absolu, pas différentiel** — c'est la décision `C7` déjà prise pour `entitlement.changed`.
> Un événement dit **ce qui doit être vrai**, pas ce qui change. Rejouable sans effet de bord.

⚠️ **`paiement-service` ne connaît pas le catalogue.** Il ne sait pas si un module existe, ni si une
version est retirée. Il publie **ce que l'abonnement stipule** ; la validation appartient au catalogue.

### B. Côté `platform-catalog-service` — consommer et appliquer

Un **consumer** applique l'événement en appelant `EntitlementsService.upsert()` — **déjà écrit,
idempotent, en état absolu, validé de cohérence contre le registre** (`STORY-033`).

**La couture existe** : `STORY-033` a laissé `upsert()` public et testé, `STORY-034` y a branché la
publication. Cette story y branche une **seconde source d'entrée**.

| Cas | Comportement |
|---|---|
| Module inexistant ou `RETIRED` | **Refus**, tracé, **remonté en anomalie** — l'encaissement reste valide, l'octroi non |
| Module `DEPRECATED` | Accepté (règle `STORY-033`) |
| Événement rejoué | **Aucun effet** — upsert idempotent |
| Événement en désordre | L'état absolu le rend inoffensif |

L'upsert publie ensuite `entitlement.changed` comme d'habitude : **les consommateurs existants ne
changent pas**.

### C. Le filet — l'octroi ne disparaît jamais en silence

Si l'événement est refusé (module retiré, organisation inconnue), l'octroi **n'échoue pas dans le
vide** : il apparaît comme **octroi en attente** dans `admin-panel`, où un `PLATFORM_ADMIN` peut le
traiter manuellement — chemin qui **existe déjà** et qui couvre le dogfooting.

> C'est l'option **C** de l'analyse, conservée comme **filet** et non comme mécanisme principal.

### D. Ce que cette story ne fait pas

**Aucune identité de service n'est créée.** La dette reste ouverte et tracée — elle solderait trois
contournements (l'octroi synchrone, le BFF `admin-panel` qui relaie un jeton humain, le `sourceSystem`
de `STORY-102`). Elle appartient à `auth-service`, pas ici.

---

## Critères d'acceptation

1. L'encaissement d'une échéance publie l'événement via l'outbox, **atomiquement** — un `abort()`
   provoqué n'enregistre ni l'encaissement ni l'événement.
2. L'événement porte l'**état absolu** des modules attendus, pas un différentiel.
3. Le catalogue consomme et **octroie** ; les entitlements sont visibles par `GET /entitlements/:orgId`.
4. ⚡ **Rejouer l'événement 20 fois** ne produit **aucun changement** après le premier — upsert idempotent.
5. ⚡ Deux événements **dans le désordre** aboutissent à l'**état absolu du dernier émis**, pas à un
   état mélangé.
6. Un module `RETIRED` est **refusé**, tracé, et remonté comme **octroi en attente** dans `admin-panel`.
7. Un module `DEPRECATED` est **accepté** (règle STORY-033 inchangée).
8. L'octroi déclenche `entitlement.changed` : **les consommateurs existants** (`bilan-service` gate
   STORY-036, console) le reçoivent **sans modification**.
9. ⚡ **Aucun appel HTTP** de `paiement-service` vers `platform-catalog-service` — vérifié par absence
   de client HTTP et par inspection du trafic réseau.
10. ⚡ **Aucun secret partagé, aucune clé d'API** entre les deux services — vérifié en configuration.
11. Le délai entre encaissement et ouverture effective des modules est **mesuré et restitué** ; il est
      annoncé comme asynchrone dans la réponse au client.
12. Le chemin d'octroi manuel `PLATFORM_ADMIN` reste **fonctionnel et inchangé**.

---

## Notes techniques

### Story à deux services

Elle modifie `paiement-service` **et** `platform-catalog-service`. Convention du dépôt : le champ
`Service` porte les deux, comme `STORY-084` (`balance-service+document-service`). Deux branches
`MNV-162`, **mergées ensemble** — le consumer sans l'émetteur est mort, l'émetteur sans le consumer
publie dans le vide.

### Pourquoi ne pas mettre la logique d'abonnement dans le catalogue

Le catalogue ne doit **rien savoir** du paiement. Il reçoit *« ces entitlements doivent exister »*,
pas *« un abonnement a été payé »*. C'est ce qui garde la frontière propre : `paiement-service` sait
quels modules un abonnement ouvre ; le catalogue sait si ces modules existent.

### Ce qui rend la décision réversible

Le jour où une identité de service existera, l'appel synchrone pourra **s'ajouter** sans rien défaire :
l'upsert du catalogue est le même point d'entrée. Aucun travail de cette story n'est perdu.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Le client paie et ses modules ne s'ouvrent pas — événement perdu | Outbox transactionnel (**AC 1**) + relais rejouable + **filet AC 6** |
| Le catalogue acquiert de la sémantique de paiement | Note technique : il reçoit un état attendu, pas un fait de paiement |
| Un événement rejoué double des entitlements | **AC 4** — upsert idempotent, déjà livré |
| Un appel HTTP est ajouté « en attendant » | **AC 9/10** vérifiés en configuration et en trafic |
| Le délai asynchrone surprend un client | **AC 11** : mesuré et annoncé |

---

## Definition of Done

- [ ] Les 12 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 % **sur les deux services**
- [ ] **Vérification docker bout-en-bout** : encaissement → événement → octroi → `entitlement.changed`
      reçu par un consommateur existant ; rejeu ×20 ; désordre ; module `RETIRED` en attente ;
      atomicité par `abort()`
- [ ] **`architecture-catalog-service-2026-07-07.md` mis à jour** : `C8` passe de *point ouvert* à
      **tranché — option A (événement)**, avec le motif et la réversibilité
- [ ] `STORY-039` marquée **remplacée par STORY-162** dans `sprint-status.yaml`
- [ ] Branches `MNV-162` (deux dépôts), PR **mergées ensemble**

---

## Progress Tracking

*(à remplir à l'implémentation)*
