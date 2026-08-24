# STORY-378 : Le BFF **efface le code applicatif** des 409/429 qu'il proxifie — la console ne peut pas dire « ce n'est pas la bonne porte »

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. :** **STORY-186** *(qui a créé `OWNER_NOT_ACTIVATED` PRÉCISÉMENT pour que la console puisse le distinguer de `NO_ACTIVE_OWNER`)* · **STORY-182** *(`PRECONDITION_REQUISE` : le seul code que le BFF pose lui-même)* · **STORY-106** · **AP-19** *(le consommateur qui bute dessus)*
**Découverte par :** **AP-19**, vérification sur stack docker le 2026-08-20
**Priorité :** Should Have
**Story Points :** 2
**Complexité :** low
**Statut :** done
**Service :** `admin-panel` BFF (`:3010`)

> **Le trou, en une phrase :** `rethrowUpstreamError` remplace le corps des erreurs d'écriture par un
> message générique **sans le `code`** — donc deux refus qui appellent deux gestes **opposés** arrivent
> à la console strictement indiscernables.

---

## Mesuré, pas déduit *(stack docker, 2026-08-20)*

Même appel, deux chemins :

```
POST /api/v1/admin/organizations/:id/resend-verification        (auth, direct)
{"statusCode":429,"error":"Too Many Requests",
 "message":"Trop de renvois de vérification pour cette organisation. Réessayez plus tard.",
 "code":"TOO_MANY_VERIFICATION_RESENDS"}

POST /api/v1/admin/orgs/:orgId/resend-verification              (BFF, proxy)
{"statusCode":429,"error":"Too Many Requests",
 "message":"Quota atteint pour cette ressource. Réessayez plus tard."}      ← pas de `code`
```

Le `429` rend l'écart **visible à l'œil nu** ; il est sans conséquence, la console n'ayant qu'une chose à
en dire (« attendez »). **Le `409` de la même route, lui, est un vrai défaut.**

## Ce que ça coûte, concrètement

`resolveOwner` (auth-service) lève **deux** conflits, et STORY-186 leur a donné des codes **distincts**
avec une justification écrite noir sur blanc : *« Code dédié, et non `NO_ACTIVE_OWNER` : la console doit
pouvoir dire à l'opérateur "ce n'est pas la bonne route, prends `resend-invitation`". »*

| Code amont | Ce que l'opérateur doit faire |
|---|---|
| `NO_ACTIVE_OWNER` | réparer les **membres** de l'organisation — il n'y a personne à qui écrire |
| `OWNER_NOT_ACTIVATED` | **changer de geste** : cliquer « Renvoyer l'invitation », juste au-dessus |

Les deux arrivent à la console en `409 { message: "Action impossible dans l'état courant de la
ressource." }`. Trancher au hasard afficherait « aucun administrateur actif » à un opérateur dont le
propriétaire est simplement encore `INVITED` : il irait réparer des membres qui vont très bien, pendant
que le bon geste était à trois centimètres de sa souris.

⚡ **AP-19 a livré la conséquence, pas le contournement** : l'écran affiche un message qui **nomme les
deux causes et les deux gestes**, et garde ses deux traductions précises (`noActiveOwner`,
`ownerNotActivated`) — déjà écrites et déjà testées — pour le jour où le `code` traversera. Ce jour-là,
**aucune ligne d'écran ne change**.

---

## ⚠️ La neutralisation du corps est une RÈGLE DE SÉCURITÉ — on ne la lève pas, on l'ouvre à la bonne largeur

`WRITE_ERROR_MESSAGES` existe pour ne jamais divulguer l'URL amont, son état interne ou son corps brut
(anti-fuite, anti-énumération). Ce ticket ne demande **pas** de relayer le corps amont : il demande de
**recopier un unique champ, sur une liste blanche de codes connus** — exactement ce que fait déjà
`conflitAvecDetailEventuel` pour le conflit de décision KYC, et `PRECONDITION_REQUISE` pour le 428.

