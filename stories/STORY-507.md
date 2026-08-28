# STORY-507 : Le portefeuille publie une BALANCE canonique — pas des écritures

Status: ready-for-dev

**Épic :** EPIC-126 — Articulation portefeuille → balance
**Service :** `microfinance-service` + `balance-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-501** · **STORY-504** · **STORY-489** (la devise au contrat)
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-5** de la spine.

---

## Le fait

C'est la story qui **relie ce vertical au reste du produit**, et sa forme est déjà connue :
`stock-service` a subi exactement la même correction en août. Son PRD promettait de « publier une
valeur de stock » ; vérification faite, `bilan-service` n'ingère que des **soldes de comptes**. Le
module publie donc **une balance**, au contrat canonique.

⇒ **Même conclusion ici, et la règle ne s'inverse pas : une balance n'est pas un journal.** Le
portefeuille publie des **soldes**, avec leur `origine`, leur `checksum` et leur devise. La liasse,
le fiscal et le prévisionnel ne changent pas d'une ligne.

⚠️ `SOURCES_BALANCE` est **fermée à trois**. Elle s'ouvre — et elle s'ouvrira aussi pour `stock`,
`comptabilite` et `assurance` : traiter l'ouverture comme un cas particulier ici coûterait quatre
fois.

## Critères d'acceptation

- [ ] AC-1 — Une nouvelle `origine` au contrat canonique. ⚠️ L'énumération et sa liste publiée sont
      **dérivées d'une source unique** — 5ᵉ occurrence du patron « valide contre une liste qu'il ne
      publie pas ».
- [ ] AC-2 — Les comptes produits viennent du **référentiel du dossier** (`sfd-bceao`), résolus par
      le service, jamais codés. Le module **n'envoie aucun code de référentiel**.
- [ ] AC-3 — La balance porte sa **devise** et son **exposant** (STORY-489), et son `checksum` est
      recalculé et comparé par `balance-service`.
- [ ] AC-4 — Publication **rejouable** : la même date d'arrêté republiée produit une balance
      identique, ou un `200` idempotent — jamais un doublon.
- [ ] AC-5 — ⛔ **La provision de STORY-504 n'entre en balance que si elle a été décidée.** Publier
      une balance qui contient une provision seulement *proposée* contournerait AD-4 par la porte de
      derrière.
- [ ] AC-6 — Vérification en docker, sur stack neuve, jusqu'à la **liasse SFD produite** : c'est le
      seul test qui prouve que la chaîne tient.

## Notes

- Voir la spine `architecture-stock-service-2026-08-15` (AD-7, le patron), [[STORY-101]], [[STORY-489]].
