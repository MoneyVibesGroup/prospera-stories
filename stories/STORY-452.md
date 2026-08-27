# STORY-452 : Le snapshot n'a pas d'empreinte de son propre contenu — le champ `checksum` est celui du paquet référentiel

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

`SnapshotSommaireDto` publie `checksum: string`. Le nom se lit comme la signature de la version
figée. C'est en réalité `ReferentielPackage.meta.checksum` — le sha256 du **paquet référentiel**,
propagé depuis `bilan-engine.service` (`checksum: resolved.package.meta.checksum`) puis rangé tel
quel dans le snapshot.

Deux conséquences :

1. **Il est identique pour toutes les versions** tant que le référentiel ne bouge pas. Sur l'exemple
   de la maquette, v1 et v2 portent le même `checksum` alors que leurs chiffres diffèrent de 80 000.
2. **Rien ne permet de prouver qu'un snapshot n'a pas été altéré** après coup. L'immuabilité repose
   aujourd'hui sur l'absence d'`updateOne`/`deleteOne` dans le repository — une propriété du **code**,
   pas de la **donnée**. C'est précisément ce que la story FR-015 vend, et c'est le seul point où
   elle ne peut pas se défendre.

Le nom du champ est un piège de lecture à lui seul : tout front l'affichera comme une empreinte de
version.

## Critères d'acceptation

- [ ] AC-1 — Le snapshot gagne `empreinte: string` — sha256 d'une sérialisation **canonique**
      (clés triées, nombres entiers, pas d'espaces) de `{ liasse, soldesN, soldesN1, referentiel,
      moteurVersion, exercice, version }`.
- [ ] AC-2 — `checksum` est **renommé** `referentielChecksum` dans le DTO (l'ancien nom reste servi
      une version, marqué `@deprecated`) : un nom qui ment coûte plus cher que la migration.
- [ ] AC-3 — `GET …/versions/:version` recalcule l'empreinte à la lecture et refuse
      (`500 SNAPSHOT_ALTERE`) si elle ne correspond pas — une immuabilité qui ne se vérifie jamais
      n'est qu'une intention.
- [ ] AC-4 — La sérialisation canonique est **testée pour sa stabilité** : même entrée, ordre de
      clés différent, même empreinte.
- [ ] AC-5 — Les snapshots antérieurs n'ont pas d'empreinte : `empreinte: null` et **aucune
      vérification**, jamais un refus rétroactif.

## Conséquences ailleurs

- Nécessaire à **STORY-446** : un accusé de dépôt doit pouvoir citer l'empreinte de la version
  déposée.
- Utile à **STORY-442** : le `contexte` d'un export cite déjà une « empreinte » — laquelle ?
