# STORY-677 : Octroyer `syscohada-revise@2.2` — le paquet des 44 feuilles de notes n'est servi à personne

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `platform-catalog-service` (packs) + `balance-service` (artefact + pont `SN`)
**Points :** 3 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-559 (2026-09-24).
**Prérequis :** **STORY-676** mergée (elle révise les octets de `@2.2` en place, tant qu'il n'est octroyé à personne).
**Débloque :** **STORY-537** en production.

---

## Le fait

STORY-559 a packagé `syscohada-revise@2.2` dans `bilan-service` comme un **bump** : `@2.1` reste servi
à l'octet. Mais le référentiel d'une organisation se lit dans son **habilitation**, jamais « la
dernière version » — et :

| Où | Ce qui cite `@2.1` |
|---|---|
| `platform-catalog-service/src/modules/packs/packs.seed-data.ts` (l. 140, 201) | les **deux packs SYSCOHADA** |
| `platform-catalog-service/src/modules/catalog/referentiels-packages.snapshot.ts` | la transcription des couples packagés (ne connaît pas `@2.2`) |
| `balance-service/src/modules/referentiel/referentiel-registry.ts` (l. 399) | le pont `SN → syscohada-revise@2.1` |

⇒ **Aucune organisation ne reçoit `@2.2`.** Et une organisation habilitée `@2.2` pour la balance serait
refusée par `balance-service`, qui compare le **couple exact** et n'embarque pas l'artefact.

⚡ **Mesuré par la vérification docker de 559** : le catalogue **accepte** d'enregistrer la version
`@2.2` et de l'octroyer par `PUT /catalog/entitlements/:org/bilan` ; l'événement
`entitlement.changed` alimente le read-model de `bilan-service`. La mécanique existe — c'est la
**donnée** qui manque.

## Critères d'acceptation

- [x] AC-1 — Les deux packs SYSCOHADA citent `syscohada-revise@2.2` ; la transcription
      `referentiels-packages.snapshot.ts` connaît `@2.2` (relevée sur le manifeste de `bilan-service`,
      datée) ; `referentiels-cites.spec.ts` reste vert.
- [x] AC-2 — `balance-service` embarque `syscohada-revise-2.2.json` **à l'octet** (même sha256 que
      `bilan-service`, garde de byte-identité comme pour `@2.1`) et son pont `SN` résout `@2.2`.
      `@2.1` reste au manifeste de `balance-service` (octrois existants).
- [x] AC-3 — Vérification docker, stack neuve, voie réelle : une organisation qui reçoit le pack
      (octroi `bilan` en `@2.2`) **et** une habilitation `balance` en `@2.2` — ⚠️ octroyée **à part** :
      les packs n'ont pas de module `balance` (écart connu `GAP-packs-verticaux-sans-module-balance`,
      constat de revue) — voit sa balance se valider et sa liasse sortir 43 notes ; une organisation
      restée en `@2.1` n'est pas affectée ; une organisation mixte (`bilan@2.2` / `balance@2.1`) est
      servie sans erreur (les 5 comptes ajoutés en `@2.2` sont déposables sous `@2.1`).
- [x] AC-4 — Mutation : remettre le pont `SN` sur `@2.1` fait rougir le test du pont ; retirer
      l'artefact `@2.2` de `balance-service` fait rougir la garde de byte-identité.

## Hors périmètre

- **La migration des octrois existants** (organisations déjà en `@2.1`) : souci de prod, différé — le
  dev repart de zéro.
- `packs.front-snapshot.ts` : transcription du **front** — un écart déclaré, pas une correction
  (aucun droit de push sur les dépôts frontend).

## Notes

- Deux dépôts ⇒ deux branches `MNV-677` et deux PR, **intégrées ensemble**.
- Voir [[STORY-559]], [[STORY-676]], [[STORY-537]], [[STORY-533]] (packs à liste de référentiels).

## Progress Tracking

**Statut : `done` (2026-09-25).** PR jumelles rebase-mergées **ensemble** : `prospera-balance-service` **#120** puis `prospera-platform-catalog-service` **#26**. Branches `MNV-677` : `prospera-platform-catalog-service` et `prospera-balance-service` (base `dev`), `docs` (base `main`). Partie catalogue committée (`026a474`).

