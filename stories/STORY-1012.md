# STORY-1012 : le matériel automobile, vétusté sur pièces selon l'âge, et épave

Status: done

**Complexité :** moyenne (une grille datée figée par empreinte, une décision de véhicule, trois variantes de vétusté, un adaptateur du formulaire)

**Épic :** EPIC-207 (instruire le dossier)
**Dépôt :** `prospera-sinistres-service` (module `sinistres`, dossier `decompte/`) ; aucune route, aucun fait, aucun manifeste
**Plage :** groupe C, n° 9 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1010 (le décompte et son point d'insertion, D-1010-9).
Ancrage : FR-72 (matériel automobile : vétusté sur pièces selon l'âge, épave, RC seule), FR-69 (l'ordre fixe), FR-75 (la version de la grille se garde avec l'évaluation arrêtée : STORY-1013).

---

## Pourquoi

Le décompte de 1010 sait enchaîner dommage, vétusté, règle proportionnelle, plafond, franchise, mais sa vétusté n'est qu'un
pourcentage saisi : pour un véhicule, elle dépend de l'âge, ne porte que sur les pièces, et un véhicule dont la remise en état
dépasse la valeur vénale n'est plus réparé mais indemnisé comme une épave. Sans cela, le matériel automobile (le parcours
n° 1 de la démo, UJ-3) se décompterait faux. 1010 l'avait renvoyé à cette story (`VETUSTE_PAR_AGE_ET_EPAVE_A_VENIR`) plutôt que
de rendre un chiffre sans vétusté par âge.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **La grille de vétusté est un paramètre daté, par âge et par catégorie de pièce, figé par empreinte** : `vetuste-automobile-2026.1.json` (jusqu'à 1 an 0 %, 2 ans 10 %, 3 ans 20 %, 5 ans 30 %, 8 ans 40 %, au-delà 50 %, bornes comprises) ; `tableDeVetusteEnVigueur(dateDeSurvenance)` ; une grille invalide est refusée | tests purs (empreinte, bornes, date, paliers désordonnés) |
| AC-2 | ⛔ **La vétusté ne porte que sur les pièces** : un véhicule de 4 ans a 30 % sur les pièces et 0 % sur la main-d'œuvre ; une ligne par catégorie de pièces, puis la main-d'œuvre, chacune avec son pourcentage et sa source | tests purs ; mutation (vétusté sur la main-d'œuvre) |
| AC-3 | ⛔ **L'épave est décidée à l'étape du dommage** : pièces + main-d'œuvre **strictement** supérieures à la valeur vénale ⇒ épave, dommage = valeur vénale − valeur de l'épave, sans vétusté ; à égalité, réparation ; une décision validée l'emporte ; sans valeur vénale, `A_DECIDER` (calculé en réparation, alerte) | tests purs ; mutation (`>` en `>=`) |
| AC-4 | ⛔ **RC seule avec assuré fautif : zéro et `BLOQUANT`** ; la franchise est nulle en garantie RC | tests purs ; mutation (franchise en RC) |
| AC-5 | ⛔ **Le calcul s'insère dans le décompte de 1010, qui ne bouge pas** : l'ordre des cinq étapes, la table `decompte-2026.1` et son empreinte, les montants de référence (780 000 → 702 000 ; 445 500 → 395 500 ; vol 400 000 → 295 000) restent au franc | tests purs (les 29 de 1010 inchangés) |
| AC-6 | **La branche `VEHICULE` de `entreeDepuisLeFormulaire` lit le formulaire de 1011** (année de mise en circulation, devis pièces et main-d'œuvre, valeur vénale, valeur d'épave, franchise, garantie, assuré fautif) ; sans date de survenance ou sans données, un renvoi nommé, jamais un chiffre faux | tests purs |

## Décisions retenues par défaut (contestables)

- **D-1012-1 — Une table de vétusté distincte, pas `decompte-2026.2`.** D-1010-9 pensait à une table `2026.2` du décompte. Publier
  `2026.2` avec une date d'effet ou bien rétroagit (les sinistres de `2026.1` changent de table, et de `tableVersion`), ou bien
  laisse sans grille les sinistres antérieurs, dont celui de la démo. Une grille à part (`vetuste-automobile-2026.1`, valable depuis
  le 2026-01-01) se date et se remplace seule (la compagnie publie la sienne sans toucher à l'arrondi ni à l'ordre) et laisse
  `decompte-2026.1` intacte à l'octet. Le `Decompte` rend donc `tableVersion` **et** `tableDeVetusteVersion` : STORY-1013 garde les deux.
- **D-1012-2 — Quatre catégories de pièces, une seule grille connue.** `GENERALE` (défaut, celle du formulaire), `CARROSSERIE`,
  `MECANIQUE`, `ELECTRIQUE` : les quatre portent la grille indicative de la démo, le PRD n'en donne qu'une (H-059, A-5 : la grille de la
  compagnie est à obtenir). La structure est celle que la compagnie différenciera ; aucune valeur n'est inventée. Le formulaire de 1011
  ne détaille pas ses pièces (un total `devisPieces`) : il va en `GENERALE`. Une catégorie absente de l'entrée prend la catégorie par défaut.
- **D-1012-3 — L'âge est l'année de la survenance moins l'année de mise en circulation.** Le formulaire ne porte que l'année. « Jusqu'à
  3 ans » compte 3 ans. Un âge négatif (mise en circulation après le sinistre) ou au-delà de 100 ans est refusé (`AGE_INVALIDE`), jamais
  ramené à zéro. Jugé à la date de survenance, jamais à celle du calcul.
- **D-1012-4 — Chaque pourcentage s'arrondit au franc, catégorie par catégorie**, comme 1010 (demi vers le haut, entiers exacts). Le
  pourcentage de la main-d'œuvre est un paramètre de la grille (0), pas une constante du code.
- **D-1012-5 — Le coût de remise en état se compare à la valeur vénale avant vétusté, strictement.** Pièces + main-d'œuvre sans vétusté
  (le coût que le garage facture) contre la valeur vénale ; à égalité, réparation. Épave : dommage = max(0, valeur vénale − valeur de
  l'épave), sans vétusté (la valeur vénale est déjà celle d'un véhicule de cet âge) ; la franchise s'applique ensuite (FR-72).
- **D-1012-6 — Une décision validée l'emporte ; sans valeur vénale, rien ne se compare.** `decisionValidee` (REPARATION ou EPAVE, passée par
  le contexte) prime sur la règle. Sans valeur vénale et sans décision : `A_DECIDER`, calculé en réparation avec l'alerte
  `DECISION_DE_VEHICULE_A_PRENDRE` ; une épave sans valeur d'épave n'est pas décomptée (renvoi `DONNEES_DU_VEHICULE_INCOMPLETES`), jamais
  zéro par défaut. **Non livré ici** : la commande qui valide la décision, la cession de l'épave et l'enregistrement de son produit comme
  récupération (FR-72) : elles écrivent sur le dossier, ce que cette story (une fonction pure) ne fait pas.
- **D-1012-7 — RC seule avec assuré fautif : le dommage affiché reste celui du devis, le montant retenu est zéro.** La ligne `DOMMAGE`
  montre `avant` = devis et `apres` = 0, avec le motif ; alerte `RC_SEULE_ASSURE_FAUTIF` de niveau `BLOQUANT` (nouveau niveau du décompte).
  La franchise est nulle en garantie RC (FR-72), fautif ou non.
- **D-1012-8 — Le chiffre « 775 000 » de la démo n'est pas reproduit.** C'est le « calcul d'instruction technique » de `SIN-2026-9002`
  (repère jamais utilisé : le montant arrêté est 445 500). Ses entrées (pièces, main-d'œuvre, vétusté, valeur vénale) ne sont dans aucun
  extrait (`extract-code-demo.md`, `extract-parcours-demo.md`) ni dans le jeu du LC fictif (`generateur.ts` ne donne que devis 1 273 000,
  chiffrage 445 500, franchise, provisions) : en retrouver une combinaison serait l'inventer. Le jeu du LC se retrouve au franc : 445 500,
  franchise 10 % minimum 50 000, **395 500** (le chiffrage de l'expert est déjà net de vétusté : vétusté `NON_APPLICABLE`).
- **D-1012-9 — Le contexte du formulaire est un cinquième paramètre.** `entreeDepuisLeFormulaire(type, famille, valeurs, table, contexte?)` :
  la date de survenance (et la décision validée). Sans lui, la famille `VEHICULE` rend le renvoi `DATE_DE_SURVENANCE_REQUISE`. Le renvoi
  `VETUSTE_PAR_AGE_ET_EPAVE_A_VENIR` disparaît ; une famille inconnue rend `FAMILLE_SANS_DECOMPTE` (elle tombait avant dans la branche du véhicule).
- **D-1012-10 — Franchise du formulaire, pas de plafond.** Le taux et le minimum viennent de `franchisePourcent` et `franchiseMinimale` du
  formulaire ; le plafond de la garantie souscrite (projection d'`assurance`, D4) reste, comme en 1010, ce que la story qui la lira passera à l'entrée.
- **D-1012-11 — Alertes : seulement celles du décompte.** `RC_SEULE_ASSURE_FAUTIF`, `VEHICULE_EPAVE` (information), `DECISION_DE_VEHICULE_A_PRENDRE`.
  Les alertes d'instruction (véhicule de plus de 15 ans, usage taxi, sinistre moins de 30 jours après la souscription, contre-expertise au-delà de
  5 000 000, recours contre l'assureur du tiers : H-046) lisent des champs, pas le décompte : elles restent à écrire.
- **D-1012-12 — Aucune route, aucun fait, aucune pile.** Une fonction pure et un paramètre figé ; le plan dit « Docker : non ».

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#23** (`dev` 1bb2268) :

- `src/modules/sinistres/decompte/` : `vehicule.ts` (grille, âge, `pourcentDeVetuste`, `decisionDeVehicule`, `tableDuJour`),
  `vetuste-automobile-2026.1.json` (empreinte `b0713bd4…`), `decompte.ts` (variantes `PAR_AGE_SUR_PIECES` et `NON_APPLICABLE` de `Vetuste`, exclusion
  RC, niveau `BLOQUANT`, `tableDeVetusteVersion` et `decisionDeVehicule` sur le `Decompte`, branche `VEHICULE` de l'adaptateur),
  `decompte-automobile.spec.ts`. `decompte-2026.1.json` et son empreinte (`d486660f…`) inchangés.
- **Tests** : 33 purs neufs (empreinte, bornes de la grille, date de survenance, 4 ans = 558 000, 1 an, 9 ans, catégories, regroupement, arrondi au
  franc, épave 1 530 000, égalité, décision validée, à décider, RC fautif, franchise nulle en RC, les refus et renvois nommés, montants de 1010 intacts, 395 500).
  Quatre mutations (`>` en `>=`, vétusté sur la main-d'œuvre, palier `<=` en `<`, franchise en RC) : chacune rougit sur l'assertion.
- **Node 24** (étage `verification`, image depuis `git archive`, MongoDB réel en jeu de répliques) : lint 0, 1172 unitaires (58 suites + 1 sautée, `-w 2`),
  25 e2e, build 0. Rejeu depuis l'export d'`origin/dev` 1bb2268 : lint 0, 1172 unitaires, 25 e2e, build 0. Aucune pile (aucun câblage ne change).
- Écart : « 775 000 » non retrouvé (D-1012-8).

**Reste**
- STORY-1013 : arrêter l'évaluation (commande, montant au franc, motif, `tableVersion` **et** `tableDeVetusteVersion` figées), cinq montants distincts.
- La commande qui valide la décision de véhicule, la cession de l'épave (produit enregistré comme récupération), le suivi de la réparation et le
  montant autorisé (`SUPPLEMENT_NON_AUTORISE`), les postes d'un dossier matériel (FR-72, FR-73).
- La grille de la compagnie (A-5, H-059) : une version de plus de `vetuste-automobile`, jamais une modification de la `2026.1`.
- Les alertes d'instruction du véhicule (H-046) ; la route et l'écran « Pourquoi ce montant ? » (FR-74).
