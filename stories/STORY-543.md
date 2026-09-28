# STORY-543 : Écart de première consolidation — écarts d'évaluation d'abord, écart d'acquisition ensuite, et jamais l'inverse

Status: in_progress

**Épic :** EPIC-138 — Écarts d'acquisition et intérêts minoritaires
**Service :** `bilan-service` — module `consolidation` (aucun contrat d'événement : **un seul dépôt**)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-530** (le périmètre, les % et les dates d'entrée)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

À l'entrée d'une filiale au périmètre, le **coût d'acquisition des titres** ne vaut presque jamais la
**quote-part de capitaux propres** acquise. La différence est l'**écart de première consolidation**,
et elle se décompose **dans cet ordre** :

```
Coût d'acquisition des titres
− quote-part de capitaux propres comptables acquis
= ÉCART DE PREMIÈRE CONSOLIDATION
      ├── ÉCARTS D'ÉVALUATION   → affectés aux actifs et passifs IDENTIFIABLES
      │                            (terrain sous-évalué, marque, provision omise…)
      │                            ⇒ ils SUIVENT le sort de l'élément qu'ils portent :
      │                              un écart sur un bien amortissable s'AMORTIT
      └── ÉCART D'ACQUISITION   → le résidu, non affectable
```

⛔ **L'ordre n'est pas une préférence.** Tout mettre en écart d'acquisition — le réflexe — évite
d'amortir les écarts d'évaluation portant sur des biens amortissables, et **surévalue le résultat
consolidé de tous les exercices suivants**.

⚠️ **Et en SYSCOHADA, l'écart d'acquisition positif s'AMORTIT** sur sa durée d'utilisation — ce n'est
pas IFRS, où il fait l'objet d'un test de dépréciation. Appliquer la règle IFRS ici produirait un
résultat consolidé faux, régulièrement, et de façon défendable en apparence.

## Critères d'acceptation

- [ ] AC-1 — L'écart de première consolidation est calculé **à la date d'entrée au périmètre**
      (STORY-530 AC-1), sur les capitaux propres **retraités** (STORY-541), jamais sur les comptes
      individuels bruts.
- [ ] AC-2 — Les **écarts d'évaluation sont saisis et affectés élément par élément**, avec leur
      justification. ⛔ Le produit **ne les devine pas** — c'est une évaluation, comme une provision
      technique : il **héberge** l'affectation et sa méthode.
- [ ] AC-3 — Un écart d'évaluation portant sur un bien **amortissable** génère un **amortissement
      complémentaire** chaque exercice, automatiquement, jusqu'à la sortie du bien.
- [ ] AC-4 — L'**écart d'acquisition positif** est **amorti** sur une durée déclarée — règle
      SYSCOHADA, publiée par le référentiel, **jamais codée**. ⛔ Test de mutation : changer la durée
      au référentiel doit changer la dotation.
- [ ] AC-5 — Un **écart d'acquisition négatif** est traité selon la règle du référentiel (reprise au
      résultat), et **il est signalé** : un écart négatif significatif traduit le plus souvent une
      **erreur d'affectation des écarts d'évaluation**, pas une bonne affaire.
- [ ] AC-6 — L'écart est **figé à la date d'entrée** : il ne se recalcule pas quand les capitaux
      propres de la filiale évoluent. Test de rejeu sur trois exercices.
- [ ] AC-7 — La **part des minoritaires** dans les écarts d'évaluation est traitée selon la méthode
      déclarée, et l'écart d'acquisition suit ([[STORY-544]]).

## Notes

- Voir [[STORY-530]], [[STORY-541]], [[STORY-544]], [[STORY-545]].

---

# Cadrage — fait AVANT toute ligne de code

Sources : **AUDCIF 2017** (titre des comptes consolidés) et le chapitre « comptes consolidés » du **SYSCOHADA
révisé** — citations et renvois consignés en M4 ; pour comparaison seulement, le règlement CRC 99-02 (§ 21) et
ANC 2020-01, dont le SYSCOHADA révisé s'écarte sur l'écart d'acquisition ; le code de `bilan-service` (`dev` @
`8fb50c0`) et de `dossier-service` (liens de participation, STORY-530) ; les fiches STORY-530, 531, 541, 542,
544, 545.

