# STORY-546 : Mise en équivalence — une ligne au bilan, une ligne au résultat, et rien d'autre

Status: in_progress

**Épic :** EPIC-139 — Impôts différés et mise en équivalence
**Service :** `bilan-service` — module `consolidation` (aucun contrat d'événement : **un seul dépôt**)
**Points :** 8 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-530** (le périmètre porte la méthode)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

La mise en équivalence est la méthode des **entreprises associées** — celles sur lesquelles le groupe
exerce une **influence notable** sans les contrôler. Et c'est la méthode **la plus simple des trois**,
à condition de ne pas la traiter comme les deux autres :

| Ce qu'on NE fait PAS | Ce qu'on fait |
|---|---|
| reprendre les actifs et dettes | **une seule ligne à l'actif** : quote-part de capitaux propres |
| reprendre les charges et produits | **une seule ligne au résultat** : quote-part de résultat |
| éliminer les réciproques | *(sans objet — rien n'est repris)* |
| calculer des minoritaires | *(sans objet)* |

⚠️ **Le piège est de la traiter comme une intégration proportionnelle.** Les deux « prennent un
pourcentage », et elles n'ont rien à voir : l'intégration proportionnelle reprend **ligne à ligne**
au pourcentage, la mise en équivalence reprend **une ligne**. Les confondre gonfle le bilan
consolidé de tous les actifs et dettes d'une entité que le groupe ne contrôle pas.

## Critères d'acceptation

- [ ] AC-1 — La valeur d'équivalence = quote-part de **capitaux propres retraités** (STORY-541) de
      l'entité, **à la date de clôture**, sur le **pourcentage d'intérêt**.
- [ ] AC-2 — La quote-part de résultat apparaît sur **une ligne distincte** du compte de résultat, et
      **jamais fondue** dans le résultat d'exploitation.
- [ ] AC-3 — ⛔ **Aucun actif, aucune dette, aucune charge, aucun produit de l'entité mise en
      équivalence n'entre dans les états consolidés.** Test de non-régression explicite : basculer
      une entité d'intégration globale à mise en équivalence doit **retirer** ses lignes, pas les
      réduire.
- [ ] AC-4 — Un **écart d'acquisition** sur une entité mise en équivalence est **inclus dans la
      valeur d'équivalence**, pas présenté séparément à l'actif.
- [ ] AC-5 — Une quote-part de capitaux propres devenue **négative** est traitée selon la règle du
      référentiel (arrêt à zéro sauf engagement), et **le fait est signalé**, jamais silencieux.
- [ ] AC-6 — Les **résultats internes** avec une entité mise en équivalence sont éliminés **à hauteur
      du pourcentage détenu** seulement. ⚠️ Cas rare, souvent oublié, et il fausse la ligne unique.

## Notes

- Voir [[STORY-530]] (la méthode est déclarée, jamais déduite du %), [[STORY-541]], [[STORY-543]].

---

# Cadrage — fait AVANT toute ligne de code

Sources : le **SYSCOHADA révisé**, édition officielle — D4C, titre XII, ch. 3 § 3.3 (p. 1150), ch. 5 § 2.1.2 et
2.1.3 (p. 1168-1169), ch. 5 section 6 (p. 1178-1179, relues à l'image), ch. 6 § 5.1.3 (p. 1185), ch. 8 § 3.1
(p. 1201) ; le code de `bilan-service` (`dev` @ `1ff2166`, STORY-545 comprise) et de `dossier-service` (périmètre,
STORY-530) ; les fiches STORY-530, 541 à 545.

## Les constats mesurés

### M1 — Aujourd'hui, une société mise en équivalence est NOMMÉE puis ÉCARTÉE

Le périmètre la projette (méthode `MISE_EN_EQUIVALENCE`, intérêt exact, liens retenus) ; l'agrégat la range dans
`nonIntegrees` (`MISE_EN_EQUIVALENCE_NON_TRAITEE`), sa liasse n'est jamais lue ; `MISE_EN_EQUIVALENCE` est
`NON_TRAITE`. Et les trois étapes qui devraient la servir la REFUSENT : un retraitement
(`SOCIETE_NON_RETRAITABLE`), un résultat interne et un écart de première consolidation
(`SOCIETE_NON_ELIMINABLE`, raison `MISE_EN_EQUIVALENCE`). Ses titres restent donc au coût dans la balance du
détenteur : ni leur valeur, ni la quote-part du résultat n'apparaissent.

### M2 — Le détenteur est toujours intégré à 100 %

`dossier-service` (STORY-530) : seuls des liens `INTEGRATION_GLOBALE` prolongent une chaîne ; les liens retenus
d'une société mise en équivalence partent de la mère ou d'une société intégrée globalement. Son intérêt exact est la
somme, sur ces liens, de l'intérêt du détenteur × la part du lien.

### M3 — ⚡ La valeur se calcule par DÉTENTEUR, et le partage de 544 fait le reste

*« Lorsque la quote-part de l'entité détentrice des titres dans les capitaux propres d'une entité dont les titres sont
mis en équivalence devient négative… »* (p. 1179) ; *« la quote-part du résultat qui revient de plein droit à l'entité
consolidante et éventuellement aux « Intérêts minoritaires » doit être incluse dans la valeur des « Titres mis en
équivalence » »* (p. 1169). Une fille détenue à 80 % qui détient 30 % d'une associée porte 30 % de ses capitaux propres ;
les minoritaires de la fille en prennent 20 % par le partage de 544 : il reste au groupe 24 % — l'intérêt exact de
l'AC-1. Calculer d'emblée à 24 % laisserait les minoritaires de la fille sans leur part.

### M4 — Les capitaux propres « retraités » exigent les retraitements de 541

*« Les règles générales de consolidation relatives à l'intégration globale, s'appliquent pour évaluer les capitaux
propres et les résultats des entités mises en équivalence »* (p. 1178). Une associée aux méthodes divergentes se
retraite donc comme une filiale — mais ses retraitements ne vont pas à la balance (rien d'elle n'y entre, AC-3) : ils
changent ses capitaux propres et son résultat, et donc la valeur et la quote-part. Le report de 541 (cumul passé en
réserves) vaut pour elle aussi. Retraitements `DIFFERENCE_TEMPORELLE` : nets de leur impôt au taux de SON pays (545).

### M5 — L'écart d'acquisition vit DANS la valeur

*« L'écart d'acquisition positif enregistré dans le cas de l'entrée d'une entité mise en équivalence n'est pas inscrit
séparément à l'actif du Bilan […] mais inclus dans la valeur comptable des titres mis en équivalence »* (p. 1185) ;
*« L'écart qui en résulte est un écart d'acquisition présenté selon les mêmes modalités que les écarts d'acquisition
définis dans le cadre de l'intégration globale »* (p. 1178). Le calcul figé de 543 (et l'impôt d'entrée de 545) vaut
tel quel ; seules ses LIGNES changent : ni élimination des capitaux propres acquis, ni écart d'évaluation ou
d'acquisition à l'actif — leurs montants nets d'amortissement entrent dans la valeur. Réévaluation partielle seulement
(aucun minoritaire n'est constaté sur une associée).

### M6 — Les résultats internes : le pourcentage du groupe, ou le PRODUIT

*« …sont éliminés, à hauteur du pourcentage de participation détenu par le groupe dans le capital de cette entité. Si
les opérations ont été effectuées avec une entité intégrée proportionnellement ou mise en équivalence, l'élimination
s'effectue à la hauteur du produit des pourcentages des deux participations »* (p. 1179). 542 calcule les lignes à
100 % ; ce qui est côté associée ne peut pas rester sur ses comptes (AC-3) : il se reporte sur le détenteur — la valeur
(bilan), la quote-part du résultat (gestion), ses réserves (capitaux propres).

### M7 — Ce que le texte ne règle pas, ou renvoie ailleurs

- *« Les dividendes reçus des entités consolidées par mise en équivalence sont éliminés du compte de résultat de
  l'entité détentrice des titres »* (p. 1178) : c'est STORY-687 (dividendes internes) ;
- *« Les dotations aux comptes de dépréciations des titres de participation […] sont éliminées en totalité »* (p. 1179) :
  le produit ne connaît pas le compte de dépréciation des titres — à ficher, comme pour l'intégration globale ;
- l'entrée ou la variation de pourcentage en cours d'exercice : la quote-part se lit sur le résultat de l'exercice
  entier (même limite que 543 et 544, STORY-548).

### M8 — Les bornes

Les sociétés mises en équivalence sont celles du périmètre (≤ 100) : leurs liasses se lisent dans le même lot que
celles des sociétés intégrées ; les engagements sont uniques par (exercice, société). Le calcul est linéaire.

## Les décisions

**D-546-1 — Calculée à chaque agrégat ; seuls l'écart (543) et l'engagement (D-546-8) se déclarent.** Une colonne
`miseEnEquivalence` par compte, appliquée AVANT les impôts différés et les minoritaires.

**D-546-2 — Les sources.** La liasse FIGÉE de chaque société mise en équivalence, à la même clôture, au même
référentiel et en la même devise que le groupe. Absente, non figée, d'un autre référentiel ou d'une autre devise :
**manque nommé** (`SOURCE_MISE_EN_EQUIVALENCE_INDISPONIBLE`, motif), jamais un refus de l'agrégat — elle en était
écartée jusqu'ici.

**D-546-3 — Les capitaux propres retraités (AC-1, M4).** À la clôture : `CP = Σ` comptes sous les racines des
capitaux propres (paquet de règles) `+ R`, `R = Σ` comptes de gestion — de sa liasse — plus l'effet de ses
retraitements (541, désormais admis sur elle et jugés par le diagnostic des méthodes), nets d'impôt au taux de son pays
s'ils sont `DIFFERENCE_TEMPORELLE` ; à l'ouverture, `CP − R`. Taux indisponible quand il en faut un : manque.

**D-546-4 — La valeur, par lien (AC-1, M3).** Pour chaque lien retenu : `V = p_lien × CP + écart` (D-546-5), posée
sur le DÉTENTEUR ; le partage de 544 donne aux minoritaires du détenteur leur part — il reste au groupe l'intérêt
exact. Fractions exactes, arrondies une fois par ligne.

**D-546-5 — L'écart (AC-4, M5).** 543 admet un lien vers une société mise en équivalence : réévaluation partielle
seulement (`409 METHODE_MINORITAIRES_INAPPLICABLE`, raison `MISE_EN_EQUIVALENCE`), comptes de l'écart d'acquisition
non exigés ; son calcul figé est celui de 543 (impôt d'entrée de 545 compris). Chaque exercice, la valeur porte
`Σ (g − amortissements) − leur impôt différé + (EA − amortissements de l'EA)` — plans de 543, taux d'entrée figé. Un
lien sans écart actif : manque `ECART_NON_DECLARE` (ses titres ne sont pas remplacés) ; l'écart annulé libère le lien.

**D-546-6 — Les lignes (AC-3), sur le détenteur, par lien** : crédit des titres (coût déclaré, compte déclaré) ; débit
de la valeur retenue au compte des titres mis en équivalence ; crédit de la provision (D-546-8) ; crédit de la
quote-part du résultat ; le solde en réserves du détenteur. ⛔ AUCUN compte de la société mise en équivalence n'entre
dans la balance.

**D-546-7 — La quote-part du résultat (AC-2).** `V_clôture retenue − V_ouverture retenue` — l'exercice d'entrée,
l'ouverture vaut le coût des titres. Sur SON compte (déclaré, de gestion, que rien d'autre ne mouvemente) ; publiée
à part dans le résultat (`dont quote-part des entités mises en équivalence`).

**D-546-8 — La quote-part négative (AC-5).** Règle PUBLIÉE par `consolidation-audcif@1.3` (p. 1179) : valeur nulle,
sauf obligation ou intention du détenteur de ne pas se désengager — alors provision. L'engagement se DÉCLARE par
exercice et par société mise en équivalence (nature `MISE_EN_EQUIVALENCE`, justification obligatoire, une active —
index unique partiel) ; l'ouverture lit celui de l'exercice précédent (par les dates). Dès que la quote-part calculée
est négative, l'alerte `QUOTE_PART_MISE_EN_EQUIVALENCE_NEGATIVE` la nomme (détenteur, société, valeur calculée, retenue,
provision) — jamais un zéro silencieux.

**D-546-9 — Les résultats internes (AC-6, M6).** 542 admet une société mise en équivalence (vendeur ou détenteur), sauf
détenue par plusieurs liens (`409`, raison `PLUSIEURS_LIENS`). Appliqué au pourcentage d'intérêt du groupe dans
l'associée — au produit avec une société intégrée proportionnellement ou une autre associée ; ses lignes côté associée
reportées sur son détenteur (valeur, quote-part, réserves), dans la colonne `miseEnEquivalence`. Pas d'impôt différé
calculé sur elles (hook) : la preuve d'impôt les range parmi les écritures sans impôt différé.

**D-546-10 — Les comptes.** Au référentiel de méthodes du groupe : `compteTitresMisEnEquivalence` (bilan) et
`compteQuotePartMisEnEquivalence` (gestion), ensemble ou pas du tout ; `compteProvisionMisEnEquivalence` (bilan),
facultatif — exigé dès qu'un engagement se comptabilise. Tous distincts de tous les comptes de consolidation. Manques
`COMPTES_MISE_EN_EQUIVALENCE_NON_DECLARES`, `_INVALIDES`, `COMPTE_MISE_EN_EQUIVALENCE_DEJA_MOUVEMENTE`.

**D-546-11 — Avec 544 et 545.** Le partage des minoritaires lit la colonne (par la société de chaque ligne : le
détenteur) ; la preuve d'impôt range ses effets sur le résultat — la quote-part est un résultat APRÈS l'impôt de
l'associée.

**D-546-12 — Le traitement.** `MISE_EN_EQUIVALENCE` est `APPLIQUE` si et seulement si aucun manque ; un groupe sans
société mise en équivalence l'est d'office. La société reste citée dans `nonIntegrees` (motif `MISE_EN_EQUIVALENCE`,
elle n'est pas agrégée), et `miseEnEquivalence` publie sa valeur.

**D-546-13 — Le paquet `consolidation-audcif@1.3`.** 1.2 plus une clé `miseEnEquivalence` : la règle de la quote-part
négative et les fondements verbatim (p. 1169, 1178, 1179, 1185).

**D-546-14 — Routes et rôles.** `GET|POST …/exercices/:exerciceId/mise-en-equivalence/engagements`,
`POST …/engagements/:ecritureId/annulation` — `TENANT_ADMIN`, `TENANT_USER` ; les méthodes du groupe acceptent les
trois comptes ; écarts et résultats internes admettent une associée ; `GET …/agregat` publie `miseEnEquivalence`.

**D-546-15 — Bornes.** Aucune lecture non bornée : les liasses des associées dans le même lot, les engagements actifs.

## Hors périmètre — hooks inertes documentés

- **Dividendes** reçus d'une associée (STORY-687) : jusqu'à elle, ils restent au résultat du détenteur ET dans la
  quote-part — le résultat les compte deux fois, la valeur est juste.
- **Dépréciation des titres** d'une associée (et d'une filiale) : à éliminer en totalité (p. 1179) — à ficher.
- **Impôt différé** des résultats internes avec une associée, et du changement de taux sur ses écarts d'évaluation.
- **Présentation** (STORY-548) : postes « Titres mis en équivalence » et « Part dans les résultats nets des entités
  mises en équivalence » ; entrée et variation de pourcentage en cours d'exercice. **Conversion** (STORY-547).

## Progress Tracking

- 2026-09-29 — branches `MNV-546` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`) **avant
  toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-29 — **cadrage** : 8 constats, 15 décisions. La valeur par détenteur (M3) ; trois stories rouvertes pour
  l'associée — retraitements (541), résultats internes (542), écart (543) — qui toutes la refusaient (M1).

