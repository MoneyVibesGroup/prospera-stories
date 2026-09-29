# STORY-545 : Impôts différés de consolidation — chaque retraitement déplace du résultat sans déplacer l'impôt

Status: review

**Épic :** EPIC-139 — Impôts différés et mise en équivalence
**Service :** `bilan-service` — module `consolidation` (aucun contrat d'événement : **un seul dépôt**)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-541** (homogénéisation) · **STORY-542** (éliminations) · **STORY-543** (écarts)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

Un retraitement de consolidation **modifie le résultat consolidé sans modifier la base fiscale** de
l'entité qui l'a subi. L'impôt payé, lui, reste celui des comptes individuels. **L'écart est une
différence temporelle**, et elle produit un impôt différé.

⇒ **Sans impôts différés, le résultat consolidé porte un taux d'impôt qui ne correspond à rien** —
et c'est un des premiers contrôles qu'un commissaire aux comptes fait sur des comptes consolidés :
*le taux effectif d'impôt est-il explicable ?*

**Ce qui génère un impôt différé, et ce qui n'en génère pas :**

| Origine | Impôt différé ? |
|---|---|
| Retraitement d'homogénéisation (durée d'amortissement, valorisation de stock) | ✅ oui |
| Élimination d'un **résultat interne** (marge sur stock, plus-value de cession) | ✅ oui |
| Élimination d'une **opération réciproque** (créance ↔ dette) | ⛔ **non** — le résultat n'a pas bougé |
| Écart d'évaluation affecté à un actif amortissable | ✅ oui |
| **Écart d'acquisition** | ⛔ **non** — pas de base fiscale en face |

⚠️ **Les deux « non » sont l'essentiel de la story** : c'est en calculant un impôt différé sur une
élimination réciproque ou sur un goodwill qu'on fabrique un impôt qui n'existe pas.

## Critères d'acceptation

- [ ] AC-1 — Chaque écriture de consolidation **déclare si elle génère une différence temporelle**,
      et laquelle. ⛔ Un retraitement muet sur ce point est **refusé** : c'est la seule garde qui
      empêche l'oubli silencieux.
- [ ] AC-2 — Le **taux d'impôt** appliqué est celui de **l'entité concernée**, pays par pays — jamais
      un taux groupe. ⚠️ Sur un groupe multi-pays, c'est structurant, et cela relie cette story au
      registre des pays ([[STORY-492]]) et aux paquets fiscaux ([[STORY-493]]).
- [ ] AC-3 — Actifs et passifs d'impôt différé sont publiés **séparément** et **ne se compensent pas**
      entre entités ni entre juridictions fiscales différentes.
- [ ] AC-4 — Un **actif** d'impôt différé n'est reconnu que si sa récupération est **probable** —
      c'est un **jugement**. ⇒ **Proposé, jamais appliqué d'office**, avec sa justification. Même
      doctrine que la provision pour perte de change et la dépréciation des stocks.
- [ ] AC-5 — Une **preuve d'impôt** (rapprochement entre l'impôt théorique au taux de la mère et
      l'impôt effectivement constaté) est publiée, ligne à ligne. ⚡ C'est le contrôle qui rend la
      story vérifiable : sans lui, personne ne peut dire si les impôts différés sont justes.
- [ ] AC-6 — Un groupe **mono-entité ou sans retraitement** produit **zéro impôt différé**. Test
      obligatoire — même garde de non-régression que STORY-541 AC-6.

## Notes

- Voir [[STORY-541]], [[STORY-542]], [[STORY-543]], [[STORY-492]], [[STORY-493]].

---

# Cadrage — fait AVANT toute ligne de code

Sources : le **SYSCOHADA révisé**, édition officielle (biblio.ohada.org, `explnum_id=2063`) — D4C, titre XII, ch. 4
« Retraitements » (§ 2 et § 3, p. 1153 à 1158 imprimées), ch. 6 section 1 (p. 1182), ch. 8 (modèles, p. 1199 à
1204), relus sur la reconnaissance de texte des pages rendues en image (relevé de STORY-544, `tmp/cadrage-544/`) ;
PCGO, liste des comptes, **p. 266** (compte 89), lue à l'image ; l'AUDCIF 2017 ; le code de `bilan-service`
(`dev` @ `bbace49`) et de `dossier-service` ; les paquets fiscaux de STORY-492/493 ; les fiches STORY-541 à 544.

