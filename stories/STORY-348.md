# STORY-348 : Calcul des cotisations et des retenues, aiguillé sur le type de bénéficiaire

Status: done (2026-11-25 — prospera-fiscal-service#67, `dev` bc0c09f ; lot 7 de D, n° 4)

**Épic :** EPIC-034 — Base de rémunération et obligations sociales
**Points :** 5 · **Service :** `fiscal-service` (`:3012`), dossier de D `modules/remuneration` (D-L7-1)
**FR :** `FR-F30` *(amendé le 2026-08-15)* · **`FR-F79`** · `FR-F80` *(bloqué et motivé)* · `NFR-F03` *(déterminisme)* ·
`NFR-F04` *(aucun taux dans le code)* · `NFR-F09` *(unités entières)*
**Décision :** **AD-2** *(les familles de calcul)* · **AD-4** *(une famille sans stratégie refuse, elle n'approxime
jamais)* · **AD-20** · **AD-21** — `architecture-fiscal-service-2026-08-03`
**Origine :** arbitrage PO du 2026-08-15 (*« IRPP oui, CNSS différée »*) ; **amendée le 2026-11-24**
(`PLAN-LOT-7-2026-11-24.md` §1 et §4 : SMIG, plafond, branches et **AMU** fournis ; l'AMU entre au périmètre).
**Dépend de :** **STORY-345** ✅ (l'agrégat porte le type) · **STORY-347** ✅ (`RemunerationService.baseDuCalcul`, la
base avec son origine, D-347-4) · **STORY-564** de C ✅ (prospera-fiscal-service#66, `dev` `fd34834` : le barème et la
base des salaires au paquet, `calculerIrppTraitementsSalaires` ; paquet recopié, sha256 `bfcc3fc9…c065`).
**Débloque :** STORY-364 (le refus sourcé du dirigeant), STORY-349 (les obligations sociales au calendrier), STORY-350
de C (le rapprochement des charges sociales, en totaux).

> **Historique.** Fiche créée le 2026-08-16 : le plancher SMIG était alors intenable (aucune valeur au paquet,
> `GAP-smig-togo-sans-valeur`) et le plafond « éventuel ». Le 24/11, l'utilisateur a fourni le SMIG (52 500 FCFA par
> mois, arrêté n° 3790/MFPTDS/DGT), l'**absence de plafond** (cotisations déplafonnées), la **ventilation par branche**
> (décret n° 2012-038/PR) et l'**AMU** (décret n° 2023-096/PR : 5 % employeur + 5 % salarié). Le GAP est fermé ; les
> critères « bloqué faute de SMIG » et « le plafond n'est pas tranché » de l'ancienne fiche **tombent** : ils sont
> remplacés ci-dessous par la règle lue au paquet.

---

## Ce que la story livre

Un **calcul pur** (`domain/remuneration/calcul-social.ts`) et sa lecture par HTTP, qui prennent **une version de base
d'une période** (par `baseDuCalcul`, jamais des lignes sans leur origine) et **le paquet fiscal de l'année**, et
rendent pour chaque ligne :

1. **les cotisations sociales** : les trois branches de la CNSS (`cnss.branches.salarie.*`) et l'**AMU**
   (`cnss.amu`), part employeur et part salarié, sur une assiette où **le plancher SMIG s'applique** et où **aucun
   plafond** n'est posé, parce que le paquet le dit ;
2. **la retenue d'IRPP du mois**, par le calcul annuel de C (`calculerIrppTraitementsSalaires`, importé, jamais
   recopié), qui suit `irpp.traitementsSalaires.ordreDeCalcul` ;
3. **les échéances** de la période : cotisations sociales et retenue d'IRPP, au jour que le paquet déclare.

Le type de bénéficiaire est **un critère d'aiguillage**, pas un second moteur : `SALARIE` suit le régime salarié et la
base des traitements et salaires ; `DIRIGEANT` et `ASSOCIE` ne sont **jamais** chiffrés au régime salarié.

### Ce que cette fiche corrige (D-564-5)

