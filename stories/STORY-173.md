# STORY-173 : CORS sur le BFF admin — le service qui n'a jamais vu un navigateur

**Epic :** EPIC-025 — RBAC plateforme *(exploitation de la console)*
**Réf. code livré :** ⚡ **STORY-109** *(allowlist CORS par variable d'env, appliquée aux **cinq** autres services — le patron à copier, à l'identique)* · **STORY-047/048** *(surface admin du BFF)* · **STORY-138** *(contrat d'erreur `{ message, code }`)*
**Dépend de :** aucune
**Débloque :** ⚡ **AP-INT-0** *(bascule des 4 clients de la console)* · `AP-02` · et par ricochet `AP-06→AP-12`
**Priorité :** Must Have — ⚡ **la console entière est derrière**
**Story Points :** 3
**Complexité :** low — le patron existe cinq fois ; la valeur est de ne pas le découvrir en direct
**Statut :** ✅ Terminée *(2026-08-05)*
**Assigné à :** vivianMoneyVibesGroupes
**Créée le :** 2026-08-03 *(trouvée en exécutant AP-INT-0)*
**⚠️ Renumérotée le 2026-08-04 :** portait le n° **172**, déjà pris en parallèle par la série `balance-service` poussée sur `origin/main` (comptes de paramétrage & rapprochement bancaire, `done`). **`origin/main` fait foi** — même règle que pour les n° 145/146/147 le 2026-07-31. Les commits de code qui la citent sous `STORY-172` restent lisibles : la branche backend s'appelle désormais `MNV-173`.
**Sprint :** 20 — dette d'exploitation de la console
**Service :** `prospera-admin-panel-service` (`:3010`)

---

## Le constat, vérifié dans le code

En rendant l'arbitrage d'architecture d'`AP-INT-0` — *la console passe-t-elle par le BFF ?* — la
réponse est **oui** : le BFF est le seul à servir la liste d'organisations **paginée avec sa jointure
à trois services** et sa dégradation par source. Puis :

```
$ git grep -i "cors" origin/dev -- src/
(aucune occurrence)
```

| Vérification | Résultat |
|---|---|
| `enableCors` dans `src/main.ts` | ⛔ absent — le fichier fait `helmet()`, `setGlobalPrefix`, `enableVersioning`, `useGlobalPipes`, `listen`. Rien d'autre |
| `CORS_ALLOWED_ORIGINS` dans son entrée de `docker-compose.yml` | ⛔ absente — les **cinq** autres services l'ont depuis `STORY-109` |
| `cors` n'importe où dans `src/` | ⛔ zéro occurrence |

**Ce n'est pas une configuration oubliée : la capacité n'existe pas dans le service.**

> ⚡ **Ce que ça révèle, au-delà du correctif.** Un service exposé sur `:3010`, avec huit
> contrôleurs d'administration livrés sur cinq stories, **qu'aucun navigateur n'a jamais appelé** —
> et son code le prouve mieux que n'importe quel tracker. C'est la contrepartie exacte du
> `GAP-bff-admin-sans-consommateur` : on a construit des deux côtés sans jamais brancher, et le
> premier symptôme apparaît au moment de brancher.

---

## User Story

**En tant que** console admin tournant dans un navigateur,
**je veux** que le BFF autorise mon origine,
**afin de** pouvoir l'appeler — ce qu'aucun de ses huit contrôleurs ne permet aujourd'hui.

---

## Périmètre

### A. Copier le patron `STORY-109`, sans l'inventer

Le comportement est **déjà spécifié et livré cinq fois**. Le reproduire tel quel :

- `CORS_ALLOWED_ORIGINS` — allowlist **explicite**, séparée par virgules, `trim` et entrées vides filtrées
- Vide ou absente ⇒ **CORS désactivé** *(non-régression service-à-service)* — ⚠️ **jamais `*`**, surtout pas ici : ce service porte un en-tête d'autorisation
- `credentials` conforme à ce que font les cinq autres
- Préflight `OPTIONS` traité

### B. L'entrée de compose

`CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:3100,http://localhost:3110}` —
**la même variable partagée** que les cinq autres services, avec le même défaut.

> ⚠️ **Le piège de la variable partagée, à ne pas rejouer.** Elle est unique pour tout le compose :
> la renseigner **remplace** le défaut. En fournir une seule origine ouvre une application **en
> fermant l'autre**. `AP-INT-0` l'a documenté après l'avoir failli.

### C. Ce que cette story ne fait pas

- Aucune route nouvelle, aucun changement de contrat — **uniquement le transport**
- Ne touche pas aux cinq autres services *(déjà conformes)*
- Ne bascule aucun client de la console — c'est `AP-INT-0`

---

## Critères d'acceptation

1. Le BFF lit `CORS_ALLOWED_ORIGINS` et n'autorise **que** les origines listées.
2. Variable vide ou absente ⇒ **CORS désactivé** ; les appels service-à-service continuent de passer
   *(non-régression : le BFF est aussi appelé sans navigateur)*.
3. ⚠️ **Jamais `*`** — vérifié par un test : une origine hors allowlist est refusée.
4. Le préflight `OPTIONS` d'une origine autorisée répond correctement, en-tête d'autorisation compris.
5. L'entrée de compose porte le **même défaut** que les cinq autres services.
6. ⚡ **Preuve en navigateur réel** — pas en `curl` : un `fetch` depuis `http://localhost:3110` vers
   `GET /api/v1/admin/orgs` aboutit, **zéro erreur CORS en console**. `curl` ne fait pas de préflight
   et ne prouve donc rien ici.
7. Le comportement est **identique** à celui des cinq autres services — pas une seconde
   interprétation de la même règle.

---

## Definition of Done

- [x] Les 7 critères vérifiés
- [x] `lint` 0 · couverture ≥ 90 % *(99.64 / 91.05 / 100 / 99.61)*
- [x] **Vérification navigateur** depuis `:3110` — Chrome headless, `fetch` résolu, zéro erreur CORS
- [x] Branche `MNV-173`, PR rebase-mergée sur `dev` *(admin-panel#12)*

---

## Progress Tracking

### Démarrage 2026-08-05 — état trouvé : **le code est mergé, le câblage ne l'est pas**

Le périmètre **A** (code) a été implémenté par le dev externe le 2026-08-03 sur `MNV-172` et
**rebase-mergé sur `dev`** le 2026-08-04 (PR `admin-panel#11`, `02a738b`) — 4 fichiers,
`src/main.ts` + `src/config/{configuration,env.validation}.ts` + `configuration.cors.spec.ts`.

⚠️ **Le périmètre B ne l'a pas été.** L'entrée `admin-panel` de `docker-compose.yml`
(racine, non versionnée) **ne porte pas `CORS_ALLOWED_ORIGINS`** — les sept autres services
l'ont ligne 28/73/144/192/239/276/381, `admin-panel` non :

```
$ awk '/^  [a-z0-9-]+:$/{svc=$1} /CORS_ALLOWED_ORIGINS/{print NR": "svc}' docker-compose.yml
28: expert-comptable    73: auth-service    144: kyc-service    192: platform-catalog-service
239: bilan-service      276: document-service    381: balance-service
(admin-panel : aucune)
```

**Conséquence exacte** : `allowedOrigins` étant alimenté par cette seule variable, le BFF démarre
dans la stack avec une allowlist **vide** ⇒ `enableCors` n'est jamais appelé ⇒ **le comportement
observé par la console est rigoureusement celui d'avant la story**. Le code mergé est **inerte**.
La vérification consignée dans le message de commit (`Origin :3110 → ACAO ✅`) a donc été obtenue
avec la variable injectée **à la main**, pas par le câblage que la story demande — un résultat
juste sur un montage que personne ne rejouera. C'est le critère 5, et il est bloquant pour AP-INT-0.

### Ce qui restait à faire, et qui a été fait

- [x] **B** — entrée de compose `admin-panel` avec le **même défaut** que les sept autres
- [x] Vérification docker : préflight `OPTIONS` réel sur la stack telle qu'elle démarre
- [x] Portes DoD sur `admin-panel` (lint, build, couverture, unit + e2e)
- [x] Revue de code + revue de sécurité du diff mergé

---

### ⚡ Le piège du `:-`, rencontré en voulant reproduire l'état d'avant

Premier essai de contrôle « avant » : relancer le conteneur avec `CORS_ALLOWED_ORIGINS=""`.
**Le préflight a répondu ✅** — donc l'inverse du résultat attendu. Cause :

```yaml
CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:3100,…}
```

`${VAR:-défaut}` substitue le défaut quand la variable est vide **OU** absente (`${VAR-défaut}`,
sans `:`, ne le fait que si elle est absente). Vider la variable ne **désactive** donc pas CORS
dans cette stack : **elle le réactive au défaut**. À connaître avant de croire avoir reproduit
quoi que ce soit en la mettant à vide. L'état d'avant n'a pu être reproduit qu'en **retirant la
ligne** du bloc.

### Vérification docker — contrôle avant/après (préflight `OPTIONS` réel, conteneur)

`OPTIONS /api/v1/admin/orgs`, `Access-Control-Request-Method: GET` :

| Origine | **Avant** *(ligne retirée du bloc)* | **Après** |
|---|---|---|
| `http://localhost:3110` *(console)* | ⛔ aucun en-tête | ✅ `ACAO: http://localhost:3110` |
| `http://localhost:3100` | ⛔ aucun en-tête | ✅ `ACAO: http://localhost:3100` |
| `http://localhost:3120` | ⛔ aucun en-tête | ✅ `ACAO: http://localhost:3120` |
| `http://localhost:3121` | ⛔ | ⛔ aucun en-tête |
| `https://evil.example` | ⛔ | ⛔ aucun en-tête |
| `null` | ⛔ | ⛔ aucun en-tête |
| `GET` **sans** `Origin` | `401` | `401` *(non-régression service-à-service ✅)* |

Préflight complet depuis `:3110` : `204` · `Vary: Origin` · `ACAM: GET,POST,PATCH,PUT,DELETE,OPTIONS` ·
`ACAH: Authorization,Content-Type` · **aucun** `Access-Control-Allow-Credentials`. La requête réelle
(`GET` avec `Origin`, sans jeton) renvoie `401` **et porte l'`ACAO`** — c'est ce qui permet à la console
de *lire* le 401 au lieu de se prendre une erreur réseau opaque. Sonde rejouée après les correctifs de
revue, conteneur redémarré.

⚠️ **`:3115` est AUTORISÉ** dans la stack de dev : le défaut énumère `:3100` → `:3120` **inclus**,
il n'a jamais été la « plage » que la story supposait courte. C'est pourquoi l'origine témoin des
tests est `:3121`.

### Critère 6 — preuve en navigateur réel (Chrome headless, pas `curl`)

Page servie sur `http://localhost:3110` faisant `fetch('http://localhost:3010/api/v1/admin/orgs')`
avec un en-tête `Authorization` — donc **préflight déclenché**, ce qu'une requête simple ne ferait pas :

```
FETCH_RESOLU status=401 (aucune erreur CORS : le navigateur a laissé passer)
```

La promesse **résout** au lieu de rejeter : le navigateur a accepté le préflight et rendu la réponse
lisible. ⚠️ **Limite assumée** : le contrôle négatif en navigateur (même page servie sur `:3121`,
`fetch` attendu en rejet) n'a **pas** pu être exécuté — le harnais a refusé la commande. Le refus est
prouvé au niveau protocole (aucun `ACAO` renvoyé, cf. tableau) et par les 7 tests e2e de préflight ;
il ne l'est pas *dans* un navigateur.

### Portes DoD

Lint **0 warning** · build OK · **317 unit** verts, couverture **99.64 / 91.05 / 100 / 99.61**
(seuils 65/90/90/90) · **158 e2e** verts (9 suites).

⚠️ `collectCoverageFrom` d'`admin-panel` exclut **`main.ts` ET `configuration.ts`** — les deux seuls
fichiers porteurs de la logique de cette story sont **invisibles aux seuils**. Le 99.64 % ne dit donc
rien d'elle : ce sont l'e2e de préflight et la sonde docker qui la couvrent, rien d'autre.

### Mutation-tests sur le câblage CORS (spec e2e)

| Mutation | Résultat |
|---|---|
| `origin: allowedOrigins` → `origin: '*'` | 🔴 4 tests rouges |
| `allowedHeaders` retiré | 🔴 1 rouge |
| `credentials: false` → `true` | 🔴 1 rouge |
| garde `if (allowedOrigins.length > 0)` retirée | 🟢 **reste vert — attendu** : `enableCors({origin: []})` ne matche aucune origine, le comportement observable est identique |

### Revue de code — 4 constats, tous corrigés (aucun bloquant)

1. ⚡ **Le seul test livré avec le code était un faux gardien.** Le cas « LISTE STRICTE » de
   `configuration.cors.spec.ts` survivait à **toutes** les mutations du parseur qu'il prétendait
   garder : séparateur `,`→`;` **vert**, `.filter(Boolean)` retiré **vert**, `.trim()` retiré **vert**.
   Ses assertions portaient sur un tableau que le test venait lui-même de remplir. Retiré (les deux
   autres cas le subsumaient) ; le **refus** ne se démontre que sur une réponse HTTP, d'où l'e2e.
   Son docblock annonçait un « miroir exact » du test d'`auth-service`, qui n'a que 2 cas — le seul
   cas ajouté ici était précisément celui sans pouvoir discriminant.
2. `:3115` comme origine témoin « refusée » alors que le défaut de compose l'**autorise** → `:3121`.
3. Six références en dur à `STORY-172` dans le code — story **réelle** et sans rapport
   (`balance-service`, `done`) — alignées sur `STORY-173`. Le diff se contredisait : le spec e2e et
   le commentaire de compose citaient le bon numéro.
4. `.env.example` sans `CORS_ALLOWED_ORIGINS`, contrairement aux sept autres : un démarrage **hors
   docker** depuis ce fichier reproduisait exactement le mode de panne que la story ferme, sans
   signal. Documentée (critère 7).

### Revue de sécurité — **aucune vulnérabilité**

Fail-closed sur tous les axes. `cors@2.8.6` compare par **égalité stricte** : ni reflet, ni préfixe,
ni regex, ni sous-domaine implicite. Trois conséquences qui comptent :

- l'origine **`null`** (iframe sandbox, `data:`, redirection cross-origin) est **refusée** ;
- ⚡ une valeur hostile `CORS_ALLOWED_ORIGINS=*` produit `['*']`, qui ne correspond à **aucune**
  origine réellement émise par un navigateur ⇒ **refus total, pas ouverture totale**. Le validateur
  `@IsOptional() @IsString()` est laxiste, mais toute malformation dégrade **vers le refus** ;
- `credentials: false` et **aucun cookie ni session** dans le service ⇒ pas d'autorité ambiante :
  lire une réponse d'administration exigerait déjà un bearer `PLATFORM_ADMIN`, donc une compromission
  antérieure et totale.

Vérifié aussi : `Vary: Origin` systématique (pas d'empoisonnement de cache partagé), aucun
`exposedHeaders`, et le préflight — qui court-circuite bien la chaîne de guards, `enableCors`
s'insérant au niveau Express, **avant** le routeur Nest — se termine sur un `204` vide sans jamais
atteindre un handler ni le `ValidationPipe`. **Aucune route ne devient atteignable sans jeton.**

> ⚠️ **À connaître pour la production, hors périmètre.** `CORS_ALLOWED_ORIGINS` est **partagée par
> les huit services** du compose : y ajouter l'origine d'une SPA locataire l'autorise **aussi** sur
> le BFF d'administration. Aucun privilège n'est conféré (il faut toujours un bearer
> `PLATFORM_ADMIN`), mais une variable dédiée au panel
> (`ADMIN_PANEL_CORS_ALLOWED_ORIGINS`) serait de la défense en profondeur bien placée.

### Clôture

PR **`admin-panel#12`** rebase-mergée sur `dev`, branche supprimée. Elle complète la PR `#11`
(`02a738b`, code livré par le dev externe le 2026-08-04).

⚠️ **Le correctif de compose ne vit dans aucun dépôt** : `docker-compose.yml` est à la racine du
monorepo, qui n'est versionnée nulle part. C'est la raison pour laquelle il a pu être oublié sans que
rien ne le signale — et il le sera encore. Le voici *in extenso*, à réappliquer si un poste repart de
zéro (bloc `admin-panel`, juste après `AUTH_AUDIENCE`) :

```yaml
      # STORY-173 — la console admin (:3110) appelle ce BFF DEPUIS UN NAVIGATEUR :
      # sans cette variable l'allowlist est vide et `enableCors` n'est jamais
      # appelé (main.ts), donc le code livré sur `dev` reste inerte. MÊME variable
      # partagée et MÊME défaut que les sept autres services (STORY-109) : la
      # renseigner REMPLACE le défaut, il faut y lister toutes les origines à la fois.
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:3100,…,http://localhost:3120}
```