Un `code` d'énumération fermée ne dit rien de plus que le `409` lui-même : il dit **laquelle** des deux
situations que la console connaît déjà (elle affiche `ownerEmailVerified` et le statut des membres depuis
STORY-186) s'est produite.

---

## Périmètre

**Inclus :**

- Une **liste blanche** de codes applicatifs relayés tels quels par `rethrowUpstreamError` :
  `NO_ACTIVE_OWNER`, `OWNER_NOT_ACTIVATED`, `ALREADY_ACTIVATED`, `NO_INVITED_ADMIN`
  *(les deux derniers pour `resend-invitation`, qui a le même défaut et le même écran)*.
- Un code **hors liste** est **ignoré** : la neutralisation reste la règle, la traversée est l'exception
  nommée. Un code inventé plus tard en amont ne passe pas sans modification consciente d'ici.
- Le message reste **générique** (aucun texte amont recopié) : c'est la console qui écrit la phrase.

**Hors périmètre :**

- Le `429` : la console n'a rien de plus à en dire que « attendez ». Son code peut rester effacé.
- Toute traversée de `details` ou du corps amont en bloc.

---

## Critères d'acceptation

- [ ] Un `409 { code: "OWNER_NOT_ACTIVATED" }` amont arrive à l'appelant du BFF **avec** son `code`, et un
      message générique inchangé.
- [ ] Un `409 { code: "NO_ACTIVE_OWNER" }` de même.
- [ ] Un `409` porteur d'un code **hors liste** arrive **sans** `code` — la neutralisation tient.
- [ ] Un `409` **sans** code amont reste un `409` générique *(le cas d'aujourd'hui : pas de régression)*.
- [ ] Aucun autre champ du corps amont ne traverse — assertion **négative** explicite dans le test.
- [ ] Le conflit de décision KYC (STORY-182) est **inchangé**, `code` et `details` compris.

---

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List

---

## Progress Tracking

### ① Ce que la story livre

Une **liste blanche fermée** de 4 codes relayés par `rethrowUpstreamError` — `NO_ACTIVE_OWNER`,
`OWNER_NOT_ACTIVATED`, `ALREADY_ACTIVATED`, `NO_INVITED_ADMIN` — dans `conflitAvecDetailEventuel`, à
côté du patron que STORY-182 y avait déjà posé pour le conflit KYC.

| Décision | Pourquoi |
|---|---|
| **Un seul champ**, jamais le corps | le message reste le **générique du BFF** : c'est la console qui écrit la phrase |
| **Liste fermée**, jamais un test de forme | « chaîne en MAJUSCULES ⇒ ça passe » laisserait traverser n'importe quel code futur, y compris un qui nommerait un état interne |
| **Priorité au conflit KYC** | la branche de STORY-182 reste première et **intacte** *(AC-6)* |
| Le **`429`** garde son code effacé | hors périmètre **assumé** : la console n'a qu'une chose à en dire. Un test le fixe, pour que ce ne soit pas un oubli |

### ② Mutation-test

| Mutation | Attendu | Mesuré |
|---|---|---|
| Liste blanche retirée *(tout code traverse)* | rouge | ✅ 1 rouge |
| Corps amont recopié **en bloc** | rouge | ✅ 5 rouges |
| Branche du conflit KYC court-circuitée | rouge | ✅ 5 rouges |
| `$unset`… *(n/a ici)* | — | — |

L'**assertion négative** de l'AC est posée **deux fois** : en unitaire *(les 4 clés exactes du corps)*
et en e2e *(ni `cabinet.tg`, ni `auth-service`, ni `details` dans la réponse HTTP réelle)*.

### ③ Vérification docker — le scénario exact de la story, rejoué

Stack docker, `docker restart` du BFF *(« Found 0 errors » confirmé)*, deux organisations semées pour
produire **les deux** conflits de `resolveOwner` :

