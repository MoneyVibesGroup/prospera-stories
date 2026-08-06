# STORY-144 : `auth-service` — réactivation d'une organisation, renvoi d'invitation au niveau organisation, actions groupées (succès partiel)

**Epic :** EPIC-025 — RBAC plateforme (D15) *(extension de FR-012 : console d'administration)*
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` · `tech-spec-admin-panel-2026-07-10.md` · **STORY-006** (resend-verification + rate limit), **STORY-008** (invitation, token 72 h), **STORY-014** (`TenantStateGuard`), **STORY-103/105** (permissions `org:read` / `org:suspend`)
**Priorité :** Should Have
**Story Points :** 5
**Complexité :** medium
**Statut :** done
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-07-23 · **récupérée et réancrée sur le code le 2026-07-28** · **lancée le 2026-08-06**
**Sprint :** S20 · **clôturée le 2026-08-06**
**Service :** `auth-service` (:3001) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-144`

---

## Origine

Story rédigée le 2026-07-23 à partir de la maquette `AP-02 · Organisations`, restée **orpheline** :
elle vivait dans `docs/stories/` d'un dossier de travail dupliqué (`frontend-admin-panel - Copie`),
non suivie par git, et n'existait nulle part dans le backlog. Récupérée le 2026-07-28.

Son constat de départ tient toujours : la console propose des actions de ligne et une barre
d'actions groupées qui **n'appellent rien** — dans la maquette, `askSuspend` et la barre d'actions
groupées se contentent d'afficher un toast. Cette story livre ce qui manque côté `auth-service`.

⚠️ **Périmètre réancré sur `origin/dev` (`4f452a9`) le 2026-07-28.** Une partie de ce que la version
d'origine réclamait a été livrée entre-temps ; une autre s'est révélée plus grave que prévu.

---

## État réel, vérifié dans le code

| Action de la maquette | État sur `origin/dev` | Verdict |
|---|---|---|
| **Suspendre** une organisation | ✅ `POST /admin/organizations/:id/suspend`, gardé `@RequirePermissions(ORG_SUSPEND)` | livré |
| **Réactiver** une organisation | ❌ **aucune route** | **manque — et c'est le plus grave** |
| **Renvoyer l'invitation** (niveau organisation) | ⚠️ existe au niveau **utilisateur** : `POST /users/:id/resend-invitation` | à arbitrer |
| **Actions groupées** | ❌ aucune variante batch | manque |

**Le point dur : la suspension est un aller simple.** `admin-organizations.controller.ts` expose
`GET /admin/organizations`, `GET /admin/organizations/:id` et `POST /admin/organizations/:id/suspend`
— **il n'y a pas de route de réactivation**. Un `PLATFORM_ADMIN` qui suspend une organisation par
erreur n'a aujourd'hui **aucun moyen de revenir en arrière depuis la console**, alors que la maquette
propose « Réactiver le compte » et que la story d'origine tenait la réversibilité pour acquise
(« suspension **réversible** »). C'est une impasse d'exploitation, du même ordre que celle qu'AP-09
a corrigée pour les mots de passe.

---

## User story

En tant que **`PLATFORM_ADMIN`**,
je veux **réactiver une organisation suspendue, relancer l'invitation d'un cabinet qui n'a jamais
activé son compte, et appliquer ces actions à plusieurs organisations à la fois**,
afin de **piloter le cycle de vie des cabinets depuis la console, sans intervention manuelle en base**.

---

## Périmètre

### A. Réactivation — *le cœur de cette story*
- `POST /admin/organizations/:id/reactivate`, `@RequirePermissions(Permission.ORG_SUSPEND)`
  (même permission que la suspension : c'est la même responsabilité, dans l'autre sens).
- Réactiver une organisation **non suspendue** → **no-op idempotent 200**, pas d'erreur.
- Effet symétrique de la suspension : l'accès redevient possible (cohérent avec `TenantStateGuard`,
  STORY-014, et le refus de login de STORY-005).
- **Audité** au même titre que la suspension : `{ actorId, organizationId, action, at, reason? }`.

