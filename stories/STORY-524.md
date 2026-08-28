# STORY-524 : Marge de solvabilité et représentation des engagements réglementés

Status: ready-for-dev

**Épic :** EPIC-134 — États annuels CIMA et marge de solvabilité
**Service :** `assurance-service`
**Points :** 13 · **Sprint :** S20
**Prérequis :** **STORY-517** (provisions hébergées) · **STORY-520** (réassurance) · **STORY-521** (Vie/Non-Vie)
**Origine :** découpage `epics-assurance-2026-08-27.md`.

---

## Le fait

Deux contrôles réglementaires que le CIMA impose, et qui sont à l'assureur ce que les ratios
prudentiels sont à l'IMF :

1. **La marge de solvabilité** — l'assureur dispose-t-il de fonds propres suffisants au regard de
   son volume d'affaires et de ses engagements ?
2. **La représentation des engagements réglementés** — les provisions techniques sont-elles
   **couvertes par des actifs admis**, dans les limites de dispersion fixées ?

⚡ **Le second est le plus mal compris et le plus structurant :** il ne suffit pas d'avoir provisionné,
il faut que le passif provisionné soit **représenté à l'actif** par des placements que la
réglementation admet, catégorie par catégorie et dans des plafonds. Un assureur peut être
correctement provisionné et **en infraction** sur la représentation.

⇒ C'est aussi ce qui rend `CA1` (*« Valeurs immobilisées — placements et immobilisations »*) du plan
packagé insuffisant en l'état : la représentation exige une **ventilation des placements par
catégorie admise**, que la racine seule ne donne pas.

## Critères d'acceptation

- [ ] AC-1 — Les **exigences, taux et plafonds** viennent d'un artefact **packagé et sourcé** (code
      CIMA, articles), jamais du code. ⛔ Test de mutation : changer un plafond doit changer le
      verdict.
- [ ] AC-2 — La marge de solvabilité est rendue avec **ses deux termes** — marge disponible et marge
      à constituer — et non un seul verdict. Un ratio sans ses termes n'est pas vérifiable à la main.
- [ ] AC-3 — La représentation est rendue **catégorie par catégorie** : engagements à représenter,
      actifs admis, plafond, dépassement. La somme des catégories **égale** le total.
- [ ] AC-4 — Un contrôle **non calculable** (ventilation des placements absente) rend
      `INDETERMINABLE`, **jamais zéro et jamais conforme**. ⚡ 5ᵉ occurrence du patron : un booléen de
      conformité se lit toujours avec son statut.
- [ ] AC-5 — Les provisions consommées sont **nettes de la part des réassureurs** ou **brutes**, selon
      ce que le texte exige — et le choix est **déclaré par l'artefact**, pas décidé par le code. Se
      tromper de base est l'erreur classique, et elle change le verdict.
- [ ] AC-6 — Les deux contrôles se **rejouent** à une date d'arrêté passée, avec la version
      d'artefact qui s'appliquait alors.

## Notes

- Voir [[STORY-510]] (les ratios prudentiels IMF, même forme), [[STORY-517]], [[STORY-520]].
