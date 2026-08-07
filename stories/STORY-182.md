# STORY-182 : Deux opérateurs peuvent trancher **le même dossier** sans que rien ne le dise

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §D · **AP-03** · **STORY-013** *(revue admin)* · **STORY-128** *(verdict par pièce)*
**Découverte par :** AP-INT-1 — écart nº5 d'AP-INT-0, relevé alors et **jamais formulé**
**Priorité :** Should Have — ✅ **arbitrage rendu le 2026-08-07** *(voir §Arbitrage rendu)*
**Story Points :** 3
**Complexité :** high *(concurrence, contrat HTTP traversant 2 dépôts, corps d'erreur enrichi)*
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 20
**Services :** `kyc-service` (`:3002`) **et** `admin-panel` (`:3010`) — *cf. §Arbitrage rendu, point ④*

---

## Le constat

`POST /admin/kyc/:orgId/approve|reject` n'admet **aucune concurrence optimiste** : ni version, ni
`If-Match`, ni horodatage attendu. Le dernier appel gagne, **en silence**.

**Conséquence :** une revue est un travail **long, interrompu, repris** — c'est même la raison pour
laquelle la console en a fait une route partageable plutôt qu'une modale. Deux opérateurs qui
ouvrent le même dossier produisent deux décisions ; la seconde écrase la première, et **le premier ne
saura jamais que sa décision a été annulée**.

Sur un acte qui décide de l'entrée d'un client dans le système, c'est une perte d'information
silencieuse — et **impossible à reconstituer après coup** tant qu'il n'y a pas d'historique
*(cf. `STORY-183`)*.

> ⚡ **Le front porte déjà l'écran de conflit, entièrement écrit** — `KycConflictError` et son rendu
> *(« un autre opérateur a tranché ce dossier pendant que vous le revoyiez, voici qui et quand »)*.
> Il est **inatteignable** : rien en amont ne produit jamais ce signal. Sa seule présence dans le
> code laisse croire que le cas est traité.

## Ce qui rend la question réelle et pas théorique

La file est **partagée** et **triée par ancienneté** : tous les opérateurs voient la même tête de
file, et sont donc incités à ouvrir **le même dossier**. Ce n'est pas une collision improbable, c'est
le comportement que la file encourage.

---

## Décision attendue AVANT de coder

| Issue | Conséquence |
|---|---|
| **① Porter la concurrence optimiste** *(par défaut)* | Le service refuse une décision fondée sur un état périmé *(`409`)* et nomme la décision gagnante. ⚡ **Le front est déjà prêt à la rendre** — cette story livre le signal |
| ② **Acter que le dernier gagne** | Alors il faut **supprimer l'écran de conflit du front** et le dire dans `AP-03`. Un écran qui traite un cas que le système ne produit jamais est un mensonge par omission |

⚠️ **Ce qui ne se défend pas, c'est de garder l'écran sans l'amont** — c'est l'état actuel, et il
donne à la relecture l'impression rassurante d'un problème résolu.

---

## Arbitrage rendu *(2026-08-07)*

### ⚠️ Le constat ci-dessus est **partiellement faux** — audit du code au lancement

`TenantKycProfileRepository.transition()` filtre déjà sur `{ tenantId, status: from }`, et
`KycStatusService.runTransition()` en tire un `false` → `409`. **Le « dernier gagne en silence » n'est
donc pas vrai pour la décision globale** : si l'opérateur A approuve, l'appel de B ne matche plus rien
et reçoit **déjà** un `409` aujourd'hui.

Le défaut réel est ailleurs, et il est double :

| # | Défaut réel | Pourquoi il compte |
|---|---|---|
| **A** | **Le `409` est muet** — `'Dossier KYC non soumis à revue (statut différent de UNDER_REVIEW).'`, ni verdict, ni auteur, ni date | L'écran de conflit du front est inatteignable **non pas faute de `409`, mais faute de quoi le remplir** |
| **B** | Un dossier **bouge sans quitter `UNDER_REVIEW`** : un dépôt de pièce pendant la revue est un **no-op sur le profil** (`markUnderReview` sort si `status !== PENDING_DOCUMENTS && !== REJECTED`), et les marques par pièce (STORY-128) vivent dans une **autre collection** | L'opérateur tranche sur un état périmé et **rien** ne le signale. C'est *là* que la précondition sert |

⚠️ **Conséquence load-bearing du défaut B** : une précondition fondée sur le seul `profile.updatedAt`
**raterait exactement le cas pour lequel on l'ajoute**. C'est ce qui a écarté l'option `expectedUpdatedAt`.

### Les 4 décisions

| # | Décision | Motif |
|---|---|---|
| ① | **Issue ① — concurrence optimiste** | L'écran de conflit reste, et cette story lui livre enfin de quoi s'afficher. Moins coûteux que la story ne le supposait : le socle conditionnel existe déjà, il s'agit d'**enrichir** le `409` et de **couvrir le cas B** |
| ② | **Précondition = `ETag` couvrant l'état observable du dossier** — profil (`status` + `updatedAt`) **et** pièces courantes (`_id` + `updatedAt`), ordre canonique, `sha256` | Seule forme qui attrape le dépôt de pièce et la marque par pièce. `version` sur le profil a été écarté : il forcerait les écritures de pièces à toucher le profil, couplant deux agrégats |
| ③ | **`If-Match` obligatoire** sur `approve`/`reject` **globaux** : absent → `428`, non concordant → `409`. Les routes **par pièce** restent hors précondition | `428 Precondition Required` distingue « tu as oublié » de « ton état est périmé » (`409`). Le `409` est conservé pour le désaccord — **pas** `412` — parce que le front mappe déjà `409 → KycConflictError` (AC-2 l'impose) |
| ④ | **Périmètre = 2 dépôts** : `kyc-service` **et** `admin-panel` | La console **passe par le BFF** (`POST /admin/orgs/:orgId/kyc/approve\|reject` → `kyc`, STORY-048). Rendre `If-Match` obligatoire côté `kyc` **sans** toucher le BFF ⇒ `428` sur **chaque** décision de la console : la revue KYC serait entièrement cassée |

### ⚡ Deux pièges qui rendraient le livrable **inerte**, identifiés avant de coder

1. **`AllExceptionsFilter` construit le corps par LISTE BLANCHE** (`statusCode`, `error`, `message`,
   `code`, `requestId`) : un champ `conflit` posé sur la `ConflictException` serait **jeté en
   silence**. Le filtre doit être étendu, sinon AC-2 est décoratif.
   *(Corollaire déjà connu : une `ConflictException` à payload **objet** perd `error` — le poser explicitement.)*
2. **`rethrowUpstreamError` du BFF remplace le corps amont par un message générique**
   *(`"Action impossible dans l'état courant de la ressource."`)*, **par conception** anti-fuite. Sans
   traversée **explicite et allowlistée** du détail de conflit, la console recevrait un `409` aussi muet
   qu'aujourd'hui — `kyc` enrichi, front toujours vide. ⚠️ Et `428` **n'est pas** dans
   `WRITE_ERROR_MESSAGES` : sans l'y ajouter, un `If-Match` manquant devient un **`503`** — soit la faute
   exacte que STORY-106 a corrigée (un refus légitime présenté comme une panne).

### Ce que cette story **ne** livre **pas**

- **AC-06 (preuve navigateur `:3110`)** et le câblage front : le dépôt de la console **n'est pas dans ce
  workspace**. Le contrat est consigné dans `AP-03` ; la consommation front est un **ticket dédié**.
- Le verrou exclusif (déjà hors périmètre ci-dessous).

---

## Périmètre *(issue ①)*

- Une **précondition** sur la décision globale : l'appelant transmet l'état sur lequel il a fondé son
  jugement *(`updatedAt` du dossier, ou un `version`/ETag — à trancher au lancement)*.
- `409` quand l'état a bougé, avec de quoi **nommer** la décision gagnante : verdict, auteur, date.
  ⚠️ Un `409` nu obligerait l'opérateur à recharger pour comprendre ce qu'il a perdu.
- ⚠️ **La marque par pièce reste hors concurrence** : deux opérateurs qui marquent deux pièces
  *différentes* ne sont pas en conflit, et les mettre en concurrence transformerait un travail
  parallèle légitime en collision.

### Hors périmètre

Le verrou exclusif *(« ce dossier est en cours de revue par X »)*. C'est une autre réponse au même
risque, plus coûteuse et plus intrusive — à ouvrir séparément si l'optimiste ne suffit pas.

---

## Critères d'acceptation

1. Deux décisions concurrentes sur le même dossier : la première passe, la seconde reçoit `409`.
2. Le corps du `409` nomme le verdict rendu, son auteur et sa date.
3. Une décision fondée sur l'état courant passe toujours — **aucune régression** sur le cas nominal,
   qui reste de très loin le plus fréquent.
4. La précondition est **obligatoire** : une décision sans elle est refusée. ⚠️ La rendre optionnelle
   la viderait de son sens — tout appelant qui l'omet retrouverait le défaut d'aujourd'hui.
5. Les marques **par pièce** ne sont pas soumises à la précondition.
6. ⚡ **Preuve navigateur depuis `:3110`** : deux sessions, deux onglets, même dossier — le second
   voit l'écran de conflit **au lieu d'écraser** la décision du premier.

### Critères ajoutés par l'arbitrage

7. `GET /admin/kyc/:orgId` publie l'`ETag` du dossier — **en en-tête `ETag`** *(exposé par CORS, sinon
   illisible depuis un navigateur)* **et dans le corps**, seule forme qui traverse le BFF sans plomberie.
8. L'`ETag` **change** quand une pièce est déposée ou marquée pendant la revue — c'est le défaut **B**,
   et c'est ce qui distingue cette précondition d'un `expectedUpdatedAt` décoratif.
9. `If-Match` absent ou vide → **`428`**, distinct du `409` d'état périmé.
10. **Le corps enrichi survit au `AllExceptionsFilter`** *(liste blanche)* **et à
    `rethrowUpstreamError`** *(message générique)* : mesuré sur la réponse **réellement produite**,
    jamais sur la présence du champ dans le code.
11. `428` amont → `428` côté BFF, **pas `503`**.
12. Le cas **B sans décision gagnante** (dossier modifié, toujours `UNDER_REVIEW`) est distingué du cas
    **A** (décision concurrente) : le premier n'a **aucun** verdict à nommer, et le corps le dit.

---

## Definition of Done

- [x] Arbitrage tranché et **consigné** — dans cette story *(§Arbitrage rendu)* et dans `AP-03`
- [ ] Critères 1-5 et 7-12 vérifiés *(issue ①)* · `lint` 0 · couverture ≥ seuils · e2e verts
- [ ] Mutation-test sur chaque garde neuve : `ETag` insensible aux pièces, `If-Match` rendu optionnel,
      champ enrichi retiré de la liste blanche, `428` retiré de `WRITE_ERROR_MESSAGES`
- [ ] Vérification docker réelle : deux décisions concurrentes sur une stack vivante, corps mesuré
- [ ] ~~Issue ② : retrait de l'écran de conflit~~ — **sans objet**, issue ① retenue
- [ ] AC-06 : **ticket front ouvert** *(dépôt console hors workspace)*, contrat consigné dans `AP-03`
- [ ] Branches `MNV-182` sur `kyc-service` **et** `admin-panel`, les **deux** PR rebase-mergées sur `dev`
      **ensemble** — la première seule casserait la console

---

## Progress Tracking

| Date | Phase | État |
|---|---|---|
| 2026-08-07 | ① Arbitrage + story | ✅ Issue ① · ETag dossier+pièces · 2 dépôts · AC-06 → ticket front |
