# STORY-685 : Les écritures passées pour la seule loi fiscale restent dans les comptes consolidés

Status: ready-for-dev

**Épic :** EPIC-137 — Homogénéisation et éliminations (consolidation)
**Service :** `bilan-service` — module `consolidation`
**Points :** 8 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-541** (le journal des retraitements, leur report, leur effet d'impôt)
**Origine :** cadrage de STORY-541 (2026-09-26), constat M2 — relecture intégrale de l'art. 86 de l'AUDCIF.

---

## Le fait

*« La consolidation impose : […] 3°) l'élimination de l'incidence sur les comptes des écritures passées
pour la seule application des législations fiscales »* (AUDCIF, art. 86 3°).

Les **amortissements dérogatoires** et les **provisions réglementées** (comptes `15x`, dotations et
reprises HAO en SYSCOHADA) n'existent dans les comptes individuels que parce que la loi fiscale les
autorise ou les impose. Le groupe n'en reprend pas l'incidence : additionnées telles quelles, elles
minorent les capitaux propres et le résultat consolidés d'un montant qui ne décrit aucune dépréciation
économique.

⛔ Ni le découpage du 2026-08-28 (STORY-541 → 548) ni la liste fermée des traitements (D-531-9) ne
fichaient cette opération : l'état aurait pu s'appeler « consolidé » sans elle. STORY-541 l'a nommée
`ECRITURES_FISCALES`, `NON_TRAITE`, requise.

## Critères d'acceptation

- [x] AC-1 — L'élimination est une écriture du journal de consolidation, identifiée, motivée,
      réversible, rattachée à la société d'origine — le patron des retraitements de STORY-541.
- [x] AC-2 — ⚠️ **Elle a un effet d'impôt** (art. 92 : impositions différées des retraitements de
      l'art. 86) : déclaré sur l'écriture, comme en STORY-541 AC-4.
- [x] AC-3 — Son cumul se **reporte** d'un exercice à l'autre (l'amortissement dérogatoire se cumule
      au passif), exactement comme les retraitements d'homogénéisation (D-541-8).
- [x] AC-4 — Cadrer AVANT de coder ce qui peut être **PROPOSÉ** : les comptes de provisions
      réglementées se reconnaissent par le paquet de référentiel (à vérifier, référentiel par
      référentiel — jamais par le premier chiffre), le montant se lit dans la liasse ; un proposé n'a
      aucun effet tant qu'il n'est pas confirmé.
- [x] AC-5 — Le traitement `ECRITURES_FISCALES` passe `APPLIQUE` selon une règle écrite et testée ;
      un groupe sans écriture fiscale produit zéro écriture (non-régression, patron STORY-541 AC-6).

## Notes

- Voir [[STORY-541]] (D-541-13), [[STORY-545]] (impôts différés).
- Dernier alinéa de l'art. 86 : l'opération peut être omise si son incidence est **négligeable** —
  une omission motivée, comme en STORY-541 (D-541-6), jamais un silence.

---

# Cadrage — fait AVANT toute ligne de code (AC-4)

Sources : **AUDCIF 2017, art. 86 3°** et son dernier alinéa (relus au cadrage de STORY-541) ; le **SYSCOHADA
révisé**, édition officielle (`tmp/cadrage-544/d4c-officiel.pdf`, pages rendues en image et lues à l'image —
`tmp/cadrage-685/`) : **D4C, titre XII, ch. 3, section 2, § 2.2 et § 2.2.1, p. 1152** ; ch. 3, § 3.2.3, p. 1155 ;
**PCGO, liste des comptes, p. 219 (compte 15) et p. 265 (comptes 85 et 86)** ; les paquets embarqués de
`bilan-service` (`dev` @ `4c93357`) ; le code du module `consolidation` (STORY-531 à 548) ; les fiches STORY-541
et STORY-545.

## Les constats mesurés

### C1 — Le texte dit exactement l'opération, et la ventilation résultat / réserves

