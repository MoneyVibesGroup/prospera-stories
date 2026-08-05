# STORY-173 : CORS sur le BFF admin — le service qui n'a jamais vu un navigateur

**Epic :** EPIC-025 — RBAC plateforme *(exploitation de la console)*
**Réf. code livré :** ⚡ **STORY-109** *(allowlist CORS par variable d'env, appliquée aux **cinq** autres services — le patron à copier, à l'identique)* · **STORY-047/048** *(surface admin du BFF)* · **STORY-138** *(contrat d'erreur `{ message, code }`)*
**Dépend de :** aucune
**Débloque :** ⚡ **AP-INT-0** *(bascule des 4 clients de la console)* · `AP-02` · et par ricochet `AP-06→AP-12`
**Priorité :** Must Have — ⚡ **la console entière est derrière**
**Story Points :** 3
**Complexité :** low — le patron existe cinq fois ; la valeur est de ne pas le découvrir en direct
**Statut :** En cours
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

- [ ] Les 7 critères vérifiés
- [ ] `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification navigateur** depuis la console sur `:3110`
- [ ] Branche `MNV-173`, PR rebase-mergée sur `dev`

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

### Ce qui reste à faire ici

- [ ] **B** — entrée de compose `admin-panel` avec le **même défaut** que les sept autres
- [ ] Vérification docker : préflight `OPTIONS` réel sur la stack telle qu'elle démarre
- [ ] Portes DoD sur `admin-panel` (lint, build, couverture, unit + e2e)
- [ ] Revue de code + revue de sécurité du diff mergé (aucune n'a été faite : la PR a été
      ouverte et mergée par le dev externe le même jour)
