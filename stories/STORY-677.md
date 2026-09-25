# STORY-677 : Octroyer `syscohada-revise@2.2` — le paquet des 44 feuilles de notes n'est servi à personne

Status: in_progress

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

- [ ] AC-1 — Les deux packs SYSCOHADA citent `syscohada-revise@2.2` ; la transcription
      `referentiels-packages.snapshot.ts` connaît `@2.2` (relevée sur le manifeste de `bilan-service`,
      datée) ; `referentiels-cites.spec.ts` reste vert.
- [ ] AC-2 — `balance-service` embarque `syscohada-revise-2.2.json` **à l'octet** (même sha256 que
      `bilan-service`, garde de byte-identité comme pour `@2.1`) et son pont `SN` résout `@2.2`.
      `@2.1` reste au manifeste de `balance-service` (octrois existants).
- [ ] AC-3 — Vérification docker, stack neuve, voie réelle : une organisation qui reçoit le pack
      (octroi `bilan` en `@2.2`) **et** une habilitation `balance` en `@2.2` — ⚠️ octroyée **à part** :
      les packs n'ont pas de module `balance` (écart connu `GAP-packs-verticaux-sans-module-balance`,
      constat de revue) — voit sa balance se valider et sa liasse sortir 43 notes ; une organisation
      restée en `@2.1` n'est pas affectée ; une organisation mixte (`bilan@2.2` / `balance@2.1`) est
      servie sans erreur (les 5 comptes ajoutés en `@2.2` sont déposables sous `@2.1`).
- [ ] AC-4 — Mutation : remettre le pont `SN` sur `@2.1` fait rougir le test du pont ; retirer
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

**Statut : `in_progress` (2026-09-25).** Branches `MNV-677` : `prospera-platform-catalog-service` et `prospera-balance-service` (base `dev`), `docs` (base `main`). Partie catalogue committée (`026a474`).