D4C, § 2.2, p. 1152 : *« Ces retraitements sont destinés à éliminer l'incidence sur les comptes des écritures
passées pour la seule application des législations fiscales du pays où se situe l'entité. Ils consistent à :
éliminer les provisions réglementées ; reclasser les subventions d'investissements ; éliminer les écritures liées
à la comptabilisation des changements de méthodes dans le compte de résultat. »* § 2.2.1 : *« Les retraitements
consistent à contre-passer les écritures enregistrées dans les comptes individuels. L'incidence des éliminations
concernant l'exercice est constaté dans le résultat et les éliminations concernant les exercices antérieurs sont
constatées en réserves. »* ⇒ c'est **mot pour mot** le report de D-541-8 (effet de l'exercice au résultat, celui
des exercices passés en réserves). § 3.2.3, p. 1155 : les impôts différés résultent notamment *« de l'élimination
de l'incidence des écritures passées pour la seule application des législations fiscales »*.

⛔ Le § 2.2 compte **trois** opérations ; la story n'en cadre qu'**une** (les provisions réglementées, dont les
amortissements dérogatoires). Le reclassement des subventions (§ 2.2.2 : *« ni incidence sur le résultat, ni
impôt différé »*) et les changements de méthode passés au résultat pour raison fiscale (§ 2.2.3) ne sont pas
couverts — nommés (D-685-13), jamais tus.

### C2 — Les comptes, référentiel par référentiel : SEUL le SYSCOHADA a des provisions réglementées reconnaissables

Mesuré sur les dix paquets de liasse embarqués (`planDeComptes`, `tableDePassage`, `racinesDeGestion`) :

| Paquet | Provisions réglementées | Dotations / reprises | Racines de gestion | Règles de consolidation (pont) |
|---|---|---|---|---|
| `syscohada-revise@2.1`, `@2.2` | compte `15` « Provisions réglementées et fonds assimilés » → poste `CM` « Provisions réglementées » | `85`, `86` au plan (deux chiffres seulement), postes `RP` / `TO` HAO **mêlés** (`83`+`85`, `84`+`86`+`88`) | `6`,`7`,`8` | `consolidation-audcif@1.0…1.4` |
| `zone-franche-togo@1.0` | idem (`15` → `CM`) | idem | `6`,`7`,`8` | idem |
| `smt-togo@1.0` | `15` au plan, **rattaché à aucun poste** ; `85` dans `CR9` « Autres dépenses » | — | `6`,`7`,`8` | **aucune** |
| `sfd-bceao@1.0`, `@2.0` | ⛔ **`15` = « Comptes ordinaires des institutions financières »** (trésorerie) ; les provisions réglementées sont en **`52`**, dotations `668`, reprises `768` | — | `6`,`7` | **aucune** |
| `cima-assurances@1.0…5.0` | ⛔ **`15` = « Provisions pour pertes et charges »** ; `13` « Réserves réglementaires » (code CIMA — art. 88 al. 2, pas la loi fiscale) | `83` mêle provisions exceptionnelles et réserves réglementaires | `6`,`7`,`82…86` | **aucune** |

⇒ **Le premier chiffre est faux deux fois sur trois** (SFD, CIMA). Et aucun paquet de liasse ne DÉCLARE quels
comptes sont fiscaux : le SYSCOHADA ne porte que les comptes à deux chiffres (`85` mêle `851` provisions
réglementées, `852` amortissements HAO, `853`, `854`, `858`) — distinguer `851` exige le PCGO, que le paquet ne
transcrit pas.

### C3 — Le PCGO nomme les comptes, à trois chiffres