L'ancienne fiche disait « gérants et associés : **même barème** ⇒ un aiguillage, pas un moteur ». **C'est vrai du
barème, pas de la base.** Un gérant majoritaire n'a pas la base d'un salarié : Art. 28, frais fixés forfaitairement à
20 % sur la fraction n'excédant pas 10 000 000, revenu net pris sans abattement d'aucune sorte ; seul le barème est
commun (Art. 75). Le paquet déclare ce revenu **non couvert** (`irpp.revenusCategoriels.nonCouverts`,
`REMUNERATION_GERANT`) et le calcul de C le rend `BLOQUEE`. L'aiguillage de 348 envoie donc `DIRIGEANT` et `ASSOCIE`
sur ce revenu catégoriel (D-348-2), et l'IRPP du dirigeant sort **bloqué et motivé par le paquet**, jamais au barème
appliqué à une base de salarié. Le jour où le paquet couvrira la base de l'Art. 28, c'est une story du calcul de C.

## Périmètre

| Volet | 348 | Lu dans le paquet |
| --- | --- | --- |
| CNSS des **salariés**, par branche (prestations familiales 3 %, risques professionnels 2 %, pensions 12,5 % + 4 %) | ✅ | `cnss.branches.salarie.*`, contrôlées contre `cnss.tauxEmployeur` / `cnss.tauxSalarie` |
| **Plancher SMIG** | ✅ | `cnss.assiette.smig.mensuel` (52 500) |
| **Plafond** | ✅ aucun | `cnss.assiette.plafond` (`null`) et `cnss.assiette.deplafonnee` (`true`) |
| **AMU** (5 % + 5 %), *périmètre ajouté le 24/11* | ✅ | `cnss.amu.tauxEmployeur`, `cnss.amu.tauxSalarie` |
| Retenue d'IRPP des **salariés** (Art. 25, 26, 72-74) | ✅ | `irpp.traitementsSalaires.*`, `irpp.tranches[]`, arrondis — par le calcul de C |
| Échéance de la retenue d'IRPP | ✅ | `irpp.retenueALaSource.reversement` (`jourLimite` 15, `moisSuivant`, LPF Art. 27) |
| Échéance des cotisations (CNSS, dont AMU) | ✅ lue, ⏳ **non déclarée au paquet 2026** | `cnss.collecte` (`jourLimite`, `moisSuivant`, `source`) : demandé à C (D-348-9) |
| IRPP des **dirigeants et associés** (Art. 28, 75) | ⛔ bloqué et motivé | `REMUNERATION_GERANT` non couvert (D-564-5) |
| CNSS et AMU des **dirigeants et associés** | ⛔ bloqué, jamais au régime salarié | le refus **sourcé** au paquet (`cnss.aCompleter`) et le déblocage sans livraison : **STORY-364** |
| Revenus distribués (Art. 79) | ⏸️ | non couvert (`CAPITAUX_MOBILIERS`) |

## Décisions

