# STORY-686 : L'impôt sur les distributions prévues entre sociétés du groupe n'est constaté nulle part

Status: done

**Épic :** EPIC-139 — Impôts différés et mise en équivalence
**Service :** `bilan-service` — module `consolidation`
**Points :** 5 · **Sprint :** S20 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Prérequis :** **STORY-541** (le journal), **STORY-545** (les taux d'impôt par entité)
**Origine :** cadrage de STORY-541 (2026-09-26), constat M2 — relecture intégrale de l'art. 86 de l'AUDCIF.

---

## Le fait

*« La consolidation impose : […] 5°) la constatation de charges, lorsque les impositions afférentes à
certaines distributions prévues entre des entités consolidées par intégration ne sont pas récupérables,
ainsi que la prise en compte des réductions d'impôts, lorsque des distributions prévues en font
bénéficier des entités consolidées par intégration »* (AUDCIF, art. 86 5°).

Une filiale qui distribuera ses réserves à la mère subira une retenue à la source (IRVM) que le groupe ne
récupère pas toujours : la charge existe **pour le groupe** dès que la distribution est prévue, et
aucune liasse individuelle ne la porte. À l'inverse, un régime mère-fille peut procurer une réduction.

⛔ Comme le 3°, cette opération n'était fichée nulle part ; STORY-541 l'a nommée
`IMPOSITIONS_SUR_DISTRIBUTIONS`, `NON_TRAITE`, requise.

## Critères d'acceptation

- [ ] AC-1 — Une distribution **prévue** est déclarée (société distributrice, bénéficiaire, montant,
      exercice) — un jugement du cabinet, hébergé, jamais deviné.
- [ ] AC-2 — La charge d'impôt non récupérable (ou la réduction) est une écriture du journal de
      consolidation, au taux de la juridiction **de la distributrice** (lien avec STORY-492/493 et
      STORY-545 AC-2), jamais un taux groupe.
- [ ] AC-3 — Aucune distribution prévue ⇒ aucune écriture ; le traitement passe `APPLIQUE` selon une
      règle écrite et testée.

## Notes

- Voir [[STORY-541]] (D-541-13), [[STORY-545]], [[STORY-492]], [[STORY-493]].
- Cadrer d'abord ce que « prévue » veut dire (décision d'assemblée, politique de distribution) : c'est
  la donnée que le produit ne possède pas.

---

# Cadrage — fait AVANT toute ligne de code

Sources : **AUDCIF 2017, art. 86 5°** ; le **SYSCOHADA révisé**, édition officielle (`tmp/cadrage-544/d4c-officiel.pdf`,
pages rendues en image et lues à l'image — `tmp/cadrage-686/`) : **D4C, titre XII, ch. 3, section 3, § 3.2.2,
§ 3.2.3, § 3.3 et § 3.4, p. 1154 à 1157** ; les paquets fiscaux embarqués de `bilan-service` (`dev` @ `432ced7`) ; le
code du module `consolidation` (STORY-531 à 548, 685) ; les fiches STORY-541, STORY-545, STORY-685 et STORY-687.

## Les constats mesurés

### C1 — Le SYSCOHADA range l'opération parmi les IMPÔTS DIFFÉRÉS

D4C § 3.2.2, p. 1154 : *« Sont enregistrées au Bilan et au Compte de résultat consolidé les impositions différées
résultant : d'une part et dans une approche dite de résultat, […] 2°) des aménagements, éliminations et
retraitements prévus à l'article 86 de l'Acte uniforme »*. § 3.2.3, p. 1155-1156, dernier tiret de la liste des
impôts différés à comptabiliser : *« de la constatation de charges, lorsque des impositions afférentes à certaines
distributions prévues ne sont pas récupérables, ainsi que de la prise en compte de réduction d'impôts du fait des
distributions prévues. »* § 3.3, p. 1157 : évalués *« en utilisant les taux d'impôt et les réglementations fiscales
en vigueur à la date de clôture »*, *« selon la méthode du report variable »*, *« l'actualisation […] est
interdite »*. § 3.4 : un actif d'impôt différé n'est comptabilisé que *« dans la mesure où il est probable »*.

⇒ Une imposition non récupérable sur une distribution prévue est un **passif d'impôt différé** (une dette d'impôt
future), une réduction un **actif d'impôt différé** (une créance d'impôt future). Elle relève du moteur de
STORY-545 : élément par entité, actif et passif jamais compensés, report variable, jugement sur l'actif, preuve
d'impôt.

