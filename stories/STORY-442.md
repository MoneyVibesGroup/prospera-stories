# STORY-442 : Le `contexte` d'un événement d'audit est stocké et jamais publié — une ligne `EXPORT_EFFECTUE` ne dit pas ce qui a été exporté

Status: in_progress

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 2 · **Complexité :** low · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`AuditEvent` porte un champ `contexte` documenté ainsi dans le schéma :

> *Contexte additif (STORY-073) — porté par `EXPORT_EFFECTUE` : format, statut, version,
> `snapshotId`, `versionHypothesesId`, `modeleVersion`|`moteurVersion`, empreinte.*

`AuditEventResponseDto.from()` construit `{ id, type, userId, cible, horodatage }` — **`contexte`
n'y est pas**. La donnée la plus riche du journal est écrite, indexée, conservée… et invisible.

Une ligne « EXPORT_EFFECTUE » sans son contexte ne répond à aucune des questions qu'on lui pose :
**quel format** ? **quelle version** ? **le fichier remis au client correspond-il au snapshot qui
fait foi** ?

## Critères d'acceptation

- [ ] AC-1 — `AuditEventResponseDto` publie `contexte: Record<string, string|number|null> | null`.
- [ ] AC-2 — Les documents antérieurs (sans le champ) rendent `null` — rétrocompatibilité déjà
      prévue par le schéma.
- [ ] AC-3 — Le `contexte` est **inerte pour le filtrage** : il ne devient pas un critère de
      requête (ce serait un index non prévu sur un champ libre).
- [ ] AC-4 — L'OpenAPI documente les clés connues par type d'action, sans les figer au type.

## Conséquences ailleurs

- Se livre avec **STORY-443** (le journal n'a ni pagination ni fenêtre) : les deux touchent le
  même DTO et la même route.
- Sans elle, l'écran d'export **FE-038** ne pourra pas répondre à « quelle version le client
  a-t-il reçue ? » depuis le journal.


## Progress Tracking

**Statut : `in_progress`** — branches `MNV-442` créées dans `docs/` et `bilan-service` **avant** la
première ligne de code.

```
docs             MNV-442
bilan-service    MNV-442
```

⚠️ **Périmètre tenu** : la fiche note que la story « se livre avec **STORY-443** » (le journal n'a ni
pagination ni fenêtre). STORY-443 **n'est pas** dans cette livraison — seul le champ manquant l'est.
Les deux touchent le même DTO et la même route, mais rien n'oblige à les livrer ensemble, et l'élargir
ici déborderait le périmètre.