PCGO p. 219 : *« 15 PROVISIONS RÉGLEMENTÉES ET FONDS ASSIMILÉS — 151 AMORTISSEMENTS DÉROGATOIRES ; 152 PLUS-VALUES
DE CESSION À RÉINVESTIR ; 153 FONDS RÉGLEMENTÉS ; 154 PROVISIONS SPÉCIALES DE RÉÉVALUATION ; 155 PROVISIONS
RÉGLEMENTÉES RELATIVES AUX IMMOBILISATIONS ; 156 PROVISIONS RÉGLEMENTÉES RELATIVES AUX STOCKS ; 157 PROVISIONS POUR
INVESTISSEMENT ; 158 AUTRES PROVISIONS ET FONDS RÉGLEMENTES »*. PCGO p. 265 : *« 851 DOTATIONS AUX PROVISIONS
RÉGLEMENTÉES »*, *« 861 REPRISES DE PROVISIONS RÉGLEMENTÉES »*. Le modèle de bilan (p. 998, déjà cité par
`consolidation-audcif@1.1`) range le compte `15` entier sous « Provisions réglementées ».

### C4 — Le bon porteur est le paquet des RÈGLES de consolidation, pas celui des liasses

`consolidation-audcif` publie déjà des racines propres au SYSCOHADA (`89` pour l'impôt, `10`…`15` pour les capitaux
propres) et n'est rattaché, par le pont du `ReglesConsolidationRegistry`, qu'aux trois référentiels SYSCOHADA
(`syscohada-revise@2.1`, `@2.2`, `zone-franche-togo@1.0`) — un SFD, une compagnie d'assurance, un SMT n'en ont
**aucun**, « un cas normal ». C'est exactement « référentiel par référentiel ». Le paquet de liasse, lui, est
**recopié à l'octet dans `balance-service`** (M7 de STORY-543) : y ajouter un marqueur ferait bouger deux dépôts
pour une raison qui n'est pas la liasse.

### C5 — Le montant se lit dans la liasse figée, et le report en dit déjà une partie

La balance de chaque société intégrée est lue sur sa liasse FIGÉE (`soldesDesSources`, convertie au groupe par
STORY-547). Mais les liasses ne contiennent jamais les éliminations passées : en N+1 le compte `151` porte
le cumul ENTIER, dont la part de N est déjà éliminée par le report. ⇒ ce qui reste à éliminer est le **solde
résiduel** de chaque compte reconnu, une fois le report et l'écriture de l'exercice appliqués — et il est nul quand
tout est éliminé.

### C6 — ⚠️ La base d'impôt différé de STORY-545 ne voit PAS une écriture fiscale

`elementsDesEcritures` (D-545-3) range une ligne en capitaux propres si son compte tombe sous les racines
`10`…`15` de `consolidation-audcif@1.1`. Une élimination fiscale ne touche QUE le `15` (capitaux propres), les
`851`/`861` (gestion) et les réserves : passée telle quelle, sa base `B1` vaut **0** — aucun passif d'impôt
différé, et la charge d'impôt s'impute en réserves. Faux : dans les comptes consolidés le bien garde sa valeur
alors que sa base fiscale a été diminuée de l'amortissement dérogatoire déduit ⇒ **différence temporelle = la
provision éliminée** (passif, `B > 0`).

### C7 — Le journal, les colonnes et les contrôles de STORY-541 suffisent

