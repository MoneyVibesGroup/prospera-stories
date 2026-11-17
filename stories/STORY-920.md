# STORY-920 : MinIO à la norme — l'image de Chainguard, `user: '0'`

Status: done

**Complexité :** faible (un service de compose, une garde)

**Source :** demande de B (journal de B, « → A, copie à C (2026-11-17) : MinIO passe à `cgr.dev/chainguard/minio:latest` ») ;
`coordination/REGLES-DES-GROUPES.md` §1.6 ; `coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2, ligne 920.
**Dépôts :** `prospera-recette` (versionné, se fusionne sur **dev**) ; `docker-compose.yml` racine du poste principal
(**non versionné**, modifié en place).
**Plage :** groupe A, n° 1 du lot 3. Fiche écrite juste avant de coder.

---

## Pourquoi

`minio/minio` a été retiré de Docker Hub (« pull access denied ») et `quay.io/minio/minio` refuse le pull anonyme (401) :
un poste sans l'image en cache ne lève plus ni la recette ni une pile de `document-service`. La norme du 2026-11-17
(décision de l'utilisateur) est l'image de Chainguard, le même serveur MinIO, qui tourne sans root et refuse sinon
d'écrire dans `/data` (« file access denied »).

## Ce que la story livre

1. `docker-compose.yml` racine (poste principal) : service `minio` en `image: cgr.dev/chainguard/minio:latest` et
   `user: '0'` ; commande, variables (`MINIO_ROOT_USER`/`PASSWORD`) et ports 9000/9001 inchangés.
2. `prospera-recette/docker-compose.recette.yml` : le service `minio` du profil pose lui aussi l'image et `user: '0'`
   (il ne surchargeait que les ports) : la recette ne dépend plus de la copie racine de chaque poste.
3. La garde du profil (`profil-de-recette.spec.ts`) est réalignée : MinIO reçoit `image`, `user`, `ports` et rien
   d'autre ; l'image est celle de Chainguard et aucune image `minio/minio` ou `minio/mc` n'y reparaît (mutation :
   retirer `user` rougit sur l'assertion).
4. Une recette qui écrit dans MinIO rejouée sur pile neuve (voir « Livraison »).

## Décisions

- **D-920-1 — Pas de healthcheck sur MinIO.** Le service n'en avait pas (`depends_on: service_started`) ; l'image de
  Chainguard est distroless (ni `curl` ni `mc`), donc aucun healthcheck `CMD` n'y est possible sans changer l'image. On
  ne touche pas à l'ordre de démarrage : la norme dit « même commande, mêmes variables, mêmes ports ».
- **D-920-2 — Le client `mc`** n'est pas utilisé par la recette ; la preuve de lecture/écriture passe par la recette
  elle-même (publication d'artefacts via le catalogue, relecture par `balance-service`/`fiscal-service`). Si un test
  futur a besoin de `mc` : `cgr.dev/chainguard/minio-client:latest-dev` (§1.6).
- **D-920-3 — `:latest`** comme la norme l'écrit ; l'épinglage par condensat reste une décision du groupe B/PO.

## Critères d'acceptation

- **AC-1** : `docker compose config` du profil donne, pour `minio`, l'image Chainguard et `user: '0'`.
- **AC-2** : une pile neuve (volumes neufs) lève avec cette image ; MinIO écrit dans `/data`.
- **AC-3** : une recette qui écrit dans MinIO passe d'un bout à l'autre.
- **AC-4** : la garde du profil rougit si l'image ou `user` disparaît.

## Definition of Done

- [x] `npm test` du paquet vert ; mutation rouge sur l'assertion.
- [x] Recette sur pile neuve verte ; pile descendue avec ses volumes ; verrou Docker rendu.
- [x] PR de recette fusionnée sur dev ; PR de docs fusionnée ; C prévenu ; demande de B passée à « servie ».

## Livraison (2026-11-17)

🏁 **DONE** — prospera-recette **#24** (dev `68ef348`) ; `docker-compose.yml` racine du poste principal modifié en place
(non versionné : `image: cgr.dev/chainguard/minio:latest` et `user: '0'`, ligne du service `minio`).

- Garde du profil : 18/18 ; mutation (retrait de `user: '0'`) rouge **sur l'assertion** (`Expected - 1 / Received + 0`).
- Preuve : pile neuve `COMPOSE_PROJECT_NAME=grp-a` (volumes neufs, images construites depuis `dev`), avec
  `RECETTE_SURCOUCHES=../../docker-compose.fiscal.yml`, recette **`zone-franche` 5/5** : le catalogue publie les paquets
  fiscaux `fiscal-tg-entreprise` et `-zone-franche` comme artefacts dans MinIO, relus par balance-service et
  fiscal-service. Le conteneur `grp-a-minio-1` porte bien `cgr.dev/chainguard/minio:latest` et `User=0`. `mc ls
  --recursive` (`cgr.dev/chainguard/minio-client:latest-dev`, sur le réseau de la pile) voit les buckets `kyc-documents`,
  `org-branding`, `referentiel-packages`, `fiscal-depots` et les objets écrits (paquets de 70 KiB et 8,1 KiB, pièces KYC).
- Pile descendue (`down -v`), conteneurs `fiscal-service` / `mongo-fiscal` retirés à la main (le fichier fiscal n'était
  pas résolu au `down`), réseau `grp-a_default` retiré, verrou rendu.
- Constat : le bucket `fiscal-depots` est créé mais vide : aucune recette de la pile n'archive de livrable fiscal dans
  MinIO aujourd'hui ; l'écriture prouvée est celle des artefacts de référentiel (même service MinIO, même chemin S3).
