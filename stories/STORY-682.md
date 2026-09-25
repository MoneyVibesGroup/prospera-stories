# STORY-682 : Le fichier réellement transmis n'est pas conservé — seule son empreinte l'est

Status: ready-for-dev

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

- [ ] AC-1 — Le fichier joint à la transmission est stocké dans un bucket **privé** (patron STORY-129 :
      URL présignée, `MINIO_REGION`), clé non devinable, **dans la même opération** que le dépôt (aucun
      dépôt sans fichier, aucun fichier orphelin après échec — prouvé en docker).
- [ ] AC-2 — Relecture par URL présignée, dans la portée de dossier de l'appelant (`dossier-service`,
      leçon de la revue de sécurité de 538).
- [ ] AC-3 — L'empreinte relue du fichier stocké est **re-vérifiée** contre celle du dépôt.
- [ ] AC-4 — Les dépôts antérieurs (empreinte seule) le disent : `fichier: null` avec motif, jamais un
      lien mort.

## Notes

- Voir [[STORY-538]], [[STORY-537]], [[STORY-129]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-538.
