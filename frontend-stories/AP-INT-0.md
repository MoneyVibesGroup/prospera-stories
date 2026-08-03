# Story AP-INT-0 : Integration Gate de la console — la console admin parle au VRAI backend (zéro fixture, types générés)

Status: ready-for-dev

**Epic :** AP-EPIC-000 — Socle admin & sécurité
**Points :** 8 · **Sprint :** à caler AVANT AP-06 (voir §Pourquoi maintenant) · **App :** `frontend-admin-panel`
**API :** auth-service (:3001), kyc-service (:3002), platform-catalog-service (:3003) — **en direct-par-service**
**Réf. plan :** `frontend-sprint-status.yaml` (entête v3.3.0)
**Backend prêt :** ✅ oui pour les routes — ⛔ **deux écarts d'infra à lever**, voir §Bloqueurs identifiés
**Dépendances :** AP-01→AP-05 (livrées). Miroir admin de **FE-INT-0** côté app cliente.
**Maître Scrum (frontend) :** MightyRaven

---

## Le problème

**Les cinq écrans de la console sont livrés et mergés. Aucun ne parle à un backend.**

Les quatre clients lisent des tableaux en mémoire derrière un `delay(220)` :

| Client | Écrans servis | Backend d'appui, déjà livré |
|---|---|---|
| `features/orgs/api/orgs-client.ts` | AP-02 | auth-service `/organizations`, kyc-service, catalog |
| `features/kyc/api/kyc-client.ts` | AP-03 | kyc-service `@Controller('admin/kyc')` |
| `features/catalog/api/catalog-client.ts` | AP-04 | platform-catalog-service `/catalog/admin/*` |
| `features/entitlements/api/entitlements-client.ts` | AP-05 | platform-catalog-service `/catalog/entitlements` |

`npm run gen:api` n'a **jamais été lancé** sur ce dépôt : `src/types/api/` n'existe pas. Aucun type de la console ne dérive d'un OpenAPI ; tous sont écrits à la main contre des contrats **supposés**.

La console est donc **réelle mais muette**. Conséquence directe : la boucle DG-1 — l'admin octroie un entitlement, le module s'allume chez le cabinet — n'est pas démontrable, et **FE-017** reste bloquée.

---

## Pourquoi maintenant, et pas après AP-06

Le principe de priorité nº2 du programme est explicite : *« vérité du contrat AVANT toute nouvelle surface — chaque écran ajouté par-dessus agrandit la dette »*.

Cinq écrans reposent déjà sur des contrats supposés. Le sprint 6 en ajoute quatre (AP-06 provisioning, AP-07 dashboard, AP-08 RBAC, AP-09 récupération de compte) : les construire d'abord **double la surface à retrofiter**, et chaque retrofit se paie une seconde fois en tests.

C'est exactement l'histoire de l'app cliente : FE-001→010 ont été codées contre des contrats supposés, et l'Integration Gate (FE-INT-0→4) a dû reprendre **cinq stories déjà livrées**. Le coût y était visible : renommages en cascade, un bug de chemin nominal découvert six semaines après (`verifyEmail` de FE-006), et des tests qui mockaient le hook entier — donc un angle mort complet.

Le découplage actuel est propre : un seul fichier de bascule par feature, chaque fonction porte son `TODO(backend)`. C'est ce qui rend cette story faisable en un sprint **aujourd'hui**. Cette propriété ne survivra pas à quatre écrans de plus.

---

## User Story

En tant qu'**opérateur plateforme**,
je veux que **la console affiche les vraies organisations, les vrais dossiers KYC, le vrai catalogue et les vrais droits**,
afin de **pouvoir réellement arbitrer un KYC et allumer un module chez un cabinet** — ce qu'aucun des cinq écrans livrés ne permet aujourd'hui.

---

## ⛔ Bloqueurs identifiés AVANT de coder

Trois défauts trouvés en préparant cette story, tous vérifiés dans le code. **Aucun n'est théorique.**

### 1. La console tourne sur le port de l'expert-comptable

`package.json` déclare `"dev": "next dev"` — sans port, donc **:3000**. Or `.env.local` de ce même dépôt porte `NEXT_PUBLIC_EC_URL=http://localhost:3000` : **la console et le service qu'elle appelle se disputent le même port.** `playwright.config.ts` confirme, `baseURL: "http://localhost:3000"`.

AP-01 devait choisir un port distinct — le tracker le demandait explicitement (« ex. :3110 ») ; ça n'a pas été fait, et rien ne l'a signalé parce que la console, servie par des fixtures, n'appelle jamais `:3000`.