## Les constats mesurés

### M1 — Aujourd'hui, RIEN n'élimine les titres : l'agrégat compte deux fois la même richesse

Chaque consolidation repart des liasses figées (531, D-531-3) : les **titres** de la filiale restent dans la
liasse du détenteur (un compte `26…` à 100 %) **et** les **capitaux propres** de la filiale restent dans la
sienne. L'agrégat les additionne — l'actif du groupe porte à la fois le prix payé et ce qu'il a acheté.
STORY-542 l'a nommé (M1 : « les titres de la mère contre le capital de la filiale […] l'élimination des titres de
STORY-543 ») sans rien éliminer ; le traitement `ECART_PREMIERE_CONSOLIDATION` est publié `NON_TRAITE`, requis.
⇒ L'**élimination des titres contre les capitaux propres acquis** est le geste de cette story : l'écart de
première consolidation n'en est que le solde. Et comme les liasses ne la portent jamais, elle se **rejoue à
l'identique chaque exercice**, depuis des paramètres figés — le patron des résultats internes (542, M4).

### M2 — Le périmètre connaît l'acquisition — sauf la date d'entrée d'une détention indirecte

Chaque société retenue au périmètre arrêté (531, read-model `perimetres_arretes`) porte ses **liens retenus** —
ceux qui la font entrer au groupe (530, AC-1) : `lienId`, détenteur (la mère ou une société **contrôlée** : le
producteur n'en retient pas d'autre), **part de capital** du lien (`pctInteret`, points de base) et `dateEffet`.
Un lien est **immuable** côté `dossier-service` (garde de schéma : `pctInteret` et `dateEffet` ne se réécrivent
pas) : un changement de pourcentage **ferme** le lien et en ouvre un autre. Deux conséquences :
- un bloc de titres = **un lien** : la mère à 50 % et une fille à 20 % d'une même société, ce sont deux
  acquisitions, deux coûts, deux écarts ;
- ⚠️ **la date d'effet d'un lien n'est pas toujours la date d'entrée au groupe** : quand la mère achète en 2025
  une fille qui détenait depuis 2010 une petite-fille, la petite-fille entre au groupe en **2025**, pas en 2010 —
  calculer son écart en 2010 imputerait au groupe quinze ans d'amortissements qui ne sont pas les siens.

### M3 — Trois choses que le produit ne sait pas, et ne doit pas deviner

1. **Le coût d'acquisition des titres** : le compte `26…` du détenteur mêle ses participations (filiales, sociétés
   mises en équivalence, titres hors groupe) — aucune donnée ne dit quelle part correspond à quel lien.
2. **Les capitaux propres à la date d'entrée** : aucune liasse n'existe à une date quelconque (une entrée au
   30 juin), et une acquisition ANCIENNE — le cas de tout groupe qui arrive dans le produit — précède de loin la
   première liasse qu'il contient. Le chiffre est dans le tableau d'acquisition du cabinet.
3. **Les écarts d'évaluation** (AC-2) : une juste valeur est une évaluation (expertise, valeur de marché), comme
   une provision technique — le produit **l'héberge** avec sa justification, il ne la produit pas.

⇒ Ces trois montants se **déclarent** ; le produit **calcule** tout le reste, dans l'ordre du titre, et le
**rejoue** chaque exercice.

### M4 — Les textes, lus à l'image sur l'édition officielle — et quatre arbitrages

Sources : AUDCIF 2017, JO OHADA n° spécial du 15/02/2017 (biblio.ohada.org, `explnum_id=2061`) ; Système
comptable OHADA révisé, 2ᵉ partie « Dispositif comptable relatif aux comptes consolidés et combinés » (D4C),
titre XII, chapitre 6, p. 1181-1187 (`explnum_id=2063`). Pour comparaison seulement : CRC 99-02 (§ 2110 à
21131), ANC 2020-01 (art. 231-9 à 232-1), IFRS 3.

