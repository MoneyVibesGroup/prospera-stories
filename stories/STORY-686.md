# STORY-686 : L'impôt sur les distributions prévues entre sociétés du groupe n'est constaté nulle part

Status: in_progress

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
- **moins de deux sociétés intégrées** : aucune distribution entre intégrées n'est possible — d'office, sans rien
  déclarer (patron du groupe mono-devise, STORY-547 AC-7) ;
- **sinon** : l'exercice est **examiné** — au moins une déclaration active (une distribution, ou une **omission
  motivée** `SANS_INCIDENCE` | `INCIDENCE_NEGLIGEABLE`, sans ligne — D-541-6) ; aucune omission active **et** une
  distribution active en même temps ; chaque distribution active dans le périmètre (distributrice et bénéficiaire
  intégrées) ; chaque élément de distribution (exercice et report) **comptabilisé** — `APPLIQUE` ou
  `NON_RECONNU` (actif écarté par le jugement), colonne passée.

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
`impositionsSurDistributions` (statut, déclarations, éléments avec leur impôt, reports, manques) ; les éléments
figurent dans `impotsDifferes` et la ligne dans la preuve d'impôt.

**D-686-11 — Bornes.** Aucune lecture nouvelle à l'agrégat hors des déclarations actives de l'exercice (déjà lues,
bornées à 200) et de celles de l'exercice précédent (une requête, bornée par le même plafond) ; la déclaration lit
l'exercice, le périmètre arrêté, le pays de la distributrice et les déclarations actives de l'exercice.

**D-686-12 — Hors périmètre — hooks inertes documentés.** Un **taux publié par un paquet fiscal** (aucun ne le fait,
C2) : le jour où un paquet le publie, il se lit pour la distributrice et se confronte au taux déclaré — à ficher ;
une **distribution dans une autre devise** que celle du groupe (le cabinet déclare le montant converti) ; une
**variation du pourcentage d'intégration** entre deux exercices (le report relit le pourcentage de l'exercice
consolidé) ; les distributions **des associées** (mise en équivalence) ; l'élimination du dividende lui-même
(STORY-687).

## Progress Tracking

**Statut : `in_progress` (2026-10-03).** Créée par le cadrage de STORY-541 (D-541-13), `ready-for-dev` le 2026-09-26.

- 2026-10-03 — branches `MNV-686` (`docs` depuis `main`, `bilan-service` depuis `dev` @ `432ced7`) ; **cadrage fait
  avant tout code** : 7 constats, 12 décisions. Le SYSCOHADA range l'opération parmi les impôts différés (D4C
  § 3.2.3, lu à l'image — C1) ; aucun paquet fiscal embarqué ne publie le taux d'une imposition de distribution :
  il se déclare, figé avec le pays de la distributrice (C2, D-686-2) ; la preuve d'impôt reçoit une ligne dédiée (C6).