- 2026-09-24 — ③ catalogue (`026a474`) : packs `distributeur` et `cabinet` → `syscohada-revise@2.2` ;
  écarts au front déclarés (`ECARTS_ASSUMES_AU_FRONT`) ; transcription `referentiels-packages.snapshot.ts`
  : `@2.2` ajouté, `@2.1` gardé (test de coexistence). 5 mutations rouges.
- 2026-09-25 — ③ balance-service (`5e7ebdf`) : artefact `@2.2` recopié **à l'octet** (`08571c9b…`,
  garde de byte-identité) ; **conception** — le pont ne passe PAS simplement à `@2.2` (toute org
  restée `@2.1` aurait été refusée : l'habilitation compare le couple exact) : `SN` porte une **liste
  par préférence** (`['2.2', '2.1']`) et le résolveur sert la première version que l'org **détient**.
  6 mutations rouges (pont en dur `@2.1`, `@2.2` seule, ordre inversé, résolveur qui ne teste que la
  plus récente, artefact retiré, un octet altéré).
- 2026-09-25 — ⑥/⑦ **revues** (scans `opus`, synthèse en session) : sécurité **0 constat** ; code :
  C1 (conf. 85) l'inventaire annonçait `@2.2` à une org `@2.1` — il rend désormais le couple **servi**
  (une seule règle `referentielServiDuTag` pour le résolveur et l'inventaire) + champ `habilite`
  (`155f3dc`) ; C2 (conf. 90) les packs n'ont pas de module `balance` — l'habilitation `balance`
  s'octroie à part : AC-3 précisé.
- 2026-09-25 — ④ **vérification docker sur stack NEUVE**, les deux PR en place : **178 OK, 4 KO**.
  Packs du catalogue en `@2.2` (API + base) ; A (pack) : `bilan` octroyé depuis le référentiel LU dans
  le pack + `balance@2.2` ⇒ read-models `@2.2`, balance VALIDÉE sous `@2.2`, liasse 43 notes,
  `BZ` = `DZ`, snapshot `2.2`/`08571c9b…`, inventaire `@2.2`/`habilite: true` ; B (`@2.1`) non
  affectée ; C mixte (`bilan@2.2`/`balance@2.1`) : balance sous `@2.1` avec `219100`/`249500`, liasse
  `@2.2` sans erreur ; D (sans SYSCOHADA) : nouveau dépôt 409 sans écriture, inventaire `habilite:
  false`. Cloisonnement 404 ×7, 0 orphelin. **Les 4 KO = un seul défaut ANTÉRIEUR** (identique sur
  `dev`) : un **brouillon** déposé avant le retrait de l'habilitation se **valide** (200, outbox,
  projection) — la validation ne revérifie pas le référentiel ⇒ **STORY-679**. La description
  Swagger de `habilite` écrite par 677 promettait le contraire : corrigée (`36b000e`). Scripts :
  `PROSPERA/tmp/verif-docker-677/`.
- 2026-09-25 — portes finales rejouées en session : balance-service lint 0 · build · `test:cov`
  4 702 verts (un 1er passage rouge sur le test de coût de STORY-527 sous une charge de 48, vert seul
  puis en entier à charge normale) · e2e 1 236 ; catalogue lint 0 · build · `test:cov` 743 · e2e 200.
  ⑧ `#120` puis `#26` rebase-mergées.

**Pour la suite :**

- ⛔ **Ticket frontend** (`tickets/TICKET-FRONTEND-packs-syscohada-2-2-story-677.md`) : la console de
  provisioning code en dur `syscohada-revise@2.1` — et `sfd-bceao@1.3`, **inexistant**. Tant qu'il
  n'est pas traité, une organisation créée par la console reçoit `@2.1`.
- **Sur une base déjà semée**, le semis ne réécrit pas un pack (`$setOnInsert`) : un `PATCH` des deux
  packs est nécessaire (le dev repart de zéro ; migration de prod différée).
- STORY-679 (créée) ; STORY-678 (Bilan imprimé déséquilibré validé en `@2.1`) toujours ouverte.