## Les constats mesurés

### M1 — Chaque écriture DIT déjà son effet d'impôt ; rien ne le calcule

L'AC-1 est tenu à la **déclaration** depuis 541-543 : un retraitement muet est refusé (`400 EFFET_IMPOT_NON_DECLARE`,
motifs `EFFET_IMPOT_ABSENT` / `RAISON_ABSENTE`) ; les autres natures DÉDUISENT le leur — réciproque `AUCUN`
(`EFFET_IMPOT_RECIPROQUE`), résultat interne `DIFFERENCE_TEMPORELLE`, écart d'évaluation `DIFFERENCE_TEMPORELLE`,
écart d'acquisition `AUCUN` (D-542-10, D-543-10). Mais `IMPOTS_DIFFERES` est `NON_TRAITE` : aucun montant. Ce qui
manque à l'AC-1 est la garde de l'**agrégat** — qu'aucun effet sur le résultat ne vienne d'une colonne que personne
n'a classée (la conversion, STORY-547 ; les dividendes, STORY-687).

### M2 — Le taux d'impôt n'est publié que pour le Togo

Le taux vit dans le `paquetFiscal` embarqué des paquets de liasse (`syscohada-revise@2.1` et `@2.2` : `_meta.pays
"TG"`, `is.taux 0.27`, « Art. 113 CGI » ; `zone-franche-togo@1.0` : un **barème à paliers** selon l'ancienneté de
l'entreprise, aucun taux unique). Le pays d'une société se lit au read-model des dossiers (`dossiers_dossier.pays`).
Le prévisionnel les confronte déjà (STORY-492, D-492-5 : un paquet ne vaut que pour le pays qu'il déclare,
fail-closed ; `resoudreFiscalite` rend le taux ou le motif de son absence). Le paquet est **annuel** et ne date pas son
taux. Aucun autre pays n'a de taux : un groupe dont une filiale est béninoise n'a pas de quoi l'imposer.

### M3 — ⛔ L'écart d'acquisition de STORY-543 est calculé AVANT impôt

543 fige `EA = Δ − Σ g` (D-543-4). Or l'écart d'acquisition est la différence entre le coût des titres et *« la
quote-part de l'entité mère dans la juste valeur des actifs et passifs identifiables »*, et *« Tous les écarts
d'évaluation donnent lieu à une imposition différée »* (ch. 6, section 1, p. 1182) : le passif d'impôt différé des
écarts d'évaluation est l'un de ces passifs. C'est même la raison pour laquelle on n'en calcule pas sur l'écart
d'acquisition : *« cet actif est évalué en tant que montant résiduel et la comptabilisation du passif d'impôt
différé augmenterait sa valeur comptable »* (ch. 4, § 3.2.4.2, p. 1156). ⇒ `EA = Δ − Σ g + t·Σ g`. Sur un écart
d'évaluation de 10 000 000 à 80 %, au taux de 27 %, l'écart d'acquisition de 543 est **sous-évalué de 2 160 000**
— son plan d'amortissement avec lui. Calculer cet impôt hors de l'écart obligerait à amortir un complément d'écart
d'acquisition hors de son plan figé.

### M4 — La base se lit sur les lignes : l'approche bilantielle

*« La comptabilisation des impôts différés selon l'approche bilan est basée sur l'identification de l'ensemble des
différences temporelles »* (§ 3.2.4.1). Une écriture ne touche que trois familles de comptes : de **gestion** (les
racines de gestion du paquet des liasses), de **capitaux propres** (les racines publiées par `consolidation-audcif@1.1`,
et le compte de réserves du groupe), et les **autres** — actifs et passifs. Équilibrée, elle déplace la valeur
comptable des actifs et passifs exactement de son effet sur le résultat et les capitaux propres. D'où, par écriture,
le stock de différence à la clôture `B1` et à l'ouverture `B0` :

| Écriture | `B1` | `B0` |
|---|---|---|
| retraitement de l'exercice (541) | ses lignes d'actif/passif | 0 — ses lignes de capitaux propres sont un mouvement DIRECT de l'exercice |
| report d'un retraitement passé | ses lignes d'actif/passif | `B1` : rien n'a bougé dans l'exercice |
| résultat interne (542) | ses lignes d'actif/passif (`− non réalisé`) | `B1 − effet sur le résultat` : sa ligne de réserves |
| écart d'évaluation (543) | reconnu − amortissements cumulés, 0 après la sortie | à l'entrée : l'impôt figé avec l'écart (M3) ; ensuite, le même calcul à l'ouverture |
| réciproque, écart d'acquisition, élimination des titres | — | — (`AUCUN`) |

### M5 — Qui paie l'impôt, et à qui il appartient

Deux sociétés distinctes, parfois. L'**entité fiscale** est celle dont l'actif ou le passif a bougé : pour un
résultat interne, le **détenteur** — le stock ou le bien est chez lui, c'est sa base fiscale qui diffère (taux de
l'acquéreur, comme IAS 12). Le **propriétaire**, lui, est celui de STORY-544 : l'impôt qui corrige un résultat
appartient aux associés de qui porte ce résultat — le **vendeur** d'un résultat interne, la société d'un
retraitement, la société (réévaluation totale) ou le détenteur (partielle) d'un écart d'évaluation. Le taux est
celui de l'entité fiscale ; la part des minoritaires, celle du propriétaire.

### M6 — La preuve d'impôt a ses deux chemins dans l'agrégat

*« explication de la relation entre la charge (ou le produit) d'impôt et le bénéfice comptable (preuve d'impôt) […] :
rapprochement chiffré entre la charge (ou le produit) d'impôt et le bénéfice comptable multiplié par le(s) taux
applicable(s) »* (§ 3.5, p. 1158). L'impôt constaté se lit sur la balance : le compte **89 « Impôts sur le
résultat »** (PCGO p. 266 : 891 impôts sur les bénéfices de l'exercice, 892 rappels, 895 impôt minimum forfaitaire,
899 dégrèvements), plus l'impôt différé. L'autre chemin se CALCULE : chaque société a son résultat avant impôt et
son impôt exigible dans sa contribution ; chaque écriture de consolidation a son effet sur le résultat, rangé
`DIFFERENCE_TEMPORELLE` ou `AUCUN`. Si les deux chemins s'accordent, l'écart entre l'impôt au taux de la mère et
l'impôt constaté s'explique ligne à ligne — et un effet que rien ne range le fait échouer (M1).