### C2 — Aucun paquet fiscal embarqué ne publie le taux d'une imposition de distribution

Mesuré sur les trois paquets fiscaux de `bilan-service` (tous togolais, `_meta.pays: "TG"`) :

| Paquet | Ce qu'il publie | Le taux d'une distribution |
|---|---|---|
| `syscohada-revise@2.1`, `@2.2` | `is.taux` 0,27 (Art. 113 CGI), TVA, MFP, acomptes, régimes | ⛔ aucun : `autresImpotsTaxes.presentsDansCGI` cite les *« Retenues a la source »* **en prose, sans taux** |
| `zone-franche-togo@1.0` | `is` à paliers, `taxeDividendes` | ⛔ `taxeDividendes.paliers[].part` = *« fraction du taux normal de la taxe sur les dividendes »* — le taux normal n'est **pas publié** |

⇒ Le taux d'IS que lit STORY-545 (`tauxDeLaSociete`) n'est **pas** celui d'une retenue sur dividendes : l'appliquer
fabriquerait un impôt faux, avec une provenance impeccable (patron STORY-412/422). Le taux se **déclare**.

### C3 — « Prévue » est une donnée que le produit ne possède pas

Aucune liasse, aucun read-model, aucun périmètre ne porte une décision d'affectation du résultat ni une politique de
distribution. Une distribution *prévue* à la clôture est, par nature, **postérieure** aux comptes individuels
qu'elle concerne : c'est un jugement du cabinet sur pièce (procès-verbal d'assemblée, proposition d'affectation de
l'organe de gestion, politique de distribution documentée). Le produit l'**héberge** ; il ne la devine jamais.

### C4 — Le moteur de STORY-545 sait déjà tout, sauf porter un taux par élément

`diagnostiquerImpotsDifferes` calcule, par élément, `S0 = t0 × B0`, `S1 = t1 × B1`, la charge `S1 − S0`, porte le
stock au compte de son signe sur l'entité fiscale, `S0` aux réserves, la charge au compte de charge — équilibré par
construction ; un actif soumis au jugement attend la décision de l'entité (D-545-8). Ses taux sont ceux de
l'**entité** (IS) : il manque un taux propre à l'élément.

### C5 — Le report est indispensable

Une distribution prévue en N est payée en N+1 : l'imposition réelle passe alors dans la liasse du bénéficiaire (ou
de la distributrice). Sans report, la charge constatée en N au consolidé serait **comptée deux fois** (une fois en N
au consolidé, une fois en N+1 dans la liasse). Le report variable de 545 le résout : la déclaration de l'exercice
précédent ouvre l'élément (`B0`), la reprise passe en produit, l'impôt des exercices passés en réserves.

### C6 — ⚠️ La preuve d'impôt rangerait la charge sous un faux libellé

Un élément de distribution n'a **aucun effet sur le résultat avant impôt** (`ΔR = 0`) : `preuveDImpot` en attend un
impôt nul et range toute sa charge sous `CHANGEMENTS_DE_TAUX`. La preuve reste satisfaite, mais elle **ment** sur
son libellé ⇒ une ligne dédiée.

### C7 — Les natures voisines

STORY-687 (`DIVIDENDES_INTERNES`) élimine le dividende lui-même et dit son effet d'impôt **permanent** ; l'impôt de
distribution est ici, séparé. La décision d'actif de STORY-545 (nature `IMPOT_DIFFERE`, sans ligne, une active par
exercice et par société, relue sur l'exercice précédent) est le patron du journal.

## Les décisions

**D-686-1 — La déclaration (AC-1).** Nature **`IMPOSITION_DISTRIBUTION`** au journal `ecritures_consolidation`,
**sans ligne** (les lignes se calculent à chaque agrégat, dans la colonne des impôts différés), figée, numérotée,
justifiée, annulable avec motif, jamais réécrite (gardes de schéma de STORY-531). Elle porte
`impositionDistribution` : la **distributrice** et la **bénéficiaire** (deux sociétés distinctes), le **montant**
prévu de la distribution (entier > 0, dans la devise du groupe), l'**effet** (`CHARGE_NON_RECUPERABLE` |
`REDUCTION_D_IMPOT`), l'**entité qui le supporte** (`DISTRIBUTRICE` | `BENEFICIAIRE`), la **prévision**
(`DECISION_D_ASSEMBLEE` | `PROPOSITION_D_AFFECTATION` | `POLITIQUE_DE_DISTRIBUTION`, sa référence et sa date), le
**taux** et sa source (D-686-2). ⛔ **Une active par exercice, distributrice, bénéficiaire et effet** — index unique
partiel (le vrai filet de deux déclarations concurrentes, qui compteraient deux fois la même charge), refus
`409 IMPOSITION_DISTRIBUTION_DEJA_DECLAREE` nommant celle en place ; corriger = annuler puis redéclarer.

