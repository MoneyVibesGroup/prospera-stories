# STORY-548 : Les états consolidés et leurs notes — et le mot qui figure en tête est « consolidé » ou « agrégé », jamais le plus vendeur

Status: done

**Épic :** EPIC-141 — États consolidés et notes
**Service :** `bilan-service` — module `consolidation` (aucun contrat d'événement : **un seul dépôt**)
**Points :** 13 · **Sprint :** S20
**Complexité :** high
**Prérequis :** **STORY-541 → 547** (tous les retraitements)
**Origine :** arbitrage PO du 2026-08-28 — niveau ③.

---

## Le fait

Les états consolidés ne sont **pas** les états individuels avec d'autres chiffres. Ils portent des
lignes qui n'existent nulle part ailleurs, et des notes qui sont **l'essentiel de leur valeur
probante** :

| Ligne / note | Pourquoi elle n'existe que là |
|---|---|
| **Écart d'acquisition** à l'actif | né de la consolidation ([[STORY-543]]) |
| **Intérêts minoritaires** au passif | la part qui n'appartient pas au groupe ([[STORY-544]]) |
| **Écart de conversion** en capitaux propres | né des filiales étrangères ([[STORY-547]]) |
| **Résultat part du groupe** au CR | le nombre que tout lecteur cherche |
| **Note de périmètre** | qui est consolidé, à quel %, par quelle méthode, depuis quand |
| **Note de variation du périmètre** | entrées et sorties de l'exercice — sans elle, aucune comparaison N/N-1 n'a de sens |
| **Preuve d'impôt** | le rapprochement qui rend les impôts différés vérifiables ([[STORY-545]]) |

⚡ **La note de variation du périmètre est celle qu'on oublie, et elle invalide le comparatif.** Un
groupe qui acquiert une filiale en juin voit son chiffre d'affaires bondir : sans la note, la
croissance est attribuée à l'activité.

## Critères d'acceptation

- [ ] AC-1 — Bilan, compte de résultat et TFT consolidés, avec les lignes propres à la
      consolidation, et un **comparatif N-1** qui porte **son propre périmètre**.
- [ ] AC-2 — ⛔ **L'état porte le mot exact de ce qui a été fait** : « **consolidé** » si les
      retraitements ont tourné, « **agrégé** » si seule l'agrégation a tourné. **Jamais le mot le
      plus vendeur** — c'est la reprise directe de STORY-531 AC-5, au niveau de l'état déposé.
- [ ] AC-3 — Les **notes de périmètre et de variation de périmètre** sont produites depuis
      [[STORY-530]], jamais saisies.
- [ ] AC-4 — Un **contrôle de recomposition** est publié : la somme des contributions par entité
      **égale** chaque total consolidé. ⚡ C'est le seul contrôle qui attrape un retraitement appliqué
      deux fois — et l'équilibre du bilan, lui, ne le verrait pas.
- [ ] AC-5 — ⛔ **Ce qui n'est pas produit est NOMMÉ à l'écran**, avec sa raison. Doctrine FE-073 :
      *dire ce qu'on ne fait pas est une information ; laisser croire qu'on le fait est une
      promesse.*
- [ ] AC-6 — Les états consolidés se **figent** comme une liasse individuelle : version, empreinte,
      piste d'audit. ⚠️ Ils citent **les versions de balance de chaque entité** qui les ont produits —
      un état consolidé dont on ne peut pas retrouver les sources n'est pas auditable.
- [ ] AC-7 — Un contrôle **d'homogénéité** refuse la production si deux entités du périmètre n'ont ni
      le même référentiel ni la même devise sans conversion (STORY-531 AC-2, STORY-547).

## Notes

- Voir [[STORY-531]] et [[STORY-541]] → [[STORY-547]], [[FE-073]].

---

# Cadrage — fait AVANT toute ligne de code

Sources : l'**AUDCIF**, art. 86 à 98 (p. 45 à 49, OCR de l'édition officielle) ; le **SYSCOHADA révisé**, D4C, titre XII,
**ch. 8** « Documents de synthèse consolidés », sections 1 à 6 (p. 1195 à 1216) ; le code de `bilan-service` (`dev` @
`94070d2`, STORY-547 comprise) ; les fiches STORY-530, 531, 541 à 547.

