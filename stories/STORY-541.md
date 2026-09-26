# STORY-541 : Retraitements d'homogénéisation — additionner des balances qui n'appliquent pas les mêmes méthodes est faux

Status: done

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation` (posé par STORY-531 ; aucun contrat d'événement : **un
seul dépôt**)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-530** (le périmètre daté) · **STORY-531** (le socle d'agrégation)
**Origine :** arbitrage PO du 2026-08-28 — **niveau ③, consolidation SYSCOHADA complète**.

---

## Le fait

C'est le premier retraitement, et **celui qu'on saute le plus souvent** parce qu'il ne se voit pas :
l'agrégation additionne des balances **produites selon des méthodes comptables différentes**.

Une filiale amortit ses véhicules en 4 ans, la mère en 5. Une valorise ses stocks au CUMP, l'autre au
FIFO. Une provisionne ses créances douteuses à 50 %, l'autre à 100 %. **Chacune est régulière dans
ses comptes individuels** — et leur somme ne décrit aucune entité réelle.

⇒ **Consolider, c'est d'abord ramener toutes les entités aux méthodes du groupe.** Sans cette étape,
les six retraitements suivants s'appliquent à une base déjà fausse.

## Critères d'acceptation

- [ ] AC-1 — Un **référentiel de méthodes du groupe** est déclaré : durées et modes d'amortissement
      par nature, méthode de valorisation des stocks, règles de provisionnement. Déclaré au **dossier
      de la mère**, versionné et daté.
- [ ] AC-2 — Chaque retraitement est **une écriture de consolidation identifiée**, réversible, avec
      son motif et son entité d'origine. ⛔ Un retraitement fondu dans les soldes n'est pas
      auditable — et la consolidation est **exactement** ce qu'un commissaire aux comptes déroule.
- [ ] AC-3 — Les écritures de consolidation vivent dans un **journal de consolidation séparé**, qui
      ne modifie **jamais** les comptes individuels. Les balances des filiales restent intactes à
      l'octet.
- [ ] AC-4 — ⚠️ **Un retraitement d'homogénéisation a un effet d'impôt** : il modifie le résultat
      consolidé sans modifier la base fiscale de l'entité. ⇒ Il **alimente** [[STORY-545]] (impôts
      différés), et un retraitement qui n'y contribue pas doit le dire explicitement.
- [ ] AC-5 — Le retraitement est **rejoué à l'identique** d'un exercice sur l'autre tant que les
      méthodes ne changent pas, et son **cumul** est reporté (un écart d'amortissement se cumule
      d'année en année, il ne se recalcule pas à zéro).
- [ ] AC-6 — Une entité **déjà conforme** aux méthodes du groupe produit **zéro écriture**. Test
      obligatoire : un groupe homogène doit donner une consolidation identique à l'agrégation.

## Notes

- Voir [[STORY-531]] (le socle), [[STORY-542]], [[STORY-545]], `epics-consolidation-2026-08-28.md`.
- ✅ **Ce que STORY-531 a posé (2026-09-24)** — le journal de l'AC-3 existe : collection
  `ecritures_consolidation` de `bilan-service`, rattachée à (cabinet, dossier de la MÈRE, exercice de la
  mère), numérotée, ACTIVE → ANNULEE par annulation motivée, jamais réécrite ni effacée (garde de
  schéma). Il ne connaît que la nature `ELIMINATION` (`NATURES_ECRITURE`) : cette story y ajoute la
  sienne. L'agrégat applique déjà toute écriture ACTIVE ligne à ligne, et ses contrôles RECOMPOSITION
  et EQUILIBRE la vérifient. Le traitement `HOMOGENEISATION` est publié `NON_TRAITE`
  (`traitements.ts`) : c'est cette story qui le fait passer `APPLIQUE`.

---

# Cadrage — fait AVANT toute ligne de code

Sources : **AUDCIF 2017, articles 79 à 98**, relus verbatim (édition LegalRDC — art. 86, 88, 92, 94) ; le code
de `bilan-service` (`dev` @ `8226ebf`) et de `balance-service` (registre des immobilisations, inventaire) ;
les fiches STORY-526 à 528, 531, 534, 542, 545, 659 ; `epics-consolidation-2026-08-28.md` ;
`epics-stock-2026-08-15.md` (AD-10).

## Les constats mesurés

### M1 — ⚡⚡ Aucune donnée du produit ne permet de CALCULER un retraitement d'homogénéisation

- **Amortissements** : le plan d'un bien (durée `dureeUtiliteMois`, mode, date de mise en service, valeur
  résiduelle) ne vit que dans `balance-service` (`immobilisations_mouvements`) et n'est **publié nulle
  part** : `immobilisations.tableau.publie` ne porte qu'un **agrégat par compte** (brut, amortissements,
  nombre de biens). Le registre n'a même pas de « nature » : son seul classifieur est le compte
  (STORY-526 M4). Recalculer un plan aux durées du groupe est impossible dans `bilan-service`.
- **Stocks** : aucune méthode de valorisation n'existe dans aucun service (`stock-service` n'existe pas ;
  l'inventaire de STORY-534 ne connaît que SI/SF par compte).
- **Provisionnement** : aucune règle pour les créances d'une société commerciale (la seule règle
  « taux × ancienneté » est le paquet prudentiel des crédits SFD, `microfinance-service`).
- **Méthodes appliquées par chaque société** : zéro occurrence, nulle part.

⇒ Le montant d'un retraitement est un **calcul du cabinet** (sur le registre de la filiale, ses coûts, sa
balance âgée). Le produit **l'héberge** ; il ne le produit pas — la doctrine de la Q2 de STORY-531
(« le produit ne peut pas deviner »).

### M2 — Le texte : l'harmonisation est imposée, l'omission est permise si elle est négligeable, et deux opérations de l'art. 86 ne sont fichées nulle part

- **Art. 86 2°** : *« l'harmonisation de l'évaluation et de la comptabilisation des actifs et passifs des
  entités du groupe »* ; **dernier alinéa** : *« L'entité consolidante peut omettre d'effectuer certaines
  des opérations décrites au présent article, lorsqu'elles sont d'incidence négligeable »* — l'omission est
  un **jugement**, qui doit se déclarer et se motiver, jamais se déduire d'un silence.
- **Art. 88 al. 2** : les biens d'organismes soumis à des **règles d'évaluation fixées par des lois
  particulières** (assurances CIMA, SFD) gardent leur valeur réglementaire — une limite que seul le cabinet
  peut juger.
- **Art. 92** : les impositions différées résultent notamment *« des aménagements, éliminations et
  retraitements prévus à l'article 86 »* — le lien de l'AC-4 avec STORY-545 est dans le texte.
- **Art. 94** : les notes consolidées incluent *« un résumé des principales méthodes comptables
  appliquées »* — le référentiel de l'AC-1 en est la matière (STORY-548).
- ⛔ **Art. 86 3°** (*« l'élimination de l'incidence sur les comptes des écritures passées pour la seule
  application des législations fiscales »* — amortissements dérogatoires, provisions réglementées) et
  **art. 86 5°** (charges d'impôt non récupérables sur les distributions prévues entre sociétés intégrées)
  **ne figurent ni dans le découpage du 2026-08-28 ni dans la liste fermée des traitements** (D-531-9) :
  l'état pourrait un jour s'appeler « consolidé » sans elles.

### M3 — Le journal de STORY-531 est le bon réceptacle, mais ses règles sont celles d'une élimination

`ecritures_consolidation` refuse une écriture mono-société (`ELIMINATION_MONO_SOCIETE`) et toute société
non intégrée GLOBALEMENT (`SOCIETE_NON_ELIMINABLE`). Un retraitement d'homogénéisation est **mono-société
par construction** (il retraite les comptes d'UNE entité), et s'applique aussi à une société intégrée
proportionnellement (art. 81 al. 2 : c'est la fraction des éléments — retraités — qui s'intègre). De plus
l'agrégat applique **toute** écriture ACTIVE et `refuserSiEcrituresHorsPerimetre` les juge toutes à l'aune
de l'intégration globale, et `GET …/eliminations` / l'annulation ne filtrent pas la nature : sans
séparation, un retraitement d'une société en IP ferait refuser l'agrégat, et s'afficherait comme une
élimination.

### M4 — ⚡⚡ Chaque consolidation repart des liasses individuelles : sans report, le cumul de N retombe à zéro en N+1

Les liasses ne sont jamais touchées (AC-3), donc ne contiennent jamais les retraitements passés. Reporter,
c'est rejouer les retraitements antérieurs **à l'identique** — leurs lignes de bilan telles quelles, et
l'effet sur le résultat des exercices passés **en réserves**. Distinguer compte de résultat et compte de
bilan ne se déduit **pas** du premier chiffre : en SFD BCEAO, la classe 1 est la trésorerie et les réserves
sont en classe 5. Chaque paquet déclare ses **`racinesDeGestion`** (`6,7,8` SYSCOHADA/SMT/zone franche ;
`6,7` SFD ; `6,7,82…86` CIMA — STORY-369), présentes dans l'artefact mais **absentes du type**
`ReferentielPackage` de `bilan-service` (seul `balance-service` les lit). Le compte de réserves qui reçoit
le report ne peut donc pas être codé en dur : c'est un paramètre du groupe. ⚠️ *Amendé en cours de dev :*
elles étaient aussi ÉCARTÉES par la liste blanche de `ReferentielLoader.parse` — le type n'était que la
moitié du constat (relevé par les e2e, corrigé ; cf. Progress Tracking).

### M5 — Les consolidations antérieures sont calculées à la lecture, et leur journal grossit avec les années

Rien n'est figé avant STORY-548 : le report se calcule en relisant le journal des exercices antérieurs de
la mère (`exercices_dossier` donne la chaîne : exercices qui finissent avant le début de celui-ci). Le
volume croît avec l'ancienneté du groupe — une borne est nécessaire, mesurée.

### M6 — Le périmètre change d'un exercice à l'autre

Une société peut sortir, passer d'IG à IP, ou en mise en équivalence : le cumul d'une société qui n'est plus
intégrée ne s'applique plus (elle n'a plus de contribution à retraiter) — il se nomme ; celui d'une société
en IP s'intègre à son pourcentage de l'exercice.

### M7 — Sans les méthodes de chaque société, « conforme » et « jamais examinée » sont indiscernables

L'AC-6 (« une entité déjà conforme produit zéro écriture ») suppose que le produit SACHE qu'elle est
conforme. Sans les méthodes de chaque société, une consolidation sans retraitement ne dit rien : c'est
**exactement** le saut silencieux que la story dénonce (« celui qu'on saute le plus souvent parce qu'il ne
se voit pas »). Les deux vocabulaires existent déjà dans le programme : `LINEAIRE`/`DEGRESSIF` et la durée
en **mois** (`dureeUtiliteMois`, registre de STORY-526) ; `CUMP`/`FIFO` (AD-10 de `stock-service`).

### M8 — Le statut du traitement est statique

`TRAITEMENTS_APPLIQUES_PAR_LE_SOCLE` est un ensemble fixe ; le hook de `traitements.ts` prévoit qu'une story
rende sa ligne **conditionnelle**. `HOMOGENEISATION` publié `APPLIQUE` sans condition dirait « fait » d'un
groupe dont personne n'a examiné les méthodes.

## Les décisions

**D-541-1 — Le montant se déclare (M1).** Chaque retraitement est une écriture **déclarée** par le cabinet,
qui en a fait le calcul. Le produit exige la norme (le référentiel du groupe), les faits (les méthodes de
chaque société) et, pour chaque divergence, une **décision explicite** — retraitement ou omission motivée —,
puis il reporte, contrôle et nomme. Le calcul d'un montant depuis le registre de la filiale est un hook
(hors périmètre).

**D-541-2 — Le référentiel de méthodes du groupe (AC-1).** Collection `methodes_comptables`, portée
`GROUPE`, au **dossier de la mère** ; **versionné** (1, 2, … par déclaration), **daté** (`dateEffet`),
**immuable** (garde de schéma : ni mise à jour, ni remplacement, ni suppression — une correction est une
nouvelle version), motif obligatoire, auteur et date. Trois rubriques, chacune par **nature = racine de
compte** du référentiel commun du groupe :
- **amortissements** : mode `LINEAIRE` | `DEGRESSIF`, durée **en mois** (vocabulaire du registre) ;
- **stocks** : méthode `CUMP` | `FIFO` (vocabulaire de `stock-service`) ;
- **provisionnement** des créances : **paliers d'ancienneté** (depuis N mois → taux en points de base) —
  un taux unique est un palier depuis 0 mois.

Plus le **compte de réserves** du report (D-541-8). **Version en vigueur à une date** : parmi les versions
dont `dateEffet` ≤ la date, celle de la `dateEffet` la plus récente, à égalité la plus haute version. La
date retenue est la **clôture de l'exercice de la mère** — celle du périmètre (D-531-3).

**D-541-3 — Les méthodes de chaque société (M7).** Même collection, portée `SOCIETE`, par (mère, société),
**la mère comprise** (ses comptes individuels peuvent suivre d'autres méthodes que le groupe) ; versionnées
et datées de la même façon ; mêmes rubriques, plus **`sansObjet`** (la société n'a aucun bien de cette
nature). Déclarées dans la consolidation de la mère : c'est le questionnaire de méthodes du dossier de
consolidation (une coentreprise consolidée par deux groupes est déclarée dans chacun).

**D-541-4 — L'état de chaque (société, rubrique) à la clôture.** `CONFORME` (même méthode que le groupe),
`DIVERGENTE`, `SANS_OBJET`, `NON_RENSEIGNEE` (pas de méthodes en vigueur pour la société, ou rubrique
absente). Calcul pur, depuis les versions en vigueur à la date de clôture.

**D-541-5 — Le retraitement (AC-2, AC-3).** Une écriture du journal de STORY-531, nature
**`HOMOGENEISATION`** : **une** société (toutes ses lignes la mouvementent — son entité d'origine), **une**
rubrique, le **régime** qu'elle corrige (méthode du groupe et méthode de la société, avec leurs versions,
figés à la déclaration), justification, effet d'impôt ; ≥ 2 lignes équilibrées, chacune débitée OU créditée ;
numérotée dans la séquence de la consolidation ; annulable avec motif ; les liasses ne sont jamais touchées.
Refus : société non intégrée (ni la mère, ni IG, ni IP) → `SOCIETE_NON_RETRAITABLE` ; rubrique absente du
référentiel du groupe → `RUBRIQUE_HORS_REFERENTIEL` ; méthodes du groupe ou de la société non déclarées →
`METHODES_GROUPE_NON_DECLAREES` / `METHODES_SOCIETE_NON_DECLAREES` ; ⛔ **société conforme ou sans objet
sur cette rubrique → `SOCIETE_CONFORME`** : une entité conforme ne produit **aucune** écriture (AC-6) —
sauf régime à revoir (D-541-9). Éliminations et retraitements sont désormais **séparés par nature** partout
(liste, annulation, agrégat) — M3.

**D-541-6 — L'omission motivée (art. 86, dernier alinéa).** Même journal, même nature, **zéro ligne**,
`omission` : `INCIDENCE_NEGLIGEABLE` | `SANS_INCIDENCE` (rien à retraiter sur l'exercice), justification
obligatoire. Seulement sur une divergence (ou un régime à revoir). Dans un exercice, une divergence est
retraitée **ou** omise, jamais les deux (`OMISSION_CONTRADICTOIRE`).

**D-541-7 — L'effet d'impôt (AC-4, art. 92).** Chaque retraitement déclare `effetImpot` :
`DIFFERENCE_TEMPORELLE` (il déplace du résultat sans déplacer la base fiscale : il alimente STORY-545) ou
`AUCUN` **avec sa raison**. ⛔ Le silence est refusé (`400 EFFET_IMPOT_NON_DECLARE`). Déclaré, figé,
publié : le calcul de l'impôt est STORY-545. Une omission n'en porte pas (aucune ligne).

**D-541-8 — Le report du cumul (AC-5, M4, M5, M6).** À la lecture de l'agrégat de l'exercice N, chaque
retraitement ACTIF des consolidations antérieures de la mère (exercices qui finissent avant le début de N)
est **rejoué à l'identique** : ses lignes de bilan telles quelles ; ses lignes sur un compte de **gestion**
(`racinesDeGestion` du référentiel commun — déclarées par le paquet, jamais le premier chiffre) remplacées
par **une** ligne sur le **compte de réserves** du groupe (version en vigueur), pour leur net. Jamais
recalculé, jamais redéclaré, chaque report cite son origine (exercice, numéro, société, rubrique). Intégré
au pourcentage courant de la société ; société qui n'est plus intégrée → **non appliqué, nommé**. Un compte
de réserves qui tombe sous une racine de gestion : `409 COMPTE_RESERVES_INVALIDE` dès qu'un report en
dépend, manque nommé sinon.

**D-541-9 — Le changement de méthode (AC-5 : « tant que les méthodes ne changent pas »).** Pour chaque
(société, rubrique), le régime de sa **dernière** écriture (antérieure ou de l'exercice) est comparé au
régime en vigueur. Différent, avec un cumul reporté non nul (ou une écriture de l'exercice devenue
périmée) ⇒ **À REVOIR** : le cumul est **toujours rejoué à l'identique** (jamais abandonné en silence), et la
(société, rubrique) doit recevoir dans l'exercice un retraitement — l'écriture de changement de méthode,
permise même si la société est désormais conforme — ou une omission motivée, sous le régime en vigueur.
*Précisé en revue de code :* « un cumul reporté » se lit **au moins une écriture antérieure active qui porte
des lignes** — une approximation par excès (un cumul entièrement soldé reste à revoir, le cabinet le dit par
une omission `SANS_INCIDENCE`) ; un historique d'**omissions seules** n'a rien reporté et n'est jamais à
revoir.

**D-541-10 — Le statut de `HOMOGENEISATION` (AC-6, M8).** `APPLIQUE` si et seulement si : un référentiel du
groupe est en vigueur ; pour chaque société intégrée (mère comprise) et chaque rubrique du groupe, l'état
est `CONFORME`, `SANS_OBJET`, ou `DIVERGENTE` avec un retraitement ou une omission ACTIFS de l'exercice sous
le régime en vigueur ; aucune (société, rubrique) À REVOIR ; le compte de réserves est un compte de bilan.
Sinon `NON_TRAITE`, et `homogeneisation.manques` nomme chaque manque (société, rubrique, motif). La règle
de qualification (D-531-1) ne change pas.

**D-541-11 — Intégration proportionnelle (art. 81 al. 2).** Un retraitement se déclare **à 100 %** sur les
comptes de la société ; il s'intègre à son `pctIntegration`, comme ses soldes — plus fort reste, colonne
par colonne, **écriture par écriture** (elle reste équilibrée).

**D-541-12 — Les contrôles.** `RECOMPOSITION` et `EQUILIBRE` couvrent retraitements et reports (chemin B
distinct du détail). ⛔ **Test obligatoire de l'AC-6** : un groupe homogène donne des lignes **identiques** à
l'agrégation pure, zéro écriture, zéro report, et `HOMOGENEISATION` `APPLIQUE`.

**D-541-13 — La liste fermée se complète (M2).** `ECRITURES_FISCALES` (art. 86 3°, **STORY-685**) et
`IMPOSITIONS_SUR_DISTRIBUTIONS` (art. 86 5°, **STORY-686**) entrent dans la liste, `NON_TRAITE`, requis
pour consolider. Les deux stories sont fichées à la clôture (numéros réservés par balayage de TOUTES les
branches distantes de `docs/` : maximum 684).

**D-541-14 — Routes et rôles.** Sous `@RequiresDossierScope()` (la mère) et `@RequiresBilanAccess()`,
`TENANT_ADMIN` et `TENANT_USER` (travail préparatoire, comme D-531-10 ; tout est versionné et attribué, rien
n'est figé — l'acte engageant est le figement de STORY-548) :
- `GET|POST /dossiers/:dossierId/consolidation/methodes-groupe` ;
- `GET|POST /dossiers/:dossierId/consolidation/societes/:societeId/methodes` — la société est la mère ou un
  dossier de l'organisation, sinon `404 SOCIETE_INTROUVABLE` (anti-énumération) ;
- `GET|POST …/consolidation/exercices/:exerciceId/retraitements`,
  `POST …/retraitements/:ecritureId/annulation` ;
- `GET …/agregat` publie la section `homogeneisation` (référentiel en vigueur, état de chaque société et
  rubrique, retraitements, omissions, reports, manques) et, par compte, les imputations `retraitements` et
  `reprises`.

**D-541-15 — Bornes (leçon de STORY-530).** Rubriques ≤ 50 par type, paliers ≤ 10, versions ≤ 50 par portée ;
le plafond du journal (200 écritures, annulées comprises) est partagé entre natures ; les retraitements
reportés sont comptés **avant** d'être chargés, borne mesurée → `409 REPRISES_TROP_VOLUMINEUSES`.

## Hors périmètre — hooks inertes documentés

- **Le calcul d'un montant** (plan du bien aux durées du groupe depuis le registre de `balance-service`, coûts
  de stocks, balance âgée) : le retraitement porte déjà sa rubrique et son régime, qu'un calcul PROPOSÉ
  viendrait remplir — même doctrine que les éliminations proposées (STORY-542).
- **L'impôt différé** : STORY-545 lit `effetImpot`, le régime et les lignes de chaque retraitement.
- **L'extinction calculée** d'un cumul après changement de méthode (proposée, écriture exacte d'inversion) :
  la règle D-541-9 impose la décision, pas son calcul.
- **Art. 88 al. 2** (valeurs réglementaires des assurances et SFD) : jugement du cabinet, nommé.
- **Art. 94** — le résumé des méthodes dans les notes consolidées : STORY-548 lira le référentiel du groupe.
- **Art. 86 3° et 5°** : STORY-685 et STORY-686 (D-541-13).

## Progress Tracking

- 2026-09-26 — branches `MNV-541` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`)
  **avant toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-26 — **cadrage fait avant tout code** : 8 constats, 15 décisions. Aucune donnée du produit ne
  permet de calculer un retraitement — le montant se déclare, le produit exige la norme, les faits et une
  décision par divergence (M1, D-541-1) ; le report du cumul rejoue les retraitements antérieurs en
  reclassant leur effet résultat en réserves, sur les racines de gestion DÉCLARÉES par le paquet (M4,
  D-541-8) ; les méthodes de chaque société sont déclarées, sans quoi « conforme » et « jamais examinée »
  se confondent (M7, D-541-3) ; l'art. 86 3° et 5° manquaient à la liste fermée (M2, D-541-13).