**D-686-2 — Le taux (AC-2).** **Déclaré** par le cabinet, en fraction décimale `]0 ; 1]`, sa **source citée**
(texte de loi, article) — C2 : aucun paquet ne le publie. Il est **figé avec le pays de la distributrice**, lu au
read-model des dossiers à la déclaration : pays inconnu ⇒ `409 PAYS_DISTRIBUTRICE_INCONNU` (un taux de
juridiction sans juridiction ne se vérifie pas — fail-closed). Le moteur lit le taux **de la déclaration**, jamais
le taux d'IS de l'entité, jamais un taux du groupe : chaque distribution porte le sien.

**D-686-3 — L'élément d'impôt (C1, C4).** Chaque déclaration active de l'exercice est un élément
**`DISTRIBUTION_PREVUE`** : entité fiscale = l'entité qui supporte, propriétaire = la même, `B0 = 0`,
`B1 = ±base`, `ΔR = 0`, `ΔE = 0`, son taux à l'ouverture et à la clôture. `base = arrondi(montant × % d'intégration
de l'entité fiscale)` — les comptes d'une société intégrée proportionnellement entrent à son pourcentage. Signe :
une charge est un passif (`B1 > 0`), une réduction un actif (`B1 < 0`).

**D-686-4 — Le report (C5).** Chaque déclaration active de l'**exercice précédent** de la mère (s'ils se suivent,
la règle des décisions de 545) est un élément **`REPORT_DISTRIBUTION_PREVUE`** : `B0 = ±base`, `B1 = 0`, à son taux
figé. Une distribution toujours prévue se **redéclare** sur l'exercice : charge nette nulle, passif maintenu. Une
entité qui n'est plus intégrée : non reportée, **nommée**.

**D-686-5 — L'actif se juge (C1, § 3.4).** Un élément de réduction est un actif d'impôt différé **soumis au
jugement** de l'entité (D-545-8) : un seul juge pour tous les actifs, jamais deux règles.

**D-686-6 — La colonne et les comptes.** Les lignes vont dans la colonne `impotsDifferes`, aux trois comptes du
référentiel de méthodes du groupe (D-545-9) et au compte de réserves du groupe pour `S0`. Les manques de 545
(comptes non déclarés, invalides, taux…) s'appliquent tels quels.

**D-686-7 — La preuve d'impôt (C6).** Une ligne **`IMPOSITIONS_SUR_DISTRIBUTIONS`** = la charge de ses éléments
comptabilisés ; ils sont retirés des changements de taux et des arrondis (leur impôt est l'arrondi lui-même).

**D-686-8 — Le statut (AC-3).** `IMPOSITIONS_SUR_DISTRIBUTIONS` est `APPLIQUE` si et seulement si :
- l'exercice est **examiné** — au moins une déclaration active (une distribution, ou une **omission motivée**
  `SANS_INCIDENCE` | `INCIDENCE_NEGLIGEABLE`, sans ligne — D-541-6) ; ou, d'office, **moins de deux sociétés
  intégrées** : aucune distribution entre intégrées n'est possible (patron du groupe mono-devise, STORY-547 AC-7) ;
- **et dans tous les cas** : aucune omission active **et** une distribution active en même temps ; chaque
  distribution active dans le périmètre (distributrice et bénéficiaire intégrées) ; chaque élément de distribution
  (exercice et report) **comptabilisé** — `APPLIQUE` ou `NON_RECONNU` (actif écarté par le jugement), colonne passée.
  *Précisé en revue de code :* le « d'office » ne dispense que de DÉCLARER — une mère restée seule extourne encore la
  distribution prévue à la clôture précédente.

Sinon `NON_TRAITE`, chaque manque nommé : `DISTRIBUTIONS_NON_EXAMINEES`, `DECLARATIONS_CONTRADICTOIRES`,
`DISTRIBUTION_HORS_PERIMETRE`, `IMPOSITIONS_NON_COMPTABILISEES`. ⚡ **Aucune distribution prévue ⇒ aucune
écriture, aucun élément** : l'omission motivée ne produit aucune ligne, et l'agrégat est identique à celui d'avant
la story. La règle de qualification (D-531-1) ne change pas.