## Les constats mesurés

### M1 — L'agrégat ne produit que des soldes par compte, et rien n'y est figé

`GET …/agregat` rend une balance du groupe (`lignes[]` : contributions par société, huit colonnes d'imputation, solde
net) recalculée à chaque lecture. Aucun rattachement aux postes des états : le moteur des liasses individuelles
(`BilanProductionService`, `CompteResultatProductionService`, `TftProductionService` — purs, `produire(pkg, …)`) n'est
appelé nulle part dans `consolidation/`. Aucun comparatif N-1, aucune collection d'états consolidés. STORY-531 a
réservé ici le figement (« un acte engageant ») et les états agrégés.

### M2 — ⛔ Aujourd'hui, le mot « consolidé » est inatteignable, et il doit le rester

`qualifier()` (STORY-531) ne rend `CONSOLIDE` que si **tous** les traitements requis sont `APPLIQUE`. Trois ne le sont
jamais — `ECRITURES_FISCALES` (STORY-685), `DIVIDENDES_INTERNES` (STORY-687), `IMPOSITIONS_SUR_DISTRIBUTIONS`
(STORY-686) — et `ETATS_ET_NOTES_CONSOLIDES` est celui de cette story. **Livrer 548 ne rend donc aucun état
« consolidé » tant que 685 à 687 ne sont pas livrées** : c'est exact, et c'est précisément l'AC-2. La règle se prouve à
l'unité (tous appliqués ⇒ « consolidé ») ; en docker, les états sont « agrégés », et le disent.

### M3 — Le texte : le modèle du Système normal, avec des lignes « distinctes »

- *« Le Bilan consolidé est présenté, selon le modèle prévu […] pour les comptes personnels, Système normal, en faisant
  toutefois distinctement apparaître : les écarts d'acquisition ; les titres mis en équivalence ; les impôts différés ;
  la part du groupe dans les résultats non distribués ; la part des intérêts minoritaires… »* (art. 89).
- *« Le compte de résultat consolidé est présenté, selon le modèle du Système normal, en faisant distinctement
  apparaître : le résultat net de l'ensemble des entités consolidées par intégration ; la quote-part des résultats nets
  des entités consolidées par mise en équivalence ; la part des associés minoritaires et la part de l'entité
  consolidante dans le résultat net ; le résultat par action »* (art. 90).
- Le D4C (ch. 8, § 2 à 4) donne en plus des **modèles propres** (bilan, CR, TFT consolidés) ; un **jeu complet**
  comprend aussi le **tableau de variation des capitaux propres** et les **notes annexes** (§ 1.2) ; *« en regard de
  chaque rubrique […] les montants de l'exercice, et pour comparaison, […] de l'exercice précédent »* (§ 1.2).

⇒ Le moteur existant produit le modèle du Système normal ; les lignes propres se publient **à part**, rattachées au poste
où le moteur range leurs comptes. Le modèle du D4C, le tableau de variation des capitaux propres et le résultat par
action ne sont pas produits : **nommés** (AC-5).

### M4 — Le texte des notes : périmètre et variation

