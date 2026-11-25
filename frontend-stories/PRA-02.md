# Story PRA-02 : Le profil `coque` du compose : une seule origine sur :8080

Status: done — **livrée le 2026-11-25** par A (passation C → A le 25/11 ; plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`). Code : `prospera-app` #2.

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** A (passé de C à A le 25/11) · **Semaine visée :** S3-S4 · **Points :** 3
**Dépôt :** `prospera-app` (`infra/compose.coque.yml` et `infra/traefik/`) — voir « Écarts » : la fiche disait `docker-compose.yml` de MoneyVibes_Apps
**Spine :** AD-8 (une origine, `/api/*` au proxy), AD-12 et AD-19 (deux hôtes), Environnements
**Dépend de :** rien (se prouve sans la coque). **Débloque :** PRA-03 (la session passe par le proxy), PRA-11.

---

## User Story

**En tant que** coque (et plus tard app mobile),
**je veux** n'appeler qu'une seule origine, où `/api/<code>/v1/…` mène au service du module,
**afin de** n'avoir ni adresse de service dans le code, ni CORS à régler, ni relais qui masque le navigateur.

## Périmètre

**DANS le périmètre :**

1. **Un profil `coque`** dans `docker-compose.yml`, qui lève un **Traefik 3.7.x** sur **:8080**. Il ne lève aucun
   service : il route vers ceux que lèvent les autres profils.
2. **Le routage**, en configuration de fichier (`infra/traefik/dynamique.yml`) :
   - `/` → `prospera-app` en `next dev` sur l'hôte, port **:3200** (`host.docker.internal`) ;
   - `/api/<code>/v1/…` → `/api/v1/…` du service qui porte `<code>` (middleware `replacePathRegex`) ;
   - au minimum : `instance` → `platform-catalog-service` (l'état publié, STORY-936), `auth` → `auth-service`,
     `reseau` → `reseau-service`, `essai` et `mises-en-service` → `platform-catalog-service` ;
   - plusieurs codes peuvent viser un même service ; la table est **écrite à la main** pour le développement (sa
     génération depuis les manifestes relève du moteur, C10, hors de cette story).
3. **Les en-têtes** : Traefik transmet `User-Agent` et `X-Forwarded-For` ; les proxies de confiance sont déclarés
   (le réseau du compose). Il ne réécrit pas `Authorization`.
4. **Deux hôtes** pour les deux espaces (AD-19 : jamais deux chemins d'un même hôte) : `essai.localhost:8080` et
   `reel.localhost:8080` routent vers la même coque et vers les mêmes services en développement ; la coque saura
   lequel elle sert par sa configuration d'exécution (PRA-03).
5. **Une page dans le README du profil** : comment le lever (`docker compose --profile coque up`), la table des
   codes, comment ajouter un code.

**HORS périmètre :** la table de routage générée depuis les manifestes, le montage d'une instance de client, les
certificats (moteur, partie B) ; la recette et la production.

## Critères d'acceptation

| # | Critère | Preuve |
|:--:|---|---|
| AC-1 | `docker compose --profile coque up` lève Traefik sur :8080, `healthy` | sortie de `docker compose ps` |
| AC-2 | `curl :8080/api/instance/v1/etat-publie/{org}` avec un jeton valide rend l'état publié de `platform-catalog-service` (le chemin arrive au service en `/api/v1/etat-publie/{org}`) | sortie de `curl` + journal du service |
| AC-3 | `curl :8080/api/reseau/v1/module` rend la réponse de `reseau-service` | sortie de `curl` |
| AC-4 | Le service reçoit le `User-Agent` d'origine du `curl` et un `X-Forwarded-For` | journal du service ou route d'écho |
| AC-5 | `essai.localhost:8080/` et `reel.localhost:8080/` servent la page de `next dev` :3200 (ou une erreur de passerelle claire si elle n'est pas lancée) | `curl -H Host:` |
| AC-6 | Un code inconnu (`/api/inconnu/v1/x`) rend un 404 de Traefik, jamais un service au hasard | `curl` |

## Notes pour le développeur

- Verrou Docker du poste principal (`MoneyVibes_Apps\.verrou-docker`), pile `grp-c`, `down -v` à la fin.
- Le profil `coque` ne doit **rien** changer aux autres profils ni aux ports existants (3000, 3100, 3007, 3008…).
  Vérifier `docker compose config` avant et après.
- Si `host.docker.internal` ne résout pas sous WSL, ajouter `extra_hosts: ["host.docker.internal:host-gateway"]`.

## Fini quand

AC-1 → AC-6 prouvés, PR fusionnée, fiche à `done` dans la PR de docs, journal de C à jour.

---

## Livraison (2026-11-25)

**Code :** `MoneyVibesGroup/prospera-app` **#2**, fusionnée en Rebase and merge (`headRefOid` `f722919`, `mergedAt` 2026-11-25T02:58:53Z) ; `dev` = `90db6d4`. CI verte. Fichiers : `infra/compose.coque.yml`, `infra/traefik/dynamique.yml`, `infra/README.md` (commande exacte, table des codes, ajout d'un code, pièges).

**Passation C → A.** La story est passée de C à A le 25/11, avec l'accord de la session C : PRA-03 en dépend (AC-1 et AC-5 passent par :8080) et PRA-05 doit finir le 04/12. **C ne prend rien du lot 7 pour l'instant, PRA-07, 08 et 09 comprises : c'est l'utilisateur qui décidera.**

**Lever le profil** (depuis `prospera-app/`) :

```bash
export COQUE_INFRA="$(pwd -W)/infra"   # chemin absolu de infra/ ; PowerShell : $env:COQUE_INFRA="$PWD\infra"
docker compose -p grp-a -f ../docker-compose.yml -f infra/compose.coque.yml --profile coque up -d traefik auth-service platform-catalog-service
npm run dev                             # la coque sur :3200
```

### Preuves (pile `grp-a`, verrou « A PRA-02 », `down -v` à la fin)

| AC | Preuve |
|:--:|---|
| AC-1 | `docker compose ps` : `grp-a-traefik-1 … Up (healthy)` ; ports `0.0.0.0:8080->8080`. |
| AC-2 | `curl 127.0.0.1:8080/api/instance/v1/etat-publie/{org}` rend le 401 JSON de `platform-catalog-service` ; son journal montre `"url":"/api/v1/etat-publie/{org}"` : le chemin est réécrit et arrive au service. **Sans jeton valide** (voir « Non prouvé »). |
| AC-3 | `GET /api/reseau/v1/health` rend 200 (réponse de `reseau-service`, buildé depuis `origin/dev`) ; `GET /api/reseau/v1/module` rend le 404 Nest `Cannot GET /api/v1/module` (ce service n'a pas de route `module`). `/api/auth/v1/health` rend 200 d'`auth-service`. |
| AC-4 | Route d'écho `/api/echo/v1/x` : `User-Agent: sonde-pra02/1.0`, `Authorization: Bearer abc` intact, `X-Forwarded-For`, `X-Real-Ip`, `X-Forwarded-Host/Proto/Port`. Journal du catalogue pour une requête avec ce `User-Agent` : `"user-agent":"sonde-pra02/1.0"`, `"x-forwarded-for":"172.26.0.1"`. |
| AC-5 | `-H 'Host: essai.localhost:8080'` et `-H 'Host: reel.localhost:8080'` : `/` rend 307 vers `/accueil` et `/accueil` rend 200, `<title>Prospera</title>`, `<h1>Accueil</h1>` (le `next dev` de :3200). |
| AC-6 | `/api/inconnu/v1/x` rend `404 page not found` de Traefik (corps `text/plain`), jamais la coque ni un service. |
| Piles | `docker-compose.yml` et `docker-compose.override.yml` inchangés (sha256 `d02f62db…`, `3c7bd435…`) ; `docker compose config` **sans** le fichier coque, avant et après : identique (`cmp`), avec et sans l'override. **Avec** le fichier coque et sans profil, le seul écart est `TRUSTED_PROXIES` de `auth-service` et `platform-catalog-service` (`""` → `172.16.0.0/12`). |

**Mutations** (rouge constaté, retirée, vert reconstaté) :
1. `api-instance` sans le middleware `vers-api-v1` : `/api/instance/v1/etat-publie/{org}` rend 404 (`Cannot GET /api/instance/v1/…` : le chemin non réécrit arrive au service) au lieu de 401 ; restauré : 401.
2. Exclusion `!PathPrefix(/api/)` retirée de la règle `coque` : `/api/inconnu/v1/x` rend le HTML de la coque au lieu du 404 de Traefik ; restaurée : `404 page not found`.

### Écarts et ce qui n'est pas prouvé

- **Écart de dépôt.** La fiche disait « `docker-compose.yml` de MoneyVibes_Apps ». Ce fichier n'est suivi par **aucun dépôt** (MoneyVibes_Apps n'est pas un dépôt git ; les `docker-compose.yml` des autres dépôts sont ceux des services). Décision de l'utilisateur (via la session principale) : le profil vit dans un **fichier à part dans `prospera-app/infra/`**, superposé au compose racine, qui ne bouge pas.
- **AC-2 sans jeton valide** : un 401 prouve que le chemin arrive, pas l'état publié rendu avec un jeton. À jouer avec PRA-03 / PRA-05 (jeton réel d'`auth-service`).
- **AC-3** : `/api/reseau/v1/module` n'existe pas côté service ; la preuve passe par `/health`. `reseau-service` n'est pas dans le compose racine : il a été buildé depuis `origin/dev` avec une surcharge de preuve (hors dépôt), l'image supprimée ensuite. Sans lui, le code `reseau` rend un 502 de Traefik.
- **`essai`, `mises-en-service`** : routés vers le catalogue avec la règle générale `/api/<code>/v1/x → /api/v1/x` ; le chemin exact côté service (`essais`, `mises-en-service`) est celui de l'appelant. Vérifié seulement jusqu'au 404 du service.
- **`TRUSTED_PROXIES`** : `uniquelocal` marche pour auth et le catalogue mais est **refusé en production** par `reseau-service` ; défaut posé en CIDR `172.16.0.0/12` (variable `COQUE_TRUSTED_PROXIES`). Le `X-Forwarded-For` reçu est la passerelle Docker (`172.x.0.1`), pas le poste.
- **`--build`** : une première levée avec `--build` a reconstruit auth et catalogue (images `grp-a-*` remplacées par un build du jour) ; sans effet sur le fond, coûte du disque.
- Traefik : l'entrée interne `traefik` prend par défaut :8080 et plantait sur « address already in use » ; déplacée sur :8082 (variables d'environnement), `healthcheck` avec `--entrypoints.traefik.address=:8082`.
- Le `docker-compose.override.yml` n'est pas lu quand on passe `-f` : la commande ne le prend pas (images `runtime`).

### Ce que PRA-03 doit savoir

- **URL** : `http://127.0.0.1:8080` (ou `essai.localhost:8080`, `reel.localhost:8080`). **`localhost` seul** peut échouer sur ce poste : il se résout en `::1`, où `wslrelay` réinitialise la connexion (`curl -4` ou `127.0.0.1` marche).
- **Hôtes** : deux hôtes, donc deux cookies distincts (AD-19) ; ils servent la même coque et les mêmes services. Pour `next dev` derrière eux : `NEXT_DEV_ORIGINS=essai.localhost,reel.localhost` (lu par `next.config.ts`). Le `Host` est transmis tel quel.
- **Cookies** : Traefik ne touche ni `Set-Cookie` ni `Authorization`. Le cookie de refresh se pose sur l'hôte appelé.
- **API** : `/api/<code>/v1/x` → `/api/v1/x`. Codes : `instance`, `essai`, `mises-en-service` (catalogue), `auth`, `reseau`, `echo`. Ajouter un code : `infra/README.md`.
- **Lever** : la commande ci-dessus, avec `COQUE_INFRA` (Compose résout les chemins relatifs depuis le dossier du premier `-f`). Nommer les services : sans nom, `up` lèverait toute la pile racine. Verrou Docker du poste.
- La coque doit tourner sur :3200 sur l'hôte ; sans elle, Traefik rend un 502 clair.