| Chemin | Réponse |
|---|---|
| **Amont** `auth:3001`, propriétaire `INVITED` | `409` `code: OWNER_NOT_ACTIVATED` + son message métier |
| **Amont**, aucun admin actif | `409` `code: NO_ACTIVE_OWNER` |
| **BFF** `:3010`, même organisation `INVITED` | ⚡ `409` **`code: OWNER_NOT_ACTIVATED`**, message **générique** |
| **BFF**, aucun admin actif | ⚡ `409` **`code: NO_ACTIVE_OWNER`**, message **générique** |

**Ce qui ne franchit pas le BFF**, mesuré sur la réponse réelle : clés du corps réduites à
`['code', 'error', 'message', 'statusCode']` · message amont *(« renvoyez-lui son invitation »)*
**absent** · ni `details`, ni `url`, ni `stack`.

⚠️ **Le `429` n'a PAS pu être vérifié en docker, et ce n'est pas un oubli** : le quota d'`auth-service`
n'est incrémenté que par un **envoi réussi** — un refus ne le consomme pas *(confirmé : aucune clé
Redis après 4 tentatives refusées)*. Le `429` reste donc prouvé **en unitaire et en e2e**, et c'est dit
plutôt que présenté comme une vérification qui n'a pas eu lieu.

Stack arrêtée, jeu de données nettoyé.

### ④ Revue de code — 1 constat, documenté

⚠️ **La portée dépasse `resend-verification`.** `rethrowUpstreamError` sert **trois** services proxy
(`org-actions`, `project-proxy`, `platform-rbac`) : le relais vaut pour **toutes** leurs routes.
**Vérifié** : les 4 codes ne sont levés **que** par `admin-organizations.service.ts` d'`auth-service` —
aucune route tierce ne peut en produire un avec un autre sens. Noté dans le code : **à revérifier avant
d'ajouter une entrée**, un code homonyme levé ailleurs traverserait lui aussi.

### ⑤ Revue de sécurité — **0 vulnérabilité**, argument étayé plutôt qu'affirmé

La question qui décide : **le code révèle-t-il quelque chose qu'un appelant ne pouvait pas obtenir
autrement ?**

⇒ **Non.** Le contrôleur d'actions porte un plancher `@RequirePermissions(ORG_READ)` **de classe** :
qui atteint ces routes peut déjà lire `GET /admin/orgs/:id`, donc les **membres** de l'organisation
**et** `ownerEmailVerified` (STORY-186). Le code lui évite une **déduction**, il ne lui apprend rien.

⇒ **Et un e2e garde ce plancher** : si le jour venu il tombait, la traversée deviendrait une
divulgation — le test rougirait **avant**.

| Autre piste | Pourquoi elle ne tient pas |
|---|---|
| Fuite du message amont | Le générique du BFF est conservé — **mesuré en docker** |
| Injection par un `code` non-chaîne | `lireChaine` refuse objet et nombre **avant** la liste blanche (testé) |
| Oracle d'énumération | Le `409` n'est rendu que sur une organisation **déjà visible** de l'appelant ; sinon `404` |
| Régression du conflit KYC | Branche prioritaire et inchangée — mutation vérifiée |

### ⑥ Portes

| | `admin-panel` |
|---|---|
| Lint / build | ✅ 0 / ✅ |
| Unitaires | ✅ **444** / 37 suites |
| e2e | ✅ **206** / 11 suites |
| Couverture | **99,68 / 93,2 / 100 / 99,65** |

### ⑦ Clôture

- **2026-08-24** — ✅ **CLÔTURÉE**. PR `prospera-admin-panel-service#23` rebase-mergée sur `dev`
  (2 commits : feature, revue + sécurité). Branche supprimée.
- ⚡ **Ce que ça débloque, sans qu'une ligne d'écran ne change** : AP-19 a livré la conséquence, pas le
  contournement — l'écran garde ses deux traductions précises (`noActiveOwner`, `ownerNotActivated`),
  déjà écrites et déjà testées, pour le jour où le `code` traverserait. Ce jour est arrivé.
- **Dette ouverte, transmise :** ⚠️ **le `429` reste sans code** (hors périmètre assumé). Si un écran
  devait un jour distinguer deux quotas, c'est la même liste blanche qu'il faudrait ouvrir — au même
  endroit, avec le même raisonnement.