### B. Renvoi d'invitation au niveau organisation
- `POST /admin/organizations/:id/resend-invitation`, `@RequirePermissions(Permission.USER_INVITE)`.
- N'agit que si l'administrateur principal de l'organisation est **non activé** (`INVITED` /
  e-mail non vérifié) ; organisation déjà active → **409 `ALREADY_ACTIVATED`**.
- Régénère un token à usage unique (TTL 72 h), **invalide l'ancien**, remet l'e-mail en file
  (`MailModule` + Bull, retry ×5 — STORY-008).
- **Rate limit : 3 renvois / h / organisation**, aligné sur `resend-verification` (STORY-006).
- Idempotent fonctionnellement : deux appels rapprochés ne créent pas deux tokens valides concurrents.
- **202 Accepted** (mise en file), sans divulguer l'existence du compte.

**⚠️ À trancher au lancement.** `POST /users/:id/resend-invitation` **existe déjà**. Deux lectures :
- **(a)** Cette route org-level est un **raccourci de confort** : elle résout l'admin principal puis
  délègue à la logique utilisateur existante. Peu de code, pas de duplication. **Recommandé.**
- **(b)** Le besoin est déjà couvert : la console résout l'admin principal côté front et appelle la
  route utilisateur. Alors **retirer B de cette story** (elle tombe à 3 pts).

✅ **TRANCHÉ le 2026-08-06 — option (a), et pas seulement par confort : (b) est INAPPLICABLE.**
`POST /users/:id/resend-invitation` est gardée `@Roles(Role.TENANT_ADMIN)` et résout sa cible dans
**l'organisation du porteur du jeton** (`user.tenantId`). Or un `PLATFORM_ADMIN` **n'a pas
d'organisation** (`org: null` dans son jeton) : la console ne peut pas « appeler la route
utilisateur » — elle recevrait un 403, et à supposer qu'elle passe, `new Types.ObjectId(null)`
lèverait. La route org-level n'est donc pas un raccourci : c'est le **seul** chemin plateforme.
Elle délègue à `InvitationService.resend`, qui régénère le jeton et remet l'e-mail en file.

⚠️ **Rectifié en revue de code (2026-08-06)** : l'implémentation passait d'abord `resend(userId, **null**)`
— la branche plateforme de STORY-104 — au motif que le contrôle d'isolation d'org n'avait pas d'objet,
l'admin ayant déjà été résolu dans l'org désignée. Raisonnement juste sur ce paramètre, **mais
incomplet** : `organizationId` a un **second rôle**, il choisit le **gabarit de l'e-mail**
(`null` ⇒ `orgName: 'la plateforme PROSPERA'`). L'administrateur d'un cabinet aurait donc reçu
« rejoignez **la plateforme PROSPERA** », sur un lien par ailleurs valide — un bug d'accueil invisible
des tests et parfaitement visible du destinataire. On passe `org._id` : bon gabarit **et** contrôle
d'isolation rejoué en défense en profondeur.

### C. Actions groupées
- `POST /admin/organizations/bulk/suspend`, `POST /admin/organizations/bulk/reactivate`,
  `POST /admin/organizations/bulk/resend-invitation` — corps `{ ids: string[] }`.
- **Plafond ≤ 100 ids** → au-delà, **422** explicite.
- **Succès partiel obligatoire** : `{ results: [{ id, status: "ok" | "skipped" | "error", reason? }] }`.
  Un échec unitaire **n'annule pas** les autres — pas de tout-ou-rien. C'est ce qui distingue un lot
  utilisable d'un lot qui échoue en bloc sur une organisation déjà suspendue.
- Chaque item réapplique **les mêmes garde-fous** que l'action unitaire (états invalides, rate limit,
  audit) — le batch n'est pas une porte dérobée.
- **La revue KYC groupée reste hors périmètre backend** : c'est une navigation front vers la file KYC
  filtrée (STORY-013), aucun endpoint requis. Confirmé — et cohérent avec la maquette AP-03, où
  « Examiner les dossiers » enchaîne les décisions une par une (invariant DO-1 : l'humain tranche
  dossier par dossier, il n'y a pas d'approbation groupée).

**Hors périmètre :**
- UI → AP-02 (actions de ligne et barre groupée, déjà maquettées).
- Suppression d'une organisation.

