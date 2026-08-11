# STORY-185 : Les **packs verticaux** n'existent nulle part — la console propose une offre que rien ne stocke

**Epic :** EPIC-014 — Catalogue plateforme (`platform-catalog-service`)
**Réf. :** **AP-06** *(assistant de provisioning — consommateur nº 1)* · **AP-04** *(onglet « Plateformes » de la maquette)* · **STORY-171** *(`Organization.vertical` — le champ auquel un pack se rattache)* · **STORY-032** *(catalogue admin CRUD, le patron à recopier)*
**Découverte par :** revue de cohérence maquette ⇄ code du 2026-08-06, après livraison d'AP-06/AP-07
**Priorité :** Should Have — ⚡ **non bloquante pour AP-06**, qui vit avec une config en dur ; bloquante pour l'écran « Plateformes » de la maquette
**Story Points :** 5
**Statut :** done
**Complexité :** medium
**Créée le :** 2026-08-06
**Démarrée le :** 2026-08-11
**Clôturée le :** 2026-08-11
**Sprint :** 20
**Service :** `platform-catalog-service` (`:3003`)

---

## Le constat

**Un « pack vertical » est aujourd'hui un fichier TypeScript dans le frontend.**

```ts
// frontend-admin-panel/src/features/provisioning/config/vertical-packs.ts
export const VERTICAL_PACKS: Record<Exclude<Vertical, "">, VerticalPack> = {
  Distribution: { referentiel: { code: "syscohada-revise", version: "2.1" },
                  modules: ["bilan", "pdv", "stock", "catalogue", "commande", "facturation"] },
  Finance:      { referentiel: { code: "sfd-bceao", version: "1.3" }, modules: [...] },
  Assurance:    { ... },
  "Expertise comptable": { ... },
};
```

Côté service, **la notion n'est pas modélisée** :

