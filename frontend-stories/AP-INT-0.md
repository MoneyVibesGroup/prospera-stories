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

## Historique

- **2026-07-31** — créée. Elle formalise le constat posé le jour même en réancrant le tracker sur le code (v3.3.0) : les cinq écrans de la console sont mergés dans `dev` (`111e3b1`) et aucun ne parle à un backend. Aucune story ne couvrait ce passage, alors que son équivalent client (FE-INT-0→4) avait été jugé indispensable au point de suspendre le programme frontend.
