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
| Développement | 🚧 | branche `MNV-353` |
| Validation (DoD) | ⏳ | |
| Mutation-tests | ⏳ | |
| Vérification docker | ⏳ | deux collaborateurs réels, JWT RS256 |
| Revue de code | ⏳ | |
| Revue de sécurité | ⏳ | l'objet de la story **est** une frontière de sécurité |
| Clôture | ⏳ | |