**D-686-9 — Qui.** La distributrice et la bénéficiaire : la mère ou une société intégrée (IG, IP) au dernier
périmètre arrêté — refus `409 SOCIETE_NON_INTEGREE` nommé ; les mêmes ⇒ `400 IMPOSITION_DISTRIBUTION_INCOHERENTE`.
Une omission refuse une distribution, et l'inverse : `409 DECLARATIONS_CONTRADICTOIRES` (la course entre les deux
est rattrapée à l'agrégat, D-686-8). Les associées (mise en équivalence) : hors périmètre — l'art. 86 5° vise les
*« entités consolidées par intégration »*.

**D-686-10 — Routes et rôles.** Sous `@RequiresDossierScope()` (la mère), `@RequiresBilanAccess()` et
`@PorteeGroupe()` (D-683-7), `TENANT_ADMIN` et `TENANT_USER` (travail préparatoire, D-531-10) :
`GET|POST …/consolidation/exercices/:exerciceId/impositions-distributions`,
`POST …/impositions-distributions/:ecritureId/annulation` ; `GET …/agregat` publie la section
`impositionsSurDistributions` (`examine`, déclarations, reports non appliqués, manques) ; le statut figure dans
`traitements`, les éléments — avec leur impôt, au même `ecritureId` — dans `impotsDifferes`, et la ligne dans la
preuve d'impôt (*précisé en revue de code*).

**D-686-11 — Bornes.** Aucune lecture nouvelle à l'agrégat hors des déclarations actives de l'exercice (déjà lues,
bornées à 200) et de celles de l'exercice précédent (une requête, bornée par le même plafond) ; la déclaration lit
l'exercice, le périmètre arrêté, le pays de la distributrice et les déclarations actives de l'exercice.

**D-686-12 — Hors périmètre — hooks inertes documentés.** Un **taux publié par un paquet fiscal** (aucun ne le fait,
C2) : le jour où un paquet le publie, il se lit pour la distributrice et se confronte au taux déclaré — à ficher ;
une **distribution dans une autre devise** que celle du groupe (le cabinet déclare le montant converti) ; une
**variation du pourcentage d'intégration** entre deux exercices (le report relit le pourcentage de l'exercice
consolidé) ; les distributions **des associées** (mise en équivalence) ; l'élimination du dividende lui-même
(STORY-687).

## Table de mutations — une par décision, chacune APPLIQUÉE (une occurrence exacte), jugée sur `Test Suites` et `Tests`, restaurée depuis le commit

Script et journal : `tmp/verif-docker-686/mutations/` (`mutants.py`, `passe.py`, `passe-1.log`, `passe-reprise.log`),
dans un worktree propre détaché de `MNV-686` @ `0f5befb`. **30 mutants, 30 rouges.** Premier passage : 25 rouges, 5 qui
ne compilaient pas (M01, M26, M27, M28, M30) — ⛔ aucun n'est un rouge ; réécrits en formes typées, rejoués seuls, rouges.