### M7 — Les textes, et ce qu'ils ne disent pas

- **ch. 4, § 2.1.1 et 2.1.2** (p. 1154) : amortissements et stocks retraités — *« constater un impôt différé actif ou
  passif selon le sens de la correction »* ; **§ 2.3** (p. 1156) : les éliminations intra-groupe, de même ; les
  réciproques *« dont le retraitement n'a pas d'incidence sur le résultat »* ;
- **§ 3.2.2** (p. 1157) : impositions différées résultant *« des aménagements, éliminations et retraitements prévus à
  l'article 86 »* et *« de déficits fiscaux reportables […] dans la mesure où leur imputation sur les bénéfices
  fiscaux futurs est probable »* ;
- **§ 3.3** (p. 1157) : *« en utilisant les taux d'impôt et les réglementations fiscales en vigueur à la date de
  clôture »* ; *« méthode du report variable. Les impositions différées sont ajustées en fonction des changements de
  taux d'impôt. L'effet des variations de taux d'impôt affecte le compte de résultat, sauf s'il se rapporte à des
  éléments précédemment enregistrés dans les capitaux propres »* ; *« L'actualisation des actifs et passifs d'impôt
  différé est interdite »* ;
- **§ 3.4** (p. 1157-1158) : *« L'impôt différé doit être comptabilisé en produits ou en charges et compris dans le
  résultat de l'exercice, sauf dans les cas où il est généré par une transaction ou un événement comptabilisé en
  capitaux propres »* ; un actif *« dans la mesure où il est probable : que la différence temporelle s'inversera dans
  un avenir prévisible ; et qu'il existera un bénéfice imposable sur lequel pourra être imputée la différence
  temporelle »* — le jugement de l'AC-4 ;
