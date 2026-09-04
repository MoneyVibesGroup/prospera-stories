# STORY-452 : Le snapshot n'a pas d'empreinte de son propre contenu — le champ `checksum` est celui du paquet référentiel

Status: done

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

**Statut : `done`** — PR `bilan-service` **#84** (3 commits) rebase-mergée sur `dev` le
2026-09-04. Revue de code + revue de sécurité + **vérification docker rejouée sur l'état final**.

Branches créées **avant** la première ligne de code :

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
- **DEUX jumeaux de nommage restent à traiter**, pas un seul (constat de revue de code — mon
  inventaire initial n'en nommait qu'un) : `ConsultationVersionSommaireDto.checksum`
  (`consultation/dto/consultation-detail.dto.ts`) **et** `ExerciceCompareDto.checksum`
  (`comparaison-exercices/dto/comparaison-exercices-response.dto.ts`), ce dernier alimenté par
  `checksum: s.checksum` d'un **snapshot** et publié à côté de `snapshotId` et `version`, avec un
  `@ApiProperty` **nu, sans description**. Les deux publient la valeur du paquet de référentiel sous
  un nom qui se lit « signature de cette version » — le piège exact que l'AC-2 ferme, sur une surface
  que l'AC-2 ne nomme pas. Une story qui se fierait au hook initial n'en traiterait qu'une sur deux.

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

### ⑥ Revue de code — 4 constats, aucun bloquant, tous corrigés

⛔⛔ **L'e2e des empreintes ne mesurait que le NUMÉRO de version.** `figerDeuxVersions` enchaînait
`valider → rouvrir → valider` **sans recalculer** : v1 et v2 scellaient un contenu rigoureusement
identique sauf `version`. L'assertion « les deux empreintes diffèrent » était donc portée à 100 % par
le numéro de version — **mesuré** : en retirant `version` du scellé, les deux empreintes redevenaient
égales. Un moteur devenu insensible aux **chiffres** passait cet e2e au vert, alors que son docstring
affirmait déjà rejouer le scénario FE-034 (80 000 d'écart, même `checksum`). Le docstring était faux
avant le code. Correctif : un `recalculer` de +80 000 des deux côtés entre les deux `valider`, plus
une assertion de **non-vacuité** sur `totalActifN`. Vérifié après correctif : l'e2e **reste vert** sans
`version` dans le scellé — il mesure bien le contenu.

Trois autres, corrigés :

- le **500 `SNAPSHOT_ALTERE` n'était publié sur aucune route** : le code existait dans l'énumération
  sans être rattaché à un statut, alors que le précédent `LIASSE_FIGEE_INTROUVABLE` est 400 lignes
  plus haut dans le même fichier. `@ApiOperation` + `@ApiInternalServerErrorResponse` ajoutés ;
- **deux blocs de documentation détachés de ce qu'ils documentent** : mon test STORY-452 s'était
  inséré **entre** la docstring STORY-449 et son `it`, et la note `minimize` entre la docstring de
  classe de `SnapshotLiasse` et le `export class` ;
- l'**inventaire des jumeaux de `checksum`** était incomplet (voir les hooks ci-dessus).

### ⑦ Revue de sécurité — 3 constats, aucun exploitable par un appelant HTTP

Tous de la même famille : **le mécanisme livré est plus étroit que ce que mes propres commentaires
affirmaient**. L'adversaire est celui qui écrit dans `snapshots_liasse` par un autre chemin que le
repository — précisément celui que la story nomme.

⛔⛔ **Le schéma affirmait « une propriété de la DONNÉE, vérifiable SANS FAIRE CONFIANCE AU CODE »,
opposable « à qui a pu écrire dans la collection par un autre chemin ». C'est faux.** L'empreinte est
un **sha256 nu, sans clé**, écrit dans le **même document** que ce qu'il scelle, par un algorithme
déterministe dont le code est dans le dépôt. Qui peut écrire ici maquille les chiffres **et**
recalcule le sceau — ou, moins cher encore, écrit `empreinte: null`, que l'AC-5 impose de lire comme
« version antérieure à la story » et donc de **ne pas** vérifier. Ce qu'elle atteste réellement :
l'altération **accidentelle ou non avertie** (corruption, bug, `updateOne` d'un opérateur), ce que
l'invariant d'immuabilité n'avait jamais eu.

Le troisième constat porte sur la **portée du scellé** : les sept champs de l'AC-1 couvrent le
contenu, mais la même réponse sert **hors sceau** le validateur (`validePar`, `valideAt`) et la
provenance de balance (`balanceId`, `balanceVersion`, `balanceChecksum`). Antidater une validation ou
la réattribuer à un autre collaborateur ne déclenche donc **pas** `SNAPSHOT_ALTERE` — sur le document
même que la story vend comme opposable.

**Correctif retenu : publier la portée exacte, pas élargir le mécanisme.** `MENTION_PORTEE_DE_L_EMPREINTE`
reprend le patron de `MENTION_PORTEE_DU_SCEAU` (STORY-381), au même endroit et pour la même raison :
*une garantie d'intégrité surévaluée est un défaut de sécurité en soi*. Elle est servie dans la
description Swagger d'`empreinte` et sur la route, et **gardée au contrat** — mutation vérifiée, la
déplacer sur un autre champ fait rougir l'e2e de contrat, build vert. Les rédactions du schéma et
d'`empreinte-snapshot` sont corrigées.

🪝 **Ce qui est renvoyé à une story dédiée, et pourquoi** : rendre l'empreinte opposable à un tiers
disposant de l'accès en écriture exige un **HMAC** (clé détenue par le service, env validée) ou la
publication du sceau vers un **témoin externe** — un secret à gérer et un contrat de plus. Borner le
fail-open de l'AC-5 par une date de déploiement demande une variable d'environnement que l'AC ne
prévoit pas, et aucun discriminateur **stocké dans le document** ne peut aider : l'attaquant contrôle
le document entier. Étendre le scellé au validateur et à la provenance rendrait par ailleurs
incomparables les empreintes déjà scellées — cela demande un `empreinteVersion` explicite.

### ⑧ Vérification docker REJOUÉE sur l'état final

Les correctifs ⑥/⑦ n'ont touché que des descriptions Swagger, des commentaires et des tests — jamais
le calcul scellé ni le schéma persisté. La vérification a néanmoins été rejouée après
`docker restart`, sur le code final.
Parcours rejoué sur un second jeu (exercice 2024), après `docker restart` sur le code final :

| Constat | Mesure |
|---|---|
| version scellée servie | `GET …/versions/1` → **200**, `empreinte` `73dbb30fa8e2e48c…` (64 caractères) |
| empreinte réellement persistée | identique en base ; `checksum` du paquet `e9e22c979a5be93d…`, distinct |
| altération directe en base (`updateOne` sur `totalActifN`) | **500 `SNAPSHOT_ALTERE`** |
| `$unset empreinte` sur le contenu toujours altéré (AC-5) | **200**, `empreinte: null` |
| la **portée** est publiée dans le contrat **servi** (`/api/docs-json`) | `n'atteste PAS` ✓ · `ne protège pas` ✓ · `hors sceau` ✓ |

⚠️ Le dernier contrôle vise le document OpenAPI **réellement servi**, pas la constante dans le code :
c'est la seule façon de vérifier que la mention de portée atteint le client.
