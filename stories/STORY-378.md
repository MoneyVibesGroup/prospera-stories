# STORY-378 : Le BFF **efface le code applicatif** des 409/429 qu'il proxifie — la console ne peut pas dire « ce n'est pas la bonne porte »

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF)
**Réf. :** **STORY-186** *(qui a créé `OWNER_NOT_ACTIVATED` PRÉCISÉMENT pour que la console puisse le distinguer de `NO_ACTIVE_OWNER`)* · **STORY-182** *(`PRECONDITION_REQUISE` : le seul code que le BFF pose lui-même)* · **STORY-106** · **AP-19** *(le consommateur qui bute dessus)*
**Découverte par :** **AP-19**, vérification sur stack docker le 2026-08-20
**Priorité :** Should Have
**Story Points :** 2
**Complexité :** low
**Statut :** ready-for-dev
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
