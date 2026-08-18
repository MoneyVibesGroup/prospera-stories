# Story FE-INT-5 : Le front atteint `dossier-service` — préfixe logique `/dossiers`, base `:3009`, types générés

Status: review  <!-- créée le 2026-08-17 · livrée le 2026-08-18, branche `fe-int-5` (454e3e8), poussée -->

**Epic :** FE-EPIC-002 — Intégration backend (retrofit / Integration Gate) — **amende FE-INT-0**
**Points :** 2 · **Sprint :** 10, **EN TÊTE** · **App :** `prospera-frontend-expert-comptable` (`:3100`)
**API :** `dossier-service` (`:3009`) — 12 routes montées, préfixe global `/api/v1`
**Backend d'appui :** **STORY-301, 353, 354, 304, 302, 355, 356** — toutes `done` (13→15/08). **Rien à attendre.**
**Backend prêt :** ✅ **OUI, et vérifié en conditions navigateur le 2026-08-17** (voir « Ce qui est déjà fait »)
**Réf. plan :** `frontend-sprint-status.yaml` S10 · prérequis dur de **FE-059a, FE-060, FE-061, FE-062, FE-066**
**Dépendances :** aucune. **C'est elle la dépendance des cinq autres.**
**Maquette :** aucune — story de plomberie, zéro pixel.
**Maître Scrum (frontend) :** MightyRaven

---

## Convention Git

- **Une story = une branche.** Branche : `fe-int-5`. Commits préfixés `FE-INT-5 …`.
- Branche depuis `dev` + **rebase sur `origin/dev` AVANT de coder** ; push HTTPS ; PR vers `dev`.
- **Fusion en « Rebase and merge » uniquement.**

---

## User Story

En tant que **développeur frontend de l'app cabinet**,
je veux **que le client API sache router `/dossiers` vers `dossier-service` et que ses types soient générés depuis son OpenAPI**,
afin que **les cinq stories du bloc dossier écrivent des appels, pas de la plomberie** — aujourd'hui aucune ligne du dépôt ne sait que ce service existe.

---

## Pourquoi cette story existe

**Cinquième occurrence du défaut de chaînage que ce dépôt documente déjà quatre fois** ([[frontend-backend-integration-gate]]) — mais dans une forme nouvelle, et plus silencieuse que les précédentes.

Les quatre premières étaient : *une story backend livrée ne déclenche rien tant qu'une story frontend ne la nomme pas.* Ici, **huit** stories backend sont livrées, un **service entier** existe avec 12 routes, il est **déclaré dans le `docker-compose.yml` racine avec son CORS et son port publié** — et le front n'a ni sa base, ni son préfixe, ni ses types. Le bloc S10 (34 pts, 5 stories) se serait ouvert sur un `resolveApiUrl()` qui **lève** au premier appel.

⇒ **Règle à ajouter au contrôle d'ouverture de tout bloc s'appuyant sur un service NEUF :**
`grep` son nom dans `docker-compose.yml`, dans `src/lib/api/services.ts` **et** dans `scripts/gen-api.mjs`.
« La story backend est `done` » ne dit rien de sa **joignabilité**, et « le service est dans le compose » ne dit rien de ce que le **front** en sait.

---

## Ce qui est DÉJÀ FAIT — ne pas le refaire

Vérifié le **2026-08-17** contre le stack réel (`docker compose up -d --build dossier-service`). Le développeur de cette story **part de là**, il ne rejoue pas ces contrôles :

| contrôle | résultat |
|---|---|
| `GET :3009/api/v1/health` | `{"status":"ok","info":{"mongodb":{"status":"up"},"kafka":{"status":"up"}}}` |
| 12 routes montées | `/api/dossiers` GET·POST · `/:id` GET · `/:id/affectation` PATCH · `/:id/archiver` POST · `/:id/reactiver` POST · `/:dossierId/exercices` GET·POST · `/:exId/clore` POST · `/:exId/rouvrir` POST |
| `GET /api/v1/dossiers` sans jeton | **401** — la route existe, le garde mord |
| `GET /api/v1/inexistant` | **404** — donc le 401 ci-dessus n'est pas un fourre-tout |
| préflight `OPTIONS` + `Origin: http://localhost:3100` | **204 + `Access-Control-Allow-Origin: http://localhost:3100`** |
| préflight + `Origin: http://evil.local` | **204 SANS `Allow-Origin`** → allowlist réelle, pas `*` |
| `GET :3009/api/docs-json` | **200** — `gen:api` peut le cibler |
| données présentes | **10 dossiers « Mon cabinet »** auto-créés (D1) par rejeu de `identity.org.created` — `GET /dossiers` ne rendra pas une liste vide |

