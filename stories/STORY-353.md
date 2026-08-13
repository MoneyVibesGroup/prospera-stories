# STORY-353 : Portée du portefeuille — responsable, contributeurs, « Mon cabinet » et archivage

**Epic :** EPIC-043 — Dossier client, unité de travail du cabinet
**Réf. :** ticket `TICKET-BACKEND-dossier-client-entite-de-premier-rang.md` — bloc **B** (volet RBAC) · décisions **D6**, **D9**, **D11**, **D13** · questions **Q2**, **Q4**
**Priorité :** Must Have
**Story Points :** 5
**Statut :** 🚧 En cours
**Complexité :** medium
**Créée le :** 2026-08-09
**Sprint :** 20
**Service :** `dossier-service`

---

## Le constat

STORY-301 pose le dossier ; elle ne dit **pas qui le voit**. Or dès qu'un cabinet a deux
collaborateurs, la question « qui voit quel dossier » cesse d'être théorique : c'est elle qui décide
si Prospera est utilisable dans un cabinet de cinq personnes ou seulement chez un indépendant.

Deux droits distincts sont ici, et les confondre est le défaut classique :

- le **rôle** (`TENANT_ADMIN` / `TENANT_USER`) dit **ce qu'on peut faire** — il existe déjà
  (`auth-service`, STORY-006) ;
- l'**affectation** dit **sur quoi** — elle n'existe nulle part.

Les mélanger produit soit un collaborateur qui voit tout le portefeuille, soit un administrateur
incapable de reprendre un dossier orphelin.

---

## User Story

En tant qu'**administratrice de cabinet**,
je veux **affecter chaque dossier à un responsable et voir l'ensemble du portefeuille**,
afin que **chaque collaborateur travaille sur ses dossiers sans voir ceux des autres**.

---

## Ce que la story livre

- **Affectation** sur `Dossier` : un `responsableUserId` **obligatoire** et une liste
  `contributeursUserIds` (facultative, sans doublon, sans le responsable).
- **`PATCH /dossiers/:id/affectation`** — `@Roles(TENANT_ADMIN)`. Change le responsable et/ou les
  contributeurs, **historisé** au journal du dossier (auteur, horodatage, avant/après).
- **Portée serveur, dérivée du jeton** : un `TENANT_USER` ne voit que les dossiers où il est
  responsable **ou** contributeur. La restriction vit **dans la requête Mongo**, jamais dans un filtre
  applicatif après lecture, et **jamais** dans un paramètre de requête fourni par le client.
- **D11 — « Mon cabinet » est réservé à l'administrateur** : un dossier `estLeCabinet: true` est
  **exclu de la portée** de tout `TENANT_USER` et **refuse toute affectation** (`409`). Il porte la
  comptabilité du cabinet : salaires, résultat.
- **D9 / D13 — archivage** : `POST /dossiers/:id/archiver` et `POST /dossiers/:id/reactiver`,
  **`@Roles(TENANT_ADMIN)` uniquement**. L'archivage pose `statut: ARCHIVE`, `archiveLe`, `archivePar`
  et un `motif` facultatif ; il **retire le dossier du portefeuille actif** et de l'affectation de son
  responsable. **Aucune route de suppression n'existe** — et c'est un critère, pas un oubli.
- **D9 — un dossier archivé reste lisible** : `GET /dossiers/:id` le rend toujours, avec son statut ;
  seules les **écritures** sont refusées (`409 DOSSIER_ARCHIVE`), y compris l'ouverture d'un exercice.
- **Q2 — le départ d'un collaborateur ne crée pas d'orphelin** : à la consommation de
  `identity.user.updated` portant un membre désactivé, ses dossiers **retombent à l'administrateur**
  de l'organisation. L'historique reste attaché au dossier, jamais à la personne.

## Hors périmètre

- Le **modèle `Dossier` lui-même**, sa création et l'attestation de mandat → **STORY-301**.
- La **liste paginée** du portefeuille et ses compteurs → **STORY-359**.
- Le **journal lisible** (route de lecture) → **STORY-360** ; cette story **écrit** ses entrées.
- Toute notion de **permission par champ** : D12 donne au collaborateur un droit de modification
  large, encadré par la traçabilité et non par une liste de champs interdits.

---

## Acceptance Criteria

- [ ] `Dossier` porte `responsableUserId` (requis) et `contributeursUserIds` (défaut `[]`). Un
      contributeur ne peut pas être le responsable (`400`), et la liste est dédoublonnée côté serveur.
- [ ] `PATCH /dossiers/:id/affectation` — `TENANT_ADMIN` → **200** ; `TENANT_USER` → **403**, même
      s'il est le responsable actuel du dossier.
