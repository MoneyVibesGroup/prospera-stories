# STORY-547 : Conversion des comptes d'une filiale étrangère — trois taux, et l'écart va en capitaux propres

Status: review

**Épic :** EPIC-140 — Conversion des comptes des entités étrangères
**Service :** `bilan-service` — module `consolidation` (aucun contrat d'événement : **un seul dépôt**)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** ⛔ **STORY-489** (la devise au contrat de balance) · **STORY-490** · **STORY-495** (les cours et leur source)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

C'est la story qui **relie la consolidation à toute la trajectoire internationale** : dès qu'une
filiale tient ses comptes dans une autre monnaie — Guinée en GNF, Ghana en GHS, Nigeria en NGN, une
holding en EUR — ses états doivent être **convertis** avant d'être agrégés.

⛔ **Et elle est structurellement bloquée aujourd'hui** : le contrat canonique de balance **ne porte
aucune devise** ([[STORY-489]]). Deux balances de monnaies différentes y sont **additionnables sans
qu'aucun contrôle ne s'en aperçoive** — ce qui, dans un module de consolidation, est le mode de panne
le plus coûteux imaginable.

## La méthode du cours de clôture — trois taux, pas un

| Élément | Taux |
|---|---|
| Actifs et passifs | **cours de clôture** |
| Charges et produits | **cours moyen de la période** |
| Capitaux propres | **cours historique** (celui de leur constitution) |

⇒ **Le bilan converti ne s'équilibre plus.** L'écart n'est ni un gain ni une perte : c'est un
**écart de conversion**, qui va **en capitaux propres** et **ne passe jamais par le résultat** tant
que la filiale reste au périmètre.

⚡ **C'est le point le plus contre-intuitif de la story** — et le passer au résultat, réflexe naturel
puisque l'écart ressemble à une différence de change, ferait varier le résultat consolidé au gré des
cours sans qu'aucune opération n'ait eu lieu.

## Critères d'acceptation

- [ ] AC-1 — La devise de chaque entité vient du **contrat de balance** (STORY-489), jamais d'un
      paramètre d'écran. ⛔ Une entité sans devise déclarée **bloque la consolidation**, elle ne
      prend pas celle du groupe par défaut.
- [ ] AC-2 — Les **trois taux** sont appliqués selon la nature de l'élément. Un seul taux appliqué
      partout est refusé par un test.
- [ ] AC-3 — Les cours sont **saisis avec leur source et leur date** ([[STORY-495]] AC-2). ⚡ Le
      produit ne s'abonne à aucune source de taux : *un cours automatique sans source opposable
      aurait l'air juste*.
- [ ] AC-4 — ⛔ **L'écart de conversion va en capitaux propres, sur une ligne dédiée, et JAMAIS au
      résultat.** Test explicite : faire varier le cours de clôture ne doit **pas** changer le
      résultat consolidé.
- [ ] AC-5 — La **part minoritaire de l'écart de conversion** revient aux minoritaires
      ([[STORY-544]]).
- [ ] AC-6 — La méthode du **cours historique** (filiale non autonome, prolongement de l'activité de
      la mère) est **déclarée par entité**, pas déduite. ⚠️ Elle donne un résultat différent, et le
      choix appartient au groupe.
- [ ] AC-7 — Un groupe **mono-devise ne change pas d'un octet** : aucune conversion, aucune ligne
      d'écart. Non-régression obligatoire.

## Notes

- Voir [[STORY-489]] (le blocage réel), [[STORY-495]], [[STORY-544]], [[STORY-492]].

---

# Cadrage — fait AVANT toute ligne de code

Sources : l'**AUDCIF**, art. 87 ; le **SYSCOHADA révisé**, édition officielle — D4C, titre XII, **ch. 4** « Conversion des
états financiers des entités étrangères », sections 1 à 5 (p. 1160-1164, relues sur l'OCR de l'édition officielle) ; le
code de `bilan-service` (`dev` @ `1402264`, STORY-546 comprise) et de `balance-service` (STORY-489, 495) ; les fiches
STORY-489, 490, 495, 541 à 546.

## Les constats mesurés

### M1 — ⛔ Aucune liasse ne peut aujourd'hui porter une autre devise que le XOF

`balance-service` : `DEVISES_SUPPORTEES = ['XOF']` (D-489-3, toujours en place) — le DTO de soumission et l'ingestion
refusent tout autre code. La devise d'une liasse arrive par le read-model (`deviseDuDocument`) : un groupe multi-devise
est **inatteignable par l'API** tant que ce registre n'est pas élargi. Même situation que STORY-490 (R-490-1) : la
conversion se prouve à l'unité et, en docker, sur une liasse dont la devise est posée en base — **dit comme tel**, jamais
présenté comme un parcours utilisateur.

### M2 — Aujourd'hui, deux devises refusent l'agrégat… et passent ailleurs sans contrôle

`homogeneite` refuse `409 DEVISES_HETEROGENES` (code OU échelle). Mais le **rapprochement** (`GET …/rapprochement`) et la
**confirmation d'une proposition** lisent les soldes des sociétés appariées **sans aucun contrôle de devise** : deux
balances de monnaies différentes s'y comparent, et la proposition confirmée écrit au journal des montants dans la
devise de la liasse. Et la **mise en équivalence** nomme déjà une associée d'une autre devise (`DEVISE_DIFFERENTE`,
D-546-2).

