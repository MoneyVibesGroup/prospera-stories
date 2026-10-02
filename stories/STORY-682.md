# STORY-682 : Le fichier réellement transmis n'est pas conservé — seule son empreinte l'est

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (MinIO, bucket privé)
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-538 (2026-09-25) — **décision user** : « empreinte seule », archivage en story à part.

---

## Le fait

STORY-537 renvoyait « l'archivage du livrable » à STORY-538 ; 538 garde du fichier transmis son
**sha256 et sa taille**, calculés sur le fichier joint, et **rien d'autre**. L'empreinte prouve QUEL
fichier a été déclaré transmis ; devant un contrôle, le cabinet doit pouvoir **produire** ce fichier —
et le classeur rempli par 537 ne se régénère pas à l'identique si le classeur OTR fourni a changé.

## Critères d'acceptation

- [x] AC-1 — Le fichier joint à la transmission est stocké dans un bucket **privé** (patron STORY-129 :
      URL présignée, `MINIO_REGION`), clé non devinable, **dans la même opération** que le dépôt (aucun
      dépôt sans fichier, aucun fichier orphelin après échec — prouvé en docker).
- [x] AC-2 — Relecture par URL présignée, dans la portée de dossier de l'appelant (`dossier-service`,
      leçon de la revue de sécurité de 538).
- [x] AC-3 — L'empreinte relue du fichier stocké est **re-vérifiée** contre celle du dépôt.
- [x] AC-4 — Les dépôts antérieurs (empreinte seule) le disent : `fichier: null` avec motif, jamais un
      lien mort.

## Notes

- Voir [[STORY-538]], [[STORY-537]], [[STORY-129]].

## Progress Tracking

**Statut : `done` (2026-10-02).** PR `prospera-fiscal-service#12` intégrée en rebase-merge sur `dev` (5 commits : feature, 2 tests, config, revue).

### Livré

- Bucket MinIO **privé** `fiscal-depots` (`MINIO_DEPOTS_BUCKET`, refusé au boot s'il égale celui du catalogue), clé `depots/<128 bits aléatoires>` portée par `livrable.cleStockage`, jamais exposée (la réponse ne dit que `conserve`). Deux clients : interne (écrit/lit/supprime), public (signe, région fixée ⇒ signature hors ligne).
- AC-1 : putObject → relecture + re-hachage → insertion Mongo. L'objet est supprimé quand on **sait** que rien n'a été écrit (refus métier dont doublon E11000, échec de stockage) ; il est **conservé** sur une erreur d'insertion à issue incertaine (accusé perdu, bascule de primaire), avec la clé journalisée pour réconciliation. Bucket créé au boot, et à la demande sur `NoSuchBucket` si MinIO était absent au démarrage (démarrage dégradé, `/health` répond).
- AC-2 : route dédiée `GET /v1/depots/:id/fichier` (URL présignée éphémère, 300 s par défaut) ; portée jugée chez `dossier-service` **avant** tout accès au stockage, même 404 `DEPOT_INTROUVABLE` dans tous les cas ; throttle 20/min. Choix d'une route plutôt qu'une URL par lecture : l'URL vaut autorisation, et la re-vérification relit l'objet entier.
- AC-3 : sha256 + taille re-vérifiés au stockage ET à chaque relecture (flux borné à taille + 1) ; divergence ⇒ `FICHIER_ARCHIVE_ALTERE` (502), jamais une URL.
- AC-4 : dépôt antérieur ⇒ `fichier: null` + `FICHIER_NON_CONSERVE`.
- Compose racine (non versionné) : `MINIO_DEPOTS_BUCKET`, `MINIO_PUBLIC_*`, `MINIO_PRESIGNED_TTL` avec défauts, `depends_on: minio`.

### Revues

- **Code** — 2 non-bloquants corrigés : (1) MinIO absent au boot ⇒ bucket jamais créé, 503 jusqu'au redémarrage, code S3 avalé ⇒ création à la demande + une nouvelle tentative, code S3 journalisé ; (2) toute erreur d'insertion supprimait l'objet, y compris une écriture validée dont l'accusé s'est perdu (fichier détruit, irréversible) ⇒ suppression seulement si rien n'a été écrit.
- **Sécurité** — 0 (portée avant stockage, surcharge `response-*` impossible sous SigV4, `attachment` + `octet-stream`, clé imprévisible, lecture bornée, aucun secret journalisé).
- Contre-revue adversariale des deux correctifs : fermés, aucun nouveau défaut.

### Preuves (rejouées sur l'état final, puis sur la branche rebasée avec STORY-680)

- Portes : lint 0 · build OK · 103 suites / 1 536 tests · couverture 99,23 / 96,4 / 99 / 99,6 · e2e 8 / 114.
- Mutations : 22 / 22 tuées sur l'état final (dont R1a/b/c, R2a/b ; un mutant non compilable réécrit avant d'être compté).
- **Vérif docker** sur stack neuve (`down -v`), code exécuté prouvé par sha256 hôte = conteneur : **180 OK / 0 KO** — bucket privé (GET anonyme 403), objet identique à l'octet, sha256 objet = empreinte en base, URL présignée téléchargeable depuis l'hôte (signature altérée 403), 409 sans orphelin, course de 6 retransmissions `[201, 409×5]`, échec Mongo non métier ⇒ objet conservé + clé journalisée, MinIO absent au boot puis démarré ⇒ 201 sans redémarrer fiscal-service, TENANT_USER non affecté 404, antérieur `fichier: null`. Scripts : `tmp/verif-docker-682/`, `tmp/verif-docker-final-681-682/`.

### Historique

- 2026-10-01 — `in_progress`. Branche `MNV-682` ouverte (fiscal-service + docs).
- 2026-09-25 — `ready-for-dev`. Créée par la clôture de STORY-538.
