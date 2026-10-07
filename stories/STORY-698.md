# STORY-698 : Dans un groupe multi-devise, l elimination fiscale envoie un ecart de change en reserves

Status: done

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

- [x] AC-1 — Cadrer la conversion de l'élimination fiscale (cours de chaque composante, sort de l'écart)
      en cohérence avec STORY-547.
- [x] AC-2 — Le scénario chiffré ne produit aucune ligne de réserves ; un cumul pluri-annuel converti
      revient à un résiduel nul après élimination.
- [x] AC-3 — Tests combinant écriture fiscale et conversion (aucun n'existe aujourd'hui) ; mutation rouge.

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
- **D-698-5 (revue de code) — « déjà porté » se lit sur TOUT compte qui n'est ni reconnu ni le compte
  d'écart**, jamais sur le seul compte de réserves en vigueur : un groupe qui change de compte de réserves
  d'un exercice à l'autre laisse l'ancienne ligne sur l'ancien compte (`reprendre` recopie le bilan tel
  quel) — mesurée sur le seul compte du moment, la part antérieure était portée deux fois et l'écart
  compensait en silence (trois scans concordants, confiance 80).
- **D-698-6 (revue de code) — la part antérieure exige un cours HISTORIQUE pour le compte de réserves.**
  Les réserves sont des capitaux propres : STORY-547 refuse tout compte de capitaux propres mouvementé non
  couvert par un cours historique (`COURS_HISTORIQUE_MANQUANT`) ; la contre-passation le mouvemente. Sans
  racine historique qui le couvre, pas de proposition : raison `COURS_HISTORIQUE_RESERVES_MANQUANT` —
  jamais une conversion au cours de clôture qui ferait dériver les réserves chaque année.
- **D-698-4 — Sans effet hors conversion** : la mère et toute société de la devise du groupe gardent la
  proposition de STORY-685 à l'identique (XOF/XAF).

**Conséquence assumée de D-698-1/2** : sous la méthode `COURS_DE_CLOTURE` (écart en capitaux propres), la
proposition d'un exercice ramène en réserves, au cours des réserves, l'écart de conversion que l'élimination
d'une dotation passée avait laissé au compte d'écart — la liasse entière reconvertie. Sans nouveau mouvement
fiscal, aucune proposition n'est faite et cet écart reste en place.

**Limite connue** : un compte d'écart de conversion CHANGÉ entre deux exercices laisse l'ancien écart reporté
lu comme réserves (D-698-5) — même famille de risque que 547, qui fige le compte d'écart par déclaration.

**Hors périmètre** : l'impôt différé d'une écriture fiscale dont une ligne porte l'écart de conversion
(l'effet d'impôt reste celui déclaré à la confirmation) ; les écritures fiscales DÉCLARÉES (non proposées)
d'une société convertie, saisies telles quelles par le cabinet.

## Notes

- Voir [[STORY-685]], [[STORY-547]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-10-02).** Créée à la clôture de STORY-685.

**Statut : `in_progress` (2026-10-07).** Décisions D-698-1 à D-698-4 posées ; branche `MNV-698` (bilan-service).

**Statut : `done` (2026-10-07).** bilan-service#164 rebase-mergée sur `dev` (`571d1c5`, revue `5e34a62`).

- **AC-1** — D-698-1 à D-698-6 : la liasse locale éliminée se reconvertit par la règle de 547 ; part
  antérieure en devise de la société, au cours HISTORIQUE du compte de réserves, moins les réserves déjà
  portées par les reports (sur tout compte) ; le reste au compte d'écart de la société.
  `convertirAuCoursHistorique` vit dans `conversion.regles.ts` (invariant STORY-490 : aucune conversion
  hors de ce module — attrapé par la couverture complète, qui l'avait vu rouge).
- **AC-2** — scénario chiffré (GNF, 151 C 700 / 851 D 700, historique 100, moyen 95) :
  `Dr 151 70 000 / Cr 851 66 500 / Cr écart 3 500`, aucune ligne de réserves, même sans compte de
  réserves ; cumul N → N+1 (historique de la provision 100 → 98) : réserves = 1 000 × 100, résiduel nul
  après confirmation, `ELIMINEE`.
- **AC-3** — `ecritures-fiscales-conversion.regles.spec.ts` (conversion 547 RÉELLE, balayage de 300 filiales
  à oracle indépendant) + 5 tests de service. **Mutation : 9/9 rouges** (conversions non transmises à
  l'agrégat / à la confirmation, reports oubliés, mauvais cours, écart en réserves, garde du compte d'écart,
  déjà-porté sur le seul compte en vigueur, clôture sans historique, confirmation sans reports).
- **Portes** (`2012987`) : lint 0, build OK, `test:cov` exit 0 (99,43 / 97,08 / 99,58 / 99,52), e2e 3 289.
- **Vérif docker** (stack neuve, `tmp/verif-docker-698/`) : 222 OK / 0 KO, rejouée sur l'état final après
  la revue. Proposition et écriture confirmée lues en base (`151000 D 7 000 000 / 851000 C 6 650 000 /
  107900 C 350 000`, aucune ligne `118000`), `ELIMINEE` ensuite, 409 `COMPTE_ECART_CONVERSION_INVALIDE`
  sans orphelin, non-régression XOF. Écritures directes en base : devise des snapshots GNF (comme 547) ;
  une version des méthodes du groupe sans compte de réserves (inatteignable par l'API : le DTO l'exige).
- **Revue de code** : 2 constats retenus et corrigés (D-698-5, D-698-6), doc Swagger ; écartés : écart
  reclassé en réserves au gré des propositions (conséquence assumée, ci-dessus), racines de gestion mère
  vs société (supprimées du type). **Revue de sécurité** : 0 constat.
