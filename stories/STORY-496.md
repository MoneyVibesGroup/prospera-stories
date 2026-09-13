# STORY-496 : Le dossier n'a que deux axes — le régime dérogatoire (zone franche, code des investissements) n'a nulle part où se déclarer

Status: review

**Complexité :** high

**Épic :** EPIC-109 — Paquets fiscaux pays : gabarit, garde et procédure de sourcing
**Service :** `dossier-service` (axes) + `balance-service` (`modules/fiscal`, résolution du paquet)
**Points :** 8 · **Sprint :** S20
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27 — cas soulevé par le PO : *« un distributeur de la zone franche »*.

---

## Le fait

Le dossier porte **deux axes** : système comptable (`SN` / `SMT`) et régime fiscal (`Réel — IS` /
`Synthétique — TPU`). Il n'en porte pas de troisième.

Or le référentiel **`zone-franche-togo@1.0` existe, packagé, depuis le 2026-07-21** (STORY-121). Sa
nature est écrite dans son analyse : *« régime fiscal/douanier dérogatoire, pas un plan comptable ;
une entreprise franche tient sa compta en SYSCOHADA révisé »*. Il se distingue du droit commun
**uniquement par son paquet fiscal** : IS dégressif (0 % ans 1-5 · 8 % ans 6-10 · 10 % ans 11-20 ·
20 % dès 21), exonérations de TVA et de droits de douane, taxe sur dividendes exonérée puis à 50 %.

**Et aucun dossier ne peut le sélectionner.** Le paquet est packagé, chiffré, sourcé — et
inatteignable. Un distributeur en zone franche est donc aujourd'hui imposé **au droit commun** :
`30 %` d'IS là où il en doit `0`, plus une MFP dont il est probablement exonéré.

⛔ **C'est le seul endroit du produit où un défaut de paramétrage produit un impôt trop élevé, pas
trop bas.** Le client le découvre en payant.

## Requalification mesurée avant de brancher (2026-09-13)

| Affirmation de la fiche | Verdict | Mesure |
|---|---|---|
| Le dossier porte 2 axes datés, aucun 3ᵉ | **VRAI** | `dossier-service` `decisions_axes` (append-only), contrat `dossier.axes.decides` consommé par `balance-service` seul |
| `zone-franche-togo@1.0` « packagé » | **PARTIEL** | packagé **dans `bilan-service` seulement** (champ `paquetFiscal` embarqué) ; le manifeste fiscal de `balance-service` ne porte que `togo@2026` |
| … « chiffré, sourcé » | **PARTIEL** | 5 rubriques (`is` en paliers, `taxeDividendes`, `tva`, `fiscaliteDePorte`, `variantesRegionales`) ; rejouée contre le validateur de STORY-493 : **20 fautes** (7 rubriques obligatoires absentes, `statut` hors vocabulaire) |
| « 30 % d'IS là où il en doit 0 » | **FAUX** | le droit commun togolais packagé est **27 %** (`is.taux: 0.27`) |
| « une MFP dont il est probablement exonéré » | **PARTIEL** | le paquet zone franche n'a **aucune** rubrique MFP ; `togo@2026` liste l'exonération `AGREMENT_CODE_INVESTISSEMENTS` en `NON_CONSTATABLE` |

⚡ **Ajouter une seconde famille TG au manifeste rend 500 sur TOUS les dossiers togolais** (`refDuPays`
lève « manifeste ambigu ») : AC-3 n'est pas un ajout, c'est un changement de clé de résolution.

⚡ `IMPOT_REGIME_DEROGATOIRE: 0` est **codé en dur** au poste H de la liquidation.

### D-496-A — le régime dérogatoire est une SURCOUCHE du droit commun, pas une copie

Le paquet dérogatoire ne porte **que** ce qui déroge, chaque valeur avec sa source ; tout le reste est
**hérité explicitement** du paquet de droit commun du pays, et la résolution publie les deux références.
Une copie complète de `togo@2026` aurait fait passer le validateur en **déclarant** vérifiées pour la
zone franche des rubriques (MFP, TPU, dépôt) que personne n'a relues sous ce régime.

## Pourquoi un troisième axe, et pas un type de client

Le « type de client » (Entreprise / Microfinance / Assurance) choisit le **plan comptable**. La zone
franche n'en change pas : elle change le **paquet fiscal**, et rien d'autre. Les loger au même
endroit obligerait à créer un type « Entreprise en zone franche », puis « Microfinance en zone
franche », et ainsi de suite — une combinatoire qui se multiplierait à chaque régime dérogatoire
(code des investissements, entreprise nouvelle agréée, coopérative, ONG).

⇒ **Trois axes indépendants** : système comptable × régime fiscal × **régime dérogatoire**.

## Critères d'acceptation

- [x] AC-1 — Le dossier porte un axe `regimeDerogatoire` (`AUCUN` par défaut), **daté comme les deux
      autres** (STORY-303) : un agrément a une date d'effet et une durée, et un changement d'axe ne
      rejoue jamais un exercice clos.
