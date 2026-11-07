# STORY-171 : Le **vertical** porté par l'organisation — un champ, quatre consommateurs

**Epic :** EPIC-025 — RBAC plateforme *(extension)* · touche aussi EPIC-007 *(catalogue)*
**Réf. code livré :** **STORY-004** (`Organization` — création) · **STORY-103/104/105** (RBAC plateforme, `perms[]`) · **STORY-078** (`artifact-loader` — clé canonique d'artefact) · **STORY-047/048** (console : organisations)
**Dépend de :** aucune — extension d'un schéma livré
**Débloque :** ⚡ **STORY-166 AC 10** *(filtrer les rôles par vertical)* · **AP-17 §1** · **DI-01** *(refuser une organisation qui n'est pas un distributeur)* · **REQ-9.2** *(le type de client choisit le référentiel comptable)*
**Priorité :** Must Have — ⚡ **prérequis de STORY-166, à livrer AVANT elle**
**Story Points :** 5
**Complexité :** low — un champ, ses lectures, et une décision de nommage
**Statut :** En revue — branches `MNV-171` poussées sur **trois** dépôts (auth-service, front expert-comptable, paiement-service), vérification docker 39/39 (2026-11-07)
**Assigné à :** Claude (session du 2026-11-07)
**Créée le :** 2026-08-03
**Sprint :** **30** — socle distributeur  *(slotté le 2026-08-03 ; décalé de 9 sprints le même jour — le module fiscalité passe devant, cf. `reserved_sprints`)*
**Service :** `auth-service` (`:3001`)

---

## Contexte — un trou trouvé en appliquant la décision Q5

En réécrivant `STORY-166` pour les 14 personas *(décision PO du 2026-08-03)*, son critère 10 a été
formulé ainsi :

> *« Les rôles distributeur ne sont proposés qu'aux organisations dont le **vertical** est
> distributeur — un cabinet ne se voit pas proposer `DIST_COMMERCIAL`. »*

**Vérification faite dans le code le 2026-08-03, avant de l'écrire dans un tracker :**

| Recherche | Résultat |
|---|---|
| `grep -i vertical` sur tout `auth-service@origin/dev` `src/` | ⛔ **zéro occurrence** |
| Champs de `organization.schema.ts` | `name`, `slug`, `phone`, `country`, `address`, `status`, `createdBy`, `brandColor`, `logoStorageKey`, `logoMimeType` — **pas de vertical** |
| Champs de `OrganizationAdminDto` *(ce que la console lit)* | `id`, `name`, `slug`, `phone`, `country`, `address`, `status`, `memberCount` — **pas de vertical** |
| `vertical` dans `platform-catalog-service@origin/dev` | 3 occurrences, **toutes en commentaire** (`"billing:<vertical>"`, « un vertical intégré ») — la notion n'est **pas modélisée** |
| Clé du référentiel comptable (`artifact-loader.ts`, STORY-078) | `code@version` / `pays@année` — ⛔ **aucune dimension type de client** |

**Le mot « vertical » traverse tout le programme depuis un an — les décisions, les PRD, les
trackers, les commentaires de code — et il n'existe nulle part comme donnée.**

> ⚡ **C'est la quatrième occurrence du motif que ce dépôt documente déjà trois fois** : une
> délégation nominative jamais retombée. `STORY-166` délègue le filtrage « au vertical de
> l'organisation » ; `AP-17` délègue « au vertical (STORY-166 AC 10) » ; personne n'a ouvert le
> schéma. La règle du dépôt s'applique : **une délégation nominative doit être vérifiée dans sa
> cible au moment où on l'écrit.** Ici, elle l'a été — et le trou est apparu avant d'être payé.

---

## User Story

**En tant que** plateforme Prospera,
**je veux** que chaque organisation porte le **métier qu'elle exerce**,
**afin que** les rôles, le référentiel comptable et les applications proposées lui correspondent —
sans qu'aucun de ces trois systèmes n'ait à le deviner.

---

## Périmètre

### A. Le champ

`Organization.vertical` — **obligatoire à la création**, jamais deviné, jamais défaut silencieux.

| Valeur | Métier | Application cliente |
|---|---|---|
| `cabinet` | Cabinet d'expertise comptable *(vertical pilote)* | `prospera-frontend-expert-comptable` |
| `distributeur` | Distributeur / grossiste | `prospera-distributeur` |
| `imf-sfd` | Institution de microfinance (SFD-BCEAO) | à venir |
| `assurance-cima` | Assurance (zone CIMA) | à venir |

⚠️ **Les organisations existantes.** Toutes sont des cabinets *(vertical pilote, dogfooding)*. La
migration les passe à `cabinet` **explicitement** — pas par une valeur par défaut du schéma. Une
valeur par défaut ferait que la prochaine organisation créée sans vertical serait silencieusement un
cabinet, ce qui est exactement le bug qu'on veut empêcher.

### B. ⚡ Un enum de **données**, pas de code

Même exigence que `STORY-166` §D : ouvrir une cinquième verticale ne doit pas être une migration.
Le vertical est une **entrée de référentiel** portant son libellé, son état et ses conséquences ;
le code ne connaît que la clé.

> **Pourquoi ça compte ici plus qu'ailleurs.** Le programme a déjà quatre verticales nommées dans
> ses décisions (D2, D5) et deux « pistes séparées » (Guinée multi-devises, CEDEAO anglophone). Un
> `enum` TypeScript figé serait rouvert avant la fin de l'année.

### C. Les quatre consommateurs

| # | Consommateur | Ce qu'il en fait | Story |
|:--:|---|---|---|
| 1 | **Catalogue de rôles** | Ne propose `DIST_*` qu'aux organisations `distributeur` | `STORY-166` AC 10 |
| 2 | **Console** | Filtre la liste des rôles attribuables ; affiche le vertical sur la fiche d'organisation | `AP-17` · `AP-02` |
| 3 | ⚡ **Application distributeur** | **Refuse la connexion d'un utilisateur dont l'organisation n'est pas `distributeur`**, avec un message qui le dit — pas une page vide | `DI-01` |
| 4 | ⚡ **Référentiel comptable** | Le type de client choisit le référentiel **complet** (plan + table de passage + gabarit), pas seulement le fiscal — clé `(type, pays, année)` *(REQ-9.2, retour PO 2026-07-23)* | ⚠️ **hors périmètre ici** — voir §E |

### D. Exposition

- `GET /api/v1/organizations/me` → porte `vertical`
- `GET /api/v1/admin/organizations` et le détail → portent `vertical`
- Filtre `?vertical=` sur la liste admin — la console doit pouvoir isoler ses distributeurs
- Création d'organisation *(console et inscription)* → `vertical` **requis**

### E. Ce que cette story ne fait pas

- ⛔ **Elle ne re-clé PAS le référentiel comptable.** Le consommateur n°4 est réel *(REQ-9.2)* mais
  vit dans `balance-service` et touche `artifact-loader` (`STORY-078`, livrée) : c'est un chantier
  distinct, avec sa propre migration d'artefacts. **Cette story livre le champ dont il aura besoin ;
  elle ne fait pas le chantier.** ⚡ À ouvrir comme story propre le jour où une organisation non-cabinet
  produit une balance — pas avant, sinon on migre des artefacts pour personne.
- Elle ne touche pas à `NEXT_PUBLIC_VERTICAL` *(configuration de DÉPLOIEMENT de l'app cliente
  config-driven)* — voir la note technique, les deux ne sont pas la même chose
- Elle ne crée aucun écran — c'est `AP-02` *(fiche d'organisation)* et `AP-17`

---

## Critères d'acceptation

1. `Organization.vertical` existe, est **obligatoire à la création**, et **n'a pas de valeur par
   défaut** au schéma.
2. Les quatre verticales du §A sont déclarées comme **données**, pas comme enum figé du code —
   prouvé en ajoutant une cinquième entrée sans changement de schéma ni migration.
3. Toutes les organisations existantes sont migrées à `cabinet` par une migration **explicite et
   idempotente** ; la migration est rejouable sans effet de bord.
4. ⚡ Créer une organisation **sans** vertical échoue avec `{ message, code }` (`STORY-138`) — jamais
   une création silencieuse.
5. `GET /organizations/me`, `GET /admin/organizations` (liste **et** détail) portent `vertical`.
6. Le filtre `?vertical=` fonctionne sur la liste admin et **se combine** avec les filtres existants
   (`status`, `?ids=`).
7. Le vertical d'une organisation est **modifiable par un porteur de permission plateforme
   uniquement** — jamais par l'organisation elle-même.
8. ⚡ Tout changement de vertical est **journalisé** (qui, de quoi vers quoi, quand) : il change les
   rôles proposables et, demain, le référentiel comptable. Ce n'est pas un champ d'affichage.
9. Aucune régression sur le vertical cabinet : les organisations existantes gardent leurs rôles,
   leurs entitlements et leurs accès.

---

## Notes techniques

### ⚠️ `vertical` (donnée) n'est pas `NEXT_PUBLIC_VERTICAL` (déploiement) — et il ne faut pas les confondre

| | `Organization.vertical` | `NEXT_PUBLIC_VERTICAL` |
|---|---|---|
| Nature | **Donnée**, par organisation | **Configuration**, par déploiement |
| Qui décide | Money Vibes, à la création | L'exploitant, au `docker run` |
| Répond à | *« quel métier exerce ce client ? »* | *« quels modules cette instance affiche-t-elle ? »* |

Une instance déployée en `NEXT_PUBLIC_VERTICAL=cabinet` sert des organisations `cabinet` — mais c'est
une **cohérence à vérifier**, pas une équivalence à supposer. ⚡ `DI-01` doit refuser explicitement
l'utilisateur dont l'organisation ne correspond pas : sans ce contrôle, un utilisateur cabinet qui
atteint l'URL du distributeur obtient une application vide et croit qu'elle est cassée.

### Pourquoi le champ vit dans `auth-service` et pas dans le catalogue

L'organisation est un objet d'**identité** (`auth-service` en est l'autorité depuis le cutover
`STORY-030`). Le catalogue porte ce qu'une organisation a le droit d'**utiliser** (entitlements), pas
ce qu'elle **est**. Mettre le vertical au catalogue obligerait `auth-service` à interroger le
catalogue pour filtrer une liste de rôles — une dépendance à contresens.

---

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| ⚡ Une valeur par défaut `cabinet` au schéma ⇒ toute organisation créée sans vertical devient silencieusement un cabinet | **AC 1/4** — obligatoire, sans défaut, échec explicite |
| L'enum est figé en TypeScript et la 5ᵉ verticale devient une migration | **AC 2** |
| Le vertical est traité comme un champ d'affichage et modifié sans trace | **AC 7/8** — il commande les rôles proposables |
| `vertical` et `NEXT_PUBLIC_VERTICAL` sont confondus, et une instance sert des organisations d'un autre métier | **Note technique** + contrôle explicite dans `DI-01` |
| Le chantier « référentiel keyé type × pays × année » est embarqué ici et fait déborder la story | **§E** — le champ est livré, le chantier reste à ouvrir |

---

## Definition of Done

- [ ] Les 9 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Migration rejouée deux fois** sur un jeu de données existant — résultat identique
- [ ] **Vérification docker** : création sans vertical refusée, filtre `?vertical=`, lecture par la
      console, journalisation d'un changement, non-régression du vertical cabinet
- [ ] Branche `MNV-171`, PR rebase-mergée sur `dev`

---

## Progress Tracking

### 2026-11-07 — implémentation

**Décisions PO prises en cours de story (2026-11-07)**

1. **Inscription publique : `vertical` dans le corps**, validé contre le référentiel.
2. **L'organisation de Money Vibes a son vertical : `plateforme`**, 5ᵉ entrée du référentiel,
   **fermée à l'inscription publique**.
3. **Reclasser exige `entitlement:grant`** (arbitrage commercial ; `PLATFORM_ADMIN`,
   `PLATFORM_EXECUTIVE`) — aucune des quatre copies du catalogue figé n'est touchée.

**Livré — `auth-service`, branche `MNV-171` (`4d4fa7d`)**

| Pièce | Où |
|---|---|
| `Organization.vertical` obligatoire, **sans défaut**, indexé | `organization.schema.ts` |
| Référentiel `verticaux` (code, libellé, statut, `inscriptionOuverte`) + seed au boot | `organizations/verticaux/*` |
| Migration nommée `STORY-171-vertical-cabinet`, **à marqueur** (collection `migrations`) | `organizations-vertical-migration.service.ts` |
| Inscription : 400 `VERTICAL_REQUIS` / `VERTICAL_INCONNU` / `VERTICAL_FERME_A_L_INSCRIPTION`, avant toute écriture | `auth.service.ts`, `register.dto.ts` |
| Exposition : `/organizations/me`, `/users/me`, liste + détail admin, filtre `?vertical=` | DTO + `listAll` |
| `GET /admin/verticaux` (`org:read`) · `PATCH /admin/organizations/:id/vertical` (`entitlement:grant`) | `admin-verticaux.*` |
| Journal `ORG_VERTICAL_CHANGED` (`vertical`, `previousVertical`, motif) dans la transaction | `changeVerticalAndEmit` |
| ⛔ **STORY-166 AC 10 côté écriture** : 422 `TENANT_ROLE_NON_PROPOSE` ; organisation sans vertical ⇒ refus | `admin-tenant-roles.service.ts` |
| `vertical` additif dans `identity.org.created` / `identity.org.updated` | `identity-events*` |

**Livré — appelants de l'inscription (sans quoi le merge cassait `dev`)**

- `prospera-frontend-expert-comptable`, `MNV-171` (`25b4b3d`) : `registerCabinet` pose
  `vertical: 'cabinet'` ; types `auth` régénérés contre l'IdP de la branche.
- `prospera-paiement-service`, `MNV-171` (`31c260d`) : l'amorçage s'inscrit `cabinet` puis reclasse
  en `plateforme` par la route console ; couvre aussi l'organisation créée avant la story.

**Choix faits en implémentant — à valider**

1. ⚡ **Seul `cabinet` est ouvert à l'inscription publique** (donnée `inscriptionOuverte`). Un
   distributeur ne peut donc naître aujourd'hui que par **inscription cabinet + reclassement**
   console, faute de route de création d'organisation côté console — à ouvrir (AP-02/AP-17).
2. **Migration à marqueur, pas `updateMany` à chaque boot** : sinon une organisation née sans
   vertical demain serait rangée `cabinet` au boot suivant — le défaut silencieux que la story
   interdit.
3. **Reclassement refusé (409 `VERTICAL_ROLES_INCOMPATIBLES`, rôles listés)** si des membres gardent
   des rôles que la cible ne propose pas : sinon un distributeur reclassé cabinet garderait ses
   droits `DIST_*`.
4. `vertical` est requis à l'OpenAPI mais contrôlé par le **service** (pas par class-validator) pour
   rendre `{ message, code }` (STORY-138) au lieu du refus générique du `ValidationPipe`.
5. Fenêtre résiduelle documentée : une attribution de rôle et un reclassement **concurrents** ne
   sont pas sérialisés entre eux (deux documents différents) ; le reclassement relit les rôles
   dans sa transaction.

**État des critères**

| AC | État | Preuve docker |
|:--:|---|---|
| 1 | ✅ | champ requis, aucun défaut au schéma |
| 2 | ✅ | `pharmacie` insérée **en base** ⇒ listée, filtrable, cible de reclassement, et fermée à l'inscription — sans livraison |
| 3 | ✅ | **96** organisations réelles rangées `cabinet` ; 2ᵉ boot : marqueur ⇒ rien ; marqueur effacé + 3ᵉ boot ⇒ 0 touchée ; état `vertical` identique sur les trois passages |
| 4 | ✅ | sans vertical / inconnu / `distributeur` / `plateforme` ⇒ 400 `{ message, code }`, aucune organisation créée |
| 5 | ✅ | `/organizations/me`, `/users/me`, liste et détail admin |
| 6 | ✅ | `?vertical=cabinet` ⇒ total = 97 (compte du filtré) ; combiné à `status` et à `ids` ; inconnu ⇒ 400 |
| 7 | ✅ | `TENANT_ADMIN` ⇒ 403 ; opérateur plateforme ⇒ 200 |
| 8 | ✅ | une ligne `cabinet → distributeur` (acteur, date, motif), relue par `GET …/audit` ; même vertical ⇒ aucune ligne ; refus 409 ⇒ aucune ligne |
| 9 | ✅ | propriétaire de démo : login, `perms: []`, `TENANT_ADMIN` |
| 166/10 | ✅ | `DIST_ADMIN` à un membre de cabinet ⇒ 422, rien d'écrit ; au membre d'un distributeur ⇒ 200 |

**Tests** : auth-service 1 057 unitaires + 242 e2e, lint 0, couverture 97,3 % ; front : 60 tests
du module auth, typage ; paiement : 53 tests d'amorçage. Docker : **39/39**, + reclassement réel de
« Money Vibes Group » `cabinet → plateforme` par la route qu'emprunte l'amorçage.

**Reste à faire avant `done`**

- [ ] Fusionner **les trois** `MNV-171` ensemble : l'IdP seul casserait l'inscription du front et
      l'amorçage (400 `VERTICAL_REQUIS`).
- [ ] Route console de **création** d'organisation avec son vertical (AP-02/AP-17) — aujourd'hui
      inscription cabinet + reclassement.
- [ ] Consommateur n°3 (`DI-01` refuse un non-distributeur) et n°4 (référentiel comptable keyé
      type × pays × année) : hors périmètre, le champ est livré.