- **AUDCIF art. 82** (JO p. 41) : *« L'écart de consolidation est constaté par différence entre le coût
  d'acquisition des titres […] et la part des capitaux propres que représentent ces titres […], y compris le
  résultat de l'exercice réalisé à la date d'entrée de l'entité dans le périmètre de consolidation. L'écart de
  consolidation d'une entité est, en priorité, réparti dans les postes appropriés du Bilan consolidé sous forme
  d'écarts d'évaluation ; la partie non affectée […] est inscrite à un poste particulier d'actif ou de passif
  […] constatant un écart d'acquisition. L'écart non affecté est rapporté au compte de résultat, conformément à
  un plan d'amortissement ou de reprise de provisions. »* — l'ordre du titre est le TEXTE (« en priorité »).
- **D4C, ch. 6, section 3** (p. 1184) — les capitaux propres retenus : *« le capital ; les primes […] ; les
  écarts de réévaluation ; les réserves indisponibles et libres ; les reports à nouveau ; le résultat de
  l'exercice réalisé à la date d'entrée »* ; ch. 5 § 4.1 : ils se prennent sur les comptes *« retraités en
  fonction des règles du groupe »* (AC-1).
- **Date d'acquisition** (p. 1183) : *« la date de prise de contrôle […] et donc la date d'entrée dans le
  périmètre »* — par achats successifs, la date où le contrôle est obtenu.
- **Écart positif** (§ 5.1.2.1, p. 1185-1186) : *« amorti linéairement sur la limite prévisible de cette durée
  déterminée par l'entité. Si la durée d'utilité ne peut être déterminée de manière fiable, l'écart d'acquisition
  sera amorti sur 10 ans. Par contre, lorsque la durée d'utilité est non limitée, l'écart d'acquisition ne fait
  pas l'objet d'amortissement. »* ; § 5.1.2.2 : test de dépréciation annuel obligatoire, dépréciation jamais
  reprise.
- **Écart négatif** (§ 5.2, p. 1186) : *« rapporté au résultat sur une durée qui doit refléter les hypothèses
  retenues et les objectifs fixés lors de l'acquisition »* ; *« Avant de comptabiliser un profit sur une
  acquisition à des conditions avantageuses, l'acquéreur doit vérifier s'il a correctement [identifié] tous les
  actifs acquis et les passifs repris. »* — c'est l'AC-5, écrit par le texte.
- **Minoritaires** (section 4, p. 1184-1185) : *« Ces écarts appartiennent aux actionnaires majoritaires et
  minoritaires »* — réévaluation à 100 %, partagée ; *« En cas d'intégration proportionnelle, seule la part du
  groupe sera retraitée »* ; l'écart d'acquisition ne porte que sur la part du groupe (section 1).
- **Impôt** (section 1) : *« Tous les écarts d'évaluation donnent lieu à une imposition différée »* ; *« Il n'y a
  pas d'impôt différé sur l'écart d'acquisition. »*
- **Période d'évaluation** (section 2, p. 1183) : 12 mois à compter de la date d'acquisition.
- **Entité contrôlée depuis plusieurs exercices** (section 6, p. 1187) : les valeurs se déterminent *« comme si
  cette première consolidation était intervenue effectivement à la date de la prise de contrôle […] après […]
  amortissement de l'écart d'acquisition »* — c'est le report en réserves de M8. **Art. 83** : un écart non
  ventilable par ancienneté *« peut être imputé directement en résultat consolidé »*.
- Entrée en vigueur pour les comptes consolidés : **1er janvier 2019** (art. 113, relevé sur la transcription
  LegalRDC, identique au JO sur les art. 79, 82, 83 et 97).

