# STORY-1101 : Les douze mois déclarés sur dimana face à la liasse — le rapprochement que le contrôleur fait en premier

Status: done — **livrée le 2026-11-25** : balance-service **#163** (`8fbdf6e` sur `dev`, les couples au paquet) et
prospera-fiscal-service **#60** (`0d353c2` sur `dev`, le rapprochement) ; voir « Livraison ». Créée le 2026-11-19
depuis la salle des cabinets (point V4), prise le 2026-11-25 par la session du groupe C (lot 6) ; contrat #862.

**Service :** `prospera-fiscal-service` (lecture des liasses figées de `bilan-service`) · **Points :** 5
**Dépend de :** STORY-322 (triplet calculé, déclaré, payé), STORY-326 (contrôles intra-période), STORY-328
(anomalies : gravité, blocage, levée motivée), STORY-563 (deux redevables) · **Écran :** à rattacher à FE-081

---

## Pourquoi

Ndeye, ancienne inspectrice des impôts, en séance du 19/11 : « Quand je contrôlais un dossier, je n'ouvrais pas
d'abord le bilan. Je prenais les douze déclarations de TVA mensuelles et je les comparais au chiffre d'affaires de la
liasse. L'écart, c'est le premier redressement. Ensuite, les retenues sur salaires face aux comptes 66. »

STORY-326 rapproche **une** déclaration du chiffre d'affaires comptabilisé **sur sa période**. Elle ne voit pas
l'écart qui n'apparaît qu'à la fin de l'exercice : la somme des douze mois déclarés ne colle pas à la liasse. C'est
pourtant l'écart que l'administration voit en premier, parce qu'elle a les deux côtés en main. Le produit les a aussi.

## Ce qui est attendu

Avant que la liasse passe « À déposer », un tableau de rapprochement pour l'exercice, une ligne par couple :