- **Périmètre** (D4C § 6.3) : pour chaque entité, la fraction du capital détenue et le mode de consolidation, en N et
  N-1 (le tableau type : % de contrôle, méthode, % d'intérêt, N / N-1) ; et des **justifications** exigées par seuil :
  intégration globale à ≤ 40 % des droits de vote, exclusion de l'intégration globale au-delà de 50 %, mise en
  équivalence en deçà de 20 %, exclusion de la mise en équivalence au-delà de 20 %, non-consolidation (art. 96).
- **Variation** : *« un tableau de variation du périmètre de consolidation précisant toutes les modifications ayant
  affecté ce périmètre, du fait de la variation du pourcentage de contrôle des entités déjà consolidées, comme du fait
  des acquisitions et des cessions de titres »* (art. 94) ; pour une acquisition, la date d'entrée, le pourcentage de
  contrôle obtenu, *« la contribution de l'entité acquise au résultat du groupe depuis sa date d'entrée »* (§ 6.6).
- L'incomplet se signale : *« elle est tenue de signaler le caractère incomplet des comptes consolidés »* (art. 98).

### M5 — Le périmètre ne se lit qu'arrêté, à une date : la variation se DÉDUIT de deux arrêtés

`bilan-service` ne connaît du périmètre que ses **arrêtés** (read-model `perimetres_arretes`, STORY-531), lus par
`dernierALaDate(org, mère, date)` — égalité stricte sur la date. L'arrêté à la clôture N et celui à la clôture N-1 donnent
les entrées, les sorties, les changements de méthode et de pourcentage **entre les deux clôtures** ; la date d'entrée se
lit sur les liens retenus (`datesDEntree`, D-543-2). Deux angles morts, à nommer : une société **entrée et sortie** dans
l'exercice n'est dans aucun des deux arrêtés ; la **date de sortie** d'une société n'est portée par aucun arrêté (le
lien clos n'y figure plus).

### M6 — Le placement d'un compte dépend du signe du solde du GROUPE

Le moteur range un compte de classes 4/5 rattaché à un poste d'actif ET de passif **selon le signe de son solde net**
(`choisirRattachement`). Une société à 100 débiteur et une autre à 30 créditeur sur le même compte donnent 70 à l'actif
du groupe — produire l'état société par société les rangerait 100 à l'actif et 30 au passif. **La contribution d'une
entité à un poste se calcule donc au placement décidé sur la balance du groupe**, jamais en rejouant le moteur par
entité. La règle vit en DEUX copies (Bilan, et contexte du CR — gardées par un test jumeau) : une troisième est exclue.

### M7 — Chaque imputation de l'agrégat porte déjà son entité

Contributions propres (`contributions[]`) ET lignes des huit colonnes (éliminations, retraitements, reports, résultats
internes, écarts, mise en équivalence, impôts différés, minoritaires) portent un `dossierId`. La contribution d'une
entité à un compte — sa part propre plus les écritures qui la concernent — se lit donc sans aucune clé de répartition,
et leur somme sur les entités **est** le solde du compte (c'est ce que `RECOMPOSITION`, STORY-531, vérifie au compte).

### M8 — L'empreinte canonique perd les dates

`empreinteDocument` (`export/empreinte.ts`) canonise un objet par ses clés propres : un `Date` n'en a aucune, il devient
`{}`. Tout contenu scellé porte donc ses dates en chaînes `AAAA-MM-JJ` / ISO, jamais en `Date`.

### M9 — Le TFT d'un groupe dont le périmètre varie est faux sans une ligne que le moteur n'a pas

Le TFT consolidé isole *« Incidence des variations de périmètre »* et *« Incidence des variations de cours des
devises »* (D4C § 4, modèle). Le moteur individuel calcule les flux par différence de bilans N / N-1 : une filiale
entrée dans l'exercice y ferait passer ses stocks et ses créances pour des flux d'exploitation. Et la colonne N-1 du TFT
exige N-2 (la liasse individuelle ne la produit pas non plus).

### M10 — Les comptes des lignes propres sont déjà déclarés

Aux méthodes du groupe (`VueHomogeneisation.methodesGroupe`) : intérêts minoritaires (544), impôts différés actif,
passif et charge (545), titres mis en équivalence, quote-part de leur résultat (546), écarts de conversion (547). Les
comptes de l'**écart d'acquisition** ne sont portés que par chaque écriture d'écart (543, `comptesEcartAcquisition`).
La part des minoritaires, la part du groupe et la quote-part de mise en équivalence au résultat sont déjà calculées
(`resultat`, 544 AC-4).

### M11 — ⚡ La table individuelle ne rattache ni 107, ni 108, ni 28, ni 29 (relevé en préparant la vérif docker)

`syscohada-revise` ne rattache aucun compte `107x`, `108x`, `28x`, `29x` (la « convention miroir » des amortissements
n'est pas transcrite — limite antérieure du moteur, `bilan-production.service.ts`). Or les vérifications de 544 à 547
déclaraient les minoritaires sur `108900` et l'écart de conversion sur `107900` ; l'écart d'acquisition s'amortit
naturellement en `28x`. Sur ces comptes, le bilan du groupe **ne s'équilibre pas** — et la recomposition, elle, reste
satisfaite (le compte n'entre dans aucun poste, par aucun des deux chemins). Deux conséquences : le gel les refuse en
les nommant (`COMPTES_NON_RATTACHES`, D-548-9), et ils ne peuvent pas laisser `ETATS_ET_NOTES_CONSOLIDES` se dire
appliqué (D-548-5, amendée). Le remède existe : une **surcharge** de mapping (STORY-058) sur le dossier de la mère.

## Les décisions

**D-548-1 — Les états, au modèle du Système normal (art. 89, 90).** Bilan, compte de résultat (SIG compris) et TFT sont
produits par le **moteur des liasses individuelles**, appelé sur la balance du groupe (`lignes[].solde`) avec le
référentiel commun (D-531-6) et les **surcharges actives du dossier de la MÈRE** — le plan de classement retenu pour la
consolidation est celui de l'entité consolidante (art. 86 1°) ; une surcharge propre à une filiale n'y vaut pas. Les notes annexes du
Système normal (notes individuelles) ne sont pas produites : ce ne sont pas les notes consolidées (AC-5).

**D-548-2 — Les lignes propres, « distinctement » (M3, M10).** Publiées à part, chacune avec ses comptes, son montant N
et N-1, et le(s) **poste(s) hôte(s)** où le moteur range ses comptes — l'état dit où elle est comprise :

| Code | État | Source |
|---|---|---|
| `ECART_ACQUISITION` | actif | comptes de l'écart et de ses amortissements, écarts POSITIFS actifs (543) |
| `ECART_ACQUISITION_NEGATIF` | passif | compte de l'écart négatif repris en étalé (543) |
| `TITRES_MIS_EN_EQUIVALENCE` | actif | compte déclaré (546) |
| `IMPOTS_DIFFERES_ACTIF` / `_PASSIF` | actif / passif | comptes déclarés (545) |
| `ECARTS_DE_CONVERSION` | passif (capitaux propres) | compte déclaré (547) |
| `INTERETS_MINORITAIRES` | passif (capitaux propres) | compte déclaré (544) |
| `IMPOTS_DIFFERES_RESULTAT` | résultat | compte de charge déclaré (545) |
| `ECART_CONVERSION_RESULTAT` | résultat | compte déclaré (547, méthode temporelle) |
| `RESULTAT_ENTITES_INTEGREES` | résultat | résultat de l'ensemble − quote-part de mise en équivalence |
| `QUOTE_PART_MISE_EN_EQUIVALENCE` | résultat | `resultat` (544/546) |
| `RESULTAT_ENSEMBLE_CONSOLIDE` · `PART_DES_MINORITAIRES` · `PART_DU_GROUPE` | résultat | `resultat` (544, AC-4) |

Un compte non déclaré : aucune ligne comptable, montant `0`, comptes `[]` — un groupe sans minoritaires n'en a pas. Le
résultat de la balance inconnu (`resultat: null`) : les lignes de résultat valent `null`, nommées.

**D-548-3 — Le comparatif N-1, avec SON périmètre (AC-1).** L'exercice précédent de la mère (le dernier antérieur,
contigu — patron de 542) ; son **agrégat complet**, recalculé : son périmètre arrêté à SA clôture, ses sources, son
journal, ses traitements, sa qualification — publiés avec lui. Il alimente la colonne N-1 des états et des lignes
propres. Absent, il est **nommé**, jamais remplacé par des zéros : `AUCUN_EXERCICE_PRECEDENT`,
`AGREGAT_N1_INDISPONIBLE` (le refus de son agrégat, code relayé), `REFERENTIEL_DIFFERENT`, `DEVISE_DIFFERENTE`.

⚠️ **Limite nommée (relevée par les tests)** : la qualification du comparatif est celle de SON agrégat — où
`ETATS_ET_NOTES_CONSOLIDES` n'est jamais appliqué ; le comparatif se dit donc toujours « agrégé ». Le produire pour
N-1 exigerait ses propres états, notes et N-2. C'est le mot le moins vendeur (AC-2) ; à revoir quand 685 à 687 seront
livrées.

**D-548-4 — Le TFT (M9).** Produit si et seulement si le comparatif existe, que le périmètre **n'a pas varié** (note de
variation vide) et qu'**aucune société n'est convertie** (N ni N-1). Sinon `null`, motif nommé : `SANS_COMPARATIF`,
`VARIATION_DE_PERIMETRE`, `CONVERSION`. ⚡ Amendée en revue : un référentiel sans tableau des flux (le moteur rend un
squelette `NON_APPLICABLE`, jamais `null`) ⇒ `REFERENTIEL_SANS_TFT` — il ne compte plus comme produit. Sa colonne N-1 reste `null` (elle exige N-2 — nommé).

**D-548-5 — Le mot (AC-2).** Les états sont qualifiés par **la** règle de STORY-531 (`qualifier`), sur les traitements
de l'agrégat N, `ETATS_ET_NOTES_CONSOLIDES` compris — `APPLIQUE` si et seulement si bilan, CR et TFT sont produits, le
comparatif N-1 aussi, les deux notes établies et **aucun motif de non-gel** (D-548-9 : recomposition, équilibre,
comptes non rattachés, résultat de la part du groupe) — ⚡ amendée : la seule recomposition laissait « appliqué » un
bilan déséquilibré par un compte non rattaché (M11). Intitulés : « États financiers
consolidés du groupe » / « États financiers agrégés du groupe — non consolidés » ; chaque état porte le sien (« Bilan
consolidé » / « Bilan agrégé — non consolidé »…). Le comparatif porte **sa propre** qualification. ⚡ **La balance du
groupe (`GET …/agregat`) ne change pas** : elle ne produit aucun état, `ETATS_ET_NOTES_CONSOLIDES` y reste `NON_TRAITE` —
seule la route des états peut porter le mot « consolidés ». Le libellé du traitement dit désormais exactement ce qu'il
couvre.

**D-548-6 — La note de périmètre (AC-3, § 6.3).** Produite de l'arrêté N (et N-1 pour les colonnes N-1), jamais
saisie : chaque société — mère, intégrées, mises en équivalence, exclues —, sa méthode, ses % de contrôle et d'intérêt
(points de base), N et N-1. Les **justifications exigées** par le texte sont **détectées** et nommées par société
(`IG_CONTROLE_AU_PLUS_40`, `CONTROLE_SUPERIEUR_50_SANS_IG`, `ME_CONTROLE_INFERIEUR_20`,
`EXCLUE_CONTROLE_SUPERIEUR_20`, `NON_CONSOLIDEE`) ; leur texte, lui, appartient au cabinet — non produit, nommé. Raisons
sociales résolues à la lecture, dans la portée du lecteur (D-530-6), **hors** contenu scellé.

**D-548-7 — La note de variation du périmètre (AC-3, art. 94, M5).** La différence des arrêtés N-1 et N, société par
société : `ENTREE` (consolidée en N, pas en N-1 — date d'entrée des liens retenus, § 6.6), `SORTIE` (l'inverse — date
non portée, nommée), `CHANGEMENT_DE_METHODE`, `VARIATION_DE_POURCENTAGE` (contrôle ou intérêt). Une entrée intégrée cite
sa **contribution au résultat consolidé** (AC-4) — sur l'exercice ENTIER, limite nommée (STORY-543, M10). Non établie
sans exercice précédent ou sans arrêté à sa clôture (motif nommé). ⚡ Amendée en revue : un arrêté N-1 qui porte une méthode `null`
(méthodes divergentes) ⇒ non établie, `PERIMETRE_N1_EN_ANOMALIE` — elle se lisait « non consolidée » : une ENTRÉE
fausse publiée, une SORTIE tue. Une société entrée et sortie dans l'exercice :
invisible, nommé.

**D-548-8 — La recomposition (AC-4).** Pour chaque poste de détail du bilan (actif net, passif) et du compte de
résultat, et pour chaque total (actif, passif, produits, charges, résultat net) de l'exercice : le montant **publié**
(moteur, sur `lignes[].solde`) égale la **somme des contributions par entité**, recalculée par un chemin distinct —
pour chaque compte, la part propre de l'entité plus les imputations qui la concernent (M7), rangée au poste que le
moteur retient **sur la balance du groupe** (M6). La règle de placement est **exportée du moteur et partagée** — jamais
recopiée. Chaque total publie ses contributions par entité ; un écart nomme le poste. N-1 : couverte par le contrôle
`RECOMPOSITION` de son agrégat, publié avec le comparatif.

**D-548-9 — Le gel (AC-6).** `POST …/etats/versions` (`TENANT_ADMIN`) recalcule et fige. Refus `422
ETATS_NON_FIGEABLES`, tous les motifs d'un coup : recomposition des états ou de l'agrégat non satisfaite, bilan non
équilibré, comptes non rattachés, CR dont le résultat n'est pas la part du groupe. La qualification ne bloque pas : un
état agrégé se fige **sous son mot**. Collection `etats_consolides`, en ajout seul ; version = suivante de
(mère, exercice), dans la transaction ; index unique ⇒ `409 ETATS_CONSOLIDES_VERSION_CONCURRENTE` — sur un `E11000`
comme sur un conflit d'écriture (deux transactions qui se croisent, patron des hypothèses). Empreinte sha256
canonique du contenu scellé, version comprise, dates en chaînes (M8) : exercice, qualification, intitulé, référentiel,
devise, périmètres N et N-1, **sources de chaque entité** (jeu, version, empreinte, balance, version et checksum de
balance) N et N-1, écritures du journal imputées, version des méthodes du groupe, états, lignes propres, notes,
recomposition, contrôles, traitements, non-produits, **balance du groupe N et N-1**, version du moteur. Piste d'audit
`ETATS_CONSOLIDES_FIGES` **dans la transaction** (l'acte et sa trace commitent ensemble). Relecture :
`GET …/etats/versions` (sans contenu), `GET …/etats/versions/:version` — empreinte revérifiée, `500
ETATS_CONSOLIDES_ALTERES` sinon.

**D-548-10 — Ce qui n'est pas produit (AC-5).** Une liste fermée `nonProduits` — code, libellé, raison, fondement —
publiée avec les états et figée avec eux : modèles du D4C ch. 8 ; tableau de variation des capitaux propres (§ 5) ;
résultat par action (art. 90) ; part du groupe dans les réserves (art. 89) ; notes des principes et méthodes (§ 6.4),
sectorielle (§ 6.5), déclaration de conformité, autres informations (engagements, effectifs, rémunérations) ; texte des
justifications de périmètre ; TFT quand D-548-4 l'écarte, et sa colonne N-1 ; contribution depuis la date d'entrée ;
date de sortie. L'art. 98 : l'incomplet se signale.

**D-548-11 — L'homogénéité (AC-7).** Héritée de l'agrégat, sans une ligne de plus : les états appellent le même
calcul, donc refusent comme lui (`409 REFERENTIELS_HETEROGENES`, `DEVISES_HETEROGENES`, `CONVERSION_IMPOSSIBLE`) ; le
comparatif d'un autre référentiel ou d'une autre devise est nommé absent (D-548-3).

**D-548-12 — Routes et rôles.** `GET …/consolidation/exercices/:exerciceId/etats` (`TENANT_ADMIN`, `TENANT_USER`) ;
`POST …/etats/versions` (`TENANT_ADMIN`) ; `GET …/etats/versions` et `GET …/etats/versions/:version` (`TENANT_ADMIN`,
`TENANT_USER`).

**D-548-13 — Bornes.** Aucune lecture nouvelle non bornée : le comparatif est un second agrégat, borné comme le premier ;
la liste des versions est plafonnée ; un contenu scellé au-delà de la limite d'un document est refusé (`422`).

## Hors périmètre — hooks inertes documentés

- **Modèles du D4C ch. 8**, **tableau de variation des capitaux propres**, **résultat par action**, **notes 6.4 / 6.5**,
  déclaration de conformité, autres informations : nommés (D-548-10) — à ficher.
- **Incidence des variations de périmètre** et **des variations de cours** au TFT : le TFT n'est pas produit (D-548-4).
- **Résultat antérieur à l'entrée** (entrée en cours d'exercice, STORY-543 M10) : la contribution est celle de
  l'exercice entier, nommée.
- **Événement de gel** vers un autre service : aucun consommateur, aucun événement.
- **Traitements 685, 686, 687** : tant qu'ils ne sont pas livrés, les états sont « agrégés » (M2).

## Progress Tracking

- 2026-09-29 — branches `MNV-548` ouvertes sur `docs/` (depuis `main`) et `bilan-service` (depuis `dev`) **avant
  toute ligne** ; statut `ready-for-dev` → `in_progress`.
- 2026-09-29 — **cadrage** : 10 constats (11 avec M11), 13 décisions. Le mot « consolidé » reste inatteignable tant que 685 à 687 ne
  sont pas livrées (M2) ; le placement d'un compte se décide sur la balance du GROUPE (M6) ; l'empreinte canonique
  perd les dates (M8).
- 2026-09-29 — **dev** (`bilan-service` `7aea26f`, `909e53c`, `100a037`) : module pur `etats-consolides.regles.ts`
  (recomposition par entité, lignes propres, notes, mot, non-produits, gel), service, contrôleur (4 routes),
  collection `etats_consolides` en ajout seul, audit `ETATS_CONSOLIDES_FIGES` ; les règles de placement du bilan et
  du compte de résultat EXPORTÉES du moteur (comportement identique), jamais recopiées. En préparant la vérif docker :
  M11 (comptes 107/108/28/29 non rattachés) ⇒ D-548-5 amendée ; un conflit d'écriture concurrent rendu en 409.
- 2026-09-29 — **tests** écrits par 4 sous-agents `opus` sur des fichiers disjoints (≈ 800 tests : règles pures —
  balayage de 100 groupes aléatoires sur le VRAI moteur, `syscohada-revise` 2.1 et 2.2 —, service, contrôleur, schéma,
  dépôt, DTO, règles de placement exportées et leurs tests JUMEAUX sur 5 paquets réels, e2e, contrat OpenAPI) ;
  ≈ 75 mutants joués, tous tués. **Défauts trouvés et corrigés** (`fd4ca8e`) :
  - ⛔ la preuve d'impôt portait son taux en `bigint` : `GET …/etats` et le gel rendaient **500** dès qu'une preuve
    était établie (tout groupe dont la mère a un pays) — `scellable` publie un `bigint` en chaîne, comme l'agrégat ;
  - la note de périmètre lisait la mère dans l'arrêté, qui ne la porte JAMAIS (invariant du producteur) : la mère
    manquait — et le test unitaire, qui la plaçait dans l'arrêté, était vert à tort ;
  - le gel relisait les raisons sociales APRÈS le commit : une lecture échouée faisait croire à un gel manqué, et un
    nouvel essai en figeait un second — lues désormais avant la transaction ;
  - seize objets du contrat étaient publiés opaques : typés (DTO de l'agrégat réutilisés, bornes en `AAAA-MM-JJ`) ;
  - les notes annexes sur les postes n'étaient pas nommées non produites (D-548-1, AC-5) : `NOTES_SUR_LES_POSTES`.
- 2026-09-29 — **portes** : lint 0, build OK, 10 519 unitaires (seul échec : un chronomètre de 5 s de
  `resultat-bilan-marqueur` sous charge, vert seul), 2 487 e2e (35 suites), couverture 99,39 / 96,9 / 99,61 / 99,48 ;
  l'invariant des routes gardées compte le 20ᵉ contrôleur niché (`3c698c7`).
- 2026-09-29 — **vérification docker sur stack NEUVE** (`tmp/verif-docker-548/`, passe 3) : **275 OK, 1 KO** — le KO est
  une attente écrite à tort (le groupe 2 ne se fige pas : 40 % de minoritaires CALCULÉS mais non comptabilisés,
  faute de compte déclaré ⇒ `RESULTAT_DIFFERENT_DE_LA_PART_DU_GROUPE`, exactement ce que D-548-9 veut) ; attente
  corrigée, recalculée depuis les soldes. Trois écritures directes en base, dites et restaurées (altération d'une
  version figée, date de l'arrêté N-1, référentiel d'un snapshot). Prouvé : le mot AGREGE (685-687) ; 108900 non
  rattaché ⇒ bilan déséquilibré, gel refusé et nommé, puis surcharge 108900 → CG ⇒ figeable, ETATS_ET_NOTES APPLIQUE ;
  sources N et N-1 de chaque entité ; contributions au résultat recalculées (MÈRE R, SOEUR 3R, FILLE 2R − 20 %),
  SOEUR = 3 × MÈRE poste par poste ; lignes propres ; empreinte RECALCULÉE hors du service ; audit dans la
  transaction ; course de deux gels ⇒ 201 + 409, sans doublon ; comparatif indisponible relayé, colonnes N-1 null ;
  entrée de NOUVELLE au 2025-06-30, TFT `VARIATION_DE_PERIMETRE`, EXCLUE et ses deux justifications ; AC-7 ;
  cloisonnement 404 ; empreintes des liasses inchangées. ⚡ Outillage : VM Docker à 7,75 Gio — stack complète tuée
  (137) ⇒ services démarrés EN ESCALIER ; un seul exercice ouvert par dossier ⇒ 2024 clos avant d'ouvrir 2025.
  Statut `in_progress` → `review`.
- 2026-09-29 — **revue de code** (scan `opus` + lentille ponytail) : 2 constats retenus, corrigés (`40b9fd1`) —
  ⛔ un arrêté N-1 en anomalie de méthode faisait publier une ENTRÉE fausse (et figeable) : note non établie,
  `PERIMETRE_N1_EN_ANOMALIE` (D-548-7 amendée) ; un TFT `NON_APPLICABLE` comptait comme produit :
  `REFERENTIEL_SANS_TFT` (D-548-4 amendée) ; chacun prouvé par un mutant tué ; ponytail : `TraitementDto` de
  l'agrégat réutilisé, un enveloppeur intégré. Écartés : contrôle de taille en JSON plutôt qu'en BSON (au pire un 500
  sans écriture, confiance < 80), duplication de trois aides privées de `ConsolidationService` (les factoriser
  déborderait le périmètre).
- 2026-09-29 — **revue de sécurité** (`opus`) : **aucun constat** — rôles (gel `TENANT_ADMIN`), IDOR (exercice, version),
  cloisonnement de chaque lecture nouvelle (N-1, arrêtés, écarts, raisons sociales, versions), anti-énumération,
  refus relayé sans `details`, injection, intégrité du gel (contenu recalculé par le serveur, immuabilité, course,
  audit dans la transaction), bornes, sérialisation examinés.
- 2026-09-29 — **portes rejouées sur l'état final** : lint 0, 10 535 unitaires (seul échec : un chronomètre de 500 ms
  de STORY-541 sous une charge machine ≈ 50, vert seul), 2 487 e2e. **Vérification docker REJOUÉE sur l'état final**
  (`40b9fd1`), stack neuve : **277 OK, 0 KO** (passes précédentes archivées dans `tmp/verif-docker-548/passe-*`).
- 2026-09-29 — **clôture** : `prospera-bilan-service#147` rebase-mergée sur `dev` (`84b85e8`), branches supprimées ;
  statut `review` → `done`.
