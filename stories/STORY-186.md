# STORY-186 : La console ne voit pas qu'un cabinet est **bloqué avant le dépôt** — l'état de vérification n'est exposé nulle part

**Epic :** EPIC-016 — Chaîne KYC : admin-panel (BFF) · *volet `auth-service`*
**Réf. :** **AP-02** *(annuaire et fiche)* · **AP-07** *(tableau de bord)* · **AP-19** *(le consommateur front)* · **STORY-047** *(agrégat des organisations — le DTO à étendre)* · **STORY-144** *(même famille : actes d'administration au niveau organisation)*
**Découverte par :** l'e2e chaîne KYC d'AP-07, lancé pour la première fois contre le stack le 2026-08-06
**Priorité :** Should Have
**Story Points :** 3
**Statut :** En cours
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

- [ ] `GET /admin/organizations` et `GET /admin/organizations/:id` portent `ownerEmailVerified` et
      `ownerEmailVerifiedAt` ; contrat déclaré à l'OpenAPI *(pas un `Record<string, never>` — cf. `STORY-181`)*.
- [ ] Le BFF relaie les deux champs sur `AdminOrgListItemDto` **et** `AdminOrgDetailDto`.
- [ ] `POST /admin/organizations/:id/resend-verification` renvoie **200** et déclenche un envoi réel ;
      **403** sans `user:invite` ; **throttlée** au même titre que la route utilisateur.
- [ ] Relancer une organisation **déjà vérifiée** ne renvoie pas d'erreur brute : réponse explicite
      « rien à renvoyer », sans divulguer l'existence du compte au-delà de ce que la console sait déjà.
- [ ] La relance est **tracée** (auteur, cible, horodatage) si le service journalise déjà les actes
      d'administration ; sinon le noter comme demande, ne pas l'inventer.
- [ ] Tests : projection des champs, 403 hors permission, throttle, cas « déjà vérifiée ».

---

## Tâches

- [ ] Trancher A vs B *(PO)* — préalable.
- [ ] Projeter `ownerEmailVerified(At)` dans les DTO admin `auth-service` (AC 1)
- [ ] Relayer côté BFF (AC 2)
- [ ] Route de relance + permission + throttle (AC 3, 4)
- [ ] OpenAPI + tests (AC 5, 6)

---

## ⚠️ Note de capacité

Le sprint 20 est à **69 points pour 34 de capacité** *(64 hérités des STORY-179 → 184, +5 avec
`STORY-185`)*. Ces 3 points le portent à **72**. Le slot en S20 est celui qui a été demandé ; il
n'est pas tenable sans décaler autre chose. Ordre de décalage défendable : garder **179 + 180**
*(sans elles la revue KYC reste inexploitable)*, décaler **181 · 185 · 186** au S21.

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
