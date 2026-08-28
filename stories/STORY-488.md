# STORY-488 : `CIMA` est un axe que le dossier accepte et que le contrat canonique de balance ne connaît pas — le vertical assurance est fermé par une énumération

Status: ready-for-dev

**Épic :** EPIC-106 — Socle multi-référentiel (habilitation, résolution, refus)
**Service :** `balance-service` (`:3007`) — `types/balance-canonique.ts`, `modules/referentiel`
**Points :** 5 · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — relevé en confrontant les deux énumérations, pas en lisant l'une des deux.

---

## Le fait

Deux listes fermées coexistent, et elles ne contiennent pas la même chose :

| Où | Liste |
|---|---|
| `axes.systemeComptable` (dossier, STORY-303) | `SN` · `SMT` · `SFD-BCEAO` · **`CIMA`** |
| `REFERENTIELS_BALANCE` (contrat canonique, STORY-101) | `SN` · `SMT` · `SFD-BCEAO` |

Un dossier peut donc **légalement** déclarer l'axe `CIMA` — le produit le propose : le type de client
« Assurance » existe à l'assistant de création — et **aucune balance ne peut en sortir**. Le
référentiel `cima-assurances@1.0` **existe pourtant, packagé, côté `bilan-service`** (STORY-122).

⛔ **Le résultat servi n'est pas un refus métier, c'est un `500 REFERENTIEL_UNAVAILABLE`.** Un 500 se
lit « le produit est cassé », pas « ce secteur n'est pas encore ouvert ». Le premier assureur qui
essaie ne fait pas la différence, et il a raison de ne pas la faire.

## Pourquoi c'est plus qu'une ligne à ajouter

Le vertical `assurance` est **promis** : il figure aux cinq secteurs que la console sait
provisionner, il a son type de client, son plan sourcé (art. 431 du code CIMA), son bilan et son
compte de résultat technique. Ce qui manque est **une ligne d'énumération et une entrée de
manifeste** — c'est-à-dire précisément le genre d'écart qui reste ouvert des mois parce qu'il n'a
l'air de rien.

## Critères d'acceptation

- [ ] AC-1 — `REFERENTIELS_BALANCE` accueille `CIMA`. Les deux énumérations sont **dérivées d'une
      source unique** ou gardées par un test qui compare les deux et vire au rouge à la divergence
      suivante — 4ᵉ occurrence du patron « valide contre une liste qu'il ne publie pas » (après
      394, 397, 414) : le sujet n'est plus le champ, c'est la **DoD du module**.
- [ ] AC-2 — `cima-assurances@1.0` entre au **manifeste de `balance-service`**, avec son checksum,
      byte-identique à l'artefact servi par `bilan-service` (règle STORY-368/AD-6).
- [ ] AC-3 — Une balance de dossier `CIMA` se construit, se valide contre le **plan CIMA**, et
      produit une liasse CIMA de bout en bout. Test d'intégration en docker, sur stack neuve.
- [ ] AC-4 — ⚠️ **Le statut « amorce, à valider par un actuaire » reste PUBLIÉ** et visible au
      contrat (`_meta.statut`). Ouvrir le vertical ne transforme pas une proposition structurelle
      en donnée réglementaire certifiée. Un assureur doit lire ce statut avant de s'appuyer dessus.
- [ ] AC-5 — Le piège de la **classe 8 CIMA** est gardé : elle mêle comptes de gestion et comptes de
      **regroupement**, et le repli générique doublait exactement la base imposable sans qu'aucun
      contrôle ne s'en aperçoive. Un test le rejoue et exige le montant simple.

## Conséquences ailleurs

- Ferme le `500` que la maquette affiche aujourd'hui au secteur Assurance.
- **Ne ferme pas** le vertical assurance : les provisions techniques, le résultat technique
  vie/non-vie et les états annexes C1..C25 restent hors périmètre — voir
  `epics-assurance-2026-08-27.md`. Cette story rend la **balance** possible, pas la compagnie.

## Notes

- Voir [[STORY-122]], [[STORY-101]], [[STORY-303]], `epics-assurance-2026-08-27.md`.
