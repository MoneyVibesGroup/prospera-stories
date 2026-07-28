# STORY-144 : `auth-service` — réactivation d'une organisation, renvoi d'invitation au niveau organisation, actions groupées (succès partiel)

**Epic :** EPIC-025 — RBAC plateforme (D15) *(extension de FR-012 : console d'administration)*
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` · `tech-spec-admin-panel-2026-07-10.md` · **STORY-006** (resend-verification + rate limit), **STORY-008** (invitation, token 72 h), **STORY-014** (`TenantStateGuard`), **STORY-103/105** (permissions `org:read` / `org:suspend`)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** draft
**Assigné à :** Unassigned
**Créée le :** 2026-07-23 · **récupérée et réancrée sur le code le 2026-07-28**
**Sprint :** à planifier
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

- [ ] `POST /admin/organizations/:id/reactivate` réactive une organisation suspendue → **200**, accès rétabli.
- [ ] Réactiver une organisation **non suspendue** → **200 idempotent**, aucun effet, aucune erreur.
- [ ] Suspension puis réactivation : le login de l'organisation est refusé entre les deux, rétabli après.
- [ ] Les deux actions sont **auditées** avec l'acteur, la cible et l'horodatage.
- [ ] `POST /admin/organizations/:id/resend-invitation` sur une org non activée → **202** ; sur une org active → **409 `ALREADY_ACTIVATED`**.
- [ ] 4ᵉ renvoi dans l'heure pour la même organisation → **429**.
- [ ] L'ancien token d'invitation est **invalidé** par le renvoi (le lien précédent ne fonctionne plus).
- [ ] `bulk/*` avec 101 ids → **422** ; avec 100 ids → traité.
- [ ] **Succès partiel prouvé** : un lot mêlant une org valide, une déjà suspendue et un id inexistant renvoie `ok` / `skipped` / `error` — et la première a bien été traitée.
- [ ] Un acteur sans `org:suspend` → **403** sur réactivation et sur `bulk/suspend|reactivate` ; sans `user:invite` → **403** sur les renvois.
- [ ] Vérification docker bout-en-bout tracée.

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

## Découpage possible

Livrable d'un bloc (5 pts). Si besoin de fractionner :

1. **A** — réactivation seule, ~2 pts. **C'est le morceau à sortir en premier** : il ferme une
   impasse d'exploitation (suspension irréversible depuis la console).
2. **B** — renvoi d'invitation org-level, ~1 pt (ou 0 si l'option (b) est retenue).
3. **C** — actions groupées + succès partiel, ~2 pts.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests verts (unitaires + contrat).
- [ ] `lint` / `typecheck` / `test` / `build` verts.
- [ ] OpenAPI à jour (`/api/docs-json`).
- [ ] Vérification docker bout-en-bout tracée.
- [ ] Branche `MNV-144`, PR vers `dev`.