⚠️ **Effet de bord à connaître** : `reuseExistingServer` de Playwright prendra le **backend expert-comptable** pour le serveur de test — piège rencontré tel quel en FE-INT-4. Les e2e passeraient contre le mauvais serveur.

⇒ **Basculer la console sur :3110** (`next dev -p 3110`, `next start -p 3110`, `baseURL` Playwright).

### 2. CORS : l'origine de la console n'est autorisée nulle part

La console appelle les services **directement depuis le navigateur** (option B, `resolveApiUrl`). Elle est donc soumise à CORS, comme l'app cliente.

`CORS_ALLOWED_ORIGINS` (STORY-109) vaut par défaut `http://localhost:3100` — **l'app cliente**. L'origine de la console n'y figure pas. Tant qu'elle n'y est pas, **chaque appel échouera au préflight**, sans que le code front soit en cause.

⚠️ C'est le scénario exact de FE-INT-3 : contrat juste, transport cassé, et un diagnostic qui part chercher un bug côté front. Ne pas le redécouvrir en direct.

⇒ Ajouter l'origine de la console à `CORS_ALLOWED_ORIGINS` dans le compose racine, sur les **trois** services appelés. Ticket d'infra, à lever **avant** de commencer.

### 3. `gen:api` ne couvre pas le catalogue

`scripts/gen-api.mjs` ne génère que `auth`, `ec`, `kyc`. Il manque **platform-catalog-service (:3003)** — c'est-à-dire précisément la source d'AP-04 et d'AP-05.

⇒ Ajouter l'entrée `catalog`. `ec` est inutile à la console (aucun écran ne l'appelle) mais reste requis par `env.ts` — à trancher au passage.

---

## ⚠️ Question d'architecture à arbitrer : le BFF est-il sur le chemin ?

**Cette console n'appelle jamais `prospera-admin-panel-service`.** Il n'existe aucun `NEXT_PUBLIC_ADMIN_URL` dans `.env.example`, et aucune route de `services.ts` ne pointe vers :3010.

Conséquence à vérifier avant de planifier quoi que ce soit :

- **STORY-143** (pass-through de lecture des entitlements dans le BFF) — déjà établi comme non pertinent ici (cf. AP-05).
- **STORY-107** (route de file KYC dans le BFF) — inscrite comme nécessaire à AP-03. **Elle porte sur le BFF, que ce front n'emprunte pas.** `kyc-service` sait déjà filtrer par statut, et `kyc-client.ts` vise `/kyc/admin/kyc?status=PENDING` en direct. Ce que STORY-107 apportait vraiment, c'est **la jointure raison sociale × dossier** — que la console fait aujourd'hui côté client, et qu'elle devra faire en appelant deux services.