- 2026-09-26 — **dev `bilan-service`** (branche `MNV-541`, commits `c018802` → `3ee33f4`) : collection
  `methodes_comptables` (immuable, versionnée, datée ; garde de schéma, `bulkWrite` compris) et ses quatre
  routes ; journal : nature `HOMOGENEISATION`, société d'origine, rubrique, régime figé, effet d'impôt,
  omission motivée ; trois routes de retraitements ; report du cumul (bilan tel quel, effet résultat en
  réserves sur les `racinesDeGestion` du paquet) ; « à revoir » sur changement de méthode ; statut
  `HOMOGENEISATION` conditionnel ; `ECRITURES_FISCALES` et `IMPOSITIONS_SUR_DISTRIBUTIONS` nommés.
  Éliminations et retraitements séparés par nature partout (liste, annulation, agrégat).
- 2026-09-26 — ⚡ **mesuré avant de borner** (leçon de STORY-530) : au pire cas admis (100 sociétés ×
  150 rubriques), le diagnostic réindexait les déclarations à chaque examen — **1,1 s** de boucle
  bloquée, ramenée à 40 ms ; le test de coût est dimensionné sur ce mutant (2,3 s, rouge ; 58 ms pour le
  code). ⚡ Une borne en LIGNES laissait passer des milliers d'omissions (zéro ligne) : le report se borne
  aussi en ÉCRITURES (2 000), jugé avant tout chargement.