- **D-348-1 — Un seul calcul de l'IRPP : celui de C.** `calculerIrppTraitementsSalaires(contenu, { code, version },
  entrees)` (`src/domain/familles/irpp-traitements-salaires.ts`, dossier de C, code pur) est **importé** : une lecture
  d'un module de C n'est pas une écriture dans son dossier. Il n'est ni modifié ni recopié ; un changement se demande
  à C. Le calcul social (CNSS, AMU, aiguillage, mensualisation, échéances) vit dans le dossier de D :
  `src/domain/remuneration/calcul-social.ts`. L'arithmétique est exacte : les taux du paquet deviennent des fractions
  décimales (`fractionDecimale`, `domain/familles/decimal-exact.ts`, lu de même), les produits se font en entiers.
- **D-348-2 — L'aiguillage sur le type.** `SALARIE` ⇒ cotisations au régime salarié et IRPP sur le revenu catégoriel
  `TRAITEMENTS_SALAIRES`. `DIRIGEANT` et `ASSOCIE` ⇒ cotisations **`BLOQUEE`** (motif `REGIME_SOCIAL_NON_DETERMINE`,
  aucun montant) et IRPP sur le revenu catégoriel **`REMUNERATION_GERANT`** (Art. 17, 28, 75), que le paquet déclare
  non couvert : le calcul de C le rend `BLOQUEE` avec le manque écrit au paquet. ⛔ Aucun repli sur le régime salarié.
  Un dirigeant salarié (gérant minoritaire, mandataire sous contrat de travail) n'est pas distinguable par le seul type
  : il reste bloqué, ce qui est sûr ; le régime indéterminable et son refus sourcé sont **STORY-364** (la suivante),
  qui n'est pas faite ici.
- **D-348-3 — L'assiette et le plancher.** L'assiette brute est la somme des rubriques `inclus` (`assietteDe`, 345) ;
  les remboursements de frais en sont exclus. **Le plancher SMIG du paquet s'applique** : une assiette brute
  strictement positive et inférieure à `cnss.assiette.smig.mensuel` est portée au SMIG (`plancherApplique: true`), et
  les cotisations se calculent sur l'assiette cotisable. Une assiette nulle (aucune rémunération dans le mois) ne doit
  rien : le plancher ne crée pas une cotisation pour une période non travaillée. Le temps partiel n'est pas porté par
  la ligne : le plancher du paquet, écrit pour « un travailleur à temps plein », s'applique à toutes les lignes
  `SALARIE` (à relire par le fiscaliste, plan §8).
- **D-348-4 — Le plafond, tranché par le paquet.** `cnss.assiette.plafond: null` **et** `cnss.assiette.deplafonnee:
  true` ⇒ aucun plafond (les cotisations sont déplafonnées). Un plafond chiffré (entier positif) serait appliqué à
  l'assiette cotisable **sans livraison**. Toute autre combinaison (un plafond chiffré et `deplafonnee: true`, ou
  `null` sans `deplafonnee`) ⇒ cotisations `BLOQUEE`, motif `PAQUET_INCOMPLET`, qui nomme les deux champs. Rien n'est
  supposé par le code.
- **D-348-5 — Les branches, et leur cohérence.** Chaque branche de `cnss.branches.salarie` (hors `total`) donne sa
  part employeur et sa part salarié ; leur somme doit égaler `cnss.tauxEmployeur` et `cnss.tauxSalarie` (et
  `branches.salarie.total`), sinon `BLOQUEE`, motif `PAQUET_INCOHERENT`, les deux valeurs nommées : deux sources du
  même taux qui divergent ne se départagent pas en silence. **Arrondi** : chaque part de chaque branche est arrondie
  au franc le plus proche (la moitié vers le haut) ; les totaux sont la somme des parts arrondies, pour que le détail
  et le total se recoupent. Le paquet ne déclare aucun arrondi des cotisations : à relire par le fiscaliste.
- **D-348-6 — L'AMU.** `cnss.amu.tauxEmployeur` et `cnss.amu.tauxSalarie`, sur l'assiette brute (`cnss.amu.assiette` :
  « salaire brut, déplafonné »), **sans** le plancher SMIG, qui est une règle de `cnss.assiette` et non de l'AMU ; même
  arrondi que les branches. Elle est portée à part des trois branches (`cnss.amu.note` : « cotisation distincte »).
- **D-348-7 — La mensualisation de la retenue d'IRPP** (le CGI ne la décrit pas). La retenue du mois se calcule par
  **l'annualisation du mois** : les entrées du calcul annuel de C sont celles du mois multipliées par 12 — brut
  imposable (l'assiette brute, Art. 25), retenue de retraite (la part salariale de la branche pensions, Art. 26, 1°,
  dans la limite du paquet), cotisations sociales et maladie (la part salariale de l'AMU, Art. 26, 2°, Q-D-22) —, avec
  les personnes à charge de la ligne ; la retenue du mois est **l'impôt annuel divisé par 12, arrondi au franc
  inférieur**. Les déductions sur justificatif (5° à 9°) et les retenues en représentation d'avantages en nature (3°)
  ne sont pas portées par la ligne : elles ne sont pas appliquées à la source et relèvent de la déclaration annuelle,
  dont la régularisation (LPF Art. 27, au 15 janvier de l'année suivante) absorbe aussi l'écart d'arrondi. Le résultat
  publie le brut annualisé, le revenu net imposable annuel, l'impôt annuel, la retenue du mois, les étapes du calcul de
  C (chacune avec son article) et ses millésimes.
- **D-348-8 — Les personnes à charge, une donnée de la ligne.** Les charges de famille (10 000 par personne et par
  mois, 6 personnes au plus, Art. 72-73) exigent un nombre que la base ne portait pas. La ligne reçoit un champ
  **facultatif** `personnesACharge` (entier de 0 à 99 ; le plafond de 6 est celui du paquet, appliqué par le calcul) :
  dans la saisie, dans le gabarit d'import (colonne facultative `personnesACharge`, cellule vide ⇒ non renseignée), au
  détail. ⛔ **Aucune valeur par défaut** (le principe de FR-F79) : une ligne `SALARIE` sans ce nombre rend sa retenue
  d'IRPP `BLOQUEE`, motif `CHARGES_DE_FAMILLE_NON_RENSEIGNEES` ; ses cotisations, qui n'en dépendent pas, se calculent.
  Le document de la base ne porte le champ que **renseigné** : l'empreinte d'une base déjà constituée ne change pas, et
  sa resoumission à l'identique reste `INCHANGEE`. Stockage : un champ `personnesACharge` (`Number`, `null` par défaut)
  sur `lignes_remuneration`, **sans migration** (une ligne déjà écrite se lit `null`). AD-21 : un décompte, ni nom ni
  lien de parenté.
- **D-348-9 — Les échéances, lues au paquet.** La période `AAAA-MM` donne une date du mois suivant au jour que déclare
  le paquet : la retenue d'IRPP par `irpp.retenueALaSource.reversement` (`jourLimite` 15, `moisSuivant`, LPF Art. 27)
  ⇒ `2026-04-15` pour `2026-03`. Les cotisations (les trois branches et l'AMU, collectées par la CNSS, Q-D-22) par
  `cnss.collecte` (`jourLimite`, `moisSuivant`, `source`) : **le paquet 2026 ne la déclare pas encore** (le seul « 15
  du mois suivant » qu'il porte est un texte, `cnss.amu.collecte.versement`). L'échéance sort donc
  **`NON_DECLAREE`** et nomme la clé qui manque ; ⛔ aucun 15 codé en dur (NFR-F04). **→ C** : ajouter `cnss.collecte`
  au paquet (source dans `balance-service`, recopie dans le fiscal) ; à son arrivée, l'échéance sort au 15 du mois
  suivant **sans livraison**, ce qu'un test prouve sur un paquet qui la porte. Le report à un jour ouvré relève du
  calendrier (349).
- **D-348-10 — Une lecture, rien d'écrit.** Le calcul est rejoué à chaque lecture : il ne dépend que de la version de
  base et du paquet (ni horloge, ni hasard), donc deux lectures à des dates différentes rendent le même résultat
  (NFR-F03). Le résultat porte l'`origine` de la base (D-347-4) et le paquet (`code`, `version`, `checksum`) : il est
  refaisable. Aucune collection, aucun fait d'audit neuf.
- **D-348-11 — La route.** `GET /api/v1/dossiers/{dossierId}/remuneration/{periode}/calcul?version=` : garde fiscale,
  rôles `TENANT_ADMIN` | `TENANT_USER`, droit **`PREPARER`** (le résultat est par bénéficiaire, AD-21, comme le
  détail) ; aucun corps (la garde AD-13 ne la juge pas). Le paquet est celui de l'année de la période et du pays du
  dossier (`PaquetsService.charger`, comme la conservation de 345) ; un paquet inaccessible rend son propre refus, jamais
  un calcul partiel.
- **D-348-12 — Les totaux sans nom.** Le résultat porte des totaux de la période (par branche, AMU, retenues d'IRPP, et
  le nombre de lignes bloquées par volet), sans ligne nominative : c'est ce que STORY-350 de C rapprochera des comptes
  de personnel (AD-21). Le calcul est exporté par `RemunerationModule` (`CalculRemunerationService`) pour que 350 le
  lise par le service, sans écrire dans le dossier de D.

## Contrat (annoncé avant le code)

| | |
| --- | --- |
| **Route neuve** | `GET /api/v1/dossiers/{dossierId}/remuneration/{periode}/calcul` (`version` facultative, la dernière par défaut) — 200 ; 400 `PERIODE_INVALIDE` ; 403 ; 404 `DOSSIER_INTROUVABLE`, `BASE_INTROUVABLE` ; refus du paquet tels quels |
| **Réponse** | `{ origine, paquet { code, version, checksum }, lignes[], totaux, echeances[] }` |
| `lignes[]` | `{ beneficiaireId, typeBeneficiaire, cotisations, irpp }` |
| `cotisations` | `CALCULEE` : `{ assiette { brute, cotisable, plancherApplique, plafond }, branches[] { code, employeur, salarie }, amu { employeur, salarie }, totalEmployeur, totalSalarie }` · `BLOQUEE` : `{ motif, manques[] { objet, manque } }`, motifs `REGIME_SOCIAL_NON_DETERMINE`, `PAQUET_INCOMPLET`, `PAQUET_INCOHERENT` |
| `irpp` | `CALCULEE` : `{ revenuCategoriel, brutAnnualise, revenuNetImposableAnnuel, impotAnnuel, retenueDuMois, etapes[] { libelle, article, operation, resultat }, millesimes[] }` · `BLOQUEE` : `{ motif, manques[] { objet, article, manque } }`, motifs de C (`REVENU_CATEGORIEL_NON_COUVERT`, `REVENU_CATEGORIEL_INCONNU`, `PAQUET_INCOMPLET`) et `CHARGES_DE_FAMILLE_NON_RENSEIGNEES`, `COTISATIONS_NON_CALCULEES` |
| `totaux` | `{ cotisations { employeur, salarie, branches[], amu }, retenuesIrpp, lignesBloquees { cotisations, irpp } }` |
| `echeances[]` | `{ obligation: COTISATIONS_SOCIALES \| RETENUE_IRPP, statut: DECLAREE, exigibleLe, source }` ou `{ obligation, statut: NON_DECLAREE, manque }` |
| **Champ ajouté (facultatif)** | `personnesACharge` (entier 0 → 99, ou absent) : corps de `PUT …/remuneration/{periode}` (`lignes[]`), colonne facultative du gabarit d'import, `lignes[]` du détail (`null` si non renseigné) |

Rien n'est renommé ; aucune route existante ne change de forme (un champ facultatif s'ajoute) ; aucun topic, schéma de
fait ni manifeste. Aucune migration.

## Critères d'acceptation

- **Étant donné** une base de rémunération **quand** le calcul s'exécute **alors** les parts employeur et salarié
  sortent des taux du paquet, **branche par branche** (`cnss.branches.salarie.*`), ⛔ jamais d'une constante du code
  (NFR-F04) : un paquet de test aux taux changés change les montants sans livraison.
- **Étant donné** une assiette brute de 40 000 (inférieure au SMIG de 52 500) **quand** le calcul s'exécute **alors**
  **le plancher du paquet s'applique** : assiette cotisable 52 500, `plancherApplique: true`, pensions salarié 2 100.
- **Étant donné** une assiette de 20 000 000 **quand** le calcul s'exécute **alors** **aucun plafond** n'est posé,
  parce que le paquet dit `plafond: null` et `deplafonnee: true` ; un paquet de test au plafond chiffré le pose, un
  paquet incohérent bloque (`PAQUET_INCOMPLET`).
- **Étant donné** un salarié **quand** le calcul s'exécute **alors** **l'AMU entre dans le calcul** : 5 % employeur et
  5 % salarié de l'assiette brute, à part des trois branches, et sa part salariale est retranchée du brut avant
  l'IRPP (Art. 26, 2°).
- **Étant donné** un revenu salarial et ses personnes à charge **quand** la retenue d'IRPP est calculée **alors** elle
  suit `irpp.traitementsSalaires.ordreDeCalcul` par le calcul de C (déductions de l'Art. 26, 28 % sur 10 000 000 au
  plus, 10 000 par personne à charge et par mois, barème, arrondis), annualisée puis divisée par 12 (D-348-7) ; un
  changement de tranche au paquet ne demande aucune livraison.
- ⛔ **Étant donné** une ligne `SALARIE` sans `personnesACharge` **quand** la retenue est calculée **alors** elle sort
  `BLOQUEE` (`CHARGES_DE_FAMILLE_NON_RENSEIGNEES`), jamais avec zéro personne supposée ; ses cotisations se calculent.
- **Étant donné** un bénéficiaire `DIRIGEANT` ou `ASSOCIE` **quand** l'IRPP est calculé **alors** il sort `BLOQUEE`
  (`REVENU_CATEGORIEL_NON_COUVERT`) avec le manque écrit au paquet pour `REMUNERATION_GERANT` (D-564-5) ; **quand**
  les cotisations sont calculées **alors** elles sortent `BLOQUEE` (`REGIME_SOCIAL_NON_DETERMINE`), ⛔ **jamais au
  régime salarié**.
- **Étant donné** une période `2026-03` **quand** les échéances sont lues **alors** la retenue d'IRPP est exigible le
  `2026-04-15` (LPF Art. 27) ; les cotisations le sont au jour de `cnss.collecte` : `NON_DECLAREE` sur le paquet 2026,
  le `2026-04-15` sur un paquet qui la déclare (15, mois suivant) ; la période `2026-12` donne `2027-01-15`.
- **Étant donné** un dossier **100 % `SALARIE`** aux personnes à charge renseignées **quand** le calcul s'exécute
  **alors** aucune ligne n'est bloquée : l'aiguillage ne change rien au chemin nominal.
- **Étant donné** une base **quand** le calcul est lu **alors** il porte son origine (`version`, `provenance`,
  `empreinte`) et le paquet (`code`, `version`, `checksum`) ; deux lectures à des dates différentes rendent le même
  résultat (NFR-F03).
- **Étant donné** une base constituée avant 348 (sans `personnesACharge`) **quand** elle est resoumise à l'identique
  **alors** `INCHANGEE` : l'empreinte n'a pas bougé (D-348-8).

## Ce que cette story ne fait PAS

- ⛔ Elle ne constitue pas la base (345 → 347) et n'écrit aucun calcul de l'IRPP (celui de C, D-348-1).
- ⛔ Elle ne fait pas **STORY-364** : le motif du dirigeant lu dans `cnss.aCompleter`, le déblocage sans livraison et
  le cas `ASSOCIE` + distribution (Art. 79) sont la suivante. 348 garantit seulement qu'un dirigeant n'est jamais
  chiffré au régime salarié.
- ⛔ Elle n'invente aucun taux, plancher, plafond, arrondi d'impôt, jour d'échéance ni règle d'affiliation (NFR-F04,
  AD-1).
- ⛔ Elle ne porte ni le calendrier social (349) ni le rapprochement (350, C). La déductibilité de la part patronale
  (`cnss.deductibiliteFiscale`) relève du résultat fiscal, qui la lit déjà dans la balance (catalogue
  `CNSS_PATRONALE`, compte 664) : 348 calcule, elle ne comptabilise pas.
- ⛔ Elle ne modifie pas le paquet (à C, D-L7-3) ni `irpp-traitements-salaires.ts` (dossier de C).

## Points ouverts (gestes réservés, plan §8) — Q-D-22

Deux points restent **non tranchés** ; le calcul applique un choix par défaut, écrit en **Q-D-22** au journal de D :

1. **L'organisme qui collecte l'AMU.** Par défaut : **la CNSS**, avec les cotisations, à la même échéance
   (`cnss.amu.collecte.CNSS` : les salariés relevant du Code du travail ; l'INAM pour les agents publics, qui ne sont
   pas les clients d'un cabinet). Le décret n° 2023-097/PR reste à lire (`cnss.aCompleter`).
2. **Le sort de la part salariale de l'AMU dans la base de l'IRPP.** Par défaut : **retranchée du brut** au titre de
   l'Art. 26, 2° (`cnss.amu.deductibiliteIRPP`, `deductionsDuBrut.cotisationsSocialesEtMaladie`).

La relecture du bloc `cnss` (textes cités, AMU, plancher et temps partiel, arrondi des cotisations) par un fiscaliste
ou un spécialiste de la paie est un **geste de l'utilisateur**, avant la mise en service.

## Definition of Done

- [x] **Mutation de l'aiguillage** : forcer le régime salarié pour un `DIRIGEANT` ⇒ le test « les cotisations du
      dirigeant sortent bloquées » rougit.
- [x] **Mutation du sourcing** : remplacer `cnss.tauxEmployeur` (ou un taux de branche) par sa valeur en dur ⇒ un test
      rougit (paquet de test aux taux changés).
- [x] **Mutations du plancher et du plafond** (plancher retiré ; plafond supposé absent sans lire le paquet), **de
      l'AMU** (retirée du calcul, ou de la base de l'IRPP), **des personnes à charge** (défaut 0) et **de l'échéance**
      (15 en dur) ⇒ chacune rougit sur une assertion.
- [x] Le calcul est rejoué à deux dates différentes sur la même version de base et de paquet et rend le même résultat
      (NFR-F03).
- [x] Montants en francs entiers, arithmétique exacte (NFR-F09) : aucun flottant entre le taux et l'arrondi.
- [x] La retenue d'un cas chiffré à la main (écrit dans le test, jamais relu de la constante testée) est égale.
- [x] e2e de la route (gardes, 200, version demandée, 404, refus du paquet) ; e2e et conformité de `personnesACharge`
      (saisie, import, stockage, empreinte inchangée sans le champ).

## Livraison (2026-11-25)

- **Code** : prospera-fiscal-service#67, fusionnée en rebase sur `dev` (`bc0c09f`). Annonce avant le code :
  prospera-stories#925 (`main` 20705a8). **Aucun écart au contrat annoncé.**
- **Fichiers** (dossier `remuneration` de D) : `domain/remuneration/calcul-social.ts` (pur) et son test ;
  `application/remuneration/calcul-remuneration.service.ts` et son test ; `modules/remuneration/dto/calcul-remuneration.dto.ts` ;
  la route dans `remuneration.controller.ts`, le service exporté par `remuneration.module.ts` ; `personnesACharge` dans
  `ligne-de-remuneration.ts`, `fichier-de-paie.ts`, `remuneration.dto.ts`, `base-remuneration.schema.ts`,
  `mongo-registre-remuneration.ts` ; `pays` ajouté à `BaseDuCalcul`. **Lus, sans écriture** (dossier de C) :
  `domain/familles/irpp-traitements-salaires.ts`, `decimal-exact.ts`.
- **Communs** (D-L7-2) : le contrat OpenAPI seul. Aucune migration.
- **Preuves** :
  - Node 24 (image `verification` de l'archive LF) : unitaires 203/203 suites, 2 947 tests (1 ignoré) ; e2e 13/13 suites, 272 tests ; **`test:conformite` 18/18 suites, 116 tests**
    (dont `personnesACharge` écrit, relu, une ligne d'avant 348 lue `null`, 100 refusé par le schéma).
  - Node 25 : domaine et service de la rémunération 137/137 (5 suites), e2e de la base 30/30 (dont 5 du calcul et 7 de
    `personnesACharge`) ; la suite complète ne rougit que des 18 suites connues (client Kafka natif, paquets de dépôt
    en CRLF), aucune de la rémunération.
  - **Mutations 15/15 rouges sur une assertion** : aiguillage (dirigeant au régime salarié), `cnss.tauxEmployeur` en
    dur, taux de l'AMU en dur, plancher retiré, plafond chiffré ignoré, plafond supposé absent sans lire `deplafonnee`,
    AMU retirée de la base de l'IRPP, AMU retirée du calcul, personnes à charge à zéro par défaut, échéance au 15 en
    dur, parts au franc inférieur, retenue au franc supérieur, cohérence des branches non contrôlée, IRPP du dirigeant
    sur la base des salariés, `personnesACharge` toujours porté au document.
  - Cas chiffré à la main (500 000 par mois, 2 personnes à charge) : cotisations 112 500 employeur / 45 000 salarié
    (dont AMU 25 000 + 25 000) ; IRPP annuel 132 100, retenue du mois 11 008 ; plancher : 40 000 ⇒ 52 500 cotisables.
    Témoin d'empreinte : la base d'avant 348 garde `sha256:690bbda8…95ce` (calculée par le code d'`origin/dev`).
  - §1.5 : `docker compose -p grp-d` du fiscal (image runtime de l'archive LF) sain, `GET …/calcul` montée, 401 sans jeton, 0 `UnknownDependencies` sur 444 lignes de journal
  - Lint des fichiers touchés, `tsc`, `nest build` : 0.
- **Ce qui reste** : `cnss.collecte` au paquet (→ C, D-348-9) ; le refus sourcé du dirigeant (STORY-364, la suivante) ;
  Q-D-22 et la relecture du bloc `cnss` par un fiscaliste (geste de l'utilisateur, plan §8) ; l'écran du calcul et le
  champ à la saisie (→ A, plus tard) ; les totaux pour 350 (C).
