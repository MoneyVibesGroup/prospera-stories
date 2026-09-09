# STORY-488 : `CIMA` est un axe que le dossier accepte et que le contrat canonique de balance ne connaît pas — le vertical assurance est fermé par une énumération

Status: in_progress

**Épic :** EPIC-106 — Socle multi-référentiel (habilitation, résolution, refus)
**Service :** `balance-service` (`:3007`) — `types/balance-canonique.ts`, `modules/referentiel`
**Points :** 5 → **2 requalifiés** · **Complexité :** medium · **Sprint :** S20
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

---

## ⛔⛔ Requalification (2026-09-09) — le tableau fondateur est FAUX dans ses DEUX colonnes

La fiche pose que `axes.systemeComptable` accepte `CIMA` et que `REFERENTIELS_BALANCE` l'ignore.
**Les deux affirmations sont fausses, et elles l'étaient le jour de la rédaction.** Mesuré :

| Où | Ce que la fiche annonce | **La valeur réelle** |
|---|---|---|
| `REFERENTIELS_BALANCE` | `SN` · `SMT` · `SFD-BCEAO` | ⛔ **contient déjà `CIMA`** |
| `axes.systemeComptable` | `SN` · `SMT` · `SFD-BCEAO` · **`CIMA`** | ⛔ **`SN` · `SMT` seulement** |

⚡⚡ **STORY-292 porte exactement le titre de cette story** — « le référentiel CIMA est attribuable
par la console mais inconnu de la balance : l'ajouter au manifeste ET au contrat canonique » — et
elle est **`done` depuis le 2026-08-10**, soit **dix-sept jours avant** que cette fiche ne soit
écrite. Elle n'est citée nulle part ici.

⛔ **Le mécanisme est plus grave qu'une simple péremption** : le fait a été relevé « en confrontant
deux énumérations » **sans lire la valeur réelle d'aucune des deux**. Le `500 REFERENTIEL_UNAVAILABLE`
que la fiche décrit est fermé depuis STORY-292.

### Verdict critère par critère

| | Verdict | Preuve |
|---|---|---|
| AC-1 | **livré à moitié** | la constante contient `CIMA` ; la garde inter-dépôts, elle, n'existe pas |
| AC-2 | **DÉJÀ LIVRÉ** | empreintes SHA-256 identiques entre les deux dépôts, vérifiées |
| AC-3 | **livré à moitié** | prouvé en docker côté balance par STORY-292 ; le bout en bout traversant les deux services ne l'est pas |
| AC-4 | ⚡ **À LIVRER — le seul** | `meta` ne porte que `code`, `version`, `libelle`, `date` |
| AC-5 | **DÉJÀ LIVRÉ** | STORY-369 ; le doublement de base imposable est rejoué nommément en test |

### Ce que cette story livre donc réellement

**AC-4 seul**, et il vaut le déplacement : le caractère d'**amorce** du paquet CIMA ne vit
aujourd'hui que dans un **commentaire de code non publié**. Un assureur qui bâtit sur ce référentiel
ne peut lire nulle part qu'il s'agit d'une proposition structurelle à valider par un actuaire.

⇒ **le statut entre au contrat**, sur le patron du paquet fiscal, qui porte déjà un `statut` sourcé.

### ⚠️ Ce que cette story NE livre PAS, et qui est le vrai sujet

Le vertical assurance est bloqué **en amont**, dans `dossier-service` : `SystemeComptable` ne connaît
que `SN` et `SMT`, donc **aucun dossier ne peut être créé en CIMA**. Les fixtures e2e qui « prouvent »
CIMA écrivent l'axe **directement dans le read-model**, court-circuitant le producteur.

⛔ Développer cela sous cette fiche produirait un livrable **inutilisable**, exactement comme
STORY-438. C'est une story neuve, en amont, et elle touche `dossier-service` plus un contrat
d'événement — donc au moins deux dépôts de plus.

## Arbitrages de cadrage

### D-488-1 — le statut est un champ d'ARTEFACT, pas un commentaire de registre

Le porter dans `meta` plutôt que dans le manifeste du service : c'est le paquet qui est une amorce,
pas son enregistrement. Les deux dépôts qui le servent le publient alors **sans se concerter**, et un
paquet recopié à l'octet emporte son statut avec lui.

### D-488-2 — DEUX dépôts, et l'ordre compte

Modifier `meta` régénère `cima-assurances-1.0.json`, donc son empreinte. L'artefact est recopié **à
l'octet** dans `balance-service`, dont la garde lit l'arbre du voisin. Les deux PR s'intègrent
**ensemble**, `bilan-service` d'abord.

### D-488-3 — champ FACULTATIF, pour que les paquets muets restent byte-identiques

`statut?` et non `statut` : seul CIMA le déclare. Les quatre autres artefacts ne doivent pas changer
d'un octet — sinon cette story de deux points en devient une de checksum sur cinq paquets.