**Les arbitrages** :
1. ⛔ **L'écart positif s'amortit TOUJOURS.** Le D4C admet un non-amortissement (durée d'utilité non limitée) ;
   l'Acte uniforme, norme supérieure, impose *« un plan d'amortissement »* (art. 82 al. 3), et c'est le fait de
   la story (« en SYSCOHADA, l'écart d'acquisition positif s'AMORTIT »). Le non-amortissement n'est pas offert.
2. **« Une durée déclarée » (AC-4) est celle de l'ENTITÉ ; le référentiel publie la règle et la durée de repli**
   (10 ans, quand la durée d'utilité ne peut être déterminée de manière fiable) — changer ce défaut au
   référentiel change la dotation (le test de mutation de l'AC-4). Aucun maximum n'est écrit : aucun n'est codé.
3. **L'écart négatif est repris ÉTALÉ**, sur une durée que le texte ne chiffre pas : elle se déclare, exigée si
   l'écart calculé est négatif. Le passif qui le porte (« reprise de provisions ») est déclaré par le cabinet :
   le modèle de bilan n'a pas de ligne dédiée.
4. **La réévaluation TOTALE est la méthode du D4C** ; la partielle reste déclarable (AC-7 : « selon la méthode
   déclarée ») et s'impose en intégration proportionnelle — et quand une société est détenue par plusieurs liens
   (M5, D-543-3).
Non transcrits, nommés : le test de dépréciation annuel, l'art. 83, le verrou de la période de 12 mois.

### M5 — La part des minoritaires dans les écarts d'évaluation : deux méthodes, et l'intégration proportionnelle n'en a pas

Filiale détenue à `p` : ses actifs s'agrègent à **100 %** (intégration globale). Réévaluer un terrain « à 100 % »
reconnaît au bilan consolidé la juste valeur ENTIÈRE, dont la part `(1 − p)` revient aux minoritaires
(**réévaluation totale**) ; le réévaluer « à `p` » ne reconnaît que la part du groupe (**réévaluation
partielle**). Dans les deux cas l'écart d'acquisition est le MÊME — `coût − p × (capitaux propres + écarts
d'évaluation)` : l'écart d'acquisition est celui du groupe, les minoritaires n'en portent pas (AC-7 : « l'écart
d'acquisition suit »). ⚠️ En **intégration proportionnelle**, la société n'est agrégée qu'à `p` : il n'y a pas
de minoritaires, seule la réévaluation à `p` a un sens.

### M6 — L'agrégat met toute écriture à l'échelle du plus faible pourcentage : les titres ne doivent pas l'être

D-542-5 applique chaque écriture au plus faible pourcentage d'intégration des sociétés qu'elle mouvemente. Une
élimination des titres d'une société intégrée PROPORTIONNELLEMENT à 50 % serait ramenée à 50 % — y compris la
ligne des titres, portée à 100 % par un détenteur intégré globalement : la moitié des titres survivrait à
l'élimination. ⇒ Les lignes de l'écart sont calculées **directement à la quote-part du groupe** et
s'appliquent **telles quelles**.

### M7 — Aucun paquet ne publie de règle de consolidation, et le paquet des liasses n'est pas le bon hôte

Les `regles` de `syscohada-revise@2.1` et `@2.2` sont des règles de PRÉSENTATION de la liasse ; ces deux
artefacts sont recopiés **à l'octet** dans `balance-service` (patron STORY-428/535). Y loger la durée
d'amortissement de l'écart d'acquisition ferait bouger l'empreinte de la liasse pour une raison qui n'est pas la
liasse, et forcerait une PR jumelle dans un service qui ne consolide pas. Le programme a déjà tranché ce cas
pour les normes prudentielles, les états DIMF et les états CIMA : **une famille d'artefacts disjointe par
texte** (« trois textes, trois rythmes de révision, trois empreintes »), découverte d'office par la garde des
assets (`meta-complete.spec.ts`).

### M8 — Chaque consolidation repart des liasses : l'écart d'un exercice passé revient en N+1

Comme les résultats internes (542, M4) : en N+1 les titres et les capitaux propres d'entrée sont toujours dans
les liasses — l'élimination se rejoue ; l'amortissement des écarts d'évaluation et de l'écart d'acquisition des
exercices passés a déjà réduit le résultat consolidé de ces exercices — il est **en réserves** à l'ouverture (le
compte de réserves du groupe, D-541-8), jamais une seconde fois en charge. ⛔ Et `dossier-service` n'impose
aucun chaînage des exercices de la mère (542, constat de revue) : **les dates, jamais les rangs**.

### M9 — Les bornes (leçon de STORY-530 et des revues de sécurité de 541/542)

Un écart par lien actif : le nombre d'écarts d'une mère est borné par les liens de l'organisation (2 000), mais
leur report relit le journal de TOUS les exercices passés de la mère, dont le nombre n'est borné nulle part —
le volume (écarts ET éléments évalués) se juge **avant** de charger.

### M10 — Le compte de résultat de l'exercice d'entrée, et le sort de la filiale

L'agrégat additionne la liasse ENTIÈRE de chaque société intégrée (531) : une entrée au 30 juin fait entrer au
résultat consolidé six mois de résultat antérieur à l'acquisition — c'est la **variation de périmètre en cours
d'exercice**, renvoyée par STORY-531 à STORY-548 (AC-3). Les capitaux propres d'entrée, eux, contiennent ce
résultat : l'élimination des titres le neutralise au bilan, pas au compte de résultat. Nommé, pas traité ici.

## Les décisions

**D-543-1 — Un écart par lien retenu, déclaré au dossier de la mère (M1, M2).** Nature `ECART_PREMIERE_CONSOLIDATION`
au journal de consolidation, dans un exercice de la mère où le lien est retenu et où la société détenue est
**intégrée** (globalement ou proportionnellement) — sinon `409 SOCIETE_NON_ELIMINABLE` (mise en équivalence :
STORY-546) ; un lien inconnu de l'arrêté (ou d'un autre cabinet) : `404 LIEN_INTROUVABLE`. ⛔ **Un seul écart
ACTIF par lien, tous exercices de la mère confondus** (index unique partiel — sinon deux déclarations
élimineraient deux fois les mêmes titres) : `409 ECART_DEJA_DECLARE`, l'écart qui l'emporte nommé. Il
s'applique à l'exercice de sa déclaration et à tous les suivants ; **figé** (AC-6) : rien ne s'y recalcule,
annulable avec motif, jamais réécrit.

**D-543-2 — La date d'entrée et la quote-part se LISENT au périmètre, jamais déclarées (AC-1, M2).**
`p` = la part de capital du lien ; **date d'entrée** = la plus tardive de la date d'effet du lien et de la date
d'entrée de son détenteur (la mère : aucune ; une société : la plus ancienne des dates d'entrée de ses liens
retenus), calculée récursivement sur l'arrêté. Elle précède ou tombe dans l'exercice de la déclaration — une
acquisition ancienne se déclare dans le premier exercice que le produit consolide.

**D-543-3 — Ce qui se déclare (M3, AC-1, AC-2, AC-7).**
- le **coût d'acquisition** des titres et le **compte de titres** du détenteur ;
- les **capitaux propres comptables** de la société à la date d'entrée, **compte par compte** (1 à 30 lignes ;
  négatif : solde débiteur) ;
