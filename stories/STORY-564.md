# STORY-564 : Le barème IRPP entre au paquet fiscal Togo — aujourd'hui il est cité comme « présent dans le CGI » et rien ne le calcule

Status: done

**Épic :** EPIC-029 — Familles de calcul et modificateurs
**Service :** `fiscal-service` (`:3012`) · **paquet :** `paquet-fiscal-togo-2026`
**Points :** 8 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — le dirigeant déclare et paie ses propres impôts.
**Prérequis :** **STORY-563** (le redevable personne physique) ✅
**Réf. :** **FR-F80** (régime non déterminable ⇒ obligation bloquée) · **NFR-F04** (aucun taux
codé en dur) · `referentiels/corpus-complet-cgi-lpf-togo.json` (1 185 articles)

**Plan :** `coordination/PLAN-LOT-7-2026-11-24.md` §3, n° **1** du fiscal (« Fini quand : le barème est une donnée du
paquet, plus « présent dans le CGI » ; le paquet porte depuis le 24/11 la base des salaires (`irpp.traitementsSalaires` :
Art. 26, 72-74, relus dans le CGI) ; **prévenir D** (348 l'emploie) »), §5 (C : 564 → D : 348), §6 (les copies du
paquet). **Ordre de C** (amendé le 25/11 à 21:50) : 1020 ✅ → 1019 ✅ → 1021 ✅ → **564** → 1022 → 1023 → 317 → …
**Dépôts :** `prospera-balance-service` (la **source** du paquet, `scripts/referentiels/sources/`, et sa garde de
packaging ; `origin/dev` au départ `465a308`) et `prospera-fiscal-service` (partagé par dossier avec D, D-L7-1 ; dossier
`familles` de C ; `origin/dev` au départ `e4630f1`, STORY-346 de D). La copie de `dossier-service` est à B (demande).
**Rituel (2026-11-25) :** aucune demande neuve à C chez A, B et D qui porte sur cette story ; « ⚠ Communs » de D relu
(560 : `natures-acces.ts`, `all-exceptions.filter.ts` ; 346 : une route au contrat) — rien ne croise ce qui suit ; aucune
PR ouverte sur le fiscal ni sur la balance ; aucune migration en vol ; D code 347 dans `_wt-d-fiscal` (`remuneration`).

---

## Le fait, mesuré dans le paquet (fiche d'origine, 2026-08-28)

`paquet-fiscal-togo-2026.json` porte `tva`, `is`, `minimumForfaitairePerception`,
`acomptesProvisionnels`, `resultatFiscal`, `regimesImposition`, `factureNormalisee`. **L'IRPP n'y
est pas un calcul** — il est **cité dans une liste** (`autresImpotsTaxes.presentsDansCGI` :
« IRPP (bareme progressif, tranche haute 30%) »). ⇒ **Une mention, pas un barème.** Et le champ
`aFaire` du paquet **ne le liste même pas** parmi les manques identifiés.

⛔ **Conséquence, et elle est correcte :** sans barème au paquet, `FR-F80` marque l'obligation du
dirigeant **bloquée**, avec l'indication de ce qui manque.

## Ce qui existait déjà (mesuré le 2026-11-25 sur `origin/dev`)

La fiche d'origine décrit l'**amorce** du paquet. Depuis :

| Où | Ce qu'il y a | Ce qui manque |
|---|---|---|
| source du paquet (`balance-service`, `scripts/referentiels/sources/paquet-fiscal-togo-2026.json`) | `irpp.tranches` : les **huit tranches** de l'Art. 74, 0 % → **35 %** (révision du 2026-07-19, `correctionAmorce`) ; `irpp.source` « Art. 74 CGI » **pour tout le bloc** ; `arrondiAssiette` (millier inférieur) et `arrondiProduit` (dizaine inférieure), structurés (STORY-901) ; `declarationAnnuelle` et le questionnaire « dois-je déclarer ? » (STORY-568) ; l'entrée de catalogue `IRPP_DECLARATION` (`DECLARATIVE`, `PERSONNE_PHYSIQUE`) | **aucun article ni millésime par élément** ; **pas de base des salaires** (Art. 26, 72-73) ; aucun périmètre des revenus catégoriels ; rien sur les retenues de l'employeur ; `cnss` sans le SMIG, les branches ni l'AMU ; `aFaire` muet sur l'IRPP |
| copie de référence `prospera-stories/referentiels/paquet-fiscal-togo-2026.json` (l'amorce, 23 Ko) | depuis le 24/11 (PR du plan du lot 7) : `irpp.traitementsSalaires` (Art. 26, 72-74, relus, `ordreDeCalcul`) et le bloc `cnss` complet (SMIG 52 500, déplafonné, branches, AMU) | **n'est pas la source** : rien de ce qui y fut écrit le 24/11 n'est entré dans le paquet packagé ni dans ses copies |
| copies à l'octet | `balance-service` (`src/modules/referentiel/assets/`) et `prospera-fiscal-service` (`test/fixtures/paquet-fiscal/`) : `sha256 5c683d16…149b` (STORY-316) ; `dossier-service` (B) : `e8e94c84…dc6`, plus ancienne (sans `coherence` ni `rapprochementAnnuel`) | — |
| moteur de `fiscal-service` | `FamilleBaremeTranches` (STORY-311) calcule l'IRPP sur `irpp` avec ses arrondis (prouvé par `tranches.spec`, `arrondi-assiette.spec`) | **aucun calcul de la base** (déductions, forfait, charges de famille), aucun périmètre de revenus, aucune imputation des retenues ; `RedevableSansObligation` et le catalogue citent encore « STORY-564 » comme manque |

⚡ **La contradiction 30 % / 35 % est tranchée par le texte** (corpus, CGI Art. 74, p. 41, édition OTR 2025) : « de
15 000 001 A 20 000 000 : 30 % ; Plus de 20 000 000 : 35 % ». **30 % est l'avant-dernière tranche, 35 % la dernière** ;
l'amorce avait pris l'une pour l'autre. Le paquet le dit depuis le 2026-07-19 ; ce qu'il en reste à corriger est la mention
de `autresImpotsTaxes.presentsDansCGI`, qui recopie encore un taux (« tranche haute 35% ») hors du barème (AC-3).

## Périmètre

**Inclus**

- Le **barème IRPP** au paquet, comme donnée, **chaque élément avec son article et son millésime** : les huit tranches
  (Art. 74), la base des **traitements et salaires** (Art. 26 1° à 3° et 5° à 9°, forfait du dernier alinéa, charges de
  famille des Art. 72-73, arrondis de l'Art. 74), le **périmètre des revenus catégoriels** (couverts / non couverts), les
  **retenues à la source** de l'employeur (LPF Art. 26, 27, 43).
- Les **revenus catégoriels** du dirigeant salarié : **traitements et salaires d'abord** (« pour un début », PO). Les
  autres catégories sont **déclarées non couvertes** au paquet, chacune avec son article : le calcul les **bloque**
  nommément (`FR-F80`).
- Le **calcul** (famille au sens d'AD-2) : revenu net imposable, barème, imputation des retenues **traçables jusqu'à la
  ligne de rémunération**, résultat reproductible et daté de son paquet. ⛔ **aucun chemin de code « dirigeant »** : il
  prend un revenu catégoriel, jamais une qualité de personne.
- La **garde de packaging** : un élément du barème sans article ou sans millésime **fait échouer le build** du paquet.
- Les **copies à l'octet** du paquet (plan §6) : `balance-service`, `prospera-fiscal-service` ; `dossier-service` est à B.

**Hors périmètre**

- La **CNSS** comme calcul (STORY-348, D). Ses textes, portés tels quels de la copie de référence (D-564-2), entrent au
  paquet parce que 348 les lit ; rien n'est ajouté à leur contenu.
- Les autres impôts de la personne physique — TVM, taxe foncière, taxe d'habitation.
- La **retenue mensuelle** de l'employeur (STORY-348, D) : le CGI ne dit pas comment mensualiser le barème annuel.
- Le paiement : **STORY-565**. L'explication et l'optimisation : **STORY-566**. Le montant net d'acomptes et de
  retenues d'une obligation : **STORY-340**.

## Critères d'acceptation

| # | Critère (fiche d'origine) | Comment il sera prouvé |
|---|---|---|
| AC-1 | Le barème est **entièrement en donnée** : aucun taux, aucune tranche, aucun seuil dans le code (NFR-F04). Témoin : changer une tranche au paquet change le résultat, sans déploiement | spec du calcul sur le paquet réel puis muté (une tranche, le forfait, le plafond de 10 M, les charges de famille, un arrondi) ; balayage du fichier source : aucun littéral de taux ni de seuil |
| AC-2 | Chaque élément du barème porte **son article de référence et le millésime**. Un élément sans référence fait **échouer la validation du paquet**, au packaging | règle **R11** de `valider-paquet-fiscal.mjs`, jouée par la vraie garde (`paquet-fiscal-schema.spec`, table de mutations) ; relue fail-closed par le calcul (`PAQUET_INCOMPLET`) |
| AC-3 | La contradiction 30 % / 35 % est **tranchée, sourcée et écrite** — la mention `autresImpotsTaxes` corrigée ou supprimée | ci-dessus (Art. 74, p. 41) ; la mention ne porte plus de taux et renvoie au bloc `irpp` |
| AC-4 | Un revenu catégoriel non couvert rend l'obligation **bloquée** avec le motif exact (`FR-F80`), jamais un calcul partiel présenté comme complet | spec : `BLOQUEE` + `REVENU_CATEGORIEL_NON_COUVERT` + la catégorie, son article et ce qui manque ; une catégorie inconnue du paquet bloque aussi |
| AC-5 | Les retenues à la source opérées par l'entreprise sont imputées, et **traçables jusqu'à la ligne de rémunération** | spec : chaque retenue imputée garde son `ligneRemunerationId` et sa période ; solde à payer ou excédent nommé ; une même ligne imputée deux fois est refusée |
| AC-6 | Le calcul est reproductible : même paquet, mêmes entrées, même résultat, et le millésime du paquet est publié avec le montant | spec : deux calculs identiques à l'octet ; le résultat porte `paquet { code, version }` et `millesime` |
| AC-7 | `aFaire` du paquet est mis à jour — l'IRPP en sort, et ce qui reste manquant y entre nommément | le paquet packagé (revue du diff de la source) |

## Décisions retenues par défaut (contestables)

- **D-564-1 — Ce que la story fait du barème qui existe** : il reste où il est (`irpp.tranches`, mêmes clés, mêmes
  valeurs) ; chaque tranche **gagne** `article` (« Art. 74 CGI ») et `millesime`. Rien n'est renommé : `fiscal-service`
  (`FamilleBaremeTranches`) et STORY-348 de D lisent `de`, `a`, `taux`.
- **D-564-2 — La source est celle de `balance-service`** (D-L7-3, pièges de C) : ce que la PR du plan a écrit le 24/11
  dans la copie de référence de `prospera-stories` (`irpp.traitementsSalaires`, le bloc `cnss`) entre **dans la source**,
  à l'identique pour les clés et les valeurs — **`irpp.traitementsSalaires.ordreDeCalcul`** et les chemins de `cnss` que
  348 lit restent ce qu'ils sont —, puis `node scripts/referentiels/build.mjs` et le réépinglage. La copie de référence
  de `prospera-stories` (l'amorce) n'est **pas** une copie à l'octet et ne change pas ici.
- **D-564-3 — `article` + `millesime` sur chaque élément**, champs **ajoutés** à côté des valeurs : les huit tranches,
  `traitementsSalaires.deductionsDuBrut[]`, `.deductionForfaitaire`, `.fraisReelsAlinea4`,
  `.deductionsSurJustificatif.rubriques[]` (l'`article` s'ajoute à `alinea`), `.chargesDeFamille`, les entrées de
  `revenusCategoriels`, `retenueALaSource`. `millesime` : « CGI et LPF, édition consolidée OTR 2025 (jusqu'à la LF 2023,
  loi n° 2022-022 du 27 décembre 2022) ». La garde existante (R4) se contente d'une `source` sur un ancêtre : elle laissait
  passer une tranche sans article. **R11** l'exige élément par élément, et nomme toutes ses fautes d'un coup.
- **D-564-4 — Le périmètre des revenus catégoriels est une donnée** : `irpp.revenusCategoriels` `{ couverts, nonCouverts }`,
  chaque entrée `{ code, libelle, article, millesime, … }`. **Ses codes sont ceux du questionnaire de STORY-568**
  (`TRAITEMENTS_SALAIRES`, `PENSIONS_RENTES`, `CAPITAUX_MOBILIERS`, `REMUNERATION_GERANT`, `REVENUS_FONCIERS`,
  `BENEFICES_COMMERCIAUX`, `BENEFICES_AGRICOLES`, `PROFESSIONS_NON_COMMERCIALES`) : une réponse « oui » à la
  qualification se lit directement dans le périmètre. Couvert : `TRAITEMENTS_SALAIRES` (CGI Art. 17, 24 à 26, 72 à 74).
  Non couverts, avec ce qui manque : pensions et rentes (Art. 27 et 76 : revenu net de 25 % ou 50 %), **rémunérations des
  gérants** (Art. 28 et 75), revenus fonciers (Art. 14 s., 77), revenus d'affaires (Art. 29 s., 78 : 30 %), capitaux
  mobiliers (Art. 79-80 : retenues libératoires).
- **D-564-5 — ⚠️ Le gérant majoritaire n'est pas un salarié pour la base** : Art. 28, ses frais sont fixés
  forfaitairement à **20 %** (sur la fraction ≤ 10 M) et le revenu net est pris « sans abattement d'aucune sorte » ; seul
  le **barème** est le même (Art. 75). Le paquet ne le couvre pas encore : un dirigeant gérant majoritaire sort
  **bloqué**, jamais calculé comme un salarié (le forfait de 28 % le sous-imposerait). **→ D (information)** : la fiche
  de 348 dit « gérants : même barème ⇒ un aiguillage » — vrai du barème, pas de la base.
- **D-564-6 — Les retenues de l'employeur** : `irpp.retenueALaSource` cite **LPF Art. 26** (l'impôt des salariés et des
  gérants est retenu à la source par l'employeur à chaque paiement, mention sur la fiche de paie), **Art. 27** (reversé
  au plus tard le 15 du mois suivant ; revenus sans retenue et régularisations déclarés et acquittés au 15 janvier de
  l'année suivante) et **Art. 43** (l'impôt est déterminé en tenant compte des imputations) ; `statutLecture`
  `A_VALIDER_PAR_FISCALISTE`. Le calcul impute **chaque** retenue (montant, période, `ligneRemunerationId`) ; un
  **excédent** est nommé, jamais présenté comme un remboursement (aucun texte du paquet ne le règle).
- **D-564-7 — Le calcul** : `src/domain/familles/irpp-traitements-salaires.ts` (`fiscal-service`, dossier `familles`
  de C), **pur**, sur des montants **annuels** en francs entiers, en arithmétique exacte (`bigint`), dans l'ordre de
  `ordreDeCalcul` ; le barème passe par **`FamilleBaremeTranches`** et les arrondis du paquet (AD-2 : aucun second moteur
  de barème). Il rend `CALCULEE` (étapes avec leur article, revenu net imposable, impôt, retenues imputées, solde ou
  excédent, `paquet` et `millesime`) ou `BLOQUEE` (motif, et ce qui manque, nommé). Un paramètre manquant ou sans
  article au paquet ⇒ `BLOQUEE` `PAQUET_INCOMPLET`, jamais un défaut.
- **D-564-8 — Aucune route, aucune obligation neuve, aucun contrat d'API qui bouge** : `IRPP_DECLARATION` reste
  `DECLARATIVE` ; le montant s'exposera avec **340** (montant net d'acomptes, de crédits et de retenues) et **566**
  (expliquer, options chiffrées). Le blocage se rend **au calcul** : les réponses du questionnaire de 568 ne sont pas
  conservées (568 : « rien n'est stocké »), le calendrier ne peut donc pas le porter. Le contrat OpenAPI ne change pas.
- **D-564-9 — Les lectures du texte que le calcul doit trancher**, écrites pour être contestées : (a) le plafond du 1°
  (6 % des rémunérations brutes) s'applique au **brut** (Art. 25) ; 2° et 3° sans limite ; (b) le forfait de 28 % porte sur
  le résultat du 2 (brut moins 1° à 3°), **sur sa fraction n'excédant pas 10 000 000** (Art. 26, dernier alinéa) ; (c) la limite du
  8° (6 % du « revenu net taxable ») se lit sur le revenu **après le forfait** ; (d) la limite du 9° (200 000 + 30 000 par
  enfant, 6 au plus) exige le nombre d'enfants : sans lui, la déduction est **refusée** nommément, jamais réduite en
  silence ; (e) les rubriques sans limite chiffrée (5°, 6°, 7°) se prennent pour le montant justifié ; l'alinéa 4 n'est
  **jamais** déductible avec le forfait (PO, 24/11) — un code inconnu est refusé ; (f) charges de famille =
  `min(personnes, 6) × 10 000 × 12`, situation au 1er janvier (Art. 73) ; (g) un revenu net négatif vaut 0, sans report.
  Toutes à relire par un fiscaliste (`aFaire`).
- **D-564-10 — `aFaire`** : la ligne « Compléter le barème CNSS (plafond, branches, valeur SMIG) » sort (fournis le 24/11)
  et devient « relire le bloc `cnss` ; organisme collecteur de l'AMU ; sa part salariale dans la base de l'IRPP » (plan
  §8) ; l'IRPP y entre nommément : les catégories non couvertes, et la relecture du barème, de la base des salaires et de
  l'imputation des retenues avant figement. `_meta.miseEnGarde` et `_meta.revision` suivent.
- **D-564-11 — `autresImpotsTaxes.presentsDansCGI`** : la ligne de l'IRPP ne recopie plus de taux ; elle renvoie au bloc
  `irpp` (AC-3). Aucun service ne lit cette liste (vérifié : `balance-service`, `fiscal-service`, `dossier-service`).
- **D-564-12 — Les copies** (plan §6) : `balance-service` (l'artefact produit par le build, réépinglé dans
  `paquet-fiscal-registry.ts` et ses deux témoins) et `prospera-fiscal-service` (`test/fixtures/paquet-fiscal/`, fichier
  commun : « ⚠ Communs ») par C ; `dossier-service` (`…/echeance/assets/`) **par B**, en LF : demande « → B ».

## Contrat annoncé avant le code

« ⚠ Contrats » et « ⚠ Communs » du journal de C (entrée STORY-564) : le **paquet fiscal Togo 2026** gagne des clés
(aucune renommée, aucune valeur existante ne change hormis `aFaire`, `_meta.miseEnGarde`, `_meta.revision`, la mention de
`autresImpotsTaxes` et le bloc `cnss`, porté de la copie de référence) ; son empreinte change ; la garde de packaging gagne
R11. `fiscal-service` : un calcul neuf dans le domaine, **aucune route**, contrat OpenAPI inchangé ; fichier commun
touché : la copie du paquet (`test/fixtures/paquet-fiscal/paquet-fiscal-togo-2026.json`).

## Preuves

**Livré :** prospera-balance-service#168, fusionnée en rebase le 2026-11-25 (`head` `dd4f630`, rejoué sur `dev` en
**`c9e94c6`**, arbre identique) ; prospera-fiscal-service#66, rebasée sur `origin/dev` `4a1d938` (STORY-347 de D) avant la
fusion, fusionnée en rebase (`head` `1aa4aeb`, rejoué sur `dev` en **`fd34834`**, arbre identique). Annonce « ⚠ Contrats »
et « ⚠ Communs » avant le code : prospera-stories #921 (`main` `1d64753`). **Livré conforme à l'annonce.**

- **Le paquet** : `node scripts/referentiels/build.mjs` passe (R1 → R11) ; artefact `paquet-fiscal-togo-2026.json`
  **sha256 `bfcc3fc92603e4fa08c370e9a9da7b6634f3b7b2cca12972bbe3fbc6c258c065`** (avant : `5c683d16…149b`), réépinglé
  (registre, `referentiel-registry.spec`, `referentiel.e2e-spec`) ; la surcouche zone franche ne bouge pas (`da92a432…0f74`).
  Copie du fiscal à l'octet, même empreinte sur `dev`. Valeurs relues à la main contre le corpus (CGI Art. 74 p. 41, Art. 26 p. 25, Art. 72-73 p. 40-41, Art. 28 p. 26 ; LPF Art. 26-27 p. 223, Art. 43 p. 228).
- **balance-service, Node 24** (étage `verification`, image de `git -c core.autocrlf=false archive` de `dd4f630`) :
  **unitaires 297/297 suites, 5705 tests** (2 suites sautées, comme sur `dev`), **e2e 37/37 suites, 2291 tests**, `nest
  build` 0. Specs neuves : `paquet-fiscal-schema.spec` « R11 » — le paquet réel (barème, base, périmètre, retenue, clés de
  348, SMIG, mention sans taux, `aFaire`) et **douze refus nommés** provoqués par la vraie garde (tranche sans article, sans
  millésime, forfait au millésime fait d'espaces, déduction du brut, rubrique sur justificatif, charges de famille, revenu
  non couvert, retenue, barème vide, tranche qui n'est pas un objet, revenu à la fois couvert et non couvert, revenu sans
  code) + toutes les fautes d'un coup (8). **Mutations de la garde 4/4** (règle retirée : 13 rouges ; chaîne vide admise ;
  doublon admis ; liste vide admise).
- **prospera-fiscal-service, Node 24** (image de l'archive de `1aa4aeb`, `# syntax=` retiré de la copie) : **unitaires
  201/201 suites, 2905 tests** (1 sauté), **e2e 13/13 suites, 261 tests**, `nest build` 0. Spec neuve
  `irpp-traitements-salaires.spec` (35 tests ; montants attendus calculés à la main depuis le texte) : 12 000 000 brut,
  deux personnes ⇒ net 7 880 000, impôt **645 000**, solde 45 000, chaque étape avec son article ; 30 000 000 ⇒ 26 480 000,
  **5 931 000** (35 % sur l'excédent de 20 M seulement), six personnes au plus, excédent de retenue 69 000 ; plafond de
  6 % du 1° ; exactitude (74 074,02 ; 324 938,0344) jusqu'à l'arrondi ; 5°, 8°, 9° dans leurs limites ; refus nommés ;
  **AC-1 : six témoins** (une tranche, le forfait, son plafond, les charges de famille, la limite du 1°, l'arrondi : le
  résultat change sans code) et **garde par l'AST** (aucun littéral hors 0, 3, 12n dans le fichier du calcul) ; **AC-2 :
  douze paquets incomplets ⇒ `PAQUET_INCOMPLET`** avec le manque nommé ; **AC-4** : gérant majoritaire, revenus fonciers
  et capitaux mobiliers nommés d'un coup, revenu inconnu, revenu couvert par une autre base, périmètre en donnée ;
  **AC-5/6** : retenues avec leur ligne, ligne en double refusée, résultat identique à l'octet, paquet et millésimes
  publiés. Node 25 : `src/domain`, `application/obligations`, `application/qualification` 59/59 suites, 1214 tests (le
  paquet neuf ne casse aucune spec qui lit la copie). **Mutations 14/14 tuées par une assertion** (limite du 1° ignorée,
  plafond du forfait ignoré, personnes sans maximum, revenu non couvert pris pour inconnu, salaires calculés même non
  couverts, ligne en double admise, tranche sans article admise, net négatif gardé, 8° sur le brut, excédent tu, limite du
  9° ignorée, déduction inconnue admise, ligne de rémunération perdue, élément sans millésime admis).
- Lint des fichiers touchés : 0 ; `tsc --noEmit` : rien de neuf (les erreurs locales du client Kafka natif, absent sous
  Node 25, sont celles de `dev`). Pas de `docker compose up` ni de gate : aucun module Nest, dépendance ni Dockerfile ne
  change, et aucun comportement de bout en bout (aucune route) (§1.5).
- **Verrou Docker** : pris à 22:25:38, rendu à 22:33:58 (balance) ; repris à 22:34:05, rendu à 22:38:39 (fiscal), par le
  `trap` de deux scripts autonomes ; aucun conteneur `grp-c` restant, images de vérification supprimées.

## Ce qui reste

- **→ B** : la copie de `dossier-service` (`src/modules/portefeuille/echeance/assets/paquet-fiscal-togo-2026.json`, à sa
  prochaine story sur le service, en LF) — demandée au journal et par message.
- L'exposition du calcul : **340** (montant net d'acomptes, de crédits et de retenues) et **566** (expliquer, options
  chiffrées) ; la mensualisation de la retenue de l'employeur est à **348** (D).
- Les revenus non couverts (pensions Art. 27, gérants Art. 28, fonciers, revenus d'affaires, capitaux mobiliers) : une
  story de sourcing chacun, quand le PO les ouvrira ; le paquet les nomme dans `aFaire`.
- La relecture par un fiscaliste togolais (barème, lectures D-564-9, imputation des retenues) avant figement, et celle du
  bloc `cnss` (plan §8).
- La copie de référence `prospera-stories/referentiels/paquet-fiscal-togo-2026.json` (l'amorce) reste en arrière de la
  source : elle n'est la copie de personne ; à aligner ou à retirer quand l'utilisateur le décidera.

## Notes

- ⚡ **C'est un travail de sourcing autant que de développement.** Le moteur de familles de calcul (AD-2) sait déjà
  appliquer un barème progressif ; ce qui manquait, c'est la base, le périmètre et la référence de chaque élément.
- ⚠️ **Le champ `aFaire` n'avait pas vu ce trou** : un registre de manques incomplet est plus trompeur qu'une absence
  de registre.
- ⛔ **Faire valider par un fiscaliste togolais avant figement.** Cette table servira à calculer ce qu'une personne
  physique doit à l'État.