| # | Décision | Mutation | Verdict |
|---|---|---|---|
| M01 | D-686-2 | un taux groupe (27 %) au lieu du taux déclaré | ROUGE — 10 |
| M02 | D-686-2 | le taux d'IS de l'entité exigé pour une distribution | ROUGE — 2 |
| M03 | D-686-3 | une réduction lue comme une charge (signe) | ROUGE — 5 |
| M04 | D-686-3 | toujours 100 % (pourcentage d'intégration ignoré) | ROUGE — 3 |
| M05 | D-686-3 | l'entité qui supporte inversée | ROUGE — 10 |
| M06 | D-686-4 | la base d'ouverture du report jamais posée | ROUGE — 3 |
| M07 | D-686-4 | le report d'une entité sortie appliqué | ROUGE — 2 |
| M08 | D-686-5 | la réduction échappe au jugement | ROUGE — 2 |
| M09 | D-686-7 | la charge rangée en changements de taux | ROUGE — 6 |
| M10 | D-686-7 | une imposition non comptabilisée explique la preuve | ROUGE — 2 |
| M11 | D-686-8 | moins de deux intégrées : plus d'office | ROUGE — 2 |
| M12 | D-686-8 | l'exercice toujours examiné (le silence vaut examen) | ROUGE — 5 |
| M13 | D-686-8 | omission ET distribution non contradictoires | ROUGE — 2 |
| M14 | D-686-8 | une distribution hors périmètre tue | ROUGE — 2 |
| M15 | D-686-8 | un élément attendu non calculé vaut appliqué | ROUGE — 3 |
| M16 | D-686-8 | une colonne non passée ne bloque pas | ROUGE — 2 |
| M17 | D-686-8 | le statut publié sans le diagnostic | ROUGE — 7 |
| M18 | D-686-1 | l'index des distributions sans l'effet | ROUGE — 1 |
| M19 | D-686-1 | l'index des omissions sans le statut | ROUGE — 1 |
| M20 | D-686-1 | la pré-lecture du doublon neutralisée | ROUGE — 2 |
| M21 | D-686-1 | le doublon ignore l'effet | ROUGE — 2 |
| M22 | D-686-9 | la contradiction admise à la déclaration | ROUGE — 2 |
| M23 | D-686-9 | une société non intégrée admise | ROUGE — 5 |
| M24 | D-686-9 | la même société des deux côtés admise | ROUGE — 2 |
| M25 | D-686-2 | un taux hors forme admis | ROUGE — 3 |
| M26 | D-686-2 | un pays par défaut à la distributrice | ROUGE — 1 |
| M27 | D-686-4 | le report de l'exercice précédent jamais lu | ROUGE — 4 |
| M28 | D-686-10 | `@PorteeGroupe()` retiré du contrôleur | ROUGE — 2 |
| M29 | D-686-1 | l'E11000 des distributions pris pour une course au numéro | ROUGE — 2 |
| M30 | D-686-8 | les reports non appliqués tus | ROUGE — 1 |

## Progress Tracking

**Statut : `done` (2026-10-03).** Créée par le cadrage de STORY-541 (D-541-13), `ready-for-dev` le 2026-09-26.

- 2026-10-03 — branches `MNV-686` (`docs` depuis `main`, `bilan-service` depuis `dev` @ `432ced7`) ; **cadrage fait
  avant tout code** : 7 constats, 12 décisions. Le SYSCOHADA range l'opération parmi les impôts différés (D4C
  § 3.2.3, lu à l'image — C1) ; aucun paquet fiscal embarqué ne publie le taux d'une imposition de distribution :
  il se déclare, figé avec le pays de la distributrice (C2, D-686-2) ; la preuve d'impôt reçoit une ligne dédiée (C6).
- 2026-10-03 — **dev `bilan-service`** (branche `MNV-686`, `9d6a00e` code, `0f5befb` tests) : nature
  `IMPOSITION_DISTRIBUTION` et ses deux index uniques partiels ; règles pures `impositions-distributions.regles.ts`
  (éléments, report, diagnostic) ; moteur de 545 étendu (taux PROPRE à l'élément, origines `DISTRIBUTION_PREVUE` et
  `REPORT_DISTRIBUTION_PREVUE`, ligne de preuve `IMPOSITIONS_SUR_DISTRIBUTIONS`) ; trois routes
  (`ImpositionsDistributionsController`, sous `@PorteeGroupe()`) ; section `impositionsSurDistributions` de l'agrégat ;
  quatre codes de refus inscrits à l'inventaire. *Précisé en cours de dev :* le diagnostic compare les éléments
  ATTENDUS aux éléments CALCULÉS — sans règles d'impôt, le moteur ne rend aucun élément, et une distribution déclarée
  serait passée pour « rien à comptabiliser ».
- 2026-10-03 — ⚡ **défaut trouvé par la passe de tests, corrigé** : `PAYS_DISTRIBUTRICE_INCONNU` rendait
  `details.dossierId`, une clé que `DetailsRefusConsolidationDto` ne publie pas ; la distributrice est désormais nommée
  par `details.societes[]` (raison `PAYS_INCONNU`).
- 2026-10-03 — **conséquences voulues sur l'existant** : la preuve d'impôt compte une ligne de plus (nulle sans
  distribution) ; inventaires transverses (11 contrôleurs de consolidation, 23 sous la batterie de portée par
  collaborateur, index du dossier) ; les doubles des specs de 541 à 547 apprennent la lecture neuve.
- 2026-10-03 — **mutations** : 30 / 30 rouges (table ci-dessus).
- 2026-10-03 — **portes** (`bilan-service` @ `0f5befb`) : lint 0 avertissement (`{src,test}`), `nest build` OK,
  `test:cov` **307 suites, 11 385 tests verts** (2 ignorés, préexistants), couverture **99,42 / 97 / 99,57 / 99,52**
  (seuils 65/90/90/90) — `impositions-distributions.regles.ts` et `impositions-distributions.controller.ts` 100 % ;
  `test:e2e` **40 suites, 3 180 tests verts**. Aucun JSDoc détaché, aucun octet NUL.
- 2026-10-03 — **vérification docker** (`tmp/verif-docker-686/`, stack NEUVE `down -v`, surcouche légère, code servi
  prouvé par le marqueur `IMPOSITION_DISTRIBUTION_DEJA_DECLAREE` lu sur le port et les empreintes hôte == conteneur) :
  SCENARIO.md étapes 1 à 13 — **80 OK, 0 KO** (mise en place : 105 OK, 1 KO de script connu depuis 685 — axes de B
  posés avant son exercice). Montants lus : report seul 118000 D 1 300 000 / 899900 C 1 300 000, preuve satisfaite
  (−1 300 000) ; distribution 2025 : passif 169900 C 2 600 000, preuve satisfaite (+1 300 000) ; réduction de la JV
  `PROPOSE` ⇒ `NON_TRAITE` puis `NON_RECONNU` ⇒ `APPLIQUE`. ⛔ Index RÉELS : course de deux POST ⇒ 201 + 409, un seul
  document actif ; doublon ACTIF inséré par mongosh ⇒ E11000, la même ANNULÉE acceptée ; deux omissions actives ⇒
  E11000 ; `getIndexes()` conforme. Pays retiré du read-model ⇒ 409, rien écrit. Cloisonnement : B ⇒ 404 sur les trois
  routes, rien chez B. Persistance : 5 documents, `lignes` toujours vides, numéros contigus, liasses intactes.

### ✅ Clôture — 2026-10-03 : `done`

**`prospera-bilan-service#158` rebase-mergée sur `dev` @ `c15a54f`** (3 commits : code, tests, revue).

- **Revue de code (⑥)** — scan `opus` + trois lentilles (échecs silencieux, tests, types) + lentille sur-ingénierie
  (rien à retirer). 0 bloquant ; **6 constats retenus, tous traités** (`dea4d9f`) :
  - le « d'office » sous deux sociétés intégrées court-circuitait le diagnostic : un report non comptabilisé et une
    déclaration devenue hors périmètre passaient `APPLIQUE` par silence ⇒ corrigé, D-686-8 précisé ;
  - `statut` d'un manque publié en texte libre ⇒ énumération `StatutElementImpotDiffere` ;
  - le report d'une RÉDUCTION n'était testé nulle part (le mutant « signe oublié au report » survivait) ⇒ tests au
    moteur et aux règles ;
  - un doublon qui ne diffère que par l'entité qui supporte n'était pas figé ⇒ testé (la pré-lecture suit l'index) ;
  - la section de l'agrégat n'était vérifiée qu'à vide, son taux recopié par étalement ⇒ projection exacte testée,
    taux recopié champ par champ ;
  - D-686-10 annonçait statut et éléments DANS la section ⇒ décision reformulée (ils vivent dans `traitements` et
    `impotsDifferes`).
  Écartés : exercices non contigus (règle `seSuivent` de 545 reprise sciemment par D-686-4) ; taux invalide relu en
  base (inatteignable par l'API, écriture figée) ; union discriminée sur `ElementImpot.taux` (aucun résultat faux).
  Mutations de revue : M31 à M34 rouges, M11/M12 réajustées sur le code réécrit — **34 / 34 rouges** au total.
- **Revue de sécurité (⑦)** — **0 constat** (scan `opus`) : portée du groupe sur les trois routes, sociétés du corps
  confinées au périmètre arrêté, refus sans oracle d'existence, objet figé reconstruit champ par champ, lectures
  bornées, écriture figée.
- **Portes sur l'état final** (`dea4d9f`) : lint 0, build OK, **11 394** unitaires (99,42 / 97 / 99,57 / 99,52),
  **3 180** e2e.
- **Vérification docker REJOUÉE sur l'état final** (stack neuve, code servi `dea4d9f` prouvé en p0) : scénario
  **80 OK / 0 KO**, identique à la première passe ; mise en place 105 OK + le KO de script connu (axes de B).
- **Suites à ficher** (D-686-12) : lecture du taux de retenue dans un paquet fiscal le jour où il est publié, et sa
  confrontation au taux déclaré ; distribution dans une autre devise ; variation du pourcentage d'intégration entre
  deux exercices ; distributions des associées.