- ⛔ les **retraitements d'homogénéisation** de ces capitaux propres à la date d'entrée, compte par compte et
  justifiés, **ou** leur absence motivée (`SANS_INCIDENCE` | `INCIDENCE_NEGLIGEABLE`) — jamais les deux, jamais
  aucun : c'est la garde de l'AC-1, « jamais sur les comptes individuels bruts » se DIT ;
- les **écarts d'évaluation**, **élément par élément** (1 à 30) : libellé, compte de la société, montant à 100 %
  (positif : il accroît l'actif net), justification — la méthode d'évaluation —, et, pour un bien amortissable,
  ses comptes d'amortissements et de dotations et sa durée RÉSIDUELLE en mois ; **ou** leur absence motivée
  (`CREATION_PAR_LE_GROUPE` | `VALEURS_COMPTABLES_REPRESENTATIVES` | `INCIDENCE_NEGLIGEABLE`). ⛔ Le piège n° 1
  de l'épic — « tout mettre en écart d'acquisition » — ne se commet plus par silence : il se motive ;
- la **méthode** des minoritaires (`REEVALUATION_TOTALE` | `REEVALUATION_PARTIELLE`, AC-7) — la totale est
  refusée en intégration proportionnelle et quand la société a plusieurs liens retenus (`409
  METHODE_MINORITAIRES_INAPPLICABLE`) : deux écarts qui réévaluent chacun à 100 % réévalueraient deux fois ;
- les **comptes de l'écart d'acquisition** : l'écart, ses amortissements et leurs dotations (positif) ; l'écart
  et ses reprises (négatif) — exigés selon le signe CALCULÉ (`400 ECART_INCOHERENT`, motif nommé) ;
- les **durées** de l'écart d'acquisition, déterminées par l'entité (M4) : `dureeAmortissementMois` (positif —
  absente : le défaut publié s'applique) et `dureeRepriseMois` (négatif — exigée faute de défaut publié : `400
  ECART_INCOHERENT` `DUREE_REPRISE_A_DECLARER`) ;
- une justification.

**D-543-4 — Ce que le produit calcule, et dans cet ordre (le titre, AC-1, AC-2).**
1. `K` = capitaux propres comptables + retraitements — les capitaux propres **retraités** à la date d'entrée ;
2. la **quote-part** éliminée, compte par compte : chaque compte à `p`, au plus fort reste (débits et crédits en
   deux colonnes, `plus-fort-reste.ts`) — `QP` est la somme de ce qui est RÉELLEMENT éliminé ;
3. les **écarts d'évaluation** : part du groupe `g = arrondi(p × montant)` ; reconnus au bilan à 100 % (totale)
   ou à `g` (partielle) ; la part des minoritaires d'une réévaluation totale au crédit des réserves de la société ;
4. `Δ = coût − QP` — l'**écart de première consolidation** ;
5. `EA = Δ − Σ g` — l'**écart d'acquisition**, le RÉSIDU. ⛔ Jamais déclaré : le produit ne laisse aucune voie pour
   mettre un montant en écart d'acquisition sans être passé par les écarts d'évaluation.
Tous figés sur l'écriture, avec ce qui les a produits. L'écriture d'entrée est équilibrée par construction.

**D-543-5 — La règle de l'écart d'acquisition est PUBLIÉE par le référentiel, et figée à la déclaration (AC-4,
AC-5, M7).** Nouvelle famille d'artefacts, `consolidation-audcif@1.0` — « règles de consolidation de l'AUDCIF
2017 » —, disjointe du paquet des liasses : générateur, manifeste (empreinte, date d'application), chargeur à
sha256 vérifié, **pont** depuis les référentiels de liasse (`syscohada-revise@2.1`, `@2.2`, `zone-franche-togo@1.0`).
Elle publie, fondements **verbatim** à l'appui (M4) : positif — `AMORTISSEMENT_LINEAIRE`, durée de repli **120
mois** ; négatif — `REPRISE_ETALEE`, sans durée par défaut ; applicable depuis le 2019-01-01. Le référentiel du
groupe est celui de la liasse de la mère pour l'exercice : sans elle, sans règle publiée à cette clôture, ou
paquet illisible, `409 REGLES_CONSOLIDATION_INDISPONIBLES` (`details.raison`) — jamais une durée codée. L'écart
FIGE la règle lue (paquet cité) et le **plan** qu'elle donne à son signe : traitement, durée retenue, **source**
(`DECLAREE` | `DEFAUT_REFERENTIEL`) — le plan d'amortissement est arrêté à l'entrée.

**D-543-6 — Les lignes de chaque exercice (AC-3 à AC-6, M8).** Pour la consolidation d'un exercice `[début, fin]`,
chaque écart actif — de l'exercice ou d'un exercice antérieur — donne, **à la quote-part du groupe** :
- l'**élimination** : crédit des titres (détenteur), débit des capitaux propres d'entrée (société, compte par
  compte), les écarts d'évaluation sur leurs comptes (société), la part des minoritaires (réserves de la société),
  l'écart d'acquisition (détenteur) — **rejouée à l'identique** chaque exercice (AC-6) ;
- l'**amortissement complémentaire** de chaque écart d'évaluation amortissable (AC-3) et l'**amortissement** de
  l'écart d'acquisition positif (AC-4) : linéaires, décompte **30/360** depuis la date d'entrée (le cumul
  s'arrondit, jamais l'annuité — `amortissementExcedentaire`, importé de 542, jamais réécrit) ; la dotation de
  l'exercice au compte de dotations, le cumul au compte d'amortissements, **le cumul à l'ouverture en réserves** ;
- l'écart d'acquisition **négatif** selon sa règle figée (AC-5) ;
- la **sortie** d'un élément évalué (`POST …/sorties`, AC-3 « jusqu'à la sortie ») : l'amortissement s'arrête à la
  date, ce qui restait de l'écart d'évaluation passe au résultat de cession de la société ; après : rien.
Les effets des exercices passés sur le résultat sont en réserves — celles de la **société** pour les écarts
d'évaluation, celles du **détenteur** pour l'écart d'acquisition ; compte de réserves absent quand une ligne en
dépend : `409 COMPTE_RESERVES_NON_DECLARE` ; compte de gestion : `409 COMPTE_RESERVES_INVALIDE`.

**D-543-7 — À l'agrégat, à l'identité (M6).** Nouvelle colonne `ecartsPremiereConsolidation` par compte, appliquée
**sans mise à l'échelle**, couverte par `RECOMPOSITION` et `EQUILIBRE`.

**D-543-8 — Le traitement se décide lien par lien, jamais par silence.** `ECART_PREMIERE_CONSOLIDATION` est
`APPLIQUE` si et seulement si **chaque lien retenu vers une société intégrée** a son écart actif, et qu'aucun
manque n'est nommé :
- `ECART_NON_DECLARE` — un lien retenu sans écart (les titres ne sont pas éliminés) ;
- `LIEN_NON_RETENU` — un écart dont le lien n'est plus retenu (pourcentage modifié, société sortie) : **non
  appliqué**, nommé ;
- `REEVALUATION_TOTALE_A_REVOIR` — une réévaluation totale dont la société a désormais plusieurs liens retenus :
  appliquée, nommée ;
- `SORTIE_ORPHELINE` — une sortie dont l'écart n'est plus actif.
Un écart de l'exercice qui vise une société que le périmètre n'intègre plus est refusé avec les autres natures
(`409 ECRITURE_HORS_PERIMETRE`).

**D-543-9 — L'écart d'acquisition négatif est SIGNALÉ (AC-5).** Alerte `ECART_ACQUISITION_NEGATIF` sur la
déclaration et à l'agrégat, avec son montant et le message de l'AC : le plus souvent une erreur d'affectation des
écarts d'évaluation, pas une bonne affaire.

**D-543-10 — L'effet d'impôt se DÉDUIT (pour STORY-545).** Écarts d'évaluation : `DIFFERENCE_TEMPORELLE` ;
écart d'acquisition : `AUCUN` — pas de base fiscale en face ; élimination titres / capitaux propres : aucun
effet sur le résultat.

**D-543-11 — Routes et rôles.** `TENANT_ADMIN` et `TENANT_USER` (travail préparatoire, D-531-10), sous
`@RequiresDossierScope()` (la mère) et `@RequiresBilanAccess()` : `GET|POST
/dossiers/:dossierId/consolidation/exercices/:exerciceId/ecarts-premiere-consolidation`, `POST
…/ecarts-premiere-consolidation/sorties`, `POST …/ecarts-premiere-consolidation/:ecritureId/annulation` (un
écart dont un élément a une sortie active ne s'annule pas : `409 ELEMENT_DEJA_SORTI`) ; `GET …/agregat` publie
`ecartsPremiereConsolidation` et la colonne du même nom.

**D-543-12 — Bornes.** 30 lignes de capitaux propres, 30 de retraitements, 30 éléments évalués par écart ; le
volume des écarts des exercices passés (écritures et éléments) compté **avant** d'être chargé, borne mesurée →
`409 ECARTS_TROP_VOLUMINEUX` ; le plafond de 200 écritures par consolidation est partagé entre natures.

**D-543-13 — Le libellé du traitement dit ce qu'il fait** : l'élimination des titres contre les capitaux propres
acquis, l'écart affecté d'abord aux écarts d'évaluation, le résidu en écart d'acquisition.

## Hors périmètre — hooks inertes documentés

- **Intérêts minoritaires** (STORY-544) : la part `(1 − p)` des capitaux propres de la société, de la réévaluation
  totale et de son amortissement. L'écart publie ce qu'elle lira (quote-part, part des minoritaires des écarts
  d'évaluation, méthode).
- **Impôts différés** (STORY-545) : sur les écarts d'évaluation (l'effet d'impôt publié, D-543-10).
- **Mise en équivalence** (STORY-546) : l'écart d'une société mise en équivalence se loge dans les titres mis en
  équivalence — refusée ici, nommée.
- **Variation de périmètre en cours d'exercice** (STORY-548, M10) : le résultat antérieur à l'entrée au compte de
  résultat de l'exercice d'entrée ; la note de périmètre (le tableau de l'écart).
- **Variations de pourcentage après l'entrée** (acquisition complémentaire, cession partielle) et **sortie de la
  filiale du périmètre** : nommées (`LIEN_NON_RETENU`), jamais calculées.
- **Période d'évaluation de 12 mois** (D4C, ch. 6, section 2) : l'écart s'annule et se redéclare avec motif,
  sans verrou de date.
- **Test de dépréciation annuel** de l'écart d'acquisition (D4C § 5.1.2.2), **écart non ventilable par
  ancienneté** imputé en résultat (art. 83), **rapprochement** des capitaux propres déclarés avec une liasse
  figée à la date d'entrée : non traités — le paquet de règles le dit dans sa mise en garde.
- **Réévaluation totale d'une société détenue par plusieurs liens** (acquisitions successives) : la partielle
  s'impose, lien par lien — la part des minoritaires dans ses écarts d'évaluation n'est pas reconnue.

## Progress Tracking

- 2026-09-28 — branches `MNV-543` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`)
  **avant toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-28 — **cadrage fait avant tout code** : 10 constats, 13 décisions. Rien n'élimine aujourd'hui les
  titres — l'agrégat compte deux fois la même richesse (M1) ; un écart par LIEN retenu, sa date d'entrée et sa
  quote-part LUES au périmètre, jamais déclarées — la date d'entrée d'une détention indirecte est celle de son
  détenteur (M2, D-543-2) ; le coût, les capitaux propres d'entrée, leurs retraitements et les justes valeurs se
  DÉCLARENT, le produit calcule dans l'ordre du texte — les écarts d'évaluation d'abord, le résidu en écart
  d'acquisition, jamais déclaré (M3, D-543-3/4) ; les lignes, à la quote-part du groupe, s'appliquent sans mise à
  l'échelle (M6) ; la règle de l'écart d'acquisition est publiée par une famille d'artefacts DISJOINTE du paquet
  des liasses, recopié à l'octet dans `balance-service` (M7, D-543-5). ⚡ Les textes (AUDCIF art. 82, D4C ch. 6),
  lus sur l'édition officielle par un sous-agent de recherche, ont retourné l'hypothèse de départ : la durée
  d'amortissement est celle de l'ENTITÉ — le référentiel en publie le REPLI (10 ans) —, et le négatif se reprend
  ÉTALÉ sur une durée non chiffrée (M4, quatre arbitrages consignés).