- [ ] Un `TENANT_USER` appelant `GET /dossiers` ne reçoit **que** ses dossiers (responsable ou
      contributeur). Un dossier d'un collègue demandé par son id → **404**, jamais **403**
      (anti-énumération, cohérent avec `profil-societe`).
- [ ] **D11** : le dossier `estLeCabinet` **n'apparaît jamais** dans la liste d'un `TENANT_USER` ;
      `GET /dossiers/:id` dessus → **404** pour lui ; `PATCH .../affectation` dessus → **409
      DOSSIER_CABINET_NON_AFFECTABLE**, quel que soit l'appelant.
- [ ] **D13** : `POST /dossiers/:id/archiver` — `TENANT_ADMIN` → **200**, statut `ARCHIVE`,
      `archiveLe`/`archivePar` peuplés ; `TENANT_USER` → **403**. Archiver `estLeCabinet` → **409**.
- [ ] **D9** : après archivage, `GET /dossiers/:id` répond **200** avec `statut: ARCHIVE` ; toute
      écriture (affectation, identité, ouverture d'exercice) → **409 DOSSIER_ARCHIVE**. Un test
      **échoue** si une route `DELETE /dossiers/:id` apparaît dans le contrôleur.
- [ ] **Q2** : à la désactivation d'un membre, ses dossiers ont pour responsable l'administrateur de
      l'org ; le journal porte la ligne « responsable changé — départ de X » attribuée au **système**.
- [ ] Un **mutation-test** est rouge quand on remplace la restriction de portée par un filtre
      applicatif post-lecture (la fuite ne doit pas dépendre du code appelant).

---

## Notes techniques

```ts
// dossier-service — extension du schéma Dossier (STORY-301)
@Prop({ type: Types.ObjectId, required: true }) responsableUserId!: Types.ObjectId;
@Prop({ type: [Types.ObjectId], default: [] })  contributeursUserIds!: Types.ObjectId[];
@Prop({ type: String, enum: ['ACTIF','ARCHIVE'], default: 'ACTIF' }) statut!: StatutDossier;
@Prop({ type: Date })   archiveLe?: Date;
@Prop()                 archivePar?: string;
@Prop()                 motifArchivage?: string;
```

- Index de portée : `{ orgId: 1, statut: 1, responsableUserId: 1 }` et
  `{ orgId: 1, statut: 1, contributeursUserIds: 1 }` — les deux chemins de lecture d'un collaborateur.
- **La portée est un filtre de requête**, appliqué dans le repository :
  `{ orgId, ...(estAdmin ? {} : { $or: [{ responsableUserId: uid }, { contributeursUserIds: uid }], estLeCabinet: { $ne: true } }) }`.
  Le `estLeCabinet: { $ne: true }` est **dans le même objet** que le `$or` : le sortir en garde
  applicative rouvrirait la fuite au premier appelant distrait.
- Read-model `OrgMembers` (alimenté par `identity.*`) : sert à résoudre « qui est l'administrateur de
  cette org » pour Q2, sans appel REST à l'IdP (invariant P3).

---

## Arbitrages de rédaction (2026-08-13)

### ⚡⚡ ① La prémisse de **Q2** était fausse : `identity.user.updated` ne peut pas porter un départ

La story annonçait « à la consommation de `identity.user.updated` portant un membre désactivé ».
Vérification faite **chez le producteur** (`auth-service/src/kafka/outbox/identity-events.ts` et
`identity-events.service.ts:105`), cet événement :

- est émis **uniquement** par `my-profile.service.ts` — la modification **self-service** de son propre
  profil. Un membre suspendu ne peut plus se connecter : il ne peut donc pas déclencher cet
  événement. Y brancher la retombée aurait produit une **branche morte** — du code testé au mock,
  jamais exécuté en production ;
- ne porte **ni `orgId` ni `role`** (`userId`, `email`, `firstName`, `lastName`, `status`). Impossible
  d'en déduire *dans quel cabinet* les dossiers doivent retomber, ni *à qui*.

Le signal réel du départ est **`identity.membership.changed` avec `status: 'SUSPENDED'`**, émis sur
**les deux** chemins de départ d'`auth-service` (`user-management.service.ts:143` désactivation,
`:217` retrait du membre). Il porte `orgId` **et** `role` — donc à la fois le déclencheur et de quoi
alimenter le read-model `OrgMembers` que les *Notes techniques* réclament. **C'est lui qui est
consommé.**