---

## Critères d'acceptation

- [x] `POST /admin/organizations/:id/reactivate` réactive une organisation suspendue → **200**, accès rétabli.
- [x] Réactiver une organisation **non suspendue** → **200 idempotent**, aucun effet, aucune erreur.
- [x] Suspension puis réactivation : le login de l'organisation est refusé entre les deux, rétabli après.
- [x] Les deux actions sont **auditées** avec l'acteur, la cible et l'horodatage.
- [x] `POST /admin/organizations/:id/resend-invitation` sur une org non activée → **202** ; sur une org active → **409 `ALREADY_ACTIVATED`**.
- [x] 4ᵉ renvoi dans l'heure pour la même organisation → **429**.
- [x] L'ancien token d'invitation est **invalidé** par le renvoi (le lien précédent ne fonctionne plus).
- [x] `bulk/*` avec 101 ids → **422** ; avec 100 ids → traité.
- [x] **Succès partiel prouvé** : un lot mêlant une org valide, une déjà suspendue et un id inexistant renvoie `ok` / `skipped` / `error` — et la première a bien été traitée.
- [x] Un acteur sans `org:suspend` → **403** sur réactivation et sur `bulk/suspend|reactivate` ; sans `user:invite` → **403** sur les renvois.
- [x] Vérification docker bout-en-bout tracée.

---

## Notes techniques

| Élément | Fichier | Nature |
|---|---|---|
| Réactivation + renvoi org | `src/modules/admin/admin-organizations.controller.ts` | Modifié |
| Batch | `src/modules/admin/admin-organizations-bulk.controller.ts` | Nouveau |
| Service | `src/modules/admin/admin-organizations.service.ts` | Modifié |

**Vigilance :**
- **Réutiliser** `MailModule` + file Bull (STORY-006/008) et la chaîne `Jwt → Permissions` — ne rien
  réimplémenter.
