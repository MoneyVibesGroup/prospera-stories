# Story PRA-02 : Le profil `coque` du compose : une seule origine sur :8080

Status: ready-for-dev — **créée le 2026-11-24** (plan `coordination/PLAN-COQUE-EPIC-265-2026-11-24.md`).

**Epic :** EPIC-265 — Coque `prospera-app` · **Groupe :** C · **Semaine visée :** S3-S4 · **Points :** 3
**Dépôt :** MoneyVibes_Apps (`docker-compose.yml`, nouveau dossier `infra/traefik/`)
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