`identity.user.suspended` (émis sur les mêmes chemins) n'est **pas** consommé : sur ces chemins il
double `membership.changed` sans rien apporter — il ne porte pas d'`orgId`. Un second consommateur
serait deux chemins de code pour une seule règle.

### ② `responsableUserId` est **absent** sur « Mon cabinet », et c'est D11 qui l'impose

AC-1 le dit « requis ». Mais D11 fait de `estLeCabinet` un dossier qui **refuse toute affectation**
(`409`, quel que soit l'appelant) : lui inventer un responsable serait écrire une donnée qu'aucun
chemin ne peut plus corriger. La seule source disponible à la création automatique serait le
`createdByUserId` de `identity.org.created`, que la validation d'enveloppe de STORY-301 **replie sur
la chaîne vide** quand il manque — donc pas un `ObjectId`.

Retenu : `responsableUserId` est **optionnel au schéma**, **toujours peuplé sur un dossier client**
(par construction — posé à la création, jamais effaçable ensuite), et **absent sur « Mon cabinet »**.
Le rendre `required` au schéma aurait fait échouer la création automatique du dossier du cabinet — la
règle D1 sacrifiée à la lettre d'un AC.

### ③ À la création, le responsable est **l'administratrice qui crée**

STORY-301 possède le DTO de création et son périmètre est clos. Plutôt que d'y ajouter un champ,
`POST /dossiers` pose `responsableUserId = userId du jeton` ; `PATCH …/affectation` réaffecte ensuite.
Aucun dossier client ne naît donc sans responsable, et la surface de STORY-301 est inchangée.

### ④ `GET /dossiers` est livré **sans pagination ni compteurs** (ils restent à STORY-359)

Les AC exigent qu'un `TENANT_USER` appelant `GET /dossiers` ne reçoive que ses dossiers : sans route
de liste, la portée — l'objet même de la story — ne serait observable nulle part. La liste livrée ici
est **le portefeuille actif scopé**, trié, sans `page`/`limit`/compteurs : STORY-359 les ajoute
par-dessus, sans changer le filtre.

### ⑤ L'archivage **ne vide pas** `responsableUserId`

« retire le dossier […] de l'affectation de son responsable » est appliqué **par le statut** : le
dossier archivé sort de la liste (filtrée sur `ACTIF`), sans perdre la trace de qui en avait la
charge. Effacer le champ rendrait la **réactivation** orpheline — exactement l'orphelin que Q2
cherche à éviter, créé par la story qui l'interdit.

---

## Dépendances

**Prérequises :** **STORY-301** *(modèle `Dossier`, service, journal)* · **STORY-006** *(rôles)* ·
**STORY-123** *(événement `identity.user.updated`, déjà livré)*.

**Débloque :** **STORY-359** *(portefeuille paginé — sa portée est celle-ci)* · **STORY-360**
*(journal lisible)* · le volet frontend FE-D00.

---

## Definition of Done

- [ ] Lint 0 warning · build OK · couverture ≥ seuils (90/65/90/90), module neuf à 100 %.
- [ ] e2e : portée admin/collaborateur, 404 anti-énumération, `estLeCabinet` invisible et
      non-affectable, archivage réservé à l'admin, écriture refusée après archivage, absence de route
      `DELETE`, retombée à l'admin au départ d'un membre.
- [ ] Vérification docker bout-en-bout avec **deux collaborateurs réels** et JWT RS256 : chacun ne
      voit que ses dossiers, l'admin voit tout, y compris « Mon cabinet ».
- [ ] `/code-review` + `/security-review` (l'objet de la story **est** une frontière de sécurité).

---

## Story Points Breakdown

- Champs d'affectation + validations (contributeur ≠ responsable, dédoublonnage) : 1 pt
- Filtre de portée dans le repository + index + mutation-test : 1,5 pt
- Archivage / réactivation + refus d'écriture + absence de `DELETE` : 1 pt
- Règle `estLeCabinet` (invisible, non-affectable, non-archivable) : 0,5 pt
- Retombée à l'admin sur départ de membre (consumer) : 0,5 pt
- Tests e2e + vérification docker à deux collaborateurs : 0,5 pt
- **Total : 5 points**

---

## Progress Tracking

| Phase | État | Note |
|---|---|---|
| Rédaction | ✅ | 2026-08-13 — 5 arbitrages tracés, dont la **correction de la prémisse de Q2** |
| Développement | ✅ | branche `MNV-353` |
| Validation (DoD) | ✅ | lint 0 · build OK · **400 unit + 60 e2e** · couverture **99,34 / 93,22 / 96,57 / 99,29** |
| Mutation-tests | ✅ | **35 mutations, 35 rouges** |
| Vérification docker | ✅ | voir ci-dessous — **1 défaut trouvé et corrigé** |
| Revue de code | ✅ | **2 constats tracés, 0 bloquant** — le seul défaut réel avait été trouvé en vérif docker |
| Revue de sécurité | ✅ | **0 vulnérabilité** — la frontière est le sujet même de la story |
| Clôture | ✅ | PR `prospera-dossier-service#2` rebase-mergée sur `dev` |


### ⚡⚡ Défaut trouvé par la vérification docker — invisible à 395 unitaires

Deux administratrices affectant le **même** dossier en même temps rendaient
**`500`** :

```
MongoServerError: Write conflict during plan execution and yielding is disabled.
:: Please retry your operation or multi-document transaction.
```

**Pourquoi le verrou optimiste ne l'attrapait pas.** Le filtre
`{ _id, orgId, version: versionAttendue }` devait rendre `null` sur une écriture
concurrente, donc `409 CONFLIT_CONCURRENT`. Mais sous l'isolation *snapshot* de
Mongo, la seconde transaction est **avortée par le serveur avant** d'avoir pu
constater que la version avait bougé : elle n'atteint jamais ce `null`.

**Pourquoi rien ne l'a vu.** Les unitaires doublent la session **et** le `Model` :
ils n'ont aucun moteur transactionnel, donc structurellement rien pour entrer en
conflit. Aucun nombre de tests unitaires n'aurait pu le révéler.

Corrigé en mappant le conflit d'écriture (code `112` **ou** label
`TransientTransactionError`) sur le **même** `409 CONFLIT_CONCURRENT` : c'est le
même événement métier, il doit rendre la même réponse. **Sans réessai** — la
`version` ayant été lue avant la transaction, relire pour réessayer écraserait
silencieusement l'écriture concurrente, soit exactement la perte de mise à jour
que ce verrou existe pour empêcher. Trois tests de non-régression ajoutés (code,
label, et les deux cas qui ne sont PAS des conflits).

**Vérification rejouée sur l'état corrigé** : `409` + `200`, une seule écriture
aboutie, `version` incrémentée une fois, exactement **une** ligne de journal de
plus.

### Ce que la vérification docker a établi (stack neuve `down -v`, JWT RS256 réels)

Cabinet réel, **un admin et deux collaborateurs**, tous créés par l'IdP.

**Portée (D6/D11)** — 3 dossiers clients + « Mon cabinet » :

| Appelant | `GET /dossiers` |
|---|---|
| admin | Boulangerie, **Cabinet Santos & Associés**, Pharmacie, Transport |
| collab1 (resp. Boulangerie, **contributeur** Transport) | Boulangerie, Transport |
| collab2 (resp. Pharmacie) | Pharmacie |

`collab1 → dossier de collab2` : **404**. `collab2 → dossier de collab1` : **404**.
`collab → « Mon cabinet »` : **404**. `admin → « Mon cabinet »` : **200**.
`collab1 PATCH affectation sur SON dossier` : **403**.
`PATCH affectation` et `POST archiver` sur « Mon cabinet » : **409
DOSSIER_CABINET_NON_AFFECTABLE** / **DOSSIER_CABINET_NON_ARCHIVABLE**.

⚡ **La portée est bien celle que MONGO applique, pas l'application** : la requête
de portée rejouée à la main en `mongosh` rend le **même** ensemble, et
l'`explain()` montre un `OR` sur les **deux index de portée**
(`orgId_1_statut_1_responsableUserId_1` et son pendant `contributeursUserIds`) —
ils sont porteurs, pas décoratifs.

**Archivage (D9/D13)** — archivé par l'admin (`403` pour le collaborateur, même
responsable), `archiveLe`/`archivePar`/`motifArchivage` peuplés, **responsable
conservé**, sorti du portefeuille actif, **toujours lisible** (`200`, statut
`ARCHIVE`), toute écriture refusée (**409 `DOSSIER_ARCHIVE`**), réactivation
effaçant réellement les trois marqueurs (`$unset` observé en base), réactivation
d'un dossier actif refusée (**409 `DOSSIER_NON_ARCHIVE`**). `DELETE` : **404 de
routage**, dossier intact.