- **Ne jamais divulguer l'existence d'un compte** : erreurs génériques, comme partout ailleurs.
- ⚠️ **Correction d'une note de la version d'origine.** Elle prévoyait des Route Handlers Next.js
  sous `src/app/api/organizations/*` pour proxifier ces appels. Vérifié le 2026-07-28 : le front
  admin route `/organizations` et `/users` **directement** vers `NEXT_PUBLIC_AUTH_URL`
  (`src/lib/api/services.ts`, décision « direct-par-service »), et ses seuls Route Handlers sont
  `api/auth/{login,logout,refresh}` pour la session en cookie. **Aucun proxy n'est donc nécessaire**
  — sauf si le programme tranche en faveur du BFF `admin-panel` (question ouverte au 2026-07-28 :
  le BFF expose une vue agrégée que le front n'utilise pas).

---

## Décisions de conception arrêtées au lancement (2026-08-06)

Vérifiées dans le code d'`origin/dev` avant d'écrire une ligne :

1. **Aucune permission nouvelle.** `Permission.ORG_SUSPEND` documente déjà « Suspendre / **réactiver**
   une organisation » — le catalogue n'est pas ouvert, donc **1 seul dépôt** (K4 ne joue pas ici).
2. **⚠️ L'audit n'existe nulle part dans `auth-service`.** La suspension d'aujourd'hui n'est tracée
   que par l'événement `identity.org.updated` — qui porte l'**état**, jamais l'**acteur**. Impossible
   de répondre à « qui a suspendu ce cabinet, et quand ». La story livre donc la collection
   `admin_audit_logs` (append-only, `{ actorId, organizationId, action, at, reason? }`) et **l'écrit
   dans la même transaction** que le changement de statut : un audit écrit hors transaction mentirait
   dans les deux sens (trace sans effet si le commit échoue, effet sans trace sinon).
   L'audit ne consigne que les **transitions effectives** — un no-op idempotent ne change rien, donc
   n'a rien à tracer (et un audit rempli de no-op ne se lit plus).
3. **Administrateur principal d'une organisation** = le porteur de `organization.createdBy` s'il a
   encore une membership `TENANT_ADMIN` **active** dans cette org ; **sinon** la plus ancienne
   membership `TENANT_ADMIN` active. Le repli n'est pas théorique : le fondateur peut avoir été
   retiré, et une org sans chemin de relance reproduirait exactement l'impasse que la story ferme.
4. **« Non activée » = admin principal en statut `INVITED`.** Un admin `ACTIVE` dont l'e-mail n'est
   pas encore vérifié relève de `POST /auth/resend-verification` (STORY-006, route publique déjà
   livrée) : le confondre avec l'invitation ferait régénérer un jeton d'invitation à un compte qui a
   déjà un mot de passe. **409 `ALREADY_ACTIVATED`** dans ce cas.
5. **Plafond du lot : 422, donc contrôlé DANS le handler.** `@ArrayMaxSize(100)` produirait un **400**
   via le `ValidationPipe` global — le DTO valide la **forme** (tableau non vide d'`ObjectId`), le
   handler tranche la **taille**. Les ids sont **dédupliqués** (l'appelant qui envoie deux fois le
   même id ne consomme pas deux fois le quota de renvoi) : `results` est indexé par id unique.
6. **`207 Multi-Status` systématique** sur les trois routes de lot, y compris quand tout réussit.
   Alterner 200/207 selon l'issue obligerait chaque client à écrire deux chemins de lecture pour un
   corps identique ; le rapport par item est **toujours** la réponse.
7. **Rate limit du renvoi : compteur Redis à fenêtre glissante par organisation**, calqué sur
   `throttleResetByEmail` (STORY-125) — `@Throttle` compte **par IP**, ce qui ne dit rien d'une
   organisation. **Fail-open** si Redis est indisponible, comme son modèle : une panne Redis ne doit
   pas rendre la console inopérante, et le throttle par IP de la route reste la garde de base.

## Découpage possible

Livrable d'un bloc (5 pts). Si besoin de fractionner :

1. **A** — réactivation seule, ~2 pts. **C'est le morceau à sortir en premier** : il ferme une
   impasse d'exploitation (suspension irréversible depuis la console).
2. **B** — renvoi d'invitation org-level, ~1 pt (ou 0 si l'option (b) est retenue).
3. **C** — actions groupées + succès partiel, ~2 pts.

---

## Definition of Done

- [x] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [x] `lint` / `typecheck` / `test` / `build` verts.
- [x] OpenAPI à jour (`/api/docs-json`).
- [x] Vérification docker bout-en-bout tracée.
- [x] Branche `MNV-144`, PR vers `dev`.

---

## Progress Tracking

### 2026-08-06 — lancement (statut `ready-for-dev` → `in_progress`)

État vérifié sur `origin/dev` avant d'écrire : `admin-organizations.controller.ts` expose
`GET /admin/organizations`, `GET /admin/organizations/:id`, `POST /admin/organizations/:id/suspend`
— **et rien d'autre**. Le constat de départ de la story tient toujours : **la suspension reste un
aller simple**. Les 7 décisions de conception ci-dessus sont arrêtées ; option **(a)** retenue pour
le périmètre B, pour une raison plus forte que le confort (la route utilisateur est org-scopée et
inaccessible à un `PLATFORM_ADMIN` sans organisation).

### 2026-08-06 — implémentation + validation

**Portes DoD** : lint 0 warning · build OK · **662 tests unitaires** verts, couverture
**97.06 / 90 / 97.69 / 97.09** (seuils 65/90/90/90) — `modules/admin` et `modules/audit` à **100 %**
de lignes · **175 e2e** verts.

**Mutation-testing — 16 mutations, 16 rouges.** Chaque garde qui protège d'une régression précise a
été volontairement cassée, puis restaurée :

| # | Mutation | Verdict |
|---|---|---|
| M1 | table d'audit inversée (réactivation journalisée « suspension ») | 🔴 |
| M2 | garde d'idempotence retirée | 🔴 |
| M3 | audit écrit **hors** de la transaction | 🔴 |
| M4 | `bulk/reactivate` passe `SUSPENDED` | 🔴 |
| M5 | déduplication du lot retirée | 🔴 |
| M6 | plafond du lot `>` → `>=` | 🔴 |
| M7 | quota de renvoi `>` → `>=` | 🔴 |
| M8 | quota consommé **avant** la résolution de l'admin | 🔴 |
| M9 | préférence du fondateur (`createdBy`) retirée | 🔴 |
| M10 | acteur non transmis (journal anonyme) | 🔴 |
| M11 | audit : identifiants écrits en **chaîne** | 🔴 |
| M12 | statut `INVITED` non vérifié | 🔴 |
| M13 | une erreur d'item fait échouer tout le lot | 🔴 |
| M14 | réactivation ouverte à `org:read` | 🔴 |
| M15 | renvoi d'invitation ouvert à `org:read` | 🔴 |
| M16 | ordre des contrôleurs inversé (`bulk` apparié comme `:id`) | 🔴 |

⚠️ **Incident d'outillage à ne pas reproduire** : le premier script de mutation restaurait les
fichiers par `git checkout --`, ce qui a **effacé les modifications non commitées** de
`organizations.service.ts` (et fait échouer silencieusement les mutations suivantes, dont les ancres
n'existaient plus). Restauration désormais **en mémoire**, et commit **avant** toute campagne.

### 2026-08-06 — vérification docker (stack neuve, `down -v`)

Stack : `mongo` (rs0) + `kafka` + `redis` + `mailhog` + `auth-service`. `PLATFORM_ADMIN` seedé,
3 cabinets créés par `register`. **Les e2e mockent la couche données — rien de ce qui suit n'en
découle.**

**A — l'impasse est fermée, prouvée par contrôle avant/après :**

| Étape | `organizations.status` | login du cabinet | `admin_audit_logs` |
|---|---|---|---|
| avant | `ACTIVE` | **200** | 0 ligne |
| après `POST :id/suspend` | `SUSPENDED` | **401** | 1 × `ORG_SUSPENDED` |
| après `POST :id/reactivate` | `ACTIVE` | **200** ⇐ *accès rétabli* | + 1 × `ORG_REACTIVATED` |
| 2ᵉ `reactivate` (no-op) | `ACTIVE` | 200 | **toujours 2** — aucun bruit |

`audit.actorId` **égale** le `_id` du `PLATFORM_ADMIN` seedé (vérifié par comparaison en base) —
c'est le champ que `identity.org.updated` ne portera jamais. Collection bien nommée
`admin_audit_logs` (`db.getCollectionNames()`), index `{ organizationId: 1, at: -1 }` créé.
`outbox_events` porte les **deux** transitions (`identity.org.updated` en `SUSPENDED` puis `ACTIVE`) :
statut, événement et audit sont écrits ensemble.

**B — renvoi d'invitation :** `202` ; `invitationTokenHash` **remplacé** (l'ancien lien ne fonctionne
plus) ; e-mail **réellement reçu par Mailhog** (« Vous êtes invité(e) sur Prospera »). Quota :
renvois #2 et #3 → `202`, **#4 → `429`** ; compteur Redis `org-invite:resend:<orgId>` = 4, **TTL
3598 s** (la fenêtre ne se réarme pas). Sur une org dont l'admin est actif :
`409 { code: "ALREADY_ACTIVATED" }`.

**C — lots, succès partiel réel :**

```
POST bulk/suspend  [org1 active, org3 déjà suspendue, id fantôme]  → 207
{"results":[{"id":"…fff3","status":"ok"},
            {"id":"…0017","status":"skipped","reason":"ALREADY_SUSPENDED"},
            {"id":"…9099","status":"error","reason":"NOT_FOUND"}]}
```

En base **après** ce lot : `cabinet-1` = `SUSPENDED` — **l'item valide a bien été traité malgré
l'échec du suivant**, ce qu'un tout-ou-rien aurait annulé. `bulk/reactivate` les remet toutes deux à
`ACTIVE`. `bulk/resend-invitation` mêlant une org au quota et une org activée renvoie
`error/RATE_LIMITED` + `skipped/ALREADY_ACTIVATED`. **101** identifiants distincts → `422`
(`BULK_TOO_MANY_IDS`), **100** → `207`.

🪤 **Le piège d'ordre de routes ne s'est pas déclenché** : après tous ces appels, la base compte
**3 organisations** et **6 lignes d'audit** — aucune organisation fantôme nommée `bulk`, aucun audit
parasite. Le e2e M16 prouve que c'est bien l'ordre des contrôleurs qui l'empêche.

Stack arrêtée (`docker compose stop`) une fois la vérification consignée.

### 2026-08-06 — revue de code (⑥) : 3 constats, tous corrigés (`9aff7bc`)

1. **BLOQUANT — l'e-mail de renvoi accueillait dans « la plateforme PROSPERA ».** Détail ci-dessus
   (§ périmètre B). Le paramètre `organizationId` de `resend` a **deux** rôles ; n'en regarder qu'un
   suffisait à envoyer le mauvais accueil. **Revérifié en docker sur le corps réel du message**
   (Mailhog) : contient « votre cabinet », plus « la plateforme PROSPERA ».
2. **Le chemin « lot » construisait puis JETAIT le détail complet de chaque organisation.**
   `buildDetail` déclenche 2 agrégations `$lookup` sur `users` : sur un lot de 100, **200 agrégations**
   et jusqu'à 100 000 documents membres hydratés, alors que la ligne de rapport ne contient que
   `{ id, status, reason }`. `setStatus` rend désormais le document ; le détail se construit chez
   l'appelant unitaire, qui seul en a besoin.
3. **Le 429 du quota publiait `error: "HttpException"`** — le nom d'une classe TypeScript en guise de
   code d'erreur d'API. Corps passé en **chaîne** ⇒ `AllExceptionsFilter` retombe sur
   `exception.name` (le piège déjà consigné en mémoire projet). Corps en objet, `error` et `code`
   explicites. Revérifié en docker : `{"error":"Too Many Requests","code":"TOO_MANY_RESENDS"}`.

3 mutations de contrôle ajoutées (M17/M18/M19) — **19 mutations au total, 19 rouges**. Non-régression
du périmètre A rejouée en docker après le refactor de `setStatus` : `200 → 401 (suspendu) → 200
(réactivé)`, détail unitaire toujours complet (membres inclus).

### 2026-08-06 — revue de sécurité (⑦) : **aucune vulnérabilité**

Vérifié : quota non contournable (`INCR` atomique, compté **après** résolution donc un 404/409 ne le
consomme pas, et le lot passe par la **même** méthode) · jeton d'invitation `randomBytes(32)` stocké
en SHA-256, l'ancien réellement écrasé, aucun compte non-`INVITED` relançable · injection NoSQL fermée
par `@IsMongoId({each:true})` + `forbidNonWhitelisted` + `ObjectId.isValid` · `bulk` non appariable
comme un `:id` (ordre des contrôleurs **et** `isValid('bulk') === false`) · `actorId` issu du seul
claim `sub`, donc non forgeable, et audit **fail-closed** (son échec avorte la transaction) · gardes
au niveau de la route, jamais de l'item · la réactivation ne réveille **aucun** compte suspendu
individuellement (statuts utilisateur et membership intacts).

⚠️ **CONSTAT HORS PÉRIMÈTRE, À TRACER EN STORY DÉDIÉE** — `AuthService.acceptInvitation`
(`auth.service.ts`) **n'appelle pas `ensureNotSuspended`** : un administrateur `INVITED` d'une
organisation **SUSPENDUE** qui accepte son invitation obtient une session de l'IdP, là où `login` et
`refresh` la lui refuseraient. **Pré-existant et déjà atteignable sans cette story** par la route
**publique** `POST /auth/forgot-password`, qui régénère une invitation pour un compte `INVITED` sans
regarder le statut de l'organisation. La route livrée ici n'accorde à son appelant aucun accès qu'il
n'avait pas (le lien part vers la boîte de l'administrateur, pas vers l'opérateur) — d'où le
classement hors périmètre plutôt que bloquant.

### 2026-08-06 — clôture

PR `prospera-auth-service#18` **rebase-mergée sur `dev`** (`8433627`), branche `MNV-144` supprimée.
Portes finales : lint 0 · build OK · **663 unit** (97.06 / 90 / 97.69 / 97.09) · **175 e2e** ·
**19 mutations, 19 rouges** · vérification docker complète et rejouée après correctifs.
