# STORY-188 : Le garde-fou **N/N-1** n'existe que dans la console — un appel direct au service le contourne sans rien signaler

**Epic :** EPIC-014 — Catalogue plateforme (`platform-catalog-service`)
**Réf. :** **AP-04** *(l'écran qui l'applique aujourd'hui)* · **STORY-032** *(le CRUD à amender)* · `frontend-admin-panel/src/features/catalog/support-window.ts` *(la règle, écrite en TypeScript)*
**Découverte par :** audit des actions du catalogue de la console, 2026-08-06
**Priorité :** Must Have — ⚡ **une règle métier contournable n'est pas une règle**
**Story Points :** 5
**Statut :** done
**Complexité :** high
**Créée le :** 2026-08-06
**Sprint :** 20
**Service :** `platform-catalog-service` (`:3003`)
**Assignée à :** `vivianMoneyVibesGroupes`

---

## Le constat

La règle *« pas de troisième majeure active sans dépréciation datée de la sortante »* — la **fenêtre
de support N/N-1** — est un invariant produit. Elle est aujourd'hui **entièrement côté console**.

`CreateModuleVersionDto` ne porte que `{ version, releasedAt? }`. **Ni `supersedesMajor`, ni la
notion de fenêtre de support.** Le service accepte donc une troisième majeure active sans rien dire.

Le client de la console le documente lui-même, sans le maquiller :

> *« Conséquence à connaître : la règle est tenue tant qu'on passe par cette console. Un appel direct
> au service la contourne sans rien signaler. Ce n'est donc **pas un invariant du système** — c'est
> une politique d'interface. »*

### Second défaut, du même endroit : la dépréciation n'est pas atomique

Le service n'offre **aucun geste atomique** pour « déprécier la sortante **et** publier la nouvelle ».
La console le fait donc en **deux appels** :

```
1. PATCH …/versions/:sortante   { status: DEPRECATED, deprecationDate }
2. POST  …/versions             { version, releasedAt }
```

⚠️ **Si le second échoue, le premier reste.** L'ancienne majeure est dépréciée, la nouvelle n'existe
pas : le module se retrouve avec **zéro version active** — un état que personne n'a demandé et que
rien ne rattrape. La console peut le dire à l'écran ; elle ne peut pas l'empêcher.

---

## ⚡ Vérification de la prémisse au démarrage (2026-08-12) — elle est **à moitié fausse**

Lecture de `module-versions.service.ts` **avant** d'écrire une ligne : le garde-fou **existe déjà côté
service**. `ModuleVersionsService.assertMajorBudget()` compte les majeures `ACTIVE` du module et refuse
une troisième — depuis STORY-032. Un appel direct au service **ne la contourne donc pas**.

Ce qui est vrai, et qui reste le cœur de la story :

| Affirmation de la story | Verdict | Ce qui est réellement en cause |
|---|---|---|
| « le service accepte une 3ᵉ majeure active sans rien dire » | ❌ **faux** | il refuse — `ConflictException` 409 |
| « `CreateModuleVersionDto` ne porte que `{version, releasedAt}` » | ✅ vrai | ni `supersedesMajor` ni `deprecationDate` |
| « aucun geste atomique déprécier + publier » | ✅ vrai | **la seule voie** est PATCH puis POST, non atomique |
| « le refus ne nomme ni le champ fautif ni les majeures » | ✅ vrai | phrase en français, sans `code`, `field`, ni majeures structurées |

⚡ **Le vrai défaut est plus retors que celui décrit.** Le garde-fou n'est pas absent : il est
**infranchissable**. N'ayant aucune façon de désigner la sortante dans l'appel de publication, l'admin
est *obligé* de passer par les deux appels — c'est le refus lui-même qui **impose** la séquence non
atomique dont la story décrit les dégâts. Le trou de « zéro version active » n'est pas un chemin de
traverse : c'est **le seul chemin offert**.

La story n'en est pas invalidée, son livrable ne change pas — mais l'AC 1 change de nature : il ne s'agit
pas d'**ajouter** un refus, il s'agit de le rendre **actionnable** (422 + `code` + `field` + majeures) et
de lui donner **une issue en un seul appel**.

---

## Périmètre

**Inclus :**

- `CreateModuleVersionDto` accepte `supersedesMajor?: number` et `deprecationDate?: string`.
- **Le service applique la règle**, quel que soit l'appelant : refuser en **422** la publication d'une
  majeure qui porterait à trois le nombre de majeures actives, **sauf** si l'appel désigne la sortante
  *et* sa date de fin de support.
- **Publication atomique** : dépréciation de la sortante et création de la nouvelle dans une seule
  transaction. Un échec ne laisse aucun état intermédiaire.
- Le refus nomme le **champ fautif** et les majeures en cause — l'écran doit pouvoir l'ancrer sur le
  bon input, pas afficher un message générique.

**Hors périmètre :**

- Changer la règle elle-même *(deux majeures actives, pas trois)* — elle est acquise.
- Le retrait (`RETIRED`) : geste distinct, déjà servi.
- La console : elle garde son calcul d'annonce **avant** le clic — c'est une aide à la décision, pas
  la garde. ⚡ Elle enverra désormais `supersedesMajor`, qu'elle calcule déjà et **jette** aujourd'hui.

---

## ⚠️ Ce qui existe déjà côté front, et qu'il ne faut pas réinventer

`support-window.ts` porte la règle et sa fonction `publishEffect(versions, moduleCode, version)`,
couverte par `support-window.test.ts` *(« l'arbitrage N/N-1 est annoncé AVANT la publication »)*. Elle
rend trois verdicts : rien à faire · arbitrage requis · refus. **C'est la spécification exécutable de
cette story** — la porter côté service, c'est la traduire, pas la redécouvrir.

---

## Décisions de conception (tranchées ici, absentes du cadrage)

1. **Le refus N/N-1 passe de `409` à `422`** — la story l'exige (« échoue en **422** »). C'est un
   **changement de contrat** : `ApiConflictResponse` de la route perd le motif N/N-1, qui devient un
   `ApiUnprocessableEntityResponse`. Le `409` reste pour ce qui est **vraiment** un conflit d'état :
   la version en double. Défendable : « trois majeures actives » n'est pas un conflit de ressource,
   c'est une **entité non traitable en l'état** — et c'est le statut que le service utilise déjà pour
   ses autres refus de règle métier porteurs d'un `code` (`REFERENTIEL_FAMILY_UNKNOWN`, STORY-148).
2. **Trois codes d'erreur stables**, portés **dans le corps** (patron STORY-138/148/185) :
   `SUPPORT_WINDOW_ARBITRATION_REQUIRED` · `SUPERSEDES_MAJOR_NOT_ACTIVE` · `DEPRECATION_DATE_REQUIRED`.
3. ⚠️ **Les majeures en cause exigent un champ de plus dans `AllExceptionsFilter`.** Ce corps est
   construit par **liste blanche** : poser `majors` sur l'exception ne suffit pas, il serait **jeté sans
   erreur** et l'AC « les majeures en cause » passerait pour satisfait alors que la console ne recevrait
   rien. C'est la **4ᵉ fois** que ce piège se présente (`code`, `limitBytes`, `field` avant lui).
4. **`supersedesMajor` est honoré dès qu'il est fourni**, pas seulement quand l'arbitrage est requis :
   c'est une intention explicite (« celle-ci sort du support »), et elle n'ouvre aucun pouvoir nouveau
   — le `PATCH` de dépréciation existe déjà et est ouvert à la même permission. Il doit désigner une
   majeure **`ACTIVE` du module** et **différente** de celle publiée (sinon `422`).
5. **Toute publication passe par une transaction**, arbitrage ou non. Un second chemin « sans session »
   pour le cas simple dédoublerait le garde-fou : la règle serait évaluée à deux endroits, et c'est
   exactement ainsi qu'une des deux copies se met à mentir.
6. **Mapping `E11000`** de l'index unique `(moduleCode, version)` vers le même `409` que le pré-contrôle.
   Sans lui, la publication concurrente de la même version répondait **500**. L'index est le vrai filet,
   le pré-contrôle n'est qu'une amabilité.

## Critères d'acceptation

- [x] Publier une majeure qui ferait **trois** majeures actives, **sans** `supersedesMajor`, échoue en
      **422** avec le champ fautif et les majeures en cause.
- [x] Le même appel **avec** `supersedesMajor` + `deprecationDate` réussit et déprécie la sortante.
- [x] `supersedesMajor` sans `deprecationDate` échoue en **422** — une dépréciation sans date de fin
      de support n'est pas une dépréciation.
- [x] **Atomicité prouvée** : un échec de création laisse la sortante **ACTIVE**. Test qui force
      l'échec après la dépréciation et vérifie qu'aucune version n'a changé d'état.
- [x] Un module ne peut **jamais** se retrouver sans version active du fait de cette route.
- [x] La règle s'applique **à l'appelant direct**, pas seulement à la console — testé sans passer par elle.
- [x] OpenAPI à jour ; la console peut retirer sa note « la règle n'est pas un invariant du système ».

---

## Tâches

- [x] Étendre `CreateModuleVersionDto` (AC 1, 2, 3)
- [x] Porter `publishEffect` côté service comme règle de validation (AC 1, 6)
- [x] Rendre la publication transactionnelle (AC 4, 5)
- [x] OpenAPI + tests (AC 7)

---

## ⚠️ Note de capacité

Le S20 passe de **75 à 80 points pour 34 de capacité**. Le slot est celui qui a été demandé.
Ordre de décalage défendable : garder **179 + 180**, décaler **181 · 185 · 186 · 187 · 188** au S21.
⚡ Si un seul de ces cinq doit rester, c'est **188** : les autres décrivent des manques, celui-ci
décrit une **règle métier que le système n'applique pas**.

---

## Progress Tracking

**Statut : `done` — 2026-08-12.** PR [#15](https://github.com/MoneyVibesGroup/prospera-platform-catalog-service/pull/15)
rebase-mergée sur `dev`, branche `MNV-188` supprimée.

### Ce qui a été livré

| Livrable | Fichier |
|---|---|
| Règle **pure** de la fenêtre de support (5 refus nommés) | `src/modules/catalog/fenetre-de-support.ts` (neuf) |
| `supersedesMajor` + `deprecationDate`, `@siPresent()` sur les 3 optionnels | `dto/create-module-version.dto.ts` |
| Publication **transactionnelle**, 422 porteurs de `code`/`field`/`majors`, mapping `E11000` | `services/module-versions.service.ts` |
| **4ᵉ** champ de la liste blanche du corps d'erreur (`majors`) | `common/filters/all-exceptions.filter.ts` |
| OpenAPI : `ApiConflictResponse` réduit au doublon, `ApiUnprocessableEntityResponse` listant les 5 codes | `controllers/catalog-admin.controller.ts` |

### Portes de qualité

Lint **0 warning** · build OK · **607 unitaires + 185 e2e** verts · couverture **99,85 / 96,36 / 100 / 99,92**
(seuils 65/90/90/90) · `fenetre-de-support.ts` et `module-versions.service.ts` à **100 % partout**.

**11 mutations** appliquées, toutes **rouges en compilant** (une mutation rouge par erreur de compilation ne
prouve rien — 2 premières tentatives ont dû être réécrites pour cela) : fenêtre comptée *avant* l'arbitrage ·
dépréciation sortie du `if` · `majors` retiré de la liste blanche · garde de forme affaiblie · création hors
session · champ fautif retiré · `E11000` traduisant toute erreur · dépréciation élargie à toutes les actives ·
retour à la sémantique `@IsOptional` · règle cessant de normaliser `null` · `endSession` sorti du `finally`.

### Vérification docker (Mongo réel, replica set `rs0`)

Collection : **`moduleversions`** — pluriel Mongoose par défaut, `ModuleVersionSchema` ne nomme pas sa
collection. Une requête sur `module_versions` aurait renvoyé `0` **sans erreur**.

1. Les **4 refus** (arbitrage requis · date requise · majeure requise · sortante inconnue) renvoient un 422
   dont le corps porte `code`, `field` et `majors` — **liste blanche du filtre réel traversée** — et **rien
   n'a bougé en base**.
2. Publication atomique : les **deux mineures** de la sortante (`1.0` et `1.2`) passent `DEPRECATED` **datées**
   dans le même appel, `2.0` reste intacte, `3.0` est créée `ACTIVE`. Majeures actives `{2,3}`.
3. **Atomicité prouvée par panne injectée** *après* la dépréciation, sur transaction réelle : réponse **500**,
   la sortante `3.0` **reste `ACTIVE`**, `5.0` **n'existe pas**. Le même appel réussit une fois la panne
   retirée. AC 5 vérifié à chaque étape : jamais 0 version active.
4. **Rejouée intégralement sur l'état final** après le correctif de revue : les 3 `null` → **400**, les champs
   absents restent optionnels, non-régression du 422 et de la publication atomique, **0 document daté de 1970**.

⚠️ **La première tentative de preuve d'atomicité a menti** : « Found 0 errors » affiché, mais le conteneur
exécutait encore l'ancien module — l'appel a répondu **201** au lieu d'échouer. Il a fallu un `docker restart`
explicite pour que la panne injectée s'exécute. Sans ce doute, la story aurait été close sur une preuve vide.

### Revue de code — 3 constats, 1 bloquant, tous corrigés (commit dédié)

**⚡⚡ Le bloquant est le même défaut qu'en STORY-185, au même endroit du pipe.** `@IsOptional()` saute la
validation sur `null` **autant que sur `undefined`**, alors que toute la fenêtre de support raisonne en
`=== undefined` : un `null` était donc jugé **fourni**.
`{ supersedesMajor: 1, deprecationDate: null }` répondait **201** au lieu du 422 de l'AC 3, et
`new Date(null)` datait la fin de support au **1ᵉʳ janvier 1970** — les cabinets restés sur la sortante
lisaient un support expiré depuis 56 ans, sans rattrapage possible. Invisible aux 603 tests d'alors : les
specs appellent le service avec un DTO déjà bien formé, et `*.dto.ts` est **exclu de la couverture**.

Les deux autres constats portaient sur des tests qui affirmaient plus qu'ils ne prouvaient (un nom contredisant
son assertion ; une moitié « échec » dont l'échec survenait *avant* l'ouverture de la session).

### Revue de sécurité — 0 vulnérabilité

Instruits sans constat : la garde du champ `majors` du filtre **global** (plus forte que celle de `field` —
`Array.isArray` + `every(number fini)` : le vecteur d'exfiltration fermé par STORY-185 n'est pas rouvert) ·
injection NoSQL sur les 3 entrées · session / TOCTOU / réutilisation · 409→422 face à l'anti-énumération ·
`@siPresent()`, qui est un **durcissement**.

### Laissé en l'état, sciemment

- **TOCTOU résiduel** : deux publications concurrentes de majeures *différentes* peuvent porter un module à 3
  majeures actives — Mongo offre l'isolation par snapshot, pas de verrou de prédicat. **Pré-existant** : cette
  story le réduit (l'état est désormais relu *dans* la transaction), elle ne l'introduit pas. Le fermer
  demanderait un document de verrouillage par module — hors périmètre.
- `@IsISO8601()` non strict accepte `2026-02-30` → `Invalid Date` → **500** au lieu de 400. Motif
  **pré-existant en deux autres endroits** du module (`version-lifecycle.ts`, `update-version-status.dto.ts`) :
  le corriger ici seul durcirait 1 chemin sur 3. **Candidat à un ticket de robustesse dédié.**

### Suite côté console (dépôt `frontend-admin-panel`, non modifiable ici)

La console peut désormais **envoyer** le `supersedesMajor` qu'elle calcule déjà et **jette**, retirer sa note
« la règle n'est pas un invariant du système », et ancrer le refus sur le bon champ grâce à `field` + `majors`
au lieu d'afficher un message générique. `support-window.ts` **reste utile** : son calcul *avant le clic* est
une aide à la décision, pas la garde. À ouvrir en ticket front.

---

## Dev Agent Record

### Agent Model Used

`claude-opus-5` (session APEX-PROSPERA complète ; scans de revue dispatchés en `haiku` + `opus`).

### Debug Log References

- Vérification docker : `docker exec prospera-mongo-1 mongosh --quiet catalog_service` sur la collection
  `moduleversions`.
- Panne injectée puis retirée dans `module-versions.service.ts` pour prouver le rollback ; `docker restart`
  **obligatoire** entre l'injection et l'appel.

### Completion Notes List

1. ⚡ **La prémisse de la story était à moitié fausse** : le garde-fou existait, il était **infranchissable** —
   et c'est lui qui **imposait** la séquence non atomique dont la story décrivait les dégâts.
2. ⚡⚡ **Le trou `null`/absent de `@IsOptional()` s'est reproduit à l'identique**, une story après STORY-185,
   dans un autre module du même service. Le patron `@siPresent()` doit être le **réflexe par défaut** sur tout
   champ optionnel de ce dépôt.
3. La liste blanche d'`AllExceptionsFilter` a coûté un **4ᵉ** champ : poser une propriété sur l'exception ne
   suffit **jamais** ici.
4. L'e2e du catalogue **ne câblait pas `APP_FILTER`** — il lisait la sérialisation par défaut de Nest, pas le
   corps réel de l'API. Toute assertion sur `code`/`field`/`majors` y aurait été une fausse assurance.
5. Son `ValidationPipe` divergeait de `main.ts` (`enableImplicitConversion` absent) — invisible tant qu'aucun
   DTO ne portait de **nombre**.

### File List

- `src/modules/catalog/fenetre-de-support.ts` *(neuf)* · `src/modules/catalog/fenetre-de-support.spec.ts` *(neuf)*
- `src/modules/catalog/dto/create-module-version.dto.ts`
- `src/modules/catalog/services/module-versions.service.ts` · `.spec.ts`
- `src/modules/catalog/controllers/catalog-admin.controller.ts`
- `src/common/filters/all-exceptions.filter.ts` · `.spec.ts`
- `test/catalog.e2e-spec.ts` · `test/entitlements.e2e-spec.ts` · `test/packs.e2e-spec.ts` · `test/projects.e2e-spec.ts`