| Vérification | Résultat |
|---|---|
| `ls platform-catalog-service/src/modules` | `auth` · `catalog` · `entitlements` · `projects` — **pas de `packs`** |
| Entité « pack » / « vertical » dans le schéma | ⛔ aucune |
| Route servant la composition d'un vertical | ⛔ aucune |
| Story couvrant le sujet | ⛔ aucune *(recherche menée sur `stories/` et `frontend-stories/` avant d'écrire celle-ci)* |

⚠️ **AP-06 n'a pas triché** : sa story ne demande qu'une *« config déclarative des packs vertical
(modules + référentiel par défaut), extensible »*. Un fichier de config **satisfait** ce critère.
Ce qui ne tient pas, c'est l'**onglet « Plateformes »** ajouté à la maquette de la console : il
permet de **créer et d'éditer** un pack, et il n'a aucun serveur derrière lui.

## Pourquoi ça compte

Un pack en dur est acceptable tant qu'une seule personne le modifie, à la compilation. Il cesse de
l'être dès que **l'offre devient commerciale** :

1. **Ouvrir une cinquième verticale ne doit pas être un déploiement frontend.** C'est exactement
   l'exigence que `STORY-171` §D pose déjà pour le vertical lui-même — le pack doit suivre la même
   règle, sinon on aura résolu la moitié du problème.
2. **Deux consommateurs, deux copies.** L'app distributeur (`DI-*`) et la page publique de paiement
   auront besoin de savoir ce que « le vertical distributeur » ouvre. Avec un pack en dur dans la
   console, chacun en refera une copie — et elles divergeront, en silence.
3. **Un pack est une décision produit datée.** Savoir *ce qu'on vendait en mars* n'est pas
   reconstituable depuis un fichier de config écrasé par le commit suivant.

⚠️ **Ce n'est PAS un projet** (`EPIC-026`). Un `Project` est le périmètre de modules **d'une
organisation donnée** ; un pack est le **gabarit** d'un secteur, avant toute organisation. Les
confondre ferait du pack une instance et perdrait ce qui en fait la valeur : sa réutilisation.

---

## Périmètre

**Inclus :**

- Entité `VerticalPack` : `{ key, label, referentiel: { code, version }, modules: string[], status, order }`.
- `GET /catalog/packs` — lecture, **ouverte à `catalog:read`** *(la console la lit à chaque ouverture de l'assistant)*.
- `POST|PATCH /catalog/admin/packs/:key` + `DELETE` — écriture, **`catalog:manage`**.
- **Validation référentielle à l'écriture** : chaque `moduleCode` doit exister au catalogue, le couple
  `(referentiel.code, referentiel.version)` aussi. Un pack qui référence un module inexistant est un
  pack qui produira des lignes « non octroyable » chez tous les clients.
- Seed des **quatre packs actuels**, repris à l'octet près de `vertical-packs.ts` — le fichier front
  est la source de vérité de la migration, pas une inspiration.

**Hors périmètre :**

- Le **rattachement** d'un pack à une organisation (c'est l'entitlement, AP-05, déjà livré).
- La **tarification** d'un pack (Module 2).
- L'historisation/versionnement d'un pack — à ouvrir si le besoin « ce qu'on vendait en mars »
  devient réel ; le noter ici ne l'engage pas.

---

## ✅ Décision tranchée : **option A** — la `key` du pack EST la valeur du vertical

`STORY-171` prévoit `Organization.vertical` sur une **liste fermée** (`cabinet`, `distributeur`,
`imf-sfd`, `assurance-cima`). Deux options étaient ouvertes :

| Option | Conséquence |
|---|---|
| **A — la `key` du pack EST la valeur du vertical** | un vertical = un pack, point. Simple, et interdit deux offres pour un même secteur. |
| **B — un pack porte un `vertical` en attribut** | plusieurs packs par secteur (« distributeur essentiel » / « distributeur complet »). Ouvre la porte au commercial, complique tout de suite. |

**Décision PO du 2026-08-11 : option A.** B le jour où quelqu'un demande deux offres — passer de A à
B, c'est ajouter une colonne ; l'inverse, c'est une migration de données. La `key` est donc **unique**
et porte la taxonomie produit.

**Corollaire tranché en même temps — taxonomie des clés : celle de `STORY-171`**, et non le champ
`legacy` du fichier front, qui en **diverge** (`imf` vs `imf-sfd`, `assurance` vs `assurance-cima`) :

| `key` du pack | `legacy` front | libellé console |
|---|---|---|
| `cabinet` | `cabinet` | Expertise comptable |
| `distributeur` | `distributeur` | Distribution |
| `imf-sfd` | ⚠️ `imf` | Finance |
| `assurance-cima` | ⚠️ `assurance` | Assurance |

⚡ **L'AC 4 se lit donc sur la substance, pas sur la clé** : le seed doit être identique à
`vertical-packs.ts` sur le **référentiel, la liste de modules et son ordre** ; la clé, elle, suit la
liste fermée du vertical pour qu'aucune table de correspondance n'ait à être réinventée le jour où
`STORY-171` sort. Le libellé (`label`) reprend le libellé de console, qui est la clé du `Record` front.

⚠️ **`STORY-171` est `not_started` au moment d'implémenter** : `Organization.vertical` n'existe pas
encore. Cette story n'en dépend pas — elle **fixe** la taxonomie que 171 reprendra. Aucune contrainte
d'intégrité référentielle vers l'organisation n'est posée ici (ce serait une frontière cross-service,
interdite par l'invariant nº 2).

---

## Critères d'acceptation

- [x] `GET /catalog/packs` rend les packs actifs, triés par `order` ; `catalog:read` exigé.
- [x] `POST|PATCH|DELETE /catalog/admin/packs/:key` sous `catalog:manage` ; **403** pour tout autre rôle.
- [x] **Un pack référençant un module ou un référentiel inconnu est refusé en 422**, avec le champ fautif.
- [x] Les quatre packs actuels sont seedés et **identiques** à `vertical-packs.ts` — vérifié par un test
      qui compare les deux listes, pas par relecture.
- [x] Un pack **vide** (aucun module) est valide : une plateforme peut exister avant d'être composée.
      *(La console le dit déjà — « Ce pack ne contient encore aucun module ».)*
- [x] OpenAPI à jour ; `npm run gen:api` côté console rend les types sans écart.
- [x] Tests : lecture, écriture, refus 422, refus 403, seed conforme.

---

## Tâches

- [x] Trancher A vs B *(PO)* — **tranché le 2026-08-11 : option A**, clés sur la taxonomie `STORY-171`.
- [x] Schéma `VerticalPack` + module `packs` (AC 1, 2)
- [x] Validation référentielle contre modules & référentiels (AC 3)
- [x] Seed des quatre packs + test de conformité au fichier front (AC 4, 5)
- [x] OpenAPI + tests (AC 6, 7)

---

## Ce que la console fera ensuite *(hors de cette story)*

`vertical-packs.ts` devient un **repli** : la config en dur reste, la console lit d'abord le service
et retombe dessus s'il ne répond pas. Puis, une fois la lecture éprouvée, le fichier disparaît et
l'onglet « Plateformes » d'AP-04 devient utilisable. ⚡ **Aucune story frontend n'est ouverte ici** :
elle n'aurait rien à faire tant que cette route n'existe pas.

---

## ⚠️ Note de capacité — à arbitrer par le PO

Le sprint 20 est **déjà à 64 points pour 34 de capacité** *(surcharge héritée de l'ajout des
STORY-179 → 184)*. Ces 5 points le portent à **69**. Le slot en S20 est celui qui a été demandé ; il
n'est pas tenable sans décaler autre chose. Ordre de décalage défendable, si la capacité doit être
tenue : **garder 179 + 180** *(sans elles, la revue KYC reste inexploitable)*, décaler **181 → 185**
au S21.

---

## Progress Tracking

**Statut : `done`** — démarrée et clôturée le 2026-08-11, PR #14 rebase-mergée sur `dev`.

- [x] **① Préalable PO levé** — option **A** (`key` = valeur du vertical, unique), clés sur la
      taxonomie fermée de `STORY-171`. Cf. § *Décision tranchée*.
- [x] ② Schéma `VerticalPack` + module `packs`
- [x] ③ Validation référentielle (modules & référentiels) → 422
- [x] ④ Seed des quatre packs + test de conformité au fichier front
- [x] ⑤ OpenAPI + tests
- [x] ⑥ Vérification docker de la persistance réelle

### Portes de qualité

Lint **0 warning** · build OK · **574 tests verts** (49 suites), dont **79** sur
`packs` et **22** e2e · couverture au-dessus des seuils 65/90/90/90 (module
`packs` à **100 %** partout).

### Écarts assumés par rapport à la lettre du périmètre

| Écrit dans la story | Livré | Pourquoi |
|---|---|---|
| `POST /catalog/admin/packs/:key` | `POST /catalog/admin/packs`, clé **dans le corps** | patron de `CatalogAdminController` (STORY-032). Une clé en segment d'URL sur un `POST` créerait une **seconde grammaire d'écriture** dans le même service, et `gen:api` générerait deux styles d'appel pour deux ressources jumelles. `PATCH`/`DELETE` restent bien sur `:key`. |
| — | `GET /catalog/admin/packs` (+ `?status=`) ajouté | l'onglet « Plateformes » doit voir les packs `DEPRECATED`, que la lecture publiée masque par construction. Sans cette route, un pack retiré du commerce serait **invisible et inéditable**. |
| « le couple `(code, version)` doit exister » | existence **seule** — le statut n'est pas filtré | 🪝 **hook inerte documenté** : un référentiel `RETIRED` existe, il passe donc, alors que l'octroi le refusera (STORY-033, risque #6). Élargir ici casserait l'édition d'un pack dont le référentiel vient d'être retiré. À ouvrir quand le besoin sera réel. |

Hors périmètre respecté : ni rattachement à une organisation, ni tarification,
ni historisation ; **aucun topic Kafka** (un pack n'octroie rien, l'`Entitlement`
reste l'autorité) ; `tone`/`tag` laissés au front (décisions de maquette).

### Mutation-testing — 12 mutations, 12 rouges, 0 par erreur de compilation

Restauration par **copie de sauvegarde**, jamais `git checkout --` (piège de
STORY-144). Le script vérifie en plus, par `cmp`, que le fichier a **réellement**
changé — une mutation non appliquée passerait sinon pour « verte ».

| # | Mutation | Ce qu'elle prouve |
|---|---|---|
| M1 | semis `$setOnInsert` → `$set` | l'invariant central : le semis n'écrase jamais une édition |
| M2 | semis lit `modifiedCount` au lieu d'`upsertedCount` | le rapport ne ment pas sur une base vide |
| M3 | semis passe la **référence** des modules, pas une copie | la table gelée ne fuit pas dans l'écriture |
| M4 | lecture publiée ne filtre plus `ACTIVE` | une offre retirée ne peut pas être proposée |
| M5 | tri publié perd la clé de départage | l'ordre ne dépend pas du plan d'exécution Mongo |
| M6 | `update` n'appelle plus la validation des modules | le 422 n'est pas gardé qu'à la création |
| M7 | le 422 perd son `field` | AC 3 « avec le champ fautif » |
| M8 | `AllExceptionsFilter` cesse de laisser passer `field` | ⚡ **la liste blanche** : sans la déclaration, le champ est jeté **sans erreur** |
| M9 | le contrôleur de lecture perd `@RequirePermissions` | la garde est bien la sienne, pas celle d'un voisin |
| M10 | le seed dérive vers la clé `legacy` du front (`imf`) | le test de conformité **n'est pas tautologique** |
| M11 | `PackResponseDto` « range » les modules (`.sort()`) | l'ordre d'octroi est porteur de sens |
| M12 | `create` ne valide plus le référentiel | le couple est bien vérifié avant écriture |

### Vérification docker (stack neuve `down -v` — mongo, redis, kafka + `auth-service`, `platform-catalog-service`)

Base `catalog_service`, collection **`vertical_packs`** (snake_case explicite ;
`db.getCollectionNames()` listé d'abord).

**Semis au démarrage** — log `PacksSeedService` : `créés : 4 (distributeur,
imf-sfd, assurance-cima, cabinet) · déjà présents, non touchés : 0`. Les 4
documents sont en base avec le référentiel, les modules **dans l'ordre** et
`order` 1→4. Index créés : `key_1` **unique** et `status_1_order_1_key_1`. Le
sous-document `referentiel` **ne porte pas d'`_id`**.

**Écriture réelle** (jeton `PLATFORM_ADMIN` seedé) :

| Appel | HTTP | Base |
|---|---|---|
| `POST` pack `zone-test`, modules `["stock","bilan"]` | 201 | écrit, **ordre non alphabétique conservé** |
| `POST` même clé | **409** | toujours 1 document — index unique opposable |
| `POST` pack sans modules | 201 | `modules: []` — AC 5 |
| `PATCH {modules:["bilan"], status:"DEPRECATED"}` | 200 | remplacement **absolu** |
| `PATCH {modules: []}` | 200 | pack vidé |
| `DELETE` | 204 puis **404** au rejeu | document réellement supprimé |

**Refus 422 : aucune écriture, aucun orphelin.** Après `POST` avec un module
inconnu **et** `POST` avec `syscohada-revise@9.9` :
`count zone-test = 0 | total = 4`. Corps réels reçus — c'est ce qui prouve que
`field` traverse la liste blanche du filtre, ce qu'aucun e2e mocké ne peut
montrer :

```json
{"statusCode":422,"error":"Unprocessable Entity","message":"Module(s) inconnu(s) du catalogue : fantome.","code":"PACK_MODULE_UNKNOWN","field":"modules","requestId":"…"}
{"statusCode":422,"error":"Unprocessable Entity","message":"Référentiel « syscohada-revise@9.9 » inconnu du registre.","code":"PACK_REFERENTIEL_UNKNOWN","field":"referentiel","requestId":"…"}
```

Un `PATCH` mêlant un champ valide (`label`) et un module inconnu est refusé
**en bloc** : relu en base, `label` n'avait pas bougé.

**Visibilité `DEPRECATED`** : absent de `GET /catalog/packs`, présent sur
`GET /catalog/admin/packs?status=DEPRECATED`. La lecture publiée rend les 4 packs
**triés par `order`**, sans `_id`, `__v` ni horodatages.

**⚡ L'invariant du semis, prouvé sur un vrai redémarrage.** Pack `cabinet` édité
via l'API (`label` renommé, `modules: []`), puis `docker restart` :

```
créés : 0 · déjà présents, non touchés : 4 (distributeur, imf-sfd, assurance-cima, cabinet)
label=Cabinets comptables (edite) | modules=[] | total packs=4
```

L'édition **survit**, aucun doublon. C'est le seul endroit où cet invariant se
prouve : les unitaires assertent la **forme** de l'update, pas son effet.

### ⚠️ Constat trouvé par la vérification docker — supprimer un pack seedé n'est pas définitif

`DELETE cabinet` → 204, 3 packs restants → redémarrage → `créés : 1 (cabinet)` →
4 packs, **label et modules d'origine** : l'édition faite avant la suppression
est perdue avec elle.

Ce n'est pas un défaut mais la conséquence directe de « créer si absent » — le
semis ne peut distinguer « jamais semé » de « semé puis supprimé » sans garder
une pierre tombale, que la story ne demande pas. Le comportement n'était en
revanche **écrit nulle part** : un opérateur aurait vu le pack revenir sans
explication. Documenté depuis dans `PacksService.remove` et `PacksSeedService`,
avec le geste correct : **retirer un pack de départ se fait par
`PATCH { status: 'DEPRECATED' }`**, qui survit au redémarrage. `DELETE` reste
juste pour un pack créé à la main par erreur.

---

## Revue de code — ⚡⚡ trois défauts de même racine, dont un qui corrompait la base

Tous **reproduits contre le `ValidationPipe` réel** du service avant correction,
et **tous invisibles aux unitaires** : les specs appellent le service avec un DTO
déjà bien formé, elles ne peuvent pas voir ce que le pipe laisse passer.

**La racine commune :** `class-validator` **saute** un `@ValidateNested()` quand
la valeur est `undefined`, et `@IsOptional()` saute **aussi** sur `null` — pas
seulement sur `undefined`.

| # | Entrée | Avant | Après |
|---|---|---|---|
| 1 | `POST {"key","label"}` sans `referentiel` | **500** (`dto.referentiel.code` → TypeError) | **400** — `@IsDefined()` |
| 2 | `PATCH {"referentiel": null}` | **500** (`!== undefined` vrai pour `null`) | **400** — `@siPresent()` |
| 3 | `PATCH {"modules": null}` | **corruption de base + 500 pour TOUS** | **400** |

⚡⚡ **Le troisième est le grave.** Chaîne complète : le `null` passe le pipe →
`assertModulesExist(null)` le traite comme « rien à valider » (**aucun 422**) →
`findOneAndUpdate` l'écrit sans jouer les validateurs Mongoose → le pack devient
`{ modules: null, status: 'ACTIVE' }` → `[...doc.modules]` explose à **chaque**
lecture. `GET /catalog/packs` rendait alors **500 pour tous les appelants**, pas
seulement pour le fautif, **jusqu'à réparation manuelle en base** — l'assistant
de provisioning, consommateur nº 1 de la story, tombait entièrement. Mêmes
variantes pour `label` (document invalide en silence), `status` (le pack
**disparaît** de la lecture publiée) et `order`.

**Deux gardes, pas une** : `@siPresent()` (`ValidateIf(v !== undefined)`) sur
tous les champs d'`UpdatePackDto` ferme la **porte d'entrée** ; le `?? []` de
`PackResponseDto` est une garde de **lecture** — un document écrit hors API
(script, correction manuelle, reprise) n'a jamais franchi cette porte, et
`ModuleResponseDto` portait déjà exactement la même.

⚠️ **L'angle mort qui l'a laissé passer** : `collectCoverageFrom` exclut
`*.dto.ts`. La logique de `fromDocument` est **invisible aux seuils** — malgré le
« module `packs` à 100 % ». À ranger à côté de `*bootstrap*.ts` dans la liste des
endroits où un défaut ne se voit pas.

Aussi traités : `PacksService.findByKey` supprimé (aucun appelant, aucune route,
hors demande de la story — code mort et 2 tests qui gonflaient la couverture sans
consommateur) ; `@ApiCreatedResponse` sur le `POST`, qui répond **201** alors
qu'`@ApiOkResponse` seul le faisait typer 200 par `gen:api` (AC 6 « sans écart »).

**Constat laissé de côté, volontairement** : le même travers `@ApiOkResponse` sur
un `POST` existe dans `catalog-admin.controller.ts` (3 routes) — **pré-existant et
hors périmètre**, non corrigé ici.

**3 mutations de plus, 3 rouges** — retrait d'`@IsDefined`, retour à la sémantique
`@IsOptional`, retrait du `?? []`.

---

## Revue de sécurité — **0 vulnérabilité**, 1 durcissement

Vecteurs audités et fermés : RBAC (`PermissionsGuard` global, garde de classe
bien vue par `getAllAndOverride`, **aucune route paramétrée d'un autre contrôleur
ne peut capturer `/catalog/packs`**) · isolation (donnée plateforme, les rôles
tenant portent `perms: []` par construction, D15) · **injection NoSQL** (`@Param`
est toujours une chaîne côté Express ; `?status[$ne]=` est coercé puis rejeté par
`@IsEnum` avant tout accès Mongo) · **ReDoS** (les 4 motifs sont ancrés, linéaires,
sans quantificateur imbriqué) · **CWE-770** (le `PATCH` fait un `$set`, pas un
`$push` : l'endpoint rejouable ne peut pas faire croître le document vers la
limite BSON — le défaut de STORY-145 est fermé) · fuite (`PackResponseDto` est une
liste blanche : ni `_id`, ni `__v`, ni horodatages) · intégrité du semis (course
au démarrage arbitrée par l'index unique).

**Le durcissement retenu** — `AllExceptionsFilter` laissait passer `field` sur sa
**véracité**, là où son voisin `limitBytes` est gardé par son **type**. Ce filtre
est **global** : sur cette base, un émetteur futur posant `field: { … }` ferait
recopier l'objet tel quel dans le corps HTTP — vecteur d'exfiltration latent,
ouvert par un code qui n'aurait rien fait de visiblement fautif. Mutation M16
(retour à la véracité) : **rouge**.

Deux observations sous le seuil **non traitées**, délibérément : le reflet de la
`key` dans les 404/409 (réponse JSON + `nosniff`, motif déjà celui des autres
agrégats) et l'absence de pagination sur la liste des packs (comportement déjà
retenu pour les modules et les référentiels, et la création exige
`catalog:manage`). Les changer ici déborderait le périmètre.

---

## Vérification docker rejouée sur l'état final (après correctifs)

Les correctifs de revue changent le comportement d'écriture : la vérification a
été **refaite en entier** sur stack neuve, jamais reportée depuis la première.

```
Packs verticaux — créés : 4 (distributeur, imf-sfd, assurance-cima, cabinet)

1. POST sans referentiel   : HTTP 400   (était 500)
2. PATCH referentiel: null : HTTP 400   (était 500)
3. PATCH modules: null     : HTTP 400   (corrompait la base)
   label/status/order null : 400 400 400

cabinet.modules = ["bilan","fiscalite","equipe","support-client","dashboard"]
documents porteurs d'un champ nul en base : 0
GET /catalog/packs : HTTP 200 → [distributeur, imf-sfd, assurance-cima, cabinet]
422 → {"code":"PACK_MODULE_UNKNOWN","field":"modules", …}
POST valide → HTTP 201
```

**Bilan final** : lint 0 warning · build OK · **574 unitaires + 177 e2e verts** ·
module `packs` à **100 %** · **16 mutations, 16 rouges**, aucune par erreur de
compilation.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
