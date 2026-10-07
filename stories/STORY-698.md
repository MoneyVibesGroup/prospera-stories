# STORY-698 : Dans un groupe multi-devise, l elimination fiscale envoie un ecart de change en reserves

Status: in_progress

**Épic :** EPIC-137
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-685** (élimination des écritures fiscales)
**Origine :** revue de code de STORY-685 (2026-10-02), constat n°2.

---

## Le fait

STORY-547 oblige à convertir le `15` au **cours historique**, alors que le `851` l'est au **cours moyen**.
La proposition de STORY-685 (`ecritures-fiscales.regles.ts`, `proposer`), appliquée aux soldes convertis,
lit le déséquilibre qui en résulte comme « la part des exercices antérieurs » et l'envoie en réserves.

**Scénario chiffré** — fille en GNF : `151 C 700 / 851 D 700` (pure dotation de l'exercice), cours
historique 100, cours moyen 95 ⇒ résiduel `151 = −70 000`, `851 = +66 500` ⇒ proposition
`Dr 151 70 000 / Cr 851 66 500 / Cr réserves 3 500`. Sans compte de réserves : 409
`COMPTE_RESERVES_NON_DECLARE` alors qu'il n'y a aucune part antérieure ; avec : 3 500 en réserves alors
que STORY-547 garde la contrepartie en écart de conversion. Un cumul sur plusieurs exercices ne se
convertit pas à un seul cours historique : le résiduel ne retombe plus à zéro, la société reste
`A_ELIMINER` pour toujours.

Sans effet pour XOF/XAF (parité fixe) ; le cas réel concerne les pays SYSCOHADA à devise flottante
(GNF, CDF).

## Critères d'acceptation

- [ ] AC-1 — Cadrer la conversion de l'élimination fiscale (cours de chaque composante, sort de l'écart)
      en cohérence avec STORY-547.
- [ ] AC-2 — Le scénario chiffré ne produit aucune ligne de réserves ; un cumul pluri-annuel converti
      revient à un résiduel nul après élimination.
- [ ] AC-3 — Tests combinant écriture fiscale et conversion (aucun n'existe aujourd'hui) ; mutation rouge.

## Décisions de cadrage (2026-10-07)

- **D-698-1 — L'élimination d'une société convertie se convertit comme sa liasse.** Une liasse convertie
  par STORY-547 l'est au cours de CHAQUE compte (`tauxDuCompte` : historique de la plus longue racine,
  moyen en gestion, clôture sinon) ; la contre-passation proposée est celle de la liasse locale
  éliminée, reconvertie par la même règle. Les lignes des comptes reconnus restent la contre-passation
  du résiduel converti (aucun changement : le résiduel tombe à zéro par construction).
- **D-698-2 — La part des exercices antérieurs se mesure dans la devise de la SOCIÉTÉ.** Elle vaut la
  somme des soldes locaux des comptes reconnus (`Σ débit − crédit`), convertie au cours du compte de
  réserves du groupe (`tauxDuCompte`), moins ce que les reports des exercices passés ont déjà porté sur
  ce compte pour la société. Une pure dotation de l'exercice n'a AUCUNE part antérieure : ni ligne de
  réserves, ni `COMPTE_RESERVES_NON_DECLARE`.
- **D-698-3 — Le reste est un écart de conversion, au compte d'écart de LA société** (celui que 547 lui
  attribue selon sa méthode, `CAPITAUX_PROPRES` ou `RESULTAT`) : la ligne porte le `dossierId` de la
  société, donc le partage des minoritaires de 544 la traite comme l'écart de conversion de 547
  (`auGroupeSeul`). Un compte d'écart reconnu par les règles fiscales (provision, dotation, reprise) :
  pas de proposition, raison `COMPTE_ECART_CONVERSION_INVALIDE`.
- **D-698-4 — Sans effet hors conversion** : la mère et toute société de la devise du groupe gardent la
  proposition de STORY-685 à l'identique (XOF/XAF).

**Hors périmètre** : l'impôt différé d'une écriture fiscale dont une ligne porte l'écart de conversion
(l'effet d'impôt reste celui déclaré à la confirmation) ; les écritures fiscales DÉCLARÉES (non proposées)
d'une société convertie, saisies telles quelles par le cabinet.

## Notes

- Voir [[STORY-685]], [[STORY-547]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-685.

**Statut : `in_progress` (2026-10-07).** Décisions D-698-1 à D-698-4 posées ; branche `MNV-698` (bilan-service).