Le journal admet une nature de plus ; l'agrégat a deux colonnes de retraitements (`retraitements` de l'exercice,
`reprises` des exercices passés) que RECOMPOSITION, EQUILIBRE, le partage des minoritaires (par `dossierId` de
l'imputation), la preuve d'impôt et les états consolidés lisent déjà. D4C range les éliminations fiscales parmi
les « retraitements des comptes individuels » (ch. 3, section 2) : elles y vont.

### C8 — Bornes

Le report relit le journal de TOUS les exercices passés de la mère : il se compte avant de se charger, et se lit
projeté (seules les écritures qui portent des lignes, sans texte). Une proposition peut compter autant de lignes
que la société a de comptes reconnus : bornée par `LIGNES_PAR_ECRITURE_MAX` (50), au-delà nommée.

## Les décisions

**D-685-1 — L'écriture (AC-1).** Nature **`ECRITURE_FISCALE`** au journal `ecritures_consolidation` : **une**
société (sa société d'origine, `societeDossierId`, toutes les lignes la mouvementent), justification
obligatoire, numérotée, annulable avec motif, jamais réécrite (gardes de schéma de STORY-531). Origine
`DECLAREE` (le cabinet) ou `PROPOSEE` (confirmée, `sources` : la liasse figée citée). ⛔ **Une écriture fiscale
ACTIVE par exercice et par société** — index unique partiel (le vrai filet de deux confirmations concurrentes),
refus `409 ECRITURE_FISCALE_DEJA_DECLAREE` nommant l'écriture en place ; corriger = annuler puis redéclarer.
Chaque route ne lit que sa nature (liste, annulation, agrégat).

**D-685-2 — Reconnaître les comptes (AC-4) : `consolidation-audcif@1.5`.** 1.4 plus une clé `ecrituresFiscales` :
`provisionsReglementees.racines` `["15"]`, `dotations.racines` `["851"]`, `reprises.racines` `["861"]`, chacune
avec ses fondements **verbatim** (PCGO p. 219, p. 265 ; D4C p. 1152), et `elimination.fondements` (§ 2.2, § 2.2.1,
§ 3.2.3). Rattachée par le pont aux seuls référentiels SYSCOHADA (C4) ; SMT, SFD, CIMA : aucune règle ⇒ rien n'est
proposé (D-685-9). Relue par **liste blanche** dans `ReglesConsolidationLoader` (refus si mal formée) — test par le
VRAI chargeur sur l'artefact réel. **Jamais le premier chiffre** : en plus, la cohérence est jugée contre les
`racinesDeGestion` du paquet DES LIASSES — une racine de provisions sous une racine de gestion, ou une racine de
dotation/reprise hors gestion ⇒ règles incohérentes, rien proposé, manque nommé.

**D-685-3 — Le montant proposé (AC-4).** Pour chaque société intégrée, sur sa balance au groupe (celle que
l'agrégat additionne, à 100 %) : pour chaque compte reconnu, le **résiduel** = solde de la liasse + lignes de
l'écriture fiscale active de l'exercice + lignes reportées (C5). La proposition **contre-passe** chaque résiduel
non nul, compte par compte (D4C § 2.2.1) ; ce qui ne s'équilibre pas — la part des exercices antérieurs, non
encore éliminée — va au **compte de réserves du groupe** (D-541-2). Résiduel nul partout ⇒ rien à proposer.
Proposition impossible, raison nommée : compte de réserves non déclaré ou de gestion
(`COMPTE_RESERVES_NON_DECLARE`, `COMPTE_RESERVES_INVALIDE`), plus de 50 lignes (`PROPOSITION_TROP_VOLUMINEUSE`).

**D-685-4 — Sans effet tant que non confirmé (AC-4).** La proposition est PUBLIÉE (section `ecrituresFiscales` de
l'agrégat), jamais écrite : elle ne touche aucun chiffre. `POST …/ecritures-fiscales/propositions/:societeId/
confirmation` la **RECALCULE** sur les liasses figées du moment — les lignes ne sont jamais reçues du client —,
puis l'écrit au journal, origine `PROPOSEE`, `sources` (liasse, version, empreinte). Le patron des éliminations
proposées de STORY-542 (D-542-3).

**D-685-5 — Déclarer, ou omettre (art. 86, dernier alinéa).** `POST …/ecritures-fiscales` : des lignes (≥ 2,
équilibrées, toutes sur la société, chacune débitée OU créditée) avec l'effet d'impôt, ou une **omission
motivée** sans ligne (`INCIDENCE_NEGLIGEABLE` | `SANS_INCIDENCE`, justification obligatoire — D-541-6). ⛔ Avec
des règles, une société **sans rien à éliminer** (résiduel nul) ne reçoit **aucune** écriture :
`409 RIEN_A_ELIMINER` (AC-5, patron `SOCIETE_CONFORME`). Sans règles (SFD, CIMA, SMT), le produit ne sait pas : la
déclaration est le jugement du cabinet.

**D-685-6 — L'effet d'impôt (AC-2, art. 92).** Déclaré sur l'écriture — à la déclaration COMME à la
confirmation : `DIFFERENCE_TEMPORELLE` ou `AUCUN` avec sa raison ; le silence est refusé
(`400 EFFET_IMPOT_NON_DECLARE`, D-541-7) ; une omission n'en porte pas. Il **alimente STORY-545** : origines
`ECRITURE_FISCALE` (exercice) et `REPORT_ECRITURE_FISCALE` ; pour ces deux origines seulement, une ligne sur une
racine de provisions réglementées compte dans la **base** (C6). Exemple : provision cumulée 1 000 dont 300 de
dotation de l'exercice, taux 27 % — `B1 = 1 000`, `ΔR = 300`, `ΔE = 700` ⇒ passif 270, réserves 189, charge 81 ;
l'exercice suivant, reporté : `B0 = B1 = 1 000`, charge 0. Une écriture `AUCUN` entre dans les « écritures sans
impôt différé » de la preuve d'impôt.

**D-685-7 — Le report du cumul (AC-3).** Chaque écriture fiscale ACTIVE à lignes des exercices antérieurs de la
mère est **rejouée à l'identique** à chaque agrégat, par la fonction de STORY-541 (`reprendre`) : lignes de bilan
telles quelles, lignes de gestion remplacées par une ligne au compte de réserves du groupe pour leur net. Société
qui n'est plus intégrée ⇒ non appliqué, nommé. Racines de gestion inconnues ⇒ `409 REPORT_IMPOSSIBLE` ; réserves de
gestion ⇒ `409 COMPTE_RESERVES_INVALIDE` (les refus de D-541-8). Annulée ⇒ plus reportée.

**D-685-8 — Les colonnes.** Les écritures fiscales de l'exercice entrent dans la colonne `retraitements`, leurs
reports dans `reprises` (C7) — intégrées au pourcentage de la société, écriture par écriture (D-541-11) ;
RECOMPOSITION, EQUILIBRE, minoritaires, preuve d'impôt et états les lisent sans changement.

**D-685-9 — Le statut de `ECRITURES_FISCALES` (AC-5).** `APPLIQUE` si et seulement si chaque société intégrée (la
mère comprise) est :
- **avec des règles** : sans résiduel sur aucun compte reconnu (`SANS_ECRITURE_FISCALE` si rien n'a jamais été
  mouvementé, `ELIMINEE` sinon), ou couverte par une **omission** active de l'exercice (`OMISE`) ;
- **sans règles** (référentiel sans paquet de consolidation, ou paquet antérieur à 1.5) : couverte par une
  écriture fiscale active de l'exercice — lignes ou omission (`DECLAREE`, `OMISE`) ; sinon `NON_EXAMINEE`.
Et les règles, si publiées, cohérentes. Sinon `NON_TRAITE`, chaque manque nommé (`ECRITURE_FISCALE_NON_ELIMINEE`
avec le résiduel, `ECRITURES_FISCALES_NON_EXAMINEES`, `REGLES_ECRITURES_FISCALES_INCOHERENTES`). ⚡ **AC-5** : un
groupe dont aucune société ne mouvemente un compte reconnu produit **zéro écriture, zéro report, zéro
proposition**, des lignes **identiques** à l'agrégation, et `ECRITURES_FISCALES` `APPLIQUE` — sans compte de
réserves, sans rien déclarer. La règle de qualification (D-531-1) ne change pas.

**D-685-10 — Qui.** La mère et les sociétés intégrées (IG, IP) seulement — refus `409 SOCIETE_NON_RETRAITABLE`
nommé (`HORS_GROUPE` sans identité). Une écriture fiscale active sur une société sortie ou passée en équivalence ⇒
`409 ECRITURE_HORS_PERIMETRE` à l'agrégat, jamais ignorée. Les associées (mise en équivalence) : hors périmètre
(D-685-13).

**D-685-11 — Routes et rôles.** Sous `@RequiresDossierScope()` (la mère) et `@RequiresBilanAccess()`,
`TENANT_ADMIN` et `TENANT_USER` (travail préparatoire, D-531-10) :
`GET|POST …/consolidation/exercices/:exerciceId/ecritures-fiscales`,
`POST …/ecritures-fiscales/propositions/:societeId/confirmation`, `POST …/ecritures-fiscales/:ecritureId/annulation`
(les routes littérales déclarées avant les paramétrées) ; `GET …/agregat` publie la section `ecrituresFiscales`
(règles lues, état de chaque société, résiduel, proposition, écritures, reports, manques).

**D-685-12 — Bornes.** Le report se compte AVANT d'être chargé (`ECRITURES_REPORTEES_MAX` écritures,
`LIGNES_REPORTEES_MAX` lignes, `409 REPRISES_TROP_VOLUMINEUSES`), puis se lit **projeté** (écritures à lignes, sans
texte hydraté hors la justification citée) — à l'agrégat ET à la déclaration/confirmation, qui ne lisent que la
société visée. Aucune autre lecture nouvelle hors des écritures actives de l'exercice (déjà bornées à 200).

**D-685-13 — Hors périmètre — hooks inertes documentés.** Le reclassement des subventions d'investissement
(§ 2.2.2) et les changements de méthode passés au résultat pour raison fiscale (§ 2.2.3) — nommés dans la
`miseEnGarde` de `consolidation-audcif@1.5`, **à ficher** ; les écritures fiscales des associées (mise en
équivalence, STORY-546) ; des règles pour le SFD (`52`/`668`/`768`) et le SMT, dont aucun paquet de
consolidation n'existe ; le compte `153` (fonds réglementés) est inclus parce que le modèle de bilan le range sous
« Provisions réglementées » — un cabinet qui juge autrement déclare son écriture au lieu de confirmer.

## Table de mutations — une par décision, chacune APPLIQUÉE (une occurrence exacte), jugée sur `Test Suites` et `Tests`, restaurée depuis le commit

Script et journal : `tmp/verif-docker-685/mutations/` (`mutants.py`, `passe.py`, `passe.log`, `passe-reprise.log`).
**28 mutants, 28 rouges.** Premier passage : 22 rouges, 5 qui ne compilaient pas (M01, M05, M13, M15, M20 —
variable devenue inutilisée, code inatteignable) et 1 non appliqué (M06 — la ligne reformatée) : ⛔ aucun
n'est un rouge ; réécrits en formes compilables et typées, rejoués seuls, rouges.

| # | Décision | Mutation | Verdict |
|---|---|---|---|
| M01 | D-685-2 | la clé `ecrituresFiscales` écartée par le parse (liste blanche) | ROUGE — 15 tests (chargeur, artefact réel) |
| M02 | D-685-2 | les provisions codées en dur à `15` au lieu des racines du paquet | ROUGE — 5 |
| M03 | D-685-2 | le SFD ajouté au pont (référentiel par référentiel) | ROUGE — 4 |
| M04 | D-685-2 | `familleDe` lit le PREMIER CHIFFRE de la racine | ROUGE — 23 |
| M05 | D-685-2 | la cohérence contre les racines de gestion des liasses retirée | ROUGE — 4 |
| M06 | D-685-3 | la part antérieure jamais portée en réserves | ROUGE — 12 |
| M07 | D-685-3 | le résiduel ignore le report et l'écriture de l'exercice | ROUGE — 10 |
| M08 | D-685-4 | une proposition vaut élimination (aucun manque) | ROUGE — 3 |
| M09 | D-685-4 | la contre-passation dans le mauvais sens | ROUGE — 11 |
| M10 | D-685-1 | l'index partiel sans la nature | ROUGE — 3 |
| M11 | D-685-1 | l'E11000 de l'index fiscal non relu (réessayé comme une course au numéro) | ROUGE — 1 |
| M12 | D-685-1 | la pré-lecture « déjà déclarée » neutralisée | ROUGE — 1 |
| M13 | D-685-5 | `RIEN_A_ELIMINER` retiré (AC-5) | ROUGE — 1 |
| M14 | D-685-6 | `AUCUN` accepté sans sa raison | ROUGE — 1 |
| M15 | D-685-6 | les provisions réglementées restent des capitaux propres (B1 = 0) | ROUGE — 6 |
| M16 | D-685-6 | les racines des provisions non transmises aux impôts différés | ROUGE — 2 |
| M17 | D-685-6 | une écriture fiscale `AUCUN` oubliée par la preuve d'impôt | ROUGE — 1 |
| M18 | D-685-7 | les écritures passées jamais rejouées | ROUGE — 5 |
| M19 | D-685-7 | la gestion reportée telle quelle (résultat passé recompté) | ROUGE — 8 |
| M20 | D-685-7 | une société sortie reportée quand même | ROUGE — 2 |
| M21 | D-685-8 | l'écriture de l'exercice jamais appliquée à l'agrégat | ROUGE — 3 |
| M22 | D-685-9 | `ECRITURES_FISCALES` toujours `APPLIQUE` | ROUGE — 3 |
| M23 | D-685-9 | sans règles, une société non examinée établie par silence | ROUGE — 4 |
| M24 | D-685-10 | une écriture fiscale sur une associée admise à l'agrégat | ROUGE — 1 |
| M25 | D-685-12 | le volume du report non compté avant lecture | ROUGE — 2 |
| M26 | D-685-12 | la confirmation relit l'historique de TOUT le groupe | ROUGE — 1 |
| M27 | D-685-11 | la route littérale de confirmation remplacée / déclarée après la paramétrée | ROUGE — 2 |
| M28 | D-685-9 | les règles lues ignorées (statut sans le paquet) | ROUGE — 5 |

## Vérification docker — À REJOUER (non exécutée : consigne du dev, « ne lance pas docker »)

Scénario écrit AVANT toute exécution, attentes posées à la main : `tmp/verif-docker-685/SCENARIO.md`. En
résumé : stack NEUVE (`down -v`), phase 0 (le conteneur exécute `MNV-685`, artefact 1.5 à l'empreinte
`2bac2dad…`) ; cabinets A/B, MÈRE, FILLE (IG 80 %), JV (IP 50 %), ASSO (MEE 25 %), périmètres arrêtés 2024 et
2025, liasses figées (FILLE 2024 : `151000` C 700 000 / `851000` D 700 000 ; FILLE 2025 : `151000` C 1 000 000 /
`851000` D 300 000) ; puis douze étapes : règles du paquet RÉEL publiées ; refus sans écriture (aucun document
dans `ecritures_consolidation`) ; proposition sans effet ; confirmation 2024 (document vérifié par `mongosh` :
nature, société, origine, sources à l'empreinte) ; report 2024 → 2025 (proposition réduite au mouvement de
2025) ; confirmation 2025 (`APPLIQUE`, passif d'impôt différé 270 000 à 27 %) ; ⛔ **la course sur l'index
RÉEL** (`getIndexes()` — filtre partiel `{statut: ACTIVE, nature: ECRITURE_FISCALE}` — deux confirmations
simultanées, une seule active en base) ; annulation et sa trace ; liasses intactes à l'empreinte ;
cloisonnement (B : 404, rien chez B) ; persistance sans orphelin. Collections réelles : `ecritures_consolidation`,
`methodes_comptables`, `snapshots_liasse`, `jeux_etats`, `perimetres_arretes`.

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-26).** Créée par le cadrage de STORY-541 (D-541-13).

- 2026-10-02 — branche `MNV-685` (bilan-service, depuis `dev` @ `4c93357`) ; **cadrage fait avant tout code** :
  8 constats, 13 décisions. Seul le SYSCOHADA a des provisions réglementées reconnaissables (en SFD le `15` est de
  la trésorerie, en CIMA des provisions pour charges — C2) ; elles se déclarent au paquet des RÈGLES de
  consolidation (`consolidation-audcif@1.5`), pas au paquet des liasses recopié dans `balance-service` (C4) ; la base
  d'impôt différé de 545 ne voyait pas une élimination fiscale (C6).

- 2026-10-02 — **dev `bilan-service`** (branche `MNV-685`, 4 commits `deb18bf` → `462e2b1`, non poussée) :
  `consolidation-audcif@1.5` (empreinte `2bac2dad…`, ponté aux seuls référentiels SYSCOHADA, relu par liste
  blanche) ; nature `ECRITURE_FISCALE` et son index unique partiel ; règles pures
  (`ecritures-fiscales.regles.ts` : reconnaissance, résiduel, proposition, report, diagnostic) ; agrégat (colonnes
  `retraitements`/`reprises`, section `ecrituresFiscales`, statut conditionnel) ; impôts différés (origines
  `ECRITURE_FISCALE`/`REPORT_ECRITURE_FISCALE`, base lue sur les provisions réglementées) ; quatre routes
  (`EcrituresFiscalesController`) ; cinq codes de refus inscrits à l'inventaire, trois clés de `details`
  documentées. *Précisé en cours de dev :* une société dont l'écriture active n'élimine pas tout n'a pas de
  proposition (`raisonSansProposition: ECRITURE_FISCALE_ACTIVE`) — la confirmation serait refusée par l'index.
- 2026-10-02 — ⚡ **défaut trouvé par les tests, corrigé** : à la confirmation, des règles INCOHÉRENTES étaient
  publiées `raison: ABSENTES` (la situation rend des règles inutilisables `null`) — la raison se lit désormais
  sur la liste des incohérences. ⚠️ Clé de `details` renommée `racinesIncoherentes` : `incoherences` existait
  déjà au contrat avec une autre forme (relevé par la garde de contrat des e2e).
- 2026-10-02 — **conséquences voulues sur l'existant** : la plus haute version servie par le pont est 1.5 (les
  tests de 543 à 547 qui citaient 1.4 l'ont suivie, comme STORY-547 l'avait fait) ; le groupe de référence des
  e2e (aucun compte 15/851/861) a désormais `ECRITURES_FISCALES` `APPLIQUE` — c'est l'AC-5 ; deux invariants
  transverses (index unique de dossier, 22ᵉ contrôleur niché) ; le double e2e du journal apprend les trois
  lectures neuves.
- 2026-10-02 — **mutations** : 28 / 28 rouges (table ci-dessus).
- 2026-10-02 — **portes** (`bilan-service` @ `462e2b1`, `--maxWorkers=2`) : lint 0 avertissement (`{src,test}`),
  `nest build` OK, `test:cov` **299 suites, 11 079 tests verts** (2 ignorés, préexistants), couverture **99,41 /
  96,96 / 99,56 / 99,51** (seuils 65/90/90/90) — fichiers neufs : `ecritures-fiscales.regles.ts` 100 / 96 / 100 /
  100, `ecritures-fiscales.controller.ts` 100 %, dépôt 100 % ; `test:e2e` **37 suites, 2 551 tests verts** (dont
  `consolidation-ecritures-fiscales.e2e-spec.ts` : 20, et le contrat OpenAPI avec le VRAI chargeur). Aucun JSDoc
  détaché introduit (les trois signalés sur la branche existent sur `dev`), aucun octet NUL.
- 2026-10-02 — **vérification docker : NON faite** (consigne). Scénario prêt à rejouer : `tmp/verif-docker-685/
  SCENARIO.md`. ⛔ L'atomicité et l'index unique partiel ne sont prouvés que sur le double en mémoire.