⚡ **Le piège de FE-057 est désamorcé AVANT le premier écran**, pour la première fois du programme : la vérification CORS a été faite en préflight avec `Origin`, pas en `GET` curl.

---

## Périmètre

**Inclus — quatre fichiers, aucune UI :**

1. **`src/lib/api/services.ts`** — ajouter l'entrée de routage :
   ```ts
   { prefix: "/dossiers", base: env.NEXT_PUBLIC_DOSSIER_URL, strip: false },
   ```
2. **`src/lib/env.ts`** — `NEXT_PUBLIC_DOSSIER_URL: z.url().optional()` dans `clientEnvSchema` **et** dans le mapping statique de `parseClientEnv()` (les deux : Next remplace les `NEXT_PUBLIC_*` à la compilation, un accès dynamique ne marche pas).
3. **`scripts/gen-api.mjs`** — 7ᵉ cible :
   ```js
   { name: "dossier", base: process.env.NEXT_PUBLIC_DOSSIER_URL ?? "http://localhost:3009" },
   ```
   puis `npm run gen:api` contre le stack qui tourne → `src/types/api/dossier.ts`, **committé** (la CI n'a pas le backend).
4. **`.env.example` et `.env.local`** — `NEXT_PUBLIC_DOSSIER_URL=http://localhost:3009`, documentée comme les six autres.

**Hors périmètre — et c'est explicite :**
- Tout écran, tout hook, toute `queryFn` → **FE-059a** et suivantes.
- Le sélecteur de dossier actif, `dossierId` dans l'URL, la purge du cache → **FE-062**.
- **La réparation des 5 fichiers de l'Atelier qui appellent des routes mortes → FE-063** (voir le piège nº3, qui est le cœur de cette story).

---

## ⚠️ Trois pièges, dans l'ordre de leur coût

### 1. `strip: false` — ne pas copier `/atelier` par symétrie

`/ec` et `/atelier` sont `strip: true` parce que leurs services **n'ont pas de segment commun** (`/tenant/state`, `/balances`, `/referentiels/actifs`…) : le préfixe logique est une étiquette inventée pour désambiguïser.

`dossier-service` expose **réellement** ses routes sous `/dossiers`. Le préfixe logique et le segment réel **coïncident**. Le mettre `strip: true` enverrait `:3009/api/v1/` **nu** — un 404 dont la cause n'est écrite nulle part.

### 2. `optional()` aujourd'hui, **à promouvoir en requis avec FE-062**

On suit le patron de `CATALOG`/`DOCUMENT`/`BALANCE` : optionnelle au schéma, et `resolveApiUrl` **lève explicitement** si une base manque — échec bruyant plutôt qu'appel vers la mauvaise cible.

⚠️ **Mais la portée change au S10 :** dès que FE-062 met le sélecteur de dossier **dans le shell**, l'app sans `NEXT_PUBLIC_DOSSIER_URL` n'est plus « une app privée d'un module », c'est **une app qui ne s'ouvre pas**. ⇒ **FE-062 doit passer cette variable en `z.url()` requis** et le dire dans sa fiche. Écrit ici pour que ça ne se perde pas : c'est exactement la forme du défaut que cette story répare.

### 3. ⛔ **LE PIÈGE PRINCIPAL — `gen:api` va rester VERT en cachant que l'Atelier est mort**

`npm run gen:api` régénère **les 7 services**, dont `balance.ts`. Or STORY-236 (mergée le 16/08) a déplacé **toute** la surface de `balance-service` sous `dossiers/:dossierId/…`. Cinq fichiers du front appellent donc aujourd'hui des routes qui **n'existent plus** :

| fichier | chemin appelé | état contre `origin/dev` |
|---|---|---|
| `features/atelier/api/get-balance.ts` | `/atelier/balances/:id` | ⛔ 404 |
| `features/atelier/api/list-balances.ts` | `/atelier/balances` | ⛔ 404 |
| `features/atelier/api/submit-balance.ts` | `/atelier/balances` | ⛔ 404 |
| `features/atelier/api/marquer-etat.ts` | `/atelier/balances/:id/valider` | ⛔ 404 (FE-058, mergée le 08/08) |
| `features/atelier/api/import-sage.ts` | `/atelier/balance/import/sage` | ⛔ 404 |
| `features/atelier/api/get-referentiels-actifs.ts` | `/atelier/referentiels/actifs` | ✅ intact |
| `features/atelier/api/suggest-comptes.ts` | `/atelier/balances/suggest-comptes` | ✅ intact |

**Et RIEN dans la chaîne d'outils ne le signalera.** Vérifié : le front dérive ses types de `components["schemas"][…]` **exclusivement** — jamais de `paths[…]`. Les noms de DTO (`BalanceResponseDto`, `SubmitBalanceDto`, `LigneBalanceDto`…) sont **inchangés** par STORY-236 ; seules les **clés de chemin** ont bougé, et le front ne les lit pas. `apiFetch<T>(path: string)` prend une chaîne libre.

⇒ **`gen:api` vert · `tsc` vert · `lint` vert · `build` vert · 5 appels morts.**
C'est le symétrique exact du « commentaire d'écart périmé » de FE-017 : là le contournement survivait à la correction du backend ; ici c'est **l'URL** qui survit au déplacement de la route, et la couche de types est **structurellement incapable** de la voir.

**Ce que cette story DOIT faire de ce constat :** ne rien réparer, et **le transmettre**. Ajouter dans la PR le tableau ci-dessus, à jour, produit par un appel réel contre le stack — pas par relecture. **C'est le livrable d'entrée de FE-063**, et il vaut mieux qu'une relecture : une relecture manque toujours un fichier.

⚠️ **Corollaire pour la revue :** une PR FE-INT-5 toute verte **ne prouve pas que l'Atelier fonctionne**. Ne pas conclure de gates vertes que le module va bien — c'est précisément ce que cette story démontre impossible.

---

## Critères d'acceptation

- [ ] `resolveApiUrl("/dossiers")` → `http://localhost:3009/api/v1/dossiers` et `resolveApiUrl("/dossiers/abc/exercices")` → `…/api/v1/dossiers/abc/exercices` — **test unitaire** dans la suite existante de `services.ts`.
- [ ] Le préfixe **n'est PAS retiré** : un test assied `strip: false` (`/dossiers` reste dans l'URL finale). Un test de non-régression vérifie que `/documents` continue de router vers `:3006` — les deux préfixes partagent leurs deux premières lettres, la frontière est le **segment**.
- [ ] `resolveApiUrl("/dossiers")` **lève explicitement** si `NEXT_PUBLIC_DOSSIER_URL` est absente (message nommant la variable), au lieu de partir sur une base par défaut.
- [ ] `npm run gen:api` produit `src/types/api/dossier.ts` **committé**, en-tête « FICHIER GÉNÉRÉ » inclus, et le script rend `✓ dossier → src/types/api/dossier.ts (N chemins)` avec **N ≥ 6**.
- [ ] `components["schemas"]` de `dossier.ts` contient bien les DTO du portefeuille (au minimum le DTO de dossier et celui d'exercice) — **ouvrir le fichier et le vérifier**, un `content?: never` ressemble à une route sans corps, pas à une lacune de documentation (leçon AP-08).
- [ ] `.env.example` documente la variable ; `.env.local` la porte.
- [ ] **Preuve NAVIGATEUR, pas curl** : depuis l'app en `:3100`, un appel authentifié à `/dossiers` rend **200 et une liste non vide** (les 10 « Mon cabinet »), **sans erreur CORS en console**. Un `GET` en curl ne fait pas de préflight et ne prouve rien.
- [ ] Gates : `tsc` 0 · `lint` 0 erreur · tests verts · `next build --webpack`.
- [ ] **Le tableau des 5 routes mortes de l'Atelier est dans la PR**, produit par appel réel, et référencé par FE-063.

---

## Rappels d'environnement qui ont déjà coûté du temps

- **Les `NEXT_PUBLIC_*` sont inlinées AU BUILD.** Ajouter la variable puis relancer `next dev` sans rebuild laisse `undefined` — et le message d'erreur accuse la config, pas le cache. **Rebuild après modification du `.env.local`.**
- **`.env.local` et l'IP LAN : 5ᵉ occurrence de la famille.** Si vos `.env.local` pointent une IP DHCP (`10.x…`) au lieu de `localhost`, comparez-la à `ipconfig` **avant** de suspecter le code : les routes de session de Next appellent les services **côté serveur**, donc un hôte injoignable ne produit ni erreur CORS ni message — juste un appel qui ne finit pas.
- **Le stack doit exécuter `origin/dev`** : l'override monte `src/` en volume, donc le conteneur exécute **votre checkout**. `dossier-service` est à `132a190` (MNV-356) au 2026-08-17. Contrôle rapide : `GET :3009/api/v1/dossiers` doit rendre **401**, jamais 404.
- **Erreur bénigne au boot, ne pas la chasser :** `ProfilConsumer … This server does not host this topic-partition`. Course de métadonnées Kafka pendant l'auto-création du topic ; le consommateur rejoint son groupe ~8 s plus tard (`Consumer has joined the group`, `dossier-profil`).

---

## Integration Gate

FE-INT-5 est **la porte d'entrée de FE-EPIC-008**, au même titre que FE-INT-0 l'était pour FE-EPIC-002. Aucune story du bloc dossier ne peut être « done » avant elle. Elle en hérite les règles : **types générés, jamais écrits à la main** · **zéro mock sur le chemin réel** · **tout écart tracé en ticket avant la story suivante**.

---

## Livraison — 2026-08-18 (branche `fe-int-5`, commit `454e3e8`, poussée)

**Tous les AC vérifiés.** `resolveApiUrl("/dossiers")` → `:3009/api/v1/dossiers`, préfixe conservé ;
frontière de **segment** prouvée entre `/documents` (:3006) et `/dossiers` (:3009) ; base absente ⇒
lève **en nommant `NEXT_PUBLIC_DOSSIER_URL`** (le message générique d'avant obligeait à deviner) ;
`dossier.ts` committé, **9 chemins** (≥ 6), `DossierResponseDto` et `ExerciceResponseDto` présents.

⚡ **Les 3 tests ont été vérifiés PAR MUTATION** (`strip: true` et message sans variable ⇒ 3 rouges) :
un test vert ne prouve pas qu'il teste.

**Gates :** `tsc` 0 · `lint` 0 · **510** tests verts · `next build --webpack` OK.
**Preuve navigateur** (pas curl) : `GET :3009/api/v1/dossiers` → **200** depuis `:3100`, liste non
vide, **zéro erreur console** ; témoin sans jeton → **401**.

### ⛔ Livrable transmis à FE-063 — les routes mortes de l'Atelier

Produit par **appel réel**, avec les deux témoins qui rendent la mesure lisible
(`/inexistant-xyz` → **404** ; `/whoami/balance-access` → **401**) :

| appel du front (préfixe `/atelier` retiré) | statut |
|---|---|
| `GET /balances/:id` · `GET /balances` · `POST /balances` | **404** ⛔ |
| `POST /balances/:id/valider` · `POST /balances/:id/rejeter` | **404** ⛔ |
| `POST /balance/import/sage` | **404** ⛔ |
| `GET /referentiels/actifs` · `POST /balances/suggest-comptes` | **401** ✅ intacts |

⇒ **6 appels morts** (la fiche en annonçait 5 : `rejeter` s'ajoute à `valider`, tous deux dans
`marquer-etat.ts`). Leurs équivalents sous `/dossiers/:dossierId/…` répondent **401** : les routes
existent, seule l'URL du front est périmée.

⚠️ **Cette PR verte NE PROUVE PAS que l'Atelier fonctionne** — c'est précisément ce qu'elle démontre
impossible à conclure de gates vertes.