### M3 — Le texte : DEUX méthodes, et l'écart ne va pas au même endroit

- **Monnaie de présentation** : *« Les comptes des entités étrangères entrant dans le périmètre de consolidation doivent
  être convertis dans la monnaie de présentation des comptes consolidés (entité consolidante) »* (§ 1, p. 1160) ; l'Acte
  uniforme dit laquelle : *« …la conversion en unité monétaire ayant cours légal dans l'Etat partie… »* (art. 87).
- **Méthode du cours de clôture** (§ 3, p. 1162-1163) — filiale autonome : *« les actifs et les passifs monétaires ou non
  monétaires, hors capitaux propres […] au cours de clôture […]. Ce traitement s'applique également aux écarts
  d'acquisition »* ; *« les éléments de capitaux propres […] à leur cours historique mais peuvent également être
  convertis au cours moyen »* ; *« les charges et les produits […] soit au cours de clôture, soit au cours moyen »*.
  *« Les écarts de conversion sont des réserves consolidées qui appartiennent aussi bien au groupe qu'aux associés
  minoritaires »* (§ 3.3).
- **Méthode temporelle, ou du cours historique** (§ 2, p. 1161-1162) — filiale non autonome : éléments **monétaires** au
  cours de clôture ; éléments **non monétaires**, capitaux propres compris, au cours historique (immobilisations,
  amortissements, stocks, avances) ; charges et produits au cours du jour ou moyen, *« sauf pour les dotations aux
  amortissements et aux dépréciations »* (cours historique des immobilisations). ⛔ *« L'écart de conversion qui provient
  de la méthode temporelle […] est affecté au compte de résultat consolidé dans un poste distinct (en charges ou produits
  financiers) »* et *« appartient exclusivement au groupe et ne peut faire l'objet d'une quelconque répartition au profit
  des minoritaires »* (§ 2.3).
- L'Acte uniforme confirme les deux destinations : l'écart est, *« selon la méthode de conversion retenue, inscrit
  distinctement soit dans les capitaux propres consolidés, soit au compte de résultat consolidé »* (art. 87).

⇒ **AC-4 (« JAMAIS au résultat ») vaut pour la méthode du cours de clôture** — celle que la story décrit dans « Le fait ».
Sous la méthode du cours historique, que l'AC-6 fait déclarer, le texte envoie l'écart **au résultat**, au groupe seul :
l'AC-6 le pressentait (*« elle donne un résultat différent »*). AC-4 amendée en ce sens (D-547-7), jamais contre le texte.

### M4 — Le texte ne se ferme pas sur deux méthodes : ce qu'il ajoute

