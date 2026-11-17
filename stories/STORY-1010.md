# STORY-1010 : le décompte dans l'ordre fixe, et l'arrondi

Status: done

**Complexité :** moyenne (une fonction pure, une table figée par empreinte, un adaptateur du formulaire, une règle d'arrondi)

**Épic :** EPIC-207 (instruire le dossier)
**Dépôt :** `prospera-sinistres-service` (module `sinistres`, dossier `decompte/`) ; aucune route, aucun fait, aucun manifeste
**Plage :** groupe C, n° 8 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1002 (le titulaire instruit).
Ancrage : FR-69 (l'ordre fixe), FR-73 (les autres types et l'arrondi, H-060), FR-70 (le corporel hors de ce décompte), FR-75 (une évaluation arrêtée : STORY-1013).

---

## Pourquoi

Le gestionnaire voit un repère calculé, le montant arrêté vient de lui. Pour que ce repère soit le même sur l'écran, dans l'offre et
dans « Pourquoi ce montant ? » (FR-74), il faut une seule fonction, sans horloge ni base, qui enchaîne toujours les mêmes étapes dans
le même ordre, dont chaque ligne garde sa valeur et sa source. L'ordre est celui du code de la démo, corrigé par la décision D15 : la
franchise est déduite du montant arrêté, après le plafond. Et l'arrondi à 5 000 FCFA est une règle à une seule place : ni entre deux
étapes, ni sur le montant arrêté.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Une fonction pure, dans l'ordre fixe** : `calculerLeDecompte(entree, table)` applique dommage, vétusté, règle proportionnelle, plafond, franchise ; cinq lignes toujours, chacune avec `avant`, `apres`, `source`, `parametres` ; une table qui annonce un autre ordre est refusée (`TABLE_INVALIDE`) | tests purs |
| AC-2 | ⛔ **Les montants de référence au franc près** : 780 000, franchise 10 % minimum 50 000 ⇒ franchise 78 000, indemnité 702 000 ; 300 000 ⇒ franchise 50 000 ; `SIN-2026-9002` : chiffrage expert 445 500 ⇒ **395 500** ; vol de 400 000, vétusté 20 %, franchise 25 000 ⇒ 295 000 | tests purs |
| AC-3 | ⛔ **L'ordre se prouve par le résultat** : 12 000 000 avec plafond 9 000 000 et franchise 10 % ⇒ 8 100 000 (franchise avant plafond donnerait 9 000 000) ; la franchise se compare au montant déjà réduit par la règle proportionnelle ; franchise supérieure au montant ramenée à lui, indemnité jamais négative | tests purs ; mutations |
| AC-4 | **Plafond, sous-assurance** : la part au-dessus du plafond est donnée (`aLaChargeDeLAssure`) ; capital inférieur à la valeur réelle ⇒ multiplication par capital/valeur et alerte `SOUS_ASSURANCE` | tests purs |
| AC-5 | ⛔ **L'arrondi, une seule fois, au bon endroit** : le décompte est au franc (arithmétique entière, demi vers le haut, aucun flottant) ; le **repère** est l'indemnité arrondie au multiple de 5 000, à la fin seulement ; le **montant arrêté** reste au franc (395 500, 297 400) et n'est jamais arrondi ; le **corporel** n'a ni ce décompte ni cet arrondi (renvoi au barème) | tests purs ; mutation (arrondi entre deux étapes) |
| AC-6 | **Tables en paramètre, versionnées, figées par empreinte** : `decompte-2026.1.json`, empreinte sha256 testée ; `tableEnVigueur(dateDeSurvenance)` choisit la table du jour du sinistre, jamais celle du jour du calcul | tests purs |
| AC-7 | **Les valeurs du formulaire de 1011 lues comme entrée** : biens, vol, transport, responsabilité civile, divers donnent leur décompte ; accident du travail, décès, collision corporelle et RC corporelle renvoient au barème (`BAREME_CORPOREL`) ; le matériel automobile renvoie à STORY-1012 | tests purs |

## Décisions retenues par défaut (contestables)

- **D-1010-1 — Pas de commande « arrêter l'évaluation » dans cette story.** Le plan dit « une fonction pure ». Arrêter une évaluation
  (écrire le montant arrêté, sa table, son motif, la figer) est le périmètre de STORY-1013 (« une évaluation arrêtée n'est jamais
  recalculée »). Cette story livre le calcul et le contrôle du montant arrêté (`montantArrete`, au franc) que 1013 appellera. Aucune
  route, aucun champ du dossier ne change.
- **D-1010-2 — Une table `decompte-2026.1.json`, figée par empreinte, datée.** Elle porte l'ordre (que le code refuse de voir changer),
  les libellés d'étapes, le pas d'arrondi (5 000, plus proche, demi vers le haut) et la franchise par défaut par famille. `valableDepuis`
  est jugé à la **date de survenance** (`tableEnVigueur`), pas à la date du calcul : un sinistre se juge selon la table de son jour,
  ce que 1013 consommera. La table du formulaire (1011) se fige, elle, à l'entrée en instruction : deux dates, deux usages.
- **D-1010-3 — Chaque ligne est un nombre entier de francs, demi vers le haut, par arithmétique entière.** Le FCFA n'a pas de
  sous-unité, une ligne stockée doit se retrouver à l'identique dans l'offre, et l'étape suivante part de la valeur stockée.
  Pourcentages : deux décimales au plus (`POURCENTAGE_INVALIDE` sinon). Les montants intermédiaires ne passent jamais par un flottant.
  Le multiple de 5 000 est tout autre chose et n'est appliqué qu'une fois (D-1010-4).
- **D-1010-4 — Deux montants, et le PRD s'y contredit : indemnité calculée au franc, repère arrondi.** FR-69 veut 702 000 pour un dommage
  de 780 000 ; FR-73 dit que l'indemnité d'un formulaire est arrondie à 5 000 et appelle 702 000 « un repère déjà arrondi », ce qui est
  inexact (702 000 n'est pas un multiple de 5 000). La fonction rend les deux : `indemniteCalculee` (702 000, ce que le décompte affiche)
  et `reperePropose` (700 000, le multiple de 5 000 le plus proche, calculé une fois à la fin). Pour 295 000 (vol), les deux sont égaux.
  **Question au PO** : l'écran affiche-t-il 702 000 ou 700 000 comme repère ? Défaut : le décompte en francs, avec le repère arrondi à
  côté. Le montant arrêté n'est jamais écrit d'office depuis l'un ou l'autre (FR-73, FR-75).
- **D-1010-5 — Un adaptateur lit les valeurs du formulaire de 1011.** Biens : (bâtiment + contenu), vétusté, supplément ajouté après la
  vétusté et hors de son assiette, règle proportionnelle capital/valeur, plafond = capital assuré, franchise fixe (25 000 par défaut).
  Vol : valeur des objets, vétusté, plafond = capital, franchise fixe. Transport : valeur assurée × taux d'avarie. RC : réclamé × part,
  plafond = plafond de la garantie. Divers : réclamé × (1 − abattement de 10 % par défaut) ; l'abattement passe à l'étape de vétusté
  (même mécanique, libellé « Abattement »). Le plafond et la franchise en pourcentage de la garantie souscrite (vue dans le LC, D4)
  seront ceux que la story qui lira la garantie passera à l'entrée ; ici, ceux du formulaire.
- **D-1010-6 — La franchise se prend sur le montant retenu après le plafond** : `min(montant, max(montant × taux, minimum))`
  (FR-69), une franchise fixe étant un minimum sans taux. C'est l'ordre du PRD (D15), pas celui de `garanties-hub.ts` de la démo
  (franchise puis plafond).
- **D-1010-7 — Le corporel renvoie au barème.** `ACCIDENT_TRAVAIL`, `DECES`, `AUTO_CORPOREL` et une RC avec `dommageCorporel`
  rendent `BAREME_CORPOREL` : poste par poste (FR-70), sans arrondi, sans montant proposé par l'IA (FR-71).
- **D-1010-8 — Le matériel automobile attend STORY-1012.** Le formulaire véhicule rend `VETUSTE_PAR_AGE_ET_EPAVE_A_VENIR` : un
  décompte sans vétusté sur pièces selon l'âge ni épave serait faux. Le cœur sait déjà décompter un dommage chiffré (le cas de
  `SIN-2026-9002` : chiffrage de l'expert, déjà net de vétusté).
- **D-1010-9 — Point d'insertion pour 1012.** `Vetuste` est une union (aujourd'hui `POURCENTAGE`) : 1012 ajoute `PAR_AGE_SUR_PIECES`
  (pièces, main-d'œuvre, âge du véhicule) et la décision d'épave (valeur vénale − valeur de l'épave) à l'étape du dommage, publie une
  table `2026.2` avec la grille datée (jusqu'à 1 an 0 %, 2 ans 10 %, 3 ans 20 %, 5 ans 30 %, 8 ans 40 %, au-delà 50 %), et l'ajoute
  à `entreeDepuisLeFormulaire`. L'ordre des cinq étapes ne bouge pas. Pour 1013 : garder `tableVersion` avec l'évaluation arrêtée.
- **D-1010-10 — Alertes : seulement celles du décompte.** `SOUS_ASSURANCE` (FR-69), `PLAFOND_ATTEINT`, `FRANCHISE_RAMENEE_AU_DOMMAGE`,
  `INDEMNITE_NULLE`. Les alertes d'instruction de la démo (véhicule de plus de 15 ans, vol sans plainte, prescription du recours…,
  H-046) et leur seuil paramétrable restent à écrire : elles lisent des champs, pas le décompte. RC seule avec assuré fautif ⇒ zéro
  et `BLOQUANT` : STORY-1012 (FR-72).

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#22** (`dev` 49d5eb3) :

- `src/modules/sinistres/decompte/` : `decompte.ts` (pur : `calculerLeDecompte`, `arrondirAuPas`, `montantArrete`,
  `tableEnVigueur`, `entreeDepuisLeFormulaire`), `decompte-2026.1.json` (empreinte `d486660f…`), `decompte.spec.ts`.
  Aucune route, aucun fait, aucun module Nest ni fournisseur : pas de pile (plan : « Docker : non »).
- **Tests** : 29 purs (empreinte, ordre refusé, table à la survenance, 702 000 / 250 000 / 395 500 / 295 000, franchise après le
  plafond et après la règle proportionnelle, franchise ramenée au montant, sous-assurance, supplément, 12,5 % de 333 333 au
  franc, refus nommés, arrondi, adaptateur des cinq familles, renvois au barème et à 1012). Trois mutations (arrondi à 5 000
  entre deux étapes, minimum de franchise ignoré, plafond sans effet) : chacune rougit sur l'assertion.
- **Node 24** (étage `verification`, image depuis `git archive`, MongoDB réel en jeu de répliques) : lint 0, 1139 unitaires
  (57 suites + 1 sautée, `-w 2`), 25 e2e, build 0. Rejeu depuis l'export d'`origin/dev` : export d'`origin/dev` 49d5eb3, lint 0, 1139 unitaires, 25 e2e, build 0.
- Écart : le chiffre « 775 000 » de la démo (calcul d'instruction de `SIN-2026-9002`, repère jamais utilisé) n'est pas
  reproduit : ses entrées (pièces, main-d'œuvre, vétusté, valeur vénale) ne sont dans aucun extrait ; il relève du matériel
  automobile (1012). Le jeu du LC donne 445 500, franchise 10 % minimum 50 000, évaluation arrêtée 395 500, retrouvés.

**Reste**
- STORY-1012 : vétusté sur pièces selon l'âge, épave, RC seule avec assuré fautif (zéro et `BLOQUANT`), valeur vénale ; elle
  ajoute la variante de `Vetuste`, la table `2026.2` et la branche `VEHICULE` de l'adaptateur.
- STORY-1013 : arrêter l'évaluation (commande, montant au franc, motif, table figée avec `tableVersion`), cinq montants distincts.
- Plafond et franchise lus sur la garantie souscrite (projection d'`assurance`, D4) : le décompte les reçoit en entrée.
- Les alertes d'instruction de la démo et leur seuil (H-046) ; la route et l'écran « Pourquoi ce montant ? » (FR-74).
- Question au PO : 702 000 ou 700 000 comme repère affiché (D-1010-4).
