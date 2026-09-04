# STORY-452 : Le snapshot n'a pas d'empreinte de son propre contenu — le champ `checksum` est celui du paquet référentiel

Status: in_progress

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service`
**Points :** 3 · **Complexité :** medium · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
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

---

## Progress Tracking

**Statut : `in_progress`** — développement et portes de qualité passés le 2026-09-04, branches
créées **avant** la première ligne de code :

```
docs             MNV-452
bilan-service    MNV-452
```

### Ce qui est livré

- **AC-1** — `empreinte` sur le snapshot : sha256 de la sérialisation **canonique** des sept champs
  scellés (`liasse`, `soldesN`, `soldesN1`, `referentiel`, `moteurVersion`, `exercice`, `version`),
  calculée **dans la transaction de validation** — `version` en fait partie et n'est connue que là.
- **AC-2** — `referentielChecksum` sur `SnapshotSommaireDto` (donc sur les deux réponses de version) ;
  `checksum` reste servi **une version**, marqué `deprecated` au contrat OpenAPI, à la même valeur.
  Le champ **en base** garde son nom : le renommer imposerait une migration d'une collection
  append-only, pour un gain nul — c'est le contrat publié qui mentait.
- **AC-3** — `GET …/versions/{version}` recalcule l'empreinte et refuse en **500 `SNAPSHOT_ALTERE`**.
  Aucun repli sur un recalcul : servir des chiffres sous un badge « version figée » que plus rien
  n'atteste est le mode de panne que l'empreinte existe pour fermer.
- **AC-4** — stabilité prouvée clé par clé et champ par champ (`empreinte-snapshot.spec.ts`).
- **AC-5** — `empreinte: null` sur les versions antérieures, **aucune** vérification, jamais un refus
  rétroactif.

### ⚡ Réutilisation plutôt qu'un second canoniseur

`empreinteSnapshot` s'appuie sur `empreinteDocument` (STORY-073) au lieu de réécrire une
sérialisation canonique. Deux implémentations de « canonique » finissent par diverger, et c'est la
seule chose qui ne doit jamais arriver à une empreinte.

### ⛔⛔ Le défaut trouvé pendant le dev : Mongoose supprime les objets vides, et cela aurait rendu 500 sur une liasse SAINE

`minimize` est **actif par défaut** : Mongoose retire les objets vides (`{}`) des champs `Mixed` au
moment d'écrire, récursivement, y compris dans les éléments d'un tableau. Une liasse portant un `{}`
était donc **relue sans lui** ; l'empreinte recalculée différait de celle scellée, et
`GET …/versions/{version}` aurait rendu **500 `SNAPSHOT_ALTERE` sur une version parfaitement saine**.
Une garde d'intégrité qui accuse le document honnête rend le livrable comptable inconsultable —
c'est pire que pas de garde.

**Ce n'est pas théorique, c'est mesuré** : sous **SFD-BCEAO 2.0**, la liasse produite porte
`tft.renvois: {}`. Le paquet SYSCOHADA, lui, n'en produit aucun — donc **toute la batterie de tests
et la vérification docker seraient passées au vert**, et le défaut ne serait apparu qu'en production,
sur les dossiers d'un autre référentiel.

Correctif : `@Schema({ collection: 'snapshots_liasse', minimize: false })`, gardé par
`snapshot-liasse.schema.spec.ts` sur le **vrai** schéma. Mutation vérifiée : retirer l'option fait
rougir ce test, et **rien d'autre** — ni la compilation, ni le lint, ni les 1 790 autres unitaires.

### 🪝 Hooks inertes documentés (hors périmètre, nommés)

- **La vérification ne couvre que `GET …/versions/{version}`**, seule route nommée par l'AC-3.
  `GET :id` (liasse figée la plus récente, STORY-449), `GET …/versions/comparaison` (STORY-448),
  l'export et la comparaison d'exercices lisent aussi des snapshots **sans** vérifier. L'étendre est
  mécanique — il suffit d'appeler `exigerEmpreinteIntacte` — mais élargit le rayon d'un 500 : à
  cadrer par une story.
- **`complements` n'est pas dans le scellé** : l'AC-1 énumère sept champs, et son effet est déjà
  contenu dans `liasse`, qui est scellée. Altérer `complements` ne change donc rien de ce qui est
  servi, mais casserait la reproductibilité d'un rejeu. L'inclure **romprait** la comparabilité avec
  les empreintes scellées par cette story.
- **`ConsultationVersionSommaireDto.checksum`** (`GET …/consultation/…`) porte le **même** piège de
  nommage, sur une liste de versions. L'AC-2 ne nomme que `SnapshotSommaireDto` ; ce jumeau reste à
  renommer.

### Portes de qualité (2026-09-04)

| Porte | Résultat |
|---|---|
| lint | 0 warning |
| build | OK |
| unitaires | 1 790 passés, 136 suites |
| couverture | 98,83 % branches · 94,08 % fonctions · 98,78 % lignes · 98,85 % statements (seuils 65/90/90/90) |
| e2e | 498 passés, 22 suites |
| `empreinte-snapshot.ts` | 100 % sur les quatre axes |

### ⚠️ Vérification docker — persistance réelle (stack neuve, `docker compose down -v`)

Tenant réel amorcé (register → e-mail vérifié → login), read-models `orgkycstatuses`,
`orgbilanentitlements`, `dossiers_dossier`, `exercices_dossier`, `balances_balance` semés.
Parcours : créer → **valider (v1)** → rouvrir → recalculer (+80 000) → **valider (v2)**.

`bilan_service.snapshots_liasse`, `jeuEtatsId = 6a9abdcc9d4526b9f54fc88f` : **2 documents**.

| Constat | Mesure |
|---|---|
| `empreinte` écrite, v1 et v2 | `dca1bcfd521f47f7…` / `3f6e8b7428aaae9f…`, 64 caractères |
| `checksum` v1 == `checksum` v2 | **`true`** — le défaut que la story ferme |
| `empreinte` v1 == `empreinte` v2 | **`false`** |
| chiffres réellement différents | `totalActifN` 1 800 000 (v1) vs 1 880 000 (v2) |
| round-trip Mongo → HTTP | `GET …/versions/1` et `/2` → **200** : l'empreinte recalculée sur ce que Mongo tient est bien celle scellée |
| contrat servi | `referentielChecksum` = `checksum` = `e9e22c979a5be93d…`, `empreinte` distincte |
| **AC-3** — `updateOne` direct en base sur `liasse.bilan.controle.totalActifN` | `GET …/versions/1` → **500 `SNAPSHOT_ALTERE`** |
| le refus vise UN document, pas la route | `GET …/versions/2` (intacte) → **200** |
| **AC-5** — `$unset: {empreinte}` (snapshot antérieur à la story) sur le contenu **toujours altéré** | `GET …/versions/1` → **200**, `empreinte: null` |

⚠️ **Les écritures `mongosh` ci-dessus sont l'objet même du test** : elles rejouent l'altération
directe en base que le repository interdit et que la story existe pour détecter. Base de
vérification jetable, jamais un environnement partagé.

⚠️ **Atomicité — rien de neuf à prouver ici** : `empreinte` est un champ de plus sur l'écriture
transactionnelle existante (snapshot + bascule du jeu + événement `liasse.etat.change`, STORY-065).
Cette story n'introduit **aucun** nouveau chemin d'écriture multi-documents.

⚠️ **Angle mort déclaré** : une stack neuve ne contient que des snapshots **postérieurs** à la story.
Le cas AC-5 a donc été rejoué en retirant l'empreinte d'un document réel — c'est la seule façon
d'éprouver le refus rétroactif sur cette base.