- une monnaie fonctionnelle distincte de la monnaie locale ET de la monnaie de présentation : **deux** conversions
  enchaînées (temporelle puis cours de clôture, § 1) ;
- l'économie **hyperinflationniste** : retraitement par un indice général des prix, puis cours de clôture sur tout (§ 4) ;
- les **comparatifs** N-1 (§ 3.2, § 4) et les **notes** : rapprochement de l'écart à l'ouverture et à la clôture, monnaie
  fonctionnelle, changement de monnaie (§ 5, p. 1164).

### M5 — Le taux des capitaux propres est une ACCUMULATION, pas un cours du jour

Le capital a un cours historique (sa souscription) ; les réserves accumulent des résultats convertis chacun à son cours
moyen. Chaque consolidation est calculée ici indépendamment (liasse figée, journal) : le produit ne relit pas la
conversion de l'exercice précédent. Le « cours historique » d'un compte de réserves est donc celui qui **redonne son
montant converti de la consolidation précédente** — et c'est ce qui fait de l'écart, calculé par différence, le
**stock** d'écart de conversion (cours de clôture) ou la **seule variation de l'exercice** (cours historique, les réserves
converties portant déjà les écarts passés).

### M6 — La cotation : 6 décimales ne suffisent pas dans les deux sens

Le contrat de STORY-495 (cours = unités de tenue pour UNE unité d'origine, 6 décimales réelles, ≤ 10 000) tient pour
EUR → XOF (655,957 — la parité fixe). Dans l'autre sens — une holding en EUR, une filiale en XOF — le cours vaut
0,00152449… : tronqué à 6 décimales, l'erreur relative atteint 3·10⁻⁴, soit des milliers d'euros sur un groupe réel. Le
praticien cote alors **à l'envers** (655,957 XOF pour 1 EUR). La cotation se déclare.

### M7 — L'agrégat se fait APRÈS la conversion ; tout le reste suit sans le savoir

Les soldes de chaque liasse passent par `agreger` (mise à l'échelle au pourcentage d'intégration, contributions par
société), puis par le rapprochement, la mise en équivalence, l'impôt différé, le partage des minoritaires. Convertir la
balance d'une société **avant** — l'écart posé comme une ligne de SA balance convertie — donne tout le reste sans
toucher aucune étape : l'intégration proportionnelle met l'écart à l'échelle ; le partage de 544 attribue chaque
contribution à sa société, donc l'écart sur un compte de capitaux propres à ses minoritaires (AC-5) ; la preuve d'impôt
de 545 relit les contributions converties de chaque société et absorbe tout écart dans l'impôt propre aux comptes
individuels. Une seule exception : l'écart **au résultat** de la méthode temporelle, que le partage doit écarter
(§ 2.3).

### M8 — Ce que la conversion des SOLDES ne convertit pas

- **L'écart de première consolidation** (543) d'une société convertie : figé dans la devise du groupe à son entrée —
  quand le texte veut son écart d'acquisition *« au cours de clôture »* (§ 3.2) ;
- **une associée** d'une autre devise (546) : sa valeur se calcule sur SA liasse, que rien ne convertit ;
- **les écritures déclarées** du journal (éliminations, retraitements, résultats internes) : saisies par le cabinet,
  en montants — la devise dans laquelle il les saisit n'est écrite nulle part.

### M9 — Les bornes

Une déclaration par société et par exercice (≤ 100 sociétés) ; lue parmi les écritures actives de l'exercice, déjà
bornées (`ECRITURES_PAR_CONSOLIDATION_MAX`). La conversion est linéaire dans les lignes de soldes, déjà bornées
(`LIGNES_AGREGEES_MAX`) ; chaque compte cherche sa plus longue racine parmi ≤ 50 racines déclarées.

## Les décisions

**D-547-1 — La monnaie de présentation est la devise de la liasse de la MÈRE** (art. 87 : l'unité monétaire ayant cours
légal dans l'État partie ; § 1 : l'entité consolidante). Aucune monnaie de présentation choisie (hook).

**D-547-2 — Qui se convertit.** Une société intégrée dont la liasse porte un **code** de devise différent de celui de la
mère. Même code, échelles différentes : `409 DEVISES_HETEROGENES`, inchangé (un changement d'échelle n'est pas une
conversion). ⛔ **AC-7** : un groupe dont toutes les liasses portent la même devise ne change pas d'un octet — aucune
conversion, aucune ligne d'écart, les mêmes chiffres, les mêmes contrôles ; seul `CONVERSION` passe `APPLIQUE` d'office
(comme 544, 545, 546 pour un groupe qui n'a rien à traiter), et la vue `conversion` est vide.

**D-547-3 — AC-1 : la devise déclarée, ou rien.** Dans un groupe **multi-devise**, chaque société intégrée — mère
comprise — doit porter une devise **déclarée** sur sa balance (`BALANCE_DECLAREE`, STORY-489) : sinon `409
CONVERSION_IMPOSSIBLE` (motif `DEVISE_NON_DECLAREE`, sociétés nommées). Jamais la devise du groupe par défaut. Un groupe
mono-devise sous convention reste ce qu'il est (AC-7) — limite nommée : une balance héritée « XOF » d'une filiale qui
tiendrait en réalité une autre monnaie ne se voit pas.

**D-547-4 — La déclaration de conversion (AC-3, AC-6).** Par exercice de la mère et par société, nature `CONVERSION` au
journal, justification obligatoire, **une active** (index unique partiel), annulable, jamais réécrite. Elle porte :

- `methode` : `COURS_DE_CLOTURE` | `COURS_HISTORIQUE` — **déclarée**, jamais déduite (AC-6) ;
- `cotation` : `GROUPE_PAR_SOCIETE` (unités de la devise du groupe pour UNE unité de la devise de la société) |
  `SOCIETE_PAR_GROUPE` (l'inverse) — une pour tous ses cours (M6) ;
- `coursCloture`, `coursMoyen`, et `coursHistoriques[]` (au plus 50, chacun sur une **racine** de comptes, sans doublon) —
  chaque cours : `valeur` (contrat de STORY-495 : > 0, ≤ 10 000, au moins un millionième, 6 décimales réelles —
  `400 COURS_INVALIDE`), `date` au calendrier, `source` en texte libre **obligatoire**. ⚡ Le produit ne s'abonne à aucune
  source de taux.
- Dates : clôture et moyen **dans** l'exercice de la mère, historique **au plus tard** sa clôture (`400
  DATE_COURS_HORS_EXERCICE`) ; un cours de clôture qui n'est pas du dernier jour est accepté et **signalé**
  (`COURS_NON_DATE_A_LA_CLOTURE`, repris de STORY-495 N1).
- **Figées à la déclaration** : la devise de la société et celle du groupe, lues sur leurs liasses figées. Des cours
  déclarés pour EUR → XOF ne s'appliquent jamais à une liasse devenue GNF : l'agrégat nomme la déclaration à refaire
  (`CONVERSION_A_REDECLARER`).
- Refus à la déclaration : société non intégrée (`409 SOCIETE_NON_CONVERTIBLE` — mère, mise en équivalence, hors
  périmètre, hors groupe) ; liasse de la société ou de la mère manquante (`409 SOURCES_INCOMPLETES`) ; même devise que le
  groupe (`409 CONVERSION_SANS_OBJET`) ; devise non déclarée (`409 DEVISE_NON_DECLAREE`) ; déjà déclarée (`409
  CONVERSION_DEJA_DECLAREE`, nommée).

**D-547-5 — Le taux de chaque compte (AC-2).** Le cours historique de la **plus longue racine déclarée** qui préfixe le
compte ; sinon, compte de gestion (racines de gestion du paquet des liasses) → **cours moyen** ; sinon → **cours de
clôture**. La méthode borne les racines historiques (règle lue dans le paquet, D-547-10) : `COURS_DE_CLOTURE` — des
capitaux propres seulement (racines publiées depuis 544) ; `COURS_HISTORIQUE` — tout compte non monétaire, dotations
comprises. Sous les deux, **tout compte de capitaux propres non soldé est couvert** (`COURS_HISTORIQUE_MANQUANT`, comptes
nommés). Le cours historique d'un compte de réserves est celui qui redonne son montant converti précédent (M5 — Swagger
le dit).

**D-547-6 — L'arithmétique.** `converti = solde net × cours × 10^(e_groupe − e_société)` — ou `÷ cours` sous
`SOCIETE_PAR_GROUPE` —, **exact** en `bigint`, arrondi **une fois par compte** au plus proche, demi-unité éloignée de zéro
(la règle de STORY-495). Hors des entiers sûrs : `422 AGREGAT_HORS_BORNES`.

**D-547-7 — L'écart (AC-4 amendée).** `écart = déséquilibre hérité de la liasse × cours de clôture − Σ convertis` —
l'arrondi des comptes y va, jamais ailleurs ; une liasse équilibrée donne une balance convertie équilibrée, une liasse
déséquilibrée garde son déséquilibre (converti), que le contrôle `EQUILIBRE` continue de voir. L'écart est une **ligne de
la balance convertie** de la société, sur le compte que la méthode désigne :

- `COURS_DE_CLOTURE` → `compteEcartConversion` (un compte de **capitaux propres**) : ⛔ **jamais au résultat**, et faire
  varier le cours de clôture ne change pas le résultat consolidé (test explicite) ;
- `COURS_HISTORIQUE` → `compteEcartConversionResultat` (un compte **de gestion**, le poste financier distinct du § 2.3).

**D-547-8 — Les minoritaires (AC-5).** Cours de clôture : l'écart est une contribution de la société sur un compte de
capitaux propres — le partage de 544 en donne leur part à ses minoritaires, sans une ligne de code de plus (§ 3.3).
Cours historique : **au groupe seul** (§ 2.3) — le partage écarte cette contribution.

**D-547-9 — Où la conversion s'applique.** Sur les soldes des liasses figées, **avant tout calcul**, par une seule
fonction et sur les trois chemins qui lisent des soldes : l'agrégat, le rapprochement, la confirmation d'une proposition
(M2). Le rapprochement et la confirmation lisent la liasse de la mère pour connaître la devise du groupe ; sans elle, ils
restent ce qu'ils sont quand toutes les sociétés appariées ont la même devise et qu'aucune n'a de conversion déclarée,
et refusent sinon (`409 DEVISE_DU_GROUPE_INCONNUE`). ⚡ Une proposition confirmée **fige la devise de ses lignes** ;
l'agrégat refuse une proposition confirmée dans une autre devise que celle du groupe (`409
ECRITURE_DANS_UNE_AUTRE_DEVISE`, nommée — à annuler et reconfirmer). Le **journal se tient dans la devise du groupe** :
une écriture déclarée sur une société étrangère l'est en montants convertis (Swagger le dit — M8, rien ne le vérifie).

**D-547-10 — Le paquet `consolidation-audcif@1.4`.** 1.3 plus une clé `conversion` : par méthode, les comptes que le
cours historique peut couvrir (`CAPITAUX_PROPRES` | `TOUS`), la destination de l'écart (`CAPITAUX_PROPRES` |
`RESULTAT`) et son partage avec les minoritaires — **lus** par le moteur, jamais codés (art. 87 : « selon la méthode
retenue ») —, et les fondements verbatim (art. 87 ; D4C ch. 4, p. 1160 à 1164). Un paquet sans cette clé : conversion
impossible (`REGLES_CONVERSION_INDISPONIBLES`).

**D-547-11 — Les comptes.** Au référentiel de méthodes du groupe : `compteEcartConversion` et
`compteEcartConversionResultat`, facultatifs et indépendants, distincts de tous les comptes de consolidation
(`COMPTES_CONSOLIDATION_CONFONDUS`). Exigés dès qu'une société se convertit selon la méthode qui les désigne ; de la bonne
nature (capitaux propres / gestion) ; qu'aucune liasse ne mouvemente (`COMPTE_ECART_CONVERSION_NON_DECLARE`,
`_INVALIDE`, `_DEJA_MOUVEMENTE`).

**D-547-12 — Refus ou manque.** Une conversion impossible **refuse l'agrégat** — `409 CONVERSION_IMPOSSIBLE`, TOUS les
motifs d'un coup dans `details.manques` : additionner une balance non convertie est le mode de panne que la story existe
pour fermer (« aucune addition silencieuse »). Ce qu'elle ne convertit pas **(M8)** se nomme en **manque**, l'agrégat
calculé, `CONVERSION` `NON_TRAITE` : `ECART_PREMIERE_CONSOLIDATION_NON_CONVERTI` (un écart actif sur une société
convertie reste au cours de son calcul), `ASSOCIEE_NON_CONVERTIE`.

**D-547-13 — Le traitement.** `CONVERSION` est `APPLIQUE` si et seulement si aucun manque — un groupe mono-devise l'est
d'office (D-547-2). La vue `conversion` publie la devise du groupe, et pour chaque société convertie : sa devise, la
méthode, la cotation, la déclaration citée, les cours avec leur source et leur date, l'écart (compte, montant,
destination, partagé ou non) et **chaque compte** — taux retenu (`CLOTURE` / `MOYEN` / `HISTORIQUE` et sa racine),
solde d'origine, solde converti : l'écart se recompose depuis la réponse.

**D-547-14 — Routes et rôles.** `GET|POST …/consolidation/exercices/:exerciceId/conversions`,
`POST …/conversions/:ecritureId/annulation` — `TENANT_ADMIN`, `TENANT_USER` ; les méthodes du groupe acceptent les deux
comptes ; `GET …/agregat` publie `conversion`.

**D-547-15 — Bornes.** Aucune lecture nouvelle non bornée : les déclarations sont lues parmi les écritures actives de
l'exercice ; la liasse de la mère, sur le rapprochement et la confirmation, dans le même lot que les autres.

## Hors périmètre — hooks inertes documentés

- **L'écart de première consolidation** d'une société convertie au cours de clôture (§ 3.2) et **une associée** d'une
  autre devise : nommés en manque (D-547-12) — à ficher.
- **Deux conversions enchaînées** (monnaie fonctionnelle distincte des deux autres), **hyperinflation** (§ 4), **monnaie
  de présentation choisie** (§ 3.1) : non déclarables.
- **Présentation et notes** (STORY-548) : poste « Écarts de conversion », rapprochement de l'écart à l'ouverture et à la
  clôture, sa variation de l'exercice, comparatifs N-1 (§ 5).
- **Ouverture du registre des devises** (`DEVISES_SUPPORTEES`, `balance-service`, D-489-3) : décision PO — jusqu'à elle,
  la conversion est inatteignable par l'API (M1).

## Progress Tracking

- 2026-09-29 — branches `MNV-547` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`) **avant
  toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-29 — **cadrage** : 9 constats, 15 décisions. AC-4 amendée par le texte (M3) : l'écart de la méthode temporelle
  va au résultat, au groupe seul ; le rapprochement et la confirmation lisaient des soldes sans contrôle de devise (M2).
- 2026-09-29 — **dev** (`bilan-service` `b27d7ff`, `49d3dcf`) : module pur `conversion.regles.ts` (cotation, taux par compte,
  arithmétique exacte, écart posé sur la balance CONVERTIE, plan et manques), conversion des soldes avant tout calcul sur
  les trois chemins (agrégat, rapprochement, confirmation — ces deux derniers ne contrôlaient aucune devise), partage des
  minoritaires qui écarte l'écart de la méthode temporelle (§ 2.3), journal `CONVERSION` (index unique partiel) et ses
  trois routes, deux comptes d'écart aux méthodes du groupe, `consolidation-audcif@1.4`, vue `conversion` de l'agrégat.
  La garde de STORY-490 (« aucune conversion nulle part ») bornée, nommément, au seul module qui convertit.
- 2026-09-29 — **tests** écrits par 5 sous-agents `opus` sur des fichiers disjoints (≈ 1 000 tests ajoutés : règles pures,
  service, DTO/schéma/contrôleur, référentiel, e2e) ; **défauts trouvés et corrigés** :
  - ⛔ le rapprochement et la confirmation ne comparaient que le CODE des devises : une filiale XOF/0 appariée à une mère
    XOF/2 était rapprochée à cent fois sa valeur — même garde d'échelle que l'agrégat (`2ce6992`) ;
  - ⛔ la table des sources de 1.4 (recopiée de 1.3) ne couvrait ni l'art. 87 de l'AUDCIF (p. 42) ni les p. 1159 à 1164 du
    D4C, et nommait « Retraitements » le chapitre 4 : relu sur l'édition officielle (pages de garde p. 1149 et 1159), les
    retraitements sont le chapitre 3 et la conversion le chapitre 4. 1.4 corrige la table et les cinq fondements des
    impôts différés qui citaient « ch. 4 » (erreur héritée de STORY-545) ; 1.2 et 1.3 restent telles que publiées
    (`1917319`) ;
  - la vue de l'agrégat recopiait les cours relus du journal par étalement (liste blanche) ; la doc du 400
    `DATE_COURS_HORS_EXERCICE` annonçait `details.champ` ; l'inventaire des codes ne balayait pas le nouveau contrôleur ;
    les sociétés d'un compte d'écart déjà mouvementé non triées.
- 2026-09-29 — **table de mutations 37/37 tuées** (`tmp/mutation-547/`) : racine la plus longue, un seul taux (AC-2),
  cotation, échelle, arrondi, écart omis, hérité ignoré, écart temporel partagé (§ 2.3), exclusion du partage, AC-1 mère
  exemptée, paire, destination codée en dur, cours historique hors capitaux propres, manques jamais levés, alerte de date,
  contrat des cours, propositions d'une autre devise, `CONVERSION` d'office, devise non figée, dates, conversion sans
  objet, devise non déclarée, course, échelles au rapprochement, rapprochement non converti, devise du groupe, AC-7
  (groupe mono-devise planifié), manques 543 et associée, `TENANT_USER`, index, méthode en trop au paquet, conversion
  implicite du DTO. Trois mutants d'abord non compilables réécrits avant d'être comptés.
- 2026-09-29 — **portes** : lint 0, build OK, 9 825 unitaires, 2 363 e2e (un chronomètre de 5 s d'`openapi-contract`
  rougit sous charge — load ≈ 21 —, vert seul : 508/508), couverture 99,37 / 96,73 / 99,59 / 99,45.
- 2026-09-29 — **vérification docker sur stack NEUVE** (`tmp/verif-docker-547/`) : **276 verdicts OK, 0 KO**. ⚠️ Une seule
  écriture directe en base, dite comme telle : la devise des snapshots des deux filiales (GHS, NGN) — `balance-service`
  n'accepte que le XOF (M1) ; la mère et la sœur portent un XOF DÉCLARÉ par l'API. Attentes recalculées depuis les soldes
  injectés : FILLE_G au cours de clôture (trois taux servis, écart en capitaux propres, 40 % aux minoritaires), FILLE_N au
  cours historique en cotation inverse (écart au résultat, part des minoritaires = 1/5 du résultat HORS écart), résultat
  consolidé 419 062 700 identique quand la clôture passe de 36,9 à 38,45 (AC-4) ; AC-1 (devise non déclarée nommée) ;
  course de deux déclarations tranchée par l'index réel ; rapprochement MÈRE ↔ FILLE_G dans la devise du groupe, devise
  XOF/2 figée sur l'élimination confirmée ; écart 543 sur FILLE_N ⇒ `NON_TRAITE` nommé ; AC-7 (groupe mono-devise :
  section vide, contributions = soldes injectés) ; cloisonnement 404. Statut `in_progress` → `review`.

