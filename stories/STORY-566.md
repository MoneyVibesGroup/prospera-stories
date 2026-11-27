# STORY-566 : Expliquer l'impôt du dirigeant salarié, et lui proposer des options chiffrées — le patron de STORY-096/097, appliqué à une personne physique

Status: in-progress (groupe C, lot 7, n° 18 et dernière du fiscal — annoncée le 2026-11-27 avant le code)

**Épic :** EPIC-024 — Simulation & conseil fiscal
**Service :** `fiscal-service` (`:3012`)
**Points :** 8 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — *« en lui expliquant, voire optimiser aussi, pour une
personne physique salarié dirigeant, pour un début »*.
**Prérequis :** **STORY-563** (le redevable) · **STORY-564** (le barème IRPP) · **STORY-568** (le verdict de qualification, qui est la première chose à expliquer)
**Réf. :** **STORY-096** (scénarios d'optimisation légale — leviers → impact IS) · **STORY-097**
(comparatif « déposé vs optimisé » + dossier de justification + **garde-fous de conformité**)

---

## Deux demandes, et la première compte plus que la seconde

Le PO demande **d'expliquer**, puis *« voire optimiser »*. L'ordre n'est pas anodin.

⚡ **Un dirigeant qui comprend son IRPP n'a plus besoin qu'on l'optimise pour lui faire confiance.**
Aujourd'hui il reçoit un montant à payer et n'a aucun moyen de savoir d'où il sort — c'est
exactement le défaut que le produit corrige partout ailleurs : *un chiffre dont on ne peut pas
remonter la composition n'est pas auditable*.

⇒ **L'explication est le livrable ; l'optimisation est le supplément.**

## Le patron existe déjà, et il faut le suivre

**STORY-096/097** ont posé l'optimisation pour l'**IS de l'entreprise** : leviers → impact,
comparatif « déposé vs optimisé », dossier de justification, **garde-fous de conformité**. Cette
story applique le même patron à une **personne physique**, avec une différence qui change tout :

⛔ **Le sujet n'est pas le client du cabinet, c'est une personne.** Un conseil chiffré donné à une
personne physique sur son revenu engage plus qu'une simulation d'IS : c'est de la **matière
personnelle**, et le produit ne doit jamais la présenter comme une décision prise.

## Périmètre

**Inclus — l'explication**

- ⚡ **D'abord : est-elle seulement due ?** Le premier élément d'explication n'est pas un calcul,
  c'est le verdict de **STORY-568** et sa base légale — *« vous êtes dispensé au titre de l'article
  21 du LPF, parce que vos seuls revenus sont des revenus d'emplois et que l'impôt a été retenu à
  la source »*. Pour la majorité des salariés togolais, **c'est toute l'explication**, et elle
  arrive sans qu'ils aient rien saisi.
- **La décomposition complète du calcul** — quand la déclaration est due — du revenu brut au
  montant dû : rémunération déclarée,
  abattements appliqués, tranche par tranche avec son taux et sa part d'impôt, retenues déjà
  opérées par l'entreprise, solde.
- **Chaque étape cite son article** du CGI et le millésime du paquet (STORY-564). Le dirigeant, ou
  son conseil, peut refaire le calcul sans le produit.
- **Le lien avec l'entreprise est montré** : la rémunération qui alimente l'IRPP vient des lignes
  de rémunération du dossier, et les retenues à la source imputées sont celles que l'entreprise a
  versées. ⚡ C'est **le seul endroit du produit où les deux volets se rejoignent visiblement**, et
  c'est ce qui rend la double déclaration compréhensible.

**Inclus — les options**

- Des **leviers déclarés au paquet**, jamais en dur : chacun avec son article, sa condition
  d'éligibilité, et son effet chiffré sur le montant dû.
- Un **comparatif « situation actuelle vs option »**, patron STORY-097, avec le **dossier de
  justification** que le cabinet pourra produire.
- ⛔ **Toute option porte sa condition et sa contrepartie.** Un levier présenté par son seul gain
  est une publicité, pas un conseil.

**Hors périmètre**

- **Appliquer une option.** Le produit calcule et présente ; **le cabinet conseille et le dirigeant
  décide.** ⛔ Aucun bouton n'applique un levier à une déclaration.
- Les revenus autres que traitements et salaires. *« Pour un début »* : le dirigeant **salarié**.
  Les revenus fonciers, de capitaux et les BIC/BNC sortent du périmètre, et le paquet le déclare
  pour que `FR-F80` bloque proprement.
- L'optimisation **conjointe** entreprise + dirigeant — arbitrer entre rémunération et dividendes,
  par exemple. ⚠️ C'est le vrai sujet du conseil, et il mérite sa fiche : il exige les deux
  calculs, leurs interactions, et un cadrage que *« pour un début »* n'ouvre pas.

## Critères d'acceptation

1. Le calcul est restitué **étape par étape**, avec les tranches, leurs taux et leurs parts ; la
   somme des parts égale le montant dû, et l'écart est publié s'il existe.
2. Chaque étape cite **son article et le millésime** du paquet.
3. Les retenues imputées sont **traçables jusqu'aux lignes de rémunération** qui les ont produites.
4. Un levier sans article, sans condition d'éligibilité ou sans contrepartie **fait échouer la
   validation du paquet** — au packaging, pas à l'exécution.
5. Un levier non éligible n'est **pas affiché avec un gain grisé** : il est absent, ou présent avec
   le motif d'inéligibilité. ⛔ Un gain montré puis retiré est une promesse.
6. Le comparatif porte la mention que **rien n'est appliqué** et qu'aucune déclaration n'est
   modifiée. Témoin : aucune route n'écrit une déclaration depuis cet écran.
7. Aucun taux, aucun levier, aucun seuil dans le code (NFR-F04).
8. Les montants individuels du dirigeant suivent la **restriction de lecture** d'AD-21 : servis aux
   seuls rôles qui en ont l'usage déclaratif.

## Notes

- ⚡ **Ce que le PO achète vraiment avec « en lui expliquant ».** Le dirigeant d'une PME togolaise
  découvre souvent son IRPP au moment de le payer. Un décompte qui part de sa rémunération et
  descend jusqu'au solde, avec les retenues déjà faites, transforme une facture subie en un calcul
  vérifiable — et c'est ce qui fait qu'il ne conteste pas le cabinet.
- ⚠️ **Le mot « optimiser » demande de la prudence dans l'écran, pas dans le code.** Le produit ne
  se prononce jamais sur l'opportunité : il chiffre des options prévues par la loi, cite l'article,
  et laisse le conseil au professionnel qui en a le titre. C'est déjà la position de STORY-097 pour
  l'IS ; elle vaut davantage encore ici.
- ⛔ **Ne pas dériver de leviers du corpus pédagogique ni d'une pratique observée.** Chaque levier
  vient du CGI, avec son article. Un « on fait souvent comme ça » n'entre pas au paquet.

---

## Réalignement du 2026-11-27 (groupe C, lot 7) — ce qui a changé depuis août

La fiche d'août reste le cahier des charges. Ce qui existe depuis, et sur quoi la story s'appuie, sans le refaire :

- **568** (verdict, `domain/qualification`, rien de stocké), **563** (le redevable personne physique, son mandat), **564**
  (`calculerIrppTraitementsSalaires`, pur, dans `domain/familles` — **signature inchangée**, D l'importe), **345 → 348** de D
  (les lignes de rémunération par bénéficiaire, et le calcul social de chaque période : cotisations et retenue d'IRPP du
  mois, lu par son API `CalculRemunerationService`), **339** (le corpus CGI + LPF packagé, cité mot pour mot).
- **D-564-5** : un gérant majoritaire n'a pas la base d'un salarié (Art. 28 : 20 % et « sans abattement d'aucune sorte ») ;
  le paquet ne le couvre pas, il **bloque**, nommé. Le calcul social de D aiguille `DIRIGEANT` et `ASSOCIE` vers
  `REMUNERATION_GERANT` (D-348-2) et ne chiffre leurs cotisations que si le paquet déclare leur affiliation (STORY-364).
- Deux tâches placées dans cette story par la session de groupe : **aligner le manifeste `declarations`** sur les droits
  que le service vérifie (`fiscalite:declaration:*`, dont `regler`, auth #52) ; **le `suivi` de D (562)** — vérifié : déjà
  servi par STORY-350 (balance #179, journal de C « Réponses »), rien à refaire.

## Décisions retenues par défaut (contestables)

- **D-566-1 — Une route, une lecture, un module neuf de C.** `POST /api/v1/redevables/{id}/irpp/{annee}/explication`
  (200 ; rôles `TENANT_ADMIN`, `TENANT_USER`, accès fiscal, droit **`fiscalite:declaration:preparer`**). `POST` parce que le
  corps porte les réponses du questionnaire et la saisie ; **rien n'est stocké** (comme 568). Module `explication-irpp`
  (dossiers neufs `modules|application|domain/explication-irpp`) : il importe `RedevablesModule`, `ReadModelsModule`,
  `PaquetsModule`, `RemunerationModule` (D, en lecture), `HabilitationsModule` ; **pas** `ObligationsModule`.
- **D-566-2 — D'abord le verdict.** Les réponses passent par le moteur pur de 568 (mêmes refus : `REPONSES_INCOMPLETES`,
  `QUESTION_INCONNUE`, `QUESTIONNAIRE_ABSENT_DU_PAQUET`). `DISPENSE` ou `INDETERMINE` : **le verdict est l'explication**
  (motif, article, lectures du gérant) ; aucune base n'est lue, rien n'est chiffré. `DOIT_DECLARER` : le décompte suit.
- **D-566-3 — Le revenu catégoriel vient du questionnaire, jamais du type de la ligne** (564 : aucun chemin « dirigeant »).
  Les réponses « oui » dont le code est un revenu du paquet (`irpp.revenusCategoriels`) sont les catégories du calcul ; un
  dossier qui rémunère la personne quand le questionnaire ne déclare aucun revenu bloque
  (`REVENU_NON_DECLARE_AU_QUESTIONNAIRE`) : la base ne se choisit pas à sa place.
- **D-566-4 — Les entrées : les lignes du redevable, et le calcul social de D, de la même version.** Pour chaque mois de
  l'année : la base (`RemunerationService.baseDuCalcul`), les lignes qui désignent **ce** redevable (`redevableId`), leur
  brut (les rubriques de l'assiette), puis `CalculRemunerationService.calculer` **sur la version lue** : les cotisations
  salariales (la branche des pensions au 1° de l'Art. 26, les autres et l'AMU au 2° — l'aiguillage même de 348, prouvé
  égal) et la **retenue du mois**, qui devient la retenue imputée, tracée jusqu'à sa ligne (période, bénéficiaire, version et
  empreinte de la base). ⛔ AD-21 : aucune autre ligne du dossier n'entre dans la réponse, ni l'identifiant fiscal.
- **D-566-5 — BLOQUEE, tous les manques d'un coup, jamais un décompte partiel** : un mois **sans base**
  (`MOIS_SANS_BASE` ; un mois dont la base existe sans ligne du redevable compte zéro, il n'y était pas payé), une ligne dont
  le calcul social ne chiffre pas les cotisations (`COTISATIONS_NON_CALCULEES`) ou la retenue (`RETENUE_NON_CALCULEE`), avec
  le motif et l'article de D, des charges de famille non renseignées, aucune ligne de l'année
  (`AUCUNE_REMUNERATION_DU_REDEVABLE`), ou un motif du calcul de 564 (`REVENU_CATEGORIEL_NON_COUVERT`…).
  ⚠️ **Conséquence, écrite pour être vue** : une ligne de rémunération ne peut désigner un redevable que si elle est
  `DIRIGEANT` ou `ASSOCIE` (563, AC-5), et le calcul social de D range ces types sous `REMUNERATION_GERANT` (Art. 28) et ne
  chiffre leurs cotisations que sur une affiliation que le paquet Togo ne déclare pas encore. **Aujourd'hui, l'explication
  d'un dirigeant du dossier sort donc `BLOQUEE`, nommée mois par mois** — jamais chiffrée comme un salarié. Le décompte est
  servi dès que le calcul social chiffre la ligne (un dirigeant salarié distingué du gérant majoritaire, l'affiliation
  sourcée). Question au PO (journal de C) ; **→ D (information)**.
- **D-566-6 — Les personnes à charge** (Art. 73 : la situation au 1er janvier) : celles de la **première ligne de l'année**
  (embauché en mars : celle de mars), avec où elles ont été lues ; non renseignées : bloque.
- **D-566-7 — Chaque étape cite son article, le millésime de son texte et le texte lui-même.** Le millésime se lit au
  paquet sur l'élément qui porte cet article ; le texte, dans le corpus packagé de 339, par un lecteur des références du
  paquet (« Art. 26, 1° » → CGI Art. 26 ; « 72 a 74 » → 72, 73, 74 ; un segment qui nomme le LPF est du LPF) ; chaque texte
  une fois (`textes.cites`, clé `LIVRE|Art. n`), un article introuvable nommé (`textes.absents`). Le verdict et les leviers
  sont cités de même (les leviers par la citation de 339).
- **D-566-8 — Le barème, tranche par tranche, et l'écart publié** : `{ de, a, taux, fraction, part }`, la somme des parts,
  l'impôt, **`ecart = somme − impôt`** et la règle d'arrondi du produit (Art. 74). Avec le barème du Togo, l'écart vaut
  toujours 0 (des fractions arrondies au millier, des taux au centième) ; il est publié quand même, et prouvé non nul sur un
  paquet muté.
- **D-566-9 — Les leviers : deux, de l'Art. 26, au paquet** (`irpp.leviers`, garde **R16** au packaging) : les **versements
  volontaires de retraite** (8°, limite 6 % du revenu net taxable) et les **primes d'assurance vie** (9°, 200 000 F + 30 000 F
  par enfant, six au plus). Chacun : `code`, `libelle`, la `deduction` qu'il simule (une rubrique du calcul de 564, qui en
  applique la limite), sa **référence** (`livre`, `article`, `alinea`, `millesime` ; jamais `aConfirmer`), sa **condition
  d'éligibilité**, sa **contrepartie** et ses **pièces**. ⛔ Aucun nombre dans un levier : la limite est celle de la rubrique.
  Pas des leviers : les 5° à 7° (un emprunt, une rente ou une pension alimentaire ne se décident pas pour l'impôt), les
  charges de famille (un fait), l'arbitrage rémunération / dividendes (hors périmètre).
- **D-566-10 — La simulation** : par défaut, **le plafond restant que le texte admet** (lu par le calcul lui-même, moins ce
  qui est déjà justifié), ou le montant que le cabinet indique (`options.<code>` ; au-delà du plafond, seule la part admise
  se déduit, et elle est montrée). Chiffrée : la situation actuelle et avec l'option (impôt, solde, excédent), l'impôt évité
  (`effet`, toujours > 0) et **l'effort net** (`versement − effet` : la contrepartie chiffrée). ⛔ **Non éligible : présent
  avec son motif, jamais un gain** (`NOMBRE_D_ENFANTS_REQUIS`, `PLAFOND_ATTEINT`, `MONTANT_A_INDIQUER`,
  `SANS_EFFET_SUR_L_IMPOT`, `REVENU_NON_CONCERNE`, `DEDUCTION_ABSENTE_DU_CALCUL`). Des leviers mal formés : `ILLISIBLES`,
  aucun servi ; absents : `NON_DECLAREES`.
- **D-566-11 — Le mandat et la restriction de lecture** : une personne physique sans mandat attesté n'est pas expliquée
  (**409 `MANDAT_ABSENT`** : le mandat de l'entreprise ne la couvre pas) ; la route exige `preparer` (AD-21, l'usage
  déclaratif) ; la réponse porte le redevable (id, désignation, qualité), jamais son NIF.
- **D-566-12 — Rien n'est appliqué, et c'est la structure qui le tient (AC-6)** : `options.applique: false` et
  l'avertissement du paquet ; une seule route ; un service qui ne dépend que de lecteurs (redevables, dossier, paquet,
  rémunération, calcul social) ; aucune obligation, aucune déclaration, aucun journal touchés (gardes du module et du service).
- **D-566-13 — Le dossier de justification** est la réponse elle-même : le verdict et ses textes, le décompte et ses
  textes, chaque option avec sa condition, sa contrepartie et ses pièces. Aucun document généré (hors périmètre de 566).
- **D-566-14 — Le manifeste `declarations` 1.1.0** (source `manifestes/declarations.manifest.ts`) : **ses droits sont ceux
  que le service vérifie** — `fiscalite:declaration:preparer`, `valider`, `deposer`, `regler` (les huit codes
  `declarations:*` n'ont jamais été émis par auth ni vérifiés par le service) ; `publie` porte ce que le service publie
  (`fiscal.declaration.deposee`, `fiscal.obligation.alerte-echeance` de 318, `fiscal.depot.piece-archivee` de 335 : Q-D-34
  répondue par le fait) ; le texte du coffre de 560 corrigé (un secret de canal est gardé chiffré, déposé par le client,
  lu par personne). **Version mineure** : aucun octroi `declarations:*` n'existe, personne ne perd rien ; la majeure reste
  réservée au renommage du refus décidé par le PO le 12/11. Copie **à l'octet** dans le fiscal
  (`src/vendor/manifestes/declarations.manifest.ts`, `ORIGINE-declarations.json` et son sha256), une garde : les droits du
  manifeste sont exactement `DROITS_FISCAUX`. **→ B** : la recopie au catalogue (message).
- **D-566-15 — Le paquet** : bloc `irpp.leviers`, garde R16, `_meta.revision` ; nouvelle empreinte, recopiée dans le
  fiscal (fichier commun), **B prévenu** (recopie permanente de `dossier-service`), **D prévenu**.

## Critères d'acceptation — comment ils sont prouvés

| # | Preuve |
|---|---|
| AC-1 | spec du domaine sur le paquet réel : 12 000 000 brut ⇒ 7 880 000 ⇒ 645 000, tranches 0 / 63 000 / 300 000 / 282 000, somme = impôt, écart `0` ; écart non nul publié sur un paquet muté |
| AC-2 | chaque étape : article et millésime lus au paquet ; textes du corpus à l'octet (spec du service, recueil) |
| AC-3 | douze retenues imputées, chacune avec sa période, son bénéficiaire, la version et l'empreinte de sa base ; égales à la retenue du calcul social de D |
| AC-4 | **R16** au packaging (balance-service, la vraie garde) : sans article, sans éligibilité, sans contrepartie, sans pièce, déduction inconnue ou d'un autre article ⇒ refus nommés |
| AC-5 | les motifs de non-éligibilité, `simulation: null`, aucun nombre d'effet ni d'impôt dans le levier |
| AC-6 | `applique: false` et l'avertissement ; une seule route ; module sans `ObligationsModule` ; service aux seuls lecteurs |
| AC-7 | garde AST de `domain/explication-irpp` : aucun nombre autre que 0 et 1, aucun article, aucun code de levier ni d'obligation ; un levier ajouté au paquet apparaît, une limite changée change le chiffre |
| AC-8 | droit `preparer` sur la route (garde du module, e2e 403) ; mandat exigé ; aucune autre ligne, aucun NIF |

## Contrat annoncé avant le code

« ⚠ Contrats » et « ⚠ Communs » du journal de C (entrée STORY-566) : la route neuve et sa réponse ; le paquet Togo gagne
`irpp.leviers` (aucune clé existante ne change), R16 ; le manifeste `declarations` passe en 1.1.0. Fichiers communs du
fiscal : `app.module.ts`, le contrat OpenAPI (la route et ses DTO), la copie du paquet, le manifeste `declarations` (copie
neuve). Aucune migration, aucune collection, aucun événement ; aucun fichier de D ; aucune classe que `DepotsModule`
instancie ne change ; `calculerIrppTraitementsSalaires` inchangée.