- [x] AC-2 — L'axe porte les données que le barème exige : **date d'agrément** et **numéro
      d'agrément**. Sans date d'agrément, un barème dégressif par année d'exploitation est
      inapplicable — le refuser vaut mieux que de compter à partir de la création de la société.
- [x] AC-3 — La résolution du paquet fiscal tient compte des trois axes. `AUCUN` résout le paquet de
      droit commun du pays ; un régime dérogatoire résout son paquet propre.
- [x] AC-4 — Le **barème dégressif** se calcule sur l'**année d'exploitation** comptée depuis la date
      d'agrément, et l'écran (comme le contrat) publie l'année retenue. Un taux d'IS sans l'année
      qui l'a produit n'est pas vérifiable à la main.
- [x] AC-5 — La **TVA exonérée** est traitée par le paquet, pas par le moteur : aucune règle « zone
      franche » codée en dur nulle part. ⛔ Test : retirer l'exonération du paquet doit changer le
      résultat — sinon la règle est ailleurs que là où on croit.
- [x] AC-6 — Un régime dérogatoire dont le paquet n'est pas packagé pour le pays du dossier est
      **refusé à la sélection**, avec son motif — même conduite que STORY-487.

## Conséquences ailleurs

- Ouvre `zone-franche-togo@1.0`, packagé et inutilisé depuis le 2026-07-21.
- ⚠️ Le barème est marqué **« à valider/actualiser par un fiscaliste »** dans son analyse d'origine.
  Cette story ne le certifie pas ; elle le rend atteignable et le sert **avec son statut**
  (STORY-493 AC-5).
- L'assistant de création de dossier gagne un troisième axe — **FE-082**.

## Progress Tracking

**Statut : `review` → prêt au merge.** Deux dépôts, deux PR à intégrer **ensemble** (contrat d'événement) :
`dossier-service` **#26** (producteur, AC-1/2/6) et `balance-service` **#103** (consommateur + moteur,
AC-3/4/5).

### Portes de qualité — rejouées en session, pas seulement rapportées

| Dépôt | lint | build | unitaires | e2e | couverture |
|---|---|---|---|---|---|
| `dossier-service` | 0 warning | OK | **1 314** / 86 suites | **289** / 7 | 99,39 / 94,4 / 97,41 / 99,42 |
| `balance-service` | 0 warning | OK | **3 965** / 195 suites | **969** / 27 | 99,17 / 92,62 / 98,51 / 99,27 |

Seuils 65/90/90/90 jamais abaissés. Mutations : 10 côté producteur, 11 côté moteur, 6 + 8 de plus en
revue, **toutes rouges PAR ASSERTION** (les rouges par erreur de compilation ont été rejouées autrement).

### ⛔ Le bloquant que 4 900 tests verts n'ont pas vu — trouvé par la vérif docker

`agrementDe({ ...decision, regimeDerogatoire })` : **le spread d'un `HydratedDocument` Mongoose ne copie
que les propriétés PROPRES** (`$__`, `_doc`) — les chemins de schéma sont des **getters de prototype**.
`decisions_axes` portait bien les trois champs, mais la charge publiée s'arrêtait au régime (qui, lui,
était lu directement). Côté consommateur, la charge violait « agrément ssi régime ≠ AUCUN » : rejet
**total**, poison-pill, **offset commité — décision perdue et non rejouable**, pour seule trace un `WARN`.

Effet mesuré : `GET /dossiers/:id/axes` rendait `ZONE_FRANCHE` + agrément pendant que
`GET /fiscal/liquidation` servait **`AUCUN`, 27 %, 5 130 000 d'impôt au lieu de 0** — *le défaut même que
la story existe pour fermer*. **3 décisions ZF sur 3 perdues.**

⚡ Pourquoi rien ne le voyait : la fixture `decisionDoc()` est un **objet littéral casté** en
`DecisionAxesDocument`, où le spread fonctionne ; les e2e mockent la couche données. La garde ajoutée
construit un **VRAI document Mongoose** et vérifie d'abord sa propre prémisse, pour qu'un futur retour au
littéral la fasse **rougir** au lieu de la vider. Correctif `f5560b8` : lecture **champ par champ**, un
seul site fermant les deux appelants (décision et reprise de migration).

⚡ Le dépôt connaissait déjà ce piège — `balance-service/balance.calculs.ts`, fencé par `versEquilibre()` —
mais sous le **symptôme opposé** : là-bas le spread copie *trop* (`$__parent` ⇒ structure circulaire ⇒ 500
bruyant), ici *trop peu*, en silence. La leçon de STORY-147 n'avait jamais traversé jusqu'à
`dossier-service`.

### Vérification docker — rejouée sur le code corrigé (2026-09-13, stack Portly `PROSPERA/stack`)