- 2026-09-26 — ⚡⚡ **les tests écrits en parallèle ont trouvé sept défauts, tous corrigés** (confirmés en
  réactivant chaque test qui les montrait — 23 rouges, puis verts) :
  - ⛔ **le chargeur de référentiels écartait `racinesDeGestion`** : `ReferentielLoader.parse` reconstruit
    le paquet par LISTE BLANCHE — le champ était dans les octets vérifiés et perdu en route ; tout report
    d'un retraitement passé rendait `409 REPORT_IMPOSSIBLE`, et un compte de réserves de gestion
    n'était jamais reconnu. Les unitaires moquaient `load`, le harnais e2e doublait le chargeur : seul
    le contrat OpenAPI, qui monte le vrai, l'a vu. **Même famille exacte que STORY-656** — et le constat
    M4 du cadrage ne regardait que le TYPE. Prouvé sur les octets réels de quatre paquets ;
  - rubrique absente ⇒ 500 ; `effetImpot: []` ou `null` écrivait un effet d'impôt sans nature
    (contournait l'AC-4) ; `omission: null` s'écrivait comme un « retraitement » sans ligne qui valait
    décision ; tableaux imbriqués (`[[…]]`) parcourus comme la liste, contournant les bornes — corrigés
    par `@IsDefined()`, `@IsObject()`, `@IsObject({ each: true })` (lignes d'élimination de STORY-531
    comprises) et le refus explicite de `null` ;
  - `Model.bulkWrite()` ne passe par aucun crochet de requête : un `pre('bulkWrite')` refuse toute
    opération hors `insertOne`, sur `methodes_comptables` ET sur le journal de STORY-531 ;
  - deux énumérations anonymes du régime publié, nommées.
- 2026-09-26 — **mutations** : 48 mutants (règles pures, agrégation, service, dépôts, schémas,
  contrôleurs, DTO, chargeur, graphe du module), **48 rouges, aucun survivant dans la table** — ⚠️ un
  mutant HORS table survivait (l'arrondi ligne à ligne en IP) : relevé par la revue ⑥, gardé depuis — dont 13 réécrits pour
  compiler (un mutant qui casse la compilation ne prouve rien). En plus : le mutant du coût (rouge), le
  chargeur sans la ligne (5 rouges), et 22 mutations e2e menées par le sous-agent sur une copie isolée.
- 2026-09-26 — **portes** (`bilan-service` @ `3ee33f4`) : lint 0 (`{src,test}`), `nest build`, `test:cov`
  **5 106 unitaires** (237 suites ; couverture **99,19 / 95,77 / 99,46 / 99,27** ; fichiers neufs à 100 %
  des lignes), `test:e2e` **28 suites / 1 091**. Les e2e de la story (146 tests, services réels, dépôts
  doublés) et le contrat OpenAPI (le VRAI chargeur de référentiels monté) couvrent les sept routes.
- 2026-09-26 — **vérification docker sur stack NEUVE** (`down -v`), tout par les API réelles, 2 cabinets —
  scripts et journal : `PROSPERA/tmp/verif-docker-541/` ; attentes écrites AVANT (`SCENARIO.md`) :
  - phase 0 : le conteneur exécute `MNV-541` @ `3ee33f4` (sources hôte = src monté, marqueurs dans le
    `dist`, « Found 0 errors » après restart) — 21 OK ;
  - mise en place : cabinets, KYC, octrois (15 OK) ; groupe MÈRE, FILLE (IG 80 %), JV (IP 50 %), ASSO
    (MEE 25 %), exercices 2024 et 2025, périmètre arrêté au 2024-12-31 et au 2025-12-31 (17 OK) ; trois
    liasses 2025 figées, empreintes relevées (21 OK). ⚠️ Deux premiers passages de la phase 3 en échec
    (15 KO) — **erreurs du script, pas du produit** : `dossier-service` n'admet qu'un exercice OUVERT
    (409 `EXERCICE_DEJA_OUVERT`) — 2024 se clôt avant 2025 —, puis un état mal tenu après le 409 ;
  - **le scénario : 77 OK, 0 KO**. Discriminé : le **report appliqué par le VRAI chargeur** (réserves
    `118000` au crédit, 284500 cumulé, 681300 sans report — le code d'avant le correctif rendait
    `REPORT_IMPOSSIBLE`) ; la **version en vigueur** lue par les vraies requêtes Mongo (groupe v1 pour
    2024, v2 pour 2025, figées dans le régime des écritures) ; soldes = base + les seules écritures du
    scénario, RECOMPOSITION et EQUILIBRE satisfaits ; AC-6 (mère conforme, JV sans objet : 409, rien
    écrit ; groupe homogène = agrégation) ; omission contradictoire ; **liasses intactes à l'empreinte**
    (AC-3) ; annulation (plus de report, seconde annulation 409, route des éliminations 404) ;
    **changement de méthode** (FILLE v2 conforme ⇒ `METHODE_MODIFIEE`, écriture de solde acceptée malgré
    la conformité, puis 409) ; cloisonnement (B : 404 partout, rien chez B) ; persistance du journal et
    des méthodes, écriture par écriture (`dateEffet` à minuit UTC, aucun `updatedAt`).
  `docker compose stop` ensuite.
- 2026-09-26 — ⑤ branche `MNV-541` poussée, **PR `prospera-bilan-service#140`** ouverte sur `dev` ; statut
  `in_progress` → `review`.
- 2026-09-26 — ⑥ **revue de code** (scan `opus` en deux tranches — cœur métier, contrat/persistance/tests —,
  lentille `ponytail-review`, synthèse en session) : **6 constats retenus, 1 bloquant**, corrigés dans un
  commit dédié (`ba94c73`) :
  - ⛔ **bloquant — `estARevoir` ignorait la condition de D-541-9** (« avec un cumul reporté ») : un
    historique d'OMISSIONS seules, après un changement de méthode, bloquait le statut et **laissait passer
    un retraitement avec lignes sur une société conforme**, contre l'AC-6 — la seule façon d'obtenir
    `APPLIQUE` étant de produire l'écriture que l'AC-6 interdit. Codé comme décidé ; trois mutants de la
    règle, tous rouges ; tests d'omissions seules (règle, déclaration, diagnostic, rubrique retirée) ;
  - ⚡ **un mutant survivait à la passe de mutations** : le plus fort reste écriture par écriture
    (D-541-11) n'était gardé par aucun test — tous les cas IP n'avaient qu'une ligne par colonne, où
    l'arrondi ligne à ligne donne le même résultat. Test à deux débits d'une demi-unité ; le mutant rougit ;
  - Swagger : `GET …/eliminations` ne rend que les éliminations (le résumé disait « toutes les écritures »),
    `REPRISES_TROP_VOLUMINEUSES` nomme ses deux bornes et ses `details`, RECOMPOSITION et EQUILIBRE
    couvrent retraitements et reports ; JSDoc périmée de `METHODES_INCOHERENTES` ;
  - `ponytail` : deux simplifications retenues (`etablie` = aucun manque ; une seule façon de ranger
    l'exercice courant). Laissées de côté : la fabrique commune des deux gardes `bulkWrite` et le
    `contexte()` partagé entre les deux services (deux agrégats distincts, une dizaine de lignes chacun).
  Portes rejouées sur le module : 1 144 unitaires, e2e consolidation + contrat 392 verts.
- 2026-09-26 — ⑦ **revue de sécurité** (skill `prospera-security-review` : préparation `haiku`, analyse
  `opus` sur le diff final `ba94c73`, synthèse en session) : **1 constat retenu, confirmé dans le code et
  corrigé** dans un commit dédié (`54b0214`) :
  - ⛔ **CWE-770 — la déclaration d'un retraitement relisait tout l'historique, sans borne** :
    `declarerRetraitement` chargeait, hydratées (lignes, justification, effet d'impôt), toutes les
    homogénéisations actives de la (société, rubrique) sur TOUS les exercices de la mère, dont le
    nombre n'est pas borné. Sonde de la revue : ≈ 0,6 s de boucle bloquée par requête à 25 exercices
    de 200 écritures de 50 lignes. L'agrégat jugeait son report AVANT de charger ; la déclaration, non.
    Correctif : la borne du report (D-541-15) est jugée avant toute lecture, par la même méthode que
    l'agrégat (`409 REPRISES_TROP_VOLUMINEUSES`) ; l'historique se lit en TRACE (`historiqueDe` :
    agrégation projetée — numéro, exercice, régime, omission, « porte des lignes » calculé en base) ;
    les règles lisent une `TraceDHomogeneisation`. Unitaires, e2e (refus sans relire l'historique ; la
    déclaration ne lit jamais l'historique hydraté), contrat OpenAPI ; **8 mutants, 8 rouges** — dont
    un qui survivait d'abord : « porte des lignes » forcé à vrai dans la lecture du journal de
    l'agrégat, qu'aucun test de SERVICE ne gardait (« à revoir » sur une omission seule) ⇒ test ajouté.
  - Écartées (22 pistes examinées) : chaîne de guards intacte, rôles et portée de dossier sur les sept
    routes ; IDOR (`:societeId`, `societeDossierId`, `:exerciceId`, `:ecritureId`) ⇒ 404 sans
    énumération ; cloisonnement de chaque requête neuve ; injection NoSQL (vrais DTO sous le
    `ValidationPipe` réel : charsets) ; mass assignment ; immuabilité (`bulkWrite` compris) ; courses ;
    fuites dans les refus ; ReDoS ; agrégat (borné avant chargement, 93 ms à la borne).
  - Portes rejouées : lint 0, build, **5 125 unitaires** (couverture 99,19 / 95,88 / 99,46 / 99,27),
    **1 093 e2e**.
- 2026-09-26 — ⑧ **vérification docker REJOUÉE sur l'état final** (`54b0214`, stack NEUVE, `down -v`) —
  les correctifs de revue et de sécurité touchaient le chemin vérifié en ④ : **218 OK, 0 KO**
  (`PROSPERA/tmp/verif-docker-541/`, première passe archivée dans `passe-1/`) :
  - phases 0 à 5 : le conteneur exécute `MNV-541` @ `54b0214` (empreintes des fichiers montés,
    marqueur du correctif dans le `dist`) ; **le scénario entier, 77 OK**, « à revoir » compris sous la
    règle corrigée par la revue ;
  - phase 6, le correctif de sécurité **sur la base réelle** — écritures de sonde semées par `mongosh`
    sous un marqueur, puis retirées : à la borne (2 000 écritures, 10 000 lignes), l'historique se lit
    en trace (`$project` et `$size` exécutés par Mongo 7), le refus métier reste juste, **74 ms** de
    médiane ; une écriture de plus ⇒ `409 REPRISES_TROP_VOLUMINEUSES` à la déclaration COMME à
    l'agrégat, `details` exacts, rien d'écrit ; au volume de l'attaque (5 000 écritures de 50 lignes),
    la MÊME requête : **838,7 ms sous l'ancien code** (`ba94c73`, extrait puis vérifié à l'empreinte
    dans le conteneur) **contre 60,4 ms** — refusée avant toute lecture. Retour au code final vérifié,
    sonde retirée, état de la phase 5 revérifié (agrégat calculé, `APPLIQUE`).
  `docker compose stop` ensuite.
- 2026-09-26 — ⑧ **`prospera-bilan-service#140` rebase-mergée sur `dev`** (`8d6791a`), branche supprimée.
- 2026-09-26 — ⑨ **clôture** : statut `review` → `done` aux trois endroits, `completed_date` posé ; PR
  `docs/` sur `main`.