⇒ **À trancher dans cette story** : soit la console assume la jointure (deux appels, elle est déjà l'agrégateur), soit le BFF redevient le chemin et il faut alors y router `services.ts`. Les deux se défendent — ce qui ne se défend pas, c'est de laisser la question ouverte et de commander des routes backend que personne n'appellera.

🪤 C'est la **troisième fois** que ce programme commande ou justifie une route BFF pour un front qui ne passe pas par le BFF. Le motif est toujours le même : présumer l'architecture du front au lieu d'ouvrir `services.ts`.

---

## Périmètre

**Inclus :**

1. Lever les trois bloqueurs ci-dessus (port, CORS, `gen:api`).
2. `npm run gen:api` sur un stack docker **rebâti sur `origin/dev`**, types committés sous `src/types/api/`.
3. Bascule des **quatre** clients : corps des fonctions remplacé par `apiFetch`, signatures inchangées. Les composants, hooks et types métier ne bougent pas — c'est la promesse écrite dans chacun des quatre fichiers, et cette story la met à l'épreuve.
4. Suppression des fixtures de production (conservées uniquement comme données de test).
5. Confrontation de contrat, client par client : tout écart entre le type écrit à la main et le DTO généré est **relevé et tracé**, jamais contourné par un cast.
6. Arbitrage de la question BFF ci-dessus, consigné.

**Hors périmètre :**

- Tout écran neuf (AP-06→AP-11).
- Le retrofit `referentielFamilies` : le champ reste front-only tant que **STORY-148** n'est pas livrée — cette story ne le fait pas disparaître, elle en **confirme l'écart** contre l'OpenAPI réel.
- Les actions d'AP-02 qui n'appellent rien (**STORY-144**).

---

## Critères d'acceptation

- [ ] La console démarre sur un port qui n'entre en conflit ni avec `:3000` (EC) ni avec `:3100` (app cliente).
- [ ] `npm run gen:api` génère `auth`, `kyc`, `catalog` ; les fichiers sont committés.
- [ ] Les 4 clients appellent les vrais services ; **aucun `import` de fixtures** ne subsiste hors tests.
- [ ] AP-02 : la liste et la fiche affichent de vraies organisations, la dégradation par source reste vraie (une source en échec sert son `lastKnown` **daté**, pas un écran vide).
- [ ] AP-03 : la file est servie par `kyc-service` **filtrée côté serveur** ; la jointure raison sociale est faite selon l'arbitrage retenu ; une décision est **réellement enregistrée** et le dossier quitte la file.
- [ ] AP-04 : le catalogue lu et écrit sur le service ; l'invariant N/N-1 confronté au comportement réel du backend.
- [ ] AP-05 : un octroi réel émis (201/200 distingués), une révocation réelle, et la réconciliation calculée sur le catalogue **servi**.
- [ ] Chaque écart de contrat rencontré est tracé dans la story (comme FE-INT-0→4 l'ont fait), pas absorbé silencieusement.
- [ ] Aucun cast de contournement : si le DTO généré diffère du type manuel, c'est le type manuel qui cède.

---

## Preuve attendue — Integration Gate, pas tests verts

⚠️ Des tests verts sur fixtures ne prouvent **rien** ici : c'est l'état actuel.

- [ ] **Parcours navigateur complet contre le stack docker réel**, sur un compte PLATFORM_ADMIN créé par l'API : login → liste des organisations → ouverture d'un dossier KYC → décision → catalogue → octroi d'un entitlement.
- [ ] **Preuve croisée de la boucle DG-1** : l'entitlement octroyé depuis la console apparaît côté app cliente. C'est ce qui débloque **FE-017**.
- [ ] Zéro erreur CORS dans la console du navigateur.
- [ ] `tsc`, `eslint`, `vitest`, `build` verts — nécessaires, pas suffisants.

---

## Definition of Done

- [ ] Critères d'acceptation et preuves ci-dessus validés.
- [ ] Écarts de contrat consignés ; tickets backend ouverts pour ceux qui ne se corrigent pas côté front.
- [ ] Arbitrage BFF consigné dans `frontend-sprint-status.yaml`, et STORY-107 requalifiée en conséquence.
- [ ] PR relue et mergée dans `dev`.

---

## Convention Git

- **Une story = une branche.** Branche : `ap-int-0`. Commits préfixés `AP-INT-0`.

---

## ✅ RÉSULTAT DE L'EXÉCUTION — 2026-08-03

### Les trois bloqueurs : levés

| # | Bloqueur | Ce qui a été fait |
|:--:|---|---|
| 1 | Port :3000 partagé avec l'expert-comptable | `dev`/`start` → `-p 3110` ; `playwright.config.ts` `baseURL` **et** `webServer.url` → `:3110`. Attribution figée : **:3000** EC · **:3100** app cliente · **:3110** console |
| 2 | Origine console absente de CORS | `CORS_ALLOWED_ORIGINS` du compose passe à `http://localhost:3100,http://localhost:3110` sur les **cinq** services. ⚠️ Piège consigné : la variable est **partagée**, la renseigner **remplace** le défaut — en fournir une seule ouvrirait une application **en fermant l'autre**. Vérifié dans le conteneur : `printenv CORS_ALLOWED_ORIGINS` → les deux origines |
| 3 | `gen:api` sans catalogue | `catalog` ajouté ; **`ec` retiré** (aucun écran de la console n'appelle l'expert-comptable — le générer produisait un fichier que personne n'importe). `NEXT_PUBLIC_EC_URL` reste requis par `env.ts`, le retirer est un autre changement |

**Types générés** contre le stack docker rebâti sur `origin/dev` *(auth `4e6d4f7`, kyc `8dbe43a`, catalog `74b2da8`, BFF `d18a2d3`)* : `auth.ts` (30 chemins), `kyc.ts` (9), `catalog.ts` (17).

### ⚖️ Arbitrage BFF — **le BFF est le chemin**

**Décision : la console passe par `prospera-admin-panel-service` (:3010), pas en direct-par-service.**

L'argument décisif est **AP-02**, et il est technique, pas esthétique :

> Sa liste a besoin de trois sources — `identityStatus` (auth), `kycStatus` (kyc), `activeEntitlements` (catalog). **Une jointure à trois services ne se pagine pas côté client.** Pour afficher la page 2 filtrée par statut KYC, il faudrait charger *toutes* les organisations, *tous* les dossiers KYC et *tous* les entitlements dans le navigateur, puis paginer le résultat — et `total` serait faux. Vérifié : `GET /admin/organizations` d'auth-service ne porte **ni `kycStatus` ni `activeEntitlements`** (`OrganizationAdminDto` = `id, name, slug, phone?, country?, address?, status, memberCount`), et son filtre `status` porte sur l'**identité** (`ACTIVE|SUSPENDED`), **pas** sur le KYC.

Le BFF, lui, sert exactement le besoin — vérifié dans ses DTO :
- `PaginatedAdminOrgsDto { items, total, page, limit, sources }`
- `AdminOrgListItemDto { orgId, name, slug, country?, identityStatus, kycStatus?, activeEntitlementsCount? }`
- ⚡ `AggregateSourcesDto { kyc, entitlements }` — **la dégradation par source, déjà calculée côté serveur.** C'est l'AC3 d'AP-02, que la console a réimplémenté en `Promise.allSettled` côté client.

**Conséquence assumée :** cet arbitrage **sauve** les cinq stories backend construites sur le BFF (`STORY-047`, `048`, `106`, `107`, `143`), qui étaient en passe de n'avoir aucun consommateur. `STORY-107` (file KYC) est **confirmée pertinente**, contrairement à ce que cette story supposait au §Question d'architecture.

### ⛔ Mais le BFF n'est pas empruntable aujourd'hui — `STORY-173` créée

> ⚠️ **Renumérotée.** Cette story est née sous le n° **172**, déjà pris en parallèle par la série
> `balance-service` poussée sur `origin/main` (comptes de paramétrage & rapprochement bancaire,
> `done`). **`origin/main` fait foi** — même règle qu'aux n° 145/146/147 le 2026-07-31. Les commits
> de code et la branche `MNV-172` du dépôt `admin-panel` citent encore le numéro d'origine.

> **`grep -i cors` sur tout `src/` de `prospera-admin-panel-service@origin/dev` : ZÉRO occurrence.**
> Pas d'`enableCors` dans `main.ts` (helmet, préfixe, versioning, pipes — rien d'autre), et **aucune
> variable `CORS_ALLOWED_ORIGINS` dans son entrée de compose**, alors que les cinq autres services
> l'ont depuis `STORY-109`.

**Le BFF n'a jamais été appelé par un navigateur — et son code le prouve.** Ce n'est pas une
configuration oubliée : la capacité n'existe pas. ⇒ **`STORY-173`** (backend, 3 pts) — miroir de
`STORY-109` pour `:3010`.

**Preuve empirique** — vrai préflight `OPTIONS` depuis l'origine de la console, contre le stack docker :

```
OPTIONS <route>  Origin: http://localhost:3110
                 Access-Control-Request-Method: GET
                 Access-Control-Request-Headers: authorization

auth-service :3001  →  Access-Control-Allow-Origin: http://localhost:3110   ✅
kyc-service  :3002  →  Access-Control-Allow-Origin: http://localhost:3110   ✅
catalog      :3003  →  Access-Control-Allow-Origin: http://localhost:3110   ✅
BFF-admin    :3010  →  ⛔ AUCUN en-tête Access-Control-Allow-Origin
```

Ce préflight **est** ce que le navigateur envoie : un `OPTIONS` porteur d'`Origin` et
d'`Access-Control-Request-*`. Le bloqueur nº2 est donc **prouvé levé** sur les trois services, et
`STORY-173` **prouvée nécessaire** — pas seulement déduite d'une lecture de code.

#### ⚡ L'allowlist est une **liste stricte**, pas une plage de ports

Question posée en revue : *« l'allowlist n'est-elle pas une plage d'adresses ? »* — si c'était le
cas, l'ajout au compose aurait été inutile. **Vérifié dans les deux sens, la réponse est non.**

*Dans le code* — `auth-service` et `balance-service`, à l'identique :

```ts
allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',').map((o) => o.trim()).filter(Boolean)
```

…puis passé tel quel à `enableCors({ origin })`. **Aucune logique de plage nulle part.**

*À l'exécution* — préflights sur `:3001` :

| Origine | Résultat |
|---|---|
| `http://localhost:3110` *(ajoutée par cette story)* | ✅ acceptée |
| `http://localhost:3115` · `:3120` · `:3121` · `:3099` | ⛔ **toutes refusées** |

⇒ La modification du compose **était nécessaire**. Et le corollaire vaut pour la suite du programme :
**chaque nouvelle application doit être ajoutée explicitement** — l'app distributeur (`DI-01`) et la
page publique de paiement (`PY-00`) y passeront aussi. C'est déjà écrit dans `DI-01`.

⚠️ **Ce que ça change pour cette story :** AP-02 ne peut pas être branchée tant que `STORY-173` n'est
pas livrée. Les trois autres écrans sont **mono-service** et n'ont pas ce problème.

### 🔴 Écarts de contrat relevés — confrontés aux specs vivantes, aucun contourné

| # | Écran | Type écrit à la main | Contrat réel | Verdict |
|:--:|---|---|---|---|
| 1 | AP-02 | `Vertical = "Distribution" \| "Finance" \| "Retail" \| "Logistique" \| "Services"` | ⛔ **le champ n'existe nulle part** — ni auth, ni catalog, ni BFF | ⚡ **Le plus grave.** Cinq valeurs **inventées**, qui pilotent un filtre ET la teinte du monogramme. Et elles **contredisent les vraies verticales du produit** (`cabinet`/`distributeur`/`imf-sfd`/`assurance-cima`). ⇒ **`STORY-171`** livre le champ ; la taxonomie de la console est à **remplacer**, pas à mapper |
| 2 | AP-02 | `pageSize` | `limit` | 🪤 **Exactement le piège de FE-INT-1, rejoué à l'identique** |
| 3 | AP-02 | `search` | `q` | Renommage |
| 4 | AP-02 | filtre `kycStatuses[]` | ⛔ **aucun filtre serveur par KYC** (`status` = identité) | Le filtre principal de l'écran n'est pas servi ⇒ demande backend à formuler |
| 5 | AP-02 | `OrgSummary.activeEntitlements`, `.kycStatus` | absents d'`OrganizationAdminDto` | Servis **uniquement** par le BFF ⇒ argument nº1 de l'arbitrage |
| 6 | AP-02 | `OrgIdentity.registrationId`, `.memberSince` | absents d'`OrganizationDetailDto` | Inventés |
| 7 | AP-02 | `OrgMember { id, name, role }` | `OrganizationMemberDto { id, email, firstName, lastName, role, status, lastLoginAt? }` | `name` n'existe pas (deux champs) |
| 8 | AP-03 | `KycStatus = PENDING \| APPROVED \| REJECTED \| NOT_STARTED` | `PENDING_DOCUMENTS \| UNDER_REVIEW \| APPROVED \| REJECTED` | ⚡ **Deux valeurs sur quatre divergent**, et la console **ignore `UNDER_REVIEW`** — l'état « en cours de revue », dans une console **de revue** |
| 9 | AP-03 | file avec raison sociale | `AdminKycReviewItemDto { orgId, status, submittedAt?, reviewedAt?, updatedAt }` — **pas de nom** | La jointure est réelle ⇒ confirme la valeur du BFF |
| 10 | AP-05 | `Entitlement { id, name, referential, status }` | `EntitlementResponseDto { organizationId, moduleCode, versionCode, referentiel?, config, status, source?, grantedBy?, updatedAt? }` | `id`/`name` n'existent pas ; `referential` s'écrit **`referentiel`** (français) dans l'API |

> ⚡ **Ce que ces dix écarts disent.** Aucun n'est un détail de nommage isolé : `vertical` est une
> **fiction complète**, le filtre KYC d'AP-02 **n'a pas de serveur**, et AP-03 ignore l'état central
> de son propre métier. Les cinq écrans ont été écrits contre des contrats **imaginés** — ce que le
> découplage propre (un fichier de bascule par feature) a rendu confortable, et donc invisible.
> C'est très exactement ce que cette story existait pour découvrir, et la raison de la faire **avant**
> AP-06→AP-09.

### État à la fin de cette passe

| Fait | Reste |
|---|---|
| ✅ 3 bloqueurs levés · types générés et committés · arbitrage BFF rendu et argumenté · 10 écarts tracés · `STORY-171` et `STORY-173` créées | ⛔ **Bascule des 4 clients non faite.** Elle dépend de l'arbitrage qui vient d'être rendu : les clients doivent viser le **BFF**, dont la story de déblocage (`STORY-173`) n'est pas livrée. Brancher maintenant en direct-par-service reviendrait à coder contre le chemin qu'on vient d'écarter — et à le retrofiter une seconde fois |

⇒ **Cette story reste ouverte.** Elle a fait ce qui devait précéder le code : lever les bloqueurs,
trancher l'architecture, et confronter les contrats. Le câblage s'ouvre à la livraison de `STORY-173`.

---

## Historique

- **2026-07-31** — créée. Elle formalise le constat posé le jour même en réancrant le tracker sur le code (v3.3.0) : les cinq écrans de la console sont mergés dans `dev` (`111e3b1`) et aucun ne parle à un backend. Aucune story ne couvrait ce passage, alors que son équivalent client (FE-INT-0→4) avait été jugé indispensable au point de suspendre le programme frontend.