**Q2 — départ réel via le round-trip Kafka complet.** `PATCH /users/:id` à
`SUSPENDED` sur l'IdP → `identity.membership.changed` → read-model `org_members`
passé à `SUSPENDED` → les 2 dossiers de collab1 repris : responsable rendu à
l'admin sur l'un, **retiré des contributeurs** sur l'autre. Le dossier de collab2
est **intact**. 2 lignes `AFFECTATION_MODIFIEE` attribuées à `SYSTEME`, avec
avant/après et motif.

⚡ **Idempotence prouvée PAR LE FILTRE, pas seulement par l'`eventId`** :
réintégration (`ACTIVE` — ne déclenche rien, et ne rend **pas** les dossiers)
puis **second départ**, donc un événement **neuf**, hors table d'idempotence ⇒
**aucune ligne parasite** au journal. La convergence ne dépend pas du marqueur.

**Invariants mesurés en base** : 1 seul « Mon cabinet », `responsableUserId`
**absent** dessus (arbitrage ②) · 0 dossier client sans responsable · 0 dossier
sans journal · 0 entrée de journal orpheline · outbox **intégralement drainée**
(13 événements `SENT`, dont 7 `dossier.updated` — le hook que STORY-301 avait
laissé inerte est désormais câblé) · le collaborateur suspendu ne peut plus
obtenir de jeton (**401**).


