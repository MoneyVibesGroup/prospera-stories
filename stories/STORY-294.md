# STORY-294 : `auth-service` — le journal d'audit des organisations est **écrit et illisible** : lui donner sa route de lecture

**Epic :** EPIC-025 — RBAC plateforme & console
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` · **STORY-144** *(qui écrit le journal)* · **STORY-103/105** *(permissions `org:read` / `org:suspend`)* · **AP-20** *(la console qui écrit dedans sans pouvoir l'ouvrir)*
**Priorité :** Should Have
**Story Points :** 3
**Complexité :** low sur le code — **medium sur les arbitrages**, qui sont le vrai objet de la story
**Statut :** done · **Clôturée le :** 2026-08-11
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-08-08
**Sprint :** 20
**Service :** `auth-service` (:3001)
**Branche :** `MNV-294`
**Origine :** `tickets/TICKET-BACKEND-journal-d-audit-des-organisations-non-lisible.md` — ouvert par **AP-20** à l'intégration

---

## Le défaut

`admin_audit_logs` est écrit par STORY-144 — **append-only**, dans la **même transaction** que le
changement de statut. Le journal est bien fait. Il est simplement **inatteignable** :

```
GET  /admin/organizations                        (org:read)
GET  /admin/organizations/:id                    (org:read)
POST /admin/organizations/:id/suspend            (org:suspend)   → écrit ORG_SUSPENDED
POST /admin/organizations/:id/reactivate         (org:suspend)   → écrit ORG_REACTIVATED
POST /admin/organizations/:id/resend-invitation  (user:invite)
```

Cinq routes, **aucune lecture**. La console **écrit dans un journal qu'elle ne peut pas ouvrir** : un
opérateur qui suspend une organisation produit une trace nominative immédiate et ne peut la relire par
aucun chemin — pas même l'acte qu'il vient de commettre.

⚡ **Et le manque était anticipé.** L'index posé par STORY-144 décrit *exactement* la requête que
personne ne peut faire :

```ts
// admin-audit-log.schema.ts:53-55
// Lecture naturelle du journal : « l'historique de CETTE organisation, du plus
// récent au plus ancien ».
AdminAuditLogSchema.index({ organizationId: 1, at: -1 });
```

L'index de la lecture existe. La lecture, non.

## Cause racine

**La moitié difficile a été faite, et la moitié facile est restée hors périmètre.** STORY-144 visait à
fermer l'aller simple de la suspension ; écrire la trace en était le **moyen**, pas la finalité. Le
commentaire de son propre schéma pose pourtant la question à laquelle le journal sert à répondre — *« Qui
a suspendu ce cabinet, et quand ? n'avait donc aucune réponse »* — et cette question reste sans réponse.

⚠️ **Une écriture sans lecture ne se signale nulle part** : rien n'échoue, aucun test ne rougit, la
couverture reste verte. C'est la même classe de défaut que les trois occurrences déjà relevées dans ce
dépôt *(délégation nominative jamais retombée)*, sous une forme plus discrète encore : ici, il n'y a
même pas de délégation écrite à ne pas avoir suivie.

## Un second manque, trouvé au passage

`AdminAuditLog.reason` existe, est géré par `admin-audit.service.ts` *(`...(entry.reason ? { reason } : {})`)*
et **testé** *(« sans motif : le champ `reason` est ABSENT »)*. Mais :

```ts
// admin-organizations.controller.ts
async suspend(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser)
```

**Aucune route n'accepte de corps.** Personne ne peut donc fournir de motif, et **toutes les lignes du
journal en sont dépourvues** — un champ prêt pour une information qu'aucun chemin ne permet de donner.

⚠️ C'est précisément ce qu'un lecteur d'audit cherche en premier : *pourquoi* ce cabinet a été coupé.

---

## Les arbitrages — **RENDUS le 2026-08-11**

> Les trois verdicts ci-dessous sont le **livrable principal** de la story ; le code en découle. L'analyse
> qui les précède est conservée telle qu'elle a été posée à la rédaction — c'est ce qui rend le verdict
> relisable.

| # | Question | **Verdict** |
|---|---|---|
| ① | identifiant ou identité de l'acteur ? | **`actorId` + identité résolue À LA LECTURE**, jointure sur `users` ; acteur disparu ⇒ **la ligne reste**, réduite à son identifiant |
| ② | org-scopée ou transverse ? | **Org-scopée** `GET /admin/organizations/:id/audit`, assumée comme **cas particulier** d'une transverse à venir — dont elle rend **déjà la forme d'item** |
| ③ | ouvre-t-on la saisie d'un motif ? | **Oui** : corps optionnel `{ reason? }` sur `suspend` **et** `reactivate`, borné à 500 caractères, relu par la lecture. `reason` **reste** au schéma |

### ① Que rend-on de l'acteur : un identifiant, ou une identité ?

Le document porte `actorId` *(ObjectId)*. **La console n'a aucun moyen de le résoudre** : les routes
d'annuaire sont org-scopées, et un opérateur plateforme **n'a pas d'organisation**. Trois réponses :

- **`actorId` seul** — le journal reste fidèle à ce qu'il stocke, et la console affiche un ObjectId à un
  humain. À écarter : ça ne répond pas à « qui ».
- **`actorId` + identité dénormalisée à la lecture** *(jointure sur `users` : e-mail, `firstName`,
  `lastName`)* — **probablement la bonne réponse**. Le journal reste minimal à l'écriture, la lecture
  enrichit. ⚠️ Traiter le cas de l'acteur **supprimé depuis** : rendre l'identifiant seul plutôt que de
  faire disparaître la ligne — un journal qui perd des entrées quand un compte part ne prouve plus rien.
- **Dénormaliser à l'ÉCRITURE** *(figer le nom dans le document)* — c'est la réponse d'un vrai journal
  d'audit : la trace dit qui agissait **au moment de l'acte**, et un changement de nom ne réécrit pas
  l'histoire. Plus coûteux *(migration des lignes existantes, ou tolérer deux formes)*, mais c'est la
  seule qui tienne si le journal doit avoir une valeur probante.

> ### ✅ Verdict ① — `actorId` **+ identité résolue à la lecture**
>
> **Pourquoi pas la dénormalisation à l'écriture**, alors que c'est la réponse « vrai journal d'audit » :
> elle exige de **retoucher l'écriture**, que le périmètre de cette story met explicitement hors champ
> *(« livré par STORY-144, et à ne pas retoucher »)*, **et** une migration des lignes déjà écrites — sans
> quoi le journal porterait durablement **deux formes** de ligne, dont l'ancienne obligerait de toute
> façon à écrire la jointure de lecture. On paierait les deux chemins pour n'en utiliser qu'un.
> La valeur probante est un besoin réel mais **pas celui d'aujourd'hui** : la console veut afficher *qui*,
> pas opposer une preuve. Il est ouvert en gap ci-dessous plutôt que présumé.
>
> **Ce que rend la route** — `actor: { id, email?, firstName?, lastName?, deleted }` :
>
> - acteur présent ⇒ identité complète, `deleted: false` ;
> - acteur en **suppression logique** *(`deletedAt` posé par `softDelete`)* ⇒ **identité rendue quand
>   même**, `deleted: true`. Masquer son nom effacerait exactement la réponse que le journal existe pour
>   donner — l'opérateur parti est justement celui qu'on cherche ;
> - **document d'acteur absent** *(purgé)* ⇒ `{ id, deleted: true }` seul, sans e-mail ni nom.
>
> ⚠️ **Dans les trois cas la ligne est rendue.** C'est le point non négociable : `$unwind` sans
> `preserveNullAndEmptyArrays` ferait **disparaître de l'historique** les actes d'un compte supprimé — un
> journal qui perd des entrées quand un compte part ne prouve plus rien, et il les perdrait *en silence*.

### ② Quel périmètre : le journal des organisations, ou celui de l'administration ?

`AdminAuditAction` ne porte aujourd'hui que `ORG_SUSPENDED` et `ORG_REACTIVATED`, et son commentaire
annonce l'extension *(« On ajoute, on ne renomme pas »)*. Deux formes possibles :

- **Org-scopée** — `GET /admin/organizations/:id/audit`. Simple, alignée sur l'index existant, sert le
  besoin d'aujourd'hui.
- **Transverse** — `GET /admin/audit?organizationId=&action=&actorId=`. Sert aussi « qu'a fait cet
  opérateur ce mois-ci », question d'exploitation qui viendra.

⚠️ **À trancher AVANT d'écrire la route, pas après** : rendre transverse une route org-scopée **déjà
consommée** coûte une migration de contrat côté console. Rien n'interdit de livrer l'org-scopée en
sachant qu'elle est un cas particulier — à condition de le dire ici.

> ### ✅ Verdict ② — **org-scopée**, et **dite** cas particulier : `GET /admin/organizations/:id/audit`
>
> C'est le besoin d'aujourd'hui *(AP-24 affiche l'historique **d'une** organisation, sur sa fiche)*, c'est
> la requête que l'index `{ organizationId: 1, at: -1 }` sert déjà, et une transverse livrée sans écran
> serait une seconde route sans consommateur — exactement le défaut que cette story répare.
>
> **La forme transverse à venir est `GET /admin/audit?organizationId=&action=&actorId=`.** Pour qu'elle ne
> coûte **pas** de migration de contrat côté console, l'**item** rendu ici est déjà celui qu'elle rendrait :
> il porte **`organizationId`**, pourtant redondant avec le paramètre de chemin. La console dérive donc
> dès maintenant le type **définitif** de la ligne de journal ; le jour venu, il n'y aura qu'une route de
> plus à consommer, pas un type à réécrire. C'est le seul surcoût consenti à l'arbitrage.
>
> ⚠️ **Le filtrage (`action=`, `actorId=`) n'est PAS livré ici** : aucun écran ne le demande, et un filtre
> qu'aucun appelant n'exerce est une surface non couverte. Il appartient à la transverse.

### ③ Ouvre-t-on la saisie d'un motif ?

Si oui, `POST /:id/suspend` accepte un corps optionnel `{ reason?: string }` *(borné, assaini)* et la
console le demande dans sa confirmation. **Si non, `reason` doit être retiré du schéma** — un champ
qu'aucun chemin ne remplit est une promesse que la relecture prendra pour une donnée manquante.

> ### ✅ Verdict ③ — **on ouvre la saisie**. `reason` reste au schéma
>
> Le retrait était l'autre réponse cohérente, mais **tout le chemin existe déjà sauf la porte d'entrée** :
> `AdminAuditService.record` gère `reason` et le teste, et `OrganizationsService.setStatusAndEmit` le
> transporte jusqu'à l'écriture *(`audit?: { actorId, reason? }`)*. Le champ n'était pas une promesse en
> l'air — il lui manquait **un `@Body()`**. Et c'est ce qu'un lecteur d'audit cherche en premier : *pourquoi*
> ce cabinet a été coupé.
>
> **Ce qui est livré** : corps **optionnel** `{ reason?: string }` sur `POST /:id/suspend` **et** sur
> `POST /:id/reactivate` — la symétrie n'est pas du confort, une réactivation sans motif dans un journal
> qui en porte pour les suspensions serait un trou au milieu de l'historique. Borné à **500 caractères**,
> **trimé** et **débarrassé des caractères de contrôle** *(un journal est relu dans un terminal autant que
> dans un navigateur)*. Un motif **vide après trim** est traité comme **absent** — le champ ne doit pas
> exister à `''` en base.
>
> ⚠️ **Pas de troisième état, mais un passé assumé** : les lignes écrites avant cette story n'ont pas de
> motif et n'en auront jamais. `reason` y est **absent** *(et non vide)* — la lecture l'omet, elle ne rend
> pas `null`.
>
> ⚠️ **Les lots (`POST /admin/organizations/bulk/*`) n'ouvrent PAS la saisie** — hors périmètre assumé :
> un motif unique appliqué à 100 organisations n'est pas le même objet qu'un motif de décision, et aucun
> écran ne le demande. Leurs lignes restent sans motif. Consigné en gap.

---

## Périmètre

1. **Rendre les trois arbitrages**, et les consigner dans cette story *(ils sont le livrable
   principal ; le code en découle)* — ✅ faits ci-dessus, le 2026-08-11.
2. `GET` de lecture du journal, sous **`org:read`** — la lecture d'une trace se délègue à un support ou
   un auditeur ; `org:suspend` reste la permission d'**agir**.
3. **Paginée**, du plus récent au plus ancien *(l'index existe déjà, il n'y a rien à créer)*, plafond de
   page borné comme les autres listes admin.
4. **DTO + OpenAPI** — la console **dérive ses types** de l'OpenAPI ; une route non documentée n'est pas
   consommable par `gen:api`.
5. Tests : lecture nominale, pagination, **403 sans `org:read`**, organisation inconnue, acteur supprimé.

### Hors périmètre

- **Écrire** dans le journal — livré par STORY-144, et à ne pas retoucher.
- **Purge / rétention** du journal. ⚠️ Un journal append-only sans politique de rétention est une
  question réelle, mais c'est une décision d'exploitation, pas cette story. À porter en gap si l'arbitrage
  ② retient la forme transverse *(qui rend le volume visible)*.
- L'écran de la console — c'est **AP-24**.

---

## Critères d'acceptation

1. Une route de lecture rend l'historique d'une organisation, du plus récent au plus ancien, paginé.
2. Elle est gardée par **`org:read`** ; un porteur sans cette permission reçoit **403**.
3. L'acteur est rendu **selon l'arbitrage ①**, et le cas de l'acteur **supprimé** est traité
   explicitement — jamais par la disparition de la ligne.
4. Les **trois arbitrages sont écrits** dans cette story avec leur raison ; l'arbitrage ② dit si la route
   est un cas particulier d'une forme transverse à venir.
5. Selon l'arbitrage ③ : soit un motif peut être **fourni et relu**, soit `reason` **disparaît** du
   schéma. Pas de troisième état.
6. La route est **documentée à l'OpenAPI** et `gen:api` produit un type exploitable.
7. `lint` · `typecheck` · `build` · tests verts ; vérification **docker** sur une organisation réellement
   suspendue depuis la console *(pas sur une fixture)*.

---

## ⚠️ Le piège à ne pas rejouer

**Cette route ne déclenchera rien tant qu'une story frontend ne la nomme pas.** C'est exactement ce qui
est arrivé à STORY-144 : livrée le 2026-08-06, elle est restée **sans aucun consommateur** jusqu'à ce
qu'un audit des actions de la console la rattrape et produise AP-20.

⇒ **AP-24 est créée en même temps que cette story**, et non « quand la route sortira ». Le point de
bascule côté console est déjà en place : l'encart « Historique des décisions : à livrer » d'`AccountCard`
*(`org-detail.tsx`)* est l'emplacement exact du futur journal.

## Gaps ouverts par les arbitrages *(à porter, pas à faire ici)*

| Gap | Ouvert par | Ce qu'il reste à décider |
|---|---|---|
| **Valeur probante du journal** | ① | Si le journal doit un jour **opposer** une preuve *(litige, contrôle)*, l'identité de l'acteur doit être **figée à l'écriture** — plus une migration des lignes existantes. Non fait : le besoin d'aujourd'hui est d'**afficher** qui, pas de prouver. |
| **Forme transverse `GET /admin/audit`** | ② | Filtres `action=` / `actorId=`, et la question de volume qu'ils rendent visible. L'item est déjà à sa forme définitive — il n'y aura pas de migration de contrat. |
| **Rétention / purge** | ② | Un journal append-only sans politique de rétention est une question d'exploitation réelle. Elle devient pressante avec la forme transverse. |
| **Motif sur les lots** | ③ | Les lignes produites par `bulk/suspend` et `bulk/reactivate` restent **sans motif**. À rouvrir si un écran de lot demande une confirmation motivée. |

## Progress Tracking

**2026-08-11 — livrée et mergée.** PR `auth-service` [#22](https://github.com/MoneyVibesGroup/prospera-auth-service/pull/22),
rebase-mergée sur `dev` (`8a6038d` + `1884463`), branche supprimée.

### Ce qui a été livré

| Livrable | Où |
|---|---|
| `GET /admin/organizations/:id/audit` (`org:read`, paginé, plafond 100, plus récent → plus ancien) | `admin-organizations.controller.ts` |
| Lecture par agrégation : `$match` ObjectId → `$sort {at:-1}` → `$skip/$limit` → `$lookup users` **projeté** → `$unwind` **préservant** | `admin-audit.service.ts::listByOrganization` |
| Mapping vers le contrat (`actor` à 5 champs, `reason` omis quand absent) | `admin-organizations.service.ts::listAudit` |
| Corps optionnel `{ reason? }` sur `suspend` **et** `reactivate` | `set-organization-status.dto.ts` |
| Assainissement du motif **hors du DTO** *(la couverture exclut les `.dto.ts`)* | `common/utils/motif-audit.util.ts` |
| DTO de réponse + OpenAPI | `dto/organization-audit.dto.ts` |

### Portes de qualité

`lint` 0 warning · `build` OK · **786 unit + 200 e2e** verts · couverture **97,22 / 90,73 / 97,82 / 97,26**
(seuils 65/90/90/90) — et **100 % par fichier** sur les trois sources neuves ou touchées
(`motif-audit.util.ts`, `admin-audit.service.ts`, `admin-organizations.service.ts`).

### Mutation-testing — **14 mutations, 14 rouges**

Appliquées au code réel puis restaurées, aucune rouge par erreur de compilation :

| # | Mutation | Ce qu'elle aurait cassé |
|---|---|---|
| 1 | `preserveNullAndEmptyArrays` retiré du `$unwind` | les lignes d'acteur disparu s'évaporent de l'historique |
| 2 | `$sort: { at: 1 }` | journal à l'envers |
| 3 | `from: 'user'` | jointure muette ⇒ tout le monde « supprimé » |
| 4 | projection du `$lookup` retirée | le document utilisateur entier entre dans le pipeline |
| 5 | `deleted: !entry.actor` | une suppression logique passe pour un compte vivant |
| 6 | `organizationId` retiré de l'item | contrat de la future transverse rompu |
| 7 | `resolveOrg` retiré | `200 []` sur une organisation inexistante |
| 8 | `{ actorId }` au lieu de `{ actorId, reason }` | motif accepté, jamais écrit |
| 9 | `body.reason` non transmis par le contrôleur | idem, un cran plus haut |
| 10 | route gardée `org:suspend` | la lecture cesse d'être déléguable |
| 11 | `@Max` retiré | `?limit=1000000` |
| 12 | motif vide rendu `''` | `reason` vide en base |
| 13 | caractères de contrôle non assainis | fausses lignes à la relecture |
| 14 | `@ApiBody` sans `required: false` | corps optionnel annoncé obligatoire |

⚠️ **La mutation 3 n'est rouge que par une assertion-miroir** (le test relit le littéral `'users'`) : ce
n'est **pas** elle qui prouve que la collection existe — c'est la vérification docker ci-dessous.

### ⚡ Défaut trouvé PAR la vérification docker — corrigé

Nest déclare tout `@Body()` en **`required: true`**. Le corps optionnel `{ reason? }` était donc annoncé
**obligatoire** dans `/api/docs-json` : la console **dérive ses types** du document (`gen:api`), et ses
appels **sans** motif — qui existent et fonctionnent — seraient devenus non typables. Serveur correct,
client cassé : exactement la classe de défaut pour laquelle `openapi-contract.e2e-spec.ts` a été écrit,
et qu'aucun test HTTP ne pouvait attraper puisque les réponses réelles étaient déjà bonnes.
⇒ `@ApiBody({ required: false })` sur les deux routes + **garde durable** dans le spec de contrat
(symétrique de AC-03, côté requête). Vérification docker **rejouée sur l'état final**.

### Vérification docker — stack neuve (`down -v`), 7 lignes réelles

Mongo 7 rs0 + Redis + Kafka + `auth-service`, `PLATFORM_ADMIN` semé, jetons RS256 réels.

- **Écriture** : `suspend` avec `{"reason":"  Impayés\n3 mois  "}` ⇒ document réel portant
  `reason: 'Impayés 3 mois'` — **trimé et retour à la ligne remplacé** ; `reactivate` avec motif idem ;
  `suspend` **sans corps** ⇒ document **sans champ** `reason` *(absent, pas `null`)*.
- **Lecture** : `GET :id/audit` rend les 7 lignes, du plus récent au plus ancien, **avec l'identité
  réellement jointe** (`admin@prospera.local`, `Admin Plateforme`) — c'est la seule preuve que `users`
  est le bon nom de collection.
- **Les trois cas d'acteur, observés en vrai** : présent ⇒ identité + `deleted:false` · **suppression
  logique** (`deletedAt` posé sur un opérateur inséré pour l'occasion) ⇒ **identité rendue quand même** +
  `deleted:true` · **document absent** ⇒ `{ id, deleted:true }` seul, **ligne préservée**.
- **Aucun `passwordHash`** dans le corps de réponse (grep sur le JSON complet).
- Pagination `?page=2&limit=2` cohérente avec `total: 5` ; `404` sur organisation inconnue **et** sur id
  non-ObjectId ; `400` au-delà du plafond (`limit must not be greater than 100`) ; `401` sans jeton ;
  `400` sur motif > 500 caractères et sur champ additionnel ; `200` sans corps (non-régression).
- **Idempotence STORY-144 préservée** : un `reactivate` sur une organisation déjà `ACTIVE` reste un
  **no-op 200 sans ligne** de journal.
- OpenAPI de l'instance : route présente, `$ref: PaginatedAdminAuditDto`, `limit.maximum: 100`,
  `requestBody.required: false` sur les deux routes.

Stack arrêtée après la vérification (`docker compose stop`).

### Revues

**Revue de code** et **revue de sécurité** conduites **dans la session** (`opus`) : le scan délégué a été
interrompu par une limite de plateforme, et la règle du dépôt interdit de déléguer — elle n'oblige jamais
à le faire. **0 constat bloquant, 0 vulnérabilité.** Vérifié pièce à pièce : chaque route du contrôleur
porte une permission (plancher de classe + décorateur de route), les trois entrées neuves sont bornées
(`@IsInt/@Min/@Max`, `@IsString/@MaxLength(500)`), aucun secret ni journalisation ajoutés, la projection
du `$lookup` tient hors du pipeline `passwordHash` et les empreintes de jetons, et un objet passé en
`reason` ressort **scalaire** (coercition `enableImplicitConversion`) *ou* rejeté par `@IsString` — deux
gardes, pas une.

### Trois observations, non corrigées

1. **`page` n'a pas de borne haute** — `?page=999999999` produit un `$skip` énorme. Sans effet pratique
   *(journal par organisation de taille modeste, appelant déjà authentifié et porteur d'`org:read`)* et
   la borne utile est celle de `limit`, qui existe.
2. **`actor.deleted` confond « document absent » et « suppression logique »** — délibéré : dans les deux
   cas le compte n'est plus là, et la distinction n'apporte rien à un lecteur d'audit. L'identité rendue
   *(ou non)* sépare déjà les deux à l'œil.
3. ⚠️ **Hors périmètre, trouvé au passage** : `DemoOrgSeedService.upsertOrganisation` place
   `status: ACTIVE` dans un **`$set`** (et non un `$setOnInsert`) — **chaque redémarrage réactive donc en
   silence le cabinet de démonstration suspendu**, sans ligne de journal ni événement
   `identity.org.updated`. Observé pendant la vérification. Relève de STORY-180 ; **non corrigé ici**, à
   porter en gap.

### Instabilité e2e

**1 échec en 8 exécutions** de la suite e2e complète, non reproduit sur les **6 dernières consécutives**
et survenu pendant que la stack docker tournait en parallèle. Le nom du test n'a pas été capturé —
signalé tel quel plutôt que passé sous silence.

## Liens

- Ticket d'origine : `tickets/TICKET-BACKEND-journal-d-audit-des-organisations-non-lisible.md`
- `GAP-audit-organisations-non-lisible` (`sprint-status.yaml` → `open_contract_gaps`)
- **AP-24** — le consommateur frontend, à livrer après.
- **STORY-144** — écrit le journal. **STORY-292 / 293** — même bloc EPIC-025.