- **ch. 8** (p. 1199-1200) : *« Actifs d'impôts différés »* à l'actif immobilisé, *« Passifs d'impôts différés »* au
  passif — deux postes ; p. 1204 : *« Impôts exigibles sur résultats / Impôts différés »* au compte de résultat.

⛔ **Ce que le texte ne dit pas** : ni quelle entité porte l'impôt d'une élimination entre deux pays (M5 retient
celle dont la base diffère), ni de règle de compensation — il présente deux postes distincts ; l'AC-3 interdit la
compensation, et le produit n'en fait **aucune** (D-545-7).

### M8 — Les bornes

Aucune lecture non bornée : les taux viennent du paquet de liasse (en cache) et du pays des sociétés (une requête,
les sociétés du périmètre) ; les décisions sur les actifs sont uniques par (exercice, société) et seules les
ACTIVES se lisent — au plus deux par société intégrée (l'exercice et le précédent). Le calcul est linéaire dans les
écritures déjà bornées (200 par consolidation, reports comptés avant d'être chargés).

## Les décisions

**D-545-1 — Calculé à chaque agrégat ; rien ne se fige, sauf deux choses.** Chaque consolidation recalcule les impôts
différés depuis les écritures actives, comme les minoritaires (D-544-1). Seuls se figent l'impôt d'entrée d'un écart
d'évaluation, avec l'écart (D-545-6), et le jugement sur un actif, qui se déclare (D-545-8).

**D-545-2 — Ce qui porte une différence temporelle (AC-1).** L'effet d'impôt de chaque écriture, tel que 541-543 le
déclarent ou le déduisent (M1) — inchangé. À l'agrégat, la preuve d'impôt (D-545-11) range CHAQUE effet sur le
résultat de la balance : un effet qu'aucune écriture classée n'explique la fait échouer.

**D-545-3 — Les éléments d'impôt (M4, M5).** Un élément par écriture `DIFFERENCE_TEMPORELLE` appliquée : son entité
fiscale, son propriétaire, `B0`, `B1`, son effet sur le résultat `ΔR` et son mouvement direct de capitaux propres
`ΔE` (retraitement de l'exercice seulement) — lus sur ses lignes À L'ÉCHELLE (le montant que l'agrégat applique) ;
pour un écart, élément par élément évalué. `B > 0` : la valeur comptable excède la base fiscale — un passif (tableau
du § 3.2.4.3).

**D-545-4 — Le taux, entité par entité (AC-2).** Le pays de l'entité fiscale (read-model des dossiers) et le paquet
fiscal du référentiel de la liasse de la mère, confrontés par la MÊME règle que le prévisionnel (fail-closed) ;
`is.taux` en fraction exacte. Jamais un taux de groupe, jamais un défaut. Sans taux — pays inconnu, paquet absent ou
d'un autre pays, barème sans taux unique — le manque nomme la société et la raison (D-545-12). Deux taux par
entité : à la clôture (`t1`) et à la clôture précédente, la veille de l'ouverture (`t0`) — le report variable. ⚠️ Le
paquet ne datant pas son taux, `t0 = t1` aujourd'hui : le mécanisme est en place, son effet nul, et la fiche le dit.

**D-545-5 — Les montants et les lignes.** Par élément : `S0 = arrondi(t0 × B0)`, `S1 = arrondi(t1 × B1)`,
`eq = arrondi(t1 × ΔE)` — au plus proche, demi vers le haut en valeur absolue ; jamais actualisé. Lignes :
crédit `S1` au compte d'impôt différé (D-545-7) ; débit `S0` aux réserves du groupe (l'impôt des exercices passés) ;
débit `eq` aux réserves (un mouvement direct de capitaux propres, § 3.4) ; débit `S1 − S0 − eq` au compte de
charge d'impôt différé — la charge de l'exercice, changement de taux compris (§ 3.3). Équilibrées par construction.

**D-545-6 — L'impôt d'entrée d'un écart d'évaluation, figé avec l'écart (M3 — correctif de STORY-543).** À la
déclaration d'un écart qui porte des écarts d'évaluation, le produit lit le taux de la société (D-545-4) et les
comptes d'impôt différé du groupe (D-545-9) : `ID = arrondi(t × Σ reconnu)`, sa part du groupe `arrondi(t × Σ g)`,
celle des minoritaires le reste. L'écart d'acquisition figé devient `Δ − Σ g + part du groupe` ; la part des
minoritaires d'une réévaluation totale est créditée NETTE d'impôt ; l'écriture d'entrée crédite `ID` au compte
d'impôt différé de la société (passif, actif si négatif) — équilibrée. Tout est figé (AC-6 de 543). Sans taux ou
sans comptes à la déclaration, l'écart se fige comme avant, la raison avec lui, et l'agrégat nomme le manque
`ECART_SANS_IMPOT_DIFFERE` : le cabinet l'annule et le redéclare. Chaque exercice, l'élément d'impôt de l'écart
suit l'amortissement : `S0` vaut l'impôt d'entrée l'exercice de l'entrée.

**D-545-7 — Actif et passif, jamais compensés (AC-3).** Chaque élément porte son stock au compte d'impôt différé
**actif** si `S1 < 0`, **passif** si `S1 > 0`, sur SA société : ni entre entités, ni entre juridictions — ni même
au sein d'une société. Publiés par société : actif, passif, élément par élément.

**D-545-8 — Le jugement sur un actif (AC-4).** Un élément ACTIF d'un retraitement ou d'un résultat interne est
**proposé**, jamais appliqué d'office : il ne s'applique que si le cabinet a décidé `RECONNU` pour son entité fiscale
dans l'exercice. `NON_RECONNU` : il ne s'applique pas, et le dit. Sans décision : il ne s'applique pas et le manque
`ACTIF_IMPOT_DIFFERE_A_DECIDER` nomme la société et le montant proposé, justification à l'appui (les éléments qui le
composent). `S0` d'un élément actif ne compte que si l'exercice PRÉCÉDENT (par les dates, D-542) l'avait reconnu.
Un écart d'évaluation n'y est pas soumis : son impôt est reconnu avec l'acquisition (ch. 6 : *« Tous les écarts
d'évaluation donnent lieu à une imposition différée »*). Décision déclarée au journal (nature `IMPOT_DIFFERE`,
justification obligatoire, une ACTIVE par exercice et société — index unique partiel, `409
DECISION_IMPOT_DIFFERE_DEJA_DECLAREE`), annulable avec motif.

**D-545-9 — Les comptes.** Le référentiel de méthodes du groupe (D-541-2, D-544-7) accepte trois comptes
facultatifs, **ensemble ou pas du tout** : `compteImpotsDifferesActif` et `compteImpotsDifferesPassif` (bilan),
`compteChargeImpotsDifferes` (gestion) — distincts entre eux et des comptes de réserves et des minoritaires (`400
METHODES_INCOHERENTES`, motifs `COMPTES_IMPOTS_DIFFERES_INCOMPLETS` | `COMPTES_CONSOLIDATION_CONFONDUS`). Manques à
l'agrégat : `COMPTES_IMPOTS_DIFFERES_NON_DECLARES`, `COMPTES_IMPOTS_DIFFERES_INVALIDES` (nature),
`COMPTE_IMPOTS_DIFFERES_DEJA_MOUVEMENTE` — et `COMPTE_IMPOTS_DIFFERES_MODIFIE`, un écart figé sur un compte qui
n'est plus celui du groupe.

**D-545-10 — La colonne `impotsDifferes`, AVANT les minoritaires.** L'impôt différé déplace du résultat et des
capitaux propres qui se partagent : sa colonne s'applique à l'agrégat, puis le partage de 544 la lit — chaque ligne
de gestion ou de capitaux propres attribuée au propriétaire de l'élément (le hook de 544). `RECOMPOSITION` et
`EQUILIBRE` rejugés ; le résultat consolidé en trois lignes (D-544-8) la comprend.

**D-545-11 — La preuve d'impôt (AC-5).** Résultat avant impôt `RAI` = résultat consolidé (avant minoritaires) +
impôt constaté ; impôt constaté = comptes sous les racines de l'impôt sur le résultat + compte de charge d'impôt
différé — lus sur la balance. Lignes : **impôt théorique** `t_mère × RAI` ; **différentiel de taux** Σ (t_s − t_mère)
× base imposée chez `s` ; **écritures sans impôt différé** − t_mère × leurs effets sur le résultat ; **changements
de taux** ; **actifs non reconnus** ; **arrondis** ; **impôt propre aux comptes individuels** Σ (exigible_s − t_s ×
résultat avant impôt de sa liasse) — différences permanentes, impôt minimum, rappels. Contrôle **`PREUVE_D_IMPOT`** :
l'égalité EXACTE (fractions) de la somme et de l'impôt constaté — deux chemins ; lignes publiées arrondies au plus
fort reste pour sommer à l'impôt constaté ; taux effectif publié. `null`, raison nommée, si les
racines de l'impôt manquent ou si le taux d'UNE société intégrée manque — sans lui, son impôt ne s'explique pas
(arbitrage de la revue des tests : un groupe avec une filiale d'un pays sans taux publié n'a pas de preuve).

**D-545-12 — Le traitement se décide, jamais par silence.** `IMPOTS_DIFFERES` est `APPLIQUE` si et seulement si
aucun manque : taux de chaque entité fiscale d'un élément, règles du paquet, comptes (s'il y a une ligne à passer),
écarts figés avec leur impôt, aucun actif à décider. ⚡ **AC-6** : sans aucun élément (société seule, aucun
retraitement ni résultat interne ni écart d'évaluation), zéro publié et `APPLIQUE` — sans taux, sans comptes, sans
règles. La preuve reste publiée à part (comme `PARTAGE_DU_RESULTAT`).

**D-545-13 — Le paquet `consolidation-audcif@1.2`.** 1.1 plus une clé `impotsDifferes` : les racines de l'impôt sur
le résultat (`89`) et les fondements **verbatim** (ch. 4, § 3.2.4, 3.3, 3.4, 3.5 ; ch. 6, section 1). Même date
d'application ; à date égale, la plus haute version (D-544-13). Les écarts déjà figés gardent la règle qu'ils ont lue.

**D-545-14 — Routes et rôles.** `POST …/consolidation/exercices/:exerciceId/impots-differes/decisions` et
`POST …/decisions/:ecritureId/annulation`, `GET …/decisions` — `TENANT_ADMIN`, `TENANT_USER` (travail
préparatoire, D-531-10) ; `POST …/methodes-groupe` accepte les trois comptes ; `GET …/agregat` publie
`impotsDifferes`, la colonne du même nom et la preuve.

**D-545-15 — Bornes.** Aucune lecture nouvelle hors des décisions ACTIVES (M8) ; le coût mesuré à la borne des
écritures, consigné à côté des bornes existantes.

## Hors périmètre — hooks inertes documentés

- **Déficits fiscaux reportables** (§ 3.2.2 3°) : un actif sur pertes exige des données fiscales que le produit n'a
  pas — à ficher. **Élimination des écritures fiscales** (STORY-685) et **impositions sur distributions** (STORY-686) :
  leurs écritures déclareront leur effet d'impôt comme les autres.
- **Mise en équivalence** (STORY-546), **conversion** (STORY-547), **dividendes internes** (STORY-687) : chaque
  colonne nouvelle classe ses effets, sinon la preuve d'impôt échoue.
- **Présentation** (STORY-548) : les postes du bilan et du compte de résultat consolidés, la note d'impôt (§ 3.5).
- **Barème à paliers** (zone franche) et **taux datés** : le jour où un paquet les publie, le taux se lit par date —
  le report variable est déjà en place.
- Un écart déclaré avant cette story n'a pas d'impôt d'entrée : nommé (`ECART_SANS_IMPOT_DIFFERE`), à redéclarer.

## Progress Tracking

- 2026-09-29 — branches `MNV-545` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`) **avant
  toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-29 — **cadrage** : 8 constats, 15 décisions. ⛔ Un défaut de STORY-543 mis au jour (M3) : l'écart
  d'acquisition figé sans l'impôt des écarts d'évaluation — corrigé pour les nouvelles déclarations (D-545-6). Taux
  entité par entité par le paquet fiscal et le pays (M2), approche bilantielle sur les lignes appliquées (M4), entité
  fiscale et propriétaire distincts (M5), preuve d'impôt à deux chemins (M6).
- 2026-09-29 — **dev `bilan-service`** (branche `MNV-545`, commit `dc0de5a`) : règles pures
  (`impots-differes.regles.ts` — taux, éléments, jugement, colonne, preuve exacte), colonne `impotsDifferes` appliquée
  AVANT les minoritaires (`appliquerColonne` commun avec 544), partage des minoritaires qui la lit, impôt d'entrée figé
  avec l'écart (correctif de 543), trois comptes aux méthodes du groupe, décisions au journal (nature `IMPOT_DIFFERE`,
  index unique partiel, routes `…/impots-differes/decisions`), paquet `consolidation-audcif@1.2` (empreinte
  `fec292de…`), citations revérifiées sur l'image des pages (p. 1156, 1157, 1158, 1182 ; PCGO p. 266). Vérifié avant
  tout test sur un banc jetable : groupe à marge interne de 1 000 000 ⇒ RAI 5 000 000, impôt constaté 1 350 000 =
  27 % exactement ; sans décision, la preuve reste satisfaite et nomme 270 000 d'impôts différés non comptabilisés.
- 2026-09-29 — ⚡ **tests écrits en parallèle par six sous-agents `opus`** (règles pures ; impôt d'entrée de l'écart ;
  service, contrôleur et DTO de décision ; référentiel, méthodes, journal et invariants ; agrégation, minoritaires et
  réponse ; e2e et contrat OpenAPI), chacun propriétaire de ses fichiers, code de production jamais touché, chacun
  avec sa passe de mutation sur une copie privée : **155/155 tuées**. Vérités recalculées DANS les tests : la preuve
  en fractions exactes sur 300 groupes aléatoires, la méthode par paliers sur 400 réévaluations (part nette des
  minoritaires à une unité au plus de `(1 − p) × E × (1 − t)`), les minoritaires d'une filiale vendeuse (−292 000).
  **Quatre défauts trouvés, tous corrigés** :
  - ⛔ la preuve qui échoue d'une fraction d'unité publiait `ecart = 0` (chaque ligne arrondie à part effaçait
    l'écart) : l'écart est désormais la différence EXACTE, arrondie et jamais ramenée à zéro ;
  - l'arrondi de l'impôt d'entrée d'un écart était classé en « changements de taux » : l'élément porte le taux FIGÉ
    de l'entrée, l'arrondi va aux arrondis, seul un vrai changement de taux aux changements de taux ;
  - la réponse recopiait l'impôt d'entrée par étalement (un champ inconnu du document serait sorti) : champ par champ,
    selon le statut ;
  - le code de refus de la garde « société intégrée », généralisée pour les décisions, passait par une variable et
    échappait à l'inventaire des codes : chaque appelant lève son refus, code littéral.
  Retiré : une raison d'indisponibilité de la preuve (`IMPOTS_DIFFERES_NON_CALCULES`) qu'aucun chemin n'atteignait.
  Relevé, laissé en l'état : les lignes de l'agrégat sont publiées par référence depuis STORY-531 (hors périmètre).
- 2026-09-29 — **table de mutations de la session** — une mutation par décision, sur une copie privée (hors dépôt),
  jugée sur les suites unitaires de consolidation et du référentiel : **23/23 tuées** (AC-6 ; effet non classé ;
  base d'un retraitement courant ; entité fiscale d'un résultat interne ; pays du paquet ; report variable ; mouvement
  direct de capitaux propres ; écart d'acquisition avant impôt ; réserves des minoritaires brutes ; compte de stock ;
  jugement ignoré ; décision de l'exercice précédent ; trois comptes ensemble ; stock sous une racine de capitaux
  propres ; minoritaires calculés avant l'impôt ; partage de la colonne ; différentiel de taux ; impôt propre aux
  comptes individuels ; traitement toujours appliqué ; clé écartée par le parse ; décision en double ; écart de preuve
  effacé ; arrondi d'entrée). Premier passage : 5 mesures vides (mutants qui ne compilaient pas ou ne s'appliquaient
  pas — ligne reformatée), réécrites en formes compilables et typées, toutes tuées.
- 2026-09-29 — **portes finales** sur `80bddcb` : lint 0 avertissement, build OK ; `test:cov` **265 suites, 8 211 tests
  verts** (2 ignorés, préexistants), couverture **99,34 / 96,61 / 99,59 / 99,42** (seuils 65/90/90/90) ; e2e **32 suites,
  2 052 tests verts**. Aucun JSDoc détaché ni octet NUL introduit (un JSDoc détaché par une insertion attrapé avant le
  premier commit).
- 2026-09-29 — **vérification docker sur stack NEUVE** (`docker compose down -v`, puis `up`), tout par les API réelles,
  trois groupes, attentes écrites AVANT (`tmp/verif-docker-545/SCENARIO.md`) et recalculées sur les soldes réellement
  injectés : **220 verdicts OK**. p0 (37) : branche `MNV-545` à `80bddcb`, « Found 0 errors » après redémarrage, sources
  montées à l'octet, artefacts 1.0/1.1/1.2 dans le `dist` à l'octet ; p1-p4 (114) : octrois, dossiers projetés AVEC leur
  pays (BENIN `BJ`), arrêtés, liasses figées avec l'impôt exigible au 891. p5 (69) — le scénario :
  - écart déclaré sans comptes d'impôt ⇒ figé `NON_CALCULE` ; agrégat `NON_TRAITE` avec trois manques nommés, colonne
    vide, preuve SATISFAITE (5 605 500 = 4 752 000 + 54 000 + 405 000 non comptabilisés + 394 500) ;
  - refus des méthodes (deux comptes sur trois ; actif = réserves), rien d'écrit ; ⛔ l'écart redéclaré sans comptes
    d'écart d'acquisition ⇒ `400 COMPTES_ECART_ACQUISITION_MANQUANTS` sens `POSITIF` — l'impôt d'entrée fait naître
    l'écart d'acquisition ; redéclaré ⇒ `CALCULE` 27/100, 2 700 000 / 2 160 000 / 540 000, EA 2 160 000 ;
  - `NON_RECONNU` ⇒ `APPLIQUE`, ligne « actifs non reconnus » 270 000 ; doublon ⇒ 409 nommé ; après annulation, DEUX
    `RECONNU` simultanés ⇒ un 201, un 409 qui nomme le gagnant — le VRAI index unique ;
  - `RECONNU` ⇒ la colonne ligne à ligne = SCENARIO.md ; soldes 276900 D 270 000, 169900 C 1 215 000, 899900 C 405 000 ;
    preuve 4 693 680 + 112 320 + 394 500 = **5 200 500** = impôt constaté, taux effectif 2 992 pb ; minoritaires de la
    filiale **1 071 000** (20 % de son résultat, impôt différé compris) ; RECOMPOSITION, EQUILIBRE ;
  - persistance : méthodes v1 (`null`) et v2, les deux écarts (annulé `NON_CALCULE`, actif `CALCULE` avec EA et plan
    figés), les décisions (sans ligne), l'index unique partiel en base ; l'agrégat n'écrit RIEN ; liasses intactes ;
  - groupe 2 (BENIN, `BJ`) : taux indisponible nommé (`PAQUET_FISCAL_HORS_PAYS`), écart figé `NON_CALCULE`, tous ses
    éléments `NON_CALCULE`, preuve `null` — ⛔ jamais 27 % ; cabinet B (AC-6) : zéro, `APPLIQUE` sans aucun compte,
    preuve = théorique ; cloisonnement : 404.
  Un KO du script (un bien non amortissable envoyé avec `amortissement: null`, que le DTO refuse à bon droit) :
  l'étape rejouée seule (`p5b_benin.py`), 6/6. Stack arrêtée (`docker compose stop`). Statut `in_progress` → `review`.