| Côté déclaré (cumul des périodes de l'exercice) | Côté liasse (jeu d'états figé) |
|---|---|
| Bases de TVA déclarées (ventes taxables + exonérées) | Chiffre d'affaires (comptes 70, poste du compte de résultat) |
| TVA collectée déclarée | TVA facturée (4431 et suivants, mouvements de l'exercice) |
| Retenues sur salaires déclarées (IRPP retenu à la source) | Charges de personnel (comptes 66) et dettes sociales et fiscales (42, 447) |
| Acomptes d'impôt sur les sociétés ou minimum de perception versés | Impôt de la liasse (89) et solde du compte 441 |

Chaque ligne a quatre valeurs : déclaré, liasse, écart, tolérance. La tolérance et la liste des couples viennent du
**paquet fiscal** (pays × année), jamais du code. Un pays qui n'a pas de couple déclaré n'affiche rien, et le dit.

Une période non déclarée dans l'exercice est nommée (« mars non déclaré »), jamais comptée pour zéro.

## Critères d'acceptation

- **AC-1** : pour un exercice dont les douze déclarations de TVA sont déposées et la liasse figée, le tableau
  rend, par couple du paquet, le cumul déclaré, la valeur de la liasse, l'écart et la tolérance ; les montants sont
  des entiers en FCFA.
- **AC-2** : un écart au-delà de la tolérance lève une anomalie STORY-328 qui nomme le couple, les deux montants, les
  périodes concernées et l'action attendue, en une phrase sans jargon.
- **AC-3** : une période manquante est nommée ; elle n'est jamais additionnée comme zéro (test : onze mois déposés,
  le douzième absent ⇒ l'anomalie le nomme).
- **AC-4** : la liasse ne passe pas « À déposer » tant qu'une anomalie de rapprochement bloquante n'est pas traitée,
  soit corrigée, soit levée avec un motif journalisé ; le motif figure au dossier de contrôle (STORY-336).
- **AC-5** : les couples et les tolérances se lisent dans le paquet fiscal Togo 2026 ; un paquet sans couple rend
  « rapprochement non défini pour ce pays » et ne bloque rien.
- **AC-6** : le dirigeant redevable (STORY-563) a son propre rapprochement : il n'est jamais mélangé avec celui de
  l'entreprise.
- **AC-7** : aucun écran ni aucun libellé ne dit « garanti », « sans redressement » ou « conforme à 100 % ». On écrit :
  « Écarts entre vos déclarations et la liasse ». C'est une règle de Ndeye : le produit promet zéro rejet de format,
  jamais zéro redressement.

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls**, dans `prospera-fiscal-service` et dans la source du paquet fiscal (`balance-service`).

### Ce que le produit tient vraiment, et donc le couple de cette story

Le fiscal enregistre aujourd'hui, par obligation, **un** montant déclaré (STORY-322) : pour la TVA, le montant à payer
de la période, pas sa base ni la TVA collectée. La liasse figée de `bilan-service` sert ses **états** par poste (le
compte de résultat : `TA`, `TB`, …), pas les comptes. Le seul couple de la fiche que ces deux côtés permettent est le
premier redressement de Ndeye : **le chiffre d'affaires déclaré en TVA, face au chiffre d'affaires de la liasse**. Il
demande d'enregistrer la base déclarée. Les trois autres couples sont nommés pour plus tard (D-1101-2).

### Le déclaré porte sa base

- `POST /api/v1/obligations/{id}/montant-declare` accepte un champ facultatif **`assiette`** (entier ≥ 0, FCFA) : la
  base déclarée de la période (pour la TVA : le chiffre d'affaires déclaré, taxable et exonéré). Rangé dans
  `montantDeclare.assiette` (`null` si absent) ; la vue de l'obligation le rend. Rien d'autre ne change.

### Le paquet porte les couples

- Bloc neuf **`rapprochementAnnuel`** dans la source du paquet Togo 2026 (et son schéma) : `{ couples: [{ code,
  libelle, redevable: ENTREPRISE, declare: { taxe, champ: montant | assiette }, liasse: { etat, postes[] }, tolerance:
  { absolue, relative? } }], source }`. Togo 2026 : un couple, **`CA_TVA_LIASSE`** — `declare: { taxe: TVA, champ:
  assiette }`, `liasse: { etat: COMPTE_RESULTAT, postes: [TA, TB, TC, TD] }` (le chiffre d'affaires `XB` du SYSCOHADA
  révisé), tolérance **1 000 FCFA** absolus. Les artefacts se régénèrent (`build.mjs`), l'empreinte change.

### Le rapprochement

- **`POST /api/v1/exercices/{exerciceId}/rapprochement-liasse`** (droit `fiscalite:declaration:preparer`), corps
  `{ jeuEtatsId, version, redevableId? }` (par défaut l'entreprise) → `200 { redevableId, defini, message?, couples: [{
  code, libelle, declare, liasse, ecart, tolerance, statut: CONFORME | ECART | INCOMPLET, periodes, periodesNonDeclarees
  }] }`. La liasse se lit par `SourceContenuLiasse` (jeton de l'appelant ; `bilan-service` garde sa portée).
- **Le côté déclaré** : la somme du champ du couple sur les obligations de la taxe, **du redevable**, de l'exercice
  (périodes dérivées). Une période sans déclaré, ou dont le champ est `null`, est **nommée** dans
  `periodesNonDeclarees` (« mars 2026 non déclaré ») et n'est jamais comptée pour zéro : le couple est alors
  `INCOMPLET` (AC-3). **Le côté liasse** : la somme des postes de l'état, `montantN`, en entiers.
- **La règle** : celle de STORY-326 (`|déclaré − liasse| ≤ max(absolue, relative × |liasse|)`).
- **L'anomalie** : **`RAPPROCHEMENT_LIASSE_ECART`** (`SIGNALEE`, `BLOQUANTE`, `bloque: ['A_DEPOSER']`, levable en
  motivant), posée sur l'obligation **`DSF`** de l'exercice du redevable, par le patron de 328 : une phrase qui nomme le
  couple, les deux montants, les périodes manquantes et l'action ; empreinte du fait (couple, deux montants, périodes
  manquantes, liasse). Retirée quand tous les couples sont `CONFORME`. Le motif de la levée figure au dossier de contrôle
  (`GET /exercices/{id}/obligations/anomalies`, déjà servi).
- **Sans couple** pour ce pays ou ce redevable : `defini: false`, `message: « Rapprochement non défini pour ce pays. »`,
  rien n'est signalé ni bloqué (AC-5). Le dirigeant redevable (563) n'a aucun couple au paquet Togo 2026 : son
  rapprochement est non défini, jamais mélangé à celui de l'entreprise (AC-6).
- **Libellés** (AC-7) : « Écarts entre vos déclarations et la liasse » ; jamais « garanti », « sans redressement » ni
  « conforme à 100 % ».

### Livraison (2026-11-25)

- **balance-service** (#163) : bloc `rapprochementAnnuel` dans la source du paquet Togo 2026 et dans son schéma ;
  artefact régénéré, empreinte **`183c858939fb374df66d2c56d18b8d81ed887f1847f2dbb8fb0369690ebcaa4f`** au registre
  (« dix-septième fois ») ; la surcouche zone franche en hérite.
- **fiscal** (#60) : `domain/obligations/rapprochement-liasse.ts` (règle pure, la règle de 326 réutilisée),
  `RapprochementLiasseService`, route `POST /api/v1/exercices/{exerciceId}/rapprochement-liasse`, champ `assiette` au
  déclaré (DTO `MontantDeclareDto`, adaptateur Mongo, journal chaîné), anomalie `RAPPROCHEMENT_LIASSE_ECART`, copie du
  paquet dans `test/fixtures/paquet-fiscal/`. Codé par une sous-session ; paquet, revue, preuves et gate par C.
- **Preuves** (Node 24) : balance-service unitaires **5547** (4 suites lentes rejouées seules, 68/68), e2e **36/36,
  1973** ; fiscal unitaires **2642** (une suite lente rejouée seule, 26/26), e2e **11/11, 223** (dont 7 neufs : douze mois
  conformes, un écart avec dépôt refusé, levée puis rouverture, retrait, onze mois et le douzième nommé, assiette absente
  sur un mois, paquet sans couple, dirigeant non défini) ; **`test:conformite` 15/15 suites, 93/93** sur le vrai
  `mongo-fiscal` (`rs-fiscal`, compte applicatif), dont l'assiette écrite, relue dans le champ `Mixed`, survivant à une
  re-dérivation et portée par l'acte du journal chaîné ; mutation **6/6** (période manquante comptée pour zéro, égalité
  stricte, écart qui ne signale pas, conforme qui ne retire pas, mélange entreprise / dirigeant, poste oublié) ; AC-7 :
  un test balaie les libellés de la story ; gate `grp-c` : `fiscal-service` `healthy`, sans redémarrage, la route neuve
  en `401` sans jeton.
- **Pas prouvé sur la pile** : la lecture d'un vrai jeu d'états de `bilan-service` (doublure dans les e2e) et le
  rapprochement à deux cabinets sur la vraie pile.

### Écarts au contrat, décidés au code

- **D-1101-6** : la liasse se lit par **`SourceLiasseFigee`**, pas `SourceContenuLiasse` : le contenu ne porte aucun
  montant par poste (c'est une vue de complétude) ; la liasse figée rend `compteResultat[].montantN`.
- **D-1101-7** : un exercice sans obligation de la taxe du couple : le couple est `INCOMPLET`, `declare: null`, sans
  période à nommer, et ne signale rien (un dossier sans TVA n'est pas bloqué à tort).
- **D-1101-8** : l'anomalie est aussi posée quand le couple est `INCOMPLET` avec des périodes manquantes (AC-3) ; elle
  n'est retirée que quand tous les couples sont `CONFORME`. Sur un couple incomplet, l'écart se calcule sur les périodes
  déclarées, à titre indicatif.
- **D-1101-9** : un couple mal formé, ou deux couples du même code, et tout le bloc se lit « pas de couple ». Seul
  l'état `COMPTE_RESULTAT` est rapprochable aujourd'hui.
- **D-1101-10** : un poste absent de la liasse compte zéro côté liasse ; `montantN` est ramené à l'unité de la devise
  (exposant zéro pour le FCFA).
- **D-1101-11** : `toleranceValide` est partagée avec 326 (`coherence.ts`), et la règle `juger` est la même.
- **D-1101-12** : les couples se lisent sur le paquet du rattachement de l'exercice ; pour la zone franche, c'est la
  base, qui porte le bloc.
- **D-1101-13** : trois attendus d'existants changent par conséquence du contrat (le catalogue de 328, l'appel au
  registre du triplet avec `assiette: null`).
- **D-1101-14** : l'assiette n'entre dans l'acte `OBLIGATION_MONTANT_DECLARE` que si elle est donnée : l'empreinte d'un
  fait sans base ne change pas (prouvé sur Mongo).
- **D-1101-15** : l'assiette passe par un DTO dédié au déclaré, jamais accepté sur le payé.

### Décisions prises au contrat (contestables)

- **D-1101-1** : le couple compare le chiffre d'affaires **déclaré** (l'assiette saisie) à la liasse : le montant de
  TVA à payer n'est pas comparable à un chiffre d'affaires.
- **D-1101-2** : nommés pour plus tard, faute de données : la TVA collectée déclarée face à la TVA facturée (`4431`,
  la liasse ne sert pas les comptes) ; les retenues sur salaires face aux comptes `66`, `42`, `447` (une retenue n'est
  pas une charge : il faut une règle de rapport, pas une égalité) ; les acomptes d'IS face à l'impôt de la liasse et au
  `441` (leur écart est le solde à payer, pas une anomalie).
- **D-1101-3** : la liasse est désignée par l'appelant (`jeuEtatsId`, `version`), comme pour le décompte de complétude
  (STORY-556) : le fiscal ne choisit pas une liasse à la place du cabinet.
- **D-1101-4** : le rapprochement s'exécute sur demande ; il ne se relance pas seul à chaque déclaration (il demande la
  liasse figée, qui n'existe qu'en fin d'exercice).
- **D-1101-5** : tolérance de travail 1 000 FCFA, à confirmer par un fiscaliste, comme D-326-2.

## Hors périmètre (nommé pour plus tard)

- Le rapprochement avec les données que l'administration détient seule (factures normalisées des tiers, DAS).
- La correction automatique d'une déclaration passée : une correction reste une rectificative (STORY-325).
