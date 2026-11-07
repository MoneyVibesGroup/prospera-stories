# STORY-166 : Rôles métier **distributeur** — les 14 personas au catalogue, extensibles sans migration

**Epic :** EPIC-025 — RBAC plateforme *(extension)*
**Réf. code livré :** **STORY-140** (catalogue de permissions 8→10 + rôles métier Comptable / Marketing / DG, S18) · **STORY-026** (users/rôles auth-service) · **STORY-142** (index inverse des entitlements)
**Réf. commerciale :** `prospera-font-end/docs/prospera_modules_bundles_distributeur.md` §0 *(14 personas)* · `prospera_modules_ia_distribution.md` §Rôles couverts
**Dépend de :** ⚡ **STORY-171** *(le vertical porté par l'organisation — à livrer AVANT : sans elle, l'AC 10 n'a rien à lire)*
**Débloque :** **STORY-167** (rôles personnalisés) · **DI-01/DI-02** (l'administrateur reçoit un rôle) · `AP-17`
**Priorité :** Must Have — ⚡ **bloque tout le parcours d'entrée du distributeur**
**Story Points :** 8 *(5 → 8 le 2026-08-03 : décision PO « les 14 personas », + attribut de couverture)*
**Complexité :** low-medium — **de la donnée, pas du code**
**Statut :** En revue — code sur la branche `MNV-166` d'`auth-service` (2026-11-07), PR à ouvrir ; vérification docker NON faite
**Assigné à :** Claude (session du 2026-11-07)
**Créée le :** 2026-08-02 · **Révisée le :** 2026-08-03 *(décision PO Q5)*
**Sprint :** **30** — **socle distributeur, vague 0**  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `auth-service` (`:3001`)
**Couvre :** prérequis du parcours d'entrée *(PLAN-DISTRIBUTEUR-PI-SPI §3-bis)*

---

## Contexte — le point exact où le parcours d'entrée casse

Formulation du PO :

> *« Je crée l'organisation sur l'AP avec un administrateur **et son rôle selon les rôles du
> distributeur**, et lui il vient, il configure tout pour gérer. »*

Tout est possible aujourd'hui **sauf le milieu de cette phrase** : `STORY-140` a livré le catalogue de
permissions avec **trois** rôles métier — Comptable, Marketing, DG. **Aucun rôle distributeur
n'existe.** L'administrateur créé dans la console n'a donc rien à recevoir.

---

## User Story

**En tant qu'**administrateur plateforme Money Vibes,
**je veux** attribuer à l'administrateur d'un distributeur un rôle qui correspond à son métier,
**afin qu'**il puisse entrer dans son application et commencer à la configurer.

---

## ⚡ Décision PO du 2026-08-03 — **les 14 personas, pas un sous-ensemble**

La rédaction initiale proposait six rôles *(le sous-ensemble qui sert l'encaissement)*. **Le PO a
tranché la question Q5 en faveur des quatorze personas du catalogue commercial.**

**Ce que cette décision achète.** L'organigramme du distributeur est **connu d'avance** : le catalogue
commercial le vend déjà avec ses quatorze rôles. Un administrateur qui entre dans son application doit
pouvoir constituer son équipe **telle qu'elle existe dans sa maison**, pas telle que notre périmètre
construit la permet. Livrer six rôles l'obligerait à ranger son responsable de stock sous un rôle qui
n'est pas le sien, puis à le déplacer plus tard — une migration de données pour une décision qu'on
pouvait prendre tout de suite.

**Ce qu'elle coûte, et comment on le paie.** Huit des quatorze n'ont **aucun écran construit**
aujourd'hui. Sans précaution, ils produiraient des utilisateurs qui se connectent et ne voient rien —
et qui en concluent que le produit est cassé. **La réponse n'est pas de retirer ces rôles, c'est de
dire la vérité sur leur état** : chaque rôle porte un attribut de **couverture** (§C), la console
l'affiche avant d'attribuer, et l'application l'explique après la connexion.

---

## Périmètre

### A. Le jeu système du v1 — **14 personas + 1 rôle d'administration**

Les quatorze du catalogue commercial, plus `DIST_ADMIN` — qui **n'est pas un persona** mais le rôle que
Money Vibes attribue à l'entrée, avant que quiconque ait un métier dans l'outil.

| # | Rôle | Persona | Couverture v1 |
|:--:|---|---|:--:|
| — | `DIST_ADMIN` | *(administration — hors catalogue commercial)* | ✅ **servi** |
| 1 | `DIST_DG` | Directeur Général | ✅ servi *(lecture large)* |
| 2 | `DIST_DC` | Directeur Commercial | 🟡 partiel |
| 3 | `DIST_RESP_VENTES` | Responsable des Ventes | ⬜ en attente de module |
| 4 | `DIST_SUPERVISEUR` | Superviseur | ⬜ en attente de module |
| 5 | `DIST_COMMERCIAL` | Commercial *(salarié)* | ✅ servi |
| 6 | `DIST_FREELANCE` | Commercial **freelance** | 🟡 partiel |
| 7 | `DIST_PROSPECTION` | Prospection | ⬜ en attente de module |
| 8 | `DIST_RESP_STOCK` | Responsable Stock | ⬜ en attente de module |
| 9 | `DIST_GEST_ENTREPOT` | Gestionnaire d'Entrepôt | ⬜ en attente de module |
| 10 | `DIST_DAF` | Directeur Administratif et Financier | ✅ servi |
| 11 | `DIST_COMPTABLE` | Comptable | ✅ servi |
| 12 | `DIST_CONTROLE_GESTION` | Contrôleur de Gestion | ⬜ en attente de module |
| 13 | `DIST_MARKETING` | Marketing | ⬜ en attente de module |
| 14 | `DIST_RECOUVREMENT` | Recouvrement | ✅ servi |

> ⚠️ **`DIST_FREELANCE` n'est pas `DIST_COMMERCIAL` avec moins de droits.** Le catalogue le décrit
> comme un réseau **à part** : double tarification, portefeuille isolé, créances séparées, classements
> séparés. Son rôle existe donc dès maintenant pour que cette séparation soit **portée par les
> permissions**, et non rattrapée plus tard dans chaque écran.

### B. Un rôle système = une composition nommée de permissions

Aucun rôle n'invente de permission. Chacun compose des permissions du catalogue livré par
`STORY-140` — **celles qui existent aujourd'hui**. Un rôle dont le module n'est pas construit compose
donc le socle commun *(se connecter, voir son profil, voir son organisation)* et **rien de plus**.

Il grossit **par donnée** le jour où son module livre ses permissions. C'est le même mécanisme que
l'extensibilité (§D) — pas un chemin de rattrapage particulier.

### C. ⚡ L'attribut de **couverture** — ce qui rend la décision Q5 tenable

Chaque rôle système porte un attribut lisible par la console et par l'application :

| Valeur | Signification | Ce que l'interface en fait |
|---|---|---|
| `servi` | Le métier a ses écrans | Rien de particulier |
| `partiel` | Une partie du métier est servie | Mention à l'attribution |
| `en_attente_de_module` | Aucun écran ne sert encore ce métier | ⚡ **Averti avant l'attribution** *(AP-17)* et **expliqué après la connexion** *(DI-01)* |

> **Pourquoi c'est une donnée et pas une note de documentation.** Un avertissement écrit dans un
> document n'est lu par personne au moment où il compte — celui où l'on clique « attribuer ». Porté
> par le catalogue, il traverse l'API et arrive dans les deux interfaces sans que personne ait à s'en
> souvenir. Et il **se périme tout seul** : le jour où le module Stock livre ses permissions,
> `DIST_RESP_STOCK` passe à `servi` par la même ligne de données qui lui donne ses droits.

### D. Extensible **sans migration**

Ajouter un quinzième rôle système — une autre verticale, un métier qui apparaît — est **une ligne de
données**, sans changement de schéma ni migration. Prouvé par l'AC 4.

### E. La séparation des pouvoirs, portée par les rôles

Les contrôles de `STORY-156` et `STORY-158` exigent que **déclarer**, **valider** et **annuler** ne se
cumulent pas par défaut. Le jeu système doit le refléter :

| Permission | `DIST_COMMERCIAL` | `DIST_FREELANCE` | `DIST_DAF` | `DIST_COMPTABLE` | `DIST_RECOUVREMENT` |
|---|:--:|:--:|:--:|:--:|:--:|
| `paiement:encaissement:declarer` | ✅ | ✅ | — | — | ✅ |
| `paiement:encaissement:valider` | — | — | ✅ | — | — |
| `paiement:annulation:enregistrer` | — | — | ✅ | — | — |
| Réconciliation | — | — | ✅ | ✅ | — |

⚠️ `DIST_ADMIN` **ne cumule pas** ces trois permissions par défaut. Il administre l'organisation ; il
n'opère pas sur l'argent. Un distributeur qui veut le cumul le fait **explicitement** (`STORY-167`),
et le système le signale.

### F. Ce que cette story ne fait pas

- **Aucune portée d'accès par zone** — ⚡ **décision PO Q6 du 2026-08-03 : reportée.** Un rôle s'exerce
  sur toute l'organisation. La portée viendra avec `Réseau & zones` (#4). ⚠️ Conséquence à assumer :
  `DIST_SUPERVISEUR` et `DIST_DC` **voient toute l'organisation**, pas leur seule zone — acceptable
  pour un premier distributeur mono-zone, à revoir avant le premier multi-zones
- **Aucun rôle personnalisé** — c'est `STORY-167`
- Aucun écran — c'est `AP-17` et `DI-02`

---

## Critères d'acceptation

1. Les **15 rôles système** du §A existent au catalogue, chacun comme **composition nommée de
   permissions** du catalogue `STORY-140`.
2. Un rôle système est **identifié comme tel** et **non modifiable** par une organisation.
3. ⚡ Chaque rôle porte sa **couverture** (`servi` · `partiel` · `en_attente_de_module`), **exposée par
   l'API** qui liste les rôles — la console et l'application la lisent, aucune des deux ne la déduit.
4. ⚡ Ajouter un seizième rôle système est une **donnée**, sans changement de schéma ni migration —
   prouvé en ajoutant un rôle de test.
5. ⚡ Faire passer un rôle de `en_attente_de_module` à `servi`, en lui ajoutant les permissions d'un
   module, est **également une donnée** — prouvé sur un rôle du jeu.
6. `DIST_ADMIN` est attribuable depuis la console à l'administrateur d'une organisation distributeur.
7. ⚡ `DIST_ADMIN` **ne détient pas** simultanément `declarer`, `valider` et `annulation:enregistrer`.
8. Le trio `declarer` / `valider` / `annuler` est réparti sur des rôles **distincts** dans le jeu livré,
   conformément au tableau §E.
9. ⚡ `DIST_FREELANCE` et `DIST_COMMERCIAL` sont **deux rôles distincts** — le freelance n'est pas
   modélisé comme un commercial diminué.
10. Les rôles distributeur ne sont proposés qu'aux organisations dont le vertical est distributeur —
    un cabinet ne se voit pas proposer `DIST_COMMERCIAL`.
11. Un utilisateur porte ses permissions dans son jeton (`perms[]`, patron `STORY-140`) ; aucun appel
    supplémentaire n'est requis à la lecture.
12. ⚡ Un rôle `en_attente_de_module` donne bien le **socle commun** — son porteur se connecte, voit son
    profil et son organisation. **Il n'obtient jamais une session sans aucun droit.**
13. L'attribution d'un rôle est **journalisée** : qui, à qui, quand.
14. Les rôles existants (Comptable, Marketing, DG de `STORY-140`) **restent inchangés** — aucune
    régression sur le vertical cabinet.

---

## Notes techniques

### Le nommage

Préfixe `DIST_` pour éviter la collision avec les rôles existants et ceux des verticales à venir
(`IMF_`, `ASSUR_`). Un rôle `COMPTABLE` sans préfixe existe déjà (`STORY-140`) et ne signifie pas la
même chose chez un cabinet et chez un distributeur.

### Pourquoi `DIST_ADMIN` n'opère pas sur l'argent

C'est le rôle que **Money Vibes** attribue, à quelqu'un qu'elle ne connaît pas encore. Lui donner
d'emblée le droit de déclarer et de valider un encaissement reviendrait à livrer une organisation
sans séparation des pouvoirs — et personne ne la rétablirait ensuite.

### La couverture n'est pas un droit

⚠️ Un rôle `en_attente_de_module` n'est **pas** un rôle désactivé : son porteur a une session valide et
le socle commun. La couverture est une **information d'interface**, jamais un contrôle d'accès — le
contrôle d'accès reste les `perms[]`, et rien d'autre. Confondre les deux créerait une seconde autorité
d'autorisation à côté de la vraie.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Huit rôles sans écran produisent des utilisateurs qui se connectent sur du vide | **AC 3/12** — la couverture est portée par la donnée, affichée avant l'attribution (`AP-17`) et expliquée après la connexion (`DI-01`) ; le socle commun garantit qu'aucune session n'est vide de droits |
| La couverture est traitée comme un droit et devient une seconde autorité d'autorisation | **Note technique** — c'est une information d'interface ; les `perms[]` restent la seule autorité |
| `DIST_ADMIN` cumule tout « pour simplifier l'onboarding » | **AC 7** — le cumul devient une décision explicite du distributeur |
| Le freelance est modélisé comme un commercial diminué, et la double tarification est rattrapée écran par écran | **AC 9** |
| ⚡ Sans portée par zone (Q6), un superviseur multi-zones voit tout | **Assumé au v1** (§F) — à rouvrir avant le premier distributeur multi-zones |
| Les rôles distributeur polluent le vertical cabinet | **AC 10/14** |

---

## Definition of Done

- [ ] Les 14 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : attribution de `DIST_ADMIN`, `perms[]` dans le jeton, ajout d'un
      seizième rôle par donnée seule, passage d'un rôle à `servi` par donnée seule, absence de cumul,
      socle commun d'un rôle `en_attente_de_module`, non-régression du vertical cabinet
- [ ] Branche `MNV-166`, PR rebase-mergée sur `dev`

---

## Progress Tracking

### 2026-11-07 — implémentation (`auth-service`, branche `MNV-166`, commit `8a5c299`)

**Livré dans la version généralisée** (arbitrage PO du 04/09) : le catalogue s'ouvre aux droits de
TENANT, le socle de rôles est publié par la plateforme pour toute organisation, et les 14 personas
distributeur en sont la première instance.

| Pièce | Fichier |
|---|---|
| Catalogue de **tenant**, distinct et disjoint du catalogue plateforme | `src/common/rbac/tenant-permission.enum.ts` |
| Collection `tenant_roles` (permissions validées contre le catalogue de tenant, `couverture`, `verticaux`) | `src/modules/rbac/schemas/tenant-role.schema.ts` |
| Les 15 rôles du socle | `src/modules/rbac/tenant-system-roles.ts` |
| Seed idempotent au boot (`runValidators`, tolérant à E11000, aucun `deleteMany`) | `src/modules/rbac/tenant-roles-seed.service.ts` |
| `Membership.tenantRole` (additif) + `perms[]` = union plateforme ∪ tenant | `membership.schema.ts`, `auth.service.ts` (`issueSession`) |
| Console : `GET /admin/tenant-roles?vertical=` · `PUT /admin/organizations/:id/members/:userId/tenant-role` | `src/modules/admin/admin-tenant-roles.*` |
| Journal : `MEMBER_TENANT_ROLE_ASSIGNED` + `targetUserId`, `tenantRole`, `previousTenantRole` | `src/modules/audit/*` |

**Décisions prises en implémentant** — à valider par le PO :

1. ⚡ **Deux catalogues, pas un.** Les codes de tenant ne vont PAS dans `permission.enum.ts`, qui est
   recopié dans quatre dépôts et valide les rôles **plateforme** : les y mettre les rendrait
   attribuables au personnel de Money Vibes chez tous les clients. Le mécanisme reste UNIQUE (même
   claim `perms[]`, mêmes guards) ; seul le catalogue est séparé. Conséquence : **aucune des trois
   autres copies (kyc, platform-catalog, admin-panel) n'est touchée.**
2. ⛔ **13 droits, pas 14 : `paiement:grace:attribuer` exclu.** Il est déclaré dans
   `droits-paiement.ts` mais aucun contrôleur de `paiement-service@origin/dev` ne l'exige (vérifié
   par `git grep`) — règle d'or. Les deux droits de portée plateforme du paiement
   (`fournisseur:administrer`, `exploitation:consulter`) restent hors de ce catalogue : ils
   relèvent du catalogue plateforme, geste encore à faire (quatre copies).
3. **Rôle de socle ≠ rôle métier.** `Membership.role` (`TENANT_ADMIN`/`TENANT_USER`) reste le
   **socle commun** (session, profil, organisation, `RolesGuard`) ; `Membership.tenantRole` porte
   les `perms[]`. `roles[]` du jeton est **inchangé** : aucun service aval ne voit apparaître un
   nom qu'il ne connaît pas. C'est ce qui rend AC 12 vrai sans inventer de permission « socle ».
4. **Compositions des rôles servis/partiels** (le §E ne fixait que le trio) :
   - `DIST_ADMIN` : `compte:administrer`, `paiement:journal:consulter`, `canal:administrer`,
     `modele:rediger`, `notification:journal:consulter`, `donnees:administrer` — il configure,
     il n'opère pas sur l'argent ;
   - `DIST_DG` : les deux journaux · `DIST_DC` : `demande:emettre`, `lien:revoquer` ;
   - `DIST_COMMERCIAL` : `declarer`, `demande:emettre`, `lien:revoquer` · `DIST_FREELANCE` :
     `declarer`, `demande:emettre` · `DIST_RECOUVREMENT` : `declarer`, `demande:emettre` ;
   - `DIST_DAF` : `valider`, `annulation:enregistrer`, `paiement:journal:consulter` ·
     `DIST_COMPTABLE` : `paiement:journal:consulter` (la « réconciliation » du §E n'a aucun droit
     au catalogue : aucun guard).
   - ⚠️ **`envoi-de-masse:executer` / `valider` ne sont donnés à PERSONNE** : c'est une paire de
     séparation des pouvoirs, et `DIST_MARKETING` est `en_attente_de_module` au tableau §A. Un
     distributeur ne peut donc pas faire d'envoi de masse avec le socle seul — il faudra `STORY-167`.
5. **Attribution gardée par `user:invite`** (« inviter un membre et lui attribuer un rôle »), la
   permission qui garde déjà la relance d'invitation de l'administrateur d'une organisation. Pas
   d'anti-escalade « n'accorde que ce que tu détiens » : un opérateur plateforme ne détient aucun
   droit de tenant, par construction.
6. Les droits suivent l'attribution au **prochain renouvellement** du jeton (TTL d'accès), pas
   instantanément — compromis assumé d'un vocabulaire fermé dans le jeton (discriminant de 365).

**État des critères**

| AC | État | Preuve |
|:--:|---|---|
| 1 | ✅ | `tenant-system-roles.spec.ts` (15 noms exacts, permissions ⊂ catalogue de tenant) |
| 2 | ✅ | aucune route d'écriture sur le socle ; e2e : un `TENANT_ADMIN` porteur des 13 droits prend 403 en lecture comme en attribution |
| 3 | ✅ | `couverture` au schéma, au DTO et dans `GET /admin/tenant-roles` ; cohérence couverture/droits testée |
| 4 | ✅ | `tenant-roles-seed.service.spec.ts` — 16ᵉ rôle (`IMF_AGENT_TEST`) par donnée seule |
| 5 | ✅ | idem — `DIST_MARKETING` passe à `servi` avec `modele:rediger`, droits et couverture dans le même `$set` |
| 6 | ✅ | `PUT …/tenant-role` (unitaire + e2e HTTP) |
| 7 | ✅ | `DIST_ADMIN` ne détient aucun des trois |
| 8 | ✅ | `declarer` ⇒ COMMERCIAL/FREELANCE/RECOUVREMENT ; `valider`/`annuler` ⇒ DAF ; aucun cumul |
| 9 | ✅ | deux rôles, deux libellés, couvertures différentes |
| 10 | 🟡 **partiel** | lecture filtrée (`?vertical=`, taxonomie fermée, 400 hors taxonomie). ⛔ **Le refus à l'attribution attend `Organization.vertical` (STORY-171, `not_started`)** : un opérateur peut aujourd'hui attribuer `DIST_COMMERCIAL` à un membre de cabinet (tracé au journal) |
| 11 | ✅ | `auth.e2e-spec.ts` — `perms[]` de `DIST_ADMIN` dans le jeton RS256 signé |
| 12 | ✅ | `auth.e2e-spec.ts` — `DIST_MARKETING` : login 200, `org` et `roles` présents, `perms: []` |
| 13 | ✅ | rôle + ligne d'audit dans la même transaction ; `GET /admin/organizations/:id/audit` rend `targetUserId`, `tenantRole`, `previousTenantRole` |
| 14 | ✅ | `system-roles.ts` intouché ; un membre sans rôle métier reçoit exactement `[]` (non-régression testée) |

**Tests** : 1 008 unitaires + 238 e2e verts ; lint 0 sur les fichiers de la story ; couverture
globale 97,4 %, nouveaux fichiers à 100 %. ⚠️ Deux tests préexistants (`svg-sanitizer` au chrono,
`throttler-proxy` au timeout) ont échoué sous la charge de la suite complète et passent seuls.

**Reste à faire avant `done`**

- [ ] ⛔ **Vérification docker** (DoD) — non faite, règle « Docker à la demande ». De nouveaux
      providers entrent dans `RbacModule`/`AdminModule` : seul `docker compose up` prouve que le
      service démarre (cf. le piège des `UnknownDependenciesException`).
- [ ] PR `MNV-166` → `dev`, rebase-merge.
- [ ] STORY-171 pour fermer AC 10 côté écriture.
- [ ] Recettes 631/632/649 : rejouables dès qu'un `DIST_*` est attribué sur la vraie pile. 632
      exige trois membres (déclarant, validant, annulant) : `DIST_COMMERCIAL` + `DIST_DAF` ×2 —
      ⚠️ vérifier que 275 n'interdit pas valider ET annuler à la même personne.
- [ ] STORY-365 recouvre en partie celle-ci (ouverture de `perms[]` au tenant) : il lui reste la
      **borne chiffrée** de `perms[]` et l'échec nommé à son dépassement. Le discriminant de forme
      (`TENANT_PERMISSION_FORMAT`) est déjà testé ici.