---

## Revue de code — 2 constats, aucun bloquant

Menée **en session `opus`** sur le diff complet (27 fichiers). Le seul défaut de
correctness de cette story avait déjà été trouvé et corrigé par la vérification
docker (le `500` sur écritures concurrentes, ci-dessus) — la revue n'en a pas
trouvé d'autre.

**① Un dossier peut être affecté à un `userId` qui n'est pas membre du cabinet
— TRACÉ, non corrigé.** `PATCH …/affectation` valide la *forme* de
l'identifiant (`@IsMongoId`), pas l'*appartenance*. Une administratrice qui colle
un mauvais identifiant obtient un dossier que plus personne ne voit — sauf elle,
puisque la portée admin ignore l'affectation. **Aucune fuite** : l'identifiant
étranger reste sans effet, la portée exigeant d'abord l'`orgId` du jeton.

Non corrigé, et délibérément : le read-model `org_members` est **éventuellement
cohérent**. Refuser sur sa foi rejetterait l'affectation d'un collaborateur
fraîchement invité dont l'événement n'est pas encore projeté — un *fail-closed*
au mauvais endroit, qui casse un geste légitime pour se protéger d'une faute de
frappe. À traiter avec **STORY-359/360**, quand la console affichera la liste des
membres et que l'identifiant cessera d'être saisi à la main.

**② `GET /dossiers` n'est pas borné — TRACÉ, assumé.** Ni pagination ni plafond :
ils appartiennent à **STORY-359**. Un plafond *silencieux* aurait été pire que
son absence — c'est le défaut « portefeuille faux et parfaitement plausible »
que ce dépôt a déjà payé. La lecture reste scopée au cabinet, donc bornée par la
réalité d'un cabinet togolais en v1.

## Revue de sécurité — aucune vulnérabilité

L'objet de la story **est** une frontière d'autorisation : la revue a porté sur
elle en premier.

- **Isolation multi-tenant** — tout chemin de lecture passe par `filtrePortee`,
  qui pose toujours l'`orgId` **du jeton** ; tout chemin d'écriture relit d'abord
  par ce filtre, puis écrit sous `{ _id, orgId, version }`. Aucune route ne prend
  d'`orgId` ni de portée en paramètre.
- **Élévation de privilège** — les trois écritures sont `@Roles(TENANT_ADMIN)` ;
  un collaborateur ne peut pas s'ajouter à un dossier (`403`, prouvé en docker et
  par les mutations M32/M34). Le retrait du `@Roles` sur la **lecture** est
  compensé *dans la requête*, et quatre mutations (M01, M03, M06, M33) l'attestent.
- **Anti-énumération** — `404` et jamais `403` hors de portée, y compris sur
  `PATCH` et `POST` (vérifié entre deux cabinets réels).
- **Injection NoSQL** — impossible : `@IsMongoId` sur les identifiants (un
  `{ $ne: null }` est refusé en `400`), `Types.ObjectId.isValid` sur le paramètre
  de route, `@IsString` sur le motif.
- **`org_members` n'est pas une source d'autorisation**, et le code le dit
  explicitement : l'autorisation reste le JWT RS256 validé localement. Même un
  read-model empoisonné ne donnerait **aucun accès** — le repreneur désigné ne
  peut toujours pas lire sans un jeton valide du cabinet.
- **Ordre des partitions** — `identity.membership.changed` est partitionné par
  `orgId` chez le producteur : tous les événements d'un cabinet sont ordonnés sur
  une seule partition, consommée par un seul membre du groupe. L'upsert du
  read-model ne peut donc pas entrer en course avec lui-même.
- **Fuite de données** — les événements `dossier.*` ne transportent ni
  affectation ni donnée personnelle ; le journal ne stocke que des identifiants.