Code en vol vérifié **dans le conteneur** (`/app/dist/…/axes.service.js` : `dateAgrement: decision.dateAgrement`,
`grep -c "\.\.\.decision"` → **0**), recompilation confirmée, `/api/v1/health` `mongodb: up` + `kafka: up`
des deux côtés. Décision **neuve** par l'API réelle (`ZF/2022/0311`, agrément 2022-07-01) :

| Point | Verdict |
|---|---|
| La charge d'`outbox_events` porte les **trois** champs ; 0 en statut ≠ `SENT` | **PROUVÉ** |
| `balance_service.axes_dossier` les reçoit ; `processed_events` 19 → 20 ; **0** rejet dans les logs (contre 3/3 avant) ; `LAG 0` | **PROUVÉ** |
| Rejeu du même `eventId` : compteurs et `updatedAt` inchangés | **PROUVÉ** |
| Liquidation : `anneeExploitation: 4`, `palierIs {de:1,a:5,taux:0}`, `tauxIs 0`, `impotDu 900 000` (= MFP) | **PROUVÉ** |
| Palier 6-10 (agrément 2016) : taux **0,08**, IS 1 520 000 — le barème n'est pas un « zéro constant » | **PROUVÉ** |
| Contre-épreuve droit commun : réponse **strictement égale** à la baseline (ensemble des champs divergents **vide**), 27 %, 5 130 000 | **PROUVÉ** |
| Écritures : append-only intact (0 document modifié après création), invariants ZF sans agrément → 0, `AUCUN` avec agrément → 0, `dateAgrement > effetADater` → 0 | **PROUVÉ** |
| Journal : les 3 champs **et** leurs 3 `…Avant` | **PROUVÉ** |
| Refus : 409 `REGIME_DEROGATOIRE_NON_SERVI` (dossier BJ), 400 `REGIME_DEROGATOIRE_REQUIS`, `DATE_AGREMENT_INVALIDE` (30 février), `DATE_AGREMENT_POSTERIEURE_EFFET`, `numeroAgrement: {}` → **400** | **PROUVÉ** |
| Aucun orphelin après refus : `decisions_axes` 0, journal 0, `outbox_events` 0 | **PROUVÉ** |

### Non prouvé, et pourquoi — dit plutôt que supposé

1. `REGIME_DEROGATOIRE_NON_PACKAGE`, `DATE_AGREMENT_REQUISE`, `PALIER_IS_INTROUVABLE`,
   `BAREME_IS_ILLISIBLE`, `REGIME_DEROGATOIRE_INCOHERENT` : **NON ATTEINTS**. Le manifeste n'a que deux
   entrées, toutes `paysSource: 'TG'`, dont une `ZONE_FRANCHE` : le seul pays servi sert le seul régime
   dérogatoire existant, et le barème est complet. Ces branches sont **structurellement inatteignables**
   par le produit tel que packagé — on ne conclut donc pas qu'elles fonctionnent.
2. **Atomicité intra-transaction** (décision + journal + outbox) : toutes les gardes refusent **avant**
   `ecrire()`, l'échec au milieu du `withTransaction` n'est pas forçable de l'extérieur.
3. **AC-5 au sens fort** (« retirer l'exonération du paquet change le résultat ») : prouvé par mutation de
   la **donnée** en test, pas en docker — l'y prouver aurait exigé de modifier un artefact de production.
4. Le chemin de **reprise de migration** partage le site corrigé, donc textuellement fermé, mais il n'est
   exposé par aucune route : **non mesuré**.

### Laissé de côté, nommé

- `bilan-service` lit toujours le `paquetFiscal` **embarqué** dans l'artefact du référentiel, pas l'axe :
  sa liasse ignore le régime dérogatoire. Story à ouvrir.
- `variantesRegionales` (10/15 ans hors Grand Lomé) : **citée, non transcrite** — sans référence propre
  elle échouerait la garde de source. Le barème **national** s'applique, et la rubrique est publiée dans
  `rubriquesDerogatoiresNonAppliquees`.
- Le **poste H** `IMPOT_REGIME_DEROGATOIRE` reste `nonCalcule` : l'impôt dérogatoire est servi par le
  poste F, libellé « droit commun ». Dette pré-existante, nommée.
- L'**échéancier** affiche encore un acompte d'IS sous zone franche, où l'IS vaut 0 les 5 premières
  années : la dépendance n'est pas exprimable (le portefeuille ne projette que deux axes).
- Le **portefeuille** ne publie pas le 3ᵉ axe : un dossier en zone franche y est indiscernable d'un
  dossier de droit commun. Hors AC.
- `motif` porte le **même défaut de conversion implicite** que `numeroAgrement` avant correctif
  (`{}` → `"[object Object]"`) : convention pré-existante partagée, hors périmètre.

## Notes

- Voir [[STORY-121]], `analyse-referentiels-sfd-zonefranche-cima-2026-07-21.md` §2, [[STORY-303]]
  (axes datés), [[STORY-493]].
