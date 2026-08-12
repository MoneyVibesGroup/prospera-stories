# STORY-186 : La console ne voit pas qu'un cabinet est **bloqué avant le dépôt** — l'état de vérification n'est exposé nulle part

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF) · *volet `auth-service`*
**Réf. :** **AP-02** *(annuaire et fiche)* · **AP-07** *(tableau de bord)* · **AP-19** *(le consommateur front)* · **STORY-047** *(agrégat des organisations — le DTO à étendre)* · **STORY-144** *(même famille : actes d'administration au niveau organisation)*
**Découverte par :** l'e2e chaîne KYC d'AP-07, lancé pour la première fois contre le stack le 2026-08-06
**Priorité :** Should Have
**Story Points :** 3
**Statut :** En revue
**Complexité :** medium
**Créée le :** 2026-08-06
**Sprint :** 20
**Service :** `auth-service` (`:3001`) + `admin-panel` BFF (`:3010`)

---

## ⚠️ Ceci n'est PAS non plus `resend-invitation` *(ajouté le 2026-08-06, après un `git pull`)*

`MNV-144` a livré **`POST /admin/organizations/:id/resend-invitation`** — le pendant plateforme du
renvoi d'invitation. **Ce n'est pas la même population.**

```ts
// admin-organizations.service.ts:416
if (user.status !== UserStatus.INVITED) { throw ConflictException(NO_INVITED_ADMIN) }
```

| Population | Statut utilisateur | `emailVerifiedAt` | Route |
|---|---|---|---|
| Admin **invité** qui n'a jamais accepté | `INVITED` | — | ✅ `resend-invitation` *(livrée)* |
| Cabinet **auto-inscrit** qui n'a pas confirmé | `ACTIVE` | `null` | ⛔ **aucune** → cette story |

Un cabinet qui s'inscrit lui-même est `ACTIVE` dès la création : `resend-invitation` lui renvoie
**409 `NO_INVITED_ADMIN`**. C'est exactement la population que l'e2e de la chaîne KYC a mise en
évidence, et elle n'a toujours aucune route.

⚡ **Bonne nouvelle pour l'AC nº 5** : le journal d'audit demandé existe désormais
*(`admin_audit_logs`, append-only, écrit dans la MÊME transaction que l'acte)*. Il ne porte que deux
actions — `ORG_SUSPENDED`, `ORG_REACTIVATED` — et **aucune route ne le lit**. La relance de
vérification doit s'y ajouter comme une troisième action, pas inventer son propre mécanisme.

---

## ⚠️ Ceci n'est PAS STORY-006

`STORY-006` *(« Vérification de l'adresse e-mail », ✅ Completed)* est une story **côté cabinet** :
*« En tant qu'utilisateur inscrit, … afin de prouver que je contrôle cette adresse »*. Elle livre le
parcours de l'utilisateur qui se vérifie lui-même, et elle le livre bien.

Elle ne dit **rien** de ce que l'administration plateforme voit. C'est le sujet ici, et il n'est
couvert par aucune story : recherche menée le 2026-08-06 sur `stories/`, `frontend-stories/` et
`tickets/` — **aucun résultat** sur le renvoi de vérification côté console ni sur l'exposition de
`emailVerifiedAt` dans un DTO d'administration.

---

## Le constat

Un cabinet qui ne vérifie pas son adresse **ne peut rien déposer** : `kyc-service` refuse
**`403 EMAIL_NOT_VERIFIED`** sur `POST /kyc/documents` **et** sur `GET /kyc/status`. Son dossier
n'existe donc jamais, et la console affiche **« Non démarré »** — le même libellé, au pixel près,
qu'un cabinet vérifié qui n'a simplement pas encore téléversé.

**L'opérateur ne peut pas distinguer « il n'a pas encore déposé » de « il ne PEUT pas déposer ».**
Les deux appellent pourtant des gestes opposés : attendre, ou relancer la vérification.

### Ce n'est pas théorique

Base de développement, mesurée le 2026-08-06 :

```
auth_service : 60 utilisateurs · 40 vérifiés · 20 NON vérifiés   (33 %)
```

Un tiers des comptes est dans cette zone grise. Le tableau de bord d'AP-07 les compte dans
« Organisations » ; la file de revue ne les verra jamais. C'est une cohorte invisible.

### Où ça manque, précisément

| Vérification | Résultat |
|---|---|
| `emailVerified` dans `auth-service/src/modules/admin/**` | ⛔ **zéro occurrence** |
| Champ réel sur le schéma utilisateur | `emailVerifiedAt?: Date` *(users/schemas, ligne 39)* |
| `AdminOrgListItemDto` *(BFF)* | `orgId · name · slug · country · identityStatus · kycStatus · activeEntitlementsCount` — **pas l'état de vérification** |
| `emailVerified` côté console | présent **uniquement** dans `claims.ts` — il décrit **l'opérateur lui-même**, pas les organisations administrées |
| Route de relance | `POST /auth/resend-verification` — `@CurrentUser()`, donc **l'utilisateur se relance lui-même**. ⛔ **Aucune route admin.** |

⚡ Le BFF possède déjà un `EmailVerifiedGuard`, mais il garde **ses propres appelants** : il ne
projette rien dans les DTO d'organisation.

---

## Périmètre

**Inclus — `auth-service` :**

- Exposer l'état de vérification du **propriétaire du compte** (`TENANT_ADMIN` créateur) sur
  `AdminOrgListItemDto` et `OrganizationDetailDto` : `ownerEmailVerified: boolean` +
  `ownerEmailVerifiedAt: string | null`.
- `POST /admin/organizations/:id/resend-verification` — relance pour le compte d'une organisation,
  sous **`user:invite`** *(la permission qui gouverne déjà l'envoi d'un lien d'activation)*, **throttlée**
  comme la route utilisateur.

**Inclus — BFF `admin-panel` :**

- Relayer les deux champs dans `AdminOrgListItemDto` / `AdminOrgDetailDto`.
- Proxifier la relance : `POST /admin/orgs/:orgId/resend-verification`.

**Hors périmètre :**

- Le parcours de vérification lui-même — **livré par STORY-006**, on n'y touche pas.
- Un filtre « non vérifiées » sur la liste — il appellerait la même question que `STORY-175` pour le
  KYC *(un filtre serveur, pas un tri client)*. À ouvrir seulement si l'écran le demande.

---

## ✅ Décision tranchée : quel utilisateur fait foi ? *(2026-08-12)*

**Option A retenue — le propriétaire.**

⚡ **Et « le propriétaire » a déjà une définition dans ce service, il ne faut pas en inventer une
seconde.** `AdminOrganizationsService.resolvePendingAdmin` (STORY-144) résout l'**administrateur
principal** : `organization.createdBy` s'il a encore une membership `TENANT_ADMIN` **active**, sinon
le plus ancien administrateur actif. Ce repli n'est pas cosmétique — un fondateur retiré de son
organisation laisserait sinon `ownerEmailVerified` collé à `false` **à vie**, et la console
afficherait « bloqué » sur un cabinet qui ne l'est pas. La story réutilise donc cette résolution
telle quelle, en la factorisant.

**Organisation sans aucun administrateur actif** (cas dégénéré, possible après suppression) :
`ownerEmailVerified: false`, `ownerEmailVerifiedAt: null`. Le choix est **volontairement
conservateur** — rendre `true` ferait dire à la console « ce cabinet peut déposer » alors qu'aucun
compte ne le peut. Le contraire d'un affichage prudent est ici un mensonge exploitable.

---

## ⚠️ Décision à prendre : quel utilisateur fait foi ?

Une organisation a plusieurs membres. « L'organisation est-elle vérifiée ? » n'a pas de réponse
évidente :

| Option | Conséquence |
|---|---|
| **A — le propriétaire** (`TENANT_ADMIN` créateur) | ce qui bloque le dépôt KYC, c'est **son** jeton à lui. Colle au symptôme observé. |
| **B — au moins un membre vérifié** | plus permissif, et **faux** : un collaborateur vérifié ne débloque pas le dépôt du gérant. |

**Recommandation : A.** B décrirait une organisation « vérifiée » qui reste incapable de déposer —
exactement le mensonge que cette story existe pour supprimer.

---

## Conception retenue *(2026-08-12)*

### 1. La projection n'a pas le droit d'être un N+1

`GET /admin/organizations` rend jusqu'à 100 lignes. Résoudre le propriétaire ligne par ligne
ferait **2 requêtes × 100** sur la route que le BFF appelle déjà en boucle pour construire son index
des noms (`buildOrgNameIndex`, jusqu'à 20 pages). La résolution est donc **en lot** : une requête
memberships sur toute la page (`organizationId ∈ page`, `TENANT_ADMIN`, `ACTIVE`, triée
`{ organizationId, createdAt, _id }`), une requête users sur les propriétaires ainsi désignés.
**2 requêtes, quelle que soit la taille de la page.**

🔒 La seconde requête **projette `emailVerifiedAt` et rien d'autre**. C'est la leçon du `$lookup` de
STORY-294 : sortir le document utilisateur entier de la base fait transiter `passwordHash` et les
empreintes de jetons jusqu'à la couche de présentation, où une seule sérialisation naïve suffirait à
les publier. On ne fait pas sortir ce qu'on n'a pas l'intention de rendre.

### 2. La relance écrit DEUX documents — donc une transaction

Relancer, c'est **régénérer le jeton de vérification** (`users`) **et** consigner l'acte
(`admin_audit_logs`). Deux documents ⇒ transaction, par la règle du projet. Sans elle, le journal
mentirait dans les deux sens : une trace sans jeton régénéré, ou un jeton régénéré sans trace.
**L'e-mail est mis en file APRÈS le commit** — la file Bull n'est pas transactionnelle, et un envoi
déclenché depuis une transaction qui échoue enverrait un lien mort.

### 3. Le mécanisme de vérification est FACTORISÉ, pas recopié

La génération du jeton, son TTL et la forme du lien vivent aujourd'hui dans un `private` d'
`AuthService` (`enqueueVerificationEmail`). Les recopier côté admin créerait **deux endroits** où
changer l'URL de vérification — le vecteur de bug le plus banal qui soit. Ils sont extraits dans un
`EmailVerificationService` (module `users`, exporté), dont `AuthService` devient un appelant comme
l'admin. C'est la symétrie exacte d'`InvitationService`, déjà en place pour l'autre population.

### 4. Le quota est **par organisation**, pas par IP

Exactement le raisonnement de STORY-144, que la route sœur documente déjà : `@Throttle` compte
**par IP**, et toute la console sort par la même. Trois relances y épuiseraient le quota de *tout le
parc*, pendant qu'un appelant depuis des IP tournantes relancerait une même organisation sans
limite. Compteur Redis keyé sur l'organisation, **3/h**, fail-open si Redis tombe (le throttler
global de la route reste la garde de base) — et incrémenté **seulement** une fois l'organisation et
son propriétaire non vérifié résolus : un appel qui finit en 404 n'a rien envoyé.

### 5. `200` avec un discriminant machine

La console doit distinguer « c'est parti » de « rien à renvoyer » (AC nº 4) **sans lire une phrase
française**. La réponse porte donc `{ message, sent: boolean }` : `sent: false` sur une organisation
déjà vérifiée. Aucune divulgation — la console connaît déjà `ownerEmailVerified` par les AC 1 et 2.

### 6. Une troisième action au journal, pas un second mécanisme

`AdminAuditAction.ORG_VERIFICATION_RESENT` rejoint `ORG_SUSPENDED` / `ORG_REACTIVATED`. Les valeurs
de cet enum sont **figées** (écrites en base, relues bien après) : on ajoute, on ne renomme pas.
`GET /admin/organizations/:id/audit` (STORY-294) la relit **sans un octet de changement**.

---

## Critères d'acceptation

- [x] `GET /admin/organizations` et `GET /admin/organizations/:id` portent `ownerEmailVerified` et
      `ownerEmailVerifiedAt` ; contrat déclaré à l'OpenAPI *(pas un `Record<string, never>` — cf. `STORY-181`)*.
- [x] Le BFF relaie les deux champs sur `AdminOrgListItemDto` **et** `AdminOrgDetailDto`.
- [x] `POST /admin/organizations/:id/resend-verification` renvoie **200** et déclenche un envoi réel ;
      **403** sans `user:invite` ; **throttlée** au même titre que la route utilisateur.
- [x] Relancer une organisation **déjà vérifiée** ne renvoie pas d'erreur brute : réponse explicite
      « rien à renvoyer », sans divulguer l'existence du compte au-delà de ce que la console sait déjà.
- [x] La relance est **tracée** (auteur, cible, horodatage) si le service journalise déjà les actes
      d'administration ; sinon le noter comme demande, ne pas l'inventer.
- [x] Tests : projection des champs, 403 hors permission, throttle, cas « déjà vérifiée ».

---

## Tâches

- [x] Trancher A vs B *(PO)* — préalable.
- [x] Projeter `ownerEmailVerified(At)` dans les DTO admin `auth-service` (AC 1)
- [x] Relayer côté BFF (AC 2)
- [x] Route de relance + permission + throttle (AC 3, 4)
- [x] OpenAPI + tests (AC 5, 6)

---

## ⚠️ Note de capacité

Le sprint 20 est à **69 points pour 34 de capacité** *(64 hérités des STORY-179 → 184, +5 avec
`STORY-185`)*. Ces 3 points le portent à **72**. Le slot en S20 est celui qui a été demandé ; il
n'est pas tenable sans décaler autre chose. Ordre de décalage défendable : garder **179 + 180**
*(sans elles la revue KYC reste inexploitable)*, décaler **181 · 185 · 186** au S21.

---

## Progress Tracking

**Statut : `in_progress` → développé, validé, vérifié en docker le 2026-08-12.**

### Portes de qualité

| Dépôt | Lint | Build | Unitaires | Couverture (S/B/F/L) | e2e |
|---|---|---|---|---|---|
| `auth-service` | 0 warning | ✅ | **825** verts | 97.8 / 90.88 / 97.91 / 97.91 | **205** verts |
| `admin-panel` | 0 warning | ✅ | **420** verts | 99.67 / 92.82 / 100 / 99.64 | **189** verts |

### Vérification docker — stack neuve (`down -v`), le 2026-08-12

Rappel du projet : les e2e **mockent la couche données**, ils ne prouvent ni la persistance ni
l'atomicité. Tout ce qui suit est mesuré sur `mongosh`, Redis et Mailhog réels.

| Ce qui est prouvé | Mesure |
|---|---|
| **Projection, cabinet auto-inscrit non vérifié** | liste **et** détail rendent `ownerEmailVerified: false`, `ownerEmailVerifiedAt: null` sur un compte `ACTIVE` sans `emailVerifiedAt` — la population exacte que la story vise |
| **Projection après vérification** | `true` + date ISO (`2026-08-07T09:12:00.000Z`), traversée sans reformatage |
| **Aucune contamination entre lignes** | 4 organisations en **un** appel, chacune portant l'état de **son** propriétaire, avec des dates distinctes |
| ⚡ **N+1 fermé — profileur Mongo** | un appel à `GET /admin/organizations` sur 4 organisations émet **1 requête `memberships` + 1 requête `users`**. Un N+1 en aurait émis 4 + 4 |
| **Relance : effet réel** | empreinte du jeton passée de `d6d674e9…` à `ce198757…` (**l'ancien lien cesse de fonctionner**), nouvelle expiration à +24 h, **e-mail réellement délivré** (Mailhog) |
| **Atomicité des 2 documents** | 3 relances réussies ⇒ **exactement 3** lignes `ORG_VERIFICATION_RESENT` ; le 4ᵉ appel (429) n'en écrit **aucune** — aucun orphelin |
| **Journal relu sans changement** | `GET :id/audit` (STORY-294) rend la nouvelle action avec l'acteur résolu (`admin@prospera.local`), sans un octet de modification de cette route |
| **Quota par organisation** | 3 relances passent, la 4ᵉ répond **429** `TOO_MANY_VERIFICATION_RESENDS` ; clé Redis `org-verification:resend:<orgId>` bien distincte de celle du renvoi d'invitation |
| ⚡ **« Déjà vérifiée » court-circuite AVANT le quota** | sur une organisation vérifiée **dont le quota est épuisé** : `200 { sent: false }` — et **aucune** ligne d'audit (3 → 3), **aucune** incrémentation Redis (4 → 4), **aucun** e-mail (4 → 4). Les trois assertions négatives sont mesurées, pas déduites |
| **Cas dégénéré** | organisation dont le seul admin est suspendu : projection **reste** `false`/`null` (jamais `true`), relance → **409 `NO_ACTIVE_OWNER`**, pas une 500 |
| **Organisation inconnue** | **404** (anti-énumération) |
| **BFF — traversée des deux champs** | `GET /admin/orgs` et `GET /admin/orgs/:id` relaient `ownerEmailVerified`/`ownerEmailVerifiedAt` à l'identique, `kyc`/`entitlements` dégradés sans impact (dépendance dure = `auth`) |
| **BFF — relance proxifiée** | 3 × `200 { sent: true }` puis **429**, lignes d'audit écrites côté `auth` avec le bon acteur |
| ⚡ **BFF — le 429 reste un 429** | 4ᵉ appel via le BFF : **429**, plus le **503** d'avant correctif |

**Non vérifié en docker, et dit comme tel** : le `403` sans `user:invite`. Le `PLATFORM_ADMIN` détient
les 13 permissions du catalogue ; le cas est prouvé **en e2e**, avec la chaîne de gardes réelle et un
jeton non porteur de la permission — pas sur la stack.

### Mutation-testing

Un test qu'un code bugué franchit est une fausse assurance. Cinq garde-fous ont été mutés, chacun
vérifié rouge puis restauré (restauration par copie de sauvegarde et `diff`, **jamais** un
`git checkout --` large qui emporterait les modifications non commitées) :

| Mutation | Test viré au rouge |
|---|---|
| résolution en lot remplacée par une boucle par organisation | « absence de N+1 » (`toHaveBeenCalledTimes(1)` reçoit 2) |
| `session` passée à `adminAuditService.record` remplacée par `undefined` | « audite, PUIS met en file après le commit » |
| court-circuit « déjà vérifié » neutralisé | « `200 { sent: false }` » (`sent` vaut `true`) |
| champs de la liste BFF remplacés par des constantes en dur | « traversés fidèlement depuis `auth` » |
| entrée `429` retirée de `WRITE_ERROR_MESSAGES` | « 429 amont → 429, jamais 503 » |

### Écart traité au-delà du cadrage initial

⚡ **Le BFF transformait le 429 amont en 503.** `rethrowUpstreamError` ne portait aucune entrée
`429` : le quota exigé par l'AC nº 3 aurait été **illisible depuis la console**, qui aurait annoncé
« service indisponible » sur une stack parfaitement saine — l'opérateur partant chercher une panne
inexistante, là où le geste correct était d'attendre.

C'est la **troisième occurrence d'un motif que ce fichier documente déjà deux fois** (le `403` de
STORY-106, le `428` de STORY-182), et cette story est la **première à la rendre atteignable** : la
relance est la seule action proxifiée dont l'amont impose un quota. Corrigé dans le socle (une
entrée + un `case`, `error` posé à la main comme l'exige un payload objet), avec son test et sa
mutation. Ne pas le corriger aurait livré un AC vérifiable en amont et faux en aval.

---

## Dev Agent Record

### Agent Model Used

`claude-opus-5` (session : cadrage, conception, correctif du socle BFF, vérification docker, revues) ·
`sonnet` (implémentation, sur brief — complexité `medium`).

### Completion Notes List

- Le préalable de la story est tranché : **option A**, le propriétaire — en **réutilisant** la
  définition d'administrateur principal de STORY-144 plutôt qu'en en écrivant une seconde.
- Le mécanisme de vérification (jeton, TTL, forme du lien) est **extrait** dans
  `EmailVerificationService` ; `AuthService` en devient un appelant. Il n'existe plus qu'un seul
  endroit où change l'URL de vérification.
- Un défaut **hors cadrage initial** a été corrigé parce que cette story le rendait atteignable : le
  BFF transformait le `429` amont en `503`, rendant le quota exigé par l'AC nº 3 illisible depuis la
  console. Cf. § *Écart traité au-delà du cadrage initial*.
- Le `403` sans `user:invite` est prouvé **en e2e**, pas en docker — le `PLATFORM_ADMIN` détient les
  13 permissions du catalogue. Dit explicitement plutôt que passé sous silence.

### File List

**`auth-service`**

- `src/modules/users/email-verification.service.ts` *(neuf)* + son spec — jeton, TTL, lien, mise en file
- `src/modules/admin/dto/resend-verification-response.dto.ts` *(neuf)* — `{ message, sent }`
- `src/modules/admin/admin-organizations.service.ts` — résolution du principal factorisée, projection
  en lot, `resendVerification` (transaction + quota + audit)
- `src/modules/admin/admin-organizations.controller.ts` — route `POST :id/resend-verification`
- `src/modules/admin/dto/organization-admin.dto.ts` — les deux champs, liste et détail
- `src/modules/audit/enums/admin-audit-action.enum.ts` — `ORG_VERIFICATION_RESENT`
- `src/modules/memberships/memberships.service.ts` — `listActiveAdminsByOrganizations`
- `src/modules/users/users.service.ts` — `session?` sur le jeton, `listEmailVerificationStates` projetée
- `src/modules/organizations/organizations.service.ts` — `createdBy` projeté par `listAll`
- `src/modules/auth/auth.service.ts` — délègue au service extrait
- `src/modules/users/users.module.ts` — déclare/exporte le service extrait

**`admin-panel`**

- `src/admin/orgs/dto/resend-verification-result.dto.ts` *(neuf)*
- `src/upstream/contracts/auth-org.contract.ts` — les deux champs + le résultat de relance
- `src/admin/orgs/dto/admin-org-identity.dto.ts` · `dto/admin-org-list-item.dto.ts` — projections Swagger
- `src/admin/orgs/org-aggregation.service.ts` — mapping en vue liste
- `src/upstream/auth-service.client.ts` · `src/admin/orgs/org-actions.service.ts` ·
  `src/admin/orgs/admin-org-actions.controller.ts` — la relance proxifiée
- `src/upstream/upstream-error.ts` — **entrée `429`** (le correctif du socle)
